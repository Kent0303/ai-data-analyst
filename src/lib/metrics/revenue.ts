import { Consumption, Booking } from '@/lib/tableRecognizer';

// ============ 营收健康度分析指标 ============

export interface RevenueMetrics {
  // 收入构成
  composition: {
    totalRevenue: number;
    cardRevenue: number;
    privateClassRevenue: number;
    groupClassRevenue: number;
    otherRevenue: number;
    composition: { name: string; value: number; percentage: number }[];
  };
  // 趋势分析
  trends: {
    daily: { date: string; revenue: number }[];
    weekly: { week: string; revenue: number }[];
    monthly: { month: string; revenue: number }[];
  };
  // 对比分析
  comparison: {
    yoyGrowth: number; // 同比增长
    momGrowth: number; // 环比增长
    lastMonthRevenue: number;
    sameMonthLastYear: number;
  };
  // 目标达成
  targets: {
    monthlyTarget: number;
    monthlyAchieved: number;
    monthlyProgress: number;
    quarterlyTarget: number;
    quarterlyAchieved: number;
    quarterlyProgress: number;
  };
}

// 计算营收指标
export function calculateRevenueMetrics(
  consumptions: Consumption[],
  bookings: Booking[],
  monthlyTarget: number = 100000,
  quarterlyTarget: number = 300000
): RevenueMetrics {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // 收入分类
  const cardRevenue = consumptions
    .filter(c => c.type === 'card')
    .reduce((sum, c) => sum + c.amount, 0);
  
  const privateClassRevenue = consumptions
    .filter(c => c.type === 'private_class')
    .reduce((sum, c) => sum + c.amount, 0);
  
  const groupClassRevenue = consumptions
    .filter(c => c.type === 'group_class')
    .reduce((sum, c) => sum + c.amount, 0);
  
  const otherRevenue = consumptions
    .filter(c => c.type === 'other' || !c.type)
    .reduce((sum, c) => sum + c.amount, 0);
  
  const totalRevenue = cardRevenue + privateClassRevenue + groupClassRevenue + otherRevenue;
  
  // 日趋势(最近30天)
  const dailyMap = new Map<string, number>();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  consumptions
    .filter(c => new Date(c.date) >= thirtyDaysAgo)
    .forEach(c => {
      const date = c.date.split(' ')[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + c.amount);
    });
  
  const daily = Array.from(dailyMap.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // 周趋势(最近12周)
  const weeklyMap = new Map<string, number>();
  consumptions.forEach(c => {
    const date = new Date(c.date);
    const weekStart = new Date(date.getTime() - date.getDay() * 24 * 60 * 60 * 1000);
    const weekKey = `${weekStart.getFullYear()}-W${Math.ceil((date.getDate()) / 7)}`;
    weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + c.amount);
  });
  
  const weekly = Array.from(weeklyMap.entries())
    .map(([week, revenue]) => ({ week, revenue }))
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-12);
  
  // 月趋势(最近12个月)
  const monthlyMap = new Map<string, number>();
  consumptions.forEach(c => {
    const date = new Date(c.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + c.amount);
  });
  
  const monthly = Array.from(monthlyMap.entries())
    .map(([month, revenue]) => ({ month, revenue }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);
  
  // 对比分析
  const currentMonthRevenue = consumptions
    .filter(c => {
      const date = new Date(c.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, c) => sum + c.amount, 0);
  
  const lastMonthRevenue = consumptions
    .filter(c => {
      const date = new Date(c.date);
      return date.getMonth() === (currentMonth - 1 + 12) % 12 && 
        date.getFullYear() === (currentMonth === 0 ? currentYear - 1 : currentYear);
    })
    .reduce((sum, c) => sum + c.amount, 0);
  
  const sameMonthLastYear = consumptions
    .filter(c => {
      const date = new Date(c.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear - 1;
    })
    .reduce((sum, c) => sum + c.amount, 0);
  
  const momGrowth = lastMonthRevenue > 0 ? (currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100 : 0;
  const yoyGrowth = sameMonthLastYear > 0 ? (currentMonthRevenue - sameMonthLastYear) / sameMonthLastYear * 100 : 0;
  
  // 季度计算
  const currentQuarter = Math.floor(currentMonth / 3);
  const quarterlyRevenue = consumptions
    .filter(c => {
      const date = new Date(c.date);
      return Math.floor(date.getMonth() / 3) === currentQuarter && date.getFullYear() === currentYear;
    })
    .reduce((sum, c) => sum + c.amount, 0);
  
  return {
    composition: {
      totalRevenue,
      cardRevenue,
      privateClassRevenue,
      groupClassRevenue,
      otherRevenue,
      composition: [
        { name: '会员卡费', value: cardRevenue, percentage: totalRevenue > 0 ? cardRevenue / totalRevenue * 100 : 0 },
        { name: '私教课程', value: privateClassRevenue, percentage: totalRevenue > 0 ? privateClassRevenue / totalRevenue * 100 : 0 },
        { name: '团课课程', value: groupClassRevenue, percentage: totalRevenue > 0 ? groupClassRevenue / totalRevenue * 100 : 0 },
        { name: '其他收入', value: otherRevenue, percentage: totalRevenue > 0 ? otherRevenue / totalRevenue * 100 : 0 },
      ]
    },
    trends: { daily, weekly, monthly },
    comparison: {
      yoyGrowth,
      momGrowth,
      lastMonthRevenue,
      sameMonthLastYear
    },
    targets: {
      monthlyTarget,
      monthlyAchieved: currentMonthRevenue,
      monthlyProgress: monthlyTarget > 0 ? Math.min(currentMonthRevenue / monthlyTarget * 100, 100) : 0,
      quarterlyTarget,
      quarterlyAchieved: quarterlyRevenue,
      quarterlyProgress: quarterlyTarget > 0 ? Math.min(quarterlyRevenue / quarterlyTarget * 100, 100) : 0
    }
  };
}

// 获取营收明细
export function getRevenueDetails(consumptions: Consumption[]) {
  return consumptions
    .map(c => ({
      ...c,
      dateObj: new Date(c.date)
    }))
    .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
}
