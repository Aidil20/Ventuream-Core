import React, { useEffect, useRef, memo } from 'react';

function GlobalIndicesFeed() {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef(`tv-ticker-${Math.random().toString(36).substr(2, 9)}`).current;

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
    
    return () => {
      // Removing the script often causes the TV script to crash with "querySelector of null"
      // because it has async tasks still running. We'll let React handle DOM removal.
    };
  }, []);

  return (
    <div className="tradingview-widget-container mb-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/30 min-h-[46px]" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
}

export default memo(GlobalIndicesFeed);
