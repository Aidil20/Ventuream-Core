import React, { useState, useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { motion } from 'motion/react';

const MOCK_DATA = {
  '1D': Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    value: 9000000 + Math.random() * 500000
  })),
  '5D': Array.from({ length: 5 }, (_, i) => ({
    time: `May ${i + 1}`,
    value: 8800000 + Math.random() * 800000
  })),
  '1M': Array.from({ length: 30 }, (_, i) => ({
    time: `${i + 1}`,
    value: 8500000 + Math.random() * 1200000
  })),
  '3M': Array.from({ length: 12 }, (_, i) => ({
    time: `W${i + 1}`,
    value: 8000000 + Math.random() * 2000000
  })),
  '6M': Array.from({ length: 6 }, (_, i) => ({
    time: `M${i + 1}`,
    value: 7500000 + Math.random() * 2500000
  })),
  '1Y': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => ({
    time: month,
    value: 7000000 + Math.random() * 3000000
  })),
  'YTD': Array.from({ length: 5 }, (_, i) => ({
    time: `May ${i + 1}`,
    value: 4000000 + (i * 1500000) + Math.random() * 500000
  }))
};

const TIME_RANGES = ['1D', '5D', '1M', '3M', '6M', '1Y', 'YTD'];

export default function PortfolioChart() {
  const [range, setRange] = useState('YTD');

  const data = useMemo(() => MOCK_DATA[range as keyof typeof MOCK_DATA], [range]);

  const formatValue = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 1,
      notation: 'compact'
    }).format(val);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-800/80 backdrop-blur-xl shadow-2xl overflow-hidden relative group"
    >
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#deff9a]/5 blur-[100px] rounded-full group-hover:bg-[#deff9a]/10 transition-all duration-700" />
      
      <div className="flex justify-center mb-8 relative z-10">
        <div className="flex bg-slate-950/50 p-1 rounded-2xl border border-slate-800/50 shadow-inner">
          {TIME_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all duration-300 ${
                range === r 
                  ? 'bg-slate-800 text-[#deff9a] shadow-[0_0_15px_rgba(222,255,154,0.15)] ring-1 ring-slate-700/50' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full relative aspect-[16/9]">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#deff9a" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#deff9a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="0" 
                vertical={true} 
                horizontal={true} 
                stroke="#1e293b" 
                strokeOpacity={0.3}
              />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#475569', fontSize: 10, fontWeight: 800 }}
                dy={10}
                interval="preserveStartEnd"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#475569', fontSize: 10, fontWeight: 800 }}
                tickFormatter={(val) => `${(val / 1000000).toFixed(0)}k`}
                dx={-5}
              />
              <Tooltip 
                cursor={{ stroke: '#deff9a', strokeWidth: 1, strokeDasharray: '4 4' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#020617]/90 border border-[#deff9a]/30 p-3 rounded-2xl shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{payload[0].payload.time}</p>
                        <p className="text-sm font-black text-[#deff9a] font-mono">
                          {formatValue(payload[0].value as number)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#deff9a" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorValue)" 
                animationDuration={1500}
                dot={{ fill: '#deff9a', stroke: '#020617', strokeWidth: 3, r: 5 }}
                activeDot={{ r: 8, fill: '#deff9a', stroke: '#fff', strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
