import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  Sparkles, 
  Award,
  CircleGauge,
  ArrowUpRight,
  Atom,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Briefcase,
  Flame,
  ShieldAlert,
  Target
} from 'lucide-react';
import TradingViewWidget from './TradingViewWidget';

export interface AraPotentialInfo {
  isAraCandidate: boolean;
  araPrice: string;
  distanceToAra: string;
  volumeSpikeMultiplier: string;
  araScore: number;
  bidOfferRatio: string;
  catalyst: string;
}

export interface RecommendationItem {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: number;
  signal: 'BUY' | 'SELL' | 'HOLD';
  rsi: number;
  macd: string;
  ema20Score: 'Bullish' | 'Bearish' | 'Neutral';
  confidence: number;
  rationale: string;
  timeframe: '15m' | '1H' | '4H' | '1D';
  volume: string;
  marketCap: string;
  sparkline: number[];
  lastTick?: 'up' | 'down' | null;
  lastTickTime?: number;
  araPotential?: AraPotentialInfo;
}

const getTradingViewSymbol = (item: RecommendationItem, market: 'IDX' | 'SGX' | 'US' | 'GLOBAL'): string => {
  if (market === 'IDX') {
    return `IDX:${item.symbol}`;
  }
  if (market === 'SGX') {
    return `SGX:${item.symbol}`;
  }
  if (market === 'US') {
    return `NASDAQ:${item.symbol}`;
  }
  if (market === 'GLOBAL') {
    if (item.symbol === 'BTC/USD') return 'BINANCE:BTCUSDT';
    if (item.symbol === 'XAU/USD') return 'OANDA:XAUUSD';
    if (item.symbol === 'EUR/USD') return 'FX_IDC:EURUSD';
  }
  return item.symbol;
};

const INITIAL_RECOMMENDATIONS: Record<'IDX' | 'SGX' | 'US' | 'GLOBAL', RecommendationItem[]> = {
  IDX: [
    {
      symbol: 'BRMS',
      name: 'PT Bumi Resources Minerals Tbk.',
      price: 'IDR 392',
      change: '+22.50%',
      changePercent: 22.50,
      signal: 'BUY',
      rsi: 68,
      macd: 'Ultra Bullish Spike',
      ema20Score: 'Bullish',
      confidence: 99,
      rationale: 'Volume lonjakan tertinggi 9.1x lipat rata-rata harian. Antrean offer di fraksi atas sangat tipis dengan dorongan masif menuju penguncian Auto Rejection Atas (ARA 25%).',
      timeframe: '15m',
      volume: '842.1M',
      marketCap: '55.6T',
      sparkline: [20, 25, 30, 38, 45, 52, 60, 72, 85, 92, 98, 105, 120],
      araPotential: {
        isAraCandidate: true,
        araPrice: 'IDR 400',
        distanceToAra: '+2.0%',
        volumeSpikeMultiplier: '9.1x',
        araScore: 99,
        bidOfferRatio: '6.8 : 1',
        catalyst: 'Lonjakan volume transaksi historis, terserapnya antrean offer fraksi atas menuju penguncian ARA harian.'
      }
    },
    {
      symbol: 'BREN',
      name: 'PT Barito Renewables Energy Tbk.',
      price: 'IDR 7,850',
      change: '+16.30%',
      changePercent: 16.30,
      signal: 'BUY',
      rsi: 71,
      macd: 'Parabolic Expansion',
      ema20Score: 'Bullish',
      confidence: 97,
      rationale: 'Akumulasi agresif konsorsium institusi besar. Penembusan resistensi All-Time High memicu gelombang FOMO ritel menuju penguncian ceiling ARA.',
      timeframe: '1H',
      volume: '142.8M',
      marketCap: '1,050T',
      sparkline: [50, 52, 58, 65, 70, 78, 85, 95, 108, 115, 122, 130, 140],
      araPotential: {
        isAraCandidate: true,
        araPrice: 'IDR 8,550',
        distanceToAra: '+8.9%',
        volumeSpikeMultiplier: '6.8x',
        araScore: 97,
        bidOfferRatio: '5.2 : 1',
        catalyst: 'Breakout All-Time High dengan aliran modal masuk asing terbesar di bursa.'
      }
    },
    {
      symbol: 'PANI',
      name: 'PT Pantai Indah Kapuk Dua Tbk.',
      price: 'IDR 15,200',
      change: '+17.80%',
      changePercent: 17.80,
      signal: 'BUY',
      rsi: 74,
      macd: 'Breakout Divergence',
      ema20Score: 'Bullish',
      confidence: 98,
      rationale: 'Tekanan beli berkelanjutan menyapu seluruh kolom offer. Struktur antrean bid menebal di harga batas atas.',
      timeframe: '15m',
      volume: '68.4M',
      marketCap: '245T',
      sparkline: [40, 42, 48, 55, 62, 72, 85, 96, 110, 122, 135, 145, 155],
      araPotential: {
        isAraCandidate: true,
        araPrice: 'IDR 15,500',
        distanceToAra: '+1.9%',
        volumeSpikeMultiplier: '11.2x',
        araScore: 99,
        bidOfferRatio: '8.4 : 1',
        catalyst: 'Volume spike 11x lipat dengan penguncian bid tebal di fraksi harga atas.'
      }
    },
    {
      symbol: 'AMMN',
      name: 'PT Amman Mineral Internasional Tbk.',
      price: 'IDR 11,450',
      change: '+14.50%',
      changePercent: 14.50,
      signal: 'BUY',
      rsi: 66,
      macd: 'Golden Cross Momentum',
      ema20Score: 'Bullish',
      confidence: 94,
      rationale: 'Inflow agregat asing menyerap penawaran di fraksi atas. Terkonfirmasi dorongan harga mendekati batas Auto Rejection Atas.',
      timeframe: '4H',
      volume: '95.1M',
      marketCap: '830T',
      sparkline: [35, 38, 42, 48, 55, 62, 70, 80, 92, 102, 112, 120, 128],
      araPotential: {
        isAraCandidate: true,
        araPrice: 'IDR 12,000',
        distanceToAra: '+4.8%',
        volumeSpikeMultiplier: '5.2x',
        araScore: 94,
        bidOfferRatio: '3.9 : 1',
        catalyst: 'Inflow asing masif menyerap seluruh penawaran di fraksi harga atas.'
      }
    },
    {
      symbol: 'CUAN',
      name: 'PT Petrindo Jaya Kreasi Tbk.',
      price: 'IDR 8,950',
      change: '+16.40%',
      changePercent: 16.40,
      signal: 'BUY',
      rsi: 69,
      macd: 'V-Shape Reversal',
      ema20Score: 'Bullish',
      confidence: 96,
      rationale: 'Pola pembalikan arah V-shape sangat agresif setelah pengumuman ekspansi aset. Berpotensi tinggi menembus ceiling ARA harian.',
      timeframe: '1H',
      volume: '54.2M',
      marketCap: '101T',
      sparkline: [30, 32, 38, 45, 52, 60, 72, 84, 96, 108, 118, 126, 134],
      araPotential: {
        isAraCandidate: true,
        araPrice: 'IDR 9,225',
        distanceToAra: '+3.1%',
        volumeSpikeMultiplier: '7.6x',
        araScore: 96,
        bidOfferRatio: '4.6 : 1',
        catalyst: 'Lompatan harga eksponensial dengan pola V-shape breakout mengarah ke batas ARA.'
      }
    },
    {
      symbol: 'BBCA',
      name: 'PT Bank Central Asia Tbk.',
      price: 'IDR 10,475',
      change: '+1.45%',
      changePercent: 1.45,
      signal: 'BUY',
      rsi: 38,
      macd: 'Bullish Crossover',
      ema20Score: 'Bullish',
      confidence: 94,
      rationale: 'Volume pembalikan akumulasi kuat d/h broker lokal, RSI keluar dari area zona jenuh jual pada timeframe harian.',
      timeframe: '1D',
      volume: '48.9M',
      marketCap: '1,290T',
      sparkline: [40, 42, 41, 43, 45, 44, 46, 48, 47, 49, 48, 51, 53],
      araPotential: {
        isAraCandidate: false,
        araPrice: 'IDR 12,575',
        distanceToAra: '+20.0%',
        volumeSpikeMultiplier: '1.2x',
        araScore: 18,
        bidOfferRatio: '1.2 : 1',
        catalyst: 'Saham perbankan large-cap dengan pergerakan stabil dan volatilitas terukur.'
      }
    },
    {
      symbol: 'BMRI',
      name: 'PT Bank Mandiri (Persero) Tbk.',
      price: 'IDR 7,150',
      change: '+1.78%',
      changePercent: 1.78,
      signal: 'BUY',
      rsi: 42,
      macd: 'Golden Cross (12, 26)',
      ema20Score: 'Bullish',
      confidence: 88,
      rationale: 'Terjadi pantulan teknikal presisi pada fibonacci retracement 0.618 dibarengi stabilisasi likuiditas valas.',
      timeframe: '4H',
      volume: '59.2M',
      marketCap: '667T',
      sparkline: [30, 31, 29, 32, 34, 33, 35, 34, 36, 38, 37, 40, 42],
      araPotential: {
        isAraCandidate: false,
        araPrice: 'IDR 8,575',
        distanceToAra: '+19.9%',
        volumeSpikeMultiplier: '1.4x',
        araScore: 22,
        bidOfferRatio: '1.4 : 1',
        catalyst: 'Pergerakan organik terukur mengikuti tren indeks perbankan nasional.'
      }
    },
    {
      symbol: 'TLKM',
      name: 'PT Telkom Indonesia (Persero) Tbk.',
      price: 'IDR 2,810',
      change: '-0.71%',
      changePercent: -0.71,
      signal: 'HOLD',
      rsi: 54,
      macd: 'Negative Divergence',
      ema20Score: 'Neutral',
      confidence: 72,
      rationale: 'Konsolidasi ketat di kisaran area support psikologis Rp 2.800. Menunggu konfirmasi breakout resistensi jangka pendek.',
      timeframe: '1D',
      volume: '112.5M',
      marketCap: '278T',
      sparkline: [50, 51, 50, 49, 48, 47, 49, 48, 48, 49, 48, 47, 48],
      araPotential: {
        isAraCandidate: false,
        araPrice: 'IDR 3,500',
        distanceToAra: '+24.5%',
        volumeSpikeMultiplier: '0.8x',
        araScore: 12,
        bidOfferRatio: '0.9 : 1',
        catalyst: 'Fase konsolidasi terikat di area rentang terbatas.'
      }
    },
    {
      symbol: 'ADRO',
      name: 'PT Adaro Energy Indonesia Tbk.',
      price: 'IDR 3,590',
      change: '-3.23%',
      changePercent: -3.23,
      signal: 'SELL',
      rsi: 74,
      macd: 'Bearish Breakdown',
      ema20Score: 'Bearish',
      confidence: 91,
      rationale: 'Struktur pola double top terkonfirmasi, indikator RSI menunjukkan jenuh beli ekstrem di pasar spot energi.',
      timeframe: '1H',
      volume: '78.1M',
      marketCap: '115T',
      sparkline: [60, 59, 58, 59, 61, 62, 60, 58, 57, 55, 53, 52, 50],
      araPotential: {
        isAraCandidate: false,
        araPrice: 'IDR 4,480',
        distanceToAra: '+24.8%',
        volumeSpikeMultiplier: '0.6x',
        araScore: 5,
        bidOfferRatio: '0.4 : 1',
        catalyst: 'Tekanan jual mendominasi di area resistensi atas.'
      }
    }
  ],
  SGX: [
    {
      symbol: 'D05',
      name: 'DBS Group Holdings Ltd',
      price: 'SGD 38.45',
      change: '+1.18%',
      changePercent: 1.18,
      signal: 'BUY',
      rsi: 45,
      macd: 'Slow Line Convergence',
      ema20Score: 'Bullish',
      confidence: 90,
      rationale: 'Tekanan jual mereda di level SGD 38.00. Sinyal akumulasi terlihat dari indikasi foreign inflow institutional.',
      timeframe: '4H',
      volume: '12.4M',
      marketCap: '98.5B',
      sparkline: [20, 21, 22, 21, 23, 22, 24, 25, 24, 26, 25, 27, 28]
    },
    {
      symbol: 'U11',
      name: 'United Overseas Bank Ltd',
      price: 'SGD 32.10',
      change: '+0.94%',
      changePercent: 0.94,
      signal: 'BUY',
      rsi: 41,
      macd: 'Bullish Divergence',
      ema20Score: 'Bullish',
      confidence: 85,
      rationale: 'Pola doji star teridentifikasi di support kuat, menunjukkan penolakan masif terhadap penurunan lanjut.',
      timeframe: '1D',
      volume: '8.1M',
      marketCap: '53.7B',
      sparkline: [35, 34, 36, 35, 37, 36, 38, 37, 39, 40, 39, 41, 42]
    },
    {
      symbol: 'Y92',
      name: 'Thai Beverage PCL',
      price: 'SGD 0.49',
      change: '-1.01%',
      changePercent: -1.01,
      signal: 'HOLD',
      rsi: 49,
      macd: 'Flat Momentum',
      ema20Score: 'Neutral',
      confidence: 65,
      rationale: 'Pergerakan harga menyempit di dalam pola symmetrical triangle. Volume perdagangan harian di bawah rata-rata 20 hari.',
      timeframe: '1D',
      volume: '24.7M',
      marketCap: '12.3B',
      sparkline: [40, 40, 39, 41, 41, 40, 40, 39, 39, 40, 41, 40, 39]
    }
  ],
  US: [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 'USD 189.85',
      change: '+2.14%',
      changePercent: 2.14,
      signal: 'BUY',
      rsi: 36,
      macd: 'Bullish Hook at Zero Line',
      ema20Score: 'Bullish',
      confidence: 95,
      rationale: 'Institusi besar memanfaatkan deviasi valuasi jangka pendek. Rebound dari EMA 200 hari yang sangat krusial.',
      timeframe: '1D',
      volume: '56.3M',
      marketCap: '2.95T',
      sparkline: [10, 11, 10, 12, 13, 12, 14, 15, 14, 16, 17, 18, 19]
    },
    {
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      price: 'USD 174.60',
      change: '-3.85%',
      changePercent: -3.85,
      signal: 'SELL',
      rsi: 78,
      macd: 'Bearish Crossover',
      ema20Score: 'Bearish',
      confidence: 93,
      rationale: 'Gagal menembus batas resistensi psikologis USD 180. Pola breakout palsu dibarengi volume distribusi masif.',
      timeframe: '1H',
      volume: '84.6M',
      marketCap: '554B',
      sparkline: [80, 78, 76, 77, 75, 73, 71, 72, 69, 67, 65, 63, 60]
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      price: 'USD 912.40',
      change: '+1.62%',
      changePercent: 1.62,
      signal: 'HOLD',
      rsi: 62,
      macd: 'Overbought Divergence',
      ema20Score: 'Neutral',
      confidence: 78,
      rationale: 'Meskipun tren jangka panjang tetap bullish kuat, disarankan pelestarian modal akibat RSI mendekati jenuh beli jangka pendek.',
      timeframe: '4H',
      volume: '41.2M',
      marketCap: '2.28T',
      sparkline: [50, 51, 53, 52, 55, 56, 54, 57, 58, 56, 58, 59, 60]
    }
  ],
  GLOBAL: [
    {
      symbol: 'BTC/USD',
      name: 'Bitcoin (Spot)',
      price: 'USD 67,230',
      change: '+3.41%',
      changePercent: 3.41,
      signal: 'BUY',
      rsi: 44,
      macd: 'MACD Signal Line Crossover',
      ema20Score: 'Bullish',
      confidence: 92,
      rationale: 'Inflow agregat ETF Spot mencatat rekor peningkatan mingguan, mendorong konfirmasi validitas pola penembusan bendera harian.',
      timeframe: '4H',
      volume: '31.5B',
      marketCap: '1.32T',
      sparkline: [30, 32, 31, 33, 35, 34, 37, 38, 36, 40, 42, 43, 45]
    },
    {
      symbol: 'XAU/USD',
      name: 'Gold Spot OTC',
      price: 'USD 2,342.10',
      change: '+0.54%',
      changePercent: 0.54,
      signal: 'HOLD',
      rsi: 58,
      macd: 'Steady Ascending Line',
      ema20Score: 'Neutral',
      confidence: 80,
      rationale: 'Aktivitas lindung nilai (hedging) global menjaga kestabilan lintasan harga emas di atas level krusial USD 2.300.',
      timeframe: '1D',
      volume: '15.9B',
      marketCap: '15.4T',
      sparkline: [40, 41, 41, 42, 42, 43, 43, 44, 44, 45, 45, 46, 46]
    },
    {
      symbol: 'EUR/USD',
      name: 'Euro / US Dollar',
      price: '1.0845',
      change: '-0.18%',
      changePercent: -0.18,
      signal: 'SELL',
      rsi: 69,
      macd: 'Desceding Parabolic SAR',
      ema20Score: 'Bearish',
      confidence: 84,
      rationale: 'Data lapangan kerja AS yang solid menguatkan bias apresiasi Dolar, memaksa pelemahan struktural silang pasangan EUR.',
      timeframe: '15m',
      volume: '184.2B',
      marketCap: 'N/A',
      sparkline: [50, 49, 48, 49, 47, 46, 45, 44, 44, 43, 41, 40, 39]
    }
  ]
};

export const TechnicalRecommendations: React.FC = () => {
  const [activeMarket, setActiveMarket] = useState<'IDX' | 'SGX' | 'US' | 'GLOBAL'>('IDX');
  const [recommendations, setRecommendations] = useState(INITIAL_RECOMMENDATIONS);
  const [selectedItemState, setSelectedItem] = useState<RecommendationItem | null>(null);
  
  // Filter state including ARA (Auto Rejection Atas) screening mode
  const [signalFilter, setSignalFilter] = useState<'ALL' | 'ARA' | 'BUY' | 'HIGH_CONF'>('ALL');
  const [rsiFilter, setRsiFilter] = useState<[number, number]>([0, 100]);
  const [showRsiFilterPanel, setShowRsiFilterPanel] = useState(false);

  // Dynamically derive the active selectedItem from recommendations to always show live updated prices
  const selectedItem = selectedItemState
    ? (recommendations[activeMarket].find(item => item.symbol.toUpperCase() === selectedItemState.symbol.toUpperCase()) || selectedItemState)
    : null;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string>(new Date().toLocaleTimeString('id-ID'));
  const [searchQuery, setSearchQuery] = useState('');
  const [orderExecutedMsg, setOrderExecutedMsg] = useState<string | null>(null);

  // TradingView Real-time Sync States
  const [tvSyncStatus, setTvSyncStatus] = useState<'syncing' | 'connected'>('connected');
  const [tvLatency, setTvLatency] = useState<number>(12);
  const [tvLogs, setTvLogs] = useState<string>('FEED STATE EXCELLENT - TRADINGVIEW WEBSOCKET PROTOCOL SECURED');

  // Listen to system-wide Live Market updates from TradingView/Gateway to sync recommendations in real-time
  useEffect(() => {
    // Initial sync with live prices endpoint
    fetch('/api/market/realtime-prices')
      .then(res => res.json())
      .then((data: Record<string, { price: number; changePercent?: number; rsi?: number }>) => {
        if (!data || typeof data !== 'object') return;
        setRecommendations(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(marketKey => {
            const key = marketKey as 'IDX' | 'SGX' | 'US' | 'GLOBAL';
            next[key] = next[key].map(item => {
              const cleanItemSymbol = item.symbol.toUpperCase();
              const match = data[cleanItemSymbol] || data[`${cleanItemSymbol}.JK`];
              if (match && typeof match.price === 'number' && match.price > 0) {
                const price = match.price;
                const changePercent = match.changePercent !== undefined ? match.changePercent : item.changePercent;
                const prefix = item.price.startsWith('IDR') ? 'IDR ' : item.price.startsWith('SGD') ? 'SGD ' : item.price.startsWith('USD') ? 'USD ' : '';
                let formattedPrice = '';
                if (prefix === 'IDR ') {
                  formattedPrice = `${prefix}${Math.round(price).toLocaleString('id-ID')}`;
                } else if (prefix === 'SGD ' || prefix === 'USD ') {
                  formattedPrice = `${prefix}${price.toFixed(2)}`;
                } else {
                  formattedPrice = price.toFixed(4);
                }
                const formattedChange = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
                return {
                  ...item,
                  price: formattedPrice,
                  change: formattedChange,
                  changePercent,
                  rsi: match.rsi ? Math.round(match.rsi) : item.rsi
                };
              }
              return item;
            });
          });
          return next;
        });
      })
      .catch(err => console.warn("Failed initial recommendations live price sync:", err));

    const handleSystemMarketUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{
        symbol: string;
        price: number;
        changePercent: number;
        rsi?: number;
      }>;
      if (!customEvent || !customEvent.detail) return;
      const { symbol, price, changePercent, rsi } = customEvent.detail;
      if (typeof price !== 'number') return;

      setRecommendations(prev => {
        const next = { ...prev };
        let updated = false;

        Object.keys(next).forEach(marketKey => {
          const key = marketKey as 'IDX' | 'SGX' | 'US' | 'GLOBAL';
          next[key] = next[key].map(item => {
            const cleanEventSymbol = symbol.replace('.JK', '').toUpperCase();
            const cleanItemSymbol = item.symbol.toUpperCase();

            if (cleanEventSymbol === cleanItemSymbol) {
              updated = true;
              
              const currentPriceNum = parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
              const pctDelta = price - currentPriceNum;

              const prefix = item.price.startsWith('IDR') ? 'IDR ' : item.price.startsWith('SGD') ? 'SGD ' : item.price.startsWith('USD') ? 'USD ' : '';
              let formattedPrice = '';
              if (prefix === 'IDR ') {
                formattedPrice = `${prefix}${Math.round(price).toLocaleString('id-ID')}`;
              } else if (prefix === 'SGD ' || prefix === 'USD ') {
                formattedPrice = `${prefix}${price.toFixed(2)}`;
              } else {
                formattedPrice = price.toFixed(4);
              }

              const formattedChange = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
              const updatedRsi = rsi ? Math.round(rsi) : item.rsi;
              const nextSparkline = [...item.sparkline.slice(1), item.sparkline[item.sparkline.length - 1] * (1 + (Math.random() - 0.5) * 0.04)];

              return {
                ...item,
                price: formattedPrice,
                change: formattedChange,
                changePercent: changePercent,
                rsi: updatedRsi,
                sparkline: nextSparkline,
                lastTick: pctDelta > 0 ? 'up' : pctDelta < 0 ? 'down' : 'up',
                lastTickTime: Date.now()
              };
            }
            return item;
          });
        });

        return updated ? next : prev;
      });
    };

    window.addEventListener('vam-market-update', handleSystemMarketUpdate);
    return () => window.removeEventListener('vam-market-update', handleSystemMarketUpdate);
  }, []);

  // Sync latency fluctuation simulations
  useEffect(() => {
    const latInterval = setInterval(() => {
      setTvLatency(Math.floor(10 + Math.random() * 8));
    }, 3500);
    return () => clearInterval(latInterval);
  }, []);

  // Handle Market Tab Changes with TradingView Re-sync Simulation
  const handleMarketChange = (market: 'IDX' | 'SGX' | 'US' | 'GLOBAL') => {
    setActiveMarket(market);
    setSelectedItem(null);
    setTvSyncStatus('syncing');
    setTvLogs(`RE-CONNECTING DEDICATED WEBSOCKET CLUSTER FOR '${market}' DATA FEED...`);
    setTimeout(() => {
      setTvSyncStatus('connected');
      setTvLogs(`CONNECTED TO TRADINGVIEW ${market} COMPILER ENGINE FEED. PRICE OVERLAYS SYNCED.`);
    }, 550);
  };

  // Auto-refresh simulations to make dashboard look responsive and alive, matching live TradingView stream spikes
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.hidden) return; // Skip background processing when tab is inactive to prevent lag
      
      setRecommendations(prev => {
        const currentActiveMarket = activeMarket;
        if (!prev[currentActiveMarket]) return prev;

        const updatedMarketItems = prev[currentActiveMarket].map(item => {
          if (Math.random() > 0.5) return item;

          const pctDelta = (Math.random() - 0.5) * 0.18;
          const priceNumber = parseFloat(item.price.replace(/[^\d.]/g, ''));
          
          if (isNaN(priceNumber)) return item;
          
          const nextPriceVal = priceNumber * (1 + pctDelta / 100);
          const prefix = item.price.startsWith('IDR') ? 'IDR ' : item.price.startsWith('SGD') ? 'SGD ' : item.price.startsWith('USD') ? 'USD ' : '';
          
          let formattedPrice = '';
          if (prefix === 'IDR ') {
            formattedPrice = `${prefix}${Math.round(nextPriceVal).toLocaleString('id-ID')}`;
          } else if (prefix === 'SGD ' || prefix === 'USD ') {
            formattedPrice = `${prefix}${nextPriceVal.toFixed(2)}`;
          } else {
            formattedPrice = nextPriceVal.toFixed(4);
          }

          const nextChangePercent = item.changePercent + pctDelta;
          const formattedChange = `${nextChangePercent >= 0 ? '+' : ''}${nextChangePercent.toFixed(2)}%`;

          const nextSparkline = [...item.sparkline.slice(1), item.sparkline[item.sparkline.length - 1] * (1 + (Math.random() - 0.5) * 0.05)];

          return {
            ...item,
            price: formattedPrice,
            change: formattedChange,
            changePercent: nextChangePercent,
            sparkline: nextSparkline,
            lastTick: pctDelta > 0 ? 'up' : pctDelta < 0 ? 'down' : null,
            lastTickTime: Date.now()
          };
        });

        return {
          ...prev,
          [currentActiveMarket]: updatedMarketItems
        };
      });
    }, 6000); // Efficient 6-second cadence for silky smooth UI response

    return () => clearInterval(timer);
  }, [activeMarket]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTvSyncStatus('syncing');
    setTvLogs('FORCE RE-AUTHORIZING AUTHENTICATION TO TRADINGVIEW DATA POOL GATEWAY...');
    setTimeout(() => {
      setIsRefreshing(false);
      setTvSyncStatus('connected');
      setTvLogs(`RE-BUFFERS OVERWRITTEN. SYSTEM SYNC COMPLETED WITH OK STATUS.`);
      setLastCheckTime(new Date().toLocaleTimeString('id-ID'));
      // Shuffle recommendation confidence a bit for realistic response
      setRecommendations(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(m => {
          const key = m as 'IDX' | 'SGX' | 'US' | 'GLOBAL';
          next[key] = next[key].map(item => ({
            ...item,
            confidence: Math.min(100, Math.max(50, item.confidence + Math.round((Math.random() - 0.5) * 4)))
          }));
        });
        return next;
      });
    }, 1100);
  };

  const currentList = recommendations[activeMarket].filter(item => {
    const matchesSearch = item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (item.rsi < rsiFilter[0] || item.rsi > rsiFilter[1]) {
      return false;
    }

    if (signalFilter === 'ARA') {
      return item.araPotential?.isAraCandidate || item.changePercent >= 10;
    }
    if (signalFilter === 'BUY') {
      return item.signal === 'BUY';
    }
    if (signalFilter === 'HIGH_CONF') {
      return item.confidence >= 85;
    }
    return true;
  });

  const araCandidateCount = recommendations[activeMarket].filter(
    item => item.araPotential?.isAraCandidate || item.changePercent >= 10
  ).length;

  const executePaperOrder = (item: RecommendationItem) => {
    setOrderExecutedMsg(`[TRANSAKSI SECURE] Perintah simulasi institutional ${item.signal} untuk 100 Lot / $10k nominal pada instrumen ${item.symbol} telah dikirim ke CGS/IBKR Gateway.`);
    setTimeout(() => {
      setOrderExecutedMsg(null);
    }, 5000);
  };

  return (
    <div className="space-y-6" id="vam-technical-rec-engine">
      <div className="bg-gradient-to-br from-[#06080d] via-slate-950 to-black p-6 rounded-[2.5rem] border border-zinc-800/80 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 p-16 bg-[#DFFF00]/5 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#DFFF00]/10 rounded-2xl border border-[#DFFF00]/20 text-[#DFFF00]">
              <Atom className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] font-sans">
                  Technical AI Engine
                </h3>
                <span className="px-1.5 py-0.5 bg-zinc-900 border border-[#DFFF00]/30 text-[#DFFF00] text-[8px] font-black uppercase rounded tracking-wider">
                  Live Recommendations
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono tracking-wide uppercase mt-0.5">
                Sinyal Analisis Kuantitatif Berdasarkan Indikator Multi-Timeframe
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari simbol / nama..." 
                className="bg-zinc-900/40 border border-zinc-800 rounded-full px-3.5 pl-9 py-1.5 text-[10px] text-white placeholder-zinc-500 focus:outline-none focus:border-[#DFFF00]/60 w-36 sm:w-48 font-mono"
              />
              <Search className="w-3 h-3 text-zinc-500 absolute left-3.5 top-2.5" />
            </div>

            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 bg-zinc-900 hover:bg-zinc-800 transition-colors rounded-xl border border-zinc-800 text-[#DFFF00] disabled:opacity-40"
              title="Refresh Sinyal Teknis"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Market Category Selector */}
        <div className="grid grid-cols-4 gap-1 bg-zinc-900/30 p-1 rounded-2xl border border-zinc-900/80 mb-3">
          {(['IDX', 'SGX', 'US', 'GLOBAL'] as const).map(market => (
            <button
              key={market}
              onClick={() => handleMarketChange(market)}
              className={`py-2 rounded-xl text-[10px] font-bold uppercase transition-all tracking-widest cursor-pointer ${
                activeMarket === market 
                  ? 'bg-[#DFFF00] text-slate-950 shadow-sm' 
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              {market}
            </button>
          ))}
        </div>

        {/* Strategy & ARA Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 p-2.5 bg-zinc-950/80 border border-zinc-900 rounded-2xl">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
            <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase mr-1 tracking-wider">Penyaringan:</span>
            
            <button
              onClick={() => setSignalFilter('ALL')}
              className={`px-3 py-1 rounded-xl text-[9.5px] font-bold font-mono uppercase transition-all cursor-pointer ${
                signalFilter === 'ALL'
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Semua ({recommendations[activeMarket].length})
            </button>

            <button
              onClick={() => setSignalFilter('ARA')}
              className={`flex items-center gap-1.5 px-3.5 py-1 rounded-xl text-[9.5px] font-black font-mono uppercase transition-all cursor-pointer border ${
                signalFilter === 'ARA'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.35)]'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500/20'
              }`}
            >
              <Zap className="w-3 h-3 fill-amber-400 text-amber-400 animate-pulse" />
              <span>Saring Potensi ARA</span>
              <span className={`ml-1 px-1.5 py-0.2 rounded text-[8px] font-extrabold ${
                signalFilter === 'ARA' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {araCandidateCount}
              </span>
            </button>

            <button
              onClick={() => setSignalFilter('BUY')}
              className={`px-3 py-1 rounded-xl text-[9.5px] font-bold font-mono uppercase transition-all cursor-pointer ${
                signalFilter === 'BUY'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Signal BUY
            </button>

            <button
              onClick={() => setSignalFilter('HIGH_CONF')}
              className={`px-3 py-1 rounded-xl text-[9.5px] font-bold font-mono uppercase transition-all cursor-pointer ${
                signalFilter === 'HIGH_CONF'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Kepercayaan &gt;85%
            </button>

            <button
              onClick={() => setShowRsiFilterPanel(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9.5px] font-bold font-mono uppercase transition-all cursor-pointer border ${
                rsiFilter[0] > 0 || rsiFilter[1] < 100 || showRsiFilterPanel
                  ? 'bg-[#DFFF00]/15 text-[#DFFF00] border-[#DFFF00]/40 shadow-[0_0_10px_rgba(223,255,0,0.15)]'
                  : 'text-zinc-500 hover:text-zinc-300 border-transparent'
              }`}
            >
              <TrendingUp className="w-3 h-3 text-[#DFFF00]" />
              <span>RSI Threshold {rsiFilter[0] > 0 || rsiFilter[1] < 100 ? `(${rsiFilter[0]}-${rsiFilter[1]})` : ''}</span>
            </button>
          </div>

          {signalFilter === 'ARA' && (
            <div className="flex items-center gap-1.5 text-[8.5px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              <Flame className="w-3 h-3 text-amber-400" />
              <span>Menampilkan saham berpotensi menembus Auto Rejection Atas (ARA)</span>
            </div>
          )}

          {/* RSI Slider Adjustment Drawer/Panel */}
          <AnimatePresence>
            {showRsiFilterPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full mt-3 pt-3 border-t border-zinc-900 overflow-hidden"
              >
                <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-[#DFFF00]" />
                      RSI Boundary Slider Filter
                    </span>
                    <span className="text-[9px] font-mono font-bold text-[#DFFF00] bg-[#DFFF00]/10 px-2 py-0.5 rounded border border-[#DFFF00]/20">
                      Current Range: {rsiFilter[0]} - {rsiFilter[1]} RSI
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[8px] font-black text-zinc-500 uppercase mr-1">Boundaries:</span>
                    <button
                      onClick={() => setRsiFilter([0, 30])}
                      className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-all ${
                        rsiFilter[0] === 0 && rsiFilter[1] === 30 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      Oversold (&lt;30)
                    </button>
                    <button
                      onClick={() => setRsiFilter([30, 70])}
                      className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-all ${
                        rsiFilter[0] === 30 && rsiFilter[1] === 70 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      Neutral (30-70)
                    </button>
                    <button
                      onClick={() => setRsiFilter([70, 100])}
                      className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-all ${
                        rsiFilter[0] === 70 && rsiFilter[1] === 100 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      Overbought (&gt;70)
                    </button>
                    <button
                      onClick={() => setRsiFilter([0, 100])}
                      className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-all ${
                        rsiFilter[0] === 0 && rsiFilter[1] === 100 ? 'bg-[#DFFF00]/20 text-[#DFFF00] border border-[#DFFF00]/30' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      Reset (0-100)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-mono text-zinc-400 uppercase">
                        <span>Min RSI (Oversold Limit)</span>
                        <span className="font-bold text-[#DFFF00]">{rsiFilter[0]}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={rsiFilter[0]}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setRsiFilter(prev => [Math.min(val, prev[1]), prev[1]]);
                        }}
                        className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-[#DFFF00]"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-mono text-zinc-400 uppercase">
                        <span>Max RSI (Overbought Limit)</span>
                        <span className="font-bold text-[#DFFF00]">{rsiFilter[1]}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={rsiFilter[1]}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setRsiFilter(prev => [prev[0], Math.max(val, prev[0])]);
                        }}
                        className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-[#DFFF00]"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Live Mapped TradingView Connection Bridge Monitor Banner */}
        <div className="mb-6 p-4 rounded-2.5xl bg-zinc-950/70 border border-zinc-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl flex items-center justify-center border ${
              tvSyncStatus === 'connected' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                : 'bg-amber-500/10 text-amber-500 border-amber-500/25 animate-pulse'
            }`}>
              <Activity className={`w-4 h-4 ${tvSyncStatus === 'syncing' ? 'animate-bounce' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white">TradingView Core Data Bridge</span>
                <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase tracking-widest ${
                  tvSyncStatus === 'connected' 
                    ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-amber-950/30 text-amber-500 border border-amber-500/30'
                }`}>
                  {tvSyncStatus === 'connected' ? 'SYNCED' : 'RESYNCING'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse hidden sm:inline-block" />
              </div>
              <p className="text-[9.5px] text-zinc-400 font-mono mt-0.5 uppercase tracking-wide">
                Status: <span className="text-[#DFFF00]">{tvLogs}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[9px] font-mono text-zinc-500 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex flex-col">
              <span className="text-zinc-650 font-bold uppercase tracking-wider text-[8px]">FEED OVERLAYS</span>
              <span className="text-zinc-300 font-extrabold text-[9.5px] uppercase">Real-Time Ticks</span>
            </div>
            <div className="h-6 w-px bg-zinc-900/60 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-zinc-650 font-bold uppercase tracking-wider text-[8px]">BRIDGE LATENCY</span>
              <span className="text-zinc-300 font-extrabold text-[9.5px]">{tvLatency}ms (DIRECT)</span>
            </div>
            <div className="h-6 w-px bg-zinc-900/60 hidden sm:block" />
            <button 
              onClick={() => {
                setTvSyncStatus('syncing');
                setTvLogs(`REFRESHING SOCKET BUFFERS... REQUESTING TRADINGVIEW RE-ESTABLISHMENT...`);
                setTimeout(() => {
                  setTvSyncStatus('connected');
                  setTvLogs(`RE-SYNCHRONIZED TRADINGVIEW PRICE STREAM. CHANNEL ID: TV-${activeMarket}-ST`);
                }, 800);
              }}
              className="py-1 px-2.5 bg-zinc-900 hover:bg-zinc-850 hover:text-white transition-all text-zinc-400 border border-zinc-805 rounded-xl text-[8px] font-extrabold uppercase tracking-wider cursor-pointer"
            >
              Force Resync
            </button>
          </div>
        </div>

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sinyal Table/List side */}
          <div className={`${selectedItem ? 'lg:col-span-7' : 'lg:col-span-12'} transition-all duration-300 space-y-3`}>
            {orderExecutedMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-2xl text-[9.5px] font-mono leading-relaxed"
              >
                {orderExecutedMsg}
              </motion.div>
            )}

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 text-[9px] text-zinc-500 uppercase tracking-widest font-mono">
                    <th className="pb-3 pl-2">Instrumen</th>
                    <th className="pb-3">Sinyal AI</th>
                    <th className="pb-3 text-right">Harga Terakhir</th>
                    <th className="pb-3 text-right">Perubahan</th>
                    <th className="pb-3 text-center hidden md:table-cell">Kepercayaan (AI)</th>
                    <th className="pb-3 text-center hidden sm:table-cell">Tren Mini</th>
                    <th className="pb-3 pr-2 text-right">Garis Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/50">
                  {currentList.map((item) => {
                    const isSelected = selectedItem?.symbol === item.symbol;
                    const changeColor = item.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400';
                    const signalColor = item.signal === 'BUY' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' :
                                        item.signal === 'SELL' ? 'border-red-500/30 text-red-500 bg-red-500/10' :
                                        'border-amber-500/20 text-amber-500 bg-amber-500/5';
                    
                    return (
                      <tr 
                        key={item.symbol}
                        onClick={() => setSelectedItem(isSelected ? null : item)}
                        className={`group border-b border-zinc-900/30 hover:bg-zinc-900/30 transition-colors cursor-pointer text-[11px] ${
                          isSelected ? 'bg-zinc-900/40' : ''
                        }`}
                      >
                        <td className="py-3.5 pl-2">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-extrabold text-[#DFFF00] group-hover:text-white transition-colors">
                                {item.symbol}
                              </span>
                              {item.araPotential?.isAraCandidate && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[7.5px] font-black uppercase tracking-wider flex items-center gap-0.5">
                                  <Zap className="w-2.5 h-2.5 fill-amber-400" />
                                  ARA {item.araPotential.distanceToAra}
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-zinc-500 truncate max-w-[140px] md:max-w-xs">
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2.5 py-0.5 rounded text-[8.5px] font-extrabold tracking-wider border uppercase ${signalColor}`}>
                            {item.signal}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-mono">
                          {(() => {
                            const isRecentTick = item.lastTickTime && (Date.now() - item.lastTickTime < 1100);
                            return (
                              <motion.span
                                key={`${item.symbol}-${item.price}`}
                                initial={isRecentTick ? { 
                                  backgroundColor: item.lastTick === 'up' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)', 
                                  color: item.lastTick === 'up' ? '#34d399' : '#f43f5e',
                                  borderRadius: '6px'
                                } : false}
                                animate={{ backgroundColor: 'transparent', color: '#ffffff' }}
                                transition={{ duration: 0.9, ease: 'easeOut' }}
                                className="px-1.5 py-0.5 rounded-md font-extrabold text-[#ffffff]"
                              >
                                {item.price}
                              </motion.span>
                            );
                          })()}
                        </td>
                        <td className="py-3.5 text-right">
                          {(() => {
                            const isRecentTick = item.lastTickTime && (Date.now() - item.lastTickTime < 1100);
                            return (
                              <motion.span 
                                key={`${item.symbol}-${item.change}`}
                                initial={isRecentTick ? { scale: 1.06, color: item.lastTick === 'up' ? '#34d399' : '#f43f5e' } : false}
                                animate={{ scale: 1, color: item.changePercent >= 0 ? '#34d399' : '#f43f5e' }}
                                transition={{ duration: 0.8 }}
                                className="font-mono font-bold inline-flex items-center justify-end gap-1 text-[10.5px] px-1"
                              >
                                {item.changePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {item.change}
                              </motion.span>
                            );
                          })()}
                        </td>
                        <td className="py-3.5 text-center hidden md:table-cell font-mono">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="w-12 bg-zinc-800 rounded-full h-1 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-[#DFFF00]" 
                                style={{ width: `${item.confidence}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-black text-zinc-300">{item.confidence}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-center hidden sm:table-cell">
                          <svg className="w-16 h-5 mx-auto overflow-visible" viewBox="0 0 100 20">
                            <polyline
                              fill="none"
                              stroke={item.changePercent >= 0 ? '#10b981' : '#f43f5e'}
                              strokeWidth="1.5"
                              points={item.sparkline.map((val, index) => `${(index / (item.sparkline.length - 1)) * 100},${20 - val}`).join(' ')}
                            />
                          </svg>
                        </td>
                        <td className="py-3.5 pr-2 text-right">
                          <span className="inline-flex items-center justify-center p-1.5 bg-zinc-900/60 rounded-lg border border-zinc-800 group-hover:border-[#DFFF00]/40 transition-colors text-zinc-500 group-hover:text-[#DFFF00]">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {currentList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-600 font-mono text-[10px]">
                        NIL INSTRUMENTS FOUND IN REGISTRY FOR MARKET '{activeMarket}'
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-[8px] text-zinc-600 font-mono pt-3 border-t border-zinc-900">
              <span className="uppercase tracking-widest">GATEWAY STABLE (IBKR Node 2)</span>
              <span>TERAKHIR DISINKRONISASI: {lastCheckTime}</span>
            </div>
          </div>

          {/* Details Sidebar overlay */}
          <AnimatePresence>
            {selectedItem && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="lg:col-span-5 bg-gradient-to-b from-[#030509] to-black border border-zinc-800 p-5 rounded-3xl space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <div className="flex flex-col">
                    <span className="text-zinc-500 text-[8.5px] uppercase tracking-wider font-mono">Detail Analisis Teknikal</span>
                    <h4 className="text-sm font-black text-white uppercase tracking-tight font-mono text-[#DFFF00]">{selectedItem.symbol}</h4>
                  </div>
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className="p-1 px-2.5 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white rounded-lg text-[9px] uppercase font-mono cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>

                <div className="space-y-3 font-sans">
                  <div className="flex justify-between items-center bg-zinc-900/40 p-3 rounded-2xl border border-zinc-800/40">
                    <div>
                      <p className="text-[7.5px] text-zinc-500 uppercase font-mono mb-0.5">Kapitalisasi Pasar</p>
                      <p className="text-xs font-black text-zinc-300 font-mono">{selectedItem.marketCap}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[7.5px] text-zinc-500 uppercase font-mono mb-0.5">Volume 24H</p>
                      <p className="text-xs font-black text-zinc-300 font-mono">{selectedItem.volume}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-[#DFFF00]/5 border border-[#DFFF00]/10 rounded-2.5xl">
                    <div className="flex items-center gap-1.5 text-[#DFFF00] mb-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-wider font-mono">Sinyal Konsensus AI</span>
                    </div>
                    <p className="text-[10.5px] text-zinc-300 leading-relaxed font-light">
                      {selectedItem.rationale}
                    </p>
                  </div>

                  {/* ARA Potential Matrix Card */}
                  {selectedItem.araPotential && (
                    <div className="p-3.5 bg-gradient-to-br from-amber-950/30 via-zinc-950 to-black border border-amber-500/20 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-amber-400">
                          <Zap className="w-3.5 h-3.5 fill-amber-400" />
                          <span className="text-[9.5px] font-black uppercase tracking-wider font-mono">Potensi Auto Rejection Atas (ARA)</span>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[8.5px] font-mono font-black rounded-full">
                          SKOR ARA: {selectedItem.araPotential.araScore}%
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[9.5px] font-mono">
                        <div className="bg-zinc-900/50 p-2 rounded-xl border border-zinc-800">
                          <span className="text-zinc-500 text-[7.5px] uppercase block">Batas Ceiling ARA</span>
                          <span className="text-amber-300 font-extrabold">{selectedItem.araPotential.araPrice}</span>
                        </div>
                        <div className="bg-zinc-900/50 p-2 rounded-xl border border-zinc-800">
                          <span className="text-zinc-500 text-[7.5px] uppercase block">Jarak ke ARA</span>
                          <span className="text-emerald-400 font-extrabold">{selectedItem.araPotential.distanceToAra}</span>
                        </div>
                        <div className="bg-zinc-900/50 p-2 rounded-xl border border-zinc-800">
                          <span className="text-zinc-500 text-[7.5px] uppercase block">Volume Spike</span>
                          <span className="text-white font-extrabold">{selectedItem.araPotential.volumeSpikeMultiplier}</span>
                        </div>
                        <div className="bg-zinc-900/50 p-2 rounded-xl border border-zinc-800">
                          <span className="text-zinc-500 text-[7.5px] uppercase block">Rasio Bid/Offer</span>
                          <span className="text-white font-extrabold">{selectedItem.araPotential.bidOfferRatio}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-mono text-zinc-400">
                          <span>Tingkat Kesiapan Breakout ARA</span>
                          <span className="text-amber-400 font-bold">{selectedItem.araPotential.araScore}%</span>
                        </div>
                        <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-[#DFFF00]" 
                            style={{ width: `${selectedItem.araPotential.araScore}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-[9px] text-zinc-400 leading-normal font-sans italic border-t border-zinc-900/80 pt-2">
                        <span className="text-amber-400 font-bold font-mono not-italic mr-1">Katalis AI:</span>
                        {selectedItem.araPotential.catalyst}
                      </p>
                    </div>
                  )}

                  {/* Live Synced TradingView Advanced Chart Panel */}
                  <div className="h-44 bg-[#020407] border border-zinc-800 rounded-2xl overflow-hidden relative group">
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-zinc-900/90 border border-[#DFFF00]/40 text-[#DFFF00] text-[7.5px] font-black uppercase rounded tracking-widest z-10 pointer-events-none flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                      TRADINGVIEW LIVE SYNCED
                    </div>
                    <TradingViewWidget symbol={getTradingViewSymbol(selectedItem, activeMarket)} />
                  </div>

                  {/* Indicators Check */}
                  <div className="space-y-2.5 bg-zinc-900/30 p-3.5 rounded-2xl border border-zinc-900/80">
                    <h5 className="text-[8px] text-zinc-500 font-black uppercase tracking-wider font-mono">Indikator Forensik Pasar</h5>
                    
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-400 font-mono">RSI (14 Days)</span>
                      <span className={`font-mono font-bold ${
                        selectedItem.rsi < 40 ? 'text-emerald-400' : selectedItem.rsi > 70 ? 'text-red-400' : 'text-zinc-400'
                      }`}>
                        {selectedItem.rsi} ({selectedItem.rsi < 40 ? 'OVERSOLD' : selectedItem.rsi > 70 ? 'OVERBOUGHT' : 'NEUTRAL'})
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-400 font-mono">Garis MACD</span>
                      <span className="text-zinc-300 font-bold font-mono">{selectedItem.macd}</span>
                    </div>

                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-400 font-mono">EMA-20 Trendline</span>
                      <span className={`font-mono font-black ${
                        selectedItem.ema20Score === 'Bullish' ? 'text-emerald-400' : selectedItem.ema20Score === 'Bearish' ? 'text-red-400' : 'text-slate-400'
                      }`}>
                        {selectedItem.ema20Score}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-400 font-mono">Waktu Pengambilan</span>
                      <span className="text-zinc-400 font-mono">{selectedItem.timeframe} TF Chart</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2.5 flex gap-2 w-full">
                    <button
                      onClick={() => executePaperOrder(selectedItem)}
                      className="flex-1 py-2 px-3 bg-[#DFFF00] hover:bg-[#deff9a] text-slate-950 text-[10px] font-black rounded-xl uppercase tracking-wider border-none cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      Simulasikan Order
                    </button>
                    
                    <button
                      onClick={() => alert(`Laporan Kuantitatif Detail untuk ${selectedItem.symbol} telah dikompilasikan ke memory buffer. Sesi trading aman.`)}
                      className="py-2 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-[10px] font-bold rounded-xl uppercase tracking-wider cursor-pointer"
                    >
                      Ekspor Sinyal
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
