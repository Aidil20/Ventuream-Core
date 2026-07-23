import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  SlidersHorizontal, 
  Maximize2, 
  ExternalLink, 
  Search, 
  Info,
  RefreshCw,
  BarChart2,
  Check
} from 'lucide-react';

export interface PortfolioAsset {
  ticker: string;
  lots: number;
  averagePrice: number;
  marketPrice: number;
  currentPrice: number;
  change: number;
  marketValue: number;
  unrealized: number;
  dailyChange?: number;
}

interface PortfolioTreemapProps {
  portfolioData: PortfolioAsset[];
  onSelectSymbol?: (symbol: string) => void;
  onFundamentalAudit?: (symbol: string) => void;
}

interface NodeItem {
  id: string;
  ticker: string;
  value: number;
  dailyChange: number;
  unrealized: number;
  unrealizedPct: number;
  marketValue: number;
  lots: number;
  averagePrice: number;
  currentPrice: number;
  rawAsset: PortfolioAsset;
}

interface RectNode {
  x: number;
  y: number;
  w: number;
  h: number;
  item: NodeItem;
  weightPct: number;
}

export default function PortfolioTreemap({ 
  portfolioData, 
  onSelectSymbol, 
  onFundamentalAudit 
}: PortfolioTreemapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 420 });
  const [sizeMetric, setSizeMetric] = useState<'marketValue' | 'lots' | 'cost'>('marketValue');
  const [colorMetric, setColorMetric] = useState<'dailyChange' | 'unrealizedPct'>('dailyChange');
  const [filterMarket, setFilterMarket] = useState<'ALL' | 'GAINERS' | 'LOSERS' | 'IDX' | 'GLOBAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<NodeItem | null>(null);
  const [hoveredNode, setHoveredNode] = useState<NodeItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Update width and height on resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect) {
          const w = Math.max(300, entry.contentRect.width);
          const h = Math.max(300, Math.min(550, Math.round(w * 0.52)));
          setDimensions(prev => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Total Portfolio Market Value
  const totalValue = useMemo(() => {
    return portfolioData.reduce((acc, curr) => acc + (curr.marketValue || 0), 0);
  }, [portfolioData]);

  // Process & filter items
  const processedItems = useMemo<NodeItem[]>(() => {
    return portfolioData
      .map(asset => {
        const cost = asset.averagePrice * asset.lots * 100;
        const marketVal = asset.marketValue || (asset.currentPrice * asset.lots * 100);
        const unrealized = asset.unrealized || (marketVal - cost);
        const unrealizedPct = cost > 0 ? (unrealized / cost) * 100 : 0;
        const dailyChange = typeof asset.dailyChange === 'number' ? asset.dailyChange : (asset.change || 0);

        let sizeVal = marketVal;
        if (sizeMetric === 'lots') {
          sizeVal = asset.lots;
        } else if (sizeMetric === 'cost') {
          sizeVal = cost;
        }

        return {
          id: asset.ticker,
          ticker: asset.ticker,
          value: Math.max(sizeVal, 1),
          dailyChange,
          unrealized,
          unrealizedPct,
          marketValue: marketVal,
          lots: asset.lots,
          averagePrice: asset.averagePrice,
          currentPrice: asset.currentPrice || asset.marketPrice,
          rawAsset: asset
        };
      })
      .filter(item => {
        // Search query filter
        if (searchQuery && !item.ticker.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        // Filter market / performance
        if (filterMarket === 'GAINERS') return item.dailyChange > 0;
        if (filterMarket === 'LOSERS') return item.dailyChange < 0;
        if (filterMarket === 'IDX') return item.ticker.endsWith('.JK');
        if (filterMarket === 'GLOBAL') return !item.ticker.endsWith('.JK');
        return true;
      });
  }, [portfolioData, sizeMetric, searchQuery, filterMarket]);

  // Compute Treemap BSP Layout
  const rects = useMemo<RectNode[]>(() => {
    if (!processedItems.length) return [];
    
    const width = dimensions.width;
    const height = dimensions.height;
    const sumValue = processedItems.reduce((acc, item) => acc + Math.max(item.value, 0.0001), 0);
    if (sumValue <= 0) return [];

    const sorted = [...processedItems].sort((a, b) => b.value - a.value);
    const layoutResults: RectNode[] = [];

    function partition(nodes: NodeItem[], x: number, y: number, w: number, h: number) {
      if (nodes.length === 0) return;
      if (nodes.length === 1) {
        const node = nodes[0];
        const weightPct = totalValue > 0 ? (node.marketValue / totalValue) * 100 : (node.value / sumValue) * 100;
        layoutResults.push({ x, y, w, h, item: node, weightPct });
        return;
      }

      const currentTotal = nodes.reduce((sum, n) => sum + Math.max(n.value, 0.0001), 0);
      let mid = 1;
      let currentSum = Math.max(nodes[0].value, 0.0001);
      const halfTotal = currentTotal / 2;

      for (let i = 1; i < nodes.length - 1; i++) {
        const val = Math.max(nodes[i].value, 0.0001);
        if (Math.abs(currentSum + val - halfTotal) < Math.abs(currentSum - halfTotal)) {
          currentSum += val;
          mid = i + 1;
        } else {
          break;
        }
      }

      const group1 = nodes.slice(0, mid);
      const group2 = nodes.slice(mid);
      const ratio = currentSum / currentTotal;

      if (w >= h) {
        // Split horizontally (cut width)
        const w1 = w * ratio;
        const w2 = w - w1;
        partition(group1, x, y, w1, h);
        partition(group2, x + w1, y, w2, h);
      } else {
        // Split vertically (cut height)
        const h1 = h * ratio;
        const h2 = h - h1;
        partition(group1, x, y, w, h1);
        partition(group2, x, y + h1, w, h2);
      }
    }

    partition(sorted, 0, 0, width, height);
    return layoutResults;
  }, [processedItems, dimensions, totalValue]);

  // Color Style Helper
  const getColorStyle = (val: number) => {
    if (val >= 3) {
      return {
        bgGradient: 'from-emerald-600/90 via-emerald-700/80 to-slate-950',
        borderColor: 'border-emerald-400/80',
        hoverBorder: 'hover:border-emerald-300',
        textColor: 'text-emerald-300',
        badgeBg: 'bg-emerald-950/90 text-emerald-300 border-emerald-400/50',
        glow: 'shadow-[0_0_20px_rgba(16,185,129,0.25)]'
      };
    } else if (val > 0) {
      return {
        bgGradient: 'from-emerald-700/70 via-emerald-900/60 to-slate-950',
        borderColor: 'border-emerald-500/50',
        hoverBorder: 'hover:border-emerald-400',
        textColor: 'text-emerald-300',
        badgeBg: 'bg-emerald-950/80 text-emerald-400 border-emerald-600/40',
        glow: 'shadow-[0_0_12px_rgba(16,185,129,0.15)]'
      };
    } else if (val === 0) {
      return {
        bgGradient: 'from-slate-800/80 via-slate-900/90 to-slate-950',
        borderColor: 'border-slate-700/60',
        hoverBorder: 'hover:border-slate-500',
        textColor: 'text-slate-300',
        badgeBg: 'bg-slate-900 text-slate-400 border-slate-700',
        glow: ''
      };
    } else if (val > -3) {
      return {
        bgGradient: 'from-rose-900/70 via-slate-900/90 to-slate-950',
        borderColor: 'border-rose-600/50',
        hoverBorder: 'hover:border-rose-400',
        textColor: 'text-rose-300',
        badgeBg: 'bg-rose-950/80 text-rose-300 border-rose-700/40',
        glow: 'shadow-[0_0_12px_rgba(244,63,94,0.15)]'
      };
    } else {
      return {
        bgGradient: 'from-red-700/90 via-rose-950/90 to-slate-950',
        borderColor: 'border-rose-500/80',
        hoverBorder: 'hover:border-rose-300',
        textColor: 'text-rose-200',
        badgeBg: 'bg-rose-950/90 text-rose-200 border-rose-500/60',
        glow: 'shadow-[0_0_20px_rgba(239,68,68,0.25)]'
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent, node: NodeItem) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setHoveredNode(node);
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatIDRCompact = (val: number) => {
    if (Math.abs(val) >= 1e9) {
      return `Rp ${(val / 1e9).toFixed(2)}B`;
    }
    if (Math.abs(val) >= 1e6) {
      return `Rp ${(val / 1e6).toFixed(1)}M`;
    }
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-800/80 backdrop-blur-xl shadow-2xl overflow-hidden relative group"
    >
      {/* Background Subtle Accent Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-24 w-96 h-96 bg-[#DFFF00]/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-[#DFFF00]/10 rounded-xl border border-[#DFFF00]/20 text-[#DFFF00]">
              <PieChart className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Portfolio Allocation Treemap</h3>
            <span className="text-[9px] font-black bg-[#DFFF00]/10 text-[#DFFF00] px-2 py-0.5 rounded-full border border-[#DFFF00]/30 uppercase tracking-widest ml-2">
              PRO VISUALIZER
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Asset Block Sizing Scaled by Portfolio Weight & Color-Coded by Daily Performance
          </p>
        </div>

        {/* Filter & Metric Selector Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sizing Metric Switch */}
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-[9px] font-bold uppercase tracking-wider">
            <button
              onClick={() => setSizeMetric('marketValue')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                sizeMetric === 'marketValue' 
                  ? 'bg-slate-800 text-[#DFFF00] shadow-md border border-slate-700/60 font-black' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Market Value
            </button>
            <button
              onClick={() => setSizeMetric('lots')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                sizeMetric === 'lots' 
                  ? 'bg-slate-800 text-[#DFFF00] shadow-md border border-slate-700/60 font-black' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Lots Count
            </button>
            <button
              onClick={() => setSizeMetric('cost')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                sizeMetric === 'cost' 
                  ? 'bg-slate-800 text-[#DFFF00] shadow-md border border-slate-700/60 font-black' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Total Cost
            </button>
          </div>

          {/* Color Metric Switch */}
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-[9px] font-bold uppercase tracking-wider">
            <button
              onClick={() => setColorMetric('dailyChange')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                colorMetric === 'dailyChange' 
                  ? 'bg-slate-800 text-emerald-400 shadow-md border border-slate-700/60 font-black' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              24h Daily %
            </button>
            <button
              onClick={() => setColorMetric('unrealizedPct')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                colorMetric === 'unrealizedPct' 
                  ? 'bg-slate-800 text-blue-400 shadow-md border border-slate-700/60 font-black' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Unrealized P&L %
            </button>
          </div>
        </div>
      </div>

      {/* Market Filter Bar & Heatmap Legend */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 bg-slate-950/50 p-3 rounded-2xl border border-slate-800/80">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(['ALL', 'GAINERS', 'LOSERS', 'IDX', 'GLOBAL'] as const).map(market => (
            <button
              key={market}
              onClick={() => setFilterMarket(market)}
              className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                filterMarket === market
                  ? 'bg-[#DFFF00] text-slate-950 shadow-md'
                  : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              {market === 'ALL' ? 'All Holdings' : market}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[9px] font-mono text-slate-400 self-end sm:self-center">
          <span className="font-bold uppercase text-[8px] text-slate-500">Performance Heatmap:</span>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-rose-400 font-bold">
              <span className="w-2.5 h-2.5 rounded bg-rose-600 inline-block" />
              -3%
            </span>
            <span className="flex items-center gap-1 text-slate-400 font-bold">
              <span className="w-2.5 h-2.5 rounded bg-slate-700 inline-block" />
              0%
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
              +3%+
            </span>
          </div>
        </div>
      </div>

      {/* Main Treemap Canvas Container */}
      <div 
        ref={containerRef}
        className="relative w-full rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner min-h-[350px]"
        style={{ height: `${dimensions.height}px` }}
        onMouseLeave={() => setHoveredNode(null)}
      >
        {rects.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 mb-3 text-slate-500">
              <BarChart2 className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-slate-300 uppercase tracking-wide">No Matching Portfolio Assets</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Try resetting filters or adding holdings to view the interactive treemap block allocation.
            </p>
          </div>
        ) : (
          rects.map((rect, idx) => {
            const metricVal = colorMetric === 'dailyChange' ? rect.item.dailyChange : rect.item.unrealizedPct;
            const style = getColorStyle(metricVal);
            const isHovered = hoveredNode?.id === rect.item.id;
            const isSelected = selectedNode?.id === rect.item.id;

            // Determine label density based on block dimensions
            const isLarge = rect.w > 90 && rect.h > 70;
            const isMedium = rect.w > 50 && rect.h > 40;

            const isPositive = metricVal >= 0;

            return (
              <motion.div
                key={`${rect.item.id}-${idx}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.02 }}
                style={{
                  position: 'absolute',
                  left: `${rect.x}px`,
                  top: `${rect.y}px`,
                  width: `${rect.w - 2}px`,
                  height: `${rect.h - 2}px`,
                }}
                className={`
                  rounded-xl p-2.5 border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between
                  bg-gradient-to-br ${style.bgGradient} ${style.borderColor} ${style.hoverBorder}
                  ${isHovered ? 'z-20 scale-[1.02] shadow-2xl ring-2 ring-[#DFFF00]' : 'z-10'}
                  ${isSelected ? 'ring-2 ring-[#DFFF00]' : ''}
                `}
                onMouseMove={(e) => handleMouseMove(e, rect.item)}
                onClick={() => {
                  setSelectedNode(rect.item);
                  if (onSelectSymbol) {
                    onSelectSymbol(rect.item.ticker);
                  }
                }}
              >
                {/* Top Info Row */}
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono font-black text-xs md:text-sm text-white tracking-tight truncate drop-shadow-sm">
                      {rect.item.ticker.replace('.JK', '')}
                    </span>
                    {isLarge && rect.item.ticker.endsWith('.JK') && (
                      <span className="text-[7px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1 rounded uppercase">
                        IDX
                      </span>
                    )}
                  </div>

                  {/* Weight Badge */}
                  {isMedium && (
                    <span className="text-[9px] font-black font-mono bg-slate-950/80 px-1.5 py-0.5 rounded-md border border-slate-800 text-slate-300 whitespace-nowrap shadow-sm">
                      {rect.weightPct.toFixed(1)}%
                    </span>
                  )}
                </div>

                {/* Center Value / Metrics */}
                <div className="my-auto">
                  {isLarge ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className={`text-xs md:text-sm font-black font-mono tracking-tight ${isPositive ? 'text-emerald-300' : 'text-rose-300'}`}>
                          {isPositive ? '+' : ''}{metricVal.toFixed(2)}%
                        </span>
                        {isPositive ? (
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-slate-300/90 font-bold truncate">
                        {formatIDRCompact(rect.item.marketValue)}
                      </p>
                    </div>
                  ) : isMedium ? (
                    <div className="flex flex-col">
                      <span className={`text-[11px] font-black font-mono ${isPositive ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {isPositive ? '+' : ''}{metricVal.toFixed(1)}%
                      </span>
                      <span className="text-[8px] font-mono text-slate-400 truncate">
                        {formatIDRCompact(rect.item.marketValue)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[9px] font-black font-mono text-white truncate">
                      {isPositive ? '+' : ''}{metricVal.toFixed(0)}%
                    </div>
                  )}
                </div>

                {/* Bottom Lots Info */}
                {isLarge && (
                  <div className="flex items-center justify-between text-[8px] font-mono text-slate-400/90 font-bold pt-1 border-t border-slate-800/40">
                    <span>{rect.item.lots} LOTS</span>
                    <span>Rp {rect.item.currentPrice.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </motion.div>
            );
          })
        )}

        {/* Floating Tooltip Card */}
        <AnimatePresence>
          {hoveredNode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute',
                left: `${Math.min(dimensions.width - 290, Math.max(10, tooltipPos.x + 15))}px`,
                top: `${Math.min(dimensions.height - 210, Math.max(10, tooltipPos.y + 15))}px`,
              }}
              className="pointer-events-none z-50 w-72 bg-slate-950/95 border border-slate-800 p-4 rounded-2xl shadow-2xl backdrop-blur-xl border-l-4 border-l-[#DFFF00]"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-white font-mono">{hoveredNode.ticker}</h4>
                    <span className="text-[8px] font-bold bg-[#DFFF00]/10 text-[#DFFF00] px-2 py-0.5 rounded-full border border-[#DFFF00]/30 uppercase">
                      PORT {((hoveredNode.marketValue / (totalValue || 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">
                    {hoveredNode.lots} Lots ({hoveredNode.lots * 100} Shares)
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-black font-mono block ${hoveredNode.dailyChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {hoveredNode.dailyChange >= 0 ? '+' : ''}{hoveredNode.dailyChange.toFixed(2)}%
                  </span>
                  <span className="text-[8px] text-slate-500 font-bold uppercase">24h Change</span>
                </div>
              </div>

              {/* Grid Metrics */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                  <span className="text-[8px] text-slate-500 font-bold block uppercase">Market Value</span>
                  <span className="font-bold text-white text-xs">{formatIDR(hoveredNode.marketValue)}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                  <span className="text-[8px] text-slate-500 font-bold block uppercase">Current Price</span>
                  <span className="font-bold text-[#DFFF00] text-xs">Rp {hoveredNode.currentPrice.toLocaleString('id-ID')}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                  <span className="text-[8px] text-slate-500 font-bold block uppercase">Average Price</span>
                  <span className="font-bold text-slate-300 text-xs">Rp {Math.round(hoveredNode.averagePrice).toLocaleString('id-ID')}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                  <span className="text-[8px] text-slate-500 font-bold block uppercase">Unrealized P&L</span>
                  <span className={`font-bold text-xs ${hoveredNode.unrealized >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {hoveredNode.unrealized >= 0 ? '+' : ''}{formatIDR(hoveredNode.unrealized)} ({hoveredNode.unrealizedPct.toFixed(1)}%)
                  </span>
                </div>
              </div>

              <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider text-center mt-2.5">
                Click block to open technical chart & stock details
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Details & Shortcuts */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-slate-300 font-bold">Total Holdings: {portfolioData.length}</span>
          </div>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">
            Combined Value: <strong className="text-[#DFFF00]">{formatIDR(totalValue)}</strong>
          </span>
        </div>

        {selectedNode && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onSelectSymbol) onSelectSymbol(selectedNode.ticker);
              }}
              className="px-3 py-1 bg-[#DFFF00] text-slate-950 font-bold rounded-lg text-[9px] uppercase tracking-wider hover:bg-[#cbe600] transition-colors flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              View {selectedNode.ticker} Chart
            </button>
            {onFundamentalAudit && (
              <button
                onClick={() => onFundamentalAudit(selectedNode.ticker)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-[9px] uppercase tracking-wider transition-colors"
              >
                Fundamental Audit
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
