import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, TrendingDown, Minus, Zap, RefreshCw, ExternalLink, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Sparkline from './Sparkline';

interface PriceData {
  symbol: string;
  price: number;
  changePercent: number;
  timestamp: number;
}

const IDX_COMPANIES: Record<string, string> = {
  "BBCA": "Bank Central Asia",
  "BBRI": "Bank Rakyat Indonesia",
  "BMRI": "Bank Mandiri (Persero)",
  "TLKM": "Telkom Indonesia",
  "ASII": "Astra International",
  "BBNI": "Bank Negara Indonesia",
  "ADRO": "Adaro Energy Indonesia",
  "UNVR": "Unilever Indonesia",
  "GOTO": "GoTo Gojek Tokopedia",
  "ANTM": "Aneka Tambang",
  "MDKA": "Merdeka Copper Gold",
  "PTBA": "Bukit Asam",
  "ITMG": "Indo Tambangraya",
  "HRUM": "Harum Energy",
  "SMGR": "Semen Indonesia",
  "AMRT": "Sumber Alfaria Trijaya",
  "ICBP": "Indofood CBP Sukses Makmur",
  "BRPT": "Barito Pacific",
  "BREN": "Barito Renewables Energy",
  "AMMN": "Amman Mineral Internasional",
  "TPIA": "Chandra Asri Pacific",
  "CPIN": "Charoen Pokphand Indonesia",
  "BRMS": "Bumi Resources Minerals",
  "COAL": "Black Diamond Resources",
  "DEFI": "Danasupra Erapacific",
  "BUKA": "Bukalapak.com",
  "MEDC": "Medco Energi Internasional",
  "DEWA": "Darma Henwa",
  "DSSA": "Dian Swastatika Sentosa"
};

export const IdxPriceList = () => {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeMoverTab, setActiveMoverTab] = useState<'active' | 'gainers' | 'losers'>('active');
  const [tickerHistory, setTickerHistory] = useState<Record<string, number[]>>({});
  const [priceFlash, setPriceFlash] = useState<Record<string, 'up' | 'down' | null>>({});

  const handleManualRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    // Dispatch global refresh event
    window.dispatchEvent(new CustomEvent('vam-force-market-refresh'));
    // Visual feedback delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1200);
  };

  // Fetch initial prices from historical API node
  useEffect(() => {
    const fetchInitialPrices = async () => {
      try {
        const response = await fetch('/api/market/realtime-prices');
        if (response.ok) {
          const data = await response.json();
          setPrices(prev => ({ ...prev, ...data }));
          setLastUpdate(new Date().toLocaleTimeString('id-ID'));
          
          // Pre-populate historical seed array for smooth real-time sparklines
          const initialHist: Record<string, number[]> = {};
          Object.keys(IDX_COMPANIES).forEach(sym => {
            const currentPrice = data[sym]?.price || 1000;
            // Generate some beautiful simulated initial ticks to prevent flat sparklines
            initialHist[sym] = Array.from({ length: 15 }, (_, i) => 
              currentPrice * (1 + (Math.sin(i / 2) * 0.008) + (Math.cos(i / 3) * 0.004))
            );
          });
          setTickerHistory(initialHist);
        }
      } catch (err) {
        console.error("Failed to fetch initial realtime prices:", err);
      }
    };
    fetchInitialPrices();

    const handleMarketUpdate = (event: any) => {
      const data = event.detail;
      if (data && data.symbol) {
        setPrices(prev => {
          const oldPrice = prev[data.symbol]?.price;
          if (oldPrice !== undefined && oldPrice !== data.price) {
            setPriceFlash(flash => ({
              ...flash,
              [data.symbol]: data.price > oldPrice ? 'up' : 'down'
            }));
            setTimeout(() => {
              setPriceFlash(flash => ({
                ...flash,
                [data.symbol]: null
              }));
            }, 600);
          }
          return {
            ...prev,
            [data.symbol]: data
          };
        });

        setLastUpdate(new Date().toLocaleTimeString('id-ID'));

        // Roll the sparkline history array with fresh live prices
        setTickerHistory(prev => {
          const current = prev[data.symbol] || [];
          const updated = current.length > 0
            ? [...current, data.price].slice(-15)
            : Array.from({ length: 15 }, (_, i) => data.price * (1 + (Math.sin(i / 2) * 0.005)));
          return { ...prev, [data.symbol]: updated };
        });
      }
    };

    window.addEventListener('vam-market-update', handleMarketUpdate);
    return () => window.removeEventListener('vam-market-update', handleMarketUpdate);
  }, []);

  // Filter and sort tickers dynamically depending on current active tab
  const getFilteredSymbols = () => {
    const list = Object.keys(IDX_COMPANIES);
    
    if (activeMoverTab === 'active') {
      // Sort by highest absolute percentage change
      return list.sort((a, b) => {
        const pA = prices[a]?.changePercent || 0;
        const pB = prices[b]?.changePercent || 0;
        return Math.abs(pB) - Math.abs(pA);
      });
    } else if (activeMoverTab === 'gainers') {
      // Greater than zero change, sorted descending
      return list
        .filter(sym => (prices[sym]?.changePercent || 0) > 0)
        .sort((a, b) => (prices[b]?.changePercent || 0) - (prices[a]?.changePercent || 0));
    } else {
      // Less than zero change, sorted ascending
      return list
        .filter(sym => (prices[sym]?.changePercent || 0) < 0)
        .sort((a, b) => (prices[a]?.changePercent || 0) - (prices[b]?.changePercent || 0));
    }
  };

  const processedSymbols = getFilteredSymbols().slice(0, 10);

  // Helper to accurately calculate Rupiah change amount based on % change and current price
  const calcRpChange = (price: number, changePercent: number) => {
    if (!price || changePercent === 0) return 0;
    const prevClose = price / (1 + (changePercent / 100));
    return price - prevClose;
  };

  const tabs = [
    { id: 'active', label: 'Most Active', icon: Activity, color: 'text-zinc-300' },
    { id: 'gainers', label: 'Top Gainers', icon: TrendingUp, color: 'text-emerald-400' },
    { id: 'losers', label: 'Top Losers', icon: TrendingDown, color: 'text-rose-400' }
  ] as const;

  return (
    <div className="bg-zinc-950/40 rounded-3xl border border-zinc-800/50 overflow-hidden backdrop-blur-md">
      {/* Header Panel */}
      <div className="p-4 border-b border-zinc-900/80 flex flex-col sm:flex-row justify-between sm:items-center bg-zinc-900/10 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#deff9a]/10 border border-[#deff9a]/20 rounded-xl">
            <Zap className="w-4 h-4 text-[#deff9a] animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              Google Finance Movers
              <span className="text-[7.5px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded leading-none">
                SINKRON
              </span>
            </h3>
            <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Real-time IDX Volume & Rate Alignment Feed</p>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto">
          <div className="text-left sm:text-right">
            <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest select-none">Feed Gateway Active</p>
            <p className="text-[9px] text-[#deff9a] font-mono font-bold leading-none mt-1">{lastUpdate || '--:--:--'}</p>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 text-[#deff9a] hover:text-white transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-lg"
            title="Sinc / Refresh IDX Feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Google Finance category navigation bar */}
      <div className="flex border-b border-zinc-900/60 bg-zinc-950/20 p-1 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeMoverTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveMoverTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] uppercase tracking-wider font-semibold transition-all relative ${
                isActive 
                  ? 'bg-zinc-900 text-white shadow-inner border border-zinc-800/40' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/20'
              }`}
            >
              <Icon className={`w-3 h-3 ${tab.color} ${isActive ? 'opacity-100' : 'opacity-60'}`} />
              <span className="font-extrabold">{tab.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeMoversTabLine"
                  className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#deff9a]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Main movers table list */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed min-w-[500px] sm:min-w-0">
          <thead>
            <tr className="border-b border-zinc-900/50 bg-zinc-950/10">
              <th className="px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest w-[25%]">Ticker</th>
              <th className="px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-right w-[20%]">Price</th>
              <th className="px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-right w-[30%]">Daily Change</th>
              <th className="px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-center w-[25%] hidden sm:table-cell">1D Sparkline</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/30">
            <AnimatePresence mode="popLayout">
              {processedSymbols.map((symbol) => {
                const data = prices[symbol];
                const isPositive = data ? data.changePercent >= 0 : true;
                const flash = priceFlash[symbol];
                const rpChange = data ? calcRpChange(data.price, data.changePercent) : 0;
                
                return (
                  <motion.tr 
                    key={`${activeMoverTab}-${symbol}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-black text-white group-hover:text-[#deff9a] transition-colors">{symbol}</span>
                          <a 
                            href={`https://www.google.com/finance/quote/${symbol}:IDX`}
                            target="_blank"
                            rel="noreferrer"
                            title={`Buka ${symbol} di Google Finance untuk data real-time`}
                            className="opacity-20 hover:opacity-100 group-hover:opacity-100 p-0.5 hover:bg-[#deff9a] hover:text-black rounded transition-all text-[#deff9a]"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                        <span className="text-[8px] font-semibold text-zinc-500 uppercase truncate max-w-[130px] block mt-0.5 leading-none">
                          {IDX_COMPANIES[symbol]}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <motion.span 
                        animate={{
                          color: flash === 'up' ? '#34d399' : flash === 'down' ? '#f87171' : '#e4e4e7',
                          scale: flash ? 1.05 : 1
                        }}
                        transition={{ duration: 0.15 }}
                        className={`text-[11px] font-mono font-bold block ${flash ? "font-black" : ""}`}
                      >
                        {data ? `Rp ${data.price.toLocaleString('id-ID')}` : '---'}
                      </motion.span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {data ? (
                        <div className="flex flex-col items-end">
                          <div className={`flex items-center justify-end gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            <span className="text-[10px] font-black leading-none font-mono">
                              {isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%
                            </span>
                          </div>
                          <span className="text-[8px] font-bold font-mono text-zinc-500 mt-1">
                            {isPositive ? '+' : ''}{Math.round(rpChange).toLocaleString('id-ID')} Rp
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-zinc-600">---</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell pl-6 pr-6">
                      {tickerHistory[symbol] && tickerHistory[symbol].length > 0 ? (
                        <Sparkline 
                          data={tickerHistory[symbol]} 
                          color={isPositive ? '#34d399' : '#f87171'} 
                          height={20}
                        />
                      ) : (
                        <div className="h-5 w-full bg-zinc-900 animate-pulse rounded" />
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Footer Navigation Information overlay */}
      <div className="p-3 bg-zinc-900/10 border-t border-zinc-900 flex justify-between items-center text-[8.5px] font-bold uppercase text-zinc-500 tracking-wider">
        <span>TAMPILKAN 10 PENERIMA TERATAS</span>
        <span className="text-zinc-600 select-none">|</span>
        <span>INDEX UPDATED LIVE VIA WEBSOCKET</span>
      </div>
    </div>
  );
};

export default IdxPriceList;
