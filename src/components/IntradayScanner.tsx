import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Zap, ShieldAlert, CheckCircle2, TrendingUp, Radar } from 'lucide-react';

interface IntradayData {
  ticker: string;
  price: number;
  change: number;
  vwap: number;
  ema20: number;
  ema50: number;
  rsi: number;
  macdHist: number;
  bbWidth: number; // Bollinger Band Width
  atr: number;      // Average True Range for volatility
  volumeTrend: 'up' | 'down' | 'neutral';
}

interface SuperSignal {
  ticker: string;
  price: number;
  change: number;
  score: number;
  status: string;
  color: string;
  active_signals: string[];
  rsi: number;
  macdHist: number;
  bbWidth: number;
  volatility: 'LOW' | 'NORMAL' | 'HIGH';
  timestamp: string;
}

// VAM Core AI - Refined Super Signal Logic
const calculateSuperSignal = (data: IntradayData): SuperSignal => {
  const { price, change, vwap, ema20, ema50, rsi, macdHist, bbWidth, atr, volumeTrend } = data;
  let score = 0;
  let signals: string[] = [];

  // 1. Trend Integrity (VWAP) - Weighted 25%
  if (price > vwap) {
    score += 25;
    signals.push("Above VWAP (Strong)");
  } else if (price > vwap * 0.995) {
    score += 10;
    signals.push("Near VWAP Anchor");
  }

  // 2. Momentum Convergence (EMA Cross) - Weighted 20%
  if (ema20 > ema50) {
    score += 20;
    signals.push("EMA Golden Cross");
  } else if (ema20 > ema50 * 0.998) {
    score += 5;
    signals.push("EMA Compression");
  }

  // 3. Oscillator Confirmation (RSI) - Weighted 15%
  // Optimal 'Buy' zone is 40-60 (emerging trend)
  if (rsi > 40 && rsi < 60) {
    score += 15;
    signals.push("RSI Expansion");
  } else if (rsi >= 30 && rsi <= 40) {
    score += 10;
    signals.push("RSI Oversold Recovery");
  } else if (rsi >= 70) {
    score -= 10;
    signals.push("RSI Exhustion (Risk)");
  }

  // 4. Volatility Expansion (BB Width) - Weighted 15%
  if (bbWidth > 0.05) {
    score += 15;
    signals.push("Volatility Breakout");
  }

  // 5. Volume Flow - Weighted 15%
  if (volumeTrend === 'up') {
    score += 15;
    signals.push("Accumulation Flow");
  }

  // 6. MACD Confirmation - Weighted 10%
  if (macdHist > 0) {
    score += 10;
    signals.push("MACD Hist Positive");
  }

  let finalStatus = "NEUTRAL";
  let colorCode = "#9ca3af";

  if (score >= 85) {
    finalStatus = "ALPHA BUY";
    colorCode = "#d4af37"; // VAM Gold
  } else if (score >= 65) {
    finalStatus = "BULLISH";
    colorCode = "#22c55e"; // Green
  } else if (score >= 40) {
    finalStatus = "WATCHING";
    colorCode = "#3b82f6"; // Blue
  } else if (score < 25) {
    finalStatus = "DISTRIBUTION";
    colorCode = "#ef4444"; // Red
  }

  const volatilityRating = atr > (price * 0.02) ? 'HIGH' : atr > (price * 0.01) ? 'NORMAL' : 'LOW';

  return {
    ticker: data.ticker,
    price: price,
    change: change,
    score: Math.min(100, Math.max(0, score)),
    status: finalStatus,
    color: colorCode,
    active_signals: signals,
    rsi: rsi,
    macdHist: macdHist,
    bbWidth: bbWidth,
    volatility: volatilityRating as any,
    timestamp: new Date().toISOString()
  };
};

const MOCK_TICKERS = ["BBCA", "TLKM", "ASII", "ADRO", "UNVR", "GOTO", "BMRI", "BBNI", "MDKA", "ANTM"];

export default function IntradayScanner() {
  const [signals, setSignals] = useState<SuperSignal[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Initial simulation
  useEffect(() => {
    runScan();
    const interval = setInterval(runScan, 15000);
    
    // VAM Real-time Stream Subscriber
    const handleMarketUpdate = (e: any) => {
      const data = e.detail;
      if (data && data.vwap) {
        setSignals(prev => {
          const updated = prev.map(sig => {
            if (sig.ticker === data.symbol) {
              return calculateSuperSignal({
                ticker: data.symbol,
                price: data.price,
                change: data.change || 0,
                vwap: data.vwap,
                ema20: data.ema20,
                ema50: data.ema50,
                rsi: data.rsi,
                macdHist: data.macdHist,
                bbWidth: data.bbWidth || 0.02,
                atr: data.atr || data.price * 0.015,
                volumeTrend: data.volumeTrend || 'neutral'
              });
            }
            return sig;
          });
          return [...updated].sort((a, b) => b.score - a.score);
        });
      }
    };

    window.addEventListener('vam-market-update', handleMarketUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('vam-market-update', handleMarketUpdate);
    };
  }, []);

  const runScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const newSignals = MOCK_TICKERS.map(ticker => {
        const basePrice = Math.random() * 5000 + 1000;
        const mockData: IntradayData = {
          ticker,
          price: basePrice,
          change: (Math.random() * 6) - 2, // -2% to +4%
          vwap: basePrice * (0.98 + Math.random() * 0.04),
          ema20: basePrice * (0.99 + Math.random() * 0.02),
          ema50: basePrice * (0.97 + Math.random() * 0.04),
          rsi: 30 + Math.random() * 50,
          macdHist: Math.random() * 40 - 20,
          bbWidth: Math.random() * 0.1,
          atr: basePrice * (0.01 + Math.random() * 0.02),
          volumeTrend: Math.random() > 0.6 ? 'up' : Math.random() > 0.4 ? 'down' : 'neutral'
        };
        return calculateSuperSignal(mockData);
      }).sort((a, b) => b.score - a.score);
      
      setSignals(newSignals);
      setIsScanning(false);
    }, 800);
  };

  return (
    <div className="bg-zinc-950/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl">
      <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-zinc-900/50 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#d4af37]/10 rounded-xl border border-[#d4af37]/20">
            <Radar className="w-5 h-5 text-[#d4af37] animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white tracking-widest uppercase">Intraday Super-Signal</h2>
            <p className="text-[10px] text-zinc-500 font-bold">VAM CORE AI • HYPER-FREQUENCY ANALYSIS</p>
          </div>
        </div>
        <button 
          onClick={runScan}
          disabled={isScanning}
          className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${
            isScanning ? 'bg-zinc-800 text-zinc-500' : 'bg-[#deff9a] text-black hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(222,255,154,0.2)]'
          }`}
        >
          {isScanning ? 'ANALYZING...' : 'FORCE RESCAN'}
        </button>
      </div>

      <div className="p-4 overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
              <th className="px-4 pb-2">Asset ID</th>
              <th className="px-4 pb-2">Institutional Price</th>
              <th className="px-4 pb-2 text-center">VAM Score</th>
              <th className="px-4 pb-2 text-center">AI Analysis</th>
              <th className="px-4 pb-2 text-center">Indicators</th>
              <th className="px-4 pb-2">Signal Convergence</th>
              <th className="px-4 pb-2 text-right">Last Pulse</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {signals.map((sig, idx) => (
                <motion.tr 
                  key={sig.ticker}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.03, duration: 0.3 }}
                  className="group hover:bg-white/5 transition-colors relative"
                >
                  <td className="px-4 py-4 rounded-l-2xl border-y border-l border-white/5 bg-zinc-900/30">
                    <div className="flex flex-col">
                      <span className="font-black text-white text-sm tracking-tight">{sig.ticker}</span>
                      <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-tighter">GATEWAY: IBKR/CGS</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 border-y border-white/5 bg-zinc-900/30">
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-white text-xs">
                        {typeof sig.price === 'number' ? sig.price.toLocaleString('id-ID', { minimumFractionDigits: 0 }) : '0'} IDR
                      </span>
                      <span className={`text-[10px] font-black ${sig.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {sig.change >= 0 ? '+' : ''}{sig.change.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 border-y border-white/5 bg-zinc-900/30 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${sig.score}%` }}
                          transition={{ duration: 1, ease: "circOut" }}
                          className="h-full"
                          style={{ backgroundColor: sig.color }}
                        />
                      </div>
                      <span className="font-mono font-black text-[12px]" style={{ color: sig.color }}>{sig.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 border-y border-white/5 bg-zinc-900/30 text-center">
                    <span 
                      className="px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest border shadow-sm"
                      style={{ 
                        backgroundColor: `${sig.color}15`, 
                        color: sig.color,
                        borderColor: `${sig.color}30`
                      }}
                    >
                      {sig.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 border-y border-white/5 bg-zinc-900/30 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                        <span className={`text-[9px] font-bold ${sig.rsi > 70 ? 'text-red-400' : sig.rsi < 40 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                          RSI: {sig.rsi.toFixed(1)}
                        </span>
                        <span className={`text-[9px] font-bold ${sig.macdHist > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          MACD: {sig.macdHist > 0 ? '+' : ''}{sig.macdHist.toFixed(2)}
                        </span>
                        <span className="text-[9px] font-bold text-zinc-500">
                          BB: {(sig.bbWidth * 100).toFixed(1)}%
                        </span>
                        <span className={`text-[9px] font-bold ${sig.volatility === 'HIGH' ? 'text-orange-400' : 'text-zinc-500'}`}>
                          VOL: {sig.volatility}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 border-y border-white/5 bg-zinc-900/30">
                    <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                      {sig.active_signals.slice(0, 3).map(s => (
                        <span key={s} className="text-[7px] font-black text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-lg border border-white/5 uppercase tracking-tighter">
                          {s}
                        </span>
                      ))}
                      {sig.active_signals.length > 3 && (
                        <span className="text-[7px] font-black text-[#DFFF00] bg-[#DFFF00]/10 px-2 py-0.5 rounded-lg border border-[#DFFF00]/20 uppercase">
                          +{sig.active_signals.length - 3} MORE
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 rounded-r-2xl border-y border-r border-white/5 bg-zinc-900/30 text-right">
                    <span className="text-[9px] font-mono text-zinc-600 font-bold">
                      {new Date(sig.timestamp).toLocaleTimeString([], { hour12: false })}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
