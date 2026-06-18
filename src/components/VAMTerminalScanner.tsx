import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { Activity, CheckCircle2, Globe, Database, TrendingUp, Search, BarChart2, Zap, ArrowLeft } from 'lucide-react';
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
            backgroundColor: ["rgba(223, 255, 0, 0)", "rgba(223, 255, 0, 0.08)", "rgba(223, 255, 0, 0)"],
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
            className="border-b border-slate-800/40 hover:bg-white/5 transition-colors group overflow-hidden relative"
        >
            <motion.td className="py-4 pr-4 relative z-10" animate={controls}>
                <div className="flex flex-col">
                    <span className="font-black text-slate-100 group-hover:text-[#DFFF00] transition-colors uppercase tracking-tight">{res.symbol}</span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest truncate max-w-[100px]">{res.name}</span>
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
        'High Volume Breakout': ['Volume', 'RSI', 'MACD', 'Price'],
        'Price Breakout Volume MA10 Today': ['Price', 'Volume', 'RSI', 'MACD'],
        'Big Accumulation': ['Accum/Dist', 'RSI', 'MACD', 'Price'],
        'Volatility Scanner': ['ATR', 'Bollinger Band %B', 'RSI', 'MACD'],
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

    // Removed manual jitter simulation to prioritize real-time feed
    useEffect(() => {
        if (!results.length) return;
        // No longer using internal interval for simulation
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
    }, [defaultTab, activeMarket, activeModule, handleStartScan]);

    return (
        <div className="bg-[#050505] min-h-screen font-sans relative">
            {/* MAIN CONTENT AREA */}
            <div className="flex-1 p-4 md:p-8 relative flex flex-col max-h-screen overflow-y-auto">
                <div className="flex-1">
                    {subActiveTab === 'SCANNER' ? (
                        <div className="space-y-8">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-[#deff9a]/10 rounded-2xl border border-[#deff9a]/20">
                                    <Search className="w-8 h-8 text-[#deff9a]" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Market Scanner</h2>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="relative">
                                            <div className="w-1.5 h-1.5 bg-[#deff9a] rounded-full animate-pulse shadow-[0_0_8px_rgba(223,255,0,0.5)]" />
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Live Institutional Feed • Real-time Alpha</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* STEP 1: Pilih Market */}
                            {!marketType && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-5 p-10 border border-slate-800/60 bg-slate-900/10 backdrop-blur-3xl rounded-[3rem] shadow-2xl relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-12 bg-[#deff9a]/5 blur-3xl rounded-full" />
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-10">Select Market Region:</p>
                                    <div className="flex flex-wrap gap-5 relative z-10">
                                        <button className="bg-slate-900/60 hover:bg-[#deff9a] hover:text-slate-950 text-white border border-slate-800/80 px-8 py-6 rounded-2xl font-mono text-[11px] transition-all uppercase font-black tracking-widest flex items-center gap-4 group shadow-xl" onClick={() => setMarketType('IDX')}>
                                            <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-slate-950/20 transition-colors">
                                                <TrendingUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            </div>
                                            IDX (Indonesia)
                                        </button>
                                        <button className="bg-slate-900/60 hover:bg-[#deff9a] hover:text-slate-950 text-white border border-slate-800/80 px-8 py-6 rounded-2xl font-mono text-[11px] transition-all uppercase font-black tracking-widest flex items-center gap-4 group shadow-xl" onClick={() => setMarketType('GLOBAL')}>
                                            <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-slate-950/20 transition-colors">
                                                <Globe className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            </div>
                                            Market International
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2: Pilih Jenis Scanner (IDX or GLOBAL) */}
                            {marketType && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="mt-5 p-10 border border-slate-800/60 bg-slate-900/10 backdrop-blur-3xl rounded-[3rem]"
                                >
                                    <p className="text-[10px] font-black text-[#deff9a] uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                                        <span className="w-2.5 h-2.5 bg-[#deff9a] rounded-full shadow-[0_0_10px_#deff9a]" />
                                        Region: {marketType} Selected | {marketType === 'GLOBAL' ? 'IBKR DATA FEED ACTIVE' : 'IDX TERMINAL ACTIVE'} | Select Scanner Type:
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {Object.keys(scannerConfigs)
                                            .filter(name => {
                                                if (marketType === 'IDX') {
                                                    return ['High Volume Breakout', 'Price Breakout Volume MA10 Today', 'Big Accumulation'].includes(name);
                                                } else {
                                                    return ['Volatility Scanner', 'FX Momentum Feed', 'Yield Arbitrage'].includes(name);
                                                }
                                            })
                                            .map(name => (
                                            <button 
                                                key={name} 
                                                className="bg-slate-900/60 hover:bg-[#deff9a] hover:text-slate-950 text-white border border-slate-800/80 px-6 py-5 rounded-2xl font-mono text-[10px] transition-all uppercase font-black tracking-widest text-left shadow-lg" 
                                                onClick={() => handleStartScan(name)}
                                            >
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                    <button className="mt-12 text-[10px] font-black text-slate-500 hover:text-[#deff9a] uppercase tracking-[0.2em] transition-all flex items-center gap-3" onClick={resetScanner}>
                                        <ArrowLeft className="w-4 h-4" />
                                        Back to Market Selection
                                    </button>
                                </motion.div>
                            )}

                            {/* STEP 3: Tampilan Proses & Hasil Scan */}
                            {selectedScanner && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="mt-5 p-10 border border-[#deff9a]/20 bg-slate-900/10 backdrop-blur-3xl rounded-[3rem] relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-12 bg-[#deff9a]/5 blur-3xl rounded-full" />
                                    <h3 className="text-md font-black text-white uppercase tracking-[0.3em] mb-8 flex items-center gap-4">
                                        <Activity className="w-5 h-5 text-[#deff9a]" />
                                        Active Scan: {selectedScanner}
                                    </h3>
                                    <div className="flex flex-wrap gap-3 mb-10">
                                        <strong className="text-[10px] text-slate-500 uppercase self-center tracking-widest mr-3">Metrics Matrix:</strong>
                                        {scannerConfigs[selectedScanner].map(m => (
                                            <span key={m} className="inline-block bg-slate-950 text-[#deff9a] px-4 py-2 rounded-xl text-[10px] font-black border border-slate-800/50 tracking-widest">
                                                {m}
                                            </span>
                                        ))}
                                    </div>
                                    
                                    <div className="mt-8 pt-10 border-t border-slate-800/40">
                                        {isScanning ? (
                                            <div className="flex flex-col items-center justify-center py-12 gap-6 text-[#deff9a] text-[11px] font-black uppercase tracking-[0.3em]">
                                                <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                                                    <motion.div 
                                                        initial={{ x: '-100%' }}
                                                        animate={{ x: '100%' }}
                                                        transition={{ duration: 1, repeat: Infinity }}
                                                        className="h-full w-1/2 bg-[#deff9a]"
                                                    />
                                                </div>
                                                Optimizing institutional alpha across IDX terminal...
                                            </div>
                                        ) : (
                                            <motion.div 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex flex-col gap-10"
                                            >
                                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                                    <div className="flex items-center gap-4 text-emerald-400 text-[11px] font-black uppercase tracking-[0.3em]">
                                                        <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                                            <CheckCircle2 className="w-6 h-6" />
                                                        </div>
                                                        Scan Complete. {results.length} Matches Found.
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                                                            <Database className="w-4 h-4" /> VAM DATA ENGINE
                                                        </span>
                                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                                                            <Zap className="w-4 h-4 text-[#DFFF00]" /> REAL-TIME ALPHA
                                                        </span>
                                                    </div>
                                                </div>

                                                {!showResults ? (
                                                    <button 
                                                        onClick={() => setShowResults(true)}
                                                        className="bg-[#deff9a] text-slate-950 px-10 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:bg-white hover:scale-105 transition-all w-full sm:w-fit mt-2 shadow-[0_20px_40px_rgba(223,255,0,0.15)]"
                                                    >
                                                        Access Match Report
                                                    </button>
                                                ) : (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="overflow-x-auto"
                                                    >
                                                        <table className="w-full text-left font-mono">
                                                            <thead>
                                                                <tr className="border-b border-slate-800/80 text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">
                                                                    <th className="pb-5 pr-6">SEC IDENT</th>
                                                                    <th className="pb-5 pr-6">SENTIMENT</th>
                                                                    <th className="pb-5 pr-6 text-center">V-SCORE</th>
                                                                    {selectedScanner && scannerConfigs[selectedScanner].map(m => (
                                                                        <th key={m} className="pb-5 px-6 text-right truncate max-w-[100px]">{m}</th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody className="text-[10px] text-slate-100 italic">
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
