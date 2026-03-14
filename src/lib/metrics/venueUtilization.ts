import { EntryRecord, Booking } from '@/lib/tableRecognizer';

// ============ 场地利用率分析指标 ============

export interface VenueUtilizationMetrics {
  // 高峰时段
  peakHours: {
    hourlyDistribution: { hour: number; count: number; percentage: number }[];
    peakHours: number[];
    offPeakHours: number[];
    heatmapData: { day: string; hour: number; value: number }[];
  };
  // 课程饱和度
  courseSaturation: {
    groupClassBookingRate: number;
    privateClassBookingRate: number;
    totalClasses: number;
    maxCapacity: number;
  };
  // 场地周转
  venueTurnover: {
    avgSessionDuration: number;
    dailyTurnover: number;
    equipmentUtilization: { name: string; usage: number; efficiency: number }[];
  };
}

// 计算场地利用率指标
export function calculateVenueUtilizationMetrics(
  entries: EntryRecord[],
  bookings: Booking[]
): VenueUtilizationMetrics {
  // 小时分布
  const hourCounts = new Map<number, number>();
  entries.forEach(e => {
    const hour = new Date(e.entryTime).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  });
  
  const totalEntries = entries.length;
  const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => {
    const count = hourCounts.get(hour) || 0;
    return {
      hour,
      count,
      percentage: totalEntries > 0 ? Math.round(count / totalEntries * 1000) / 10 : 0
    };
  });
  
  // 高峰时段(前5个小时)
  const sortedHours = hourlyDistribution
    .filter(h => h.count > 0)
    .sort((a, b) => b.count - a.count);
  
  const peakHours = sortedHours.slice(0, 5).map(h => h.hour);
  const offPeakHours = sortedHours.slice(-5).map(h => h.hour);
  
  // 热力图数据(按星期和小时)
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const heatmapData: { day: string; hour: number; value: number }[] = [];
  
  dayNames.forEach((day, dayIndex) => {
    for (let hour = 0; hour < 24; hour++) {
      const count = entries.filter(e => {
        const date = new Date(e.entryTime);
        return date.getDay() === dayIndex && date.getHours() === hour;
      }).length;
      heatmapData.push({ day, hour, value: count });
    }
  });
  
  // 课程饱和度
  const groupClasses = bookings.filter(b => b.type === 'group');
  const privateClasses = bookings.filter(b => b.type === 'private');
  
  // 假设团课容量为20人，私教容量为1人
  const groupClassCapacity = groupClasses.length * 20;
  const privateClassCapacity = privateClasses.length * 1;
  
  const groupClassBooked = groupClasses.reduce((sum, b) => sum + (b.attendees || 1), 0);
  const privateClassBooked = privateClasses.length;
  
  // 场地周转
  const avgSessionDuration = bookings.length > 0
    ? bookings.reduce((sum, b) => sum + (b.duration || 60), 0) / bookings.length
    : 0;
  
  // 设备利用率(模拟数据)
  const equipmentUtilization = [
    { name: '跑步机', usage: 85, efficiency: 92 },
    { name: '哑铃区', usage: 72, efficiency: 88 },
    { name: '力量器械', usage: 68, efficiency: 85 },
    { name: '瑜伽室', usage: 55, efficiency: 78 },
    { name: '单车房', usage: 78, efficiency: 90 },
  ];
  
  // 每日周转率(假设营业12小时)
  const dailyTurnover = entries.length > 0 
    ? Math.round(entries.length / 30 * 10) / 10 // 平均每天
    : 0;
  
  return {
    peakHours: {
      hourlyDistribution,
      peakHours,
      offPeakHours,
      heatmapData
    },
    courseSaturation: {
      groupClassBookingRate: groupClassCapacity > 0 ? Math.round(groupClassBooked / groupClassCapacity * 1000) / 10 : 0,
      privateClassBookingRate: privateClassCapacity > 0 ? Math.round(privateClassBooked / privateClassCapacity * 1000) / 10 : 0,
      totalClasses: bookings.length,
      maxCapacity: groupClassCapacity + privateClassCapacity
    },
    venueTurnover: {
      avgSessionDuration: Math.round(avgSessionDuration),
      dailyTurnover,
      equipmentUtilization
    }
  };
}

// 获取时段详情
export function getTimeSlotDetails(entries: EntryRecord[], bookings: Booking[]) {
  const timeSlots = [
    { name: '早晨(6-9点)', start: 6, end: 9 },
    { name: '上午(9-12点)', start: 9, end: 12 },
    { name: '中午(12-14点)', start: 12, end: 14 },
    { name: '下午(14-18点)', start: 14, end: 18 },
    { name: '晚间(18-22点)', start: 18, end: 22 },
  ];
  
  return timeSlots.map(slot => {
    const entryCount = entries.filter(e => {
      const hour = new Date(e.entryTime).getHours();
      return hour >= slot.start && hour < slot.end;
    }).length;
    
    const bookingCount = bookings.filter(b => {
      const hour = new Date(b.bookingTime).getHours();
      return hour >= slot.start && hour < slot.end;
    }).length;
    
    return {
      ...slot,
      entryCount,
      bookingCount,
      utilization: entryCount > 0 ? Math.round(bookingCount / entryCount * 100) : 0
    };
  });
}
