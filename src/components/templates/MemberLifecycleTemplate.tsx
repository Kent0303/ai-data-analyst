'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserPlus, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Phone
} from 'lucide-react';
import { 
  PieChartComponent, 
  BarChartComponent, 
  LineChartComponent,
  GaugeChart 
} from '@/components/charts';
import { 
  calculateMemberLifecycleMetrics, 
  getChurnRiskMembers,
  MemberLifecycleMetrics 
} from '@/lib/metrics';
import { Member, EntryRecord, Booking, Consumption } from '@/lib/tableRecognizer';

interface MemberLifecycleTemplateProps {
  members: Member[];
  entries: EntryRecord[];
  bookings: Booking[];
  consumptions: Consumption[];
}

export function MemberLifecycleTemplate({
  members,
  entries,
  bookings,
  consumptions
}: MemberLifecycleTemplateProps) {
  const metrics = useMemo(() => 
    calculateMemberLifecycleMetrics(members, entries, bookings, consumptions),
    [members, entries, bookings, consumptions]
  );

  const churnRiskMembers = useMemo(() => 
    getChurnRiskMembers(members, entries, bookings, consumptions),
    [members, entries, bookings, consumptions]
  );

  const channelData = metrics.newMemberAcquisition.byChannel.map(c => ({
    name: c.channel,
    value: c.count,
    color: c.channel === '线上' ? '#3B82F6' : c.channel === '线下' ? '#10B981' : '#F59E0B'
  }));

  const riskDistribution = [
    { name: '高风险', value: metrics.churn.highRiskMembers, color: '#EF4444' },
    { name: '中风险', value: metrics.churn.mediumRiskMembers, color: '#F59E0B' },
    { name: '低风险', value: metrics.churn.lowRiskMembers, color: '#10B981' }
  ];

  return (
    <div className="space-y-6">
      {/* 概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="本月新会员"
          value={metrics.newMemberAcquisition.totalNewMembers}
          icon={UserPlus}
          color="bg-blue-500"
          subtitle={`转化率 ${metrics.newMemberAcquisition.firstPurchaseConversion.toFixed(1)}%`}
        />
        <MetricCard
          title="活跃会员"
          value={metrics.retention.activeMembers}
          icon={Activity}
          color="bg-green-500"
          subtitle={`占比 ${metrics.retention.activeRate.toFixed(1)}%`}
        />
        <MetricCard
          title="沉默会员"
          value={metrics.retention.silentMembers}
          icon={Clock}
          color="bg-yellow-500"
          subtitle={`占比 ${metrics.retention.silentRate.toFixed(1)}%`}
        />
        <MetricCard
          title="高风险流失"
          value={metrics.churn.highRiskMembers}
          icon={AlertTriangle}
          color="bg-red-500"
          subtitle="需立即关注"
        />
      </div>

      <Tabs defaultValue="acquisition" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="acquisition">新客获取</TabsTrigger>
          <TabsTrigger value="activation">会员激活</TabsTrigger>
          <TabsTrigger value="retention">留存分析</TabsTrigger>
          <TabsTrigger value="churn">流失预警</TabsTrigger>
        </TabsList>

        {/* 新客获取 */}
        <TabsContent value="acquisition" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  注册渠道分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PieChartComponent data={channelData} height={250} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-500" />
                  渠道转化分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.newMemberAcquisition.byChannel.map((channel, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{channel.channel}</span>
                        <span className="font-medium">{channel.conversionRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={channel.conversionRate} className="h-2" />
                      <p className="text-xs text-gray-500">
                        {channel.count}人注册 · {Math.round(channel.count * channel.conversionRate / 100)}人转化
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">首购转化指标</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">
                    {metrics.newMemberAcquisition.firstPurchaseConversion.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600 mt-1">首购转化率</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">
                    {metrics.newMemberAcquisition.avgTimeToFirstPurchase}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">平均首购天数</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600">
                    {metrics.activation.avgTimeToFirstEntry}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">首次进店天数</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 会员激活 */}
        <TabsContent value="activation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GaugeChart
              title="会员激活率"
              value={metrics.activation.activationRate}
              color="green"
              size="lg"
            />
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">激活指标</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">已激活会员</span>
                  <span className="font-bold text-lg">{metrics.activation.activatedMembers}人</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">平均首次进店时间</span>
                  <span className="font-bold text-lg">{metrics.activation.avgTimeToFirstEntry}天</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">平均首次预约时间</span>
                  <span className="font-bold text-lg">{metrics.activation.avgTimeToFirstBooking}天</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">激活建议</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                    新会员3天内发送欢迎礼包
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                    7天内未进店进行电话回访
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                    提供免费体验课程
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                    推送个性化训练计划
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 留存分析 */}
        <TabsContent value="retention" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">留存概览</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-3xl font-bold text-green-600">{metrics.retention.activeMembers}</p>
                    <p className="text-sm text-gray-600 mt-1">活跃会员</p>
                    <Badge className="mt-2 bg-green-100 text-green-700">
                      {metrics.retention.activeRate.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                    <p className="text-3xl font-bold text-yellow-600">{metrics.retention.silentMembers}</p>
                    <p className="text-sm text-gray-600 mt-1">沉默会员</p>
                    <Badge className="mt-2 bg-yellow-100 text-yellow-700">
                      {metrics.retention.silentRate.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">平均访问频率</p>
                  <div className="flex items-center gap-4">
                    <Progress value={metrics.retention.avgVisitFrequency * 20} className="flex-1 h-3" />
                    <span className="font-bold">{metrics.retention.avgVisitFrequency}次/周</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">留存建议</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-800">沉默会员唤醒</p>
                    <p className="text-gray-600 mt-1">对60天未进店会员发送专属优惠券</p>
                  </li>
                  <li className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-800">活跃激励</p>
                    <p className="text-gray-600 mt-1">设置连续打卡奖励机制</p>
                  </li>
                  <li className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-800">个性化服务</p>
                    <p className="text-gray-600 mt-1">根据训练偏好推送相关课程</p>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 流失预警 */}
        <TabsContent value="churn" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">流失风险分布</CardTitle>
              </CardHeader>
              <CardContent>
                <PieChartComponent data={riskDistribution} height={250} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">风险指标</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-red-700 font-medium">高风险会员</span>
                  <span className="text-2xl font-bold text-red-600">{metrics.churn.highRiskMembers}人</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span className="text-yellow-700 font-medium">中风险会员</span>
                  <span className="text-2xl font-bold text-yellow-600">{metrics.churn.mediumRiskMembers}人</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-green-700 font-medium">低风险会员</span>
                  <span className="text-2xl font-bold text-green-600">{metrics.churn.lowRiskMembers}人</span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600">
                    平均流失风险评分: <span className="font-bold">{metrics.churn.avgChurnRiskScore}分</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* 高风险会员列表 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                高风险会员列表 (Top 10)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">会员</th>
                      <th className="text-left py-2 px-4">风险评分</th>
                      <th className="text-left py-2 px-4">风险原因</th>
                      <th className="text-left py-2 px-4">最后进店</th>
                      <th className="text-left py-2 px-4">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {churnRiskMembers.slice(0, 10).map((member) => (
                      <tr key={member.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.phone}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={
                            member.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                            member.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }>
                            {member.riskScore}分
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {member.reasons.slice(0, 2).map((reason, idx) => (
                              <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {reason}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {member.lastEntryDate 
                            ? new Date(member.lastEntryDate).toLocaleDateString('zh-CN')
                            : '从未进店'
                          }
                        </td>
                        <td className="py-3 px-4">
                          <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            回访
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
      </Tabs>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  color,
  subtitle 
}: { 
  title: string; 
  value: number; 
  icon: any; 
  color: string;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
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
