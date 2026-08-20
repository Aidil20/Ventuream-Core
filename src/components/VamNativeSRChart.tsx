import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  analyzeAssetSwingSupportResistance, 
  OHLCVBar, 
  SRBand, 
  SwingAnalysisResult 
} from '../lib/swingDetection';
import { formatStockPrice, getKnownStockPrice, normalizeTicker } from '../lib/stockUtils';
import { 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Maximize2, 
  Info,
  Calendar,
  Sparkles,
  Zap,
  Activity,
  Eye,
  EyeOff,
  BarChart2,
  Sliders
} from 'lucide-react';

interface VamNativeSRChartProps {
  symbol: string;
  className?: string;
  initialFilter?: 'ALL' | 'R_LEVELS' | 'S_LEVELS' | 'FIBONACCI_ONLY' | 'GOLDEN_ONLY' | 'PIVOT_ONLY';
  overrideCurrentPrice?: number;
  height?: number;
}

interface AxisTagItem {
  id: string;
  label: string;
  shortCode: string;
  price: number;
  rawY: number;
  adjustedY: number;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  isLive?: boolean;
  isPivot?: boolean;
  isGolden?: boolean;
  distancePct?: number;
  priority: number; // Higher priority stays closer to original rawY
}

export const VamNativeSRChart: React.FC<VamNativeSRChartProps> = ({
  symbol,
  className = '',
  initialFilter = 'ALL',
  overrideCurrentPrice,
  height = 430
}) => {
  const [lookbackDays, setLookbackDays] = useState<number>(60);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'R_LEVELS' | 'S_LEVELS' | 'FIBONACCI_ONLY' | 'GOLDEN_ONLY' | 'PIVOT_ONLY'>(initialFilter);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [showFibZones, setShowFibZones] = useState<boolean>(true);
  const [tagDensity, setTagDensity] = useState<'COMPACT' | 'DETAILED'>('COMPACT');
  
  // Real-time live price state with market broadcast synchronization
  const [livePrice, setLivePrice] = useState<number>(() => overrideCurrentPrice || getKnownStockPrice(symbol));

  useEffect(() => {
    if (overrideCurrentPrice) {
      setLivePrice(overrideCurrentPrice);
    } else {
      setLivePrice(getKnownStockPrice(symbol));
    }
  }, [symbol, overrideCurrentPrice]);

  // Listen to app-wide market update broadcasts
  useEffect(() => {
    const handleMarketUpdate = (e: any) => {
      if (e.detail && e.detail.symbol) {
        const incomingSym = normalizeTicker(e.detail.symbol);
        const currentSym = normalizeTicker(symbol);
        if (incomingSym === currentSym && e.detail.price) {
          setLivePrice(e.detail.price);
        }
      }
    };

    window.addEventListener('vam-market-update' as any, handleMarketUpdate);
    return () => {
      window.removeEventListener('vam-market-update' as any, handleMarketUpdate);
    };
  }, [symbol]);
  
  // Interactive Crosshair Hover State
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverYPrice, setHoverYPrice] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [containerHeight, setContainerHeight] = useState<number>(height || 430);
  const rafRef = useRef<number | null>(null);

  // Resize Observer for dynamic SVG dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height: entryHeight } = entry.contentRect;
        if (width > 0) setContainerWidth(width);
        if (entryHeight > 0) setContainerHeight(Math.max(340, entryHeight));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute Full Swing & S/R & Fibonacci Analysis (synchronized with live real-time price)
  const analysis: SwingAnalysisResult = useMemo(() => {
    return analyzeAssetSwingSupportResistance(symbol, lookbackDays, livePrice);
  }, [symbol, lookbackDays, livePrice]);

  const bars = analysis.bars.slice(-lookbackDays);

  // Calculate SVG Viewport and Price Min/Max Scales
  const chartMetrics = useMemo(() => {
    if (bars.length === 0) {
      return {
        minPrice: 100,
        maxPrice: 200,
        priceRange: 100,
        maxVolume: 1000,
        paddingTop: 24,
        paddingBottom: 32,
        paddingLeft: 8,
        paddingRight: 92,
        plotWidth: 700,
        plotHeight: 350
      };
    }

    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;

    bars.forEach((b) => {
      if (b.low < min) min = b.low;
      if (b.high > max) max = b.high;
      if (b.volume > maxVol) maxVol = b.volume;
    });

    // Also include key visible bands in price bounds so lines aren't cut off
    analysis.resistanceBands.slice(0, 3).forEach((r) => {
      if (r.corePrice > max) max = r.corePrice;
    });
    analysis.supportBands.slice(0, 3).forEach((s) => {
      if (s.corePrice < min) min = s.corePrice;
    });
    analysis.fibonacciBands.forEach((f) => {
      if (f.code === 'EXT-1.618' && f.corePrice > max * 1.08) return;
      if (f.corePrice > max) max = f.corePrice;
      if (f.corePrice < min) min = f.corePrice;
    });

    if (analysis.currentPrice > max) max = analysis.currentPrice;
    if (analysis.currentPrice < min) min = analysis.currentPrice;
    if (analysis.pivotPoint > max) max = analysis.pivotPoint;
    if (analysis.pivotPoint < min) min = analysis.pivotPoint;

    // Price padding (top & bottom 3%)
    const span = Math.max(1, max - min);
    const paddedMin = Math.max(1, min - span * 0.035);
    const paddedMax = max + span * 0.035;
    const finalSpan = paddedMax - paddedMin;

    const paddingTop = 22;
    const paddingBottom = 30;
    const paddingLeft = containerWidth < 480 ? 6 : 10;
    const paddingRight = containerWidth < 480 ? 84 : 94; // Dedicated right axis for price tags

    const plotWidth = Math.max(160, containerWidth - paddingLeft - paddingRight);
    const plotHeight = Math.max(180, containerHeight - paddingTop - paddingBottom);

    return {
      minPrice: paddedMin,
      maxPrice: paddedMax,
      priceRange: finalSpan,
      maxVolume: maxVol || 1,
      paddingTop,
      paddingBottom,
      paddingLeft,
      paddingRight,
      plotWidth,
      plotHeight
    };
  }, [bars, analysis, containerWidth, containerHeight]);

  // Dynamic Price Formatter for SVG Axis and Labels
  const formatPriceLabel = (val: number): string => {
    if (analysis.market === 'US' || analysis.market === 'NASDAQ' || analysis.market === 'NYSE' || analysis.market === 'SGX' || (val < 10 && val % 1 !== 0)) {
      return val.toFixed(2);
    }
    if (val < 100 && val % 1 !== 0) {
      return val.toFixed(1);
    }
    return Math.round(val).toLocaleString('id-ID');
  };

  // Coordinate Conversion Functions
  const priceToY = (price: number): number => {
    const ratio = (chartMetrics.maxPrice - price) / chartMetrics.priceRange;
    return chartMetrics.paddingTop + ratio * chartMetrics.plotHeight;
  };

  const yToPrice = (y: number): number => {
    const ratio = (y - chartMetrics.paddingTop) / chartMetrics.plotHeight;
    return chartMetrics.maxPrice - ratio * chartMetrics.priceRange;
  };

  const indexToX = (idx: number): number => {
    if (bars.length <= 1) return chartMetrics.paddingLeft + chartMetrics.plotWidth / 2;
    const step = chartMetrics.plotWidth / (bars.length - 1);
    return chartMetrics.paddingLeft + idx * step;
  };

  const candleWidth = useMemo(() => {
    if (bars.length === 0) return 6;
    const step = chartMetrics.plotWidth / bars.length;
    return Math.max(2.2, Math.min(14, step * 0.65));
  }, [bars.length, chartMetrics.plotWidth]);

  // Filter bands to display on chart
  const visibleBands = useMemo(() => {
    const list: SRBand[] = [];
    if (activeFilter === 'ALL') {
      // Primary clean view: R1, R2, S1, S2, Pivot, and key Fibonacci (0.0%, 38.2%, 50%, 61.8%, 100%)
      list.push(...analysis.resistanceBands.slice(0, 3));
      list.push(...analysis.supportBands.slice(0, 3));
      list.push(...analysis.fibonacciBands.filter(f => 
        f.code === 'FIB-0.000' || 
        f.code === 'FIB-0.382' || 
        f.code === 'EQ-0.500' || 
        f.code === 'FIB-0.618' || 
        f.code === 'FIB-1.000'
      ));
    } else if (activeFilter === 'R_LEVELS') {
      list.push(...analysis.resistanceBands);
    } else if (activeFilter === 'S_LEVELS') {
      list.push(...analysis.supportBands);
    } else if (activeFilter === 'FIBONACCI_ONLY') {
      list.push(...analysis.fibonacciBands.filter(f => f.code !== 'EXT-1.618'));
    } else if (activeFilter === 'GOLDEN_ONLY') {
      const g = analysis.fibonacciBands.find(f => f.tier === 'GOLDEN_POCKET');
      if (g) list.push(g);
      const eq = analysis.fibonacciBands.find(f => f.tier === 'MIDPOINT');
      if (eq) list.push(eq);
      if (analysis.nearestResistance) list.push(analysis.nearestResistance);
      if (analysis.nearestSupport) list.push(analysis.nearestSupport);
    } else if (activeFilter === 'PIVOT_ONLY') {
      if (analysis.nearestResistance) list.push(analysis.nearestResistance);
      if (analysis.nearestSupport) list.push(analysis.nearestSupport);
    }
    return list;
  }, [analysis, activeFilter]);

  // Golden Pocket zone reference (between 0.500 EQ and 0.618 Fib)
  const goldenPocketBand = analysis.fibonacciBands.find(f => f.code === 'FIB-0.618');
  const eqBand = analysis.fibonacciBands.find(f => f.code === 'EQ-0.500');

  // Compute Anti-Collision Right Axis Badges (1D Relaxation Algorithm)
  const axisTags: AxisTagItem[] = useMemo(() => {
    const rawItems: AxisTagItem[] = [];

    // 1. Live Current Price Tag (Highest Priority)
    const liveY = priceToY(analysis.currentPrice);
    rawItems.push({
      id: 'tag-live-price',
      label: `LIVE ${formatPriceLabel(analysis.currentPrice)}`,
      shortCode: 'LIVE',
      price: analysis.currentPrice,
      rawY: liveY,
      adjustedY: liveY,
      color: '#38bdf8',
      bgColor: '#0369a1',
      textColor: '#ffffff',
      borderColor: '#7dd3fc',
      isLive: true,
      priority: 100
    });

    // 2. Pivot Point Tag (High Priority)
    const pivotY = priceToY(analysis.pivotPoint);
    rawItems.push({
      id: 'tag-pivot-point',
      label: `P ${formatPriceLabel(analysis.pivotPoint)}`,
      shortCode: 'PIVOT',
      price: analysis.pivotPoint,
      rawY: pivotY,
      adjustedY: pivotY,
      color: '#06b6d4',
      bgColor: '#083344',
      textColor: '#67e8f9',
      borderColor: '#06b6d4',
      isPivot: true,
      priority: 90
    });

    // 3. Visible S/R and Fibonacci Bands
    visibleBands.forEach((band) => {
      const y = priceToY(band.corePrice);
      const isR = band.type === 'RESISTANCE';
      const isS = band.type === 'SUPPORT';
      const isFib = band.type === 'FIBONACCI';
      const isGolden = band.tier === 'GOLDEN_POCKET';
      const isMid = band.tier === 'MIDPOINT';

      let color = '#f43f5e';
      let bgColor = '#4c0519';
      let textColor = '#fda4af';
      let borderColor = '#9f1239';
      let shortCode = band.code;
      let priority = 50;

      if (isS) {
        color = '#10b981';
        bgColor = '#022c22';
        textColor = '#6ee7b7';
        borderColor = '#065f46';
        priority = 60;
      } else if (isGolden) {
        color = '#f59e0b';
        bgColor = '#451a03';
        textColor = '#fde68a';
        borderColor = '#d97706';
        shortCode = 'FIB 61.8%';
        priority = 85;
      } else if (isMid) {
        color = '#eab308';
        bgColor = '#422006';
        textColor = '#fef08a';
        borderColor = '#ca8a04';
        shortCode = 'EQ 50%';
        priority = 75;
      } else if (isFib) {
        color = '#38bdf8';
        bgColor = '#082f49';
        textColor = '#7dd3fc';
        borderColor = '#0369a1';
        if (band.code === 'FIB-0.000') shortCode = 'FIB 0%';
        else if (band.code === 'FIB-0.236') shortCode = 'FIB 23.6%';
        else if (band.code === 'FIB-0.382') shortCode = 'FIB 38.2%';
        else if (band.code === 'FIB-0.786') shortCode = 'FIB 78.6%';
        else if (band.code === 'FIB-1.000') shortCode = 'FIB 100%';
        priority = 55;
      }

      rawItems.push({
        id: `tag-${band.id}`,
        label: `${shortCode} ${formatPriceLabel(band.corePrice)}`,
        shortCode,
        price: band.corePrice,
        rawY: y,
        adjustedY: y,
        color,
        bgColor,
        textColor,
        borderColor,
        isGolden,
        distancePct: band.distancePct,
        priority
      });
    });

    // 4. Run 1D Spacing Anti-Overlap Relaxation
    // Sort items by desired Y ascending (top to bottom)
    rawItems.sort((a, b) => a.rawY - b.rawY);

    const minSpacing = 15; // Minimum 15px badge height separation
    const minY = chartMetrics.paddingTop + 6;
    const maxY = chartMetrics.paddingTop + chartMetrics.plotHeight - 6;

    // Forward pass
    for (let i = 0; i < rawItems.length; i++) {
      if (rawItems[i].adjustedY < minY) rawItems[i].adjustedY = minY;
      if (i > 0) {
        if (rawItems[i].adjustedY - rawItems[i - 1].adjustedY < minSpacing) {
          // If collision occurs, push lower-priority item or split distance
          rawItems[i].adjustedY = rawItems[i - 1].adjustedY + minSpacing;
        }
      }
    }

    // Backward pass to fit within bottom boundary
    for (let i = rawItems.length - 1; i >= 0; i--) {
      if (rawItems[i].adjustedY > maxY) rawItems[i].adjustedY = maxY;
      if (i < rawItems.length - 1) {
        if (rawItems[i + 1].adjustedY - rawItems[i].adjustedY < minSpacing) {
          rawItems[i].adjustedY = rawItems[i + 1].adjustedY - minSpacing;
        }
      }
    }

    return rawItems;
  }, [analysis, visibleBands, chartMetrics]);

  // Handle Mouse / Touch interactions on SVG with RAF throttling to prevent UI lag
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      if (x >= chartMetrics.paddingLeft && x <= chartMetrics.paddingLeft + chartMetrics.plotWidth) {
        const step = chartMetrics.plotWidth / Math.max(1, bars.length - 1);
        const rawIdx = Math.round((x - chartMetrics.paddingLeft) / step);
        const clampedIdx = Math.max(0, Math.min(bars.length - 1, rawIdx));
        setHoverIndex(clampedIdx);
      } else {
        setHoverIndex(null);
      }

      if (y >= chartMetrics.paddingTop && y <= chartMetrics.paddingTop + chartMetrics.plotHeight) {
        setHoverYPrice(Math.round(yToPrice(y)));
      } else {
        setHoverYPrice(null);
      }
    });
  };

  const handleMouseLeave = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    setHoverIndex(null);
    setHoverYPrice(null);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const activeHoverBar = hoverIndex !== null && bars[hoverIndex] ? bars[hoverIndex] : (bars[bars.length - 1] || null);

  return (
    <div className={`w-full flex flex-col bg-zinc-950 border border-zinc-800/90 rounded-2xl overflow-hidden shadow-2xl ${className}`} id={`vam-native-chart-${analysis.cleanTicker}`}>
      {/* Top Controller Toolbar */}
      <div className="px-3 py-2 bg-zinc-900/95 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Ticker & Live Metrics */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-black/80 px-2.5 py-1 rounded-lg border border-zinc-800 text-[10px] font-mono shadow-inner">
            <span className="font-black text-white uppercase tracking-wider">{analysis.cleanTicker}</span>
            <span className="text-zinc-500">•</span>
            <span className="text-[#deff9a] font-black">{formatStockPrice(analysis.currentPrice, symbol)}</span>
          </div>

          {/* Pivot Metric */}
          <div className="flex items-center gap-1 bg-cyan-950/60 border border-cyan-500/40 px-2.5 py-1 rounded-lg text-[9.5px] font-mono">
            <span className="text-cyan-400 font-bold">PIVOT P:</span>
            <span className="text-white font-bold">{formatStockPrice(analysis.pivotPoint, symbol)}</span>
          </div>

          {/* Nearest R1 & S1 badges (Desktop/Tablet) */}
          {analysis.nearestResistance && (
            <div className="hidden md:flex items-center gap-1 bg-rose-950/40 border border-rose-500/30 px-2 py-1 rounded-lg text-[9px] font-mono text-rose-300">
              <span className="font-bold">R1:</span>
              <span className="text-white font-bold">{formatStockPrice(analysis.nearestResistance.corePrice, symbol)}</span>
              <span className="text-rose-400 font-bold">(+{analysis.nearestResistance.distancePct}%)</span>
            </div>
          )}

          {analysis.nearestSupport && (
            <div className="hidden md:flex items-center gap-1 bg-emerald-950/40 border border-emerald-500/30 px-2 py-1 rounded-lg text-[9px] font-mono text-emerald-300">
              <span className="font-bold">S1:</span>
              <span className="text-white font-bold">{formatStockPrice(analysis.nearestSupport.corePrice, symbol)}</span>
              <span className="text-emerald-400 font-bold">({analysis.nearestSupport.distancePct}%)</span>
            </div>
          )}
        </div>

        {/* Right: S/R & Fibonacci Filters + Timeframe Switches */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* S/R Filter Selector */}
          <div className="flex items-center gap-0.5 bg-black/70 p-0.5 rounded-lg border border-zinc-800 overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'ALL' ? 'bg-[#deff9a] text-black shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Tampilkan Support, Resistance, Pivot, dan Fibonacci Utama"
            >
              Semua S/R
            </button>
            <button
              onClick={() => setActiveFilter('R_LEVELS')}
              className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'R_LEVELS' ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40' : 'text-zinc-400 hover:text-white'
              }`}
              title="Hanya Level Resistensi (R1-R4)"
            >
              R1 - R4
            </button>
            <button
              onClick={() => setActiveFilter('S_LEVELS')}
              className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'S_LEVELS' ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40' : 'text-zinc-400 hover:text-white'
              }`}
              title="Hanya Level Support (S1-S4)"
            >
              S1 - S4
            </button>
            <button
              onClick={() => setActiveFilter('FIBONACCI_ONLY')}
              className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'FIBONACCI_ONLY' ? 'bg-sky-500/30 text-sky-300 border border-sky-500/40' : 'text-zinc-400 hover:text-white'
              }`}
              title="Tampilkan Level Fibonacci Retracement Lengkap"
            >
              Fibonacci
            </button>
            <button
              onClick={() => setActiveFilter('GOLDEN_ONLY')}
              className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'GOLDEN_ONLY' ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' : 'text-zinc-400 hover:text-white'
              }`}
              title="Fokus Zona Pantulan Emas (Golden Pocket 0.50 - 0.618)"
            >
              Golden Pocket
            </button>
          </div>

          {/* Lookback Range */}
          <div className="flex items-center gap-0.5 bg-black/70 p-0.5 rounded-lg border border-zinc-800">
            {[30, 60, 90].map((d) => (
              <button
                key={d}
                onClick={() => setLookbackDays(d)}
                className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold transition-all cursor-pointer ${
                  lookbackDays === d ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {d}D
              </button>
            ))}
          </div>

          {/* Layer toggles: Fib Zone & Volume */}
          <div className="hidden sm:flex items-center gap-1 bg-black/70 p-0.5 rounded-lg border border-zinc-800 text-[8px] font-mono">
            <button
              onClick={() => setShowFibZones(!showFibZones)}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                showFibZones ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Aktif/Nonaktifkan Shading Zona Golden Pocket"
            >
              Zona Fib
            </button>
            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                showVolume ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-600 hover:text-zinc-400'
              }`}
              title="Aktif/Nonaktifkan Histogram Volume"
            >
              Vol
            </button>
          </div>
        </div>
      </div>

      {/* Active Candle Hover Bar Details */}
      {activeHoverBar && (
        <div className="px-3 py-1 bg-black/90 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-[9px] font-mono text-zinc-300">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-zinc-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-zinc-500" />
              <span>{activeHoverBar.date}</span>
            </span>
            <span>O: <strong className="text-white">{formatStockPrice(activeHoverBar.open, symbol)}</strong></span>
            <span>H: <strong className="text-emerald-400">{formatStockPrice(activeHoverBar.high, symbol)}</strong></span>
            <span>L: <strong className="text-rose-400">{formatStockPrice(activeHoverBar.low, symbol)}</strong></span>
            <span>C: <strong className={activeHoverBar.close >= activeHoverBar.open ? 'text-emerald-400' : 'text-rose-400'}>{formatStockPrice(activeHoverBar.close, symbol)}</strong></span>
            <span className="hidden sm:inline">Vol: <strong className="text-zinc-300">{(activeHoverBar.volume / 1000000).toFixed(2)}M</strong></span>
          </div>

          {hoverYPrice !== null && (
            <div className="text-sky-300 font-bold bg-sky-950/80 px-2 py-0.5 rounded border border-sky-500/40 text-[8.5px]">
              Crosshair: {formatStockPrice(hoverYPrice, symbol)}
            </div>
          )}
        </div>
      )}

      {/* Main SVG Interactive Chart Area */}
      <div 
        ref={containerRef}
        className="w-full h-[380px] sm:h-[420px] md:h-[460px] relative bg-gradient-to-b from-[#090a0f] via-[#050609] to-[#020204] select-none overflow-hidden"
      >
        <svg
          width="100%"
          height="100%"
          className="w-full h-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Subtle Gradient for Golden Pocket Zone (0.50 - 0.618) */}
            <linearGradient id="goldenPocketGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.12" />
              <stop offset="50%" stopColor="#eab308" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.14" />
            </linearGradient>

            {/* Volume Histogram Gradients */}
            <linearGradient id="bullVolGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id="bearVolGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.04" />
            </linearGradient>

            {/* Neon Glow Filter for Golden Pocket Line */}
            <filter id="glow-golden" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. Background Grid Lines & Scale Coordinates */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = chartMetrics.paddingTop + ratio * chartMetrics.plotHeight;
            const price = yToPrice(y);
            return (
              <g key={`grid-${ratio}`}>
                <line
                  x1={chartMetrics.paddingLeft}
                  y1={y}
                  x2={chartMetrics.paddingLeft + chartMetrics.plotWidth}
                  y2={y}
                  stroke="#1c1d24"
                  strokeWidth="0.8"
                  strokeDasharray="3 3"
                />
              </g>
            );
          })}

          {/* 2. Golden Pocket Retracement Highlight Zone (Rendered Behind Candlesticks) */}
          {showFibZones && goldenPocketBand && eqBand && (() => {
            const y1 = priceToY(goldenPocketBand.corePrice);
            const y2 = priceToY(eqBand.corePrice);
            const topY = Math.min(y1, y2);
            const zoneHeight = Math.max(6, Math.abs(y1 - y2));

            return (
              <g key="golden-pocket-zone-group" className="pointer-events-none">
                {/* Translucent Zone Shading */}
                <rect
                  x={chartMetrics.paddingLeft}
                  y={topY}
                  width={chartMetrics.plotWidth}
                  height={zoneHeight}
                  fill="url(#goldenPocketGrad)"
                />
                
                {/* Zone Boundary Accents */}
                <line
                  x1={chartMetrics.paddingLeft}
                  y1={topY}
                  x2={chartMetrics.paddingLeft + chartMetrics.plotWidth}
                  y2={topY}
                  stroke="#f59e0b"
                  strokeWidth="0.8"
                  strokeDasharray="2 3"
                  strokeOpacity="0.4"
                />
                <line
                  x1={chartMetrics.paddingLeft}
                  y1={topY + zoneHeight}
                  x2={chartMetrics.paddingLeft + chartMetrics.plotWidth}
                  y2={topY + zoneHeight}
                  stroke="#f59e0b"
                  strokeWidth="0.8"
                  strokeDasharray="2 3"
                  strokeOpacity="0.4"
                />

                {/* Golden Pocket Watermark Label in Center of Zone */}
                {zoneHeight > 14 && (
                  <text
                    x={chartMetrics.paddingLeft + 10}
                    y={topY + zoneHeight / 2 + 3}
                    fill="#f59e0b"
                    fillOpacity="0.45"
                    fontSize="8"
                    fontWeight="bold"
                    fontFamily="monospace"
                    letterSpacing="0.5px"
                  >
                    ★ GOLDEN POCKET ZONE (0.50 - 0.618)
                  </text>
                )}
              </g>
            );
          })()}

          {/* 3. Support & Resistance & Fibonacci Horizontal Reference Lines */}
          {visibleBands.map((band) => {
            const y = priceToY(band.corePrice);
            const isR = band.type === 'RESISTANCE';
            const isS = band.type === 'SUPPORT';
            const isFib = band.type === 'FIBONACCI';
            const isGolden = band.tier === 'GOLDEN_POCKET';
            const isMid = band.tier === 'MIDPOINT';

            let strokeColor = '#f43f5e';
            let strokeDash = '4 3';
            let strokeWidth = '1';
            let opacity = 0.75;

            if (isS) {
              strokeColor = '#10b981';
              strokeDash = '4 3';
            } else if (isGolden) {
              strokeColor = '#f59e0b';
              strokeDash = 'solid';
              strokeWidth = '1.6';
              opacity = 0.95;
            } else if (isMid) {
              strokeColor = '#eab308';
              strokeDash = '5 3';
              strokeWidth = '1.3';
              opacity = 0.85;
            } else if (isFib) {
              strokeColor = '#38bdf8';
              strokeDash = '3 3';
              strokeWidth = '0.9';
              opacity = 0.65;
            }

            return (
              <g key={`line-${band.id}`} className="pointer-events-none">
                <line
                  x1={chartMetrics.paddingLeft}
                  y1={y}
                  x2={chartMetrics.paddingLeft + chartMetrics.plotWidth}
                  y2={y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDash}
                  strokeOpacity={opacity}
                  filter={isGolden ? 'url(#glow-golden)' : undefined}
                />
              </g>
            );
          })}

          {/* 4. Live Central Pivot Point Horizontal Line */}
          {(() => {
            const pivotY = priceToY(analysis.pivotPoint);
            return (
              <g key="live-pivot-point-line" className="pointer-events-none">
                <line
                  x1={chartMetrics.paddingLeft}
                  y1={pivotY}
                  x2={chartMetrics.paddingLeft + chartMetrics.plotWidth}
                  y2={pivotY}
                  stroke="#06b6d4"
                  strokeWidth="1.4"
                  strokeDasharray="6 3"
                  strokeOpacity="0.85"
                />
              </g>
            );
          })()}

          {/* 5. Volume Histogram Bars Layer */}
          {showVolume && bars.map((bar, idx) => {
            const x = indexToX(idx);
            const isBull = bar.close >= bar.open;
            const volHeight = (bar.volume / chartMetrics.maxVolume) * (chartMetrics.plotHeight * 0.20);
            const volY = chartMetrics.paddingTop + chartMetrics.plotHeight - volHeight;

            return (
              <rect
                key={`vol-${bar.date}`}
                x={x - candleWidth / 2}
                y={volY}
                width={candleWidth}
                height={Math.max(1, volHeight)}
                fill={isBull ? 'url(#bullVolGrad)' : 'url(#bearVolGrad)'}
                className="pointer-events-none"
              />
            );
          })}

          {/* 6. Candlestick Bars (Wicks & Bodies) - Rendered Crisp On Top */}
          {bars.map((bar, idx) => {
            const x = indexToX(idx);
            const openY = priceToY(bar.open);
            const closeY = priceToY(bar.close);
            const highY = priceToY(bar.high);
            const lowY = priceToY(bar.low);

            const isBull = bar.close >= bar.open;
            const candleColor = isBull ? '#10b981' : '#f43f5e';
            const bodyY = Math.min(openY, closeY);
            const bodyHeight = Math.max(1.8, Math.abs(closeY - openY));

            return (
              <g key={`candle-${bar.date}`} className="cursor-pointer">
                {/* Upper and Lower Shadow / Wick */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={candleColor}
                  strokeWidth="1.2"
                />

                {/* Real Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={bodyY}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={candleColor}
                  rx="0.6"
                />
              </g>
            );
          })}

          {/* 7. Current Live Price Horizontal Line */}
          {(() => {
            const currentY = priceToY(analysis.currentPrice);
            return (
              <g key="current-live-price-line" className="pointer-events-none">
                <line
                  x1={chartMetrics.paddingLeft}
                  y1={currentY}
                  x2={chartMetrics.paddingLeft + chartMetrics.plotWidth}
                  y2={currentY}
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  strokeOpacity="0.9"
                />
              </g>
            );
          })()}

          {/* 8. Smart Non-Overlapping Right Axis Price & Level Badges */}
          <g key="right-axis-badges-layer">
            {axisTags.map((tag) => {
              const badgeX = chartMetrics.paddingLeft + chartMetrics.plotWidth + 3;
              const badgeY = tag.adjustedY;
              const isOffset = Math.abs(tag.adjustedY - tag.rawY) > 2;

              return (
                <g key={tag.id} className="cursor-default">
                  {/* Subtle connecting tick line if badge was shifted for collision avoidance */}
                  {isOffset && (
                    <line
                      x1={chartMetrics.paddingLeft + chartMetrics.plotWidth}
                      y1={tag.rawY}
                      x2={badgeX}
                      y2={badgeY}
                      stroke={tag.color}
                      strokeWidth="0.8"
                      strokeOpacity="0.5"
                    />
                  )}

                  {/* Badge Background Pill */}
                  <rect
                    x={badgeX}
                    y={badgeY - 6.5}
                    width={containerWidth < 480 ? "80" : "88"}
                    height="13.5"
                    rx="3"
                    fill={tag.bgColor}
                    stroke={tag.borderColor}
                    strokeWidth="0.8"
                    className="shadow-sm"
                  />

                  {/* Badge Text: [ ShortCode | Price (Distance%) ] */}
                  <text
                    x={badgeX + 3}
                    y={badgeY + 3.2}
                    fill={tag.textColor}
                    fontSize={containerWidth < 480 ? "7.2" : "7.8"}
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {tag.shortCode} {formatPriceLabel(tag.price)}
                    {tag.distancePct !== undefined && !tag.isLive && (
                      <tspan fill={tag.distancePct >= 0 ? '#fca5a5' : '#86efac'} fontSize="6.8">
                        {tag.distancePct >= 0 ? ` +${tag.distancePct}%` : ` ${tag.distancePct}%`}
                      </tspan>
                    )}
                  </text>
                </g>
              );
            })}
          </g>

          {/* 9. Interactive Hover Crosshair Lines */}
          {hoverIndex !== null && bars[hoverIndex] && (
            <g key="interactive-crosshair" className="pointer-events-none">
              {/* Vertical Time Line */}
              <line
                x1={indexToX(hoverIndex)}
                y1={chartMetrics.paddingTop}
                x2={indexToX(hoverIndex)}
                y2={chartMetrics.paddingTop + chartMetrics.plotHeight}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />

              {/* Horizontal Price Line */}
              {hoverYPrice !== null && (
                <line
                  x1={chartMetrics.paddingLeft}
                  y1={priceToY(hoverYPrice)}
                  x2={chartMetrics.paddingLeft + chartMetrics.plotWidth}
                  y2={priceToY(hoverYPrice)}
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
              )}
            </g>
          )}

          {/* 10. Date Axis Labels at Bottom */}
          {bars.map((bar, idx) => {
            const interval = Math.max(5, Math.floor(bars.length / 6));
            if (idx % interval !== 0 && idx !== bars.length - 1) return null;
            const x = indexToX(idx);
            const shortDate = bar.date.slice(5); // MM-DD

            return (
              <text
                key={`date-lbl-${bar.date}`}
                x={x}
                y={chartMetrics.paddingTop + chartMetrics.plotHeight + 14}
                fill="#71717a"
                fontSize="7.5"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {shortDate}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Bottom Tactical Guide Summary Card */}
      <div className="px-3 py-2 bg-zinc-950 border-t border-zinc-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#deff9a]" />
          <span className="text-zinc-400">Tactical Bias:</span>
          <span className="text-[#deff9a] font-bold">{analysis.activeTacticalBias.replace(/_/g, ' ')}</span>
        </div>
        <div className="text-zinc-400 truncate max-w-lg text-[9.5px]">
          {analysis.tacticalSummary}
        </div>
      </div>
    </div>
  );
};

export default VamNativeSRChart;
