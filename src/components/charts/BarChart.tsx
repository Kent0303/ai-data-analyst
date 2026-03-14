'use client';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface BarChartComponentProps {
  data: any[];
  xKey: string;
  yKeys: { key: string; name: string; color: string }[];
  height?: number;
  stacked?: boolean;
  showGrid?: boolean;
}

export function BarChartComponent({
  data,
  xKey,
  yKeys,
  height = 300,
  stacked = false,
  showGrid = true
}: BarChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
        <Legend />
        {yKeys.map((yKey) => (
          <Bar 
            key={yKey.key}
            dataKey={yKey.key} 
            name={yKey.name}
            fill={yKey.color}
            stackId={stacked ? 'stack' : undefined}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
