'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Search, 
  Sparkles, 
  Download, 
  User,
  Bell,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDashboard } from './DashboardContext';

interface TopBarProps {
  onMenuClick?: () => void;
  isMobileMenuOpen?: boolean;
}

export default function TopBar({ onMenuClick, isMobileMenuOpen }: TopBarProps) {
  const { 
    selectedModel, 
    setSelectedModel, 
    alertCount, 
    dataSources,
    clearDashboard 
  } = useDashboard();

  const [searchQuery, setSearchQuery] = React.useState('');

  const handleExport = () => {
    // 导出报告逻辑
    const reportContent = `# 数据分析报告\n\n生成时间：${new Date().toLocaleString('zh-CN')}\n\n`;
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `分析报告_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-50"
    >
      {/* 左侧：Logo和菜单按钮 */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-lg text-gray-900 leading-tight">AI 数据分析</h1>
            <p className="text-[10px] text-gray-500">健身房经营管理智能平台</p>
          </div>
        </div>
      </div>

      {/* 中间：搜索栏 */}
      <div className="flex-1 max-w-xl mx-4 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索数据、图表、分析模板..."
            className="pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>
      </div>

      {/* 右侧：功能按钮 */}
      <div className="flex items-center gap-2">
        {/* 模型选择 */}
        <DropdownMenu>
          <DropdownMenuTrigger className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>{selectedModel === 'deepseek' ? 'DeepSeek' : 'Kimi'}</span>
            <ChevronDown className="w-3 h-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedModel('deepseek')}>
              <Sparkles className="w-4 h-4 mr-2 text-blue-600" />
              DeepSeek
              {selectedModel === 'deepseek' && <Badge variant="secondary" className="ml-2">当前</Badge>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedModel('kimi')}>
              <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
              Kimi
              {selectedModel === 'kimi' && <Badge variant="secondary" className="ml-2">当前</Badge>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 导出按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={dataSources.length === 0}
          className="hidden sm:flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm">导出</span>
        </Button>

        {/* 通知 */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-gray-600" />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </Button>

        {/* 用户菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center border border-gray-200">
              <User className="w-4 h-4 text-gray-600" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-3 py-2">
              <p className="font-medium text-sm">管理员</p>
              <p className="text-xs text-gray-500">admin@gym.com</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>个人设置</DropdownMenuItem>
            <DropdownMenuItem>数据源管理</DropdownMenuItem>
            <DropdownMenuItem>分析模板</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={clearDashboard} className="text-red-600">
              清除数据
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
}
