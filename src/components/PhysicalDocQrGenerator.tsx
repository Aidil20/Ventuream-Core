import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  QrCode,
  ShieldCheck,
  Building2,
  FileText,
  Clock,
  Key,
  Copy,
  Check,
  Download,
  Printer,
  Sparkles,
  RefreshCw,
  Eye,
  Tag,
  CheckCircle2,
  FolderArchive,
  ArrowRight,
  FileCheck2
} from 'lucide-react';
import jsPDF from 'jspdf';
import {
  OFFICIAL_DIVISIONS,
  OfficialDivisionKey,
  OfficialDocValidationPayload,
  createOfficialValidationPayload,
  generateOfficialQrCodeDataUrl
} from '../services/officialDocValidationService';
import { saveAndNotifyPdf } from '../services/reportNotificationService';

interface PhysicalDocQrGeneratorProps {
  onOpenVerifier?: (docNumber: string, divisionCode: string, hash: string) => void;
}

interface PhysicalDocRecord {
  id: string;
  docNumber: string;
  divisionKey: OfficialDivisionKey;
  divisionCode: string;
  documentTitle: string;
  classification: string;
  issuedTimestamp: string;
  securityHash: string;
  archiveLocation: string;
  signatoryOfficer: string;
}

const DOCUMENT_TEMPLATES = [
  {
    id: 'spk',
    title: 'Surat Perjanjian Kerjasama (SPK) & Kontrak Investasi',
    division: 'DIVISI_KEPATUHAN_RISIKO' as OfficialDivisionKey,
    classification: 'DOKUMEN RESMI HUKUM (LEGAL CONTRACT)',
    prefix: 'SPK'
  },
  {
    id: 'soa',
    title: 'Surat Kuasa Khusus & Penunjukkan Pengelolaan Dana (SoA)',
    division: 'DIREKSI_EKSEKUTIF' as OfficialDivisionKey,
    classification: 'SURAT KUASA RESMI DIREKSI (POWER OF ATTORNEY)',
    prefix: 'SOA'
  },
  {
    id: 'notaris',
    title: 'Salinan Akta Otentik Notaris & Keputusan RUPS Perseroan',
    division: 'DIVISI_KEPATUHAN_RISIKO' as OfficialDivisionKey,
    classification: 'AKTA OTENTIK PERSEROAN (NOTARIAL DEED)',
    prefix: 'AKTA'
  },
  {
    id: 'lk_fisik',
    title: 'Salinan Fisik Laporan Keuangan Konsolidasian & Catatan SPI',
    division: 'DIVISI_KEUANGAN_AUDIT' as OfficialDivisionKey,
    classification: 'LAPORAN KEUANGAN ASLI (HARDCOPY REPORT)',
    prefix: 'LKF'
  },
  {
    id: 'aset_fisik',
    title: 'Sertifikat Fisik Kepemilikan Saham & Bukti Valuasi Aset',
    division: 'DIVISI_PORTOFOLIO_PASAR_MODAL' as OfficialDivisionKey,
    classification: 'SERTIFIKAT KEPEMILIKAN ASET (ASSET DEED)',
    prefix: 'SKA'
  },
  {
    id: 'spi_reviu',
    title: 'Lembar Verifikasi Kepatuhan & Audit Fisik Satuan Pengawas Intern',
    division: 'SATUAN_PENGAWAS_INTERN' as OfficialDivisionKey,
    classification: 'DOKUMEN AUDIT FISIK (INTERNAL AUDIT REVIEW)',
    prefix: 'AUD'
  },
  {
    id: 'custom',
    title: 'Dokumen Fisik Khusus / Custom Physical Document',
    division: 'DIVISI_TEKNOLOGI_SISTEM' as OfficialDivisionKey,
    classification: 'DOKUMEN INSTITUSIONAL ASLI (VERIFIED ORIGINAL)',
    prefix: 'DOC'
  }
];

export const PhysicalDocQrGenerator: React.FC<PhysicalDocQrGeneratorProps> = ({ onOpenVerifier }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('spk');
  const [selectedDivision, setSelectedDivision] = useState<OfficialDivisionKey>('DIVISI_KEPATUHAN_RISIKO');
  const [documentTitle, setDocumentTitle] = useState<string>('Surat Perjanjian Kerjasama (SPK) & Kontrak Investasi');
  const [docNumber, setDocNumber] = useState<string>(() => {
    const div = OFFICIAL_DIVISIONS['DIVISI_KEPATUHAN_RISIKO'];
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `VAM/${div.code}/${year}/SPK-${rand}`;
  });
  const [classification, setClassification] = useState<string>('DOKUMEN RESMI HUKUM (LEGAL CONTRACT)');
  const [archiveLocation, setArchiveLocation] = useState<string>('Brankas Utama Vault-A (Map Folder #04)');
  const [signatoryOfficer, setSignatoryOfficer] = useState<string>(OFFICIAL_DIVISIONS['DIVISI_KEPATUHAN_RISIKO'].signatoryOfficer);
  const [signatoryTitle, setSignatoryTitle] = useState<string>(OFFICIAL_DIVISIONS['DIVISI_KEPATUHAN_RISIKO'].signatoryTitle);
  const [themeStyle, setThemeStyle] = useState<'dark' | 'gold_bordered' | 'light'>('dark');

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [payload, setPayload] = useState<OfficialDocValidationPayload | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // History of generated physical codes in local state
  const [recentRecords, setRecentRecords] = useState<PhysicalDocRecord[]>(() => {
    try {
      const saved = localStorage.getItem('vam_physical_qr_records');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved physical qr records', e);
    }
    return [
      {
        id: 'rec-1',
        docNumber: 'VAM/KMR/2026/SPK-8421',
        divisionKey: 'DIVISI_KEPATUHAN_RISIKO',
        divisionCode: 'DIV-KMR',
        documentTitle: 'Perjanjian Kerjasama Pengelolaan Dana Institusi (SPK-0821)',
        classification: 'DOKUMEN RESMI HUKUM (LEGAL CONTRACT)',
        issuedTimestamp: '21 Agustus 2026, 14:30 WIB',
        securityHash: 'SHA256-A8B9C0D1E2F38841',
        archiveLocation: 'Brankas Legalitas Map #01',
        signatoryOfficer: 'Tim Kepatuhan OJK & Regulasi Pasar Modal'
      },
      {
        id: 'rec-2',
        docNumber: 'VAM/DIR/2026/SOA-7719',
        divisionKey: 'DIREKSI_EKSEKUTIF',
        divisionCode: 'DIV-DIR',
        documentTitle: 'Surat Kuasa Khusus Direksi Pembukaan Rekening Reksa Dana',
        classification: 'SURAT KUASA RESMI DIREKSI (POWER OF ATTORNEY)',
        issuedTimestamp: '20 Agustus 2026, 10:15 WIB',
        securityHash: 'SHA256-7891AF33B9C10452',
        archiveLocation: 'Vault Direksi Binder #02',
        signatoryOfficer: 'Aidil Syahdan Al fitrah'
      }
    ];
  });

  // Generate unique doc number helper
  const generateUniqueDocNumber = (divKey: OfficialDivisionKey, prefix = 'PHY') => {
    const div = OFFICIAL_DIVISIONS[divKey];
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `VAM/${div.code}/${year}/${prefix}-${rand}`;
  };

  // When template changes, update form
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tmpl = DOCUMENT_TEMPLATES.find(t => t.id === templateId);
    if (tmpl) {
      setSelectedDivision(tmpl.division);
      setDocumentTitle(tmpl.title);
      setClassification(tmpl.classification);
      const div = OFFICIAL_DIVISIONS[tmpl.division];
      if (div) {
        setSignatoryOfficer(div.signatoryOfficer);
        setSignatoryTitle(div.signatoryTitle);
      }
      const newNum = generateUniqueDocNumber(tmpl.division, tmpl.prefix);
      setDocNumber(newNum);
    }
  };

  // When division selector changes
  const handleDivisionChange = (newDivKey: OfficialDivisionKey) => {
    setSelectedDivision(newDivKey);
    const div = OFFICIAL_DIVISIONS[newDivKey];
    if (div) {
      setSignatoryOfficer(div.signatoryOfficer);
      setSignatoryTitle(div.signatoryTitle);
    }
  };

  // Regenerate registration number
  const handleRegenerateNumber = () => {
    const tmpl = DOCUMENT_TEMPLATES.find(t => t.id === selectedTemplate);
    const newNum = generateUniqueDocNumber(selectedDivision, tmpl?.prefix || 'PHY');
    setDocNumber(newNum);
  };

  // Compute live validation payload and QR Code
  useEffect(() => {
    let isMounted = true;
    const generateQr = async () => {
      const validPayload = createOfficialValidationPayload({
        divisionKey: selectedDivision,
        documentTitle: documentTitle || 'Dokumen Fisik Resmi Perseroan',
        docNumber: docNumber,
        classification: classification || 'DOKUMEN RESMI ASLI (INSTITUTIONAL GRADE)',
        customDate: new Date(2026, 7, 21, 14, 30)
      });

      if (signatoryOfficer) validPayload.signatoryOfficer = signatoryOfficer;
      if (signatoryTitle) validPayload.signatoryTitle = signatoryTitle;

      try {
        const dataUrl = await generateOfficialQrCodeDataUrl(validPayload);
        if (isMounted) {
          setPayload(validPayload);
          setQrDataUrl(dataUrl);
        }
      } catch (err) {
        console.error('Error generating QR data URL:', err);
      }
    };

    generateQr();

    return () => {
      isMounted = false;
    };
  }, [selectedDivision, documentTitle, docNumber, classification, signatoryOfficer, signatoryTitle]);

  // Copy Verification Link
  const handleCopyLink = () => {
    if (payload?.verificationUrl) {
      navigator.clipboard.writeText(payload.verificationUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Copy Hash
  const handleCopyHash = () => {
    if (payload?.securityHash) {
      navigator.clipboard.writeText(payload.securityHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  // Save current generated document to record history
  const handleSaveToHistory = () => {
    if (!payload) return;
    const newRecord: PhysicalDocRecord = {
      id: `phy-${Date.now()}`,
      docNumber: payload.docNumber,
      divisionKey: payload.divisionKey,
      divisionCode: payload.divisionCode,
      documentTitle: payload.documentTitle,
      classification: payload.classification,
      issuedTimestamp: payload.issuedTimestamp,
      securityHash: payload.securityHash,
      archiveLocation: archiveLocation || 'Arsip Utama Perseroan',
      signatoryOfficer: payload.signatoryOfficer
    };

    const updated = [newRecord, ...recentRecords.filter(r => r.docNumber !== payload.docNumber)].slice(0, 10);
    setRecentRecords(updated);
    try {
      localStorage.setItem('vam_physical_qr_records', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed saving physical qr records', e);
    }
    setSuccessToast(`Kode Dokumen Fisik ${payload.docNumber} tersimpan ke Riwayat.`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Download High-Res PNG of QR Stamp
  const handleDownloadQrPng = () => {
    if (!qrDataUrl || !payload) return;
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const div = OFFICIAL_DIVISIONS[selectedDivision];

    // Background
    if (themeStyle === 'dark') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 800, 360);
      ctx.strokeStyle = div.accentColorHex;
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, 792, 352);
    } else if (themeStyle === 'gold_bordered') {
      ctx.fillStyle = '#fefce8';
      ctx.fillRect(0, 0, 800, 360);
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 5;
      ctx.strokeRect(4, 4, 792, 352);
    } else {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 800, 360);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.strokeRect(4, 4, 792, 352);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(24, 24, 312, 312);
      ctx.drawImage(img, 32, 32, 296, 296);

      const textX = 360;

      ctx.fillStyle = themeStyle === 'dark' ? div.accentColorHex : '#0f172a';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.fillText('STEMPEL VALIDASI DOKUMEN FISIK RESMI', textX, 55);

      ctx.fillStyle = themeStyle === 'dark' ? '#ffffff' : '#1e293b';
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.fillText(`[${div.code}] ${div.name}`, textX, 90);

      ctx.fillStyle = themeStyle === 'dark' ? '#cbd5e1' : '#334155';
      ctx.font = '16px Arial, sans-serif';
      ctx.fillText(`Dokumen: ${payload.documentTitle.slice(0, 42)}`, textX, 125);

      ctx.fillStyle = themeStyle === 'dark' ? div.accentColorHex : '#0f172a';
      ctx.font = 'bold 17px monospace';
      ctx.fillText(`No. Registrasi: ${payload.docNumber}`, textX, 160);

      ctx.fillStyle = themeStyle === 'dark' ? '#94a3b8' : '#64748b';
      ctx.font = '14px Arial, sans-serif';
      ctx.fillText(`Klasifikasi: ${payload.classification}`, textX, 195);
      ctx.fillText(`Lokasi Fisik: ${archiveLocation || 'Arsip Utama Perseroan'}`, textX, 225);
      ctx.fillText(`Penerbitan: ${payload.issuedTimestamp}`, textX, 255);

      ctx.fillStyle = themeStyle === 'dark' ? '#064e3b' : '#d1fae5';
      ctx.fillRect(textX, 275, 410, 50);
      ctx.fillStyle = themeStyle === 'dark' ? '#34d399' : '#065f46';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`INTEGRITY HASH (TAMPER-EVIDENT):`, textX + 12, 298);
      ctx.fillText(payload.securityHash, textX + 12, 316);

      const link = document.createElement('a');
      link.download = `VentureAM_Stempel_QR_Fisik_${payload.docNumber.replace(/[\/\\]/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      handleSaveToHistory();
    };
    img.src = qrDataUrl;
  };

  // Generate A4 Multi-Sticker Label Sheet
  const handlePrintStickerSheet = async () => {
    if (!payload || !qrDataUrl) return;
    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const div = OFFICIAL_DIVISIONS[selectedDivision];

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pw, 18, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(223, 255, 0);
      doc.text('PT VENTURE ASSET MANAGEMENT — LEMBAR LABEL STEMPEL QR VALIDASI FISIK', 14, 9);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(203, 213, 225);
      doc.text(`Format Cetak Kertas Stiker Label A4 (8 Label/Halaman) | No. Dokumen: ${payload.docNumber} | Hash: ${payload.securityHash}`, 14, 14);

      const cols = 2;
      const rows = 4;
      const labelW = 88;
      const labelH = 62;
      const marginX = 14;
      const marginY = 24;
      const gapX = 6;
      const gapY = 5;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = marginX + c * (labelW + gapX);
          const y = marginY + r * (labelH + gapY);

          doc.setFillColor(250, 250, 250);
          doc.roundedRect(x, y, labelW, labelH, 2, 2, 'F');
          doc.setDrawColor(200, 205, 215);
          doc.setLineWidth(0.3);
          doc.roundedRect(x, y, labelW, labelH, 2, 2, 'S');

          doc.setFillColor(div.accentColorRgb[0], div.accentColorRgb[1], div.accentColorRgb[2]);
          doc.roundedRect(x, y, labelW, 6.5, 2, 2, 'F');
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.setTextColor(0, 0, 0);
          doc.text(`VENTUREAM — STEMPEL RESMI KEABSAHAN DOKUMEN FISIK`, x + 3, y + 4.5);

          const qrSize = 34;
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(x + 3, y + 9, qrSize, qrSize, 1.5, 1.5, 'F');
          doc.setDrawColor(220, 220, 220);
          doc.roundedRect(x + 3, y + 9, qrSize, qrSize, 1.5, 1.5, 'S');
          doc.addImage(qrDataUrl, 'PNG', x + 4, y + 10, qrSize - 2, qrSize - 2);

          const dtX = x + qrSize + 5;
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.setTextColor(15, 23, 42);
          doc.text(`DIVISI: ${div.code}`, dtX, y + 12.5);

          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(5.5);
          doc.setTextColor(30, 41, 59);
          const splitTitle = doc.splitTextToSize(payload.documentTitle, labelW - qrSize - 8);
          doc.text(splitTitle.slice(0, 2), dtX, y + 16.5);

          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(6);
          doc.setTextColor(180, 83, 9);
          doc.text(`No: ${payload.docNumber}`, dtX, y + 24);

          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(5);
          doc.setTextColor(71, 85, 105);
          doc.text(`Lokasi: ${archiveLocation.slice(0, 28)}`, dtX, y + 28);
          doc.text(`Tgl: ${payload.issuedDateStr}`, dtX, y + 31.5);
          doc.text(`Penandatangan: ${payload.signatoryOfficer.slice(0, 25)}`, dtX, y + 35);

          doc.setFillColor(241, 245, 249);
          doc.roundedRect(x + 3, y + 46, labelW - 6, 12.5, 1, 1, 'F');
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(5);
          doc.setTextColor(5, 150, 105);
          doc.text(`TAMPER-EVIDENT DIGEST HASH:`, x + 5, y + 50);
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(5.5);
          doc.setTextColor(15, 23, 42);
          doc.text(payload.securityHash, x + 5, y + 54);
          doc.setFontSize(4.5);
          doc.setTextColor(100, 116, 139);
          doc.text(`Pindai QR dengan kamera smartphone untuk validasi instan`, x + 5, y + 57);
        }
      }

      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Dicetak dari Legal Document Center VentureAM — ${new Date().toLocaleString('id-ID')}`, 14, ph - 6);

      saveAndNotifyPdf(doc, `VentureAM_Label_Stiker_Fisik_${payload.docNumber.replace(/[\/\\]/g, '_')}.pdf`, 'Lembar Stiker QR Dokumen Fisik');
      handleSaveToHistory();
    } catch (e: any) {
      console.error('Failed generating sticker PDF', e);
      alert(`Gagal membuat PDF: ${e.message || e}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Generate Official A4 Certificate of Physical Authenticity
  const handlePrintCertificatePdf = async () => {
    if (!payload || !qrDataUrl) return;
    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const div = OFFICIAL_DIVISIONS[selectedDivision];

      doc.setDrawColor(202, 138, 4);
      doc.setLineWidth(0.8);
      doc.rect(8, 8, pw - 16, ph - 16);
      doc.setDrawColor(234, 179, 8);
      doc.setLineWidth(0.3);
      doc.rect(10, 10, pw - 20, ph - 20);

      doc.setFillColor(15, 23, 42);
      doc.rect(10, 10, pw - 20, 32, 'F');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(223, 255, 0);
      doc.text('PT VENTURE ASSET MANAGEMENT', pw / 2, 20, { align: 'center' });

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(226, 232, 240);
      doc.text('INSTITUTIONAL ASSET MANAGEMENT & LEGAL GOVERNANCE COMPLIANCE', pw / 2, 26, { align: 'center' });
      doc.text('Gedung Bursa Efek Indonesia, Tower II Lt. 17, SCBD Jakarta Selatan | Email: pt.ventuream@gmail.com', pw / 2, 31, { align: 'center' });
      doc.text('Sistem Gateway Internasional: Terhubung Langsung dengan IBKR & CGS International', pw / 2, 36, { align: 'center' });

      let curY = 55;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('SERTIFIKAT PENGESAHAN & OTENTIKASI DOKUMEN FISIK RESMI', pw / 2, curY, { align: 'center' });

      curY += 6;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(180, 83, 9);
      doc.text(`NOMOR REGISTRASI RESMI: ${payload.docNumber}`, pw / 2, curY, { align: 'center' });

      curY += 8;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.line(20, curY, pw - 20, curY);

      curY += 8;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const introText = "Dengan ini diterbitkan Sertifikat Validasi Resmi dan Stempel Kriptografis Keabsahan untuk berkas / dokumen fisik yang terdaftar pada sistem tata kelola perseroan PT Venture Asset Management sebagai berikut:";
      const splitIntro = doc.splitTextToSize(introText, pw - 40);
      doc.text(splitIntro, 20, curY);

      curY += splitIntro.length * 5 + 4;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(20, curY, pw - 40, 68, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(20, curY, pw - 40, 68, 2, 2, 'S');

      const metaX = 26;
      let metaY = curY + 8;
      const metaRows = [
        { label: 'Judul Dokumen Fisik', val: payload.documentTitle },
        { label: 'Divisi Penerbit Resmi', val: `[${div.code}] ${div.name}` },
        { label: 'Klasifikasi Dokumen', val: payload.classification },
        { label: 'Waktu Penerbitan Sistem', val: payload.issuedTimestamp },
        { label: 'Lokasi Penyimpanan Arsip', val: archiveLocation || 'Brankas Utama Vault Perseroan' },
        { label: 'Pejabat Penandatangan', val: `${payload.signatoryOfficer} (${payload.signatoryTitle})` },
        { label: 'Status Gateway Integritas', val: payload.gatewayStatus }
      ];

      metaRows.forEach(row => {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`${row.label}:`, metaX, metaY);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        const splitVal = doc.splitTextToSize(row.val, pw - 40 - 60);
        doc.text(splitVal, metaX + 50, metaY);
        metaY += 8.5;
      });

      curY += 76;
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(20, curY, pw - 40, 52, 2, 2, 'F');
      doc.setDrawColor(div.accentColorRgb[0], div.accentColorRgb[1], div.accentColorRgb[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(20, curY, pw - 40, 52, 2, 2, 'S');

      const qrBoxSize = 42;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(26, curY + 5, qrBoxSize, qrBoxSize, 1.5, 1.5, 'F');
      doc.addImage(qrDataUrl, 'PNG', 28, curY + 7, qrBoxSize - 4, qrBoxSize - 4);

      const qrTextX = 26 + qrBoxSize + 6;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(div.accentColorRgb[0], div.accentColorRgb[1], div.accentColorRgb[2]);
      doc.text('KODE QR OTENTIKASI & INTEGRITAS DOKUMEN', qrTextX, curY + 12);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(203, 213, 225);
      doc.text('Pindai kode QR di sebelah kiri menggunakan smartphone untuk membuka', qrTextX, curY + 18);
      doc.text('halaman verifikasi resmi dan memastikan integritas dokumen belum dimodifikasi.', qrTextX, curY + 22.5);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(52, 211, 153);
      doc.text('CRYPTOGRAPHIC INTEGRITY DIGEST (SHA-256):', qrTextX, curY + 30);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(payload.securityHash, qrTextX, curY + 35);

      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Tautan Verifikasi: ${payload.verificationUrl.slice(0, 48)}...`, qrTextX, curY + 44);

      curY += 60;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('Ditetapkan dan Divalidasi oleh:', 26, curY);
      doc.text('SCBD Jakarta, ' + payload.issuedDateStr, pw - 80, curY);

      curY += 6;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(div.signatoryTitle, 26, curY);
      doc.text('Dewan Direksi & Otoritas Sistem', pw - 80, curY);

      curY += 4;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(26, curY, 65, 16, 1, 1, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(5, 150, 105);
      doc.text('[TEROTORISASI ELEKTRONIK]', 30, curY + 6);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);
      doc.text(payload.signatoryOfficer, 30, curY + 11.5);

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(pw - 80, curY, 60, 16, 1, 1, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(5, 150, 105);
      doc.text('[VENTUREAM VERIFIED SEAL]', pw - 76, curY + 6);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Aidil Syahdan Al fitrah', pw - 76, curY + 11.5);

      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Sertifikat Otentikasi Dokumen Fisik VentureAM | Cetak: ${new Date().toLocaleString('id-ID')}`, 20, ph - 14);

      saveAndNotifyPdf(doc, `VentureAM_Sertifikat_Validasi_Fisik_${payload.docNumber.replace(/[\/\\]/g, '_')}.pdf`, 'Sertifikat Pengesahan Dokumen Fisik');
      handleSaveToHistory();
    } catch (e: any) {
      console.error('Failed generating certificate PDF', e);
      alert(`Gagal membuat Sertifikat PDF: ${e.message || e}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-emerald-400 text-xs font-bold shadow-lg"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{successToast}</span>
            </div>
            <span className="text-[10px] uppercase font-mono tracking-wider bg-emerald-500/20 px-2 py-0.5 rounded-md">SAVED</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form & Configuration (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-[2rem] p-6 space-y-6 backdrop-blur-xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#DFFF00]/10 rounded-2xl border border-[#DFFF00]/20 text-[#DFFF00]">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">
                    Generator QR Code Dokumen Fisik
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Terbitkan stempel validasi resmi & kode unik berkeamanan tinggi untuk berkas fisik / hardcopy.
                  </p>
                </div>
              </div>

              <button
                onClick={handleRegenerateNumber}
                className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl border border-zinc-700 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                title="Generate Kode Dokumen Baru"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Nomor Baru</span>
              </button>
            </div>

            {/* Template Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-[#DFFF00]" />
                Pilih Template / Jenis Dokumen Fisik:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DOCUMENT_TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleTemplateChange(t.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all text-xs font-medium cursor-pointer ${
                      selectedTemplate === t.id
                        ? 'bg-[#DFFF00]/10 border-[#DFFF00] text-white shadow-[0_0_15px_rgba(223,255,0,0.1)]'
                        : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <span className="block font-bold text-[11px] truncate">{t.title}</span>
                    <span className="text-[9px] text-zinc-500 uppercase font-mono">{t.prefix} • {OFFICIAL_DIVISIONS[t.division]?.code}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Division Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-[#DFFF00]" />
                Divisi Penerbit / Otoritas Dokumen:
              </label>
              <select
                value={selectedDivision}
                onChange={(e) => handleDivisionChange(e.target.value as OfficialDivisionKey)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-[#DFFF00]/50"
              >
                {(Object.keys(OFFICIAL_DIVISIONS) as OfficialDivisionKey[]).map(key => {
                  const div = OFFICIAL_DIVISIONS[key];
                  return (
                    <option key={key} value={key}>
                      [{div.code}] {div.name} — ({div.signatoryTitle})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Document Title Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#DFFF00]" />
                Judul Lengkap Dokumen Fisik:
              </label>
              <input
                type="text"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Contoh: Perjanjian Kerjasama Pengelolaan Investasi SPK-0821"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#DFFF00]/50"
              />
            </div>

            {/* Row: Doc Number & Classification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-[#DFFF00]" />
                  Nomor Registrasi Fisik:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-[#DFFF00] focus:outline-none focus:border-[#DFFF00]/50"
                  />
                  <button
                    onClick={handleRegenerateNumber}
                    className="px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700 transition-all text-xs cursor-pointer"
                    title="Buat Nomor Acak Baru"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Klasifikasi / Tingkat Kerahasiaan:
                </label>
                <input
                  type="text"
                  value={classification}
                  onChange={(e) => setClassification(e.target.value)}
                  placeholder="DOKUMEN RESMI HUKUM (LEGAL CONTRACT)"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* Row: Physical Archive Location & Signatory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                  <FolderArchive className="w-3.5 h-3.5 text-purple-400" />
                  Lokasi Fisik / Brankas Arsip:
                </label>
                <input
                  type="text"
                  value={archiveLocation}
                  onChange={(e) => setArchiveLocation(e.target.value)}
                  placeholder="Contoh: Brankas Utama Vault-A (Map Folder #04)"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                  <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />
                  Pejabat Penandatangan:
                </label>
                <input
                  type="text"
                  value={signatoryOfficer}
                  onChange={(e) => setSignatoryOfficer(e.target.value)}
                  placeholder="Aidil Syahdan Al fitrah"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            {/* Visual Theme Picker */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#DFFF00]" />
                Pilih Gaya Visual Stempel Preview & Ekspor:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setThemeStyle('dark')}
                  className={`p-2 rounded-xl text-center border text-xs font-bold transition-all cursor-pointer ${
                    themeStyle === 'dark'
                      ? 'bg-zinc-800 border-[#DFFF00] text-[#DFFF00]'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Institutional Dark
                </button>
                <button
                  onClick={() => setThemeStyle('gold_bordered')}
                  className={`p-2 rounded-xl text-center border text-xs font-bold transition-all cursor-pointer ${
                    themeStyle === 'gold_bordered'
                      ? 'bg-yellow-950/40 border-yellow-500 text-yellow-400'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Gold Certificate
                </button>
                <button
                  onClick={() => setThemeStyle('light')}
                  className={`p-2 rounded-xl text-center border text-xs font-bold transition-all cursor-pointer ${
                    themeStyle === 'light'
                      ? 'bg-white border-zinc-400 text-black'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Clean Print (Light)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live QR Visual Preview & Action Buttons (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Live Preview Card */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-[2rem] p-6 space-y-5 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#DFFF00] flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> LIVE STEMPEL QR PREVIEW
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  REAL-TIME SYNC
                </span>
              </div>

              {/* Visual Stamp Card */}
              <div
                className={`mt-4 rounded-2xl p-4 border transition-all relative overflow-hidden shadow-2xl ${
                  themeStyle === 'dark'
                    ? 'bg-slate-900 border-zinc-700'
                    : themeStyle === 'gold_bordered'
                    ? 'bg-yellow-50 border-yellow-600 text-zinc-900'
                    : 'bg-slate-50 border-slate-300 text-zinc-900'
                }`}
                style={{
                  borderColor: themeStyle === 'dark' ? OFFICIAL_DIVISIONS[selectedDivision].accentColorHex : undefined
                }}
              >
                <div className="flex items-start gap-3.5">
                  {/* QR Image Box */}
                  <div className="p-2 bg-white rounded-xl shadow-md shrink-0 border border-zinc-200">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="QR Code Validation"
                        className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-zinc-200 animate-pulse rounded-lg" />
                    )}
                  </div>

                  {/* Stamp Info */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <span
                      className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded inline-block ${
                        themeStyle === 'dark'
                          ? 'bg-[#DFFF00]/20 text-[#DFFF00]'
                          : 'bg-yellow-600 text-white'
                      }`}
                    >
                      STEMPEL RESMI FISIK
                    </span>

                    <h4
                      className={`text-xs font-bold truncate leading-tight ${
                        themeStyle === 'dark' ? 'text-white' : 'text-zinc-900'
                      }`}
                    >
                      {OFFICIAL_DIVISIONS[selectedDivision].name}
                    </h4>

                    <p
                      className={`text-[10px] font-mono font-bold truncate ${
                        themeStyle === 'dark' ? 'text-[#DFFF00]' : 'text-amber-700'
                      }`}
                    >
                      {docNumber}
                    </p>

                    <p
                      className={`text-[9px] truncate ${
                        themeStyle === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
                      }`}
                    >
                      {documentTitle}
                    </p>

                    <div
                      className={`text-[8px] font-mono p-1.5 rounded mt-1 border truncate ${
                        themeStyle === 'dark'
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                          : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      }`}
                    >
                      HASH: {payload?.securityHash || 'SHA256-PENDING'}
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-3 pt-2 border-t flex items-center justify-between text-[8px] font-mono ${
                    themeStyle === 'dark'
                      ? 'border-slate-800 text-zinc-500'
                      : 'border-yellow-200 text-zinc-600'
                  }`}
                >
                  <span>Penerbitan: {payload?.issuedDateStr || 'Hari ini'}</span>
                  <span>Otorisasi: {signatoryOfficer || 'Resmi VAM'}</span>
                </div>
              </div>

              {/* Hash & Verification Link Row */}
              <div className="mt-4 p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80 space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-mono text-[10px]">Security Hash (SHA-256):</span>
                  <button
                    onClick={handleCopyHash}
                    className="flex items-center gap-1 text-[10px] text-[#DFFF00] hover:underline cursor-pointer"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHash ? 'Tersalin' : 'Salin Hash'}</span>
                  </button>
                </div>
                <div className="font-mono text-emerald-400 text-[10px] bg-black/50 p-1.5 rounded border border-zinc-800 truncate">
                  {payload?.securityHash}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-zinc-400 font-mono text-[10px]">Tautan Verifikasi URL:</span>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 text-[10px] text-blue-400 hover:underline cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLink ? 'Tersalin' : 'Salin Link'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handlePrintStickerSheet}
                  disabled={isGeneratingPdf}
                  className="py-3 px-3 bg-[#DFFF00] hover:bg-yellow-300 text-black font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#DFFF00]/10 disabled:opacity-50"
                  title="Cetak 8 Stiker Label QR per Lembar A4"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Stiker Label A4</span>
                </button>

                <button
                  onClick={handlePrintCertificatePdf}
                  disabled={isGeneratingPdf}
                  className="py-3 px-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-zinc-700 disabled:opacity-50"
                  title="Cetak Sertifikat Pengesahan Dokumen Fisik A4 Lengkap"
                >
                  <FileText className="w-4 h-4 text-yellow-400" />
                  <span>Cetak Sertifikat A4</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleDownloadQrPng}
                  className="py-2.5 px-3 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-zinc-800"
                >
                  <Download className="w-3.5 h-3.5 text-[#DFFF00]" />
                  <span>Unduh Gambar PNG</span>
                </button>

                <button
                  onClick={() => {
                    handleSaveToHistory();
                    if (onOpenVerifier && payload) {
                      onOpenVerifier(payload.docNumber, payload.divisionCode, payload.securityHash);
                    }
                  }}
                  className="py-2.5 px-3 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black text-emerald-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-500/30 shadow-md"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Uji Validasi Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Section: Recent Generated Physical Document Records */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-[2rem] p-6 space-y-4 backdrop-blur-xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-purple-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Daftar Riwayat Kode Validasi Dokumen Fisik Terdaftar
            </h4>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">
            {recentRecords.length} Dokumen Tersimpan
          </span>
        </div>

        {recentRecords.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            Belum ada stempel dokumen fisik yang tersimpan. Buat stempel di atas untuk memulai pencatatan.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentRecords.map(rec => {
              const div = OFFICIAL_DIVISIONS[rec.divisionKey] || OFFICIAL_DIVISIONS.DIVISI_KEPATUHAN_RISIKO;
              return (
                <div
                  key={rec.id}
                  className="bg-zinc-950/70 border border-zinc-800/90 hover:border-zinc-700 rounded-2xl p-4 space-y-3 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border"
                        style={{
                          color: div.accentColorHex,
                          borderColor: `${div.accentColorHex}40`,
                          backgroundColor: `${div.accentColorHex}15`
                        }}
                      >
                        {rec.divisionCode}
                      </span>
                      <h5 className="text-xs font-bold text-white mt-1.5 line-clamp-1">
                        {rec.documentTitle}
                      </h5>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-[#DFFF00] bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                      {rec.docNumber}
                    </span>
                  </div>

                  <div className="text-[10px] text-zinc-400 space-y-1">
                    <p className="flex items-center gap-1.5 truncate">
                      <FolderArchive className="w-3 h-3 text-purple-400 shrink-0" />
                      <span>{rec.archiveLocation}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-zinc-500">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>{rec.issuedTimestamp}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                    <code className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/50">
                      {rec.securityHash}
                    </code>

                    <button
                      onClick={() => {
                        if (onOpenVerifier) {
                          onOpenVerifier(rec.docNumber, rec.divisionCode, rec.securityHash);
                        }
                      }}
                      className="text-[10px] font-bold text-[#DFFF00] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Validasi</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PhysicalDocQrGenerator;
