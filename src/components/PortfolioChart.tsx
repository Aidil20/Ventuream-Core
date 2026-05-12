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

interface PortfolioChartProps {
  currentValue?: number;
  symbol?: string; // Optional symbol to show dedicated TradingView chart
}

export default function PortfolioChart({ currentValue = 0, symbol = 'IDX:COMPOSITE' }: PortfolioChartProps) {
  const [range, setRange] = useState('YTD');
  const [viewMode, setViewMode] = useState<'portfolio' | 'market'>('portfolio');
  const [showBenchmark, setShowBenchmark] = useState(false);

  const data = useMemo(() => {
    const baseData = MOCK_DATA[range as keyof typeof MOCK_DATA];
    if (viewMode === 'market') return baseData;

    // Scale mock data to anchor to current value for realism
    let processedData = baseData.map(d => ({ ...d }));
    
    if (currentValue > 0) {
      const lastMockValue = baseData[baseData.length - 1].value;
      const scaleFactor = currentValue / lastMockValue;
      processedData = processedData.map(d => ({
        ...d,
        value: d.value * scaleFactor
      }));
    }

    if (showBenchmark) {
      // Simulate benchmark (IHSG) data based on portfolio trends but slightly different
      const startValue = processedData[0].value;
      processedData = processedData.map((d, i) => {
        // Benchmark follows a slightly different trajectory (e.g., smoother or lagging)
        const volatility = 0.05;
        const drift = 0.002;
        const benchmarkTrend = 1 + (i * drift) + (Math.sin(i / 3) * volatility);
        return {
          ...d,
          benchmark: startValue * benchmarkTrend
        };
      });
    }

    return processedData;
  }, [range, viewMode, currentValue, showBenchmark]);

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
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#DFFF00]/5 blur-[100px] rounded-full group-hover:bg-[#DFFF00]/10 transition-all duration-700" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 relative z-10 gap-4">
        <div className="flex bg-slate-950/50 p-1 rounded-2xl border border-slate-800/50 shadow-inner">
          <button
            onClick={() => setViewMode('portfolio')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all duration-300 ${
              viewMode === 'portfolio' 
                ? 'bg-slate-800 text-[#DFFF00] shadow-[0_0_15px_rgba(223,255,0,0.1) border border-slate-700/50' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            PORTFOLIO
          </button>
          <button
            onClick={() => setViewMode('market')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all duration-300 ${
              viewMode === 'market' 
                ? 'bg-slate-800 text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.1)] border border-slate-700/50' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            MARKET (IHSG)
          </button>
        </div>

        {viewMode === 'portfolio' && (
          <button
            onClick={() => setShowBenchmark(!showBenchmark)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all duration-300 border ${
              showBenchmark 
                ? 'bg-[#DFFF00]/10 text-[#DFFF00] border-[#DFFF00]/30 shadow-[0_0_15px_rgba(223,255,0,0.1)]' 
                : 'bg-slate-950/50 text-slate-500 border-slate-800/50 hover:text-slate-300'
            }`}
          >
            COMPARE IHSG
          </button>
        )}

        <div className="flex bg-slate-950/50 p-1 rounded-2xl border border-slate-800/50 shadow-inner">
          {TIME_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all duration-300 ${
                range === r 
                  ? 'bg-slate-800 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)] ring-1 ring-slate-700/50' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full relative aspect-[16/9] min-h-[300px]">
        {viewMode === 'market' ? (
          <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-800">
            <iframe
              src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_762c9&symbol=${symbol}&interval=D&hidesidetoolbar=0&hidetoptoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%22MASimple%40tv-basicstudies%22%2C%22MAExp%40tv-basicstudies%22%2C%22RSI%40tv-basicstudies%22%2C%22MACD%40tv-basicstudies%22%2C%22BB%40tv-basicstudies%22%5D&theme=dark&style=3&timezone=Asia%2FJakarta&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=id&utm_source=www.tradingview.com&utm_medium=widget&utm_campaign=chart&utm_term=${symbol}`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowtransparency="true"
              scrolling="no"
              allowFullScreen={true}
            />
          </div>
        ) : (
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DFFF00" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#DFFF00" stopOpacity={0}/>
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
                cursor={{ stroke: '#DFFF00', strokeWidth: 1, strokeDasharray: '4 4' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-black/90 border border-white/10 p-3 rounded-2xl shadow-2xl backdrop-blur-xl ring-1 ring-white/5 space-y-2">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{payload[0].payload.time}</p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] text-zinc-400 font-bold">PORTFOLIO</span>
                            <span className="text-xs font-black text-[#DFFF00] font-mono">
                              {formatValue(payload[0].value as number)}
                            </span>
                          </div>
                          {payload.length > 1 && (
                            <div className="flex items-center justify-between gap-4 pt-1 border-t border-white/5">
                              <span className="text-[10px] text-zinc-400 font-bold">IHSG INDEX</span>
                              <span className="text-xs font-black text-blue-400 font-mono">
                                {formatValue(payload[1].value as number)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#DFFF00" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorValue)" 
                animationDuration={1500}
                dot={range === '1D' ? false : { fill: '#DFFF00', stroke: '#000', strokeWidth: 3, r: 5 }}
                activeDot={{ r: 8, fill: '#DFFF00', stroke: '#fff', strokeWidth: 3 }}
              />
              {showBenchmark && (
                <Area 
                  type="monotone" 
                  dataKey="benchmark" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fillOpacity={0}
                  animationDuration={1500}
                  dot={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      </div>
    </motion.div>
  );
}
