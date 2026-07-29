import React, { useState, useMemo } from 'react';
import { 
  ComposedChart,
  AreaChart,
  Area, 
  Bar,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, TrendingUp, BarChart3, Layers } from 'lucide-react';

const MOCK_DATA = {
  '1D': Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    value: 9000000 + Math.sin(i / 3) * 350000 + Math.random() * 200000,
    volume: Math.floor(12000 + Math.abs(Math.sin(i * 1.2)) * 45000 + Math.random() * 15000)
  })),
  '5D': Array.from({ length: 5 }, (_, i) => ({
    time: `May ${i + 1}`,
    value: 8800000 + Math.sin(i) * 500000 + Math.random() * 300000,
    volume: Math.floor(180000 + Math.random() * 280000)
  })),
  '1M': Array.from({ length: 30 }, (_, i) => ({
    time: `${i + 1}`,
    value: 8500000 + Math.sin(i / 4) * 800000 + Math.random() * 400000,
    volume: Math.floor(90000 + Math.random() * 210000)
  })),
  '3M': Array.from({ length: 12 }, (_, i) => ({
    time: `W${i + 1}`,
    value: 8000000 + (i * 220000) + Math.random() * 500000,
    volume: Math.floor(420000 + Math.random() * 580000)
  })),
  '6M': Array.from({ length: 6 }, (_, i) => ({
    time: `M${i + 1}`,
    value: 7500000 + (i * 420000) + Math.random() * 700000,
    volume: Math.floor(1100000 + Math.random() * 1400000)
  })),
  '1Y': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => ({
    time: month,
    value: 7000000 + (i * 320000) + Math.random() * 800000,
    volume: Math.floor(2200000 + Math.random() * 2800000)
  })),
  'YTD': Array.from({ length: 5 }, (_, i) => ({
    time: `May ${i + 1}`,
    value: 4000000 + (i * 1500000) + Math.random() * 500000,
    volume: Math.floor(2800000 + Math.random() * 1900000)
  }))
};

const TIME_RANGES = ['1D', '5D', '1M', '3M', '6M', '1Y', 'YTD'];

interface PortfolioChartProps {
  currentValue?: number;
  symbol?: string; // Optional symbol to show dedicated TradingView chart
}

export default function PortfolioChart({ currentValue = 0, symbol = 'IDX:COMPOSITE' }: PortfolioChartProps) {
  const [range, setRange] = useState('YTD');
  const [viewMode, setViewMode] = useState<'portfolio' | 'market'>('portfolio');
  const [showBenchmark, setShowBenchmark] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [topPeriod, setTopPeriod] = useState('YTD');
  const [subTab, setSubTab] = useState<'valuation' | 'comparison'>('comparison');

  const getDetailedTooltipStats = (timeStr: string, currentVal: number, benchmarkVal?: number) => {
    const dateNum = parseInt(timeStr.replace(/\D/g, '')) || 5;
    const seed = ((dateNum % 10) || 5) / 10;
    
    // Day comparison
    const dayPort = 0.5 + seed * 1.5;
    const dayIhsg = -0.2 + seed * 0.5;
    
    // Weekly
    const weekPort = 2.1 + seed * 2.5;
    const weekIhsg = 0.1 + seed * 0.8;

    // MM (Monthly)
    const mmPort = 6.2 + seed * 3.5;
    const mmIhsg = 0.5 + seed * 1.2;

    // YTD (Year-to-Date)
    const ytdPort = 14.5 + seed * 8;
    const ytdIhsg = 2.1 + seed * 2.1;

    // 1Y
    const y1Port = 20.2 + seed * 10;
    const y1Ihsg = 4.2 + seed * 3.2;

    // 3Y
    const y3Port = 55.4 + seed * 15;
    const y3Ihsg = 10.5 + seed * 6.5;

    return {
      day: { port: dayPort, ihsg: dayIhsg },
      weekly: { port: weekPort, ihsg: weekIhsg },
      mm: { port: mmPort, ihsg: mmIhsg },
      ytd: { port: ytdPort, ihsg: ytdIhsg },
      y1: { port: y1Port, ihsg: y1Ihsg },
      y3: { port: y3Port, ihsg: y3Ihsg }
    };
  };

  const data = useMemo(() => {
    const baseData = MOCK_DATA[range as keyof typeof MOCK_DATA];
    if (viewMode === 'market') return baseData;

    // Scale mock data to anchor to current value for realism
    let processedData = baseData.map(d => ({ ...d }));
    
    if (currentValue > 0) {
      const lastMockValue = baseData[baseData.length - 1].value;
      const scaleFactor = currentValue / lastMockValue;
      processedData = processedData.map(d => ({
        ...d,
        value: d.value * scaleFactor
      }));
    }

    if (showBenchmark || true) {
      // Simulate benchmark (IHSG) data based on portfolio trends but slightly different
      const startValue = processedData[0].value;
      processedData = processedData.map((d, i) => {
        // Benchmark follows a slightly different trajectory (e.g., smoother or lagging)
        const volatility = 0.05;
        const drift = 0.002;
        const benchmarkTrend = 1 + (i * drift) + (Math.sin(i / 3) * volatility);
        return {
          ...d,
          benchmark: startValue * benchmarkTrend
        };
      });
    }

    return processedData;
  }, [range, viewMode, currentValue, showBenchmark]);

  const maxVolume = useMemo(() => {
    if (!data || data.length === 0) return 100000;
    return Math.max(...data.map(d => d.volume || 0), 100);
  }, [data]);

  const percentageData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const startVal = data[0].value || 1;
    // Ensure we have a benchmark start
    const startBenchmark = data[0].benchmark || startVal * 0.98;

    return data.map((d, i) => {
      const valuePct = ((d.value - startVal) / startVal) * 100;
      
      // Calculate a stable benchmark value if we don't have it
      let bVal = d.benchmark;
      if (bVal === undefined) {
        bVal = startVal * (1 + (i * 0.0035) + (Math.sin(i / 1.5) * 0.04));
      }
      const benchmarkPct = ((bVal - startBenchmark) / startBenchmark) * 100;
      
      const prevVal = i > 0 ? data[i - 1].value : d.value;
      const isUp = d.value >= prevVal;

      return {
        ...d,
        valuePct,
        benchmarkPct,
        isUp
      };
    });
  }, [data]);

  const dataWithDirection = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((d, i) => {
      const prevVal = i > 0 ? data[i - 1].value : d.value;
      return {
        ...d,
        isUp: d.value >= prevVal
      };
    });
  }, [data]);

  const metrics = useMemo(() => {
    if (percentageData.length === 0) return { portfolioReturn: 0, benchmarkReturn: 0, outperformance: 0, alpha: 0, beta: 0.95, sharpe: 2.1, trackingError: 1.8, infoRatio: 1.5 };
    const lastItem = percentageData[percentageData.length - 1];
    const portfolioReturn = lastItem.valuePct || 0;
    const benchmarkReturn = lastItem.benchmarkPct || 0;
    const outperformance = portfolioReturn - benchmarkReturn;
    
    let beta = 0.92;
    let sharpe = 2.45;
    let trackingError = 1.65;
    let alpha = outperformance * 0.85;

    if (range === '1D') {
      beta = 0.88; sharpe = 1.95; trackingError = 0.45;
    } else if (range === '5D') {
      beta = 0.94; sharpe = 2.12; trackingError = 0.85;
    } else if (range === '1M') {
      beta = 0.91; sharpe = 2.30; trackingError = 1.25;
    } else if (range === '3M') {
      beta = 0.95; sharpe = 2.48; trackingError = 1.50;
    } else if (range === '6M') {
      beta = 0.92; sharpe = 2.55; trackingError = 1.90;
    } else if (range === '1Y') {
      beta = 0.89; sharpe = 2.62; trackingError = 2.20;
    }

    return {
      portfolioReturn,
      benchmarkReturn,
      outperformance,
      alpha,
      beta,
      sharpe,
      trackingError,
      infoRatio: outperformance / (trackingError * 3 || 1)
    };
  }, [percentageData, range]);

  const formatValue = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 1,
      notation: 'compact'
    }).format(val);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header section
    doc.setFillColor(15, 23, 42); // slate-900 background for header card
    doc.rect(0, 0, 210, 42, 'F');
    
    // VentureAM branding
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(223, 255, 0); // #DFFF00 yellow-green accent
    doc.text("VentureAM", 15, 18);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("INSTITUTIONAL ASSET MANAGEMENT SYSTEM", 15, 25);
    doc.text("INTERNATIONAL GATEWAY SECURED PORTFOLIO HISTORICAL SEQUENCE", 15, 29);
    
    // Metadata block on right side
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("PORTFOLIO HISTORICAL REPORT", 195, 18, { align: 'right' });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    const currentDateStr = new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC';
    doc.text(`Cetak / Printed: ${currentDateStr}`, 195, 24, { align: 'right' });
    doc.text(`Active Time Range: ${range}`, 195, 28, { align: 'right' });
    doc.text(`View Mode: ${viewMode.toUpperCase()}`, 195, 32, { align: 'right' });
    doc.text(`Analysis Type: ${subTab === 'comparison' ? 'PERFORMANCE COMPARISON VS IHSG' : 'HISTORICAL VALUATION (IDR)'}`, 195, 36, { align: 'right' });

    // Report Summary section
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Historial Pricing & Market Metric Sequence Data", 15, 52);
    
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 55, 195, 55);
    
    // Detailed stats block
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Summary Overview (${range})`, 15, 65);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    
    const firstPrice = data[0]?.value || 0;
    const lastPrice = data[data.length - 1]?.value || 0;
    const netChange = lastPrice - firstPrice;
    const pctChange = firstPrice > 0 ? (netChange / firstPrice) * 100 : 0;
    
    const formatIDRLocal = (v: number) => {
      const isNegative = v < 0;
      const absV = Math.abs(v);
      return (isNegative ? '- ' : '') + 'Rp ' + absV.toLocaleString('id-ID', { maximumFractionDigits: 0 });
    };

    doc.text(`Initial Value: ${formatIDRLocal(firstPrice)}`, 15, 72);
    doc.text(`Current / Value at End: ${formatIDRLocal(lastPrice)}`, 15, 77);
    doc.text(`Net Sequence Change: ${formatIDRLocal(netChange)} (${netChange >= 0 ? '+' : ''}${pctChange.toFixed(2)}%)`, 15, 82);
    
    // Draw table headers with correct column definitions
    const headers = [['Sequence Step / Time', 'Portfolio Value (IDR)', ...(showBenchmark ? ['IHSG Benchmark (IDR)'] : []), 'Trading Volume (Lots)']];
    const rows = data.map(item => [
      item.time,
      item.value.toLocaleString('id-ID', { maximumFractionDigits: 0 }),
      ...(showBenchmark && item.benchmark !== undefined ? [item.benchmark.toLocaleString('id-ID', { maximumFractionDigits: 0 })] : []),
      item.volume ? item.volume.toLocaleString('id-ID') : 'N/A'
    ]);

    autoTable(doc, {
      startY: 90,
      head: headers,
      body: rows,
      theme: 'striped',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [223, 255, 0],
        fontSize: 8.5,
        font: 'helvetica',
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        font: 'helvetica'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 15, right: 15 }
    });

    // Save the PDF
    doc.save(`VentureAM_Portfolio_${range}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-800/80 backdrop-blur-xl shadow-2xl overflow-hidden relative group animate-fade-in"
    >
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#DFFF00]/5 blur-[100px] rounded-full group-hover:bg-[#DFFF00]/10 transition-all duration-700 animate-pulse" />
      
      {/* Sub-tab switcher for Performance vs Valuation */}
      <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-slate-800/80 mb-6 gap-1 relative z-20">
        <button
          onClick={() => setSubTab('comparison')}
          className={`flex-1 py-2 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 ${
            subTab === 'comparison'
              ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-[#DFFF00] shadow-[0_0_15px_rgba(223,255,0,0.15)] ring-1 ring-slate-700/50'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Performance Comparison (% vs IHSG)
        </button>
        <button
          onClick={() => setSubTab('valuation')}
          className={`flex-1 py-2 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 ${
            subTab === 'valuation'
              ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-[#deff9a] shadow-[0_0_15px_rgba(222,255,154,0.15)] ring-1 ring-slate-700/50'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Historical Valuation (IDR)
        </button>
      </div>

      {/* Visual Alignment Header matching Image 2 */}
      <div className="relative z-10 flex flex-col gap-4 mb-6">
        {/* Top period selector pill bar */}
        <div className="flex bg-slate-950/60 p-1 rounded-2xl border border-slate-800/50 shadow-inner w-full justify-between items-center">
          {['Day', 'Weekly', 'MM', 'YTD', '1Y', '3Y'].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTopPeriod(t);
                // Sync interval range
                if (t === 'Day') setRange('1D');
                else if (t === 'Weekly') setRange('5D');
                else if (t === 'MM') setRange('1M');
                else if (t === 'YTD') setRange('YTD');
                else if (t === '1Y') setRange('1Y');
              }}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                topPeriod === t 
                  ? 'bg-slate-800 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)] ring-1 ring-slate-700/50' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Dynamic central panel header based on sub-tab */}
        {subTab === 'comparison' ? (
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
            <button
              onClick={() => setShowBenchmark(!showBenchmark)}
              className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-md ${
                showBenchmark 
                  ? 'bg-gradient-to-r from-slate-800/90 to-slate-800 text-[#DFFF00] border border-slate-700/80 shadow-[0_0_20px_rgba(223,255,0,0.1)]' 
                  : 'bg-slate-950/40 text-slate-500 border border-slate-800/60 hover:text-slate-300 hover:bg-slate-900/50'
              }`}
            >
              {showBenchmark ? 'Hide IHSG Benchmark' : 'Show IHSG Benchmark'}
            </button>
            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-md flex items-center justify-center gap-2 ${
                showVolume 
                  ? 'bg-gradient-to-r from-slate-800/90 to-slate-800 text-emerald-400 border border-slate-700/80 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                  : 'bg-slate-950/40 text-slate-500 border border-slate-800/60 hover:text-slate-300 hover:bg-slate-900/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              {showVolume ? 'Hide Volume Overlay' : 'Show Volume Overlay'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
            <div className="flex-1 py-3 px-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-center flex flex-col items-center justify-center">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Current Portfolio Asset Valuation</span>
              <span className="text-sm font-black text-[#deff9a] font-mono mt-0.5">
                Rp {typeof currentValue === 'number' ? currentValue.toLocaleString('id-ID') : (currentValue || 'N/A')}
              </span>
            </div>
            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-md flex items-center justify-center gap-2 ${
                showVolume 
                  ? 'bg-gradient-to-r from-slate-800/90 to-slate-800 text-emerald-400 border border-slate-700/80' 
                  : 'bg-slate-950/40 text-slate-500 border border-slate-800/60 hover:text-slate-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              {showVolume ? 'Volume On' : 'Volume Off'}
            </button>
          </div>
        )}

        {/* Technical Horizon interval picker (Double Pill sequence) */}
        <div className="flex bg-slate-950/40 p-1 rounded-2xl border border-[#1e293b] w-full justify-between items-center">
          {TIME_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => {
                setRange(r);
                if (r === '1D') setTopPeriod('Day');
                else if (r === '5D') setTopPeriod('Weekly');
                else if (r === '1M') setTopPeriod('MM');
                else if (r === 'YTD') setTopPeriod('YTD');
                else if (r === '1Y') setTopPeriod('1Y');
              }}
              className={`flex-1 py-1.5 rounded-xl text-[10px] font-black transition-all duration-300 ${
                range === r 
                  ? 'bg-slate-800 text-white ring-1 ring-slate-700/30 shadow-md' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
                {r}
            </button>
          ))}
        </div>

        {/* High-Contrast Bullet Legend Row */}
        <div className="flex items-center gap-6 justify-center mt-2 text-[10px] font-black uppercase tracking-wider flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 rounded-full bg-[#DFFF00] inline-block shadow-[0_0_8px_rgba(223,255,0,0.4)]" />
            <span className="text-slate-400">VentureAM Portfolio</span>
          </div>
          {subTab === 'comparison' && showBenchmark && (
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1 rounded-full bg-[#3b82f6] inline-block shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
              <span className="text-slate-400">Market (IHSG / JCI)</span>
            </div>
          )}
          {showVolume && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-500/40 border border-emerald-500 inline-block" />
              <span className="text-slate-400">Trading Activity (Volume)</span>
            </div>
          )}
        </div>
      </div>

      <div className="w-full relative aspect-[14/9] min-h-[350px] pl-10">
        {/* Rotated Vertical Y Axis Label */}
        <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 origin-center text-[8px] font-black text-slate-500 uppercase tracking-widest pointer-events-none whitespace-nowrap">
          {subTab === 'comparison' ? 'Percentage Growth (%)' : 'Portfolio Asset Valuation (IDR)'}
        </div>

      {viewMode === 'market' ? (
        <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-800">
          <iframe
            src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_762c9&symbol=${symbol}&interval=D&hidesidetoolbar=0&hidetoptoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%22MASimple%40tv-basicstudies%22%2C%22MAExp%40tv-basicstudies%22%2C%22RSI%40tv-basicstudies%22%2C%22MACD%40tv-basicstudies%22%2C%22BB%40tv-basicstudies%22%5D&theme=dark&style=3&timezone=Asia%2FJakarta&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=id&utm_source=www.tradingview.com&utm_medium=widget&utm_campaign=chart&utm_term=${symbol}`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowtransparency="true"
            scrolling="no"
            allowFullScreen={true}
          />
        </div>
      ) : (
        <motion.div 
          key={`chart-container-${range}-${showBenchmark}-${showVolume}-${subTab}`}
          initial={{ opacity: 0, y: 6, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="absolute inset-0 pl-4"
        >
          {subTab === 'comparison' ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={percentageData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DFFF00" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#DFFF00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="0" 
                  vertical={false} 
                  horizontal={true} 
                  stroke="#1e293b" 
                  strokeOpacity={0.4}
                />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 10, fontWeight: 800 }}
                  dy={10}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#475569', fontSize: 10, fontWeight: 800 }}
                  tickFormatter={(val) => `${val >= 0 ? '+' : ''}${val.toFixed(0)}%`}
                  dx={-5}
                />
                <YAxis 
                  yAxisId="volume"
                  orientation="right"
                  hide={true}
                  domain={[0, maxVolume * 3.8]}
                />
                <Tooltip 
                  cursor={{ stroke: '#DFFF00', strokeWidth: 1, strokeDasharray: '4 4' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      const timeLabel = item.time.toUpperCase();
                      const stats = getDetailedTooltipStats(item.time, item.value, item.benchmark);

                      const formatChange = (num: number) => {
                        const sign = num >= 0 ? '+' : '';
                        return `${sign}${num.toFixed(2)}%`;
                      };

                      const getChangeColor = (num: number) => {
                        return num >= 0 ? 'text-[#DFFF00]' : 'text-rose-400';
                      };

                      return (
                        <div className="bg-slate-950/95 border border-slate-800 p-4 rounded-2xl shadow-2xl backdrop-blur-xl w-[300px] border-l-4 border-l-[#DFFF00] z-50">
                          <div className="p-1 px-2.5 bg-slate-900 border border-slate-800 rounded-lg mb-2 flex justify-between items-center">
                            <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase">
                              KINERJA DETAIL - {timeLabel}
                            </p>
                            {item.volume && (
                              <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                Vol: {item.volume.toLocaleString('id-ID')} Lots
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            {/* DAY CARD */}
                            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/60">
                              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">DAY ({timeLabel})</p>
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-zinc-500 font-bold">PORTOFOLIO</span>
                                <span className={`font-black ${getChangeColor(stats.day.port)}`}>{formatChange(stats.day.port)}</span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] mt-0.5">
                                <span className="text-zinc-500 font-bold">IHSG</span>
                                <span className={`font-black ${getChangeColor(stats.day.ihsg)}`}>{formatChange(stats.day.ihsg)}</span>
                              </div>
                            </div>

                            {/* WEEKLY */}
                            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/60">
                              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">WEEKLY</p>
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-zinc-500 font-bold">PORTOFOLIO</span>
                                <span className={`font-black ${getChangeColor(stats.weekly.port)}`}>{formatChange(stats.weekly.port)}</span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] mt-0.5">
                                <span className="text-zinc-500 font-bold">IHSG</span>
                                <span className={`font-black ${getChangeColor(stats.weekly.ihsg)}`}>{formatChange(stats.weekly.ihsg)}</span>
                              </div>
                            </div>

                            {/* MM */}
                            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/60">
                              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">MM</p>
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-zinc-500 font-bold">PORTOFOLIO</span>
                                <span className={`font-black ${getChangeColor(stats.mm.port)}`}>{formatChange(stats.mm.port)}</span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] mt-0.5">
                                <span className="text-zinc-500 font-bold">IHSG</span>
                                <span className={`font-black ${getChangeColor(stats.mm.ihsg)}`}>{formatChange(stats.mm.ihsg)}</span>
                              </div>
                            </div>

                            {/* YTD VIEW */}
                            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/60">
                              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">YTD</p>
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-zinc-500 font-bold">PORTOFOLIO</span>
                                <span className={`font-black ${getChangeColor(stats.ytd.port)}`}>{formatChange(stats.ytd.port)}</span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] mt-0.5">
                                <span className="text-zinc-500 font-bold">IHSG</span>
                                <span className={`font-black ${getChangeColor(stats.ytd.ihsg)}`}>{formatChange(stats.ytd.ihsg)}</span>
                              </div>
                            </div>

                            {/* 1Y VIEW */}
                            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/60">
                              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">1Y</p>
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-zinc-500 font-bold">PORTOFOLIO</span>
                                <span className={`font-black ${getChangeColor(stats.y1.port)}`}>{formatChange(stats.y1.port)}</span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] mt-0.5">
                                <span className="text-zinc-500 font-bold">IHSG</span>
                                <span className={`font-black ${getChangeColor(stats.y1.ihsg)}`}>{formatChange(stats.y1.ihsg)}</span>
                              </div>
                            </div>

                            {/* 3Y VIEW */}
                            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/60">
                              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">3Y</p>
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-zinc-500 font-bold">PORTOFOLIO</span>
                                <span className={`font-black ${getChangeColor(stats.y3.port)}`}>{formatChange(stats.y3.port)}</span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] mt-0.5">
                                <span className="text-zinc-500 font-bold">IHSG</span>
                                <span className={`font-black ${getChangeColor(stats.y3.ihsg)}`}>{formatChange(stats.y3.ihsg)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {showVolume && (
                  <Bar yAxisId="volume" dataKey="volume" barSize={8} radius={[2, 2, 0, 0]} animationDuration={800}>
                    {percentageData.map((entry, index) => (
                      <Cell key={`vol-${index}`} fill={entry.isUp ? '#10b981' : '#f43f5e'} opacity={0.35} />
                    ))}
                  </Bar>
                )}
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="valuePct" 
                  stroke="#DFFF00" 
                  strokeWidth={3.5}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  animationDuration={1000}
                  dot={{ fill: '#DFFF00', stroke: '#020617', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#DFFF00', stroke: '#fff', strokeWidth: 2 }}
                />
                {showBenchmark && (
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="benchmarkPct" 
                    stroke="#3b82f6" 
                    strokeWidth={2.5}
                    fillOpacity={0}
                    animationDuration={1000}
                    dot={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dataWithDirection} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValuation" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#deff9a" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#deff9a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="0" 
                  vertical={false} 
                  horizontal={true} 
                  stroke="#1e293b" 
                  strokeOpacity={0.4}
                />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 10, fontWeight: 800 }}
                  dy={10}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#475569', fontSize: 10, fontWeight: 800 }}
                  tickFormatter={(val) => formatValue(val)}
                  dx={-5}
                />
                <YAxis 
                  yAxisId="volume"
                  orientation="right"
                  hide={true}
                  domain={[0, maxVolume * 3.8]}
                />
                <Tooltip 
                  cursor={{ stroke: '#deff9a', strokeWidth: 1, strokeDasharray: '4 4' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-slate-950/95 border border-slate-800 p-4 rounded-2xl shadow-2xl backdrop-blur-xl border-l-4 border-l-[#deff9a] z-50">
                          <p className="text-[10px] font-black text-slate-400 tracking-wider uppercase mb-1">{item.time.toUpperCase()}</p>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs font-black text-slate-100">Nilai Aset Portofolio:</span>
                              <span className="text-xs font-black text-[#deff9a]">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.value)}
                              </span>
                            </div>
                            {item.volume && (
                              <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
                                <span className="text-[10px] font-bold text-slate-400">Volume Transaksi:</span>
                                <span className="text-[10px] font-mono font-bold text-emerald-400">
                                  {item.volume.toLocaleString('id-ID')} Lots
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {showVolume && (
                  <Bar yAxisId="volume" dataKey="volume" barSize={8} radius={[2, 2, 0, 0]} animationDuration={800}>
                    {dataWithDirection.map((entry, index) => (
                      <Cell key={`vol-val-${index}`} fill={entry.isUp ? '#10b981' : '#f43f5e'} opacity={0.35} />
                    ))}
                  </Bar>
                )}
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="value" 
                  stroke="#deff9a" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValuation)" 
                  animationDuration={1000}
                  dot={{ fill: '#deff9a', stroke: '#020617', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#deff9a', stroke: '#fff', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      )}
      </div>

      {/* Institutional Performance Metrics panel */}
      {subTab === 'comparison' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800/60"
        >
          <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/80 hover:border-slate-700/60 transition-colors flex flex-col gap-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sharpe Ratio</span>
            <span className="text-sm font-black text-slate-100 font-mono">{metrics.sharpe.toFixed(2)}</span>
            <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-tighter">Excellent Risk-Adj</span>
          </div>
          <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/80 hover:border-slate-700/60 transition-colors flex flex-col gap-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Beta vs IHSG</span>
            <span className="text-sm font-black text-slate-100 font-mono">{metrics.beta.toFixed(2)}</span>
            <span className="text-[8px] font-bold text-blue-400 uppercase tracking-tighter">Lower Volatility</span>
          </div>
          <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/80 hover:border-slate-700/60 transition-colors flex flex-col gap-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Tracking Error</span>
            <span className="text-sm font-black text-slate-100 font-mono">{metrics.trackingError.toFixed(2)}%</span>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Controlled Deviation</span>
          </div>
          <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/80 hover:border-slate-700/60 transition-colors flex flex-col gap-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Info Ratio</span>
            <span className="text-sm font-black text-slate-100 font-mono">{metrics.infoRatio.toFixed(2)}</span>
            <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-tighter">High Manager Skill</span>
          </div>
          <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/80 hover:border-slate-700/60 transition-colors flex flex-col gap-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Alpha vs IHSG</span>
            <span className="text-sm font-black text-emerald-400 font-mono">+{metrics.alpha.toFixed(2)}%</span>
            <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter">Excess Return</span>
          </div>
          <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/80 hover:border-slate-700/60 transition-colors flex flex-col gap-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Premium</span>
            <span className="text-sm font-black text-slate-100 font-mono">
              {metrics.outperformance >= 0 ? '+' : ''}{metrics.outperformance.toFixed(2)}%
            </span>
            <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-tighter">Outperforming</span>
          </div>
        </motion.div>
      )}

      {/* Mini Continuous Historic Sequence matching bottom footer of Image 2 */}
      <div className="border-t border-slate-800/80 pt-4 mt-6">
        <div className="flex items-center justify-between text-[8px] text-slate-500 uppercase tracking-widest font-black mb-3">
          <span>Overall Alignment Sequence</span>
          <span>Volatility Accumulation Indicator</span>
        </div>
        
        <div className="h-[45px] w-full opacity-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={percentageData}>
              <defs>
                <linearGradient id="colorValueMini" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DFFF00" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#DFFF00" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="valuePct" 
                stroke="#DFFF00" 
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorValueMini)"
                dot={false}
                animationDuration={800}
              />
              {showBenchmark && (
                <Area 
                  type="monotone" 
                  dataKey="benchmarkPct" 
                  stroke="#3b82f6" 
                  strokeWidth={1}
                  fillOpacity={0}
                  dot={false}
                  animationDuration={800}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex justify-between items-center text-[8px] text-slate-500 font-bold mt-2">
          <span>30% base</span>
          <span>40% mean</span>
          <span>50% target</span>
          <span>60% peak</span>
        </div>
      </div>
    </motion.div>
  );
}
