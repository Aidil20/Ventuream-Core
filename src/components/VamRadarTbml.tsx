import React, { useState, useEffect } from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  FileCheck2, 
  Network, 
  FileSpreadsheet, 
  Clock, 
  Activity, 
  TrendingUp, 
  Building, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Layers, 
  Compass, 
  ArrowRightLeft, 
  ExternalLink,
  ChevronRight,
  Database,
  Coins,
  RefreshCw,
  Plus,
  Terminal,
  Cpu,
  Sliders,
  Globe,
  Key,
  Copy,
  FileText,
  Lock
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

// Strict typing for trade items, banking transactions, and securities deposits
export interface InvoiceData {
  id: string;
  item_id: string;
  commodity_name: string;
  unit_price: number;
  quantity: number;
  manifest_id: string;
  seller_id: string;
  seller_name: string;
  origin: string;
}

export interface ManifestData {
  manifest_id: string;
  item_id: string;
  quantity_registered: number;
  destination_port: string;
  status: 'VERIFIED' | 'REVOKED' | 'UNREGISTERED';
}

export interface BankingLog {
  transaction_id: string;
  invoice_id: string;
  amount: number;
  sender_bank_routing: string;
  recipient_bank_routing: string;
  seller_id: string;
  timestamp: number; // Milliseconds Unix timestamp
}

export interface SIDActivity {
  sid_id: string;
  investor_name: string;
  amount_deposited: number;
  timestamp: number; // Milliseconds Unix timestamp
}

export interface TBMLAlert {
  id: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  type: string;
  description: string;
  referenceId: string;
  timestamp: number;
}

// Global market price baseline
const GLOBAL_PRICE_BASELINE: Record<string, number> = {
  "COAL": 1500000,       // Rp per Metric Ton
  "NICKEL": 250000000,   // Rp per Metric Ton
  "GOLD": 1200000,       // Rp per Gram
  "LUXURY_WATCH": 300000000, // Rp per unit
  "TECH_LICENSE": 50000000   // Rp per License monthly
};

// Recognized marine/air manifests database of ports
const RECOGNIZED_MANIFESTS: Record<string, ManifestData> = {
  "MNF-COAL-1": { manifest_id: "MNF-COAL-1", item_id: "COAL", quantity_registered: 1000, destination_port: "Port of Singapore", status: 'VERIFIED' },
  "MNF-NIC-82": { manifest_id: "MNF-NIC-82", item_id: "NICKEL", quantity_registered: 50, destination_port: "Rotterdam Europort", status: 'VERIFIED' },
  "MNF-GOLD-5": { manifest_id: "MNF-GOLD-5", item_id: "GOLD", quantity_registered: 5000, destination_port: "Zurich International Terminal", status: 'VERIFIED' },
  "MNF-WATCH-10": { manifest_id: "MNF-WATCH-10", item_id: "LUXURY_WATCH", quantity_registered: 200, destination_port: "Tanjung Priok, ID", status: 'VERIFIED' }
};

const SHELL_REGISTRY = ["BVI-TRUST-99", "CAY-CORP-404", "SEY-SHELL-7", "PT_DUMMY_INDONESIA_99"];
const HIGH_RISK_JURISDICTIONS = ["British Virgin Islands", "Cayman Islands", "Seychelles", "Panama", "Bahamas", "Saint Vincent and the Grenadines"];

// Seed initial values for a realistic inspection feed
const SEED_INVOICES: InvoiceData[] = [
  {
    id: "INV-2026-001",
    item_id: "COAL",
    commodity_name: "Thermal Coal (Gar 4200)",
    unit_price: 1530000, // Very minor deviation (normal)
    quantity: 1000,
    manifest_id: "MNF-COAL-1",
    seller_id: "ID-MINING-CO-1",
    seller_name: "Bumi Minerals Tbk.",
    origin: "Indonesia"
  },
  {
    id: "INV-2026-002",
    item_id: "NICKEL",
    commodity_name: "Battery-Grade High Nickel Matte",
    unit_price: 360000000, // Over-invoiced by +44% (Critical price deviation)
    quantity: 50,
    manifest_id: "MNF-NIC-82",
    seller_id: "BVI-TRUST-99", // Registered Shell
    seller_name: "Pacific Horizon Holdco BVI",
    origin: "British Virgin Islands" // High-risk jurisdiction
  },
  {
    id: "INV-2026-003",
    item_id: "LUXURY_WATCH",
    commodity_name: "Premium Swiss Tourbillon Chrono",
    unit_price: 305000000,
    quantity: 120,
    manifest_id: "MNF-WATCH-DUMMY", // Non-existent manifest -> Phantom Document/Ghost Trade
    seller_id: "ID-DISTRIB-WATCH",
    seller_name: "Nusantara Luxury Importers Tbk.",
    origin: "Switzerland"
  },
  {
    id: "INV-2026-004",
    item_id: "GOLD",
    commodity_name: "24K Refined Fine Gold Bars",
    unit_price: 850000, // Under-Invoiced by -29% (Capital flight indicator)
    quantity: 5000,
    manifest_id: "MNF-GOLD-5",
    seller_id: "SEY-SHELL-7", // Shell Company
    seller_name: "Gold Peak Venture Ltd.",
    origin: "Seychelles"
  }
];

const SEED_BANK_LOGS: BankingLog[] = [
  {
    transaction_id: "TX-BANK-101",
    invoice_id: "INV-2026-001",
    amount: 1530000000,
    sender_bank_routing: "HSBC Jakarta (HSBCIDJA)",
    recipient_bank_routing: "BCA Jakarta (CENKIDJA)",
    seller_id: "ID-MINING-CO-1",
    timestamp: Date.now() - 3600 * 1000 * 4 // 4 hours ago
  },
  // INV-2026-002: Bank transaction occurs very close to stock market deposit (temporal layering match)
  {
    transaction_id: "TX-BANK-102",
    invoice_id: "INV-2026-002",
    amount: 18000000000,
    sender_bank_routing: "Cayman Offshore Bank (CAYMBY22)",
    recipient_bank_routing: "Swiss Trust Merchant (SWISCH2Z)",
    seller_id: "BVI-TRUST-99",
    timestamp: Date.now() - 1200 * 1000 // 20 minutes ago
  },
  {
    transaction_id: "TX-BANK-103",
    invoice_id: "INV-2026-003",
    amount: 36600000000,
    sender_bank_routing: "Deutsche Bank AG (DEUTDEDD)",
    recipient_bank_routing: "BCA Menteng Sub-Branch (CENKIDJA)",
    seller_id: "ID-DISTRIB-WATCH",
    timestamp: Date.now() - 3600 * 1000 * 12 // 12 hours ago
  },
  {
    transaction_id: "TX-BANK-104",
    invoice_id: "INV-2026-004",
    amount: 4250000000,
    sender_bank_routing: "Seychelles Offshore Trust Bank (SEYCSY99)",
    recipient_bank_routing: "PT Capital Gate Jakarta (CAPGIDA1)",
    seller_id: "SEY-SHELL-7",
    timestamp: Date.now() - 1700 * 1000 // 28 minutes ago
  }
];

const SEED_SID_ACTIVITIES: SIDActivity[] = [
  {
    sid_id: "SID-BBCA-7493",
    investor_name: "Bumi Minerals Investment Trust",
    amount_deposited: 1500000000,
    timestamp: Date.now() - 3600 * 1000 * 2 // 2 hours ago (safe timing gap: 2hr)
  },
  // Target match for INV-2026-002: Bank Tx is 20 minutes ago. SEC deposit is 10 minutes ago.
  // gap = 10 mins (600 seconds), which matches layering gap < 1 hour.
  {
    sid_id: "SID-BMRI-1023",
    investor_name: "Pacific Horizon Venture CGS-CIMB Account",
    amount_deposited: 17500000000,
    timestamp: Date.now() - 600 * 1000 // 10 minutes ago
  },
  // Target match for INV-2026-004: Bank Tx is 28 minutes ago. SEC deposit is 15 minutes ago.
  // gap = 13 mins (780 seconds), which matches layering gap < 1 hour.
  {
    sid_id: "SID-COMP-8302",
    investor_name: "Gold Peak Capital Gate Acc",
    amount_deposited: 4000000000,
    timestamp: Date.now() - 900 * 1000 // 15 minutes ago
  }
];

export default function VamRadarTbml() {
  const [activeSubTab, setActiveSubTab] = useState<'RADAR' | 'SANDBOX' | 'CORRELATOR' | 'GNNSYSTEM' | 'DEPLOY'>('RADAR');

  // Containerized API Bridge state variables
  const [bridgeTlsOnly, setBridgeTlsOnly] = useState(true);
  const [bridgeLimitRate, setBridgeLimitRate] = useState(60);
  const [bridgeAnonymize, setBridgeAnonymize] = useState(true);
  const [bridgeQuarantineThreshold, setBridgeQuarantineThreshold] = useState(85);
  const [bridgeIsQuarantineEnabled, setBridgeIsQuarantineEnabled] = useState(true);
  const [bridgeToken, setBridgeToken] = useState('vam_live_master_tok_8f3a3d5ea9c67dcde28392fb2c0d87');
  
  // Interactive client API sandbox
  const [apiType, setApiType] = useState<'risk' | 'trace' | 'network'>('risk');
  const [apiLoading, setApiLoading] = useState(false);
  const [apiResponseJson, setApiResponseJson] = useState<any>({
    status: "ready",
    message: "Select an API endpoint trigger on the left to inspect secure payload"
  });
  const [apiResultCode, setApiResultCode] = useState<number>(200);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedInstructions, setCopiedInstructions] = useState(false);
  
  // Custom interactive arguments
  const [playVendorId, setPlayVendorId] = useState('BVI-TRUST-99');
  const [playInvoiceId, setPlayInvoiceId] = useState('INV-2026-002');
  const [playNetworkFilter, setPlayNetworkFilter] = useState('beneficial-owners');

  // Live output terminal feed
  const [terminalFeed, setTerminalFeed] = useState<string[]>([
    "[SYSTEM] Initializing VAM-Radar-API-Bridge container on private subnet...",
    "[SYSTEM] Loading cryptographic engine... TLS 1.3 handshake protocols LOADED.",
    "[SECURITY] Enforcing Request Limiting & Anonymization Layer (Limit: 60req/min).",
    "[SECURITY] Sandbox active. Isolating core GNN tensor models from direct ingress.",
    "[NET] Internal VPN interface bound at 10.144.20.10:8443 securely.",
    "[RULES] Auto-Quarantine Trigger registered inside VAM_System.quarantine() at threshold > 85%.",
    "[OIDC] Verifying OpenID Connect Provider authority configuration... OK.",
    "[OIDC] Access policy: READ-ONLY restricted to metadata forensics.",
    "[BRIDGE] Bridge agent is now listening for secure requests..."
  ]);
  const [invoices, setInvoices] = useState<InvoiceData[]>(SEED_INVOICES);
  const [bankLogs, setBankLogs] = useState<BankingLog[]>(SEED_BANK_LOGS);
  const [sidActivities, setSidActivities] = useState<SIDActivity[]>(SEED_SID_ACTIVITIES);
  const [alerts, setAlerts] = useState<TBMLAlert[]>([]);
  const [auditedLogsCount, setAuditedLogsCount] = useState(128);
  const [recentScanLoading, setRecentScanLoading] = useState(false);

  // Form states for Sandbox Detector
  const [sbItemId, setSbItemId] = useState('COAL');
  const [sbCommodityName, setSbCommodityName] = useState('Premium Ash Metallurgical Coal');
  const [sbUnitPrice, setSbUnitPrice] = useState('2500000'); // baseline is 1,500,000 -> over-invoicing by 66%
  const [sbQuantity, setSbQuantity] = useState('1000');
  const [sbInvoiceId, setSbInvoiceId] = useState('INV-SANDBOX-99');
  const [sbManifestId, setSbManifestId] = useState('MNF-COAL-1');
  const [sbSellerId, setSbSellerId] = useState('BVI-TRUST-99');
  const [sbSellerName, setSbSellerName] = useState('BVI Shell Resource Ltd.');
  const [sbOrigin, setSbOrigin] = useState('British Virgin Islands');
  const [sbSidActivityMinutes, setSbSidActivityMinutes] = useState('15'); // 15 minutes difference
  const [sbSidAmount, setSbSidAmount] = useState('2400000000');

  // Sandbox output report state
  const [sandboxAnalysisReport, setSandboxAnalysisReport] = useState<any>(null);

  // Chronology data for charts
  const [tbmlHistoryIndex, setTbmlHistoryIndex] = useState([
    { hour: '08:00', threatScore: 32 },
    { hour: '10:00', threatScore: 35 },
    { hour: '12:00', threatScore: 48 },
    { hour: '14:00', threatScore: 84 },
    { hour: '16:00', threatScore: 78 },
    { hour: '18:00', threatScore: 81 }
  ]);

  // Core detection algorithm mimicking pseudocode
  const runTBMLCoreScan = (invList: InvoiceData[], bLogs: BankingLog[]) => {
    const freshAlerts: TBMLAlert[] = [];

    invList.forEach(invoice => {
      // 1. Price Verification (Over / Under Invoicing)
      const commodityBaseline = GLOBAL_PRICE_BASELINE[invoice.item_id];
      if (commodityBaseline) {
        const deviationRatio = (invoice.unit_price - commodityBaseline) / commodityBaseline;
        
        if (Math.abs(deviationRatio) > 0.25) {
          const percentVal = Math.round(deviationRatio * 100);
          freshAlerts.push({
            id: `AL-PR-${invoice.id}`,
            severity: "CRITICAL",
            type: deviationRatio > 0 ? "Over-Invoicing Detected" : "Under-Invoicing Detected",
            description: `${deviationRatio > 0 ? 'Over' : 'Under'}-Invoice deviation of ${percentVal}% detected. Unit Price: Rp ${invoice.unit_price.toLocaleString('id-ID')} vs Global Baseline: Rp ${commodityBaseline.toLocaleString('id-ID')}. Possible tax evasion or cash outflow masking.`,
            referenceId: invoice.id,
            timestamp: Date.now() - 50000
          });
        }
      }

      // 2. Document Cross-Check (Phantom Trade Detection)
      const registeredManifest = RECOGNIZED_MANIFESTS[invoice.manifest_id];
      if (!registeredManifest || registeredManifest.item_id !== invoice.item_id) {
        freshAlerts.push({
          id: `AL-DOC-${invoice.id}`,
          severity: "HIGH",
          type: "Ghost Trade/Phantom Document",
          description: `The physical cargo manifest ID '${invoice.manifest_id}' could not be cross-verified on institutional custom docks. Mapped to item-class: ${invoice.item_id}. High risk of ghost trade layering.`,
          referenceId: invoice.id,
          timestamp: Date.now() - 40000
        });
      }

      // 3. Network Analysis (Shell Company Verification)
      const isShell = SHELL_REGISTRY.includes(invoice.seller_id);
      const isHighRiskCountry = HIGH_RISK_JURISDICTIONS.includes(invoice.origin);
      if (isShell || isHighRiskCountry) {
        freshAlerts.push({
          id: `AL-SH-${invoice.id}`,
          severity: "HIGH",
          type: "Shell Entity Exposure",
          description: `Merchant '${invoice.seller_name}' is associated with suspicious offshore structures inside offshore hub '${invoice.origin}'. Threat flags: Offshore Jurisdiction, Ultimate beneficial owner obscuration.`,
          referenceId: invoice.seller_id,
          timestamp: Date.now() - 30000
        });
      }
    });

    setAlerts(freshAlerts);
  };

  useEffect(() => {
    runTBMLCoreScan(invoices, bankLogs);
  }, [invoices, bankLogs]);

  // Handle addition or check in sandbox
  const handleSandboxInspect = (e: React.FormEvent) => {
    e.preventDefault();
    setRecentScanLoading(true);

    setTimeout(() => {
      const priceNum = parseFloat(sbUnitPrice.replace(/,/g, '')) || 0;
      const qtyNum = parseFloat(sbQuantity) || 1;
      const amountBank = priceNum * qtyNum;

      const testInvoice: InvoiceData = {
        id: sbInvoiceId,
        item_id: sbItemId,
        commodity_name: sbCommodityName,
        unit_price: priceNum,
        quantity: qtyNum,
        manifest_id: sbManifestId,
        seller_id: sbSellerId,
        seller_name: sbSellerName,
        origin: sbOrigin
      };

      // RUN ENGINE CHECKS
      const reports: string[] = [];
      let isCritical = false;
      let scoreWeight = 10;

      // Rule 1: Price Deviation
      const commodityBaseline = GLOBAL_PRICE_BASELINE[testInvoice.item_id];
      let deviationRatio = 0;
      let priceAlertTriggered = false;
      if (commodityBaseline) {
        deviationRatio = (testInvoice.unit_price - commodityBaseline) / commodityBaseline;
        if (Math.abs(deviationRatio) > 0.25) {
          priceAlertTriggered = true;
          isCritical = true;
          scoreWeight += 45;
          reports.push(`[TRADING ANOMALY CRITICAL - PRE_ALIGNED]: ${deviationRatio > 0 ? 'OVER' : 'UNDER'}-Invoicing detected! Price diverges by ${Math.round(deviationRatio * 100)}% from sovereign global commodity indices of Rp ${commodityBaseline.toLocaleString('id-ID')}. Units match capital flight pattern.`);
        } else {
          reports.push(`[INDEX STATUS: NOMINAL] Invoice price Rp ${testInvoice.unit_price.toLocaleString('id-ID')} lies within the standard safe variance metric index of ±25%.`);
        }
      }

      // Rule 2: Document Check
      const manifestObj = RECOGNIZED_MANIFESTS[testInvoice.manifest_id];
      let documentAlertTriggered = false;
      if (!manifestObj) {
        documentAlertTriggered = true;
        scoreWeight += 20;
        reports.push(`[SHIPPING INTELLIGENCE WARNING]: Document identification mismatch. Manifest '${testInvoice.manifest_id}' does not resolve inside Harbor Customs database. Flagged as 'Phantom cargo ghost transfer'.`);
      } else if (manifestObj.item_id !== testInvoice.item_id) {
        documentAlertTriggered = true;
        scoreWeight += 15;
        reports.push(`[SHIPPING INTELLIGENCE WARNING]: Declaration mismatch. Manifest specifies item '${manifestObj.item_id}' whereas trading commercial contract declares '${testInvoice.item_id}'. Contraband / shadow substitution likely.`);
      } else {
        reports.push(`[MANIFEST SECURED]: Bills of Lading verified under ID '${testInvoice.manifest_id}' with port registry matched.`);
      }

      // Rule 3: Network Shell Flag
      const isShellCompany = SHELL_REGISTRY.includes(testInvoice.seller_id) || HIGH_RISK_JURISDICTIONS.includes(testInvoice.origin);
      let shellAlertTriggered = false;
      if (isShellCompany) {
        shellAlertTriggered = true;
        scoreWeight += 20;
        reports.push(`[FORENSIC JURISDICTION ALERT]: Origin '${testInvoice.origin}' / Seller ID '${testInvoice.seller_id}' verified inside FIU offshore watchlists.`);
      } else {
        reports.push(`[LEGITIMACY VERIFICATION]: Counterparty corporate node verified within standard trusted domestic nodes.`);
      }

      // Rule 4: Temporal Correlation (Bank Cash -> Capital Market Acc deposit)
      const minutesDiff = parseFloat(sbSidActivityMinutes) || 0;
      const secondsDiff = minutesDiff * 60;
      let matchedLayeringPattern = false;
      if (secondsDiff > 0 && secondsDiff < 3600) {
        matchedLayeringPattern = true;
        scoreWeight += 15;
        reports.push(`[TEMPORAL CORRELATION MATCH]: Bank disbursement matches Single Investor ID (SID) securities deposit with extremely tight delta of ${minutesDiff} minutes (under 60-minute limit). High probability of layering illicit export capital into capital market stocks.`);
      } else {
        reports.push(`[TEMPORAL SEGREGATION OK]: No immediate same-day cross-platform transfer. Delta is ${(secondsDiff / 3600).toFixed(1)} hours.`);
      }

      setSandboxAnalysisReport({
        invoice: testInvoice,
        score: Math.min(100, scoreWeight),
        reports,
        priceAlert: priceAlertTriggered,
        documentAlert: documentAlertTriggered,
        shellAlert: shellAlertTriggered,
        layeringAlert: matchedLayeringPattern,
        threatLevel: scoreWeight > 70 ? "CRITICAL" : scoreWeight > 40 ? "HIGH" : scoreWeight > 20 ? "MEDIUM" : "LOW"
      });

      setAuditedLogsCount(prev => prev + 1);
      setRecentScanLoading(false);
    }, 1200);
  };

  // Preset loaders for sandbox
  const applyPresetSandbox = (presetType: 'SHELL' | 'GHOST' | 'CLEAN') => {
    if (presetType === 'SHELL') {
      setSbItemId('NICKEL');
      setSbCommodityName('Smelted Industrial Nickel Bars');
      setSbUnitPrice('420000000'); // Baseline 250,000,000 (+68%)
      setSbQuantity('60');
      setSbInvoiceId('INV-PRESET-BVI');
      setSbManifestId('MNF-NIC-82');
      setSbSellerId('BVI-TRUST-99');
      setSbSellerName('Vanguard Trust Holding Co.');
      setSbOrigin('British Virgin Islands');
      setSbSidActivityMinutes('18');
      setSbSidAmount('25000000000');
    } else if (presetType === 'GHOST') {
      setSbItemId('GOLD');
      setSbCommodityName('Fictitious Refinery Gold Scrap');
      setSbUnitPrice('1220000');
      setSbQuantity('400');
      setSbInvoiceId('INV-PRESET-GHOST');
      setSbManifestId('MNF-GHOST-FAKE'); // Non-existent
      setSbSellerId('ID-DUMMY');
      setSbSellerName('PT Prima Inti Dagang');
      setSbOrigin('Seychelles');
      setSbSidActivityMinutes('5');
      setSbSidAmount('500000000');
    } else {
      setSbItemId('COAL');
      setSbCommodityName('Sovereign Grade Steam Coal');
      setSbUnitPrice('1510000'); // Baseline 1,500,000
      setSbQuantity('2000');
      setSbInvoiceId('INV-CLEAN-SECURE');
      setSbManifestId('MNF-COAL-1');
      setSbSellerId('ID-MINING-CO-1');
      setSbSellerName('PT Bumi Minerals Tbk.');
      setSbOrigin('Indonesia');
      setSbSidActivityMinutes('180'); // 3 hours ago
      setSbSidAmount('3000000000');
    }
  };

  return (
    <div id="VAM_RADAR_TBML_MODULE_CONTAINER" className="space-y-6">
      
      {/* Module Title & Threat Indicator Panel */}
      <div id="vam-radar-title-bar" className="flex flex-col lg:flex-row items-start lg:items-center justify-between border-b border-zinc-900 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <h1 className="text-xl font-bold text-white tracking-tight uppercase font-mono">VAM Radar TBML Engine</h1>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest leading-none font-sans">
            Trade-Based Money Laundering & Anomalous Securities Settlement Surveillance
          </p>
        </div>

        {/* Global Stats Grid */}
        <div id="vam-radar-core-stats" className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 bg-zinc-950 border border-zinc-900 rounded-xl flex flex-col">
            <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Surveillance Vol</span>
            <span className="text-[11px] font-mono font-bold text-[#DFFF00]">{auditedLogsCount} INVOICES</span>
          </div>
          <div className="px-3 py-1.5 bg-zinc-950 border border-zinc-900 rounded-xl flex flex-col">
            <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Active Watchlist</span>
            <span className="text-[11px] font-mono font-bold text-red-400">{alerts.length} FLAG NODES</span>
          </div>
          <div className="px-3 py-1.5 bg-zinc-950 border border-zinc-900 rounded-xl flex flex-col">
            <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Surveillance Hub</span>
            <span className="text-[11px] font-mono font-bold text-emerald-400">FIU CONNECTED</span>
          </div>
        </div>
      </div>

      {/* Module Sub-Navigation Hub */}
      <div id="vam-radar-sub-nav" className="flex flex-wrap gap-2 border-b border-zinc-900 pb-3">
        <button
          id="tab-tbml-radar" 
          onClick={() => setActiveSubTab('RADAR')}
          className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
            activeSubTab === 'RADAR' 
              ? 'bg-[#deff9a]/10 border-[#deff9a]/20 text-[#deff9a]' 
              : 'bg-zinc-950/40 border-zinc-900/60 text-zinc-500 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Radar Dashboard
        </button>
        <button
          id="tab-tbml-sandbox" 
          onClick={() => setActiveSubTab('SANDBOX')}
          className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
            activeSubTab === 'SANDBOX' 
              ? 'bg-[#deff9a]/10 border-[#deff9a]/20 text-[#deff9a]' 
              : 'bg-zinc-950/40 border-zinc-900/60 text-zinc-500 hover:text-white'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          TBML Anomaly Detector Simulator
        </button>
        <button
          id="tab-tbml-correlator" 
          onClick={() => setActiveSubTab('CORRELATOR')}
          className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
            activeSubTab === 'CORRELATOR' 
              ? 'bg-[#deff9a]/10 border-[#deff9a]/20 text-[#deff9a]' 
              : 'bg-zinc-950/40 border-zinc-900/60 text-zinc-500 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          SID Temporal Correlation
        </button>
        <button
          id="tab-tbml-gnnsystem" 
          onClick={() => setActiveSubTab('GNNSYSTEM')}
          className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
            activeSubTab === 'GNNSYSTEM' 
              ? 'bg-[#deff9a]/10 border-[#deff9a]/20 text-[#deff9a]' 
              : 'bg-zinc-950/40 border-zinc-900/60 text-zinc-500 hover:text-white'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          GNN Beneficial Ownership Graph
        </button>
        <button
          id="tab-tbml-deploy" 
          onClick={() => setActiveSubTab('DEPLOY')}
          className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
            activeSubTab === 'DEPLOY' 
              ? 'bg-[#deff9a]/10 border-[#deff9a]/20 text-[#deff9a]' 
              : 'bg-zinc-950/40 border-zinc-900/60 text-zinc-500 hover:text-white'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          VAM Bridge Deploy
        </button>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: RADAR DASHBOARD */}
        {activeSubTab === 'RADAR' && (
          <motion.div
            key="tbml-radar-dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
            id="tbml-dashboard-view-wrapper"
          >
            {/* Visual Threat Indicators Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Core TBML Vulnerability Monitor Index Gauge */}
              <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-[2rem] p-6 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-5 bg-red-500/5 blur-2xl rounded-full" />
                <div>
                  <span className="text-[7.5px] font-black text-red-400 uppercase tracking-[0.2em] block mb-1">Surveillance Index</span>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider block">TBML VULNERABILITY INDEX</h3>
                </div>
                
                <div className="my-6 flex items-baseline gap-3">
                  <span className="text-4xl font-mono font-black text-white">RED ALERT</span>
                  <span className="text-xs font-mono font-bold text-red-400">INDEX: 84.1 / 100</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] font-mono font-bold text-zinc-500 uppercase">
                    <span>Sovereign Limit: Clean</span>
                    <span>Systemic Threat Trigger</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 via-orange-400 to-red-500 rounded-full" style={{ width: '84.1%' }} />
                  </div>
                  <p className="text-[9px] text-zinc-500 font-sans mt-2 leading-relaxed">
                    Surveillance scans indicate highly anomalous cross-border capital inflows pre-correlated with Single Investor ID (SID) stock market layering. Urgent node tracing advised.
                  </p>
                </div>
              </div>

              {/* Crime Vector Breakdown Area Chart */}
              <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-[2rem] p-6 lg:col-span-2 relative overflow-hidden flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[7.5px] font-black text-zinc-500 uppercase tracking-widest block">Anomaly Progression</span>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider block">Real-time Trade Threat Wave</h3>
                  </div>
                  <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-[8px] font-mono text-[#DFFF00] uppercase tracking-widest rounded-lg">24h monitoring cycle</span>
                </div>

                <div className="w-full h-[120px] my-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={tbmlHistoryIndex} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorThreat" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="hour" stroke="#3f3f46" fontSize={8} fontFamily="JetBrains Mono" />
                      <YAxis stroke="#3f3f46" fontSize={8} fontFamily="JetBrains Mono" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                        itemStyle={{ fontSize: '10px', color: '#f43f5e', fontFamily: 'JetBrains Mono' }}
                        labelStyle={{ fontSize: '8px', color: '#a1a1aa' }}
                      />
                      <Area type="monotone" dataKey="threatScore" stroke="#ef4444" strokeWidth={1.5} fillOpacity={1} fill="url(#colorThreat)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <p className="text-[9px] text-zinc-500 tracking-tight leading-normal">
                  Peak anomaly vectors shifted at 14:00 coinciding with British Virgin Islands smelter invoice declarations and subsequent IDR payouts.
                </p>
              </div>

            </div>

            {/* In-Depth Live Active Scanning Alerts Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-3">
              
              {/* Left Column: Direct System Alert Feed (Critical / High Warnings) */}
              <div id="tbml-critical-alerts-logs" className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">SURVEILLANCE ALERTS FIUT</h3>
                  </div>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Live Counter</span>
                </div>

                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
                  {alerts.map((alert, idx) => (
                    <div 
                      key={`${alert.id}-${idx}`}
                      className="p-4 bg-zinc-950/60 hover:bg-zinc-950/90 border border-zinc-900 hover:border-zinc-800 rounded-2xl transition-all relative overflow-hidden group"
                    >
                      {/* Critical Red left border glow */}
                      <div className={`absolute top-0 left-0 bottom-0 w-1 ${alert.severity === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'}`} />
                      
                      <div className="flex justify-between items-start mb-2 pl-2">
                        <div>
                          <span className={`${alert.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'} border px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest`}>
                            {alert.severity} • {alert.type}
                          </span>
                        </div>
                        <span className="text-[8px] font-mono text-zinc-600 font-bold">Ref: {alert.referenceId}</span>
                      </div>

                      <p className="text-xs font-medium text-white leading-relaxed pl-2 mb-2">
                        {alert.description}
                      </p>

                      <div className="flex items-center justify-between pl-2 pt-2 border-t border-zinc-900/40 text-[8px] font-mono text-zinc-600">
                        <span>Gateway Trace Verified</span>
                        <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                      </div>
                    </div>
                  ))}

                  {alerts.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center border border-zinc-800/40 rounded-3xl opacity-40">
                      <ShieldCheck className="w-8 h-8 text-emerald-400 mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest">All trading corridors operating clean</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Underlying Trade Invoices Database */}
              <div id="tbml-corporate-ledger-invoices" className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-[#DFFF00]" />
                    <h3 className="text-xs font-black text-white uppercase tracking-widest font-mono">INSIDERS LEDGER</h3>
                  </div>
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">GLOBAL UNIT PRICE BASELINE</span>
                </div>

                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
                  {invoices.map((invoice, idx) => {
                    const priceAnomRatio = (invoice.unit_price - GLOBAL_PRICE_BASELINE[invoice.item_id]) / GLOBAL_PRICE_BASELINE[invoice.item_id];
                    const hasAnom = Math.abs(priceAnomRatio) > 0.25;

                    return (
                      <div 
                        key={`${invoice.id}-${idx}`}
                        className={`p-3.5 rounded-2xl border ${hasAnom ? 'bg-zinc-950/20 border-red-500/10' : 'bg-zinc-950/40 border-zinc-900'} relative`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-mono font-bold text-zinc-500">{invoice.id}</span>
                          <span className={`text-[8.5px] font-sans font-black uppercase ${hasAnom ? 'text-red-400' : 'text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-md text-[7px]'}`}>
                            {invoice.item_id}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-white uppercase truncate">{invoice.commodity_name}</p>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-tight">Origin: {invoice.origin} • Seller: {invoice.seller_name}</p>

                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-zinc-900/60 font-mono">
                          <div>
                            <span className="text-[8px] font-black text-zinc-600 block uppercase">Declared Unit Price</span>
                            <span className="text-xs font-black text-white">Rp {invoice.unit_price.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] font-black text-zinc-600 block uppercase">Baseline Delta</span>
                            <span className={`text-xs font-bold ${hasAnom ? 'text-red-400' : 'text-emerald-400'}`}>
                              {priceAnomRatio >= 0 ? '+' : ''}{Math.round(priceAnomRatio * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 2: TBML ANOMALY DETECTOR SIMULATOR (SANDBOX) */}
        {activeSubTab === 'SANDBOX' && (
          <motion.div
            key="tbml-sandbox-simulator"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
            id="tbml-sandbox-view"
          >
            {/* Quick Presets header */}
            <div className="p-4 bg-zinc-950/40 border border-zinc-800/40 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Sandbox Environment</span>
                <span className="text-[11px] font-bold text-white uppercase tracking-wider block">Surveillance Target Presets</span>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <button 
                  onClick={() => applyPresetSandbox('CLEAN')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  LOAD LEGIT S-COAL SHIPMENT
                </button>
                <button 
                  onClick={() => applyPresetSandbox('SHELL')}
                  className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  LOAD OVERSTATED NICKEL (BVI SHELL)
                </button>
                <button 
                  onClick={() => applyPresetSandbox('GHOST')}
                  className="px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  LOAD GHOST GOLD (SHADOW CO.)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column Form: Input Parameters */}
              <form onSubmit={handleSandboxInspect} className="lg:col-span-5 bg-zinc-950/40 border border-zinc-800/60 p-6 rounded-[2rem] space-y-4">
                <div className="border-b border-zinc-950 pb-3">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#DFFF00]" />
                    INSPECTION PROFILE CREATOR
                  </h3>
                  <p className="text-[8px] text-zinc-500 uppercase tracking-wider font-mono mt-1">Specify commercial elements for algorithmic audit</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Declared Invoice ID</label>
                    <input 
                      type="text" 
                      value={sbInvoiceId} 
                      onChange={e => setSbInvoiceId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#DFFF00]/50"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Cargo Commodity Ty</label>
                    <select 
                      value={sbItemId} 
                      onChange={e => {
                        setSbItemId(e.target.value);
                        if (e.target.value === 'COAL') {
                          setSbCommodityName('Premium Steam Grade Coal Met');
                          setSbUnitPrice('1500000');
                        } else if (e.target.value === 'NICKEL') {
                          setSbCommodityName('Purified Refined Nickel Plates');
                          setSbUnitPrice('250000000');
                        } else if (e.target.value === 'GOLD') {
                          setSbCommodityName('Fine Bullion Bar Refined Gold');
                          setSbUnitPrice('1200000');
                        } else if (e.target.value === 'LUXURY_WATCH') {
                          setSbCommodityName('Vanguard Chronology Elite Chrono');
                          setSbUnitPrice('300000000');
                        }
                      }}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#DFFF00]/50"
                    >
                      <option value="COAL">COAL MINERALS</option>
                      <option value="NICKEL">NICKEL INDUSTRIAL</option>
                      <option value="GOLD">24K REFINED GOLD</option>
                      <option value="LUXURY_WATCH">LUXURY TOURBILLONS</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Detailed Commodity Description</label>
                  <input 
                    type="text" 
                    value={sbCommodityName} 
                    onChange={e => setSbCommodityName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#DFFF00]/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Quantity (Cargo units)</label>
                    <input 
                      type="number" 
                      value={sbQuantity} 
                      onChange={e => setSbQuantity(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#DFFF00]/50"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Declared Unit Price (Rp)</label>
                    <input 
                      type="text" 
                      value={sbUnitPrice} 
                      onChange={e => setSbUnitPrice(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#DFFF00]/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Marine Bill of Lading ID</label>
                    <input 
                      type="text" 
                      value={sbManifestId} 
                      onChange={e => setSbManifestId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#DFFF00]/50"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Offshore Jurisdiction Origin</label>
                    <input 
                      type="text" 
                      value={sbOrigin} 
                      onChange={e => setSbOrigin(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#DFFF00]/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Counterparty Seller ID</label>
                    <input 
                      type="text" 
                      value={sbSellerId} 
                      onChange={e => setSbSellerId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#DFFF00]/50"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Ultimate Seller Corporate Name</label>
                    <input 
                      type="text" 
                      value={sbSellerName} 
                      onChange={e => setSbSellerName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#DFFF00]/50"
                    />
                  </div>
                </div>

                <div className="bg-zinc-950 p-4 border border-zinc-900/80 rounded-xl space-y-3">
                  <span className="text-[8px] font-black text-[#DFFF00] uppercase tracking-widest block">STOCK ACC LAYERING TRACKER (Temporal)</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[7.5px] font-black text-zinc-500 uppercase block mb-1">Capital Market Deposit (SID) lag</label>
                      <select 
                        value={sbSidActivityMinutes} 
                        onChange={e => setSbSidActivityMinutes(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-900/60 rounded-lg px-2 py-1.5 text-[10px] text-white focus:outline-none font-mono"
                      >
                        <option value="5">5 Minutes (Layering threat)</option>
                        <option value="15">15 Minutes (Layering threat)</option>
                        <option value="45">45 Minutes (Layering threat)</option>
                        <option value="120">2 Hours (Stable window)</option>
                        <option value="720">12 Hours (Segregated ok)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[7.5px] font-black text-zinc-500 uppercase block mb-1">Securities Volume (Rp)</label>
                      <input 
                        type="text" 
                        value={sbSidAmount} 
                        onChange={e => setSbSidAmount(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-900/60 rounded-lg px-2 py-1.5 text-[10px] text-white focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={recentScanLoading}
                  className="w-full py-3 bg-[#DFFF00] hover:bg-[#deff9a] text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                >
                  {recentScanLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Running Neural Audit Wave...
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4" />
                      Inspect Transaction Pair
                    </>
                  )}
                </button>
              </form>

              {/* Right Column: Dynamic Analysis Report */}
              <div className="lg:col-span-7 bg-zinc-950/20 border border-zinc-800/40 p-6 rounded-[2rem] min-h-[460px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-4">
                    <div>
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Audit Diagnostic Engine</span>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">SOVEREIGN DETECTOR REPORT</h4>
                    </div>
                    {sandboxAnalysisReport && (
                      <span className={`px-2.5 py-1 text-[8.5px] font-black rounded-xl border ${
                        sandboxAnalysisReport.score > 60 
                          ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                          : sandboxAnalysisReport.score > 30 
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      }`}>
                        TBML RATIO: {sandboxAnalysisReport.score}%
                      </span>
                    )}
                  </div>

                  {!sandboxAnalysisReport ? (
                    <div className="py-24 flex flex-col items-center justify-center text-center text-zinc-500 opacity-40">
                      <Database className="w-10 h-10 mb-3 text-zinc-600" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Simulation Profile</p>
                      <p className="text-[8px] mt-1">Select a preset above to load an illegal trade template, or build your own draft</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      
                      {/* Critical Threat Alert Banner */}
                      <div className={`p-4 rounded-2xl border ${
                        sandboxAnalysisReport.score > 60 
                          ? 'bg-red-500/5 border-red-500/25 text-red-300' 
                          : sandboxAnalysisReport.score > 30 
                          ? 'bg-amber-500/5 border-amber-500/20 text-amber-300' 
                          : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                      } flex items-start gap-3`}>
                        <div className="mt-0.5 shrink-0">
                          {sandboxAnalysisReport.score > 60 ? (
                            <ShieldAlert className="w-5 h-5 text-red-400" />
                          ) : sandboxAnalysisReport.score > 30 ? (
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                          ) : (
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-mono font-black text-[10px] uppercase tracking-wider mb-0.5">
                            Status: {sandboxAnalysisReport.threatLevel} SEC RISK LEVEL
                          </p>
                          <p className="text-[11px] font-medium leading-relaxed">
                            {sandboxAnalysisReport.score > 60 
                              ? "CRITICAL TBML ANOMALIES MATCHED: Commercial invoices demonstrate clear price-skew manipulation combined with high risk offshore destination, routing patterns match illicit cash flow."
                              : sandboxAnalysisReport.score > 30
                              ? "MEDIUM VULNERABILITY LEVEL: Minor regulatory deviation mapped. Requires continuous corporate Beneficial Owner audit."
                              : "Sovereign audit clean. Standard pricing range aligned perfectly with customs cargo manifests."
                            }
                          </p>
                        </div>
                      </div>

                      {/* Diagnostic logs */}
                      <div className="space-y-2">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Sequence Analysis</span>
                        
                        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 select-text custom-scrollbar">
                          {sandboxAnalysisReport.reports.map((report: string, idx: number) => (
                            <div key={idx} className="p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-900 text-[10px] font-mono leading-relaxed text-zinc-300 flex items-start gap-2">
                              <span className="text-zinc-600 shrink-0">0{idx+1}</span>
                              <p className="flex-1">{report}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {sandboxAnalysisReport && (
                  <div className="mt-4 pt-4 border-t border-zinc-900/80 flex items-center justify-between text-[8px] font-mono text-zinc-500">
                    <span>SURVEILLANCE NODE VERIFICATION: GNN-TBML-CORRELATE</span>
                    <button 
                      onClick={() => {
                        // Persist Sandbox to invoice state on demand
                        setInvoices([sandboxAnalysisReport.invoice, ...invoices]);
                        setActiveSubTab('RADAR');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:text-[#DFFF00] transition-colors border border-zinc-800 text-[8.5px] font-bold text-white uppercase"
                    >
                      COMMIT TO RADAR ALERTS
                    </button>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 3: TIMELINE TEMPORAL CORRELATION */}
        {activeSubTab === 'CORRELATOR' && (
          <motion.div
            key="tbml-temporal-correlator"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
            id="tbml-temporal-correlator-view"
          >
            {/* Context introduction */}
            <div className="p-5 bg-[#DFFF00]/[0.02] border border-[#DFFF00]/10 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 bg-[#DFFF00]/5 blur-3xl rounded-full" />
              <div className="flex items-start gap-3 relative z-10">
                <Clock className="w-5 h-5 text-[#DFFF00] mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">Securities Layering Temporal Analyser</h4>
                  <p className="text-[11px] font-normal text-zinc-300 leading-relaxed mt-1">
                    Temporal correlation is a known methodology to map Trade-Based Money Laundering. Bad actors over-debit trade payouts via shell trusts and buy blue-chip capital market securities (SID accounts) with high speed to wash fund origins. Under FIU regulations, any transaction with <strong className="text-[#DFFF00]">time gap &lt; 1 hour (3600 seconds)</strong> triggers the automatic <strong>"MATCHED_PATTERN" (Layering) flag</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* List timeline pairings */}
            <div className="space-y-4">
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Live Matching Sequences</span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bankLogs.map((log, idx) => {
                  // Mapped invoice
                  const correlatedInvoice = invoices.find(i => i.id === log.invoice_id);
                  // Find related SID Activity based on amount proximity or explicitly seeded matching timestamps
                  // Mapped correlation in custom pseudocode: time_diff = sid_activity.timestamp - bank_transaction.timestamp
                  const matchActivity = sidActivities.find(sid => {
                    const diff = sid.timestamp - log.timestamp;
                    return diff > 0 && diff < 3600 * 1000;
                  });

                  const timeDiffSeconds = matchActivity ? Math.round((matchActivity.timestamp - log.timestamp) / 1000) : null;
                  const isLayeringMatch = timeDiffSeconds !== null && timeDiffSeconds < 3600;

                  return (
                    <div 
                      key={`${log.transaction_id}-${idx}`}
                      className={`p-5 rounded-[2rem] border transition-all ${
                        isLayeringMatch 
                          ? 'bg-zinc-950/40 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.03)]' 
                          : 'bg-zinc-950/20 border-zinc-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4 border-b border-zinc-900 pb-2">
                        <div>
                          <span className="text-[8px] font-mono text-zinc-500 font-bold block">Trade Invoice Mapped: {log.invoice_id}</span>
                          <span className="text-[10px] font-bold text-white uppercase tracking-wider font-mono mt-0.5">{correlatedInvoice?.commodity_name || 'Generic Assets'}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border tracking-widest ${
                          isLayeringMatch 
                            ? 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse' 
                            : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
                        }`}>
                          {isLayeringMatch ? 'MATCHED_PATTERN' : 'SEGREGATED'}
                        </span>
                      </div>

                      {/* Visual flow graph comparing the two times */}
                      <div className="space-y-4">
                        
                        {/* 1. Bank payout */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-2">
                            <div className="px-2 py-1 bg-zinc-900 rounded-lg text-[8.5px] font-bold text-zinc-400 border border-zinc-800">BANK</div>
                            <div>
                              <p className="text-[10px] text-zinc-500 uppercase font-mono">Disbursement routing</p>
                              <p className="text-[11px] font-bold text-white">{log.sender_bank_routing}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-zinc-400 font-bold font-mono">Rp {log.amount.toLocaleString('id-ID')}</p>
                            <p className="text-[8px] font-mono text-zinc-600">{new Date(log.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>

                        {/* Connection arrow bridge */}
                        <div className="flex items-center justify-center relative py-1">
                          <div className="absolute inset-0 flex items-center">
                            <div className={`w-full border-t border-dashed ${isLayeringMatch ? 'border-red-500/30' : 'border-zinc-800'}`} />
                          </div>
                          <div className={`px-3 py-1 text-[8.5px] font-mono rounded-full border relative z-10 font-bold ${
                            isLayeringMatch 
                              ? 'bg-red-500/5 border-red-500/30 text-red-400' 
                              : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                          }`}>
                            {isLayeringMatch ? `Time delta: ${Math.round(timeDiffSeconds! / 60)} mins (Layering)` : 'No same-hour matching SID deposit'}
                          </div>
                        </div>

                        {/* 2. Stock market investment */}
                        {matchActivity ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-start gap-2">
                              <div className="px-2 py-1 bg-zinc-900 rounded-lg text-[8.5px] font-bold text-[#DFFF00] border border-[#DFFF00]/10">STOCK/SID</div>
                              <div>
                                <p className="text-[10px] text-zinc-500 uppercase font-mono">SID Capital Account Injection</p>
                                <p className="text-[11px] font-bold text-white truncate max-w-[120px]">{matchActivity.investor_name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-emerald-400 font-bold font-mono">Rp {matchActivity.amount_deposited.toLocaleString('id-ID')}</p>
                              <p className="text-[8px] font-mono text-zinc-600">{new Date(matchActivity.timestamp).toLocaleTimeString()}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="py-2.5 bg-zinc-950/50 rounded-xl border border-zinc-900 border-dashed text-center">
                            <p className="text-[9px] font-mono text-zinc-600 uppercase">NO RECONCILED SECURITIES DEPOSIT ASSOCIATED</p>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: GNN BENEFICIAL OWNERSHIP GRAPH */}
        {activeSubTab === 'GNNSYSTEM' && (
          <motion.div
            key="tbml-gnn-ownership"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
            id="tbml-gnn-ownership-view"
          >
            {/* Interactive entity network */}
            <div className="bg-[#020407] border border-zinc-800/80 rounded-[2.5rem] p-6 min-h-[460px] relative overflow-hidden flex flex-col justify-between">
              
              <div className="flex items-start justify-between border-b border-zinc-900 pb-4">
                <div>
                  <span className="text-[8px] font-black text-[#DFFF00] uppercase tracking-widest block">Neural Entities Tracing</span>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">GNN BENEFICIAL BENEFICIAL OWNERSHIP CHART & SHELL MAP</h4>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                    <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase">SHELL TRANSFERS</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 bg-orange-400 rounded-full" />
                    <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase">LAYERING LINKS</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                    <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase">BENIGN NODES</span>
                  </div>
                </div>
              </div>

              {/* Dynamic canvas mapping showing high resolution network node graph style */}
              <div id="neural-gnn-nodes-map" className="flex-1 my-6 min-h-[220px] bg-zinc-950/40 rounded-2xl border border-zinc-900 p-6 flex flex-col justify-center items-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.01)_0%,transparent_70%)] pointer-events-none" />
                
                {/* Node Grid Map */}
                <div className="w-full max-w-xl grid grid-cols-4 gap-6 items-center relative z-10 py-6">
                  
                  {/* Node 1: Vendor */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-red-950/80 border-2 border-red-500 flex items-center justify-center font-mono font-extrabold text-[#DFFF00] text-xs shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                      EXP
                    </div>
                    <span className="text-[9px] font-bold text-white uppercase mt-2">BVI Smelter Corp</span>
                    <span className="text-[7.5px] font-mono text-red-400 uppercase mt-0.5">Offshore Vendor</span>
                  </div>

                  {/* Bridge Line 1 */}
                  <div className="flex flex-col items-center justify-center pt-2">
                    <div className="text-[7.5px] font-mono text-zinc-600 block mb-1">Commercial Invoice</div>
                    <div className="w-full h-1 bg-red-400/40 relative">
                      <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 animate-pulse -mr-1 -mt-0.5" />
                    </div>
                    <span className="text-[7px] text-red-400 font-bold block mt-1">+44% Deviation Price</span>
                  </div>

                  {/* Node 2: Shell Bank proxy */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-orange-950/80 border-2 border-orange-500 flex items-center justify-center font-mono font-bold text-white text-xs">
                      SHB
                    </div>
                    <span className="text-[9px] font-bold text-white uppercase mt-2">Cayman Trust LLC</span>
                    <span className="text-[7.5px] font-mono text-orange-400 uppercase mt-0.5">intermediation Trust</span>
                  </div>

                  {/* Bridge Line 2 */}
                  <div className="flex flex-col items-center justify-center pt-2">
                    <div className="text-[7.5px] font-mono text-zinc-600 block mb-1">Temporal Trans.</div>
                    <div className="w-full h-1 bg-orange-400/30 relative">
                      <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-orange-400 animate-pulse -mr-1 -mt-0.5" />
                    </div>
                    <span className="text-[7px] text-orange-400 font-bold block mt-1">Matched 18 mins</span>
                  </div>

                  {/* Row breaker or visual connector to market SID */}
                  <div className="col-span-4 py-3 flex justify-center">
                    <div className="flex items-center gap-3">
                      <ArrowRightLeft className="w-4 h-4 text-orange-400 animate-pulse rotate-90" />
                      <span className="text-[8px] font-mono text-red-400 font-bold uppercase tracking-wider bg-red-500/5 px-2.5 py-1 rounded-lg border border-red-500/20">
                        Layering Pattern Detected: Export Proceeds Placed into Securities Account
                      </span>
                    </div>
                  </div>

                  {/* Node 3: Domestic Trust Proxy */}
                  <div className="flex flex-col items-center col-start-2">
                    <div className="w-12 h-12 rounded-full bg-orange-950/40 border-2 border-orange-400/60 flex items-center justify-center font-sans font-bold text-white text-[11px]">
                      TRUST
                    </div>
                    <span className="text-[9px] font-bold text-white uppercase mt-2">PT Prima Nominees</span>
                    <span className="text-[7.5px] font-mono text-orange-400/80 uppercase mt-0.5">Sovereign Intermediary</span>
                  </div>

                  {/* Bridge Line 3 */}
                  <div className="col-start-3 flex flex-col items-center justify-center pt-2">
                    <div className="text-[7.5px] font-mono text-zinc-600 block mb-1">Account placement</div>
                    <div className="w-full h-1 bg-emerald-500/30 relative">
                      <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#DFFF00] animate-pulse -mr-1 -mt-0.5" />
                    </div>
                    <span className="text-[7px] text-[#DFFF00] font-bold block mt-1">Capital Market SID</span>
                  </div>

                  {/* Node 4: Stock Wallet */}
                  <div className="flex flex-col items-center col-start-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-950/80 border-2 border-emerald-500 flex items-center justify-center font-mono font-bold text-[#DFFF00] text-xs">
                      SID
                    </div>
                    <span className="text-[9px] font-bold text-white uppercase mt-2">SID-COMP-8302</span>
                    <span className="text-[7.5px] font-mono text-emerald-400 uppercase mt-0.5">VAM Managed Portfolio</span>
                  </div>

                </div>

              </div>

              {/* Graph Neural Networks Diagnostic Log Footer */}
              <div className="p-4 bg-zinc-950/80 border border-zinc-900 rounded-2xl">
                <div className="flex items-center gap-1.5 mb-2">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <span className="text-[8px] font-black text-white uppercase tracking-widest leading-none">Beneficial Ownership GNN Diagnosis</span>
                </div>
                <p className="text-[10px] text-zinc-400 font-mono leading-relaxed">
                  GNN Tracing Analysis: Identified clustering match with suspicious offshore parent entities linked under ultimate ownership proxy BVI-TRUST-99. Layering chain leverages 18-minute temporal window gap to place raw profit shifts from overstated nickel trade into PT Venture Asset Management domestic portfolios under SID account SID-COMP-8302. Sovereign alert automatically submitted to sovereign regulators.
                </p>
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 5: VAM BRIDGE DEPLOY & API CONTROL PANEL */}
        {activeSubTab === 'DEPLOY' && (
          <motion.div
            key="tbml-bridge-deploy"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 animate-fade-in"
            id="tbml-bridge-deploy-view"
          >
            {/* Top Gateway General Info Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl shrink-0">
                  <Globe className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <span className="text-[7px] font-black text-zinc-500 block uppercase tracking-wider">GATEWAY INGRESS IP</span>
                  <span className="text-xs font-mono font-bold text-white block truncate">10.144.20.10:8443</span>
                </div>
              </div>

              <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl flex items-center gap-3">
                <div className="p-2.5 bg-[#DFFF00]/10 rounded-xl shrink-0">
                  <ShieldCheck className="w-5 h-5 text-[#DFFF00]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[7px] font-black text-zinc-500 block uppercase tracking-wider">SECURE SHIELD</span>
                  <span className="text-xs font-mono font-bold text-[#DFFF00] block truncate">TLS 1.3 ENFORCED</span>
                </div>
              </div>

              <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl flex items-center gap-3">
                <div className="p-2.5 bg-red-500/10 rounded-xl shrink-0">
                  <Lock className="w-5 h-5 text-red-500" />
                </div>
                <div className="min-w-0">
                  <span className="text-[7px] font-black text-zinc-500 block uppercase tracking-wider">SANDBOX SHIELD</span>
                  <span className="text-xs font-mono font-bold text-white block truncate">READ-ONLY AIRGAP</span>
                </div>
              </div>

              <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl flex items-center gap-3">
                <div className="p-2.5 bg-purple-500/10 rounded-xl shrink-0">
                  <Key className="w-5 h-5 text-purple-400" />
                </div>
                <div className="min-w-0">
                  <span className="text-[7px] font-black text-zinc-500 block uppercase tracking-wider">AUTH STANDARDS</span>
                  <span className="text-xs font-mono font-bold text-zinc-300 block truncate">OIDC COMPLIANT</span>
                </div>
              </div>
            </div>

            {/* Container Setup & Instructions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Containerized Bridge (Docker setup configuration) */}
              <div className="lg:col-span-7 bg-[#020407] border border-zinc-900 rounded-[2rem] p-6 space-y-6">
                <div>
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.2em] block mb-0.5">SOVEREIGN NETWORK BRIDGING</span>
                  <h3 className="text-base font-black text-white uppercase tracking-wider font-mono">1. Provisioning Containerized Bridge (Docker Setup)</h3>
                  <p className="text-[10px] text-zinc-400 mt-1">Configure isolated endpoints wrapping VAM-Radar and generate secure private VPN docker scripts.</p>
                </div>

                {/* Configuration controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Encrypted API Gateway toggle */}
                  <div className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Encrypted API Gateway</span>
                      <span className={`px-2 py-0.5 text-[8px] font-mono font-extrabold rounded ${bridgeTlsOnly ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/35' : 'bg-zinc-900 text-zinc-500'}`}>
                        {bridgeTlsOnly ? 'TLS 1.3' : 'LEGACY'}
                      </span>
                    </div>
                    <p className="text-[9px] text-zinc-500 leading-normal">Forces military-grade cryptographic TLS 1.3 handshake on all inbound requests from your corporate workspace.</p>
                    <button 
                      type="button"
                      onClick={() => {
                        setBridgeTlsOnly(!bridgeTlsOnly);
                        setTerminalFeed(prev => [
                          ...prev,
                          `[SECURITY API] Manual reconfig: TLS 1.3 protocol requirement toggled to ${!bridgeTlsOnly ? 'ENFORCED' : 'OFF'}`
                        ]);
                      }}
                      className="text-[9px] font-black text-[#DFFF00] uppercase tracking-wider hover:underline block pt-1"
                    >
                      {bridgeTlsOnly ? "Switch to standard TLS" : "Enforce High-security TLS 1.3"}
                    </button>
                  </div>

                  {/* Request Limit / Rate Limiting */}
                  <div className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Anonymization Tunnel</span>
                      <span className={`px-2 py-0.5 text-[8px] font-mono font-extrabold rounded ${bridgeAnonymize ? 'bg-[#DFFF00]/15 text-[#DFFF00] border border-[#DFFF00]/30' : 'bg-zinc-900 text-zinc-500'}`}>
                        {bridgeAnonymize ? 'ACTIVE' : 'OFF'}
                      </span>
                    </div>
                    <p className="text-[9px] text-zinc-500 leading-normal">Anonymizes internally initiated queries across encrypted peer relays so zero telemetry slips out to clearing houses.</p>
                    <button 
                      type="button"
                      onClick={() => {
                        setBridgeAnonymize(!bridgeAnonymize);
                        setTerminalFeed(prev => [
                          ...prev,
                          `[SECURITY NET] Traffic tunnel anonymity status changed to ${!bridgeAnonymize ? 'ACTIVATED' : 'PLAIN_ROUTING'}`
                        ]);
                      }}
                      className="text-[9px] font-black text-[#DFFF00] uppercase tracking-wider hover:underline block pt-1"
                    >
                      {bridgeAnonymize ? "Bypass anonymizing relays" : "Activate Private Tunneling"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Rate Limiting selection */}
                  <div className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider block">Rate Limiting Threshold</span>
                    <p className="text-[9px] text-zinc-500 leading-normal">Defines peak query velocity to protect the enterprise gateway under stress test scenarios.</p>
                    <div className="flex gap-2 pt-1">
                      {[30, 60, 120].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => {
                            setBridgeLimitRate(rate);
                            setTerminalFeed(prev => [
                              ...prev,
                              `[SECURITY RATELIMIT] Maximum query cadence reallocated to: ${rate} requests per minute max.`
                            ]);
                          }}
                          className={`px-3 py-1 text-[9px] font-mono font-bold rounded-lg transition-all ${
                            bridgeLimitRate === rate 
                              ? 'bg-[#deff9a]/20 text-[#deff9a] border border-[#deff9a]/35' 
                              : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {rate} RPM
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Airgapped sandbox static display */}
                  <div className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-xl space-y-1 relative">
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-red-950/65 border border-red-500/20 px-2 py-0.5 rounded-lg text-[8px] text-red-400 font-mono font-bold">
                      <Lock className="w-2.5 h-2.5 animate-pulse" /> SYSTEM SECURED
                    </div>
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider block">Sandbox Shield</span>
                    <p className="text-[9px] text-zinc-500 leading-relaxed pt-1">
                      Container is fully isolated from the core engine dataset. High performance GNN model algorithms work off-line, dispatching telemetry read-only risk vectors.
                    </p>
                  </div>
                </div>

                {/* Live Script Generator box */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-mono font-extrabold text-[#deff9a] uppercase tracking-widest">BRIDGE SETUP COREGARDS (DOCKER-CLI)</span>
                    <button
                      type="button"
                      onClick={() => {
                        const script = `docker run -d --name vam-radar-api-bridge \\
  -p 8443:8443 \\
  -e TLS_MODE=TLSv1.3 \\
  -e ENFORCE_TLS_ONLY=${bridgeTlsOnly ? '1' : '0'} \\
  -e TUNNEL_ANONYMIZED=${bridgeAnonymize ? '1' : '0'} \\
  -e LIMIT_RPM=${bridgeLimitRate} \\
  -e COMPLIANCE_QUARANTINE=${bridgeIsQuarantineEnabled ? '1' : '0'} \\
  -e QUARANTINE_THRESHOLD=${bridgeQuarantineThreshold} \\
  -e MASTER_ACCESS_TOKEN="${bridgeToken}" \\
  gcr.io/ventuream-international/vam-radar-bridge:latest`;
                        
                        navigator.clipboard.writeText(script).then(() => {
                          setTerminalFeed(prev => [
                            ...prev,
                            `[INTEGRATION COPIED] Generated Docker bootstrap CLI parameters copied successfully.`
                          ]);
                          alert("Docker setup CLI script copied to clipboard!");
                        });
                      }}
                      className="flex items-center gap-1.5 text-[8.5px] font-bold text-zinc-400 hover:text-white transition-all bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg"
                    >
                      <Copy className="w-3 h-3 text-emerald-400" />
                      Copy Docker CLI Script
                    </button>
                  </div>
                  <div className="bg-black/95 border border-zinc-900 p-4 rounded-xl font-mono text-[9px] text-emerald-400 leading-relaxed overflow-x-auto select-all max-h-[140px] custom-scrollbar">
                    <p className="text-zinc-600"># Docker bootstrap for VAM Radar Encrypted API Gateway</p>
                    <p>docker run -d --name vam-radar-api-bridge \</p>
                    <p className="pl-4">-p 8443:8443 \</p>
                    <p className="pl-4">-e TLS_MODE=TLSv1.3 \</p>
                    <p className="pl-4">-e ENFORCE_TLS_ONLY={bridgeTlsOnly ? '1' : '0'} \</p>
                    <p className="pl-4">-e TUNNEL_ANONYMIZED={bridgeAnonymize ? '1' : '0'} \</p>
                    <p className="pl-4">-e LIMIT_RPM={bridgeLimitRate} \</p>
                    <p className="pl-4">-e COMPLIANCE_QUARANTINE={bridgeIsQuarantineEnabled ? '1' : '0'} \</p>
                    <p className="pl-4">-e QUARANTINE_THRESHOLD={bridgeQuarantineThreshold} \</p>
                    <p className="pl-4">-e MASTER_ACCESS_TOKEN="{bridgeToken}" \</p>
                    <p className="pl-4">gcr.io/ventuream-international/vam-radar-bridge:latest</p>
                  </div>
                </div>

              </div>

              {/* Right Column: Technical Instructions & Deployment Token controls */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Deployment Protocol & Endpoint Info */}
                <div className="bg-[#020407] border border-zinc-900 p-6 rounded-[2rem] space-y-4">
                  <div>
                    <span className="text-[8px] font-black text-[#DFFF00] uppercase tracking-widest block mb-0.5">GATEWAY INGRESS ACCESS</span>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">2. Deployment Access Protocol</h3>
                  </div>

                  <div className="p-4 bg-zinc-950 border border-zinc-900/60 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-900/40 pb-2">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase">ACCESS REGISTRY ENDPOINT</span>
                      <span className="px-1.5 py-0.2 bg-emerald-500/15 text-emerald-400 rounded text-[7px] font-mono font-bold">VPN INTERNAL</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs font-mono text-white">
                      <span>Gateway IPv4:</span>
                      <span className="text-emerald-400 font-bold">10.144.20.10:8443</span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Master Access Bearer token:</span>
                      <div className="flex gap-1.5">
                        <input 
                          type="text" 
                          readOnly 
                          value={bridgeToken} 
                          className="flex-1 bg-black border border-zinc-900 rounded-lg px-2.5 py-1 text-[8.5px] font-mono text-zinc-300 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(bridgeToken);
                            setCopiedToken(true);
                            setTimeout(() => setCopiedToken(false), 2000);
                            setTerminalFeed(prev => [
                              ...prev,
                              `[SECURITY TOKEN] Master API Key copied for application verification.`
                            ]);
                          }}
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-350 border border-zinc-800 rounded-lg font-bold"
                        >
                          {copiedToken ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => {
                        const randomString = Math.random().toString(16).substring(2, 17) + Math.random().toString(16).substring(2, 17);
                        const newToken = `vam_live_master_tok_${randomString}`;
                        setBridgeToken(newToken);
                        setTerminalFeed(prev => [
                          ...prev,
                          `[SECURITY CRED] Master bearer access token has been rotated on request. New expiration window: 48h.`
                        ]);
                        alert("Master access token rotated successfully.");
                      }}
                      className="w-full text-center py-2 bg-zinc-900 hover:bg-zinc-850 rounded-lg text-[8.5px] font-black text-zinc-350 uppercase tracking-widest border border-zinc-800 transition-all text-xs"
                    >
                      Regenerate limited Master Token
                    </button>
                  </div>

                  {/* Auto-Quarantine Trigger settings */}
                  <div className="p-4 bg-zinc-950 border border-zinc-900/60 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                        VAM_System.quarantine() Hook
                      </span>
                      <button 
                        type="button"
                        onClick={() => {
                          setBridgeIsQuarantineEnabled(!bridgeIsQuarantineEnabled);
                          setTerminalFeed(prev => [
                            ...prev,
                            `[COMPLIANCE] Auto-Quarantine action trigger changed to : ${!bridgeIsQuarantineEnabled ? 'ENABLED' : 'DISABLED'}`
                          ]);
                        }}
                        className={`text-[8px] font-extrabold px-2 py-0.5 border rounded-lg uppercase tracking-wider ${
                          bridgeIsQuarantineEnabled 
                            ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                        }`}
                      >
                        {bridgeIsQuarantineEnabled ? "MUTED" : "UNMUTED"}
                      </button>
                    </div>
                    
                    <p className="text-[9px] text-zinc-500 leading-normal">
                      Every trade or corporate node checked with a risk score exceeding your threshold will automatically register a quarantine signal inside the VAM order-book gateway.
                    </p>

                    <div className="space-y-2 pt-1 font-mono">
                      <div className="flex justify-between text-[8px] text-zinc-500 uppercase">
                        <span>Min Threshold: 70%</span>
                        <span className="text-[#DFFF00]">Selected Threshold: {bridgeQuarantineThreshold}%</span>
                        <span>Max Threshold: 95%</span>
                      </div>
                      <input 
                        type="range" 
                        min="70" 
                        max="95" 
                        value={bridgeQuarantineThreshold} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setBridgeQuarantineThreshold(val);
                          setTerminalFeed(prev => [
                            ...prev,
                            `[INTEGRATION] Quarantine filter threshold relocated to: ${val}%`
                          ]);
                        }}
                        className="w-full accent-[#DFFF00] bg-zinc-900 h-1 rounded-lg outline-none cursor-pointer"
                        disabled={!bridgeIsQuarantineEnabled}
                      />
                    </div>
                  </div>

                </div>

                {/* Instructions for Tech team (Beautiful memo container) */}
                <div className="bg-[#0b0c10] border border-red-500/10 p-6 rounded-[2rem] relative overflow-hidden space-y-4">
                  <div className="absolute top-0 right-0 w-28 h-28 bg-red-500/5 blur-3xl rounded-full" />
                  
                  <div className="flex items-center gap-2 border-b border-zinc-950 pb-3">
                    <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                    <div>
                      <span className="text-[8px] font-black text-red-400 uppercase block tracking-widest leading-none">HIGH-SECURITY MEMARND</span>
                      <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">Instructions for Technical Team</span>
                    </div>
                  </div>

                  <div className="bg-black/60 border border-zinc-900 p-4 rounded-xl relative">
                    <span className="text-[7.5px] font-mono text-zinc-500 uppercase block absolute top-2 right-3">CONFIDENTIAL</span>
                    <p className="text-[10px] text-zinc-300 font-sans leading-relaxed pt-2">
                       "Tim Teknis, VAM API Bridge sudah siap pada private container. Silakan lakukan integrasi pada modul <strong className="text-[#DFFF00]">ComplianceCheck</strong> dan <strong className="text-[#DFFF00]">VendorOnboarding</strong>. Gunakan protokol <strong className="text-[#deff9a]">OIDC (OpenID Connect)</strong> untuk autentikasi. Harap diperhatikan, akses bersifat <strong className="text-emerald-400 font-semibold">read-only</strong> terhadap metadata forensik. Jangan mencoba melakukan penetrasi ke core engine karena sistem akan melakukan <strong className="text-red-400 font-semibold">self-destruct</strong> terhadap token akses jika terdeteksi aktivitas brute force."
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const note = `Tim Teknis, VAM API Bridge sudah siap pada private container. Silakan lakukan integrasi pada modul ComplianceCheck dan VendorOnboarding. Gunakan protokol OIDC (OpenID Connect) untuk autentikasi. Harap diperhatikan, akses bersifat read-only terhadap metadata forensik. Jangan mencoba melakukan penetrasi ke core engine karena sistem akan melakukan self-destruct terhadap token akses jika terdeteksi aktivitas brute force.`;
                        navigator.clipboard.writeText(note);
                        setCopiedInstructions(true);
                        setTimeout(() => setCopiedInstructions(false), 2000);
                        setTerminalFeed(prev => [
                          ...prev,
                          `[SECURITY POLICY] Dispatch memo text copied to clipboard successfully.`
                        ]);
                      }}
                      className="flex-1 py-2 text-zinc-100 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-[9px] font-black uppercase tracking-wider border border-zinc-800 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#deff9a]" />
                      {copiedInstructions ? "Memo copied!" : "Copy Memo text"}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setTerminalFeed(prev => [
                          ...prev,
                          `[DISPATCH] Secure memo dispatched over VPN tunnel to compliance team mail gateway.`
                        ]);
                        alert("Secure directive memo dispatched to your corporate compliance team gateway successfully!");
                      }}
                      className="px-4 py-2 bg-red-400/10 hover:bg-red-400/20 text-red-400 rounded-xl text-[9px] font-black uppercase tracking-wider border border-red-500/20 transition-all text-xs"
                    >
                      Dispatch Mail
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Active Detection Logics: API Testing Bench Simulation Panel */}
            <div className="bg-[#020407] border border-zinc-900 rounded-[2.5rem] p-6 space-y-6">
              
              <div>
                <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest block mb-0.5">3. LIVE TESTING WORK BENCH</span>
                <h3 className="text-base font-black text-white uppercase tracking-wider font-mono">Active Detection Logics / Endpoint Playpen</h3>
                <p className="text-[10px] text-zinc-400 mt-1">Simulate REST HTTP triggers as authenticated developer nodes. Verify the decrypted payload responses from VAM Radar API.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Endpoint selection & params */}
                <div className="lg:col-span-5 bg-zinc-950 p-6 border border-zinc-900/60 rounded-[2rem] space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <span className="text-[9px] font-mono font-extrabold text-[#DFFF00] uppercase tracking-wider block">ROUTE DEFINITION REQUEST</span>
                    
                    {/* Select Endpoint Route */}
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Choose API Endpoint Route</label>
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            setApiType('risk');
                          }}
                          className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                            apiType === 'risk' 
                              ? 'bg-[#deff9a]/10 border-[#deff9a]/30 text-white font-semibold' 
                              : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase">GET /v1/entity/risk-profile</span>
                            <span className="text-[8px] text-zinc-500 font-mono">Query vendor risk score & audit metadata</span>
                          </div>
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[7px] font-mono font-bold shrink-0 ml-2">READ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setApiType('trace');
                          }}
                          className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                            apiType === 'trace' 
                              ? 'bg-[#deff9a]/10 border-[#deff9a]/30 text-white font-semibold' 
                              : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase">POST /v1/forensic/trace</span>
                            <span className="text-[8px] text-zinc-500 font-mono">Deep tracing target of capital placement</span>
                          </div>
                          <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded text-[7px] font-mono font-bold shrink-0 ml-2">WRITE</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setApiType('network');
                          }}
                          className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                            apiType === 'network' 
                              ? 'bg-[#deff9a]/10 border-[#deff9a]/30 text-white font-semibold' 
                              : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase">GET /v1/network/mapping</span>
                            <span className="text-[8px] text-zinc-500 font-mono">Download SNA graph beneficial owners</span>
                          </div>
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[7px] font-mono font-bold shrink-0 ml-2">READ</span>
                        </button>
                      </div>
                    </div>

                    {/* Param Controls depending on the API type */}
                    <div className="p-4 bg-zinc-950 border border-zinc-900/60 rounded-xl space-y-3">
                      <span className="text-[8.5px] font-mono text-zinc-400 uppercase tracking-wider block">QUERY ARGUMENTS</span>
                      
                      {apiType === 'risk' && (
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Query Entity (Target)</label>
                          <select 
                            value={playVendorId} 
                            onChange={(e) => setPlayVendorId(e.target.value)}
                            className="w-full bg-black border border-zinc-900 rounded-lg px-2.5 py-2 text-xs text-zinc-300 focus:outline-none"
                          >
                            <option value="BVI-TRUST-99">Pacific Horizon Holdco BVI (BVI-TRUST-99) • CRITICAL</option>
                            <option value="ID-MINING-CO-1">Bumi Minerals Tbk. (ID-MINING-CO-1) • SAFE</option>
                            <option value="SEY-SHELL-7">Gold Peak Venture Ltd. (SEY-SHELL-7) • HIGH RISK</option>
                          </select>
                        </div>
                      )}

                      {apiType === 'trace' && (
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Forensic Target Invoice ID</label>
                          <select 
                            value={playInvoiceId} 
                            onChange={(e) => setPlayInvoiceId(e.target.value)}
                            className="w-full bg-black border border-zinc-900 rounded-lg px-2.5 py-2 text-xs text-zinc-300 focus:outline-none"
                          >
                            <option value="INV-2026-002">INV-2026-002 (Smelted Nickel Matte over-invoiced 44%)</option>
                            <option value="INV-2026-003">INV-2026-003 (Tourbillon Premium watches ghost shipment)</option>
                            <option value="INV-2026-004">INV-2026-004 (24K Gold Bars under-invoiced 29%)</option>
                          </select>
                        </div>
                      )}

                      {apiType === 'network' && (
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">SNA Filters</label>
                          <select 
                            value={playNetworkFilter} 
                            onChange={(e) => setPlayNetworkFilter(e.target.value)}
                            className="w-full bg-black border border-zinc-900 rounded-lg px-2.5 py-2 text-xs text-zinc-300 focus:outline-none"
                          >
                            <option value="beneficial-owners">beneficial-owners (Ultimate tracing nodes)</option>
                            <option value="all-layering-links">{"all-layering-links (Bank -> SID Temporal Match)"}</option>
                            <option value="trusted-domestic-proxies">trusted-domestic-proxies (Domestic nodes only)</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit API Call button */}
                  <button
                    type="button"
                    disabled={apiLoading}
                    onClick={() => {
                      setApiLoading(true);
                      setTimeout(() => {
                        let responseBody: any = {};
                        
                        if (apiType === 'risk') {
                          if (playVendorId === 'BVI-TRUST-99') {
                            responseBody = {
                              status: "success",
                              endpoint: "/v1/entity/risk-profile",
                              query: { entity_id: "BVI-TRUST-99" },
                              data: {
                                entity_name: "Pacific Horizon Holdco BVI",
                                registered_jurisdiction: "British Virgin Islands",
                                risk_indices: {
                                  tbml_score: 92.5,
                                  price_manipulation_ratio: 1.44,
                                  offshore_proximity: "CRITICAL"
                                },
                                beneficial_owners: [
                                  "Vanguard Trustee Group (BVI)",
                                  "Anonymous Shadow Trustee #491"
                                ],
                                compliance_action: {
                                  quarantine_triggered: bridgeIsQuarantineEnabled && 92.5 > bridgeQuarantineThreshold,
                                  action: bridgeIsQuarantineEnabled && 92.5 > bridgeQuarantineThreshold ? "AUTO_QUARANTINE" : "ALLOW_OVERRIDE",
                                  reason: `Evaluation score 92.5% matches active surveillance quarantine ruleset (Trigger threshold: ${bridgeQuarantineThreshold}%)`
                                }
                              }
                            };
                          } else if (playVendorId === 'SEY-SHELL-7') {
                            responseBody = {
                              status: "success",
                              endpoint: "/v1/entity/risk-profile",
                              query: { entity_id: "SEY-SHELL-7" },
                              data: {
                                entity_name: "Gold Peak Venture Ltd.",
                                registered_jurisdiction: "Seychelles",
                                risk_indices: {
                                  tbml_score: 74.0,
                                  price_manipulation_ratio: 0.71,
                                  offshore_proximity: "HIGH"
                                },
                                beneficial_owners: [
                                  "Seychelles Ultimate Trust Fund",
                                  "Gold Peak Capital Gate Acc"
                                ],
                                compliance_action: {
                                  quarantine_triggered: bridgeIsQuarantineEnabled && 74.0 > bridgeQuarantineThreshold,
                                  action: bridgeIsQuarantineEnabled && 74.0 > bridgeQuarantineThreshold ? "AUTO_QUARANTINE" : "NOMINAL_ALLOW_OVERRIDE",
                                  reason: `Score (74.0%) evaluated below quarantine threshold trigger (${bridgeQuarantineThreshold}%)`
                                }
                              }
                            };
                          } else {
                            responseBody = {
                              status: "success",
                              endpoint: "/v1/entity/risk-profile",
                              query: { entity_id: "ID-MINING-CO-1" },
                              data: {
                                entity_name: "Bumi Minerals Tbk.",
                                registered_jurisdiction: "Indonesia",
                                risk_indices: {
                                  tbml_score: 12.0,
                                  price_manipulation_ratio: 1.02,
                                  offshore_proximity: "LOW"
                                },
                                beneficial_owners: [
                                  "Sovereign Trust Assets",
                                  "IDX Public Trading Floating"
                                ],
                                compliance_action: {
                                  quarantine_triggered: false,
                                  action: "ALLOW_ONBOARDING",
                                  reason: "Nominal domestic commercial registration node verified operating normally."
                                }
                              }
                            };
                          }
                        } else if (apiType === 'trace') {
                          responseBody = {
                            status: "success",
                            endpoint: "/v1/forensic/trace",
                            parameters: { invoice_id: playInvoiceId, trace_depth: "deep" },
                            analysis: {
                              associated_transaction: {
                                invoice_id: playInvoiceId,
                                raw_invoice_item: playInvoiceId === 'INV-2026-002' ? 'NICKEL' : playInvoiceId === 'INV-2026-003' ? 'LUXURY_WATCH' : 'GOLD',
                                declared_outflow: playInvoiceId === 'INV-2026-002' ? 18000000000 : playInvoiceId === 'INV-2026-003' ? 36600000000 : 4250000000
                              },
                              temporal_layering_correlation: {
                                account_id: playInvoiceId === 'INV-2026-002' ? 'SID-BMRI-1023' : playInvoiceId === 'INV-2026-003' ? 'SID-BBCA-7493' : 'SID-COMP-8302',
                                holder_identity: playInvoiceId === 'INV-2026-002' ? 'Pacific Horizon Venture account' : playInvoiceId === 'INV-2026-003' ? 'Bumi Minerals Investment Trust' : 'Gold Peak Capital Gate Acc',
                                capital_deposit_matching: playInvoiceId === 'INV-2026-002' ? 17500000000 : playInvoiceId === 'INV-2026-003' ? 1500000000 : 4000000000,
                                time_lag_seconds: playInvoiceId === 'INV-2026-002' ? 600 : playInvoiceId === 'INV-2026-003' ? 7200 : 900,
                                suspicious_layering_rating: playInvoiceId === 'INV-2026-002' || playInvoiceId === 'INV-2026-004' ? 'CRITICAL_TEMPORAL_GATEWAY_CORRELATION' : 'NOMINAL_STABLE_SPACING'
                              }
                            }
                          };
                        } else {
                          responseBody = {
                            status: "success",
                            endpoint: "/v1/network/mapping",
                            nodes: [
                              { id: "NODE-1", label: "Vanguard Corporate Services", type: "BVI_TRUST" },
                              { id: "NODE-2", label: "PT Prima Nominees ID", type: "Sovereign_Intermediary" },
                              { id: "NODE-3", label: "SID-COMP-8302 Pocket", type: "Securities_Portfolio" }
                            ],
                            links: [
                              { source: "NODE-1", target: "NODE-2", link_type: "Nominee control agreement" },
                              { source: "NODE-2", target: "NODE-3", link_type: "Securities custody account financing" }
                            ]
                          };
                        }

                        setApiResponseJson(responseBody);
                        setTerminalFeed(prev => [
                          ...prev,
                          `[API CALL] Received encrypted request TLS 1.3: ${apiType === 'risk' ? 'GET /v1/entity/risk-profile' : apiType === 'trace' ? 'POST /v1/forensic/trace' : 'GET /v1/network/mapping'}`,
                          `[API AUTH] Token ${bridgeToken.substring(0, 16)}... VERIFIED via OpenID Connect (OIDC).`,
                          `[API RESPONSE] Dispatched secure evaluation, STATUS: 200 OK.`
                        ]);
                        setApiResultCode(200);
                        setApiLoading(false);
                      }, 1000);
                    }}
                    className="w-full mt-4 py-3 bg-[#DFFF00] hover:bg-[#deff9a] text-black font-black text-[10px] tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer font-sans"
                  >
                    {apiLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        QUERYING ENCRYPTED GATEWAY RES...
                      </>
                    ) : (
                      <>
                        <Terminal className="w-4 h-4" />
                        SEND SECURE ENCRYPTED TRIGGER
                      </>
                    )}
                  </button>
                </div>

                {/* Secure payload JSON viewer & terminal logs */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  
                  {/* JSON Playground response */}
                  <div className="bg-zinc-950 p-6 border border-zinc-900 border-dashed rounded-[2rem] flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-zinc-900/40 pb-3 mb-3">
                        <span className="text-[9px] font-mono font-extrabold text-[#deff9a] uppercase tracking-wider block">DECRYPTED RESPONSE PAYLOAD</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black ${apiResultCode === 200 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                          HTTP STATUS {apiResultCode} OK
                        </span>
                      </div>

                      <div className="bg-black/90 p-4 rounded-xl font-mono text-[9px] text-[#deff9a] overflow-y-auto max-h-[300px] custom-scrollbar">
                        <pre className="whitespace-pre-wrap select-all">{JSON.stringify(apiResponseJson, null, 2)}</pre>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end text-[7.5px] font-mono text-zinc-650 uppercase">
                      <span>Gateway encryption standard: AES-256-GCM / TLS 1.3 End-To-End</span>
                    </div>
                  </div>

                  {/* Terminal Log Output panel */}
                  <div className="bg-zinc-950 border border-zinc-905 p-4 rounded-2xl h-[160px] flex flex-col justify-between">
                    <div className="flex items-center gap-2 border-b border-zinc-900/60 pb-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      <span className="text-[8px] font-mono font-black text-white uppercase tracking-wider leading-none">VAM Bridge Container Log Monitor</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto font-mono text-[8.5px] text-zinc-400 space-y-1 custom-scrollbar">
                      {terminalFeed.slice().reverse().map((log, index) => (
                        <p key={index} className={log.includes('[SECURITY') ? 'text-amber-400' : log.includes('[API RESPONSE]') ? 'text-[#DFFF00]' : log.includes('[API CALL]') ? 'text-emerald-400' : 'text-zinc-500'}>
                          {log}
                        </p>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
