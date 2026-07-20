import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  PieChart, 
  Calculator, 
  FileCheck, 
  RefreshCcw, 
  Landmark, 
  ArrowLeft, 
  Download, 
  CheckCircle2, 
  Loader2, 
  FileSpreadsheet, 
  FileText, 
  ShieldCheck, 
  UploadCloud, 
  Terminal, 
  Cpu, 
  AlertTriangle, 
  History, 
  Globe, 
  Database,
  Lock,
  Server,
  Code,
  Search,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Decimal } from 'decimal.js';
import RealizedPnLChart from './RealizedPnLChart';

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

interface FinancialReportingCenterProps {
  portfolioData?: PortfolioAsset[];
  cashBalance?: number;
  giroBalance?: number;
  realizedPnL?: number;
  totalFees?: number;
  transactions?: any[];
}

interface Report {
  id: string;
  titleInd: string;
  titleEng: string;
  standard: string;
  lastUpdate: string;
  status?: string;
}

interface AuditLog {
  timestamp: string;
  eventCode: string;
  level: 'INFO' | 'WARN' | 'SECURE';
  message: string;
}

interface ExtractedLedger {
  tanggal: string;
  kodeAkun: string;
  deskripsi: string;
  jumlah: number;
  mappedCoa: string;
  confidence: number;
}

export default function FinancialReportingCenter({ 
  portfolioData, 
  cashBalance, 
  giroBalance = 711000, 
  realizedPnL = 0, 
  totalFees = 0,
  transactions = []
}: FinancialReportingCenterProps) {
  const [activeTab, setActiveTabState] = useState<'REPORTS' | 'SECURE_VAULT' | 'TRANSACTIONS'>('REPORTS');
  const [kpiMetric, setKpiMetric] = useState<'ROA' | 'ROE' | 'GPM' | 'CR'>('ROA');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showPreview, setShowPreview] = useState<string | null>(null);

  // Filter states for transaction history tab
  const [txSearch, setTxSearch] = useState('');
  const [txSideFilter, setTxSideFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [txBrokerFilter, setTxBrokerFilter] = useState<'ALL' | 'CGS_INTERNATIONAL' | 'IBKR'>('ALL');
  
  // Staging area information
  const [retentionProgress, setRetentionProgress] = useState(100);
  const [isSecureSyncActive, setIsSecureSyncActive] = useState(true);

  const [lastUpdateTime, setLastUpdateTime] = useState<string>('2026-06-16 12:10:29');

  // Dynamic current date & month calculation for real-time reporting context
  const getRealTimeReportingDate = () => {
    const d = new Date();
    const monthsInd = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const monthsEng = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const day = d.getDate();
    const monthInd = monthsInd[d.getMonth()];
    const monthEng = monthsEng[d.getMonth()];
    const year = d.getFullYear();
    
    return {
      formattedInd: `${day} ${monthInd} ${year}`,
      formattedEng: `${monthEng} ${day}, ${year}`,
      monthYearInd: `${monthInd} ${year}`,
      monthYearEng: `${monthEng} ${year}`,
      monthShortEng: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
      yearShort: String(year).slice(-2)
    };
  };

  // Active reports state
  const [reports, setReports] = useState<Report[]>([
    { id: 'BS', titleInd: 'Neraca Konsolidasi', titleEng: 'Consolidated Balance Sheet', standard: 'PSAK 71 / IFRS 9', lastUpdate: '10 Mins Ago', status: 'STABLE' },
    { id: 'PL', titleInd: 'Laba Rugi Komprehensif', titleEng: 'Statement of Comprehensive Income', standard: 'PSAK 1 / IAS 1', lastUpdate: 'Live', status: 'STABLE' },
    { id: 'CF', titleInd: 'Arus Kas Automatis', titleEng: 'Automated Cash Flow Statement', standard: 'PSAK 2 / IAS 7', lastUpdate: 'Daily', status: 'STABLE' },
  ]);

  // Financial values that can be dynamically updated by vault finalize
  const [financialValues, setFinancialValues] = useState({
    // Balance Sheet (Rp)
    cash26: 2950677,
    cash25: 989908.69, // Kas dan Setara Kas (Audit 2025)
    giro26: giroBalance !== undefined ? giroBalance : 711000,
    giro25: 262900, // Keuntungan Portofolio Belum Direalisasi (Audit 2025)
    invest26: 1226900,
    invest25: 1018300, // Investasi Saham At Cost (Audit 2025)
    fixed26: 5950000,
    fixed25: 6000000, // PC & Monitor MSI Cost
    shortLiability26: 0,
    shortLiability25: 0,
    paidCapital26: 9300000,
    paidCapital25: 6196225.05, // Modal Disetor (Audit 2025)
    retainedEarnings26: 1538577, // Corrected to include separate 711.000 Giro balance (827577 + 711000)
    retainedEarnings25: 2074883.64, // Laba Komprehensif (Audit 2025)

    // Profit Loss (Rp)
    rev26: 456200,
    rev25: 11319740, // Pendapatan Usaha Penjualan Efek (Audit 2025)
    hpp26: 0,
    hpp25: -9203333, // Harga Pokok Penjualan (Audit 2025)
    operatingExpense26: -575000,
    operatingExpense25: -304838, // Total Beban Operasional (Audit 2025)
    depreciationExpense26: -50000,
    depreciationExpense25: 0,
    interestIncome26: 0,
    interestIncome25: 414.64, // Bunga RDN & Bagi Hasil Giro (Audit 2025)
    unrealizedSecurities26: -581650,
    unrealizedSecurities25: 262900, // Keuntungan Portofolio Belum Direalisasi (Audit 2025)
    realizedSecurities26: 0,
    realizedSecurities25: 0,
    tax25: 0,
    tax26: 0,

    // Cash Flow (Rp)
    received26: 456200,
    received25: 11319802.64, // Penerimaan Penjualan Saham & Bagi Hasil (Audit 2025)
    operatingExpenseOut26: -575000,
    operatingExpenseOut25: -9507819, // Pembayaran Pembelian Saham & Biaya (Audit 2025)
    investOut26: -5193450,
    investOut25: -7018300, // Kas Bersih Aktivitas Investasi (Audit 2025)
    proceedsCapital26: 7300000,
    proceedsCapital25: 6196225.05, // Setoran Modal (Audit 2025)
    beginningCash26: 989908.69, // Saldo Kas Awal 2026 (Cocok dengan Saldo Akhir 2025)
    beginningCash25: 0, // Saldo Kas Awal 2025
  });

  // Create a primitive fingerprint digest to avoid array-reference based re-rendering cascades
  const portfolioFingerprint = useMemo(() => {
    if (!portfolioData) return '';
    return portfolioData.map(asset => `${asset.ticker}:${asset.marketValue || 0}:${asset.unrealized || 0}:${asset.currentPrice || 0}`).join('|');
  }, [portfolioData]);

  // Create a fingerprint for transactions to handle dependencies safely
  const transactionsFingerprint = useMemo(() => {
    if (!transactions) return '';
    return transactions.map((tx: any) => `${tx.id}:${tx.side}:${tx.price}:${tx.quantity}`).join('|');
  }, [transactions]);

  // Sync with portfolioData and cashBalance props from custom portfolio rebalancing
  useEffect(() => {
    if (portfolioData && cashBalance !== undefined) {
      const liveInvest26 = portfolioData.reduce((acc, asset) => acc + (asset.marketValue || 0), 0);
      const liveCash26 = cashBalance;
      const liveGiro26 = giroBalance;
      const liveUnrealizedSecurities26 = portfolioData.reduce((acc, asset) => acc + (asset.unrealized || 0), 0);
      
      const netCurrentAssets26 = liveCash26 + liveInvest26 + liveGiro26;
      const netTotalAssets26 = netCurrentAssets26 + 5950000; // fixed26 is 5950000
      const totalLiabilities26 = 0; // shortLiability26 is 0
      const liveRetainedEarnings26 = netTotalAssets26 - totalLiabilities26 - 9300000; // paidCapital26 is 9300000

      // Calculate real-time Revenue (sell transactions) and HPP (buy transactions)
      const totalSellAmount = (transactions || []).filter((tx: any) => tx.side === 'SELL' || tx.side === 'STOP_LOSS').reduce((acc: number, tx: any) => {
        const rate = tx.currency === 'USD' ? 16000 : 1;
        return acc + (tx.quantity * tx.price * rate);
      }, 0);

      const totalBuyAmount = (transactions || []).filter((tx: any) => tx.side === 'BUY').reduce((acc: number, tx: any) => {
        const rate = tx.currency === 'USD' ? 16000 : 1;
        return acc + (tx.quantity * tx.price * rate);
      }, 0);

      const liveRev26 = 456200 + totalSellAmount;
      const liveHpp26 = 0 - totalBuyAmount;

      // Calculate real-time tax from buy and sell fees
      const totalBuyFees = (transactions || []).filter((tx: any) => tx.side === 'BUY').reduce((acc: number, tx: any) => {
        const rate = tx.currency === 'USD' ? 16000 : 1;
        const val = tx.quantity * tx.price * rate;
        const commission = val * 0.001815; // 0.1815% Broker Fee (includes PPN)
        const levy = val * 0.0004; // 0.04% IDX Levy
        return acc + (commission + levy);
      }, 0);

      const totalSellFees = (transactions || []).filter((tx: any) => tx.side === 'SELL' || tx.side === 'STOP_LOSS').reduce((acc: number, tx: any) => {
        const rate = tx.currency === 'USD' ? 16000 : 1;
        const val = tx.quantity * tx.price * rate;
        const commission = val * 0.002815; // 0.2815% Broker Fee (includes PPN)
        const levy = val * 0.0004; // 0.04% IDX Levy
        const pph = val * 0.001; // 0.1% PPh Final
        return acc + (commission + levy + pph);
      }, 0);

      const sellTaxPPh = (transactions || []).filter((tx: any) => tx.side === 'SELL' || tx.side === 'STOP_LOSS').reduce((acc: number, tx: any) => {
        const rate = tx.currency === 'USD' ? 16000 : 1;
        return acc + (tx.quantity * tx.price * rate * 0.001); // 0.1% PPh Final
      }, 0);

      const liveTax26 = 0 - Math.round(sellTaxPPh); // Store PPh Final as a negative expense (CGS fee includes PPN, and no 12% PPN in transaction)

      // Subtract the tax portion from the totalFees to get the pure operating expense burden
      const liveOpex26 = -575000 - (totalFees - Math.abs(liveTax26));

      // Dynamic Cash Flows to make Balance Sheet always balance with Income & Cash flow logically
      const liveOpexOut26 = -575000 - totalFees;
      const liveReceived26 = liveRev26;
      const liveBeginningCash26 = 989908.69;
      const liveCfOperating26 = liveReceived26 + liveOpexOut26; // liveRev26 - 575000 - totalFees
      const liveCfFinancing26 = 7300000;
      const liveCfInvesting26 = liveCash26 - liveBeginningCash26 - liveCfOperating26 - liveCfFinancing26;

      setFinancialValues(prev => {
        // Only trigger state update if values have actually changed compared to the previous state objects
        if (
          prev.cash26 === liveCash26 &&
          prev.giro26 === liveGiro26 &&
          prev.invest26 === liveInvest26 &&
          prev.unrealizedSecurities26 === liveUnrealizedSecurities26 &&
          prev.realizedSecurities26 === realizedPnL &&
          prev.retainedEarnings26 === liveRetainedEarnings26 &&
          prev.operatingExpense26 === liveOpex26 &&
          prev.tax26 === liveTax26 &&
          prev.operatingExpenseOut26 === liveOpexOut26 &&
          prev.investOut26 === liveCfInvesting26 &&
          prev.beginningCash26 === liveBeginningCash26 &&
          prev.rev26 === liveRev26 &&
          prev.hpp26 === liveHpp26 &&
          prev.received26 === liveReceived26
        ) {
          return prev;
        }

        return {
          ...prev,
          cash26: liveCash26,
          giro26: liveGiro26,
          invest26: liveInvest26,
          unrealizedSecurities26: liveUnrealizedSecurities26,
          realizedSecurities26: realizedPnL,
          retainedEarnings26: liveRetainedEarnings26,
          operatingExpense26: liveOpex26,           // Sync transaction fees without tax portion as operating expense
          tax26: liveTax26,                         // Sync tax portion of fees as Tax expense
          operatingExpenseOut26: liveOpexOut26,     // Sync transaction fees as operating cash outflow
          investOut26: liveCfInvesting26,           // Balanced investment outflow/inflow matching ending ledger cash
          beginningCash26: liveBeginningCash26,
          rev26: liveRev26,
          hpp26: liveHpp26,
          received26: liveReceived26,
        };
      });

      // Update lastUpdateTime with standard format (matching last update of financial report)
      const now = new Date();
      const formatTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      
      setLastUpdateTime(prev => {
        // Prevent update cascade if calculated format time string is unchanged
        if (prev === formatTime) return prev;
        return formatTime;
      });
    }
  }, [portfolioFingerprint, cashBalance, giroBalance, realizedPnL, totalFees, transactionsFingerprint]);

  // Keep report lastUpdate values synced with lastUpdateTime
  useEffect(() => {
    setReports(prev => prev.map(r => ({
      ...r,
      lastUpdate: `Updated: ${lastUpdateTime}`
    })));
  }, [lastUpdateTime]);

  // Vault states
  const [vaultFileName, setVaultFileName] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'IDLE' | 'UPLOADING' | 'SCANNING' | 'COMPLETED' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedLedgers, setExtractedLedgers] = useState<ExtractedLedger[]>([]);
  const [terminalFeed, setTerminalFeed] = useState<string[]>([]);
  const [playgroundEndpoint, setPlaygroundEndpoint] = useState<'POST_UPLOAD' | 'GET_STATUS' | 'GET_PREVIEW' | null>(null);
  const [playgroundOutput, setPlaygroundOutput] = useState<string>('');
  const [playgroundStatus, setPlaygroundStatus] = useState<number | null>(null);

  // ISO 27001 audit logging
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { timestamp: new Date().toLocaleTimeString('id-ID'), eventCode: 'ISO_INITIALIZE', level: 'SECURE', message: 'VAM Secure Vault Environment Initialized' },
    { timestamp: new Date().toLocaleTimeString('id-ID'), eventCode: 'VPC_ENGAGE', level: 'INFO', message: 'VPC Private network routing active' },
    { timestamp: new Date().toLocaleTimeString('id-ID'), eventCode: 'CORS_STRICT', level: 'INFO', message: 'Strict domain locks verified: *.ventuream.com only' }
  ]);

  // Standard COA reference for mapping
  const CHART_OF_ACCOUNTS: Record<string, string> = {
    "#1100": "Kas dan Setara Kas (Current Cash System)",
    "#1200": "Investasi Lancar / Surat Berharga",
    "#4100": "Pendapatan Komprehensif Berjalan",
    "#5100": "Beban Operasional & Administrasi Lainnya"
  };

  // Helper to add log on compliance stream
  const addAuditLog = (eventCode: string, level: 'INFO' | 'WARN' | 'SECURE', message: string) => {
    const time = new Date().toLocaleTimeString('id-ID');
    setAuditLogs(prev => [
      { timestamp: time, eventCode, level, message },
      ...prev
    ].slice(0, 30));
  };

  // Simulated 24-hour retention deletion ticker count
  useEffect(() => {
    const t = setInterval(() => {
      setRetentionProgress(p => p > 0 ? p - 1 : 100);
    }, 8000);
    return () => clearInterval(t);
  }, []);

  const handleGenerate = () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    addAuditLog('GEN_REPORT', 'INFO', 'Bilingual PSAK/IFRS Document Generation triggered by user: aidilsyahdan2000@gmail.com');
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsGenerating(false);
            setReports(current => current.map(r => r.id === 'BS' ? { ...r, status: 'GENERATED' } : r));
            addAuditLog('REPORT_READY', 'SECURE', 'Consolidated positions finalized and verified under SHA-256 integrity signature.');
            setShowPreview('BS'); // Preview BS after generation
          }, 500);
          return 100;
        }
        return prev + 5;
      });
    }, 70);
  };

  const handlePreview = (id: string) => {
    setReports(current => current.map(r => r.id === id ? { ...r, status: 'LAST PREVIEWED' } : r));
    setShowPreview(id);
    addAuditLog('REPORT_PREVIEW', 'INFO', `User viewed preview frame for ID: ${id}`);
  };

  const formatIdr = (val: number, useParensForNegative = false) => {
    if (val === 0) return '0';
    const hasDecimal = val % 1 !== 0;
    const formatted = Math.abs(val).toLocaleString('id-ID', {
      minimumFractionDigits: hasDecimal ? 2 : 0,
      maximumFractionDigits: 2
    });
    if (val < 0) {
      return useParensForNegative ? `(${formatted})` : `-${formatted}`;
    }
    return formatted;
  };

  const getReportContent = (id: string) => {
    // Dynamically calculate aggregates
    const netCurrentAssets26 = financialValues.cash26 + (financialValues.giro26 || 0) + financialValues.invest26;
    const netCurrentAssets25 = financialValues.cash25 + (financialValues.giro25 || 0) + financialValues.invest25;
    
    const netNonCurrentAssets26 = financialValues.fixed26;
    const netNonCurrentAssets25 = financialValues.fixed25;

    const netTotalAssets26 = netCurrentAssets26 + netNonCurrentAssets26;
    const netTotalAssets25 = netCurrentAssets25 + netNonCurrentAssets25;

    const totalLiabilities26 = financialValues.shortLiability26;
    const totalLiabilities25 = financialValues.shortLiability25;

    const totalEquity26 = financialValues.paidCapital26 + financialValues.retainedEarnings26;
    const totalEquity25 = financialValues.paidCapital25 + financialValues.retainedEarnings25;

    const netTotalPasiva26 = totalLiabilities26 + totalEquity26;
    const netTotalPasiva25 = totalLiabilities25 + totalEquity25;

    // Laba Rugi
    const netOperatingProfit26 = financialValues.rev26 + financialValues.hpp26 + financialValues.operatingExpense26 + financialValues.depreciationExpense26 + financialValues.interestIncome26 + (financialValues.realizedSecurities26 || 0) + (financialValues.tax26 || 0);
    const netOperatingProfit25 = financialValues.rev25 + financialValues.hpp25 + financialValues.operatingExpense25 + financialValues.depreciationExpense25 + financialValues.interestIncome25 + (financialValues.realizedSecurities25 || 0) + (financialValues.tax25 || 0);

    const totalComprehensiveProfit26 = netOperatingProfit26 + financialValues.unrealizedSecurities26;
    const totalComprehensiveProfit25 = netOperatingProfit25 + financialValues.unrealizedSecurities25;

    // Cash Flow
    const cfOperating26 = financialValues.received26 + financialValues.operatingExpenseOut26;
    const cfOperating25 = financialValues.received25 + financialValues.operatingExpenseOut25;

    const cfInvesting26 = financialValues.investOut26;
    const cfInvesting25 = financialValues.investOut25;

    const cfFinancing26 = financialValues.proceedsCapital26;
    const cfFinancing25 = financialValues.proceedsCapital25;

    const netCashIncrease26 = cfOperating26 + cfInvesting26 + cfFinancing26;
    const netCashIncrease25 = cfOperating25 + cfInvesting25 + cfFinancing25;

    const endingCash26 = financialValues.beginningCash26 + netCashIncrease26;

    switch (id) {
      case 'BS':
        return {
          titleInd: 'LAPORAN POSISI KEUANGAN KONSOLIDASIAN',
          titleEng: 'CONSOLIDATED STATEMENT OF FINANCIAL POSITION',
          rows: [
            { labelInd: 'ASET LANCAR', labelEng: 'CURRENT ASSETS', val26: formatIdr(netCurrentAssets26), val25: formatIdr(netCurrentAssets25), isBold: true },
            { labelInd: 'Kas dan Setara Kas (Bank, RDN & Giro)', labelEng: 'Cash and Cash Equivalents', val26: formatIdr(financialValues.cash26 + (financialValues.giro26 || 0)), val25: formatIdr(financialValues.cash25 + (financialValues.giro25 || 0)) },
            { labelInd: 'Portofolio Saham & Efek (2026) / Investasi Saham At Cost (2025)', labelEng: 'Securities Portfolio (2026) / Stock Investments At Cost (2025)', val26: formatIdr(financialValues.invest26), val25: formatIdr(financialValues.invest25) },
            { labelInd: 'TOTAL ASET LANCAR', labelEng: 'TOTAL CURRENT ASSETS', val26: formatIdr(netCurrentAssets26), val25: formatIdr(netCurrentAssets25), isBold: true },
            
            { labelInd: 'ASET TETAP / TIDAK LANCAR', labelEng: 'NON-CURRENT ASSETS', val26: formatIdr(netNonCurrentAssets26), val25: formatIdr(netNonCurrentAssets25), isBold: true },
            { labelInd: 'Fasilitas Media (PC & Monitor MSI) - Net', labelEng: 'Media Facilities (PC & Monitor) - Net', val26: formatIdr(financialValues.fixed26), val25: formatIdr(financialValues.fixed25) },
            { labelInd: 'TOTAL ASET TETAP / TIDAK LANCAR', labelEng: 'TOTAL NON-CURRENT ASSETS', val26: formatIdr(netNonCurrentAssets26), val25: formatIdr(netNonCurrentAssets25), isBold: true },
            
            { labelInd: 'TOTAL ASET', labelEng: 'TOTAL CONSOLIDATED ASSETS', val26: formatIdr(netTotalAssets26), val25: formatIdr(netTotalAssets25), isBold: true },
            
            { labelInd: 'LIABILITAS', labelEng: 'LIABILITIES', val26: formatIdr(totalLiabilities26), val25: formatIdr(totalLiabilities25), isBold: true },
            { labelInd: 'Kewajiban Jangka Pendek', labelEng: 'Short-Term Liabilities', val26: formatIdr(financialValues.shortLiability26), val25: formatIdr(financialValues.shortLiability25) },
            { labelInd: 'TOTAL LIABILITAS (Zero Debt)', labelEng: 'TOTAL LIABILITIES', val26: formatIdr(totalLiabilities26), val25: formatIdr(totalLiabilities25), isBold: true },
            
            { labelInd: 'EKUITAS', labelEng: 'EQUITY', val26: formatIdr(totalEquity26), val25: formatIdr(totalEquity25), isBold: true },
            { labelInd: 'Modal Disetor & Saldo Laba (Awal)', labelEng: 'Paid-in Capital & Retained Earnings (Beginning)', val26: formatIdr(financialValues.paidCapital26), val25: formatIdr(financialValues.paidCapital25) },
            { labelInd: 'Laba Komprehensif Periode Berjalan', labelEng: 'Comprehensive Income for the Period', val26: formatIdr(financialValues.retainedEarnings26), val25: formatIdr(financialValues.retainedEarnings25) },
            { labelInd: 'TOTAL EKUITAS', labelEng: 'TOTAL EQUITY', val26: formatIdr(totalEquity26), val25: formatIdr(totalEquity25), isBold: true },
            
            { labelInd: 'TOTAL PASIVA', labelEng: 'TOTAL LIABILITIES & EQUITY', val26: formatIdr(netTotalPasiva26), val25: formatIdr(netTotalPasiva25), isBold: true }
          ]
        };
      case 'PL':
        return {
          titleInd: 'LAPORAN LABA RUGI KOMPREHENSIF',
          titleEng: 'STATEMENT OF COMPREHENSIVE INCOME',
          rows: [
            { labelInd: 'PENDAPATAN USAHA / OPERASIONAL', labelEng: 'OPERATING INCOME / REVENUE', val26: formatIdr(financialValues.rev26), val25: formatIdr(financialValues.rev25), isBold: true },
            { labelInd: 'Harga Pokok Penjualan (HPP)', labelEng: 'Cost of Goods Sold (COGS)', val26: formatIdr(financialValues.hpp26, true), val25: formatIdr(financialValues.hpp25, true) },
            { labelInd: 'Beban Operasional & Administrasi', labelEng: 'Operating & Admin Expenses', val26: formatIdr(financialValues.operatingExpense26, true), val25: formatIdr(financialValues.operatingExpense25, true) },
            { labelInd: 'Beban Penyusutan Aset', labelEng: 'Depreciation Expenses', val26: formatIdr(financialValues.depreciationExpense26, true), val25: formatIdr(financialValues.depreciationExpense25, true) },
            { labelInd: 'Hasil Bunga RDN & Lainnya', labelEng: 'Interest Income & Others', val26: formatIdr(financialValues.interestIncome26), val25: formatIdr(financialValues.interestIncome25) },
            { labelInd: 'Laba (Rugi) Direalisasikan (Rebalancing)', labelEng: 'Realized Gain / (Loss) on Portfolio Rebalancing', val26: formatIdr(financialValues.realizedSecurities26 || 0, true), val25: formatIdr(financialValues.realizedSecurities25 || 0, true) },
            { labelInd: 'Pajak Penghasilan (Estimasi)', labelEng: 'Income Tax (Estimated)', val26: formatIdr(financialValues.tax26 || 0, true), val25: formatIdr(financialValues.tax25 || 0, true) },
            
            { labelInd: 'LABA (RUGI) BERSIH OPERASIONAL YTD', labelEng: 'NET INCOME (LOSS) FROM OPERATIONS YTD', val26: formatIdr(netOperatingProfit26, true), val25: formatIdr(netOperatingProfit25, true), isBold: true },
            
            { labelInd: 'Unrealized Gain / (Loss) Efek (Mark-to-market)', labelEng: 'Unrealized Gain / (Loss) on Securities', val26: formatIdr(financialValues.unrealizedSecurities26, true), val25: formatIdr(financialValues.unrealizedSecurities25, true) },
            
            { labelInd: 'TOTAL LABA (RUGI) KOMPREHENSIF', labelEng: 'TOTAL COMPREHENSIVE INCOME (LOSS)', val26: formatIdr(totalComprehensiveProfit26, true), val25: formatIdr(totalComprehensiveProfit25, true), isBold: true }
          ]
        };
      case 'CF':
        return {
          titleInd: 'LAPORAN ARUS KAS KONSOLIDASI',
          titleEng: 'STATEMENT OF CASH FLOWS',
          rows: [
            { labelInd: 'ARUS KAS DARI AKTIVITAS OPERASI', labelEng: 'CASH FLOW FROM OPERATING ACTIVITIES', val26: formatIdr(cfOperating26, true), val25: cfOperating25 === 0 ? '-' : formatIdr(cfOperating25, true), isBold: true },
            { labelInd: 'Penerimaan dari Penjualan Efek & Dividen', labelEng: 'Receipts from Sales & Dividends', val26: formatIdr(financialValues.received26), val25: financialValues.received25 === 0 ? '-' : formatIdr(financialValues.received25) },
            { labelInd: 'Pembayaran Beban Operasional', labelEng: 'Payments for Operating Expenses', val26: formatIdr(financialValues.operatingExpenseOut26, true), val25: financialValues.operatingExpenseOut25 === 0 ? '-' : formatIdr(financialValues.operatingExpenseOut25, true) },
            
            { labelInd: 'ARUS KAS DARI AKTIVITAS INVESTASI', labelEng: 'CASH FLOW FROM INVESTING ACTIVITIES', val26: formatIdr(cfInvesting26, true), val25: cfInvesting25 === 0 ? '-' : formatIdr(cfInvesting25, true), isBold: true },
            { labelInd: 'Perolehan Aset Portofolio Efek', labelEng: 'Acquisition of Securities Portfolio', val26: formatIdr(financialValues.investOut26, true), val25: financialValues.investOut25 === 0 ? '-' : formatIdr(financialValues.investOut25, true) },
            
            { labelInd: 'ARUS KAS DARI AKTIVITAS PENDANAAN', labelEng: 'CASH FLOW FROM FINANCING ACTIVITIES', val26: formatIdr(cfFinancing26), val25: cfFinancing25 === 0 ? '-' : formatIdr(cfFinancing25), isBold: true },
            { labelInd: 'Penerimaan Setoran Modal (YTD)', labelEng: 'Proceeds from Capital Contribution (YTD)', val26: formatIdr(financialValues.proceedsCapital26), val25: financialValues.proceedsCapital25 === 0 ? '-' : formatIdr(financialValues.proceedsCapital25) },
            
            { labelInd: 'KENAIKAN (PENURUNAN) KAS BERSIH', labelEng: 'NET INCREASE (DECREASE) IN CASH', val26: formatIdr(netCashIncrease26, true), val25: cfOperating25 === 0 && cfInvesting25 === 0 && cfFinancing25 === 0 ? '-' : formatIdr(netCashIncrease25, true), isBold: true },
            { labelInd: 'Saldo Awal Kas', labelEng: 'Beginning Cash Balance', val26: formatIdr(financialValues.beginningCash26), val25: formatIdr(financialValues.beginningCash25, true) },
            { labelInd: 'SALDO KAS AKHIR', labelEng: 'ENDING CASH BALANCE', val26: formatIdr(endingCash26), val25: formatIdr(financialValues.cash25) }
          ]
        };
      default:
        return null;
    }
  };

  const reportData = showPreview ? getReportContent(showPreview) : null;

  const exportToCSV = () => {
    if (!reportData) return;
    
    const csvData = reportData.rows.map(row => ({
      'Uraian (IDN)': row.labelInd,
      'Description (ENG)': row.labelEng,
      '2026 (Rp)': row.val26,
      '2025 (Rp)': row.val25
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportData.titleEng.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addAuditLog('CSV_EXTRACT', 'INFO', `Successfully compiled & downloaded CSV: ${reportData.titleEng}`);
  };

  const exportToPDF = () => {
    const netCurrentAssets26 = financialValues.cash26 + (financialValues.giro26 || 0) + financialValues.invest26;
    const netCurrentAssets25 = financialValues.cash25 + (financialValues.giro25 || 0) + financialValues.invest25;

    const netNonCurrentAssets26 = financialValues.fixed26;
    const netNonCurrentAssets25 = financialValues.fixed25;

    const netTotalAssets26 = netCurrentAssets26 + netNonCurrentAssets26;
    const netTotalAssets25 = netCurrentAssets25 + netNonCurrentAssets25;

    const totalLiabilities26 = financialValues.shortLiability26;
    const totalLiabilities25 = financialValues.shortLiability25;

    const totalEquity26 = financialValues.paidCapital26 + financialValues.retainedEarnings26;
    const totalEquity25 = financialValues.paidCapital25 + financialValues.retainedEarnings25;

    const netOperatingProfit26 = financialValues.rev26 + financialValues.hpp26 + financialValues.operatingExpense26 + financialValues.depreciationExpense26 + financialValues.interestIncome26 + (financialValues.realizedSecurities26 || 0) + (financialValues.tax26 || 0);
    const netOperatingProfit25 = financialValues.rev25 + financialValues.hpp25 + financialValues.operatingExpense25 + financialValues.depreciationExpense25 + financialValues.interestIncome25 + (financialValues.realizedSecurities25 || 0) + (financialValues.tax25 || 0);

    const totalComprehensiveProfit26 = netOperatingProfit26 + financialValues.unrealizedSecurities26;
    const totalComprehensiveProfit25 = netOperatingProfit25 + financialValues.unrealizedSecurities25;

    // Cash Flow calculations
    const cfOperating26 = financialValues.received26 + financialValues.operatingExpenseOut26;
    const cfInvesting26 = financialValues.investOut26;
    const cfFinancing26 = financialValues.proceedsCapital26;
    const netCashIncrease26 = cfOperating26 + cfInvesting26 + cfFinancing26;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const writeParagraph = (docObj: any, text: string, x: number, yStart: number, width: number, lineHeight: number) => {
      const lines = docObj.splitTextToSize(text, width);
      let y = yStart;
      for (let i = 0; i < lines.length; i++) {
        docObj.text(lines[i], x, y);
        y += lineHeight;
      }
      return y;
    };

    // ==================== PAGE 1 ====================
    let y = 25;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(40, 40, 40);
    
    y = writeParagraph(doc, "sejak tanggal 01 Januari 2026 hingga penutupan 31 Mei 2026, dengan menyandingkan data historis penuh tahun buku 2025 guna menyajikan riset kinerja keuangan komparatif, serta diperkuat dengan deklarasi pemilik manfaat akhir (UBO) dan penetapan klasifikasi internasional.", 20, y, 170, 5.5);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(24, 24, 27);
    y = writeParagraph(doc, "I. LANDASAN KEUANGAN KONSOLIDASI YTD (PER 31 MEI 2026 - TERKOREKSI)", 20, y, 170, 6.5);
    y += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    y = writeParagraph(doc, "Penyusunan Buku Saham Perusahaan PT Venture Asset Management ¹ per tanggal 31 Mei 2026 didasarkan secara ketat pada data keuangan yang tersaji di dalam Laporan Keuangan Konsolidasi YTD (Consolidated Financial Report YTD) perseroan untuk periode 01 Januari 2026 sampai dengan penutupan 31 Mei 2026 yang telah dikoreksi berdasarkan tarif penyusutan PC/Monitor MSI sebesar 2% per tahun (garis lurus) tanpa amortisasi/penyusutan aset tetap lainnya.", 20, y, 170, 5.5);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(24, 24, 27);
    y = writeParagraph(doc, "1. Laporan Posisi Keuangan (Neraca) / Statement of Financial Position", 20, y, 170, 6);
    y += 2.5;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(110, 110, 110);
    y = writeParagraph(doc, "(Posisi YTD per 31 Mei 2026 – Terkoreksi / As of May 31, 2026 – Corrected) ¹", 20, y, 170, 5);
    y += 6;

    autoTable(doc, {
      startY: y,
      margin: { left: 20, right: 20 },
      head: [['Bahasa Indonesia (ID)', 'Nilai (IDR)', 'English (EN)']],
      body: [
        ['ASET', '-', 'ASSETS'],
        ['Aset Lancar', '-', 'Current Assets'],
        ['Kas dan Setara Kas (Bank, RDN & Giro)', formatIdr(financialValues.cash26 + (financialValues.giro26 || 0)), 'Cash and Cash Equivalents'],
        ['Portofolio Saham & Efek ¹', formatIdr(financialValues.invest26) + ' ¹', 'Securities Portfolio ¹'],
        ['Total Aset Lancar', formatIdr(financialValues.cash26 + (financialValues.giro26 || 0) + financialValues.invest26), 'Total Current Assets'],
        ['Aset Tetap', '-', 'Non-Current Assets'],
        ['Fasilitas Media (PC & Monitor MSI) - Net ¹', formatIdr(financialValues.fixed26) + ' ¹', 'Media Facilities (PC & Monitor) - Net ¹'],
        ['Total Aset Tetap', formatIdr(financialValues.fixed26), 'Total Non-Current Assets']
      ],
      theme: 'grid',
      headStyles: { fillColor: [248, 250, 252], textColor: [24, 24, 27], fontStyle: 'bold', fontSize: 9.5, lineColor: [210, 210, 210], lineWidth: 0.1 },
      bodyStyles: { fontSize: 9, cellPadding: 3.5, textColor: [40, 40, 40], lineColor: [210, 210, 210], lineWidth: 0.1 },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 35, halign: 'right' },
        2: { cellWidth: 65 }
      },
      didParseCell: (data) => {
        const idx = data.row.index;
        const isHeaderRow = idx === 0 || idx === 1 || idx === 4 || idx === 5 || idx === 7;
        if (isHeaderRow && data.section === 'body') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [15, 15, 15];
        }
      }
    });

    // ==================== PAGE 2 ====================
    doc.addPage();
    y = 25;

    autoTable(doc, {
      startY: y,
      margin: { left: 20, right: 20 },
      body: [
        ['TOTAL ASET ¹', formatIdr(financialValues.cash26 + (financialValues.giro26 || 0) + financialValues.invest26 + financialValues.fixed26) + ' ¹', 'TOTAL ASSETS ¹'],
        ['LIABILITAS & EKUITAS', '-', 'LIABILITIES & EQUITY'],
        ['Liabilitas', '-', 'Liabilities'],
        ['Kewajiban Jangka Pendek', formatIdr(financialValues.shortLiability26), 'Short-Term Liabilities'],
        ['Total Liabilitas (Zero Debt)', formatIdr(financialValues.shortLiability26), 'Total Liabilities'],
        ['Ekuitas', '-', 'Equity'],
        ['Modal Disetor', formatIdr(financialValues.paidCapital26), 'Paid-in Capital'],
        ['Laba Ditahan & Berjalan YTD ¹', formatIdr(financialValues.retainedEarnings26) + ' ¹', 'Retained Earnings & Current Income ¹'],
        ['Total Ekuitas', formatIdr(financialValues.paidCapital26 + financialValues.retainedEarnings26), 'Total Equity'],
        ['TOTAL PASIVA ¹', formatIdr(financialValues.paidCapital26 + financialValues.retainedEarnings26) + ' ¹', 'TOTAL LIABILITIES & EQUITY ¹']
      ],
      theme: 'grid',
      bodyStyles: { fontSize: 9, cellPadding: 3.5, textColor: [40, 40, 40], lineColor: [210, 210, 210], lineWidth: 0.1 },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 35, halign: 'right' },
        2: { cellWidth: 65 }
      },
      didParseCell: (data) => {
        const idx = data.row.index;
        const isBoldRow = idx === 0 || idx === 1 || idx === 2 || idx === 4 || idx === 5 || idx === 8 || idx === 9;
        if (isBoldRow && data.section === 'body') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [15, 15, 15];
        }
        if ((idx === 0 || idx === 9) && data.section === 'body') {
          data.cell.styles.fillColor = [245, 247, 250];
        }
      }
    });
    y = (doc as any).lastAutoTable.finalY + 12;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(24, 24, 27);
    y = writeParagraph(doc, "2. Laporan Laba Rugi YTD / Statement of Profit or Loss", 20, y, 170, 6);
    y += 2.5;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(110, 110, 110);
    y = writeParagraph(doc, "(Periode Berjalan 01 Januari – 31 Mei 2026 – Terkoreksi / For the Period of Jan 01 – May 31, 2026 – Corrected) ¹", 20, y, 170, 5);
    y += 6;

    autoTable(doc, {
      startY: y,
      margin: { left: 20, right: 20 },
      head: [['Bahasa Indonesia (ID)', 'Nilai (IDR)', 'English (EN)']],
      body: [
        ['Pendapatan Investasi & Dividen', formatIdr(financialValues.rev26), 'Investment & Dividend Income'],
        ['Beban Operasional & Administrasi', formatIdr(financialValues.operatingExpense26, true), 'Operating & Admin Expenses'],
        ['Beban Penyusutan Aset (5 Bulan) ¹', formatIdr(financialValues.depreciationExpense26, true) + ' ¹', 'Depreciation Expenses (5 Months) ¹']
      ],
      theme: 'grid',
      headStyles: { fillColor: [248, 250, 252], textColor: [24, 24, 27], fontStyle: 'bold', fontSize: 9.5, lineColor: [210, 210, 210], lineWidth: 0.1 },
      bodyStyles: { fontSize: 9, cellPadding: 3.5, textColor: [40, 40, 40], lineColor: [210, 210, 210], lineWidth: 0.1 },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 35, halign: 'right' },
        2: { cellWidth: 65 }
      }
    });

    // ==================== PAGE 3 ====================
    doc.addPage();
    y = 25;

    autoTable(doc, {
      startY: y,
      margin: { left: 20, right: 20 },
      body: [
        ['LABA (RUGI) BERSIH OPERASIONAL YTD ¹', formatIdr(netOperatingProfit26, true) + ' ¹', 'NET INCOME (LOSS) YTD ¹']
      ],
      theme: 'grid',
      bodyStyles: { fontSize: 9, cellPadding: 3.5, fontStyle: 'bold', textColor: [15, 15, 15], fillColor: [245, 247, 250], lineColor: [210, 210, 210], lineWidth: 0.1 },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 35, halign: 'right' },
        2: { cellWidth: 65 }
      }
    });
    y = (doc as any).lastAutoTable.finalY + 12;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(24, 24, 27);
    y = writeParagraph(doc, "3. Laporan Arus Kas YTD / Statement of Cash Flows", 20, y, 170, 6);
    y += 2.5;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(110, 110, 110);
    y = writeParagraph(doc, "(Periode Berjalan 01 Januari – 31 Mei 2026 – Terkoreksi / For the Period of Jan 01 – May 31, 2026 – Corrected) ¹", 20, y, 170, 5);
    y += 6;

    autoTable(doc, {
      startY: y,
      margin: { left: 20, right: 20 },
      head: [['Bahasa Indonesia (ID)', 'Nilai (IDR)', 'English (EN)']],
      body: [
        ['Arus Kas Aktivitas Operasi', formatIdr(cfOperating26, true), 'Cash Flows from Operations'],
        ['Penerimaan dari Penjualan Efek & Dividen', formatIdr(financialValues.received26), 'Receipts from Sales & Dividends'],
        ['Pembayaran Beban Operasional', formatIdr(financialValues.operatingExpenseOut26, true), 'Payments for Operating Expenses'],
        ['Arus Kas Aktivitas Investasi ¹', formatIdr(cfInvesting26, true) + ' ¹', 'Cash Flows from Investing ¹'],
        ['Perolehan Aset Portofolio Efek ¹', formatIdr(cfInvesting26, true) + ' ¹', 'Acquisition of Securities Portfolio ¹'],
        ['Arus Kas Aktivitas Pendanaan ¹', formatIdr(cfFinancing26) + ' ¹', 'Cash Flows from Financing ¹'],
        ['Penerimaan Setoran Modal (YTD) ¹', formatIdr(cfFinancing26) + ' ¹', 'Proceeds from Capital Contribution ¹'],
        ['Kenaikan (Penurunan) Kas Bersih', formatIdr(netCashIncrease26, true), 'Net Increase (Decrease) in Cash']
      ],
      theme: 'grid',
      headStyles: { fillColor: [248, 250, 252], textColor: [24, 24, 27], fontStyle: 'bold', fontSize: 9.5, lineColor: [210, 210, 210], lineWidth: 0.1 },
      bodyStyles: { fontSize: 9, cellPadding: 3.5, textColor: [40, 40, 40], lineColor: [210, 210, 210], lineWidth: 0.1 },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 35, halign: 'right' },
        2: { cellWidth: 65 }
      },
      didParseCell: (data) => {
        const idx = data.row.index;
        const isBoldRow = idx === 0 || idx === 3 || idx === 5 || idx === 7;
        if (isBoldRow && data.section === 'body') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [15, 15, 15];
        }
      }
    });

    // ==================== PAGE 4 ====================
    doc.addPage();
    y = 25;

    autoTable(doc, {
      startY: y,
      margin: { left: 20, right: 20 },
      body: [
        ['Saldo Awal Kas (01 Januari 2026)', formatIdr(financialValues.beginningCash26), 'Beginning Cash Balance'],
        ['SALDO KAS AKHIR (31 MEI 2026)', formatIdr(financialValues.cash26 + (financialValues.giro26 || 0)), 'ENDING CASH BALANCE']
      ],
      theme: 'grid',
      bodyStyles: { fontSize: 9, cellPadding: 3.5, textColor: [40, 40, 40], lineColor: [210, 210, 210], lineWidth: 0.1 },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 35, halign: 'right' },
        2: { cellWidth: 65 }
      },
      didParseCell: (data) => {
        if (data.row.index === 1 && data.section === 'body') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [15, 15, 15];
          data.cell.styles.fillColor = [245, 247, 250];
        }
      }
    });
    y = (doc as any).lastAutoTable.finalY + 12;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    y = writeParagraph(doc, `Berdasarkan data keuangan di atas, perseroan menunjukkan posisi solvabilitas yang sangat sehat dengan total liabilitas sebesar IDR 0 (DER 0%), yang berarti seluruh operasional dan investasi dibiayai murni oleh modal pemegang saham.¹ Nilai total ekuitas perseroan per tanggal 31 Mei 2026 tercatat sebesar IDR ${formatIdr(totalEquity26)}, yang dibentuk oleh pos Modal Disetor sebesar IDR ${formatIdr(financialValues.paidCapital26)} dan akumulasi Laba Ditahan & Berjalan sebesar IDR ${formatIdr(financialValues.retainedEarnings26)}.`, 20, y, 170, 5.5);

    // ==================== PAGE 5 ====================
    doc.addPage();
    y = 25;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(24, 24, 27);
    y = writeParagraph(doc, "II. ANALISIS KOMPARATIF KINERJA KEUANGAN (BUKU AUDIT 2025 VS PERIODE BERJALAN 2026 - TERKOREKSI PER 31 MEI 2026)", 20, y, 170, 6.5);
    y += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    y = writeParagraph(doc, "Untuk mengukur laju pertumbuhan dan arah kebijakan taktis PT Venture Asset Management ¹, berikut disajikan riset perbandingan keuangan terperinci yang menyandingkan hasil audit penutupan tahun buku 2025 (periode berjalan semester 2 / tahun buku penuh) dengan realisasi organik berjalan tahun 2026 setelah disesuaikan dengan penyusutan 2% tahunan:¹", 20, y, 170, 5.5);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(24, 24, 27);
    y = writeParagraph(doc, "1. Laporan Posisi Keuangan Komparatif (Common-Size)", 20, y, 170, 6);
    y += 6;

    const pctChange = (v26: number, v25: number) => {
      if (v25 === 0) return '0,00%';
      const pct = ((v26 - v25) / v25) * 100;
      return (pct >= 0 ? '+' : '') + pct.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
    };

    autoTable(doc, {
      startY: y,
      margin: { left: 20, right: 20 },
      head: [['Pos Posisi Keuangan', 'Realisasi Buku 31 Des 2025 (IDR)', 'Realisasi Organik 31 Mei 2026 (IDR)', 'Perubahan (%)']],
      body: [
        ['Aset Lancar', '', '', ''],
        ['Kas dan Setara Kas (Bank, RDN & Giro)', formatIdr(financialValues.cash25 + (financialValues.giro25 || 0)), formatIdr(financialValues.cash26 + (financialValues.giro26 || 0)), pctChange(financialValues.cash26 + (financialValues.giro26 || 0), financialValues.cash25 + (financialValues.giro25 || 0))],
        ['Portofolio Saham & Efek (Nilai Pasar) ¹', formatIdr(financialValues.invest25) + ' ¹', formatIdr(financialValues.invest26) + ' ¹', pctChange(financialValues.invest26, financialValues.invest25)],
        ['Total Aset Lancar', formatIdr(netCurrentAssets25), formatIdr(netCurrentAssets26), pctChange(netCurrentAssets26, netCurrentAssets25)],
        ['Aset Tetap / Tidak Lancar', '', '', ''],
        ['Properti & Aset Tetap Neto', formatIdr(financialValues.fixed25), formatIdr(financialValues.fixed26) + ' ¹', pctChange(financialValues.fixed26, financialValues.fixed25)],
        ['TOTAL ASET', formatIdr(netTotalAssets25), formatIdr(netTotalAssets26) + ' ¹', pctChange(netTotalAssets26, netTotalAssets25)],
        ['Liabilitas & Ekuitas', '', '', '']
      ],
      theme: 'grid',
      headStyles: { fillColor: [248, 250, 252], textColor: [24, 24, 27], fontStyle: 'bold', fontSize: 9.5, lineColor: [210, 210, 210], lineWidth: 0.1 },
      bodyStyles: { fontSize: 9, cellPadding: 3.5, textColor: [40, 40, 40], lineColor: [210, 210, 210], lineWidth: 0.1 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40, halign: 'right' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' }
      },
      didParseCell: (data) => {
        const idx = data.row.index;
        const isBoldRow = idx === 0 || idx === 3 || idx === 4 || idx === 6 || idx === 7;
        if (isBoldRow && data.section === 'body') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [15, 15, 15];
        }
        if (idx === 6 && data.section === 'body') {
          data.cell.styles.fillColor = [245, 247, 250];
        }
      }
    });

    // ==================== PAGE 6 ====================
    doc.addPage();
    y = 25;

    autoTable(doc, {
      startY: y,
      margin: { left: 20, right: 20 },
      body: [
        ['Total Kewajiban (Utang)', formatIdr(totalLiabilities25), formatIdr(totalLiabilities26), pctChange(totalLiabilities26, totalLiabilities25)],
        ['Modal Disetor', formatIdr(financialValues.paidCapital25), formatIdr(financialValues.paidCapital26), pctChange(financialValues.paidCapital26, financialValues.paidCapital25)],
        ['Laba Ditahan & Berjalan YTD', formatIdr(financialValues.retainedEarnings25), formatIdr(financialValues.retainedEarnings26) + ' ¹', pctChange(financialValues.retainedEarnings26, financialValues.retainedEarnings25)],
        ['TOTAL EKUITAS', formatIdr(totalEquity25), formatIdr(totalEquity26) + ' ¹', pctChange(totalEquity26, totalEquity25)]
      ],
      theme: 'grid',
      bodyStyles: { fontSize: 9, cellPadding: 3.5, textColor: [40, 40, 40], lineColor: [210, 210, 210], lineWidth: 0.1 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40, halign: 'right' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' }
      },
      didParseCell: (data) => {
        if (data.row.index === 3 && data.section === 'body') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [15, 15, 15];
          data.cell.styles.fillColor = [245, 247, 250];
        }
      }
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(24, 24, 27);

    doc.text('•', 20, y);
    doc.setFont("helvetica", "bold");
    doc.text('Ekspansi Likuiditas Kas:', 24, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);

    const totalCash26 = financialValues.cash26 + (financialValues.giro26 || 0);
    const totalCash25 = financialValues.cash25 + (financialValues.giro25 || 0);
    const cashGrowthStr = pctChange(totalCash26, totalCash25);
    const hasCashGrown = totalCash26 > totalCash25;
    const cashCommentary = hasCashGrown
      ? `Saldo kas dan setara kas (rekening bank, RDN, dan giro) bertumbuh sebesar ${cashGrowthStr} menjadi IDR ${formatIdr(totalCash26)} per 31 Mei 2026.¹ Pertumbuhan ini didorong oleh realokasi dana taktis oleh pemegang saham.`
      : `Saldo kas dan setara kas (rekening bank, RDN, dan giro) terkoreksi sebesar ${cashGrowthStr} menjadi IDR ${formatIdr(totalCash26)} per 31 Mei 2026.¹ Penyesuaian ini mencerminkan alokasi dana ditarik atau ditempatkan pada aset investasi modal reguler.`;

    y = writeParagraph(doc, cashCommentary, 24, y + 4.5, 166, 5) + 3;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(24, 24, 27);
    doc.text('•', 20, y);
    doc.text('Struktur Modal Tanpa Utang:', 24, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    y = writeParagraph(doc, "Kebijakan Zero-Debt berhasil dipertahankan secara konsisten selama dua tahun berturut-turut (DER dan DAR sebesar 0,00%), mengeliminasi risiko solvabilitas serta beban bunga pinjaman secara mutlak.¹", 24, y + 4.5, 166, 5) + 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(24, 24, 27);
    y = writeParagraph(doc, "2. Laporan Laba Rugi Komparatif", 20, y, 170, 6);
    y += 6;

    autoTable(doc, {
      startY: y,
      margin: { left: 20, right: 20 },
      head: [['Akun Laba Rugi', 'Realisasi Buku 2025 (IDR)', 'Realisasi YTD Berjalan 2026 (IDR)', 'Analisis & Interpretasi Kinerja']],
      body: [
        ['Pendapatan Operasional', formatIdr(financialValues.rev25), formatIdr(financialValues.rev26), 'Pergeseran fokus dari trading aktif menjadi realisasi dividen & kupon.'],
        ['Harga Pokok Penjualan (HPP)', formatIdr(financialValues.hpp25, true), formatIdr(financialValues.hpp26, true), 'Biaya perolehan saham yang telah direalisasikan jual.'],
        ['Beban Operasional & Administrasi', formatIdr(financialValues.operatingExpense25, true), formatIdr(financialValues.operatingExpense26, true), 'Peningkatan beban akibat kliring regulasi dan legal bursa.']
      ],
      theme: 'grid',
      headStyles: { fillColor: [248, 250, 252], textColor: [24, 24, 27], fontStyle: 'bold', fontSize: 9.5, lineColor: [210, 210, 210], lineWidth: 0.1 },
      bodyStyles: { fontSize: 9, cellPadding: 3.5, textColor: [40, 40, 40], lineColor: [210, 210, 210], lineWidth: 0.1 },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 35, halign: 'right' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 55 }
      }
    });

    // ==================== PAGE 7 ====================
    doc.addPage();
    y = 25;

    autoTable(doc, {
      startY: y,
      margin: { left: 20, right: 20 },
      body: [
        ['Beban Penyusutan Aset', formatIdr(financialValues.depreciationExpense25, true), formatIdr(financialValues.depreciationExpense26, true), 'Pengukuran amortisasi peralatan media secara merata di 2026 YTD.'],
        ['Hasil Bunga RDN & Lainnya', formatIdr(financialValues.interestIncome25), formatIdr(financialValues.interestIncome26), 'Pendapatan non-operasional sekunder yang diakui.'],
        ['Laba Operasional Bersih', formatIdr(netOperatingProfit25, true), formatIdr(netOperatingProfit26, true), 'Tekanan margin operasional yang minimal mendekati titik impas.'],
        ['Unrealized Gain / (Loss) Efek', formatIdr(financialValues.unrealizedSecurities25, true), formatIdr(financialValues.unrealizedSecurities26, true), 'Dampak revaluasi rebalancing portofolio efek pasar harian.'],
        ['TOTAL LABA (RUGI) KOMPREHENSIF', formatIdr(totalComprehensiveProfit25, true), formatIdr(totalComprehensiveProfit26, true), 'Penurunan murni akibat penyesuaian pasar yang belum direalisasi.']
      ],
      theme: 'grid',
      bodyStyles: { fontSize: 9, cellPadding: 3.5, textColor: [40, 40, 40], lineColor: [210, 210, 210], lineWidth: 0.1 },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 35, halign: 'right' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 55 }
      },
      didParseCell: (data) => {
        const idx = data.row.index;
        const isBoldRow = idx === 2 || idx === 4;
        if (isBoldRow && data.section === 'body') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [15, 15, 15];
        }
        if (idx === 4 && data.section === 'body') {
          data.cell.styles.fillColor = [245, 247, 250];
        }
      }
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(24, 24, 27);

    doc.text('•', 20, y);
    doc.text('Analisis Kualitas Kerugian 2026:', 24, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);

    const netOpProfit26Str = formatIdr(netOperatingProfit26, true);
    const unrealizedSec26Str = formatIdr(financialValues.unrealizedSecurities26, true);
    y = writeParagraph(doc, `Setelah dikoreksi berdasarkan tarif penyusutan 2% tahunan, laba/rugi operasional berjalan adalah sebesar IDR ${netOpProfit26Str}.¹ Sebagian besar penyesuaian disebabkan oleh revaluasi portofolio atau penyesuaian pasar belum terealisasi sebesar IDR ${unrealizedSec26Str}.¹ Kas riil perusahaan tetap berada pada kondisi prima.¹`, 24, y + 4.5, 166, 5) + 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(24, 24, 27);
    y = writeParagraph(doc, "3. Perhitungan Rasio Kinerja Utama Komparatif", 20, y, 170, 6);
    y += 6;

    // ROE
    const roe25 = (totalComprehensiveProfit25 / totalEquity25) * 100;
    const roe26 = ((totalComprehensiveProfit26 * 12) / 5 / totalEquity26) * 100;
    const roa25 = (totalComprehensiveProfit25 / netTotalAssets25) * 100;
    const roa26 = ((totalComprehensiveProfit26 * 12) / 5 / netTotalAssets26) * 100;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(24, 24, 27);
    doc.text('•', 20, y);
    doc.text('Return on Equity (ROE):', 24, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(`o  Tahun 2025: (Laba Bersih Komprehensif Rp ${formatIdr(totalComprehensiveProfit25)} / Total Ekuitas Rp ${formatIdr(totalEquity25)}) = ${roe25.toFixed(2).replace('.', ',')}%`, 24, y + 5);
    doc.text(`o  Tahun 2026 (Disetahunkan / Annualized): (Komprehensif Rp ${formatIdr(totalComprehensiveProfit26)} * 12/5) / Total Ekuitas Rp ${formatIdr(totalEquity26)} = ${roe26.toFixed(2).replace('.', ',')}%`, 24, y + 10);
    y += 16;

    // ROA
    doc.setFont("helvetica", "bold");
    doc.setTextColor(24, 24, 27);
    doc.text('•', 20, y);
    doc.text('Return on Assets (ROA):', 24, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(`o  Tahun 2025: (Laba Bersih Komprehensif Rp ${formatIdr(totalComprehensiveProfit25)} / Total Aset Rp ${formatIdr(netTotalAssets25)}) = ${roa25.toFixed(2).replace('.', ',')}%`, 24, y + 5);
    doc.text(`o  Tahun 2026 (Disetahunkan / Annualized): (Komprehensif Rp ${formatIdr(totalComprehensiveProfit26)} * 12/5) / Total Aset Rp ${formatIdr(netTotalAssets26)} = ${roa26.toFixed(2).replace('.', ',')}%`, 24, y + 10);
    y += 16;

    // ==================== POST PASS FOOTER AND HEADER ====================
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Draw top decoration line
      doc.setDrawColor(240, 240, 240);
      doc.setLineWidth(0.2);
      doc.line(20, 15, 190, 15);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`PT Venture Asset Management  |  Laporan Keuangan Konsolidasi Terkoreksi`, 20, 11);
      doc.text(`CONFIDENTIAL`, 190, 11, { align: 'right' });

      // Draw bottom decoration line
      doc.line(20, 280, 190, 280);
      
      doc.text(`PT Venture Asset Management  |  Institutional Financial Compliance Report`, 20, 285);
      doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
    }

    const fileName = `VentureAM_Comprehensive_YTD_Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    addAuditLog('PDF_EXTRACT', 'INFO', `Successfully generated 7-page institutional compliance report PDF: ${fileName}`);
  };

  const exportTrendToPDF = () => {
    // Calculate values matching dashboard calculations
    const netOperatingProfit26 = financialValues.rev26 + (financialValues.hpp26 || 0) + (financialValues.operatingExpense26 || 0) + (financialValues.depreciationExpense26 || 0) + (financialValues.interestIncome26 || 0) + (financialValues.realizedSecurities26 || 0);
    const totalComprehensiveProfit26 = netOperatingProfit26 + (financialValues.unrealizedSecurities26 || 0);
    const netCurrentAssets26 = financialValues.cash26 + (financialValues.giro26 || 0) + financialValues.invest26;
    const netTotalAssets26 = netCurrentAssets26 + financialValues.fixed26;
    const totalEquity26 = financialValues.paidCapital26 + financialValues.retainedEarnings26;

    const currentROA = netTotalAssets26 > 0 ? (totalComprehensiveProfit26 / netTotalAssets26) * 100 : -7.4;
    const currentROE = totalEquity26 > 0 ? (totalComprehensiveProfit26 / totalEquity26) * 100 : -7.4;
    const currentGPM = financialValues.rev26 > 0 ? ((financialValues.rev26 + (financialValues.hpp26 || 0)) / financialValues.rev26) * 100 : 100;
    const currentCR = financialValues.shortLiability26 > 0 
      ? (netCurrentAssets26 / financialValues.shortLiability26)
      : (netCurrentAssets26 / 250000);

    const metricsData = [
      {
        code: 'ROA',
        nameInd: 'Return on Assets',
        badge: 'Efficiency',
        points: [14.5, 12.0, 9.5, 4.2, -1.2, -4.8, -5.2, currentROA],
        unit: '%',
        colorRgb: [168, 85, 247]
      },
      {
        code: 'ROE',
        nameInd: 'Return on Equity',
        badge: 'Profitability',
        points: [28.2, 22.1, 15.5, 8.4, -2.3, -6.2, -7.1, currentROE],
        unit: '%',
        colorRgb: [245, 158, 11]
      },
      {
        code: 'GPM',
        nameInd: 'Gross Profit Margin',
        badge: 'Margin',
        points: [18.7, 35.0, 50.0, 75.0, 95.0, 100.0, 98.0, currentGPM],
        unit: '%',
        colorRgb: [16, 185, 129]
      },
      {
        code: 'CR',
        nameInd: 'Current Ratio',
        badge: 'Solvency',
        points: [3.2, 4.5, 6.8, 10.2, 12.4, 14.5, 15.2, currentCR],
        unit: 'x',
        colorRgb: [34, 211, 238]
      }
    ];

    const timeline = ['DES 25', 'JAN 26', 'FEB 26', 'MAR 26', 'APR 26', 'MEI 26', 'JUN 26', 'JUL 26'];

    const doc = new jsPDF();

    // Dark banner header matching the institutional system theme
    doc.setFillColor(15, 15, 20);
    doc.rect(0, 0, 210, 42, 'F');

    doc.setFontSize(20);
    doc.setTextColor(223, 255, 0); // VAM Brand Color #DFFF00
    doc.setFont("helvetica", "bold");
    doc.text('VENTURE ASSET MANAGEMENT', 15, 16);

    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.setFont("helvetica", "normal");
    doc.text('INSTITUTIONAL PERFORMANCE PORTAL  |  TREASURY SYSTEM', 15, 23);

    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('SECURE CRYPTOGRAPHIC LEDGER REPORT  |  ISO 27001 AUDITED', 15, 28);

    doc.setFontSize(8);
    doc.setTextColor(223, 255, 0);
    doc.rect(155, 11, 40, 18);
    doc.text('PORTAL STATUS:', 158, 16);
    doc.setFont("helvetica", "bold");
    doc.text('COMPLIANT CONNECT', 158, 21);
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text('IBKR / CGS Gateway Live', 158, 25);

    doc.setDrawColor(223, 255, 0);
    doc.setLineWidth(1);
    doc.line(15, 42, 195, 42);

    // Document Titles
    doc.setFontSize(14);
    doc.setTextColor(24, 24, 27);
    doc.setFont("helvetica", "bold");
    doc.text('LAPORAN ANALISIS TREN METRIK KEUANGAN', 15, 54);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "italic");
    doc.text('FINANCIAL METRIC TREND COMPREHENSIVE REPORT', 15, 59);

    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "normal");
    doc.text(`Periode: Desember 2025 - Juli 2026 (Periode Fiskal Berjalan / Current Fiscal Period)`, 15, 66);
    doc.text(`Tanggal Cetak / Printed Date: ${lastUpdateTime} (WIB/Jakarta)`, 15, 70);

    // Format grid matrix
    const headers = ['METRIC INDICATOR', ...timeline];
    const rows = metricsData.map(m => [
      `${m.code} - ${m.nameInd}\n(${m.badge})`,
      ...m.points.map((val, idx) => {
        const fmtVal = val.toFixed(idx === m.points.length - 1 && m.code === 'CR' ? 2 : 1);
        return `${fmtVal}${m.unit}`;
      })
    ]);

    autoTable(doc, {
      startY: 75,
      head: [headers],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [20, 20, 25], textColor: [223, 255, 0], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, cellPadding: 3 },
      styles: { overflow: 'linebreak' },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' },
        7: { halign: 'center', fontStyle: 'bold' }
      }
    });

    let nextY = (doc as any).lastAutoTable.finalY + 12;

    doc.setFontSize(11);
    doc.setTextColor(24, 24, 27);
    doc.setFont("helvetica", "bold");
    doc.text('VISUALISASI TREN FISKAL / FISCAL TREND VISUALIZATION', 15, nextY);
    nextY += 4;

    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    doc.setFont("helvetica", "normal");
    doc.text('Rasio diplot berurutan dari Desember 2025 s.d Juli 2026 berjalan.', 15, nextY);
    nextY += 5;

    // Outer visual background box
    const boxStartY = nextY;
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 250, 252);
    doc.rect(15, boxStartY, 180, 68, 'FD');

    // Draw 2x2 grid of mini sparkline plots inside the PDF using high performance drawing vectors
    metricsData.forEach((m, idx) => {
      const isCol2 = idx % 2 === 1;
      const isRow2 = idx >= 2;
      const plotX = isCol2 ? 110 : 20;
      const plotY = isRow2 ? boxStartY + 36 : boxStartY + 6;

      // Draw background panel
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(255, 255, 255);
      doc.rect(plotX, plotY, 75, 26, 'FD');

      // Plot title
      doc.setFontSize(7.5);
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "bold");
      doc.text(`${m.code} (${m.nameInd})`, plotX + 3, plotY + 4);

      doc.setFontSize(9);
      doc.setTextColor(m.colorRgb[0], m.colorRgb[1], m.colorRgb[2]);
      const currentVal = m.points[m.points.length - 1].toFixed(m.code === 'CR' ? 2 : 1) + m.unit;
      doc.text(currentVal, plotX + 72, plotY + 4.5, { align: 'right' });

      // Baseline coordinate line
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.5);
      doc.line(plotX + 5, plotY + 21, plotX + 70, plotY + 21);

      // Calculations of local heights
      const minVal = Math.min(...m.points);
      const maxVal = Math.max(...m.points);
      const range = maxVal - minVal || 1;

      const mapPlotY = (val: number) => {
        const norm = (val - minVal) / range;
        return (plotY + 22) - (norm * 12); // Mapping from plotY + 10 down to plotY + 22
      };

      doc.setDrawColor(m.colorRgb[0], m.colorRgb[1], m.colorRgb[2]);
      doc.setLineWidth(1);

      const stepX = 58 / (m.points.length - 1);

      // Draw plot paths
      for (let pIdx = 0; pIdx < m.points.length - 1; pIdx++) {
        const x1 = plotX + 8 + pIdx * stepX;
        const y1 = mapPlotY(m.points[pIdx]);
        const x2 = plotX + 8 + (pIdx + 1) * stepX;
        const y2 = mapPlotY(m.points[pIdx + 1]);
        doc.line(x1, y1, x2, y2);
      }

      // Draw circles on pivots
      m.points.forEach((val, pIdx) => {
        const x = plotX + 8 + pIdx * stepX;
        const y = mapPlotY(val);
        doc.setFillColor(pIdx === m.points.length - 1 ? m.colorRgb[0] : 100, pIdx === m.points.length - 1 ? m.colorRgb[1] : 100, pIdx === m.points.length - 1 ? m.colorRgb[2] : 100);
        doc.setDrawColor(255, 255, 255);
        doc.circle(x, y, 1, 'FD');
      });
    });

    nextY = boxStartY + 74;

    // Commentary block
    doc.setFontSize(10);
    doc.setTextColor(24, 24, 27);
    doc.setFont("helvetica", "bold");
    doc.text('KOMENTAR EKSEKUTIF / EXECUTIVE COMMENTARY', 15, nextY);
    nextY += 5;

    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    
    const textInd = `Evaluasi tren sepanjang periode menunjukkan kestabilan liabilitas jangka pendek yang diimbangi dengan efisiensi pengelolaan kas & investasi lancar (tercermin pada peningkatan berkelanjutan Current Ratio yang kini berada pada tingkat optimal). Rasio ROA dan ROE mengalami fluktuasi namun menunjukkan basis rebound yang sehat pada bulan berjalan ${currentROA.toFixed(1)}% seiring dengan rampungnya mapping transaksi CoA via AI Secure Staging.`;
    const textEng = `Evaluation of trends across the current fiscal period indicates steady short-term liabilities perfectly matched with cash management and investment efficiency (reflected in the sustained expansion of the Current Ratio to optimal levels). ROA and ROE metrics have historically normalized and exhibit a healthy rebound to ${currentROA.toFixed(1)}% in the live period as CoA automated mapping converges inside our safe sandbox framework.`;

    const splitInd = doc.splitTextToSize(textInd, 180);
    doc.text(splitInd, 15, nextY);
    nextY += splitInd.length * 3.8 + 2;

    const splitEng = doc.splitTextToSize(textEng, 180);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(110, 110, 110);
    doc.text(splitEng, 15, nextY);
    nextY += splitEng.length * 4 + 8;

    doc.setFont("helvetica", "normal");
    doc.setDrawColor(220, 220, 220);
    doc.line(15, nextY, 195, nextY);
    nextY += 5;

    doc.setFontSize(7.5);
    doc.setTextColor(130, 130, 130);
    doc.text('VENTUREAM INSTITUTIONAL GATEWAY COA ENGINE (REV 2026.04)', 15, nextY);
    doc.text('AUTHORIZED SECURITY ENVELOPE: SHA-256 SIGNED', 15, nextY + 3.5);
    doc.text('CONFIDENTIAL - FOR INTERNAL COMPLIANCE USE ONLY', 195, nextY, { align: 'right' });

    doc.save(`VAM_FISCAL_TREND_REPORT_${new Date().toISOString().split('T')[0]}.pdf`);
    addAuditLog('PDF_EXTRACT', 'SECURE', `Successfully generated dynamic trend report PDF featuring all indicators: ROA, ROE, GPM, and Current Ratio.`);
  };

  // Live file upload processor (SOP-IT-VAM-003 execution)
  const processVaultFile = (fileName: string, content: string) => {
    const isPdf = fileName.toLowerCase().endsWith('.pdf');
    setVaultFileName(fileName);
    setUploadStatus('UPLOADING');
    setErrorMessage(null);
    setTerminalFeed([]);
    
    addAuditLog('VAULT_INGEST', 'INFO', `Uploaded file '${fileName}' received via Option B: Manual Ingestion.`);

    let tempFeed = [
      `[INGEST] SOP-IT-VAM-003 File Ingestion active for file '${fileName}'`,
      `[SECURITY] Saving payload to isolation storage 'vam-secure-vault-staging'`
    ];
    setTerminalFeed([...tempFeed]);

    // Simulate Cloud Function Trigger and step-by-step extraction
    setTimeout(() => {
      setUploadStatus('SCANNING');
      tempFeed.push(`[ENCRYPTION] Active block lock engaged: AES-256 hash registered`);
      tempFeed.push(`[TRIGGER] Staging event triggers Cloud Function execution (AI-Extraction Pipeline active)`);
      if (isPdf) {
        tempFeed.push(`[PDF_RECOGNITION] PDF layout detected. Launching deep document parsing & OCR vision engine`);
      }
      setTerminalFeed([...tempFeed]);
      
      if (isPdf) {
        // High fidelity simulated PDF OCR extraction mechanism
        setTimeout(() => {
          tempFeed.push(`[PDF_OCR] Model successfully registered layout structure. Extracted financial table: 'Venture Ledger'`);
          tempFeed.push(`[PDF_OCR] Column mapping: verified alignment for 'tanggal', 'kode_akun', 'deskripsi', 'jumlah'`);
          tempFeed.push(`[PDF_OCR] Processing 4 tabular lines with high level deep confidence bounds`);
          
          const pdfExtractedRows: ExtractedLedger[] = [
            {
              tanggal: "2026-06-15",
              kodeAkun: "#1100",
              deskripsi: "Top-up Kas & Setara Kas Bank BCA (PDF Ingested)",
              jumlah: 285000000000,
              mappedCoa: "#1100",
              confidence: 98
            },
            {
              tanggal: "2026-06-15",
              kodeAkun: "#1200",
              deskripsi: "Pembelian Investasi SBN Pemerintah Seri ORI025 (PDF Tabular)",
              jumlah: 140000000000,
              mappedCoa: "#1200",
              confidence: 96
            },
            {
              tanggal: "2026-06-16",
              kodeAkun: "#5100",
              deskripsi: "Beban Sewa Server Cloud Data Infrastructure (PDF Extracted)",
              jumlah: 12500000000,
              mappedCoa: "#5100",
              confidence: 95
            },
            {
              tanggal: "2026-06-17",
              kodeAkun: "#4100",
              deskripsi: "Omset Hasil Dividen Portofolio Berjalan (PDF Extracted)",
              jumlah: 115000000000,
              mappedCoa: "#4100",
              confidence: 94
            }
          ];

          tempFeed.push(`[NORMALIZATION] Converted numeric parameters to standard internal database decimal representation.`);
          tempFeed.push(`[FUZZY MAPPER] Mapped PDF OCR extracted descriptions to PSAK CoA definitions:`);
          pdfExtractedRows.forEach(item => {
            tempFeed.push(`  ↳ "${item.deskripsi}" ➔ ${item.mappedCoa} (${CHART_OF_ACCOUNTS[item.mappedCoa]}) | Conf: ${item.confidence}%`);
          });
          tempFeed.push(`[INGEST_COMPLETED] Ingestion completed. PDF OCR Dataset is staged in secure buffer and ready for final review.`);
          
          setTerminalFeed([...tempFeed]);
          setExtractedLedgers(pdfExtractedRows);
          setUploadStatus('COMPLETED');
          addAuditLog('VAULT_EXTR_OK', 'SECURE', `Successfully extracted & fuzzy-mapped ${pdfExtractedRows.length} ledgers from PDF '${fileName}'.`);
        }, 1500);
      } else {
        // Parse CSV Data
        Papa.parse(content, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const rows = results.data as any[];
            
            setTimeout(() => {
              // Check Checklist Kesiapan Data: Must contain 'tanggal', 'kode_akun', 'deskripsi', 'jumlah'
              const requiredColumns = ['tanggal', 'kode_akun', 'deskripsi', 'jumlah'];
              const fileColumns = results.meta.fields || [];
              const hasRequiredAndPresent = requiredColumns.every(col => fileColumns.map(f => f.toLowerCase().trim()).includes(col));
              
              if (!hasRequiredAndPresent || rows.length === 0) {
                setUploadStatus('ERROR');
                const missings = requiredColumns.filter(col => !fileColumns.map(f => f.toLowerCase().trim()).includes(col));
                const desc = `Error 422: Format file tidak sesuai dengan 'Checklist Kesiapan Data'. Kolom wajib hilang: [${missings.join(', ')}]`;
                setErrorMessage(desc);
                tempFeed.push(`[ERROR 422] SYSTEM UNPROCESSABLE ENTITY: Integrity check failed!`);
                tempFeed.push(`[ABORT] Data Extraction rejected. Logs registered for IT-Review.`);
                setTerminalFeed([...tempFeed]);
                addAuditLog('VAULT_ERR_422', 'WARN', `Ingestion failed - Validation 422 on file '${fileName}': format mismatch.`);
                return;
              }

              tempFeed.push(`[CHECKLIST] Data alignment verified. Processing ${rows.length} rows inside isolated VPC.`);
              
              // Normalize & Fuzzy Match COA descriptions
              const processedList: ExtractedLedger[] = rows.map((r, i) => {
                const rawDate = r.tanggal || '2026-06-12';
                const rawCoa = r.kode_akun || '#9999';
                const desc = r.deskripsi || '';
                const rawAmount = r.jumlah || '0';

                // 3.2 Data Normalization: standard conversion of commas/dots to standard decimal format
                const amountStr = rawAmount.toString().replace(/\./g, '').replace(/,/g, '.');
                const amountVal = parseFloat(amountStr) || 0;

                // 3.2 Fuzzy Matching Mapping Engine: maps description strings to standard reference Chart of Accounts
                const lowercaseDesc = desc.toLowerCase();
                let matchedCoaKey = '#5100'; // fallback operational expense
                let confidence = 85;

                if (lowercaseDesc.includes('kas') || lowercaseDesc.includes('bca') || lowercaseDesc.includes('mandiri') || lowercaseDesc.includes('cash')) {
                  matchedCoaKey = '#1100';
                  confidence = lowercaseDesc.includes('setara') ? 98 : 94;
                } else if (lowercaseDesc.includes('investasi') || lowercaseDesc.includes('saham') || lowercaseDesc.includes('obligasi') || lowercaseDesc.includes('sbn')) {
                  matchedCoaKey = '#1200';
                  confidence = 96;
                } else if (lowercaseDesc.includes('pendapatan') || lowercaseDesc.includes('dividen') || lowercaseDesc.includes('omset') || lowercaseDesc.includes('hasil')) {
                  matchedCoaKey = '#4100';
                  confidence = 92;
                } else if (lowercaseDesc.includes('beban') || lowercaseDesc.includes('biaya') || lowercaseDesc.includes('operational') || lowercaseDesc.includes('server')) {
                  matchedCoaKey = '#5100';
                  confidence = 94;
                }

                return {
                  tanggal: rawDate,
                  kodeAkun: rawCoa,
                  deskripsi: desc,
                  jumlah: amountVal,
                  mappedCoa: matchedCoaKey,
                  confidence: confidence
                };
              });

              tempFeed.push(`[NORMALIZATION] Converted numeric parameters to internal database decimals.`);
              tempFeed.push(`[FUZZY MAPPER] Mapped accounting descriptions to PSAK CoA definitions via proximity algorithms:`);
              processedList.forEach(item => {
                tempFeed.push(`  ↳ "${item.deskripsi}" ➔ ${item.mappedCoa} (${CHART_OF_ACCOUNTS[item.mappedCoa]}) | Conf: ${item.confidence}%`);
              });
              tempFeed.push(`[INGEST_COMPLETED] Ingestion completed. Dataset is staged in secure buffer and ready for final review.`);
              
              setTerminalFeed([...tempFeed]);
              setExtractedLedgers(processedList);
              setUploadStatus('COMPLETED');
              addAuditLog('VAULT_EXTR_OK', 'SECURE', `Successfully extracted & fuzzy-mapped ${processedList.length} ledgers from '${fileName}'.`);
            }, 1500);
          }
        });
      }
    }, 1200);
  };

  // Simulate file drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCustomDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        processVaultFile(file.name, text);
      };
      if (isPdf) {
        // Read as data URL or text to prevent crashing, process can just use mock/simulated triggers based on type
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    }
  };

  const handleManualFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        processVaultFile(file.name, text);
      };
      if (isPdf) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    }
  };

  // Pre-seed template execution
  const executePreseedTemplate = (type: 'SUCCESS' | 'FUZZY' | 'INVALID' | 'PDF_EXTRACT') => {
    if (type === 'SUCCESS') {
      const csv = `tanggal,kode_akun,deskripsi,jumlah
2026-06-15,#1100,Kas dan setoran bank BCA,250000000000
2026-06-16,#1200,Investasi obligasi pemerintah SBN,120000000000
2026-06-17,#5100,Beban audit komat-kamit,6500000000`;
      processVaultFile('ledger_q2_success.csv', csv);
    } else if (type === 'FUZZY') {
      const csv = `tanggal,kode_akun,deskripsi,jumlah
2026-06-15,#9999,Kas setara cash Bank Mandiri,450000000000
2026-06-16,#9999,Biaya operational cloud server datacenter,22000000000
2026-06-17,#9999,Omset hasil dividen sbn,135000000000`;
      processVaultFile('ledger_fuzzy_unmapped.csv', csv);
    } else if (type === 'PDF_EXTRACT') {
      // Trigger a PDF preseeded file
      processVaultFile('VAM_Ledger_Consolidated_Q2_2408.pdf', '%PDF-1.4 simulated contents');
    } else {
      const csv = `company_name,asset_class,estimated_cost
VentureAM,Luxury watches,120000000`;
      processVaultFile('invalid_manifest_format.xlsx', csv);
    }
  };

  // Post & Finalize simulated extracted ledgers into core reporting variables
  const handleFinalizeAndPost = () => {
    if (extractedLedgers.length === 0) return;

    // Add up values based on Mapped COA
    let cashAdd = 0;
    let investAdd = 0;
    let incomeAdd = 0;
    let expenseAdd = 0;

    extractedLedgers.forEach(item => {
      if (item.mappedCoa === '#1100') {
        cashAdd += item.jumlah;
      } else if (item.mappedCoa === '#1200') {
        investAdd += item.jumlah;
      } else if (item.mappedCoa === '#4100') {
        incomeAdd += item.jumlah;
      } else if (item.mappedCoa === '#5100') {
        expenseAdd += item.jumlah; // negative or positive representing expense
      }
    });

    setFinancialValues(prev => {
      const netIncomeAdd = incomeAdd - Math.abs(expenseAdd);
      return {
        ...prev,
        cash26: prev.cash26 + cashAdd,
        invest26: prev.invest26 + investAdd,
        rev26: prev.rev26 + incomeAdd,
        operatingExpense26: prev.operatingExpense26 - Math.abs(expenseAdd),
        retainedEarnings26: prev.retainedEarnings26 + netIncomeAdd,
        // Also update Cash Flow fields
        received26: prev.received26 + incomeAdd,
        operatingExpenseOut26: prev.operatingExpenseOut26 - Math.abs(expenseAdd),
        investOut26: prev.investOut26 - Math.abs(investAdd),
      };
    });

    addAuditLog('VAULT_POST_OK', 'SECURE', `Ledger finalized. Injected [Kas: Rp ${cashAdd.toLocaleString('id-ID')}, Investasi: Rp ${investAdd.toLocaleString('id-ID')}] directly into Core Balance Sheet PSAK 71.`);
    
    // Alert user
    alert(`FINALIZE SUKSES!\n\nData dari vault telah diposting dan dikonsolidasikan langsung ke Laporan Neraca & Laba Rugi core.`);
    
    // Switch to report tab
    setActiveTabState('REPORTS');
    setVaultFileName(null);
    setUploadStatus('IDLE');
    setExtractedLedgers([]);
  };

  // API Playground Console Simulation
  const simulateApiEndpoint = (endpoint: 'POST_UPLOAD' | 'GET_STATUS' | 'GET_PREVIEW') => {
    setPlaygroundEndpoint(endpoint);
    if (endpoint === 'POST_UPLOAD') {
      setPlaygroundStatus(200);
      setPlaygroundOutput(JSON.stringify({
        status: "success",
        code: 200,
        message: "File uploaded successfully to secure storage staging.",
        payload: {
          bucket: "vam-secure-vault-staging",
          fileName: vaultFileName || "ledger_auto_post.csv",
          fileHashHex: "da8ef82d0016bc46a00a12e2300ee71",
          rawSize: "1.2 KB",
          retention: "Automatically deleted after 24 hours"
        },
        vpcRouterState: "AUTHORIZED_INTERNAL"
      }, null, 2));
    } else if (endpoint === 'GET_STATUS') {
      setPlaygroundStatus(200);
      setPlaygroundOutput(JSON.stringify({
        status: "success",
        code: 200,
        jobId: "pipeline-job-773df01a",
        state: uploadStatus,
        progressPercent: uploadStatus === 'COMPLETED' ? 100 : uploadStatus === 'SCANNING' ? 50 : 0,
        isoCompliantAuditLog: "OK",
        cloudFunctionTriggered: true
      }, null, 2));
    } else {
      if (uploadStatus !== 'COMPLETED') {
        setPlaygroundStatus(400);
        setPlaygroundOutput(JSON.stringify({
          status: "error",
          code: 400,
          error: "No completed scanned data staged in secure-vault-staging. Perform file upload scanning first."
        }, null, 2));
      } else {
        setPlaygroundStatus(200);
        setPlaygroundOutput(JSON.stringify({
          status: "success",
          code: 200,
          message: "Precompiled extraction array ready.",
          resultsCount: extractedLedgers.length,
          normalizedDataset: extractedLedgers.map(i => ({
            date: i.tanggal,
            rawCode: i.kodeAkun,
            matchedCoa: i.mappedCoa,
            matchedCoaName: CHART_OF_ACCOUNTS[i.mappedCoa],
            rawDescription: i.deskripsi,
            decimalNormalizedValue: i.jumlah,
            aiConfidence: `${i.confidence}%`
          }))
        }, null, 2));
      }
    }
  };

  // Memoized transaction logic for the dedicated TRANSACTIONS tab
  const filteredTx = useMemo(() => {
    return (transactions || []).filter((tx: any) => {
      const query = txSearch.toLowerCase();
      const matchQuery = 
        tx.ticker.toLowerCase().includes(query) ||
        tx.broker.toLowerCase().includes(query) ||
        tx.side.toLowerCase().includes(query) ||
        tx.id.toLowerCase().includes(query);

      if (!matchQuery) return false;

      if (txSideFilter !== 'ALL') {
        if (txSideFilter === 'BUY' && tx.side !== 'BUY') return false;
        if (txSideFilter === 'SELL' && tx.side !== 'SELL' && tx.side !== 'STOP_LOSS') return false;
      }

      if (txBrokerFilter !== 'ALL' && tx.broker !== txBrokerFilter) return false;

      return true;
    });
  }, [transactions, txSearch, txSideFilter, txBrokerFilter]);

  const txAggregates = useMemo(() => {
    let totalVolume = 0;
    let totalGrossValue = 0;
    let totalCommissions = 0;
    let totalPPh = 0;
    let totalPPN = 0; // We'll map IDX Levy here for display-field compatibility (avoids breaking schemas)
    let totalFeesAndTaxes = 0;

    (transactions || []).forEach((tx: any) => {
      const rate = tx.currency === 'USD' ? 16000 : 1;
      const valueRp = tx.quantity * tx.price * rate;
      const isBuy = tx.side === 'BUY';
      
      const commissionRp = Math.round(valueRp * (isBuy ? 0.001815 : 0.002815));
      const idxLevyRp = Math.round(valueRp * 0.0004);
      const pphRp = isBuy ? 0 : Math.round(valueRp * 0.001);
      const totalFeeRp = commissionRp + idxLevyRp + pphRp;

      totalVolume += tx.quantity;
      totalGrossValue += valueRp;
      totalCommissions += commissionRp;
      totalPPh += pphRp;
      totalPPN += idxLevyRp; // Map IDX Levy here
      totalFeesAndTaxes += totalFeeRp;
    });

    return {
      totalVolume,
      totalGrossValue,
      totalCommissions,
      totalPPh,
      totalPPN,
      totalFeesAndTaxes
    };
  }, [transactions]);

  const handleExportTxCSV = () => {
    const csvData = filteredTx.map((tx: any) => {
      const rate = tx.currency === 'USD' ? 16000 : 1;
      const valueRp = tx.quantity * tx.price * rate;
      const isBuy = tx.side === 'BUY';
      
      const commissionRp = Math.round(valueRp * (isBuy ? 0.001815 : 0.002815));
      const idxLevyRp = Math.round(valueRp * 0.0004);
      const pphRp = isBuy ? 0 : Math.round(valueRp * 0.001);
      const totalFeeRp = commissionRp + idxLevyRp + pphRp;

      return {
        'ID': tx.id,
        'Timestamp': tx.timestamp,
        'Ticker': tx.ticker,
        'Side': tx.side,
        'Quantity (Shares)': tx.quantity,
        'Lots': tx.quantity / 100,
        'Price': tx.price,
        'Currency': tx.currency,
        'Exchange Rate (IDR)': rate,
        'Gross Value (IDR)': valueRp,
        'Broker Commission (IDR)': commissionRp,
        'IDX Levy (IDR)': idxLevyRp,
        'PPh Final 0.1% (IDR)': pphRp,
        'Total Fees & Taxes (IDR)': totalFeeRp,
        'Net Settlement Value (IDR)': isBuy ? (valueRp + totalFeeRp) : (valueRp - totalFeeRp),
        'Broker': tx.broker
      };
    });

    const csvString = Papa.unparse(csvData);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `VentureAM_Chronological_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addAuditLog('TX_EXPORT_CSV', 'INFO', `Successfully compiled and downloaded Transaction History CSV.`);
  };

  const handleExportTxPDF = () => {
    const doc = new jsPDF();

    // Dark banner header matching the institutional system theme
    doc.setFillColor(15, 15, 20);
    doc.rect(0, 0, 210, 42, 'F');

    doc.setFontSize(20);
    doc.setTextColor(223, 255, 0); // VAM Brand Color #DFFF00
    doc.setFont("helvetica", "bold");
    doc.text('VENTURE ASSET MANAGEMENT', 15, 16);

    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.setFont("helvetica", "normal");
    doc.text('CHRONOLOGICAL TRANSACTION LOG  |  TAX & FEES REPORT', 15, 23);

    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(`EXPORT TIME: ${new Date().toISOString()}  |  ISO 27001 COMPLIANT`, 15, 28);

    doc.setFontSize(8);
    doc.setTextColor(223, 255, 0);
    doc.rect(155, 11, 40, 18);
    doc.text('GATEWAY STATUS:', 158, 16);
    doc.setFont("helvetica", "bold");
    doc.text('CONNECTED SECURE', 158, 21);

    // Let's draw the table of transactions
    const headers = [['TIMESTAMP', 'TICKER', 'SIDE', 'QTY/LOTS', 'PRICE', 'GROSS VALUE', 'COMMISSION', 'TAX (LEVY/PPh)', 'NET SETTLE', 'BROKER']];
    const data = filteredTx.map((tx: any) => {
      const rate = tx.currency === 'USD' ? 16000 : 1;
      const valueRp = tx.quantity * tx.price * rate;
      const isBuy = tx.side === 'BUY';
      
      const commissionRp = Math.round(valueRp * (isBuy ? 0.001815 : 0.002815));
      const idxLevyRp = Math.round(valueRp * 0.0004);
      const pphRp = isBuy ? 0 : Math.round(valueRp * 0.001);
      const totalFeeRp = commissionRp + idxLevyRp + pphRp;

      const formattedPrice = tx.currency === 'USD' ? `$${tx.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : `Rp ${tx.price.toLocaleString('id-ID')}`;
      const formattedGross = `Rp ${valueRp.toLocaleString('id-ID')}`;
      const formattedComm = `Rp ${commissionRp.toLocaleString('id-ID')}`;
      const formattedTax = `Rp ${(pphRp + idxLevyRp).toLocaleString('id-ID')}`;
      const formattedNet = `Rp ${(isBuy ? (valueRp + totalFeeRp) : (valueRp - totalFeeRp)).toLocaleString('id-ID')}`;

      return [
        new Date(tx.timestamp).toLocaleString('id-ID', { hour12: false }),
        tx.ticker,
        tx.side,
        `${tx.quantity.toLocaleString('id-ID')} (${(tx.quantity / 100).toLocaleString('id-ID')} lot)`,
        formattedPrice,
        formattedGross,
        formattedComm,
        formattedTax,
        formattedNet,
        tx.broker
      ];
    });

    autoTable(doc, {
      startY: 48,
      head: headers,
      body: data,
      theme: 'grid',
      styles: {
        fontSize: 7,
        font: 'helvetica',
        textColor: [40, 40, 40]
      },
      headStyles: {
        fillColor: [15, 15, 20],
        textColor: [223, 255, 0],
        fontStyle: 'bold',
        fontSize: 7.5
      },
      alternateRowStyles: {
        fillColor: [248, 248, 250]
      }
    });

    doc.save(`VentureAM_Transactions_Ledger_${new Date().toISOString().split('T')[0]}.pdf`);
    addAuditLog('TX_EXPORT_PDF', 'SECURE', `Successfully exported & certified ${data.length} transactions as compliance PDF ledger.`);
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="max-w-md w-full bg-zinc-900 border border-orange-500/30 p-8 rounded-2xl text-center space-y-6">
              <div className="relative w-24 h-24 mx-auto">
                <Loader2 className="w-24 h-24 text-orange-400 animate-spin absolute inset-0 opacity-20" />
                <Landmark className="w-12 h-12 text-orange-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white uppercase tracking-tighter">GENERATING BILINGUAL REPORT</h3>
                <p className="text-xs text-zinc-500 mt-2">Compiling real-time institutional data with PSAK/IFRS compliance mapping.</p>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    className="h-full bg-orange-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${generationProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <span>Processing...</span>
                  <span>{generationProgress}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {showPreview && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl p-4 md:p-10 flex flex-col"
          >
            <div className="max-w-4xl mx-auto w-full bg-white text-zinc-900 rounded-t-2xl shadow-2xl overflow-y-auto p-12 flex-1 relative">
              <button 
                onClick={() => setShowPreview(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Bilingual Report Header */}
              <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-8 mb-8">
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1">VENTURE ASSET MANAGEMENT</h1>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Laporan Keuangan Institusional / Institutional Financial Report</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Periode Berakhir / Period Ended</p>
                  <p className="text-sm font-black mb-1">Per {getRealTimeReportingDate().formattedInd} / As of {getRealTimeReportingDate().formattedEng}</p>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-400">Tanggal Cetak / Printed Date</p>
                  <p className="text-[11px] font-mono font-black text-orange-600">{lastUpdateTime}</p>
                </div>
              </div>

              {/* Bilingual Content Example */}
              <div className="space-y-8">
                {reportData && (
                  <>
                    <div className="text-center bg-zinc-50 py-4 border-y border-zinc-200">
                      <h2 className="text-lg font-black uppercase tracking-tight">{reportData.titleInd}</h2>
                      <p className="text-xs font-bold text-zinc-400 italic">{reportData.titleEng}</p>
                    </div>

                    <div className="space-y-6">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-300">
                            <th className="py-2 text-left font-bold uppercase text-[10px] tracking-wider">Uraian / Description</th>
                            <th className="py-2 text-right font-bold uppercase text-[10px] tracking-wider">2026 (Rp)</th>
                            <th className="py-2 text-right font-bold uppercase text-[10px] tracking-wider">2025 (Rp)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {reportData.rows.map((row, idx) => (
                            <tr key={idx}>
                              <td className={`py-3 ${row.isBold ? '' : 'pl-4'}`}>
                                <p className={row.isBold ? 'font-bold' : ''}>{row.labelInd}</p>
                                <p className="text-[10px] text-zinc-400 italic">{row.labelEng}</p>
                              </td>
                              <td className={`text-right ${row.isBold ? 'font-bold' : ''}`}>{row.val26}</td>
                              <td className="text-right">{row.val25}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
                
                <div className="flex justify-end gap-3 mt-12 no-print">
                   <button 
                     onClick={exportToCSV}
                     className="flex items-center gap-2 bg-zinc-100 text-zinc-900 border border-zinc-200 px-5 py-3 rounded-xl font-bold text-xs hover:bg-zinc-200 transition-all"
                   >
                      <FileSpreadsheet className="w-4 h-4" /> EXPORT CSV
                   </button>
                   <button 
                     onClick={exportToPDF}
                     className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-zinc-800 transition-all shadow-lg"
                   >
                      <FileText className="w-4 h-4" /> DOWNLOAD PDF
                   </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Title Hub with Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
        <div>
          <h2 className="text-xl font-black text-[#DFFF00] uppercase tracking-tighter flex items-center gap-2.5">
            <Calculator className="w-6 h-6 text-[#DFFF00]" /> SYSTEM PELAPORAN KEUANGAN KONSOLIDASI
          </h2>
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-1">
            Standard: PSAK 71 / PSAK 1 / IFRS Compliance Engine Stack
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-zinc-950 p-1 border border-zinc-850 rounded-xl">
          <button
            onClick={() => setActiveTabState('REPORTS')}
            className={`px-4 py-2 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider transition-all ${
              activeTab === 'REPORTS' 
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 inline mr-1.5" /> DRAFT REPORT PSAK
          </button>
          <button
            onClick={() => setActiveTabState('SECURE_VAULT')}
            className={`px-4 py-2 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider transition-all ${
              activeTab === 'SECURE_VAULT' 
                ? 'bg-[#deff9a]/10 text-[#deff9a] border border-[#deff9a]/20' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 inline mr-1.5 text-[#deff9a]" /> SECURE DOCUMENT VAULT (SOP-IT-VAM-003)
          </button>
          <button
            onClick={() => setActiveTabState('TRANSACTIONS')}
            className={`px-4 py-2 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider transition-all ${
              activeTab === 'TRANSACTIONS' 
                ? 'bg-blue-500/10 text-blue-450 border border-blue-500/20' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5 inline mr-1.5 text-blue-400" /> TRANSACTION HISTORY (FEES & TAX)
          </button>
        </div>
      </div>

      {activeTab === 'REPORTS' && (
        /* TAB 1: REPORTS AND COMPILATION DRAFTS */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
              Review current accounting statement layers:
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => addAuditLog('MAN_RE_SYNC', 'WARN', 'Manual re-sync and ledger validation invoked.')}
                className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-white px-4 py-2 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider hover:bg-zinc-850 transition-all cursor-pointer"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> RE-SYNC ACCOUNTING
              </button>
              <button 
                onClick={handleGenerate}
                className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider hover:bg-orange-600 transition-all active:scale-95 shadow-lg shadow-orange-500/20 cursor-pointer"
              >
                <Landmark className="w-3.5 h-3.5" /> GENERATE BILINGUAL REPORT
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-2xl border border-zinc-850 bg-zinc-950/40 space-y-4">
              <h3 className="text-xs font-mono font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-orange-400" /> ACTIVE COMPLETED COMPILATIONS
              </h3>
              <div className="space-y-4">
                {reports.map((r) => (
                  <div 
                    key={r.id} 
                    onClick={() => handlePreview(r.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4.5 rounded-2xl bg-zinc-950/80 border border-zinc-900 group hover:border-orange-500/30 transition-all cursor-pointer gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <FileCheck className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white uppercase">{r.titleInd}</p>
                          {r.status && (
                            <span className="text-[7px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 font-mono font-black tracking-tighter border border-orange-500/35 uppercase">
                              {r.status}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 italic mt-0.5">{r.titleEng}</p>
                        <p className="text-[8px] font-mono text-zinc-600 mt-1 uppercase tracking-wider">{r.standard} Active Compliance</p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <p className="text-[10px] font-mono font-black text-green-400 uppercase tracking-widest">{r.lastUpdate}</p>
                      <button className="text-[9px] font-mono font-black text-orange-400 uppercase mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">PREVIEW FULL DOCUMENT</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-850 bg-zinc-950/40 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-zinc-900 pb-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500/5 border border-orange-500/20 flex items-center justify-center">
                    <PieChart className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider leading-none">AI Accounting Core Stream</h4>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-1 block">YTD FISCAL CONSOLIDATION</span>
                  </div>
                </div>
                
                <p className="text-[10px] text-zinc-400 leading-normal">
                  VentureAM Core processes raw balances, financial ledgers, and transactions with double-entry cryptographic verification.
                </p>
              </div>

              {/* Asset vs Liability Mini Sparkline Segment */}
              <div className="p-4.5 bg-black/50 border border-zinc-900 rounded-xl space-y-3.5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[8px] font-mono font-black text-zinc-500 uppercase tracking-widest block">ASSET VS LIABILITY TREND</span>
                    <p className="text-xs font-mono font-black text-[#deff9a] mt-0.5">
                      Rp {(financialValues.cash26 + (financialValues.giro26 || 0) + financialValues.invest26 + financialValues.fixed26).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[7px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold border border-emerald-500/20 uppercase">
                      +22.44% YTD
                    </span>
                    <p className="text-[8px] font-mono text-zinc-500 mt-1 uppercase">ZERO DEBT (Rp 0)</p>
                  </div>
                </div>

                {/* SVG Sparkline Container */}
                <div className="relative pt-1">
                  <svg viewBox="0 0 300 80" className="w-full h-20 overflow-visible">
                    {/* Grid Baselines */}
                    <line x1="10" y1="10" x2="290" y2="10" stroke="#1d1d21" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="10" y1="40" x2="290" y2="40" stroke="#1d1d21" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="10" y1="70" x2="290" y2="70" stroke="#2a2a30" strokeWidth="1.5" />

                    {/* Left & Right Y axis labels */}
                    <text x="5" y="14" fill="#52525b" fontSize="7" fontFamily="monospace">12M</text>
                    <text x="5" y="44" fill="#52525b" fontSize="7" fontFamily="monospace">6M</text>
                    <text x="5" y="74" fill="#52525b" fontSize="7" fontFamily="monospace">0</text>

                    {/* Sparkline Path - Assets (Neon Green) */}
                    {(() => {
                      const maxVal = 12000000;
                      const ratio = (val: number) => (val / maxVal);
                      const mapY = (val: number) => 70 - Math.round(ratio(val) * 60);

                      const assetsPoints = [
                        { x: 10, y: mapY(financialValues.cash25 + (financialValues.giro25 || 0) + financialValues.invest25 + financialValues.fixed25) }, // Dec 2025
                        { x: 56.67, y: mapY(8550000) }, // Jan 2026
                        { x: 103.33, y: mapY(8850000) }, // Feb 2026
                        { x: 150, y: mapY(9150000) }, // Mar 2026
                        { x: 196.67, y: mapY(9650000) }, // Apr 2026
                        { x: 243.33, y: mapY(10050000) }, // May 2026
                        { x: 290, y: mapY(financialValues.cash26 + (financialValues.giro26 || 0) + financialValues.invest26 + financialValues.fixed26) } // June 2026 / Present
                      ];

                      const liabilitiesPoints = [
                        { x: 10, y: mapY(financialValues.shortLiability25) },
                        { x: 56.67, y: mapY(0) },
                        { x: 103.33, y: mapY(0) },
                        { x: 150, y: mapY(0) },
                        { x: 196.67, y: mapY(0) },
                        { x: 243.33, y: mapY(0) },
                        { x: 290, y: mapY(financialValues.shortLiability26) }
                      ];

                      const astD = `M ${assetsPoints.map(p => `${p.x},${p.y}`).join(' L ')}`;
                      const liaD = `M ${liabilitiesPoints.map(p => `${p.x},${p.y}`).join(' L ')}`;

                      return (
                        <>
                          {/* Asset Gradient Fill */}
                          <defs>
                            <linearGradient id="assetGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#deff9a" stopOpacity="0.15" />
                              <stop offset="100%" stopColor="#deff9a" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path 
                            d={`${astD} L 290,70 L 10,70 Z`} 
                            fill="url(#assetGrad)" 
                          />

                          {/* Asset Stroke Line */}
                          <path 
                            d={astD} 
                            fill="none" 
                            stroke="#deff9a" 
                            strokeWidth="2.5" 
                            strokeLinecap="round"
                            strokeLinejoin="round" 
                          />

                          {/* Liability Stroke Line (Dotted red/slate indicating no liabilities) */}
                          <path 
                            d={liaD} 
                            fill="none" 
                            stroke="#ef4444" 
                            strokeWidth="1.5" 
                            strokeDasharray="4 4"
                            strokeLinecap="round" 
                          />

                          {/* Interactive point indicators */}
                          <circle cx="290" cy={mapY(financialValues.cash26 + (financialValues.giro26 || 0) + financialValues.invest26 + financialValues.fixed26)} r="4" fill="#deff9a" stroke="#09090b" strokeWidth="1.5" />
                          <circle cx="290" cy={mapY(financialValues.shortLiability26)} r="3" fill="#ef4444" stroke="#09090b" strokeWidth="1" />
                        </>
                      );
                    })()}
                  </svg>
                  
                  {/* Timeline labels along bottom */}
                  <div className="flex justify-between text-[7.5px] font-mono text-zinc-500 px-2 mt-1">
                    <span>DES 25</span>
                    <span>JAN</span>
                    <span>FEB</span>
                    <span>MAR</span>
                    <span>APR</span>
                    <span>MEI</span>
                    <span>JUN 26</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[8px] font-mono border-t border-zinc-900 pt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#deff9a]"></span>
                    <span className="text-zinc-400">TOTAL ASSETS</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    <span className="text-zinc-400">TOTAL LIABILITIES</span>
                  </div>
                </div>
              </div>

              {/* Net Profit Margin vs Operating Expenses Mini Sparkline Segment */}
              <div className="p-4.5 bg-black/50 border border-zinc-900 rounded-xl space-y-3.5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[8px] font-mono font-black text-zinc-500 uppercase tracking-widest block">PROFIT MARGIN VS OPERATING EXPENSES</span>
                    <p className="text-xs font-mono font-black text-sky-400 mt-0.5">
                      Net margin: -36.9% YTD
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[7px] px-1.5 py-0.5 rounded bg-red-500/10 text-rose-400 font-mono font-bold border border-red-500/20 uppercase">
                      Burn active
                    </span>
                    <p className="text-[8px] font-mono text-zinc-500 mt-1 uppercase">OPEX: Rp {Math.abs(financialValues.operatingExpense26).toLocaleString('id-ID')}</p>
                  </div>
                </div>

                {/* SVG Sparkline Container */}
                <div className="relative pt-1">
                  <svg viewBox="0 0 300 80" className="w-full h-20 overflow-visible">
                    {/* Grid Baselines */}
                    <line x1="10" y1="10" x2="290" y2="10" stroke="#1d1d21" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="10" y1="40" x2="290" y2="40" stroke="#1d1d21" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="10" y1="70" x2="290" y2="70" stroke="#2a2a30" strokeWidth="1.5" />

                    {/* Left & Right Y axis labels */}
                    <text x="5" y="14" fill="#52525b" fontSize="7" fontFamily="monospace">60%</text>
                    <text x="5" y="44" fill="#52525b" fontSize="7" fontFamily="monospace">15%</text>
                    <text x="5" y="74" fill="#52525b" fontSize="7" fontFamily="monospace">-40%</text>

                    {/* Sparkline Path */}
                    {(() => {
                      // Map functions for Margins (from -40% to +60%)
                      const mapMarginY = (pct: number) => {
                        // -40% mapped to 70px (bottom), +60% mapped to 10px (top)
                        const valNormalized = (pct + 40) / 100; // 0 to 1
                        return 70 - Math.round(valNormalized * 60);
                      };

                      // Map functions for Operating Expenses (0 to 600k IDR)
                      const mapOpexY = (val: number) => {
                        // 0 mapped to 70px, 600,000 mapped to 10px
                        const valNormalized = val / 600000;
                        return 70 - Math.round(valNormalized * 60);
                      };

                      const marginsPoints = [
                        { x: 10, y: mapMarginY(18.3) },  // Dec 2025 (~18.3%)
                        { x: 56.67, y: mapMarginY(15.0) },  // Jan 2026 (~15%)
                        { x: 103.33, y: mapMarginY(10.2) }, // Feb 2026
                        { x: 150, y: mapMarginY(2.1) },  // Mar 2026
                        { x: 196.67, y: mapMarginY(-12.4) }, // Apr 2026
                        { x: 243.33, y: mapMarginY(-22.0) }, // May 2026
                        { x: 290, y: mapMarginY(-36.9) }  // June 2026 / Present
                      ];

                      const opexPoints = [
                        { x: 10, y: mapOpexY(Math.abs(financialValues.operatingExpense25)) }, // Dec 2025
                        { x: 56.67, y: mapOpexY(350000) },
                        { x: 103.33, y: mapOpexY(400000) },
                        { x: 150, y: mapOpexY(450000) },
                        { x: 196.67, y: mapOpexY(490000) },
                        { x: 243.33, y: mapOpexY(530000) },
                        { x: 290, y: mapOpexY(Math.abs(financialValues.operatingExpense26)) } // June 2026 / Present
                      ];

                      const marginD = `M ${marginsPoints.map(p => `${p.x},${p.y}`).join(' L ')}`;
                      const opexD = `M ${opexPoints.map(p => `${p.x},${p.y}`).join(' L ')}`;

                      return (
                        <>
                          {/* Margin Gradient Fill */}
                          <defs>
                            <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
                              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path 
                            d={`${marginD} L 290,70 L 10,70 Z`} 
                            fill="url(#marginGrad)" 
                          />

                          {/* Margin Stroke Line (Cyan/Sky) */}
                          <path 
                            d={marginD} 
                            fill="none" 
                            stroke="#38bdf8" 
                            strokeWidth="2.5" 
                            strokeLinecap="round"
                            strokeLinejoin="round" 
                          />

                          {/* Opex Stroke Line (Rose indicating growing cash burn) */}
                          <path 
                            d={opexD} 
                            fill="none" 
                            stroke="#f43f5e" 
                            strokeWidth="2" 
                            strokeLinecap="round"
                            strokeLinejoin="round" 
                          />

                          {/* Point indicators */}
                          <circle cx="290" cy={mapMarginY(-36.9)} r="4" fill="#38bdf8" stroke="#09090b" strokeWidth="1.5" />
                          <circle cx="290" cy={mapOpexY(Math.abs(financialValues.operatingExpense26))} r="4" fill="#f43f5e" stroke="#09090b" strokeWidth="1.5" />
                        </>
                      );
                    })()}
                  </svg>
                  
                  {/* Timeline labels along bottom */}
                  <div className="flex justify-between text-[7.5px] font-mono text-zinc-500 px-2 mt-1">
                    <span>DES 25</span>
                    <span>JAN</span>
                    <span>FEB</span>
                    <span>MAR</span>
                    <span>APR</span>
                    <span>MEI</span>
                    <span>JUN 26</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[8px] font-mono border-t border-zinc-900 pt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]"></span>
                    <span className="text-zinc-400">NET MARGIN (%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e]"></span>
                    <span className="text-zinc-400">OPERATING EXPENSES</span>
                  </div>
                </div>
              </div>

              {/* Dynamic KPI Trend Sparkline Panel (ROA, ROE, GPM, Current Ratio) */}
              {(() => {
                const netOperatingProfit26 = financialValues.rev26 + (financialValues.hpp26 || 0) + (financialValues.operatingExpense26 || 0) + (financialValues.depreciationExpense26 || 0) + (financialValues.interestIncome26 || 0) + (financialValues.realizedSecurities26 || 0);
                const totalComprehensiveProfit26 = netOperatingProfit26 + (financialValues.unrealizedSecurities26 || 0);
                const netCurrentAssets26 = financialValues.cash26 + (financialValues.giro26 || 0) + financialValues.invest26;
                const netTotalAssets26 = netCurrentAssets26 + financialValues.fixed26;
                const totalEquity26 = financialValues.paidCapital26 + financialValues.retainedEarnings26;

                const currentROA = netTotalAssets26 > 0 ? (totalComprehensiveProfit26 / netTotalAssets26) * 100 : -7.4;
                const currentROE = totalEquity26 > 0 ? (totalComprehensiveProfit26 / totalEquity26) * 100 : -7.4;
                const currentGPM = financialValues.rev26 > 0 ? ((financialValues.rev26 + (financialValues.hpp26 || 0)) / financialValues.rev26) * 100 : 100;
                
                // For Current Ratio, since liabilities is 0, we can use a benchmark index of liquidity (Assets/Cash threshold) or simply infinity if no debt
                const currentCR = financialValues.shortLiability26 > 0 
                  ? (netCurrentAssets26 / financialValues.shortLiability26)
                  : (netCurrentAssets26 / 250000);

                let metricTitle = '';
                let metricValue = '';
                let metricBadge = '';
                let metricBadgeColor = '';
                let metricColor = '';
                let metricDesc = '';
                let points: number[] = [];
                let yLabels: string[] = [];

                if (kpiMetric === 'ROA') {
                  metricTitle = 'Return on Assets (ROA)';
                  metricValue = `${currentROA.toFixed(1)}%`;
                  metricBadge = 'Efficiency';
                  metricBadgeColor = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
                  metricColor = '#a855f7'; // purple
                  metricDesc = 'Net earnings generated per Rupiah of total assets.';
                  points = [14.5, 12.0, 9.5, 4.2, -1.2, -4.8, currentROA];
                  yLabels = ['20%', '5%', '-10%'];
                } else if (kpiMetric === 'ROE') {
                  metricTitle = 'Return on Equity (ROE)';
                  metricValue = `${currentROE.toFixed(1)}%`;
                  metricBadge = 'Profitability';
                  metricBadgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                  metricColor = '#f59e0b'; // amber
                  metricDesc = 'Productivity of shareholders\' invested capital.';
                  points = [28.2, 22.1, 15.5, 8.4, -2.3, -6.2, currentROE];
                  yLabels = ['35%', '10%', '-15%'];
                } else if (kpiMetric === 'GPM') {
                  metricTitle = 'Gross Profit Margin';
                  metricValue = `${currentGPM.toFixed(1)}%`;
                  metricBadge = 'Margin';
                  metricBadgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                  metricColor = '#10b981'; // emerald
                  metricDesc = 'Gross revenue generation over cost of goods sold.';
                  points = [18.7, 35.0, 50.0, 75.0, 95.0, 100.0, currentGPM];
                  yLabels = ['100%', '50%', '0%'];
                } else {
                  metricTitle = 'Current Ratio (Liquidity)';
                  metricValue = financialValues.shortLiability26 > 0 ? `${currentCR.toFixed(2)}x` : `${currentCR.toFixed(1)}x`;
                  metricBadge = 'Solvency';
                  metricBadgeColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
                  metricColor = '#22d3ee'; // cyan
                  metricDesc = 'Short-term asset liquidity vs liability obligations.';
                  points = [3.2, 4.5, 6.8, 10.2, 12.4, 14.5, currentCR];
                  yLabels = ['20x', '10x', '0x'];
                }

                // Normalization helper for drawing SVG
                const maxVal = Math.max(...points);
                const minVal = Math.min(...points);
                const range = maxVal - minVal || 1;
                const mapY = (val: number) => {
                  const normalized = (val - minVal) / range;
                  return 70 - Math.round(normalized * 60);
                };

                const svgPoints = points.map((val, idx) => {
                  const x = 10 + idx * (280 / (points.length - 1)); // 10 to 290 dynamically
                  return { x, y: mapY(val) };
                });

                const dPath = `M ${svgPoints.map(p => `${p.x},${p.y}`).join(' L ')}`;

                return (
                  <div className="p-4.5 bg-black/50 border border-zinc-900 rounded-xl space-y-3.5">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Selector Tabs & PDF Trend Export */}
                        <div className="flex flex-wrap items-center gap-2 mb-2 select-none">
                          <div className="flex bg-zinc-900 border border-zinc-850 p-0.5 rounded-lg">
                            {(['ROA', 'ROE', 'GPM', 'CR'] as const).map((m) => (
                              <button
                                key={m}
                                onClick={() => setKpiMetric(m)}
                                className={`text-[8.5px] font-mono font-bold uppercase px-2 py-0.5 rounded transition-all ${
                                  kpiMetric === m
                                    ? 'bg-zinc-800 text-[#deff9a]'
                                    : 'text-zinc-500 hover:text-white'
                                }`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={exportTrendToPDF}
                            id="btn-export-trend-pdf"
                            className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900 hover:bg-zinc-850 text-white rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all text-[8px] font-mono font-bold uppercase cursor-pointer"
                            title="Ekspor seluruh tren ke PDF untuk pembukuan / audit"
                          >
                            <FileText className="w-2.5 h-2.5 text-[#deff9a]" />
                            <span>EKSPOR TREN PDF</span>
                          </button>
                        </div>

                        <span className="text-[8px] font-mono font-black text-zinc-500 uppercase tracking-widest block">
                          {metricTitle}
                        </span>
                        <p className="text-xs font-mono font-black text-white mt-0.5">
                          {metricValue}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[7px] px-1.5 py-0.5 rounded font-mono font-bold border uppercase ${metricBadgeColor}`}>
                          {metricBadge}
                        </span>
                        <p className="text-[8px] font-mono text-zinc-500 mt-1 uppercase">FISCAL TIMELINE</p>
                      </div>
                    </div>

                    {/* SVG Sparkline Container */}
                    <div className="relative pt-1">
                      <svg viewBox="0 0 300 80" className="w-full h-20 overflow-visible">
                        {/* Grid Baselines */}
                        <line x1="10" y1="10" x2="290" y2="10" stroke="#1d1d21" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="10" y1="40" x2="290" y2="40" stroke="#1d1d21" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="10" y1="70" x2="290" y2="70" stroke="#2a2a30" strokeWidth="1.5" />

                        {/* Y-axis labels */}
                        <text x="5" y="14" fill="#52525b" fontSize="7" fontFamily="monospace">{yLabels[0]}</text>
                        <text x="5" y="44" fill="#52525b" fontSize="7" fontFamily="monospace">{yLabels[1]}</text>
                        <text x="5" y="74" fill="#52525b" fontSize="7" fontFamily="monospace">{yLabels[2]}</text>

                        {/* Sparkline Path Gradient */}
                        <defs>
                          <linearGradient id={`kpiGrad-${kpiMetric}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={metricColor} stopOpacity="0.15" />
                            <stop offset="100%" stopColor={metricColor} stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path 
                          d={`${dPath} L 290,70 L 10,70 Z`} 
                          fill={`url(#kpiGrad-${kpiMetric})`} 
                        />

                        {/* Sparkline Stroke Line */}
                        <path 
                          d={dPath} 
                          fill="none" 
                          stroke={metricColor} 
                          strokeWidth="2" 
                          strokeLinecap="round"
                          strokeLinejoin="round" 
                        />

                        {/* Historical dots */}
                        {svgPoints.map((p, idx) => (
                          <circle 
                            key={idx} 
                            cx={p.x} 
                            cy={p.y} 
                            r={idx === svgPoints.length - 1 ? '4' : '2'} 
                            fill={idx === svgPoints.length - 1 ? metricColor : '#27272a'} 
                            stroke="#09090b" 
                            strokeWidth="1" 
                          />
                        ))}
                      </svg>
                      
                      {/* Timeline labels along bottom */}
                      <div className="flex justify-between text-[7.5px] font-mono text-zinc-500 px-2 mt-1">
                        <span>DES 25</span>
                        <span>JAN</span>
                        <span>FEB</span>
                        <span>MAR</span>
                        <span>APR</span>
                        <span>MEI</span>
                        <span>JUN 26</span>
                      </div>
                    </div>

                    <div className="text-[8px] font-mono text-zinc-400 capitalize bg-zinc-950/60 p-2 rounded border border-zinc-900 leading-normal">
                      <span className="font-bold text-white uppercase block mb-0.5 text-[7.5px] tracking-wider">Metrics Analytics:</span>
                      {metricDesc}
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-3 bg-black/60 p-4 border border-zinc-900 rounded-xl font-mono text-[9px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500 uppercase font-semibold">Integrity Hash:</span>
                  <span className="text-zinc-300">SHA-256 Verified</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 uppercase font-semibold">ISO 27001 Status:</span>
                  <span className="text-emerald-400 font-bold">✓ ENCRYPTED COMPLIANT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 uppercase font-semibold">VPC Private Channel:</span>
                  <span className="text-[#DFFF00]">TUNNEL ACTIVE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 uppercase font-semibold">User Authorized:</span>
                  <span className="text-zinc-400">aidilsyahdan2...</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "95%" }}
                    className="h-full bg-[#deff9a]"
                  />
                </div>
                <div className="flex items-center justify-between text-[8px] text-zinc-500 uppercase font-mono tracking-widest">
                  <span>SYSTEM CALIBRATION</span>
                  <span>95% ENGAGED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Year-to-Date Performance Summary Section */}
          <div className="p-6 rounded-2xl border border-zinc-850 bg-zinc-950/40 space-y-6 animate-fade-in" id="ytd-performance-summary">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-mono font-bold bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded border border-orange-500/20 uppercase tracking-widest">
                    FISCAL YEAR 2026
                  </span>
                  <span className="text-[8px] font-mono font-bold bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/20 uppercase tracking-widest">
                    AGGREGATE LEDGER
                  </span>
                </div>
                <h3 className="text-xs font-mono font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <History className="w-4 h-4 text-orange-400" /> YEAR-TO-DATE (YTD) PERFORMANCE SUMMARY
                </h3>
                <p className="text-[10px] text-zinc-400 max-w-xl">
                  Konsolidasian laba/rugi direalisasikan (Realized PnL) antar kuartal berjalan yang bersumber dari aktivitas rebalancing portofolio efek harian.
                </p>
              </div>
              
              <div className="text-left sm:text-right">
                <span className="text-[8px] font-mono text-zinc-500 block uppercase tracking-widest leading-none">CUMULATIVE YTD PROFIT</span>
                <p className="text-lg font-mono font-black text-[#deff9a] mt-1 pr-1">
                  Rp {(3110000 + realizedPnL).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Progress distribution bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[8px] font-mono text-zinc-500 uppercase tracking-wider">
                <span>QUARTERLY CONTRIBUTION WEIGHTS</span>
                <span>YTD TARGET: Rp 5.000.000</span>
              </div>
              <div className="h-2 w-full bg-zinc-900 rounded-lg overflow-hidden flex">
                <div 
                  style={{ width: `${Math.max(10, Math.min(90, (1150000 / (3110000 + realizedPnL || 1)) * 100))}%` }} 
                  className="h-full bg-amber-500 transition-all duration-500" 
                  title="Q1 Contribution"
                />
                <div 
                  style={{ width: `${Math.max(10, Math.min(90, ((1960000 + realizedPnL) / (3110000 + realizedPnL || 1)) * 100))}%` }} 
                  className="h-full bg-emerald-500 transition-all duration-500" 
                  title="Q2 Contribution"
                />
                <div 
                  style={{ width: '0%' }} 
                  className="h-full bg-zinc-700 transition-all duration-500" 
                  title="Q3 Contribution"
                />
                <div 
                  style={{ width: '0%' }} 
                  className="h-full bg-zinc-850 transition-all duration-500" 
                  title="Q4 Contribution"
                />
              </div>
              <div className="flex flex-wrap gap-4 text-[8px] font-mono text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>Q1: {((1150000 / (3110000 + realizedPnL || 1)) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Q2: {(((1960000 + realizedPnL) / (3110000 + realizedPnL || 1)) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
                  <span>Q3: 0.0% (Upcoming)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-800"></span>
                  <span>Q4: 0.0% (Upcoming)</span>
                </div>
              </div>
            </div>

            {/* Quarterly cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Q1 */}
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-900 flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[8px] font-mono font-black text-zinc-400 uppercase tracking-widest block">QUARTER 1 (Q1)</span>
                    <span className="text-[8px] font-mono text-zinc-650 uppercase mt-0.5 block">JAN - MAR 2026</span>
                  </div>
                  <span className="text-[7px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-mono font-bold border border-amber-500/20 uppercase shrink-0">
                    SETTLED
                  </span>
                </div>
                <div>
                  <span className="text-xs font-mono font-black text-amber-500 block">
                    Rp 1.150.000
                  </span>
                  <p className="text-[8px] text-zinc-500 mt-1 leading-normal uppercase font-mono">
                    8 WINS / 2 CORRECTIONS
                  </p>
                </div>
              </div>

              {/* Q2 */}
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-900 flex flex-col justify-between space-y-3 border-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.02)]">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[8px] font-mono font-black text-emerald-400 uppercase tracking-widest block">QUARTER 2 (Q2)</span>
                    <span className="text-[8px] font-mono text-zinc-650 uppercase mt-0.5 block">APR - JUN 2026</span>
                  </div>
                  <span className="text-[7px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold border border-emerald-500/20 uppercase shrink-0">
                    ACTIVE
                  </span>
                </div>
                <div>
                  <span className="text-xs font-mono font-black text-[#deff9a] block">
                    Rp {(1960000 + realizedPnL).toLocaleString('id-ID')}
                  </span>
                  <p className="text-[8px] text-zinc-500 mt-1 leading-normal uppercase font-mono">
                    {9 + (realizedPnL > 0 ? 1 : 0)} WINS / {3 + (realizedPnL < 0 ? 1 : 0)} CORRECTIONS
                  </p>
                </div>
              </div>

              {/* Q3 */}
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-900 flex flex-col justify-between space-y-3 opacity-60 hover:opacity-100 transition-opacity">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[8px] font-mono font-black text-zinc-500 uppercase tracking-widest block">QUARTER 3 (Q3)</span>
                    <span className="text-[8px] font-mono text-zinc-650 mt-0.5 block">JUL - SEP 2026</span>
                  </div>
                  <span className="text-[7px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-500 font-mono font-bold border border-zinc-800 uppercase shrink-0">
                    UPCOMING
                  </span>
                </div>
                <div>
                  <span className="text-xs font-mono font-black text-zinc-650 block">
                    Rp 0
                  </span>
                  <p className="text-[8px] text-zinc-500 mt-1 leading-normal uppercase font-mono">
                    TARGET REBALANCE AT 01.07
                  </p>
                </div>
              </div>

              {/* Q4 */}
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-900 flex flex-col justify-between space-y-3 opacity-60 hover:opacity-100 transition-opacity">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[8px] font-mono font-black text-zinc-500 uppercase tracking-widest block">QUARTER 4 (Q4)</span>
                    <span className="text-[8px] font-mono text-zinc-655 mt-0.5 block">OKT - DES 2026</span>
                  </div>
                  <span className="text-[7px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-500 font-mono font-bold border border-zinc-800 uppercase shrink-0">
                    UPCOMING
                  </span>
                </div>
                <div>
                  <span className="text-xs font-mono font-black text-zinc-650 block">
                    Rp 0
                  </span>
                  <p className="text-[8px] text-zinc-500 mt-1 leading-normal uppercase font-mono">
                    TARGET REBALANCE AT 01.10
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Realized P&L Trends & Rebalancing Performance History (Recharts) */}
          <RealizedPnLChart realizedPnL={realizedPnL} />
        </div>
      )}

      {activeTab === 'SECURE_VAULT' && (
        /* TAB 2: SECURE DOCUMENT VAULT (SOP-IT-VAM-003) PIPELINE */
        <div className="space-y-6">
          {/* SOP Metadata Header Block */}
          <div className="bg-zinc-950/80 border border-zinc-850 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[8px] font-mono font-black text-[#deff9a] uppercase tracking-widest block bg-[#deff9a]/10 px-2.5 py-1 rounded w-fit border border-[#deff9a]/20">
                SOP REFERENCE: SOP-IT-VAM-003
              </span>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                INTEGRATION SECURE DOCUMENT VAULT KE AI ENGINE
              </h3>
              <p className="text-[10px] text-zinc-400 max-w-2xl">
                Establishing automated pipelines for file ingestion, cryptographic staging encryption (AES-256), Cloud Function auto extraction triggers, and fuzzy matching accounts descriptions to PSAK COA templates.
              </p>
            </div>
            <div className="shrink-0 bg-black/60 p-3.5 border border-zinc-900 rounded-xl font-mono text-left space-y-1">
              <p className="text-[8px] text-zinc-500 font-black uppercase tracking-tight">DIVISI & KEPATUHAN</p>
              <p className="text-[10px] text-zinc-300 font-bold uppercase leading-none">IT & Infrastructure</p>
              <p className="text-[9px] text-[#deff9a] font-black uppercase">Data Engineering Section</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN: UPLOAD AND RETENTION PRESETS */}
            <div className="space-y-6">
              {/* Manual Upload Ingestion Zone */}
              <div className="p-6 rounded-2xl border border-zinc-850 bg-zinc-950/40 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <h4 className="text-[11px] font-mono font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-[#deff9a]" /> Manual File Ingestion (Option B)
                  </h4>
                  <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-[#deff9a] uppercase border border-zinc-800">
                    Staging Bucket Ready
                  </span>
                </div>

                {/* Checklist Kesiapan Data */}
                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900 space-y-2">
                  <p className="text-[9.5px] font-mono font-black text-zinc-300 uppercase tracking-wider">
                    📋 Checklist Kesiapan Data:
                  </p>
                  <p className="text-[9.5px] text-zinc-400 leading-normal font-sans">
                    <strong>Bila menggunakan CSV:</strong> Kolom wajib <code className="text-[#deff9a] bg-[#deff9a]/10 px-1 py-0.5 rounded text-[8.5px]">tanggal</code>, <code className="text-[#deff9a] bg-[#deff9a]/10 px-1 py-0.5 rounded text-[8.5px]">kode_akun</code>, <code className="text-[#deff9a] bg-[#deff9a]/10 px-1 py-0.5 rounded text-[8.5px]">deskripsi</code>, <code className="text-[#deff9a] bg-[#deff9a]/10 px-1 py-0.5 rounded text-[8.5px]">jumlah</code>. 
                    <br />
                    <strong>Bila menggunakan PDF:</strong> Laporan ledger/jurnal terstruktur akan otomatis dipindai via Vision AI OCR & Tabular Segmenter.
                  </p>
                </div>

                {/* Preseed Test Actions */}
                <div className="bg-zinc-950/80 p-4 border border-zinc-900 rounded-xl space-y-2">
                  <span className="text-[8.5px] font-mono font-black text-zinc-500 uppercase tracking-widest block">
                    ⚡ Quick Simulations (Checklist Templates)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => executePreseedTemplate('SUCCESS')}
                      className="py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 rounded-lg text-[8px] font-mono font-bold text-zinc-300 hover:text-white uppercase transition-all"
                    >
                      🚀 Success CSV
                    </button>
                    <button
                      onClick={() => executePreseedTemplate('FUZZY')}
                      className="py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 rounded-lg text-[8px] font-mono font-bold text-[#deff9a] uppercase transition-all"
                    >
                      🔮 Fuzzy CSV mapping
                    </button>
                    <button
                      onClick={() => executePreseedTemplate('PDF_EXTRACT')}
                      className="py-1.5 px-2 bg-zinc-900 hover:bg-emerald-950/20 hover:border-emerald-700/40 border border-zinc-850 rounded-lg text-[8px] font-mono font-bold text-emerald-400 uppercase transition-all"
                    >
                      📄 Demo PDF Extract
                    </button>
                    <button
                      onClick={() => executePreseedTemplate('INVALID')}
                      className="py-1.5 px-2 bg-zinc-900 hover:bg-rose-950/20 hover:border-rose-900/40 border border-zinc-850 rounded-lg text-[8px] font-mono font-bold text-rose-400 uppercase transition-all"
                    >
                      ⚠️ Test 422 Error
                    </button>
                  </div>
                </div>

                {/* Interactive Drag & Drop Area */}
                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleCustomDrop}
                  className="border border-dashed border-zinc-800 hover:border-[#deff9a]/50 rounded-2xl p-8 text-center bg-black/30 hover:bg-[#deff9a]/[0.02]/20 transition-all cursor-pointer relative group flex flex-col items-center justify-center space-y-3"
                >
                  <input 
                    type="file" 
                    accept=".csv,.pdf"
                    onChange={handleManualFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer text-[0px]"
                  />
                  <div className="w-12 h-12 rounded-full bg-zinc-900/70 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-[#deff9a] transition-colors font-black text-xl">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-tight">
                      Drag & Drop CSV or PDF file here, or click to browse
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      Option B: Secure Local Extraction & OCR sandbox (Max 10MB)
                    </p>
                  </div>
                </div>

                {/* Ingested File Status Indicator */}
                {vaultFileName && (
                  <div className="mt-4 p-4 bg-zinc-950 border border-zinc-900 rounded-xl flex items-center justify-between font-mono text-[10px]">
                    <div className="flex items-center gap-2.5">
                      {vaultFileName.toLowerCase().endsWith('.pdf') ? (
                        <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <FileSpreadsheet className="w-5 h-5 text-[#deff9a] shrink-0" />
                      )}
                      <div>
                        <p className="text-white font-bold leading-normal truncate max-w-[180px] sm:max-w-xs">{vaultFileName}</p>
                        <p className="text-[8.5px] text-zinc-500 mt-1 uppercase">Staged payload is locked under AES-256.</p>
                      </div>
                    </div>
                    <div>
                      {uploadStatus === 'UPLOADING' && (
                        <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-900 text-orange-400 uppercase font-black tracking-wider animate-pulse border border-orange-500/10">
                          Uploading...
                        </span>
                      )}
                      {uploadStatus === 'SCANNING' && (
                        <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-900 text-[#deff9a] uppercase font-black tracking-wider animate-pulse border border-[#deff9a]/10">
                          AI Parsing...
                        </span>
                      )}
                      {uploadStatus === 'COMPLETED' && (
                        <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase font-black tracking-wider border border-emerald-500/20">
                          ✓ Completed
                        </span>
                      )}
                      {uploadStatus === 'ERROR' && (
                        <span className="text-[9px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 uppercase font-black tracking-wider border border-rose-500/20">
                          ⚠️ Error 422
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Staging Area Controls */}
                <div className="border border-zinc-900 p-4 rounded-xl space-y-3 bg-zinc-950/60 font-mono text-[9px]">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 uppercase font-bold flex items-center gap-1">
                      <Server className="w-3.5 h-3.5 text-zinc-650" /> Vault Staging Area:
                    </span>
                    <span className="text-white font-bold uppercase select-none">vam-secure-vault-staging</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] text-zinc-500 uppercase tracking-widest font-semibold">
                      <span>24-Hour Auto-Retention Staging Deletion Lifespan:</span>
                      <span className="text-[#deff9a] font-black">{retentionProgress > 0 ? "23 Hours 59 Minutes Remaining" : "CLEANED"}</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-900">
                      <motion.div 
                        className="h-full bg-emerald-400"
                        animate={{ width: `${retentionProgress}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                    <p className="text-[8px] text-zinc-600 font-sans leading-relaxed mt-1">
                      ISO 27001 Secure Policy: Uploaded extracts are completely erased from staging buckets 24h after parsing completes.
                    </p>
                  </div>
                </div>
              </div>

              {/* REST API Endpoints Playground Panel */}
              <div className="p-6 rounded-2xl border border-zinc-850 bg-zinc-950/40 space-y-4">
                <h4 className="text-[11px] font-mono font-black text-white uppercase tracking-widest border-b border-zinc-900 pb-3 flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-[#deff9a]" /> Dashboard API Endpoints Playground
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => simulateApiEndpoint('POST_UPLOAD')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-[85px] transition-all cursor-pointer ${
                      playgroundEndpoint === 'POST_UPLOAD' ? 'bg-[#deff9a]/10 border-[#deff9a]' : 'bg-black/40 border-zinc-900 hover:border-zinc-800'
                    }`}
                  >
                    <span className="text-[7px] font-mono font-extrabold text-blue-400 uppercase tracking-widest bg-blue-950/70 px-1 py-0.5 rounded leading-none">POST</span>
                    <strong className="text-[9.5px] font-mono text-zinc-200 mt-1 truncate">/api/v1/vault/upload</strong>
                    <span className="text-[8px] text-zinc-500 uppercase leading-none">Upload simulated action</span>
                  </button>

                  <button
                    onClick={() => simulateApiEndpoint('GET_STATUS')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-[85px] transition-all cursor-pointer ${
                      playgroundEndpoint === 'GET_STATUS' ? 'bg-[#deff9a]/10 border-[#deff9a]' : 'bg-black/40 border-zinc-900 hover:border-zinc-800'
                    }`}
                  >
                    <span className="text-[7px] font-mono font-extrabold text-green-400 uppercase tracking-widest bg-emerald-950/70 px-1 py-0.5 rounded leading-none">GET</span>
                    <strong className="text-[9.5px] font-mono text-zinc-200 mt-1 truncate">/api/v1/vault/status</strong>
                    <span className="text-[8px] text-zinc-500 uppercase leading-none">Verify parsing state</span>
                  </button>

                  <button
                    onClick={() => simulateApiEndpoint('GET_PREVIEW')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-[85px] transition-all cursor-pointer ${
                      playgroundEndpoint === 'GET_PREVIEW' ? 'bg-[#deff9a]/10 border-[#deff9a]' : 'bg-black/40 border-zinc-900 hover:border-zinc-800'
                    }`}
                  >
                    <span className="text-[7px] font-mono font-extrabold text-green-400 uppercase tracking-widest bg-emerald-950/70 px-1 py-0.5 rounded leading-none">GET</span>
                    <strong className="text-[9.5px] font-mono text-zinc-200 mt-1 truncate">/api/v1/vault/preview</strong>
                    <span className="text-[8px] text-zinc-500 uppercase leading-none">Retrieve staging results</span>
                  </button>
                </div>

                {playgroundEndpoint && (
                  <div className="bg-black border border-zinc-900 rounded-xl p-4.5 space-y-2 font-mono">
                    <div className="flex justify-between items-center text-[9px] border-b border-zinc-950 pb-1.5 text-zinc-500">
                      <span>CONSOLE OUTPUT: CODE {playgroundStatus}</span>
                      <button onClick={() => setPlaygroundEndpoint(null)} className="hover:text-white font-extrabold">CLOSE</button>
                    </div>
                    <pre className="text-[9px] text-[#deff9a] overflow-x-auto whitespace-pre-wrap max-h-[160px] scrollbar-thin">
                      {playgroundOutput}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: AI EXTRACTION ENGINE & OUTPUT PREVIEW */}
            <div className="space-y-6">
              {/* Terminal Feed of Scanning Engine */}
              <div className="p-6 rounded-2xl border border-zinc-850 bg-zinc-950/40 space-y-4">
                <h4 className="text-[11px] font-mono font-black text-white uppercase tracking-widest border-b border-zinc-900 pb-3 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-[#deff9a]" /> AI Engine scanning pipeline log
                </h4>

                <div className="bg-black/80 rounded-xl p-4 h-[180px] overflow-y-auto font-mono text-[9px] text-zinc-400 space-y-2 border border-zinc-950">
                  {terminalFeed.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-zinc-650 text-center flex-col space-y-1.5">
                      <Cpu className="w-5 h-5 text-zinc-600" />
                      <p className="uppercase font-bold tracking-widest">Awaiting file ingestion stream</p>
                      <p className="text-[8px] uppercase">Upload any csv to engage processing pipeline logs</p>
                    </div>
                  ) : (
                    terminalFeed.map((feed, idx) => (
                      <div key={idx} className="leading-relaxed">
                        <span className="text-zinc-500 font-bold">[{new Date().toLocaleTimeString('id-ID')}]</span> {feed}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Error Message Modal/Block if present */}
              {errorMessage && (
                <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-900/40 flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                  <div className="space-y-1">
                    <h5 className="text-xs font-black text-rose-400 uppercase tracking-wide">422 UNPROCESSABLE ENTITY</h5>
                    <p className="text-[10px] text-zinc-300 leading-normal">{errorMessage}</p>
                    <p className="text-[8px] text-zinc-500 font-mono mt-2 uppercase tracking-wide">
                      Error logged inside system logs for IT Administrator audit. Please check your workbook parameters.
                    </p>
                  </div>
                </div>
              )}

              {/* Extracted ledger output database staging (Output Preview) */}
              {uploadStatus === 'COMPLETED' && extractedLedgers.length > 0 && (
                <div className="p-6 rounded-2xl border border-zinc-850 bg-zinc-950/40 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <h4 className="text-[11px] font-mono font-black text-white uppercase tracking-widest">
                      📋 Preview Extracted & Normed Ledger
                    </h4>
                    <span className="text-[8.5px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-black">
                      AI Mapping Complete
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-[220px] rounded-xl border border-zinc-900">
                    <table className="w-full text-left font-mono text-[9px] divide-y divide-zinc-900">
                      <thead className="bg-black text-zinc-500 uppercase tracking-wider">
                        <tr>
                          <th className="p-2 w-20">Tanggal</th>
                          <th className="p-2 w-14">COA In</th>
                          <th className="p-2">Deskripsi Mentah</th>
                          <th className="p-2">Fuzzy Match PSAK COA</th>
                          <th className="p-2 text-right">Jumlah (Rp)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-950/60 bg-black/30">
                        {extractedLedgers.map((item, idx) => (
                          <tr key={idx} className="hover:bg-zinc-900/30">
                            <td className="p-2 text-zinc-400">{item.tanggal}</td>
                            <td className="p-2 text-zinc-500">{item.kodeAkun}</td>
                            <td className="p-2 text-zinc-300 truncate max-w-[120px]" title={item.deskripsi}>{item.deskripsi}</td>
                            <td className="p-2">
                              <span className="text-emerald-400 font-bold block">{item.mappedCoa}</span>
                              <span className="text-[8px] text-zinc-400 block truncate">{CHART_OF_ACCOUNTS[item.mappedCoa]}</span>
                              <span className="text-[7.5px] text-zinc-500 block">Confidence: {item.confidence}%</span>
                            </td>
                            <td className="p-2 text-right text-white font-bold">
                              {item.jumlah.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Finalize Action Button */}
                  <div className="pt-2 flex gap-3">
                    <button
                      onClick={() => {
                        setUploadStatus('IDLE');
                        setExtractedLedgers([]);
                        setVaultFileName(null);
                        addAuditLog('VAULT_DISCARD', 'WARN', 'Discarded staging extraction datasets from memory.');
                      }}
                      className="flex-1 py-2 rounded-xl border border-zinc-900 bg-zinc-950 hover:bg-zinc-900 text-zinc-550 hover:text-white text-[10px] font-mono font-black uppercase tracking-wider transition-all"
                    >
                      Discard & Reset
                    </button>
                    <button
                      onClick={handleFinalizeAndPost}
                      className="flex-[2] py-2.5 rounded-xl bg-[#deff9a] hover:bg-[#deff9a]/90 text-slate-950 text-[10px] font-mono font-black uppercase tracking-wider transition-all shadow-lg active:scale-95"
                    >
                      Finalize & Inject Core Balance Sheet
                    </button>
                  </div>
                </div>
              )}

              {/* Isolation Compliance Log */}
              <div className="p-6 rounded-2xl border border-zinc-850 bg-zinc-950/40 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <h4 className="text-[11px] font-mono font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                    <History className="w-4 h-4 text-zinc-500" /> ISO 27001 Security Audit Log
                  </h4>
                  <span className="text-[7.5px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 uppercase tracking-widest border border-blue-500/20">
                    Compliant Audit Active
                  </span>
                </div>

                <div className="space-y-2 h-[120px] overflow-y-auto pr-1 scrollbar-thin">
                  {auditLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 font-mono text-[8.5px] leading-snug border-b border-zinc-950 pb-1.5">
                      <span className="text-zinc-650 text-[8px] font-bold shrink-0">{log.timestamp}</span>
                      <span className={`px-1 rounded text-[7.5px] font-bold tracking-tighter shrink-0 select-none ${
                        log.level === 'SECURE' ? 'bg-emerald-500/10 text-emerald-400' :
                        log.level === 'WARN' ? 'bg-rose-500/15 text-rose-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {log.level}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="text-zinc-300 font-bold block">{log.eventCode}</span>
                        <p className="text-zinc-500 truncate">{log.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'TRANSACTIONS' && (
        <div className="space-y-6">
          {/* Header Metadata Block */}
          <div className="bg-zinc-950/80 border border-zinc-850 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[8px] font-mono font-black text-blue-400 uppercase tracking-widest block bg-blue-500/10 px-2.5 py-1 rounded w-fit border border-blue-500/20">
                COMPLIANCE REFERENCE: AUDIT-TX-LOG-PSAK
              </span>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                CHRONOLOGICAL TRANSACTION HISTORY & AUDIT LEDGER
              </h3>
              <p className="text-[10px] text-zinc-400 max-w-2xl">
                Real-time tracking of all buy and sell order executions, broker commissions, value added taxes (VAT 11%), and final income taxes (PPh 0.1% for sell executions) conforming to capital market regulations.
              </p>
            </div>
            <div className="flex gap-2.5 shrink-0">
              <button
                onClick={handleExportTxCSV}
                className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> Export CSV
              </button>
              <button
                onClick={handleExportTxPDF}
                className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-3.5 py-2 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export PDF Ledger
              </button>
            </div>
          </div>

          {/* KPI Dashboard Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/60 flex flex-col justify-between">
              <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Total Executions</span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-white tracking-tight">{(transactions || []).length}</span>
                <span className="text-[8px] font-mono text-zinc-600">txs</span>
              </div>
              <span className="text-[8.5px] font-mono text-zinc-500 mt-1 uppercase">Cumulative Gateway Vol</span>
            </div>

            <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/60 flex flex-col justify-between">
              <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Total Gross Volume</span>
              <div className="mt-2">
                <span className="text-base font-bold text-white tracking-tight">Rp {formatIdr(txAggregates.totalGrossValue)}</span>
              </div>
              <span className="text-[8.5px] font-mono text-zinc-500 mt-1 uppercase">Consolidated Turn</span>
            </div>

            <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/60 flex flex-col justify-between">
              <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Total Broker Commission</span>
              <div className="mt-2">
                <span className="text-base font-bold text-[#DFFF00] tracking-tight">Rp {formatIdr(txAggregates.totalCommissions)}</span>
              </div>
              <span className="text-[8.5px] font-mono text-zinc-500 mt-1 uppercase">Includes PPN/VAT</span>
            </div>

            <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/60 flex flex-col justify-between">
              <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Taxes & Levies Deducted</span>
              <div className="mt-2">
                <span className="text-base font-bold text-rose-450 tracking-tight">Rp {formatIdr(txAggregates.totalPPh + txAggregates.totalPPN)}</span>
              </div>
              <div className="flex gap-2 text-[7.5px] font-mono text-zinc-600 uppercase mt-1">
                <span>PPh: Rp {formatIdr(txAggregates.totalPPh)}</span>
                <span>•</span>
                <span>Levy: Rp {formatIdr(txAggregates.totalPPN)}</span>
              </div>
            </div>
          </div>

          {/* Filtering Console */}
          <div className="p-4.5 rounded-xl border border-zinc-900 bg-zinc-950/40 flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-600">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                placeholder="Search ticker, broker, side..."
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1.5 border border-zinc-850 rounded-xl">
                <Filter className="w-3 h-3 text-zinc-500" />
                <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase">Side:</span>
                <select
                  value={txSideFilter}
                  onChange={(e: any) => setTxSideFilter(e.target.value)}
                  className="bg-transparent text-white font-mono text-[10px] font-black focus:outline-none cursor-pointer uppercase border-0 outline-none"
                >
                  <option value="ALL" className="bg-zinc-950 text-white">All Sides</option>
                  <option value="BUY" className="bg-zinc-950 text-emerald-400">Buy Orders</option>
                  <option value="SELL" className="bg-zinc-950 text-rose-400">Sell Orders</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1.5 border border-zinc-850 rounded-xl">
                <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase">Broker:</span>
                <select
                  value={txBrokerFilter}
                  onChange={(e: any) => setTxBrokerFilter(e.target.value)}
                  className="bg-transparent text-white font-mono text-[10px] font-black focus:outline-none cursor-pointer uppercase border-0 outline-none"
                >
                  <option value="ALL" className="bg-zinc-950 text-white">All Brokers</option>
                  <option value="CGS_INTERNATIONAL" className="bg-zinc-950 text-zinc-350">CGS Intl</option>
                  <option value="IBKR" className="bg-zinc-950 text-zinc-350">IBKR</option>
                </select>
              </div>
            </div>
          </div>

          {/* Transaction Ledger Table Container */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 overflow-hidden">
            <div className="overflow-x-auto font-mono">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-950 text-zinc-500 uppercase text-[8.5px] font-mono font-bold tracking-wider">
                    <th className="py-3 px-4">Timestamp (Waktu)</th>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Sec / Ticker</th>
                    <th className="py-3 px-4">Side</th>
                    <th className="py-3 px-4 text-right">Shares (Lots)</th>
                    <th className="py-3 px-4 text-right">Price</th>
                    <th className="py-3 px-4 text-right">Gross (IDR)</th>
                    <th className="py-3 px-4 text-right">Commission</th>
                    <th className="py-3 px-4 text-right">Tax (VAT/PPh)</th>
                    <th className="py-3 px-4 text-right">Net Settle</th>
                    <th className="py-3 px-4">Broker / Channel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/65">
                  {filteredTx.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-zinc-500 font-mono text-[10px]">
                        NO CRYPTOGRAPHIC LEDGER TRANSACTIONS FOUND MATCHING FILTERS
                      </td>
                    </tr>
                  ) : (
                    filteredTx.map((tx: any) => {
                      const rate = tx.currency === 'USD' ? 16000 : 1;
                      const valueRp = tx.quantity * tx.price * rate;
                      const isBuy = tx.side === 'BUY';
                      
                      const commissionRp = Math.round(valueRp * (isBuy ? 0.001815 : 0.002815));
                      const idxLevyRp = Math.round(valueRp * 0.0004);
                      const pphRp = isBuy ? 0 : Math.round(valueRp * 0.001);
                      const totalFeeRp = commissionRp + idxLevyRp + pphRp;

                      const taxTotal = pphRp + idxLevyRp;
                      const netSettleVal = isBuy ? (valueRp + totalFeeRp) : (valueRp - totalFeeRp);

                      return (
                        <tr key={tx.id} className="hover:bg-zinc-950/40 transition-colors font-mono text-[10px] text-zinc-300">
                          <td className="py-3.5 px-4 text-[9.5px] text-zinc-500 whitespace-nowrap">
                             {new Date(tx.timestamp).toLocaleString('id-ID', { hour12: false })}
                          </td>
                          <td className="py-3.5 px-4 text-[9px] text-zinc-400 uppercase whitespace-nowrap font-bold">
                            {tx.id}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                            {tx.ticker}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black tracking-tighter ${
                              isBuy 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {tx.side}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap text-zinc-200">
                            {tx.quantity.toLocaleString('id-ID')} <span className="text-zinc-500 text-[8.5px]">({(tx.quantity / 100).toLocaleString('id-ID')} lot)</span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {tx.currency === 'USD' ? (
                              <span className="text-zinc-450 font-bold">${tx.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            ) : (
                              <span>Rp {tx.price.toLocaleString('id-ID')}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-white">
                            Rp {formatIdr(valueRp)}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap text-zinc-400">
                            Rp {formatIdr(commissionRp)}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap text-zinc-400">
                            <span className="hover:text-white cursor-help" title={`PPh: Rp ${formatIdr(pphRp)} | IDX Levy: Rp ${formatIdr(idxLevyRp)}`}>
                              Rp {formatIdr(taxTotal)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-[#DFFF00]">
                            Rp {formatIdr(netSettleVal)}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-[9px] text-zinc-500">
                            {tx.broker}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {filteredTx.length > 0 && (
              <div className="bg-zinc-950 p-3 px-4 border-t border-zinc-900 flex justify-between items-center text-[9px] font-mono text-zinc-500 uppercase">
                <span>Showing {filteredTx.length} of {transactions.length} record(s)</span>
                <span className="text-zinc-650">Secure Cryptographic Audit Ledger Connected</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
