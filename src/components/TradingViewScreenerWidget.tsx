import React, { useEffect, useRef } from 'react';

const TradingViewScreenerWidget: React.FC = () => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let scriptElement: HTMLScriptElement | null = null;
    const currentContainer = container.current;
    if (currentContainer) {
      currentContainer.innerHTML = '';
      scriptElement = document.createElement("script");
      scriptElement.src = "https://s3.tradingview.com/external-embedding/embed-widget-screener.js";
      scriptElement.type = "text/javascript";
      scriptElement.async = true;
      scriptElement.crossOrigin = "anonymous";
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
  }, []);

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
};

export default TradingViewScreenerWidget;
