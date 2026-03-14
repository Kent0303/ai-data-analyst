'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Clock, 
  Calendar,
  Activity,
  Zap
} from 'lucide-react';
import { 
  BarChartComponent, 
  LineChartComponent,
  AreaChartComponent,
} from '@/components/charts';
import { calculateVenueUtilizationMetrics, getTimeSlotDetails } from '@/lib/metrics';
import { EntryRecord, Booking } from '@/lib/tableRecognizer';

interface VenueUtilizationTemplateProps {
  entries: EntryRecord[];
  bookings: Booking[];
}

export function VenueUtilizationTemplate({
  entries,
  bookings
}: VenueUtilizationTemplateProps) {
  const metrics = useMemo(() => 
    calculateVenueUtilizationMetrics(entries, bookings),
    [entries, bookings]
  );

  const timeSlotDetails = useMemo(() => 
    getTimeSlotDetails(entries, bookings),
    [entries, bookings]
  );

  const hourlyData = useMemo(() => {
    return metrics.peakHours.hourlyDistribution
      .filter(h => h.count > 0)
      .map(h => ({
        hour: `${h.hour}:00`,
        count: h.count,
        percentage: h.percentage
      }));
  }, [metrics.peakHours.hourlyDistribution]);

  return (
    <div className="space-y-6">
      {/* 概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="今日进店"
          value={entries.filter(e => {
            const today = new Date().toDateString();
            return new Date(e.entryTime).toDateString() === today;
          }).length}
          icon={Users}
          color="bg-blue-500"
        />
        <MetricCard
          title="高峰时段"
          value={metrics.peakHours.peakHours.length}
          icon={Clock}
          color="bg-red-500"
          subtitle="个时段"
        />
        <MetricCard
          title="团课预约率"
          value={metrics.courseSaturation.groupClassBookingRate}
          icon={Calendar}
          color="bg-green-500"
          suffix="%"
        />
        <MetricCard
          title="场地周转率"
          value={metrics.venueTurnover.dailyTurnover}
          icon={Activity}
          color="bg-purple-500"
          subtitle="人次/天"
        />
      </div>

      <Tabs defaultValue="peak" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="peak">高峰时段</TabsTrigger>
          <TabsTrigger value="saturation">课程饱和度</TabsTrigger>
          <TabsTrigger value="turnover">场地周转</TabsTrigger>
          <TabsTrigger value="equipment">设备效率</TabsTrigger>
        </TabsList>

        {/* 高峰时段 */}
        <TabsContent value="peak" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-500" />
                  24小时进店分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BarChartComponent
                  data={hourlyData}
                  xKey="hour"
                  yKeys={[{ key: 'count', name: '进店人数', color: '#3B82F6' }]}
                  height={300}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-orange-500" />
                  时段分析
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">高峰时段 Top 5</p>
                  <div className="flex flex-wrap gap-2">
                    {metrics.peakHours.peakHours.map((hour, idx) => (
                      <Badge key={idx} className="bg-red-100 text-red-700">
                        {hour}:00 - {hour + 1}:00
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">低谷时段</p>
                  <div className="flex flex-wrap gap-2">
                    {metrics.peakHours.offPeakHours.map((hour, idx) => (
                      <Badge key={idx} variant="outline" className="text-gray-500">
                        {hour}:00 - {hour + 1}:00
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">时段详情</p>
                  <div className="space-y-2">
                    {timeSlotDetails.map((slot, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span>{slot.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-500">{slot.entryCount}人进店</span>
                          <Badge variant={slot.utilization > 70 ? 'default' : 'secondary'}>
                            {slot.utilization}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* 热力图 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">进店热力图 (按星期和小时)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="py-2 px-2">时段</th>
                      {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(day => (
                        <th key={day} className="py-2 px-2 text-center">{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 18 }, (_, i) => i + 6).map(hour => (
                      <tr key={hour}>
                        <td className="py-1 px-2 font-medium">{hour}:00</td>
                        {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(day => {
                          const value = metrics.peakHours.heatmapData.find(
                            h => h.day === day && h.hour === hour
                          )?.value || 0;
                          const intensity = Math.min(value / 10, 1);
                          return (
                            <td key={day} className="py-1 px-1">
                              <div 
                                className="w-full h-8 rounded flex items-center justify-center text-xs"
                                style={{ 
                                  backgroundColor: `rgba(59, 130, 246, ${0.1 + intensity * 0.9})`,
                                  color: intensity > 0.5 ? 'white' : '#374151'
                                }}
                              >
                                {value > 0 && value}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 课程饱和度 */}
        <TabsContent value="saturation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">团课预约情况</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <p className="text-5xl font-bold text-blue-600">
                    {metrics.courseSaturation.groupClassBookingRate.toFixed(1)}%
                  </p>
                  <p className="text-gray-600 mt-2">团课预约率</p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>预约率</span>
                    <span>{metrics.courseSaturation.groupClassBookingRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.courseSaturation.groupClassBookingRate} className="h-3" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {bookings.filter(b => b.type === 'group').length}
                    </p>
                    <p className="text-xs text-gray-600">团课总数</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {bookings.filter(b => b.type === 'group').reduce((sum, b) => sum + (b.attendees || 0), 0)}
                    </p>
                    <p className="text-xs text-gray-600">总预约人次</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">私教预约情况</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <p className="text-5xl font-bold text-green-600">
                    {metrics.courseSaturation.privateClassBookingRate.toFixed(1)}%
                  </p>
                  <p className="text-gray-600 mt-2">私教预约率</p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>预约率</span>
                    <span>{metrics.courseSaturation.privateClassBookingRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.courseSaturation.privateClassBookingRate} className="h-3" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">
                      {bookings.filter(b => b.type === 'private').length}
                    </p>
                    <p className="text-xs text-gray-600">私教总数</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">
                      {bookings.filter(b => b.type === 'private').reduce((sum, b) => sum + (b.attendees || 1), 0)}
                    </p>
                    <p className="text-xs text-gray-600">总预约人次</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 场地周转 */}
        <TabsContent value="turnover" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">平均课程时长</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-5xl font-bold text-blue-600">
                  {metrics.venueTurnover.avgSessionDuration}
                </p>
                <p className="text-gray-600 mt-2">分钟/节</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">日均周转</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-5xl font-bold text-green-600">
                  {metrics.venueTurnover.dailyTurnover}
                </p>
                <p className="text-gray-600 mt-2">人次/天</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">总课程数</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-5xl font-bold text-purple-600">
                  {metrics.courseSaturation.totalClasses}
                </p>
                <p className="text-gray-600 mt-2">节</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">场地使用建议</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">高峰时段优化</h4>
                  <ul className="space-y-1 text-sm text-blue-700">
                    <li>• 增加高峰期教练配置</li>
                    <li>• 开放更多团课时段</li>
                    <li>• 引导会员错峰训练</li>
                  </ul>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">低谷时段激活</h4>
                  <ul className="space-y-1 text-sm text-green-700">
                    <li>• 推出低谷时段优惠</li>
                    <li>• 安排特色课程</li>
                    <li>• 企业团建活动</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 设备效率 */}
        <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                设备利用率
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.venueTurnover.equipmentUtilization.map((eq, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{eq.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">使用率 {eq.usage}%</span>
                        <span className="text-sm text-gray-500">效率 {eq.efficiency}%</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Progress value={eq.usage} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">高使用率设备</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.venueTurnover.equipmentUtilization
                    .filter(e => e.usage >= 70)
                    .map((eq, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <span>{eq.name}</span>
                        <Badge className="bg-yellow-100 text-yellow-700">{eq.usage}%</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">需优化设备</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.venueTurnover.equipmentUtilization
                    .filter(e => e.usage < 60)
                    .map((eq, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span>{eq.name}</span>
                        <Badge variant="outline">{eq.usage}%</Badge>
                      </div>
                    ))}
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
  suffix = '',
  subtitle 
}: { 
  title: string; 
  value: number; 
  icon: any; 
  color: string;
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
              {displayValue}{suffix}
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
