import React, { useEffect, useRef, memo } from 'react';

interface TradingViewWidgetProps {
  symbol?: string;
  studies?: string[];
}

function TradingViewWidget({ symbol = "IDX:BBCA", studies = ["MASimple@tv-basicstudies", "MAExp@tv-basicstudies"] }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let scriptElement: HTMLScriptElement | null = null;
    const currentContainer = container.current;
    if (currentContainer) {
      currentContainer.innerHTML = '';
      scriptElement = document.createElement("script");
      scriptElement.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      scriptElement.type = "text/javascript";
      scriptElement.async = true;
      scriptElement.crossOrigin = "anonymous";
      scriptElement.innerHTML = JSON.stringify({
        "autosize": true,
        "symbol": symbol,
        "interval": "D",
        "timezone": "Asia/Jakarta",
        "theme": "dark",
        "style": "1",
        "locale": "id",
        "enable_publishing": false,
        "allow_symbol_change": true,
        "calendar": false,
        "studies": studies,
        "support_host": "https://www.tradingview.com"
      });
      currentContainer.appendChild(scriptElement);
    }
    return () => {
      // Guard against querySelector errors by ensuring we only clear if still mounted correctly
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, [symbol, studies]);

  return (
    <div className="tradingview-widget-container h-[400px] w-full rounded-2xl overflow-hidden border border-slate-800" ref={container}>
      <div className="tradingview-widget-container__widget h-full w-full"></div>
    </div>
  );
}

export default memo(TradingViewWidget);
