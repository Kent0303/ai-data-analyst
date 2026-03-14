import { IntentType } from './intentRecognizer';
import { ExtractedEntities } from './entityExtractor';

export interface ResponseTemplate {
  intent: IntentType;
  templates: string[];
}

export interface GeneratedResponse {
  text: string;
  suggestions: string[];
  followUpActions: string[];
}

// 回复模板库
const RESPONSE_TEMPLATES: Record<IntentType, string[]> = {
  query_data: [
    '{time}的{metric}是{value}。',
    '{time}共有{value}{metric}。',
    '根据数据，{time}的{metric}为{value}。',
    '{metric}在{time}达到{value}。'
  ],
  generate_chart: [
    '已为您生成{chartType}，展示了{description}。',
    '{chartType}已生成，可以清晰看到{description}。',
    '这是{description}的{chartType}。'
  ],
  analyze_trend: [
    '{metric}呈现{trend}趋势，{insight}。',
    '从{time}的数据来看，{metric}{trend}，{insight}。',
    '分析发现，{metric}在{time}{trend}。{insight}'
  ],
  compare_data: [
    '{entityA}的{metric}为{valueA}，{entityB}为{valueB}。{conclusion}。',
    '对比来看，{entityA}（{valueA}）{comparison}{entityB}（{valueB}）。',
    '{entityA}和{entityB}的{metric}对比：{valueA} vs {valueB}。{conclusion}'
  ],
  alert_query: [
    '检测到{count}个{alertType}：{details}。建议{recommendation}。',
    '发现{alertType}问题：{details}。请及时关注。',
    '预警：{details}。{recommendation}'
  ],
  prediction: [
    '预测{time}的{metric}约为{value}。{confidence}',
    '根据历史数据，{time}预计{metric}达到{value}。',
    '预计{time}{metric}为{value}，{confidence}'
  ],
  general: [
    '{answer}',
    '关于您的问题：{answer}',
    '{answer}。如需了解更多，请告诉我。'
  ],
  unknown: [
    '抱歉，我不太理解您的问题。您可以尝试问：',
    '这个问题我还不太清楚。您可以试试：',
    '换个方式问我吧，例如：'
  ]
};

// 建议回复
const FOLLOW_UP_SUGGESTIONS: Record<IntentType, string[]> = {
  query_data: [
    '查看趋势变化',
    '对比其他时间段',
    '生成图表看看',
    '分析原因'
  ],
  generate_chart: [
    '换个图表类型',
    '查看详细数据',
    '对比其他维度',
    '导出图表'
  ],
  analyze_trend: [
    '预测未来趋势',
    '查看相关指标',
    '找出影响因素',
    '设置预警'
  ],
  compare_data: [
    '查看更多对比',
    '分析差异原因',
    '生成对比图表',
    '查看历史对比'
  ],
  alert_query: [
    '查看详细预警',
    '设置新预警',
    '分析预警原因',
    '获取解决方案'
  ],
  prediction: [
    '查看预测依据',
    '调整预测参数',
    '对比实际数据',
    '导出预测报告'
  ],
  general: [
    '继续提问',
    '查看数据概览',
    '生成分析报告',
    '探索其他功能'
  ],
  unknown: [
    '查询会员数据',
    '分析销售趋势',
    '查看教练业绩',
    '生成图表'
  ]
};

// 常用查询示例
const QUERY_EXAMPLES = [
  '本月新增多少会员？',
  '哪个教练业绩最好？',
  '最近30天收入趋势如何？',
  '显示会员增长图表',
  '对比本月和上月的私教课时',
  '有哪些经营风险需要关注？',
  '预测下月新会员数量',
  '按门店查看收入分布'
];

/**
 * 回复生成器
 * 根据意图和实体生成自然语言回复
 */
export class ResponseGenerator {
  /**
   * 生成回复
   */
  generate(
    intent: IntentType,
    entities: ExtractedEntities,
    data?: any,
    options?: {
      concise?: boolean;
      includeSuggestions?: boolean;
    }
  ): GeneratedResponse {
    const { concise = true, includeSuggestions = true } = options || {};

    let text = '';
    let suggestions: string[] = [];
    let followUpActions: string[] = [];

    switch (intent) {
      case 'query_data':
        text = this.generateQueryResponse(entities, data);
        break;
      case 'generate_chart':
        text = this.generateChartResponse(entities, data);
        break;
      case 'analyze_trend':
        text = this.generateTrendResponse(entities, data);
        break;
      case 'compare_data':
        text = this.generateComparisonResponse(entities, data);
        break;
      case 'alert_query':
        text = this.generateAlertResponse(entities, data);
        break;
      case 'prediction':
        text = this.generatePredictionResponse(entities, data);
        break;
      case 'general':
        text = this.generateGeneralResponse(entities, data);
        break;
      case 'unknown':
      default:
        text = this.generateUnknownResponse();
        suggestions = QUERY_EXAMPLES.slice(0, 4);
        break;
    }

    if (includeSuggestions && intent !== 'unknown') {
      followUpActions = this.getFollowUpSuggestions(intent);
    }

    // 确保回复简洁（3句话以内）
    if (concise) {
      text = this.makeConcise(text);
    }

    return {
      text,
      suggestions,
      followUpActions
    };
  }

  /**
   * 生成数据查询回复
   */
  private generateQueryResponse(entities: ExtractedEntities, data?: any): string {
    const time = entities.time?.description || '当前';
    const metric = entities.metrics[0]?.synonyms[0] || '数据';
    const value = data?.value || data?.count || '暂无';

    const templates = RESPONSE_TEMPLATES.query_data;
    const template = templates[Math.floor(Math.random() * templates.length)];

    return template
      .replace('{time}', time)
      .replace('{metric}', metric)
      .replace('{value}', String(value));
  }

  /**
   * 生成图表回复
   */
  private generateChartResponse(entities: ExtractedEntities, data?: any): string {
    const chartType = data?.chartType || '图表';
    const description = entities.metrics.map(m => m.synonyms[0]).join('、') || '数据';

    const templates = RESPONSE_TEMPLATES.generate_chart;
    const template = templates[Math.floor(Math.random() * templates.length)];

    return template
      .replace('{chartType}', chartType)
      .replace('{description}', description);
  }

  /**
   * 生成趋势分析回复
   */
  private generateTrendResponse(entities: ExtractedEntities, data?: any): string {
    const time = entities.time?.description || '近期';
    const metric = entities.metrics[0]?.synonyms[0] || '指标';
    const trend = data?.trend === 'up' ? '上升' : data?.trend === 'down' ? '下降' : '平稳';
    const insight = data?.insight || '建议持续关注';

    const templates = RESPONSE_TEMPLATES.analyze_trend;
    const template = templates[Math.floor(Math.random() * templates.length)];

    return template
      .replace('{time}', time)
      .replace('{metric}', metric)
      .replace('{trend}', trend)
      .replace('{insight}', insight);
  }

  /**
   * 生成对比分析回复
   */
  private generateComparisonResponse(entities: ExtractedEntities, data?: any): string {
    const metric = entities.metrics[0]?.synonyms[0] || '指标';
    const entityA = data?.entityA || 'A';
    const entityB = data?.entityB || 'B';
    const valueA = data?.valueA || '0';
    const valueB = data?.valueB || '0';
    const comparison = parseFloat(valueA) > parseFloat(valueB) ? '高于' : '低于';
    const conclusion = data?.conclusion || `两者${comparison}${Math.abs(parseFloat(valueA) - parseFloat(valueB))}`;

    const templates = RESPONSE_TEMPLATES.compare_data;
    const template = templates[Math.floor(Math.random() * templates.length)];

    return template
      .replace('{metric}', metric)
      .replace('{entityA}', entityA)
      .replace('{entityB}', entityB)
      .replace('{valueA}', String(valueA))
      .replace('{valueB}', String(valueB))
      .replace('{comparison}', comparison)
      .replace('{conclusion}', conclusion);
  }

  /**
   * 生成预警回复
   */
  private generateAlertResponse(entities: ExtractedEntities, data?: any): string {
    const count = data?.count || 0;
    const alertType = data?.type || '异常';
    const details = data?.details || '暂无详细信息';
    const recommendation = data?.recommendation || '及时关注处理';

    const templates = RESPONSE_TEMPLATES.alert_query;
    const template = templates[Math.floor(Math.random() * templates.length)];

    return template
      .replace('{count}', String(count))
      .replace('{alertType}', alertType)
      .replace('{details}', details)
      .replace('{recommendation}', recommendation);
  }

  /**
   * 生成预测回复
   */
  private generatePredictionResponse(entities: ExtractedEntities, data?: any): string {
    const time = entities.time?.description || '未来';
    const metric = entities.metrics[0]?.synonyms[0] || '指标';
    const value = data?.value || '未知';
    const confidence = data?.confidence 
      ? `置信度${Math.round(data.confidence * 100)}%` 
      : '基于历史数据推算';

    const templates = RESPONSE_TEMPLATES.prediction;
    const template = templates[Math.floor(Math.random() * templates.length)];

    return template
      .replace('{time}', time)
      .replace('{metric}', metric)
      .replace('{value}', String(value))
      .replace('{confidence}', confidence);
  }

  /**
   * 生成一般回复
   */
  private generateGeneralResponse(entities: ExtractedEntities, data?: any): string {
    const answer = data?.answer || '已收到您的问题';

    const templates = RESPONSE_TEMPLATES.general;
    const template = templates[Math.floor(Math.random() * templates.length)];

    return template.replace('{answer}', answer);
  }

  /**
   * 生成未知意图回复
   */
  private generateUnknownResponse(): string {
    const templates = RESPONSE_TEMPLATES.unknown;
    const template = templates[Math.floor(Math.random() * templates.length)];
    return template;
  }

  /**
   * 获取后续建议
   */
  private getFollowUpSuggestions(intent: IntentType): string[] {
    const suggestions = FOLLOW_UP_SUGGESTIONS[intent] || FOLLOW_UP_SUGGESTIONS.general;
    // 随机选择3个
    return this.shuffleArray(suggestions).slice(0, 3);
  }

  /**
   * 使回复简洁（3句话以内）
   */
  private makeConcise(text: string): string {
    const sentences = text.split(/[。！？.!?]/).filter(s => s.trim());
    if (sentences.length <= 3) return text;
    
    return sentences.slice(0, 3).join('。') + '。';
  }

  /**
   * 数组随机排序
   */
  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  /**
   * 生成欢迎消息
   */
  generateWelcomeMessage(): string {
    return '您好！我是您的数据分析助手。您可以问我关于会员、收入、教练业绩等方面的问题，我会尽力为您解答。';
  }

  /**
   * 生成帮助消息
   */
  generateHelpMessage(): string {
    return `我可以帮您：
1. 查询数据：如"本月新增多少会员"
2. 生成图表：如"显示收入趋势图"
3. 分析趋势：如"最近30天会员增长趋势"
4. 对比数据：如"对比两个教练的业绩"
5. 预警查询：如"有哪些经营风险"
6. 预测分析：如"预测下月收入"`;
  }

  /**
   * 生成错误回复
   */
  generateErrorMessage(error?: string): string {
    if (error?.includes('timeout')) {
      return '查询超时，请稍后再试或简化您的问题。';
    }
    if (error?.includes('not found')) {
      return '未找到相关数据，请检查查询条件。';
    }
    return '抱歉，处理您的请求时出现问题，请重试。';
  }
}

// 单例实例
let generatorInstance: ResponseGenerator | null = null;

export function getResponseGenerator(): ResponseGenerator {
  if (!generatorInstance) {
    generatorInstance = new ResponseGenerator();
  }
  return generatorInstance;
}

// 便捷函数
export function generateResponse(
  intent: IntentType,
  entities: ExtractedEntities,
  data?: any,
  options?: { concise?: boolean; includeSuggestions?: boolean }
): GeneratedResponse {
  return getResponseGenerator().generate(intent, entities, data, options);
}
