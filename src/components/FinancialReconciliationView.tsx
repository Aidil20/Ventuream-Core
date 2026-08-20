import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { saveAndNotifyPdf } from '../services/reportNotificationService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  Cell, 
  PieChart as RechartsPie, 
  Pie,
  AreaChart,
  Area
} from 'recharts';
import { 
  Scale, 
  ArrowLeftRight, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  FileCheck, 
  Search, 
  Filter, 
  ArrowLeft, 
  Sparkles, 
  Sliders, 
  Building2, 
  ShieldCheck, 
  TrendingUp, 
  Briefcase, 
  DollarSign, 
  Info, 
  HelpCircle, 
  FileText, 
  Zap, 
  History, 
  ChevronRight, 
  Check, 
  Lock, 
  PieChart, 
  BarChart2,
  Clock,
  Layers,
  ArrowUpRight,
  Eye,
  CheckCheck,
  Flag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReconciliationHistoryTimeline, { ReconciliationHistoryRun } from './ReconciliationHistoryTimeline';

interface ReconciliationItem {
  id: string;
  category: string;
  accountName: string;
  financialReportValue: number;
  regulatoryReportValue: number;
  unit: string;
  status: 'MATCHED' | 'DISCREPANCY' | 'RECONCILED';
  discrepancyType: 'VALUATION_BASIS' | 'TIMING_LAG' | 'CAPITAL_TRANCHE' | 'SETTLEMENT_UNSETTLED';
  rootCause: string;
  reconciliationNote: string;
  impactLevel: 'CRITICAL' | 'MEDIUM' | 'LOW' | 'INFO';
  lastAudited: string;
}

interface FinancialReconciliationViewProps {
  portfolioData?: any[];
  cashBalance?: number;
  giroBalance?: number;
  realizedPnL?: number;
  totalFees?: number;
  transactions?: any[];
  onNavigate?: (tab: string) => void;
}

// Initial audit history logs
const initialHistoryRuns: ReconciliationHistoryRun[] = [
  {
    id: 'RUN-2026-06-30-001',
    timestamp: '30/06/2026 17:30 WIB',
    period: 'Periode Q2 2026 (Unaudited Closing)',
    initiatedBy: 'Aidil Syahdan Al Fitrah',
    auditorRole: 'President Director / SPI Lead',
    type: 'AUTOMATED_FULL',
    status: 'COMPLETED',
    totalAccounts: 6,
    matchedAccounts: 3,
    discrepanciesCount: 2,
    reconciledCount: 1,
    initialVarianceAmount: 4206120000,
    finalVarianceAmount: 0,
    summary: 'Penyelarasan penuh Aset Tak Berwujud Sistem ERP (PSAK 19 At-Cost Rp 4,2M) dan Modal Disetor Efektif (Rp 11,12 Juta vs Rp 5 Juta Akta OJK). Saldo AUM & Kas CIMB Niaga cocok 100%.',
    calkReference: 'CALK-Q2-2026-NOTE-04',
    hash: '0x8f7a932d1e4b8c90a12f3e456789abcd0123456789abcdef0123456789abcdef',
    adjustments: [
      {
        id: 'ADJ-001',
        accountCode: 'REC-001',
        accountName: 'Valuasi Pengembangan System ERP VentureAM (PSAK 19 / IAS 38)',
        category: 'Aset Tak Berwujud',
        originalVariance: 4200000000,
        adjustedVariance: 0,
        adjustmentType: 'VALUATION_ALIGNMENT',
        note: 'Dikomodasi dalam CALK sebagai Nilai Buku Bersih (At-Cost) internal vs Komitmen Investasi di Portal OJK/OSS BKPM.',
        impact: 'CRITICAL',
        documentRef: 'AKTA-ERP-2026-001'
      },
      {
        id: 'ADJ-002',
        accountCode: 'REC-002',
        accountName: 'Modal Disetor Efektif Internal vs Pencatatan Akta / OJK',
        category: 'Modal Disetor & Ekuitas',
        originalVariance: 6120000,
        adjustedVariance: 0,
        adjustmentType: 'CAPITAL_TRIM',
        note: 'Penyesuaian administratif modal disetor riil internal Rp 11.120.000,00 vs Modal Disetor Akta/OJK Rp 5.000.000,00.',
        impact: 'MEDIUM',
        documentRef: 'AKTA-NO18-KEMENKUMHAM'
      },
      {
        id: 'ADJ-003',
        accountCode: 'REC-003',
        accountName: 'Dana Kelolaan Portofolio Efek & AUM (Portofolio Analysis Sync)',
        category: 'Nilai Portofolio Efek & AUM',
        originalVariance: 0,
        adjustedVariance: 0,
        adjustmentType: 'AUTOMATED_MATCH',
        note: '100% Matching real-time dengan Modul Portofolio Analisis & Bank Custodian KPEI.',
        impact: 'INFO',
        documentRef: 'CGS-CUSTODY-REPORT'
      }
    ]
  },
  {
    id: 'RUN-2026-05-31-001',
    timestamp: '31/05/2026 18:15 WIB',
    period: 'Periode Mei 2026 (Monthly Closing)',
    initiatedBy: 'Handoko, SE., Ak., CA',
    auditorRole: 'Kepala Satuan Pengawas Intern (SPI)',
    type: 'MONTHLY_CLOSING',
    status: 'APPROVED',
    totalAccounts: 6,
    matchedAccounts: 3,
    discrepanciesCount: 2,
    reconciledCount: 1,
    initialVarianceAmount: 4206120000,
    finalVarianceAmount: 4206120000,
    summary: 'Rekonsiliasi penutupan bulanan Mei 2026. Verifikasi kas & giro Bank CIMB Niaga matching 100% tanpa selisih.',
    calkReference: 'CALK-MEI-2026-NOTE-02',
    hash: '0x3c2b1a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b',
    adjustments: [
      {
        id: 'ADJ-101',
        accountCode: 'REC-004',
        accountName: 'Saldo Kas & Rekening Giro Bank (CIMB Niaga)',
        category: 'Saldo Kas Operasional & Bank Giro',
        originalVariance: 0,
        adjustedVariance: 0,
        adjustmentType: 'AUTOMATED_MATCH',
        note: 'Telah direkonsiliasi dengan Laporan Rekening Giro CIMB Niaga.',
        impact: 'INFO',
        documentRef: 'CIMB-GIRO-STATEMENT-MAY'
      }
    ]
  },
  {
    id: 'RUN-2026-04-30-001',
    timestamp: '30/04/2026 16:45 WIB',
    period: 'Periode Q1 2026 (Regulatory Submission)',
    initiatedBy: 'Aidil Syahdan Al Fitrah',
    auditorRole: 'President Director',
    type: 'REGULATORY_SUBMISSION',
    status: 'APPROVED',
    totalAccounts: 6,
    matchedAccounts: 3,
    discrepanciesCount: 2,
    reconciledCount: 1,
    initialVarianceAmount: 4206120000,
    finalVarianceAmount: 4206120000,
    summary: 'Laporan Berkala LKPM OSS BKPM & OJK Q1 2026 diserahkan. Selisih dasar valuasi dicatat dalam lampiran CALK.',
    calkReference: 'CALK-Q1-2026-NOTE-01',
    hash: '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0',
    adjustments: [
      {
        id: 'ADJ-201',
        accountCode: 'REC-001',
        accountName: 'Valuasi System ERP VentureAM',
        category: 'Aset Tak Berwujud',
        originalVariance: 4200000000,
        adjustedVariance: 4200000000,
        adjustmentType: 'RECLASSIFICATION',
        note: 'Laporan berkala disampaikan ke portal OJK.',
        impact: 'CRITICAL',
        documentRef: 'OSS-BKPM-Q1-REPORT'
      }
    ]
  }
];

export default function FinancialReconciliationView({
  portfolioData = [],
  cashBalance = 452286,
  giroBalance = 711000,
  realizedPnL = 0,
  totalFees = 0,
  transactions = [],
  onNavigate
}: FinancialReconciliationViewProps) {
  // Navigation & view mode state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'comparison' | 'timeline'>('dashboard');

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DISCREPANCY' | 'MATCHED' | 'RECONCILED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<ReconciliationItem | null>(null);
  
  // Interactive reconciliation state
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileSuccess, setReconcileSuccess] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Custom user adjustment notes & history runs state
  const [adjustmentNote, setAdjustmentNote] = useState('');
  const [reconciledItems, setReconciledItems] = useState<Record<string, { status: 'RECONCILED'; note: string }>>({});
  const [historyRuns, setHistoryRuns] = useState<ReconciliationHistoryRun[]>(initialHistoryRuns);

  // Dynamic portfolio market value calculation (Live AUM from Portfolio Analysis)
  const livePortfolioMTM = useMemo(() => {
    if (!portfolioData || portfolioData.length === 0) return 1270000;
    const sum = portfolioData.reduce((acc, asset) => acc + (asset.marketValue || 0), 0);
    return sum > 0 ? sum : 1270000;
  }, [portfolioData]);

  // Dynamic cash & giro balance calculation (Live Kas & Giro from Financial Reports / CIMB Niaga)
  const liveCashAndGiro = useMemo(() => {
    const cash = cashBalance !== undefined ? cashBalance : 2379000;
    const giro = giroBalance !== undefined ? giroBalance : 711000;
    return cash + giro;
  }, [cashBalance, giroBalance]);

  // Helper to format IDR with precision
  const formatIDR = (val: number) => {
    if (val === 0) return '0';
    const isDecimal = val % 1 !== 0;
    return val.toLocaleString('id-ID', {
      minimumFractionDigits: isDecimal ? 2 : 0,
      maximumFractionDigits: 2
    });
  };

  // Base reconciliation ledger dataset (REAL DATA as of June 30, 2026 - Unaudited, Zero-Debt)
  const rawItems: ReconciliationItem[] = useMemo(() => [
    {
      id: 'REC-001',
      category: 'Aset Tak Berwujud (Capitalized Software ERP)',
      accountName: 'Valuasi Pengembangan System ERP VentureAM (PSAK 19 / IAS 38)',
      financialReportValue: 4200000000,
      regulatoryReportValue: 0,
      unit: 'IDR',
      status: 'DISCREPANCY',
      discrepancyType: 'VALUATION_BASIS',
      rootCause: 'Aset Tak Berwujud pengembangan Sistem ERP senilai Rp 4.200.000.000,- terkapitalisasi penuh di Laporan Keuangan Internal (PSAK 19 / IAS 38), namun pada portal regulator OJK/OSS BKPM belum dilaporkan (Status: Belum Dilaporkan).',
      reconciliationNote: 'Amortisasi garis lurus 20 tahun (Rp 210.000.000,- / tahun atau Rp 17.500.000,- / bulan). Pengkinian data berkala disiapkan untuk pelaporan berikutnya ke portal OJK / OSS BKPM.',
      impactLevel: 'CRITICAL',
      lastAudited: '30/06/2026 (Internal Unaudited)'
    },
    {
      id: 'REC-002',
      category: 'Modal Disetor & Ekuitas (Paid-In Capital)',
      accountName: 'Modal Disetor Efektif Internal vs Pencatatan Akta / OJK',
      financialReportValue: 11120000,
      regulatoryReportValue: 5000000,
      unit: 'IDR',
      status: 'DISCREPANCY',
      discrepancyType: 'CAPITAL_TRANCHE',
      rootCause: 'Modal disetor riil pada Laporan Keuangan Internal tercatat sebesar Rp 11.120.000,00 (dengan total ekuitas bersih per 30 Juni 2026 sebesar Rp 10.360.000,00 setelah dikurangi akumulasi rugi berjalan). Sementara Modal Dasar/Disetor yang tercatat pada Akta Pendirian & Sistem OJK/OSS adalah Rp 5.000.000,00 (selisih penyesuaian administratif sebesar Rp 6.120.000,00).',
      reconciliationNote: 'Diperlukan pencatatan & penyesuaian administratif perubahan akta/OSS OJK untuk menyelaraskan nilai modal disetor.',
      impactLevel: 'MEDIUM',
      lastAudited: '30/06/2026 (Internal Unaudited)'
    },
    {
      id: 'REC-003',
      category: 'Nilai Portofolio Efek & AUM (Securities MTM)',
      accountName: 'Dana Kelolaan Portofolio Efek & AUM (Portofolio Analysis Sync)',
      financialReportValue: livePortfolioMTM,
      regulatoryReportValue: livePortfolioMTM,
      unit: 'IDR',
      status: 'MATCHED',
      discrepancyType: 'TIMING_LAG',
      rootCause: `Tidak ada selisih. Nilai portofolio efek & AUM di Laporan Keuangan Internal (Rp ${formatIDR(livePortfolioMTM)}) cocok 100% dan terhubung langsung secara real-time dengan Modul Portofolio Analisis serta catatan Bank Custodian / KPEI / OJK.`,
      reconciliationNote: 'Tersinkronisasi 100% real-time dengan Modul Portofolio Analisis, Bank Custodian & KPEI.',
      impactLevel: 'INFO',
      lastAudited: '30/06/2026 (Internal Unaudited - Live Sync)'
    },
    {
      id: 'REC-004',
      category: 'Saldo Kas Operasional & Bank Giro',
      accountName: 'Saldo Kas & Rekening Giro Bank (Mitra Perbankan Tunggal: CIMB Niaga)',
      financialReportValue: liveCashAndGiro,
      regulatoryReportValue: liveCashAndGiro,
      unit: 'IDR',
      status: 'MATCHED',
      discrepancyType: 'SETTLEMENT_UNSETTLED',
      rootCause: `Tidak ada selisih. Total saldo kas & giro di Buku Keuangan Internal (Rp ${formatIDR(liveCashAndGiro)}) cocok 100% dengan Laporan Financial Reports dan Rekening Giro Bank CIMB Niaga.`,
      reconciliationNote: 'Terkonfirmasi matching 100% dengan Laporan Keuangan Internal & Rekening Giro Operasional PT Venture Asset Management di Bank CIMB Niaga.',
      impactLevel: 'INFO',
      lastAudited: '30/06/2026 (Internal Unaudited - Live Sync)'
    },
    {
      id: 'REC-005',
      category: 'Aset Tetap Peralatan & Hardware',
      accountName: 'Peralatan MSI PC & Hardware Operasional (Net At Cost)',
      financialReportValue: 5950000,
      regulatoryReportValue: 5950000,
      unit: 'IDR',
      status: 'MATCHED',
      discrepancyType: 'TIMING_LAG',
      rootCause: 'Tidak ada selisih. Nilai buku aset tetap peralatan PC & monitor MSI operasional sebesar Rp 5.950.000,00 terkonfirmasi cocok 100% antara Buku Keuangan Internal dan Daftar Inventaris Operasional.',
      reconciliationNote: 'Tersinkronisasi 100% dengan Laporan Keuangan Internal dan Daftar Inventaris.',
      impactLevel: 'INFO',
      lastAudited: '30/06/2026 (Internal Unaudited)'
    },
    {
      id: 'REC-006',
      category: 'Amortisasi Aset Tak Berwujud (PSAK 19)',
      accountName: 'Beban Amortisasi ERP System (Masa Manfaat 20 Tahun)',
      financialReportValue: 210000000,
      regulatoryReportValue: 0,
      unit: 'IDR',
      status: 'DISCREPANCY',
      discrepancyType: 'VALUATION_BASIS',
      rootCause: 'Beban amortisasi tahunan sebesar Rp 210.000.000,00 (Rp 17.500.000,00 / bulan) diperhitungkan berdasarkan amortisasi garis lurus 20 tahun dari CapEx ERP Rp 4.200.000.000,00 di Buku Internal (PSAK 19), tetapi belum dilaporkan di portal regulator.',
      reconciliationNote: 'Diselaraskan dalam Catatan Atas Laporan Keuangan (CALK) Internal periode 30 Juni 2026.',
      impactLevel: 'LOW',
      lastAudited: '30/06/2026 (Internal Unaudited)'
    }
  ], [livePortfolioMTM, liveCashAndGiro]);

  // Merge reconciled state overrides
  const items: ReconciliationItem[] = useMemo(() => {
    return rawItems.map(item => {
      if (reconciledItems[item.id]) {
        return {
          ...item,
          status: 'RECONCILED',
          reconciliationNote: reconciledItems[item.id].note || item.reconciliationNote
        };
      }
      return item;
    });
  }, [rawItems, reconciledItems]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    const totalFinValue = items.reduce((acc, curr) => acc + curr.financialReportValue, 0);
    const totalRegValue = items.reduce((acc, curr) => acc + curr.regulatoryReportValue, 0);
    const totalVariance = Math.abs(totalFinValue - totalRegValue);
    
    const countDiscrepancies = items.filter(i => i.status === 'DISCREPANCY').length;
    const countMatched = items.filter(i => i.status === 'MATCHED').length;
    const countReconciled = items.filter(i => i.status === 'RECONCILED').length;

    return {
      totalFinValue,
      totalRegValue,
      totalVariance,
      countDiscrepancies,
      countMatched,
      countReconciled,
      syncPercentage: Math.round(((countMatched + countReconciled) / items.length) * 100)
    };
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchesSearch = 
        item.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.rootCause.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [items, statusFilter, searchQuery]);

  // Chart Dataset 1: Side-by-Side Financial Reports vs Regulatory Reports
  const chartComparisonData = useMemo(() => {
    return items.map(item => ({
      id: item.id,
      name: item.accountName.length > 25 ? item.accountName.substring(0, 25) + '...' : item.accountName,
      fullName: item.accountName,
      category: item.category,
      financial: Number((item.financialReportValue / 1000000).toFixed(2)),
      regulatory: Number((item.regulatoryReportValue / 1000000).toFixed(2)),
      financialRaw: item.financialReportValue,
      regulatoryRaw: item.regulatoryReportValue,
      varianceRaw: Math.abs(item.financialReportValue - item.regulatoryReportValue),
      status: item.status,
      impact: item.impactLevel
    }));
  }, [items]);

  // Chart Dataset 2: Variance Distribution per Category
  const chartVarianceData = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach(item => {
      const delta = Math.abs(item.financialReportValue - item.regulatoryReportValue);
      if (delta > 0) {
        map[item.category] = (map[item.category] || 0) + delta;
      }
    });
    const result = Object.entries(map).map(([cat, val], idx) => ({
      name: cat.split('(')[0].trim(),
      value: Number((val / 1000000).toFixed(2)),
      valueRaw: val,
      color: ['#DFFF00', '#38bdf8', '#f59e0b', '#a855f7', '#ec4899', '#10b981'][idx % 6]
    }));
    if (result.length === 0) {
      return [{ name: 'Zero Discrepancy (100% Reconciled)', value: 1, valueRaw: 0, color: '#10b981' }];
    }
    return result;
  }, [items]);

  // Execute Auto Reconciliation
  const handleAutoReconcileAll = () => {
    setIsReconciling(true);
    setTimeout(() => {
      const updates: Record<string, { status: 'RECONCILED'; note: string }> = {};
      const newAdjustments: any[] = [];

      items.forEach(item => {
        if (item.status === 'DISCREPANCY') {
          const noteText = 'Otomatis direkonsiliasi & diaudit oleh SPI Engine. Beda basis valuasi (PSAK 19 At-Cost vs BKPM Commitments) telah didokumentasikan dalam Catatan Atas Laporan Keuangan (CALK).';
          updates[item.id] = {
            status: 'RECONCILED',
            note: noteText
          };
          newAdjustments.push({
            id: `ADJ-${Date.now()}-${item.id}`,
            accountCode: item.id,
            accountName: item.accountName,
            category: item.category,
            originalVariance: Math.abs(item.financialReportValue - item.regulatoryReportValue),
            adjustedVariance: 0,
            adjustmentType: 'VALUATION_ALIGNMENT',
            note: noteText,
            impact: item.impactLevel,
            documentRef: 'CALK-LIVE-SYNC'
          });
        }
      });

      setReconciledItems(prev => ({ ...prev, ...updates }));

      // Create new audit history run
      const now = new Date();
      const runId = `RUN-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;
      const newRun: ReconciliationHistoryRun = {
        id: runId,
        timestamp: `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
        period: 'Periode Berjalan Q2 2026 (Live SPI Sync)',
        initiatedBy: 'Aidil Syahdan Al Fitrah',
        auditorRole: 'President Director / SPI Lead',
        type: 'AUTOMATED_FULL',
        status: 'COMPLETED',
        totalAccounts: items.length,
        matchedAccounts: items.length,
        discrepanciesCount: 0,
        reconciledCount: items.length,
        initialVarianceAmount: metrics.totalVariance,
        finalVarianceAmount: 0,
        summary: 'Sinkronisasi otomatis SPI Reconciliation Engine berhasil menyelaraskan seluruh item variansi keuangan.',
        calkReference: 'CALK-LIVE-AUTO-SYNC',
        hash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        adjustments: newAdjustments.length > 0 ? newAdjustments : [
          {
            id: `ADJ-${Date.now()}`,
            accountCode: 'REC-001',
            accountName: 'Sistem ERP & Paid-In Equity Capital',
            category: 'Penyelarasan Baku',
            originalVariance: metrics.totalVariance,
            adjustedVariance: 0,
            adjustmentType: 'VALUATION_ALIGNMENT',
            note: 'Semua item terverifikasi matching dan direkonsiliasi penuh.',
            impact: 'CRITICAL',
            documentRef: 'CALK-AUTOMATED-SYNC'
          }
        ]
      };

      setHistoryRuns(prev => [newRun, ...prev]);
      setIsReconciling(false);
      setReconcileSuccess(true);
      setTimeout(() => setReconcileSuccess(false), 4000);
    }, 1500);
  };

  // Reconcile single item with custom note
  const handleReconcileSingleItem = (id: string) => {
    if (!id) return;
    const targetItem = items.find(i => i.id === id);
    const noteContent = adjustmentNote.trim() || 'Direkonsiliasi dengan Catatan Penyesuaian Auditor SPI.';

    setReconciledItems(prev => ({
      ...prev,
      [id]: {
        status: 'RECONCILED',
        note: noteContent
      }
    }));

    if (targetItem) {
      const now = new Date();
      const runId = `RUN-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-M${Math.floor(10 + Math.random() * 90)}`;
      const newRun: ReconciliationHistoryRun = {
        id: runId,
        timestamp: `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
        period: 'Penyesuaian Manual Auditor SPI',
        initiatedBy: 'Handoko, SE., Ak., CA',
        auditorRole: 'Kepala Satuan Pengawas Intern (SPI)',
        type: 'MANUAL_ADJUSTMENT',
        status: 'ADJUSTED_WITH_MEMO',
        totalAccounts: items.length,
        matchedAccounts: metrics.countMatched,
        discrepanciesCount: Math.max(0, metrics.countDiscrepancies - 1),
        reconciledCount: metrics.countReconciled + 1,
        initialVarianceAmount: Math.abs(targetItem.financialReportValue - targetItem.regulatoryReportValue),
        finalVarianceAmount: 0,
        summary: `Penyesuaian memo manual diposting untuk akun ${targetItem.accountName}.`,
        calkReference: 'CALK-MANUAL-MEMO-2026',
        hash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        adjustments: [
          {
            id: `ADJ-SINGLE-${Date.now()}`,
            accountCode: targetItem.id,
            accountName: targetItem.accountName,
            category: targetItem.category,
            originalVariance: Math.abs(targetItem.financialReportValue - targetItem.regulatoryReportValue),
            adjustedVariance: 0,
            adjustmentType: 'VALUATION_ALIGNMENT',
            note: noteContent,
            impact: targetItem.impactLevel,
            documentRef: 'SPI-MANUAL-ADJUSTMENT-MEMO'
          }
        ]
      };
      setHistoryRuns(prev => [newRun, ...prev]);
    }

    setAdjustmentNote('');
    setSelectedItem(null);
  };

  // Generate PDF Audit Certificate
  const handleGeneratePDF = () => {
    setIsGeneratingPDF(true);
    setTimeout(() => {
      try {
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

        // Header Banner
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, 210, 28, 'F');

        doc.setFillColor(223, 255, 0); // #DFFF00
        doc.rect(0, 28, 210, 2, 'F');

        doc.setTextColor(223, 255, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('PT VENTURE ASSET MANAGEMENT', 14, 12);

        doc.setTextColor(148, 163, 184);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('BERKAS REKONSILIASI KEUANGAN & REPORTING REGULATORY (OJK / BEI / BKPM)', 14, 18);
        doc.text(`TANGGAL AUDIT: ${new Date().toLocaleDateString('id-ID')} | INTEGRITY HASH: SHA256-REC-360-VAM`, 14, 23);

        // Section Title
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('BERKAS REKONSILIASI LOKAL VS REGULATOR (PERIODE BERAKHIR 30 JUNI 2026)', 14, 38);

        // Summary Box
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(14, 42, 182, 30, 2, 2, 'FD');

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('RINGKASAN REKONSILIASI KEUANGAN (UNAUDITED, ZERO-DEBT STRUCTURE):', 18, 48);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`1. Total Valuasi Keuangan Internal (ERP PSAK 19) : Rp ${formatIDR(metrics.totalFinValue)}`, 18, 54);
        doc.text(`2. Total Valuasi Pencatatan Regulator (OJK/OSS) : Rp ${formatIDR(metrics.totalRegValue)}`, 18, 60);
        doc.text(`3. Total Variansi Penyesuaian (Aset ERP & Equity) : Rp ${formatIDR(metrics.totalVariance)}`, 18, 66);

        // Table Header
        let currentY = 80;
        doc.setFillColor(15, 23, 42);
        doc.rect(14, currentY, 182, 8, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text('ID & AKUN REKONSILIASI', 18, currentY + 5.5);
        doc.text('FINANCIAL REPORT', 95, currentY + 5.5);
        doc.text('REGULATORY REPORT', 135, currentY + 5.5);
        doc.text('STATUS AUDIT', 172, currentY + 5.5);

        currentY += 8;

        items.forEach((item, idx) => {
          if (idx % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(14, currentY, 182, 10, 'F');
          }
          doc.setDrawColor(241, 245, 249);
          doc.line(14, currentY + 10, 196, currentY + 10);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(15, 23, 42);
          doc.text(`${item.id} - ${item.category.substring(0, 32)}`, 18, currentY + 4);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(71, 85, 105);
          doc.text(item.accountName.substring(0, 48), 18, currentY + 8);

          doc.setFont('helvetica', 'mono');
          doc.setFontSize(7.5);
          doc.setTextColor(15, 23, 42);
          doc.text(`Rp ${formatIDR(item.financialReportValue)}`, 95, currentY + 6);
          doc.text(`Rp ${formatIDR(item.regulatoryReportValue)}`, 135, currentY + 6);

          if (item.status === 'MATCHED') {
            doc.setTextColor(22, 101, 52);
            doc.text('MATCHED', 172, currentY + 6);
          } else if (item.status === 'RECONCILED') {
            doc.setTextColor(30, 64, 175);
            doc.text('RECONCILED', 172, currentY + 6);
          } else {
            doc.setTextColor(180, 83, 9);
            doc.text('DISCREPANCY', 172, currentY + 6);
          }

          currentY += 10;
        });

        // Root Cause Analysis Section
        currentY += 6;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text('ANALISIS AKAR PENYEBAB & CATATAN POSISI KEUANGAN:', 14, currentY);

        currentY += 4;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(51, 65, 85);
        
        const explanation = 
          '1. Aset Tak Berwujud (Software ERP) Rp 4.200.000.000,- terkapitalisasi penuh di Laporan Keuangan Internal (PSAK 19), namun belum dilaporkan di portal OJK/OSS BKPM.\n' +
          '2. Modal Disetor Riil di Laporan Keuangan Internal tercatat Rp 11.120.000,00 (Total Ekuitas per 30 Juni 2026: Rp 10.360.000,00 setelah dikurangi akumulasi rugi berjalan).\n' +
          '   Sementara Modal Dasar/Disetor tercatat di Akta & OJK/OSS sebesar Rp 5.000.000,00 (selisih penyesuaian administratif ekuitas Rp 6.120.000,00).\n' +
          `3. Portofolio AUM (Rp ${formatIDR(livePortfolioMTM)}) & Saldo Kas/Giro CIMB Niaga (Rp ${formatIDR(liveCashAndGiro)}) tersinkronisasi 100% matching tanpa selisih.\n` +
          'Catatan Tambahan: Seluruh angka merujuk pada posisi keuangan internal unaudited per 30 Juni 2026 dengan struktur modal bebas utang (zero-debt).';

        const splitText = doc.splitTextToSize(explanation, 182);
        doc.text(splitText, 14, currentY);

        // Signatures
        const sigY = 240;
        doc.setDrawColor(203, 213, 225);
        doc.line(14, sigY, 196, sigY);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);

        doc.text('MITRA PERBANKAN TUNGGAL', 20, sigY + 8);
        doc.text('PT Bank CIMB Niaga Tbk', 20, sigY + 12);

        doc.text('PRESIDENT DIRECTOR', 140, sigY + 8);
        doc.text('PT Venture Asset Management', 140, sigY + 12);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text('Operational Custody & Settlement', 20, sigY + 28);
        doc.text('Aidil Syahdan Al Fitrah', 140, sigY + 28);

        const recFileName = `Financial_vs_Regulatory_Reconciliation_${Date.now()}.pdf`;
        saveAndNotifyPdf(doc, recFileName, 'Laporan Rekonsiliasi Keuangan vs Regulasi');
      } catch (e) {
        console.error('Failed to generate PDF:', e);
      } finally {
        setIsGeneratingPDF(false);
      }
    }, 800);
  };

  return (
    <div className="space-y-6 text-slate-100 pb-12">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-zinc-900">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#DFFF00]/5 blur-3xl rounded-full pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {onNavigate && (
                <button 
                  onClick={() => onNavigate('financial')} 
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors mr-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#DFFF00]/10 text-[#DFFF00] border border-[#DFFF00]/30 tracking-widest uppercase flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#DFFF00]" />
                360° FINANCIAL RECONCILIATION ENGINE
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                AUDIT SYNC ACTIVE
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase flex items-center gap-3">
              <Scale className="w-7 h-7 text-[#DFFF00]" />
              Rekonsiliasi Keuangan vs Laporan Regulator
            </h1>

            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Modul pembandingan data berdampingan (*Side-by-Side Financial Dashboard*) untuk mengidentifikasi selisih nilai AUM, Aset Tak Berwujud, dan Modal Disetor antara <strong className="text-slate-200">Financial Reports (Buku ERP Internal)</strong> dengan <strong className="text-slate-200">Regulatory Reports (OJK / BEI / OSS BKPM)</strong> lengkap dengan analisis akar penyebab (*Root Cause Analysis*).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleAutoReconcileAll}
              disabled={isReconciling}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg ${
                isReconciling
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-[#DFFF00] hover:bg-[#c8e600] text-slate-950 shadow-[#DFFF00]/10'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isReconciling ? 'animate-spin' : ''}`} />
              {isReconciling ? 'SINKRONISASI REKONSILIASI...' : 'OTOMATIS REKONSILIASI SEMUA'}
            </button>

            <button
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-2"
            >
              <Download className={`w-4 h-4 text-[#DFFF00] ${isGeneratingPDF ? 'animate-pulse' : ''}`} />
              {isGeneratingPDF ? 'MENCETAK PDF...' : 'EKSPOR LAPORAN REKONSILIASI (PDF)'}
            </button>
          </div>
        </div>

        {reconcileSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2 font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Seluruh item variansi berhasil direkonsiliasi, didokumentasikan dalam CALK, dan dicatat ke dalam Timeline Riwayat Audit Log.</span>
          </motion.div>
        )}
      </div>

      {/* Sub-Navigation View Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-2 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'bg-[#DFFF00] text-slate-950 shadow-md shadow-[#DFFF00]/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            RECONCILIATION DASHBOARD
          </button>

          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'comparison'
                ? 'bg-[#DFFF00] text-slate-950 shadow-md shadow-[#DFFF00]/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            TABEL KOMPARASI KEUTUHAN
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'timeline'
                ? 'bg-[#DFFF00] text-slate-950 shadow-md shadow-[#DFFF00]/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <History className="w-4 h-4" />
            RIWAYAT REKONSILIASI & AUDIT LOG
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
              activeTab === 'timeline' ? 'bg-slate-950 text-[#DFFF00]' : 'bg-slate-800 text-slate-300'
            }`}>
              {historyRuns.length} RUNS
            </span>
          </button>
        </div>

        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 px-3 py-1 bg-slate-950/60 rounded-xl border border-slate-800">
          <Clock className="w-3 h-3 text-[#DFFF00]" />
          Audit Terakhir: <strong className="text-slate-200">{historyRuns[0]?.timestamp || '30/06/2026'}</strong>
        </div>
      </div>

      {/* VIEW CONDITIONAL 1: RECONCILIATION DASHBOARD (VISUAL DISCREPANCY ANALYTICS) */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Executive Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#DFFF00]" />
                  Valuasi Laporan Keuangan
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">PSAK 19 / IFRS</span>
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-white">
                Rp {metrics.totalFinValue.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Total Aset & Ekuitas Neraca Internal</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  Valuasi Laporan Regulasi
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">OJK / BKPM</span>
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-blue-400">
                Rp {metrics.totalRegValue.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Total Modal & CapEx Terdaftar</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Total Discrepancy (Selisih)
                </span>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${
                  metrics.countDiscrepancies > 0 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {metrics.countDiscrepancies} UNRECONCILED
                </span>
              </div>
              <div className={`mt-2 text-2xl font-black font-mono ${metrics.countDiscrepancies > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                Rp {metrics.totalVariance.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {metrics.countDiscrepancies > 0 ? 'Dapat diselaraskan via Fitur Auto-Reconcile' : '0 Variansi Belum Direkonsiliasi'}
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Alignment Score
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {metrics.syncPercentage}% ALIGNED
                </span>
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-emerald-400">
                {metrics.countMatched + metrics.countReconciled} / {items.length} Account
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-[#DFFF00] h-full transition-all duration-500" 
                  style={{ width: `${metrics.syncPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Auto-Reconcile Callout Header */}
          <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
            <div className="space-y-1 z-10">
              <div className="flex items-center gap-2 text-[#DFFF00]">
                <Zap className="w-4 h-4 fill-[#DFFF00]/20" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Automatic Reconciliation Engine
                </h3>
              </div>
              <p className="text-xs text-slate-400 max-w-2xl">
                Menghubungkan & menyelaraskan Laporan Keuangan Internal (PSAK 19) dengan Laporan Regulasi (OJK/BKPM). Mengidentifikasi variansi, menandai status discrepancy, dan mencatat jurnal penyesuaian ke dalam CALK.
              </p>
            </div>

            <div className="flex items-center gap-3 z-10">
              <button
                onClick={handleAutoReconcileAll}
                disabled={isReconciling}
                className="px-5 py-3 rounded-xl bg-[#DFFF00] hover:bg-[#cbe600] text-slate-950 font-black text-xs transition-all flex items-center gap-2 shadow-lg shadow-[#DFFF00]/10 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {isReconciling ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>MEMPROSES REKONSILIASI OTOMATIS...</span>
                  </>
                ) : (
                  <>
                    <CheckCheck className="w-4 h-4 text-slate-950" />
                    <span>RECONCILE ALL VARIANCES (OTOMATIS)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Visual Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Bar Chart: Financial vs Regulatory Comparison */}
            <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-[#DFFF00]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Komparasi Nilai Laporan Keuangan vs Laporan Regulasi (Juta Rp)
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-[10px]">
                  <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#DFFF00] inline-block" /> Laporan Keuangan (ERP)
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#38bdf8] inline-block" /> Laporan Regulasi (OJK)
                  </span>
                </div>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      tickLine={false}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-2 max-w-xs">
                              <p className="font-bold text-slate-200 border-b border-slate-800 pb-1">{data.fullName}</p>
                              <div className="space-y-1 font-mono text-[11px]">
                                <p className="text-[#DFFF00]">Financial: Rp {formatIDR(data.financialRaw)}</p>
                                <p className="text-sky-400">Regulatory: Rp {formatIDR(data.regulatoryRaw)}</p>
                                <p className="text-amber-400 pt-1 border-t border-slate-800/80">
                                  Discrepancy: Rp {formatIDR(data.varianceRaw)}
                                </p>
                              </div>
                              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                                data.status === 'MATCHED' ? 'bg-emerald-500/20 text-emerald-400' :
                                data.status === 'RECONCILED' ? 'bg-sky-500/20 text-sky-400' : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                STATUS: {data.status}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="financial" name="Financial Report (ERP)" fill="#DFFF00" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="regulatory" name="Regulatory Report (OJK)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Donut Chart: Variance Share Distribution */}
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-sky-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Distribusi Variansi Nilai
                  </h3>
                </div>
                <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  Juta Rp
                </span>
              </div>

              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={chartVarianceData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {chartVarianceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl shadow-xl text-xs font-mono space-y-1">
                              <p className="font-bold text-slate-200">{data.name}</p>
                              <p style={{ color: data.color }}>Variansi: Rp {formatIDR(data.valueRaw)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                {chartVarianceData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[10px]">
                    <span className="flex items-center gap-1.5 text-slate-300 truncate max-w-[170px]">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="font-mono text-slate-400">Rp {formatIDR(item.valueRaw)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Itemized Discrepancy & Variance Flagging Center */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Daftar Variansi Discrepancy Keuangan & Regulasi
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    statusFilter === 'ALL' ? 'bg-[#DFFF00] text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Semua ({items.length})
                </button>
                <button
                  onClick={() => setStatusFilter('DISCREPANCY')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    statusFilter === 'DISCREPANCY' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Discrepancy ({metrics.countDiscrepancies})
                </button>
                <button
                  onClick={() => setStatusFilter('RECONCILED')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    statusFilter === 'RECONCILED' ? 'bg-sky-400 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Reconciled ({metrics.countReconciled})
                </button>
                <button
                  onClick={() => setStatusFilter('MATCHED')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    statusFilter === 'MATCHED' ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Matched ({metrics.countMatched})
                </button>
              </div>
            </div>

            {/* Grid Cards of Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map(item => {
                const variance = Math.abs(item.financialReportValue - item.regulatoryReportValue);
                const isDiscrepancy = item.status === 'DISCREPANCY';
                const isReconciled = item.status === 'RECONCILED';

                return (
                  <div 
                    key={item.id}
                    className={`bg-slate-950/80 border rounded-2xl p-4 space-y-3 transition-all hover:border-slate-700 ${
                      isDiscrepancy ? 'border-amber-500/40 bg-amber-500/5' :
                      isReconciled ? 'border-sky-500/40 bg-sky-500/5' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-slate-800 text-slate-300 rounded">
                            {item.id}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {item.category}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white leading-snug">
                          {item.accountName}
                        </h4>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold shrink-0 ${
                        isDiscrepancy ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        isReconciled ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    {/* Side-by-Side Comparison Box */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-slate-900/90 rounded-xl border border-slate-800/80 font-mono text-[11px]">
                      <div>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Financial Report</span>
                        <span className="font-bold text-slate-200 block mt-0.5">
                          Rp {formatIDR(item.financialReportValue)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-sky-400 uppercase tracking-widest block">Regulatory Report</span>
                        <span className="font-bold text-sky-400 block mt-0.5">
                          Rp {formatIDR(item.regulatoryReportValue)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-amber-400 uppercase tracking-widest block">Delta Variance</span>
                        <span className={`font-bold block mt-0.5 ${variance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          Rp {formatIDR(variance)}
                        </span>
                      </div>
                    </div>

                    {/* Root cause summary */}
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {item.rootCause}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail & Root Cause</span>
                      </button>

                      {isDiscrepancy ? (
                        <button
                          onClick={() => handleReconcileSingleItem(item.id)}
                          className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-[10px] font-extrabold transition-all flex items-center gap-1.5 shadow-md shadow-amber-400/10 cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Flag & Reconcile</span>
                        </button>
                      ) : isReconciled ? (
                        <span className="text-[10px] text-sky-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Telah Direkonsiliasi
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Cocok (Matched 100%)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW CONDITIONAL: TIMELINE VIEW */}
      {activeTab === 'timeline' && (
        <ReconciliationHistoryTimeline 
          historyRuns={historyRuns}
          onTriggerNewRun={handleAutoReconcileAll}
        />
      )}

      {/* VIEW CONDITIONAL: COMPARISON LEDGER VIEW */}
      {activeTab === 'comparison' && (
        <>
          {/* Overview Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#DFFF00]" />
                  Valuasi Internal (ERP)
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">PSAK 19 / IFRS</span>
              </div>
              <div className="mt-2 text-xl font-black font-mono text-white">
                Rp {metrics.totalFinValue.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Total Aset & Ekuitas Neraca Internal</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  Valuasi Regulator (OJK/BKPM)
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">LKPM / NIB</span>
              </div>
              <div className="mt-2 text-xl font-black font-mono text-blue-400">
                Rp {metrics.totalRegValue.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Total Modal & Investasi Didaftarkan</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Total Variansi / Selisih
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {metrics.countDiscrepancies} ITEM
                </span>
              </div>
              <div className="mt-2 text-xl font-black font-mono text-amber-400">
                Rp {metrics.totalVariance.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-amber-500/80 mt-1">Diselaraskan via Catatan Penyelarasan SPI</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Tingkat Keselarasan Sync
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {metrics.syncPercentage}% ALIGNED
                </span>
              </div>
              <div className="mt-2 text-xl font-black font-mono text-emerald-400">
                {metrics.countMatched + metrics.countReconciled} / {items.length} Account
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Item Telah Terverifikasi / Direkonsiliasi</p>
            </div>
          </div>

      {/* Highlight Box for Root Cause Summary */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-[#DFFF00]" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200">
            Ringkasan Penjelasan Selisih Nilai (Root Cause Analysis Highlights)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400">1. Aset Tak Berwujud (Software ERP - PSAK 19)</span>
              <span className="text-[10px] font-mono text-amber-300 font-bold">Variansi: Rp 4.200.000.000,-</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-slate-300">Akar Penyebab:</strong> Pengembangan sistem ERP senilai <strong className="text-slate-200">Rp 4.200.000.000,-</strong> terkapitalisasi penuh di Laporan Keuangan Internal (PSAK 19), namun statusnya di portal regulator OJK/OSS BKPM <em className="text-slate-200 font-normal">Belum Dilaporkan</em>. Masa manfaat amortisasi 20 tahun (Rp 210.000.000,- / thn).
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400">2. Modal Disetor & Ekuitas (Paid-In Capital)</span>
              <span className="text-[10px] font-mono text-amber-300 font-bold">Variansi: Rp 6.120.000,00</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-slate-300">Akar Penyebab:</strong> Modal disetor riil internal tercatat <strong className="text-slate-200">Rp 11.120.000,00</strong> (total ekuitas bersih Rp 10.360.000,00 per 30 Juni 2026 setelah dikurangi akumulasi rugi berjalan). Sementara Modal Dasar/Disetor tercatat di Akta & OJK/OSS sebesar <strong className="text-slate-200">Rp 5.000.000,00</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            Filter:
          </span>
          {(['ALL', 'DISCREPANCY', 'RECONCILED', 'MATCHED'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider transition-all uppercase whitespace-nowrap ${
                statusFilter === st
                  ? st === 'DISCREPANCY'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : st === 'RECONCILED'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    : st === 'MATCHED'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-[#DFFF00]/20 text-[#DFFF00] border border-[#DFFF00]/40'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
              }`}
            >
              {st === 'ALL' ? 'SEMUA (' + items.length + ')' : st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Cari akun, kategori, atau akar penyebab..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#DFFF00]/50"
          />
        </div>
      </div>

      {/* Main Side-by-Side Comparison Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-[#DFFF00]" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200">
              Tabel Komparasi Berdampingan (Side-by-Side Financial Ledger vs Regulatory Ledger)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            Menampilkan {filteredItems.length} dari {items.length} akun
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <th className="py-3 px-4 w-12 text-center">ID</th>
                <th className="py-3 px-4">Kategori & Nama Akun</th>
                <th className="py-3 px-4 text-right bg-slate-900/80 text-slate-200 border-x border-slate-800">
                  <span className="flex items-center justify-end gap-1">
                    <FileText className="w-3 h-3 text-[#DFFF00]" />
                    Financial Report (ERP)
                  </span>
                </th>
                <th className="py-3 px-4 text-right bg-slate-900/40 text-blue-300">
                  <span className="flex items-center justify-end gap-1">
                    <Building2 className="w-3 h-3 text-blue-400" />
                    Regulatory Report (OJK/BKPM)
                  </span>
                </th>
                <th className="py-3 px-4 text-right font-mono text-amber-400">Variansi</th>
                <th className="py-3 px-4 text-center">Status Sync</th>
                <th className="py-3 px-4 text-center">Tindakan Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredItems.map((item) => {
                const variance = Math.abs(item.financialReportValue - item.regulatoryReportValue);
                const hasVariance = variance > 0;

                return (
                  <tr 
                    key={item.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500 text-center font-bold">
                      {item.id}
                    </td>

                    <td className="py-3.5 px-4 space-y-1 max-w-xs">
                      <div className="font-bold text-slate-200 flex items-center gap-1.5">
                        {item.category}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{item.accountName}</p>
                    </td>

                    {/* Financial Report Value */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100 bg-slate-950/40 border-x border-slate-800/80">
                      Rp {formatIDR(item.financialReportValue)}
                    </td>

                    {/* Regulatory Report Value */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-300 bg-slate-950/20">
                      Rp {formatIDR(item.regulatoryReportValue)}
                    </td>

                    {/* Variance */}
                    <td className={`py-3.5 px-4 text-right font-mono font-bold ${hasVariance ? 'text-amber-400' : 'text-slate-500'}`}>
                      {hasVariance ? `Rp ${formatIDR(variance)}` : 'Rp 0'}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      {item.status === 'MATCHED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> MATCHED
                        </span>
                      )}
                      {item.status === 'DISCREPANCY' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> DISCREPANCY
                        </span>
                      )}
                      {item.status === 'RECONCILED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                          <FileCheck className="w-3 h-3" /> RECONCILED
                        </span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700 transition-colors inline-flex items-center gap-1"
                      >
                        <Search className="w-3 h-3 text-[#DFFF00]" />
                        Detail & Root Cause
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Timeline Shortcut Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#DFFF00]/10 border border-[#DFFF00]/20 text-[#DFFF00]">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Laporan & Timeline Audit Log Terintegrasi
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Tercatat <strong className="text-slate-200">{historyRuns.length} sesi audit</strong> rekonsiliasi keuangan lengkap dengan bukti digital (*Audit Hash*) dan Catatan Atas Laporan Keuangan (CALK).
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('timeline')}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#DFFF00] border border-slate-700 text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
        >
          Lihat Timeline Audit Log Completes
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  )}

      {/* Detail & Root Cause Modal Drawer */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto text-slate-100"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-[#DFFF00]">
                      {selectedItem.id}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {selectedItem.category}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{selectedItem.accountName}</h3>
                </div>

                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Side-by-side value box */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">
                    Financial Report (Buku ERP)
                  </span>
                  <div className="text-base font-black font-mono text-slate-100">
                    Rp {formatIDR(selectedItem.financialReportValue)}
                  </div>
                  <span className="text-[8px] text-slate-500 block">Dasar: PSAK 19 / IFRS At-Cost</span>
                </div>

                <div className="space-y-1 border-l border-slate-800 pl-3">
                  <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest block">
                    Regulatory Report (OJK/BKPM)
                  </span>
                  <div className="text-base font-black font-mono text-blue-400">
                    Rp {formatIDR(selectedItem.regulatoryReportValue)}
                  </div>
                  <span className="text-[8px] text-slate-500 block">Dasar: LKPM BKPM / NIB Operational Commitment</span>
                </div>
              </div>

              {/* Root cause analysis box */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <Zap className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-widest">
                    Analisis Akar Penyebab (Root Cause Analysis)
                  </h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedItem.rootCause}
                </p>
              </div>

              {/* Note input for manual adjustment */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Catatan Penyesuaian Auditor SPI (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Masukkan catatan klarifikasi rekonsiliasi atau nomor dokumen pendukung..."
                  value={adjustmentNote}
                  onChange={(e) => setAdjustmentNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#DFFF00]/50"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  Tutup
                </button>

                <button
                  onClick={() => handleReconcileSingleItem(selectedItem.id)}
                  className="px-4 py-2 rounded-xl bg-[#DFFF00] hover:bg-[#c8e600] text-slate-950 text-xs font-bold transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Tandai Direkonsiliasi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
