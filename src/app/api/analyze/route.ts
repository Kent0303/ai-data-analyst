import { NextResponse } from 'next/server';
import { analyzeDataStructure, FileAnalysis } from '@/lib/dataAnalyzer';

// 模板分析提示词
const templatePrompts: Record<string, string> = {
  'member-lifecycle': `你是一位专业的健身房会员数据分析师。请基于提供的会员数据，进行会员生命周期分析，包括：
1. 会员分层分析（新会员、活跃会员、沉默会员、流失风险会员）
2. 会员价值评估（消费金额、到店频率、课程参与度）
3. 流失风险识别（长时间未到店的会员、消费下降的会员）
4. 会员增长趋势（新增会员、续费情况）
5.  actionable 建议（如何提升会员留存、如何激活沉默会员）`,

  'revenue-dashboard': `你是一位专业的健身房财务分析师。请基于提供的营收数据，进行全面分析，包括：
1. 收入结构分析（会员卡、私教课、团课、其他收入占比）
2. 收入趋势分析（日/周/月收入变化，识别高峰和低谷）
3. 客单价分析（平均消费、消费分布、高价值客户识别）
4. 成本效益分析（如果数据包含成本信息）
5. 营收预测与建议（如何提升收入、优化定价策略）`,

  'coach-performance': `你是一位专业的健身房运营分析师。请基于提供的教练相关数据，进行绩效分析，包括：
1. 教练工作量统计（授课数量、授课时长、服务会员数）
2. 教练收入贡献（私教课收入、团课收入）
3. 会员满意度指标（如果有评价数据）
4. 教练效率分析（转化率、续课率）
5. 优化建议（如何提升教练绩效、合理分配资源）`,

  'venue-utilization': `你是一位专业的健身房运营分析师。请基于提供的场地使用数据，进行利用率分析，包括：
1. 时段分析（高峰时段、低谷时段识别）
2. 场地/设备使用率（各区域使用频率）
3. 容量分析（是否过度拥挤或资源闲置）
4. 预约情况分析（预约率、取消率、爽约率）
5. 优化建议（如何平衡负载、提高场地利用率）`,
};

function generateLocalSuggestions(fileAnalyses: FileAnalysis[]): string {
  let suggestions = '## 数据分析报告\n\n';
  
  fileAnalyses.forEach((analysis, index) => {
    suggestions += `### 文件 ${index + 1}: ${analysis.fileName}\n\n`;
    suggestions += `${analysis.summary}\n\n`;
    
    suggestions += '**字段详情：**\n';
    analysis.columns.forEach(col => {
      suggestions += `- ${col.name} (${col.type}): ${col.uniqueCount} 个唯一值`;
      if (col.nullCount > 0) {
        suggestions += `, ${col.nullCount} 个空值`;
      }
      suggestions += '\n';
    });
    
    suggestions += '\n**建议分析方向：**\n';
    const numericCols = analysis.columns.filter(c => c.type === 'number');
    const dateCols = analysis.columns.filter(c => c.type === 'date');
    const categoryCols = analysis.columns.filter(c => c.type === 'string' && c.uniqueCount <= 20);
    
    if (numericCols.length > 0) {
      suggestions += `- 数值分析：${numericCols.map(c => c.name).join('、')} 的统计分布\n`;
    }
    if (dateCols.length > 0) {
      suggestions += `- 时间趋势：${dateCols.map(c => c.name).join('、')} 的变化趋势\n`;
    }
    if (categoryCols.length > 0) {
      suggestions += `- 分类对比：${categoryCols.map(c => c.name).join('、')} 的分布情况\n`;
    }
    
    suggestions += '\n---\n\n';
  });
  
  return suggestions;
}

// 调用 AI API 进行分析
async function callAIAnalysis(
  files: any[], 
  templateId: string | undefined, 
  model: string
): Promise<string> {
  const apiKey = model === 'kimi' 
    ? process.env.KIMI_API_KEY 
    : process.env.DEEPSEEK_API_KEY;
  
  const apiUrl = model === 'kimi'
    ? 'https://api.moonshot.cn/v1/chat/completions'
    : 'https://api.deepseek.com/chat/completions';

  if (!apiKey) {
    throw new Error(`${model} API key not configured`);
  }

  // 构建提示词
  const systemPrompt = templateId && templatePrompts[templateId] 
    ? templatePrompts[templateId]
    : '你是一位专业的数据分析师，请基于提供的数据进行分析并给出见解。';

  const dataSummary = files.map(f => {
    const headers = f.headers || (f.data && f.data[0] ? Object.keys(f.data[0]) : []);
    return `文件: ${f.name}\n类型: ${f.type || '未知'}\n字段: ${headers.join(', ')}\n数据行数: ${f.data?.length || 0}\n样例数据(前3行):\n${JSON.stringify(f.data?.slice(0, 3), null, 2)}`;
  }).join('\n\n---\n\n');

  const userPrompt = `请分析以下数据：\n\n${dataSummary}\n\n请提供详细的分析报告，使用中文回答。`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model === 'kimi' ? 'moonshot-v1-8k' : 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API error: ${error}`);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || 'AI 未返回有效结果';
  } catch (error) {
    console.error('AI API call failed:', error);
    // 如果 AI 调用失败，返回本地生成的分析
    return generateLocalSuggestions(files.map((f: any) => analyzeDataStructure(f.data, f.name)));
  }
}

export async function POST(request: Request) {
  try {
    const { files, model = 'deepseek', templateId } = await request.json();
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: '请上传至少一个文件' },
        { status: 400 }
      );
    }

    // 分析每个文件的结构
    const fileAnalyses = files.map((file: any) => {
      return analyzeDataStructure(file.data, file.name);
    });

    // 如果有模板ID，调用 AI 进行深入分析
    let suggestions: string;
    if (templateId) {
      suggestions = await callAIAnalysis(files, templateId, model);
    } else {
      // 生成分析框架建议（简化版，不调用 AI API）
      suggestions = generateLocalSuggestions(fileAnalyses);
    }

    return NextResponse.json({
      success: true,
      fileAnalyses,
      suggestions,
      analysis: suggestions,
    });

  } catch (error) {
    console.error('Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : '分析过程中出现错误';
    return NextResponse.json(
      { error: errorMessage, success: false },
      { status: 500 }
    );
  }
}
