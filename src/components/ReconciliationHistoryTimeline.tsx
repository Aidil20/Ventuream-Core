import React, { useState, useMemo } from 'react';
import { 
  History, 
  Calendar, 
  UserCheck, 
  FileCheck, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Filter, 
  Download, 
  Hash, 
  FileText, 
  Zap, 
  RefreshCw,
  Sparkles,
  ArrowRight,
  Sliders,
  Database,
  Lock,
  Building2,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';

export interface ReconciliationAdjustment {
  id: string;
  accountCode: string;
  accountName: string;
  category: string;
  originalVariance: number;
  adjustedVariance: number;
  adjustmentType: 'VALUATION_ALIGNMENT' | 'CAPITAL_TRIM' | 'RECLASSIFICATION' | 'AUTOMATED_MATCH';
  note: string;
  impact: 'CRITICAL' | 'MEDIUM' | 'LOW' | 'INFO';
  documentRef?: string;
}

export interface ReconciliationHistoryRun {
  id: string;
  timestamp: string;
  period: string;
  initiatedBy: string;
  auditorRole: string;
  type: 'AUTOMATED_FULL' | 'MANUAL_ADJUSTMENT' | 'MONTHLY_CLOSING' | 'REGULATORY_SUBMISSION';
  status: 'COMPLETED' | 'ADJUSTED_WITH_MEMO' | 'APPROVED' | 'PENDING_REVIEW';
  totalAccounts: number;
  matchedAccounts: number;
  discrepanciesCount: number;
  reconciledCount: number;
  initialVarianceAmount: number;
  finalVarianceAmount: number;
  summary: string;
  adjustments: ReconciliationAdjustment[];
  calkReference: string;
  hash: string;
}

interface ReconciliationHistoryTimelineProps {
  historyRuns: ReconciliationHistoryRun[];
  onExportRunPDF?: (run: ReconciliationHistoryRun) => void;
  onTriggerNewRun?: () => void;
}

export default function ReconciliationHistoryTimeline({
  historyRuns,
  onExportRunPDF,
  onTriggerNewRun
}: ReconciliationHistoryTimelineProps) {
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRunId, setExpandedRunId] = useState<string | null>(historyRuns[0]?.id || null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Format IDR currency
  const formatIDR = (val: number) => {
    if (val === 0) return '0';
    const isDecimal = val % 1 !== 0;
    return val.toLocaleString('id-ID', {
      minimumFractionDigits: isDecimal ? 2 : 0,
      maximumFractionDigits: 2
    });
  };

  // Filtered timeline history runs
  const filteredRuns = useMemo(() => {
    return historyRuns.filter(run => {
      const matchesType = selectedType === 'ALL' || run.type === selectedType;
      const matchesQuery = 
        run.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        run.period.toLowerCase().includes(searchQuery.toLowerCase()) ||
        run.initiatedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        run.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        run.calkReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        run.adjustments.some(a => a.accountName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesType && matchesQuery;
    });
  }, [historyRuns, selectedType, searchQuery]);

  // Handle copying audit hash to clipboard
  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  // Generate individual run PDF
  const handleExportIndividualPDF = (run: ReconciliationHistoryRun) => {
    if (onExportRunPDF) {
      onExportRunPDF(run);
      return;
    }

    try {
      const doc = new jsPDF();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 20, 'F');

      doc.setTextColor(223, 255, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('VENTUREAM INSTITUTIONAL SYSTEM', 14, 13);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`AUDIT TRAIL LOG RUN: ${run.id}`, 140, 13);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('RISALAH DAN RIWAYAT PENYESUAIAN REKONSILIASI KEUANGAN', 14, 30);

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 34, 182, 34, 2, 2, 'FD');

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`RUN ID: ${run.id} | PERIODE: ${run.period}`, 18, 40);
      doc.setFont('helvetica', 'normal');
      doc.text(`Waktu Eksekusi   : ${run.timestamp}`, 18, 46);
      doc.text(`Inisiator / SPI  : ${run.initiatedBy} (${run.auditorRole})`, 18, 51);
      doc.text(`Cryptographic Hash: ${run.hash}`, 18, 56);
      doc.text(`CALK Reference  : ${run.calkReference}`, 18, 61);

      let currentY = 74;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('DAFTAR PENYESUAIAN & PENYELARASAN BUKU:', 14, currentY);

      currentY += 4;
      doc.setFillColor(15, 23, 42);
      doc.rect(14, currentY, 182, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7.5);
      doc.text('AKUN & KATEGORI', 18, currentY + 5);
      doc.text('VARIANSI AWAL', 95, currentY + 5);
      doc.text('SETELAH ADJUSTMENT', 140, currentY + 5);

      currentY += 7;
      run.adjustments.forEach((adj, idx) => {
        doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
        doc.rect(14, currentY, 182, 10, 'F');

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.text(adj.accountName.substring(0, 42), 18, currentY + 4);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Tipe: ${adj.adjustmentType} | Doc: ${adj.documentRef || 'N/A'}`, 18, currentY + 8);

        doc.setFont('helvetica', 'mono');
        doc.setFontSize(7.5);
        doc.setTextColor(217, 119, 6);
        doc.text(`Rp ${formatIDR(adj.originalVariance)}`, 95, currentY + 5);

        doc.setTextColor(22, 101, 52);
        doc.text(`Rp ${formatIDR(adj.adjustedVariance)}`, 140, currentY + 5);

        currentY += 10;
      });

      currentY += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('RINGKASAN EKSEKUTIF SPI:', 14, currentY);

      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      const splitSummary = doc.splitTextToSize(run.summary, 182);
      doc.text(splitSummary, 14, currentY);

      currentY += splitSummary.length * 4 + 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('TERVERIFIKASI AUDIT TRAIL IMMUTABLE', 14, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text('Handoko, SE., Ak., CA - Kepala Satuan Pengawas Intern (SPI)', 14, currentY + 4);

      doc.save(`Audit_Run_${run.id}_${Date.now()}.pdf`);
    } catch (err) {
      console.error('Failed to generate audit run PDF:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Audit Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900/90 to-zinc-900">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#DFFF00]/5 blur-3xl rounded-full pointer-events-none -mr-16 -mt-16"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#DFFF00]/10 text-[#DFFF00] border border-[#DFFF00]/30 tracking-widest uppercase flex items-center gap-1.5">
                <History className="w-3 h-3 text-[#DFFF00]" />
                AUDIT TRAIL TIMELINE & ADJUSTMENT LOGS
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> IMMUTABLE AUDIT LOG
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
              <Clock className="w-6 h-6 text-[#DFFF00]" />
              Riwayat Eksekusi Rekonsiliasi & Log Penyesuaian
            </h2>

            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Jejak audit (*Audit Trail*) mencatat seluruh aktivitas sinkronisasi, variansi yang diidentifikasi, serta catatan penyesuaian (*Adjustment Memos*) yang diposting oleh Auditor SPI dan Satuan Pengawas Intern untuk kepatuhan regulator OJK & BEI.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onTriggerNewRun && (
              <button
                onClick={onTriggerNewRun}
                className="px-4 py-2.5 rounded-xl bg-[#DFFF00] hover:bg-[#c8e600] text-slate-950 font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-[#DFFF00]/10"
              >
                <RefreshCw className="w-4 h-4" />
                JALANKAN AUDIT SINKRONISASI BARU
              </button>
            )}
          </div>
        </div>

        {/* Timeline Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Total Audit Runs</span>
            <div className="text-lg font-black font-mono text-white mt-0.5">{historyRuns.length} Sesi</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">Status Terakhir</span>
            <div className="text-lg font-black font-mono text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> VERIFIED
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest block">Adjustment Memos</span>
            <div className="text-lg font-black font-mono text-amber-400 mt-0.5">
              {historyRuns.reduce((acc, r) => acc + r.adjustments.length, 0)} Item
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest block">Regulator Sync</span>
            <div className="text-lg font-black font-mono text-blue-400 mt-0.5">OJK / OSS BKPM</div>
          </div>
        </div>
      </div>

      {/* Search & Type Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            Tipe Audit:
          </span>
          {[
            { id: 'ALL', label: 'Semua Run' },
            { id: 'AUTOMATED_FULL', label: 'Otomatis' },
            { id: 'MANUAL_ADJUSTMENT', label: 'Manual Adjustment' },
            { id: 'MONTHLY_CLOSING', label: 'Penutupan Bulanan' },
            { id: 'REGULATORY_SUBMISSION', label: 'Regulator Submission' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider transition-all uppercase whitespace-nowrap ${
                selectedType === t.id
                  ? 'bg-[#DFFF00]/20 text-[#DFFF00] border border-[#DFFF00]/40'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Cari Run ID, auditor, atau deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#DFFF00]/50"
          />
        </div>
      </div>

      {/* Vertical Interactive Timeline */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
        {filteredRuns.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
            <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-300">Tidak ada riwayat rekonsiliasi yang cocok dengan pencarian.</p>
            <p className="text-[10px] text-slate-500 mt-1">Coba ubah kata kunci atau filter tipe audit.</p>
          </div>
        ) : (
          filteredRuns.map((run, index) => {
            const isExpanded = expandedRunId === run.id;

            return (
              <div key={run.id} className="relative group">
                {/* Timeline Dot Node */}
                <div 
                  onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                  className={`absolute -left-6 sm:-left-8 top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer z-10 ${
                    run.type === 'AUTOMATED_FULL'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-md shadow-emerald-500/20'
                      : run.type === 'MANUAL_ADJUSTMENT'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-blue-500/20 border-blue-400 text-blue-400 shadow-md shadow-blue-500/20'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    run.type === 'AUTOMATED_FULL' ? 'bg-emerald-400' : run.type === 'MANUAL_ADJUSTMENT' ? 'bg-amber-400' : 'bg-blue-400'
                  }`} />
                </div>

                {/* Timeline Run Card */}
                <div className={`bg-slate-900/90 border rounded-2xl transition-all shadow-xl overflow-hidden ${
                  isExpanded ? 'border-[#DFFF00]/40 ring-1 ring-[#DFFF00]/20' : 'border-slate-800 hover:border-slate-700'
                }`}>
                  {/* Card Header (Clickable) */}
                  <div 
                    onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                    className="p-4 sm:p-5 cursor-pointer bg-slate-900/80 hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-black px-2.5 py-0.5 rounded bg-slate-800 text-[#DFFF00] border border-slate-700">
                          {run.id}
                        </span>

                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700/80 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {run.timestamp}
                        </span>

                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {run.period}
                        </span>

                        {run.type === 'AUTOMATED_FULL' && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            AUTO RECONCILED
                          </span>
                        )}

                        {run.type === 'MANUAL_ADJUSTMENT' && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            MANUAL MEMO
                          </span>
                        )}
                      </div>

                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{run.summary}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                          Inisiator: <strong className="text-slate-300">{run.initiatedBy}</strong> ({run.auditorRole})
                        </span>

                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          CALK: <strong className="text-slate-300">{run.calkReference}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                      <div className="text-right">
                        <span className="text-[9px] text-slate-500 font-bold uppercase block">Variansi Akhir</span>
                        <span className={`font-mono text-sm font-bold ${
                          run.finalVarianceAmount === 0 ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          Rp {formatIDR(run.finalVarianceAmount)}
                        </span>
                        <span className="text-[8px] text-slate-500 block">
                          Awal: Rp {formatIDR(run.initialVarianceAmount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportIndividualPDF(run);
                          }}
                          title="Cetak PDF Audit Run Ini"
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-[#DFFF00]" />
                        </button>

                        <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-[#DFFF00]" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Audit Run Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-slate-800 bg-slate-950/70 p-5 space-y-5"
                      >
                        {/* Cryptographic Hash & Verification Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Lock className="w-3.5 h-3.5 text-[#DFFF00] shrink-0" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
                              Audit Hash:
                            </span>
                            <code className="text-[10px] font-mono text-slate-300 truncate">
                              {run.hash}
                            </code>
                          </div>

                          <button
                            onClick={() => handleCopyHash(run.hash)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono font-bold transition-colors shrink-0 flex items-center gap-1.5"
                          >
                            {copiedHash === run.hash ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Hash className="w-3 h-3 text-[#DFFF00]" />
                                <span>Salin Hash Audit</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Granular Adjustments Breakdown Table */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-200 flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-[#DFFF00]" />
                              Rincian Penyesuaian Akun & Catatan Auditor ({run.adjustments.length} Account Adjustments)
                            </h4>
                            <span className="text-[9px] font-mono text-slate-500">
                              Status: {run.status}
                            </span>
                          </div>

                          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-950 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                                  <th className="py-2.5 px-3">Akun / Kategori</th>
                                  <th className="py-2.5 px-3 text-right">Variansi Awal</th>
                                  <th className="py-2.5 px-3 text-right">Variansi Disesuaikan</th>
                                  <th className="py-2.5 px-3">Tipe Adjustment & Catatan Memo SPI</th>
                                  <th className="py-2.5 px-3 text-center">Ref Dokumen</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/80 text-xs">
                                {run.adjustments.map((adj) => (
                                  <tr key={adj.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="py-3 px-3 space-y-0.5">
                                      <div className="font-bold text-slate-200 text-xs">{adj.accountName}</div>
                                      <div className="text-[9px] font-mono text-slate-500">{adj.category} • {adj.accountCode}</div>
                                    </td>

                                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">
                                      Rp {formatIDR(adj.originalVariance)}
                                    </td>

                                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                                      Rp {formatIDR(adj.adjustedVariance)}
                                    </td>

                                    <td className="py-3 px-3 space-y-1 max-w-sm">
                                      <span className="inline-block px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-slate-800 text-slate-300 uppercase">
                                        {adj.adjustmentType}
                                      </span>
                                      <p className="text-[10px] text-slate-400 leading-relaxed italic">
                                        "{adj.note}"
                                      </p>
                                    </td>

                                    <td className="py-3 px-3 text-center">
                                      {adj.documentRef ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                          <FileText className="w-3 h-3" />
                                          {adj.documentRef}
                                        </span>
                                      ) : (
                                        <span className="text-[9px] text-slate-600 font-mono">-</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Audit Trail Certificate Note */}
                        <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-400/90 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Telah diverifikasi oleh Tim Internal Control SPI VentureAM. Dicatat dalam Buku Ledger Rekonsiliasi Keuangan.</span>
                          </div>

                          <button
                            onClick={() => handleExportIndividualPDF(run)}
                            className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[10px] transition-colors shrink-0 flex items-center gap-1.5"
                          >
                            <Download className="w-3 h-3" />
                            Cetak Sertifikat Audit
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
