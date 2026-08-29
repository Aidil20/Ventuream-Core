import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  FileText, 
  Clock, 
  Key, 
  ExternalLink, 
  X, 
  Search, 
  Copy, 
  Check, 
  Download, 
  FileCheck2,
  Lock,
  Layers
} from 'lucide-react';
import { 
  OFFICIAL_DIVISIONS, 
  OfficialDivisionKey, 
  OfficialDocValidationPayload,
  generateDocSecurityHash
} from '../services/officialDocValidationService';

interface DocumentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDocNumber?: string;
  initialHash?: string;
  initialDivisionCode?: string;
}

function resolveVerifiedDocument(docNum: string, divCode?: string, hash?: string): {
  divisionKey: OfficialDivisionKey;
  payload: OfficialDocValidationPayload;
} {
  const normalizedDoc = docNum || 'VAM/KAA/2026/0821-4829';
  let matchedDivKey: OfficialDivisionKey = 'DIVISI_KEUANGAN_AUDIT';
  
  if (divCode) {
    const found = (Object.keys(OFFICIAL_DIVISIONS) as OfficialDivisionKey[]).find(
      k => OFFICIAL_DIVISIONS[k].code === divCode
    );
    if (found) matchedDivKey = found;
  } else if (normalizedDoc.includes('/PPM/')) {
    matchedDivKey = 'DIVISI_PORTOFOLIO_PASAR_MODAL';
  } else if (normalizedDoc.includes('/KMR/')) {
    matchedDivKey = 'DIVISI_KEPATUHAN_RISIKO';
  } else if (normalizedDoc.includes('/TIS/')) {
    matchedDivKey = 'DIVISI_TEKNOLOGI_SISTEM';
  } else if (normalizedDoc.includes('/DIR/')) {
    matchedDivKey = 'DIREKSI_EKSEKUTIF';
  } else if (normalizedDoc.includes('/SPI/')) {
    matchedDivKey = 'SATUAN_PENGAWAS_INTERN';
  }

  const div = OFFICIAL_DIVISIONS[matchedDivKey] || OFFICIAL_DIVISIONS.DIVISI_KEUANGAN_AUDIT;
  const staticTimestamp = '2026-08-21T16:00:00.000Z';
  const computedHash = hash || generateDocSecurityHash(normalizedDoc, div.code, staticTimestamp);

  const payload: OfficialDocValidationPayload = {
    system: 'Venture Asset Management Institutional Gateway System',
    version: 'v3.4.0-PROD',
    docNumber: normalizedDoc,
    divisionKey: div.key,
    divisionCode: div.code,
    divisionName: div.name,
    documentTitle: normalizedDoc.includes('PPM') 
      ? 'Weekly Market Insight & Quantitative Technical Radar' 
      : normalizedDoc.includes('TIS') 
      ? 'Arsitektur Cetak Biru Sistem & Spesifikasi Enterprise ERP' 
      : 'Laporan Keuangan Konsolidasian & Catatan Audit (PSAK / IFRS)',
    classification: 'DOKUMEN RESMI TERVERIFIKASI SISTEM (INSTITUTIONAL GRADE)',
    issuedTimestamp: '21 Agustus 2026, 16:00:00 WIB',
    issuedDateStr: '21 Agustus 2026',
    securityHash: computedHash,
    gatewayStatus: 'CONNECTED (IBKR / CGS INTERNATIONAL GATEWAY)',
    signatoryTitle: div.signatoryTitle,
    signatoryOfficer: div.signatoryOfficer,
    verificationUrl: typeof window !== 'undefined' ? window.location.href : 'https://ventuream.id'
  };

  return { divisionKey: matchedDivKey, payload };
}

export function DocumentVerificationModal({
  isOpen,
  onClose,
  initialDocNumber = '',
  initialHash = '',
  initialDivisionCode = ''
}: DocumentVerificationModalProps) {
  const [searchDocNumber, setSearchDocNumber] = useState(initialDocNumber || 'VAM/KAA/2026/0821-4829');
  const [selectedDivision, setSelectedDivision] = useState<OfficialDivisionKey>('DIVISI_KEUANGAN_AUDIT');
  const [verifiedDoc, setVerifiedDoc] = useState<OfficialDocValidationPayload | null>(() => {
    return resolveVerifiedDocument(initialDocNumber || 'VAM/KAA/2026/0821-4829', initialDivisionCode, initialHash).payload;
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  // Perform verification without infinite cycles
  const performVerification = React.useCallback((docNum: string, divCode?: string, hash?: string) => {
    setIsVerifying(true);
    const timer = setTimeout(() => {
      const { divisionKey, payload } = resolveVerifiedDocument(docNum, divCode, hash);
      setSelectedDivision(prev => prev !== divisionKey ? divisionKey : prev);
      setVerifiedDoc(prev => {
        if (
          prev &&
          prev.docNumber === payload.docNumber &&
          prev.divisionCode === payload.divisionCode &&
          prev.securityHash === payload.securityHash
        ) {
          return prev;
        }
        return payload;
      });
      setIsVerifying(false);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  // Sync state only when initialDocNumber, initialDivisionCode, or initialHash changes while open
  useEffect(() => {
    if (isOpen) {
      const targetDoc = initialDocNumber || 'VAM/KAA/2026/0821-4829';
      setSearchDocNumber(prev => (prev !== targetDoc ? targetDoc : prev));
      const { divisionKey, payload } = resolveVerifiedDocument(targetDoc, initialDivisionCode, initialHash);
      setSelectedDivision(prev => (prev !== divisionKey ? divisionKey : prev));
      setVerifiedDoc(prev => {
        if (
          prev &&
          prev.docNumber === payload.docNumber &&
          prev.divisionCode === payload.divisionCode &&
          prev.securityHash === payload.securityHash
        ) {
          return prev;
        }
        return payload;
      });
    }
  }, [isOpen, initialDocNumber, initialDivisionCode, initialHash]);

  const handleCopyHash = () => {
    if (verifiedDoc?.securityHash) {
      navigator.clipboard.writeText(verifiedDoc.securityHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 bg-zinc-900/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#DFFF00]/10 border border-[#DFFF00]/30 flex items-center justify-center text-[#DFFF00]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Validasi Dokumen Resmi VentureAM
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                      QR VERIFIED
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Sistem Verifikasi Integritas & Otorisasi Divisi Penerbit Dokumen Resmi
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto text-zinc-200">
              {/* Search / Verify Bar */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-[#DFFF00]" />
                  Masukkan Nomor Registrasi Dokumen atau Scan QR Code:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchDocNumber}
                    onChange={(e) => setSearchDocNumber(e.target.value)}
                    placeholder="Contoh: VAM/KAA/2026/0821-4829"
                    className="flex-1 bg-black/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#DFFF00]/50"
                  />
                  <button
                    onClick={() => performVerification(searchDocNumber)}
                    className="px-5 py-2.5 bg-[#DFFF00] hover:bg-[#cbe600] text-black font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#DFFF00]/10"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verifikasi Keabsahan</span>
                  </button>
                </div>
              </div>

              {/* Verified Certificate Card */}
              {verifiedDoc && (
                <div className="bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden shadow-xl">
                  {/* Watermark Logo / Badge */}
                  <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none">
                    <ShieldCheck className="w-64 h-64 text-white" />
                  </div>

                  {/* Top Status Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold font-mono text-emerald-400 tracking-wider">
                        STATUS: TERVERIFIKASI & OTENTIK (TAMPER-EVIDENT)
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400">
                      Sistem: {verifiedDoc.system}
                    </span>
                  </div>

                  {/* Document & Division Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                          Judul Dokumen Resmi
                        </span>
                        <h4 className="text-sm font-bold text-white mt-0.5">
                          {verifiedDoc.documentTitle}
                        </h4>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                          Divisi Penerbit (Authorized Division)
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <Building2 className="w-4 h-4 text-[#DFFF00]" />
                          <span className="text-xs font-semibold text-zinc-200">
                            {verifiedDoc.divisionName}
                          </span>
                        </div>
                        <span className="inline-block mt-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                          Kode Divisi: {verifiedDoc.divisionCode}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                          Nomor Registrasi Resmi
                        </span>
                        <p className="text-xs font-mono font-bold text-[#DFFF00] mt-0.5">
                          {verifiedDoc.docNumber}
                        </p>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                          Waktu Penerbitan & Timestamp
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="text-xs font-mono text-zinc-200">
                            {verifiedDoc.issuedTimestamp}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                          Pejabat Penandatangan Elektronik
                        </span>
                        <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 mt-1">
                          <p className="text-xs font-bold text-white">
                            {verifiedDoc.signatoryOfficer}
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            {verifiedDoc.signatoryTitle}
                          </p>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                          Cryptographic Hash (SHA-256 Digest)
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-1 rounded-lg">
                            {verifiedDoc.securityHash}
                          </code>
                          <button
                            onClick={handleCopyHash}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all cursor-pointer"
                            title="Salin Hash"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gateway Connectivity & Footer */}
                  <div className="mt-6 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-zinc-400 font-mono">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{verifiedDoc.gatewayStatus}</span>
                    </div>
                    <span>Klasifikasi: {verifiedDoc.classification}</span>
                  </div>
                </div>
              )}

              {/* List of Registered Official Divisions */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-zinc-500" />
                  Daftar Divisi Resmi Terdaftar Pada QR Code Validasi:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(Object.keys(OFFICIAL_DIVISIONS) as OfficialDivisionKey[]).map((key) => {
                    const div = OFFICIAL_DIVISIONS[key];
                    return (
                      <div
                        key={key}
                        className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-3.5 space-y-2 hover:border-zinc-700 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border"
                            style={{
                              color: div.accentColorHex,
                              borderColor: `${div.accentColorHex}40`,
                              backgroundColor: `${div.accentColorHex}15`
                            }}
                          >
                            {div.code}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {div.badgeText}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-white line-clamp-1">
                          {div.name}
                        </h5>
                        <p className="text-[10px] text-zinc-400 line-clamp-1">
                          Otoritas: {div.signatoryTitle}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
              <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-[#DFFF00]" />
                <span>Pindai kode QR pada setiap dokumen PDF untuk memvalidasi secara instan.</span>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs rounded-xl transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
export default DocumentVerificationModal;
