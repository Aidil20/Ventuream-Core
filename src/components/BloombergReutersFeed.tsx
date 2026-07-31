import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, RefreshCw, ExternalLink, Flame, BrainCircuit, ChevronDown, ChevronUp, Sparkles, AlertCircle, Filter, Zap } from 'lucide-react';
import { fetchBloombergReutersHeadlines, type BloombergReutersHeadline } from '../services/marketService';

export const BloombergReutersFeed: React.FC<{ onSelectSymbol?: (symbol: string) => void }> = ({ onSelectSymbol }) => {
  const [headlines, setHeadlines] = useState<BloombergReutersHeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'BLOOMBERG' | 'REUTERS'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const loadHeadlines = async (force = false) => {
    if (force) setIsRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchBloombergReutersHeadlines(force);
      setHeadlines(data);
      setLastUpdated(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error("[BR WIRE] Error loading headlines:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadHeadlines();
    const interval = setInterval(() => loadHeadlines(true), 180000); // 3 mins auto-sync
    return () => clearInterval(interval);
  }, []);

  const categories = ['ALL', 'Markets & Equities', 'Geopolitics & Energy', 'Central Banks & Rates', 'M&A & Corporate', 'FX & Commodities'];

  const filteredHeadlines = headlines.filter(h => {
    // Source filter
    if (sourceFilter === 'BLOOMBERG' && !h.source.toLowerCase().includes('bloomberg')) return false;
    if (sourceFilter === 'REUTERS' && !h.source.toLowerCase().includes('reuters')) return false;

    // Category filter
    if (categoryFilter !== 'ALL' && !h.category.toLowerCase().includes(categoryFilter.toLowerCase())) return false;

    return true;
  });

  const criticalHeadlines = headlines.filter(h => h.impactLevel === 'CRITICAL');
  const marqueeText = criticalHeadlines.length > 0 
    ? criticalHeadlines.map(c => `${c.source.toUpperCase()}: ${c.headline}`).join('  —  ')
    : headlines.slice(0, 3).map(c => `${c.source.toUpperCase()}: ${c.headline}`).join('  —  ');

  return (
    <div className="bg-zinc-950/80 rounded-2xl border border-zinc-800/70 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Ticker marquee for top breaking news */}
      <div className="bg-gradient-to-r from-amber-950/60 via-zinc-900/90 to-orange-950/60 border-b border-zinc-800/80 px-4 py-2 flex items-center gap-3 overflow-hidden">
        <div className="flex items-center gap-1.5 shrink-0 bg-red-950/90 border border-red-500/40 px-2 py-0.5 rounded text-[9px] font-black text-red-400 tracking-wider animate-pulse">
          <Flame className="w-3 h-3 text-red-400" />
          BREAKING WIRE
        </div>
        <div className="overflow-hidden whitespace-nowrap w-full">
          <div className="inline-block animate-marquee text-[11px] font-mono text-zinc-300">
            {marqueeText}
          </div>
        </div>
      </div>

      {/* Control Header */}
      <div className="p-4 sm:p-5 border-b border-zinc-850 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/40">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#deff9a]" />
              Bloomberg & Reuters Live Module
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-[#deff9a]/10 border border-[#deff9a]/30 text-[#deff9a] text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-[#deff9a]" />
              Gemini Grounded
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wider font-mono">
            Curated high-impact international financial wire feed • Real-time AI Sentiment & Strategic Impact Analysis
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {lastUpdated && (
            <span className="text-[9px] font-mono text-zinc-500 hidden sm:inline">
              Synced: <span className="text-zinc-300 font-bold">{lastUpdated}</span>
            </span>
          )}

          <button
            onClick={() => loadHeadlines(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-zinc-300 hover:text-white text-[10px] font-bold uppercase transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#deff9a]' : ''}`} />
            {isRefreshing ? 'Syncing...' : 'Refresh Wire'}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-zinc-950/90 border-b border-zinc-850/60 flex flex-wrap items-center justify-between gap-3">
        {/* Source Pills */}
        <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
          <span className="text-[9px] font-black text-zinc-500 uppercase px-2 flex items-center gap-1">
            <Filter className="w-2.5 h-2.5" /> Source:
          </span>
          {(['ALL', 'BLOOMBERG', 'REUTERS'] as const).map(src => {
            const isActive = sourceFilter === src;
            return (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg transition-all ${
                  isActive
                    ? src === 'BLOOMBERG' 
                      ? 'bg-amber-500 text-black font-extrabold shadow-md'
                      : src === 'REUTERS'
                      ? 'bg-orange-500 text-black font-extrabold shadow-md'
                      : 'bg-[#deff9a] text-black font-extrabold shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {src}
              </button>
            );
          })}
        </div>

        {/* Category selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
          {categories.map(cat => {
            const isActive = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`text-[9px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg border shrink-0 transition-all ${
                  isActive
                    ? 'bg-zinc-800 border-[#deff9a]/50 text-[#deff9a]'
                    : 'bg-zinc-950/60 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed list */}
      <div className="p-4 sm:p-5 space-y-3 max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-28 bg-zinc-900/50 rounded-xl animate-pulse border border-zinc-850" />
            ))}
          </div>
        ) : filteredHeadlines.length === 0 ? (
          <div className="py-12 text-center text-zinc-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
            <p className="text-xs font-mono font-bold uppercase">No matching headlines found</p>
            <button
              onClick={() => { setSourceFilter('ALL'); setCategoryFilter('ALL'); }}
              className="mt-2 text-[10px] text-[#deff9a] underline font-mono"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredHeadlines.map((h, index) => {
            const isExpanded = expandedId === h.id;
            const isBloomberg = h.source.toLowerCase().includes('bloomberg');
            const isReuters = h.source.toLowerCase().includes('reuters');

            const impactBadgeColor = 
              h.impactLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/40' :
              h.impactLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' :
              'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';

            const sentimentColor = 
              h.sentiment === 'bullish' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
              h.sentiment === 'bearish' ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' :
              'text-zinc-400 bg-zinc-800/40 border-zinc-700/40';

            return (
              <motion.div
                key={h.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-xl border transition-all ${
                  isExpanded
                    ? 'bg-zinc-900/90 border-[#deff9a]/40 shadow-xl'
                    : 'bg-zinc-900/30 border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900/50'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Source Badge */}
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                      isBloomberg ? 'bg-amber-500/15 text-amber-400 border-amber-500/40' :
                      isReuters ? 'bg-orange-500/15 text-orange-400 border-orange-500/40' :
                      'bg-zinc-800 text-zinc-300 border-zinc-700'
                    }`}>
                      {h.source}
                    </span>

                    {/* Impact Badge */}
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${impactBadgeColor}`}>
                      {h.impactLevel} IMPACT
                    </span>

                    {/* Category */}
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">
                      {h.category}
                    </span>
                  </div>

                  {/* Timestamp & Score */}
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${sentimentColor}`}>
                      {h.sentiment.toUpperCase()} ({h.impactScore}%)
                    </span>
                    <span className="text-[9px] text-zinc-500 font-mono">
                      {h.timestamp}
                    </span>
                  </div>
                </div>

                {/* Headline Title */}
                <h4 className="text-sm font-bold text-white leading-snug group-hover:text-[#deff9a] transition-colors">
                  {h.headline}
                </h4>

                {/* Summary */}
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed font-sans">
                  {h.summary}
                </p>

                {/* Related Symbols & AI Analysis toggle */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-zinc-850">
                  {/* Symbol chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[8px] font-black text-zinc-500 uppercase">Tickers:</span>
                    {h.relatedSymbols && h.relatedSymbols.map((sym, i) => (
                      <button
                        key={i}
                        onClick={() => onSelectSymbol && onSelectSymbol(sym)}
                        className="px-2 py-0.5 rounded bg-zinc-950 hover:bg-[#deff9a]/20 border border-zinc-800 hover:border-[#deff9a]/50 text-[9px] font-mono font-bold text-zinc-300 hover:text-[#deff9a] transition-all"
                      >
                        ${sym}
                      </button>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {h.url && (
                      <a
                        href={h.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] font-mono font-bold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Source Link
                      </a>
                    )}

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : h.id)}
                      className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-all ${
                        isExpanded 
                          ? 'bg-[#deff9a] text-black border-[#deff9a]' 
                          : 'bg-zinc-950 text-zinc-300 hover:text-white border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <BrainCircuit className="w-3 h-3" />
                      {isExpanded ? 'Hide AI Takeaway' : 'AI Analysis'}
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Expanded AI Analysis Box */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 overflow-hidden"
                    >
                      <div className="p-3.5 rounded-xl bg-zinc-950 border border-[#deff9a]/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-[#deff9a] uppercase tracking-widest flex items-center gap-1.5">
                            <Zap className="w-3 h-3 text-[#deff9a]" />
                            Institutional Strategic Takeaway (Gemini Grounded Engine)
                          </span>
                          <span className="text-[8px] font-mono text-zinc-500 uppercase">Impact Score: {h.impactScore}/100</span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                          {h.aiAnalysis}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BloombergReutersFeed;
