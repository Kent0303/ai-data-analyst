'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  Send, 
  FileSpreadsheet, 
  X, 
  Bot, 
  User, 
  Sparkles,
  Loader2,
  BarChart3
} from 'lucide-react';
import * as XLSX from 'xlsx';

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
      content: '你好！我是你的 AI 数据分析助手。\n\n请上传 Excel 文件，我会帮你：\n1. 自动分析数据结构\n2. 生成分析框架建议\n3. 通过对话深入分析\n\n支持同时上传多个文件进行对比分析。',
      type: 'text'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'deepseek' | 'kimi'>('deepseek');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

          setFiles(prev => [...prev, {
            name: file.name,
            data: jsonData as any[][],
            size: file.size
          }]);

          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `已上传文件：${file.name} (${(file.size / 1024).toFixed(1)} KB)\n正在分析数据结构...`,
            type: 'text'
          }]);

          // 自动分析文件
          analyzeFiles([...files, { name: file.name, data: jsonData as any[][], size: file.size }]);
        } catch (error) {
          console.error('File parsing error:', error);
          alert('文件解析失败，请检查文件格式');
        }
      };
      reader.readAsBinaryString(file);
    });

    // 清空 input
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
        // 显示后端返回的错误信息
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
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 左侧边栏 - 文件上传 */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            AI 数据分析助手
          </h1>
          <p className="text-sm text-gray-500 mt-1">智能分析 · 自然语言交互</p>
        </div>

        <div className="p-4 flex-1 overflow-auto">
          {/* AI 模型选择 */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">选择 AI 模型</label>
            <div className="flex gap-2">
              <Button
                variant={selectedModel === 'deepseek' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedModel('deepseek')}
                className="flex-1"
              >
                DeepSeek
              </Button>
              <Button
                variant={selectedModel === 'kimi' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedModel('kimi')}
                className="flex-1"
              >
                Kimi
              </Button>
            </div>
          </div>

          <Separator className="my-4" />

          {/* 文件上传 */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">上传数据文件</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full h-24 border-dashed"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-6 h-6 text-gray-400" />
                <span className="text-sm text-gray-500">点击或拖拽上传 Excel</span>
              </div>
            </Button>
          </div>

          {/* 已上传文件列表 */}
          {files.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">已上传文件</label>
              {files.map((file, index) => (
                <Card key={index} className="bg-gray-50">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileSpreadsheet className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 flex-shrink-0"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 数据概览 */}
          {analysisResult?.fileAnalyses && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">数据概览</label>
              {analysisResult.fileAnalyses.map((analysis: any, index: number) => (
                <Card key={index} className="mb-2 bg-blue-50">
                  <CardContent className="p-3">
                    <p className="text-sm font-medium">{analysis.fileName}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {analysis.rowCount} 行 × {analysis.columnCount} 列
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 右侧聊天区域 */}
      <div className="flex-1 flex flex-col">
        {/* 消息列表 */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
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
                  <Card className={`${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white'}`}>
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
                <Card className="bg-white">
                  <CardContent className="p-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-500">AI 思考中...</span>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* 输入区域 */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="max-w-4xl mx-auto flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入你的分析需求，例如：帮我分析会员消费趋势..."
              className="flex-1 min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="h-auto px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            按 Enter 发送，Shift + Enter 换行
          </p>
        </div>
      </div>
    </div>
  );
}
