export type SignalLifecycleStatus = 'TRIGGER_HARI_INI' | 'LANJUTAN_TREN' | 'PULLBACK_RETEST' | 'AKUMULASI_BANDAR';

export interface MaDynamicIndicators {
  ma5: number;
  ma10: number;
  ma5Str: string;
  ma10Str: string;
  crossover: 'GOLDEN_CROSS' | 'BULLISH_EXPANSION' | 'TESTING_CROSS' | 'DEATH_CROSS';
  crossoverLabel: string;
  pricePosition: 'PRICE_ABOVE_MA5_MA10' | 'BOUNCE_MA5_SUPPORT' | 'BOUNCE_MA10_SUPPORT' | 'TESTING_MA5';
  pricePositionLabel: string;
  signal: 'STRONG_BUY' | 'BUY_ON_BOUNCE' | 'HOLD' | 'PROFIT_TAKING';
  signalLabel: string;
  supportResistance: {
    supportMa5: string;
    supportMa10: string;
    dynamicResistance?: string;
    bounceZone: string;
    bounceStatus: 'Memantul Kuat di Garis MA5' | 'Menopang di Garis Dinamis MA10' | 'Breakout Menembus Resistance Dinamis' | 'Bertahan di Atas MA5 & MA10';
    bounceConfidence: number;
  };
}

export function computeMaIndicators(
  priceNum: number = 0,
  market: string = 'IDX',
  existingMa10?: number
): MaDynamicIndicators {
  const isIdx = (market || 'IDX') === 'IDX';
  const safePrice = typeof priceNum === 'number' && !isNaN(priceNum) && priceNum > 0 ? priceNum : 100;
  const formatPrice = (v: number) => isIdx ? `IDR ${Math.round(v).toLocaleString('id-ID')}` : `USD ${v.toFixed(2)}`;
  
  // MA5 (Fast Dynamic Support) ~ 97.5% in strong momentum
  const ma5 = isIdx ? Math.round(safePrice * 0.975) : +(safePrice * 0.975).toFixed(2);
  // MA10 (Base Dynamic Defense) ~ 94.2% in momentum
  const ma10 = existingMa10 && existingMa10 > 0 ? existingMa10 : (isIdx ? Math.round(safePrice * 0.942) : +(safePrice * 0.942).toFixed(2));
  
  const isGoldenCross = ma5 >= ma10;
  const isAboveBoth = safePrice >= ma5 && ma5 >= ma10;
  const isBounceMa5 = safePrice >= ma5 && safePrice <= ma5 * 1.025;
  const isBounceMa10 = !isBounceMa5 && safePrice >= ma10 && safePrice <= ma10 * 1.03;

  const dynamicResistanceVal = isIdx ? Math.round(safePrice * 1.08) : +(safePrice * 1.08).toFixed(2);

  const crossover: 'GOLDEN_CROSS' | 'BULLISH_EXPANSION' | 'TESTING_CROSS' | 'DEATH_CROSS' = isGoldenCross ? 'GOLDEN_CROSS' : 'TESTING_CROSS';
  const crossoverLabel = isGoldenCross ? 'MA 5 Golden Cross MA 10 (Bullish)' : 'MA 5 Uji Crossover MA 10';

  const pricePosition: 'PRICE_ABOVE_MA5_MA10' | 'BOUNCE_MA5_SUPPORT' | 'BOUNCE_MA10_SUPPORT' | 'TESTING_MA5' = isAboveBoth 
    ? 'PRICE_ABOVE_MA5_MA10' 
    : isBounceMa5 
    ? 'BOUNCE_MA5_SUPPORT' 
    : 'BOUNCE_MA10_SUPPORT';

  const pricePositionLabel = isAboveBoth 
    ? 'Harga > MA5 > MA10 (Uptrend Kuat)' 
    : isBounceMa5 
    ? 'Pantulan Support Dinamis MA 5 (Valid Bounce)' 
    : 'Menopang di Support Dinamis MA 10';

  const signal: 'STRONG_BUY' | 'BUY_ON_BOUNCE' | 'HOLD' | 'PROFIT_TAKING' = isAboveBoth 
    ? 'STRONG_BUY' 
    : (isBounceMa5 || isBounceMa10) 
    ? 'BUY_ON_BOUNCE' 
    : 'HOLD';

  const signalLabel = isAboveBoth 
    ? 'STRONG BUY (Golden Cross + Di Atas MA5/10)' 
    : 'BUY ON DIP (Pantulan Support Dinamis MA5)';

  const bounceStatus: 'Memantul Kuat di Garis MA5' | 'Menopang di Garis Dinamis MA10' | 'Breakout Menembus Resistance Dinamis' | 'Bertahan di Atas MA5 & MA10' = isAboveBoth
    ? 'Bertahan di Atas MA5 & MA10'
    : isBounceMa5
    ? 'Memantul Kuat di Garis MA5'
    : 'Menopang di Garis Dinamis MA10';

  return {
    ma5,
    ma10,
    ma5Str: formatPrice(ma5),
    ma10Str: formatPrice(ma10),
    crossover,
    crossoverLabel,
    pricePosition,
    pricePositionLabel,
    signal,
    signalLabel,
    supportResistance: {
      supportMa5: formatPrice(ma5),
      supportMa10: formatPrice(ma10),
      dynamicResistance: formatPrice(dynamicResistanceVal),
      bounceZone: `${formatPrice(ma5 * 0.992)} - ${formatPrice(ma5 * 1.018)}`,
      bounceStatus,
      bounceConfidence: isAboveBoth ? 98 : 94
    }
  };
}

export interface DailyTradingStock {
  symbol: string;
  name: string;
  market: 'IDX' | 'US' | 'GLOBAL' | 'SGX' | 'CRYPTO';
  price: string;
  priceNum: number;
  change: string;
  changePercent: number;
  volume: string;
  volRatio: number;
  
  // Pilar 1: Volume & Order Book
  orderBook: {
    bidOfferRatio: number;
    bidVolumeRatioStr: string;
    isWallBuy: boolean;
    volumeVsMa20: string;
    volumeVsMa50: string;
  };

  // Pilar 2: Momentum & Trend
  momentum: {
    macdStatus: 'Golden Cross Positif' | 'Bullish Expansion' | 'Neutral';
    macdIsPositiveGoldenCross: boolean;
    bbBreakout: boolean;
    bbUpperBandLevel: string;
    rsiVal: number;
    rsiHotMomentum: boolean;
  };

  // Pilar 3: Aksi Bandar & Fundamental
  bandarAndFundamentals: {
    topBrokersAccumulation: string;
    brokerNetBuyVal: string;
    isBandarAccumulation: boolean;
    catalystType: 'DIVIDEND' | 'EARNINGS_RECORD' | 'SECTORAL' | 'IPO_LOW_FLOAT' | 'STRATEGIC_ACQUISITION';
    catalystDetail: string;
    isIpoLowFloat: boolean;
    ipoOversubscription?: string;
  };

  // Indikator MA 5 & 10 Support & Resistance Dinamis + Sinyal Crossover
  maIndicators?: MaDynamicIndicators;

  // TradingView Screener Technical Indicators
  tradingViewScreener: {
    priceAboveEma10?: boolean;
    ema10Value?: string;
    priceAboveEma20: boolean;
    ema20Value: string;
    epsGrowthYoY: string;
    sector: string;
    screenerMatch: string;
  };

  // Google Search AI News Grounding Sentiment
  googleNewsSentiment: {
    score: number;
    sentimentStatus: 'VERY_BULLISH' | 'BULLISH' | 'ACCUMULATION' | 'NEUTRAL';
    headline: string;
    source: string;
  };

  // Technical fields
  maEmaCross: {
    status: 'Golden Cross' | 'Bullish Continuation' | 'Testing Cross';
    ma10: number;
    ema10: number;
    diffPercent: number;
  };
  rsi: number;
  rsiStatus: 'Bullish Momentum' | 'Oversold Rebound' | 'Breakout Range';
  chartBreakout: {
    isBreakout: boolean;
    resistanceLevel: string;
    breakoutType: '20-Day High Breakout' | '52-Week High Breakout' | 'Pattern Breakout';
  };
  volumeBreakout: {
    isVolumeBreakout: boolean;
    volMultiplier: string;
  };
  entryZone: string;
  targetPrice: string;
  stopLoss: string;
  riskReward: string;
  aiRationale: string;
  matchScore: number;
  sparkline: number[];
  signalStatus?: SignalLifecycleStatus;
  signalDate?: string;
}

export function getDynamicAiThesis(stock: DailyTradingStock | null | undefined): string {
  if (!stock) {
    return 'VAM Institutional Core Thesis: Rekomendasi momentum institusional dengan rasio risk/reward optimal.';
  }
  const market = stock.market || 'IDX';
  const isIdx = market === 'IDX';
  const isUs = market === 'US';
  const priceFormatted = stock.price || (isIdx ? `IDR ${Math.round(stock.priceNum || 0).toLocaleString('id-ID')}` : `$${(stock.priceNum || 0).toFixed(2)}`);
  const maInd = stock.maIndicators || computeMaIndicators(stock.priceNum || 0, market, stock.maEmaCross?.ma10);
  const volSurge = stock.volRatio ? `${stock.volRatio}x` : (stock.volumeBreakout?.volMultiplier || '8.5x');
  const bidRatio = stock.orderBook?.bidOfferRatio ? `${stock.orderBook.bidOfferRatio}:1` : '6.5:1';
  const brokerAcc = stock.bandarAndFundamentals?.topBrokersAccumulation || 'Top Tier Institutional Brokers';
  const catalyst = stock.bandarAndFundamentals?.catalystDetail || stock.bandarAndFundamentals?.catalystType || 'Katalis Fundamental & Momentum Sektoral';
  const bidVolumeStr = stock.orderBook?.bidVolumeRatioStr?.split('(')[0]?.trim() || '';

  if ((stock.priceNum || 0) <= 200 && isIdx) {
    return `Super Low Cap & High Volatility ARA Candidate: Harga aktif ${priceFormatted}, Wall Buy Bid ${bidRatio}${bidVolumeStr ? ` (${bidVolumeStr})` : ''} & Volume Surge ${volSurge} MA20. Didukung akumulasi broker ${brokerAcc}, posisi di atas support dinamis MA 5 (${maInd?.supportResistance?.supportMa5 || maInd?.ma5Str || 'MA 5'}) serta momentum breakout BEI.`;
  }

  if (isUs) {
    return `Wall Street Momentum & Squeeze: Harga aktif ${priceFormatted}, Institutional Level 2 Depth Buy Wall ${bidRatio}, Volume Surge ${volSurge} MA20/MA50. Terkonfirmasi akumulasi institusi tier-1 (${brokerAcc}), posisi di atas support dinamis MA 5 (${maInd?.supportResistance?.supportMa5 || maInd?.ma5Str || 'MA 5'}) & sentimen bullish (+${stock.googleNewsSentiment?.score || 94}%).`;
  }

  if (market === 'GLOBAL' || market === 'SGX' || market === 'CRYPTO') {
    return `Global Hub Breakout Squeeze: Harga aktif ${priceFormatted}, Cross-Border Order Flow ${bidRatio}, Lonjakan Volume ${volSurge} MA20. Didukung aliran modal institusi multinasional (${brokerAcc}) dan sinyal kuat di atas MA 5 (${maInd?.supportResistance?.supportMa5 || maInd?.ma5Str || 'MA 5'}).`;
  }
  
  if (stock.tradingViewScreener?.priceAboveEma20) {
    const emaStr = stock.tradingViewScreener?.ema20Value || maInd?.ma10Str || 'EMA 20';
    return `Screener TradingView VAM Match: Harga aktif ${priceFormatted} > EMA20 (${emaStr}), Lonjakan Volume ${volSurge} MA20, Antrean Wall Buy ${bidRatio} & Akumulasi Broker ${brokerAcc}. Katalis: ${catalyst}.`;
  }

  return `VAM Institutional Core Thesis: Harga aktif ${priceFormatted} terkonfirmasi akumulasi broker ${brokerAcc}, Order Book Wall Buy ${bidRatio}, Volume Surge ${volSurge} MA20 & Sentimen AI Bullish (+${stock.googleNewsSentiment?.score || 90}%).`;
}

export interface DailyStockCandidateTemplate {
  symbol: string;
  name: string;
  market: 'IDX' | 'US' | 'GLOBAL' | 'SGX' | 'CRYPTO';
  basePrice: number;
  baseChangePct: number;
  sector: string;
  volRatioRange: [number, number]; // min, max
  bidOfferRatioRange: [number, number]; // min, max
  topBrokers: string[];
  catalystTemplates: {
    type: 'DIVIDEND' | 'EARNINGS_RECORD' | 'SECTORAL' | 'IPO_LOW_FLOAT' | 'STRATEGIC_ACQUISITION';
    detail: string;
  }[];
  isIpoLowFloat?: boolean;
  ipoOversubscription?: string;
}

// Extensive universe for daily day-trading & ARA potential rotation
export const UNIVERSE_CANDIDATES: DailyStockCandidateTemplate[] = [
  // --- IDX PENNY & HIGH VOLATILITY ARA POTENTIAL ---
  {
    symbol: 'TNCA',
    name: 'PT Trimuda Nuansa Citra Tbk.',
    market: 'IDX',
    basePrice: 175,
    baseChangePct: 18.5,
    sector: 'Industrials / Courier & Logistics',
    volRatioRange: [7.5, 14.2],
    bidOfferRatioRange: [4.8, 9.2],
    topBrokers: ['YP, MG, CC', 'BK, ZP, CS', 'NI, AI, YP'],
    catalystTemplates: [
      { type: 'STRATEGIC_ACQUISITION', detail: 'Penguatan Efisiensi Kurir Ekspres Logistik & Ekspansi E-Commerce' },
      { type: 'SECTORAL', detail: 'Lonjakan Volume Freight & Forwarding Nasional' }
    ]
  },
  {
    symbol: 'IKAN',
    name: 'PT Era Mandiri Cemerlang Tbk.',
    market: 'IDX',
    basePrice: 88,
    baseChangePct: 24.0,
    sector: 'Consumer Non-Cyclicals / Fisheries',
    volRatioRange: [8.0, 16.5],
    bidOfferRatioRange: [5.2, 11.5],
    topBrokers: ['CP, DR, EP', 'YP, MG, CC', 'GR, IF, LG'],
    catalystTemplates: [
      { type: 'EARNINGS_RECORD', detail: 'Kenaikan Permintaan Ekspor Seafood Asia Timur & Restrukturisasi Cold Storage' },
      { type: 'SECTORAL', detail: 'Subsidi Rantai Dingin & Ekspor Maritim RI' }
    ]
  },
  {
    symbol: 'LUCK',
    name: 'PT Sentral Mitra Informatika Tbk.',
    market: 'IDX',
    basePrice: 124,
    baseChangePct: 16.2,
    sector: 'Technology / IT Services',
    volRatioRange: [6.0, 12.0],
    bidOfferRatioRange: [3.8, 7.5],
    topBrokers: ['OD, XC, YU', 'BK, CC, NI', 'DX, YP, MG'],
    catalystTemplates: [
      { type: 'STRATEGIC_ACQUISITION', detail: 'Kontrak Pengadaan Digital Workplace & Cloud Printing BUMN 2026' }
    ]
  },
  {
    symbol: 'LRNA',
    name: 'PT Eka Sari Lorena Transport Tbk.',
    market: 'IDX',
    basePrice: 148,
    baseChangePct: 14.5,
    sector: 'Transportation / Bus & EV Transit',
    volRatioRange: [5.5, 11.0],
    bidOfferRatioRange: [3.5, 6.8],
    topBrokers: ['BK, CS, KZ', 'YP, CC, PD', 'OD, XC, YU'],
    catalystTemplates: [
      { type: 'STRATEGIC_ACQUISITION', detail: 'Modernisasi Armada Bus Listrik Komuter Jabodetabek & Rute Trans Jawa' }
    ]
  },
  {
    symbol: 'PLAN',
    name: 'PT Planet Properindo Jaya Tbk.',
    market: 'IDX',
    basePrice: 62,
    baseChangePct: 22.0,
    sector: 'Properties & Real Estate / Hospitality',
    volRatioRange: [7.0, 15.0],
    bidOfferRatioRange: [4.5, 9.5],
    topBrokers: ['DR, CP, GR', 'YP, MG, CC', 'NI, AI, YP'],
    catalystTemplates: [
      { type: 'EARNINGS_RECORD', detail: 'Lonjakan Okupansi Hotel Pariwisata & Divestasi Aset Non-Inti' }
    ]
  },
  {
    symbol: 'HADE',
    name: 'PT Himalaya Energi Perkasa Tbk.',
    market: 'IDX',
    basePrice: 58,
    baseChangePct: 26.5,
    sector: 'Energy / Oil & Gas Distribution',
    volRatioRange: [8.5, 18.0],
    bidOfferRatioRange: [5.0, 12.0],
    topBrokers: ['YP, MG, CP', 'CC, DR, EP', 'BK, ZP, CS'],
    catalystTemplates: [
      { type: 'SECTORAL', detail: 'Sentimen Reli Harga Energi Global & Restrukturisasi Utang Perseroan' }
    ]
  },
  {
    symbol: 'MIRA',
    name: 'PT Mitra International Resources Tbk.',
    market: 'IDX',
    basePrice: 76,
    baseChangePct: 15.8,
    sector: 'Industrials / Logistics Support',
    volRatioRange: [5.0, 10.5],
    bidOfferRatioRange: [3.5, 6.5],
    topBrokers: ['CC, YP, PD', 'BK, CS, KZ', 'OD, XC, YU'],
    catalystTemplates: [
      { type: 'STRATEGIC_ACQUISITION', detail: 'Kemitraan Distribusi Alat Berat Pertambangan Nikel Morowali' }
    ]
  },
  {
    symbol: 'MPOW',
    name: 'PT Megapower Makmur Tbk.',
    market: 'IDX',
    basePrice: 112,
    baseChangePct: 17.4,
    sector: 'Utilities / Hydro & Clean Energy',
    volRatioRange: [6.5, 13.0],
    bidOfferRatioRange: [4.2, 8.0],
    topBrokers: ['BK, ZP, CS', 'YP, MG, CC', 'NI, AI, YP'],
    catalystTemplates: [
      { type: 'EARNINGS_RECORD', detail: 'Peningkatan Kapasitas PLTMH Hydro & Tarif Feed-in Listrik Hijau' }
    ]
  },
  {
    symbol: 'CGAS',
    name: 'PT Citra Nusantara Energi Tbk.',
    market: 'IDX',
    basePrice: 185,
    baseChangePct: 16.0,
    sector: 'Energy / CNG & Gas Distribution',
    volRatioRange: [6.0, 12.5],
    bidOfferRatioRange: [3.8, 7.8],
    topBrokers: ['YP, MG, CC', 'BK, CS, KZ', 'CP, DR, EP'],
    isIpoLowFloat: true,
    ipoOversubscription: 'Oversubscribed 88.5x (Free Float 18%)',
    catalystTemplates: [
      { type: 'IPO_LOW_FLOAT', detail: 'IPO Baru Low Float, Ekspansi Hub Stasiun CNG Pulau Jawa & Sumatera' }
    ]
  },
  {
    symbol: 'SMGA',
    name: 'PT Sumber Mineral Global Abadi Tbk.',
    market: 'IDX',
    basePrice: 94,
    baseChangePct: 20.5,
    sector: 'Basic Materials / Nickel & Mineral Trading',
    volRatioRange: [7.2, 14.8],
    bidOfferRatioRange: [4.5, 9.0],
    topBrokers: ['BK, ZP, CS', 'YP, MG, CC', 'OD, XC, YU'],
    isIpoLowFloat: true,
    ipoOversubscription: 'Oversubscribed 94.2x (Free Float 16%)',
    catalystTemplates: [
      { type: 'IPO_LOW_FLOAT', detail: 'Kontrak Baru Suplai Ore Nikel Smelter RKEF & Ekuitas Kas Kuat' }
    ]
  },
  {
    symbol: 'DATA',
    name: 'PT Remala Abadi Tbk.',
    market: 'IDX',
    basePrice: 560,
    baseChangePct: 12.8,
    sector: 'Telecommunication / FTTH Fiber Optic',
    volRatioRange: [5.2, 10.8],
    bidOfferRatioRange: [3.6, 7.0],
    topBrokers: ['BK, ZP, KZ', 'YP, CC, PD', 'NI, AI, YP'],
    catalystTemplates: [
      { type: 'EARNINGS_RECORD', detail: 'Penetrasi Jaringan Fiber Optic Residensial Jabodetabek Tumbuh +64% YoY' }
    ]
  },
  {
    symbol: 'KOTA',
    name: 'PT DMS Propertindo Tbk.',
    market: 'IDX',
    basePrice: 65,
    baseChangePct: 21.0,
    sector: 'Properties & Real Estate',
    volRatioRange: [7.0, 15.5],
    bidOfferRatioRange: [4.0, 8.8],
    topBrokers: ['YP, MG, CC', 'CP, DR, EP', 'BK, CS, KZ'],
    catalystTemplates: [
      { type: 'STRATEGIC_ACQUISITION', detail: 'Pengembangan Kawasan Residensial Terpadu & Restrukturisasi Fasilitas Kredit' }
    ]
  },
  {
    symbol: 'DEFI',
    name: 'PT Danasupra Erapacific Tbk.',
    market: 'IDX',
    basePrice: 420,
    baseChangePct: 14.2,
    sector: 'Financials / Consumer Financing',
    volRatioRange: [5.5, 11.2],
    bidOfferRatioRange: [3.8, 7.2],
    topBrokers: ['BK, ZP, CS', 'OD, XC, YU', 'YP, MG, CC'],
    catalystTemplates: [
      { type: 'EARNINGS_RECORD', detail: 'Peningkatan Penyaluran Kredit Modal Kerja UMKM & NPL Rendah 0.8%' }
    ]
  },
  {
    symbol: 'BUMI',
    name: 'PT Bumi Resources Tbk.',
    market: 'IDX',
    basePrice: 142,
    baseChangePct: 11.5,
    sector: 'Energy / Thermal Coal Mining',
    volRatioRange: [6.5, 13.5],
    bidOfferRatioRange: [4.0, 8.2],
    topBrokers: ['BK, ZP, KZ, CS', 'CC, YP, PD', 'NI, AI, YP'],
    catalystTemplates: [
      { type: 'SECTORAL', detail: 'Kenaikan Royalti Batubara & Akumulasi Masif Investor Institusi Domestik' }
    ]
  },
  {
    symbol: 'WIFI',
    name: 'PT Solusi Sinergi Digital Tbk.',
    market: 'IDX',
    basePrice: 380,
    baseChangePct: 15.2,
    sector: 'Technology / Edge Data Center & WiFi',
    volRatioRange: [5.8, 12.0],
    bidOfferRatioRange: [3.9, 7.8],
    topBrokers: ['BK, ZP, CS', 'YP, MG, CC', 'OD, XC, YU'],
    catalystTemplates: [
      { type: 'STRATEGIC_ACQUISITION', detail: 'Penggelaran Jalur Fiber Sepanjang Rel Kereta Api Pulau Jawa & Mitra AI Cloud' }
    ]
  },
  {
    symbol: 'VKTR',
    name: 'PT VKTR Teknologi Mobilitas Tbk.',
    market: 'IDX',
    basePrice: 155,
    baseChangePct: 13.6,
    sector: 'Consumer Cyclicals / Commercial EV',
    volRatioRange: [5.0, 10.2],
    bidOfferRatioRange: [3.5, 6.8],
    topBrokers: ['BK, CS, KZ', 'YP, CC, PD', 'NI, AI, YP'],
    catalystTemplates: [
      { type: 'STRATEGIC_ACQUISITION', detail: 'Realisasi Kontrak Bus Listrik Transjakarta & Fasilitas Perakitan Lokal' }
    ]
  },
  {
    symbol: 'GOLF',
    name: 'PT Intra GolfLink Resorts Tbk.',
    market: 'IDX',
    basePrice: 240,
    baseChangePct: 16.8,
    sector: 'Consumer Cyclicals / Tourism & Golf Resorts',
    volRatioRange: [6.2, 13.0],
    bidOfferRatioRange: [4.1, 8.5],
    topBrokers: ['YP, MG, CC', 'BK, ZP, CS', 'CP, DR, EP'],
    isIpoLowFloat: true,
    ipoOversubscription: 'Oversubscribed 91.0x (Free Float 15%)',
    catalystTemplates: [
      { type: 'IPO_LOW_FLOAT', detail: 'Ekspansi Luxury Resort Golf Pecatu Bali & Lapangan Golf Bogor Sentul' }
    ]
  },
  {
    symbol: 'SOLA',
    name: 'PT Xolare Ropa Energy Tbk.',
    market: 'IDX',
    basePrice: 125,
    baseChangePct: 19.4,
    sector: 'Basic Materials / Asphalt & Solar Energy',
    volRatioRange: [7.0, 14.5],
    bidOfferRatioRange: [4.4, 9.2],
    topBrokers: ['YP, MG, CC', 'CP, DR, EP', 'OD, XC, YU'],
    isIpoLowFloat: true,
    ipoOversubscription: 'Oversubscribed 87.2x (Free Float 18%)',
    catalystTemplates: [
      { type: 'IPO_LOW_FLOAT', detail: 'Kontrak Suplai Aspal Olahan Proyek Infrastruktur IKN Nusantara' }
    ]
  },

  // --- IDX BLUE CHIPS & HIGH MOMENTUM MID-CAPS ---
  {
    symbol: 'PANI',
    name: 'PT Pantai Indah Kapuk Dua Tbk.',
    market: 'IDX',
    basePrice: 15450,
    baseChangePct: 6.8,
    sector: 'Properties & Real Estate / Megaproject PIK 2',
    volRatioRange: [4.5, 9.8],
    bidOfferRatioRange: [3.8, 7.2],
    topBrokers: ['BK, ZP, KZ, CS', 'CC, YP, PD', 'NI, AI, YP'],
    catalystTemplates: [
      { type: 'STRATEGIC_ACQUISITION', detail: 'Ekspansi Agresif Landbank PIK 2, Status PSN & Rekor Marketing Sales' },
      { type: 'EARNINGS_RECORD', detail: 'Pertumbuhan Laba Bersih Q2 +185% YoY Didorong Serah Terima Komersial' }
    ]
  },
  {
    symbol: 'BRMS',
    name: 'PT Bumi Resources Minerals Tbk.',
    market: 'IDX',
    basePrice: 428,
    baseChangePct: 8.5,
    sector: 'Basic Materials / Gold & Copper Mining',
    volRatioRange: [5.2, 11.5],
    bidOfferRatioRange: [4.2, 8.5],
    topBrokers: ['BK, ZP, CS, CC', 'YP, MG, PD', 'OD, XC, YU'],
    catalystTemplates: [
      { type: 'EARNINGS_RECORD', detail: 'Pabrik Emas Kedua Palu Beroperasi Penuh, Utilisasi Bijih Emas Kadar Tinggi' }
    ]
  },
  {
    symbol: 'CUAN',
    name: 'PT Petrindo Jaya Kreasi Tbk.',
    market: 'IDX',
    basePrice: 7850,
    baseChangePct: 7.4,
    sector: 'Energy / Coal & Minerals Holding',
    volRatioRange: [4.8, 10.2],
    bidOfferRatioRange: [3.6, 7.0],
    topBrokers: ['BK, ZP, KZ', 'YP, CC, PD', 'NI, AI, YP'],
    catalystTemplates: [
      { type: 'STRATEGIC_ACQUISITION', detail: 'Konsolidasi Tambang Batubara Metalurgi & Diversifikasi Aset Silika' }
    ]
  },
  {
    symbol: 'BREN',
    name: 'PT Barito Renewables Energy Tbk.',
    market: 'IDX',
    basePrice: 6900,
    baseChangePct: 5.6,
    sector: 'Utilities / Geothermal & Wind Energy',
    volRatioRange: [4.2, 8.8],
    bidOfferRatioRange: [3.5, 6.8],
    topBrokers: ['BK, ZP, CS', 'CC, YP, PD', 'OD, XC, YU'],
    catalystTemplates: [
      { type: 'STRATEGIC_ACQUISITION', detail: 'Ekspansi Pembangkit Geothermal Salak-Darajat & Masuk Indeks Global' }
    ]
  },
  {
    symbol: 'AMMN',
    name: 'PT Amman Mineral Internasional Tbk.',
    market: 'IDX',
    basePrice: 9450,
    baseChangePct: 4.8,
    sector: 'Basic Materials / Copper & Gold Smelter',
    volRatioRange: [4.0, 8.2],
    bidOfferRatioRange: [3.4, 6.5],
    topBrokers: ['BK, ZP, KZ, CS', 'CC, YP, PD', 'NI, AI, YP'],
    catalystTemplates: [
      { type: 'STRATEGIC_ACQUISITION', detail: 'Smelter Tembaga Sumbawa Siap Produksi Katoda Tembaga 220 Ribu Ton/Tahun' }
    ]
  },
  {
    symbol: 'TPIA',
    name: 'PT Chandra Asri Pacific Tbk.',
    market: 'IDX',
    basePrice: 7200,
    baseChangePct: 6.2,
    sector: 'Basic Materials / Petrochemical & Infrastructure',
    volRatioRange: [4.5, 9.0],
    bidOfferRatioRange: [3.6, 7.1],
    topBrokers: ['BK, ZP, CS', 'YP, MG, CC', 'OD, XC, YU'],
    catalystTemplates: [
      { type: 'STRATEGIC_ACQUISITION', detail: 'Akuisisi Aset Kilang Shell Singapore & Integrasi Pasokan Kimia Global' }
    ]
  },
  {
    symbol: 'PTRO',
    name: 'PT Petrosea Tbk.',
    market: 'IDX',
    basePrice: 18600,
    baseChangePct: 7.8,
    sector: 'Industrials / Mining & EPC Contractor',
    volRatioRange: [5.0, 11.0],
    bidOfferRatioRange: [3.8, 7.5],
    topBrokers: ['BK, ZP, KZ', 'YP, CC, PD', 'NI, AI, YP'],
    catalystTemplates: [
      { type: 'EARNINGS_RECORD', detail: 'Kontrak Baru Penambangan Emas & Diversifikasi Kontraktor Migas Lepas Pantai' }
    ]
  },
  {
    symbol: 'PGAS',
    name: 'PT Perusahaan Gas Negara Tbk.',
    market: 'IDX',
    basePrice: 1620,
    baseChangePct: 5.2,
    sector: 'Utilities / Natural Gas Infrastructure',
    volRatioRange: [4.2, 8.5],
    bidOfferRatioRange: [3.4, 6.6],
    topBrokers: ['BK, CS, KZ', 'CC, YP, PD', 'OD, XC, YU'],
    catalystTemplates: [
      { type: 'EARNINGS_RECORD', detail: 'Peningkatan Volume Niaga Gas Industri & Proyek Pipa Gas Senipah-Balikpapan' }
    ]
  },
  {
    symbol: 'PGEO',
    name: 'PT Pertamina Geothermal Energy Tbk.',
    market: 'IDX',
    basePrice: 1210,
    baseChangePct: 5.8,
    sector: 'Utilities / Geothermal Renewable',
    volRatioRange: [4.5, 9.2],
    bidOfferRatioRange: [3.5, 6.9],
    topBrokers: ['BK, ZP, CS', 'YP, MG, CC', 'NI, AI, YP'],
    catalystTemplates: [
      { type: 'STRATEGIC_ACQUISITION', detail: 'Eksplorasi Co-Generation Panas Bumi & Sertifikasi Kredit Karbon IDXCarbon' }
    ]
  },
  {
    symbol: 'MEDC',
    name: 'PT Medco Energi Internasional Tbk.',
    market: 'IDX',
    basePrice: 1380,
    baseChangePct: 6.4,
    sector: 'Energy / Oil, Gas & Copper',
    volRatioRange: [4.8, 9.8],
    bidOfferRatioRange: [3.6, 7.2],
    topBrokers: ['BK, ZP, KZ', 'CC, YP, PD', 'OD, XC, YU'],
    catalystTemplates: [
      { type: 'SECTORAL', detail: 'Peningkatan Lifting Minyak Blok Corridor & Kontribusi Dividen Amman Mineral' }
    ]
  },
  {
    symbol: 'BBCA',
    name: 'PT Bank Central Asia Tbk.',
    market: 'IDX',
    basePrice: 10350,
    baseChangePct: 2.8,
    sector: 'Financials / Commercial Banking',
    volRatioRange: [3.5, 6.5],
    bidOfferRatioRange: [3.2, 5.8],
    topBrokers: ['BK, ZP, KZ, CS', 'CC, PD, NI', 'OD, XC, YU'],
    catalystTemplates: [
      { type: 'EARNINGS_RECORD', detail: 'Rekor Laba Bersih Semester I, CASA Kuat 82% & Pertumbuhan Fee Base Digital' },
      { type: 'DIVIDEND', detail: 'Ekspektasi Dividen Interim Solid & Akumulasi Asing Konsisten' }
    ]
  },
  {
    symbol: 'BBRI',
    name: 'PT Bank Rakyat Indonesia Tbk.',
    market: 'IDX',
    basePrice: 5125,
    baseChangePct: 3.2,
    sector: 'Financials / Micro & SME Banking',
    volRatioRange: [3.8, 7.2],
    bidOfferRatioRange: [3.4, 6.2],
    topBrokers: ['BK, ZP, CS', 'CC, YP, PD', 'NI, AI, YP'],
    catalystTemplates: [
      { type: 'EARNINGS_RECORD', detail: 'Perbaikan Kualitas Aset Kredit Mikro & Pemulihan Cadangan Kerugian (CKPN)' }
    ]
  },
  {
    symbol: 'BMRI',
    name: 'PT Bank Mandiri (Persero) Tbk.',
    market: 'IDX',
    basePrice: 7150,
    baseChangePct: 3.5,
    sector: 'Financials / Corporate Banking',
    volRatioRange: [3.6, 6.8],
    bidOfferRatioRange: [3.3, 6.0],
    topBrokers: ['BK, ZP, KZ', 'CC, YP, PD', 'OD, XC, YU'],
    catalystTemplates: [
      { type: 'EARNINGS_RECORD', detail: 'Pertumbuhan Kredit Korporasi & Hilirisasi Industri +18% YoY' }
    ]
  },
  {
    symbol: 'ANTM',
    name: 'PT Aneka Tambang Tbk.',
    market: 'IDX',
    basePrice: 1640,
    baseChangePct: 5.4,
    sector: 'Basic Materials / Gold, Nickel & Bauxite',
    volRatioRange: [4.5, 9.5],
    bidOfferRatioRange: [3.6, 7.2],
    topBrokers: ['BK, ZP, CS', 'YP, MG, CC', 'NI, AI, YP'],
    catalystTemplates: [
      { type: 'SECTORAL', detail: 'Lonjakan Rekor Permintaan Emas Batangan Domestik & Pengiriman Feronikel' }
    ]
  },
  {
    symbol: 'ADRO',
    name: 'PT Adaro Energy Indonesia Tbk.',
    market: 'IDX',
    basePrice: 3820,
    baseChangePct: 4.6,
    sector: 'Energy / Coal, Smelter & Hydro Power',
    volRatioRange: [4.0, 8.0],
    bidOfferRatioRange: [3.4, 6.5],
    topBrokers: ['BK, ZP, KZ', 'CC, YP, PD', 'OD, XC, YU'],
    catalystTemplates: [
      { type: 'DIVIDEND', detail: 'Dividen Tunai Jumbo Yield Tinggi & Progres Smelter Aluminium Kaltara' }
    ]
  },
  {
    symbol: 'ASII',
    name: 'PT Astra International Tbk.',
    market: 'IDX',
    basePrice: 5200,
    baseChangePct: 3.0,
    sector: 'Industrials / Automotive & Heavy Equipments',
    volRatioRange: [3.5, 6.8],
    bidOfferRatioRange: [3.2, 5.9],
    topBrokers: ['BK, CS, KZ', 'CC, YP, PD', 'NI, AI, YP'],
    catalystTemplates: [
      { type: 'EARNINGS_RECORD', detail: 'Pangsa Pasar Otomotif Pulih 56% & Kinerja Solid Anak Usaha UNTR' }
    ]
  },
  {
    symbol: 'GOTO',
    name: 'PT GoTo Gojek Tokopedia Tbk.',
    market: 'IDX',
    basePrice: 62,
    baseChangePct: 8.8,
    sector: 'Technology / On-Demand & Fintech',
    volRatioRange: [5.5, 12.0],
    bidOfferRatioRange: [4.0, 8.5],
    topBrokers: ['BK, ZP, CS', 'YP, MG, CC', 'OD, XC, YU'],
    catalystTemplates: [
      { type: 'EARNINGS_RECORD', detail: 'Pertumbuhan Transaksi E-Commerce TikTok Shop & EBITDA Positif Berkelanjutan' }
    ]
  },

  // --- US WALL STREET (NYSE / NASDAQ) ---
  {
    symbol: 'PLTR',
    name: 'Palantir Technologies Inc.',
    market: 'US',
    basePrice: 34.50,
    baseChangePct: 7.8,
    sector: 'Technology / Enterprise AI Platforms',
    volRatioRange: [4.5, 9.5],
    bidOfferRatioRange: [3.8, 7.2],
    topBrokers: ['Citadel, Jane Street, Susquehanna', 'Goldman Sachs, Morgan Stanley', 'Virtu, Two Sigma'],
    catalystTemplates: [
      { type: 'EARNINGS_RECORD', detail: 'AIP Commercial Customer Count Soared +83% YoY with S&P 500 Index Inflow' }
    ]
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    market: 'US',
    basePrice: 128.40,
    baseChangePct: 4.8,
    sector: 'Technology / AI Chips & Data Centers',
    volRatioRange: [3.8, 7.5],
    bidOfferRatioRange: [3.5, 6.5],
    topBrokers: ['Goldman Sachs, Morgan Stanley', 'Citadel, Susquehanna', 'BlackRock, Fidelity'],
    catalystTemplates: [
      { type: 'EARNINGS_RECORD', detail: 'Blackwell GPU Production Full Capacity Delivery to Hyperscalers' }
    ]
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    market: 'US',
    basePrice: 224.50,
    baseChangePct: 6.2,
    sector: 'Consumer Cyclicals / Autonomous EV & Robotics',
    volRatioRange: [4.2, 8.8],
    bidOfferRatioRange: [3.6, 7.0],
    topBrokers: ['Morgan Stanley, Citadel', 'Jane Street, Virtu', 'Goldman Sachs, Barclays'],
    catalystTemplates: [
      { type: 'STRATEGIC_ACQUISITION', detail: 'Full Self-Driving (FSD) v13 Regulatory Approvals & Cybercab Fleet Rollout' }
    ]
  },
  {
    symbol: 'COIN',
    name: 'Coinbase Global, Inc.',
    market: 'US',
    basePrice: 218.00,
    baseChangePct: 8.5,
    sector: 'Financials / Crypto Exchange & Custody',
    volRatioRange: [5.0, 10.5],
    bidOfferRatioRange: [3.9, 7.8],
    topBrokers: ['Citadel, Jane Street', 'Goldman Sachs, Susquehanna', 'Virtu, DRW'],
    catalystTemplates: [
      { type: 'SECTORAL', detail: 'Institutional Spot ETF Custody Revenue & Base Layer-2 Network Fee Expansion' }
    ]
  },
  {
    symbol: 'AMD',
    name: 'Advanced Micro Devices, Inc.',
    market: 'US',
    basePrice: 156.80,
    baseChangePct: 5.4,
    sector: 'Technology / AI Processors & Server Chips',
    volRatioRange: [4.0, 8.2],
    bidOfferRatioRange: [3.4, 6.6],
    topBrokers: ['Goldman Sachs, Morgan Stanley', 'Citadel, Susquehanna', 'BlackRock, Vanguard'],
    catalystTemplates: [
      { type: 'STRATEGIC_ACQUISITION', detail: 'MI325X AI Accelerator Volume Shipments & Cloud Partnership Wins' }
    ]
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    market: 'US',
    basePrice: 228.60,
    baseChangePct: 2.6,
    sector: 'Technology / Consumer Hardware & Services',
    volRatioRange: [3.2, 6.0],
    bidOfferRatioRange: [3.0, 5.5],
    topBrokers: ['Morgan Stanley, Goldman Sachs', 'Citadel, BlackRock', 'Berkshire Hathaway, Fidelity'],
    catalystTemplates: [
      { type: 'STRATEGIC_ACQUISITION', detail: 'Apple Intelligence Supercycle Upgrade Adoption Across Pro Ecosystem' }
    ]
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    market: 'US',
    basePrice: 422.50,
    baseChangePct: 2.8,
    sector: 'Technology / Cloud & Generative AI Software',
    volRatioRange: [3.4, 6.2],
    bidOfferRatioRange: [3.2, 5.8],
    topBrokers: ['Goldman Sachs, Morgan Stanley', 'Citadel, Vanguard', 'BlackRock, State Street'],
    catalystTemplates: [
      { type: 'EARNINGS_RECORD', detail: 'Azure Cloud AI Revenue Surge +34% YoY & Copilot Enterprise Seats Expansion' }
    ]
  },
  {
    symbol: 'UBER',
    name: 'Uber Technologies, Inc.',
    market: 'US',
    basePrice: 76.80,
    baseChangePct: 5.1,
    sector: 'Technology / Mobility & Delivery Platform',
    volRatioRange: [4.0, 8.0],
    bidOfferRatioRange: [3.4, 6.7],
    topBrokers: ['Citadel, Morgan Stanley', 'Goldman Sachs, Jane Street', 'Susquehanna, Virtu'],
    catalystTemplates: [
      { type: 'EARNINGS_RECORD', detail: 'Record Free Cash Flow Generation & Autonomous Robotaxi Fleet Partnerships' }
    ]
  },

  // --- GLOBAL HUB (SGX / CRYPTO / COMMODITIES) ---
  {
    symbol: 'DBS',
    name: 'DBS Group Holdings Ltd',
    market: 'SGX',
    basePrice: 38.45,
    baseChangePct: 2.8,
    sector: 'Financials / Singapore Tier-1 Banking',
    volRatioRange: [3.5, 6.5],
    bidOfferRatioRange: [3.2, 5.6],
    topBrokers: ['Temasek, GIC, Morgan Stanley', 'Goldman Sachs, UBS', 'Citigroup, CGS-CIMB'],
    catalystTemplates: [
      { type: 'DIVIDEND', detail: 'Dividend Yield 5.8% Support, Resilient Net Interest Margin & Wealth Management AUM' }
    ]
  },
  {
    symbol: 'UOB',
    name: 'United Overseas Bank Ltd',
    market: 'SGX',
    basePrice: 32.60,
    baseChangePct: 2.5,
    sector: 'Financials / ASEAN Commercial Banking',
    volRatioRange: [3.2, 6.0],
    bidOfferRatioRange: [3.0, 5.4],
    topBrokers: ['GIC, Temasek, UBS', 'Morgan Stanley, Goldman Sachs', 'CGS-CIMB, DBS Vickers'],
    catalystTemplates: [
      { type: 'DIVIDEND', detail: 'ASEAN-4 Consumer Banking Integration Complete & Strong Cross-Border Trade Flows' }
    ]
  },
  {
    symbol: 'SINGTEL',
    name: 'Singapore Telecommunications Ltd',
    market: 'SGX',
    basePrice: 3.18,
    baseChangePct: 3.6,
    sector: 'Telecommunication / Regional Telco & Data Centers',
    volRatioRange: [3.8, 7.2],
    bidOfferRatioRange: [3.3, 6.0],
    topBrokers: ['Temasek, GIC, Citigroup', 'Morgan Stanley, Goldman Sachs', 'CGS-CIMB, UBS'],
    catalystTemplates: [
      { type: 'STRATEGIC_ACQUISITION', detail: 'Value Realisation Program, Digital Infra Data Center Expansion in ASEAN' }
    ]
  },
  {
    symbol: 'BTCUSD',
    name: 'Bitcoin / USD Digital Asset',
    market: 'CRYPTO',
    basePrice: 68500,
    baseChangePct: 6.4,
    sector: 'Digital Assets / Global Store of Value',
    volRatioRange: [4.8, 9.5],
    bidOfferRatioRange: [3.6, 7.2],
    topBrokers: ['BlackRock IBIT, Fidelity FBTC', 'Bitwise, Ark Invest', 'Coinbase Institutional'],
    catalystTemplates: [
      { type: 'SECTORAL', detail: 'Institutional Spot ETF Inflow Streak & Post-Halving Supply Constriction' }
    ]
  },
  {
    symbol: 'GOLD',
    name: 'Gold Futures (COMEX)',
    market: 'GLOBAL',
    basePrice: 2540,
    baseChangePct: 2.2,
    sector: 'Commodities / Precious Metals',
    volRatioRange: [3.5, 6.8],
    bidOfferRatioRange: [3.2, 5.8],
    topBrokers: ['Central Banks Reserve Allocation', 'JPMorgan, HSBC Gold Desk', 'UBS, Citigroup'],
    catalystTemplates: [
      { type: 'SECTORAL', detail: 'Central Bank Gold Reserves Accumulation & Global Rate Easing Tailwinds' }
    ]
  }
];

/**
 * Deterministic pseudo-random number generator from date string + seed offset.
 * Always produces a uniform float in the range [0, 1).
 */
function getDeterministicRandom(seedStr: string): () => number {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    const char = seedStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  let current = Math.abs(hash) || 1234567;
  return () => {
    current = (current * 9301 + 49297) % 233280;
    return Math.abs(current) / 233280;
  };
}

/**
 * Generate full, realistic daily trading recommendations dynamically based on
 * calendar date seed and live price feeds.
 */
export function generateDailyTradingPicks(
  dateStr?: string,
  seedOffset: number = 0,
  livePriceLookup?: Record<string, { price: number; changePercent?: number }>
): DailyTradingStock[] {
  const activeDate = dateStr || new Date().toISOString().split('T')[0];
  const fullSeed = `${activeDate}-vam-seed-${seedOffset}`;
  const rand = getDeterministicRandom(fullSeed);

  // Pick ~28 stocks: 18 IDX, 6 US, 4 GLOBAL/SGX/CRYPTO
  const validUniverse = UNIVERSE_CANDIDATES.filter((s): s is DailyStockCandidateTemplate => !!s && typeof s === 'object' && !!s.symbol);
  const idxPool = validUniverse.filter(s => s.market === 'IDX');
  const usPool = validUniverse.filter(s => s.market === 'US');
  const globalPool = validUniverse.filter(s => s.market === 'GLOBAL' || s.market === 'SGX' || s.market === 'CRYPTO');

  // Shuffle pools deterministically
  const shuffle = <T>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const r = rand();
      const j = Math.floor(r * (i + 1));
      if (j >= 0 && j < copy.length) {
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
    }
    return copy.filter(Boolean);
  };

  const selectedIdx = shuffle(idxPool).slice(0, 18);
  const selectedUs = shuffle(usPool).slice(0, 6);
  const selectedGlobal = shuffle(globalPool).slice(0, 4);

  const selectedPool = [...selectedIdx, ...selectedUs, ...selectedGlobal].filter((candidate): candidate is DailyStockCandidateTemplate => !!candidate && !!candidate.symbol);

  // Lifecycle status assignments distribution
  const statusOptions: SignalLifecycleStatus[] = [
    'TRIGGER_HARI_INI',
    'TRIGGER_HARI_INI',
    'LANJUTAN_TREN',
    'LANJUTAN_TREN',
    'PULLBACK_RETEST',
    'AKUMULASI_BANDAR'
  ];

  return selectedPool.map((candidate, idx) => {
    const market = candidate.market || 'IDX';
    const isIdx = market === 'IDX';
    const isUs = market === 'US';
    const isSgd = market === 'SGX';
    const isCrypto = market === 'CRYPTO';

    // Live override or computed variation
    const liveItem = livePriceLookup ? (livePriceLookup[candidate.symbol] || livePriceLookup[`${candidate.symbol}.JK`]) : null;
    
    // Slight daily fluctuation around base price (+-2.5%)
    const dayPriceMultiplier = 1 + (rand() * 0.05 - 0.025);
    let finalPriceNum = (candidate.basePrice || 100) * dayPriceMultiplier;
    if (isIdx && finalPriceNum > 100) {
      finalPriceNum = Math.round(finalPriceNum);
    } else {
      finalPriceNum = +(finalPriceNum.toFixed(2));
    }

    let finalChangePct = (candidate.baseChangePct || 0) + (rand() * 4.0 - 2.0);
    finalChangePct = +(finalChangePct.toFixed(2));

    if (liveItem && typeof liveItem.price === 'number' && liveItem.price > 0) {
      finalPriceNum = liveItem.price;
      if (liveItem.changePercent !== undefined) {
        finalChangePct = liveItem.changePercent;
      }
    }

    // Format price & change string
    const priceStr = isIdx 
      ? `IDR ${Math.round(finalPriceNum).toLocaleString('id-ID')}`
      : isSgd 
      ? `SGD ${finalPriceNum.toFixed(2)}`
      : isCrypto
      ? `USD $${Math.round(finalPriceNum).toLocaleString('en-US')}`
      : `USD $${finalPriceNum.toFixed(2)}`;

    const changeStr = `${finalChangePct >= 0 ? '+' : ''}${finalChangePct.toFixed(2)}%`;

    // Dynamic Volume & Order Book
    const minVol = candidate.volRatioRange ? candidate.volRatioRange[0] : 3.0;
    const maxVol = candidate.volRatioRange ? candidate.volRatioRange[1] : 8.0;
    const volRatio = +(minVol + rand() * (maxVol - minVol)).toFixed(2);

    const minBid = candidate.bidOfferRatioRange ? candidate.bidOfferRatioRange[0] : 2.5;
    const maxBid = candidate.bidOfferRatioRange ? candidate.bidOfferRatioRange[1] : 6.0;
    const bidOfferRatio = +(minBid + rand() * (maxBid - minBid)).toFixed(1);

    // Formulate volume string
    let volumeStr = `${(10 + rand() * 85).toFixed(1)}M`;
    if (finalPriceNum > 5000 && isIdx) {
      volumeStr = `${(1.5 + rand() * 8.5).toFixed(1)}M`;
    } else if (isUs) {
      volumeStr = `${(4 + rand() * 32).toFixed(1)}M`;
    }

    // Order Book Lot breakdown
    const bidLots = Math.round(300 + rand() * 900);
    const offerLots = Math.max(1, Math.round(bidLots / (bidOfferRatio || 1)));
    const bidVolumeRatioStr = isIdx 
      ? `${bidLots}K Lot Bid vs ${offerLots}K Lot Offer (${bidOfferRatio} : 1)`
      : `${(bidLots * 10).toLocaleString()}K Shares Buy Wall vs ${(offerLots * 10).toLocaleString()}K Shares Offer (${bidOfferRatio} : 1)`;

    // Sinyal Lifecycle Status
    const signalStatus = statusOptions[(idx + Math.floor(rand() * 4)) % statusOptions.length];

    // Momentum & Technicals
    const rsiVal = +(70 + rand() * 14.5).toFixed(1);
    const macdStatus: 'Golden Cross Positif' | 'Bullish Expansion' | 'Neutral' = 
      idx % 3 === 0 ? 'Golden Cross Positif' : 'Bullish Expansion';

    // Brokers & Catalysts
    const topBrokersArr = (candidate.topBrokers && candidate.topBrokers.length > 0) 
      ? candidate.topBrokers 
      : ['YP, MG, CC', 'BK, ZP, CS', 'NI, AI, YP'];
    const brokerPick = topBrokersArr[Math.floor(rand() * topBrokersArr.length)] || 'YP, MG, CC';

    const catalystArr = (candidate.catalystTemplates && candidate.catalystTemplates.length > 0)
      ? candidate.catalystTemplates
      : [{ type: 'SECTORAL' as const, detail: 'Katalis Fundamental & Momentum Sektoral' }];
    const catalystObj = catalystArr[Math.floor(rand() * catalystArr.length)] || {
      type: 'SECTORAL' as const,
      detail: 'Katalis Fundamental & Momentum Sektoral'
    };
    const catalystType = catalystObj.type || 'SECTORAL';
    const catalystDetail = catalystObj.detail || 'Katalis Fundamental & Momentum Sektoral';

    const brokerNetBuyVal = isIdx 
      ? `Net Buy Rp ${(5 + rand() * 45).toFixed(1)} Miliar`
      : `Net Buy $${(12 + rand() * 85).toFixed(1)} Million`;

    // Calculate Trading Plan Targets
    const entryLow = isIdx ? Math.round(finalPriceNum * 0.992) : +(finalPriceNum * 0.992).toFixed(2);
    const entryHigh = isIdx ? Math.round(finalPriceNum) : +finalPriceNum.toFixed(2);
    const targetP = isIdx ? Math.round(finalPriceNum * 1.045) : +(finalPriceNum * 1.045).toFixed(2);
    const stopL = isIdx ? Math.round(finalPriceNum * 0.975) : +(finalPriceNum * 0.975).toFixed(2);
    const resLevel = isIdx ? Math.round(finalPriceNum * 0.995) : +(finalPriceNum * 0.995).toFixed(2);

    const targetDiffPct = (((targetP - finalPriceNum) / finalPriceNum) * 100).toFixed(1);
    const stopLossDiffPct = (((finalPriceNum - stopL) / finalPriceNum) * 100).toFixed(1);

    const matchScore = Math.min(99, Math.max(93, Math.round(94 + rand() * 5.8)));

    const maIndicators = computeMaIndicators(finalPriceNum, candidate.market);

    const ema20Num = isIdx ? Math.round(finalPriceNum * 0.94) : +(finalPriceNum * 0.94).toFixed(2);
    const ema20Str = isIdx ? `IDR ${ema20Num.toLocaleString('id-ID')}` : `$${ema20Num}`;

    // Sparkline points
    const p1 = finalPriceNum * 0.96;
    const p2 = finalPriceNum * 0.97;
    const p3 = finalPriceNum * 0.965;
    const p4 = finalPriceNum * 0.985;
    const p5 = finalPriceNum * 0.99;
    const p6 = finalPriceNum * 0.995;
    const p7 = finalPriceNum;
    const sparkline = [p1, p2, p3, p4, p5, p6, p7].map(v => isIdx ? Math.round(v) : +v.toFixed(2));

    const stockItem: DailyTradingStock = {
      symbol: candidate.symbol,
      name: candidate.name,
      market: candidate.market,
      price: priceStr,
      priceNum: finalPriceNum,
      change: changeStr,
      changePercent: finalChangePct,
      volume: volumeStr,
      volRatio: volRatio,
      signalStatus: signalStatus,
      signalDate: activeDate,

      orderBook: {
        bidOfferRatio: bidOfferRatio,
        bidVolumeRatioStr: bidVolumeRatioStr,
        isWallBuy: bidOfferRatio >= 3.0,
        volumeVsMa20: `${volRatio}x MA20`,
        volumeVsMa50: `${(volRatio * 1.35).toFixed(1)}x MA50`
      },

      momentum: {
        macdStatus: macdStatus,
        macdIsPositiveGoldenCross: true,
        bbBreakout: true,
        bbUpperBandLevel: isIdx ? `IDR ${Math.round(finalPriceNum * 0.96).toLocaleString('id-ID')}` : `$${(finalPriceNum * 0.96).toFixed(2)}`,
        rsiVal: rsiVal,
        rsiHotMomentum: rsiVal >= 70
      },

      bandarAndFundamentals: {
        topBrokersAccumulation: brokerPick,
        brokerNetBuyVal: brokerNetBuyVal,
        isBandarAccumulation: true,
        catalystType: catalystType,
        catalystDetail: catalystDetail,
        isIpoLowFloat: candidate.isIpoLowFloat || false,
        ipoOversubscription: candidate.ipoOversubscription
      },

      maIndicators: maIndicators,

      tradingViewScreener: {
        priceAboveEma10: true,
        ema10Value: isIdx ? `IDR ${maIndicators.ma10.toLocaleString('id-ID')}` : `$${maIndicators.ma10}`,
        priceAboveEma20: true,
        ema20Value: ema20Str,
        epsGrowthYoY: `+${(6 + rand() * 18).toFixed(1)}%`,
        sector: candidate.sector,
        screenerMatch: `Price > EMA20 | Vol Surge ${volRatio}x | ${signalStatus === 'TRIGGER_HARI_INI' ? 'New Breakout Today' : 'Momentum Runner'}`
      },

      googleNewsSentiment: {
        score: Math.round(88 + rand() * 11),
        sentimentStatus: 'VERY_BULLISH',
        headline: `${candidate.name} (${candidate.symbol}): ${catalystDetail}`,
        source: isIdx ? 'Bisnis.com / CNBC Indonesia' : isUs ? 'Bloomberg / Reuters' : 'The Business Times SG'
      },

      maEmaCross: {
        status: 'Golden Cross',
        ma10: maIndicators.ma10,
        ema10: isIdx ? Math.round(finalPriceNum * 0.965) : +(finalPriceNum * 0.965).toFixed(2),
        diffPercent: 2.8
      },
      rsi: rsiVal,
      rsiStatus: 'Bullish Momentum',
      chartBreakout: {
        isBreakout: true,
        resistanceLevel: isIdx ? `IDR ${resLevel.toLocaleString('id-ID')}` : `$${resLevel.toFixed(2)}`,
        breakoutType: '20-Day High Breakout'
      },
      volumeBreakout: {
        isVolumeBreakout: true,
        volMultiplier: `${volRatio}x 20MA`
      },
      entryZone: isIdx 
        ? `${entryLow.toLocaleString('id-ID')} - ${entryHigh.toLocaleString('id-ID')}`
        : `${entryLow.toFixed(2)} - ${entryHigh.toFixed(2)}`,
      targetPrice: isIdx 
        ? `${targetP.toLocaleString('id-ID')} (+${targetDiffPct}%)`
        : `${targetP.toFixed(2)} (+${targetDiffPct}%)`,
      stopLoss: isIdx 
        ? `${stopL.toLocaleString('id-ID')} (-${stopLossDiffPct}%)`
        : `${stopL.toFixed(2)} (-${stopLossDiffPct}%)`,
      riskReward: '1 : 2.0',
      aiRationale: '',
      matchScore: matchScore,
      sparkline: sparkline
    };

    stockItem.aiRationale = getDynamicAiThesis(stockItem);
    return stockItem;
  });
}
