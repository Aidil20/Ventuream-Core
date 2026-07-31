import React, { useEffect, useRef, memo } from 'react';

interface TradingViewTechnicalAnalysisWidgetProps {
  symbol?: string;
  interval?: string;
}

const mapSymbolToTradingView = (symbol: string): string => {
  let clean = symbol.replace(/\.JK$/i, '').toUpperCase().trim();
  
  // If clean already has an exchange prefix, e.g. "IDX:DSSA"
  const parts = clean.split(':');
  let prefix = parts.length > 1 ? parts[0] : '';
  let ticker = parts.length > 1 ? parts[1] : parts[0];

  // Map indices and commodities
  if (ticker === 'IHSG COMPOSITE' || ticker === 'IHSG' || ticker === 'JCI' || ticker === 'COMPOSITE') {
    return 'IDX:COMPOSITE';
  }
  if (ticker === 'STI INDEX' || ticker === 'STI') {
    return 'FTSE:STI';
  }
  if (ticker === 'S&P 500 INDEX' || ticker === 'SPX') {
    return 'SP:SPX';
  }
  if (ticker === 'DOW JONES' || ticker === 'DJI') {
    return 'DJ:DJI';
  }
  if (ticker === 'NASDAQ COMP' || ticker === 'IXIC') {
    return 'NASDAQ:IXIC';
  }
  if (ticker === 'NIKKEI 225' || ticker === 'NIKKEI') {
    return 'INDEX:N225';
  }
  if (ticker === 'HANG SENG' || ticker === 'HSI') {
    return 'HSI:HSI';
  }
  if (ticker === 'ASX 200' || ticker === 'ASX') {
    return 'INDEX:XJO';
  }
  if (ticker === 'DAX INDEX' || ticker === 'DAX') {
    return 'INDEX:DAX';
  }
  if (ticker === 'CAC 40' || ticker === 'CAC') {
    return 'INDEX:CAC';
  }
  if (ticker === 'FTSE 100' || ticker === 'FTSE') {
    return 'INDEX:UKX';
  }
  if (ticker === 'GOLD FUTURES' || ticker === 'GOLD') {
    return 'COMEX:GC1!';
  }
  if (ticker === 'CRUDE OIL' || ticker === 'BRENT') {
    return 'NYMEX:CL1!';
  }

  // Map known SGX stocks
  const sgxMapping: Record<string, string> = {
    'DBS': 'SGX:D05',
    'UOB': 'SGX:U11',
    'OCBC': 'SGX:O39',
    'SINGTEL': 'SGX:Z74',
    'KEPPEL': 'SGX:BN4',
    'CAPITALAND': 'SGX:9CI',
    'WILMAR': 'SGX:F34',
    'SIA': 'SGX:C6L',
    'COMFORTDELGRO': 'SGX:C52',
    'SATS': 'SGX:S58'
  };
  if (sgxMapping[ticker]) {
    return sgxMapping[ticker];
  }

  // Map known US stocks
  const usMapping: Record<string, string> = {
    'AAPL': 'NASDAQ:AAPL',
    'MSFT': 'NASDAQ:MSFT',
    'GOOGL': 'NASDAQ:GOOGL',
    'AMZN': 'NASDAQ:AMZN',
    'NVDA': 'NASDAQ:NVDA',
    'TSLA': 'NASDAQ:TSLA',
    'META': 'NASDAQ:META',
    'NFLX': 'NASDAQ:NFLX',
    'AMD': 'NASDAQ:AMD',
    'COIN': 'NASDAQ:COIN'
  };
  if (usMapping[ticker]) {
    return usMapping[ticker];
  }

  // Fallback / defaults
  if (prefix) {
    return `${prefix}:${ticker}`;
  }
  
  // Default to IDX if no prefix exists and it's not a mapped foreign asset
  return `IDX:${ticker}`;
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
