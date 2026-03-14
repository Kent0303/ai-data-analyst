'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Filter, 
  Calendar, 
  Users, 
  TrendingUp, 
  Building2,
  X,
  Plus,
  ChevronDown,
  Hash,
  Text
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FilterBarProps {
  onAddFilter?: (filter: { field: string; operator: string; value: string }) => void;
}

// 字段类型检测
const detectFieldType = (values: any[]): 'date' | 'number' | 'text' | 'category' => {
  if (values.length === 0) return 'text';
  
  const sample = values.find(v => v !== null && v !== undefined && v !== '');
  if (!sample) return 'text';
  
  // 检测日期
  if (typeof sample === 'string' && /\d{4}[-/]\d{2}[-/]\d{2}/.test(sample)) {
    return 'date';
  }
  
  // 检测数字
  if (typeof sample === 'number' || !isNaN(Number(sample))) {
    return 'number';
  }
  
  // 检测分类（唯一值较少）
  const uniqueValues = new Set(values.filter(v => v !== null && v !== undefined && v !== ''));
  if (uniqueValues.size <= 10 && uniqueValues.size < values.length * 0.5) {
    return 'category';
  }
  
  return 'text';
};

// 获取字段的唯一值
const getUniqueValues = (data: any[][], columnIndex: number, limit: number = 20): string[] => {
  if (!data || data.length < 2) return [];
  
  const values = data.slice(1).map(row => row[columnIndex]).filter(v => v !== null && v !== undefined && v !== '');
  const unique = [...new Set(values)];
  return unique.slice(0, limit).map(String);
};

// 获取字段的数值范围
const getNumberRange = (data: any[][], columnIndex: number): { min: number; max: number } | null => {
  if (!data || data.length < 2) return null;
  
  const numbers = data.slice(1)
    .map(row => Number(row[columnIndex]))
    .filter(n => !isNaN(n));
  
  if (numbers.length === 0) return null;
  
  return {
    min: Math.min(...numbers),
    max: Math.max(...numbers),
  };
};

export default function FilterBar({ onAddFilter }: FilterBarProps) {
  const { globalFilters, removeFilter, dataSources, selectedDataSource, addFilter } = useDashboard();
  const [showMore, setShowMore] = React.useState(false);
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [newFilter, setNewFilter] = React.useState({ field: '', operator: 'eq', value: '' });

  // 获取当前选中的数据源
  const currentSource = useMemo(() => {
    if (selectedDataSource) {
      return dataSources.find(s => s.id === selectedDataSource);
    }
    return dataSources[0];
  }, [dataSources, selectedDataSource]);

  // 动态生成筛选选项
  const dynamicFilters = useMemo(() => {
    if (!currentSource || !currentSource.data || currentSource.data.length < 2) {
      return [];
    }

    const headers = currentSource.data[0];
    const filters = [];

    for (let i = 0; i < headers.length; i++) {
      const fieldName = String(headers[i]);
      const values = currentSource.data.slice(1).map(row => row[i]);
      const fieldType = detectFieldType(values);

      let filterConfig: any = {
        id: `field-${i}`,
        name: fieldName,
        field: fieldName,
        type: fieldType,
      };

      switch (fieldType) {
        case 'date':
          filterConfig.icon = Calendar;
          filterConfig.options = ['最近7天', '最近30天', '本月', '上月', '本季度', '自定义'];
          break;
        case 'number':
          filterConfig.icon = TrendingUp;
          const range = getNumberRange(currentSource.data, i);
          if (range) {
            const step = (range.max - range.min) / 4;
            filterConfig.options = [
              `全部`,
              `${range.min.toFixed(0)}-${(range.min + step).toFixed(0)}`,
              `${(range.min + step).toFixed(0)}-${(range.min + step * 2).toFixed(0)}`,
              `${(range.min + step * 2).toFixed(0)}-${(range.min + step * 3).toFixed(0)}`,
              `${(range.min + step * 3).toFixed(0)}-${range.max.toFixed(0)}`,
            ];
          }
          break;
        case 'category':
          filterConfig.icon = Users;
          filterConfig.options = ['全部', ...getUniqueValues(currentSource.data, i, 10)];
          break;
        default:
          filterConfig.icon = Text;
          filterConfig.options = ['包含', '不包含', '等于', '不等于'];
      }

      // 只添加有意义的筛选器
      if (filterConfig.options && filterConfig.options.length > 1) {
        filters.push(filterConfig);
      }
    }

    return filters;
  }, [currentSource]);

  // 预设筛选器（当没有数据源时显示）
  const presetFilters = [
    { id: 'date-range', name: '时间范围', icon: Calendar, options: ['最近7天', '最近30天', '本月', '上月'] },
  ];

  const displayFilters = dynamicFilters.length > 0 ? dynamicFilters : presetFilters;

  const handleAddFilter = () => {
    if (newFilter.field && newFilter.value) {
      addFilter({
        id: Date.now().toString(),
        field: newFilter.field,
        operator: newFilter.operator as any,
        value: newFilter.value,
      });
      setNewFilter({ field: '', operator: 'eq', value: '' });
      setShowAddDialog(false);
    }
  };

  const clearAllFilters = () => {
    globalFilters.forEach(f => removeFilter(f.id));
  };

  const hasFilters = globalFilters.length > 0;

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

        {/* 动态筛选按钮 */}
        {displayFilters.slice(0, showMore ? undefined : 4).map((filter) => (
          <Select 
            key={filter.id}
            onValueChange={(value) => {
              if (value && value !== '全部') {
                addFilter({
                  id: `${filter.id}-${Date.now()}`,
                  field: filter.name,
                  operator: 'eq',
                  value: value,
                });
              }
            }}
          >
            <SelectTrigger className="h-8 text-xs w-auto min-w-[100px]">
              <filter.icon className="w-3.5 h-3.5 mr-1.5" />
              <SelectValue placeholder={filter.name} />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map((option: string) => (
                <SelectItem key={option} value={option} className="text-xs">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {/* 更多/收起按钮 */}
        {displayFilters.length > 4 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-gray-500"
            onClick={() => setShowMore(!showMore)}
          >
            {showMore ? '收起' : '更多'}
            <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showMore ? 'rotate-180' : ''}`} />
          </Button>
        )}

        {/* 分隔线 */}
        {hasFilters && <div className="w-px h-6 bg-gray-200 mx-1" />}

        {/* 已激活的筛选标签 */}
        {globalFilters.map((filter) => (
          <Badge 
            key={filter.id} 
            variant="secondary"
            className="h-7 px-2 text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 cursor-pointer"
          >
            {filter.field} = {filter.value}
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
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs ml-auto"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              添加筛选
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>添加筛选条件</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="field">字段</Label>
                <Select 
                  value={newFilter.field} 
                  onValueChange={(value) => setNewFilter({ ...newFilter, field: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择字段" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentSource?.headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="operator">操作符</Label>
                <Select 
                  value={newFilter.operator} 
                  onValueChange={(value) => setNewFilter({ ...newFilter, operator: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择操作符" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eq">等于</SelectItem>
                    <SelectItem value="neq">不等于</SelectItem>
                    <SelectItem value="gt">大于</SelectItem>
                    <SelectItem value="gte">大于等于</SelectItem>
                    <SelectItem value="lt">小于</SelectItem>
                    <SelectItem value="lte">小于等于</SelectItem>
                    <SelectItem value="contains">包含</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="value">值</Label>
                <Input
                  id="value"
                  value={newFilter.value}
                  onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
                  placeholder="输入筛选值"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                取消
              </Button>
              <Button onClick={handleAddFilter} disabled={!newFilter.field || !newFilter.value}>
                添加
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  );
}
