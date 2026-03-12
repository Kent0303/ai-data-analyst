'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
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
  TrendingUp, 
  Lightbulb,
  Target,
  AlertCircle,
  CheckCircle2,
  Play,
  Code2
} from 'lucide-react';

interface AIReportViewProps {
  report: string;
  data: any[][];
  onClear: () => void;
}

interface ChartData {
  type: 'bar' | 'pie' | 'line';
  title: string;
  data: any[];
  xKey?: string;
  yKey?: string;
  nameKey?: string;
  valueKey?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4'];

export default function AIReportView({ report, data, onClear }: AIReportViewProps) {
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    if (report && data) {
      const extractedCharts = extractChartsFromReport(report, data);
      const extractedInsights = extractInsights(report);
      setCharts(extractedCharts);
      setInsights(extractedInsights);
    }
  }, [report, data]);

  if (!report) return null;

  return (
    <Card className="bg-gradient-to-br from-white to-blue-50/30 border-blue-100">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">AI 数据分析报告</CardTitle>
            <p className="text-sm text-blue-100 mt-1">智能洞察 · 数据驱动决策</p>
          </div>
        </div>
        <button 
          onClick={onClear}
          className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
        >
          清除报告
        </button>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* 核心洞察 */}
          {insights.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Lightbulb className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">核心洞察</h3>
              </div>
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 自动生成的图表 */}
          {charts.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">可视化分析</h3>
                <Badge variant="secondary" className="ml-auto">
                  {charts.length} 个图表
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {charts.map((chart, index) => (
                  <ChartCard key={index} chart={chart} index={index} />
                ))}
              </div>
            </div>
          )}

          {/* 原始报告文本（可折叠） */}
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer text-gray-500 hover:text-gray-700 transition-colors">
              <Code2 className="w-4 h-4" />
              <span className="text-sm">查看详细分析文本</span>
              <span className="ml-auto text-xs">点击展开</span>
            </summary>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{report}</pre>
            </div>
          </details>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({ chart, index }: { chart: ChartData; index: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        {chart.type === 'bar' && <BarChart3 className="w-5 h-5 text-blue-600" />}
        {chart.type === 'pie' && <Target className="w-5 h-5 text-green-600" />}
        {chart.type === 'line' && <TrendingUp className="w-5 h-5 text-purple-600" />}
        <h4 className="font-semibold text-gray-800">{chart.title}</h4>
        <Badge variant="outline" className="ml-auto text-xs">
          图表 {index + 1}
        </Badge>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === 'bar' && (
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xKey} tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey={chart.yKey} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
          {chart.type === 'pie' && (
            <PieChart>
              <Pie
                data={chart.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                dataKey={chart.valueKey}
                nameKey={chart.nameKey}
              >
                {chart.data.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          )}
          {chart.type === 'line' && (
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xKey} tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey={chart.yKey} 
                stroke={COLORS[index % COLORS.length]} 
                strokeWidth={3}
                dot={{ fill: COLORS[index % COLORS.length] }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// 从报告中提取图表数据
function extractChartsFromReport(report: string, rawData: any[][]): ChartData[] {
  const charts: ChartData[] = [];
  
  if (!rawData || rawData.length < 2) return charts;

  const headers = rawData[0] as string[];
  const rows = rawData.slice(1) as any[][];

  // 1. 课程类型分布（饼图）
  const courseTypeIndex = headers.findIndex(h => h.includes('课程类型') || h.includes('类型'));
  if (courseTypeIndex >= 0) {
    const distribution: Record<string, number> = {};
    rows.forEach(row => {
      const type = String(row[courseTypeIndex] || '未知');
      distribution[type] = (distribution[type] || 0) + 1;
    });
    
    charts.push({
      type: 'pie',
      title: '课程类型分布',
      data: Object.entries(distribution).map(([name, value]) => ({ name, value })),
      nameKey: 'name',
      valueKey: 'value'
    });
  }

  // 2. 教练课程量（柱状图）
  const coachIndex = headers.findIndex(h => h.includes('教练') || h.includes('教练姓名'));
  if (coachIndex >= 0) {
    const coachCounts: Record<string, number> = {};
    rows.forEach(row => {
      const coach = String(row[coachIndex] || '未知');
      coachCounts[coach] = (coachCounts[coach] || 0) + 1;
    });
    
    const sortedCoaches = Object.entries(coachCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    charts.push({
      type: 'bar',
      title: '教练课程量 TOP10',
      data: sortedCoaches.map(([name, count]) => ({ name, count })),
      xKey: 'name',
      yKey: 'count'
    });
  }

  // 3. 时段分布（柱状图）
  const timeIndex = headers.findIndex(h => h.includes('时间') || h.includes('时段') || h.includes('小时'));
  if (timeIndex >= 0) {
    const hourCounts: Record<string, number> = {};
    rows.forEach(row => {
      const timeValue = row[timeIndex];
      let hour = '未知';
      if (typeof timeValue === 'string' && timeValue.includes(':')) {
        hour = timeValue.split(':')[0] + ':00';
      } else if (typeof timeValue === 'number') {
        hour = timeValue + ':00';
      }
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    charts.push({
      type: 'bar',
      title: '时段分布',
      data: Object.entries(hourCounts).map(([hour, count]) => ({ hour, count })),
      xKey: 'hour',
      yKey: 'count'
    });
  }

  // 4. 收入趋势（如果有日期和金额）
  const dateIndex = headers.findIndex(h => h.includes('日期') || h.includes('时间'));
  const amountIndex = headers.findIndex(h => h.includes('金额') || h.includes('价格'));
  
  if (dateIndex >= 0 && amountIndex >= 0) {
    const dailyRevenue: Record<string, number> = {};
    rows.forEach(row => {
      const date = String(row[dateIndex]).substring(0, 10);
      const amount = Number(row[amountIndex]) || 0;
      dailyRevenue[date] = (dailyRevenue[date] || 0) + amount;
    });
    
    const sortedDates = Object.entries(dailyRevenue)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14); // 最近14天
    
    if (sortedDates.length > 1) {
      charts.push({
        type: 'line',
        title: '收入趋势（最近14天）',
        data: sortedDates.map(([date, revenue]) => ({ date, revenue })),
        xKey: 'date',
        yKey: 'revenue'
      });
    }
  }

  return charts;
}

// 提取核心洞察
function extractInsights(report: string): string[] {
  const insights: string[] = [];
  
  // 匹配 "核心发现"、"洞察"、"结论" 等部分
  const lines = report.split('\n');
  let inInsightSection = false;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    // 检测洞察部分开始
    if (/^(核心发现|关键洞察|主要结论|业务洞察)/.test(trimmed)) {
      inInsightSection = true;
      return;
    }
    
    // 检测新章节开始，结束洞察部分
    if (/^(##|###)/.test(trimmed) && !trimmed.includes('发现') && !trimmed.includes('洞察')) {
      inInsightSection = false;
      return;
    }
    
    // 收集洞察内容
    if (inInsightSection && trimmed && !trimmed.startsWith('#')) {
      // 清理 markdown 格式
      const cleanLine = trimmed
        .replace(/^[-•*]\s*/, '')
        .replace(/^\d+\.\s*/, '')
        .replace(/\*\*/g, '');
      
      if (cleanLine.length > 10 && insights.length < 5) {
        insights.push(cleanLine);
      }
    }
  });
  
  return insights;
}
