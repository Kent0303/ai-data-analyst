'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Filter, 
  Calendar, 
  Users, 
  TrendingUp, 
  Building2,
  X,
  Plus,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDashboard } from '@/components/layout/DashboardContext';

interface FilterBarProps {
  onAddFilter?: (filter: { field: string; operator: string; value: string }) => void;
}

// 预设筛选条件
const PRESET_FILTERS = [
  { id: 'date-range', name: '时间范围', icon: Calendar, options: ['最近7天', '最近30天', '本月', '上月', '本季度', '自定义'] },
  { id: 'member-type', name: '会员类型', icon: Users, options: ['全部会员', '新会员', '活跃会员', '沉睡会员', '流失会员'] },
  { id: 'revenue-range', name: '消费金额', icon: TrendingUp, options: ['全部', '0-500元', '500-1000元', '1000-5000元', '5000元以上'] },
  { id: 'venue', name: '门店', icon: Building2, options: ['全部门店', '总店', '分店A', '分店B'] },
];

export default function FilterBar({ onAddFilter }: FilterBarProps) {
  const { globalFilters, removeFilter, dataSources } = useDashboard();
  const [activePresets, setActivePresets] = React.useState<string[]>([]);
  const [showMore, setShowMore] = React.useState(false);

  const togglePreset = (presetId: string) => {
    setActivePresets(prev => 
      prev.includes(presetId) 
        ? prev.filter(id => id !== presetId)
        : [...prev, presetId]
    );
  };

  const clearAllFilters = () => {
    setActivePresets([]);
    globalFilters.forEach(f => removeFilter(f.id));
  };

  const hasFilters = activePresets.length > 0 || globalFilters.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-b border-gray-200 p-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        {/* 筛选标签 */}
        <div className="flex items-center gap-1.5 text-sm text-gray-600 mr-2">
          <Filter className="w-4 h-4" />
          <span className="font-medium">筛选:</span>
        </div>

        {/* 预设筛选按钮 */}
        {PRESET_FILTERS.slice(0, showMore ? undefined : 3).map((preset) => (
          <Select key={preset.id}>
            <SelectTrigger 
              className={`h-8 text-xs w-auto min-w-[100px] ${
                activePresets.includes(preset.id) 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : ''
              }`}
            >
              <preset.icon className="w-3.5 h-3.5 mr-1.5" />
              <SelectValue placeholder={preset.name} />
            </SelectTrigger>
            <SelectContent>
              {preset.options.map((option) => (
                <SelectItem key={option} value={option} className="text-xs">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {/* 更多/收起按钮 */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-gray-500"
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? '收起' : '更多'}
          <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showMore ? 'rotate-180' : ''}`} />
        </Button>

        {/* 分隔线 */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* 已激活的筛选标签 */}
        {activePresets.map((presetId) => {
          const preset = PRESET_FILTERS.find(p => p.id === presetId);
          return preset ? (
            <Badge 
              key={presetId} 
              variant="secondary"
              className="h-7 px-2 text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 cursor-pointer"
            >
              {preset.name}
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={(e) => {
                  e.stopPropagation();
                  togglePreset(presetId);
                }}
              />
            </Badge>
          ) : null;
        })}

        {globalFilters.map((filter) => (
          <Badge 
            key={filter.id} 
            variant="secondary"
            className="h-7 px-2 text-xs bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 cursor-pointer"
          >
            {filter.field} {filter.operator} {filter.value}
            <X 
              className="w-3 h-3 ml-1 cursor-pointer" 
              onClick={(e) => {
                e.stopPropagation();
                removeFilter(filter.id);
              }}
            />
          </Badge>
        ))}

        {/* 清除全部 */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={clearAllFilters}
          >
            清除全部
          </Button>
        )}

        {/* 添加筛选按钮 */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs ml-auto"
          onClick={() => onAddFilter?.({ field: '', operator: 'eq', value: '' })}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          添加筛选
        </Button>
      </div>
    </motion.div>
  );
}
