import React, { useEffect, useRef } from 'react';

const TradingViewScreenerWidget: React.FC = () => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentContainer = container.current;
    
    if (currentContainer && !currentContainer.querySelector('script')) {
      const scriptElement = document.createElement("script");
      scriptElement.src = "https://s3.tradingview.com/external-embedding/embed-widget-screener.js";
      scriptElement.type = "text/javascript";
      scriptElement.async = true;
      scriptElement.innerHTML = JSON.stringify({
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
      currentContainer.appendChild(scriptElement);
    }
    
    return () => {
      // Safe cleanup
    };
  }, []);

  return (
    <div className="tradingview-widget-container h-[550px]" ref={container}>
      <div className="tradingview-widget-container__widget h-full"></div>
    </div>
  );
};

export default TradingViewScreenerWidget;
