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

    if (currentContainer) {
      // Clear container first to prevent duplicates or leaked elements
      currentContainer.innerHTML = `<div id="${widgetId}" class="h-full w-full"></div>`;
      
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
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, [symbol, studies, widgetId]);

  return (
    <div className="tradingview-widget-container h-full w-full" ref={container}>
      <div id={widgetId} className="h-full w-full"></div>
    </div>
  );
}

export default memo(TradingViewWidget);
