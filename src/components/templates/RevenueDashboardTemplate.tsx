'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Calendar,
  BarChart3
} from 'lucide-react';
import { 
  PieChartComponent, 
  BarChartComponent, 
  LineChartComponent,
  AreaChartComponent,
  GaugeChart 
} from '@/components/charts';
import { calculateRevenueMetrics } from '@/lib/metrics';
import { Consumption, Booking } from '@/lib/tableRecognizer';

interface RevenueDashboardTemplateProps {
  consumptions: Consumption[];
  bookings: Booking[];
  monthlyTarget?: number;
  quarterlyTarget?: number;
}

export function RevenueDashboardTemplate({
  consumptions,
  bookings,
  monthlyTarget = 100000,
  quarterlyTarget = 300000
}: RevenueDashboardTemplateProps) {
  const metrics = useMemo(() => 
    calculateRevenueMetrics(consumptions, bookings, monthlyTarget, quarterlyTarget),
    [consumptions, bookings, monthlyTarget, quarterlyTarget]
  );

  const trendData = useMemo(() => {
    return metrics.trends.daily.map(d => ({
      date: d.date.slice(5),
      revenue: d.revenue
    }));
  }, [metrics.trends.daily]);

  const monthlyTrendData = useMemo(() => {
    return metrics.trends.monthly.map(m => ({
      month: m.month.slice(5),
      revenue: m.revenue
    }));
  }, [metrics.trends.monthly]);

  return (
    <div className="space-y-6">
      {/* 概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="总收入"
          value={metrics.composition.totalRevenue}
          icon={DollarSign}
          color="bg-blue-500"
          prefix="¥"
        />
        <MetricCard
          title="环比增长"
          value={metrics.comparison.momGrowth}
          icon={metrics.comparison.momGrowth >= 0 ? TrendingUp : TrendingDown}
          color={metrics.comparison.momGrowth >= 0 ? "bg-green-500" : "bg-red-500"}
          suffix="%"
          subtitle={`上月: ¥${metrics.comparison.lastMonthRevenue.toLocaleString()}`}
        />
        <MetricCard
          title="同比增长"
          value={metrics.comparison.yoyGrowth}
          icon={metrics.comparison.yoyGrowth >= 0 ? TrendingUp : TrendingDown}
          color={metrics.comparison.yoyGrowth >= 0 ? "bg-green-500" : "bg-red-500"}
          suffix="%"
          subtitle={`去年同期: ¥${metrics.comparison.sameMonthLastYear.toLocaleString()}`}
        />
        <MetricCard
          title="本月目标"
          value={metrics.targets.monthlyProgress}
          icon={Target}
          color="bg-purple-500"
          suffix="%"
          subtitle={`¥${metrics.targets.monthlyAchieved.toLocaleString()} / ¥${metrics.targets.monthlyTarget.toLocaleString()}`}
        />
      </div>

      <Tabs defaultValue="composition" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="composition">收入构成</TabsTrigger>
          <TabsTrigger value="trends">趋势分析</TabsTrigger>
          <TabsTrigger value="comparison">对比分析</TabsTrigger>
          <TabsTrigger value="targets">目标达成</TabsTrigger>
        </TabsList>

        {/* 收入构成 */}
        <TabsContent value="composition" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  收入占比
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PieChartComponent 
                  data={metrics.composition.composition.map(c => ({
                    name: c.name,
                    value: Math.round(c.value),
                    color: c.name === '会员卡费' ? '#3B82F6' : 
                           c.name === '私教课程' ? '#10B981' :
                           c.name === '团课课程' ? '#F59E0B' : '#8B5CF6'
                  }))} 
                  height={280}
                  innerRadius={60}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">收入明细</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics.composition.composition.map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{item.name}</span>
                      <div className="text-right">
                        <p className="font-bold">¥{item.value.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
                <div className="pt-4 border-t mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">总收入</span>
                    <span className="font-bold text-lg text-blue-600">
                      ¥{metrics.composition.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 趋势分析 */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  日收入趋势 (最近30天)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AreaChartComponent
                  data={trendData}
                  xKey="date"
                  yKey="revenue"
                  name="收入"
                  color="#3B82F6"
                  height={300}
                />
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">周收入趋势</CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChartComponent
                    data={metrics.trends.weekly.map(w => ({
                      week: w.week.split('-W')[1] + '周',
                      revenue: w.revenue
                    }))}
                    xKey="week"
                    yKeys={[{ key: 'revenue', name: '收入', color: '#10B981' }]}
                    height={200}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">月收入趋势</CardTitle>
                </CardHeader>
                <CardContent>
                  <LineChartComponent
                    data={monthlyTrendData}
                    xKey="month"
                    yKeys={[{ key: 'revenue', name: '收入', color: '#F59E0B' }]}
                    height={200}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 对比分析 */}
        <TabsContent value="comparison" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">环比分析</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <p className={`text-5xl font-bold ${metrics.comparison.momGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.comparison.momGrowth >= 0 ? '+' : ''}{metrics.comparison.momGrowth.toFixed(1)}%
                  </p>
                  <p className="text-gray-600 mt-2">环比增长率</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">本月收入</span>
                    <span className="font-bold">¥{metrics.targets.monthlyAchieved.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">上月收入</span>
                    <span className="font-bold">¥{metrics.comparison.lastMonthRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-gray-600">增减额</span>
                    <span className={`font-bold ${metrics.comparison.momGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.comparison.momGrowth >= 0 ? '+' : ''}
                      ¥{(metrics.targets.monthlyAchieved - metrics.comparison.lastMonthRevenue).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">同比分析</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <p className={`text-5xl font-bold ${metrics.comparison.yoyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.comparison.yoyGrowth >= 0 ? '+' : ''}{metrics.comparison.yoyGrowth.toFixed(1)}%
                  </p>
                  <p className="text-gray-600 mt-2">同比增长率</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">本月收入</span>
                    <span className="font-bold">¥{metrics.targets.monthlyAchieved.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">去年同期</span>
                    <span className="font-bold">¥{metrics.comparison.sameMonthLastYear.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-gray-600">增减额</span>
                    <span className={`font-bold ${metrics.comparison.yoyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.comparison.yoyGrowth >= 0 ? '+' : ''}
                      ¥{(metrics.targets.monthlyAchieved - metrics.comparison.sameMonthLastYear).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 目标达成 */}
        <TabsContent value="targets" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  月度目标
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <GaugeChart
                    title="目标完成度"
                    value={metrics.targets.monthlyProgress}
                    max={100}
                    color={metrics.targets.monthlyProgress >= 100 ? 'green' : metrics.targets.monthlyProgress >= 70 ? 'blue' : 'yellow'}
                    size="lg"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">月度目标</span>
                    <span className="font-bold">¥{metrics.targets.monthlyTarget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">已完成</span>
                    <span className="font-bold text-blue-600">¥{metrics.targets.monthlyAchieved.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">剩余</span>
                    <span className="font-bold">
                      ¥{Math.max(0, metrics.targets.monthlyTarget - metrics.targets.monthlyAchieved).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-500" />
                  季度目标
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <GaugeChart
                    title="目标完成度"
                    value={metrics.targets.quarterlyProgress}
                    max={100}
                    color={metrics.targets.quarterlyProgress >= 100 ? 'green' : metrics.targets.quarterlyProgress >= 70 ? 'purple' : 'yellow'}
                    size="lg"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">季度目标</span>
                    <span className="font-bold">¥{metrics.targets.quarterlyTarget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">已完成</span>
                    <span className="font-bold text-purple-600">¥{metrics.targets.quarterlyAchieved.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">剩余</span>
                    <span className="font-bold">
                      ¥{Math.max(0, metrics.targets.quarterlyTarget - metrics.targets.quarterlyAchieved).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  color,
  prefix = '',
  suffix = '',
  subtitle 
}: { 
  title: string; 
  value: number; 
  icon: any; 
  color: string;
  prefix?: string;
  suffix?: string;
  subtitle?: string;
}) {
  const displayValue = suffix === '%' ? value.toFixed(1) : Math.round(value).toLocaleString();
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">
              {prefix}{displayValue}{suffix}
            </p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
