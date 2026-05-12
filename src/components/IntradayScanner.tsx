import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Zap, ShieldAlert, CheckCircle2, TrendingUp, Radar } from 'lucide-react';

interface IntradayData {
  ticker: string;
  price: number;
  vwap: number;
  ema20: number;
  ema50: number;
  rsi: number;
  macdHist: number;
}

interface SuperSignal {
  ticker: string;
  score: number;
  status: string;
  color: string;
  active_signals: string[];
  timestamp: string;
}

// VAM Core AI - Super Signal Logic Implementation
const calculateSuperSignal = (data: IntradayData): SuperSignal => {
  const { price, vwap, ema20, ema50, rsi, macdHist } = data;
  let score = 0;
  let signals: string[] = [];

  // 1. Analisis VWAP (Trend Utama)
  if (price > vwap) {
    score += 30;
    signals.push("Above VWAP");
  }

  // 2. Analisis EMA (Momentum)
  if (ema20 > ema50) {
    score += 30;
    signals.push("EMA Golden Cross");
  }

  // 3. Analisis MACD (Konfirmasi)
  if (macdHist > 0) {
    score += 20;
    signals.push("MACD Positive Histogram");
  }

  // 4. Analisis RSI (Batasan Jenuh)
  if (rsi > 40 && rsi < 70) {
    score += 20;
    signals.push("RSI Healthy Zone");
  } else if (rsi >= 70) {
    signals.push("RSI Overbought (Caution)");
  }

  let finalStatus = "NEUTRAL";
  let colorCode = "#9ca3af"; 

  if (score >= 80) {
    finalStatus = "STRONG BUY";
    colorCode = "#d4af37"; // VAM Gold
  } else if (score >= 50) {
    finalStatus = "QUALIFIED";
    colorCode = "#22c55e"; // Green
  } else if (score < 30) {
    finalStatus = "AVOID/SELL";
    colorCode = "#ef4444"; // Red
  }

  return {
    ticker: data.ticker,
    score: score,
    status: finalStatus,
    color: colorCode,
    active_signals: signals,
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
        // If the update contains indicator data, recalculate the signal for that ticker immediately
        setSignals(prev => {
          const updated = prev.map(sig => {
            if (sig.ticker === data.symbol) {
              return calculateSuperSignal({
                ticker: data.symbol,
                price: data.price,
                vwap: data.vwap,
                ema20: data.ema20,
                ema50: data.ema50,
                rsi: data.rsi,
                macdHist: data.macdHist
              });
            }
            return sig;
          });
          
          // Re-sort if the score changed significantly
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
    // Simulate complex calculation lag
    setTimeout(() => {
      const newSignals = MOCK_TICKERS.map(ticker => {
        const basePrice = Math.random() * 5000 + 1000;
        const mockData: IntradayData = {
          ticker,
          price: basePrice,
          vwap: basePrice * (0.98 + Math.random() * 0.04),
          ema20: basePrice * (0.99 + Math.random() * 0.02),
          ema50: basePrice * (0.97 + Math.random() * 0.04),
          rsi: 30 + Math.random() * 50,
          macdHist: Math.random() * 40 - 20
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
              <th className="px-4 pb-2">Symbol</th>
              <th className="px-4 pb-2">VAM Score</th>
              <th className="px-4 pb-2">AI Verdict</th>
              <th className="px-4 pb-2">Active Signals</th>
              <th className="px-4 pb-2 text-right">Last Sync</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {signals.map((sig, idx) => (
                <motion.tr 
                  key={sig.ticker}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05, duration: 0.4 }}
                  className="group hover:bg-white/5 transition-colors relative"
                >
                  <td className="px-4 py-4 rounded-l-2xl border-y border-l border-white/5 bg-zinc-900/30">
                    <span className="font-black text-white text-sm tracking-tight">{sig.ticker}</span>
                  </td>
                  <td className="px-4 py-4 border-y border-white/5 bg-zinc-900/30">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
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
                  <td className="px-4 py-4 border-y border-white/5 bg-zinc-900/30">
                    <span 
                      className="px-2 py-1 rounded-md text-[9px] font-black tracking-widest border"
                      style={{ 
                        backgroundColor: `${sig.color}15`, 
                        color: sig.color,
                        borderColor: `${sig.color}30`
                      }}
                    >
                      {sig.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 border-y border-white/5 bg-zinc-900/30">
                    <div className="flex flex-wrap gap-1.5">
                      {sig.active_signals.map(s => (
                        <span key={s} className="text-[8px] font-bold text-zinc-400 bg-zinc-800/50 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                          {s}
                        </span>
                      ))}
                      {sig.active_signals.length === 0 && <span className="text-[10px] text-zinc-600 italic">No convergence</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4 rounded-r-2xl border-y border-r border-white/5 bg-zinc-900/30 text-right">
                    <span className="text-[9px] font-mono text-zinc-500">
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
