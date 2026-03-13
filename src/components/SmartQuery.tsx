'use client';

import { useState } from 'react';
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
  Loader2
} from 'lucide-react';

interface SmartQueryProps {
  onQuery: (query: string, mode: 'general' | 'prediction') => void;
  isLoading?: boolean;
}

const QUICK_QUERIES = [
  {
    category: '会员分析',
    icon: Users,
    color: 'bg-blue-100 text-blue-600',
    queries: [
      '分析会员增长趋势',
      '找出高价值会员',
      '识别流失风险会员',
      '会员活跃度分析'
    ]
  },
  {
    category: '教练管理',
    icon: Target,
    color: 'bg-green-100 text-green-600',
    queries: [
      '哪个教练业绩最好？',
      '教练课时利用率分析',
      '私教续费率统计',
      '教练产能评估'
    ]
  },
  {
    category: '销售分析',
    icon: DollarSign,
    color: 'bg-amber-100 text-amber-600',
    queries: [
      '本月销售收入分析',
      '哪种会员卡最畅销？',
      '销售转化率分析',
      '促销活动效果评估'
    ]
  },
  {
    category: '预测分析',
    icon: TrendingUp,
    color: 'bg-purple-100 text-purple-600',
    queries: [
      '预测下月新会员数量',
      '预测下季度收入',
      '会员流失率预测',
      '私教课需求预测'
    ]
  }
];

export default function SmartQuery({ onQuery, isLoading }: SmartQueryProps) {
  const [input, setInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      // 检测是否为预测查询
      const isPrediction = /预测|forecast|未来|下个月|明年|趋势/.test(input);
      onQuery(input.trim(), isPrediction ? 'prediction' : 'general');
      setInput('');
    }
  };

  const handleQuickQuery = (query: string) => {
    const isPrediction = /预测|forecast|未来|下个月|明年|趋势/.test(query);
    onQuery(query, isPrediction ? 'prediction' : 'general');
  };

  return (
    <Card className="bg-gradient-to-br from-white to-blue-50/30 border-blue-100">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          智能查询
          {isLoading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 自然语言输入 */}
        <form onSubmit={handleSubmit} className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入你的问题，例如：上个月哪个教练业绩最好？"
            className="pr-12 h-12"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-1 top-1 h-10"
            disabled={!input.trim() || isLoading}
          >
            <Search className="w-4 h-4" />
          </Button>
        </form>

        {/* 快捷查询 */}
        <div className="space-y-3">
          <p className="text-sm text-gray-500">快捷查询：</p>
          
          {/* 分类标签 */}
          <div className="flex gap-2 flex-wrap">
            <Badge 
              variant={selectedCategory === null ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              全部
            </Badge>
            {QUICK_QUERIES.map((cat) => (
              <Badge
                key={cat.category}
                variant={selectedCategory === cat.category ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(cat.category)}
              >
                <cat.icon className="w-3 h-3 mr-1" />
                {cat.category}
              </Badge>
            ))}
          </div>

          {/* 查询按钮 */}
          <div className="grid grid-cols-2 gap-2">
            {QUICK_QUERIES
              .filter(cat => selectedCategory === null || cat.category === selectedCategory)
              .flatMap(cat => cat.queries)
              .map((query, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="justify-start text-left h-auto py-2 px-3 text-xs"
                  onClick={() => handleQuickQuery(query)}
                  disabled={isLoading}
                >
                  {query}
                </Button>
              ))}
          </div>
        </div>

        {/* 提示 */}
        <div className="text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-1">💡 提示：</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>可以直接问业务相关问题，AI 会自动分析</li>
            <li>包含"预测"关键词会触发预测分析模式</li>
            <li>支持时间范围筛选（本月、上月、今年等）</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
