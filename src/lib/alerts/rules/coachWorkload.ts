/**
 * 教练负荷预警规则
 * 检测规则：单教练周课时 > 40 或 < 10
 */

import { Booking } from '@/lib/tableRecognizer';
import { Alert, AlertLevel, AlertCategory } from '../types';

export interface CoachWorkloadAlertConfig {
  // 过载阈值（周课时）
  overloadThreshold: number;
  // 不足阈值（周课时）
  underloadThreshold: number;
  // 检测周期（天）
  detectionPeriodDays: number;
}

export const defaultCoachWorkloadConfig: CoachWorkloadAlertConfig = {
  overloadThreshold: 40,
  underloadThreshold: 10,
  detectionPeriodDays: 7,
};

export interface CoachWorkload {
  coachId: string;
  coachName: string;
  weeklyHours: number;
  weeklyClasses: number;
  dailyDistribution: { day: string; hours: number; classes: number }[];
  status: 'overload' | 'normal' | 'underload';
  utilizationRate: number;
  avgClassDuration: number;
}

export interface WorkloadSuggestion {
  type: 'redistribute' | 'hire' | 'training' | 'schedule';
  description: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * 计算教练负荷
 */
export function calculateCoachWorkload(
  coachId: string,
  bookings: Booking[],
  config: CoachWorkloadAlertConfig = defaultCoachWorkloadConfig
): CoachWorkload {
  const now = new Date();
  const periodStart = new Date(now.getTime() - config.detectionPeriodDays * 24 * 60 * 60 * 1000);
  
  const coachBookings = bookings.filter(b => 
    b.coachId === coachId && 
    new Date(b.bookingTime) >= periodStart
  );
  
  // 计算周课时
  const weeklyHours = coachBookings.reduce((sum, b) => {
    return sum + ((b.duration || 60) / 60);
  }, 0);
  
  const weeklyClasses = coachBookings.length;
  
  // 按天分布
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const dailyDistribution = dayNames.map((day, index) => {
    const dayBookings = coachBookings.filter(b => {
      const date = new Date(b.bookingTime);
      return date.getDay() === index;
    });
    
    const hours = dayBookings.reduce((sum, b) => sum + ((b.duration || 60) / 60), 0);
    
    return {
      day,
      hours: Math.round(hours * 10) / 10,
      classes: dayBookings.length,
    };
  });
  
  // 确定负荷状态
  let status: CoachWorkload['status'] = 'normal';
  if (weeklyHours > config.overloadThreshold) {
    status = 'overload';
  } else if (weeklyHours < config.underloadThreshold) {
    status = 'underload';
  }
  
  // 计算利用率（假设每天最多8小时，每周6天）
  const maxWeeklyHours = 8 * 6;
  const utilizationRate = Math.min((weeklyHours / maxWeeklyHours) * 100, 100);
  
  // 平均课时长度
  const avgClassDuration = weeklyClasses > 0 
    ? Math.round((weeklyHours * 60) / weeklyClasses) 
    : 60;
  
  const coachName = coachBookings[0]?.coachName || `教练${coachId}`;
  
  return {
    coachId,
    coachName,
    weeklyHours: Math.round(weeklyHours * 10) / 10,
    weeklyClasses,
    dailyDistribution,
    status,
    utilizationRate: Math.round(utilizationRate * 10) / 10,
    avgClassDuration,
  };
}

/**
 * 获取所有教练负荷
 */
export function getAllCoachWorkloads(
  bookings: Booking[],
  config: CoachWorkloadAlertConfig = defaultCoachWorkloadConfig
): CoachWorkload[] {
  const coachIds = new Set(bookings.map(b => b.coachId).filter(Boolean));
  
  return Array.from(coachIds)
    .map(coachId => calculateCoachWorkload(coachId as string, bookings, config))
    .sort((a, b) => b.weeklyHours - a.weeklyHours);
}

/**
 * 生成负荷调配建议
 */
export function generateWorkloadSuggestions(workload: CoachWorkload): string[] {
  const suggestions: string[] = [];
  
  if (workload.status === 'overload') {
    suggestions.push('⚠️ 该教练负荷过载，建议立即调整');
    
    // 分析高峰日
    const peakDays = workload.dailyDistribution
      .filter(d => d.hours >= 8)
      .map(d => d.day);
    
    if (peakDays.length > 0) {
      suggestions.push(`📅 ${peakDays.join('、')}课时过于集中，建议分散安排`);
    }
    
    suggestions.push('👥 考虑将部分课程转移给其他教练');
    suggestions.push('📋 评估是否需要招聘新教练分担压力');
    suggestions.push('💡 关注教练身心健康，避免过度疲劳');
    
  } else if (workload.status === 'underload') {
    suggestions.push('📉 该教练负荷不足，需要增加排课');
    
    // 分析空闲日
    const freeDays = workload.dailyDistribution
      .filter(d => d.hours === 0)
      .map(d => d.day);
    
    if (freeDays.length > 0) {
      suggestions.push(`📅 ${freeDays.join('、')}完全空闲，可安排课程`);
    }
    
    suggestions.push('🎯 安排该教练承接新会员体验课');
    suggestions.push('📢 推广该教练的特色课程');
    suggestions.push('👥 将其他过载教练的课程转移过来');
    
  } else {
    suggestions.push('✅ 该教练负荷正常，保持当前安排');
  }
  
  return suggestions;
}

/**
 * 生成全局调配方案
 */
export function generateGlobalRedistributionPlan(workloads: CoachWorkload[]): string[] {
  const overloaded = workloads.filter(w => w.status === 'overload');
  const underloaded = workloads.filter(w => w.status === 'underload');
  
  const suggestions: string[] = [];
  
  if (overloaded.length > 0 && underloaded.length > 0) {
    suggestions.push('🔄 检测到负荷不均衡，建议进行课程重新分配：');
    
    overloaded.forEach(o => {
      const excessHours = o.weeklyHours - 40;
      const bestMatch = underloaded
        .filter(u => u.coachId !== o.coachId)
        .sort((a, b) => a.weeklyHours - b.weeklyHours)[0];
      
      if (bestMatch) {
        suggestions.push(`• 将 ${o.coachName} 的 ${Math.round(excessHours)} 小时课程转移给 ${bestMatch.coachName}`);
      }
    });
  }
  
  if (overloaded.length > workloads.length * 0.3) {
    suggestions.push('⚠️ 超过30%教练处于过载状态，建议：');
    suggestions.push('• 招聘新教练扩充团队');
    suggestions.push('• 优化课程排期，分散高峰时段');
    suggestions.push('• 考虑限制新会员购买私教课');
  }
  
  if (underloaded.length > workloads.length * 0.3) {
    suggestions.push('📉 超过30%教练负荷不足，建议：');
    suggestions.push('• 加强教练培训和推广');
    suggestions.push('• 开展促销活动增加私教需求');
    suggestions.push('• 评估是否需要优化教练团队结构');
  }
  
  return suggestions;
}

/**
 * 检测教练负荷预警
 */
export function detectCoachWorkloadAlerts(
  bookings: Booking[],
  config: CoachWorkloadAlertConfig = defaultCoachWorkloadConfig
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();
  
  const workloads = getAllCoachWorkloads(bookings, config);
  
  // 过载教练
  const overloadedCoaches = workloads.filter(w => w.status === 'overload');
  const underloadedCoaches = workloads.filter(w => w.status === 'underload');
  
  // 整体过载预警
  if (overloadedCoaches.length > 0) {
    const level = overloadedCoaches.length > 2 ? 'high' : 'medium';
    alerts.push({
      id: `coach-overload-${now.getTime()}`,
      category: 'coach_workload' as AlertCategory,
      level,
      title: `${overloadedCoaches.length} 位教练负荷过载`,
      description: `有 ${overloadedCoaches.length} 位教练周课时超过 ${config.overloadThreshold} 小时，需要调整排课`,
      details: {
        count: overloadedCoaches.length,
        threshold: config.overloadThreshold,
        coaches: overloadedCoaches.map(c => ({
          name: c.coachName,
          weeklyHours: c.weeklyHours,
          weeklyClasses: c.weeklyClasses,
        })),
      },
      suggestions: [
        '重新分配过载教练的课程',
        '优化排课时间，分散高峰时段',
        '考虑招聘新教练',
        ...generateGlobalRedistributionPlan(workloads),
      ],
      status: 'active',
      createdAt: now,
      ruleId: 'coach_workload_overload',
    });
    
    // 为每位过载教练生成单独预警
    overloadedCoaches.forEach((workload, index) => {
      alerts.push({
        id: `coach-overload-${workload.coachId}-${now.getTime()}`,
        category: 'coach_workload' as AlertCategory,
        level: 'high',
        title: `教练负荷过载：${workload.coachName}`,
        description: `周课时 ${workload.weeklyHours} 小时，超过阈值 ${config.overloadThreshold} 小时`,
        details: workload,
        suggestions: generateWorkloadSuggestions(workload),
        status: 'active',
        createdAt: new Date(now.getTime() + index * 1000),
        ruleId: 'coach_workload_individual',
      });
    });
  }
  
  // 负荷不足预警
  if (underloadedCoaches.length > 0) {
    alerts.push({
      id: `coach-underload-${now.getTime()}`,
      category: 'coach_workload' as AlertCategory,
      level: 'medium',
      title: `${underloadedCoaches.length} 位教练负荷不足`,
      description: `有 ${underloadedCoaches.length} 位教练周课时低于 ${config.underloadThreshold} 小时，需要增加排课`,
      details: {
        count: underloadedCoaches.length,
        threshold: config.underloadThreshold,
        coaches: underloadedCoaches.map(c => ({
          name: c.coachName,
          weeklyHours: c.weeklyHours,
          utilizationRate: c.utilizationRate,
        })),
      },
      suggestions: [
        '安排空闲教练承接新会员体验课',
        '推广低负荷教练的特色课程',
        '将过载教练的课程转移给空闲教练',
        ...generateGlobalRedistributionPlan(workloads),
      ],
      status: 'active',
      createdAt: now,
      ruleId: 'coach_workload_underload',
    });
  }
  
  // 负荷不均衡预警
  if (overloadedCoaches.length > 0 && underloadedCoaches.length > 0) {
    alerts.push({
      id: `coach-imbalance-${now.getTime()}`,
      category: 'coach_workload' as AlertCategory,
      level: 'medium',
      title: '教练团队负荷不均衡',
      description: `同时存在 ${overloadedCoaches.length} 位过载教练和 ${underloadedCoaches.length} 位负荷不足教练`,
      details: {
        overloadCount: overloadedCoaches.length,
        underloadCount: underloadedCoaches.length,
        allWorkloads: workloads,
      },
      suggestions: generateGlobalRedistributionPlan(workloads),
      status: 'active',
      createdAt: now,
      ruleId: 'coach_workload_imbalance',
    });
  }
  
  return alerts;
}
