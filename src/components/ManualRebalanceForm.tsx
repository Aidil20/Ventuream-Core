import React, { useState, useEffect } from 'react';
import { Scale, Plus, ArrowRightLeft, Sparkles, RefreshCw, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
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
  { symbol: 'DEFI.JK', name: 'Danasupra Erapacific' },
  { symbol: 'KOTA.JK', name: 'DMS Propertindo' },
  { symbol: 'LAND.JK', name: 'Trimitra Propertindo' },
  { symbol: 'LPKR.JK', name: 'Lippo Karawaci' },
  { symbol: 'PIPA.JK', name: 'Multi Makmur Lemindo' },
  { symbol: 'COAL.JK', name: 'Coal Energy' },
  { symbol: 'WMUU.JK', name: 'Widodo Makmur Unggas' }
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

  const activeTicker = isCustomTicker ? customTickerText.toUpperCase() : selectedTicker;

  // Auto price lookup based on existing assets or presets
  useEffect(() => {
    if (!isCustomTicker) {
      const asset = portfolioAssets.find(a => a.ticker === selectedTicker);
      if (asset) {
        setPriceInput(asset.marketPrice.toString());
      } else {
        // Fallbacks for extra presets
        if (selectedTicker === 'COAL.JK') setPriceInput('150');
        else if (selectedTicker === 'WMUU.JK') setPriceInput('50');
      }
    }
  }, [selectedTicker, isCustomTicker, portfolioAssets]);

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
          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Asset Ticker</label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomTicker(!isCustomTicker);
                  setErrorMessage(null);
                }}
                className="text-[9px] text-[#deff9a] font-black uppercase hover:underline"
              >
                {isCustomTicker ? 'Select Preset' : 'Enter Custom'}
              </button>
            </div>
            
            {isCustomTicker ? (
              <input
                type="text"
                placeholder="e.g. BBRI.JK"
                value={customTickerText}
                onChange={(e) => {
                  setCustomTickerText(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-[#deff9a]"
              />
            ) : (
              <select
                value={selectedTicker}
                onChange={(e) => setSelectedTicker(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#deff9a]"
              >
                {PRESET_TICKERS.map(p => (
                  <option key={p.symbol} value={p.symbol}>
                    {p.symbol} - {p.name}
                  </option>
                ))}
              </select>
            )}
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

          return (
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
