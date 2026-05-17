import React, { useEffect, useRef, memo } from 'react';

interface TradingViewWidgetProps {
  symbol?: string;
  studies?: string[];
}

function TradingViewWidget({ symbol = "IDX:BBCA", studies = ["MASimple@tv-basicstudies", "MAExp@tv-basicstudies"] }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef(`tv-widget-${Math.random().toString(36).substr(2, 9)}`).current;

  useEffect(() => {
    const currentContainer = container.current;

    if (currentContainer && !currentContainer.querySelector('script')) {
      const scriptElement = document.createElement("script");
      scriptElement.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      scriptElement.type = "text/javascript";
      scriptElement.async = true;
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
        "container_id": widgetId,
        "calendar": false,
        "studies": studies,
        "support_host": "https://www.tradingview.com"
      });
      currentContainer.appendChild(scriptElement);
    }
    return () => {
      // Safe cleanup
    };
  }, [symbol, studies]);

  return (
    <div className="tradingview-widget-container h-[400px] w-full rounded-2xl overflow-hidden border border-slate-800" ref={container}>
      <div id={widgetId} className="h-full w-full"></div>
    </div>
  );
}

export default memo(TradingViewWidget);
