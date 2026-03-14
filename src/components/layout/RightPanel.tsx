'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Settings2, 
  BarChart3, 
  LineChart, 
  PieChart, 
  AreaChart,
  Radar,
  Activity,
  Type,
  Palette,
  Filter,
  Eye,
  EyeOff,
  Layers,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDashboard } from './DashboardContext';

interface RightPanelProps {
  onClose?: () => void;
}

// 图表类型选项
const CHART_TYPES = [
  { id: 'bar', name: '柱状图', icon: BarChart3 },
  { id: 'line', name: '折线图', icon: LineChart },
  { id: 'pie', name: '饼图', icon: PieChart },
  { id: 'area', name: '面积图', icon: AreaChart },
  { id: 'radar', name: '雷达图', icon: Radar },
  { id: 'scatter', name: '散点图', icon: Activity },
];

// 颜色方案
const COLOR_SCHEMES = [
  { id: 'default', name: '默认', colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'] },
  { id: 'blue', name: '蓝色系', colors: ['#1E40AF', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'] },
  { id: 'green', name: '绿色系', colors: ['#065F46', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0'] },
  { id: 'warm', name: '暖色系', colors: ['#B45309', '#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A'] },
];

// 聚合选项
const AGGREGATIONS = [
  { id: 'sum', name: '求和' },
  { id: 'avg', name: '平均值' },
  { id: 'count', name: '计数' },
  { id: 'max', name: '最大值' },
  { id: 'min', name: '最小值' },
];

export default function RightPanel({ onClose }: RightPanelProps) {
  const { 
    chartConfig, 
    updateChartConfig, 
    dataSources, 
    selectedDataSource,
    globalFilters,
    addFilter,
    removeFilter
  } = useDashboard();

  const [activeTab, setActiveTab] = React.useState<'chart' | 'data' | 'filter'>('chart');

  // 获取当前数据源的字段
  const availableFields = React.useMemo(() => {
    if (!selectedDataSource) return [];
    const source = dataSources.find(s => s.id === selectedDataSource);
    return source?.headers || [];
  }, [dataSources, selectedDataSource]);

  return (
    <motion.aside
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-full lg:w-72 bg-white border-l border-gray-200 flex flex-col h-full"
    >
      {/* 头部 */}
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-sm text-gray-700">属性配置</span>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* 标签页 */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'chart', name: '图表', icon: BarChart3 },
          { id: 'data', name: '数据', icon: Layers },
          { id: 'filter', name: '筛选', icon: Filter },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1 p-4">
        {/* 图表配置 */}
        {activeTab === 'chart' && (
          <div className="space-y-6">
            {/* 图表类型 */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                图表类型
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {CHART_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => updateChartConfig({ type: type.id as any })}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                      chartConfig.type === type.id
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <type.icon className="w-5 h-5" />
                    <span className="text-xs">{type.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* 图表标题 */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                图表标题
              </Label>
              <Input
                value={chartConfig.title}
                onChange={(e) => updateChartConfig({ title: e.target.value })}
                placeholder="输入图表标题"
                className="h-9"
              />
            </div>

            <Separator />

            {/* 坐标轴设置 */}
            {selectedDataSource && availableFields.length > 0 && (
              <div className="space-y-4">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  坐标轴设置
                </Label>
                
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">X轴 (分类)</Label>
                  <Select 
                    value={chartConfig.xAxis} 
                    onValueChange={(value) => updateChartConfig({ xAxis: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="选择X轴字段" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map((field) => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Y轴 (数值)</Label>
                  <Select 
                    value={typeof chartConfig.yAxis === 'string' ? chartConfig.yAxis : ''} 
                    onValueChange={(value) => updateChartConfig({ yAxis: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="选择Y轴字段" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map((field) => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <Separator />

            {/* 颜色方案 */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                颜色方案
              </Label>
              <div className="space-y-2">
                {COLOR_SCHEMES.map((scheme) => (
                  <button
                    key={scheme.id}
                    onClick={() => updateChartConfig({ colorScheme: scheme.id })}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all ${
                      chartConfig.colorScheme === scheme.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex gap-1">
                      {scheme.colors.map((color, i) => (
                        <div 
                          key={i} 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-700">{scheme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* 显示选项 */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                显示选项
              </Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">显示图例</span>
                  </div>
                  <Switch 
                    checked={chartConfig.showLegend} 
                    onCheckedChange={(checked) => updateChartConfig({ showLegend: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">显示提示</span>
                  </div>
                  <Switch 
                    checked={chartConfig.showTooltip} 
                    onCheckedChange={(checked) => updateChartConfig({ showTooltip: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">堆叠显示</span>
                  </div>
                  <Switch 
                    checked={chartConfig.stacked} 
                    onCheckedChange={(checked) => updateChartConfig({ stacked: checked })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 数据配置 */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            {!selectedDataSource ? (
              <div className="text-center py-8">
                <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">请先选择数据源</p>
                <p className="text-xs text-gray-400 mt-1">从左侧面板选择数据源</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    当前数据源
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {(() => {
                      const source = dataSources.find(s => s.id === selectedDataSource);
                      return source ? (
                        <div>
                          <p className="font-medium text-sm text-gray-800">{source.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {source.rowCount.toLocaleString()} 行 · {source.headers.length} 列
                          </p>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    可用字段
                  </Label>
                  <div className="space-y-1">
                    {availableFields.map((field, index) => (
                      <div 
                        key={field} 
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs w-6 justify-center">
                            {index + 1}
                          </Badge>
                          <span className="text-sm text-gray-700">{field}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 筛选配置 */}
        {activeTab === 'filter' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                全局筛选器
              </Label>
              
              {globalFilters.length === 0 ? (
                <div className="text-center py-6">
                  <Filter className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">暂无筛选条件</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {globalFilters.map((filter) => (
                    <div 
                      key={filter.id} 
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{filter.field}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => removeFilter(filter.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {filter.operator} {filter.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedDataSource && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    添加筛选
                  </Label>
                  <div className="space-y-2">
                    <Select>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="选择字段" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFields.map((field) => (
                          <SelectItem key={field} value={field}>{field}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select defaultValue="eq">
                      <SelectTrigger className="h-9">
                        <SelectValue />
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
                    <Input placeholder="输入值" className="h-9" />
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        // 添加筛选逻辑
                      }}
                    >
                      添加筛选
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </ScrollArea>
    </motion.aside>
  );
}
