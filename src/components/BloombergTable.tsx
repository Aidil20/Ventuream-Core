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
}

interface BloombergTableProps {
    portfolioData: PortfolioItem[];
    onSelectSymbol?: (symbol: string) => void;
    onFundamentalAudit?: (symbol: string) => void;
}

const BloombergTable: React.FC<BloombergTableProps> = ({ portfolioData, onSelectSymbol, onFundamentalAudit }) => {
    return (
        <div className="bloomberg-terminal mt-6">
            <div className="terminal-header">
                <div style={{color: '#00ffff'}} className="font-bold tracking-widest text-lg uppercase flex items-center gap-2">
                    PORTFOLIO MONITOR
                    <span className="text-[8px] bg-[#00ffff]/10 px-1.5 py-0.5 rounded border border-[#00ffff]/20 whitespace-nowrap">TV_CORE_SYNC</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    REAL-TIME INSTITUTIONAL FEED
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="portfolio-table">
                    <thead>
                        <tr>
                            <th>Security</th>
                            <th>Position</th>
                            <th>Avg Price</th>
                            <th>Last Price</th>
                            <th>Change %</th>
                            <th>Mkt Value (IDR)</th>
                            <th className="text-right">Unrealized P&L</th>
                            <th className="text-center">Audit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {portfolioData.map((item) => {
                            const plPercentage = (item.unrealized / (item.averagePrice * item.lots * 100)) * 100;
                            const ticker = item.ticker.replace('.JK', '');
                            return (
                                <tr key={item.ticker}>
                                    <td 
                                        className="ticker-cell group relative cursor-pointer hover:bg-[#00ffff]/5 transition-colors"
                                        onClick={() => onSelectSymbol?.(`IDX:${ticker}`)}
                                    >
                                        {ticker}
                                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#00ffff] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </td>
                                    <td>{item.lots} LOT</td>
                                    <td className="text-slate-400 font-mono text-[11px]">
                                        {typeof item.averagePrice === 'number' ? item.averagePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : 'N/A'}
                                    </td>
                                    <td id={`price-${ticker}`} className={`font-mono ${item.change >= 0 ? "price-up" : "price-down"}`}>
                                        {typeof item.currentPrice === 'number' ? item.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : 'N/A'}
                                    </td>
                                    <td className={`font-mono text-[11px] ${item.change >= 0 ? "price-up" : "price-down"}`}>
                                        <div className="flex items-center gap-1">
                                            {item.change >= 0 ? '▲' : '▼'}
                                            {Math.abs(item.change).toFixed(2)}%
                                        </div>
                                    </td>
                                    <td style={{color: '#ff9900'}} className="font-mono">
                                        {typeof item.marketValue === 'number' ? item.marketValue.toLocaleString('id-ID') : '0'}
                                    </td>
                                    <td className={`text-right font-mono ${item.unrealized >= 0 ? "price-up" : "price-down"}`}>
                                        <div className="flex items-end flex-col">
                                            <span>{item.unrealized >= 0 ? '+' : ''}{typeof item.unrealized === 'number' ? item.unrealized.toLocaleString('id-ID') : '0'}</span>
                                            <span className="text-[9px] opacity-80">({plPercentage >= 0 ? '+' : ''}{plPercentage.toFixed(2)}%)</span>
                                        </div>
                                    </td>
                                    <td className="text-center">
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
                    <tfoot className="border-t-2 border-slate-800">
                        <tr>
                            <td colSpan={6} className="py-4 font-black text-[#00ffff] text-[10px] uppercase tracking-[0.2em]">Total Portfolio Aggregation</td>
                            <td style={{color: '#ff9900'}} className="font-mono font-bold py-4">
                                {(() => {
                                    const total = portfolioData.reduce((acc, curr) => acc + curr.marketValue, 0);
                                    return typeof total === 'number' ? total.toLocaleString('id-ID') : '0';
                                })()}
                            </td>
                            <td className={`text-right font-mono font-bold py-4 ${portfolioData.reduce((acc, curr) => acc + curr.unrealized, 0) >= 0 ? "price-up" : "price-down"}`}>
                                {(() => {
                                    const totalPL = portfolioData.reduce((acc, curr) => acc + curr.unrealized, 0);
                                    return (totalPL >= 0 ? '+' : '') + (typeof totalPL === 'number' ? totalPL.toLocaleString('id-ID') : '0');
                                })()}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <div style={{marginTop: '15px', fontSize: '10px', color: '#666'}} className="font-mono italic">
                *REAL-TIME DATA - SOURCE: IDX MARKET DATA (VIA MARKETSTACK + VAM GATEWAY)
            </div>
        </div>
    );
};

export default BloombergTable;
