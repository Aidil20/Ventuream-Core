import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import jsQR from 'jsqr';
import {
  Camera,
  X,
  QrCode,
  Upload,
  Zap,
  AlertTriangle,
  FileText,
  Building,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Printer,
  ArrowRight,
  Cpu,
  Layers,
  Search
} from 'lucide-react';

export interface ScannedEntityResult {
  raw: string;
  type: 'PHYSICAL_ASSET' | 'FINANCIAL_DOC' | 'EQUITY_TICKER' | 'URL' | 'GENERAL_TEXT';
  title: string;
  subtitle: string;
  metadata: Record<string, string | number>;
  statusBadge: string;
  statusColor: 'emerald' | 'amber' | 'blue' | 'purple' | 'zinc';
  actionLabel?: string;
  actionSymbol?: string;
}

// Institutional database of Physical Fixed Assets & Financial Documents
const PHYSICAL_ASSET_DATABASE: Record<string, Omit<ScannedEntityResult, 'raw'>> = {
  'AST-VAM-SRV-01': {
    type: 'PHYSICAL_ASSET',
    title: 'HFT Ultra-Low Latency Trading Blade Server 01',
    subtitle: 'PSAK 16 Fixed Asset • Primary Order Gateway Node',
    metadata: {
      'Asset Tag ID': 'AST-VAM-SRV-01',
      'Serial Number': 'VAM-SRV-HFT-2026-X88',
      'Location': 'Cyber 2 Tower Data Center (Rack DC-01, Unit 14-16), Jakarta',
      'Custodian': 'VP Infrastructure & Low-Latency Engineering',
      'Acquisition Date': '15 Januari 2025',
      'Acquisition Cost': 'Rp 85.000.000,00',
      'Current Book Value': 'Rp 68.000.000,00',
      'Depreciation Method': 'Garis Lurus (Straight Line) - 4 Tahun',
      'Maintenance Status': 'Optimal • Uptime 99.999%',
      'Audit Standard': 'PSAK 16 / ISO 27001 Certified'
    },
    statusBadge: 'VERIFIED PHYSICAL ASSET',
    statusColor: 'emerald'
  },
  'AST-VAM-MAC-02': {
    type: 'PHYSICAL_ASSET',
    title: 'Institutional Bloomberg & CGS Terminal Workstation',
    subtitle: 'PSAK 16 Fixed Asset • High-Spec Trading Hardware',
    metadata: {
      'Asset Tag ID': 'AST-VAM-MAC-02',
      'Serial Number': 'C02X8819VAM-M3MAX',
      'Device Model': 'Apple MacBook Pro 16" M3 Max (64GB RAM / 2TB SSD)',
      'Location': 'VentureAM Trading Floor (Desk 01 - Lead Portfolio Manager)',
      'Custodian': 'President Director / Chief Investment Officer',
      'Acquisition Date': '10 Februari 2025',
      'Acquisition Cost': 'Rp 65.000.000,00',
      'Current Book Value': 'Rp 54.166.666,00',
      'Security Policy': 'Hardware Enclave & Touch ID Enforced',
      'Audit Status': 'Active In-Service'
    },
    statusBadge: 'IN-SERVICE TRADING HARDWARE',
    statusColor: 'emerald'
  },
  'AST-VAM-NET-03': {
    type: 'PHYSICAL_ASSET',
    title: 'Cisco Redundant High-Throughput Optical Core Switch',
    subtitle: 'PSAK 16 Fixed Asset • Sub-Millisecond IDX Direct Network',
    metadata: {
      'Asset Tag ID': 'AST-VAM-NET-03',
      'Serial Number': 'CSCO-CAT9300-VAM-44',
      'Location': 'Cyber 2 Tower Data Center (Rack DC-01, Unit 08), Jakarta',
      'Custodian': 'Network Operations Center (NOC)',
      'Acquisition Cost': 'Rp 42.000.000,00',
      'Current Book Value': 'Rp 35.000.000,00',
      'Throughput Bandwidth': '40 Gbps Dedicated Dark Fiber IDX Cross-Connect'
    },
    statusBadge: 'VERIFIED INFRASTRUCTURE',
    statusColor: 'emerald'
  },
  'AST-VAM-HSM-04': {
    type: 'PHYSICAL_ASSET',
    title: 'Ledger Vault FIPS-140 Hardware Security Module (HSM)',
    subtitle: 'PSAK 16 Cryptographic Custody Asset',
    metadata: {
      'Asset Tag ID': 'AST-VAM-HSM-04',
      'Serial Number': 'HSM-VAULT-2026-SEC09',
      'Location': 'Institutional Safe Vault Room (BSD HQ)',
      'Custodian': 'Chief Compliance Officer & Security Trustee',
      'Key Allocation': 'Multi-Sig 3-of-5 Institutional Cold Storage Keys',
      'Audit Compliance': 'SOC 2 Type II / FIPS 140-2 Level 3'
    },
    statusBadge: 'HIGH SECURITY VAULT',
    statusColor: 'purple'
  },
  'AST-VAM-ERP-PSAK19': {
    type: 'PHYSICAL_ASSET',
    title: 'VentureAM Core Institutional Terminal & ERP Engine',
    subtitle: 'PSAK 19 Intangible Software Asset (Aset Tak Berwujud)',
    metadata: {
      'Asset Identifier': 'AST-VAM-ERP-PSAK19',
      'Accounting Category': 'PSAK 19 Software & Algorithmic IP',
      'Audited Valuation': 'Rp 4.200.000.000,00',
      'Amortization Policy': 'Economic Useful Life 10 Years',
      'Intellectual Property': 'VentureAM Proprietary Trading Engine',
      'Audit Certification': 'WTP Audited (KAP & Institutional Registry 2026)'
    },
    statusBadge: 'PSAK 19 INTANGIBLE ASSET',
    statusColor: 'purple'
  }
};

const FINANCIAL_DOC_DATABASE: Record<string, Omit<ScannedEntityResult, 'raw'>> = {
  'DOC-VAM-Q3-2026-CLOSING': {
    type: 'FINANCIAL_DOC',
    title: 'Laporan Penutup Buku Keuangan Kuartal 3 (Q3 2026)',
    subtitle: 'PSAK & IFRS Consolidated Interim Financial Report',
    metadata: {
      'Document Ref': 'DOC-VAM-Q3-2026-CLOSING',
      'Reporting Period': '01 Juli 2026 s/d Agustus 2026 (Active Q3)',
      'Total Assets': 'Rp 4.218.420.000,00',
      'Total Equity': 'Rp 4.210.310.000,00',
      'Operating Profit YTD': 'Rp 3.448.788,20',
      'Verification Hash': 'SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      'Digital Signature': 'Institutional Director Cryptographic Seal (Valid)',
      'Standard': 'PSAK 1 (Penyajian) & SAK ETAP/IFRS'
    },
    statusBadge: 'AUTHENTIC FINANCIAL REPORT',
    statusColor: 'emerald'
  },
  'DOC-VAM-CONF-CGS-8821': {
    type: 'FINANCIAL_DOC',
    title: 'CGS International Trade Confirmation Settlement Slip',
    subtitle: 'Broker Trade Confirmation & Cash Settlement Validation',
    metadata: {
      'Trade Slip ID': 'CGS-EXEC-8821-20260818',
      'Securities Broker': 'PT CGS International Sekuritas Indonesia (Gateway Connected)',
      'Settlement Account': 'RDN Bank BCA Custody (Acc: 8820-9912-10)',
      'Gross Consideration': 'Rp 489.000,00',
      'Brokerage & IDX Levy': 'Rp 1.222,50 (0.25% All-in fee)',
      'Settlement Cycle': 'T+2 Clearing & Guarantee (KPEI Verified)',
      'Clearing Status': 'SETTLED & CONCILIATED'
    },
    statusBadge: 'OFFICIAL BROKER SETTLEMENT',
    statusColor: 'blue'
  },
  'DOC-VAM-TAX-2026-08': {
    type: 'FINANCIAL_DOC',
    title: 'Bukti Pemotongan Pajak Dividen & Transaksi Saham PPh Final',
    subtitle: 'Tax Compliance Dossier • Direktorat Jenderal Pajak RI',
    metadata: {
      'Tax Slip ID': 'BPU-PPh23/Final-VAM-202608',
      'Tax Type': 'PPh Pasal 4 Ayat 2 (Final Transaksi Saham 0.1%) & PPh 23',
      'Tax Object': 'Capital Gains & Dividend Distribution',
      'Withholding Agent': 'PT CGS International Sekuritas Indonesia',
      'Status': 'PAID & FILED (SPT Masa Pajak Terverifikasi)'
    },
    statusBadge: 'TAX COMPLIANCE VERIFIED',
    statusColor: 'amber'
  },
  'DOC-VAM-AUDIT-WTP-2025': {
    type: 'FINANCIAL_DOC',
    title: 'Laporan Auditor Independen Opini WTP (FY 2025)',
    subtitle: 'Annual Financial Audit Report • Wajar Tanpa Pengecualian',
    metadata: {
      'Report Reference': 'KAP-VAM-AUDIT-2025-WTP',
      'Auditing Firm': 'KAP Terdaftar OJK & IAPI',
      'Audit Opinion': 'Wajar Tanpa Pengecualian (Unqualified Clean Opinion)',
      'Fiscal Year': '01 Januari 2025 - 31 Desember 2025',
      'Ending Cash & Equity': 'Rp 8.271.108,69 / Modal Disetor Rp 6.196.225,05',
      'Filing Status': 'Submitted to Institutional Board'
    },
    statusBadge: 'AUDITED WTP (CLEAN)',
    statusColor: 'emerald'
  }
};

const KNOWN_TICKERS: Record<string, { name: string; category: string; price: string; change: string }> = {
  'DSSA': { name: 'Dian Swastatika Sentosa Tbk', category: 'Energy & Conglomerate', price: 'Rp 48.900', change: '+3.2%' },
  'DEFI': { name: 'Danasupra Erapacific Tbk', category: 'Financial Services', price: 'Rp 1.120', change: '+0.9%' },
  'LPKR': { name: 'Lippo Karawaci Tbk', category: 'Property & Real Estate', price: 'Rp 84', change: '-1.2%' },
  'OTAS': { name: 'DMS Propertindo Tbk', category: 'Real Estate Development', price: 'Rp 98', change: '+4.5%' },
  'ANDI': { name: 'Trimitra Propertindo Tbk', category: 'Property', price: 'Rp 75', change: '-2.1%' },
  'IPAC': { name: 'Multi Makmur Lemindo Tbk', category: 'Manufacturing & Materials', price: 'Rp 50', change: '0.0%' },
  'BBCA': { name: 'Bank Central Asia Tbk', category: 'Banking & Financial', price: 'Rp 10.325', change: '+1.5%' },
  'BBRI': { name: 'Bank Rakyat Indonesia Tbk', category: 'Banking & Microfinance', price: 'Rp 4.880', change: '+2.1%' },
  'BMRI': { name: 'Bank Mandiri (Persero) Tbk', category: 'State-Owned Banking', price: 'Rp 6.650', change: '+1.8%' },
  'BREN': { name: 'Barito Renewables Energy Tbk', category: 'Renewable Energy', price: 'Rp 8.950', change: '+6.2%' },
  'AMMN': { name: 'Amman Mineral Internasional Tbk', category: 'Mining & Copper', price: 'Rp 10.200', change: '+0.5%' },
  'TLKM': { name: 'Telkom Indonesia Tbk', category: 'Telecommunication & Cloud', price: 'Rp 2.980', change: '+1.0%' },
  'ASII': { name: 'Astra International Tbk', category: 'Automotive & Conglomerate', price: 'Rp 5.150', change: '+0.8%' },
  'ANTM': { name: 'Aneka Tambang Tbk', category: 'Gold & Nickel Mining', price: 'Rp 1.540', change: '+2.4%' },
  'BRIS': { name: 'Bank Syariah Indonesia Tbk', category: 'Islamic Banking', price: 'Rp 2.850', change: '+3.6%' },
  'GOTO': { name: 'GoTo Gojek Tokopedia Tbk', category: 'Technology Platform', price: 'Rp 54', change: '+1.9%' }
};

interface AssetQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAssetSymbol?: string;
  currentAssetName?: string;
  onSelectScannedAsset?: (symbol: string) => void;
}

export function AssetQrScannerModal({
  isOpen,
  onClose,
  currentAssetSymbol = 'DSSA',
  currentAssetName = 'Dian Swastatika Sentosa',
  onSelectScannedAsset
}: AssetQrScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'scan' | 'upload' | 'presets' | 'generate'>('scan');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [scannedResult, setScannedResult] = useState<ScannedEntityResult | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Play auditory sound on successful detection
  const playBeep = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
      if (navigator.vibrate) {
        navigator.vibrate(80);
      }
    } catch {
      // Ignored
    }
  }, []);

  // Parse raw scanned string into rich institutional entity
  const parsePayload = useCallback((raw: string): ScannedEntityResult => {
    const trimmed = raw.trim();
    const upper = trimmed.toUpperCase();

    // Check Physical Asset Database
    if (PHYSICAL_ASSET_DATABASE[upper]) {
      return {
        raw: trimmed,
        ...PHYSICAL_ASSET_DATABASE[upper]
      };
    }

    // Check Financial Document Database
    if (FINANCIAL_DOC_DATABASE[upper]) {
      return {
        raw: trimmed,
        ...FINANCIAL_DOC_DATABASE[upper]
      };
    }

    // Check if raw matches known Tickers or stock symbols
    const cleanTicker = upper.replace(/^IDX:/, '').replace(/\.JK$/, '').trim();
    if (KNOWN_TICKERS[cleanTicker]) {
      const info = KNOWN_TICKERS[cleanTicker];
      return {
        raw: trimmed,
        type: 'EQUITY_TICKER',
        title: `${info.name} (${cleanTicker})`,
        subtitle: `IDX Listed Security • ${info.category}`,
        metadata: {
          'Symbol': `IDX:${cleanTicker}`,
          'Security Name': info.name,
          'Sector Classification': info.category,
          'Last Price': info.price,
          'Daily Return': info.change,
          'Exchange': 'Indonesia Stock Exchange (IDX / BEI)',
          'Clearing & Custody': 'PT KPEI / PT KSEI Integrated'
        },
        statusBadge: 'ACTIVE EQUITY SECURITY',
        statusColor: 'emerald',
        actionLabel: `Inspect ${cleanTicker} Asset Dossier`,
        actionSymbol: cleanTicker
      };
    }

    // Check if URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return {
        raw: trimmed,
        type: 'URL',
        title: 'External Verified Web Reference',
        subtitle: trimmed,
        metadata: {
          'Target URL': trimmed,
          'Protocol': trimmed.startsWith('https') ? 'HTTPS Secure' : 'HTTP',
          'Scan Timestamp': new Date().toLocaleString('id-ID')
        },
        statusBadge: 'EXTERNAL LINK',
        statusColor: 'blue'
      };
    }

    // Check if contains structured JSON
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        const keys = Object.keys(parsed);
        const meta: Record<string, string | number> = {};
        keys.forEach(k => {
          meta[k] = typeof parsed[k] === 'object' ? JSON.stringify(parsed[k]) : String(parsed[k]);
        });
        return {
          raw: trimmed,
          type: 'GENERAL_TEXT',
          title: parsed.title || parsed.name || 'Structured Institutional Payload',
          subtitle: parsed.type || 'JSON Encoded Document',
          metadata: meta,
          statusBadge: 'STRUCTURED DATA',
          statusColor: 'purple'
        };
      } catch {
        // Fallthrough
      }
    }

    // Generic Fallback
    return {
      raw: trimmed,
      type: 'GENERAL_TEXT',
      title: `Scanned Code: ${trimmed.slice(0, 32)}${trimmed.length > 32 ? '...' : ''}`,
      subtitle: 'Raw Barcode / QR Payload',
      metadata: {
        'Raw Data': trimmed,
        'Length': `${trimmed.length} characters`,
        'Detected Encoding': 'UTF-8 / ISO-8859-1',
        'Timestamp': new Date().toLocaleString('id-ID')
      },
      statusBadge: 'SCANNED RAW DATA',
      statusColor: 'zinc'
    };
  }, []);

  const handleDetectedCode = useCallback((code: string) => {
    if (!code) return;
    playBeep();
    const result = parsePayload(code);
    setScannedResult(result);
  }, [parsePayload, playBeep]);

  const isScanningActiveRef = useRef(isScanningActive);
  isScanningActiveRef.current = isScanningActive;

  // Video Frame Scanning Loop
  const scanVideoFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanningActiveRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data) {
        handleDetectedCode(code.data);
        return;
      }
    }

    if (isScanningActiveRef.current) {
      scanLoopRef.current = requestAnimationFrame(scanVideoFrame);
    }
  }, [handleDetectedCode]);

  // Stop Camera helper
  const stopCameraInternal = useCallback(() => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
    }
    setIsScanningActive(prev => (prev ? false : prev));
    setTorchOn(prev => (prev ? false : prev));
  }, []);

  // Start Camera helper
  const startCameraInternal = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser window.');
      }

      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
        cameraStreamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      const track = stream.getVideoTracks()[0];
      const capabilities = (track && track.getCapabilities) ? (track.getCapabilities() as { torch?: boolean }) : {};
      if (capabilities.torch) {
        setHasTorch(true);
      }

      setIsScanningActive(prev => (prev ? prev : true));
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unable to initialize camera sensor.';
      console.warn('Camera sensor notice:', errorMsg);
      setCameraError(errorMsg);
      setIsScanningActive(prev => (prev ? false : prev));
    }
  }, []);

  // Toggle Torch
  const toggleTorch = async () => {
    const stream = cameraStreamRef.current;
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      try {
        const nextTorch = !torchOn;
        await (track as MediaStreamTrack & { applyConstraints: (c: Record<string, unknown>) => Promise<void> }).applyConstraints({
          advanced: [{ torch: nextTorch }]
        });
        setTorchOn(nextTorch);
      } catch (e) {
        console.warn('Torch constraint could not be applied:', e);
      }
    }
  };

  // Handle image upload scanning
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          handleDetectedCode(code.data);
        } else {
          alert('No recognizable QR code or barcode found in this image. Please try another clearer image or select from the presets.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Manage camera lifecycle
  useEffect(() => {
    if (!isOpen) {
      stopCameraInternal();
      return;
    }

    if (activeTab === 'scan' && !scannedResult) {
      startCameraInternal();
    } else {
      stopCameraInternal();
    }

    return () => {
      stopCameraInternal();
    };
  }, [isOpen, activeTab, scannedResult, startCameraInternal, stopCameraInternal]);

  // Frame scan loop
  useEffect(() => {
    if (isScanningActive && !scannedResult) {
      scanLoopRef.current = requestAnimationFrame(scanVideoFrame);
    }
    return () => {
      if (scanLoopRef.current) {
        cancelAnimationFrame(scanLoopRef.current);
      }
    };
  }, [isScanningActive, scannedResult, scanVideoFrame]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleScanAnother = () => {
    setScannedResult(null);
    if (activeTab === 'scan') {
      startCameraInternal();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]"
          >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#DFFF00]/10 border border-[#DFFF00]/20 rounded-2xl text-[#DFFF00]">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  Asset & Document QR Scanner
                </h3>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#DFFF00]/10 text-[#DFFF00] border border-[#DFFF00]/20 font-bold uppercase tracking-wider">
                  PSAK & Hardware
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                Target context: <span className="text-white font-bold">{currentAssetSymbol}</span> ({currentAssetName})
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCameraInternal();
              onClose();
            }}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-zinc-800/80 bg-zinc-900/20 px-5 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('scan'); setScannedResult(null); }}
            className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'scan'
                ? 'border-[#DFFF00] text-[#DFFF00]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
          </button>
          <button
            onClick={() => { setActiveTab('upload'); setScannedResult(null); }}
            className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'upload'
                ? 'border-[#DFFF00] text-[#DFFF00]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>
          <button
            onClick={() => { setActiveTab('presets'); setScannedResult(null); }}
            className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'presets'
                ? 'border-[#DFFF00] text-[#DFFF00]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>VAM Asset Presets</span>
          </button>
          <button
            onClick={() => { setActiveTab('generate'); }}
            className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'generate'
                ? 'border-[#DFFF00] text-[#DFFF00]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Asset Tag</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {scannedResult ? (
            <div className="space-y-4">
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl border ${
                      scannedResult.statusColor === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                      scannedResult.statusColor === 'purple' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                      scannedResult.statusColor === 'blue' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                      scannedResult.statusColor === 'amber' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                      'bg-zinc-800/50 border-zinc-700 text-zinc-300'
                    }`}>
                      {scannedResult.type === 'PHYSICAL_ASSET' ? <Cpu className="w-6 h-6" /> :
                       scannedResult.type === 'FINANCIAL_DOC' ? <FileText className="w-6 h-6" /> :
                       scannedResult.type === 'EQUITY_TICKER' ? <Building className="w-6 h-6" /> :
                       <QrCode className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          scannedResult.statusColor === 'emerald' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                          scannedResult.statusColor === 'purple' ? 'bg-purple-950 text-purple-400 border-purple-800' :
                          scannedResult.statusColor === 'blue' ? 'bg-blue-950 text-blue-400 border-blue-800' :
                          scannedResult.statusColor === 'amber' ? 'bg-amber-950 text-amber-400 border-amber-800' :
                          'bg-zinc-900 text-zinc-400 border-zinc-700'
                        }`}>
                          {scannedResult.statusBadge}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                          Type: {scannedResult.type}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-white uppercase tracking-tight">
                        {scannedResult.title}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {scannedResult.subtitle}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy(scannedResult.raw)}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700 flex items-center gap-1.5 text-[10px] font-bold uppercase transition-all"
                    title="Copy payload"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Metadata Grid */}
                <div className="bg-zinc-950/80 rounded-xl border border-zinc-800/80 p-4 divide-y divide-zinc-800/60">
                  {Object.entries(scannedResult.metadata).map(([key, val]) => (
                    <div key={key} className="py-2.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                      <span className="text-zinc-400 font-medium">{key}</span>
                      <span className="text-zinc-100 font-mono font-bold break-all text-right">{String(val)}</span>
                    </div>
                  ))}
                </div>

                {/* Scanned Actions */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-800">
                  <button
                    onClick={handleScanAnother}
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl border border-zinc-700 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Scan Another Code</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {scannedResult.type === 'EQUITY_TICKER' && scannedResult.actionSymbol && (
                      <button
                        onClick={() => {
                          if (onSelectScannedAsset && scannedResult.actionSymbol) {
                            stopCameraInternal();
                            onSelectScannedAsset(scannedResult.actionSymbol);
                            onClose();
                          }
                        }}
                        className="px-4 py-2.5 bg-[#DFFF00] hover:bg-[#cbe600] text-black rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-[#DFFF00]/10"
                      >
                        <span>Inspect {scannedResult.actionSymbol}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {scannedResult.type === 'URL' && (
                      <a
                        href={scannedResult.raw}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all"
                      >
                        <span>Open Verified Link</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {scannedResult.type === 'PHYSICAL_ASSET' && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20 font-mono font-bold">
                        <ShieldCheck className="w-4 h-4" />
                        <span>PSAK 16 Audit Verified</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: LIVE CAMERA SCANNER */}
              {activeTab === 'scan' && (
                <div className="space-y-4">
                  <div className="relative aspect-video max-h-[320px] w-full bg-black rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center">
                    {cameraError ? (
                      <div className="p-6 text-center space-y-3 max-w-md">
                        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                        <p className="text-xs text-zinc-300 font-bold leading-relaxed">{cameraError}</p>
                        <p className="text-[10px] text-zinc-500">
                          You can still use the <strong>Upload Image</strong> tab or choose from <strong>VAM Asset Presets</strong> below to test barcodes and QR codes.
                        </p>
                        <button
                          onClick={startCameraInternal}
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-700 uppercase"
                        >
                          Retry Camera
                        </button>
                      </div>
                    ) : (
                      <>
                        <video
                          ref={videoRef}
                          className="w-full h-full object-cover"
                          autoPlay
                          playsInline
                          muted
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Scanner Viewfinder Overlay */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                          <div className="relative w-52 h-52 sm:w-64 sm:h-64 border-2 border-[#DFFF00]/40 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(223,255,0,0.15)]">
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#DFFF00] shadow-[0_0_15px_#DFFF00] animate-bounce duration-1000" />
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#DFFF00] rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#DFFF00] rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#DFFF00] rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#DFFF00] rounded-br-lg" />
                          </div>
                        </div>

                        {/* Live Control Pills */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
                          <span className="text-[10px] bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-zinc-300 border border-zinc-700/60 font-mono">
                            Align QR / Barcode within frame
                          </span>
                          {hasTorch && (
                            <button
                              onClick={toggleTorch}
                              className={`p-2 rounded-xl backdrop-blur-md border transition-all text-xs font-bold flex items-center gap-1 ${
                                torchOn
                                  ? 'bg-[#DFFF00] text-black border-[#DFFF00]'
                                  : 'bg-black/60 text-zinc-300 border-zinc-700'
                              }`}
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>Flash</span>
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Manual Code Input Bar */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Or enter Asset Tag ID (e.g. AST-VAM-SRV-01, DOC-VAM-Q3-2026-CLOSING, BBCA)..."
                        value={manualCodeInput}
                        onChange={(e) => setManualCodeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && manualCodeInput.trim()) {
                            handleDetectedCode(manualCodeInput.trim());
                          }
                        }}
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#DFFF00]/50 font-mono"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (manualCodeInput.trim()) {
                          handleDetectedCode(manualCodeInput.trim());
                        }
                      }}
                      disabled={!manualCodeInput.trim()}
                      className="px-4 py-2.5 bg-[#DFFF00] hover:bg-[#cbe600] disabled:opacity-40 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all"
                    >
                      Lookup
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: UPLOAD IMAGE */}
              {activeTab === 'upload' && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-800 hover:border-[#DFFF00]/50 bg-zinc-900/30 hover:bg-zinc-900/60 transition-all rounded-2xl p-10 text-center cursor-pointer flex flex-col items-center justify-center gap-3 group"
                  >
                    <div className="p-4 rounded-full bg-zinc-800/80 text-zinc-400 group-hover:text-[#DFFF00] group-hover:scale-110 transition-all">
                      <Upload className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white uppercase tracking-tight">
                        Drop QR image here or click to browse
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Supports PNG, JPG, WebP photos of physical labels, broker slips, or invoices
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: PRESETS & SIMULATED ASSETS */}
              {activeTab === 'presets' && (
                <div className="space-y-4">
                  <p className="text-xs text-zinc-400">
                    Click any test preset to instantly preview barcode & QR code resolution across institutional categories:
                  </p>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-[#DFFF00] uppercase tracking-widest">
                      🏷️ Physical Fixed Assets (PSAK 16)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {Object.entries(PHYSICAL_ASSET_DATABASE).map(([code, item]) => (
                        <button
                          key={code}
                          onClick={() => handleDetectedCode(code)}
                          className="p-3 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl text-left transition-all group flex items-start justify-between"
                        >
                          <div>
                            <span className="text-[9px] font-mono font-bold text-[#DFFF00] bg-[#DFFF00]/10 px-2 py-0.5 rounded uppercase">
                              {code}
                            </span>
                            <p className="text-xs font-bold text-white mt-1.5 group-hover:text-[#DFFF00] transition-colors line-clamp-1">
                              {item.title}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                              {item.subtitle}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-[#DFFF00] shrink-0 mt-1" />
                        </button>
                      ))}
                    </div>

                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-4">
                      📑 Financial Documents & Regulatory Seals
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {Object.entries(FINANCIAL_DOC_DATABASE).map(([code, item]) => (
                        <button
                          key={code}
                          onClick={() => handleDetectedCode(code)}
                          className="p-3 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl text-left transition-all group flex items-start justify-between"
                        >
                          <div>
                            <span className="text-[9px] font-mono font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded uppercase">
                              {code}
                            </span>
                            <p className="text-xs font-bold text-white mt-1.5 group-hover:text-blue-400 transition-colors line-clamp-1">
                              {item.title}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                              {item.subtitle}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 shrink-0 mt-1" />
                        </button>
                      ))}
                    </div>

                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-4">
                      📈 Public Equities & Securities Barcodes
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['BBCA', 'DSSA', 'BREN', 'TLKM', 'BMRI', 'ANTM', 'ASII', 'GOTO'].map((sym) => (
                        <button
                          key={sym}
                          onClick={() => handleDetectedCode(`IDX:${sym}`)}
                          className="p-2.5 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl text-left transition-all group"
                        >
                          <span className="text-xs font-black text-white group-hover:text-[#DFFF00] block">
                            {sym}
                          </span>
                          <span className="text-[9px] text-zinc-400 font-mono">
                            {KNOWN_TICKERS[sym]?.price || 'IDX Stock'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: GENERATE & PRINT TAG FOR CURRENT ASSET */}
              {activeTab === 'generate' && (
                <div className="space-y-4">
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 text-center space-y-4">
                    <div className="inline-block p-4 bg-white rounded-2xl shadow-xl">
                      <svg
                        className="w-40 h-40"
                        viewBox="0 0 100 100"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect x="5" y="5" width="30" height="30" stroke="#09090b" strokeWidth="4" fill="white" />
                        <rect x="13" y="13" width="14" height="14" fill="#09090b" />
                        
                        <rect x="65" y="5" width="30" height="30" stroke="#09090b" strokeWidth="4" fill="white" />
                        <rect x="73" y="13" width="14" height="14" fill="#09090b" />
                        
                        <rect x="5" y="65" width="30" height="30" stroke="#09090b" strokeWidth="4" fill="white" />
                        <rect x="13" y="73" width="14" height="14" fill="#09090b" />

                        <rect x="42" y="10" width="6" height="6" fill="#09090b" />
                        <rect x="52" y="10" width="6" height="6" fill="#09090b" />
                        <rect x="42" y="22" width="6" height="6" fill="#09090b" />
                        <rect x="42" y="34" width="6" height="6" fill="#09090b" />
                        <rect x="52" y="34" width="6" height="6" fill="#09090b" />
                        <rect x="10" y="42" width="6" height="6" fill="#09090b" />
                        <rect x="22" y="42" width="6" height="6" fill="#09090b" />
                        <rect x="34" y="42" width="6" height="6" fill="#09090b" />
                        <rect x="46" y="46" width="8" height="8" fill="#09090b" />
                        <rect x="58" y="42" width="6" height="6" fill="#09090b" />
                        <rect x="70" y="42" width="6" height="6" fill="#09090b" />
                        <rect x="82" y="42" width="6" height="6" fill="#09090b" />
                        <rect x="42" y="58" width="6" height="6" fill="#09090b" />
                        <rect x="54" y="58" width="6" height="6" fill="#09090b" />
                        <rect x="66" y="58" width="6" height="6" fill="#09090b" />
                        <rect x="42" y="70" width="6" height="6" fill="#09090b" />
                        <rect x="54" y="82" width="6" height="6" fill="#09090b" />
                        <rect x="66" y="70" width="6" height="6" fill="#09090b" />
                        <rect x="78" y="70" width="6" height="6" fill="#09090b" />
                        <rect x="78" y="82" width="6" height="6" fill="#09090b" />
                        <rect x="88" y="88" width="4" height="4" fill="#09090b" />
                      </svg>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-[#DFFF00] bg-[#DFFF00]/10 px-2.5 py-1 rounded-full uppercase font-bold border border-[#DFFF00]/20">
                        TAG-VAM-{currentAssetSymbol}
                      </span>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight mt-2">
                        {currentAssetName}
                      </h4>
                      <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        Encodes: IDX:{currentAssetSymbol} • Security Classification: Tier 1
                      </p>
                    </div>

                    <div className="pt-2 flex justify-center gap-3">
                      <button
                        onClick={() => window.print()}
                        className="px-5 py-2.5 bg-[#DFFF00] hover:bg-[#cbe600] text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Print Physical Tag</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-zinc-900/60 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#DFFF00]" />
            <span>VentureAM Optical Audit & Verification Gateway</span>
          </div>
          <span>ISO 27001 / PSAK Compliant</span>
        </div>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
}
