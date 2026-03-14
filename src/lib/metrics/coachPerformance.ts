import { Booking, Consumption, Member } from '@/lib/tableRecognizer';

// ============ 教练绩效分析指标 ============

export interface CoachPerformanceMetrics {
  // 课时统计
  classHours: {
    totalHours: number;
    privateClassHours: number;
    groupClassHours: number;
    avgHoursPerWeek: number;
  };
  // 收入贡献
  revenue: {
    totalRevenue: number;
    privateClassRevenue: number;
    revenueShare: number; // 占总私教收入比例
    avgRevenuePerHour: number;
  };
  // 会员满意度
  satisfaction: {
    renewalRate: number; // 续课率
    avgRating: number;
    totalReviews: number;
    positiveRate: number; // 好评率
  };
  // 负荷分析
  workload: {
    weeklyDistribution: { day: string; hours: number }[];
    peakHours: string[];
    utilizationRate: number; // 时间利用率
  };
}

export interface CoachDetail {
  coachId: string;
  coachName: string;
  metrics: CoachPerformanceMetrics;
  ranking: number;
}

// 计算教练绩效指标
export function calculateCoachPerformanceMetrics(
  coachId: string,
  bookings: Booking[],
  consumptions: Consumption[],
  members: Member[]
): CoachPerformanceMetrics {
  const coachBookings = bookings.filter(b => b.coachId === coachId);
  const coachConsumptions = consumptions.filter(c => c.coachId === coachId);
  
  // 课时统计
  const privateClassHours = coachBookings
    .filter(b => b.type === 'private')
    .reduce((sum, b) => sum + (b.duration || 60), 0) / 60;
  
  const groupClassHours = coachBookings
    .filter(b => b.type === 'group')
    .reduce((sum, b) => sum + (b.duration || 60), 0) / 60;
  
  const totalHours = privateClassHours + groupClassHours;
  
  // 收入贡献
  const privateClassRevenue = coachConsumptions
    .filter(c => c.type === 'private_class')
    .reduce((sum, c) => sum + c.amount, 0);
  
  const totalPrivateRevenue = consumptions
    .filter(c => c.type === 'private_class')
    .reduce((sum, c) => sum + c.amount, 0);
  
  // 续课率计算
  const coachMemberIds = new Set(coachBookings.map(b => b.memberId));
  let renewedCount = 0;
  coachMemberIds.forEach(memberId => {
    const memberBookings = coachBookings.filter(b => b.memberId === memberId);
    if (memberBookings.length > 1) {
      renewedCount++;
    }
  });
  
  // 周负荷分布
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weeklyDistribution = dayNames.map((day, index) => {
    const hours = coachBookings
      .filter(b => {
        const date = new Date(b.bookingTime);
        return date.getDay() === index;
      })
      .reduce((sum, b) => sum + (b.duration || 60), 0) / 60;
    return { day, hours };
  });
  
  // 高峰时段(按小时统计)
  const hourCounts = new Map<number, number>();
  coachBookings.forEach(b => {
    const hour = new Date(b.bookingTime).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  });
  
  const peakHours = Array.from(hourCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => `${hour}:00-${hour + 1}:00`);
  
  // 时间利用率(假设每天工作10小时，每周6天)
  const maxPossibleHours = 10 * 6;
  const utilizationRate = maxPossibleHours > 0 ? Math.min(totalHours / maxPossibleHours * 100, 100) : 0;
  
  return {
    classHours: {
      totalHours: Math.round(totalHours * 10) / 10,
      privateClassHours: Math.round(privateClassHours * 10) / 10,
      groupClassHours: Math.round(groupClassHours * 10) / 10,
      avgHoursPerWeek: Math.round(totalHours / 4 * 10) / 10 // 假设4周
    },
    revenue: {
      totalRevenue: privateClassRevenue,
      privateClassRevenue,
      revenueShare: totalPrivateRevenue > 0 ? Math.round(privateClassRevenue / totalPrivateRevenue * 1000) / 10 : 0,
      avgRevenuePerHour: totalHours > 0 ? Math.round(privateClassRevenue / totalHours) : 0
    },
    satisfaction: {
      renewalRate: coachMemberIds.size > 0 ? Math.round(renewedCount / coachMemberIds.size * 1000) / 10 : 0,
      avgRating: 4.5, // 模拟数据
      totalReviews: coachBookings.length,
      positiveRate: 90 // 模拟数据
    },
    workload: {
      weeklyDistribution,
      peakHours,
      utilizationRate: Math.round(utilizationRate * 10) / 10
    }
  };
}

// 获取所有教练绩效
export function getAllCoachPerformance(
  bookings: Booking[],
  consumptions: Consumption[],
  members: Member[]
): CoachDetail[] {
  const coachIds = new Set(bookings.map(b => b.coachId).filter(Boolean));
  
  const coaches = Array.from(coachIds).map((coachId, index) => {
    const coachBookings = bookings.filter(b => b.coachId === coachId);
    const coachName = coachBookings[0]?.coachName || `教练${coachId}`;
    
    return {
      coachId: coachId as string,
      coachName,
      metrics: calculateCoachPerformanceMetrics(coachId as string, bookings, consumptions, members),
      ranking: 0 // 稍后计算
    };
  });
  
  // 按收入排序计算排名
  coaches.sort((a, b) => b.metrics.revenue.totalRevenue - a.metrics.revenue.totalRevenue);
  coaches.forEach((coach, index) => {
    coach.ranking = index + 1;
  });
  
  return coaches;
}

// 获取教练会员详情
export function getCoachMemberDetails(
  coachId: string,
  bookings: Booking[],
  members: Member[]
) {
  const coachBookings = bookings.filter(b => b.coachId === coachId);
  const memberIds = new Set(coachBookings.map(b => b.memberId));
  
  return Array.from(memberIds).map(memberId => {
    const member = members.find(m => m.id === memberId);
    const memberBookings = coachBookings.filter(b => b.memberId === memberId);
    
    return {
      memberId,
      memberName: member?.name || `会员${memberId}`,
      phone: member?.phone || '',
      totalClasses: memberBookings.length,
      lastClassDate: memberBookings.length > 0 
        ? memberBookings.sort((a, b) => 
            new Date(b.bookingTime).getTime() - new Date(a.bookingTime).getTime()
          )[0].bookingTime
        : null
    };
  });
}
