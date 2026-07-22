import React, { useState, useMemo } from 'react';
import { Transaction } from '../hooks/useTransactionManager';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Download, Search, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export const TransactionTable = ({ data }: { data: Transaction[] }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sideFilter, setSideFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [brokerFilter, setBrokerFilter] = useState<'ALL' | 'CGS_INTERNATIONAL' | 'IBKR'>('ALL');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'date' | 'ticker' | 'price'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: 'date' | 'ticker' | 'price') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'date' ? 'desc' : 'asc');
    }
  };

  const toggleRow = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    data.forEach(tx => {
      try {
        const year = new Date(tx.timestamp).getFullYear().toString();
        if (year && !isNaN(Number(year))) {
          years.add(year);
        }
      } catch (e) {}
    });
    // Ensure '2026' is available as an option
    years.add('2026');
    return ['ALL', ...Array.from(years).sort((a, b) => b.localeCompare(a))];
  }, [data]);

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = data.filter(tx => {
      const matchesSearch = !query || 
                            tx.ticker.toLowerCase().includes(query) || 
                            tx.broker.toLowerCase().includes(query) ||
                            tx.broker.replace(/_/g, ' ').toLowerCase().includes(query) ||
                            tx.id.toLowerCase().includes(query) ||
                            (tx.assetType && tx.assetType.toLowerCase().includes(query)) ||
                            (tx.side && tx.side.toLowerCase().includes(query));
      const matchesSide = sideFilter === 'ALL' || tx.side === sideFilter;
      const matchesBroker = brokerFilter === 'ALL' || tx.broker === brokerFilter;
      
      let matchesYear = true;
      if (yearFilter !== 'ALL') {
        try {
          const txYear = new Date(tx.timestamp).getFullYear().toString();
          matchesYear = txYear === yearFilter;
        } catch (e) {
          matchesYear = false;
        }
      }

      return matchesSearch && matchesSide && matchesBroker && matchesYear;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        comparison = timeA - timeB;
      } else if (sortField === 'ticker') {
        comparison = a.ticker.localeCompare(b.ticker);
      } else if (sortField === 'price') {
        const priceA = typeof a.price === 'number' ? a.price : parseFloat(String(a.price).replace(/,/g, '')) || 0;
        const priceB = typeof b.price === 'number' ? b.price : parseFloat(String(b.price).replace(/,/g, '')) || 0;
        comparison = priceA - priceB;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, searchQuery, sideFilter, brokerFilter, yearFilter, sortField, sortDirection]);

  const exportToCSV = () => {
    const headers = ['Transaction ID', 'Date & Time', 'Asset Type', 'Ticker', 'Side', 'Quantity', 'Price', 'Currency', 'Broker'];
    
    // Sort chronologically (oldest to newest) for a clean chronological history ledger
    const sortedForExport = [...filteredData].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const rows = sortedForExport.map(tx => [
      tx.id,
      new Date(tx.timestamp).toISOString(),
      tx.assetType,
      tx.ticker,
      tx.side,
      tx.quantity,
      tx.price,
      tx.currency,
      tx.broker
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ventuream_gateway_transactions_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/40 rounded-2xl border border-slate-800/50 overflow-hidden backdrop-blur-sm space-y-4 p-4">
      {/* Filters and search header */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by ticker or broker name (e.g. BBCA, IBKR, CGS)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-[11px] font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#deff9a]/40 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white transition-colors"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Side Filter */}
          <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            {(['ALL', 'BUY', 'SELL'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSideFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-bold tracking-widest transition-all ${sideFilter === s ? 'bg-[#deff9a] text-slate-950' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Broker Filter */}
          <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            {(['ALL', 'CGS_INTERNATIONAL', 'IBKR'] as const).map(b => (
              <button
                key={b}
                onClick={() => setBrokerFilter(b)}
                className={`px-2 py-1 rounded-lg text-[9px] font-bold tracking-widest transition-all ${brokerFilter === b ? 'bg-[#deff9a] text-slate-950' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {b === 'ALL' ? 'ALL' : b === 'CGS_INTERNATIONAL' ? 'CGS' : 'IBKR'}
              </button>
            ))}
          </div>

          {/* Year Filter */}
          <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            {availableYears.map(yr => (
              <button
                key={yr}
                onClick={() => setYearFilter(yr)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-bold tracking-widest transition-all ${yearFilter === yr ? 'bg-[#deff9a] text-slate-950' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {yr}
              </button>
            ))}
          </div>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 p-2 px-3 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 rounded-xl text-[10px] font-bold text-slate-300 transition-all uppercase tracking-wider"
            title="Export to CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#deff9a]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/40">
          <p className="text-xs text-slate-500 uppercase tracking-widest">No matching transactions found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800/30">
          <table className="w-full text-left text-[10px]">
            <thead className="bg-slate-950/80 text-[#deff9a] uppercase tracking-tighter border-b border-slate-800 select-none">
              <tr>
                <th className="p-3 font-bold w-8"></th>
                <th 
                  onClick={() => handleSort('date')}
                  className="p-3 font-bold cursor-pointer hover:text-white transition-colors"
                  title="Sort by Date"
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    {sortField === 'date' ? (
                      sortDirection === 'asc' ? <ArrowUp size={12} className="text-[#deff9a]" /> : <ArrowDown size={12} className="text-[#deff9a]" />
                    ) : (
                      <ArrowUpDown size={11} className="opacity-40 text-slate-400 group-hover:opacity-100" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('ticker')}
                  className="p-3 font-bold cursor-pointer hover:text-white transition-colors"
                  title="Sort by Ticker"
                >
                  <div className="flex items-center gap-1">
                    <span>Ticker</span>
                    {sortField === 'ticker' ? (
                      sortDirection === 'asc' ? <ArrowUp size={12} className="text-[#deff9a]" /> : <ArrowDown size={12} className="text-[#deff9a]" />
                    ) : (
                      <ArrowUpDown size={11} className="opacity-40 text-slate-400 group-hover:opacity-100" />
                    )}
                  </div>
                </th>
                <th className="p-3 font-bold">Type</th>
                <th className="p-3 font-bold">Side</th>
                <th className="p-3 font-bold text-right">Qty</th>
                <th 
                  onClick={() => handleSort('price')}
                  className="p-3 font-bold text-right cursor-pointer hover:text-white transition-colors"
                  title="Sort by Price"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Price</span>
                    {sortField === 'price' ? (
                      sortDirection === 'asc' ? <ArrowUp size={12} className="text-[#deff9a]" /> : <ArrowDown size={12} className="text-[#deff9a]" />
                    ) : (
                      <ArrowUpDown size={11} className="opacity-40 text-slate-400 group-hover:opacity-100" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {filteredData.map((tx, idx) => (
                <React.Fragment key={`${tx.id}-${idx}`}>
                  <tr 
                    onClick={() => toggleRow(tx.id)}
                    className="hover:bg-slate-800/20 transition-colors border-slate-800/30 cursor-pointer group"
                  >
                    <td className="p-3">
                      <div className="text-slate-500 group-hover:text-[#deff9a] transition-colors">
                        {expandedId === tx.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono">
                      {new Date(tx.timestamp).toLocaleString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 font-bold text-slate-100">{tx.ticker}</td>
                    <td className="p-3">
                      <span className="bg-slate-950 border border-slate-800/80 px-1.5 py-0.5 rounded text-[8px] text-slate-500 font-bold uppercase">
                        {tx.assetType}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`font-bold ${
                        tx.side === 'BUY' ? 'text-green-400' : 
                        tx.side === 'SELL' ? 'text-red-400' : 
                        'text-amber-500'
                      }`}>
                        {tx.side.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-right text-slate-300 font-mono">
                      {typeof tx.quantity === 'number' ? tx.quantity.toLocaleString() : tx.quantity}
                    </td>
                    <td className="p-3 text-right text-slate-100 font-mono">
                      {typeof tx.price === 'number' ? tx.price.toLocaleString() : tx.price}
                    </td>
                  </tr>
                  <AnimatePresence>
                    {expandedId === tx.id && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-slate-950/40"
                      >
                        <td colSpan={7} className="overflow-hidden">
                          <motion.div 
                            initial={{ y: -10 }}
                            animate={{ y: 0 }}
                            className="p-4 flex gap-8 items-center border-t border-slate-800/30 text-[10px]"
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
      )}
    </div>
  );
};
