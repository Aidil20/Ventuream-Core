import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper, Clock, ExternalLink, TrendingUp, TrendingDown, Minus, BrainCircuit, RefreshCw, BarChart2 } from 'lucide-react';
import type { MarketNews } from '../services/marketService';

interface NewsFeedProps {
  news: MarketNews[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ news, isLoading, onRefresh }) => {
  const [analyzingHeadline, setAnalyzingHeadline] = useState<string | null>(null);
  const [customBreakdowns, setCustomBreakdowns] = useState<Record<string, { bullish: number; neutral: number; bearish: number }>>({});

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="w-3 h-3 text-emerald-500" />;
      case 'bearish': return <TrendingDown className="w-3 h-3 text-rose-500" />;
      default: return <Minus className="w-3 h-3 text-slate-500" />;
    }
  };

  const getBreakdown = (item: MarketNews) => {
    if (customBreakdowns[item.headline]) {
      return customBreakdowns[item.headline];
    }
    if (item.sentimentBreakdown && typeof item.sentimentBreakdown.bullish === 'number') {
      return item.sentimentBreakdown;
    }

    const score = item.score !== undefined ? item.score : (item.vam_sentiment?.score ? Math.min(100, Math.max(0, (item.vam_sentiment.score + 10) * 5)) : 50);
    const s = (item.sentiment || 'neutral').toLowerCase();

    if (s === 'bullish') {
      const b = Math.min(95, Math.max(55, Math.round(score)));
      const r = Math.max(4, Math.round((100 - b) * 0.35));
      const n = 100 - b - r;
      return { bullish: b, neutral: n, bearish: r };
    } else if (s === 'bearish') {
      const r = Math.min(95, Math.max(55, Math.round(score)));
      const b = Math.max(4, Math.round((100 - r) * 0.35));
      const n = 100 - r - b;
      return { bullish: b, neutral: n, bearish: r };
    } else {
      const n = Math.min(80, Math.max(50, Math.round(score)));
      const b = Math.round((100 - n) / 2);
      const r = 100 - n - b;
      return { bullish: b, neutral: n, bearish: r };
    }
  };

  const handleDeepSentimentAnalysis = async (item: MarketNews) => {
    setAnalyzingHeadline(item.headline);
    try {
      const response = await fetch('/api/market/news-sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          news: [{ headline: item.headline, summary: item.summary }],
          symbol: item.source || 'IDX'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const score = typeof data.score === 'number' ? data.score : 50;
        let b = 33, n = 34, r = 33;
        if (score >= 60) {
          b = Math.min(95, score);
          r = Math.max(5, Math.round((100 - b) * 0.4));
          n = 100 - b - r;
        } else if (score <= 40) {
          r = Math.min(95, 100 - score);
          b = Math.max(5, Math.round((100 - r) * 0.4));
          n = 100 - r - b;
        } else {
          n = Math.min(85, Math.max(50, data.confidence || 60));
          b = Math.round((100 - n) / 2);
          r = 100 - n - b;
        }

        setCustomBreakdowns(prev => ({
          ...prev,
          [item.headline]: { bullish: b, neutral: n, bearish: r }
        }));
      }
    } catch (err) {
      console.error("Deep sentiment error:", err);
    } finally {
      setAnalyzingHeadline(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-900/40 rounded-2xl p-4 border border-slate-800/50 h-32" />
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
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button 
              onClick={onRefresh}
              className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Refresh News Feed"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
          <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Ingest
          </span>
        </div>
      </div>

      <div className="grid gap-3">
        <AnimatePresence mode="popLayout">
          {news.map((item, i) => {
            const breakdown = getBreakdown(item);
            const isAnalyzing = analyzingHeadline === item.headline;

            return (
              <motion.div
                key={`${item.headline}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.08 }}
                className="group bg-[#0c1016] rounded-2xl border border-slate-800/40 p-4 hover:border-slate-700/60 transition-all cursor-default relative overflow-hidden"
              >
                {/* Subtle sentiment glow edge */}
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

                  {/* Gemini Sentiment Bar Indicator */}
                  <div className="bg-zinc-950/70 rounded-xl p-2.5 border border-zinc-800/60 space-y-1.5">
                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <BarChart2 className="w-3 h-3 text-[#DFFF00]" />
                        <span>Sentiment Spectrum Indicator</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[8.5px]">
                        <span className="text-emerald-400 font-extrabold">{breakdown.bullish}% Bullish</span>
                        <span className="text-amber-300 font-extrabold">{breakdown.neutral}% Neutral</span>
                        <span className="text-rose-400 font-extrabold">{breakdown.bearish}% Bearish</span>
                      </div>
                    </div>

                    {/* Multi-segment sentiment bar */}
                    <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden flex shadow-inner border border-zinc-800/80">
                      <div 
                        style={{ width: `${breakdown.bullish}%` }} 
                        className="bg-emerald-500 h-full transition-all duration-500 relative group/bar"
                        title={`Bullish Trend: ${breakdown.bullish}%`}
                      />
                      <div 
                        style={{ width: `${breakdown.neutral}%` }} 
                        className="bg-amber-400/80 h-full transition-all duration-500 relative group/bar"
                        title={`Neutral Stance: ${breakdown.neutral}%`}
                      />
                      <div 
                        style={{ width: `${breakdown.bearish}%` }} 
                        className="bg-rose-500 h-full transition-all duration-500 relative group/bar"
                        title={`Bearish Trend: ${breakdown.bearish}%`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/20">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3 h-3 text-slate-600" />
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                        Source: {item.source}
                      </span>
                    </div>

                    <button 
                      onClick={() => handleDeepSentimentAnalysis(item)}
                      disabled={isAnalyzing}
                      className="flex items-center gap-1 text-[8px] font-bold text-[#DFFF00] uppercase tracking-widest bg-[#DFFF00]/10 hover:bg-[#DFFF00]/20 px-2 py-1 rounded border border-[#DFFF00]/20 transition-all disabled:opacity-50"
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="w-2.5 h-2.5 animate-spin text-[#DFFF00]" />
                          Parsing...
                        </>
                      ) : (
                        <>
                          <BrainCircuit className="w-2.5 h-2.5" />
                          Parse Sentiment <ExternalLink className="w-2 h-2" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const MarketNewsFeed = NewsFeed;
export default NewsFeed;
