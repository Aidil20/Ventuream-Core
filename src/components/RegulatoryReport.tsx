import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { 
  Building2, 
  MapPin, 
  UserCheck, 
  FileText, 
  Globe2, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle, 
  BookOpen, 
  Upload, 
  Wallet, 
  RefreshCw, 
  Download, 
  Scale, 
  ArrowRight,
  Sparkles,
  Search,
  Check,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  uploadedAt: string;
}

export default function RegulatoryReport() {
  // Tab state
  const [activeSubTab, setActiveSubTab] = useState<'domestic' | 'global' | 'integrity'>('domestic');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Domestic Compliance State
  const [nib, setNib] = useState('0711240125437');
  const [alamat, setAlamat] = useState('Niron, Sukamakmur, Aceh Besar, Provinsi Aceh, Indonesia');
  const [lkpmModalTetap, setLkpmModalTetap] = useState('4.850.000.000');
  const [lkpmModalKerja, setLkpmModalKerja] = useState('2.150.000.000');
  const [attorney, setAttorney] = useState('Aidil Syahdan Al Fitrah');
  const [boDeclaration, setBoDeclaration] = useState('Aidil Syahdan Al Fitrah (90% Ultimate Beneficial Owner - UBO), PT Venture Asset Management (10% Treasury Stock)');

  // 2. Global Compliance State
  const [accreditedStatus, setAccreditedStatus] = useState(true);
  const [ecpStatus, setEcpStatus] = useState(true);
  const [binanceId, setBinanceId] = useState('1088357886');
  const [emirHedgingNotes, setEmirHedgingNotes] = useState('Sovereign Sukuk Hedging & Total Return Swaps OTC reporting with CGS International (Mitra Domestik).');
  const [mifidLog, setMifidLog] = useState('MiFIR RTS 22 Execution Report: Active routing protocol to SGX & IDX validated.');
  const [sftrAgunan, setSftrAgunan] = useState('LCR Collateral Mitigation Matrix updated. Initial liquidity ratio > 140%.');
  const [ibkrCatId, setIbkrCatId] = useState('U1088357');
  const [swissFinsaConfirmed, setSwissFinsaConfirmed] = useState(true);

  // 3. Financial Integrity State
  const [crsTaxStatus, setCrsTaxStatus] = useState(true);
  const [fatfAmlStatus, setFatfAmlStatus] = useState(true);

  // Simulating custom uploaded files list with interactive upload behavior
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
    { id: '1', name: 'SK_Kemenkumham_VentureAM_2026_Signed.pdf', size: '2.4 MB', type: 'SK_Kemenkumham', progress: 100, status: 'completed', uploadedAt: '18/06/2026' },
    { id: '2', name: 'OSS_Realisasi_Investasi_053_Q2.pdf', size: '1.8 MB', type: 'LKPM_Document', progress: 100, status: 'completed', uploadedAt: '19/06/2026' },
    { id: '3', name: 'YTD_Source_of_Wealth_Kompilasi_VAM.xlsx', size: '4.2 MB', type: 'SOW_Financial', progress: 100, status: 'completed', uploadedAt: '19/06/2026' }
  ]);

  const [dragActive, setDragActive] = useState(false);

  // Load from LocalStorage if available
  useEffect(() => {
    const savedNib = localStorage.getItem('vam_reg_nib');
    const savedAlamat = localStorage.getItem('vam_reg_alamat');
    const savedAttorney = localStorage.getItem('vam_reg_attorney');
    const savedBinanceId = localStorage.getItem('vam_reg_binance_id');
    const savedIbkr = localStorage.getItem('vam_reg_ibkr');

    if (savedNib) setNib(savedNib);
    if (savedAlamat) setAlamat(savedAlamat);
    if (savedAttorney) setAttorney(savedAttorney);
    if (savedBinanceId) setBinanceId(savedBinanceId);
    if (savedIbkr) setIbkrCatId(savedIbkr);
  }, []);

  const handleSaveAll = () => {
    setIsVerifying(true);
    setTimeout(() => {
      localStorage.setItem('vam_reg_nib', nib);
      localStorage.setItem('vam_reg_alamat', alamat);
      localStorage.setItem('vam_reg_attorney', attorney);
      localStorage.setItem('vam_reg_binance_id', binanceId);
      localStorage.setItem('vam_reg_ibkr', ibkrCatId);

      setIsVerifying(false);
      setSaveSuccess(true);
      setSuccessMsg('Kepatuhan sistem berhasil divalidasi dan diarsipkan secara lokal (Zero Trust Secure).');
      setTimeout(() => setSaveSuccess(false), 4000);
    }, 1200);
  };

  const handleGenerateIntangibleAssetPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // --- PAGE 1 ---
      // Header Bar Accent Strip
      doc.setFillColor(15, 23, 42); 
      doc.rect(0, 0, 210, 18, 'F');

      // Brand Title
      doc.setTextColor(222, 255, 154); // #deff9a
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('PT VENTURE ASSET MANAGEMENT GROUP', 15, 11);

      doc.setTextColor(148, 163, 184); // slate-400
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('FINANCIAL & REGULATORY REPORTING // KAPITALISASI ASET TAK BERWUJUD (PSAK 19 / IAS 38)', 15, 23);

      // Main Title
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('LAPORAN BIAYA ASET TAK BERWUJUD & JADWAL AMORTISASI ERP', 15, 32);

      // Status Box
      doc.setFillColor(241, 245, 249); // slate-100 bg
      doc.rect(15, 37, 180, 24, 'F');
      doc.setDrawColor(203, 213, 225); // slate-300 border
      doc.rect(15, 37, 180, 24, 'D');

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('PERNYATAAN RESMI KAPITALISASI ASET TAK BERWUJUD (INTANGIBLE ASSET)', 20, 43);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const timestamp = new Date().toLocaleString('id-ID');
      doc.text(`Tanggal Audit / Pelaporan : ${timestamp} WIB (GMT+7)`, 20, 48.5);
      doc.text('Standar Akuntansi        : PSAK 19 (Aset Tak Berwujud) / IAS 38 Intangible Assets', 20, 53);
      doc.text('Peruntukan Pelaporan      : Otoritas Jasa Keuangan (OJK), Direktorat Jenderal Pajak (DJP) & Auditor', 20, 57.5);

      // Section 1: Breakdown Biaya Pengembangan
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text('1. RINCIAN BIAYA PEROLEHAN KAPITALISASI SISTEM ERP VAM', 15, 68);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(15, 70, 195, 70);

      // Table Header
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(15, 73, 180, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('No', 18, 77.5);
      doc.text('Komponen Development System ERP VAM', 28, 77.5);
      doc.text('Nilai Kapitalisasi (IDR)', 150, 77.5);

      const items = [
        { no: '1', name: 'Core Architecture & Institutional UI/UX System', cost: 'Rp 175.000.000' },
        { no: '2', name: 'Portfolio Management & Execution Engine', cost: 'Rp 285.000.000' },
        { no: '3', name: 'Analisis Teknikal & Custom PineScript Screener', cost: 'Rp 220.000.000' },
        { no: '4', name: 'Analisis Fundamental & Chart of Accounts (CoA) Auto-Mapping', cost: 'Rp 260.000.000' },
        { no: '5', name: 'Risk Analytics, Compliance & Beneficial Ownership GNN', cost: 'Rp 240.000.000' },
        { no: '6', name: 'Server Gateway & Multi-Market Sync Engine', cost: 'Rp 195.000.000' },
        { no: '7', name: 'Quality Assurance (QA) & Cross-Market Data Audit', cost: 'Rp 125.000.000' },
      ];

      let rowY = 81;
      items.forEach((item, idx) => {
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, rowY - 3.5, 180, 6.5, 'F');
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text(item.no, 18, rowY);
        doc.text(item.name, 28, rowY);
        doc.setFont('helvetica', 'bold');
        doc.text(item.cost, 150, rowY);
        rowY += 6;
      });

      // Total Row
      doc.setFillColor(226, 232, 240);
      doc.rect(15, rowY - 3, 180, 8, 'F');
      doc.setDrawColor(148, 163, 184);
      doc.rect(15, rowY - 3, 180, 8, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('TOTAL NILAI PEROLEHAN ASET TAK BERWUJUD (CapEx)', 28, rowY + 2);
      doc.text('Rp 1.500.000.000,-', 150, rowY + 2);

      // Section 2: Fair Market Valuation & OpEx Estimates
      const sec2Y = rowY + 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('2. VALUASI PASAR WAJAR (REPLACEMENT COST) & PROYEKSI OpEx TAHUNAN', 15, sec2Y);
      doc.line(15, sec2Y + 2, 195, sec2Y + 2);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Nilai Pasar Wajar (Replacement Value) :', 15, sec2Y + 8);
      doc.setFont('helvetica', 'normal');
      doc.text('Rp 2.200.000.000 – Rp 2.800.000.000,- (Enterprise Software Integrator Cost)', 75, sec2Y + 8);

      doc.setFont('helvetica', 'bold');
      doc.text('Estimasi OpEx Tahunan Total           :', 15, sec2Y + 14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 83, 9); // amber-700
      doc.text('Rp 270.000.000,- / Tahun', 75, sec2Y + 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('• Lisensi API Market Data Feed & Data Provider : ~Rp 120.000.000 / tahun', 20, sec2Y + 19);
      doc.text('• Cloud Hosting & Serverless DB Architecture   : ~Rp 60.000.000 / tahun', 20, sec2Y + 23.5);
      doc.text('• Pemeliharaan & Pembaruan Regulasi / Ticker   : ~Rp 90.000.000 / tahun', 20, sec2Y + 28);

      // Section 3: Parameter Akuntansi Amortisasi
      const sec3Y = sec2Y + 35;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('3. PARAMETER AKUNTANSI & METODE AMORTISASI (PSAK 19 / IAS 38)', 15, sec3Y);
      doc.line(15, sec3Y + 2, 195, sec3Y + 2);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Metode Amortisasi       :', 15, sec3Y + 8);
      doc.setFont('helvetica', 'normal');
      doc.text('Metode Garis Lurus (Straight-Line Amortization Method)', 62, sec3Y + 8);

      doc.setFont('helvetica', 'bold');
      doc.text('Masa Manfaat (Useful Life) :', 15, sec3Y + 13.5);
      doc.setFont('helvetica', 'normal');
      doc.text('20 Tahun (240 Bulan Masa Operasional)', 62, sec3Y + 13.5);

      doc.setFont('helvetica', 'bold');
      doc.text('Nilai Sisa (Residual Value):', 15, sec3Y + 19);
      doc.setFont('helvetica', 'normal');
      doc.text('Rp 0,- (Zero Residual Value)', 62, sec3Y + 19);

      doc.setFont('helvetica', 'bold');
      doc.text('Beban Amortisasi / Tahun  :', 15, sec3Y + 24.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(21, 128, 61); // emerald-700
      doc.text('Rp 210.000.000,- / Tahun', 62, sec3Y + 24.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Beban Amortisasi / Bulan  :', 15, sec3Y + 30);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(21, 128, 61);
      doc.text('Rp 17.500.000,- / Bulan', 62, sec3Y + 30);

      // --- PAGE 2 ---
      doc.addPage();

      // Page 2 Header
      doc.setFillColor(15, 23, 42); 
      doc.rect(0, 0, 210, 14, 'F');
      doc.setTextColor(222, 255, 154);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('PT VENTURE ASSET MANAGEMENT GROUP', 15, 9);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('JADWAL AMORTISASI ASET TAK BERWUJUD (20 TAHUN)', 120, 9);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text('4. JADWAL LENGKAP AMORTISASI GARIS LURUS (TAHUN 1 - TAHUN 20)', 15, 23);
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 25, 195, 25);

      // Table Header Page 2
      doc.setFillColor(30, 41, 59);
      doc.rect(15, 28, 180, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Tahun', 18, 32.5);
      doc.text('Nilai Buku Awal (IDR)', 35, 32.5);
      doc.text('Beban Amortisasi (IDR)', 82, 32.5);
      doc.text('Akumulasi Amortisasi (IDR)', 122, 32.5);
      doc.text('Nilai Buku Akhir (IDR)', 162, 32.5);

      const totalCost = 4200000000;
      const annualAmort = 210000000;
      let accum = 0;
      let currentBookValue = totalCost;
      let scheduleY = 36;

      for (let year = 1; year <= 20; year++) {
        const startValue = currentBookValue;
        accum += annualAmort;
        currentBookValue -= annualAmort;

        if (year % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, scheduleY - 3.2, 180, 5.8, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);

        doc.text(`Tahun ${year}`, 18, scheduleY);
        doc.text(`Rp ${startValue.toLocaleString('id-ID')}`, 35, scheduleY);
        doc.text(`Rp ${annualAmort.toLocaleString('id-ID')}`, 82, scheduleY);
        doc.text(`Rp ${accum.toLocaleString('id-ID')}`, 122, scheduleY);
        doc.setFont('helvetica', 'bold');
        doc.text(`Rp ${Math.max(0, currentBookValue).toLocaleString('id-ID')}`, 162, scheduleY);

        scheduleY += 5.8;
      }

      // Legal Sign Off Box Page 2
      const signY = scheduleY + 10;
      doc.setDrawColor(203, 213, 225);
      doc.line(15, signY, 195, signY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('DISAHKAN OLEH MANAJEMEN PT VENTURE ASSET MANAGEMENT', 15, signY + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Dokumen ini diterbitkan sebagai bukti sah amortisasi aset tak berwujud berdasarkan standar akuntansi PSAK 19 / IAS 38.', 15, signY + 12);
      doc.text(`ID Verifikasi Sistem: VAM-INTANGIBLE-ASSET-${Math.random().toString(36).substring(2, 10).toUpperCase()}-2026`, 15, signY + 16);

      // Signature Wave
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.45);
      doc.line(15, signY + 23, 19, signY + 20);
      doc.line(19, signY + 20, 24, signY + 27);
      doc.line(24, signY + 27, 30, signY + 18);
      doc.line(30, signY + 18, 35, signY + 25);
      doc.line(35, signY + 25, 48, signY + 22);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('Aidil Syahdan Al Fitrah', 15, signY + 33);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('President Director / Chief Executive Officer', 15, signY + 37);

      // Corporate Seal Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(222, 255, 154);
      doc.setLineWidth(0.5);
      doc.rect(138, signY + 5, 57, 33, 'DF');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text('VENTUREAM FINANCIAL SEAL', 141, signY + 11);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('ASET TAK BERWUJUD TERVERIFIKASI', 141, signY + 16);
      doc.text('NILAI PEROLEHAN : Rp 1.500.000.000', 141, signY + 20);
      doc.text('MASA MANFAAT    : 20 TAHUN', 141, signY + 24);
      doc.text('AMORTISASI/THN  : Rp 75.000.000', 141, signY + 28);
      doc.text(`TANGGAL CAP     : ${new Date().toLocaleDateString('id-ID')}`, 141, signY + 32);

      // Save PDF
      doc.save(`VentureAM_Laporan_Aset_Tak_Berwujud_20Tahun_${new Date().toISOString().slice(0, 10)}.pdf`);

      setSaveSuccess(true);
      setSuccessMsg('PDF Laporan Aset Tak Berwujud & Jadwal Amortisasi 20 Tahun berhasil diunduh!');
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error(err);
      alert('Gagal membuat PDF Aset Tak Berwujud: ' + err.message);
    }
  };

  const handleGenerateDomesticPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Header Bar Accent Strip
      doc.setFillColor(15, 23, 42); 
      doc.rect(0, 0, 210, 16, 'F');

      // Brand Title with DFFF00 color hint (#deff9a in dark mode is close to neon lime)
      doc.setTextColor(222, 255, 154); // matches #deff9a
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('PT VENTURE ASSET MANAGEMENT GROUP', 15, 10.5);

      // Subtitle info
      doc.setTextColor(148, 163, 184); // slate-400
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('INSTITUTIONAL REGULATORY GATEWAY // ID-OJK-KEMENKUMHAM-SEC-COMPLIANCE', 15, 22);

      // Title
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('DOMESTIC REGULATORY COMPLIANCE MATRIX', 15, 32);

      // Status Indicator Pill/Box
      doc.setFillColor(240, 253, 244); // soft emerald-50 bg
      doc.rect(15, 38, 180, 22, 'F');
      doc.setDrawColor(187, 247, 208); // emerald-200 border
      doc.rect(15, 38, 180, 22, 'D');

      doc.setTextColor(21, 128, 61); // emerald-700
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('STATUS: FULLY COMPLIANT (100% SECURE & VERIFIED)', 20, 44.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const timestamp = new Date().toLocaleString('id-ID');
      doc.text(`Generated On/Timestamp: ${timestamp} JKT (GMT+7)`, 20, 50);
      doc.text('Regulatory Framework: OSS BKPM, Kemenkumham Corporate Audit & FATF Active-AML Standard.', 20, 54.5);

      // Section 1
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('1. INTEGRITY REGISTRATION DETAILS (OSS BKPM)', 15, 72);

      // Divider Line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(15, 74, 195, 74);

      // NIB Row
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.text('Nomor Induk Berusaha (NIB):', 15, 82);
      doc.setFont('helvetica', 'normal');
      doc.text(nib, 78, 82);

      // Alamat Row
      doc.setFont('helvetica', 'bold');
      doc.text('Alamat Kantor Terdaftar:', 15, 89);
      doc.setFont('helvetica', 'normal');
      const splitAlamat = doc.splitTextToSize(alamat, 110);
      doc.text(splitAlamat, 78, 89);

      // Calculate next Y-axis offset dynamic spacing
      const currentY = 89 + (splitAlamat.length * 4.5) + 2;

      // Law Jurisdiction Info
      doc.setFont('helvetica', 'bold');
      doc.text('Yurisdiksi Resmi:', 15, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text('Negara Kesatuan Republik Indonesia saja (Indonesia Jurisdiction only)', 78, currentY);

      // Section 2
      const section2Y = currentY + 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('2. BENEFICIAL OWNERSHIP & CORPORATE REPRESENTATION (AHU)', 15, section2Y);
      doc.line(15, section2Y + 2, 195, section2Y + 2);

      // Attorney Row
      const attorneyY = section2Y + 9;
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.text('Penerima Kuasa Spesial:', 15, attorneyY);
      doc.setFont('helvetica', 'normal');
      doc.text(attorney, 78, attorneyY);

      // BO Row
      const boY = attorneyY + 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Ultimate Beneficial Owner (UBO):', 15, boY);
      doc.setFont('helvetica', 'normal');
      const splitBo = doc.splitTextToSize(boDeclaration, 110);
      doc.text(splitBo, 78, boY);

      const footerOffset = boY + (splitBo.length * 4.5) + 12;

      // Divider Line for seal
      doc.setDrawColor(203, 213, 225);
      doc.line(15, footerOffset, 195, footerOffset);

      // Signature section
      const signatureY = footerOffset + 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('AUTHORIZED DIGITAL SIGNATURE', 15, signatureY);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const uuidPart = Math.random().toString(36).substring(2, 10).toUpperCase();
      doc.text(`Digital Seal ID: VAM-COMP-DOM-${uuidPart}-2026`, 15, signatureY + 4.5);

      // Signature Waves
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.45);
      doc.line(15, signatureY + 14, 19, signatureY + 11);
      doc.line(19, signatureY + 11, 24, signatureY + 18);
      doc.line(24, signatureY + 18, 30, signatureY + 9);
      doc.line(30, signatureY + 9, 35, signatureY + 16);
      doc.line(35, signatureY + 16, 48, signatureY + 13);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Aidil Syahdan Al Fitrah', 15, signatureY + 23);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('President Director & Attorney-in-Fact', 15, signatureY + 27);
      doc.text('PT Venture Asset Management', 15, signatureY + 31);

      // Institutional Seal Box
      doc.setFillColor(248, 250, 252);
      doc.setTextColor(15, 23, 42);
      doc.setDrawColor(222, 255, 154); // matches #deff9a highlight border
      doc.setLineWidth(0.5);
      doc.rect(140, signatureY + 2, 55, 29, 'DF');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('VENTUREAM GROUP SEAL', 143, signatureY + 8);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('OFFICIAL CORPORATE MATRIX', 143, signatureY + 13);
      doc.text('STATUS: FULLY VERIFIED COMPLIANT', 143, signatureY + 17);
      doc.text('OJK / KEMENKUMHAM / CFTC / SEC', 143, signatureY + 21);
      doc.text('JAKARTA, REPUBLIC OF INDONESIA', 143, signatureY + 25);
      doc.text(`DATE APPROVED: ${new Date().toLocaleDateString('id-ID')}`, 143, signatureY + 29);

      // Download the final PDF file
      doc.save(`VentureAM_Domestic_Compliance_Signed_${new Date().toISOString().slice(0, 10)}.pdf`);

      setSaveSuccess(true);
      setSuccessMsg('PDF Matriks Kepatuhan Domestik berhasil dibuat dan ditandatangani secara digital!');
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error(err);
      alert('Gagal membuat dokumen PDF: ' + err.message);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      addNewFile(file.name, file.size);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      addNewFile(file.name, file.size);
    }
  };

  const addNewFile = (fileName: string, rawSize: number) => {
    const sizeStr = (rawSize / (1024 * 1024)).toFixed(1) + ' MB';
    const newId = String(Date.now());
    const newFile: UploadedFile = {
      id: newId,
      name: fileName,
      size: sizeStr,
      type: 'Ad-hoc_Upload',
      progress: 0,
      status: 'uploading',
      uploadedAt: new Date().toLocaleDateString('id-ID')
    };

    setUploadedFiles(prev => [newFile, ...prev]);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadedFiles(prev => {
        return prev.map(f => {
          if (f.id === newId) {
            const nextProg = f.progress + 25;
            if (nextProg >= 100) {
              clearInterval(interval);
              return { ...f, progress: 100, status: 'completed' };
            }
            return { ...f, progress: nextProg };
          }
          return f;
        });
      });
    }, 300);
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-6">
      
      {/* Header Board */}
      <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] px-2 py-0.5 font-bold uppercase tracking-widest bg-[#deff9a]/10 border border-[#deff9a]/30 text-[#deff9a] rounded-full">
              Standard OJK & CFTC/SEC Aligned
            </span>
            <span className="text-[9px] px-2 py-0.5 font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full animate-pulse">
              ● KYC Active
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase">LAPORAN KEPATUHAN REGULASI</h2>
          <p className="text-[10px] text-zinc-500 tracking-widest uppercase font-bold">
            Portal Kepatuhan Terpadu PT Venture Asset Management
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleGenerateIntangibleAssetPDF}
            className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 hover:border-amber-500/80 text-amber-300 transition-all font-bold text-[10px] uppercase tracking-wider rounded-xl flex items-center gap-2 active:scale-95 cursor-pointer shadow-lg shadow-amber-500/5"
          >
            <FileText className="w-3.5 h-3.5" /> CETAK PDF ASET TAK BERWUJUD (20 TAHUN)
          </button>
          <button
            onClick={handleGenerateDomesticPDF}
            className="px-4 py-2 bg-slate-950/80 hover:bg-slate-900 border border-[#deff9a]/40 hover:border-[#deff9a]/80 text-[#deff9a] transition-all font-bold text-[10px] uppercase tracking-wider rounded-xl flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> UNDUH PDF MATRIKS KEPATUHAN
          </button>
          <button 
            onClick={handleSaveAll}
            disabled={isVerifying}
            className="px-4 py-2 bg-[#deff9a] text-black hover:bg-[#cbf77d] font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#deff9a]/10 active:scale-95 disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Mengaudit...
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                SINKRONISASI INTEGRITAS
              </>
            )}
          </button>
        </div>
      </div>

      {/* Intangible Asset Accounting Summary Box */}
      <div className="bg-gradient-to-r from-amber-950/20 via-slate-900/60 to-slate-950 p-5 rounded-[2rem] border border-amber-500/30 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">KAPITALISASI ASET TAK BERWUJUD (PSAK 19 / IAS 38)</h3>
              <p className="text-[10px] text-amber-200/70 font-semibold">Dasar Pelaporan Laporan Keuangan & Regulator OJK/DJP • System ERP VAM</p>
            </div>
          </div>
          <button
            onClick={handleGenerateIntangibleAssetPDF}
            className="self-start md:self-auto px-4 py-2 bg-amber-400 text-black hover:bg-amber-300 font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/10 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" /> CETAK PDF LAPORAN & JADWAL 20 TAHUN
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Nilai Perolehan ERP</span>
            <span className="text-sm font-black text-amber-400 font-mono mt-1 block">Rp 7.000.000.000,-</span>
            <span className="text-[8px] text-zinc-400 mt-1 block">Total Kapitalisasi Development</span>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Metode & Masa Manfaat</span>
            <span className="text-sm font-black text-white font-mono mt-1 block">Garis Lurus • 20 Thn</span>
            <span className="text-[8px] text-zinc-400 mt-1 block">240 Bulan Masa Operasional</span>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Beban Amortisasi / Tahun</span>
            <span className="text-sm font-black text-emerald-400 font-mono mt-1 block">Rp 350.000.000,-</span>
            <span className="text-[8px] text-emerald-500/80 mt-1 block">Pengurangan Nilai Buku Per Tahun</span>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Beban Amortisasi / Bulan</span>
            <span className="text-sm font-black text-[#deff9a] font-mono mt-1 block">Rp 29.166.667,-</span>
            <span className="text-[8px] text-zinc-400 mt-1 block">Beban Operasional Bulanan</span>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Column 1: Status Akreditasi */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="text-zinc-500 text-[8.5px] font-black uppercase tracking-wider">Status Akreditasi</div>
            <div className="text-xs font-black text-orange-400 mt-1">ECP / CFTC</div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-900/65 text-[7.5px] text-zinc-400 font-medium leading-tight">
            USA, EU, ASIA Accredited
          </div>
        </div>

        {/* Column 2: Cross-Border EU */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="text-zinc-500 text-[8.5px] font-black uppercase tracking-wider">Cross-Border EU</div>
            <div className="text-xs font-black text-blue-400 mt-1">EMIR • MIFID II</div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-900/65 text-[7.5px] text-zinc-400 font-medium leading-tight">
            EMiR, MiFID II/MiFIR & SFTR
          </div>
        </div>

        {/* Column 3: Swiss Regulation */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="text-zinc-500 text-[8.5px] font-black uppercase tracking-wider">Swiss Regulation</div>
            <div className="text-xs font-black text-purple-400 mt-1">FinSA / Finla</div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-900/65 text-[7.5px] text-zinc-400 font-medium leading-tight">
            Protocol Confirmed
          </div>
        </div>

        {/* Column 4: Consolidated Audit Trail */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="text-zinc-500 text-[8.5px] font-black uppercase tracking-wider">Audit Trail (SEC)</div>
            <div className="text-xs font-black text-[#deff9a] mt-1">SEC CONNECTED</div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-900/65 text-[7.5px] text-zinc-400 font-medium leading-tight">
            Interactive Brokers Link Live
          </div>
        </div>

        {/* Column 5: Global Capital Instruments */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="text-zinc-500 text-[8.5px] font-black uppercase tracking-wider">Global Capital</div>
            <div className="text-xs font-black text-teal-400 mt-1">CFTC / OCR</div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-900/65 text-[7.5px] text-zinc-400 font-medium leading-tight">
            Full Institutional Access
          </div>
        </div>

        {/* Column 6: CRS Global Active */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="text-zinc-500 text-[8.5px] font-black uppercase tracking-wider">CRS Active</div>
            <div className="text-xs font-black text-amber-400 mt-1">MANDATORY</div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-900/65 text-[7.5px] text-zinc-400 font-medium leading-tight">
            Common Reporting Standard
          </div>
        </div>

        {/* Column 7: Anti-Money Laundering protocols (FATF) */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="text-zinc-500 text-[8.5px] font-black uppercase tracking-wider">Anti-Money Laundering</div>
            <div className="text-xs font-black text-pink-400 mt-1">FATF COMPLY</div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-900/65 text-[7.5px] text-zinc-400 font-medium leading-tight">
            Active AML/KYC Standard
          </div>
        </div>

        {/* Column 8: Kepatuhan Regulasi Score */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="text-zinc-500 text-[8.5px] font-black uppercase tracking-wider">Kepatuhan Score</div>
            <div className="text-xs font-black text-green-400 mt-1">100.0% YTD</div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-900/65 text-[7.5px] text-emerald-400 font-medium leading-tight">
            Compliant YTD Tracking
          </div>
        </div>
      </div>

      {/* Audit Feedback Center */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="p-4 bg-[#deff9a]/15 border border-[#deff9a]/30 rounded-2xl flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-[#deff9a] shrink-0" />
            <div className="text-[10px]">
              <p className="font-bold text-[#deff9a] uppercase">SINKRONISASI CO-ORDINATED AUDIT BERHASIL</p>
              <p className="text-zinc-300 font-medium mt-0.5">{successMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Ledger Summary logs */}
      <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 text-[10px]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-zinc-500 font-black uppercase tracking-widest text-[8px] flex items-center gap-1">
            <Scale className="w-3.5 h-3.5 text-blue-400" /> SECURE AUDIT LEDGER FEED
          </span>
          <span className="text-[7.5px] text-[#deff9a] font-mono">LATENCY: 0.4ms</span>
        </div>
        <div className="space-y-1.5 font-mono text-zinc-400 text-[9px]">
          <div className="flex justify-between border-b border-slate-900 pb-1">
            <span>[11:08:24] BKPM Portal API ping handshake...</span>
            <span className="text-emerald-400 font-bold">PT_VAM_OSS_ACK</span>
          </div>
          <div className="flex justify-between border-b border-slate-900 pb-1">
            <span>[11:15:02] Swiss FinSA regulatory compliance auto-check...</span>
            <span className="text-blue-400 font-bold">FINSA_COMPLIANT</span>
          </div>
          <div className="flex justify-between">
            <span>[11:22:15] IBKR proprietary CAT SEC integration auto-sync test...</span>
            <span className="text-[#deff9a] font-bold">CAT_AUTHORIZED</span>
          </div>
        </div>
      </div>

    </div>
  );
}
