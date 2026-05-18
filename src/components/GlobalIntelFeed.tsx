import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Shield, TrendingUp, TrendingDown, Cpu, Zap, Activity } from 'lucide-react';

interface GlobalIntel {
  market: Record<string, { price: number, change_pct: number }>;
  geopolitics: Array<{ 
    headline: string; 
    source: string; 
    timestamp: string;
    sentiment?: {
      score: number;
      impact: string;
      keywords: string[];
    };
    signal?: string;
  }>;
  status: string;
}

export const GlobalIntelFeed = () => {
  const [data, setData] = useState<GlobalIntel | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchIntel = async () => {
    try {
      const response = await fetch('/api/market/global-intel');
      const json = await response.json();
      setData(json);
    } catch (err) {
      console.error("Intel fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntel();
    const interval = setInterval(fetchIntel, 300000); // 5 mins
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-zinc-950/40 rounded-3xl border border-zinc-800/50 overflow-hidden backdrop-blur-xl">
      <div className="p-5 border-b border-zinc-900/50 flex justify-between items-center bg-zinc-900/30">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#deff9a]" />
            Global Tactical Intelligence
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="flex h-2 w-2 rounded-full bg-[#deff9a] animate-pulse" />
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">AI Silent Ingestor Active</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-full flex items-center gap-2">
          <Shield className="w-3 h-3 text-[#deff9a]" />
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter">
            {data?.status || 'INGESTING...'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-900/50">
        {/* International Market Node */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em] flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5" />
              Strategic Tech Node
            </h4>
            <Zap className="w-3 h-3 text-zinc-700" />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-16 bg-zinc-900/50 rounded-2xl animate-pulse" />
              ))
            ) : (
              data && Object.entries(data.market).map(([ticker, val]) => {
                const stockData = val as { price: number, change_pct: number };
                return (
                  <motion.div 
                    key={ticker}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-900/40 p-3 rounded-2xl border border-zinc-800/30 hover:border-[#deff9a]/30 transition-all group"
                  >
                    <p className="text-[10px] font-black text-zinc-400 group-hover:text-white transition-colors">{ticker}</p>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-xs font-mono font-black text-white">${stockData.price.toFixed(2)}</span>
                      <span className={`text-[9px] font-bold ${stockData.change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {stockData.change_pct >= 0 ? '+' : ''}{stockData.change_pct}%
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Geopolitical Intel Stream */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em] flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" />
              Risk Intel Stream
            </h4>
            <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Source: Reuters/Bloomberg</span>
          </div>

          <div className="space-y-2.5">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-12 bg-zinc-900/50 rounded-2xl animate-pulse" />
              ))
            ) : (
              data && data.geopolitics.map((news, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-zinc-950/30 p-2.5 rounded-xl border-l-2 border-zinc-800 hover:border-[#deff9a] transition-all group"
                >
                  <p className="text-[11px] font-bold text-zinc-200 leading-tight line-clamp-2">
                    {news.headline}
                  </p>

                  {news.sentiment && (
                    <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${
                        news.sentiment.impact === 'CRITICAL' ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' :
                        news.sentiment.impact === 'HIGH' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' :
                        news.sentiment.impact === 'MODERATE' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' :
                        'bg-zinc-800 border-zinc-700 text-zinc-500'
                      }`}>
                        {news.sentiment.impact}
                      </span>
                      
                      {news.signal && (
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${
                          news.signal.includes('BUY') ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' :
                          news.signal.includes('SELL') ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' :
                          'bg-zinc-800 border-zinc-700 text-zinc-400'
                        }`}>
                          {news.signal}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{news.source}</span>
                    <span className="text-[8px] text-zinc-700">•</span>
                    <span className="text-[8px] text-zinc-700 uppercase">{news.timestamp}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalIntelFeed;
