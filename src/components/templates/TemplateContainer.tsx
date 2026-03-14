'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  DollarSign, 
  UserCheck, 
  Building2,
  Download,
  Calendar,
  Store,
  Filter
} from 'lucide-react';
import { MemberLifecycleTemplate } from './MemberLifecycleTemplate';
import { RevenueDashboardTemplate } from './RevenueDashboardTemplate';
import { CoachPerformanceTemplate } from './CoachPerformanceTemplate';
import { VenueUtilizationTemplate } from './VenueUtilizationTemplate';
import { Member, EntryRecord, Booking, Consumption, TableType } from '@/lib/tableRecognizer';

type TemplateType = 'member' | 'revenue' | 'coach' | 'venue';

interface TemplateContainerProps {
  members: Member[];
  entries: EntryRecord[];
  bookings: Booking[];
  consumptions: Consumption[];
  detectedTables: TableType[];
}

const templateConfig = {
  member: {
    label: '会员生命周期',
    icon: Users,
    color: 'bg-blue-500',
    description: '新客获取、激活、留存、流失预警',
    requiredTables: ['member_list', 'entry_record', 'consumption_record']
  },
  revenue: {
    label: '营收健康度',
    icon: DollarSign,
    color: 'bg-green-500',
    description: '收入构成、趋势、对比、目标达成',
    requiredTables: ['consumption_record', 'booking']
  },
  coach: {
    label: '教练绩效',
    icon: UserCheck,
    color: 'bg-purple-500',
    description: '课时统计、收入贡献、满意度、负荷',
    requiredTables: ['booking', 'consumption_record']
  },
  venue: {
    label: '场地利用率',
    icon: Building2,
    color: 'bg-orange-500',
    description: '高峰时段、课程饱和度、设备效率',
    requiredTables: ['entry_record', 'booking']
  }
};

export function TemplateContainer({
  members,
  entries,
  bookings,
  consumptions,
  detectedTables
}: TemplateContainerProps) {
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>('member');
  const [timeRange, setTimeRange] = useState<string>('30');
  const [storeFilter, setStoreFilter] = useState<string>('all');

  const handleExport = () => {
    // 导出功能
    const data = {
      template: activeTemplate,
      timeRange,
      storeFilter,
      exportTime: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis_${activeTemplate}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderTemplate = () => {
    switch (activeTemplate) {
      case 'member':
        return (
          <MemberLifecycleTemplate
            members={members}
            entries={entries}
            bookings={bookings}
            consumptions={consumptions}
          />
        );
      case 'revenue':
        return (
          <RevenueDashboardTemplate
            consumptions={consumptions}
            bookings={bookings}
          />
        );
      case 'coach':
        return (
          <CoachPerformanceTemplate
            bookings={bookings}
            consumptions={consumptions}
            members={members}
          />
        );
      case 'venue':
        return (
          <VenueUtilizationTemplate
            entries={entries}
            bookings={bookings}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 模板选择器 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(templateConfig) as TemplateType[]).map((key) => {
                const config = templateConfig[key];
                const Icon = config.icon;
                const isActive = activeTemplate === key;
                const isAvailable = config.requiredTables.every(t => 
                  detectedTables.includes(t as TableType) || detectedTables.includes('unknown')
                );
                
                return (
                  <Button
                    key={key}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTemplate(key)}
                    disabled={!isAvailable}
                    className={`flex items-center gap-2 ${isActive ? config.color + ' text-white' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{config.label}</span>
                    {!isAvailable && (
                      <Badge variant="secondary" className="ml-1 text-xs">缺数据</Badge>
                    )}
                  </Button>
                );
              })}
            </div>
            
            <div className="flex items-center gap-2">
              {/* 筛选器 */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[120px]">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="时间范围" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">最近7天</SelectItem>
                    <SelectItem value="30">最近30天</SelectItem>
                    <SelectItem value="90">最近90天</SelectItem>
                    <SelectItem value="365">最近一年</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={storeFilter} onValueChange={setStoreFilter}>
                  <SelectTrigger className="w-[120px]">
                    <Store className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="门店" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部门店</SelectItem>
                    <SelectItem value="store1">门店1</SelectItem>
                    <SelectItem value="store2">门店2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* 导出按钮 */}
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-1" />
                导出
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 当前模板信息 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {(() => {
            const config = templateConfig[activeTemplate];
            const Icon = config.icon;
            return (
              <>
                <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{config.label}</h2>
                  <p className="text-sm text-gray-500">{config.description}</p>
                </div>
              </>
            );
          })()}
        </div>
        <Badge variant="outline">
          时间范围: {timeRange === '7' ? '最近7天' : timeRange === '30' ? '最近30天' : timeRange === '90' ? '最近90天' : '最近一年'}
        </Badge>
      </div>

      {/* 模板内容 */}
      <div className="template-content">
        {renderTemplate()}
      </div>
    </div>
  );
}
