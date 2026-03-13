'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Brain
} from 'lucide-react';

interface SmartQueryProps {
  onQuery: (query: string, mode: 'general' | 'prediction') => void;
  isLoading?: boolean;
}

const QUERY_TEMPLATES = [
  {
    category: '会员分析',
    icon: Users,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    queries: [
      '分析会员增长趋势',
      '找出高价值会员',
      '识别流失风险会员',
    ]
  },
  {
    category: '教练业绩',
    icon: Target,
    color: 'bg-green-50 text-green-600 border-green-200',
    queries: [
      '哪个教练业绩最好？',
      '教练课时利用率分析',
      '私教续费率统计',
    ]
  },
  {
    category: '销售分析',
    icon: DollarSign,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    queries: [
      '本月销售收入分析',
      '哪种会员卡最畅销？',
      '销售转化率分析',
    ]
  },
  {
    category: '预测分析',
    icon: TrendingUp,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    queries: [
      '预测下月新会员数量',
      '预测下季度收入',
      '会员流失率预测',
    ]
  }
];

export default function SmartQuery({ onQuery, isLoading }: SmartQueryProps) {
  const [input, setInput] = useState('');
  const [showTemplates, setShowTemplates] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      const isPrediction = /预测|forecast|未来|下个月|明年|趋势/.test(input);
      onQuery(input.trim(), isPrediction ? 'prediction' : 'general');
      setInput('');
      setShowTemplates(false);
    }
  };

  const handleTemplateClick = (query: string) => {
    const isPrediction = /预测|forecast|未来|下个月|明年|趋势/.test(query);
    onQuery(query, isPrediction ? 'prediction' : 'general');
    setShowTemplates(false);
  };

  return (
    <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          想问什么？
          {isLoading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 输入框 */}
        <form onSubmit={handleSubmit} className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入你的问题，例如：上个月哪个教练业绩最好？"
            className="pr-12 h-12 text-base"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-1 top-1 h-10"
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </form>

        {/* 快捷查询模板 */}
        {showTemplates && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3"
          >
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              快捷查询：
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {QUERY_TEMPLATES.map((template) => (
                <div 
                  key={template.category}
                  className={`p-3 rounded-xl border ${template.color} cursor-pointer hover:shadow-md transition-all`}
                  onClick={() => setShowTemplates(!showTemplates)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <template.icon className="w-4 h-4" />
                    <span className="font-medium text-sm">{template.category}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 具体查询按钮 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {QUERY_TEMPLATES.flatMap(t => t.queries).map((query, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="justify-start text-left h-auto py-2.5 px-3 text-sm hover:bg-blue-50 hover:border-blue-300 transition-all"
                  onClick={() => handleTemplateClick(query)}
                  disabled={isLoading}
                >
                  <Search className="w-3 h-3 mr-2 text-gray-400" />
                  {query}
                </Button>
              ))}
            </div>
          </motion.div>
        )}

        {/* 重新显示模板按钮 */}
        {!showTemplates && !isLoading && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowTemplates(true)}
            className="text-gray-500"
          >
            <BarChart3 className="w-4 h-4 mr-1" />
            显示快捷查询
          </Button>
        )}

        {/* 提示 */}
        <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">
          <Brain className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-gray-600 mb-1">AI 助手可以帮你：</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>分析会员增长趋势和留存率</li>
              <li>评估教练业绩和产能</li>
              <li>预测收入和会员流失</li>
              <li>提供经营优化建议</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
