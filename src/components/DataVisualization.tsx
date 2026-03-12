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
  Line
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Table,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DataVisualizationProps {
  data: any[][];
  fileName: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

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

  const barData = generateBarData();
  const pieData = generatePieData();
  const trendData = generateTrendData();

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
          <TabsList className="grid w-full grid-cols-4">
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
