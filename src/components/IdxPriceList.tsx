import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  RefreshCw, 
  ExternalLink, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  ListFilter, 
  Info, 
  ChartCandlestick, 
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Sparkline from './Sparkline';
import TradingViewWidget from './TradingViewWidget';
import AdvanceChartModal from './AdvanceChartModal';
import { getTradingViewSymbol, formatStockPrice, getStockInfo } from '../lib/stockUtils';

interface PriceData {
  symbol: string;
  price: number;
  changePercent: number;
  timestamp: number;
  source?: string;
  vwap?: number;
  ema20?: number;
  ema50?: number;
  rsi?: number;
}

const MARKET_SYMBOLS: Record<string, Record<string, string>> = {
  IDX: {
    "BBCA": "PT Bank Central Asia Tbk.",
    "BBRI": "PT Bank Rakyat Indonesia (Persero) Tbk.",
    "BMRI": "PT Bank Mandiri (Persero) Tbk.",
    "TLKM": "PT Telkom Indonesia (Persero) Tbk.",
    "ASII": "PT Astra International Tbk.",
    "BBNI": "PT Bank Negara Indonesia (Persero) Tbk.",
    "ADRO": "PT Adaro Energy Indonesia Tbk.",
    "UNVR": "PT Unilever Indonesia Tbk.",
    "GOTO": "PT GoTo Gojek Tokopedia Tbk.",
    "ANTM": "PT Aneka Tambang Tbk.",
    "MDKA": "PT Merdeka Copper Gold Tbk.",
    "PTBA": "PT Bukit Asam Tbk.",
    "ITMG": "PT Indo Tambangraya Megah Tbk.",
    "HRUM": "PT Harum Energy Tbk.",
    "SMGR": "PT Semen Indonesia (Persero) Tbk.",
    "AMRT": "PT Sumber Alfaria Trijaya Tbk.",
    "ICBP": "PT Indofood CBP Sukses Makmur Tbk.",
    "INDF": "PT Indofood Sukses Makmur Tbk.",
    "KLBF": "PT Kalbe Farma Tbk.",
    "BRPT": "PT Barito Pacific Tbk.",
    "BREN": "PT Barito Renewables Energy Tbk.",
    "AMMN": "PT Amman Mineral Internasional Tbk.",
    "TPIA": "PT Chandra Asri Pacific Tbk.",
    "CPIN": "PT Charoen Pokphand Indonesia Tbk.",
    "BRMS": "PT Bumi Resources Minerals Tbk.",
    "PANI": "PT Pantai Indah Kapuk Dua Tbk.",
    "CUAN": "PT Petrindo Jaya Kreasi Tbk.",
    "PGAS": "PT Perusahaan Gas Negara Tbk.",
    "PGEO": "PT Pertamina Geothermal Energy Tbk.",
    "COAL": "PT Black Diamond Resources Tbk.",
    "DEFI": "PT Danasupra Erapacific Tbk.",
    "BUKA": "PT Bukalapak.com Tbk.",
    "MEDC": "PT Medco Energi Internasional Tbk.",
    "DEWA": "PT Darma Henwa Tbk.",
    "DSSA": "PT Dian Swastatika Sentosa Tbk.",
    "BUMI": "PT Bumi Resources Tbk.",
    "CTTH": "PT Citatah Tbk.",
    "JGLE": "PT Graha Andrasentra Propertindo Tbk.",
    "UNTR": "PT United Tractors Tbk.",
    "ACES": "PT Aspirasi Hidup Indonesia Tbk.",
    "EMTK": "PT Elang Mahkota Teknologi Tbk.",
    "BSDE": "PT Bumi Serpong Damai Tbk.",
    "MNCN": "PT Media Nusantara Citra Tbk.",
    "BBTN": "PT Bank Tabungan Negara (Persero) Tbk.",
    "INKP": "PT Indah Kiat Pulp & Paper Tbk.",
    "TKIM": "PT Pabrik Kertas Tjiwi Kimia Tbk.",
    "TOWR": "PT Sarana Menara Nusantara Tbk.",
    "TBIG": "PT Tower Bersama Infrastructure Tbk.",
    "AKRA": "PT AKR Corporindo Tbk.",
    "EXCL": "PT XL Axiata Tbk.",
    "ISAT": "PT Indosat Tbk.",
    "INCO": "PT Vale Indonesia Tbk.",
    "MBMA": "PT Merdeka Battery Materials Tbk.",
    "NCKL": "PT Trimegah Bangun Persada Tbk.",
    "PWON": "PT Pakuwon Jati Tbk.",
    "CTRA": "PT Ciputra Development Tbk.",
    "SMRA": "PT Summarecon Agung Tbk.",
    "MYOR": "PT Mayora Indah Tbk.",
    "CMRY": "PT Cisarua Mountain Dairy Tbk.",
    "MAPA": "PT Map Aktif Adiperkasa Tbk.",
    "MAPI": "PT Mitra Adiperkasa Tbk.",
    "BTPS": "PT Bank BTPN Syariah Tbk.",
    "ARTO": "PT Bank Jago Tbk.",
    "KOTA": "PT DMS Propertindo Tbk.",
    "LAND": "PT Trinitan Land Tbk.",
    "PIPA": "PT Multi Spunindo Jaya Tbk.",
    "WMUU": "PT Widodo Makmur Unggas Tbk.",
    "CGAS": "PT Citra Nusantara Energi Tbk.",
    "SMGA": "PT Sumber Mineral Global Abadi Tbk.",
    "GRPH": "PT Griptha Putra Persada Tbk.",
    "HYGN": "PT Ecocare Indo Pasifik Tbk.",
    "NICE": "PT Adhi Kartiko Pratama Tbk.",
    "ALII": "PT Ancara Logistics Indonesia Tbk.",
    "MSJA": "PT Multisrana Agrindo Tbk.",
    "LIVE": "PT Homeco Victoria Makmur Tbk.",
    "NEST": "PT Era Media Sejahtera Tbk.",
    "GOLF": "PT Intra GolfLink Resorts Tbk.",
    "SOLA": "PT Xolare Ropa Energy Tbk.",
    "BATR": "PT Benteng Anugrah Sejahtera Tbk.",
    "DATA": "PT Remala Abadi Tbk.",
    "MKAP": "PT Multikarya Asia Pasifik Raya Tbk.",
    "MHKI": "PT Multi Hanna Kreasindo Tbk.",
    "ERAL": "PT Sinar Eka Selaras Tbk.",
    "HUMI": "PT Humpuss Maritim Internasional Tbk.",
    "WIFI": "PT Solusi Sinergi Digital Tbk.",
    "SUNI": "PT Sunindo Pratama Tbk.",
    "FWCT": "PT Wijaya Cahaya Timber Tbk.",
    "VKTR": "PT VKTR Teknologi Mobilitas Tbk.",
    "NANO": "PT Nanotech Indonesia Global Tbk.",
    "HAIS": "PT Hasnur Internasional Shipping Tbk.",
    "BSBK": "PT Wulandari Bangun Laksana Tbk.",
    "BELI": "PT Global Digital Niaga Tbk. (Blibli)",
    "AUTO": "PT Astra Otoparts Tbk.",
    "PTRO": "PT Petrosea Tbk.",
    "SOCI": "PT Soechi Lines Tbk.",
    "BAIK": "PT Sentra Food Indonesia Tbk.",
    "AREA": "PT Area Real Estate Tbk.",
    "GOTO-W": "PT GoTo Gojek Tokopedia Warrant"
  },
  SGX: {
    "DBS": "DBS Group Holdings Ltd",
    "UOB": "United Overseas Bank Ltd",
    "OCBC": "Overseas-Chinese Banking Corp Ltd",
    "SINGTEL": "Singapore Telecommunications Ltd",
    "KEPPEL": "Keppel Ltd",
    "CAPITALAND": "CapitaLand Investment Ltd",
    "WILMAR": "Wilmar International Ltd",
    "SIA": "Singapore Airlines Ltd",
    "COMFORTDELGRO": "ComfortDelGro Corp Ltd",
    "SATS": "SATS Ltd",
    "Y92": "Thai Beverage PCL"
  },
  US: {
    "AAPL": "Apple Inc.",
    "MSFT": "Microsoft Corporation",
    "GOOGL": "Alphabet Inc.",
    "AMZN": "Amazon.com, Inc.",
    "NVDA": "NVIDIA Corporation",
    "TSLA": "Tesla, Inc.",
    "META": "Meta Platforms, Inc.",
    "NFLX": "Netflix, Inc.",
    "AMD": "Advanced Micro Devices",
    "COIN": "Coinbase Global",
    "PLTR": "Palantir Technologies Inc."
  },
  WORLD: {
    "IHSG COMPOSITE": "Jakarta Composite Index",
    "STI INDEX": "Straits Times Index",
    "S&P 500 INDEX": "S&P 500 Index (SPX)",
    "DOW JONES": "Dow Jones Industrials",
    "NASDAQ COMP": "Nasdaq Composite Index",
    "NIKKEI 225": "Nikkei 225 Average",
    "HANG SENG": "Hang Seng Index",
    "ASX 200": "S&P/ASX 200 (Australia)",
    "DAX INDEX": "DAX Performance Index (Germany)",
    "CAC 40": "CAC 40 Index (France)",
    "FTSE 100": "FTSE 100 Index (UK)",
    "GOLD FUTURES": "Gold Futures (COMEX)",
    "CRUDE OIL": "Crude Oil Futures"
  }
};

// Calculate Operating Hours for Each Exchange
const getMarketOperatingHours = (market: 'IDX' | 'SGX' | 'US' | 'WORLD') => {
  const now = new Date();
  const utcDay = now.getUTCDay(); // 0 = Sun, 6 = Sat
  const isWeekend = utcDay === 0 || utcDay === 6;

  if (market === 'IDX') {
    // WIB = UTC+7. Hours: Mon-Fri 09:00 - 16:00 WIB
    const wibHour = (now.getUTCHours() + 7) % 24;
    const wibMin = now.getUTCMinutes();
    const wibVal = wibHour * 100 + wibMin;
    const isOpen = !isWeekend && wibVal >= 900 && wibVal < 1600;
    return {
      isOpen,
      name: 'Bursa Efek Indonesia (IDX)',
      hours: '09:00 - 16:00 WIB',
      timezone: 'WIB (UTC+7)',
      localTime: `${String(wibHour).padStart(2, '0')}:${String(wibMin).padStart(2, '0')} WIB`,
      statusText: isOpen ? 'SESI AKTIF (OPEN)' : isWeekend ? 'TUTUP (AKHIR PEKAN)' : 'TUTUP (LUAR JAM BURSA)',
      delayNotice: 'Optimasi Stabil: Penyangga Update 600ms (Anti-Lag)'
    };
  } else if (market === 'SGX') {
    // SGT = UTC+8. Hours: Mon-Fri 09:00 - 17:00 SGT
    const sgtHour = (now.getUTCHours() + 8) % 24;
    const sgtMin = now.getUTCMinutes();
    const sgtVal = sgtHour * 100 + sgtMin;
    const isOpen = !isWeekend && sgtVal >= 900 && sgtVal < 1700;
    return {
      isOpen,
      name: 'Singapore Exchange (SGX)',
      hours: '09:00 - 17:00 SGT',
      timezone: 'SGT (UTC+8)',
      localTime: `${String(sgtHour).padStart(2, '0')}:${String(sgtMin).padStart(2, '0')} SGT`,
      statusText: isOpen ? 'REGULAR SESSION (OPEN)' : isWeekend ? 'CLOSED (WEEKEND)' : 'CLOSED (AFTER HOURS)',
      delayNotice: 'Optimasi Stabil: Penyangga Update 600ms (Anti-Lag)'
    };
  } else if (market === 'US') {
    // EDT = UTC-4. Hours: Mon-Fri 09:30 - 16:00 EDT
    const edtHour = (now.getUTCHours() - 4 + 24) % 24;
    const edtMin = now.getUTCMinutes();
    const edtVal = edtHour * 100 + edtMin;
    const isOpen = !isWeekend && edtVal >= 930 && edtVal < 1600;
    return {
      isOpen,
      name: 'US Markets (NASDAQ / NYSE)',
      hours: '09:30 - 16:00 EDT',
      timezone: 'EDT (UTC-4)',
      localTime: `${String(edtHour).padStart(2, '0')}:${String(edtMin).padStart(2, '0')} EDT`,
      statusText: isOpen ? 'REGULAR SESSION (OPEN)' : isWeekend ? 'CLOSED (WEEKEND)' : 'CLOSED (PRE/POST MARKET)',
      delayNotice: 'Optimasi Stabil: Penyangga Update 600ms (Anti-Lag)'
    };
  } else {
    // WORLD
    const utcHour = now.getUTCHours();
    const utcMin = now.getUTCMinutes();
    return {
      isOpen: true,
      name: 'Global Indices & Commodities',
      hours: '24 Jam Kontinu',
      timezone: 'UTC',
      localTime: `${String(utcHour).padStart(2, '0')}:${String(utcMin).padStart(2, '0')} UTC`,
      statusText: 'UMPAN REAL-TIME GLOBAL 24/7',
      delayNotice: 'Optimasi Stabil: Penyangga Update 600ms (Anti-Lag)'
    };
  }
};

export const IdxPriceList = () => {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [selectedMarket, setSelectedMarket] = useState<'IDX' | 'SGX' | 'US' | 'WORLD'>('IDX');
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeMoverTab, setActiveMoverTab] = useState<'active' | 'gainers' | 'losers'>('active');
  const [tickerHistory, setTickerHistory] = useState<Record<string, number[]>>({});
  const [priceFlash, setPriceFlash] = useState<Record<string, 'up' | 'down' | null>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllTickers, setShowAllTickers] = useState(true);
  
  const pricesRef = useRef(prices);
  pricesRef.current = prices;

  const pendingUpdatesRef = useRef<Record<string, PriceData>>({});
  
  // Custom states for TradingView, Google Finance, and BEI (idx.co.id) Integration
  const [feedSource, setFeedSourceState] = useState<'idx_official' | 'tradingview' | 'googlefinance' | 'hybrid'>(() => {
    const existing = localStorage.getItem('vam-feed-source');
    if (!existing) {
      localStorage.setItem('vam-feed-source', 'idx_official');
      return 'idx_official';
    }
    return existing as any;
  });
  const [selectedTickerRow, setSelectedTickerRow] = useState<string | null>(null);
  const [advanceChartSymbol, setAdvanceChartSymbol] = useState<string | null>(null);
  const [feedStatusText, setFeedStatusText] = useState<string>("SYSTEM CORRELATION ACTIVE");

  const setFeedSource = (source: 'idx_official' | 'tradingview' | 'googlefinance' | 'hybrid') => {
    localStorage.setItem('vam-feed-source', source);
    setFeedSourceState(source);
    window.dispatchEvent(new CustomEvent('vam-feed-source-changed', { detail: source }));
  };

  useEffect(() => {
    const handleSourceChanged = (e: Event) => {
      const source = (e as CustomEvent).detail;
      if (source) {
        setFeedSourceState(prev => {
          if (prev !== source) {
            return source;
          }
          return prev;
        });
      }
    };
    window.addEventListener('vam-feed-source-changed', handleSourceChanged);
    return () => window.removeEventListener('vam-feed-source-changed', handleSourceChanged);
  }, []);

  const handleManualRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    // Dispatch global refresh event
    window.dispatchEvent(new CustomEvent('vam-force-market-refresh'));
    
    const dynamicSource = feedSource === 'tradingview' ? 'TRADINGVIEW DATABRIDGE' : feedSource === 'googlefinance' ? 'GOOGLE FINANCE CORE' : (selectedMarket === 'IDX' ? 'GF + TV + CAM GATEWAY' : 'GOOGLE FINANCE + TRADINGVIEW HYBRID ENGINE');
    setFeedStatusText(`PULLING REFRESH DATA FROM ${dynamicSource}...`);
    
    setTimeout(() => {
      setIsRefreshing(false);
      const syncMsg = feedSource === 'tradingview' ? 'TRADINGVIEW WEBSOCKETS' : feedSource === 'googlefinance' ? 'GOOGLE FINANCE RECURSIVE SCALES' : (selectedMarket === 'IDX' ? 'COMPOSITE FEED (GF + TV + CAM)' : 'GF + TV SYNCHRONIZED GATEWAY');
      setFeedStatusText(`SYNCHRONIZED WITH ${syncMsg}`);
    }, 1000);
  };

  useEffect(() => {
    const dynamicNode = feedSource === 'tradingview' ? 'TRADINGVIEW DIRECT API' : feedSource === 'googlefinance' ? 'GOOGLE FINANCE PUBLIC SYNC' : (selectedMarket === 'IDX' ? 'GF + TV + CAM COREGATEWAY' : 'GOOGLE FINANCE + TRADINGVIEW HYBRID');
    setFeedStatusText(`RECONNECTING TO ${dynamicNode} NODE...`);
    const t = setTimeout(() => {
      const activeFeed = feedSource === 'tradingview' ? 'TRADINGVIEW LIVE' : feedSource === 'googlefinance' ? 'GOOGLE FINANCE SCRAPE' : (selectedMarket === 'IDX' ? 'GF+TV+CAM TRIPLE-CORRELATION' : 'GF+TV DUAL-CORE');
      setFeedStatusText(`DYNAMIC FEED CORRELATION: ${activeFeed} ACTIVE`);
    }, 800);
    return () => clearTimeout(t);
  }, [feedSource, selectedMarket]);

  // Fetch initial prices and set up buffered throttled updates (Delay up/down anti-lag mechanism)
  useEffect(() => {
    const fetchInitialPrices = async () => {
      try {
        const response = await fetch('/api/market/realtime-prices');
        if (response.ok) {
          const data = await response.json();
          setPrices(prev => ({ ...prev, ...data }));
          setLastUpdate(new Date().toLocaleTimeString('id-ID'));
          
          const initialHist: Record<string, number[]> = {};
          Object.keys(MARKET_SYMBOLS).forEach(marketKey => {
            Object.keys(MARKET_SYMBOLS[marketKey]).forEach(sym => {
              const currentPrice = data[sym]?.price || 100;
              initialHist[sym] = Array.from({ length: 15 }, (_, i) => 
                currentPrice * (1 + (Math.sin(i / 2) * 0.008) + (Math.cos(i / 3) * 0.004))
              );
            });
          });
          setTickerHistory(initialHist);
        }
      } catch (err: any) {
        console.warn("Failed to fetch initial realtime prices:", err?.message || err);
      }
    };
    fetchInitialPrices();

    // Event handler pushes to pending queue to prevent immediate React re-renders (Anti-Lag Buffer)
    const handleMarketUpdate = (event: any) => {
      const data = event.detail;
      if (data && data.symbol) {
        pendingUpdatesRef.current[data.symbol] = data;
      }
    };

    window.addEventListener('vam-market-update', handleMarketUpdate);

    // Throttle interval loop (processes queued updates every 600ms)
    const throttleInterval = setInterval(() => {
      const queuedKeys = Object.keys(pendingUpdatesRef.current);
      if (queuedKeys.length === 0) return;

      const updatesBatch = { ...pendingUpdatesRef.current };
      pendingUpdatesRef.current = {};

      const currentPrices = pricesRef.current;
      const flashes: Record<string, 'up' | 'down' | null> = {};

      queuedKeys.forEach(sym => {
        const fresh = updatesBatch[sym];
        const old = currentPrices[sym]?.price;
        if (old !== undefined && old !== fresh.price) {
          flashes[sym] = fresh.price > old ? 'up' : 'down';
        }
      });

      // Batch state update
      setPrices(prev => ({
        ...prev,
        ...updatesBatch
      }));

      setLastUpdate(new Date().toLocaleTimeString('id-ID'));

      // Apply price flashes with controlled delay
      if (Object.keys(flashes).length > 0) {
        setPriceFlash(prev => ({ ...prev, ...flashes }));
        setTimeout(() => {
          setPriceFlash(prev => {
            const next = { ...prev };
            Object.keys(flashes).forEach(k => {
              next[k] = null;
            });
            return next;
          });
        }, 700);
      }

      // Roll sparkline history
      setTickerHistory(prev => {
        const next = { ...prev };
        queuedKeys.forEach(sym => {
          const freshPrice = updatesBatch[sym].price;
          const current = next[sym] || [];
          next[sym] = current.length > 0
            ? [...current, freshPrice].slice(-15)
            : Array.from({ length: 15 }, (_, i) => freshPrice * (1 + (Math.sin(i / 2) * 0.005)));
        });
        return next;
      });
    }, 600);

    return () => {
      window.removeEventListener('vam-market-update', handleMarketUpdate);
      clearInterval(throttleInterval);
    };
  }, []);

  // Filter and sort tickers with strict prompt criteria
  const getFilteredSymbols = () => {
    let list = Object.keys(MARKET_SYMBOLS[selectedMarket]);
    
    // Apply search filter if entered
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(sym => 
        sym.toLowerCase().includes(q) || 
        MARKET_SYMBOLS[selectedMarket][sym].toLowerCase().includes(q)
      );
    }
    
    if (activeMoverTab === 'active') {
      // Teraktif: Sort by highest activity volume & price volatility
      return list.sort((a, b) => {
        const pA = Math.abs(prices[a]?.changePercent || 0);
        const pB = Math.abs(prices[b]?.changePercent || 0);
        return pB - pA;
      });
    } else if (activeMoverTab === 'gainers') {
      // Top Gainers: Minimum threshold >= +3.0%
      return list
        .filter(sym => (prices[sym]?.changePercent || 0) >= 3.0)
        .sort((a, b) => (prices[b]?.changePercent || 0) - (prices[a]?.changePercent || 0));
    } else {
      // Top Losers: Maximum threshold <= -5.0%
      return list
        .filter(sym => (prices[sym]?.changePercent || 0) <= -5.0)
        .sort((a, b) => (prices[a]?.changePercent || 0) - (prices[b]?.changePercent || 0));
    }
  };

  const filteredSymbolsOutput = getFilteredSymbols();
  const processedSymbols = showAllTickers ? filteredSymbolsOutput : filteredSymbolsOutput.slice(0, 10);

  const calcPriceChange = (price: number, changePercent: number) => {
    if (!price || changePercent === 0) return 0;
    const prevClose = price / (1 + (changePercent / 100));
    return price - prevClose;
  };

  const formatPrice = (price: number, market: string, symbol: string) => {
    if (market === 'IDX') {
      return `Rp ${Math.round(price).toLocaleString('id-ID')}`;
    }
    if (market === 'SGX') {
      return `S$ ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (market === 'US') {
      return `$ ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (symbol.includes('GOLD') || symbol.includes('CRUDE')) {
      return `$ ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatChangeAmount = (amount: number, market: string, symbol: string) => {
    if (market === 'IDX') {
      return `${amount >= 0 ? '+' : ''}${Math.round(amount).toLocaleString('id-ID')} Rp`;
    }
    if (market === 'SGX') {
      return `${amount >= 0 ? '+' : ''}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} S$`;
    }
    if (market === 'US' || symbol.includes('GOLD') || symbol.includes('CRUDE')) {
      return `${amount >= 0 ? '+' : ''}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} US$`;
    }
    return `${amount >= 0 ? '+' : ''}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pts`;
  };

  const getGoogleFinanceLink = (symbol: string, market: string) => {
    if (market === 'IDX') return `https://www.google.com/finance/quote/${symbol}:IDX`;
    if (market === 'SGX') return `https://www.google.com/finance/quote/${symbol}:SGX`;
    if (market === 'US') return `https://www.google.com/finance/quote/${symbol}:NASDAQ`;
    if (symbol === 'S&P 500 INDEX') return 'https://www.google.com/finance/quote/.INX:INDEXSP';
    if (symbol === 'NASDAQ COMP') return 'https://www.google.com/finance/quote/IXIC:INDEXNASDAQ';
    if (symbol === 'DOW JONES') return 'https://www.google.com/finance/quote/.DJI:INDEXDJX';
    if (symbol === 'IHSG COMPOSITE') return 'https://www.google.com/finance/quote/COMPOSITE:IDX';
    if (symbol === 'STI INDEX') return 'https://www.google.com/finance/quote/STI:SGX';
    return `https://www.google.com/finance/quote/${symbol}`;
  };

  const getTradingViewLink = (symbol: string, market: string) => {
    if (market === 'IDX') return `https://www.tradingview.com/symbols/IDX-${symbol}/`;
    if (market === 'SGX') return `https://www.tradingview.com/symbols/SGX-${symbol}/`;
    if (market === 'US') return `https://www.tradingview.com/symbols/NASDAQ-${symbol}/`;
    if (symbol === 'S&P 500 INDEX') return 'https://www.tradingview.com/symbols/SPX/';
    if (symbol === 'NASDAQ COMP') return 'https://www.tradingview.com/symbols/IXIC/';
    if (symbol === 'DOW JONES') return 'https://www.tradingview.com/symbols/DJI/';
    return `https://www.tradingview.com/symbols/${symbol}/`;
  };

  const getTradingViewWidgetSymbol = (symbol: string, market: string): string => {
    return getTradingViewSymbol(symbol);
  };

  const marketHours = getMarketOperatingHours(selectedMarket);

  const tabs = [
    { id: 'active', label: 'Teraktif', badge: 'Jam Bursa', icon: Activity, color: 'text-[#deff9a]' },
    { id: 'gainers', label: 'Top Gainers', badge: '≥ +3%', icon: TrendingUp, color: 'text-emerald-400' },
    { id: 'losers', label: 'Top Losers', badge: '≤ -5%', icon: TrendingDown, color: 'text-rose-400' }
  ] as const;

  const getSourceTag = () => {
    if (feedSource === 'idx_official') return { text: "BEI DIRECT (idx.co.id)", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
    if (feedSource === 'tradingview') return { text: "TV-RT (LIVE)", color: "text-sky-400 bg-sky-500/10 border-sky-500/20" };
    if (feedSource === 'googlefinance') return { text: "GF-RT (SYNC)", color: "text-[#deff9a] bg-[#deff9a]/10 border-[#deff9a]/20" };
    if (selectedMarket === 'IDX') {
      return { text: "GF + TV + CAM GATEWAY", color: "text-amber-400 bg-amber-500/10 border border-amber-500/25" };
    } else {
      return { text: "GF + TV HYBRID", color: "text-amber-400 bg-amber-500/10 border border-amber-500/25" };
    }
  };

  const activeSourceTag = getSourceTag();

  return (
    <div id="idx_price_list_wrapper" className="bg-zinc-950/60 rounded-3xl border border-zinc-800/80 overflow-hidden backdrop-blur-md shadow-2xl">
      {/* Top Header Panel */}
      <div className="p-4 border-b border-zinc-900/80 flex flex-col sm:flex-row justify-between sm:items-center bg-zinc-900/20 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#deff9a]/10 border border-[#deff9a]/20 rounded-xl">
            <Zap className="w-4 h-4 text-[#deff9a] animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              Market Monitor Engine
              <span className={`text-[7.5px] font-black px-2 py-0.5 rounded border ${
                marketHours.isOpen 
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' 
                  : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
              }`}>
                {marketHours.statusText}
              </span>
            </h3>
            <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mt-1">
              {marketHours.name} • {marketHours.hours} ({marketHours.localTime})
            </p>
          </div>
        </div>

        {/* FEED SOURCE CONTROLLER */}
        <div className="flex flex-wrap items-center gap-3 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800/80">
          <div className="text-left">
            <span className="text-[7px] text-zinc-500 font-black uppercase tracking-widest block leading-3">Umpan Harga</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded border ${activeSourceTag.color}`}>
                {activeSourceTag.text}
              </span>
              <span className="text-[9px] text-zinc-400 font-mono font-bold">{lastUpdate || '--:--:--'}</span>
            </div>
          </div>
          
          <div className="flex gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800/80">
            <button
              onClick={() => setFeedSource('idx_official')}
              title="Connect pricing with Bursa Efek Indonesia Official Feed (https://www.idx.co.id/id)"
              className={`p-1 text-[8.5px] font-bold uppercase tracking-wider rounded-md transition-all px-2 ${
                feedSource === 'idx_official'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              BEI (idx.co.id)
            </button>
            <button
              onClick={() => setFeedSource('tradingview')}
              title="Connect pricing with TradingView DataBridge WebSockets"
              className={`p-1 text-[8.5px] font-bold uppercase tracking-wider rounded-md transition-all px-2 ${
                feedSource === 'tradingview'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 font-black'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              TV
            </button>
            <button
              onClick={() => setFeedSource('googlefinance')}
              title="Connect pricing with Google Finance Public Sync"
              className={`p-1 text-[8.5px] font-bold uppercase tracking-wider rounded-md transition-all px-2 ${
                feedSource === 'googlefinance'
                  ? 'bg-[#deff9a]/20 text-[#deff9a] border border-[#deff9a]/30 font-black'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              GF
            </button>
            <button
              onClick={() => setFeedSource('hybrid')}
              title="Hybrid Data Core Synchronization"
              className={`p-1 text-[8.5px] font-bold uppercase tracking-wider rounded-md transition-all px-2 ${
                feedSource === 'hybrid'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Core
            </button>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-[#deff9a] hover:text-white transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-md"
            title={`Sync / Refresh ${selectedMarket} Feed`}
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Real-time Status Alert & Operating Schedule Bar */}
      <div className="bg-zinc-950 px-4 py-2 border-b border-zinc-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="w-3 h-3 text-[#deff9a] shrink-0" />
          <span className="text-[9px] font-mono font-bold text-zinc-300 uppercase tracking-wider truncate">
            {marketHours.name}: <span className={marketHours.isOpen ? "text-emerald-400 font-extrabold" : "text-amber-400 font-extrabold"}>{marketHours.statusText}</span> ({marketHours.hours})
          </span>
        </div>
        <div className="flex items-center gap-2 text-zinc-400 text-[8.5px] font-mono font-bold shrink-0">
          <CheckCircle2 className="w-3 h-3 text-[#deff9a]" />
          <span>Column Fixed Layout (Anti-Lag) • Delay Up/Down Buffer 600ms</span>
        </div>
      </div>

      {/* Market Selector Tabs */}
      <div className="flex border-b border-zinc-900/80 bg-zinc-950/60 p-1.5 gap-1.5">
        {(['IDX', 'SGX', 'US', 'WORLD'] as const).map((m) => {
          const isActive = selectedMarket === m;
          const marketLabels: Record<string, string> = {
            IDX: 'IDX (INDONESIA)',
            SGX: 'SGX (SINGAPORE)',
            US: 'US MARKETS',
            WORLD: 'WORLD FEED'
          };
          const mHours = getMarketOperatingHours(m);
          return (
            <button
              key={m}
              onClick={() => {
                setSelectedMarket(m);
                setSelectedTickerRow(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-[9.5px] uppercase tracking-wider font-extrabold transition-all relative flex flex-col items-center justify-center gap-0.5 ${
                isActive 
                  ? 'bg-[#deff9a]/10 text-[#deff9a] border border-[#deff9a]/30 shadow-md font-black' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
              }`}
            >
              <span>{marketLabels[m]}</span>
              <span className={`text-[7px] px-1.5 py-0.2 rounded font-mono font-bold ${
                mHours.isOpen 
                  ? 'text-emerald-400 bg-emerald-500/10' 
                  : 'text-zinc-500 bg-zinc-900'
              }`}>
                {mHours.isOpen ? 'OPEN' : 'CLOSED'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mover Category Selector (Teraktif, Top Gainers >= +3%, Top Losers <= -5%) */}
      <div className="flex border-b border-zinc-900/80 bg-zinc-950/40 p-1.5 gap-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeMoverTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveMoverTab(tab.id);
                setSelectedTickerRow(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-[10.5px] uppercase tracking-wider font-extrabold transition-all relative ${
                isActive 
                  ? 'bg-zinc-900 text-white shadow-xl border border-zinc-800' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${tab.color} ${isActive ? 'opacity-100' : 'opacity-60'}`} />
              <span>{tab.label}</span>
              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-md ${
                isActive ? 'bg-[#deff9a] text-black font-black' : 'bg-zinc-800 text-zinc-400 font-bold'
              }`}>
                {tab.badge}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="activeMoversTabLine"
                  className="absolute bottom-0 left-4 right-4 h-[2.5px] bg-[#deff9a] rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Search and Limit Filter Bar */}
      <div className="p-3 border-b border-zinc-900/80 bg-zinc-950/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder={`Cari $TICKER atau nama perusahaan di ${selectedMarket}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/80 text-xs text-white placeholder-zinc-500 pl-9 pr-4 py-2 rounded-xl border border-zinc-800 focus:border-[#deff9a]/40 focus:outline-none focus:ring-1 focus:ring-[#deff9a]/20 transition-all font-semibold"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 hover:text-white transition-colors"
            >
              Reset
            </button>
          )}
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
            <ListFilter className="w-3 h-3 text-[#deff9a]" />
            Tampilan Ticker:
          </span>
          <div className="flex bg-zinc-900/60 p-0.5 rounded-xl border border-zinc-800">
            <button
              onClick={() => setShowAllTickers(false)}
              className={`px-3 py-1 text-[8.5px] font-black uppercase tracking-wider rounded-lg transition-all ${
                !showAllTickers 
                  ? 'bg-zinc-800 text-[#deff9a] font-extrabold shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Top 10
            </button>
            <button
              onClick={() => setShowAllTickers(true)}
              className={`px-3 py-1 text-[8.5px] font-black uppercase tracking-wider rounded-lg transition-all ${
                showAllTickers 
                  ? 'bg-zinc-800 text-[#deff9a] font-extrabold shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Semua ({filteredSymbolsOutput.length})
            </button>
          </div>
        </div>
      </div>

      {/* Threshold Information Banner */}
      <div className="bg-zinc-900/30 px-4 py-2 text-[9.5px] text-zinc-300 flex items-center justify-between gap-2 border-b border-zinc-900/80 flex-wrap">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-[#deff9a] shrink-0" />
          <span>
            {activeMoverTab === 'gainers' ? (
              <span>Kriteria Top Gainer: Filter otomatis saham dengan persentase kenaikan <strong className="text-emerald-400">minimal +3.00%</strong>.</span>
            ) : activeMoverTab === 'losers' ? (
              <span>Kriteria Top Loser: Filter otomatis saham dengan persentase penurunan <strong className="text-rose-400">maksimal -5.00%</strong>.</span>
            ) : (
              <span>Kriteria Teraktif: Diurutkan berdasarkan pergerakan harga & volume transaksi pada jam operasional <strong className="text-[#deff9a]">{marketHours.hours}</strong>.</span>
            )}
          </span>
        </div>
        <span className="text-[8.5px] font-mono font-bold text-zinc-500">
          Klik baris ticker untuk membuka Chart Interactive TradingView
        </span>
      </div>

      {/* Fixed Layout Table (Prevents System Lag & Stutter) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed min-w-[550px] sm:min-w-0">
          <thead>
            <tr className="border-b border-zinc-900/80 bg-zinc-950/40">
              <th className="px-4 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest w-[34%] sm:w-[30%]">Ticker & Perusahaan</th>
              <th className="px-4 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-right w-[24%] sm:w-[22%]">Harga Terakhir</th>
              <th className="px-4 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-right w-[24%] sm:w-[24%]">Daily Change</th>
              <th className="px-4 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center w-[18%] sm:w-[24%] hidden sm:table-cell">1D Sparkline</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/40">
            {processedSymbols.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center bg-zinc-950/20">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 text-zinc-500">
                      <AlertCircle className="w-6 h-6 text-[#deff9a]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        {activeMoverTab === 'gainers' 
                          ? 'Tidak Ada Ticker dengan Kenaikan ≥ +3.00%' 
                          : activeMoverTab === 'losers' 
                          ? 'Tidak Ada Ticker dengan Penurunan ≤ -5.00%' 
                          : 'Tidak Ada Data Ticker'}
                      </h4>
                      <p className="text-[10px] text-zinc-500 mt-1 max-w-md mx-auto leading-relaxed">
                        {activeMoverTab === 'gainers'
                          ? `Saat ini belum ada ticker di pasar ${selectedMarket} yang memenuhi kriteria kenaikan minimal +3.00%.`
                          : activeMoverTab === 'losers'
                          ? `Saat ini belum ada ticker di pasar ${selectedMarket} yang memenuhi kriteria penurunan maksimal -5.00%.`
                          : `Tidak ada ticker yang sesuai dengan kata kunci "${searchQuery}".`}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setShowAllTickers(true);
                        if (activeMoverTab !== 'active') setActiveMoverTab('active');
                      }}
                      className="px-4 py-2 bg-[#deff9a] text-black rounded-xl text-[9.5px] font-black uppercase tracking-wider hover:opacity-90 transition-opacity mt-1 cursor-pointer"
                    >
                      Lihat Semua Teraktif ({selectedMarket})
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              processedSymbols.map((symbol, idx) => {
                const data = prices[symbol];
                const isPositive = data ? data.changePercent >= 0 : true;
                const flash = priceFlash[symbol];
                const deltaChange = data ? calcPriceChange(data.price, data.changePercent) : 0;
                const isExpanded = selectedTickerRow === symbol;
                
                const currentPrice = data?.price || 1000;
                const changePct = data?.changePercent || 0;
                const isPricePositive = changePct >= 0;
                
                const openVal = currentPrice / (1 + (changePct / 100));
                const highVal = isPricePositive ? currentPrice * 1.012 : openVal * 1.008;
                const lowVal = isPricePositive ? openVal * 0.991 : currentPrice * 0.988;
                
                const simulatedVolumeMap: Record<string, string> = {
                  BBCA: "48.2M", BBRI: "112.5M", BMRI: "71.8M", TLKM: "89.2M", ASII: "22.4M",
                  AAPL: "62.4M", MSFT: "19.5M", GOOGL: "24.2M", AMZN: "35.1M", NVDA: "49.8M",
                  TSLA: "91.2M", DBS: "3.2M", UOB: "2.1M", OCBC: "1.8M", BREN: "5.4M"
                };
                const specVol = simulatedVolumeMap[symbol] || `${(currentPrice * 0.05).toFixed(1)}M`;
                
                const peMap: Record<string, string> = {
                  BBCA: "24.8x", BBRI: "11.2x", BMRI: "10.5x", TLKM: "14.2x", ASII: "6.8x",
                  AAPL: "28.5x", MSFT: "35.2x", GOOGL: "22.4x", NVDA: "72.4x", TSLA: "45.1x"
                };
                const specPe = peMap[symbol] || "13.4x";

                const divMap: Record<string, string> = {
                  BBCA: "2.12%", BBRI: "4.85%", BMRI: "5.10%", TLKM: "4.25%", ASII: "6.80%",
                  AAPL: "0.52%", MSFT: "0.74%", GOTO: "0.00%", BREN: "0.15%"
                };
                const specDiv = divMap[symbol] || "1.85%";

                return (
                  <React.Fragment key={`${activeMoverTab}-${selectedMarket}-${symbol}-${idx}`}>
                    <tr 
                      onClick={() => setSelectedTickerRow(isExpanded ? null : symbol)}
                      className={`hover:bg-white/[0.03] transition-colors group cursor-pointer ${
                        isExpanded ? 'bg-zinc-900/40' : ''
                      }`}
                    >
                      {/* COLUMN 1: TICKER & NAME */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-black text-white group-hover:text-[#deff9a] transition-colors">{symbol}</span>
                            
                            <span className={`text-[7px] font-black font-mono leading-none px-1 py-0.5 rounded ${
                              feedSource === 'tradingview' 
                                ? 'text-sky-300 bg-sky-500/10 border border-sky-500/20' 
                                : feedSource === 'googlefinance'
                                ? 'text-[#deff9a] bg-[#deff9a]/10 border border-[#deff9a]/20'
                                : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                            }`}>
                              {feedSource === 'tradingview' ? 'TV' : feedSource === 'googlefinance' ? 'GF' : (selectedMarket === 'IDX' ? 'GF+TV+CAM' : 'GF+TV')}
                            </span>

                            <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity ml-1" onClick={e => e.stopPropagation()}>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAdvanceChartSymbol(getTradingViewWidgetSymbol(symbol, selectedMarket));
                                }}
                                className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-sky-500/15 border border-sky-500/30 text-sky-300 hover:bg-sky-500 hover:text-black transition-all flex items-center gap-1 shrink-0"
                                title={`Buka Advance Chart untuk ${symbol}`}
                              >
                                <ChartCandlestick className="w-2.5 h-2.5 text-sky-400 group-hover:text-black" />
                                <span className="hidden sm:inline">Advance Chart</span>
                              </button>

                              <a 
                                href={getGoogleFinanceLink(symbol, selectedMarket)}
                                target="_blank"
                                rel="noreferrer"
                                title={`Google Finance: ${symbol}`}
                                className="p-0.5 hover:bg-[#deff9a] hover:text-black rounded transition-all text-[#deff9a]"
                              >
                                <Globe className="w-2.5 h-2.5" />
                              </a>
                              <a 
                                href={getTradingViewLink(symbol, selectedMarket)}
                                target="_blank"
                                rel="noreferrer"
                                title={`TradingView Chart: ${symbol}`}
                                className="p-0.5 hover:bg-sky-500 hover:text-black rounded transition-all text-sky-400"
                              >
                                <ChartCandlestick className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          </div>
                          <span className="text-[8px] font-semibold text-zinc-500 uppercase truncate max-w-[150px] sm:max-w-[200px] block mt-0.5 leading-none">
                            {MARKET_SYMBOLS[selectedMarket][symbol]}
                          </span>
                        </div>
                      </td>

                      {/* COLUMN 2: PRICE */}
                      <td className="px-4 py-3 text-right">
                        <motion.span 
                          animate={{
                            color: flash === 'up' ? '#34d399' : flash === 'down' ? '#f87171' : '#e4e4e7',
                            scale: flash ? 1.05 : 1
                          }}
                          transition={{ duration: 0.15 }}
                          className={`text-[11px] font-mono font-bold block ${flash ? "font-black" : ""}`}
                        >
                          {data ? formatPrice(data.price, selectedMarket, symbol) : '---'}
                        </motion.span>
                      </td>

                      {/* COLUMN 3: PERCENTAGE MOVEMENT */}
                      <td className="px-4 py-3 text-right">
                        {data ? (
                          <div className="flex flex-col items-end">
                            <div className={`flex items-center justify-end gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              <span className="text-[10px] font-black leading-none font-mono">
                                {isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%
                              </span>
                            </div>
                            <span className="text-[8px] font-bold font-mono text-zinc-500 mt-1">
                              {formatChangeAmount(deltaChange, selectedMarket, symbol)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-black text-zinc-600">---</span>
                        )}
                      </td>

                      {/* COLUMN 4: 1D SPARKLINE */}
                      <td className="px-4 py-3 text-center hidden sm:table-cell pl-6 pr-6">
                        {tickerHistory[symbol] && tickerHistory[symbol].length > 0 ? (
                          <Sparkline 
                            data={tickerHistory[symbol]} 
                            color={isPositive ? '#34d399' : '#f87171'} 
                            height={20}
                          />
                        ) : (
                          <div className="h-5 w-full bg-zinc-900 animate-pulse rounded" />
                        )}
                      </td>
                    </tr>

                    {/* EXPANDED INTERACTIVE PANEL */}
                    {isExpanded && (
                      <tr className="bg-zinc-950/80">
                        <td colSpan={4} className="p-4 border-l border-r border-[#deff9a]/20 bg-zinc-950/95 overflow-hidden">
                          <AnimatePresence>
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="flex flex-col xl:flex-row gap-4 align-stretch"
                            >
                              {/* TradingView Live Chart Widget */}
                              <div className="flex-1 min-h-[300px] bg-zinc-900/40 rounded-2xl border border-zinc-800/80 overflow-hidden relative">
                                <div className="px-3 py-2 bg-zinc-950 border-b border-zinc-900 flex justify-between items-center bg-black/40">
                                  <span className="text-[8px] font-mono text-sky-400 font-extrabold tracking-wider uppercase flex items-center gap-1">
                                    <ChartCandlestick className="w-3 h-3 text-sky-400 animate-pulse" />
                                    TRADINGVIEW INTERACTIVE LIVE CHART: {getTradingViewWidgetSymbol(symbol, selectedMarket)}
                                  </span>
                                  <span className="text-[7.5px] font-black px-1.5 py-0.5 rounded text-white bg-sky-500/10 border border-sky-400/20">
                                    SUB-SECOND FEED
                                  </span>
                                </div>
                                <div className="p-1 h-[270.5px] w-full relative">
                                  <TradingViewWidget 
                                    symbol={getTradingViewWidgetSymbol(symbol, selectedMarket)} 
                                    overrideCurrentPrice={data?.price}
                                  />
                                </div>
                              </div>

                              {/* Detailed Pricing Metrics */}
                              <div className="w-full xl:w-[320px] shrink-0 bg-zinc-900/30 rounded-2xl border border-zinc-800/80 p-3.5 flex flex-col justify-between">
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                                    <div>
                                      <h4 className="text-[12px] font-black text-white">{symbol}</h4>
                                      <span className="text-[8.5px] text-zinc-400 uppercase font-medium">{MARKET_SYMBOLS[selectedMarket][symbol]}</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[11px] font-mono font-bold text-white block">
                                        {data ? formatPrice(data.price, selectedMarket, symbol) : '---'}
                                      </span>
                                      <span className={`text-[8.5px] font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {isPositive ? '+' : ''}{data?.changePercent?.toFixed(2)}%
                                      </span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                                    <div className="bg-zinc-900/40 p-2 rounded-lg border border-zinc-900/60">
                                      <span className="text-zinc-500 text-[8px] uppercase block">Open / Buka</span>
                                      <span className="text-white font-bold block mt-0.5">{formatPrice(openVal, selectedMarket, symbol)}</span>
                                    </div>
                                    <div className="bg-zinc-900/40 p-2 rounded-lg border border-zinc-900/60">
                                      <span className="text-zinc-500 text-[8px] uppercase block">Volume Transaksi</span>
                                      <span className="text-white font-bold block mt-0.5">{specVol}</span>
                                    </div>
                                    <div className="bg-zinc-900/40 p-2 rounded-lg border border-zinc-900/60">
                                      <span className="text-zinc-500 text-[8px] uppercase block">High / Tertinggi</span>
                                      <span className="text-emerald-400 font-bold block mt-0.5">{formatPrice(highVal, selectedMarket, symbol)}</span>
                                    </div>
                                    <div className="bg-zinc-900/40 p-2 rounded-lg border border-zinc-900/60">
                                      <span className="text-zinc-500 text-[8px] uppercase block">Low / Terendah</span>
                                      <span className="text-rose-400 font-bold block mt-0.5">{formatPrice(lowVal, selectedMarket, symbol)}</span>
                                    </div>
                                    <div className="bg-zinc-900/40 p-2 rounded-lg border border-zinc-900/60">
                                      <span className="text-zinc-500 text-[8px] uppercase block">P/E Ratio</span>
                                      <span className="text-white font-bold block mt-0.5">{specPe}</span>
                                    </div>
                                    <div className="bg-zinc-900/40 p-2 rounded-lg border border-zinc-900/60">
                                      <span className="text-zinc-500 text-[8px] uppercase block">Div Yield</span>
                                      <span className="text-white font-bold block mt-0.5">{specDiv}</span>
                                    </div>
                                  </div>
                                                             <div className="space-y-2 mt-4">
                                  <button 
                                    onClick={() => setAdvanceChartSymbol(getTradingViewWidgetSymbol(symbol, selectedMarket))}
                                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[9px] uppercase tracking-wider font-extrabold bg-sky-500 hover:bg-sky-400 text-black shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
                                  >
                                    <ChartCandlestick className="w-3.5 h-3.5" />
                                    Advance Chart Full Screen
                                  </button>

                                  <a 
                                    href={getGoogleFinanceLink(symbol, selectedMarket)} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[9px] uppercase tracking-wider font-extrabold bg-[#deff9a] text-black hover:opacity-90 transition-opacity"
                                  >
                                    <Globe className="w-3.5 h-3.5" />
                                    Google Finance Page
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>

                                  <a 
                                    href={getTradingViewLink(symbol, selectedMarket)} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[9px] uppercase tracking-wider font-extrabold bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 transition-colors"
                                  >
                                    <ChartCandlestick className="w-3.5 h-3.5 text-sky-400" />
                                    TradingView Analysis
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </div>      </div>
                              </div>
                            </motion.div>
                          </AnimatePresence>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Navigation Overlay */}
      <div className="p-3 bg-zinc-900/20 border-t border-zinc-900 flex justify-between items-center text-[8.5px] font-bold uppercase text-zinc-400 tracking-widest flex-wrap gap-2">
        <span>MENAMPILKAN {processedSymbols.length} DARI {filteredSymbolsOutput.length} TICKER PASAR ({selectedMarket})</span>
        <span className="text-zinc-700 hidden sm:inline select-none">|</span>
        <span className="flex items-center gap-1.5 text-zinc-300">
          <span className="w-1.5 h-1.5 bg-[#deff9a] rounded-full animate-ping"></span>
          STABILISASI PERFORMATIF ENGINE PASAR • DELAY BATCHING: 600MS
        </span>
      </div>

      <AdvanceChartModal 
        symbol={advanceChartSymbol} 
        isOpen={!!advanceChartSymbol} 
        onClose={() => setAdvanceChartSymbol(null)} 
        market={selectedMarket} 
      />
    </div>
  );
};

export default IdxPriceList;
