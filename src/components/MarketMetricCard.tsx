import React, { useEffect, useRef } from 'react';

interface MarketMetricCardProps {
  symbol: string;
  label: string;
  proName: string;
}

export const MarketMetricCard: React.FC<MarketMetricCardProps> = ({ proName }) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentContainer = container.current;
    
    if (currentContainer && !currentContainer.querySelector('script')) {
      const scriptElement = document.createElement('script');
      scriptElement.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
      scriptElement.async = true;
      scriptElement.innerHTML = JSON.stringify({
        "symbol": proName,
        "width": "100%",
        "height": "100%",
        "locale": "id",
        "dateRange": "1M",
        "trendLineColor": proName.includes('USDIDR') ? '#ef4444' : '#DFFF00',
        "underLineColor": "rgba(223, 255, 0, 0.1)",
        "underLineBottomColor": "rgba(223, 255, 0, 0)",
        "isTransparent": true,
        "autosize": true,
        "largeChartUrl": "",
        "colorTheme": "dark"
      });
      currentContainer.appendChild(scriptElement);
    }
    return () => {
      // Safe cleanup
    };
  }, [proName]);

  return (
    <div 
      className="tradingview-widget-container bg-slate-900/40 rounded-2xl border border-slate-800/50 overflow-hidden h-[80px]" 
      ref={container}
    >
      <div className="tradingview-widget-container__widget h-full"></div>
    </div>
  );
};
