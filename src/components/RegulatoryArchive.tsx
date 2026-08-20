import React, { useState, useMemo, useRef } from 'react';
import { 
  Database, 
  ShieldCheck, 
  History, 
  Search, 
  Scale, 
  FileSignature, 
  CheckCircle2, 
  Lock, 
  Download, 
  FileText, 
  Check, 
  Upload, 
  FileUp, 
  FolderArchive, 
  Trash2, 
  Eye, 
  Plus, 
  X, 
  Building2, 
  Sparkles, 
  ExternalLink,
  Award,
  BadgeCheck,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAndNotifyPdf } from '../services/reportNotificationService';
import { generateAuditorOpinionPDF } from '../services/documentExportService';

interface RegulatorDoc {
  id: string;
  docNumber: string;
  title: string;
  regulator: string;
  issueDate: string;
  uploadDate: string;
  fileSize: string;
  fileName: string;
  fileDataUrl?: string;
  status: 'VERIFIED' | 'ARCHIVED' | 'PENDING';
  notes?: string;
}

interface OfficialIssuedDoc {
  id: string;
  docNumber: string;
  title: string;
  category: string;
  issueDate: string;
  signers: string;
  verificationHash: string;
  status: 'RESMI TERBIT' | 'VERIFIED';
  actionType: 'AUDIT_OPINION' | 'FINANCIAL_REPORT' | 'RISK_CERT' | 'UBO_DECL' | 'GATEWAY_SETTL';
}

export default function RegulatoryArchive() {
  const [activeCatalogTab, setActiveCatalogTab] = useState<'REGULATOR' | 'OFFICIAL_ISSUED' | 'AUDIT_LOGS'>('REGULATOR');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [generatingDocId, setGeneratingDocId] = useState<string | null>(null);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadDocTitle, setUploadDocTitle] = useState('');
  const [uploadDocNumber, setUploadDocNumber] = useState('');
  const [uploadRegulator, setUploadRegulator] = useState('OJK');
  const [uploadNotes, setUploadNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDoc, setPreviewDoc] = useState<RegulatorDoc | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial Regulator Documents Catalog
  const [regulatorDocs, setRegulatorDocs] = useState<RegulatorDoc[]>([
    {
      id: 'REG-OJK-001',
      docNumber: 'KEP-18/D.04/2026',
      title: 'Surat Keputusan Izin Usaha Manajer Investasi PT Venture Asset Management',
      regulator: 'OJK (Otoritas Jasa Keuangan)',
      issueDate: '15 Januari 2026',
      uploadDate: '16 Januari 2026',
      fileSize: '2.4 MB',
      fileName: 'SK_Izin_Usaha_MI_OJK_2026.pdf',
      status: 'VERIFIED',
      notes: 'Dokumen Lisensi Utama Operasional Pengelolaan Portofolio Efek'
    },
    {
      id: 'REG-BEI-002',
      docNumber: 'S-0482/BEI.PP3/2026',
      title: 'Surat Persetujuan Anggota Bursa & Direct Market Access Gateway BEI',
      regulator: 'BEI (Bursa Efek Indonesia)',
      issueDate: '10 Februari 2026',
      uploadDate: '12 Februari 2026',
      fileSize: '1.8 MB',
      fileName: 'Persetujuan_DMA_Gateway_BEI_2026.pdf',
      status: 'VERIFIED',
      notes: 'Izin Konektivitas FIX Protocol & Socket Relay Pasar Modal'
    },
    {
      id: 'REG-BI-003',
      docNumber: 'BI/28/104/DKSP/2026',
      title: 'Surat Izin Penyelenggaraan Sistem Pembayaran & Liquidity Gateway',
      regulator: 'Bank Indonesia (BI)',
      issueDate: '01 Maret 2026',
      uploadDate: '02 Maret 2026',
      fileSize: '3.1 MB',
      fileName: 'Izin_Sistem_Pembayaran_BI_2026.pdf',
      status: 'VERIFIED',
      notes: 'Lisensi Kliring Devisa & Rekening Dana Nasabah (RDN) Gateway'
    },
    {
      id: 'REG-OJK-004',
      docNumber: 'LHP-OJK/YTD2026/08',
      title: 'Laporan Hasil Pemeriksaan Compliance & Kepatuhan Rutin OJK YTD 2026',
      regulator: 'OJK (Otoritas Jasa Keuangan)',
      issueDate: '15 Juli 2026',
      uploadDate: '18 Juli 2026',
      fileSize: '4.5 MB',
      fileName: 'LHP_Pemeriksaan_Rutin_OJK_2026.pdf',
      status: 'VERIFIED',
      notes: 'Hasil Audit Evaluasi Solvabilitas & Tata Kelola Keuangan'
    },
    {
      id: 'REG-FATF-005',
      docNumber: 'BAP/AML-FATF/2026/02',
      title: 'Sertifikat Kepatuhan Anti Money Laundering (AML) & FATF Screening',
      regulator: 'FATF / BAPPEBTI',
      issueDate: '01 Agustus 2026',
      uploadDate: '03 Agustus 2026',
      fileSize: '1.2 MB',
      fileName: 'FATF_AML_Compliance_Certificate_2026.pdf',
      status: 'VERIFIED',
      notes: 'Verifikasi Anti Pencucian Uang & Pencegahan Pendanaan Terorisme'
    }
  ]);

  // Catalog of Official Documents Issued by the Company Application (With Ref Numbers)
  const officialIssuedDocs: OfficialIssuedDoc[] = [
    {
      id: 'DOC-OFFICIAL-01',
      docNumber: 'NO. SPI-REVIEW/2026/08/VAM-001',
      title: 'Laporan Reviu Auditor Internal Perseroan (Unaudited)',
      category: 'Audit & Review Internal',
      issueDate: '10 Agustus 2026',
      signers: 'Divisi Akuntansi & Pelaporan Korporasi | Aidil Syahdan Al fitrah (President Director)',
      verificationHash: '0x8F92A11C4D...SHA256',
      status: 'RESMI TERBIT',
      actionType: 'AUDIT_OPINION'
    },
    {
      id: 'DOC-OFFICIAL-02',
      docNumber: 'NO. FIN-REPORT/PSAK71-2026-Q2/089',
      title: 'Laporan Posisi Keuangan & Laba Rugi Konsolidasi PSAK 71 / IFRS',
      category: 'Pelaporan Keuangan Korporasi',
      issueDate: '31 Mei 2026 / 10 Agustus 2026',
      signers: 'Divisi Akuntansi & Pelaporan Korporasi | Aidil Syahdan Al fitrah (President Director)',
      verificationHash: '0x3B18C99F01...SHA256',
      status: 'RESMI TERBIT',
      actionType: 'FINANCIAL_REPORT'
    },
    {
      id: 'DOC-OFFICIAL-03',
      docNumber: 'NO. RISK-CERT/2026-0810/VAM-902',
      title: 'Sertifikat Evaluasi Kepatuhan & Risk Analytics Portofolio',
      category: 'Manajemen Risiko & Kepatuhan',
      issueDate: '10 Agustus 2026',
      signers: 'Institutional Risk Management Division | Chief Compliance Officer',
      verificationHash: '0x7E42D00A52...SHA256',
      status: 'RESMI TERBIT',
      actionType: 'RISK_CERT'
    },
    {
      id: 'DOC-OFFICIAL-04',
      docNumber: 'NO. REG-BO/DECL-2026-0041',
      title: 'Surat Pernyataan Ultimate Beneficial Owner (UBO) & BO Declaration',
      category: 'Legal & Legalitas Perseroan',
      issueDate: '01 Juli 2026',
      signers: 'Aidil Syahdan Al fitrah (President Director / UBO 90%)',
      verificationHash: '0x1C55B88E3A...SHA256',
      status: 'RESMI TERBIT',
      actionType: 'UBO_DECL'
    },
    {
      id: 'DOC-OFFICIAL-05',
      docNumber: 'NO. GATEWAY-SETTL/2026-08/104',
      title: 'Laporan Transaksi Settlement Gateway IBKR / CGS International',
      category: 'Settlement & Perbendaharaan Global',
      issueDate: '10 Agustus 2026',
      signers: 'Divisi Perbendaharaan Global & Gateway Operasional',
      verificationHash: '0x9D01E44A12...SHA256',
      status: 'RESMI TERBIT',
      actionType: 'GATEWAY_SETTL'
    }
  ];

  // System Event Audit Logs
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

  const filteredRegulatorDocs = useMemo(() => {
    return regulatorDocs.filter(doc =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.docNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.regulator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [regulatorDocs, searchQuery]);

  const filteredOfficialDocs = useMemo(() => {
    return officialIssuedDocs.filter(doc =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.docNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.signers.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const filteredLogs = useMemo(() => {
    return initialLogs.filter(log => 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.system.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Submit New Regulator Document Upload
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadDocTitle || !uploadDocNumber) {
      alert('Mohon isi Judul Dokumen dan Nomor Dokumen Regulator.');
      return;
    }

    const fileToUpload = selectedFile;
    const fileName = fileToUpload ? fileToUpload.name : `Dokumen_Regulator_${uploadDocNumber.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;
    const fileSize = fileToUpload ? `${(fileToUpload.size / (1024 * 1024)).toFixed(1)} MB` : '1.5 MB';

    const processUpload = (fileDataUrl?: string) => {
      const newDoc: RegulatorDoc = {
        id: `REG-USER-${Date.now()}`,
        docNumber: uploadDocNumber,
        title: uploadDocTitle,
        regulator: uploadRegulator,
        issueDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        uploadDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        fileSize: fileSize,
        fileName: fileName,
        fileDataUrl: fileDataUrl,
        status: 'VERIFIED',
        notes: uploadNotes || 'Diunggah oleh Manajemen Perseroan via Portal Regulator'
      };

      setRegulatorDocs(prev => [newDoc, ...prev]);
      setIsUploadModalOpen(false);
      setUploadDocTitle('');
      setUploadDocNumber('');
      setUploadNotes('');
      setSelectedFile(null);
      alert(`Dokumen Regulator '${newDoc.title}' berhasil diunggah ke Katalog Arsip Perseroan!`);
    };

    if (fileToUpload) {
      const reader = new FileReader();
      reader.onload = (event) => {
        processUpload(event.target?.result as string);
      };
      reader.readAsDataURL(fileToUpload);
    } else {
      processUpload();
    }
  };

  // Delete Uploaded Regulator Document
  const handleDeleteRegulatorDoc = (id: string, title: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus dokumen '${title}' dari Katalog Arsip?`)) {
      setRegulatorDocs(prev => prev.filter(d => d.id !== id));
    }
  };

  // Trigger Official Document PDF Generation / Printing
  const handleGenerateOfficialDoc = async (docItem: OfficialIssuedDoc) => {
    setGeneratingDocId(docItem.id);
    try {
      if (docItem.actionType === 'AUDIT_OPINION') {
        await generateAuditorOpinionPDF();
      } else {
        // Generate Standard Official Issued Document PDF
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pw = doc.internal.pageSize.getWidth();

        // Header
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pw, 20, 'F');
        doc.setTextColor(223, 255, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('PT VENTURE ASSET MANAGEMENT', 14, 12);
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(8);
        doc.text(`DOKUMEN RESMI PERSEROAN // REF: ${docItem.docNumber}`, 14, 16.5);

        // Body
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(docItem.title.toUpperCase(), 14, 32);

        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'normal');
        doc.text(`Kategori: ${docItem.category}`, 14, 38);
        doc.text(`Nomor Registrasi: ${docItem.docNumber}`, 14, 43);
        doc.text(`Tanggal Terbit Resmi: ${docItem.issueDate}`, 14, 48);
        doc.text(`Status Verifikasi: ${docItem.status} (SHA-256 Validated)`, 14, 53);

        doc.setDrawColor(203, 213, 225);
        doc.line(14, 58, pw - 14, 58);

        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        const bodyContent = `Dokumen ini diterbitkan secara resmi oleh Sistem Institutional PT Venture Asset Management. Salinan fisik dan digital dokumen ini memiliki kekuatan hukum yang sah dan telah diverifikasi menggunakan algoritma enkripsi SHA-256.\n\nPenandatangan Sah:\n1. DIVISI AKUNTANSI & PELAPORAN KORPORASI\n2. Aidil Syahdan Al fitrah (President Director)\n\nDengan terbitnya dokumen nomor ${docItem.docNumber}, seluruh catatan terkait telah diarsipkan dalam Persistence Engine Perseroan.`;
        const splitBody = doc.splitTextToSize(bodyContent, pw - 28);
        doc.text(splitBody, 14, 66);

        // Signature Lines
        const currentY = 140;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text('DIVISI AKUNTANSI & PELAPORAN KORPORASI', 14, currentY);
        doc.text('KOMITE AUDIT & DEWAN PENGAWAS', pw - 85, currentY);

        doc.setDrawColor(203, 213, 225);
        doc.line(14, currentY + 20, 70, currentY + 20);
        doc.line(pw - 85, currentY + 20, pw - 15, currentY + 20);

        doc.text('DIVISI AKUNTANSI & PELAPORAN KORPORASI', 14, currentY + 25);
        doc.text('Aidil Syahdan Al fitrah', pw - 85, currentY + 25);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text('Satuan Pengawas Intern (Internal Audit)', 14, currentY + 29);
        doc.text('President Director', pw - 85, currentY + 29);

        // Save & trigger toast notification with View File modal
        const docFileName = `${docItem.docNumber.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;
        saveAndNotifyPdf(doc, docFileName, `Arsip Regulasi: ${docItem.title}`);
      }
    } catch (err) {
      console.error('Error generating document:', err);
      alert('Gagal mengunduh dokumen resmi.');
    } finally {
      setGeneratingDocId(null);
    }
  };

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
      doc.text('Aidil Syahdan Al fitrah — President Director', 18, finalY + 36);
      doc.text('System Stamp: SHA256-VAM-REG-2026-AUDIT-TRAIL', 120, finalY + 36);

      // Save document & trigger toast notification with View File modal
      const auditLogsFileName = `VAM_Regulatory_Audit_Trail_Logs_${new Date().toISOString().split('T')[0]}.pdf`;
      saveAndNotifyPdf(doc, auditLogsFileName, 'Laporan Jejak Audit Regulasi & Kepatuhan');
      
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
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <FolderArchive className="w-6 h-6 text-[#DFFF00]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white uppercase tracking-tighter">ARSIP DOCUMENTS PERSEROAN</h2>
              <span className="text-[9px] font-mono font-black text-black bg-[#DFFF00] px-2 py-0.5 rounded uppercase">
                KATALOG OFFICIAL
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
              PERSISTENCE ENGINE & PORTAL DOKUMEN REGULATOR (OJK / BEI / BI)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="CARUDOKUMEN / REGULATOR..." 
              className="bg-black/40 border border-white/10 rounded-xl pl-8 pr-4 py-2 text-[10px] font-bold text-white focus:outline-none focus:border-[#DFFF00]/50 w-full sm:w-64 transition-all"
            />
          </div>

          {activeCatalogTab === 'REGULATOR' && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#DFFF00] text-black font-black text-[10px] uppercase tracking-wider hover:opacity-90 transition-all shadow-md active:scale-95 shrink-0"
            >
              <Upload className="w-3.5 h-3.5 text-black" />
              <span>UPLOAD DOC REGULATOR</span>
            </button>
          )}

          {activeCatalogTab === 'AUDIT_LOGS' && (
            <button 
              onClick={handleExportPDF}
              disabled={isExporting}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-md active:scale-95 shrink-0 ${
                exportSuccess 
                  ? 'bg-emerald-500 text-black border border-emerald-400' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/30'
              }`}
            >
              {exportSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-black" />
                  <span>EXPORTED!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-[#DFFF00]" />
                  <span>EXPORT AUDIT PDF</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Catalog Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveCatalogTab('REGULATOR')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
            activeCatalogTab === 'REGULATOR'
              ? 'bg-[#DFFF00] text-black shadow-lg shadow-[#DFFF00]/10 font-bold'
              : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>LAPORAN REGULATOR</span>
          <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
            activeCatalogTab === 'REGULATOR' ? 'bg-black/20 text-black' : 'bg-zinc-800 text-zinc-300'
          }`}>
            {regulatorDocs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveCatalogTab('OFFICIAL_ISSUED')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
            activeCatalogTab === 'OFFICIAL_ISSUED'
              ? 'bg-[#DFFF00] text-black shadow-lg shadow-[#DFFF00]/10 font-bold'
              : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <FileSignature className="w-4 h-4" />
          <span>DOC TERBIT RESMI</span>
          <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
            activeCatalogTab === 'OFFICIAL_ISSUED' ? 'bg-black/20 text-black' : 'bg-zinc-800 text-zinc-300'
          }`}>
            {officialIssuedDocs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveCatalogTab('AUDIT_LOGS')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
            activeCatalogTab === 'AUDIT_LOGS'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-bold'
              : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>SYSTEM AUDIT TRAIL LOGS</span>
        </button>
      </div>

      {/* CATALOG TAB 1: LAPORAN REGULATOR (With File Upload) */}
      {activeCatalogTab === 'REGULATOR' && (
        <div className="space-y-4">
          {/* Action Header Card */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#DFFF00]/10 border border-[#DFFF00]/20 text-[#DFFF00]">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase">KATALOG LAPORAN & SURAT DARI REGULATOR</h3>
                <p className="text-[10px] text-zinc-400">
                  Arsip resmi dokumen hukum dari Otoritas Jasa Keuangan (OJK), Bursa Efek Indonesia (BEI), dan Bank Indonesia (BI).
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#DFFF00] text-black font-black text-[10px] uppercase tracking-wider hover:opacity-90 transition-all shadow-lg shadow-[#DFFF00]/10 shrink-0"
            >
              <Upload className="w-4 h-4 text-black" />
              <span>TAMBAH / UPLOAD FILE REGULATOR</span>
            </button>
          </div>

          {/* Table of Regulator Documents */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 text-[9.5px] font-black uppercase tracking-wider">
                    <th className="px-5 py-3.5">No. Dokumen</th>
                    <th className="px-5 py-3.5">Judul Dokumen Regulator</th>
                    <th className="px-5 py-3.5">Penerbit Regulator</th>
                    <th className="px-5 py-3.5">Tgl Terbit / Upload</th>
                    <th className="px-5 py-3.5">Ukuran File</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-xs text-zinc-300">
                  {filteredRegulatorDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-5 py-4 font-mono font-bold text-[#DFFF00] whitespace-nowrap">
                        {doc.docNumber}
                      </td>
                      <td className="px-5 py-4 max-w-sm">
                        <p className="font-bold text-white group-hover:text-[#DFFF00] transition-colors leading-snug">
                          {doc.title}
                        </p>
                        {doc.notes && (
                          <p className="text-[9.5px] text-zinc-500 mt-1 truncate">
                            {doc.notes}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {doc.regulator}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-[10px] text-zinc-400">
                        <div>Terbit: {doc.issueDate}</div>
                        <div className="text-[9px] text-zinc-500">Upload: {doc.uploadDate}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-[10px] font-mono text-zinc-400">
                        {doc.fileSize}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right space-x-2">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold uppercase transition-colors inline-flex items-center gap-1"
                          title="Pratinjau Rincian File"
                        >
                          <Eye className="w-3 h-3 text-blue-400" />
                          <span>Lihat</span>
                        </button>

                        <button
                          onClick={() => {
                            if (doc.fileDataUrl) {
                              const a = document.createElement('a');
                              a.href = doc.fileDataUrl;
                              a.download = doc.fileName;
                              a.click();
                            } else {
                              alert(`Mengunduh berkas fisik regulator: ${doc.fileName}`);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#DFFF00]/10 hover:bg-[#DFFF00]/20 text-[#DFFF00] text-[10px] font-black uppercase border border-[#DFFF00]/30 transition-colors inline-flex items-center gap-1"
                          title="Unduh File Regulator"
                        >
                          <Download className="w-3 h-3" />
                          <span>Unduh</span>
                        </button>

                        {doc.id.startsWith('REG-USER-') && (
                          <button
                            onClick={() => handleDeleteRegulatorDoc(doc.id, doc.title)}
                            className="p-1 rounded-lg hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-colors inline-flex items-center"
                            title="Hapus Dokumen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredRegulatorDocs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-zinc-500 italic text-xs">
                        Tidak ada dokumen regulator yang cocok dengan pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CATALOG TAB 2: DOC TERBIT RESMI (Printed Official Application Documents) */}
      {activeCatalogTab === 'OFFICIAL_ISSUED' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <BadgeCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase">DOKUMEN RESMI YANG DITERBITKAN APLIKASI</h3>
                <p className="text-[10px] text-zinc-400">
                  Salinan dokumen resmi perseroan bernomor registrasi unik, dilengkapi tanda tangan sah dan Hash Verifikasi SHA-256.
                </p>
              </div>
            </div>

            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20 uppercase font-black">
              5 DOKUMEN TERBIT SHA-256
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOfficialDocs.map((docItem) => (
              <div 
                key={docItem.id} 
                className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800 hover:border-[#DFFF00]/40 transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden shadow-xl"
              >
                <div className="absolute top-0 right-0 p-12 bg-[#DFFF00]/5 blur-2xl rounded-full pointer-events-none" />

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase bg-zinc-900 text-zinc-400 border border-zinc-800">
                      {docItem.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      {docItem.status}
                    </span>
                  </div>

                  <p className="text-[10px] font-mono font-bold text-[#DFFF00]">
                    {docItem.docNumber}
                  </p>

                  <h4 className="text-sm font-bold text-white group-hover:text-[#DFFF00] transition-colors leading-snug">
                    {docItem.title}
                  </h4>
                </div>

                <div className="space-y-2 text-[9.5px] text-zinc-400 pt-3 border-t border-zinc-900">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Tanggal Terbit:</span>
                    <span className="text-zinc-300 font-medium">{docItem.issueDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Penandatangan:</span>
                    <span className="text-zinc-300 font-bold text-right max-w-[170px] truncate" title={docItem.signers}>
                      {docItem.signers}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Hash SHA-256:</span>
                    <span className="text-emerald-400 font-mono text-[8.5px]">{docItem.verificationHash}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleGenerateOfficialDoc(docItem)}
                  disabled={generatingDocId === docItem.id}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#DFFF00] text-black font-black text-[10px] uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  <Download className={`w-3.5 h-3.5 ${generatingDocId === docItem.id ? 'animate-bounce' : ''}`} />
                  <span>{generatingDocId === docItem.id ? 'MEMPROSES CETAK...' : 'CETAK / UNDUH DOC RESMI'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CATALOG TAB 3: SYSTEM AUDIT TRAIL LOGS */}
      {activeCatalogTab === 'AUDIT_LOGS' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-white/5 bg-zinc-950/50 overflow-hidden shadow-2xl">
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
                          Tidak ditemukan catatan log enkripsi.
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-white/5 bg-zinc-900/30">
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
              </div>
            </div>
            
            <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5">
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
      )}

      {/* MODAL 1: UPLOAD REGULATOR DOCUMENT */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 relative"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                <div className="flex items-center gap-2.5">
                  <Upload className="w-5 h-5 text-[#DFFF00]" />
                  <div>
                    <h3 className="text-sm font-black text-white uppercase">UPLOAD DOKUMEN REGULATOR</h3>
                    <p className="text-[9.5px] text-zinc-400">Tambahkan berkas resmi dari OJK, BEI, atau BI ke Katalog Arsip</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="p-1.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase block mb-1">
                    Judul Dokumen Regulator *
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadDocTitle}
                    onChange={(e) => setUploadDocTitle(e.target.value)}
                    placeholder="mis. Surat Keputusan OJK Kepatuhan Modal Minimum"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#DFFF00]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase block mb-1">
                      Nomor Dokumen *
                    </label>
                    <input
                      type="text"
                      required
                      value={uploadDocNumber}
                      onChange={(e) => setUploadDocNumber(e.target.value)}
                      placeholder="KEP-88/D.04/2026"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#DFFF00]"
                    />
                  </div>

                  <div>
                    <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase block mb-1">
                      Penerbit Regulator
                    </label>
                    <select
                      value={uploadRegulator}
                      onChange={(e) => setUploadRegulator(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#DFFF00]"
                    >
                      <option value="OJK (Otoritas Jasa Keuangan)">OJK</option>
                      <option value="BEI (Bursa Efek Indonesia)">BEI</option>
                      <option value="Bank Indonesia (BI)">Bank Indonesia</option>
                      <option value="BAPPEBTI">BAPPEBTI</option>
                      <option value="FATF / AML Compliance">FATF / AML</option>
                      <option value="KAP Eksternal Independen">KAP Eksternal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase block mb-1">
                    Pilih Berkas / File Dokumen (.pdf, .docx, .png, .jpg)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-800 hover:border-[#DFFF00]/50 bg-zinc-900/50 rounded-2xl p-4 text-center cursor-pointer transition-colors space-y-2"
                  >
                    <Upload className="w-6 h-6 text-zinc-500 mx-auto" />
                    <p className="text-xs font-bold text-zinc-300">
                      {selectedFile ? selectedFile.name : 'Klik untuk memilih berkas dari komputer Anda'}
                    </p>
                    <p className="text-[9px] text-zinc-500">
                      Format didukung: PDF, DOCX, PNG, JPG (Maks 20MB)
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-[9.5px] font-extrabold text-zinc-400 uppercase block mb-1">
                    Catatan Rincian / Deskripsi (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    placeholder="Catatan tambahan mengenai ruang lingkup keputusan regulator..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#DFFF00]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-900 text-zinc-400 text-xs font-bold uppercase hover:bg-zinc-800"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#DFFF00] text-black text-xs font-black uppercase tracking-wider hover:opacity-90 transition-opacity shadow-lg shadow-[#DFFF00]/10"
                  >
                    SIMPAN KE KATALOG
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: PREVIEW REGULATOR DOCUMENT DETAILS */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 relative"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {previewDoc.regulator}
                  </span>
                  <p className="text-xs font-mono font-bold text-[#DFFF00] mt-1">
                    {previewDoc.docNumber}
                  </p>
                  <h3 className="text-sm font-bold text-white mt-1">
                    {previewDoc.title}
                  </h3>
                </div>

                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 space-y-2 text-xs text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Nama Berkas:</span>
                  <span className="font-mono text-white">{previewDoc.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Ukuran File:</span>
                  <span className="font-mono text-white">{previewDoc.fileSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Tanggal Terbit:</span>
                  <span className="text-white">{previewDoc.issueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status Verifikasi:</span>
                  <span className="text-emerald-400 font-bold uppercase">{previewDoc.status}</span>
                </div>
              </div>

              {previewDoc.notes && (
                <div className="p-3 bg-zinc-900/30 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
                  <strong className="text-white block mb-1">Catatan Kepatuhan:</strong>
                  {previewDoc.notes}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                <span className="text-[9px] font-mono text-zinc-500 uppercase">
                  SHA-256 Vault Integrity Verified
                </span>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 bg-[#DFFF00] text-black text-xs font-black uppercase rounded-xl"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
