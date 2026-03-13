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
  TrendingUp, 
  Lightbulb,
  Target,
  AlertCircle,
  CheckCircle2,
  Play,
  Code2,
  X,
  ScatterChart as ScatterIcon,
  Radar as RadarIcon
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AIReportViewProps {
  report: string;
  data: any[][];
  fileName?: string;
  onClear: () => void;
}

interface ChartData {
  type: 'bar' | 'pie' | 'line' | 'scatter' | 'radar';
  title: string;
  data: any[];
  xKey?: string;
  yKey?: string;
  nameKey?: string;
  valueKey?: string;
  description?: string;
}

interface ReportSection {
  title: string;
  content: string;
  charts?: ChartData[];
  type: 'overview' | 'insight' | 'chart' | 'recommendation' | 'detail';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4'];

export default function AIReportView({ report, data, fileName, onClear }: AIReportViewProps) {
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [charts, setCharts] = useState<ChartData[]>([]);

  useEffect(() => {
    if (report && data) {
      const parsedSections = parseReportToSections(report, data);
      setSections(parsedSections);
      
      // 提取所有图表
      const allCharts: ChartData[] = [];
      parsedSections.forEach(section => {
        if (section.charts) {
          allCharts.push(...section.charts);
        }
      });
      setCharts(allCharts);
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
            <p className="text-sm text-blue-100 mt-1">
              {fileName ? `文件: ${fileName}` : '智能洞察 · 数据驱动决策'}
            </p>
          </div>
        </div>
        <button 
          onClick={onClear}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          title="关闭报告"
        >
          <X className="w-5 h-5" />
        </button>
      </CardHeader>
      
      <CardContent className="p-6">
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-8">
            {sections.map((section, index) => (
              <ReportSectionComponent key={index} section={section} index={index} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ReportSectionComponent({ section, index }: { section: ReportSection; index: number }) {
  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'overview':
        return <Target className="w-5 h-5 text-blue-600" />;
      case 'insight':
        return <Lightbulb className="w-5 h-5 text-amber-600" />;
      case 'chart':
        return <BarChart3 className="w-5 h-5 text-green-600" />;
      case 'recommendation':
        return <CheckCircle2 className="w-5 h-5 text-purple-600" />;
      default:
        return <Code2 className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSectionBg = (type: string) => {
    switch (type) {
      case 'overview':
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200';
      case 'insight':
        return 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200';
      case 'chart':
        return 'bg-white border-gray-200';
      case 'recommendation':
        return 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`rounded-xl border p-5 ${getSectionBg(section.type)}`}>
      {/* 章节标题 */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${section.type === 'insight' ? 'bg-amber-100' : section.type === 'overview' ? 'bg-blue-100' : section.type === 'recommendation' ? 'bg-purple-100' : 'bg-gray-100'}`}>
          {getSectionIcon(section.type)}
        </div>
        <h3 className="text-lg font-bold text-gray-800">{section.title}</h3>
        {section.charts && section.charts.length > 0 && (
          <Badge variant="secondary" className="ml-auto">
            {section.charts.length} 个图表
          </Badge>
        )}
      </div>

      {/* 章节内容 */}
      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">
        {section.content}
      </div>

      {/* 相关图表 */}
      {section.charts && section.charts.length > 0 && (
        <div className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {section.charts.map((chart, chartIndex) => (
              <ChartCard key={chartIndex} chart={chart} index={chartIndex} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChartCard({ chart, index }: { chart: ChartData; index: number }) {
  const getChartIcon = (type: string) => {
    switch (type) {
      case 'bar':
        return <BarChart3 className="w-5 h-5 text-blue-600" />;
      case 'pie':
        return <Target className="w-5 h-5 text-green-600" />;
      case 'line':
        return <TrendingUp className="w-5 h-5 text-purple-600" />;
      case 'scatter':
        return <ScatterIcon className="w-5 h-5 text-orange-600" />;
      case 'radar':
        return <RadarIcon className="w-5 h-5 text-pink-600" />;
      default:
        return <BarChart3 className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        {getChartIcon(chart.type)}
        <h4 className="font-semibold text-gray-800 text-sm">{chart.title}</h4>
        <Badge variant="outline" className="ml-auto text-xs">
          {chart.type === 'bar' ? '柱状图' : chart.type === 'pie' ? '饼图' : chart.type === 'line' ? '趋势图' : chart.type === 'scatter' ? '散点图' : '雷达图'}
        </Badge>
      </div>
      
      {chart.description && (
        <p className="text-xs text-gray-500 mb-3">{chart.description}</p>
      )}
      
      <div className="h-48">
        {chart.type === 'bar' && chart.yKey && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xKey} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey={chart.yKey} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
        
        {chart.type === 'pie' && chart.valueKey && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chart.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                outerRadius={60}
                dataKey={chart.valueKey}
                nameKey={chart.nameKey}
              >
                {chart.data.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend fontSize={10} />
            </PieChart>
          </ResponsiveContainer>
        )}
        
        {chart.type === 'line' && chart.yKey && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xKey} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey={chart.yKey} 
                stroke={COLORS[index % COLORS.length]} 
                strokeWidth={2}
                dot={{ fill: COLORS[index % COLORS.length], r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {chart.type === 'scatter' && chart.xKey && chart.yKey && (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey={chart.xKey} tick={{ fontSize: 10 }} />
              <YAxis type="number" dataKey={chart.yKey} tick={{ fontSize: 10 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={chart.data} fill={COLORS[index % COLORS.length]} />
            </ScatterChart>
          </ResponsiveContainer>
        )}

        {chart.type === 'radar' && (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chart.data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
              <PolarRadiusAxis tick={{ fontSize: 9 }} />
              <Radar
                dataKey="value"
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// 将报告解析为结构化章节
function parseReportToSections(report: string, rawData: any[][]): ReportSection[] {
  const sections: ReportSection[] = [];
  
  if (!rawData || rawData.length < 2) {
    return [{
      title: '分析报告',
      content: report,
      type: 'detail'
    }];
  }

  const headers = rawData[0] as string[];
  const rows = rawData.slice(1) as any[][];

  // 1. 数据概览章节
  const overviewSection: ReportSection = {
    title: '数据概览',
    content: `本次分析包含 **${rows.length}** 条数据记录，共 **${headers.length}** 个字段。`,
    type: 'overview',
    charts: []
  };

  // 检测数据类型并生成概览图表
  const numericColumns = headers.filter((h, i) => {
    const values = rows.slice(0, 20).map(row => row[i]).filter(v => v !== undefined && v !== null && v !== '');
    const numCount = values.filter(v => !isNaN(Number(v))).length;
    return numCount > values.length * 0.7;
  });

  const categoryColumns = headers.filter((h, i) => {
    const values = rows.map(row => row[i]).filter(v => v !== undefined && v !== null && v !== '');
    const uniqueCount = new Set(values).size;
    return uniqueCount <= 20 && uniqueCount > 1;
  });

  if (categoryColumns.length > 0) {
    const catColIndex = headers.indexOf(categoryColumns[0]);
    const distribution: Record<string, number> = {};
    rows.forEach(row => {
      const type = String(row[catColIndex] || '未知');
      distribution[type] = (distribution[type] || 0) + 1;
    });
    
    overviewSection.charts!.push({
      type: 'pie',
      title: `${categoryColumns[0]}分布`,
      description: `展示不同${categoryColumns[0]}类别的数据分布情况`,
      data: Object.entries(distribution).map(([name, value]) => ({ name, value })).slice(0, 8),
      nameKey: 'name',
      valueKey: 'value'
    });
  }

  sections.push(overviewSection);

  // 2. 核心洞察章节
  const insights = extractInsightsFromReport(report);
  if (insights.length > 0) {
    const insightSection: ReportSection = {
      title: '核心洞察',
      content: insights.map((insight, i) => `${i + 1}. ${insight}`).join('\n\n'),
      type: 'insight'
    };
    sections.push(insightSection);
  }

  // 3. 详细分析章节（带图表）
  const analysisSection: ReportSection = {
    title: '详细数据分析',
    content: '基于数据特征，我们生成了以下可视化图表来辅助理解：',
    type: 'chart',
    charts: []
  };

  // 教练/分类分析
  const nameColIndex = headers.findIndex(h => 
    h.includes('教练') || h.includes('姓名') || h.includes('名称') || h.includes('类别')
  );
  
  if (nameColIndex >= 0 && numericColumns.length > 0) {
    const numColIndex = headers.indexOf(numericColumns[0]);
    const aggregated: Record<string, number> = {};
    rows.forEach(row => {
      const name = String(row[nameColIndex] || '未知');
      const value = Number(row[numColIndex]) || 0;
      aggregated[name] = (aggregated[name] || 0) + value;
    });
    
    const sortedData = Object.entries(aggregated)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    analysisSection.charts!.push({
      type: 'bar',
      title: `${headers[nameColIndex]} TOP10`,
      description: `按${numericColumns[0]}统计的前10名`,
      data: sortedData.map(([name, value]) => ({ name, value })),
      xKey: 'name',
      yKey: 'value'
    });
  }

  // 时间趋势分析
  const dateColIndex = headers.findIndex(h => 
    h.includes('日期') || h.includes('时间') || h.includes('Date')
  );
  
  if (dateColIndex >= 0 && numericColumns.length > 0) {
    const numColIndex = headers.indexOf(numericColumns[0]);
    const dailyData: Record<string, number> = {};
    rows.forEach(row => {
      const date = String(row[dateColIndex]).substring(0, 10);
      const value = Number(row[numColIndex]) || 0;
      dailyData[date] = (dailyData[date] || 0) + value;
    });
    
    const sortedDates = Object.entries(dailyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14);
    
    if (sortedDates.length > 1) {
      analysisSection.charts!.push({
        type: 'line',
        title: `${numericColumns[0]}趋势`,
        description: '最近14天的数据趋势',
        data: sortedDates.map(([date, value]) => ({ date, value })),
        xKey: 'date',
        yKey: 'value'
      });
    }
  }

  // 散点图分析（如果有两个数值列）
  if (numericColumns.length >= 2) {
    const xColIndex = headers.indexOf(numericColumns[0]);
    const yColIndex = headers.indexOf(numericColumns[1]);
    
    const scatterData = rows
      .filter(row => !isNaN(Number(row[xColIndex])) && !isNaN(Number(row[yColIndex])))
      .slice(0, 50)
      .map(row => ({
        x: Number(row[xColIndex]),
        y: Number(row[yColIndex])
      }));
    
    if (scatterData.length > 5) {
      analysisSection.charts!.push({
        type: 'scatter',
        title: `${numericColumns[0]} vs ${numericColumns[1]}`,
        description: '两个数值字段的相关性分析',
        data: scatterData,
        xKey: 'x',
        yKey: 'y'
      });
    }
  }

  // 雷达图分析（多维度）
  if (categoryColumns.length > 0 && numericColumns.length > 0) {
    const catColIndex = headers.indexOf(categoryColumns[0]);
    const numColIndex = headers.indexOf(numericColumns[0]);
    
    const aggregated: Record<string, number> = {};
    rows.forEach(row => {
      const category = String(row[catColIndex] || '未知');
      const value = Number(row[numColIndex]) || 0;
      aggregated[category] = (aggregated[category] || 0) + value;
    });
    
    const maxValue = Math.max(...Object.values(aggregated));
    
    analysisSection.charts!.push({
      type: 'radar',
      title: `${categoryColumns[0]}多维分析`,
      description: '各分类的数值对比',
      data: Object.entries(aggregated)
        .slice(0, 8)
        .map(([subject, value]) => ({ subject, value, fullMark: maxValue }))
    });
  }

  if (analysisSection.charts!.length > 0) {
    sections.push(analysisSection);
  }

  // 4. 建议章节
  const recommendations = extractRecommendationsFromReport(report);
  if (recommendations.length > 0) {
    sections.push({
      title: '行动建议',
      content: recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n\n'),
      type: 'recommendation'
    });
  }

  // 5. 原始报告详情
  sections.push({
    title: '详细分析',
    content: report,
    type: 'detail'
  });

  return sections;
}

// 从报告中提取洞察
function extractInsightsFromReport(report: string): string[] {
  const insights: string[] = [];
  const lines = report.split('\n');
  let inInsightSection = false;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    // 检测洞察部分开始
    if (/^(核心发现|关键洞察|主要结论|业务洞察|数据发现|分析发现)/.test(trimmed)) {
      inInsightSection = true;
      return;
    }
    
    // 检测新章节开始
    if (/^(##|###|建议|结论|总结)/.test(trimmed) && !trimmed.includes('发现') && !trimmed.includes('洞察')) {
      inInsightSection = false;
      return;
    }
    
    // 收集洞察内容
    if (inInsightSection && trimmed && !trimmed.startsWith('#')) {
      const cleanLine = trimmed
        .replace(/^[-•*]\s*/, '')
        .replace(/^\d+\.\s*/, '')
        .replace(/\*\*/g, '');
      
      if (cleanLine.length > 10 && insights.length < 5) {
        insights.push(cleanLine);
      }
    }
  });
  
  // 如果没有提取到洞察，尝试从整个报告中提取关键句子
  if (insights.length === 0) {
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.length > 20 && trimmed.length < 200) {
        if (/^(从数据|分析|可以|发现|表明|显示|说明|建议)/.test(trimmed)) {
          insights.push(trimmed.replace(/\*\*/g, ''));
        }
      }
    });
  }
  
  return insights.slice(0, 5);
}

// 从报告中提取建议
function extractRecommendationsFromReport(report: string): string[] {
  const recommendations: string[] = [];
  const lines = report.split('\n');
  let inRecSection = false;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    if (/^(建议|行动建议|改进建议|优化建议|下一步)/.test(trimmed)) {
      inRecSection = true;
      return;
    }
    
    if (inRecSection && trimmed && !trimmed.startsWith('#')) {
      const cleanLine = trimmed
        .replace(/^[-•*]\s*/, '')
        .replace(/^\d+\.\s*/, '')
        .replace(/\*\*/g, '');
      
      if (cleanLine.length > 10 && recommendations.length < 5) {
        recommendations.push(cleanLine);
      }
    }
  });
  
  return recommendations;
}
