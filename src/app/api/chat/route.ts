import { NextResponse } from 'next/server';
import { chatWithAI, parseNaturalLanguageQuery } from '@/lib/aiService';

export async function POST(request: Request) {
  try {
    const { messages, data, model = 'deepseek', query } = await request.json();
    
    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: '请提供对话内容' },
        { status: 400 }
      );
    }

    // 解析自然语言查询
    let mode: 'general' | 'prediction' = 'general';
    let enhancedMessages = messages;
    
    if (query) {
      const parsed = parseNaturalLanguageQuery(query);
      mode = parsed.mode;
      
      // 如果是自然语言查询，添加意图提示
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        enhancedMessages = [
          ...messages.slice(0, -1),
          {
            role: 'user',
            content: `[查询意图: ${parsed.intent}]\n${lastMessage.content}`
          }
        ];
      }
    }

    // 调用 AI 服务
    const response = await chatWithAI(enhancedMessages, data, model, mode);

    return NextResponse.json({
      success: true,
      response,
      mode
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: '对话过程中出现错误' },
      { status: 500 }
    );
  }
}
