'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Table,
  Download,
  ScatterChart as ScatterIcon,
  Radar as RadarIcon,
  Grid3X3
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DataVisualizationProps {
  data: any[][];
  fileName: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

// 热力图颜色映射
const HEATMAP_COLORS = ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'];

export default function DataVisualization({ data, fileName }: DataVisualizationProps) {
  if (!data || data.length < 2) return null;

  const headers = data[0] as string[];
  const rows = data.slice(1) as any[][];

  // 分析数据类型
  const columnAnalysis = headers.map((header, index) => {
    const values = rows.map(row => row[index]).filter(v => v !== undefined && v !== null && v !== '');
    const numericValues = values.filter(v => !isNaN(Number(v)) && v !== '');
    const isNumeric = numericValues.length > values.length * 0.5;
    
    // 统计唯一值
    const valueCounts: Record<string, number> = {};
    values.forEach(v => {
      const key = String(v);
      valueCounts[key] = (valueCounts[key] || 0) + 1;
    });
    
    return {
      header,
      index,
      isNumeric,
      valueCounts,
      uniqueValues: Object.keys(valueCounts).length,
      totalValues: values.length
    };
  });

  // 找到分类列（唯一值较少）和数值列
  const categoryColumns = columnAnalysis.filter(col => !col.isNumeric && col.uniqueValues <= 20);
  const numericColumns = columnAnalysis.filter(col => col.isNumeric);

  // 生成柱状图数据
  const generateBarData = () => {
    if (categoryColumns.length === 0 || numericColumns.length === 0) return [];
    
    const catCol = categoryColumns[0];
    const numCol = numericColumns[0];
    
    const aggregated: Record<string, number> = {};
    rows.forEach(row => {
      const category = String(row[catCol.index] || '未知');
      const value = Number(row[numCol.index]) || 0;
      aggregated[category] = (aggregated[category] || 0) + value;
    });
    
    return Object.entries(aggregated)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  // 生成饼图数据
  const generatePieData = () => {
    if (categoryColumns.length === 0) return [];
    
    const catCol = categoryColumns[0];
    const data: Record<string, number> = {};
    
    rows.forEach(row => {
      const key = String(row[catCol.index] || '未知');
      data[key] = (data[key] || 0) + 1;
    });
    
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };

  // 生成趋势图数据（如果有日期列）
  const generateTrendData = () => {
    const dateCol = columnAnalysis.find(col => {
      const sample = rows.slice(0, 5).map(row => String(row[col.index]));
      return sample.some(v => /\d{4}[-/]\d{1,2}/.test(v));
    });
    
    if (!dateCol || numericColumns.length === 0) return [];
    
    const numCol = numericColumns[0];
    const aggregated: Record<string, number> = {};
    
    rows.forEach(row => {
      const date = String(row[dateCol.index]).substring(0, 10);
      const value = Number(row[numCol.index]) || 0;
      aggregated[date] = (aggregated[date] || 0) + value;
    });
    
    return Object.entries(aggregated)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-20);
  };

  // 生成散点图数据
  const generateScatterData = () => {
    if (numericColumns.length < 2) return [];
    
    const xCol = numericColumns[0];
    const yCol = numericColumns[1];
    
    return rows
      .filter(row => {
        const x = Number(row[xCol.index]);
        const y = Number(row[yCol.index]);
        return !isNaN(x) && !isNaN(y);
      })
      .map((row, index) => ({
        x: Number(row[xCol.index]),
        y: Number(row[yCol.index]),
        name: categoryColumns.length > 0 ? String(row[categoryColumns[0].index] || `数据${index + 1}`) : `数据${index + 1}`,
        z: Math.abs(Number(row[xCol.index]) + Number(row[yCol.index])) / 2
      }))
      .slice(0, 100); // 限制数据点数量
  };

  // 生成雷达图数据
  const generateRadarData = () => {
    if (categoryColumns.length === 0 || numericColumns.length === 0) return [];
    
    const catCol = categoryColumns[0];
    const numCol = numericColumns[0];
    
    const aggregated: Record<string, number> = {};
    rows.forEach(row => {
      const category = String(row[catCol.index] || '未知');
      const value = Number(row[numCol.index]) || 0;
      aggregated[category] = (aggregated[category] || 0) + value;
    });
    
    const maxValue = Math.max(...Object.values(aggregated));
    
    return Object.entries(aggregated)
      .map(([subject, value]) => ({
        subject,
        value,
        fullMark: maxValue
      }))
      .slice(0, 8);
  };

  // 生成热力图数据
  const generateHeatmapData = () => {
    if (categoryColumns.length < 2 && !(categoryColumns.length === 1 && numericColumns.length >= 1)) return null;
    
    let xCol: typeof categoryColumns[0], yCol: typeof categoryColumns[0], valueCol: typeof numericColumns[0] | undefined;
    
    if (categoryColumns.length >= 2) {
      xCol = categoryColumns[0];
      yCol = categoryColumns[1];
      // 如果没有数值列，使用计数
      if (numericColumns.length > 0) {
        valueCol = numericColumns[0];
      }
    } else {
      return null;
    }
    
    const heatmapData: Record<string, Record<string, number>> = {};
    const xValues = new Set<string>();
    const yValues = new Set<string>();
    
    rows.forEach(row => {
      const xVal = String(row[xCol.index] || '未知');
      const yVal = String(row[yCol.index] || '未知');
      const value = valueCol ? (Number(row[valueCol.index]) || 0) : 1;
      
      xValues.add(xVal);
      yValues.add(yVal);
      
      if (!heatmapData[xVal]) heatmapData[xVal] = {};
      heatmapData[xVal][yVal] = (heatmapData[xVal][yVal] || 0) + value;
    });
    
    const xArray = Array.from(xValues).slice(0, 10);
    const yArray = Array.from(yValues).slice(0, 10);
    
    // 找出最大值用于颜色映射
    let maxValue = 0;
    xArray.forEach(x => {
      yArray.forEach(y => {
        maxValue = Math.max(maxValue, heatmapData[x]?.[y] || 0);
      });
    });
    
    return {
      xLabels: xArray,
      yLabels: yArray,
      data: heatmapData,
      maxValue,
      xLabel: xCol.header,
      yLabel: yCol.header
    };
  };

  const barData = generateBarData();
  const pieData = generatePieData();
  const trendData = generateTrendData();
  const scatterData = generateScatterData();
  const radarData = generateRadarData();
  const heatmapData = generateHeatmapData();

  // 获取热力图颜色
  const getHeatmapColor = (value: number, maxValue: number) => {
    if (maxValue === 0) return HEATMAP_COLORS[0];
    const ratio = value / maxValue;
    const colorIndex = Math.min(Math.floor(ratio * HEATMAP_COLORS.length), HEATMAP_COLORS.length - 1);
    return HEATMAP_COLORS[colorIndex];
  };

  // 下载 CSV
  const downloadCSV = () => {
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName.replace(/\.[^/.]+$/, '')}_data.csv`;
    link.click();
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          数据可视化分析
        </CardTitle>
        <Button variant="outline" size="sm" onClick={downloadCSV}>
          <Download className="w-4 h-4 mr-1" />
          导出 CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4 flex-wrap">
          <Badge variant="secondary">{rows.length} 行数据</Badge>
          <Badge variant="secondary">{headers.length} 列</Badge>
          {categoryColumns.length > 0 && (
            <Badge variant="outline">分类列: {categoryColumns.map(c => c.header).join(', ')}</Badge>
          )}
          {numericColumns.length > 0 && (
            <Badge variant="outline">数值列: {numericColumns.map(c => c.header).join(', ')}</Badge>
          )}
        </div>

        <Tabs defaultValue="bar" className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(7, 3 + (scatterData.length > 0 ? 1 : 0) + (radarData.length > 0 ? 1 : 0) + (heatmapData ? 1 : 0))}, 1fr)` }}>
            <TabsTrigger value="bar" className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              柱状图
            </TabsTrigger>
            <TabsTrigger value="pie" className="flex items-center gap-1">
              <PieChartIcon className="w-4 h-4" />
              饼图
            </TabsTrigger>
            {trendData.length > 0 && (
              <TabsTrigger value="trend" className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                趋势图
              </TabsTrigger>
            )}
            {scatterData.length > 0 && (
              <TabsTrigger value="scatter" className="flex items-center gap-1">
                <ScatterIcon className="w-4 h-4" />
                散点图
              </TabsTrigger>
            )}
            {radarData.length > 0 && (
              <TabsTrigger value="radar" className="flex items-center gap-1">
                <RadarIcon className="w-4 h-4" />
                雷达图
              </TabsTrigger>
            )}
            {heatmapData && (
              <TabsTrigger value="heatmap" className="flex items-center gap-1">
                <Grid3X3 className="w-4 h-4" />
                热力图
              </TabsTrigger>
            )}
            <TabsTrigger value="table" className="flex items-center gap-1">
              <Table className="w-4 h-4" />
              数据表
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bar" className="h-80">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                未找到适合柱状图的数据（需要分类列和数值列）
              </div>
            )}
          </TabsContent>

          <TabsContent value="pie" className="h-80">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                未找到适合饼图的数据
              </div>
            )}
          </TabsContent>

          {trendData.length > 0 && (
            <TabsContent value="trend" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#00C49F" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          )}

          {scatterData.length > 0 && (
            <TabsContent value="scatter" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name={numericColumns[0]?.header || 'X轴'} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name={numericColumns[1]?.header || 'Y轴'} 
                  />
                  <ZAxis type="number" dataKey="z" range={[50, 400]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Legend />
                  <Scatter 
                    name={`${numericColumns[0]?.header || 'X'} vs ${numericColumns[1]?.header || 'Y'}`} 
                    data={scatterData} 
                    fill="#8884d8"
                  >
                    {scatterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </TabsContent>
          )}

          {radarData.length > 0 && (
            <TabsContent value="radar" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis />
                  <Radar
                    name={numericColumns[0]?.header || '数值'}
                    dataKey="value"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </TabsContent>
          )}

          {heatmapData && (
            <TabsContent value="heatmap" className="h-80 overflow-auto">
              <div className="h-full flex flex-col">
                <div className="text-sm text-gray-600 mb-2 text-center">
                  {heatmapData.xLabel} × {heatmapData.yLabel}
                </div>
                <div className="flex-1 overflow-auto">
                  <div className="inline-block">
                    {/* 表头 */}
                    <div className="flex">
                      <div className="w-24 h-10 flex items-center justify-center bg-gray-100 border text-xs font-medium sticky left-0 z-10">
                        {heatmapData.yLabel} \ {heatmapData.xLabel}
                      </div>
                      {heatmapData.xLabels.map((xLabel, i) => (
                        <div 
                          key={i} 
                          className="w-20 h-10 flex items-center justify-center bg-gray-50 border text-xs font-medium"
                          title={xLabel}
                        >
                          <span className="truncate px-1">{xLabel}</span>
                        </div>
                      ))}
                    </div>
                    {/* 数据行 */}
                    {heatmapData.yLabels.map((yLabel, rowIndex) => (
                      <div key={rowIndex} className="flex">
                        <div 
                          className="w-24 h-10 flex items-center justify-center bg-gray-50 border text-xs font-medium sticky left-0 z-10"
                          title={yLabel}
                        >
                          <span className="truncate px-1">{yLabel}</span>
                        </div>
                        {heatmapData.xLabels.map((xLabel, colIndex) => {
                          const value = heatmapData.data[xLabel]?.[yLabel] || 0;
                          return (
                            <div 
                              key={colIndex}
                              className="w-20 h-10 flex items-center justify-center border text-xs relative group cursor-pointer"
                              style={{ backgroundColor: getHeatmapColor(value, heatmapData.maxValue) }}
                            >
                              <span className={value > heatmapData.maxValue / 2 ? 'text-white' : 'text-gray-800'}>
                                {value}
                              </span>
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                {heatmapData.xLabel}: {xLabel}<br/>
                                {heatmapData.yLabel}: {yLabel}<br/>
                                数值: {value}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                {/* 图例 */}
                <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-600">
                  <span>低</span>
                  {HEATMAP_COLORS.map((color, i) => (
                    <div 
                      key={i} 
                      className="w-6 h-4 rounded" 
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <span>高</span>
                </div>
              </div>
            </TabsContent>
          )}

          <TabsContent value="table" className="h-80 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  {headers.map((h, i) => (
                    <th key={i} className="px-2 py-1 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 100).map((row, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    {row.map((cell, j) => (
                      <td key={j} className="px-2 py-1">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 100 && (
              <div className="text-center text-gray-500 py-2">
                ... 还有 {rows.length - 100} 行数据 ...
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
