import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  FileSpreadsheet, 
  Download, 
  Printer, 
  ExternalLink, 
  X, 
  Search, 
  Copy, 
  Check, 
  Layers, 
  Eye,
  FileCheck2,
  Table as TableIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { GeneratedReport } from '../services/reportNotificationService';

interface ReportFileViewerModalProps {
  report: GeneratedReport | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportFileViewerModal: React.FC<ReportFileViewerModalProps> = ({
  report,
  isOpen,
  onClose
}) => {
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Extract sheet names from workbook if available (unconditionally memoized)
  const sheetNames = useMemo(() => {
    if (report?.workbook && report.workbook.SheetNames.length > 0) {
      return report.workbook.SheetNames;
    }
    return ['Data Sheet'];
  }, [report?.workbook]);

  // Extract table rows for current sheet (unconditionally memoized)
  const currentSheetData = useMemo(() => {
    if (!report) return [];
    if (report.workbook && report.workbook.SheetNames.length > 0) {
      const sheetName = sheetNames[activeSheetIndex] || sheetNames[0];
      const worksheet = report.workbook.Sheets[sheetName];
      if (worksheet) {
        return XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as (string | number)[][];
      }
    }
    if (report.sheetData && report.sheetData.length > 0) {
      return report.sheetData;
    }
    return [];
  }, [report, activeSheetIndex, sheetNames]);

  // Filter rows based on search query (unconditionally memoized)
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return currentSheetData;
    const q = searchQuery.toLowerCase();
    return currentSheetData.filter((row) => 
      row.some((cell) => String(cell ?? '').toLowerCase().includes(q))
    );
  }, [currentSheetData, searchQuery]);

  const isPdf = report?.fileType === 'pdf';
  const isExcel = report?.fileType === 'excel';
  const isCsv = report?.fileType === 'csv';

  const handleDownloadAgain = () => {
    if (report?.url) {
      const link = document.createElement('a');
      link.href = report.url;
      link.download = report.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenInNewTab = () => {
    if (report?.url) {
      window.open(report.url, '_blank');
    }
  };

  const handlePrint = () => {
    if (isPdf && report?.url) {
      const printWindow = window.open(report.url, '_blank');
      if (printWindow) {
        printWindow.focus();
        printWindow.print();
      }
    } else {
      window.print();
    }
  };

  const handleCopyTable = () => {
    if (currentSheetData.length === 0) return;
    const tsvContent = currentSheetData
      .map((row) => row.map((c) => String(c ?? '').replace(/\t/g, ' ')).join('\t'))
      .join('\n');
    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <AnimatePresence>
      {isOpen && report && (
        <div 
          id="report-file-viewer-backdrop"
          className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            id="report-file-viewer-modal"
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative"
          >
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-b border-zinc-800/90 bg-zinc-900/60 backdrop-blur-lg">
            {/* Title & Metadata */}
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2.5 rounded-2xl border flex items-center justify-center ${
                isPdf 
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                  : isExcel 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}>
                {isPdf ? (
                  <FileText className="w-6 h-6" />
                ) : isExcel ? (
                  <FileSpreadsheet className="w-6 h-6" />
                ) : (
                  <TableIcon className="w-6 h-6" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase font-mono tracking-wider border ${
                    isPdf 
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                      : isExcel 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {report.fileType.toUpperCase()} DOCUMENT
                  </span>
                  
                  {report.formattedSize && (
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 text-[9px] font-mono border border-zinc-700">
                      {report.formattedSize}
                    </span>
                  )}

                  <span className="text-[10px] text-zinc-500 font-mono">
                    {report.timestamp}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-white truncate max-w-lg mt-0.5" title={report.fileName}>
                  {report.title || report.fileName}
                </h3>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              {report.url && (
                <button
                  onClick={handleOpenInNewTab}
                  title="Buka di Tab Baru"
                  className="p-2 sm:px-3 sm:py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Tab Baru</span>
                </button>
              )}

              <button
                onClick={handlePrint}
                title="Cetak Berkas"
                className="p-2 sm:px-3 sm:py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Cetak</span>
              </button>

              <button
                onClick={handleDownloadAgain}
                title="Unduh Ulang"
                className="p-2 sm:px-3 sm:py-2 bg-[#DFFF00] hover:bg-[#cbf000] text-black rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-[#DFFF00]/10 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Unduh Ulang</span>
              </button>

              <button
                onClick={onClose}
                title="Tutup Pratinjau (Esc)"
                className="p-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all ml-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Viewer */}
          <div className="flex-1 min-h-[50vh] max-h-[76vh] overflow-y-auto bg-zinc-950 p-4 sm:p-5 flex flex-col">
            {/* IF PDF VIEWER */}
            {isPdf && report.url ? (
              <div className="flex-1 flex flex-col h-full min-h-[62vh] rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/40 relative">
                <iframe
                  src={`${report.url}#view=FitH`}
                  className="w-full h-full min-h-[65vh] rounded-2xl bg-zinc-900 border-none"
                  title={report.fileName}
                />
              </div>
            ) : null}

            {/* IF EXCEL OR CSV SPREADSHEET VIEWER */}
            {(isExcel || isCsv) && (
              <div className="flex-1 flex flex-col space-y-4">
                {/* Control bar: Sheets tabs & Live Search */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800">
                  {/* Sheet tabs if multiple */}
                  {sheetNames.length > 1 ? (
                    <div className="flex items-center gap-1.5 overflow-x-auto max-w-md pb-1 sm:pb-0">
                      <span className="text-[10px] text-zinc-500 font-mono uppercase font-bold mr-1 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-zinc-400" />
                        Sheets:
                      </span>
                      {sheetNames.map((name, idx) => (
                        <button
                          key={name}
                          onClick={() => setActiveSheetIndex(idx)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition-all whitespace-nowrap cursor-pointer ${
                            activeSheetIndex === idx
                              ? 'bg-emerald-500 text-black shadow-md'
                              : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-mono text-zinc-300 font-bold">
                        {sheetNames[0] || 'Spreadsheet View'}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        ({filteredRows.length} baris)
                      </span>
                    </div>
                  )}

                  {/* Search and Copy Actions */}
                  <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari sel / kolom..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <button
                      onClick={handleCopyTable}
                      title="Salin semua baris ke Clipboard"
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-zinc-700 cursor-pointer whitespace-nowrap"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="text-[11px] font-mono">{copied ? 'Tersalin!' : 'Salin Tabel'}</span>
                    </button>
                  </div>
                </div>

                {/* Table Data View */}
                {filteredRows.length > 0 ? (
                  <div className="flex-1 overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/30 max-h-[58vh]">
                    <table className="w-full text-left border-collapse font-mono text-xs">
                      <thead className="bg-zinc-900/90 sticky top-0 z-10 border-b border-zinc-800 backdrop-blur-md">
                        <tr>
                          <th className="p-3 text-[10px] font-black text-zinc-500 uppercase tracking-wider w-12 text-center border-r border-zinc-800/80">
                            #
                          </th>
                          {filteredRows[0]?.map((headCell, colIdx) => (
                            <th
                              key={colIdx}
                              className="p-3 text-[11px] font-black text-[#DFFF00] uppercase tracking-wider border-r border-zinc-800/80 last:border-r-0 whitespace-nowrap"
                            >
                              {String(headCell ?? `Col ${colIdx + 1}`)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {filteredRows.slice(1).map((row, rowIdx) => (
                          <tr 
                            key={rowIdx} 
                            className="hover:bg-zinc-800/40 transition-colors group"
                          >
                            <td className="p-2.5 text-[10px] text-zinc-500 font-mono text-center border-r border-zinc-800/60 group-hover:text-zinc-300">
                              {rowIdx + 1}
                            </td>
                            {row.map((cell, colIdx) => {
                              const cellStr = String(cell ?? '');
                              const isPositive = cellStr.startsWith('+') || (cellStr.includes('%') && !cellStr.startsWith('-'));
                              const isNegative = cellStr.startsWith('-') || cellStr.includes('Loss');
                              const isPrice = cellStr.startsWith('Rp') || cellStr.startsWith('$') || cellStr.includes('IDR');

                              return (
                                <td
                                  key={colIdx}
                                  className={`p-2.5 text-xs border-r border-zinc-800/60 last:border-r-0 whitespace-nowrap font-medium ${
                                    isPositive
                                      ? 'text-emerald-400'
                                      : isNegative
                                      ? 'text-rose-400'
                                      : isPrice
                                      ? 'text-white font-bold'
                                      : 'text-zinc-300'
                                  }`}
                                >
                                  {cellStr || '-'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900/30 rounded-2xl border border-zinc-800/80 space-y-2">
                    <TableIcon className="w-10 h-10 text-zinc-600" />
                    <p className="text-sm font-bold text-zinc-300">Tidak ada baris yang cocok</p>
                    <p className="text-xs text-zinc-500">Coba ubah kata kunci pencarian Anda.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-3.5 sm:p-4 border-t border-zinc-800/80 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>VentureAM Secure Document Streamer</span>
            </div>
            <div className="text-zinc-500">
              Dokumen resmi terverifikasi dan terunduh ke penyimpanan lokal Anda.
            </div>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};

export default ReportFileViewerModal;
