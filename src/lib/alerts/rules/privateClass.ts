/**
 * 私教课包到期预警规则
 * 检测规则：剩余课时 ≤ 3
 */

import { Member, Booking, Consumption } from '@/lib/tableRecognizer';
import { Alert, AlertLevel, AlertCategory } from '../types';

export interface PrivateClassAlertConfig {
  // 剩余课时预警阈值
  remainingSessionsThreshold: number;
  // 已过期课时包检测
  detectExpired: boolean;
  // 即将用完天数阈值
  daysToEmptyThreshold: number;
}

export const defaultPrivateClassConfig: PrivateClassAlertConfig = {
  remainingSessionsThreshold: 3,
  detectExpired: true,
  daysToEmptyThreshold: 14,
};

export interface PrivateClassPackage {
  packageId: string;
  memberId: string;
  memberName: string;
  phone?: string;
  coachId?: string;
  coachName?: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  purchaseDate: string;
  expiryDate?: string;
  status: 'active' | 'expiring' | 'expired' | 'empty';
  progressPercentage: number;
}

export interface PackageUsagePrediction {
  avgSessionsPerWeek: number;
  estimatedEmptyDate: Date;
  daysToEmpty: number;
  recommendedPackage: string;
}

/**
 * 分析私教课包使用情况
 */
export function analyzePrivateClassPackages(
  members: Member[],
  bookings: Booking[],
  consumptions: Consumption[],
  config: PrivateClassAlertConfig = defaultPrivateClassConfig
): PrivateClassPackage[] {
  const now = new Date();
  const packages: PrivateClassPackage[] = [];
  
  // 按会员分组分析私教课包
  const memberPrivateClasses = new Map<string, { bookings: Booking[]; consumptions: Consumption[] }>();
  
  bookings
    .filter(b => b.type === 'private')
    .forEach(b => {
      if (!memberPrivateClasses.has(b.memberId)) {
        memberPrivateClasses.set(b.memberId, { bookings: [], consumptions: [] });
      }
      memberPrivateClasses.get(b.memberId)!.bookings.push(b);
    });
  
  consumptions
    .filter(c => c.type === 'private_class')
    .forEach(c => {
      if (!memberPrivateClasses.has(c.memberId)) {
        memberPrivateClasses.set(c.memberId, { bookings: [], consumptions: [] });
      }
      memberPrivateClasses.get(c.memberId)!.consumptions.push(c);
    });
  
  // 分析每个会员的课包
  memberPrivateClasses.forEach((data, memberId) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    const totalSessions = data.consumptions.reduce((sum, c) => {
      // 从消费记录中提取课时数
      const sessions = c.sessions || c.quantity || 1;
      return sum + (typeof sessions === 'number' ? sessions : 1);
    }, 0);
    
    const usedSessions = data.bookings.filter(b => b.status === 'completed' || !b.status).length;
    const remainingSessions = Math.max(0, totalSessions - usedSessions);
    
    // 确定状态
    let status: PrivateClassPackage['status'] = 'active';
    if (remainingSessions === 0) {
      status = 'empty';
    } else if (remainingSessions <= config.remainingSessionsThreshold) {
      status = 'expiring';
    }
    
    // 检查是否过期
    const expiryDate = member.privateClassExpiry;
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      if (expiry < now) {
        status = 'expired';
      } else if (status === 'active' && 
                 (expiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000) <= config.daysToEmptyThreshold) {
        status = 'expiring';
      }
    }
    
    const progressPercentage = totalSessions > 0 ? (usedSessions / totalSessions) * 100 : 0;
    
    packages.push({
      packageId: `pkg-${memberId}`,
      memberId,
      memberName: member.name,
      phone: member.phone,
      coachId: data.bookings[0]?.coachId,
      coachName: data.bookings[0]?.coachName,
      totalSessions,
      usedSessions,
      remainingSessions,
      purchaseDate: data.consumptions[0]?.date || new Date().toISOString(),
      expiryDate: member.privateClassExpiry,
      status,
      progressPercentage: Math.round(progressPercentage * 10) / 10,
    });
  });
  
  return packages.sort((a, b) => a.remainingSessions - b.remainingSessions);
}

/**
 * 预测课包用完时间
 */
export function predictPackageEmpty(
  memberId: string,
  remainingSessions: number,
  bookings: Booking[]
): PackageUsagePrediction {
  const memberBookings = bookings
    .filter(b => b.memberId === memberId && b.type === 'private')
    .sort((a, b) => new Date(a.bookingTime).getTime() - new Date(b.bookingTime).getTime());
  
  if (memberBookings.length < 2 || remainingSessions <= 0) {
    return {
      avgSessionsPerWeek: 0,
      estimatedEmptyDate: new Date(),
      daysToEmpty: 0,
      recommendedPackage: '根据历史数据，建议续购10-20节课包',
    };
  }
  
  // 计算平均每周上课频率
  const firstBooking = new Date(memberBookings[0].bookingTime);
  const lastBooking = new Date(memberBookings[memberBookings.length - 1].bookingTime);
  const weeksDiff = Math.max(1, (lastBooking.getTime() - firstBooking.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const avgSessionsPerWeek = memberBookings.length / weeksDiff;
  
  // 预测用完时间
  const weeksToEmpty = avgSessionsPerWeek > 0 ? remainingSessions / avgSessionsPerWeek : 0;
  const daysToEmpty = Math.round(weeksToEmpty * 7);
  const estimatedEmptyDate = new Date(Date.now() + daysToEmpty * 24 * 60 * 60 * 1000);
  
  // 推荐续课方案
  let recommendedPackage = '';
  if (avgSessionsPerWeek >= 3) {
    recommendedPackage = '高频用户，建议续购30-50节课包，享受更大优惠';
  } else if (avgSessionsPerWeek >= 1) {
    recommendedPackage = '建议续购20-30节课包，保持训练连续性';
  } else {
    recommendedPackage = '低频用户，建议续购10节课包，降低决策门槛';
  }
  
  return {
    avgSessionsPerWeek: Math.round(avgSessionsPerWeek * 10) / 10,
    estimatedEmptyDate,
    daysToEmpty,
    recommendedPackage,
  };
}

/**
 * 生成续课建议
 */
export function generateRenewalSuggestion(pkg: PrivateClassPackage, prediction: PackageUsagePrediction): string[] {
  const suggestions: string[] = [];
  
  if (pkg.status === 'empty') {
    suggestions.push('📞 立即联系会员，了解停止上课原因');
    suggestions.push('🎁 提供续课优惠，如买20送2');
    suggestions.push('📅 帮助会员重新制定训练计划');
  } else if (pkg.status === 'expiring') {
    suggestions.push('⏰ 提醒会员课包即将用完');
    suggestions.push('💡 ' + prediction.recommendedPackage);
    suggestions.push('🎯 根据训练目标推荐合适的课程包');
    
    if (prediction.daysToEmpty <= 7) {
      suggestions.push('🔥 紧急：预计一周内用完，需立即跟进');
    }
  } else if (pkg.status === 'expired') {
    suggestions.push('⚠️ 课包已过期，联系会员协商延期或续费');
    suggestions.push('📋 了解过期原因，提供针对性解决方案');
  }
  
  // 根据进度提供建议
  if (pkg.progressPercentage < 30) {
    suggestions.push('📊 上课频率偏低，建议调整训练计划');
  }
  
  return suggestions;
}

/**
 * 检测私教课包预警
 */
export function detectPrivateClassAlerts(
  members: Member[],
  bookings: Booking[],
  consumptions: Consumption[],
  config: PrivateClassAlertConfig = defaultPrivateClassConfig
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();
  
  const packages = analyzePrivateClassPackages(members, bookings, consumptions, config);
  
  // 统计各类状态
  const emptyPackages = packages.filter(p => p.status === 'empty');
  const expiringPackages = packages.filter(p => p.status === 'expiring');
  const expiredPackages = packages.filter(p => p.status === 'expired');
  
  // 课包已用完预警
  if (emptyPackages.length > 0) {
    alerts.push({
      id: `private-empty-${now.getTime()}`,
      category: 'private_class' as AlertCategory,
      level: 'high',
      title: `${emptyPackages.length} 位会员私教课包已用完`,
      description: `有 ${emptyPackages.length} 位会员的私教课时已用完，需要及时跟进续课`,
      details: {
        count: emptyPackages.length,
        members: emptyPackages.slice(0, 5).map(p => ({
          name: p.memberName,
          coach: p.coachName,
          lastPackageDate: p.purchaseDate,
        })),
      },
      suggestions: [
        '立即联系会员，了解停止上课原因',
        '提供续课优惠方案',
        '安排教练进行训练成果回访',
      ],
      status: 'active',
      createdAt: now,
      ruleId: 'private_class_empty',
    });
  }
  
  // 课包即将用完预警
  if (expiringPackages.length > 0) {
    const level = expiringPackages.length > 5 ? 'high' : 'medium';
    alerts.push({
      id: `private-expiring-${now.getTime()}`,
      category: 'private_class' as AlertCategory,
      level,
      title: `${expiringPackages.length} 位会员私教课包即将用完`,
      description: `有 ${expiringPackages.length} 位会员的私教课剩余课时 ≤ ${config.remainingSessionsThreshold} 节`,
      details: {
        count: expiringPackages.length,
        threshold: config.remainingSessionsThreshold,
        members: expiringPackages.slice(0, 5).map(p => {
          const prediction = predictPackageEmpty(p.memberId, p.remainingSessions, bookings);
          return {
            ...p,
            prediction,
          };
        }),
      },
      suggestions: [
        '主动提醒会员课包余额',
        '推荐合适的续课方案',
        '安排教练沟通训练计划',
      ],
      status: 'active',
      createdAt: now,
      ruleId: 'private_class_expiring',
    });
    
    // 为前3位生成单独预警
    expiringPackages.slice(0, 3).forEach((pkg, index) => {
      const prediction = predictPackageEmpty(pkg.memberId, pkg.remainingSessions, bookings);
      alerts.push({
        id: `private-member-${pkg.memberId}-${now.getTime()}`,
        category: 'private_class' as AlertCategory,
        level: pkg.remainingSessions <= 1 ? 'high' : 'medium',
        title: `私教课包预警：${pkg.memberName}`,
        description: `剩余 ${pkg.remainingSessions} 节课，已使用 ${pkg.progressPercentage}%`,
        details: {
          ...pkg,
          prediction,
        },
        suggestions: generateRenewalSuggestion(pkg, prediction),
        status: 'active',
        createdAt: new Date(now.getTime() + index * 1000),
        ruleId: 'private_class_individual',
      });
    });
  }
  
  // 课包过期预警
  if (expiredPackages.length > 0 && config.detectExpired) {
    alerts.push({
      id: `private-expired-${now.getTime()}`,
      category: 'private_class' as AlertCategory,
      level: 'medium',
      title: `${expiredPackages.length} 位会员私教课包已过期`,
      description: `有 ${expiredPackages.length} 位会员的私教课包已过期，需要协商处理`,
      details: {
        count: expiredPackages.length,
        members: expiredPackages.slice(0, 5).map(p => ({
          name: p.memberName,
          expiryDate: p.expiryDate,
          remainingSessions: p.remainingSessions,
        })),
      },
      suggestions: [
        '联系会员协商延期或退款方案',
        '了解过期原因，改进服务流程',
        '提供重新激活优惠',
      ],
      status: 'active',
      createdAt: now,
      ruleId: 'private_class_expired',
    });
  }
  
  return alerts;
}
