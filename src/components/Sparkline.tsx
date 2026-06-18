import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const rawVal = payload[0].value;
    return (
      <div className="bg-slate-950 border border-slate-800/80 rounded px-1.5 py-0.5 shadow-xl pointer-events-none">
        <p className="font-mono text-[8.5px] font-black text-[#DFFF00] tracking-tight leading-none">
          Rp {Math.round(rawVal).toLocaleString('id-ID')}
        </p>
      </div>
    );
  }
  return null;
};

export const Sparkline: React.FC<SparklineProps> = ({ data, color = '#DFFF00', height = 30 }) => {
  const chartData = data.map((val, i) => ({ value: val, index: i }));

  return (
    <div style={{ width: '100%', height }} className="relative">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={chartData}
          margin={{ top: 2, bottom: 2, left: 1, right: 1 }}
        >
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 1, strokeDasharray: '2 2' }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: color, stroke: '#0d1527', strokeWidth: 1 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Sparkline;
