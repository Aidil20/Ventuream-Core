import React, { useState, useMemo } from 'react';
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
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  analyzeAssetSwingSupportResistance, 
  SwingAnalysisResult, 
  SRBand, 
  SwingPoint 
} from '../lib/swingDetection';
import { formatStockPrice } from '../lib/stockUtils';

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
  const [showVisualBands, setShowVisualBands] = useState<boolean>(true);
  const [bandOpacity, setBandOpacity] = useState<number>(0.35); // 0.15 to 0.7
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'R_LEVELS' | 'S_LEVELS' | 'MAJOR_ONLY' | 'FIBONACCI_ONLY' | 'NEAREST_ONLY'>('ALL');
  const [hoveredBand, setHoveredBand] = useState<SRBand | null>(null);
  const [selectedBand, setSelectedBand] = useState<SRBand | null>(null);
  const [isHudExpanded, setIsHudExpanded] = useState<boolean>(false);
  const [copiedPine, setCopiedPine] = useState<boolean>(false);
  const [copiedPlan, setCopiedPlan] = useState<boolean>(false);

  // Compute Swing High/Low Analysis
  const analysis: SwingAnalysisResult = useMemo(() => {
    return analyzeAssetSwingSupportResistance(symbol, lookbackBars, overrideCurrentPrice);
  }, [symbol, lookbackBars, overrideCurrentPrice]);

  // Filter bands according to activeFilter
  const displayBands = useMemo(() => {
    let list: SRBand[] = [];
    if (activeFilter === 'ALL') {
      list = [...analysis.resistanceBands, ...analysis.supportBands, ...analysis.fibonacciBands];
    } else if (activeFilter === 'R_LEVELS') {
      list = analysis.resistanceBands;
    } else if (activeFilter === 'S_LEVELS') {
      list = analysis.supportBands;
    } else if (activeFilter === 'MAJOR_ONLY') {
      list = [
        ...analysis.resistanceBands.filter(b => b.tier === 'MAJOR'),
        ...analysis.supportBands.filter(b => b.tier === 'MAJOR'),
        ...analysis.fibonacciBands.filter(b => b.tier === 'GOLDEN_POCKET' || b.tier === 'MIDPOINT')
      ];
    } else if (activeFilter === 'FIBONACCI_ONLY') {
      list = analysis.fibonacciBands;
    } else if (activeFilter === 'NEAREST_ONLY') {
      if (analysis.nearestResistance) list.push(analysis.nearestResistance);
      if (analysis.nearestSupport) list.push(analysis.nearestSupport);
      const fibGolden = analysis.fibonacciBands.find(b => b.tier === 'GOLDEN_POCKET');
      if (fibGolden) list.push(fibGolden);
    }
    return list;
  }, [analysis, activeFilter]);

  // Coordinate mapping for visual horizontal bands
  // Normalized 0% (top = high price) to 100% (bottom = low price)
  const rangeHigh = analysis.rangeHigh * 1.025; // 2.5% padding on top
  const rangeLow = Math.max(1, analysis.rangeLow * 0.975); // 2.5% padding on bottom
  const priceRange = rangeHigh - rangeLow;

  const calculateYPercent = (price: number): number => {
    if (priceRange <= 0) return 50;
    const pct = ((rangeHigh - price) / priceRange) * 100;
    return Math.max(4, Math.min(96, pct));
  };

  const currentPriceY = calculateYPercent(analysis.currentPrice);

  const handleCopyPineScript = () => {
    navigator.clipboard.writeText(analysis.generatedPineScript);
    setCopiedPine(true);
    setTimeout(() => setCopiedPine(false), 2500);
  };

  const handleCopyPlan = () => {
    const text = `[VAM S/R SWING PLAN] ${analysis.cleanTicker}
• Harga Terkini: ${formatStockPrice(analysis.currentPrice, symbol)}
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

      {/* 2. Top Control HUD Bar */}
      <div className="px-3 py-1.5 bg-zinc-950/95 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Summary Metrics Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setShowVisualBands(!showVisualBands)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-mono font-black uppercase transition-all cursor-pointer border ${
              showVisualBands 
                ? 'bg-[#deff9a] text-black border-[#deff9a] shadow-sm'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
            title="Tampilkan / Sembunyikan Visual Pita Support & Resistance pada Chart"
          >
            {showVisualBands ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>{showVisualBands ? 'S/R BANDS: ON' : 'S/R BANDS: OFF'}</span>
          </button>

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

        {/* Right: Quick Filter & Pine Script Copy */}
        <div className="flex items-center gap-1.5">
          {/* Filter Dropdown / Quick Tabs */}
          <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[8px] font-mono font-bold overflow-x-auto">
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
            <button
              onClick={() => setActiveFilter('NEAREST_ONLY')}
              className={`px-1.5 py-0.5 rounded transition-colors whitespace-nowrap ${activeFilter === 'NEAREST_ONLY' ? 'bg-sky-950/80 text-sky-300 border border-sky-500/40' : 'text-zinc-400 hover:text-white'}`}
            >
              Terdekat
            </button>
          </div>

          {/* Lookback Selector */}
          <div className="hidden lg:flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-800 text-[8px] font-mono">
            <span className="text-zinc-500">Lookback:</span>
            {[30, 60, 90].map(lb => (
              <button
                key={lb}
                onClick={() => setLookbackBars(lb)}
                className={`px-1 rounded font-bold ${lookbackBars === lb ? 'bg-[#deff9a] text-black' : 'text-zinc-400 hover:text-white'}`}
              >
                {lb}B
              </button>
            ))}
          </div>

          {/* Copy Pine Script Button */}
          <button
            onClick={handleCopyPineScript}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[8.5px] font-mono font-bold transition-all border cursor-pointer ${
              copiedPine 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : 'bg-zinc-900 hover:bg-zinc-800 text-sky-300 border-sky-500/30'
            }`}
            title="Salin Kode Indikator Pine Script v5 untuk dipaste di TradingView Editor"
          >
            {copiedPine ? <Check className="w-2.5 h-2.5" /> : <Code2 className="w-2.5 h-2.5" />}
            <span>{copiedPine ? 'PINE COPIED' : 'PINE SCRIPT'}</span>
          </button>

          {/* Expand Details Toggle */}
          <button
            onClick={() => setIsHudExpanded(!isHudExpanded)}
            className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Buka Panel Rincian S/R & Tactical Breakdown"
          >
            {isHudExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 3. Visual Support & Resistance Bands Overlay Layer (Rendered right over the chart canvas) */}
      {showVisualBands && (
        <div className="relative w-full pointer-events-none z-10">
          {/* Floating Transparent Bands Canvas Layer */}
          <div className="absolute inset-x-0 top-0 h-[400px] sm:h-[450px] overflow-hidden pointer-events-none">
            {displayBands.map((band) => {
              const coreY = calculateYPercent(band.corePrice);
              const upperY = calculateYPercent(band.upperPrice);
              const lowerY = calculateYPercent(band.lowerPrice);
              const heightPct = Math.max(1.8, Math.abs(lowerY - upperY));

              const isResistance = band.type === 'RESISTANCE';
              const isSupport = band.type === 'SUPPORT';
              const isFib = band.type === 'FIBONACCI';
              const isGoldenPocket = band.tier === 'GOLDEN_POCKET';
              const isMidpoint = band.tier === 'MIDPOINT';

              let borderColor = 'border-rose-500/60';
              let bgColor = `rgba(244, 63, 94, ${bandOpacity * 0.4})`;
              let textColor = 'text-rose-300';
              let badgeBg = 'bg-rose-950/90 text-rose-300 border-rose-600/50';

              if (isSupport) {
                borderColor = 'border-emerald-500/60';
                bgColor = `rgba(16, 185, 129, ${bandOpacity * 0.4})`;
                textColor = 'text-emerald-300';
                badgeBg = 'bg-emerald-950/90 text-emerald-300 border-emerald-600/50';
              } else if (isGoldenPocket) {
                borderColor = 'border-amber-400/80';
                bgColor = `rgba(251, 191, 36, ${bandOpacity * 0.45})`;
                textColor = 'text-amber-300';
                badgeBg = 'bg-amber-950/90 text-amber-300 border-amber-500/60';
              } else if (isMidpoint) {
                borderColor = 'border-yellow-400/50';
                bgColor = `rgba(234, 179, 8, ${bandOpacity * 0.25})`;
                textColor = 'text-yellow-300';
                badgeBg = 'bg-yellow-950/90 text-yellow-300 border-yellow-500/40';
              } else if (isFib) {
                borderColor = 'border-sky-500/50';
                bgColor = `rgba(56, 189, 248, ${bandOpacity * 0.25})`;
                textColor = 'text-sky-300';
                badgeBg = 'bg-sky-950/90 text-sky-300 border-sky-500/40';
              }

              return (
                <div
                  key={band.id}
                  style={{
                    top: `${Math.min(upperY, lowerY)}%`,
                    height: `${heightPct}%`,
                    backgroundColor: bgColor
                  }}
                  className={`absolute inset-x-0 border-y border-dashed ${borderColor} transition-all pointer-events-auto group cursor-pointer hover:brightness-125`}
                  onMouseEnter={() => setHoveredBand(band)}
                  onMouseLeave={() => setHoveredBand(null)}
                  onClick={() => setSelectedBand(selectedBand?.id === band.id ? null : band)}
                >
                  {/* Left Label Tag */}
                  <div className="absolute left-2 -top-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                    <span className={`px-1.5 py-0.2 rounded text-[7.5px] font-mono font-black uppercase tracking-wider border shadow-md ${badgeBg}`}>
                      {band.code} • {formatStockPrice(band.corePrice, symbol)}
                    </span>
                    {band.testCount > 1 && (
                      <span className="hidden sm:inline-block px-1 py-0.2 rounded bg-black/80 text-zinc-300 text-[7px] font-mono border border-zinc-700">
                        {band.testCount}x Swings
                      </span>
                    )}
                  </div>

                  {/* Right Price & Distance Tag */}
                  <div className="absolute right-2 -top-3 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                    <span className={`px-1.5 py-0.2 rounded text-[7.5px] font-mono font-bold border shadow-md ${badgeBg}`}>
                      {band.distancePct >= 0 ? `+${band.distancePct}%` : `${band.distancePct}%`}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Current Price Reference Line */}
            <div 
              style={{ top: `${currentPriceY}%` }}
              className="absolute inset-x-0 border-t-2 border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.7)] pointer-events-none z-20 flex items-center justify-between px-3"
            >
              <div className="bg-sky-500 text-slate-950 font-mono font-black text-[7.5px] px-1.5 py-0.2 rounded -translate-y-1/2 uppercase tracking-tight flex items-center gap-1 shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                <span>HARGA SAAT INI: {formatStockPrice(analysis.currentPrice, symbol)}</span>
              </div>
              <span className="bg-sky-950/90 text-sky-300 border border-sky-400 font-mono font-black text-[7.5px] px-1.5 py-0.2 rounded -translate-y-1/2 shadow-md">
                LIVE PIVOT
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Active Hovered / Selected Band Quick Tooltip */}
      {(hoveredBand || selectedBand) && (
        <div className="mx-3 my-1 p-2 rounded-xl bg-zinc-900/95 border border-zinc-700 shadow-xl flex flex-wrap items-center justify-between gap-2 text-xs relative z-30">
          {(() => {
            const b = hoveredBand || selectedBand;
            if (!b) return null;
            const isR = b.type === 'RESISTANCE';
            const isS = b.type === 'SUPPORT';

            return (
              <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded font-mono font-black text-[9px] uppercase border ${
                    isR ? 'bg-rose-950 text-rose-300 border-rose-500/40' :
                    isS ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' :
                    'bg-amber-950 text-amber-300 border-amber-500/40'
                  }`}>
                    {b.label}
                  </span>
                  <div className="text-xs font-mono font-bold text-white">
                    {formatStockPrice(b.corePrice, symbol)}
                    <span className="text-[10px] text-zinc-400 font-normal ml-1">
                      (Zone: {formatStockPrice(b.lowerPrice, symbol)} - {formatStockPrice(b.upperPrice, symbol)})
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-400">
                    Jarak: <strong className={b.distancePct >= 0 ? 'text-rose-400' : 'text-emerald-400'}>{b.distancePct >= 0 ? `+${b.distancePct}%` : `${b.distancePct}%`}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[9.5px] font-mono text-zinc-300">
                  <span className="text-zinc-400">Uji Swing: <strong className="text-white">{b.testCount}x</strong></span>
                  <span className="text-zinc-400">Kekuatan: <strong className="text-[#deff9a]">{b.strengthScore}/100</strong></span>
                  <span className="text-zinc-400 truncate max-w-xs italic text-[9px]">"{b.tacticalNote}"</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 5. Collapsible Comprehensive S/R Swing Analytics HUD Panel */}
      <AnimatePresence>
        {isHudExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-zinc-800 bg-zinc-950/95 p-3 space-y-3 relative z-30"
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
