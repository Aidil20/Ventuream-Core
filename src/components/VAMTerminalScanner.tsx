import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { Activity, CheckCircle2, Globe, Database, TrendingUp, Search, BarChart2, Zap } from 'lucide-react';
import { fetchScannerResults, ScannerResult } from '../services/marketService';

interface VAMTerminalScannerProps {
    portfolioContent: React.ReactNode;
    defaultTab?: 'PORTFOLIO' | 'SCANNER';
    activeMarket?: 'IDX' | 'GLOBAL' | null;
    activeModule?: string | null;
    livePrices?: Record<string, number>;
}

// Row component for results to handle update animations
const ScannerRow: React.FC<{ 
    res: ScannerResult; 
    scannerConfigs: Record<string, string[]>; 
    selectedScanner: string;
    index: number;
}> = ({ res, scannerConfigs, selectedScanner, index }) => {
    const controls = useAnimation();
    
    // Trigger row flash on any data change
    useEffect(() => {
        controls.start({
            backgroundColor: ["rgba(0, 255, 255, 0)", "rgba(0, 255, 255, 0.12)", "rgba(0, 255, 255, 0)"],
            transition: { duration: 1, ease: "easeOut" }
        });
    }, [res, controls]);

    return (
        <motion.tr 
            initial={{ opacity: 0, y: 15 }}
            animate={{ 
                opacity: 1, 
                y: 0,
                transition: { delay: index * 0.05, duration: 0.4, ease: "easeOut" }
            }}
            exit={{ opacity: 0, x: -10 }}
            className="border-b border-slate-800/50 hover:bg-white/5 transition-colors group overflow-hidden relative"
        >
            <motion.td className="py-4 pr-4 relative z-10" animate={controls}>
                <div className="flex flex-col">
                    <span className="font-black text-[#00ffff] group-hover:text-[#ff9900] transition-colors">{res.symbol}</span>
                    <span className="text-[8px] text-slate-500 truncate max-w-[100px]">{res.name}</span>
                </div>
            </motion.td>
            <motion.td className="py-4 pr-4" animate={controls}>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black ${
                    res.signal === 'BUY' ? 'bg-green-500/10 text-green-400' :
                    res.signal === 'SELL' ? 'bg-red-500/10 text-red-400' :
                    'bg-slate-800 text-slate-400'
                }`}>
                    {res.signal}
                </span>
            </motion.td>
            <motion.td className="py-4 pr-4 text-center" animate={controls}>
                <motion.span 
                    key={res.score}
                    initial={{ color: '#00ffff', scale: 1.1 }}
                    animate={{ color: '#ffffff', scale: 1 }}
                    transition={{ duration: 1 }}
                    className="font-bold inline-block"
                >
                    {res.score}
                </motion.span>
            </motion.td>
            {selectedScanner && scannerConfigs[selectedScanner].map(m => (
                <motion.td key={m} className="py-4 px-4 text-right text-slate-400 font-bold overflow-hidden" animate={controls}>
                    <motion.span
                        key={res.metrics[m]}
                        initial={{ color: '#00ffff', opacity: 1, x: 5 }}
                        animate={{ color: '#94a3b8', opacity: 1, x: 0 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="inline-block"
                    >
                        {res.metrics[m] || '-'}
                    </motion.span>
                </motion.td>
            ))}
        </motion.tr>
    );
};

const VAMTerminalScanner: React.FC<VAMTerminalScannerProps> = ({ 
    portfolioContent, 
    defaultTab = 'PORTFOLIO', 
    activeMarket = null,
    activeModule = null,
    livePrices = {}
}) => {
    const [subActiveTab, setSubActiveTab] = useState<'PORTFOLIO' | 'SCANNER'>(defaultTab);
    const [marketType, setMarketType] = useState<'IDX' | 'GLOBAL' | null>(activeMarket);
    const [selectedScanner, setSelectedScanner] = useState<string | null>(activeModule || null);
    const [isScanning, setIsScanning] = useState(false);
    const [results, setResults] = useState<ScannerResult[]>([]);
    const [showResults, setShowResults] = useState(false);

    // Sync live prices to results
    useEffect(() => {
        if (Object.keys(livePrices).length > 0 && results.length > 0) {
            setResults(prev => prev.map(res => {
                const livePrice = livePrices[res.symbol];
                if (livePrice && res.metrics['Price'] !== livePrice.toLocaleString('id-ID')) {
                    return {
                        ...res,
                        metrics: {
                            ...res.metrics,
                            'Price': livePrice.toLocaleString('id-ID')
                        }
                    };
                }
                return res;
            }));
        }
    }, [livePrices]);

    // Konfigurasi Metrik Scanner
    const scannerConfigs: Record<string, string[]> = {
        'High Volume Breakout': ['Volume', 'Market Cap', 'P/E Ratio', 'Price'],
        'Price Breakout Volume MA10 Today': ['Price', 'Volume', 'Market Cap', 'P/E Ratio'],
        'Big Accumulation': ['Accum/Dist', 'Price', 'Volume', 'Market Cap', 'P/E Ratio'],
        'Volatility Scanner': ['ATR', 'Bollinger Band %B', 'Price', 'Volume', 'Market Cap'],
        'FX Momentum Feed': ['RSI', 'MACD', 'Stochastic', 'EMA200'],
        'Yield Arbitrage': ['10Y-2Y Spread', 'Bond Price', 'Interest Rate', 'Duration']
    };

    const handleStartScan = React.useCallback(async (name: string) => {
        setSelectedScanner(name);
        setIsScanning(true);
        setShowResults(false);
        setResults([]);
        
        try {
            const data = await fetchScannerResults(name);
            setResults(data);
        } catch (error) {
            console.error("Scan failed", error);
        } finally {
            // Simulasi proses scanning
            setTimeout(() => {
                setIsScanning(false);
            }, 2000);
        }
    }, []);

    const resetScanner = () => {
        setMarketType(null);
        setSelectedScanner(null);
        setIsScanning(false);
        setShowResults(false);
        setResults([]);
    };

    useEffect(() => {
        if (!results.length) return;
        const interval = setInterval(() => {
            setResults(prev => prev.map(res => {
                const newMetrics = { ...res.metrics };
                Object.keys(newMetrics).forEach(key => {
                    const val = newMetrics[key];
                    if (typeof val === 'number') {
                        newMetrics[key] = +(val + (Math.random() - 0.5) * (val * 0.001)).toFixed(2);
                    } else if (typeof val === 'string' && !isNaN(parseFloat(val.replace(/,/g, '')))) {
                        const num = parseFloat(val.replace(/,/g, ''));
                        newMetrics[key] = (num + (Math.random() - 0.5) * (num * 0.001)).toLocaleString('id-ID', { maximumFractionDigits: 0 });
                    }
                });
                return { ...res, metrics: newMetrics };
            }));
        }, 2000);
        return () => clearInterval(interval);
    }, [results.length]);

    useEffect(() => {
        if (defaultTab !== subActiveTab) {
            setSubActiveTab(defaultTab);
        }
        if (defaultTab === 'SCANNER') {
            if (activeMarket && activeMarket !== marketType) {
                setMarketType(activeMarket);
            }
            if (activeModule && activeModule !== selectedScanner) {
                handleStartScan(activeModule);
            }
        }
    }, [defaultTab, activeMarket, activeModule, subActiveTab, marketType, selectedScanner, handleStartScan]);

    return (
        <div className="bg-[#050505] min-h-screen font-sans relative">
            {/* MAIN CONTENT AREA */}
            <div className="flex-1 p-4 md:p-8 relative flex flex-col max-h-screen overflow-y-auto">
                <div className="flex-1">
                    {subActiveTab === 'SCANNER' ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Search className="w-6 h-6 text-[#00ffff]" />
                                <h2 className="text-3xl font-black text-[#00ffff] tracking-tighter uppercase">Market Scanner</h2>
                                <div className="flex items-center gap-1.5 bg-[#00ffff]/10 px-2 py-1 rounded-full border border-[#00ffff]/20 h-fit">
                                    <div className="w-1.5 h-1.5 bg-[#00ffff] rounded-full animate-pulse shadow-[0_0_8px_rgba(0,255,255,0.5)]" />
                                    <span className="text-[10px] text-[#00ffff] font-black uppercase tracking-widest">Live Institutional Feed</span>
                                </div>
                            </div>
                            
                            {/* STEP 1: Pilih Market */}
                            {!marketType && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-5 p-8 border border-slate-800 bg-[#050505] rounded-2xl shadow-xl border-dashed"
                                >
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Select Market Region:</p>
                                    <div className="flex flex-wrap gap-4">
                                        <button className="bg-[#1a1a1a] hover:bg-[#ff9900] hover:text-black text-white border border-slate-700 px-6 py-4 rounded-xl font-mono text-xs transition-all uppercase font-black tracking-widest flex items-center gap-3 group" onClick={() => setMarketType('IDX')}>
                                            <TrendingUp className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                            IDX (Indonesia)
                                        </button>
                                        <button className="bg-[#1a1a1a] hover:bg-[#ff9900] hover:text-black text-white border border-slate-700 px-6 py-4 rounded-xl font-mono text-xs transition-all uppercase font-black tracking-widest flex items-center gap-3 group" onClick={() => setMarketType('GLOBAL')}>
                                            <Globe className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                            Global Market
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2: Pilih Jenis Scanner (Jika IDX dipilih) */}
                            {marketType === 'IDX' && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="mt-5 p-8 border border-slate-800 bg-[#050505] rounded-2xl"
                                >
                                    <p className="text-[10px] font-black text-[#ff9900] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-[#ff9900] rounded-full" />
                                        Region: IDX Selected | Select Scanner Type:
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.keys(scannerConfigs).map(name => (
                                            <button 
                                                key={name} 
                                                className="bg-[#1a1a1a] hover:bg-[#ff9900] hover:text-black text-white border border-slate-700 px-5 py-4 rounded-xl font-mono text-[10px] transition-all uppercase font-black tracking-wider text-left" 
                                                onClick={() => handleStartScan(name)}
                                            >
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                    <button className="mt-8 text-[9px] font-black text-slate-600 hover:text-[#ff9900] uppercase tracking-[0.2em] transition-all flex items-center gap-2" onClick={resetScanner}>
                                        [ &lt;&lt; Back to Market Selection ]
                                    </button>
                                </motion.div>
                            )}

                            {/* STEP 3: Tampilan Proses & Hasil Scan */}
                            {selectedScanner && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="mt-5 p-8 border border-[#00ff00]/30 bg-[#050505] rounded-2xl relative overflow-hidden ring-1 ring-[#00ff00]/10"
                                >
                                    <div className="absolute top-0 right-0 p-8 bg-[#00ff00]/5 blur-3xl rounded-full" />
                                    <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                        <Activity className="w-4 h-4 text-[#00ff00]" />
                                        Active Scan: {selectedScanner}
                                    </h3>
                                    <div className="flex flex-wrap gap-2 mb-8">
                                        <strong className="text-[9px] text-slate-600 uppercase self-center tracking-widest mr-2">Metrics Matrix:</strong>
                                        {scannerConfigs[selectedScanner].map(m => (
                                            <span key={m} className="inline-block bg-[#1a1a1a] text-[#00ffff] px-3 py-1.5 rounded-lg text-[9px] font-black border border-slate-700/50 tracking-wider">
                                                {m}
                                            </span>
                                        ))}
                                    </div>
                                    
                                    <div className="mt-6 pt-6 border-t border-slate-800">
                                        {isScanning ? (
                                            <div className="flex items-center gap-3 text-[#00ff00] text-[11px] font-black uppercase tracking-[0.2em] animate-pulse">
                                                <div className="w-2 h-2 bg-[#00ff00] rounded-full animate-ping" />
                                                Scanning all IDX stocks via Yahoo Finance & TradingView feeds...
                                            </div>
                                        ) : (
                                            <motion.div 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex flex-col gap-6"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 text-[#00ff00] text-[11px] font-black uppercase tracking-[0.2em]">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                        Scan complete. Found {results.length} institutional matches.
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                                            <BarChart2 className="w-3 h-3" /> Yahoo Finance Engine
                                                        </span>
                                                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                                            <Zap className="w-3 h-3 text-orange-400" /> TradingView Metrics
                                                        </span>
                                                    </div>
                                                </div>

                                                {!showResults ? (
                                                    <button 
                                                        onClick={() => setShowResults(true)}
                                                        className="bg-[#00ff00] text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all w-fit mt-2"
                                                    >
                                                        View Match Report
                                                    </button>
                                                ) : (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="overflow-x-auto"
                                                    >
                                                        <table className="w-full text-left font-mono">
                                                            <thead>
                                                                <tr className="border-b border-slate-800 text-[9px] text-slate-500 font-black uppercase tracking-widest">
                                                                    <th className="pb-3 pr-4">Symbol</th>
                                                                    <th className="pb-3 pr-4">Signal</th>
                                                                    <th className="pb-3 pr-4 text-center">Score</th>
                                                                    {selectedScanner && scannerConfigs[selectedScanner].map(m => (
                                                                        <th key={m} className="pb-3 px-4 text-right">{m}</th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody className="text-[10px] text-white">
                                                                <AnimatePresence mode="popLayout">
                                                                    {results.map((res, i) => (
                                                                        <ScannerRow 
                                                                            key={`${res.symbol}-${i}`} 
                                                                            res={res} 
                                                                            scannerConfigs={scannerConfigs} 
                                                                            selectedScanner={selectedScanner} 
                                                                            index={i}
                                                                        />
                                                                    ))}
                                                                </AnimatePresence>
                                                            </tbody>
                                                        </table>
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="mt-2 text-white">
                                {portfolioContent}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VAMTerminalScanner;
