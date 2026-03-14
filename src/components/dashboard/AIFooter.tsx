'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
  Loader2,
  Brain,
  Lightbulb,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboard } from '@/components/layout/DashboardContext';

// 快捷查询模板
const QUERY_TEMPLATES = [
  {
    category: '会员分析',
    icon: Users,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    queries: ['本月新增多少会员？', '活跃会员有多少？', '会员流失率是多少？'],
  },
  {
    category: '教练业绩',
    icon: TrendingUp,
    color: 'bg-green-50 text-green-600 border-green-200',
    queries: ['哪个教练业绩最好？', '教练课时利用率如何？', '私教续费率统计'],
  },
  {
    category: '销售分析',
    icon: DollarSign,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    queries: ['本月收入多少？', '哪种会员卡最畅销？', '最近30天销售趋势'],
  },
  {
    category: '趋势预测',
    icon: BarChart3,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    queries: ['预测下月新会员数量', '收入趋势如何？', '会员增长预测'],
  },
];

export default function AIFooter() {
  const { 
    aiMessages, 
    addAIMessage, 
    isAILoading, 
    setAILoading,
    selectedModel 
  } = useDashboard();

  const [input, setInput] = React.useState('');
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showTemplates, setShowTemplates] = React.useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isExpanded]);

  const handleSend = async () => {
    if (!input.trim() || isAILoading) return;

    const query = input.trim();
    setInput('');
    setShowTemplates(false);

    // 添加用户消息
    addAIMessage({ role: 'user', content: query });

    // 模拟AI响应
    setAILoading(true);
    
    setTimeout(() => {
      const responses = [
        `根据您的数据，${query} 的分析结果如下：\n\n1. 总体趋势呈现上升态势\n2. 关键指标同比增长 15.3%\n3. 建议关注会员活跃度变化`,
        `我来为您分析这个问题：\n\n• 当前数据显示良好增长\n• 环比上月提升 8.2%\n• 建议继续保持当前策略`,
        `基于现有数据分析：\n\n- 主要指标符合预期\n- 异常情况：发现 3 个数据点需要关注\n- 建议：优化会员转化流程`,
      ];
      
      addAIMessage({ 
        role: 'assistant', 
        content: responses[Math.floor(Math.random() * responses.length)] 
      });
      setAILoading(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTemplateClick = (query: string) => {
    setInput(query);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    // 清空对话（通过刷新页面或重置状态）
    window.location.reload();
  };

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* 展开/收起按钮 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center py-2 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2 text-gray-500">
          <MessageSquare className="w-4 h-4" />
          <span className="text-xs font-medium">
            {isExpanded ? '收起 AI 助手' : '展开 AI 助手'}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* AI对话区域 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 320, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card className="border-0 rounded-none shadow-none h-full">
              <CardHeader className="py-3 px-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Brain className="w-4 h-4 text-blue-600" />
                    </div>
                    AI 智能分析助手
                    {isAILoading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                  </CardTitle>
                  {aiMessages.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleClear} className="h-8 text-xs">
                      <RotateCcw className="w-3 h-3 mr-1" />
                      清空
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-0 flex flex-col h-[calc(100%-60px)]">
                {/* 消息列表 */}
                <ScrollArea className="flex-1 p-4">
                  {aiMessages.length === 0 && showTemplates ? (
                    <div className="space-y-4">
                      {/* 欢迎消息 */}
                      <div className="text-center py-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Sparkles className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-1">
                          您好！我是您的数据分析助手
                        </h3>
                        <p className="text-xs text-gray-500">
                          使用 {selectedModel === 'deepseek' ? 'DeepSeek' : 'Kimi'} AI 模型为您服务
                        </p>
                      </div>

                      {/* 快捷查询模板 */}
                      <div className="grid grid-cols-2 gap-2">
                        {QUERY_TEMPLATES.map((template) => (
                          <button
                            key={template.category}
                            onClick={() => setShowTemplates(!showTemplates)}
                            className={`p-2 rounded-lg border ${template.color} text-left hover:shadow-sm transition-all`}
                          >
                            <div className="flex items-center gap-1.5">
                              <template.icon className="w-3.5 h-3.5" />
                              <span className="text-xs font-medium">{template.category}</span>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* 具体查询按钮 */}
                      <div className="space-y-1.5">
                        {QUERY_TEMPLATES.flatMap(t => t.queries).slice(0, 6).map((query, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-left h-auto py-2 px-3 text-xs hover:bg-blue-50 hover:border-blue-300"
                            onClick={() => handleTemplateClick(query)}
                          >
                            <Lightbulb className="w-3 h-3 mr-2 text-gray-400" />
                            {query}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {aiMessages.map((message, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[85%] ${message.role === 'user' ? 'ml-4' : 'mr-4'}`}>
                            {/* 消息气泡 */}
                            <div
                              className={`p-3 rounded-2xl text-sm ${
                                message.role === 'user'
                                  ? 'bg-blue-600 text-white rounded-br-md'
                                  : 'bg-gray-100 text-gray-800 rounded-bl-md'
                              }`}
                            >
                              <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
                            </div>
                            {/* 时间戳 */}
                            <p className={`text-[10px] text-gray-400 mt-1 ${
                              message.role === 'user' ? 'text-right' : 'text-left'
                            }`}>
                              {message.timestamp.toLocaleTimeString('zh-CN', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* 输入区域 */}
                <div className="p-3 border-t border-gray-100 bg-gray-50">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="输入您的问题，例如：本月新增多少会员？"
                        className="pr-4 h-10 bg-white"
                        disabled={isAILoading}
                      />
                    </div>
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isAILoading}
                      size="sm"
                      className="h-10 px-4"
                    >
                      {isAILoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 text-center">
                    支持自然语言查询，可询问会员、收入、教练业绩等数据
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
