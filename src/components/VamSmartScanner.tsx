import React, { useEffect, useRef, memo } from 'react';

function VamSmartScanner() {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef(`tv-scanner-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const currentContainer = container.current;
    
    if (currentContainer && !currentContainer.querySelector('script')) {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-screener.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify({
        "width": "100%",
        "height": "500",
        "defaultColumn": "overview",
        "defaultScreen": "most_capitalized",
        "market": "indonesia",
        "showToolbar": false,
        "colorTheme": "dark",
        "locale": "id",
        "isTransparent": true,
        "columns": [
          "base_currency",
          "logoid",
          "name",
          "close",
          "change",
          "Relative_Strength_Index",
          "MACD.macd",
          "volume"
        ],
        "filter": [
          {"left": "price", "operation": "above", "right": "ema20"},
          {"left": "change", "operation": "above", "right": 0},
          {"left": "Relative_Strength_Index", "operation": "in_range", "right": [45, 60]},
          {"left": "MACD.macd", "operation": "above", "right": "MACD.signal"},
          {"left": "volume", "operation": "above", "right": "volume|20"}
        ]
      });
      currentContainer.appendChild(script);
    }
    return () => {
      // Safe cleanup - let React handle DOM removal to avoid TV script crashes
    };
  }, []);

  return (
    <div className="secure-scanner-container border border-zinc-800/80 rounded-3xl overflow-hidden bg-[#020407] shadow-xl">
      <div className="scanner-header bg-zinc-900/10 p-4 text-[#DFFF00] text-[10px] font-black uppercase tracking-[0.2em] border-b border-zinc-900 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          INSTITUTIONAL FEED: VAM SMART SCANNER (LIVE IDX)
        </div>
        <div className="text-[8px] bg-[#DFFF00]/10 px-2 py-0.5 rounded border border-[#DFFF00]/20 text-[#DFFF00] font-bold">
          GATEWAY_SYNC_ACTIVE
        </div>
      </div>
      <div className="tradingview-widget-container" ref={container}>
        <div className="tradingview-widget-container__widget h-[500px]"></div>
      </div>
    </div>
  );
}

export default memo(VamSmartScanner);
