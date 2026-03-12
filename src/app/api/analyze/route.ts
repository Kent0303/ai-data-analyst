import { NextResponse } from 'next/server';
import { analyzeDataStructure, generateAnalysisSuggestions } from '@/lib/dataAnalyzer';

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

    // 生成分析框架建议
    const suggestions = await generateAnalysisSuggestions(fileAnalyses, model);

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
