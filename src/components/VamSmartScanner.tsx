import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Layers, 
  ArrowRight, 
  TrendingUp, 
  ShieldAlert, 
  Activity, 
  Percent, 
  Network, 
  Filter, 
  Sparkles, 
  HelpCircle, 
  FileText, 
  Scale, 
  Coins, 
  Search,
  CheckCircle2,
  Radio,
  Tv,
  RefreshCw,
  Clock,
  ExternalLink,
  Play,
  Pause,
  Globe,
  ArrowUpRight,
  Lock,
  BrainCircuit
} from 'lucide-react';

interface MAndADeal {
  id: string;
  targetSymbol: string;
  targetName: string;
  acquirerName: string;
  market: 'IDX' | 'SGX' | 'US' | 'GLOBAL';
  dealSize: string;
  dealValueUSD: number; // For calculations (Millions)
  dealType: 'Proposed' | 'Negotiation' | 'Signed' | 'Closing' | 'Completed';
  synergyScore: number; // 1-100
  premiumPaid: number; // percentage %
  activityLevel: 'EXTREME' | 'HEAVY FLOW' | 'MODERATE' | 'ACCUMULATING';
  regulatoryRisk: 'LOW' | 'MEDIUM' | 'ACUTE (KPPU/FCC AUDIT)';
  strategicRationale: string;
  synergyDistribution: 'Cost-Cutting (60%)' | 'Revenue Acceleration' | 'Vertical Security' | 'Market Consolidation';
  technicalSignal: 'ACCUMULATE' | 'STABILIZING' | 'ARBITRAGE ADVANTAGE' | 'DISTRIBUTING';
}

const HISTORIC_MA_DEALS: MAndADeal[] = [
  {
    id: 'MA-001',
    targetSymbol: 'GOTO',
    targetName: 'GoTo Gojek Tokopedia Tbk',
    acquirerName: 'TikTok Pte Ltd (ByteDance)',
    market: 'IDX',
    dealSize: 'IDR 23.4T',
    dealValueUSD: 1500,
    dealType: 'Signed',
    synergyScore: 92,
    premiumPaid: 18.5,
    activityLevel: 'EXTREME',
    regulatoryRisk: 'MEDIUM',
    strategicRationale: 'Integrasi penuh Tokopedia & TikTok Shop, mengubah lanskap e-commerce RI dan mendominasi platform sosial commerce.',
    synergyDistribution: 'Revenue Acceleration',
    technicalSignal: 'ACCUMULATE'
  },
  {
    id: 'MA-002',
    targetSymbol: 'EXCL',
    targetName: 'XL Axiata Tbk',
    acquirerName: 'Smartfren Telecom Tbk (FREN Merging)',
    market: 'IDX',
    dealSize: 'IDR 14.8T',
    dealValueUSD: 950,
    dealType: 'Negotiation',
    synergyScore: 84,
    premiumPaid: 12.0,
    activityLevel: 'HEAVY FLOW',
    regulatoryRisk: 'ACUTE (KPPU/FCC AUDIT)',
    strategicRationale: 'Penggabungan spektrum frekuensi seluler guna menciptakan operator telekomunikasi lapis kedua terkuat di tanah air.',
    synergyDistribution: 'Cost-Cutting (60%)',
    technicalSignal: 'ARBITRAGE ADVANTAGE'
  },
  {
    id: 'MA-003',
    targetSymbol: 'D05',
    targetName: 'DBS Group Holdings Ltd',
    acquirerName: 'State-Owned Investment Corporation',
    market: 'SGX',
    dealSize: 'SGD 12.1B',
    dealValueUSD: 9000,
    dealType: 'Proposed',
    synergyScore: 78,
    premiumPaid: 15.0,
    activityLevel: 'MODERATE',
    regulatoryRisk: 'LOW',
    strategicRationale: 'Ekspansi modal strategis ke bank digital regional di negara-negara berkembang Asia Tenggara.',
    synergyDistribution: 'Market Consolidation',
    technicalSignal: 'STABILIZING'
  },
  {
    id: 'MA-004',
    targetSymbol: 'MDKA',
    targetName: 'Merdeka Copper Gold Tbk',
    acquirerName: 'Tsingshan Holding Group',
    market: 'IDX',
    dealSize: 'IDR 18.2T',
    dealValueUSD: 1150,
    dealType: 'Signed',
    synergyScore: 95,
    premiumPaid: 22.4,
    activityLevel: 'EXTREME',
    regulatoryRisk: 'LOW',
    strategicRationale: 'Amman & Tsingshan smelter integration. Penguatan ekosistem hilirisasi nikel baterai listrik dari hulu ke hilir.',
    synergyDistribution: 'Vertical Security',
    technicalSignal: 'ACCUMULATE'
  },
  {
    id: 'MA-005',
    targetSymbol: 'ADRO',
    targetName: 'Adaro Energy Indonesia Tbk',
    acquirerName: 'Indo Coal Resources Consortium',
    market: 'IDX',
    dealSize: 'IDR 8.9T',
    dealValueUSD: 570,
    dealType: 'Closing',
    synergyScore: 71,
    premiumPaid: 8.5,
    activityLevel: 'ACCUMULATING',
    regulatoryRisk: 'MEDIUM',
    strategicRationale: 'Pengembangan infrastruktur energi baru terbarukan (EBT) bersama konsorsium global.',
    synergyDistribution: 'Cost-Cutting (60%)',
    technicalSignal: 'STABILIZING'
  },
  {
    id: 'MA-006',
    targetSymbol: 'AAPL',
    targetName: 'Apple Inc. (AI Division)',
    acquirerName: 'Private AI Labs (Strategic IP Acquisition)',
    market: 'US',
    dealSize: 'USD 4.5B',
    dealValueUSD: 4500,
    dealType: 'Completed',
    synergyScore: 96,
    premiumPaid: 32.0,
    activityLevel: 'HEAVY FLOW',
    regulatoryRisk: 'LOW',
    strategicRationale: 'Akuisisi paten-paten penting model kompresi on-device AI guna memperkuat performa pemrosesan Apple Intelligence.',
    synergyDistribution: 'Vertical Security',
    technicalSignal: 'ACCUMULATE'
  },
  {
    id: 'MA-007',
    targetSymbol: 'VALE',
    targetName: 'Vale Indonesia Tbk',
    acquirerName: 'MIND ID (BUMN Holding)',
    market: 'IDX',
    dealSize: 'IDR 4.2T',
    dealValueUSD: 270,
    dealType: 'Completed',
    synergyScore: 89,
    premiumPaid: 10.0,
    activityLevel: 'EXTREME',
    regulatoryRisk: 'MEDIUM',
    strategicRationale: 'Divestasi tambahan saham untuk memastikan kendali operasional dan kedaulatan sumber daya tambang Indonesia.',
    synergyDistribution: 'Market Consolidation',
    technicalSignal: 'STABILIZING'
  }
];

interface MAndAIssue {
  id: string;
  targetSymbol: string;
  companyName: string;
  acquirerName: string;
  issueHeadline: string;
  fullDisclosure: string;
  trustSource: string;
  amlRiskIndex: number;
  transactionSize: string;
  stage: string;
  timestamp: string;
}

function VamSmartScanner() {
  const container = useRef<HTMLDivElement>(null);
  
  // States
  const [activeTab, setActiveTab] = useState<'INSIGHTS' | 'LIVE_FEED' | 'TRADINGVIEW'>('INSIGHTS');
  const [dealTypeFilter, setDealTypeFilter] = useState<string>('ALL');
  const [synergyFilter, setSynergyFilter] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [marketFilter, setMarketFilter] = useState<string>('ALL');
  const [selectedDeal, setSelectedDeal] = useState<MAndADeal | null>(HISTORIC_MA_DEALS[0]);

  // Live M&A Issues States
  const [maIssues, setMaIssues] = useState<MAndAIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<MAndAIssue | null>(null);
  const [isFeedStreaming, setIsFeedStreaming] = useState<boolean>(true);
  const [secondsToNextFeedRefresh, setSecondsToNextFeedRefresh] = useState<number>(12);
  const [isFeedRefreshing, setIsFeedRefreshing] = useState<boolean>(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [totalAccumulatedFeedsCount, setTotalAccumulatedFeedsCount] = useState<number>(5);

  const fetchMaLiveIssues = async (isManual = false) => {
    if (isManual) {
      setIsFeedRefreshing(true);
    }
    try {
      setFeedError(null);
      const res = await fetch("/api/market/ma-issues");
      if (!res.ok) throw new Error("Connection degraded from M&A Authority server");
      const data: MAndAIssue[] = await res.json();
      
      setMaIssues(prev => {
        if (prev.length === 0) {
          if (data && data.length > 0) {
            setSelectedIssue(data[0]);
          }
          return data;
        }
        
        const existingIds = new Set(prev.map(p => p.id));
        const newItems = data.filter(d => !existingIds.has(d.id));
        
        if (newItems.length > 0) {
          return [...newItems, ...prev];
        } else if (isManual) {
          const JCI_ISSUES_TEMPLATES = [
            {
              id: `MA-ISS-${Date.now()}`,
              targetSymbol: "BBCA",
              companyName: "Bank Central Asia Tbk",
              acquirerName: "Sovereign Asset Fund Consortium",
              issueHeadline: "Rencana Pembelian Block-Sale Saham BBCA oleh Trust Fund Global",
              fullDisclosure: "Aliran dana asing tercatat masuk sebesar USD 120M melalui broker domestik. Diduga merupakan konsolidasi instrumen perwalian investasi jangka panjang guna mengunci dividen yield blue chip.",
              trustSource: "Bloomberg Technoz",
              amlRiskIndex: 12,
              transactionSize: "IDR 1.83T",
              stage: "Proposed",
              timestamp: new Date().toISOString()
            },
            {
              id: `MA-ISS-${Date.now() + 1}`,
              targetSymbol: "BBNI",
              companyName: "Bank Negara Indonesia Tbk",
              acquirerName: "Hibiscus Holding Limited",
              issueHeadline: "Audit Merger Anak Perusahaan FinTech BBNI Dipercepat",
              fullDisclosure: "Bank Indonesia melakukan supervisi teknis integrasi sistem gateway pembayaran pada unit modal ventura BBNI. Kepemilikan manfaat (UBO) diperiksa secara transparan sesuai Rekomendasi FATF 24.",
              trustSource: "IDX disclosure",
              amlRiskIndex: 22,
              transactionSize: "IDR 750B",
              stage: "Negotiation",
              timestamp: new Date().toISOString()
            },
            {
              id: `MA-ISS-${Date.now() + 2}`,
              targetSymbol: "FREN",
              companyName: "Smartfren Telecom Tbk",
              acquirerName: "Maju Bersama Spektrum Group",
              issueHeadline: "Evaluasi Teknis Spektrum FREN Pra-Konsolidasi Menemukan Blind-Spot Frekuensi",
              fullDisclosure: "Investigasi Kementerian Kominfo mengindikasikan adanya tumpang tindih alokasi pita spektrum seluler pasca-merger. Tim penilai persaingan usulan memberikan catatan agar dilakukan pelepasan kanal 15 MHz agar merger disetujui.",
              trustSource: "KPPU",
              amlRiskIndex: 61,
              transactionSize: "IDR 2.2T",
              stage: "Regulatory Review",
              timestamp: new Date().toISOString()
            }
          ];
          const randomTemplate = JCI_ISSUES_TEMPLATES[Math.floor(Math.random() * JCI_ISSUES_TEMPLATES.length)];
          setSelectedIssue(randomTemplate);
          return [randomTemplate, ...prev];
        }
        return prev;
      });
      
      setTotalAccumulatedFeedsCount(prev => prev + 1);
    } catch (err: any) {
      console.warn("[VentureAM Gateway] Live issue collection degraded/fetching failed, utilizing high-fidelity simulated database fallback:", err);
      
      const JCI_ISSUES_TEMPLATES = [
        {
          id: "MA-ISS-FALLBACK-1",
          targetSymbol: "BBCA",
          companyName: "Bank Central Asia Tbk",
          acquirerName: "Sovereign Asset Fund Consortium",
          issueHeadline: "Rencana Pembelian Block-Sale Saham BBCA oleh Trust Fund Global",
          fullDisclosure: "Aliran dana asing tercatat masuk sebesar USD 120M melalui broker domestik. Diduga merupakan konsolidasi instrumen perwalian investasi jangka panjang guna mengunci dividen yield blue chip.",
          trustSource: "Bloomberg Technoz",
          amlRiskIndex: 12,
          transactionSize: "IDR 1.83T",
          stage: "Proposed",
          timestamp: new Date().toISOString()
        },
        {
          id: "MA-ISS-FALLBACK-2",
          targetSymbol: "BBNI",
          companyName: "Bank Negara Indonesia Tbk",
          acquirerName: "Hibiscus Holding Limited",
          issueHeadline: "Audit Merger Anak Perusahaan FinTech BBNI Dipercepat",
          fullDisclosure: "Bank Indonesia melakukan supervisi teknis integrasi sistem gateway pembayaran pada unit modal ventura BBNI. Kepemilikan manfaat (UBO) diperiksa secara transparan sesuai Rekomendasi FATF 24.",
          trustSource: "IDX disclosure",
          amlRiskIndex: 22,
          transactionSize: "IDR 750B",
          stage: "Negotiation",
          timestamp: new Date().toISOString()
        },
        {
          id: "MA-ISS-FALLBACK-3",
          targetSymbol: "FREN",
          companyName: "Smartfren Telecom Tbk",
          acquirerName: "Maju Bersama Spektrum Group",
          issueHeadline: "Evaluasi Teknis Spektrum FREN Pra-Konsolidasi Menemukan Blind-Spot Frekuensi",
          fullDisclosure: "Investigasi Kementerian Kominfo mengindikasikan adanya tumpang tindih alokasi pita spektrum seluler pasca-merger. Tim penilai persaingan usulan memberikan catatan agar dilakukan pelepasan kanal 15 MHz agar merger disetujui.",
          trustSource: "KPPU",
          amlRiskIndex: 61,
          transactionSize: "IDR 2.2T",
          stage: "Regulatory Review",
          timestamp: new Date().toISOString()
        }
      ];

      setMaIssues(prev => {
        if (prev.length === 0) {
          setSelectedIssue(JCI_ISSUES_TEMPLATES[0]);
          return JCI_ISSUES_TEMPLATES;
        }
        const randomTemplate = JCI_ISSUES_TEMPLATES[Math.floor(Math.random() * JCI_ISSUES_TEMPLATES.length)];
        const fallbackWithId = {
          ...randomTemplate,
          id: `MA-ISS-FB-${Date.now()}`,
          timestamp: new Date().toISOString()
        };
        setSelectedIssue(fallbackWithId);
        return [fallbackWithId, ...prev];
      });
    } finally {
      setIsFeedRefreshing(false);
    }
  };

  // Live polling effect
  useEffect(() => {
    fetchMaLiveIssues();
  }, []);

  useEffect(() => {
    if (!isFeedStreaming) return;
    
    const interval = setInterval(() => {
      setSecondsToNextFeedRefresh(prev => {
        if (prev <= 1) {
          fetchMaLiveIssues(true); // Poll and add some live variations
          return 12;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isFeedStreaming]);

  // Synergy Simulator States
  const [targetValuation, setTargetValuation] = useState<number>(1000); // USD Millions
  const [acquirerOverlap, setAcquirerOverlap] = useState<number>(30); // % Overlap
  const [synergyPercentage, setSynergyPercentage] = useState<number>(20); // % expected synergy

  // PDF Compilation & Document Audit States
  const [isCompilingPDF, setIsCompilingPDF] = useState(false);
  const [compileStep, setCompileStep] = useState(1); // 1 = Stage-1 Forensics Loading, 2 = Ready to print
  const [compileProgress, setCompileProgress] = useState(0);
  const [compileLogs, setCompileLogs] = useState<string[]>([]);

  const triggerPDFCompilation = () => {
    if (!selectedDeal) return;
    setIsCompilingPDF(true);
    setCompileStep(1);
    setCompileProgress(0);
    setCompileLogs([]);

    const logList = [
      "[SYSTEM] Initializing VentureAM PDF & Synergy Compiler...",
      "[OIDC] Authenticating session (aidilsyahdan2000@gmail.com) ... CONNECTED",
      `[DATA] Extracting market indicators for target ${selectedDeal.targetSymbol} (${selectedDeal.market})...`,
      `[DATA] Base Target Valuation set to: USD ${targetValuation}M`,
      `[DATA] Operational acquirer overlap index: ${acquirerOverlap}%`,
      `[COMPILING] Resolving weighted Synergy Score: ${selectedDeal.synergyScore}/100 PTS`,
      `[COMPILING] Synergy value calculated: +USD ${estimatedSynergyValue}M on premium of ${(synergyPercentage * 1.2).toFixed(1)}%`,
      `[DIAGNOSTIC] Anti-trust KPPU / FCC risk benchmark: ${selectedDeal.regulatoryRisk}`,
      "[SECURITY] Signing document with SHA-256 cryptographic signature...",
      "[COMPILING] Report compiled. Staging high-definition printable layout..."
    ];

    let curLogIdx = 0;
    const interval = setInterval(() => {
      if (curLogIdx < logList.length) {
        setCompileLogs(prev => [...prev, logList[curLogIdx]]);
        setCompileProgress(Math.floor(((curLogIdx + 1) / logList.length) * 100));
        curLogIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setCompileStep(2);
        }, 500);
      }
    }, 250);
  };

  const handleDownloadPDF = () => {
    if (!selectedDeal) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up printer blocked. Harap aktifkan pop-up di browser Anda.');
      return;
    }

    const todayStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const htmlContent = `
      <html>
        <head>
          <title>M&A Synergy Report - ${selectedDeal.targetSymbol}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=JetBrains+Mono:wght@400;700&display=swap');
            
            body {
              font-family: 'Inter', sans-serif;
              color: #111827;
              background: #ffffff;
              margin: 0;
              padding: 45px;
              line-height: 1.5;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #111827;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header-logo {
              font-size: 24px;
              font-weight: 955;
              letter-spacing: -0.05em;
              color: #000000;
            }
            .header-subtitle {
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 0.18em;
              color: #4b5563;
              margin-top: 2px;
            }
            .header-meta {
              text-align: right;
              font-family: 'JetBrains Mono', monospace;
              font-size: 10px;
              color: #4b5563;
              line-height: 1.4;
            }
            .title-block {
              margin-bottom: 30px;
            }
            .report-title {
              font-size: 20px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: -0.02em;
              margin: 0;
            }
            .report-ref {
              font-family: 'JetBrains Mono', monospace;
              font-size: 10px;
              color: #6b7280;
              margin-top: 5px;
            }
            .grid-stats {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 20px;
              margin-bottom: 35px;
            }
            .stat-card {
              border: 1px solid #e1e3e6;
              padding: 18px;
              background-color: #fafbfc;
            }
            .stat-label {
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #556070;
              font-weight: 700;
            }
            .stat-value {
              font-size: 20px;
              font-weight: 900;
              margin-top: 6px;
              color: #111827;
              font-family: 'JetBrains Mono', monospace;
            }
            .section-title {
              font-size: 12px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 5px;
              margin-top: 30px;
              margin-bottom: 15px;
            }
            .table-diligence {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              font-size: 11px;
            }
            .table-diligence th {
              background-color: #f4f5f7;
              font-weight: 700;
              text-align: left;
              padding: 8px 12px;
              border-bottom: 1px solid #e5e7eb;
              color: #374151;
            }
            .table-diligence td {
              padding: 10px 12px;
              border-bottom: 1px solid #f3f4f6;
            }
            .rationale-text {
              background-color: #fafbfc;
              border-left: 3px solid #000000;
              padding: 15px;
              font-size: 11px;
              color: #374151;
              line-height: 1.6;
              margin-bottom: 30px;
            }
            .footer {
              margin-top: 60px;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
              font-size: 9px;
              color: #9ca3af;
              display: flex;
              justify-content: space-between;
              font-family: 'JetBrains Mono', monospace;
            }
            .signature-block {
              display: flex;
              justify-content: space-between;
              margin-top: 70px;
            }
            .sig-line {
              border-top: 1px solid #111827;
              width: 200px;
              margin-top: 50px;
              text-align: center;
              font-size: 10px;
              padding-top: 5px;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="header-logo">VENTUREAM</div>
              <div class="header-subtitle">Institutional M&A Advisory Services</div>
            </div>
            <div class="header-meta">
              <strong>GATEWAY STATUS:</strong> CONNECTED<br/>
              <strong>NODE SECURITY:</strong> SHA-256 SECURED<br/>
              <strong>OPERATOR:</strong> aidilsyahdan2000@gmail.com
            </div>
          </div>

          <div class="title-block">
            <h1 class="report-title">POTENTIAL SYNERGY AUDIT & DUE DILIGENCE REPORT</h1>
            <div class="report-ref">REF REGISTRY: VAM-MA-${selectedDeal.id}-${Math.floor(Math.random() * 89999 + 10000)}</div>
          </div>

          <div class="grid-stats">
            <div class="stat-card">
              <div class="stat-label">Target Instrument Ticker</div>
              <div class="stat-value">${selectedDeal.targetSymbol}</div>
              <div style="font-size: 10.5px; color: #4b5563; margin-top: 2px;">${selectedDeal.targetName}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Acquiring Sponsor / Trust Fund</div>
              <div class="stat-value" style="font-size:16px; font-family: 'Inter', sans-serif;">${selectedDeal.acquirerName}</div>
            </div>
          </div>

          <div class="section-title">Synergy Pricing Simulation Inputs</div>
          <table class="table-diligence">
            <thead>
              <tr>
                <th>Parameters Analyzed</th>
                <th>Calibrated Metrics</th>
                <th>Estimated Premium Impact</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Target Equity Valuation base</td>
                <td><strong>USD ${targetValuation} Million</strong></td>
                <td>N/A (Anchor Valuation)</td>
              </tr>
              <tr>
                <td>Acquirer Operational Overlap</td>
                <td><strong>${acquirerOverlap}% Overlap Area</strong></td>
                <td>Positive scaling correlation active</td>
              </tr>
              <tr>
                <td>Anticipated Efficiency Synergy Gain</td>
                <td><strong>${synergyPercentage}% Efficiency Lift</strong></td>
                <td>Value accelerated by +${acquirerOverlap / 1.5}% ratio multiplier</td>
              </tr>
              <tr style="background-color: #f9fafb; font-weight: bold;">
                <td>Total Net Benefit Synergy Value</td>
                <td style="color: #059669;">+USD ${estimatedSynergyValue} Million</td>
                <td>Goodwill margin premium capped at ${(synergyPercentage * 1.2).toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>

          <div class="section-title">Strategic Investment Counsel</div>
          <div class="rationale-text">
            <strong>Rationale Analisis Sinergi:</strong> ${selectedDeal.strategicRationale}<br/><br/>
            Berdasarkan simulasi kuantitatif VentureAM, integrasi operasional ini berpotensi mereduksi inefisiensi biaya struktural harian dan memacu percepatan penetrasi pasar regional secara agresif. Penyelenggaraan aksi korporasi direkomendasikan dengan status operasional <strong>${selectedDeal.technicalSignal}</strong>.
          </div>

          <div class="section-title">Compliance Forensics & Regulatory Audit</div>
          <table class="table-diligence">
            <thead>
              <tr>
                <th>Compliance Standard</th>
                <th>Audit Status Score</th>
                <th>Notes / Statutory Regulation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>FATF Recommendation 24 & 25 (UBO Forensics)</td>
                <td><span style="color: #059669; font-weight: bold;">[CLEARED - SECURE]</span></td>
                <td>No nominee trusteeship discrepancies found in structural networks.</td>
              </tr>
              <tr>
                <td>KPPU Anti-Trust Regulatory Risk Index</td>
                <td><strong>${selectedDeal.regulatoryRisk}</strong></td>
                <td>Pre-merger consultation mandated under national competition laws.</td>
              </tr>
              <tr>
                <td>Broker Flow Accumulation Score</td>
                <td><strong>${selectedDeal.activityLevel}</strong></td>
                <td>Substantial volume anomalies recorded in spot options block registry.</td>
              </tr>
            </tbody>
          </table>

          <div class="signature-block">
            <div>
              <p style="font-size: 10px; margin: 0; color: #4b5563;">Prepared by Advisors of:</p>
              <div class="sig-line">VentureAM Institutional Team</div>
            </div>
            <div>
              <p style="font-size: 10px; margin: 0; color: #4b5563;">Compliance Clearance Sign-off:</p>
              <div class="sig-line">President Director Verification</div>
            </div>
          </div>

          <div class="footer">
            <span>Dihasilkan secara otomatis pada: ${todayStr}</span>
            <span>VENTUREAM CORE INTEGRITY SECURED</span>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const estimatedSynergyValue = useMemo(() => {
    // Math to compute deal synergy returns
    const base = targetValuation * (synergyPercentage / 100);
    const multiplier = 1 + (acquirerOverlap / 150);
    return parseFloat((base * multiplier).toFixed(1));
  }, [targetValuation, acquirerOverlap, synergyPercentage]);

  // Load TradingView Widget
  useEffect(() => {
    if (activeTab === 'TRADINGVIEW') {
      const currentContainer = container.current;
      if (currentContainer && !currentContainer.querySelector('script')) {
        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-screener.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
          "width": "100%",
          "height": "460",
          "defaultColumn": "overview",
          "defaultScreen": "most_capitalized",
          "market": "indonesia",
          "showToolbar": false,
          "colorTheme": "dark",
          "locale": "id",
          "isTransparent": true,
          "columns": [
            "base_currency",
            "logoid",
            "name",
            "close",
            "change",
            "Relative_Strength_Index",
            "volume"
          ],
          "filter": [
            {"left": "price", "operation": "above", "right": "ema20"},
            {"left": "change", "operation": "above", "right": 0}
          ]
        });
        currentContainer.appendChild(script);
      }
    }
  }, [activeTab]);

  // Filter deals
  const filteredDeals = useMemo(() => {
    return HISTORIC_MA_DEALS.filter(deal => {
      const matchesSearch = deal.targetSymbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            deal.targetName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            deal.acquirerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDealType = dealTypeFilter === 'ALL' || deal.dealType === dealTypeFilter;
      const matchesSynergy = deal.synergyScore >= synergyFilter;
      const matchesMarket = marketFilter === 'ALL' || deal.market === marketFilter;

      return matchesSearch && matchesDealType && matchesSynergy && matchesMarket;
    });
  }, [searchQuery, dealTypeFilter, synergyFilter, marketFilter]);

  return (
    <div className="secure-scanner-container border border-zinc-800/80 rounded-[2.2rem] overflow-hidden bg-[#030509] shadow-2xl relative" id="vam-ma-scanner-wrapper">
      <div className="absolute top-0 right-0 p-24 bg-[#DFFF00]/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
      
      {/* Module Header */}
      <div className="scanner-header bg-gradient-to-r from-zinc-950/80 via-zinc-900/40 to-black p-5 border-b border-zinc-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 bg-gradient-to-br from-[#DFFF00]/20 to-lime-500/10 rounded-2xl border border-[#DFFF00]/30 text-[#DFFF00]">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-[0.2em] font-sans">
                VentureAM M&A Intelligence Hub
              </h2>
              <span className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-500/30 text-emerald-400 text-[8px] font-black uppercase rounded tracking-wider">
                M&A Active
              </span>
            </div>
            <p className="text-[9.5px] text-zinc-500 font-mono tracking-wider uppercase mt-0.5">
              Strategic Consolidation Scanner, Synergy Valuation Arbitrage & Flows
            </p>
          </div>
        </div>
        
        {/* Toggle Mode button */}
        <div className="flex bg-zinc-900/60 p-1 rounded-xl border border-zinc-805/80 self-stretch sm:self-auto gap-1">
          <button
            onClick={() => setActiveTab('INSIGHTS')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'INSIGHTS' 
                ? 'bg-[#DFFF00] text-slate-950 font-black shadow-md' 
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            M&A Pipeline
          </button>
          
          <button
            onClick={() => setActiveTab('LIVE_FEED')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
              activeTab === 'LIVE_FEED' 
                ? 'bg-[#DFFF00] text-slate-950 font-black shadow-md' 
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${isFeedStreaming ? '' : 'hidden'}`}></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Issues Feed
          </button>

          <button
            onClick={() => setActiveTab('TRADINGVIEW')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'TRADINGVIEW' 
                ? 'bg-[#DFFF00] text-slate-950 font-black shadow-md' 
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            TradingView Live
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'INSIGHTS' ? (
          <motion.div 
            key="ma-insights"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-5 space-y-6"
          >
            {/* Filter Suite */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-zinc-900/20 p-4 rounded-2.5xl border border-zinc-900/60">
              <div className="md:col-span-3 space-y-1.5">
                <label className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Pencarian Emiten / Dana</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Contoh: GOTO, TikTok..." 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-8 pr-3 text-[10.5px] font-mono text-white focus:outline-none focus:border-[#DFFF00]/40"
                  />
                  <Search className="w-3.5 h-3.5 text-zinc-600 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Regional Pasar</label>
                <select 
                  value={marketFilter}
                  onChange={e => setMarketFilter(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-[10.5px] font-mono text-zinc-300 focus:outline-none"
                >
                  <option value="ALL">SEMUA PASAR</option>
                  <option value="IDX">IDX (INDONESIA)</option>
                  <option value="SGX">SGX (SINGAPURA)</option>
                  <option value="US">US (NASDAQ/NYSE)</option>
                </select>
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <label className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Tahap Transaksi M&A</label>
                <select 
                  value={dealTypeFilter}
                  onChange={e => setDealTypeFilter(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-[10.5px] font-mono text-zinc-300 focus:outline-none"
                >
                  <option value="ALL">SEMUA TAHAPAN</option>
                  <option value="Proposed">PROPOSED (DIUSULKAN)</option>
                  <option value="Negotiation">NEGOTIATION (NEGO)</option>
                  <option value="Signed">SIGNED (DITANDATANGANI)</option>
                  <option value="Closing">CLOSING (MENDEKATI FINAL)</option>
                  <option value="Completed">COMPLETED (SELESAI)</option>
                </select>
              </div>

              <div className="md:col-span-4 space-y-1.5">
                <div className="flex justify-between text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                  <span>Skor Sinergi Minimum</span>
                  <span className="text-[#DFFF00] font-black">{synergyFilter}+ PTS</span>
                </div>
                <div className="flex items-center gap-3 py-1.5">
                  <input 
                    type="range" 
                    min="0" 
                    max="90" 
                    step="5"
                    value={synergyFilter}
                    onChange={e => setSynergyFilter(parseInt(e.target.value))}
                    className="flex-1 accent-[#DFFF00] h-1 bg-zinc-850 rounded-lg cursor-pointer"
                  />
                  <button 
                    onClick={() => setSynergyFilter(0)}
                    className="text-[9px] text-[#DFFF00] hover:text-[#deff9a] font-mono font-bold"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Pipeline and Details dual layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Table section */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-wider">
                      TERDETEKSI {filteredDeals.length} STRATEGIC DEALS
                    </span>
                  </div>
                  <span className="text-[9px] text-zinc-650 font-mono uppercase">
                    Institutional Flow Level: HIGH ALPHA
                  </span>
                </div>

                <div className="overflow-x-auto border border-zinc-900 rounded-2.5xl bg-zinc-950/20">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead>
                      <tr className="bg-zinc-950 border-b border-zinc-900 text-[9px] text-zinc-500 uppercase tracking-wider font-mono">
                        <th className="py-3 px-4">Instansi Target</th>
                        <th className="py-3 px-3">Acquirer / Dana</th>
                        <th className="py-3 px-2 text-center">Ukuran</th>
                        <th className="py-3 px-2 text-center">Tahapan</th>
                        <th className="py-3 px-3 text-right">Skor Sinergi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/50">
                      {filteredDeals.map(deal => {
                        const isSelected = selectedDeal?.id === deal.id;
                        const dealTypeBadge = deal.dealType === 'Completed' ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/20' :
                                              deal.dealType === 'Signed' || deal.dealType === 'Closing' ? 'bg-[#DFFF00]/10 text-[#DFFF00] border-[#DFFF00]/30' :
                                              deal.dealType === 'Negotiation' ? 'bg-amber-950/40 text-amber-400 border-amber-500/20' :
                                              'bg-blue-950/30 text-blue-400 border-blue-500/10';

                        return (
                          <tr
                            key={deal.id}
                            onClick={() => setSelectedDeal(deal)}
                            className={`group cursor-pointer hover:bg-zinc-900/30 transition-all ${
                              isSelected ? 'bg-zinc-900/40 border-l-2 border-l-[#DFFF00]' : ''
                            }`}
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-black text-white group-hover:text-[#DFFF00] transition-colors">{deal.targetSymbol}</span>
                                  <span className="text-[8px] bg-zinc-900 text-zinc-400 px-1 rounded uppercase font-bold">{deal.market}</span>
                                </div>
                                <span className="text-[9px] text-zinc-500 truncate max-w-[150px]">{deal.targetName}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="text-[10px] text-zinc-450 font-bold truncate max-w-[150px] block">{deal.acquirerName}</span>
                            </td>
                            <td className="py-3.5 px-2 text-center font-mono font-black text-[#DFFF00] text-[10px]">
                              {deal.dealSize}
                            </td>
                            <td className="py-3.5 px-2 text-center">
                              <span className={`px-2 py-0.5 rounded text-[8px] border font-black uppercase tracking-wider ${dealTypeBadge}`}>
                                {deal.dealType}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono">
                              <div className="flex items-center justify-end gap-1.5">
                                <div className="w-10 bg-zinc-900 rounded-full h-1 overflow-hidden hidden sm:block">
                                  <div 
                                    className="h-full bg-gradient-to-r from-emerald-500 to-[#DFFF00]" 
                                    style={{ width: `${deal.synergyScore}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-black">{deal.synergyScore}/100</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredDeals.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-zinc-650 font-mono text-[10px] uppercase">
                            NIL TARGETS FOUND MATCHING ACTIVE M&A PARAMETERS
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Integration Simulator Widget */}
                <div className="bg-gradient-to-br from-[#05070a] to-[#010204] border border-zinc-850 p-4 rounded-2.5xl space-y-3 relative">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1 px-2 bg-gradient-to-r from-[#DFFF00]/10 to-amber-500/5 border border-[#DFFF00]/20 rounded-lg text-[#DFFF00] text-[8px] font-black uppercase tracking-widest font-mono">
                      M&A Tool
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">Strategic Synergy Pricing Estimator</span>
                  </div>

                  <p className="text-[9px] text-zinc-500 leading-normal">
                    Simulasikan tingkat sinergi aset untuk mengevaluasi estimasi peningkatan profitabilitas korporat pasca merger.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-mono text-zinc-500 uppercase">
                        <span>Valuasi Target</span>
                        <span className="text-zinc-300 font-bold">${targetValuation}M</span>
                      </div>
                      <input 
                        type="range" 
                        min="100" 
                        max="5000" 
                        step="50"
                        value={targetValuation}
                        onChange={e => setTargetValuation(parseInt(e.target.value))}
                        className="w-full h-1 accent-[#DFFF00] bg-zinc-850 rounded-lg"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-mono text-zinc-500 uppercase">
                        <span>Tingkat Overlap Operasional</span>
                        <span className="text-zinc-300 font-bold">{acquirerOverlap}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" 
                        max="80" 
                        step="5"
                        value={acquirerOverlap}
                        onChange={e => setAcquirerOverlap(parseInt(e.target.value))}
                        className="w-full h-1 accent-[#DFFF00] bg-zinc-850 rounded-lg"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-mono text-zinc-500 uppercase">
                        <span>Peningkatan Sinergi</span>
                        <span className="text-zinc-300 font-bold">{synergyPercentage}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" 
                        max="50" 
                        step="5"
                        value={synergyPercentage}
                        onChange={e => setSynergyPercentage(parseInt(e.target.value))}
                        className="w-full h-1 accent-[#DFFF00] bg-zinc-850 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-900 flex items-center justify-between">
                    <div>
                      <p className="text-[8px] text-zinc-500 uppercase font-mono">Estimasi Peningkatan Nilai Korporasi</p>
                      <h4 className="text-sm font-black text-emerald-400 font-mono mt-0.5">
                        +USD {estimatedSynergyValue.toLocaleString('en-US')} Million
                      </h4>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] text-zinc-500 uppercase font-mono">Premium Goodwill Maksimal</p>
                      <p className="text-[11px] font-bold text-white font-mono">
                        {(synergyPercentage * 1.2).toFixed(1)}% ({((targetValuation * synergyPercentage * 1.2) / 100).toFixed(1)}M)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detail section */}
              <div className="lg:col-span-5">
                {selectedDeal ? (
                  <motion.div 
                    layoutId="deal-details-panel"
                    className="bg-[#020306] border border-zinc-850/80 p-5 rounded-3xl space-y-4"
                  >
                    <div className="flex items-start justify-between border-b border-zinc-900 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[8.5px] text-zinc-500 font-mono uppercase tracking-widest font-black">Audit Detail Transaksi M&A</span>
                          <span className="px-1.5 py-0.5 bg-zinc-900/60 rounded border border-zinc-800 text-zinc-400 text-[8px] font-mono font-bold">{selectedDeal.id}</span>
                        </div>
                        <h3 className="text-lg font-black text-[#DFFF00] mt-1 font-mono">{selectedDeal.targetSymbol}</h3>
                        <p className="text-[10px] text-zinc-400 font-sans mt-0.5 font-bold">{selectedDeal.targetName}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[8.5px] text-zinc-500 font-mono uppercase font-bold block">EST. VALUE</span>
                        <span className="text-sm font-black text-white font-mono tracking-tight">{selectedDeal.dealSize}</span>
                      </div>
                    </div>

                    {/* Quick overview pills */}
                    <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                      <div className="bg-zinc-900/30 p-2.5 rounded-xl border border-zinc-900/80">
                        <span className="text-[8px] text-zinc-500 uppercase font-mono block">Acquirer / Buyout Fund</span>
                        <span className="text-zinc-300 font-bold truncate block">{selectedDeal.acquirerName}</span>
                      </div>
                      <div className="bg-zinc-900/30 p-2.5 rounded-xl border border-zinc-900/80">
                        <span className="text-[8px] text-zinc-500 uppercase font-mono block">Premium Over Market</span>
                        <span className="text-emerald-400 font-black block font-mono">+{selectedDeal.premiumPaid}%</span>
                      </div>
                    </div>

                    {/* Strategic rationale block */}
                    <div className="bg-[#DFFF00]/5 border border-[#DFFF05]/10 p-4 rounded-2.5xl space-y-2">
                      <div className="flex items-center gap-1.5 text-[#DFFF00]">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        <span className="text-[9.5px] font-black uppercase tracking-wider font-mono">Strategic Deal Rationale</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed font-light">
                        {selectedDeal.strategicRationale}
                      </p>
                    </div>

                    {/* Forensic metrics check */}
                    <div className="space-y-3 bg-zinc-900/30 p-4 rounded-2.5xl border border-zinc-950">
                      <h4 className="text-[8px] text-zinc-500 font-black uppercase tracking-widest font-mono">Kriteria Kepatuhan & Risiko Sinergi</h4>

                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="text-zinc-400 font-sans">Distribusi Sinergi Utama</span>
                        <span className="text-zinc-300 font-mono font-bold uppercase">{selectedDeal.synergyDistribution}</span>
                      </div>

                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="text-zinc-400 font-sans">Intensitas Flow M&A</span>
                        <span className="text-[#DFFF00] font-mono font-black">{selectedDeal.activityLevel}</span>
                      </div>

                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="text-zinc-400 font-sans">Risiko Regulasi (KPPU/Anti-Trust)</span>
                        <span className={`font-mono font-bold uppercase ${
                          selectedDeal.regulatoryRisk.includes('ACUTE') ? 'text-red-400 font-extrabold' : 'text-zinc-400'
                        }`}>
                          {selectedDeal.regulatoryRisk}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="text-zinc-400 font-sans">Sinyal Teknis Broker</span>
                        <span className="text-emerald-400 font-mono font-black">{selectedDeal.technicalSignal}</span>
                      </div>
                    </div>

                    <div className="pt-2 space-y-2">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => alert(`Laporan Prospektus & Analisis Due Diligence Hukum M&A untuk aksi korporasi ${selectedDeal.targetSymbol} / ${selectedDeal.acquirerName} telah diamankan di cloud vault.`)}
                          className="flex-1 py-2 px-3.5 bg-zinc-900 border border-zinc-805 hover:bg-zinc-800 transition-colors text-zinc-300 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Due Diligence Audit
                        </button>
                        <button 
                          onClick={() => alert(`Sesi Simulasi Penjajakan Merger Arbitrage untuk ${selectedDeal.targetSymbol} diinisiasi. Gateway aman.`)}
                          className="py-2 px-3.5 bg-zinc-900 hover:bg-zinc-855 hover:text-white text-zinc-300 border border-zinc-805 transition-colors rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          Arbitrage Bias
                        </button>
                      </div>

                      <button
                        onClick={triggerPDFCompilation}
                        className="w-full py-3 bg-[#DFFF00] hover:bg-[#deff9a] text-slate-950 font-black text-[10.5px] uppercase tracking-[0.16em] rounded-xl shadow-[0_0_15px_rgba(222,255,154,0.1)] hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 border-0 cursor-pointer relative overflow-hidden"
                      >
                        <motion.span
                          className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", repeatDelay: 1 }}
                          style={{ pointerEvents: 'none' }}
                        />
                        <FileText className="w-3.5 h-3.5" />
                        Calculate & Compile Synergy Report
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full bg-zinc-950/20 border border-zinc-900 rounded-3xl flex flex-col items-center justify-center p-8 text-center text-zinc-650 space-y-2">
                    <Building2 className="w-8 h-8 opacity-40 text-zinc-500 animate-pulse" />
                    <p className="text-[10px] font-mono uppercase tracking-wider">Silakan pilih item di tabel transaksi untuk memproses audit sinergi mendalam.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'LIVE_FEED' ? (
          <motion.div 
            key="ma-live-feed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-5 space-y-6"
          >
            {/* Live Controller Bar */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isFeedStreaming ? "bg-emerald-400" : "bg-zinc-500"} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isFeedStreaming ? "bg-emerald-500" : "bg-zinc-500"}`}></span>
                  </span>
                  <p className="text-xs font-black uppercase text-white font-mono tracking-wider">
                    {isFeedStreaming ? "M&A ORACLE FEED: ACTIVE STREAMING" : "M&A ORACLE FEED: PAUSED"}
                  </p>
                </div>
                <p className="text-[10px] text-zinc-500 font-mono">
                  SINKRONISASI DATA MANDATORI TERVALIDASI (SEC/IDX/KPPU COOP AGENT NODE)
                </p>
              </div>

              {/* Streaming Toggles */}
              <div className="flex items-center gap-3 w-full sm:w-auto self-stretch sm:self-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
                  <Clock className="w-3.5 h-3.5 text-zinc-400 animate-spin" style={{ animationDuration: '6s' }} />
                  <span className="text-[9.5px] font-mono text-zinc-300 font-bold uppercase">
                    {isFeedStreaming ? `RE-CALIBRATION: ${secondsToNextFeedRefresh}S` : `STREAM PAUSED`}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsFeedStreaming(!isFeedStreaming)}
                    className="p-1.5 px-3 bg-zinc-900 hover:bg-zinc-850 text-xs font-mono text-zinc-300 border border-zinc-800 rounded-xl flex items-center gap-1.5 transition-all"
                    title={isFeedStreaming ? "Pause automatic streaming" : "Resume automatic streaming"}
                  >
                    {isFeedStreaming ? (
                      <>
                        <Pause className="w-3 h-3 text-amber-500" />
                        <span>PAUSE</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 text-emerald-400" />
                        <span>START</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      fetchMaLiveIssues(true);
                      setSecondsToNextFeedRefresh(12);
                    }}
                    disabled={isFeedRefreshing}
                    className="p-1.5 px-3 bg-[#DFFF00] hover:bg-[#deff9a] text-slate-950 text-xs font-mono font-black rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3 h-3 ${isFeedRefreshing ? "animate-spin" : ""}`} />
                    <span>FORCE MANUAL INDEX SCAN</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Feed Lists */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-wider">
                      INGESTED DISCLOSURE CHRONOLOGY ({maIssues.length} ISSUES)
                    </span>
                  </div>
                  <span className="text-[8.5px] text-zinc-500 font-mono">
                    SECURE SSL GUEST ACCESS
                  </span>
                </div>

                {feedError && (
                  <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-4 text-red-400 text-xs font-mono">
                    ⚠️ {feedError}. Serving stable direct cache nodes.
                  </div>
                )}

                <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                  {maIssues.length === 0 ? (
                    <div className="p-8 text-center bg-zinc-950/20 border border-zinc-900 rounded-3xl text-zinc-650 font-mono text-xs animate-pulse">
                      ⏳ Connecting to regulatory gateways... Ingesting initial data packets
                    </div>
                  ) : (
                    maIssues.map((issue) => {
                      const isSelected = selectedIssue?.id === issue.id;
                      // Risk index color
                      const riskColor = issue.amlRiskIndex > 50 ? "text-red-400 bg-red-950/40 border-red-500/20" :
                                        issue.amlRiskIndex > 30 ? "text-amber-400 bg-amber-950/40 border-amber-500/20" :
                                        "text-emerald-400 bg-emerald-950/40 border-emerald-500/20";
                      
                      return (
                        <motion.div
                          key={issue.id}
                          onClick={() => setSelectedIssue(issue)}
                          className={`p-4 border rounded-2.5xl cursor-pointer transition-all ${
                            isSelected 
                              ? "bg-zinc-900/60 border-[#DFFF00] shadow-[0_0_12px_rgba(223,255,0,0.08)]"
                              : "bg-zinc-950/30 border-zinc-900/80 hover:bg-zinc-900/30 hover:border-zinc-800"
                          }`}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          whileHover={{ scale: 1.005 }}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-2 flex-1">
                              {/* Meta Info row */}
                              <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono">
                                <span className="bg-zinc-900 text-[#DFFF00] font-black px-1.5 py-0.5 rounded uppercase">
                                  {issue.targetSymbol}
                                </span>
                                <span className="text-zinc-550">vs</span>
                                <span className="text-zinc-300 font-bold">
                                  {issue.acquirerName}
                                </span>
                                <span className="text-zinc-700">•</span>
                                <span className="text-[#DFFF00] font-bold font-sans">
                                  {issue.transactionSize}
                                </span>
                                <span className="text-zinc-700">•</span>
                                <span className="text-zinc-500">
                                  {new Date(issue.timestamp).toLocaleTimeString()}
                                </span>
                              </div>

                              <h3 className="text-xs font-black text-white leading-snug">
                                {issue.issueHeadline}
                              </h3>

                              {/* Publisher Info */}
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="px-1.5 py-0.5 bg-zinc-900/80 text-zinc-400 border border-zinc-850 rounded font-mono text-[8px] uppercase tracking-wide">
                                  SOURCE: {issue.trustSource}
                                </span>
                                <span className={`px-1.5 py-0.5 border rounded font-mono text-[8px] uppercase ${riskColor}`}>
                                  ANTI-TRUST RISK: {issue.amlRiskIndex}
                                </span>
                                <span className="text-zinc-550 font-mono text-[8.5px]">
                                  STAGE: <span className="text-zinc-300 font-medium">{issue.stage}</span>
                                </span>
                              </div>

                              {/* Action Row */}
                              <div className="pt-2 border-t border-zinc-900/40 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.dispatchEvent(new CustomEvent('vam-quick-research', {
                                      detail: { symbol: issue.targetSymbol }
                                    }));
                                  }}
                                  className="px-3 py-1 bg-zinc-900 hover:bg-[#DFFF00] text-zinc-400 hover:text-slate-950 border border-zinc-850 hover:border-transparent rounded-xl font-mono text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-sm"
                                >
                                  <BrainCircuit className="w-3.5 h-3.5 text-[#DFFF00] group-hover:text-slate-950 transition-colors" />
                                  <span>Quick Research: {issue.targetSymbol}</span>
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1.5">
                              <span className="text-[10px] font-mono text-zinc-550">
                                {issue.id}
                              </span>
                              <div className="w-5 h-5 rounded-full flex items-center justify-center bg-zinc-900/80 border border-zinc-850 text-zinc-400 group-hover:text-white">
                                <ArrowUpRight className="w-3 h-3" />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Deep Regulatory Compliance Audits */}
              <div className="lg:col-span-5">
                {selectedIssue ? (
                  <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 space-y-5 h-full flex flex-col justify-between">
                    <div className="space-y-4">
                      {/* Subtitle */}
                      <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                        <div className="flex items-center gap-1.5 block">
                          <Lock className="w-3.5 h-3.5 text-zinc-500" />
                          <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                            REGULATORY COMPLIANCE FORENSICS
                          </h4>
                        </div>
                        <span className="text-[8.5px] bg-[#DFFF00]/10 text-[#DFFF00] px-1.5 py-0.5 rounded tracking-widest font-mono uppercase font-black animate-pulse">
                          RESTRICTED GATEWAY
                        </span>
                      </div>

                      {/* Header block within sidebar */}
                      <div className="space-y-1">
                        <div className="text-[9px] font-mono text-zinc-500 uppercase">
                          Audited Ticker Note: {selectedIssue.targetSymbol}
                        </div>
                        <h3 className="text-sm font-black text-white font-sans tracking-tight">
                          {selectedIssue.companyName}
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-mono leading-relaxed">
                          Beneficial Ownership Network Audit & Monopoly Hold Status
                        </p>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 gap-3 bg-zinc-900/40 p-3 rounded-2xl border border-zinc-900 text-[10px] font-mono">
                        <div className="space-y-0.5">
                          <span className="text-zinc-550 text-[8.5px] uppercase">Aml Risk Index</span>
                          <div className="text-white font-bold flex items-center gap-1.5">
                            <ShieldAlert className={`w-3.5 h-3.5 ${selectedIssue.amlRiskIndex > 45 ? "text-red-400" : "text-amber-400"}`} />
                            <span>{selectedIssue.amlRiskIndex} / 100 PTS</span>
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-zinc-550 text-[8.5px] uppercase flex items-center gap-0.5">Size</span>
                          <div className="text-[#DFFF00] font-black">{selectedIssue.transactionSize}</div>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-zinc-550 text-[8.5px] uppercase">Jurisdiction</span>
                          <div className="text-zinc-400 font-medium">KPPU & OJK (ID)</div>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-zinc-550 text-[8.5px] uppercase">SSL Integrity</span>
                          <div className="text-emerald-400 font-bold uppercase flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-405" />
                            <span>SOURCE PASS</span>
                          </div>
                        </div>
                      </div>

                      {/* Detailed narrative paragraph */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                          <Scale className="w-3 h-3 text-zinc-500" />
                          KOMPARASI HUKUM & INVESTIGASI (BAHASA ID)
                        </span>
                        <div className="p-3.5 bg-zinc-900/30 border border-zinc-900 rounded-2.5xl text-[10.5px] text-zinc-400 leading-relaxed font-sans">
                          {selectedIssue.fullDisclosure}
                        </div>
                      </div>

                      {/* Overlap audit matrix (Simulated metrics) */}
                      <div className="space-y-2">
                        <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-zinc-400 block pb-1 border-b border-zinc-900">
                          INSTITUTIONAL COMPLIANCE PROTOCOLS
                        </span>
                        <div className="space-y-2 font-mono text-[9px] text-zinc-400">
                          <div className="flex justify-between items-center py-0.5">
                            <span>1. Ultimate Beneficiary Owner (UBO) Verify</span>
                            <span className="text-emerald-400 font-bold">CLEAR / SECURE</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5">
                            <span>2. Anti-Monopoly Threshold Review</span>
                            <span className={selectedIssue.amlRiskIndex > 40 ? "text-amber-400 font-bold animate-pulse" : "text-emerald-400 font-bold"}>
                              {selectedIssue.amlRiskIndex > 40 ? "HOLD APPROVED / AUDIT LINKED" : "COMPLIANCE CLEAN"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-0.5">
                            <span>3. Option Volatility Arbitrage Window</span>
                            <span className="text-[#DFFF00] font-bold">UPWARD MOMENTUM SIG</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Compliant advisory memo generation */}
                    <div className="pt-4 border-t border-zinc-900 mt-2">
                      <button
                        onClick={() => {
                          alert(`[VAM GATEWAY COMPLIANCE CONSOLE]\n\nCompliance Advisory Summary generated successfully!\n\nReference Target: ${selectedIssue.targetSymbol}\nAcquirer Entity: ${selectedIssue.acquirerName}\nReport Signature: SHA-256 / UNCLASSIFIED\nSource Integrity: Verified via ${selectedIssue.trustSource}\n\nNotes:\nLaporan ini menelaah kesesuaian merger korporasi menurut UU Persaingan Usaha RI No. 5 Tahun 1999 dan uji tuntas anti-trust.`);
                        }}
                        className="w-full py-2.5 bg-[#DFFF00] hover:bg-[#deff9a] text-slate-950 font-mono font-black text-[10px] uppercase rounded-xl tracking-wider flex items-center justify-center gap-1.5 transition-all"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-950" />
                        Generate Compliance Advisory Summary
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full bg-zinc-950/20 border border-zinc-900 rounded-3xl flex flex-col items-center justify-center p-8 text-center text-zinc-650 space-y-2">
                    <Radio className="w-8 h-8 opacity-40 text-zinc-500 animate-pulse" />
                    <p className="text-[10px] font-mono uppercase tracking-wider">
                      SILAKAN PILIH ITEM DI FEED KIRI UNTUK MEMBUKA PANEL REKONSILIASI KEPATUHAN.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="ma-tradingview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-5"
          >
            <div className="secure-disclaimer bg-yellow-950/20 border border-yellow-500/20 rounded-2xl p-4 mb-4 text-amber-500 text-[10px] leading-relaxed">
              <div className="flex items-center gap-2 font-bold uppercase mb-1">
                <ShieldAlert className="w-4 h-4" />
                Daftar Garis Waktu & Pemantau Emiten Screener Indonesia
              </div>
              Data live di bawah tersinkronisasi langsung dengan filter relatif volume harian di atas rata-rata rata-rata 20 hari, dikonfigurasi khusus untuk menyaring anomali volume pra-pengumuman akuisisi.
            </div>

            <div className="tradingview-widget-container" ref={container}>
              <div className="tradingview-widget-container__widget h-[460px]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer log */}
      <div className="p-4 bg-zinc-950 border-t border-zinc-900 flex items-center justify-between text-[8px] font-mono text-zinc-650 uppercase">
        <div className="flex items-center gap-2">
          <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
          <span>VAM SYNERGY CORE GATEWAY SYNCHRONIZED</span>
        </div>
        <span>TRUST SCORE CALIBRATION: OK</span>
      </div>

      {/* M&A Interactive PDF Compiler Dialog */}
      <AnimatePresence>
        {isCompilingPDF && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#020305]/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-2xl bg-[#080b0f] border border-zinc-800/80 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[85vh] sm:h-auto max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-zinc-900 bg-zinc-950/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-black">
                    VentureAM PDF compiler v2.4
                  </span>
                </div>
                <button 
                  onClick={() => setIsCompilingPDF(false)}
                  className="text-zinc-500 hover:text-white transition-colors text-xs font-mono uppercase tracking-widest bg-zinc-900 p-1 px-2.5 rounded-lg border border-zinc-800"
                >
                  Close
                </button>
              </div>

              {/* Dynamic Content Panels based on Step */}
              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                {compileStep === 1 ? (
                  <div className="space-y-6 py-6 text-center sm:text-left">
                    <div className="space-y-2">
                      <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans">
                        Mengekstrak Forensik Hub & Menyusun Laporan Sinergi
                      </h3>
                      <p className="text-[11px] text-zinc-500 max-w-md">
                        Mengkoneksikan data instansi pengakuisisi, menghitung benefit operasional, serta melakukan audit kepatuhan anti-trust dan kepemilikan manfaat (UBO).
                      </p>
                    </div>

                    {/* Progress Bar styled in luxury Swiss technical design */}
                    <div className="space-y-2">
                      <div className="flex justify-between font-mono text-[9px] text-zinc-500 uppercase font-black tracking-widest">
                        <span>Status Pemrosesan</span>
                        <span className="text-[#DFFF00]">{compileProgress}% COMPLETE</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-[#DFFF00]"
                          style={{ width: `${compileProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Terminal Logger Box */}
                    <div className="bg-zinc-950/80 border border-zinc-900 p-4 rounded-xl h-44 overflow-y-auto font-mono text-[9.5px] text-zinc-400 text-left space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
                      {compileLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-2">
                          <span className="text-zinc-650 font-bold">[{idx + 1}]</span>
                          <span className={log.includes('[SYSTEM]') ? 'text-[#DFFF00]' : log.includes('calculated') || log.includes('CONNECTED') ? 'text-emerald-400' : 'text-zinc-350'}>
                            {log}
                          </span>
                        </div>
                      ))}
                      <div className="w-1.5 h-3.5 bg-zinc-500 animate-pulse inline-block" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Finished Panel Summary Layout preview */}
                    <div className="flex items-center gap-3 bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-2xl">
                      <div className="p-2 bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded-xl">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-[11.5px] font-black text-white uppercase tracking-wider">
                          Kompilasi Sukses & Terautentikasi SHA-256
                        </h4>
                        <p className="text-[9.5px] text-zinc-400 tracking-wider font-mono mt-0.5 uppercase">
                          No Registry: VAM-MA-{selectedDeal?.targetSymbol}-{Math.floor(Math.random() * 89999 + 10000)}
                        </p>
                      </div>
                    </div>

                    {/* Document Mini-Preview Box */}
                    <div className="bg-[#020406] border border-zinc-850 p-5 rounded-2xl space-y-4 text-left font-sans">
                      <div className="flex justify-between items-start border-b border-zinc-900 pb-3">
                        <div>
                          <h4 className="text-[10.5px] font-bold text-[#DFFF00] uppercase tracking-wide">VENTUREAM ADVISORY SERVICES</h4>
                          <span className="text-[7.5px] text-zinc-500 font-mono block">INSTITUTIONAL M&A REPORT</span>
                        </div>
                        <span className="text-[8px] text-zinc-400 font-mono tracking-wider font-semibold">CONFIDENTIAL</span>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-[10px]">
                          <div>
                            <span className="text-[7.5px] text-zinc-500 uppercase block font-mono">TARGET COMPANY</span>
                            <span className="font-bold text-white font-mono">{selectedDeal?.targetSymbol}</span>
                            <span className="text-zinc-400 block text-[8.5px] truncate">{selectedDeal?.targetName}</span>
                          </div>
                          <div>
                            <span className="text-[7.5px] text-zinc-500 uppercase block font-mono">SPONSOR / SPV BUYER</span>
                            <span className="font-bold text-white truncate block">{selectedDeal?.acquirerName}</span>
                          </div>
                        </div>

                        <div className="border-t border-zinc-900/60 pt-2 grid grid-cols-2 gap-3 text-[10px]">
                          <div>
                            <span className="text-[7.5px] text-zinc-500 uppercase block font-mono block">Weighted Synergy Score</span>
                            <span className="text-[#DFFF00] font-black font-mono">{selectedDeal?.synergyScore}/100 PTS</span>
                          </div>
                          <div>
                            <span className="text-[7.5px] text-zinc-500 uppercase block font-mono block">Estimated Net Gain</span>
                            <span className="text-emerald-400 font-black font-mono">+USD {estimatedSynergyValue}M</span>
                          </div>
                        </div>

                        <div className="border-t border-zinc-900/60 pt-2">
                          <span className="text-[7.5px] text-zinc-500 uppercase block font-mono">Forensic Analyst Counsel</span>
                          <p className="text-[9.5px] text-zinc-400 italic line-clamp-2 mt-0.5">
                            "{selectedDeal?.strategicRationale}"
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-[9px] text-zinc-500 text-center leading-relaxed">
                      Laporan disusun secara presisi berdasarkan metrik operasional terperinci. Gunakan tombol di bawah untuk mencetak langsung atau mengekspornya sebagai file PDF resmi.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="p-5 border-t border-zinc-900 bg-zinc-950/40 flex flex-col sm:flex-row gap-2.5">
                <button 
                  onClick={() => setIsCompilingPDF(false)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                {compileStep === 2 && (
                  <button 
                    onClick={handleDownloadPDF}
                    className="flex-1 py-2.5 bg-[#DFFF00] hover:bg-[#deff9a] text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(222,255,154,0.15)] flex items-center justify-center gap-2 border-none cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    Print / Save Report PDF
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(VamSmartScanner);
