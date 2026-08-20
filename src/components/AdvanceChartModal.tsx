import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChartCandlestick, Search, Maximize2, Minimize2, ExternalLink, Activity, Sparkles } from 'lucide-react';
import TradingViewWidget from './TradingViewWidget';

import { getTradingViewSymbol } from '../lib/stockUtils';

interface AdvanceChartModalProps {
  symbol: string | null;
  isOpen: boolean;
  onClose: () => void;
  market?: string;
}

const POPULAR_TICKERS = [
  { label: 'PGAS', symbol: 'IDX:PGAS', name: 'Perusahaan Gas Negara' },
  { label: 'PGEO', symbol: 'IDX:PGEO', name: 'Pertamina Geothermal' },
  { label: 'CGAS', symbol: 'IDX:CGAS', name: 'Citra Nusantara Energi' },
  { label: 'SMGA', symbol: 'IDX:SMGA', name: 'Sumber Mineral Global Abadi' },
  { label: 'DATA', symbol: 'IDX:DATA', name: 'Remala Abadi' },
  { label: 'GOLF', symbol: 'IDX:GOLF', name: 'Intra GolfLink' },
  { label: 'BREN', symbol: 'IDX:BREN', name: 'Barito Renewables' },
  { label: 'BBCA', symbol: 'IDX:BBCA', name: 'Bank Central Asia' },
  { label: 'BBRI', symbol: 'IDX:BBRI', name: 'Bank Rakyat Indonesia' },
  { label: 'BMRI', symbol: 'IDX:BMRI', name: 'Bank Mandiri' },
  { label: 'TLKM', symbol: 'IDX:TLKM', name: 'Telkom Indonesia' },
  { label: 'GOTO', symbol: 'IDX:GOTO', name: 'GoTo Gojek Tokopedia' },
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
  const [selectedInterval, setSelectedInterval] = useState<string>('D');
  const [selectedStudies, setSelectedStudies] = useState<string[]>([
    "MASimple@tv-basicstudies",
    "MAExp@tv-basicstudies",
    "RSI@tv-basicstudies"
  ]);

  // Sync internal currentSymbol when prop symbol changes
  React.useEffect(() => {
    if (symbol) {
      const formatted = getTradingViewSymbol(symbol);
      setCurrentSymbol(prev => prev !== formatted ? formatted : prev);
    }
  }, [symbol, market]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    const sym = getTradingViewSymbol(searchInput.trim());
    setCurrentSymbol(sym);
    setSearchInput('');
  };

  const cleanTicker = currentSymbol.includes(':') ? currentSymbol.split(':')[1] : currentSymbol;
  const exchange = currentSymbol.includes(':') ? currentSymbol.split(':')[0] : market;

  const timeframeList = [
    { label: '15m', value: '15' },
    { label: '1H', value: '60' },
    { label: '4H', value: '240' },
    { label: '1D', value: 'D' },
    { label: '1W', value: 'W' }
  ];

  const studiesList = [
    { id: "MAExp@tv-basicstudies", name: "EMA (Exponential MA)" },
    { id: "MASimple@tv-basicstudies", name: "SMA (Simple MA)" },
    { id: "RSI@tv-basicstudies", name: "RSI" },
    { id: "MACD@tv-basicstudies", name: "MACD" },
    { id: "StochasticRSI@tv-basicstudies", name: "Stoch RSI" },
    { id: "BB@tv-basicstudies", name: "Bollinger Bands" },
    { id: "VP@tv-basicstudies", name: "Volume Profile" }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
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

          {/* Indicator & Timeframe Toolbar */}
          <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-900 flex flex-wrap items-center justify-between gap-2 shrink-0">
            {/* Timeframe Selector */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[8.5px] font-mono text-zinc-500 font-bold uppercase">TF:</span>
              <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                {timeframeList.map((tf) => (
                  <button
                    key={tf.value}
                    onClick={() => setSelectedInterval(tf.value)}
                    className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-bold transition-all ${
                      selectedInterval === tf.value
                        ? 'bg-[#deff9a] text-black shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Indicator Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
              <span className="text-[8.5px] font-mono text-zinc-500 font-bold uppercase shrink-0">Indikator:</span>
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
              <span>TradingView.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Main Chart Area */}
          <div className="flex-1 min-h-[450px] md:min-h-[500px] w-full relative bg-black">
            <TradingViewWidget symbol={currentSymbol} studies={selectedStudies} interval={selectedInterval} />
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};

export default AdvanceChartModal;
