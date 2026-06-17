import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Decimal } from 'decimal.js';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface PortfolioAsset {
  ticker: string;
  lots: number;
  averagePrice: number;
  marketPrice: number;
  currentPrice: number;
  change: number;
  marketValue: number;
  unrealized: number;
}

interface HoldingCardProps {
  asset: any;
  idx: number;
  onClick: () => void;
  showCompactLayout?: boolean;
  key?: string | number;
}

export default function HoldingCard({ asset, idx, onClick, showCompactLayout = false }: HoldingCardProps) {
  const [prevPrice, setPrevPrice] = useState<number>(asset.marketValue);
  const [pulseType, setPulseType] = useState<'up' | 'down' | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (asset.marketValue !== prevPrice) {
      if (asset.marketValue > prevPrice) {
        setPulseType('up');
      } else {
        setPulseType('down');
      }
      setPrevPrice(asset.marketValue);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setPulseType(null);
      }, 1200);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [asset.marketValue, prevPrice]);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, delay: Math.min(idx * 0.04, 0.4), ease: 'easeOut' }}
      onClick={onClick}
      className={`p-4 rounded-2xl border flex justify-between items-center group cursor-pointer transition-all duration-500 relative overflow-hidden ${getFlashBorderClass()}`}
    >
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

      <div className="flex items-center gap-3 relative z-10">
        <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 border transition-all duration-300 group-hover:bg-slate-750 ${
          pulseType === 'up' ? 'border-emerald-500/40 text-emerald-400' :
          pulseType === 'down' ? 'border-red-500/40 text-red-400' :
          'border-slate-700/50 group-hover:border-[#deff9a]/30'
        } uppercase`}>
          {tickerCode}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-sm text-slate-100 uppercase tracking-wide group-hover:text-white transition-colors">
              {tickerCode}
            </span>
            <AnimatePresence mode="popLayout">
              {pulseType && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.4, y: 3 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  className={`text-[8px] font-bold px-1 py-0.2 rounded font-mono uppercase tracking-widest ${
                    pulseType === 'up' ? 'bg-emerald-950/40 text-emerald-400' : 'bg-red-950/40 text-red-400'
                  }`}
                >
                  {pulseType === 'up' ? '▲ LIVE' : '▼ LIVE'}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">
            {asset.lots} Lots • {typeof asset.averagePrice === 'number' ? new Decimal(asset.averagePrice).toNumber().toFixed(2) : '0.00'} Avg
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 relative z-10 text-right">
        <div>
          <motion.p 
            animate={pulseType ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.4 }}
            className={`text-xs font-mono font-bold transition-colors duration-300 ${getPriceColorClass()}`}
          >
            Rp {typeof asset.marketValue === 'number' ? asset.marketValue.toLocaleString('id-ID') : (asset.marketValue || 'N/A')}
          </motion.p>
          <div className="flex flex-col items-end mt-1.5 space-y-1">
            <div className="flex items-center gap-1">
              {isGain ? (
                <ArrowUpRight className="w-2.5 h-2.5 text-emerald-400" />
              ) : (
                <ArrowDownRight className="w-2.5 h-2.5 text-red-400" />
              )}
              <span className={`text-[9px] font-black font-mono leading-none tracking-tight ${isGain ? 'text-emerald-400' : 'text-red-400'}`}>
                {isGain ? '+' : ''}{sinceBuyVal.toFixed(2)}%
              </span>
              <span className="text-[7px] font-mono tracking-widest text-[#DFFF00] uppercase leading-none bg-[#DFFF00]/10 px-1 py-0.5 rounded ml-1 scale-90 select-none">Buy</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-[9px] font-black font-mono leading-none tracking-tight ${isDailyGain ? 'text-emerald-400' : 'text-red-400'}`}>
                {isDailyGain ? '+' : ''}{dailyChangeVal.toFixed(2)}%
              </span>
              <span className="text-[7px] font-mono tracking-widest text-slate-400 uppercase leading-none bg-slate-950 px-1 py-0.5 rounded ml-1 scale-90 select-none">Day</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
