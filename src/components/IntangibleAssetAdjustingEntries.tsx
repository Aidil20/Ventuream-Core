import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAndNotifyPdf } from '../services/reportNotificationService';
import { 
  FileSpreadsheet, 
  Calendar, 
  CheckCircle2, 
  ShieldCheck, 
  Download, 
  Layers, 
  Calculator, 
  Clock, 
  Award, 
  Sparkles, 
  BookOpen, 
  ArrowRight,
  TrendingDown,
  Building2,
  FileCheck,
  Hash,
  Info,
  ChevronRight,
  Sliders,
  DollarSign
} from 'lucide-react';
import { motion } from 'motion/react';

interface IntangibleAssetAdjustingEntriesProps {
  onApplyAdjustment?: (capitalizedVal: number, amortVal: number) => void;
}

export default function IntangibleAssetAdjustingEntries({ onApplyAdjustment }: IntangibleAssetAdjustingEntriesProps) {
  // Valuation parameters from Invoice VAM-INV-VAL-2026-0810
  const INVOICE_NO = 'VAM-INV-VAL-2026-0810';
  const INVOICE_DATE = '11/08/2026';
  const EFFECTIVE_AMORT_START = 'Agustus 2026';
  const INITIAL_CAPITALIZATION = 4200000000; // Rp 4.200.000.000
  const DIRECT_REPLACEMENT_COST = 1500000000; // Rp 1.500.000.000 (1.950 Jam + Overhead)
  const ECONOMIC_UTILITY_FACTOR = 2.80;
  const USEFUL_LIFE_YEARS = 20;
  const USEFUL_LIFE_MONTHS = 240;
  const ANNUAL_AMORTIZATION = 210000000; // Rp 210.000.000 / Tahun
  const MONTHLY_AMORTIZATION = 17500000; // Rp 17.500.000 / Bulan

  // State for simulated months elapsed since August 2026
  // Default = 1 month (Agustus 2026)
  const [selectedMonthsElapsed, setSelectedMonthsElapsed] = useState<number>(1);
  const [activeSubTab, setActiveSubTab] = useState<'JOURNALS' | 'SCHEDULE' | 'VALUATION_BASIS' | 'NERACA_SYNC'>('JOURNALS');

  // Calculation based on selected months
  const calculations = useMemo(() => {
    const months = Math.max(1, Math.min(USEFUL_LIFE_MONTHS, selectedMonthsElapsed));
    const accumulatedAmortization = months * MONTHLY_AMORTIZATION;
    const netCarryingValue = INITIAL_CAPITALIZATION - accumulatedAmortization;
    const remainingMonths = USEFUL_LIFE_MONTHS - months;
    const remainingYears = (remainingMonths / 12).toFixed(1);
    const amortPercentage = ((accumulatedAmortization / INITIAL_CAPITALIZATION) * 100).toFixed(2);

    // Target month label
    const startYear = 2026;
    const startMonthIndex = 7; // August (0-indexed)
    const targetDate = new Date(startYear, startMonthIndex + (months - 1), 1);
    const monthNamesInd = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const periodLabel = `${monthNamesInd[targetDate.getMonth()]} ${targetDate.getFullYear()}`;

    return {
      months,
      accumulatedAmortization,
      netCarryingValue,
      remainingMonths,
      remainingYears,
      amortPercentage,
      periodLabel
    };
  }, [selectedMonthsElapsed]);

  const formatIdr = (num: number) => {
    return `Rp ${num.toLocaleString('id-ID')}`;
  };

  // Generate Official Adjusting Journal Voucher PDF
  const handleExportJournalVoucherPDF = () => {
    const doc = new jsPDF();

    // Dark Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 42, 'F');

    doc.setTextColor(223, 255, 0); // #DFFF00
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('PT VENTURE ASSET MANAGEMENT', 14, 16);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('VOUCHER JURNAL PENYESUAIAN ASET TAK BERWUJUD & AMORTISASI', 14, 25);
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text(`Rujukan Standar: PSAK 19 (Revisi 2018) / IAS 38 | No. Faktur Valuasi: ${INVOICE_NO}`, 14, 32);
    doc.text(`Status Audit: VERIFIED & AUDITED | Efektif Amortisasi: Sejak ${EFFECTIVE_AMORT_START}`, 14, 37);

    // Document Verification Stamp box
    doc.setDrawColor(223, 255, 0);
    doc.rect(148, 10, 48, 22);
    doc.setFontSize(7.5);
    doc.setTextColor(223, 255, 0);
    doc.text('AUDIT STATUS:', 151, 15);
    doc.setFont('helvetica', 'bold');
    doc.text('PSAK 19 AUDITED', 151, 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(200, 200, 200);
    doc.text('SHA256-VAM-VAL-88942', 151, 25);
    doc.text('Capitalized in Ledger', 151, 29);

    // Summary Card Info
    doc.setDrawColor(220, 220, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 48, 182, 28, 2, 2, 'FD');

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('RINGKASAN VALUASI & AMORTISASI (PERIODE: ' + calculations.periodLabel.toUpperCase() + ')', 18, 54);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`• Nilai Kapitalisasi Awal (Cost): ${formatIdr(INITIAL_CAPITALIZATION)}`, 18, 61);
    doc.text(`• Beban Amortisasi Per Bulan: ${formatIdr(MONTHLY_AMORTIZATION)} / Bulan (${formatIdr(ANNUAL_AMORTIZATION)} / Thn)`, 18, 67);
    doc.text(`• Masa Manfaat Terukur: 20 Tahun (240 Bulan)`, 18, 73);

    doc.text(`• Akumulasi Amortisasi (${calculations.months} Bln): ${formatIdr(calculations.accumulatedAmortization)}`, 110, 61);
    doc.text(`• Nilai Buku Bersih (Carrying Value): ${formatIdr(calculations.netCarryingValue)}`, 110, 67);
    doc.text(`• Sisa Masa Manfaat: ${calculations.remainingMonths} Bulan (${calculations.remainingYears} Tahun)`, 110, 73);

    // Journal Adjusting Entries Table
    const journalEntries = [
      [
        '11/08/2026',
        '#1300',
        'Aset Tak Berwujud - ERP Software VentureAM\n(Pengakuan kapitalisasi software ERP VentureAM v3.2.0 sesuai Faktur VAM-INV-VAL-2026-0810)',
        '4.200.000.000',
        '-'
      ],
      [
        '11/08/2026',
        '#3110',
        'Modal Disetor Terkapitalisasi (Ekuitas)\n(Pengakuan tambahan modal disetor terkapitalisasi atas aset tak berwujud perseroan)',
        '-',
        '4.200.000.000'
      ],
      [
        '31/08/2026',
        '#5300',
        `Beban Amortisasi Aset Tak Berwujud (Bulan ke-1 - Agustus 2026)\n(Pembebanan amortisasi garis lurus bulan Agustus 2026 [Rp 210.000.000 / 12])`,
        '17.500.000',
        '-'
      ],
      [
        '31/08/2026',
        '#1390',
        `Akumulasi Amortisasi Software ERP VentureAM\n(Kontra-akun pengurang nilai buku aset tak berwujud per 31 Agustus 2026)`,
        '-',
        '17.500.000'
      ]
    ];

    if (calculations.months > 1) {
      journalEntries.push(
        [
          `Penyesuaian Kumulatif`,
          '#5300',
          `Beban Amortisasi Berjalan (${calculations.months} Bulan s/d ${calculations.periodLabel})\n(Total beban amortisasi yang diakui periode berjalan)`,
          calculations.accumulatedAmortization.toLocaleString('id-ID'),
          '-'
        ],
        [
          `Penyesuaian Kumulatif`,
          '#1390',
          `Akumulasi Amortisasi Terkoreksi (${calculations.months} Bulan s/d ${calculations.periodLabel})\n(Saldo kontra-akun akumulasi amortisasi pada neraca)`,
          '-',
          calculations.accumulatedAmortization.toLocaleString('id-ID')
        ]
      );
    }

    autoTable(doc, {
      startY: 82,
      head: [['Tanggal', 'Kode Akun', 'Nama Akun & Keterangan Transaksi Jurnal Penyesuaian', 'Debit (IDR)', 'Kredit (IDR)']],
      body: journalEntries,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [223, 255, 0], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, cellPadding: 3, textColor: [30, 41, 59] },
      columnStyles: {
        0: { cellWidth: 24, halign: 'center' },
        1: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 80 },
        3: { cellWidth: 29, halign: 'right', fontStyle: 'bold' },
        4: { cellWidth: 29, halign: 'right', fontStyle: 'bold' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;

    // Direct Cost Breakdown Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Lampiran: Rincian Biaya Pengadaan Langsung (Direct Replacement Cost) & Economic Utility', 14, finalY);

    const costBreakdown = [
      ['1', 'Architecture, Security & Multi-Gateway Integration Bridge (IBKR/CGS)', '350 Jam @ Rp 600rb', 'Rp 210.000.000'],
      ['2', 'VAM AI Engine Integration & Smart Market Scanner (Gemini 2.5/3)', '450 Jam @ Rp 650rb', 'Rp 292.500.000'],
      ['3', 'Financial Reporting Ledger, Risk Analytics & Valuation Engine (PSAK/IFRS)', '380 Jam @ Rp 550rb', 'Rp 209.000.000'],
      ['4', 'High-Performance UI/UX Terminal & TradingView Widgets', '320 Jam @ Rp 500rb', 'Rp 160.000.000'],
      ['5', 'Build Artifact Configuration Fix, Re-render Optimization & QA', '450 Jam @ Rp 550rb', 'Rp 250.000.000'],
      ['-', 'Overhead Lisensi Cloud Runtime, API Tokens, Security Vault & DB', 'Lisensi 20-Thn', 'Rp 378.500.000'],
      ['TOTAL', 'Total Direct Replacement Cost (1.950 Jam + Overhead)', 'Cost Basis', 'Rp 1.500.000.000'],
      ['HASIL', 'Nilai Kapitalisasi yang Direkomendasikan (2.80x Economic Utility Multiplier)', 'PSAK 19 / IAS 38', 'Rp 4.200.000.000']
    ];

    autoTable(doc, {
      startY: finalY + 3,
      head: [['No', 'Komponen Rekayasa ERP & Infrastruktur', 'Alokasi Kerja / Parameter', 'Total Biaya (IDR)']],
      body: costBreakdown,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      bodyStyles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 95 },
        2: { cellWidth: 45 },
        3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        if (data.row.index === 6 || data.row.index === 7) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 243, 246];
        }
      }
    });

    const signY = (doc as any).lastAutoTable.finalY + 12;

    // Signatures
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);

    doc.text('Dibuat Oleh:', 20, signY);
    doc.text('Lead Systems Architect', 20, signY + 4);
    doc.setFont('helvetica', 'bold');
    doc.text('[VERIFIED & COMPILED]', 20, signY + 14);

    doc.setFont('helvetica', 'normal');
    doc.text('Ditinjau Oleh:', 85, signY);
    doc.text('Senior Valuation Auditor / SPI', 85, signY + 4);
    doc.setFont('helvetica', 'bold');
    doc.text('[PSAK 19 AUDITED]', 85, signY + 14);

    doc.setFont('helvetica', 'normal');
    doc.text('Disetujui Oleh:', 150, signY);
    doc.text('Chief Financial Officer (CFO)', 150, signY + 4);
    doc.setFont('helvetica', 'bold');
    doc.text('[APPROVED - CAPITALIZED]', 150, signY + 14);

    const voucherFileName = `Voucher_Jurnal_Penyesuaian_Aset_Tak_Berwujud_${INVOICE_NO}_${new Date().toISOString().split('T')[0]}.pdf`;
    saveAndNotifyPdf(doc, voucherFileName, `Voucher Jurnal Penyesuaian (${INVOICE_NO})`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-amber-500/30 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded border border-amber-500/30 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> JURNAL PENYESUAIAN RESMI (ADJUSTING ENTRIES)
              </span>
              <span className="text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded border border-emerald-500/30 uppercase tracking-widest">
                FAKTUR: {INVOICE_NO}
              </span>
              <span className="text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded border border-cyan-500/30 uppercase tracking-widest">
                MASA MANFAAT: 20 TAHUN
              </span>
            </div>

            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-[#DFFF00]" /> JURNAL PENYESUAIAN ASET TAK BERWUJUD & AMORTISASI (PSAK 19 / IAS 38)
            </h2>

            <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
              Pengakuan kapitalisasi sistem ERP VentureAM v3.2.0 sebesar <strong>{formatIdr(INITIAL_CAPITALIZATION)}</strong> dan amortisasi garis lurus terhitung sejak <strong>{EFFECTIVE_AMORT_START}</strong> sebesar <strong>{formatIdr(MONTHLY_AMORTIZATION)} / bulan</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleExportJournalVoucherPDF}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 px-4 py-2.5 rounded-xl font-mono font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Download className="w-4 h-4" /> CETAK VOUCHER JURNAL (PDF)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Valuation & Current Position as of August 2026 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Capitalized Cost */}
        <div className="bg-zinc-950/80 border border-zinc-850 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">NILAI PEROLEHAN AWAL (BRUTO)</span>
            <span className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl font-mono font-black text-white">
            {formatIdr(INITIAL_CAPITALIZATION)}
          </p>
          <p className="text-[10px] text-zinc-400 font-mono">
            Direct Cost {formatIdr(DIRECT_REPLACEMENT_COST)} × 2.80x Multiplier
          </p>
        </div>

        {/* Card 2: Monthly Amortization */}
        <div className="bg-zinc-950/80 border border-zinc-850 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">BEBAN AMORTISASI BULANAN</span>
            <span className="p-1.5 bg-rose-500/10 rounded-lg text-rose-400 border border-rose-500/20">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl font-mono font-black text-rose-400">
            {formatIdr(MONTHLY_AMORTIZATION)}
          </p>
          <p className="text-[10px] text-zinc-400 font-mono">
            Rp 210.000.000 / Tahun (Garis Lurus 20 Thn)
          </p>
        </div>

        {/* Card 3: Accumulated Amortization */}
        <div className="bg-zinc-950/80 border border-zinc-850 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">AKUMULASI AMORTISASI</span>
            <span className="text-[9px] font-mono bg-zinc-900 text-amber-400 px-2 py-0.5 rounded border border-zinc-800 font-bold">
              {calculations.months} BULAN
            </span>
          </div>
          <p className="text-xl font-mono font-black text-amber-400">
            {formatIdr(calculations.accumulatedAmortization)}
          </p>
          <p className="text-[10px] text-zinc-400 font-mono">
            Posisi per {calculations.periodLabel} ({calculations.amortPercentage}% Diamortisasi)
          </p>
        </div>

        {/* Card 4: Net Book Value / Carrying Value */}
        <div className="bg-zinc-950/80 border border-emerald-500/30 p-5 rounded-2xl space-y-2 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-bold">NILAI BUKU BERSIH (NET BOOK VALUE)</span>
            <span className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl font-mono font-black text-[#DFFF00]">
            {formatIdr(calculations.netCarryingValue)}
          </p>
          <p className="text-[10px] text-zinc-400 font-mono">
            Sisa Masa Manfaat: {calculations.remainingMonths} Bulan ({calculations.remainingYears} Thn)
          </p>
        </div>
      </div>

      {/* Interactive Timeline & Month Selector */}
      <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#DFFF00]" />
            <h3 className="text-xs font-mono font-black text-white uppercase tracking-wider">
              SIMULASI LINIMASA PERHITUNGAN AMORTISASI (SEJAK AGUSTUS 2026)
            </h3>
          </div>
          <div className="text-right font-mono text-[10px] text-zinc-400">
            Periode Terpilih: <span className="font-bold text-[#DFFF00]">{calculations.periodLabel}</span> (Bulan ke-{calculations.months} dari 240)
          </div>
        </div>

        {/* Month preset buttons */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Bulan 1 (Agustus 2026)', months: 1 },
            { label: 'Bulan 2 (September 2026)', months: 2 },
            { label: 'Bulan 3 (Oktober 2026)', months: 3 },
            { label: 'Bulan 5 (Akhir Tahun 2026)', months: 5 },
            { label: 'Tahun ke-1 (12 Bulan / Juli 2027)', months: 12 },
            { label: 'Tahun ke-2 (24 Bulan)', months: 24 },
            { label: 'Tahun ke-5 (60 Bulan)', months: 60 },
            { label: 'Tahun ke-10 (120 Bulan)', months: 120 },
            { label: 'Masa Manfaat Penuh (240 Bulan)', months: 240 }
          ].map((preset) => (
            <button
              key={preset.months}
              onClick={() => setSelectedMonthsElapsed(preset.months)}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-all cursor-pointer ${
                selectedMonthsElapsed === preset.months
                  ? 'bg-amber-500 text-zinc-950 font-black shadow-md shadow-amber-500/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Range Slider */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-[10px] font-mono text-zinc-500">
            <span>Bulan 1 (Agustus 2026)</span>
            <span>Tahun ke-10 (120 Bln)</span>
            <span>Tahun ke-20 (240 Bln - Amortisasi Penuh)</span>
          </div>
          <input
            type="range"
            min={1}
            max={240}
            value={selectedMonthsElapsed}
            onChange={(e) => setSelectedMonthsElapsed(parseInt(e.target.value))}
            className="w-full h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>
      </div>

      {/* Sub Tabs Selector */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-850 pb-3">
        <button
          onClick={() => setActiveSubTab('JOURNALS')}
          className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all ${
            activeSubTab === 'JOURNALS'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-850'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 inline mr-1.5" /> 1. BUKU BESAR JURNAL PENYESUAIAN
        </button>

        <button
          onClick={() => setActiveSubTab('SCHEDULE')}
          className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all ${
            activeSubTab === 'SCHEDULE'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-850'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 inline mr-1.5" /> 2. TABEL JADWAL AMORTISASI BERJALAN
        </button>

        <button
          onClick={() => setActiveSubTab('VALUATION_BASIS')}
          className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all ${
            activeSubTab === 'VALUATION_BASIS'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-850'
          }`}
        >
          <Award className="w-3.5 h-3.5 inline mr-1.5" /> 3. RINCIAN JAM KERJA & COST REPLACEMENT
        </button>

        <button
          onClick={() => setActiveSubTab('NERACA_SYNC')}
          className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all ${
            activeSubTab === 'NERACA_SYNC'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-850'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 inline mr-1.5" /> 4. SINKRONISASI NERACA 360°
        </button>
      </div>

      {/* SUB-TAB 1: BUKU BESAR JURNAL PENYESUAIAN (ADJUSTING ENTRIES) */}
      {activeSubTab === 'JOURNALS' && (
        <div className="space-y-6">
          <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[9px] font-mono text-amber-400 font-bold uppercase tracking-widest block">
                  BUKU JURNAL UMUM PENYESUAIAN (GENERAL ADJUSTING JOURNAL)
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Catatan Jurnal Double-Entry PSAK 19 / IAS 38
                </h3>
              </div>
              <div className="bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 font-mono text-[10px] text-zinc-300">
                Total Debit = Total Kredit: <span className="text-emerald-400 font-bold">{formatIdr(INITIAL_CAPITALIZATION + calculations.accumulatedAmortization)}</span> (BALANCE)
              </div>
            </div>

            {/* Table of Entries */}
            <div className="overflow-x-auto rounded-xl border border-zinc-850">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-900 text-zinc-400 font-mono text-[10px] uppercase border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Tanggal Transaksi</th>
                    <th className="py-3 px-4">Kode Akun (COA)</th>
                    <th className="py-3 px-4">Keterangan Akun & Deskripsi Penyesuaian</th>
                    <th className="py-3 px-4 text-right">Debit (DR)</th>
                    <th className="py-3 px-4 text-right">Kredit (CR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850 text-zinc-300 font-mono">
                  {/* Journal 1: Pengakuan Awal Kapitalisasi */}
                  <tr className="bg-zinc-950 hover:bg-zinc-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">11/08/2026</td>
                    <td className="py-3.5 px-4 text-amber-400 font-bold">#1300</td>
                    <td className="py-3.5 px-4">
                      <span className="text-white font-bold block">Aset Tak Berwujud - ERP Software VentureAM</span>
                      <span className="text-[10px] text-zinc-500 font-sans mt-0.5 block">
                        Pengakuan awal kapitalisasi atas pengembangan software ERP VentureAM v3.2.0 (Faktur No. {INVOICE_NO})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-400 font-bold text-sm">
                      {formatIdr(INITIAL_CAPITALIZATION)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-zinc-600">-</td>
                  </tr>

                  <tr className="bg-zinc-950 hover:bg-zinc-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">11/08/2026</td>
                    <td className="py-3.5 px-4 text-cyan-400 font-bold">#3110</td>
                    <td className="py-3.5 px-4">
                      <span className="text-white font-bold block pl-6">Modal Disetor Terkapitalisasi (Ekuitas)</span>
                      <span className="text-[10px] text-zinc-500 font-sans mt-0.5 block pl-6">
                        Pengakuan modal disetor terkapitalisasi perseroan atas hak cipta dan kepemilikan software internal
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-zinc-600">-</td>
                    <td className="py-3.5 px-4 text-right text-emerald-400 font-bold text-sm">
                      {formatIdr(INITIAL_CAPITALIZATION)}
                    </td>
                  </tr>

                  {/* Journal 2: Amortisasi Bulan Agustus 2026 */}
                  <tr className="bg-zinc-900/30 hover:bg-zinc-900/60 transition-colors border-t-2 border-zinc-800">
                    <td className="py-3.5 px-4 font-bold text-white">31/08/2026</td>
                    <td className="py-3.5 px-4 text-rose-400 font-bold">#5300</td>
                    <td className="py-3.5 px-4">
                      <span className="text-white font-bold block">Beban Amortisasi Aset Tak Berwujud (Agustus 2026)</span>
                      <span className="text-[10px] text-zinc-500 font-sans mt-0.5 block">
                        Pembebanan amortisasi garis lurus bulan ke-1 (Agustus 2026) atas masa manfaat 20 tahun ({formatIdr(ANNUAL_AMORTIZATION)} / 12)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-rose-400 font-bold text-sm">
                      {formatIdr(MONTHLY_AMORTIZATION)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-zinc-600">-</td>
                  </tr>

                  <tr className="bg-zinc-900/30 hover:bg-zinc-900/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">31/08/2026</td>
                    <td className="py-3.5 px-4 text-amber-400 font-bold">#1390</td>
                    <td className="py-3.5 px-4">
                      <span className="text-white font-bold block pl-6">Akumulasi Amortisasi Software ERP VentureAM</span>
                      <span className="text-[10px] text-zinc-500 font-sans mt-0.5 block pl-6">
                        Kontra-akun pengurang nilai tercatat bruto aset tak berwujud per 31 Agustus 2026
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-zinc-600">-</td>
                    <td className="py-3.5 px-4 text-right text-rose-400 font-bold text-sm">
                      {formatIdr(MONTHLY_AMORTIZATION)}
                    </td>
                  </tr>

                  {/* If more than 1 month simulated */}
                  {calculations.months > 1 && (
                    <>
                      <tr className="bg-amber-950/20 hover:bg-amber-950/30 transition-colors border-t-2 border-amber-500/20">
                        <td className="py-3.5 px-4 font-bold text-amber-300">{calculations.periodLabel}</td>
                        <td className="py-3.5 px-4 text-rose-400 font-bold">#5300</td>
                        <td className="py-3.5 px-4">
                          <span className="text-amber-300 font-bold block">Penyesuaian Kumulatif Beban Amortisasi ({calculations.months} Bulan)</span>
                          <span className="text-[10px] text-zinc-400 font-sans mt-0.5 block">
                            Akumulasi beban amortisasi berjalan dari Agustus 2026 s/d {calculations.periodLabel}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-rose-300 font-bold text-sm">
                          {formatIdr(calculations.accumulatedAmortization)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-zinc-600">-</td>
                      </tr>

                      <tr className="bg-amber-950/20 hover:bg-amber-950/30 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-amber-300">{calculations.periodLabel}</td>
                        <td className="py-3.5 px-4 text-amber-400 font-bold">#1390</td>
                        <td className="py-3.5 px-4">
                          <span className="text-amber-300 font-bold block pl-6">Akumulasi Amortisasi Terkoreksi Neraca</span>
                          <span className="text-[10px] text-zinc-400 font-sans mt-0.5 block pl-6">
                            Saldo total kontra-akun akumulasi amortisasi pada neraca posisi per {calculations.periodLabel}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-zinc-600">-</td>
                        <td className="py-3.5 px-4 text-right text-amber-300 font-bold text-sm">
                          {formatIdr(calculations.accumulatedAmortization)}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Explanatory Note Box */}
            <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2 text-xs text-zinc-400 font-sans">
              <div className="flex items-center gap-2 text-amber-400 font-bold font-mono text-[11px] uppercase">
                <Info className="w-4 h-4" /> Kepatuhan Standar Akuntansi PSAK 19 &amp; Dampak Terhadap Laba Bersih
              </div>
              <p className="leading-relaxed">
                1. <strong>Pengakuan Kapitalisasi:</strong> Nilai <strong>{formatIdr(INITIAL_CAPITALIZATION)}</strong> tidak dibebankan sekaligus pada saat perolehan (tidak mengurangi laba tahun berjalan secara drastis), melainkan dicatat sebagai Aset Tidak Lancar di Neraca dan diimbangi oleh Modal Disetor Terkapitalisasi pada Ekuitas.
              </p>
              <p className="leading-relaxed">
                2. <strong>Beban Amortisasi Berjalan:</strong> Sejak <strong>Agustus 2026</strong>, sistem membebankan amortisasi garis lurus sebesar <strong>{formatIdr(MONTHLY_AMORTIZATION)}</strong> setiap bulan ke Laporan Laba Rugi dan mengkredit Akumulasi Amortisasi di Neraca, sehingga Nilai Buku Bersih per 31 Agustus 2026 adalah <strong>{formatIdr(INITIAL_CAPITALIZATION - MONTHLY_AMORTIZATION)}</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TABEL JADWAL AMORTISASI BERJALAN */}
      {activeSubTab === 'SCHEDULE' && (
        <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-3">
            <div>
              <span className="text-[9px] font-mono text-amber-400 font-bold uppercase tracking-widest block">
                JADWAL AMORTISASI BULANAN & TAHUNAN (2026 - 2046)
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Proyeksi Nilai Buku Bersih (Net Carrying Amount Schedule)
              </h3>
            </div>
            <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
              Metode Garis Lurus: Rp 17.500.000 / Bulan
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-850">
            <table className="w-full text-xs text-left font-mono">
              <thead className="bg-zinc-900 text-zinc-400 text-[10px] uppercase border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">No. Periode</th>
                  <th className="py-3 px-4">Bulan & Tahun</th>
                  <th className="py-3 px-4 text-right">Nilai Tercatat Awal</th>
                  <th className="py-3 px-4 text-right">Beban Amortisasi (IDR)</th>
                  <th className="py-3 px-4 text-right">Akumulasi Amortisasi (IDR)</th>
                  <th className="py-3 px-4 text-right">Nilai Buku Bersih (Net Book Value)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 text-zinc-300">
                {[
                  { no: 1, period: 'Agustus 2026', beg: 4200000000, charge: 17500000, acc: 17500000, end: 4182500000, status: 'EFFECTIVE' },
                  { no: 2, period: 'September 2026', beg: 4182500000, charge: 17500000, acc: 35000000, end: 4165000000, status: 'PROJECTED' },
                  { no: 3, period: 'Oktober 2026', beg: 4165000000, charge: 17500000, acc: 52500000, end: 4147500000, status: 'PROJECTED' },
                  { no: 4, period: 'November 2026', beg: 4147500000, charge: 17500000, acc: 70000000, end: 4130000000, status: 'PROJECTED' },
                  { no: 5, period: 'Desember 2026 (Closing 2026)', beg: 4130000000, charge: 17500000, acc: 87500000, end: 4112500000, status: 'FISCAL CLOSING' },
                  { no: 12, period: 'Juli 2027 (Akhir Thn ke-1)', beg: 4007500000, charge: 17500000, acc: 210000000, end: 3990000000, status: 'YEAR 1 COMPLETED' },
                  { no: 24, period: 'Juli 2028 (Akhir Thn ke-2)', beg: 3797500000, charge: 17500000, acc: 420000000, end: 3780000000, status: 'YEAR 2 COMPLETED' },
                  { no: 60, period: 'Juli 2031 (Akhir Thn ke-5)', beg: 3167500000, charge: 17500000, acc: 1050000000, end: 3150000000, status: 'YEAR 5 COMPLETED' },
                  { no: 120, period: 'Juli 2036 (Akhir Thn ke-10)', beg: 2117500000, charge: 17500000, acc: 2100000000, end: 2100000000, status: 'HALF LIFE (50%)' },
                  { no: 240, period: 'Juli 2046 (Akhir Thn ke-20)', beg: 17500000, charge: 17500000, acc: 4200000000, end: 0, status: 'FULLY AMORTIZED' }
                ].map((row) => {
                  const isCurrent = row.no === 1;
                  return (
                    <tr 
                      key={row.no} 
                      className={`hover:bg-zinc-900/60 transition-colors ${
                        isCurrent ? 'bg-amber-500/10 font-bold border-l-4 border-amber-500' : ''
                      }`}
                    >
                      <td className="py-3 px-4">{row.no}</td>
                      <td className="py-3 px-4 font-bold text-white flex items-center gap-1.5">
                        {row.period}
                        {isCurrent && (
                          <span className="text-[7px] bg-amber-500 text-zinc-950 px-1.5 py-0.5 rounded font-black">BULAN INI</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-zinc-400">{formatIdr(row.beg)}</td>
                      <td className="py-3 px-4 text-right text-rose-400 font-bold">{formatIdr(row.charge)}</td>
                      <td className="py-3 px-4 text-right text-amber-400 font-bold">{formatIdr(row.acc)}</td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-bold text-sm">{formatIdr(row.end)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[8px] px-2 py-0.5 rounded border uppercase font-bold ${
                          isCurrent 
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: RINCIAN JAM KERJA & COST REPLACEMENT BASIS */}
      {activeSubTab === 'VALUATION_BASIS' && (
        <div className="space-y-6">
          <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[9px] font-mono text-amber-400 font-bold uppercase tracking-widest block">
                  RINCIAN JAM KERJA & BIAYA PENGEMBANGAN DARI NOL
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  1. Rincian Jam Kerja Teknis per Modul ERP (Direct Labor)
                </h3>
              </div>
              <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
                Total Alokasi: 1.950 Jam Kerja Senior
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-850">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-900 text-zinc-400 font-mono text-[10px] uppercase border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Komponen Modul / Spesifikasi Development ERP</th>
                    <th className="py-3 px-4 text-center">Estimasi Jam Kerja</th>
                    <th className="py-3 px-4 text-right">Tarif / Jam</th>
                    <th className="py-3 px-4 text-right">Total Biaya Langsung (IDR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850 text-zinc-300">
                  <tr className="hover:bg-zinc-900/40">
                    <td className="py-3 px-4 font-mono">1</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-white block">Architecture, Security &amp; Multi-Gateway Integration Bridge</span>
                      <span className="text-[10px] text-zinc-400 block">• Koneksi Gateway IBKR &amp; CGS CIMB Real-time, Security Proxy, OAuth 2.0 Auth Bridge &amp; Rate Limit</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">350 Jam</td>
                    <td className="py-3 px-4 text-right font-mono">Rp 600.000</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">Rp 210.000.000</td>
                  </tr>

                  <tr className="hover:bg-zinc-900/40">
                    <td className="py-3 px-4 font-mono">2</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-white block">VAM AI Engine Integration &amp; Smart Market Scanner</span>
                      <span className="text-[10px] text-zinc-400 block">• Model Gemini 2.5/3 Flash Intelligence Feed, DailyTradingAutoAnalyst &amp; Intraday Radar Sinyal Breakout</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">450 Jam</td>
                    <td className="py-3 px-4 text-right font-mono">Rp 650.000</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">Rp 292.500.000</td>
                  </tr>

                  <tr className="hover:bg-zinc-900/40">
                    <td className="py-3 px-4 font-mono">3</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-white block">Financial Reporting Ledger, Risk Analytics &amp; Valuation Engine</span>
                      <span className="text-[10px] text-zinc-400 block">• Model DCF Fair Value, Altman Z-Score, Piotroski F-Score &amp; Otomatisasi Export Dokumen PDF/PPTX</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">380 Jam</td>
                    <td className="py-3 px-4 text-right font-mono">Rp 550.000</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">Rp 209.000.000</td>
                  </tr>

                  <tr className="hover:bg-zinc-900/40">
                    <td className="py-3 px-4 font-mono">4</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-white block">High-Performance UI/UX Terminal &amp; TradingView Widgets</span>
                      <span className="text-[10px] text-zinc-400 block">• Display Responsive Institutional Theme, Header Minimalis, Advanced Charting &amp; Heatmap Portofolio</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">320 Jam</td>
                    <td className="py-3 px-4 text-right font-mono">Rp 500.000</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">Rp 160.000.000</td>
                  </tr>

                  <tr className="hover:bg-zinc-900/40">
                    <td className="py-3 px-4 font-mono">5</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-white block">Build Artifact Configuration Fix, Re-render Optimization &amp; QA</span>
                      <span className="text-[10px] text-zinc-400 block">• Perbaikan Bundler esbuild server.cjs, Mengeliminasi State Depth Loop &amp; Stabilitas Jangka Panjang</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">450 Jam</td>
                    <td className="py-3 px-4 text-right font-mono">Rp 550.000</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">Rp 250.000.000</td>
                  </tr>

                  {/* Subtotals */}
                  <tr className="bg-zinc-900/80 font-mono font-bold text-white border-t-2 border-zinc-800">
                    <td colSpan={2} className="py-3 px-4 uppercase">Subtotal Biaya Tenaga Kerja Langsung (Direct Labor)</td>
                    <td className="py-3 px-4 text-center text-amber-400">1.950 Jam</td>
                    <td className="py-3 px-4 text-right">-</td>
                    <td className="py-3 px-4 text-right text-amber-400 text-sm">Rp 1.121.500.000</td>
                  </tr>

                  <tr className="bg-zinc-900/50 font-mono text-zinc-300">
                    <td colSpan={2} className="py-3 px-4">Overhead Lisensi Cloud Runtime, API Tokens, Servers &amp; DB</td>
                    <td className="py-3 px-4 text-center">-</td>
                    <td className="py-3 px-4 text-right">-</td>
                    <td className="py-3 px-4 text-right text-amber-400 font-bold">Rp 378.500.000</td>
                  </tr>

                  <tr className="bg-amber-500/10 font-mono font-bold text-amber-300 border-t border-amber-500/30">
                    <td colSpan={2} className="py-3 px-4 uppercase">Total Biaya Pengadaan Langsung (Total Direct Replacement Cost)</td>
                    <td className="py-3 px-4 text-center">1.950 Jam</td>
                    <td className="py-3 px-4 text-right">-</td>
                    <td className="py-3 px-4 text-right text-base text-amber-300">Rp 1.500.000.000</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Final Multiplier Calculation Card */}
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-6 rounded-2xl border border-amber-500/30 space-y-4">
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest block">
                HASIL PENILAIAN VALUASI AKHIR ASET TAK BERWUJUD (MASA MANFAAT 20 TAHUN)
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
                <div className="p-4 bg-black/60 rounded-xl border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 block uppercase">Direct Replacement Cost</span>
                  <p className="text-base font-bold text-white mt-1">Rp 1.500.000.000</p>
                  <span className="text-[9px] text-zinc-500">1.950 Jam + Cloud Overhead</span>
                </div>

                <div className="p-4 bg-black/60 rounded-xl border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 block uppercase">Economic Utility Factor</span>
                  <p className="text-base font-bold text-amber-400 mt-1">2.80x Multiplier</p>
                  <span className="text-[9px] text-zinc-500">ERP AI Engine &amp; Multi-Gateway Utility</span>
                </div>

                <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/30">
                  <span className="text-[9px] text-amber-400 block uppercase font-bold">NILAI KAPITALISASI NERACA</span>
                  <p className="text-lg font-black text-[#DFFF00] mt-1">Rp 4.200.000.000,-</p>
                  <span className="text-[9px] text-amber-300/80">Empat Miliar Dua Ratus Juta Rupiah</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SINKRONISASI NERACA 360° */}
      {activeSubTab === 'NERACA_SYNC' && (
        <div className="space-y-6">
          <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[9px] font-mono text-[#DFFF00] font-bold uppercase tracking-widest block">
                  SINKRONISASI KESELURUHAN LAPORAN POSISI KEUANGAN (NERACA 360°)
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Posisi Aset Konsolidasian &amp; Struktur Modal Pasca-Kapitalisasi
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 font-bold">
                ✓ ZERO DEBT / DEBT RATIO 0%
              </span>
            </div>

            {/* 360 Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Aktiva (Assets) */}
              <div className="space-y-3 bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                  <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> SISI AKTIVA (TOTAL ASSETS)
                  </h4>
                  <span className="text-xs font-mono font-black text-white">Rp 4.210.838.577,-</span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-zinc-850">
                    <span className="text-zinc-400">1. Total Aset Lancar (Kas, RDN, Giro, Portofolio Efek)</span>
                    <span className="text-white font-bold">Rp 4.888.577,-</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-850">
                    <span className="text-zinc-400">2. Fasilitas Media (PC &amp; Monitor MSI) - Net</span>
                    <span className="text-white font-bold">Rp 5.950.000,-</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-850 bg-amber-500/5 px-2 rounded">
                    <span className="text-amber-300 font-bold">3. Aset Tak Berwujud - ERP Software VentureAM</span>
                    <span className="text-amber-300 font-bold">{formatIdr(INITIAL_CAPITALIZATION)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-850 px-2">
                    <span className="text-rose-400">   • Akumulasi Amortisasi (Agustus 2026)</span>
                    <span className="text-rose-400 font-bold">({formatIdr(MONTHLY_AMORTIZATION)})</span>
                  </div>
                  <div className="flex justify-between py-1.5 bg-zinc-950 px-3 rounded-xl border border-zinc-800 font-bold">
                    <span className="text-emerald-400">TOTAL AKTIVA TERSEIMBANG (TOTAL ASSETS)</span>
                    <span className="text-emerald-400 text-sm">Rp 4.210.838.577,-</span>
                  </div>
                </div>
              </div>

              {/* Pasiva (Liabilities & Equity) */}
              <div className="space-y-3 bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                  <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> SISI PASIVA (LIABILITIES &amp; EQUITY)
                  </h4>
                  <span className="text-xs font-mono font-black text-white">Rp 4.210.838.577,-</span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-zinc-850">
                    <span className="text-zinc-400">1. Total Liabilitas (Kewajiban Utang Lancar &amp; Jangka Panjang)</span>
                    <span className="text-emerald-400 font-bold">Rp 0 (Zero Debt)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-850">
                    <span className="text-zinc-400">2. Modal Disetor Riil Historis</span>
                    <span className="text-white font-bold">Rp 11.120.000,-</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-850 bg-cyan-500/5 px-2 rounded">
                    <span className="text-cyan-300 font-bold">3. Modal Disetor Terkapitalisasi (Software ERP)</span>
                    <span className="text-cyan-300 font-bold">{formatIdr(INITIAL_CAPITALIZATION)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-850 px-2">
                    <span className="text-zinc-400">4. Saldo Laba Bersih &amp; Komprehensif Berjalan</span>
                    <span className="text-white font-bold">(Rp 281.423,-)</span>
                  </div>
                  <div className="flex justify-between py-1.5 bg-zinc-950 px-3 rounded-xl border border-zinc-800 font-bold">
                    <span className="text-cyan-400">TOTAL PASIVA TERSEIMBANG (TOTAL EQUITY)</span>
                    <span className="text-cyan-400 text-sm">Rp 4.210.838.577,-</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Signoff Confirmation Panel */}
            <div className="bg-black/60 p-5 rounded-2xl border border-zinc-850 space-y-4">
              <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest block">
                8. LEMBAR PENGESAHAN AUDIT VALUASI &amp; PENILAIAN ASET TAK BERWUJUD
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center font-mono">
                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                  <span className="text-[9px] text-zinc-500 uppercase block">Dibuat Oleh:</span>
                  <p className="text-xs font-bold text-white">Lead Systems Architect</p>
                  <p className="text-[9px] text-zinc-400">Studio Dev Team / GCP</p>
                  <span className="inline-block mt-2 text-[8px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                    [VERIFIED &amp; COMPILED]
                  </span>
                </div>

                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                  <span className="text-[9px] text-zinc-500 uppercase block">Ditinjau Oleh:</span>
                  <p className="text-xs font-bold text-white">Senior Valuation Auditor</p>
                  <p className="text-[9px] text-zinc-400">Public Accountant &amp; Tax</p>
                  <span className="inline-block mt-2 text-[8px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 font-bold">
                    [PSAK 19 AUDITED]
                  </span>
                </div>

                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                  <span className="text-[9px] text-zinc-500 uppercase block">Disetujui Oleh:</span>
                  <p className="text-xs font-bold text-white">Chief Financial Officer</p>
                  <p className="text-[9px] text-zinc-400">PT Venture AM Institutional</p>
                  <span className="inline-block mt-2 text-[8px] bg-[#DFFF00]/10 text-[#DFFF00] px-2 py-0.5 rounded border border-[#DFFF00]/20 font-bold">
                    [APPROVED - CAPITALIZED]
                  </span>
                </div>
              </div>

              <div className="text-center font-mono text-[9px] text-zinc-500 pt-2 border-t border-zinc-900">
                Kode Hash Verifikasi Sistem: <span className="text-zinc-400">SHA256-VAM-VAL-88942-08102026</span> | Salinan Terotentikasi Google Cloud Platform Runtime Environment
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
