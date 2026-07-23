import React, { useEffect, useRef, useState, memo } from 'react';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';

function GlobalIndicesFeed() {
  const container = useRef<HTMLDivElement>(null);
  
  // State for simulated live Indonesian Volatility Index
  const [vix, setVix] = useState(15.34);
  const dailyOpen = 15.51;
  const vixChange = Number((((vix - dailyOpen) / dailyOpen) * 100).toFixed(2));

  useEffect(() => {
    const currentContainer = container.current;

    if (currentContainer && !currentContainer.querySelector('script')) {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify({
        "symbols": [
          { "description": "IHSG Composite", "proName": "IDX:COMPOSITE" },
          { "description": "USD/IDR", "proName": "FX_IDC:USDIDR" },
          { "description": "GOLD", "proName": "OANDA:XAUUSD" },
          { "description": "STI Index", "proName": "STI" },
          { "description": "S&P 500", "proName": "FOREXCOM:SPX500" }
        ],
        "showSymbolLogo": true,
        "colorTheme": "dark",
        "isTransparent": true,
        "displayMode": "regular",
        "locale": "id"
      });
      currentContainer.appendChild(script);
    }
  }, []);

  // Update live Volatility drift with standard random walk
  useEffect(() => {
    const timer = setInterval(() => {
      setVix((prev) => {
        const change = (Math.random() - 0.48) * 0.16;
        return Math.max(12.00, Math.min(22.00, Number((prev + change).toFixed(2))));
      });
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const vixMin = 14.00;
  const vixMax = 17.50;
  const rangePosition = Math.max(0, Math.min(100, ((vix - vixMin) / (vixMax - vixMin)) * 100));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
      {/* TradingView Ticker Tape */}
      <div className="lg:col-span-3 tradingview-widget-container overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950/20 backdrop-blur-md flex items-center min-h-[46px]" ref={container}>
        <div className="tradingview-widget-container__widget w-full"></div>
      </div>

      {/* Volatility Index Card */}
      <div className="lg:col-span-1 bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-3 flex flex-col justify-between backdrop-blur-md relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 bg-red-500/5 blur-xl rounded-full" />
        
        <div className="flex items-center justify-between relative z-10 mb-1">
          <div className="flex items-center gap-1.5 font-sans">
            <Activity className="w-3.5 h-3.5 text-[#DFFF00]" />
            <div>
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Institutional</span>
              <span className="text-[10px] font-bold text-white uppercase tracking-wider block">IDX VIX INDEX</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${vixChange >= 0 ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${vixChange >= 0 ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
            </span>
            <span className="text-[7.5px] font-mono font-bold text-zinc-500 uppercase">LIVE</span>
          </div>
        </div>

        <div className="flex items-baseline justify-between relative z-10 mt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-mono font-black text-white">{vix.toFixed(2)}</span>
            <span className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${vixChange >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {vixChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {vixChange >= 0 ? '+' : ''}{vixChange.toFixed(2)}%
            </span>
          </div>
          <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase border ${
            vix > 18 
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
              : vix < 15 
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
              : 'bg-zinc-500/10 border-zinc-500/20 text-[#DFFF00]'
          }`}>
            {vix > 18 ? 'ELEVATED RISK' : vix < 15 ? 'CALM RISK' : 'STABLE RISK'}
          </span>
        </div>

        {/* 24h volatility slide */}
        <div className="mt-2 relative z-10">
          <div className="flex justify-between text-[7px] font-mono text-zinc-600 mb-1">
            <span>24H L: {vixMin.toFixed(2)}</span>
            <span>24H H: {vixMax.toFixed(2)}</span>
          </div>
          <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-[#DFFF00] to-rose-500 rounded-full transition-all duration-1000"
              style={{ width: `${rangePosition}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(GlobalIndicesFeed);
