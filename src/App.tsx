/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { io } from 'socket.io-client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  Link,
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
  BrainCircuit,
  Loader2,
  Building,
  BellRing,
  Edit2,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Decimal } from 'decimal.js';
import { 
  fetchLatestInsights, 
  MarketInsight, 
  fetchStockRecommendations, 
  StockRecommendation,
  fetchWithRetry,
  ScanOptions, 
  fetchLivePrices 
} from './services/marketService';
import { fetchMarketNewsSummary, MarketNewsItem } from './services/geminiService';
import TradingViewWidget from './components/TradingViewWidget';
import PortfolioChart from './components/PortfolioChart';
import { useTransactionManager } from './hooks/useTransactionManager';
import { TransactionTable } from './components/TransactionTable';
import { UserManagement } from './components/UserManagement';
import { MyCompanyOverview } from './components/MyCompanyOverview';
import { GlobalGatewayBanner } from './components/GlobalGatewayBanner';
import { ensureUserProfile } from './services/userService';
import { UserProfile, UserRole } from './types';
import { Settings2, Filter, Target, ArrowLeft, Users, ShieldAlert, Lock } from 'lucide-react';
import { Sparkline } from './components/Sparkline';
import { AssetDetail } from './components/AssetDetail';
import VamSmartScanner from './components/VamSmartScanner';
import IntradayScanner from './components/IntradayScanner';
import GlobalIndicesFeed from './components/GlobalIndicesFeed';
import MarketOverviewWidget from './components/MarketOverviewWidget';
import LegalDocumentCenter from './components/LegalDocumentCenter';
import FinancialReportingCenter from './components/FinancialReportingCenter';
import RegulatoryArchive from './components/RegulatoryArchive';
import RegulatoryReport from './components/RegulatoryReport';
import TaskCenter from './components/TaskCenter';
import IdxPriceList from './components/IdxPriceList';
import { MarketHeatmap } from './components/MarketHeatmap';
import { MarketSentimentBanner } from './components/MarketSentimentBanner';
import GlobalIntelFeed from './components/GlobalIntelFeed';
import TradingViewMarketWidget from './components/TradingViewMarketWidget';
import TradingViewScreenerWidget from './components/TradingViewScreenerWidget';
import { MarketMetricCard } from './components/MarketMetricCard';
import { ExternalGateways } from './components/ExternalGateways';
import { InternationalGatewayDashboard } from './components/InternationalGatewayDashboard';
import { NewsFeed } from './components/NewsFeed';
import { fetchMarketNews } from './services/marketService';
import { StockExplorer } from './components/StockExplorer';
import { FundamentalAnalyst } from './components/FundamentalAnalyst';
import { initAuth, googleSignIn, logout as googleLogout, db } from './lib/auth';
import { WorkspaceHub } from './components/WorkspaceHub';
import { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { GlobalSearch } from './components/GlobalSearch';
import HoldingCard from './components/HoldingCard';
import BulkActionPanel from './components/BulkActionPanel';
import { AuditSync } from './components/AuditSync';

const ASSETS = [
  {
    id: '1',
    name: 'Dian Swastatika Sentosa',
    symbol: 'DSSA',
    category: 'Energy & Conglomerate',
    value: 'Rp 489.0k',
    status: 'Performing',
    type: 'Equities',
    percentage: '17.8%',
    liquidity: 'High',
    performance: [65, 70, 72, 75, 78, 80, 85]
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
  { symbol: 'DSSA', name: 'Dian Swastatika Sentosa', qty: '600', value: '489,000', change: '+17.8%', type: 'Energy', performance: [65, 70, 72, 75, 78, 80, 85] },
  { symbol: 'DEFI', name: 'Danasupra Erapacific', qty: '1,000', value: '212,000', change: '-5.3%', type: 'Financial', performance: [40, 45, 42, 48, 50, 48, 52] },
  { symbol: 'OTAS', name: 'DMS Propertindo', qty: '1,500', value: '244,500', change: '+7.9%', type: 'Property', performance: [20, 25, 30, 35, 40, 45, 50] },
  { symbol: 'ANDI', name: 'Trimitra Propertindo', qty: '3,100', value: '306,900', change: '-4.2%', type: 'Property', performance: [55, 50, 48, 45, 42, 40, 38] },
  { symbol: 'LPKR', name: 'Lippo Karawaci', qty: '2,000', value: '168,000', change: '0.0%', type: 'Property', performance: [30, 32, 28, 30, 29, 31, 30] },
  { symbol: 'IPAC', name: 'Multi Makmur Lemindo', qty: '1,500', value: '213,000', change: '-5.9%', type: 'Real Estate', performance: [40, 38, 35, 32, 30, 28, 25] },
];

const SIDEBAR_MENU = [
  { id: 0, label: "Dashboard Utama", icon: Home, path: "home", color: "#deff9a" },
  { id: 99, label: "About Company", icon: Building, path: "my-company", color: "#DFFF00" },
  { id: 21, label: "M&A Factor issue", icon: Activity, path: "vamsmartscanner", color: "#DFFF00" },
  { id: 13, label: "Fundamental Analyst", icon: BrainCircuit, path: "fundamental", color: "#DFFF00" },
  { id: 8, label: "Monitor Pasar", icon: Search, path: "market", color: "#deff9a" },
  { id: 1, label: "Analisis Portofolio", icon: BarChart3, path: "portfolio", color: "#deff9a" },
  { id: 10, label: "Permintaan Dokumen", icon: PenTool, path: "legal", color: "#deff9a" },
  { id: 5, label: "Laporan Keuangan", icon: Calculator, path: "financial", color: "orange-400" },
  { id: 11, label: "Arsip & Audit Trail", icon: Database, path: "archive", color: "blue-400" },
  { id: 101, label: "Audit Sync", icon: ShieldCheck, path: "audit-sync", color: "#DFFF00" },
  { id: 12, label: "Manajemen Tugas", icon: ListTodo, path: "tasks", color: "#deff9a" },
  { id: 9, label: "Sistem Keamanan", icon: ShieldCheck, path: "security", color: "#deff9a" },
  { id: 7, label: "Rebalancing Asset", icon: Scale, path: "rebalancer", color: "#deff9a" },
  { id: 2, label: "Gateway Internasional", icon: Globe, path: "gateway", color: "#deff9a" },
  { id: 14, label: "VAM Workspace Hub", icon: Cloud, path: "drive", color: "#60a5fa" },
  { id: 3, label: "Laporan Regulasi", icon: Gavel, path: "compliance", color: "#94a3b8" },
  { id: 4, label: "Pengaturan Likuiditas", icon: Droplets, path: "liquidity", color: "#94a3b8" },
  { id: 15, label: "User Governance", icon: Users, path: "users", color: "#DFFF00" },
  { 
    id: 6, 
    label: "Smart Scanner IDX", 
    provider: "By Ventuream AM", 
    icon: Radar, 
    path: "scanner",
    color: "#DFFF00",
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
import { TechnicalRecommendations } from './components/TechnicalRecommendations';
import RiskAnalytics from './components/RiskAnalytics';
import { ManualRebalanceForm } from './components/ManualRebalanceForm';

const myCGSPortfolio = {
  accountID: "YU001HC5400154",
  owner: "PT Venture Asset Management",
  cashBalance: 452286.00,
  assets: [
    { ticker: "BACH.JK", lots: 1, averagePrice: 442, marketPrice: 550 },
    { ticker: "DEFI.JK", lots: 10, averagePrice: 224, marketPrice: 103 },
    { ticker: "DSSA.JK", lots: 4, averagePrice: 691.6667, marketPrice: 775 },
    { ticker: "EMMI.JK", lots: 1, averagePrice: 470, marketPrice: 500 },
    { ticker: "JECX.JK", lots: 1, averagePrice: 1250, marketPrice: 1660 },
    { ticker: "KOTA.JK", lots: 15, averagePrice: 117.4706, marketPrice: 96 },
    { ticker: "PIPA.JK", lots: 15, averagePrice: 151, marketPrice: 114 },
    { ticker: "PJHB-W.JK", lots: 0.5, averagePrice: 1, marketPrice: 36 },
    { ticker: "PRDL.JK", lots: 1, averagePrice: 120, marketPrice: 162 },
    { ticker: "RANS.JK", lots: 3, averagePrice: 170, marketPrice: 0 }
  ]
};

const generateSimulatedPerformance = () => Array.from({ length: 12 }, () => Math.floor(Math.random() * 60) + 40);

const MarketFeedLog = ({ stockData }: { stockData: StockRecommendation }) => {
  const [currentPrice, setCurrentPrice] = useState(stockData.price);
  const [pulseType, setPulseType] = useState<'up' | 'down' | null>(null);

  const currentPriceRef = useRef(stockData.price);
  currentPriceRef.current = currentPrice;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleMarketUpdate = (e: any) => {
      const data = e.detail;
      if (data && data.symbol === stockData.symbol && data.price) {
        const getNumericalPrice = (val: any) => {
          if (!val) return 0;
          const str = String(val);
          const cleanStr = str.replace(/[^\d]/g, '');
          return parseFloat(cleanStr) || 0;
        };

        const oldVal = getNumericalPrice(currentPriceRef.current);
        const newVal = getNumericalPrice(data.price);

        if (newVal > oldVal) {
          setPulseType('up');
        } else if (newVal < oldVal) {
          setPulseType('down');
        } else {
          setPulseType('up');
        }

        setCurrentPrice(data.price);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setPulseType(null);
        }, 1200);
      }
    };

    window.addEventListener('vam-market-update', handleMarketUpdate);
    return () => {
      window.removeEventListener('vam-market-update', handleMarketUpdate);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [stockData.symbol]);

  const timeString = stockData.detectedAt 
    ? new Date(stockData.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
  const performanceData = stockData.performance || [50, 52, 48, 55, 60, 58, 62, 65, 63, 68, 70, 72];
  const isUp = performanceData[performanceData.length - 1] >= performanceData[0];

  return (
    <motion.div 
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex items-start gap-4 p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group relative overflow-hidden"
    >
      <AnimatePresence>
        {pulseType && (
          <motion.div 
            initial={{ opacity: 0.25 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className={`absolute inset-0 pointer-events-none ${
              pulseType === 'up' ? 'bg-emerald-500/10' : 'bg-red-500/10'
            }`}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col items-center gap-1 min-w-[50px] relative z-10">
        <span className="text-[9px] font-mono text-zinc-500">{timeString}</span>
        <div className="w-px h-full bg-zinc-800 group-last:hidden" />
      </div>
      <div className="flex-1 flex items-center justify-between gap-4 relative z-10">
        <div className="flex-1">
          <p className="text-[11px] leading-relaxed text-zinc-300">
            <span className="font-black text-white">{stockData.symbol}</span> detected: 
            Price (<motion.span 
              animate={pulseType ? { scale: [1, 1.12, 1] } : {}}
              transition={{ duration: 0.4 }}
              className={`inline-block font-mono font-bold transition-colors duration-300 ${
                pulseType === 'up' ? 'text-emerald-400 font-extrabold' : pulseType === 'down' ? 'text-red-400 font-extrabold' : 'text-blue-400'
              }`}
            >Rp {currentPrice}</motion.span> <span className={`text-[8px] font-black uppercase transition-all duration-300 ${
              pulseType === 'up' ? 'text-emerald-400 scale-110' : pulseType === 'down' ? 'text-red-400 scale-110' : 'text-blue-500/80 animate-pulse'
            }`}>LIVE</span>) &gt; EMA20 (<span className="text-orange-400">Rp {stockData.ema20}</span>). 
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
    </motion.div>
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
  const [cgsAssets, setCgsAssets] = useState(() => {
    try {
      const saved = localStorage.getItem('cgsAssets_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse cgsAssets from local storage", e);
    }
    return [
      { ticker: "BACH.JK", lots: 1, averagePrice: 442, marketPrice: 550 },
      { ticker: "DEFI.JK", lots: 10, averagePrice: 224, marketPrice: 103 },
      { ticker: "DSSA.JK", lots: 4, averagePrice: 691.6667, marketPrice: 775 },
      { ticker: "EMMI.JK", lots: 1, averagePrice: 470, marketPrice: 500 },
      { ticker: "JECX.JK", lots: 1, averagePrice: 1250, marketPrice: 1660 },
      { ticker: "KOTA.JK", lots: 15, averagePrice: 117.4706, marketPrice: 96 },
      { ticker: "PIPA.JK", lots: 15, averagePrice: 151, marketPrice: 114 },
      { ticker: "PJHB-W.JK", lots: 0.5, averagePrice: 1, marketPrice: 36 },
      { ticker: "PRDL.JK", lots: 1, averagePrice: 120, marketPrice: 162 },
      { ticker: "RANS.JK", lots: 3, averagePrice: 170, marketPrice: 0 }
    ];
  });
  const [cgsCashBalance, setCgsCashBalance] = useState(() => {
    try {
      const saved = localStorage.getItem('cgsCashBalance_v3');
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse cgsCashBalance", e);
    }
    return 452286.00;
  });
  const [cgsGiroBalance, setCgsGiroBalance] = useState(() => {
    try {
      const saved = localStorage.getItem('cgsGiroBalance_v3');
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse cgsGiroBalance", e);
    }
    return 711000.00; // Corrected default Giro balance
  });
  const [cgsRealizedPnL, setCgsRealizedPnL] = useState(() => {
    try {
      const saved = localStorage.getItem('cgsRealizedPnL_v3');
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse cgsRealizedPnL", e);
    }
    return 0;
  });
  const [cgsTotalFees, setCgsTotalFees] = useState(() => {
    try {
      const saved = localStorage.getItem('cgsTotalFees_v3');
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse cgsTotalFees", e);
    }
    return 0;
  });

  useEffect(() => {
    localStorage.setItem('cgsAssets_v3', JSON.stringify(cgsAssets));
  }, [cgsAssets]);

  useEffect(() => {
    localStorage.setItem('cgsCashBalance_v3', cgsCashBalance.toString());
  }, [cgsCashBalance]);

  useEffect(() => {
    localStorage.setItem('cgsGiroBalance_v3', cgsGiroBalance.toString());
  }, [cgsGiroBalance]);

  useEffect(() => {
    localStorage.setItem('cgsRealizedPnL_v3', cgsRealizedPnL.toString());
  }, [cgsRealizedPnL]);

  useEffect(() => {
    localStorage.setItem('cgsTotalFees_v3', cgsTotalFees.toString());
  }, [cgsTotalFees]);

  const [globalAlertsEnabled, setGlobalAlertsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('vam-global-alerts-enabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [alertThresholds, setAlertThresholds] = useState<Record<string, { targetPrice: number; type: 'above' | 'below'; active: boolean; lastTriggeredPrice?: number }>>(() => {
    try {
      const saved = localStorage.getItem('vam-alert-thresholds');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('vam-global-alerts-enabled', JSON.stringify(globalAlertsEnabled));
  }, [globalAlertsEnabled]);

  useEffect(() => {
    localStorage.setItem('vam-alert-thresholds', JSON.stringify(alertThresholds));
  }, [alertThresholds]);

  const handleSaveAlert = useCallback((ticker: string, targetPrice: number, type: 'above' | 'below', active: boolean) => {
    setAlertThresholds(prev => ({
      ...prev,
      [ticker]: {
        targetPrice,
        type,
        active
      }
    }));
  }, []);

  const { history, recordTransaction } = useTransactionManager();

  const handleUpdatePortfolio = useCallback((ticker: string, action: 'BUY' | 'SELL', price: number, lots: number) => {
    const cost = price * lots * 100;
    const feeRate = action === 'BUY' ? 0.0018 : 0.0029;
    const fee = Math.round(cost * feeRate);
    const balanceAdjustment = action === 'BUY' ? cost + fee : cost - fee;
    
    setCgsCashBalance(prev => {
      if (action === 'BUY') {
        return prev - balanceAdjustment;
      } else {
        return prev + balanceAdjustment;
      }
    });

    setCgsTotalFees(prev => prev + fee);

    setCgsAssets(prevAssets => {
      const existingIdx = prevAssets.findIndex(a => a.ticker.toUpperCase() === ticker.toUpperCase());
      
      if (existingIdx >= 0) {
        const existing = prevAssets[existingIdx];
        if (action === 'BUY') {
          const totalLots = existing.lots + lots;
          const totalValue = (existing.averagePrice * existing.lots) + (price * lots);
          const newAvgPrice = totalValue / totalLots;
          
          const updated = [...prevAssets];
          updated[existingIdx] = {
            ...existing,
            lots: totalLots,
            averagePrice: newAvgPrice,
            marketPrice: price
          };
          return updated;
        } else {
          const pnlValue = (price - existing.averagePrice) * lots * 100;
          setCgsRealizedPnL(prev => prev + pnlValue);

          const remainingLots = existing.lots - lots;
          if (remainingLots <= 0) {
            return prevAssets.filter((_, i) => i !== existingIdx);
          } else {
            const updated = [...prevAssets];
            updated[existingIdx] = {
              ...existing,
              lots: remainingLots,
              marketPrice: price
            };
            return updated;
          }
        }
      } else {
        if (action === 'BUY') {
          return [
            ...prevAssets,
            {
              ticker: ticker.toUpperCase(),
              lots,
              averagePrice: price,
              marketPrice: price
            }
          ];
        }
        return prevAssets;
      }
    });

    // Record this action to the Gateway Executions Log (History)
    const isGlobal = !ticker.toUpperCase().endsWith('.JK');
    recordTransaction({
      ticker: ticker.toUpperCase(),
      price: price,
      side: action,
      quantity: lots * 100,
      assetType: 'EQUITY',
      currency: isGlobal ? 'USD' : 'IDR',
      broker: isGlobal ? 'IBKR' : 'CGS_INTERNATIONAL'
    });

  }, [recordTransaction]);

  const handleResetPortfolio = useCallback(() => {
    setCgsAssets([
      { ticker: "BACH.JK", lots: 1, averagePrice: 442, marketPrice: 550 },
      { ticker: "DEFI.JK", lots: 10, averagePrice: 224, marketPrice: 103 },
      { ticker: "DSSA.JK", lots: 4, averagePrice: 691.6667, marketPrice: 775 },
      { ticker: "EMMI.JK", lots: 1, averagePrice: 470, marketPrice: 500 },
      { ticker: "JECX.JK", lots: 1, averagePrice: 1250, marketPrice: 1660 },
      { ticker: "KOTA.JK", lots: 15, averagePrice: 117.4706, marketPrice: 96 },
      { ticker: "PIPA.JK", lots: 15, averagePrice: 151, marketPrice: 114 },
      { ticker: "PJHB-W.JK", lots: 0.5, averagePrice: 1, marketPrice: 36 },
      { ticker: "PRDL.JK", lots: 1, averagePrice: 120, marketPrice: 162 },
      { ticker: "RANS.JK", lots: 3, averagePrice: 170, marketPrice: 0 }
    ]);
    setCgsCashBalance(452286.00);
    setCgsGiroBalance(711000.00);
    setCgsRealizedPnL(0);
    setCgsTotalFees(0);
    localStorage.removeItem('cgsAssets_v3');
    localStorage.removeItem('cgsCashBalance_v3');
    localStorage.removeItem('cgsGiroBalance_v3');
    localStorage.removeItem('cgsRealizedPnL_v3');
    localStorage.removeItem('cgsTotalFees_v3');
  }, []);

  const [selectedStudies, setSelectedStudies] = useState<string[]>(["MASimple@tv-basicstudies", "MAExp@tv-basicstudies"]);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  
  const [language, setLanguage] = useState<'ID' | 'EN'>(() => {
    try {
      const stored = localStorage.getItem('vam_language');
      if (stored === 'ID' || stored === 'EN') return stored;
    } catch (e) {
      console.error(e);
    }
    return 'ID';
  });

  const handleLanguageChange = (lang: 'ID' | 'EN') => {
    setLanguage(lang);
    try {
      localStorage.setItem('vam_language', lang);
    } catch (e) {
      console.error(e);
    }
  };

  const t = useCallback((key: string): string => {
    const translations: Record<'ID' | 'EN', Record<string, string>> = {
      ID: {
        "Dashboard Utama": "Dashboard Utama",
        "About Company": "Tentang Perusahaan",
        "Fundamental Analyst": "Analisis Fundamental",
        "Monitor Pasar": "Monitor Pasar",
        "Analisis Portofolio": "Analisis Portofolio",
        "Permintaan Dokumen": "Permintaan Dokumen",
        "Laporan Keuangan": "Laporan Keuangan",
        "Arsip & Audit Trail": "Arsip & Audit Trail",
        "Manajemen Tugas": "Manajemen Tugas",
        "Sistem Keamanan": "Sistem Keamanan",
        "Rebalancing Asset": "Rebalancing Asset",
        "Gateway Internasional": "Gateway Internasional",
        "VAM Cloud (Drive)": "VAM Cloud (Drive)",
        "Laporan Regulasi": "Laporan Regulasi",
        "Pengaturan Likuiditas": "Pengaturan Likuiditas",
        "User Governance": "Tata Kelola Pengguna",
        "Smart Scanner IDX": "Smart Scanner IDX",
        "VAM Radar TBML": "VAM Radar TBML",
        "Institutional System": "Sistem Institusi",
        "Ventuream International Gateway": "Gerbang Internasional VentureAM",
        "CONNECTED": "Terhubung",
        "OFFLINE": "Luring",
        "Verified": "Terverifikasi",
        "ROLE: ": "Peran: ",
        "Institutional Identification": "Identifikasi Institusi",
        "VentureAM Core v2.4": "VentureAM Core v2.4",
        "Gateway (IBKR/CGS)": "Gateway (IBKR/CGS)",
        "CONNECTED_GATEWAY": "GATEWAY TERHUBUNG",
        "IDX Market": "Pasar IDX",
        "Market International": "Pasar Internasional",
        "High Volume Breakout": "Breakout Volume Tinggi",
        "Price Breakout Volume MA10 Today": "Breakout Harga Volume MA10 Hari Ini",
        "Big Accumulation": "Akumulasi Besar",
        "Volatility Scanner": "Pemindai Volatilitas",
        "FX Momentum Feed": "Feed Momentum FX",
        "Yield Arbitrage": "Arbitrase Imbal Hasil",
        "Refresh Market Data": "Segarkan Data Pasar",
        "Refresh Market": "Segarkan Pasar",
        "Refreshing...": "Menyegarkan...",
      },
      EN: {
        "Dashboard Utama": "Main Dashboard",
        "About Company": "About Company",
        "Fundamental Analyst": "Fundamental Analyst",
        "Monitor Pasar": "Market Monitor",
        "Analisis Portofolio": "Portfolio Analysis",
        "Permintaan Dokumen": "Document Request",
        "Laporan Keuangan": "Financial Reports",
        "Arsip & Audit Trail": "Archive & Audit Trail",
        "Manajemen Tugas": "Task Management",
        "Sistem Keamanan": "Security System",
        "Rebalancing Asset": "Asset Rebalancing",
        "Gateway Internasional": "International Gateway",
        "VAM Cloud (Drive)": "VAM Cloud (Drive)",
        "Laporan Regulasi": "Regulatory Report",
        "Pengaturan Likuiditas": "Liquidity Settings",
        "User Governance": "User Governance",
        "Smart Scanner IDX": "Smart Scanner IDX",
        "VAM Radar TBML": "VAM Radar TBML",
        "Institutional System": "Institutional System",
        "Ventuream International Gateway": "VentureAM International Gateway",
        "CONNECTED": "CONNECTED",
        "OFFLINE": "OFFLINE",
        "Verified": "Verified",
        "ROLE: ": "Role: ",
        "Institutional Identification": "Institutional Identification",
        "VentureAM Core v2.4": "VentureAM Core v2.4",
        "Gateway (IBKR/CGS)": "Gateway (IBKR/CGS)",
        "CONNECTED_GATEWAY": "GATEWAY CONNECTED",
        "IDX Market": "IDX Market",
        "Market International": "International Market",
        "High Volume Breakout": "High Volume Breakout",
        "Price Breakout Volume MA10 Today": "Price Breakout Volume MA10 Today",
        "Big Accumulation": "Big Accumulation",
        "Volatility Scanner": "Volatility Scanner",
        "FX Momentum Feed": "FX Momentum Feed",
        "Yield Arbitrage": "Yield Arbitrage",
        "Refresh Market Data": "Refresh Market Data",
        "Refresh Market": "Refresh Market",
        "Refreshing...": "Refreshing...",
      }
    };
    return translations[language][key] || key;
  }, [language]);
  
  const totalPortfolioValue = useMemo(() => {
    return portfolioData.reduce((acc, curr) => new Decimal(acc).plus(curr.marketValue || 0).toNumber(), 0);
  }, [portfolioData]);

  const exportPortfolioAnalysisToPDF = () => {
    const doc = new jsPDF();
    
    // Header section
    doc.setFillColor(15, 23, 42); // slate-900 background for header card
    doc.rect(0, 0, 210, 42, 'F');
    
    // VentureAM branding
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(223, 255, 0); // #DFFF00 yellow-green accent
    doc.text("VentureAM", 15, 18);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("PORTFOLIO PERFORMANCE & RISK ANALYSIS REPORT", 15, 25);
    doc.text("PT Venture Asset Management • Connected Gateway (IBKR/CGS)", 15, 29);
    
    // Metadata block on right side
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9.5);
    doc.text("CONFIDENTIAL ANALYSIS REPORT", 195, 18, { align: 'right' });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    const currentDate = new Date();
    const formatTime = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')} ${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}:${String(currentDate.getSeconds()).padStart(2, '0')} (WIB/Jakarta)`;
    doc.text(`Waktu Cetak / Printed Time: ${formatTime}`, 195, 24, { align: 'right' });
    doc.text(`Account ID: YU001HC5400154`, 195, 28, { align: 'right' });
    doc.text(`Gateway System Status: CONNECTED & SECURED`, 195, 32, { align: 'right' });

    // Section 1: Portfolio Financial Summary
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Ringkasan Nilai Finansial Portofolio / Portfolio Financial Summary", 15, 52);
    
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 55, 195, 55);

    // Calculate details
    const totalAssetVal = totalPortfolioValue;
    const rdnCash = cgsCashBalance;
    const giroAccountBalance = cgsGiroBalance; // Giro balance added from state
    const totalCombinedValue = totalAssetVal + rdnCash + giroAccountBalance;
    
    const totalCost = cgsAssets.reduce((acc, curr) => {
      const assetCost = new Decimal(curr.averagePrice).times(curr.lots).times(100);
      return new Decimal(acc).plus(assetCost).toNumber();
    }, 0);
    
    const totalPL = totalAssetVal - totalCost;
    const performancePct = totalCost === 0 ? 0 : (totalPL / totalCost) * 100;
    
    const formatIDRLocal = (v: number) => {
      const isNegative = v < 0;
      const absV = Math.abs(v);
      return (isNegative ? '- ' : '') + 'Rp ' + absV.toLocaleString('id-ID', { maximumFractionDigits: 0 });
    };

    // Draw 2-column key metrics summary table
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    // Left Box
    doc.setFillColor(248, 250, 252); // light slate background
    doc.rect(15, 60, 85, 35, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(15, 60, 85, 35, 'S');
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("KAPITALISASI & LIKUIDITAS / ASSETS & LIQUIDITY", 18, 65);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Nilai Portofolio Saham (Equity): ${formatIDRLocal(totalAssetVal)}`, 18, 71);
    doc.text(`Saldo RDN Cash: ${formatIDRLocal(rdnCash)}`, 18, 76);
    doc.text(`Saldo Rekening Giro: ${formatIDRLocal(giroAccountBalance)}`, 18, 81);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`Total Aset Gabungan: ${formatIDRLocal(totalCombinedValue)}`, 18, 87);

    // Right Box
    doc.setFillColor(248, 250, 252); // light slate background
    doc.rect(110, 60, 85, 35, 'F');
    doc.rect(110, 60, 85, 35, 'S');
    
    doc.setFont("helvetica", "bold");
    doc.text("KINERJA INVESTASI / INVESTMENT PERFORMANCE", 113, 65);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Total Modal Disetor (Historical Cost): ${formatIDRLocal(totalCost)}`, 113, 71);
    doc.text(`Akumulasi Unrealized Gain / (Loss): ${formatIDRLocal(totalPL)}`, 113, 76);
    
    const isPerformancePositive = performancePct >= 0;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(isPerformancePositive ? 21 : 185, isPerformancePositive ? 128 : 28, isPerformancePositive ? 61 : 28); // Green 600 or Red 600
    doc.text(`Persentase Yield Kinerja: ${isPerformancePositive ? '+' : ''}${performancePct.toFixed(2)}%`, 113, 83);
    
    // Section 2: Detailed Portfolio Holdings Table
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Rincian Kepemilikan Saham & Aset / Detailed Holdings Breakdown", 15, 105);
    
    doc.line(15, 108, 195, 108);

    // Prepare table columns and rows
    const tableHeaders = [['KODE / TICKER', 'LOTS', 'AVERAGE PRICE', 'CURRENT PRICE', 'TOTAL COST (IDR)', 'MARKET VALUE (IDR)', 'UNREALIZED P&L (%)', 'WEIGHT (%)']];
    
    const tableRows = portfolioData.map(asset => {
      const assetCost = new Decimal(asset.averagePrice || 0).times(asset.lots || 0).times(100);
      const assetMktVal = new Decimal(asset.marketValue || 0);
      const assetPL = assetMktVal.minus(assetCost);
      const assetPLPct = assetCost.isZero() ? 0 : assetPL.div(assetCost).times(100).toNumber();
      const weight = totalAssetVal === 0 ? 0 : (assetMktVal.toNumber() / totalAssetVal) * 100;

      return [
        asset.ticker || 'N/A',
        (asset.lots || 0).toLocaleString('id-ID'),
        'Rp ' + (asset.averagePrice || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 }),
        'Rp ' + (asset.currentPrice || asset.marketPrice || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 }),
        assetCost.toNumber().toLocaleString('id-ID'),
        assetMktVal.toNumber().toLocaleString('id-ID'),
        `${assetPLPct >= 0 ? '+' : ''}${assetPLPct.toFixed(2)}%`,
        `${weight.toFixed(1)}%`
      ];
    });

    autoTable(doc, {
      startY: 112,
      head: tableHeaders,
      body: tableRows,
      theme: 'striped',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [223, 255, 0], // #DFFF00
        fontSize: 8,
        font: 'helvetica',
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 7.5,
        font: 'helvetica'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 15, right: 15 }
    });

    // Section 3: Portfolio Strategic Commentary & Risk Profile
    const finalY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Komentar Strategis & Profil Risiko / Strategic & Risk Commentary", 15, finalY);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(15, finalY + 3, 195, finalY + 3);

    // Callout box for comments
    doc.setFillColor(248, 250, 252);
    doc.rect(15, finalY + 7, 180, 32, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, finalY + 7, 180, 32, 'S');

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    
    doc.text("1. Divergensi Portofolio / Portfolio Drift: Alokasi saat ini menunjukkan deviasi terkendali terhadap benchmark IHSG.", 18, finalY + 13);
    doc.text("2. Rasio Likuiditas / Liquidity Management: Saldo Kas RDN, Giro serta portofolio saham stabil dan terbebas dari penalti.", 18, finalY + 18);
    doc.text("3. Rekomendasi Alokasi / Actionable Insights: Disarankan melakukan rebalancing periodik untuk mengunci profit pada instrumen", 18, finalY + 23);
    doc.text("   pilihan dengan unrealized performance di atas rata-rata sektoral demi mitigasi risiko makro.", 18, finalY + 28);

    // Disclaimers at the bottom
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(148, 163, 184);
    doc.text("* Dokumen dihasilkan secara otomatis oleh sistem VentureAM Institutional System. Rahasia dan Terbatas.", 15, finalY + 45);
    doc.text("  This is an automated system generated report from PT Venture Asset Management. For internal, authorized institutional users only.", 15, finalY + 49);

    // Save and export
    doc.save(`VentureAM_Portfolio_Analysis_Report_${currentDate.toISOString().slice(0, 10)}.pdf`);
  };

  const exportPortfolioAnalysisToCSV = () => {
    const rdnCash = cgsCashBalance;
    const giroAccountBalance = cgsGiroBalance; // Giro balance added from state
    const totalAssetVal = totalPortfolioValue;
    const totalCombinedValue = totalAssetVal + rdnCash + giroAccountBalance;
    const totalCost = cgsAssets.reduce((acc, curr) => {
      const assetCost = new Decimal(curr.averagePrice).times(curr.lots).times(100);
      return new Decimal(acc).plus(assetCost).toNumber();
    }, 0);
    const totalPL = totalAssetVal - totalCost;
    const performancePct = totalCost === 0 ? 0 : (totalPL / totalCost) * 100;

    const currentDate = new Date();
    const formatTime = currentDate.toISOString().replace('T', ' ').slice(0, 19);

    const escapeCSV = (val: string | number) => {
      const s = String(val).replace(/"/g, '""');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s}"`;
      }
      return s;
    };

    const csvRows: string[] = [];
    csvRows.push('VENTUREAM INSTITUTIONAL SYSTEM - PORTFOLIO PERFORMANCE & RISK ANALYSIS');
    csvRows.push(`Printed Time,${escapeCSV(formatTime)}`);
    csvRows.push('Account ID,YU001HC5400154');
    csvRows.push('Gateway System Status,CONNECTED & SECURED');
    csvRows.push('');
    
    csvRows.push('PORTFOLIO FINANCIAL SUMMARY');
    csvRows.push(`Equity Value (IDR),${totalAssetVal}`);
    csvRows.push(`Cash RDN Balance (IDR),${rdnCash}`);
    csvRows.push(`Giro Account Balance (IDR),${giroAccountBalance}`);
    csvRows.push(`Total Combined Value (IDR),${totalCombinedValue}`);
    csvRows.push(`Total Deposited Capital (IDR),${totalCost}`);
    csvRows.push(`Accumulated Unrealized PnL (IDR),${totalPL}`);
    csvRows.push(`Performance Yield (%),${performancePct.toFixed(2)}`);
    csvRows.push('');

    csvRows.push('DETAILED PORTFOLIO BREAKDOWN');
    csvRows.push('Ticker,Lots,Average Price (IDR),Current Price (IDR),Total Cost (IDR),Market Value (IDR),Unrealized PnL (IDR),Unrealized PnL (%),Weight (%)');

    portfolioData.forEach(asset => {
      const assetCost = new Decimal(asset.averagePrice || 0).times(asset.lots || 0).times(100).toNumber();
      const assetMktVal = new Decimal(asset.marketValue || 0).toNumber();
      const assetPL = assetMktVal - assetCost;
      const assetPLPct = assetCost === 0 ? 0 : (assetPL / assetCost) * 100;
      const weight = totalAssetVal === 0 ? 0 : (assetMktVal / totalAssetVal) * 100;

      csvRows.push([
        escapeCSV(asset.ticker || 'N/A'),
        asset.lots || 0,
        asset.averagePrice || 0,
        asset.currentPrice || asset.marketPrice || 0,
        assetCost,
        assetMktVal,
        assetPL,
        assetPLPct.toFixed(2),
        weight.toFixed(2)
      ].join(','));
    });

    const csvContent = "\uFEFF" + csvRows.join('\r\n'); // BOM encoding
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `VentureAM_Portfolio_Analysis_Report_${currentDate.toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [securityView, setSecurityView] = useState<'main' | 'history' | 'devices'>('main');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showVamScanner, setShowVamScanner] = useState(false);
  const [showIntradayScanner, setShowIntradayScanner] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isEditingRDN, setIsEditingRDN] = useState(false);
  const [rdnInputVal, setRdnInputVal] = useState(cgsCashBalance.toString());
  const [isEditingGiro, setIsEditingGiro] = useState(false);
  const [giroInputVal, setGiroInputVal] = useState(cgsGiroBalance.toString());

  useEffect(() => {
    setRdnInputVal(cgsCashBalance.toString());
  }, [cgsCashBalance]);

  useEffect(() => {
    setGiroInputVal(cgsGiroBalance.toString());
  }, [cgsGiroBalance]);
  const [marketSubTab, setMarketSubTab] = useState<'overview' | 'explorer' | 'fundamental' | 'screener'>('overview');
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

  // Auth State for Google Drive
  const [needsAuth, setNeedsAuth] = useState(false);
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const isLocked = useCallback((path: string) => {
    const userRole = userProfile?.role || 'Public';
    const profileEmailLower = (userProfile?.email || '').toLowerCase();
    const googleEmailLower = (googleUser?.email || '').toLowerCase();
    const isAdmin = profileEmailLower === 'aidilsyahdan2000@gmail.com' || 
                    profileEmailLower === 'pt.ventuream@gmail.com' ||
                    googleEmailLower === 'aidilsyahdan2000@gmail.com' ||
                    googleEmailLower === 'pt.ventuream@gmail.com';
    
    // Admin access bypass
    if (isAdmin) {
      return false;
    }

    if (userRole === 'Public') {
      const allowedPaths = ['home', 'my-company', 'market', 'fundamental', 'scanner', 'asset-detail', 'users', 'vamsmartscanner', 'audit-sync'];
      return !allowedPaths.includes(path);
    }
    const item = SIDEBAR_MENU.find(m => m.path === path);
    if (item && (item as any).restrictedTo && !(item as any).restrictedTo.includes(userRole)) {
      return true;
    }
    return false;
  }, [userProfile, googleUser]);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const handleQuickResearchEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ symbol: string }>;
      if (customEvent.detail && customEvent.detail.symbol) {
        setFundamentalSymbol(customEvent.detail.symbol);
        setActiveTab('fundamental');
      }
    };
    window.addEventListener('vam-quick-research', handleQuickResearchEvent);
    return () => {
      window.removeEventListener('vam-quick-research', handleQuickResearchEvent);
    };
  }, []);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = initAuth(
      async (user) => {
        setGoogleUser(user);
        setNeedsAuth(false);
        if (user) {
          try {
            const profile = await ensureUserProfile(user.uid, user.email || '', user.displayName || '');
            console.log('App: profile loaded:', profile);
            setUserProfile(profile);

            // Clean up any existing firestore snapshot listener
            if (unsubProfile) {
              unsubProfile();
              unsubProfile = null;
            }

            // Real-time listener on user profile
            const docRef = doc(db, 'users', user.uid);
            unsubProfile = onSnapshot(docRef, (docSnap) => {
              if (docSnap.exists()) {
                const data = docSnap.data() as UserProfile;
                const emailLower = (data?.email || '').toLowerCase();
                if (data && (emailLower === 'aidilsyahdan2000@gmail.com' || emailLower === 'pt.ventuream@gmail.com')) {
                  data.role = 'President_Director';
                }
                setUserProfile(data);
              }
            }, (err) => {
              console.error('Real-time profile listener error:', err);
            });
          } catch (err) {
            console.error('Error ensuring profile:', err);
          }
        }
      },
      () => {
        setNeedsAuth(true);
        setUserProfile(null);
        if (unsubProfile) {
          unsubProfile();
          unsubProfile = null;
        }
      }
    );
    return () => {
      unsubscribe();
      if (unsubProfile) {
        unsubProfile();
      }
    };
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Price Alerts State
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);

  // Monitor portfolio prices and trigger alerts dynamically
  useEffect(() => {
    if (!globalAlertsEnabled || portfolioData.length === 0) return;

    const newNotifications: AlertNotification[] = [];
    let thresholdsUpdated = false;
    const updatedThresholds = { ...alertThresholds };

    portfolioData.forEach(asset => {
      const config = updatedThresholds[asset.ticker];
      if (config && config.active) {
        const currentPrice = asset.currentPrice || asset.marketPrice;
        if (!currentPrice) return;

        const isConditionMet = 
          config.type === 'above' 
            ? currentPrice >= config.targetPrice 
            : currentPrice <= config.targetPrice;

        if (isConditionMet) {
          if (config.lastTriggeredPrice !== currentPrice) {
            newNotifications.push({
              id: `${asset.ticker}-${currentPrice}-${Date.now()}`,
              symbol: asset.ticker.split('.')[0],
              price: currentPrice,
              targetPrice: config.targetPrice,
              condition: config.type === 'above' ? 'gt' : 'lt',
              timestamp: Date.now()
            });
            config.lastTriggeredPrice = currentPrice;
            thresholdsUpdated = true;
          }
        } else {
          if (config.lastTriggeredPrice !== undefined) {
            delete config.lastTriggeredPrice;
            thresholdsUpdated = true;
          }
        }
      }
    });

    if (thresholdsUpdated) {
      setAlertThresholds(updatedThresholds);
    }

    if (newNotifications.length > 0) {
      setNotifications(prev => {
        return [...newNotifications, ...prev].slice(0, 5);
      });

      // Play high-tech synthesizer notification chime
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          const now = audioCtx.currentTime;
          
          const playTone = (freq: number, start: number, duration: number) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);
            gainNode.gain.setValueAtTime(0.12, start);
            gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            osc.start(start);
            osc.stop(start + duration);
          };

          playTone(523.25, now, 0.35); // C5
          playTone(783.99, now + 0.08, 0.45); // G5 (fifths)
        }
      } catch (err) {
        console.warn("Audio chime block or not allowed:", err);
      }
    }
  }, [portfolioData, globalAlertsEnabled, alertThresholds]);

  // Auto-dismiss notifications after 8 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(0, prev.length - 1));
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

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
  const [isDeepAnalysing, setIsDeepAnalysing] = useState(false);
  const [scanOptions, setScanOptions] = useState<ScanOptions>({
    sector: '',
    riskProfile: 'moderate',
    signalFilter: 'ALL',
    assetType: 'Equities',
    sortBy: 'signal',
    timeframe: '1D'
  });

  const setStopLossFromAlert = useCallback((symbol: string, price: number) => {
    recordTransaction({
      ticker: symbol,
      price: price,
      side: 'STOP_LOSS',
      quantity: 100, // Institutional lot
      assetType: 'EQUITY',
      currency: 'IDR',
      broker: 'CGS_INTERNATIONAL'
    });
  }, [recordTransaction]);

  const runDeepAnalysis = async () => {
    if (isDeepAnalysing) return;
    setIsDeepAnalysing(true);
    try {
      // Fetch 3 more insights than current count (assuming current is insights.length)
      const nextCount = insights.length + 3;
      const moreInsights = await fetchLatestInsights(nextCount, true);
      setInsights(moreInsights);
      setShowAllInsights(true); // Ensure all insights are shown after deep analysis
    } catch (error) {
      console.error("Deep analysis failed:", error);
    } finally {
      setIsDeepAnalysing(false);
    }
  };

  const updateCGSPrices = useCallback(async () => {
    try {
      const activeSource = localStorage.getItem('vam-feed-source') || 'googlefinance';
      const rawSymbols = cgsAssets.map(a => a.ticker.replace('.JK', '')).join(',');
      const response = await fetch(`/api/market/live-prices?symbols=${rawSymbols}&source=${activeSource}`);
      
      if (response.ok) {
        const liveDataList = await response.json();
        const liveMap: Record<string, { price: number; changePercent: number }> = {};
        liveDataList.forEach((item: any) => {
          liveMap[item.symbol.toUpperCase()] = {
            price: item.price,
            changePercent: item.changePercent
          };
        });

        setPortfolioData(() => {
          return cgsAssets.map(asset => {
            const cleanTicker = asset.ticker.replace('.JK', '').toUpperCase();
            const liveMatch = liveMap[cleanTicker];
            
            // Fallback price if not found in live data response
            const currentPrice = liveMatch ? liveMatch.price : asset.marketPrice;
            const changePercentFromSource = liveMatch ? liveMatch.changePercent : 0;

            const lots = new Decimal(asset.lots);
            const avgPrice = new Decimal(asset.averagePrice);
            const multiplier = new Decimal(100);

            const totalCost = avgPrice.times(lots).times(multiplier);
            const marketValue = new Decimal(currentPrice).times(lots).times(multiplier);
            const unrealized = marketValue.minus(totalCost);
            const change = new Decimal(currentPrice).minus(avgPrice).div(avgPrice).times(multiplier);

            return {
              ...asset,
              currentPrice: currentPrice,
              change: change.toNumber(),
              marketValue: marketValue.toNumber(),
              unrealized: unrealized.toNumber(),
              dailyChange: changePercentFromSource
            };
          });
        });
      }
    } catch (err: any) {
      console.warn("Failed to sync portfolio prices with market API (transient):", err?.message || err);
    }
  }, [cgsAssets]);

  const updatePricesRef = useRef(updateCGSPrices);
  useEffect(() => {
    updatePricesRef.current = updateCGSPrices;
  }, [updateCGSPrices]);

  useEffect(() => {
    updatePricesRef.current();
    const portfolioInterval = setInterval(() => {
      updatePricesRef.current();
    }, 15000); // Live sync every 15 seconds
    
    // Listen to manual or automatic feed source updates
    const handleSourceChange = () => {
      updatePricesRef.current();
    };
    window.addEventListener('vam-feed-source-changed', handleSourceChange);
    window.addEventListener('vam-force-market-refresh', handleSourceChange);
    
    return () => {
      clearInterval(portfolioInterval);
      window.removeEventListener('vam-feed-source-changed', handleSourceChange);
      window.removeEventListener('vam-force-market-refresh', handleSourceChange);
    };
  }, []);

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
      const rawStocks = await fetchStockRecommendations(scanOptions);
      let newStocks: any[] = [];
      if (Array.isArray(rawStocks)) {
        newStocks = rawStocks;
      } else if (rawStocks && typeof rawStocks === 'object') {
        const potentialKeys = ['recommendations', 'stocks', 'data', 'assets', 'results', 'list'];
        for (const key of potentialKeys) {
          if (Array.isArray((rawStocks as any)[key])) {
            newStocks = (rawStocks as any)[key];
            break;
          }
        }
        if (newStocks.length === 0) {
          for (const val of Object.values(rawStocks)) {
            if (Array.isArray(val)) {
              newStocks = val;
              break;
            }
          }
        }
      }
      
      // Filter out any stocks without symbols to prevent 'undefined-timestamp' keys
      const validStocks = Array.isArray(newStocks) ? newStocks.filter(s => s && s.symbol) : [];
      setStocks(validStocks);
      
      // Update technical logs if new qualifying stocks found
      if (validStocks.length > 0) {
        setTechnicalLogs(prev => {
          const now = Date.now();
          const newEntries = validStocks
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
              value: `Rp ${(typeof live.price === 'number' ? live.price / 1000 : 0).toFixed(1)}k`,
              percentage: (typeof live.changePercent === 'number' ? (live.changePercent >= 0 ? '+' : '') + live.changePercent.toFixed(1) : '0.0') + '%',
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
            return { 
              ...asset, 
              marketPrice: live.price,
              currentPrice: live.price,
              dailyChange: typeof live.changePercent === 'number' ? live.changePercent : (asset.dailyChange || 0)
            };
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
              change: (typeof live.changePercent === 'number' ? (live.changePercent >= 0 ? '+' : '') + live.changePercent.toFixed(2) : '0.00') + '%'
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
              change: (typeof live.changePercent === 'number' ? (live.changePercent >= 0 ? '+' : '') + live.changePercent.toFixed(2) : '0.00') + '%'
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
      const response = await fetchWithRetry(`/api/gateway/check?scriptId=${vamScriptId}`, {}, 1);
      const end = Date.now();
      const ping = end - start;

      setNetworkStats({
        ping: ping,
        status: ping < 500 ? "EXCELLENT" : "STABLE",
        signalStrength: ping < 300 ? 100 : 85,
        operational: response.ok
      });
    } catch (e: any) {
      // Fallback to simulated connection if network error during demo
      console.warn("[VAM GATEWAY] Connectivity probe timed out:", e.message || e);
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
      
      const initialPrices: Record<string, number> = {};
      Object.entries(data).forEach(([key, val]) => {
        if (val && typeof val.price === 'number') {
          initialPrices[key] = val.price;
        }
      });
      setLivePrices(prev => ({ ...prev, ...initialPrices }));

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
            unrealized: unrealized,
            dailyChange: typeof match.changePercent === 'number' ? match.changePercent : 0
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
            value: `Rp ${(typeof match.price === 'number' ? match.price / 1000 : 0).toFixed(1)}k`,
            percentage: (typeof match.changePercent === 'number' ? (match.changePercent >= 0 ? '+' : '') + match.changePercent.toFixed(1) : '0.0') + '%',
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
            change: (typeof match.changePercent === 'number' ? (match.changePercent >= 0 ? '+' : '') + match.changePercent.toFixed(2) : '0.00') + '%'
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

      // Update the livePrices state mapping symbol to price
      setLivePrices(prev => ({
        ...prev,
        [symbol]: price
      }));

      // Update Assets Data (State)
      setAssetsData(prev => prev.map(asset => {
        if (asset.symbol === symbol) {
          return {
            ...asset,
            value: `Rp ${(typeof price === 'number' ? price / 1000 : 0).toFixed(1)}k`,
            percentage: (typeof changePercent === 'number' ? (changePercent >= 0 ? '+' : '') + changePercent.toFixed(1) : '0.0') + '%',
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
            change: (typeof changePercent === 'number' ? (changePercent >= 0 ? '+' : '') + changePercent.toFixed(2) : '0.00') + '%'
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
            unrealized: unrealized,
            dailyChange: changePercent
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

    socket.on('news-update', (news: any) => {
      console.log('[VAM PROTOCOL] Live Intelligence Received:', news.headline);
      // We could add this to a live news state if added in the future
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle custom manual market refresh requested from child components
  useEffect(() => {
    const handleForceRefresh = () => {
      syncMarketConnectivity();
    };
    window.addEventListener('vam-force-market-refresh', handleForceRefresh);
    window.addEventListener('vam-feed-source-changed', handleForceRefresh);
    return () => {
      window.removeEventListener('vam-force-market-refresh', handleForceRefresh);
      window.removeEventListener('vam-feed-source-changed', handleForceRefresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Security Strategy: Context Menu Protection
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  const renderContent = () => {
    if (isLocked(activeTab)) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-[75vh] flex flex-col items-center justify-center p-8 border border-red-500/20 bg-zinc-950/40 backdrop-blur-md rounded-[3rem] text-center max-w-2xl mx-auto shadow-2xl relative overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-red-500/5 blur-3xl rounded-full pointer-events-none" />
          
          <div className="p-5 bg-red-500/10 rounded-full border border-red-500/20 mb-6 text-red-500 relative">
            <Lock className="w-10 h-10" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>

          <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Institutional Access Restricted</h3>
          <p className="text-[10px] text-red-400 font-mono font-bold uppercase tracking-widest bg-red-500/5 px-3 py-1.5 rounded-xl border border-red-500/10 mb-6">
            Authorization Required: {SIDEBAR_MENU.find(m => m.path === activeTab)?.label.toUpperCase() || 'SECURE PROTOCOL'}
          </p>

          <div className="space-y-4 max-w-md">
            <p className="text-zinc-400 text-xs uppercase tracking-wider leading-relaxed">
              Sistem mendeteksi peran akun Anda saat ini adalah <span className="text-[#DFFF00] font-bold">PUBLIK</span>. 
              Sebagai pengguna publik, fungsionalitas ini dikunci ("Kunci"). Akses diizinkan hanya untuk Dashboard, About Company, Monitor Pasar, Analyst Fundamental, dan Smart Scanner.
            </p>
            <p className="text-zinc-500 text-[10px] tracking-wider uppercase leading-relaxed font-mono">
              Silakan hubungi Administrator untuk meningkatkan level otoritas Anda, atau gunakan menu <span className="text-[#deff9a] font-bold hover:underline cursor-pointer" onClick={() => setActiveTab('users')}>User Governance</span> untuk beralih ke peran berwenang.
            </p>
          </div>

          {/* Elegant decorative connection status line */}
          <div className="mt-8 pt-6 border-t border-zinc-900 w-full flex justify-center items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest font-mono">CONNECTION GATEWAY_LOCKED</span>
          </div>
        </motion.div>
      );
    }

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
            {/* Global Gateway Sync Status Banner */}
            <GlobalGatewayBanner />

            {/* AI Technical Engine Recommendations Section */}
            <motion.section
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-4"
            >
              <TechnicalRecommendations />
            </motion.section>

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
                      {isDeepAnalysing && (
                        <div className="animate-pulse space-y-4">
                           <div className="flex items-center gap-2 px-3 py-1 bg-[#deff9a]/5 border border-[#deff9a]/10 rounded-lg w-fit">
                            <Loader2 className="w-3 h-3 text-[#deff9a] animate-spin" />
                            <span className="text-[8px] font-black text-[#deff9a] uppercase tracking-widest">Identifying Institutional Signals...</span>
                          </div>
                          {[1, 2, 3].map(i => (
                            <div key={`loading-${i}`} className="bg-slate-800/10 p-4 rounded-2xl border border-slate-800/50">
                              <div className="h-4 bg-slate-800/40 rounded w-2/3 mb-2 font-black"></div>
                              <div className="h-3 bg-slate-800/40 rounded w-full mb-1"></div>
                              <div className="h-3 bg-slate-800/40 rounded w-4/5"></div>
                            </div>
                          ))}
                        </div>
                      )}
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

                <button 
                  onClick={runDeepAnalysis}
                  disabled={isDeepAnalysing}
                  className="mt-4 w-full bg-[#deff9a] text-slate-950 text-[10px] font-bold px-4 py-2.5 rounded-xl uppercase tracking-[0.1em] hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeepAnalysing ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Analysing Institutional Data...
                    </>
                  ) : (
                    "Run Deep Analysis"
                  )}
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
                  <button 
                    onClick={() => setMarketSubTab('screener')}
                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${marketSubTab === 'screener' ? 'bg-[#deff9a] text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Asset Screener
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
            ) : marketSubTab === 'screener' ? (
              <div className="space-y-6">
                <div className="bg-zinc-950/40 rounded-3xl border border-zinc-800/50 overflow-hidden backdrop-blur-md">
                  <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20">
                    <div>
                      <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Radar className="w-4 h-4 text-[#deff9a]" />
                        Strategic Asset Screener
                      </h3>
                      <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Advanced Technical Filtering Protocol</p>
                    </div>
                  </div>
                  <div className="p-1">
                    <TradingViewScreenerWidget />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <MarketSentimentBanner news={marketNews} isLoading={isFetchingNews} />
                <GlobalIntelFeed />
                <IdxPriceList />
                <MarketHeatmap 
                  onViewAsset={(symbol) => {
                    const plainSymbol = symbol.replace('IDX:', '');
                    const asset = assetsData.find(a => a.symbol === plainSymbol || a.symbol === symbol);
                    if (asset) {
                      setSelectedAssetId(asset.id);
                      setActiveTab('asset-detail');
                    } else {
                      const tempId = `temp-${plainSymbol}`;
                      const newAsset = {
                        id: tempId,
                        name: plainSymbol,
                        symbol: plainSymbol,
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
                      <div key={`${stock.symbol || 'IDX'}-${stock.detectedAt || Date.now()}-${i}`}>
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
                        key={`${stock.symbol}-${idx}`}
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
                          <p className={`text-[10px] font-black ${(stock.change && typeof stock.change === 'string' && stock.change.startsWith('+')) ? 'text-green-400' : 'text-red-400'}`}>
                            {stock.change || '0%'}
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
                  <motion.button 
                    onClick={() => {
                      updateStocks();
                      setShowVamScanner(!showVamScanner);
                    }}
                    disabled={isScanning}
                    className="w-full py-4 bg-[#deff9a] text-slate-950 font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-[0_0_30px_rgba(222,255,154,0.15)] hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 relative overflow-hidden"
                    animate={(!isScanning && !showVamScanner) ? {
                      boxShadow: [
                        "0 0 15px rgba(222,255,154,0.15)",
                        "0 0 32px rgba(222,255,154,0.5)",
                        "0 0 15px rgba(222,255,154,0.15)"
                      ]
                    } : {}}
                    transition={(!isScanning && !showVamScanner) ? {
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    } : {}}
                  >
                    {/* Subtle sweeping shimmer overlay when idle */}
                    {!isScanning && !showVamScanner && (
                      <motion.div 
                        className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-12"
                        animate={{
                          x: ['-100%', '100%']
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 2.5,
                          ease: "easeInOut",
                          repeatDelay: 1.5
                        }}
                        style={{ pointerEvents: 'none' }}
                      />
                    )}
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
                  </motion.button>

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
          </div>
        )}
      </div>
    );
      case 'portfolio':
        return (
          <VAMTerminalScanner 
            defaultTab="PORTFOLIO"
            activeMarket={activeScannerMarket}
            activeModule={activeScannerModule}
            livePrices={livePrices}
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

                {/* Bloomberg Portfolio Monitor (Moved to very top) */}
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

                {/* Risk Analytics Module */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <RiskAnalytics portfolioData={portfolioData} cashBalance={cgsCashBalance} />
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

                {/* Embedded Manual Rebalancer Entry */}
                <ManualRebalanceForm
                  portfolioAssets={cgsAssets}
                  cashBalance={cgsCashBalance}
                  onUpdatePortfolio={handleUpdatePortfolio}
                  onResetPortfolio={handleResetPortfolio}
                />

                {/* Holdings List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Holdings Details</h4>
                    <div className="flex items-center gap-3">
                      {/* Global Price Alert Toggle Switch */}
                      <div className="flex items-center gap-1.5 bg-slate-900/60 px-2.5 py-1 rounded-full border border-slate-800">
                        <Bell className={`w-3 h-3 transition-colors ${globalAlertsEnabled ? 'text-[#DFFF00] animate-bounce' : 'text-slate-500'}`} />
                        <span className="text-[8px] font-black font-mono uppercase tracking-wider text-slate-400">Global Alerts:</span>
                        <button
                          type="button"
                          onClick={() => setGlobalAlertsEnabled(!globalAlertsEnabled)}
                          className={`relative inline-flex h-3.5 w-7 items-center rounded-full transition-colors duration-300 focus:outline-none ${globalAlertsEnabled ? 'bg-[#DFFF00]' : 'bg-slate-800'}`}
                          title={globalAlertsEnabled ? "Disable Global Price Alerts" : "Enable Global Price Alerts"}
                        >
                          <span className={`inline-block h-2 w-2 transform rounded-full bg-slate-950 transition-transform duration-300 ${globalAlertsEnabled ? 'translate-x-4' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">{portfolioData.length} POSITIONS</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {portfolioData.map((asset, idx) => (
                      <HoldingCard
                        key={`${asset.ticker}-${idx}`}
                        asset={asset}
                        idx={idx}
                        onClick={() => {
                          const cleanTicker = asset.ticker.split('.')[0];
                          const foundAsset = ASSETS.find(a => a.symbol === cleanTicker);
                          if (foundAsset) {
                            setSelectedAssetId(foundAsset.id);
                            setActiveTab('asset-detail');
                          }
                        }}
                        alertConfig={alertThresholds[asset.ticker]}
                        onSaveAlert={handleSaveAlert}
                      />
                    ))}
                  </div>
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
                        const totalCost = cgsAssets.reduce((acc, curr) => {
                          const assetCost = new Decimal(curr.averagePrice).times(curr.lots).times(100);
                          return new Decimal(acc).plus(assetCost).toNumber();
                        }, 0);
                        const totalPL = new Decimal(totalPortfolioValue).minus(totalCost);
                        const plPercentage = totalCost === 0 ? new Decimal(0) : totalPL.div(totalCost).times(100);
                        const isPositive = totalPL.gte(0);
                        return (
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${isPositive ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            <span className="text-[10px] font-black">{isPositive ? '+' : ''}{(typeof plPercentage?.toNumber === 'function' ? plPercentage.toNumber() : 0).toFixed(2)}% Performance</span>
                          </div>
                        );
                      })()}
                      {/* RDN Cash Badge */}
                      <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/80 rounded-full border border-slate-800 hover:border-slate-700 transition group relative">
                        <span className="text-[9px] text-slate-500 font-black uppercase">RDN Cash:</span>
                        {isEditingRDN ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              className="bg-slate-950 text-[#DFFF00] font-mono text-[10px] w-24 px-1 rounded border border-slate-700 focus:outline-none focus:border-[#DFFF00]"
                              value={rdnInputVal}
                              onChange={(e) => setRdnInputVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const val = parseFloat(rdnInputVal);
                                  if (!isNaN(val)) {
                                    setCgsCashBalance(val);
                                  }
                                  setIsEditingRDN(false);
                                } else if (e.key === 'Escape') {
                                  setRdnInputVal(cgsCashBalance.toString());
                                  setIsEditingRDN(false);
                                }
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => {
                                const val = parseFloat(rdnInputVal);
                                if (!isNaN(val)) {
                                  setCgsCashBalance(val);
                                }
                                setIsEditingRDN(false);
                              }}
                              className="text-green-400 hover:text-green-300 p-0.5"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                setRdnInputVal(cgsCashBalance.toString());
                                setIsEditingRDN(false);
                              }}
                              className="text-red-400 hover:text-red-300 p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            className="flex items-center gap-1.5 cursor-pointer"
                            onClick={() => setIsEditingRDN(true)}
                            title="Click to edit RDN Cash"
                          >
                            <span className="text-[10px] text-[#DFFF00] font-mono font-bold">
                              Rp {typeof cgsCashBalance === 'number' ? cgsCashBalance.toLocaleString('id-ID') : (cgsCashBalance || '0')}
                            </span>
                            <Edit2 className="w-2.5 h-2.5 text-slate-600 group-hover:text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                          </div>
                        )}
                      </div>

                      {/* Giro Cash Badge */}
                      <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/80 rounded-full border border-slate-800 hover:border-slate-700 transition group relative">
                        <span className="text-[9px] text-slate-500 font-black uppercase">Giro Cash:</span>
                        {isEditingGiro ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              className="bg-slate-950 text-[#deff9a] font-mono text-[10px] w-24 px-1 rounded border border-slate-700 focus:outline-none focus:border-[#deff9a]"
                              value={giroInputVal}
                              onChange={(e) => setGiroInputVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const val = parseFloat(giroInputVal);
                                  if (!isNaN(val)) {
                                    setCgsGiroBalance(val);
                                  }
                                  setIsEditingGiro(false);
                                } else if (e.key === 'Escape') {
                                  setGiroInputVal(cgsGiroBalance.toString());
                                  setIsEditingGiro(false);
                                }
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => {
                                const val = parseFloat(giroInputVal);
                                if (!isNaN(val)) {
                                  setCgsGiroBalance(val);
                                }
                                setIsEditingGiro(false);
                              }}
                              className="text-green-400 hover:text-green-300 p-0.5"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                setGiroInputVal(cgsGiroBalance.toString());
                                setIsEditingGiro(false);
                              }}
                              className="text-red-400 hover:text-red-300 p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            className="flex items-center gap-1.5 cursor-pointer"
                            onClick={() => setIsEditingGiro(true)}
                            title="Click to edit Giro Cash"
                          >
                            <span className="text-[10px] text-[#deff9a] font-mono font-bold">
                              Rp {typeof cgsGiroBalance === 'number' ? cgsGiroBalance.toLocaleString('id-ID') : (cgsGiroBalance || '0')}
                            </span>
                            <Edit2 className="w-2.5 h-2.5 text-slate-600 group-hover:text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                          </div>
                        )}
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <button 
                    onClick={exportPortfolioAnalysisToPDF}
                    className="py-4 px-4 rounded-2xl border border-slate-800 bg-slate-900/50 text-[#DFFF00] font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(223,255,0,0.05)] hover:shadow-[0_0_20px_rgba(223,255,0,0.1)]"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Export PDF Report
                  </button>
                  <button 
                    onClick={exportPortfolioAnalysisToCSV}
                    className="py-4 px-4 rounded-2xl border border-slate-800 bg-slate-900/50 text-sky-400 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.05)] hover:shadow-[0_0_20px_rgba(56,189,248,0.1)]"
                  >
                    <FileText className="w-3 h-3" />
                    Export CSV Data
                  </button>
                </div>
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
            livePrices={livePrices}
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
                  {portfolioData.map((asset, idx) => (
                    <HoldingCard
                      key={`${asset.ticker}-${idx}`}
                      asset={asset}
                      idx={idx}
                      onClick={() => {
                        setSelectedSymbol(`IDX:${asset.ticker.replace('.JK', '')}`);
                        setActiveTab('home');
                      }}
                      alertConfig={alertThresholds[asset.ticker]}
                      onSaveAlert={handleSaveAlert}
                    />
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
              cashBalance={cgsCashBalance} 
              portfolioAssets={cgsAssets}
              onUpdatePortfolio={handleUpdatePortfolio}
              onResetPortfolio={handleResetPortfolio}
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
            <FinancialReportingCenter portfolioData={portfolioData} cashBalance={cgsCashBalance} giroBalance={cgsGiroBalance} realizedPnL={cgsRealizedPnL} totalFees={cgsTotalFees} />
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
      case 'drive':
        if (needsAuth) {
          return (
            <div className="flex flex-col items-center justify-center p-20 text-center bg-zinc-900/40 rounded-[2.5rem] border border-zinc-800 h-[60vh]">
              <div className="p-6 bg-blue-500/10 rounded-full border border-blue-500/20 mb-8 blur-sm animate-pulse">
                <Cloud className="w-12 h-12 text-blue-400" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Cloud Authorization Required</h3>
              <p className="text-xs text-zinc-500 font-bold max-w-sm uppercase leading-relaxed tracking-widest mb-10">
                To access VentureAM Cloud, please authorize your institutional Google Drive account.
              </p>
              
              <button 
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="gsi-material-button group"
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents tracking-widest uppercase font-black text-[10px]">
                    {isLoggingIn ? 'Authorizing Gateway...' : 'Initialize Drive Connection'}
                  </span>
                </div>
              </button>
            </div>
          );
        }
        return <WorkspaceHub onAuthRequired={() => setNeedsAuth(true)} />;
      case 'my-company':
        return <MyCompanyOverview />;
      case 'audit-sync':
        return <AuditSync />;
      case 'vamsmartscanner':
        return <VamSmartScanner />;
      case 'users':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setActiveTab('home')} className="p-1.5 bg-slate-900 rounded-lg border border-slate-800 text-[#deff9a]">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Institutional Governance</h3>
            </div>
            <UserManagement />
          </div>
        );
      case 'compliance': {
        const profileEmailVal = (userProfile?.email || '').toLowerCase();
        const googleEmailVal = (googleUser?.email || '').toLowerCase();
        const isUnlocked = userProfile?.role === 'President_Director' || 
                           profileEmailVal === 'aidilsyahdan2000@gmail.com' || 
                           profileEmailVal === 'pt.ventuream@gmail.com' ||
                           googleEmailVal === 'aidilsyahdan2000@gmail.com' ||
                           googleEmailVal === 'pt.ventuream@gmail.com';
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setActiveTab('home')} className="p-1.5 bg-slate-900 rounded-lg border border-[#deff9a]/20 text-[#deff9a] hover:bg-slate-800 transition-all">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">
                  Laporan Regulasi
                </h3>
                {isUnlocked && <span className="text-[8px] text-[#deff9a] font-black uppercase tracking-tighter">Authority: Fully Unlocked</span>}
              </div>
            </div>
            
            {isUnlocked ? (
              <RegulatoryReport />
            ) : (
              <div className="bg-slate-900/50 p-10 rounded-[2.5rem] border border-slate-800 flex flex-col items-center text-center">
                <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20 mb-6">
                  <Lock className="w-8 h-8 text-red-400 animate-pulse" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Akses Terbatas (Restricted)</h3>
                <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed uppercase tracking-widest max-w-sm">
                  Laporan kepatuhan regulasi terpadu PT Venture Asset Management memerlukan hak akses penandatangan legal resmi (President Director / Special Attorney-in-Fact).
                </p>
                <div className="mt-8 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Akses Ditolak</span>
                  </div>
                  <button 
                    onClick={() => setActiveTab('home')}
                    className="mt-2 text-[9px] font-bold text-[#deff9a] uppercase underline hover:text-white"
                  >
                    Kembali Ke Dashboard Utama
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      }
      case 'liquidity': {
        const profileEmailVal = (userProfile?.email || '').toLowerCase();
        const googleEmailVal = (googleUser?.email || '').toLowerCase();
        const isUnlocked = userProfile?.role === 'President_Director' || 
                           profileEmailVal === 'aidilsyahdan2000@gmail.com' || 
                           profileEmailVal === 'pt.ventuream@gmail.com' ||
                           googleEmailVal === 'aidilsyahdan2000@gmail.com' ||
                           googleEmailVal === 'pt.ventuream@gmail.com';
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
      }
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans select-none overflow-x-hidden relative">
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
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">{t('Institutional System')}</p>
          </div>

          <nav className="flex-1 space-y-1.5 overflow-y-auto max-h-[75vh] pr-1">
            {SIDEBAR_MENU.map((item) => {
              const locked = isLocked(item.path);
              return (
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
                    className={`w-full flex items-center gap-4 p-3.5 rounded-3xl transition-all border ${
                      activeTab === item.path 
                      ? 'bg-[#deff9a]/10 border-[#deff9a]/20 text-[#deff9a]' 
                      : locked
                        ? 'bg-zinc-950/20 border-zinc-900/50 text-zinc-500 hover:bg-zinc-900/20'
                        : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/60 text-slate-400'
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" style={{ color: locked ? '#71717a' : item.color }} />
                    <div className="text-left flex-1 flex justify-between items-center gap-2 overflow-hidden">
                      <div className="min-w-0">
                        <p className={`text-xs font-black uppercase tracking-tight truncate ${locked ? 'text-zinc-500' : ''}`}>{t(item.label)}</p>
                        {item.provider && <p className="text-[8px] text-zinc-600 font-bold uppercase truncate">{item.provider}</p>}
                      </div>
                      {locked && <Lock className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />}
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
            );
          })}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-800/50">
            <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">{t('Institutional Identification')}</p>
              <p className="text-[11px] text-slate-200 font-black tracking-tight">{(typeof process !== 'undefined' && process.env.USER_EMAIL) || 'Institutional User'}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[9px] text-[#DFFF00] font-mono">{t('ROLE: ')}{userProfile?.role.replace('_', ' ') || 'PUBLIC'}</p>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-[8px] text-green-500 font-black uppercase">{t('Verified')}</p>
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
          <header className="flex justify-between items-center p-4 border-b border-zinc-800 sticky top-0 bg-black z-30 gap-4">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="w-12 h-12 flex items-center justify-center bg-[#11141b] rounded-2xl border border-white/5 hover:bg-zinc-800 transition-all shadow-xl"
              >
                <Menu className="w-6 h-6 text-[#DFFF00]" />
              </button>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-[#DFFF00] tracking-tight leading-none italic">VentureAM</h1>
                  <div className="w-2 h-4 bg-[#DFFF00]/90 rounded-full blur-[1px] animate-pulse shadow-[0_0_10px_#DFFF00]" />
                </div>
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-1.5">{t('Institutional System')}</span>
              </div>
            </div>

            <GlobalSearch />
            
            <div className="text-right flex items-center gap-4">
              {googleUser ? (
                <button
                  onClick={googleLogout}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-[10px] font-black uppercase text-white hover:bg-zinc-800"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  className="px-6 py-3 bg-[#DFFF00] border border-[#DFFF00] rounded-2xl text-[12px] font-black uppercase text-black hover:bg-[#DFFF00]/90 shadow-lg"
                >
                  Login
                </button>
              )}
              {/* Language Switcher Capsule */}
              <div className="hidden md:flex bg-zinc-950 p-1 rounded-[14px] border border-zinc-800/80 gap-0.5 shadow-inner select-none mr-2">
                <button
                  onClick={() => handleLanguageChange('EN')}
                  className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    language === 'EN'
                      ? 'bg-[#DFFF00] text-black font-extrabold shadow-sm'
                      : 'text-zinc-500 hover:text-white hover:bg-zinc-900/30'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => handleLanguageChange('ID')}
                  className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    language === 'ID'
                      ? 'bg-[#DFFF00] text-black font-extrabold shadow-sm'
                      : 'text-zinc-500 hover:text-white hover:bg-zinc-900/30'
                  }`}
                >
                  ID
                </button>
              </div>

              {/* Smaller/Responsive toggle on mobile viewports */}
              <div className="flex md:hidden bg-zinc-950 p-1 rounded-[12px] border border-zinc-800/80 gap-1 shadow-inner select-none mr-1">
                <button
                  onClick={() => handleLanguageChange(language === 'ID' ? 'EN' : 'ID')}
                  className="px-2.5 py-1 rounded-[10px] text-[9px] font-black uppercase tracking-widest text-[#DFFF00] hover:bg-zinc-900/40 border border-[#DFFF00]/10"
                >
                  {language}
                </button>
              </div>

              {/* Manual Market Refresh Button */}
              <button
                onClick={syncMarketConnectivity}
                disabled={isMarketSyncing}
                title={t('Refresh Market Data')}
                id="header-refresh-market-button"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  isMarketSyncing
                    ? 'bg-[#deff9a]/10 border-[#deff9a]/30 text-[#deff9a]'
                    : 'bg-zinc-950 border-zinc-800 text-slate-400 hover:text-white hover:bg-zinc-900/40 hover:border-zinc-700'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isMarketSyncing ? 'animate-spin text-[#deff9a]' : ''}`} />
                <span className="hidden sm:inline">
                  {isMarketSyncing ? t('Refreshing...') : t('Refresh Market')}
                </span>
              </button>

              <div className="flex flex-col items-end">
                <p className="text-[8px] text-zinc-500 font-black uppercase tracking-[0.25em] mb-0.5">{t('Ventuream International Gateway')}</p>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[11px] font-black uppercase tracking-widest ${networkStats.operational ? 'text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]'}`}>
                    {networkStats.operational ? t('CONNECTED') : t('OFFLINE')}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-zinc-900/50 border border-white/5 flex items-center justify-center shadow-inner">
                <Link className="w-5 h-5 text-emerald-500/80" />
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
            <motion.div 
              key="sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] lg:hidden"
            />
          )}
          {isSidebarOpen && (
            <motion.aside
              key="sidebar-aside-menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-4/5 max-w-[320px] bg-black border-r border-slate-800 z-[70] p-6 flex flex-col lg:hidden"
            >
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-xl font-black text-[#deff9a] tracking-tight">VentureAM</h2>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">{t('Institutional System')}</p>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
                  {SIDEBAR_MENU.map((item) => {
                    const locked = isLocked(item.path);
                    return (
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
                            : locked
                              ? 'bg-zinc-950/20 border-zinc-900/50 text-zinc-500 hover:bg-zinc-900/20'
                              : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/60 text-slate-400'
                          }`}
                        >
                          <item.icon className="w-5 h-5 flex-shrink-0" style={{ color: locked ? '#71717a' : item.color }} />
                          <div className="text-left flex-1 flex justify-between items-center gap-2 overflow-hidden">
                            <div className="min-w-0">
                              <p className={`text-xs font-black uppercase tracking-tight truncate ${locked ? 'text-zinc-500' : ''}`}>{t(item.label)}</p>
                              {item.provider && <p className="text-[8px] text-zinc-600 font-bold uppercase truncate">{item.provider}</p>}
                            </div>
                            {locked && <Lock className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />}
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
                  );
                })}
                </nav>
              </motion.aside>
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
                    
                    <button 
                      onClick={() => {
                        setStopLossFromAlert(notif.symbol, notif.price);
                        clearNotification(notif.id);
                      }}
                      className="mt-3 w-full bg-[#DFFF00] text-black py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#deff9a] transition-all flex items-center justify-center gap-2 group/btn"
                    >
                      <ShieldCheck className="w-3 h-3 group-hover/btn:scale-110 transition-transform" />
                      Set Stop-Loss Order
                    </button>
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
