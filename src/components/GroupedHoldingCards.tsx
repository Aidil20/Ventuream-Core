import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  ChevronDown, 
  ChevronRight, 
  Building2, 
  Zap, 
  Landmark, 
  Cpu, 
  HardHat, 
  FileCode2, 
  ShoppingBag, 
  Tv, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  ChevronsUpDown, 
  Search, 
  SlidersHorizontal,
  FolderOpen,
  FileText,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import HoldingCard from './HoldingCard';

export interface PortfolioAsset {
  ticker: string;
  lots: number;
  averagePrice: number;
  marketPrice: number;
  currentPrice: number;
  change: number;
  marketValue: number;
  unrealized: number;
  dailyChange?: number;
  category?: string;
  type?: string;
  sector?: string;
  performance?: number[];
}

interface GroupedHoldingCardsProps {
  portfolioData: PortfolioAsset[];
  onAssetClick?: (asset: PortfolioAsset) => void;
  alertThresholds?: Record<string, { targetPrice: number; type: 'above' | 'below'; active: boolean }>;
  onSaveAlert?: (ticker: string, targetPrice: number, type: 'above' | 'below', active: boolean) => void;
  selectedTickers?: string[];
  onSelectToggle?: (ticker: string) => void;
  layoutMode?: 'single' | 'grid';
  onExportExcel?: () => void;
}

// Category Mapping helper
export const getAssetCategory = (asset: PortfolioAsset): string => {
  if (asset.category) return asset.category;
  if (asset.sector) return asset.sector;
  
  const cleanTicker = asset.ticker.replace('.JK', '').toUpperCase();

  // Check warrants / derivatives first
  if (cleanTicker.endsWith('-W') || cleanTicker.includes('-R') || cleanTicker.endsWith('-W2')) {
    return 'Warrants & Derivatives';
  }

  const staticCategoryMap: Record<string, string> = {
    'DSSA': 'Energy & Mining',
    'PRDL': 'Energy & Mining',
    'DEFI': 'Financial Services',
    'BACH': 'Financial Services',
    'LPKR': 'Property & Real Estate',
    'OTAS': 'Property & Real Estate',
    'ANDI': 'Property & Real Estate',
    'IPAC': 'Property & Real Estate',
    'KOTA': 'Property & Real Estate',
    'LAND': 'Property & Real Estate',
    'JECX': 'Technology & Electronics',
    'CTTH': 'Technology & Electronics',
    'PIPA': 'Industrials & Infrastructure',
    'EMMI': 'Consumer Goods',
    'RANS': 'Media & Entertainment',
  };

  if (staticCategoryMap[cleanTicker]) {
    return staticCategoryMap[cleanTicker];
  }

  if (asset.type === 'Property' || asset.type === 'Real Estate') return 'Property & Real Estate';
  if (asset.type === 'Financial') return 'Financial Services';
  if (asset.type === 'Energy') return 'Energy & Mining';

  return 'Equities';
};

// Category Icon Helper
const getCategoryIcon = (categoryName: string) => {
  const cat = categoryName.toLowerCase();
  if (cat.includes('property') || cat.includes('real estate')) return <Building2 className="w-4 h-4 text-amber-400" />;
  if (cat.includes('energy') || cat.includes('mining') || cat.includes('resource')) return <Zap className="w-4 h-4 text-[#DFFF00]" />;
  if (cat.includes('financial') || cat.includes('banking')) return <Landmark className="w-4 h-4 text-emerald-400" />;
  if (cat.includes('tech') || cat.includes('electronics')) return <Cpu className="w-4 h-4 text-cyan-400" />;
  if (cat.includes('industrial') || cat.includes('infra')) return <HardHat className="w-4 h-4 text-orange-400" />;
  if (cat.includes('warrant') || cat.includes('derivative')) return <FileCode2 className="w-4 h-4 text-purple-400" />;
  if (cat.includes('consumer') || cat.includes('goods')) return <ShoppingBag className="w-4 h-4 text-pink-400" />;
  if (cat.includes('media') || cat.includes('entertainment')) return <Tv className="w-4 h-4 text-blue-400" />;
  return <PieChart className="w-4 h-4 text-slate-400" />;
};

// Export to PDF generator helper
export const generateHoldingsPDF = (
  portfolioData: PortfolioAsset[],
  groupByMode: string = 'category'
) => {
  const doc = new jsPDF();
  const currentDate = new Date();
  const dateStr = currentDate.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const timeStr = currentDate.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate totals
  const totalMarketValue = portfolioData.reduce((acc, curr) => acc + (curr.marketValue || 0), 0);
  const totalCost = portfolioData.reduce((acc, curr) => {
    const cost = (curr.averagePrice || 0) * (curr.lots || 0) * 100;
    return acc + cost;
  }, 0);
  const totalUnrealized = portfolioData.reduce((acc, curr) => acc + (curr.unrealized || 0), 0);
  const totalUnrealizedPct = totalCost > 0 ? (totalUnrealized / totalCost) * 100 : 0;
  const totalLots = portfolioData.reduce((acc, curr) => acc + (curr.lots || 0), 0);

  // Grouping computation for category breakdown table
  const categoryGroups: Record<string, {
    assets: PortfolioAsset[];
    marketValue: number;
    cost: number;
    unrealized: number;
    lots: number;
  }> = {};

  portfolioData.forEach(asset => {
    const cat = getAssetCategory(asset);
    if (!categoryGroups[cat]) {
      categoryGroups[cat] = { assets: [], marketValue: 0, cost: 0, unrealized: 0, lots: 0 };
    }
    const assetCost = (asset.averagePrice || 0) * (asset.lots || 0) * 100;
    categoryGroups[cat].assets.push(asset);
    categoryGroups[cat].marketValue += asset.marketValue || 0;
    categoryGroups[cat].cost += assetCost;
    categoryGroups[cat].unrealized += asset.unrealized || 0;
    categoryGroups[cat].lots += asset.lots || 0;
  });

  // 1. Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 28, 'F');
  
  doc.setFillColor(223, 255, 0); // #DFFF00 accent
  doc.rect(0, 28, 210, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('PT VENTURE ASSET MANAGEMENT', 14, 13);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(223, 255, 0);
  doc.text('INSTITUTIONAL SYSTEM — HOLDINGS DETAILS BREAKDOWN REPORT', 14, 19);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${dateStr} | ${timeStr} WIB`, 196, 13, { align: 'right' });
  doc.text('CLASSIFICATION: RESTRICTED / CONFIDENTIAL', 196, 19, { align: 'right' });

  // 2. Executive Portfolio Summary Box
  doc.setFillColor(248, 250, 252);
  doc.rect(14, 34, 182, 26, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, 34, 182, 26, 'S');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  
  doc.text('TOTAL PORTFOLIO VALUE', 18, 40);
  doc.text('TOTAL COST BASIS', 70, 40);
  doc.text('UNREALIZED P&L', 120, 40);
  doc.text('TOTAL POSITIONS', 165, 40);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  
  doc.text(`Rp ${totalMarketValue.toLocaleString('id-ID')}`, 18, 47);
  doc.text(`Rp ${totalCost.toLocaleString('id-ID')}`, 70, 47);
  
  const pnlColor = totalUnrealized >= 0 ? [16, 185, 129] : [239, 68, 68];
  doc.setTextColor(pnlColor[0], pnlColor[1], pnlColor[2]);
  doc.text(`${totalUnrealized >= 0 ? '+' : ''}Rp ${totalUnrealized.toLocaleString('id-ID')} (${totalUnrealizedPct >= 0 ? '+' : ''}${totalUnrealizedPct.toFixed(2)}%)`, 120, 47);

  doc.setTextColor(15, 23, 42);
  doc.text(`${portfolioData.length} Positions (${totalLots.toLocaleString('id-ID')} Lots)`, 165, 47);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text(`Grouping Mode: ${groupByMode.toUpperCase()} | Engine: Real-Time Market Quote Feed`, 18, 54);

  // 3. Category / Sector Breakdown Table
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. Category / Sector Allocation Breakdown', 14, 67);

  const categoryTableRows = Object.entries(categoryGroups).map(([catName, grp]) => {
    const catWeight = totalMarketValue > 0 ? (grp.marketValue / totalMarketValue) * 100 : 0;
    const catPnlPct = grp.cost > 0 ? (grp.unrealized / grp.cost) * 100 : 0;
    return [
      catName,
      `${grp.assets.length} items`,
      `${grp.lots.toLocaleString('id-ID')} Lots`,
      `Rp ${grp.marketValue.toLocaleString('id-ID')}`,
      `${catWeight.toFixed(1)}%`,
      `${grp.unrealized >= 0 ? '+' : ''}Rp ${grp.unrealized.toLocaleString('id-ID')} (${catPnlPct >= 0 ? '+' : ''}${catPnlPct.toFixed(1)}%)`
    ];
  });

  autoTable(doc, {
    startY: 70,
    head: [['Sector / Category', 'Holdings', 'Volume (Lots)', 'Market Value (IDR)', 'Weight (%)', 'Unrealized P&L']],
    body: categoryTableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [51, 65, 85]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      2: { halign: 'right' },
      3: { halign: 'right', fontStyle: 'bold' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14 }
  });

  // 4. Detailed Positions Breakdown Table
  const nextY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 120;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. Individual Position Breakdown & Performance Details', 14, nextY);

  const positionTableRows = portfolioData.map((asset) => {
    const cleanTicker = asset.ticker.replace('.JK', '');
    const category = getAssetCategory(asset);
    const weight = totalMarketValue > 0 ? ((asset.marketValue || 0) / totalMarketValue) * 100 : 0;
    const cost = (asset.averagePrice || 0) * (asset.lots || 0) * 100;
    const pnl = asset.unrealized || 0;
    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
    const avgPrice = asset.averagePrice || 0;
    const currPrice = asset.currentPrice || asset.marketPrice || 0;

    return [
      cleanTicker,
      category,
      asset.lots ? asset.lots.toLocaleString('id-ID') : '0',
      `Rp ${avgPrice.toLocaleString('id-ID')}`,
      `Rp ${currPrice.toLocaleString('id-ID')}`,
      `Rp ${(asset.marketValue || 0).toLocaleString('id-ID')}`,
      `${weight.toFixed(1)}%`,
      `${pnl >= 0 ? '+' : ''}Rp ${pnl.toLocaleString('id-ID')} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%)`
    ];
  });

  autoTable(doc, {
    startY: nextY + 3,
    head: [['Ticker', 'Category', 'Lots', 'Avg Price', 'Market Price', 'Market Value (IDR)', 'Weight', 'Unrealized P&L']],
    body: positionTableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [51, 65, 85]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [15, 23, 42] },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' },
      6: { halign: 'right' },
      7: { halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14 }
  });

  // 5. Footer and Page Numbers
  const pageHeight = doc.internal.pageSize.height;
  const totalPages = (doc as any).internal.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text('* Automated system generated report from PT Venture Asset Management Institutional System. Confidential.', 14, pageHeight - 12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i} of ${totalPages}`, 196, pageHeight - 8, { align: 'right' });
    doc.text('VentureAM Institutional System © 2026', 14, pageHeight - 8);
  }

  doc.save(`VAM_Holdings_Details_Report_${currentDate.toISOString().slice(0, 10)}.pdf`);
};

// Export to Excel spreadsheet helper using standard CSV data structure
export const generateHoldingsExcel = (
  portfolioData: PortfolioAsset[],
  cgsCashBalance: number = 0,
  cgsGiroBalance: number = 0
) => {
  const rdnCash = cgsCashBalance;
  const giroAccountBalance = cgsGiroBalance;
  const totalAssetVal = portfolioData.reduce((acc, curr) => acc + (curr.marketValue || 0), 0);
  const totalCombinedValue = totalAssetVal + rdnCash + giroAccountBalance;
  const totalCost = portfolioData.reduce((acc, curr) => {
    const cost = (curr.averagePrice || 0) * (curr.lots || 0) * 100;
    return acc + cost;
  }, 0);
  const totalPL = totalAssetVal - totalCost;
  const performancePct = totalCost === 0 ? 0 : (totalPL / totalCost) * 100;

  const currentDate = new Date();
  const formatTime = currentDate.toISOString().replace('T', ' ').slice(0, 19);

  const wsData: (string | number)[][] = [];
  wsData.push(['VENTUREAM INSTITUTIONAL SYSTEM - PORTFOLIO PERFORMANCE & RISK ANALYSIS']);
  wsData.push(['Printed Time', formatTime]);
  wsData.push(['Account ID', 'YU001HC5400154']);
  wsData.push(['Gateway System Status', 'CONNECTED & SECURED']);
  wsData.push([]);

  wsData.push(['PORTFOLIO FINANCIAL SUMMARY']);
  wsData.push(['Equity Value (IDR)', totalAssetVal]);
  wsData.push(['Cash RDN Balance (IDR)', rdnCash]);
  wsData.push(['Giro Account Balance (IDR)', giroAccountBalance]);
  wsData.push(['Total Combined Value (IDR)', totalCombinedValue]);
  wsData.push(['Total Deposited Capital (IDR)', totalCost]);
  wsData.push(['Accumulated Unrealized PnL (IDR)', totalPL]);
  wsData.push(['Performance Yield (%)', Number(performancePct.toFixed(2))]);
  wsData.push([]);

  wsData.push(['DETAILED PORTFOLIO BREAKDOWN']);
  wsData.push([
    'Ticker',
    'Lots',
    'Average Price (IDR)',
    'Current Price (IDR)',
    'Total Cost (IDR)',
    'Market Value (IDR)',
    'Unrealized PnL (IDR)',
    'Unrealized PnL (%)',
    'Weight (%)'
  ]);

  portfolioData.forEach(asset => {
    const assetCost = (asset.averagePrice || 0) * (asset.lots || 0) * 100;
    const assetMktVal = asset.marketValue || 0;
    const assetPL = assetMktVal - assetCost;
    const assetPLPct = assetCost === 0 ? 0 : (assetPL / assetCost) * 100;
    const weight = totalAssetVal === 0 ? 0 : (assetMktVal / totalAssetVal) * 100;

    wsData.push([
      asset.ticker || 'N/A',
      asset.lots || 0,
      asset.averagePrice || 0,
      asset.currentPrice || asset.marketPrice || 0,
      assetCost,
      assetMktVal,
      assetPL,
      Number(assetPLPct.toFixed(2)),
      Number(weight.toFixed(2))
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(wsData);

  const colWidths: number[] = [];
  wsData.forEach(row => {
    row.forEach((val, colIdx) => {
      const len = String(val ?? '').length;
      colWidths[colIdx] = Math.max(colWidths[colIdx] || 10, len + 3);
    });
  });
  worksheet['!cols'] = colWidths.map(w => ({ wch: w }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Portfolio Analysis');

  const fileName = `VAM_Portfolio_Analysis_Report_${currentDate.toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

export default function GroupedHoldingCards({
  portfolioData,
  onAssetClick,
  alertThresholds = {},
  onSaveAlert,
  selectedTickers = [],
  onSelectToggle,
  layoutMode = 'single',
  onExportExcel
}: GroupedHoldingCardsProps) {
  const [groupBy, setGroupBy] = useState<'category' | 'type' | 'performance' | 'flat'>('category');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPDF = () => {
    setIsExportingPdf(true);
    setTimeout(() => {
      try {
        const itemsToExport: PortfolioAsset[] = searchQuery.trim()
          ? (Object.values(groupedData).flat() as PortfolioAsset[])
          : portfolioData;
        generateHoldingsPDF(itemsToExport, groupBy);
      } catch (err) {
        console.error('Error generating Holdings PDF:', err);
      } finally {
        setIsExportingPdf(false);
      }
    }, 100);
  };

  const handleExportExcel = () => {
    try {
      const itemsToExport: PortfolioAsset[] = searchQuery.trim()
        ? (Object.values(groupedData).flat() as PortfolioAsset[])
        : portfolioData;
      generateHoldingsExcel(itemsToExport);
    } catch (err) {
      console.error('Error generating Holdings Excel:', err);
    }
  };

  // Total Portfolio Market Value
  const totalPortfolioValue = useMemo(() => {
    return portfolioData.reduce((acc, curr) => acc + (curr.marketValue || 0), 0);
  }, [portfolioData]);

  // Group items by selected mode
  const groupedData = useMemo(() => {
    const filtered = portfolioData.filter(asset => {
      if (!searchQuery) return true;
      const clean = asset.ticker.replace('.JK', '').toLowerCase();
      const cat = getAssetCategory(asset).toLowerCase();
      const q = searchQuery.toLowerCase();
      return clean.includes(q) || cat.includes(q);
    });

    const groups: Record<string, PortfolioAsset[]> = {};

    filtered.forEach(asset => {
      let groupKey = 'Equities';
      if (groupBy === 'category') {
        groupKey = getAssetCategory(asset);
      } else if (groupBy === 'type') {
        if (asset.ticker.includes('-W')) groupKey = 'Warrants & Derivatives';
        else if (asset.type) groupKey = asset.type;
        else groupKey = 'Equities';
      } else if (groupBy === 'performance') {
        const unrealized = asset.unrealized || 0;
        if (unrealized > 0) groupKey = 'Gainers (In Profit)';
        else if (unrealized < 0) groupKey = 'Losers (In Loss)';
        else groupKey = 'Neutral (Break Even)';
      } else {
        groupKey = 'All Portfolio Holdings';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(asset);
    });

    return groups;
  }, [portfolioData, groupBy, searchQuery]);

  const categoryKeys = Object.keys(groupedData);

  // Toggle Collapse State for a specific category
  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  // Expand All / Collapse All
  const expandAll = () => setCollapsedCategories({});
  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    categoryKeys.forEach(cat => {
      next[cat] = true;
    });
    setCollapsedCategories(next);
  };

  const isAllCollapsed = categoryKeys.length > 0 && categoryKeys.every(cat => collapsedCategories[cat]);

  const formatIDR = (val: number) => {
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  return (
    <div className="space-y-4 w-full">
      {/* Control Bar: Search, Group By Selector, Expand/Collapse All */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 backdrop-blur-md">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search holdings or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 text-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:border-[#DFFF00]/50 transition-colors placeholder:text-slate-600 font-mono"
          />
        </div>

        {/* Grouping Mode Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <div className="flex bg-slate-950/90 p-1 rounded-xl border border-slate-800 text-[9px] font-bold uppercase tracking-wider">
            <button
              onClick={() => setGroupBy('category')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                groupBy === 'category'
                  ? 'bg-slate-800 text-[#DFFF00] border border-slate-700/60 font-black shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <FolderOpen className="w-3 h-3" />
              Category
            </button>
            <button
              onClick={() => setGroupBy('performance')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                groupBy === 'performance'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700/60 font-black shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              P&L Status
            </button>
            <button
              onClick={() => setGroupBy('flat')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                groupBy === 'flat'
                  ? 'bg-slate-800 text-slate-200 border border-slate-700/60 font-black shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Layers className="w-3 h-3" />
              Flat List
            </button>
          </div>

          {/* Expand / Collapse All Toggle */}
          {groupBy !== 'flat' && (
            <button
              onClick={isAllCollapsed ? expandAll : collapseAll}
              className="px-2.5 py-1.5 bg-slate-950/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-800 text-[9px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 whitespace-nowrap"
              title={isAllCollapsed ? 'Expand All Groups' : 'Collapse All Groups'}
            >
              <ChevronsUpDown className="w-3 h-3 text-slate-400" />
              {isAllCollapsed ? 'Expand All' : 'Collapse All'}
            </button>
          )}

          {/* Export to PDF Button */}
          <button
            onClick={handleExportPDF}
            disabled={isExportingPdf || portfolioData.length === 0}
            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/30 text-emerald-400 hover:text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl border border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap shadow-sm cursor-pointer"
            title="Download Holdings Details Breakdown as PDF Report"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <FileText className="w-3 h-3 text-emerald-400" />
                <span>Export PDF</span>
              </>
            )}
          </button>

          {/* Export to Excel Button */}
          <button
            onClick={onExportExcel || handleExportExcel}
            disabled={portfolioData.length === 0}
            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/30 text-emerald-400 hover:text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl border border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap shadow-sm cursor-pointer"
            title="Download Holdings Details Breakdown as Excel Spreadsheet (.xlsx)"
          >
            <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Category Groups List */}
      {categoryKeys.length === 0 ? (
        <div className="bg-slate-900/40 p-8 rounded-2xl border border-slate-800 text-center text-slate-500">
          <p className="text-xs font-bold uppercase tracking-wider">No holdings found matching search query</p>
        </div>
      ) : (
        categoryKeys.map((category, catIdx) => {
          const assets = groupedData[category];
          const isCollapsed = Boolean(collapsedCategories[category]);

          // Compute Category Metrics
          const categoryMarketValue = assets.reduce((sum, a) => sum + (a.marketValue || 0), 0);
          const categoryTotalCost = assets.reduce((sum, a) => sum + ((a.averagePrice || 0) * (a.lots || 0) * 100), 0);
          const categoryUnrealized = assets.reduce((sum, a) => sum + (a.unrealized || 0), 0);
          const categoryUnrealizedPct = categoryTotalCost > 0 ? (categoryUnrealized / categoryTotalCost) * 100 : 0;
          const portfolioWeight = totalPortfolioValue > 0 ? (categoryMarketValue / totalPortfolioValue) * 100 : 0;
          const totalLots = assets.reduce((sum, a) => sum + (a.lots || 0), 0);

          return (
            <div key={category} className="space-y-2">
              {/* Collapsible Category Header (Hidden if groupBy === 'flat') */}
              {groupBy !== 'flat' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: catIdx * 0.03 }}
                  onClick={() => toggleCategory(category)}
                  className="bg-slate-900/80 hover:bg-slate-850 p-3.5 px-4 rounded-2xl border border-slate-800/90 shadow-md cursor-pointer transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-3 group border-l-4 border-l-[#DFFF00]"
                >
                  {/* Left Title & Icon */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800 group-hover:border-slate-700 transition-colors">
                      {getCategoryIcon(category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white font-mono tracking-wide">{category}</h4>
                        <span className="text-[9px] font-black bg-slate-950 text-slate-400 px-2 py-0.5 rounded-full border border-slate-800 font-mono">
                          {assets.length} {assets.length === 1 ? 'Holding' : 'Holdings'} ({totalLots} Lots)
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                        Allocation Weight: <span className="text-slate-300 font-mono">{portfolioWeight.toFixed(1)}%</span> of Portfolio
                      </p>
                    </div>
                  </div>

                  {/* Right Category Subtotals & Collapse Chevron */}
                  <div className="flex items-center justify-between md:justify-end gap-4 text-xs font-mono">
                    <div className="text-left md:text-right">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Group Value</p>
                      <p className="font-black text-[#DFFF00] text-sm">{formatIDR(categoryMarketValue)}</p>
                    </div>

                    <div className="text-left md:text-right hidden sm:block">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Unrealized P&L</p>
                      <p className={`font-bold text-xs ${categoryUnrealized >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {categoryUnrealized >= 0 ? '+' : ''}{formatIDR(categoryUnrealized)} ({categoryUnrealizedPct >= 0 ? '+' : ''}{categoryUnrealizedPct.toFixed(1)}%)
                      </p>
                    </div>

                    <div className="p-1.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-400 group-hover:text-white transition-colors">
                      {isCollapsed ? <ChevronRight className="w-4 h-4 text-[#DFFF00]" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Category Holdings Cards Grid / List */}
              <AnimatePresence initial={false}>
                {(!isCollapsed || groupBy === 'flat') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className={layoutMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 pl-1 md:pl-2' : 'space-y-3 pt-1 pl-1 md:pl-2'}>
                      {assets.map((asset, idx) => (
                        <HoldingCard
                          key={`${asset.ticker}-${idx}`}
                          asset={asset}
                          idx={idx}
                          onClick={() => onAssetClick && onAssetClick(asset)}
                          alertConfig={alertThresholds[asset.ticker]}
                          onSaveAlert={onSaveAlert}
                          selected={selectedTickers.includes(asset.ticker)}
                          onSelectToggle={onSelectToggle ? () => onSelectToggle(asset.ticker) : undefined}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })
      )}
    </div>
  );
}
