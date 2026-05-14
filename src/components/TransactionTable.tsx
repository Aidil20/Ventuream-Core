import React, { useState } from 'react';
import { Transaction } from '../hooks/useTransactionManager';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const TransactionTable = ({ data }: { data: Transaction[] }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (data.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800/50">
        <p className="text-xs text-slate-500 uppercase tracking-widest">No recent transactions recorded.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/40 rounded-2xl border border-slate-800/50 overflow-hidden backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[10px]">
          <thead className="bg-slate-800/50 text-[#deff9a] uppercase tracking-tighter">
            <tr>
              <th className="p-3 font-bold w-8"></th>
              <th className="p-3 font-bold">Date</th>
              <th className="p-3 font-bold">Ticker</th>
              <th className="p-3 font-bold">Type</th>
              <th className="p-3 font-bold">Side</th>
              <th className="p-3 font-bold text-right">Qty</th>
              <th className="p-3 font-bold text-right">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {data.map((tx) => (
              <React.Fragment key={tx.id}>
                <tr 
                  onClick={() => toggleRow(tx.id)}
                  className="hover:bg-slate-800/30 transition-colors border-slate-800/50 cursor-pointer group"
                >
                  <td className="p-3">
                    <div className="text-slate-500 group-hover:text-[#deff9a] transition-colors">
                      {expandedId === tx.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </div>
                  </td>
                  <td className="p-3 text-slate-400 font-mono">
                    {new Date(tx.timestamp).toLocaleDateString([], { month: '2-digit', day: '2-digit' })}
                  </td>
                  <td className="p-3 font-bold text-slate-100">{tx.ticker}</td>
                  <td className="p-3">
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[8px] text-slate-500 font-bold uppercase">
                      {tx.assetType}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`font-bold ${tx.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.side}
                    </span>
                  </td>
                  <td className="p-3 text-right text-slate-300 font-mono">{tx.quantity.toLocaleString()}</td>
                  <td className="p-3 text-right text-slate-100 font-mono">
                    {tx.price.toLocaleString()}
                  </td>
                </tr>
                <AnimatePresence>
                  {expandedId === tx.id && (
                    <motion.tr
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-slate-900/60"
                    >
                      <td colSpan={7} className="overflow-hidden">
                        <motion.div 
                          initial={{ y: -10 }}
                          animate={{ y: 0 }}
                          className="p-4 flex gap-8 items-center border-t border-slate-800/30"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Institutional Broker</span>
                            <span className="text-xs font-bold text-[#deff9a]">{tx.broker.replace('_', ' ')}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Base Currency</span>
                            <span className="text-xs font-bold text-white">{tx.currency}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Transaction ID</span>
                            <span className="text-[9px] font-mono text-zinc-500">{tx.id}</span>
                          </div>
                        </motion.div>
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
