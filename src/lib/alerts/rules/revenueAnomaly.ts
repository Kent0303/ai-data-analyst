/**
 * 营收异常预警规则
 * 检测规则：周环比下降 > 20% 或 同比增长异常
 */

import { Consumption } from '@/lib/tableRecognizer';
import { Alert, AlertLevel, AlertCategory } from '../types';

export interface RevenueAnomalyAlertConfig {
  // 周环比下降阈值（%）
  weekOverWeekThreshold: number;
  // 月环比下降阈值（%）
  monthOverMonthThreshold: number;
  // 同比增长异常阈值（%）
  yearOverYearThreshold: number;
  // 最低营收警戒线
  minRevenueThreshold: number;
  // 成本激增阈值（%）
  costSpikeThreshold: number;
}

export const defaultRevenueAnomalyConfig: RevenueAnomalyAlertConfig = {
  weekOverWeekThreshold: 20,
  monthOverMonthThreshold: 15,
  yearOverYearThreshold: 30,
  minRevenueThreshold: 50000,
  costSpikeThreshold: 25,
};

export interface RevenueTrend {
  period: string;
  revenue: number;
  cost: number;
  profit: number;
  transactionCount: number;
  avgTransactionValue: number;
}

export interface AnomalyDetection {
  type: 'weekOverWeek' | 'monthOverMonth' | 'yearOverYear' | 'costSpike' | 'lowRevenue';
  severity: 'high' | 'medium' | 'low';
  currentValue: number;
  previousValue: number;
  changePercentage: number;
  description: string;
  possibleCauses: string[];
}

/**
 * 计算营收趋势
 */
export function calculateRevenueTrends(
  consumptions: Consumption[]
): {
  daily: RevenueTrend[];
  weekly: RevenueTrend[];
  monthly: RevenueTrend[];
} {
  const now = new Date();
  
  // 按天汇总
  const dailyMap = new Map<string, { revenue: number; count: number }>();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  consumptions
    .filter(c => new Date(c.date) >= thirtyDaysAgo)
    .forEach(c => {
      const date = c.date.split(' ')[0];
      const current = dailyMap.get(date) || { revenue: 0, count: 0 };
      dailyMap.set(date, {
        revenue: current.revenue + c.amount,
        count: current.count + 1,
      });
    });
  
  const daily = Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      period: date,
      revenue: data.revenue,
      cost: 0, // 成本数据需要额外输入
      profit: data.revenue,
      transactionCount: data.count,
      avgTransactionValue: data.count > 0 ? Math.round(data.revenue / data.count) : 0,
    }))
    .sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());
  
  // 按周汇总
  const weeklyMap = new Map<string, { revenue: number; count: number }>();
  consumptions.forEach(c => {
    const date = new Date(c.date);
    const weekStart = new Date(date.getTime() - date.getDay() * 24 * 60 * 60 * 1000);
    const weekKey = `${weekStart.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
    const current = weeklyMap.get(weekKey) || { revenue: 0, count: 0 };
    weeklyMap.set(weekKey, {
      revenue: current.revenue + c.amount,
      count: current.count + 1,
    });
  });
  
  const weekly = Array.from(weeklyMap.entries())
    .map(([week, data]) => ({
      period: week,
      revenue: data.revenue,
      cost: 0,
      profit: data.revenue,
      transactionCount: data.count,
      avgTransactionValue: data.count > 0 ? Math.round(data.revenue / data.count) : 0,
    }))
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-12);
  
  // 按月汇总
  const monthlyMap = new Map<string, { revenue: number; count: number }>();
  consumptions.forEach(c => {
    const date = new Date(c.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const current = monthlyMap.get(monthKey) || { revenue: 0, count: 0 };
    monthlyMap.set(monthKey, {
      revenue: current.revenue + c.amount,
      count: current.count + 1,
    });
  });
  
  const monthly = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      period: month,
      revenue: data.revenue,
      cost: 0,
      profit: data.revenue,
      transactionCount: data.count,
      avgTransactionValue: data.count > 0 ? Math.round(data.revenue / data.count) : 0,
    }))
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-12);
  
  return { daily, weekly, monthly };
}

/**
 * 检测异常
 */
export function detectAnomalies(
  trends: { daily: RevenueTrend[]; weekly: RevenueTrend[]; monthly: RevenueTrend[] },
  config: RevenueAnomalyAlertConfig = defaultRevenueAnomalyConfig
): AnomalyDetection[] {
  const anomalies: AnomalyDetection[] = [];
  
  // 周环比检测
  if (trends.weekly.length >= 2) {
    const current = trends.weekly[trends.weekly.length - 1];
    const previous = trends.weekly[trends.weekly.length - 2];
    const changePercent = ((current.revenue - previous.revenue) / previous.revenue) * 100;
    
    if (Math.abs(changePercent) > config.weekOverWeekThreshold) {
      anomalies.push({
        type: 'weekOverWeek',
        severity: changePercent < -30 ? 'high' : changePercent < -20 ? 'medium' : 'low',
        currentValue: current.revenue,
        previousValue: previous.revenue,
        changePercentage: Math.round(changePercent * 10) / 10,
        description: `周营收 ${changePercent > 0 ? '增长' : '下降'} ${Math.abs(changePercent).toFixed(1)}%`,
        possibleCauses: changePercent < 0 ? [
          '节假日或特殊事件影响',
          '竞争对手促销活动',
          '天气因素',
          '会员流失',
          '课程安排问题',
        ] : [
          '促销活动效果显著',
          '新会员增长',
          '节假日消费高峰',
        ],
      });
    }
  }
  
  // 月环比检测
  if (trends.monthly.length >= 2) {
    const current = trends.monthly[trends.monthly.length - 1];
    const previous = trends.monthly[trends.monthly.length - 2];
    const changePercent = ((current.revenue - previous.revenue) / previous.revenue) * 100;
    
    if (Math.abs(changePercent) > config.monthOverMonthThreshold) {
      anomalies.push({
        type: 'monthOverMonth',
        severity: changePercent < -25 ? 'high' : changePercent < -15 ? 'medium' : 'low',
        currentValue: current.revenue,
        previousValue: previous.revenue,
        changePercentage: Math.round(changePercent * 10) / 10,
        description: `月营收 ${changePercent > 0 ? '增长' : '下降'} ${Math.abs(changePercent).toFixed(1)}%`,
        possibleCauses: changePercent < 0 ? [
          '季节性因素',
          '市场环境变化',
          '会员续费率下降',
          '课程价格调整影响',
        ] : [
          '营销策略有效',
          '会员增长稳定',
          '客单价提升',
        ],
      });
    }
  }
  
  // 同比增长检测（需要去年同期数据）
  if (trends.monthly.length >= 13) {
    const current = trends.monthly[trends.monthly.length - 1];
    const sameMonthLastYear = trends.monthly[trends.monthly.length - 13];
    const changePercent = ((current.revenue - sameMonthLastYear.revenue) / sameMonthLastYear.revenue) * 100;
    
    if (Math.abs(changePercent) > config.yearOverYearThreshold) {
      anomalies.push({
        type: 'yearOverYear',
        severity: changePercent < -30 ? 'high' : 'medium',
        currentValue: current.revenue,
        previousValue: sameMonthLastYear.revenue,
        changePercentage: Math.round(changePercent * 10) / 10,
        description: `同比${changePercent > 0 ? '增长' : '下降'} ${Math.abs(changePercent).toFixed(1)}%`,
        possibleCauses: changePercent < 0 ? [
          '市场竞争加剧',
          '经营策略需要调整',
          '行业整体下滑',
          '服务质量问题',
        ] : [
          '经营策略有效',
          '市场份额扩大',
          '品牌影响力提升',
        ],
      });
    }
  }
  
  // 低营收警戒
  if (trends.weekly.length > 0) {
    const current = trends.weekly[trends.weekly.length - 1];
    if (current.revenue < config.minRevenueThreshold) {
      anomalies.push({
        type: 'lowRevenue',
        severity: current.revenue < config.minRevenueThreshold * 0.5 ? 'high' : 'medium',
        currentValue: current.revenue,
        previousValue: config.minRevenueThreshold,
        changePercentage: 0,
        description: `周营收低于警戒线 ${config.minRevenueThreshold} 元`,
        possibleCauses: [
          '会员活跃度下降',
          '新客获取不足',
          '续费率降低',
          '市场竞争压力',
        ],
      });
    }
  }
  
  return anomalies;
}

/**
 * 根因分析
 */
export function analyzeRootCauses(
  anomaly: AnomalyDetection,
  consumptions: Consumption[]
): string[] {
  const causes: string[] = [];
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // 分析收入构成变化
  const recentConsumptions = consumptions.filter(c => new Date(c.date) >= sevenDaysAgo);
  
  // 按类型分析
  const byType = new Map<string, number>();
  recentConsumptions.forEach(c => {
    const type = c.type || 'other';
    byType.set(type, (byType.get(type) || 0) + c.amount);
  });
  
  // 检查各类收入占比
  const totalRevenue = Array.from(byType.values()).reduce((a, b) => a + b, 0);
  
  if (totalRevenue > 0) {
    const cardRevenue = byType.get('card') || 0;
    const privateRevenue = byType.get('private_class') || 0;
    const groupRevenue = byType.get('group_class') || 0;
    
    if (cardRevenue / totalRevenue < 0.3) {
      causes.push('会员卡收入占比偏低，新客获取可能不足');
    }
    if (privateRevenue / totalRevenue < 0.2) {
      causes.push('私教课程收入偏低，需加强私教推广');
    }
  }
  
  // 分析客单价变化
  if (recentConsumptions.length > 0) {
    const avgValue = totalRevenue / recentConsumptions.length;
    if (avgValue < 200) {
      causes.push(`客单价偏低（${avgValue.toFixed(0)}元），建议推广高价值课程包`);
    }
  }
  
  // 分析交易频次
  if (recentConsumptions.length < 10) {
    causes.push('近期交易频次低，会员活跃度可能下降');
  }
  
  return causes;
}

/**
 * 生成应对建议
 */
export function generateRevenueSuggestions(anomaly: AnomalyDetection): string[] {
  const suggestions: string[] = [];
  
  if (anomaly.type === 'weekOverWeek' && anomaly.changePercentage < 0) {
    suggestions.push('📊 立即分析本周会员到店率和消费情况');
    suggestions.push('🎯 启动紧急促销方案，如限时折扣');
    suggestions.push('📞 联系高价值会员，了解未到店原因');
    suggestions.push('📱 加大社交媒体推广力度');
  } else if (anomaly.type === 'monthOverMonth' && anomaly.changePercentage < 0) {
    suggestions.push('📈 复盘上月营销策略效果');
    suggestions.push('🎁 设计新的会员续费优惠方案');
    suggestions.push('👥 开展会员满意度调研');
    suggestions.push('💡 考虑引入新课程或服务');
  } else if (anomaly.type === 'yearOverYear' && anomaly.changePercentage < 0) {
    suggestions.push('🔍 深入分析市场竞争环境');
    suggestions.push('📋 重新评估定价策略');
    suggestions.push('🚀 制定年度增长复苏计划');
    suggestions.push('🤝 考虑与其他品牌合作引流');
  } else if (anomaly.type === 'lowRevenue') {
    suggestions.push('⚠️ 启动营收保护机制');
    suggestions.push('💰 审查成本结构，控制支出');
    suggestions.push('📢 全员营销，提升销售转化');
  }
  
  return suggestions;
}

/**
 * 检测营收异常预警
 */
export function detectRevenueAnomalyAlerts(
  consumptions: Consumption[],
  config: RevenueAnomalyAlertConfig = defaultRevenueAnomalyConfig
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();
  
  const trends = calculateRevenueTrends(consumptions);
  const anomalies = detectAnomalies(trends, config);
  
  anomalies.forEach((anomaly, index) => {
    const rootCauses = analyzeRootCauses(anomaly, consumptions);
    
    alerts.push({
      id: `revenue-${anomaly.type}-${now.getTime()}-${index}`,
      category: 'revenue_anomaly' as AlertCategory,
      level: anomaly.severity as AlertLevel,
      title: `营收异常：${anomaly.description}`,
      description: anomaly.possibleCauses[0] || '检测到营收异常波动',
      details: {
        ...anomaly,
        rootCauses,
        trends,
      },
      suggestions: [
        ...generateRevenueSuggestions(anomaly),
        ...rootCauses.map(c => `📌 ${c}`),
      ],
      status: 'active',
      createdAt: new Date(now.getTime() + index * 1000),
      ruleId: `revenue_${anomaly.type}`,
    });
  });
  
  // 如果没有异常，生成正常状态报告
  if (alerts.length === 0 && trends.weekly.length > 0) {
    const current = trends.weekly[trends.weekly.length - 1];
    alerts.push({
      id: `revenue-normal-${now.getTime()}`,
      category: 'revenue_anomaly' as AlertCategory,
      level: 'info',
      title: '营收状况正常',
      description: `本周营收 ${current.revenue.toLocaleString()} 元，环比保持稳定`,
      details: {
        currentWeek: current,
        trends,
      },
      suggestions: [
        '继续保持当前经营策略',
        '关注会员满意度',
        '寻找增长机会',
      ],
      status: 'active',
      createdAt: now,
      ruleId: 'revenue_normal',
    });
  }
  
  return alerts;
}
