'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  Users,
  Dumbbell,
  UserCheck,
  TrendingDown,
  Settings,
  Lightbulb,
  Clock,
  User,
  Phone,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertLevel, AlertCategory } from '@/lib/alerts';

interface AlertCardProps {
  alert: Alert;
  onResolve?: (id: string) => void;
  onIgnore?: (id: string) => void;
  onActivate?: (id: string) => void;
  compact?: boolean;
}

const levelConfig: Record<AlertLevel, { 
  icon: React.ElementType; 
  color: string; 
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  high: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: '高风险',
  },
  medium: {
    icon: AlertCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    label: '中风险',
  },
  low: {
    icon: Info,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    label: '低风险',
  },
  info: {
    icon: CheckCircle2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: '信息',
  },
};

const categoryConfig: Record<AlertCategory, { 
  icon: React.ElementType; 
  label: string;
  color: string;
}> = {
  member_churn: { icon: Users, label: '会员流失', color: 'bg-red-100 text-red-700' },
  private_class: { icon: Dumbbell, label: '私教课包', color: 'bg-blue-100 text-blue-700' },
  coach_workload: { icon: UserCheck, label: '教练负荷', color: 'bg-purple-100 text-purple-700' },
  revenue_anomaly: { icon: TrendingDown, label: '营收异常', color: 'bg-orange-100 text-orange-700' },
  system: { icon: Settings, label: '系统', color: 'bg-gray-100 text-gray-700' },
};

export function AlertCard({ alert, onResolve, onIgnore, onActivate, compact = false }: AlertCardProps) {
  const [expanded, setExpanded] = useState(false);
  const level = levelConfig[alert.level];
  const category = categoryConfig[alert.category];
  const LevelIcon = level.icon;
  const CategoryIcon = category.icon;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderDetails = () => {
    const { details } = alert;
    
    if (alert.category === 'member_churn' && details.members) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">风险会员列表（前5位）：</p>
          <div className="space-y-2">
            {details.members.slice(0, 5).map((member: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded-lg border">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  member.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                  member.riskLevel === 'medium' ? 'bg-orange-100 text-orange-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {member.riskScore}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{member.memberName}</p>
                  <p className="text-xs text-gray-500">{member.reasons?.slice(0, 2).join('，')}</p>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Phone className="w-3 h-3" />
                    {member.phone}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (alert.category === 'private_class' && details.members) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">课包状态详情：</p>
          <div className="space-y-2">
            {details.members.slice(0, 5).map((pkg: any, idx: number) => (
              <div key={idx} className="p-2 bg-white rounded-lg border">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{pkg.memberName}</span>
                  <Badge variant={pkg.remainingSessions <= 1 ? 'destructive' : 'secondary'} className="text-xs">
                    剩 {pkg.remainingSessions} 节
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      pkg.progressPercentage > 80 ? 'bg-red-500' :
                      pkg.progressPercentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${pkg.progressPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  已上 {pkg.usedSessions}/{pkg.totalSessions} 节 ({pkg.progressPercentage}%)
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (alert.category === 'coach_workload' && details.coaches) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">教练负荷详情：</p>
          <div className="space-y-2">
            {details.coaches.map((coach: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded-lg border">
                <User className="w-8 h-8 text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{coach.name}</p>
                  <p className="text-xs text-gray-500">{coach.weeklyClasses} 节课 / {coach.weeklyHours} 小时</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  coach.weeklyHours > 40 ? 'bg-red-100 text-red-700' :
                  coach.weeklyHours < 10 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {coach.weeklyHours > 40 ? '过载' : coach.weeklyHours < 10 ? '不足' : '正常'}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (alert.category === 'revenue_anomaly' && details.trends) {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-white rounded-lg border text-center">
              <p className="text-xs text-gray-500">当前营收</p>
              <p className="text-lg font-bold text-gray-900">
                ¥{details.currentValue?.toLocaleString?.() || details.currentWeek?.revenue?.toLocaleString?.() || 0}
              </p>
            </div>
            <div className="p-2 bg-white rounded-lg border text-center">
              <p className="text-xs text-gray-500">环比变化</p>
              <p className={`text-lg font-bold ${
                (details.changePercentage || 0) < 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {(details.changePercentage || 0) > 0 ? '+' : ''}
                {(details.changePercentage || 0).toFixed(1)}%
              </p>
            </div>
          </div>
          {details.rootCauses && details.rootCauses.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">根因分析：</p>
              <ul className="space-y-1">
                {details.rootCauses.map((cause: string, idx: number) => (
                  <li key={idx} className="text-xs text-gray-500 flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    {cause}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`p-3 rounded-lg border ${level.borderColor} ${level.bgColor} flex items-center gap-3`}
      >
        <LevelIcon className={`w-5 h-5 ${level.color}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
          <p className="text-xs text-gray-500">{formatDate(alert.createdAt)}</p>
        </div>
        <Badge className={`text-xs ${category.color}`}>
          <CategoryIcon className="w-3 h-3 mr-1" />
          {category.label}
        </Badge>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
    >
      <Card className={`border-l-4 ${level.borderColor} overflow-hidden`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${level.bgColor}`}>
                <LevelIcon className={`w-5 h-5 ${level.color}`} />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">{alert.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`text-xs ${category.color}`}>
                    <CategoryIcon className="w-3 h-3 mr-1" />
                    {category.label}
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${level.color}`}>
                    {level.label}
                  </Badge>
                  {alert.status === 'resolved' && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      已解决
                    </Badge>
                  )}
                  {alert.status === 'ignored' && (
                    <Badge variant="secondary" className="text-xs">
                      已忽略
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <p className="text-sm text-gray-600 mb-3">{alert.description}</p>
          
          <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(alert.createdAt)}
            </span>
            {alert.resolvedAt && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                解决于 {formatDate(alert.resolvedAt)}
              </span>
            )}
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 border-t space-y-4">
                  {renderDetails()}
                  
                  {alert.suggestions && alert.suggestions.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        建议措施
                      </p>
                      <ul className="space-y-2">
                        {alert.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">{idx + 1}.</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {alert.status === 'active' ? (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onResolve?.(alert.id)}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                标记已解决
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onIgnore?.(alert.id)}
              >
                <X className="w-4 h-4 mr-1" />
                忽略
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onActivate?.(alert.id)}
              >
                重新激活
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                删除
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
