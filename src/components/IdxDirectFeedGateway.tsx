import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  RefreshCw, 
  Search, 
  ExternalLink, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  Code, 
  Clock, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight,
  Database,
  BarChart3,
  Copy,
  Check
} from 'lucide-react';

interface IdxStockSummary {
  code: string;
  name: string;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  changePercent: number;
  volume: number;
  value: number;
  frequency: number;
  marketCap?: number;
  date: string;
  timestamp?: string;
}

interface IdxHistoricalCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover: number;
  change: number;
  changePercent: number;
}

interface IdxMarketFeed {
  status: string;
  exchange: string;
  targetUrl: string;
  marketStatus: string;
  compositeIndex: {
    name: string;
    symbol: string;
    value: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
  };
  marketStats: {
    totalVolume: string;
    totalValue: string;
    totalFrequency: string;
    advancing: number;
    declining: number;
    unchanged: number;
  };
  topGainers: Array<{ code: string; name: string; price: number; changePercent: number; volume: string }>;
  topLosers: Array<{ code: string; name: string; price: number; changePercent: number; volume: string }>;
  mostActive: Array<{ code: string; name: string; price: number; value: string; volume: string }>;
  timestamp: string;
}

export const IdxDirectFeedGateway: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BBCA");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("1M");
  const [activeTab, setActiveTab] = useState<'summary' | 'historical' | 'market_feed' | 'api_docs'>('summary');
  
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  const [summaryData, setSummaryData] = useState<IdxStockSummary[]>([]);
  const [summarySource, setSummarySource] = useState<string>("");
  
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [historyData, setHistoryData] = useState<IdxHistoricalCandle[]>([]);
  
  const [loadingMarketFeed, setLoadingMarketFeed] = useState<boolean>(false);
  const [marketFeedData, setMarketFeedData] = useState<IdxMarketFeed | null>(null);
  
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const popularSymbols = ["BBCA", "BBRI", "BMRI", "TLKM", "ASII", "GOTO", "BREN", "AMMN", "ANTM", "ADRO"];

  // Fetch stock summary from backend proxy targeting https://www.idx.co.id/id
  const fetchStockSummary = async (sym?: string) => {
    setLoadingSummary(true);
    try {
      const url = sym ? `/api/idx/stock-summary?code=${sym}` : `/api/idx/stock-summary`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setSummaryData(json.data || []);
        setSummarySource(json.source || "https://www.idx.co.id/id");
      }
    } catch (err) {
      console.error("Failed to fetch IDX stock summary:", err);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Fetch historical price movement series
  const fetchHistoricalData = async (sym: string, period: string) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/idx/historical-data?symbol=${sym}&period=${period}`);
      if (res.ok) {
        const json = await res.json();
        setHistoryData(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch IDX historical data:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fetch overall IHSG & BEI Market Feed
  const fetchMarketFeed = async () => {
    setLoadingMarketFeed(true);
    try {
      const res = await fetch(`/api/idx/market-feed`);
      if (res.ok) {
        const json = await res.json();
        setMarketFeedData(json);
      }
    } catch (err) {
      console.error("Failed to fetch IDX market feed:", err);
    } finally {
      setLoadingMarketFeed(false);
    }
  };

  useEffect(() => {
    fetchStockSummary();
    fetchMarketFeed();
  }, []);

  useEffect(() => {
    if (selectedSymbol) {
      fetchHistoricalData(selectedSymbol, selectedPeriod);
    }
  }, [selectedSymbol, selectedPeriod]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const filteredSummary = summaryData.filter(item => 
    item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedStockDetails = summaryData.find(s => s.code === selectedSymbol) || (summaryData.length > 0 ? summaryData[0] : null);

  return (
    <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md my-6">
      {/* Top Banner Header */}
      <div className="p-5 border-b border-zinc-900 bg-gradient-to-r from-zinc-900/60 via-zinc-950 to-zinc-900/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <Globe className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white uppercase tracking-widest">
                Umpan Data Pasar Bursa Efek Indonesia (IDX / BEI)
              </h2>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                DIRECT FEED: idx.co.id
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono mt-1">
              Gateway Permintaan Data Feed Pergerakan Saham Real-time & Historis ke <a href="https://www.idx.co.id/id" target="_blank" rel="noopener noreferrer" className="text-[#deff9a] hover:underline font-bold inline-flex items-center gap-1">https://www.idx.co.id/id <ExternalLink className="w-2.5 h-2.5" /></a>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchStockSummary(selectedSymbol);
              fetchHistoricalData(selectedSymbol, selectedPeriod);
              fetchMarketFeed();
            }}
            disabled={loadingSummary || loadingHistory || loadingMarketFeed}
            className="px-3 py-1.5 bg-[#deff9a] text-black font-black text-[10px] uppercase tracking-wider rounded-xl hover:bg-[#cbf000] transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-lg shadow-[#deff9a]/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingSummary || loadingHistory ? 'animate-spin' : ''}`} />
            Tarik Data Feed BEI
          </button>
          
          <a
            href="https://www.idx.co.id/id/data-pasar/ringkasan-perdagangan/ringkasan-saham"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 hover:bg-zinc-800"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            Portal BEI Resmi
          </a>
        </div>
      </div>

      {/* IHSG Composite Live Header Strip */}
      {marketFeedData && (
        <div className="bg-zinc-900/40 px-5 py-3 border-b border-zinc-900 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">IHSG COMPOSITE:</span>
              <span className="text-sm font-black font-mono text-white">
                {marketFeedData.compositeIndex.value.toLocaleString('id-ID')}
              </span>
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded font-mono ${
                marketFeedData.compositeIndex.change >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
              }`}>
                {marketFeedData.compositeIndex.change >= 0 ? '+' : ''}{marketFeedData.compositeIndex.change.toFixed(2)} ({marketFeedData.compositeIndex.changePercent}%)
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-3 text-[10px] text-zinc-400 font-mono border-l border-zinc-800 pl-4">
              <span>Vol: <b className="text-zinc-200">{marketFeedData.marketStats.totalVolume}</b></span>
              <span>Val: <b className="text-zinc-200">{marketFeedData.marketStats.totalValue}</b></span>
              <span>Freq: <b className="text-zinc-200">{marketFeedData.marketStats.totalFrequency}</b></span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <TrendingUp className="w-3 h-3" /> {marketFeedData.marketStats.advancing} Naik
            </span>
            <span className="flex items-center gap-1 text-rose-400 font-bold">
              <TrendingDown className="w-3 h-3" /> {marketFeedData.marketStats.declining} Turun
            </span>
            <span className="text-zinc-500">
              {marketFeedData.marketStats.unchanged} Tetap
            </span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-900 bg-zinc-950 px-4 pt-2 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'summary'
              ? 'border-[#deff9a] text-[#deff9a] bg-zinc-900/60 font-black'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          Ringkasan Saham (Stock Summary)
        </button>

        <button
          onClick={() => setActiveTab('historical')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'historical'
              ? 'border-[#deff9a] text-[#deff9a] bg-zinc-900/60 font-black'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Data Historis OHLCV
        </button>

        <button
          onClick={() => setActiveTab('market_feed')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'market_feed'
              ? 'border-[#deff9a] text-[#deff9a] bg-zinc-900/60 font-black'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Pergerakan Teraktif & Top Gainers
        </button>

        <button
          onClick={() => setActiveTab('api_docs')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'api_docs'
              ? 'border-[#deff9a] text-[#deff9a] bg-zinc-900/60 font-black'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
          }`}
        >
          <Code className="w-3.5 h-3.5 text-sky-400" />
          Dokumentasi Endpoints API
        </button>
      </div>

      {/* TAB 1: STOCK SUMMARY */}
      {activeTab === 'summary' && (
        <div className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/80">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Cari kode emiten atau nama saham BEI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#deff9a]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="text-zinc-500 font-bold uppercase mr-1">Saham Populer:</span>
              {popularSymbols.map(sym => (
                <button
                  key={sym}
                  onClick={() => {
                    setSelectedSymbol(sym);
                    setSearchQuery(sym);
                  }}
                  className={`px-2 py-1 rounded-lg border font-mono font-bold transition-all ${
                    selectedSymbol === sym
                      ? 'bg-[#deff9a]/20 border-[#deff9a]/40 text-[#deff9a]'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-800/80 bg-zinc-950">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[10px] uppercase tracking-wider text-zinc-400 font-black">
                  <th className="py-3 px-4">Kode Saham</th>
                  <th className="py-3 px-4">Nama Perusahaan Tercatat</th>
                  <th className="py-3 px-4 text-right">Harga Terakhir</th>
                  <th className="py-3 px-4 text-right">Perubahan</th>
                  <th className="py-3 px-4 text-right">% Ubah</th>
                  <th className="py-3 px-4 text-right">Tertinggi (High)</th>
                  <th className="py-3 px-4 text-right">Terendah (Low)</th>
                  <th className="py-3 px-4 text-right">Volume Saham</th>
                  <th className="py-3 px-4 text-right">Nilai Transaksi (Rp)</th>
                  <th className="py-3 px-4 text-center font-mono">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-xs font-mono">
                {loadingSummary ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-zinc-500 font-sans">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#deff9a]" />
                      Menghubungkan & menarik data ringkasan saham dari https://www.idx.co.id/id...
                    </td>
                  </tr>
                ) : filteredSummary.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-zinc-500 font-sans">
                      Tidak ada saham ditemukan untuk pencarian "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredSummary.map((stock) => {
                    const isPositive = stock.change >= 0;
                    return (
                      <tr 
                        key={stock.code} 
                        className={`hover:bg-zinc-900/50 transition-all ${selectedSymbol === stock.code ? 'bg-[#deff9a]/5' : ''}`}
                      >
                        <td className="py-3 px-4 font-black text-white">
                          <button 
                            onClick={() => setSelectedSymbol(stock.code)}
                            className="hover:text-[#deff9a] text-left underline underline-offset-4 decoration-zinc-700 hover:decoration-[#deff9a]"
                          >
                            {stock.code}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-sans text-zinc-300 max-w-xs truncate text-[11px]">
                          {stock.name}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-white">
                          Rp {Math.round(stock.close).toLocaleString('id-ID')}
                        </td>
                        <td className={`py-3 px-4 text-right font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? '+' : ''}{Math.round(stock.change).toLocaleString('id-ID')}
                        </td>
                        <td className={`py-3 px-4 text-right font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </td>
                        <td className="py-3 px-4 text-right text-zinc-400">
                          Rp {Math.round(stock.high).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right text-zinc-400">
                          Rp {Math.round(stock.low).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right text-zinc-300">
                          {(stock.volume || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right text-zinc-300">
                          Rp {((stock.value || 0) / 1e9).toFixed(2)} B
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedSymbol(stock.code);
                              setActiveTab('historical');
                            }}
                            className="px-2 py-1 bg-zinc-900 hover:bg-[#deff9a] hover:text-black border border-zinc-800 text-[10px] font-sans font-bold rounded-lg transition-all"
                          >
                            Chart Historis
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: HISTORICAL OHLCV */}
      {activeTab === 'historical' && (
        <div className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#deff9a]/10 rounded-xl border border-[#deff9a]/20">
                <BarChart3 className="w-5 h-5 text-[#deff9a]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white font-mono uppercase">
                  {selectedSymbol} - {selectedStockDetails?.name || `PT ${selectedSymbol} Tbk.`}
                </h3>
                <p className="text-[10px] text-zinc-400 font-mono">
                  Data Pergerakan Saham Historis (OHLCV Feed)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">Periode:</span>
              {(['1D', '1W', '1M', '3M', '6M', '1Y'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border transition-all ${
                    selectedPeriod === p
                      ? 'bg-[#deff9a] text-black border-[#deff9a] font-black'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Chart Visualization / Bars */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
            <div className="flex justify-between items-center text-xs text-zinc-400 font-mono">
              <span>Visualisasi Tren Harga ({historyData.length} Sesi perdagangan)</span>
              <span>Terakhir: <b className="text-white">Rp {(historyData[historyData.length - 1]?.close || 0).toLocaleString('id-ID')}</b></span>
            </div>

            <div className="h-28 flex items-end gap-1 pt-4 border-b border-zinc-900 pb-2 overflow-x-auto">
              {historyData.map((candle, idx) => {
                const maxPrice = Math.max(...historyData.map(d => d.high), 1);
                const minPrice = Math.min(...historyData.map(d => d.low), 1);
                const range = maxPrice - minPrice || 1;
                const heightPct = Math.max(10, Math.min(100, ((candle.close - minPrice) / range) * 100));
                const isGreen = candle.close >= candle.open;

                return (
                  <div key={idx} className="flex-1 min-w-[6px] group relative flex flex-col items-center h-full justify-end">
                    <div 
                      className={`w-full rounded-t-sm transition-all ${isGreen ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-rose-500 hover:bg-rose-400'}`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-zinc-900 border border-zinc-700 text-white text-[9px] font-mono p-2 rounded shadow-2xl z-20 whitespace-nowrap">
                      <div><b>Tanggal:</b> {candle.date}</div>
                      <div><b>Open:</b> Rp {candle.open.toLocaleString('id-ID')}</div>
                      <div><b>High:</b> Rp {candle.high.toLocaleString('id-ID')}</div>
                      <div><b>Low:</b> Rp {candle.low.toLocaleString('id-ID')}</div>
                      <div><b>Close:</b> Rp {candle.close.toLocaleString('id-ID')}</div>
                      <div><b>Vol:</b> {candle.volume.toLocaleString('id-ID')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[10px] uppercase tracking-wider text-zinc-400 font-black">
                  <th className="py-2.5 px-4">Tanggal (Date)</th>
                  <th className="py-2.5 px-4 text-right">Pembukaan (Open)</th>
                  <th className="py-2.5 px-4 text-right">Tertinggi (High)</th>
                  <th className="py-2.5 px-4 text-right">Terendah (Low)</th>
                  <th className="py-2.5 px-4 text-right">Penutupan (Close)</th>
                  <th className="py-2.5 px-4 text-right">Ubah (Rp)</th>
                  <th className="py-2.5 px-4 text-right">% Ubah</th>
                  <th className="py-2.5 px-4 text-right">Volume</th>
                  <th className="py-2.5 px-4 text-right">Turnover (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-xs font-mono">
                {loadingHistory ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-zinc-500 font-sans">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#deff9a]" />
                      Memuat data historis untuk {selectedSymbol}...
                    </td>
                  </tr>
                ) : historyData.slice().reverse().map((item, index) => {
                  const isUp = item.change >= 0;
                  return (
                    <tr key={index} className="hover:bg-zinc-900/40">
                      <td className="py-2.5 px-4 font-bold text-zinc-300">{item.date}</td>
                      <td className="py-2.5 px-4 text-right text-zinc-400">Rp {item.open.toLocaleString('id-ID')}</td>
                      <td className="py-2.5 px-4 text-right text-zinc-400">Rp {item.high.toLocaleString('id-ID')}</td>
                      <td className="py-2.5 px-4 text-right text-zinc-400">Rp {item.low.toLocaleString('id-ID')}</td>
                      <td className="py-2.5 px-4 text-right font-black text-white">Rp {item.close.toLocaleString('id-ID')}</td>
                      <td className={`py-2.5 px-4 text-right font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isUp ? '+' : ''}{item.change.toLocaleString('id-ID')}
                      </td>
                      <td className={`py-2.5 px-4 text-right font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isUp ? '+' : ''}{item.changePercent.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-4 text-right text-zinc-300">{item.volume.toLocaleString('id-ID')}</td>
                      <td className="py-2.5 px-4 text-right text-zinc-300">Rp {(item.turnover / 1e9).toFixed(2)} B</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MARKET FEED & TOP GAINERS */}
      {activeTab === 'market_feed' && marketFeedData && (
        <div className="p-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Top Gainers */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Top Gainers BEI</h4>
              </div>
              <div className="space-y-2">
                {marketFeedData.topGainers.map((stock) => (
                  <div key={stock.code} className="flex justify-between items-center p-2 bg-zinc-900/50 rounded-xl text-xs font-mono">
                    <div>
                      <span className="font-black text-white block">{stock.code}</span>
                      <span className="text-[9px] text-zinc-400 truncate max-w-[120px] block">{stock.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white block">Rp {stock.price.toLocaleString('id-ID')}</span>
                      <span className="text-[10px] text-emerald-400 font-black">+{stock.changePercent.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Losers */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                <TrendingDown className="w-4 h-4 text-rose-400" />
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Top Losers BEI</h4>
              </div>
              <div className="space-y-2">
                {marketFeedData.topLosers.map((stock) => (
                  <div key={stock.code} className="flex justify-between items-center p-2 bg-zinc-900/50 rounded-xl text-xs font-mono">
                    <div>
                      <span className="font-black text-white block">{stock.code}</span>
                      <span className="text-[9px] text-zinc-400 truncate max-w-[120px] block">{stock.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white block">Rp {stock.price.toLocaleString('id-ID')}</span>
                      <span className="text-[10px] text-rose-400 font-black">{stock.changePercent.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Active */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                <Activity className="w-4 h-4 text-[#deff9a]" />
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Teraktif Transaksi</h4>
              </div>
              <div className="space-y-2">
                {marketFeedData.mostActive.map((stock) => (
                  <div key={stock.code} className="flex justify-between items-center p-2 bg-zinc-900/50 rounded-xl text-xs font-mono">
                    <div>
                      <span className="font-black text-white block">{stock.code}</span>
                      <span className="text-[9px] text-zinc-400 truncate max-w-[120px] block">{stock.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white block">Rp {stock.price.toLocaleString('id-ID')}</span>
                      <span className="text-[9px] text-[#deff9a] block">{stock.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: API ENDPOINT DOCUMENTATION */}
      {activeTab === 'api_docs' && (
        <div className="p-5 space-y-5">
          <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 space-y-2">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Code className="w-4 h-4 text-sky-400" />
              Akses API Data Feed Saham Indonesia (BEI / idx.co.id)
            </h3>
            <p className="text-xs text-zinc-300">
              Aplikasi ini menyediakan REST API internal yang secara otomatis meneruskan dan mensinkronisasikan data pergerakan saham langsung dari portal Bursa Efek Indonesia (<a href="https://www.idx.co.id/id" target="_blank" rel="noopener noreferrer" className="text-[#deff9a] hover:underline font-mono font-bold">https://www.idx.co.id/id</a>).
            </p>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {/* Endpoint 1 */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded text-[10px]">GET</span>
                <span className="text-[10px] text-zinc-400">Ringkasan Perdagangan Real-time</span>
              </div>
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-white font-bold flex justify-between items-center">
                <code>/api/idx/stock-summary?code=BBCA</code>
                <button
                  onClick={() => handleCopy('/api/idx/stock-summary?code=BBCA', 'ep1')}
                  className="p-1 hover:text-[#deff9a] text-zinc-400"
                >
                  {copiedEndpoint === 'ep1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Endpoint 2 */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded text-[10px]">GET</span>
                <span className="text-[10px] text-zinc-400">Data Historis Pergerakan OHLCV</span>
              </div>
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-white font-bold flex justify-between items-center">
                <code>/api/idx/historical-data?symbol=BBCA&period=1M</code>
                <button
                  onClick={() => handleCopy('/api/idx/historical-data?symbol=BBCA&period=1M', 'ep2')}
                  className="p-1 hover:text-[#deff9a] text-zinc-400"
                >
                  {copiedEndpoint === 'ep2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Endpoint 3 */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded text-[10px]">GET</span>
                <span className="text-[10px] text-zinc-400">Ringkasan Pasar & Indeks IHSG</span>
              </div>
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-white font-bold flex justify-between items-center">
                <code>/api/idx/market-feed</code>
                <button
                  onClick={() => handleCopy('/api/idx/market-feed', 'ep3')}
                  className="p-1 hover:text-[#deff9a] text-zinc-400"
                >
                  {copiedEndpoint === 'ep3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdxDirectFeedGateway;
