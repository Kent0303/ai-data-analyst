/**
 * 预警类型定义
 */

export type AlertLevel = 'high' | 'medium' | 'low' | 'info';
export type AlertStatus = 'active' | 'resolved' | 'ignored';
export type AlertCategory = 
  | 'member_churn'      // 会员流失
  | 'private_class'     // 私教课包
  | 'coach_workload'    // 教练负荷
  | 'revenue_anomaly'   // 营收异常
  | 'system';

export interface Alert {
  id: string;
  category: AlertCategory;
  level: AlertLevel;
  title: string;
  description: string;
  details: Record<string, any>;
  suggestions: string[];
  status: AlertStatus;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  ruleId: string;
}

export interface AlertRule {
  id: string;
  category: AlertCategory;
  name: string;
  description: string;
  enabled: boolean;
  config: Record<string, any>;
  level: AlertLevel;
}

export interface AlertHistory {
  date: string;
  total: number;
  byCategory: Record<AlertCategory, number>;
  byLevel: Record<AlertLevel, number>;
}

// 风险评分等级
export const RiskLevelConfig = {
  high: { label: '高风险', color: 'red', threshold: 70, icon: 'AlertTriangle' },
  medium: { label: '中风险', color: 'orange', threshold: 40, icon: 'AlertCircle' },
  low: { label: '低风险', color: 'yellow', threshold: 0, icon: 'Info' },
};

// 预警类别配置
export const AlertCategoryConfig: Record<AlertCategory, { label: string; icon: string; color: string }> = {
  member_churn: { label: '会员流失', icon: 'Users', color: 'red' },
  private_class: { label: '私教课包', icon: 'Dumbbell', color: 'blue' },
  coach_workload: { label: '教练负荷', icon: 'UserCheck', color: 'purple' },
  revenue_anomaly: { label: '营收异常', icon: 'TrendingDown', color: 'orange' },
  system: { label: '系统', icon: 'Settings', color: 'gray' },
};
