import React, { useEffect, useRef, memo } from 'react';
import { getTradingViewSymbol } from '../lib/stockUtils';

interface TradingViewTechnicalAnalysisWidgetProps {
  symbol?: string;
  interval?: string;
}

const mapSymbolToTradingView = (symbol: string): string => {
  return getTradingViewSymbol(symbol);
};

function TradingViewTechnicalAnalysisWidget({ 
  symbol = "IDX:BBCA", 
  interval = "1D" 
}: TradingViewTechnicalAnalysisWidgetProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentContainer = container.current;

    if (currentContainer) {
      currentContainer.innerHTML = `<div class="tradingview-widget-container__widget h-full w-full"></div>`;
      const scriptElement = document.createElement("script");
      scriptElement.src = "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";
      scriptElement.type = "text/javascript";
      scriptElement.async = true;
      const cleanSymbol = mapSymbolToTradingView(symbol);
      scriptElement.innerHTML = JSON.stringify({
        "interval": interval,
        "width": "100%",
        "isTransparent": true,
        "height": "100%",
        "symbol": cleanSymbol,
        "showIntervalTabs": true,
        "displayMode": "single",
        "locale": "id",
        "colorTheme": "dark"
      });
      currentContainer.appendChild(scriptElement);
    }

    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, [symbol, interval]);

  return (
    <div className="tradingview-widget-container h-[380px] w-full" ref={container} />
  );
}

export default memo(TradingViewTechnicalAnalysisWidget);
