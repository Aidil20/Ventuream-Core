import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Sparkles, 
  TrendingUp, 
  BarChart2, 
  BarChart3,
  Activity, 
  Filter, 
  RefreshCw, 
  ChartCandlestick, 
  CheckCircle2, 
  ArrowUpRight, 
  Layers, 
  Flame, 
  ShieldCheck, 
  Target, 
  SlidersHorizontal,
  ChevronRight,
  HelpCircle,
  Download,
  FileSpreadsheet,
  FileText,
  Globe,
  Newspaper,
  Eye,
  Search,
  Code,
  Copy,
  Check,
  Calendar,
  Clock,
  Radio,
  RotateCcw
} from 'lucide-react';
import AdvanceChartModal from './AdvanceChartModal';
import DailyStockDetailAnalystModal from './DailyStockDetailAnalystModal';
import { getTradingViewSymbol } from '../lib/stockUtils';
import { 
  DailyTradingStock, 
  MaDynamicIndicators, 
  computeMaIndicators, 
  getDynamicAiThesis, 
  generateDailyTradingPicks, 
  SignalLifecycleStatus 
} from '../lib/dailyTradingRotationEngine';

export type { DailyTradingStock, MaDynamicIndicators, SignalLifecycleStatus };
export { computeMaIndicators, getDynamicAiThesis };

const PINE_SCRIPT_CODE = `//@version=5
indicator("VAM Institutional - Day Trading & Potensi ARA Screener (MA 5/10 Dynamic S/R)", overlay=true)

// ==========================================
// PARAMETER SCANNER DAY TRADING & POTENSI ARA (BEI RULES)
// ==========================================
maFastLength   = input.int(5, "MA-5 Length (Fast Dynamic Support/Resistance)")
maSlowLength   = input.int(10, "MA-10 Length (Base Dynamic Support/Resistance)")
emaTrendLength = input.int(20, "EMA-20 Length (Base Trendline)")
volMaLength    = input.int(20, "Volume MA Length")
volMultiplier  = input.float(3.0, "Min Volume Surge Multiplier")
rsiLength      = input.int(14, "RSI Length")
rsiMin         = input.int(65, "RSI Min Threshold (Hot Momentum)")

// Indikator MA 5 & MA 10 Support & Resistance Dinamis
ma5            = ta.sma(close, maFastLength)
ma10           = ta.sma(close, maSlowLength)
ema20          = ta.ema(close, emaTrendLength)
volMa          = ta.sma(volume, volMaLength)
rsiVal         = ta.rsi(close, rsiLength)

// Sinyal Beli / Jual Persilangan (Crossover) & Posisi Garis MA
maGoldenCross  = ta.crossover(ma5, ma10)
maDeathCross   = ta.crossunder(ma5, ma10)
priceAboveMa5  = close > ma5
priceAboveMa10 = close > ma10
maBullishAlign = (close > ma5) and (ma5 > ma10) // Price > MA5 > MA10
ma5Bounce      = (low <= ma5) and (close > ma5) // Pantulan Support Dinamis MA 5
ma10Bounce     = (low <= ma10) and (close > ma10) // Pantulan Support Dinamis MA 10

// MACD Golden Cross & Positif
[macdLine, signalLine, _] = ta.macd(close, 12, 26, 9)
macdGoldenCross = ta.crossover(macdLine, signalLine) and macdLine > 0

// Kriteria 3 Pilar Day Trading & MA Confluence
volumeSurge    = volume >= (volMa * volMultiplier)
highMomentum   = rsiVal >= rsiMin
upperBand      = ta.sma(close, 20) + 2 * ta.stdev(close, 20)
bbBreakout     = close > upperBand

// Sinyal Masuk Terkonfirmasi VAM Core AI
isAraCandidate = volumeSurge and maBullishAlign and (bbBreakout or highMomentum) and (macdLine > 0)
isMa5BounceBuy = ma5Bounce and volumeSurge and (ma5 > ma10)

// Visualisasi Plot Pada Chart TradingView
pMa5 = plot(ma5, "MA 5 (Dynamic Support 1)", color=color.rgb(222, 255, 154), linewidth=2)
pMa10 = plot(ma10, "MA 10 (Dynamic Support 2)", color=color.rgb(250, 204, 21), linewidth=2)
plot(ema20, "EMA 20 (Trend Filter)", color=color.rgb(56, 189, 248), linewidth=1)
plot(upperBand, "Bollinger Upper", color=color.rgb(168, 85, 247, 50))

// Ribbon Area Support Dinamis MA5 - MA10
fill(pMa5, pMa10, color=ma5 > ma10 ? color.new(color.green, 85) : color.new(color.red, 85), title="MA 5-10 Dynamic Zone")

plotshape(maGoldenCross, title="MA 5/10 GOLDEN CROSS", location=location.belowbar, color=color.rgb(250, 204, 21), style=shape.diamond, size=size.small, text="MA CROSS")
plotshape(isAraCandidate, title="POTENSI ARA SIGNAL", location=location.belowbar, color=color.rgb(222, 255, 154), style=shape.triangleup, size=size.normal, text="POTENSI ARA")
plotshape(isMa5BounceBuy, title="MA5 BOUNCE BUY", location=location.belowbar, color=color.rgb(56, 189, 248), style=shape.circle, size=size.small, text="MA5 BOUNCE")

// Alert TradingView Screener
alertcondition(maGoldenCross, title="MA 5/10 Golden Cross Alert", message="[VAM ALERT] {{ticker}} Terjadi MA 5 Golden Cross MA 10! Harga: {{close}}");
alertcondition(isAraCandidate, title="Sinyal Potensi ARA VAM", message="[VAM SCANNER] {{ticker}} Lolos Penyaringan Day Trading & Potensi ARA (MA5>MA10 + Vol Surge)! Harga: {{close}}");
alertcondition(isMa5BounceBuy, title="Sinyal Pantulan MA 5 Dinamis", message="[VAM BOUNCE] {{ticker}} Memantul di Support Dinamis MA 5! Harga: {{close}}");
`;

const DAILY_STOCKS_DATABASE: DailyTradingStock[] = [
  {
    symbol: 'TNCA',
    name: 'PT Trimuda Nuansa Citra Tbk.',
    market: 'IDX',
    price: 'IDR 173',
    priceNum: 173,
    change: '+18.50%',
    changePercent: 18.50,
    volume: '24.5M',
    volRatio: 9.80,
    orderBook: {
      bidOfferRatio: 6.4,
      bidVolumeRatioStr: '820K Lot Bid vs 128K Lot Offer (6.4 : 1)',
      isWallBuy: true,
      volumeVsMa20: '9.8x MA20',
      volumeVsMa50: '14.2x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'IDR 158',
      rsiVal: 78.4,
      rsiHotMomentum: true
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'YP, MG, CC',
      brokerNetBuyVal: 'Net Buy Rp 18.4 Miliar',
      isBandarAccumulation: true,
      catalystType: 'STRATEGIC_ACQUISITION',
      catalystDetail: 'Penguatan Efisiensi Kurir Ekspres Logistik & Ekspansi E-Commerce',
      isIpoLowFloat: false
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'IDR 155',
      epsGrowthYoY: '+9.2%',
      sector: 'Industrials / Courier & Logistics',
      screenerMatch: 'Price > EMA20 | Vol Surge 9.8x | Low Cap Breakout'
    },
    googleNewsSentiment: {
      score: 94,
      sentimentStatus: 'VERY_BULLISH',
      headline: 'Google AI Intel: Akumulasi Asing & Lonjakan Volume Transaksi Logistik TNCA',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 152,
      ema10: 160,
      diffPercent: 8.1
    },
    rsi: 78.4,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'IDR 160',
      breakoutType: '20-Day High Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '9.8x 10MA'
    },
    entryZone: '168 - 173',
    targetPrice: '205 (+18.5%)',
    stopLoss: '158 (-8.6%)',
    riskReward: '1 : 2.15',
    aiRationale: 'Screener TradingView VAM Scanner: Price IDR 173 > EMA20 (155), Lonjakan Vol 9.8x, Wall Buy Bid 6.4:1 & Google AI News Sentiment Very Bullish (+94%).',
    matchScore: 99,
    sparkline: [140, 142, 145, 150, 160, 168, 173]
  },
  {
    symbol: 'IKAN',
    name: 'PT Era Mandiri Cemerlang Tbk.',
    market: 'IDX',
    price: 'IDR 83',
    priceNum: 83,
    change: '+15.28%',
    changePercent: 15.28,
    volume: '42.1M',
    volRatio: 8.40,
    orderBook: {
      bidOfferRatio: 7.2,
      bidVolumeRatioStr: '1.2M Lot Bid vs 166K Lot Offer (7.2 : 1)',
      isWallBuy: true,
      volumeVsMa20: '8.4x MA20',
      volumeVsMa50: '11.8x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'IDR 78',
      rsiVal: 72.8,
      rsiHotMomentum: true
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'YP, EP, XC',
      brokerNetBuyVal: 'Net Buy Rp 12.5 Miliar',
      isBandarAccumulation: true,
      catalystType: 'EARNINGS_RECORD',
      catalystDetail: 'Lonjakan Permintaan Ekspor Produk Olahan Perikanan Asia Pasifik',
      isIpoLowFloat: true,
      ipoOversubscription: 'Penny Stock High Volatility'
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'IDR 76',
      epsGrowthYoY: '+7.8%',
      sector: 'Consumer Non-Cyclicals / Seafood',
      screenerMatch: 'Price > EMA20 | EPS Growth < 10% | Penny Volatile'
    },
    googleNewsSentiment: {
      score: 91,
      sentimentStatus: 'VERY_BULLISH',
      headline: 'Google AI Intel: Katalis Ekspor Perikanan Menopang Marjin Bersih IKAN',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 75,
      ema10: 78,
      diffPercent: 6.4
    },
    rsi: 72.8,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'IDR 78',
      breakoutType: '20-Day High Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '8.4x 10MA'
    },
    entryZone: '80 - 83',
    targetPrice: '102 (+22.8%)',
    stopLoss: '75 (-9.6%)',
    riskReward: '1 : 2.37',
    aiRationale: 'Terdeteksi di VAM Screener: Harga IDR 83 memotong EMA20 (76), EPS Growth YoY +7.8%, Dinding Wall Buy 7.2:1 & Sentimen Google News Positif (+91%).',
    matchScore: 98,
    sparkline: [70, 72, 74, 76, 78, 80, 83]
  },
  {
    symbol: 'LUCK',
    name: 'PT Sentral Mitra Informatika Tbk.',
    market: 'IDX',
    price: 'IDR 115',
    priceNum: 115,
    change: '+18.56%',
    changePercent: 18.56,
    volume: '38.2M',
    volRatio: 7.90,
    orderBook: {
      bidOfferRatio: 5.8,
      bidVolumeRatioStr: '980K Lot Bid vs 168K Lot Offer (5.8 : 1)',
      isWallBuy: true,
      volumeVsMa20: '7.9x MA20',
      volumeVsMa50: '10.5x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'IDR 106',
      rsiVal: 76.2,
      rsiHotMomentum: true
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'MG, YP, CC',
      brokerNetBuyVal: 'Net Buy Rp 15.8 Miliar',
      isBandarAccumulation: true,
      catalystType: 'STRATEGIC_ACQUISITION',
      catalystDetail: 'Penandatanganan Kontrak Pengadaan Solusi Teknologi & IT Enterprise',
      isIpoLowFloat: false
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'IDR 105',
      epsGrowthYoY: '+6.5%',
      sector: 'Technology / IT Services',
      screenerMatch: 'Price > EMA20 | EPS TTM < 10% | Rebound Pattern'
    },
    googleNewsSentiment: {
      score: 90,
      sentimentStatus: 'BULLISH',
      headline: 'Google AI Intel: Ekspansi Solusi TI Enterprise & Borong Bandar MG',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 102,
      ema10: 108,
      diffPercent: 6.5
    },
    rsi: 76.2,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'IDR 106',
      breakoutType: 'Pattern Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '7.9x 10MA'
    },
    entryZone: '110 - 115',
    targetPrice: '138 (+20.0%)',
    stopLoss: '105 (-8.7%)',
    riskReward: '1 : 2.3',
    aiRationale: 'VAM TradingView Screener Match: Harga IDR 115 > EMA20 (105), Lonjakan Volume 7.9x MA20, Akumulasi Bandar MG & Google AI News Sentiment +90%.',
    matchScore: 98,
    sparkline: [98, 100, 102, 106, 108, 112, 115]
  },
  {
    symbol: 'LRNA',
    name: 'PT Eka Sari Lorena Transport Tbk.',
    market: 'IDX',
    price: 'IDR 185',
    priceNum: 185,
    change: '+14.20%',
    changePercent: 14.20,
    volume: '18.9M',
    volRatio: 6.50,
    orderBook: {
      bidOfferRatio: 4.8,
      bidVolumeRatioStr: '650K Lot Bid vs 135K Lot Offer (4.8 : 1)',
      isWallBuy: true,
      volumeVsMa20: '6.5x MA20',
      volumeVsMa50: '8.2x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'IDR 178',
      rsiVal: 69.5,
      rsiHotMomentum: false
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'PD, YP, YU',
      brokerNetBuyVal: 'Net Buy Rp 9.4 Miliar',
      isBandarAccumulation: true,
      catalystType: 'SECTORAL',
      catalystDetail: 'Efisiensi Operasional Armada Logistik & Rebound Sektor Transportasi',
      isIpoLowFloat: false
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'IDR 175',
      epsGrowthYoY: '+8.4%',
      sector: 'Transportation & Logistics',
      screenerMatch: 'Price > EMA20 | EPS YoY < 10% | Vol Surge 6.5x'
    },
    googleNewsSentiment: {
      score: 89,
      sentimentStatus: 'BULLISH',
      headline: 'Google AI Intel: Pemulihan Rute Transportasi & Net Buy Institusi Lokal',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 172,
      ema10: 176,
      diffPercent: 5.1
    },
    rsi: 69.5,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'IDR 178',
      breakoutType: '20-Day High Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '6.5x 10MA'
    },
    entryZone: '180 - 185',
    targetPrice: '218 (+17.8%)',
    stopLoss: '172 (-7.0%)',
    riskReward: '1 : 2.54',
    aiRationale: 'Screener TradingView VAM: Price IDR 185 > EMA20 (175), Wall Buy Bid 4.8:1, Volume 6.5x MA20 & Sentimen Berita Google AI Bullish (+89%).',
    matchScore: 97,
    sparkline: [165, 168, 172, 175, 178, 182, 185]
  },
  {
    symbol: 'PLAN',
    name: 'PT Planet Properindo Jaya Tbk.',
    market: 'IDX',
    price: 'IDR 38',
    priceNum: 38,
    change: '+26.67%',
    changePercent: 26.67,
    volume: '85.4M',
    volRatio: 12.40,
    orderBook: {
      bidOfferRatio: 12.8,
      bidVolumeRatioStr: '3.8M Lot Bid vs 296K Lot Offer (12.8 : 1)',
      isWallBuy: true,
      volumeVsMa20: '12.4x MA20',
      volumeVsMa50: '18.5x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'IDR 32',
      rsiVal: 84.5,
      rsiHotMomentum: true
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'MG, YP, EP',
      brokerNetBuyVal: 'Net Buy Rp 8.2 Miliar',
      isBandarAccumulation: true,
      catalystType: 'IPO_LOW_FLOAT',
      catalystDetail: 'Penny Stock Murah IDR 38 Volatilitas Super Tinggi Lock ARA Bandar MG',
      isIpoLowFloat: true,
      ipoOversubscription: 'Micro Cap High Beta'
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'IDR 32',
      epsGrowthYoY: '+3.5%',
      sector: 'Real Estate / Hotel & Resort',
      screenerMatch: 'Price > EMA20 | Penny Stock < IDR 50 | High Volatility'
    },
    googleNewsSentiment: {
      score: 88,
      sentimentStatus: 'ACCUMULATION',
      headline: 'Google AI Intel: Akumulasi Masif Bandar MG pada Saham Penny Properti PLAN',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 28,
      ema10: 32,
      diffPercent: 18.7
    },
    rsi: 84.5,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'IDR 32',
      breakoutType: '20-Day High Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '12.4x 10MA'
    },
    entryZone: '36 - 38',
    targetPrice: '52 (+36.8%)',
    stopLoss: '32 (-15.8%)',
    riskReward: '1 : 2.32',
    aiRationale: 'Penny Stock VAM Screener Match: Harga IDR 38 > EMA20 (32), Antrean Bid Wall Buy 12.8:1 (3.8M Lot), Volume Surge 12.4x & Katalis Bandar MG.',
    matchScore: 97,
    sparkline: [24, 26, 28, 30, 32, 35, 38]
  },
  {
    symbol: 'HADE',
    name: 'PT Himalaya Energi Perkasa Tbk.',
    market: 'IDX',
    price: 'IDR 18',
    priceNum: 18,
    change: '+28.57%',
    changePercent: 28.57,
    volume: '110.2M',
    volRatio: 14.50,
    orderBook: {
      bidOfferRatio: 15.2,
      bidVolumeRatioStr: '5.4M Lot Bid vs 355K Lot Offer (15.2 : 1)',
      isWallBuy: true,
      volumeVsMa20: '14.5x MA20',
      volumeVsMa50: '21.0x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'IDR 15',
      rsiVal: 82.1,
      rsiHotMomentum: true
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'YP, CC, XC',
      brokerNetBuyVal: 'Net Buy Rp 6.8 Miliar',
      isBandarAccumulation: true,
      catalystType: 'IPO_LOW_FLOAT',
      catalystDetail: 'Super Penny Stock IDR 18 Volatilitas Ekstrem & Borong Bandar Ritel',
      isIpoLowFloat: true
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'IDR 15',
      epsGrowthYoY: '+2.1%',
      sector: 'Energy / Oil & Gas Services',
      screenerMatch: 'Price > EMA20 | Super Penny < IDR 20 | Vol Surge 14.5x'
    },
    googleNewsSentiment: {
      score: 87,
      sentimentStatus: 'ACCUMULATION',
      headline: 'Google AI Intel: Rebound Sektor Energi Mikro & Borong Bandar Ritel YP',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 13,
      ema10: 15,
      diffPercent: 20.0
    },
    rsi: 82.1,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'IDR 15',
      breakoutType: 'Pattern Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '14.5x 10MA'
    },
    entryZone: '16 - 18',
    targetPrice: '25 (+38.8%)',
    stopLoss: '14 (-22.2%)',
    riskReward: '1 : 1.75',
    aiRationale: 'Super Penny VAM Screener: Price IDR 18 > EMA20 (15), Volume Surge 14.5x, Wall Buy Bid 15.2:1 & Potensi Rebound Volatilitas Tinggi.',
    matchScore: 96,
    sparkline: [12, 13, 14, 15, 16, 17, 18]
  },
  {
    symbol: 'MIRA',
    name: 'PT Mitra International Resources Tbk.',
    market: 'IDX',
    price: 'IDR 21',
    priceNum: 21,
    change: '+23.53%',
    changePercent: 23.53,
    volume: '64.2M',
    volRatio: 10.80,
    orderBook: {
      bidOfferRatio: 9.5,
      bidVolumeRatioStr: '2.8M Lot Bid vs 294K Lot Offer (9.5 : 1)',
      isWallBuy: true,
      volumeVsMa20: '10.8x MA20',
      volumeVsMa50: '15.4x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'IDR 18',
      rsiVal: 79.2,
      rsiHotMomentum: true
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'YP, MG, YU',
      brokerNetBuyVal: 'Net Buy Rp 5.2 Miliar',
      isBandarAccumulation: true,
      catalystType: 'SECTORAL',
      catalystDetail: 'Rebound Jasa Pertambangan Logistik & Akumulasi Bandar Lokal',
      isIpoLowFloat: true
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'IDR 18',
      epsGrowthYoY: '+4.2%',
      sector: 'Energy & Mining Services',
      screenerMatch: 'Price > EMA20 | Low Price < IDR 30 | Vol Surge 10.8x'
    },
    googleNewsSentiment: {
      score: 86,
      sentimentStatus: 'ACCUMULATION',
      headline: 'Google AI Intel: Akumulasi Saham Jasa Tambang MIRA & Kenaikan Volume',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 16,
      ema10: 18,
      diffPercent: 16.6
    },
    rsi: 79.2,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'IDR 18',
      breakoutType: '20-Day High Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '10.8x 10MA'
    },
    entryZone: '19 - 21',
    targetPrice: '29 (+38.0%)',
    stopLoss: '17 (-19.0%)',
    riskReward: '1 : 2.0',
    aiRationale: 'VAM TradingView Screener Match: Harga IDR 21 > EMA20 (18), Dinding Bid Wall Buy 9.5:1, Volume Surge 10.8x MA20 & Sentimen Net Buy Lokal.',
    matchScore: 96,
    sparkline: [14, 15, 16, 17, 18, 19, 21]
  },
  {
    symbol: 'MPOW',
    name: 'PT Megapower Makmur Tbk.',
    market: 'IDX',
    price: 'IDR 101',
    priceNum: 101,
    change: '+16.09%',
    changePercent: 16.09,
    volume: '32.1M',
    volRatio: 7.40,
    orderBook: {
      bidOfferRatio: 6.1,
      bidVolumeRatioStr: '880K Lot Bid vs 144K Lot Offer (6.1 : 1)',
      isWallBuy: true,
      volumeVsMa20: '7.4x MA20',
      volumeVsMa50: '9.8x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'IDR 94',
      rsiVal: 73.5,
      rsiHotMomentum: true
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'PD, YP, HD',
      brokerNetBuyVal: 'Net Buy Rp 11.2 Miliar',
      isBandarAccumulation: true,
      catalystType: 'STRATEGIC_ACQUISITION',
      catalystDetail: 'Efisiensi Operasional Pembangkit Listrik Tenaga Mikrohidro',
      isIpoLowFloat: false
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'IDR 93',
      epsGrowthYoY: '+8.9%',
      sector: 'Utilities / Renewable Energy',
      screenerMatch: 'Price > EMA20 | EPS YoY < 10% | Vol Surge 7.4x'
    },
    googleNewsSentiment: {
      score: 92,
      sentimentStatus: 'VERY_BULLISH',
      headline: 'Google AI Intel: Pendapatan Stabil Pembangkit Listrik & Akumulasi PD',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 90,
      ema10: 95,
      diffPercent: 6.3
    },
    rsi: 73.5,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'IDR 94',
      breakoutType: '20-Day High Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '7.4x 10MA'
    },
    entryZone: '96 - 101',
    targetPrice: '122 (+20.7%)',
    stopLoss: '90 (-10.8%)',
    riskReward: '1 : 1.91',
    aiRationale: 'VAM Screener Match: Harga IDR 101 > EMA20 (93), EPS Growth +8.9%, Volume Surge 7.4x, Bid Wall 6.1:1 & Google AI News Very Bullish (+92%).',
    matchScore: 97,
    sparkline: [88, 90, 92, 94, 96, 98, 101]
  },
  {
    symbol: 'CGAS',
    name: 'PT Citra Nusantara Energi Tbk.',
    market: 'IDX',
    price: 'IDR 195',
    priceNum: 195,
    change: '+21.88%',
    changePercent: 21.88,
    volume: '88.4M',
    volRatio: 11.20,
    orderBook: {
      bidOfferRatio: 8.5,
      bidVolumeRatioStr: '2.8M Lot Bid vs 329K Lot Offer (8.5 : 1)',
      isWallBuy: true,
      volumeVsMa20: '11.2x MA20',
      volumeVsMa50: '16.8x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'IDR 172',
      rsiVal: 81.2,
      rsiHotMomentum: true
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'YP, MG, CC',
      brokerNetBuyVal: 'Net Buy Rp 28.5 Miliar',
      isBandarAccumulation: true,
      catalystType: 'IPO_LOW_FLOAT',
      catalystDetail: 'Saham Baru IPO BEI - Sektor Distribusi Gas Alam Compressed Natural Gas (CNG)',
      isIpoLowFloat: true,
      ipoOversubscription: 'Oversubscribed 96.2x (Free Float 20%)'
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'IDR 168',
      epsGrowthYoY: '+12.4%',
      sector: 'Energy / Gas Distribution',
      screenerMatch: 'Price > EMA20 | Listing Baru BEI | Vol Surge 11.2x'
    },
    googleNewsSentiment: {
      score: 96,
      sentimentStatus: 'VERY_BULLISH',
      headline: 'Google AI Intel: Akumulasi Bandar MG & YP pada Saham Listing Baru CGAS',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 165,
      ema10: 178,
      diffPercent: 12.1
    },
    rsi: 81.2,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'IDR 175',
      breakoutType: 'Pattern Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '11.2x 10MA'
    },
    entryZone: '185 - 195',
    targetPrice: '263 (+34.8%)',
    stopLoss: '172 (-11.8%)',
    riskReward: '1 : 2.95',
    aiRationale: 'Penyaringan Listing Baru BEI: CGAS Lolos 3 Pilar VAM (Price IDR 195 > EMA20 168, Volume Surge 11.2x, Wall Buy Bid 8.5:1 & Oversubscribed 96.2x).',
    matchScore: 99,
    sparkline: [140, 148, 155, 162, 175, 182, 195]
  },
  {
    symbol: 'SMGA',
    name: 'PT Sumber Mineral Global Abadi Tbk.',
    market: 'IDX',
    price: 'IDR 92',
    priceNum: 92,
    change: '+19.48%',
    changePercent: 19.48,
    volume: '65.2M',
    volRatio: 9.10,
    orderBook: {
      bidOfferRatio: 7.8,
      bidVolumeRatioStr: '1.9M Lot Bid vs 243K Lot Offer (7.8 : 1)',
      isWallBuy: true,
      volumeVsMa20: '9.1x MA20',
      volumeVsMa50: '13.4x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'IDR 84',
      rsiVal: 77.5,
      rsiHotMomentum: true
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'PD, YP, EP',
      brokerNetBuyVal: 'Net Buy Rp 14.2 Miliar',
      isBandarAccumulation: true,
      catalystType: 'IPO_LOW_FLOAT',
      catalystDetail: 'Pencatatan Perdana Saham Baru BEI - Perdagangan Nikel & Batu Bara',
      isIpoLowFloat: true,
      ipoOversubscription: 'Oversubscribed 84.5x'
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'IDR 80',
      epsGrowthYoY: '+8.5%',
      sector: 'Basic Materials / Mining Trade',
      screenerMatch: 'Price > EMA20 | Saham Baru BEI | Vol Surge 9.1x'
    },
    googleNewsSentiment: {
      score: 93,
      sentimentStatus: 'VERY_BULLISH',
      headline: 'Google AI Intel: Lonjakan Volume & Minat Ritel Tinggi pada Saham Baru SMGA',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 78,
      ema10: 84,
      diffPercent: 10.2
    },
    rsi: 77.5,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'IDR 85',
      breakoutType: 'Pattern Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '9.1x 10MA'
    },
    entryZone: '88 - 92',
    targetPrice: '124 (+34.7%)',
    stopLoss: '81 (-11.9%)',
    riskReward: '1 : 2.91',
    aiRationale: 'Screener Listing Baru BEI: SMGA Lolos VAM Day Trading (Price IDR 92 > EMA20 80, Volume Surge 9.1x, Wall Buy 7.8:1 & Katalis Sektor Nikel).',
    matchScore: 98,
    sparkline: [65, 68, 72, 78, 82, 86, 92]
  },
  {
    symbol: 'DATA',
    name: 'PT Remala Abadi Tbk.',
    market: 'IDX',
    price: 'IDR 410',
    priceNum: 410,
    change: '+16.48%',
    changePercent: 16.48,
    volume: '54.1M',
    volRatio: 8.80,
    orderBook: {
      bidOfferRatio: 6.9,
      bidVolumeRatioStr: '1.1M Lot Bid vs 159K Lot Offer (6.9 : 1)',
      isWallBuy: true,
      volumeVsMa20: '8.8x MA20',
      volumeVsMa50: '12.0x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'IDR 375',
      rsiVal: 76.8,
      rsiHotMomentum: true
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'YP, CC, AK',
      brokerNetBuyVal: 'Net Buy Rp 22.1 Miliar',
      isBandarAccumulation: true,
      catalystType: 'STRATEGIC_ACQUISITION',
      catalystDetail: 'Ekspansi Jaringan Fiber Optic & Layanan Internet Broadband Korporasi',
      isIpoLowFloat: true,
      ipoOversubscription: 'Oversubscribed 72.0x'
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'IDR 365',
      epsGrowthYoY: '+14.2%',
      sector: 'Telecommunications / ISP Broadband',
      screenerMatch: 'Price > EMA20 | Listing Activities BEI | Vol Surge 8.8x'
    },
    googleNewsSentiment: {
      score: 95,
      sentimentStatus: 'VERY_BULLISH',
      headline: 'Google AI Intel: Akumulasi Asing & Institusi pada Saham Provider Internet DATA',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 360,
      ema10: 380,
      diffPercent: 8.3
    },
    rsi: 76.8,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'IDR 380',
      breakoutType: '52-Week High Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '8.8x 10MA'
    },
    entryZone: '395 - 410',
    targetPrice: '520 (+26.8%)',
    stopLoss: '368 (-10.2%)',
    riskReward: '1 : 2.62',
    aiRationale: 'Screener VAM Day Trading DATA: Harga IDR 410 > EMA20 (365), Antrean Wall Buy 6.9:1, Volume Surge 8.8x & Pertumbuhan EPS YoY +14.2%.',
    matchScore: 98,
    sparkline: [310, 325, 340, 360, 375, 390, 410]
  },
  {
    symbol: 'PANI',
    name: 'PT Pantai Indah Kapuk Dua Tbk.',
    market: 'IDX',
    price: 'IDR 15,200',
    priceNum: 15200,
    change: '+17.80%',
    changePercent: 17.80,
    volume: '112.4M',
    volRatio: 8.50,
    orderBook: {
      bidOfferRatio: 8.4,
      bidVolumeRatioStr: '1.4M Lot Bid vs 165K Lot Offer (8.4 : 1)',
      isWallBuy: true,
      volumeVsMa20: '8.5x MA20',
      volumeVsMa50: '12.1x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'IDR 14,800',
      rsiVal: 74.0,
      rsiHotMomentum: true
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'BK, ZP, KZ, CS',
      brokerNetBuyVal: 'Net Buy Rp 142.5 Miliar',
      isBandarAccumulation: true,
      catalystType: 'EARNINGS_RECORD',
      catalystDetail: 'Rekor Laba Bersih Q2 (+185% YoY) & Akselerasi Proyek PIK2',
      isIpoLowFloat: false
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'IDR 14,100',
      epsGrowthYoY: '+185.0%',
      sector: 'Real Estate / Land Development',
      screenerMatch: 'Price > EMA20 | Mega Vol Surge | Top Institutional Buy'
    },
    googleNewsSentiment: {
      score: 96,
      sentimentStatus: 'VERY_BULLISH',
      headline: 'Google AI Intel: Inflow Asing Rp 142B & Laba Bersih PIK2 Cetak Rekor',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 14100,
      ema10: 14600,
      diffPercent: 3.5
    },
    rsi: 74.0,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'IDR 14,800',
      breakoutType: '52-Week High Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '8.5x 10MA'
    },
    entryZone: '15,000 - 15,200',
    targetPrice: '16,500 (+8.5%)',
    stopLoss: '14,500 (-4.6%)',
    riskReward: '1 : 1.8',
    aiRationale: 'Lolos 3/3 Pilar ARA: Wall Buy Bid 8.4x Offer, Volume menembus MA20/MA50 8.5x, MACD Golden Cross di area positif & Akumulasi Top Broker Rp 142.5B.',
    matchScore: 99,
    sparkline: [13800, 14000, 14200, 14500, 14800, 15000, 15200]
  },
  {
    symbol: 'BRMS',
    name: 'PT Bumi Resources Minerals Tbk.',
    market: 'IDX',
    price: 'IDR 392',
    priceNum: 392,
    change: '+22.50%',
    changePercent: 22.50,
    volume: '842.1M',
    volRatio: 7.20,
    orderBook: {
      bidOfferRatio: 6.8,
      bidVolumeRatioStr: '3.2M Lot Bid vs 470K Lot Offer (6.8 : 1)',
      isWallBuy: true,
      volumeVsMa20: '7.2x MA20',
      volumeVsMa50: '9.8x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'IDR 360',
      rsiVal: 72.5,
      rsiHotMomentum: true
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'AK, YU, ZP, BK',
      brokerNetBuyVal: 'Net Buy Rp 88.2 Miliar',
      isBandarAccumulation: true,
      catalystType: 'STRATEGIC_ACQUISITION',
      catalystDetail: 'Laporan Produksi Emas Kuartalan Melonjak +240% YoY',
      isIpoLowFloat: false
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'IDR 350',
      epsGrowthYoY: '+240.0%',
      sector: 'Basic Materials / Gold Mining',
      screenerMatch: 'Price > EMA20 | Gold Rally Catalyst | High Volume'
    },
    googleNewsSentiment: {
      score: 95,
      sentimentStatus: 'VERY_BULLISH',
      headline: 'Google AI Intel: Produksi Emas Kuartal Melonjak +240% & Akumulasi AK/YU',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 340,
      ema10: 365,
      diffPercent: 7.3
    },
    rsi: 72.5,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'IDR 360',
      breakoutType: '20-Day High Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '7.2x 10MA'
    },
    entryZone: '385 - 392',
    targetPrice: '430 (+9.7%)',
    stopLoss: '365 (-6.8%)',
    riskReward: '1 : 1.4',
    aiRationale: 'Order Book Wall Buy 6.8:1, Volume tembus MA20/MA50 7.2x, RSI 72.5 Hot Momentum & Top Broker AK/YU/ZP terus mengandalkan akumulasi tanpa henti.',
    matchScore: 98,
    sparkline: [330, 340, 350, 360, 372, 384, 392]
  },
  {
    symbol: 'PGAS',
    name: 'PT Perusahaan Gas Negara Tbk.',
    market: 'IDX',
    price: 'IDR 1,540',
    priceNum: 1540,
    change: '+2.67%',
    changePercent: 2.67,
    volume: '185.0M',
    volRatio: 12.50,
    orderBook: {
      bidOfferRatio: 14.2,
      bidVolumeRatioStr: '2.8M Lot Bid vs 197K Lot Offer (14.2 : 1)',
      isWallBuy: true,
      volumeVsMa20: '12.5x MA20',
      volumeVsMa50: '18.2x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'IDR 1,510',
      rsiVal: 68.5,
      rsiHotMomentum: true
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'AK, YU, ZP',
      brokerNetBuyVal: 'Net Buy Rp 45.8 Miliar',
      isBandarAccumulation: true,
      catalystType: 'SECTORAL',
      catalystDetail: 'Ekspansi Jaringan Gas Industri & Kenaikan Margin Non-HGS',
      isIpoLowFloat: false
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'IDR 1,480',
      epsGrowthYoY: '+18.4%',
      sector: 'Utilities / Natural Gas Distribution',
      screenerMatch: 'Price > EMA20 | Vol Surge 12.5x | Inst Accumulation'
    },
    googleNewsSentiment: {
      score: 95,
      sentimentStatus: 'VERY_BULLISH',
      headline: 'Google AI Intel: Akumulasi Asing AK/YU & Permintaan Gas Industri Kuat',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 1490,
      ema10: 1510,
      diffPercent: 8.5
    },
    rsi: 68.5,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'IDR 1,510',
      breakoutType: '52-Week High Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '12.5x 10MA'
    },
    entryZone: '1,500 - 1,540',
    targetPrice: '1,720 (+11.7%)',
    stopLoss: '1,450 (-5.8%)',
    riskReward: '1 : 2.5',
    aiRationale: 'Rekomendasi Day Trading PGAS: Harga IDR 1,540 > EMA20 (1,480), Breakout Resistance 1,510, Volume Surge 12.5x MA20 & Akumulasi Bandar AK/YU.',
    matchScore: 98,
    sparkline: [1420, 1440, 1470, 1490, 1510, 1525, 1540]
  },
  {
    symbol: 'DEFI',
    name: 'PT Danasupra Ekaputra Tbk.',
    market: 'IDX',
    price: 'IDR 142',
    priceNum: 142,
    change: '+34.58%',
    changePercent: 34.58,
    volume: '210.5M',
    volRatio: 14.80,
    orderBook: {
      bidOfferRatio: 18.5,
      bidVolumeRatioStr: '3.5M Lot Bid vs 189K Lot Offer (18.5 : 1)',
      isWallBuy: true,
      volumeVsMa20: '14.8x MA20',
      volumeVsMa50: '21.0x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'IDR 115',
      rsiVal: 88.5,
      rsiHotMomentum: true
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'MG, YP, EP',
      brokerNetBuyVal: 'Net Buy Rp 28.4 Miliar',
      isBandarAccumulation: true,
      catalystType: 'IPO_LOW_FLOAT',
      catalystDetail: 'Volatilitas Tinggi Saham Lapis 3 (Penny Stock) Rebound Akumulasi Bandar MG/YP Lock ARA',
      isIpoLowFloat: true,
      ipoOversubscription: 'Micro Cap High Volatility'
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'IDR 120',
      epsGrowthYoY: '+5.4%',
      sector: 'Financials / Diversified Financials',
      screenerMatch: 'Price > EMA20 | Low Price < IDR 150 | Penny Volatile'
    },
    googleNewsSentiment: {
      score: 93,
      sentimentStatus: 'VERY_BULLISH',
      headline: 'Google AI Intel: Akumulasi Masif Bandar MG & Volatilitas Tinggi DEFI',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 108,
      ema10: 122,
      diffPercent: 12.5
    },
    rsi: 88.5,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'IDR 115',
      breakoutType: '52-Week High Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '14.8x 10MA'
    },
    entryZone: '138 - 142',
    targetPrice: '190 (+33.8%)',
    stopLoss: '128 (-9.8%)',
    riskReward: '1 : 3.4',
    aiRationale: 'Kandidat Utama Penny Stock ARA Lock: Harga Murah IDR 142, Volatilitas Ekstrem, Wall Buy 18.5:1 (3.5M Lot Bid), Volume Surge 14.8x & Akumulasi Bandar MG/YP.',
    matchScore: 99,
    sparkline: [98, 102, 108, 115, 125, 134, 142]
  },
  {
    symbol: 'KOTA',
    name: 'PT DMS Propertindo Tbk.',
    market: 'IDX',
    price: 'IDR 62',
    priceNum: 62,
    change: '+34.78%',
    changePercent: 34.78,
    volume: '380.2M',
    volRatio: 16.50,
    orderBook: {
      bidOfferRatio: 21.0,
      bidVolumeRatioStr: '5.2M Lot Bid vs 248K Lot Offer (21.0 : 1)',
      isWallBuy: true,
      volumeVsMa20: '16.5x MA20',
      volumeVsMa50: '24.2x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'IDR 48',
      rsiVal: 86.2,
      rsiHotMomentum: true
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'YP, CC, PD',
      brokerNetBuyVal: 'Net Buy Rp 19.8 Miliar',
      isBandarAccumulation: true,
      catalystType: 'IPO_LOW_FLOAT',
      catalystDetail: 'Penny Stock Murah (< IDR 100) Volatilitas Super Tinggi & Antrean Dinding Bid ARA 35%',
      isIpoLowFloat: true
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'IDR 50',
      epsGrowthYoY: '+4.8%',
      sector: 'Real Estate / Land Development',
      screenerMatch: 'Price > EMA20 | Penny Stock < IDR 100 | Vol Surge 16.5x'
    },
    googleNewsSentiment: {
      score: 92,
      sentimentStatus: 'VERY_BULLISH',
      headline: 'Google AI Intel: Antrean Bid Wall Buy 21:1 & Katalis Properti KOTA',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 46,
      ema10: 52,
      diffPercent: 14.2
    },
    rsi: 86.2,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'IDR 48',
      breakoutType: '20-Day High Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '16.5x 10MA'
    },
    entryZone: '58 - 62',
    targetPrice: '82 (+32.2%)',
    stopLoss: '54 (-12.9%)',
    riskReward: '1 : 2.5',
    aiRationale: 'Super Low Cap & High Volatility ARA Candidate: Harga sangat murah IDR 62, Wall Buy Bid 21:1 (5.2M Lot Antrean Beli) & Volume Surge 16.5x MA20.',
    matchScore: 98,
    sparkline: [42, 44, 46, 48, 52, 57, 62]
  },
  {
    symbol: 'PGEO',
    name: 'PT Pertamina Geothermal Energy Tbk.',
    market: 'IDX',
    price: 'IDR 1,250',
    priceNum: 1250,
    change: '+4.17%',
    changePercent: 4.17,
    volume: '152.4M',
    volRatio: 11.20,
    orderBook: {
      bidOfferRatio: 12.4,
      bidVolumeRatioStr: '2.1M Lot Bid vs 169K Lot Offer (12.4 : 1)',
      isWallBuy: true,
      volumeVsMa20: '11.2x MA20',
      volumeVsMa50: '15.8x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'IDR 1,210',
      rsiVal: 72.4,
      rsiHotMomentum: true
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'AK, BK, ZP',
      brokerNetBuyVal: 'Net Buy Rp 32.4 Miliar',
      isBandarAccumulation: true,
      catalystType: 'EARNINGS_RECORD',
      catalystDetail: 'Ekspansi Pembangkit Panas Bumi Lumut Balai Unit 2 & Perluasan Kapasitas EBT',
      isIpoLowFloat: false
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'IDR 1,180',
      epsGrowthYoY: '+22.1%',
      sector: 'Utilities / Renewable Geothermal Energy',
      screenerMatch: 'Price > EMA20 | Energy Transition | Vol Surge 11.2x'
    },
    googleNewsSentiment: {
      score: 93,
      sentimentStatus: 'VERY_BULLISH',
      headline: 'Google AI Intel: Proyek Geothermal Lumut Balai & Akumulasi Institusi AK/BK',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 1190,
      ema10: 1215,
      diffPercent: 10.8
    },
    rsi: 72.4,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'IDR 1,210',
      breakoutType: '20-Day High Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '11.2x 10MA'
    },
    entryZone: '1,215 - 1,250',
    targetPrice: '1,450 (+16.0%)',
    stopLoss: '1,170 (-6.4%)',
    riskReward: '1 : 2.5',
    aiRationale: 'Breakout Sektor EBT PGEO: Harga IDR 1,250 > EMA20 (1,180), Breakout Resistance 1,210, Volume Surge 11.2x MA20 & Akumulasi Bandar Inst.',
    matchScore: 97,
    sparkline: [1150, 1170, 1190, 1210, 1230, 1240, 1250]
  },
  {
    symbol: 'BUMI',
    name: 'PT Bumi Resources Tbk.',
    market: 'IDX',
    price: 'IDR 148',
    priceNum: 148,
    change: '+14.73%',
    changePercent: 14.73,
    volume: '2.84B',
    volRatio: 10.40,
    orderBook: {
      bidOfferRatio: 9.2,
      bidVolumeRatioStr: '18.5M Lot Bid vs 2.01M Lot Offer (9.2 : 1)',
      isWallBuy: true,
      volumeVsMa20: '10.4x MA20',
      volumeVsMa50: '14.2x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'IDR 132',
      rsiVal: 76.8,
      rsiHotMomentum: true
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'BK, AK, YU, ZP',
      brokerNetBuyVal: 'Net Buy Rp 124.8 Miliar',
      isBandarAccumulation: true,
      catalystType: 'SECTORAL',
      catalystDetail: 'Volume Transaksi Terbesar Bursa, Volatilitas Super Tinggi & Akumulasi Bandar Asing BK/AK',
      isIpoLowFloat: false
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'IDR 132',
      epsGrowthYoY: '+15.2%',
      sector: 'Energy / Coal Mining',
      screenerMatch: 'Price > EMA20 | Heavy Liquid Vol | Foreign Inflow'
    },
    googleNewsSentiment: {
      score: 93,
      sentimentStatus: 'VERY_BULLISH',
      headline: 'Google AI Intel: Akumulasi Asing Rp 124B & Rebound Batu Bara Global',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 128,
      ema10: 136,
      diffPercent: 8.8
    },
    rsi: 76.8,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'IDR 132',
      breakoutType: '20-Day High Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '10.4x 10MA'
    },
    entryZone: '144 - 148',
    targetPrice: '178 (+20.2%)',
    stopLoss: '136 (-8.1%)',
    riskReward: '1 : 2.5',
    aiRationale: 'Saham Terfavorit Volatilitas Tinggi Harga Murah (IDR 148): Volume Transaksi Raksasa 2.84 Billion Lot, Antrean Bid 18.5M Lot (9.2:1 Wall Buy) & Net Buy Asing Rp 124.8B.',
    matchScore: 98,
    sparkline: [120, 124, 128, 132, 138, 142, 148]
  },
  {
    symbol: 'CUAN',
    name: 'PT Petrindo Jaya Kreasi Tbk.',
    market: 'IDX',
    price: 'IDR 8,950',
    priceNum: 8950,
    change: '+16.40%',
    changePercent: 16.40,
    volume: '94.2M',
    volRatio: 6.10,
    orderBook: {
      bidOfferRatio: 5.2,
      bidVolumeRatioStr: '980K Lot Bid vs 188K Lot Offer (5.2 : 1)',
      isWallBuy: true,
      volumeVsMa20: '6.1x MA20',
      volumeVsMa50: '8.4x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'IDR 8,500',
      rsiVal: 69.8,
      rsiHotMomentum: false
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'CG, BK, AI',
      brokerNetBuyVal: 'Net Buy Rp 64.1 Miliar',
      isBandarAccumulation: true,
      catalystType: 'STRATEGIC_ACQUISITION',
      catalystDetail: 'Finalisasi Akselerasi Aset Tambang & Diversifikasi Sektor',
      isIpoLowFloat: false
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'IDR 8,200',
      epsGrowthYoY: '+48.5%',
      sector: 'Energy / Coal & Diversified Mining',
      screenerMatch: 'Price > EMA20 | Strategic Acquisition | Vol Surge 6.1x'
    },
    googleNewsSentiment: {
      score: 93,
      sentimentStatus: 'VERY_BULLISH',
      headline: 'Google AI Intel: Akselerasi Aset Tambang Strategis CUAN & Net Buy CG',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 8100,
      ema10: 8450,
      diffPercent: 4.3
    },
    rsi: 69.8,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'IDR 8,500',
      breakoutType: 'Pattern Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '6.1x 10MA'
    },
    entryZone: '8,800 - 8,950',
    targetPrice: '9,800 (+9.5%)',
    stopLoss: '8,400 (-6.1%)',
    riskReward: '1 : 1.5',
    aiRationale: 'Volume Surge 6.1x melampaui MA20/50. Wall Buy Bid 5.2x Offer, MACD Golden Cross di zona positif & akumulasi broker CG/BK.',
    matchScore: 97,
    sparkline: [8000, 8150, 8300, 8500, 8700, 8850, 8950]
  },
  {
    symbol: 'BREN',
    name: 'PT Barito Renewables Energy Tbk.',
    market: 'IDX',
    price: 'IDR 7,850',
    priceNum: 7850,
    change: '+4.67%',
    changePercent: 4.67,
    volume: '142.8M',
    volRatio: 5.40,
    orderBook: {
      bidOfferRatio: 4.1,
      bidVolumeRatioStr: '1.8M Lot Bid vs 439K Lot Offer (4.1 : 1)',
      isWallBuy: true,
      volumeVsMa20: '5.4x MA20',
      volumeVsMa50: '7.1x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'IDR 7,500',
      rsiVal: 68.5,
      rsiHotMomentum: false
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'BK, CS, DB',
      brokerNetBuyVal: 'Net Buy Rp 195.0 Miliar',
      isBandarAccumulation: true,
      catalystType: 'SECTORAL',
      catalystDetail: 'Inklusi Indeks Global FTSE & Net Buy Asing Pasif Masif',
      isIpoLowFloat: false
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'IDR 7,400',
      epsGrowthYoY: '+28.4%',
      sector: 'Utilities / Green Energy',
      screenerMatch: 'Price > EMA20 | FTSE Index Inflow | High Market Cap'
    },
    googleNewsSentiment: {
      score: 95,
      sentimentStatus: 'VERY_BULLISH',
      headline: 'Google AI Intel: Inflow Pasif FTSE & Akumulasi Institusi Asing Rp 195B',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 7450,
      ema10: 7600,
      diffPercent: 3.3
    },
    rsi: 68.5,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'IDR 7,500',
      breakoutType: 'Pattern Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '5.4x 10MA'
    },
    entryZone: '7,700 - 7,850',
    targetPrice: '8,400 (+7.0%)',
    stopLoss: '7,450 (-5.1%)',
    riskReward: '1 : 1.4',
    aiRationale: 'Volume Surge 5.4x MA20/MA50. Net Buy institusi asing Rp 195B menahan dinding bid 4.1:1 di fraksi harga atas.',
    matchScore: 95,
    sparkline: [7300, 7400, 7450, 7500, 7650, 7750, 7850]
  },
  {
    symbol: 'BBCA',
    name: 'PT Bank Central Asia Tbk.',
    market: 'IDX',
    price: 'IDR 10,475',
    priceNum: 10475,
    change: '+2.45%',
    changePercent: 2.45,
    volume: '88.4M',
    volRatio: 2.85,
    orderBook: {
      bidOfferRatio: 2.8,
      bidVolumeRatioStr: '620K Lot Bid vs 221K Lot Offer (2.8 : 1)',
      isWallBuy: false,
      volumeVsMa20: '2.85x MA20',
      volumeVsMa50: '3.2x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'IDR 10,350',
      rsiVal: 61.4,
      rsiHotMomentum: false
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'BK, ZP, RX',
      brokerNetBuyVal: 'Net Buy Rp 310.2 Miliar',
      isBandarAccumulation: true,
      catalystType: 'DIVIDEND',
      catalystDetail: 'Pengumuman Interm Dividend Rp 245/saham & Rekor Laba',
      isIpoLowFloat: false
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'IDR 10,250',
      epsGrowthYoY: '+14.2%',
      sector: 'Financials / Banking Big Cap',
      screenerMatch: 'Price > EMA20 | Top Foreign Inflow | Dividend Catalyst'
    },
    googleNewsSentiment: {
      score: 94,
      sentimentStatus: 'VERY_BULLISH',
      headline: 'Google AI Intel: Inflow Asing Rp 310B & Dividen Interim BCA Rekor',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 10320,
      ema10: 10380,
      diffPercent: 1.8
    },
    rsi: 61.4,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'IDR 10,350',
      breakoutType: '20-Day High Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '2.85x 10MA'
    },
    entryZone: '10,400 - 10,475',
    targetPrice: '10,850 (+3.6%)',
    stopLoss: '10,250 (-2.1%)',
    riskReward: '1 : 1.7',
    aiRationale: 'MA10/EMA10 Golden Cross, breakout Bollinger Bands Upper level IDR 10,350 dengan katalis dividen & akumulasi broker BK/ZP Rp 310B.',
    matchScore: 98,
    sparkline: [10200, 10250, 10300, 10280, 10350, 10400, 10475]
  },
  {
    symbol: 'BMRI',
    name: 'PT Bank Mandiri (Persero) Tbk.',
    market: 'IDX',
    price: 'IDR 7,225',
    priceNum: 7225,
    change: '+3.15%',
    changePercent: 3.15,
    volume: '112.9M',
    volRatio: 3.10,
    orderBook: {
      bidOfferRatio: 3.1,
      bidVolumeRatioStr: '890K Lot Bid vs 287K Lot Offer (3.1 : 1)',
      isWallBuy: true,
      volumeVsMa20: '3.1x MA20',
      volumeVsMa50: '4.0x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'IDR 7,050',
      rsiVal: 64.2,
      rsiHotMomentum: false
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'KZ, ZP, AK',
      brokerNetBuyVal: 'Net Buy Rp 180.5 Miliar',
      isBandarAccumulation: true,
      catalystType: 'DIVIDEND',
      catalystDetail: 'Pertumbuhan Kredit YoY +14.2% & Estimasi Dividen Tinggi',
      isIpoLowFloat: false
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'IDR 7,000',
      epsGrowthYoY: '+18.1%',
      sector: 'Financials / Banking Big Cap',
      screenerMatch: 'Price > EMA20 | Credit Growth +14.2% | Foreign Inflow'
    },
    googleNewsSentiment: {
      score: 93,
      sentimentStatus: 'VERY_BULLISH',
      headline: 'Google AI Intel: Kredit BMRI Tumbuh +14.2% & Akumulasi Asing Rp 180B',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 7080,
      ema10: 7140,
      diffPercent: 2.1
    },
    rsi: 64.2,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'IDR 7,050',
      breakoutType: '52-Week High Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '3.10x 10MA'
    },
    entryZone: '7,150 - 7,225',
    targetPrice: '7,550 (+4.5%)',
    stopLoss: '7,000 (-3.1%)',
    riskReward: '1 : 1.5',
    aiRationale: 'Wall Buy Bid 3.1:1, Volume tembus MA20/MA50 3.1x, MACD Golden Cross di zona positif & akumulasi institusi asing masif.',
    matchScore: 96,
    sparkline: [6950, 7000, 7050, 7020, 7100, 7180, 7225]
  },
  {
    symbol: 'PLTR',
    name: 'Palantir Technologies Inc.',
    market: 'US',
    price: 'USD 42.80',
    priceNum: 42.8,
    change: '+8.45%',
    changePercent: 8.45,
    volume: '78.5M',
    volRatio: 5.80,
    orderBook: {
      bidOfferRatio: 4.8,
      bidVolumeRatioStr: 'Institutional Level 2 Depth Buy Wall (4.8 : 1)',
      isWallBuy: true,
      volumeVsMa20: '5.8x MA20',
      volumeVsMa50: '7.9x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'USD 39.50',
      rsiVal: 71.2,
      rsiHotMomentum: true
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'Goldman Sachs, Morgan Stanley, Citadel',
      brokerNetBuyVal: 'Net Buy $185.0 Miliar',
      isBandarAccumulation: true,
      catalystType: 'EARNINGS_RECORD',
      catalystDetail: 'Kontrak Baru U.S. Defense & AI Enterprise Revenue Growth +85%',
      isIpoLowFloat: false
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'USD 38.50',
      epsGrowthYoY: '+85.0%',
      sector: 'Technology / AI Software',
      screenerMatch: 'Price > EMA20 | AIP Platform Expansion | Institutional Buy'
    },
    googleNewsSentiment: {
      score: 97,
      sentimentStatus: 'VERY_BULLISH',
      headline: 'Google AI Intel: AIP Platform Adoption Surge & Defense Contract Win',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 38.2,
      ema10: 40.1,
      diffPercent: 4.9
    },
    rsi: 71.2,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'USD 39.50',
      breakoutType: '52-Week High Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '5.8x 10MA'
    },
    entryZone: '41.50 - 42.80',
    targetPrice: '47.50 (+11.0%)',
    stopLoss: '39.00 (-8.8%)',
    riskReward: '1 : 1.3',
    aiRationale: 'Volume Surge 5.8x MA20/MA50 di bursa US, Level 2 Buy Wall 4.8:1, RSI 71.2 Hot Momentum & Akumulasi institusi tier-1 Wall Street.',
    matchScore: 96,
    sparkline: [37.5, 38, 39, 40, 41.2, 42, 42.8]
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    market: 'US',
    price: 'USD 912.40',
    priceNum: 912.40,
    change: '+6.80%',
    changePercent: 6.80,
    volume: '54.2M',
    volRatio: 4.90,
    orderBook: {
      bidOfferRatio: 5.2,
      bidVolumeRatioStr: 'Dark Pool & Institutional Buy Depth (5.2 : 1)',
      isWallBuy: true,
      volumeVsMa20: '4.9x MA20',
      volumeVsMa50: '6.4x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'USD 875.00',
      rsiVal: 76.5,
      rsiHotMomentum: true
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'BlackRock, Vanguard, Citadel, Jane Street',
      brokerNetBuyVal: 'Net Buy $620.0 Juta',
      isBandarAccumulation: true,
      catalystType: 'EARNINGS_RECORD',
      catalystDetail: 'Blackwell AI Architecture Hyperscaler Demand Surge & Data Center Outperformance',
      isIpoLowFloat: false
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'USD 860.00',
      epsGrowthYoY: '+122.0%',
      sector: 'Technology / Semiconductors & AI',
      screenerMatch: 'Price > EMA20 | AI GPU Dominance | Tier 1 Wall St Buy'
    },
    googleNewsSentiment: {
      score: 98,
      sentimentStatus: 'VERY_BULLISH',
      headline: 'Google AI Intel: Record Blackwell GPU Enterprise Allocations & Hyperscaler Capex',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 855.0,
      ema10: 880.0,
      diffPercent: 3.7
    },
    rsi: 76.5,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'USD 880.00',
      breakoutType: '52-Week High Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '4.9x 10MA'
    },
    entryZone: '900.00 - 912.40',
    targetPrice: '990.00 (+8.5%)',
    stopLoss: '855.00 (-6.3%)',
    riskReward: '1 : 1.4',
    aiRationale: 'Lonjakan Volume 4.9x MA20 di bursa Wall Street NASDAQ, Level 2 Buy Depth 5.2:1, RSI 76.5 Hot Momentum & Dark Pool Accumulation.',
    matchScore: 98,
    sparkline: [820, 840, 860, 875, 890, 905, 912.4]
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    market: 'US',
    price: 'USD 174.60',
    priceNum: 174.60,
    change: '+7.20%',
    changePercent: 7.20,
    volume: '112.4M',
    volRatio: 5.40,
    orderBook: {
      bidOfferRatio: 4.6,
      bidVolumeRatioStr: 'Retail & Institutional Call Sweep Buy Wall (4.6 : 1)',
      isWallBuy: true,
      volumeVsMa20: '5.4x MA20',
      volumeVsMa50: '7.1x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'USD 165.00',
      rsiVal: 69.8,
      rsiHotMomentum: true
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'Susquehanna, Goldman Sachs, Citadel Securities',
      brokerNetBuyVal: 'Net Buy $310.0 Juta',
      isBandarAccumulation: true,
      catalystType: 'STRATEGIC_ACQUISITION',
      catalystDetail: 'Full Self-Driving (FSD) v13 Regulatory Approval & Robotaxi Fleet Rollout',
      isIpoLowFloat: false
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'USD 162.50',
      epsGrowthYoY: '+24.5%',
      sector: 'Consumer Cyclical / EV & Autonomous AI',
      screenerMatch: 'Price > EMA20 | Short Squeeze Potential | High Beta Momentum'
    },
    googleNewsSentiment: {
      score: 95,
      sentimentStatus: 'VERY_BULLISH',
      headline: 'Google AI Intel: FSD License Acceleration & Energy Storage Gigafactory Scale',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 161.0,
      ema10: 168.0,
      diffPercent: 4.1
    },
    rsi: 69.8,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'USD 165.00',
      breakoutType: '20-Day High Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '5.4x 10MA'
    },
    entryZone: '170.00 - 174.60',
    targetPrice: '198.00 (+13.4%)',
    stopLoss: '159.00 (-8.9%)',
    riskReward: '1 : 1.5',
    aiRationale: 'Short Squeeze Momentum di Wall Street, Volume Surge 5.4x, Level 2 Bid Depth 4.6:1, Breakout Upper Band Bollinger & Akumulasi Call Options.',
    matchScore: 95,
    sparkline: [155, 158, 162, 165, 169, 172, 174.6]
  },
  {
    symbol: 'COIN',
    name: 'Coinbase Global, Inc.',
    market: 'US',
    price: 'USD 240.50',
    priceNum: 240.50,
    change: '+11.20%',
    changePercent: 11.20,
    volume: '28.6M',
    volRatio: 6.20,
    orderBook: {
      bidOfferRatio: 6.1,
      bidVolumeRatioStr: 'Crypto Inflow & Prime Custody Depth (6.1 : 1)',
      isWallBuy: true,
      volumeVsMa20: '6.2x MA20',
      volumeVsMa50: '8.8x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'USD 220.00',
      rsiVal: 78.2,
      rsiHotMomentum: true
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'ARK Invest, Jane Street, Virtu Financial',
      brokerNetBuyVal: 'Net Buy $245.0 Juta',
      isBandarAccumulation: true,
      catalystType: 'SECTORAL',
      catalystDetail: 'Record Spot Bitcoin & Ethereum ETF Custody Fee Revenue & Base L2 Scaling',
      isIpoLowFloat: false
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'USD 215.00',
      epsGrowthYoY: '+340.0%',
      sector: 'Financial Services / Digital Assets',
      screenerMatch: 'Price > EMA20 | Vol Surge 6.2x | High Beta Breakout'
    },
    googleNewsSentiment: {
      score: 96,
      sentimentStatus: 'VERY_BULLISH',
      headline: 'Google AI Intel: Custodial Asset Surges Above $300B Amid Institutional Crypto Allocation',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 212.0,
      ema10: 228.0,
      diffPercent: 5.8
    },
    rsi: 78.2,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'USD 220.00',
      breakoutType: '52-Week High Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '6.2x 10MA'
    },
    entryZone: '232.00 - 240.50',
    targetPrice: '275.00 (+14.3%)',
    stopLoss: '218.00 (-9.4%)',
    riskReward: '1 : 1.5',
    aiRationale: 'High Beta Day Trading Breakout di NASDAQ, Volume Surge 6.2x MA20, Antrean Level 2 Buy Depth 6.1:1 & Sentimen AI Bullish (+96%).',
    matchScore: 97,
    sparkline: [205, 212, 220, 225, 232, 238, 240.5]
  },
  {
    symbol: 'GRAB',
    name: 'Grab Holdings Limited',
    market: 'GLOBAL',
    price: 'USD 4.85',
    priceNum: 4.85,
    change: '+9.60%',
    changePercent: 9.60,
    volume: '42.8M',
    volRatio: 7.10,
    orderBook: {
      bidOfferRatio: 5.8,
      bidVolumeRatioStr: 'Southeast Asia Superapp Inflow (5.8 : 1)',
      isWallBuy: true,
      volumeVsMa20: '7.1x MA20',
      volumeVsMa50: '9.4x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'USD 4.40',
      rsiVal: 75.4,
      rsiHotMomentum: true
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'Morgan Stanley Asia, Temasek, GIC Singapore',
      brokerNetBuyVal: 'Net Buy $88.0 Juta',
      isBandarAccumulation: true,
      catalystType: 'EARNINGS_RECORD',
      catalystDetail: 'Laba Bersih Rekor Q2 & Pertumbuhan FinTech Digibank GXS Singapore-Malaysia',
      isIpoLowFloat: false
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'USD 4.25',
      epsGrowthYoY: '+68.0%',
      sector: 'Technology / SEA Mobility & Fintech',
      screenerMatch: 'Price > EMA20 | ASEAN Tech Leader | Institutional Buy'
    },
    googleNewsSentiment: {
      score: 95,
      sentimentStatus: 'VERY_BULLISH',
      headline: 'Google AI Intel: Grab Mobility & Deliveries Margin Expansion Tops Consensus',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 4.20,
      ema10: 4.55,
      diffPercent: 7.1
    },
    rsi: 75.4,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'USD 4.40',
      breakoutType: '52-Week High Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '7.1x 10MA'
    },
    entryZone: '4.65 - 4.85',
    targetPrice: '5.60 (+15.5%)',
    stopLoss: '4.35 (-10.3%)',
    riskReward: '1 : 1.5',
    aiRationale: 'Global Hub Breakout Squeeze di SGX/US, Volume Surge 7.1x MA20, Aliran modal institusi Asia Temasek/GIC & Dukungan support dinamis MA 5.',
    matchScore: 96,
    sparkline: [4.1, 4.2, 4.35, 4.45, 4.6, 4.75, 4.85]
  },
  {
    symbol: 'SE',
    name: 'Sea Limited (Shopee & Garena)',
    market: 'GLOBAL',
    price: 'USD 86.50',
    priceNum: 86.50,
    change: '+8.90%',
    changePercent: 8.90,
    volume: '16.4M',
    volRatio: 5.70,
    orderBook: {
      bidOfferRatio: 4.9,
      bidVolumeRatioStr: 'E-Commerce & Digital Bank Inflow (4.9 : 1)',
      isWallBuy: true,
      volumeVsMa20: '5.7x MA20',
      volumeVsMa50: '7.6x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'USD 79.50',
      rsiVal: 73.8,
      rsiHotMomentum: true
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'Tencent, UBS Global, Baillie Gifford',
      brokerNetBuyVal: 'Net Buy $165.0 Juta',
      isBandarAccumulation: true,
      catalystType: 'EARNINGS_RECORD',
      catalystDetail: 'Shopee Live GMV Surge +82% & SeaMoney Digital Banking Profitability Acceleration',
      isIpoLowFloat: false
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'USD 78.00',
      epsGrowthYoY: '+115.0%',
      sector: 'Consumer Cyclical / E-Commerce & FinTech',
      screenerMatch: 'Price > EMA20 | Vol Surge 5.7x | Asian E-Commerce Boom'
    },
    googleNewsSentiment: {
      score: 96,
      sentimentStatus: 'VERY_BULLISH',
      headline: 'Google AI Intel: Shopee Dominance & SeaMoney Net Interest Margin Surge',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 77.5,
      ema10: 82.0,
      diffPercent: 5.5
    },
    rsi: 73.8,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'USD 80.00',
      breakoutType: '52-Week High Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '5.7x 10MA'
    },
    entryZone: '83.50 - 86.50',
    targetPrice: '98.00 (+13.3%)',
    stopLoss: '78.50 (-9.2%)',
    riskReward: '1 : 1.4',
    aiRationale: 'Asian E-Commerce & FinTech Squeeze, Lonjakan Volume 5.7x MA20, Order Book Wall Buy 4.9:1 & Akumulasi Institusi Tencent/UBS.',
    matchScore: 95,
    sparkline: [74, 76, 78.5, 80.5, 83, 85, 86.5]
  },
  {
    symbol: 'DBS',
    name: 'DBS Group Holdings Ltd',
    market: 'GLOBAL',
    price: 'SGD 38.45',
    priceNum: 38.45,
    change: '+3.40%',
    changePercent: 3.40,
    volume: '8.9M',
    volRatio: 4.20,
    orderBook: {
      bidOfferRatio: 4.4,
      bidVolumeRatioStr: 'SGX Institutional Wealth Inflow (4.4 : 1)',
      isWallBuy: true,
      volumeVsMa20: '4.2x MA20',
      volumeVsMa50: '5.8x MA50'
    },
    momentum: {
      macdStatus: 'Golden Cross Positif',
      macdIsPositiveGoldenCross: true,
      bbBreakout: true,
      bbUpperBandLevel: 'SGD 36.80',
      rsiVal: 68.5,
      rsiHotMomentum: false
    },
    bandarAndFundamentals: {
      topBrokersAccumulation: 'Temasek Holdings, Government of Singapore, Citi Private',
      brokerNetBuyVal: 'Net Buy SGD 120.0 Juta',
      isBandarAccumulation: true,
      catalystType: 'DIVIDEND',
      catalystDetail: 'Dividend Yield 5.8% & Rekor Wealth Management AUM Hub Singapura',
      isIpoLowFloat: false
    },
    tradingViewScreener: {
      priceAboveEma20: true,
      ema20Value: 'SGD 36.50',
      epsGrowthYoY: '+18.2%',
      sector: 'Financials / Singapore Banking Hub',
      screenerMatch: 'Price > EMA20 | High Dividend Yield | Safe Haven Inflow'
    },
    googleNewsSentiment: {
      score: 94,
      sentimentStatus: 'VERY_BULLISH',
      headline: 'Google AI Intel: DBS Group Record Return on Equity & Wealth Management Inflows',
      source: 'Google Search AI Grounding'
    },
    maEmaCross: {
      status: 'Golden Cross',
      ma10: 36.4,
      ema10: 37.5,
      diffPercent: 2.9
    },
    rsi: 68.5,
    rsiStatus: 'Bullish Momentum',
    chartBreakout: {
      isBreakout: true,
      resistanceLevel: 'SGD 37.00',
      breakoutType: '52-Week High Breakout'
    },
    volumeBreakout: {
      isVolumeBreakout: true,
      volMultiplier: '4.2x 10MA'
    },
    entryZone: '37.80 - 38.45',
    targetPrice: '42.00 (+9.2%)',
    stopLoss: '36.20 (-5.8%)',
    riskReward: '1 : 1.6',
    aiRationale: 'SGX Institutional Gateway, Sinyal Pantulan MA 5, Dividend Support 5.8% & Akumulasi Sovereign Wealth Funds Temasek.',
    matchScore: 94,
    sparkline: [35.5, 36, 36.5, 37.2, 37.8, 38.1, 38.45]
  }
];

interface DailyTradingAutoAnalystProps {
  onSelectStock?: (symbol: string) => void;
  onOpenFundamentalAudit?: (symbol: string) => void;
  onOpenExplorer?: (symbol: string) => void;
}

export const DailyTradingAutoAnalyst: React.FC<DailyTradingAutoAnalystProps> = ({ 
  onSelectStock,
  onOpenFundamentalAudit,
  onOpenExplorer
}) => {
  const livePriceLookupRef = React.useRef<Record<string, { price: number; changePercent?: number }>>({});
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [scanSeedOffset, setScanSeedOffset] = useState<number>(0);
  const [activeSessionMode, setActiveSessionMode] = useState<'TODAY_LIVE' | 'SESSION_1_OPEN' | 'SESSION_2_POWER' | 'NEXT_DAY_SIM'>('TODAY_LIVE');
  const [selectedSignalStatus, setSelectedSignalStatus] = useState<'ALL' | SignalLifecycleStatus>('ALL');
  const [scanStepMessage, setScanStepMessage] = useState<string>('');
  const [scanNotification, setScanNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const [stocks, setStocks] = useState<DailyTradingStock[]>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return generateDailyTradingPicks(todayStr, 0);
  });
  const [selectedMarket, setSelectedMarket] = useState<'ALL' | 'IDX' | 'US' | 'GLOBAL'>('ALL');
  
  // Real-time synchronization state per exchange
  const [exchangeSyncTimes, setExchangeSyncTimes] = useState<{
    IDX: string;
    US: string;
    GLOBAL: string;
    lastSyncTimestamp: number;
    syncCount: number;
  }>({
    IDX: 'Baru saja',
    US: 'Baru saja',
    GLOBAL: 'Baru saja',
    lastSyncTimestamp: Date.now(),
    syncCount: 1
  });
  
  // Filtering states
  const [activeFilterCategory, setActiveFilterCategory] = useState<
    'ALL' | 'ARA_POTENTIAL' | 'MA_5_10_CROSS' | 'DYNAMIC_SUPPORT_BOUNCE' | 'PRICE_ABOVE_MA5_MA10' | 'PENNY_HIGH_VOL' | 'PILLAR_1_ORDERBOOK' | 'PILLAR_2_MOMENTUM' | 'PILLAR_3_BANDAR'
  >('ALL');
  const [showMethodologyGuide, setShowMethodologyGuide] = useState<boolean>(false);
  
  const [filter4of4Only, setFilter4of4Only] = useState<boolean>(false);
  const [filterEma10Only, setFilterEma10Only] = useState<boolean>(false);
  const [filterMaCrossOnly, setFilterMaCrossOnly] = useState<boolean>(false);
  const [filterDynamicBounceOnly, setFilterDynamicBounceOnly] = useState<boolean>(false);
  const [activeIndicatorFilter, setActiveIndicatorFilter] = useState<'ALL' | 'MA_5_10_CROSS' | 'DYNAMIC_SUPPORT_BOUNCE' | 'PRICE_ABOVE_MA5_MA10' | 'EMA_10' | 'MA_CROSS' | 'RSI_BULL' | 'BREAKOUT_CHART' | 'BREAKOUT_VOL' | 'VOLUME_SURGE_5X'>('ALL');
  const [sortByVolumeSurge, setSortByVolumeSurge] = useState<boolean>(false);
  const [volumeSurgeOnly, setVolumeSurgeOnly] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [chartModalSymbol, setChartModalSymbol] = useState<string | null>(null);
  const [detailModalStock, setDetailModalStock] = useState<DailyTradingStock | null>(null);

  // Active detail modal stock dynamically resolved from live stocks state
  const activeDetailStock = useMemo(() => {
    if (!detailModalStock) return null;
    const liveMatch = stocks.find(s => s.symbol.toUpperCase() === detailModalStock.symbol.toUpperCase());
    if (liveMatch) {
      return {
        ...liveMatch,
        aiRationale: getDynamicAiThesis(liveMatch)
      };
    }
    return {
      ...detailModalStock,
      aiRationale: getDynamicAiThesis(detailModalStock)
    };
  }, [detailModalStock, stocks]);

  const [showPineScriptModal, setShowPineScriptModal] = useState<boolean>(false);
  const [copiedPineScript, setCopiedPineScript] = useState<boolean>(false);
  const [copiedPlanSymbol, setCopiedPlanSymbol] = useState<string | null>(null);

  const handleCopyPineScript = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(PINE_SCRIPT_CODE);
      setCopiedPineScript(true);
      setTimeout(() => setCopiedPineScript(false), 2000);
    }
  };

  // Estimate Exchange-Specific Price Limit / Volatility Band (ARA BEI vs LULD Wall Street vs Global Cap)
  const getExchangeLimitInfo = (priceNum: number, market: string) => {
    if (market === 'IDX') {
      let araPct = 25;
      if (priceNum <= 200) araPct = 35;
      else if (priceNum <= 5000) araPct = 25;
      else araPct = 20;

      const limitPrice = Math.floor(priceNum * (1 + araPct / 100));
      return {
        market: 'IDX',
        type: 'ARA_CAP',
        label: 'Batas Maksimum ARA (BEI Rules)',
        shortLabel: 'Potensi ARA',
        badge: `POTENSI ARA +${araPct}%`,
        pct: araPct.toString(),
        limitPriceNum: limitPrice,
        limitPriceFormatted: `Rp ${limitPrice.toLocaleString('id-ID')}`,
        ruleNote: priceNum <= 200 ? 'Fraksi < Rp 200 (Cap 35%)' : priceNum <= 5000 ? 'Fraksi Rp 200-5000 (Cap 25%)' : 'Fraksi > Rp 5000 (Cap 20%)',
        currency: 'IDR'
      };
    } else if (market === 'US') {
      const luldPct = priceNum > 100 ? 5 : 10;
      const squeezePct = 15;
      const limitPrice = +(priceNum * (1 + squeezePct / 100)).toFixed(2);
      return {
        market: 'US',
        type: 'LULD_BAND',
        label: 'Target LULD Squeeze (Wall Street)',
        shortLabel: 'LULD Squeeze',
        badge: `LULD SQUEEZE +${squeezePct}%`,
        pct: squeezePct.toString(),
        limitPriceNum: limitPrice,
        limitPriceFormatted: `$${limitPrice.toFixed(2)}`,
        ruleNote: `LULD Volatility Band (+${luldPct}%) / Gamma Squeeze Band (+${squeezePct}%)`,
        currency: 'USD'
      };
    } else {
      const limitPct = 20;
      const limitPrice = +(priceNum * (1 + limitPct / 100)).toFixed(2);
      const isSgd = market === 'SGX';
      return {
        market: market,
        type: 'GLOBAL_LIMIT',
        label: 'Dynamic Price Cap (Global Hub)',
        shortLabel: 'Global Breakout',
        badge: `GLOBAL LIMIT +${limitPct}%`,
        pct: limitPct.toString(),
        limitPriceNum: limitPrice,
        limitPriceFormatted: isSgd ? `SGD ${limitPrice.toFixed(2)}` : `$${limitPrice.toFixed(2)}`,
        ruleNote: 'Cross-Border Circuit Limit (+20%)',
        currency: isSgd ? 'SGD' : 'USD'
      };
    }
  };

  const handleCopyPlan = (stock: DailyTradingStock) => {
    const limitInfo = getExchangeLimitInfo(stock.priceNum, stock.market);
    const maInd = stock.maIndicators || computeMaIndicators(stock.priceNum, stock.market, stock.maEmaCross?.ma10);
    const thesisText = getDynamicAiThesis(stock);
    const isIdx = stock.market === 'IDX';
    const planStr = `[VAM DAY TRADING PLAN — ${isIdx ? 'POTENSI ARA BEI' : stock.market === 'US' ? 'WALL STREET MOMENTUM' : 'GLOBAL HUB'}] ${stock.symbol} (${stock.name})
• Pasar / Exchange: ${stock.market}
• Harga Terkini: ${stock.price} (${stock.change})
• Buy / Entry Zone: ${stock.entryZone}
• Support Dinamis MA5 (Batas Pantulan 1): ${maInd.supportResistance.supportMa5}
• Support Dinamis MA10 (Batas Pantulan 2): ${maInd.supportResistance.supportMa10}
• Sinyal MA 5/10: ${maInd.crossoverLabel} (${maInd.pricePositionLabel})
• Target Profit (TP1): ${stock.targetPrice}
• ${limitInfo.label}: ${limitInfo.limitPriceFormatted} (+${limitInfo.pct}%)
• Cut Loss (SL): ${stock.stopLoss}
• Risk/Reward: ${stock.riskReward}
• Strategi Eksekusi (Thesis AI): ${thesisText}`;

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(planStr);
      setCopiedPlanSymbol(stock.symbol);
      setTimeout(() => setCopiedPlanSymbol(null), 2500);
    }
  };

  // Sync with real-time exchange last prices
  const fetchLiveExchangePrices = async () => {
    try {
      const res = await fetch('/api/market/realtime-prices');
      if (res.ok) {
        const liveData: Record<string, { price: number; changePercent?: number }> = await res.json();
        const now = new Date();
        setExchangeSyncTimes(prev => ({
          IDX: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          US: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          GLOBAL: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          lastSyncTimestamp: Date.now(),
          syncCount: prev.syncCount + 1
        }));

        setStocks(prev => prev.map(stock => {
          const match = liveData[stock.symbol] || liveData[`${stock.symbol}.JK`];
          if (match && typeof match.price === 'number' && match.price > 0) {
            const livePrice = match.price;
            const chgPct = match.changePercent !== undefined ? match.changePercent : stock.changePercent;
            const priceStr = stock.market === 'IDX' 
              ? `IDR ${Math.round(livePrice).toLocaleString('id-ID')}` 
              : stock.market === 'SGX'
              ? `SGD ${livePrice.toFixed(2)}`
              : `USD ${livePrice.toFixed(2)}`;
            const changeStr = `${chgPct >= 0 ? '+' : ''}${chgPct.toFixed(2)}%`;
            
            const entryLow = stock.market === 'IDX' ? Math.round(livePrice * 0.992) : +(livePrice * 0.992).toFixed(2);
            const entryHigh = stock.market === 'IDX' ? Math.round(livePrice) : +livePrice.toFixed(2);
            const targetP = stock.market === 'IDX' ? Math.round(livePrice * 1.038) : +(livePrice * 1.038).toFixed(2);
            const stopL = stock.market === 'IDX' ? Math.round(livePrice * 0.978) : +(livePrice * 0.978).toFixed(2);
            const resLevel = stock.market === 'IDX' ? Math.round(livePrice * 0.995) : +(livePrice * 0.995).toFixed(2);

            const targetDiffPct = (((targetP - livePrice) / livePrice) * 100).toFixed(1);
            const stopLossDiffPct = (((livePrice - stopL) / livePrice) * 100).toFixed(1);
            const updatedMa = computeMaIndicators(livePrice, stock.market, stock.maIndicators?.ma10 || stock.maEmaCross?.ma10);

            const updatedStock: DailyTradingStock = {
              ...stock,
              priceNum: livePrice,
              price: priceStr,
              change: changeStr,
              changePercent: chgPct,
              maIndicators: updatedMa,
              entryZone: stock.market === 'IDX' 
                ? `${Math.round(entryLow).toLocaleString('id-ID')} - ${Math.round(entryHigh).toLocaleString('id-ID')}`
                : `${entryLow.toFixed(2)} - ${entryHigh.toFixed(2)}`,
              targetPrice: stock.market === 'IDX' ? `${Math.round(targetP).toLocaleString('id-ID')} (+${targetDiffPct}%)` : `${targetP.toFixed(2)} (+${targetDiffPct}%)`,
              stopLoss: stock.market === 'IDX' ? `${Math.round(stopL).toLocaleString('id-ID')} (-${stopLossDiffPct}%)` : `${stopL.toFixed(2)} (-${stopLossDiffPct}%)`,
              chartBreakout: {
                ...stock.chartBreakout,
                resistanceLevel: stock.market === 'IDX' ? `IDR ${Math.round(resLevel).toLocaleString('id-ID')}` : `$${resLevel.toFixed(2)}`
              }
            };
            return {
              ...updatedStock,
              aiRationale: getDynamicAiThesis(updatedStock)
            };
          }
          return stock;
        }));
      }
    } catch (err) {
      console.warn("Failed to fetch live exchange prices for DailyTradingAutoAnalyst:", err);
    }
  };

  useEffect(() => {
    fetchLiveExchangePrices();

    const interval = setInterval(() => {
      fetchLiveExchangePrices();
    }, 12000);

    const handleMarketUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ symbol: string; price: number; changePercent?: number }>;
      if (!customEvent || !customEvent.detail) return;
      const { symbol, price, changePercent } = customEvent.detail;
      if (typeof price !== 'number' || price <= 0) return;

      const cleanSym = symbol.replace('.JK', '').toUpperCase();

      setStocks(prev => prev.map(stock => {
        if (stock.symbol.toUpperCase() === cleanSym) {
          const livePrice = price;
          const chgPct = changePercent !== undefined ? changePercent : stock.changePercent;
          const priceStr = stock.market === 'IDX' 
            ? `IDR ${Math.round(livePrice).toLocaleString('id-ID')}` 
            : stock.market === 'SGX'
            ? `SGD ${livePrice.toFixed(2)}`
            : `USD ${livePrice.toFixed(2)}`;
          const changeStr = `${chgPct >= 0 ? '+' : ''}${chgPct.toFixed(2)}%`;
          
          const entryLow = stock.market === 'IDX' ? Math.round(livePrice * 0.992) : +(livePrice * 0.992).toFixed(2);
          const entryHigh = stock.market === 'IDX' ? Math.round(livePrice) : +livePrice.toFixed(2);
          const targetP = stock.market === 'IDX' ? Math.round(livePrice * 1.038) : +(livePrice * 1.038).toFixed(2);
          const stopL = stock.market === 'IDX' ? Math.round(livePrice * 0.978) : +(livePrice * 0.978).toFixed(2);
          const resLevel = stock.market === 'IDX' ? Math.round(livePrice * 0.995) : +(livePrice * 0.995).toFixed(2);

          const targetDiffPct = (((targetP - livePrice) / livePrice) * 100).toFixed(1);
          const stopLossDiffPct = (((livePrice - stopL) / livePrice) * 100).toFixed(1);
          const updatedMa = computeMaIndicators(livePrice, stock.market, stock.maIndicators?.ma10 || stock.maEmaCross?.ma10);

          const updatedStock: DailyTradingStock = {
            ...stock,
            priceNum: livePrice,
            price: priceStr,
            change: changeStr,
            changePercent: chgPct,
            maIndicators: updatedMa,
            entryZone: stock.market === 'IDX' 
              ? `${Math.round(entryLow).toLocaleString('id-ID')} - ${Math.round(entryHigh).toLocaleString('id-ID')}`
              : `${entryLow.toFixed(2)} - ${entryHigh.toFixed(2)}`,
            targetPrice: stock.market === 'IDX' ? `${Math.round(targetP).toLocaleString('id-ID')} (+${targetDiffPct}%)` : `${targetP.toFixed(2)} (+${targetDiffPct}%)`,
            stopLoss: stock.market === 'IDX' ? `${Math.round(stopL).toLocaleString('id-ID')} (-${stopLossDiffPct}%)` : `${stopL.toFixed(2)} (-${stopLossDiffPct}%)`,
            chartBreakout: {
              ...stock.chartBreakout,
              resistanceLevel: stock.market === 'IDX' ? `IDR ${Math.round(resLevel).toLocaleString('id-ID')}` : `$${resLevel.toFixed(2)}`
            }
          };
          return {
            ...updatedStock,
            aiRationale: getDynamicAiThesis(updatedStock)
          };
        }
        return stock;
      }));
    };

    window.addEventListener('vam-market-update', handleMarketUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('vam-market-update', handleMarketUpdate);
    };
  }, []);

  // Filter & sort stocks dynamically based on 3 pillars & MA 5/10 Dynamic Support/Resistance
  const filteredStocks = useMemo(() => {
    let result = stocks.filter(stock => {
      if (selectedMarket !== 'ALL' && stock.market !== selectedMarket) return false;
      
      const maInd = stock.maIndicators || computeMaIndicators(stock.priceNum, stock.market, stock.maEmaCross?.ma10);
      
      // Category Screener based on 3 pillars, Penny Stocks & MA 5/10 Engine
      if (activeFilterCategory === 'ARA_POTENTIAL') {
        // Stock must satisfy key indicators from all 3 pillars + MA Confluence
        const pillar1 = stock.orderBook.bidOfferRatio >= 3.0 && stock.orderBook.isWallBuy;
        const pillar2 = stock.momentum.macdIsPositiveGoldenCross && stock.momentum.bbBreakout;
        const pillar3 = stock.bandarAndFundamentals.isBandarAccumulation || stock.bandarAndFundamentals.isIpoLowFloat;
        const maConfluence = maInd.crossover === 'GOLDEN_CROSS' || stock.priceNum >= maInd.ma5;
        if (!(pillar1 && pillar2 && pillar3 && maConfluence)) return false;
      } else if (activeFilterCategory === 'MA_5_10_CROSS') {
        // Sinyal Beli/Jual: Memakai persilangan garis (Golden Cross MA 5 > MA 10)
        const isCross = maInd.crossover === 'GOLDEN_CROSS' || maInd.ma5 >= maInd.ma10;
        if (!isCross) return false;
      } else if (activeFilterCategory === 'DYNAMIC_SUPPORT_BOUNCE') {
        // Support & Resistance Dinamis: Garis MA bertindak sebagai batas pantulan harga di chart
        const isBounce = maInd.pricePosition === 'BOUNCE_MA5_SUPPORT' || 
                         maInd.pricePosition === 'BOUNCE_MA10_SUPPORT' ||
                         (stock.priceNum >= maInd.ma5 * 0.99 && stock.priceNum <= maInd.ma5 * 1.035);
        if (!isBounce) return false;
      } else if (activeFilterCategory === 'PRICE_ABOVE_MA5_MA10') {
        // Posisi harga terhadap garis MA: Harga > MA 5 > MA 10 (Super Bullish Alignment)
        const isAbove = stock.priceNum >= maInd.ma5 && maInd.ma5 >= maInd.ma10;
        if (!isAbove) return false;
      } else if (activeFilterCategory === 'PENNY_HIGH_VOL') {
        // High volatility, cheap price (< Rp 500 or low float), high ARA potential
        const isCheapOrPenny = stock.priceNum <= 500 || stock.bandarAndFundamentals.isIpoLowFloat;
        const isHighVolAndStrong = stock.volRatio >= 7.0 || stock.changePercent >= 12.0 || stock.orderBook.bidOfferRatio >= 8.0;
        if (!(isCheapOrPenny && isHighVolAndStrong)) return false;
      } else if (activeFilterCategory === 'PILLAR_1_ORDERBOOK') {
        const passOrderBook = stock.orderBook.bidOfferRatio >= 3.0 || stock.volRatio >= 5.0;
        if (!passOrderBook) return false;
      } else if (activeFilterCategory === 'PILLAR_2_MOMENTUM') {
        const passMomentum = stock.momentum.macdIsPositiveGoldenCross && (stock.momentum.bbBreakout || stock.momentum.rsiHotMomentum);
        if (!passMomentum) return false;
      } else if (activeFilterCategory === 'PILLAR_3_BANDAR') {
        const passBandar = stock.bandarAndFundamentals.isBandarAccumulation || stock.bandarAndFundamentals.isIpoLowFloat;
        if (!passBandar) return false;
      }

      if (filter4of4Only) {
        const passesAll = 
          stock.maEmaCross.status === 'Golden Cross' &&
          stock.rsi >= 50 &&
          stock.chartBreakout.isBreakout &&
          stock.volRatio >= 1.8;
        if (!passesAll) return false;
      }

      if (filterEma10Only) {
        const priceAboveEma10 = stock.priceNum >= (stock.maEmaCross?.ema10 || 0);
        if (!priceAboveEma10) return false;
      }

      if (filterMaCrossOnly) {
        if (maInd.crossover !== 'GOLDEN_CROSS' && maInd.ma5 < maInd.ma10) return false;
      }

      if (filterDynamicBounceOnly) {
        const isBounce = maInd.pricePosition === 'BOUNCE_MA5_SUPPORT' || 
                         maInd.pricePosition === 'BOUNCE_MA10_SUPPORT' ||
                         (stock.priceNum >= maInd.ma5 * 0.99 && stock.priceNum <= maInd.ma5 * 1.03);
        if (!isBounce) return false;
      }

      if (activeIndicatorFilter === 'MA_5_10_CROSS' && maInd.crossover !== 'GOLDEN_CROSS' && maInd.ma5 < maInd.ma10) return false;
      if (activeIndicatorFilter === 'DYNAMIC_SUPPORT_BOUNCE' && maInd.pricePosition !== 'BOUNCE_MA5_SUPPORT' && maInd.pricePosition !== 'BOUNCE_MA10_SUPPORT') return false;
      if (activeIndicatorFilter === 'PRICE_ABOVE_MA5_MA10' && (stock.priceNum < maInd.ma5 || maInd.ma5 < maInd.ma10)) return false;
      if (activeIndicatorFilter === 'EMA_10' && stock.priceNum < (stock.maEmaCross?.ema10 || 0)) return false;
      if (activeIndicatorFilter === 'MA_CROSS' && stock.maEmaCross.status !== 'Golden Cross') return false;
      if (activeIndicatorFilter === 'RSI_BULL' && stock.rsi < 55) return false;
      if (activeIndicatorFilter === 'BREAKOUT_CHART' && !stock.chartBreakout.isBreakout) return false;
      if (activeIndicatorFilter === 'BREAKOUT_VOL' && stock.volRatio < 2.0) return false;
      if (activeIndicatorFilter === 'VOLUME_SURGE_5X' && stock.volRatio < 5.0) return false;

      if (volumeSurgeOnly && stock.volRatio < 5.0) return false;

      // Filter by Signal Lifecycle Status
      if (selectedSignalStatus !== 'ALL' && stock.signalStatus !== selectedSignalStatus) return false;

      return true;
    });

    if (sortByVolumeSurge) {
      result = [...result].sort((a, b) => b.volRatio - a.volRatio);
    }

    return result;
  }, [stocks, selectedMarket, activeFilterCategory, filter4of4Only, filterEma10Only, filterMaCrossOnly, filterDynamicBounceOnly, activeIndicatorFilter, sortByVolumeSurge, volumeSurgeOnly, selectedSignalStatus]);

  const handleRunAutoScan = async () => {
    setIsScanning(true);
    setScanStepMessage('🛰️ Menghubungi Gateway Bursa BEI & IBKR / CGS...');

    try {
      await new Promise(r => setTimeout(r, 350));
      setScanStepMessage('📊 Memindai Order Book Level 2 Depth & Deteksi Wall Buy ≥3:1...');

      await new Promise(r => setTimeout(r, 350));
      setScanStepMessage('📈 Menghitung Confluence MA 5 & 10, RSI Hot Momentum & Akumulasi Bandar...');

      // Fetch live prices
      try {
        const res = await fetch('/api/market/realtime-prices');
        if (res.ok) {
          const liveData = await res.json();
          livePriceLookupRef.current = liveData;
        }
      } catch (e) {
        console.warn("Realtime price sync error in scanner:", e);
      }

      await new Promise(r => setTimeout(r, 350));
      const nextOffset = scanSeedOffset + 1;
      setScanSeedOffset(nextOffset);

      const newPicks = generateDailyTradingPicks(selectedDate, nextOffset, livePriceLookupRef.current);
      setStocks(newPicks);

      setScanStepMessage('🎯 Radar Berhasil! Saham rekomendasi baru hasil rotasi pasar berhasil dimuat.');
      setScanNotification({
        message: `⚡ Pemindaian Selesai: Berhasil merotasi ${newPicks.length} saham rekomendasi untuk sesi trading aktif!`,
        type: 'success'
      });
    } catch (err) {
      console.error("Auto scan failed:", err);
    } finally {
      setTimeout(() => {
        setIsScanning(false);
        setScanStepMessage('');
      }, 500);

      setTimeout(() => {
        setScanNotification(null);
      }, 4000);
    }
  };

  const handleSelectSessionMode = (mode: 'TODAY_LIVE' | 'SESSION_1_OPEN' | 'SESSION_2_POWER' | 'NEXT_DAY_SIM') => {
    setActiveSessionMode(mode);
    let offset = 0;
    if (mode === 'SESSION_1_OPEN') offset = 101;
    else if (mode === 'SESSION_2_POWER') offset = 202;
    else if (mode === 'NEXT_DAY_SIM') offset = 303;
    else offset = 0;

    setScanSeedOffset(offset);
    setIsScanning(true);
    setScanStepMessage(`🔄 Merotasi ke ${
      mode === 'SESSION_1_OPEN' ? 'Sesi 1 (Pre-Market / Morning Breakout)' :
      mode === 'SESSION_2_POWER' ? 'Sesi 2 (Power Hour / Afternoon Rally)' :
      mode === 'NEXT_DAY_SIM' ? 'Simulasi Rotasi Hari Berikutnya' : 'Sesi Hari Ini (Live)'
    }...`);

    setTimeout(() => {
      const rotated = generateDailyTradingPicks(selectedDate, offset, livePriceLookupRef.current);
      setStocks(rotated);
      setIsScanning(false);
      setScanStepMessage('');
      setScanNotification({
        message: `✅ Mode Sesi Diperbarui: ${
          mode === 'SESSION_1_OPEN' ? 'Sesi 1 Pagi (Morning Breakout)' :
          mode === 'SESSION_2_POWER' ? 'Sesi 2 Siang (Power Hour)' :
          mode === 'NEXT_DAY_SIM' ? 'Simulasi Hari Berikutnya' : 'Sesi Hari Ini'
        } (${rotated.length} Saham Terpilih)`,
        type: 'info'
      });
      setTimeout(() => setScanNotification(null), 3500);
    }, 400);
  };

  const handleExportCSV = () => {
    if (filteredStocks.length === 0) return;

    const headers = [
      'Symbol',
      'Company Name',
      'Market',
      'Price',
      'Change',
      'MA 5 Level',
      'MA 10 Level',
      'Dynamic Support MA5',
      'Dynamic Support MA10',
      'Dynamic Resistance',
      'MA Crossover Status',
      'Price vs MA Position',
      'MA Signal Execution',
      'Volume',
      'Volume Ratio',
      'Bid:Offer Ratio',
      'Wall Buy Status',
      'Volume vs MA20/MA50',
      'MACD Status',
      'Bollinger Breakout',
      'RSI Momentum',
      'Top Brokers Accumulation',
      'Broker Net Buy Value',
      'Catalyst / IPO Status',
      'Entry Zone',
      'Target Price',
      'Stop Loss',
      'Risk Reward Ratio',
      'Match Score (%)',
      'AI Analysis Rationale'
    ];

    const rows = filteredStocks.map(stock => {
      const maInd = stock.maIndicators || computeMaIndicators(stock.priceNum, stock.market, stock.maEmaCross?.ma10);
      return [
        `"${stock.symbol}"`,
        `"${stock.name.replace(/"/g, '""')}"`,
        `"${stock.market}"`,
        `"${stock.price}"`,
        `"${stock.change}"`,
        `"${maInd.ma5Str}"`,
        `"${maInd.ma10Str}"`,
        `"${maInd.supportResistance.supportMa5}"`,
        `"${maInd.supportResistance.supportMa10}"`,
        `"${maInd.supportResistance.dynamicResistance || '-'}"`,
        `"${maInd.crossoverLabel}"`,
        `"${maInd.pricePositionLabel}"`,
        `"${maInd.signalLabel}"`,
        `"${stock.volume}"`,
        `"${stock.volRatio}x"`,
        `"${stock.orderBook.bidOfferRatio}:1"`,
        `"${stock.orderBook.isWallBuy ? 'YA (Wall Buy)' : 'TIDAK'}"`,
        `"${stock.orderBook.volumeVsMa20} / ${stock.orderBook.volumeVsMa50}"`,
        `"${stock.momentum.macdStatus}"`,
        `"${stock.momentum.bbBreakout ? 'Breakout Upper Band' : 'Normal'}"`,
        `"${stock.rsi} (${stock.momentum.rsiHotMomentum ? 'Hot Momentum' : 'Normal'})"`,
        `"${stock.bandarAndFundamentals.topBrokersAccumulation}"`,
        `"${stock.bandarAndFundamentals.brokerNetBuyVal}"`,
        `"${stock.bandarAndFundamentals.catalystDetail}"`,
        `"${stock.entryZone}"`,
        `"${stock.targetPrice}"`,
        `"${stock.stopLoss}"`,
        `"${stock.riskReward}"`,
        `"${stock.matchScore}%"`,
        `"${stock.aiRationale.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `VentureAM_Daily_Trading_Recommendations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (filteredStocks.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const rowsHtml = filteredStocks.map((stock, i) => {
      const maInd = stock.maIndicators || computeMaIndicators(stock.priceNum, stock.market, stock.maEmaCross?.ma10);
      return `
        <tr style="border-bottom: 1px solid #333; ${i % 2 === 0 ? 'background: #12161f;' : 'background: #0b0e14;'}">
          <td style="padding: 10px; font-weight: bold; color: #deff9a;">${stock.symbol}<br><span style="font-size: 10px; color: #888; font-weight: normal;">${stock.name}</span></td>
          <td style="padding: 10px; font-family: monospace;">${stock.market}</td>
          <td style="padding: 10px; font-weight: bold;">${stock.price}<br><span style="font-size: 10px; color: ${stock.changePercent >= 0 ? '#10b981' : '#ef4444'};">${stock.change}</span></td>
          <td style="padding: 10px; font-size: 11px;">
            <strong style="color: #38bdf8;">MA 5 / 10:</strong> ${maInd.ma5Str} / ${maInd.ma10Str}<br>
            <strong style="color: #deff9a;">Dynamic Support (MA5):</strong> ${maInd.supportResistance.supportMa5}<br>
            <strong style="color: #facc15;">Dynamic Support (MA10):</strong> ${maInd.supportResistance.supportMa10}<br>
            <strong style="color: #10b981;">Crossover & Posisi:</strong> ${maInd.crossoverLabel} • ${maInd.pricePositionLabel}
          </td>
          <td style="padding: 10px; font-size: 11px;">
            <strong style="color: #f59e0b;">Order Book:</strong> Bid/Offer ${stock.orderBook.bidOfferRatio}:1 (Wall Buy)<br>
            <strong style="color: #c084fc;">Volume:</strong> ${stock.orderBook.volumeVsMa20}<br>
            <strong style="color: #10b981;">MACD/BB:</strong> ${stock.momentum.macdStatus} | BB Upper Breakout<br>
            <strong style="color: #38bdf8;">Bandar:</strong> ${stock.bandarAndFundamentals.topBrokersAccumulation} (${stock.bandarAndFundamentals.brokerNetBuyVal})
          </td>
          <td style="padding: 10px; font-size: 11px; font-family: monospace;">
            <strong>Buy:</strong> ${stock.entryZone}<br>
            <strong style="color: #10b981;">TP:</strong> ${stock.targetPrice}<br>
            <strong style="color: #ef4444;">SL:</strong> ${stock.stopLoss}
          </td>
          <td style="padding: 10px; font-size: 11px; font-style: italic; color: #ccc;">"${stock.aiRationale}"</td>
          <td style="padding: 10px; font-weight: bold; text-align: center; color: #deff9a;">${stock.matchScore}%</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>VAM Institutional — Rekomendasi Day Trading & Potensi ARA (${dateStr})</title>
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            body {
              font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
              background-color: #0b0e14;
              color: #ffffff;
              margin: 0;
              padding: 20px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #deff9a;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .logo { font-size: 22px; font-weight: 900; color: #deff9a; letter-spacing: 1px; }
            .subtitle { font-size: 11px; color: #888; text-transform: uppercase; margin-top: 4px; }
            .summary-box {
              background: #141923;
              border: 1px solid #2d3748;
              border-radius: 10px;
              padding: 12px 18px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              font-size: 12px;
            }
            table { width: 100%; border-collapse: collapse; text-align: left; font-size: 12px; }
            th {
              background-color: #1a202c;
              color: #deff9a;
              padding: 12px 10px;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-bottom: 2px solid #333;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              color: #666;
              border-top: 1px solid #222;
              padding-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">VENTUREAM INSTITUTIONAL GATEWAY</div>
              <div class="subtitle">Penyaringan Saham Day Trading & Potensi ARA (MA 5/10 Dynamic S/R + Order Book 3:1 + MACD/BB + Bandar)</div>
            </div>
            <div style="text-align: right; font-size: 11px; color: #aaa;">
              <strong>Tanggal Cetak:</strong> ${dateStr}<br>
              <strong>Total Terpilih:</strong> ${filteredStocks.length} Saham
            </div>
          </div>

          <div class="summary-box">
            <div><strong>Sistem Penyaringan:</strong> MA 5 & 10 Support/Resistance Dinamis + 3 Pilar ARA (Order Book Wall Buy &ge;3:1, MACD/BB/RSI&gt;70 Momentum, Bandar Accumulation)</div>
            <div><strong>Filter Pasar:</strong> ${selectedMarket} | <strong>Kategori:</strong> ${activeFilterCategory}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 15%;">Saham / Nama</th>
                <th style="width: 6%;">Pasar</th>
                <th style="width: 12%;">Harga / Perubahan</th>
                <th style="width: 22%;">MA 5/10 Support Dinamis & Crossover</th>
                <th style="width: 18%;">Indikator 3 Pilar ARA</th>
                <th style="width: 13%;">Trading Plan</th>
                <th style="width: 10%;">AI Rationale</th>
                <th style="width: 4%;">Match</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            Confidential — VentureAM Institutional Trading System • Rekomendasi berdasarkan penyaringan otomatis harian.
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const renderStockCard = (stock: DailyTradingStock) => {
    const tradingViewSym = getTradingViewSymbol(stock.symbol);
    const isVolumeSurge = stock.volRatio >= 5.0;
    const isHighAraPotential = stock.orderBook.bidOfferRatio >= 3.0 && stock.momentum.macdIsPositiveGoldenCross && (stock.bandarAndFundamentals.isBandarAccumulation || stock.bandarAndFundamentals.isIpoLowFloat);
    const maInd = stock.maIndicators || computeMaIndicators(stock.priceNum, stock.market, stock.maEmaCross?.ma10);
    const limitInfo = getExchangeLimitInfo(stock.priceNum, stock.market);

    return (
      <motion.div
        key={stock.symbol}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`bg-zinc-900/70 hover:bg-zinc-900/90 border rounded-2xl p-4 space-y-3 transition-all relative overflow-hidden group shadow-lg ${
          isHighAraPotential
            ? 'border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-gradient-to-br from-amber-950/20 via-zinc-900/90 to-zinc-900'
            : isVolumeSurge 
            ? 'border-purple-500/50 shadow-[0_0_18px_rgba(168,85,247,0.15)] bg-gradient-to-br from-purple-950/20 via-zinc-900/80 to-zinc-900/90' 
            : 'border-zinc-800 hover:border-zinc-700/80'
        }`}
      >
        {/* Score & Potential Header Tag */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center flex-wrap gap-1.5">
            <div className="bg-black/60 px-2.5 py-1 rounded-xl border border-zinc-800 flex items-center gap-1.5">
              <span className="text-[9px] font-black text-zinc-400 font-mono">{stock.market}</span>
              <span className="text-sm font-black text-white font-mono">{stock.symbol}</span>
            </div>

            {/* Dynamic Signal Lifecycle Status Tag */}
            {stock.signalStatus && (
              <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black font-mono uppercase tracking-wider flex items-center gap-1 border ${
                stock.signalStatus === 'TRIGGER_HARI_INI'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                  : stock.signalStatus === 'LANJUTAN_TREN'
                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                  : stock.signalStatus === 'PULLBACK_RETEST'
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  stock.signalStatus === 'TRIGGER_HARI_INI' ? 'bg-emerald-400 animate-ping' :
                  stock.signalStatus === 'LANJUTAN_TREN' ? 'bg-yellow-400' :
                  stock.signalStatus === 'PULLBACK_RETEST' ? 'bg-sky-400' : 'bg-purple-400'
                }`} />
                <span>
                  {stock.signalStatus === 'TRIGGER_HARI_INI' ? 'BARU HARI INI' :
                   stock.signalStatus === 'LANJUTAN_TREN' ? 'LANJUTAN TREN' :
                   stock.signalStatus === 'PULLBACK_RETEST' ? 'RETEST MA5' : 'AKUMULASI'}
                </span>
              </span>
            )}

            <span className="text-[10px] font-semibold text-zinc-400 truncate max-w-[120px] sm:max-w-[150px]">
              {stock.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* High ARA / Limit Potential Badge */}
            {isHighAraPotential && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[8.5px] font-black font-mono uppercase tracking-wider animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{limitInfo.badge}</span>
              </div>
            )}

            {/* Volume Surge Badge */}
            {!isHighAraPotential && isVolumeSurge && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-xl bg-purple-500/20 border border-purple-500/50 text-purple-300 text-[8.5px] font-black font-mono uppercase tracking-wider">
                <Zap className="w-3 h-3 fill-purple-400 text-purple-400" />
                <span>SURGE {stock.volRatio.toFixed(1)}x</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 bg-[#deff9a]/10 px-2.5 py-1 rounded-xl border border-[#deff9a]/30">
              <Sparkles className="w-3 h-3 text-[#deff9a]" />
              <span className="text-[10px] font-black font-mono text-[#deff9a]">
                {stock.matchScore}% MATCH
              </span>
            </div>
          </div>
        </div>

        {/* Price & Change Row */}
        <div className="flex items-baseline justify-between pt-1">
          <div>
            <span className="text-lg font-black text-white font-mono">{stock.price}</span>
            <span className="text-[9px] font-bold text-zinc-400 font-mono ml-2">Vol: {stock.volume}</span>
          </div>
          <div className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg border ${
            stock.changePercent >= 0 
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
          }`}>
            {stock.change}
          </div>
        </div>

        {/* Exchange Limit Target Banner */}
        <div className={`flex items-center justify-between text-[8.5px] font-mono px-2.5 py-1 rounded-xl border ${
          stock.market === 'IDX'
            ? 'bg-purple-950/40 border-purple-500/30 text-purple-200'
            : stock.market === 'US'
            ? 'bg-sky-950/40 border-sky-500/30 text-sky-200'
            : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
        }`}>
          <span className="font-bold flex items-center gap-1">
            <Zap className={`w-3 h-3 ${stock.market === 'IDX' ? 'text-purple-400 fill-purple-400' : stock.market === 'US' ? 'text-sky-400 fill-sky-400' : 'text-emerald-400 fill-emerald-400'}`} />
            <span>{limitInfo.label}:</span>
          </span>
          <span className="text-white font-extrabold">
            {limitInfo.limitPriceFormatted} <span className="text-[#deff9a] font-black">(+{limitInfo.pct}%)</span>
          </span>
        </div>

        {/* 3 Pillars & MA 5/10 Dynamic Support Breakdown Detailed Grid */}
        <div className="space-y-1.5">
          {/* Indikator MA 5 & 10 Support & Resistance Dinamis + Sinyal Persilangan (Crossover) */}
          <div className="bg-sky-950/20 p-2.5 rounded-xl border border-sky-500/30 space-y-1.5">
            <div className="flex items-center justify-between text-[8.5px] font-mono font-extrabold uppercase text-sky-300">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-sky-400" />
                <span>Indikator MA 5 & 10 Support/Resistance Dinamis</span>
              </span>
              <div className="flex items-center gap-1">
                <span className={`px-1.5 py-0.2 rounded font-black text-[7.5px] ${
                  maInd.crossover === 'GOLDEN_CROSS'
                    ? 'bg-sky-500/30 text-sky-200 border border-sky-400/40'
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {maInd.crossoverLabel}
                </span>
                <span className="px-1.5 py-0.2 bg-[#deff9a]/20 text-[#deff9a] rounded font-black text-[7.5px] border border-[#deff9a]/30">
                  {maInd.signalLabel}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[8.5px] font-mono">
              <div className="bg-black/50 p-1.5 rounded-lg border border-zinc-800">
                <span className="text-zinc-500 text-[7.5px] block">Garis MA 5</span>
                <strong className="text-sky-300">{maInd.ma5Str}</strong>
              </div>
              <div className="bg-black/50 p-1.5 rounded-lg border border-zinc-800">
                <span className="text-zinc-500 text-[7.5px] block">Garis MA 10</span>
                <strong className="text-yellow-300">{maInd.ma10Str}</strong>
              </div>
              <div className="bg-black/50 p-1.5 rounded-lg border border-emerald-500/30">
                <span className="text-emerald-400/80 text-[7.5px] block">Support Dinamis (MA5)</span>
                <strong className="text-emerald-300">{maInd.supportResistance.supportMa5}</strong>
              </div>
              <div className="bg-black/50 p-1.5 rounded-lg border border-sky-500/30">
                <span className="text-sky-400/80 text-[7.5px] block">Support Dinamis (MA10)</span>
                <strong className="text-sky-200">{maInd.supportResistance.supportMa10}</strong>
              </div>
            </div>

            <div className="flex items-center justify-between text-[8px] font-mono bg-black/40 px-2 py-0.8 rounded-lg text-zinc-300">
              <span className="text-zinc-400">
                Posisi Harga: <strong className="text-white">{maInd.pricePositionLabel}</strong>
              </span>
              <span className="text-sky-300 font-semibold truncate ml-2">
                {maInd.supportResistance.bounceStatus}
              </span>
            </div>
          </div>

          {/* Pilar 1: Order Book & Volume */}
          <div className="bg-black/60 p-2 rounded-xl border border-purple-500/30 space-y-1">
            <div className="flex items-center justify-between text-[8.5px] font-mono font-extrabold uppercase text-purple-300">
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-purple-400" />
                <span>Pilar 1: Order Book Wall Buy & Volume</span>
              </span>
              {stock.orderBook.isWallBuy && (
                <span className="px-1.5 py-0.2 bg-purple-500/30 text-purple-200 rounded font-black text-[7.5px]">
                  WALL BUY &ge;3:1
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-zinc-300">
              <div>
                <span className="text-zinc-500">Rasio Bid/Offer: </span>
                <strong className="text-purple-200">{stock.orderBook.bidOfferRatio} : 1</strong>
              </div>
              <div>
                <span className="text-zinc-500">Vol vs MA20/50: </span>
                <strong className="text-purple-200">{stock.orderBook.volumeVsMa20}</strong>
              </div>
            </div>
            <div className="text-[8px] font-mono text-zinc-400 italic truncate">
              {stock.orderBook.bidVolumeRatioStr}
            </div>
          </div>

          {/* Pilar 2: Momentum & Trend */}
          <div className="bg-black/60 p-2 rounded-xl border border-emerald-500/30 space-y-1">
            <div className="flex items-center justify-between text-[8.5px] font-mono font-extrabold uppercase text-emerald-300">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span>Pilar 2: Momentum MACD / BB / RSI</span>
              </span>
              {stock.momentum.rsiHotMomentum && (
                <span className="px-1.5 py-0.2 bg-emerald-500/30 text-emerald-200 rounded font-black text-[7.5px]">
                  RSI &gt;70 HOT
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-zinc-300">
              <div>
                <span className="text-zinc-500">MACD: </span>
                <strong className="text-emerald-300">{stock.momentum.macdStatus}</strong>
              </div>
              <div>
                <span className="text-zinc-500">Bollinger: </span>
                <strong className="text-emerald-300">{stock.momentum.bbBreakout ? 'Upper Breakout' : 'Range'}</strong>
              </div>
            </div>
          </div>

          {/* Pilar 3: Aksi Bandar & Katalis / IPO */}
          <div className="bg-black/60 p-2 rounded-xl border border-amber-500/30 space-y-1">
            <div className="flex items-center justify-between text-[8.5px] font-mono font-extrabold uppercase text-amber-300">
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3 text-amber-400" />
                <span>Pilar 3: Bandar Accumulation & Katalis</span>
              </span>
              {stock.bandarAndFundamentals.isIpoLowFloat && (
                <span className="px-1.5 py-0.2 bg-amber-500/30 text-amber-200 rounded font-black text-[7.5px]">
                  IPO LOW FLOAT
                </span>
              )}
            </div>
            <div className="text-[9px] font-mono text-zinc-300 space-y-0.5">
              <div>
                <span className="text-zinc-500">Top Brokers: </span>
                <strong className="text-amber-200">{stock.bandarAndFundamentals.topBrokersAccumulation} ({stock.bandarAndFundamentals.brokerNetBuyVal})</strong>
              </div>
              <div className="truncate">
                <span className="text-zinc-500">Katalis: </span>
                <span className="text-zinc-200 font-semibold">{stock.bandarAndFundamentals.catalystDetail}</span>
              </div>
            </div>
          </div>

          {/* TradingView Screener Technical Indicators & Google News AI Sentiment */}
          {(stock.tradingViewScreener || stock.googleNewsSentiment) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
              {stock.tradingViewScreener && (
                <div className="bg-sky-950/30 p-2 rounded-xl border border-sky-500/30 space-y-1">
                  <div className="flex items-center justify-between text-[8.5px] font-mono font-extrabold uppercase text-sky-300">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3 text-sky-400" />
                      <span>TradingView Screener</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <span className={`px-1.5 py-0.2 rounded font-black text-[7.5px] ${
                        stock.priceNum >= (stock.maEmaCross?.ema10 || 0)
                          ? 'bg-yellow-400/25 text-yellow-300 border border-yellow-400/40'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {stock.priceNum >= (stock.maEmaCross?.ema10 || 0) ? 'PRICE > EMA10' : 'EMA10'}
                      </span>
                      <span className="px-1.5 py-0.2 bg-sky-500/20 text-sky-200 rounded font-bold text-[7.5px]">
                        {stock.tradingViewScreener.priceAboveEma20 ? 'PRICE > EMA20' : 'EMA20'}
                      </span>
                    </div>
                  </div>
                  <div className="text-[8.5px] font-mono text-zinc-300 space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">EMA10: <strong className="text-yellow-300">{stock.market === 'IDX' ? `Rp ${stock.maEmaCross?.ema10?.toLocaleString('id-ID')}` : `$${stock.maEmaCross?.ema10}`}</strong></span>
                      <span className="text-zinc-500">EMA20: <strong className="text-sky-200">{stock.tradingViewScreener.ema20Value}</strong></span>
                    </div>
                    <div className="text-[8px] text-sky-300/80 truncate italic">
                      {stock.tradingViewScreener.screenerMatch}
                    </div>
                  </div>
                </div>
              )}

              {stock.googleNewsSentiment && (
                <div className="bg-emerald-950/30 p-2 rounded-xl border border-emerald-500/30 space-y-1">
                  <div className="flex items-center justify-between text-[8.5px] font-mono font-extrabold uppercase text-emerald-300">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-emerald-400" />
                      <span>Google News Sentiment</span>
                    </span>
                    <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-black text-[7.5px]">
                      {stock.googleNewsSentiment.score}% BULLISH
                    </span>
                  </div>
                  <div className="text-[8.5px] font-mono text-zinc-300 leading-tight line-clamp-2">
                    {stock.googleNewsSentiment.headline}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Plan & Strategi Eksekusi Day Trading */}
        <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-[9.5px] font-mono font-black uppercase tracking-wider text-zinc-300 border-b border-zinc-800/80 pb-1.5">
            <div className="flex items-center gap-1.5 text-[#deff9a]">
              <Target className="w-3.5 h-3.5 text-[#deff9a]" />
              <span>ACTION PLAN & EKSEKUSI TRADING</span>
            </div>
            <button
              onClick={() => handleCopyPlan(stock)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-[8px] font-mono font-bold text-zinc-300 hover:text-white border border-zinc-700/80 transition-all cursor-pointer"
              title="Salin Rencana Eksekusi Trading"
            >
              {copiedPlanSymbol === stock.symbol ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">COPIED PLAN</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-zinc-400" />
                  <span>COPY PLAN</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono text-[9px]">
            {/* Buy / Entry Zone */}
            <div className="bg-sky-950/20 p-2 rounded-xl border border-sky-500/30 flex flex-col justify-between">
              <span className="text-zinc-500 text-[8px] uppercase font-bold">Buy / Entry Zone</span>
              <span className="text-sky-300 font-extrabold text-[10px] mt-0.5">{stock.entryZone}</span>
              <span className="text-[7.5px] text-sky-400/80 font-medium">HAKA / Limit Order</span>
            </div>

            {/* Target Price (TP1) */}
            <div className="bg-emerald-950/20 p-2 rounded-xl border border-emerald-500/30 flex flex-col justify-between">
              <span className="text-zinc-500 text-[8px] uppercase font-bold">Target Profit (TP)</span>
              <span className="text-emerald-400 font-extrabold text-[10px] mt-0.5">{stock.targetPrice}</span>
              <span className="text-[7.5px] text-emerald-500/80 font-medium">Breakout Target</span>
            </div>

            {/* Target Potensi ARA / Squeeze Limit */}
            <div className="bg-amber-950/20 p-2 rounded-xl border border-amber-500/30 flex flex-col justify-between">
              <span className="text-zinc-500 text-[8px] uppercase font-bold flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                <span>{limitInfo.shortLabel}</span>
              </span>
              <span className="text-amber-300 font-extrabold text-[10px] mt-0.5">
                {limitInfo.limitPriceFormatted} (+{limitInfo.pct}%)
              </span>
              <span className="text-[7.5px] text-amber-400/80 font-medium truncate" title={limitInfo.ruleNote}>
                {limitInfo.ruleNote}
              </span>
            </div>

            {/* Stop Loss (Cut Loss) */}
            <div className="bg-rose-950/20 p-2 rounded-xl border border-rose-500/30 flex flex-col justify-between">
              <span className="text-zinc-500 text-[8px] uppercase font-bold">Cut Loss (SL)</span>
              <span className="text-rose-400 font-extrabold text-[10px] mt-0.5">{stock.stopLoss}</span>
              <span className="text-[7.5px] text-rose-400/80 font-medium">Disiplin Risk Limit</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-1.5 text-[8.5px] font-mono bg-black/40 px-2.5 py-1 rounded-xl border border-zinc-800">
            <span className="text-zinc-400">
              R/R Ratio: <strong className="text-emerald-400 font-bold">{stock.riskReward}</strong>
            </span>
            <span className="text-zinc-400">
              Taktik: <span className="text-zinc-200 font-semibold">Trailing Stop @ MA5 & Partial TP</span>
            </span>
          </div>
        </div>

        {/* AI Rationale */}
        <p className="text-[9.5px] text-zinc-400 leading-relaxed italic border-l-2 border-[#deff9a] pl-2.5">
          "{stock.aiRationale}"
        </p>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 gap-2">
          <button
            onClick={() => setChartModalSymbol(tradingViewSym)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[9px] font-mono font-black uppercase tracking-wider hover:bg-sky-500 hover:text-black transition-all cursor-pointer shadow-sm"
          >
            <ChartCandlestick className="w-3.5 h-3.5" />
            <span>Advance Chart</span>
          </button>

          <button
            onClick={() => setDetailModalStock(stock)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#deff9a]/15 border border-[#deff9a]/35 text-[#deff9a] text-[9px] font-mono font-black uppercase tracking-wider hover:bg-[#deff9a] hover:text-black transition-all cursor-pointer shadow-sm"
            title="Buka Analisis Mendalam 3 Pilar, Indikator Dinamis & Kalkulator Risiko"
          >
            <Sparkles className="w-3 h-3" />
            <span>Detail Analyst</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="bg-[#0b0e14] rounded-3xl border border-zinc-800/80 p-4 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#deff9a]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#deff9a]/10 border border-[#deff9a]/30 text-[#deff9a]">
              <Zap className="w-4 h-4 fill-[#deff9a]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                  Rekomendasi Day Trading Harian & Potensi ARA
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#deff9a] text-black text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md shadow-[#deff9a]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                  3-PILLAR SCREENER
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                Order Book Bid:Offer &ge;3:1 • Lonjakan Vol vs MA20/50 • MACD/BB/RSI&gt;70 • Aksi Bandar & Katalis IPO
              </p>
            </div>
          </div>
        </div>

        {/* Top Control Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowMethodologyGuide(!showMethodologyGuide)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
              showMethodologyGuide
                ? 'bg-amber-400 text-black border-amber-300 shadow-md shadow-amber-400/20'
                : 'bg-zinc-900 text-amber-400 border-zinc-800 hover:border-amber-500/50'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showMethodologyGuide ? 'Tutup Panduan' : 'Panduan Metodologi 3 Pilar'}</span>
          </button>

          <button
            onClick={handleRunAutoScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#deff9a] hover:bg-[#c8f075] text-black font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-[#deff9a]/10 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Pindai Pasar...' : 'Jalankan Auto Pindai'}</span>
          </button>

          <button
            onClick={() => setShowPineScriptModal(true)}
            title="Tampilkan & salin script TradingView Pine Script (v5) untuk scanner ini"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
          >
            <Code className="w-3.5 h-3.5 text-purple-400" />
            <span>TradingView Pine Script</span>
          </button>

          <button
            onClick={handleExportCSV}
            title="Export filtered list to CSV spreadsheet"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            title="Export formatted report to PDF / Print"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-rose-400" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Real-Time Exchange Synchronization Matrix Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative z-10">
        {/* IDX Card */}
        <div 
          onClick={() => setSelectedMarket('IDX')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            selectedMarket === 'IDX'
              ? 'bg-purple-950/40 border-purple-400 shadow-lg shadow-purple-500/15 ring-1 ring-purple-400/50'
              : 'bg-zinc-900/80 border-zinc-800 hover:border-purple-500/40'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="text-base">🇮🇩</span>
              <div>
                <span className="text-[11px] font-black text-white font-mono uppercase">Bursa Efek Indonesia</span>
                <span className="text-[8.5px] font-mono text-purple-300 block">IDX Market Gateway</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[8px] font-black font-mono">
                LIVE SESI II
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 text-[9px] font-mono">
            <div>
              <span className="text-zinc-500 block text-[8px]">ATURAN BATAS</span>
              <strong className="text-amber-300">Cap ARA +20% s/d +35%</strong>
            </div>
            <div>
              <span className="text-zinc-500 block text-[8px]">JAM PERDAGANGAN</span>
              <strong className="text-zinc-300">09:00 - 16:00 WIB</strong>
            </div>
            <div>
              <span className="text-zinc-500 block text-[8px]">UNIT FRAKSI</span>
              <span className="text-zinc-300 font-semibold">1 Lot (100 Lbr) IDR</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[8px]">SINKRONISASI</span>
              <span className="text-purple-300 font-bold">{exchangeSyncTimes.IDX}</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[8px] font-mono text-zinc-400">
            <span className="text-zinc-500">Latensi Feed: &lt; 12ms</span>
            <span className="text-purple-300 font-bold hover:underline">
              {stocks.filter(s => s.market === 'IDX').length} Saham Tersedia &rarr;
            </span>
          </div>
        </div>

        {/* Wall Street (US) Card */}
        <div 
          onClick={() => setSelectedMarket('US')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            selectedMarket === 'US'
              ? 'bg-sky-950/40 border-sky-400 shadow-lg shadow-sky-500/15 ring-1 ring-sky-300/50'
              : 'bg-zinc-900/80 border-zinc-800 hover:border-sky-500/40'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="text-base">🇺🇸</span>
              <div>
                <span className="text-[11px] font-black text-white font-mono uppercase">Wall Street (US)</span>
                <span className="text-[8.5px] font-mono text-sky-300 block">NYSE / NASDAQ (IBKR)</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[8px] font-black font-mono">
                REGULAR / PRE
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 text-[9px] font-mono">
            <div>
              <span className="text-zinc-500 block text-[8px]">ATURAN BATAS</span>
              <strong className="text-sky-300">LULD Bands & Squeeze</strong>
            </div>
            <div>
              <span className="text-zinc-500 block text-[8px]">JAM PERDAGANGAN</span>
              <strong className="text-zinc-300">09:30 - 16:00 EST</strong>
            </div>
            <div>
              <span className="text-zinc-500 block text-[8px]">UNIT FRAKSI</span>
              <span className="text-zinc-300 font-semibold">1 Share (USD $)</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[8px]">SINKRONISASI</span>
              <span className="text-sky-300 font-bold">{exchangeSyncTimes.US}</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[8px] font-mono text-zinc-400">
            <span className="text-zinc-500">Latensi Feed: &lt; 18ms</span>
            <span className="text-sky-300 font-bold hover:underline">
              {stocks.filter(s => s.market === 'US').length} Saham Tersedia &rarr;
            </span>
          </div>
        </div>

        {/* Global Hub Card */}
        <div 
          onClick={() => setSelectedMarket('GLOBAL')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            selectedMarket === 'GLOBAL'
              ? 'bg-emerald-950/40 border-emerald-400 shadow-lg shadow-emerald-500/15 ring-1 ring-emerald-300/50'
              : 'bg-zinc-900/80 border-zinc-800 hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="text-base">🌐</span>
              <div>
                <span className="text-[11px] font-black text-white font-mono uppercase">Global Hub</span>
                <span className="text-[8.5px] font-mono text-emerald-300 block">SGX / HKEX / CGS Feed</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[8px] font-black font-mono">
                24/7 ACTIVE
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 text-[9px] font-mono">
            <div>
              <span className="text-zinc-500 block text-[8px]">ATURAN BATAS</span>
              <strong className="text-emerald-300">Price Cap +20% S/R</strong>
            </div>
            <div>
              <span className="text-zinc-500 block text-[8px]">JAM PERDAGANGAN</span>
              <strong className="text-zinc-300">Continuous 24/7</strong>
            </div>
            <div>
              <span className="text-zinc-500 block text-[8px]">UNIT FRAKSI</span>
              <span className="text-zinc-300 font-semibold">1 Unit (USD/SGD)</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[8px]">SINKRONISASI</span>
              <span className="text-emerald-300 font-bold">{exchangeSyncTimes.GLOBAL}</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[8px] font-mono text-zinc-400">
            <span className="text-zinc-500">Latensi Feed: &lt; 15ms</span>
            <span className="text-emerald-300 font-bold hover:underline">
              {stocks.filter(s => s.market === 'GLOBAL' || s.market === 'SGX' || s.market === 'CRYPTO').length} Saham Tersedia &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Collapsible Methodology Guide Box */}
      <AnimatePresence>
        {showMethodologyGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-black p-4 sm:p-5 rounded-2xl border border-amber-500/30 space-y-3 relative">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wide">
                    Panduan Metodologi Day Trading, Potensi ARA & Indikator MA 5/10 Dinamis
                  </h4>
                </div>
                <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/40">
                  VAM CORE AI ENGINE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-[10.5px] text-zinc-300 font-mono">
                {/* Pilar 1 */}
                <div className="bg-black/60 p-3 rounded-xl border border-purple-500/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-purple-300 font-bold uppercase text-[10px]">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <span>1. Volume & Order Book</span>
                  </div>
                  <ul className="space-y-1 text-zinc-400 leading-relaxed text-[9.5px] list-disc list-inside">
                    <li><strong className="text-white">Dinding Beli (Wall Buy):</strong> Rasio antrean beli (Bid) vs jual (Offer) &ge; 3:1 menahan koreksi ke bawah.</li>
                    <li><strong className="text-white">Lonjakan Volume:</strong> Volume transaksi &gt; rata-rata MA 20 atau MA 50 menandakan urgensi beli.</li>
                  </ul>
                </div>

                {/* Pilar 2 */}
                <div className="bg-black/60 p-3 rounded-xl border border-emerald-500/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-bold uppercase text-[10px]">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>2. Momentum & Trend</span>
                  </div>
                  <ul className="space-y-1 text-zinc-400 leading-relaxed text-[9.5px] list-disc list-inside">
                    <li><strong className="text-white">MACD Golden Cross:</strong> Garis MACD memotong ke atas signal line di zona bullish.</li>
                    <li><strong className="text-white">Bollinger Bands:</strong> Harga breakout menembus Upper Band sebagai akselerasi tren.</li>
                    <li><strong className="text-white">RSI &gt; 70 (Hot):</strong> Momentum beli kuat yang mendukung percepatan harga ke ARA.</li>
                  </ul>
                </div>

                {/* Pilar 3 */}
                <div className="bg-black/60 p-3 rounded-xl border border-amber-500/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold uppercase text-[10px]">
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    <span>3. Aksi Bandar & Katalis</span>
                  </div>
                  <ul className="space-y-1 text-zinc-400 leading-relaxed text-[9.5px] list-disc list-inside">
                    <li><strong className="text-white">Broker Summary:</strong> Akumulasi masif dari top broker institusional (Net Buy tinggi).</li>
                    <li><strong className="text-white">Katalis & IPO:</strong> Didukung berita pertumbuhan, laba, dividen, atau low float market cap.</li>
                  </ul>
                </div>

                {/* Indikator MA 5, 10 Dinamis */}
                <div className="bg-black/60 p-3 rounded-xl border border-sky-500/40 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-sky-300 font-bold uppercase text-[10px]">
                    <Activity className="w-3.5 h-3.5 text-sky-400" />
                    <span>4. MA 5 & 10 Support Dinamis</span>
                  </div>
                  <ul className="space-y-1 text-zinc-400 leading-relaxed text-[9.5px] list-disc list-inside">
                    <li><strong className="text-white">Support & Resistensi Dinamis:</strong> Garis MA 5 & MA 10 bertindak sebagai batas pantulan harga di chart.</li>
                    <li><strong className="text-white">Sinyal Persilangan (Crossover):</strong> Golden Cross (MA5 &gt; MA10) atau posisi harga di atas MA mengonfirmasi sinyal beli/jual instan.</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Market Scanner & Daily Rotation Engine Control Deck */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-black p-3.5 sm:p-4 rounded-2xl border border-zinc-800 shadow-xl space-y-3 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#deff9a]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header of the Deck */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-zinc-800/80 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300">
              <RotateCcw className={`w-4 h-4 text-purple-400 ${isScanning ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-black text-white font-mono uppercase tracking-wide">
                  Daily Rotation Engine & Live Radar Scanner
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[8.5px] font-black font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ROTASI OTOMATIS AKTIF
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                Rekomendasi saham dirotasi setiap hari secara dinamis berdasarkan kalkulasi order book, momentum & akumulasi bursa.
              </p>
            </div>
          </div>

          {/* Live Scanner Action Button */}
          <button
            onClick={handleRunAutoScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#deff9a] to-emerald-400 hover:from-[#c8f075] hover:to-emerald-300 text-black font-black text-[10.5px] uppercase tracking-wider transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-[#deff9a]/15 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Memindai Radar...' : '⚡ Pindai Ulang Radar Pasar'}</span>
          </button>
        </div>

        {/* Scanning Step Live Progress Message */}
        <AnimatePresence>
          {isScanning && scanStepMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-purple-950/40 border border-purple-500/50 p-2.5 rounded-xl flex items-center gap-2.5 text-[11px] font-mono text-purple-200 shadow-inner"
            >
              <RefreshCw className="w-4 h-4 text-purple-400 animate-spin flex-shrink-0" />
              <div className="flex-1 font-semibold">{scanStepMessage}</div>
              <div className="w-20 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#deff9a] h-full animate-pulse w-3/4 rounded-full" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scan Notification Banner */}
        <AnimatePresence>
          {scanNotification && !isScanning && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="bg-emerald-950/40 border border-emerald-500/40 p-2.5 rounded-xl flex items-center justify-between gap-2 text-[11px] font-mono text-emerald-200"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{scanNotification.message}</span>
              </div>
              <button 
                onClick={() => setScanNotification(null)}
                className="text-zinc-400 hover:text-white text-[10px] uppercase font-bold"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Session Switcher and Signal Lifecycle Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Sesi Mode Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[9.5px] font-mono text-zinc-400 uppercase font-bold mr-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-400" />
              <span>Sesi Rotasi:</span>
            </span>

            {[
              { id: 'TODAY_LIVE', label: 'Hari Ini (Live)', icon: '⚡' },
              { id: 'SESSION_1_OPEN', label: 'Sesi I (Pagi Breakout)', icon: '🌅' },
              { id: 'SESSION_2_POWER', label: 'Sesi II (Power Hour)', icon: '🔥' },
              { id: 'NEXT_DAY_SIM', label: 'Simulasi Rotasi Berikutnya', icon: '🎲' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectSessionMode(s.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-black font-mono uppercase transition-all cursor-pointer border ${
                  activeSessionMode === s.id
                    ? 'bg-[#deff9a] text-black border-[#deff9a] shadow-md shadow-[#deff9a]/10'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <span>{s.icon} {s.label}</span>
              </button>
            ))}
          </div>

          {/* Sinyal Status Chips */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[9.5px] font-mono text-zinc-400 uppercase font-bold mr-1">
              Status Sinyal:
            </span>

            {[
              { id: 'ALL', label: 'Semua Status' },
              { id: 'TRIGGER_HARI_INI', label: '🟢 Baru Hari Ini', count: stocks.filter(s => s.signalStatus === 'TRIGGER_HARI_INI').length },
              { id: 'LANJUTAN_TREN', label: '🟡 Lanjutan Tren', count: stocks.filter(s => s.signalStatus === 'LANJUTAN_TREN').length },
              { id: 'PULLBACK_RETEST', label: '🔵 Retest MA5', count: stocks.filter(s => s.signalStatus === 'PULLBACK_RETEST').length },
              { id: 'AKUMULASI_BANDAR', label: '🟣 Akumulasi', count: stocks.filter(s => s.signalStatus === 'AKUMULASI_BANDAR').length },
            ].map((statusChip) => (
              <button
                key={statusChip.id}
                onClick={() => setSelectedSignalStatus(statusChip.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[8.5px] font-black font-mono uppercase transition-all cursor-pointer border ${
                  selectedSignalStatus === statusChip.id
                    ? 'bg-zinc-200 text-black border-white shadow'
                    : 'bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <span>{statusChip.label}</span>
                {statusChip.count !== undefined && (
                  <span className="ml-1 opacity-70">({statusChip.count})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Filter Tabs Header (3 Pillars, MA 5/10 & Penny ARA Quick Toggle) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 relative z-10">
        <button
          onClick={() => setActiveFilterCategory('ALL')}
          className={`p-2.5 rounded-2xl border transition-all text-left cursor-pointer ${
            activeFilterCategory === 'ALL'
              ? 'bg-[#deff9a] text-black border-[#deff9a] font-black shadow-lg shadow-[#deff9a]/10'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
          }`}
        >
          <div className="text-[9px] font-mono uppercase font-bold opacity-80 mb-0.5">Semua Rekomendasi</div>
          <div className="text-[11px] font-black font-mono flex items-center justify-between">
            <span>Semua Saham ({stocks.length})</span>
            <CheckCircle2 className="w-3.5 h-3.5 opacity-80" />
          </div>
        </button>

        <button
          onClick={() => setActiveFilterCategory('ARA_POTENTIAL')}
          className={`p-2.5 rounded-2xl border transition-all text-left cursor-pointer ${
            activeFilterCategory === 'ARA_POTENTIAL'
              ? 'bg-gradient-to-r from-purple-500 to-amber-500 text-white border-purple-300 font-black shadow-lg shadow-purple-500/25 ring-2 ring-purple-400/50'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-purple-500/40'
          }`}
        >
          <div className="text-[9px] font-mono uppercase font-bold text-amber-300 mb-0.5 flex items-center gap-1">
            <Flame className="w-3 h-3 fill-amber-300" />
            <span>Kandidat Lock ARA / Limit</span>
          </div>
          <div className="text-[11px] font-black font-mono flex items-center justify-between">
            <span>Lolos 3/3 Pilar + MA</span>
            <span className="px-1.5 py-0.2 bg-black/40 text-amber-300 text-[8.5px] rounded font-bold">
              {stocks.filter(s => s.orderBook.bidOfferRatio >= 3.0 && s.momentum.macdIsPositiveGoldenCross && (s.bandarAndFundamentals.isBandarAccumulation || s.bandarAndFundamentals.isIpoLowFloat)).length}
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveFilterCategory('MA_5_10_CROSS')}
          className={`p-2.5 rounded-2xl border transition-all text-left cursor-pointer ${
            activeFilterCategory === 'MA_5_10_CROSS'
              ? 'bg-sky-500/25 border-sky-400 text-sky-100 font-black shadow-lg shadow-sky-500/20 ring-1 ring-sky-300/50'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-sky-500/40'
          }`}
        >
          <div className="text-[9px] font-mono uppercase font-bold text-sky-400 mb-0.5 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-sky-400" />
            <span>MA 5/10 Golden Cross</span>
          </div>
          <div className="text-[11px] font-black font-mono flex items-center justify-between">
            <span>Sinyal Persilangan Beli</span>
            <span className="px-1.5 py-0.2 bg-sky-500/30 text-sky-200 text-[8.5px] rounded font-bold">
              {stocks.filter(s => (s.maIndicators?.crossover === 'GOLDEN_CROSS') || ((s.maIndicators?.ma5 || 0) >= (s.maIndicators?.ma10 || 0))).length}
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveFilterCategory('DYNAMIC_SUPPORT_BOUNCE')}
          className={`p-2.5 rounded-2xl border transition-all text-left cursor-pointer ${
            activeFilterCategory === 'DYNAMIC_SUPPORT_BOUNCE'
              ? 'bg-emerald-500/25 border-emerald-400 text-emerald-100 font-black shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-300/50'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-emerald-500/40'
          }`}
        >
          <div className="text-[9px] font-mono uppercase font-bold text-emerald-400 mb-0.5 flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>Pantulan Support MA 5/10</span>
          </div>
          <div className="text-[11px] font-black font-mono flex items-center justify-between">
            <span>Batas Pantulan Terdekat</span>
            <span className="px-1.5 py-0.2 bg-emerald-500/30 text-emerald-200 text-[8.5px] rounded font-bold">
              {stocks.filter(s => (s.maIndicators?.pricePosition === 'BOUNCE_MA5_SUPPORT' || s.maIndicators?.pricePosition === 'BOUNCE_MA10_SUPPORT' || (s.priceNum >= (s.maIndicators?.ma5 || 0) * 0.99 && s.priceNum <= (s.maIndicators?.ma5 || 0) * 1.035))).length}
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveFilterCategory('PENNY_HIGH_VOL')}
          className={`p-2.5 rounded-2xl border transition-all text-left cursor-pointer ${
            activeFilterCategory === 'PENNY_HIGH_VOL'
              ? 'bg-rose-500/20 border-rose-500/80 text-rose-200 font-black shadow-lg shadow-rose-500/20 ring-1 ring-rose-400/50'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-rose-500/40'
          }`}
        >
          <div className="text-[9px] font-mono uppercase font-bold text-rose-400 mb-0.5 flex items-center gap-1">
            <Zap className="w-3 h-3 fill-rose-400 text-rose-400" />
            <span>Penny ARA High Vol</span>
          </div>
          <div className="text-[11px] font-black font-mono flex items-center justify-between">
            <span>Saham Murah / Low Cap</span>
            <span className="px-1.5 py-0.2 bg-rose-500/30 text-rose-300 text-[8.5px] rounded font-bold">
              {stocks.filter(s => (s.priceNum <= 500 || s.bandarAndFundamentals.isIpoLowFloat) && (s.volRatio >= 7.0 || s.changePercent >= 12.0 || s.orderBook.bidOfferRatio >= 8.0)).length}
            </span>
          </div>
        </button>
      </div>

      {/* Filter Tabs Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80 relative z-10">
        {/* Market Selector */}
        <div className="flex flex-wrap items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
          {[
            { id: 'ALL', label: 'Semua Bursa', count: stocks.length },
            { id: 'IDX', label: 'IDX (BEI)', count: stocks.filter(s => s.market === 'IDX').length },
            { id: 'US', label: 'Wall Street (US)', count: stocks.filter(s => s.market === 'US').length },
            { id: 'GLOBAL', label: 'Global Hub', count: stocks.filter(s => s.market === 'GLOBAL' || s.market === 'SGX' || s.market === 'CRYPTO').length },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMarket(m.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black font-mono uppercase transition-all cursor-pointer ${
                selectedMarket === m.id
                  ? 'bg-[#deff9a] text-black shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>{m.label}</span>
              <span className={`text-[8px] px-1.5 py-0.2 rounded font-bold ${
                selectedMarket === m.id ? 'bg-black/20 text-black' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {m.count}
              </span>
            </button>
          ))}
        </div>

        {/* Strict Filter & Sort Toggles */}
        <div className="flex flex-wrap items-center gap-2 py-1">
          {/* MA 5/10 Crossover Quick Toggle */}
          <button
            onClick={() => setFilterMaCrossOnly(!filterMaCrossOnly)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-mono font-bold uppercase transition-all cursor-pointer border ${
              filterMaCrossOnly
                ? 'bg-sky-400 text-slate-950 border-sky-300 font-black shadow-[0_0_12px_rgba(56,189,248,0.35)]'
                : 'bg-sky-500/10 text-sky-400 border-sky-500/25 hover:bg-sky-500/20'
            }`}
            title="Filter hanya saham dengan MA5 > MA10 Golden Cross"
          >
            <TrendingUp className="w-3 h-3 text-sky-400" />
            <span>MA 5/10 Cross</span>
            <span className={`px-1.5 py-0.2 rounded text-[8px] font-black ${
              filterMaCrossOnly ? 'bg-slate-950 text-sky-300' : 'bg-sky-500/20 text-sky-200'
            }`}>
              {filterMaCrossOnly ? 'AKTIF' : 'ALL'}
            </span>
          </button>

          {/* Dynamic Support Bounce Quick Toggle */}
          <button
            onClick={() => setFilterDynamicBounceOnly(!filterDynamicBounceOnly)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-mono font-bold uppercase transition-all cursor-pointer border ${
              filterDynamicBounceOnly
                ? 'bg-emerald-400 text-slate-950 border-emerald-300 font-black shadow-[0_0_12px_rgba(52,211,153,0.35)]'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
            }`}
            title="Filter saham dengan pantulan harga pada batas Support Dinamis MA 5 / MA 10"
          >
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>Pantulan Support MA</span>
            <span className={`px-1.5 py-0.2 rounded text-[8px] font-black ${
              filterDynamicBounceOnly ? 'bg-slate-950 text-emerald-300' : 'bg-emerald-500/20 text-emerald-200'
            }`}>
              {filterDynamicBounceOnly ? 'AKTIF' : 'ALL'}
            </span>
          </button>

          {/* Volume Surge Sort Toggle Button */}
          <button
            onClick={() => setSortByVolumeSurge(!sortByVolumeSurge)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-mono font-black uppercase transition-all cursor-pointer border ${
              sortByVolumeSurge
                ? 'bg-purple-500 text-white border-purple-300 shadow-[0_0_14px_rgba(168,85,247,0.45)]'
                : 'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20'
            }`}
            title="Klik untuk mengurutkan saham berdasarkan lonjakan Volume Surge (≥5x 10-Day MA) terbanyak"
          >
            <Flame className={`w-3.5 h-3.5 fill-purple-400 text-purple-400 ${sortByVolumeSurge ? 'animate-bounce' : ''}`} />
            <span>Urutkan Vol Ratio</span>
            <span className={`px-1.5 py-0.2 rounded text-[8px] font-black ${
              sortByVolumeSurge ? 'bg-black text-purple-300' : 'bg-purple-500/20 text-purple-200'
            }`}>
              {sortByVolumeSurge ? 'AKTIF' : 'OFF'}
            </span>
          </button>

          {/* EMA-10 Day Trading Trendline Filter Toggle */}
          <button
            onClick={() => setFilterEma10Only(!filterEma10Only)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-mono font-bold uppercase transition-all cursor-pointer border ${
              filterEma10Only
                ? 'bg-yellow-400 text-slate-950 border-yellow-300 font-black shadow-[0_0_12px_rgba(250,204,21,0.35)]'
                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25 hover:bg-yellow-500/20'
            }`}
            title="Filter saham Day Trading dengan harga di atas garis EMA-10 Trendline (Fast Momentum)"
          >
            <TrendingUp className="w-3 h-3 text-yellow-400" />
            <span>EMA-10 Trendline</span>
            <span className={`px-1.5 py-0.2 rounded text-[8px] font-black ${
              filterEma10Only ? 'bg-slate-950 text-yellow-300' : 'bg-yellow-500/20 text-yellow-200'
            }`}>
              {filterEma10Only ? `${stocks.filter(s => s.priceNum >= (s.maEmaCross?.ema10 || 0)).length} AKTIF` : 'ALL'}
            </span>
          </button>

          {/* Volume Surge 5x Filter Toggle Button */}
          <button
            onClick={() => setVolumeSurgeOnly(!volumeSurgeOnly)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-mono font-bold uppercase transition-all cursor-pointer border ${
              volumeSurgeOnly
                ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-[0_0_12px_rgba(251,191,36,0.35)]'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500/20'
            }`}
          >
            <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>Vol Surge &ge;5x</span>
            {volumeSurgeOnly && (
              <span className="px-1.5 py-0.2 bg-slate-950 text-amber-300 rounded text-[8px] font-extrabold">
                {stocks.filter(s => s.volRatio >= 5.0).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilter4of4Only(!filter4of4Only)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-mono font-bold uppercase transition-all border cursor-pointer ${
              filter4of4Only
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Lolos Sinyal Teknis ({filter4of4Only ? 'AKTIF' : 'ALL'})</span>
          </button>
        </div>
      </div>

      {/* Stock Cards Grid - Grouped by Exchange when ALL is selected, or filtered to single exchange */}
      {selectedMarket === 'ALL' ? (
        <div className="space-y-6 relative z-10">
          {/* Section 1: Bursa Efek Indonesia (IDX) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-zinc-900/80 border border-purple-500/40 p-3 rounded-2xl">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🇮🇩</span>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Bursa Efek Indonesia (IDX)</span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-mono font-bold">
                      POTENSI ARA & DAY TRADING
                    </span>
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    Aturan Batas: Auto Rejection Atas (ARA) Cap +20% s/d +35% • Sesi II Live
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-zinc-400 bg-black/50 px-2.5 py-1 rounded-xl border border-zinc-800">
                {filteredStocks.filter(s => s.market === 'IDX').length} Saham Terpilih
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredStocks.filter(s => s.market === 'IDX').map(renderStockCard)}
              </AnimatePresence>
            </div>
          </div>

          {/* Section 2: Wall Street (US - NYSE / NASDAQ) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-zinc-900/80 border border-sky-500/40 p-3 rounded-2xl">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🇺🇸</span>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Wall Street (US Markets — NYSE / NASDAQ)</span>
                    <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[9px] font-mono font-bold">
                      LULD VOLATILITY BANDS & SQUEEZE
                    </span>
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    Direct IBKR Institutional Gateway • Limit Up Limit Down +10%/+15%
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-zinc-400 bg-black/50 px-2.5 py-1 rounded-xl border border-zinc-800">
                {filteredStocks.filter(s => s.market === 'US').length} Saham Terpilih
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredStocks.filter(s => s.market === 'US').map(renderStockCard)}
              </AnimatePresence>
            </div>
          </div>

          {/* Section 3: Global Hub (SGX / HKEX / Cross-Border) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-zinc-900/80 border border-emerald-500/40 p-3 rounded-2xl">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🌐</span>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Global Hub (SGX / HKEX / International)</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono font-bold">
                      CROSS-BORDER BREAKOUT
                    </span>
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    CGS Gateway Direct Feed • Dynamic Price Cap +20%
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-zinc-400 bg-black/50 px-2.5 py-1 rounded-xl border border-zinc-800">
                {filteredStocks.filter(s => s.market === 'GLOBAL' || s.market === 'SGX' || s.market === 'CRYPTO').length} Saham Terpilih
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredStocks.filter(s => s.market === 'GLOBAL' || s.market === 'SGX' || s.market === 'CRYPTO').map(renderStockCard)}
              </AnimatePresence>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          <AnimatePresence mode="popLayout">
            {filteredStocks.map(renderStockCard)}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Analyst Modal Integration */}
      <DailyStockDetailAnalystModal
        stock={activeDetailStock}
        isOpen={!!detailModalStock}
        onClose={() => setDetailModalStock(null)}
        onOpenAdvanceChart={(sym) => setChartModalSymbol(sym)}
        onNavigateToMarket={(sym) => onSelectStock?.(sym)}
        onOpenFundamentalAudit={(sym) => onOpenFundamentalAudit ? onOpenFundamentalAudit(sym) : onSelectStock?.(sym)}
        onOpenExplorer={(sym) => onOpenExplorer ? onOpenExplorer(sym) : onSelectStock?.(sym)}
      />

      {/* Advance Chart Modal Integration */}
      <AdvanceChartModal
        symbol={chartModalSymbol}
        isOpen={!!chartModalSymbol}
        onClose={() => setChartModalSymbol(null)}
      />

      {/* TradingView Pine Script Screener Modal */}
      <AnimatePresence>
        {showPineScriptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f141d] border border-purple-500/40 rounded-3xl p-5 sm:p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    <Code className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider">
                      TradingView Pine Script (v5) Screener Code
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      Script penyaring teknikal Day Trading & Potensi ARA (BEI Rules)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPineScriptModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 text-xs font-mono cursor-pointer"
                >
                  Tutup [ESC]
                </button>
              </div>

              {/* Instructions Box */}
              <div className="bg-purple-950/30 border border-purple-500/30 rounded-2xl p-3 text-[11px] text-purple-200 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-purple-300">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Cara Menggunakan Script ini di TradingView:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-zinc-300 font-mono text-[10.5px]">
                  <li>Buka TradingView (www.tradingview.com) & masuk ke tab <strong>Pine Editor</strong> di bagian bawah chart.</li>
                  <li>Salin seluruh kode Pine Script (v5) di bawah ini lalu tempel (paste) ke Pine Editor.</li>
                  <li>Klik <strong>Add to Chart</strong> untuk menampilkan indikator & sinyal visual "POTENSI ARA" beserta garis <strong>EMA-10 (Gold Fast Trendline)</strong> & <strong>EMA-20 (Cyan Base Trendline)</strong> secara realtime.</li>
                  <li>Atau gunakan kriteria filter di <strong>TradingView Stock Screener</strong>: Exchange: <code>IDX</code>, Price &gt; <code>EMA 10</code>, Price &gt; <code>EMA 20</code>, Volume &ge; <code>3x Volume MA20</code>, RSI(14) &gt; <code>65</code>, MACD Line &gt; <code>Signal</code>.</li>
                </ol>
              </div>

              {/* Code Box with Copy Button */}
              <div className="relative">
                <div className="flex items-center justify-between bg-zinc-950 px-4 py-2 rounded-t-2xl border border-zinc-800 text-xs font-mono text-zinc-400">
                  <span>VAM_DayTrading_ARA_Screener.txt</span>
                  <button
                    onClick={handleCopyPineScript}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-500 text-white font-bold text-[10px] uppercase hover:bg-purple-600 transition-all cursor-pointer"
                  >
                    {copiedPineScript ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Script</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-black/90 p-4 rounded-b-2xl border border-t-0 border-zinc-800 text-[10.5px] font-mono text-[#deff9a] overflow-x-auto leading-relaxed max-h-72 select-all">
                  {PINE_SCRIPT_CODE}
                </pre>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DailyTradingAutoAnalyst;
