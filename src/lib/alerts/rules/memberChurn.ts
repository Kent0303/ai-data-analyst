/**
 * 会员流失风险预警规则
 * 检测规则：30天未进店 + 余额不足/即将到期
 */

import { Member, EntryRecord, Consumption, Booking } from '@/lib/tableRecognizer';
import { Alert, AlertLevel, AlertCategory } from '../types';

export interface MemberChurnAlertConfig {
  // 未进店天数阈值
  noEntryDaysThreshold: number;
  // 会员卡即将到期天数
  membershipExpiryDays: number;
  // 高风险评分阈值
  highRiskThreshold: number;
  // 中风险评分阈值
  mediumRiskThreshold: number;
}

export const defaultMemberChurnConfig: MemberChurnAlertConfig = {
  noEntryDaysThreshold: 30,
  membershipExpiryDays: 30,
  highRiskThreshold: 70,
  mediumRiskThreshold: 40,
};

export interface ChurnRiskMember {
  memberId: string;
  memberName: string;
  phone?: string;
  riskScore: number;
  riskLevel: 'high' | 'medium' | 'low';
  reasons: string[];
  lastEntryDate: string | null;
  daysSinceLastEntry: number;
  membershipExpiry?: string;
  daysToExpiry?: number;
  balance?: number;
  totalConsumptions: number;
  totalEntries: number;
}

/**
 * 计算会员流失风险评分
 */
export function calculateChurnRisk(
  member: Member,
  entries: EntryRecord[],
  consumptions: Consumption[],
  bookings: Booking[],
  config: MemberChurnAlertConfig = defaultMemberChurnConfig
): ChurnRiskMember {
  const now = new Date();
  const memberEntries = entries.filter(e => e.memberId === member.id);
  const memberBookings = bookings.filter(b => b.memberId === member.id);
  const memberConsumptions = consumptions.filter(c => c.memberId === member.id);
  
  let score = 0;
  const reasons: string[] = [];
  
  // 计算最后进店时间
  let lastEntryDate: string | null = null;
  let daysSinceLastEntry = 0;
  
  if (memberEntries.length > 0) {
    const lastEntry = memberEntries.sort((a, b) => 
      new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime()
    )[0];
    lastEntryDate = lastEntry.entryTime;
    daysSinceLastEntry = Math.floor(
      (now.getTime() - new Date(lastEntryDate).getTime()) / (24 * 60 * 60 * 1000)
    );
  }
  
  // 1. 从未进店 +30分
  if (memberEntries.length === 0) {
    score += 30;
    reasons.push('从未进店消费');
  }
  
  // 2. 超过阈值天数未进店 +25分
  if (daysSinceLastEntry > config.noEntryDaysThreshold) {
    score += 25;
    reasons.push(`${daysSinceLastEntry}天未进店`);
  }
  
  // 3. 无消费记录 +20分
  if (memberConsumptions.length === 0) {
    score += 20;
    reasons.push('无消费记录');
  }
  
  // 4. 会员卡即将到期 +15分
  let daysToExpiry: number | undefined;
  if (member.membershipExpiry) {
    daysToExpiry = Math.floor(
      (new Date(member.membershipExpiry).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (daysToExpiry > 0 && daysToExpiry <= config.membershipExpiryDays) {
      score += 15;
      reasons.push(`会员卡${daysToExpiry}天后到期`);
    } else if (daysToExpiry <= 0) {
      score += 25;
      reasons.push('会员卡已过期');
    }
  }
  
  // 5. 无预约记录 +10分
  if (memberBookings.length === 0) {
    score += 10;
    reasons.push('无课程预约记录');
  }
  
  // 6. 低活跃度（近30天进店少于2次）+10分
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentEntries = memberEntries.filter(e => 
    new Date(e.entryTime) >= thirtyDaysAgo
  );
  if (recentEntries.length < 2 && memberEntries.length > 0) {
    score += 10;
    reasons.push('近期活跃度低');
  }
  
  const finalScore = Math.min(score, 100);
  const riskLevel = finalScore >= config.highRiskThreshold ? 'high' : 
                    finalScore >= config.mediumRiskThreshold ? 'medium' : 'low';
  
  return {
    memberId: member.id,
    memberName: member.name,
    phone: member.phone,
    riskScore: finalScore,
    riskLevel,
    reasons,
    lastEntryDate,
    daysSinceLastEntry,
    membershipExpiry: member.membershipExpiry,
    daysToExpiry,
    balance: member.balance,
    totalConsumptions: memberConsumptions.length,
    totalEntries: memberEntries.length,
  };
}

/**
 * 生成召回策略建议
 */
export function generateRecallStrategy(riskMember: ChurnRiskMember): string[] {
  const strategies: string[] = [];
  
  if (riskMember.riskLevel === 'high') {
    strategies.push('🔴 高优先级：店长亲自电话回访，了解流失原因');
    strategies.push('🎁 提供专属优惠券或免费体验课');
    strategies.push('📱 安排专属顾问一对一跟进');
  } else if (riskMember.riskLevel === 'medium') {
    strategies.push('🟡 中优先级：发送关怀短信/微信，提醒会员权益');
    strategies.push('📧 推送个性化课程推荐');
    strategies.push('🎫 提供限时续费折扣');
  } else {
    strategies.push('🟢 低优先级：纳入常规维护名单');
    strategies.push('📊 定期发送健身资讯和活动邀请');
  }
  
  // 根据具体原因定制建议
  if (riskMember.reasons.some(r => r.includes('到期'))) {
    strategies.push('💳 主动推送续费优惠方案');
  }
  if (riskMember.reasons.some(r => r.includes('从未进店') || r.includes('未进店'))) {
    strategies.push('🎯 邀请参加新人专属活动');
  }
  if (riskMember.reasons.some(r => r.includes('无消费'))) {
    strategies.push('💰 推荐体验课程或小额产品');
  }
  
  return strategies;
}

/**
 * 检测会员流失风险
 */
export function detectMemberChurnAlerts(
  members: Member[],
  entries: EntryRecord[],
  consumptions: Consumption[],
  bookings: Booking[],
  config: MemberChurnAlertConfig = defaultMemberChurnConfig
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();
  
  // 只检测有流失风险的会员（评分>0）
  const riskMembers = members
    .map(m => calculateChurnRisk(m, entries, consumptions, bookings, config))
    .filter(m => m.riskScore > 0)
    .sort((a, b) => b.riskScore - a.riskScore);
  
  // 按风险等级分组生成预警
  const highRiskCount = riskMembers.filter(m => m.riskLevel === 'high').length;
  const mediumRiskCount = riskMembers.filter(m => m.riskLevel === 'medium').length;
  
  // 高风险预警
  if (highRiskCount > 0) {
    const topRiskMembers = riskMembers.filter(m => m.riskLevel === 'high').slice(0, 5);
    alerts.push({
      id: `churn-high-${now.getTime()}`,
      category: 'member_churn' as AlertCategory,
      level: 'high',
      title: `发现 ${highRiskCount} 位高风险流失会员`,
      description: `有 ${highRiskCount} 位会员流失风险评分超过 ${config.highRiskThreshold} 分，需要立即采取召回措施`,
      details: {
        totalHighRisk: highRiskCount,
        totalMediumRisk: mediumRiskCount,
        members: topRiskMembers,
      },
      suggestions: [
        '立即安排店长或顾问电话回访高风险会员',
        '准备专属召回优惠方案',
        '分析流失原因，优化服务流程',
      ],
      status: 'active',
      createdAt: now,
      ruleId: 'member_churn_high',
    });
  }
  
  // 中风险预警
  if (mediumRiskCount > 0 && highRiskCount === 0) {
    alerts.push({
      id: `churn-medium-${now.getTime()}`,
      category: 'member_churn' as AlertCategory,
      level: 'medium',
      title: `发现 ${mediumRiskCount} 位中风险流失会员`,
      description: `有 ${mediumRiskCount} 位会员存在流失风险，建议主动关怀维护`,
      details: {
        totalMediumRisk: mediumRiskCount,
        members: riskMembers.filter(m => m.riskLevel === 'medium').slice(0, 5),
      },
      suggestions: [
        '发送关怀短信或微信消息',
        '推送个性化课程推荐',
        '提供限时续费优惠',
      ],
      status: 'active',
      createdAt: now,
      ruleId: 'member_churn_medium',
    });
  }
  
  // 为前3位高风险会员生成单独预警
  riskMembers
    .filter(m => m.riskLevel === 'high')
    .slice(0, 3)
    .forEach((member, index) => {
      alerts.push({
        id: `churn-member-${member.memberId}-${now.getTime()}`,
        category: 'member_churn' as AlertCategory,
        level: 'high',
        title: `会员流失风险：${member.memberName}`,
        description: `风险评分 ${member.riskScore} 分，${member.reasons.join('，')}`,
        details: member,
        suggestions: generateRecallStrategy(member),
        status: 'active',
        createdAt: new Date(now.getTime() + index * 1000),
        ruleId: 'member_churn_individual',
      });
    });
  
  return alerts;
}
