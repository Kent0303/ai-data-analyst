'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  LayoutTemplate, 
  Bell,
  ChevronRight,
  FileSpreadsheet,
  Users,
  TrendingUp,
  AlertTriangle,
  Plus,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useDashboard } from './DashboardContext';

interface LeftSidebarProps {
  onDataSourceClick?: () => void;
  onTemplateClick?: () => void;
  onAlertClick?: () => void;
}

// 数据源图标映射
const getDataSourceIcon = (type: string) => {
  switch (type) {
    case 'member_list':
      return <Users className="w-4 h-4 text-blue-500" />;
    case 'consumption_record':
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    case 'entry_record':
      return <FileSpreadsheet className="w-4 h-4 text-purple-500" />;
    case 'group_class_booking':
    case 'private_class_booking':
      return <LayoutTemplate className="w-4 h-4 text-orange-500" />;
    default:
      return <FileSpreadsheet className="w-4 h-4 text-gray-500" />;
  }
};

// 数据源类型标签
const getDataSourceLabel = (type: string) => {
  const labels: Record<string, string> = {
    member_list: '会员列表',
    consumption_record: '消费记录',
    entry_record: '入场记录',
    group_class_booking: '团课预约',
    private_class_booking: '私教预约',
    unknown: '未知类型',
  };
  return labels[type] || '未知类型';
};

// 分析模板
const ANALYSIS_TEMPLATES = [
  { id: 'member-lifecycle', name: '会员生命周期分析', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { id: 'revenue-dashboard', name: '营收健康度仪表盘', icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50' },
  { id: 'coach-performance', name: '教练绩效分析', icon: LayoutTemplate, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  { id: 'venue-utilization', name: '场地利用率分析', icon: Database, color: 'text-orange-600', bgColor: 'bg-orange-50' },
];

export default function LeftSidebar({ 
  onDataSourceClick, 
  onTemplateClick, 
  onAlertClick 
}: LeftSidebarProps) {
  const { dataSources, alertCount, selectedDataSource, selectDataSource } = useDashboard();

  const [expandedSections, setExpandedSections] = React.useState({
    dataSources: true,
    templates: true,
    alerts: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-full lg:w-60 bg-white border-r border-gray-200 flex flex-col h-full"
    >
      <ScrollArea className="flex-1">
        {/* 数据源部分 */}
        <div className="p-3">
          <button
            onClick={() => toggleSection('dataSources')}
            className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-sm text-gray-700">数据源</span>
            </div>
            <div className="flex items-center gap-2">
              {dataSources.length > 0 && (
                <Badge variant="secondary" className="text-xs">{dataSources.length}</Badge>
              )}
              <ChevronRight 
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  expandedSections.dataSources ? 'rotate-90' : ''
                }`} 
              />
            </div>
          </button>

          {expandedSections.dataSources && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-1 space-y-1"
            >
              {dataSources.length === 0 ? (
                <div className="px-2 py-3 text-center">
                  <p className="text-xs text-gray-400 mb-2">暂无数据源</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={onDataSourceClick}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    添加数据
                  </Button>
                </div>
              ) : (
                dataSources.map((source) => (
                  <button
                    key={source.id}
                    onClick={() => selectDataSource(source.id === selectedDataSource ? null : source.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                      selectedDataSource === source.id 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    {getDataSourceIcon(source.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{source.name}</p>
                      <p className="text-xs text-gray-400">{source.rowCount.toLocaleString()} 行</p>
                    </div>
                  </button>
                ))
              )}
            </motion.div>
          )}
        </div>

        <Separator />

        {/* 分析模板部分 */}
        <div className="p-3">
          <button
            onClick={() => toggleSection('templates')}
            className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-sm text-gray-700">分析模板</span>
            </div>
            <ChevronRight 
              className={`w-4 h-4 text-gray-400 transition-transform ${
                expandedSections.templates ? 'rotate-90' : ''
              }`} 
            />
          </button>

          {expandedSections.templates && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-1 space-y-1"
            >
              {ANALYSIS_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => onTemplateClick?.()}
                  className="w-full flex items-center gap-2 p-2 rounded-lg text-left hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-7 h-7 ${template.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <template.icon className={`w-3.5 h-3.5 ${template.color}`} />
                  </div>
                  <span className="text-sm text-gray-700">{template.name}</span>
                </button>
              ))}
            </motion.div>
          )}
        </div>

        <Separator />

        {/* 智能预警部分 */}
        <div className="p-3">
          <button
            onClick={() => toggleSection('alerts')}
            className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-sm text-gray-700">智能预警</span>
            </div>
            <div className="flex items-center gap-2">
              {alertCount > 0 && (
                <Badge variant="destructive" className="text-xs">{alertCount}</Badge>
              )}
              <ChevronRight 
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  expandedSections.alerts ? 'rotate-90' : ''
                }`} 
              />
            </div>
          </button>

          {expandedSections.alerts && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-1 space-y-1"
            >
              <button
                onClick={() => onAlertClick?.()}
                className="w-full flex items-center gap-2 p-2 rounded-lg text-left hover:bg-gray-50 transition-colors"
              >
                <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-700">经营风险预警</span>
                  {alertCount > 0 && (
                    <p className="text-xs text-red-500">{alertCount} 个待处理</p>
                  )}
                </div>
              </button>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* 底部设置 */}
      <div className="p-3 border-t border-gray-200">
        <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600">
          <Settings className="w-4 h-4 mr-2" />
          <span className="text-sm">设置</span>
        </Button>
      </div>
    </motion.aside>
  );
}
