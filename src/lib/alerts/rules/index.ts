/**
 * 预警规则索引
 */

export { 
  detectMemberChurnAlerts, 
  calculateChurnRisk, 
  generateRecallStrategy,
  type MemberChurnAlertConfig,
  type ChurnRiskMember,
  defaultMemberChurnConfig,
} from './memberChurn';

export {
  detectPrivateClassAlerts,
  analyzePrivateClassPackages,
  predictPackageEmpty,
  generateRenewalSuggestion,
  type PrivateClassAlertConfig,
  type PrivateClassPackage,
  type PackageUsagePrediction,
  defaultPrivateClassConfig,
} from './privateClass';

export {
  detectCoachWorkloadAlerts,
  calculateCoachWorkload,
  getAllCoachWorkloads,
  generateWorkloadSuggestions,
  type CoachWorkloadAlertConfig,
  type CoachWorkload,
  defaultCoachWorkloadConfig,
} from './coachWorkload';

export {
  detectRevenueAnomalyAlerts,
  calculateRevenueTrends,
  detectAnomalies,
  analyzeRootCauses,
  type RevenueAnomalyAlertConfig,
  type RevenueTrend,
  type AnomalyDetection,
  defaultRevenueAnomalyConfig,
} from './revenueAnomaly';
