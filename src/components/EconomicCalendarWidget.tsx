import React, { useEffect, useRef, useState } from 'react';
import { Calendar, Globe, Bell, Info, ArrowUpRight, Award, Flame, ExternalLink } from 'lucide-react';

interface IPOItem {
  id: string;
  companyName: string;
  ticker: string;
  exchange: string;
  expectedDate: string;
  sharesOffer: string;
  priceRange: string;
  currency: string;
  status: 'Upcoming' | 'Price Filed' | 'Expected' | 'Completed';
  category: 'IDX' | 'GLOBAL';
}

const UPCOMING_IPOS_2026: IPOItem[] = [
  {
    id: 'IPO-01',
    companyName: 'PT Nusantara Green Energy',
    ticker: 'NGE',
    exchange: 'IDX',
    expectedDate: 'Agustus 2026',
    sharesOffer: '1.200.000.000',
    priceRange: 'Rp 250 - Rp 320',
    currency: 'IDR',
    status: 'Upcoming',
    category: 'IDX'
  },
  {
    id: 'IPO-02',
    companyName: 'PT Nickel Indo Lestari',
    ticker: 'NIL',
    exchange: 'IDX',
    expectedDate: 'September 2026',
    sharesOffer: '850.000.000',
    priceRange: 'Rp 180 - Rp 220',
    currency: 'IDR',
    status: 'Expected',
    category: 'IDX'
  },
  {
    id: 'IPO-03',
    companyName: 'PT Blue Bird Digital Solusi',
    ticker: 'BDS',
    exchange: 'IDX',
    expectedDate: 'Oktober 2026',
    sharesOffer: '500.000.000',
    priceRange: 'Rp 450 - Rp 550',
    currency: 'IDR',
    status: 'Price Filed',
    category: 'IDX'
  },
  {
    id: 'IPO-04',
    companyName: 'Starlink Inc.',
    ticker: 'STRL',
    exchange: 'NASDAQ',
    expectedDate: 'Late 2026',
    sharesOffer: '150.000.000',
    priceRange: '$85.00 - $95.00',
    currency: 'USD',
    status: 'Upcoming',
    category: 'GLOBAL'
  },
  {
    id: 'IPO-05',
    companyName: 'Shein Group Ltd.',
    ticker: 'SHEIN',
    exchange: 'NYSE',
    expectedDate: 'Q3 2026',
    sharesOffer: '220.000.000',
    priceRange: '$22.00 - $26.00',
    currency: 'USD',
    status: 'Price Filed',
    category: 'GLOBAL'
  },
  {
    id: 'IPO-06',
    companyName: 'OpenAI Corporation',
    ticker: 'OAI',
    exchange: 'NASDAQ',
    expectedDate: 'Late 2026',
    sharesOffer: '100.000.000',
    priceRange: '$120.00 - $140.00',
    currency: 'USD',
    status: 'Expected',
    category: 'GLOBAL'
  },
  {
    id: 'IPO-07',
    companyName: 'Syarikat Petro-Chemicals SG',
    ticker: 'SPCS',
    exchange: 'SGX',
    expectedDate: 'November 2026',
    sharesOffer: '350.000.000',
    priceRange: 'S$ 1.10 - S$ 1.35',
    currency: 'SGD',
    status: 'Upcoming',
    category: 'GLOBAL'
  }
];

const EconomicCalendarWidget: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [regionFilter, setRegionFilter] = useState<'GLOBAL' | 'ASEAN' | 'WESTERN'>('GLOBAL');
  const [ipoTab, setIpoTab] = useState<'ALL' | 'IDX' | 'GLOBAL'>('ALL');

  useEffect(() => {
    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    // Clear previous widget
    currentContainer.innerHTML = `<div class="tradingview-widget-container__widget h-full"></div>`;

    // Create script element
    const scriptElement = document.createElement("script");
    scriptElement.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    scriptElement.type = "text/javascript";
    scriptElement.async = true;

    // Define country codes based on filter
    let countries = "id,us,sg,cn,jp,gb,eu";
    if (regionFilter === 'ASEAN') {
      countries = "id,sg,my,th,ph";
    } else if (regionFilter === 'WESTERN') {
      countries = "us,gb,eu,ca";
    }

    scriptElement.innerHTML = JSON.stringify({
      "colorTheme": "dark",
      "isReadOnly": false,
      "width": "100%",
      "height": 550,
      "locale": "id",
      "importanceFilter": "-1,0,1",
      "countryFilter": countries
    });

    currentContainer.appendChild(scriptElement);

    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, [regionFilter]);

  const filteredIpos = UPCOMING_IPOS_2026.filter(ipo => {
    if (ipoTab === 'ALL') return true;
    return ipo.category === ipoTab;
  });

  return (
    <div className="space-y-6">
      {/* Upper Terminal Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-950/60 rounded-3xl border border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="p-3 bg-[#deff9a]/10 rounded-2xl border border-[#deff9a]/20 text-[#deff9a]">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Institutional Calendar Hub</h2>
              <span className="px-2 py-0.5 text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-bold uppercase tracking-wider animate-pulse">
                Live Feed
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Informasi makroekonomi internasional, jadwal IPO, dan indikator pasar penting yang terintegrasi langsung untuk mendukung proses pengambilan keputusan portofolio VentureAM.
            </p>
          </div>
        </div>

        <div className="flex gap-2 relative z-10 flex-wrap">
          <a
            href="https://id.tradingview.com/ipo-calendar/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-[#deff9a] text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-800 transition-all"
          >
            <span>Kalender IPO TradingView</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Grid Layout for Economic Calendar & IPO Table */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left/Middle Column: Economic Calendar Widget (Spans 2 cols on wide screens) */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-slate-950/40 p-5 rounded-3xl border border-slate-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Kalender Ekonomi Global & Domestik
                </h3>
              </div>

              {/* Region Switcher */}
              <div className="flex items-center bg-slate-900/80 p-0.5 rounded-xl border border-slate-800">
                <button
                  onClick={() => setRegionFilter('GLOBAL')}
                  className={`px-3 py-1 rounded-lg text-[9px] font-bold tracking-widest uppercase transition-all ${
                    regionFilter === 'GLOBAL' ? 'bg-[#deff9a] text-slate-950' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Global
                </button>
                <button
                  onClick={() => setRegionFilter('ASEAN')}
                  className={`px-3 py-1 rounded-lg text-[9px] font-bold tracking-widest uppercase transition-all ${
                    regionFilter === 'ASEAN' ? 'bg-[#deff9a] text-slate-950' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  ASEAN & IDX
                </button>
                <button
                  onClick={() => setRegionFilter('WESTERN')}
                  className={`px-3 py-1 rounded-lg text-[9px] font-bold tracking-widest uppercase transition-all ${
                    regionFilter === 'WESTERN' ? 'bg-[#deff9a] text-slate-950' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  US & EU
                </button>
              </div>
            </div>

            {/* TradingView Widget Container */}
            <div className="relative border border-slate-800 rounded-2xl overflow-hidden bg-black/40 min-h-[550px]">
              <div className="tradingview-widget-container" ref={containerRef}>
                <div className="tradingview-widget-container__widget h-[550px]"></div>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/60">
              <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-400 leading-relaxed">
                <span className="text-[#deff9a] font-bold">Catatan Data:</span> Nilai aktual (Actual) diupdate seketika rilis diumumkan. Bandingkan dengan proyeksi (Forecast) dan nilai periode sebelumnya (Previous) untuk memproyeksikan deviasi arah harga pasar.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming IPO Tracker for 2026 */}
        <div className="space-y-4">
          <div className="bg-slate-950/40 p-5 rounded-3xl border border-slate-800/80 space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Sinyal IPO Unggulan 2026
                  </h3>
                </div>
                
                {/* Mini category tabs */}
                <div className="flex bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
                  {(['ALL', 'IDX', 'GLOBAL'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setIpoTab(tab)}
                      className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest transition-all ${
                        ipoTab === tab ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                Daftar perusahaan prospektif yang direncanakan melantai di bursa IDX & Global pada tahun 2026 berdasarkan analisis primer Venture Asset Management.
              </p>

              {/* Table of IPOs */}
              <div className="space-y-2.5 overflow-y-auto max-h-[420px] pr-1 scrollbar-thin">
                {filteredIpos.map((ipo) => (
                  <div 
                    key={ipo.id} 
                    className="p-3 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 rounded-2xl transition-all space-y-2 group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 bg-[#deff9a]/10 text-[#deff9a] text-[8px] font-black uppercase tracking-widest rounded">
                            {ipo.ticker}
                          </span>
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                            {ipo.exchange}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-200 mt-1 truncate group-hover:text-white">
                          {ipo.companyName}
                        </h4>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        ipo.status === 'Price Filed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        ipo.status === 'Upcoming' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        ipo.status === 'Expected' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        'bg-slate-700/20 text-slate-400 border border-slate-700/30'
                      }`}>
                        {ipo.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-800/60 pt-2 text-slate-400">
                      <div>
                        <p className="text-[8px] uppercase font-bold text-slate-600">Rentang Harga</p>
                        <p className="font-semibold text-slate-300 mt-0.5">{ipo.priceRange}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] uppercase font-bold text-slate-600">Perkiraan Listing</p>
                        <p className="font-semibold text-slate-300 mt-0.5">{ipo.expectedDate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 p-3 bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#deff9a]" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Direct Portal</span>
              </div>
              <a 
                href="https://id.tradingview.com/ipo-calendar/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[9px] font-black uppercase text-[#deff9a] hover:underline flex items-center gap-1"
              >
                <span>TradingView Web</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default EconomicCalendarWidget;
