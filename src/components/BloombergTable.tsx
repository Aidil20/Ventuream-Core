import React from 'react';
import './BloombergStyle.css';
import { BrainCircuit } from 'lucide-react';

interface PortfolioItem {
    ticker: string;
    lots: number;
    averagePrice: number;
    currentPrice: number;
    change: number;
    marketValue: number;
    unrealized: number;
    dailyChange?: number;
}

interface BloombergTableProps {
    portfolioData: PortfolioItem[];
    onSelectSymbol?: (symbol: string) => void;
    onFundamentalAudit?: (symbol: string) => void;
}

const BloombergTable: React.FC<BloombergTableProps> = ({ portfolioData, onSelectSymbol, onFundamentalAudit }) => {
    return (
        <div className="bloomberg-terminal mt-6 border border-zinc-800/80 bg-[#020407] rounded-[2rem] p-6">
            <div className="terminal-header border-b border-zinc-900 pb-4 mb-4 flex justify-between items-center">
                <div className="text-[#DFFF00] font-black tracking-widest text-lg uppercase flex items-center gap-2">
                    PORTFOLIO MONITOR
                    <span className="text-[8px] bg-[#DFFF00]/10 text-[#DFFF00] px-1.5 py-0.5 rounded border border-[#DFFF00]/20 whitespace-nowrap">TV_CORE_SYNC</span>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    REAL-TIME INSTITUTIONAL FEED
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="portfolio-table border-collapse w-full">
                    <thead>
                        <tr className="border-b border-zinc-900">
                            <th className="text-zinc-500 text-[10px] font-black tracking-widest uppercase">Security</th>
                            <th className="text-zinc-500 text-[10px] font-black tracking-widest uppercase">Position</th>
                            <th className="text-zinc-500 text-[10px] font-black tracking-widest uppercase">Avg Price</th>
                            <th className="text-zinc-500 text-[10px] font-black tracking-widest uppercase">Last Price</th>
                            <th className="text-zinc-500 text-[10px] font-black tracking-widest uppercase">Since Buy %</th>
                            <th className="text-zinc-500 text-[10px] font-black tracking-widest uppercase">Compare with Yesterday</th>
                            <th className="text-zinc-500 text-[10px] font-black tracking-widest uppercase">Mkt Value (IDR)</th>
                            <th className="text-right text-zinc-500 text-[10px] font-black tracking-widest uppercase">Unrealized P&L</th>
                            <th className="text-center text-zinc-500 text-[10px] font-black tracking-widest uppercase">Audit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {portfolioData.map((item) => {
                            const plPercentage = (item.unrealized / (item.averagePrice * item.lots * 100)) * 100;
                            const ticker = item.ticker.replace('.JK', '');
                            
                            // Compare with Yesterday Calculations
                            const dailyChg = typeof item.dailyChange === 'number' ? item.dailyChange : 0;
                            const yesterdayMktVal = dailyChg === -100 ? 0 : item.marketValue / (1 + (dailyChg / 100));
                            const mktValDiff = item.marketValue - yesterdayMktVal;
                            const isDailyGain = dailyChg >= 0;

                            return (
                                <tr key={item.ticker} className="border-b border-zinc-900/40 hover:bg-white/[0.01]">
                                    <td 
                                        className="ticker-cell group relative cursor-pointer hover:bg-[#DFFF00]/5 transition-colors font-black text-white py-3"
                                        onClick={() => onSelectSymbol?.(`IDX:${ticker}`)}
                                    >
                                        {ticker}
                                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#DFFF00] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </td>
                                    <td className="text-zinc-300 font-medium py-3">{item.lots} LOT</td>
                                    <td className="text-zinc-400 font-mono text-[11px] py-3">
                                        {typeof item.averagePrice === 'number' ? item.averagePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : 'N/A'}
                                    </td>
                                    <td id={`price-${ticker}`} className={`font-mono py-3 font-semibold ${item.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                        {typeof item.currentPrice === 'number' ? item.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : 'N/A'}
                                    </td>
                                    <td className={`font-mono text-[11px] py-3 ${item.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                        <div className="flex items-center gap-1">
                                            {item.change >= 0 ? '▲' : '▼'}
                                            {Math.abs(item.change).toFixed(2)}%
                                        </div>
                                    </td>
                                    <td className={`font-mono text-[11px] py-3 ${isDailyGain ? "text-emerald-400" : "text-rose-400"}`}>
                                        <div className="flex flex-col justify-center">
                                            <div className="flex items-center gap-1 font-bold">
                                                {isDailyGain ? '▲' : '▼'}
                                                {isDailyGain ? '+' : ''}{dailyChg.toFixed(2)}%
                                            </div>
                                            <span className="text-[9px] text-zinc-400 font-medium">
                                                {mktValDiff >= 0 ? '+' : ''}{Math.round(mktValDiff).toLocaleString('id-ID')} IDR
                                            </span>
                                        </div>
                                    </td>
                                    <td className="font-mono text-[#deff9a] font-bold py-3">
                                        {typeof item.marketValue === 'number' ? item.marketValue.toLocaleString('id-ID') : '0'}
                                    </td>
                                    <td className={`text-right font-mono py-3 ${item.unrealized >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                        <div className="flex items-end flex-col">
                                            <span className="font-bold">{item.unrealized >= 0 ? '+' : ''}{typeof item.unrealized === 'number' ? item.unrealized.toLocaleString('id-ID') : '0'}</span>
                                            <span className="text-[9px] opacity-80 font-medium">({plPercentage >= 0 ? '+' : ''}{plPercentage.toFixed(2)}%)</span>
                                        </div>
                                    </td>
                                    <td className="text-center py-3">
                                        <button 
                                          onClick={() => onFundamentalAudit?.(ticker)}
                                          className="p-1.5 hover:bg-[#DFFF00]/10 rounded-lg text-[#DFFF00]/40 hover:text-[#DFFF00] transition-all"
                                          title="Deep AI Audit"
                                        >
                                          <BrainCircuit className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="border-t border-zinc-800">
                        <tr>
                            <td colSpan={5} className="py-4 font-black text-[#DFFF00] text-[10px] uppercase tracking-[0.2em]">Total Portfolio Aggregation</td>
                            <td className="font-mono py-4">
                                {(() => {
                                    const totalYesterdayMktVal = portfolioData.reduce((acc, curr) => {
                                        const dailyChg = typeof curr.dailyChange === 'number' ? curr.dailyChange : 0;
                                        const yesterdayVal = dailyChg === -100 ? 0 : curr.marketValue / (1 + (dailyChg / 100));
                                        return acc + yesterdayVal;
                                    }, 0);
                                    const totalCurrentMktVal = portfolioData.reduce((acc, curr) => acc + curr.marketValue, 0);
                                    const totalMktValDiff = totalCurrentMktVal - totalYesterdayMktVal;
                                    const totalYesterdayPercent = totalYesterdayMktVal === 0 ? 0 : (totalMktValDiff / totalYesterdayMktVal) * 105; // Weighted proxy or arithmetic
                                    const overallDailyChgPct = totalYesterdayMktVal === 0 ? 0 : (totalMktValDiff / totalYesterdayMktVal) * 100;
                                    const isAggrGain = totalMktValDiff >= 0;

                                    return (
                                        <div className={`flex flex-col text-left ${isAggrGain ? "text-emerald-400" : "text-rose-400"}`}>
                                            <span className="font-bold text-[11px]">
                                                {isAggrGain ? '▲' : '▼'} {isAggrGain ? '+' : ''}{overallDailyChgPct.toFixed(2)}%
                                            </span>
                                            <span className="text-[9px] text-zinc-400 font-medium">
                                                {isAggrGain ? '+' : ''}{Math.round(totalMktValDiff).toLocaleString('id-ID')} IDR
                                            </span>
                                        </div>
                                    );
                                })()}
                            </td>
                            <td className="font-mono font-bold text-[#deff9a] py-4 text-left">
                                {(() => {
                                    const total = portfolioData.reduce((acc, curr) => acc + curr.marketValue, 0);
                                    return typeof total === 'number' ? total.toLocaleString('id-ID') : '0';
                                })()}
                            </td>
                            <td className={`text-right font-mono font-bold py-4 ${portfolioData.reduce((acc, curr) => acc + curr.unrealized, 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                {(() => {
                                    const totalPL = portfolioData.reduce((acc, curr) => acc + curr.unrealized, 0);
                                    return (totalPL >= 0 ? '+' : '') + (typeof totalPL === 'number' ? totalPL.toLocaleString('id-ID') : '0');
                                })()}
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <div className="mt-4 text-[9px] text-zinc-500 font-mono tracking-wider uppercase italic">
                *REAL-TIME DATA - SOURCE: IDX MARKET DATA (VIA MARKETSTACK + VAM GATEWAY)
            </div>
        </div>
    );
};

export default BloombergTable;
