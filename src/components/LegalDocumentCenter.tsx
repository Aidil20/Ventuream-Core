import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  ShieldCheck, 
  PenTool, 
  Printer, 
  Clock, 
  Plus, 
  Loader2,
  QrCode,
  Layers,
  Sparkles,
  CheckCircle2,
  Building2,
  Lock,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import DocumentExportCenter from './DocumentExportCenter';
import PhysicalDocQrGenerator from './PhysicalDocQrGenerator';
import { 
  embedOfficialQrValidationStamp,
  embedOfficialSignaturesAndQrBlock,
  OFFICIAL_DIVISIONS
} from '../services/officialDocValidationService';
import { saveAndNotifyPdf } from '../services/reportNotificationService';

interface LegalDocItem {
  id: string;
  title: string;
  status: 'READY' | 'PENDING' | 'DRAFT';
  type: 'Legal' | 'Operational' | 'Regulatory';
  date: string;
  divisionKey: 'DIVISI_KEPATUHAN_RISIKO' | 'DIREKSI_EKSEKUTIF' | 'DIVISI_KEUANGAN_AUDIT';
  description: string;
}

interface LegalDocumentCenterProps {
  onOpenVerifier?: (docNumber: string, divisionCode?: string, hash?: string) => void;
  defaultSubTab?: 'qr-generator' | 'export-center' | 'legal-hub';
}

export default function LegalDocumentCenter({ onOpenVerifier, defaultSubTab = 'qr-generator' }: LegalDocumentCenterProps) {
  const [activeSubTab, setActiveSubTab] = useState<'qr-generator' | 'export-center' | 'legal-hub'>(defaultSubTab);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);

  const [docs, setDocs] = useState<LegalDocItem[]>([
    { 
      id: 'VAM/KMR/2026/SOA-001', 
      title: 'Surat Kuasa Khusus & Penunjukkan Pengelolaan Dana (SoA)', 
      status: 'READY', 
      type: 'Legal', 
      date: '2026-08-21',
      divisionKey: 'DIREKSI_EKSEKUTIF',
      description: 'Dokumen otorisasi penunjukkan portfolio manager dan mandate eksekusi trading institusi.'
    },
    { 
      id: 'VAM/KMR/2026/SPK-002', 
      title: 'Surat Perjanjian Kerjasama (SPK) Manajemen Investasi', 
      status: 'READY', 
      type: 'Operational', 
      date: '2026-08-20',
      divisionKey: 'DIVISI_KEPATUHAN_RISIKO',
      description: 'Perjanjian bilateral kontrak pengelolaan dana dengan klausul kepatuhan OJK & pasar modal.'
    },
    { 
      id: 'VAM/KMR/2026/NDA-003', 
      title: 'Non-Disclosure Agreement & Proteksi Kerahasiaan Data (NDA)', 
      status: 'READY', 
      type: 'Regulatory', 
      date: '2026-08-19',
      divisionKey: 'DIVISI_KEPATUHAN_RISIKO',
      description: 'Perjanjian kerahasiaan institusi dan enkripsi aset data algoritma VAM.'
    },
    { 
      id: 'VAM/KAA/2026/BA-004', 
      title: 'Berita Acara Rekonsiliasi & Serah Terima Aset Portofolio', 
      status: 'READY', 
      type: 'Operational', 
      date: '2026-08-18',
      divisionKey: 'DIVISI_KEUANGAN_AUDIT',
      description: 'Dokumen berita acara fisik serah terima settlement transaksi dan kustodian.'
    }
  ]);

  const handleRequest = () => {
    setIsRequesting(true);
    setTimeout(() => {
      const newDoc: LegalDocItem = {
        id: `VAM/KMR/2026/REQ-00${docs.length + 1}`,
        title: `Permohonan Kontrak Hukum Baru #${docs.length + 1}`,
        status: 'READY',
        type: 'Legal',
        date: new Date().toISOString().split('T')[0],
        divisionKey: 'DIVISI_KEPATUHAN_RISIKO',
        description: 'Permintaan draft kontrak hukum baru dengan validasi kriptografis SHA-256.'
      };
      setDocs([newDoc, ...docs]);
      setIsRequesting(false);
    }, 1000);
  };

  // Generate real PDF for Legal Agreement Documents with QR Validation embedded
  const handleDownloadLegalPdf = async (docItem: LegalDocItem) => {
    setIsGeneratingPdf(docItem.id);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const div = OFFICIAL_DIVISIONS[docItem.divisionKey];

      // Header Banner
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pw, 24, 'F');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(223, 255, 0);
      doc.text('PT VENTURE ASSET MANAGEMENT — LEGAL & COMPLIANCE CENTER', 14, 10);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(203, 213, 225);
      doc.text(`Standar Tata Kelola Hukum OJK & IDX | No. Registrasi Dokumen: ${docItem.id}`, 14, 16);
      doc.text(`Status Keaslian: Terverifikasi Digital Tamper-Evident SHA-256`, 14, 20);

      let curY = 36;

      // Title
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(docItem.title.toUpperCase(), pw / 2, curY, { align: 'center' });

      curY += 6;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(180, 83, 9);
      doc.text(`NOMOR: ${docItem.id}`, pw / 2, curY, { align: 'center' });

      curY += 6;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.line(14, curY, pw - 14, curY);

      // Section 1: Parties & Metadata
      curY += 8;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, curY, pw - 28, 38, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, curY, pw - 28, 38, 2, 2, 'S');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text('INFORMASI OTORITAS & KLASIFIKASI DOKUMEN', 18, curY + 6);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`• Divisi Penerbit: [${div.code}] ${div.name}`, 18, curY + 12);
      doc.text(`• Tanggal Pengesahan: ${docItem.date}  |  Masa Berlaku: 12 Bulan / Sesuai Mandat`, 18, curY + 17);
      doc.text(`• Klasifikasi: ${docItem.type.toUpperCase()} DOCUMENT (INSTITUTIONAL GRADE)`, 18, curY + 22);
      doc.text(`• Otoritas Pengesahan: ${div.signatoryOfficer} (${div.signatoryTitle})`, 18, curY + 27);
      doc.text(`• Gateway Status: CONNECTED (IBKR / CGS INTERNATIONAL GATEWAY)`, 18, curY + 32);

      // Section 2: Articles / Contract Clauses
      curY += 46;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('PASAL 1: KETENTUAN UMUM & DASAR HUKUM', 14, curY);

      curY += 5;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      const clause1 = "1. Dokumen ini merupakan instrumen resmi yang diterbitkan oleh PT Venture Asset Management dalam rangka pelaksanaan tata kelola operasional dan mandat investasi sesuai regulasi OJK dan perundang-undangan Republik Indonesia.\n2. Para pihak menyepakati bahwa seluruh data yang tercantum dalam dokumen ini memiliki kekuatan hukum yang mengikat dan dilindungi oleh stempel validasi kriptografis SHA-256.";
      const splitClause1 = doc.splitTextToSize(clause1, pw - 28);
      doc.text(splitClause1, 14, curY);

      curY += splitClause1.length * 4.5 + 4;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('PASAL 2: KEAMANAN DATA & VALIDASI QR CODE ELEKTRONIK', 14, curY);

      curY += 5;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      const clause2 = "1. Keaslian dokumen fisik maupun digital ini dapat dibuktikan secara langsung dengan memindai Kode QR resmi yang tertera pada lembar otorisasi di bawah ini.\n2. Setiap perubahan tanpa izin pada naskah ini akan membatalkan sertifikasi keabsahan secara otomatis pada database sistem verifikasi VentureAM.";
      const splitClause2 = doc.splitTextToSize(clause2, pw - 28);
      doc.text(splitClause2, 14, curY);

      // Concluding Official Signature & QR Block
      curY += splitClause2.length * 4.5 + 8;
      await embedOfficialSignaturesAndQrBlock({
        doc,
        divisionKey: docItem.divisionKey,
        documentTitle: docItem.title,
        docNumber: docItem.id,
        startY: curY,
        theme: 'light'
      });

      // Footer
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Legal Document Automation VentureAM — Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, ph - 6);

      const fileName = `${docItem.id.replace(/[\/\\]/g, '_')}_Official.pdf`;
      saveAndNotifyPdf(doc, fileName, docItem.title);
    } catch (e: any) {
      console.error('Error generating legal PDF', e);
      alert(`Gagal membuat PDF: ${e.message || e}`);
    } finally {
      setIsGeneratingPdf(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-6 md:p-8 rounded-[2rem] border border-zinc-800 relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#DFFF00]/10 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-[#DFFF00]/10 rounded-2xl border border-[#DFFF00]/20 shadow-[0_0_20px_rgba(223,255,0,0.15)] mt-1">
              <ShieldCheck className="w-7 h-7 text-[#DFFF00]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#DFFF00]/20 text-[#DFFF00] text-[9px] font-black uppercase tracking-widest border border-[#DFFF00]/30">
                  LEGAL & REGULATORY DOCUMENT CENTER
                </span>
                <span className="text-zinc-500 text-[10px] font-mono">v3.4.0</span>
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter mt-1">
                Pusat Dokumen Hukum & Generator QR Fisik
              </h2>
              <p className="text-xs text-zinc-400 max-w-2xl font-medium mt-1 leading-relaxed">
                Platform penerbitan dokumen hukum resmi, pencetakan stempel QR validasi untuk berkas fisik / hardcopy, serta unduhan berkas presentasi eksekutif & arsitektur sistem.
              </p>
            </div>
          </div>

          {/* Sub-Tab Switcher Pills */}
          <div className="flex flex-wrap items-center gap-2 bg-black/60 p-1.5 rounded-2xl border border-zinc-800 self-start lg:self-auto">
            <button
              onClick={() => setActiveSubTab('qr-generator')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'qr-generator'
                  ? 'bg-[#DFFF00] text-black shadow-lg shadow-[#DFFF00]/15 scale-102'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QR Dokumen Fisik</span>
            </button>

            <button
              onClick={() => setActiveSubTab('export-center')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'export-center'
                  ? 'bg-[#DFFF00] text-black shadow-lg shadow-[#DFFF00]/15 scale-102'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Pusat Cetak & Presentasi</span>
            </button>

            <button
              onClick={() => setActiveSubTab('legal-hub')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'legal-hub'
                  ? 'bg-[#DFFF00] text-black shadow-lg shadow-[#DFFF00]/15 scale-102'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span>Kontrak & SoA/SPK</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <AnimatePresence mode="wait">
        {activeSubTab === 'qr-generator' && (
          <motion.div
            key="qr-gen"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <PhysicalDocQrGenerator onOpenVerifier={onOpenVerifier} />
          </motion.div>
        )}

        {activeSubTab === 'export-center' && (
          <motion.div
            key="export-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <DocumentExportCenter />
          </motion.div>
        )}

        {activeSubTab === 'legal-hub' && (
          <motion.div
            key="legal-hub"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-[2rem] p-6 space-y-6 backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-[#DFFF00]" /> Otomatisasi Dokumen Hukum & Kontrak Digital
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Kelola dan cetak instrumen hukum resmi perseroan (SoA, SPK, NDA) berstempel validasi OJK & IDX.
                  </p>
                </div>

                <button 
                  onClick={handleRequest}
                  disabled={isRequesting}
                  className="bg-[#DFFF00] text-black px-4 py-2.5 rounded-xl text-xs font-black hover:bg-yellow-300 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-[#DFFF00]/10 cursor-pointer self-start sm:self-auto"
                >
                  {isRequesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>REQUEST NEW DOCUMENT</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {docs.map(doc => {
                    const div = OFFICIAL_DIVISIONS[doc.divisionKey];
                    return (
                      <motion.div 
                        key={doc.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 rounded-2xl border border-white/5 bg-zinc-950/70 hover:border-[#DFFF00]/30 transition-all group flex flex-col justify-between space-y-4"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <div className="p-2.5 rounded-xl bg-[#DFFF00]/10 text-[#DFFF00] border border-[#DFFF00]/20 group-hover:scale-105 transition-transform">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] px-2.5 py-1 rounded-full font-black tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                {doc.status}
                              </span>
                              <p className="text-[9px] text-zinc-500 font-mono font-bold mt-1 uppercase">{doc.date}</p>
                            </div>
                          </div>

                          <h4 className="text-sm font-bold text-white mb-1 group-hover:text-[#DFFF00] transition-colors leading-snug">
                            {doc.title}
                          </h4>
                          <p className="text-[11px] text-zinc-400 mb-2 leading-relaxed">
                            {doc.description}
                          </p>

                          <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-500">
                            <span className="text-[#DFFF00] font-bold">{doc.id}</span>
                            <span>•</span>
                            <span className="text-zinc-400">[{div.code}] {div.name.slice(0, 24)}...</span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-zinc-800/80">
                          <button 
                            onClick={() => handleDownloadLegalPdf(doc)}
                            disabled={isGeneratingPdf !== null}
                            className="flex-1 py-2.5 rounded-xl bg-[#DFFF00] text-[11px] font-bold text-black hover:bg-yellow-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                          >
                            {isGeneratingPdf === doc.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            <span>Cetak PDF Resmi</span>
                          </button>

                          <button 
                            onClick={() => {
                              if (onOpenVerifier) {
                                onOpenVerifier(doc.id, div.code);
                              }
                            }}
                            className="px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            title="Validasi Dokumen"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Validasi</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Regulatory Banner */}
              <div className="p-4 rounded-2xl border border-white/5 bg-zinc-950/40 flex items-center gap-4">
                <ShieldCheck className="w-8 h-8 text-[#DFFF00] opacity-70 shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-[#DFFF00] uppercase tracking-widest leading-none mb-1">
                    REGULATORY COMPLIANCE ACTIVE
                  </p>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-tight">
                    Semua dokumen dihasilkan sesuai dengan standar regulasi OJK & IDX (Bilingual Support Ready & Kriptografi SHA-256).
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
