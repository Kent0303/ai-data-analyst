'use client';

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface AreaChartComponentProps {
  data: any[];
  xKey: string;
  yKey: string;
  name?: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  gradient?: boolean;
}

export function AreaChartComponent({
  data,
  xKey,
  yKey,
  name = '数值',
  color = '#3B82F6',
  height = 300,
  showGrid = true,
  gradient = true
}: AreaChartComponentProps) {
  const gradientId = `gradient-${yKey}`;
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          {gradient && (
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          )}
        </defs>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
        <XAxis 
          dataKey={xKey} 
          tick={{ fontSize: 12 }}
          stroke="#6B7280"
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          stroke="#6B7280"
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          formatter={(value: number) => value.toLocaleString()}
        />
        <Area 
          type="monotone" 
          dataKey={yKey} 
          name={name}
          stroke={color} 
          fill={gradient ? `url(#${gradientId})` : color}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
