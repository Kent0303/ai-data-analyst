interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// 健身房经营管理专家系统提示词
const GYM_MANAGEMENT_SYSTEM_PROMPT = `你是专业的健身房经营管理 AI 顾问，拥有丰富的健身行业数据分析经验。

## 核心能力
1. **会员管理分析**
   - 会员增长趋势分析（新会员获取、流失率、留存率）
   - 会员生命周期价值（LTV）计算
   - 会员活跃度分析（到访频率、活跃时段）
   - 会员分层（新会员、活跃会员、沉睡会员、流失风险会员）

2. **教练管理分析**
   - 教练业绩分析（私教课销售、上课数量、续课率）
   - 教练产能评估（课时利用率、会员满意度）
   - 教练排课优化建议
   - 教练收入结构分析

3. **会员卡销售分析**
   - 卡种销售结构（月卡/季卡/年卡/次卡占比）
   - 销售转化率分析
   - 卡种定价策略建议
   - 促销活动效果评估

4. **业务运营分析**
   - 团课运营（课程热度、满座率、教练负荷）
   - 私教业务（成单率、客单价、续费率）
   - 自主训练（场地利用率、高峰时段）
   - 收入结构分析（卡费/私教/团课/其他）

5. **财务与经营指标**
   - 月度/季度营收趋势
   - 成本结构分析（房租/人力/水电/营销）
   - 盈亏平衡点计算
   - ROI 分析

## 分析框架
当分析健身房数据时，请按以下框架输出：

### 1. 数据概览
- 数据时间范围
- 关键指标汇总（会员数、总收入、总课时等）

### 2. 核心洞察
- 发现的关键问题或机会
- 数据中的异常点
- 与行业基准的对比

### 3. 详细分析
按业务模块分别分析，每个模块包含：
- 现状描述
- 数据支撑
- 问题诊断
- 改进建议

### 4. 预测与预警
- 未来趋势预测
- 风险预警
- 机会提示

### 5. 行动建议
- 短期可执行措施（1-2周）
- 中期优化方案（1-3个月）
- 长期战略规划

## 输出格式
- 使用 Markdown 格式
- 关键数据用 **粗体** 标注
- 重要结论用 > 引用块突出
- 建议按优先级排序

## 自然语言查询支持
用户可以自然语言提问，例如：
- "上个月哪个教练业绩最好？"
- "预测下个月的会员流失率"
- "团课和私教哪个更赚钱？"
- "给我一些提升续卡率的建议"

请根据用户问题，提供精准、可操作的分析和建议。`;

// 预测分析专用提示词
const PREDICTION_SYSTEM_PROMPT = `你是健身房经营预测分析专家，擅长基于历史数据进行趋势预测。

## 预测能力
1. **会员预测**
   - 新会员获取预测（基于历史增长趋势、季节性、营销活动）
   - 会员流失预测（识别高风险流失会员）
   - 会员活跃度预测

2. **收入预测**
   - 月度/季度营收预测
   - 不同业务线收入预测（卡费/私教/团课）
   - 现金流预测

3. **业务预测**
   - 私教课预约量预测
   - 团课满座率预测
   - 场地利用率预测

4. **成本预测**
   - 人力成本预测
   - 营销投入产出预测

## 预测方法
- 时间序列分析（趋势+季节性）
- 回归分析
- 移动平均
- 增长率推算

## 输出要求
每次预测必须包含：
1. **预测假设** - 基于什么前提条件
2. **预测结果** - 具体数字和置信区间
3. **不确定性分析** - 风险因素
4. **建议** - 基于预测的行动建议

使用中文回答，数据要具体、可验证。`;

export async function chatWithAI(
  messages: ChatMessage[],
  data: any,
  model: string,
  mode: 'general' | 'prediction' = 'general'
): Promise<string> {
  const systemPrompt = mode === 'prediction' 
    ? PREDICTION_SYSTEM_PROMPT 
    : GYM_MANAGEMENT_SYSTEM_PROMPT;

  const dataContext = data ? `\n\n当前分析的数据：\n${JSON.stringify(data, null, 2)}` : '';

  const apiKey = model === 'kimi' 
    ? process.env.KIMI_API_KEY 
    : process.env.DEEPSEEK_API_KEY;
  
  const apiUrl = model === 'kimi'
    ? 'https://api.moonshot.cn/v1/chat/completions'
    : 'https://api.deepseek.com/v1/chat/completions';
  
  const modelName = model === 'kimi' 
    ? 'moonshot-v1-8k' 
    : 'deepseek-chat';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt + dataContext },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${error}`);
    }

    const result = await response.json();
    return result.choices[0].message.content;
  } catch (error) {
    console.error('AI chat error:', error);
    return '抱歉，AI 服务暂时不可用，请稍后重试。';
  }
}

// 自然语言查询解析
export function parseNaturalLanguageQuery(query: string): {
  intent: string;
  parameters: Record<string, any>;
  mode: 'general' | 'prediction';
} {
  const lowerQuery = query.toLowerCase();
  
  // 检测预测意图
  const predictionKeywords = ['预测', 'forecast', 'predict', '未来', '下个月', '明年', '趋势'];
  const isPrediction = predictionKeywords.some(kw => lowerQuery.includes(kw));
  
  // 检测查询意图
  let intent = 'general_analysis';
  
  if (lowerQuery.includes('教练') || lowerQuery.includes('私教')) {
    intent = 'coach_analysis';
  } else if (lowerQuery.includes('会员')) {
    intent = 'member_analysis';
  } else if (lowerQuery.includes('销售') || lowerQuery.includes('收入') || lowerQuery.includes('业绩')) {
    intent = 'sales_analysis';
  } else if (lowerQuery.includes('团课') || lowerQuery.includes('课程')) {
    intent = 'class_analysis';
  } else if (lowerQuery.includes('卡') || lowerQuery.includes('会员卡')) {
    intent = 'membership_analysis';
  }
  
  // 提取时间参数
  const timeParams: string[] = [];
  if (lowerQuery.includes('今天') || lowerQuery.includes('今日')) timeParams.push('today');
  if (lowerQuery.includes('昨天')) timeParams.push('yesterday');
  if (lowerQuery.includes('本周') || lowerQuery.includes('这周')) timeParams.push('this_week');
  if (lowerQuery.includes('上周')) timeParams.push('last_week');
  if (lowerQuery.includes('本月') || lowerQuery.includes('这个月')) timeParams.push('this_month');
  if (lowerQuery.includes('上月') || lowerQuery.includes('上个月')) timeParams.push('last_month');
  if (lowerQuery.includes('今年')) timeParams.push('this_year');
  if (lowerQuery.includes('去年')) timeParams.push('last_year');
  
  return {
    intent,
    parameters: {
      timeRange: timeParams,
      originalQuery: query
    },
    mode: isPrediction ? 'prediction' : 'general'
  };
}

// 生成智能洞察
export function generateSmartInsights(data: any[][]): string[] {
  if (!data || data.length < 2) return [];
  
  const headers = data[0] as string[];
  const rows = data.slice(1) as any[][];
  const insights: string[] = [];
  
  // 检测数据类型
  const hasRevenue = headers.some(h => h.includes('金额') || h.includes('收入') || h.includes('价格'));
  const hasMember = headers.some(h => h.includes('会员') || h.includes('姓名'));
  const hasCoach = headers.some(h => h.includes('教练'));
  const hasDate = headers.some(h => h.includes('日期') || h.includes('时间'));
  
  // 基础统计
  insights.push(`数据包含 **${rows.length}** 条记录，**${headers.length}** 个字段`);
  
  if (hasDate) {
    const dateCol = headers.findIndex(h => h.includes('日期') || h.includes('时间'));
    const dates = rows.map(r => r[dateCol]).filter(Boolean);
    if (dates.length > 0) {
      insights.push(`数据时间跨度：${dates[0]} 至 ${dates[dates.length - 1]}`);
    }
  }
  
  return insights;
}
