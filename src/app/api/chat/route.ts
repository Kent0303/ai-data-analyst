import { NextResponse } from 'next/server';
import { chatWithAI } from '@/lib/aiService';

export async function POST(request: Request) {
  try {
    const { messages, data, model = 'deepseek' } = await request.json();
    
    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: '请提供对话内容' },
        { status: 400 }
      );
    }

    // 调用 AI 服务
    const response = await chatWithAI(messages, data, model);

    return NextResponse.json({
      success: true,
      response
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: '对话过程中出现错误' },
      { status: 500 }
    );
  }
}
