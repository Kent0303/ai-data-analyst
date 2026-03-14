import { Member, EntryRecord, Booking, Consumption } from '@/lib/tableRecognizer';

// ============ 会员生命周期分析指标 ============

export interface MemberLifecycleMetrics {
  // 新客获取
  newMemberAcquisition: {
    totalNewMembers: number;
    byChannel: { channel: string; count: number; conversionRate: number }[];
    firstPurchaseConversion: number; // 首购转化率
    avgTimeToFirstPurchase: number; // 平均首购时间(天)
  };
  // 会员激活
  activation: {
    activatedMembers: number;
    activationRate: number;
    avgTimeToFirstEntry: number; // 首次进店平均时间
    avgTimeToFirstBooking: number; // 首次预约平均时间
  };
  // 留存分析
  retention: {
    activeMembers: number;
    activeRate: number;
    avgVisitFrequency: number; // 平均访问频率(次/周)
    silentMembers: number; // 沉默会员数
    silentRate: number; // 沉默率
  };
  // 流失预警
  churn: {
    highRiskMembers: number;
    mediumRiskMembers: number;
    lowRiskMembers: number;
    avgChurnRiskScore: number;
  };
}

// 计算会员生命周期指标
export function calculateMemberLifecycleMetrics(
  members: Member[],
  entries: EntryRecord[],
  bookings: Booking[],
  consumptions: Consumption[]
): MemberLifecycleMetrics {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // 新会员获取
  const newMembers = members.filter(m => new Date(m.registerDate) >= thirtyDaysAgo);
  const channelMap = new Map<string, number>();
  newMembers.forEach(m => {
    const channel = m.source || '未知';
    channelMap.set(channel, (channelMap.get(channel) || 0) + 1);
  });
  
  // 首购转化
  const membersWithPurchase = new Set(consumptions.map(c => c.memberId));
  const newMembersWithPurchase = newMembers.filter(m => membersWithPurchase.has(m.id));
  
  // 计算平均首购时间
  let totalTimeToFirstPurchase = 0;
  let purchaseCount = 0;
  newMembersWithPurchase.forEach(m => {
    const firstConsumption = consumptions
      .filter(c => c.memberId === m.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    if (firstConsumption) {
      const days = (new Date(firstConsumption.date).getTime() - new Date(m.registerDate).getTime()) / (24 * 60 * 60 * 1000);
      if (days >= 0) {
        totalTimeToFirstPurchase += days;
        purchaseCount++;
      }
    }
  });

  // 会员激活
  const memberEntriesMap = new Map<string, EntryRecord[]>();
  entries.forEach(e => {
    if (!memberEntriesMap.has(e.memberId)) {
      memberEntriesMap.set(e.memberId, []);
    }
    memberEntriesMap.get(e.memberId)!.push(e);
  });

  const activatedMembers = members.filter(m => memberEntriesMap.has(m.id));
  
  // 计算首次进店时间
  let totalTimeToFirstEntry = 0;
  let entryCount = 0;
  activatedMembers.forEach(m => {
    const firstEntry = memberEntriesMap.get(m.id)!
      .sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime())[0];
    if (firstEntry) {
      const days = (new Date(firstEntry.entryTime).getTime() - new Date(m.registerDate).getTime()) / (24 * 60 * 60 * 1000);
      if (days >= 0) {
        totalTimeToFirstEntry += days;
        entryCount++;
      }
    }
  });

  // 首次预约时间
  const memberBookingsMap = new Map<string, Booking[]>();
  bookings.forEach(b => {
    if (!memberBookingsMap.has(b.memberId)) {
      memberBookingsMap.set(b.memberId, []);
    }
    memberBookingsMap.get(b.memberId)!.push(b);
  });

  let totalTimeToFirstBooking = 0;
  let bookingCount = 0;
  members.forEach(m => {
    if (memberBookingsMap.has(m.id)) {
      const firstBooking = memberBookingsMap.get(m.id)!
        .sort((a, b) => new Date(a.bookingTime).getTime() - new Date(b.bookingTime).getTime())[0];
      if (firstBooking) {
        const days = (new Date(firstBooking.bookingTime).getTime() - new Date(m.registerDate).getTime()) / (24 * 60 * 60 * 1000);
        if (days >= 0) {
          totalTimeToFirstBooking += days;
          bookingCount++;
        }
      }
    }
  });

  // 留存分析 - 活跃会员(30天内有进店)
  const activeMemberIds = new Set(
    entries
      .filter(e => new Date(e.entryTime) >= thirtyDaysAgo)
      .map(e => e.memberId)
  );
  
  // 计算平均访问频率
  let totalVisits = 0;
  activeMemberIds.forEach(id => {
    totalVisits += memberEntriesMap.get(id)?.length || 0;
  });

  // 沉默会员(60天无进店)
  const silentMemberIds = new Set(
    members
      .filter(m => {
        const memberEntries = memberEntriesMap.get(m.id) || [];
        if (memberEntries.length === 0) return true;
        const lastEntry = memberEntries.sort((a, b) => 
          new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime()
        )[0];
        return new Date(lastEntry.entryTime) < sixtyDaysAgo;
      })
      .map(m => m.id)
  );

  // 流失风险评分
  const churnRiskScores = members.map(m => {
    const memberEntries = memberEntriesMap.get(m.id) || [];
    const memberBookings = memberBookingsMap.get(m.id) || [];
    const memberConsumptions = consumptions.filter(c => c.memberId === m.id);
    
    let score = 0;
    
    // 无进店记录 +30分
    if (memberEntries.length === 0) score += 30;
    
    // 长期未进店(>60天) +25分
    if (memberEntries.length > 0) {
      const lastEntry = memberEntries.sort((a, b) => 
        new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime()
      )[0];
      if (new Date(lastEntry.entryTime) < sixtyDaysAgo) {
        score += 25;
      }
    }
    
    // 无消费记录 +20分
    if (memberConsumptions.length === 0) score += 20;
    
    // 会员卡即将到期 +15分
    if (m.membershipExpiry) {
      const daysToExpiry = (new Date(m.membershipExpiry).getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
      if (daysToExpiry < 30 && daysToExpiry > 0) score += 15;
    }
    
    // 无预约记录 +10分
    if (memberBookings.length === 0) score += 10;
    
    return { memberId: m.id, score: Math.min(score, 100) };
  });

  const highRisk = churnRiskScores.filter(s => s.score >= 70);
  const mediumRisk = churnRiskScores.filter(s => s.score >= 40 && s.score < 70);
  const lowRisk = churnRiskScores.filter(s => s.score < 40);

  return {
    newMemberAcquisition: {
      totalNewMembers: newMembers.length,
      byChannel: Array.from(channelMap.entries()).map(([channel, count]) => ({
        channel,
        count,
        conversionRate: newMembers.filter(m => m.source === channel && membersWithPurchase.has(m.id)).length / count * 100
      })),
      firstPurchaseConversion: newMembers.length > 0 ? newMembersWithPurchase.length / newMembers.length * 100 : 0,
      avgTimeToFirstPurchase: purchaseCount > 0 ? Math.round(totalTimeToFirstPurchase / purchaseCount) : 0
    },
    activation: {
      activatedMembers: activatedMembers.length,
      activationRate: members.length > 0 ? activatedMembers.length / members.length * 100 : 0,
      avgTimeToFirstEntry: entryCount > 0 ? Math.round(totalTimeToFirstEntry / entryCount) : 0,
      avgTimeToFirstBooking: bookingCount > 0 ? Math.round(totalTimeToFirstBooking / bookingCount) : 0
    },
    retention: {
      activeMembers: activeMemberIds.size,
      activeRate: members.length > 0 ? activeMemberIds.size / members.length * 100 : 0,
      avgVisitFrequency: activeMemberIds.size > 0 ? Math.round(totalVisits / activeMemberIds.size / 4 * 10) / 10 : 0,
      silentMembers: silentMemberIds.size,
      silentRate: members.length > 0 ? silentMemberIds.size / members.length * 100 : 0
    },
    churn: {
      highRiskMembers: highRisk.length,
      mediumRiskMembers: mediumRisk.length,
      lowRiskMembers: lowRisk.length,
      avgChurnRiskScore: churnRiskScores.length > 0 ? Math.round(churnRiskScores.reduce((a, b) => a + b.score, 0) / churnRiskScores.length) : 0
    }
  };
}

// 获取流失风险会员详情
export function getChurnRiskMembers(
  members: Member[],
  entries: EntryRecord[],
  bookings: Booking[],
  consumptions: Consumption[]
) {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  
  return members.map(m => {
    const memberEntries = entries.filter(e => e.memberId === m.id);
    const memberBookings = bookings.filter(b => b.memberId === m.id);
    const memberConsumptions = consumptions.filter(c => c.memberId === m.id);
    
    let score = 0;
    const reasons: string[] = [];
    
    if (memberEntries.length === 0) {
      score += 30;
      reasons.push('从未进店');
    }
    
    if (memberEntries.length > 0) {
      const lastEntry = memberEntries.sort((a, b) => 
        new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime()
      )[0];
      if (new Date(lastEntry.entryTime) < sixtyDaysAgo) {
        score += 25;
        reasons.push('长期未进店');
      }
    }
    
    if (memberConsumptions.length === 0) {
      score += 20;
      reasons.push('无消费记录');
    }
    
    if (m.membershipExpiry) {
      const daysToExpiry = (new Date(m.membershipExpiry).getTime() - Date.now()) / (24 * 60 * 60 * 1000);
      if (daysToExpiry < 30 && daysToExpiry > 0) {
        score += 15;
        reasons.push('会员卡即将到期');
      }
    }
    
    if (memberBookings.length === 0) {
      score += 10;
      reasons.push('无预约记录');
    }
    
    const riskLevel = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
    
    return {
      ...m,
      riskScore: Math.min(score, 100),
      riskLevel,
      reasons,
      lastEntryDate: memberEntries.length > 0 
        ? memberEntries.sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime())[0].entryTime
        : null,
      totalConsumptions: memberConsumptions.length,
      totalEntries: memberEntries.length
    };
  }).filter(m => m.riskScore > 0).sort((a, b) => b.riskScore - a.riskScore);
}
