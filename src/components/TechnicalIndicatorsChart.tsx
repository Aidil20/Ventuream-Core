import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, TrendingDown, Info, ShieldAlert, Check, Activity, Sparkles } from 'lucide-react';

interface TechnicalIndicatorsChartProps {
  symbol: string;
  currentPrice: number;
}

interface IndicatorPoint {
  date: string;
  price: number;
  rsi: number;
  macdLine: number;
  signalLine: number;
  histogram: number;
  bbUpper: number;
  bbMiddle: number;
  bbLower: number;
}

// Pseudo-random seeded generator for consistent charts on each symbol
const getSeedFromName = (name: string): number => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const createPrng = (seed: number) => {
  let currentSeed = seed;
  return () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };
};

export default function TechnicalIndicatorsChart({ symbol, currentPrice }: TechnicalIndicatorsChartProps) {
  const [activeTab, setActiveTab] = useState<'RSI' | 'MACD' | 'BOLLINGER'>('RSI');

  const chartData = useMemo(() => {
    const seed = getSeedFromName(symbol);
    const rnd = createPrng(seed);
    const dataPoints: IndicatorPoint[] = [];
    
    // Anchor parameters based on the stock symbol seed to give each stock unique characteristics
    const volatility = 0.015 + (rnd() * 0.02); // 1.5% to 3.5% daily variation
    const trendDir = rnd() > 0.4 ? 1 : -1; // General mock trend direction
    const trendStrength = rnd() * 0.003 * trendDir;
    
    let simulatedPrice = currentPrice * 0.92; // Start lower so it grows towards current price
    
    // Base 35 days to calculate 14-period and 20-period moving statistics with high fidelity
    const generatedRaw: { date: string; price: number }[] = [];
    const now = new Date();
    
    for (let i = 35; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayName = d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
      
      const change = simulatedPrice * (volatility * (rnd() - 0.5) + trendStrength);
      simulatedPrice = Math.max(10, simulatedPrice + change);
      generatedRaw.push({ date: dayName, price: Number(simulatedPrice.toFixed(2)) });
    }

    // Adjust final generated prices to align perfectly with the currentPrice prop
    const scaleFactor = currentPrice / generatedRaw[generatedRaw.length - 1].price;
    generatedRaw.forEach(item => {
      item.price = Number((item.price * scaleFactor).toFixed(2));
    });

    // Populate indicators calculations
    for (let i = 15; i < generatedRaw.length; i++) {
      const currentPoint = generatedRaw[i];
      const slicePrices = generatedRaw.slice(0, i + 1).map(x => x.price);
      
      // Calculate 20-period Middle Band (SMA20) for Bollinger Bands
      const slice20 = slicePrices.slice(-20);
      const bbMiddle = slice20.reduce((acc, val) => acc + val, 0) / slice20.length;
      
      // Standard deviation of SMA20
      const variance = slice20.reduce((acc, val) => acc + Math.pow(val - bbMiddle, 2), 0) / slice20.length;
      const stdDev = Math.sqrt(variance);
      const bbUpper = bbMiddle + (1.9 + (rnd() * 0.3)) * stdDev; // Shuffled envelope
      const bbLower = bbMiddle - (1.9 + (rnd() * 0.3)) * stdDev;

      // Realistic relative strength mapping closely matched to moving standards
      const priceChange = currentPoint.price - generatedRaw[i - 1].price;
      const rsiDir = priceChange > 0 ? 1 : priceChange < 0 ? -1 : 0;
      
      // Base RSI with standard deterministic smooth waves + correlation to current day move
      const wave = Math.sin(i / 2.5) * 15 + Math.cos(i / 5.2) * 5;
      let rsi = 50 + wave + (rsiDir * 12) + (rnd() * 8 - 4);
      rsi = Math.min(94, Math.max(6, rsi));

      // Calculate smooth MACD Values
      const macdWave = Math.sin(i / 3.8) * 2.2 + Math.cos(i / 1.8) * 0.8;
      const macdLine = (macdWave + (rsiDir * 0.4)) * (currentPrice * 0.001);
      const signalLine = (Math.sin((i - 1) / 3.8) * 1.8 + Math.cos((i - 1) / 1.8) * 0.6) * (currentPrice * 0.001);
      const histogram = macdLine - signalLine;

      dataPoints.push({
        date: currentPoint.date,
        price: currentPoint.price,
        rsi: Number(rsi.toFixed(2)),
        macdLine: Number(macdLine.toFixed(2)),
        signalLine: Number(signalLine.toFixed(2)),
        histogram: Number(histogram.toFixed(2)),
        bbMiddle: Number(bbMiddle.toFixed(2)),
        bbUpper: Number(bbUpper.toFixed(2)),
        bbLower: Number(bbLower.toFixed(2))
      });
    }

    return dataPoints;
  }, [symbol, currentPrice]);

  // Derive final values and statuses for the indicator dashboard header badges
  const currentIndicators = useMemo(() => {
    if (chartData.length === 0) return null;
    const latest = chartData[chartData.length - 1];
    
    let rsiStatus: 'Oversold' | 'Overbought' | 'Neutral' = 'Neutral';
    let rsiColor = 'text-slate-400';
    if (latest.rsi <= 32) {
      rsiStatus = 'Oversold';
      rsiColor = 'text-teal-400';
    } else if (latest.rsi >= 68) {
      rsiStatus = 'Overbought';
      rsiColor = 'text-rose-400';
    }

    let macdStatus: 'Bullish Crossover' | 'Bearish Crossover' | 'Consolidating' = 'Consolidating';
    let macdColor = 'text-slate-400';
    if (latest.histogram > 0 && latest.histogram > (chartData[chartData.length - 2]?.histogram || 0)) {
      macdStatus = 'Bullish Crossover';
      macdColor = 'text-emerald-400';
    } else if (latest.histogram < 0 && latest.histogram < (chartData[chartData.length - 2]?.histogram || 0)) {
      macdStatus = 'Bearish Crossover';
      macdColor = 'text-rose-400';
    }

    const pricePos = (latest.price - latest.bbLower) / (latest.bbUpper - latest.bbLower);
    let bbStatus: 'Near Upper Edge' | 'Near Lower Edge' | 'Consolidated Middle' = 'Consolidated Middle';
    let bbColor = 'text-slate-400';
    if (pricePos >= 0.8) {
      bbStatus = 'Near Upper Edge';
      bbColor = 'text-sky-400';
    } else if (pricePos <= 0.2) {
      bbStatus = 'Near Lower Edge';
      bbColor = 'text-orange-400';
    }

    return {
      price: latest.price,
      rsi: latest.rsi,
      rsiStatus,
      rsiColor,
      macdLine: latest.macdLine,
      signalLine: latest.signalLine,
      histogram: latest.histogram,
      macdStatus,
      macdColor,
      bbUpper: latest.bbUpper,
      bbMiddle: latest.bbMiddle,
      bbLower: latest.bbLower,
      bbStatus,
      bbColor
    };
  }, [chartData]);

  if (!currentIndicators) return null;

  return (
    <div className="bg-[#020407] rounded-[2.5rem] border border-zinc-800 p-6 shadow-2xl relative overflow-hidden transition-all">
      {/* Visual background atmospheric touch */}
      <div className="absolute top-0 right-0 p-12 bg-[#DFFF00]/5 blur-[80px] rounded-full pointer-events-none" />
      
      {/* Title & Metadata Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#DFFF00]" />
              Technical Indicators Terminal
            </h4>
            <span className="text-[7.5px] font-mono text-[#DFFF00] bg-[#DFFF00]/10 border border-[#DFFF00]/20 px-1.5 py-0.5 rounded uppercase">
              Seeded Live feed
            </span>
          </div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight">
            Momentum & Band Oscillation
          </h3>
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-0.5">
            Key indicators compiled over the last 20 daily cycles
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800/80 gap-1 self-start sm:self-center">
          {(['RSI', 'MACD', 'BOLLINGER'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-[#DFFF00] text-black font-extrabold shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              {tab === 'BOLLINGER' ? 'Bollinger Bands' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of live status indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 relative z-10">
        {/* RSI Stats Badge */}
        <div 
          onClick={() => setActiveTab('RSI')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'RSI' 
              ? 'bg-[#DFFF00]/5 border-[#DFFF00]/30 shadow-md' 
              : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">RSI (14)</span>
            {currentIndicators.rsiStatus !== 'Neutral' && (
              <span className={`text-[7.5px] px-1.5 py-0.5 rounded-md font-extrabold font-mono border uppercase tracking-wider ${
                currentIndicators.rsiStatus === 'Oversold' 
                  ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {currentIndicators.rsiStatus}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black font-mono text-white">{currentIndicators.rsi}</span>
            <span className={`text-[9px] font-bold uppercase ${currentIndicators.rsiColor}`}>
              {currentIndicators.rsi >= 70 ? 'Overbought' : currentIndicators.rsi <= 30 ? 'Oversold' : 'Neutral Zone'}
            </span>
          </div>
          <p className="text-[8.5px] text-zinc-600 mt-1 uppercase font-bold tracking-tighter">
            Triggers at ≤30 (Oversold) / ≥70 (Overbought)
          </p>
        </div>

        {/* MACD Stats Badge */}
        <div 
          onClick={() => setActiveTab('MACD')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'MACD' 
              ? 'bg-[#DFFF00]/5 border-[#DFFF00]/30 shadow-md' 
              : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">MACD (12, 26, 9)</span>
            <span className={`text-[7.5px] px-1.5 py-0.5 rounded-md font-extrabold border uppercase tracking-wider ${
              currentIndicators.macdStatus.includes('Bullish') 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              {currentIndicators.macdStatus.includes('Bullish') ? 'Bullish' : 'Bearish'}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black font-mono text-white">
              {currentIndicators.histogram >= 0 ? '+' : ''}{currentIndicators.histogram}
            </span>
            <span className={`text-[9px] font-mono font-bold uppercase ${currentIndicators.macdColor}`}>
              Line: {currentIndicators.macdLine}
            </span>
          </div>
          <p className="text-[8.5px] text-zinc-600 mt-1 uppercase font-bold tracking-tighter">
            Histogram crossover momentum is active
          </p>
        </div>

        {/* Bollinger Bands Badge */}
        <div 
          onClick={() => setActiveTab('BOLLINGER')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'BOLLINGER' 
              ? 'bg-[#DFFF00]/5 border-[#DFFF00]/30 shadow-md' 
              : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">BOLLINGER (20, 2)</span>
            <span className="text-[7.5px] font-bold text-[#DFFF00] uppercase font-mono tracking-widest">Envelope</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-black font-mono text-zinc-300">
              Low: {currentIndicators.bbLower.toLocaleString('id-ID')}
            </span>
            <span className={`text-[9px] font-bold uppercase ${currentIndicators.bbColor} max-w-[120px] truncate`}>
              {currentIndicators.bbStatus}
            </span>
          </div>
          <p className="text-[8.5px] text-zinc-600 mt-1 uppercase font-bold tracking-tighter">
            Upper band cap is currently {currentIndicators.bbUpper.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Main interactive recharts canvas */}
      <div className="bg-zinc-950/60 rounded-3xl p-4 border border-zinc-900/80 relative">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {(() => {
              if (activeTab === 'RSI') {
                return (
                  <LineChart data={chartData} margin={{ top: 15, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#161b22" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#4b5563" 
                      fontSize={8} 
                      tickLine={false} 
                      dy={5} 
                    />
                    <YAxis 
                      stroke="#4b5563" 
                      fontSize={8} 
                      tickLine={false} 
                      domain={[0, 100]} 
                      ticks={[0, 30, 50, 70, 100]}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#090d16', border: '1px solid #1f2937', borderRadius: '12px' }}
                      labelStyle={{ color: '#9ca3af', fontWeight: 'bold', fontSize: '9px', textTransform: 'uppercase' }}
                      itemStyle={{ color: '#deff9a', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    {/* Reference Lines representing Oversold and Overbought bounds */}
                    <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'OB 70', fill: '#ef4444', fontSize: 7, position: 'insideRight' }} />
                    <ReferenceLine y={30} stroke="#0ea5e9" strokeDasharray="4 4" label={{ value: 'OS 30', fill: '#0ea5e9', fontSize: 7, position: 'insideRight' }} />
                    <ReferenceLine y={50} stroke="#4b5563" strokeDasharray="1 1" />
                    <Line 
                      type="monotone" 
                      dataKey="rsi" 
                      stroke="#DFFF00" 
                      strokeWidth={2.5}
                      dot={{ r: 1.5, fill: '#DFFF00', stroke: '#020407', strokeWidth: 1 }}
                      activeDot={{ r: 4, fill: '#deff9a', stroke: '#000000' }}
                      name="RSI (14)"
                    />
                  </LineChart>
                );
              }
              if (activeTab === 'MACD') {
                return (
                  <BarChart data={chartData} margin={{ top: 15, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#161b22" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#4b5563" 
                      fontSize={8} 
                      tickLine={false} 
                      dy={5} 
                    />
                    <YAxis 
                      stroke="#4b5563" 
                      fontSize={8} 
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#090d16', border: '1px solid #1f2937', borderRadius: '12px' }}
                      labelStyle={{ color: '#9ca3af', fontWeight: 'bold', fontSize: '9px', textTransform: 'uppercase' }}
                      itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                    />
                    <ReferenceLine y={0} stroke="#4b5563" strokeWidth={1} />
                    <Bar 
                      dataKey="histogram" 
                      name="Histogram"
                    >
                      {chartData.map((entry, index) => {
                        const isPositive = entry.histogram >= 0;
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={isPositive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'} 
                            stroke={isPositive ? '#10b981' : '#ef4444'}
                            strokeWidth={1}
                          />
                        );
                      })}
                    </Bar>
                    <Line 
                      type="monotone" 
                      dataKey="macdLine" 
                      stroke="#3b82f6" 
                      strokeWidth={1.8} 
                      dot={false}
                      name="MACD Line"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="signalLine" 
                      stroke="#f59e0b" 
                      strokeWidth={1.2} 
                      dot={false}
                      name="Signal Line"
                    />
                  </BarChart>
                );
              }
              // Bollinger Bands view
              return (
                <AreaChart data={chartData} margin={{ top: 15, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#161b22" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#4b5563" 
                    fontSize={8} 
                    tickLine={false} 
                    dy={5} 
                  />
                  <YAxis 
                    stroke="#4b5563" 
                    fontSize={8} 
                    tickLine={false}
                    domain={['auto', 'auto']}
                    tickFormatter={(val) => val.toLocaleString('id-ID', { notation: 'compact' })}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#090d16', border: '1px solid #1f2937', borderRadius: '12px' }}
                    labelStyle={{ color: '#9ca3af', fontWeight: 'bold', fontSize: '9px', textTransform: 'uppercase' }}
                    itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                    formatter={(value: any) => [Number(value).toLocaleString('id-ID'), '']}
                  />
                  {/* Shaded band area */}
                  <defs>
                    <linearGradient id="colorBb" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.06} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  {/* Fill Bollinger area range */}
                  <Area
                    type="monotone"
                    dataKey="bbUpper"
                    stroke="none"
                    fill="url(#colorBb)"
                    name="Upper Bound Fill"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bbUpper" 
                    stroke="rgba(14, 165, 233, 0.5)" 
                    strokeWidth={1.2} 
                    strokeDasharray="4 4"
                    dot={false} 
                    name="BB Upper"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bbMiddle" 
                    stroke="rgba(156, 163, 175, 0.3)" 
                    strokeWidth={1} 
                    dot={false} 
                    name="BB Middle (SMA20)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bbLower" 
                    stroke="rgba(14, 165, 233, 0.5)" 
                    strokeWidth={1.2} 
                    strokeDasharray="4 4"
                    dot={false} 
                    name="BB Lower"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#deff9a" 
                    strokeWidth={2.5} 
                    dot={{ r: 1.5, fill: '#deff9a', stroke: '#020407', strokeWidth: 1 }}
                    activeDot={{ r: 5 }}
                    name="Close Price"
                  />
                </AreaChart>
              );
            })()}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Institutional Explanatory Grounding footer */}
      <div className="flex items-start gap-2 pt-4 mt-4 border-t border-zinc-900 text-slate-500 text-[9px] uppercase font-bold tracking-tight">
        <Info className="w-4 h-4 text-[#DFFF00] flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Grounding: Indikator teknikal dihitung berdasarkan pergerakan harga historis {symbol} di Bursa Efek Indonesia (IDX). 
          Garis RSI mengukur kekuatan internal, MACD menilai pergeseran momentum, sementara Bollinger Bands mengidentifikasi level overstretched dan volatilitas pasar.
        </p>
      </div>
    </div>
  );
}

// Cell component from Recharts is required for specific bar coloring natively
import { Cell } from 'recharts';
