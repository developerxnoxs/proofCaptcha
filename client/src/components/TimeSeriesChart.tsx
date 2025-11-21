import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TimeSeriesData {
  time: string;
  value: number;
}

interface TimeSeriesChartProps {
  data: TimeSeriesData[];
  title: string;
  color?: string;
  height?: number;
  valueFormatter?: (value: number) => string;
}

export default function TimeSeriesChart({
  data,
  title,
  color = "rgb(168, 85, 247)",
  height = 200,
  valueFormatter = (value) => value.toString(),
}: TimeSeriesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.4} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 100, 100, 0.2)" vertical={false} />
        <XAxis 
          dataKey="time" 
          stroke="rgba(148, 163, 184, 0.5)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="rgba(148, 163, 184, 0.5)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={valueFormatter}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(100, 100, 100, 0.3)',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#fff',
            backdropFilter: 'blur(10px)',
          }}
          formatter={(value: any) => [valueFormatter(value), 'Verifications']}
          labelStyle={{ color: 'rgba(148, 163, 184, 0.8)' }}
        />
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorGradient)"
          animationDuration={1500}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
