import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Droplets, 
  Activity, 
  ShieldCheck,
  Calendar,
  Globe,
  Info,
  Zap,
  BarChart3,
  Maximize2
} from 'lucide-react';
import { Sparkline } from './Sparkline';

interface AssetDetailProps {
  asset: {
    id: string;
    name: string;
    symbol: string;
    category: string;
    value: string;
    status: string;
    type: string;
    percentage: string;
    liquidity: string;
    performance: number[];
  };
  onBack: () => void;
}

export function AssetDetail({ asset, onBack }: AssetDetailProps) {
  const isPositive = asset.status === 'Bullish' || asset.status === 'Performing' || asset.status === 'Stable';

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <button 
          onClick={onBack}
          className="p-2 bg-slate-900/50 text-[#deff9a] rounded-xl border border-slate-800 hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Asset Overview</p>
          <p className="text-[8px] text-[#deff9a] font-mono uppercase">VentureAM Core v2.4</p>
        </div>
      </div>

      {/* Asset Hero Card */}
      <section className="bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-800/80 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-[#deff9a]/5 blur-3xl rounded-full group-hover:bg-[#deff9a]/10 transition-colors" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] px-2 py-0.5 rounded-lg bg-slate-950 text-slate-500 font-black border border-slate-800 uppercase tracking-widest">
                  {asset.symbol}
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-lg bg-blue-900/20 text-blue-400 font-black border border-blue-800/20 uppercase tracking-widest">
                  {asset.type}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-tight">
                {asset.name}
              </h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{asset.category}</p>
            </div>
            <div className={`p-3 rounded-2xl ${isPositive ? 'bg-green-500/10' : 'bg-red-500/10'} border border-opacity-20 ${isPositive ? 'border-green-500' : 'border-red-500'}`}>
              {isPositive ? <TrendingUp className="w-6 h-6 text-green-400" /> : <TrendingDown className="w-6 h-6 text-red-400" />}
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-8">
            <span className="text-lg font-bold text-slate-400">Rp</span>
            <p className="text-4xl font-black font-mono tracking-tighter text-white">
              {asset.value.replace('Rp ', '')}
            </p>
            <span className={`text-sm font-bold ${isPositive ? 'text-[#deff9a]' : 'text-red-400'}`}>
              {asset.percentage}
            </span>
          </div>

          <div className="w-full h-24 mb-6">
            <Sparkline 
              data={asset.performance} 
              color={isPositive ? '#deff9a' : '#ef4444'} 
              height={80} 
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800">
              <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                <Droplets className="w-2.5 h-2.5" /> Liquidity
              </p>
              <p className={`text-xs font-black uppercase ${
                asset.liquidity === 'High' ? 'text-green-400' : 
                asset.liquidity === 'Medium' ? 'text-blue-400' : 'text-red-400'
              }`}>
                {asset.liquidity}
              </p>
            </div>
            <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800">
              <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                <Activity className="w-2.5 h-2.5" /> Sentiment
              </p>
              <p className="text-xs font-black text-white uppercase">{asset.status}</p>
            </div>
            <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800">
              <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5" /> Safety
              </p>
              <p className="text-xs font-black text-blue-400 uppercase">TIER 1</p>
            </div>
          </div>
        </div>
      </section>

      {/* Asset Statistics & Performance */}
      <section className="bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800/80">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <Activity className="w-3 h-3 text-[#deff9a]" /> Asset Analytics
        </h4>
        <div className="space-y-4">
          {[
            { label: 'Market Cap', value: 'Rp 42.8 T', icon: Globe },
            { label: 'Volume (24h)', value: '1.24M Shares', icon: Activity },
            { label: 'P/E Ratio', value: '14.2x', icon: TrendingUp },
            { label: '52w High / Low', value: 'Rp 280k / Rp 195k', icon: Maximize2 },
            { label: 'ATR (14)', value: '4.82', icon: Zap },
            { label: 'Volatility', value: '18.4%', icon: BarChart3 },
            { label: 'Div. Yield', value: '2.8%', icon: Calendar },
          ].map((stat, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-slate-800/50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-slate-800 rounded-lg text-slate-400">
                  <stat.icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs text-slate-400 font-bold">{stat.label}</span>
              </div>
              <span className="text-xs text-white font-mono font-bold">{stat.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button className="py-4 rounded-2xl bg-[#deff9a] text-slate-950 font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(222,255,154,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all">
          Execute Buy Order
        </button>
        <button className="py-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 active:scale-[0.98] transition-all">
          Add to Watchlist
        </button>
      </div>

      {/* Risk Disclosure */}
      <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl">
        <p className="text-[9px] text-orange-400/80 font-medium leading-relaxed italic text-center">
          Investments in {asset.category} carry market risks. Technical analysis suggests {asset.status.toLowerCase()} momentum. Always verify with VentureAM advisory before allocation.
        </p>
      </div>
    </motion.div>
  );
}
