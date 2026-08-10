import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X, FileText, Newspaper, TrendingUp, ArrowRight, Loader2, Command, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { searchAsset, AssetSearchInfo, formatCurrencyByMarket } from '../services/marketService';
import { fetchMarketNewsSummary, MarketNewsItem } from '../services/geminiService';

interface SearchResult {
  id: string;
  type: 'asset' | 'news' | 'report';
  title: string;
  subtitle: string;
  metadata?: any;
}

export const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Mock reports based on FinancialReportingCenter
  const REPORTS = [
    { id: 'BS', title: 'Consolidated Balance Sheet', subtitle: 'Financial Position Report (PSAK 71)' },
    { id: 'PL', title: 'Comprehensive Income Statement', subtitle: 'Profit & Loss Report (PSAK 1)' },
    { id: 'CF', title: 'Cash Flow Statement', subtitle: 'Automated Cash Flow (PSAK 2)' },
    { id: 'AR', title: 'Annual Report 2025', subtitle: 'Institutional Grade Audit' },
    { id: 'SR', title: 'Sustainability Report', subtitle: 'ESG Compliance Disclosure' }
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults(prev => prev.length === 0 ? prev : []);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const [assets, newsList] = await Promise.all([
          searchAsset(query).catch(() => []),
          fetchMarketNewsSummary(false).catch(() => [])
        ]);

        const assetResults: SearchResult[] = assets.map((a: AssetSearchInfo) => ({
          id: `asset-${a.symbol}`,
          type: 'asset' as const,
          title: a.symbol,
          subtitle: a.name,
          metadata: a
        }));

        const newsResults: SearchResult[] = newsList
          .filter((n: MarketNewsItem) => 
            n.headline.toLowerCase().includes(query.toLowerCase()) || 
            n.summary.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 5)
          .map((n: MarketNewsItem) => ({
            id: `news-${n.headline}-${n.timestamp || Date.now()}`,
            type: 'news' as const,
            title: n.headline,
            subtitle: n.source || 'Market Intelligence',
            metadata: n
          }));

        const reportResults: SearchResult[] = REPORTS
          .filter(r => 
            r.title.toLowerCase().includes(query.toLowerCase()) || 
            r.subtitle.toLowerCase().includes(query.toLowerCase())
          )
          .map(r => ({
            id: `report-${r.id}`,
            type: 'report' as const,
            title: r.title,
            subtitle: r.subtitle
          }));

        const combinedResults = [...assetResults, ...newsResults, ...reportResults];
        // Deduplicate results by ID to prevent duplicate key errors
        const uniqueResults = combinedResults.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        setResults(uniqueResults);
      } catch (err) {
        console.error("Global search failed:", err);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1 max-w-md mx-6" ref={searchRef}>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-[#11141b] border border-white/5 rounded-xl px-4 py-2 flex items-center justify-between text-zinc-500 hover:border-[#deff9a]/20 transition-all group"
      >
        <div className="flex items-center gap-3">
          <SearchIcon className="w-4 h-4 group-hover:text-[#deff9a] transition-colors" />
          <span className="text-[11px] font-bold uppercase tracking-widest">Global Terminal Search...</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
          <Command className="w-3 h-3" />
          <span className="text-[10px] font-black">K</span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#0c0f14] border border-zinc-800 rounded-2xl shadow-2xl z-[100] overflow-hidden backdrop-blur-xl"
          >
            <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
              <SearchIcon className="w-4 h-4 text-[#deff9a]" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find asset, intelligence, or report..."
                className="bg-transparent border-none outline-none text-white text-sm font-medium w-full placeholder:text-zinc-700"
              />
              {isLoading && <Loader2 className="w-4 h-4 text-[#deff9a] animate-spin" />}
              <button 
                onClick={() => {
                  setIsOpen(false);
                  setQuery('');
                }}
                className="text-zinc-600 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-hide">
              {query === '' ? (
                 <div className="p-4 text-center">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 text-left px-2">Popular Inquiries</p>
                    <div className="flex flex-wrap gap-2">
                       {['BBCA', 'Interest Rates', 'Financial Report', 'M&A Deal'].map(tag => (
                         <button 
                          key={tag}
                          onClick={() => setQuery(tag)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/5 text-[9px] font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                         >
                           {tag}
                         </button>
                       ))}
                    </div>
                 </div>
              ) : results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((result) => (
                    <button
                      key={result.id}
                      className="w-full text-left p-3 rounded-xl hover:bg-zinc-900 border border-transparent hover:border-white/5 transition-all group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          result.type === 'asset' ? 'bg-emerald-500/10 text-emerald-500' :
                          result.type === 'news' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-amber-500/10 text-amber-500'
                        }`}>
                          {result.type === 'asset' ? <TrendingUp className="w-4 h-4" /> :
                           result.type === 'news' ? <Newspaper className="w-4 h-4" /> :
                           <FileText className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-white">{result.title}</h4>
                            <span className="text-[8px] font-black uppercase px-1 py-0.5 rounded bg-zinc-800 text-zinc-500 tracking-tighter">
                              {result.type}
                            </span>
                            {result.type === 'asset' && result.metadata?.market && (
                              <span className="text-[7px] font-black uppercase px-1 py-0.5 rounded bg-[#deff9a]/10 text-[#deff9a] tracking-tighter">
                                {result.metadata.market}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-bold text-zinc-500 line-clamp-1">{result.subtitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {result.type === 'asset' && result.metadata && (
                          <div className="text-right">
                            <p className="text-xs font-black text-white">
                              {formatCurrencyByMarket(result.metadata.price, result.metadata.symbol, result.metadata.market, result.metadata.currency)}
                            </p>
                            {typeof result.metadata.changePercent === 'number' && (
                              <p className={`text-[10px] font-bold ${result.metadata.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {result.metadata.changePercent > 0 ? '+' : ''}{result.metadata.changePercent}%
                              </p>
                            )}
                          </div>
                        )}
                        <ArrowRight className="w-4 h-4 text-zinc-800 group-hover:text-[#deff9a] group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : !isLoading ? (
                <div className="p-8 text-center">
                  <Activity className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
                  <p className="text-zinc-500 text-[10px] font-bold uppercase">No institutional matches found for "{query}"</p>
                </div>
              ) : null}
            </div>

            <div className="p-3 bg-zinc-950/50 border-t border-zinc-800 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                     <span className="text-[9px] font-black text-zinc-600 border border-zinc-800 px-1 rounded">ESC</span>
                     <span className="text-[9px] font-bold text-zinc-500">Close</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                     <span className="text-[9px] font-black text-zinc-600 border border-zinc-800 px-1 rounded">↵</span>
                     <span className="text-[9px] font-bold text-zinc-500">Navigate</span>
                  </div>
               </div>
               <span className="text-[8px] font-black text-[#deff9a]/40 uppercase tracking-[0.2em]">VentureAM Neural Search v2.0</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
