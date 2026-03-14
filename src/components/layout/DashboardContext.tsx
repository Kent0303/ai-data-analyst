'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// 图表类型
type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'radar' | 'scatter' | 'gauge' | 'heatmap';

// 筛选器类型
interface FilterConfig {
  id: string;
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: any;
}

// 图表配置
interface ChartConfig {
  type: ChartType;
  title: string;
  xAxis?: string;
  yAxis?: string | string[];
  colorScheme?: string;
  showLegend?: boolean;
  showTooltip?: boolean;
  stacked?: boolean;
  filters: FilterConfig[];
}

// KPI配置
interface KPIConfig {
  id: string;
  title: string;
  field: string;
  aggregation: 'sum' | 'avg' | 'count' | 'max' | 'min';
  format: 'number' | 'currency' | 'percentage';
  prefix?: string;
  suffix?: string;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}

// 数据源
interface DataSource {
  id: string;
  name: string;
  type: 'member_list' | 'consumption_record' | 'entry_record' | 'group_class_booking' | 'private_class_booking' | 'unknown';
  rowCount: number;
  headers: string[];
}

// 布局状态
interface DashboardState {
  // 数据源
  dataSources: DataSource[];
  selectedDataSource: string | null;
  
  // KPI卡片
  kpiConfigs: KPIConfig[];
  
  // 图表
  chartConfig: ChartConfig;
  
  // 筛选
  globalFilters: FilterConfig[];
  
  // AI对话
  aiMessages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  isAILoading: boolean;
  
  // 选中的模型
  selectedModel: 'deepseek' | 'kimi';
  
  // 预警
  alertCount: number;
}

interface DashboardContextType extends DashboardState {
  // Actions
  setDataSources: (sources: DataSource[]) => void;
  selectDataSource: (id: string | null) => void;
  addKPI: (kpi: KPIConfig) => void;
  removeKPI: (id: string) => void;
  updateKPI: (id: string, config: Partial<KPIConfig>) => void;
  updateChartConfig: (config: Partial<ChartConfig>) => void;
  addFilter: (filter: FilterConfig) => void;
  removeFilter: (id: string) => void;
  addAIMessage: (message: { role: 'user' | 'assistant'; content: string }) => void;
  setAILoading: (loading: boolean) => void;
  setSelectedModel: (model: 'deepseek' | 'kimi') => void;
  setAlertCount: (count: number) => void;
  clearDashboard: () => void;
}

const defaultChartConfig: ChartConfig = {
  type: 'bar',
  title: '数据分析图表',
  xAxis: '',
  yAxis: '',
  colorScheme: 'default',
  showLegend: true,
  showTooltip: true,
  stacked: false,
  filters: [],
};

const defaultKPIConfigs: KPIConfig[] = [
  { id: 'kpi-1', title: '总收入', field: 'amount', aggregation: 'sum', format: 'currency', prefix: '¥', color: 'bg-blue-500' },
  { id: 'kpi-2', title: '会员总数', field: 'memberId', aggregation: 'count', format: 'number', color: 'bg-green-500' },
  { id: 'kpi-3', title: '平均消费', field: 'amount', aggregation: 'avg', format: 'currency', prefix: '¥', color: 'bg-purple-500' },
  { id: 'kpi-4', title: '活跃率', field: 'status', aggregation: 'count', format: 'percentage', suffix: '%', color: 'bg-orange-500' },
];

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DashboardState>({
    dataSources: [],
    selectedDataSource: null,
    kpiConfigs: defaultKPIConfigs,
    chartConfig: defaultChartConfig,
    globalFilters: [],
    aiMessages: [],
    isAILoading: false,
    selectedModel: 'deepseek',
    alertCount: 0,
  });

  const setDataSources = (sources: DataSource[]) => {
    setState(prev => ({ ...prev, dataSources: sources }));
  };

  const selectDataSource = (id: string | null) => {
    setState(prev => ({ ...prev, selectedDataSource: id }));
  };

  const addKPI = (kpi: KPIConfig) => {
    setState(prev => ({ ...prev, kpiConfigs: [...prev.kpiConfigs, kpi] }));
  };

  const removeKPI = (id: string) => {
    setState(prev => ({ ...prev, kpiConfigs: prev.kpiConfigs.filter(k => k.id !== id) }));
  };

  const updateKPI = (id: string, config: Partial<KPIConfig>) => {
    setState(prev => ({
      ...prev,
      kpiConfigs: prev.kpiConfigs.map(k => k.id === id ? { ...k, ...config } : k),
    }));
  };

  const updateChartConfig = (config: Partial<ChartConfig>) => {
    setState(prev => ({
      ...prev,
      chartConfig: { ...prev.chartConfig, ...config },
    }));
  };

  const addFilter = (filter: FilterConfig) => {
    setState(prev => ({
      ...prev,
      globalFilters: [...prev.globalFilters, filter],
    }));
  };

  const removeFilter = (id: string) => {
    setState(prev => ({
      ...prev,
      globalFilters: prev.globalFilters.filter(f => f.id !== id),
    }));
  };

  const addAIMessage = (message: { role: 'user' | 'assistant'; content: string }) => {
    setState(prev => ({
      ...prev,
      aiMessages: [...prev.aiMessages, { ...message, timestamp: new Date() }],
    }));
  };

  const setAILoading = (loading: boolean) => {
    setState(prev => ({ ...prev, isAILoading: loading }));
  };

  const setSelectedModel = (model: 'deepseek' | 'kimi') => {
    setState(prev => ({ ...prev, selectedModel: model }));
  };

  const setAlertCount = (count: number) => {
    setState(prev => ({ ...prev, alertCount: count }));
  };

  const clearDashboard = () => {
    setState({
      dataSources: [],
      selectedDataSource: null,
      kpiConfigs: defaultKPIConfigs,
      chartConfig: defaultChartConfig,
      globalFilters: [],
      aiMessages: [],
      isAILoading: false,
      selectedModel: 'deepseek',
      alertCount: 0,
    });
  };

  return (
    <DashboardContext.Provider
      value={{
        ...state,
        setDataSources,
        selectDataSource,
        addKPI,
        removeKPI,
        updateKPI,
        updateChartConfig,
        addFilter,
        removeFilter,
        addAIMessage,
        setAILoading,
        setSelectedModel,
        setAlertCount,
        clearDashboard,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
