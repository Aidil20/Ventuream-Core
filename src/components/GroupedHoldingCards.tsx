import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, 
  ChevronRight, 
  Building2, 
  Zap, 
  Landmark, 
  Cpu, 
  HardHat, 
  FileCode2, 
  ShoppingBag, 
  Tv, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  ChevronsUpDown, 
  Search, 
  SlidersHorizontal,
  FolderOpen
} from 'lucide-react';
import HoldingCard from './HoldingCard';

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
  category?: string;
  type?: string;
  sector?: string;
  performance?: number[];
}

interface GroupedHoldingCardsProps {
  portfolioData: PortfolioAsset[];
  onAssetClick?: (asset: PortfolioAsset) => void;
  alertThresholds?: Record<string, { targetPrice: number; type: 'above' | 'below'; active: boolean }>;
  onSaveAlert?: (ticker: string, targetPrice: number, type: 'above' | 'below', active: boolean) => void;
  selectedTickers?: string[];
  onSelectToggle?: (ticker: string) => void;
  layoutMode?: 'single' | 'grid';
}

// Category Mapping helper
export const getAssetCategory = (asset: PortfolioAsset): string => {
  if (asset.category) return asset.category;
  if (asset.sector) return asset.sector;
  
  const cleanTicker = asset.ticker.replace('.JK', '').toUpperCase();

  // Check warrants / derivatives first
  if (cleanTicker.endsWith('-W') || cleanTicker.includes('-R') || cleanTicker.endsWith('-W2')) {
    return 'Warrants & Derivatives';
  }

  const staticCategoryMap: Record<string, string> = {
    'DSSA': 'Energy & Mining',
    'PRDL': 'Energy & Mining',
    'DEFI': 'Financial Services',
    'BACH': 'Financial Services',
    'LPKR': 'Property & Real Estate',
    'OTAS': 'Property & Real Estate',
    'ANDI': 'Property & Real Estate',
    'IPAC': 'Property & Real Estate',
    'KOTA': 'Property & Real Estate',
    'LAND': 'Property & Real Estate',
    'JECX': 'Technology & Electronics',
    'CTTH': 'Technology & Electronics',
    'PIPA': 'Industrials & Infrastructure',
    'EMMI': 'Consumer Goods',
    'RANS': 'Media & Entertainment',
  };

  if (staticCategoryMap[cleanTicker]) {
    return staticCategoryMap[cleanTicker];
  }

  if (asset.type === 'Property' || asset.type === 'Real Estate') return 'Property & Real Estate';
  if (asset.type === 'Financial') return 'Financial Services';
  if (asset.type === 'Energy') return 'Energy & Mining';

  return 'Equities';
};

// Category Icon Helper
const getCategoryIcon = (categoryName: string) => {
  const cat = categoryName.toLowerCase();
  if (cat.includes('property') || cat.includes('real estate')) return <Building2 className="w-4 h-4 text-amber-400" />;
  if (cat.includes('energy') || cat.includes('mining') || cat.includes('resource')) return <Zap className="w-4 h-4 text-[#DFFF00]" />;
  if (cat.includes('financial') || cat.includes('banking')) return <Landmark className="w-4 h-4 text-emerald-400" />;
  if (cat.includes('tech') || cat.includes('electronics')) return <Cpu className="w-4 h-4 text-cyan-400" />;
  if (cat.includes('industrial') || cat.includes('infra')) return <HardHat className="w-4 h-4 text-orange-400" />;
  if (cat.includes('warrant') || cat.includes('derivative')) return <FileCode2 className="w-4 h-4 text-purple-400" />;
  if (cat.includes('consumer') || cat.includes('goods')) return <ShoppingBag className="w-4 h-4 text-pink-400" />;
  if (cat.includes('media') || cat.includes('entertainment')) return <Tv className="w-4 h-4 text-blue-400" />;
  return <PieChart className="w-4 h-4 text-slate-400" />;
};

export default function GroupedHoldingCards({
  portfolioData,
  onAssetClick,
  alertThresholds = {},
  onSaveAlert,
  selectedTickers = [],
  onSelectToggle,
  layoutMode = 'single'
}: GroupedHoldingCardsProps) {
  const [groupBy, setGroupBy] = useState<'category' | 'type' | 'performance' | 'flat'>('category');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Total Portfolio Market Value
  const totalPortfolioValue = useMemo(() => {
    return portfolioData.reduce((acc, curr) => acc + (curr.marketValue || 0), 0);
  }, [portfolioData]);

  // Group items by selected mode
  const groupedData = useMemo(() => {
    const filtered = portfolioData.filter(asset => {
      if (!searchQuery) return true;
      const clean = asset.ticker.replace('.JK', '').toLowerCase();
      const cat = getAssetCategory(asset).toLowerCase();
      const q = searchQuery.toLowerCase();
      return clean.includes(q) || cat.includes(q);
    });

    const groups: Record<string, PortfolioAsset[]> = {};

    filtered.forEach(asset => {
      let groupKey = 'Equities';
      if (groupBy === 'category') {
        groupKey = getAssetCategory(asset);
      } else if (groupBy === 'type') {
        if (asset.ticker.includes('-W')) groupKey = 'Warrants & Derivatives';
        else if (asset.type) groupKey = asset.type;
        else groupKey = 'Equities';
      } else if (groupBy === 'performance') {
        const unrealized = asset.unrealized || 0;
        if (unrealized > 0) groupKey = 'Gainers (In Profit)';
        else if (unrealized < 0) groupKey = 'Losers (In Loss)';
        else groupKey = 'Neutral (Break Even)';
      } else {
        groupKey = 'All Portfolio Holdings';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(asset);
    });

    return groups;
  }, [portfolioData, groupBy, searchQuery]);

  const categoryKeys = Object.keys(groupedData);

  // Toggle Collapse State for a specific category
  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  // Expand All / Collapse All
  const expandAll = () => setCollapsedCategories({});
  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    categoryKeys.forEach(cat => {
      next[cat] = true;
    });
    setCollapsedCategories(next);
  };

  const isAllCollapsed = categoryKeys.length > 0 && categoryKeys.every(cat => collapsedCategories[cat]);

  const formatIDR = (val: number) => {
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  return (
    <div className="space-y-4 w-full">
      {/* Control Bar: Search, Group By Selector, Expand/Collapse All */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 backdrop-blur-md">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search holdings or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 text-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:border-[#DFFF00]/50 transition-colors placeholder:text-slate-600 font-mono"
          />
        </div>

        {/* Grouping Mode Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <div className="flex bg-slate-950/90 p-1 rounded-xl border border-slate-800 text-[9px] font-bold uppercase tracking-wider">
            <button
              onClick={() => setGroupBy('category')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                groupBy === 'category'
                  ? 'bg-slate-800 text-[#DFFF00] border border-slate-700/60 font-black shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <FolderOpen className="w-3 h-3" />
              Category
            </button>
            <button
              onClick={() => setGroupBy('performance')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                groupBy === 'performance'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700/60 font-black shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              P&L Status
            </button>
            <button
              onClick={() => setGroupBy('flat')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                groupBy === 'flat'
                  ? 'bg-slate-800 text-slate-200 border border-slate-700/60 font-black shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Layers className="w-3 h-3" />
              Flat List
            </button>
          </div>

          {/* Expand / Collapse All Toggle */}
          {groupBy !== 'flat' && (
            <button
              onClick={isAllCollapsed ? expandAll : collapseAll}
              className="px-2.5 py-1.5 bg-slate-950/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-800 text-[9px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 whitespace-nowrap"
              title={isAllCollapsed ? 'Expand All Groups' : 'Collapse All Groups'}
            >
              <ChevronsUpDown className="w-3 h-3 text-slate-400" />
              {isAllCollapsed ? 'Expand All' : 'Collapse All'}
            </button>
          )}
        </div>
      </div>

      {/* Category Groups List */}
      {categoryKeys.length === 0 ? (
        <div className="bg-slate-900/40 p-8 rounded-2xl border border-slate-800 text-center text-slate-500">
          <p className="text-xs font-bold uppercase tracking-wider">No holdings found matching search query</p>
        </div>
      ) : (
        categoryKeys.map((category, catIdx) => {
          const assets = groupedData[category];
          const isCollapsed = Boolean(collapsedCategories[category]);

          // Compute Category Metrics
          const categoryMarketValue = assets.reduce((sum, a) => sum + (a.marketValue || 0), 0);
          const categoryTotalCost = assets.reduce((sum, a) => sum + ((a.averagePrice || 0) * (a.lots || 0) * 100), 0);
          const categoryUnrealized = assets.reduce((sum, a) => sum + (a.unrealized || 0), 0);
          const categoryUnrealizedPct = categoryTotalCost > 0 ? (categoryUnrealized / categoryTotalCost) * 100 : 0;
          const portfolioWeight = totalPortfolioValue > 0 ? (categoryMarketValue / totalPortfolioValue) * 100 : 0;
          const totalLots = assets.reduce((sum, a) => sum + (a.lots || 0), 0);

          return (
            <div key={category} className="space-y-2">
              {/* Collapsible Category Header (Hidden if groupBy === 'flat') */}
              {groupBy !== 'flat' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: catIdx * 0.03 }}
                  onClick={() => toggleCategory(category)}
                  className="bg-slate-900/80 hover:bg-slate-850 p-3.5 px-4 rounded-2xl border border-slate-800/90 shadow-md cursor-pointer transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-3 group border-l-4 border-l-[#DFFF00]"
                >
                  {/* Left Title & Icon */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800 group-hover:border-slate-700 transition-colors">
                      {getCategoryIcon(category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white font-mono tracking-wide">{category}</h4>
                        <span className="text-[9px] font-black bg-slate-950 text-slate-400 px-2 py-0.5 rounded-full border border-slate-800 font-mono">
                          {assets.length} {assets.length === 1 ? 'Holding' : 'Holdings'} ({totalLots} Lots)
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                        Allocation Weight: <span className="text-slate-300 font-mono">{portfolioWeight.toFixed(1)}%</span> of Portfolio
                      </p>
                    </div>
                  </div>

                  {/* Right Category Subtotals & Collapse Chevron */}
                  <div className="flex items-center justify-between md:justify-end gap-4 text-xs font-mono">
                    <div className="text-left md:text-right">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Group Value</p>
                      <p className="font-black text-[#DFFF00] text-sm">{formatIDR(categoryMarketValue)}</p>
                    </div>

                    <div className="text-left md:text-right hidden sm:block">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Unrealized P&L</p>
                      <p className={`font-bold text-xs ${categoryUnrealized >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {categoryUnrealized >= 0 ? '+' : ''}{formatIDR(categoryUnrealized)} ({categoryUnrealizedPct >= 0 ? '+' : ''}{categoryUnrealizedPct.toFixed(1)}%)
                      </p>
                    </div>

                    <div className="p-1.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-400 group-hover:text-white transition-colors">
                      {isCollapsed ? <ChevronRight className="w-4 h-4 text-[#DFFF00]" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Category Holdings Cards Grid / List */}
              <AnimatePresence initial={false}>
                {(!isCollapsed || groupBy === 'flat') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className={layoutMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 pl-1 md:pl-2' : 'space-y-3 pt-1 pl-1 md:pl-2'}>
                      {assets.map((asset, idx) => (
                        <HoldingCard
                          key={`${asset.ticker}-${idx}`}
                          asset={asset}
                          idx={idx}
                          onClick={() => onAssetClick && onAssetClick(asset)}
                          alertConfig={alertThresholds[asset.ticker]}
                          onSaveAlert={onSaveAlert}
                          selected={selectedTickers.includes(asset.ticker)}
                          onSelectToggle={onSelectToggle ? () => onSelectToggle(asset.ticker) : undefined}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })
      )}
    </div>
  );
}
