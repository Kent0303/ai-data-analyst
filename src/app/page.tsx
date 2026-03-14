'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileSpreadsheet, 
  X,
  Sparkles,
  BarChart3,
  ChevronRight,
  Brain,
  LayoutDashboard,
  PieChart,
  MessageSquare,
  Download,
  Zap,
  Link2,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Table2,
  ArrowRight,
  Users,
  DollarSign,
  UserCheck,
  Building2,
  Bell,
  ShieldAlert
} from 'lucide-react';
import DataVisualization from '@/components/DataVisualization';
import AIReportView from '@/components/AIReportView';
import AnalysisHistory, { HistoryItem } from '@/components/AnalysisHistory';
import SmartQuery from '@/components/SmartQuery';
import EnhancedSmartQuery from '@/components/EnhancedSmartQuery';
import LoadingAnimation from '@/components/LoadingAnimation';
import MultiFileUpload, { UploadedFile } from '@/components/upload/MultiFileUpload';
import { AlertPanel } from '@/components/alerts';
import { TableType, getTableTypeLabel, getTableTypeDescription, Member, EntryRecord, Booking, Consumption } from '@/lib/tableRecognizer';
import { autoLinkTables, DataTable, LinkResult } from '@/lib/dataLinker';
import { 
  generateAnalysisFramework, 
  AnalysisFramework, 
  CombinedInsight,
  GeneratedAnalysis 
} from '@/lib/analysisFramework';
import { getAlertEngine, AlertDataSource } from '@/lib/alerts';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'analysis' | 'suggestion';
}

type Step = 'upload' | 'analyzing' | 'ready';
type ResultTab = 'overview' | 'insights' | 'charts' | 'explore' | 'templates' | 'alerts';

function MetricCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: any; color: string }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TableTypeBadge({ type, confidence }: { type: TableType; confidence: number }) {
  const colors: Record<TableType, string> = {
    member_list: 'bg-blue-100 text-blue-700 border-blue-200',
    consumption_record: 'bg-green-100 text-green-700 border-green-200',
    entry_record: 'bg-purple-100 text-purple-700 border-purple-200',
    group_class_booking: 'bg-orange-100 text-orange-700 border-orange-200',
    private_class_booking: 'bg-pink-100 text-pink-700 border-pink-200',
    unknown: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return (
    <Badge variant="outline" className={`${colors[type]} text-xs`}>
      {getTableTypeLabel(type)}
      {confidence > 0 && <span className="ml-1 opacity-70">{Math.round(confidence * 100)}%</span>}
    </Badge>
  );
}

function LinkGraphView({ joinGraph, files }: { joinGraph: NonNullable<LinkResult['joinGraph']>; files: UploadedFile[] }) {
  if (joinGraph.edges.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>未检测到表格间的关联关系</p>
        <p className="text-sm mt-1">表格缺少可用于关联的共同字段（如会员ID、手机号等）</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {joinGraph.nodes.map((node) => {
          const file = files.find(f => f.id === node.tableId);
          return (
            <div key={node.tableId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Table2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm">{node.tableName}</p>
                <p className="text-xs text-gray-500">{node.rowCount.toLocaleString()} 行 · {node.fieldCount} 列</p>
              </div>
              {file && <TableTypeBadge type={file.tableInfo.type} confidence={file.tableInfo.confidence} />}
            </div>
          );
        })}
      </div>
      <div className="border-t pt-4">
        <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Link2 className="w-4 h-4" />检测到的关联关系
        </p>
        <div className="space-y-2">
          {joinGraph.edges.map((edge, idx) => {
            const fromFile = files.find(f => f.id === edge.from);
            const toFile = files.find(f => f.id === edge.to);
            return (
              <div key={idx} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{fromFile?.name}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-sm">{toFile?.name}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    关联字段: {edge.joinFields.join(' ↔ ')} · 匹配率: <span className="font-medium text-green-700">{(edge.matchRate * 100).toFixed(1)}%</span>
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FrameworkCard({ framework }: { framework: AnalysisFramework }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-gray-800">{framework.name}</h4>
            <p className="text-sm text-gray-500">{framework.description}</p>
          </div>
          <Badge variant="secondary" className="text-xs">优先级 {framework.priority}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">分析维度</p>
            <div className="flex flex-wrap gap-1">
              {framework.dimensions.slice(0, 3).map((d, i) => <Badge key={i} variant="outline" className="text-xs">{d.name}</Badge>)}
              {framework.dimensions.length > 3 && <Badge variant="outline" className="text-xs">+{framework.dimensions.length - 3}</Badge>}
            </div>
          </div>
          <div>
            <p className="text-gray-500 mb-1">关键指标</p>
            <div className="flex flex-wrap gap-1">
              {framework.metrics.slice(0, 3).map((m, i) => <Badge key={i} variant="outline" className="text-xs">{m.name}</Badge>)}
              {framework.metrics.length > 3 && <Badge variant="outline" className="text-xs">+{framework.metrics.length - 3}</Badge>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CombinedInsightCard({ insight }: { insight: CombinedInsight }) {
  const typeLabels: Record<CombinedInsight['analysisType'], string> = {
    trend: '趋势分析', comparison: '对比分析', distribution: '分布分析', correlation: '关联分析', anomaly: '异常检测', funnel: '漏斗分析',
  };
  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-gray-800">{insight.title}</h4>
          <Badge className="text-xs bg-purple-100 text-purple-700">{typeLabels[insight.analysisType]}</Badge>
        </div>
        <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">涉及表格:</span>
          {insight.relatedTables.map((table, i) => <Badge key={i} variant="outline" className="text-xs">{getTableTypeLabel(table as TableType)}</Badge>)}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DataAnalystPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [activeTab, setActiveTab] = useState<ResultTab>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'deepseek' | 'kimi'>('deepseek');
  const [aiReport, setAiReport] = useState<string>('');
  const [showModelSelect, setShowModelSelect] = useState(false);
  const [linkResult, setLinkResult] = useState<LinkResult | null>(null);
  const [analysisFramework, setAnalysisFramework] = useState<GeneratedAnalysis | null>(null);
  const [alertCount, setAlertCount] = useState(0);
  const alertEngine = useMemo(() => getAlertEngine(), []);

  // 构建预警数据源
  const alertDataSource: AlertDataSource | undefined = useMemo(() => {
    if (files.length === 0) return undefined;
    
    // 从上传的文件中提取数据
    const members: Member[] = [];
    const entries: EntryRecord[] = [];
    const bookings: Booking[] = [];
    const consumptions: Consumption[] = [];
    
    files.forEach(file => {
      const { tableInfo, data } = file;
      const type = tableInfo.type;
      if (type === 'member_list') {
        data.forEach((row: any, idx: number) => {
          members.push({
            id: row.id || row.会员ID || `m${idx}`,
            name: row.name || row.姓名 || row.会员姓名 || '',
            phone: row.phone || row.手机号 || row.电话,
            registerDate: row.registerDate || row.注册日期 || row.开卡日期 || new Date().toISOString(),
            membershipExpiry: row.membershipExpiry || row.到期日期,
            membershipType: row.membershipType || row.会员类型,
            status: row.status || row.状态,
            source: row.source || row.来源,
            balance: row.balance || row.余额,
          });
        });
      } else if (type === 'entry_record') {
        data.forEach((row: any, idx: number) => {
          entries.push({
            id: row.id || `e${idx}`,
            memberId: row.memberId || row.会员ID || '',
            memberName: row.memberName || row.会员姓名,
            entryTime: row.entryTime || row.进店时间 || row.入场时间 || new Date().toISOString(),
            exitTime: row.exitTime || row.出场时间,
            store: row.store || row.门店,
          });
        });
      } else if (type === 'private_class_booking' || type === 'group_class_booking') {
        data.forEach((row: any, idx: number) => {
          bookings.push({
            id: row.id || `b${idx}`,
            memberId: row.memberId || row.会员ID || '',
            memberName: row.memberName || row.会员姓名,
            coachId: row.coachId || row.教练ID,
            coachName: row.coachName || row.教练姓名 || row.教练,
            type: type === 'private_class_booking' ? 'private' : 'group',
            bookingTime: row.bookingTime || row.预约时间 || row.时间 || new Date().toISOString(),
            duration: row.duration || row.时长 || 60,
            className: row.className || row.课程名称,
            status: row.status || row.状态,
          });
        });
      } else if (type === 'consumption_record') {
        data.forEach((row: any, idx: number) => {
          consumptions.push({
            id: row.id || `c${idx}`,
            memberId: row.memberId || row.会员ID || '',
            memberName: row.memberName || row.会员姓名,
            amount: parseFloat(row.amount || row.金额 || row.消费金额 || 0),
            type: row.type || (row.消费类型?.includes('私教') ? 'private_class' : 
                             row.消费类型?.includes('团课') ? 'group_class' : 
                             row.消费类型?.includes('卡') ? 'card' : 'other'),
            date: row.date || row.消费日期 || row.日期 || new Date().toISOString(),
            coachId: row.coachId || row.教练ID,
            coachName: row.coachName || row.教练姓名,
            itemName: row.itemName || row.项目名称 || row.商品名称,
            paymentMethod: row.paymentMethod || row.支付方式,
            sessions: row.sessions || row.课时数 || row.数量,
          });
        });
      }
    });
    
    return { members, entries, bookings, consumptions };
  }, [files]);

  // 更新预警数量
  useEffect(() => {
    if (alertDataSource) {
      const stats = alertEngine.getAlertStats();
      setAlertCount(stats.active);
    }
  }, [alertDataSource, alertEngine, activeTab]);

  const handleFilesUploaded = useCallback((uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    if (uploadedFiles.length > 0) {
      setCurrentStep('analyzing');
      performDataAnalysis(uploadedFiles);
    }
  }, []);

  const performDataAnalysis = async (uploadedFiles: UploadedFile[]) => {
    setIsLoading(true);
    try {
      const dataTables: DataTable[] = uploadedFiles.map(file => ({
        id: file.id, name: file.name, type: file.tableInfo.type, headers: file.headers, data: file.data, rowCount: file.rowCount,
      }));
      const linkResult = autoLinkTables(dataTables);
      setLinkResult(linkResult);
      const framework = generateAnalysisFramework(dataTables, linkResult.linkedTables, linkResult.joinGraph);
      setAnalysisFramework(framework);
      const response = await fetch('/api/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: uploadedFiles.map(f => ({ name: f.name, data: f.data, type: f.tableInfo.type })), linkResult, framework, model: selectedModel })
      });
      const result = await response.json();
      if (result.success) {
        setAiReport(result.suggestions);
        setMessages([{ role: 'assistant', content: result.suggestions, type: 'analysis' }]);
        setCurrentStep('ready');
        setActiveTab('overview');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setMessages([{ role: 'assistant', content: '分析过程中出现错误，请稍后重试。', type: 'text' }]);
      setCurrentStep('upload');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSmartQuery = async (query: string) => {
    if (files.length === 0) return;
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: query, type: 'text' }]);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: query }], data: { files: files.map(f => ({ fileName: f.name, headers: f.headers, rowCount: f.rowCount, sampleData: f.data.slice(1, 5), type: f.tableInfo.type })), linkResult, analysisFramework }, model: selectedModel, query })
      });
      const result = await response.json();
      if (result.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: result.response, type: 'analysis' }]);
        setAiReport(result.response);
      }
    } catch (error) {
      console.error('Query error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 增强智能查询处理
  const handleEnhancedQuery = async (
    query: string, 
    context: { intent: string; entities: any }
  ): Promise<string> => {
    if (files.length === 0) return '请先上传数据文件';
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: query }], 
          data: { 
            files: files.map(f => ({ 
              fileName: f.name, 
              headers: f.headers, 
              rowCount: f.rowCount, 
              sampleData: f.data.slice(1, 5), 
              type: f.tableInfo.type 
            })), 
            linkResult, 
            analysisFramework 
          }, 
          model: selectedModel, 
          query,
          nlpContext: context // 传递NLP上下文
        })
      });
      const result = await response.json();
      if (result.success) {
        return result.response;
      }
      return '抱歉，处理您的请求时出现问题';
    } catch (error) {
      console.error('Enhanced query error:', error);
      return '抱歉，处理您的请求时出现错误';
    }
  };

  const handleSelectHistory = (item: HistoryItem) => { setCurrentStep('upload'); };
  const handleClear = () => { 
    setFiles([]); 
    setMessages([]); 
    setAiReport(''); 
    setLinkResult(null); 
    setAnalysisFramework(null); 
    setCurrentStep('upload'); 
    setActiveTab('overview');
    setAlertCount(0);
  };

  const handleExport = () => {
    const reportContent = ['# 数据分析报告', '', `生成时间：${new Date().toLocaleString('zh-CN')}`, `分析文件：${files.map(f => f.name).join(', ')}`, '', '## 表格识别结果', ...files.map(f => `- ${f.name}: ${getTableTypeLabel(f.tableInfo.type)} (置信度: ${Math.round(f.tableInfo.confidence * 100)}%)`), '', '## 数据关联分析', ...(linkResult?.joinGraph.edges.map(e => { const fromFile = files.find(f => f.id === e.from); const toFile = files.find(f => f.id === e.to); return `- ${fromFile?.name} ↔ ${toFile?.name}: 通过 ${e.joinFields.join(', ')} 关联，匹配率 ${(e.matchRate * 100).toFixed(1)}%`; }) || ['未检测到关联关系']), '', '## AI 分析报告', aiReport, '', '---', '对话记录：', ...messages.map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`)].join('\n');
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `分析报告_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getMetrics = () => {
    const metrics = [];
    metrics.push({ title: '上传文件', value: files.length.toString(), icon: FileSpreadsheet, color: 'bg-blue-500' });
    const totalRows = files.reduce((sum, f) => sum + f.rowCount, 0);
    metrics.push({ title: '数据记录', value: totalRows.toLocaleString(), icon: BarChart3, color: 'bg-purple-500' });
    const uniqueTypes = new Set(files.map(f => f.tableInfo.type).filter(t => t !== 'unknown')).size;
    metrics.push({ title: '表格类型', value: uniqueTypes.toString(), icon: Table2, color: 'bg-green-500' });
    const linkCount = linkResult?.joinGraph.edges.length || 0;
    metrics.push({ title: '关联关系', value: linkCount.toString(), icon: Link2, color: 'bg-orange-500' });
    return metrics;
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[{ key: 'upload', label: '上传数据', icon: Upload }, { key: 'analyzing', label: '智能分析', icon: Brain }, { key: 'ready', label: '查看结果', icon: LayoutDashboard }].map((step, index) => {
        const isActive = currentStep === step.key;
        const isCompleted = (step.key === 'upload' && currentStep !== 'upload') || (step.key === 'analyzing' && currentStep === 'ready');
        return (
          <div key={step.key} className="flex items-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              <step.icon className="w-4 h-4" /><span className="text-sm font-medium">{step.label}</span>
            </div>
            {index < 2 && <ChevronRight className="w-4 h-4 text-gray-300 mx-2" />}
          </div>
        );
      })}
    </div>
  );

  const UploadArea = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
      <MultiFileUpload onFilesUploaded={handleFilesUploaded} maxFiles={10} maxFileSize={50} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {[{ icon: Upload, title: '多文件上传', desc: '支持同时上传多个Excel/CSV' }, { icon: Brain, title: '智能识别', desc: '自动识别表格类型' }, { icon: Link2, title: '自动关联', desc: '基于共同字段关联多表' }, { icon: ShieldAlert, title: '智能预警', desc: '自动检测经营风险' }].map((feature) => (
          <div key={feature.title} className="text-center p-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3"><feature.icon className="w-6 h-6 text-gray-600" /></div>
            <h3 className="font-medium text-gray-800 mb-1">{feature.title}</h3>
            <p className="text-sm text-gray-500">{feature.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-8"><AnalysisHistory onSelectHistory={handleSelectHistory} currentFileName={files[0]?.name} /></div>
    </motion.div>
  );

  const AnalyzingState = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
      <LoadingAnimation message="AI 正在分析您的数据..." type="analysis" />
      {files.length > 0 && (
        <div className="mt-8 max-w-2xl w-full">
          <div className="space-y-3">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <div className="flex items-center gap-2"><span className="font-medium text-sm">{file.name}</span><TableTypeBadge type={file.tableInfo.type} confidence={file.tableInfo.confidence} /></div>
                  <p className="text-xs text-gray-500">{file.rowCount.toLocaleString()} 行数据 · {file.headers.length} 个字段</p>
                </div>
              </div>
            ))}
          </div>
          {linkResult && linkResult.joinGraph.edges.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
              <p className="text-sm text-green-800 flex items-center gap-2"><Link2 className="w-4 h-4" />检测到 {linkResult.joinGraph.edges.length} 个关联关系</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Brain className="w-5 h-5 text-blue-600" />智能识别结果</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {files.map((file) => (
              <div key={file.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0"><Table2 className="w-6 h-6 text-blue-600" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2"><h4 className="font-semibold">{file.name}</h4><TableTypeBadge type={file.tableInfo.type} confidence={file.tableInfo.confidence} /></div>
                  <p className="text-sm text-gray-600 mb-2">{getTableTypeDescription(file.tableInfo.type)}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">{file.rowCount.toLocaleString()} 行</Badge>
                    <Badge variant="outline" className="text-xs">{file.headers.length} 列</Badge>
                    {file.tableInfo.matchedFields.slice(0, 5).map((field, i) => <Badge key={i} variant="secondary" className="text-xs">{field}</Badge>)}
                    {file.tableInfo.matchedFields.length > 5 && <Badge variant="secondary" className="text-xs">+{file.tableInfo.matchedFields.length - 5}</Badge>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {files.length > 1 && linkResult && <Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><Link2 className="w-5 h-5 text-green-600" />数据关联分析</CardTitle></CardHeader><CardContent><LinkGraphView joinGraph={linkResult.joinGraph} files={files} /></CardContent></Card>}
      {analysisFramework && analysisFramework.frameworks.length > 0 && <Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><Lightbulb className="w-5 h-5 text-yellow-600" />推荐分析框架</CardTitle></CardHeader><CardContent><div className="grid gap-4">{analysisFramework.frameworks.map((framework) => <FrameworkCard key={framework.id} framework={framework} />)}</div></CardContent></Card>}
      {analysisFramework && analysisFramework.combinedInsights.length > 0 && <Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><Zap className="w-5 h-5 text-purple-600" />组合洞察建议</CardTitle></CardHeader><CardContent><div className="grid gap-4">{analysisFramework.combinedInsights.map((insight, idx) => <CombinedInsightCard key={idx} insight={insight} />)}</div></CardContent></Card>}
    </div>
  );

  const ResultsView = () => {
    const metrics = getMetrics();
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-green-600" /><span className="font-medium">{files.length} 个文件</span></div>
            <div className="relative">
              <button onClick={() => setShowModelSelect(!showModelSelect)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                <Sparkles className="w-4 h-4 text-blue-600" />{selectedModel === 'deepseek' ? 'DeepSeek' : 'Kimi'}<ChevronRight className={`w-3 h-3 transition-transform ${showModelSelect ? 'rotate-90' : ''}`} />
              </button>
              {showModelSelect && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                  {['deepseek', 'kimi'].map((model) => <button key={model} onClick={() => { setSelectedModel(model as any); setShowModelSelect(false); }} className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${selectedModel === model ? 'bg-blue-50 text-blue-600' : ''}`}>{model === 'deepseek' ? 'DeepSeek' : 'Kimi'}</button>)}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-1" />导出报告</Button>
            <Button variant="outline" size="sm" onClick={handleClear}><X className="w-4 h-4 mr-1" />新分析</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{metrics.map((metric, idx) => <MetricCard key={idx} {...metric} />)}</div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ResultTab)}>
            <TabsList className="w-full justify-start rounded-none border-b bg-gray-50/50 p-0 h-auto">
              {[{ key: 'overview', label: '概览', icon: LayoutDashboard }, { key: 'insights', label: '洞察', icon: Brain }, { key: 'charts', label: '图表', icon: PieChart }, { key: 'templates', label: '分析模板', icon: BarChart3 }, { key: 'explore', label: '探索', icon: MessageSquare }, { key: 'alerts', label: '智能预警', icon: Bell }].map((tab) => (
                <TabsTrigger key={tab.key} value={tab.key} className="flex-1 flex items-center justify-center gap-2 py-4 rounded-none data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 relative">
                  <tab.icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                  {tab.key === 'alerts' && alertCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {alertCount}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="p-6">
              <TabsContent value="overview" className="mt-0"><OverviewTab /></TabsContent>
              <TabsContent value="insights" className="mt-0">{aiReport && <AIReportView report={aiReport} data={files[0]?.data || []} fileName={files[0]?.name} onClear={() => setAiReport('')} />}</TabsContent>
              <TabsContent value="charts" className="mt-0"><div className="space-y-6">{files.map((file, index) => <DataVisualization key={index} data={file.data} fileName={file.name} />)}</div></TabsContent>
              <TabsContent value="templates" className="mt-0">
                <div className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                        <h2 className="text-lg font-bold">健身房专属分析模板</h2>
                      </div>
                      <p className="text-gray-600 mb-6">基于上传的数据，我们为您准备了以下专业分析模板。请在每个模板卡片中查看详细分析。</p>
                      <div className="grid grid-cols-1 gap-6">
                        <Card className="border-blue-200">
                          <CardHeader className="bg-blue-50">
                            <CardTitle className="flex items-center gap-2 text-blue-800">
                              <Users className="w-5 h-5" />
                              会员生命周期分析
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <p className="text-gray-600 mb-4">分析会员从获取到流失的全生命周期，包括新客转化、活跃度、留存率和流失预警。</p>
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline">新客获取</Badge>
                              <Badge variant="outline">会员激活</Badge>
                              <Badge variant="outline">留存分析</Badge>
                              <Badge variant="outline">流失预警</Badge>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border-green-200">
                          <CardHeader className="bg-green-50">
                            <CardTitle className="flex items-center gap-2 text-green-800">
                              <DollarSign className="w-5 h-5" />
                              营收健康度仪表盘
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <p className="text-gray-600 mb-4">全面展示健身房营收状况，包括收入构成、趋势分析、对比分析和目标达成进度。</p>
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline">收入构成</Badge>
                              <Badge variant="outline">趋势分析</Badge>
                              <Badge variant="outline">同比环比</Badge>
                              <Badge variant="outline">目标达成</Badge>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border-purple-200">
                          <CardHeader className="bg-purple-50">
                            <CardTitle className="flex items-center gap-2 text-purple-800">
                              <UserCheck className="w-5 h-5" />
                              教练绩效分析
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <p className="text-gray-600 mb-4">评估教练团队表现，包括课时统计、收入贡献、会员满意度和工作负荷分析。</p>
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline">课时统计</Badge>
                              <Badge variant="outline">收入贡献</Badge>
                              <Badge variant="outline">满意度</Badge>
                              <Badge variant="outline">负荷分析</Badge>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border-orange-200">
                          <CardHeader className="bg-orange-50">
                            <CardTitle className="flex items-center gap-2 text-orange-800">
                              <Building2 className="w-5 h-5" />
                              场地利用率分析
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <p className="text-gray-600 mb-4">优化场地资源配置，分析高峰时段、课程饱和度和设备使用效率。</p>
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline">高峰时段</Badge>
                              <Badge variant="outline">课程饱和度</Badge>
                              <Badge variant="outline">设备效率</Badge>
                              <Badge variant="outline">资源优化</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="explore" className="mt-0">
                <div className="space-y-6">
                  <EnhancedSmartQuery 
                    onQuery={handleEnhancedQuery} 
                    isLoading={isLoading}
                    sessionId="main-session"
                  />
                </div>
              </TabsContent>
              <TabsContent value="alerts" className="mt-0">
                <AlertPanel dataSource={alertDataSource} onRefresh={() => {
                  const stats = alertEngine.getAlertStats();
                  setAlertCount(stats.active);
                }} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center"><BarChart3 className="w-6 h-6 text-white" /></div>
            <div><h1 className="font-bold text-xl text-gray-900">AI 数据分析助手</h1><p className="text-xs text-gray-500">健身房经营管理智能平台</p></div>
          </div>
          {currentStep === 'ready' && <Button variant="outline" size="sm" onClick={handleClear}>分析新文件</Button>}
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep !== 'upload' && <StepIndicator />}
        <AnimatePresence mode="wait">
          {currentStep === 'upload' && <motion.div key="upload" exit={{ opacity: 0 }}><UploadArea /></motion.div>}
          {currentStep === 'analyzing' && <motion.div key="analyzing" exit={{ opacity: 0 }}><AnalyzingState /></motion.div>}
          {currentStep === 'ready' && <motion.div key="results" exit={{ opacity: 0 }}><ResultsView /></motion.div>}
        </AnimatePresence>
      </main>
    </div>
  );
}
