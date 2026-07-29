import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Decimal } from 'decimal.js';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Bell, ChartCandlestick, Scale, Sliders, ShieldAlert, Target, Info, Check, RotateCcw } from 'lucide-react';
import Sparkline from './Sparkline';
import AdvanceChartModal from './AdvanceChartModal';

interface PortfolioAsset {
  ticker: string;
  lots: number;
  averagePrice: number;
  marketPrice: number;
  currentPrice: number;
  change: number;
  marketValue: number;
  unrealized: number;
  stopLoss?: number;
  takeProfit?: number;
  targetPrice?: number;
}

interface HoldingCardProps {
  asset: any;
  idx: number;
  onClick: () => void;
  showCompactLayout?: boolean;
  key?: string | number;
  selected?: boolean;
  onSelectToggle?: (e: React.MouseEvent) => void;
  alertConfig?: { targetPrice: number; type: 'above' | 'below'; active: boolean };
  onSaveAlert?: (ticker: string, targetPrice: number, type: 'above' | 'below', active: boolean) => void;
}

const getPerformanceArray = (ticker: string): number[] => {
  const clean = ticker.replace('.JK', '').toUpperCase();
  const staticPerformanceMap: Record<string, number[]> = {
    'DSSA': [65, 70, 72, 75, 78, 80, 85],
    'DEFI': [40, 45, 42, 48, 50, 48, 52],
    'LPKR': [30, 32, 28, 30, 29, 31, 30],
    'OTAS': [20, 25, 30, 35, 40, 45, 50],
    'ANDI': [55, 50, 48, 45, 42, 40, 38],
    'IPAC': [40, 38, 35, 32, 30, 28, 25],
    'KOTA': [35, 42, 40, 47, 45, 51, 48],
    'CTTH': [120, 122, 125, 130, 128, 132, 134],
    'LAND': [22, 25, 20, 28, 24, 31, 29],
    'PIPA': [18, 22, 19, 25, 23, 27, 26],
    'BACH': [38, 42, 40, 45, 48, 52, 55],
    'EMMI': [45, 46, 48, 47, 49, 50, 50],
    'JECX': [110, 115, 125, 130, 140, 150, 166],
    'PRDL': [112, 115, 110, 122, 130, 145, 162],
    'RANS': [170, 160, 140, 120, 90, 40, 0],
    'PJHB-W': [10, 15, 18, 22, 28, 32, 36]
  };
  
  if (staticPerformanceMap[clean]) {
    return staticPerformanceMap[clean];
  }
  
  // Deterministic performance based on tickers hash so it doesn't shuffle on every render
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const result = [];
  let currentVal = 50 + (Math.abs(hash) % 35);
  for (let i = 0; i < 8; i++) {
    const change = ((hash >> i) & 1) ? 4 : -4;
    currentVal += change + (i % 2 === 0 ? 1 : -1);
    result.push(Math.max(15, currentVal));
  }
  return result;
};

const getDeterministicVolume = (ticker: string, currentPrice: number): { shares: number; value: number } => {
  const clean = ticker.replace('.JK', '').toUpperCase();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Deterministic base volume (in lots)
  const baseLots = 2000 + (Math.abs(hash) % 48000);
  const shares = baseLots * 100;
  const value = shares * currentPrice;
  return { shares, value };
};

const formatVolume = (val: number): string => {
  if (val >= 1_000_000_000) {
    return `${(val / 1_000_000_000).toFixed(2)}B`;
  }
  if (val >= 1_000_000) {
    return `${(val / 1_000_000).toFixed(1)}M`;
  }
  if (val >= 1_000) {
    return `${(val / 1_000).toFixed(0)}K`;
  }
  return val.toString();
};

const getDeterministic24hRange = (ticker: string, currentPrice: number) => {
  const clean = ticker.replace('.JK', '').toUpperCase();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const variancePercent = 0.5 + ((Math.abs(hash) % 40) / 10); // 0.5% to 4.5% range
  const low = currentPrice * (1 - variancePercent / 100);
  const high = currentPrice * (1 + variancePercent / 100);
  const percentPos = ((currentPrice - low) / (high - low)) * 100;
  
  let trendLabel = 'Stable';
  if (percentPos > 70) trendLabel = 'Bullish';
  else if (percentPos < 30) trendLabel = 'Bearish';
  
  return { low, high, percentPos, trendLabel };
};

export default function HoldingCard({ 
  asset, 
  idx, 
  onClick, 
  showCompactLayout = false,
  selected = false,
  onSelectToggle,
  alertConfig,
  onSaveAlert
}: HoldingCardProps) {
  const prevPriceRef = useRef<number>(asset.marketValue || 0);
  const [pulseType, setPulseType] = useState<'up' | 'down' | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const unitPrice = asset.currentPrice || asset.marketPrice || 100;
  const [isAlertPanelOpen, setIsAlertPanelOpen] = useState(false);
  const [isAdvanceChartOpen, setIsAdvanceChartOpen] = useState(false);
  const [targetPriceInput, setTargetPriceInput] = useState(
    alertConfig?.targetPrice !== undefined ? alertConfig.targetPrice.toString() : unitPrice.toFixed(0)
  );
  const [alertType, setAlertType] = useState<'above' | 'below'>(alertConfig?.type || 'above');
  const [alertActive, setAlertActive] = useState(alertConfig?.active || false);

  // Sync state if alertConfig changes externally or when opening the alert panel
  useEffect(() => {
    if (alertConfig) {
      const targetStr = alertConfig.targetPrice.toString();
      setTargetPriceInput(prev => prev !== targetStr ? targetStr : prev);
      setAlertType(prev => prev !== alertConfig.type ? alertConfig.type : prev);
      setAlertActive(prev => prev !== alertConfig.active ? alertConfig.active : prev);
    } else if (isAlertPanelOpen) {
      const unitStr = unitPrice.toFixed(0);
      setTargetPriceInput(prev => prev !== unitStr ? unitStr : prev);
    }
  }, [alertConfig?.targetPrice, alertConfig?.type, alertConfig?.active, isAlertPanelOpen, unitPrice]);

  useEffect(() => {
    const prev = prevPriceRef.current;
    if (asset.marketValue !== prev) {
      if (asset.marketValue > prev) {
        setPulseType('up');
      } else if (asset.marketValue < prev) {
        setPulseType('down');
      }
      prevPriceRef.current = asset.marketValue || 0;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setPulseType(null);
      }, 1200);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [asset.marketValue]);

  const tickerCode = asset.ticker.split('.')[0];
  const avgPriceDecimal = new Decimal(asset.averagePrice || 0);
  const currentPriceDecimal = new Decimal(asset.currentPrice || asset.marketPrice || 0);
  const sinceBuyPercentage = avgPriceDecimal.isZero() 
    ? new Decimal(0) 
    : currentPriceDecimal.minus(avgPriceDecimal).div(avgPriceDecimal).times(100);

  const sinceBuyVal = sinceBuyPercentage.toNumber();
  const isGain = sinceBuyVal >= 0;

  const dailyChangeVal = typeof asset.dailyChange === 'number' ? asset.dailyChange : 0;
  const isDailyGain = dailyChangeVal >= 0;

  const vol = getDeterministicVolume(asset.ticker, unitPrice);
  const range = getDeterministic24hRange(asset.ticker, unitPrice);

  // Render sub-elements with dynamic color states based on recent flash triggers
  const getFlashBorderClass = () => {
    if (pulseType === 'up') return 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-slate-900/60';
    if (pulseType === 'down') return 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-slate-900/60';
    return 'border-slate-800/50 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-800/20';
  };

  const getPriceColorClass = () => {
    if (pulseType === 'up') return 'text-emerald-400 font-extrabold';
    if (pulseType === 'down') return 'text-red-400 font-extrabold';
    return 'text-slate-200';
  };

  const rawPerf = asset.performance || getPerformanceArray(asset.ticker);
  const lastRawVal = rawPerf[rawPerf.length - 1] || 1;

  // Scale performance array to reflect exact stock prices
  const scaledPerformancePrices = rawPerf.map((val: number) => {
    return (val / lastRawVal) * unitPrice;
  });

  // Calculate 5-day average price from scaledPerformancePrices
  const lastFivePrices = scaledPerformancePrices.slice(-5);
  const fiveDayAvg = lastFivePrices.length > 0 
    ? lastFivePrices.reduce((sum: number, p: number) => sum + p, 0) / lastFivePrices.length
    : unitPrice;
  const isTrendingUp = unitPrice >= fiveDayAvg;
  const momentumPercent = fiveDayAvg > 0 ? ((unitPrice - fiveDayAvg) / fiveDayAvg) * 100 : 0;

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSaveAlert) {
      const parsedPrice = parseFloat(targetPriceInput);
      if (!isNaN(parsedPrice)) {
        onSaveAlert(asset.ticker, parsedPrice, alertType, alertActive);
        setIsAlertPanelOpen(false);
      }
    }
  };

  // Risk / Reward Target States & Calculations
  const [isRRPanelOpen, setIsRRPanelOpen] = useState(false);
  const [customSL, setCustomSL] = useState<number | null>(asset.stopLoss ?? null);
  const [customTP, setCustomTP] = useState<number | null>(asset.takeProfit ?? asset.targetPrice ?? null);

  const slPrice = customSL !== null 
    ? customSL 
    : (asset.stopLoss !== undefined ? asset.stopLoss : Math.round(unitPrice * 0.90));
    
  const tpPrice = customTP !== null 
    ? customTP 
    : (asset.takeProfit !== undefined 
        ? asset.takeProfit 
        : (asset.targetPrice !== undefined ? asset.targetPrice : Math.round(unitPrice * 1.20)));

  const downsideRiskPerShare = Math.max(unitPrice - slPrice, 0.1);
  const upsideRewardPerShare = Math.max(tpPrice - unitPrice, 0.1);

  const riskPct = unitPrice > 0 ? ((unitPrice - slPrice) / unitPrice) * 100 : 0;
  const rewardPct = unitPrice > 0 ? ((tpPrice - unitPrice) / unitPrice) * 100 : 0;

  const rrRatio = downsideRiskPerShare > 0 ? upsideRewardPerShare / downsideRiskPerShare : 0;

  const rangeSpan = Math.max(tpPrice - slPrice, 1);
  const currentPosPct = Math.min(100, Math.max(0, ((unitPrice - slPrice) / rangeSpan) * 100));

  const totalRiskIDR = downsideRiskPerShare * (asset.lots || 1) * 100;
  const totalRewardIDR = upsideRewardPerShare * (asset.lots || 1) * 100;

  const [slInput, setSlInput] = useState(slPrice.toString());
  const [tpInput, setTpInput] = useState(tpPrice.toString());

  useEffect(() => {
    if (isRRPanelOpen) {
      const slStr = slPrice.toString();
      const tpStr = tpPrice.toString();
      setSlInput(prev => (prev !== slStr ? slStr : prev));
      setTpInput(prev => (prev !== tpStr ? tpStr : prev));
    }
  }, [isRRPanelOpen, slPrice, tpPrice]);

  const handleApplyRRTargets = (e: React.MouseEvent) => {
    e.stopPropagation();
    const parsedSL = parseFloat(slInput);
    const parsedTP = parseFloat(tpInput);
    if (!isNaN(parsedSL) && parsedSL > 0) setCustomSL(parsedSL);
    if (!isNaN(parsedTP) && parsedTP > 0) setCustomTP(parsedTP);
    setIsRRPanelOpen(false);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.35, delay: Math.min(idx * 0.04, 0.4), ease: 'easeOut' }}
        onClick={onClick}
        className={`p-4 rounded-2xl border flex flex-col gap-3 group cursor-pointer transition-all duration-500 relative overflow-visible ${getFlashBorderClass()} ${selected ? 'ring-1 ring-[#DFFF00]' : ''}`}
      >
        {/* Main Card Header Row */}
        <div className="flex justify-between items-center w-full">
          {/* Checkbox Element */}
          {onSelectToggle && (
            <div 
              className="mr-3 flex items-center justify-center relative z-30"
              onClick={(e) => {
                e.stopPropagation();
                onSelectToggle(e);
              }}
            >
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${
                selected 
                  ? 'bg-[#DFFF00] border-[#DFFF00] text-slate-950 shadow-[0_0_8px_rgba(223,255,0,0.3)]' 
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'
              }`}>
                {selected && (
                  <svg className="w-3.5 h-3.5 stroke-current stroke-[3px]" viewBox="0 0 24 24" fill="none">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </div>
          )}

          {/* Background feedback light waves */}
          <AnimatePresence>
            {pulseType && (
              <motion.div
                initial={{ opacity: 0.25, scale: 0.95 }}
                animate={{ opacity: 0, scale: 1.1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`absolute inset-0 pointer-events-none rounded-2xl ${
                  pulseType === 'up' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                }`}
              />
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3 relative z-10 w-[40%] min-w-[160px]">
            <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 border transition-all duration-300 group-hover:bg-slate-750 ${
              pulseType === 'up' ? 'border-emerald-500/40 text-emerald-400' :
              pulseType === 'down' ? 'border-red-500/40 text-red-400' :
              'border-slate-700/50 group-hover:border-[#deff9a]/30'
            } uppercase flex-shrink-0`}>
              {tickerCode}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm text-slate-100 uppercase tracking-wide group-hover:text-white transition-colors truncate">
                  {tickerCode}
                </span>
                <AnimatePresence mode="popLayout">
                  {pulseType && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.4, y: 3 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, y: -3 }}
                      className={`text-[8px] font-bold px-1 py-0.2 rounded font-mono uppercase tracking-widest flex-shrink-0 ${
                        pulseType === 'up' ? 'bg-emerald-950/40 text-emerald-400' : 'bg-red-950/40 text-red-400'
                      }`}
                    >
                      {pulseType === 'up' ? '▲ LIVE' : '▼ LIVE'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 flex-wrap mt-0.5">
                <span>{asset.lots} Lots</span>
                <span>•</span>
                <span>{typeof asset.averagePrice === 'number' ? new Decimal(asset.averagePrice).toNumber().toFixed(2) : '0.00'} Avg</span>
                {asset.targetWeight !== undefined && (
                  <>
                    <span>•</span>
                    <span className="text-[#DFFF00] bg-[#DFFF00]/10 px-1 py-0.2 rounded text-[9px] font-mono font-bold border border-[#DFFF00]/20">Tgt: {asset.targetWeight}%</span>
                  </>
                )}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5 text-[9px] font-mono flex-wrap">
                <span className="bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800/60 font-medium">
                  Vol: {formatVolume(vol.shares)}
                </span>
                <span className={`text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-wider border transition-all duration-300 ${
                  range.percentPos > 70 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]' 
                    : range.percentPos < 30 
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.1)]' 
                      : 'bg-slate-950 text-slate-500 border-slate-800/60'
                }`}>
                  {range.trendLabel}
                </span>
                <span 
                  id={`holding-${tickerCode}-momentum-badge`}
                  className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border transition-all duration-300 flex items-center gap-1 ${
                    isTrendingUp 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]' 
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.1)]'
                  }`}
                  title={`Current price is ${momentumPercent >= 0 ? 'above' : 'below'} the 5-day average (Rp ${fiveDayAvg.toLocaleString('id-ID', { maximumFractionDigits: 1 })}) by ${Math.abs(momentumPercent).toFixed(2)}%`}
                >
                  {isTrendingUp ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>5D: {momentumPercent >= 0 ? '+' : ''}{momentumPercent.toFixed(1)}%</span>
                </span>
              </div>
            </div>
          </div>

          {/* Sparkline Visualizer Segment with Stop Propagation */}
          <div 
            className="flex-1 px-3 max-w-[170px] h-9 relative z-20 overflow-visible"
            onClick={(e) => e.stopPropagation()}
          >
            <Sparkline 
              data={scaledPerformancePrices} 
              color={isDailyGain ? '#10b981' : '#f43f5e'} 
              height={32} 
            />
          </div>

          <div className="flex items-center gap-2 relative z-10 text-right w-1/3 justify-end min-w-[150px]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsAdvanceChartOpen(true);
              }}
              className="p-1.5 rounded-lg border bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500 hover:text-black transition-all shrink-0 flex items-center gap-1"
              title={`Advance Chart for ${tickerCode}`}
            >
              <ChartCandlestick className="w-3 h-3" />
              <span className="hidden md:inline text-[9px] font-black uppercase tracking-wider">Chart</span>
            </button>

            {onSaveAlert && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAlertPanelOpen(!isAlertPanelOpen);
                }}
                className={`p-1.5 rounded-lg border transition-all shrink-0 ${
                  alertConfig?.active 
                    ? 'bg-[#DFFF00]/10 border-[#DFFF00]/30 text-[#DFFF00] shadow-[0_0_10px_rgba(223,255,0,0.15)] animate-pulse' 
                    : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                }`}
                title="Manage Price Alerts"
              >
                <Bell className="w-3.5 h-3.5" />
              </button>
            )}

            <div>
              <motion.p 
                animate={pulseType ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.4 }}
                className={`text-xs font-mono font-bold transition-colors duration-300 ${getPriceColorClass()}`}
              >
                Rp {typeof asset.marketValue === 'number' ? asset.marketValue.toLocaleString('id-ID') : (asset.marketValue || 'N/A')}
              </motion.p>
              <div className="flex flex-col items-end mt-1.5 space-y-1">
                <motion.div
                  animate={pulseType === 'up' ? {
                    backgroundColor: ['rgba(16, 185, 129, 0)', 'rgba(16, 185, 129, 0.18)', 'rgba(30, 41, 59, 0.35)', 'rgba(16, 185, 129, 0)'],
                    scale: [1, 1.05, 1],
                  } : {}}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-all duration-500 ${
                    pulseType === 'up' 
                      ? 'text-emerald-400 border border-emerald-500/20' 
                      : 'border border-transparent'
                  }`}
                >
                  {isGain ? (
                    <ArrowUpRight className="w-2.5 h-2.5 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="w-2.5 h-2.5 text-red-400" />
                  )}
                  <span className={`text-[9px] font-black font-mono leading-none tracking-tight ${isGain ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isGain ? '+' : ''}{sinceBuyVal.toFixed(2)}% ({isGain ? '+' : ''}Rp {Math.round(asset.unrealized !== undefined ? asset.unrealized : (typeof asset.marketValue === 'number' ? (asset.marketValue - (asset.averagePrice * asset.lots * 100)) : 0)).toLocaleString('id-ID')})
                  </span>
                  <span className="text-[7px] font-mono tracking-widest text-[#DFFF00] uppercase leading-none bg-[#DFFF00]/10 px-1 py-0.5 rounded ml-1 scale-90 select-none">Buy</span>
                </motion.div>
                <div className="flex items-center gap-1 px-1.5">
                  <span className={`text-[9px] font-black font-mono leading-none tracking-tight ${isDailyGain ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isDailyGain ? '+' : ''}{dailyChangeVal.toFixed(2)}%
                  </span>
                  <span className="text-[7px] font-mono tracking-widest text-slate-400 uppercase leading-none bg-slate-950 px-1 py-0.5 rounded ml-1 scale-90 select-none">Day</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Risk / Reward Indicator Bar */}
        <div 
          className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[9px] font-mono relative z-20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left: RR Ratio Badge & Config Toggle */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[8px]">
              <Scale className="w-3 h-3 text-[#DFFF00]" />
              <span>Risk / Reward:</span>
            </div>
            <span 
              className={`px-2 py-0.5 rounded-md font-extrabold text-[9px] border shadow-sm flex items-center gap-1 ${
                rrRatio >= 2.0 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
                  : rrRatio >= 1.0
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.15)]'
              }`}
              title={`Risk:Reward Ratio = 1 : ${rrRatio.toFixed(2)} (${rrRatio >= 2 ? 'Optimal Risk/Reward' : rrRatio >= 1 ? 'Moderate Risk/Reward' : 'High Downside Risk'})`}
            >
              <span>1 : {rrRatio.toFixed(2)}</span>
              <span className="text-[7px] opacity-80 uppercase">({rrRatio.toFixed(1)}x)</span>
            </span>
            <button
              type="button"
              onClick={() => setIsRRPanelOpen(!isRRPanelOpen)}
              className={`px-2 py-0.5 rounded border text-[8px] uppercase tracking-wider font-bold transition-all flex items-center gap-1 ${
                isRRPanelOpen
                  ? 'bg-[#DFFF00] text-slate-950 border-[#DFFF00]'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
              }`}
              title="Adjust Stop Loss & Take Profit Targets"
            >
              <Sliders className="w-2.5 h-2.5" />
              <span>Targets</span>
            </button>
          </div>

          {/* Right: Visual Track Range Bar */}
          <div className="flex-1 max-w-full sm:max-w-xs md:max-w-md flex items-center gap-2">
            {/* Stop Loss Tag */}
            <span className="text-rose-400 font-bold shrink-0 text-[8px] whitespace-nowrap bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-500/20" title={`Stop Loss Level: Rp ${slPrice.toLocaleString('id-ID')} (-${riskPct.toFixed(1)}%)`}>
              SL Rp {slPrice.toLocaleString('id-ID')}
            </span>

            {/* Range Bar Track */}
            <div className="relative flex-1 h-2 bg-slate-950 rounded-full border border-slate-800 overflow-hidden flex items-center" title={`Position: ${currentPosPct.toFixed(0)}% from SL to TP`}>
              {/* Risk Zone Fill */}
              <div 
                className="h-full bg-gradient-to-r from-rose-600/70 to-amber-500/50"
                style={{ width: `${currentPosPct}%` }}
              />
              {/* Reward Zone Fill */}
              <div 
                className="h-full bg-gradient-to-r from-emerald-600/30 to-emerald-400/70 flex-1"
              />
              {/* Current Price Marker Pin */}
              <div 
                className="absolute top-0 bottom-0 w-1.5 bg-[#DFFF00] shadow-[0_0_8px_#DFFF00] -ml-0.75 z-10 transition-all duration-300"
                style={{ left: `${currentPosPct}%` }}
              />
            </div>

            {/* Take Profit Tag */}
            <span className="text-emerald-400 font-bold shrink-0 text-[8px] whitespace-nowrap bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20" title={`Take Profit Target: Rp ${tpPrice.toLocaleString('id-ID')} (+${rewardPct.toFixed(1)}%)`}>
              TP Rp {tpPrice.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Expandable Risk/Reward Target Adjuster Panel */}
      <AnimatePresence>
        {isRRPanelOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: -6 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
            exit={{ opacity: 0, height: 0, marginTop: -6 }}
            className="overflow-hidden bg-slate-950/95 border border-slate-800/90 rounded-2xl p-4 flex flex-col gap-3 relative z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#DFFF00]" />
                <h5 className="text-xs font-black text-white font-mono uppercase tracking-wide">
                  Risk / Reward Target Configurator — {tickerCode}
                </h5>
              </div>
              <span className="text-[9px] font-mono text-slate-400">
                Current Price: <strong className="text-[#DFFF00]">Rp {unitPrice.toLocaleString('id-ID')}</strong>
              </span>
            </div>

            {/* Inputs & Quick Presets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stop Loss Configurator */}
              <div className="bg-slate-900/80 p-3 rounded-xl border border-rose-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-rose-400 uppercase tracking-wider flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Stop-Loss Level (SL)
                  </span>
                  <span className="text-[9px] font-mono text-rose-300 font-bold">
                    -{riskPct.toFixed(1)}% Downside
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500">Rp</span>
                  <input
                    type="number"
                    value={slInput}
                    onChange={(e) => setSlInput(e.target.value)}
                    className="bg-transparent text-xs font-mono font-bold text-white focus:outline-none w-full"
                    placeholder="Stop Loss Price"
                  />
                </div>

                {/* SL Presets */}
                <div className="flex items-center gap-1 text-[8px] font-mono">
                  <span className="text-slate-500 font-bold uppercase">Presets:</span>
                  {[5, 8, 10, 15].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setSlInput(Math.round(unitPrice * (1 - pct / 100)).toString())}
                      className="px-1.5 py-0.5 bg-slate-950 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded border border-slate-800 hover:border-rose-500/30 font-bold transition-colors"
                    >
                      -{pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Take Profit Configurator */}
              <div className="bg-slate-900/80 p-3 rounded-xl border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <Target className="w-3 h-3" /> Take-Profit Target (TP)
                  </span>
                  <span className="text-[9px] font-mono text-emerald-300 font-bold">
                    +{rewardPct.toFixed(1)}% Upside
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500">Rp</span>
                  <input
                    type="number"
                    value={tpInput}
                    onChange={(e) => setTpInput(e.target.value)}
                    className="bg-transparent text-xs font-mono font-bold text-white focus:outline-none w-full"
                    placeholder="Take Profit Price"
                  />
                </div>

                {/* TP Presets */}
                <div className="flex items-center gap-1 text-[8px] font-mono">
                  <span className="text-slate-500 font-bold uppercase">Presets:</span>
                  {[10, 15, 20, 30].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setTpInput(Math.round(unitPrice * (1 + pct / 100)).toString())}
                      className="px-1.5 py-0.5 bg-slate-950 hover:bg-emerald-950/60 text-slate-400 hover:text-emerald-400 rounded border border-slate-800 hover:border-emerald-500/30 font-bold transition-colors"
                    >
                      +{pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Monetary Metrics Summary & Action */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left font-mono">
                <div>
                  <p className="text-[8px] text-slate-500 font-bold uppercase">Max Risk (IDR)</p>
                  <p className="text-xs font-bold text-rose-400">-Rp {Math.round(totalRiskIDR).toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-[8px] text-slate-500 font-bold uppercase">Max Reward (IDR)</p>
                  <p className="text-xs font-bold text-emerald-400">+Rp {Math.round(totalRewardIDR).toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-[8px] text-slate-500 font-bold uppercase">Resulting R:R</p>
                  <p className={`text-xs font-extrabold ${rrRatio >= 2 ? 'text-emerald-400' : rrRatio >= 1 ? 'text-amber-400' : 'text-rose-400'}`}>
                    1 : {rrRatio.toFixed(2)} ({rrRatio.toFixed(1)}x)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleApplyRRTargets}
                  className="px-3 py-1.5 bg-[#DFFF00] text-slate-950 text-[9px] font-black uppercase rounded-lg hover:opacity-90 transition-all flex items-center gap-1 shadow-sm"
                >
                  <Check className="w-3 h-3" />
                  Apply Targets
                </button>
                <button
                  type="button"
                  onClick={() => setIsRRPanelOpen(false)}
                  className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 text-slate-400 text-[9px] font-black uppercase rounded-lg hover:text-white transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expandable Alert Config Panel */}
      <AnimatePresence>
        {isAlertPanelOpen && onSaveAlert && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: -8 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
            exit={{ opacity: 0, height: 0, marginTop: -8 }}
            className="overflow-hidden bg-slate-950/95 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-20"
          >
            <div className="flex flex-col gap-1 flex-1 text-left">
              <span className="text-[8px] font-black font-mono text-[#DFFF00] uppercase tracking-[0.15em] block">Price Alert Configurator</span>
              <p className="text-[10px] text-slate-400 font-medium">
                Receive dynamic notifications when <span className="text-white font-bold">{tickerCode}</span> crosses your set threshold.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Condition type selector */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setAlertType('above'); }}
                  className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-md transition-all ${
                    alertType === 'above' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]' 
                      : 'text-slate-500 hover:text-slate-300 border border-transparent'
                  }`}
                >
                  Above ▲
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setAlertType('below'); }}
                  className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-md transition-all ${
                    alertType === 'below' 
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.1)]' 
                      : 'text-slate-500 hover:text-slate-300 border border-transparent'
                  }`}
                >
                  Below ▼
                </button>
              </div>

              {/* Price input */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 max-w-[130px]">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Rp</span>
                <input
                  type="number"
                  value={targetPriceInput}
                  onChange={(e) => setTargetPriceInput(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent text-[10px] font-mono font-bold text-white focus:outline-none w-full"
                  placeholder="Price"
                />
              </div>

              {/* Alert toggle switch */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setAlertActive(!alertActive); }}
                className={`px-2.5 py-1.5 text-[9px] font-black uppercase rounded-lg border transition-all ${
                  alertActive 
                    ? 'bg-[#DFFF00]/15 border-[#DFFF00]/30 text-[#DFFF00] shadow-[0_0_10px_rgba(223,255,0,0.1)]' 
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                {alertActive ? '● ALERT ON' : '○ ALERT OFF'}
              </button>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3 py-1.5 bg-[#DFFF00] text-slate-950 text-[9px] font-black uppercase rounded-lg hover:opacity-90 transition-all shadow-[0_0_10px_rgba(223,255,0,0.15)]"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsAlertPanelOpen(false); }}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 text-[9px] font-black uppercase rounded-lg hover:text-white hover:border-slate-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AdvanceChartModal
        symbol={`IDX:${tickerCode.replace('.JK', '').toUpperCase()}`}
        isOpen={isAdvanceChartOpen}
        onClose={() => setIsAdvanceChartOpen(false)}
      />
    </div>
  );
}

export { default as GroupedHoldingCards, generateHoldingsPDF } from './GroupedHoldingCards';
