import { NextResponse } from 'next/server';
import { chatWithAI, parseNaturalLanguageQuery } from '@/lib/aiService';

export async function POST(request: Request) {
  try {
    const { messages, data, model = 'deepseek', query, nlpContext } = await request.json();
    
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
        // 构建增强的查询内容
        let enhancedContent = lastMessage.content;
        
        // 添加NLP上下文信息
        if (nlpContext) {
          const { intent, entities } = nlpContext;
          let contextInfo = `\n[系统解析]\n- 意图: ${intent}`;
          
          if (entities) {
            if (entities.time) {
              contextInfo += `\n- 时间范围: ${entities.time.description}`;
            }
            if (entities.metrics && entities.metrics.length > 0) {
              contextInfo += `\n- 指标: ${entities.metrics.map((m: any) => m.synonyms[0]).join(', ')}`;
            }
            if (entities.dimensions && entities.dimensions.length > 0) {
              contextInfo += `\n- 维度: ${entities.dimensions.map((d: any) => d.description).join(', ')}`;
            }
          }
          
          enhancedContent = `${contextInfo}\n\n用户问题: ${lastMessage.content}`;
        } else {
          enhancedContent = `[查询意图: ${parsed.intent}]\n${lastMessage.content}`;
        }
        
        enhancedMessages = [
          ...messages.slice(0, -1),
          {
            role: 'user',
            content: enhancedContent
          }
        ];
      }
    }

    // 调用 AI 服务
    const response = await chatWithAI(enhancedMessages, data, model, mode);

    return NextResponse.json({
      success: true,
      response,
      mode,
      nlpContext: nlpContext || undefined
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: '对话过程中出现错误' },
      { status: 500 }
    );
  }
}
