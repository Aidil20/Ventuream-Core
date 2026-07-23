import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Presentation, 
  Download, 
  CheckCircle2, 
  Loader2, 
  Printer, 
  BookOpen, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  FileCheck2,
  ExternalLink
} from 'lucide-react';
import { 
  generatePresentationPDF, 
  generatePresentationPPTX, 
  generateUserManualPDF, 
  generateUserManualPPTX 
} from '../services/documentExportService';

interface DocumentExportCenterProps {
  onClose?: () => void;
}

export const DocumentExportCenter: React.FC<DocumentExportCenterProps> = ({ onClose }) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleExport = async (actionKey: string, exportFn: () => Promise<void>, docTitle: string) => {
    setLoadingAction(actionKey);
    setSuccessMsg(null);
    try {
      await exportFn();
      setSuccessMsg(`Berhasil mengunduh: ${docTitle}`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error(err);
      alert(`Gagal membuat dokumen: ${err.message || err}`);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-6 md:p-8 rounded-[2rem] border border-zinc-800 relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#DFFF00]/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-[#DFFF00]/10 rounded-2xl border border-[#DFFF00]/20 shadow-[0_0_20px_rgba(223,255,0,0.15)] mt-1">
              <Presentation className="w-7 h-7 text-[#DFFF00]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#DFFF00]/20 text-[#DFFF00] text-[9px] font-black uppercase tracking-widest border border-[#DFFF00]/30">
                  INSTITUTIONAL EXPORT CENTER
                </span>
                <span className="text-zinc-500 text-[10px] font-mono">v3.2.0</span>
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter mt-1">
                Pusat Cetak Dokumen & Presentasi
              </h2>
              <p className="text-xs text-zinc-400 max-w-xl font-medium mt-1 leading-relaxed">
                Unduh dan cetak berkas presentasi eksekutif aplikasi (PDF & PPTX 16:9) serta Dokumen Manual Pengguna resmi untuk keperluan pendokumentasian institusi.
              </p>
            </div>
          </div>

          {onClose && (
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl border border-zinc-700 transition-all self-start md:self-auto"
            >
              Tutup
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-emerald-400 text-xs font-bold shadow-lg"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
            <span className="text-[10px] uppercase font-mono tracking-wider bg-emerald-500/20 px-2 py-0.5 rounded-md">READY</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid of Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CARD 1: PRESENTASI APLIKASI */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-[2rem] p-6 flex flex-col justify-between space-y-6 hover:border-[#DFFF00]/30 transition-all group backdrop-blur-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#DFFF00]/10 rounded-xl border border-[#DFFF00]/20 group-hover:scale-105 transition-transform">
                <Presentation className="w-6 h-6 text-[#DFFF00]" />
              </div>
              <span className="px-3 py-1 bg-zinc-800 rounded-full text-[9px] font-black text-zinc-300 uppercase tracking-widest border border-zinc-700">
                PITCH DECK & EXECUTIVE SUMMARY
              </span>
            </div>

            <h3 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-[#DFFF00] transition-colors">
              1. Dokumen Presentasi Aplikasi
            </h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Slide deck komprehensif mencakup ringkasan eksekutif, arsitektur modul (Market Intelligence, Gateway IBKR/CGS, AI Fundamental Audit, Rebalance Engine), serta standar keamanan OJK & IDX.
            </p>

            <div className="mt-4 p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50 space-y-1.5 text-[11px] text-zinc-400">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-3.5 h-3.5 text-[#DFFF00]" />
                <span>Format Ringkas 16:9 Widescreen & Multi-page PDF</span>
              </div>
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-3.5 h-3.5 text-[#DFFF00]" />
                <span>Tabel Spesifikasi Teknis & Roadmap Terintegrasi</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleExport('pres_pdf', generatePresentationPDF, 'Presentasi Aplikasi (PDF)')}
                disabled={loadingAction !== null}
                className="py-3 px-4 bg-zinc-800 hover:bg-[#DFFF00] hover:text-black text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 border border-zinc-700 active:scale-95 shadow-md"
              >
                {loadingAction === 'pres_pdf' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#DFFF00] group-hover:text-black" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span>Cetak PDF</span>
              </button>

              <button
                onClick={() => handleExport('pres_pptx', generatePresentationPPTX, 'Presentasi Aplikasi (PPTX)')}
                disabled={loadingAction !== null}
                className="py-3 px-4 bg-[#DFFF00] hover:bg-white text-black text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 shadow-lg shadow-[#DFFF00]/10"
              >
                {loadingAction === 'pres_pptx' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Presentation className="w-4 h-4" />
                )}
                <span>Cetak PPTX</span>
              </button>
            </div>
          </div>
        </div>

        {/* CARD 2: DOKUMEN MANUAL USER */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-[2rem] p-6 flex flex-col justify-between space-y-6 hover:border-[#DFFF00]/30 transition-all group backdrop-blur-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 group-hover:scale-105 transition-transform">
                <BookOpen className="w-6 h-6 text-blue-400" />
              </div>
              <span className="px-3 py-1 bg-zinc-800 rounded-full text-[9px] font-black text-zinc-300 uppercase tracking-widest border border-zinc-700">
                USER OPERATING GUIDE
              </span>
            </div>

            <h3 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">
              2. Dokumen Manual Pengguna (User Guide)
            </h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Panduan petunjuk operasional langkah-demi-langkah bagi pengguna publik maupun institusi. Membahas cara navigasi dashboard, pemindaian sinyal VAM Scanner, eksekusi rebalance, hingga pencetakan laporan.
            </p>

            <div className="mt-4 p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50 space-y-1.5 text-[11px] text-zinc-400">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Pembagian Bab Rinci (Bab 1 s/d Bab 5 Bahasa Indonesia)</span>
              </div>
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Termasuk PowerPoint Deck Onboarding Karyawan / Investor</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleExport('man_pdf', generateUserManualPDF, 'Dokumen Manual User (PDF)')}
                disabled={loadingAction !== null}
                className="py-3 px-4 bg-zinc-800 hover:bg-blue-500 hover:text-white text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 border border-zinc-700 active:scale-95 shadow-md"
              >
                {loadingAction === 'man_pdf' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span>Cetak PDF</span>
              </button>

              <button
                onClick={() => handleExport('man_pptx', generateUserManualPPTX, 'Dokumen Manual User (PPTX)')}
                disabled={loadingAction !== null}
                className="py-3 px-4 bg-blue-500 hover:bg-blue-400 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 shadow-lg shadow-blue-500/10"
              >
                {loadingAction === 'man_pptx' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Presentation className="w-4 h-4" />
                )}
                <span>Cetak PPTX</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Additional Informational Banner */}
      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-[#DFFF00] shrink-0" />
          <p className="text-xs text-zinc-400">
            <span className="font-bold text-white uppercase tracking-wider">Keamanan & Hak Cipta Dokumen: </span>
            Semua dokumen yang dicetak secara otomatis disematkan watermark sistem institusional VentureAM dan terenkripsi.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DocumentExportCenter;
