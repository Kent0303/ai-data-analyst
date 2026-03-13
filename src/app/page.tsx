'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Send, 
  FileSpreadsheet, 
  X, 
  Bot, 
  User, 
  Sparkles,
  Loader2,
  BarChart3,
  ChevronDown,
  MessageSquare,
  History
} from 'lucide-react';
import * as XLSX from 'xlsx';
import DataVisualization from '@/components/DataVisualization';
import AIReportView from '@/components/AIReportView';
import AnalysisHistory, { useAnalysisHistory, HistoryItem } from '@/components/AnalysisHistory';
import SmartQuery from '@/components/SmartQuery';

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

export default function DataAnalystPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好！我是你的 AI 数据分析助手。\n\n请上传 Excel 文件，我会帮你自动分析数据并生成可视化图表。',
      type: 'text'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'deepseek' | 'kimi'>('deepseek');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [aiReport, setAiReport] = useState<string>('');
  const [showModelSelect, setShowModelSelect] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 历史记录功能
  const { addToHistory, history } = useAnalysisHistory();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

          setFiles(prev => [...prev, newFile]);

          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `已上传文件：${file.name} (${(file.size / 1024).toFixed(1)} KB)\n正在分析数据结构...`,
            type: 'text'
          }]);

          // 自动分析文件
          analyzeFiles([...files, newFile]);
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
  }, [files]);

  const analyzeFiles = async (currentFiles: UploadedFile[]) => {
    if (currentFiles.length === 0) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: currentFiles,
          model: selectedModel
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setAnalysisResult(result);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: result.suggestions,
          type: 'analysis'
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `分析失败：${result.error || '未知错误'}`,
          type: 'text'
        }]);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `分析过程中出现错误：${error instanceof Error ? error.message : '网络请求失败'}`,
        type: 'text'
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, type: 'text' }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }].map(m => ({
            role: m.role,
            content: m.content
          })),
          data: analysisResult,
          model: selectedModel
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: result.response,
          type: 'text'
        }]);
        // 将 AI 回复的报告显示在右侧
        setAiReport(result.response);
        
        // 保存到历史记录
        if (files.length > 0) {
          addToHistory(files[0].name, files[0].data, result.response);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，服务暂时不可用，请稍后重试。',
        type: 'text'
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
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
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `已加载历史分析：${item.fileName}`,
      type: 'text'
    }]);
  };

  // 智能查询处理
  const handleSmartQuery = async (query: string, mode: 'general' | 'prediction') => {
    if (files.length === 0) return;

    setIsLoading(true);
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
          messages: [...messages, { role: 'user', content: query }].map(m => ({
            role: m.role,
            content: m.content
          })),
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
        
        // 保存到历史记录
        addToHistory(files[0].name, files[0].data, result.response);
      }
    } catch (error) {
      console.error('Smart query error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '查询过程中出现错误，请稍后重试。',
        type: 'text'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 左侧 - AI 对话区域 */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* 顶部 - 模型选择 */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <button
              onClick={() => setShowModelSelect(!showModelSelect)}
              className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="font-medium">
                  {selectedModel === 'deepseek' ? 'DeepSeek' : 'Kimi'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showModelSelect ? 'rotate-180' : ''}`} />
            </button>
            
            {showModelSelect && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => { setSelectedModel('deepseek'); setShowModelSelect(false); }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 ${selectedModel === 'deepseek' ? 'bg-blue-50 text-blue-600' : ''}`}
                >
                  <Sparkles className="w-4 h-4" />
                  DeepSeek
                </button>
                <button
                  onClick={() => { setSelectedModel('kimi'); setShowModelSelect(false); }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 ${selectedModel === 'kimi' ? 'bg-blue-50 text-blue-600' : ''}`}
                >
                  <Sparkles className="w-4 h-4" />
                  Kimi
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 已上传文件列表 */}
        {files.length > 0 && (
          <div className="px-4 py-2 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
              <FileSpreadsheet className="w-4 h-4" />
              <span>已上传文件</span>
            </div>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileSpreadsheet className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="text-sm truncate">{file.name}</span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-red-500 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 消息列表 */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className={message.role === 'assistant' ? 'bg-blue-600' : 'bg-gray-600'}>
                  <AvatarFallback>
                    {message.role === 'assistant' ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                  <Card className={`${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                    <CardContent className="p-3">
                      {message.type === 'analysis' && (
                        <Badge className="mb-2 bg-purple-100 text-purple-800">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI 分析建议
                        </Badge>
                      )}
                      <div className="whitespace-pre-wrap text-sm">
                        {message.content}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="bg-blue-600">
                  <AvatarFallback><Bot className="w-4 h-4 text-white" /></AvatarFallback>
                </Avatar>
                <Card className="bg-gray-100">
                  <CardContent className="p-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-500">AI 思考中...</span>
                  </CardContent>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* 历史记录 */}
        <AnalysisHistory 
          onSelectHistory={handleSelectHistory}
          currentFileName={files[0]?.name}
        />

        {/* 底部输入区域 */}
        <div className="p-4 border-t border-gray-200">
          <div className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入你的分析需求..."
              className="min-h-[80px] pr-12 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isLoading}
            />
            <div className="absolute bottom-2 left-2 flex gap-2">
              {/* 上传文件按钮 */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="上传文件"
              >
                <Upload className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            按 Enter 发送，Shift + Enter 换行
          </p>
        </div>
      </div>

      {/* 右侧 - 数据可视化区域 */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* 顶部标题 */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-semibold">数据分析结果</h1>
          </div>
          {files.length > 0 && (
            <Badge variant="secondary" className="text-sm">
              {files.length} 个文件已分析
            </Badge>
          )}
        </div>

        {/* 可视化内容 */}
        <ScrollArea className="flex-1 p-6">
          {files.length === 0 && !aiReport ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <BarChart3 className="w-16 h-16 mb-4" />
              <p className="text-lg">上传 Excel 文件开始分析</p>
              <p className="text-sm mt-2">支持 .xlsx 和 .xls 格式</p>
            </div>
          ) : (
            <div className="space-y-6 max-w-6xl mx-auto">
              {/* 智能查询 */}
              {files.length > 0 && (
                <SmartQuery 
                  onQuery={handleSmartQuery}
                  isLoading={isLoading}
                />
              )}

              {/* AI 分析报告 */}
              {aiReport && files.length > 0 && (
                <AIReportView 
                  report={aiReport}
                  data={files[0]?.data || []}
                  fileName={files[0]?.name}
                  onClear={() => setAiReport('')}
                />
              )}
              
              {/* 数据可视化图表 */}
              {files.map((file, index) => (
                <DataVisualization 
                  key={index}
                  data={file.data} 
                  fileName={file.name}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
