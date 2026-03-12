import * as XLSX from 'xlsx';

export interface ColumnInfo {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'unknown';
  sampleValues: any[];
  nullCount: number;
  uniqueCount: number;
}

export interface FileAnalysis {
  fileName: string;
  rowCount: number;
  columnCount: number;
  columns: ColumnInfo[];
  summary: string;
}

export function analyzeDataStructure(data: any[][], fileName: string): FileAnalysis {
  if (!data || data.length < 2) {
    return {
      fileName,
      rowCount: 0,
      columnCount: 0,
      columns: [],
      summary: '文件数据为空或格式不正确'
    };
  }

  const headers = data[0];
  const rows = data.slice(1);
  
  const columns: ColumnInfo[] = headers.map((header, index) => {
    const values = rows.map(row => row[index]).filter(v => v !== undefined && v !== null && v !== '');
    const nullCount = rows.length - values.length;
    const uniqueCount = new Set(values).size;
    
    // 检测数据类型
    const type = detectColumnType(values);
    
    return {
      name: String(header || `Column_${index + 1}`),
      type,
      sampleValues: values.slice(0, 5),
      nullCount,
      uniqueCount
    };
  });

  const summary = generateSummary(columns, rows.length);

  return {
    fileName,
    rowCount: rows.length,
    columnCount: headers.length,
    columns,
    summary
  };
}

function detectColumnType(values: any[]): ColumnInfo['type'] {
  if (values.length === 0) return 'unknown';
  
  const sample = values.slice(0, 20);
  
  // 检测日期
  const datePattern = /\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}/;
  const dateCount = sample.filter(v => datePattern.test(String(v))).length;
  if (dateCount > sample.length * 0.5) return 'date';
  
  // 检测数字
  const numCount = sample.filter(v => !isNaN(Number(v)) && v !== '').length;
  if (numCount > sample.length * 0.7) return 'number';
  
  // 检测布尔值
  const boolValues = ['true', 'false', '是', '否', 'yes', 'no', '1', '0'];
  const boolCount = sample.filter(v => boolValues.includes(String(v).toLowerCase())).length;
  if (boolCount > sample.length * 0.7) return 'boolean';
  
  return 'string';
}

function generateSummary(columns: ColumnInfo[], rowCount: number): string {
  const numericCols = columns.filter(c => c.type === 'number');
  const dateCols = columns.filter(c => c.type === 'date');
  const textCols = columns.filter(c => c.type === 'string');
  
  let summary = `该文件包含 ${rowCount} 行数据，`;
  summary += `${columns.length} 个字段。`;
  
  if (numericCols.length > 0) {
    summary += `数值字段：${numericCols.map(c => c.name).join('、')}。`;
  }
  
  if (dateCols.length > 0) {
    summary += `时间字段：${dateCols.map(c => c.name).join('、')}。`;
  }
  
  if (textCols.length > 0) {
    summary += `文本字段：${textCols.slice(0, 3).map(c => c.name).join('、')}${textCols.length > 3 ? '等' : ''}。`;
  }
  
  return summary;
}

export async function generateAnalysisSuggestions(
  fileAnalyses: FileAnalysis[],
  model: string
): Promise<string> {
  const prompt = `作为数据分析专家，请根据以下文件信息，给出分析框架和建议：

${fileAnalyses.map((fa, i) => `
文件 ${i + 1}: ${fa.fileName}
- ${fa.summary}
- 字段详情：
${fa.columns.map(c => `  • ${c.name} (${c.type}): ${c.uniqueCount} 个唯一值, ${c.nullCount} 个空值`).join('\n')}
`).join('\n')}

请提供：
1. 数据质量评估（完整性、一致性等）
2. 建议的分析维度（如时间趋势、分类对比、关联分析等）
3. 可能的业务洞察方向
4. 推荐的分析步骤

用中文回答，结构清晰。`;

  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY not found in environment variables');
      return 'API Key 未配置，请联系管理员。';
    }

    console.log('Calling DeepSeek API...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API request failed:', response.status, errorText);
      return `API 请求失败 (${response.status}): ${errorText}`;
    }

    const data = await response.json();
    console.log('DeepSeek API response received');
    return data.choices[0].message.content;
  } catch (error) {
    console.error('AI suggestion error:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return 'AI 分析超时，请稍后重试或简化数据后再次尝试。';
    }
    return `AI 分析建议生成失败: ${error instanceof Error ? error.message : '未知错误'}`;
  }
}
