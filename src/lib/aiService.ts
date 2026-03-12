interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function chatWithAI(
  messages: ChatMessage[],
  data: any,
  model: string
): Promise<string> {
  const systemPrompt = `你是专业的数据分析助手，擅长帮助用户分析 Excel 数据。

当前数据信息：
${JSON.stringify(data, null, 2)}

请根据用户的问题，提供：
1. 清晰的数据分析思路
2. 具体的分析步骤
3. 可能的可视化建议
4. 业务洞察和建议

如果用户要求生成图表或计算，请提供具体的 Python/pandas 代码。
用中文回答，保持专业但友好的语气。`;

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
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 2000
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
