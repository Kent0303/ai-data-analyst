'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface GaugeChartProps {
  value: number;
  max?: number;
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  showPercentage?: boolean;
}

const colorMap = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500'
};

const sizeMap = {
  sm: { container: 'h-24', value: 'text-2xl' },
  md: { container: 'h-32', value: 'text-3xl' },
  lg: { container: 'h-40', value: 'text-4xl' }
};

export function GaugeChart({
  value,
  max = 100,
  title,
  subtitle,
  size = 'md',
  color = 'blue',
  showPercentage = true
}: GaugeChartProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`flex flex-col items-center justify-center ${sizeMap[size].container}`}>
          <div className={cn('font-bold text-gray-900', sizeMap[size].value)}>
            {showPercentage ? `${percentage}%` : value.toLocaleString()}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <Progress 
          value={percentage} 
          className="mt-2 h-2"
        />
      </CardContent>
    </Card>
  );
}
