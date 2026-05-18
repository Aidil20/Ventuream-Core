import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  BarChart2, 
  Target, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  Activity, 
  AlertTriangle,
  Flame,
  Globe,
  Cpu,
  ArrowUpRight,
  Loader2,
  Box,
  Scale,
  BrainCircuit,
  Layout,
  Layers,
  ChevronDown,
  Building2,
  ChevronRight,
  Calculator,
  Globe2,
  Factory,
  Briefcase
} from 'lucide-react';
import { fetchFundamentalAudit, FundamentalAudit, searchAsset, AssetSearchInfo } from '../services/marketService';
import TradingViewWidget from './TradingViewWidget';

interface FundamentalAnalystProps {
  onSelectSymbol?: (symbol: string) => void;
  initialSymbol?: string;
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  color?: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, icon: Icon, children, defaultOpen = false, color = "#DFFF00" }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-[#020407] rounded-[2rem] border border-zinc-800 overflow-hidden shadow-2xl transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between hover:bg-zinc-900/30 transition-colors"
      >
        <div className="flex items-center gap-3">
           <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
              <Icon className="w-5 h-5" style={{ color }} />
           </div>
           <h3 className="text-sm font-black text-white uppercase tracking-widest">{title}</h3>
        </div>
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-5 h-5 text-zinc-500" />
        </div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="p-8 pt-0 border-t border-zinc-800/50">
              <div className="pt-8">
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FundamentalAnalyst: React.FC<FundamentalAnalystProps> = ({ onSelectSymbol, initialSymbol }) => {
  const [searchQuery, setSearchQuery] = useState(initialSymbol || '');
  const [auditData, setAuditData] = useState<FundamentalAudit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string, code?: string } | null>(null);
  const [suggestions, setSuggestions] = useState<AssetSearchInfo[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2 && !isLoading && !auditData) {
      const delayDebounceFn = setTimeout(async () => {
        setIsSearching(true);
        try {
          const results = await searchAsset(searchQuery);
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        } catch (err: any) {
          console.error("Search error:", err);
          try {
            const parsedError = JSON.parse(err.message || '{}');
            if (parsedError.code === 'RESOURCE_EXHAUSTED') {
              setError({ 
                message: "Institutional Search Quota Exceeded. The search intelligence engine is currently overloaded.", 
                code: 'RESOURCE_EXHAUSTED' 
              });
            }
          } catch {
            // ignore
          }
          setSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, isLoading, auditData]);

  useEffect(() => {
    if (initialSymbol) {
      const runInitialAudit = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const data = await fetchFundamentalAudit(initialSymbol.toUpperCase().replace('IDX:', ''));
          setAuditData(data);
          setSearchQuery(initialSymbol.toUpperCase().replace('IDX:', ''));
        } catch (err: any) {
          console.error("Audit failed:", err);
          try {
            const parsedError = JSON.parse(err.message || '{}');
            if (parsedError.code === 'RESOURCE_EXHAUSTED') {
              setError({ 
                message: "Institutional Intelligence Engine is currently overloaded (Quota Exceeded). Please retry in several minutes.", 
                code: 'RESOURCE_EXHAUSTED' 
              });
            } else {
              setError({ message: parsedError.message || "Fundamental audit failed", code: parsedError.code });
            }
          } catch {
            setError({ message: "Fundamental audit failed" });
          }
        } finally {
          setIsLoading(false);
          setShowSuggestions(false);
        }
      };
      runInitialAudit();
    }
  }, [initialSymbol]);

  useEffect(() => {
    const handleMarketUpdate = (event: CustomEvent) => {
      const data = event.detail;
      if (auditData && data.symbol === auditData.ticker) {
        setAuditData(prev => prev ? {
          ...prev,
          lastPrice: data.price,
          changePercent: data.changePercent,
          // Re-calculate change absolute if possible, otherwise rely on server
          changeAbsolute: typeof prev.lastPrice === 'number' && typeof data.price === 'number' 
            ? data.price - (prev.lastPrice / (1 + prev.changePercent/100))
            : prev.changeAbsolute,
          technicalResearch: {
            ...prev.technicalResearch,
            rsi: data.rsi ? `${data.rsi} (Live)` : prev.technicalResearch.rsi,
            macd: data.macdHist ? `${data.macdHist > 0 ? '+' : ''}${data.macdHist} (Live)` : prev.technicalResearch.macd,
            supportResistance: data.supportResistance || prev.technicalResearch.supportResistance,
            movingAverages: data.ema20 && data.ema50 
              ? `EMA20: ${data.ema20} | EMA50: ${data.ema50} (${data.ema20 > data.ema50 ? 'Bullish' : 'Bearish'})` 
              : prev.technicalResearch.movingAverages
          }
        } : null);
      }
    };

    window.addEventListener('vam-market-update' as any, handleMarketUpdate);
    return () => window.removeEventListener('vam-market-update' as any, handleMarketUpdate);
  }, [auditData]);

  const handleAudit = async (symbol: string) => {
    setSearchQuery(symbol);
    setShowSuggestions(false);
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchFundamentalAudit(symbol.toUpperCase());
      setAuditData(data);
    } catch (err: any) {
      console.error("Audit failed:", err);
      try {
        const parsedError = JSON.parse(err.message || '{}');
        if (parsedError.code === 'RESOURCE_EXHAUSTED') {
          setError({ 
            message: "Intelligence Engine Limitation: Institutional Quota Reached. The auditor is currently processing high priority queue. Try again shortly.", 
            code: 'RESOURCE_EXHAUSTED' 
          });
        } else {
          setError({ message: parsedError.message || "Fundamental audit failed", code: parsedError.code });
        }
      } catch {
        setError({ message: "Fundamental audit failed" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleAudit(searchQuery);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Search Header */}
      <div className="bg-[#020407] rounded-[2.5rem] border border-zinc-800 p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 bg-[#DFFF00]/5 blur-3xl rounded-full" />
        <div className="relative z-10">
          <h2 className="text-xl font-black text-white uppercase tracking-[0.2em] mb-2 flex items-center gap-3">
            <Cpu className="w-6 h-6 text-[#DFFF00]" />
            Fundamental Analyst Engine
          </h2>
          <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest mb-6">
            Institutional Intrinsic Value Model & Corporate Action Scanner
          </p>

          <form onSubmit={onSubmit} className="flex flex-col md:flex-row gap-4 relative" ref={searchRef}>
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Enter Ticker for Deep Fundamental Audit (e.g. BBCA, TLKM)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSuggestions(suggestions.length > 0)}
                className="w-full bg-black border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-black text-white focus:border-[#DFFF00]/50 outline-none transition-all placeholder:text-zinc-700"
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                   <Loader2 className="w-4 h-4 text-[#DFFF00] animate-spin" />
                </div>
              )}

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute z-[100] left-0 right-0 top-full mt-2 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-3xl overflow-y-auto max-h-[300px]"
                  >
                    {(suggestions || []).map((suggestion) => (
                      <div
                        key={suggestion.symbol}
                        onClick={() => handleAudit(suggestion.symbol)}
                        className="p-4 border-b border-zinc-800/50 hover:bg-[#DFFF00]/5 cursor-pointer transition-colors flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-black border border-zinc-800 flex items-center justify-center text-[10px] font-black text-[#DFFF00] group-hover:border-[#DFFF00]/30">
                            {suggestion.symbol}
                          </div>
                          <div>
                            <p className="text-xs font-black text-white uppercase">{suggestion.name}</p>
                            <p className="text-[9px] text-zinc-500 font-bold uppercase">{suggestion.marketCap}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-mono font-black text-white">Rp {typeof suggestion.price === 'number' ? suggestion.price.toLocaleString('id-ID') : (suggestion.price || 'N/A')}</p>
                          <p className={`text-[9px] font-black ${suggestion.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {suggestion.changePercent >= 0 ? '+' : ''}{suggestion.changePercent}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button 
              type="submit"
              disabled={isLoading || !searchQuery}
              className="bg-[#DFFF00] text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-w-[200px]"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              Initiate Audit
            </button>
          </form>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 bg-zinc-900/30 rounded-[2.5rem] border border-dashed border-zinc-800"
          >
            <Loader2 className="w-12 h-12 text-[#DFFF00] animate-spin mb-4" />
            <div className="text-center space-y-2">
              <p className="text-[10px] font-black text-[#DFFF00] uppercase tracking-[0.3em] animate-pulse">
                Auditing {searchQuery.toUpperCase()} Fundamental Data...
              </p>
              <div className="flex items-center justify-center gap-4 pt-2">
                <div className="flex items-center gap-1.5 grayscale opacity-50">
                  <Globe2 className="w-3 h-3 text-white" />
                  <span className="text-[7px] font-black text-white uppercase">idx.co.id</span>
                </div>
                <div className="flex items-center gap-1.5 grayscale opacity-50">
                  <Globe className="w-3 h-3 text-white" />
                  <span className="text-[7px] font-black text-white uppercase">TradingView</span>
                </div>
                <div className="flex items-center gap-1.5 grayscale opacity-50">
                  <Box className="w-3 h-3 text-white" />
                  <span className="text-[7px] font-black text-white uppercase">Yahoo Finance</span>
                </div>
              </div>
              <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest pt-2">
                VAM-GATEWAY: Aggregating Real-Time Financial Statements
              </p>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-12 text-center bg-red-500/5 rounded-[2.5rem] border border-red-500/10 space-y-4"
          >
            <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto border border-red-500/20">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">{error.code === 'RESOURCE_EXHAUSTED' ? 'Institutional AI Capacity Peak' : 'Audit Interrupted'}</h3>
              <p className="text-[11px] text-zinc-300 font-bold uppercase mt-2 max-w-md mx-auto leading-relaxed">
                {error.code === 'RESOURCE_EXHAUSTED' 
                  ? "The Intelligence Engine is processing a heavy queue. Resource tracking (IDX.co.id, TradingView) is currently saturated. Automated failovers are initializing." 
                  : error.message}
              </p>
            </div>
            
            <div className="pt-4 space-y-6">
              {error.code === 'RESOURCE_EXHAUSTED' && (
                <div className="flex items-center justify-center gap-8 py-4 border-y border-red-500/10">
                   <div className="flex flex-col items-center gap-1 opacity-60">
                      <div className="w-1.5 h-1.5 bg-[#DFFF00] rounded-full animate-pulse" />
                      <span className="text-[8px] font-black text-zinc-400">IDX GATEWAY</span>
                   </div>
                   <div className="flex flex-col items-center gap-1 opacity-60">
                      <div className="w-1.5 h-1.5 bg-[#DFFF00] rounded-full animate-pulse" />
                      <span className="text-[8px] font-black text-zinc-400">TV SYNDICATION</span>
                   </div>
                   <div className="flex flex-col items-center gap-1 opacity-60">
                      <div className="w-1.5 h-1.5 bg-[#DFFF00] rounded-full animate-pulse" />
                      <span className="text-[8px] font-black text-zinc-400">IBKR FEED</span>
                   </div>
                </div>
              )}
              
              <div className="flex justify-center mt-4">
                <button 
                  onClick={() => searchQuery && handleAudit(searchQuery)}
                  className="flex items-center gap-2 px-8 py-4 bg-[#DFFF00] text-black rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_#DFFF0044]"
                >
                  <Zap className="w-4 h-4" />
                  Request High-Priority Audit
                </button>
              </div>
              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                VAM-GATEWAY: Institutional Priority Queue Active
              </p>
            </div>
          </motion.div>
        ) : auditData ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Image-style Header Component */}
            <div className="bg-[#020407] rounded-[2.5rem] border border-zinc-800 p-8 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 bg-[#DFFF00]/5 blur-3xl rounded-full" />
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-4xl font-black text-white tracking-tighter">{auditData.ticker}</h3>
                      <div className="w-1.5 h-1.5 rounded-full bg-[#DFFF00] opacity-50" />
                      <p className="text-sm font-black text-zinc-500 uppercase tracking-widest truncate max-w-[250px]">
                        {auditData.companyName}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-7xl font-black text-white tracking-tighter">
                        {typeof auditData.lastPrice === 'number' ? auditData.lastPrice.toLocaleString('id-ID') : (auditData.lastPrice || 'N/A')}
                      </h2>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1 text-sm font-black ${auditData.changeAbsolute >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {auditData.changeAbsolute >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {typeof auditData.changeAbsolute === 'number' ? Math.abs(auditData.changeAbsolute).toLocaleString('id-ID') : (auditData.changeAbsolute || '0')} ({auditData.changePercent > 0 ? '+' : ''}{auditData.changePercent}%)
                        </div>
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">1 Minggu Terakhir</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                       <div className="px-4 py-1.5 bg-[#DFFF00]/10 border border-[#DFFF00]/30 rounded-full text-[10px] font-black text-[#DFFF00] uppercase tracking-widest">
                         {auditData.sector}
                       </div>
                       <div className="px-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                         VAM-INSTITUTIONAL
                       </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                     <div className="text-right">
                       <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1">Audit Score</p>
                       <div className="flex items-center justify-end gap-2">
                         <span className="text-4xl font-black text-[#DFFF00]">{auditData.score}</span>
                         <span className="text-zinc-700 text-sm font-black">/100</span>
                       </div>
                     </div>
                     <div className="w-20 h-20 bg-[#DFFF00]/10 rounded-full border border-[#DFFF00]/20 flex items-center justify-center p-4">
                        <Activity className="w-full h-full text-[#DFFF00]" />
                     </div>
                  </div>
               </div>
            </div>

            {/* Multi-Source Intelligence Block */}
            <div className="bg-[#020407] border border-zinc-800 p-6 rounded-[2rem] relative overflow-hidden group hover:border-[#DFFF00]/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                     <BrainCircuit className="w-4 h-4 text-[#DFFF00]" />
                     <span className="text-[10px] font-black text-white uppercase tracking-widest">Multi-Source Intelligence</span>
                  </div>
                  <div className="h-4 w-px bg-zinc-800" />
                  <div className="flex items-center gap-3">
                    <span className="text-[7px] font-black text-zinc-600 uppercase tracking-tighter">Sources:</span>
                    <span className="text-[7px] font-black text-zinc-400 uppercase">IDX.CO.ID</span>
                    <span className="text-[7px] font-black text-zinc-400 uppercase">TRADINGVIEW</span>
                    <span className="text-[7px] font-black text-zinc-400 uppercase">YAHOO FINANCE</span>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                  auditData.tradingViewIntelligence?.technicalSummary?.toLowerCase().includes('buy') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  auditData.tradingViewIntelligence?.technicalSummary?.toLowerCase().includes('sell') ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                  'bg-zinc-900 text-zinc-500 border border-zinc-800'
                }`}>
                  {auditData.tradingViewIntelligence?.technicalSummary || 'Neutral'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                {(auditData.tradingViewIntelligence?.keyStats ? Object.entries(auditData.tradingViewIntelligence.keyStats) : Object.entries(auditData.keyRatios || {}).slice(0, 6)).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-tighter">{key.replace(/([A-Z])/g, ' $1')}</p>
                    <p className="text-[11px] font-black text-white">{value}</p>
                  </div>
                ))}
              </div>
              <div className="absolute bottom-2 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <span className="text-[10px] font-black tracking-tighter text-[#DFFF00]">SYNTHETIC AGGREGATION PROTOCOL</span>
              </div>
            </div>

            {/* Key Ratios Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
               {auditData.keyRatios && Object.entries(auditData.keyRatios).map(([key, value]) => (
                 <div key={key} className="bg-[#020407] border border-zinc-800 p-4 rounded-3xl text-center group hover:border-[#DFFF00]/30 transition-all">
                   <p className="text-[9px] font-black text-zinc-600 uppercase mb-2 group-hover:text-[#DFFF00]/60 transition-colors">{key.replace(/([A-Z])/g, ' $1')}</p>
                   <p className="text-sm font-black text-white">{value}</p>
                 </div>
               ))}
            </div>

            {/* Deep Chart Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
               <div className="lg:col-span-3 bg-[#020407] rounded-[2.5rem] border border-zinc-800 p-1 overflow-hidden shadow-2xl h-[500px]">
                  <TradingViewWidget symbol={auditData.ticker.includes(':') ? auditData.ticker : `IDX:${auditData.ticker}`} />
               </div>
               
               <div className="lg:col-span-1 space-y-6">
                 {/* Technical Intelligence Block */}
                 <div className="bg-[#020407] rounded-[2.5rem] border border-zinc-800 p-6 shadow-2xl relative overflow-hidden h-full group">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                         <BrainCircuit className="w-4 h-4 text-[#DFFF00]" />
                         <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Institutional Technical Intelligence</h4>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#DFFF00]/10 border border-[#DFFF00]/20 rounded-lg">
                        <div className="w-1 h-1 bg-[#DFFF00] rounded-full animate-pulse shadow-[0_0_5px_#DFFF00]" />
                        <span className="text-[7px] text-[#DFFF00] font-black uppercase">Live</span>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-3">
                         <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em]">Strategic Pivot Levels</span>
                         <div className="grid grid-cols-5 gap-1.5">
                            {auditData.technicalResearch.supportResistance?.map((level, i) => {
                              const isPP = level.includes('PP');
                              const isS = level.includes('S');
                              return (
                                <div key={i} className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                                  isPP ? 'bg-[#DFFF00]/10 border-[#DFFF00]/30 text-[#DFFF00]' :
                                  isS ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' :
                                  'bg-rose-500/5 border-rose-500/10 text-rose-400'
                                }`}>
                                  <span className="text-[7px] font-black uppercase mb-0.5">{level.split(':')[0]}</span>
                                  <span className="text-[10px] font-mono font-bold leading-none">{level.split(':')[1]}</span>
                                </div>
                              );
                            })}
                         </div>
                      </div>

                      <div className="pt-6 border-t border-zinc-800 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-zinc-900/40 p-3 rounded-2xl border border-zinc-800/50">
                             <span className="text-[8px] font-black text-zinc-600 uppercase mb-1 block">RSI (14)</span>
                             <div className="flex items-end justify-between">
                               <p className="text-xl font-mono font-black text-white leading-none">{auditData.technicalResearch.rsi.split(' ')[0]}</p>
                               <span className={`text-[7px] font-black px-1 rounded uppercase ${parseInt(auditData.technicalResearch.rsi) > 70 ? 'text-rose-400' : parseInt(auditData.technicalResearch.rsi) < 30 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                 {parseInt(auditData.technicalResearch.rsi) > 70 ? 'OB' : parseInt(auditData.technicalResearch.rsi) < 30 ? 'OS' : 'Neu'}
                               </span>
                             </div>
                          </div>
                          <div className="bg-zinc-900/40 p-3 rounded-2xl border border-zinc-800/50">
                             <span className="text-[8px] font-black text-zinc-600 uppercase mb-1 block">MACD Hist</span>
                             <div className="flex items-end justify-between">
                               <p className="text-xl font-mono font-black text-white leading-none">{auditData.technicalResearch.macd.split(' ')[0]}</p>
                               <TrendingUp className={`w-3.5 h-3.5 ${auditData.technicalResearch.macd.includes('+') ? 'text-emerald-400' : 'text-rose-400'}`} />
                             </div>
                          </div>
                        </div>

                        <div className="space-y-1 bg-zinc-900/40 p-3 rounded-2xl border border-zinc-800/50">
                           <span className="text-[8px] font-black text-zinc-600 uppercase block mb-1">MA Trend Profile</span>
                           <p className="text-[10px] font-bold text-zinc-300 leading-tight italic">"{auditData.technicalResearch.movingAverages}"</p>
                        </div>

                        <div className="space-y-1 bg-zinc-900/40 p-3 rounded-2xl border border-zinc-800/50">
                           <span className="text-[8px] font-black text-zinc-600 uppercase block mb-1">Vol Profile Signal</span>
                           <p className="text-[10px] font-bold text-white uppercase tracking-tight">{auditData.technicalResearch.volumeProfile}</p>
                        </div>
                      </div>

                      <div className="pt-4 space-y-2">
                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2">Alpha Generators</p>
                        <div className="grid grid-cols-1 gap-2">
                          {auditData.technicalResearch.indicators?.slice(0, 3).map((ind, i) => (
                            <div key={i} className="flex justify-between items-center p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800 hover:border-[#DFFF00]/20 transition-all">
                               <span className="text-[9px] font-black text-zinc-500 uppercase">{ind.name}</span>
                               <div className="text-right">
                                 <p className="text-[9px] font-black text-white leading-tight">{ind.value}</p>
                                 <p className={`text-[7px] font-black uppercase ${ind.signal === 'BUY' || ind.signal.includes('Bullish') || ind.signal.includes('Positive') ? 'text-emerald-400' : 'text-rose-400'}`}>
                                   {ind.signal}
                                 </p>
                               </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                 </div>
               </div>
            </div>

            {/* Detailed Analysis Flow */}
            <div className="space-y-6 max-w-5xl mx-auto">
                <div className="flex items-center gap-3 mb-4 px-4">
                  <Layers className="w-5 h-5 text-zinc-500" />
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Institutional Intelligence Audit</h4>
                </div>

                <div className="space-y-4">
                  {/* 1. Macro Context */}
                  <CollapsibleSection title="Macro Economic Analysis" icon={Globe2} color="#fb7185">
                      <div className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                               <h5 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">GDP Growth Context</h5>
                               <p className="text-xs text-zinc-300 font-bold leading-relaxed">{auditData.economicAnalysis.gdpGrowth}</p>
                            </div>
                            <div className="space-y-2">
                               <h5 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Inflationary Pressure</h5>
                               <p className="text-xs text-zinc-300 font-bold leading-relaxed">{auditData.economicAnalysis.inflationRate}</p>
                            </div>
                            <div className="space-y-2">
                               <h5 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Monetary Policy / Rates</h5>
                               <p className="text-xs text-zinc-300 font-bold leading-relaxed">{auditData.economicAnalysis.interestRates}</p>
                            </div>
                         </div>
                         <div className="p-5 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                            <p className="text-sm text-zinc-400 font-bold leading-relaxed italic">"{auditData.economicAnalysis.summary}"</p>
                         </div>
                      </div>
                  </CollapsibleSection>

                  {/* 2. Industry Analysis */}
                  <CollapsibleSection title="Industry & Sector Analysis" icon={Factory} color="#fbbf24">
                      <div className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                               <h5 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Sector Momentum</h5>
                               <p className="text-xs text-zinc-300 font-bold leading-relaxed">{auditData.industryAnalysis.growthPotential}</p>
                            </div>
                            <div className="space-y-2">
                               <h5 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Market Competition</h5>
                               <p className="text-xs text-zinc-300 font-bold leading-relaxed">{auditData.industryAnalysis.competition}</p>
                            </div>
                            <div className="space-y-2">
                               <h5 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Regulatory Landscape</h5>
                               <p className="text-xs text-zinc-300 font-bold leading-relaxed">{auditData.industryAnalysis.regulation}</p>
                            </div>
                         </div>
                         <div className="p-5 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                            <p className="text-sm text-zinc-400 font-bold italic leading-relaxed">"{auditData.industryAnalysis.summary}"</p>
                         </div>
                      </div>
                  </CollapsibleSection>

                  {/* 3. Company & Management */}
                  <CollapsibleSection title="Company Analysis & GCG" icon={Building2} color="#a78bfa" defaultOpen={true}>
                      <div className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                               <h5 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Financial Backbone</h5>
                               <p className="text-xs text-zinc-300 font-bold leading-relaxed">{auditData.companyAnalysis.financialHealth}</p>
                            </div>
                            <div className="space-y-2">
                               <h5 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Management Integrity</h5>
                               <p className="text-xs text-zinc-300 font-bold leading-relaxed">{auditData.companyAnalysis.managementQuality}</p>
                            </div>
                            <div className="space-y-2">
                               <h5 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Moat & Business Model</h5>
                               <p className="text-xs text-zinc-300 font-bold leading-relaxed">{auditData.companyAnalysis.businessModel}</p>
                            </div>
                         </div>
                         <div className="p-5 bg-purple-500/5 border border-purple-500/10 rounded-2xl">
                            <p className="text-sm text-zinc-400 font-bold italic leading-relaxed">"{auditData.companyAnalysis.summary}"</p>
                         </div>
                      </div>
                  </CollapsibleSection>

                  {/* 4. Earnings Power */}
                  <CollapsibleSection title="Earnings Power Analysis" icon={TrendingUp} color="#34d399">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 gap-6">
                          <div>
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Revenue Growth Path</span>
                            <p className="text-base font-black text-white">{auditData.earningsPower.revenueGrowth}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Profitability Margins</span>
                            <p className="text-base font-black text-white">{auditData.earningsPower.profitMargin}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Efficiency (ROE/ROA)</span>
                            <p className="text-base font-black text-white">{auditData.earningsPower.roe_roa}</p>
                          </div>
                        </div>
                        <div className="bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/10 flex items-center justify-center">
                          <p className="text-xs text-zinc-400 font-bold leading-relaxed italic text-center">
                            "{auditData.earningsPower.summary}"
                          </p>
                        </div>
                      </div>
                  </CollapsibleSection>

                  {/* 5. Balance Sheet */}
                  <CollapsibleSection title="Balance Sheet Durability" icon={ShieldCheck} color="#60a5fa">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                            <span className="text-[10px] font-black text-zinc-600 uppercase">Solvency (DER)</span>
                            <p className="font-black text-white">{auditData.balanceSheet.der}</p>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                            <span className="text-[10px] font-black text-zinc-600 uppercase">Liquidity (Current Ratio)</span>
                            <p className="font-black text-white">{auditData.balanceSheet.currentRatio}</p>
                          </div>
                          <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                            <span className="text-[10px] font-black text-zinc-600 uppercase block mb-1 tracking-widest">Asset Composition</span>
                            <p className="text-xs font-bold text-zinc-400">{auditData.balanceSheet.capitalStructure}</p>
                          </div>
                        </div>
                        <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center">
                          <p className="text-xs text-zinc-300 font-bold leading-relaxed">{auditData.balanceSheet.summary}</p>
                        </div>
                      </div>
                  </CollapsibleSection>

                  {/* 6. Market Context */}
                  <CollapsibleSection title="Peer Market Comparison" icon={BarChart2} color="#DFFF00">
                      <div className="space-y-6">
                        <div className="flex items-end justify-between px-2">
                          <span className="text-[10px] font-black text-white uppercase">{auditData.ticker}</span>
                          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Sector Status: #{auditData.peerComparison.ranking} of {auditData.peerComparison.totalInSector}</span>
                        </div>
                        <div className="h-2.5 w-full bg-black border border-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#DFFF00]/40 to-[#DFFF00] rounded-full shadow-[0_0_15px_#DFFF0033]" 
                            style={{ width: `${(1 - (auditData.peerComparison.ranking / auditData.peerComparison.totalInSector)) * 100}%` }}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6 py-6 border-y border-zinc-800/50">
                          <div className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                            <span className="text-[8px] font-black text-zinc-600 uppercase block mb-1">Sector Avg ROE</span>
                            <p className="text-sm font-black text-white">{auditData.peerComparison.sectorAverageROE}</p>
                          </div>
                          <div className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                            <span className="text-[8px] font-black text-zinc-600 uppercase block mb-1">Sector Avg P/E</span>
                            <p className="text-sm font-black text-white">{auditData.peerComparison.sectorAveragePE}</p>
                          </div>
                        </div>

                        <div className="pt-2">
                          <p className="text-[8px] font-black text-zinc-600 uppercase mb-4 tracking-widest">Key Industry Competitors</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {auditData.peerComparison.topCompetitors?.map(comp => (
                              <div key={comp.symbol} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-between group hover:bg-[#DFFF00]/5 hover:border-[#DFFF00]/30 transition-all">
                                <span className="text-[10px] font-black text-white group-hover:text-[#DFFF00] transition-colors">{comp.symbol}</span>
                                <span className="text-[9px] font-bold text-zinc-500 uppercase group-hover:text-zinc-300">{comp.strength}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="p-5 bg-zinc-900 rounded-[2rem] border border-zinc-800">
                           <p className="text-xs text-zinc-400 font-bold italic leading-relaxed uppercase tracking-tight">"{auditData.peerComparison.summary}"</p>
                        </div>
                      </div>
                  </CollapsibleSection>

                  {/* 7. Valuation */}
                  <CollapsibleSection title="Multi-Model Intrinsic Valuation" icon={Calculator} color="#DFFF00" defaultOpen={true}>
                      <div className="space-y-6">
                         <div className="flex items-center justify-between p-8 bg-zinc-900 rounded-[2.5rem] border border-[#DFFF00]/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 bg-[#DFFF00]/5 blur-3xl rounded-full group-hover:bg-[#DFFF00]/10 transition-all duration-700" />
                            <div className="relative z-10">
                               <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Synthesized Fair Value</p>
                               <p className="text-5xl font-black text-[#DFFF00] tracking-tighter">Rp {typeof auditData.intrinsicValue.fairValue === 'number' ? auditData.intrinsicValue.fairValue.toLocaleString('id-ID') : (auditData.intrinsicValue.fairValue || 'N/A')}</p>
                            </div>
                            <div className="text-right relative z-10">
                               <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Margin of Safety</p>
                               <p className={`text-3xl font-black ${auditData.intrinsicValue.upside_downside >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {auditData.intrinsicValue.upside_downside > 0 ? '+' : ''}{auditData.intrinsicValue.upside_downside}%
                               </p>
                            </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div className="p-5 bg-black border border-zinc-800 rounded-[2rem] space-y-2 hover:border-[#DFFF00]/20 transition-all">
                             <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">DCF Model (FCF)</p>
                             <p className="text-base font-black text-white">{auditData.intrinsicValue.dcfValue}</p>
                           </div>
                           <div className="p-5 bg-black border border-zinc-800 rounded-[2rem] space-y-2 hover:border-[#DFFF00]/20 transition-all">
                             <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Graham defensive</p>
                             <p className="text-base font-black text-white">{auditData.intrinsicValue.grahamNumber}</p>
                           </div>
                           <div className="p-5 bg-black border border-zinc-800 rounded-[2rem] space-y-2 hover:border-[#DFFF00]/20 transition-all">
                             <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Relative Multiples</p>
                             <p className="text-base font-black text-white">{auditData.intrinsicValue.relativeValue}</p>
                           </div>
                         </div>

                         <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-[2rem]">
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Activity className="w-4 h-4" /> Final Audit Synthesis Logic
                            </p>
                            <p className="text-xs text-zinc-400 font-bold leading-relaxed">{auditData.intrinsicValue.model}</p>
                         </div>
                      </div>
                  </CollapsibleSection>

                   {/* 8. M&A Activity */}
                   <CollapsibleSection title="M&A Action Potential" icon={Zap} color="#fb923c" defaultOpen={true}>
                       <div className="space-y-6">
                         <div className="flex flex-col md:flex-row items-center justify-between mb-4 px-2 gap-4">
                            <div className="px-5 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl text-[10px] font-black text-orange-400 uppercase tracking-widest">
                               Consolidation Score: {auditData.maScanner.score}/100
                            </div>
                            <div className="flex items-center gap-4">
                               {auditData.maScanner.sectorFocusFilters?.map((filter, i) => (
                                 <span key={i} className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                                   {filter}
                                 </span>
                               ))}
                               <div className="w-px h-4 bg-zinc-800 mx-2" />
                               <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_#f97316]" />
                                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Scanner: Prime</span>
                               </div>
                            </div>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div className="p-5 bg-black border border-zinc-800 rounded-[2rem] space-y-2 group hover:border-orange-500/30 transition-all">
                             <div className="flex justify-between items-center">
                               <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Est. Deal Size</span>
                               <span className="text-[8px] font-black text-orange-500 uppercase">Range Active</span>
                             </div>
                             <p className="text-base font-black text-white">{auditData.maScanner.dealSize}</p>
                             <div className="flex justify-between text-[8px] font-black text-zinc-700 uppercase pt-1">
                               <span>MIN: {auditData.maScanner.dealSizeRange.min}</span>
                               <span>MAX: {auditData.maScanner.dealSizeRange.max}</span>
                             </div>
                           </div>
                           <div className="p-5 bg-black border border-zinc-800 rounded-[2rem] space-y-2 group hover:border-orange-500/30 transition-all">
                             <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Sector Focus</span>
                             <p className="text-base font-black text-white">{auditData.maScanner.sectorFocus}</p>
                           </div>
                           <div className="p-5 bg-black border border-zinc-800 rounded-[2rem] space-y-2 group hover:border-orange-500/30 transition-all">
                             <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Rumor Status</span>
                             <p className="text-base font-black text-white">{auditData.maScanner.divestmentRumors}</p>
                           </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-6">
                             <div className="space-y-2 p-6 bg-zinc-900/30 rounded-3xl border border-zinc-800">
                               <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest flex items-center gap-2">
                                 <Target className="w-3.5 h-3.5 text-orange-400" />
                                 Consolidation Logic
                               </span>
                               <p className="text-sm text-zinc-300 font-bold leading-relaxed">{auditData.maScanner.potential}</p>
                             </div>
                             
                             <div className="space-y-4">
                               <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest flex items-center gap-2 px-2">
                                 <Building2 className="w-3.5 h-3.5 text-orange-400" />
                                 Acquirer Profiling
                               </span>
                               <div className="grid grid-cols-1 gap-3">
                                 <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                                    <span className="text-[8px] font-black text-zinc-600 uppercase block mb-1">Financial Health Analysis</span>
                                    <p className="text-xs text-zinc-300 font-bold">{auditData.maScanner.potentialAcquirerFinancialHealth}</p>
                                 </div>
                                 <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                                    <span className="text-[8px] font-black text-zinc-600 uppercase block mb-1">Strategic Alignment</span>
                                    <p className="text-xs text-zinc-300 font-bold">{auditData.maScanner.potentialAcquirerStrategicAlignment}</p>
                                 </div>
                                 <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                                    <span className="text-[8px] font-black text-zinc-600 uppercase block mb-1">General Acquirer Analysis</span>
                                    <p className="text-xs text-zinc-500 font-medium italic">{auditData.maScanner.potentialAcquirerAnalysis}</p>
                                 </div>
                               </div>
                             </div>
                           </div>
                           
                           <div className="p-8 bg-orange-500/5 border border-orange-500/10 rounded-[2.5rem] flex flex-col justify-center relative overflow-hidden h-fit self-start">
                             <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/5 blur-3xl rounded-full" />
                             <span className="text-[10px] font-black text-orange-500/60 uppercase tracking-[0.2em] mb-4 text-center">Strategic Valuation Logic</span>
                             <p className="text-sm text-orange-400 font-black leading-relaxed italic text-center uppercase tracking-[0.05em] relative z-10">
                                "{auditData.maScanner.strategicValue}"
                             </p>
                           </div>
                         </div>
                       </div>
                   </CollapsibleSection>

                  {/* 9. Risk Factors */}
                  <CollapsibleSection title="Critical Risk Matrix" icon={AlertTriangle} color="#ef4444" defaultOpen={true}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {auditData.riskFactors?.map((risk, idx) => (
                          <div key={idx} className="flex items-start gap-4 p-6 bg-red-500/5 border border-red-500/10 rounded-[2rem] group hover:border-red-500/30 transition-all">
                            <div className="w-2.5 h-2.5 bg-red-500 rounded-full mt-1.5 shrink-0 shadow-[0_0_10px_#ef4444]" />
                            <p className="text-[11px] text-zinc-400 font-bold leading-relaxed group-hover:text-zinc-200 transition-colors uppercase tracking-tight">{risk}</p>
                          </div>
                        ))}
                      </div>
                  </CollapsibleSection>

                  {/* Management Verdict Highlight */}
                  <div className="bg-[#020407] rounded-[2.5rem] border border-zinc-800 p-8 shadow-2xl relative overflow-hidden">
                      <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-[#DFFF00]/5 blur-3xl rounded-full" />
                      <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                         <div className="p-6 bg-[#DFFF00]/10 rounded-[2rem] border border-[#DFFF00]/20">
                            <Briefcase className="w-10 h-10 text-[#DFFF00]" />
                         </div>
                         <div className="text-center md:text-left flex-1">
                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-2">Institutional Management Verdict</h4>
                            <p className="text-2xl font-black text-white leading-tight">
                              The audit reflects high-grade management credibility categorized as <span className="text-[#DFFF00]">"{auditData.companyAnalysis.managementQuality}"</span>
                            </p>
                         </div>
                         <div className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black text-[#DFFF00] uppercase tracking-widest">
                           Verified
                         </div>
                      </div>
                  </div>
                </div>
            </div>

            {/* AI Summary Block */}
            <div className="bg-gradient-to-br from-[#DFFF00]/20 via-[#DFFF00]/5 to-transparent p-1px rounded-[3rem] overflow-hidden">
              <div className="bg-[#020407] p-10 rounded-[3rem] relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-12 bg-[#DFFF00]/10 blur-3xl rounded-full" />
                 <div className="flex flex-col md:flex-row items-start md:items-center gap-8 relative z-10">
                    <div className="p-5 bg-[#DFFF00] rounded-3xl shrink-0 shadow-2xl shadow-[#DFFF00]/20">
                      <Zap className="w-8 h-8 text-black" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Final Fundamental Verdict</h3>
                      <p className="text-base text-zinc-300 font-bold leading-relaxed">
                        {auditData.overallAuditSummary}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <button 
                        onClick={() => onSelectSymbol?.(auditData.ticker)}
                        className="px-8 py-4 bg-zinc-800 border border-zinc-700 rounded-2xl text-white font-black text-xs uppercase tracking-widest hover:bg-zinc-700 transition-all flex items-center gap-2 whitespace-nowrap"
                      >
                        Deep Chart Analysis <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 flex flex-col items-center justify-center text-center space-y-6 bg-zinc-900/10 rounded-[3rem] border border-dashed border-zinc-800"
          >
            <div className="w-16 h-16 rounded-full border-2 border-zinc-800 flex items-center justify-center">
              <BarChart2 className="w-8 h-8 text-zinc-700" />
            </div>
            <div className="max-w-sm">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">Engine Ready for Instruction</h3>
              <p className="text-[10px] text-zinc-600 font-bold leading-relaxed uppercase tracking-widest">
                Search for an IDX or Global ticker to initiate a deep intrinsic value audit and corporate action scan.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
