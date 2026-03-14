/**
 * 分析框架生成器
 * 根据识别出的表格类型，智能推荐分析维度
 */

import { TableType, getTableTypeLabel, getTableTypeDescription } from './tableRecognizer';
import { DataTable, LinkedTable, JoinGraph } from './dataLinker';

export interface AnalysisFramework {
  id: string;
  name: string;
  description: string;
  applicableTypes: TableType[];
  priority: number; // 1-10，优先级越高越重要
  dimensions: AnalysisDimension[];
  metrics: AnalysisMetric[];
  visualizations: VisualizationSuggestion[];
  insights: InsightTemplate[];
}

export interface AnalysisDimension {
  name: string;
  field: string;
  description: string;
  type: 'time' | 'category' | 'numeric' | 'location';
  aggregations?: string[];
}

export interface AnalysisMetric {
  name: string;
  field: string;
  description: string;
  calculation: 'sum' | 'count' | 'avg' | 'max' | 'min' | 'unique_count' | 'custom';
  unit?: string;
  format?: string;
}

export interface VisualizationSuggestion {
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'table' | 'funnel';
  title: string;
  description: string;
  requiredFields: string[];
  optionalFields?: string[];
  priority: number;
}

export interface InsightTemplate {
  title: string;
  description: string;
  query: string;
  expectedOutcome: string;
}

export interface GeneratedAnalysis {
  tables: DataTable[];
  frameworks: AnalysisFramework[];
  combinedInsights: CombinedInsight[];
  recommendedSequence: string[];
}

export interface CombinedInsight {
  title: string;
  description: string;
  relatedTables: string[];
  analysisType: 'trend' | 'comparison' | 'distribution' | 'correlation' | 'anomaly' | 'funnel';
  priority: number;
}

// 预定义的分析框架
const analysisFrameworks: AnalysisFramework[] = [
  // 会员名单分析框架
  {
    id: 'member_overview',
    name: '会员概览分析',
    description: '分析会员基本构成、增长趋势和分布特征',
    applicableTypes: ['member_list'],
    priority: 10,
    dimensions: [
      { name: '注册时间', field: '注册日期', description: '会员注册的时间分布', type: 'time', aggregations: ['month', 'week', 'day'] },
      { name: '会员等级', field: '会员等级', description: '不同等级会员分布', type: 'category' },
      { name: '性别', field: '性别', description: '会员性别比例', type: 'category' },
      { name: '年龄', field: '年龄', description: '会员年龄段分布', type: 'numeric' },
    ],
    metrics: [
      { name: '会员总数', field: '*', description: '累计注册会员数', calculation: 'count' },
      { name: '新增会员', field: '*', description: '新增注册会员数', calculation: 'count' },
      { name: '活跃会员', field: '*', description: '近期活跃会员数', calculation: 'count' },
      { name: '平均会员价值', field: '余额', description: '会员平均余额', calculation: 'avg', unit: '元' },
    ],
    visualizations: [
      { type: 'line', title: '会员增长趋势', description: '展示会员数量随时间的变化', requiredFields: ['注册日期'], priority: 10 },
      { type: 'pie', title: '会员等级分布', description: '各等级会员占比', requiredFields: ['会员等级'], priority: 8 },
      { type: 'bar', title: '性别比例', description: '男女会员对比', requiredFields: ['性别'], priority: 6 },
      { type: 'bar', title: '年龄段分布', description: '会员年龄结构', requiredFields: ['年龄'], priority: 7 },
    ],
    insights: [
      { title: '会员增长趋势', description: '分析会员数量的增长速度和周期性规律', query: '会员增长趋势如何？', expectedOutcome: '识别增长高峰期和低谷期' },
      { title: '会员质量分析', description: '评估会员的活跃度和价值分布', query: '高价值会员占比多少？', expectedOutcome: '识别高价值会员群体' },
    ],
  },

  // 消费记录分析框架
  {
    id: 'consumption_analysis',
    name: '消费行为分析',
    description: '深入分析会员消费模式、偏好和趋势',
    applicableTypes: ['consumption_record'],
    priority: 10,
    dimensions: [
      { name: '消费时间', field: '消费日期', description: '消费发生的时间', type: 'time', aggregations: ['month', 'week', 'day', 'hour'] },
      { name: '消费类型', field: '消费类型', description: '消费项目分类', type: 'category' },
      { name: '支付方式', field: '支付方式', description: '支付渠道分布', type: 'category' },
      { name: '会员', field: '会员ID', description: '按会员分析', type: 'category' },
    ],
    metrics: [
      { name: '总消费金额', field: '金额', description: '累计消费总额', calculation: 'sum', unit: '元', format: 'currency' },
      { name: '消费次数', field: '*', description: '总消费笔数', calculation: 'count' },
      { name: '客单价', field: '金额', description: '平均每笔消费金额', calculation: 'avg', unit: '元', format: 'currency' },
      { name: '最高消费', field: '金额', description: '单笔最高消费', calculation: 'max', unit: '元', format: 'currency' },
      { name: '消费会员数', field: '会员ID', description: '有消费的会员数', calculation: 'unique_count' },
    ],
    visualizations: [
      { type: 'line', title: '消费趋势', description: '消费金额随时间变化', requiredFields: ['消费日期', '金额'], priority: 10 },
      { type: 'bar', title: '消费类型分布', description: '各类消费占比', requiredFields: ['消费类型', '金额'], priority: 9 },
      { type: 'pie', title: '支付方式占比', description: '不同支付方式的使用比例', requiredFields: ['支付方式'], priority: 6 },
      { type: 'funnel', title: '消费转化漏斗', description: '从浏览到支付的转化', requiredFields: ['消费类型'], priority: 7 },
    ],
    insights: [
      { title: '消费高峰期', description: '识别消费高峰时段和日期', query: '什么时候消费最活跃？', expectedOutcome: '找出最佳营销时机' },
      { title: '消费偏好', description: '分析会员的消费项目偏好', query: '最受欢迎的消费项目是什么？', expectedOutcome: '优化产品和服务组合' },
      { title: '支付习惯', description: '了解会员的支付偏好', query: '会员喜欢用什么方式支付？', expectedOutcome: '优化支付渠道' },
    ],
  },

  // 进店记录分析框架
  {
    id: 'entry_analysis',
    name: '进店行为分析',
    description: '分析会员到店频率、时长和规律',
    applicableTypes: ['entry_record'],
    priority: 9,
    dimensions: [
      { name: '进店时间', field: '进店时间', description: '进入场馆的时间', type: 'time', aggregations: ['month', 'week', 'day', 'hour'] },
      { name: '星期', field: '星期', description: '一周中的哪一天', type: 'category' },
      { name: '时段', field: '时段', description: '早中晚时段', type: 'category' },
      { name: '门店', field: '门店', description: '不同门店对比', type: 'location' },
    ],
    metrics: [
      { name: '进店次数', field: '*', description: '总进店人次', calculation: 'count' },
      { name: '到店会员数', field: '会员ID', description: '实际到店会员数', calculation: 'unique_count' },
      { name: '平均停留时长', field: '时长', description: '会员平均停留时间', calculation: 'avg', unit: '分钟' },
      { name: '高峰时段人次', field: '*', description: '高峰时段的进店人次', calculation: 'count' },
    ],
    visualizations: [
      { type: 'heatmap', title: '进店热力图', description: '不同时段的进店频率', requiredFields: ['进店时间'], priority: 10 },
      { type: 'line', title: '日进店趋势', description: '每日进店人次变化', requiredFields: ['进店时间'], priority: 9 },
      { type: 'bar', title: '时段分布', description: '各时段进店占比', requiredFields: ['时段'], priority: 8 },
      { type: 'bar', title: '星期分布', description: '一周内进店分布', requiredFields: ['星期'], priority: 7 },
    ],
    insights: [
      { title: '高峰时段', description: '识别场馆的高峰和低谷时段', query: '什么时候人最多？', expectedOutcome: '优化人员配置' },
      { title: '会员活跃度', description: '分析会员的到店频率', query: '会员多久来一次？', expectedOutcome: '识别活跃和沉睡会员' },
      { title: '停留时长', description: '分析会员的停留时间分布', query: '会员一般待多久？', expectedOutcome: '优化场馆服务' },
    ],
  },

  // 团课预约分析框架
  {
    id: 'group_class_analysis',
    name: '团课运营分析',
    description: '分析团课的预约情况、受欢迎程度和教练表现',
    applicableTypes: ['group_class_booking'],
    priority: 8,
    dimensions: [
      { name: '课程时间', field: '时间', description: '课程安排时间', type: 'time', aggregations: ['month', 'week', 'day'] },
      { name: '课程类型', field: '课程名称', description: '不同类型的团课', type: 'category' },
      { name: '教练', field: '教练', description: '授课教练', type: 'category' },
      { name: '教室', field: '教室', description: '上课场地', type: 'location' },
    ],
    metrics: [
      { name: '预约次数', field: '*', description: '总预约人次', calculation: 'count' },
      { name: '签到次数', field: '*', description: '实际签到人次', calculation: 'count' },
      { name: '预约率', field: '*', description: '预约人数/限额', calculation: 'avg', format: 'percent' },
      { name: '签到率', field: '*', description: '签到人数/预约人数', calculation: 'avg', format: 'percent' },
      { name: '课程数', field: '课程ID', description: '开设课程总数', calculation: 'unique_count' },
    ],
    visualizations: [
      { type: 'bar', title: '热门课程排行', description: '预约最多的课程', requiredFields: ['课程名称'], priority: 10 },
      { type: 'bar', title: '教练人气榜', description: '各教练的预约情况', requiredFields: ['教练'], priority: 9 },
      { type: 'line', title: '预约趋势', description: '团课预约量变化', requiredFields: ['时间'], priority: 8 },
      { type: 'heatmap', title: '课程时段分布', description: '各时段课程热度', requiredFields: ['时间', '课程名称'], priority: 7 },
    ],
    insights: [
      { title: '热门课程', description: '识别最受欢迎的团课类型', query: '什么课程最受欢迎？', expectedOutcome: '优化课程设置' },
      { title: '教练表现', description: '评估各教练的受欢迎程度', query: '哪个教练最受欢迎？', expectedOutcome: '教练绩效考核' },
      { title: '预约转化', description: '分析预约到签到的转化率', query: '预约后实际来的人多吗？', expectedOutcome: '减少爽约率' },
    ],
  },

  // 私教预约分析框架
  {
    id: 'private_class_analysis',
    name: '私教业务分析',
    description: '分析私教课程的预约、消课和教练产能',
    applicableTypes: ['private_class_booking'],
    priority: 8,
    dimensions: [
      { name: '预约时间', field: '时间', description: '私教预约时间', type: 'time', aggregations: ['month', 'week', 'day'] },
      { name: '教练', field: '教练', description: '私教教练', type: 'category' },
      { name: '会员', field: '会员ID', description: '预约会员', type: 'category' },
      { name: '课程类型', field: '课程类型', description: '私教课程类型', type: 'category' },
    ],
    metrics: [
      { name: '私教课时', field: '*', description: '总私教课时数', calculation: 'count' },
      { name: '消课数', field: '*', description: '已完成课时数', calculation: 'count' },
      { name: '私教会员数', field: '会员ID', description: '购买私教的会员数', calculation: 'unique_count' },
      { name: '人均课时', field: '*', description: '会员平均购买课时', calculation: 'avg' },
      { name: '教练产能', field: '*', description: '教练平均授课数', calculation: 'avg' },
    ],
    visualizations: [
      { type: 'bar', title: '教练产能排行', description: '各教练授课量对比', requiredFields: ['教练'], priority: 10 },
      { type: 'line', title: '私教趋势', description: '私教课时变化趋势', requiredFields: ['时间'], priority: 9 },
      { type: 'pie', title: '课程类型分布', description: '各类私教占比', requiredFields: ['课程类型'], priority: 7 },
      { type: 'bar', title: '会员私教排行', description: '消费私教最多的会员', requiredFields: ['会员ID'], priority: 6 },
    ],
    insights: [
      { title: '教练产能', description: '评估教练的授课饱和度和效率', query: '哪个教练最忙？', expectedOutcome: '优化教练排班' },
      { title: '私教转化', description: '分析会员购买私教的转化情况', query: '多少会员买了私教？', expectedOutcome: '提升私教转化' },
      { title: '消课率', description: '分析私教课时的消耗情况', query: '私教课消耗得怎么样？', expectedOutcome: '减少课时积压' },
    ],
  },
];

/**
 * 根据表格类型生成分析框架
 */
export function generateAnalysisFramework(
  tables: DataTable[],
  linkedTables?: LinkedTable[],
  joinGraph?: JoinGraph
): GeneratedAnalysis {
  if (tables.length === 0) {
    return {
      tables: [],
      frameworks: [],
      combinedInsights: [],
      recommendedSequence: [],
    };
  }

  // 收集所有适用的分析框架
  const applicableFrameworks: AnalysisFramework[] = [];
  
  for (const table of tables) {
    const frameworks = analysisFrameworks.filter(f => 
      f.applicableTypes.includes(table.type)
    );
    
    for (const framework of frameworks) {
      // 检查框架是否已添加（避免重复）
      if (!applicableFrameworks.find(f => f.id === framework.id)) {
        // 根据实际表头字段过滤维度
        const filteredFramework = filterFrameworkByFields(framework, table.headers);
        if (filteredFramework.dimensions.length > 0 || filteredFramework.metrics.length > 0) {
          applicableFrameworks.push(filteredFramework);
        }
      }
    }
  }

  // 按优先级排序
  applicableFrameworks.sort((a, b) => b.priority - a.priority);

  // 生成组合洞察（多表关联分析）
  const combinedInsights = generateCombinedInsights(tables, linkedTables, joinGraph);

  // 生成推荐分析顺序
  const recommendedSequence = generateRecommendedSequence(applicableFrameworks, combinedInsights);

  return {
    tables,
    frameworks: applicableFrameworks,
    combinedInsights,
    recommendedSequence,
  };
}

/**
 * 根据实际字段过滤分析框架
 */
function filterFrameworkByFields(
  framework: AnalysisFramework,
  headers: string[]
): AnalysisFramework {
  const headerSet = new Set(headers.map(h => h.toLowerCase()));
  
  // 模糊匹配字段
  const fieldExists = (field: string): boolean => {
    const normalizedField = field.toLowerCase();
    return headerSet.has(normalizedField) || 
           Array.from(headerSet).some(h => h.includes(normalizedField) || normalizedField.includes(h));
  };

  return {
    ...framework,
    dimensions: framework.dimensions.filter(d => fieldExists(d.field)),
    metrics: framework.metrics.filter(m => m.field === '*' || fieldExists(m.field)),
    visualizations: framework.visualizations.filter(v => 
      v.requiredFields.every(f => fieldExists(f))
    ),
  };
}

/**
 * 生成组合洞察（多表关联分析建议）
 */
function generateCombinedInsights(
  tables: DataTable[],
  linkedTables?: LinkedTable[],
  joinGraph?: JoinGraph
): CombinedInsight[] {
  const insights: CombinedInsight[] = [];

  if (tables.length < 2) {
    return insights;
  }

  // 检查表格类型组合
  const hasMemberList = tables.some(t => t.type === 'member_list');
  const hasConsumption = tables.some(t => t.type === 'consumption_record');
  const hasEntry = tables.some(t => t.type === 'entry_record');
  const hasGroupClass = tables.some(t => t.type === 'group_class_booking');
  const hasPrivateClass = tables.some(t => t.type === 'private_class_booking');

  // 会员 + 消费 = 会员价值分析
  if (hasMemberList && hasConsumption) {
    insights.push({
      title: '会员价值分层分析',
      description: '结合会员信息和消费记录，分析不同会员群体的消费能力和价值贡献',
      relatedTables: ['member_list', 'consumption_record'],
      analysisType: 'distribution',
      priority: 10,
    });
  }

  // 会员 + 进店 = 活跃度分析
  if (hasMemberList && hasEntry) {
    insights.push({
      title: '会员活跃度分析',
      description: '结合会员信息和进店记录，识别活跃会员和沉睡会员',
      relatedTables: ['member_list', 'entry_record'],
      analysisType: 'trend',
      priority: 9,
    });
  }

  // 消费 + 进店 = 消费转化分析
  if (hasConsumption && hasEntry) {
    insights.push({
      title: '到店消费转化分析',
      description: '分析会员到店后的消费转化率，识别高转化时段和场景',
      relatedTables: ['entry_record', 'consumption_record'],
      analysisType: 'correlation',
      priority: 8,
    });
  }

  // 会员 + 团课 = 课程偏好分析
  if (hasMemberList && hasGroupClass) {
    insights.push({
      title: '会员课程偏好分析',
      description: '分析不同会员群体对团课的偏好差异',
      relatedTables: ['member_list', 'group_class_booking'],
      analysisType: 'comparison',
      priority: 7,
    });
  }

  // 会员 + 私教 = 私教转化分析
  if (hasMemberList && hasPrivateClass) {
    insights.push({
      title: '私教转化漏斗分析',
      description: '分析会员从注册到购买私教的转化路径',
      relatedTables: ['member_list', 'private_class_booking'],
      analysisType: 'funnel',
      priority: 8,
    });
  }

  // 三表及以上组合
  if (hasMemberList && hasConsumption && hasEntry) {
    insights.push({
      title: '综合会员画像分析',
      description: '整合会员信息、消费和进店数据，构建完整的会员画像',
      relatedTables: ['member_list', 'consumption_record', 'entry_record'],
      analysisType: 'correlation',
      priority: 10,
    });
  }

  // 流失预警分析（需要会员+消费+进店）
  if (hasMemberList && (hasConsumption || hasEntry)) {
    insights.push({
      title: '会员流失预警',
      description: '基于消费和进店行为变化，识别可能流失的会员',
      relatedTables: ['member_list', hasConsumption ? 'consumption_record' : 'entry_record'],
      analysisType: 'anomaly',
      priority: 9,
    });
  }

  return insights.sort((a, b) => b.priority - a.priority);
}

/**
 * 生成推荐的分析顺序
 */
function generateRecommendedSequence(
  frameworks: AnalysisFramework[],
  combinedInsights: CombinedInsight[]
): string[] {
  const sequence: string[] = [];

  // 1. 先进行单表基础分析
  for (const framework of frameworks) {
    if (!sequence.includes(framework.name)) {
      sequence.push(framework.name);
    }
  }

  // 2. 再进行组合洞察分析
  for (const insight of combinedInsights) {
    if (!sequence.includes(insight.title)) {
      sequence.push(insight.title);
    }
  }

  return sequence;
}

/**
 * 获取分析框架的摘要信息
 */
export function getFrameworkSummary(framework: AnalysisFramework): {
  dimensionCount: number;
  metricCount: number;
  visualizationCount: number;
  insightCount: number;
} {
  return {
    dimensionCount: framework.dimensions.length,
    metricCount: framework.metrics.length,
    visualizationCount: framework.visualizations.length,
    insightCount: framework.insights.length,
  };
}

/**
 * 根据分析类型获取建议的可视化图表
 */
export function getRecommendedVisualizations(
  analysisType: CombinedInsight['analysisType']
): VisualizationSuggestion['type'][] {
  const mapping: Record<CombinedInsight['analysisType'], VisualizationSuggestion['type'][]> = {
    trend: ['line', 'bar'],
    comparison: ['bar', 'pie'],
    distribution: ['pie', 'bar', 'heatmap'],
    correlation: ['scatter', 'heatmap'],
    anomaly: ['line', 'table'],
    funnel: ['funnel', 'bar'],
  };

  return mapping[analysisType] || ['table'];
}
