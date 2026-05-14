import React from 'react';
import { ExternalLink, Globe, Zap, Anchor, Activity, Briefcase, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface GatewayLink {
  name: string;
  url: string;
  description: string;
  icon: React.ElementType;
  tag?: string;
  color: string;
}

const GATEWAY_LINKS: GatewayLink[] = [
  {
    name: "Bloomberg Markets",
    url: "https://www.bloomberg.com/markets",
    description: "Global terminal standard for real-time financial data and terminal intelligence.",
    icon: Zap,
    tag: "GLOBAL",
    color: "#deff9a"
  },
  {
    name: "Reuters Financial",
    url: "https://www.reuters.com/",
    description: "Breaking institutional news feed and global market reporting.",
    icon: Globe,
    tag: "INSTITUTIONAL",
    color: "#60a5fa"
  },
  {
    name: "Investing.com Commodities",
    url: "https://www.investing.com/commodities/",
    description: "Real-time commodity futures, energy prices, and metal indexes.",
    icon: Anchor,
    tag: "COMMODITIES",
    color: "#fb923c"
  },
  {
    name: "Business Investing",
    url: "https://businessinvesting.com/commodities",
    description: "Specialized analysis for commodity markets and strategic investments.",
    icon: Briefcase,
    tag: "ANALYSIS",
    color: "#f87171"
  },
  {
    name: "Kontan Investasi",
    url: "https://investasi.kontan.co.id",
    description: "Primary Indonesian investment news and local market analysis.",
    icon: Activity,
    tag: "IDX",
    color: "#deff9a"
  },
  {
    name: "CNBC Indonesia",
    url: "https://www.cnbcindonesia.com/market",
    description: "Live Indonesian market updates and economic policy reporting.",
    icon: TrendingUp,
    tag: "LOCAL FEED",
    color: "#deff9a"
  },
  {
    name: "Bloomberg Technoz",
    url: "https://www.bloombergtechnoz.com",
    description: "Technology and finance integration for the Indonesian economy.",
    icon: Zap,
    tag: "TECHNOZ",
    color: "#60a5fa"
  },
  {
    name: "IDN Financials",
    url: "https://www.idnfinancials.com",
    description: "Comprehensive financial data for Jakarta Composite Index (JCI) companies.",
    icon: Globe,
    tag: "FINANCIALS",
    color: "#deff9a"
  },
  {
    name: "IDX Keterbukaan Informasi",
    url: "https://www.idx.co.id/id/berita/keterbukaan-informasi",
    description: "Official Indonesia Stock Exchange disclosure and corporate actions log.",
    icon: Anchor,
    tag: "OFFICIAL",
    color: "#fff"
  }
];

export const ExternalGateways: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 px-2">
        <h3 className="text-xs font-black text-slate-100 uppercase tracking-[0.2em]">Institutional External Gateways</h3>
        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Authorized Intelligence Sources & Terminal Hubs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {GATEWAY_LINKS.map((link, idx) => (
          <motion.a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative bg-slate-900/40 p-5 rounded-[2rem] border border-slate-800/80 hover:bg-slate-800/60 hover:border-[#deff9a]/30 transition-all flex flex-col h-full overflow-hidden shadow-xl"
          >
            <div className="absolute top-0 right-0 p-6 bg-[#deff9a]/5 blur-3xl rounded-full -mr-8 -mt-8 group-hover:bg-[#deff9a]/10 transition-colors" />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-[#deff9a]/50 transition-colors">
                <link.icon className="w-5 h-5" style={{ color: link.color }} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[7px] font-black text-slate-500 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 uppercase tracking-widest">{link.tag}</span>
                <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-[#deff9a] transition-colors" />
              </div>
            </div>

            <div className="flex-1 relative z-10">
              <h4 className="text-sm font-black text-slate-200 group-hover:text-white transition-colors mb-1 uppercase tracking-tight">
                {link.name}
              </h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium line-clamp-2">
                {link.description}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between relative z-10">
              <span className="text-[8px] font-mono text-slate-600 truncate max-w-[150px]">
                {link.url.replace('https://', '')}
              </span>
              <span className="text-[8px] font-black text-[#deff9a] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                Connect Gateway
              </span>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
};

export default ExternalGateways;
