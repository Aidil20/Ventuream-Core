import React, { useEffect, useRef, memo, useState } from 'react';

import { BrainCircuit, TrendingUp, TrendingDown, Minus, Zap, ArrowUpRight, ArrowDownRight, TrendingUp as TrendIcon } from 'lucide-react';
import { motion } from 'motion/react';
import MarketSentimentTrendChart from './MarketSentimentTrendChart';
import BloombergReutersFeed from './BloombergReutersFeed';
import type { MarketNews } from '../services/marketService';

const EMPTY_NEWS: MarketNews[] = [];

interface MarketOverviewWidgetProps {
  news?: MarketNews[];
  onRefreshNews?: () => void;
  isLoadingNews?: boolean;
  onSelectSymbol?: (symbol: string) => void;
}

interface SparklineProps {
  data: number[];
  compareData?: number[];
  color: string;
  compareColor?: string;
}

const Sparkline = ({ data, compareData, color, compareColor = '#64748b' }: SparklineProps) => {
  const allValues = compareData ? [...data, ...compareData] : data;
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;
  const width = 110;
  const height = 28;

  const points = data
    .map((val, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - 4 - ((val - min) / range) * (height - 8);
      return `${x},${y}`;
    })
    .join(' ');

  const comparePoints = compareData
    ? compareData
        .map((val, index) => {
          const x = (index / (compareData.length - 1)) * width;
          const y = height - 4 - ((val - min) / range) * (height - 8);
          return `${x},${y}`;
        })
        .join(' ')
    : '';

  return (
    <svg className="overflow-visible" width={width} height={height}>
      {compareData && (
        <polyline
          fill="none"
          stroke={compareColor}
          strokeWidth="1.5"
          strokeDasharray="2 2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={comparePoints}
        />
      )}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <circle
        cx={width}
        cy={height - 4 - ((data[data.length - 1] - min) / range) * (height - 8)}
        r="2.5"
        fill={color}
        className="animate-pulse"
      />
      {compareData && (
        <circle
          cx={width}
          cy={height - 4 - ((compareData[compareData.length - 1] - min) / range) * (height - 8)}
          r="1.8"
          fill={compareColor}
        />
      )}
    </svg>
  );
};

function MarketOverviewWidget({ news = EMPTY_NEWS, onRefreshNews, isLoadingNews = false, onSelectSymbol }: MarketOverviewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef(`tv-overview-${Math.random().toString(36).substr(2, 9)}`);
  
  // Toggle Comparison state: NONE, 7D, MM, YOY, HIST
  const [comparisonMode, setComparisonMode] = useState<'NONE' | '7D' | 'MM' | 'YOY' | 'HIST'>('7D');

  const predictions = [
    { 
      symbol: 'IHSG', 
      prediction: 'BULLISH', 
      confidence: '84%', 
      movement: '+0.45%', 
      catalyst: 'M2 Liquidity Inflow',
      history: [6890, 6912, 6885, 6930, 6910, 6940, 6955, 6942, 6978],
      compare7D: [6895, 6902, 6905, 6912, 6920, 6928, 6935, 6940, 6945],
      compareMm: [6780, 6800, 6825, 6810, 6845, 6860, 6890, 6915, 6930],
      compareYoy: [6550, 6580, 6610, 6605, 6640, 6675, 6720, 6750, 6790],
      compareHist: [6680, 6695, 6710, 6725, 6740, 6760, 6775, 6790, 6810],
      direction: 'up'
    },
    { 
      symbol: 'GOLD', 
      prediction: 'NEUTRAL', 
      confidence: '71%', 
      movement: '-0.02%', 
      catalyst: 'USD Consolidation',
      history: [2320, 2315, 2322, 2318, 2325, 2320, 2317, 2319, 2318],
      compare7D: [2322, 2321, 2320, 2320, 2319, 2319, 2318, 2318, 2317],
      compareMm: [2280, 2290, 2295, 2300, 2305, 2310, 2315, 2312, 2310],
      compareYoy: [1980, 1995, 2010, 2030, 2050, 2080, 2110, 2140, 2180],
      compareHist: [2150, 2160, 2170, 2180, 2190, 2200, 2210, 2220, 2230],
      direction: 'flat'
    },
    { 
      symbol: 'USD/IDR', 
      prediction: 'BEARISH', 
      confidence: '68%', 
      movement: '-12.50', 
      catalyst: 'BI Rate Stability',
      history: [16450, 16420, 16460, 16430, 16390, 16410, 16380, 16350, 16340],
      compare7D: [16435, 16428, 16420, 16412, 16405, 16395, 16385, 16375, 16365],
      compareMm: [16200, 16220, 16250, 16280, 16310, 16330, 16350, 16380, 16400],
      compareYoy: [14950, 15020, 15080, 15150, 15220, 15280, 15350, 15410, 15480],
      compareHist: [15500, 15550, 15600, 15650, 15700, 15750, 15800, 15850, 15900],
      direction: 'down'
    },
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
      {/* Sparkline Comparison Mode Selector Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-850/50 shadow-md">
        <div>
          <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <TrendIcon className="w-3.5 h-3.5 text-[#deff9a]" />
            Market Sentiment Analyzer
          </h3>
          <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-mono">Compare active intraday 24h trend against historical averages</p>
        </div>
        
        {/* Toggle options */}
        <div className="flex bg-zinc-900 border border-zinc-850 p-0.5 rounded-lg shrink-0 flex-wrap gap-1 sm:gap-0">
          {(['NONE', '7D', 'MM', 'YOY', 'HIST'] as const).map((mode) => {
            const labels = {
              NONE: 'Only 24H',
              '7D': '7D Avg',
              MM: 'MoM Avg',
              YOY: 'YoY Avg',
              HIST: 'Hist Avg'
            };
            const isActive = comparisonMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setComparisonMode(mode)}
                className={`text-[9px] font-mono font-extrabold uppercase px-2.5 py-1 rounded transition-all ${
                  isActive
                    ? 'bg-[#deff9a] text-black shadow font-black'
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                {labels[mode]}
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Prediction Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {predictions.map((p, i) => {
          const sparklineColor = p.prediction === 'BULLISH' ? '#4ade80' : 
                                 p.prediction === 'BEARISH' ? '#f43f5e' : '#a1a1aa';
          
          let targetCompareList: number[] | undefined = undefined;
          let legendText = '24H trend';
          if (comparisonMode === '7D') {
            targetCompareList = p.compare7D;
            legendText = 'vs 7D Average';
          } else if (comparisonMode === 'MM') {
            targetCompareList = p.compareMm;
            legendText = 'vs MoM Avg';
          } else if (comparisonMode === 'YOY') {
            targetCompareList = p.compareYoy;
            legendText = 'vs YoY Avg';
          } else if (comparisonMode === 'HIST') {
            targetCompareList = p.compareHist;
            legendText = 'vs Hist Avg';
          }

          return (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 rounded-xl border border-[#deff9a]/10 bg-zinc-950/40 relative overflow-hidden group flex flex-col justify-between min-h-[145px]"
            >
              <div className="absolute top-0 right-0 p-2 opacity-15 group-hover:opacity-30 transition-opacity pointer-events-none">
                <BrainCircuit className="w-12 h-12 text-[#deff9a]" />
              </div>
              
              <div>
                <div className="flex justify-between items-start mb-2 relative">
                  <div>
                    <span className="text-[10px] font-black text-[#deff9a] uppercase tracking-widest block">{p.symbol}</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      {p.prediction === 'BULLISH' ? (
                        <>
                          <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                          <ArrowUpRight className="w-3.5 h-3.5 text-green-400 animate-pulse" />
                        </>
                      ) : p.prediction === 'BEARISH' ? (
                        <>
                          <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                          <ArrowDownRight className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                        </>
                      ) : (
                        <>
                          <Minus className="w-3.5 h-3.5 text-zinc-500" />
                        </>
                      )}
                      <span className={`text-[10px] font-bold ${
                        p.prediction === 'BULLISH' ? 'text-green-400' : 
                        p.prediction === 'BEARISH' ? 'text-red-500' : 'text-zinc-500'
                      }`}>
                        {p.prediction}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-zinc-550 font-extrabold uppercase tracking-widest leading-none">Confidence</p>
                    <p className="text-xs font-mono font-black text-white mt-1">{p.confidence}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 mb-2 relative gap-1">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-mono font-black text-white">{p.movement}</span>
                      <span className="text-[8px] text-zinc-500 font-bold uppercase">(24H)</span>
                    </div>
                    {comparisonMode !== 'NONE' && (
                      <span className="text-[7.5px] font-mono text-zinc-500 uppercase mt-0.5 whitespace-nowrap">
                        Ref: <span className="text-zinc-400 font-bold">{targetCompareList ? targetCompareList[targetCompareList.length - 1].toLocaleString('id-ID') : ''}</span>
                      </span>
                    )}
                  </div>
                  
                  {/* Realtime 24-Hour Sparkline Sentiment Direction */}
                  <div className="flex flex-col items-end shrink-0" title="24H Intraday Sentiment Sparkline">
                    <Sparkline data={p.history} compareData={targetCompareList} color={sparklineColor} compareColor="#64748b" />
                    <span className="text-[7px] text-zinc-500 font-mono mt-1 tracking-wider uppercase flex items-center gap-1.5">
                      {comparisonMode !== 'NONE' && <span className="w-1.5 h-0.5 bg-zinc-600 inline-block line-clamp-1 border-t border-dashed border-zinc-500"></span>}
                      {legendText}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 relative mt-2 pt-2 border-t border-zinc-900/50">
                <Zap className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <p className="text-[9.5px] text-zinc-400 font-bold uppercase truncate">{p.catalyst}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Real-time Bloomberg & Reuters Curated Headlines Module */}
      <BloombergReutersFeed onSelectSymbol={onSelectSymbol} />

      {/* Integrated Market Sentiment Trend Line Chart */}
      <MarketSentimentTrendChart 
        news={news} 
        onRefresh={onRefreshNews} 
        isLoading={isLoadingNews} 
      />

      {/* Main TradingView Widget */}
      <div className="tradingview-widget-container rounded-xl overflow-hidden border border-zinc-800/50 bg-zinc-950/20 min-h-[400px]" ref={container} />
    </div>
  );
}

export default memo(MarketOverviewWidget);
