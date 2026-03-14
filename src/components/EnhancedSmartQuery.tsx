'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  Search, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target,
  Loader2,
  MessageSquare,
  BarChart3,
  Brain,
  Clock,
  Send,
  Lightbulb,
  RotateCcw,
  ChevronRight,
  X
} from 'lucide-react';
import { 
  recognizeIntent, 
  extractEntities, 
  type IntentType,
  type ExtractedEntities 
} from '@/lib/nlp';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: IntentType;
  entities?: ExtractedEntities;
  suggestions?: string[];
  timestamp: Date;
}

interface EnhancedSmartQueryProps {
  onQuery: (query: string, context: {
    intent: IntentType;
    entities: ExtractedEntities;
  }) => Promise<string>;
  isLoading?: boolean;
  sessionId?: string;
}

const QUERY_TEMPLATES = [
  {
    category: '会员分析',
    icon: Users,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    queries: [
      '本月新增多少会员？',
      '活跃会员有多少？',
      '会员流失率是多少？',
    ]
  },
  {
    category: '教练业绩',
    icon: Target,
    color: 'bg-green-50 text-green-600 border-green-200',
    queries: [
      '哪个教练业绩最好？',
      '教练课时利用率如何？',
      '私教续费率统计',
    ]
  },
  {
    category: '销售分析',
    icon: DollarSign,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    queries: [
      '本月收入多少？',
      '哪种会员卡最畅销？',
      '最近30天销售趋势',
    ]
  },
  {
    category: '趋势预测',
    icon: TrendingUp,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    queries: [
      '预测下月新会员数量',
      '收入趋势如何？',
      '会员增长预测',
    ]
  }
];

// 生成唯一ID
const generateId = () => Math.random().toString(36).substring(2, 9);

export default function EnhancedSmartQuery({ 
  onQuery, 
  isLoading: externalLoading,
  sessionId = 'default'
}: EnhancedSmartQueryProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 处理发送消息
  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || externalLoading) return;

    const query = input.trim();
    setInput('');
    setShowTemplates(false);
    setShowWelcome(false);

    // 1. 本地NLP处理
    const intent = recognizeIntent(query);
    const entities = extractEntities(query);

    // 2. 添加用户消息
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: query,
      intent: intent.type,
      entities,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // 3. 调用外部处理
    setIsLoading(true);
    try {
      const response = await onQuery(query, {
        intent: intent.type,
        entities
      });

      // 4. 添加助手回复
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: '抱歉，处理您的请求时出现错误，请稍后重试。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, externalLoading, onQuery]);

  // 处理回车发送
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // 使用模板查询
  const handleTemplateClick = useCallback((query: string) => {
    setInput(query);
    inputRef.current?.focus();
  }, []);

  // 清空对话
  const handleClear = useCallback(() => {
    setMessages([]);
    setShowWelcome(true);
    setShowTemplates(true);
  }, []);

  // 获取意图标签
  const getIntentLabel = (intent?: IntentType) => {
    const labels: Record<string, string> = {
      query_data: '数据查询',
      generate_chart: '生成图表',
      analyze_trend: '趋势分析',
      compare_data: '数据对比',
      alert_query: '预警查询',
      prediction: '预测分析',
      general: '一般问答',
      unknown: '未知'
    };
    return intent ? labels[intent] || intent : '';
  };

  // 获取意图颜色
  const getIntentColor = (intent?: IntentType) => {
    const colors: Record<string, string> = {
      query_data: 'bg-blue-100 text-blue-700',
      generate_chart: 'bg-purple-100 text-purple-700',
      analyze_trend: 'bg-green-100 text-green-700',
      compare_data: 'bg-orange-100 text-orange-700',
      alert_query: 'bg-red-100 text-red-700',
      prediction: 'bg-indigo-100 text-indigo-700',
      general: 'bg-gray-100 text-gray-700',
      unknown: 'bg-gray-100 text-gray-500'
    };
    return intent ? colors[intent] || colors.unknown : colors.unknown;
  };

  const loading = isLoading || externalLoading;

  return (
    <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/20 h-[600px] flex flex-col">
      {/* 头部 */}
      <CardHeader className="pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-blue-600" />
            </div>
            智能问答助手
            {loading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
          </CardTitle>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClear} className="text-gray-500">
              <RotateCcw className="w-4 h-4 mr-1" />
              清空对话
            </Button>
          )}
        </div>
      </CardHeader>

      {/* 消息区域 */}
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <AnimatePresence mode="wait">
            {showWelcome && messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* 欢迎消息 */}
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    您好！我是您的数据分析助手
                  </h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    您可以问我关于会员、收入、教练业绩等方面的问题，我会尽力为您解答。
                  </p>
                </div>

                {/* 快捷查询模板 */}
                {showTemplates && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500 flex items-center gap-2 px-1">
                      <Lightbulb className="w-4 h-4" />
                      您可以这样问我：
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {QUERY_TEMPLATES.map((template) => (
                        <div 
                          key={template.category}
                          className={`p-3 rounded-xl border ${template.color} cursor-pointer hover:shadow-md transition-all`}
                          onClick={() => setShowTemplates(!showTemplates)}
                        >
                          <div className="flex items-center gap-2">
                            <template.icon className="w-4 h-4" />
                            <span className="font-medium text-sm">{template.category}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 具体查询按钮 */}
                    <div className="space-y-2">
                      {QUERY_TEMPLATES.flatMap(t => t.queries).map((query, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left h-auto py-2.5 px-3 text-sm hover:bg-blue-50 hover:border-blue-300 transition-all"
                          onClick={() => handleTemplateClick(query)}
                        >
                          <Search className="w-3 h-3 mr-2 text-gray-400" />
                          {query}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 消息列表 */}
          <div className="space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${message.role === 'user' ? 'ml-8' : 'mr-8'}`}>
                  {/* 消息气泡 */}
                  <div
                    className={`p-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white border border-gray-200 rounded-bl-md shadow-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {/* 元信息 */}
                  <div className={`flex items-center gap-2 mt-1 text-xs ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    <span className="text-gray-400">
                      {message.timestamp.toLocaleTimeString('zh-CN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    {message.intent && message.role === 'user' && (
                      <Badge className={`text-xs ${getIntentColor(message.intent)}`}>
                        {getIntentLabel(message.intent)}
                      </Badge>
                    )}
                  </div>

                  {/* 实体标签 */}
                  {message.entities && message.role === 'user' && (
                    <div className={`flex flex-wrap gap-1 mt-1 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}>
                      {message.entities.time && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {message.entities.time.description}
                        </Badge>
                      )}
                      {message.entities.metrics.slice(0, 2).map((m, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {m.synonyms[0]}
                        </Badge>
                      ))}
                      {message.entities.dimensions.slice(0, 2).map((d, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {d.description}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* 输入区域 */}
        <div className="p-4 border-t border-gray-100 bg-white">
          {/* 重新显示模板按钮 */}
          {!showTemplates && !showWelcome && messages.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowTemplates(true)}
                className="text-gray-500 flex-shrink-0"
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                显示快捷查询
              </Button>
              {QUERY_TEMPLATES.flatMap(t => t.queries).slice(0, 4).map((query, idx) => (
                <Button
                  key={idx}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 flex-shrink-0"
                  onClick={() => handleTemplateClick(query)}
                >
                  {query}
                </Button>
              ))}
            </div>
          )}

          {/* 输入框 */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入您的问题，例如：本月新增多少会员？"
                className="pr-4 h-11"
                disabled={loading}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="h-11 px-4"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* 提示 */}
          <p className="text-xs text-gray-400 mt-2 text-center">
            支持自然语言查询，可询问会员、收入、教练业绩等数据
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
