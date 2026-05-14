import React, { useState, useMemo } from 'react';
import { Database, ShieldCheck, History, Search, Scale, FileSignature, CheckCircle2, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RegulatoryArchive() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);

  const initialLogs = [
    { time: '14:22:01', action: 'AES-256 Encryption Locked', system: 'GATEWAY', status: 'SECURE' },
    { time: '14:20:15', action: 'PSAK 71 Report Archived', system: 'ACCOUNTING', status: 'IMMUTABLE' },
    { time: '14:15:33', action: 'IDX Smart Socket Refresh', system: 'NETWORK', status: 'SYNCED' },
    { time: '14:05:01', action: 'OJK Regulatory Handshake', system: 'COMPLIANCE', status: 'SUCCESS' },
    { time: '13:58:12', action: 'Institutional Key Rotation', system: 'SECURITY', status: 'VERIFIED' },
    { time: '13:45:00', action: 'IFRS 9 Mapping Validated', system: 'AUDIT', status: 'PASSED' },
  ];

  const filteredLogs = useMemo(() => {
    return initialLogs.filter(log => 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.system.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleGrantAccess = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      alert('Akses Audit Eksternal (OJK/BEI) telah dibuka selama 2 jam ke depan.');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Database className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-tighter">ARSIP & AUDIT TRAIL</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Institutional Persistence Engine (Zero Trust)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH SECURE LOGS..." 
              className="bg-black/40 border border-white/5 rounded-lg pl-8 pr-4 py-2 text-[10px] font-bold text-white focus:outline-none focus:border-blue-500/50 w-64 transition-all"
            />
          </div>
          <button className="p-2 rounded-lg bg-zinc-800 border border-white/5 hover:bg-zinc-700 transition-all text-blue-400">
            <History className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-white/5 bg-zinc-950/50 overflow-hidden">
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
                      key={log.time}
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
                        No encrypted logs found matching your query.
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-white/5 bg-zinc-900/30">
            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-4 flex items-center gap-1">
              <Scale className="w-3 h-3 text-blue-400" /> REGULATORY PORTAL
            </p>
            <div className="space-y-3">
              <button 
                onClick={handleGrantAccess}
                disabled={isAuditing}
                className="w-full p-4 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all text-left shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
              >
                <Lock className="w-4 h-4 mb-2" />
                <p className="text-[10px] font-black uppercase">EXTERNAL AUDIT ACCESS</p>
                <p className="text-[8px] text-blue-100 uppercase mt-1">GRANT PERMISSION TO OJK/BEI</p>
              </button>
              
              <button 
                onClick={() => alert('Mengekspor Laporan Pajak Tahun 2026 (Format E-SPT)...')}
                className="w-full p-4 rounded-xl bg-zinc-800 border border-white/5 hover:border-blue-500/40 hover:bg-zinc-700 transition-all text-left group"
              >
                <div className="flex justify-between items-start mb-2">
                  <FileSignature className="w-4 h-4 text-zinc-500 group-hover:text-blue-400" />
                  <span className="text-[8px] text-zinc-500 font-bold bg-black/40 px-1.5 py-0.5 rounded">PDF/XML</span>
                </div>
                <p className="text-[10px] font-bold text-white uppercase">TAX COMPLIANCE EXPORT</p>
                <p className="text-[8px] text-zinc-500 uppercase mt-1">YEARLY SUMMARY (E-SPT)</p>
              </button>
            </div>
          </div>
          
          <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
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
    </div>
  );
}
