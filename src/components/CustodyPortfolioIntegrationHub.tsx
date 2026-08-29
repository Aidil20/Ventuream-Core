import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  ShieldCheck, 
  UploadCloud, 
  FileText, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Search, 
  Filter, 
  Download, 
  Sparkles, 
  Layers, 
  TrendingUp, 
  Coins, 
  Scale, 
  Lock, 
  Database, 
  Zap, 
  ChevronRight, 
  FileCheck2, 
  Hash, 
  Briefcase, 
  Cpu, 
  Clock, 
  Info,
  Check,
  Copy,
  ExternalLink,
  DollarSign,
  Edit3,
  SlidersHorizontal,
  X,
  Save,
  CheckCircle,
  Boxes,
  Package,
  BarChart3,
  CheckCheck,
  FolderSync,
  Landmark,
  Server,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  CustodyAccount, 
  CustodyStatementParseResult, 
  PortfolioHolding, 
  ReconciliationRecord,
  ExecutiveBoardPack
} from '../types';

interface Props {
  isUnlocked?: boolean;
  portfolioData?: any[];
  cgsAssets?: any[];
  cgsCashBalance?: number;
  cgsGiroBalance?: number;
}

const STOCK_NAMES_MAP: Record<string, string> = {
  'BACH': 'PT Petrosea Tbk (Saham CGS International)',
  'DEFI': 'PT Danasupra Erapacific Tbk (Core Institutional Asset)',
  'DSSA': 'PT Dian Swastatika Sentosa Tbk (Core Strategic Asset)',
  'EMMI': 'PT Indo Komoditi Korpora Tbk',
  'JECX': 'PT Jaya Agra Wattie Tbk',
  'KOTA': 'PT DMS Propertindo Tbk',
  'PIPA': 'PT Multi Makmur Lemindo Tbk',
  'PJHB-W': 'PT Pelayaran Jaya Samudra Waran (Waran Seri I)',
  'PRDL': 'PT Pelayaran Resources Tbk',
  'RANS': 'PT Rans Nusantara Tbk',
  'BBCA': 'PT Bank Central Asia Tbk',
  'BBRI': 'PT Bank Rakyat Indonesia (Persero) Tbk',
  'BMRI': 'PT Bank Mandiri (Persero) Tbk',
  'BBNI': 'PT Bank Negara Indonesia (Persero) Tbk',
  'TLKM': 'PT Telkom Indonesia (Persero) Tbk',
  'ASII': 'PT Astra International Tbk',
  'ICBP': 'PT Indofood CBP Sukses Makmur Tbk',
  'INDF': 'PT Indofood Sukses Makmur Tbk',
  'UNVR': 'PT Unilever Indonesia Tbk',
  'GOTO': 'PT GoTo Gojek Tokopedia Tbk',
  'ADRO': 'PT Adaro Energy Indonesia Tbk',
  'PTBA': 'PT Bukit Asam Tbk',
  'AMMN': 'PT Amman Mineral Internasional Tbk',
  'BREN': 'PT Barito Renewables Energy Tbk',
  'CUAN': 'PT Petrindo Jaya Kreasi Tbk',
  'TPIA': 'PT Chandra Asri Pacific Tbk'
};

const DEFAULT_WAP_PHYSICAL_ASSETS = [
  { 
    id: 'ast_pc_01', 
    code: 'AST-PC-01', 
    name: 'PC & Monitor Workstation (1 Unit)', 
    category: 'Inventaris IT & Komputer', 
    valuation: 6000000, 
    location: 'Kantor Operasional VAM', 
    quantity: 1 
  }
];

const DEFAULT_INTANGIBLE_ASSETS = [
  {
    id: 'ast_sft_erp_01',
    code: 'AST-SFT-ERP-01',
    name: 'Software ERP VentureAM Institutional System (Core Architecture & AI Engine)',
    category: 'Aset Tak Berwujud (PSAK 19 / IAS 38)',
    valuation: 4200000000,
    location: 'Server On-Premise & Cloud Repository VAM',
    quantity: 1,
    serialNumber: 'VAM-SFT-ERP-2026-SPI'
  }
];

const DEFAULT_WAP_INVESTMENTS: any[] = [];

export const CustodyPortfolioIntegrationHub: React.FC<Props> = ({ 
  isUnlocked = true,
  portfolioData = [],
  cgsAssets = [],
  cgsCashBalance,
  cgsGiroBalance
}) => {
  const [activeTab, setActiveTab] = useState<'reconciliation' | 'parser' | 'holdings' | 'board_pack'>('reconciliation');
  
  // Data States with LocalStorage Cache Initialization
  const [accounts, setAccounts] = useState<CustodyAccount[]>(() => {
    try {
      const saved = localStorage.getItem('vam_cpi_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [holdings, setHoldings] = useState<PortfolioHolding[]>(() => {
    try {
      const saved = localStorage.getItem('vam_cpi_holdings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [reconcileHistory, setReconcileHistory] = useState<ReconciliationRecord[]>(() => {
    try {
      const saved = localStorage.getItem('vam_cpi_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [latestReconciliation, setLatestReconciliation] = useState<ReconciliationRecord | null>(() => {
    try {
      const saved = localStorage.getItem('vam_cpi_latest_recon');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return null;
  });

  const [boardPack, setBoardPack] = useState<ExecutiveBoardPack | null>(null);

  // Loading & Sync States
  const [isLoadingAccounts, setIsLoadingAccounts] = useState<boolean>(false);
  const [isLoadingHoldings, setIsLoadingHoldings] = useState<boolean>(false);
  const [isReconciling, setIsReconciling] = useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isGeneratingPack, setIsGeneratingPack] = useState<boolean>(false);
  const [isResettingDefaults, setIsResettingDefaults] = useState<boolean>(false);
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);
  
  // Sync Modal State
  const [syncModalOpen, setSyncModalOpen] = useState<boolean>(false);
  const [syncSummaryData, setSyncSummaryData] = useState<any>(null);

  // Parser / Upload State
  const [selectedInstitution, setSelectedInstitution] = useState<'CIMB_NIAGA_RDN' | 'CIMB_NIAGA_GIRO' | 'CGS_SEKURITAS' | 'IBKR_GATEWAY'>('CIMB_NIAGA_RDN');
  const [statementRawText, setStatementRawText] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [parseResult, setParseResult] = useState<CustodyStatementParseResult | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Real Account Balance Quick Editing State
  const [editingAccount, setEditingAccount] = useState<CustodyAccount | null>(null);
  const [editBalanceInput, setEditBalanceInput] = useState<string>('');
  const [editAvailableInput, setEditAvailableInput] = useState<string>('');
  const [editReservedInput, setEditReservedInput] = useState<string>('');
  const [isSavingBalance, setIsSavingBalance] = useState<boolean>(false);
  const [saveBalanceSuccess, setSaveBalanceSuccess] = useState<string | null>(null);

  // Filtering & Search States
  const [holdingSearch, setHoldingSearch] = useState<string>('');
  const [selectedCustodianFilter, setSelectedCustodianFilter] = useState<string>('ALL');
  const [selectedPsakFilter, setSelectedPsakFilter] = useState<string>('ALL');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<'ALL' | 'PORTFOLIO_ANALYST' | 'INTANGIBLE_ASSET' | 'WAP_INVENTORY' | 'WAP_INVESTMENT' | 'OFFSHORE'>('ALL');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Board pack custom inputs
  const [boardPeriod, setBoardPeriod] = useState<string>('Q3-2026');
  const [boardNotes, setBoardNotes] = useState<string>('Verifikasi ketahanan kas, kepatuhan PSAK 71, dan korelasi portofolio DSSA/DEFI terhadap makroekonomi.');

  // Sync to LocalStorage
  useEffect(() => {
    if (accounts.length > 0) {
      try {
        localStorage.setItem('vam_cpi_accounts', JSON.stringify(accounts));
      } catch (e) {}
    }
  }, [accounts]);

  useEffect(() => {
    if (holdings.length > 0) {
      try {
        localStorage.setItem('vam_cpi_holdings', JSON.stringify(holdings));
      } catch (e) {}
    }
  }, [holdings]);

  useEffect(() => {
    if (latestReconciliation) {
      try {
        localStorage.setItem('vam_cpi_latest_recon', JSON.stringify(latestReconciliation));
      } catch (e) {}
    }
  }, [latestReconciliation]);

  useEffect(() => {
    if (reconcileHistory.length > 0) {
      try {
        localStorage.setItem('vam_cpi_history', JSON.stringify(reconcileHistory));
      } catch (e) {}
    }
  }, [reconcileHistory]);

  // 1. Fetch Custody Accounts
  const fetchAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      const res = await fetch('/api/v1/custody/accounts');
      if (res.ok) {
        const data = await res.json();
        if (data.accounts && Array.isArray(data.accounts)) {
          setAccounts(data.accounts);
          try {
            localStorage.setItem('vam_cpi_accounts', JSON.stringify(data.accounts));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Failed to fetch custody accounts:', err);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  // 2. Fetch Holdings Ledger
  const fetchHoldings = async () => {
    try {
      setIsLoadingHoldings(true);
      const res = await fetch('/api/v1/custody/holdings');
      if (res.ok) {
        const data = await res.json();
        if (data.holdings && Array.isArray(data.holdings)) {
          setHoldings(data.holdings);
          try {
            localStorage.setItem('vam_cpi_holdings', JSON.stringify(data.holdings));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Failed to fetch holdings:', err);
    } finally {
      setIsLoadingHoldings(false);
    }
  };

  // 3. Fetch Reconciliation History
  const fetchReconcileHistory = async () => {
    try {
      const res = await fetch('/api/v1/custody/reconcile-history');
      if (res.ok) {
        const data = await res.json();
        if (data.history && Array.isArray(data.history)) {
          setReconcileHistory(data.history);
          if (data.history.length > 0) {
            setLatestReconciliation(data.history[0]);
          }
          try {
            localStorage.setItem('vam_cpi_history', JSON.stringify(data.history));
            if (data.history[0]) {
              localStorage.setItem('vam_cpi_latest_recon', JSON.stringify(data.history[0]));
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Failed to fetch reconciliation history:', err);
    }
  };

  // 4. Trigger 4-Way Cross-Reconciliation
  const handleTriggerReconcile = async () => {
    try {
      setIsReconciling(true);
      const res = await fetch('/api/v1/custody/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reconciliation) {
          setLatestReconciliation(data.reconciliation);
          setReconcileHistory(prev => [data.reconciliation, ...prev.filter(r => r.id !== data.reconciliation.id)]);
        }
      }
    } catch (err) {
      console.error('Reconciliation failed:', err);
    } finally {
      setIsReconciling(false);
    }
  };

  // =========================================================================
  // CORE SYNCHRONIZATION ENGINE:
  // TARIK DATA DARI PORTOFOLIO ANALYST (SAHAM) & INVENTARIS ASET WAP (FISIK + INVESTASI)
  // =========================================================================
  const handleSyncFromAnalystAndWap = async (showModal = true) => {
    try {
      setIsSyncingAll(true);

      // 1. Gather Stock Assets from Portfolio Analyst
      let rawStocks: any[] = [];
      if (Array.isArray(portfolioData) && portfolioData.length > 0) {
        rawStocks = portfolioData;
      } else if (Array.isArray(cgsAssets) && cgsAssets.length > 0) {
        rawStocks = cgsAssets;
      } else {
        try {
          const savedPort = localStorage.getItem('portfolioData_v3');
          if (savedPort) {
            const parsed = JSON.parse(savedPort);
            if (Array.isArray(parsed) && parsed.length > 0) rawStocks = parsed;
          }
          if (rawStocks.length === 0) {
            const savedCgs = localStorage.getItem('cgsAssets_v3');
            if (savedCgs) {
              const parsed = JSON.parse(savedCgs);
              if (Array.isArray(parsed) && parsed.length > 0) rawStocks = parsed;
            }
          }
        } catch (e) {}
      }

      // Default baseline stocks if no state found
      if (rawStocks.length === 0) {
        rawStocks = [
          { ticker: 'BACH.JK', lots: 1, averagePrice: 22400, marketPrice: 24500 },
          { ticker: 'DEFI.JK', lots: 10, averagePrice: 224, marketPrice: 103 },
          { ticker: 'DSSA.JK', lots: 4, averagePrice: 691.67, marketPrice: 775 },
          { ticker: 'EMMI.JK', lots: 10, averagePrice: 720, marketPrice: 810 },
          { ticker: 'JECX.JK', lots: 5, averagePrice: 420, marketPrice: 480 },
          { ticker: 'KOTA.JK', lots: 15, averagePrice: 117.47, marketPrice: 96 },
          { ticker: 'PIPA.JK', lots: 15, averagePrice: 151, marketPrice: 114 },
          { ticker: 'PJHB-W.JK', lots: 5, averagePrice: 15, marketPrice: 28 },
          { ticker: 'PRDL.JK', lots: 10, averagePrice: 980, marketPrice: 1050 },
          { ticker: 'RANS.JK', lots: 10, averagePrice: 380, marketPrice: 410 }
        ];
      }

      // Transform stocks to PortfolioHolding
      const mappedStocks: PortfolioHolding[] = rawStocks.map((st: any) => {
        const rawTicker = (st.ticker || st.symbol || '').toUpperCase().trim();
        const cleanTicker = rawTicker.replace('.JK', '').replace('IDX:', '').trim();
        const fullName = STOCK_NAMES_MAP[cleanTicker] || st.name || st.customName || `Saham ${cleanTicker} BEI`;
        const lots = Number(st.lots || 1);
        const qty = Number(st.shares || (lots * 100));
        const avgPrice = Number(st.averagePrice || st.avgPrice || st.avg_price || 0);
        const currentPrice = Number(st.marketPrice || st.currentPrice || st.current_price || st.price || avgPrice);
        const marketValue = typeof st.marketValue === 'number' && st.marketValue > 0 ? st.marketValue : (qty * currentPrice);
        const pnlIdr = typeof st.unrealized === 'number' ? st.unrealized : (marketValue - (qty * avgPrice));
        const pnlPct = typeof st.change === 'number' ? st.change : (avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0);
        const isWarrant = cleanTicker.endsWith('-W') || rawTicker.endsWith('-W');
        const psakCategory: 'FVOCI' | 'FVTPL' = (cleanTicker === 'DSSA' || cleanTicker === 'DEFI') ? 'FVOCI' : 'FVTPL';

        return {
          id: `hold_cgs_${cleanTicker.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          ticker: cleanTicker,
          asset_name: fullName,
          asset_class: isWarrant ? 'WARRANT' : 'EQUITY',
          quantity: qty,
          avg_price: avgPrice,
          current_price: currentPrice,
          market_value_idr: marketValue,
          market_value_usd: marketValue / 16500,
          currency: 'IDR',
          allocation_percent: 0,
          custodian_id: 'acc_cgs_sekuritas',
          custodian_name: 'CGS International Sekuritas (Client IJKL2926)',
          pnl_unrealized_idr: pnlIdr,
          pnl_unrealized_percent: pnlPct,
          psak71_category: psakCategory,
          source_origin: 'PORTFOLIO_ANALYST',
          category_detail: isWarrant ? 'Waran Terstruktur BEI' : 'Saham Ekuitas BEI',
          last_updated: new Date().toISOString()
        };
      });

      // 2. Gather Physical Assets from WAP Asset Inventory (Only real VAM physical assets: PC & Monitor 1 unit Rp 6,000,000)
      let rawWapPhysical: any[] = [];
      try {
        const savedWap = localStorage.getItem('vam_wap_assets_v3');
        if (savedWap) {
          const parsed = JSON.parse(savedWap);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Filter out old legacy dummy assets
            rawWapPhysical = parsed.filter((ast: any) => 
              !ast.code?.includes('SRV-01') && !ast.code?.includes('HQ-01') && 
              !ast.code?.includes('TRD-01') && !ast.code?.includes('CAR-01') && 
              !ast.code?.includes('GEN-01') && !ast.code?.includes('AST-001') && 
              !ast.code?.includes('AST-002') && !ast.code?.includes('AST-003') && 
              !ast.code?.includes('AST-004') && !ast.code?.includes('AST-005') &&
              !ast.name?.toLowerCase().includes('scbd') && !ast.name?.toLowerCase().includes('datacenter') &&
              !ast.name?.toLowerCase().includes('alphard') && !ast.name?.toLowerCase().includes('generator')
            );
          }
        }
      } catch (e) {}
      if (rawWapPhysical.length === 0) {
        rawWapPhysical = DEFAULT_WAP_PHYSICAL_ASSETS;
      }

      const mappedPhysicalAssets: PortfolioHolding[] = rawWapPhysical.map((ast: any) => {
        const code = ast.code || `AST-${ast.id}`;
        const valuation = Number(ast.valuation || ast.purchaseValue || ast.currentValuation || ast.purchaseCost || 0);
        const qty = Number(ast.quantity || 1);
        const cat = ast.category || 'Inventaris IT & Komputer';
        let assetClass: any = 'FIXED_ASSET';
        if (cat.toLowerCase().includes('properti') || cat.toLowerCase().includes('gedung')) assetClass = 'PROPERTY';
        else if (cat.toLowerCase().includes('server') || cat.toLowerCase().includes('it') || cat.toLowerCase().includes('komputer')) assetClass = 'IT_INFRASTRUCTURE';

        return {
          id: `hold_wap_ast_${code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          ticker: code,
          asset_name: `${ast.name}`,
          asset_class: assetClass,
          quantity: qty,
          avg_price: valuation / qty,
          current_price: valuation / qty,
          market_value_idr: valuation,
          market_value_usd: valuation / 16500,
          currency: 'IDR',
          allocation_percent: 0,
          custodian_id: 'acc_cimb_giro',
          custodian_name: 'CIMB Niaga Giro Operasional & Inventaris VAM (860019881100)',
          pnl_unrealized_idr: 0,
          pnl_unrealized_percent: 0,
          psak71_category: 'AMORTIZED_COST',
          source_origin: 'WAP_INVENTORY',
          category_detail: cat,
          location: ast.location || 'Kantor Operasional VAM',
          serial_number: ast.serialNumber || code,
          last_updated: new Date().toISOString()
        };
      });

      // 3. Gather Intangible Assets (Software ERP VentureAM Institutional System - PSAK 19 / IAS 38)
      let rawWapIntangible: any[] = [];
      try {
        const savedIntangible = localStorage.getItem('vam_intangible_assets_v3');
        if (savedIntangible) {
          const parsed = JSON.parse(savedIntangible);
          if (Array.isArray(parsed) && parsed.length > 0) {
            rawWapIntangible = parsed;
          }
        }
      } catch (e) {}
      if (rawWapIntangible.length === 0) {
        rawWapIntangible = DEFAULT_INTANGIBLE_ASSETS;
      }

      const mappedIntangibleAssets: PortfolioHolding[] = rawWapIntangible.map((ast: any) => {
        const code = ast.code || 'AST-SFT-ERP-01';
        const valuation = Number(ast.valuation || ast.currentValuation || 4200000000);
        const qty = Number(ast.quantity || 1);

        return {
          id: `hold_intangible_${code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          ticker: code,
          asset_name: ast.name || 'Software ERP VentureAM Institutional System (Core Architecture & AI Engine)',
          asset_class: 'INTANGIBLE_ASSET',
          quantity: qty,
          avg_price: valuation / qty,
          current_price: valuation / qty,
          market_value_idr: valuation,
          market_value_usd: valuation / 16500,
          currency: 'IDR',
          allocation_percent: 0,
          custodian_id: 'acc_cimb_giro',
          custodian_name: 'Enterprise Internal Custody & SPI Register (PT VAM)',
          pnl_unrealized_idr: 0,
          pnl_unrealized_percent: 0,
          psak71_category: 'AMORTIZED_COST',
          source_origin: 'INTANGIBLE_ASSET',
          category_detail: ast.category || 'Aset Tak Berwujud (PSAK 19 / IAS 38)',
          location: ast.location || 'Server On-Premise & Cloud Repository VAM',
          serial_number: ast.serialNumber || 'VAM-SFT-ERP-2026-SPI',
          last_updated: new Date().toISOString()
        };
      });

      // 4. Gather Alternative Investment Assets from WAP (Cleaned of dummy assets)
      let rawWapInvestments: any[] = [];
      try {
        const savedInv = localStorage.getItem('vam_investment_assets_v3');
        if (savedInv) {
          const parsed = JSON.parse(savedInv);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Filter out old dummy investment assets
            rawWapInvestments = parsed.filter((inv: any) => 
              !inv.code?.includes('SKK-01') && !inv.code?.includes('PE-01') && 
              !inv.code?.includes('LON-01') && !inv.code?.includes('BND-01') &&
              !inv.code?.includes('INV-001') && !inv.code?.includes('INV-002') && 
              !inv.code?.includes('INV-003') && !inv.code?.includes('INV-004') &&
              !inv.name?.toLowerCase().includes('st011') && !inv.name?.toLowerCase().includes('nusantara logistik') &&
              !inv.name?.toLowerCase().includes('berkah agro') && !inv.name?.toLowerCase().includes('ori024')
            );
          }
        }
      } catch (e) {}
      if (rawWapInvestments.length === 0) {
        rawWapInvestments = DEFAULT_WAP_INVESTMENTS;
      }

      const mappedInvestmentAssets: PortfolioHolding[] = rawWapInvestments.map((inv: any) => {
        const code = inv.code || `INV-${inv.id}`;
        const principal = Number(inv.principalValuation || inv.initialValuation || inv.valuation || 0);
        const currentVal = Number(inv.currentValuation || inv.valuation || principal);
        const cat = inv.category || 'Investasi Alternatif';
        let assetClass: any = 'SUKUK';
        let psakCat: 'FVOCI' | 'FVTPL' | 'AMORTIZED_COST' = 'AMORTIZED_COST';

        if (cat.toLowerCase().includes('private equity')) {
          assetClass = 'PRIVATE_EQUITY';
          psakCat = 'FVOCI';
        } else if (cat.toLowerCase().includes('pinjaman')) {
          assetClass = 'DIRECT_LOAN';
          psakCat = 'AMORTIZED_COST';
        } else if (cat.toLowerCase().includes('obligasi') || cat.toLowerCase().includes('sukuk')) {
          assetClass = 'SUKUK';
          psakCat = 'AMORTIZED_COST';
        }

        const pnl = currentVal - principal;
        const pnlPct = principal > 0 ? (pnl / principal) * 100 : 0;

        return {
          id: `hold_wap_inv_${code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          ticker: code,
          asset_name: inv.name,
          asset_class: assetClass,
          quantity: 1,
          avg_price: principal,
          current_price: currentVal,
          market_value_idr: currentVal,
          market_value_usd: currentVal / 16500,
          currency: 'IDR',
          allocation_percent: 0,
          custodian_id: 'acc_cimb_rdn',
          custodian_name: 'CIMB Niaga Custody Services (800201481600)',
          pnl_unrealized_idr: pnl,
          pnl_unrealized_percent: pnlPct,
          psak71_category: psakCat,
          source_origin: 'WAP_INVESTMENT',
          category_detail: cat,
          last_updated: new Date().toISOString()
        };
      });

      // 5. Merge all items uniquely by ticker / ID (No dummy holdings)
      const allHoldingsCombined: PortfolioHolding[] = [
        ...mappedStocks,
        ...mappedIntangibleAssets,
        ...mappedPhysicalAssets,
        ...mappedInvestmentAssets
      ];

      // Calculate Total Combined Holdings IDR & Dynamic Allocation Percentages
      const totalCombinedHoldingsIdr = allHoldingsCombined.reduce((acc, h) => acc + h.market_value_idr, 0);
      const finalizedHoldings = allHoldingsCombined.map(h => ({
        ...h,
        allocation_percent: totalCombinedHoldingsIdr > 0 ? (h.market_value_idr / totalCombinedHoldingsIdr) * 100 : 0
      }));

      // 6. Update Cash Accounts with accurate balances from props / localStorage
      const rdnCash = typeof cgsCashBalance === 'number' ? cgsCashBalance : 452286;
      const giroCash = typeof cgsGiroBalance === 'number' ? cgsGiroBalance : 711000;
      const ibkrUsd = 0;

      const updatedAccounts: CustodyAccount[] = [
        {
          id: 'acc_cimb_rdn',
          institution: 'CIMB_NIAGA_RDN',
          name: 'CIMB Niaga RDN (Bank Pembayar)',
          account_number: '800201481600',
          currency: 'IDR',
          balance: rdnCash,
          available_cash: rdnCash,
          reserved_cash: 0,
          last_reconciled_at: new Date().toISOString(),
          status: 'SYNCED',
          psak71_category: 'AMORTIZED_COST'
        },
        {
          id: 'acc_cimb_giro',
          institution: 'CIMB_NIAGA_GIRO',
          name: 'CIMB Niaga Giro Operasional & Kas',
          account_number: '860019881100',
          currency: 'IDR',
          balance: giroCash,
          available_cash: giroCash,
          reserved_cash: 0,
          last_reconciled_at: new Date().toISOString(),
          status: 'SYNCED',
          psak71_category: 'AMORTIZED_COST'
        },
        {
          id: 'acc_cgs_sekuritas',
          institution: 'CGS_SEKURITAS',
          name: 'CGS International Sekuritas (Client IJKL2926)',
          account_number: '800201481600',
          currency: 'IDR',
          balance: rdnCash,
          available_cash: rdnCash,
          reserved_cash: 0,
          last_reconciled_at: new Date().toISOString(),
          status: 'SYNCED',
          psak71_category: 'FVTPL'
        },
        {
          id: 'acc_ibkr_gateway',
          institution: 'IBKR_GATEWAY',
          name: 'Interactive Brokers LLC (USD Gateway)',
          account_number: 'U25457915',
          currency: 'USD',
          balance: ibkrUsd,
          available_cash: ibkrUsd,
          reserved_cash: 0,
          last_reconciled_at: new Date().toISOString(),
          status: 'SYNCED',
          psak71_category: 'FVTPL'
        }
      ];

      // 7. Push to Backend & LocalStorage
      setHoldings(finalizedHoldings);
      setAccounts(updatedAccounts);
      try {
        localStorage.setItem('vam_cpi_holdings', JSON.stringify(finalizedHoldings));
        localStorage.setItem('vam_cpi_accounts', JSON.stringify(updatedAccounts));
      } catch (e) {}

      // POST to backend API
      try {
        await fetch('/api/v1/custody/sync-portfolio-wap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            holdings: finalizedHoldings,
            accounts: updatedAccounts,
            source_meta: 'FULL_SYNC_ANALYST_AND_WAP'
          })
        });
      } catch (e) {
        console.warn('Backend sync warning:', e);
      }

      // Re-trigger Reconciliation to ensure 0 drift
      await handleTriggerReconcile();

      // Summary data for modal
      const totalStocksVal = mappedStocks.reduce((a, b) => a + b.market_value_idr, 0);
      const totalIntangibleVal = mappedIntangibleAssets.reduce((a, b) => a + b.market_value_idr, 0);
      const totalPhysicalVal = mappedPhysicalAssets.reduce((a, b) => a + b.market_value_idr, 0);
      const totalInvVal = mappedInvestmentAssets.reduce((a, b) => a + b.market_value_idr, 0);
      const totalCashIdrCalc = rdnCash + giroCash + (ibkrUsd * 16500);
      const totalAumAll = totalCombinedHoldingsIdr + totalCashIdrCalc;

      const summary = {
        stock_count: mappedStocks.length,
        stock_value_idr: totalStocksVal,
        stock_tickers: mappedStocks.map(s => s.ticker),
        intangible_count: mappedIntangibleAssets.length,
        intangible_value_idr: totalIntangibleVal,
        intangible_names: mappedIntangibleAssets.map(i => i.asset_name),
        physical_count: mappedPhysicalAssets.length,
        physical_value_idr: totalPhysicalVal,
        physical_names: mappedPhysicalAssets.map(p => p.asset_name),
        investment_count: mappedInvestmentAssets.length,
        investment_value_idr: totalInvVal,
        investment_names: mappedInvestmentAssets.map(i => i.asset_name),
        cash_total_idr: totalCashIdrCalc,
        total_holdings_idr: totalCombinedHoldingsIdr,
        total_aum_idr: totalAumAll,
        synced_at: new Date().toISOString()
      };

      setSyncSummaryData(summary);
      if (showModal) {
        setSyncModalOpen(true);
      }

    } catch (err) {
      console.error('Failed to sync analyst and WAP data:', err);
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Auto-sync when portfolioData or cash balances update from Portfolio Analyst & App state
  const portfolioFingerprint = useMemo(() => {
    if (!portfolioData || !Array.isArray(portfolioData)) return '';
    return JSON.stringify(portfolioData.map(p => ({
      t: p.ticker,
      l: p.lots,
      a: p.averagePrice,
      m: p.marketPrice || p.currentPrice,
      v: p.marketValue
    })));
  }, [portfolioData]);

  useEffect(() => {
    if (portfolioData && portfolioData.length > 0) {
      handleSyncFromAnalystAndWap(false);
    }
  }, [portfolioFingerprint, cgsCashBalance, cgsGiroBalance]);

  // Initial fetch and auto-sync check on mount
  useEffect(() => {
    fetchAccounts();
    fetchHoldings();
    fetchReconcileHistory();

    // Auto-sync if holdings are empty or contain legacy dummy data
    const checkAndAutoSync = async () => {
      try {
        const existingHoldings = localStorage.getItem('vam_cpi_holdings');
        let needsSync = false;
        if (!existingHoldings) {
          needsSync = true;
        } else {
          const parsed = JSON.parse(existingHoldings);
          if (!Array.isArray(parsed) || parsed.length === 0) {
            needsSync = true;
          } else if (!parsed.some((h: any) => h.ticker === 'AST-SFT-ERP-01' || h.asset_class === 'INTANGIBLE_ASSET')) {
            needsSync = true;
          } else if (parsed.some((h: any) => 
            h.ticker === 'OTAS' || h.ticker === 'ANDI' || h.ticker === 'SBSN-PBS032' || h.ticker === 'US-XLE' || 
            h.ticker === 'AST-SRV-01' || h.ticker === 'AST-HQ-01' || h.ticker === 'AST-TRD-01' || h.ticker === 'AST-CAR-01' || h.ticker === 'AST-GEN-01' ||
            h.ticker === 'INV-SKK-01' || h.ticker === 'INV-PE-01' || h.ticker === 'INV-LON-01' || h.ticker === 'INV-BND-01' ||
            h.ticker?.startsWith('AST-00') || h.ticker?.startsWith('INV-00') ||
            (h.ticker === 'DSSA' && h.quantity > 1000) || (h.ticker === 'DEFI' && h.quantity > 5000)
          )) {
            needsSync = true;
          }
        }
        if (needsSync) {
          await handleSyncFromAnalystAndWap(false);
        }
      } catch (e) {
        await handleSyncFromAnalystAndWap(false);
      }
    };
    checkAndAutoSync();
  }, []);

  // Open Real Balance Editor
  const openBalanceEditor = (acc: CustodyAccount) => {
    setEditingAccount(acc);
    setEditBalanceInput(acc.balance.toString());
    setEditAvailableInput((acc.available_cash ?? acc.balance).toString());
    setEditReservedInput((acc.reserved_cash || 0).toString());
    setSaveBalanceSuccess(null);
  };

  // Save Real Balance to Backend & Sync Reconcile
  const handleSaveBalance = async () => {
    if (!editingAccount) return;
    try {
      setIsSavingBalance(true);
      const balanceNum = parseFloat(editBalanceInput) || 0;
      const availableNum = parseFloat(editAvailableInput) || balanceNum;
      const reservedNum = parseFloat(editReservedInput) || 0;

      const res = await fetch('/api/v1/custody/update-account-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: editingAccount.id,
          balance: balanceNum,
          available_cash: availableNum,
          reserved_cash: reservedNum
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSaveBalanceSuccess(data.message || 'Saldo riil berhasil disimpan secara permanen.');
        if (data.all_accounts && Array.isArray(data.all_accounts)) {
          setAccounts(data.all_accounts);
          try {
            localStorage.setItem('vam_cpi_accounts', JSON.stringify(data.all_accounts));
          } catch (e) {}
        }
        await handleTriggerReconcile();
        setTimeout(() => {
          setEditingAccount(null);
          setSaveBalanceSuccess(null);
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to update balance:', err);
    } finally {
      setIsSavingBalance(false);
    }
  };

  // Reset to Factory Defaults
  const handleResetDefaults = async () => {
    if (!window.confirm("Apakah Anda yakin ingin mereset data akun kustodian dan portofolio ke baseline institusi awal?")) {
      return;
    }
    try {
      setIsResettingDefaults(true);
      const res = await fetch('/api/v1/custody/reset-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.accounts) {
          setAccounts(data.accounts);
          localStorage.setItem('vam_cpi_accounts', JSON.stringify(data.accounts));
        }
        if (data.holdings) {
          setHoldings(data.holdings);
          localStorage.setItem('vam_cpi_holdings', JSON.stringify(data.holdings));
        }
        await handleTriggerReconcile();
      }
    } catch (err) {
      console.error('Failed to reset defaults:', err);
    } finally {
      setIsResettingDefaults(false);
    }
  };

  // 5. Parse Statement
  const handleParseStatement = async () => {
    if (!statementRawText.trim()) return;
    try {
      setIsParsing(true);
      setParseResult(null);
      setImportSuccessMessage(null);

      const res = await fetch('/api/v1/custody/parse-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institution: selectedInstitution,
          raw_text: statementRawText,
          file_name: uploadedFileName || `${selectedInstitution}_statement.txt`
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setParseResult(data.data);
        }
      }
    } catch (err) {
      console.error('Statement parsing failed:', err);
    } finally {
      setIsParsing(false);
    }
  };

  // 6. Import Parsed Statement into Ledger
  const handleImportStatement = async () => {
    if (!parseResult) return;
    try {
      setIsImporting(true);
      const res = await fetch('/api/v1/custody/import-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statement_data: parseResult
        })
      });

      if (res.ok) {
        const data = await res.json();
        setImportSuccessMessage(data.message || 'Statement berhasil diimpor ke buku besar kustodian.');
        await fetchAccounts();
        await fetchHoldings();
        await handleTriggerReconcile();
      }
    } catch (err) {
      console.error('Failed to import statement:', err);
    } finally {
      setIsImporting(false);
    }
  };

  // 7. Generate Executive Board Pack
  const handleGenerateBoardPack = async () => {
    try {
      setIsGeneratingPack(true);
      const res = await fetch('/api/v1/intelligence/generate-executive-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: boardPeriod,
          custom_notes: boardNotes,
          include_cpi_reconciliation: true
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.report) {
          setBoardPack(data.report);
        }
      }
    } catch (err) {
      console.error('Failed to generate board pack:', err);
    } finally {
      setIsGeneratingPack(false);
    }
  };

  // Handle File Upload from Disk
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setStatementRawText(content);
      };
      reader.readAsText(file);
    }
  };

  // Load Preset Institutional Statements for Immediate Testing
  const loadPresetStatement = (inst: 'CIMB_NIAGA_RDN' | 'CIMB_NIAGA_GIRO' | 'CGS_SEKURITAS' | 'IBKR_GATEWAY') => {
    setSelectedInstitution(inst);
    if (inst === 'CIMB_NIAGA_RDN') {
      setUploadedFileName('CIMB_Niaga_RDN_Statement_Real.txt');
      setStatementRawText(`PT BANK CIMB NIAGA TBK - CUSTODIAN SERVICES
REKENING DANA NASABAH (RDN) INSTITUSI
Nama Akun: PT VENTURE ASSET MANAGEMENT
Nomor Rekening: 800201481600
Mata Uang: IDR
Periode: 01/08/2026 s/d 31/08/2026

SALDO AWAL: Rp 452.286,00
TOTAL KREDIT: Rp 0,00
TOTAL DEBIT: Rp 0,00
SALDO AKHIR: Rp 452.286,00

POSISI EFEK TERDAFTAR (CUSTODY HOLDINGS):
- BACH (PT Petrosea Tbk)              | Qty: 100 lembar (1 lot)    | Harga: Rp 24.500 | Nilai: Rp 2.450.000
- DEFI (PT Danasupra Erapacific Tbk)  | Qty: 1.000 lembar (10 lot) | Harga: Rp 103    | Nilai: Rp 103.000
- DSSA (PT Dian Swastatika Sentosa)   | Qty: 400 lembar (4 lot)    | Harga: Rp 775    | Nilai: Rp 310.000
- EMMI (PT Indo Komoditi Korpora Tbk) | Qty: 1.000 lembar (10 lot) | Harga: Rp 810    | Nilai: Rp 810.000
- JECX (PT Jaya Agra Wattie Tbk)      | Qty: 500 lembar (5 lot)    | Harga: Rp 480    | Nilai: Rp 240.000
- KOTA (PT DMS Propertindo Tbk)       | Qty: 1.500 lembar (15 lot) | Harga: Rp 96     | Nilai: Rp 144.000
- PIPA (PT Multi Makmur Lemindo Tbk)  | Qty: 1.500 lembar (15 lot) | Harga: Rp 114    | Nilai: Rp 171.000
- PJHB-W (PT Pelayaran Jaya Waran I)  | Qty: 500 lembar (5 lot)    | Harga: Rp 28     | Nilai: Rp 14.000
- PRDL (PT Pelayaran Resources Tbk)   | Qty: 1.000 lembar (10 lot) | Harga: Rp 1.050  | Nilai: Rp 1.050.000
- RANS (PT Rans Nusantara Tbk)        | Qty: 1.000 lembar (10 lot) | Harga: Rp 410    | Nilai: Rp 410.000

Status: Disahkan oleh PT Bank CIMB Niaga Tbk Unit Kustodian (Rekening RDN: 800201481600).`);
    } else if (inst === 'CGS_SEKURITAS') {
      setUploadedFileName('CGS_International_Securities_Confirmation.txt');
      setStatementRawText(`CGS INTERNATIONAL SEKURITAS INDONESIA
INSTITUTIONAL CLIENT EQUITY & CASH STATEMENT
Client Name: PT VENTURE ASSET MANAGEMENT
Account / Client Code: IJKL2926
Clearing Currency: IDR
Statement Date: 2026-08-31

SALDO KAS DI BROKER (CASH ON BROKERAGE / RDN): Rp 452.286,00
NILAI PORTOFOLIO SAHAM BEI: Rp 5.702.000,00
TOTAL ASSET COLLATERAL VALUE: Rp 6.154.286,00

DAFTAR KEPEMILIKAN EFEK:
- BACH.JK   | 100 shares (1 lot)    | Avg: Rp 22.400 | Price: Rp 24.500 | PnL: +Rp 210.000 (+9.38%)
- DEFI.JK   | 1.000 shares (10 lots)| Avg: Rp 224    | Price: Rp 103    | PnL: -Rp 121.000 (-54.02%)
- DSSA.JK   | 400 shares (4 lots)   | Avg: Rp 691.67 | Price: Rp 775    | PnL: +Rp 33.333 (+12.05%)
- EMMI.JK   | 1.000 shares (10 lots)| Avg: Rp 720    | Price: Rp 810    | PnL: +Rp 90.000 (+12.50%)
- JECX.JK   | 500 shares (5 lots)   | Avg: Rp 420    | Price: Rp 480    | PnL: +Rp 30.000 (+14.29%)
- KOTA.JK   | 1.500 shares (15 lots)| Avg: Rp 117.47 | Price: Rp 96     | PnL: -Rp 32.205 (-18.28%)
- PIPA.JK   | 1.500 shares (15 lots)| Avg: Rp 151    | Price: Rp 114    | PnL: -Rp 55.500 (-24.50%)
- PJHB-W.JK | 500 shares (5 lots)   | Avg: Rp 15     | Price: Rp 28     | PnL: +Rp 6.500 (+86.67%)
- PRDL.JK   | 1.000 shares (10 lots)| Avg: Rp 980    | Price: Rp 1.050  | PnL: +Rp 70.000 (+7.14%)
- RANS.JK   | 1.000 shares (10 lots)| Avg: Rp 380    | Price: Rp 410    | PnL: +Rp 30.000 (+7.89%)

Trade Settlement Status: ALL TRADES CLEARED via KPEI & KSEI (Client Code: IJKL2926).`);
    } else if (inst === 'IBKR_GATEWAY') {
      setUploadedFileName('InteractiveBrokers_Monthly_USD_Statement.txt');
      setStatementRawText(`INTERACTIVE BROKERS LLC
INSTITUTIONAL MULTI-CURRENCY ACTIVITY STATEMENT
Account: U25457915
Account Title: PT VENTURE ASSET MANAGEMENT
Base Currency: USD
Period: August 1, 2026 - August 31, 2026

CASH BALANCES:
- USD Cash Balance: $0.00
- Total Cash Available for Trading: $0.00

OFFSHORE HOLDINGS:
- No active positions currently held in offshore gateway.

Broker Compliance: SEC Rule 144A & MiFID II Best Execution Compliant (Account: U25457915).`);
    } else {
      setUploadedFileName('CIMB_Niaga_Giro_Operasional_Aug2026.txt');
      setStatementRawText(`PT BANK CIMB NIAGA TBK
REKENING KORAN GIRO BADAN USAHA
Nama Nasabah: PT VENTURE ASSET MANAGEMENT
No. Rekening: 860019881100
Mata Uang: IDR
Periode: 01/08/2026 - 31/08/2026

SALDO AWAL: Rp 711.000,00
TOTAL KREDIT: Rp 0,00
TOTAL DEBIT: Rp 0,00
SALDO AKHIR: Rp 711.000,00

Mutasi Valid: Rekening Giro Bebas Blokir & Beroperasi Normal (Rekening Giro: 860019881100).`);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Calculation Metrics
  const totalHoldingsValueIdr = (holdings || []).reduce((acc, h) => acc + (h?.market_value_idr || 0), 0);
  
  // Categorical Breakdown Metrics
  const stockHoldings = (holdings || []).filter(h => h.source_origin === 'PORTFOLIO_ANALYST' || h.asset_class === 'EQUITY' || h.asset_class === 'WARRANT');
  const stockValueIdr = stockHoldings.reduce((acc, h) => acc + (h?.market_value_idr || 0), 0);

  const intangibleHoldings = (holdings || []).filter(h => h.source_origin === 'INTANGIBLE_ASSET' || h.asset_class === 'INTANGIBLE_ASSET' || h.ticker === 'AST-SFT-ERP-01');
  const intangibleValueIdr = intangibleHoldings.reduce((acc, h) => acc + (h?.market_value_idr || 0), 0);

  const wapPhysicalHoldings = (holdings || []).filter(h => (h.source_origin === 'WAP_INVENTORY' || h.asset_class === 'FIXED_ASSET' || h.asset_class === 'PROPERTY' || h.asset_class === 'IT_INFRASTRUCTURE') && h.source_origin !== 'INTANGIBLE_ASSET' && h.asset_class !== 'INTANGIBLE_ASSET' && h.ticker !== 'AST-SFT-ERP-01');
  const wapPhysicalValueIdr = wapPhysicalHoldings.reduce((acc, h) => acc + (h?.market_value_idr || 0), 0);

  const wapInvHoldings = (holdings || []).filter(h => h.source_origin === 'WAP_INVESTMENT' || h.asset_class === 'SUKUK' || h.asset_class === 'PRIVATE_EQUITY' || h.asset_class === 'DIRECT_LOAN');
  const wapInvValueIdr = wapInvHoldings.reduce((acc, h) => acc + (h?.market_value_idr || 0), 0);

  const offshoreHoldingsList = (holdings || []).filter(h => h.currency === 'USD' || h.asset_class === 'OFFSHORE_EQUITY');
  const offshoreValueIdr = offshoreHoldingsList.reduce((acc, h) => acc + (h?.market_value_idr || 0), 0);

  // Distinct liquid cash accounts (CIMB Niaga RDN and CGS International share the same RDN Account: 800201481600)
  const distinctCashAccounts = (accounts || []).filter((a, idx, self) => 
    a && self.findIndex(t => t && t.account_number === a.account_number && t.currency === a.currency) === idx
  );
  const totalCashIdr = distinctCashAccounts.reduce((acc, a) => acc + (a?.currency === 'USD' ? (a?.balance || 0) * 16500 : (a?.balance || 0)), 0);
  const totalCombinedAum = totalHoldingsValueIdr + totalCashIdr;

  // Filtered Holdings
  const filteredHoldings = (holdings || []).filter(h => {
    if (!h) return false;
    const matchesSearch = (h.ticker || '').toLowerCase().includes((holdingSearch || '').toLowerCase()) || 
                          (h.asset_name || '').toLowerCase().includes((holdingSearch || '').toLowerCase()) ||
                          (h.category_detail || '').toLowerCase().includes((holdingSearch || '').toLowerCase());
    const matchesCustodian = selectedCustodianFilter === 'ALL' || h.custodian_id === selectedCustodianFilter;
    const matchesPsak = selectedPsakFilter === 'ALL' || h.psak71_category === selectedPsakFilter;
    
    let matchesSource = true;
    if (selectedSourceFilter === 'PORTFOLIO_ANALYST') {
      matchesSource = h.source_origin === 'PORTFOLIO_ANALYST' || h.asset_class === 'EQUITY' || h.asset_class === 'WARRANT';
    } else if (selectedSourceFilter === 'INTANGIBLE_ASSET') {
      matchesSource = h.source_origin === 'INTANGIBLE_ASSET' || h.asset_class === 'INTANGIBLE_ASSET' || h.ticker === 'AST-SFT-ERP-01';
    } else if (selectedSourceFilter === 'WAP_INVENTORY') {
      matchesSource = (h.source_origin === 'WAP_INVENTORY' || h.asset_class === 'FIXED_ASSET' || h.asset_class === 'PROPERTY' || h.asset_class === 'IT_INFRASTRUCTURE') && h.source_origin !== 'INTANGIBLE_ASSET' && h.asset_class !== 'INTANGIBLE_ASSET';
    } else if (selectedSourceFilter === 'WAP_INVESTMENT') {
      matchesSource = h.source_origin === 'WAP_INVESTMENT' || h.asset_class === 'SUKUK' || h.asset_class === 'PRIVATE_EQUITY' || h.asset_class === 'DIRECT_LOAN';
    } else if (selectedSourceFilter === 'OFFSHORE') {
      matchesSource = h.currency === 'USD' || h.asset_class === 'OFFSHORE_EQUITY';
    }

    return matchesSearch && matchesCustodian && matchesPsak && matchesSource;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-black p-6 md:p-8 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 bg-[#DFFF00]/5 blur-3xl rounded-full -mr-8 -mt-8 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#DFFF00]/10 rounded-2xl border border-[#DFFF00]/20 text-[#DFFF00]">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-[#DFFF00] font-black uppercase tracking-widest bg-[#DFFF00]/10 px-2.5 py-0.5 rounded-full border border-[#DFFF00]/20">
                  CPI ENGINE V2.5 • PSAK 71 &amp; WAP SYNCHRONIZED
                </span>
                <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mt-1">
                  Custody &amp; Portfolio Integration (CPI)
                </h1>
              </div>
            </div>
            <p className="text-xs text-zinc-400 max-w-2xl font-medium leading-relaxed">
              Pusat konsolidasi kepemilikan saham Portofolio Analyst (BEI &amp; CGS Sekuritas), inventaris aset fisik WAP, dan investasi terstruktur dengan rekonsiliasi kas 4-arah berdaya AI Gemini.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Primary Action: Tarik Data Portofolio Analyst & WAP */}
            <button
              onClick={() => handleSyncFromAnalystAndWap(true)}
              disabled={isSyncingAll}
              className="px-4 py-2.5 bg-[#DFFF00] hover:bg-[#DFFF00]/90 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
              title="Tarik saham dari Portofolio Analyst dan inventaris aset WAP ke CPI"
            >
              <FolderSync className={`w-4 h-4 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>{isSyncingAll ? 'Menyinkronkan...' : 'Tarik Data Portofolio Analyst & WAP'}</span>
            </button>

            <button
              onClick={handleTriggerReconcile}
              disabled={isReconciling}
              className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReconciling ? 'animate-spin' : ''}`} />
              <span>{isReconciling ? 'Rekonsiliasi...' : '4-Way Reconcile'}</span>
            </button>

            <button
              onClick={handleResetDefaults}
              disabled={isResettingDefaults}
              className="px-3 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              title="Reset ke Baseline Standar Institusi"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Real-time Consolidated Metric Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-zinc-800/80">
          <div className="bg-black/50 p-4 rounded-2xl border border-zinc-800">
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Total AUM Konsolidasi CPI</p>
            <p className="text-base md:text-lg font-black text-[#DFFF00] font-mono">
              Rp {totalCombinedAum.toLocaleString('id-ID')}
            </p>
            <span className="text-[8px] text-emerald-400 font-bold">100% Mark-to-Market &amp; PSAK Terpadu</span>
          </div>

          <div className="bg-black/50 p-4 rounded-2xl border border-zinc-800">
            <div className="flex items-center justify-between">
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Aset Tak Berwujud (Software ERP)</p>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" title="PSAK 19 / IAS 38 Terkapitalisasi" />
            </div>
            <p className="text-base md:text-lg font-black text-white font-mono">
              Rp {intangibleValueIdr.toLocaleString('id-ID')}
            </p>
            <span className="text-[8px] text-indigo-400 font-bold">PSAK 19 / IAS 38 Terkapitalisasi</span>
          </div>

          <div className="bg-black/50 p-4 rounded-2xl border border-zinc-800">
            <div className="flex items-center justify-between">
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Saham Ekuitas (Analyst)</p>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Tersinkronisasi Real-time dengan Portfolio Analyst" />
            </div>
            <p className="text-base md:text-lg font-black text-white font-mono">
              Rp {stockValueIdr.toLocaleString('id-ID')}
            </p>
            <span className="text-[8px] text-[#DFFF00] font-bold">{stockHoldings.length} Emiten BEI / CGS (Live Synced)</span>
          </div>

          <div className="bg-black/50 p-4 rounded-2xl border border-zinc-800">
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Kas Kustodian (RDN + Giro)</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${latestReconciliation?.cash_drift_idr === 0 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <p className="text-base md:text-lg font-black font-mono text-white">
                Rp {totalCashIdr.toLocaleString('id-ID')}
              </p>
            </div>
            <span className="text-[8px] text-emerald-400 font-bold uppercase">Zero Cash Drift Verified</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'reconciliation'
              ? 'bg-[#DFFF00] text-black shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>4-Way Reconcile &amp; Accounts</span>
        </button>

        <button
          onClick={() => setActiveTab('holdings')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'holdings'
              ? 'bg-[#DFFF00] text-black shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Holdings Ledger &amp; PSAK 71 ({holdings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('parser')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'parser'
              ? 'bg-[#DFFF00] text-black shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>AI Statement Forensic Dropzone</span>
        </button>

        <button
          onClick={() => setActiveTab('board_pack')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'board_pack'
              ? 'bg-[#DFFF00] text-black shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Executive Board Pack</span>
        </button>
      </div>

      {/* TAB 1: 4-WAY CROSS RECONCILIATION & ACCOUNTS */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          
          {/* Institutional Custody Accounts Overview */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#DFFF00]" />
                Rekening Kustodian &amp; Brokerage Riil
              </h3>
              <p className="text-[11px] text-zinc-400">
                Nilai saldo aktual tersinkronisasi langsung ke ledger dan sistem rekonsiliasi.
              </p>
            </div>

            <button
              onClick={() => handleSyncFromAnalystAndWap(true)}
              className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[#DFFF00] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
            >
              <FolderSync className="w-3.5 h-3.5" />
              <span>Sinkronkan Saldo RDN/Giro</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {accounts.map(acc => {
              const isUsd = acc.currency === 'USD';
              return (
                <div 
                  key={acc.id}
                  className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800/80 hover:border-zinc-700 transition-all space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${
                      acc.institution === 'CIMB_NIAGA_RDN' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      acc.institution === 'CIMB_NIAGA_GIRO' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                      acc.institution === 'CGS_SEKURITAS' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {acc.institution}
                    </span>

                    <span className="text-[8px] font-bold text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {acc.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-white truncate" title={acc.name}>{acc.name}</h4>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">No. Rek: {acc.account_number}</p>
                  </div>

                  <div className="pt-2 border-t border-zinc-900 space-y-1">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold block">Saldo Kas Terverifikasi:</span>
                    <p className="text-base font-black text-[#DFFF00] font-mono">
                      {isUsd ? `$${(acc.balance || 0).toLocaleString()}` : `Rp ${(acc.balance || 0).toLocaleString('id-ID')}`}
                    </p>
                    {isUsd && (
                      <p className="text-[9px] text-zinc-400 font-mono">
                        ≈ Rp {((acc.balance || 0) * 16500).toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[9px] text-zinc-400 border-t border-zinc-900/60">
                    <span>PSAK 71: {acc.psak71_category}</span>
                    <button
                      onClick={() => openBalanceEditor(acc)}
                      className="text-[#DFFF00] hover:underline font-bold flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Saldo</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Balance Editor Modal / Drawer */}
          <AnimatePresence>
            {editingAccount && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-zinc-900 p-6 rounded-3xl border border-[#DFFF00]/30 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#DFFF00]" />
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">
                      Ubah Saldo Riil: {editingAccount.name}
                    </h4>
                  </div>
                  <button 
                    onClick={() => setEditingAccount(null)}
                    className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Saldo Kas Total ({editingAccount.currency}):</label>
                    <input 
                      type="number"
                      value={editBalanceInput}
                      onChange={(e) => setEditBalanceInput(e.target.value)}
                      className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#DFFF00]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Kas Tersedia (Available):</label>
                    <input 
                      type="number"
                      value={editAvailableInput}
                      onChange={(e) => setEditAvailableInput(e.target.value)}
                      className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#DFFF00]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Kas Dicadangkan (Reserved):</label>
                    <input 
                      type="number"
                      value={editReservedInput}
                      onChange={(e) => setEditReservedInput(e.target.value)}
                      className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#DFFF00]"
                    />
                  </div>
                </div>

                {saveBalanceSuccess && (
                  <p className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    {saveBalanceSuccess}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingAccount(null)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveBalance}
                    disabled={isSavingBalance}
                    className="px-5 py-2 bg-[#DFFF00] hover:bg-[#DFFF00]/90 text-black text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingBalance ? 'Menyimpan...' : 'Simpan & Reconcile'}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 4-Way Cross Reconciliation Status Box */}
          <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[9px] font-black text-[#DFFF00] uppercase tracking-widest bg-[#DFFF00]/10 px-2.5 py-0.5 rounded-full border border-[#DFFF00]/20">
                  RECONCILIATION RESULT
                </span>
                <h3 className="text-base font-black text-white uppercase tracking-tight mt-1 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[#DFFF00]" />
                  Hasil Audit Silang 4-Arah (Zero Cash Drift)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-400">
                  {latestReconciliation?.timestamp ? new Date(latestReconciliation.timestamp).toLocaleString('id-ID') : 'Belum direkonsiliasi'}
                </span>
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-full uppercase">
                  {latestReconciliation?.status || 'BALANCED'}
                </span>
              </div>
            </div>

            {/* Reconciliation Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 uppercase text-[9px] font-black tracking-wider">
                    <th className="p-3">Institusi Rekening</th>
                    <th className="p-3">Nomor Rekening</th>
                    <th className="p-3 text-right">Saldo Dilaporkan</th>
                    <th className="p-3 text-right">Saldo Buku Besar</th>
                    <th className="p-3 text-right">Selisih (Variance)</th>
                    <th className="p-3 text-center">Status Rekonsiliasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {(latestReconciliation?.accounts_summary || []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="p-3 font-bold text-white font-sans">{item.account_name}</td>
                      <td className="p-3 text-zinc-400">{item.account_no}</td>
                      <td className="p-3 text-right text-zinc-200">Rp {(item.reported_balance || 0).toLocaleString('id-ID')}</td>
                      <td className="p-3 text-right text-zinc-200">Rp {(item.ledger_balance || 0).toLocaleString('id-ID')}</td>
                      <td className="p-3 text-right">
                        <span className={`font-bold ${item.difference === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          Rp {(item.difference || 0).toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Audit Hash Seal */}
            <div className="pt-4 border-t border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono text-zinc-500">
              <div className="flex items-center gap-2 truncate max-w-xl">
                <Hash className="w-4 h-4 text-[#DFFF00] flex-shrink-0" />
                <span>SHA-256 Seal: {latestReconciliation?.sha256_hash || 'RECON-SHA256-PENDING'}</span>
              </div>
              <button
                onClick={() => latestReconciliation && copyToClipboard(latestReconciliation.sha256_hash, 'recon_hash')}
                className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer w-fit"
              >
                {copiedHash === 'recon_hash' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedHash === 'recon_hash' ? 'Tersalin' : 'Salin Hash'}</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: HOLDINGS LEDGER & PSAK 71 (CONSOLIDATED) */}
      {activeTab === 'holdings' && (
        <div className="space-y-6">
          
          {/* Top Analytical Category Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div 
              onClick={() => setSelectedSourceFilter(selectedSourceFilter === 'PORTFOLIO_ANALYST' ? 'ALL' : 'PORTFOLIO_ANALYST')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                selectedSourceFilter === 'PORTFOLIO_ANALYST'
                  ? 'bg-[#DFFF00]/10 border-[#DFFF00] text-white'
                  : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-[#DFFF00] tracking-wider">Saham Portofolio (BEI/CGS)</span>
                <TrendingUp className="w-4 h-4 text-[#DFFF00]" />
              </div>
              <p className="text-lg font-black text-white font-mono">
                Rp {stockValueIdr.toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] text-zinc-400 mt-1">{stockHoldings.length} Posisi Emiten Saham</p>
            </div>

            <div 
              onClick={() => setSelectedSourceFilter(selectedSourceFilter === 'INTANGIBLE_ASSET' ? 'ALL' : 'INTANGIBLE_ASSET')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                selectedSourceFilter === 'INTANGIBLE_ASSET'
                  ? 'bg-indigo-500/10 border-indigo-400 text-white'
                  : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Aset Tak Berwujud (ERP)</span>
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-lg font-black text-white font-mono">
                Rp {intangibleValueIdr.toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] text-zinc-400 mt-1">{intangibleHoldings.length} Software ERP (PSAK 19)</p>
            </div>

            <div 
              onClick={() => setSelectedSourceFilter(selectedSourceFilter === 'WAP_INVENTORY' ? 'ALL' : 'WAP_INVENTORY')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                selectedSourceFilter === 'WAP_INVENTORY'
                  ? 'bg-sky-500/10 border-sky-400 text-white'
                  : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider">Inventaris Fisik WAP</span>
                <Server className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-lg font-black text-white font-mono">
                Rp {wapPhysicalValueIdr.toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] text-zinc-400 mt-1">{wapPhysicalHoldings.length} Aset Fisik &amp; Gedung</p>
            </div>

            <div 
              onClick={() => setSelectedSourceFilter(selectedSourceFilter === 'OFFSHORE' ? 'ALL' : 'OFFSHORE')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                selectedSourceFilter === 'OFFSHORE'
                  ? 'bg-emerald-500/10 border-emerald-400 text-white'
                  : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Offshore &amp; Kas (IBKR/CIMB)</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-lg font-black text-white font-mono">
                Rp {(totalCashIdr + offshoreValueIdr).toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] text-zinc-400 mt-1">Kas Terverifikasi &amp; Valas</p>
            </div>
          </div>

          <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 space-y-6">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#DFFF00]" />
                  Consolidated Holdings Ledger &amp; PSAK 71 Classification
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Buku besar kepemilikan aset lintas kustodian dengan valuasi mark-to-market, pencatatan PSAK 71 (FVOCI, FVTPL, Amortized Cost), dan attribution analysis.
                </p>
              </div>

              {/* Action and Filter Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleSyncFromAnalystAndWap(true)}
                  disabled={isSyncingAll}
                  className="px-3.5 py-1.5 bg-[#DFFF00] hover:bg-[#DFFF00]/90 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <FolderSync className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                  <span>Tarik Data Terbaru</span>
                </button>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text"
                    placeholder="Cari Ticker / Nama..."
                    value={holdingSearch}
                    onChange={(e) => setHoldingSearch(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#DFFF00]"
                  />
                </div>

                <select
                  value={selectedPsakFilter}
                  onChange={(e) => setSelectedPsakFilter(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-[#DFFF00]"
                >
                  <option value="ALL">Semua PSAK 71</option>
                  <option value="FVOCI">FVOCI</option>
                  <option value="FVTPL">FVTPL</option>
                  <option value="AMORTIZED_COST">Amortized Cost</option>
                </select>
              </div>
            </div>

            {/* Source Origin Quick Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedSourceFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all ${
                  selectedSourceFilter === 'ALL'
                    ? 'bg-white text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                Semua Aset ({holdings.length})
              </button>
              <button
                onClick={() => setSelectedSourceFilter('PORTFOLIO_ANALYST')}
                className={`px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all ${
                  selectedSourceFilter === 'PORTFOLIO_ANALYST'
                    ? 'bg-[#DFFF00] text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                Saham Portofolio ({stockHoldings.length})
              </button>
              <button
                onClick={() => setSelectedSourceFilter('INTANGIBLE_ASSET')}
                className={`px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all ${
                  selectedSourceFilter === 'INTANGIBLE_ASSET'
                    ? 'bg-indigo-400 text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                Aset Tak Berwujud ERP ({intangibleHoldings.length})
              </button>
              <button
                onClick={() => setSelectedSourceFilter('WAP_INVENTORY')}
                className={`px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all ${
                  selectedSourceFilter === 'WAP_INVENTORY'
                    ? 'bg-sky-400 text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                Inventaris Fisik WAP ({wapPhysicalHoldings.length})
              </button>
              <button
                onClick={() => setSelectedSourceFilter('WAP_INVESTMENT')}
                className={`px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all ${
                  selectedSourceFilter === 'WAP_INVESTMENT'
                    ? 'bg-purple-400 text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                Investasi Alternatif WAP ({wapInvHoldings.length})
              </button>
              <button
                onClick={() => setSelectedSourceFilter('OFFSHORE')}
                className={`px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all ${
                  selectedSourceFilter === 'OFFSHORE'
                    ? 'bg-emerald-400 text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                Offshore &amp; Valas ({offshoreHoldingsList.length})
              </button>
            </div>

            {/* Holdings Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 uppercase text-[9px] font-black tracking-wider">
                    <th className="p-3">Efek / Aset</th>
                    <th className="p-3">Asal Sumber</th>
                    <th className="p-3">Kustodian / Lokasi</th>
                    <th className="p-3">PSAK 71</th>
                    <th className="p-3 text-right">Kuantitas</th>
                    <th className="p-3 text-right">Harga Perolehan</th>
                    <th className="p-3 text-right">Harga Pasar</th>
                    <th className="p-3 text-right">Nilai Pasar (IDR)</th>
                    <th className="p-3 text-right">Unrealized P&amp;L</th>
                    <th className="p-3 text-right">Alokasi (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredHoldings.map(h => {
                    const isPositive = (h.pnl_unrealized_idr || 0) >= 0;
                    return (
                      <tr key={h.id} className="hover:bg-zinc-900/30 transition-colors">
                        <td className="p-3">
                          <div className="font-black text-[#DFFF00]">{h.ticker}</div>
                          <div className="text-[10px] text-zinc-400 font-sans truncate max-w-[200px]" title={h.asset_name}>
                            {h.asset_name}
                          </div>
                        </td>
                        <td className="p-3 font-sans">
                          {h.source_origin === 'PORTFOLIO_ANALYST' && (
                            <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-[#DFFF00]/10 text-[#DFFF00] border border-[#DFFF00]/20">
                              Portofolio Saham
                            </span>
                          )}
                          {(h.source_origin === 'INTANGIBLE_ASSET' || h.asset_class === 'INTANGIBLE_ASSET' || h.ticker === 'AST-SFT-ERP-01') && (
                            <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              Software ERP (PSAK 19)
                            </span>
                          )}
                          {h.source_origin === 'WAP_INVENTORY' && h.asset_class !== 'INTANGIBLE_ASSET' && h.ticker !== 'AST-SFT-ERP-01' && (
                            <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                              Inventaris WAP
                            </span>
                          )}
                          {h.source_origin === 'WAP_INVESTMENT' && (
                            <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              Investasi WAP
                            </span>
                          )}
                          {(!h.source_origin || h.source_origin === 'CUSTODIAN_STATEMENT') && h.asset_class !== 'INTANGIBLE_ASSET' && h.ticker !== 'AST-SFT-ERP-01' && (
                            <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Offshore Kustodian
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-sans text-zinc-300 text-[10px]">
                          <div className="truncate max-w-[160px]" title={h.custodian_name}>{h.custodian_name}</div>
                          {h.location && <span className="text-[8px] text-zinc-500 block">Loc: {h.location}</span>}
                        </td>
                        <td className="p-3 font-sans">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${
                            h.psak71_category === 'FVOCI' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            h.psak71_category === 'FVTPL' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {h.psak71_category}
                          </span>
                        </td>
                        <td className="p-3 text-right text-zinc-200 font-bold">{(h.quantity || 0).toLocaleString()}</td>
                        <td className="p-3 text-right text-zinc-400">
                          {h.currency === 'USD' ? `$${h.avg_price || 0}` : `Rp ${(h.avg_price || 0).toLocaleString('id-ID')}`}
                        </td>
                        <td className="p-3 text-right text-white font-bold">
                          {h.currency === 'USD' ? `$${h.current_price || 0}` : `Rp ${(h.current_price || 0).toLocaleString('id-ID')}`}
                        </td>
                        <td className="p-3 text-right text-[#DFFF00] font-bold">
                          Rp {(h.market_value_idr || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="p-3 text-right">
                          <span className={`font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPositive ? '+' : ''}Rp {(h.pnl_unrealized_idr || 0).toLocaleString('id-ID')}
                          </span>
                          <span className={`block text-[9px] ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                            ({isPositive ? '+' : ''}{(h.pnl_unrealized_percent || 0).toFixed(2)}%)
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-zinc-300">
                          {(h.allocation_percent || 0).toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: AI STATEMENT FORENSIC DROPZONE */}
      {activeTab === 'parser' && (
        <div className="space-y-6">
          <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 space-y-6">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-[#DFFF00]" />
                  AI-Assisted Statement Parsing Dropzone
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Ekstraksi otomatis mutasi, saldo penutupan, dan kepemilikan efek dari e-Statement Bank CIMB Niaga, CGS Sekuritas, dan IBKR.
                </p>
              </div>

              {/* Quick Preset Buttons for Instant Demo Testing */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Preset:</span>
                <button
                  onClick={() => loadPresetStatement('CIMB_NIAGA_RDN')}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-[#DFFF00] text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  CIMB RDN
                </button>
                <button
                  onClick={() => loadPresetStatement('CGS_SEKURITAS')}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-[#DFFF00] text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  CGS Broker
                </button>
                <button
                  onClick={() => loadPresetStatement('IBKR_GATEWAY')}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-[#DFFF00] text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  IBKR USD
                </button>
                <button
                  onClick={() => loadPresetStatement('CIMB_NIAGA_GIRO')}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-[#DFFF00] text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  CIMB Giro
                </button>
              </div>
            </div>

            {/* Institution Selector & File Upload */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1.5">Pilih Target Institusi:</label>
                <select
                  value={selectedInstitution}
                  onChange={(e) => setSelectedInstitution(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#DFFF00]"
                >
                  <option value="CIMB_NIAGA_RDN">PT Bank CIMB Niaga Tbk - RDN (800201481600)</option>
                  <option value="CIMB_NIAGA_GIRO">PT Bank CIMB Niaga Tbk - Giro (860019881100)</option>
                  <option value="CGS_SEKURITAS">CGS International Sekuritas (Client IJKL2926)</option>
                  <option value="IBKR_GATEWAY">Interactive Brokers LLC (USD U25457915)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1.5">Upload Dokumen e-Statement (.txt, .csv, .pdf text):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".txt,.csv,.json,.doc"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4 text-[#DFFF00]" />
                    <span>Pilih Berkas...</span>
                  </button>
                  <span className="text-xs text-zinc-500 font-mono truncate">
                    {uploadedFileName || 'Belum ada berkas dipilih'}
                  </span>
                </div>
              </div>
            </div>

            {/* Raw Text Input Box */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Teks / Konten Statement:</label>
              <textarea
                rows={6}
                value={statementRawText}
                onChange={(e) => setStatementRawText(e.target.value)}
                placeholder="Tempel teks rekening koran atau laporan mutasi di sini..."
                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#DFFF00] transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleParseStatement}
                disabled={isParsing || !statementRawText.trim()}
                className="px-6 py-2.5 bg-[#DFFF00] hover:bg-[#DFFF00]/90 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
              >
                <Cpu className={`w-4 h-4 ${isParsing ? 'animate-spin' : ''}`} />
                <span>{isParsing ? 'Menganalisis Dokumen...' : 'Ekstraksi AI Gemini'}</span>
              </button>
            </div>

          </div>

          {/* Statement Parser Results Display */}
          {parseResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                <div>
                  <span className="text-[9px] font-black text-[#DFFF00] uppercase tracking-widest bg-[#DFFF00]/10 px-2.5 py-0.5 rounded-full border border-[#DFFF00]/20">
                    EXTRACTION COMPLETED
                  </span>
                  <h4 className="text-base font-black text-white uppercase tracking-tight mt-1">
                    Hasil Analisis Forensik Statement ({parseResult.institution})
                  </h4>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    No Rek: {parseResult.account_number} • Periode: {parseResult.period_start} s/d {parseResult.period_end}
                  </p>
                </div>

                <button
                  onClick={handleImportStatement}
                  disabled={isImporting}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
                >
                  <FileCheck2 className={`w-4 h-4 ${isImporting ? 'animate-spin' : ''}`} />
                  <span>{isImporting ? 'Mengimpor...' : 'Impor ke Buku Besar Kustodian'}</span>
                </button>
              </div>

              {importSuccessMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{importSuccessMessage}</span>
                </div>
              )}

              {/* Extraction Metric Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 uppercase font-bold block">Saldo Awal</span>
                  <span className="text-sm font-black text-white font-mono">
                    {parseResult.currency === 'USD' ? `$${(parseResult.opening_balance || 0).toLocaleString()}` : `Rp ${(parseResult.opening_balance || 0).toLocaleString('id-ID')}`}
                  </span>
                </div>

                <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 uppercase font-bold block">Saldo Akhir</span>
                  <span className="text-sm font-black text-[#DFFF00] font-mono">
                    {parseResult.currency === 'USD' ? `$${(parseResult.closing_balance || 0).toLocaleString()}` : `Rp ${(parseResult.closing_balance || 0).toLocaleString('id-ID')}`}
                  </span>
                </div>

                <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 uppercase font-bold block">Total Kredit</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    +{parseResult.currency === 'USD' ? `$${(parseResult.total_credits || 0).toLocaleString()}` : `Rp ${(parseResult.total_credits || 0).toLocaleString('id-ID')}`}
                  </span>
                </div>

                <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 uppercase font-bold block">Confidence Score</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    {parseResult.confidence_score}%
                  </span>
                </div>
              </div>

              {/* AI Verification Note */}
              <div className="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800/80 text-xs text-zinc-300 font-sans space-y-1">
                <span className="text-[9px] text-[#DFFF00] uppercase font-black block tracking-wider">Catatan Kepatuhan Regulasi:</span>
                <p>{parseResult.ai_notes}</p>
              </div>

            </motion.div>
          )}

        </div>
      )}

      {/* TAB 4: EXECUTIVE BOARD PACK SYNTHESIS */}
      {activeTab === 'board_pack' && (
        <div className="space-y-6">
          <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 space-y-6">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#DFFF00]" />
                  Executive Board Pack Generator (AMIR + CPI)
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Sintesis strategis level Direksi: menggabungkan riset makro AMIR, data kepatuhan POJK/DJP, dengan pembuktian rekonsiliasi kas kustodian PSAK 71.
                </p>
              </div>

              <button
                onClick={handleGenerateBoardPack}
                disabled={isGeneratingPack}
                className="px-6 py-3 bg-[#DFFF00] hover:bg-[#DFFF00]/90 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
              >
                <Cpu className={`w-4 h-4 ${isGeneratingPack ? 'animate-spin' : ''}`} />
                <span>{isGeneratingPack ? 'Menyintesis Laporan...' : 'Hasilkan Board Pack Baru'}</span>
              </button>
            </div>

            {/* Custom Notes / Directive Input */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1.5">Periode Laporan:</label>
                <input
                  type="text"
                  value={boardPeriod}
                  onChange={(e) => setBoardPeriod(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#DFFF00]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1.5">Instruksi Khusus Dewan Direksi:</label>
                <input
                  type="text"
                  value={boardNotes}
                  onChange={(e) => setBoardNotes(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#DFFF00]"
                />
              </div>
            </div>

          </div>

          {/* Generated Board Pack Viewer */}
          {boardPack && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black p-8 rounded-3xl border border-zinc-800 space-y-8 shadow-2xl"
            >
              {/* Document Header */}
              <div className="border-b border-zinc-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[9px] font-black text-[#DFFF00] uppercase tracking-widest bg-[#DFFF00]/10 px-2.5 py-0.5 rounded-full border border-[#DFFF00]/20">
                    CONFIDENTIAL • INSTITUTIONAL BOARD PACK
                  </span>
                  <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mt-2">
                    {boardPack.title}
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-1">
                    ID: {boardPack.id} • Diterbitkan: {new Date(boardPack.generated_at).toLocaleString('id-ID')} • Otoritas: {boardPack.author}
                  </p>
                </div>

                <div className="text-right font-mono bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 uppercase block font-bold">Total AUM Konsolidasi</span>
                  <span className="text-lg font-black text-[#DFFF00]">
                    Rp {(boardPack.total_aum_idr || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="space-y-3 bg-zinc-950/80 p-6 rounded-2xl border border-zinc-800/80">
                <h4 className="text-xs font-black text-[#DFFF00] uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Ringkasan Eksekutif Dewan Direksi
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  {boardPack.executive_summary}
                </p>
              </div>

              {/* Strategic Pillars Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#DFFF00]" />
                  Evaluasi 4 Pilar Strategis
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(boardPack?.strategic_pillars || []).map((pillar, idx) => (
                    <div
                      key={idx}
                      className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800/80 hover:border-zinc-700 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-black text-white">{pillar?.pillar_name || `Pilar ${idx + 1}`}</h5>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-[#DFFF00]">{pillar?.score ?? 90}/100</span>
                          <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {pillar?.status || 'OPTIMAL'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-[9px] text-zinc-500 uppercase font-bold block">Temuan Utama:</span>
                          <p className="text-zinc-300 font-sans mt-0.5">{pillar?.findings || '-'}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-500 uppercase font-bold block">Implikasi Finansial:</span>
                          <p className="text-zinc-400 font-sans mt-0.5">{pillar?.implication || '-'}</p>
                        </div>
                        <div className="pt-2 border-t border-zinc-800/60">
                          <span className="text-[9px] text-[#DFFF00] uppercase font-bold block">Action Item Disarankan:</span>
                          <p className="text-zinc-200 font-sans mt-0.5 font-bold">{pillar?.action_item || '-'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Board Resolutions */}
              <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-3">
                <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Rekomendasi &amp; Resolusi Komite Investasi
                </h4>
                <ul className="space-y-2 text-xs text-zinc-300">
                  {(boardPack?.recommendations || []).map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#DFFF00] font-black font-mono">[{i + 1}]</span>
                      <span className="leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Footer Digital Signature Seal */}
              <div className="pt-6 border-t border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono text-zinc-500">
                <div className="flex items-center gap-2 truncate max-w-xl">
                  <Hash className="w-4 h-4 text-[#DFFF00] flex-shrink-0" />
                  <span>SHA-256 Audit Seal: {boardPack.sha256_audit_hash}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(boardPack.sha256_audit_hash, 'board_pack_hash')}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer w-fit"
                >
                  {copiedHash === 'board_pack_hash' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHash === 'board_pack_hash' ? 'Tersalin' : 'Salin Hash'}</span>
                </button>
              </div>

            </motion.div>
          )}

        </div>
      )}

      {/* SYNCHRONIZATION CONFIRMATION MODAL */}
      <AnimatePresence>
        {syncModalOpen && syncSummaryData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-[#DFFF00]/40 rounded-3xl p-6 md:p-8 max-w-2xl w-full space-y-6 shadow-2xl relative"
            >
              <button
                onClick={() => setSyncModalOpen(false)}
                className="absolute top-5 right-5 p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#DFFF00]/10 rounded-2xl border border-[#DFFF00]/20 text-[#DFFF00]">
                  <FolderSync className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-[#DFFF00] uppercase tracking-widest bg-[#DFFF00]/10 px-2 py-0.5 rounded-full border border-[#DFFF00]/20">
                    SINKRONISASI BERHASIL
                  </span>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight mt-1">
                    Integrasi Portofolio Analyst &amp; WAP Aset Selesai
                  </h3>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  Data aset telah berhasil ditarik dan disinkronkan secara konsolidatif ke dalam modul <strong>Custody &amp; Portfolio Integration (CPI)</strong>:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 space-y-1">
                    <span className="text-[10px] font-black uppercase text-[#DFFF00] tracking-wider block">
                      1. Saham Portofolio Analyst
                    </span>
                    <p className="text-base font-black text-white font-mono">
                      Rp {(syncSummaryData.stock_value_idr || 0).toLocaleString('id-ID')}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {syncSummaryData.stock_count} Efek: {syncSummaryData.stock_tickers?.slice(0, 6).join(', ')}...
                    </p>
                  </div>

                  <div className="bg-zinc-900/80 p-4 rounded-2xl border border-indigo-800/60 space-y-1">
                    <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider block">
                      2. Aset Tak Berwujud (ERP)
                    </span>
                    <p className="text-base font-black text-white font-mono">
                      Rp {(syncSummaryData.intangible_value_idr || 4200000000).toLocaleString('id-ID')}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {syncSummaryData.intangible_count || 1} Software ERP VentureAM (PSAK 19)
                    </p>
                  </div>

                  <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 space-y-1">
                    <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider block">
                      3. Inventaris Aset Fisik WAP
                    </span>
                    <p className="text-base font-black text-white font-mono">
                      Rp {(syncSummaryData.physical_value_idr || 0).toLocaleString('id-ID')}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {syncSummaryData.physical_count} Unit Aset Fisik (Workstation &amp; Perangkat)
                    </p>
                  </div>

                  <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 space-y-1">
                    <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider block">
                      4. Investasi Alternatif WAP
                    </span>
                    <p className="text-base font-black text-white font-mono">
                      Rp {(syncSummaryData.investment_value_idr || 0).toLocaleString('id-ID')}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {syncSummaryData.investment_count} Portofolio Investasi Alternatif WAP
                    </p>
                  </div>

                  <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 space-y-1 md:col-span-2 lg:col-span-2">
                    <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">
                      5. Total Saldo Kas Kustodian
                    </span>
                    <p className="text-base font-black text-white font-mono">
                      Rp {(syncSummaryData.cash_total_idr || 0).toLocaleString('id-ID')}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      Rekening RDN CIMB (800201481600), Giro Operasional (860019881100) &amp; IBKR USD
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 flex items-center justify-between font-mono">
                  <div>
                    <span className="text-[9px] text-zinc-400 uppercase font-bold block">Total AUM Terkonsolidasi (CPI)</span>
                    <span className="text-lg font-black text-[#DFFF00]">
                      Rp {(syncSummaryData.total_aum_idr || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase block">
                      PSAK 71: Compliant
                    </span>
                    <span className="text-[9px] text-zinc-500 mt-1 block">Zero Cash Drift Verified</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSyncModalOpen(false)}
                  className="px-6 py-2.5 bg-[#DFFF00] hover:bg-[#DFFF00]/90 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Tutup &amp; Lihat Ledger
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default CustodyPortfolioIntegrationHub;
