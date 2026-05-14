import React, { useEffect, useRef } from 'react';

interface MarketMetricCardProps {
  symbol: string;
  label: string;
  proName: string;
}

export const MarketMetricCard: React.FC<MarketMetricCardProps> = ({ symbol, proName }) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentContainer = container.current;
    let scriptElement: HTMLScriptElement | null = null;
    
    if (currentContainer) {
      currentContainer.innerHTML = '';
      scriptElement = document.createElement('script');
      scriptElement.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
      scriptElement.async = true;
      scriptElement.crossOrigin = "anonymous";
      scriptElement.innerHTML = JSON.stringify({
        "symbol": proName,
        "width": "100%",
        "height": "100%",
        "locale": "id",
        "dateRange": "1M",
        "trendLineColor": "rgba(41, 98, 255, 1)",
        "underLineColor": "rgba(41, 98, 255, 0.3)",
        "underLineBottomColor": "rgba(41, 98, 255, 0)",
        "isTransparent": true,
        "autosize": true,
        "largeChartUrl": "",
        "colorTheme": "dark"
      });
      currentContainer.appendChild(scriptElement);
    }
    return () => {
      if (scriptElement && scriptElement.parentNode) {
        try {
          scriptElement.parentNode.removeChild(scriptElement);
        } catch (e) {
          // Ignore
        }
      }
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, [proName]);

  return (
    <div 
      className="bg-slate-900/40 rounded-2xl border border-slate-800/50 overflow-hidden h-[80px]" 
      ref={container}
    >
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
};
