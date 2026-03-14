'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Filter,
  RefreshCw,
  Settings,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  TrendingUp,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCard } from './AlertCard';
import { 
  Alert, 
  AlertCategory, 
  AlertLevel, 
  AlertStatus,
  getAlertEngine,
  AlertEngine,
  AlertDataSource,
} from '@/lib/alerts';

interface AlertPanelProps {
  dataSource?: AlertDataSource;
  onRefresh?: () => void;
}

const categoryFilters: { value: AlertCategory | 'all'; label: string; color: string }[] = [
  { value: 'all', label: '全部', color: 'bg-gray-100 text-gray-700' },
  { value: 'member_churn', label: '会员流失', color: 'bg-red-100 text-red-700' },
  { value: 'private_class', label: '私教课包', color: 'bg-blue-100 text-blue-700' },
  { value: 'coach_workload', label: '教练负荷', color: 'bg-purple-100 text-purple-700' },
  { value: 'revenue_anomaly', label: '营收异常', color: 'bg-orange-100 text-orange-700' },
];

const levelFilters: { value: AlertLevel | 'all'; label: string; color: string }[] = [
  { value: 'all', label: '全部等级', color: 'bg-gray-100 text-gray-700' },
  { value: 'high', label: '高风险', color: 'bg-red-100 text-red-700' },
  { value: 'medium', label: '中风险', color: 'bg-orange-100 text-orange-700' },
  { value: 'low', label: '低风险', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'info', label: '信息', color: 'bg-blue-100 text-blue-700' },
];

export function AlertPanel({ dataSource, onRefresh }: AlertPanelProps) {
  const [engine] = useState<AlertEngine>(() => getAlertEngine());
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    byCategory: {} as Record<AlertCategory, number>,
    byLevel: {} as Record<AlertLevel, number>,
  });
  const [categoryFilter, setCategoryFilter] = useState<AlertCategory | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<AlertLevel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('active');
  const [isDetecting, setIsDetecting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // 加载预警数据
  const loadAlerts = useCallback(() => {
    const loadedAlerts = engine.getAlerts({
      category: categoryFilter === 'all' ? undefined : categoryFilter,
      level: levelFilter === 'all' ? undefined : levelFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
    });
    setAlerts(loadedAlerts);
    setStats(engine.getAlertStats());
    setHistory(engine.getHistory());
  }, [engine, categoryFilter, levelFilter, statusFilter]);

  // 初始加载
  useEffect(() => {
    loadAlerts();
    
    // 订阅预警更新
    const unsubscribe = engine.addListener(() => {
      loadAlerts();
    });
    
    return unsubscribe;
  }, [engine, loadAlerts]);

  // 执行检测
  const handleDetect = async () => {
    if (!dataSource) {
      alert('请先上传数据');
      return;
    }
    
    setIsDetecting(true);
    try {
      await engine.detectAll(dataSource);
      loadAlerts();
      onRefresh?.();
    } catch (error) {
      console.error('Detection error:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  // 解决预警
  const handleResolve = (id: string) => {
    engine.resolveAlert(id);
    loadAlerts();
  };

  // 忽略预警
  const handleIgnore = (id: string) => {
    engine.ignoreAlert(id);
    loadAlerts();
  };

  // 激活预警
  const handleActivate = (id: string) => {
    engine.activateAlert(id);
    loadAlerts();
  };

  // 清空所有预警
  const handleClearAll = () => {
    if (confirm('确定要清空所有预警吗？')) {
      engine.clearAllAlerts();
      loadAlerts();
    }
  };

  // 获取风险分布数据
  const getRiskDistribution = () => {
    const distribution = [
      { label: '高风险', count: stats.byLevel.high || 0, color: 'bg-red-500' },
      { label: '中风险', count: stats.byLevel.medium || 0, color: 'bg-orange-500' },
      { label: '低风险', count: stats.byLevel.low || 0, color: 'bg-yellow-500' },
      { label: '信息', count: stats.byLevel.info || 0, color: 'bg-blue-500' },
    ];
    const maxCount = Math.max(...distribution.map(d => d.count), 1);
    return distribution.map(d => ({ ...d, percentage: (d.count / maxCount) * 100 }));
  };

  const filteredAlerts = alerts;

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">活跃预警</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">高风险</p>
                <p className="text-2xl font-bold text-red-600">{stats.byLevel.high || 0}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日检测</p>
                <p className="text-2xl font-bold text-blue-600">
                  {history.find(h => h.date === new Date().toISOString().split('T')[0])?.total || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已解决</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.total - stats.active}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 风险分布 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">风险分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getRiskDistribution().map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-16">{item.label}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(item.percentage, 5)}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-8 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 预警列表 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <CardTitle className="text-base">预警列表</CardTitle>
              <Badge variant="secondary">{filteredAlerts.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDetect}
                disabled={isDetecting || !dataSource}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isDetecting ? 'animate-spin' : ''}`} />
                检测
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-1" />
                筛选
                <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-3">
                  {/* 状态筛选 */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">状态：</span>
                    <div className="flex gap-1">
                      {[
                        { value: 'all', label: '全部' },
                        { value: 'active', label: '活跃' },
                        { value: 'resolved', label: '已解决' },
                        { value: 'ignored', label: '已忽略' },
                      ].map((status) => (
                        <Button
                          key={status.value}
                          variant={statusFilter === status.value ? 'default' : 'outline'}
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => setStatusFilter(status.value as AlertStatus | 'all')}
                        >
                          {status.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* 类别筛选 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-500">类别：</span>
                    {categoryFilters.map((cat) => (
                      <Button
                        key={cat.value}
                        variant={categoryFilter === cat.value ? 'default' : 'outline'}
                        size="sm"
                        className={`text-xs h-7 ${categoryFilter === cat.value ? '' : cat.color}`}
                        onClick={() => setCategoryFilter(cat.value)}
                      >
                        {cat.label}
                      </Button>
                    ))}
                  </div>
                  
                  {/* 等级筛选 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-500">等级：</span>
                    {levelFilters.map((lvl) => (
                      <Button
                        key={lvl.value}
                        variant={levelFilter === lvl.value ? 'default' : 'outline'}
                        size="sm"
                        className={`text-xs h-7 ${levelFilter === lvl.value ? '' : lvl.color}`}
                        onClick={() => setLevelFilter(lvl.value)}
                      >
                        {lvl.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-[500px]">
            <AnimatePresence mode="popLayout">
              {filteredAlerts.length > 0 ? (
                <div className="space-y-3">
                  {filteredAlerts.map((alert) => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      onResolve={handleResolve}
                      onIgnore={handleIgnore}
                      onActivate={handleActivate}
                    />
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-gray-400"
                >
                  <CheckCircle2 className="w-12 h-12 mb-3 text-gray-300" />
                  <p>暂无预警</p>
                  <p className="text-sm mt-1">点击"检测"按钮开始分析</p>
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* 历史趋势 */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">预警历史（最近7天）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32">
              {history.slice(-7).map((day, idx) => {
                const maxTotal = Math.max(...history.slice(-7).map(h => h.total), 1);
                const height = (day.total / maxTotal) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all duration-500"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                    <span className="text-xs text-gray-500">{day.date.slice(5)}</span>
                    <span className="text-xs font-medium">{day.total}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
