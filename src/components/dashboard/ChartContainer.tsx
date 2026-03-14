'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Download, 
  Maximize2, 
  Settings,
  MoreHorizontal,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDashboard } from '@/components/layout/DashboardContext';
import DataVisualization from '@/components/DataVisualization';

// 图表类型标签
const CHART_TYPE_LABELS: Record<string, string> = {
  bar: '柱状图',
  line: '折线图',
  pie: '饼图',
  area: '面积图',
  radar: '雷达图',
  scatter: '散点图',
  gauge: '仪表盘',
  heatmap: '热力图',
};

export default function ChartContainer() {
  const { 
    chartConfig, 
    updateChartConfig, 
    dataSources, 
    selectedDataSource 
  } = useDashboard();

  const [activeTab, setActiveTab] = React.useState('main');
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // 获取当前选中的数据源数据
  const currentData = React.useMemo(() => {
    if (!selectedDataSource) return null;
    const source = dataSources.find(s => s.id === selectedDataSource);
    return source ? [source.headers, ...([] as any[])] : null;
  }, [dataSources, selectedDataSource]);

  // 获取第一个数据源作为默认展示
  const defaultDataSource = dataSources[0];
  const displayData = currentData || (defaultDataSource ? [defaultDataSource.headers, ...([] as any[])] : null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleDownload = () => {
    // 下载图表数据
    console.log('下载图表数据');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4"
    >
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">{chartConfig.title}</CardTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs">
                    {CHART_TYPE_LABELS[chartConfig.type] || '柱状图'}
                  </Badge>
                  {selectedDataSource && (
                    <Badge variant="secondary" className="text-xs">
                      {dataSources.find(s => s.id === selectedDataSource)?.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Maximize2 className="w-4 h-4 mr-2" />
                    全屏查看
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    图表设置
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Plus className="w-4 h-4 mr-2" />
                    添加图表
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="main">主视图</TabsTrigger>
              <TabsTrigger value="compare">对比分析</TabsTrigger>
              <TabsTrigger value="detail">详细数据</TabsTrigger>
            </TabsList>

            <TabsContent value="main" className="mt-0">
              {displayData ? (
                <div className="h-[400px]">
                  <DataVisualization 
                    data={displayData} 
                    fileName={defaultDataSource?.name || '数据'}
                  />
                </div>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <BarChart3 className="w-16 h-16 mb-4 text-gray-300" />
                  <p className="text-sm">暂无数据</p>
                  <p className="text-xs mt-1">请从左侧面板选择或上传数据源</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="compare" className="mt-0">
              <div className="h-[400px] flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <BarChart3 className="w-16 h-16 mb-4 text-gray-300" />
                <p className="text-sm">对比分析功能</p>
                <p className="text-xs mt-1">选择多个数据源进行对比</p>
              </div>
            </TabsContent>

            <TabsContent value="detail" className="mt-0">
              <div className="h-[400px] overflow-auto">
                {displayData ? (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        {displayData[0]?.map((header: string, i: number) => (
                          <th key={i} className="px-3 py-2 text-left font-medium text-gray-700">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayData.slice(1, 20).map((row: any[], i: number) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          {row.map((cell: any, j: number) => (
                            <td key={j} className="px-3 py-2 text-gray-600">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <BarChart3 className="w-16 h-16 mb-4 text-gray-300" />
                    <p className="text-sm">暂无数据</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
