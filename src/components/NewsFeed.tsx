import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper, Clock, ExternalLink, TrendingUp, TrendingDown, Minus, BrainCircuit } from 'lucide-react';
import type { MarketNews } from '../services/marketService';

interface NewsFeedProps {
  news: MarketNews[];
  isLoading?: boolean;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ news, isLoading }) => {
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="w-3 h-3 text-emerald-500" />;
      case 'bearish': return <TrendingDown className="w-3 h-3 text-rose-500" />;
      default: return <Minus className="w-3 h-3 text-slate-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-emerald-500';
      case 'bearish': return 'text-rose-500';
      default: return 'text-slate-500';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-900/40 rounded-2xl p-4 border border-slate-800/50 h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-[#DFFF00]" />
          <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Market Intelligence Feed</h3>
        </div>
        <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Live Streams</span>
      </div>

      <div className="grid gap-3">
        <AnimatePresence mode="popLayout">
          {news.map((item, i) => (
            <motion.div
              key={`${item.headline}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-[#0c1016] rounded-2xl border border-slate-800/40 p-4 hover:border-slate-700/60 transition-all cursor-default relative overflow-hidden"
            >
              {/* Subtle sentiment glow */}
              <div className={`absolute top-0 left-0 w-1 h-full ${
                item.sentiment === 'bullish' ? 'bg-emerald-500/50' : 
                item.sentiment === 'bearish' ? 'bg-rose-500/50' : 'bg-slate-500/20'
              }`} />

              <div className="space-y-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h4 className="text-[11px] font-black text-slate-100 leading-relaxed group-hover:text-white transition-colors">
                        {item.headline}
                      </h4>
                      <div className={`px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shrink-0 ${
                        item.sentiment === 'bullish' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        item.sentiment === 'bearish' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                        'bg-zinc-800 border-zinc-700 text-zinc-400'
                      }`}>
                        {getSentimentIcon(item.sentiment)}
                        {item.sentiment}
                      </div>
                      
                      {item.score !== undefined && (
                        <div className="px-2 py-0.5 bg-[#DFFF00]/10 rounded-lg border border-[#DFFF00]/20 text-[#DFFF00] text-[8px] font-black uppercase tracking-widest shrink-0">
                          AI: {item.score}%
                        </div>
                      )}

                      {item.vam_sentiment && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                            item.vam_sentiment.impact === 'CRITICAL' ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' :
                            item.vam_sentiment.impact === 'HIGH' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' :
                            item.vam_sentiment.impact === 'MODERATE' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' :
                            'bg-zinc-800 border-zinc-700 text-zinc-500'
                          }`}>
                            <BrainCircuit className="w-2.5 h-2.5" />
                            {item.vam_sentiment.impact}
                          </span>
                          
                          {item.vam_signal && (
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${
                              item.vam_signal.includes('BUY') ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' :
                              item.vam_signal.includes('SELL') ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' :
                              'bg-zinc-800 border-zinc-700 text-zinc-400'
                            }`}>
                              {item.vam_signal}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2 italic">
                  "{item.summary}"
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/20">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 gray-500">
                      <Clock className="w-3 h-3 text-slate-600" />
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                      Source: {item.source}
                    </span>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[8px] font-bold text-[#DFFF00] uppercase tracking-widest bg-[#DFFF00]/10 px-2 py-0.5 rounded border border-[#DFFF00]/20">
                    Analyze <ExternalLink className="w-2 h-2" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NewsFeed;
