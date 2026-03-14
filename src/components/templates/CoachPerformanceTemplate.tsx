'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Clock, 
  DollarSign, 
  Star,
  TrendingUp,
  Award
} from 'lucide-react';
import { 
  BarChartComponent, 
  RadarChartComponent,
} from '@/components/charts';
import { 
  getAllCoachPerformance, 
  getCoachMemberDetails,
} from '@/lib/metrics';
import { Booking, Consumption, Member } from '@/lib/tableRecognizer';

interface CoachPerformanceTemplateProps {
  bookings: Booking[];
  consumptions: Consumption[];
  members: Member[];
}

export function CoachPerformanceTemplate({
  bookings,
  consumptions,
  members
}: CoachPerformanceTemplateProps) {
  const [selectedCoach, setSelectedCoach] = useState<string | null>(null);
  
  const coaches = useMemo(() => 
    getAllCoachPerformance(bookings, consumptions, members),
    [bookings, consumptions, members]
  );

  const selectedCoachData = useMemo(() => {
    if (!selectedCoach) return null;
    return coaches.find(c => c.coachId === selectedCoach);
  }, [selectedCoach, coaches]);

  const selectedCoachMembers = useMemo(() => {
    if (!selectedCoach) return [];
    return getCoachMemberDetails(selectedCoach, bookings, members);
  }, [selectedCoach, bookings, members]);

  const rankingData = useMemo(() => {
    return coaches.slice(0, 10).map(c => ({
      name: c.coachName,
      revenue: c.metrics.revenue.totalRevenue,
      hours: c.metrics.classHours.totalHours
    }));
  }, [coaches]);

  const workloadData = useMemo(() => {
    if (!selectedCoachData) return [];
    return selectedCoachData.metrics.workload.weeklyDistribution;
  }, [selectedCoachData]);

  const radarData = useMemo(() => {
    if (!selectedCoachData) return [];
    return [
      { subject: '课时数', value: Math.min(selectedCoachData.metrics.classHours.totalHours * 2, 100) },
      { subject: '收入贡献', value: selectedCoachData.metrics.revenue.revenueShare },
      { subject: '续课率', value: selectedCoachData.metrics.satisfaction.renewalRate },
      { subject: '满意度', value: selectedCoachData.metrics.satisfaction.avgRating * 20 },
      { subject: '时间利用率', value: selectedCoachData.metrics.workload.utilizationRate },
    ];
  }, [selectedCoachData]);

  return (
    <div className="space-y-6">
      {/* 概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="教练总数"
          value={coaches.length}
          icon={Users}
          color="bg-blue-500"
        />
        <MetricCard
          title="总课时"
          value={coaches.reduce((sum, c) => sum + c.metrics.classHours.totalHours, 0)}
          icon={Clock}
          color="bg-green-500"
          subtitle="本月累计"
        />
        <MetricCard
          title="私教总收入"
          value={coaches.reduce((sum, c) => sum + c.metrics.revenue.totalRevenue, 0)}
          icon={DollarSign}
          color="bg-yellow-500"
          prefix="¥"
        />
        <MetricCard
          title="平均续课率"
          value={coaches.length > 0 ? coaches.reduce((sum, c) => sum + c.metrics.satisfaction.renewalRate, 0) / coaches.length : 0}
          icon={TrendingUp}
          color="bg-purple-500"
          suffix="%"
        />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">绩效概览</TabsTrigger>
          <TabsTrigger value="ranking">教练排行</TabsTrigger>
          <TabsTrigger value="workload">负荷分析</TabsTrigger>
          <TabsTrigger value="detail">教练详情</TabsTrigger>
        </TabsList>

        {/* 绩效概览 */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  收入排行 Top 10
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BarChartComponent
                  data={rankingData}
                  xKey="name"
                  yKeys={[{ key: 'revenue', name: '收入', color: '#3B82F6' }]}
                  height={300}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-500" />
                  课时排行 Top 10
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BarChartComponent
                  data={rankingData}
                  xKey="name"
                  yKeys={[{ key: 'hours', name: '课时', color: '#10B981' }]}
                  height={300}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* 教练列表 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">教练绩效列表</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">排名</th>
                      <th className="text-left py-2 px-4">教练</th>
                      <th className="text-left py-2 px-4">总课时</th>
                      <th className="text-left py-2 px-4">私教课时</th>
                      <th className="text-left py-2 px-4">收入贡献</th>
                      <th className="text-left py-2 px-4">续课率</th>
                      <th className="text-left py-2 px-4">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coaches.map((coach) => (
                      <tr key={coach.coachId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Badge className={
                            coach.ranking === 1 ? 'bg-yellow-100 text-yellow-700' :
                            coach.ranking === 2 ? 'bg-gray-100 text-gray-700' :
                            coach.ranking === 3 ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-50 text-blue-700'
                          }>
                            #{coach.ranking}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-medium">{coach.coachName}</td>
                        <td className="py-3 px-4">{coach.metrics.classHours.totalHours.toFixed(1)}h</td>
                        <td className="py-3 px-4">{coach.metrics.classHours.privateClassHours.toFixed(1)}h</td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">¥{coach.metrics.revenue.totalRevenue.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">占比 {coach.metrics.revenue.revenueShare}%</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={
                            coach.metrics.satisfaction.renewalRate >= 70 ? 'bg-green-100 text-green-700' :
                            coach.metrics.satisfaction.renewalRate >= 40 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }>
                            {coach.metrics.satisfaction.renewalRate.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setSelectedCoach(coach.coachId)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            查看详情
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 教练排行 */}
        <TabsContent value="ranking" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coaches.slice(0, 3).map((coach, idx) => (
              <Card key={coach.coachId} className={
                idx === 0 ? 'border-yellow-300 bg-yellow-50/30' :
                idx === 1 ? 'border-gray-300 bg-gray-50/30' :
                'border-orange-300 bg-orange-50/30'
              }>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{coach.coachName}</CardTitle>
                    <Badge className={
                      idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                      idx === 1 ? 'bg-gray-100 text-gray-700' :
                      'bg-orange-100 text-orange-700'
                    }>
                      第{idx + 1}名
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">
                      ¥{coach.metrics.revenue.totalRevenue.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">收入贡献</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-xl font-bold">{coach.metrics.classHours.totalHours.toFixed(1)}h</p>
                      <p className="text-xs text-gray-600">总课时</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold">{coach.metrics.satisfaction.renewalRate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-600">续课率</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">收入 vs 课时对比</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChartComponent
                data={coaches.slice(0, 10).map(c => ({
                  name: c.coachName,
                  revenue: c.metrics.revenue.totalRevenue,
                  hours: c.metrics.classHours.totalHours * 100
                }))}
                xKey="name"
                yKeys={[
                  { key: 'revenue', name: '收入', color: '#3B82F6' },
                  { key: 'hours', name: '课时(x100)', color: '#10B981' }
                ]}
                height={300}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 负荷分析 */}
        <TabsContent value="workload" className="space-y-4">
          {selectedCoachData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">周课时分布</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BarChartComponent
                      data={workloadData}
                      xKey="day"
                      yKeys={[{ key: 'hours', name: '课时', color: '#8B5CF6' }]}
                      height={250}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">综合评分</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadarChartComponent
                      data={radarData}
                      name={selectedCoachData.coachName}
                      color="#3B82F6"
                      height={250}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">负荷指标</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>时间利用率</span>
                        <span>{selectedCoachData.metrics.workload.utilizationRate}%</span>
                      </div>
                      <Progress value={selectedCoachData.metrics.workload.utilizationRate} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>周均课时</span>
                        <span>{selectedCoachData.metrics.classHours.avgHoursPerWeek}h</span>
                      </div>
                      <Progress value={selectedCoachData.metrics.classHours.avgHoursPerWeek * 5} className="h-2" />
                    </div>
                    <div className="pt-4">
                      <p className="text-sm text-gray-600 mb-2">高峰时段</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedCoachData.metrics.workload.peakHours.map((hour, idx) => (
                          <Badge key={idx} variant="outline">{hour}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedCoach(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  清除选择
                </button>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">请在&quot;绩效概览&quot;中选择一位教练查看负荷分析</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 教练详情 */}
        <TabsContent value="detail" className="space-y-4">
          {selectedCoach && selectedCoachData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{selectedCoachData.coachName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-4xl font-bold text-blue-600">#{selectedCoachData.ranking}</p>
                      <p className="text-sm text-gray-600">收入排名</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">总课时</span>
                        <span className="font-medium">{selectedCoachData.metrics.classHours.totalHours.toFixed(1)}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">私教课时</span>
                        <span className="font-medium">{selectedCoachData.metrics.classHours.privateClassHours.toFixed(1)}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">团课课时</span>
                        <span className="font-medium">{selectedCoachData.metrics.classHours.groupClassHours.toFixed(1)}h</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">收入与满意度</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-3xl font-bold text-green-600">
                        ¥{selectedCoachData.metrics.revenue.totalRevenue.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">总收入</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">收入占比</span>
                        <span className="font-medium">{selectedCoachData.metrics.revenue.revenueShare}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">平均课时费</span>
                        <span className="font-medium">¥{selectedCoachData.metrics.revenue.avgRevenuePerHour}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">续课率</span>
                        <span className="font-medium">{selectedCoachData.metrics.satisfaction.renewalRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">服务会员</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center p-4 bg-purple-50 rounded-lg mb-4">
                      <p className="text-4xl font-bold text-purple-600">{selectedCoachMembers.length}</p>
                      <p className="text-sm text-gray-600">服务会员数</p>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {selectedCoachMembers.slice(0, 5).map((member, idx) => (
                        <div key={idx} className="flex justify-between py-2 border-b last:border-0">
                          <span className="text-sm">{member.memberName}</span>
                          <span className="text-sm text-gray-500">{member.totalClasses}节课</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedCoach(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  清除选择
                </button>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">请在"绩效概览"中选择一位教练查看详情</p>
              </CardContent>
            </Card>
          )}
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
