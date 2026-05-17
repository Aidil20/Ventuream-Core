import React, { useEffect, useRef, memo } from 'react';

import { BrainCircuit, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import { motion } from 'motion/react';

function MarketOverviewWidget() {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef(`tv-overview-${Math.random().toString(36).substr(2, 9)}`);

  const predictions = [
    { symbol: 'IHSG', prediction: 'BULLISH', confidence: '84%', movement: '+0.45%', catalyst: 'M2 Liquidity Inflow' },
    { symbol: 'GOLD', prediction: 'NEUTRAL', confidence: '71%', movement: '-0.02%', catalyst: 'USD Consolidation' },
    { symbol: 'USD/IDR', prediction: 'BEARISH', confidence: '68%', movement: '-12.50', catalyst: 'BI Rate Stability' },
  ];

  useEffect(() => {
    const currentContainer = container.current;

    if (currentContainer && !currentContainer.querySelector('script')) {
      const scriptElement = document.createElement("script");
      scriptElement.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
      scriptElement.type = "text/javascript";
      scriptElement.async = true;
      scriptElement.innerHTML = JSON.stringify({
        "colorTheme": "dark",
        "dateRange": "12M",
        "showChart": true,
        "locale": "id",
        "largeChartUrl": "",
        "isTransparent": true,
        "showSymbolLogo": true,
        "showFloatingTooltip": false,
        "width": "100%",
        "height": "400",
        "tabs": [
          {
            "title": "Indeks",
            "symbols": [
              { "s": "IDX:COMPOSITE", "d": "IHSG" },
              { "s": "STI", "d": "Straits Times" },
              { "s": "OANDA:XAUUSD", "d": "Gold" },
              { "s": "FOREXCOM:SPX500", "d": "S&P 500" },
              { "s": "NASDAQ:IXIC", "d": "Nasdaq" },
              { "s": "TSE:NI225", "d": "Nikkei 225" },
              { "s": "HSI:HSI", "d": "Hang Seng" },
              { "s": "FX:UK100", "d": "FTSE 100" },
              { "s": "FX:GER40", "d": "DAX 40" }
            ],
            "originalTitle": "Indices"
          },
          {
            "title": "Mata Uang",
            "symbols": [
              { "s": "FX_IDC:USDIDR", "d": "USD/IDR" },
              { "s": "FX_IDC:EURIDR", "d": "EUR/IDR" },
              { "s": "FX_IDC:GBPIDR", "d": "GBP/IDR" },
              { "s": "FX:EURUSD", "d": "EUR/USD" },
              { "s": "FX:USDJPY", "d": "USD/JPY" },
              { "s": "FX:GBPUSD", "d": "GBP/USD" },
              { "s": "FX:AUDUSD", "d": "AUD/USD" },
              { "s": "FX:USDCAD", "d": "USD/CAD" }
            ],
            "originalTitle": "Forex"
          }
        ]
      });
      currentContainer.appendChild(scriptElement);
    }

    return () => {
      // Safe cleanup - let React handle DOM removal to avoid TV script crashes
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* AI Prediction Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {predictions.map((p, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-xl border border-[#deff9a]/10 bg-zinc-950/40 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <BrainCircuit className="w-12 h-12 text-[#deff9a]" />
            </div>
            
            <div className="flex justify-between items-start mb-2 relative">
              <div>
                <p className="text-[10px] font-black text-[#deff9a] uppercase tracking-widest">{p.symbol}</p>
                <div className="flex items-center gap-1 mt-1">
                  {p.prediction === 'BULLISH' ? <TrendingUp className="w-3 h-3 text-green-400" /> : 
                   p.prediction === 'BEARISH' ? <TrendingDown className="w-3 h-3 text-red-500" /> : 
                   <Minus className="w-3 h-3 text-zinc-500" />}
                  <span className={`text-[10px] font-bold ${
                    p.prediction === 'BULLISH' ? 'text-green-400' : 
                    p.prediction === 'BEARISH' ? 'text-red-500' : 'text-zinc-500'
                  }`}>
                    {p.prediction}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest leading-none">Confidence</p>
                <p className="text-xs font-black text-white">{p.confidence}</p>
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-2 relative">
              <span className="text-lg font-black text-white">{p.movement}</span>
              <span className="text-[9px] text-zinc-500 font-bold uppercase">(24H Est.)</span>
            </div>

            <div className="flex items-center gap-2 relative">
              <Zap className="w-3 h-3 text-orange-400" />
              <p className="text-[9px] text-zinc-500 font-bold uppercase truncate">{p.catalyst}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main TradingView Widget */}
      <div className="tradingview-widget-container rounded-xl overflow-hidden border border-zinc-800/50 bg-zinc-950/20 min-h-[400px]" ref={container}>
         <div className="tradingview-widget-container__widget"></div>
      </div>
    </div>
  );
}

export default memo(MarketOverviewWidget);
