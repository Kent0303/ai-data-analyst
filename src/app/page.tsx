'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  FileSpreadsheet, 
  X, 
  Sparkles,
  BarChart3,
  ChevronRight,
  MessageCircle,
  TrendingUp,
  Users,
  Target,
  Brain,
  ArrowRight,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react';
import * as XLSX from 'xlsx';
import DataVisualization from '@/components/DataVisualization';
import AIReportView from '@/components/AIReportView';
import AnalysisHistory, { useAnalysisHistory, HistoryItem } from '@/components/AnalysisHistory';
import SmartQuery from '@/components/SmartQuery';
import LoadingAnimation from '@/components/LoadingAnimation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'analysis' | 'suggestion';
}

interface UploadedFile {
  name: string;
  data: any[][];
  size: number;
}

type Step = 'upload' | 'analyzing' | 'ready' | 'querying';

export default function DataAnalystPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'deepseek' | 'kimi'>('deepseek');
  const [aiReport, setAiReport] = useState<string>('');
  const [showModelSelect, setShowModelSelect] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addToHistory } = useAnalysisHistory();

  // 处理文件上传
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    Array.from(uploadedFiles).forEach(file => {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        alert('请上传 Excel 文件 (.xlsx 或 .xls)');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          const newFile = {
            name: file.name,
            data: jsonData as any[][],
            size: file.size
          };

          setFiles([newFile]);
          setCurrentStep('analyzing');
          
          // 自动分析
          analyzeData(newFile);
        } catch (error) {
          console.error('File parsing error:', error);
          alert('文件解析失败，请检查文件格式');
        }
      };
      reader.readAsBinaryString(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // 分析数据
  const analyzeData = async (file: UploadedFile) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: [file],
          model: selectedModel
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setAiReport(result.suggestions);
        setMessages([{
          role: 'assistant',
          content: result.suggestions,
          type: 'analysis'
        }]);
        setCurrentStep('ready');
        addToHistory(file.name, file.data, result.suggestions);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setMessages([{
        role: 'assistant',
        content: '分析过程中出现错误，请稍后重试。',
        type: 'text'
      }]);
      setCurrentStep('upload');
    } finally {
      setIsLoading(false);
    }
  };

  // 智能查询
  const handleSmartQuery = async (query: string, mode: 'general' | 'prediction') => {
    if (files.length === 0) return;

    setIsLoading(true);
    setCurrentStep('querying');
    
    setMessages(prev => [...prev, {
      role: 'user',
      content: query,
      type: 'text'
    }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: query }],
          data: {
            fileName: files[0].name,
            headers: files[0].data[0],
            rowCount: files[0].data.length - 1,
            sampleData: files[0].data.slice(1, 5)
          },
          model: selectedModel,
          query
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: result.response,
          type: 'analysis'
        }]);
        setAiReport(result.response);
      }
    } catch (error) {
      console.error('Query error:', error);
    } finally {
      setIsLoading(false);
      setCurrentStep('ready');
    }
  };

  // 从历史记录加载
  const handleSelectHistory = (item: HistoryItem) => {
    const newFile: UploadedFile = {
      name: item.fileName,
      data: item.fileData,
      size: 0
    };
    setFiles([newFile]);
    setAiReport(item.report);
    setMessages([{
      role: 'assistant',
      content: item.report,
      type: 'analysis'
    }]);
    setCurrentStep('ready');
  };

  // 清除当前分析
  const handleClear = () => {
    setFiles([]);
    setMessages([]);
    setAiReport('');
    setCurrentStep('upload');
  };

  // 步骤指示器
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[
        { key: 'upload', label: '上传数据', icon: Upload },
        { key: 'analyzing', label: 'AI分析', icon: Brain },
        { key: 'ready', label: '查看结果', icon: BarChart3 },
      ].map((step, index) => {
        const isActive = currentStep === step.key || (step.key === 'analyzing' && currentStep === 'querying');
        const isCompleted = 
          (step.key === 'upload' && currentStep !== 'upload') ||
          (step.key === 'analyzing' && currentStep === 'ready');
        
        return (
          <div key={step.key} className="flex items-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              isActive ? 'bg-blue-600 text-white' : 
              isCompleted ? 'bg-green-100 text-green-700' : 
              'bg-gray-100 text-gray-500'
            }`}>
              <step.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{step.label}</span>
            </div>
            {index < 2 && (
              <ChevronRight className="w-4 h-4 text-gray-300 mx-2" />
            )}
          </div>
        );
      })}
    </div>
  );

  // 上传区域
  const UploadArea = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
        <CardContent className="p-12 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Upload className="w-10 h-10 text-blue-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            上传 Excel 文件开始分析
          </h2>
          <p className="text-gray-500 mb-6">
            支持 .xlsx 和 .xls 格式，文件大小建议不超过 10MB
          </p>
          
          <Button 
            size="lg"
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <FileSpreadsheet className="w-5 h-5 mr-2" />
            选择文件
          </Button>

          {/* 历史记录入口 */}
          <AnalysisHistory 
            onSelectHistory={handleSelectHistory}
            currentFileName={files[0]?.name}
          />
        </CardContent>
      </Card>

      {/* 功能介绍 */}
      <div className="grid grid-cols-3 gap-4 mt-8">
        {[
          { icon: Users, title: '会员分析', desc: '增长趋势、留存率、活跃度' },
          { icon: Target, title: '教练管理', desc: '业绩排名、产能评估' },
          { icon: TrendingUp, title: '预测分析', desc: '收入预测、流失预警' },
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
    </motion.div>
  );

  // 分析中状态
  const AnalyzingState = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <LoadingAnimation 
        message="AI 正在分析您的数据..." 
        type="analysis"
      />
      {files.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-600 font-medium">{files[0].name}</p>
          <p className="text-sm text-gray-400 mt-1">
            {(files[0].size / 1024).toFixed(1)} KB · {files[0].data.length - 1} 行数据
          </p>
        </div>
      )}
    </motion.div>
  );

  // 结果展示
  const ResultsView = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            <span className="font-medium">{files[0]?.name}</span>
            <Badge variant="secondary">
              {files[0]?.data.length - 1} 行
            </Badge>
          </div>
          
          {/* 模型选择 */}
          <div className="relative">
            <button
              onClick={() => setShowModelSelect(!showModelSelect)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              {selectedModel === 'deepseek' ? 'DeepSeek' : 'Kimi'}
              <ChevronRight className={`w-3 h-3 transition-transform ${showModelSelect ? 'rotate-90' : ''}`} />
            </button>
            
            {showModelSelect && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                {['deepseek', 'kimi'].map((model) => (
                  <button
                    key={model}
                    onClick={() => { setSelectedModel(model as any); setShowModelSelect(false); }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${selectedModel === model ? 'bg-blue-50 text-blue-600' : ''}`}
                  >
                    {model === 'deepseek' ? 'DeepSeek' : 'Kimi'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <Button variant="outline" size="sm" onClick={handleClear}>
          <X className="w-4 h-4 mr-1" />
          清除
        </Button>
      </div>

      {/* 智能查询 */}
      <SmartQuery 
        onQuery={handleSmartQuery}
        isLoading={isLoading}
      />

      {/* AI 分析报告 */}
      {aiReport && (
        <AIReportView 
          report={aiReport}
          data={files[0]?.data || []}
          fileName={files[0]?.name}
          onClear={() => setAiReport('')}
        />
      )}
      
      {/* 数据可视化 */}
      {files.map((file, index) => (
        <DataVisualization 
          key={index}
          data={file.data} 
          fileName={file.name}
        />
      ))}

      {/* 对话历史 */}
      {messages.length > 0 && (
        <Card className="bg-gray-50 border-0">
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              对话记录
            </h3>
            <div className="space-y-3">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-lg ${
                    msg.role === 'user' ? 'bg-blue-100 ml-8' : 'bg-white mr-8'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium ${
                      msg.role === 'user' ? 'text-blue-700' : 'text-gray-500'
                    }`}>
                      {msg.role === 'user' ? '你' : 'AI 助手'}
                    </span>
                    {msg.type === 'analysis' && (
                      <Badge variant="secondary" className="text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        分析
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-gray-900">AI 数据分析助手</h1>
              <p className="text-xs text-gray-500">健身房经营管理智能平台</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {currentStep !== 'upload' && (
              <Button variant="outline" size="sm" onClick={handleClear}>
                分析新文件
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 步骤指示器 */}
        {currentStep !== 'upload' && <StepIndicator />}
        
        {/* 内容切换 */}
        <AnimatePresence mode="wait">
          {currentStep === 'upload' && (
            <motion.div key="upload" exit={{ opacity: 0 }}>
              <UploadArea />
            </motion.div>
          )}
          
          {currentStep === 'analyzing' && (
            <motion.div key="analyzing" exit={{ opacity: 0 }}>
              <AnalyzingState />
            </motion.div>
          )}
          
          {(currentStep === 'ready' || currentStep === 'querying') && (
            <motion.div key="results" exit={{ opacity: 0 }}>
              <ResultsView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
