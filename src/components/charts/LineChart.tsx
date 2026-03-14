'use client';

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface LineChartComponentProps {
  data: any[];
  xKey: string;
  yKeys: { key: string; name: string; color: string; type?: 'monotone' | 'linear' | 'step' }[];
  height?: number;
  showGrid?: boolean;
  showDots?: boolean;
}

export function LineChartComponent({
  data,
  xKey,
  yKeys,
  height = 300,
  showGrid = true,
  showDots = true
}: LineChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
          <Line 
            key={yKey.key}
            type={yKey.type || 'monotone'}
            dataKey={yKey.key} 
            name={yKey.name}
            stroke={yKey.color}
            strokeWidth={2}
            dot={showDots ? { fill: yKey.color, strokeWidth: 2, r: 4 } : false}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
