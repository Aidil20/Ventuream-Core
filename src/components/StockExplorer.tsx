import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, TrendingUp, TrendingDown, Clock, Newspaper, BarChart2, Star, X, Zap } from 'lucide-react';
import TradingViewWidget from './TradingViewWidget';
import { fetchMarketNewsSummary } from '../services/geminiService';

interface StockNews {
  headline: string;
  summary: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  timestamp: string;
}

export const StockExplorer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>(['BBCA', 'TLKM', 'ADRO']);
  const [news, setNews] = useState<StockNews[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSelectedStock(searchQuery.toUpperCase());
    }
  };

  useEffect(() => {
    if (selectedStock) {
      const loadStockNews = async () => {
        setIsNewsLoading(true);
        try {
          // In a real app, you'd pass the specific stock to a news API
          // For now we use the general institutional news as a proxy
          const data = await fetchMarketNewsSummary(true);
          setNews(data.map(item => ({
            headline: item.headline,
            summary: item.insight,
            sentiment: item.sentiment,
            timestamp: item.timestamp
          })));
        } catch (error) {
          console.error("News load error:", error);
        } finally {
          setIsNewsLoading(false);
        }
      };
      loadStockNews();
    }
  }, [selectedStock]);

  const toggleWatchlist = (symbol: string) => {
    setWatchlist(prev => 
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Bar & Watchlist Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search Symbols (e.g. BBCA, AAPL, BTCUSD)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#020407] border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-sm font-black text-white focus:border-[#DFFF00]/50 outline-none transition-all placeholder:text-zinc-700"
          />
        </form>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mr-2">Watchlist:</span>
          {watchlist.map(symbol => (
            <button
              key={symbol}
              onClick={() => setSelectedStock(symbol)}
              className={`px-3 py-1.5 rounded-xl border text-[10px] font-black transition-all ${
                selectedStock === symbol 
                  ? 'bg-[#DFFF00] text-black border-[#DFFF00]' 
                  : 'bg-[#020407] text-zinc-400 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>

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
            <div className="flex items-center justify-between bg-[#020407] p-6 rounded-[2.5rem] border border-zinc-800 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-zinc-900 rounded-[1.5rem] border border-zinc-800">
                  <BarChart2 className="w-6 h-6 text-[#DFFF00]" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tighter">{selectedStock}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Global Asset ID</span>
                    <div className="w-1.5 h-1.5 bg-[#DFFF00] rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-[#DFFF00] uppercase tracking-widest">LIVE DATASTREAM</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
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

            {/* TradingView Section */}
            <div className="bg-[#020407] rounded-[2.5rem] border border-zinc-800 overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-zinc-800 bg-black/40 flex justify-between items-center">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Institutional Charting Terminal</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-[#DFFF00]" />
                    <span className="text-[9px] font-black text-[#DFFF00] uppercase tracking-widest">Indicators: EMA, RSI, MACD, BB</span>
                  </div>
                </div>
              </div>
              <TradingViewWidget 
                symbol={selectedStock.includes(':') ? selectedStock : `IDX:${selectedStock}`} 
                studies={["MASimple@tv-basicstudies", "MAExp@tv-basicstudies", "RSI@tv-basicstudies", "MACD@tv-basicstudies", "BB@tv-basicstudies"]}
              />
            </div>

            {/* News & Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <Newspaper className="w-4 h-4 text-[#DFFF00]" />
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">Institutional Intelligence Feed</h4>
                </div>
                
                <div className="bg-[#020407] rounded-[2.5rem] border border-zinc-800 shadow-2xl overflow-hidden p-6">
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
                          <div className="flex-1 space-y-1">
                            <h5 className="text-[13px] font-black text-zinc-100 group-hover:text-white">{item.headline}</h5>
                            <p className="text-[11px] text-zinc-500 leading-relaxed">{item.summary}</p>
                            <div className="flex items-center gap-3 pt-1">
                              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {item.timestamp}
                              </span>
                              <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest border-l border-zinc-800 pl-3">Source: VAM Intelligence Network</span>
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
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-24 h-24 bg-zinc-900 rounded-[2rem] flex items-center justify-center border border-zinc-800 shadow-2xl relative">
              <Search className="w-10 h-10 text-zinc-700" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#DFFF00] rounded-full flex items-center justify-center border-4 border-black">
                <Plus className="w-2 h-2 text-black" />
              </div>
            </div>
            <div>
              <p className="text-sm font-black text-zinc-300 uppercase tracking-widest">Market Discovery Hub</p>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter mt-1">Search for symbols to load deep institutional profiles</p>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
