import React, { useEffect, useRef, memo } from 'react';

function VamSmartScanner() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentContainer = container.current;
    if (currentContainer) {
      currentContainer.innerHTML = '';
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
          {"left": "change", "operation": "above", "right": 0}
        ]
      });
      currentContainer.appendChild(script);
    }
    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="secure-scanner-container border border-[#FFD700] rounded-3xl overflow-hidden bg-slate-950 shadow-2xl shadow-[#FFD700]/5">
      <div className="scanner-header bg-slate-900/80 p-3 text-[#FFD700] text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          INSTITUTIONAL FEED: VAM SMART SCANNER (LIVE IDX)
        </div>
        <div className="text-[8px] bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30 text-red-500 font-bold">
          GATEWAY_SYNC_ACTIVE
        </div>
      </div>
      <div className="tradingview-widget-container" ref={container}>
        <div className="tradingview-widget-container__widget"></div>
      </div>
    </div>
  );
}

export default memo(VamSmartScanner);
