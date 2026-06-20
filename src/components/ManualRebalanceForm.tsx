import React, { useState, useEffect, useRef } from 'react';
import { Scale, Plus, ArrowRightLeft, Sparkles, RefreshCw, AlertTriangle, TrendingUp, TrendingDown, DollarSign, Search, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ManualRebalanceFormProps {
  portfolioAssets: Array<{
    ticker: string;
    lots: number;
    averagePrice: number;
    marketPrice: number;
  }>;
  cashBalance: number;
  onUpdatePortfolio: (ticker: string, action: 'BUY' | 'SELL', price: number, lots: number) => void;
  onResetPortfolio?: () => void;
}

const PRESET_TICKERS = [
  { symbol: 'DSSA.JK', name: 'Dian Swastatika Sentosa' },
  { symbol: 'BUMI.JK', name: 'Bumi Resources Tbk' },
  { symbol: 'DEFI.JK', name: 'Danasupra Erapacific' },
  { symbol: 'KOTA.JK', name: 'DMS Propertindo' },
  { symbol: 'LAND.JK', name: 'Trimitra Propertindo' },
  { symbol: 'LPKR.JK', name: 'Lippo Karawaci' },
  { symbol: 'PIPA.JK', name: 'Multi Makmur Lemindo' },
  { symbol: 'COAL.JK', name: 'Coal Energy' },
  { symbol: 'WMUU.JK', name: 'Widodo Makmur Unggas' }
];

const ALL_SUGGESTIONS = [
  // IDX Stocks
  { symbol: 'BUMI.JK', name: 'Bumi Resources Tbk', priceKey: 'BUMI', market: 'IDX' },
  { symbol: 'BBCA.JK', name: 'Bank Central Asia', priceKey: 'BBCA', market: 'IDX' },
  { symbol: 'BBRI.JK', name: 'Bank Rakyat Indonesia', priceKey: 'BBRI', market: 'IDX' },
  { symbol: 'BMRI.JK', name: 'Bank Mandiri (Persero)', priceKey: 'BMRI', market: 'IDX' },
  { symbol: 'TLKM.JK', name: 'Telkom Indonesia', priceKey: 'TLKM', market: 'IDX' },
  { symbol: 'ASII.JK', name: 'Astra International', priceKey: 'ASII', market: 'IDX' },
  { symbol: 'BBNI.JK', name: 'Bank Negara Indonesia', priceKey: 'BBNI', market: 'IDX' },
  { symbol: 'ADRO.JK', name: 'Adaro Energy Indonesia', priceKey: 'ADRO', market: 'IDX' },
  { symbol: 'UNVR.JK', name: 'Unilever Indonesia', priceKey: 'UNVR', market: 'IDX' },
  { symbol: 'GOTO.JK', name: 'GoTo Gojek Tokopedia', priceKey: 'GOTO', market: 'IDX' },
  { symbol: 'ANTM.JK', name: 'Aneka Tambang', priceKey: 'ANTM', market: 'IDX' },
  { symbol: 'MDKA.JK', name: 'Merdeka Copper Gold', priceKey: 'MDKA', market: 'IDX' },
  { symbol: 'PTBA.JK', name: 'Bukit Asam', priceKey: 'PTBA', market: 'IDX' },
  { symbol: 'ITMG.JK', name: 'Indo Tambangraya', priceKey: 'ITMG', market: 'IDX' },
  { symbol: 'HRUM.JK', name: 'Harum Energy', priceKey: 'HRUM', market: 'IDX' },
  { symbol: 'SMGR.JK', name: 'Semen Indonesia', priceKey: 'SMGR', market: 'IDX' },
  { symbol: 'AMRT.JK', name: 'Sumber Alfaria Trijaya', priceKey: 'AMRT', market: 'IDX' },
  { symbol: 'ICBP.JK', name: 'Indofood CBP Sukses Makmur', priceKey: 'ICBP', market: 'IDX' },
  { symbol: 'BRPT.JK', name: 'Barito Pacific', priceKey: 'BRPT', market: 'IDX' },
  { symbol: 'BREN.JK', name: 'Barito Renewables Energy', priceKey: 'BREN', market: 'IDX' },
  { symbol: 'AMMN.JK', name: 'Amman Mineral Internasional', priceKey: 'AMMN', market: 'IDX' },
  { symbol: 'TPIA.JK', name: 'Chandra Asri Pacific', priceKey: 'TPIA', market: 'IDX' },
  { symbol: 'CPIN.JK', name: 'Charoen Pokphand Indonesia', priceKey: 'CPIN', market: 'IDX' },
  { symbol: 'BRMS.JK', name: 'Bumi Resources Minerals', priceKey: 'BRMS', market: 'IDX' },
  { symbol: 'COAL.JK', name: 'Black Diamond Resources', priceKey: 'COAL', market: 'IDX' },
  { symbol: 'DEFI.JK', name: 'Danasupra Erapacific', priceKey: 'DEFI', market: 'IDX' },
  { symbol: 'BUKA.JK', name: 'Bukalapak.com', priceKey: 'BUKA', market: 'IDX' },
  { symbol: 'MEDC.JK', name: 'Medco Energi Internasional', priceKey: 'MEDC', market: 'IDX' },
  { symbol: 'DEWA.JK', name: 'Darma Henwa', priceKey: 'DEWA', market: 'IDX' },
  { symbol: 'DSSA.JK', name: 'Dian Swastatika Sentosa', priceKey: 'DSSA', market: 'IDX' },
  { symbol: 'KOTA.JK', name: 'DMS Propertindo Tbk', priceKey: 'KOTA', market: 'IDX' },
  { symbol: 'LAND.JK', name: 'Trinitan Land Tbk', priceKey: 'LAND', market: 'IDX' },
  { symbol: 'PIPA.JK', name: 'Multi Spunindo Jaya Tbk', priceKey: 'PIPA', market: 'IDX' },
  { symbol: 'LPKR.JK', name: 'Lippo Karawaci Tbk', priceKey: 'LPKR', market: 'IDX' },
  
  // SGX Stocks
  { symbol: 'DBS', name: 'DBS Group Holdings Ltd', priceKey: 'DBS', market: 'SGX' },
  { symbol: 'UOB', name: 'United Overseas Bank Ltd', priceKey: 'UOB', market: 'SGX' },
  { symbol: 'OCBC', name: 'Overseas-Chinese Banking Corp', priceKey: 'OCBC', market: 'SGX' },
  { symbol: 'Singtel', name: 'Singapore Telecommunications Ltd', priceKey: 'Singtel', market: 'SGX' },
  { symbol: 'Keppel', name: 'Keppel Ltd', priceKey: 'Keppel', market: 'SGX' },
  { symbol: 'CapitaLand', name: 'CapitaLand Investment Ltd', priceKey: 'CapitaLand', market: 'SGX' },
  { symbol: 'Wilmar', name: 'Wilmar International Ltd', priceKey: 'Wilmar', market: 'SGX' },
  { symbol: 'SIA', name: 'Singapore Airlines Ltd', priceKey: 'SIA', market: 'SGX' },
  { symbol: 'ComfortDelGro', name: 'ComfortDelGro Corp Ltd', priceKey: 'ComfortDelGro', market: 'SGX' },
  { symbol: 'SATS', name: 'SATS Ltd', priceKey: 'SATS', market: 'SGX' },

  // US Stocks
  { symbol: 'AAPL', name: 'Apple Inc.', priceKey: 'AAPL', market: 'US' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', priceKey: 'MSFT', market: 'US' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', priceKey: 'GOOGL', market: 'US' },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', priceKey: 'AMZN', market: 'US' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', priceKey: 'NVDA', market: 'US' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', priceKey: 'TSLA', market: 'US' },
  { symbol: 'META', name: 'Meta Platforms, Inc.', priceKey: 'META', market: 'US' },
  { symbol: 'NFLX', name: 'Netflix, Inc.', priceKey: 'NFLX', market: 'US' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', priceKey: 'AMD', market: 'US' },
  { symbol: 'COIN', name: 'Coinbase Global', priceKey: 'COIN', market: 'US' }
];

export const ManualRebalanceForm: React.FC<ManualRebalanceFormProps> = ({
  portfolioAssets,
  cashBalance,
  onUpdatePortfolio,
  onResetPortfolio
}) => {
  const [selectedTicker, setSelectedTicker] = useState('DSSA.JK');
  const [isCustomTicker, setIsCustomTicker] = useState(false);
  const [customTickerText, setCustomTickerText] = useState('');
  
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [priceInput, setPriceInput] = useState<string>('775');
  const [lotsInput, setLotsInput] = useState<string>('5');
  const [amountInput, setAmountInput] = useState<string>('387500'); // 775 * 5 * 100
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Live Market Prices from active feed
  const [marketPrices, setMarketPrices] = useState<Record<string, { price: number; changePercent: number }>>({});
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch /api/market/realtime-prices to bind live database quotes
  useEffect(() => {
    const fetchLiveQuotes = async () => {
      try {
        const res = await fetch('/api/market/realtime-prices');
        if (res.ok) {
          const data = await res.json();
          setMarketPrices(data);
        }
      } catch (err) {
        console.error("Failed to query live prices in manual balance segment:", err);
      }
    };
    fetchLiveQuotes();
    const timer = setInterval(fetchLiveQuotes, 8000); // Poll every 8 seconds for perfect real-time calibration
    return () => clearInterval(timer);
  }, []);

  const activeTicker = isCustomTicker ? customTickerText.toUpperCase() : selectedTicker;

  // Use refs to extract potentially fast-changing dependencies from the ticker-sync effect
  const lotsInputRef = useRef(lotsInput);
  useEffect(() => {
    lotsInputRef.current = lotsInput;
  }, [lotsInput]);

  const portfolioAssetsRef = useRef(portfolioAssets);
  useEffect(() => {
    portfolioAssetsRef.current = portfolioAssets;
  }, [portfolioAssets]);

  // Sync price details when ticker changes, or when live prices load for the active ticker
  const prevTickerRef = useRef('');
  const prevMarketPricesRef = useRef<any>(null);

  useEffect(() => {
    const cleanLookup = activeTicker.replace('.JK', '').toUpperCase();
    const liveData = marketPrices[cleanLookup];
    const tickerChanged = activeTicker !== prevTickerRef.current;
    
    // Check if market prices were loaded/updated for this ticker
    const pricesUpdated = marketPrices !== prevMarketPricesRef.current && liveData;

    if (tickerChanged || pricesUpdated) {
      prevTickerRef.current = activeTicker;
      prevMarketPricesRef.current = marketPrices;

      const currentLots = parseFloat(lotsInputRef.current) || 0;

      if (liveData) {
        setPriceInput(liveData.price.toString());
        // Recalculate estimated amount using latest price and current lots
        const p = liveData.price;
        const amt = p * currentLots * 100;
        setAmountInput(amt === 0 ? '' : Math.round(amt).toString());
      } else {
        // Fallback or preset prices
        const asset = portfolioAssetsRef.current.find(a => a.ticker === activeTicker);
        if (asset) {
          setPriceInput(asset.marketPrice.toString());
          const p = asset.marketPrice;
          const amt = p * currentLots * 100;
          setAmountInput(amt === 0 ? '' : Math.round(amt).toString());
        } else {
          let fallback = '100';
          if (activeTicker === 'COAL.JK') fallback = '150';
          else if (activeTicker === 'WMUU.JK') fallback = '50';
          else if (activeTicker === 'DSSA.JK') fallback = '775';
          else if (activeTicker === 'BUMI.JK') fallback = '140';
          
          setPriceInput(fallback);
          const p = parseFloat(fallback) || 0;
          const amt = p * currentLots * 100;
          setAmountInput(amt === 0 ? '' : Math.round(amt).toString());
        }
      }
    }
  }, [activeTicker, marketPrices]);

  // Handle price change -> update amount
  const handlePriceChange = (val: string) => {
    setPriceInput(val);
    const p = parseFloat(val) || 0;
    const l = parseFloat(lotsInput) || 0;
    const amt = p * l * 100;
    setAmountInput(amt === 0 ? '' : Math.round(amt).toString());
    setErrorMessage(null);
  };

  // Handle lots change -> update amount
  const handleLotsChange = (val: string) => {
    setLotsInput(val);
    const p = parseFloat(priceInput) || 0;
    const l = parseFloat(val) || 0;
    const amt = p * l * 100;
    setAmountInput(amt === 0 ? '' : Math.round(amt).toString());
    setErrorMessage(null);
  };

  // Handle amount change -> update lots (1 lot = 100 shares)
  const handleAmountChange = (val: string) => {
    setAmountInput(val);
    const p = parseFloat(priceInput) || 0;
    const amt = parseFloat(val) || 0;
    if (p > 0) {
      const calculatedLots = Math.round(amt / (p * 100));
      setLotsInput(calculatedLots === 0 ? '' : calculatedLots.toString());
    } else {
      setLotsInput('');
    }
    setErrorMessage(null);
  };

  const handleActionChange = (newAction: 'BUY' | 'SELL') => {
    setAction(newAction);
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const tickerVal = activeTicker.trim();
    if (!tickerVal) {
      setErrorMessage('Please specify a stock ticker.');
      return;
    }

    const price = parseFloat(priceInput) || 0;
    const lots = parseFloat(lotsInput) || 0;
    const amount = parseFloat(amountInput) || 0;

    if (price <= 0 || lots <= 0) {
      setErrorMessage('Price and Lots must be positive values.');
      return;
    }

    const feeRate = action === 'BUY' ? 0.0018 : 0.0029;
    const feeAmount = Math.round(amount * feeRate);
    const netTotal = action === 'BUY' ? amount + feeAmount : amount - feeAmount;

    if (action === 'BUY') {
      if (netTotal > cashBalance) {
        setErrorMessage(`Insufficient cash balance. Required (with fee): Rp ${netTotal.toLocaleString('id-ID')} (including 0.18% buy fee of Rp ${feeAmount.toLocaleString('id-ID')}) but RDN holds Rp ${cashBalance.toLocaleString('id-ID')}.`);
        return;
      }
    } else {
      // Selling validation - check if we hold enough lots
      const existingHolding = portfolioAssets.find(a => a.ticker.toUpperCase() === tickerVal.toUpperCase());
      const currentlyHeldLots = existingHolding ? existingHolding.lots : 0;
      if (lots > currentlyHeldLots) {
        setErrorMessage(`Insufficient position in ${tickerVal}. You hold ${currentlyHeldLots} Lots but are trying to sell ${lots} Lots.`);
        return;
      }
    }

    // Call callback to commit changes to core portfolio state
    onUpdatePortfolio(tickerVal, action, price, lots);

    setSuccessMessage(`Successfully updated: ${action} ${lots} Lots of ${tickerVal} at Rp ${price.toLocaleString('id-ID')}/share. [Gross: Rp ${amount.toLocaleString('id-ID')}, Fee (${(feeRate * 100).toFixed(2)}%): Rp ${feeAmount.toLocaleString('id-ID')}, Net: Rp ${netTotal.toLocaleString('id-ID')}]`);
    
    // Clear custom texts and show success anim
    if (isCustomTicker) {
      setCustomTickerText('');
      setIsCustomTicker(false);
    }
    
    // Auto-timeout success feedback
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  const currentHoldingOfSelected = portfolioAssets.find(a => a.ticker === activeTicker);

  return (
    <div className="bg-slate-950 p-6 rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Visual background lights */}
      <div className="absolute top-0 right-0 p-10 bg-[#deff9a]/5 blur-3xl rounded-full -mr-8 -mt-8 pointer-events-none"></div>
      
      <div className="flex justify-between items-start mb-5 relative z-10">
        <div>
          <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#deff9a]" />
            Manual Portfolio Rebalancing Entry
          </h4>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
            Synchronize, edit, or append assets directly to physical balancing ledger
          </p>
        </div>
        {onResetPortfolio && (
          <button
            type="button"
            onClick={onResetPortfolio}
            className="p-1 px-2 text-[10px] bg-slate-900 border border-slate-800 text-slate-400 hover:text-[#deff9a] hover:border-[#deff9a]/30 rounded-lg transition-all flex items-center gap-1 font-bold uppercase"
            title="Reset positions to default setup"
          >
            <RefreshCw className="w-3 h-3" />
            Reset Ledger
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
        {/* Ticker & Buy/Sell Segmented Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Ticker Input Group */}
          <div className="space-y-1.5 relative">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Asset Ticker</label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomTicker(!isCustomTicker);
                  setErrorMessage(null);
                  setShowDropdown(false);
                }}
                className="text-[9px] text-[#deff9a] font-black uppercase hover:underline"
              >
                {isCustomTicker ? 'Select Preset' : 'Enter Custom'}
              </button>
            </div>
            
            {isCustomTicker ? (
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. BBRI.JK atau BMRI"
                  value={customTickerText}
                  onFocus={() => setShowDropdown(true)}
                  onChange={(e) => {
                    setCustomTickerText(e.target.value);
                    setErrorMessage(null);
                    setShowDropdown(true);
                  }}
                  className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-[#deff9a]"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                
                {/* Autocomplete Dropdown suggestions loaded from live market monitor */}
                <AnimatePresence>
                  {showDropdown && customTickerText.trim() && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute left-0 right-0 mt-1.5 max-h-56 overflow-y-auto bg-slate-950/95 border border-slate-800 rounded-xl shadow-2xl z-50 p-1 divide-y divide-slate-900 backdrop-blur-md scrollbar-thin scrollbar-thumb-slate-800"
                    >
                      {(() => {
                        const searchStr = customTickerText.trim().toLowerCase();
                        const suggestions = ALL_SUGGESTIONS.filter(item => 
                          item.symbol.toLowerCase().includes(searchStr) || 
                          item.name.toLowerCase().includes(searchStr)
                        ).slice(0, 5);

                        if (suggestions.length === 0) {
                          return (
                            <div className="p-3 text-[10px] text-zinc-500 font-bold uppercase text-center">
                              No matching ticker found
                            </div>
                          );
                        }

                        return suggestions.map(item => {
                          const quote = marketPrices[item.priceKey];
                          const hasPrice = typeof quote?.price === 'number';
                          const change = quote?.changePercent || 0;
                          const isGain = change >= 0;

                          return (
                            <button
                              key={item.symbol}
                              type="button"
                              onClick={() => {
                                setCustomTickerText(item.symbol);
                                setShowDropdown(false);
                                
                                // Auto price lookup inside marketPrices directly
                                if (hasPrice) {
                                  setPriceInput(quote.price.toString());
                                  const l = parseFloat(lotsInput) || 0;
                                  const amt = quote.price * l * 100;
                                  setAmountInput(amt === 0 ? '' : Math.round(amt).toString());
                                }
                              }}
                              className="w-full text-left p-2.5 hover:bg-white/[0.03] transition-all flex justify-between items-center rounded-lg"
                            >
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-black text-[#deff9a] font-mono tracking-tight">{item.symbol}</span>
                                  <span className="text-[8px] bg-slate-900 border border-slate-800 text-zinc-400 px-1 rounded font-mono uppercase">{item.market}</span>
                                </div>
                                <span className="text-[9px] text-zinc-400 block truncate max-w-[150px]">{item.name}</span>
                              </div>
                              <div className="text-right font-mono">
                                <span className="text-[10px] text-white font-bold block">
                                  {hasPrice ? `Rp ${quote.price.toLocaleString('id-ID')}` : 'Calculating...'}
                                </span>
                                {hasPrice && (
                                  <span className={`text-[8px] font-bold ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {isGain ? '▲' : '▼'} {isGain ? '+' : ''}{change.toFixed(2)}%
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        });
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <select
                value={selectedTicker}
                onChange={(e) => setSelectedTicker(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#deff9a]"
              >
                {PRESET_TICKERS.map(p => {
                  const cleanKey = p.symbol.replace('.JK', '');
                  const quotePrice = marketPrices[cleanKey]?.price;
                  return (
                    <option key={p.symbol} value={p.symbol}>
                      {p.symbol} - {p.name} {quotePrice ? `(Rp ${quotePrice.toLocaleString('id-ID')})` : ''}
                    </option>
                  );
                })}
              </select>
            )}

            {/* Live feedback label on selected Ticker */}
            {(() => {
              const cleanKey = activeTicker.replace('.JK', '').toUpperCase();
              const quote = marketPrices[cleanKey];
              if (!quote) return null;
              const isGain = quote.changePercent >= 0;
              return (
                <div className="flex items-center gap-1.5 pl-1 text-[9px] text-zinc-400">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold uppercase tracking-wider text-[8px] text-zinc-500">Live Quote:</span>
                  <span className="font-mono text-[#deff9a] font-bold">Rp {quote.price.toLocaleString('id-ID')}</span>
                  <span className={`font-mono text-[8px] font-bold ${isGain ? 'text-emerald-500' : 'text-rose-500'}`}>
                    ({isGain ? '+' : ''}{quote.changePercent.toFixed(2)}%)
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Action Segmented Controller (Buy/Sell Toggle) */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1">Execution Direction</label>
            <div className="grid grid-cols-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => handleActionChange('BUY')}
                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                  action === 'BUY'
                    ? 'bg-green-500 text-black shadow-lg text-opacity-100 font-black'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                BUY / ACCUMULATE
              </button>
              <button
                type="button"
                onClick={() => handleActionChange('SELL')}
                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                  action === 'SELL'
                    ? 'bg-red-500 text-white shadow-lg font-black'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                SELL / DISTRIBUTION
              </button>
            </div>
          </div>
        </div>

        {/* Current Position Quick Info Badge */}
        {currentHoldingOfSelected && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-2.5 flex justify-between items-center text-[10px]">
            <span className="text-zinc-500 uppercase font-bold">Current Held Position:</span>
            <span className="font-mono text-zinc-300 font-semibold uppercase">
              {currentHoldingOfSelected.lots} Lots @ Rp {currentHoldingOfSelected.averagePrice.toLocaleString('id-ID')} avg
            </span>
          </div>
        )}

        {/* Triple Input Parameter Grid: Price, Lots, Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Price Component */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1">Rebalance Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-500">Rp</span>
              <input
                type="number"
                value={priceInput}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#deff9a]"
              />
            </div>
          </div>

          {/* Lots Input (1 Lot = 100 Shares) */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1">Lot Size</label>
            <div className="relative">
              <input
                type="number"
                value={lotsInput}
                onChange={(e) => handleLotsChange(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#deff9a]"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-500 uppercase tracking-widest pointer-events-none">
                (x100 SHRS)
              </span>
            </div>
          </div>

          {/* Dynamic Amount Component */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1">Total Transaction Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-500">Rp</span>
              <input
                type="number"
                value={amountInput}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#deff9a]"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[7px] text-[#deff9a] font-mono pointer-events-none">
                Auto
              </span>
            </div>
          </div>

        </div>

        {/* Dynamic Ticket Preview with Fee detail structure (Buy: 0.18%, Sell: 0.29%) */}
        {(() => {
          const parsedPrice = parseFloat(priceInput) || 0;
          const parsedLots = parseFloat(lotsInput) || 0;
          const grossAmountVal = parsedPrice * parsedLots * 100;
          
          if (grossAmountVal <= 0) return null;

          const currentFeeRate = action === 'BUY' ? 0.0018 : 0.0029;
          const calculatedFeeVal = Math.round(grossAmountVal * currentFeeRate);
          const calculatedNetTotal = action === 'BUY' ? grossAmountVal + calculatedFeeVal : grossAmountVal - calculatedFeeVal;

          // Advanced P&L impact calculations based on live market monitor data
          const cleanActiveTicker = activeTicker.replace('.JK', '').toUpperCase();
          const activeTickerLive = marketPrices[cleanActiveTicker];
          const livePriceValue = activeTickerLive ? activeTickerLive.price : (currentHoldingOfSelected ? currentHoldingOfSelected.marketPrice : parsedPrice);
          
          const currentHeldCostVal = currentHoldingOfSelected 
            ? currentHoldingOfSelected.averagePrice * currentHoldingOfSelected.lots * 100 
            : 0;

          let pnlElement = null;

          if (action === 'SELL' && currentHoldingOfSelected) {
            // Realized P&L projections on selling
            const profitPerShare = parsedPrice - currentHoldingOfSelected.averagePrice;
            const realizedPnLOfTrade = profitPerShare * parsedLots * 100;
            const realizedPct = (profitPerShare / currentHoldingOfSelected.averagePrice) * 100;
            const isGain = realizedPnLOfTrade >= 0;

            pnlElement = (
              <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1.5 mt-2">
                <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold uppercase tracking-wide">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                    Proyeksi Realisasi P&L (Trade P&L Projection)
                  </span>
                  <span className={`font-black ${isGain ? "text-emerald-400" : "text-rose-400"}`}>
                    {isGain ? 'UNTUNG / SURPLUS' : 'RUGI / DEFISIT'}
                  </span>
                </div>
                <div className="flex justify-between items-end text-[10px]">
                  <div>
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Harga Rata-Rata Beli</span>
                    <span className="font-mono text-zinc-300 font-semibold text-[11px]">Rp {currentHoldingOfSelected.averagePrice.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Estimasi Realized Return</span>
                    <span className={`font-mono text-[11px] font-black block ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isGain ? '+' : ''}{Math.round(realizedPnLOfTrade).toLocaleString('id-ID')} IDR ({realizedPct.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          } else if (action === 'BUY') {
            if (currentHoldingOfSelected) {
              // Recalculating portfolio holding basis (Averaging Up / Down)
              const originalCostBasis = currentHoldingOfSelected.averagePrice * currentHoldingOfSelected.lots * 100;
              const newTransactionCostBasis = parsedPrice * parsedLots * 100;
              const combinedLots = currentHoldingOfSelected.lots + parsedLots;
              const projectedAveragePrice = (originalCostBasis + newTransactionCostBasis) / (combinedLots * 100);
              
              const avgDiffPct = ((projectedAveragePrice - currentHoldingOfSelected.averagePrice) / currentHoldingOfSelected.averagePrice) * 100;
              const avgChangedDirection = projectedAveragePrice >= currentHoldingOfSelected.averagePrice;

              // Current live market valuation & future estimated unrealized P&L
              const projectedUnrealizedPnL = (livePriceValue - projectedAveragePrice) * combinedLots * 100;
              const isProjGain = projectedUnrealizedPnL >= 0;

              pnlElement = (
                <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2.5 mt-2 text-[10px]">
                  <div className="flex justify-between items-center text-zinc-400 font-bold uppercase tracking-wide">
                    <span className="flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-[#deff9a]" />
                      Proyeksi Rekalibrasi Posisi (Portfolio Averaging)
                    </span>
                    <span className="text-zinc-500 text-[8px] font-black uppercase">
                      {avgChangedDirection ? 'AVERAGING UP ↑' : 'AVERAGING DOWN ↓'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">Harga Rata-Rata Baru (Projected Avg)</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="font-mono font-bold text-slate-100 text-[11px]">Rp {Math.round(projectedAveragePrice).toLocaleString('id-ID')}</span>
                        <span className={`text-[8px] font-mono font-extrabold ${avgChangedDirection ? 'text-amber-400' : 'text-emerald-400'}`}>
                          ({avgChangedDirection ? '+' : ''}{avgDiffPct.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold block">Ref Harga Pasar (Live Market)</span>
                      <span className="font-mono font-bold text-[#deff9a] mt-0.5 block text-[11px]">
                        Rp {livePriceValue.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="h-px bg-slate-800/40 my-1" />

                  <div className="flex justify-between items-center">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-wider font-bold">Proyeksi Unrealized P&L Pasca Rebalance</span>
                    <span className={`font-mono text-[11px] font-black ${isProjGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProjGain ? '+' : ''}{Math.round(projectedUnrealizedPnL).toLocaleString('id-ID')} IDR
                    </span>
                  </div>
                </div>
              );
            } else {
              // Opening brand new asset on portfolio ledger
              const immediatePnL = (livePriceValue - parsedPrice) * parsedLots * 100;
              const isGainOfEntry = immediatePnL >= 0;

              pnlElement = (
                <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1.5 mt-2 text-[10px]">
                  <div className="flex justify-between items-center text-zinc-400 font-bold uppercase tracking-wide">
                    <span className="flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5 text-[#deff9a]" />
                      Membuka Posisi Baru (New Asset Initialization)
                    </span>
                    <span className="text-emerald-400 font-extrabold text-[8px] tracking-wider uppercase">INITIAL BLOCK</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[8px] text-zinc-500 uppercase tracking-widest block mt-0.5 font-bold">Inisialisasi Posisi</span>
                      <span className="font-mono text-[10px] text-zinc-300 font-semibold">{parsedLots} Lots pada Rp {parsedPrice.toLocaleString('id-ID')}</span>
                    </div>
                    {immediatePnL !== 0 && (
                      <div className="text-right">
                        <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Arbitrase Harga Live</span>
                        <span className={`font-mono text-[10.5px] font-black block ${isGainOfEntry ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isGainOfEntry ? '+' : ''}{Math.round(immediatePnL).toLocaleString('id-ID')} IDR
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          }

          return (
            <div className="space-y-3">
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-2 text-[10px]">
                <div className="flex justify-between items-center text-zinc-500 font-bold uppercase tracking-wider">
                  <span>Gross Settlement Size</span>
                  <span className="font-mono text-zinc-300">Rp {grossAmountVal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-500 font-bold uppercase tracking-wider">
                  <span>Brokerage Fee ({action === 'BUY' ? 'Buy: 0.18%' : 'Sell: 0.29%'})</span>
                  <span className="font-mono text-[#deff9a]">Rp {calculatedFeeVal.toLocaleString('id-ID')}</span>
                </div>
                <div className="h-px bg-slate-850 my-1"></div>
                <div className="flex justify-between items-center uppercase tracking-widest font-black text-[11px]">
                  <span className="text-slate-200">Net Estimated {action === 'BUY' ? 'Debit' : 'Credit'}</span>
                  <span className={`font-mono ${action === 'BUY' ? 'text-red-400' : 'text-green-400'}`}>
                    Rp {calculatedNetTotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Seamless Live Recalibration & P&L Calculation displays */}
              {pnlElement}
            </div>
          );
        })()}

        {/* Validation Errors & Feedbacks */}
        <AnimatePresence mode="wait">
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl flex items-center gap-2.5 text-red-400 text-[10px] font-bold"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="bg-green-500/10 border border-green-500/30 p-3 rounded-xl flex items-center gap-2.5 text-green-400 text-[10px] font-bold"
            >
              <TrendingUp className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA Button */}
        <button
          type="submit"
          className={`w-full py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 ${
            action === 'BUY'
              ? 'bg-[#deff9a] hover:bg-[#cbe68e] text-slate-950 shadow-lg hover:scale-[1.01] active:scale-[0.98]'
              : 'bg-red-500 hover:bg-red-650 text-white shadow-lg hover:scale-[1.01] active:scale-[0.98]'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          Commit Rebalance {action} Transaction
        </button>
      </form>
    </div>
  );
};
