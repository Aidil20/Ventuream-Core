import React, { useState, useMemo, useEffect } from 'react';
import {
  Building,
  Cpu,
  Server,
  Wrench,
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PieChart as PieChartIcon,
  BarChart2,
  UserCheck,
  RefreshCw,
  FileText,
  Download,
  ChevronDown,
  Layers,
  X,
  ArrowUpRight,
  ShieldCheck,
  Box,
  Trash2,
  Edit3,
  Sliders,
  ClipboardList,
  Laptop,
  Car,
  HardDrive,
  TrendingUp,
  Coins,
  Briefcase,
  Handshake,
  Scale,
  FileSpreadsheet,
  Check,
  DollarSign,
  Globe,
  Percent,
  Landmark,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Data Structures
export interface AssetData {
  id: string;
  code: string;
  name: string;
  category: 'Properti & Gedung' | 'Mesin & Genset' | 'Inventaris IT & Server' | 'Kendaraan Operasional' | 'Peralatan Kantor';
  location: 'HQ Jakarta SCBD' | 'Data Center BSD' | 'Branch Surabaya' | 'Colo Server SG';
  condition: 'Baik / Operasional' | 'Pemeliharaan Rutin' | 'Butuh Perbaikan' | 'Afkir / Replacement';
  valuation: number; // IDR
  purchaseDate: string;
  lastMaintenance: string;
  nextMaintenance: string;
  assignedTo: string;
  borrowStatus: 'Tersedia' | 'Dipinjam' | 'In-Service';
  serialNumber: string;
}

export interface InvestmentAsset {
  id: string;
  code: string; // Ticker e.g. SUKUK-ST011, OBL-FR0082, PVT-TEKNO, LOAN-CV-MANDIRI, BBCA, TLKM
  name: string; // e.g., Sukuk Ritel ST011, Saham PT Inovasi, Pinjaman CV Berkah
  category: 'Sukuk & Obligasi' | 'Private Equity / Saham Private' | 'Pinjaman Usaha / Direct Loan' | 'Saham / Portofolio Saham' | 'Lainnya';
  issuerOrEntity: string; // e.g. Kemenkeu RI, PT Inovasi Digital, CV Mandiri Utama
  principalValuation: number; // IDR nominal
  currentValuation: number; // IDR current value
  yieldOrInterestRate: number; // % per annum e.g. 6.5
  payoutFrequency: 'Bulanan' | 'Triwulan' | 'Semesteran' | 'Tahunan' | 'At Maturity';
  purchaseDate: string;
  maturityDate: string; // Maturity date
  status: 'Aktif' | 'Lunas / Matured' | 'Restrukturisasi' | 'In Default';
  contractNumber: string; // Certificate / Contract / Deed No.
  notes: string;
  syncToPortfolio: boolean; // default true
}

export interface WapAssetManagementProps {
  portfolioData?: any[];
}

const getPortfolioStockAssets = (sourceData: any[]): InvestmentAsset[] => {
  if (!sourceData || !Array.isArray(sourceData)) return [];

  const stockOnly = sourceData.filter(item => 
    !item.isCustomInvestment && 
    !item.ticker.startsWith('SUKUK-') && 
    !item.ticker.startsWith('OBL-') && 
    !item.ticker.startsWith('PVT-') && 
    !item.ticker.startsWith('LOAN-')
  );

  return stockOnly.map(stock => {
    const cleanTicker = (stock.ticker || '').replace('.JK', '');
    const lots = stock.lots || 0;
    const avgPrice = stock.averagePrice || 0;
    const currentPrice = stock.marketPrice || stock.currentPrice || avgPrice;
    const principalValuation = lots * avgPrice * 100;
    const currentValuation = stock.marketValue || (lots * currentPrice * 100);
    const yieldRate = principalValuation > 0 
      ? ((currentValuation - principalValuation) / principalValuation) * 100 
      : (stock.dailyChange || stock.change || 0);

    return {
      id: `STK-${cleanTicker}`,
      code: cleanTicker,
      name: `Saham ${cleanTicker} (Portofolio Analisis)`,
      category: 'Saham / Portofolio Saham' as const,
      issuerOrEntity: `PT ${cleanTicker} Tbk / CGS International`,
      principalValuation,
      currentValuation,
      yieldOrInterestRate: parseFloat(yieldRate.toFixed(2)),
      payoutFrequency: 'At Maturity' as const,
      purchaseDate: '2025-01-01',
      maturityDate: 'N/A (Pasar Saham)',
      status: 'Aktif' as const,
      contractNumber: `CGS-REK-INDEP-${cleanTicker}`,
      notes: `SINKRONISASI OTOMATIS PORTOFOLIO ANALISIS: ${lots} Lot @ Rp ${avgPrice.toLocaleString('id-ID')}`,
      syncToPortfolio: true
    };
  });
};

export interface MaintenanceTask {
  id: string;
  assetId: string;
  assetName: string;
  category: string;
  location: string;
  type: 'Preventive Maintenance' | 'PerbaikanDarurat' | 'Kalibrasi Rutin' | 'Inspeksi Fisik';
  scheduledDate: string;
  technician: string;
  priority: 'Tinggi' | 'Sedang' | 'Rendah';
  status: 'Pending' | 'In Progress' | 'Selesai';
  notes: string;
}

export interface BorrowRecord {
  id: string;
  assetId: string;
  assetName: string;
  borrowerName: string;
  department: string;
  checkoutDate: string;
  expectedReturnDate: string;
  status: 'Dipinjam' | 'Tepat Waktu' | 'Terlambat' | 'Dikembalikan';
  purpose: string;
}

// Initial Datasets (Empty by default for manual user input)
const INITIAL_INVESTMENTS: InvestmentAsset[] = [];
const INITIAL_ASSETS: AssetData[] = [];
const INITIAL_MAINTENANCE_TASKS: MaintenanceTask[] = [];
const INITIAL_BORROW_RECORDS: BorrowRecord[] = [];

// Color palette matching VentureAM luxury dark style
const CATEGORY_COLORS: Record<string, string> = {
  'Sukuk & Obligasi': '#38bdf8', // Sky
  'Private Equity / Saham Private': '#10b981', // Emerald
  'Pinjaman Usaha / Direct Loan': '#a855f7', // Purple
  'Saham / Portofolio Saham': '#DFFF00', // Lime VAM Accent
  'Properti & Gedung': '#f59e0b', // Amber
  'Mesin & Genset': '#ec4899', // Pink
  'Inventaris IT & Server': '#06b6d4', // Cyan
  'Kendaraan Operasional': '#6366f1', // Indigo
  'Peralatan Kantor': '#94a3b8'  // Slate
};

const CONDITION_COLORS: Record<string, string> = {
  'Baik / Operasional': '#10b981', // Emerald
  'Pemeliharaan Rutin': '#3b82f6', // Blue
  'Butuh Perbaikan': '#f59e0b', // Amber
  'Afkir / Replacement': '#f43f5e' // Rose
};

const formatValuationIDR = (val: number) => {
  if (val >= 1_000_000_000) {
    return `Rp ${(val / 1_000_000_000).toFixed(2)} M`;
  }
  return `Rp ${Math.round(val).toLocaleString('id-ID')}`;
};

export const WapAssetManagement: React.FC<WapAssetManagementProps> = ({ portfolioData }) => {
  // State Management with LocalStorage Persistence
  const [assets, setAssets] = useState<AssetData[]>(() => {
    try {
      const saved = localStorage.getItem('vam_wap_assets_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_ASSETS;
  });

  const [investmentAssets, setInvestmentAssets] = useState<InvestmentAsset[]>(() => {
    try {
      const saved = localStorage.getItem('vam_investment_assets_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_INVESTMENTS;
  });

  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>(() => {
    try {
      const saved = localStorage.getItem('vam_wap_maintenance_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_MAINTENANCE_TASKS;
  });

  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>(() => {
    try {
      const saved = localStorage.getItem('vam_wap_borrow_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_BORROW_RECORDS;
  });

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('vam_wap_assets_v3', JSON.stringify(assets));
    } catch (e) {
      console.error(e);
    }
  }, [assets]);

  useEffect(() => {
    try {
      localStorage.setItem('vam_wap_maintenance_v3', JSON.stringify(maintenanceTasks));
    } catch (e) {
      console.error(e);
    }
  }, [maintenanceTasks]);

  useEffect(() => {
    try {
      localStorage.setItem('vam_wap_borrow_v3', JSON.stringify(borrowRecords));
    } catch (e) {
      console.error(e);
    }
  }, [borrowRecords]);

  // AUTOMATIC SYNC TO CENTRAL CGS / VAM PORTFOLIO
  const syncInvestmentsToPortfolio = (investmentsList: InvestmentAsset[]) => {
    try {
      localStorage.setItem('vam_investment_assets_v3', JSON.stringify(investmentsList));

      const currentCgsSaved = localStorage.getItem('cgsAssets_v3');
      let currentCgsAssets: any[] = currentCgsSaved ? JSON.parse(currentCgsSaved) : [];

      // Filter out previous custom investments
      const stockOnly = currentCgsAssets.filter((item: any) => 
        !item.isCustomInvestment && 
        !item.ticker.startsWith('SUKUK-') && 
        !item.ticker.startsWith('OBL-') && 
        !item.ticker.startsWith('PVT-') && 
        !item.ticker.startsWith('LOAN-')
      );

      // Map enabled investment assets into CGS Portfolio format
      const syncedItems = investmentsList
        .filter(inv => inv.syncToPortfolio)
        .map(inv => {
          const val = inv.currentValuation || inv.principalValuation || 0;
          return {
            ticker: inv.code,
            lots: 1,
            averagePrice: val / 100, // CGS lot multiplier is 100, so 1 * 100 * (val/100) = total valuation IDR
            marketPrice: val / 100,
            isCustomInvestment: true,
            customCategory: inv.category,
            customName: inv.name,
            yieldRate: inv.yieldOrInterestRate
          };
        });

      const updatedCgs = [...stockOnly, ...syncedItems];
      const updatedCgsStr = JSON.stringify(updatedCgs);
      if (updatedCgsStr !== currentCgsSaved) {
        localStorage.setItem('cgsAssets_v3', updatedCgsStr);
        window.dispatchEvent(new CustomEvent('vam-cgs-update'));
      }
    } catch (err) {
      console.error("Error syncing investments to portfolio:", err);
    }
  };

  // Sync when investmentAssets change
  useEffect(() => {
    syncInvestmentsToPortfolio(investmentAssets);
  }, [investmentAssets]);

  // Active View Tab inside WAP Asset Center
  const [activeTab, setActiveTab] = useState<'investments' | 'inventory' | 'overview' | 'maintenance' | 'borrowing'>('investments');
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedInvestmentType, setSelectedInvestmentType] = useState<string>('Semua');
  const [selectedLocation, setSelectedLocation] = useState<string>('Semua');
  const [selectedCondition, setSelectedCondition] = useState<string>('Semua');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddInvestmentModal, setShowAddInvestmentModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedAssetForAction, setSelectedAssetForAction] = useState<AssetData | null>(null);

  // New Investment Asset Form State
  const [newInvestmentForm, setNewInvestmentForm] = useState<Omit<InvestmentAsset, 'id'>>({
    code: '',
    name: '',
    category: 'Sukuk & Obligasi',
    issuerOrEntity: '',
    principalValuation: 500000000,
    currentValuation: 500000000,
    yieldOrInterestRate: 7.5,
    payoutFrequency: 'Bulanan',
    purchaseDate: new Date().toISOString().split('T')[0],
    maturityDate: new Date(Date.now() + 3 * 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    status: 'Aktif',
    contractNumber: '',
    notes: '',
    syncToPortfolio: true
  });

  // New Physical Asset Form State
  const [newAssetForm, setNewAssetForm] = useState({
    name: '',
    code: '',
    category: 'Inventaris IT & Server' as AssetData['category'],
    location: 'HQ Jakarta SCBD' as AssetData['location'],
    condition: 'Baik / Operasional' as AssetData['condition'],
    valuation: '150000000',
    assignedTo: 'IT Infrastructure',
    serialNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0]
  });

  // New Maintenance Form State
  const [newMaintenanceForm, setNewMaintenanceForm] = useState({
    assetId: '',
    type: 'Preventive Maintenance' as MaintenanceTask['type'],
    scheduledDate: new Date().toISOString().split('T')[0],
    technician: '',
    priority: 'Sedang' as MaintenanceTask['priority'],
    notes: ''
  });

  // New Borrow Form State
  const [newBorrowForm, setNewBorrowForm] = useState({
    assetId: '',
    borrowerName: '',
    department: 'Quantitative Trading',
    expectedReturnDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
    purpose: ''
  });

  // Combined Investment Assets (Merging Manual Investments + Synced Stock Assets from Portfolio Analysis)
  const combinedInvestmentAssets = useMemo(() => {
    const source = (portfolioData && portfolioData.length > 0) ? portfolioData : (function() {
      try {
        const saved = localStorage.getItem('cgsAssets_v3');
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    })();

    const stockAssets = getPortfolioStockAssets(source);
    const manualAssets = investmentAssets.filter(inv => !inv.id.startsWith('STK-'));
    return [...stockAssets, ...manualAssets];
  }, [investmentAssets, portfolioData]);

  // Computed Summaries
  const totalPhysicalValuation = useMemo(() => {
    return assets.reduce((sum, a) => sum + a.valuation, 0);
  }, [assets]);

  const totalInvestmentValuation = useMemo(() => {
    return combinedInvestmentAssets.reduce((sum, inv) => sum + (inv.currentValuation || inv.principalValuation || 0), 0);
  }, [combinedInvestmentAssets]);

  const totalEquitiesValuation = useMemo(() => {
    const source = (portfolioData && portfolioData.length > 0) ? portfolioData : (function() {
      try {
        const saved = localStorage.getItem('cgsAssets_v3');
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    })();

    if (Array.isArray(source) && source.length > 0) {
      const portfolioSum = source.reduce((sum: number, item: any) => {
        const lots = item.lots || 0;
        const avgPrice = item.averagePrice || 0;
        const price = typeof item.marketValue === 'number' && item.marketValue > 0
          ? item.marketValue 
          : (lots * (item.currentPrice || item.marketPrice || avgPrice) * 100);
        return sum + price;
      }, 0);

      // Add any additional manual 'Saham / Portofolio Saham' assets
      const manualEquities = investmentAssets
        .filter(inv => inv.category === 'Saham / Portofolio Saham' && !inv.id.startsWith('STK-'))
        .reduce((sum, inv) => sum + (inv.currentValuation || inv.principalValuation || 0), 0);

      return portfolioSum + manualEquities;
    }

    return combinedInvestmentAssets
      .filter(i => i.category === 'Saham / Portofolio Saham')
      .reduce((sum, inv) => sum + (inv.currentValuation || inv.principalValuation || 0), 0);
  }, [combinedInvestmentAssets, portfolioData, investmentAssets]);

  const totalSukukBondsValuation = useMemo(() => {
    return combinedInvestmentAssets
      .filter(i => i.category === 'Sukuk & Obligasi')
      .reduce((sum, inv) => sum + (inv.currentValuation || inv.principalValuation || 0), 0);
  }, [combinedInvestmentAssets]);

  const totalPrivateEquityValuation = useMemo(() => {
    return combinedInvestmentAssets
      .filter(i => i.category === 'Private Equity / Saham Private')
      .reduce((sum, inv) => sum + (inv.currentValuation || inv.principalValuation || 0), 0);
  }, [combinedInvestmentAssets]);

  const totalBusinessLoansValuation = useMemo(() => {
    return combinedInvestmentAssets
      .filter(i => i.category === 'Pinjaman Usaha / Direct Loan')
      .reduce((sum, inv) => sum + (inv.currentValuation || inv.principalValuation || 0), 0);
  }, [combinedInvestmentAssets]);

  // Combined Category Distribution for Recharts
  const categoryDistributionData = useMemo(() => {
    const counts: Record<string, { count: number; totalValuation: number }> = {};

    combinedInvestmentAssets.forEach(inv => {
      if (!counts[inv.category]) counts[inv.category] = { count: 0, totalValuation: 0 };
      counts[inv.category].count += 1;
      counts[inv.category].totalValuation += (inv.currentValuation || inv.principalValuation || 0);
    });

    assets.forEach(a => {
      if (!counts[a.category]) counts[a.category] = { count: 0, totalValuation: 0 };
      counts[a.category].count += 1;
      counts[a.category].totalValuation += a.valuation;
    });

    return Object.keys(counts).map(cat => ({
      name: cat,
      value: counts[cat].count,
      valuation: counts[cat].totalValuation,
      color: CATEGORY_COLORS[cat] || '#94a3b8'
    }));
  }, [assets, combinedInvestmentAssets]);

  const conditionDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    assets.forEach(a => {
      counts[a.condition] = (counts[a.condition] || 0) + 1;
    });

    return Object.keys(counts).map(cond => ({
      name: cond,
      jumlah: counts[cond],
      color: CONDITION_COLORS[cond] || '#94a3b8'
    }));
  }, [assets]);

  // Filtered Investment Assets
  const filteredInvestmentAssets = useMemo(() => {
    return combinedInvestmentAssets.filter(inv => {
      const matchSearch =
        inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.issuerOrEntity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.contractNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCat = selectedInvestmentType === 'Semua' || inv.category === selectedInvestmentType;
      return matchSearch && matchCat;
    });
  }, [combinedInvestmentAssets, searchQuery, selectedInvestmentType]);

  // Filtered Physical Assets
  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchSearch =
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.assignedTo.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCat = selectedCategory === 'Semua' || a.category === selectedCategory;
      const matchLoc = selectedLocation === 'Semua' || a.location === selectedLocation;
      const matchCond = selectedCondition === 'Semua' || a.condition === selectedCondition;

      return matchSearch && matchCat && matchLoc && matchCond;
    });
  }, [assets, searchQuery, selectedCategory, selectedLocation, selectedCondition]);

  // Handlers for Investment Assets
  const handleAddInvestmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvestmentForm.name) return;

    let autoCode = newInvestmentForm.code;
    if (!autoCode) {
      if (newInvestmentForm.category === 'Sukuk & Obligasi') autoCode = `SUKUK-${Math.floor(Math.random() * 899 + 100)}`;
      else if (newInvestmentForm.category === 'Saham / Portofolio Saham') autoCode = `SHM-${Math.floor(Math.random() * 899 + 100)}`;
      else if (newInvestmentForm.category === 'Private Equity / Saham Private') autoCode = `PVT-${Math.floor(Math.random() * 899 + 100)}`;
      else if (newInvestmentForm.category === 'Pinjaman Usaha / Direct Loan') autoCode = `LOAN-${Math.floor(Math.random() * 899 + 100)}`;
      else autoCode = `INV-${Math.floor(Math.random() * 899 + 100)}`;
    }

    const created: InvestmentAsset = {
      id: `INV-${Date.now()}`,
      ...newInvestmentForm,
      code: autoCode.toUpperCase().replace(/\s+/g, '-')
    };

    setInvestmentAssets(prev => [created, ...prev]);
    setShowAddInvestmentModal(false);

    // Reset Form
    setNewInvestmentForm({
      code: '',
      name: '',
      category: 'Sukuk & Obligasi',
      issuerOrEntity: '',
      principalValuation: 500000000,
      currentValuation: 500000000,
      yieldOrInterestRate: 7.5,
      payoutFrequency: 'Bulanan',
      purchaseDate: new Date().toISOString().split('T')[0],
      maturityDate: new Date(Date.now() + 3 * 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'Aktif',
      contractNumber: '',
      notes: '',
      syncToPortfolio: true
    });
  };

  const handleDeleteInvestment = (id: string) => {
    setInvestmentAssets(prev => prev.filter(item => item.id !== id));
  };

  const handleToggleInvestmentSync = (id: string) => {
    setInvestmentAssets(prev => prev.map(item => item.id === id ? { ...item, syncToPortfolio: !item.syncToPortfolio } : item));
  };

  // Handlers for Physical Assets
  const handleAddAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetForm.name) return;

    const newId = `AST-${String(assets.length + 1).padStart(3, '0')}`;
    const newCode = newAssetForm.code || `VAM-${newAssetForm.location.substring(0, 3).toUpperCase()}-${newId}`;

    const created: AssetData = {
      id: newId,
      code: newCode,
      name: newAssetForm.name,
      category: newAssetForm.category,
      location: newAssetForm.location,
      condition: newAssetForm.condition,
      valuation: parseFloat(newAssetForm.valuation) || 0,
      purchaseDate: newAssetForm.purchaseDate,
      lastMaintenance: newAssetForm.purchaseDate,
      nextMaintenance: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split('T')[0],
      assignedTo: newAssetForm.assignedTo || 'Unassigned',
      borrowStatus: 'Tersedia',
      serialNumber: newAssetForm.serialNumber || `SN-${Math.floor(Math.random() * 899999 + 100000)}`
    };

    setAssets(prev => [created, ...prev]);
    setShowAddModal(false);
    setNewAssetForm({
      name: '',
      code: '',
      category: 'Inventaris IT & Server',
      location: 'HQ Jakarta SCBD',
      condition: 'Baik / Operasional',
      valuation: '150000000',
      assignedTo: 'IT Infrastructure',
      serialNumber: '',
      purchaseDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleDeletePhysicalAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  // Clear / Reset Data
  const handleClearAllDummyData = () => {
    setAssets([]);
    setInvestmentAssets([]);
    setMaintenanceTasks([]);
    setBorrowRecords([]);
    localStorage.removeItem('vam_wap_assets_v3');
    localStorage.removeItem('vam_investment_assets_v3');
    localStorage.removeItem('vam_wap_maintenance_v3');
    localStorage.removeItem('vam_wap_borrow_v3');
    localStorage.removeItem('vam_wap_assets_v2');
    localStorage.removeItem('vam_investment_assets_v2');
    localStorage.removeItem('vam_wap_maintenance_v2');
    localStorage.removeItem('vam_wap_borrow_v2');
    setShowClearConfirmModal(false);
  };

  const handleResetToDemoData = () => {
    handleClearAllDummyData();
  };

  const handleCreateMaintenanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAsset = assets.find(a => a.id === newMaintenanceForm.assetId) || selectedAssetForAction;
    if (!targetAsset) return;

    const newTask: MaintenanceTask = {
      id: `MNT-${Math.floor(Math.random() * 899 + 100)}`,
      assetId: targetAsset.id,
      assetName: targetAsset.name,
      category: targetAsset.category,
      location: targetAsset.location,
      type: newMaintenanceForm.type,
      scheduledDate: newMaintenanceForm.scheduledDate,
      technician: newMaintenanceForm.technician || 'Vendor Mitra Terpercaya',
      priority: newMaintenanceForm.priority,
      status: 'Pending',
      notes: newMaintenanceForm.notes || 'Jadwal preventive maintenance terencana via WAP System.'
    };

    setMaintenanceTasks(prev => [newTask, ...prev]);
    setAssets(prev => prev.map(a => a.id === targetAsset.id ? { ...a, condition: 'Pemeliharaan Rutin' } : a));
    setShowMaintenanceModal(false);
    setSelectedAssetForAction(null);
  };

  const handleCreateBorrowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAsset = assets.find(a => a.id === newBorrowForm.assetId) || selectedAssetForAction;
    if (!targetAsset) return;

    const newRecord: BorrowRecord = {
      id: `BRW-${Math.floor(Math.random() * 899 + 100)}`,
      assetId: targetAsset.id,
      assetName: targetAsset.name,
      borrowerName: newBorrowForm.borrowerName || 'Staff VAM',
      department: newBorrowForm.department,
      checkoutDate: new Date().toISOString().split('T')[0],
      expectedReturnDate: newBorrowForm.expectedReturnDate,
      status: 'Dipinjam',
      purpose: newBorrowForm.purpose || 'Tugas Operasional Kantor VAM'
    };

    setBorrowRecords(prev => [newRecord, ...prev]);
    setAssets(prev => prev.map(a => a.id === targetAsset.id ? { ...a, borrowStatus: 'Dipinjam' } : a));
    setShowBorrowModal(false);
    setSelectedAssetForAction(null);
  };

  const toggleTaskStatus = (taskId: string) => {
    setMaintenanceTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextStatus = t.status === 'Pending' ? 'In Progress' : t.status === 'In Progress' ? 'Selesai' : 'Pending';
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const handleReturnAsset = (recordId: string, assetId: string) => {
    setBorrowRecords(prev => prev.map(r => r.id === recordId ? { ...r, status: 'Dikembalikan' } : r));
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, borrowStatus: 'Tersedia' } : a));
  };

  return (
    <div className="space-y-6 text-white pb-12 font-sans">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-black p-6 border border-zinc-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#DFFF00]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-[#DFFF00]/15 text-[#DFFF00] text-[9px] font-mono font-bold uppercase border border-[#DFFF00]/30 tracking-wider">
                Sistem Inventaris Aset &amp; Portofolio Enterprise
              </span>
              <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" /> Portofolio CGS Synced
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Landmark className="w-7 h-7 text-[#DFFF00]" />
              Sistem Manajemen Aset &amp; Investasi WAP
            </h1>
            <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
              Kelola instrumen investasi direct (Sukuk, Obligasi, Saham Private Equity &amp; Pinjaman Usaha) yang terhubung langsung ke Portofolio Utama, serta inventarisasi seluruh aset operasional fisik PT Venture Asset Management.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAddInvestmentModal(true)}
              className="px-4 py-2.5 bg-[#DFFF00] text-black font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-[#cbe600] transition-all shadow-[0_0_20px_rgba(223,255,0,0.25)] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Tambah Aset Investasi</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold text-xs rounded-xl border border-zinc-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Box className="w-4 h-4 text-sky-400" />
              <span>+ Aset Fisik</span>
            </button>

            <button
              onClick={() => setShowClearConfirmModal(true)}
              className="px-3 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded-xl border border-rose-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Bersihkan Data Dummy"
            >
              <Trash2 className="w-4 h-4" />
              <span>Bersihkan Data</span>
            </button>
          </div>
        </div>

        {/* Top Metric Highlight Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 pt-6 border-t border-zinc-800/80">
          <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">Total Investasi Enterprise</span>
              <TrendingUp className="w-4 h-4 text-[#DFFF00]" />
            </div>
            <p className="text-xl font-mono font-black text-[#DFFF00]">
              {formatValuationIDR(totalInvestmentValuation)}
            </p>
            <span className="text-[9px] text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
              <Check className="w-3 h-3 text-emerald-400" /> {combinedInvestmentAssets.length} Total Instrumen
            </span>
          </div>

          <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">Portofolio Saham (Sync)</span>
              <BarChart2 className="w-4 h-4 text-[#DFFF00]" />
            </div>
            <p className="text-xl font-mono font-black text-[#DFFF00]">
              {formatValuationIDR(totalEquitiesValuation)}
            </p>
            <span className="text-[9px] text-zinc-500 font-mono">Portofolio Analisis Saham</span>
          </div>

          <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">Sukuk &amp; Obligasi</span>
              <Coins className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-xl font-mono font-black text-sky-400">
              {formatValuationIDR(totalSukukBondsValuation)}
            </p>
            <span className="text-[9px] text-zinc-500 font-mono">SBN, ORI, Sukuk Ritel</span>
          </div>

          <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">Saham Private Equity</span>
              <Briefcase className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl font-mono font-black text-emerald-400">
              {formatValuationIDR(totalPrivateEquityValuation)}
            </p>
            <span className="text-[9px] text-zinc-500 font-mono">Penempatan Saham Private</span>
          </div>

          <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">Pinjaman Usaha &amp; Debt</span>
              <Handshake className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-xl font-mono font-black text-purple-400">
              {formatValuationIDR(totalBusinessLoansValuation)}
            </p>
            <span className="text-[9px] text-zinc-500 font-mono">Pembiayaan Mitra Direct</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('investments')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'investments'
                ? 'bg-zinc-800 text-[#DFFF00] shadow border border-[#DFFF00]/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-[#DFFF00]" />
            <span>Aset Investasi Enterprise ({investmentAssets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'bg-zinc-800 text-[#DFFF00] shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>Inventaris Fisik WAP ({filteredAssets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-zinc-800 text-[#DFFF00] shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <PieChartIcon className="w-4 h-4" />
            <span>Grafik &amp; Distribusi Aset</span>
          </button>

          <button
            onClick={() => setActiveTab('maintenance')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'maintenance'
                ? 'bg-zinc-800 text-[#DFFF00] shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Pemeliharaan ({maintenanceTasks.filter(t => t.status !== 'Selesai').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('borrowing')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'borrowing'
                ? 'bg-zinc-800 text-[#DFFF00] shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Log Peminjaman ({borrowRecords.filter(r => r.status === 'Dipinjam').length})</span>
          </button>
        </div>

        {/* Global Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddInvestmentModal(true)}
            className="px-3 py-1.5 bg-[#DFFF00]/10 hover:bg-[#DFFF00]/20 text-[#DFFF00] font-mono text-[11px] font-bold rounded-lg border border-[#DFFF00]/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Investasi Baru</span>
          </button>
          <button
            onClick={() => setShowMaintenanceModal(true)}
            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-mono text-[11px] font-bold rounded-lg border border-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>+ Service</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL PANEL */}
      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari aset investasi / fisik (Sukuk, FR0082, Tekno, SCBD, Dell, Sertifikat)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-8 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#DFFF00]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters according to active tab */}
          {activeTab === 'investments' ? (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-500 text-[10px] uppercase font-bold">Jenis Investasi:</span>
                <select
                  value={selectedInvestmentType}
                  onChange={(e) => setSelectedInvestmentType(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#DFFF00] focus:outline-none cursor-pointer"
                >
                  <option value="Semua" className="bg-zinc-900 text-white">Semua Jenis</option>
                  <option value="Saham / Portofolio Saham" className="bg-zinc-900 text-white">Saham / Portofolio Saham (Sync)</option>
                  <option value="Sukuk & Obligasi" className="bg-zinc-900 text-white">Sukuk &amp; Obligasi</option>
                  <option value="Private Equity / Saham Private" className="bg-zinc-900 text-white">Private Equity / Saham Private</option>
                  <option value="Pinjaman Usaha / Direct Loan" className="bg-zinc-900 text-white">Pinjaman Usaha / Direct Loan</option>
                  <option value="Lainnya" className="bg-zinc-900 text-white">Lainnya</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-500 text-[10px] uppercase font-bold">Kategori:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#DFFF00] focus:outline-none cursor-pointer"
                >
                  <option value="Semua" className="bg-zinc-900 text-white">Semua Kategori</option>
                  <option value="Properti & Gedung" className="bg-zinc-900 text-white">Properti &amp; Gedung</option>
                  <option value="Mesin & Genset" className="bg-zinc-900 text-white">Mesin &amp; Genset</option>
                  <option value="Inventaris IT & Server" className="bg-zinc-900 text-white">Inventaris IT &amp; Server</option>
                  <option value="Kendaraan Operasional" className="bg-zinc-900 text-white">Kendaraan Operasional</option>
                  <option value="Peralatan Kantor" className="bg-zinc-900 text-white">Peralatan Kantor</option>
                </select>
              </div>

              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1 text-xs">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-500 text-[10px] uppercase font-bold">Lokasi:</span>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#DFFF00] focus:outline-none cursor-pointer"
                >
                  <option value="Semua" className="bg-zinc-900 text-white">Semua Lokasi</option>
                  <option value="HQ Jakarta SCBD" className="bg-zinc-900 text-white">HQ Jakarta SCBD</option>
                  <option value="Data Center BSD" className="bg-zinc-900 text-white">Data Center BSD</option>
                  <option value="Branch Surabaya" className="bg-zinc-900 text-white">Branch Surabaya</option>
                  <option value="Colo Server SG" className="bg-zinc-900 text-white">Colo Server SG</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TAB SECTION 1: ENTERPRISE INVESTMENT ASSETS */}
      {activeTab === 'investments' && (
        <div className="space-y-4">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#DFFF00]/10 rounded-lg border border-[#DFFF00]/30 text-[#DFFF00]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  Daftar Aset Investasi Terhubung Ke Portofolio
                </h2>
                <p className="text-[10px] text-zinc-400">
                  Seluruh instrumen Sukuk, Obligasi, Saham Private Equity &amp; Pinjaman Usaha disinkronkan langsung ke CGS International Portfolio.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => syncInvestmentsToPortfolio(investmentAssets)}
                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold font-mono rounded-lg border border-emerald-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Paksa Sync Portofolio</span>
              </button>
            </div>
          </div>

          {/* Investment Assets Table & Card Grid */}
          {filteredInvestmentAssets.length === 0 ? (
            <div className="bg-zinc-950 p-12 text-center rounded-2xl border border-zinc-800 space-y-3">
              <Coins className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="text-sm font-bold text-zinc-300">Belum Ada Aset Investasi</h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Silakan tambahkan instrumen Sukuk &amp; Obligasi, penempatan saham private equity, atau pinjaman usaha untuk menghubungkannya ke portofolio.
              </p>
              <button
                onClick={() => setShowAddInvestmentModal(true)}
                className="px-4 py-2 bg-[#DFFF00] text-black text-xs font-bold rounded-xl inline-flex items-center gap-2 hover:bg-[#cbe600] transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Investment Asset</span>
              </button>
            </div>
          ) : (
            <div className="bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-zinc-900/80 text-zinc-400 text-[10px] uppercase font-bold border-b border-zinc-800">
                    <tr>
                      <th className="p-3.5">Kode &amp; Nama Instrumen</th>
                      <th className="p-3.5">Jenis Investasi</th>
                      <th className="p-3.5">Entitas Penerbit / Mitra</th>
                      <th className="p-3.5 text-right">Nilai Nominal</th>
                      <th className="p-3.5 text-right">Valuasi Saat Ini</th>
                      <th className="p-3.5 text-center">Yield / Return</th>
                      <th className="p-3.5 text-center">Status Portofolio</th>
                      <th className="p-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredInvestmentAssets.map(inv => {
                      const isSukuk = inv.category === 'Sukuk & Obligasi';
                      const isPrivateEquity = inv.category === 'Private Equity / Saham Private';
                      const isLoan = inv.category === 'Pinjaman Usaha / Direct Loan';

                      return (
                        <tr key={inv.id} className="hover:bg-zinc-900/50 transition-colors">
                          <td className="p-3.5">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#DFFF00]">{inv.code}</span>
                                {inv.contractNumber && (
                                  <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded border border-zinc-700">
                                    {inv.contractNumber}
                                  </span>
                                )}
                              </div>
                              <p className="font-sans font-bold text-white text-xs leading-snug">{inv.name}</p>
                            </div>
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              isSukuk ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' :
                              isPrivateEquity ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                              isLoan ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                              'bg-zinc-800 text-zinc-300 border-zinc-700'
                            }`}>
                              {inv.category}
                            </span>
                          </td>

                          <td className="p-3.5 text-zinc-300">
                            <p className="font-sans text-xs">{inv.issuerOrEntity}</p>
                            <span className="text-[9px] text-zinc-500 font-mono">Beli: {inv.purchaseDate}</span>
                          </td>

                          <td className="p-3.5 text-right whitespace-nowrap font-bold text-zinc-300">
                            Rp {inv.principalValuation.toLocaleString('id-ID')}
                          </td>

                          <td className="p-3.5 text-right whitespace-nowrap font-bold text-[#DFFF00]">
                            Rp {(inv.currentValuation || inv.principalValuation).toLocaleString('id-ID')}
                          </td>

                          <td className="p-3.5 text-center whitespace-nowrap">
                            <div className="inline-flex flex-col items-center">
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold text-[11px] border border-amber-500/30">
                                {inv.yieldOrInterestRate}% p.a.
                              </span>
                              <span className="text-[9px] text-zinc-500 mt-0.5">{inv.payoutFrequency}</span>
                            </div>
                          </td>

                          <td className="p-3.5 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleToggleInvestmentSync(inv.id)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 mx-auto cursor-pointer transition-all ${
                                inv.syncToPortfolio
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/25'
                                  : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300'
                              }`}
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>{inv.syncToPortfolio ? 'Synced Portofolio' : 'Off-Portfolio'}</span>
                            </button>
                          </td>

                          <td className="p-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteInvestment(inv.id)}
                              className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Investment Asset"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB SECTION 2: PHYSICAL INVENTORY ASSETS */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Katalog Inventaris Fisik VAM ({filteredAssets.length} Unit)
              </h2>
              <p className="text-[10px] text-zinc-400">
                Data infrastruktur gedung, server, genset, dan armada operasional PT Venture Asset Management.
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 bg-[#DFFF00] text-black font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-[#cbe600] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tambah Fisik</span>
            </button>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="bg-zinc-950 p-12 text-center rounded-2xl border border-zinc-800 space-y-3">
              <Box className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="text-sm font-bold text-zinc-300">Belum Ada Aset Fisik</h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Tidak ada data inventaris fisik. Silakan tambah barang baru atau reset data contoh jika diperlukan.
              </p>
            </div>
          ) : (
            <div className="bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-zinc-900/80 text-zinc-400 text-[10px] uppercase font-bold border-b border-zinc-800">
                    <tr>
                      <th className="p-3.5">Kode &amp; Nama Barang</th>
                      <th className="p-3.5">Kategori</th>
                      <th className="p-3.5">Lokasi</th>
                      <th className="p-3.5">Kondisi Operasional</th>
                      <th className="p-3.5 text-right">Nilai Perolehan</th>
                      <th className="p-3.5">Status Pinjam</th>
                      <th className="p-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredAssets.map(a => (
                      <tr key={a.id} className="hover:bg-zinc-900/50 transition-colors">
                        <td className="p-3.5">
                          <div className="space-y-0.5">
                            <span className="font-bold text-[#DFFF00]">{a.code}</span>
                            <p className="font-sans font-bold text-white text-xs">{a.name}</p>
                            <span className="text-[9px] text-zinc-500 font-mono">SN: {a.serialNumber}</span>
                          </div>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-900 border border-zinc-700 text-zinc-300">
                            {a.category}
                          </span>
                        </td>

                        <td className="p-3.5 text-zinc-300 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-xs">
                            <MapPin className="w-3 h-3 text-sky-400" />
                            <span>{a.location}</span>
                          </div>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border" style={{
                            backgroundColor: `${CONDITION_COLORS[a.condition] || '#a1a1aa'}15`,
                            color: CONDITION_COLORS[a.condition] || '#a1a1aa',
                            borderColor: `${CONDITION_COLORS[a.condition] || '#a1a1aa'}40`
                          }}>
                            {a.condition}
                          </span>
                        </td>

                        <td className="p-3.5 text-right whitespace-nowrap font-bold text-[#DFFF00]">
                          Rp {a.valuation.toLocaleString('id-ID')}
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            a.borrowStatus === 'Tersedia' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                            a.borrowStatus === 'Dipinjam' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}>
                            {a.borrowStatus}
                          </span>
                        </td>

                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDeletePhysicalAsset(a.id)}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Aset Fisik"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB SECTION 3: OVERVIEW & CHARTS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Distribution Chart (Category Breakdown) */}
          <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-[#DFFF00]" />
                  Visualisasi Pembagian Kategori Aset Total
                </h3>
                <p className="text-[10px] text-zinc-400">
                  Proporsi jumlah unit &amp; estimasi nilai perolehan Aset Investasi &amp; Fisik
                </p>
              </div>

              <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                <button
                  onClick={() => setChartType('pie')}
                  className={`p-1.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                    chartType === 'pie' ? 'bg-[#DFFF00] text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Diagram Lingkaran (Pie Chart)"
                >
                  <PieChartIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`p-1.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                    chartType === 'bar' ? 'bg-[#DFFF00] text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Diagram Batang (Bar Chart)"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Recharts Container */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'pie' ? (
                  <PieChart>
                    <Pie
                      data={categoryDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#09090b" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-700 shadow-xl font-mono text-xs space-y-1">
                              <p className="font-bold text-white">{data.name}</p>
                              <p className="text-[#DFFF00]">{data.value} Item Aset</p>
                              <p className="text-zinc-400 text-[10px]">
                                Valuasi: Rp {(data.valuation / 1000000).toLocaleString('id-ID')} Jt
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-[10px] font-mono text-zinc-300">{value}</span>}
                    />
                  </PieChart>
                ) : (
                  <BarChart data={categoryDistributionData}>
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#a1a1aa', fontSize: 9 }}
                      interval={0}
                    />
                    <YAxis tick={{ fill: '#a1a1aa', fontSize: 9 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-700 font-mono text-xs">
                              <p className="font-bold text-white">{data.name}</p>
                              <p className="text-[#DFFF00]">{data.value} Unit</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {categoryDistributionData.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Asset Condition Status Bar Breakdown */}
          <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-400" />
                  Status Kondisi Kelayakan Aset Fisik
                </h3>
                <p className="text-[10px] text-zinc-400">
                  Rincian kesehatan operasional unit fisik &amp; infrastruktur VAM
                </p>
              </div>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Live Audit Ready
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conditionDistributionData} layout="vertical">
                  <XAxis type="number" tick={{ fill: '#a1a1aa', fontSize: 9 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#a1a1aa', fontSize: 9 }} width={120} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-700 font-mono text-xs">
                            <p className="font-bold text-white">{data.name}</p>
                            <p className="text-emerald-400">{data.jumlah} Unit Aset</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="jumlah" radius={[0, 6, 6, 0]}>
                    {conditionDistributionData.map((entry, index) => (
                      <Cell key={`cond-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB SECTION 4: MAINTENANCE SCHEDULES */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">
                  Jadwal Servis &amp; Maintenance ({maintenanceTasks.length})
                </h2>
                <p className="text-[10px] text-zinc-400">
                  Pemeliharaan rutin, perbaikan darurat, dan kalibrasi unit infrastruktur VAM.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowMaintenanceModal(true)}
              className="px-3.5 py-1.5 bg-amber-500 text-black font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-amber-400 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Jadwal Servis</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {maintenanceTasks.map(t => (
              <div key={t.id} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-400">{t.id}</span>
                    <h3 className="font-bold text-white text-sm">{t.assetName}</h3>
                    <p className="text-[11px] text-zinc-400 font-mono">{t.location} • {t.type}</p>
                  </div>

                  <button
                    onClick={() => toggleTaskStatus(t.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                      t.status === 'Selesai' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      t.status === 'In Progress' ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {t.status}
                  </button>
                </div>

                <p className="text-xs text-zinc-300 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800 font-mono">
                  {t.notes}
                </p>

                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-2 border-t border-zinc-900">
                  <span>Jadwal: {t.scheduledDate}</span>
                  <span>Teknisi: {t.technician}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB SECTION 5: BORROWING LOG */}
      {activeTab === 'borrowing' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-400" />
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">
                  Log Peminjaman Barang Aset ({borrowRecords.length})
                </h2>
                <p className="text-[10px] text-zinc-400">
                  Peminjaman laptop, kendaraan operasional, dan peralatan kantor.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowBorrowModal(true)}
              className="px-3.5 py-1.5 bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-purple-600 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Pinjam Barang</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {borrowRecords.map(r => (
              <div key={r.id} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-purple-400">{r.id}</span>
                    <h3 className="font-bold text-white text-sm">{r.assetName}</h3>
                    <p className="text-[11px] text-zinc-400 font-mono">Peminjam: {r.borrowerName} ({r.department})</p>
                  </div>

                  {r.status === 'Dipinjam' ? (
                    <button
                      onClick={() => handleReturnAsset(r.id, r.assetId)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 cursor-pointer"
                    >
                      Kembalikan Unit
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {r.status}
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-300 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800 font-mono">
                  {r.purpose}
                </p>

                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-2 border-t border-zinc-900">
                  <span>Pinjam: {r.checkoutDate}</span>
                  <span>Target Kembali: {r.expectedReturnDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD INVESTMENT ASSET MODAL */}
      <AnimatePresence>
        {showAddInvestmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#DFFF00]/10 rounded-lg border border-[#DFFF00]/30 text-[#DFFF00]">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-tight">
                      Tambah Aset Investasi Enterprise
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      Sukuk, Obligasi, Private Equity &amp; Pinjaman Usaha Terhubung ke Portofolio
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddInvestmentModal(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddInvestmentSubmit} className="space-y-4 font-mono text-xs">
                {/* Category Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Kategori Investment Asset *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { type: 'Sukuk & Obligasi', desc: 'Sukuk Ritel, ORI, SBN, Obligasi Korporasi' },
                      { type: 'Saham / Portofolio Saham', desc: 'Portofolio Saham & Efek Publik (CGS International)' },
                      { type: 'Private Equity / Saham Private', desc: 'Penempatan Saham Perusahaan Private' },
                      { type: 'Pinjaman Usaha / Direct Loan', desc: 'Pembiayaan Direct ke Entitas Usaha' },
                      { type: 'Lainnya', desc: 'Proyek Alternative / Real Assets' }
                    ].map(item => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setNewInvestmentForm(prev => ({ ...prev, category: item.type as any }))}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          newInvestmentForm.category === item.type
                            ? 'bg-[#DFFF00]/15 border-[#DFFF00] text-white'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <p className="font-bold text-xs text-[#DFFF00]">{item.type}</p>
                        <p className="text-[9px] text-zinc-400 font-sans mt-0.5">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Kode / Ticker *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SUKUK-ST011, PVT-TEKNO, LOAN-CV01"
                      value={newInvestmentForm.code}
                      onChange={(e) => setNewInvestmentForm(prev => ({ ...prev, code: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#DFFF00]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Nama Instrumen / Investasi *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sukuk Ritel ST011 / Saham Seri A PT Tekno"
                      value={newInvestmentForm.name}
                      onChange={(e) => setNewInvestmentForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#DFFF00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Penerbit / Entitas Mitra</label>
                    <input
                      type="text"
                      placeholder="e.g. Kemenkeu RI / PT Inovasi Digital / CV Mandiri"
                      value={newInvestmentForm.issuerOrEntity}
                      onChange={(e) => setNewInvestmentForm(prev => ({ ...prev, issuerOrEntity: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#DFFF00]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Nomor Akta / Kontrak / Sertifikat</label>
                    <input
                      type="text"
                      placeholder="e.g. SBN-ST011-9988 / PERJANJIAN-NO12"
                      value={newInvestmentForm.contractNumber}
                      onChange={(e) => setNewInvestmentForm(prev => ({ ...prev, contractNumber: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#DFFF00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Nominal Penempatan Beli (Rp) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newInvestmentForm.principalValuation}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setNewInvestmentForm(prev => ({ ...prev, principalValuation: val, currentValuation: val }));
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#DFFF00]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Valuasi Saat Ini (Rp)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newInvestmentForm.currentValuation}
                      onChange={(e) => setNewInvestmentForm(prev => ({ ...prev, currentValuation: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#DFFF00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Yield / Bunga (% p.a.)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newInvestmentForm.yieldOrInterestRate}
                      onChange={(e) => setNewInvestmentForm(prev => ({ ...prev, yieldOrInterestRate: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#DFFF00]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Frekuensi Imbal Hasil</label>
                    <select
                      value={newInvestmentForm.payoutFrequency}
                      onChange={(e) => setNewInvestmentForm(prev => ({ ...prev, payoutFrequency: e.target.value as any }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#DFFF00] cursor-pointer"
                    >
                      <option value="Bulanan">Bulanan</option>
                      <option value="Triwulan">Triwulan</option>
                      <option value="Semesteran">Semesteran</option>
                      <option value="Tahunan">Tahunan</option>
                      <option value="At Maturity">At Maturity (Saat Pelunasan)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Tanggal Beli / Pencairan</label>
                    <input
                      type="date"
                      value={newInvestmentForm.purchaseDate}
                      onChange={(e) => setNewInvestmentForm(prev => ({ ...prev, purchaseDate: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#DFFF00] cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Tanggal Jatuh Tempo (Maturity)</label>
                    <input
                      type="date"
                      value={newInvestmentForm.maturityDate}
                      onChange={(e) => setNewInvestmentForm(prev => ({ ...prev, maturityDate: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#DFFF00] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Catatan / Keterangan Investment</label>
                  <textarea
                    rows={2}
                    placeholder="Rincian imbal hasil, penjamin aset, atau kesepakatan khusus..."
                    value={newInvestmentForm.notes}
                    onChange={(e) => setNewInvestmentForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-[#DFFF00]"
                  />
                </div>

                <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="font-bold text-xs text-emerald-400">Hubungkan Ke Portofolio Utama (CGS / VAM)</p>
                      <p className="text-[10px] text-zinc-400 font-sans">Otomatis tampil di Ringkasan Holding &amp; Treemap Portofolio</p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={newInvestmentForm.syncToPortfolio}
                    onChange={(e) => setNewInvestmentForm(prev => ({ ...prev, syncToPortfolio: e.target.checked }))}
                    className="w-5 h-5 accent-[#DFFF00] cursor-pointer"
                  />
                </div>

                <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddInvestmentModal(false)}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#DFFF00] text-black font-bold rounded-xl hover:bg-[#cbe600] transition-all cursor-pointer"
                  >
                    Simpan Investment Asset
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ADD PHYSICAL ASSET MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/30 text-sky-400">
                    <Box className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-tight">
                      Registrasi Aset Fisik
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      Form Input Gedung, Server, Genset &amp; Kendaraan
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddAssetSubmit} className="space-y-4 font-mono text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Nama Aset Fisik *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cluster Server Dell PowerEdge R750"
                    value={newAssetForm.name}
                    onChange={(e) => setNewAssetForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Kategori</label>
                    <select
                      value={newAssetForm.category}
                      onChange={(e) => setNewAssetForm(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400 cursor-pointer"
                    >
                      <option value="Properti & Gedung">Properti &amp; Gedung</option>
                      <option value="Inventaris IT & Server">Inventaris IT &amp; Server</option>
                      <option value="Mesin & Genset">Mesin &amp; Genset</option>
                      <option value="Kendaraan Operasional">Kendaraan Operasional</option>
                      <option value="Peralatan Kantor">Peralatan Kantor</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Lokasi Penempatan</label>
                    <select
                      value={newAssetForm.location}
                      onChange={(e) => setNewAssetForm(prev => ({ ...prev, location: e.target.value as any }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400 cursor-pointer"
                    >
                      <option value="HQ Jakarta SCBD">HQ Jakarta SCBD</option>
                      <option value="Data Center BSD">Data Center BSD</option>
                      <option value="Branch Surabaya">Branch Surabaya</option>
                      <option value="Colo Server SG">Colo Server SG</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Nilai Perolehan (Rp)</label>
                    <input
                      type="number"
                      required
                      value={newAssetForm.valuation}
                      onChange={(e) => setNewAssetForm(prev => ({ ...prev, valuation: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Serial Number / Kode BNO</label>
                    <input
                      type="text"
                      placeholder="e.g. DELL-PE750-882"
                      value={newAssetForm.serialNumber}
                      onChange={(e) => setNewAssetForm(prev => ({ ...prev, serialNumber: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-sky-500 text-black font-bold rounded-xl hover:bg-sky-400 transition-all cursor-pointer"
                  >
                    Simpan Aset Fisik
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: CLEAR DUMMY DATA CONFIRMATION MODAL */}
      <AnimatePresence>
        {showClearConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-rose-500/30 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
                <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/30 text-rose-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight">
                    Bersihkan Data Dummy
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    Pilih opsi pembersihan data sistem inventaris
                  </p>
                </div>
              </div>

              <div className="space-y-3 font-sans text-xs">
                <p className="text-zinc-300 leading-relaxed">
                  Anda dapat mengosongkan seluruh data dummy inventaris fisik &amp; jadwal pemeliharaan untuk memulai pengisian data aktual perusahaan.
                </p>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleClearAllDummyData}
                    className="w-full p-3 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 font-bold rounded-xl border border-rose-500/40 text-left transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-sm">Kosongkan Data Dummy Fisik</p>
                      <p className="text-[10px] text-zinc-400 font-normal">Hapus list barang fisik, service &amp; peminjaman dummy.</p>
                    </div>
                    <Trash2 className="w-4 h-4 text-rose-400" />
                  </button>

                  <button
                    onClick={handleResetToDemoData}
                    className="w-full p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold rounded-xl border border-zinc-700 text-left transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-sm text-sky-400">Reset ke Data Contoh Demo</p>
                      <p className="text-[10px] text-zinc-400 font-normal">Kembalikan sampel data awal untuk keperluan pengujian.</p>
                    </div>
                    <RefreshCw className="w-4 h-4 text-sky-400" />
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end">
                <button
                  onClick={() => setShowClearConfirmModal(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: MAINTENANCE SCHEDULE MODAL */}
      <AnimatePresence>
        {showMaintenanceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/30 text-amber-400">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-tight">
                      Jadwalkan Pemeliharaan Aset
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      Work Order Preventive &amp; Perbaikan Emergency
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowMaintenanceModal(false);
                    setSelectedAssetForAction(null);
                  }}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateMaintenanceSubmit} className="space-y-4 font-mono text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Pilih Target Aset *</label>
                  <select
                    value={newMaintenanceForm.assetId || selectedAssetForAction?.id || ''}
                    onChange={(e) => setNewMaintenanceForm(prev => ({ ...prev, assetId: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="">-- Pilih Aset Dari Daftar --</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Jenis Servis</label>
                    <select
                      value={newMaintenanceForm.type}
                      onChange={(e) => setNewMaintenanceForm(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="Preventive Maintenance">Preventive Maintenance</option>
                      <option value="PerbaikanDarurat">Perbaikan Darurat</option>
                      <option value="Kalibrasi Rutin">Kalibrasi Rutin</option>
                      <option value="Inspeksi Fisik">Inspeksi Fisik</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Tanggal Jadwal</label>
                    <input
                      type="date"
                      value={newMaintenanceForm.scheduledDate}
                      onChange={(e) => setNewMaintenanceForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Teknisi / Vendor Authorized</label>
                    <input
                      type="text"
                      placeholder="e.g. PT Schneider Electric Service"
                      value={newMaintenanceForm.technician}
                      onChange={(e) => setNewMaintenanceForm(prev => ({ ...prev, technician: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Tingkat Prioritas</label>
                    <select
                      value={newMaintenanceForm.priority}
                      onChange={(e) => setNewMaintenanceForm(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="Tinggi">Tinggi (High Urgent)</option>
                      <option value="Sedang">Sedang (Standard)</option>
                      <option value="Rendah">Rendah (Routine)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Catatan Instruksi Servis</label>
                  <textarea
                    rows={2}
                    placeholder="Rincian suku cadang atau modul yang perlu diperiksa..."
                    value={newMaintenanceForm.notes}
                    onChange={(e) => setNewMaintenanceForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMaintenanceModal(false);
                      setSelectedAssetForAction(null);
                    }}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-all cursor-pointer"
                  >
                    Terbitkan Work Order
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: BORROW ASSET MODAL */}
      <AnimatePresence>
        {showBorrowModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/30 text-purple-400">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-tight">
                      Proses Peminjaman Barang Aset
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      Form Penyerahan Aset Inventaris Kantor VAM
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowBorrowModal(false);
                    setSelectedAssetForAction(null);
                  }}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateBorrowSubmit} className="space-y-4 font-mono text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Pilih Aset Yang Dipinjam *</label>
                  <select
                    value={newBorrowForm.assetId || selectedAssetForAction?.id || ''}
                    onChange={(e) => setNewBorrowForm(prev => ({ ...prev, assetId: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400 cursor-pointer"
                  >
                    <option value="">-- Pilih Aset Dari Daftar --</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.category})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Nama Peminjam / Staff</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aidil Syahdan"
                      value={newBorrowForm.borrowerName}
                      onChange={(e) => setNewBorrowForm(prev => ({ ...prev, borrowerName: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Departemen / Divisi</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Executive / Quant"
                      value={newBorrowForm.department}
                      onChange={(e) => setNewBorrowForm(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Tanggal Estimasi Pengembalian</label>
                  <input
                    type="date"
                    required
                    value={newBorrowForm.expectedReturnDate}
                    onChange={(e) => setNewBorrowForm(prev => ({ ...prev, expectedReturnDate: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Keperluan / Tujuan Peminjaman</label>
                  <textarea
                    rows={2}
                    placeholder="Sebutkan kegiatan atau keperluan dinas kantor..."
                    value={newBorrowForm.purpose}
                    onChange={(e) => setNewBorrowForm(prev => ({ ...prev, purpose: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBorrowModal(false);
                      setSelectedAssetForAction(null);
                    }}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-all cursor-pointer"
                  >
                    Simpan &amp; Serahkan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WapAssetManagement;
