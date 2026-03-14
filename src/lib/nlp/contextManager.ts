import { ExtractedEntities } from './entityExtractor';
import { IntentType } from './intentRecognizer';

export interface ConversationContext {
  sessionId: string;
  messages: ContextMessage[];
  lastEntities: ExtractedEntities | null;
  lastIntent: IntentType | null;
  lastQuery: string;
  lastResults: any;
  currentTopic: string | null;
  mentionedEntities: {
    coaches: string[];
    stores: string[];
    timeRanges: string[];
    metrics: string[];
  };
  turnCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContextMessage {
  role: 'user' | 'assistant';
  content: string;
  intent?: IntentType;
  entities?: ExtractedEntities;
  timestamp: Date;
}

// 指代词映射
const PRONOUNS = {
  // 时间指代
  time: ['那时', '当时', '那个时候', '之前', '之前说的', '刚才', '上次'],
  // 实体指代
  entity: ['那个', '这个', '该', '上述', '前面提到的'],
  // 教练指代
  coach: ['那个教练', '这位教练', '他', '她', '该教练'],
  // 数据指代
  data: ['那个数据', '这些数据', '这个数', '结果', '刚才的数据'],
  // 上一步
  previous: ['还有呢', '然后呢', '接着', '继续说', '还有吗', '还有其他的吗']
};

/**
 * 上下文管理器
 * 管理多轮对话的上下文状态
 */
export class ContextManager {
  private contexts: Map<string, ConversationContext> = new Map();
  private maxContextAge: number; // 毫秒
  private maxMessages: number;

  constructor(options: { maxContextAge?: number; maxMessages?: number } = {}) {
    this.maxContextAge = options.maxContextAge || 30 * 60 * 1000; // 默认30分钟
    this.maxMessages = options.maxMessages || 20;
  }

  /**
   * 获取或创建会话上下文
   */
  getContext(sessionId: string): ConversationContext {
    let context = this.contexts.get(sessionId);
    
    if (!context) {
      context = this.createContext(sessionId);
    } else {
      // 检查上下文是否过期
      const now = new Date();
      if (now.getTime() - context.updatedAt.getTime() > this.maxContextAge) {
        context = this.createContext(sessionId);
      }
    }

    return context;
  }

  /**
   * 创建新上下文
   */
  private createContext(sessionId: string): ConversationContext {
    const context: ConversationContext = {
      sessionId,
      messages: [],
      lastEntities: null,
      lastIntent: null,
      lastQuery: '',
      lastResults: null,
      currentTopic: null,
      mentionedEntities: {
        coaches: [],
        stores: [],
        timeRanges: [],
        metrics: []
      },
      turnCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.contexts.set(sessionId, context);
    return context;
  }

  /**
   * 添加用户消息到上下文
   */
  addUserMessage(
    sessionId: string, 
    content: string, 
    intent?: IntentType, 
    entities?: ExtractedEntities
  ): void {
    const context = this.getContext(sessionId);
    
    context.messages.push({
      role: 'user',
      content,
      intent,
      entities,
      timestamp: new Date()
    });

    // 更新上下文状态
    context.lastQuery = content;
    if (intent) context.lastIntent = intent;
    if (entities) {
      context.lastEntities = entities;
      this.updateMentionedEntities(context, entities);
    }

    context.turnCount++;
    context.updatedAt = new Date();

    // 限制消息数量
    if (context.messages.length > this.maxMessages) {
      context.messages = context.messages.slice(-this.maxMessages);
    }
  }

  /**
   * 添加助手回复到上下文
   */
  addAssistantMessage(sessionId: string, content: string, results?: any): void {
    const context = this.getContext(sessionId);
    
    context.messages.push({
      role: 'assistant',
      content,
      timestamp: new Date()
    });

    if (results) {
      context.lastResults = results;
    }

    context.updatedAt = new Date();

    // 限制消息数量
    if (context.messages.length > this.maxMessages) {
      context.messages = context.messages.slice(-this.maxMessages);
    }
  }

  /**
   * 更新提及的实体
   */
  private updateMentionedEntities(context: ConversationContext, entities: ExtractedEntities): void {
    // 更新时间范围
    if (entities.time) {
      const timeDesc = entities.time.description;
      if (!context.mentionedEntities.timeRanges.includes(timeDesc)) {
        context.mentionedEntities.timeRanges.unshift(timeDesc);
        if (context.mentionedEntities.timeRanges.length > 5) {
          context.mentionedEntities.timeRanges.pop();
        }
      }
    }

    // 更新指标
    entities.metrics.forEach(metric => {
      if (!context.mentionedEntities.metrics.includes(metric.name)) {
        context.mentionedEntities.metrics.unshift(metric.name);
        if (context.mentionedEntities.metrics.length > 5) {
          context.mentionedEntities.metrics.pop();
        }
      }
    });

    // 更新教练（从过滤器中）
    if (entities.filters.coach_name) {
      if (!context.mentionedEntities.coaches.includes(entities.filters.coach_name)) {
        context.mentionedEntities.coaches.unshift(entities.filters.coach_name);
        if (context.mentionedEntities.coaches.length > 5) {
          context.mentionedEntities.coaches.pop();
        }
      }
    }

    // 更新门店（从过滤器中）
    if (entities.filters.store_name) {
      if (!context.mentionedEntities.stores.includes(entities.filters.store_name)) {
        context.mentionedEntities.stores.unshift(entities.filters.store_name);
        if (context.mentionedEntities.stores.length > 5) {
          context.mentionedEntities.stores.pop();
        }
      }
    }
  }

  /**
   * 指代消解
   * 将当前查询中的指代词解析为具体实体
   */
  resolveReferences(sessionId: string, currentQuery: string): {
    resolvedQuery: string;
    resolvedEntities: Partial<ExtractedEntities>;
  } {
    const context = this.getContext(sessionId);
    let resolvedQuery = currentQuery;
    const resolvedEntities: Partial<ExtractedEntities> = {};

    // 时间指代消解
    if (this.hasPronoun(currentQuery, 'time')) {
      if (context.lastEntities?.time) {
        resolvedEntities.time = context.lastEntities.time;
        resolvedQuery = resolvedQuery.replace(/(那时|当时|那个时候|之前|之前说的|刚才|上次)/g, 
          context.lastEntities.time.description);
      }
    }

    // 教练指代消解
    if (this.hasPronoun(currentQuery, 'coach')) {
      if (context.mentionedEntities.coaches.length > 0) {
        const lastCoach = context.mentionedEntities.coaches[0];
        resolvedQuery = resolvedQuery.replace(/(那个教练|这位教练|该教练)/g, lastCoach);
        resolvedEntities.filters = { ...resolvedEntities.filters, coach_name: lastCoach };
      }
    }

    // 数据/结果指代
    if (this.hasPronoun(currentQuery, 'data')) {
      // 保持原查询，但标记需要参考上次结果
      resolvedEntities.metrics = context.lastEntities?.metrics || [];
    }

    // 上一步追问
    if (this.hasPronoun(currentQuery, 'previous')) {
      // 继承上次的实体和意图
      if (context.lastEntities) {
        resolvedEntities.time = context.lastEntities.time;
        resolvedEntities.metrics = context.lastEntities.metrics;
        resolvedEntities.dimensions = context.lastEntities.dimensions;
        resolvedEntities.filters = context.lastEntities.filters;
      }
    }

    // "那个数据" 类指代
    if (/那个|这个/.test(currentQuery) && context.lastEntities?.time) {
      // 如果当前查询包含指代词但没有时间，继承上次的时间
      if (!resolvedEntities.time) {
        resolvedEntities.time = context.lastEntities.time;
      }
    }

    return { resolvedQuery, resolvedEntities };
  }

  /**
   * 检查是否包含某类指代词
   */
  private hasPronoun(query: string, type: keyof typeof PRONOUNS): boolean {
    return PRONOUNS[type].some(pronoun => query.includes(pronoun));
  }

  /**
   * 获取对话历史
   */
  getConversationHistory(sessionId: string, limit: number = 10): ContextMessage[] {
    const context = this.getContext(sessionId);
    return context.messages.slice(-limit);
  }

  /**
   * 清空上下文
   */
  clearContext(sessionId: string): void {
    this.contexts.delete(sessionId);
  }

  /**
   * 获取当前话题
   */
  getCurrentTopic(sessionId: string): string | null {
    const context = this.getContext(sessionId);
    return context.currentTopic;
  }

  /**
   * 设置当前话题
   */
  setCurrentTopic(sessionId: string, topic: string): void {
    const context = this.getContext(sessionId);
    context.currentTopic = topic;
    context.updatedAt = new Date();
  }

  /**
   * 获取最近的实体
   */
  getRecentEntities(sessionId: string): {
    coaches: string[];
    stores: string[];
    timeRanges: string[];
    metrics: string[];
  } {
    const context = this.getContext(sessionId);
    return { ...context.mentionedEntities };
  }

  /**
   * 清理过期上下文
   */
  cleanup(): void {
    const now = new Date().getTime();
    for (const [sessionId, context] of this.contexts.entries()) {
      if (now - context.updatedAt.getTime() > this.maxContextAge) {
        this.contexts.delete(sessionId);
      }
    }
  }
}

// 单例实例
let contextManagerInstance: ContextManager | null = null;

export function getContextManager(): ContextManager {
  if (!contextManagerInstance) {
    contextManagerInstance = new ContextManager();
  }
  return contextManagerInstance;
}

// 便捷函数
export function resolveReferences(sessionId: string, query: string): {
  resolvedQuery: string;
  resolvedEntities: Partial<ExtractedEntities>;
} {
  return getContextManager().resolveReferences(sessionId, query);
}
