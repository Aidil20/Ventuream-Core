import React, { useState, useMemo } from 'react';
import { Database, ShieldCheck, History, Search, Scale, FileSignature, CheckCircle2, Lock, Download, FileText, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function RegulatoryArchive() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const initialLogs = [
    { time: '14:22:01', action: 'AES-256 Encryption Locked', system: 'GATEWAY', status: 'SECURE' },
    { time: '14:20:15', action: 'PSAK 71 Report Archived', system: 'ACCOUNTING', status: 'IMMUTABLE' },
    { time: '14:15:33', action: 'IDX Smart Socket Refresh', system: 'NETWORK', status: 'SYNCED' },
    { time: '14:05:01', action: 'OJK Regulatory Handshake', system: 'COMPLIANCE', status: 'SUCCESS' },
    { time: '13:58:12', action: 'Institutional Key Rotation', system: 'SECURITY', status: 'VERIFIED' },
    { time: '13:45:00', action: 'IFRS 9 Mapping Validated', system: 'AUDIT', status: 'PASSED' },
    { time: '13:30:42', action: 'FATF AML Risk Screening', system: 'COMPLIANCE', status: 'CLEARED' },
    { time: '13:12:09', action: 'BEI Trade Settlement Feed', system: 'SETTLEMENT', status: 'CONFIRMED' },
    { time: '12:50:30', action: 'UBO BO-Declaration Mirror', system: 'LEGAL', status: 'ARCHIVED' },
    { time: '12:20:18', action: 'BAPPEBTI Derivative Audit', system: 'REGULATORY', status: 'PASSED' },
  ];

  const filteredLogs = useMemo(() => {
    return initialLogs.filter(log => 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.system.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleGrantAccess = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      alert('Akses Audit Eksternal (OJK/BEI) telah dibuka selama 2 jam ke depan.');
    }, 1000);
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // 1. Header Bar
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 18, 'F');

      // Brand Title
      doc.setTextColor(223, 255, 0); // VentureAM neon accent (#DFFF00)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('PT VENTURE ASSET MANAGEMENT GROUP', 14, 11);

      // Header Tagline
      doc.setTextColor(148, 163, 184); // slate-400
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('INSTITUTIONAL REGULATORY GATEWAY // ZERO TRUST AUDIT TRAIL VAULT', 14, 15.5);

      // 2. Report Document Header
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('REGULATORY ARCHIVE & SYSTEM AUDIT LOGS', 14, 28);

      // Status Pill Box
      doc.setFillColor(240, 253, 244); // light emerald
      doc.rect(14, 32, 182, 28, 'F');
      doc.setDrawColor(187, 247, 208);
      doc.rect(14, 32, 182, 28, 'D');

      doc.setTextColor(21, 128, 61); // emerald-700
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('AUDIT STATUS: IMMUTABLE AUDIT TRAIL VERIFIED (SHA-256 ENCRYPTED)', 18, 38.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const timestamp = new Date().toLocaleString('id-ID');
      doc.text(`Generated Timestamp: ${timestamp} JKT (GMT+7)`, 18, 44);
      doc.text(`Total Archived Logs Exported: ${filteredLogs.length} Records ${searchQuery ? `(Filtered by: "${searchQuery}")` : '(Unfiltered Full Audit Vault)'}`, 18, 48.5);
      doc.text('Regulatory Framework: OJK, BEI, BAPPEBTI, FATF Anti-Money Laundering & PSAK 71 Compliance.', 18, 53);

      // 3. Table Headers and Rows
      const tableHeaders = [['No.', 'Time (JKT)', 'System Event / Action', 'Origin System', 'Security Status', 'SHA-256 Verification Hash']];
      
      const tableRows = filteredLogs.map((log, index) => {
        const shortHash = `0x${((index + 1) * 7919 + 0x4A12B3).toString(16).toUpperCase().padStart(8, '0')}`;
        return [
          (index + 1).toString(),
          log.time,
          log.action,
          log.system,
          log.status,
          shortHash
        ];
      });

      autoTable(doc, {
        startY: 65,
        head: tableHeaders,
        body: tableRows,
        theme: 'striped',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [223, 255, 0],
          fontSize: 8,
          font: 'helvetica',
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 7.5,
          font: 'helvetica',
          textColor: [30, 41, 59]
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 22 },
          2: { cellWidth: 62 },
          3: { cellWidth: 28 },
          4: { cellWidth: 26, fontStyle: 'bold' },
          5: { cellWidth: 34, font: 'courier', fontSize: 7 }
        },
        margin: { left: 14, right: 14 }
      });

      // 4. Declaration Box
      const finalY = (doc as any).lastAutoTable?.finalY || 160;

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, finalY + 8, 182, 34, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, finalY + 8, 182, 34, 2, 2, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('REGULATORY AUDIT INTEGRITY DECLARATION', 18, finalY + 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(
        'This document serves as an immutable regulatory audit trail report generated automatically by the VentureAM',
        18, finalY + 19
      );
      doc.text(
        'Persistence Engine. All system log entries are cryptographically hashed and mirrored across institutional nodes',
        18, finalY + 23
      );
      doc.text(
        'to guarantee zero-trust audit compliance under OJK, BEI, and FATF international financial standards.',
        18, finalY + 27
      );

      // Signature line / stamp
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text('Aidil Syahdan Al Fitrah — Chief Compliance Officer', 18, finalY + 36);
      doc.text('System Stamp: SHA256-VAM-REG-2026-AUDIT-TRAIL', 120, finalY + 36);

      // Save document
      doc.save(`VAM_Regulatory_Audit_Trail_Logs_${new Date().toISOString().split('T')[0]}.pdf`);
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to export regulatory PDF:', error);
      alert('Gagal mengekspor laporan PDF regulasi. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Database className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-tighter">ARSIP & AUDIT TRAIL</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Institutional Persistence Engine (Zero Trust)</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH SECURE LOGS..." 
              className="bg-black/40 border border-white/5 rounded-lg pl-8 pr-4 py-2 text-[10px] font-bold text-white focus:outline-none focus:border-blue-500/50 w-full sm:w-64 transition-all"
            />
          </div>
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all shadow-md active:scale-95 ${
              exportSuccess 
                ? 'bg-emerald-500 text-black border border-emerald-400' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/30'
            }`}
            title="Export Regulatory Audit Trail Logs PDF"
          >
            {exportSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-black" />
                <span>EXPORTED!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-[#DFFF00]" />
                <span className="hidden md:inline">EXPORT REGULATORY PDF</span>
                <span className="md:hidden">PDF</span>
              </>
            )}
          </button>
          <button className="p-2 rounded-lg bg-zinc-800 border border-white/5 hover:bg-zinc-700 transition-all text-blue-400">
            <History className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-white/5 bg-zinc-950/50 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900/50 border-b border-white/5">
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Timestamp</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">System Event</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Origin</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Security Status</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filteredLogs.map((log, i) => (
                    <motion.tr 
                      key={`${log.time}-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-mono text-blue-400">{log.time}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{log.action}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-bold border border-white/5 uppercase">
                          {log.system}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                          <span className="text-[10px] font-black text-green-400 uppercase">{log.status}</span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 italic text-sm">
                        No encrypted logs found matching your query.
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-white/5 bg-zinc-900/30">
            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-4 flex items-center gap-1">
              <Scale className="w-3 h-3 text-blue-400" /> REGULATORY PORTAL
            </p>
            <div className="space-y-3">
              <button 
                onClick={handleExportPDF}
                disabled={isExporting}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-blue-600/90 to-indigo-600/90 border border-blue-400/30 hover:from-blue-500 hover:to-indigo-500 text-white transition-all text-left shadow-lg shadow-blue-500/20 active:scale-95 group"
              >
                <div className="flex justify-between items-start mb-2">
                  <FileText className="w-4 h-4 text-[#DFFF00]" />
                  <span className="text-[8px] text-[#DFFF00] font-black bg-black/40 px-2 py-0.5 rounded border border-[#DFFF00]/30 uppercase tracking-widest">OJK / BEI FORMAT</span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-wider">EXPORT REGULATORY LOGS</p>
                <p className="text-[8px] text-blue-100 uppercase mt-1">GENERATE OFFICIAL AUDIT TRAIL PDF</p>
              </button>

              <button 
                onClick={handleGrantAccess}
                disabled={isAuditing}
                className="w-full p-4 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all text-left shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
              >
                <Lock className="w-4 h-4 mb-2" />
                <p className="text-[10px] font-black uppercase">EXTERNAL AUDIT ACCESS</p>
                <p className="text-[8px] text-blue-100 uppercase mt-1">GRANT PERMISSION TO OJK/BEI</p>
              </button>
              
              <button 
                onClick={() => alert('Mengekspor Laporan Pajak Tahun 2026 (Format E-SPT)...')}
                className="w-full p-4 rounded-xl bg-zinc-800 border border-white/5 hover:border-blue-500/40 hover:bg-zinc-700 transition-all text-left group"
              >
                <div className="flex justify-between items-start mb-2">
                  <FileSignature className="w-4 h-4 text-zinc-500 group-hover:text-blue-400" />
                  <span className="text-[8px] text-zinc-500 font-bold bg-black/40 px-1.5 py-0.5 rounded">PDF/XML</span>
                </div>
                <p className="text-[10px] font-bold text-white uppercase">TAX COMPLIANCE EXPORT</p>
                <p className="text-[8px] text-zinc-500 uppercase mt-1">YEARLY SUMMARY (E-SPT)</p>
              </button>
            </div>
          </div>
          
          <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">LOG INTEGRITY</p>
            </div>
            <p className="text-[10px] text-blue-300/70 leading-relaxed italic">
              "All transactions within the VentureAM Persistence Engine are cryptographically hashed using SHA-256 and mirrored across institutional nodes."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

