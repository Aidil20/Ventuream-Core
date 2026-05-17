/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { 
  Home, 
  PieChart, 
  ShieldCheck, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  Bell,
  Menu,
  ChevronRight,
  RefreshCw,
  Activity,
  Zap,
  Cloud,
  FileUp,
  Database,
  ExternalLink,
  Plus,
  BarChart3,
  Globe,
  Gavel,
  Droplets,
  FileText,
  Radar,
  X,
  Scale,
  PenTool,
  Calculator,
  ListTodo,
  AlertTriangle,
  Info,
  CheckCircle2,
  BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Decimal } from 'decimal.js';
import { 
  fetchLatestInsights, 
  MarketInsight, 
  fetchStockRecommendations, 
  StockRecommendation, 
  ScanOptions, 
  fetchLivePrices 
} from './services/marketService';
import { fetchMarketNewsSummary, MarketNewsItem } from './services/geminiService';
import { SpeedInsights } from "@vercel/speed-insights/react";
import TradingViewWidget from './components/TradingViewWidget';
import PortfolioChart from './components/PortfolioChart';
import { useTransactionManager } from './hooks/useTransactionManager';
import { TransactionTable } from './components/TransactionTable';
import { Settings2, Filter, Target, ArrowLeft } from 'lucide-react';
import { Sparkline } from './components/Sparkline';
import { AssetDetail } from './components/AssetDetail';
import VamSmartScanner from './components/VamSmartScanner';
import IntradayScanner from './components/IntradayScanner';
import GlobalIndicesFeed from './components/GlobalIndicesFeed';
import MarketOverviewWidget from './components/MarketOverviewWidget';
import LegalDocumentCenter from './components/LegalDocumentCenter';
import FinancialReportingCenter from './components/FinancialReportingCenter';
import RegulatoryArchive from './components/RegulatoryArchive';
import TaskCenter from './components/TaskCenter';
import TradingViewMarketWidget from './components/TradingViewMarketWidget';
import TradingViewScreenerWidget from './components/TradingViewScreenerWidget';
import { MarketMetricCard } from './components/MarketMetricCard';
import { ExternalGateways } from './components/ExternalGateways';
import { InternationalGatewayDashboard } from './components/InternationalGatewayDashboard';
import { NewsFeed } from './components/NewsFeed';
import { fetchMarketNews } from './services/marketService';
import { StockExplorer } from './components/StockExplorer';
import { FundamentalAnalyst } from './components/FundamentalAnalyst';

const ASSETS = [
  {
    id: '1',
    name: 'Black Diamond Resources',
    symbol: 'COAL',
    category: 'Energy - Coal',
    value: 'Rp 451.1k',
    status: 'Bearish',
    type: 'Equities',
    percentage: '4.8%',
    liquidity: 'High',
    performance: [65, 59, 80, 81, 56, 55, 40]
  },
  {
    id: '2',
    name: 'Danasupra Erapacific',
    symbol: 'DEFI',
    category: 'Financial Services',
    value: 'Rp 224.0k',
    status: 'Neutral',
    type: 'Equities',
    percentage: '2.4%',
    liquidity: 'Medium',
    performance: [40, 45, 42, 48, 50, 48, 52]
  },
  {
    id: '3',
    name: 'Lippo Karawaci',
    symbol: 'LPKR',
    category: 'Property & Real Estate',
    value: 'Rp 168.0k',
    status: 'Stable',
    type: 'Equities',
    percentage: '1.8%',
    liquidity: 'Low',
    performance: [30, 32, 28, 30, 29, 31, 30]
  },
  {
    id: '4',
    name: 'DMS Propertindo',
    symbol: 'OTAS',
    category: 'Real Estate',
    value: 'Rp 244.5k',
    status: 'Performing',
    type: 'Equities',
    percentage: '3.1%',
    liquidity: 'Medium',
    performance: [20, 25, 30, 35, 40, 45, 50]
  },
  {
    id: '5',
    name: 'Trimitra Propertindo',
    symbol: 'ANDI',
    category: 'Property',
    value: 'Rp 306.9k',
    status: 'Bearish',
    type: 'Equities',
    percentage: '-4.2%',
    liquidity: 'Low',
    performance: [55, 50, 48, 45, 42, 40, 38]
  },
  {
    id: '6',
    name: 'Multi Makmur Lemindo',
    symbol: 'IPAC',
    category: 'Real Estate',
    value: 'Rp 213.0k',
    status: 'Stable',
    type: 'Equities',
    percentage: '-5.9%',
    liquidity: 'Low',
    performance: [40, 38, 35, 32, 30, 28, 25]
  }
];

const HOLDINGS = [
  { symbol: 'COAL', name: 'Black Diamond Resources', qty: '6,200', value: '365,800', change: '-18.9%', type: 'Energy', performance: [65, 59, 80, 81, 56, 55, 40] },
  { symbol: 'DEFI', name: 'Danasupra Erapacific', qty: '1,000', value: '212,000', change: '-5.3%', type: 'Financial', performance: [40, 45, 42, 48, 50, 48, 52] },
  { symbol: 'OTAS', name: 'DMS Propertindo', qty: '1,500', value: '244,500', change: '+7.9%', type: 'Property', performance: [20, 25, 30, 35, 40, 45, 50] },
  { symbol: 'ANDI', name: 'Trimitra Propertindo', qty: '3,100', value: '306,900', change: '-4.2%', type: 'Property', performance: [55, 50, 48, 45, 42, 40, 38] },
  { symbol: 'LPKR', name: 'Lippo Karawaci', qty: '2,000', value: '168,000', change: '0.0%', type: 'Property', performance: [30, 32, 28, 30, 29, 31, 30] },
  { symbol: 'IPAC', name: 'Multi Makmur Lemindo', qty: '1,500', value: '213,000', change: '-5.9%', type: 'Real Estate', performance: [40, 38, 35, 32, 30, 28, 25] },
];

const SIDEBAR_MENU = [
  { id: 0, label: "Dashboard Utama", icon: Home, path: "home", color: "#deff9a" },
  { id: 13, label: "Fundamental Analyst", icon: BrainCircuit, path: "fundamental", color: "#DFFF00" },
  { id: 8, label: "Monitor Pasar", icon: Search, path: "market", color: "#deff9a" },
  { id: 1, label: "Analisis Portofolio", icon: BarChart3, path: "portfolio", color: "#deff9a" },
  { id: 10, label: "Permintaan Dokumen", icon: PenTool, path: "legal", color: "#deff9a" },
  { id: 5, label: "Laporan Keuangan", icon: Calculator, path: "financial", color: "orange-400" },
  { id: 11, label: "Arsip & Audit Trail", icon: Database, path: "archive", color: "blue-400" },
  { id: 12, label: "Manajemen Tugas", icon: ListTodo, path: "tasks", color: "#deff9a" },
  { id: 9, label: "Sistem Keamanan", icon: ShieldCheck, path: "security", color: "#deff9a" },
  { id: 7, label: "Rebalancing Asset", icon: Scale, path: "rebalancer", color: "#deff9a" },
  { id: 2, label: "Gateway Internasional", icon: Globe, path: "gateway", color: "#deff9a" },
  { id: 3, label: "Laporan Regulasi", icon: Gavel, path: "compliance", color: "#94a3b8" },
  { id: 4, label: "Pengaturan Likuiditas", icon: Droplets, path: "liquidity", color: "#94a3b8" },
  { 
    id: 6, 
    label: "Smart Scanner IDX", 
    provider: "By Ventuream AM", 
    icon: Radar, 
    path: "scanner",
    color: "#FFD700",
    markets: [
      {
        id: 'idx',
        label: 'IDX Market',
        modules: [
          'High Volume Breakout',
          'Price Breakout Volume MA10 Today',
          'Big Accumulation'
        ]
      },
      {
        id: 'global',
        label: 'Market International',
        modules: [
          'Volatility Scanner',
          'FX Momentum Feed',
          'Yield Arbitrage'
        ]
      }
    ]
  },
];

import BloombergTable from './components/BloombergTable';
import VAMTerminalScanner from './components/VAMTerminalScanner';
import RebalanceTool from './components/RebalanceTool';

const myCGSPortfolio = {
  accountID: "YU001HC5400154",
  owner: "PT Venture Asset Management",
  cashBalance: 308000,
  assets: [
    { ticker: "COAL.JK", lots: 62, averagePrice: 72.7581, marketPrice: 57 },
    { ticker: "DEFI.JK", lots: 10, averagePrice: 224, marketPrice: 177 },
    { ticker: "KOTA.JK", lots: 15, averagePrice: 151, marketPrice: 134 },
    { ticker: "LAND.JK", lots: 31, averagePrice: 103.3548, marketPrice: 89 },
    { ticker: "LPKR.JK", lots: 20, averagePrice: 84, marketPrice: 81 },
    { ticker: "PIPA.JK", lots: 15, averagePrice: 151, marketPrice: 134 },
    { ticker: "WMUU.JK", lots: 20, averagePrice: 96, marketPrice: 68 }
  ]
};

const generateSimulatedPerformance = () => Array.from({ length: 12 }, () => Math.floor(Math.random() * 60) + 40);

const MarketFeedLog = ({ stockData }: { stockData: StockRecommendation }) => {
  const [currentPrice, setCurrentPrice] = useState(stockData.price);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handleMarketUpdate = (e: any) => {
      const data = e.detail;
      if (data && data.symbol === stockData.symbol && data.price) {
        setCurrentPrice(data.price);
        setIsUpdating(true);
        setTimeout(() => setIsUpdating(false), 1500);
      }
    };

    window.addEventListener('vam-market-update', handleMarketUpdate);
    return () => window.removeEventListener('vam-market-update', handleMarketUpdate);
  }, [stockData.symbol]);

  const timeString = stockData.detectedAt 
    ? new Date(stockData.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
  const performanceData = stockData.performance || [50, 52, 48, 55, 60, 58, 62, 65, 63, 68, 70, 72];
  const isUp = performanceData[performanceData.length - 1] >= performanceData[0];

  return (
    <div className="flex items-start gap-4 p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group">
      <div className="flex flex-col items-center gap-1 min-w-[50px]">
        <span className="text-[9px] font-mono text-zinc-500">{timeString}</span>
        <div className="w-px h-full bg-zinc-800 group-last:hidden" />
      </div>
      <div className="flex-1 flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-[11px] leading-relaxed text-zinc-300">
            <span className="font-black text-white">{stockData.symbol}</span> detected: 
            Price (<span className={`transition-colors duration-300 ${isUpdating ? 'text-[#deff9a]' : 'text-blue-400'}`}>Rp {currentPrice}</span> <span className={`text-[8px] font-black uppercase transition-all ${isUpdating ? 'text-[#deff9a] scale-110' : 'text-blue-500/80 animate-pulse'}`}>LIVE</span>) &gt; EMA20 (<span className="text-orange-400">Rp {stockData.ema20}</span>). 
            <span className="ml-2 inline-flex items-center gap-1.5 font-bold uppercase tracking-widest text-[9px]">
              Strength: <span className="text-[#00ff00] bg-[#00ff00]/10 px-1.5 py-0.5 rounded border border-[#00ff00]/20">QUALIFIED</span>
            </span>
          </p>
        </div>
        <div className="flex-shrink-0 w-16 opacity-50 group-hover:opacity-100 transition-opacity">
          <Sparkline 
            data={performanceData} 
            color={isUp ? '#deff9a' : '#ef4444'} 
            height={16} 
          />
        </div>
      </div>
    </div>
  );
};

const TV_STUDIES = [
  { id: 'MASimple@tv-basicstudies', name: 'SMA' },
  { id: 'MAExp@tv-basicstudies', name: 'EMA' },
  { id: 'RSI@tv-basicstudies', name: 'RSI' },
  { id: 'MACD@tv-basicstudies', name: 'MACD' },
  { id: 'BB@tv-basicstudies', name: 'Bollinger' },
  { id: 'Stochastic@tv-basicstudies', name: 'Stochastic' },
];

interface PortfolioAsset {
  ticker: string;
  lots: number;
  averagePrice: number;
  marketPrice: number;
  currentPrice: number;
  change: number;
  marketValue: number;
  unrealized: number;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'gt' | 'lt';
  active: boolean;
  createdAt: number;
}

export interface AlertNotification {
  id: string;
  symbol: string;
  price: number;
  targetPrice: number;
  condition: 'gt' | 'lt';
  timestamp: number;
}

export default function App() {
  const [selectedSymbol, setSelectedSymbol] = useState('IDX:COMPOSITE');
  const [assetsData, setAssetsData] = useState(ASSETS);
  const [activeTab, setActiveTab] = useState('home');
  const [activeScannerMarket, setActiveScannerMarket] = useState<'IDX' | 'GLOBAL' | null>(null);
  const [activeScannerModule, setActiveScannerModule] = useState<string | null>(null);
  const [expandedMarket, setExpandedMarket] = useState<string | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioAsset[]>([]);
  const [selectedStudies, setSelectedStudies] = useState<string[]>(["MASimple@tv-basicstudies", "MAExp@tv-basicstudies"]);
  
  const totalPortfolioValue = useMemo(() => {
    return portfolioData.reduce((acc, curr) => new Decimal(acc).plus(curr.marketValue || 0).toNumber(), 0);
  }, [portfolioData]);

  const [securityView, setSecurityView] = useState<'main' | 'history' | 'devices'>('main');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showVamScanner, setShowVamScanner] = useState(false);
  const [showIntradayScanner, setShowIntradayScanner] = useState(false);
  const [userRole, setUserRole] = useState('President_Director'); // Added role state
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [marketSubTab, setMarketSubTab] = useState<'overview' | 'explorer' | 'fundamental'>('overview');
  const [fundamentalSymbol, setFundamentalSymbol] = useState<string | undefined>(undefined);
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [stocks, setStocks] = useState<StockRecommendation[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isMarketSyncing, setIsMarketSyncing] = useState(false);
  const [marketNews, setMarketNews] = useState<MarketNewsItem[]>([]);
  const [isFetchingNews, setIsFetchingNews] = useState(false);
  const [technicalLogs, setTechnicalLogs] = useState<StockRecommendation[]>([]);
  const [networkStats, setNetworkStats] = useState({
    ping: 24,
    status: "EXCELLENT",
    signalStrength: 100,
    operational: true
  });
  const [logSortBy, setLogSortBy] = useState<'timestamp' | 'symbol'>('timestamp');
  const [logSortOrder, setLogSortOrder] = useState<'asc' | 'desc'>('desc');

  // Price Alerts State
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);

  // Alert Actions
  const addAlert = useCallback((alert: Omit<PriceAlert, 'id' | 'createdAt' | 'active'>) => {
    const newAlert: PriceAlert = {
      ...alert,
      id: Math.random().toString(36).substring(7),
      createdAt: Date.now(),
      active: true
    };
    setAlerts(prev => [newAlert, ...prev]);
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Aggregated loading state for global indicator
  const isAnySyncing = useMemo(() => 
    isFetching || isScanning || isFetchingNews || isMarketSyncing,
    [isFetching, isScanning, isFetchingNews, isMarketSyncing]
  );

  const livePricesMap = useMemo(() => {
    const map: Record<string, number> = {};
    stocks.forEach(s => {
      if (s.currentPrice) map[s.symbol] = s.currentPrice;
    });
    return map;
  }, [stocks]);

  const sortedLogs = useMemo(() => {
    return [...technicalLogs].sort((a, b) => {
      let comparison = 0;
      if (logSortBy === 'timestamp') {
        comparison = (a.detectedAt || 0) - (b.detectedAt || 0);
      } else if (logSortBy === 'symbol') {
        comparison = a.symbol.localeCompare(b.symbol);
      }
      return logSortOrder === 'asc' ? comparison : -comparison;
    });
  }, [technicalLogs, logSortBy, logSortOrder]);

  // Guard refs for stable callbacks
  const isFetchingRef = React.useRef(false);
  const isScanningRef = React.useRef(false);
  const isFetchingNewsRef = React.useRef(false);
  const isMarketSyncingRef = React.useRef(false);
  const stocksRef = React.useRef<StockRecommendation[]>([]);
  const portfolioDataRef = React.useRef<PortfolioAsset[]>([]);

  // Keep refs in sync for background functions
  React.useEffect(() => {
    stocksRef.current = stocks;
  }, [stocks]);

  React.useEffect(() => {
    portfolioDataRef.current = portfolioData;
  }, [portfolioData]);

  const [lastMarketSync, setLastMarketSync] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [liquidityValue, setLiquidityValue] = useState(12.4); // Simulated low liquidity for alert demo
  const [showScanParams, setShowScanParams] = useState(false);
  const [scanOptions, setScanOptions] = useState<ScanOptions>({
    sector: '',
    riskProfile: 'moderate',
    signalFilter: 'ALL',
    assetType: 'Equities',
    sortBy: 'signal',
    timeframe: '1D'
  });

  const { history, recordTransaction } = useTransactionManager();

  const updateCGSPrices = useCallback(async () => {
    // Simulate fetching live data based on CGS iTrade images with minimal jitter
    setPortfolioData(prevPortfolio => {
      return myCGSPortfolio.assets.map(asset => {
        // Use existing currentPrice if available for continuity
        const existing = prevPortfolio.find(p => p.ticker === asset.ticker);
        const basePrice = existing ? existing.currentPrice : asset.marketPrice;
        
        const voltMult = isMarketSyncingRef.current ? 0.005 : 0.002;
        const jitter = (Math.random() - 0.5) * (basePrice * voltMult);
        const currentPrice = new Decimal(basePrice).plus(jitter);
        
        const lots = new Decimal(asset.lots);
        const avgPrice = new Decimal(asset.averagePrice);
        const multiplier = new Decimal(100);

        const totalCost = avgPrice.times(lots).times(multiplier);
        const marketValue = currentPrice.times(lots).times(multiplier);
        const unrealized = marketValue.minus(totalCost);
        const change = currentPrice.minus(avgPrice).div(avgPrice).times(multiplier);

        return {
          ...asset,
          currentPrice: currentPrice.toNumber(),
          change: change.toNumber(),
          marketValue: marketValue.toNumber(),
          unrealized: unrealized.toNumber()
        };
      });
    });
  }, []);

  useEffect(() => {
    updateCGSPrices();
    const portfolioInterval = setInterval(updateCGSPrices, 30000); // Background sync fallback
    return () => clearInterval(portfolioInterval);
  }, [updateCGSPrices]);

  const updateInsights = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsFetching(true);
    try {
      const data = await fetchLatestInsights();
      setInsights(data);
    } finally {
      isFetchingRef.current = false;
      setIsFetching(false);
    }
  }, []);

  const updateMarketNews = useCallback(async (force = false) => {
    if (isFetchingNewsRef.current) return;
    isFetchingNewsRef.current = true;
    setIsFetchingNews(true);
    try {
      const news = await fetchMarketNewsSummary(force);
      setMarketNews(news);
    } finally {
      isFetchingNewsRef.current = false;
      setIsFetchingNews(false);
    }
  }, []);

  const updateStocks = useCallback(async () => {
    if (isScanningRef.current) return;
    isScanningRef.current = true;
    setIsScanning(true);
    try {
      const newStocks = await fetchStockRecommendations(scanOptions);
      setStocks(newStocks);
      
      // Update technical logs if new qualifying stocks found
      if (newStocks && newStocks.length > 0) {
        setTechnicalLogs(prev => {
          const now = Date.now();
          const newEntries = newStocks
            .filter(stock => !prev.some(p => p.symbol === stock.symbol && p.price === stock.price))
            .map(stock => ({ 
              ...stock, 
              detectedAt: now,
              performance: stock.performance || generateSimulatedPerformance()
            }));
          return [...newEntries, ...prev].slice(0, 50);
        });
      }
    } finally {
      isScanningRef.current = false;
      setIsScanning(false);
    }
  }, [scanOptions]);

  const syncMarketConnectivity = useCallback(async () => {
    if (isMarketSyncingRef.current) return;
    isMarketSyncingRef.current = true;
    setIsMarketSyncing(true);
    
    try {
      // 1. Standard institutional sync cycle
      await new Promise(resolve => setTimeout(resolve, 800));
      await updateInsights();
      await new Promise(resolve => setTimeout(resolve, 800));
      await updateMarketNews(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      await updateStocks();

      // 2. Real-time Price Sync (Yahoo Finance / TradingView Simulation via AI)
      const portfolioTickers = portfolioDataRef.current.map(a => a.ticker.replace('.JK', ''));
      const stockTickers = stocksRef.current.map(s => s.symbol);
      const assetTickers = ASSETS.map(a => a.symbol);
      const holdingTickers = HOLDINGS.map(h => h.symbol);
      const tickersToFetch = [...new Set([
        ...portfolioTickers, 
        ...stockTickers, 
        ...assetTickers, 
        ...holdingTickers,
        'BBCA', 'BBRI', 'TLKM', 'ADRO', 'COMPOSITE', 'USDIDR', 'STI'
      ])];
      
      const livePrices = await fetchLivePrices(tickersToFetch);

      if (livePrices && livePrices.length > 0) {
        // Update Assets List
        setAssetsData(prev => prev.map(asset => {
          const live = livePrices.find(l => l.symbol === asset.symbol);
          if (live) {
            return {
              ...asset,
              value: `Rp ${(live.price / 1000).toFixed(1)}k`,
              percentage: (live.changePercent >= 0 ? '+' : '') + live.changePercent.toFixed(1) + '%',
              status: live.changePercent > 0.5 ? 'Bullish' : live.changePercent < -0.5 ? 'Bearish' : 'Stable'
            };
          }
          return asset;
        }));

        // Update Portfolio Data
        setPortfolioData(prev => prev.map(asset => {
          const ticker = asset.ticker.replace('.JK', '');
          const live = livePrices.find(l => l.symbol === ticker || l.symbol === asset.ticker);
          if (live) {
            return { ...asset, marketPrice: live.price };
          }
          return asset;
        }));

        // Update Scan/Stock List Data
        setStocks(prev => prev.map(stock => {
          const live = livePrices.find(l => l.symbol === stock.symbol);
          if (live) {
            return {
              ...stock,
              price: typeof live.price === 'number' ? live.price.toLocaleString('id-ID') : (live.price || 'N/A'),
              change: (live.changePercent >= 0 ? '+' : '') + live.changePercent.toFixed(2) + '%'
            };
          }
          return stock;
        }));

        // Update Technical Logs
        setTechnicalLogs(prev => prev.map(log => {
          const live = livePrices.find(l => l.symbol === log.symbol);
          if (live) {
            return {
              ...log,
              price: typeof live.price === 'number' ? live.price.toLocaleString('id-ID') : (live.price || 'N/A'),
              change: (live.changePercent >= 0 ? '+' : '') + live.changePercent.toFixed(2) + '%'
            };
          }
          return log;
        }));

      }
      setLastMarketSync(new Date().toLocaleTimeString());
      console.log(`[Ventuream Gateway] Real-time Institutional Sync Complete`);
    } catch (error) {
      console.error("[Ventuream Gateway] Sync error:", error);
    } finally {
      isMarketSyncingRef.current = false;
      setIsMarketSyncing(false);
    }
  }, [updateInsights, updateMarketNews, updateStocks]);

  // Network Status Monitor Logic
  const checkNetworkStats = useCallback(async () => {
    const vamScriptId = import.meta.env.VITE_VAM_GATEWAY_SCRIPT_ID;
    
    // If no real Script ID, we simulate an active institutional connection for the terminal experience
    if (!vamScriptId || vamScriptId === 'ID_SCRIPT_ANDA' || vamScriptId === 'DEFAULT_INSTITUTIONAL_GATEWAY') {
      setTimeout(() => {
        setNetworkStats({
          ping: 18 + Math.floor(Math.random() * 12),
          status: "EXCELLENT",
          signalStrength: 100,
          operational: true
        });
      }, 1000);
      return;
    }

    const start = Date.now();
    try {
      const response = await fetch(`/api/gateway/check?scriptId=${vamScriptId}`);
      const end = Date.now();
      const ping = end - start;

      setNetworkStats({
        ping: ping,
        status: ping < 500 ? "EXCELLENT" : "STABLE",
        signalStrength: ping < 300 ? 100 : 85,
        operational: response.ok
      });
    } catch (e) {
      // Fallback to simulated connection if network error during demo
      setNetworkStats({ ping: 42, status: "STABLE", signalStrength: 80, operational: true });
    }
  }, []);

  // Effects
  useEffect(() => {
    // VAM Gateway Core: Real-time WebSocket Protocol
    const socket = io();

    socket.on('connect', () => {
      console.log('[VAM PROTOCOL] Real-time Gateway Tunnel Established');
    });

    socket.on('market-init', (data: Record<string, any>) => {
      console.log('[VAM PROTOCOL] Received Initial Market State');
      
      // Update Portfolio Data with initial state
      setPortfolioData(prev => prev.map(asset => {
        const cleanTicker = asset.ticker.replace('.JK', '');
        const match = data[cleanTicker] || data[asset.ticker];
        if (match) {
          const currentPrice = match.price;
          const lots = asset.lots;
          const avgPrice = asset.averagePrice;
          const multiplier = 100;

          const marketValue = currentPrice * lots * multiplier;
          const unrealized = marketValue - (avgPrice * lots * multiplier);
          const change = ((currentPrice - avgPrice) / avgPrice) * 100;

          return { 
            ...asset, 
            marketPrice: currentPrice,
            currentPrice: currentPrice,
            change: change,
            marketValue: marketValue,
            unrealized: unrealized
          };
        }
        return asset;
      }));

      // Update Assets Data with initial state
      setAssetsData(prev => prev.map(asset => {
        const match = data[asset.symbol];
        if (match) {
          return {
            ...asset,
            value: `Rp ${(match.price / 1000).toFixed(1)}k`,
            percentage: (match.changePercent >= 0 ? '+' : '') + match.changePercent.toFixed(1) + '%',
            status: match.changePercent > 0.5 ? 'Bullish' : match.changePercent < -0.5 ? 'Bearish' : 'Stable'
          };
        }
        return asset;
      }));

      // Update Stocks Data with initial state
      setStocks(prev => prev.map(stock => {
        const match = data[stock.symbol];
        if (match) {
          return {
            ...stock,
            price: match.price.toLocaleString('id-ID'),
            currentPrice: match.price,
            change: (match.changePercent >= 0 ? '+' : '') + match.changePercent.toFixed(2) + '%'
          };
        }
        return stock;
      }));
    });

    socket.on('market-update', (data: { 
      symbol: string; 
      price: number; 
      changePercent: number; 
      vwap?: number;
      ema20?: number;
      ema50?: number;
      rsi?: number;
      macdHist?: number;
      timestamp: number 
    }) => {
      const { symbol, price, changePercent } = data;

      // Update Assets Data (State)
      setAssetsData(prev => prev.map(asset => {
        if (asset.symbol === symbol) {
          return {
            ...asset,
            value: `Rp ${(price / 1000).toFixed(1)}k`,
            percentage: (changePercent >= 0 ? '+' : '') + changePercent.toFixed(1) + '%',
            status: changePercent > 0.5 ? 'Bullish' : changePercent < -0.5 ? 'Bearish' : 'Stable'
          };
        }
        return asset;
      }));

      // Update Stocks List (State)
      setStocks(prev => prev.map(stock => {
        if (stock.symbol === symbol) {
          return {
            ...stock,
            price: typeof price === 'number' ? price.toLocaleString('id-ID') : (price || 'N/A'),
            currentPrice: price,
            change: (changePercent >= 0 ? '+' : '') + changePercent.toFixed(2) + '%'
          };
        }
        return stock;
      }));

      // Update Portfolio (State)
      setPortfolioData(prev => prev.map(asset => {
        const cleanTicker = asset.ticker.replace('.JK', '');
        if (cleanTicker === symbol || asset.ticker === symbol) {
          const currentPrice = price;
          const lots = asset.lots;
          const avgPrice = asset.averagePrice;
          const multiplier = 100; // IDX standard 1 lot = 100 shares

          const marketValue = currentPrice * lots * multiplier;
          const unrealized = marketValue - (avgPrice * lots * multiplier);
          const change = ((currentPrice - avgPrice) / avgPrice) * 100;

          return { 
            ...asset, 
            marketPrice: currentPrice,
            currentPrice: currentPrice,
            change: change,
            marketValue: marketValue,
            unrealized: unrealized
          };
        }
        return asset;
      }));

      // Dispatch custom event for child components like IntradayScanner
      window.dispatchEvent(new CustomEvent('vam-market-update', { detail: data }));

      // Update Technical Logs (State)
      setTechnicalLogs(prev => prev.map(log => {
        if (log.symbol === symbol) {
          const currentPerf = log.performance || generateSimulatedPerformance();
          const lastVal = currentPerf[currentPerf.length - 1];
          // Determine trend based on current signal
          const bias = log.signal === 'BUY' ? 0.3 : log.signal === 'SELL' ? -0.3 : 0;
          const newVal = lastVal + (Math.random() - 0.5 + bias) * 2;
          return { 
            ...log, 
            price: typeof price === 'number' ? price.toLocaleString('id-ID') : (price || 'N/A'),
            performance: [...currentPerf.slice(1), newVal]
          };
        }
        return log;
      }));

      // Check Alerts Logic
      setAlerts(currentAlerts => {
        const triggeredAlerts = currentAlerts.filter(alert => {
          if (!alert.active || alert.symbol !== symbol) return false;
          
          if (alert.condition === 'gt' && price >= alert.targetPrice) return true;
          if (alert.condition === 'lt' && price <= alert.targetPrice) return true;
          return false;
        });

        if (triggeredAlerts.length > 0) {
          setNotifications(prev => [
            ...triggeredAlerts.map(a => ({
              id: Math.random().toString(36).substring(7),
              symbol: a.symbol,
              price: price,
              targetPrice: a.targetPrice,
              condition: a.condition,
              timestamp: Date.now()
            })),
            ...prev
          ].slice(0, 5)); // Keep last 5 notifications

          // Deactivate triggered alerts
          return currentAlerts.map(a => {
            const isTriggered = triggeredAlerts.some(ta => ta.id === a.id);
            return isTriggered ? { ...a, active: false } : a;
          });
        }
        return currentAlerts;
      });

      // Direct DOM Update (Fast Path) for sub-second visual feedback
      const tickerElements = document.querySelectorAll(`[id^="price-${symbol}"]`);
      tickerElements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.innerText = `Rp ${new Intl.NumberFormat('id-ID').format(price)}`;
          el.classList.add('text-[#deff9a]', 'animate-pulse');
          setTimeout(() => el.classList.remove('animate-pulse'), 400);
        }
      });
    });

    socket.on('disconnect', () => {
      console.log('[VAM PROTOCOL] Gateway Tunnel Interrupted');
    });

    // Start network monitoring
    checkNetworkStats();
    const networkInterval = setInterval(checkNetworkStats, 30000); // Check every 30s

    return () => {
      socket.disconnect();
      clearInterval(networkInterval);
    };
  }, [checkNetworkStats]);

  useEffect(() => {
    updateInsights();
    updateMarketNews();
    updateStocks();
  }, [updateInsights, updateMarketNews, updateStocks]);

  useEffect(() => {
    updateCGSPrices();
    // Only low-frequency sync for non-streamed items (e.g. portfolio data not on standard exchange)
    const portfolioInterval = setInterval(updateCGSPrices, 30000); 
    return () => clearInterval(portfolioInterval);
  }, [updateCGSPrices]);

  useEffect(() => {
    // The high-freq tick and sync logic is now handled by the WebSocket stream in the previous useEffect.
    // We only keep a very occasional background sync for general metadata.
    const backgroundSyncInterval = setInterval(() => {
      if (!isMarketSyncingRef.current) {
        updateStocks();
        updateMarketNews();
        syncMarketConnectivity();
      }
    }, 120000); // 2 minutes
    
    return () => clearInterval(backgroundSyncInterval);
  }, [updateStocks, updateMarketNews]);

  // Security Strategy: Context Menu Protection
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  const renderContent = () => {
    if (activeTab === 'asset-detail' && selectedAssetId) {
      const selectedAsset = assetsData.find(a => a.id === selectedAssetId);
      if (selectedAsset) {
        return (
          <AssetDetail 
            asset={selectedAsset} 
            onBack={() => setActiveTab('home')} 
          />
        );
      }
    }

    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            {/* PERFORMANCE HISTORY CHART */}
            <PortfolioChart />

            {/* 2. METRIK TOTAL ASSET & INCOME (Di Bawah Chart) */}
            <section className="grid grid-cols-2 gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="group relative overflow-hidden bg-slate-900/60 p-5 rounded-[2.5rem] border border-slate-800/80 backdrop-blur-xl shadow-2xl hover:border-[#deff9a]/30 transition-all duration-500"
              >
                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-blue-500/5 blur-3xl rounded-full group-hover:bg-blue-500/10 transition-colors" />
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 group-hover:scale-110 transition-transform">
                    <PieChart className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-black">Total Assets</p>
                    <p className="text-[7px] text-slate-600 font-bold uppercase tracking-tighter">YTD PERFORMANCE</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-slate-400">Rp</span>
                  <p className="text-2xl font-black font-mono tracking-tight text-white">9.38M</p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800/50 flex items-center justify-between">
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Audit Status</span>
                  <span className="text-[8px] text-blue-400 font-black uppercase">IFRS COMPLIANT</span>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="group relative overflow-hidden bg-slate-900/60 p-5 rounded-[2.5rem] border border-slate-800/80 backdrop-blur-xl shadow-2xl hover:border-red-500/30 transition-all duration-500"
              >
                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-red-500/5 blur-3xl rounded-full group-hover:bg-red-500/10 transition-colors" />
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-black">Net Income</p>
                    <p className="text-[7px] text-slate-600 font-bold uppercase tracking-tighter">OPERATING LOSS</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-slate-400">Rp</span>
                  <p className="text-2xl font-black font-mono tracking-tight text-red-400 opacity-90">(368K)</p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800/50 flex items-center justify-between">
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Efficiency</span>
                  <span className="text-[8px] text-red-500 font-black uppercase tracking-tighter">CAPEX DRIVEN</span>
                </div>
              </motion.div>
            </section>

            {/* Priority Assets */}
            <section className="mt-8">
              <div className="flex justify-between items-end mb-6 px-2">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Priority Portfolio</h3>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter mt-1">REAL-TIME SELECTION</p>
                </div>
                <button className="text-[9px] bg-slate-900/50 hover:bg-slate-800 text-[#deff9a] font-black flex items-center uppercase tracking-widest px-3 py-1.5 rounded-xl border border-slate-800 transition-colors">
                  View Full <ChevronRight className="w-3 h-3 ml-1" />
                </button>
              </div>
              
              <div className="space-y-4">
                {assetsData.map((asset, index) => (
                  <motion.div 
                    key={asset.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * (index + 3) }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedAssetId(asset.id);
                      setActiveTab('asset-detail');
                    }}
                    className="bg-slate-900/40 p-4 rounded-[2rem] flex justify-between items-center border border-slate-800/80 hover:bg-slate-800/50 hover:border-[#deff9a]/20 transition-all cursor-pointer group shadow-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-1 h-10 rounded-full ${index % 2 === 0 ? 'bg-[#deff9a]' : 'bg-blue-400'} shadow-[0_0_10px_rgba(222,255,154,0.2)]`} />
                      <div>
                        <p className="font-black text-sm text-slate-100 group-hover:text-white transition-colors uppercase tracking-tight">{asset.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{asset.category}</p>
                          <span className="text-[7px] px-1.5 py-0.5 rounded-lg bg-slate-950 text-slate-500 font-black border border-slate-800 uppercase tracking-widest">
                            LIQ: {asset.liquidity}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="hidden sm:block opacity-60 group-hover:opacity-100 transition-opacity">
                        <Sparkline 
                          data={asset.performance} 
                          color={asset.status === 'Bullish' || index % 2 === 0 ? '#deff9a' : '#60a5fa'} 
                          height={20} 
                        />
                      </div>
                      <div className="text-right">
                        <p className={`font-black font-mono text-base ${index % 2 === 0 ? 'text-[#deff9a]' : 'text-white'}`}>{asset.value}</p>
                        <div className="flex justify-end mt-1">
                          <span className={`text-[8px] px-2 py-0.5 rounded-lg font-black uppercase tracking-[0.1em]
                            ${asset.status === 'Performing' ? 'bg-green-950/40 text-green-400 border border-green-500/20' : 
                              asset.status === 'Bullish' ? 'bg-blue-950/40 text-blue-400 border border-blue-500/20' : 
                              'bg-red-950/40 text-red-400 border border-red-800/20'}`}
                          >
                            {asset.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Market Insights */}
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6"
            >
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-5 rounded-3xl border border-slate-800 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 bg-[#deff9a]/5 blur-3xl rounded-full -mr-4 -mt-4"></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center">
                      <Zap className="w-3 h-3 mr-2 text-[#deff9a]" />
                      Intelligence Core
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-700/50">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">LIVE FEED</span>
                      </div>
                      <span className="text-[7px] font-bold text-[#deff9a]/60 uppercase tracking-widest">Grounding: Bloomberg, Reuters, IDX</span>
                      {insights.length > 0 && (
                        <span className="text-[8px] font-mono text-slate-600 uppercase">{insights[0].timestamp}</span>
                      )}
                    </div>
                  </div>
                  <motion.button 
                    whileTap={{ rotate: 180 }}
                    onClick={updateInsights}
                    disabled={isFetching}
                    className={`p-2 rounded-xl border border-slate-800 transition-colors ${isFetching ? 'bg-slate-800' : 'bg-slate-900/50 hover:bg-slate-800'}`}
                  >
                    <RefreshCw className={`w-3 h-3 text-[#deff9a] ${isFetching ? 'animate-spin' : ''}`} />
                  </motion.button>
                </div>

                <AnimatePresence mode="popLayout">
                  {insights.length > 0 ? (
                    <div className="space-y-4">
                      {(showAllInsights ? insights : insights.slice(0, 3)).map((item, idx) => (
                        <motion.div
                          key={`${item.headline}-${idx}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50 hover:border-[#deff9a]/20 transition-all group"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="text-sm font-bold text-slate-100 group-hover:text-[#deff9a] transition-colors">{item.headline}</h5>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                              item.sentiment === 'bullish' ? 'bg-green-900/30 text-green-400 border border-green-500/20' :
                              item.sentiment === 'bearish' ? 'bg-red-900/30 text-red-400 border border-red-500/20' :
                              'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {item.sentiment}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] text-[#deff9a]/80 leading-relaxed italic border-l-2 border-[#deff9a]/20 pl-3">
                              {item.insight_id}
                            </p>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                              {item.insight}
                            </p>
                            <div className="flex justify-end">
                              <span className="text-[8px] font-mono text-slate-600 uppercase tracking-tighter">{item.timestamp}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="animate-pulse space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="bg-slate-800/20 p-4 rounded-2xl border border-slate-800/50">
                          <div className="h-4 bg-slate-800/40 rounded w-2/3 mb-2"></div>
                          <div className="h-3 bg-slate-800/40 rounded w-full mb-1"></div>
                          <div className="h-3 bg-slate-800/40 rounded w-4/5"></div>
                        </div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>

                {insights.length > 3 && (
                  <button 
                    onClick={() => setShowAllInsights(!showAllInsights)}
                    className="mt-4 w-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white text-[10px] font-bold px-4 py-2 rounded-xl uppercase tracking-widest transition-all border border-slate-700/50"
                  >
                    {showAllInsights ? 'Show Less' : `View ${insights.length - 3} More Insights`}
                  </button>
                )}

                <button className="mt-4 w-full bg-[#deff9a] text-slate-950 text-[10px] font-bold px-4 py-2.5 rounded-xl uppercase tracking-[0.1em] hover:opacity-90 transition-all active:scale-[0.98]">
                  Run Deep Analysis
                </button>
              </div>
            </motion.section>
            
            {/* AI Market News Summary */}
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-6"
            >
              <div className="flex justify-between items-center mb-4 px-2">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Globe className="w-4 h-4 text-[#deff9a]" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xs font-black text-slate-100 uppercase tracking-[0.2em]">Institutional News</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[7px] font-bold text-[#deff9a] uppercase tracking-widest bg-[#deff9a]/10 px-1 rounded">Global Hub</span>
                      <span className="text-[7px] font-mono text-slate-500 uppercase tracking-tighter">Powered by: Bloomberg, Reuters, Kontan</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => updateMarketNews(true)}
                  disabled={isFetchingNews}
                  className="p-2 bg-slate-900/50 rounded-xl border border-slate-800 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 text-slate-500 ${isFetchingNews ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800/50">
                <NewsFeed news={marketNews} isLoading={isFetchingNews} />
              </div>
            </motion.section>

            {/* External Intelligence Gateways */}
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="mt-12 pb-12"
            >
              <ExternalGateways />
            </motion.section>
          </div>
        );
      case 'market':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-4">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#deff9a] rounded-full animate-pulse" />
                  Market Monitoring
                </h3>
                <div className="flex items-center bg-zinc-900/50 rounded-xl p-1 border border-zinc-800">
                  <button 
                    onClick={() => setMarketSubTab('overview')}
                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${marketSubTab === 'overview' ? 'bg-[#deff9a] text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Overview
                  </button>
                  <button 
                    onClick={() => setMarketSubTab('explorer')}
                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${marketSubTab === 'explorer' ? 'bg-[#deff9a] text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Deep Explorer
                  </button>
                  <button 
                    onClick={() => setMarketSubTab('fundamental')}
                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${marketSubTab === 'fundamental' ? 'bg-[#deff9a] text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Fundamental Engine
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-green-400 font-bold bg-green-900/20 px-2 py-0.5 rounded-full border border-green-800/30">IDX OPEN</span>
              </div>
            </div>

            {marketSubTab === 'explorer' ? (
              <StockExplorer 
                alerts={alerts} 
                onAddAlert={addAlert} 
                onRemoveAlert={removeAlert} 
                onFundamentalAudit={(symbol) => {
                  setFundamentalSymbol(symbol);
                  setMarketSubTab('fundamental');
                }}
                onViewAsset={(symbol) => {
                  const asset = assetsData.find(a => a.symbol === symbol);
                  if (asset) {
                    setSelectedAssetId(asset.id);
                    setActiveTab('asset-detail');
                  } else {
                    // Create a temporary asset entry if not found in list
                    const tempId = `temp-${symbol}`;
                    const newAsset = {
                      id: tempId,
                      name: symbol,
                      symbol: symbol,
                      category: 'Search Result',
                      value: 'Calculating...',
                      status: 'Stable',
                      type: 'Equities',
                      percentage: '0.0%',
                      liquidity: 'Medium',
                      performance: generateSimulatedPerformance()
                    };
                    setAssetsData(prev => [newAsset, ...prev]);
                    setSelectedAssetId(tempId);
                    setActiveTab('asset-detail');
                  }
                }}
              />
            ) : marketSubTab === 'fundamental' ? (
              <FundamentalAnalyst 
                initialSymbol={fundamentalSymbol || selectedSymbol.replace('IDX:', '')}
                onSelectSymbol={(sym) => {
                  setMarketSubTab('explorer');
                  // The explorer will pick it up or require auto-search logic
                }} 
              />
            ) : (
              <>
                <GlobalIndicesFeed />
                <MarketOverviewWidget />
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative space-y-3"
                >
                  <div className="flex flex-wrap gap-2 mb-3">
                    {TV_STUDIES.map(study => (
                      <button
                        key={study.id}
                        onClick={() => {
                          setSelectedStudies(prev => 
                            prev.includes(study.id) 
                              ? prev.filter(id => id !== study.id)
                              : [...prev, study.id]
                          );
                        }}
                        className={`px-3 py-1 text-[9px] font-black tracking-widest rounded-lg border transition-all ${
                          selectedStudies.includes(study.id)
                            ? 'bg-[#deff9a]/20 border-[#deff9a]/50 text-[#deff9a]'
                            : 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        {study.name}
                      </button>
                    ))}
                  </div>
                  <TradingViewWidget symbol={selectedSymbol} studies={selectedStudies} />
                </motion.div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#deff9a]" />
                      <div className="flex flex-col">
                        <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest">IDX Intelligence Scanner</h4>
                        <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                          <Zap className="w-2 h-2 text-orange-400" /> REAL-TIME SMART FILTERING
                        </span>
                      </div>
                    </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowIntradayScanner(!showIntradayScanner)}
                      className={`px-3 py-1.5 rounded-xl border text-[9px] font-black tracking-widest transition-all flex items-center gap-2 ${
                        showIntradayScanner 
                          ? 'bg-[#d4af37]/20 border-[#d4af37]/50 text-[#d4af37]' 
                          : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      <Radar className={`w-3.5 h-3.5 ${showIntradayScanner ? 'animate-pulse' : ''}`} />
                      {showIntradayScanner ? 'HIDE RADAR' : 'INTRADAY RADAR'}
                    </button>
                    <div className="flex items-center gap-1.5 bg-[#deff9a]/10 px-2 py-1 rounded-full border border-[#deff9a]/20">
                  <div className="w-1.5 h-1.5 bg-[#deff9a] rounded-full animate-pulse shadow-[0_0_8px_rgba(222,255,154,0.5)]" />
                  <span className="text-[8px] text-[#deff9a] font-black uppercase tracking-widest whitespace-nowrap">LIVE TRADINGVIEW FEED</span>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {showIntradayScanner && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  className="overflow-hidden"
                >
                  <IntradayScanner />
                </motion.div>
              )}
            </AnimatePresence>

              {/* DISCOVERY FILTER CHECK */}
              {stocks && stocks.length > 0 && (
                <div className="px-1 py-1">
                   <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full w-fit">
                    <Activity className="w-3 h-3 text-blue-400" />
                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">
                      {stocks.length} assets successfully filtered via VentureAM Smart Algorithm
                    </span>
                   </div>
                </div>
              )}

              {/* LOCKED FILTERS BANNER */}
              <div className="bg-slate-900/40 p-3 rounded-2xl border border-[#deff9a]/10 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3 text-[#deff9a]" />
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Active Smart Constraints</span>
                  </div>
                  <span className="text-[8px] font-bold text-[#deff9a] bg-[#deff9a]/10 px-2 py-0.5 rounded border border-[#deff9a]/20 uppercase">Locked</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="px-2 py-1 bg-slate-950 rounded-lg border border-slate-800 text-[8px] font-mono text-slate-400 flex items-center gap-1.5">
                    <div className="w-1 h-1 bg-blue-400 rounded-full" /> PRICE &gt; EMA(20)
                  </div>
                  <div className="px-2 py-1 bg-slate-950 rounded-lg border border-slate-800 text-[8px] font-mono text-slate-400 flex items-center gap-1.5">
                    <div className="w-1 h-1 bg-orange-400 rounded-full" /> EPS GROW (TTM) &lt; 10%
                  </div>
                </div>
              </div>
              
              {/* TECHNICAL SIGNAL FEED LOG */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {['1D', '5D', '1W', '1M', '1Y'].map((tf) => (
                    <button 
                      key={tf}
                      onClick={() => setScanOptions(prev => ({ ...prev, timeframe: tf as any }))}
                      className={`text-[9px] font-black px-3 py-1.5 rounded-full transition-all whitespace-nowrap border ${
                        scanOptions.timeframe === tf 
                        ? 'bg-[#deff9a] text-black border-[#deff9a]' 
                        : 'bg-white/5 text-slate-500 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* TECHNICAL SIGNAL FEED LOG */}
              <div className="bg-zinc-900/50 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl">
                <div className="p-5 border-b border-white/5 flex items-center justify-between bg-zinc-900/60">
                   <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#DFFF00]/10 rounded-xl">
                      <Target className="w-4 h-4 text-[#DFFF00]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-widest">Signal Detection Log</h4>
                      <p className="text-[8px] text-zinc-500 font-bold uppercase mt-0.5">VentureAM Smart Scan Persistence</p>
                    </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1 border border-white/5">
                        <button 
                          onClick={() => setLogSortBy('timestamp')}
                          className={`text-[9px] px-2 py-0.5 rounded transition-colors font-bold ${logSortBy === 'timestamp' ? 'bg-[#DFFF00] text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          TIME
                        </button>
                        <button 
                          onClick={() => setLogSortBy('symbol')}
                          className={`text-[9px] px-2 py-0.5 rounded transition-colors font-bold ${logSortBy === 'symbol' ? 'bg-[#DFFF00] text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          SYM
                        </button>
                      </div>
                      <button 
                        onClick={() => setLogSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="p-1 hover:bg-white/5 rounded-lg transition-colors text-zinc-500 hover:text-[#DFFF00]"
                        title={logSortOrder === 'asc' ? 'Ascending' : 'Descending'}
                      >
                        {logSortOrder === 'asc' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      </button>
                      <span className="text-[8px] font-mono text-zinc-500 uppercase">Buffer: {technicalLogs.length}/50</span>
                    </div>
                </div>
                
                <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
                  {sortedLogs.length > 0 ? (
                    sortedLogs.map((stock, i) => (
                      <div key={`${stock.symbol}-${stock.detectedAt || i}`}>
                        <MarketFeedLog stockData={stock} />
                      </div>
                    ))
                  ) : (
                    <div className="p-10 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center mb-3">
                        <Radar className="w-6 h-6 text-zinc-700 animate-pulse" />
                      </div>
                      <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest leading-relaxed">
                        Initializing Gateway Feed...<br/>Awaiting qualifying IDX signatures
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Discovery Feed */}
              <div className="grid grid-cols-1 gap-3">
                <AnimatePresence mode="popLayout">
                  {stocks.length > 0 ? (
                    stocks.map((stock, idx) => (
                      <motion.div 
                        key={stock.symbol}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ x: 4 }}
                        onClick={() => {
                          const asset = ASSETS.find(a => a.symbol === stock.symbol);
                          setSelectedSymbol(`IDX:${stock.symbol}`);
                          if (asset) {
                            setSelectedAssetId(asset.id);
                            setActiveTab('asset-detail');
                          }
                        }}
                        className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50 flex justify-between items-center group cursor-pointer active:scale-95 transition-all"
                      >
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`text-[10px] font-bold py-1 px-2 min-w-[45px] text-center rounded-lg ${
                              stock.signal === 'BUY' ? 'bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 
                              stock.signal === 'SELL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {stock.signal}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-sm text-slate-100 uppercase truncate">{stock.symbol}</p>
                              <p className="text-[9px] text-slate-500 font-bold uppercase truncate">{stock.name}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 border-t border-slate-800/50 pt-2 mt-1">
                            <div className="flex flex-col">
                              <span className="text-[7px] text-slate-500 uppercase font-bold tracking-widest">Volume</span>
                              <span className="text-[10px] text-slate-300 font-mono font-bold">{stock.volume || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[7px] text-slate-500 uppercase font-bold tracking-widest">P/E Ratio</span>
                              <span className="text-[10px] text-slate-300 font-mono font-bold">{stock.peRatio || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col border-l border-slate-800 pl-2">
                              <span className="text-[7px] text-slate-500 uppercase font-bold tracking-widest">Mkt Cap</span>
                              <span className="text-[10px] text-[#deff9a] font-mono font-bold">{stock.marketCap || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right pl-4 border-l border-slate-800/50 ml-2">
                          <p className="text-sm font-mono font-black text-slate-200">Rp {stock.price}</p>
                          <p className={`text-[10px] font-black ${stock.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                            {stock.change}
                          </p>
                          <div className="mt-2 text-[7px] text-slate-600 font-black uppercase tracking-tighter shadow-sm">Verified</div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    Array(4).fill(0).map((_, i) => (
                      <div key={i} className="bg-slate-900/20 h-16 rounded-2xl animate-pulse" />
                    ))
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => setShowScanParams(!showScanParams)}
                  className="w-full py-2 border border-slate-800 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                >
                  <Search className="w-3 h-3" />
                  {showScanParams ? "Close Deep Explorer" : "Launch Technical Explorer"}
                </button>
              </div>

              <AnimatePresence>
                {showScanParams && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-3"
                  >
                    <div className="bg-slate-900/60 p-5 rounded-3xl border border-slate-800 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Filter className="w-4 h-4 text-[#deff9a]" />
                        <h5 className="text-[10px] font-black text-white uppercase tracking-widest">Advanced Algorithmic Filters</h5>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">RSI Range (Min - Max)</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              placeholder="0"
                              value={scanOptions.rsiRange?.[0] || ''}
                              onChange={(e) => setScanOptions(prev => ({ ...prev, rsiRange: [parseInt(e.target.value) || 0, prev.rsiRange?.[1] || 100] }))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] font-mono text-[#deff9a]"
                            />
                            <span className="text-slate-700">-</span>
                            <input 
                              type="number" 
                              placeholder="100"
                              value={scanOptions.rsiRange?.[1] || ''}
                              onChange={(e) => setScanOptions(prev => ({ ...prev, rsiRange: [prev.rsiRange?.[0] || 0, parseInt(e.target.value) || 100] }))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] font-mono text-[#deff9a]"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">MACD Logic</label>
                          <select 
                            value={scanOptions.macdLevel || 'all'}
                            onChange={(e) => setScanOptions(prev => ({ ...prev, macdLevel: e.target.value as any }))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] font-bold text-slate-300 uppercase tracking-tight"
                          >
                            <option value="all">Any State</option>
                            <option value="above_zero">Above Zero Line</option>
                            <option value="below_zero">Below Zero Line</option>
                            <option value="crossover">Signal Crossover</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Industry Sector</label>
                          <select 
                            value={scanOptions.sector || ''}
                            onChange={(e) => setScanOptions(prev => ({ ...prev, sector: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] font-bold text-slate-300 uppercase tracking-tight"
                          >
                            <option value="">All Sectors</option>
                            <option value="Banking">Banking & Finance</option>
                            <option value="Energy">Energy & Mining</option>
                            <option value="Infrastructure">Infrastructure</option>
                            <option value="Consumer">Consumer Goods</option>
                            <option value="Technology">Technology</option>
                            <option value="Property">Property & Real Estate</option>
                            <option value="Healthcare">Healthcare</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Min Volume Threshold</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 1M, 500K"
                            value={scanOptions.minVolume || ''}
                            onChange={(e) => setScanOptions(prev => ({ ...prev, minVolume: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] font-mono text-[#deff9a]"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Date Range (Freshness)</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="date" 
                              value={scanOptions.dateRange?.start || ''}
                              onChange={(e) => setScanOptions(prev => ({ ...prev, dateRange: { ...prev.dateRange || { start: '', end: '' }, start: e.target.value } }))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[7px] font-bold text-slate-400 uppercase"
                            />
                            <input 
                              type="date" 
                              value={scanOptions.dateRange?.end || ''}
                              onChange={(e) => setScanOptions(prev => ({ ...prev, dateRange: { ...prev.dateRange || { start: '', end: '' }, end: e.target.value } }))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[7px] font-bold text-slate-400 uppercase"
                            />
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => updateStocks()}
                        className="w-full py-3 bg-[#deff9a] text-slate-950 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-lg hover:shadow-[#deff9a]/10 transition-all active:scale-[0.98]"
                      >
                        Apply Advanced Constraints
                      </button>
                    </div>

                    <div className="bg-slate-900/20 rounded-2xl border border-slate-800/50 overflow-hidden shadow-2xl">
                      <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TradingView Real-time Board</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-[8px] text-slate-600 font-bold uppercase">Cloud Connection Active</span>
                        </div>
                      </div>
                      <TradingViewScreenerWidget />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <div onClick={() => setSelectedSymbol('IDX:COMPOSITE')} className="cursor-pointer transition-transform active:scale-95">
                <MarketMetricCard symbol="JCI" label="JCI (IHSG)" proName="IDX:COMPOSITE" />
              </div>
              <div onClick={() => setSelectedSymbol('FX_IDC:USDIDR')} className="cursor-pointer transition-transform active:scale-95">
                <MarketMetricCard symbol="USDIDR" label="USD/IDR" proName="FX_IDC:USDIDR" />
              </div>
              <div onClick={() => setSelectedSymbol('OANDA:XAUUSD')} className="cursor-pointer transition-transform active:scale-95">
                <MarketMetricCard symbol="GOLD" label="GOLD" proName="OANDA:XAUUSD" />
              </div>
              <div onClick={() => setSelectedSymbol('STI')} className="cursor-pointer transition-transform active:scale-95">
                <MarketMetricCard symbol="STI" label="STI Index" proName="STI" />
              </div>
              <div onClick={() => setSelectedSymbol('TSE:NI225')} className="cursor-pointer transition-transform active:scale-95">
                <MarketMetricCard symbol="NIKKEI" label="NIKKEI 225" proName="TSE:NI225" />
              </div>
              <div onClick={() => setSelectedSymbol('HSI:HSI')} className="cursor-pointer transition-transform active:scale-95">
                <MarketMetricCard symbol="HSI" label="Hang Seng" proName="HSI:HSI" />
              </div>
              <div onClick={() => setSelectedSymbol('FTSE:UKX')} className="cursor-pointer transition-transform active:scale-95">
                <MarketMetricCard symbol="FTSE" label="FTSE 100" proName="FTSE:UKX" />
              </div>
              <div onClick={() => setSelectedSymbol('XETR:DAX')} className="cursor-pointer transition-transform active:scale-95">
                <MarketMetricCard symbol="DAX" label="DAX 40" proName="XETR:DAX" />
              </div>
              <div onClick={() => setSelectedSymbol('NASDAQ:IXIC')} className="cursor-pointer transition-transform active:scale-95">
                <MarketMetricCard symbol="NASDAQ" label="NASDAQ" proName="NASDAQ:IXIC" />
              </div>
              <div onClick={() => setSelectedSymbol('FX:EURUSD')} className="cursor-pointer transition-transform active:scale-95">
                <MarketMetricCard symbol="EURUSD" label="EUR/USD" proName="FX:EURUSD" />
              </div>
              <div onClick={() => setSelectedSymbol('FX:USDJPY')} className="cursor-pointer transition-transform active:scale-95">
                <MarketMetricCard symbol="USDJPY" label="USD/JPY" proName="FX:USDJPY" />
              </div>
              <div onClick={() => setSelectedSymbol('FX_IDC:GBPIDR')} className="cursor-pointer transition-transform active:scale-95">
                <MarketMetricCard symbol="GBPIDR" label="GBP/IDR" proName="FX_IDC:GBPIDR" />
              </div>
              <div onClick={() => setSelectedSymbol('FX:AUDUSD')} className="cursor-pointer transition-transform active:scale-95">
                <MarketMetricCard symbol="AUDUSD" label="AUD/USD" proName="FX:AUDUSD" />
              </div>
              <div onClick={() => setSelectedSymbol('FX:USDCAD')} className="cursor-pointer transition-transform active:scale-95">
                <MarketMetricCard symbol="USDCAD" label="USD/CAD" proName="FX:USDCAD" />
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Institutional Market Feed</h4>
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 bg-[#deff9a] rounded-full animate-pulse" />
                  <span className="text-[8px] text-slate-400 font-bold uppercase">TradingView Direct</span>
                </div>
              </div>
              <TradingViewMarketWidget />
            </div>

            {/* IDX PREMIUM DISCOVERY CARD */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden group mb-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#deff9a]/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2.5rem]" />
              <div className="bg-slate-900/60 p-6 rounded-[2.5rem] border border-[#deff9a]/10 backdrop-blur-xl relative z-10 shadow-2xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#deff9a] text-slate-950 font-black uppercase tracking-tighter">AI POWERED</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-[#deff9a] font-black uppercase tracking-tighter">IDX REALTIME</span>
                    </div>
                    <h4 className="text-xl font-black text-white tracking-tight uppercase">Vam Smart Scanner</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Screener ID: 7lUlY4am (IDX Focus)</p>
                  </div>
                  <div className="p-3 bg-slate-950/80 rounded-2xl border border-white/5">
                    <Target className="w-5 h-5 text-[#deff9a]" />
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed font-medium">
                  Scan 800+ IDX tickers for breakout patterns and relative strength using core Ventuream intelligence. Precision targeting for the Indonesian market.
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => {
                      updateStocks();
                      setShowVamScanner(!showVamScanner);
                    }}
                    disabled={isScanning}
                    className="w-full py-4 bg-[#deff9a] text-slate-950 font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-[0_0_30px_rgba(222,255,154,0.15)] hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
                        Initializing IDX Scan...
                      </>
                    ) : (
                      <>
                        <Activity className="w-4 h-4" />
                        {showVamScanner ? 'Hide Smart Scanner' : 'Execute Smart IDX Scan'}
                      </>
                    )}
                  </button>

                  <button 
                    onClick={() => setShowIntradayScanner(!showIntradayScanner)}
                    className={`w-full py-3 border ${showIntradayScanner ? 'bg-[#d4af37]/20 border-[#d4af37]/50 text-[#d4af37]' : 'border-white/10 text-white/60 hover:bg-white/5'} font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-3`}
                  >
                    <Radar className={`w-4 h-4 ${showIntradayScanner ? 'animate-pulse' : ''}`} />
                    {showIntradayScanner ? 'Hide Intraday Radar' : 'Launch Intraday Super-Signal'}
                  </button>
                </div>
                
                <AnimatePresence>
                  {showVamScanner && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <VamSmartScanner />
                    </motion.div>
                  )}
                  {showIntradayScanner && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <IntradayScanner />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </div>
    );
      case 'portfolio':
        return (
          <VAMTerminalScanner 
            defaultTab="PORTFOLIO"
            activeMarket={activeScannerMarket}
            activeModule={activeScannerModule}
            livePrices={livePricesMap}
            portfolioContent={
              <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-sm font-semibold text-slate-300">Portfolio Hub</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={syncMarketConnectivity}
                      disabled={isMarketSyncing}
                      className="p-2 bg-slate-800 text-[#DFFF00] rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isMarketSyncing ? 'animate-spin' : ''}`} />
                    </button>
                    <button className="p-2 bg-[#DFFF00] text-slate-950 rounded-xl flex items-center gap-2 font-bold text-[10px] uppercase tracking-wider px-3">
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  </div>
                </div>

                {/* Connection Status: CGS & IBKR */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex flex-col gap-2 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 bg-blue-500/5 blur-xl rounded-full -mr-2 -mt-2"></div>
                    <div className="flex items-center gap-2">
                      <div className="p-1 px-1.5 bg-blue-500/10 rounded-md">
                        <Database className="w-2.5 h-2.5 text-blue-400" />
                      </div>
                      <p className="text-[8px] text-zinc-500 uppercase font-black tracking-tighter">CGS HUB</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-200 uppercase tracking-tight">CGS Int'l</p>
                      <div className="flex items-center gap-1 mt-1 bg-green-500/10 px-1.5 py-0.5 rounded-full border border-green-500/20 w-fit">
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[7px] text-green-400 font-bold uppercase tracking-tight">ACTIVE</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex flex-col gap-2 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 bg-[#deff9a]/5 blur-xl rounded-full -mr-2 -mt-2"></div>
                    <div className="flex items-center gap-2">
                      <div className="p-1 px-1.5 bg-[#deff9a]/10 rounded-md">
                        <TrendingUp className="w-2.5 h-2.5 text-[#deff9a]" />
                      </div>
                      <p className="text-[8px] text-zinc-500 uppercase font-black tracking-tighter">GLOBAL</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-200 uppercase tracking-tight">IBKR Global</p>
                      <div className="flex items-center gap-1 mt-1 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20 w-fit">
                        <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[7px] text-emerald-400 font-bold uppercase tracking-tight">LINKED</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sync Status Card */}
                <motion.div 
                  whileTap={{ scale: 0.98 }}
                  onClick={syncMarketConnectivity}
                  className={`bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition-colors ${isMarketSyncing ? 'border-[#deff9a]/30' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isMarketSyncing ? 'bg-[#deff9a] text-slate-950' : 'bg-[#deff9a]/10 text-[#deff9a]'}`}>
                      <RefreshCw className={`w-4 h-4 ${isMarketSyncing ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Market Connectivity</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-200">
                          {isMarketSyncing ? 'Synchronizing Feeds...' : 'Unified Data Feed (IDX + US)'}
                        </p>
                        {!isMarketSyncing && <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
                      </div>
                      <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Last Synced: {lastMarketSync}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-[8px] font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded block uppercase tracking-tighter">
                      {isMarketSyncing ? 'Active Sync' : 'V2.4 SYNC'}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">LATENCY</span>
                      <span className={`text-[9px] font-mono font-black ${parseFloat(networkStats.latency) < 100 ? 'text-green-400' : 'text-orange-400'}`}>
                        {networkStats.latency}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Performance Chart */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <PortfolioChart currentValue={totalPortfolioValue} />
                </motion.div>

                {/* Transaction History */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gateway Execution Log</h4>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1 h-1 bg-[#deff9a] rounded-full animate-pulse" />
                      <span className="text-[8px] text-[#deff9a] font-bold uppercase">Real-time History</span>
                    </div>
                  </div>
                  <TransactionTable data={history} />
                </div>

                {/* Holdings List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Holdings Details</h4>
                    <span className="text-[10px] text-slate-600 font-mono">{portfolioData.length} POSITIONS</span>
                  </div>
                  
                  <div className="space-y-3">
                    {portfolioData.map((asset, idx) => (
                      <motion.div 
                        key={asset.ticker}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => {
                          const cleanTicker = asset.ticker.split('.')[0];
                          const foundAsset = ASSETS.find(a => a.symbol === cleanTicker);
                          if (foundAsset) {
                            setSelectedAssetId(foundAsset.id);
                            setActiveTab('asset-detail');
                          }
                        }}
                        className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50 flex justify-between items-center group cursor-pointer hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-700/50 group-hover:border-[#deff9a]/30 transition-colors uppercase">
                            {asset.ticker.split('.')[0]}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-100 uppercase">{asset.ticker.split('.')[0]}</p>
                            <p className="text-[10px] text-slate-500">{asset.lots} Lots • {new Decimal(asset.averagePrice).toNumber().toFixed(2)} Avg</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs font-mono font-bold text-slate-200">Rp {typeof asset.marketValue === 'number' ? asset.marketValue.toLocaleString('id-ID') : (asset.marketValue || 'N/A')}</p>
                            <p className={`text-[10px] font-medium ${asset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Bloomberg Portfolio Monitor */}
                <div className="pt-6">
                  <BloombergTable 
                    portfolioData={portfolioData} 
                    onSelectSymbol={(s) => {
                      setSelectedSymbol(s);
                      setActiveTab('home');
                    }}
                    onFundamentalAudit={(symbol) => {
                      setFundamentalSymbol(symbol);
                      setActiveTab('fundamental');
                    }}
                  />
                </div>

                {/* Total Market Value Card Moved to Bottom */}
                <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-slate-800/80 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 bg-blue-500/5 blur-3xl rounded-full -mr-10 -mt-10 group-hover:bg-blue-500/10 transition-all"></div>
                  <div className="relative z-10">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-2">Total Combined Market Value</p>
                    <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tighter font-mono">
                      Rp {typeof totalPortfolioValue === 'number' ? totalPortfolioValue.toLocaleString('id-ID') : (totalPortfolioValue || 'N/A')}
                    </h2>
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      {(() => {
                        const totalCost = myCGSPortfolio.assets.reduce((acc, curr) => {
                          const assetCost = new Decimal(curr.averagePrice).times(curr.lots).times(100);
                          return new Decimal(acc).plus(assetCost).toNumber();
                        }, 0);
                        const totalPL = new Decimal(totalPortfolioValue).minus(totalCost);
                        const plPercentage = totalCost === 0 ? new Decimal(0) : totalPL.div(totalCost).times(100);
                        const isPositive = totalPL.gte(0);
                        return (
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${isPositive ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            <span className="text-[10px] font-black">{isPositive ? '+' : ''}{plPercentage.toNumber().toFixed(2)}% Performance</span>
                          </div>
                        );
                      })()}
                      <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/80 rounded-full border border-slate-800">
                        <span className="text-[9px] text-slate-500 font-black uppercase">RDN Cash:</span>
                        <span className="text-[10px] text-[#DFFF00] font-mono font-bold">Rp {typeof myCGSPortfolio.cashBalance === 'number' ? myCGSPortfolio.cashBalance.toLocaleString('id-ID') : (myCGSPortfolio.cashBalance || 'N/A')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Action */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-5 rounded-2xl border border-slate-800 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 bg-blue-500/5 blur-3xl rounded-full -mr-4 -mt-4"></div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unrealized Performance</h4>
                    <PieChart className="w-3 h-3 text-slate-600" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-300">Equity - IDX</span>
                      <span className="text-sm font-mono text-slate-100">Rp 1.65M</span>
                    </div>
                    <div className="w-full bg-slate-800/50 h-1.5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '42%' }}
                        className="bg-red-500/50 h-full" 
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500">Net Portfolio Drift</span>
                      <span className="text-red-400 font-mono">-9.01%</span>
                    </div>
                  </div>
                </div>
                
                <button className="w-full py-4 rounded-2xl border border-slate-800 bg-slate-900/50 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                  <ExternalLink className="w-3 h-3" />
                  Share Portfolio Analysis
                </button>
              </div>
            }
          />
        );
      case 'security':
        if (securityView === 'history') {
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setSecurityView('main')} className="p-1.5 bg-slate-900 rounded-lg border border-slate-800 text-[#deff9a]">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Login History</h3>
              </div>
              <div className="space-y-3">
                {[
                  { id: 1, device: 'iPhone 15 Pro', location: 'Jakarta, ID', time: 'Today, 06:12', status: 'Current' },
                  { id: 2, device: 'Chrome / MacOS', location: 'Singapore, SG', time: 'Yesterday, 22:45', status: 'Success' },
                  { id: 3, device: 'iPad Air', location: 'Jakarta, ID', time: '10 May, 14:20', status: 'Success' },
                  { id: 4, device: 'Unknown Linux', location: 'Bandung, ID', time: '08 May, 09:12', status: 'Blocked', fail: true },
                ].map((log) => (
                  <div key={log.id} className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-black text-slate-200 uppercase tracking-tight">{log.device}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{log.location} • {log.time}</p>
                    </div>
                    <span className={`text-[8px] px-2 py-0.5 rounded-lg font-black uppercase ${log.fail ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (securityView === 'devices') {
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setSecurityView('main')} className="p-1.5 bg-slate-900 rounded-lg border border-slate-800 text-[#deff9a]">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Device Authorization</h3>
              </div>
              <div className="bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800 flex flex-col items-center text-center mb-6">
                <Zap className="w-8 h-8 text-[#deff9a] mb-2" />
                <p className="text-xs font-black text-white uppercase tracking-widest">Ventuream Device Shield</p>
                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed uppercase tracking-widest">
                  Only authorized devices can execute high-liquidity operations or access multi-channel gateway protocols.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  { id: 1, name: 'Main Corporate Terminal', type: 'Workstation', id_code: 'VNT-8821' },
                  { id: 2, name: 'Personal ID Device', type: 'Mobile (iOS)', id_code: 'VNT-0012' },
                ].map((device) => (
                  <div key={device.id} className="bg-slate-900/40 p-4 rounded-2xl border border-[#deff9a]/10 flex justify-between items-center group">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-[#deff9a]/5 rounded-xl border border-[#deff9a]/10">
                        <Cloud className="w-4 h-4 text-[#deff9a]" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-100 uppercase tracking-tight">{device.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{device.type} • {device.id_code}</p>
                      </div>
                    </div>
                    <button className="text-[8px] font-black text-red-500 uppercase tracking-widest hover:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 transition-all">
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-4 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 text-[10px] font-black uppercase tracking-widest hover:border-[#deff9a]/30 transition-all">
                + Authorize New Device
              </button>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-300 px-1">Security Status</h3>
            
            <div className="bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800 flex flex-col items-center text-center mb-2">
              <ShieldCheck className="w-12 h-12 text-[#deff9a] mb-4" />
              <p className="text-sm font-bold text-slate-200">Biometric Protection Active</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">Encrypted via AES-256</p>
              <div className="mt-6 w-full space-y-3 text-left">
                <button 
                  onClick={() => setSecurityView('history')}
                  className="w-full flex justify-between items-center p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-[#deff9a]" />
                    <span className="text-xs font-black text-slate-300 uppercase tracking-tight">Login History</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
                <button 
                  onClick={() => setSecurityView('devices')}
                  className="w-full flex justify-between items-center p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Database className="w-4 h-4 text-[#deff9a]" />
                    <span className="text-xs font-black text-slate-300 uppercase tracking-tight">Device Authorization</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Multi-channel Alert Configuration */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Bell className="w-4 h-4 text-[#deff9a]" />
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Multi-channel Gateway Alerts</h4>
              </div>
              <div className="bg-slate-900/60 p-5 rounded-[2.5rem] border border-[#deff9a]/10 backdrop-blur-xl">
                <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <FileText className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white uppercase tracking-tight">Email Notifications</p>
                      </div>
                    </div>
                    <div className="w-10 h-5 bg-[#deff9a] rounded-full relative p-1 cursor-pointer">
                      <div className="w-3 h-3 bg-slate-950 rounded-full translate-x-5" />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded-xl border border-green-500/20">
                        <Zap className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white uppercase tracking-tight">WhatsApp Gateway</p>
                      </div>
                    </div>
                    <div className="w-10 h-5 bg-[#deff9a] rounded-full relative p-1 cursor-pointer">
                      <div className="w-3 h-3 bg-slate-950 rounded-full translate-x-5" />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-800/10">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                      Instant alerts dispatched for unauthorized withdrawals, new device logins, and liquidity threshold breaches.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'scanner':
        return (
          <VAMTerminalScanner 
            defaultTab="SCANNER"
            activeMarket={activeScannerMarket}
            activeModule={activeScannerModule}
            livePrices={livePricesMap}
            portfolioContent={
              <div className="space-y-6">
                <BloombergTable 
                  portfolioData={portfolioData} 
                  onSelectSymbol={(s) => {
                    setSelectedSymbol(s);
                    setActiveTab('home');
                  }}
                  onFundamentalAudit={(symbol) => {
                    setFundamentalSymbol(symbol);
                    setActiveTab('fundamental');
                  }}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {portfolioData.map((asset) => (
                    <div 
                      key={asset.ticker} 
                      onClick={() => {
                        setSelectedSymbol(`IDX:${asset.ticker.replace('.JK', '')}`);
                        setActiveTab('home');
                      }}
                      className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50 flex justify-between items-center group cursor-pointer hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-700/50 uppercase">
                          {asset.ticker.split('.')[0]}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-100 uppercase">{asset.ticker.split('.')[0]}</p>
                          <p className="text-[10px] text-slate-500">{asset.lots} Lots • {new Decimal(asset.averagePrice).toNumber().toFixed(2)} Avg</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono font-bold text-slate-200">Rp {typeof asset.marketValue === 'number' ? asset.marketValue.toLocaleString('id-ID') : (asset.marketValue || 'N/A')}</p>
                        <p className={`text-[10px] font-medium ${asset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            }
          />
        );
      case 'rebalancer':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setActiveTab('home')} className="p-1.5 bg-slate-900 rounded-lg border border-slate-800 text-[#deff9a]">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Portfolio Rebalance Protocol</h3>
            </div>
            <RebalanceTool 
              portfolioData={portfolioData} 
              cashBalance={myCGSPortfolio.cashBalance} 
            />
          </div>
        );
      case 'fundamental':
        return (
          <div className="space-y-6">
             <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-[#DFFF00]" />
                    Fundamental Engine
                  </h3>
                </div>
             </div>
            <FundamentalAnalyst 
              initialSymbol={fundamentalSymbol}
              onSelectSymbol={(sym) => {
                setFundamentalSymbol(sym);
              }}
            />
          </div>
        );
      case 'legal':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setActiveTab('home')} className="p-1.5 bg-slate-900 rounded-lg border border-slate-800 text-[#deff9a]">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Legal Document Automation</h3>
            </div>
            <LegalDocumentCenter />
          </div>
        );
      case 'financial':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setActiveTab('home')} className="p-1.5 bg-slate-900 rounded-lg border border-slate-800 text-orange-400">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Financial Reporting Ecosystem</h3>
            </div>
            <FinancialReportingCenter />
          </div>
        );
      case 'archive':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setActiveTab('home')} className="p-1.5 bg-slate-900 rounded-lg border border-slate-800 text-blue-400">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Institutional Audit Persistence</h3>
            </div>
            <RegulatoryArchive />
          </div>
        );
      case 'tasks':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setActiveTab('home')} className="p-1.5 bg-slate-900 rounded-lg border border-slate-800 text-[#deff9a]">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Internal Work Order Center</h3>
            </div>
            <TaskCenter />
          </div>
        );
      case 'gateway':
        return (
          <div className="space-y-12">
            <InternationalGatewayDashboard onBack={() => setActiveTab('home')} />
            <div className="border-t border-slate-800 pt-12">
              <ExternalGateways />
            </div>
          </div>
        );
      case 'compliance':
      case 'liquidity':
        const isUnlocked = userRole === 'President_Director';
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setActiveTab('home')} className="p-1.5 bg-slate-900 rounded-lg border border-slate-800 text-[#deff9a]">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">
                  {SIDEBAR_MENU.find(m => m.path === activeTab)?.label || 'Institutional Tool'}
                </h3>
                {isUnlocked && <span className="text-[8px] text-[#deff9a] font-black uppercase tracking-tighter">Authority: Fully Unlocked</span>}
              </div>
            </div>
            
            {isUnlocked ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900/50 p-6 rounded-[2.5rem] border border-[#deff9a]/20 backdrop-blur-xl"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-[#deff9a]/10 rounded-2xl border border-[#deff9a]/20">
                    {(() => {
                      const Icon = SIDEBAR_MENU.find(m => m.path === activeTab)?.icon || Info;
                      return <Icon className="w-6 h-6 text-[#deff9a]" />;
                    })()}
                  </div>
                  <div>
                    <p className="text-lg font-black text-white uppercase tracking-tight">Active Protocol</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Secure Institutional Gateway</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Status</p>
                    <p className="text-sm font-black text-green-400 uppercase">Operational</p>
                  </div>
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Network</p>
                    <p className="text-sm font-black text-blue-400 uppercase">Primary</p>
                  </div>
                </div>

                <div className="space-y-3 p-4 bg-slate-950/40 rounded-2xl border border-slate-800/50">
                   <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                     <span>Synchronization</span>
                     <span>100%</span>
                   </div>
                   <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: '100%' }}
                       className="h-full bg-[#deff9a]"
                     />
                   </div>
                 </div>
               </motion.div>
             ) : (
               <div className="bg-slate-900/50 p-10 rounded-[2.5rem] border border-slate-800 flex flex-col items-center text-center">
                 <div className="p-4 bg-[#deff9a]/10 rounded-full border border-[#deff9a]/20 mb-6">
                   {(() => {
                     const Icon = SIDEBAR_MENU.find(m => m.path === activeTab)?.icon || Info;
                     return <Icon className="w-8 h-8 text-[#deff9a]" />;
                   })()}
                 </div>
                 <h3 className="text-xl font-black text-white uppercase tracking-tight">Access Granted</h3>
                 <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed uppercase tracking-widest max-w-sm">
                   Institutional connection established. Initializing secure data hub for {activeTab.toUpperCase()}...
                 </p>
                 <div className="mt-8 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Protocol Secure</span>
                 </div>
               </div>
             )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans select-none overflow-x-hidden relative">
      <SpeedInsights />
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#deff9a]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] contrast-150" />
      </div>

      <div className="flex flex-col lg:flex-row max-w-[1440px] mx-auto min-h-screen relative z-10">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex sidebar-nav flex-col bg-black border-r border-slate-800 p-6 sticky top-0 h-screen">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-[#DFFF00] tracking-tight">VentureAM</h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Institutional System</p>
          </div>

          <nav className="flex-1 space-y-2">
            {SIDEBAR_MENU.map((item) => (
              <React.Fragment key={item.id}>
                <button
                  onClick={() => {
                    if ('external' in item && item.external) {
                      window.open(item.path, '_blank');
                    } else {
                      setActiveTab(item.path);
                      if (item.path !== 'scanner') {
                        setActiveScannerModule(null);
                      }
                    }
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all border ${
                    activeTab === item.path 
                    ? 'bg-[#deff9a]/10 border-[#deff9a]/20 text-[#deff9a]' 
                    : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/60 text-slate-400'
                  }`}
                >
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  <div className="text-left flex-1">
                    <p className="text-xs font-black uppercase tracking-tight">{item.label}</p>
                    {item.provider && <p className="text-[8px] text-slate-500 font-bold uppercase">{item.provider}</p>}
                  </div>
                </button>
                
                {/* Sub-menu for Scanner Markets and Modules */}
                {item.path === 'scanner' && (
                  <AnimatePresence>
                    {activeTab === 'scanner' && item.markets && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden space-y-2 ml-4 border-l border-slate-800 pl-4 py-2"
                      >
                        {item.markets.map(market => (
                          <div key={market.id} className="space-y-1">
                            <button
                              onClick={() => {
                                setExpandedMarket(expandedMarket === market.id ? null : market.id);
                                setActiveScannerMarket(market.id.toUpperCase() as any);
                                setActiveScannerModule(null);
                              }}
                              className={`w-full text-left p-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between ${
                                activeScannerMarket === market.id.toUpperCase()
                                ? 'text-[#00ffff] bg-[#00ffff]/5'
                                : 'text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              <span>{market.label}</span>
                              <ChevronRight className={`w-3 h-3 transition-transform ${expandedMarket === market.id ? 'rotate-90' : ''}`} />
                            </button>
                            
                            <AnimatePresence>
                              {expandedMarket === market.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="ml-2 border-l border-slate-800/50 pl-3 space-y-1 overflow-hidden"
                                >
                                  {market.modules.map(module => (
                                    <button
                                      key={module}
                                      onClick={() => setActiveScannerModule(module)}
                                      className={`w-full text-left p-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                                        activeScannerModule === module
                                        ? 'text-[#ff9900] bg-[#ff9900]/10'
                                        : 'text-slate-600 hover:text-slate-400'
                                      }`}
                                    >
                                      &gt; {module}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </React.Fragment>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-800/50">
            <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Institutional Identification</p>
              <p className="text-[11px] text-slate-200 font-black tracking-tight">{(typeof process !== 'undefined' && process.env.USER_EMAIL) || 'Institutional User'}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[9px] text-[#DFFF00] font-mono">ROLE: {userRole.replace('_', ' ')}</p>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-[8px] text-green-500 font-black uppercase">Verified</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-h-screen">
          {/* Global Loading Indicator (Progressive Context) */}
          <AnimatePresence>
            {isAnySyncing && (
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                className="fixed top-0 left-0 right-0 h-1 z-[100] origin-top"
              >
                <div className="absolute inset-0 bg-[#deff9a]/20 blur-[2px]" />
                <motion.div 
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                  className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[#deff9a] to-transparent shadow-[0_0_15px_#deff9a]"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <header className="px-4 py-4 lg:px-6 lg:py-4 border-b border-zinc-800 flex justify-between items-center sticky top-0 bg-black z-20">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2.5 bg-zinc-900 border border-zinc-800 text-[#DFFF00] rounded-xl shadow-lg active:scale-95 transition-all hover:bg-zinc-800"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-[#DFFF00] leading-none tracking-tight">VentureAM</h1>
                <span className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest font-black">Institutional System</span>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] leading-none mb-1">INTERNATIONAL GATEWAY</p>
              <div className="flex items-center justify-end gap-2" onClick={() => setActiveTab('gateway')}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  networkStats.operational
                  ? 'bg-[#DFFF00] shadow-[0_0_8px_#DFFF00] animate-pulse'
                  : 'bg-red-500'
                }`} />
                <p className="text-[11px] font-black text-white uppercase tracking-tight cursor-pointer">
                  {networkStats.operational ? 'CONNECTED' : 'OFFLINE'}
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 mt-1.5 pt-1.5 border-t border-white/5">
                <div className="flex flex-col">
                  <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-tighter text-right">Resource Tracks</p>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">IDX • TV • IBKR</p>
                </div>
                <Database className="w-3 h-3 text-[#DFFF00] opacity-40" />
              </div>
            </div>
          </header>

          <main className="p-4 lg:p-10 space-y-8 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={activeTab === 'home' ? 'p-0' : ''}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Mobile Overlay Sidebar - Keep for small screen menu */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] lg:hidden"
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-4/5 max-w-[320px] bg-black border-r border-slate-800 z-[70] p-6 flex flex-col lg:hidden"
              >
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-xl font-black text-[#deff9a] tracking-tight">VentureAM</h2>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Institutional System</p>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
                  {SIDEBAR_MENU.map((item) => (
                    <React.Fragment key={item.id}>
                      <button
                        onClick={() => {
                          if ('external' in item && item.external) {
                            window.open(item.path, '_blank');
                          } else {
                            setActiveTab(item.path);
                            if (item.path !== 'scanner') {
                              setActiveScannerModule(null);
                              setIsSidebarOpen(false);
                            }
                          }
                        }}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border ${
                          activeTab === item.path 
                          ? 'bg-[#deff9a]/10 border-[#deff9a]/20 text-[#deff9a]' 
                          : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/60 text-slate-400'
                        }`}
                      >
                        <item.icon className="w-5 h-5" style={{ color: item.color }} />
                        <div className="text-left flex-1">
                          <p className="text-xs font-black uppercase tracking-tight">{item.label}</p>
                          {item.provider && <p className="text-[8px] text-slate-500 font-bold uppercase">{item.provider}</p>}
                        </div>
                      </button>

                      {/* Sub-menu for Scanner Markets and Modules in Mobile Sidebar */}
                      {item.path === 'scanner' && (
                        <AnimatePresence>
                          {activeTab === 'scanner' && item.markets && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden space-y-2 ml-4 border-l border-slate-800 pl-4 py-2"
                            >
                              {item.markets.map(market => (
                                <div key={market.id} className="space-y-1">
                                  <button
                                    onClick={() => {
                                      setExpandedMarket(expandedMarket === market.id ? null : market.id);
                                      setActiveScannerMarket(market.id.toUpperCase() as any);
                                      setActiveScannerModule(null);
                                    }}
                                    className={`w-full text-left p-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between ${
                                      activeScannerMarket === market.id.toUpperCase()
                                      ? 'text-[#00ffff] bg-[#00ffff]/5'
                                      : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                  >
                                    <span>{market.label}</span>
                                    <ChevronRight className={`w-3 h-3 transition-transform ${expandedMarket === market.id ? 'rotate-90' : ''}`} />
                                  </button>
                                  
                                  <AnimatePresence>
                                    {expandedMarket === market.id && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="ml-2 border-l border-slate-800/50 pl-3 space-y-1 overflow-hidden"
                                      >
                                        {market.modules.map(module => (
                                          <button
                                            key={module}
                                            onClick={() => {
                                              setActiveScannerModule(module);
                                              setIsSidebarOpen(false);
                                            }}
                                            className={`w-full text-left p-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                                              activeScannerModule === module
                                              ? 'text-[#ff9900] bg-[#ff9900]/10'
                                              : 'text-slate-600 hover:text-slate-400'
                                            }`}
                                          >
                                            &gt; {module}
                                          </button>
                                        ))}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                    </React.Fragment>
                  ))}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
        {/* PRICE ALERTS OVERLAY */}
        <div className="fixed top-24 right-6 z-[999] w-80 space-y-3 pointer-events-none">
          <AnimatePresence mode="popLayout">
            {notifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, x: 50 }}
                className="pointer-events-auto bg-black/90 backdrop-blur-2xl border-l-[4px] border-l-[#DFFF00] border border-zinc-800 p-4 rounded-xl shadow-2xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4 bg-[#DFFF00]/5 blur-2xl rounded-full" />
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[#DFFF00]/10 rounded-lg">
                    <Bell className="w-4 h-4 text-[#DFFF00] animate-bounce" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">{notif.symbol} ALERT</span>
                      <button 
                        onClick={() => clearNotification(notif.id)}
                        className="p-1 hover:bg-zinc-800 rounded-md transition-colors"
                      >
                        <X className="w-3 h-3 text-zinc-500" />
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-bold leading-tight">
                      Price reached <span className="text-white">Rp {typeof notif.price === 'number' ? notif.price.toLocaleString('id-ID') : (notif.price || 'N/A')}</span>
                    </p>
                    <p className="text-[9px] text-[#DFFF00] font-black uppercase tracking-tighter mt-1">
                      Target: {notif.condition === 'gt' ? '>' : '<'} Rp {typeof notif.targetPrice === 'number' ? notif.targetPrice.toLocaleString('id-ID') : (notif.targetPrice || 'N/A')}
                    </p>
                  </div>
                </div>
                
                {/* Visual pulse indicator */}
                <div className="absolute bottom-0 left-0 h-0.5 bg-[#DFFF00]/30 w-full animate-pulse" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all duration-300 relative ${active ? 'text-[#DFFF00]' : 'text-slate-500 hover:text-slate-400'}`}
    >
      <motion.div
        animate={{ scale: active ? 1.1 : 1 }}
        whileTap={{ scale: 0.9 }}
      >
        {icon}
      </motion.div>
      <span className={`text-[9px] font-bold uppercase tracking-wider transition-all ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
      {active && (
        <motion.div 
          layoutId="activeTab"
          className="absolute -top-1 w-8 h-0.5 bg-[#DFFF00] rounded-full blur-[1px]" 
        />
      )}
    </button>
  );
}
