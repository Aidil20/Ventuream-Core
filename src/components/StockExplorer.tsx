import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, TrendingUp, TrendingDown, Clock, Newspaper, BarChart2, Star, X, Zap, Bell, Trash2, ChevronDown, ExternalLink, Activity, Info, Loader2, BrainCircuit, RefreshCw, ShieldAlert } from 'lucide-react';
import TradingViewWidget from './TradingViewWidget';
import TradingViewTechnicalAnalysisWidget from './TradingViewTechnicalAnalysisWidget';
import { fetchMarketNewsSummary } from '../services/geminiService';
import { PriceAlert } from '../App';
import { searchAsset, AssetSearchInfo, fetchNewsSentimentSummary, NewsSentimentAnalysis } from '../services/marketService';

interface StockNews {
  headline: string;
  summary: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  timestamp: string;
  url?: string;
}

interface StockExplorerProps {
  alerts: PriceAlert[];
  onAddAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'active'>) => void;
  onRemoveAlert: (id: string) => void;
  onViewAsset?: (symbol: string) => void;
  onFundamentalAudit?: (symbol: string) => void;
}

export const StockExplorer: React.FC<StockExplorerProps> = ({ 
  alerts, 
  onAddAlert, 
  onRemoveAlert,
  onViewAsset,
  onFundamentalAudit
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [stockInfo, setStockInfo] = useState<AssetSearchInfo | null>(null);
  const [searchResults, setSearchResults] = useState<AssetSearchInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>(['BBCA', 'TLKM', 'ADRO']);
  const [news, setNews] = useState<StockNews[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [sentimentAnalysis, setSentimentAnalysis] = useState<NewsSentimentAnalysis | null>(null);
  const [isSentimentLoading, setIsSentimentLoading] = useState(false);
  const [error, setError] = useState<{ message: string, code?: string } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [rsiRange, setRsiRange] = useState({ min: 30, max: 70 });
  const [macdSignal, setMacdSignal] = useState<'any' | 'bullish' | 'bearish'>('any');
  const [macdPosition, setMacdPosition] = useState<'any' | 'above' | 'below'>('any');
  const [isChartExpanded, setIsChartExpanded] = useState(false);

  // Alert Form State
  const [alertPrice, setAlertPrice] = useState<string>('');
  const [alertCondition, setAlertCondition] = useState<'gt' | 'lt'>('gt');
  const [showAddAlert, setShowAddAlert] = useState(false);

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const query = (overrideQuery || searchQuery).trim();
    if (query) {
      setIsSearching(true);
      setSearchResults([]);
      setError(null);
      try {
        const results = await searchAsset(query);
        setSearchResults(results);
        
        if (results.length === 1) {
          setStockInfo(results[0]);
          setSelectedStock(results[0].symbol);
        } else if (results.length > 0) {
          const exactMatch = results.find(r => r.symbol.toUpperCase() === query.toUpperCase());
          if (exactMatch) {
            setStockInfo(exactMatch);
            setSelectedStock(exactMatch.symbol);
          }
        }
      } catch (err: any) {
        console.error("Search error:", err);
        try {
          const parsed = JSON.parse(err.message || '{}');
          if (parsed.code === 'RESOURCE_EXHAUSTED') {
            setError({ 
              message: parsed.message || "Search Quota Exceeded. The institutional intelligence engine is currently overloaded.", 
              code: 'RESOURCE_EXHAUSTED' 
            });
          } else if (parsed.code === 'NOT_FOUND') {
            setError({ 
              message: parsed.message || `No assets matching "${query}" were found in our institutional database.`, 
              code: 'NOT_FOUND' 
            });
          } else if (parsed.error) {
            setError({ message: parsed.message || "Search failed", code: parsed.code || 'UNKNOWN' });
          } else {
            setError({ message: "Search failed due to a network or server error." });
          }
        } catch {
          setError({ message: "Search failed. Please verify your connection to the VAM Gateway." });
        }
      } finally {
        setIsSearching(false);
      }
    }
  };

  const loadStockNews = async (force = false) => {
    if (!selectedStock) return;
    setIsNewsLoading(true);
    setSentimentAnalysis(null);
    try {
      const data = await fetchMarketNewsSummary(force, selectedStock);
      const mappedNews = data.map(item => ({
        headline: item.headline,
        summary: item.summary,
        sentiment: item.sentiment,
        timestamp: item.timestamp,
        url: item.url
      } as StockNews));
      
      setNews(mappedNews);

      // Get AI Sentiment Analysis for the news bundle
      if (mappedNews.length > 0) {
        setIsSentimentLoading(true);
        try {
          const analysis = await fetchNewsSentimentSummary(mappedNews as any, selectedStock);
          setSentimentAnalysis(analysis);
        } catch (err: any) {
          console.error("Sentiment analysis error:", err);
          try {
            const parsed = JSON.parse(err.message || '{}');
            if (parsed.code === 'RESOURCE_EXHAUSTED') {
              setError({ 
                message: "Sentiment AI engine is currently busy. Displaying raw data only.", 
                code: 'RESOURCE_EXHAUSTED' 
              });
            }
          } catch {
            // ignore
          }
        } finally {
          setIsSentimentLoading(false);
        }
      }
    } catch (error) {
      console.error("News load error:", error);
    } finally {
      setIsNewsLoading(false);
    }
  };

  useEffect(() => {
    const handleMarketUpdate = (e: any) => {
      const data = e.detail;
      if (data && data.symbol === selectedStock) {
        setStockInfo(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            price: data.price,
            changePercent: data.changePercent,
            volume: data.volume || prev.volume // Use server volume if available
          };
        });
      }
    };

    window.addEventListener('vam-market-update', handleMarketUpdate);
    return () => window.removeEventListener('vam-market-update', handleMarketUpdate);
  }, [selectedStock]);

  useEffect(() => {
    if (selectedStock) {
      // If we don't have stockInfo but have a selectedStock (e.g. from watchlist), fetch info
      if (!stockInfo || stockInfo.symbol !== selectedStock) {
        const loadInfo = async () => {
          try {
            const data = await searchAsset(selectedStock);
            if (data) setStockInfo(data);
          } catch (e) {
            console.error("Info load error:", e);
          }
        };
        loadInfo();
      }
      
      loadStockNews(false);
    }
  }, [selectedStock]);

  const toggleWatchlist = (symbol: string) => {
    setWatchlist(prev => 
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    );
  };

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStock && alertPrice) {
      onAddAlert({
        symbol: selectedStock,
        targetPrice: parseFloat(alertPrice),
        condition: alertCondition
      });
      setAlertPrice('');
      setShowAddAlert(false);
    }
  };

  const activeStockAlerts = alerts.filter(a => a.symbol === selectedStock && a.active);

  return (
    <div className="space-y-6">
      {/* Search Bar & Watchlist Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          {isSearching ? (
            <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#DFFF00] animate-spin" />
          ) : (
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          )}
          <input
            type="text"
            placeholder="Search Symbols (e.g. BBCA, AAPL, BTCUSD)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isSearching}
            className="w-full bg-[#020407] border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-sm font-black text-white focus:border-[#DFFF00]/50 outline-none transition-all placeholder:text-zinc-700 disabled:opacity-50"
          />
        </form>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl border font-black text-[11px] uppercase tracking-widest transition-all ${
              showFilters ? 'bg-[#DFFF00] text-black border-[#DFFF00]' : 'bg-[#020407] text-zinc-400 border-zinc-800'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${showFilters ? 'fill-black' : ''}`} />
            Scanner Filters
          </button>
          
          <div className="w-px h-8 bg-zinc-800 mx-2 hidden md:block" />
          
          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mr-2">Watchlist:</span>
          {watchlist.map(symbol => (
            <div key={symbol} className="flex items-center gap-1 group">
              <button
                onClick={() => setSelectedStock(symbol)}
                className={`px-3 py-1.5 rounded-l-xl border-y border-l text-[10px] font-black transition-all ${
                  selectedStock === symbol 
                    ? 'bg-[#DFFF00] text-black border-[#DFFF00]' 
                    : 'bg-[#020407] text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {symbol}
              </button>
              {onFundamentalAudit && (
                <button
                  onClick={() => onFundamentalAudit(symbol)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-r-xl border text-[9px] font-black transition-all ${
                    selectedStock === symbol 
                      ? 'bg-[#DFFF00]/20 text-black border-[#DFFF00] border-l-zinc-800/20' 
                      : 'bg-[#020407] text-[#DFFF00] border-zinc-800 border-l-zinc-900 hover:bg-[#DFFF00]/10'
                  }`}
                  title="Run Deep AI Fundamental Audit"
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  AUDIT
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#020407] border border-zinc-800 rounded-[2rem] p-6 grid grid-cols-1 md:grid-cols-3 gap-8 shadow-2xl relative">
              <div className="absolute top-0 right-0 p-8 bg-[#DFFF00]/5 blur-3xl rounded-full" />
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" />
                    RSI Threshold Audit
                  </label>
                  <span className="text-[10px] font-black text-[#DFFF00]">{rsiRange.min} - {rsiRange.max}</span>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                      <span className="text-[8px] font-black text-zinc-600 uppercase flex justify-between">
                        Min RSI <span>{rsiRange.min}</span>
                      </span>
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={rsiRange.min}
                        onChange={(e) => setRsiRange(prev => ({ ...prev, min: Math.min(parseInt(e.target.value), prev.max) }))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#DFFF00]"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <span className="text-[8px] font-black text-zinc-600 uppercase flex justify-between">
                        Max RSI <span>{rsiRange.max}</span>
                      </span>
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={rsiRange.max}
                        onChange={(e) => setRsiRange(prev => ({ ...prev, max: Math.max(parseInt(e.target.value), prev.min) }))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#DFFF00]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-[9px] font-black text-zinc-700 uppercase tracking-tighter">
                    <span className={rsiRange.min < 30 ? 'text-emerald-500' : ''}>Oversold Area</span>
                    <span className={rsiRange.max > 70 ? 'text-red-500' : ''}>Overbought Area</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <BarChart2 className="w-3 h-3 text-blue-400" />
                    MACD Signal Strategy
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'any', label: 'Any Cross' },
                      { id: 'bullish', label: 'Bullish Cross' },
                      { id: 'bearish', label: 'Bearish Cross' }
                    ].map(option => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setMacdSignal(option.id as any)}
                        className={`py-2 rounded-xl border text-[9px] font-black uppercase tracking-tight transition-all ${
                          macdSignal === option.id 
                            ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                            : 'bg-black/40 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-3 h-3 text-[#DFFF00]" />
                    MACD Zero-Line Position
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'any', label: 'Any Pos' },
                      { id: 'above', label: 'Above Zero' },
                      { id: 'below', label: 'Below Zero' }
                    ].map(option => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setMacdPosition(option.id as any)}
                        className={`py-2 rounded-xl border text-[9px] font-black uppercase tracking-tight transition-all ${
                          macdPosition === option.id 
                            ? 'bg-[#DFFF00]/10 border-[#DFFF00]/30 text-[#DFFF00]' 
                            : 'bg-black/40 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-tight">VAM Logic Engine: (12, 26, 9) Std Parameters</p>
              </div>

              <div className="flex flex-col justify-end relative z-10">
                <button 
                  className="w-full py-4 bg-[#DFFF00] text-black font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(223,255,0,0.15)]"
                >
                  <Search className="w-4 h-4" />
                  Execute Deep Scan
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-8 text-center bg-red-500/5 rounded-2xl border border-red-500/10 space-y-4"
          >
            <div className="flex flex-col items-center gap-2">
              <ShieldAlert className="w-8 h-8 text-red-500 opacity-50" />
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                {error.code === 'RESOURCE_EXHAUSTED' 
                  ? 'Institutional Intelligence Limit Reached' 
                  : error.code === 'NOT_FOUND' 
                    ? 'Asset Verification Failed' 
                    : 'Discovery Error'}
              </p>
            </div>
            <p className="text-[12px] text-zinc-300 font-bold uppercase max-w-md mx-auto leading-relaxed">{error.message}</p>
            {error.code === 'RESOURCE_EXHAUSTED' && (
              <div className="space-y-4 pt-2 border-t border-red-500/10">
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">GATEWAY STATUS: CONGESTED • AUTO-TRACKING ACTIVE</p>
                <div className="flex items-center justify-center gap-6">
                   <div className="flex flex-col items-center gap-1 opacity-60">
                      <div className="w-1.5 h-1.5 bg-[#DFFF00] rounded-full animate-pulse" />
                      <span className="text-[8px] font-black text-zinc-400">IDX.CO.ID</span>
                   </div>
                   <div className="flex flex-col items-center gap-1 opacity-60">
                      <div className="w-1.5 h-1.5 bg-[#DFFF00] rounded-full animate-pulse" />
                      <span className="text-[8px] font-black text-zinc-400">TRADINGVIEW</span>
                   </div>
                   <div className="flex flex-col items-center gap-1 opacity-60">
                      <div className="w-1.5 h-1.5 bg-[#DFFF00] rounded-full animate-pulse" />
                      <span className="text-[8px] font-black text-zinc-400">BLOOMBERG</span>
                   </div>
                </div>
                <p className="text-[9px] text-zinc-600 font-bold uppercase">Manual lookup recommended via active sub-terminals</p>
              </div>
            )}
          </motion.div>
        )}

        {searchResults.length > 1 && !selectedStock && !isSearching && !error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#020407] border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-xl"
          >
            <div className="flex items-center gap-2 px-2">
              <BrainCircuit className="w-3.5 h-3.5 text-[#DFFF00]" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">VAM Search Suggestions</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {searchResults.map((result) => (
                <div 
                  key={result.symbol}
                  className="flex items-stretch bg-zinc-900 border border-zinc-800 rounded-xl hover:border-[#DFFF00]/30 transition-all group overflow-hidden"
                >
                  <button
                    onClick={() => {
                      setStockInfo(result);
                      setSelectedStock(result.symbol);
                      setSearchResults([]);
                    }}
                    className="flex-1 flex items-center justify-between p-4 text-left"
                  >
                    <div>
                      <h4 className="text-sm font-black text-white">{result.symbol}</h4>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase truncate max-w-[120px]">{result.name}</p>
                    </div>
                    <div className="text-right mr-2">
                      <p className="text-xs font-black text-white">Rp {typeof result.price === 'number' ? result.price.toLocaleString('id-ID') : (result.price || 'N/A')}</p>
                      <p className={`text-[10px] font-black ${result.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {result.changePercent > 0 ? '+' : ''}{result.changePercent}%
                      </p>
                    </div>
                  </button>
                  {onFundamentalAudit && (
                    <button
                      onClick={() => onFundamentalAudit(result.symbol)}
                      className="px-4 bg-zinc-900 border-l border-zinc-800 text-[#DFFF00] hover:bg-[#DFFF00]/10 transition-all flex flex-col items-center justify-center gap-1"
                      title="Run Deep AI Fundamental Audit"
                    >
                      <BrainCircuit className="w-4 h-4" />
                      <span className="text-[7px] font-black uppercase">Audit</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {selectedStock ? (
          <motion.div
            key={selectedStock}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Stock Header */}
            <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-6 bg-[#020407] p-6 rounded-[2.5rem] border border-zinc-800 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-zinc-900 rounded-[1.5rem] border border-zinc-800 shrink-0">
                  <BarChart2 className="w-6 h-6 text-[#DFFF00]" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tighter">{selectedStock}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{stockInfo?.name || 'Global Asset ID'}</span>
                    <div className="w-1.5 h-1.5 bg-[#DFFF00] rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-[#DFFF00] uppercase tracking-widest">LIVE DATASTREAM</span>
                    
                    {sentimentAnalysis && (
                      <>
                        <div className="w-px h-3 bg-zinc-800 mx-1" />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${sentimentAnalysis.score > 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                          AI Sentiment: {sentimentAnalysis.score > 50 ? 'BULLISH' : 'BEARISH'} ({sentimentAnalysis.score})
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {stockInfo ? (
                <div className="flex flex-wrap items-center gap-8 py-4 xl:py-0 border-y xl:border-none border-zinc-800/50">
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Current Price</span>
                    <p className="text-xl font-black text-white tracking-tighter">
                      Rp {typeof stockInfo.price === 'number' ? stockInfo.price.toLocaleString('id-ID') : (stockInfo.price || 'N/A')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Day Change</span>
                    <p className={`text-xl font-black tracking-tighter flex items-center gap-1 ${stockInfo.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {stockInfo.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {typeof stockInfo.changePercent === 'number' ? stockInfo.changePercent.toFixed(2) : '0.00'}%
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Volume</span>
                    <p className="text-xl font-black text-zinc-300 tracking-tighter">
                      {stockInfo.volume}
                    </p>
                  </div>
                  <div className="hidden sm:block space-y-1">
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Market Cap</span>
                    <p className="text-xl font-black text-zinc-500 tracking-tighter">
                      {stockInfo.marketCap}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex justify-center text-zinc-700 text-[10px] font-black uppercase tracking-widest">
                  Loading deep metrics...
                </div>
              )}

              <div className="flex items-center gap-3">
                {onFundamentalAudit && (
                  <button 
                    onClick={() => onFundamentalAudit(selectedStock!)}
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black text-[11px] uppercase tracking-widest hover:bg-indigo-500/20 transition-all"
                  >
                    <Activity className="w-4 h-4" />
                    AI Fundamental
                  </button>
                )}
                {onViewAsset && (
                  <button 
                    onClick={() => onViewAsset(selectedStock!)}
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#DFFF00]/10 border border-[#DFFF00]/20 text-[#DFFF00] font-black text-[11px] uppercase tracking-widest hover:bg-[#DFFF00]/20 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Go to Asset
                  </button>
                )}
                <button 
                  onClick={() => toggleWatchlist(selectedStock!)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-black text-[11px] uppercase tracking-widest transition-all ${
                    watchlist.includes(selectedStock!)
                      ? 'bg-zinc-800 border-transparent text-[#DFFF00]'
                      : 'bg-transparent border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  <Star className={`w-4 h-4 ${watchlist.includes(selectedStock!) ? 'fill-[#DFFF00]' : ''}`} />
                  {watchlist.includes(selectedStock!) ? 'In Watchlist' : 'Add to Watchlist'}
                </button>
                <button 
                  onClick={() => setSelectedStock(null)}
                  className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* TradingView & Technical Summary */}
            <div className={`grid grid-cols-1 ${isChartExpanded ? 'xl:grid-cols-1' : 'xl:grid-cols-4'} gap-6`}>
              <div className={`${isChartExpanded ? 'xl:col-span-1' : 'xl:col-span-3'} bg-[#020407] rounded-[2.5rem] border border-zinc-800 overflow-hidden shadow-2xl transition-all duration-500`}>
                <div className="p-4 border-b border-zinc-800 bg-black/40 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Institutional Charting Terminal</span>
                    <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-lg">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[8px] font-black text-emerald-400 uppercase">Real-time Stream</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-[#DFFF00]" />
                      <span className="text-[9px] font-black text-[#DFFF00] uppercase tracking-widest">ADVANCED ANALYTICS ACTIVE</span>
                    </div>
                    <button 
                      onClick={() => setIsChartExpanded(!isChartExpanded)}
                      className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-[#DFFF00] transition-colors"
                      title={isChartExpanded ? "Minimize Chart" : "Expand Chart View"}
                    >
                      <Activity className={`w-4 h-4 transition-transform ${isChartExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                </div>
                <div className={`${isChartExpanded ? 'h-[700px]' : 'h-[500px]'} transition-all duration-500`}>
                  <TradingViewWidget 
                    symbol={selectedStock.includes(':') ? selectedStock : `IDX:${selectedStock}`} 
                    studies={["MASimple@tv-basicstudies", "MAExp@tv-basicstudies", "RSI@tv-basicstudies", "MACD@tv-basicstudies", "BB@tv-basicstudies"]}
                  />
                </div>
              </div>

              {!isChartExpanded && (
                <div className="flex flex-col gap-6">
                  <div className="bg-[#020407] rounded-[2.5rem] border border-zinc-800 p-6 shadow-2xl relative overflow-hidden flex-1 min-h-[450px]">
                    <div className="absolute top-0 right-0 p-4 bg-blue-500/5 blur-2xl rounded-full" />
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Activity className="w-3 h-3 text-blue-400" />
                      Technical Signals
                    </h4>
                    
                    <div className="h-full">
                      <TradingViewTechnicalAnalysisWidget 
                        symbol={selectedStock.includes(':') ? selectedStock : `IDX:${selectedStock}`}
                        interval="1D"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* News & Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-[#DFFF00]" />
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Institutional Intelligence Feed</h4>
                  </div>
                  <button 
                    onClick={() => loadStockNews(true)}
                    disabled={isNewsLoading}
                    className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-[#DFFF00] transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isNewsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                
                <div className="bg-[#020407] rounded-[2.5rem] border border-zinc-800 shadow-2xl overflow-hidden p-6">
                  {/* AI Sentiment Analysis Header block */}
                  <AnimatePresence>
                    {(isSentimentLoading || sentimentAnalysis) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="mb-8 p-6 bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-800 rounded-[2rem] relative overflow-hidden group"
                      >
                        <div className="absolute top-0 right-0 p-8 bg-[#DFFF00]/5 blur-3xl rounded-full" />
                        
                        <div className="flex items-start gap-4 relative z-10">
                          <div className="p-3 bg-[#DFFF00]/10 rounded-2xl border border-[#DFFF00]/20">
                            <BrainCircuit className="w-6 h-6 text-[#DFFF00]" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-[#DFFF00] uppercase tracking-[0.2em]">AI Intelligence Synthesis</span>
                                {isSentimentLoading && <Loader2 className="w-3 h-3 text-[#DFFF00] animate-spin" />}
                              </div>
                              {sentimentAnalysis && (
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-900 rounded-md border border-zinc-800">
                                    <span className="text-[8px] font-black text-zinc-500 uppercase">Sentiment</span>
                                    <span className={`text-[10px] font-black ${sentimentAnalysis.score > 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                                      {sentimentAnalysis.score}%
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-900 rounded-md border border-zinc-800">
                                    <span className="text-[8px] font-black text-zinc-500 uppercase">Confidence</span>
                                    <span className="text-[10px] font-black text-[#DFFF00]">
                                      {sentimentAnalysis.confidence}%
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {isSentimentLoading ? (
                              <div className="space-y-2">
                                <div className="h-4 bg-zinc-800 rounded-full w-3/4 animate-pulse" />
                                <div className="h-4 bg-zinc-800 rounded-full w-1/2 animate-pulse" />
                              </div>
                            ) : sentimentAnalysis ? (
                              <div className="flex flex-col md:flex-row md:items-start gap-4">
                                <p className="flex-1 text-[13px] text-zinc-200 font-bold leading-relaxed">
                                  {sentimentAnalysis.summary}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        </div>
                        
                        {/* Sentiment Meter */}
                        {sentimentAnalysis && (
                          <div className="mt-4 pt-4 border-t border-zinc-800/50">
                            <div className="flex justify-between text-[8px] font-black text-zinc-600 uppercase mb-2">
                              <span>Institutional Fear</span>
                              <span>Institutional Greed</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${sentimentAnalysis.score}%` }}
                                className={`h-full rounded-full ${sentimentAnalysis.score > 50 ? 'bg-emerald-500' : 'bg-red-500'}`}
                              />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isNewsLoading ? (
                    <div className="space-y-4 animate-pulse">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-zinc-900 rounded-2xl" />
                      ))}
                    </div>
                  ) : news.length > 0 ? (
                    <div className="space-y-6">
                      {news.map((item, idx) => (
                        <div key={idx} className="flex gap-4 p-4 rounded-2xl hover:bg-zinc-900/50 transition-colors border border-transparent hover:border-zinc-800/50 group">
                          <div className={`p-2 rounded-xl h-fit border ${
                            item.sentiment === 'bullish' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            item.sentiment === 'bearish' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                            'bg-zinc-800 border-zinc-700 text-zinc-400'
                          }`}>
                            {item.sentiment === 'bullish' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-4">
                              <h5 className="text-[13px] font-black text-zinc-100 group-hover:text-white leading-tight">{item.headline}</h5>
                              
                              {/* Individual AI Sentiment Tag */}
                              {sentimentAnalysis?.items?.find(s => s.headline === item.headline) && (
                                <div className="flex shrink-0 gap-1.5">
                                  {(() => {
                                    const analysis = sentimentAnalysis.items.find(s => s.headline === item.headline);
                                    if (!analysis) return null;
                                    return (
                                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/40 rounded-lg border border-zinc-800/50 backdrop-blur-sm self-start">
                                        <div className="flex items-center gap-1">
                                          <span className="text-[8px] font-black text-zinc-500 uppercase">AI AI</span>
                                          <span className={`text-[10px] font-black ${analysis.score > 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {analysis.score}%
                                          </span>
                                        </div>
                                        <div className="w-px h-2.5 bg-zinc-800" />
                                        <span className="text-[9px] font-black text-zinc-500">
                                          {analysis.confidence}% CF
                                        </span>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                            
                            <p className="text-[11px] text-zinc-500 leading-relaxed">{item.summary}</p>
                            <div className="flex items-center gap-3 pt-2">
                              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {item.timestamp}
                              </span>
                              <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest border-l border-zinc-800 pl-3">Source: {item.url ? new URL(item.url).hostname : 'VAM Intelligence'}</span>
                              {item.url && (
                                <a 
                                  href={item.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-[9px] font-black text-[#DFFF00] uppercase tracking-widest hover:underline ml-auto"
                                >
                                  Read Full Analysis <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 text-zinc-600 text-xs font-black uppercase tracking-widest">No Intelligence for this Symbol</div>
                  )}
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                {/* Price Alerts Console */}
                <div className="bg-[#020407] rounded-[2.5rem] border border-zinc-800 p-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 bg-orange-500/5 blur-2xl rounded-full" />
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                       <Bell className="w-3 h-3 text-orange-400" />
                       Price Alerts
                    </h4>
                    <button 
                      onClick={() => setShowAddAlert(!showAddAlert)}
                      className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 text-[#DFFF00] hover:bg-zinc-800 transition-colors"
                    >
                      {showAddAlert ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showAddAlert && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleAddAlert}
                        className="space-y-4 mb-6 pt-2 overflow-hidden relative z-10"
                      >
                        <div className="space-y-3 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                          <div className="flex bg-black rounded-xl p-1 border border-zinc-800">
                            <button
                              type="button"
                              onClick={() => setAlertCondition('gt')}
                              className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${alertCondition === 'gt' ? 'bg-zinc-800 text-[#DFFF00]' : 'text-zinc-600'}`}
                            >
                              Price Above
                            </button>
                            <button
                              type="button"
                              onClick={() => setAlertCondition('lt')}
                              className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${alertCondition === 'lt' ? 'bg-zinc-800 text-[#DFFF00]' : 'text-zinc-600'}`}
                            >
                              Price Below
                            </button>
                          </div>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-500">Rp</span>
                            <input
                              type="number"
                              placeholder="Target Price..."
                              value={alertPrice}
                              onChange={(e) => setAlertPrice(e.target.value)}
                              className="w-full bg-black border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-[13px] font-black text-white outline-none focus:border-[#DFFF00]/30"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={!alertPrice}
                            className="w-full py-3 bg-[#DFFF00] text-black font-black text-[10px] uppercase tracking-widest rounded-xl disabled:opacity-50"
                          >
                            Set Alert
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2 relative z-10">
                    {activeStockAlerts.length > 0 ? (
                      activeStockAlerts.map(alert => (
                        <div key={alert.id} className="flex items-center justify-between p-3 bg-zinc-900 rounded-xl border border-zinc-800 group transition-all hover:border-zinc-700">
                          <div>
                            <p className="text-[10px] font-black text-white uppercase tracking-tighter">
                              {alert.condition === 'gt' ? 'Above' : 'Below'} Rp {typeof alert.targetPrice === 'number' ? alert.targetPrice.toLocaleString('id-ID') : (alert.targetPrice || 'N/A')}
                            </p>
                            <p className="text-[8px] text-zinc-600 font-bold uppercase mt-0.5">Created: {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          <button 
                            onClick={() => onRemoveAlert(alert.id)}
                            className="p-2 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
                        <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">No Active Alerts</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[#020407] rounded-[2.5rem] border border-zinc-800 p-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 bg-[#DFFF00]/5 blur-2xl rounded-full" />
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">VAM Direct Asset Summary</h4>
                  <div className="space-y-4">
                    {[
                      { label: 'Risk Factor', val: 'MODERATE', color: 'text-orange-400' },
                      { label: 'Asset Class', val: 'EQUITIES', color: 'text-white' },
                      { label: 'Market Cap', val: 'LARGE CAP', color: 'text-[#DFFF00]' },
                      { label: 'Volatility', val: 'STABLE', color: 'text-emerald-400' },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between border-b border-zinc-800/50 pb-2">
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter">{item.label}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${item.color}`}>{item.val}</span>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-6 py-3 bg-[#DFFF00] text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:opacity-90 active:scale-95 transition-all">
                    Initiate Position
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-8 max-w-xl mx-auto">
            <div className="w-24 h-24 bg-zinc-900 rounded-[2rem] flex items-center justify-center border border-zinc-800 shadow-2xl relative">
              <Search className="w-10 h-10 text-zinc-700" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#DFFF00] rounded-full flex items-center justify-center border-4 border-black">
                <Plus className="w-2 h-2 text-black" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-black text-zinc-300 uppercase tracking-widest">Market Discovery Hub</p>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">Enter a stock symbol to load deep institutional profiles and real-time analytics</p>
            </div>

            <form onSubmit={handleSearch} className="w-full relative group">
              <div className="absolute inset-0 bg-[#DFFF00]/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <input
                type="text"
                placeholder="Ex: BBCA, TLKM, AAPL, NVDA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-[#05070a] border border-zinc-800 rounded-[1.5rem] py-5 pl-6 pr-16 text-lg font-black text-white focus:border-[#DFFF00]/50 focus:bg-black outline-none transition-all placeholder:text-zinc-800 shadow-2xl relative z-10"
              />
              <button 
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-[#DFFF00] text-black rounded-xl hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 z-20"
              >
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </button>
            </form>

            <div className="flex flex-wrap justify-center gap-3 pt-4">
               {['BBCA', 'TLKM', 'ADRO', 'GOTO', 'BMRI'].map(symbol => (
                 <button
                   key={symbol}
                   onClick={() => {
                     setSearchQuery(symbol);
                     handleSearch(undefined, symbol);
                   }}
                   className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-[10px] font-black text-zinc-500 hover:text-[#DFFF00] hover:border-[#DFFF00]/30 transition-all uppercase"
                 >
                   {symbol}
                 </button>
               ))}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
