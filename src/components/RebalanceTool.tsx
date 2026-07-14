import React, { useState, useMemo } from 'react';
import { Scale, ArrowRightLeft, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Decimal } from 'decimal.js';
import { ManualRebalanceForm } from './ManualRebalanceForm';

interface PortfolioAsset {
  ticker: string;
  marketValue: number;
  currentPrice: number;
}

interface RawAsset {
  ticker: string;
  lots: number;
  averagePrice: number;
  marketPrice: number;
}

interface RebalanceToolProps {
  portfolioData: PortfolioAsset[];
  cashBalance: number;
  portfolioAssets: RawAsset[];
  onUpdatePortfolio: (ticker: string, action: 'BUY' | 'SELL', price: number, lots: number) => void;
  onResetPortfolio?: () => void;
}

type Strategy = 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';

const STRATEGY_TARGETS: Record<Strategy, Record<string, number>> = {
  CONSERVATIVE: {
    'Financial': 40,
    'Service': 20,
    'Property': 15,
    'Energy': 10,
    'Other': 15
  },
  BALANCED: {
    'Financial': 25,
    'Energy': 25,
    'Property': 25,
    'Service': 15,
    'Other': 10
  },
  AGGRESSIVE: {
    'Energy': 45,
    'Property': 25,
    'Financial': 15,
    'Service': 10,
    'Other': 5
  }
};

const TICKER_TO_SECTOR: Record<string, string> = {
  'COAL.JK': 'Energy',
  'BUMI.JK': 'Energy',
  'DEFI.JK': 'Financial',
  'DSSA.JK': 'Energy',
  'KOTA.JK': 'Service',
  'LAND.JK': 'Property',
  'LPKR.JK': 'Property',
  'PIPA.JK': 'Service',
  'WMUU.JK': 'Consumer',
  'BACH.JK': 'Basic Materials',
  'EMMI.JK': 'Consumer',
  'JECX.JK': 'Technology',
  'PRDL.JK': 'Property',
  'RANS.JK': 'Consumer',
  'PJHB-W.JK': 'Financial'
};

const RebalanceTool: React.FC<RebalanceToolProps> = ({
  portfolioData,
  cashBalance,
  portfolioAssets,
  onUpdatePortfolio,
  onResetPortfolio
}) => {
  const [strategy, setStrategy] = useState<Strategy>('BALANCED');
  const [isExecuting, setIsExecuting] = useState(false);

  const totalPortfolioValue = useMemo(() => {
    return portfolioData.reduce((acc, asset) => acc.plus(asset.marketValue), new Decimal(0)).plus(cashBalance);
  }, [portfolioData, cashBalance]);

  const currentAllocation = useMemo(() => {
    const sectors: Record<string, Decimal> = {};
    let totalAssigned = new Decimal(0);

    portfolioData.forEach(asset => {
      const sector = TICKER_TO_SECTOR[asset.ticker] || 'Other';
      sectors[sector] = (sectors[sector] || new Decimal(0)).plus(asset.marketValue);
      totalAssigned = totalAssigned.plus(asset.marketValue);
    });

    const cashPercentage = totalPortfolioValue.isZero() ? new Decimal(0) : new Decimal(cashBalance).div(totalPortfolioValue).times(100);
    
    const results: Record<string, number> = {
      'Cash': cashPercentage.toDecimalPlaces(1).toNumber()
    };

    Object.entries(sectors).forEach(([sector, value]) => {
      results[sector] = value.div(totalPortfolioValue).times(100).toDecimalPlaces(1).toNumber();
    });

    return results;
  }, [portfolioData, cashBalance, totalPortfolioValue]);

  const recommendations = useMemo(() => {
    const targets = STRATEGY_TARGETS[strategy];
    const recs: { sector: string; current: number; target: number; action: string; amount: number }[] = [];

    // Ensure all target sectors are accounted for
    const allSectors = Array.from(new Set([...Object.keys(targets), ...Object.keys(currentAllocation)]))
      .filter(s => s !== 'Cash');

    allSectors.forEach(sector => {
      const current = currentAllocation[sector] || 0;
      const target = targets[sector] || 0;
      const diff = target - current;

      if (Math.abs(diff) > 2) { // 2% threshold
        const amount = totalPortfolioValue.times(diff).div(100).toDecimalPlaces(0).toNumber();
        recs.push({
          sector,
          current,
          target,
          action: diff > 0 ? 'BUY' : 'SELL',
          amount: Math.abs(amount)
        });
      }
    });

    return recs.sort((a, b) => b.amount - a.amount);
  }, [currentAllocation, strategy, totalPortfolioValue]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-950/80 border border-slate-800 rounded-[2.5rem] p-6 backdrop-blur-xl space-y-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#deff9a]/10 rounded-2xl border border-[#deff9a]/20">
              <Scale className="w-5 h-5 text-[#deff9a]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Institutional Rebalancer</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Portfolio Optimization Engine</p>
            </div>
          </div>
          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
            {(['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'] as Strategy[]).map(s => (
              <button
                key={s}
                onClick={() => setStrategy(s)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest transition-all ${strategy === s ? 'bg-[#deff9a] text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current vs Target */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Allocation Drift Analysis</h4>
            <div className="space-y-3">
              {Object.entries(STRATEGY_TARGETS[strategy]).map(([sector, targetWeight]) => {
                const currentWeight = currentAllocation[sector] || 0;
                const targetNum = targetWeight as number;
                const drift = currentWeight - targetNum;
                return (
                  <div key={sector} className="bg-slate-900/40 p-3 rounded-2xl border border-slate-800/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-bold text-slate-300 uppercase">{sector}</span>
                      <span className={`text-[10px] font-mono font-bold ${Math.abs(drift) > 5 ? 'text-red-400' : 'text-slate-500'}`}>
                        DRIFT: {drift > 0 ? '+' : ''}{drift.toFixed(1)}%
                      </span>
                    </div>
                    <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-slate-700" 
                        style={{ width: `${targetWeight}%` }}
                      />
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${currentWeight}%` }}
                        className={`absolute top-0 left-0 h-full ${Math.abs(drift) > 5 ? 'bg-red-500/50' : 'bg-[#deff9a]/50'}`}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-[8px] font-black uppercase tracking-tighter text-slate-600">
                      <span>Current: {currentWeight}%</span>
                      <span>Target: {targetWeight}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Suggested Actions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Suggested Executions</h4>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-[8px] text-blue-400 font-bold uppercase">Optimal Impact</span>
              </div>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 flex-1">
              {recommendations.length > 0 ? (
                recommendations.map((rec, idx) => (
                  <motion.div
                    key={rec.sector}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex justify-between items-center group hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${rec.action === 'BUY' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {rec.action === 'BUY' ? <TrendingUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 rotate-180" />}
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-slate-200 uppercase tracking-tight">{rec.action} {rec.sector}</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Adjust by {Math.abs(rec.target - rec.current).toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-black text-white">Rp {typeof rec.amount === 'number' ? rec.amount.toLocaleString('id-ID') : '0'}</p>
                      <p className="text-[8px] text-slate-500 font-bold uppercase">Estimated Impact</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="bg-slate-900/40 p-12 rounded-[2.5rem] border border-dashed border-slate-800 flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="w-10 h-10 text-green-500/30 mb-4" />
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Portfolio Aligned</p>
                  <p className="text-[10px] text-slate-600 mt-2 uppercase">Current drift within ±2% tolerance</p>
                </div>
              )}
            </div>

            {recommendations.length > 0 && (
              <button 
                onClick={() => {
                  setIsExecuting(true);
                  setTimeout(() => setIsExecuting(false), 2000);
                }}
                disabled={isExecuting}
                className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                {isExecuting ? (
                  <>
                    <Scale className="w-4 h-4 animate-spin" />
                    Balancing Liquidity...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-4 h-4 text-orange-500" />
                    Execute Comprehensive Rebalance
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Market Caution Footer */}
        <div className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-2xl flex items-center gap-4">
          <div className="p-2 bg-orange-500/10 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1">
            <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-0.5">Execution Advisory</p>
            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
              Market volatility is currently <span className="text-orange-400">High</span>. Rebalancing may incur slippage on IL-heavy symbols (COAL, DEFI). Verify order depth before execution.
            </p>
          </div>
        </div>
      </div>

      {/* Embedded Manual Rebalance Entry Form */}
      <ManualRebalanceForm
        portfolioAssets={portfolioAssets}
        cashBalance={cashBalance}
        onUpdatePortfolio={onUpdatePortfolio}
        onResetPortfolio={onResetPortfolio}
      />
    </div>
  );
};

export default RebalanceTool;
