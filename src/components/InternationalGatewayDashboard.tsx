import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Globe, Link as LinkIcon, ChevronLeft } from 'lucide-react';

import { InternationalNetworkMap } from './NetworkMap';

const LOG_MESSAGES = [
  { time: "[13:58:12]", msg: "Primary Route Established" },
  { time: "[13:58:15]", msg: "Conn: VentureAM Int'l Gateway Verified" },
  { time: "[13:58:20]", msg: "Sync Confirmed - LDN Node" },
  { time: "[13:58:25]", msg: "Secure Tunnel Active" },
  { time: "[13:58:30]", msg: "New York Terminal Sync Complete" },
  { time: "[13:58:35]", msg: "Multi-Point Path Optimization" }
];

export const InternationalGatewayDashboard: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const step = () => {
        if (current < 100) {
          current += 1;
          setProgress(current);
          requestAnimationFrame(step);
        }
      };
      step();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4">
      {/* Header Section */}
      <div className="flex items-center justify-between pt-4 mb-6">
        <div className="flex items-center gap-5">
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center bg-zinc-900/50 border border-zinc-800/60 rounded-xl hover:bg-zinc-800 transition-all shadow-lg"
          >
            <ChevronLeft className="w-5 h-5 text-[#DFFF00]" />
          </button>
          <div className="flex flex-col text-left">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-tight">
              Institutional Gateway
            </h2>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-1">
              Cross-Border Execution Protocol
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-[#DFFF00]/10 rounded-2xl border border-[#DFFF00]/20">
           <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
           <span className="text-[10px] font-black text-[#DFFF00] uppercase tracking-widest">Gateway Operational</span>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gateway Selection Section */}
        <div className="space-y-6">
          <div className="bg-[#05070a] rounded-[2rem] border border-zinc-800/40 p-6 space-y-5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 bg-[#DFFF00]/5 blur-3xl rounded-full -mr-8 -mt-8 group-hover:bg-[#DFFF00]/10 transition-all"></div>
            <div className="relative z-10">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Primary Gateways</h3>
              <div className="space-y-3">
                {[
                  { id: 'ibkr', name: 'IBKR Global', region: 'US/EU Markets', status: 'Connected' },
                  { id: 'cgs', name: 'CGS International', region: 'ASEAN Markets', status: 'Connected' },
                  { id: 'vam', name: 'VAM Direct Link', region: 'IDX/Global', status: 'Operational' }
                ].map((gate) => (
                  <button 
                    key={gate.id}
                    className="w-full p-3.5 bg-zinc-900/40 rounded-2xl border border-zinc-800/80 hover:border-[#DFFF00]/30 hover:bg-zinc-900/60 transition-all flex items-center justify-between group/gate"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover/gate:text-[#DFFF00] transition-colors">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-[12px] font-black text-white uppercase tracking-tight">{gate.name}</p>
                        <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-tight">{gate.region}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className={`text-[7px] font-black uppercase tracking-widest border px-2 py-0.5 rounded-md ${
                         gate.status === 'Operational' || gate.status === 'Connected' 
                         ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' 
                         : 'text-zinc-600 border-zinc-800'
                       }`}>
                         {gate.status}
                       </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Connection Stats */}
          <div className="bg-zinc-900/40 rounded-[2rem] border border-zinc-800/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Network Integrity</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[7px] font-black text-zinc-600 uppercase tracking-tighter">Latency (Global)</p>
                <p className="text-base font-black text-[#DFFF00] font-mono">18 ms</p>
              </div>
              <div className="space-y-0.5 text-right">
                <p className="text-[7px] font-black text-zinc-600 uppercase tracking-tighter">Throughput</p>
                <p className="text-base font-black text-white font-mono">1.24 GB/s</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Feed Section */}
        <div className="space-y-6">
          {/* Map Visualization */}
          <InternationalNetworkMap />

          {/* Terminal Log */}
          <div className="bg-[#020407] rounded-[2.5rem] border border-zinc-800/40 p-8 space-y-4 font-mono shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
               <div className="w-2 h-2 rounded-full bg-zinc-800" />
            </div>
            <h4 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4">System Handshake Log</h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-hide">
              {LOG_MESSAGES.map((log, i) => (
                <div key={i} className="flex gap-4 text-[9px]">
                  <span className="text-zinc-500 shrink-0">{log.time}</span>
                  <span className="text-[#DFFF00] font-black shrink-0">[LOG]</span>
                  <span className="text-zinc-300 font-medium">{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternationalGatewayDashboard;

