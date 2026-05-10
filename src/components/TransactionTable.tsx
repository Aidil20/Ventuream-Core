import React from 'react';
import { Transaction } from '../hooks/useTransactionManager';

export const TransactionTable = ({ data }: { data: Transaction[] }) => {
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
              <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors border-slate-800/50">
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
                  <span className="text-[8px] text-slate-500 mr-1">{tx.currency}</span>
                  {tx.price.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
