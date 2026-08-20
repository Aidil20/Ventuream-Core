import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Sparkles, 
  Copy, 
  Check, 
  Info, 
  Sliders, 
  Activity, 
  Target, 
  Maximize2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Code2,
  BarChart2,
  LineChart,
  RefreshCw
} from 'lucide-react';
import { 
  analyzeAssetSwingSupportResistance, 
  SwingAnalysisResult, 
  SRBand, 
  SwingPoint 
} from '../lib/swingDetection';
import { formatStockPrice } from '../lib/stockUtils';
import VamNativeSRChart from './VamNativeSRChart';

interface ChartSupportResistanceOverlayProps {
  symbol: string;
  className?: string;
  isCompact?: boolean;
  overrideCurrentPrice?: number;
}

export const ChartSupportResistanceOverlay: React.FC<ChartSupportResistanceOverlayProps> = ({
  symbol,
  className = '',
  isCompact = false,
  overrideCurrentPrice
}) => {
  const [lookbackBars, setLookbackBars] = useState<number>(60);
  const [showNativeVisualChart, setShowNativeVisualChart] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'R_LEVELS' | 'S_LEVELS' | 'MAJOR_ONLY' | 'FIBONACCI_ONLY' | 'NEAREST_ONLY'>('ALL');
  const [selectedBand, setSelectedBand] = useState<SRBand | null>(null);
  const [isHudExpanded, setIsHudExpanded] = useState<boolean>(false);
  const [copiedPine, setCopiedPine] = useState<boolean>(false);
  const [copiedPlan, setCopiedPlan] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [livePrice, setLivePrice] = useState<number | undefined>(overrideCurrentPrice);

  // Synchronize when prop changes
  useEffect(() => {
    setLivePrice(overrideCurrentPrice);
  }, [overrideCurrentPrice]);

  // Listen to global real-time market updates to keep S/R & Fibonacci synchronized dynamically
  useEffect(() => {
    const handleMarketUpdate = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      const cleanTarget = symbol.replace(/^(IDX|NASDAQ|NYSE|SGX|BINANCE|BITSTAMP):/, '').toUpperCase().trim();
      const updatedSym = (detail.symbol || '').replace(/^(IDX|NASDAQ|NYSE|SGX|BINANCE|BITSTAMP):/, '').toUpperCase().trim();
      
      if (cleanTarget === updatedSym && typeof detail.price === 'number' && detail.price > 0) {
        setLivePrice(detail.price);
      }
    };

    window.addEventListener('vam-market-update', handleMarketUpdate);
    return () => window.removeEventListener('vam-market-update', handleMarketUpdate);
  }, [symbol]);

  const effectivePrice = livePrice || overrideCurrentPrice;

  // Compute Swing High/Low Analysis synchronized with active price
  const analysis: SwingAnalysisResult = useMemo(() => {
    return analyzeAssetSwingSupportResistance(symbol, lookbackBars, effectivePrice);
  }, [symbol, lookbackBars, effectivePrice]);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 400);
  };

  const handleCopyPineScript = () => {
    navigator.clipboard.writeText(analysis.generatedPineScript);
    setCopiedPine(true);
    setTimeout(() => setCopiedPine(false), 2500);
  };

  const handleCopyPlan = () => {
    const text = `[VAM S/R SWING PLAN] ${analysis.cleanTicker}
• Harga Terkini: ${formatStockPrice(analysis.currentPrice, symbol)}
• Live Pivot Point: ${formatStockPrice(analysis.pivotPoint, symbol)}
• Major Swing High (Ceiling): ${formatStockPrice(analysis.rangeHigh, symbol)} (${analysis.majorSwingHigh.date})
• Major Swing Low (Base Floor): ${formatStockPrice(analysis.rangeLow, symbol)} (${analysis.majorSwingLow.date})
• Resistensi Terdekat (R1): ${analysis.nearestResistance ? `${formatStockPrice(analysis.nearestResistance.corePrice, symbol)} (+${analysis.nearestResistance.distancePct}%)` : '-'}
• Support Terdekat (S1): ${analysis.nearestSupport ? `${formatStockPrice(analysis.nearestSupport.corePrice, symbol)} (${analysis.nearestSupport.distancePct}%)` : '-'}
• Fib 0.618 Golden Pocket: ${formatStockPrice(analysis.fibonacciBands.find(b => b.tier === 'GOLDEN_POCKET')?.corePrice || 0, symbol)}
• Posisi Range: ${analysis.pricePositionInRange}% dari Floor ke Ceiling
• Tactical Bias: ${analysis.tacticalSummary}`;
    
    navigator.clipboard.writeText(text);
    setCopiedPlan(true);
    setTimeout(() => setCopiedPlan(false), 2500);
  };

  return (
    <div className={`w-full flex flex-col ${className}`} id={`sr-overlay-container-${analysis.cleanTicker}`}>
      {/* 1. Proximity Alert Banner if price approaches key Support or Resistance */}
      {analysis.proximityAlert?.active && (
        <div className="mx-2 my-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-950/80 via-zinc-950 to-zinc-900 border border-amber-500/40 flex items-center justify-between text-xs shadow-md animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-mono text-[10px] sm:text-xs text-amber-200">
              <strong>S/R PROXIMITY ALERT:</strong> {analysis.proximityAlert.message}
            </span>
          </div>
          <span className="hidden sm:inline-block text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 uppercase">
            Uji Batas Swing
          </span>
        </div>
      )}

      {/* 2. Top Precision Control HUD Bar */}
      <div className="px-3 py-1.5 bg-zinc-950/95 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Ticker, Pivot, Nearest R1 & S1 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Mode Switcher: Calibrated Visual Chart vs Clean TV HUD */}
          <button
            onClick={() => setShowNativeVisualChart(!showNativeVisualChart)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-mono font-black uppercase transition-all cursor-pointer border ${
              showNativeVisualChart 
                ? 'bg-[#deff9a] text-black border-[#deff9a] shadow-sm'
                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white hover:border-zinc-700'
            }`}
            title="Beralih antara Grafik Visual S/R Terkalibrasi dan TradingView Live"
          >
            {showNativeVisualChart ? <BarChart2 className="w-3 h-3 text-black" /> : <LineChart className="w-3 h-3 text-[#deff9a]" />}
            <span>{showNativeVisualChart ? 'GRAFIK VISUAL S/R: ON' : 'GRAFIK VISUAL S/R: OFF'}</span>
          </button>

          {/* Pivot Metric Badge */}
          <div className="flex items-center gap-1 bg-cyan-950/60 border border-cyan-500/40 px-2 py-1 rounded-lg text-[9px] font-mono">
            <span className="text-cyan-400 font-bold uppercase">PIVOT P:</span>
            <span className="text-white font-black">{formatStockPrice(analysis.pivotPoint, symbol)}</span>
          </div>

          {/* Quick Stats: Nearest R & Nearest S */}
          <div className="hidden sm:flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-lg border border-zinc-800/90 text-[9px] font-mono">
            <span className="text-zinc-500 font-bold uppercase">R1 Ceiling:</span>
            {analysis.nearestResistance ? (
              <span className="text-rose-400 font-bold">
                {formatStockPrice(analysis.nearestResistance.corePrice, symbol)} (+{analysis.nearestResistance.distancePct}%)
              </span>
            ) : (
              <span className="text-zinc-500">-</span>
            )}
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-500 font-bold uppercase">S1 Floor:</span>
            {analysis.nearestSupport ? (
              <span className="text-emerald-400 font-bold">
                {formatStockPrice(analysis.nearestSupport.corePrice, symbol)} ({analysis.nearestSupport.distancePct}%)
              </span>
            ) : (
              <span className="text-zinc-500">-</span>
            )}
          </div>

          {/* Range Position Indicator Badge */}
          <div className="hidden md:flex items-center gap-1 bg-zinc-900/90 px-2 py-1 rounded-lg border border-zinc-800 text-[8.5px] font-mono text-zinc-300">
            <Activity className="w-2.5 h-2.5 text-sky-400" />
            <span>Range:</span>
            <span className="font-bold text-[#deff9a]">{analysis.pricePositionInRange}%</span>
            <div className="w-10 h-1.5 bg-zinc-800 rounded-full overflow-hidden ml-1">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500" 
                style={{ width: `${analysis.pricePositionInRange}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Quick Filter, Pine Script Copy & Matrix Toggle */}
        <div className="flex items-center gap-1.5">
          {/* Quick S/R & Fib Filter Selector */}
          <div className="hidden lg:flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[8px] font-mono font-bold">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-1.5 py-0.5 rounded transition-colors whitespace-nowrap ${activeFilter === 'ALL' ? 'bg-zinc-800 text-[#deff9a]' : 'text-zinc-400 hover:text-white'}`}
            >
              Semua S/R
            </button>
            <button
              onClick={() => setActiveFilter('R_LEVELS')}
              className={`px-1.5 py-0.5 rounded transition-colors whitespace-nowrap ${activeFilter === 'R_LEVELS' ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40' : 'text-zinc-400 hover:text-rose-300'}`}
            >
              R1 - R4
            </button>
            <button
              onClick={() => setActiveFilter('S_LEVELS')}
              className={`px-1.5 py-0.5 rounded transition-colors whitespace-nowrap ${activeFilter === 'S_LEVELS' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'text-zinc-400 hover:text-emerald-300'}`}
            >
              S1 - S4
            </button>
            <button
              onClick={() => setActiveFilter('FIBONACCI_ONLY')}
              className={`px-1.5 py-0.5 rounded transition-colors whitespace-nowrap ${activeFilter === 'FIBONACCI_ONLY' ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40' : 'text-zinc-400 hover:text-amber-300'}`}
            >
              Fib (0.618)
            </button>
          </div>

          {/* Manual Sync / Refresh Button */}
          <button
            onClick={handleManualSync}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[8.5px] font-mono font-bold transition-all border cursor-pointer ${
              isSyncing 
                ? 'bg-[#deff9a]/20 text-[#deff9a] border-[#deff9a]/40' 
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
            }`}
            title="Sinkronisasikan data pivot, support, resistance, dan Fibonacci terkini"
          >
            <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin text-[#deff9a]' : 'text-zinc-400'}`} />
            <span className="hidden sm:inline">{isSyncing ? 'SYNCING...' : 'SYNC LIVE'}</span>
          </button>

          {/* Copy Pine Script Button */}
          <button
            onClick={handleCopyPineScript}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[8.5px] font-mono font-bold transition-all border cursor-pointer ${
              copiedPine 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : 'bg-zinc-900 hover:bg-zinc-800 text-sky-300 border-sky-500/30'
            }`}
            title="Salin Kode Indikator Pine Script v5 untuk dipaste di TradingView Pine Editor"
          >
            {copiedPine ? <Check className="w-2.5 h-2.5" /> : <Code2 className="w-2.5 h-2.5" />}
            <span>{copiedPine ? 'PINE COPIED' : 'PINE SCRIPT'}</span>
          </button>

          {/* Expand Details Toggle */}
          <button
            onClick={() => setIsHudExpanded(!isHudExpanded)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors text-[8.5px] font-mono font-bold"
            title="Buka Panel Matriks Rincian S/R & Fibonacci"
          >
            <span>MATRIKS S/R</span>
            {isHudExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* 3. Render Calibrated Native Visual S/R Candlestick Chart if Enabled */}
      {showNativeVisualChart && (
        <div className="p-2 bg-black border-b border-zinc-800">
          <VamNativeSRChart 
            symbol={symbol} 
            overrideCurrentPrice={effectivePrice}
            initialFilter={activeFilter === 'MAJOR_ONLY' || activeFilter === 'NEAREST_ONLY' ? 'ALL' : activeFilter} 
          />
        </div>
      )}

      {/* 4. Collapsible Comprehensive S/R Swing Analytics HUD Panel */}
      <AnimatePresence>
        {isHudExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-b border-zinc-800 bg-zinc-950/95 p-3 space-y-3 relative z-30"
          >
            {/* Tactical Bias Card */}
            <div className="p-2.5 rounded-xl bg-black/60 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#deff9a]" />
                  <span className="text-[10px] font-mono font-bold uppercase text-zinc-400">
                    VAM AI Swing Tactical Bias:
                  </span>
                  <span className="text-xs font-mono font-black text-[#deff9a]">
                    {analysis.activeTacticalBias.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-zinc-300 leading-relaxed">
                  {analysis.tacticalSummary}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyPlan}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase transition-all border cursor-pointer ${
                    copiedPlan ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}
                >
                  {copiedPlan ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPlan ? 'PLAN DISALIN' : 'SALIN S/R PLAN'}</span>
                </button>
              </div>
            </div>

            {/* Grid of S/R Bands Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[10px] font-mono">
              {/* Resistance Bands Column */}
              <div className="p-2.5 rounded-xl bg-black/50 border border-rose-500/30 space-y-2">
                <div className="flex items-center justify-between text-rose-300 font-bold uppercase text-[9.5px]">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                    <span>Resistensi Swing High (Ceiling)</span>
                  </span>
                  <span className="text-[8px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-black">
                    {analysis.resistanceBands.length} BANDS
                  </span>
                </div>
                <div className="space-y-1.5">
                  {analysis.resistanceBands.map((r) => (
                    <div 
                      key={r.id}
                      onClick={() => setSelectedBand(r)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        selectedBand?.id === r.id ? 'bg-rose-950/80 border-rose-400' : 'bg-zinc-900/70 border-zinc-800 hover:border-rose-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-300">{r.label}</span>
                        <span className="font-bold text-white">{formatStockPrice(r.corePrice, symbol)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[8px] text-zinc-400 mt-0.5">
                        <span>Zone: {formatStockPrice(r.lowerPrice, symbol)} - {formatStockPrice(r.upperPrice, symbol)}</span>
                        <span className="text-rose-400 font-bold">+{r.distancePct}% ({r.testCount}x Highs)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Support Bands Column */}
              <div className="p-2.5 rounded-xl bg-black/50 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between text-emerald-300 font-bold uppercase text-[9.5px]">
                  <span className="flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Support Swing Low (Floor)</span>
                  </span>
                  <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-black">
                    {analysis.supportBands.length} BANDS
                  </span>
                </div>
                <div className="space-y-1.5">
                  {analysis.supportBands.map((s) => (
                    <div 
                      key={s.id}
                      onClick={() => setSelectedBand(s)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        selectedBand?.id === s.id ? 'bg-emerald-950/80 border-emerald-400' : 'bg-zinc-900/70 border-zinc-800 hover:border-emerald-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-300">{s.label}</span>
                        <span className="font-bold text-white">{formatStockPrice(s.corePrice, symbol)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[8px] text-zinc-400 mt-0.5">
                        <span>Zone: {formatStockPrice(s.lowerPrice, symbol)} - {formatStockPrice(s.upperPrice, symbol)}</span>
                        <span className="text-emerald-400 font-bold">{s.distancePct}% ({s.testCount}x Lows)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fibonacci & Key Retracement Levels */}
              <div className="p-2.5 rounded-xl bg-black/50 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between text-amber-300 font-bold uppercase text-[9.5px]">
                  <span className="flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    <span>Fibonacci Retracements</span>
                  </span>
                  <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-black">
                    SWING RANGE {analysis.rangeSpreadPct}%
                  </span>
                </div>
                <div className="space-y-1.5">
                  {analysis.fibonacciBands.map((f) => (
                    <div 
                      key={f.id}
                      onClick={() => setSelectedBand(f)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        selectedBand?.id === f.id ? 'bg-amber-950/80 border-amber-400' : 'bg-zinc-900/70 border-zinc-800 hover:border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-bold ${f.tier === 'GOLDEN_POCKET' ? 'text-amber-300' : 'text-zinc-300'}`}>
                          {f.code} • {f.tier === 'GOLDEN_POCKET' ? 'Golden Pocket (0.618)' : f.label.split('(')[0]}
                        </span>
                        <span className="font-bold text-white">{formatStockPrice(f.corePrice, symbol)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[8px] text-zinc-400 mt-0.5">
                        <span>Skor Relevansi: {f.strengthScore}%</span>
                        <span className="text-amber-400 font-bold">{f.distancePct >= 0 ? `+${f.distancePct}%` : `${f.distancePct}%`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChartSupportResistanceOverlay;
