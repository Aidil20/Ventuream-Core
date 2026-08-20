import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  FileSpreadsheet, 
  Eye, 
  Download, 
  X, 
  CheckCircle2, 
  Table as TableIcon,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { GeneratedReport } from '../services/reportNotificationService';

interface ToastItemProps {
  report: GeneratedReport;
  onDismiss: (id: string) => void;
  onView: (report: GeneratedReport) => void;
  durationMs?: number;
}

const ToastItem: React.FC<ToastItemProps> = ({
  report,
  onDismiss,
  onView,
  durationMs = 9000
}) => {
  const [progress, setProgress] = useState<number>(100);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(durationMs);

  const isPdf = report.fileType === 'pdf';
  const isExcel = report.fileType === 'excel';
  const isCsv = report.fileType === 'csv';

  useEffect(() => {
    let interval: any;
    if (!isPaused) {
      const step = 50;
      interval = setInterval(() => {
        remainingTimeRef.current -= step;
        const pct = Math.max(0, (remainingTimeRef.current / durationMs) * 100);
        setProgress(pct);

        if (remainingTimeRef.current <= 0) {
          clearInterval(interval);
          onDismiss(report.id);
        }
      }, step);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPaused, durationMs, onDismiss, report.id]);

  const handleDownloadAgain = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (report.url) {
      const link = document.createElement('a');
      link.href = report.url;
      link.download = report.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="bg-zinc-950/95 backdrop-blur-2xl border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] relative overflow-hidden text-white w-full group pointer-events-auto"
      style={{
        boxShadow: isPdf 
          ? '0 10px 30px -5px rgba(244, 63, 94, 0.15), 0 0 0 1px rgba(244, 63, 94, 0.15)' 
          : isExcel 
          ? '0 10px 30px -5px rgba(16, 185, 129, 0.15), 0 0 0 1px rgba(16, 185, 129, 0.15)' 
          : '0 10px 30px -5px rgba(223, 255, 0, 0.15), 0 0 0 1px rgba(223, 255, 0, 0.15)'
      }}
    >
      {/* Background Accent Glow */}
      <div className={`absolute -right-8 -top-8 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-20 ${
        isPdf ? 'bg-rose-500' : isExcel ? 'bg-emerald-500' : 'bg-[#DFFF00]'
      }`} />

      {/* Main Content Layout */}
      <div className="flex items-start gap-3 relative z-10">
        {/* Document Icon Avatar */}
        <div className={`p-2.5 rounded-xl border flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 ${
          isPdf 
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
            : isExcel 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-[#DFFF00]/10 border-[#DFFF00]/30 text-[#DFFF00]'
        }`}>
          {isPdf ? (
            <FileText className="w-5 h-5" />
          ) : isExcel ? (
            <FileSpreadsheet className="w-5 h-5" />
          ) : (
            <TableIcon className="w-5 h-5" />
          )}
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase font-mono tracking-wider border ${
                isPdf 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                  : isExcel 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-[#DFFF00]/20 text-[#DFFF00] border-[#DFFF00]/40'
              }`}>
                {report.fileType.toUpperCase()} BERHASIL DIUNDUH
              </span>
              
              {report.formattedSize && (
                <span className="text-[9px] text-zinc-400 font-mono">
                  {report.formattedSize}
                </span>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => onDismiss(report.id)}
              className="text-zinc-500 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Tutup Notifikasi"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <h4 className="text-xs font-black text-white truncate leading-tight mt-0.5" title={report.fileName}>
            {report.title || report.fileName}
          </h4>

          <p className="text-[10px] text-zinc-400 font-mono truncate mt-0.5" title={report.fileName}>
            {report.fileName}
          </p>

          {/* Action Buttons: View File and Re-download */}
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-zinc-800/80">
            <button
              onClick={() => onView(report)}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
                isPdf 
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white shadow-rose-500/20' 
                  : isExcel 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-emerald-500/20 font-black' 
                  : 'bg-gradient-to-r from-[#DFFF00] to-emerald-400 hover:from-[#cbf000] hover:to-emerald-300 text-black shadow-[#DFFF00]/20'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View File (Buka Berkas)</span>
            </button>

            {report.url && (
              <button
                onClick={handleDownloadAgain}
                title="Unduh Ulang"
                className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 text-xs flex items-center justify-center transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Auto-Dismiss Animated Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-900 overflow-hidden">
        <div 
          className={`h-full transition-all ease-linear ${
            isPdf ? 'bg-rose-500' : isExcel ? 'bg-emerald-400' : 'bg-[#DFFF00]'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};

interface ReportToastContainerProps {
  reports: GeneratedReport[];
  onDismiss: (id: string) => void;
  onView: (report: GeneratedReport) => void;
}

export const ReportToastContainer: React.FC<ReportToastContainerProps> = ({
  reports,
  onDismiss,
  onView
}) => {
  return (
    <div 
      id="report-toast-container"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm sm:max-w-md w-[calc(100%-2.5rem)] pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {reports.map((report) => (
          <ToastItem
            key={report.id}
            report={report}
            onDismiss={onDismiss}
            onView={onView}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ReportToastContainer;
