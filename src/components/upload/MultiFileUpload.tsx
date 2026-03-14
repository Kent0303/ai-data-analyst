'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  FileSpreadsheet, 
  X, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Table2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { TableType, TableInfo, recognizeTableType } from '@/lib/tableRecognizer';

export interface UploadedFile {
  id: string;
  name: string;
  data: any[][];
  size: number;
  rowCount: number;
  headers: string[];
  tableInfo: TableInfo;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  errorMessage?: string;
}

interface MultiFileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  onFileRemoved?: (fileId: string) => void;
  maxFiles?: number;
  maxFileSize?: number; // MB
  acceptedTypes?: string[];
}

const tableTypeLabels: Record<TableType, { label: string; color: string; icon: typeof Table2 }> = {
  member_list: { label: '会员名单', color: 'bg-blue-100 text-blue-700', icon: Table2 },
  consumption_record: { label: '消费记录', color: 'bg-green-100 text-green-700', icon: Table2 },
  entry_record: { label: '进店记录', color: 'bg-purple-100 text-purple-700', icon: Table2 },
  group_class_booking: { label: '团课预约', color: 'bg-orange-100 text-orange-700', icon: Table2 },
  private_class_booking: { label: '私教预约', color: 'bg-pink-100 text-pink-700', icon: Table2 },
  unknown: { label: '未知类型', color: 'bg-gray-100 text-gray-700', icon: FileText },
};

export function MultiFileUpload({
  onFilesUploaded,
  onFileRemoved,
  maxFiles = 10,
  maxFileSize = 50,
  acceptedTypes = ['.xlsx', '.xls', '.csv'],
}: MultiFileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const processFile = async (file: File): Promise<UploadedFile> => {
    const id = generateId();
    
    // 初始状态
    const uploadedFile: UploadedFile = {
      id,
      name: file.name,
      data: [],
      size: file.size,
      rowCount: 0,
      headers: [],
      tableInfo: { type: 'unknown', confidence: 0, matchedFields: [] },
      status: 'uploading',
    };

    // 检查文件大小
    if (file.size > maxFileSize * 1024 * 1024) {
      return {
        ...uploadedFile,
        status: 'error',
        errorMessage: `文件大小超过 ${maxFileSize}MB 限制`,
      };
    }

    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);
      
      // 使用 XLSX 解析
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // 转换为 JSON，保留表头
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
      
      if (jsonData.length === 0) {
        throw new Error('文件为空');
      }

      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined));
      
      // 智能识别表格类型
      const tableInfo = recognizeTableType(headers, rows);

      return {
        ...uploadedFile,
        data: jsonData,
        rowCount: rows.length,
        headers,
        tableInfo,
        status: 'ready',
      };
    } catch (error) {
      console.error('File parsing error:', error);
      return {
        ...uploadedFile,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : '文件解析失败',
      };
    }
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles = Array.from(fileList);
    
    // 检查文件数量限制
    if (files.length + newFiles.length > maxFiles) {
      alert(`最多只能上传 ${maxFiles} 个文件`);
      return;
    }

    // 检查文件类型
    const invalidFiles = newFiles.filter(file => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      return !acceptedTypes.includes(ext);
    });

    if (invalidFiles.length > 0) {
      alert(`不支持的文件格式: ${invalidFiles.map(f => f.name).join(', ')}\n请上传 ${acceptedTypes.join(', ')} 格式的文件`);
      return;
    }

    // 处理每个文件（渐进式加载）
    const processedFiles: UploadedFile[] = [];
    
    for (const file of newFiles) {
      // 先添加到列表显示上传中状态
      const tempFile: UploadedFile = {
        id: generateId(),
        name: file.name,
        data: [],
        size: file.size,
        rowCount: 0,
        headers: [],
        tableInfo: { type: 'unknown', confidence: 0, matchedFields: [] },
        status: 'processing',
      };
      
      setFiles(prev => [...prev, tempFile]);
      
      // 异步处理文件
      const processed = await processFile(file);
      processed.id = tempFile.id;
      
      setFiles(prev => prev.map(f => f.id === tempFile.id ? processed : f));
      processedFiles.push(processed);
    }

    // 通知父组件
    const allReadyFiles = [...files, ...processedFiles].filter(f => f.status === 'ready');
    onFilesUploaded(allReadyFiles);

    // 重置 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [files]);

  const removeFile = (id: string) => {
    setFiles(prev => {
      const newFiles = prev.filter(f => f.id !== id);
      const readyFiles = newFiles.filter(f => f.status === 'ready');
      onFilesUploaded(readyFiles);
      return newFiles;
    });
    onFileRemoved?.(id);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const readyFilesCount = files.filter(f => f.status === 'ready').length;
  const hasErrors = files.some(f => f.status === 'error');

  return (
    <div className="space-y-4">
      {/* 上传区域 */}
      <Card 
        className={`border-2 border-dashed transition-all duration-200 ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
          
          <motion.div 
            className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4"
            animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
          >
            <Upload className="w-8 h-8 text-blue-600" />
          </motion.div>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {isDragging ? '松开以上传文件' : '拖拽文件到此处'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            或点击选择文件，支持 {acceptedTypes.join(', ')} 格式
          </p>
          
          <Button 
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="bg-white"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            选择文件
          </Button>

          <p className="text-xs text-gray-400 mt-4">
            最多 {maxFiles} 个文件，单个文件不超过 {maxFileSize}MB
          </p>
        </CardContent>
      </Card>

      {/* 文件列表 */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">已上传文件</span>
                    <Badge variant="secondary">
                      {readyFilesCount}/{files.length} 就绪
                    </Badge>
                  </div>
                  {hasErrors && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      有错误
                    </Badge>
                  )}
                </div>

                <ScrollArea className="max-h-64">
                  <div className="space-y-2">
                    {files.map((file) => {
                      const typeInfo = tableTypeLabels[file.tableInfo.type];
                      const TypeIcon = typeInfo.icon;
                      
                      return (
                        <motion.div
                          key={file.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            file.status === 'error' 
                              ? 'bg-red-50 border-red-200' 
                              : file.status === 'ready'
                              ? 'bg-gray-50 border-gray-200'
                              : 'bg-blue-50 border-blue-200'
                          }`}
                        >
                          {/* 文件图标 */}
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            file.status === 'ready' ? 'bg-green-100' : 
                            file.status === 'error' ? 'bg-red-100' : 'bg-blue-100'
                          }`}>
                            {file.status === 'processing' ? (
                              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                            ) : file.status === 'ready' ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : file.status === 'error' ? (
                              <AlertCircle className="w-5 h-5 text-red-600" />
                            ) : (
                              <FileSpreadsheet className="w-5 h-5 text-gray-600" />
                            )}
                          </div>

                          {/* 文件信息 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-800 truncate">
                                {file.name}
                              </p>
                              {file.status === 'ready' && (
                                <Badge className={`text-xs ${typeInfo.color}`}>
                                  <TypeIcon className="w-3 h-3 mr-1" />
                                  {typeInfo.label}
                                  {file.tableInfo.confidence > 0 && (
                                    <span className="ml-1 opacity-70">
                                      {Math.round(file.tableInfo.confidence * 100)}%
                                    </span>
                                  )}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                              {file.rowCount > 0 && ` · ${file.rowCount.toLocaleString()} 行`}
                              {file.headers.length > 0 && ` · ${file.headers.length} 列`}
                            </p>
                            {file.errorMessage && (
                              <p className="text-xs text-red-600 mt-1">
                                {file.errorMessage}
                              </p>
                            )}
                          </div>

                          {/* 删除按钮 */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                            className="flex-shrink-0 text-gray-400 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MultiFileUpload;
