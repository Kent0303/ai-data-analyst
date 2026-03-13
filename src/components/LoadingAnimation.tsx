'use client';

import { motion } from 'framer-motion';
import { BarChart3, Brain, Sparkles } from 'lucide-react';

interface LoadingAnimationProps {
  message?: string;
  type?: 'analysis' | 'thinking' | 'general';
}

export default function LoadingAnimation({ 
  message = '正在分析数据...', 
  type = 'general' 
}: LoadingAnimationProps) {
  const getIcon = () => {
    switch (type) {
      case 'analysis':
        return <BarChart3 className="w-8 h-8 text-blue-500" />;
      case 'thinking':
        return <Brain className="w-8 h-8 text-purple-500" />;
      default:
        return <Sparkles className="w-8 h-8 text-amber-500" />;
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'analysis':
        return 'from-blue-500 to-cyan-500';
      case 'thinking':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-amber-500 to-orange-500';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* 动画图标容器 */}
      <div className="relative mb-4">
        {/* 外圈动画 */}
        <motion.div
          className={`absolute inset-0 rounded-full bg-gradient-to-r ${getGradient()} opacity-20`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ width: 64, height: 64, margin: -8 }}
        />
        
        {/* 内圈动画 */}
        <motion.div
          className={`absolute inset-0 rounded-full bg-gradient-to-r ${getGradient()} opacity-30`}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2,
          }}
          style={{ width: 56, height: 56, margin: -4 }}
        />
        
        {/* 中心图标 */}
        <motion.div
          className="relative z-10 w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-lg"
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {getIcon()}
        </motion.div>
      </div>

      {/* 文字动画 */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-gray-600 font-medium">{message}</p>
        
        {/* 进度点动画 */}
        <div className="flex justify-center gap-1 mt-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`w-2 h-2 rounded-full bg-gradient-to-r ${getGradient()}`}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* 提示文字 */}
      <motion.p
        className="text-xs text-gray-400 mt-4 text-center max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        AI 正在处理您的数据，请稍候...
      </motion.p>
    </div>
  );
}

// 骨架屏组件
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
      </div>
    </div>
  );
}

// 图表加载骨架
export function SkeletonChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
      <div className="h-64 bg-gray-100 rounded-lg" />
    </div>
  );
}
