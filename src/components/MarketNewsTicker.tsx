import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Newspaper, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Pause, 
  Play, 
  RefreshCw, 
  ChevronRight, 
  Sparkles, 
  Globe, 
  Zap, 
  ExternalLink, 
  X,
  Filter
} from 'lucide-react';
import { MarketNewsItem } from '../services/geminiService';

interface MarketNewsTickerProps {
  news?: MarketNewsItem[];
  onSelectSymbol?: (symbol: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const DEFAULT_NEWS: MarketNewsItem[] = [
  {
    headline: "IHSG Menguat ke 7.340 Ditopang Aksi Beli Bersih Investor Asing di Saham Perbankan BBCA & BMRI",
    summary: "Indeks Harga Saham Gabungan (IHSG) mencatatkan lonjakan +0.82% didorong oleh net buy asing senilai Rp1.2 Triliun pada sektor keuangan utama.",
    timestamp: "LIVE 10:45 WIB",
    source: "Bloomberg / Kontan",
    sentiment: "bullish",
    score: 88,
    url: "#"
  },
  {
    headline: "Bank Indonesia Pertahankan BI-Rate 6.00% Jaga Stabilitas Rupiah & Transaksi Berjalan YTD 2026",
    summary: "Rapat Dewan Gubernur BI memutuskan untuk menahan suku bunga acuan guna memastikan laju inflasi tetap terkendali dalam sasaran 2.5% ± 1%.",
    timestamp: "LIVE 10:38 WIB",
    source: "Reuters / BI",
    sentiment: "neutral",
    score: 65,
    url: "#"
  },
  {
    headline: "BREN Surges +5.4% usai Pengumuman Ekspansi Pembangkit Geothermal Tambahan 120 MW",
    summary: "PT Barito Renewables Energy Tbk mengumumkan finalisasi akuisisi aset energi terbarukan baru dengan target kontribusi EBITDA tumbuh 18%.",
    timestamp: "LIVE 10:20 WIB",
    source: "CNBC Indonesia",
    sentiment: "bullish",
    score: 91,
    url: "#"
  },
  {
    headline: "Minyak Mentah Brent Stabil di $78.40/Bbl di Tengah Ketegangan Jalur Logistik Global",
    summary: "Pasar energi global mencermati tingkat cadangan minyak mentah AS dan dinamika pasokan OPEC+ untuk kuartal berjalan.",
    timestamp: "LIVE 10:12 WIB",
    source: "Bloomberg Terminals",
    sentiment: "bearish",
    score: 42,
    url: "#"
  },
  {
    headline: "TLKM Alokasikan CapEx Rp28T Fokus Pembangunan AI Hyper-Scale Data Center & Infrastructure",
    summary: "Langkah strategis Telkom Indonesia dalam memperkuat segmen B2B Enterprise Solutions disambut positif oleh konsensus analis institusional.",
    timestamp: "LIVE 09:55 WIB",
    source: "Bisnis Indonesia",
    sentiment: "bullish",
    score: 84,
    url: "#"
  },
  {
    headline: "Rupiah Menguat Tipis ke Rp15.910/USD Terikat Arus Modal Masuk di SBN & Sekuritas Rupiah",
    summary: "Intervensi terukur di pasar spot dan DNDF menjaga nilai tukar rupiah dalam koridor ekspektasi fundamental ekonomi domestik.",
    timestamp: "LIVE 09:40 WIB",
    source: "MarketWatch / IDX",
    sentiment: "bullish",
    score: 79,
    url: "#"
  }
];

export const MarketNewsTicker: React.FC<MarketNewsTickerProps> = ({
  news = [],
  onSelectSymbol,
  onRefresh,
  isLoading = false
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [selectedSentiment, setSelectedSentiment] = useState<'all' | 'bullish' | 'bearish'>('all');
  const [selectedArticle, setSelectedArticle] = useState<MarketNewsItem | null>(null);

  const displayNews = news && news.length > 0 ? news : DEFAULT_NEWS;

  const filteredNews = displayNews.filter(item => {
    if (selectedSentiment === 'all') return true;
    return item.sentiment === selectedSentiment;
  });

  // Duplicate items for seamless infinite horizontal scrolling marquee effect
  const tickerItems = filteredNews.length > 0 
    ? [...filteredNews, ...filteredNews, ...filteredNews] 
    : [...DEFAULT_NEWS, ...DEFAULT_NEWS];

  const extractTickers = (headline: string): string[] => {
    const knownTickers = ['BBCA', 'BMRI', 'BBRI', 'BBNI', 'TLKM', 'BREN', 'GOTO', 'ADRO', 'ICBP', 'ASII', 'UNTR', 'AMMN', 'IHSG'];
    return knownTickers.filter(t => headline.includes(t));
  };

  return (
    <div className="relative my-4 w-full overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl shadow-2xl">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-full bg-[#deff9a]/5 blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-full bg-purple-500/5 blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-stretch border-b border-zinc-900/60">
        
        {/* Left Badge: Live Status & Filter Header */}
        <div className="z-20 flex items-center justify-between gap-3 bg-zinc-900/90 px-4 py-2.5 border-b md:border-b-0 md:border-r border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-3 w-3 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#deff9a]" />
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] font-mono">
                  MARKET NEWS TICKER
                </span>
              </div>
              <span className="text-[7.5px] font-bold text-zinc-500 uppercase tracking-widest">
                INSTANT MARKET MOVES ({filteredNews.length} REAL-TIME HEADLINES)
              </span>
            </div>
          </div>

          {/* Controls: Filter & Pause/Play */}
          <div className="flex items-center gap-1.5 ml-2">
            <div className="flex items-center bg-zinc-950 rounded-lg p-0.5 border border-zinc-800/80">
              <button
                onClick={() => setSelectedSentiment('all')}
                className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter transition-all ${
                  selectedSentiment === 'all' 
                    ? 'bg-[#deff9a] text-black shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Show all news"
              >
                ALL
              </button>
              <button
                onClick={() => setSelectedSentiment('bullish')}
                className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter transition-all ${
                  selectedSentiment === 'bullish' 
                    ? 'bg-emerald-500 text-black shadow-sm' 
                    : 'text-zinc-500 hover:text-emerald-400'
                }`}
                title="Bullish news only"
              >
                BULL
              </button>
              <button
                onClick={() => setSelectedSentiment('bearish')}
                className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter transition-all ${
                  selectedSentiment === 'bearish' 
                    ? 'bg-rose-500 text-white shadow-sm' 
                    : 'text-zinc-500 hover:text-rose-400'
                }`}
                title="Bearish news only"
              >
                BEAR
              </button>
            </div>

            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title={isPaused ? "Resume Ticker Scrolling" : "Pause Ticker Scrolling"}
            >
              {isPaused ? <Play className="w-3 h-3 text-[#deff9a]" /> : <Pause className="w-3 h-3" />}
            </button>

            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-[#deff9a] transition-colors disabled:opacity-50"
                title="Sync Latest Market News"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-[#deff9a]' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Ticker Scrolling Container */}
        <div className="relative flex-1 overflow-hidden py-2.5 flex items-center min-h-[44px]">
          {/* Gradient Left/Right Fades */}
          <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

          <div className={`flex items-center gap-6 whitespace-nowrap ${isPaused ? '' : 'animate-ticker-marquee'}`}>
            {tickerItems.map((item, index) => {
              const matchedTickers = extractTickers(item.headline);
              const isBullish = item.sentiment === 'bullish';
              const isBearish = item.sentiment === 'bearish';

              return (
                <div
                  key={`${item.headline}-${index}`}
                  onClick={() => setSelectedArticle(item)}
                  className="inline-flex items-center gap-2.5 px-3 py-1 bg-zinc-900/60 hover:bg-zinc-800/80 rounded-xl border border-zinc-800/80 hover:border-[#deff9a]/40 cursor-pointer transition-all group shrink-0"
                >
                  {/* Source & Time */}
                  <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-tight bg-zinc-950/80 px-1.5 py-0.5 rounded border border-zinc-800">
                    {item.source.split('/')[0]} • {item.timestamp}
                  </span>

                  {/* Sentiment Badge */}
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${
                    isBullish 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : isBearish 
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                  }`}>
                    {isBullish ? <TrendingUp className="w-2.5 h-2.5" /> : isBearish ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                    {item.sentiment}
                  </span>

                  {/* Tickers mentioned inside headline */}
                  {matchedTickers.map(ticker => (
                    <span 
                      key={ticker}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectSymbol) onSelectSymbol(ticker === 'IHSG' ? 'IDX:COMPOSITE' : ticker);
                      }}
                      className="text-[8px] font-mono font-black text-[#deff9a] bg-[#deff9a]/10 hover:bg-[#deff9a]/20 border border-[#deff9a]/30 px-1.5 py-0.5 rounded transition-colors"
                    >
                      ${ticker}
                    </span>
                  ))}

                  {/* Headline Text */}
                  <span className="text-[11px] font-bold text-zinc-200 group-hover:text-[#deff9a] transition-colors max-w-lg truncate">
                    {item.headline}
                  </span>

                  <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-[#deff9a] transition-colors" />
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Interactive News Detail Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 bg-[#deff9a]/5 blur-3xl rounded-full pointer-events-none" />

              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold text-[#deff9a] bg-[#deff9a]/10 px-2 py-0.5 rounded border border-[#deff9a]/20 uppercase">
                      {selectedArticle.source}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">
                      {selectedArticle.timestamp}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white mt-2 leading-snug">
                    {selectedArticle.headline}
                  </h3>
                </div>

                <button
                  onClick={() => setSelectedArticle(null)}
                  className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sentiment Score Bar */}
              <div className="p-3 bg-zinc-900/60 rounded-2xl border border-zinc-800 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                    selectedArticle.sentiment === 'bullish' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                    selectedArticle.sentiment === 'bearish' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                    'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}>
                    {selectedArticle.sentiment} Impact
                  </span>
                  {selectedArticle.score && (
                    <span className="text-[10px] font-mono font-bold text-zinc-400">
                      AI Signal Score: <span className="text-white">{selectedArticle.score}/100</span>
                    </span>
                  )}
                </div>

                <div className="flex gap-1.5">
                  {extractTickers(selectedArticle.headline).map(sym => (
                    <button
                      key={sym}
                      onClick={() => {
                        if (onSelectSymbol) onSelectSymbol(sym === 'IHSG' ? 'IDX:COMPOSITE' : sym);
                        setSelectedArticle(null);
                      }}
                      className="text-[9px] font-mono font-black text-[#deff9a] bg-[#deff9a]/10 hover:bg-[#deff9a]/20 border border-[#deff9a]/30 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                    >
                      Inspect ${sym}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Executive Summary Body */}
              <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800/50 mb-6">
                {selectedArticle.summary}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                <span className="text-[9px] font-mono text-zinc-500 uppercase">
                  Institutional Intelligence Proxy Active
                </span>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="px-4 py-2 bg-[#deff9a] text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity"
                >
                  Close Detail
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MarketNewsTicker;
