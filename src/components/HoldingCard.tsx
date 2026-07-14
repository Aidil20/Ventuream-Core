import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Decimal } from 'decimal.js';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Bell } from 'lucide-react';
import Sparkline from './Sparkline';

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
  const [prevPrice, setPrevPrice] = useState<number>(asset.marketValue);
  const [pulseType, setPulseType] = useState<'up' | 'down' | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const unitPrice = asset.currentPrice || asset.marketPrice || 100;
  const [isAlertPanelOpen, setIsAlertPanelOpen] = useState(false);
  const [targetPriceInput, setTargetPriceInput] = useState(
    alertConfig?.targetPrice !== undefined ? alertConfig.targetPrice.toString() : unitPrice.toFixed(0)
  );
  const [alertType, setAlertType] = useState<'above' | 'below'>(alertConfig?.type || 'above');
  const [alertActive, setAlertActive] = useState(alertConfig?.active || false);

  // Sync state if alertConfig changes externally
  useEffect(() => {
    if (alertConfig) {
      setTargetPriceInput(alertConfig.targetPrice.toString());
      setAlertType(alertConfig.type);
      setAlertActive(alertConfig.active);
    } else {
      setTargetPriceInput(unitPrice.toFixed(0));
    }
  }, [alertConfig, unitPrice]);

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

  return (
    <div className="flex flex-col gap-2 w-full">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.35, delay: Math.min(idx * 0.04, 0.4), ease: 'easeOut' }}
        onClick={onClick}
        className={`p-4 rounded-2xl border flex justify-between items-center group cursor-pointer transition-all duration-500 relative overflow-visible ${getFlashBorderClass()} ${selected ? 'ring-1 ring-[#DFFF00]' : ''}`}
      >
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

        <div className="flex items-center gap-3 relative z-10 w-1/3 min-w-[120px]">
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
              {asset.stopLoss !== undefined && (
                <>
                  <span>•</span>
                  <span className="text-rose-400 bg-rose-500/10 px-1 py-0.2 rounded text-[9px] font-mono font-bold border border-rose-500/20">SL: Rp {asset.stopLoss.toLocaleString('id-ID')}</span>
                </>
              )}
            </p>
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

        <div className="flex items-center gap-4 relative z-10 text-right w-1/3 justify-end min-w-[150px]">
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
      </motion.div>

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
    </div>
  );
}
