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

// 页面内容组件
function PageContent() {
  const { setDataSources, setAlertCount, selectedModel, addAIMessage, setAILoading } = useDashboard();
  
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
  return (
    <ErrorBoundary>
      <DashboardProvider>
        <ThreeColumnLayout>
          <PageContent />
        </ThreeColumnLayout>
      </DashboardProvider>
    </ErrorBoundary>
  );
}
