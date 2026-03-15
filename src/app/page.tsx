'use client';

import { DashboardProvider, ThreeColumnLayout } from '@/components/layout';
import { FilterBar, KPICards, ChartContainer, AIFooter } from '@/components/dashboard';
import MultiFileUpload, { UploadedFile } from '@/components/upload/MultiFileUpload';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useDashboard } from '@/components/layout/DashboardContext';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Brain, LayoutDashboard, Link2, ShieldAlert,
  CheckCircle2, Table2, FileSpreadsheet, Sparkles, ChevronRight,
  Download, X, Zap, Lightbulb, ArrowRight, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingAnimation from '@/components/LoadingAnimation';
import AnalysisHistory, { HistoryItem } from '@/components/AnalysisHistory';
import DataVisualization from '@/components/DataVisualization';
import AIReportView from '@/components/AIReportView';
import EnhancedSmartQuery from '@/components/EnhancedSmartQuery';
import { AlertPanel } from '@/components/alerts';
import { TableType, getTableTypeLabel, getTableTypeDescription } from '@/lib/tableRecognizer';
import { autoLinkTables, DataTable, LinkResult } from '@/lib/dataLinker';
import { generateAnalysisFramework, AnalysisFramework, CombinedInsight, GeneratedAnalysis } from '@/lib/analysisFramework';
import { getAlertEngine, AlertDataSource } from '@/lib/alerts';
import { Member, EntryRecord, Booking, Consumption } from '@/lib/tableRecognizer';

// 分析模板内容组件
function TemplateAnalysisView({ 
  templateId, 
  files, 
  selectedModel 
}: { 
  templateId: string; 
  files: UploadedFile[];
  selectedModel: 'deepseek' | 'kimi';
}) {
  const templateNames: Record<string, string> = {
    'member-lifecycle': '会员生命周期分析',
    'revenue-dashboard': '营收健康度仪表盘',
    'coach-performance': '教练绩效分析',
    'venue-utilization': '场地利用率分析',
  };

  const templateDescriptions: Record<string, string> = {
    'member-lifecycle': '分析会员从注册到流失的全生命周期价值，识别高价值会员和流失风险',
    'revenue-dashboard': '全面展示营收状况，包括收入趋势、成本分析和盈利能力评估',
    'coach-performance': '评估教练授课质量、会员满意度和私教转化率等关键指标',
    'venue-utilization': '分析场地使用效率，识别高峰低谷时段，优化资源配置',
  };

  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<any>(null);

  // 计算统计数据
  useEffect(() => {
    if (files.length === 0) return;
    
    const calculatedStats = calculateStats(files, templateId);
    setStats(calculatedStats);
  }, [files, templateId]);

  // 执行 AI 分析
  useEffect(() => {
    const performAnalysis = async () => {
      if (files.length === 0) return;
      
      setIsAnalyzing(true);
      setError('');
      
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: files.map(f => ({ 
              name: f.name, 
              data: f.data.slice(0, 100),
              headers: f.headers,
              type: f.tableInfo.type 
            })),
            templateId,
            model: selectedModel,
          })
        });
        
        const result = await response.json();
        if (result.success) {
          setAnalysisResult(result.suggestions || result.analysis || '分析完成，但未返回结果');
        } else {
          setError(result.error || '分析失败');
        }
      } catch (err) {
        setError('网络错误，请稍后重试');
      } finally {
        setIsAnalyzing(false);
      }
    };
    
    performAnalysis();
  }, [templateId, files, selectedModel]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{templateNames[templateId] || '分析模板'}</h2>
          <p className="text-gray-500 mt-1">{templateDescriptions[templateId] || '基于上传数据自动生成分析'}</p>
        </div>
        <Badge variant="outline" className="text-sm">{files.length} 个数据源</Badge>
      </div>
      
      {/* 关键指标卡片 */}
      {stats && <KPIGrid stats={stats} templateId={templateId} />}
      
      {/* 可视化图表 */}
      {stats && <AnalysisCharts stats={stats} templateId={templateId} />}
      
      {isAnalyzing ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">AI 正在生成深度分析...</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              基于您上传的 {files.length} 个数据文件，正在使用 {templateNames[templateId]} 模板进行深度分析
            </p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-red-200">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">分析出错</h3>
            <p className="text-red-500 max-w-md mx-auto">{error}</p>
          </CardContent>
        </Card>
      ) : analysisResult ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              AI 深度洞察
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
              <div dangerouslySetInnerHTML={{ 
                __html: formatAnalysisResult(analysisResult)
              }} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* 数据源概览 */}
      <DataSourceOverview files={files} />
    </div>
  );
}

// 格式化分析结果
function formatAnalysisResult(result: string): string {
  return result
    .replace(/\n/g, '<br/>')
    .replace(/#{1,6}\s+(.+)/g, '<h3 class="text-lg font-bold mt-6 mb-3 text-gray-900 border-b pb-2">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-900">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/-\s+(.+)/g, '<li class="ml-4 mb-1">$1</li>')
    .replace(/(\d+\.\s+.+)/g, '<div class="font-medium text-gray-800 mt-3 mb-2">$1</div>');
}

// 计算统计数据
function calculateStats(files: UploadedFile[], templateId: string) {
  const allData = files.flatMap(f => f.data);
  const headers = files[0]?.headers || [];
  
  // 通用统计
  const totalRecords = allData.length;
  
  // 根据模板类型计算不同指标
  switch (templateId) {
    case 'member-lifecycle':
      return calculateMemberStats(allData, headers);
    case 'revenue-dashboard':
      return calculateRevenueStats(allData, headers);
    case 'coach-performance':
      return calculateCoachStats(allData, headers);
    case 'venue-utilization':
      return calculateVenueStats(allData, headers);
    default:
      return { totalRecords };
  }
}

// 会员生命周期统计
function calculateMemberStats(data: any[], headers: string[]) {
  const statusIdx = headers.findIndex(h => h.includes('状态') || h.includes('status') || h.includes('预约状态'));
  const typeIdx = headers.findIndex(h => h.includes('类型') || h.includes('课程类型') || h.includes('type'));
  const amountIdx = headers.findIndex(h => h.includes('金额') || h.includes('价格') || h.includes('amount'));
  
  const statusCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  let totalAmount = 0;
  let completedCount = 0;
  let cancelledCount = 0;
  
  data.forEach(row => {
    if (statusIdx >= 0) {
      const status = row[statusIdx];
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      if (status?.includes('完成') || status?.includes('已签到')) completedCount++;
      if (status?.includes('取消')) cancelledCount++;
    }
    if (typeIdx >= 0) {
      const type = row[typeIdx];
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }
    if (amountIdx >= 0) {
      const amount = parseFloat(row[amountIdx]) || 0;
      totalAmount += amount;
    }
  });
  
  return {
    totalRecords: data.length,
    statusCounts,
    typeCounts,
    totalAmount,
    completedCount,
    cancelledCount,
    completionRate: data.length > 0 ? Math.round((completedCount / data.length) * 100) : 0,
  };
}

// 营收统计
function calculateRevenueStats(data: any[], headers: string[]) {
  const amountIdx = headers.findIndex(h => h.includes('金额') || h.includes('价格') || h.includes('amount') || h.includes('实收'));
  const typeIdx = headers.findIndex(h => h.includes('类型') || h.includes('课程类型'));
  const dateIdx = headers.findIndex(h => h.includes('日期') || h.includes('时间') || h.includes('date'));
  
  let totalRevenue = 0;
  const revenueByType: Record<string, number> = {};
  const revenueByDate: Record<string, number> = {};
  
  data.forEach(row => {
    const amount = amountIdx >= 0 ? parseFloat(row[amountIdx]) || 0 : 0;
    totalRevenue += amount;
    
    if (typeIdx >= 0) {
      const type = row[typeIdx] || '其他';
      revenueByType[type] = (revenueByType[type] || 0) + amount;
    }
    
    if (dateIdx >= 0) {
      const date = row[dateIdx]?.split(' ')[0] || '未知';
      revenueByDate[date] = (revenueByDate[date] || 0) + amount;
    }
  });
  
  return {
    totalRecords: data.length,
    totalRevenue,
    revenueByType,
    revenueByDate,
    avgOrderValue: data.length > 0 ? totalRevenue / data.length : 0,
  };
}

// 教练绩效统计
function calculateCoachStats(data: any[], headers: string[]) {
  const coachIdx = headers.findIndex(h => h.includes('教练') || h.includes('老师') || h.includes('coach'));
  const statusIdx = headers.findIndex(h => h.includes('状态') || h.includes('status'));
  
  const coachStats: Record<string, { count: number; completed: number }> = {};
  
  data.forEach(row => {
    if (coachIdx >= 0) {
      const coach = row[coachIdx] || '未知教练';
      if (!coachStats[coach]) {
        coachStats[coach] = { count: 0, completed: 0 };
      }
      coachStats[coach].count++;
      
      if (statusIdx >= 0) {
        const status = row[statusIdx];
        if (status?.includes('完成') || status?.includes('已签到')) {
          coachStats[coach].completed++;
        }
      }
    }
  });
  
  return {
    totalRecords: data.length,
    coachStats,
    coachCount: Object.keys(coachStats).length,
  };
}

// 场地利用率统计
function calculateVenueStats(data: any[], headers: string[]) {
  const timeIdx = headers.findIndex(h => h.includes('时间') || h.includes('时段') || h.includes('time'));
  const statusIdx = headers.findIndex(h => h.includes('状态') || h.includes('status'));
  
  const hourCounts: Record<string, number> = {};
  let bookedCount = 0;
  let completedCount = 0;
  
  data.forEach(row => {
    if (timeIdx >= 0) {
      const time = row[timeIdx];
      const hour = time?.split(':')[0] || '未知';
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
    
    if (statusIdx >= 0) {
      const status = row[statusIdx];
      if (status?.includes('预约') || status?.includes('已预约')) bookedCount++;
      if (status?.includes('完成') || status?.includes('已签到')) completedCount++;
    }
  });
  
  return {
    totalRecords: data.length,
    hourCounts,
    bookedCount,
    completedCount,
    utilizationRate: data.length > 0 ? Math.round((completedCount / data.length) * 100) : 0,
  };
}

// KPI 指标卡片组件
function KPIGrid({ stats, templateId }: { stats: any; templateId: string }) {
  const getKPIs = () => {
    switch (templateId) {
      case 'member-lifecycle':
        return [
          { label: '总记录数', value: stats.totalRecords?.toLocaleString() || '0', color: 'bg-blue-500', icon: '👥' },
          { label: '已完成', value: stats.completedCount?.toLocaleString() || '0', color: 'bg-green-500', icon: '✅' },
          { label: '已取消', value: stats.cancelledCount?.toLocaleString() || '0', color: 'bg-red-500', icon: '❌' },
          { label: '完成率', value: `${stats.completionRate || 0}%`, color: 'bg-purple-500', icon: '📊' },
        ];
      case 'revenue-dashboard':
        return [
          { label: '总收入', value: `¥${(stats.totalRevenue || 0).toLocaleString()}`, color: 'bg-green-500', icon: '💰' },
          { label: '订单数', value: stats.totalRecords?.toLocaleString() || '0', color: 'bg-blue-500', icon: '📋' },
          { label: '客单价', value: `¥${Math.round(stats.avgOrderValue || 0).toLocaleString()}`, color: 'bg-purple-500', icon: '💵' },
          { label: '收入类型', value: `${Object.keys(stats.revenueByType || {}).length} 种`, color: 'bg-orange-500', icon: '📈' },
        ];
      case 'coach-performance':
        return [
          { label: '总课程数', value: stats.totalRecords?.toLocaleString() || '0', color: 'bg-blue-500', icon: '🏃' },
          { label: '教练人数', value: stats.coachCount?.toString() || '0', color: 'bg-green-500', icon: '👨‍🏫' },
          { label: '人均课程', value: stats.coachCount ? Math.round(stats.totalRecords / stats.coachCount) : 0, color: 'bg-purple-500', icon: '📊' },
          { label: '完成率', value: `${stats.completionRate || 0}%`, color: 'bg-orange-500', icon: '✨' },
        ];
      case 'venue-utilization':
        return [
          { label: '总预约', value: stats.totalRecords?.toLocaleString() || '0', color: 'bg-blue-500', icon: '📅' },
          { label: '已完成', value: stats.completedCount?.toLocaleString() || '0', color: 'bg-green-500', icon: '✅' },
          { label: '利用率', value: `${stats.utilizationRate || 0}%`, color: 'bg-purple-500', icon: '📊' },
          { label: '高峰时段', value: `${Object.keys(stats.hourCounts || {}).length} 个`, color: 'bg-orange-500', icon: '⏰' },
        ];
      default:
        return [];
    }
  };

  const kpis = getKPIs();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi, idx) => (
        <Card key={idx} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{kpi.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
              </div>
              <div className={`w-10 h-10 ${kpi.color} rounded-lg flex items-center justify-center text-white text-lg`}>
                {kpi.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// 分析图表组件
function AnalysisCharts({ stats, templateId }: { stats: any; templateId: string }) {
  const renderChart = () => {
    switch (templateId) {
      case 'member-lifecycle':
        return <StatusDistributionChart data={stats.statusCounts} />;
      case 'revenue-dashboard':
        return <RevenueChart data={stats.revenueByType} total={stats.totalRevenue} />;
      case 'coach-performance':
        return <CoachChart data={stats.coachStats} />;
      case 'venue-utilization':
        return <HourlyChart data={stats.hourCounts} />;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {renderChart()}
      {templateId === 'member-lifecycle' && stats.typeCounts && (
        <TypeDistributionChart data={stats.typeCounts} />
      )}
      {templateId === 'revenue-dashboard' && stats.revenueByDate && (
        <TrendChart data={stats.revenueByDate} />
      )}
    </div>
  );
}

// 状态分布图表
function StatusDistributionChart({ data }: { data: Record<string, number> }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  const colors: Record<string, string> = {
    '已完成': 'bg-green-500',
    '已签到': 'bg-green-500',
    '已取消': 'bg-red-500',
    '取消': 'bg-red-500',
    '已预约': 'bg-blue-500',
    '预约': 'bg-blue-500',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">状态分布</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(data).map(([status, count]) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{status}</span>
                  <span className="font-medium">{count} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${colors[status] || 'bg-gray-400'} rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// 类型分布图表
function TypeDistributionChart({ data }: { data: Record<string, number> }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">类型分布</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(data).map(([type, count], idx) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
            const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
            return (
              <div key={type} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className={`w-12 h-12 ${colors[idx % colors.length]} rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold`}>
                  {percentage.toFixed(0)}%
                </div>
                <p className="text-sm font-medium text-gray-700">{type}</p>
                <p className="text-xs text-gray-500">{count} 条</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// 营收图表
function RevenueChart({ data, total }: { data: Record<string, number>; total: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">收入构成</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(data).map(([type, amount], idx) => {
            const percentage = total > 0 ? (amount / total) * 100 : 0;
            const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500'];
            return (
              <div key={type}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{type}</span>
                  <span className="font-medium">¥{amount.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${colors[idx % colors.length]} rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between">
            <span className="text-gray-600">总收入</span>
            <span className="text-xl font-bold text-green-600">¥{total.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 趋势图表
function TrendChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).slice(-7); // 最近7天
  const maxValue = Math.max(...entries.map(([, v]) => v), 1);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">收入趋势（最近7天）</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 h-32">
          {entries.map(([date, value], idx) => {
            const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className="w-full bg-blue-500 rounded-t transition-all duration-500 hover:bg-blue-600"
                  style={{ height: `${Math.max(height, 5)}%` }}
                  title={`${date}: ¥${value.toLocaleString()}`}
                />
                <span className="text-xs text-gray-500">{date.slice(5)}</span>
                <span className="text-xs font-medium">¥{(value / 1000).toFixed(1)}k</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// 教练图表
function CoachChart({ data }: { data: Record<string, { count: number; completed: number }> }) {
  const sortedCoaches = Object.entries(data)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5);
  
  const maxCount = Math.max(...sortedCoaches.map(([, stats]) => stats.count), 1);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">教练工作量 TOP5</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedCoaches.map(([coach, stats]) => {
            const completionRate = stats.count > 0 ? (stats.completed / stats.count) * 100 : 0;
            return (
              <div key={coach}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{coach}</span>
                  <span className="text-gray-500">{stats.count} 节课 ({completionRate.toFixed(0)}% 完成)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${(stats.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// 时段分布图表
function HourlyChart({ data }: { data: Record<string, number> }) {
  const sortedHours = Object.entries(data).sort(([a], [b]) => parseInt(a) - parseInt(b));
  const maxCount = Math.max(...sortedHours.map(([, v]) => v), 1);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">时段分布</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-32 overflow-x-auto">
          {sortedHours.map(([hour, count]) => {
            const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return (
              <div key={hour} className="flex-1 flex flex-col items-center gap-1 min-w-[40px]">
                <div 
                  className="w-full bg-orange-500 rounded-t transition-all duration-500 hover:bg-orange-600"
                  style={{ height: `${Math.max(height, 5)}%` }}
                  title={`${hour}:00 - ${count} 次`}
                />
                <span className="text-xs text-gray-500">{hour}h</span>
                <span className="text-xs font-medium">{count}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// 数据源概览组件
function DataSourceOverview({ files }: { files: UploadedFile[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          数据源概览
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate text-sm">{file.name}</p>
                <p className="text-xs text-gray-500">{file.rowCount.toLocaleString()} 行 · {file.headers.length} 列</p>
              </div>
              <Badge variant="outline">{getTableTypeLabel(file.tableInfo.type)}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// 页面内容组件
function PageContent({ showAlertPanel, setShowAlertPanel }: { showAlertPanel: boolean; setShowAlertPanel: (show: boolean) => void }) {
  const { setDataSources, setAlertCount, selectedModel, addAIMessage, setAILoading, selectedTemplate, setSelectedTemplate } = useDashboard();
  
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyzing' | 'ready'>('upload');
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [aiReport, setAiReport] = useState('');
  const [linkResult, setLinkResult] = useState<LinkResult | null>(null);
  const [analysisFramework, setAnalysisFramework] = useState<GeneratedAnalysis | null>(null);
  const [showModelSelect, setShowModelSelect] = useState(false);
  const alertEngine = useMemo(() => getAlertEngine(), []);

  // 同步 files 到全局状态
  useEffect(() => {
    if (files.length > 0) {
      const sources = files.map(file => ({
        id: file.id,
        name: file.name,
        type: file.tableInfo.type,
        rowCount: file.rowCount,
        headers: file.headers,
        data: file.data,
      }));
      setDataSources(sources);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const handleFilesUploaded = useCallback((uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    if (uploadedFiles.length > 0) {
      setCurrentStep('analyzing');
      performDataAnalysis(uploadedFiles);
    }
  }, []);

  const performDataAnalysis = async (uploadedFiles: UploadedFile[]) => {
    setIsLoading(true);
    setAILoading(true);
    try {
      const dataTables: DataTable[] = uploadedFiles.map(file => ({
        id: file.id, name: file.name, type: file.tableInfo.type, headers: file.headers, data: file.data, rowCount: file.rowCount,
      }));
      const linkResult = autoLinkTables(dataTables);
      setLinkResult(linkResult);
      const framework = generateAnalysisFramework(dataTables, linkResult.linkedTables, linkResult.joinGraph);
      setAnalysisFramework(framework);
      
      const response = await fetch('/api/analyze', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          files: uploadedFiles.map(f => ({ name: f.name, data: f.data, type: f.tableInfo.type })), 
          linkResult, 
          framework, 
          model: selectedModel 
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setAiReport(result.suggestions);
        addAIMessage({ role: 'assistant', content: result.suggestions });
        setCurrentStep('ready');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setCurrentStep('upload');
    } finally {
      setIsLoading(false);
      setAILoading(false);
    }
  };

  const handleClear = () => {
    setFiles([]);
    setAiReport('');
    setLinkResult(null);
    setAnalysisFramework(null);
    setCurrentStep('upload');
    setAlertCount(0);
    setDataSources([]);
  };

  const handleExport = () => {
    const reportContent = `# 数据分析报告\n\n生成时间：${new Date().toLocaleString('zh-CN')}\n\n`;
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `分析报告_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
  };

  // 上传区域
  if (currentStep === 'upload') {
    return (
      <div className="p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
          <MultiFileUpload onFilesUploaded={handleFilesUploaded} maxFiles={10} maxFileSize={50} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { icon: Upload, title: '多文件上传', desc: '支持同时上传多个Excel/CSV' },
              { icon: Brain, title: '智能识别', desc: '自动识别表格类型' },
              { icon: Link2, title: '自动关联', desc: '基于共同字段关联多表' },
              { icon: ShieldAlert, title: '智能预警', desc: '自动检测经营风险' }
            ].map((feature) => (
              <div key={feature.title} className="text-center p-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="w-6 h-6 text-gray-600" />
                </div>
                <h3 className="font-medium text-gray-800 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <AnalysisHistory onSelectHistory={() => {}} currentFileName={files[0]?.name} />
          </div>
        </motion.div>
      </div>
    );
  }

  // 分析中
  if (currentStep === 'analyzing') {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingAnimation message="AI 正在分析您的数据..." type="analysis" />
        {files.length > 0 && (
          <div className="mt-8 max-w-2xl w-full px-4">
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{file.name}</span>
                      <Badge variant="outline" className="text-xs">{getTableTypeLabel(file.tableInfo.type)}</Badge>
                    </div>
                    <p className="text-xs text-gray-500">{file.rowCount.toLocaleString()} 行数据</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 结果展示 - 三栏布局内容
  
  // 如果有选中的分析模板，显示模板分析视图
  if (selectedTemplate) {
    return <TemplateAnalysisView templateId={selectedTemplate} files={files} selectedModel={selectedModel} />;
  }
  
  // 如果显示预警面板
  if (showAlertPanel) {
    const memberFile = files.find(f => f.tableInfo.type === 'member_list');
    const consumptionFile = files.find(f => f.tableInfo.type === 'consumption_record');
    const entryFile = files.find(f => f.tableInfo.type === 'entry_record');
    const bookingFile = files.find(f => f.tableInfo.type === 'private_class_booking' || f.tableInfo.type === 'group_class_booking');
    
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">智能预警中心</h2>
            <p className="text-gray-500 mt-1">自动检测经营风险，及时预警</p>
          </div>
          <Button variant="outline" onClick={() => setShowAlertPanel(false)}>
            返回概览
          </Button>
        </div>
        <AlertPanel 
          dataSource={files.length > 0 ? {
            members: memberFile?.data?.map((row: any) => ({
              id: row[0] || '', 
              name: row[1] || '', 
              phone: row[2], 
              registerDate: row[3] || new Date().toISOString(), 
              status: row[4]
            })) || [],
            consumptions: consumptionFile?.data?.map((row: any) => ({
              id: row[0] || '', 
              memberId: row[1] || '', 
              amount: parseFloat(row[2]) || 0, 
              date: row[3] || new Date().toISOString(), 
              type: row[4] || 'other'
            })) || [],
            entries: entryFile?.data?.map((row: any) => ({
              id: row[0] || '', 
              memberId: row[1] || '', 
              entryTime: row[2] || new Date().toISOString(), 
              exitTime: row[3]
            })) || [],
            bookings: bookingFile?.data?.map((row: any) => ({
              id: row[0] || '', 
              memberId: row[1] || '', 
              coachId: row[2], 
              bookingTime: row[3] || new Date().toISOString(), 
              type: bookingFile?.tableInfo.type === 'private_class_booking' ? 'private' : 'group'
            })) || [],
          } : undefined}
        />
      </div>
    );
  }
  
  return (
    <>
      {/* 筛选栏 */}
      <FilterBar />
      
      {/* KPI卡片 */}
      <KPICards />
      
      {/* 图表容器 */}
      <ChartContainer />
      
      {/* AI对话区 */}
      <div className="flex-1">
        <AIFooter />
      </div>
    </>
  );
}

// 主页面
export default function DataAnalystPage() {
  const [showAlertPanel, setShowAlertPanel] = useState(false);
  
  return (
    <ErrorBoundary>
      <DashboardProvider>
        <ThreeColumnLayout 
          onTemplateClick={() => setShowAlertPanel(false)}
          onAlertClick={() => setShowAlertPanel(true)}
        >
          <PageContentWrapper showAlertPanel={showAlertPanel} setShowAlertPanel={setShowAlertPanel} />
        </ThreeColumnLayout>
      </DashboardProvider>
    </ErrorBoundary>
  );
}

// 包装组件以访问 DashboardContext
function PageContentWrapper({ showAlertPanel, setShowAlertPanel }: { showAlertPanel: boolean; setShowAlertPanel: (show: boolean) => void }) {
  return <PageContent showAlertPanel={showAlertPanel} setShowAlertPanel={setShowAlertPanel} />;
}
