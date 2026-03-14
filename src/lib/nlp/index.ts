/**
 * NLP 模块入口
 * 统一导出自然语言处理相关功能
 */

export { 
  IntentRecognizer, 
  recognizeIntent, 
  getIntentRecognizer,
  type Intent,
  type IntentType 
} from './intentRecognizer';

export { 
  EntityExtractor, 
  extractEntities, 
  getEntityExtractor,
  type TimeEntity,
  type MetricEntity,
  type DimensionEntity,
  type ExtractedEntities 
} from './entityExtractor';

export { 
  ContextManager, 
  resolveReferences, 
  getContextManager,
  type ConversationContext,
  type ContextMessage 
} from './contextManager';

export { 
  ResponseGenerator, 
  generateResponse, 
  getResponseGenerator,
  type GeneratedResponse,
  type ResponseTemplate 
} from './responseGenerator';

/**
 * 智能查询处理器
 * 整合意图识别、实体提取、上下文管理和回复生成
 */
import { IntentRecognizer, Intent, IntentType } from './intentRecognizer';
import { EntityExtractor, ExtractedEntities } from './entityExtractor';
import { ContextManager } from './contextManager';
import { ResponseGenerator, GeneratedResponse } from './responseGenerator';

export interface ProcessQueryOptions {
  sessionId: string;
  query: string;
  useContext?: boolean;
  concise?: boolean;
}

export interface ProcessQueryResult {
  intent: Intent;
  entities: ExtractedEntities;
  response: GeneratedResponse;
  resolvedQuery: string;
  contextUsed: boolean;
}

export class NLPProcessor {
  private intentRecognizer: IntentRecognizer;
  private entityExtractor: EntityExtractor;
  private contextManager: ContextManager;
  private responseGenerator: ResponseGenerator;

  constructor() {
    this.intentRecognizer = new IntentRecognizer();
    this.entityExtractor = new EntityExtractor();
    this.contextManager = new ContextManager();
    this.responseGenerator = new ResponseGenerator();
  }

  /**
   * 处理用户查询
   */
  processQuery(options: ProcessQueryOptions): ProcessQueryResult {
    const { sessionId, query, useContext = true, concise = true } = options;

    // 1. 上下文指代消解
    let resolvedQuery = query;
    let resolvedEntities: Partial<ExtractedEntities> = {};
    let contextUsed = false;

    if (useContext) {
      const resolution = this.contextManager.resolveReferences(sessionId, query);
      resolvedQuery = resolution.resolvedQuery;
      resolvedEntities = resolution.resolvedEntities;
      contextUsed = Object.keys(resolution.resolvedEntities).length > 0;
    }

    // 2. 意图识别
    const intent = this.intentRecognizer.recognize(resolvedQuery);

    // 3. 实体提取
    const entities = this.entityExtractor.extractAll(resolvedQuery);
    
    // 合并上下文解析的实体
    if (resolvedEntities.time && !entities.time) {
      entities.time = resolvedEntities.time;
    }
    if (resolvedEntities.filters && Object.keys(resolvedEntities.filters).length > 0) {
      entities.filters = { ...entities.filters, ...resolvedEntities.filters };
    }

    // 4. 更新上下文
    this.contextManager.addUserMessage(sessionId, query, intent.type, entities);

    // 5. 生成回复
    const response = this.responseGenerator.generate(
      intent.type,
      entities,
      undefined,
      { concise }
    );

    return {
      intent,
      entities,
      response,
      resolvedQuery,
      contextUsed
    };
  }

  /**
   * 添加助手回复到上下文
   */
  addAssistantResponse(sessionId: string, response: string, results?: any): void {
    this.contextManager.addAssistantMessage(sessionId, response, results);
  }

  /**
   * 获取对话历史
   */
  getConversationHistory(sessionId: string, limit?: number) {
    return this.contextManager.getConversationHistory(sessionId, limit);
  }

  /**
   * 清空会话上下文
   */
  clearSession(sessionId: string): void {
    this.contextManager.clearContext(sessionId);
  }
}

// 单例实例
let nlpProcessorInstance: NLPProcessor | null = null;

export function getNLPProcessor(): NLPProcessor {
  if (!nlpProcessorInstance) {
    nlpProcessorInstance = new NLPProcessor();
  }
  return nlpProcessorInstance;
}
