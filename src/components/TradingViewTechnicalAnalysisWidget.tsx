import React, { useEffect, useRef, memo } from 'react';

interface TradingViewTechnicalAnalysisWidgetProps {
  symbol?: string;
  interval?: string;
}

function TradingViewTechnicalAnalysisWidget({ 
  symbol = "IDX:BBCA", 
  interval = "1D" 
}: TradingViewTechnicalAnalysisWidgetProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentContainer = container.current;

    if (currentContainer && !currentContainer.querySelector('script')) {
      const scriptElement = document.createElement("script");
      scriptElement.src = "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";
      scriptElement.type = "text/javascript";
      scriptElement.async = true;
      scriptElement.innerHTML = JSON.stringify({
        "interval": interval,
        "width": "100%",
        "isTransparent": true,
        "height": "100%",
        "symbol": symbol,
        "showIntervalTabs": true,
        "displayMode": "single",
        "locale": "id",
        "colorTheme": "dark"
      });
      currentContainer.appendChild(scriptElement);
    }

    return () => {
      // Safe cleanup
    };
  }, [symbol, interval]);

  return (
    <div className="tradingview-ta-widget-container h-[450px] w-full" ref={container}>
      <div className="tradingview-widget-container__widget h-full w-full"></div>
    </div>
  );
}

export default memo(TradingViewTechnicalAnalysisWidget);
