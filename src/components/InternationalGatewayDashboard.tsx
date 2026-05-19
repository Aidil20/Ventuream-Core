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
    <div className="max-w-md mx-auto space-y-3 pb-20 px-4">
      {/* Header Section */}
      <div className="flex items-center gap-3 py-3">
        <button 
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center bg-[#0a0d14] border border-white/10 rounded-lg hover:bg-zinc-800 transition-all shadow-lg"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <div className="flex flex-col">
          <h2 className="text-[15px] font-black text-white uppercase tracking-[0.1em] leading-tight">
            Gateway Internasional
          </h2>
          <p className="text-[8px] font-black text-[#DFFF00] uppercase tracking-[0.1em] mt-0.5">
            Authority: Fully Unlocked
          </p>
        </div>
      </div>

      {/* Main Container Layer (Dark Box) */}
      <div className="bg-[#03060a]/90 border border-white/5 rounded-[2.5rem] p-4 space-y-2.5 shadow-[0_0_120px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        
        {/* Active Protocol Card */}
        <div className="bg-[#0b0e16] rounded-[1.2rem] border border-white/10 p-2.5 flex items-center gap-4 shadow-2xl h-16">
          <div className="w-12 h-12 bg-[#0e121d] rounded-xl border border-white/10 flex items-center justify-center shadow-inner shrink-0">
            <Globe className="w-6 h-6 text-[#DFFF00]/90" />
          </div>
          <div className="flex flex-col justify-center">
             <h3 className="text-[17px] font-black text-white uppercase tracking-tight leading-none mb-0.5">Active Protocol</h3>
             <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Secure Institutional Gateway</p>
          </div>
        </div>

        {/* Status Connected Card */}
        <div className="bg-[#0b0e16] rounded-[1.2rem] border border-white/10 p-2.5 flex items-center gap-4 shadow-2xl h-16">
          <div className="w-12 h-12 bg-[#0e121d] rounded-xl border border-white/10 flex items-center justify-center shadow-inner shrink-0">
            <LinkIcon className="w-6 h-6 text-emerald-500/90" />
          </div>
          <div className="flex flex-col justify-center">
             <div className="flex items-center gap-2 mb-0.5">
               <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest leading-none">Status:</h3>
               <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest leading-none">Connected</span>
             </div>
             <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tight leading-none">VentureAM International Gateway</p>
          </div>
        </div>

        {/* Synchronization Bar - Sleeker Version */}
        <div className="bg-[#0b0e16] rounded-2xl border border-white/10 px-4 py-3 space-y-2 shadow-2xl">
          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.25em]">
            <span className="text-zinc-500">Synchronization</span>
            <span className="text-[#DFFF00] font-black tracking-widest">{progress}%</span>
          </div>
          <div className="h-[2px] bg-zinc-950 rounded-full overflow-hidden border border-white/5 relative">
            <motion.div 
              className="h-full bg-[#DFFF00] rounded-full shadow-[0_0_8px_#DFFF00]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>

        {/* Network Map Section */}
        <div className="bg-[#0b0e16] rounded-[2rem] border border-white/10 p-1 overflow-hidden shadow-2xl relative">
           <InternationalNetworkMap />
        </div>

        {/* Traffic Log Section */}
        <div className="bg-[#0b0e16] rounded-[1.5rem] border border-white/10 p-5 space-y-4 shadow-2xl">
          <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] pl-1">Traffic Log (Secure)</h4>
          <div className="space-y-1.5 font-mono h-[100px] overflow-hidden">
            {LOG_MESSAGES.map((log, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 text-[11px] items-baseline"
              >
                <span className="text-zinc-700 shrink-0 tabular-nums">{log.time}</span>
                <span className="text-[#DFFF00]/80 font-black shrink-0">[LOG]</span>
                <span className="text-zinc-400 font-bold leading-tight">{log.msg}</span>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default InternationalGatewayDashboard;

