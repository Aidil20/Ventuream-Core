import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChartCandlestick, Search, Maximize2, Minimize2, ExternalLink, Activity, Sparkles } from 'lucide-react';
import TradingViewWidget from './TradingViewWidget';

interface AdvanceChartModalProps {
  symbol: string | null;
  isOpen: boolean;
  onClose: () => void;
  market?: string;
}

const POPULAR_TICKERS = [
  { label: 'BBCA', symbol: 'IDX:BBCA', name: 'Bank Central Asia' },
  { label: 'BBRI', symbol: 'IDX:BBRI', name: 'Bank Rakyat Indonesia' },
  { label: 'BMRI', symbol: 'IDX:BMRI', name: 'Bank Mandiri' },
  { label: 'TLKM', symbol: 'IDX:TLKM', name: 'Telkom Indonesia' },
  { label: 'ASII', symbol: 'IDX:ASII', name: 'Astra International' },
  { label: 'GOTO', symbol: 'IDX:GOTO', name: 'GoTo Gojek Tokopedia' },
  { label: 'BREN', symbol: 'IDX:BREN', name: 'Barito Renewables' },
  { label: 'AAPL', symbol: 'NASDAQ:AAPL', name: 'Apple Inc.' },
  { label: 'NVDA', symbol: 'NASDAQ:NVDA', name: 'NVIDIA Corp' },
  { label: 'BTCUSD', symbol: 'BITSTAMP:BTCUSD', name: 'Bitcoin / USD' }
];

export const AdvanceChartModal: React.FC<AdvanceChartModalProps> = ({
  symbol,
  isOpen,
  onClose,
  market = 'IDX'
}) => {
  const [currentSymbol, setCurrentSymbol] = useState<string>(symbol || 'IDX:BBCA');
  const [searchInput, setSearchInput] = useState<string>('');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [selectedStudies, setSelectedStudies] = useState<string[]>([
    "MASimple@tv-basicstudies",
    "MAExp@tv-basicstudies",
    "RSI@tv-basicstudies"
  ]);

  // Sync internal currentSymbol when prop symbol changes
  React.useEffect(() => {
    if (symbol) {
      let formatted = symbol;
      if (!symbol.includes(':')) {
        if (market === 'US' || symbol === 'AAPL' || symbol === 'NVDA' || symbol === 'MSFT' || symbol === 'TSLA') {
          formatted = `NASDAQ:${symbol}`;
        } else if (market === 'CRYPTO' || symbol.includes('BTC') || symbol.includes('ETH')) {
          formatted = `BITSTAMP:${symbol.replace('/', '')}`;
        } else {
          formatted = `IDX:${symbol.replace('.JK', '')}`;
        }
      }
      setCurrentSymbol(formatted);
    }
  }, [symbol, market]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    let sym = searchInput.trim().toUpperCase();
    if (!sym.includes(':')) {
      sym = `${market === 'US' ? 'NASDAQ' : market === 'CRYPTO' ? 'BITSTAMP' : 'IDX'}:${sym}`;
    }
    setCurrentSymbol(sym);
    setSearchInput('');
  };

  const cleanTicker = currentSymbol.includes(':') ? currentSymbol.split(':')[1] : currentSymbol;
  const exchange = currentSymbol.includes(':') ? currentSymbol.split(':')[0] : market;

  const studiesList = [
    { id: "MASimple@tv-basicstudies", name: "SMA 20" },
    { id: "MAExp@tv-basicstudies", name: "EMA 20" },
    { id: "RSI@tv-basicstudies", name: "RSI" },
    { id: "MACD@tv-basicstudies", name: "MACD" },
    { id: "StochasticRSI@tv-basicstudies", name: "Stoch RSI" },
    { id: "BB@tv-basicstudies", name: "Bollinger Bands" },
    { id: "VP@tv-basicstudies", name: "Volume Profile" }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`w-full flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden ${
            isFullScreen ? 'h-[98vh] max-w-[99vw]' : 'h-[90vh] max-w-7xl'
          }`}
        >
          {/* Header Bar */}
          <div className="px-4 py-3 bg-zinc-900/80 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Ticker Info & Search */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-zinc-800">
                <ChartCandlestick className="w-4 h-4 text-[#deff9a]" />
                <span className="text-[10px] font-black text-zinc-400 font-mono uppercase">{exchange}</span>
                <span className="text-sm font-black text-white font-mono">{cleanTicker}</span>
                <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ADVANCE CHART
                </span>
              </div>

              {/* Ticker Switcher Form */}
              <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
                <input
                  type="text"
                  placeholder="Cari Ticker (misal: BBRI, AAPL, BTCUSD)..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#deff9a] pl-8 w-56 font-mono"
                />
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
              </form>
            </div>

            {/* Quick Suggested Ticker Chips */}
            <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto max-w-md py-1">
              {POPULAR_TICKERS.map((t) => (
                <button
                  key={t.symbol}
                  onClick={() => setCurrentSymbol(t.symbol)}
                  className={`px-2 py-0.5 rounded-lg text-[8.5px] font-mono font-bold transition-all shrink-0 border ${
                    currentSymbol === t.symbol
                      ? 'bg-[#deff9a] text-black border-[#deff9a]'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors"
                title={isFullScreen ? "Minimize View" : "Maximize Fullscreen"}
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 transition-colors"
                title="Tutup Chart Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Indicator Toolbar */}
          <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-400 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-[#deff9a]" />
              <span className="font-bold text-white uppercase tracking-wider">Technical Indicators:</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {studiesList.map((st) => {
                const isActive = selectedStudies.includes(st.id);
                return (
                  <button
                    key={st.id}
                    onClick={() => {
                      setSelectedStudies(prev =>
                        isActive ? prev.filter(id => id !== st.id) : [...prev, st.id]
                      );
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[8.5px] font-mono font-bold uppercase transition-all shrink-0 border ${
                      isActive
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                    }`}
                  >
                    {st.name}
                  </button>
                );
              })}
            </div>

            <a
              href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(currentSymbol)}`}
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex items-center gap-1 text-[8.5px] font-mono font-bold text-sky-400 hover:text-sky-300 shrink-0 ml-2"
            >
              <span>TradingView Web</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Main Chart Area */}
          <div className="flex-1 min-h-0 w-full relative bg-black">
            <TradingViewWidget symbol={currentSymbol} studies={selectedStudies} />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AdvanceChartModal;
