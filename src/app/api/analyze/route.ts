import { NextResponse } from 'next/server';
import { analyzeDataStructure, FileAnalysis } from '@/lib/dataAnalyzer';

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

export async function POST(request: Request) {
  try {
    const { files, model = 'deepseek' } = await request.json();
    
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

    // 生成分析框架建议（简化版，不调用 AI API）
    const suggestions = generateLocalSuggestions(fileAnalyses);

    return NextResponse.json({
      success: true,
      fileAnalyses,
      suggestions
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
