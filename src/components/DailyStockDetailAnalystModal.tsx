import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  Layers, 
  Target, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  ChartCandlestick, 
  Copy, 
  Check, 
  ExternalLink, 
  DollarSign, 
  Calculator, 
  Info, 
  FileText, 
  Newspaper, 
  Globe, 
  ArrowUpRight, 
  ArrowDownRight,
  Zap,
  BarChart3,
  Sliders,
  Share2
} from 'lucide-react';
import { DailyTradingStock, MaDynamicIndicators, computeMaIndicators, getDynamicAiThesis } from './DailyTradingAutoAnalyst';
import { formatStockPrice, getTradingViewSymbol, getStockInfo } from '../lib/stockUtils';
import { analyzeAssetSwingSupportResistance } from '../lib/swingDetection';
import { VamNativeSRChart } from './VamNativeSRChart';

interface DailyStockDetailAnalystModalProps {
  stock: DailyTradingStock | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenAdvanceChart?: (symbol: string) => void;
  onNavigateToMarket?: (symbol: string) => void;
  onOpenFundamentalAudit?: (symbol: string) => void;
  onOpenExplorer?: (symbol: string) => void;
}

export const DailyStockDetailAnalystModal: React.FC<DailyStockDetailAnalystModalProps> = ({
  stock,
  isOpen,
  onClose,
  onOpenAdvanceChart,
  onNavigateToMarket,
  onOpenFundamentalAudit,
  onOpenExplorer
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PILLARS' | 'SWING_SR' | 'CALCULATOR' | 'AI_NEWS'>('OVERVIEW');
  const [copiedPlan, setCopiedPlan] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Position Sizing Calculator State
  const [tradingCapital, setTradingCapital] = useState<number>(10000000); // default Rp 10 Juta
  const [maxRiskPercent, setMaxRiskPercent] = useState<number>(2); // 2% risk rule

  // Dynamically computed AI thesis memoized before any conditional returns (Rules of Hooks)
  const dynamicAiThesis = useMemo(() => {
    if (!stock) return '';
    return getDynamicAiThesis(stock);
  }, [stock]);

  if (!stock || !isOpen) return null;

  const tradingViewSym = getTradingViewSymbol(stock.symbol);
  const maInd: MaDynamicIndicators = stock.maIndicators || computeMaIndicators(stock.priceNum, stock.market, stock.maEmaCross?.ma10);
  const swingSR = analyzeAssetSwingSupportResistance(stock.symbol, 60, stock.priceNum);

  // Parse numeric values for target & stoploss
  const cleanNumber = (valStr: string): number => {
    const num = parseFloat(valStr.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? stock.priceNum : num;
  };

  // Estimate ARA / LULD / Dynamic Limit % based on Exchange Rules
  const getExchangeLimitInfo = (price: number, market: string) => {
    if (market === 'IDX') {
      let araPct = 25;
      if (price <= 200) araPct = 35;
      else if (price <= 5000) araPct = 25;
      else araPct = 20;
      return {
        type: 'ARA_CAP',
        label: 'Potensi ARA (BEI Rules)',
        badge: `POTENSI ARA +${araPct}%`,
        percent: araPct,
        limitPrice: Math.floor(price * (1 + araPct / 100)),
        limitPriceStr: `Rp ${Math.floor(price * (1 + araPct / 100)).toLocaleString('id-ID')}`
      };
    } else if (market === 'US') {
      const luldPct = price > 100 ? 5 : 10;
      const squeezePct = 15;
      return {
        type: 'LULD_BAND',
        label: 'LULD Volatility Band (Wall Street)',
        badge: `LULD BAND +${luldPct}% / SQUEEZE +${squeezePct}%`,
        percent: squeezePct,
        limitPrice: +(price * (1 + squeezePct / 100)).toFixed(2),
        limitPriceStr: `$${(price * (1 + squeezePct / 100)).toFixed(2)}`
      };
    } else {
      const limitPct = 20;
      return {
        type: 'GLOBAL_LIMIT',
        label: 'Global Dynamic Price Cap',
        badge: `GLOBAL LIMIT +${limitPct}%`,
        percent: limitPct,
        limitPrice: +(price * (1 + limitPct / 100)).toFixed(2),
        limitPriceStr: `$${(price * (1 + limitPct / 100)).toFixed(2)}`
      };
    }
  };

  const exchangeLimit = getExchangeLimitInfo(stock.priceNum, stock.market);
  const araPercent = exchangeLimit.percent;
  const estimatedAraPrice = exchangeLimit.limitPrice;

  const tpPriceNum = cleanNumber(stock.targetPrice);
  const slPriceNum = cleanNumber(stock.stopLoss);

  // Calculation for Position Sizing
  const isIdx = stock.market === 'IDX';
  const lotSize = isIdx ? 100 : 1; // 1 Lot = 100 shares in IDX
  const costPerLot = stock.priceNum * lotSize;
  const maxRiskAmount = (tradingCapital * maxRiskPercent) / 100;
  const riskPerShare = Math.max(0.01, stock.priceNum - slPriceNum);
  const riskPerLot = riskPerShare * lotSize;

  // Max lots based on risk limit or capital
  const maxLotsByRisk = Math.max(1, Math.floor(maxRiskAmount / riskPerLot));
  const maxLotsByCapital = Math.max(1, Math.floor(tradingCapital / costPerLot));
  const recommendedLots = Math.min(maxLotsByRisk, maxLotsByCapital);
  const allocatedCapital = recommendedLots * costPerLot;
  const potentialProfitAtTP = recommendedLots * lotSize * Math.max(0, tpPriceNum - stock.priceNum);
  const potentialProfitAtARA = recommendedLots * lotSize * Math.max(0, estimatedAraPrice - stock.priceNum);
  const potentialLossAtSL = recommendedLots * lotSize * riskPerShare;

  const handleCopyTradingPlan = () => {
    const text = `📊 [VAM DAY TRADING — ${stock.market === 'IDX' ? 'POTENSI ARA BEI' : stock.market === 'US' ? 'WALL STREET MOMENTUM' : 'GLOBAL HUB'} PLAN]
Ticker: ${stock.symbol} (${stock.name})
Pasar: ${stock.market}
Harga Terkini: ${stock.price} (${stock.change})
${exchangeLimit.label}: ${exchangeLimit.limitPriceStr} (+${exchangeLimit.percent}%)

🎯 EKSEKUSI TRADING:
• Entry Zone: ${stock.entryZone}
• Target Profit 1 (TP): ${stock.targetPrice}
• Target Limit/Squeeze (TP 2): ${exchangeLimit.limitPriceStr}
• Stop Loss (SL): ${stock.stopLoss}
• Risk/Reward: ${stock.riskReward}

📈 3 PILAR & DYNAMIC MA:
• Order Book: ${stock.orderBook.bidVolumeRatioStr}
• Volume Surge: ${stock.volRatio}x Rata-rata (${stock.orderBook.volumeVsMa20})
• Momentum: MACD ${stock.momentum.macdStatus} | RSI ${stock.momentum.rsiVal} | BB Breakout: ${stock.momentum.bbBreakout ? 'YES' : 'NO'}
• Bandar/Inst Flow: ${stock.bandarAndFundamentals.topBrokersAccumulation} (${stock.bandarAndFundamentals.brokerNetBuyVal})
• Support Dinamis: MA5 (${maInd.ma5Str}) | MA10 (${maInd.ma10Str})

💡 Thesis Analis AI: "${dynamicAiThesis}"
⚡ VentureAM Institutional Intelligence Core`;

    navigator.clipboard.writeText(text);
    setCopiedPlan(true);
    setTimeout(() => setCopiedPlan(false), 2500);
  };

  const handleCopySummary = () => {
    const text = `[VAM ANALYST DETAIL] ${stock.symbol} (${stock.market}) @ ${stock.price} | Score: ${stock.matchScore}/100 | ${maInd.signalLabel} | R/R: ${stock.riskReward} | Katalis: ${stock.bandarAndFundamentals.catalystDetail}`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-[#0b0e14] border border-zinc-700/80 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white my-auto"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-[#0b0e14] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#deff9a]/20 to-sky-500/10 border border-[#deff9a]/40 flex items-center justify-center shrink-0 shadow-inner">
              <span className="font-mono font-black text-sm text-[#deff9a]">
                {stock.symbol.slice(0, 4)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black font-mono tracking-tight text-white flex items-center gap-1.5">
                  <span>{stock.symbol}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {stock.market}
                  </span>
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-black uppercase bg-[#deff9a] text-black shadow-sm">
                  {stock.matchScore}% VAM MATCH
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase border ${
                  stock.market === 'IDX' 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                    : stock.market === 'US'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                    : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                }`}>
                  {exchangeLimit.badge}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans truncate max-w-md">
                {stock.name} • {stock.tradingViewScreener.sector}
              </p>
            </div>
          </div>

          {/* Top Right Price & Quick Actions */}
          <div className="flex items-center gap-2">
            <div className="text-right mr-1">
              <div className="text-base sm:text-lg font-black font-mono text-white">
                {stock.price}
              </div>
              <div className={`text-xs font-mono font-bold flex items-center justify-end gap-0.5 ${
                stock.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {stock.change.startsWith('+') ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                <span>{stock.change}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="px-4 bg-zinc-950 border-b border-zinc-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 py-2">
          {[
            { id: 'OVERVIEW', label: 'Ringkasan & Taktik', icon: Sparkles },
            { id: 'PILLARS', label: '3 Pilar & MA 5/10 Dinamis', icon: Layers },
            { id: 'SWING_SR', label: 'Swing S/R & Fibonacci', icon: Target },
            { id: 'CALCULATOR', label: 'Kalkulator Lot & Risk', icon: Calculator },
            { id: 'AI_NEWS', label: 'AI News & Katalis', icon: Newspaper },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer border ${
                  isActive
                    ? 'bg-[#deff9a] text-black border-[#deff9a] shadow-sm font-black'
                    : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-[#0b0e14]">
          {/* TAB 1: OVERVIEW & TACTICAL PLAN */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              {/* Tactical Signal Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 relative overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#deff9a]" />
                    <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                      VAM AI Day Trading Execution Plan
                    </h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{maInd.signalLabel}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs mb-3">
                  <div className="bg-black/60 p-3 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block mb-0.5">Zona Beli (Entry)</span>
                    <strong className="text-[#deff9a] text-sm">{stock.entryZone}</strong>
                  </div>
                  <div className="bg-black/60 p-3 rounded-xl border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-400/80 block mb-0.5">Target Profit (TP 1)</span>
                    <strong className="text-emerald-300 text-sm">{stock.targetPrice}</strong>
                  </div>
                  <div className="bg-black/60 p-3 rounded-xl border border-purple-500/30">
                    <span className="text-[10px] text-purple-300 block mb-0.5">Target ARA (TP 2)</span>
                    <strong className="text-purple-300 text-sm">
                      {isIdx ? `IDR ${estimatedAraPrice.toLocaleString('id-ID')}` : `$${estimatedAraPrice}`} (+{araPercent}%)
                    </strong>
                  </div>
                  <div className="bg-black/60 p-3 rounded-xl border border-rose-500/30">
                    <span className="text-[10px] text-rose-400/80 block mb-0.5">Cut Loss (Stop Loss)</span>
                    <strong className="text-rose-400 text-sm">{stock.stopLoss}</strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-zinc-800/80 text-xs font-mono text-zinc-300 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">Risk to Reward Ratio:</span>
                    <strong className="text-emerald-400 font-bold">{stock.riskReward}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">Taktik Eksekusi:</span>
                    <span className="text-white font-semibold">
                      Trailing Stop @ Garis MA 5 ({maInd.ma5Str}) & Partial Profit Taking
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Thesis Rationale */}
              <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono font-bold uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-[#deff9a]" />
                  <span>Thesis Analis AI (VAM Core Engine)</span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed italic border-l-2 border-[#deff9a] pl-3">
                  "{dynamicAiThesis}"
                </p>
              </div>

              {/* 4 Pillars Quick Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-300 font-bold uppercase text-[10px]">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Order Book & Vol</span>
                  </div>
                  <div className="text-white font-bold">{stock.orderBook.bidVolumeRatioStr}</div>
                  <div className="text-[10px] text-zinc-400">Vol Surge: <strong className="text-purple-300">{stock.volRatio}x MA</strong></div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-bold uppercase text-[10px]">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Momentum</span>
                  </div>
                  <div className="text-white font-bold">RSI: {stock.momentum.rsiVal} (Hot)</div>
                  <div className="text-[10px] text-zinc-400">MACD: <strong className="text-emerald-300">{stock.momentum.macdStatus}</strong></div>
                </div>

                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold uppercase text-[10px]">
                    <Target className="w-3.5 h-3.5" />
                    <span>Bandar & Katalis</span>
                  </div>
                  <div className="text-white font-bold">{stock.bandarAndFundamentals.topBrokersAccumulation}</div>
                  <div className="text-[10px] text-amber-300 truncate">{stock.bandarAndFundamentals.brokerNetBuyVal}</div>
                </div>

                <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-500/30 space-y-1">
                  <div className="flex items-center gap-1.5 text-sky-300 font-bold uppercase text-[10px]">
                    <Activity className="w-3.5 h-3.5" />
                    <span>MA 5 & 10 Dinamis</span>
                  </div>
                  <div className="text-white font-bold">Support 1: {maInd.ma5Str}</div>
                  <div className="text-[10px] text-sky-300">{maInd.crossoverLabel}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 3 PILLARS & MA 5/10 DETAIL MATRIX */}
          {activeTab === 'PILLARS' && (
            <div className="space-y-4 font-mono text-xs">
              {/* Pilar 1: Order Book */}
              <div className="p-4 rounded-2xl bg-black/60 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-300 font-bold uppercase">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>Pilar 1: Analisis Order Book & Lonjakan Volume</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold text-[9px] border border-purple-500/40">
                    WALL BUY TERDETEKSI
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Rasio Antrean Beli vs Jual</span>
                    <strong className="text-white text-sm">{stock.orderBook.bidOfferRatio} : 1</strong>
                    <span className="text-[9px] text-purple-300 block mt-0.5">Dinding Beli Lebih Kuat</span>
                  </div>
                  <div className="p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Rasio Volume vs MA 20</span>
                    <strong className="text-[#deff9a] text-sm">{stock.orderBook.volumeVsMa20}</strong>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">Urgensi Beli Masif</span>
                  </div>
                  <div className="p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Rasio Volume vs MA 50</span>
                    <strong className="text-sky-300 text-sm">{stock.orderBook.volumeVsMa50}</strong>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">Breakout Volume Harian</span>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-300 leading-relaxed bg-purple-950/20 p-2.5 rounded-xl border border-purple-500/20">
                  💡 <strong>Tape Reading Insight:</strong> Terdeteksi penumpukan antrean tebal di posisi Bid ({stock.orderBook.bidVolumeRatioStr}) yang menahan koreksi ke bawah. Transaksi didominasi oleh HAKA (Hajar Kanan / Market Buy Orders) agresif.
                </p>
              </div>

              {/* Pilar 2: Momentum & Trend */}
              <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold uppercase">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Pilar 2: Momentum, MACD & Bollinger Breakout</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[9px] border border-emerald-500/40">
                    BULLISH EXPANSION
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">MACD Line & Histogram</span>
                    <strong className="text-emerald-400 text-sm">{stock.momentum.macdStatus}</strong>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">Area Positif Kuat</span>
                  </div>
                  <div className="p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Relative Strength Index (RSI)</span>
                    <strong className="text-amber-300 text-sm">RSI {stock.momentum.rsiVal}</strong>
                    <span className="text-[9px] text-amber-400 block mt-0.5">Hot Momentum Zona</span>
                  </div>
                  <div className="p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Bollinger Upper Band</span>
                    <strong className="text-white text-sm">{stock.momentum.bbUpperBandLevel}</strong>
                    <span className="text-[9px] text-emerald-300 block mt-0.5">
                      {stock.momentum.bbBreakout ? '✓ Breakout Upper Band' : 'Uji Upper Band'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pilar 3: Bandar & Fundamental */}
              <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-300 font-bold uppercase">
                    <Target className="w-4 h-4 text-amber-400" />
                    <span>Pilar 3: Broker Summary & Akumulasi Bandar</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[9px] border border-amber-500/40">
                    SMART MONEY ACCUMULATION
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Top Net Buyer Brokers</span>
                    <strong className="text-white text-sm">{stock.bandarAndFundamentals.topBrokersAccumulation}</strong>
                    <span className="text-[10px] text-amber-300 font-semibold block mt-0.5">
                      {stock.bandarAndFundamentals.brokerNetBuyVal}
                    </span>
                  </div>
                  <div className="p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Katalis Bisnis / IPO</span>
                    <strong className="text-[#deff9a] text-xs leading-snug block">
                      {stock.bandarAndFundamentals.catalystDetail}
                    </strong>
                    {stock.bandarAndFundamentals.ipoOversubscription && (
                      <span className="text-[9px] text-zinc-400 block mt-0.5">
                        {stock.bandarAndFundamentals.ipoOversubscription}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Pilar 4: Indikator MA 5 & 10 Support Dinamis */}
              <div className="p-4 rounded-2xl bg-sky-950/20 border border-sky-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sky-300 font-bold uppercase">
                    <Activity className="w-4 h-4 text-sky-400" />
                    <span>Indikator MA 5 & 10 Support/Resistance Dinamis</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-sky-500/30 text-sky-200 font-bold text-[9px] border border-sky-400/40">
                    {maInd.crossoverLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 bg-zinc-900/90 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Garis MA 5 (Support 1)</span>
                    <strong className="text-sky-300 text-sm">{maInd.ma5Str}</strong>
                  </div>
                  <div className="p-2.5 bg-zinc-900/90 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Garis MA 10 (Support 2)</span>
                    <strong className="text-yellow-300 text-sm">{maInd.ma10Str}</strong>
                  </div>
                  <div className="p-2.5 bg-zinc-900/90 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Zona Pantulan (Bounce)</span>
                    <strong className="text-emerald-300 text-sm">{maInd.supportResistance.bounceZone}</strong>
                  </div>
                  <div className="p-2.5 bg-zinc-900/90 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Resistance Dinamis</span>
                    <strong className="text-rose-300 text-sm">{maInd.supportResistance.dynamicResistance}</strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/40 border border-sky-500/20 flex items-center justify-between text-[10px]">
                  <span className="text-zinc-400">
                    Status Posisi Harga: <strong className="text-white">{maInd.pricePositionLabel}</strong>
                  </span>
                  <span className="text-sky-300 font-bold">
                    Konfirmasi Pantulan: {maInd.supportResistance.bounceStatus}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SWING SUPPORT & RESISTANCE BANDS & FIBONACCI */}
          {activeTab === 'SWING_SR' && (
            <div className="space-y-4 font-mono text-xs">
              {/* Native Interactive Candlestick & S/R Chart */}
              <div className="w-full">
                <VamNativeSRChart symbol={stock.symbol} height={380} overrideCurrentPrice={stock.priceNum} />
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#deff9a] font-bold uppercase">
                    <Target className="w-4 h-4 text-[#deff9a]" />
                    <span>Batas Koridor Swing High / Low (Ceiling & Floor)</span>
                  </div>
                  <span className="text-[9px] bg-black/60 px-2 py-0.5 rounded border border-zinc-700 text-zinc-300">
                    Lookback 60 Bar
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-black/50 rounded-xl border border-rose-500/30">
                    <span className="text-[10px] text-rose-400 block">Major Swing High (Ceiling)</span>
                    <strong className="text-white text-base">{formatStockPrice(swingSR.rangeHigh, stock.symbol)}</strong>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">Tanggal Peak: {swingSR.majorSwingHigh.date}</span>
                  </div>

                  <div className="p-3 bg-black/50 rounded-xl border border-yellow-500/30">
                    <span className="text-[10px] text-yellow-400 block">Equilibrium (Midpoint 50%)</span>
                    <strong className="text-white text-base">
                      {formatStockPrice((swingSR.rangeHigh + swingSR.rangeLow) / 2, stock.symbol)}
                    </strong>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">Posisi: {swingSR.pricePositionInRange}% dari Range</span>
                  </div>

                  <div className="p-3 bg-black/50 rounded-xl border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-400 block">Major Swing Low (Floor)</span>
                    <strong className="text-white text-base">{formatStockPrice(swingSR.rangeLow, stock.symbol)}</strong>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">Tanggal Trough: {swingSR.majorSwingLow.date}</span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-zinc-300 bg-black/40 p-3 rounded-xl border border-zinc-800">
                  <div className="text-[#deff9a] font-bold">🎯 Tactical Bias: {swingSR.activeTacticalBias.replace(/_/g, ' ')}</div>
                  <p className="text-zinc-400 text-[10px]">{swingSR.tacticalSummary}</p>
                </div>
              </div>

              {/* Fibonacci Table */}
              <div className="p-4 rounded-2xl bg-black/60 border border-zinc-800 space-y-2">
                <h5 className="font-bold text-zinc-300 uppercase text-[11px]">
                  Tingkat Retracement Fibonacci (Swing High - Low)
                </h5>
                <div className="space-y-1.5">
                  {swingSR.fibonacciBands.map((fib) => (
                    <div 
                      key={fib.id}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                        fib.tier === 'GOLDEN_POCKET' 
                          ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 font-bold' 
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <span>{fib.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-black">{formatStockPrice(fib.corePrice, stock.symbol)}</span>
                        <span className="text-[10px] text-zinc-400">{fib.distancePct >= 0 ? `+${fib.distancePct}%` : `${fib.distancePct}%`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LOT & POSITION SIZING CALCULATOR */}
          {activeTab === 'CALCULATOR' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#deff9a] font-bold uppercase">
                    <Calculator className="w-4 h-4 text-[#deff9a]" />
                    <span>Kalkulator Lot & Manajemen Risiko Portofolio</span>
                  </div>
                  <span className="text-[10px] bg-black/60 px-2 py-0.5 rounded border border-zinc-700 text-zinc-300">
                    Aturan Risiko {maxRiskPercent}% Modal
                  </span>
                </div>

                {/* Interactive Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-black/60 rounded-xl border border-zinc-800 space-y-1.5">
                    <label className="text-[10px] text-zinc-400 block font-bold uppercase">
                      Modal Trading yang Disiapkan (IDR)
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 font-bold">Rp</span>
                      <input
                        type="number"
                        step={1000000}
                        value={tradingCapital}
                        onChange={(e) => setTradingCapital(Math.max(100000, Number(e.target.value)))}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white font-bold text-sm focus:outline-none focus:border-[#deff9a]"
                      />
                    </div>
                    <div className="flex gap-1 pt-1">
                      {[5000000, 10000000, 25000000, 50000000].map((cap) => (
                        <button
                          key={cap}
                          onClick={() => setTradingCapital(cap)}
                          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[9px] text-zinc-300 cursor-pointer"
                        >
                          Rp {(cap / 1000000)}jt
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-black/60 rounded-xl border border-zinc-800 space-y-1.5">
                    <label className="text-[10px] text-zinc-400 block font-bold uppercase">
                      Batas Toleransi Risiko Kerugian (Max Risk)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={0.5}
                        value={maxRiskPercent}
                        onChange={(e) => setMaxRiskPercent(Number(e.target.value))}
                        className="w-full accent-[#deff9a]"
                      />
                      <span className="font-black text-sm text-[#deff9a] min-w-[40px] text-right">
                        {maxRiskPercent}%
                      </span>
                    </div>
                    <span className="text-[9px] text-zinc-400 block">
                      Maksimal kerugian yang diizinkan per trade: <strong>Rp {Math.round(maxRiskAmount).toLocaleString('id-ID')}</strong>
                    </span>
                  </div>
                </div>

                {/* Calculation Outputs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-black/80 rounded-xl border border-[#deff9a]/40">
                    <span className="text-[10px] text-zinc-400 block">Rekomendasi Beli</span>
                    <strong className="text-[#deff9a] text-base">{recommendedLots} Lot</strong>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">
                      Modal: Rp {Math.round(allocatedCapital).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="p-3 bg-black/80 rounded-xl border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-400 block">Estimasi Profit TP 1</span>
                    <strong className="text-emerald-300 text-base">
                      +Rp {Math.round(potentialProfitAtTP).toLocaleString('id-ID')}
                    </strong>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">Target {stock.targetPrice}</span>
                  </div>

                  <div className="p-3 bg-black/80 rounded-xl border border-purple-500/30">
                    <span className="text-[10px] text-purple-300 block">Estimasi Profit ARA</span>
                    <strong className="text-purple-300 text-base">
                      +Rp {Math.round(potentialProfitAtARA).toLocaleString('id-ID')}
                    </strong>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">Target ARA +{araPercent}%</span>
                  </div>

                  <div className="p-3 bg-black/80 rounded-xl border border-rose-500/30">
                    <span className="text-[10px] text-rose-400 block">Maksimal Risiko SL</span>
                    <strong className="text-rose-400 text-base">
                      -Rp {Math.round(potentialLossAtSL).toLocaleString('id-ID')}
                    </strong>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">Stop Loss {stock.stopLoss}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AI NEWS GROUNDING & CATALYST */}
          {activeTab === 'AI_NEWS' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sky-400 font-bold uppercase">
                    <Globe className="w-4 h-4 text-sky-400" />
                    <span>Google Search AI News Grounding Intelligence</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold text-[9px] border border-sky-500/40">
                    SENTIMENT: {stock.googleNewsSentiment.sentimentStatus}
                  </span>
                </div>

                <div className="p-3.5 bg-black/60 rounded-xl border border-zinc-800 space-y-2">
                  <div className="text-white font-bold text-sm leading-snug">
                    "{stock.googleNewsSentiment.headline}"
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-800">
                    <span>Sumber: <strong className="text-zinc-200">{stock.googleNewsSentiment.source}</strong></span>
                    <span>Skor Akurasi Sentimen: <strong className="text-[#deff9a]">{stock.googleNewsSentiment.score}%</strong></span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-1 text-zinc-300">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                    Katalis Fundamental & Aksi Korporasi:
                  </span>
                  <p className="text-xs leading-relaxed text-[#deff9a] font-semibold">
                    {stock.bandarAndFundamentals.catalystDetail}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Sticky Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyTradingPlan}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                copiedPlan 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}
            >
              {copiedPlan ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPlan ? 'TRADING PLAN DISALIN' : 'SALIN TRADING PLAN'}</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-mono transition-colors cursor-pointer"
            >
              {copiedSummary ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
              <span>{copiedSummary ? 'SUMMARY COPIED' : 'RINGKASAN'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAdvanceChart && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAdvanceChart(tradingViewSym);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500 text-sky-200 hover:text-black border border-sky-500/40 text-xs font-mono font-black uppercase transition-all cursor-pointer shadow-md"
              >
                <ChartCandlestick className="w-4 h-4" />
                <span>Advance Chart</span>
              </button>
            )}

            {(onNavigateToMarket || onOpenFundamentalAudit) && (
              <button
                onClick={() => {
                  onClose();
                  if (onOpenFundamentalAudit) {
                    onOpenFundamentalAudit(stock.symbol);
                  } else if (onNavigateToMarket) {
                    onNavigateToMarket(stock.symbol);
                  }
                  // Dispatch global event as institutional gateway backup
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('vam-quick-research', {
                      detail: { symbol: stock.symbol }
                    }));
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#deff9a] hover:bg-[#cbf770] text-black text-xs font-mono font-black uppercase transition-all cursor-pointer shadow-md"
                title={`Buka Tab Fundamental & Audit untuk ${stock.symbol}`}
              >
                <span>Buka Explorer / Audit</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DailyStockDetailAnalystModal;
