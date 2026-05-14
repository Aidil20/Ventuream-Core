import React, { useState } from 'react';
import { BarChart3, PieChart, Calculator, FileCheck, RefreshCcw, Landmark, ArrowLeft, Download, CheckCircle2, Loader2, FileSpreadsheet, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Report {
  id: string;
  titleInd: string;
  titleEng: string;
  standard: string;
  lastUpdate: string;
  status?: string;
}

export default function FinancialReportingCenter() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([
    { id: 'BS', titleInd: 'Neraca Konsolidasi', titleEng: 'Consolidated Balance Sheet', standard: 'PSAK 71 / IFRS 9', lastUpdate: '10 Mins Ago' },
    { id: 'PL', titleInd: 'Laba Rugi Komprehensif', titleEng: 'Statement of Comprehensive Income', standard: 'PSAK 1 / IAS 1', lastUpdate: 'Live' },
    { id: 'CF', titleInd: 'Arus Kas Automatis', titleEng: 'Automated Cash Flow Statement', standard: 'PSAK 2 / IAS 7', lastUpdate: 'Daily' },
  ]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsGenerating(false);
            setReports(current => current.map(r => r.id === 'BS' ? { ...r, status: 'GENERATED' } : r));
            setShowPreview('BS'); // Preview BS after generation
          }, 500);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const handlePreview = (id: string) => {
    setReports(current => current.map(r => r.id === id ? { ...r, status: 'LAST PREVIEWED' } : r));
    setShowPreview(id);
  };

  const getReportContent = (id: string) => {
    switch (id) {
      case 'BS':
        return {
          titleInd: 'LAPORAN POSISI KEUANGAN KONSOLIDASIAN',
          titleEng: 'CONSOLIDATED STATEMENT OF FINANCIAL POSITION',
          rows: [
            { labelInd: 'ASET LANCAR', labelEng: 'CURRENT ASSETS', val26: '1.240.500.000.000', val25: '980.200.000.000', isBold: true },
            { labelInd: 'Kas dan Setara Kas', labelEng: 'Cash and Cash Equivalents', val26: '450.000.000.000', val25: '320.000.000.000' },
            { labelInd: 'Investasi Lancar', labelEng: 'Current Investments', val26: '790.500.000.000', val25: '660.200.000.000' },
            { labelInd: 'ASET TIDAK LANCAR', labelEng: 'NON-CURRENT ASSETS', val26: '3.420.000.000.000', val25: '3.100.000.000.000', isBold: true },
            { labelInd: 'Aset Tetap', labelEng: 'Fixed Assets', val26: '2.100.000.000.000', val25: '2.050.000.000.000' }
          ]
        };
      case 'PL':
        return {
          titleInd: 'LAPORAN LABA RUGI KOMPREHENSIF',
          titleEng: 'STATEMENT OF COMPREHENSIVE INCOME',
          rows: [
            { labelInd: 'PENDAPATAN', labelEng: 'REVENUE', val26: '850.000.000.000', val25: '720.000.000.000', isBold: true },
            { labelInd: 'Pendapatan Investasi', labelEng: 'Investment Income', val26: '620.000.000.000', val25: '510.000.000.000' },
            { labelInd: 'BEBAN OPERASIONAL', labelEng: 'OPERATING EXPENSES', val26: '(120.000.000.000)', val25: '(105.000.000.000)', isBold: true },
            { labelInd: 'LABA BERSIH TAHUN BERJALAN', labelEng: 'NET PROFIT FOR THE YEAR', val26: '530.000.000.000', val25: '415.000.000.000', isBold: true }
          ]
        };
      case 'CF':
        return {
          titleInd: 'LAPORAN ARUS KAS',
          titleEng: 'STATEMENT OF CASH FLOWS',
          rows: [
            { labelInd: 'ARUS KAS DARI AKTIVITAS OPERASI', labelEng: 'CASH FLOW FROM OPERATING ACTIVITIES', val26: '420.000.000.000', val25: '310.000.000.000', isBold: true },
            { labelInd: 'Kas Diterima dari Pelanggan', labelEng: 'Cash Received from Customers', val26: '850.000.000.000', val25: '720.000.000.000' },
            { labelInd: 'ARUS KAS DARI AKTIVITAS INVESTASI', labelEng: 'CASH FLOW FROM INVESTING ACTIVITIES', val26: '(150.000.000.000)', val25: '(200.000.000.000)', isBold: true },
            { labelInd: 'KENAIKAN BERSIH KAS', labelEng: 'NET INCREASE IN CASH', val26: '270.000.000.000', val25: '110.000.000.000', isBold: true }
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
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text('VENTURE ASSET MANAGEMENT', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Laporan Keuangan Institusional / Institutional Financial Report', 105, 22, { align: 'center' });
    
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(15, 27, 195, 27);

    // Title
    doc.setFontSize(12);
    doc.text(reportData.titleInd, 105, 38, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(reportData.titleEng, 105, 43, { align: 'center' });
    doc.setTextColor(0);

    // Date
    doc.setFontSize(9);
    doc.text('Periode Berakhir / Period Ended: 31 Desember 2026', 15, 52);

    // Table
    const tableRows = reportData.rows.map(row => [
      `${row.labelInd}\n(${row.labelEng})`,
      row.val26,
      row.val25
    ]);

    autoTable(doc, {
      startY: 60,
      head: [['Uraian / Description', '2026 (Rp)', '2025 (Rp)']],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 4 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' }
      }
    });

    const fileName = `${reportData.titleEng.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
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
                  <p className="text-sm font-black">31 Desember 2026</p>
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

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-orange-400 uppercase tracking-tighter flex items-center gap-2">
          <Calculator className="w-6 h-6" /> PELAPORAN KEUANGAN (PSAK/IFRS)
        </h2>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-zinc-800 border border-white/5 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-zinc-700 transition-all">
            <RefreshCcw className="w-3 h-3" /> RE-SYNC ACCOUNTING
          </button>
          <button 
            onClick={handleGenerate}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-orange-600 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
          >
            <Landmark className="w-3 h-3" /> GENERATE BILINGUAL REPORT
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-white/5 bg-zinc-950/50">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-orange-400" /> Active Accounting Templates
          </h3>
          <div className="space-y-4">
            {reports.map((r) => (
              <div 
                key={r.id} 
                onClick={() => handlePreview(r.id)}
                className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/30 border border-white/5 group hover:border-orange-400/30 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-400/10 flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">{r.titleInd}</p>
                      {r.status && (
                        <span className="text-[7px] px-1.5 py-0.5 rounded bg-orange-400/10 text-orange-400 font-black tracking-tighter border border-orange-400/20 uppercase">
                          {r.status}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 italic uppercase">{r.titleEng}</p>
                    <p className="text-[9px] text-zinc-600 mt-1">{r.standard} Compliance</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-green-400 uppercase">{r.lastUpdate}</p>
                  <button className="text-[9px] font-black text-orange-400 uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity">PREVIEW</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-white/5 bg-zinc-950/50 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-orange-400/5 border border-orange-400/20 flex items-center justify-center">
            <PieChart className="w-8 h-8 text-orange-400 animate-pulse" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white tracking-tighter">AI Accounting Engine Ready</h4>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto">VentureAM Core is processing institutional transactions using AES-256 encrypted channels.</p>
          </div>
          <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "85%" }}
              className="h-full bg-orange-400"
            />
          </div>
          <div className="flex items-center gap-2 text-[9px] text-orange-400/70 font-bold uppercase tracking-widest">
            <CheckCircle2 className="w-3 h-3" /> System Integrity Certified
          </div>
        </div>
      </div>
    </div>
  );
}
