'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Activity,
  Calendar,
  Target,
  BarChart3
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDashboard } from '@/components/layout/DashboardContext';

// KPI卡片数据类型
interface KPIData {
  id: string;
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: any;
  color: string;
}

export default function KPICards() {
  const { kpiConfigs, dataSources, selectedDataSource } = useDashboard();

  // 模拟计算KPI数据（实际应用中应该根据真实数据计算）
  const kpiData: KPIData[] = useMemo(() => {
    // 如果有数据源，根据数据源计算
    if (dataSources.length > 0) {
      const totalRows = dataSources.reduce((sum, s) => sum + s.rowCount, 0);
      
      return [
        {
          id: '1',
          title: '数据总量',
          value: totalRows.toLocaleString(),
          change: 12.5,
          changeLabel: '较上周',
          icon: BarChart3,
          color: 'bg-blue-500',
        },
        {
          id: '2',
          title: '数据源',
          value: dataSources.length.toString(),
          change: dataSources.length > 1 ? 100 : 0,
          changeLabel: '新增',
          icon: Activity,
          color: 'bg-green-500',
        },
        {
          id: '3',
          title: '字段总数',
          value: dataSources.reduce((sum, s) => sum + s.headers.length, 0).toString(),
          icon: Target,
          color: 'bg-purple-500',
        },
        {
          id: '4',
          title: '分析维度',
          value: '8',
          change: -2.3,
          changeLabel: '较上月',
          icon: Calendar,
          color: 'bg-orange-500',
        },
      ];
    }

    // 默认展示配置中的KPI
    return kpiConfigs.map((kpi, index) => ({
      id: kpi.id,
      title: kpi.title,
      value: kpi.format === 'currency' 
        ? `${kpi.prefix || '¥'}0` 
        : kpi.format === 'percentage' 
          ? `0${kpi.suffix || '%'}` 
          : '0',
      change: index % 2 === 0 ? 12.5 : -5.2,
      changeLabel: '较上期',
      icon: [DollarSign, Users, Activity, Target][index % 4],
      color: kpi.color,
    }));
  }, [kpiConfigs, dataSources]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4"
    >
      {kpiData.map((kpi) => (
        <motion.div key={kpi.id} variants={itemVariants}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1 truncate">{kpi.title}</p>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {kpi.value}
                  </p>
                  {kpi.change !== undefined && (
                    <div className="flex items-center gap-1 mt-1">
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] h-5 px-1 ${
                          kpi.change >= 0 
                            ? 'text-green-600 border-green-200 bg-green-50' 
                            : 'text-red-600 border-red-200 bg-red-50'
                        }`}
                      >
                        {kpi.change >= 0 ? (
                          <TrendingUp className="w-3 h-3 mr-0.5" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-0.5" />
                        )}
                        {Math.abs(kpi.change)}%
                      </Badge>
                      {kpi.changeLabel && (
                        <span className="text-[10px] text-gray-400">{kpi.changeLabel}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${kpi.color}`}>
                  <kpi.icon className="w-4 h-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
