import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PieChart,
  Layers,
  TrendingUp,
  TrendingDown,
  Building2,
  Zap,
  Landmark,
  Cpu,
  HardHat,
  FileCode2,
  ShoppingBag,
  Tv,
  ShieldAlert,
  ChevronRight,
  ChevronDown,
  BarChart3,
  Info,
  Coins,
  Briefcase,
  SlidersHorizontal,
  CheckCircle2,
  Scale
} from 'lucide-react';
import { PortfolioAsset, getAssetCategory } from './GroupedHoldingCards';

interface CategoryExposureCardProps {
  portfolioData: PortfolioAsset[];
  onSelectCategory?: (category: string) => void;
  onSelectSymbol?: (symbol: string) => void;
}

export interface CategorySummary {
  name: string;
  count: number;
  marketValue: number;
  cost: number;
  unrealized: number;
  unrealizedPct: number;
  weightPct: number;
  color: string;
  assets: PortfolioAsset[];
}

const CATEGORY_COLOR_MAP: Record<string, { color: string; border: string; bg: string; text: string }> = {
  'Energy & Mining': { color: '#DFFF00', border: 'border-[#DFFF00]/40', bg: 'bg-[#DFFF00]/10', text: 'text-[#DFFF00]' },
  'Financial Services': { color: '#10b981', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  'Property & Real Estate': { color: '#f59e0b', border: 'border-amber-500/40', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  'Technology & Electronics': { color: '#06b6d4', border: 'border-cyan-500/40', bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  'Industrials & Infrastructure': { color: '#f97316', border: 'border-orange-500/40', bg: 'bg-orange-500/10', text: 'text-orange-400' },
  'Warrants & Derivatives': { color: '#a855f7', border: 'border-purple-500/40', bg: 'bg-purple-500/10', text: 'text-purple-400' },
  'Consumer Goods': { color: '#ec4899', border: 'border-pink-500/40', bg: 'bg-pink-500/10', text: 'text-pink-400' },
  'Media & Entertainment': { color: '#3b82f6', border: 'border-blue-500/40', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  'Sukuk & Obligasi': { color: '#38bdf8', border: 'border-sky-500/40', bg: 'bg-sky-500/10', text: 'text-sky-400' },
  'Private Equity / Saham Private': { color: '#34d399', border: 'border-emerald-400/40', bg: 'bg-emerald-400/10', text: 'text-emerald-300' },
  'Pinjaman Usaha / Direct Loan': { color: '#c084fc', border: 'border-purple-400/40', bg: 'bg-purple-400/10', text: 'text-purple-300' },
  'Equities': { color: '#94a3b8', border: 'border-slate-500/40', bg: 'bg-slate-500/10', text: 'text-slate-300' },
};

const DEFAULT_COLOR_THEME = { color: '#818cf8', border: 'border-indigo-500/40', bg: 'bg-indigo-500/10', text: 'text-indigo-400' };

export const getCategoryIcon = (categoryName: string) => {
  const cat = categoryName.toLowerCase();
  if (cat.includes('property') || cat.includes('real estate')) return <Building2 className="w-4 h-4 text-amber-400" />;
  if (cat.includes('energy') || cat.includes('mining')) return <Zap className="w-4 h-4 text-[#DFFF00]" />;
  if (cat.includes('financial') || cat.includes('banking')) return <Landmark className="w-4 h-4 text-emerald-400" />;
  if (cat.includes('tech') || cat.includes('electronics')) return <Cpu className="w-4 h-4 text-cyan-400" />;
  if (cat.includes('industrial') || cat.includes('infra')) return <HardHat className="w-4 h-4 text-orange-400" />;
  if (cat.includes('warrant') || cat.includes('derivative')) return <FileCode2 className="w-4 h-4 text-purple-400" />;
  if (cat.includes('consumer') || cat.includes('goods')) return <ShoppingBag className="w-4 h-4 text-pink-400" />;
  if (cat.includes('media') || cat.includes('entertainment')) return <Tv className="w-4 h-4 text-blue-400" />;
  if (cat.includes('sukuk') || cat.includes('obligasi') || cat.includes('bond')) return <Coins className="w-4 h-4 text-sky-400" />;
  if (cat.includes('private equity') || cat.includes('saham private')) return <Briefcase className="w-4 h-4 text-emerald-300" />;
  return <PieChart className="w-4 h-4 text-slate-400" />;
};

export const CategoryExposureCard: React.FC<CategoryExposureCardProps> = ({
  portfolioData,
  onSelectCategory,
  onSelectSymbol
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Compute Aggregated Exposures per Category
  const { categorySummaries, totalMarketValue, totalCost, totalUnrealized, concentrationRisk } = useMemo(() => {
    const map: Record<string, { count: number; marketValue: number; cost: number; unrealized: number; assets: PortfolioAsset[] }> = {};

    let totalVal = 0;
    let totalCst = 0;
    let totalUnr = 0;

    portfolioData.forEach(asset => {
      const category = getAssetCategory(asset);
      const price = asset.currentPrice || asset.marketPrice || asset.averagePrice || 0;
      const lots = asset.lots || 0;
      const cost = asset.averagePrice ? asset.averagePrice * lots * 100 : 0;
      const marketVal = asset.marketValue || (price * lots * 100);
      const unrealized = asset.unrealized !== undefined ? asset.unrealized : (marketVal - cost);

      totalVal += marketVal;
      totalCst += cost;
      totalUnr += unrealized;

      if (!map[category]) {
        map[category] = { count: 0, marketValue: 0, cost: 0, unrealized: 0, assets: [] };
      }

      map[category].count += 1;
      map[category].marketValue += marketVal;
      map[category].cost += cost;
      map[category].unrealized += unrealized;
      map[category].assets.push(asset);
    });

    // Build summaries array
    const summaries: CategorySummary[] = Object.keys(map).map(cat => {
      const data = map[cat];
      const weightPct = totalVal > 0 ? (data.marketValue / totalVal) * 100 : 0;
      const unrealizedPct = data.cost > 0 ? (data.unrealized / data.cost) * 100 : 0;
      const theme = CATEGORY_COLOR_MAP[cat] || DEFAULT_COLOR_THEME;

      return {
        name: cat,
        count: data.count,
        marketValue: data.marketValue,
        cost: data.cost,
        unrealized: data.unrealized,
        unrealizedPct,
        weightPct,
        color: theme.color,
        assets: data.assets
      };
    });

    // Sort by marketValue descending
    summaries.sort((a, b) => b.marketValue - a.marketValue);

    // Calculate Concentration Risk
    const topCategory = summaries[0];
    const topWeight = topCategory ? topCategory.weightPct : 0;
    let riskLevel: 'Balanced' | 'Moderate Exposure' | 'High Concentration' = 'Balanced';
    if (topWeight >= 40) riskLevel = 'High Concentration';
    else if (topWeight >= 25) riskLevel = 'Moderate Exposure';

    return {
      categorySummaries: summaries,
      totalMarketValue: totalVal,
      totalCost: totalCst,
      totalUnrealized: totalUnr,
      concentrationRisk: {
        level: riskLevel,
        topCategoryName: topCategory ? topCategory.name : 'N/A',
        topCategoryWeight: topWeight
      }
    };
  }, [portfolioData]);

  if (portfolioData.length === 0) {
    return (
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 text-center space-y-2">
        <Layers className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
        <p className="text-xs font-bold text-slate-400">Tidak Ada Data Exposure</p>
        <p className="text-[10px] text-slate-500">Tambahkan atau impor posisi portofolio untuk melihat ringkasan eksposur kategori.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-5 relative overflow-hidden"
    >
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#DFFF00]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10 border-b border-slate-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#DFFF00]/10 rounded-lg border border-[#DFFF00]/30 text-[#DFFF00]">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono font-bold text-[#DFFF00] uppercase tracking-widest">
              AGGREGATED CATEGORY EXPOSURE
            </span>
          </div>
          <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
            Eksposur &amp; Alokasi Kategori Aset
          </h3>
          <p className="text-[11px] text-slate-400 leading-snug">
            Distribusi total nilai pasar dan tingkat konsentrasi risiko berdasarkan {categorySummaries.length} sektor/kategori aset aktif.
          </p>
        </div>

        {/* Top Controls & Risk Status */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Concentration Status Badge */}
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-mono font-bold ${
            concentrationRisk.level === 'High Concentration'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : concentrationRisk.level === 'Moderate Exposure'
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          }`}>
            {concentrationRisk.level === 'High Concentration' ? (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Scale className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <div className="flex flex-col text-left">
              <span className="text-[8px] uppercase tracking-wider text-slate-400 leading-none">Concentration Risk</span>
              <span className="text-[10px]">{concentrationRisk.level} ({concentrationRisk.topCategoryWeight.toFixed(1)}% in {concentrationRisk.topCategoryName})</span>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                viewMode === 'cards'
                  ? 'bg-slate-800 text-[#DFFF00] shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cards View
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                viewMode === 'table'
                  ? 'bg-slate-800 text-[#DFFF00] shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Table View
            </button>
          </div>
        </div>
      </div>

      {/* Visual Multi-Segment Exposure Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 uppercase">
          <span>PORTFOLIO ALLOCATION BREAKDOWN</span>
          <span>TOTAL: 100%</span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="h-4 w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex p-0.5 gap-0.5">
          {categorySummaries.map(cat => {
            if (cat.weightPct <= 0) return null;
            return (
              <div
                key={cat.name}
                style={{
                  width: `${cat.weightPct}%`,
                  backgroundColor: cat.color
                }}
                className="h-full rounded-sm transition-all duration-300 hover:opacity-80 relative group cursor-pointer"
                onClick={() => {
                  setExpandedCategory(expandedCategory === cat.name ? null : cat.name);
                  if (onSelectCategory) onSelectCategory(cat.name);
                }}
                title={`${cat.name}: ${cat.weightPct.toFixed(1)}%`}
              />
            );
          })}
        </div>

        {/* Legend Pills */}
        <div className="flex items-center gap-x-4 gap-y-2 flex-wrap pt-1 text-xs font-mono">
          {categorySummaries.map(cat => {
            const isExpanded = expandedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => {
                  setExpandedCategory(isExpanded ? null : cat.name);
                  if (onSelectCategory) onSelectCategory(cat.name);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  isExpanded
                    ? 'bg-slate-800 border-[#DFFF00]/50 text-white shadow'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="font-sans font-bold text-[11px] text-slate-200">{cat.name}</span>
                <span className="text-[10px] font-mono text-[#DFFF00] font-bold">
                  {cat.weightPct.toFixed(1)}%
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  ({cat.count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW MODE 1: CARDS GRID */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categorySummaries.map(cat => {
            const isExpanded = expandedCategory === cat.name;
            const theme = CATEGORY_COLOR_MAP[cat.name] || DEFAULT_COLOR_THEME;
            const isPositive = cat.unrealized >= 0;

            return (
              <div
                key={cat.name}
                className={`bg-slate-950/80 p-4 rounded-xl border transition-all space-y-3 flex flex-col justify-between ${
                  isExpanded
                    ? 'border-[#DFFF00] bg-slate-900 shadow-2xl'
                    : `${theme.border} hover:border-slate-700`
                }`}
              >
                <div>
                  {/* Category Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${theme.bg} ${theme.text}`}>
                        {getCategoryIcon(cat.name)}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white font-sans leading-tight">{cat.name}</h4>
                        <span className="text-[9px] font-mono text-slate-400">
                          {cat.count} {cat.count === 1 ? 'Holding' : 'Holdings'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                        style={{
                          backgroundColor: `${cat.color}15`,
                          borderColor: `${cat.color}40`,
                          color: cat.color
                        }}
                      >
                        {cat.weightPct.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Allocation % & Return % */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 font-mono">
                    <div>
                      <p className="text-[9px] uppercase text-slate-500 font-bold">Porsi Alokasi</p>
                      <p className="text-sm font-black text-[#DFFF00]">
                        {cat.weightPct.toFixed(1)}%
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[9px] uppercase text-slate-500 font-bold">Return Kategori</p>
                      <p className={`text-xs font-bold flex items-center justify-end gap-1 ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isPositive ? '+' : ''}{cat.unrealizedPct.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Mini Progress Bar */}
                  <div className="mt-2.5">
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, cat.weightPct)}%`,
                          backgroundColor: cat.color
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Toggle Holdings */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : cat.name)}
                    className="text-[10px] font-mono text-slate-400 hover:text-[#DFFF00] flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <span>{isExpanded ? 'Sembunyikan Posisi' : 'Rincian Posisi'} ({cat.assets.length})</span>
                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>

                  <span className="text-[9px] font-mono text-slate-500">
                    {cat.count} {cat.count === 1 ? 'Aset' : 'Aset'}
                  </span>
                </div>

                {/* Expanded Ticker List inside Card */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-2 space-y-1.5 border-t border-slate-800"
                    >
                      {cat.assets.map(asset => {
                        const cleanTicker = asset.ticker.replace('.JK', '');
                        const val = asset.marketValue || ((asset.currentPrice || asset.marketPrice || 0) * (asset.lots || 0) * 100);
                        const assetCost = (asset.averagePrice || 0) * (asset.lots || 0) * 100;
                        const pl = asset.unrealized !== undefined ? asset.unrealized : (val - assetCost);
                        const isPos = pl >= 0;

                        return (
                          <div
                            key={asset.ticker}
                            onClick={() => onSelectSymbol && onSelectSymbol(cleanTicker)}
                            className="p-2 bg-slate-900/90 rounded-lg border border-slate-800/80 flex items-center justify-between hover:border-[#DFFF00]/40 transition-all cursor-pointer font-mono text-[11px]"
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#DFFF00]">{cleanTicker}</span>
                                <span className="text-[9px] text-slate-400 font-sans">({asset.lots} lots)</span>
                              </div>
                              <p className="text-[9px] text-slate-500">
                                Avg: Rp {(asset.averagePrice || 0).toLocaleString('id-ID')} | Mkt: Rp {(asset.currentPrice || asset.marketPrice || 0).toLocaleString('id-ID')}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="font-bold text-white">Rp {val.toLocaleString('id-ID')}</p>
                              <p className={`text-[9px] font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isPos ? '+' : ''}Rp {pl.toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      ) : (
        /* VIEW MODE 2: COMPACT TABLE */
        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-900/90 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">Kategori Aset</th>
                  <th className="p-3 text-center">Jumlah Posisi</th>
                  <th className="p-3 text-right">Bobot Portfolio (%)</th>
                  <th className="p-3 text-right">Return Kategori (%)</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {categorySummaries.map(cat => {
                  const isPos = cat.unrealized >= 0;
                  const isExpanded = expandedCategory === cat.name;

                  return (
                    <React.Fragment key={cat.name}>
                      <tr className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <div className="flex items-center gap-1.5 font-sans font-bold text-white text-xs">
                              {getCategoryIcon(cat.name)}
                              <span>{cat.name}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 text-center text-slate-300 font-bold">
                          {cat.count}
                        </td>

                        <td className="p-3 text-right font-bold text-[#DFFF00]">
                          {cat.weightPct.toFixed(1)}%
                        </td>

                        <td className="p-3 text-right">
                          <span className={`font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPos ? '+' : ''}{cat.unrealizedPct.toFixed(1)}%
                          </span>
                        </td>

                        <td className="p-3 text-center">
                          <button
                            onClick={() => setExpandedCategory(isExpanded ? null : cat.name)}
                            className="p-1 text-slate-400 hover:text-[#DFFF00] hover:bg-slate-800 rounded transition-colors cursor-pointer"
                            title="Toggle Holdings Details"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Row for Table View */}
                      {isExpanded && (
                        <tr className="bg-slate-900/90">
                          <td colSpan={5} className="p-3 border-y border-slate-800">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Holdings dalam Kategori: {cat.name}
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {cat.assets.map(asset => {
                                  const cleanTicker = asset.ticker.replace('.JK', '');
                                  const val = asset.marketValue || ((asset.currentPrice || asset.marketPrice || 0) * (asset.lots || 0) * 100);
                                  return (
                                    <div
                                      key={asset.ticker}
                                      onClick={() => onSelectSymbol && onSelectSymbol(cleanTicker)}
                                      className="p-2 bg-slate-950 rounded border border-slate-800 flex items-center justify-between text-[11px] hover:border-[#DFFF00]/50 transition-all cursor-pointer"
                                    >
                                      <div>
                                        <span className="font-bold text-[#DFFF00]">{cleanTicker}</span>
                                        <p className="text-[9px] text-slate-400">{asset.lots} lots @ Rp {(asset.averagePrice || 0).toLocaleString('id-ID')}</p>
                                      </div>
                                      <p className="font-bold text-white text-right">Rp {val.toLocaleString('id-ID')}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CategoryExposureCard;
