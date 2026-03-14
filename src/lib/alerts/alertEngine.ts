/**
 * 预警引擎
 * 支持定时检测和实时检测
 */

import { Member, EntryRecord, Booking, Consumption } from '@/lib/tableRecognizer';
import { 
  Alert, 
  AlertRule, 
  AlertCategory, 
  AlertLevel, 
  AlertStatus,
  AlertHistory,
} from './types';
import {
  detectMemberChurnAlerts,
  detectPrivateClassAlerts,
  detectCoachWorkloadAlerts,
  detectRevenueAnomalyAlerts,
  MemberChurnAlertConfig,
  PrivateClassAlertConfig,
  CoachWorkloadAlertConfig,
  RevenueAnomalyAlertConfig,
  defaultMemberChurnConfig,
  defaultPrivateClassConfig,
  defaultCoachWorkloadConfig,
  defaultRevenueAnomalyConfig,
} from './rules';

// 预警引擎配置
export interface AlertEngineConfig {
  // 是否启用自动检测
  autoDetection: boolean;
  // 自动检测间隔（分钟）
  detectionIntervalMinutes: number;
  // 各类预警规则配置
  rules: {
    memberChurn: MemberChurnAlertConfig;
    privateClass: PrivateClassAlertConfig;
    coachWorkload: CoachWorkloadAlertConfig;
    revenueAnomaly: RevenueAnomalyAlertConfig;
  };
  // 预警保留天数
  alertRetentionDays: number;
  // 是否启用通知
  notificationsEnabled: boolean;
}

// 默认配置
export const defaultAlertEngineConfig: AlertEngineConfig = {
  autoDetection: true,
  detectionIntervalMinutes: 60,
  rules: {
    memberChurn: defaultMemberChurnConfig,
    privateClass: defaultPrivateClassConfig,
    coachWorkload: defaultCoachWorkloadConfig,
    revenueAnomaly: defaultRevenueAnomalyConfig,
  },
  alertRetentionDays: 30,
  notificationsEnabled: true,
};

// 数据源接口
export interface AlertDataSource {
  members: Member[];
  entries: EntryRecord[];
  bookings: Booking[];
  consumptions: Consumption[];
}

// 预警引擎类
export class AlertEngine {
  private config: AlertEngineConfig;
  private alerts: Alert[] = [];
  private alertHistory: AlertHistory[] = [];
  private detectionTimer: NodeJS.Timeout | null = null;
  private listeners: ((alerts: Alert[]) => void)[] = [];

  constructor(config: Partial<AlertEngineConfig> = {}) {
    this.config = { ...defaultAlertEngineConfig, ...config };
    this.loadFromStorage();
  }

  // 获取当前配置
  getConfig(): AlertEngineConfig {
    return { ...this.config };
  }

  // 更新配置
  updateConfig(config: Partial<AlertEngineConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveToStorage();
    
    // 如果自动检测配置改变，重启定时器
    if (config.autoDetection !== undefined || config.detectionIntervalMinutes !== undefined) {
      this.stopAutoDetection();
      if (this.config.autoDetection) {
        this.startAutoDetection();
      }
    }
  }

  // 更新规则配置
  updateRuleConfig(
    category: AlertCategory,
    ruleConfig: MemberChurnAlertConfig | PrivateClassAlertConfig | CoachWorkloadAlertConfig | RevenueAnomalyAlertConfig
  ): void {
    switch (category) {
      case 'member_churn':
        this.config.rules.memberChurn = ruleConfig as MemberChurnAlertConfig;
        break;
      case 'private_class':
        this.config.rules.privateClass = ruleConfig as PrivateClassAlertConfig;
        break;
      case 'coach_workload':
        this.config.rules.coachWorkload = ruleConfig as CoachWorkloadAlertConfig;
        break;
      case 'revenue_anomaly':
        this.config.rules.revenueAnomaly = ruleConfig as RevenueAnomalyAlertConfig;
        break;
    }
    this.saveToStorage();
  }

  // 执行完整检测（所有规则）
  async detectAll(dataSource: AlertDataSource): Promise<Alert[]> {
    const newAlerts: Alert[] = [];

    // 会员流失预警
    const churnAlerts = detectMemberChurnAlerts(
      dataSource.members,
      dataSource.entries,
      dataSource.consumptions,
      dataSource.bookings,
      this.config.rules.memberChurn
    );
    newAlerts.push(...churnAlerts);

    // 私教课包预警
    const privateClassAlerts = detectPrivateClassAlerts(
      dataSource.members,
      dataSource.bookings,
      dataSource.consumptions,
      this.config.rules.privateClass
    );
    newAlerts.push(...privateClassAlerts);

    // 教练负荷预警
    const workloadAlerts = detectCoachWorkloadAlerts(
      dataSource.bookings,
      this.config.rules.coachWorkload
    );
    newAlerts.push(...workloadAlerts);

    // 营收异常预警
    const revenueAlerts = detectRevenueAnomalyAlerts(
      dataSource.consumptions,
      this.config.rules.revenueAnomaly
    );
    newAlerts.push(...revenueAlerts);

    // 合并新预警到列表
    this.mergeAlerts(newAlerts);
    
    // 更新历史记录
    this.updateHistory();
    
    // 保存到存储
    this.saveToStorage();
    
    // 通知监听器
    this.notifyListeners();

    return newAlerts;
  }

  // 按类别检测
  async detectByCategory(
    category: AlertCategory,
    dataSource: AlertDataSource
  ): Promise<Alert[]> {
    let newAlerts: Alert[] = [];

    switch (category) {
      case 'member_churn':
        newAlerts = detectMemberChurnAlerts(
          dataSource.members,
          dataSource.entries,
          dataSource.consumptions,
          dataSource.bookings,
          this.config.rules.memberChurn
        );
        break;
      case 'private_class':
        newAlerts = detectPrivateClassAlerts(
          dataSource.members,
          dataSource.bookings,
          dataSource.consumptions,
          this.config.rules.privateClass
        );
        break;
      case 'coach_workload':
        newAlerts = detectCoachWorkloadAlerts(
          dataSource.bookings,
          this.config.rules.coachWorkload
        );
        break;
      case 'revenue_anomaly':
        newAlerts = detectRevenueAnomalyAlerts(
          dataSource.consumptions,
          this.config.rules.revenueAnomaly
        );
        break;
    }

    this.mergeAlerts(newAlerts);
    this.updateHistory();
    this.saveToStorage();
    this.notifyListeners();

    return newAlerts;
  }

  // 合并预警（避免重复）
  private mergeAlerts(newAlerts: Alert[]): void {
    newAlerts.forEach(newAlert => {
      // 检查是否已存在相同规则的活跃预警
      const existingIndex = this.alerts.findIndex(
        a => a.ruleId === newAlert.ruleId && a.status === 'active'
      );
      
      if (existingIndex >= 0) {
        // 更新现有预警
        this.alerts[existingIndex] = {
          ...newAlert,
          id: this.alerts[existingIndex].id, // 保持原有ID
          createdAt: this.alerts[existingIndex].createdAt, // 保持原有创建时间
        };
      } else {
        // 添加新预警
        this.alerts.push(newAlert);
      }
    });

    // 清理过期预警
    this.cleanupOldAlerts();
  }

  // 清理过期预警
  private cleanupOldAlerts(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.alertRetentionDays);

    this.alerts = this.alerts.filter(alert => {
      if (alert.status === 'active') return true;
      return alert.createdAt >= cutoffDate;
    });
  }

  // 更新历史记录
  private updateHistory(): void {
    const today = new Date().toISOString().split('T')[0];
    const byCategory: Record<AlertCategory, number> = {
      member_churn: 0,
      private_class: 0,
      coach_workload: 0,
      revenue_anomaly: 0,
      system: 0,
    };
    const byLevel: Record<AlertLevel, number> = {
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    this.alerts
      .filter(a => a.createdAt.toISOString().split('T')[0] === today)
      .forEach(alert => {
        byCategory[alert.category]++;
        byLevel[alert.level]++;
      });

    const existingIndex = this.alertHistory.findIndex(h => h.date === today);
    if (existingIndex >= 0) {
      this.alertHistory[existingIndex] = {
        date: today,
        total: this.alerts.filter(a => a.createdAt.toISOString().split('T')[0] === today).length,
        byCategory,
        byLevel,
      };
    } else {
      this.alertHistory.push({
        date: today,
        total: this.alerts.filter(a => a.createdAt.toISOString().split('T')[0] === today).length,
        byCategory,
        byLevel,
      });
    }

    // 只保留最近30天的历史
    this.alertHistory = this.alertHistory.slice(-30);
  }

  // 获取所有预警
  getAlerts(options?: {
    status?: AlertStatus;
    category?: AlertCategory;
    level?: AlertLevel;
    limit?: number;
  }): Alert[] {
    let filtered = [...this.alerts];

    if (options?.status) {
      filtered = filtered.filter(a => a.status === options.status);
    }
    if (options?.category) {
      filtered = filtered.filter(a => a.category === options.category);
    }
    if (options?.level) {
      filtered = filtered.filter(a => a.level === options.level);
    }

    // 按创建时间倒序
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  // 获取活跃预警数量
  getActiveAlertCount(): number {
    return this.alerts.filter(a => a.status === 'active').length;
  }

  // 按类别统计
  getAlertStats(): {
    total: number;
    active: number;
    byCategory: Record<AlertCategory, number>;
    byLevel: Record<AlertLevel, number>;
  } {
    const byCategory: Record<AlertCategory, number> = {
      member_churn: 0,
      private_class: 0,
      coach_workload: 0,
      revenue_anomaly: 0,
      system: 0,
    };
    const byLevel: Record<AlertLevel, number> = {
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    this.alerts.filter(a => a.status === 'active').forEach(alert => {
      byCategory[alert.category]++;
      byLevel[alert.level]++;
    });

    return {
      total: this.alerts.length,
      active: this.getActiveAlertCount(),
      byCategory,
      byLevel,
    };
  }

  // 获取历史记录
  getHistory(): AlertHistory[] {
    return [...this.alertHistory];
  }

  // 解决预警
  resolveAlert(alertId: string, resolvedBy?: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;

    this.saveToStorage();
    this.notifyListeners();
    return true;
  }

  // 忽略预警
  ignoreAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.status = 'ignored';
    this.saveToStorage();
    this.notifyListeners();
    return true;
  }

  // 激活预警
  activateAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.status = 'active';
    alert.resolvedAt = undefined;
    alert.resolvedBy = undefined;

    this.saveToStorage();
    this.notifyListeners();
    return true;
  }

  // 删除预警
  deleteAlert(alertId: string): boolean {
    const index = this.alerts.findIndex(a => a.id === alertId);
    if (index === -1) return false;

    this.alerts.splice(index, 1);
    this.saveToStorage();
    this.notifyListeners();
    return true;
  }

  // 清空所有预警
  clearAllAlerts(): void {
    this.alerts = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  // 启动自动检测
  startAutoDetection(dataSource?: AlertDataSource): void {
    if (this.detectionTimer) return;

    if (dataSource) {
      // 立即执行一次检测
      this.detectAll(dataSource);
    }

    // 设置定时器
    this.detectionTimer = setInterval(() => {
      if (dataSource) {
        this.detectAll(dataSource);
      }
    }, this.config.detectionIntervalMinutes * 60 * 1000);
  }

  // 停止自动检测
  stopAutoDetection(): void {
    if (this.detectionTimer) {
      clearInterval(this.detectionTimer);
      this.detectionTimer = null;
    }
  }

  // 添加监听器
  addListener(listener: (alerts: Alert[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // 通知监听器
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.alerts));
  }

  // 保存到本地存储
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('alertEngineConfig', JSON.stringify(this.config));
      localStorage.setItem('alertEngineAlerts', JSON.stringify(this.alerts));
      localStorage.setItem('alertEngineHistory', JSON.stringify(this.alertHistory));
    } catch (e) {
      console.error('Failed to save alerts to storage:', e);
    }
  }

  // 从本地存储加载
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const configStr = localStorage.getItem('alertEngineConfig');
      if (configStr) {
        this.config = { ...this.config, ...JSON.parse(configStr) };
      }

      const alertsStr = localStorage.getItem('alertEngineAlerts');
      if (alertsStr) {
        const parsed = JSON.parse(alertsStr);
        this.alerts = parsed.map((a: any) => ({
          ...a,
          createdAt: new Date(a.createdAt),
          resolvedAt: a.resolvedAt ? new Date(a.resolvedAt) : undefined,
        }));
      }

      const historyStr = localStorage.getItem('alertEngineHistory');
      if (historyStr) {
        this.alertHistory = JSON.parse(historyStr);
      }
    } catch (e) {
      console.error('Failed to load alerts from storage:', e);
    }
  }
}

// 单例实例
let globalAlertEngine: AlertEngine | null = null;

// 获取预警引擎实例
export function getAlertEngine(config?: Partial<AlertEngineConfig>): AlertEngine {
  if (!globalAlertEngine) {
    globalAlertEngine = new AlertEngine(config);
  }
  return globalAlertEngine;
}

// 重置预警引擎
export function resetAlertEngine(): void {
  globalAlertEngine = null;
}
