export interface StockMetaData {
  symbol: string;
  cleanSymbol: string;
  tradingViewSymbol: string;
  yahooSymbol: string;
  name: string;
  market: 'IDX' | 'SGX' | 'US' | 'WORLD' | 'FOREX' | 'CRYPTO';
  marketName: string;
  currency: 'IDR' | 'SGD' | 'USD';
  currencySymbol: string;
}

export const MASTER_STOCKS_DATABASE: Record<string, StockMetaData> = {
  // --- IDX (Indonesia) ---
  'BBCA': { symbol: 'BBCA', cleanSymbol: 'BBCA', tradingViewSymbol: 'IDX:BBCA', yahooSymbol: 'BBCA.JK', name: 'PT Bank Central Asia Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'BBRI': { symbol: 'BBRI', cleanSymbol: 'BBRI', tradingViewSymbol: 'IDX:BBRI', yahooSymbol: 'BBRI.JK', name: 'PT Bank Rakyat Indonesia (Persero) Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'BMRI': { symbol: 'BMRI', cleanSymbol: 'BMRI', tradingViewSymbol: 'IDX:BMRI', yahooSymbol: 'BMRI.JK', name: 'PT Bank Mandiri (Persero) Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'TLKM': { symbol: 'TLKM', cleanSymbol: 'TLKM', tradingViewSymbol: 'IDX:TLKM', yahooSymbol: 'TLKM.JK', name: 'PT Telkom Indonesia (Persero) Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'ASII': { symbol: 'ASII', cleanSymbol: 'ASII', tradingViewSymbol: 'IDX:ASII', yahooSymbol: 'ASII.JK', name: 'PT Astra International Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'BBNI': { symbol: 'BBNI', cleanSymbol: 'BBNI', tradingViewSymbol: 'IDX:BBNI', yahooSymbol: 'BBNI.JK', name: 'PT Bank Negara Indonesia (Persero) Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'ADRO': { symbol: 'ADRO', cleanSymbol: 'ADRO', tradingViewSymbol: 'IDX:ADRO', yahooSymbol: 'ADRO.JK', name: 'PT Adaro Energy Indonesia Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'UNVR': { symbol: 'UNVR', cleanSymbol: 'UNVR', tradingViewSymbol: 'IDX:UNVR', yahooSymbol: 'UNVR.JK', name: 'PT Unilever Indonesia Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'GOTO': { symbol: 'GOTO', cleanSymbol: 'GOTO', tradingViewSymbol: 'IDX:GOTO', yahooSymbol: 'GOTO.JK', name: 'PT GoTo Gojek Tokopedia Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'ANTM': { symbol: 'ANTM', cleanSymbol: 'ANTM', tradingViewSymbol: 'IDX:ANTM', yahooSymbol: 'ANTM.JK', name: 'PT Aneka Tambang Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'MDKA': { symbol: 'MDKA', cleanSymbol: 'MDKA', tradingViewSymbol: 'IDX:MDKA', yahooSymbol: 'MDKA.JK', name: 'PT Merdeka Copper Gold Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'PTBA': { symbol: 'PTBA', cleanSymbol: 'PTBA', tradingViewSymbol: 'IDX:PTBA', yahooSymbol: 'PTBA.JK', name: 'PT Bukit Asam Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'ITMG': { symbol: 'ITMG', cleanSymbol: 'ITMG', tradingViewSymbol: 'IDX:ITMG', yahooSymbol: 'ITMG.JK', name: 'PT Indo Tambangraya Megah Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'HRUM': { symbol: 'HRUM', cleanSymbol: 'HRUM', tradingViewSymbol: 'IDX:HRUM', yahooSymbol: 'HRUM.JK', name: 'PT Harum Energy Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'SMGR': { symbol: 'SMGR', cleanSymbol: 'SMGR', tradingViewSymbol: 'IDX:SMGR', yahooSymbol: 'SMGR.JK', name: 'PT Semen Indonesia (Persero) Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'AMRT': { symbol: 'AMRT', cleanSymbol: 'AMRT', tradingViewSymbol: 'IDX:AMRT', yahooSymbol: 'AMRT.JK', name: 'PT Sumber Alfaria Trijaya Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'ICBP': { symbol: 'ICBP', cleanSymbol: 'ICBP', tradingViewSymbol: 'IDX:ICBP', yahooSymbol: 'ICBP.JK', name: 'PT Indofood CBP Sukses Makmur Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'INDF': { symbol: 'INDF', cleanSymbol: 'INDF', tradingViewSymbol: 'IDX:INDF', yahooSymbol: 'INDF.JK', name: 'PT Indofood Sukses Makmur Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'KLBF': { symbol: 'KLBF', cleanSymbol: 'KLBF', tradingViewSymbol: 'IDX:KLBF', yahooSymbol: 'KLBF.JK', name: 'PT Kalbe Farma Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'BRPT': { symbol: 'BRPT', cleanSymbol: 'BRPT', tradingViewSymbol: 'IDX:BRPT', yahooSymbol: 'BRPT.JK', name: 'PT Barito Pacific Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'BREN': { symbol: 'BREN', cleanSymbol: 'BREN', tradingViewSymbol: 'IDX:BREN', yahooSymbol: 'BREN.JK', name: 'PT Barito Renewables Energy Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'AMMN': { symbol: 'AMMN', cleanSymbol: 'AMMN', tradingViewSymbol: 'IDX:AMMN', yahooSymbol: 'AMMN.JK', name: 'PT Amman Mineral Internasional Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'TPIA': { symbol: 'TPIA', cleanSymbol: 'TPIA', tradingViewSymbol: 'IDX:TPIA', yahooSymbol: 'TPIA.JK', name: 'PT Chandra Asri Pacific Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'CPIN': { symbol: 'CPIN', cleanSymbol: 'CPIN', tradingViewSymbol: 'IDX:CPIN', yahooSymbol: 'CPIN.JK', name: 'PT Charoen Pokphand Indonesia Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'BRMS': { symbol: 'BRMS', cleanSymbol: 'BRMS', tradingViewSymbol: 'IDX:BRMS', yahooSymbol: 'BRMS.JK', name: 'PT Bumi Resources Minerals Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'PANI': { symbol: 'PANI', cleanSymbol: 'PANI', tradingViewSymbol: 'IDX:PANI', yahooSymbol: 'PANI.JK', name: 'PT Pantai Indah Kapuk Dua Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'CUAN': { symbol: 'CUAN', cleanSymbol: 'CUAN', tradingViewSymbol: 'IDX:CUAN', yahooSymbol: 'CUAN.JK', name: 'PT Petrindo Jaya Kreasi Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'PGAS': { symbol: 'PGAS', cleanSymbol: 'PGAS', tradingViewSymbol: 'IDX:PGAS', yahooSymbol: 'PGAS.JK', name: 'PT Perusahaan Gas Negara Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'PGEO': { symbol: 'PGEO', cleanSymbol: 'PGEO', tradingViewSymbol: 'IDX:PGEO', yahooSymbol: 'PGEO.JK', name: 'PT Pertamina Geothermal Energy Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'COAL': { symbol: 'COAL', cleanSymbol: 'COAL', tradingViewSymbol: 'IDX:COAL', yahooSymbol: 'COAL.JK', name: 'PT Black Diamond Resources Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'DEFI': { symbol: 'DEFI', cleanSymbol: 'DEFI', tradingViewSymbol: 'IDX:DEFI', yahooSymbol: 'DEFI.JK', name: 'PT Danasupra Erapacific Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'BUKA': { symbol: 'BUKA', cleanSymbol: 'BUKA', tradingViewSymbol: 'IDX:BUKA', yahooSymbol: 'BUKA.JK', name: 'PT Bukalapak.com Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'MEDC': { symbol: 'MEDC', cleanSymbol: 'MEDC', tradingViewSymbol: 'IDX:MEDC', yahooSymbol: 'MEDC.JK', name: 'PT Medco Energi Internasional Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'DEWA': { symbol: 'DEWA', cleanSymbol: 'DEWA', tradingViewSymbol: 'IDX:DEWA', yahooSymbol: 'DEWA.JK', name: 'PT Darma Henwa Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'DSSA': { symbol: 'DSSA', cleanSymbol: 'DSSA', tradingViewSymbol: 'IDX:DSSA', yahooSymbol: 'DSSA.JK', name: 'PT Dian Swastatika Sentosa Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'BUMI': { symbol: 'BUMI', cleanSymbol: 'BUMI', tradingViewSymbol: 'IDX:BUMI', yahooSymbol: 'BUMI.JK', name: 'PT Bumi Resources Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'KOTA': { symbol: 'KOTA', cleanSymbol: 'KOTA', tradingViewSymbol: 'IDX:KOTA', yahooSymbol: 'KOTA.JK', name: 'PT DMS Propertindo Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'JGLE': { symbol: 'JGLE', cleanSymbol: 'JGLE', tradingViewSymbol: 'IDX:JGLE', yahooSymbol: 'JGLE.JK', name: 'PT Graha Andrasentra Propertindo Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'CTTH': { symbol: 'CTTH', cleanSymbol: 'CTTH', tradingViewSymbol: 'IDX:CTTH', yahooSymbol: 'CTTH.JK', name: 'PT Citatah Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'LAND': { symbol: 'LAND', cleanSymbol: 'LAND', tradingViewSymbol: 'IDX:LAND', yahooSymbol: 'LAND.JK', name: 'PT Trinitan Land Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'PIPA': { symbol: 'PIPA', cleanSymbol: 'PIPA', tradingViewSymbol: 'IDX:PIPA', yahooSymbol: 'PIPA.JK', name: 'PT Multi Spunindo Jaya Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'LPKR': { symbol: 'LPKR', cleanSymbol: 'LPKR', tradingViewSymbol: 'IDX:LPKR', yahooSymbol: 'LPKR.JK', name: 'PT Lippo Karawaci Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'BACH': { symbol: 'BACH', cleanSymbol: 'BACH', tradingViewSymbol: 'IDX:BACH', yahooSymbol: 'BACH.JK', name: 'PT Batavia Alumina Chemical Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'EMMI': { symbol: 'EMMI', cleanSymbol: 'EMMI', tradingViewSymbol: 'IDX:EMMI', yahooSymbol: 'EMMI.JK', name: 'PT Eka Mas Mandiri Indonesia Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'JECX': { symbol: 'JECX', cleanSymbol: 'JECX', tradingViewSymbol: 'IDX:JECX', yahooSymbol: 'JECX.JK', name: 'PT Jakarta Electronic Commerce Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'PRDL': { symbol: 'PRDL', cleanSymbol: 'PRDL', tradingViewSymbol: 'IDX:PRDL', yahooSymbol: 'PRDL.JK', name: 'PT Pratama Real Estate Development Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'RANS': { symbol: 'RANS', cleanSymbol: 'RANS', tradingViewSymbol: 'IDX:RANS', yahooSymbol: 'RANS.JK', name: 'PT Rona Adi Nusantara Sejahtera Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'PJHB-W': { symbol: 'PJHB-W', cleanSymbol: 'PJHB-W', tradingViewSymbol: 'IDX:PJHB-W', yahooSymbol: 'PJHB-W.JK', name: 'PT Panca Jaya Hanurata Warrant', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'UNTR': { symbol: 'UNTR', cleanSymbol: 'UNTR', tradingViewSymbol: 'IDX:UNTR', yahooSymbol: 'UNTR.JK', name: 'PT United Tractors Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'ACES': { symbol: 'ACES', cleanSymbol: 'ACES', tradingViewSymbol: 'IDX:ACES', yahooSymbol: 'ACES.JK', name: 'PT Aspirasi Hidup Indonesia Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'EMTK': { symbol: 'EMTK', cleanSymbol: 'EMTK', tradingViewSymbol: 'IDX:EMTK', yahooSymbol: 'EMTK.JK', name: 'PT Elang Mahkota Teknologi Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'BSDE': { symbol: 'BSDE', cleanSymbol: 'BSDE', tradingViewSymbol: 'IDX:BSDE', yahooSymbol: 'BSDE.JK', name: 'PT Bumi Serpong Damai Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'MNCN': { symbol: 'MNCN', cleanSymbol: 'MNCN', tradingViewSymbol: 'IDX:MNCN', yahooSymbol: 'MNCN.JK', name: 'PT Media Nusantara Citra Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'BBTN': { symbol: 'BBTN', cleanSymbol: 'BBTN', tradingViewSymbol: 'IDX:BBTN', yahooSymbol: 'BBTN.JK', name: 'PT Bank Tabungan Negara (Persero) Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'INKP': { symbol: 'INKP', cleanSymbol: 'INKP', tradingViewSymbol: 'IDX:INKP', yahooSymbol: 'INKP.JK', name: 'PT Indah Kiat Pulp & Paper Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'TKIM': { symbol: 'TKIM', cleanSymbol: 'TKIM', tradingViewSymbol: 'IDX:TKIM', yahooSymbol: 'TKIM.JK', name: 'PT Pabrik Kertas Tjiwi Kimia Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'TOWR': { symbol: 'TOWR', cleanSymbol: 'TOWR', tradingViewSymbol: 'IDX:TOWR', yahooSymbol: 'TOWR.JK', name: 'PT Sarana Menara Nusantara Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'TBIG': { symbol: 'TBIG', cleanSymbol: 'TBIG', tradingViewSymbol: 'IDX:TBIG', yahooSymbol: 'TBIG.JK', name: 'PT Tower Bersama Infrastructure Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'AKRA': { symbol: 'AKRA', cleanSymbol: 'AKRA', tradingViewSymbol: 'IDX:AKRA', yahooSymbol: 'AKRA.JK', name: 'PT AKR Corporindo Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'EXCL': { symbol: 'EXCL', cleanSymbol: 'EXCL', tradingViewSymbol: 'IDX:EXCL', yahooSymbol: 'EXCL.JK', name: 'PT XL Axiata Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'ISAT': { symbol: 'ISAT', cleanSymbol: 'ISAT', tradingViewSymbol: 'IDX:ISAT', yahooSymbol: 'ISAT.JK', name: 'PT Indosat Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'INCO': { symbol: 'INCO', cleanSymbol: 'INCO', tradingViewSymbol: 'IDX:INCO', yahooSymbol: 'INCO.JK', name: 'PT Vale Indonesia Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'MBMA': { symbol: 'MBMA', cleanSymbol: 'MBMA', tradingViewSymbol: 'IDX:MBMA', yahooSymbol: 'MBMA.JK', name: 'PT Merdeka Battery Materials Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'NCKL': { symbol: 'NCKL', cleanSymbol: 'NCKL', tradingViewSymbol: 'IDX:NCKL', yahooSymbol: 'NCKL.JK', name: 'PT Trimegah Bangun Persada Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'PWON': { symbol: 'PWON', cleanSymbol: 'PWON', tradingViewSymbol: 'IDX:PWON', yahooSymbol: 'PWON.JK', name: 'PT Pakuwon Jati Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'CTRA': { symbol: 'CTRA', cleanSymbol: 'CTRA', tradingViewSymbol: 'IDX:CTRA', yahooSymbol: 'CTRA.JK', name: 'PT Ciputra Development Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'SMRA': { symbol: 'SMRA', cleanSymbol: 'SMRA', tradingViewSymbol: 'IDX:SMRA', yahooSymbol: 'SMRA.JK', name: 'PT Summarecon Agung Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'MYOR': { symbol: 'MYOR', cleanSymbol: 'MYOR', tradingViewSymbol: 'IDX:MYOR', yahooSymbol: 'MYOR.JK', name: 'PT Mayora Indah Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'CMRY': { symbol: 'CMRY', cleanSymbol: 'CMRY', tradingViewSymbol: 'IDX:CMRY', yahooSymbol: 'CMRY.JK', name: 'PT Cisarua Mountain Dairy Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'MAPA': { symbol: 'MAPA', cleanSymbol: 'MAPA', tradingViewSymbol: 'IDX:MAPA', yahooSymbol: 'MAPA.JK', name: 'PT Map Aktif Adiperkasa Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'MAPI': { symbol: 'MAPI', cleanSymbol: 'MAPI', tradingViewSymbol: 'IDX:MAPI', yahooSymbol: 'MAPI.JK', name: 'PT Mitra Adiperkasa Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'BTPS': { symbol: 'BTPS', cleanSymbol: 'BTPS', tradingViewSymbol: 'IDX:BTPS', yahooSymbol: 'BTPS.JK', name: 'PT Bank BTPN Syariah Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'ARTO': { symbol: 'ARTO', cleanSymbol: 'ARTO', tradingViewSymbol: 'IDX:ARTO', yahooSymbol: 'ARTO.JK', name: 'PT Bank Jago Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'CGAS': { symbol: 'CGAS', cleanSymbol: 'CGAS', tradingViewSymbol: 'IDX:CGAS', yahooSymbol: 'CGAS.JK', name: 'PT Citra Nusantara Energi Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'SMGA': { symbol: 'SMGA', cleanSymbol: 'SMGA', tradingViewSymbol: 'IDX:SMGA', yahooSymbol: 'SMGA.JK', name: 'PT Sumber Mineral Global Abadi Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'GRPH': { symbol: 'GRPH', cleanSymbol: 'GRPH', tradingViewSymbol: 'IDX:GRPH', yahooSymbol: 'GRPH.JK', name: 'PT Griptha Putra Persada Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'HYGN': { symbol: 'HYGN', cleanSymbol: 'HYGN', tradingViewSymbol: 'IDX:HYGN', yahooSymbol: 'HYGN.JK', name: 'PT Ecocare Indo Pasifik Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'NICE': { symbol: 'NICE', cleanSymbol: 'NICE', tradingViewSymbol: 'IDX:NICE', yahooSymbol: 'NICE.JK', name: 'PT Adhi Kartiko Pratama Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'ALII': { symbol: 'ALII', cleanSymbol: 'ALII', tradingViewSymbol: 'IDX:ALII', yahooSymbol: 'ALII.JK', name: 'PT Ancara Logistics Indonesia Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'MSJA': { symbol: 'MSJA', cleanSymbol: 'MSJA', tradingViewSymbol: 'IDX:MSJA', yahooSymbol: 'MSJA.JK', name: 'PT Multisrana Agrindo Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'LIVE': { symbol: 'LIVE', cleanSymbol: 'LIVE', tradingViewSymbol: 'IDX:LIVE', yahooSymbol: 'LIVE.JK', name: 'PT Homeco Victoria Makmur Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'NEST': { symbol: 'NEST', cleanSymbol: 'NEST', tradingViewSymbol: 'IDX:NEST', yahooSymbol: 'NEST.JK', name: 'PT Era Media Sejahtera Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'GOLF': { symbol: 'GOLF', cleanSymbol: 'GOLF', tradingViewSymbol: 'IDX:GOLF', yahooSymbol: 'GOLF.JK', name: 'PT Intra GolfLink Resorts Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'SOLA': { symbol: 'SOLA', cleanSymbol: 'SOLA', tradingViewSymbol: 'IDX:SOLA', yahooSymbol: 'SOLA.JK', name: 'PT Xolare Ropa Energy Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'BATR': { symbol: 'BATR', cleanSymbol: 'BATR', tradingViewSymbol: 'IDX:BATR', yahooSymbol: 'BATR.JK', name: 'PT Benteng Anugrah Sejahtera Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'DATA': { symbol: 'DATA', cleanSymbol: 'DATA', tradingViewSymbol: 'IDX:DATA', yahooSymbol: 'DATA.JK', name: 'PT Remala Abadi Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'MKAP': { symbol: 'MKAP', cleanSymbol: 'MKAP', tradingViewSymbol: 'IDX:MKAP', yahooSymbol: 'MKAP.JK', name: 'PT Multikarya Asia Pasifik Raya Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'MHKI': { symbol: 'MHKI', cleanSymbol: 'MHKI', tradingViewSymbol: 'IDX:MHKI', yahooSymbol: 'MHKI.JK', name: 'PT Multi Hanna Kreasindo Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'ERAL': { symbol: 'ERAL', cleanSymbol: 'ERAL', tradingViewSymbol: 'IDX:ERAL', yahooSymbol: 'ERAL.JK', name: 'PT Sinar Eka Selaras Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'HUMI': { symbol: 'HUMI', cleanSymbol: 'HUMI', tradingViewSymbol: 'IDX:HUMI', yahooSymbol: 'HUMI.JK', name: 'PT Humpuss Maritim Internasional Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'WIFI': { symbol: 'WIFI', cleanSymbol: 'WIFI', tradingViewSymbol: 'IDX:WIFI', yahooSymbol: 'WIFI.JK', name: 'PT Solusi Sinergi Digital Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'SUNI': { symbol: 'SUNI', cleanSymbol: 'SUNI', tradingViewSymbol: 'IDX:SUNI', yahooSymbol: 'SUNI.JK', name: 'PT Sunindo Pratama Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'FWCT': { symbol: 'FWCT', cleanSymbol: 'FWCT', tradingViewSymbol: 'IDX:FWCT', yahooSymbol: 'FWCT.JK', name: 'PT Wijaya Cahaya Timber Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'VKTR': { symbol: 'VKTR', cleanSymbol: 'VKTR', tradingViewSymbol: 'IDX:VKTR', yahooSymbol: 'VKTR.JK', name: 'PT VKTR Teknologi Mobilitas Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'NANO': { symbol: 'NANO', cleanSymbol: 'NANO', tradingViewSymbol: 'IDX:NANO', yahooSymbol: 'NANO.JK', name: 'PT Nanotech Indonesia Global Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'HAIS': { symbol: 'HAIS', cleanSymbol: 'HAIS', tradingViewSymbol: 'IDX:HAIS', yahooSymbol: 'HAIS.JK', name: 'PT Hasnur Internasional Shipping Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'BSBK': { symbol: 'BSBK', cleanSymbol: 'BSBK', tradingViewSymbol: 'IDX:BSBK', yahooSymbol: 'BSBK.JK', name: 'PT Wulandari Bangun Laksana Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'BELI': { symbol: 'BELI', cleanSymbol: 'BELI', tradingViewSymbol: 'IDX:BELI', yahooSymbol: 'BELI.JK', name: 'PT Global Digital Niaga Tbk. (Blibli)', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'AUTO': { symbol: 'AUTO', cleanSymbol: 'AUTO', tradingViewSymbol: 'IDX:AUTO', yahooSymbol: 'AUTO.JK', name: 'PT Astra Otoparts Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'PTRO': { symbol: 'PTRO', cleanSymbol: 'PTRO', tradingViewSymbol: 'IDX:PTRO', yahooSymbol: 'PTRO.JK', name: 'PT Petrosea Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'SOCI': { symbol: 'SOCI', cleanSymbol: 'SOCI', tradingViewSymbol: 'IDX:SOCI', yahooSymbol: 'SOCI.JK', name: 'PT Soechi Lines Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'BAIK': { symbol: 'BAIK', cleanSymbol: 'BAIK', tradingViewSymbol: 'IDX:BAIK', yahooSymbol: 'BAIK.JK', name: 'PT Sentra Food Indonesia Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'AREA': { symbol: 'AREA', cleanSymbol: 'AREA', tradingViewSymbol: 'IDX:AREA', yahooSymbol: 'AREA.JK', name: 'PT Area Real Estate Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'PLAN': { symbol: 'PLAN', cleanSymbol: 'PLAN', tradingViewSymbol: 'IDX:PLAN', yahooSymbol: 'PLAN.JK', name: 'PT Planet Properindo Jaya Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'HADE': { symbol: 'HADE', cleanSymbol: 'HADE', tradingViewSymbol: 'IDX:HADE', yahooSymbol: 'HADE.JK', name: 'PT Himalaya Energi Perkasa Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'LRNA': { symbol: 'LRNA', cleanSymbol: 'LRNA', tradingViewSymbol: 'IDX:LRNA', yahooSymbol: 'LRNA.JK', name: 'PT Eka Sari Lorena Transport Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'TNCA': { symbol: 'TNCA', cleanSymbol: 'TNCA', tradingViewSymbol: 'IDX:TNCA', yahooSymbol: 'TNCA.JK', name: 'PT Trimuda Nuansa Citra Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'IKAN': { symbol: 'IKAN', cleanSymbol: 'IKAN', tradingViewSymbol: 'IDX:IKAN', yahooSymbol: 'IKAN.JK', name: 'PT Era Mandiri Cemerlang Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'LUCK': { symbol: 'LUCK', cleanSymbol: 'LUCK', tradingViewSymbol: 'IDX:LUCK', yahooSymbol: 'LUCK.JK', name: 'PT Sentral Mitra Informatika Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'MIRA': { symbol: 'MIRA', cleanSymbol: 'MIRA', tradingViewSymbol: 'IDX:MIRA', yahooSymbol: 'MIRA.JK', name: 'PT Mitra International Resources Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },
  'MPOW': { symbol: 'MPOW', cleanSymbol: 'MPOW', tradingViewSymbol: 'IDX:MPOW', yahooSymbol: 'MPOW.JK', name: 'PT Megapower Makmur Tbk.', market: 'IDX', marketName: 'Bursa Efek Indonesia (IDX)', currency: 'IDR', currencySymbol: 'Rp' },

  // --- SGX (Singapore Exchange) ---
  'DBS': { symbol: 'DBS', cleanSymbol: 'DBS', tradingViewSymbol: 'SGX:D05', yahooSymbol: 'D05.SI', name: 'DBS Group Holdings Ltd', market: 'SGX', marketName: 'Singapore Exchange (SGX)', currency: 'SGD', currencySymbol: 'S$' },
  'UOB': { symbol: 'UOB', cleanSymbol: 'UOB', tradingViewSymbol: 'SGX:U11', yahooSymbol: 'U11.SI', name: 'United Overseas Bank Ltd', market: 'SGX', marketName: 'Singapore Exchange (SGX)', currency: 'SGD', currencySymbol: 'S$' },
  'OCBC': { symbol: 'OCBC', cleanSymbol: 'OCBC', tradingViewSymbol: 'SGX:O39', yahooSymbol: 'O39.SI', name: 'Overseas-Chinese Banking Corp Ltd', market: 'SGX', marketName: 'Singapore Exchange (SGX)', currency: 'SGD', currencySymbol: 'S$' },
  'SINGTEL': { symbol: 'SINGTEL', cleanSymbol: 'SINGTEL', tradingViewSymbol: 'SGX:Z74', yahooSymbol: 'Z74.SI', name: 'Singapore Telecommunications Ltd', market: 'SGX', marketName: 'Singapore Exchange (SGX)', currency: 'SGD', currencySymbol: 'S$' },
  'KEPPEL': { symbol: 'KEPPEL', cleanSymbol: 'KEPPEL', tradingViewSymbol: 'SGX:BN4', yahooSymbol: 'BN4.SI', name: 'Keppel Ltd', market: 'SGX', marketName: 'Singapore Exchange (SGX)', currency: 'SGD', currencySymbol: 'S$' },
  'CAPITALAND': { symbol: 'CAPITALAND', cleanSymbol: 'CAPITALAND', tradingViewSymbol: 'SGX:9CI', yahooSymbol: '9CI.SI', name: 'CapitaLand Investment Ltd', market: 'SGX', marketName: 'Singapore Exchange (SGX)', currency: 'SGD', currencySymbol: 'S$' },
  'WILMAR': { symbol: 'WILMAR', cleanSymbol: 'WILMAR', tradingViewSymbol: 'SGX:F34', yahooSymbol: 'F34.SI', name: 'Wilmar International Ltd', market: 'SGX', marketName: 'Singapore Exchange (SGX)', currency: 'SGD', currencySymbol: 'S$' },
  'SIA': { symbol: 'SIA', cleanSymbol: 'SIA', tradingViewSymbol: 'SGX:C6L', yahooSymbol: 'C6L.SI', name: 'Singapore Airlines Ltd', market: 'SGX', marketName: 'Singapore Exchange (SGX)', currency: 'SGD', currencySymbol: 'S$' },
  'COMFORTDELGRO': { symbol: 'COMFORTDELGRO', cleanSymbol: 'COMFORTDELGRO', tradingViewSymbol: 'SGX:C52', yahooSymbol: 'C52.SI', name: 'ComfortDelGro Corp Ltd', market: 'SGX', marketName: 'Singapore Exchange (SGX)', currency: 'SGD', currencySymbol: 'S$' },
  'SATS': { symbol: 'SATS', cleanSymbol: 'SATS', tradingViewSymbol: 'SGX:S58', yahooSymbol: 'S58.SI', name: 'SATS Ltd', market: 'SGX', marketName: 'Singapore Exchange (SGX)', currency: 'SGD', currencySymbol: 'S$' },
  'Y92': { symbol: 'Y92', cleanSymbol: 'Y92', tradingViewSymbol: 'SGX:Y92', yahooSymbol: 'Y92.SI', name: 'Thai Beverage PCL', market: 'SGX', marketName: 'Singapore Exchange (SGX)', currency: 'SGD', currencySymbol: 'S$' },

  // --- US (United States Exchanges - NASDAQ / NYSE) ---
  'AAPL': { symbol: 'AAPL', cleanSymbol: 'AAPL', tradingViewSymbol: 'NASDAQ:AAPL', yahooSymbol: 'AAPL', name: 'Apple Inc.', market: 'US', marketName: 'NASDAQ / US Market', currency: 'USD', currencySymbol: '$' },
  'MSFT': { symbol: 'MSFT', cleanSymbol: 'MSFT', tradingViewSymbol: 'NASDAQ:MSFT', yahooSymbol: 'MSFT', name: 'Microsoft Corporation', market: 'US', marketName: 'NASDAQ / US Market', currency: 'USD', currencySymbol: '$' },
  'GOOGL': { symbol: 'GOOGL', cleanSymbol: 'GOOGL', tradingViewSymbol: 'NASDAQ:GOOGL', yahooSymbol: 'GOOGL', name: 'Alphabet Inc.', market: 'US', marketName: 'NASDAQ / US Market', currency: 'USD', currencySymbol: '$' },
  'AMZN': { symbol: 'AMZN', cleanSymbol: 'AMZN', tradingViewSymbol: 'NASDAQ:AMZN', yahooSymbol: 'AMZN', name: 'Amazon.com, Inc.', market: 'US', marketName: 'NASDAQ / US Market', currency: 'USD', currencySymbol: '$' },
  'NVDA': { symbol: 'NVDA', cleanSymbol: 'NVDA', tradingViewSymbol: 'NASDAQ:NVDA', yahooSymbol: 'NVDA', name: 'NVIDIA Corporation', market: 'US', marketName: 'NASDAQ / US Market', currency: 'USD', currencySymbol: '$' },
  'TSLA': { symbol: 'TSLA', cleanSymbol: 'TSLA', tradingViewSymbol: 'NASDAQ:TSLA', yahooSymbol: 'TSLA', name: 'Tesla, Inc.', market: 'US', marketName: 'NASDAQ / US Market', currency: 'USD', currencySymbol: '$' },
  'META': { symbol: 'META', cleanSymbol: 'META', tradingViewSymbol: 'NASDAQ:META', yahooSymbol: 'META', name: 'Meta Platforms, Inc.', market: 'US', marketName: 'NASDAQ / US Market', currency: 'USD', currencySymbol: '$' },
  'NFLX': { symbol: 'NFLX', cleanSymbol: 'NFLX', tradingViewSymbol: 'NASDAQ:NFLX', yahooSymbol: 'NFLX', name: 'Netflix, Inc.', market: 'US', marketName: 'NASDAQ / US Market', currency: 'USD', currencySymbol: '$' },
  'AMD': { symbol: 'AMD', cleanSymbol: 'AMD', tradingViewSymbol: 'NASDAQ:AMD', yahooSymbol: 'AMD', name: 'Advanced Micro Devices, Inc.', market: 'US', marketName: 'NASDAQ / US Market', currency: 'USD', currencySymbol: '$' },
  'COIN': { symbol: 'COIN', cleanSymbol: 'COIN', tradingViewSymbol: 'NASDAQ:COIN', yahooSymbol: 'COIN', name: 'Coinbase Global, Inc.', market: 'US', marketName: 'NASDAQ / US Market', currency: 'USD', currencySymbol: '$' },
  'PLTR': { symbol: 'PLTR', cleanSymbol: 'PLTR', tradingViewSymbol: 'NASDAQ:PLTR', yahooSymbol: 'PLTR', name: 'Palantir Technologies Inc.', market: 'US', marketName: 'NYSE / US Market', currency: 'USD', currencySymbol: '$' },

  // --- WORLD (Indices & Commodities & Forex & Crypto) ---
  'IHSG': { symbol: 'IHSG', cleanSymbol: 'IHSG', tradingViewSymbol: 'IDX:COMPOSITE', yahooSymbol: '^JKSE', name: 'Jakarta Composite Index (IHSG)', market: 'WORLD', marketName: 'Index Market', currency: 'IDR', currencySymbol: 'Pt' },
  'COMPOSITE': { symbol: 'COMPOSITE', cleanSymbol: 'COMPOSITE', tradingViewSymbol: 'IDX:COMPOSITE', yahooSymbol: '^JKSE', name: 'Jakarta Composite Index (IHSG)', market: 'WORLD', marketName: 'Index Market', currency: 'IDR', currencySymbol: 'Pt' },
  'STI': { symbol: 'STI', cleanSymbol: 'STI', tradingViewSymbol: 'FTSE:STI', yahooSymbol: '^STI', name: 'Straits Times Index (STI)', market: 'WORLD', marketName: 'Index Market', currency: 'SGD', currencySymbol: 'Pt' },
  'SPX': { symbol: 'SPX', cleanSymbol: 'SPX', tradingViewSymbol: 'SP:SPX', yahooSymbol: '^GSPC', name: 'S&P 500 Index (SPX)', market: 'WORLD', marketName: 'Index Market', currency: 'USD', currencySymbol: 'Pt' },
  'DJI': { symbol: 'DJI', cleanSymbol: 'DJI', tradingViewSymbol: 'DJ:DJI', yahooSymbol: '^DJI', name: 'Dow Jones Industrial Average', market: 'WORLD', marketName: 'Index Market', currency: 'USD', currencySymbol: 'Pt' },
  'IXIC': { symbol: 'IXIC', cleanSymbol: 'IXIC', tradingViewSymbol: 'NASDAQ:IXIC', yahooSymbol: '^IXIC', name: 'Nasdaq Composite Index', market: 'WORLD', marketName: 'Index Market', currency: 'USD', currencySymbol: 'Pt' },
  'N225': { symbol: 'N225', cleanSymbol: 'N225', tradingViewSymbol: 'INDEX:N225', yahooSymbol: '^N225', name: 'Nikkei 225 Stock Average', market: 'WORLD', marketName: 'Index Market', currency: 'USD', currencySymbol: 'Pt' },
  'HSI': { symbol: 'HSI', cleanSymbol: 'HSI', tradingViewSymbol: 'HSI:HSI', yahooSymbol: '^HSI', name: 'Hang Seng Index', market: 'WORLD', marketName: 'Index Market', currency: 'USD', currencySymbol: 'Pt' },
  'GOLD': { symbol: 'GOLD', cleanSymbol: 'GOLD', tradingViewSymbol: 'COMEX:GC1!', yahooSymbol: 'GC=F', name: 'Gold Futures (COMEX)', market: 'WORLD', marketName: 'Commodities', currency: 'USD', currencySymbol: '$' },
  'OIL': { symbol: 'OIL', cleanSymbol: 'OIL', tradingViewSymbol: 'NYMEX:CL1!', yahooSymbol: 'CL=F', name: 'Crude Oil WTI Futures', market: 'WORLD', marketName: 'Commodities', currency: 'USD', currencySymbol: '$' },
  'USDIDR': { symbol: 'USDIDR', cleanSymbol: 'USDIDR', tradingViewSymbol: 'FX_IDC:USDIDR', yahooSymbol: 'USDIDR=X', name: 'USD / IDR Foreign Exchange', market: 'FOREX', marketName: 'Foreign Exchange', currency: 'IDR', currencySymbol: 'Rp' },
  'BTCUSD': { symbol: 'BTCUSD', cleanSymbol: 'BTCUSD', tradingViewSymbol: 'BITSTAMP:BTCUSD', yahooSymbol: 'BTC-USD', name: 'Bitcoin / USD Digital Asset', market: 'CRYPTO', marketName: 'Digital Assets', currency: 'USD', currencySymbol: '$' }
};

/**
 * Normalizes any ticker symbol (e.g. "BBCA.JK", "IDX:BBCA", "DBS", "AAPL", "Singtel")
 * to its standard uppercase ticker key.
 */
export function normalizeTicker(sym: string): string {
  if (!sym) return 'BBCA';
  let clean = sym.trim().toUpperCase();
  if (clean.endsWith('.JK')) {
    clean = clean.replace(/\.JK$/, '');
  }
  if (clean.includes(':')) {
    clean = clean.split(':')[1];
  }
  // Alias mappings
  if (clean === 'MHKL' || clean === 'MKLH') return 'MHKI';
  if (clean === 'TCHE' || clean === 'THCE') return 'ERAL';
  if (clean === 'SINGTEL') return 'SINGTEL';
  if (clean === 'KEPPEL') return 'KEPPEL';
  if (clean === 'CAPITALAND') return 'CAPITALAND';
  if (clean === 'COMFORTDELGRO') return 'COMFORTDELGRO';
  if (clean === 'JCI' || clean === 'IHSG COMPOSITE') return 'IHSG';
  if (clean === 'S&P 500 INDEX' || clean === 'S&P 500') return 'SPX';
  if (clean === 'DOW JONES') return 'DJI';
  if (clean === 'NASDAQ COMP') return 'IXIC';
  if (clean === 'NIKKEI 225') return 'N225';
  if (clean === 'HANG SENG') return 'HSI';
  if (clean === 'CRUDE OIL' || clean === 'BRENT') return 'OIL';
  if (clean === 'GOLD FUTURES') return 'GOLD';
  if (clean === 'USD/IDR' || clean === 'USD_IDR') return 'USDIDR';
  if (clean === 'BTC/USD' || clean === 'BTC-USD') return 'BTCUSD';

  return clean;
}

/**
 * Returns full metadata for a given stock symbol.
 * Fallbacks cleanly to sensible defaults if ticker is unmapped.
 */
export function getStockInfo(symbol: string): StockMetaData {
  const normKey = normalizeTicker(symbol);
  if (MASTER_STOCKS_DATABASE[normKey]) {
    return MASTER_STOCKS_DATABASE[normKey];
  }

  // Auto-detect foreign / domestic if unknown
  const clean = normKey;
  const rawUpper = symbol.toUpperCase();
  
  const US_TICKERS = ['AAPL', 'MSFT', 'GOOG', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'NFLX', 'AMD', 'COIN', 'PLTR', 'UBER', 'INTC', 'DIS', 'PYPL', 'HOOD', 'ROKU', 'SPY', 'QQQ', 'DIA', 'IWM'];
  const isUS = US_TICKERS.includes(clean);

  if (rawUpper.startsWith('IDX:') || rawUpper.endsWith('.JK') || (!isUS && /^[A-Z]{4}$/.test(clean))) {
    return {
      symbol: clean,
      cleanSymbol: clean,
      tradingViewSymbol: `IDX:${clean}`,
      yahooSymbol: `${clean}.JK`,
      name: `PT ${clean} Tbk.`,
      market: 'IDX',
      marketName: 'Bursa Efek Indonesia (IDX)',
      currency: 'IDR',
      currencySymbol: 'Rp'
    };
  }

  if (['D05', 'U11', 'O39', 'Z74', 'BN4', '9CI', 'F34', 'C6L', 'C52', 'S58'].includes(clean)) {
    return {
      symbol: clean,
      cleanSymbol: clean,
      tradingViewSymbol: `SGX:${clean}`,
      yahooSymbol: `${clean}.SI`,
      name: `${clean} Holdings Ltd`,
      market: 'SGX',
      marketName: 'Singapore Exchange (SGX)',
      currency: 'SGD',
      currencySymbol: 'S$'
    };
  }

  // Default to US market for standard clean tickers without .JK
  return {
    symbol: clean,
    cleanSymbol: clean,
    tradingViewSymbol: `NASDAQ:${clean}`,
    yahooSymbol: clean,
    name: `${clean} Corp.`,
    market: 'US',
    marketName: 'US Market / Global Exchange',
    currency: 'USD',
    currencySymbol: '$'
  };
}

/**
 * Gets exact TradingView Symbol for any ticker input
 */
export function getTradingViewSymbol(symbol: string): string {
  if (!symbol) return 'IDX:BBCA';
  const trimmed = symbol.trim().toUpperCase();
  if (trimmed.includes(':') && !trimmed.startsWith('IDX:COMPOSITE')) {
    return trimmed;
  }
  const info = getStockInfo(symbol);
  return info.tradingViewSymbol;
}

/**
 * Helper to format price with matching currency symbol based on stock symbol or market
 */
export function formatStockPrice(price: number, symbol?: string, market?: string): string {
  let info = symbol ? getStockInfo(symbol) : null;
  
  let currency = info?.currency;
  if (!currency && market) {
    const mkt = market.toUpperCase();
    if (mkt === 'US' || mkt === 'NASDAQ' || mkt === 'NYSE' || mkt === 'WORLD') currency = 'USD';
    else if (mkt === 'SGX') currency = 'SGD';
    else if (mkt === 'IDX' || mkt === 'BEI') currency = 'IDR';
  }
  if (!currency) currency = 'IDR';

  if (currency === 'USD') {
    return `$ ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (currency === 'SGD') {
    return `S$ ${price.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    const formatted = price < 100 && price % 1 !== 0 ? price.toFixed(2) : Math.round(price).toLocaleString('id-ID');
    return `Rp ${formatted}`;
  }
}
