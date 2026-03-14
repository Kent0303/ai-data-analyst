export interface TimeEntity {
  type: 'relative' | 'absolute' | 'range';
  value: string;
  startDate?: Date;
  endDate?: Date;
  description: string;
}

export interface MetricEntity {
  name: string;
  category: 'member' | 'revenue' | 'coach' | 'venue' | 'general';
  synonyms: string[];
}

export interface DimensionEntity {
  name: string;
  field: string;
  description: string;
}

export interface ExtractedEntities {
  time?: TimeEntity;
  metrics: MetricEntity[];
  dimensions: DimensionEntity[];
  filters: Record<string, string>;
}

// 时间实体模式
const TIME_PATTERNS: Array<{
  pattern: RegExp;
  type: TimeEntity['type'];
  getValue: (match: RegExpMatchArray) => Partial<TimeEntity>;
}> = [
  // 相对时间
  {
    pattern: /今天|今日|today/i,
    type: 'relative',
    getValue: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return {
        value: 'today',
        startDate: today,
        endDate: new Date(),
        description: '今天'
      };
    }
  },
  {
    pattern: /昨天|昨日|yesterday/i,
    type: 'relative',
    getValue: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      return {
        value: 'yesterday',
        startDate: yesterday,
        endDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
        description: '昨天'
      };
    }
  },
  {
    pattern: /本周|这周|this week/i,
    type: 'relative',
    getValue: () => {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return {
        value: 'this_week',
        startDate: startOfWeek,
        endDate: now,
        description: '本周'
      };
    }
  },
  {
    pattern: /上周|last week/i,
    type: 'relative',
    getValue: () => {
      const now = new Date();
      const endOfLastWeek = new Date(now);
      endOfLastWeek.setDate(now.getDate() - now.getDay() - 1);
      endOfLastWeek.setHours(23, 59, 59, 999);
      const startOfLastWeek = new Date(endOfLastWeek);
      startOfLastWeek.setDate(endOfLastWeek.getDate() - 6);
      startOfLastWeek.setHours(0, 0, 0, 0);
      return {
        value: 'last_week',
        startDate: startOfLastWeek,
        endDate: endOfLastWeek,
        description: '上周'
      };
    }
  },
  {
    pattern: /本月|这个月|this month/i,
    type: 'relative',
    getValue: () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        value: 'this_month',
        startDate: startOfMonth,
        endDate: now,
        description: '本月'
      };
    }
  },
  {
    pattern: /上月|上个月|last month/i,
    type: 'relative',
    getValue: () => {
      const now = new Date();
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return {
        value: 'last_month',
        startDate: startOfLastMonth,
        endDate: endOfLastMonth,
        description: '上月'
      };
    }
  },
  {
    pattern: /最近(\d+)天|过去(\d+)天|最近(\d+)日/i,
    type: 'relative',
    getValue: (match) => {
      const days = parseInt(match[1] || match[2] || match[3]);
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      start.setHours(0, 0, 0, 0);
      return {
        value: `last_${days}_days`,
        startDate: start,
        endDate: end,
        description: `最近${days}天`
      };
    }
  },
  {
    pattern: /最近30天|近30天|last 30 days/i,
    type: 'relative',
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return {
        value: 'last_30_days',
        startDate: start,
        endDate: end,
        description: '最近30天'
      };
    }
  },
  {
    pattern: /最近7天|近7天|近一周|last 7 days/i,
    type: 'relative',
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return {
        value: 'last_7_days',
        startDate: start,
        endDate: end,
        description: '最近7天'
      };
    }
  },
  // 绝对时间 - 年月
  {
    pattern: /(\d{4})年(\d{1,2})月/i,
    type: 'absolute',
    getValue: (match) => {
      const year = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      return {
        value: `${year}-${String(month + 1).padStart(2, '0')}`,
        startDate: start,
        endDate: end,
        description: `${year}年${month + 1}月`
      };
    }
  },
  // 今年/去年
  {
    pattern: /今年|this year/i,
    type: 'relative',
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      return {
        value: 'this_year',
        startDate: start,
        endDate: now,
        description: '今年'
      };
    }
  },
  {
    pattern: /去年|last year/i,
    type: 'relative',
    getValue: () => {
      const now = new Date();
      const year = now.getFullYear() - 1;
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31, 23, 59, 59, 999);
      return {
        value: 'last_year',
        startDate: start,
        endDate: end,
        description: '去年'
      };
    }
  }
];

// 指标实体定义
const METRIC_DEFINITIONS: MetricEntity[] = [
  // 会员相关
  {
    name: 'member_count',
    category: 'member',
    synonyms: ['会员数', '会员数量', '会员人数', '总人数', '注册人数', '会员', '人数']
  },
  {
    name: 'new_members',
    category: 'member',
    synonyms: ['新会员', '新增会员', '新注册', '新增人数']
  },
  {
    name: 'active_members',
    category: 'member',
    synonyms: ['活跃会员', '活跃人数', '到店人数', '活跃']
  },
  {
    name: 'churn_rate',
    category: 'member',
    synonyms: ['流失率', '会员流失', '流失', '取消率', '退会率']
  },
  {
    name: 'retention_rate',
    category: 'member',
    synonyms: ['留存率', '保留率', '续费率']
  },
  // 收入相关
  {
    name: 'revenue',
    category: 'revenue',
    synonyms: ['收入', '营收', '营业额', '销售额', '金额', '钱', '收入金额']
  },
  {
    name: 'private_class_revenue',
    category: 'revenue',
    synonyms: ['私教收入', '私教课收入', '私教营收', '私教金额']
  },
  {
    name: 'card_revenue',
    category: 'revenue',
    synonyms: ['会员卡收入', '卡收入', '会籍收入', '办卡收入']
  },
  {
    name: 'arpu',
    category: 'revenue',
    synonyms: ['客单价', '人均消费', 'ARPU', '平均消费']
  },
  // 教练相关
  {
    name: 'coach_sessions',
    category: 'coach',
    synonyms: ['私教课时', '课时数', '上课次数', '课时', '节数']
  },
  {
    name: 'coach_revenue',
    category: 'coach',
    synonyms: ['教练收入', '教练业绩', '私教业绩', '教练销售额']
  },
  {
    name: 'coach_utilization',
    category: 'coach',
    synonyms: ['教练利用率', '产能利用率', '饱和度', '排课率']
  },
  // 场地相关
  {
    name: 'venue_utilization',
    category: 'venue',
    synonyms: ['场地利用率', '场馆利用率', '使用率', '利用率']
  },
  {
    name: 'peak_hours',
    category: 'venue',
    synonyms: ['高峰时段', '高峰期', '繁忙时段', '热门时段']
  },
  {
    name: 'attendance',
    category: 'venue',
    synonyms: ['出勤率', '到场率', '签到率', '打卡率']
  }
];

// 维度实体定义
const DIMENSION_DEFINITIONS: DimensionEntity[] = [
  {
    name: 'coach',
    field: 'coach_name',
    description: '按教练'
  },
  {
    name: 'store',
    field: 'store_name',
    description: '按门店'
  },
  {
    name: 'class_type',
    field: 'class_type',
    description: '按课程类型'
  },
  {
    name: 'membership_type',
    field: 'membership_type',
    description: '按会员类型'
  },
  {
    name: 'time',
    field: 'date',
    description: '按时间'
  },
  {
    name: 'gender',
    field: 'gender',
    description: '按性别'
  },
  {
    name: 'age_group',
    field: 'age_group',
    description: '按年龄段'
  }
];

// 维度关键词映射
const DIMENSION_KEYWORDS: Record<string, string> = {
  '按教练': 'coach',
  '教练': 'coach',
  '按门店': 'store',
  '门店': 'store',
  '分店': 'store',
  '按课程': 'class_type',
  '课程类型': 'class_type',
  '课程': 'class_type',
  '按会员类型': 'membership_type',
  '会员类型': 'membership_type',
  '卡类型': 'membership_type',
  '按时间': 'time',
  '按日期': 'time',
  '按月份': 'time',
  '按月': 'time',
  '按性别': 'gender',
  '性别': 'gender',
  '按年龄': 'age_group',
  '年龄段': 'age_group'
};

/**
 * 实体提取器
 * 从自然语言中提取时间、指标、维度等实体
 */
export class EntityExtractor {
  /**
   * 提取时间实体
   */
  extractTime(input: string): TimeEntity | undefined {
    for (const { pattern, type, getValue } of TIME_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        return {
          type,
          ...getValue(match)
        } as TimeEntity;
      }
    }
    return undefined;
  }

  /**
   * 提取指标实体
   */
  extractMetrics(input: string): MetricEntity[] {
    const normalizedInput = input.toLowerCase();
    const matched: MetricEntity[] = [];

    for (const metric of METRIC_DEFINITIONS) {
      for (const synonym of metric.synonyms) {
        if (normalizedInput.includes(synonym.toLowerCase())) {
          matched.push(metric);
          break;
        }
      }
    }

    return matched;
  }

  /**
   * 提取维度实体
   */
  extractDimensions(input: string): DimensionEntity[] {
    const matched: DimensionEntity[] = [];

    for (const [keyword, dimName] of Object.entries(DIMENSION_KEYWORDS)) {
      if (input.includes(keyword)) {
        const def = DIMENSION_DEFINITIONS.find(d => d.name === dimName);
        if (def && !matched.find(m => m.name === def.name)) {
          matched.push(def);
        }
      }
    }

    return matched;
  }

  /**
   * 提取过滤条件
   */
  extractFilters(input: string): Record<string, string> {
    const filters: Record<string, string> = {};
    
    // 检测特定教练名称
    const coachMatch = input.match(/教练[是叫]?([\u4e00-\u9fa5]{2,4})/);
    if (coachMatch) {
      filters.coach_name = coachMatch[1];
    }

    // 检测特定门店
    const storeMatch = input.match(/([\u4e00-\u9fa5]+店)/);
    if (storeMatch) {
      filters.store_name = storeMatch[1];
    }

    // 检测状态过滤
    if (/活跃|有效|正常/.test(input)) {
      filters.status = 'active';
    }
    if (/流失|取消|退会|过期/.test(input)) {
      filters.status = 'inactive';
    }

    return filters;
  }

  /**
   * 提取所有实体
   */
  extractAll(input: string): ExtractedEntities {
    return {
      time: this.extractTime(input),
      metrics: this.extractMetrics(input),
      dimensions: this.extractDimensions(input),
      filters: this.extractFilters(input)
    };
  }

  /**
   * 将实体转换为查询参数
   */
  toQueryParams(entities: ExtractedEntities): Record<string, any> {
    const params: Record<string, any> = {};

    if (entities.time) {
      params.timeRange = {
        start: entities.time.startDate?.toISOString(),
        end: entities.time.endDate?.toISOString(),
        description: entities.time.description
      };
    }

    if (entities.metrics.length > 0) {
      params.metrics = entities.metrics.map(m => m.name);
    }

    if (entities.dimensions.length > 0) {
      params.dimensions = entities.dimensions.map(d => d.name);
    }

    if (Object.keys(entities.filters).length > 0) {
      params.filters = entities.filters;
    }

    return params;
  }
}

// 单例实例
let extractorInstance: EntityExtractor | null = null;

export function getEntityExtractor(): EntityExtractor {
  if (!extractorInstance) {
    extractorInstance = new EntityExtractor();
  }
  return extractorInstance;
}

// 便捷函数
export function extractEntities(input: string): ExtractedEntities {
  return getEntityExtractor().extractAll(input);
}
