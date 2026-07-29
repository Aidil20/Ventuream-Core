import React, { useState } from 'react';
import { 
  Building, 
  Briefcase, 
  Target, 
  Users, 
  TrendingUp, 
  Globe, 
  ShieldCheck, 
  Scale, 
  Activity, 
  ArrowUpRight, 
  LineChart, 
  Layers, 
  Compass, 
  CheckCircle2,
  Lock,
  FileSpreadsheet,
  AlertCircle,
  Cpu,
  Bookmark,
  Shield,
  FileCheck,
  Server,
  Network,
  ChevronRight,
  HelpCircle,
  Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import WapAssetManagement from './WapAssetManagement';

type SubTab = 'profile' | 'model' | 'scope' | 'management' | 'wap-inventory';

interface MyCompanyOverviewProps {
  portfolioData?: any[];
}

export const MyCompanyOverview: React.FC<MyCompanyOverviewProps> = ({ portfolioData }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('profile');
  const [activeDivision, setActiveDivision] = useState<number | null>(null);

  // 1. Profil Perusahaan & Integritas Finansial
  const companyProfileData = {
    companyName: "PT Venture Asset Management (VAM)",
    license: "OJK Licensed & Regulated | S-455/PM.21/2022",
    generalDesc: "PT Venture Asset Management (VAM) adalah perusahaan manajemen aset progresif yang mengintegrasikan kecerdasan buatan (Artificial Intelligence) dan infrastruktur cloud global. VAM secara eksklusif hanya mengelola dana internal perusahaan (proprietary trading) serta modal dari mitra strategis melalui skema kerjasama Bisnis-ke-Bisnis (B2B), dan TIDAK mengelola atau menerima dana dari investor individu/perorangan. Dengan memanfaatkan ekosistem TWS Interactive dan Google Cloud, VAM mengelola portofolio investasi melalui analisis data real-time, memastikan setiap keputusan investasi didukung oleh parameter risiko yang terukur dan kepatuhan regulasi global.",
    aumStats: [
      { label: "Assets Under Management", value: "RAHASIA / RESTRYKTED", change: "SECURED", sub: "Akun Mandat Institusional" },
      { label: "Data Latency / Routing Engine", value: "< 15.0 ms", change: "IDX-Node-Colo", sub: "Interactive Brokers & CGS Link" },
      { label: "Sovereign Rating Allocation", value: "S&P, Moody's, Fitch", change: "Standard Global", sub: "Kebijakan Alokasi Aset Internasional" },
      { label: "Compliance Index Score", value: "100.0% Audited", change: "Q1 2026 Audit Ready", sub: "SEC / FINRA Alignment" }
    ],
    financialIntegrity: {
      title: "Pernyataan Integritas Finansial (SOW/YTD)",
      description: "VAM mengonfirmasi bahwa seluruh operasional didukung oleh dokumentasi pendukung yang sah dan transparan:",
      points: [
        {
          key: "Source of Wealth (SOW)",
          desc: "Narasi historis modal yang telah melewati sensor verifikasi internasional untuk pencegahan pencucian uang dan kepatuhan optimal."
        },
        {
          key: "Year-to-Date (YTD)",
          desc: "Laporan keuangan berjalan yang disinkronkan dengan mutasi bank resmi dan bukti transaksi sekuritas global secara real-time."
        },
        {
          key: "Institutional Core Vault",
          desc: "Kapasitas perbendaharaan internal yang likuid didukung dengan protokol keamanan multi-tanda tangan (Multi-Sig Core Vault) untuk mitigasi risiko kolateral."
        }
      ]
    },
    accreditation: [
      {
        category: "Accredited Investor",
        description: "Kapasitas investasi profesional dengan hak akses instrumen eksklusif untuk pendanaan privat.",
        status: "AKTIF / TERVERIFIKASI"
      },
      {
        category: "Eligible Contract Participant (ECP)",
        description: "Kualifikasi tinggi untuk transaksi derivatif Over-The-Counter (OTC) dan kontrak komoditas berjangka.",
        status: "AKTIF / TERVERIFIKASI"
      },
      {
        category: "CFTC/OCR Reporting",
        description: "Kepatuhan pelaporan kepemilikan kontrak berjangka secara otomatis kepada regulator komoditas Amerika Serikat.",
        status: "KOMPLAIN (COMPLIANT)"
      },
      {
        category: "CAT Audit Ready",
        description: "Sistem pelaporan transaksi harian (Consolidated Audit Trail) yang tersinkronisasi langsung dengan SEC.",
        status: "KOMPLAIN (COMPLIANT)"
      }
    ]
  };

  // 2. Model Bisnis & Proteksi Internasional
  const businessModelData = {
    desc: "Arsitektur bisnis PT Venture Asset Management didesain untuk menjamin keselarasan antara kinerja portofolio investor dengan pendapatan perusahaan secara transparan, adil, dan tanpa perantara tradisional.",
    streams: [
      {
        title: "Management Fees (Biaya Pengelolaan)",
        rate: "0.8% - 1.5% Per Annum",
        desc: "Pendapatan berulang berbasis total dana kelolaan (AUM) klien institusi, dihitung harian dan didebit bulanan secara otomatis via ledger internal.",
        strategicPurpose: "Menopang kesinambungan operasional mesin kuantitatif berlatensi rendah dan klaster server kami secara mandiri."
      },
      {
        title: "Incentive / Performance Fees",
        rate: "15% - 20% Outperformance",
        desc: "Biaya komisi surplus yang hanya ditarik menggunakan mekanisme High-Water Mark ketika kami menghasilkan imbal hasil absolut di atas batas acuan.",
        strategicPurpose: "Mensejajarkan kepentingan portofolio klien dengan komitmen para manajer investasi VAM demi pengembalian bebas risiko moral."
      },
      {
        title: "Bespoke Corporate Solutions & Hedging",
        rate: "Project-based Fee structure",
        desc: "Layanan penataan struktur modal korporat, manajemen risiko perbendaharaan, restrukturisasi likuiditas bisnis, serta skema lindung nilai valas.",
        strategicPurpose: "Memperluas kemitraan strategis dengan konglomerat multinasional di luar perdagangan ekuitas konvensional."
      }
    ],
    internationalProtection: {
      title: "Instrumen Perlindungan Internasional",
      subtitle: "VAM beroperasi di bawah payung regulasi hukum global yang melindungi entitas swasta dari intervensi non-hukum secara sepihak:",
      instruments: [
        {
          name: "UNCITRAL",
          desc: "Menjamin legalitas yurisprudensi transaksi digital internasional, kontrak pintar, serta tanda tangan elektronik VAM di seluruh dunia."
        },
        {
          name: "UNCTAD",
          desc: "Melindungi hak kepemilikan VAM atas investasi lintas batas dan penyediaan hak jaminan repatriasi devisa (baik modal awal maupun akumulasi laba)."
        },
        {
          name: "ICSID",
          desc: "Akses forum penyelesaian sengketa independen (International Centre for Settlement of Investment Disputes) jika terjadi interferensi otoritas sepihak."
        }
      ]
    }
  };

  // 3. Lingkup Operasional & Perlindungan Hukum (Matriks Negara)
  const operationalScopeData = {
    desc: "Operasional VAM mencakup manajemen siklus hidup aset secara menyeluruh dan beroperasi dalam ekosistem hukum multinasional yang memastikan keamanan aset klien.",
    pillars: [
      {
        title: "Manajemen Portofolio Strategis",
        desc: "Pengelolaan instrumen ekuitas, sukuk, dan aset derivatif dengan pendekatan tematik pada sektor komoditas utama dan energi terbarukan."
      },
      {
        title: "Infrastruktur Teknologi Finansial",
        desc: "Pengembangan dan pengoperasian sistem Web App (WAP) eksklusif untuk melakukan otomatisasi penuh analisis korelasi pasar dan pelaporan keuangan."
      }
    ],
    legalCompliance: [
      {
        title: "1. Kepatuhan Regulator Amerika Serikat (SEC & FINRA)",
        desc: "Melalui integrasi sistem dengan broker internasional, operasional VAM tunduk pada regulasi Securities and Exchange Commission (SEC) dan Financial Industry Regulatory Authority (FINRA). Hal ini mencakup pelaporan otomatis melalui Consolidated Audit Trail (CAT) dan Customer Account Information System (CAIS) yang menjamin transparansi transaksi tingkat tinggi."
      },
      {
        title: "2. Perlindungan Yurisdiksi Singapura",
        desc: "Penempatan server basis data di region asia-southeast1 (Singapura) dan kemitraan perbankan dengan institusi di Singapura memberikan lapisan perlindungan hukum sesuai dengan standar regulasi finansial regional yang ketat, memastikan keamanan likuiditas dan efisiensi transaksi lintas batas."
      },
      {
        title: "3. Kepatuhan Fiskal Internasional (FATCA)",
        desc: "VAM mematuhi ketentuan Foreign Account Tax Compliance Act (FATCA) melalui validasi formulir W-8BEN-E, memastikan seluruh hak pajak korporasi dalam transaksi pasar modal AS terlindungi secara efisien."
      }
    ],
    matrixTable: [
      {
        country: "Amerika Serikat (USA)",
        status: "Aktif: Stocks, Fractional, Options, Futures",
        protection: "Regulasi SEC/FINRA/CFTC; Perlindungan SIPC; Audit Trail (CAT)."
      },
      {
        country: "Uni Eropa (Jerman, Belanda, Perancis)",
        status: "Aktif: Seluruh Bursa Utama (Euronext, Xetra)",
        protection: "MiFID II (Keamanan Aset Nasabah); Kebebasan Arus Modal UE."
      },
      {
        country: "Swiss",
        status: "Aktif: SIX Swiss Exchange",
        protection: "FinSA/FinLa (Kerahasiaan Perbankan & Perlindungan Aset Institusi)."
      },
      {
        country: "Australia",
        status: "Aktif: ASX Stocks",
        protection: "Pengawasan ASIC; Perjanjian Investasi Bilateral (BIT)."
      },
      {
        country: "Singapura & Hong Kong",
        status: "Aktif: SGX, SEHK (Stock Connect)",
        protection: "Common Law Integrity; Perlindungan Arbitrase Internasional (SIAC)."
      },
      {
        country: "Inggris (UK)",
        status: "Aktif: LSE Stocks",
        protection: "FCA Protection; Standar Transparansi Keuangan London."
      }
    ]
  };

  // 4. Struktur Organisasi & 7 Divisi Korporasi Internal
  const managementData = {
    strategy: "VentureAM berkomitmen penuh untuk melakukan lokalisasi teknologi investasi global di Indonesia. Dengan memanfaatkan analisis kuantitatif bebas bias emosional, kami mengarahkan dana kelolaan ke sektor-sektor yang memiliki daya tahan fundamental tinggi seperti energi berkelanjutan (kemandirian batubara bitumen & substitusinya), optimalisasi properti suburban terintegrasi, serta sektor pembangunan sanitasi & manufaktur domestik.",
    divisions: [
      {
        id: 1,
        name: "1. Divisi Perbendaharaan Global & Manajemen Devisa",
        fungsi: "Mengelola likuiditas lintas batas melalui jalur klaster perbankan internasional terpercaya, konversi valuta asing ke fiat, serta penempatan dana strategis di CIMB Niaga Singapore.",
        tanggungJawab: [
          "Menjamin ketersediaan modal kerja di IBKR.",
          "Melakukan repatriasi terbatas untuk kebutuhan operasional domestik."
        ]
      },
      {
        id: 2,
        name: "2. Divisi Riset Ekonomi & Strategi Investasi",
        fungsi: "Melakukan analisis fundamental dan teknikal pada ekuitas (IHSG & Global), sukuk, serta komoditas (ticker COAL).",
        tanggungJawab: [
          "Menyusun pandangan ekonomi strategis (Think Tank).",
          "Merancang strategi thematic plays di sektor energi dan transisi energi."
        ]
      },
      {
        id: 3,
        name: "3. Divisi Kepatuhan Hukum & Hubungan Internasional",
        fungsi: "Memastikan operasional perusahaan selaras dengan kerangka UNCITRAL dan UNCTAD PBB.",
        tanggungJawab: [
          "Mengelola protokol privasi administratif (Signature Discontinuity).",
          "Koordinasi pembukaan akun broker internasional dan proteksi yurisdiksi."
        ]
      },
      {
        id: 4,
        name: "4. Divisi Akuntansi & Pelaporan Korporasi",
        fungsi: "Menyusun laporan keuangan sesuai standar PSAK, termasuk rekonsiliasi instrumen kuantitatif dan instrumen derivatif pasar global harian.",
        tanggungJawab: [
          "Finalisasi laporan tahunan dan kuartalan (Q1 2026).",
          "Pengelolaan kewajiban pajak lokal minimalis."
        ]
      },
      {
        id: 5,
        name: "5. Divisi Teknologi Informasi & Infrastruktur Pasar",
        fungsi: "Pengembangan website korporat dengan integrasi data live market (TradingView).",
        tanggungJawab: [
          "Keamanan siber untuk infrastruktur teknologi informasi perbankan dan akun perusahaan.",
          "Pemeliharaan perangkat keras (PC & Monitor MSI standar VAM)."
        ]
      },
      {
        id: 6,
        name: "6. Divisi Operasional & Administrasi Umum",
        fungsi: "Pengelola kebutuhan riil operasional di Indonesia.",
        tanggungJawab: [
          "Eksekusi administratif dan koordinasi mitra perbankan (CIMB Niaga).",
          "Pengelolaan aset tetap, sewa kantor, dan payroll."
        ]
      },
      {
        id: 7,
        name: "7. Divisi Global Compliance & Offshore Relations (EU-AU Axis)",
        fungsi: "Duta besar dan pengawas aset di wilayah hukum Eropa dan Australia.",
        tanggungJawab: [
          "Proteksi yurisdiksi terhadap aturan AML (EU) dan FIRB (Australia).",
          "Menjamin strategi Non-Repatriation berjalan sesuai protokol internasional."
        ]
      }
    ]
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner - Highly Stylized institutional terminal design */}
      <div className="bg-[#020407] border border-zinc-800 rounded-[2.5rem] p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-16 bg-[#DFFF00]/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-[#DFFF00]/10 rounded-2xl border border-[#DFFF00]/30">
                <Building className="w-6 h-6 text-[#DFFF00]" />
              </span>
              <div>
                <h1 className="text-2xl font-black text-white uppercase tracking-widest leading-none">VentureAM</h1>
                <p className="text-[10px] text-[#DFFF00] mt-1.5 uppercase font-mono tracking-[0.2em]">PT VENTURE ASSET MANAGEMENT</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-zinc-400 max-w-3xl leading-relaxed">
              Arsipel Kedaulatan Informasi Organisasi. Lembaran audit di bawah memuat ikhtisar profil korporasi VAM Indonesia, 
              kerangka instrumen perlindungan internasional, tata kelola yurisdiksi multinasional, serta pembagian divisi strategis.
            </p>
          </div>

          <div className="bg-zinc-950/60 py-2.5 px-4 rounded-xl border border-zinc-800/80 text-right max-w-xs self-end lg:self-auto flex flex-col justify-center">
            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-[0.2em] leading-none">SECURE REGISTRY LINK</span>
            <div className="flex items-center gap-1.5 justify-end mt-1 text-[#DFFF00] font-mono text-[10px] font-black uppercase leading-tight">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#DFFF00]" /> SYSTEM GATEWAY ACTIVE
            </div>
            <p className="text-[9px] text-zinc-500 mt-1 font-mono leading-none">ID: SEC-FINRA-VAM-2026</p>
          </div>
        </div>

        {/* Warning Announcement Box (Kotak Putih Ramping & Padat) */}
        <div id="warning-box" className="mt-4 p-3 border border-white bg-zinc-950/70 rounded-xl relative z-10 flex items-center gap-2.5 max-w-2xl">
          <AlertCircle className="w-4 h-4 text-white shrink-0 animate-pulse" />
          <p className="text-[10px] sm:text-[11px] font-bold text-white leading-tight tracking-wide">
            VAM TIDAK menerima titipan dana atau kelola dana dari investor individu/perorangan. Hindari dan hati-hati investasi bodong mengatasnamakan perusahaan.
          </p>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex border-t border-zinc-900 mt-8 pt-6 gap-2 overflow-x-auto scroller-hidden">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 flex-shrink-0 ${
              activeSubTab === 'profile'
                ? 'bg-[#DFFF00] text-black shadow-lg font-black'
                : 'bg-zinc-900/40 text-zinc-400 hover:text-white border border-zinc-850'
            }`}
          >
            <Compass className="w-3.5 h-3.5" /> Profil Perusahaan
          </button>
          <button
            onClick={() => setActiveSubTab('model')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 flex-shrink-0 ${
              activeSubTab === 'model'
                ? 'bg-[#DFFF00] text-black shadow-lg font-black'
                : 'bg-zinc-900/40 text-zinc-400 hover:text-white border border-zinc-850'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" /> Model Bisnis
          </button>
          <button
            onClick={() => setActiveSubTab('scope')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 flex-shrink-0 ${
              activeSubTab === 'scope'
                ? 'bg-[#DFFF00] text-black shadow-lg font-black'
                : 'bg-zinc-900/40 text-zinc-400 hover:text-white border border-zinc-850'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Lingkup Operasional
          </button>
          <button
            onClick={() => setActiveSubTab('management')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 flex-shrink-0 ${
              activeSubTab === 'management'
                ? 'bg-[#DFFF00] text-black shadow-lg font-black'
                : 'bg-zinc-900/40 text-zinc-400 hover:text-white border border-zinc-850'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Management & Divisi
          </button>
          <button
            onClick={() => setActiveSubTab('wap-inventory')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 flex-shrink-0 ${
              activeSubTab === 'wap-inventory'
                ? 'bg-[#DFFF00] text-black shadow-lg font-black'
                : 'bg-zinc-900/40 text-zinc-400 hover:text-white border border-zinc-850'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-[#DFFF00]" /> Inventaris Aset WAP
          </button>
        </div>
      </div>

      {/* Main Tab Content with custom animations */}
      <AnimatePresence mode="wait">
        
        {/* PROFILE TAB */}
        {activeSubTab === 'profile' && (
          <motion.div
            key="profile-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {companyProfileData.aumStats.map((stat, i) => (
                <div key={i} className="bg-[#020407] p-6 rounded-2xl border border-zinc-800 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1 opacity-[0.03]">
                    <Building className="w-24 h-24" />
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{stat.label}</span>
                    <h3 className="text-xl font-black text-white mt-1.5 font-sans">{stat.value}</h3>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-zinc-900 pt-3">
                    <span className="text-[9px] text-[#DFFF00] font-mono font-bold uppercase tracking-tight">{stat.change}</span>
                    <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wide">{stat.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Corporate Profile block (Section I) */}
            <div className="bg-[#020407] border border-zinc-800 rounded-[2.5rem] p-8">
              <span className="text-[9px] text-[#DFFF00] font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                <Building className="w-4 h-4" /> I. Profil Perusahaan
              </span>
              <p className="text-sm text-zinc-300 leading-relaxed font-normal">
                {companyProfileData.generalDesc}
              </p>
            </div>

            {/* Financial Integrity (Section IV) */}
            <div className="bg-[#020407] border border-zinc-800 rounded-[2.5rem] p-8">
              <span className="text-[9px] text-[#DFFF00] font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                <FileCheck className="w-4 h-4" /> IV. Pernyataan Integritas Finansial (SOW/YTD)
              </span>
              <p className="text-xs text-zinc-400 mb-6">{companyProfileData.financialIntegrity.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {companyProfileData.financialIntegrity.points.map((pt, i) => (
                  <div key={i} className="p-5 bg-zinc-950/30 rounded-2xl border border-zinc-800 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase block mb-1">0{i+1} CORE PILLARES</span>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">{pt.key}</h4>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mt-4">{pt.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Accreditation & Compliance Status (Section III) */}
            <div className="bg-[#020407] border border-zinc-800 rounded-[2.5rem] p-8">
              <span className="text-[9px] text-[#DFFF00] font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4" /> III. Status Kepatuhan & Akreditasi Institusi
              </span>
              <p className="text-xs text-zinc-400 mb-6 font-normal">Kualifikasi legalitas VAM dalam mengakses klaster infrastruktur dan produk derivatif margin eksklusif internasional:</p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                      <th className="py-3 px-4">Kategori Status / Kualifikasi</th>
                      <th className="py-3 px-4">Deskripsi Kualifikasi Teknis</th>
                      <th className="py-3 px-4 text-right">Status Verifikasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {companyProfileData.accreditation.map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-950/40">
                        <td className="py-3.5 px-4 font-black text-white tracking-wider uppercase">{row.category}</td>
                        <td className="py-3.5 px-4 text-zinc-400 font-normal">{row.description}</td>
                        <td className="py-3.5 px-4 text-right">
                          <span className={`inline-block font-mono text-[9px] font-bold px-2 py-0.5 rounded border ${
                            row.status.includes('AKTIF') 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-[#DFFF00]/10 text-[#DFFF00] border-[#DFFF00]/20'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-center">
              <p className="text-[9px] text-zinc-600 font-semibold tracking-widest">DITERBITKAN OLEH PT VENTURE ASSET MANAGEMENT • DOKUMEN SATU KESATUAN BUNDEL ARSIP AUDIT TAHUNAN</p>
            </div>
          </motion.div>
        )}

        {/* BUSINESS MODEL TAB */}
        {activeSubTab === 'model' && (
          <motion.div
            key="model-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Core Idea */}
            <div className="bg-[#020407] border border-zinc-800 rounded-[2.5rem] p-8">
              <span className="text-[9px] text-[#DFFF00] font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                <Briefcase className="w-4 h-4" /> Revenue Architecture & Alignment
              </span>
              <p className="text-sm text-zinc-300 leading-relaxed font-normal">
                {businessModelData.desc}
              </p>
            </div>

            {/* Revenue Streams Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {businessModelData.streams.map((stream, idx) => (
                <div key={idx} className="bg-[#020407] border border-zinc-800 rounded-[2rem] p-6 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 bg-zinc-950/80 rounded-bl-xl border-l border-b border-zinc-800">
                    <span className="text-[8px] font-mono text-zinc-500 font-black tracking-widest">STREAM M-{idx+1}</span>
                  </div>
                  
                  <div>
                    <span className="text-[10px] text-[#DFFF00] font-black uppercase tracking-widest bg-[#DFFF00]/10 px-2.5 py-1 rounded-lg border border-[#DFFF00]/25 inline-block mb-4">
                      {stream.rate}
                    </span>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider leading-snug mb-3">{stream.title}</h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-normal mb-6">{stream.desc}</p>
                  </div>

                  <div className="border-t border-zinc-900 pt-4 mt-auto">
                    <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Target Tujuan Strategis</span>
                    <p className="text-xs text-zinc-300 font-semibold mt-1 leading-normal">{stream.strategicPurpose}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* International Protection / (Section 2) */}
            <div className="bg-[#020407] border border-zinc-800 rounded-[2.5rem] p-8">
              <span className="text-[9px] text-[#DFFF00] font-black uppercase tracking-widest flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4" /> II. Instrumen Perlindungan Internasional
              </span>
              <p className="text-xs text-zinc-400 mb-6 font-normal">{businessModelData.internationalProtection.subtitle}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {businessModelData.internationalProtection.instruments.map((ins, idx) => (
                  <div key={idx} className="p-5 bg-zinc-950/40 rounded-xl border border-zinc-850 flex gap-4 items-start">
                    <span className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[#DFFF00] font-mono font-black text-xs">
                      {ins.name}
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">{ins.name} Standard Protocol</h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed mt-1.5 font-normal">{ins.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* General competitive edge */}
            <div className="bg-[#020407] border border-zinc-800 rounded-[2.5rem] p-8">
              <span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-2 mb-6">
                <Target className="w-4 h-4 text-[#DFFF00]" /> Mengapa Sistem Kuantitatif VentureAM Unggul
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 bg-zinc-950/40 rounded-xl border border-zinc-800 flex gap-4 items-start">
                  <span className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[#DFFF00] flex-shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Tanpa Konflik Kepentingan</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">Satu-satunya butik manajemen investasi independen di Indonesia tanpa kepemilikan oleh grup bank besar umum.</p>
                  </div>
                </div>
                <div className="p-5 bg-[#020407] rounded-xl border border-zinc-800 flex gap-4 items-start">
                  <span className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[#DFFF00] flex-shrink-0">
                    <Activity className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Akurasi Analitis AI</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">Menggunakan pemrosesan data berbasis klaster AI untuk mendeteksi anomali volume akumulasi bandar secara instan.</p>
                  </div>
                </div>
                <div className="p-5 bg-zinc-950/40 rounded-xl border border-zinc-800 flex gap-4 items-start">
                  <span className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[#DFFF00] flex-shrink-0">
                    <Globe className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Global Liquidity Rails</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">Kemampuan memindahkan likuiditas lintas pasar antarbenua hanya dalam satu sistem terminal mandiri tanpa hambatan.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* OPERATIONAL SCOPE TAB */}
        {activeSubTab === 'scope' && (
          <motion.div
            key="scope-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* II. Lingkup Operasional Bisnis */}
            <div className="bg-[#020407] border border-zinc-800 rounded-[2.5rem] p-8">
              <span className="text-[9px] text-[#DFFF00] font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4" /> II. Lingkup Operasional Bisnis
              </span>
              <p className="text-sm text-zinc-300 leading-relaxed mb-6 font-normal">
                {operationalScopeData.desc}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {operationalScopeData.pillars.map((pillar, idx) => (
                  <div key={idx} className="p-5 bg-zinc-950/40 rounded-2xl border border-zinc-850 flex gap-4 items-start">
                    <span className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-[#DFFF00] font-mono font-bold text-xs">
                      Pillar-0{idx+1}
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">{pillar.title}</h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed mt-2 font-normal">{pillar.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operasional Bisnis Tingkat Internasional & Perlindungan Hukum (Section III) */}
            <div className="bg-[#020407] border border-zinc-800 rounded-[2.5rem] p-8">
              <span className="text-[9px] text-[#DFFF00] font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                <Scale className="w-4 h-4" /> III. Operasional Bisnis Tingkat Internasional & Perlindungan Hukum
              </span>
              
              <div className="space-y-4">
                {operationalScopeData.legalCompliance.map((comp, idx) => (
                  <div key={idx} className="p-5 bg-zinc-950/20 rounded-xl border border-zinc-850">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider mb-2">{comp.title}</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed font-normal">{comp.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 1. MATRIKS IZIN NEGARA & PERLINDUNGAN DOMESTIK */}
            <div className="bg-[#020407] border border-zinc-800 rounded-[2.5rem] p-8">
              <span className="text-[9px] text-[#DFFF00] font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4" /> 1. Matriks Izin Negara & Perlindungan Domestik
              </span>
              <p className="text-xs text-zinc-400 mb-6 font-normal">Status izin transaksi brokerage internasional melalui Interactive Brokers (IBKR) dan payung jaminan regulasi regional:</p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                      <th className="py-3 px-4">Wilayah / Negara</th>
                      <th className="py-3 px-4">Status Izin (IBKR)</th>
                      <th className="py-3 px-4">Mekanisme Perlindungan Domestik</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {operationalScopeData.matrixTable.map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-950/40">
                        <td className="py-3.5 px-4 font-black text-white tracking-wider uppercase">{row.country}</td>
                        <td className="py-3.5 px-4 text-zinc-300 font-medium">
                          <span className="inline-block text-[#DFFF00] bg-[#DFFF00]/5 px-2 py-0.5 rounded border border-[#DFFF00]/10 text-[10px] font-semibold">
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-zinc-400 font-normal">{row.protection}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Infrastructure Gateway Nodes latencies */}
            <div className="bg-[#020407] border border-zinc-800 rounded-[2.5rem] p-8">
              <span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-2 mb-6">
                <Network className="w-4 h-4 text-[#DFFF00]" /> Latensi Pipeline Colocation Gateway Node Terpasang
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-800 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-white uppercase">Jakarta (IDX Colocation Node)</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wide">Active - Primary Core</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider block">Latency</span>
                    <span className="text-xs font-mono font-bold text-[#DFFF00]">1.2 ms</span>
                  </div>
                </div>
                <div className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-800 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-white uppercase">Singapura (SGX Gateway Node)</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wide">Active - Brokerage Rail</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider block">Latency</span>
                    <span className="text-xs font-mono font-bold text-[#DFFF00]">8.4 ms</span>
                  </div>
                </div>
                <div className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-800 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-white uppercase">Chicago (CME Routing Hub)</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wide">Active - CME Hedging</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider block">Latency</span>
                    <span className="text-xs font-mono font-bold text-[#DFFF00]">74.8 ms</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* MANAGEMENT & DIVISI TAB */}
        {activeSubTab === 'management' && (
          <motion.div
            key="management-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Split Commissioners & Directors removed as requested */}

            {/* STRUKTUR DIVISI & TATA KELOLA ORGANISASI (7 Divisi!) */}
            <div className="bg-[#020407] border border-zinc-800 rounded-[2.5rem] p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
                <div>
                  <span className="text-[9px] text-[#DFFF00] font-black uppercase tracking-widest flex items-center gap-2">
                    <Cpu className="w-4 h-4" /> Struktur Divisi & Tata Kelola Organisasi
                  </span>
                  <p className="text-[10px] text-zinc-500 font-mono font-bold mt-1 uppercase tracking-wider">Sangat Rahasia - Dokumen Internal</p>
                </div>
                <span className="text-[8px] font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-805">
                  PROKOL KERAHASIAAN NO. 060/VAM-DIR/INT/V/2026
                </span>
              </div>

              <p className="text-xs text-zinc-400 font-normal leading-relaxed">
                Struktur organisasi fungsional didesain untuk menjamin keamanan siber, kepatuhan fiskal internasional, penelaahan kuantitaf pasar, dan repatrasi bebas hambatan. Silakan klik divisi di bawah untuk melihat rincian fungsi utama dan tanggung jawab:
              </p>

              {/* Interactive Accordion for 7 Divisions */}
              <div className="space-y-3">
                {managementData.divisions.map((div, idx) => {
                  const isOpen = activeDivision === div.id;
                  return (
                    <div 
                      key={div.id} 
                      className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                        isOpen 
                          ? 'bg-zinc-950/40 border-[#DFFF00]/30 shadow-md' 
                          : 'bg-zinc-950/10 border-zinc-850 hover:bg-zinc-950/25 hover:border-zinc-800'
                      }`}
                    >
                      <button
                        onClick={() => setActiveDivision(isOpen ? null : div.id)}
                        className="w-full text-left p-4 flex justify-between items-center"
                      >
                        <span className="text-xs font-black text-white uppercase tracking-wider">{div.name}</span>
                        <ChevronRight className={`w-4 h-4 text-[#DFFF00] transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-zinc-900"
                          >
                            <div className="p-5 space-y-4">
                              {/* Fungsi Utama */}
                              <div className="bg-zinc-900/40 p-3.5 rounded-lg border border-zinc-850">
                                <span className="text-[8px] text-[#DFFF00] font-mono font-bold uppercase tracking-wider">FUNGSI UTAMA:</span>
                                <p className="text-xs text-zinc-300 font-normal mt-1 leading-relaxed">{div.fungsi}</p>
                              </div>

                              {/* Tanggung Jawab */}
                              <div className="space-y-2">
                                <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">TANGGUNG JAWAB:</span>
                                <div className="space-y-1.5 PL-1">
                                  {div.tanggungJawab.map((resp, r_idx) => (
                                    <div key={r_idx} className="flex gap-2 items-start text-xs text-zinc-450 font-normal">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#DFFF00] mt-1.5 flex-shrink-0" />
                                      <p className="leading-normal">{resp}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strategic direction */}
            <div className="bg-[#020407] border border-zinc-800 rounded-[2.5rem] p-8 relative overflow-hidden">
              <span className="text-[9px] text-[#DFFF00] font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                <LineChart className="w-4 h-4" /> Mandat Investasi Negara & Visi Strategis
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed font-normal italic pl-4 border-l-2 border-[#DFFF00]">
                {managementData.strategy}
              </p>
            </div>

          </motion.div>
        )}

        {/* WAP ASSET INVENTORY TAB */}
        {activeSubTab === 'wap-inventory' && (
          <motion.div
            key="wap-inventory"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <WapAssetManagement portfolioData={portfolioData} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
