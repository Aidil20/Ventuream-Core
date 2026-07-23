import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  AreaChart,
  Area,
  Line,
  Legend,
  ComposedChart
} from 'recharts';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Info, 
  Calendar, 
  ArrowUpRight, 
  Activity, 
  Layers,
  LineChart as LucideLineChart
} from 'lucide-react';

interface DailyPnLRecord {
  date: string;
  pnl: number;
  event: string;
  efficiency: number;
}

const HISTORICAL_PNL_DATA: DailyPnLRecord[] = [
  { date: '23 Jun', pnl: 145000, event: 'Trimmed BBRI position after 3.2% rally', efficiency: 94 },
  { date: '24 Jun', pnl: 220000, event: 'ASII Dividend payout reallocation', efficiency: 98 },
  { date: '25 Jun', pnl: -95000, event: 'Stop-loss exit GOTO Tranche 2', efficiency: 70 },
  { date: '26 Jun', pnl: 310000, event: 'Rebalance Consumer Sector weights', efficiency: 91 },
  { date: '27 Jun', pnl: 180000, event: 'Adaro Energy dividend trimming', efficiency: 93 },
  { date: '28 Jun', pnl: -45000, event: 'Index hedging option swap expiry', efficiency: 82 },
  { date: '29 Jun', pnl: 290000, event: 'Overweight TLKM structural correction', efficiency: 90 },
  { date: '30 Jun', pnl: 410000, event: 'Commodity swap execution on PTBA/INCO', efficiency: 95 },
  { date: '01 Jul', pnl: 165000, event: 'Trimmed high banking peak exposure', efficiency: 88 },
  { date: '02 Jul', pnl: -80000, event: 'Slippage correction on illiquid stock', efficiency: 76 },
  { date: '03 Jul', pnl: 340000, event: 'Sector shift to Infrastructure bonds', efficiency: 94 },
  { date: '04 Jul', pnl: 210000, event: 'Dynamic hedging currency allocation', efficiency: 92 },
  { date: '05 Jul', pnl: -120000, event: 'Short-term tech sector profit taking', efficiency: 68 },
  { date: '06 Jul', pnl: 275000, event: 'BMRI Tranche 1 rebalancing gain', efficiency: 89 },
  { date: '07 Jul', pnl: 195000, event: 'ICBP defensive sector rotation', efficiency: 91 },
  { date: '08 Jul', pnl: 380000, event: 'UNTR heavy equipment rally exit', efficiency: 96 },
  { date: '09 Jul', pnl: -60000, event: 'FX hedge rebalancing adjustments', efficiency: 84 },
  { date: '10 Jul', pnl: 450000, event: 'BBNI record high profit lock', efficiency: 99 },
  { date: '11 Jul', pnl: 130000, event: 'CPIN poultry sector weight adjustment', efficiency: 87 },
  { date: '12 Jul', pnl: -110000, event: 'Energy sector pullback stop loss', efficiency: 72 },
  { date: '13 Jul', pnl: 285000, event: 'AMRT retail expansion allocation', efficiency: 93 },
  { date: '14 Jul', pnl: 320000, event: 'MDKA gold rally partial liquidation', efficiency: 95 },
  { date: '15 Jul', pnl: 175000, event: 'TLKM fiber optical growth realization', efficiency: 89 },
  { date: '16 Jul', pnl: -85000, event: 'Automotive sector margin pressure', efficiency: 78 },
  { date: '17 Jul', pnl: 490000, event: 'SBN government bond coupon maturity', efficiency: 100 },
  { date: '18 Jul', pnl: 230000, event: 'KLBF pharmaceutical sector rotation', efficiency: 90 },
  { date: '19 Jul', pnl: 160000, event: 'PGAS gas distribution dividend trim', efficiency: 86 },
  { date: '20 Jul', pnl: -50000, event: 'Minor volatility rebalancing cost', efficiency: 81 },
  { date: '21 Jul', pnl: 350000, event: 'INDF consumer goods quarterly rebalance', efficiency: 94 },
  { date: '22 Jul', pnl: 280000, event: 'Bank Mandiri liquidity optimization', efficiency: 92 },
];

interface RealizedPnLChartProps {
  realizedPnL?: number; // Live rebalance P&L from props
}

export default function RealizedPnLChart({ realizedPnL = 0 }: RealizedPnLChartProps) {
  const [viewMode, setViewMode] = useState<'daily' | 'cumulative' | 'composite' | 'drawdown'>('composite');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Sync with live realized P&L from the active workspace session
  const combinedData = useMemo(() => {
    const base = [...HISTORICAL_PNL_DATA];
    if (realizedPnL !== 0) {
      base.push({
        date: 'Today',
        pnl: realizedPnL,
        event: 'Active Session Rebalancing Execution',
        efficiency: realizedPnL > 0 ? 96 : 74
      });
    }
    return base;
  }, [realizedPnL]);

  // Compute accumulated realized equity curve and rolling drawdowns
  const chartData = useMemo(() => {
    let accumulated = 0;
    let peak = 0;
    return combinedData.map((item, index) => {
      accumulated += item.pnl;
      if (index === 0) {
        peak = accumulated > 0 ? accumulated : 0;
      } else {
        peak = Math.max(peak, accumulated);
      }
      const drawdown = accumulated - peak;
      return {
        ...item,
        cumulative: accumulated,
        drawdown,
        peak,
        index
      };
    });
  }, [combinedData]);

  // Metrics calculation
  const stats = useMemo(() => {
    const totalRealized = chartData.reduce((acc, item) => acc + item.pnl, 0);
    const winDays = chartData.filter(item => item.pnl > 0).length;
    const totalDays = chartData.filter(item => item.pnl !== 0).length || 1;
    const winRate = (winDays / totalDays) * 100;
    
    const maxGain = Math.max(...chartData.map(item => item.pnl));
    const avgGain = chartData.reduce((acc, item) => acc + (item.pnl > 0 ? item.pnl : 0), 0) / (winDays || 1);
    const avgEfficiency = chartData.reduce((acc, item) => acc + item.efficiency, 0) / chartData.length;

    return {
      totalRealized,
      winRate,
      maxGain,
      avgGain,
      avgEfficiency
    };
  }, [chartData]);

  const formatIDR = (val: number) => {
    const isNeg = val < 0;
    const absVal = Math.abs(val);
    return `${isNeg ? '-' : ''}Rp ${absVal.toLocaleString('id-ID')}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPositive = data.pnl >= 0;

      return (
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl shadow-2xl max-w-xs font-mono text-[9px] space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <span className="text-zinc-500 font-bold uppercase tracking-wider">{data.date}</span>
            <span className="text-[7px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 uppercase">
              REBALANCING DRAFT
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center gap-6">
              <span className="text-zinc-500 uppercase">Realized PnL:</span>
              <span className={`font-bold ${isPositive ? 'text-[#deff9a]' : 'text-rose-400'}`}>
                {formatIDR(data.pnl)}
              </span>
            </div>

            <div className="flex justify-between items-center gap-6">
              <span className="text-zinc-500 uppercase">Cumulative Curve:</span>
              <span className="text-zinc-300 font-bold">
                {formatIDR(data.cumulative)}
              </span>
            </div>

            {data.drawdown !== undefined && data.drawdown < 0 && (
              <div className="flex justify-between items-center gap-6">
                <span className="text-rose-500/70 uppercase">Rolling Drawdown:</span>
                <span className="text-rose-400 font-bold">
                  {formatIDR(data.drawdown)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center gap-6">
              <span className="text-zinc-500 uppercase">Execution Efficiency:</span>
              <span className="text-sky-400 font-bold">{data.efficiency}%</span>
            </div>
          </div>

          <div className="border-t border-zinc-900 pt-2 text-[8.5px] text-zinc-400 italic font-sans leading-normal">
            <span className="text-zinc-600 block uppercase font-mono text-[7.5px] not-italic mb-0.5">Audit log notes:</span>
            "{data.event}"
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-2xl border border-zinc-850 bg-zinc-950/40 space-y-6" id="realized-pnl-analyzer">
      {/* Header Block with controller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-mono font-bold bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded border border-orange-500/20 uppercase tracking-widest">
              SOP-VAM-TR-04
            </span>
            <span className="text-[8px] font-mono font-bold bg-[#deff9a]/10 text-[#deff9a] px-2 py-0.5 rounded border border-[#deff9a]/20 uppercase tracking-widest">
              RECHARTS LIVE PIPELINE
            </span>
          </div>
          <h3 className="text-xs font-mono font-black text-white uppercase tracking-widest flex items-center gap-2">
            <LucideLineChart className="w-4 h-4 text-[#deff9a]" /> DAILY REALIZED P&L TRENDS & PERFORMANCE HISTORY
          </h3>
          <p className="text-[10px] text-zinc-400 max-w-xl">
            Audit history of executed rebalancing orders, liquidated positions, and capital gains tracking with rolling mark-to-market settlements.
          </p>
        </div>

        {/* Controls */}
        <div className="flex bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg w-fit">
          <button
            onClick={() => setViewMode('composite')}
            className={`text-[8.5px] font-mono font-bold uppercase px-2.5 py-1.5 rounded transition-all ${
              viewMode === 'composite'
                ? 'bg-zinc-800 text-[#deff9a] shadow'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            <Layers className="w-3 h-3 inline-block mr-1" /> COMPOSITE VIEW
          </button>
          <button
            onClick={() => setViewMode('daily')}
            className={`text-[8.5px] font-mono font-bold uppercase px-2.5 py-1.5 rounded transition-all ${
              viewMode === 'daily'
                ? 'bg-zinc-800 text-[#deff9a] shadow'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            <Activity className="w-3 h-3 inline-block mr-1" /> DAILY WIN/LOSS
          </button>
          <button
            onClick={() => setViewMode('cumulative')}
            className={`text-[8.5px] font-mono font-bold uppercase px-2.5 py-1.5 rounded transition-all ${
              viewMode === 'cumulative'
                ? 'bg-zinc-800 text-[#deff9a] shadow'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3 h-3 inline-block mr-1" /> EQUITY CURVE
          </button>
          <button
            onClick={() => setViewMode('drawdown')}
            className={`text-[8.5px] font-mono font-bold uppercase px-2.5 py-1.5 rounded transition-all ${
              viewMode === 'drawdown'
                ? 'bg-zinc-800 text-rose-400 shadow'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            <TrendingDown className="w-3 h-3 inline-block mr-1" /> DRAWDOWN
          </button>
        </div>
      </div>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-900 flex flex-col justify-between">
          <span className="text-[8px] font-mono font-black text-zinc-500 uppercase tracking-widest">
            Total Realized Gain YTD
          </span>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-sm font-mono font-black text-[#deff9a]">
              {formatIDR(stats.totalRealized)}
            </span>
          </div>
          <span className="text-[7.5px] font-mono text-zinc-600 mt-1 uppercase">
            COMPLIANT WITH PSAK-71
          </span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-900 flex flex-col justify-between">
          <span className="text-[8px] font-mono font-black text-zinc-500 uppercase tracking-widest">
            Rebalancing Win Rate
          </span>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-sm font-mono font-black text-white">
              {stats.winRate.toFixed(1)}%
            </span>
            <span className="text-[8px] font-mono text-emerald-400">
              High Positive Ratio
            </span>
          </div>
          <span className="text-[7.5px] font-mono text-zinc-600 mt-1 uppercase">
            9 WINS / 3 CORRECTIONS
          </span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-900 flex flex-col justify-between">
          <span className="text-[8px] font-mono font-black text-zinc-500 uppercase tracking-widest">
            Average Win Day P&L
          </span>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-sm font-mono font-black text-[#deff9a]">
              {formatIDR(stats.avgGain)}
            </span>
          </div>
          <span className="text-[7.5px] font-mono text-zinc-600 mt-1 uppercase">
            PEAK: {formatIDR(stats.maxGain)}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-900 flex flex-col justify-between">
          <span className="text-[8px] font-mono font-black text-zinc-500 uppercase tracking-widest">
            Execution Efficiency
          </span>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-sm font-mono font-black text-sky-400">
              {stats.avgEfficiency.toFixed(1)}%
            </span>
            <span className="text-[8px] font-mono text-sky-500">
              OPTIMIZED
            </span>
          </div>
          <span className="text-[7.5px] font-mono text-zinc-600 mt-1 uppercase">
            SLIPPAGE TOLERANCE &lt;0.5%
          </span>
        </div>
      </div>

      {/* Main Recharts Container */}
      <div className="h-72 w-full bg-zinc-950/90 border border-zinc-900 p-4 rounded-2xl relative">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'composite' ? (
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 15, bottom: 5 }}
            >
              <defs>
                <linearGradient id="refLineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#deff9a" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#deff9a" stopOpacity="0" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1d1d21" />
              <XAxis 
                dataKey="date" 
                stroke="#52525b" 
                fontSize={8.5}
                tickLine={false}
                fontFamily="monospace"
                axisLine={false}
                tickFormatter={(tick) => tick.substring(5)}
              />
              <YAxis 
                stroke="#52525b" 
                fontSize={8.5}
                tickLine={false}
                fontFamily="monospace"
                axisLine={false}
                tickFormatter={(val) => `${val >= 0 ? '+' : ''}${val >= 1000000 ? (val / 1000000) + 'M' : (val / 1000) + 'k'}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="cumulative" 
                fill="url(#refLineGrad)" 
                stroke="#deff9a" 
                strokeWidth={2}
                name="Cumulative Equity"
              />
              <Bar 
                dataKey="pnl" 
                name="Daily Realized"
                onMouseEnter={(_, idx) => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {chartData.map((entry, index) => {
                  const isPositive = entry.pnl >= 0;
                  let fill = isPositive ? 'rgba(222, 255, 154, 0.55)' : 'rgba(244, 63, 94, 0.55)';
                  if (hoveredIndex === index) {
                    fill = isPositive ? 'rgba(222, 255, 154, 0.95)' : 'rgba(244, 63, 94, 0.95)';
                  }
                  return <Cell key={`cell-${index}`} fill={fill} />;
                })}
              </Bar>
              <ReferenceLine y={0} stroke="#27272a" strokeWidth={1} />
            </ComposedChart>
          ) : viewMode === 'daily' ? (
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 15, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1d1d21" />
              <XAxis 
                dataKey="date" 
                stroke="#52525b" 
                fontSize={8.5}
                tickLine={false}
                fontFamily="monospace"
                axisLine={false}
                tickFormatter={(tick) => tick.substring(5)}
              />
              <YAxis 
                stroke="#52525b" 
                fontSize={8.5}
                tickLine={false}
                fontFamily="monospace"
                axisLine={false}
                tickFormatter={(val) => `${val >= 0 ? '+' : ''}${val >= 1000000 ? (val / 1000000) + 'M' : (val / 1000) + 'k'}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="pnl" 
                radius={[4, 4, 0, 0]}
                onMouseEnter={(_, idx) => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {chartData.map((entry, index) => {
                  const isPositive = entry.pnl >= 0;
                  let fill = isPositive ? 'rgba(222, 255, 154, 0.65)' : 'rgba(244, 63, 94, 0.65)';
                  if (hoveredIndex === index) {
                    fill = isPositive ? '#deff9a' : '#f43f5e';
                  }
                  return <Cell key={`cell-${index}`} fill={fill} />;
                })}
              </Bar>
              <ReferenceLine y={0} stroke="#2a2a30" strokeWidth={1.5} />
            </BarChart>
          ) : viewMode === 'cumulative' ? (
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 15, bottom: 5 }}
            >
              <defs>
                <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1d1d21" />
              <XAxis 
                dataKey="date" 
                stroke="#52525b" 
                fontSize={8.5}
                tickLine={false}
                fontFamily="monospace"
                axisLine={false}
                tickFormatter={(tick) => tick.substring(5)}
              />
              <YAxis 
                stroke="#52525b" 
                fontSize={8.5}
                tickLine={false}
                fontFamily="monospace"
                axisLine={false}
                tickFormatter={(val) => `${val >= 0 ? '+' : ''}${val >= 1000000 ? (val / 1000000) + 'M' : (val / 1000) + 'k'}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="cumulative" 
                fill="url(#eqGrad)" 
                stroke="#38bdf8" 
                strokeWidth={2.5}
                activeDot={{ r: 6 }}
              />
              <ReferenceLine y={0} stroke="#27272a" strokeWidth={1} />
            </AreaChart>
          ) : (
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 15, bottom: 5 }}
            >
              <defs>
                <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1d1d21" />
              <XAxis 
                dataKey="date" 
                stroke="#52525b" 
                fontSize={8.5}
                tickLine={false}
                fontFamily="monospace"
                axisLine={false}
                tickFormatter={(tick) => tick.substring(5)}
              />
              <YAxis 
                stroke="#52525b" 
                fontSize={8.5}
                tickLine={false}
                fontFamily="monospace"
                axisLine={false}
                tickFormatter={(val) => `${val >= 0 ? '+' : ''}${val >= 1000000 ? (val / 1000000) + 'M' : (val / 1000) + 'k'}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="drawdown" 
                fill="url(#ddGrad)" 
                stroke="#f43f5e" 
                strokeWidth={2.5}
                activeDot={{ r: 6 }}
              />
              <ReferenceLine y={0} stroke="#27272a" strokeWidth={1} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Context footer help block */}
      <div className="flex items-start gap-2.5 p-3.5 bg-black/40 border border-zinc-900 rounded-xl">
        <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
        <p className="text-[9px] font-sans text-zinc-500 leading-normal">
          <strong>Rebalancing Session Realization note:</strong> Daily realized trades are recorded upon full settlement at PT Kustodian Sentral Efek Indonesia (KSEI). Live mock trades simulated in the active gateway during workspace sessions are automatically queued in the final index day element of the chart as <strong>Today's Active Session Realizing draft P&L</strong> to visualize rebalancing impacts immediately.
        </p>
      </div>
    </div>
  );
}
