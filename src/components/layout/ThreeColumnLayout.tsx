'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Menu, 
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import TopBar from './TopBar';
import LeftSidebar from './LeftSidebar';
import RightPanel from './RightPanel';

interface ThreeColumnLayoutProps {
  children: React.ReactNode;
  onDataSourceClick?: () => void;
  onTemplateClick?: () => void;
  onAlertClick?: () => void;
}

export default function ThreeColumnLayout({ 
  children, 
  onDataSourceClick,
  onTemplateClick,
  onAlertClick
}: ThreeColumnLayoutProps) {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileRightOpen, setIsMobileRightOpen] = useState(false);

  // 桌面端切换左侧栏
  const toggleLeftSidebar = () => {
    setIsLeftSidebarOpen(!isLeftSidebarOpen);
  };

  // 桌面端切换右侧栏
  const toggleRightPanel = () => {
    setIsRightPanelOpen(!isRightPanelOpen);
  };

  // 移动端切换菜单
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (isMobileRightOpen) setIsMobileRightOpen(false);
  };

  // 移动端切换右侧面板
  const toggleMobileRight = () => {
    setIsMobileRightOpen(!isMobileRightOpen);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* 顶部栏 */}
      <TopBar 
        onMenuClick={toggleMobileMenu} 
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧边栏 - 桌面端 */}
        <AnimatePresence initial={false}>
          {isLeftSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="hidden lg:flex flex-shrink-0 border-r border-gray-200"
            >
              <LeftSidebar 
                onDataSourceClick={onDataSourceClick}
                onTemplateClick={onTemplateClick}
                onAlertClick={onAlertClick}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 左侧边栏切换按钮 - 桌面端 */}
        <div className="hidden lg:flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLeftSidebar}
            className="h-8 w-8 rounded-full -ml-4 z-10 bg-white border border-gray-200 shadow-sm hover:shadow-md"
          >
            {isLeftSidebarOpen ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* 移动端左侧抽屉 */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* 遮罩层 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              />
              {/* 抽屉内容 */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 top-16 bottom-0 w-64 bg-white z-50 lg:hidden"
              >
                <LeftSidebar 
                  onDataSourceClick={() => {
                    onDataSourceClick?.();
                    setIsMobileMenuOpen(false);
                  }}
                  onTemplateClick={() => {
                    onTemplateClick?.();
                    setIsMobileMenuOpen(false);
                  }}
                  onAlertClick={() => {
                    onAlertClick?.();
                    setIsMobileMenuOpen(false);
                  }}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 中间内容区 */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {/* 移动端工具栏 */}
          <div className="lg:hidden flex items-center justify-between p-2 bg-white border-b border-gray-200">
            <Button variant="ghost" size="sm" onClick={toggleMobileMenu}>
              <Menu className="w-4 h-4 mr-1" />
              菜单
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleMobileRight}>
              配置
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* 内容滚动区 */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>

        {/* 移动端右侧抽屉 */}
        <AnimatePresence>
          {isMobileRightOpen && (
            <>
              {/* 遮罩层 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileRightOpen(false)}
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              />
              {/* 抽屉内容 */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-16 bottom-0 w-72 bg-white z-50 lg:hidden"
              >
                <RightPanel onClose={() => setIsMobileRightOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 右侧边栏切换按钮 - 桌面端 */}
        <div className="hidden lg:flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleRightPanel}
            className="h-8 w-8 rounded-full -mr-4 z-10 bg-white border border-gray-200 shadow-sm hover:shadow-md"
          >
            {isRightPanelOpen ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* 右侧边栏 - 桌面端 */}
        <AnimatePresence initial={false}>
          {isRightPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 288, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="hidden lg:flex flex-shrink-0 border-l border-gray-200"
            >
              <RightPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
