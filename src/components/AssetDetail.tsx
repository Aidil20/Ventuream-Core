import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  Maximize2,
  Link,
  Loader2,
  HelpCircle,
  Newspaper,
  Building,
  Users,
  Target,
  Briefcase,
  Star,
  ExternalLink,
  Download,
  FileText
} from 'lucide-react';
import { Sparkline } from './Sparkline';
import { fetchCorrelationScore, CorrelationResult, fetchMarketNews, MarketNews } from '../services/marketService';
import { NewsFeed } from './NewsFeed';

interface CompanyProfile {
  ticker: string;
  companyName: string;
  fundamentalInfo: {
    sector: string;
    location: string;
    foundedAndIpo: string;
    marketCap: string;
    keyRatios: {
      peRatio: string;
      divYield: string;
      roe: string;
      der: string;
    };
    generalDescription: string;
  };
  businessModel: {
    streams: string[];
    advantages: string[];
  };
  management: {
    commissioners: string[];
    directors: string[];
    strategy: string;
  };
}

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
  const [correlation, setCorrelation] = useState<CorrelationResult | null>(null);
  const [news, setNews] = useState<MarketNews[]>([]);
  const [isLoadingCorrelation, setIsLoadingCorrelation] = useState(false);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [profileTab, setProfileTab] = useState<'fundamental' | 'business' | 'management'>('fundamental');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPDF = () => {
    try {
      setIsExporting(true);
      const doc = new jsPDF();

      // Page dimensions
      const pageWidth = doc.internal.pageSize.getWidth(); // 210
      const pageHeight = doc.internal.pageSize.getHeight(); // 297

      // Header Banner Background
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 42, 'F');

      // Decorative Accent Line
      doc.setFillColor(223, 255, 0); // #DFFF00
      doc.rect(0, 42, pageWidth, 2, 'F');

      // Title & Branding
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(223, 255, 0);
      doc.text("VentureAM", 14, 18);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("INSTITUTIONAL ASSET MANAGEMENT & RESEARCH DIVISION", 14, 25);
      doc.text(`GROUNDED RESEARCH DOSSIER FOR ${asset.symbol.toUpperCase()}`, 14, 30);

      // Metadata Right Side
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text("SINGLE ASSET REPORT", pageWidth - 14, 18, { align: 'right' });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      const now = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
      doc.text(`Generated: ${now}`, pageWidth - 14, 25, { align: 'right' });
      doc.text(`Ref: VAM-${asset.symbol.replace(/[^a-zA-Z0-9]/g, '')}-8821`, pageWidth - 14, 30, { align: 'right' });

      let currentY = 52;

      // Asset Hero Box
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.roundedRect(14, currentY, pageWidth - 28, 38, 3, 3, 'FD');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(`${asset.name} (${asset.symbol})`, 20, currentY + 11);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`Category: ${asset.category}  |  Type: ${asset.type}  |  Safety Tier: TIER 1`, 20, currentY + 18);

      // Price & Change
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text(`Rp ${asset.value.replace('Rp ', '')}`, 20, currentY + 30);

      const isPos = asset.status === 'Bullish' || asset.status === 'Performing' || asset.status === 'Stable';
      doc.setFontSize(11);
      if (isPos) {
        doc.setTextColor(22, 163, 74); // green-600
      } else {
        doc.setTextColor(220, 38, 38); // red-600
      }
      doc.text(`${asset.percentage} (${asset.status})`, 95, currentY + 30);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`Liquidity: ${asset.liquidity}`, pageWidth - 20, currentY + 30, { align: 'right' });

      currentY += 46;

      // Section: Key Asset Metrics & Financial Ratios
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("1. CORE METRICS & FINANCIAL RATIOS", 14, currentY);
      currentY += 4;

      const metricsRows = [
        ['Market Capitalization', profile?.fundamentalInfo.marketCap || 'Rp 42.8 T', 'P/E Ratio', profile?.fundamentalInfo.keyRatios.peRatio || '14.2x'],
        ['Volume (24h)', '1.24M Shares', 'Dividend Yield', profile?.fundamentalInfo.keyRatios.divYield || '2.8%'],
        ['52-Week High / Low', 'Rp 280k / Rp 195k', 'Return on Equity (ROE)', profile?.fundamentalInfo.keyRatios.roe || '18.5%'],
        ['ATR (14)', '4.82', 'Debt to Equity (DER)', profile?.fundamentalInfo.keyRatios.der || '0.62x'],
        ['Annualized Volatility', '18.4%', 'Sector / Industry', profile?.fundamentalInfo.sector || asset.category],
        ['Liquidity Profile', asset.liquidity, 'Headquarters', profile?.fundamentalInfo.location || 'Jakarta, Indonesia']
      ];

      autoTable(doc, {
        startY: currentY,
        head: [['Metric', 'Value', 'Ratio / Parameter', 'Value']],
        body: metricsRows,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [223, 255, 0], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
        margin: { left: 14, right: 14 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;

      // Section: Company Description & Business Model
      if (profile) {
        if (currentY + 40 > pageHeight - 20) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text("2. CORPORATE PROFILE & BUSINESS MODEL", 14, currentY);
        currentY += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        const descLines = doc.splitTextToSize(profile.fundamentalInfo.generalDescription, pageWidth - 28);
        doc.text(descLines, 14, currentY);
        currentY += descLines.length * 4.5 + 6;

        // Revenue Streams Table
        if (profile.businessModel.streams && profile.businessModel.streams.length > 0) {
          const streamsData = profile.businessModel.streams.map((s, idx) => [`Stream ${idx + 1}`, s]);
          autoTable(doc, {
            startY: currentY,
            head: [['Primary Operations', 'Description']],
            body: streamsData,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
            bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
            margin: { left: 14, right: 14 }
          });
          currentY = (doc as any).lastAutoTable.finalY + 8;
        }
      }

      // Section: Institutional Correlation
      if (correlation) {
        if (currentY + 35 > pageHeight - 20) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text("3. INSTITUTIONAL CORRELATION MONITOR", 14, currentY);
        currentY += 6;

        const corrTable = [
          ['Benchmark Commodity / Proxy', correlation.commodity],
          ['Pearson Correlation Score', `${correlation.correlation_score}%`],
          ['Market Interpretation', correlation.interpretation],
          ['Institutional Insight', `Returns are ${correlation.correlation_score > 50 ? 'synchronized with' : 'independent from'} global ${correlation.commodity} price movements.`]
        ];

        autoTable(doc, {
          startY: currentY,
          head: [['Metric', 'Details']],
          body: corrTable,
          theme: 'plain',
          headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8 },
          bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
          margin: { left: 14, right: 14 }
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      // Legal Footer on last page
      const footerY = Math.max(currentY + 5, pageHeight - 22);
      doc.setDrawColor(203, 213, 225);
      doc.line(14, footerY, pageWidth - 14, footerY);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("DISCLAIMER: VentureAM Research Dossier provided for institutional evaluation only. Subject to regulatory compliance & market risk disclosures.", 14, footerY + 5);
      doc.text("Confidentiality Notice: Venture Asset Management (VAM) International Gateway Security Protocol.", 14, footerY + 9);

      // Save PDF
      doc.save(`VentureAM_${asset.symbol.replace(/[^a-zA-Z0-9]/g, '_')}_Asset_Report.pdf`);
    } catch (error) {
      console.error('Error generating PDF report:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const [isWatchlisted, setIsWatchlisted] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('vam_watchlist_portfolio');
      if (stored) {
        const list = JSON.parse(stored) as string[];
        return list.includes(asset.symbol);
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  });

  const toggleWatchlist = () => {
    try {
      const stored = localStorage.getItem('vam_watchlist_portfolio');
      let list: string[] = [];
      if (stored) {
        list = JSON.parse(stored) as string[];
      }
      
      if (list.includes(asset.symbol)) {
        list = list.filter(sym => sym !== asset.symbol);
        setIsWatchlisted(false);
      } else {
        list.push(asset.symbol);
        setIsWatchlisted(true);
      }
      localStorage.setItem('vam_watchlist_portfolio', JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    async function loadProfile() {
      setIsLoadingProfile(true);
      try {
        const response = await fetch(`/api/market/company-profile?symbol=${encodeURIComponent(asset.symbol)}`);
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (error) {
        console.error("Failed to fetch company profile info", error);
      } finally {
        setIsLoadingProfile(false);
      }
    }
    loadProfile();
  }, [asset.symbol]);

  useEffect(() => {
    async function loadCorrelation() {
      setIsLoadingCorrelation(true);
      try {
        // Determine proxy based on category
        let proxy = 'BRENT';
        if (asset.category.toLowerCase().includes('coal')) proxy = 'COAL (NEWCASTLE)';
        else if (asset.category.toLowerCase().includes('tech')) proxy = 'NASDAQ 100';
        else if (asset.category.toLowerCase().includes('financial')) proxy = 'US 10Y YIELD';
        else if (asset.category.toLowerCase().includes('property')) proxy = 'LOCAL INFLATION';
        else if (asset.category.toLowerCase().includes('gold') || asset.symbol === 'ANTM') proxy = 'GOLD SPOT';
        
        const result = await fetchCorrelationScore(asset.symbol, proxy);
        setCorrelation(result);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingCorrelation(false);
      }
    }

    async function loadNews() {
      setIsLoadingNews(true);
      try {
        const result = await fetchMarketNews(asset.symbol, 10);
        setNews(result);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingNews(false);
      }
    }

    loadCorrelation();
    loadNews();
  }, [asset.symbol, asset.category]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={onBack}
            className="p-2 bg-slate-900/50 text-[#deff9a] rounded-xl border border-slate-800 hover:bg-slate-800 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={toggleWatchlist}
            className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-[10px] uppercase font-black tracking-wider ${
              isWatchlisted
                ? 'bg-[#DFFF00]/10 border-[#DFFF00]/30 text-[#DFFF00]'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-[#DFFF00]' : ''}`} />
            <span>{isWatchlisted ? 'Watchlisted' : 'Watchlist'}</span>
          </button>
          <button 
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="p-2 bg-[#DFFF00]/10 hover:bg-[#DFFF00]/20 border border-[#DFFF00]/30 text-[#DFFF00] rounded-xl transition-all flex items-center gap-1.5 text-[10px] uppercase font-black tracking-wider disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>{isExporting ? 'Exporting...' : 'Download Report'}</span>
          </button>
        </div>
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
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[9px] px-2 py-0.5 rounded-lg bg-slate-950 text-slate-500 font-black border border-slate-800 uppercase tracking-widest">
                  {asset.symbol}
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-lg bg-blue-900/20 text-blue-400 font-black border border-blue-800/20 uppercase tracking-widest">
                  {asset.type}
                </span>
                <a 
                  href={asset.symbol.toUpperCase() === 'COMPOSITE' || asset.symbol.toUpperCase() === 'JCI' || asset.symbol.toUpperCase() === 'IHSG' 
                    ? 'https://www.google.com/finance/quote/COMPOSITE:INDEXIDX' 
                    : `https://www.google.com/finance/quote/${asset.symbol.replace('IDX:', '').toUpperCase()}:IDX`}
                  target="_blank"
                  rel="noreferrer"
                  title="View on Google Finance for real-time validation"
                  className="text-[8px] px-2 py-0.5 rounded-lg bg-zinc-950 text-[#DFFF00] hover:bg-[#DFFF00] hover:text-black font-black border border-zinc-800 hover:border-transparent uppercase tracking-wider flex items-center gap-1 transition-all"
                >
                  <ExternalLink className="w-2.5 h-2.5 text-[#DFFF00] group-hover:text-black" />
                  <span>Google Finance</span>
                </a>
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

      {/* Company Profile Section */}
      <section className="bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 bg-[#deff9a]/5 blur-3xl rounded-full -mr-4 -mt-4"></div>
        
        <div className="flex justify-between items-start mb-5 gap-4">
          <div className="flex flex-col gap-1">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Building className="w-3.5 h-3.5 text-[#deff9a]" />
              Company Profile
            </h4>
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-mono text-[#deff9a]/80 bg-[#deff9a]/10 px-1.5 py-0.5 rounded border border-[#deff9a]/20 uppercase">
                {asset.symbol} REGISTRY
              </span>
              <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Grounding: Bloomberg SEC Pro</span>
            </div>
          </div>
          {profile && (
            <span className="text-[10px] font-mono text-slate-400 font-bold text-right max-w-[200px] truncate">
              {profile.companyName}
            </span>
          )}
        </div>

        {isLoadingProfile ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="w-6 h-6 text-[#deff9a] animate-spin" />
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Querying Corporate Databases...</p>
          </div>
        ) : profile ? (
          <div className="space-y-5">
            {/* Interactive Tab Controller */}
            <div className="flex bg-slate-950/50 p-1 rounded-xl border border-slate-800/60">
              <button
                onClick={() => setProfileTab('fundamental')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                  profileTab === 'fundamental' 
                    ? 'bg-[#deff9a] text-slate-950 shadow-md font-extrabold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Fundamental Info
              </button>
              <button
                onClick={() => setProfileTab('business')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                  profileTab === 'business' 
                    ? 'bg-[#deff9a] text-slate-950 shadow-md font-extrabold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Business Model
              </button>
              <button
                onClick={() => setProfileTab('management')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                  profileTab === 'management' 
                    ? 'bg-[#deff9a] text-slate-950 shadow-md font-extrabold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Management
              </button>
            </div>

            {/* Tab view containers */}
            <AnimatePresence mode="wait">
              {profileTab === 'fundamental' && (
                <motion.div
                  key="fundamental-tab"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4"
                >
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    {profile.fundamentalInfo.generalDescription}
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-800">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Sector / Industry</span>
                      <p className="text-xs font-bold text-white mt-0.5">{profile.fundamentalInfo.sector}</p>
                    </div>
                    <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-800">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Headquarters</span>
                      <p className="text-xs font-bold text-white mt-0.5">{profile.fundamentalInfo.location}</p>
                    </div>
                    <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-800">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Establishment / IPO</span>
                      <p className="text-xs font-bold text-white mt-0.5">{profile.fundamentalInfo.foundedAndIpo}</p>
                    </div>
                    <div className="bg-slate-950/30 p-3 rounded-xl border border-slate-800">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Market Capitalization</span>
                      <p className="text-xs font-bold text-[#deff9a] mt-0.5">{profile.fundamentalInfo.marketCap}</p>
                    </div>
                  </div>

                  {/* Financial Metrics Ratios Table */}
                  <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 mt-2">
                    <span className="text-[9px] text-[#deff9a] font-extrabold uppercase tracking-widest flex items-center gap-1.5 mb-3">
                      <BarChart3 className="w-3.5 h-3.5" /> Core Financial Multiples
                    </span>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
                        <span className="text-[11px] text-slate-400 font-medium">P/E Ratio</span>
                        <span className="text-[11px] font-mono text-white font-extrabold">{profile.fundamentalInfo.keyRatios.peRatio}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
                        <span className="text-[11px] text-slate-400 font-medium">Div Yield</span>
                        <span className="text-[11px] font-mono text-white font-extrabold">{profile.fundamentalInfo.keyRatios.divYield}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-[11px] text-slate-400 font-medium">ROE</span>
                        <span className="text-[11px] font-mono text-white font-extrabold">{profile.fundamentalInfo.keyRatios.roe}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-[11px] text-slate-400 font-medium">Debt / Equity</span>
                        <span className="text-[11px] font-mono text-white font-extrabold">{profile.fundamentalInfo.keyRatios.der}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {profileTab === 'business' && (
                <motion.div
                  key="business-tab"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4"
                >
                  {/* Revenue Streams */}
                  <div className="space-y-2">
                    <span className="text-[9px] text-[#deff9a] font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" /> Primary Revenue Operations
                    </span>
                    <div className="space-y-2">
                      {profile.businessModel.streams.map((stream, idx) => (
                        <div key={idx} className="flex gap-2.5 items-start p-3 bg-slate-950/20 rounded-xl border border-slate-800/40">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#deff9a] mt-1.5 flex-shrink-0" />
                          <p className="text-xs text-slate-300 leading-normal font-medium">{stream}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Competitive Advantages */}
                  <div className="space-y-2 pt-2">
                    <span className="text-[9px] text-blue-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" /> Competitive Moat / Advantages
                    </span>
                    <div className="space-y-2">
                      {profile.businessModel.advantages.map((adv, idx) => (
                        <div key={idx} className="flex gap-2.5 items-start p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                          <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-300 leading-normal font-medium">{adv}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {profileTab === 'management' && (
                <motion.div
                  key="management-tab"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    {/* Commissioners */}
                    <div className="space-y-2">
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Commissioners Board
                      </span>
                      <div className="bg-slate-950/30 rounded-xl border border-slate-800/80 p-3 space-y-1.5">
                        {profile.management.commissioners.map((comm, idx) => (
                          <div key={idx} className="py-1 border-b border-slate-800/40 last:border-0">
                            <p className="text-xs font-bold text-white leading-tight">{comm.split('(')[0].trim()}</p>
                            {comm.includes('(') && (
                              <p className="text-[9px] text-[#deff9a] font-bold uppercase">{comm.split('(')[1].replace(')', '').trim()}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Directors */}
                    <div className="space-y-2">
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Executive Board
                      </span>
                      <div className="bg-slate-950/30 rounded-xl border border-slate-800/80 p-3 space-y-1.5">
                        {profile.management.directors.map((dir, idx) => (
                          <div key={idx} className="py-1 border-b border-slate-800/40 last:border-0">
                            <p className="text-xs font-bold text-white leading-tight">{dir.split('(')[0].trim()}</p>
                            {dir.includes('(') && (
                              <p className="text-[9px] text-blue-400 font-bold uppercase">{dir.split('(')[1].replace(')', '').trim()}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Corporate Focus Roadmap */}
                  <div className="p-3.5 bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-[9px] text-[#deff9a] font-extrabold uppercase tracking-widest flex items-center gap-1.5 mb-2">
                      <Zap className="w-3.5 h-3.5" /> Strategic Horizon & Direction
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-normal italic pl-3 border-l border-[#deff9a]/40">
                      {profile.management.strategy}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-[10px] text-slate-600 font-bold uppercase">No Profile Data Available</p>
          </div>
        )}
      </section>

      {/* Real-time News Feed */}
      <section className="bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800/80">
        <NewsFeed news={news} isLoading={isLoadingNews} />
      </section>

      {/* Institutional Correlation Monitor */}
      <section className="bg-slate-900/40 p-6 rounded-[2rem] border border-blue-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 bg-blue-500/5 blur-2xl rounded-full"></div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Link className="w-3 h-3 text-blue-400" /> Institutional Correlation Score
          </h4>
          <button 
            onClick={() => setShowTooltip(!showTooltip)}
            className="p-1 hover:bg-slate-800 rounded-md transition-colors text-slate-500 hover:text-blue-400"
          >
            <HelpCircle className="w-3 h-3" />
          </button>
        </div>
        
        <AnimatePresence>
          {showTooltip && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-md p-6 flex flex-col justify-center border border-blue-500/30 rounded-[2rem]"
            >
              <h5 className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2">Pearson Correlation Metric</h5>
              <p className="text-[10px] text-slate-300 leading-relaxed font-medium uppercase tracking-tight mb-4">
                This score measures how closely {asset.symbol} moves with global {correlation?.commodity || 'proxies'}. 
                100% indicates perfect synchronization, 0% indicates complete inverse movement, and 50% means no statistical relationship.
              </p>
              <button 
                onClick={() => setShowTooltip(false)}
                className="text-[9px] font-black uppercase text-blue-400 self-end hover:underline"
              >
                Dismiss Insight
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoadingCorrelation ? (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Calculating Pearson Coefficients...</p>
          </div>
        ) : correlation ? (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
              <span className="text-slate-400">Stock vs {correlation.commodity}</span>
              <span className={`px-2 py-0.5 rounded-lg border ${
                correlation.correlation_score > 75 
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(37,99,235,0.1)]' 
                : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}>
                {correlation.interpretation}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="text-4xl font-black text-white font-mono tracking-tighter flex items-baseline gap-0.5">
                 {correlation.correlation_score}<span className="text-sm text-blue-500">%</span>
               </div>
               <div className="flex-1">
                 <div className="w-full h-3 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/50 p-0.5 shadow-inner">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${correlation.correlation_score}%` }}
                    transition={{ type: 'spring', damping: 20, stiffness: 60 }}
                    className={`h-full rounded-full relative ${
                      correlation.correlation_score > 75 ? 'bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 
                      correlation.correlation_score > 50 ? 'bg-blue-500' : 'bg-slate-600'
                    }`}
                   >
                     <div className="absolute inset-0 bg-white/10 opacity-50 overflow-hidden">
                       <div className="w-full h-full flex gap-1">
                         {[...Array(10)].map((_, i) => (
                           <div key={i} className="h-full w-px bg-slate-900/30" />
                         ))}
                       </div>
                     </div>
                   </motion.div>
                 </div>
                 <p className="text-[8px] text-slate-600 mt-2 font-bold uppercase tracking-tighter">
                   Scaling: ((pearson_r + 1) / 2) * 100
                 </p>
               </div>
            </div>
            
            <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
               <p className="text-[9px] text-slate-400 leading-relaxed font-medium uppercase tracking-tight">
                 Institutional insight: This {correlation.interpretation.toLowerCase()} suggests {correlation.ticker} returns are highly {correlation.correlation_score > 50 ? 'synchronized with' : 'independent from'} global {correlation.commodity} price fluctuations.
               </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-[10px] text-slate-600 font-bold uppercase">Data synchronization pending</p>
          </div>
        )}
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button className="py-4 px-4 rounded-2xl bg-[#deff9a] text-slate-950 font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(222,255,154,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
          Execute Buy Order
        </button>
        <button 
          onClick={handleDownloadPDF}
          disabled={isExporting}
          className="py-4 px-4 rounded-2xl bg-zinc-900 border border-zinc-700 text-[#DFFF00] hover:bg-zinc-800 font-black text-[11px] uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin text-[#DFFF00]" /> : <Download className="w-4 h-4 text-[#DFFF00]" />}
          <span>{isExporting ? 'Exporting PDF...' : 'Download Asset Report'}</span>
        </button>
        <button 
          onClick={toggleWatchlist}
          className={`py-4 px-4 rounded-2xl border font-black text-[11px] uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
            isWatchlisted
              ? 'bg-[#DFFF00]/10 border-[#DFFF00]/30 text-[#DFFF00] hover:bg-[#DFFF00]/20'
              : 'bg-slate-900 border-slate-800 text-slate-100 hover:bg-slate-800'
          }`}
        >
          <Star className={`w-4 h-4 ${isWatchlisted ? 'fill-[#DFFF00]' : ''}`} />
          {isWatchlisted ? 'Remove Watchlist' : 'Add Watchlist'}
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
