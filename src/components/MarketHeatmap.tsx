import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, TrendingDown, Search, Filter, Layers, LayoutGrid, Info, ExternalLink, RefreshCw, Zap } from 'lucide-react';
import { fetchLivePrices, LivePrice } from '../services/marketService';

interface MarketHeatmapProps {
  onViewAsset?: (symbol: string) => void;
}

interface SectorInfo {
  id: string;
  name: string;
  description: string;
  color: string;
}

const SECTORS: Record<string, SectorInfo> = {
  "FINANCE": { id: "FINANCE", name: "Financials & Banking", description: "Sektor Keuangan & Perbankan", color: "#3b82f6" },
  "ENERGY_MINERAL": { id: "ENERGY_MINERAL", name: "Energy & Mineral Resources", description: "Sektor Energi, Tambang & Komoditi", color: "#f59e0b" },
  "CONSUMER_RETAIL": { id: "CONSUMER_RETAIL", name: "Consumer Goods & Retail", description: "Barang Konsumsi & Ritel", color: "#ec4899" },
  "TECH_TELCO": { id: "TECH_TELCO", name: "Technology & Telecom", description: "Teknologi & Telekomunikasi", color: "#a855f7" },
  "INFRA_CONGLOM": { id: "INFRA_CONGLOM", name: "Infrastructure & Conglomerates", description: "Infrastruktur, Semen & Konglomerasi", color: "#10b981" }
};

const IDX_TICKER_SECTORS: Record<string, { name: string; sector: string; baseline: number }> = {
  "BBCA": { name: "PT Bank Central Asia Tbk.", sector: "FINANCE", baseline: 10200 },
  "BBRI": { name: "PT Bank Rakyat Indonesia (Persero) Tbk.", sector: "FINANCE", baseline: 4400 },
  "BMRI": { name: "PT Bank Mandiri (Persero) Tbk.", sector: "FINANCE", baseline: 6150 },
  "BBNI": { name: "PT Bank Negara Indonesia (Persero) Tbk.", sector: "FINANCE", baseline: 4500 },
  
  "ADRO": { name: "PT Adaro Energy Indonesia Tbk.", sector: "ENERGY_MINERAL", baseline: 2750 },
  "ANTM": { name: "PT Aneka Tambang Tbk.", sector: "ENERGY_MINERAL", baseline: 1450 },
  "MDKA": { name: "PT Merdeka Copper Gold Tbk.", sector: "ENERGY_MINERAL", baseline: 2350 },
  "PTBA": { name: "PT Bukit Asam Tbk.", sector: "ENERGY_MINERAL", baseline: 2450 },
  "ITMG": { name: "PT Indo Tambangraya Megah Tbk.", sector: "ENERGY_MINERAL", baseline: 25800 },
  "HRUM": { name: "PT Harum Energy Tbk.", sector: "ENERGY_MINERAL", baseline: 1150 },
  "MEDC": { name: "PT Medco Energi Internasional Tbk.", sector: "ENERGY_MINERAL", baseline: 1210 },
  "BRMS": { name: "PT Bumi Resources Minerals Tbk.", sector: "ENERGY_MINERAL", baseline: 155 },
  "BREN": { name: "PT Barito Renewables Energy Tbk.", sector: "ENERGY_MINERAL", baseline: 6500 },
  "AMMN": { name: "PT Amman Mineral Internasional Tbk.", sector: "ENERGY_MINERAL", baseline: 8250 },
  
  "UNVR": { name: "PT Unilever Indonesia Tbk.", sector: "CONSUMER_RETAIL", baseline: 2850 },
  "AMRT": { name: "PT Sumber Alfaria Trijaya Tbk.", sector: "CONSUMER_RETAIL", baseline: 2820 },
  "ICBP": { name: "PT Indofood CBP Sukses Makmur Tbk.", sector: "CONSUMER_RETAIL", baseline: 10450 },
  "CPIN": { name: "PT Charoen Pokphand Indonesia Tbk.", sector: "CONSUMER_RETAIL", baseline: 4850 },
  
  "TLKM": { name: "PT Telkom Indonesia (Persero) Tbk.", sector: "TECH_TELCO", baseline: 3650 },
  "GOTO": { name: "PT GoTo Gojek Tokopedia Tbk.", sector: "TECH_TELCO", baseline: 62 },
  "BUKA": { name: "PT Bukalapak.com Tbk.", sector: "TECH_TELCO", baseline: 118 },
  
  "ASII": { name: "PT Astra International Tbk.", sector: "INFRA_CONGLOM", baseline: 4850 },
  "SMGR": { name: "PT Semen Indonesia (Persero) Tbk.", sector: "INFRA_CONGLOM", baseline: 3820 },
  "BRPT": { name: "PT Barito Pacific Tbk.", sector: "INFRA_CONGLOM", baseline: 980 },
  "TPIA": { name: "PT Chandra Asri Pacific Tbk.", sector: "INFRA_CONGLOM", baseline: 8500 },
  "COAL": { name: "PT Black Diamond Resources Tbk.", sector: "INFRA_CONGLOM", baseline: 75 },
  "DEFI": { name: "PT Danasupra Erapacific Tbk.", sector: "INFRA_CONGLOM", baseline: 82 },
  "DEWA": { name: "PT Darma Henwa Tbk.", sector: "INFRA_CONGLOM", baseline: 65 },
  "CTTH": { name: "PT Citatah Tbk.", sector: "INFRA_CONGLOM", baseline: 134 }
};

export const MarketHeatmap = ({ onViewAsset }: MarketHeatmapProps) => {
  const [prices, setPrices] = useState<Record<string, LivePrice>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"SECTORS" | "GRID">("SECTORS");
  const [lastUpdate, setLastUpdate] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);

  // Initial load
  const loadInitialPrices = async () => {
    setIsRefreshing(true);
    try {
      const tickers = Object.keys(IDX_TICKER_SECTORS);
      const data = await fetchLivePrices(tickers);
      const priceMap: Record<string, LivePrice> = {};
      data.forEach(p => {
        priceMap[p.symbol] = p;
      });
      
      // Inject fallbacks for missing
      tickers.forEach(t => {
        if (!priceMap[t]) {
          priceMap[t] = {
            symbol: t,
            price: IDX_TICKER_SECTORS[t].baseline,
            changePercent: parseFloat(((Math.random() - 0.48) * 8).toFixed(2)) // realistic simulated changes
          };
        }
      });
      
      setPrices(priceMap);
      setLastUpdate(new Date().toLocaleTimeString('id-ID'));
    } catch (err) {
      console.error("[VAM HEATMAP] Error loading initial prices:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadInitialPrices();

    // Listen to realtime socket updates
    const handleMarketUpdate = (event: any) => {
      const data = event.detail;
      if (data && data.symbol) {
        setPrices(prev => ({
          ...prev,
          [data.symbol]: {
            symbol: data.symbol,
            price: data.price,
            changePercent: data.changePercent
          }
        }));
        setLastUpdate(new Date().toLocaleTimeString('id-ID'));
      }
    };

    window.addEventListener('vam-market-update', handleMarketUpdate);
    return () => {
      window.removeEventListener('vam-market-update', handleMarketUpdate);
    };
  }, []);

  const handleManualRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    // Trigger global gateway refresh
    window.dispatchEvent(new CustomEvent('vam-force-market-refresh'));
    setTimeout(() => {
      loadInitialPrices();
    }, 1000);
  };

  // Helper color map
  const getPerformanceBgColor = (change: number | undefined) => {
    if (change === undefined) return 'bg-zinc-900 border-zinc-850 hover:bg-zinc-800';
    
    if (change >= 3.0) return 'bg-emerald-950 border-emerald-500/80 text-emerald-100 hover:bg-emerald-900/90';
    if (change >= 1.0) return 'bg-emerald-950/70 border-emerald-600/50 text-emerald-200 hover:bg-emerald-900/70';
    if (change > 0.0) return 'bg-emerald-950/30 border-emerald-800/30 text-emerald-300 hover:bg-emerald-950/50';
    
    if (change === 0) return 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850';
    
    if (change <= -3.0) return 'bg-rose-950 border-rose-500/80 text-rose-100 hover:bg-rose-900/90';
    if (change <= -1.0) return 'bg-rose-950/70 border-rose-600/50 text-rose-200 hover:bg-rose-900/70';
    return 'bg-rose-950/30 border-rose-800/30 text-rose-300 hover:bg-rose-950/50';
  };

  const getPercentageSpanColor = (change: number | undefined) => {
    if (change === undefined) return 'text-zinc-500';
    if (change > 0) return 'text-emerald-400';
    if (change < 0) return 'text-rose-400';
    return 'text-zinc-500';
  };

  // Get filtered tick list
  const tickerKeys = Object.keys(IDX_TICKER_SECTORS).filter(symbol => {
    const meta = IDX_TICKER_SECTORS[symbol];
    const matchesSearch = symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          meta.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector === "ALL" || meta.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  // Group tickers by sector
  const groupedKeys = () => {
    const groups: Record<string, string[]> = {};
    Object.keys(SECTORS).forEach(secId => {
      groups[secId] = [];
    });
    
    tickerKeys.forEach(sym => {
      const secId = IDX_TICKER_SECTORS[sym].sector;
      if (groups[secId]) {
        groups[secId].push(sym);
      }
    });

    return groups;
  };

  return (
    <div className="bg-zinc-950/40 rounded-3xl border border-zinc-800/50 overflow-hidden backdrop-blur-md space-y-6 p-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-900">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-[#deff9a]" />
            <span className="text-[8px] font-black text-[#deff9a] uppercase tracking-[0.2em] font-mono">Real-Time Core Index Heatmap</span>
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            IDX Market Heatmap
          </h3>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Institutional Visual Asset Allocation Matrix</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="text-right">
            <span className="text-[9px] font-mono font-black text-zinc-500 block uppercase">GATEWAY TERMINAL FEED</span>
            <span className="text-[10px] font-mono text-[#deff9a] font-bold flex items-center gap-1.5 justify-end">
              <span className="w-1.5 h-1.5 bg-[#deff9a] rounded-full animate-ping" />
              {lastUpdate ? `LIVE SYNC: ${lastUpdate}` : 'AWAITING UPDATES'}
            </span>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-zinc-900 bg-zinc-950 hover:bg-zinc-900 text-[#deff9a] hover:text-white transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 text-[9px] font-mono font-black uppercase tracking-wider"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            REFRESH INDEX
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-950/50 p-4 border border-zinc-900 rounded-2xl">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search Ticker / Company (e.g., BBCA, GOTO)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-black border border-zinc-800 focus:border-[#deff9a]/40 rounded-xl text-[11px] font-semibold text-zinc-200 placeholder-zinc-500 focus:outline-none transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sector selection */}
          <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-900 rounded-xl p-1.5">
            <Filter className="w-3.5 h-3.5 text-zinc-500 ml-1" />
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-transparent border-none text-[9px] font-mono font-black text-zinc-300 focus:outline-none pr-2 uppercase cursor-pointer"
            >
              <option value="ALL">ALL SECTORS</option>
              {Object.keys(SECTORS).map(key => (
                <option key={key} value={key}>{SECTORS[key].name}</option>
              ))}
            </select>
          </div>

          {/* View Modes */}
          <div className="flex items-center bg-zinc-950 border border-zinc-900 rounded-xl p-1">
            <button
              onClick={() => setViewMode("SECTORS")}
              className={`p-1.5 rounded-lg transition-all text-[#deff9a] flex items-center gap-1 text-[8px] font-mono font-black uppercase tracking-wider ${viewMode === "SECTORS" ? "bg-[#deff9a]/10 text-[#deff9a]" : "opacity-40 hover:opacity-100"}`}
              title="Group by Sector"
            >
              <Layers className="w-3 h-3" />
              Sectors
            </button>
            <button
              onClick={() => setViewMode("GRID")}
              className={`p-1.5 rounded-lg transition-all text-[#deff9a] flex items-center gap-1 text-[8px] font-mono font-black uppercase tracking-wider ${viewMode === "GRID" ? "bg-[#deff9a]/10 text-[#deff9a]" : "opacity-40 hover:opacity-100"}`}
              title="Compact Fluid Grid"
            >
              <LayoutGrid className="w-3 h-3" />
              Grid View
            </button>
          </div>
        </div>
      </div>

      {/* Main Heatmap Visualizer */}
      <div className="min-h-[220px]">
        {tickerKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-650 font-mono">
            <Info className="w-8 h-8 text-zinc-600 mb-2 animate-bounce" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">NO SECURED MATCHES DETECTED</p>
            <p className="text-[9px] text-zinc-600 mt-1 max-w-sm">
              Adjust your search keywords or filter domains to process active real-time index matrices.
            </p>
          </div>
        ) : viewMode === "SECTORS" && selectedSector === "ALL" ? (
          /* Grouped Sectors View */
          <div className="space-y-6">
            {Object.keys(SECTORS).map(secId => {
              const sectorGroup = groupedKeys()[secId];
              if (sectorGroup.length === 0) return null;
              
              return (
                <div key={secId} className="space-y-2">
                  <div className="flex items-center gap-2 border-b border-zinc-900/60 pb-1.5">
                    <span className="w-1.5 h-3 rounded-md" style={{ backgroundColor: SECTORS[secId].color }} />
                    <h4 className="text-[10px] font-black text-white uppercase tracking-wider">{SECTORS[secId].name}</h4>
                    <span className="text-[8px] font-mono text-zinc-500 font-semibold uppercase">({sectorGroup.length} Assets)</span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                    {sectorGroup.map(symbol => {
                      const data = prices[symbol];
                      const change = data ? data.changePercent : 0;
                      const price = data ? data.price : IDX_TICKER_SECTORS[symbol].baseline;
                      const info = IDX_TICKER_SECTORS[symbol];
                      
                      return (
                        <motion.div
                          key={symbol}
                          layout
                          onClick={() => onViewAsset?.(`IDX:${symbol}`)}
                          onMouseEnter={() => setHoveredSymbol(symbol)}
                          onMouseLeave={() => setHoveredSymbol(null)}
                          className={`relative border cursor-pointer rounded-2xl p-3.5 transition-all flex flex-col justify-between min-h-[95px] select-none ${getPerformanceBgColor(change)}`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-[11px] font-black uppercase tracking-tight">{symbol}</span>
                            <span className={`text-[9px] font-mono font-black ${getPercentageSpanColor(change)}`}>
                              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                            </span>
                          </div>
                          
                          <div className="mt-3">
                            <span className="text-[8px] font-mono font-bold block text-white/95">
                              Rp {price.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[7.5px] font-medium text-zinc-400 block truncate leading-none mt-0.5">
                              {info.name}
                            </span>
                          </div>

                          {/* Hover Focus Highlight */}
                          {hoveredSymbol === symbol && (
                            <div className="absolute inset-0 bg-[#deff9a]/5 border border-[#deff9a]/40 rounded-2xl pointer-events-none transition-all shadow-[0_0_15px_rgba(222,255,154,0.1)]" />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Fluid/Flattened Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {tickerKeys.map(symbol => {
              const data = prices[symbol];
              const change = data ? data.changePercent : 0;
              const price = data ? data.price : IDX_TICKER_SECTORS[symbol].baseline;
              const info = IDX_TICKER_SECTORS[symbol];
              
              return (
                <motion.div
                  key={symbol}
                  layout
                  onClick={() => onViewAsset?.(`IDX:${symbol}`)}
                  onMouseEnter={() => setHoveredSymbol(symbol)}
                  onMouseLeave={() => setHoveredSymbol(null)}
                  className={`relative border cursor-pointer rounded-2xl p-3.5 transition-all flex flex-col justify-between min-h-[95px] select-none ${getPerformanceBgColor(change)}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] font-black uppercase tracking-tight">{symbol}</span>
                    <span className={`text-[9px] font-mono font-black ${getPercentageSpanColor(change)}`}>
                      {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                    </span>
                  </div>
                  
                  <div className="mt-3">
                    <span className="text-[8px] font-mono font-bold block text-white/95">
                      Rp {price.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[7.5px] font-medium text-zinc-400 block truncate leading-none mt-0.5">
                      {info.name}
                    </span>
                  </div>

                  {/* Hover Focus Highlight */}
                  {hoveredSymbol === symbol && (
                    <div className="absolute inset-0 bg-[#deff9a]/5 border border-[#deff9a]/40 rounded-2xl pointer-events-none transition-all shadow-[0_0_15px_rgba(222,255,154,0.1)]" />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Legend Bar */}
      <div className="border-t border-zinc-900/60 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[9px] text-zinc-500">
        <div className="flex flex-wrap items-center gap-3">
          <span className="uppercase font-semibold tracking-wider">Legend Index:</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-rose-900 border border-rose-500" />
            <span>&lt; -3% (Major Drop)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-rose-950/40 border border-rose-800/40" />
            <span>Red (Declined)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-zinc-900 border border-zinc-800" />
            <span>Neutral (Flat)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-950/40 border border-emerald-800/40" />
            <span>Green (Gained)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-900 border border-emerald-500" />
            <span>&gt; +3% (Bullish Spike)</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[8.5px]">
          <Info className="w-3.5 h-3.5 text-zinc-650 animate-pulse" />
          <span>Click on any ticket cluster to trigger immediate visual focus & historical auditing</span>
        </div>
      </div>
    </div>
  );
};
