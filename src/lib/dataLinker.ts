/**
 * 数据关联引擎
 * 基于共同字段自动关联多表
 */

import { TableType } from './tableRecognizer';

export interface DataTable {
  id: string;
  name: string;
  type: TableType;
  headers: string[];
  data: any[][];
  rowCount: number;
}

export interface LinkResult {
  success: boolean;
  linkedTables: LinkedTable[];
  joinGraph: JoinGraph;
  suggestions: LinkSuggestion[];
  errors?: string[];
}

export interface LinkedTable extends DataTable {
  joinFields: string[]; // 该表可用于关联的字段
  linkedTo: string[]; // 已关联的表ID
}

export interface JoinGraph {
  nodes: JoinNode[];
  edges: JoinEdge[];
}

export interface JoinNode {
  tableId: string;
  tableName: string;
  tableType: TableType;
  fieldCount: number;
  rowCount: number;
}

export interface JoinEdge {
  from: string;
  to: string;
  joinFields: string[];
  matchRate: number; // 匹配率
  matchCount: number; // 匹配的记录数
}

export interface LinkSuggestion {
  type: 'auto_link' | 'manual_link' | 'missing_field';
  tables: string[];
  description: string;
  recommendedFields?: string[];
  confidence: number;
}

// 常见的关联字段模式
const commonJoinFieldPatterns = {
  member_id: ['会员ID', '会员编号', '用户ID', '客户ID', 'member_id', 'user_id', 'id'],
  phone: ['手机号', '手机号码', '电话', '联系电话', 'phone', 'mobile', 'tel'],
  name: ['姓名', '会员姓名', '用户姓名', '客户姓名', 'name', 'username'],
  card_no: ['卡号', '会员卡号', '会员编号', 'card_no', 'card_number'],
  order_id: ['订单号', '订单编号', 'order_id', 'order_no'],
  class_id: ['课程ID', '课程编号', 'class_id', 'course_id'],
  trainer_id: ['教练ID', '教练编号', 'trainer_id', 'coach_id'],
};

type JoinFieldType = keyof typeof commonJoinFieldPatterns;

/**
 * 检测字段是否为关联字段
 */
function detectJoinFieldType(header: string): JoinFieldType | null {
  const normalizedHeader = header.toLowerCase().trim();
  
  for (const [type, patterns] of Object.entries(commonJoinFieldPatterns)) {
    for (const pattern of patterns) {
      const normalizedPattern = pattern.toLowerCase().trim();
      if (normalizedHeader === normalizedPattern || 
          normalizedHeader.includes(normalizedPattern) ||
          normalizedPattern.includes(normalizedHeader)) {
        return type as JoinFieldType;
      }
    }
  }
  
  return null;
}

/**
 * 查找表中的关联字段
 */
function findJoinFields(table: DataTable): Array<{ field: string; type: JoinFieldType }> {
  const joinFields: Array<{ field: string; type: JoinFieldType }> = [];
  
  for (const header of table.headers) {
    const fieldType = detectJoinFieldType(header);
    if (fieldType) {
      joinFields.push({ field: header, type: fieldType });
    }
  }
  
  return joinFields;
}

/**
 * 计算两个字段的数据匹配率
 */
function calculateMatchRate(
  table1: DataTable, 
  field1: string,
  table2: DataTable,
  field2: string
): { matchRate: number; matchCount: number } {
  const idx1 = table1.headers.indexOf(field1);
  const idx2 = table2.headers.indexOf(field2);
  
  if (idx1 === -1 || idx2 === -1) {
    return { matchRate: 0, matchCount: 0 };
  }

  // 提取数据（跳过表头）
  const values1 = new Set(
    table1.data.slice(1).map(row => String(row[idx1] || '').trim()).filter(v => v)
  );
  const values2 = new Set(
    table2.data.slice(1).map(row => String(row[idx2] || '').trim()).filter(v => v)
  );

  if (values1.size === 0 || values2.size === 0) {
    return { matchRate: 0, matchCount: 0 };
  }

  // 计算交集
  let matchCount = 0;
  for (const value of values1) {
    if (values2.has(value)) {
      matchCount++;
    }
  }

  const matchRate = matchCount / Math.min(values1.size, values2.size);
  
  return { matchRate, matchCount };
}

/**
 * 查找两个表之间的最佳关联字段组合
 */
function findBestJoinFields(
  table1: DataTable,
  table2: DataTable
): { fields: string[]; matchRate: number; matchCount: number } | null {
  const joinFields1 = findJoinFields(table1);
  const joinFields2 = findJoinFields(table2);
  
  if (joinFields1.length === 0 || joinFields2.length === 0) {
    return null;
  }

  let bestMatch: { fields: string[]; matchRate: number; matchCount: number } | null = null;

  // 按字段类型匹配
  for (const field1 of joinFields1) {
    for (const field2 of joinFields2) {
      // 优先匹配同类型字段
      if (field1.type === field2.type) {
        const { matchRate, matchCount } = calculateMatchRate(
          table1, field1.field,
          table2, field2.field
        );

        if (!bestMatch || matchRate > bestMatch.matchRate) {
          bestMatch = {
            fields: [field1.field, field2.field],
            matchRate,
            matchCount,
          };
        }
      }
    }
  }

  // 如果没有同类型匹配，尝试跨类型匹配
  if (!bestMatch || bestMatch.matchRate < 0.1) {
    for (const field1 of joinFields1) {
      for (const field2 of joinFields2) {
        const { matchRate, matchCount } = calculateMatchRate(
          table1, field1.field,
          table2, field2.field
        );

        if (!bestMatch || matchRate > bestMatch.matchRate) {
          bestMatch = {
            fields: [field1.field, field2.field],
            matchRate,
            matchCount,
          };
        }
      }
    }
  }

  return bestMatch;
}

/**
 * 自动关联多个表格
 */
export function autoLinkTables(tables: DataTable[]): LinkResult {
  if (tables.length === 0) {
    return {
      success: false,
      linkedTables: [],
      joinGraph: { nodes: [], edges: [] },
      suggestions: [],
      errors: ['没有提供表格数据'],
    };
  }

  if (tables.length === 1) {
    const linkedTable: LinkedTable = {
      ...tables[0],
      joinFields: findJoinFields(tables[0]).map(f => f.field),
      linkedTo: [],
    };

    return {
      success: true,
      linkedTables: [linkedTable],
      joinGraph: {
        nodes: [{
          tableId: tables[0].id,
          tableName: tables[0].name,
          tableType: tables[0].type,
          fieldCount: tables[0].headers.length,
          rowCount: tables[0].rowCount,
        }],
        edges: [],
      },
      suggestions: [],
    };
  }

  const linkedTables: LinkedTable[] = tables.map(table => ({
    ...table,
    joinFields: findJoinFields(table).map(f => f.field),
    linkedTo: [],
  }));

  const nodes: JoinNode[] = tables.map(table => ({
    tableId: table.id,
    tableName: table.name,
    tableType: table.type,
    fieldCount: table.headers.length,
    rowCount: table.rowCount,
  }));

  const edges: JoinEdge[] = [];
  const suggestions: LinkSuggestion[] = [];
  const errors: string[] = [];

  // 两两分析关联关系
  for (let i = 0; i < tables.length; i++) {
    for (let j = i + 1; j < tables.length; j++) {
      const table1 = tables[i];
      const table2 = tables[j];

      const bestJoin = findBestJoinFields(table1, table2);

      if (bestJoin && bestJoin.matchRate > 0.1) {
        edges.push({
          from: table1.id,
          to: table2.id,
          joinFields: bestJoin.fields,
          matchRate: bestJoin.matchRate,
          matchCount: bestJoin.matchCount,
        });

        // 更新 linkedTo
        const lt1 = linkedTables.find(t => t.id === table1.id);
        const lt2 = linkedTables.find(t => t.id === table2.id);
        if (lt1 && !lt1.linkedTo.includes(table2.id)) {
          lt1.linkedTo.push(table2.id);
        }
        if (lt2 && !lt2.linkedTo.includes(table1.id)) {
          lt2.linkedTo.push(table1.id);
        }

        // 高置信度自动关联建议
        if (bestJoin.matchRate > 0.5) {
          suggestions.push({
            type: 'auto_link',
            tables: [table1.name, table2.name],
            description: `${table1.name} 和 ${table2.name} 可以通过字段 "${bestJoin.fields.join('" 和 "')}" 关联，匹配率 ${(bestJoin.matchRate * 100).toFixed(1)}%`,
            recommendedFields: bestJoin.fields,
            confidence: bestJoin.matchRate,
          });
        }
      } else {
        // 无法自动关联，提供手动关联建议
        const joinFields1 = findJoinFields(table1);
        const joinFields2 = findJoinFields(table2);
        
        if (joinFields1.length === 0 || joinFields2.length === 0) {
          suggestions.push({
            type: 'missing_field',
            tables: [table1.name, table2.name],
            description: `${table1.name} 和 ${table2.name} 缺少可用于关联的共同字段（如会员ID、手机号等）`,
            confidence: 0,
          });
        } else {
          suggestions.push({
            type: 'manual_link',
            tables: [table1.name, table2.name],
            description: `${table1.name} 和 ${table2.name} 可能需要手动选择关联字段`,
            recommendedFields: [...joinFields1.map(f => f.field), ...joinFields2.map(f => f.field)],
            confidence: 0.3,
          });
        }
      }
    }
  }

  // 检查孤立的表
  const isolatedTables = linkedTables.filter(t => t.linkedTo.length === 0);
  if (isolatedTables.length > 0 && tables.length > 1) {
    for (const table of isolatedTables) {
      errors.push(`${table.name} 无法与其他表格建立关联`);
    }
  }

  return {
    success: errors.length === 0 || edges.length > 0,
    linkedTables,
    joinGraph: { nodes, edges },
    suggestions: suggestions.sort((a, b) => b.confidence - a.confidence),
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * 执行表关联（内连接）
 */
export function joinTables(
  table1: DataTable,
  field1: string,
  table2: DataTable,
  field2: string
): { headers: string[]; data: any[][]; rowCount: number } | null {
  const idx1 = table1.headers.indexOf(field1);
  const idx2 = table2.headers.indexOf(field2);
  
  if (idx1 === -1 || idx2 === -1) {
    return null;
  }

  // 构建 table2 的查找索引
  const index2 = new Map<string, any[]>();
  for (const row of table2.data.slice(1)) {
    const key = String(row[idx2] || '').trim();
    if (key) {
      if (!index2.has(key)) {
        index2.set(key, []);
      }
      index2.get(key)!.push(row);
    }
  }

  // 新表头（避免重复）
  const newHeaders = [
    ...table1.headers,
    ...table2.headers.filter((h, i) => i !== idx2).map(h => `${h}(${table2.name})`),
  ];

  // 执行连接
  const result: any[][] = [];
  for (const row1 of table1.data.slice(1)) {
    const key = String(row1[idx1] || '').trim();
    if (key && index2.has(key)) {
      for (const row2 of index2.get(key)!) {
        const newRow = [
          ...row1,
          ...row2.filter((__item: any, i: number) => i !== idx2),
        ];
        result.push(newRow);
      }
    }
  }

  return {
    headers: newHeaders,
    data: [newHeaders, ...result],
    rowCount: result.length,
  };
}

/**
 * 获取关联路径（用于多表关联）
 */
export function getJoinPath(
  startTableId: string,
  endTableId: string,
  joinGraph: JoinGraph
): JoinEdge[] | null {
  // 使用 BFS 查找最短路径
  const visited = new Set<string>();
  const queue: Array<{ tableId: string; path: JoinEdge[] }> = [
    { tableId: startTableId, path: [] },
  ];

  while (queue.length > 0) {
    const { tableId, path } = queue.shift()!;

    if (tableId === endTableId) {
      return path;
    }

    if (visited.has(tableId)) {
      continue;
    }
    visited.add(tableId);

    // 查找相邻边
    for (const edge of joinGraph.edges) {
      if (edge.from === tableId && !visited.has(edge.to)) {
        queue.push({ tableId: edge.to, path: [...path, edge] });
      } else if (edge.to === tableId && !visited.has(edge.from)) {
        queue.push({ tableId: edge.from, path: [...path, edge] });
      }
    }
  }

  return null;
}

/**
 * 分析关联质量
 */
export function analyzeLinkQuality(
  table1: DataTable,
  table2: DataTable,
  joinField1: string,
  joinField2: string
): {
  coverage1: number; // table1 中有多少比例的数据能关联上
  coverage2: number; // table2 中有多少比例的数据能关联上
  uniqueValues1: number;
  uniqueValues2: number;
  duplicateRate1: number;
  duplicateRate2: number;
} {
  const idx1 = table1.headers.indexOf(joinField1);
  const idx2 = table2.headers.indexOf(joinField2);

  const values1 = table1.data.slice(1).map(row => String(row[idx1] || '').trim()).filter(v => v);
  const values2 = table2.data.slice(1).map(row => String(row[idx2] || '').trim()).filter(v => v);

  const set1 = new Set(values1);
  const set2 = new Set(values2);

  const intersection = new Set([...set1].filter(v => set2.has(v)));

  // 计算重复率
  const duplicateCount1 = values1.length - set1.size;
  const duplicateCount2 = values2.length - set2.size;

  return {
    coverage1: set1.size > 0 ? intersection.size / set1.size : 0,
    coverage2: set2.size > 0 ? intersection.size / set2.size : 0,
    uniqueValues1: set1.size,
    uniqueValues2: set2.size,
    duplicateRate1: values1.length > 0 ? duplicateCount1 / values1.length : 0,
    duplicateRate2: values2.length > 0 ? duplicateCount2 / values2.length : 0,
  };
}
