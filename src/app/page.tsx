'use client';

import { DashboardProvider, ThreeColumnLayout } from '@/components/layout';
import { FilterBar, KPICards, ChartContainer, AIFooter } from '@/components/dashboard';
import MultiFileUpload, { UploadedFile } from '@/components/upload/MultiFileUpload';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useDashboard } from '@/components/layout/DashboardContext';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Brain, LayoutDashboard, Link2, ShieldAlert,
  CheckCircle2, Table2, FileSpreadsheet, Sparkles, ChevronRight,
  Download, X, Zap, Lightbulb, ArrowRight, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingAnimation from '@/components/LoadingAnimation';
import AnalysisHistory, { HistoryItem } from '@/components/AnalysisHistory';
import DataVisualization from '@/components/DataVisualization';
import AIReportView from '@/components/AIReportView';
import EnhancedSmartQuery from '@/components/EnhancedSmartQuery';
import { AlertPanel } from '@/components/alerts';
import { TableType, getTableTypeLabel, getTableTypeDescription } from '@/lib/tableRecognizer';
import { autoLinkTables, DataTable, LinkResult } from '@/lib/dataLinker';
import { generateAnalysisFramework, AnalysisFramework, CombinedInsight, GeneratedAnalysis } from '@/lib/analysisFramework';
import { getAlertEngine, AlertDataSource } from '@/lib/alerts';
import { Member, EntryRecord, Booking, Consumption } from '@/lib/tableRecognizer';

// 分析模板内容组件
function TemplateAnalysisView({ 
  templateId, 
  files, 
  selectedModel 
}: { 
  templateId: string; 
  files: UploadedFile[];
  selectedModel: 'deepseek' | 'kimi';
}) {
  const templateNames: Record<string, string> = {
    'member-lifecycle': '会员生命周期分析',
    'revenue-dashboard': '营收健康度仪表盘',
    'coach-performance': '教练绩效分析',
    'venue-utilization': '场地利用率分析',
  };

  const templateDescriptions: Record<string, string> = {
    'member-lifecycle': '分析会员从注册到流失的全生命周期价值，识别高价值会员和流失风险',
    'revenue-dashboard': '全面展示营收状况，包括收入趋势、成本分析和盈利能力评估',
    'coach-performance': '评估教练授课质量、会员满意度和私教转化率等关键指标',
    'venue-utilization': '分析场地使用效率，识别高峰低谷时段，优化资源配置',
  };

  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>('');

  // 执行 AI 分析
  useEffect(() => {
    const performAnalysis = async () => {
      if (files.length === 0) return;
      
      setIsAnalyzing(true);
      setError('');
      
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: files.map(f => ({ 
              name: f.name, 
              data: f.data.slice(0, 100), // 只发送前100行数据避免过大
              headers: f.headers,
              type: f.tableInfo.type 
            })),
            templateId,
            model: selectedModel,
          })
        });
        
        const result = await response.json();
        if (result.success) {
          setAnalysisResult(result.suggestions || result.analysis || '分析完成，但未返回结果');
        } else {
          setError(result.error || '分析失败');
        }
      } catch (err) {
        setError('网络错误，请稍后重试');
      } finally {
        setIsAnalyzing(false);
      }
    };
    
    performAnalysis();
  }, [templateId, files, selectedModel]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{templateNames[templateId] || '分析模板'}</h2>
          <p className="text-gray-500 mt-1">{templateDescriptions[templateId] || '基于上传数据自动生成分析'}</p>
        </div>
        <Badge variant="outline" className="text-sm">{files.length} 个数据源</Badge>
      </div>
      
      {isAnalyzing ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">AI 正在生成分析报告...</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              基于您上传的 {files.length} 个数据文件，正在使用 {templateNames[templateId]} 模板进行深度分析
            </p>
            <div className="mt-6 flex justify-center gap-2">
              {files.map((f) => (
                <Badge key={f.id} variant="secondary">{f.name}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-red-200">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">分析出错</h3>
            <p className="text-red-500 max-w-md mx-auto">{error}</p>
          </CardContent>
        </Card>
      ) : analysisResult ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              AI 分析报告
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ 
                __html: analysisResult
                  .replace(/\n/g, '<br/>')
                  .replace(/#{1,6}\s+(.+)/g, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
                  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.+?)\*/g, '<em>$1</em>')
                  .replace(/-\s+(.+)/g, '<li class="ml-4">$1</li>')
              }} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* 显示数据源概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {files.map((file) => (
          <Card key={file.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-green-600" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">{file.rowCount.toLocaleString()} 行 · {file.headers.length} 列</p>
                </div>
                <Badge>{getTableTypeLabel(file.tableInfo.type)}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// 页面内容组件
function PageContent({ showAlertPanel, setShowAlertPanel }: { showAlertPanel: boolean; setShowAlertPanel: (show: boolean) => void }) {
  const { setDataSources, setAlertCount, selectedModel, addAIMessage, setAILoading, selectedTemplate, setSelectedTemplate } = useDashboard();
  
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyzing' | 'ready'>('upload');
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [aiReport, setAiReport] = useState('');
  const [linkResult, setLinkResult] = useState<LinkResult | null>(null);
  const [analysisFramework, setAnalysisFramework] = useState<GeneratedAnalysis | null>(null);
  const [showModelSelect, setShowModelSelect] = useState(false);
  const alertEngine = useMemo(() => getAlertEngine(), []);

  // 同步 files 到全局状态
  useEffect(() => {
    if (files.length > 0) {
      const sources = files.map(file => ({
        id: file.id,
        name: file.name,
        type: file.tableInfo.type,
        rowCount: file.rowCount,
        headers: file.headers,
        data: file.data,
      }));
      setDataSources(sources);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const handleFilesUploaded = useCallback((uploadedFiles: UploadedFile[]) => {
    setFiles(uploadedFiles);
    if (uploadedFiles.length > 0) {
      setCurrentStep('analyzing');
      performDataAnalysis(uploadedFiles);
    }
  }, []);

  const performDataAnalysis = async (uploadedFiles: UploadedFile[]) => {
    setIsLoading(true);
    setAILoading(true);
    try {
      const dataTables: DataTable[] = uploadedFiles.map(file => ({
        id: file.id, name: file.name, type: file.tableInfo.type, headers: file.headers, data: file.data, rowCount: file.rowCount,
      }));
      const linkResult = autoLinkTables(dataTables);
      setLinkResult(linkResult);
      const framework = generateAnalysisFramework(dataTables, linkResult.linkedTables, linkResult.joinGraph);
      setAnalysisFramework(framework);
      
      const response = await fetch('/api/analyze', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          files: uploadedFiles.map(f => ({ name: f.name, data: f.data, type: f.tableInfo.type })), 
          linkResult, 
          framework, 
          model: selectedModel 
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setAiReport(result.suggestions);
        addAIMessage({ role: 'assistant', content: result.suggestions });
        setCurrentStep('ready');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setCurrentStep('upload');
    } finally {
      setIsLoading(false);
      setAILoading(false);
    }
  };

  const handleClear = () => {
    setFiles([]);
    setAiReport('');
    setLinkResult(null);
    setAnalysisFramework(null);
    setCurrentStep('upload');
    setAlertCount(0);
    setDataSources([]);
  };

  const handleExport = () => {
    const reportContent = `# 数据分析报告\n\n生成时间：${new Date().toLocaleString('zh-CN')}\n\n`;
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `分析报告_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
  };

  // 上传区域
  if (currentStep === 'upload') {
    return (
      <div className="p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
          <MultiFileUpload onFilesUploaded={handleFilesUploaded} maxFiles={10} maxFileSize={50} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { icon: Upload, title: '多文件上传', desc: '支持同时上传多个Excel/CSV' },
              { icon: Brain, title: '智能识别', desc: '自动识别表格类型' },
              { icon: Link2, title: '自动关联', desc: '基于共同字段关联多表' },
              { icon: ShieldAlert, title: '智能预警', desc: '自动检测经营风险' }
            ].map((feature) => (
              <div key={feature.title} className="text-center p-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="w-6 h-6 text-gray-600" />
                </div>
                <h3 className="font-medium text-gray-800 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <AnalysisHistory onSelectHistory={() => {}} currentFileName={files[0]?.name} />
          </div>
        </motion.div>
      </div>
    );
  }

  // 分析中
  if (currentStep === 'analyzing') {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingAnimation message="AI 正在分析您的数据..." type="analysis" />
        {files.length > 0 && (
          <div className="mt-8 max-w-2xl w-full px-4">
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{file.name}</span>
                      <Badge variant="outline" className="text-xs">{getTableTypeLabel(file.tableInfo.type)}</Badge>
                    </div>
                    <p className="text-xs text-gray-500">{file.rowCount.toLocaleString()} 行数据</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 结果展示 - 三栏布局内容
  
  // 如果有选中的分析模板，显示模板分析视图
  if (selectedTemplate) {
    return <TemplateAnalysisView templateId={selectedTemplate} files={files} selectedModel={selectedModel} />;
  }
  
  // 如果显示预警面板
  if (showAlertPanel) {
    const memberFile = files.find(f => f.tableInfo.type === 'member_list');
    const consumptionFile = files.find(f => f.tableInfo.type === 'consumption_record');
    const entryFile = files.find(f => f.tableInfo.type === 'entry_record');
    const bookingFile = files.find(f => f.tableInfo.type === 'private_class_booking' || f.tableInfo.type === 'group_class_booking');
    
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">智能预警中心</h2>
            <p className="text-gray-500 mt-1">自动检测经营风险，及时预警</p>
          </div>
          <Button variant="outline" onClick={() => setShowAlertPanel(false)}>
            返回概览
          </Button>
        </div>
        <AlertPanel 
          dataSource={files.length > 0 ? {
            members: memberFile?.data?.map((row: any) => ({
              id: row[0] || '', 
              name: row[1] || '', 
              phone: row[2], 
              registerDate: row[3] || new Date().toISOString(), 
              status: row[4]
            })) || [],
            consumptions: consumptionFile?.data?.map((row: any) => ({
              id: row[0] || '', 
              memberId: row[1] || '', 
              amount: parseFloat(row[2]) || 0, 
              date: row[3] || new Date().toISOString(), 
              type: row[4] || 'other'
            })) || [],
            entries: entryFile?.data?.map((row: any) => ({
              id: row[0] || '', 
              memberId: row[1] || '', 
              entryTime: row[2] || new Date().toISOString(), 
              exitTime: row[3]
            })) || [],
            bookings: bookingFile?.data?.map((row: any) => ({
              id: row[0] || '', 
              memberId: row[1] || '', 
              coachId: row[2], 
              bookingTime: row[3] || new Date().toISOString(), 
              type: bookingFile?.tableInfo.type === 'private_class_booking' ? 'private' : 'group'
            })) || [],
          } : undefined}
        />
      </div>
    );
  }
  
  return (
    <>
      {/* 筛选栏 */}
      <FilterBar />
      
      {/* KPI卡片 */}
      <KPICards />
      
      {/* 图表容器 */}
      <ChartContainer />
      
      {/* AI对话区 */}
      <div className="flex-1">
        <AIFooter />
      </div>
    </>
  );
}

// 主页面
export default function DataAnalystPage() {
  const [showAlertPanel, setShowAlertPanel] = useState(false);
  
  return (
    <ErrorBoundary>
      <DashboardProvider>
        <ThreeColumnLayout 
          onTemplateClick={() => setShowAlertPanel(false)}
          onAlertClick={() => setShowAlertPanel(true)}
        >
          <PageContentWrapper showAlertPanel={showAlertPanel} setShowAlertPanel={setShowAlertPanel} />
        </ThreeColumnLayout>
      </DashboardProvider>
    </ErrorBoundary>
  );
}

// 包装组件以访问 DashboardContext
function PageContentWrapper({ showAlertPanel, setShowAlertPanel }: { showAlertPanel: boolean; setShowAlertPanel: (show: boolean) => void }) {
  return <PageContent showAlertPanel={showAlertPanel} setShowAlertPanel={setShowAlertPanel} />;
}
