export type IntentType = 
  | 'query_data'      // 查询数据
  | 'generate_chart'  // 生成图表
  | 'analyze_trend'   // 分析趋势
  | 'compare_data'    // 对比数据
  | 'alert_query'     // 预警查询
  | 'prediction'      // 预测分析
  | 'general'         // 一般问答
  | 'unknown';        // 未知意图

export interface Intent {
  type: IntentType;
  confidence: number;  // 置信度 0-1
  matchedKeywords: string[];
}

// 意图关键词映射
const INTENT_KEYWORDS: Record<IntentType, string[]> = {
  query_data: [
    '查询', '查', '看看', '显示', '列出', '有多少', '是多少', '多少',
    'query', 'show', 'list', 'how many', 'what is', 'count',
    '会员数', '收入', '金额', '数量', '统计'
  ],
  generate_chart: [
    '图表', '画图', '可视化', '饼图', '柱状图', '折线图', '趋势图',
    'chart', 'graph', 'plot', 'visualize', 'pie', 'bar', 'line',
    '画个', '生成图', '展示为'
  ],
  analyze_trend: [
    '趋势', '走势', '变化', '增长', '下降', '上升', '波动',
    'trend', 'growth', 'decline', 'increase', 'decrease',
    '环比', '同比', '发展', '走向'
  ],
  compare_data: [
    '对比', '比较', 'vs', 'versus', '哪个更好', '排名', '差异',
    'compare', 'comparison', 'versus', 'rank', 'difference',
    '谁更', '哪家', '哪个教练', '哪个门店'
  ],
  alert_query: [
    '预警', '告警', '异常', '风险', '问题', '警告',
    'alert', 'warning', 'risk', 'anomaly', 'issue',
    '需要注意', '有问题', '危险', '超标'
  ],
  prediction: [
    '预测', 'forecast', '未来', '预计', '估计', '会多少',
    'predict', 'projection', 'estimate', 'will be',
    '下个月', '明年', '下周', '趋势预测'
  ],
  general: [
    '是什么', '什么是', '介绍一下', '说明', '解释',
    'what is', 'explain', 'describe', 'how to',
    '帮助', 'help', '怎么做', '如何'
  ],
  unknown: []
};

// 意图优先级（用于解决冲突）
const INTENT_PRIORITY: Record<IntentType, number> = {
  alert_query: 10,    // 最高优先级
  prediction: 9,
  generate_chart: 8,
  compare_data: 7,
  analyze_trend: 6,
  query_data: 5,
  general: 1,
  unknown: 0
};

/**
 * 意图识别器
 * 基于关键词匹配的轻量级意图识别
 */
export class IntentRecognizer {
  private keywords: Record<IntentType, string[]>;

  constructor() {
    this.keywords = INTENT_KEYWORDS;
  }

  /**
   * 识别用户输入的意图
   */
  recognize(input: string): Intent {
    const normalizedInput = input.toLowerCase().trim();
    
    const scores: Record<IntentType, { score: number; matched: string[] }> = {
      query_data: { score: 0, matched: [] },
      generate_chart: { score: 0, matched: [] },
      analyze_trend: { score: 0, matched: [] },
      compare_data: { score: 0, matched: [] },
      alert_query: { score: 0, matched: [] },
      prediction: { score: 0, matched: [] },
      general: { score: 0, matched: [] },
      unknown: { score: 0, matched: [] }
    };

    // 计算每个意图的匹配分数
    for (const [intent, keywords] of Object.entries(this.keywords)) {
      for (const keyword of keywords) {
        if (normalizedInput.includes(keyword.toLowerCase())) {
          scores[intent as IntentType].score += keyword.length >= 4 ? 2 : 1;
          scores[intent as IntentType].matched.push(keyword);
        }
      }
    }

    // 特殊规则：检测疑问句模式
    if (/\?$|？$|多少|几|什么|哪个|谁/.test(normalizedInput)) {
      scores.query_data.score += 0.5;
    }

    // 特殊规则：检测比较模式
    if (/和|与|跟.*比|vs|versus|对比|比较/.test(normalizedInput)) {
      scores.compare_data.score += 2;
    }

    // 特殊规则：检测时间序列词汇
    if (/趋势|走势|变化|增长|下降|环比|同比/.test(normalizedInput)) {
      scores.analyze_trend.score += 2;
    }

    // 找到最高分的意图
    let bestIntent: IntentType = 'unknown';
    let maxScore = 0;
    let bestMatched: string[] = [];

    for (const [intent, data] of Object.entries(scores)) {
      if (intent === 'unknown') continue;
      
      const priority = INTENT_PRIORITY[intent as IntentType];
      const weightedScore = data.score * (1 + priority * 0.1);
      
      if (weightedScore > maxScore) {
        maxScore = weightedScore;
        bestIntent = intent as IntentType;
        bestMatched = data.matched;
      }
    }

    // 计算置信度
    const confidence = Math.min(maxScore / 3, 1);

    // 如果没有匹配到任何关键词，默认为 general
    if (maxScore === 0) {
      bestIntent = 'general';
    }

    return {
      type: bestIntent,
      confidence,
      matchedKeywords: [...new Set(bestMatched)]
    };
  }

  /**
   * 批量识别多个输入
   */
  recognizeBatch(inputs: string[]): Intent[] {
    return inputs.map(input => this.recognize(input));
  }

  /**
   * 添加自定义关键词
   */
  addKeywords(intent: IntentType, keywords: string[]): void {
    this.keywords[intent] = [...new Set([...this.keywords[intent], ...keywords])];
  }
}

// 单例实例
let recognizerInstance: IntentRecognizer | null = null;

export function getIntentRecognizer(): IntentRecognizer {
  if (!recognizerInstance) {
    recognizerInstance = new IntentRecognizer();
  }
  return recognizerInstance;
}

// 便捷函数
export function recognizeIntent(input: string): Intent {
  return getIntentRecognizer().recognize(input);
}
