import React, { useEffect, useRef } from 'react';

const TradingViewMarketWidget: React.FC = () => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentContainer = container.current;
    
    if (currentContainer) {
      currentContainer.innerHTML = `<div class="tradingview-widget-container__widget"></div>`;
      const scriptElement = document.createElement("script");
      scriptElement.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js";
      scriptElement.type = "text/javascript";
      scriptElement.async = true;
      scriptElement.innerHTML = JSON.stringify({
        "width": "100%",
        "height": 450,
        "symbolsGroups": [
          {
            "name": "Jakarta Composite Index",
            "originalName": "Indices",
            "symbols": [
              { "name": "IDX:COMPOSITE", "displayName": "IHSG Composite" },
              { "name": "IDX:BBCA", "displayName": "BBCA Bank Central Asia" },
              { "name": "IDX:BBRI", "displayName": "BBRI Bank Rakyat Indonesia" },
              { "name": "IDX:TLKM", "displayName": "TLKM Telkom Indonesia" },
              { "name": "IDX:ADRO", "displayName": "ADRO Adaro Energy" },
              { "name": "IDX:ASII", "displayName": "ASII Astra International" },
              { "name": "IDX:BMRI", "displayName": "BMRI Bank Mandiri" }
            ]
          },
          {
            "name": "Global & FX",
            "symbols": [
              { "name": "FX_IDC:USDIDR", "displayName": "USD / IDR" },
              { "name": "TVC:GOLD", "displayName": "GOLD Spot" },
              { "name": "STI", "displayName": "STI Index" },
              { "name": "FOREXCOM:SPX500", "displayName": "S&P 500" }
            ]
          }
        ],
        "showSymbolLogo": true,
        "colorTheme": "dark",
        "isReadOnly": false,
        "locale": "id"
      });
      currentContainer.appendChild(scriptElement);
    }
    
    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="tradingview-widget-container" ref={container} />
  );
};

export default TradingViewMarketWidget;
