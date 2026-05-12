import React, { useEffect, useRef } from 'react';

const TradingViewScreenerWidget: React.FC = () => {
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
        "height": 550,
        "defaultColumn": "overview",
        "defaultScreen": "most_capitalized",
        "market": "indonesia",
        "showToolbar": true,
        "colorTheme": "dark",
        "locale": "id",
        "isReadOnly": false
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
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
};

export default TradingViewScreenerWidget;
