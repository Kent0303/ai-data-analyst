/**
 * 表格类型识别器
 * 根据表头字段自动识别表格类型（会员名单、消费记录、进店记录、团课预约、私教预约等）
 */

export type TableType = 
  | 'member_list'      // 会员名单
  | 'consumption_record' // 消费记录
  | 'entry_record'     // 进店记录
  | 'group_class_booking' // 团课预约
  | 'private_class_booking' // 私教预约
  | 'unknown';         // 未知类型

export interface TableInfo {
  type: TableType;
  confidence: number; // 0-1 的置信度
  matchedFields: string[]; // 匹配到的关键字段
  possibleJoinFields?: string[]; // 可能的关联字段
}

// 表格类型特征字段定义
interface TableTypeDefinition {
  type: TableType;
  name: string;
  // 必需字段（至少匹配一个）
  requiredFields: string[];
  // 可选字段（用于提高置信度）
  optionalFields: string[];
  // 权重配置
  weights: {
    requiredMatch: number;  // 必需字段匹配权重
    optionalMatch: number;  // 可选字段匹配权重
  };
  // 可能的关联字段
  joinFields: string[];
}

// 表格类型定义
const tableTypeDefinitions: TableTypeDefinition[] = [
  {
    type: 'member_list',
    name: '会员名单',
    requiredFields: [
      '会员', '姓名', 'name', 'member', '用户', '客户', '手机号', '电话', 'phone'
    ],
    optionalFields: [
      '卡号', '会员卡号', '会员类型', '会员等级', 'vip', 'level',
      '性别', '年龄', '生日', '注册日期', '开卡日期', '到期日期',
      '状态', '余额', '积分', '备注'
    ],
    weights: {
      requiredMatch: 0.6,
      optionalMatch: 0.4,
    },
    joinFields: ['会员ID', '手机号', '姓名', '卡号', '会员卡号'],
  },
  {
    type: 'consumption_record',
    name: '消费记录',
    requiredFields: [
      '金额', '消费', '价格', 'payment', 'amount', 'price', 'total',
      '订单', '支付', '付款', '消费金额', '实付金额'
    ],
    optionalFields: [
      '订单号', '订单编号', '消费时间', '消费日期', '支付方式',
      '商品', '项目名称', '消费类型', '折扣', '优惠', '原价',
      '收银员', '门店', '备注', '状态'
    ],
    weights: {
      requiredMatch: 0.6,
      optionalMatch: 0.4,
    },
    joinFields: ['会员ID', '手机号', '姓名', '订单号', '会员姓名'],
  },
  {
    type: 'entry_record',
    name: '进店记录',
    requiredFields: [
      '进店', '入场', '签到', '打卡', 'entry', 'checkin', 'check-in',
      '入场时间', '进店时间', '签到时间'
    ],
    optionalFields: [
      '出场', '离场', '签退', '出场时间', '离场时间',
      '门店', '场馆', '区域', '设备', '门禁',
      '状态', '时长', '备注'
    ],
    weights: {
      requiredMatch: 0.6,
      optionalMatch: 0.4,
    },
    joinFields: ['会员ID', '手机号', '姓名', '卡号', '会员卡号'],
  },
  {
    type: 'group_class_booking',
    name: '团课预约',
    requiredFields: [
      '团课', '课程', '预约', 'class', 'course', 'booking',
      '课程名称', '团课名称', '课程类型'
    ],
    optionalFields: [
      '教练', '老师', '讲师', '教练姓名',
      '时间', '日期', '开始时间', '结束时间', '时长',
      '教室', '场地', '人数', '限额', '已预约',
      '状态', '预约状态', '签到状态', '取消原因'
    ],
    weights: {
      requiredMatch: 0.6,
      optionalMatch: 0.4,
    },
    joinFields: ['会员ID', '手机号', '姓名', '课程ID', '预约ID'],
  },
  {
    type: 'private_class_booking',
    name: '私教预约',
    requiredFields: [
      '私教', '私教课', 'PT', 'personal', 'trainer',
      '私教名称', '私教课程', '教练'
    ],
    optionalFields: [
      '教练', '私教教练', '教练姓名', '教练ID',
      '时间', '日期', '开始时间', '结束时间', '时长',
      '节数', '课时', '剩余课时', '总课时',
      '状态', '预约状态', '签到状态', '课程类型'
    ],
    weights: {
      requiredMatch: 0.6,
      optionalMatch: 0.4,
    },
    joinFields: ['会员ID', '手机号', '姓名', '教练ID', '私教ID', '预约ID'],
  },
];

/**
 * 字段匹配函数 - 支持模糊匹配
 */
function matchField(header: string, patterns: string[]): boolean {
  const normalizedHeader = header.toLowerCase().trim();
  
  return patterns.some(pattern => {
    const normalizedPattern = pattern.toLowerCase().trim();
    
    // 精确匹配
    if (normalizedHeader === normalizedPattern) return true;
    
    // 包含匹配
    if (normalizedHeader.includes(normalizedPattern)) return true;
    if (normalizedPattern.includes(normalizedHeader)) return true;
    
    // 相似度匹配（简单的编辑距离概念）
    const similarity = calculateSimilarity(normalizedHeader, normalizedPattern);
    if (similarity > 0.8) return true;
    
    return false;
  });
}

/**
 * 计算字符串相似度（简化版）
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * 计算 Levenshtein 距离
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * 识别表格类型
 * @param headers 表头数组
 * @param sampleData 样本数据（前几行）
 * @returns 表格类型信息
 */
export function recognizeTableType(headers: string[], sampleData: any[][] = []): TableInfo {
  if (!headers || headers.length === 0) {
    return { type: 'unknown', confidence: 0, matchedFields: [] };
  }

  let bestMatch: TableInfo = { type: 'unknown', confidence: 0, matchedFields: [] };

  for (const definition of tableTypeDefinitions) {
    // 统计匹配字段
    const matchedRequired: string[] = [];
    const matchedOptional: string[] = [];

    for (const header of headers) {
      if (matchField(header, definition.requiredFields)) {
        matchedRequired.push(header);
      } else if (matchField(header, definition.optionalFields)) {
        matchedOptional.push(header);
      }
    }

    // 计算置信度
    const requiredRatio = matchedRequired.length / Math.min(definition.requiredFields.length, 3);
    const optionalRatio = matchedOptional.length / Math.min(definition.optionalFields.length, 5);
    
    const confidence = 
      Math.min(requiredRatio, 1) * definition.weights.requiredMatch +
      Math.min(optionalRatio, 1) * definition.weights.optionalMatch;

    // 更新最佳匹配
    if (confidence > bestMatch.confidence) {
      // 识别可能的关联字段
      const possibleJoinFields = headers.filter(header => 
        matchField(header, definition.joinFields)
      );

      bestMatch = {
        type: definition.type,
        confidence: Math.min(confidence, 1),
        matchedFields: [...matchedRequired, ...matchedOptional],
        possibleJoinFields: possibleJoinFields.length > 0 ? possibleJoinFields : undefined,
      };
    }
  }

  // 如果置信度太低，标记为未知
  if (bestMatch.confidence < 0.3) {
    return { type: 'unknown', confidence: bestMatch.confidence, matchedFields: bestMatch.matchedFields };
  }

  return bestMatch;
}

/**
 * 批量识别多个表格
 */
export function recognizeMultipleTables(
  tables: { name: string; headers: string[]; sampleData?: any[][] }[]
): Array<{ name: string; tableInfo: TableInfo }> {
  return tables.map(table => ({
    name: table.name,
    tableInfo: recognizeTableType(table.headers, table.sampleData),
  }));
}

/**
 * 获取表格类型的中文名称
 */
export function getTableTypeLabel(type: TableType): string {
  const labels: Record<TableType, string> = {
    member_list: '会员名单',
    consumption_record: '消费记录',
    entry_record: '进店记录',
    group_class_booking: '团课预约',
    private_class_booking: '私教预约',
    unknown: '未知类型',
  };
  return labels[type] || '未知类型';
}

/**
 * 获取表格类型的描述
 */
export function getTableTypeDescription(type: TableType): string {
  const descriptions: Record<TableType, string> = {
    member_list: '包含会员基本信息、联系方式、会员等级等',
    consumption_record: '包含消费金额、消费项目、支付方式等',
    entry_record: '包含进店时间、出场时间、门店信息等',
    group_class_booking: '包含团课预约、课程信息、教练信息等',
    private_class_booking: '包含私教预约、教练信息、课时信息等',
    unknown: '无法识别的表格类型',
  };
  return descriptions[type] || '';
}

// ============ 数据类型定义 ============

export interface Member {
  id: string;
  name: string;
  phone?: string;
  cardNo?: string;
  gender?: string;
  age?: number;
  registerDate: string;
  membershipExpiry?: string;
  membershipType?: string;
  status?: string;
  source?: string;
  [key: string]: any;
}

export interface Consumption {
  id: string;
  memberId: string;
  memberName?: string;
  amount: number;
  type: 'card' | 'private_class' | 'group_class' | 'other';
  date: string;
  coachId?: string;
  coachName?: string;
  itemName?: string;
  paymentMethod?: string;
  [key: string]: any;
}

export interface EntryRecord {
  id: string;
  memberId: string;
  memberName?: string;
  entryTime: string;
  exitTime?: string;
  store?: string;
  [key: string]: any;
}

export interface Booking {
  id: string;
  memberId: string;
  memberName?: string;
  coachId?: string;
  coachName?: string;
  type: 'group' | 'private';
  bookingTime: string;
  duration?: number;
  attendees?: number;
  className?: string;
  status?: string;
  [key: string]: any;
}
