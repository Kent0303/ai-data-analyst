'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  Trash2, 
  FileSpreadsheet,
  Clock,
  ChevronRight
} from 'lucide-react';

export interface HistoryItem {
  id: string;
  fileName: string;
  fileData: any[][];
  report: string;
  timestamp: number;
  rowCount: number;
  columnCount: number;
}

interface AnalysisHistoryProps {
  onSelectHistory: (item: HistoryItem) => void;
  currentFileName?: string;
}

const STORAGE_KEY = 'ai-data-analyst-history';
const MAX_HISTORY_ITEMS = 20;

export function useAnalysisHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 从 localStorage 加载历史记录
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setHistory(parsed);
        }
      } catch (error) {
        console.error('Failed to load history:', error);
      }
      setIsLoaded(true);
    }
  }, []);

  // 保存到 localStorage
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      } catch (error) {
        console.error('Failed to save history:', error);
      }
    }
  }, [history, isLoaded]);

  const addToHistory = (fileName: string, fileData: any[][], report: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      fileName,
      fileData,
      report,
      timestamp: Date.now(),
      rowCount: fileData.length > 0 ? fileData.length - 1 : 0,
      columnCount: fileData.length > 0 ? fileData[0].length : 0
    };

    setHistory(prev => {
      // 检查是否已存在相同文件名的记录，如果存在则更新
      const filtered = prev.filter(item => item.fileName !== fileName);
      // 添加到开头，并限制数量
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      return updated;
    });

    return newItem.id;
  };

  const removeFromHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    if (confirm('确定要清空所有历史记录吗？')) {
      setHistory([]);
    }
  };

  const getHistoryItem = (id: string): HistoryItem | undefined => {
    return history.find(item => item.id === id);
  };

  return {
    history,
    isLoaded,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getHistoryItem
  };
}

export default function AnalysisHistory({ onSelectHistory, currentFileName }: AnalysisHistoryProps) {
  const { history, removeFromHistory, clearHistory } = useAnalysisHistory();
  const [isExpanded, setIsExpanded] = useState(false);

  if (history.length === 0) {
    return null;
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            分析历史
            <Badge variant="secondary" className="text-xs">
              {history.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500"
            >
              {isExpanded ? '收起' : '展开'}
              <ChevronRight className={`w-4 h-4 ml-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    currentFileName === item.fileName 
                      ? 'bg-blue-50 border-blue-300' 
                      : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => onSelectHistory(item)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileSpreadsheet className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="font-medium text-sm truncate">
                        {item.fileName}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromHistory(item.id);
                      }}
                      className="text-gray-400 hover:text-red-500 p-1 flex-shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.timestamp)}
                    </span>
                    <span>{item.rowCount} 行</span>
                    <span>{item.columnCount} 列</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
}
