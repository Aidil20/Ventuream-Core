import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, TrendingDown, Minus, Zap, RefreshCw } from 'lucide-react';

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
  "DEWA": "Darma Henwa"
};

export const IdxPriceList = () => {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  useEffect(() => {
    const handleMarketUpdate = (event: any) => {
      const data = event.detail;
      if (data && data.symbol) {
        setPrices(prev => ({
          ...prev,
          [data.symbol]: data
        }));
        setLastUpdate(new Date().toLocaleTimeString('id-ID'));
      }
    };

    window.addEventListener('vam-market-update', handleMarketUpdate);
    return () => window.removeEventListener('vam-market-update', handleMarketUpdate);
  }, []);

  const sortedSymbols = Object.keys(IDX_COMPANIES).sort((a, b) => {
    const priceA = prices[a];
    const priceB = prices[b];
    if (!priceA) return 1;
    if (!priceB) return -1;
    return Math.abs(priceB.changePercent) - Math.abs(priceA.changePercent);
  });

  return (
    <div className="bg-zinc-950/40 rounded-3xl border border-zinc-800/50 overflow-hidden backdrop-blur-md">
      <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20">
        <div>
          <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#deff9a] rounded-full animate-pulse" />
            IDX Real-Time Feed
          </h3>
          <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Direct Exchange Gateway Access</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[8px] text-zinc-600 font-black uppercase tracking-tighter">Connection: Active</p>
            <p className="text-[9px] text-[#deff9a] font-mono font-bold">{lastUpdate || '--:--:--'}</p>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-[#deff9a] hover:text-white transition-all active:scale-95 cursor-pointer flex items-center justify-center"
            title="Refresh IDX Feed"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-900/50">
              <th className="px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Ticker</th>
              <th className="px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Name</th>
              <th className="px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-right">Price</th>
              <th className="px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-right">24H Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/30">
            {sortedSymbols.slice(0, 15).map((symbol) => {
              const data = prices[symbol];
              const isPositive = data ? data.changePercent >= 0 : true;
              
              return (
                <motion.tr 
                  key={symbol}
                  layout
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-black text-white group-hover:text-[#deff9a] transition-colors">{symbol}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-medium text-zinc-400 uppercase truncate max-w-[120px] block">
                      {IDX_COMPANIES[symbol]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-[11px] font-mono font-black text-zinc-200">
                      {data ? `Rp ${data.price.toLocaleString('id-ID')}` : '---'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {data ? (
                      <div className={`flex items-center justify-end gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                        <span className="text-[10px] font-black">
                          {isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-black text-zinc-600">---</span>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="p-3 bg-zinc-900/30 border-t border-zinc-900 flex justify-center">
        <button className="text-[9px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">
          View Full Exchange List
        </button>
      </div>
    </div>
  );
};

export default IdxPriceList;
