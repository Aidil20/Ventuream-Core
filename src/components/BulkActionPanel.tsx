import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, ShieldAlert, Check, Trash2, X, Percent, ArrowDownRight } from 'lucide-react';

interface BulkActionPanelProps {
  selectedCount: number;
  selectedAssets: any[];
  onApplyAction: (action: 'targetWeight' | 'stopLoss', value: number | Record<string, number>) => void;
  onClearAction: (action: 'targetWeight' | 'stopLoss' | 'all') => void;
  onClose: () => void;
}

export default function BulkActionPanel({
  selectedCount,
  selectedAssets,
  onApplyAction,
  onClearAction,
  onClose,
}: BulkActionPanelProps) {
  const [activeTab, setActiveTab] = useState<'WEIGHT' | 'STOP_LOSS'>('WEIGHT');
  const [targetWeight, setTargetWeight] = useState<number>(10);
  const [stopLossInputType, setStopLossInputType] = useState<'PRICE' | 'PERCENT'>('PERCENT');
  const [stopLossPercent, setStopLossPercent] = useState<number>(10);
  const [stopLossPrice, setStopLossPrice] = useState<string>('');

  const handleApply = () => {
    if (activeTab === 'WEIGHT') {
      if (targetWeight < 0 || targetWeight > 100) return;
      onApplyAction('targetWeight', targetWeight);
    } else {
      if (stopLossInputType === 'PERCENT') {
        // Calculate stop loss price for each asset based on its current market price
        const pricesMap: Record<string, number> = {};
        selectedAssets.forEach(asset => {
          const currentPrice = asset.currentPrice || asset.marketPrice || 0;
          const slPrice = Math.round(currentPrice * (1 - stopLossPercent / 100));
          pricesMap[asset.ticker] = slPrice;
        });
        onApplyAction('stopLoss', pricesMap);
      } else {
        const parsedPrice = parseFloat(stopLossPrice);
        if (isNaN(parsedPrice) || parsedPrice <= 0) return;
        onApplyAction('stopLoss', parsedPrice);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="bg-slate-950 border border-slate-800/90 rounded-3xl shadow-2xl p-6 relative overflow-hidden"
    >
      {/* Decorative accent pulse */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#DFFF00]/30 to-transparent"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#DFFF00]/10 rounded-lg border border-[#DFFF00]/20">
            <span className="text-xs font-black text-[#DFFF00] font-mono select-none">
              {selectedCount}
            </span>
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Bulk Portfolio Actions
            </h4>
            <p className="text-[10px] text-zinc-500 font-medium">
              Applying changes to: <span className="text-slate-300 font-mono">{selectedAssets.map(a => a.ticker.split('.')[0]).join(', ')}</span>
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/50 rounded-xl mb-4 border border-slate-800/50">
        <button
          onClick={() => setActiveTab('WEIGHT')}
          className={`flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
            activeTab === 'WEIGHT'
              ? 'bg-slate-850 text-[#DFFF00] shadow-md border border-slate-800'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          Set Target Weight
        </button>
        <button
          onClick={() => setActiveTab('STOP_LOSS')}
          className={`flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
            activeTab === 'STOP_LOSS'
              ? 'bg-slate-850 text-[#DFFF00] shadow-md border border-slate-800'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Set Stop-Loss
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-4 mb-4">
        {activeTab === 'WEIGHT' ? (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  <Percent className="w-3 h-3 text-zinc-500" /> Target Weight
                </label>
                <span className="text-xs font-bold text-[#DFFF00] font-mono">{targetWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={targetWeight}
                onChange={(e) => setTargetWeight(Number(e.target.value))}
                className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-[#DFFF00]"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              {[2.5, 5, 7.5, 10, 15, 20].map((val) => (
                <button
                  key={val}
                  onClick={() => setTargetWeight(val)}
                  className={`px-2.5 py-1 text-[9px] font-mono font-bold rounded-md border transition-all ${
                    targetWeight === val
                      ? 'bg-[#DFFF00]/10 border-[#DFFF00]/40 text-[#DFFF00]'
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white hover:border-slate-800'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Input Type Selection */}
            <div className="flex items-center gap-4 mb-2 border-b border-slate-900 pb-2">
              <button
                onClick={() => setStopLossInputType('PERCENT')}
                className={`text-[9px] font-bold uppercase tracking-wide flex items-center gap-1 transition-colors ${
                  stopLossInputType === 'PERCENT' ? 'text-[#DFFF00]' : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                <ArrowDownRight className="w-3 h-3" />
                Percentage Below Price
              </button>
              <button
                onClick={() => setStopLossInputType('PRICE')}
                className={`text-[9px] font-bold uppercase tracking-wide flex items-center gap-1 transition-colors ${
                  stopLossInputType === 'PRICE' ? 'text-[#DFFF00]' : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                <Percent className="w-3 h-3" />
                Absolute Price
              </button>
            </div>

            {stopLossInputType === 'PERCENT' ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Risk Distance
                  </label>
                  <span className="text-xs font-bold text-rose-400 font-mono">-{stopLossPercent}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="30"
                  step="1"
                  value={stopLossPercent}
                  onChange={(e) => setStopLossPercent(Number(e.target.value))}
                  className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />

                {/* Quick risk presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[5, 8, 10, 12, 15, 20].map((val) => (
                    <button
                      key={val}
                      onClick={() => setStopLossPercent(val)}
                      className={`px-2.5 py-1 text-[9px] font-mono font-bold rounded-md border transition-all ${
                        stopLossPercent === val
                          ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white hover:border-slate-800'
                      }`}
                    >
                      -{val}%
                    </button>
                  ))}
                </div>
                <p className="text-[8px] text-zinc-500 font-semibold uppercase tracking-wider mt-1">
                  *This will calculate an individual stop-loss price for each asset automatically.
                </p>
              </div>
            ) : (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">
                  Absolute Stop-Loss Price (IDR/USD)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="e.g. 150"
                    value={stopLossPrice}
                    onChange={(e) => setStopLossPrice(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#DFFF00]"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Panel Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleApply}
          className="flex-1 py-2 px-3 bg-[#DFFF00] text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 hover:bg-[#cbe600] transition-colors shadow-lg shadow-[#DFFF00]/10"
        >
          <Check className="w-3.5 h-3.5" />
          Apply to {selectedCount} Assets
        </button>

        <button
          onClick={() => onClearAction(activeTab === 'WEIGHT' ? 'targetWeight' : 'stopLoss')}
          className="py-2 px-3 bg-slate-900 border border-slate-800 text-rose-400 hover:text-rose-300 font-bold text-[10px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-850 transition-colors"
          title="Clear Targets for Selected"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>
    </motion.div>
  );
}
