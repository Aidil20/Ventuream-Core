import React, { useState } from 'react';
import { FileText, Download, ShieldCheck, PenTool, Printer, Clock, Plus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DocumentExportCenter from './DocumentExportCenter';

export default function LegalDocumentCenter() {
  const [isRequesting, setIsRequesting] = useState(false);
  const [docs, setDocs] = useState([
    { id: 'SOA-001', title: 'Surat Kuasa Khusus (SoA)', status: 'READY', type: 'Legal', date: '2026-05-13' },
    { id: 'SPK-002', title: 'Surat Perintah Kerja (SPK)', status: 'DRAFT', type: 'Operational', date: '2026-05-12' },
    { id: 'NDA-003', title: 'Legal Data Extraction', status: 'PENDING', type: 'Regulatory', date: '2026-05-10' },
  ]);

  const handleRequest = () => {
    setIsRequesting(true);
    setTimeout(() => {
      const newDoc = {
        id: `REQ-00${docs.length + 1}`,
        title: 'New Legal Asset Request',
        status: 'PENDING',
        type: 'Legal',
        date: new Date().toISOString().split('T')[0]
      };
      setDocs([newDoc, ...docs]);
      setIsRequesting(false);
    }, 1500);
  };

  const handleAction = (id: string, action: string) => {
    console.log(`[Document Hub] Action: ${action} on ${id}`);
    alert(`${action} started for ${id}\n(Simulasi enkripsi AES-256 sedang berjalan...)`);
  };

  return (
    <div className="space-y-8">
      {/* Featured Document & Presentation Export Center */}
      <DocumentExportCenter />

      <div className="border-t border-zinc-800 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#deff9a] uppercase tracking-tighter flex items-center gap-2">
            <PenTool className="w-6 h-6" /> OTOMATISASI DOKUMEN HUKUM & SOAL/SPK
          </h2>
          <button 
            onClick={handleRequest}
            disabled={isRequesting}
            className="bg-[#deff9a] text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-white transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            {isRequesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            REQUEST NEW DOCUMENT
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AnimatePresence>
            {docs.map(doc => (
              <motion.div 
                key={doc.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className="p-4 rounded-xl border border-white/5 bg-zinc-900/50 hover:border-[#deff9a]/30 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#deff9a]/10 flex items-center justify-center group-hover:bg-[#deff9a]/20 transition-colors">
                    <FileText className="w-5 h-5 text-[#deff9a]" />
                  </div>
                  <div className="text-right">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black tracking-widest ${
                      doc.status === 'READY' ? 'bg-green-500/20 text-green-400' : 
                      doc.status === 'PENDING' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {doc.status}
                    </span>
                    <p className="text-[8px] text-zinc-600 font-bold mt-1 uppercase">{doc.date}</p>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white mb-1 group-hover:text-[#deff9a] transition-colors">{doc.title}</h3>
                <p className="text-[10px] text-zinc-500 mb-4 uppercase tracking-widest">{doc.id} • {doc.type}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAction(doc.id, 'DOWNLOAD')}
                    className="flex-1 py-2 rounded bg-zinc-800 text-[10px] font-bold text-zinc-400 hover:bg-[#deff9a] hover:text-black transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-3 h-3" /> PDF
                  </button>
                  <button 
                    onClick={() => handleAction(doc.id, 'PRINT')}
                    className="flex-1 py-2 rounded bg-zinc-800 text-[10px] font-bold text-zinc-400 hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
                  >
                    <Printer className="w-3 h-3" /> PRINT
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="p-4 rounded-xl border border-white/5 bg-zinc-950/30 flex items-center gap-4 mt-6">
          <ShieldCheck className="w-8 h-8 text-[#deff9a] opacity-50" />
          <div>
            <p className="text-[10px] font-black text-[#deff9a] uppercase tracking-widest leading-none mb-1">REGULATORY COMPLIANCE ACTIVE</p>
            <p className="text-[9px] text-zinc-500 uppercase tracking-tight">Semua dokumen dihasilkan sesuai dengan standar regulasi OJK & IDX (Bilingual Support Ready)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

