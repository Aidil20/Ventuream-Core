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
  Lock,
  Play,
  Pause,
  Check,
  ArrowRight,
  Bell,
  BellRing,
  Trash2,
  SlidersHorizontal
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

export interface PriceThreshold {
  id: string;
  itemId: string;        // "COAL", "NICKEL", "GOLD", "LUXURY_WATCH", "TECH_LICENSE"
  condition: 'ABOVE' | 'BELOW';
  value: number;
  active: boolean;
  lastTriggeredAt?: number;
}

export interface PriceTriggeredNotification {
  id: string;
  itemId: string;
  condition: 'ABOVE' | 'BELOW';
  targetValue: number;
  actualValue: number;
  timestamp: number;
  txId: string;
  read: boolean;
}

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
  channel?: 'BURSA_SID' | 'OTC_BILATERAL' | 'SWIFT_WIRE' | 'CRYPTO_LEDGER' | 'SHELL_TRANSFER';
  sender_entity?: string;
  recipient_entity?: string;
  hash_address?: string;
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
    unit_price: 1530000, 
    quantity: 1000,
    manifest_id: "MNF-COAL-1",
    seller_id: "ID-MINING-CO-1",
    seller_name: "Bumi Minerals Tbk.",
    origin: "Indonesia",
    channel: "BURSA_SID",
    sender_entity: "SID-BBCA-7493 Account Target",
    recipient_entity: "Bumi Minerals Clearing",
    hash_address: "IDX:REGS:COAL:1"
  },
  {
    id: "INV-2026-002",
    item_id: "NICKEL",
    commodity_name: "Battery-Grade High Nickel Matte",
    unit_price: 360000000, 
    quantity: 50,
    manifest_id: "MNF-NIC-82",
    seller_id: "BVI-TRUST-99", 
    seller_name: "Pacific Horizon Holdco BVI",
    origin: "British Virgin Islands",
    channel: "OTC_BILATERAL",
    sender_entity: "Pacific Horizon Holdco",
    recipient_entity: "PT Halmahera Industrial Nickel",
    hash_address: "0x39ba67...d981cf"
  },
  {
    id: "INV-2026-003",
    item_id: "LUXURY_WATCH",
    commodity_name: "Premium Swiss Tourbillon Chrono",
    unit_price: 305000000,
    quantity: 120,
    manifest_id: "MNF-WATCH-DUMMY", 
    seller_id: "ID-DISTRIB-WATCH",
    seller_name: "Nusantara Luxury Importers Tbk.",
    origin: "Switzerland",
    channel: "SWIFT_WIRE",
    sender_entity: "Swiss Luxury Agent GmbH",
    recipient_entity: "Nusantara Premium Importers",
    hash_address: "SWIFT:DEUTDEDD:TX-103"
  },
  {
    id: "INV-2026-004",
    item_id: "GOLD",
    commodity_name: "24K Refined Fine Gold Bars",
    unit_price: 850000, 
    quantity: 5000,
    manifest_id: "MNF-GOLD-5",
    seller_id: "SEY-SHELL-7", 
    seller_name: "Gold Peak Venture Ltd.",
    origin: "Seychelles",
    channel: "SHELL_TRANSFER",
    sender_entity: "Gold Peak Venture Ltd (Seychelles)",
    recipient_entity: "PT Capital Gate Nominee",
    hash_address: "IBAN:SEYCSY99:CAPGIDA1"
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

const REALTIME_TRANSACTION_TEMPLATES: InvoiceData[] = [
  {
    id: "TX-OTC-812",
    item_id: "NICKEL",
    commodity_name: "OTC Physical Nickel Bilateral Swap (Direct Contract)",
    unit_price: 380000000, 
    quantity: 120,
    manifest_id: "MNF-NIC-82",
    seller_id: "BVI-TRUST-99",
    seller_name: "BVI Shell Resource Ltd.",
    origin: "British Virgin Islands",
    channel: "OTC_BILATERAL",
    sender_entity: "BVI Smelter Corp",
    recipient_entity: "Indo Nickel Smelter Tbk",
    hash_address: "0xbf2d1e99c1584...83bc"
  },
  {
    id: "SWIFT-4091",
    item_id: "GOLD",
    commodity_name: "Direct SWIFT MT103 Bank Capital Flight",
    unit_price: 610000, 
    quantity: 8000,
    manifest_id: "MNF-GOLD-5",
    seller_id: "SEY-SHELL-7",
    seller_name: "Seychelles Apex Trust",
    origin: "Seychelles",
    channel: "SWIFT_WIRE",
    sender_entity: "Cayman Trust LLC",
    recipient_entity: "Capital Markets Broker Ltd",
    hash_address: "SWIFT:SEYCSY99"
  },
  {
    id: "CRYP-7302",
    item_id: "LUXURY_WATCH",
    commodity_name: "Direct ERC-20 Escrow Payment Settlement",
    unit_price: 520000000, 
    quantity: 50,
    manifest_id: "MNF-WATCH-DUMMY",
    seller_id: "BVI-TRUST-99",
    seller_name: "Vanguard Trust Proxy",
    origin: "Cayman Islands",
    channel: "CRYPTO_LEDGER",
    sender_entity: "BVI Trust Wallets 0x8a",
    recipient_entity: "Cayman Nominee Address 0x22",
    hash_address: "0x8fa9...c2ef73"
  },
  {
    id: "BURSA-BMRI-92",
    item_id: "TECH_LICENSE",
    commodity_name: "Sovereign Exchange Share Liquidity Inflow",
    unit_price: 50000000,
    quantity: 200,
    manifest_id: "MNF-SEC-BURSA",
    seller_id: "ID-MINING-CO-1",
    seller_name: "Nusantara Markets Clearing",
    origin: "Indonesia",
    channel: "BURSA_SID",
    sender_entity: "SID-COMP-8302 Account Tracker",
    recipient_entity: "CGS-CIMB Clearing House",
    hash_address: "IDX:REGS:BMRI"
  },
  {
    id: "SH-XFER-229",
    item_id: "COAL",
    commodity_name: "Capital Flight Offshore Trust Distribution",
    unit_price: 2800000,
    quantity: 500,
    manifest_id: "MNF-COAL-1",
    seller_id: "CAY-CORP-404",
    seller_name: "Panama Asset Management",
    origin: "Panama",
    channel: "SHELL_TRANSFER",
    sender_entity: "BVI-TRUST-99 Sub-account",
    recipient_entity: "PT Prima Nominees Acc 83",
    hash_address: "IBAN:DE3429810"
  }
];

export interface StandardDataModel {
  origin_channel: 'PERBANKAN' | 'BURSA_SID' | 'BEA_CUKAI' | 'KEMENKUMHAM';
  transaction_id: string;
  timestamp: string;
  item_name: string;
  item_id: string;
  sender_entity: string;
  recipient_entity: string;
  unit_price: number;
  quantity: number;
  total_value: number;
  matched_ubo_names: string[];
  jurisdiction_route: string;
  baseline_deviation_percentage: number;
  suspicious_rating: 'CRITICAL_RISK' | 'SUSPICIOUS_MAPPED' | 'NOMINAL_STABLE';
}

const SOURCES_RAW_PRESETS = {
  BEA_CUKAI: `<Manifest BeaCukai="BC1.1" ID="BC-COAL-998">
  <Header KPPBC="Tanjung Priok" TglRencanaKedatangan="2026-05-12"/>
  <Barang HS="2701.12.90" Desc="Thermal Coal (Gar 4200)" MassQty="1250" Unit="mton">
    <Eksportir PT="Bumi Minerals Clearing Tbk" SID="ID-MINING-CO-1"/>
    <Importir Name="Pacific Horizon Venture Corp" Country="British Virgin Islands"/>
    <Finansial UnitPriceIDR="1490000" Currency="IDR" TotalNilai="1862500000"/>
  </Barang>
</Manifest>`,

  PERBANKAN: `:20: TRANSACTION REFERENCE
TX-SWIFT-99120
:32A: DATE & VALUE
Val Date: 260520, Currency: IDR, Amount: 18000000000
:50K: SENDER CUSTOMER
PT Halmahera Industrial Nickel
Jakarta, Indonesia
:59: BENEFICIARY CUSTOMER
BVI Trust Wallets 0x8a (Shell Acc)
Road Town, British Virgin Islands
:70: REMITTANCE DETAILS
Payment physical nickel barter bilat spot swap agreement ref #99`,

  BURSA_SID: `{
  "BursaEfekIndonesia": {
    "TransactionID": "BEI-SEC-721",
    "ClearingHouse": "KPEI",
    "ClearingDate": "2026-05-22T10:15:30Z",
    "Security": "NICKEL",
    "InvestorDetails": {
      "SingleInvestorID": "SID-COMP-8302",
      "Name": "Bumi Minerals Clearing Account Target",
      "BrokerID": "CGS-CIMB"
    },
    "Action": "CAPITAL_INFLOW_SHARE_DEPOSIT",
    "ValueIDR": 27200000000,
    "SecuritiesVolume": 85000
  }
}`,

  KEMENKUMHAM: `<AHU_Sistem_Administrasi_Badan_Hukum ID="AHU-009812-PT" Tanggal="2026-03-10">
  <BadanHukum NamaPT="PT Halmahera Industrial Nickel" Status="Aktif"/>
  <ModalDasar Nominal="Rp 500.000.000.000"/>
  <PemegangSaham>
    <Saham UBO="Pacific Horizon Venture Ltd (BVI)" Kepemilikan="74%"/>
    <Saham UBO="Sovereign Nominee Group" Kepemilikan="26%"/>
  </PemegangSaham>
  <DaftarDeed AktaPendirian="No. 12 Tanggal 2026-01-15 Notaris Anton, SH"/>
</AHU_Sistem_Administrasi_Badan_Hukum>`
};

export default function VamRadarTbml() {
  const [activeSubTab, setActiveSubTab] = useState<'RADAR' | 'SANDBOX' | 'CORRELATOR' | 'GNNSYSTEM' | 'DEPLOY' | 'DATA_STANDARD' | 'SAR_INTEL' | 'ITM_INDICATORS' | 'DNS_INTEL' | 'VIU_TRANSMITTED'>('RADAR');

  // GNN & PEP EXTRA HIGH FIDELITY INTERACTIVE STATES
  const [pepAuditCompleted, setPepAuditCompleted] = useState<boolean>(false);
  const [gnnClusteringCompleted, setGnnClusteringCompleted] = useState<boolean>(false);
  const [isProcessingPepAudit, setIsProcessingPepAudit] = useState<boolean>(false);
  const [isProcessingGnnClustering, setIsProcessingGnnClustering] = useState<boolean>(false);

  // VIU / FIU TRANSMISSION LOG ENGINE STATE
  const [selectedViuRecordTicketId, setSelectedViuRecordTicketId] = useState<string>("PPATK-LTKM-2026-6129");
  const [viuTransmittedRecords, setViuTransmittedRecords] = useState<any[]>([
    {
      ticketId: "PPATK-LTKM-2026-6129",
      timestamp: "2026-05-23T08:14:10Z",
      alertId: "AL-SH-INV-SANDBOX-99",
      ubo: "Pacific Horizon Venture Ltd (BVI)",
      entityName: "PT Halmahera Industrial Nickel",
      severity: "CRITICAL",
      route: "ID -> BVI -> SINGAPORE -> MONGOLIA",
      xmlHash: "sha256-78e10398f5a28392fb2c0d87d8f303ea00ebd8391745499cf8e10398f5a28392",
      text: "VAM DIGITAL CORRELATION DISCOVERY REPORT\n=========================================\n\nAUDIT TARGET: PT Halmahera Industrial Nickel\nBENEFICIAL OWNER (UBO): Pacific Horizon Venture Ltd (BVI)\nHOLDING STRUCTURE: Shell Proxy Network under Nominee Trusteeship\nREPORT REF ID: PPATK-LTKM-2026-6129\n\nFLAGGED TRANSACTIONS:\n1. Invoice #INV-SANDBOX-99 (Coal Over-Invoicing 66% Divergence)\n2. Temporal Banking Layering (ASN Andi P. receiving IDR 36.6B under tight 15-minute delta)\n\nSTATUTORY WARNING:\nSovereign audit stream engaged under FATF Recommendation 24."
    },
    {
      ticketId: "PPATK-LTKM-2026-9281",
      timestamp: "2026-05-21T14:48:30Z",
      alertId: "AL-CRYP-TX-9102",
      ubo: "Sovereign Nominee Group",
      entityName: "PT Sumatera Ore Mining",
      severity: "HIGH",
      route: "ID -> MALAYSIA -> SEYCHELLES (Offshore Node)",
      xmlHash: "sha256-e810398f5a28392fb2c0d87d8f303ea00ebd8391745499cf8e103sha25692d4",
      text: "TRANSACTION INTEGRITY REPORT\n============================\n\nAUDIT TARGET: PT Sumatera Ore Mining\nBENEFICIAL OWNER (UBO): Sovereign Nominee Group\nHOLDING STRUCTURE: Private Equity Trust Layering\n\nFLAGGED TRANSACTIONS:\n1. On-ledger crypto settlement bypassing standard domestic clearing nodes.\n\nSTATUTORY WARNING:\nOffshore shadow registration patterns trace to bulletproof ASN."
    }
  ]);

  // DNS & REGISTRY INTELLIGENCE FORENSICS STATE
  const [dnsInputDomain, setDnsInputDomain] = useState<string>('bvi-shell-partners.co.vg');
  const [isDnsScraping, setIsDnsScraping] = useState<boolean>(false);
  const [dnsScrapedResult, setDnsScrapedResult] = useState<any>(null);
  const [dnsLogFeed, setDnsLogFeed] = useState<string[]>([]);
  const [isKominfoBlocking, setIsKominfoBlocking] = useState<boolean>(false);
  const [blockedDomains, setBlockedDomains] = useState<string[]>([]);
  const [dnsHistory, setDnsHistory] = useState<any[]>([
    {
      domain: "bvi-shell-partners.co.vg",
      fatf_aml_risk_score: 85,
      fatf_aml_risk_rating: "CRITICAL RISK / PROBABLE SHELL VEHICLE",
      hosting_provider: "Alexhost S.R.L (Offshore Bulletproof Server Layer)",
      country_of_origin: "Republic of Moldova / Seychelles Proxy",
      bulletproof_stealth: true,
      domain_age: "2 months, 12 days (Newly registered before tender)",
      email_capability: false,
      ip_addresses: ["185.150.117.42"]
    },
    {
      domain: "lpse.kemenkeu.go.id",
      fatf_aml_risk_score: 5,
      fatf_aml_risk_rating: "LOW RISK / TRUSTED",
      hosting_provider: "Pusat Data Nasional (PDN) Indonesia",
      country_of_origin: "Indonesia",
      bulletproof_stealth: false,
      domain_age: "8+ years (Government Entity)",
      email_capability: true,
      ip_addresses: ["103.3.46.21"]
    },
    {
      domain: "sumatera-ore-mining.net",
      fatf_aml_risk_score: 75,
      fatf_aml_risk_rating: "CRITICAL RISK / PROBABLE SHELL VEHICLE",
      hosting_provider: "Shinjiru Bulletproof Hosting Ltd (Penang Offshore Node)",
      country_of_origin: "Belize / Malaysia Offshore Exchange",
      bulletproof_stealth: true,
      domain_age: "14 days (Ultra-recent ghost registry)",
      email_capability: false,
      ip_addresses: ["202.162.24.11"]
    }
  ]);

  // ITM COMPLIANCE ENGINE STATE
  const [itmSelectedCategory, setItmSelectedCategory] = useState<'ALL' | 'KATEGORI_1' | 'KATEGORI_2' | 'KATEGORI_3' | 'KATEGORI_4'>('ALL');
  const [itmSelectedTriggers, setItmSelectedTriggers] = useState<string[]>(['Newborn Winner', 'The PEP-Family Nexus', 'Capital-Revenue Imbalance']);
  const [itmSelectedPriorityRow, setItmSelectedPriorityRow] = useState<string | null>(null);
  const [itmCustomThreshold, setItmCustomThreshold] = useState<number>(80);
  const [itmWorkflowLevel, setItmWorkflowLevel] = useState<1 | 2 | 3>(1);
  const [itmRuleWeights, setItmRuleWeights] = useState<Record<string, number>>({
    "The Single Runner": 35,
    "Newborn Winner": 40,
    "Address-in-Common": 35,
    "Patterned Bidder": 25,
    "Fast-Track Award": 30,
    "The Dormant-to-Active Spike": 45,
    "Capital-Revenue Imbalance": 30,
    "Circular Trading": 35,
    "Layering Pattern": 40,
    "The PEP-Family Nexus": 50,
    "The Revolving Door": 40,
    "Asset Mismatch": 45,
    "Price Out-of-Range": 30,
    "High-Volume Small-Market": 25,
  });
  const [itmFilterSearch, setItmFilterSearch] = useState<string>('');

  // DATA STANDARDISATION HUB STATE
  const [selectedDataSource, setSelectedDataSource] = useState<'PERBANKAN' | 'BURSA_SID' | 'BEA_CUKAI' | 'KEMENKUMHAM'>('BEA_CUKAI');
  const [rawInputPayload, setRawInputPayload] = useState<string>(SOURCES_RAW_PRESETS.BEA_CUKAI);
  const [ingestionLogs, setIngestionLogs] = useState<string[]>([]);
  const [standardizedOutput, setStandardizedOutput] = useState<StandardDataModel | null>(null);
  const [isProcessingStandard, setIsProcessingStandard] = useState(false);
  const [hasInjectedStandard, setHasInjectedStandard] = useState(false);

  // AI-POWERED SAR STATE
  const [selectedSarAlertId, setSelectedSarAlertId] = useState<string>('');
  const [sarDraftText, setSarDraftText] = useState<string>('');
  const [isGeneratingSar, setIsGeneratingSar] = useState(false);
  const [sarReportSubmitted, setSarReportSubmitted] = useState(false);
  const [sarReportFormat, setSarReportFormat] = useState<'LTKM-PPATK-01' | 'STANDARD-ISO-20022'>('LTKM-PPATK-01');

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

  // PRICE THRESHOLD ALERT SYSTEM STATE
  const [priceThresholds, setPriceThresholds] = useState<PriceThreshold[]>([
    { id: 'THR-1', itemId: 'NICKEL', condition: 'ABOVE', value: 275000000, active: true },
    { id: 'THR-2', itemId: 'GOLD', condition: 'BELOW', value: 1100000, active: true },
    { id: 'THR-3', itemId: 'COAL', condition: 'ABOVE', value: 1650000, active: true }
  ]);
  const [priceNotifications, setPriceNotifications] = useState<PriceTriggeredNotification[]>([]);
  const [newAlertItemId, setNewAlertItemId] = useState<string>('NICKEL');
  const [newAlertCondition, setNewAlertCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [newAlertValue, setNewAlertValue] = useState<string>('260000000');
  const [thresholdTab, setThresholdTab] = useState<'MATRIX' | 'HISTORY'>('MATRIX');

  const priceThresholdsRef = React.useRef(priceThresholds);
  useEffect(() => {
    priceThresholdsRef.current = priceThresholds;
  }, [priceThresholds]);

  // Check custom price threshold limits and auto-spawn alert warning elements
  const checkPriceThresholds = (itemId: string, price: number, txId: string) => {
    const triggeredAlerts: PriceTriggeredNotification[] = [];
    const currentThresholds = priceThresholdsRef.current;

    const updatedThresholds = currentThresholds.map(t => {
      if (t.itemId === itemId && t.active) {
        const isAbove = t.condition === 'ABOVE' && price > t.value;
        const isBelow = t.condition === 'BELOW' && price < t.value;
        
        if (isAbove || isBelow) {
          const alreadyTriggeredRecently = t.lastTriggeredAt && (Date.now() - t.lastTriggeredAt < 5000); // 5 sec cooling down
          if (!alreadyTriggeredRecently) {
            const newNotif: PriceTriggeredNotification = {
              id: `PRC-NOTIF-${Math.floor(1000 + Math.random() * 8999)}`,
              itemId,
              condition: t.condition,
              targetValue: t.value,
              actualValue: price,
              timestamp: Date.now(),
              txId,
              read: false
            };
            triggeredAlerts.push(newNotif);
            return { ...t, lastTriggeredAt: Date.now() };
          }
        }
      }
      return t;
    });

    // Check if any thresholds were modified or triggered
    let changed = false;
    for (let i = 0; i < currentThresholds.length; i++) {
      if (updatedThresholds[i].lastTriggeredAt !== currentThresholds[i].lastTriggeredAt) {
        changed = true;
        break;
      }
    }

    if (changed) {
      setPriceThresholds(updatedThresholds);
    }

    if (triggeredAlerts.length > 0) {
      setPriceNotifications(prev => [
        ...triggeredAlerts,
        ...prev
      ].slice(0, 30));

      triggeredAlerts.forEach(notif => {
        const condSymbol = notif.condition === 'ABOVE' ? '>' : '<';
        setTerminalFeed(prev => [
          `[🚨 PRICE ALARM] ${notif.itemId} has crossed limit of Rp ${notif.targetValue.toLocaleString('id-ID')} (${notif.actualValue.toLocaleString('id-ID')} ${condSymbol} Rp ${notif.targetValue.toLocaleString('id-ID')}). Traced on ID: ${notif.txId}`,
          ...prev
        ].slice(0, 30));
      });
    }
  };

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
  const [realtimeScanActive, setRealtimeScanActive] = useState(true);
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<'ALL' | 'BURSA_SID' | 'OTC_BILATERAL' | 'SWIFT_WIRE' | 'CRYPTO_LEDGER' | 'SHELL_TRANSFER'>('ALL');

  const [invoices, setInvoices] = useState<InvoiceData[]>(SEED_INVOICES);
  const [bankLogs, setBankLogs] = useState<BankingLog[]>(SEED_BANK_LOGS);
  const [sidActivities, setSidActivities] = useState<SIDActivity[]>(SEED_SID_ACTIVITIES);
  const [alerts, setAlerts] = useState<TBMLAlert[]>([]);
  const [auditedLogsCount, setAuditedLogsCount] = useState(128);
  const [recentScanLoading, setRecentScanLoading] = useState(false);

  // PEP-Linkage Integrity Engine State Variables
  const [gnnViewMode, setGnnViewMode] = useState<'GRAPH' | 'PEPLINK'>('GRAPH');
  const [pepAnonymize, setPepAnonymize] = useState<boolean>(true);
  const [pepFuzzyMatching, setPepFuzzyMatching] = useState<boolean>(true);
  const [pepQueryCompany, setPepQueryCompany] = useState<string>('PT Samudra Ore Mining');
  const [pepQueryAhuOwner, setPepQueryAhuOwner] = useState<string>('Hendra Prayoga');
  const [pepQueryFamilyLink, setPepQueryFamilyLink] = useState<string>('Bambang Prayoga');
  const [pepFamilyRelationType, setPepFamilyRelationType] = useState<string>('Aparatur Sipil / Kakak Kandung');
  const [pepQueryPepPosition, setPepQueryPepPosition] = useState<string>('Direktur Jenderal Pertambangan Minerba');
  const [pepQueryProcurementDept, setPepQueryProcurementDept] = useState<string>('Direktorat Jenderal Minerba');
  const [pepQueryHasTenderWon, setPepQueryHasTenderWon] = useState<boolean>(true);
  const [pepQueryTenderWorth, setPepQueryTenderWorth] = useState<number>(55000000000); // 55 Miliar
  const [pepRiskScore, setPepRiskScore] = useState<number | null>(null);
  const [pepMatchedLinks, setPepMatchedLinks] = useState<{type: string; label: string; details: string; severity: 'HIGH' | 'MEDIUM' | 'LOW'}[]>([]);
  const [isPepScanning, setIsPepScanning] = useState<boolean>(false);
  const [pepAuditLogs, setPepAuditLogs] = useState<{ id: string; timestamp: string; operator: string; target: string; action: string; status: string }[]>([
    { id: 'AUD-PEP-9201', timestamp: '2026-05-23T04:12:00Z', operator: 'aidilsyahdan2000@gmail.com', target: 'PT Halmahera Industrial Nickel', action: 'PEP Core Graph Traversal', status: 'ALERT_CONFIRMED' },
    { id: 'AUD-PEP-8839', timestamp: '2026-05-23T01:30:15Z', operator: 'aidilsyahdan2000@gmail.com', target: 'CV Papua Gold Prosperous', action: 'Three-Way Matching Scan', status: 'CLEARED' },
    { id: 'AUD-PEP-7651', timestamp: '2026-05-22T19:44:10Z', operator: 'system-scheduler', target: 'PT Mahakarya Mine Estate', action: 'LHKPN Automatic Cross-Ref', status: 'HIGH_RISK_AUDITED' }
  ]);

  const handleRunPepLinkageScan = () => {
    setIsPepScanning(true);
    setPepRiskScore(null);
    setPepMatchedLinks([]);
    
    setTimeout(() => {
      let score = 0;
      const links: {type: string; label: string; details: string; severity: 'HIGH' | 'MEDIUM' | 'LOW'}[] = [];
      
      // 1. Direct Ownership Check (AHU)
      const beneficialOwners = [pepQueryAhuOwner.trim()];
      for (const owner of beneficialOwners) {
        if (owner.toLowerCase() === "bambang prayoga" || owner.toLowerCase().includes("pep") || owner.toLowerCase().includes("pejabat")) {
          score += 60;
          links.push({
            type: "Direct PEP Ownership",
            label: owner,
            details: `Pemeriksa sistem menemukan "${owner}" terdaftar langsung sebagai UBO/pemilik saham mayoritas di akta AHU Kemenkumham.`,
            severity: "HIGH"
          });
        }
      }
      
      // 2. Indirect Ownership/Family Link (Graph Traversal)
      if (pepQueryFamilyLink.trim().length > 0) {
        score += 50;
        links.push({
          type: "Family PEP Connection",
          label: `${pepQueryFamilyLink} (${pepFamilyRelationType})`,
          details: `Ditemukan relasi keluarga tingkat-1 antara pemilik perusahaan (${pepQueryAhuOwner}) dengan pejabat publik aktif.`,
          severity: "HIGH"
        });
      }

      // 3. Procurement Conflict Check (The "Internal Government" Link)
      if (pepQueryHasTenderWon) {
        score += 40;
        links.push({
          type: "Tender Integrity Breach",
          label: `Procurement Conflict: ${pepQueryProcurementDept}`,
          details: `Perusahaan ${pepQueryCompany} memenangkan tender bernilai Rp ${(pepQueryTenderWorth / 1e9).toFixed(1)} Miliar pada kementerian/dinas tempat relasi keluarga menjabat (${pepQueryPepPosition}).`,
          severity: "HIGH"
        });
      }

      const finalScore = Math.min(score, 100);
      setPepRiskScore(finalScore);
      setPepMatchedLinks(links);
      setIsPepScanning(false);

      // Append persistent immutable audit log entry
      const newAuditLog = {
        id: `AUD-PEP-${Math.floor(1000 + Math.random() * 8999)}`,
        timestamp: new Date().toISOString(),
        operator: 'aidilsyahdan2000@gmail.com',
        target: pepQueryCompany,
        action: `Three-Way Match Scan (Score: ${finalScore}/100)`,
        status: finalScore > 80 ? 'HIGH_RISK_AUDITED' : finalScore > 40 ? 'MEDIUM_WARNING' : 'CLEARED'
      };
      setPepAuditLogs(prev => [newAuditLog, ...prev]);
    }, 1200);
  };

  useEffect(() => {
    if (!realtimeScanActive) return;

    const interval = setInterval(() => {
      // Pick a random template from REALTIME_TRANSACTION_TEMPLATES
      const template = REALTIME_TRANSACTION_TEMPLATES[Math.floor(Math.random() * REALTIME_TRANSACTION_TEMPLATES.length)];
      
      const randomSuffix = Math.floor(1000 + Math.random() * 8999).toString();
      const newTxId = `${template.id.split('-')[0]}-${randomSuffix}`;
      const randomDeviation = (Math.random() * 0.44 - 0.22); // dynamic baseline variance
      const originalBaseline = GLOBAL_PRICE_BASELINE[template.item_id] || 1500000;
      const calculatedPrice = Math.round(originalBaseline * (1 + randomDeviation));

      // 50% chance of high risk shell involvement for interesting charts / alert spawns
      let finalSellerId = template.seller_id;
      let finalOrigin = template.origin;
      let finalSellerName = template.seller_name;
      if (Math.random() > 0.5) {
        finalSellerId = "BVI-TRUST-99";
        finalOrigin = "British Virgin Islands";
        finalSellerName = "Pacific Horizon Venture Corp";
      }

      const generatedTx: InvoiceData = {
        ...template,
        id: newTxId,
        unit_price: calculatedPrice,
        seller_id: finalSellerId,
        seller_name: finalSellerName,
        origin: finalOrigin,
      };

      // Also generate a matching bank log sometimes to keep the temporal engine fueled
      const generatedBankLog: BankingLog = {
        transaction_id: `TX-BANK-${randomSuffix}`,
        invoice_id: newTxId,
        amount: calculatedPrice * template.quantity,
        sender_bank_routing: template.origin === "British Virgin Islands" ? "BVI Offshore Trust (BVIOTB99)" : "Generali Bank Geneva (SWISCH2Z)",
        recipient_bank_routing: "BCA Gajah Mada Jakarta (CENKIDJA)",
        seller_id: finalSellerId,
        timestamp: Date.now()
      };

      // Also generate matching SID activity sometimes
      const generatedSid: SIDActivity = {
        sid_id: `SID-WAVE-${randomSuffix}`,
        investor_name: `${template.sender_entity || 'Global Participant'} Nominee Proxy`,
        amount_deposited: calculatedPrice * template.quantity,
        timestamp: Date.now() + 120 * 1000 // 2 minutes difference to guarantee a temporal correlation match
      };

      setInvoices(prev => [generatedTx, ...prev].slice(0, 30));
      setBankLogs(prev => [generatedBankLog, ...prev].slice(0, 35));
      if (Math.random() > 0.4) {
        setSidActivities(prev => [generatedSid, ...prev].slice(0, 30));
      }

      // Check configured custom price threshold alarms on new generated prices
      checkPriceThresholds(template.item_id, calculatedPrice, newTxId);

      setAnimatedMarketPrices(prev => {
        const history = prev[template.item_id] || [];
        const nextTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newPoint = {
          date: nextTime,
          price: calculatedPrice,
          volume: Math.round(template.quantity * (0.8 + Math.random() * 0.4)),
          minPrice: Math.round(calculatedPrice * 0.95),
          maxPrice: Math.round(calculatedPrice * 1.05)
        };
        const updated = [...history, newPoint].slice(-10);
        return {
          ...prev,
          [template.item_id]: updated
        };
      });

      setAuditedLogsCount(prev => prev + 1);

      // Log actions inside terminal Feed
      const channelLabel = template.channel ? template.channel.replace('_', ' ') : 'CORE';
      setTerminalFeed(prev => [
        `[${channelLabel}] Real-time tracking engaged on ID: ${newTxId} | Routing: ${generatedTx.sender_entity} -> ${generatedTx.recipient_entity} | Status: AUDITED`,
        ...prev
      ].slice(0, 20));

    }, 4000);

    return () => clearInterval(interval);
  }, [realtimeScanActive]);

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

  const [selectedChartAsset, setSelectedChartAsset] = useState<string>('COAL');
  const [animatedMarketPrices, setAnimatedMarketPrices] = useState<Record<string, { date: string; price: number; volume: number; minPrice: number; maxPrice: number }[]>>({
    "COAL": [
      { date: "05-01", price: 1480000, volume: 12000, minPrice: 1420000, maxPrice: 1550000 },
      { date: "05-08", price: 1512000, volume: 15000, minPrice: 1450000, maxPrice: 1580000 },
      { date: "05-15", price: 1465000, volume: 11000, minPrice: 1400000, maxPrice: 1520000 },
      { date: "05-22", price: 1530000, volume: 18000, minPrice: 1480000, maxPrice: 1600000 },
      { date: "05-29", price: 1510000, volume: 14000, minPrice: 1440000, maxPrice: 1590000 },
      { date: "06-05", price: 1495000, volume: 22000, minPrice: 1410000, maxPrice: 1540000 },
      { date: "06-12", price: 1530000, volume: 25000, minPrice: 1460000, maxPrice: 1610000 }
    ],
    "NICKEL": [
      { date: "05-01", price: 242000000, volume: 450, minPrice: 238000000, maxPrice: 248000000 },
      { date: "05-08", price: 251000000, volume: 620, minPrice: 245000000, maxPrice: 256000000 },
      { date: "05-15", price: 248500000, volume: 510, minPrice: 240000000, maxPrice: 253000000 },
      { date: "05-22", price: 256000000, volume: 750, minPrice: 249000000, maxPrice: 262000000 },
      { date: "05-29", price: 261200000, volume: 830, minPrice: 254000000, maxPrice: 268000000 },
      { date: "06-05", price: 258000000, volume: 680, minPrice: 250000000, maxPrice: 264000000 },
      { date: "06-12", price: 264500000, volume: 910, minPrice: 258000000, maxPrice: 272000000 }
    ],
    "GOLD": [
      { date: "05-01", price: 1185000, volume: 45000, minPrice: 1170000, maxPrice: 1210000 },
      { date: "05-08", price: 1198000, volume: 55000, minPrice: 1180000, maxPrice: 1220000 },
      { date: "05-15", price: 1215000, volume: 49000, minPrice: 1195000, maxPrice: 1240000 },
      { date: "05-22", price: 1222000, volume: 61000, minPrice: 1205000, maxPrice: 1250000 },
      { date: "05-29", price: 1208000, volume: 53000, minPrice: 1190000, maxPrice: 1235000 },
      { date: "06-05", price: 1218000, volume: 70000, minPrice: 1200000, maxPrice: 1245000 },
      { date: "06-12", price: 1225000, volume: 82000, minPrice: 1210000, maxPrice: 1255000 }
    ],
    "LUXURY_WATCH": [
      { date: "05-01", price: 295000000, volume: 15, minPrice: 290000000, maxPrice: 305000000 },
      { date: "05-08", price: 298000000, volume: 18, minPrice: 292000000, maxPrice: 308000000 },
      { date: "05-15", price: 302000000, volume: 22, minPrice: 295000000, maxPrice: 312000000 },
      { date: "05-22", price: 299000000, volume: 14, minPrice: 294050000, maxPrice: 306000000 },
      { date: "05-29", price: 305000000, volume: 25, minPrice: 298000000, maxPrice: 315000000 },
      { date: "06-05", price: 301000000, volume: 20, minPrice: 296000000, maxPrice: 310000000 },
      { date: "06-12", price: 308000000, volume: 30, minPrice: 301000000, maxPrice: 318000000 }
    ],
    "TECH_LICENSE": [
      { date: "05-01", price: 49500000, volume: 120, minPrice: 48000000, maxPrice: 51000000 },
      { date: "05-08", price: 50200000, volume: 145, minPrice: 49000000, maxPrice: 52000000 },
      { date: "05-15", price: 49800000, volume: 130, minPrice: 48500000, maxPrice: 51500000 },
      { date: "05-22", price: 50800000, volume: 160, minPrice: 49500000, maxPrice: 53000000 },
      { date: "05-29", price: 50500000, volume: 155, minPrice: 49000000, maxPrice: 52500000 },
      { date: "06-05", price: 51200000, volume: 180, minPrice: 50000000, maxPrice: 53500000 },
      { date: "06-12", price: 51900000, volume: 210, minPrice: 50500000, maxPrice: 54500000 }
    ]
  });

  // helper function to pre-fill sandbox transaction order based on triggering alerts
  const handleQuickTrade = (notif: PriceTriggeredNotification) => {
    setActiveSubTab('SANDBOX');
    setSbItemId(notif.itemId);
    
    let defaultName = 'Custom Asset Shipment';
    let defaultUnitPrice = notif.actualValue.toString();
    let defaultQty = '1000';
    let defaultManifest = `MNF-${notif.itemId}-QT`;
    
    if (notif.itemId === 'COAL') {
      defaultName = 'Premium Steam Grade Coal Met';
      defaultQty = '1000';
      defaultManifest = 'MNF-COAL-1';
    } else if (notif.itemId === 'NICKEL') {
      defaultName = 'Purified Refined Nickel Plates';
      defaultQty = '150';
      defaultManifest = 'MNF-NIC-82';
    } else if (notif.itemId === 'GOLD') {
      defaultName = 'Fine Bullion Bar Refined Gold';
      defaultQty = '2000';
      defaultManifest = 'MNF-GOLD-5';
    } else if (notif.itemId === 'LUXURY_WATCH') {
      defaultName = 'Vanguard Chronology Elite Chrono';
      defaultQty = '5';
      defaultManifest = 'MNF-WATCH-10';
    }
    
    setSbCommodityName(defaultName);
    setSbUnitPrice(defaultUnitPrice);
    setSbQuantity(defaultQty);
    setSbInvoiceId(`QT-INV-${notif.itemId}-${Date.now().toString().slice(-4)}`);
    setSbManifestId(defaultManifest);
    setSbSellerId('QT-VENDOR-99');
    setSbSellerName('VAM Algorithmic Market Liquidity Agency');
    setSbOrigin('Sovereign Exchange Node');
    setSbSidActivityMinutes('1');
    setSbSidAmount((notif.actualValue * parseFloat(defaultQty)).toString());

    setTerminalFeed(prev => [
      `[QUICK-TRADE] Pre-loaded parameters into Sandbox: ${notif.itemId} | Unit Price: Rp ${notif.actualValue.toLocaleString('id-ID')} | Status: DRAF`,
      ...prev
    ]);

    setTimeout(() => {
      const element = document.getElementById('tbml-sandbox-view');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Drag and Drop File import handler
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      
      setTerminalFeed(prev => [
        `[DRAG-DROP] Membaca berkas ${file.name} (${(file.size / 1024).toFixed(1)} KB)...`,
        ...prev
      ]);

      try {
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (parsed.id || parsed.invoice_id) setSbInvoiceId(parsed.id || parsed.invoice_id);
          if (parsed.item_id) setSbItemId(parsed.item_id);
          if (parsed.commodity_name) setSbCommodityName(parsed.commodity_name);
          if (parsed.quantity) setSbQuantity(parsed.quantity.toString());
          if (parsed.unit_price) setSbUnitPrice(parsed.unit_price.toString());
          if (parsed.manifest_id) setSbManifestId(parsed.manifest_id);
          if (parsed.seller_id) setSbSellerId(parsed.seller_id);
          if (parsed.seller_name) setSbSellerName(parsed.seller_name);
          if (parsed.origin) setSbOrigin(parsed.origin);
          
          setTerminalFeed(prev => [
            `[DRAG-DROP] Sukses mengurai struktur JSON. Field parameter Sandbox otomatis terkonfigurasi.`,
            ...prev
          ]);
        } else {
          const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
          if (lines.length > 0) {
            const firstLine = lines[0];
            if (firstLine.includes(',')) {
              const headers = firstLine.split(',').map(h => h.trim().toLowerCase());
              if (lines.length > 1) {
                const values = lines[1].split(',').map(v => v.trim());
                headers.forEach((h, idx) => {
                  const val = values[idx];
                  if (!val) return;
                  if (h === 'id' || h === 'invoice_id' || h === 'invoiceid') setSbInvoiceId(val);
                  if (h === 'item_id' || h === 'itemid') setSbItemId(val.toUpperCase());
                  if (h === 'commodity_name' || h === 'commodity') setSbCommodityName(val);
                  if (h === 'quantity' || h === 'qty') setSbQuantity(val);
                  if (h === 'unit_price' || h === 'price') setSbUnitPrice(val);
                  if (h === 'manifest_id' || h === 'manifestid') setSbManifestId(val);
                  if (h === 'seller_id' || h === 'sellerid') setSbSellerId(val);
                  if (h === 'seller_name' || h === 'seller') setSbSellerName(val);
                  if (h === 'origin' || h === 'country') setSbOrigin(val);
                });
                setTerminalFeed(prev => [
                  `[DRAG-DROP] Sukses mendecoder berkas CSV. Menyelaraskan baris data penipuan dagang.`,
                  ...prev
                ]);
              }
            } else {
              lines.forEach(line => {
                const parts = line.split(/[:=]/);
                if (parts.length === 2) {
                  const k = parts[0].trim().toLowerCase();
                  const v = parts[1].trim().replace(/['"']/g, '');
                  if (k === 'id' || k === 'invoice_id') setSbInvoiceId(v);
                  if (k === 'item_id' || k === 'itemid') setSbItemId(v.toUpperCase());
                  if (k === 'commodity_name' || k === 'commodity') setSbCommodityName(v);
                  if (k === 'quantity' || k === 'qty') setSbQuantity(v);
                  if (k === 'unit_price' || k === 'price') setSbUnitPrice(v);
                  if (k === 'manifest_id' || k === 'manifest') setSbManifestId(v);
                  if (k === 'seller_id' || k === 'sellerid') setSbSellerId(v);
                  if (k === 'seller_name' || k === 'seller') setSbSellerName(v);
                  if (k === 'origin') setSbOrigin(v);
                }
              });
              setTerminalFeed(prev => [
                `[DRAG-DROP] Sukses mengekstrak parameter dari format TXT terstruktur.`,
                ...prev
              ]);
            }
          }
        }
      } catch (err) {
        console.error(err);
        setTerminalFeed(prev => [
          `[DATA-CORRUPT] Gagal mengunggah berkas. Bentuk struktur berkas tidak valid.`,
          ...prev
        ]);
      }
    };
    reader.readAsText(file);
  };

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

  const handleDnsScrape = async () => {
    if (!dnsInputDomain.trim()) return;
    setIsDnsScraping(true);
    setDnsScrapedResult(null);
    setDnsLogFeed([
      `[SYSTEM] Memulai pemindaian identitas digital domain: ${dnsInputDomain}`,
      `[OIDC] Hak jaminan investigasi diperiksa (aidilsyahdan2000@gmail.com)... OK.`,
      `[NET] Menghubungi multi-node gateway DNS di private subnet VAM...`
    ]);

    // Feed dynamic logs for beautiful UI effect
    const logTimeline = [
      `[RESOLVER] Melacak alamat IP (A record) dan Name Server (NS) publik...`,
      `[WHOIS] Melakukan ekstraksi registrasi domain regional & metadata pendaftaran...`,
      `[MX-AUDIT] Menguji keberadaan jalur penukaran surat elektronik korporasi (MX records)...`,
      `[AML MATCH] Membandingkan node IP dengan daftar hitam offshore / bulletproof ASN...`,
      `[ANALYSIS] Menghitung total bobot kerentanan Cangkang Korporasi FATF R24/25...`
    ];

    let currentLogsIndex = 0;
    const logInterval = setInterval(() => {
      if (currentLogsIndex < logTimeline.length) {
        setDnsLogFeed(prev => [...prev, logTimeline[currentLogsIndex]]);
        currentLogsIndex++;
      } else {
        clearInterval(logInterval);
      }
    }, 450);

    try {
      const res = await fetch(`/api/dns-scrape?domain=${encodeURIComponent(dnsInputDomain)}`);
      const data = await res.json();
      
      // Delay slightly for visual effect
      setTimeout(() => {
        clearInterval(logInterval);
        setDnsScrapedResult(data);
        setIsDnsScraping(false);
        setDnsLogFeed(prev => [...prev, `[SUCCESS] Forensik identitas selesai. Tingkat Kepercayaan Riset: 99.4%`]);
        
        // Add to history if not exists
        setDnsHistory(prev => {
          const exists = prev.some(h => h.domain.toLowerCase() === data.domain.toLowerCase());
          if (exists) return prev;
          return [{
            domain: data.domain,
            fatf_aml_risk_score: data.fatf_aml_risk_score,
            fatf_aml_risk_rating: data.fatf_aml_risk_rating,
            hosting_provider: data.hosting_provider,
            country_of_origin: data.country_of_origin,
            bulletproof_stealth: data.bulletproof_stealth,
            domain_age: data.domain_age,
            email_capability: data.email_capability,
            ip_addresses: data.ip_addresses
          }, ...prev];
        });
      }, 2500);

    } catch (err) {
      clearInterval(logInterval);
      console.error(err);
      setDnsLogFeed(prev => [...prev, `[ERROR] Gagal melakukan request live. Membangun model forensik luring...`]);
      setIsDnsScraping(false);
    }
  };

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

      // 4. Off-Exchange Multi-channel Custom Rules
      if (invoice.channel === 'CRYPTO_LEDGER') {
        freshAlerts.push({
          id: `AL-CRYP-${invoice.id}`,
          severity: "CRITICAL",
          type: "Crypto Ledger Dispersion",
          description: `Bypassing fiat clearing systems, a crypto settlement of ${invoice.quantity.toLocaleString('id-ID')} units was routed from ${invoice.origin} under Hash: ${invoice.hash_address || '0xunspecified'}. UBO remains obscured.`,
          referenceId: invoice.id,
          timestamp: Date.now() - 15000
        });
      } else if (invoice.channel === 'SWIFT_WIRE' && isHighRiskCountry) {
        freshAlerts.push({
          id: `AL-WIRE-${invoice.id}`,
          severity: "HIGH",
          type: "Unmanifested Bank Wire",
          description: `An offshore SWIFT wire with reference ${invoice.hash_address || 'SWIFT'} cleared through sender: ${invoice.sender_entity} to beneficiary: ${invoice.recipient_entity} without any matching customs bills.`,
          referenceId: invoice.id,
          timestamp: Date.now() - 10000
        });
      } else if (invoice.channel === 'OTC_BILATERAL' && isShell) {
        freshAlerts.push({
          id: `AL-OTC-${invoice.id}`,
          severity: "CRITICAL",
          type: "Private OTC Commodity Swap",
          description: `An off-exchange bilateral OTC deal for ${invoice.commodity_name} was settled outside standard clearing. Counterparty resolves to blacklisted shell ${invoice.seller_name}.`,
          referenceId: invoice.id,
          timestamp: Date.now() - 5000
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

      // Check configured custom price threshold alarms on custom sandbox invoice price
      checkPriceThresholds(sbItemId, priceNum, sbInvoiceId);

      setAnimatedMarketPrices(prev => {
        const history = prev[sbItemId] || [];
        const nextTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newPoint = {
          date: nextTime,
          price: priceNum,
          volume: qtyNum,
          minPrice: Math.round(priceNum * 0.95),
          maxPrice: Math.round(priceNum * 1.05)
        };
        const updated = [...history, newPoint].slice(-10);
        return {
          ...prev,
          [sbItemId]: updated
        };
      });

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
    <div id="VAM_RADAR_TBML_MODULE_CONTAINER" className="space-y-6 relative">
      
      {/* FLOATING ACTION NOTIFICATIONS DECK */}
      <div className="fixed bottom-4 right-4 z-[9999] pointer-events-none max-w-sm w-full space-y-2">
        <AnimatePresence>
          {priceNotifications.filter(n => !n.read).map(notif => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 50, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className="pointer-events-auto p-4 bg-zinc-950 border border-rose-500/30 rounded-2xl shadow-[0_10px_35px_rgba(239,68,68,0.2)] flex items-start gap-3 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-rose-500" />
              <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400">
                <BellRing className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <span className="text-[8px] font-mono font-black text-rose-400 uppercase tracking-widest leading-none">
                    LIMIT ALERT TRIGGERED
                  </span>
                  <button 
                    type="button"
                    onClick={() => {
                      setPriceNotifications(prev => prev.map(p => p.id === notif.id ? { ...p, read: true } : p));
                    }}
                    className="text-[8px] text-zinc-500 hover:text-white uppercase font-black"
                  >
                    DISMISS
                  </button>
                </div>
                <h4 className="text-xs font-bold text-white mt-1 uppercase font-mono">
                  {notif.itemId} LIMIT BREACH
                </h4>
                <p className="text-[10px] text-zinc-400 mt-1 leading-normal">
                  Sovereign price monitored at <strong className="text-red-400">Rp {notif.actualValue.toLocaleString('id-ID')}</strong>, crossing <strong className="text-white">{notif.condition === 'ABOVE' ? 'above' : 'below'}</strong> your threshold limit of Rp {notif.targetValue.toLocaleString('id-ID')}.
                </p>
                <div className="flex items-center justify-between text-[8px] font-mono text-zinc-650 mt-2 pt-1.5 border-t border-zinc-900">
                  <span>Tx Ref: {notif.txId}</span>
                  <span>{new Date(notif.timestamp).toLocaleTimeString()}</span>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    handleQuickTrade(notif);
                    setPriceNotifications(prev => prev.map(p => p.id === notif.id ? { ...p, read: true } : p));
                  }}
                  className="mt-2.5 w-full py-1.5 bg-[#DFFF00] hover:bg-white text-zinc-950 font-mono text-[8px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  <span>Execute Quick Trade</span>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

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
        <button
          id="tab-tbml-data-standard" 
          onClick={() => {
            setActiveSubTab('DATA_STANDARD');
            setHasInjectedStandard(false);
          }}
          className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
            activeSubTab === 'DATA_STANDARD' 
              ? 'bg-[#DFFF00]/10 border-[#DFFF00]/20 text-[#DFFF00]' 
              : 'bg-zinc-950/40 border-zinc-900/60 text-zinc-500 hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-[#DFFF00]" />
          Data Standardisation
        </button>
        <button
          id="tab-tbml-sar-intel" 
          onClick={() => {
            setActiveSubTab('SAR_INTEL');
            setSarReportSubmitted(false);
          }}
          className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
            activeSubTab === 'SAR_INTEL' 
              ? 'bg-[#DFFF00]/10 border-[#DFFF00]/20 text-[#DFFF00]' 
              : 'bg-zinc-950/40 border-zinc-900/60 text-zinc-500 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          AI SAR (LTKM) Draft
        </button>
        <button
          id="tab-tbml-itm-indicators" 
          onClick={() => {
            setActiveSubTab('ITM_INDICATORS');
          }}
          className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
            activeSubTab === 'ITM_INDICATORS' 
              ? 'bg-[#DFFF00]/10 border-[#DFFF00]/20 text-[#DFFF00]' 
              : 'bg-zinc-950/40 border-zinc-900/60 text-zinc-500 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-[#DFFF00]" />
          Indikator Transaksi (ITM)
        </button>
        <button
          id="tab-tbml-dns-intel" 
          onClick={() => {
            setActiveSubTab('DNS_INTEL');
          }}
          className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
            activeSubTab === 'DNS_INTEL' 
              ? 'bg-[#DFFF00]/10 border-[#DFFF00]/20 text-[#DFFF00]' 
              : 'bg-zinc-950/40 border-zinc-900/60 text-[#DFFF00] hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-[#DFFF00]" />
          DNS & Domain Forensics
        </button>

        <button
          id="tab-tbml-viu-transmitted" 
          onClick={() => {
            setActiveSubTab('VIU_TRANSMITTED');
          }}
          className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border relative overflow-hidden ${
            activeSubTab === 'VIU_TRANSMITTED' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-zinc-950/40 border-zinc-900/60 text-emerald-500 hover:text-white'
          }`}
        >
          <span className="absolute top-0 right-1 text-[6px] font-mono select-none px-1 bg-[#DFFF00] text-black rounded-b font-extrabold uppercase animate-pulse">
            Transmitted
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
          VIU/FIU Transmitted
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
              
              {/* Column 1 of 3: Direct System Alert Feed (Critical / High Warnings) */}
              <div id="tbml-critical-alerts-logs" className="lg:col-span-12 xl:col-span-4 space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                    <h3 className="text-xs font-black text-white uppercase tracking-widest font-mono">WARNING NODES</h3>
                  </div>
                  <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Live Stream</span>
                </div>

                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
                  {alerts.map((alert, idx) => (
                    <div 
                      key={`${alert.id}-${idx}`}
                      onClick={() => {
                        setSelectedSarAlertId(alert.id);
                        setActiveSubTab('SAR_INTEL');
                        setSarDraftText('');
                        setSarReportSubmitted(false);
                      }}
                      className="p-4 bg-zinc-950/60 hover:bg-zinc-950/90 border border-zinc-900 hover:border-zinc-800 rounded-2xl transition-all relative overflow-hidden group cursor-pointer"
                      title="Klik untuk menyusun draft Laporan LTKM resmi PPATK menggunakan AI"
                    >
                      {/* Critical Red left border glow */}
                      <div className={`absolute top-0 left-0 bottom-0 w-1 ${alert.severity === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'}`} />
                      
                      <div className="flex justify-between items-start mb-2 pl-2">
                        <div>
                          <span className={`${alert.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'} border px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest`}>
                            {alert.severity} • {alert.type}
                          </span>
                        </div>
                        <span className="text-[8px] font-mono text-zinc-650 font-bold group-hover:text-zinc-400 transition-colors">Ref: {alert.referenceId}</span>
                      </div>

                      <p className="text-xs font-medium text-white leading-relaxed pl-2 mb-2 group-hover:text-[#DFFF00] transition-colors">
                        {alert.description}
                      </p>

                      <div className="flex items-center justify-between pl-2 pt-2 border-t border-zinc-900/40 text-[8px] font-mono text-zinc-600 mt-1">
                        <span className="text-emerald-500 font-extrabold flex items-center gap-1 group-hover:text-[#DFFF00]">
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" /> DRAFT REPORT (LTKM)
                        </span>
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

              {/* Column 2 of 3: Price Threshold & Alarm Matrix panel */}
              <div id="tbml-price-threshold-surveillance" className="lg:col-span-12 xl:col-span-4 space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#DFFF00]" />
                    <h3 className="text-xs font-black text-white uppercase tracking-widest font-mono">PRICE THRESHOLDS</h3>
                  </div>
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">GATEWAY WATCHLIST</span>
                </div>

                <div className="bg-zinc-950/40 border border-zinc-800/60 p-4 rounded-[1.5rem] space-y-4">
                  {/* Tab Selector inside widget */}
                  <div className="flex bg-zinc-950 border border-zinc-900 rounded-xl p-1 gap-1">
                    <button 
                      type="button"
                      onClick={() => setThresholdTab('MATRIX')}
                      className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                        thresholdTab === 'MATRIX' 
                          ? 'bg-zinc-900 text-[#DFFF00]' 
                          : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      ALARM CONFIG
                    </button>
                    <button 
                      type="button"
                      onClick={() => setThresholdTab('HISTORY')}
                      className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all relative ${
                        thresholdTab === 'HISTORY' 
                          ? 'bg-zinc-900 text-[#DFFF00]' 
                          : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      ALARM SEQUENCE
                      {priceNotifications.some(n => !n.read) && (
                        <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </button>
                  </div>

                  {thresholdTab === 'MATRIX' ? (
                    <div className="space-y-4">
                      {/* Form to add alert */}
                      <div className="bg-black/60 border border-zinc-900 p-3 rounded-xl space-y-3">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block font-mono">
                          Add Custom Boundary
                        </span>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Asset Category</label>
                            <select 
                              value={newAlertItemId} 
                              onChange={(e) => {
                                setNewAlertItemId(e.target.value);
                                const bs = GLOBAL_PRICE_BASELINE[e.target.value] || 1000000;
                                setNewAlertValue(bs.toString());
                              }}
                              className="w-full bg-zinc-950 border border-zinc-850 px-2 py-1.5 text-[9px] font-bold text-white rounded-lg focus:outline-none focus:border-[#DFFF00]/50 font-sans"
                            >
                              {Object.keys(GLOBAL_PRICE_BASELINE).map(k => (
                                <option key={k} value={k}>{k}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Condition Trigger</label>
                            <select 
                              value={newAlertCondition} 
                              onChange={(e) => setNewAlertCondition(e.target.value as any)}
                              className="w-full bg-zinc-950 border border-zinc-850 px-2 py-1.5 text-[9px] font-bold text-white rounded-lg focus:outline-none focus:border-[#DFFF00]/50 font-sans"
                            >
                              <option value="ABOVE">CROSSES ABOVE (&gt;)</option>
                              <option value="BELOW">CROSSES BELOW (&lt;)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest block">Threshold Value (Rp)</label>
                            <span className="text-[7px] font-mono text-zinc-500 font-bold uppercase">
                              Baseline: Rp {(GLOBAL_PRICE_BASELINE[newAlertItemId] || 0).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="relative flex items-center">
                            <input 
                              type="text" 
                              value={newAlertValue}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^0-9]/g, '');
                                setNewAlertValue(raw);
                              }}
                              placeholder="e.g. 260000000"
                              className="w-full bg-zinc-950 border border-zinc-850 px-3 py-1.5 text-[10px] font-mono font-bold text-white rounded-lg focus:outline-none focus:border-[#DFFF00]/50 placeholder-zinc-700"
                            />
                            <span className="absolute right-3 text-[8px] font-mono text-zinc-500 font-bold">IDR</span>
                          </div>
                          <span className="text-[7px] text-zinc-500 mt-1 uppercase tracking-widest block leading-none font-mono text-right">
                            Parsed: Rp {(parseFloat(newAlertValue) || 0).toLocaleString('id-ID')}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const valNum = parseFloat(newAlertValue) || 0;
                            if (valNum <= 0) return;
                            const newLimit: PriceThreshold = {
                              id: `THR-${Date.now()}`,
                              itemId: newAlertItemId,
                              condition: newAlertCondition,
                              value: valNum,
                              active: true
                            };
                            setPriceThresholds(prev => [...prev, newLimit]);
                            setTerminalFeed(prev => [
                              `[ALARM SYSTEM] Configured price alarm rule verified: ${newAlertItemId} ${newAlertCondition.toLowerCase()} Rp ${valNum.toLocaleString('id-ID')}`,
                              ...prev
                            ]);
                          }}
                          className="w-full py-1.5 bg-[#DFFF00] hover:bg-[#deff9a] text-black font-black text-[9px] tracking-widest uppercase rounded-lg transition-all"
                        >
                          + ACTIVATE BOUNDARY ALARM
                        </button>
                      </div>

                      {/* Configured boundaries list */}
                      <div className="space-y-2 max-h-[175px] overflow-y-auto pr-1 scrollbar-thin custom-scrollbar">
                        {priceThresholds.map((t) => (
                          <div 
                            key={t.id}
                            className={`p-2.5 bg-black/40 border ${t.active ? 'border-zinc-900 hover:border-zinc-800' : 'border-zinc-950/40 opacity-50'} rounded-xl flex items-center justify-between gap-3 transition-all`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg ${t.active ? 'bg-zinc-950' : 'bg-zinc-950/20'}`}>
                                <Bell className={`w-3.5 h-3.5 ${t.active ? (t.condition === 'ABOVE' ? 'text-rose-400' : 'text-blue-400') : 'text-zinc-600'}`} />
                              </div>
                              <div>
                                <span className="text-[10px] font-black text-white block">{t.itemId}</span>
                                <div className="flex items-center gap-1 text-[7.5px] font-mono text-zinc-500 uppercase mt-0.5 leading-none">
                                  <span>{t.condition === 'ABOVE' ? 'CROSSES ABOVE' : 'CROSSES BELOW'}</span>
                                  <span className={t.active ? (t.condition === 'ABOVE' ? 'text-rose-400 font-bold' : 'text-blue-400 font-bold') : 'text-zinc-600'}>
                                    Rp {t.value.toLocaleString('id-ID')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Toggle active status */}
                              <button
                                type="button"
                                onClick={() => {
                                  setPriceThresholds(prev => prev.map(item => item.id === t.id ? { ...item, active: !item.active } : item));
                                }}
                                className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest transition-all ${
                                  t.active 
                                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' 
                                    : 'bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-500'
                                }`}
                              >
                                {t.active ? 'ACTIVE' : 'MUTED'}
                              </button>

                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setPriceThresholds(prev => prev.filter(item => item.id !== t.id));
                                  setTerminalFeed(prev => [
                                    `[ALARM SYSTEM] Deregistered price alarm rule for ${t.itemId}`,
                                    ...prev
                                  ]);
                                }}
                                className="p-1 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-500/10"
                                title="Remove limit"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {priceThresholds.length === 0 && (
                          <div className="py-8 text-center border border-dashed border-zinc-900 rounded-2xl opacity-40">
                            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">NO LIMITS DEFINED</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest font-mono">
                          Trigger Audit Log
                        </span>
                        {priceNotifications.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setPriceNotifications([]);
                            }}
                            className="text-[8px] font-black text-rose-400 hover:text-rose-350 uppercase transition-colors mr-1"
                          >
                            CLEAR LOGS
                          </button>
                        )}
                      </div>

                      <div className="space-y-2 max-h-[310px] overflow-y-auto pr-1 scrollbar-thin custom-scrollbar">
                        {priceNotifications.map((notif) => (
                          <div 
                            key={notif.id}
                            className="p-3 bg-rose-500/[0.02] border border-rose-500/15 rounded-xl space-y-1 relative overflow-hidden group"
                          >
                            <div className="absolute top-0 right-0 py-1 px-2 text-[7px] font-mono select-none uppercase font-extrabold bg-red-950/20 border-l border-b border-rose-500/20 rounded-bl text-rose-400">
                              {new Date(notif.timestamp).toLocaleTimeString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                              <span className="text-[10px] font-black text-white">{notif.itemId} ALARM BREACH</span>
                            </div>
                            <div className="text-[9px] font-mono text-zinc-400 space-y-0.5 leading-normal">
                              <div>
                                Target: <strong className="text-white">Rp {notif.targetValue.toLocaleString('id-ID')}</strong> ({notif.condition === 'ABOVE' ? '> ABOVE' : '< BELOW'})
                              </div>
                              <div>
                                Trigger Price: <strong className="text-red-400 font-bold">Rp {notif.actualValue.toLocaleString('id-ID')}</strong>
                              </div>
                              <div className="pt-1.5 mt-1.5 border-t border-rose-500/10 flex justify-between items-center gap-2">
                                <span className="text-[8px] text-zinc-600">
                                  Ref: {notif.txId}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleQuickTrade(notif)}
                                  className="px-2 py-0.5 bg-rose-500/10 hover:bg-[#DFFF00] text-rose-400 hover:text-zinc-950 border border-rose-500/20 hover:border-transparent rounded-lg font-mono text-[7px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                                >
                                  <ArrowRightLeft className="w-2.5 h-2.5" />
                                  <span>Quick Trade</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {priceNotifications.length === 0 && (
                          <div className="py-20 flex flex-col items-center justify-center border border-zinc-900 rounded-3xl opacity-35">
                            <BellRing className="w-5 h-5 text-zinc-600 mb-1.5 animate-pulse" />
                            <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest text-center leading-relaxed">
                              NO PRICE ALARMS TRIGGERED.<br />CONFIG LIMITS TO TRACK FLOW ANOMALIES.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Column 3 of 3: Underlying Trade Invoices Database */}
              <div id="tbml-corporate-ledger-invoices" className="lg:col-span-12 xl:col-span-4 space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-[#DFFF00]" />
                    <h3 className="text-xs font-black text-white uppercase tracking-widest font-mono">FINANCIAL TRAFFIC LEDGER</h3>
                  </div>
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">LIVE TRANSACTIONS STREAM</span>
                </div>

                {/* Real-time Ticker control deck */}
                <div className="space-y-3 bg-zinc-950/20 p-4 border border-zinc-900 rounded-[1.5rem]">
                  <div className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${realtimeScanActive ? 'bg-[#DFFF00] animate-pulse shadow-[0_0_10px_rgba(223,255,0,0.5)]' : 'bg-zinc-600'}`}></span>
                      <div>
                        <span className="text-[10px] font-bold text-white block">Audit Engine status</span>
                        <span className="text-[8px] text-zinc-400 uppercase font-mono tracking-wider">
                          {realtimeScanActive ? 'Real-time Radar Online' : 'Simulation Suspended'} • Scanned: {auditedLogsCount}
                        </span>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setRealtimeScanActive(!realtimeScanActive)}
                      className={`px-3 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all ${
                        realtimeScanActive 
                          ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20' 
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {realtimeScanActive ? (
                        <>
                          <Pause className="w-3 h-3" /> SUSPEND
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 animate-pulse" /> ENGAGE
                        </>
                      )}
                    </button>
                  </div>

                  {/* Channel filter pills */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-thin custom-scrollbar border-t border-zinc-900/60 mt-2">
                    {[
                      { value: 'ALL', label: 'All Traffic' },
                      { value: 'BURSA_SID', label: 'Bursa / SID' },
                      { value: 'OTC_BILATERAL', label: 'OTC Bilateral' },
                      { value: 'SWIFT_WIRE', label: 'SWIFT' },
                      { value: 'CRYPTO_LEDGER', label: 'Crypto' },
                      { value: 'SHELL_TRANSFER', label: 'Offshore Shell' }
                    ].map(opt => {
                      const isActive = selectedChannelFilter === opt.value;
                      const count = opt.value === 'ALL' 
                        ? invoices.length 
                        : invoices.filter(i => i.channel === opt.value).length;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSelectedChannelFilter(opt.value as any)}
                          className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all shrink-0 ${
                            isActive
                              ? 'bg-[#DFFF00] text-black border-[#DFFF00]'
                              : 'bg-zinc-950/50 text-zinc-400 border-zinc-900 hover:text-white'
                          }`}
                        >
                          {opt.label} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
                  {invoices
                    .filter(i => selectedChannelFilter === 'ALL' || i.channel === selectedChannelFilter)
                    .map((invoice, idx) => {
                      const priceAnomRatio = (invoice.unit_price - (GLOBAL_PRICE_BASELINE[invoice.item_id] || 1530000)) / (GLOBAL_PRICE_BASELINE[invoice.item_id] || 1530000);
                      const hasAnom = Math.abs(priceAnomRatio) > 0.25;

                      // Channel specific styling & icons
                      let channelTagStyle = 'bg-blue-500/10 border-blue-500/20 text-blue-400';
                      let ChannelIcon = Activity;
                      let channelName = 'Bursa Stock / SID';

                      if (invoice.channel === 'OTC_BILATERAL') {
                        channelTagStyle = 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400';
                        ChannelIcon = Layers;
                        channelName = 'OTC Bilateral Deal';
                      } else if (invoice.channel === 'SWIFT_WIRE') {
                        channelTagStyle = 'bg-amber-500/10 border-amber-500/20 text-amber-400';
                        ChannelIcon = Globe;
                        channelName = 'International SWIFT';
                      } else if (invoice.channel === 'CRYPTO_LEDGER') {
                        channelTagStyle = 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400';
                        ChannelIcon = Coins;
                        channelName = 'Crypto Asset Transact';
                      } else if (invoice.channel === 'SHELL_TRANSFER') {
                        channelTagStyle = 'bg-purple-500/10 border-purple-500/20 text-purple-400';
                        ChannelIcon = Network;
                        channelName = 'Offshore Capital Shell';
                      }

                      return (
                        <div 
                          key={`${invoice.id}-${idx}`}
                          className={`p-4 rounded-[1.5rem] border transition-all ${
                            hasAnom 
                              ? 'bg-red-500/[0.02]/20 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.02)]' 
                              : 'bg-zinc-950/40 border-zinc-900'
                          } hover:border-[#DFFF00]/20`}
                        >
                          <div className="flex items-center justify-between mb-2 pb-1 border-b border-zinc-900/60">
                            <div className="flex items-center gap-1.5">
                              <ChannelIcon className="w-3 h-3 text-zinc-400" />
                              <span className="text-[9px] font-mono font-bold text-zinc-500">{invoice.id}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border ${channelTagStyle}`}>
                              {channelName}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-white uppercase truncate">{invoice.commodity_name}</p>
                          
                          {/* Entity physical and financial routing path */}
                          <div className="mt-2 bg-zinc-950/60 p-2 rounded-xl text-[8.5px] font-mono text-zinc-400 border border-zinc-900 space-y-1">
                            {invoice.sender_entity && (
                              <div className="flex justify-between">
                                <span className="text-zinc-600 uppercase font-black">SND:</span>
                                <span className="text-zinc-300 truncate max-w-[160px]">{invoice.sender_entity}</span>
                              </div>
                            )}
                            {invoice.recipient_entity && (
                              <div className="flex justify-between">
                                <span className="text-zinc-600 uppercase font-black">RCV:</span>
                                <span className="text-emerald-400 truncate max-w-[160px]">{invoice.recipient_entity}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-zinc-600 uppercase font-black">ORIGIN/SELLER:</span>
                              <span className="text-zinc-300 truncate max-w-[160px]">{invoice.seller_name} ({invoice.origin})</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-900/60 font-mono">
                            <div>
                              <span className="text-[8px] font-black text-zinc-600 block uppercase">Transactional Value</span>
                              <span className="text-xs font-black text-white">Rp {invoice.unit_price.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] font-black text-zinc-600 block uppercase">Baseline Delta</span>
                              <span className={`text-xs font-bold ${hasAnom ? 'text-red-400' : 'text-emerald-400'}`}>
                                {priceAnomRatio >= 0 ? '+' : ''}{Math.round(priceAnomRatio * 100)}%
                              </span>
                            </div>
                          </div>

                          {invoice.hash_address && (
                            <div className="mt-2 pt-1.5 border-t border-zinc-900/40 flex items-center justify-between text-[8px] text-zinc-600 font-mono">
                              <span>ENTRY KEY:</span>
                              <span className="text-zinc-500 select-all truncate max-w-[180px]" title={invoice.hash_address}>
                                {invoice.hash_address}
                              </span>
                            </div>
                          )}

                          <div className="mt-3 pt-2 border-t border-zinc-900/20 flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedChartAsset(invoice.item_id);
                                const tChart = document.getElementById('tbml-dynamic-price-chart-section');
                                if (tChart) {
                                  tChart.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }}
                              className={`w-full py-1.5 px-2.5 rounded-lg text-[8px] font-mono font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                                selectedChartAsset === invoice.item_id
                                  ? 'bg-[#DFFF00]/10 text-[#DFFF00] border border-[#DFFF00]/30 shadow-[0_0_10px_rgba(223,255,0,0.05)]'
                                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-850'
                              }`}
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                              {selectedChartAsset === invoice.item_id ? 'ACTIVE CHART VIEW' : 'INSPECT PRICE CHART'}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  {invoices.length === 0 && (
                    <div className="py-12 text-center text-zinc-600 border border-dashed border-zinc-800 rounded-2xl">
                      No matching financial transaction traffic captured
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Dynamic Commodity Historical Trading Sequence Chart */}
            <div 
              id="tbml-dynamic-price-chart-section" 
              className="bg-zinc-950/40 border border-zinc-800/60 rounded-[2rem] p-6 lg:p-8 space-y-6 scroll-mt-24 mt-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-900/60 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-[#DFFF00] animate-pulse" />
                    <span className="text-[8px] font-black text-[#DFFF00] uppercase tracking-[0.25em] font-mono">Surveillance Module</span>
                  </div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">HISTORICAL COMMODITY TRADING FLOWS</h3>
                  <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                    Visualizing historical cost sequence indexes vs established international regulatory baseline standards. Select an asset profile below to display.
                  </p>
                </div>

                {/* Statistics Box */}
                <div className="flex flex-wrap gap-4 bg-zinc-950/85 border border-[#1d1d22] p-4 rounded-2xl">
                  <div>
                    <span className="text-[8px] font-mono font-black text-zinc-500 block uppercase">LAST CAPTURED PRICE</span>
                    <span className="text-xs font-mono font-black text-white">
                      Rp {(animatedMarketPrices[selectedChartAsset]?.slice(-1)[0]?.price || GLOBAL_PRICE_BASELINE[selectedChartAsset] || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="border-l border-zinc-800/60 pl-4">
                    <span className="text-[8px] font-mono font-black text-zinc-500 block uppercase">REGULATORY BASELINE</span>
                    <span className="text-xs font-mono font-black text-[#DFFF00]">
                      Rp {(GLOBAL_PRICE_BASELINE[selectedChartAsset] || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="border-l border-zinc-800/60 pl-4">
                    <span className="text-[8px] font-mono font-black text-zinc-500 block uppercase">ACTIVE CORRIDOR SKEW</span>
                    {(() => {
                      const latestPrice = animatedMarketPrices[selectedChartAsset]?.slice(-1)[0]?.price || GLOBAL_PRICE_BASELINE[selectedChartAsset] || 0;
                      const basePrice = GLOBAL_PRICE_BASELINE[selectedChartAsset] || 1;
                      const skew = ((latestPrice - basePrice) / basePrice) * 100;
                      const skewAb = Math.abs(skew);
                      return (
                        <span className={`text-xs font-mono font-black ${skewAb > 25 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {skew >= 0 ? '+' : ''}{skew.toFixed(1)}% {skewAb > 25 ? '⚠️' : '✓'}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Asset Selection Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pb-2">
                {[
                  { id: 'COAL', label: 'Thermal Coal', base: 'Ton', color: '#a1a1aa' },
                  { id: 'NICKEL', label: 'Battery Nickel', base: 'Ton', color: '#22d3ee' },
                  { id: 'GOLD', label: 'Fine Gold', base: 'Gram', color: '#fbbf24' },
                  { id: 'LUXURY_WATCH', label: 'Luxury Watches', base: 'Unit', color: '#f43f5e' },
                  { id: 'TECH_LICENSE', label: 'Software License', base: 'User', color: '#a3e635' }
                ].map((asset) => {
                  const isActive = selectedChartAsset === asset.id;
                  const latestPrice = animatedMarketPrices[asset.id]?.slice(-1)[0]?.price || GLOBAL_PRICE_BASELINE[asset.id] || 0;
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => setSelectedChartAsset(asset.id)}
                      className={`text-left p-3.5 rounded-2xl border transition-all ${
                        isActive
                          ? 'bg-zinc-900 border-[#DFFF00] shadow-[0_0_15px_rgba(223,255,0,0.03)]'
                          : 'bg-zinc-950/20 border-zinc-900 hover:border-zinc-800'
                      }`}
                      style={{ borderLeftColor: isActive ? '#DFFF00' : asset.color, borderLeftWidth: '3.5px' }}
                    >
                      <span className="text-[8px] font-black text-zinc-500 block uppercase tracking-wider">{asset.label}</span>
                      <strong className="text-[11px] font-mono text-white block mt-0.5">
                        Rp {latestPrice.toLocaleString('id-ID')}
                      </strong>
                      <span className="text-[7px] text-zinc-500 font-mono mt-1 block">per {asset.base}</span>
                    </button>
                  );
                })}
              </div>

              {/* Main Area Chart Canvas Container */}
              <div className="bg-black/40 border border-zinc-900 rounded-3xl p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                    <span className="w-2 h-2 rounded-full bg-[#DFFF00] animate-pulse" />
                    <span>Selected Asset sequence (10-Interval Real-time window)</span>
                  </div>
                  <div className="text-[9px] font-mono text-zinc-500 uppercase">
                    Ref currency: IDR (Rupiah)
                  </div>
                </div>

                <div className="w-full h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={animatedMarketPrices[selectedChartAsset] || []} 
                      margin={{ top: 15, right: 10, left: 15, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="selectedAssetGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={
                            selectedChartAsset === 'COAL' ? '#a1a1aa' :
                            selectedChartAsset === 'NICKEL' ? '#22d3ee' :
                            selectedChartAsset === 'GOLD' ? '#fbbf24' :
                            selectedChartAsset === 'LUXURY_WATCH' ? '#f43f5e' : '#a3e635'
                          } stopOpacity={0.25} />
                          <stop offset="95%" stopColor={
                            selectedChartAsset === 'COAL' ? '#a1a1aa' :
                            selectedChartAsset === 'NICKEL' ? '#22d3ee' :
                            selectedChartAsset === 'GOLD' ? '#fbbf24' :
                            selectedChartAsset === 'LUXURY_WATCH' ? '#f43f5e' : '#a3e635'
                          } stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#18181b" strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#52525b" 
                        fontSize={8.5} 
                        fontFamily="JetBrains Mono" 
                        tickLine={false} 
                      />
                      <YAxis 
                        stroke="#52525b" 
                        fontSize={8.5} 
                        fontFamily="JetBrains Mono" 
                        tickLine={false}
                        tickFormatter={(value) => value.toLocaleString('id-ID', { notation: 'compact' })}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '16px' }}
                        itemStyle={{ fontSize: '11px', color: '#fff', fontFamily: 'JetBrains Mono' }}
                        labelStyle={{ fontSize: '9px', color: '#a1a1aa', fontFamily: 'JetBrains Mono' }}
                        formatter={(value: any, name: any) => {
                          if (name === "price") return [`Rp ${value.toLocaleString('id-ID')}`, "Audit Price"];
                          if (name === "volume") return [value, "Inspection Vol"];
                          return [value, name];
                        }}
                      />
                      {/* Regulatory reference center baseline indicator */}
                      <ReferenceLine 
                        y={GLOBAL_PRICE_BASELINE[selectedChartAsset] || 0} 
                        stroke="#ef4444" 
                        strokeDasharray="4 4" 
                        label={{ 
                          value: 'REGULATORY BASELINE LINE', 
                          fill: '#ef4444', 
                          fontSize: 7.5, 
                          position: 'top', 
                          fontFamily: 'JetBrains Mono',
                          fontWeight: 'bold',
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke={
                          selectedChartAsset === 'COAL' ? '#a1a1aa' :
                          selectedChartAsset === 'NICKEL' ? '#22d3ee' :
                          selectedChartAsset === 'GOLD' ? '#fbbf24' :
                          selectedChartAsset === 'LUXURY_WATCH' ? '#f43f5e' : '#a3e635'
                        } 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill="url(#selectedAssetGradient)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Threat Matrix Audit Diagnostics */}
              {(() => {
                const latestPrice = animatedMarketPrices[selectedChartAsset]?.slice(-1)[0]?.price || GLOBAL_PRICE_BASELINE[selectedChartAsset] || 0;
                const basePrice = GLOBAL_PRICE_BASELINE[selectedChartAsset] || 1;
                const devRatio = (latestPrice - basePrice) / basePrice;
                const isViolation = Math.abs(devRatio) > 0.25;
                return (
                  <div className={`p-5 rounded-2xl border ${
                    isViolation 
                      ? 'bg-red-500/[0.02]/20 border-red-500/20' 
                      : 'bg-zinc-950/20 border-zinc-900'
                  } flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono`}>
                    <div className="space-y-1">
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 block">SYSTEM DIAGNOSTIC</span>
                      <p className="text-xs font-bold text-white uppercase leading-normal">
                        {isViolation 
                          ? `CRITICAL VALUE CORRIDOR DEVIATION: Flagged at ${(devRatio * 100).toFixed(1)}% mismatch` 
                          : 'Commodity pricing corridor verified inside global boundary tolerance bounds'}
                      </p>
                      <p className="text-[9px] text-zinc-450 font-sans leading-relaxed">
                        {isViolation
                          ? `The latest trade settlements indicate commodity invoice values deviate significantly from international regulatory baseline standards. This pattern is strongly indicative of trade-based collateral inflation or capital expatriation.`
                          : 'Invoice values tracked from bilateral clearings align seamlessly with certified domestic market expectations. Under/over pricing is within acceptable 25% boundary variance.'}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <span className={`px-3 py-1.5 rounded-xl text-[9px] font-extrabold uppercase tracking-widest border ${
                        isViolation 
                          ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' 
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      }`}>
                        {isViolation ? '⚠️ HIGH MISMATCH' : '✓ CORRIDOR PERFECT'}
                      </span>
                    </div>
                  </div>
                );
              })()}
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

                {/* DRAG AND DROP DYNAMIC COMPATIBILITY REGION */}
                <div 
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                      handleImportFile(files[0]);
                    }
                  }}
                  className={`p-4 border border-dashed rounded-2xl text-center transition-all ${
                    isDraggingFile 
                      ? 'border-[#DFFF00] bg-[#DFFF00]/10 scale-[0.98]' 
                      : 'border-zinc-900 bg-black/40 hover:border-zinc-800'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="p-2.5 bg-zinc-900 rounded-full mb-1">
                      <FileSpreadsheet className="w-4 h-4 text-[#DFFF00]" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-white uppercase tracking-wider">
                        SERET & LEPAS COMMERCE CSV / LEAF FILE
                      </p>
                      <p className="text-[7.5px] text-zinc-500 uppercase tracking-widest font-mono mt-0.5">
                        Unggah berkas untuk mengisi anomali parameter otomatis
                      </p>
                    </div>
                    <label className="cursor-pointer mt-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-850 rounded-lg text-[7.5px] font-black uppercase text-zinc-400 hover:text-white transition-all border border-zinc-850 inline-block">
                      PILIH DOKUMEN MANUAL
                      <input 
                        type="file" 
                        accept=".csv,.json,.txt" 
                        className="hidden" 
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            handleImportFile(files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
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

        {/* TAB 3: TIMELINE TEMPORAL CORRELATION & CROSS-LAYER DETECTOR */}
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
            <div className="p-6 bg-[#020407] border border-zinc-900 rounded-[2rem] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <span className="text-[8px] font-black text-[#DFFF00] uppercase tracking-[0.2em] block mb-1">Cross-Layer Analysis & Smurfing Detector</span>
                <h2 className="text-xl font-black text-white uppercase tracking-wider">CROSS-LAYER FLOW ANALYSIS & TEMPORAL CORRELATION</h2>
                <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
                  Mendeteksi pencucian uang lintas lapis transaksional dari korporasi ke rekening pribadi dengan menganalisis korelasi waktu (Temporal Correlation) dan smurfing berfrekuensi tinggi.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <span className="px-3 py-1.5 bg-red-950/30 text-red-400 rounded-xl border border-red-900/50 text-[10px] font-mono font-bold font-black">
                  CROSS-LAYER DETECTION: ACTIVE
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Side: Staging & Layering Detection (Smurfing Simulator) */}
              <div className="lg:col-span-6 bg-[#020407] border border-zinc-900 rounded-[2rem] p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#DFFF00]" />
                    <h3 className="text-xs font-black text-white uppercase tracking-widest font-mono">1. STAGING & LAYERING DETECTOR (SMURFING)</h3>
                  </div>
                  <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded text-[8px] text-right font-mono font-bold animate-pulse">SMURFING DETECTED</span>
                </div>
                
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Sistem menganalisis ketika dana korporasi mengalir keluar dalam jumlah besar (tanpa justifikasi operasional wajar) lalu secara simultan dipecah menjadi nominal-nominal kecil ke ribuan rekening pribadi (Smurfing/Smurf Accounts) dalam kurun waktu temporal berdekatan.
                </p>

                {/* Smurfing visual flowchart */}
                <div className="bg-black/90 p-4 rounded-2xl border border-zinc-900 space-y-4">
                  <div className="flex justify-between items-center bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                    <div>
                      <span className="text-[8px] text-zinc-500 block">KORPORASI PENGIRIM (SOURCE)</span>
                      <span className="text-xs font-mono font-bold text-white uppercase">PT Halmahera Industrial Nickel</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] text-zinc-500 block">NOMINAL KELUAR</span>
                      <span className="text-xs font-mono font-black text-red-400">Rp 18.000.000.000</span>
                    </div>
                  </div>

                  {/* Flow Arrows block */}
                  <div className="flex flex-col items-center justify-center my-2 relative py-1">
                    <div className="w-0.5 h-8 bg-dashed border-l border-red-500/40" />
                    <div className="px-3 py-1 text-[8px] font-mono rounded-full bg-red-950/80 border border-red-500/30 text-red-400 z-10 font-bold uppercase tracking-wider">
                      Staging & Smurfing Fragmentor (Delta &lt; 300 Detik)
                    </div>
                    <div className="w-0.5 h-8 bg-dashed border-l border-red-500/40" />
                  </div>

                  {/* Smurfed Personal Accounts Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'REC-01', name: 'Suherman (Mule #1)', amt: 'Rp 9.500.000', label: 'ASN Gol II-B' },
                      { id: 'REC-02', name: 'Mulyani (Mule #2)', amt: 'Rp 9.800.500', label: 'ASN Sipil' },
                      { id: 'REC-03', name: 'Andi P. (Mule #3)', amt: 'Rp 9.650.000', label: 'Keluarga Pejabat' }
                    ].map(m => (
                      <div key={m.id} className="p-2.5 bg-zinc-950 rounded-xl border border-red-500/10 text-center font-mono space-y-1">
                        <span className="text-[7px] text-zinc-500 uppercase block">{m.id}</span>
                        <span className="text-[9px] font-bold text-zinc-300 block truncate">{m.name}</span>
                        <span className="text-[8px] text-zinc-500 block">{m.label}</span>
                        <span className="text-[10px] font-black text-[#DFFF00] block">{m.amt}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-center pt-2">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase">Dan 1.849 rekening mikro anonymized lainnya (Pola terpecah)</span>
                  </div>
                </div>
              </div>

              {/* Right Side: PEP (Political Exposed Person) Linkage & Contract Auditor */}
              <div className="lg:col-span-6 bg-[#020407] border border-zinc-900 rounded-[2rem] p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                    <h3 className="text-xs font-black text-white uppercase tracking-widest font-mono">2. PEP (POLITICAL EXPOSED PERSON) LINKAGE AUDITOR</h3>
                  </div>
                  <span className="px-2.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-[8px] font-mono font-bold uppercase">HIGH RISK WARNING</span>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Modul ini secara dinamis mengintegrasikan data pemenang tender proyek/komoditas pemerintah dengan database PEP (Pejabat Publik & Afiliasi Keluarga). Sistem otomatis menaikkan status menjadi <strong>High-Risk Alert (Skor 90-100)</strong> jika ditemukan aliran dari rekening korporasi pemenang tender menuju rekening keluarga pejabat.
                </p>

                {/* Audit Evidence Chain Visualizer */}
                <div className="space-y-3 pt-2">
                  <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center text-[9px] font-mono font-bold text-red-400 uppercase">
                      <span>BUKTI LINKAGE CORRELATOR</span>
                      <span>RISK SCORE: 98/100</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {/* Step 1 */}
                      <div className="flex items-start gap-2.5 bg-black/40 p-2.5 rounded-xl border border-zinc-800/40">
                        <span className="text-[9px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded-md font-mono font-bold shrink-0">STEP 1</span>
                        <div>
                          <p className="text-[10px] text-zinc-500 font-mono uppercase">Kontrak Pemerintah / Tender Win</p>
                          <p className="text-zinc-200 font-semibold text-[11px]">PT Halmahera Industrial Nickel mendapat Izin Usaha Pertambangan (IUP) Strategis Dinas Pendapatan Daerah.</p>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex items-start gap-2.5 bg-black/40 p-2.5 rounded-xl border border-zinc-800/40">
                        <span className="text-[9px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded-md font-mono font-bold shrink-0">STEP 2</span>
                        <div>
                          <p className="text-[10px] text-zinc-500 font-mono uppercase">Political Exposed Person Affiliation</p>
                          <p className="text-zinc-200 font-semibold text-[11px]">Komisaris UBO terafiliasi erat dengan keluarga dekat Deputi Kepala Dinas Kehutanan Daerah Sektor Tambang.</p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex items-start gap-2.5 bg-black/40 p-2.5 rounded-xl border border-zinc-800/40">
                        <span className="text-[9px] px-1.5 py-0.5 bg-[#DFFF00]/10 text-[#DFFF00] rounded-md font-mono font-bold shrink-0">MATCH</span>
                        <div>
                          <p className="text-[10px] text-zinc-500 font-mono uppercase">Aliran Keuangan Rahasia (Layering)</p>
                          <p className="text-[#DFFF00] font-extrabold text-[11px]">Inflow Rp 36.600.000.000 dikirimi via bursa ke rekening samaran milik "Andi P. (Ipar Dekat)" yang berstatus ASN golongan II-B.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProcessingPepAudit(true);
                      setTimeout(() => {
                        setIsProcessingPepAudit(false);
                        setPepAuditCompleted(true);
                        alert("PEP-Tender Cross-Layer Correlation Scan Complete! Mapped 3 High-Risk Affiliate Connections.");
                      }, 1200);
                    }}
                    disabled={isProcessingPepAudit}
                    className="w-full py-3 bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 text-red-400 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessingPepAudit ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        MEMPROSES SCANNING KORELASI...
                      </>
                    ) : (
                      "JALANKAN AUDIT KORELASI PEP & TENDER"
                    )}
                  </button>
                </div>

                {pepAuditCompleted && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-950/15 border border-red-500/25 rounded-2xl space-y-3 mt-3"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-red-500/20">
                      <span className="text-[9px] font-mono font-black text-red-400 uppercase tracking-widest">RESULT: 3 PEP AFFILIATIONS CONFIRMED</span>
                      <span className="px-1.5 py-0.5 bg-red-500 text-black text-[7.5px] font-mono font-black rounded uppercase">CRITICAL COUPLING</span>
                    </div>
                    
                    <div className="space-y-2 text-[10px] font-mono">
                      <div className="flex justify-between text-zinc-300">
                        <span>1. Deputi Dinas ESDM</span>
                        <span className="text-red-400 font-bold">Kakak Ipar Andi P.</span>
                      </div>
                      <div className="flex justify-between text-zinc-350">
                        <span>2. Pemegang Saham Mayoritas PT Halmahera</span>
                        <span className="text-red-400 font-bold">Suami dari Adik Kandung Deputi</span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>3. Rekening Penampung Saham</span>
                        <span className="text-[#DFFF00] font-black">Andi P. (Gaji Pokok IDR 3.5M &rArr; Terima 36.6 Miliar)</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSarAlertId("AL-SH-INV-SANDBOX-99");
                        setActiveSubTab('SAR_INTEL');
                        setSarDraftText('');
                        setSarReportSubmitted(false);
                        alert("Meneruskan data afinitas PEP ke pembuat draf LTKM.");
                      }}
                      className="w-full py-2 bg-red-500 text-black hover:bg-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <ArrowRight className="w-3 h-3 text-black" />
                      ESKALASIKAN DAN BUAT LAPORAN LTKM PPATK &rarr;
                    </button>
                  </motion.div>
                )}
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
            {/* Context introduction */}
            <div className="p-6 bg-[#020407] border border-zinc-900 rounded-[2rem] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <span className="text-[8px] font-black text-[#DFFF00] uppercase tracking-[0.2em] block mb-1">Identifikasi Shadow Ownership (GNN Tensor Analysis)</span>
                <h2 className="text-xl font-black text-white uppercase tracking-wider">GRAPH NEURAL NETWORK (GNN) SHADOW OWNERSHIP ANALYSER</h2>
                <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
                  Sistem pemetaan relasi jaringan bayangan di balik kepemilikan saham riil (UBO) dan perbankan, menyinkronkan data KSEI bursa, AHU Kemenkumham, serta relasi jabatan kekuasaan politik.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <span className="px-3 py-1.5 bg-zinc-950 rounded-xl border border-zinc-900 text-[10px] font-mono font-bold text-zinc-400 font-black">
                  TENSOR CORE RUNNING
                </span>
                <span className="px-3 py-1.5 bg-[#DFFF00]/10 text-[#DFFF00] rounded-xl border border-[#DFFF00]/20 text-[10px] font-mono font-bold">
                  MODEL ACCURACY: 98.4%
                </span>
              </div>
            </div>

            {/* Inner view mode navigation toggle */}
            <div id="pep-ink-mode-select" className="flex bg-[#020407] p-1 rounded-2xl border border-zinc-900 max-w-lg mt-2">
              <button
                type="button"
                onClick={() => setGnnViewMode('GRAPH')}
                className={`flex-1 py-2 px-4 text-center text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                  gnnViewMode === 'GRAPH'
                    ? 'bg-[#DFFF00] text-black font-extrabold shadow-sm'
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                1. Shadow Owner Node Map
              </button>
              <button
                type="button"
                onClick={() => setGnnViewMode('PEPLINK')}
                className={`flex-1 py-2 px-4 text-center text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                  gnnViewMode === 'PEPLINK'
                    ? 'bg-[#DFFF00] text-black font-extrabold shadow-sm'
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                2. PEP-Linkage Integrity Lab
              </button>
            </div>

            {gnnViewMode === 'GRAPH' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Panel: 4 Layer Data Ingestion Deck */}
                <div className="lg:col-span-4 bg-[#020407] border border-zinc-900 rounded-[2rem] p-6 space-y-4">
                  <div className="border-b border-zinc-900 pb-3 flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#DFFF00]" />
                    <span className="text-xs font-black text-white uppercase tracking-wider font-mono">GNN ENGINE INPUT CHANNELS</span>
                  </div>

                  <div className="space-y-3 font-mono">
                    {/* Layer 1 KSEI */}
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900">
                      <div className="flex justify-between items-center text-[9px] font-bold text-zinc-400 uppercase">
                        <span>Layer 1: Data KSEI (SID)</span>
                        <span className="text-[#DFFF00] font-black">CONNECTED</span>
                      </div>
                      <p className="text-[8px] text-zinc-450 leading-relaxed mt-1">Registrasi Rekening Saham Tunggal Efek Indonesia (Single Investor ID - SID)</p>
                    </div>

                    {/* Layer 2 AHU */}
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900">
                      <div className="flex justify-between items-center text-[9px] font-bold text-zinc-400 uppercase">
                        <span>Layer 2: Data AHU Kemenkumham</span>
                        <span className="text-emerald-400 font-black">CONNECTED</span>
                      </div>
                      <p className="text-[8px] text-zinc-450 leading-relaxed mt-1">Akte Pendirian Resmi, Anggaran Dasar, & Registrasi Perubahan UBO Korporasi</p>
                    </div>

                    {/* Layer 3 Anonymized Accounts */}
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900">
                      <div className="flex justify-between items-center text-[9px] font-bold text-zinc-400 uppercase">
                        <span>Layer 3: Data Rekening Giro (Dianonimkan)</span>
                        <span className="text-cyan-400 font-black">MUTED RELAYS</span>
                      </div>
                      <p className="text-[8px] text-zinc-450 leading-relaxed mt-1">Aliran dana harian, kliring perbankan, & transaksi koresponden antar-individu</p>
                    </div>

                    {/* Layer 4 PEP Database */}
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900">
                      <div className="flex justify-between items-center text-[9px] font-bold text-zinc-400 uppercase">
                        <span>Layer 4: Relasi Keluarga & Jabatan Politik</span>
                        <span className="text-fuchsia-400 font-black">ACTIVE SCRAPER</span>
                      </div>
                      <p className="text-[8px] text-zinc-450 leading-relaxed mt-1">Database PEP, status PNS daerah, relasi saudara sekandung, & jabatan pimpinan proyek</p>
                    </div>
                  </div>

                  {/* GNN Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProcessingGnnClustering(true);
                      setTimeout(() => {
                        setIsProcessingGnnClustering(false);
                        setGnnClusteringCompleted(true);
                        alert("GNN Tensor clustering model completed: 2 hidden control networks discovered!");
                      }, 1200);
                    }}
                    disabled={isProcessingGnnClustering}
                    className="w-full py-3 bg-[#DFFF00] hover:bg-[#deff9a] text-black font-black text-xs tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer font-sans"
                  >
                    {isProcessingGnnClustering ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        CALCULATING TENSOR NODES...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        PROSES GNN CLUSTERING TENSOR
                      </>
                    )}
                  </button>

                  {gnnClusteringCompleted && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-zinc-950 border border-emerald-500/20 text-emerald-400 rounded-2xl space-y-3 font-mono text-[9px]"
                    >
                      <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                        <span className="font-extrabold uppercase text-[10px] text-white">2 HIDDEN CLUSTERS EXTRACTED</span>
                        <span className="px-1.5 py-0.5 bg-emerald-500 text-black text-[7px] font-black rounded font-mono uppercase">ACCURACY 98.4%</span>
                      </div>
                      <div className="space-y-2">
                        <div className="p-2 bg-zinc-900/60 rounded border border-zinc-850">
                          <p className="text-white font-bold uppercase text-[9.5px]">Cluster 1: Sovereign Mining Trust</p>
                          <p className="text-zinc-550 mt-0.5">Andi P. (98%) &larr; PT Sumatera Ore Mining &larr; Seychelles Shell Corp.</p>
                        </div>
                        <div className="p-2 bg-zinc-900/60 rounded border border-zinc-850">
                          <p className="text-white font-bold uppercase text-[9.5px]">Cluster 2: BVI Nominee Trust Group</p>
                          <p className="text-zinc-550 mt-0.5">Nominee Trustees &larr; Pacific Horizon Venture Ltd (BVI) &larr; PT Halmahera (Winner).</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSarAlertId("AL-SH-INV-SANDBOX-99");
                          setActiveSubTab('SAR_INTEL');
                          setSarDraftText('');
                          setSarReportSubmitted(false);
                          alert("Meneruskan draf klaster GNN menuju AI Formulator!");
                        }}
                        className="w-full py-2 bg-emerald-500 text-black font-extrabold rounded-xl hover:bg-white text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-black" />
                        DRAF LAPORAN PPATK SECARA KATEGORI &rarr;
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Right Panel: GNN Graph View & Money Mule Detector */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                  {/* Visual Neural Network Map */}
                  <div className="bg-[#020407] border border-zinc-900 rounded-[2rem] p-6 relative min-h-[300px] flex flex-col justify-between overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#DFFF00]/5 blur-3xl rounded-full" />
                    
                    <div className="flex justify-between items-center border-b border-zinc-900 pb-3 mb-4">
                      <span className="text-[10px] font-mono font-extrabold text-white uppercase tracking-wider block">SHADOW OWNER VISUAL LINKAGE GRAPH</span>
                      <span className="px-2 py-0.5 rounded text-[8px] font-mono font-black border bg-red-500/10 text-red-400 border-red-500/20 shadow-sm animate-pulse">
                        SHADOW CONTROL DETECTED
                      </span>
                    </div>

                    {/* SVG interactive network diagram linking the items */}
                    <div className="flex-1 min-h-[220px] bg-black/40 border border-zinc-900 rounded-2xl p-6 flex items-center justify-center relative">
                      <div className="w-full max-w-xl grid grid-cols-5 gap-3 items-center text-center font-mono relative z-10 py-6">
                        
                        {/* Node 1: PT Halmahera */}
                        <div className="flex flex-col items-center">
                          <div className="w-11 h-11 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center text-xs font-black text-white">
                            CORP
                          </div>
                          <span className="text-[8.5px] font-bold text-zinc-350 block mt-1.5 truncate max-w-[90px]">PT Halmahera Nickel</span>
                          <span className="text-[7px] text-zinc-500 block">Tender Winner</span>
                        </div>

                        {/* Link 1 */}
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-[6.5px] text-zinc-650 font-bold block mb-0.5 font-black">Hidden Contract</span>
                          <div className="w-full h-0.5 bg-red-500/40 relative">
                            <div className="absolute right-0 top-0 w-1.5 h-1.5 rounded-full bg-red-500 -mt-0.5" />
                          </div>
                          <span className="text-[6px] text-red-400 block mt-0.5 font-bold">Proxy control</span>
                        </div>

                        {/* Node 2: ASN Golongan Rendah / Money Mule */}
                        <div className="flex flex-col items-center p-2 bg-red-950/20 border border-red-500/30 rounded-2xl relative">
                          <div className="absolute -top-1.5 -right-1.5 text-[6.5px] font-black bg-red-500 text-black px-1.5 rounded-full font-black">
                            MULE
                          </div>
                          <div className="w-11 h-11 rounded-full bg-red-900/60 border-2 border-red-500 flex items-center justify-center text-xs font-black text-[#DFFF00] shadow-[0_0_15px_rgba(239,68,68,0.25)]">
                            GOL-II
                          </div>
                          <span className="text-[8.5px] font-bold text-white block mt-1.5 truncate max-w-[90px]">Andi P. (ASN Gol II-B)</span>
                          <span className="text-[7px] text-red-400 block font-bold mt-0.5">Money Mule Acc</span>
                        </div>

                        {/* Link 2 */}
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-[6.5px] text-zinc-650 font-bold block mb-0.5 font-black">Affiliation</span>
                          <div className="w-full h-0.5 bg-fuchsia-500/40 relative">
                            <div className="absolute right-0 top-0 w-1.5 h-1.5 rounded-full bg-fuchsia-400 -mt-0.5" />
                          </div>
                          <span className="text-[6px] text-fuchsia-400 block mt-0.5 font-bold">PEP Brother-In-Law</span>
                        </div>

                        {/* Node 3: Public Official (Deputi Dinas) */}
                        <div className="flex flex-col items-center">
                          <div className="w-11 h-11 rounded-full bg-fuchsia-950/40 border-2 border-fuchsia-500 flex items-center justify-center text-xs font-black text-white">
                            PEP
                          </div>
                          <span className="text-[8.5px] font-bold text-fuchsia-400 block mt-1.5 truncate max-w-[95px]">Deputi Dinas ESDM</span>
                          <span className="text-[7px] text-zinc-500 block">Public Official / Affil</span>
                        </div>

                      </div>
                    </div>

                    {/* Money Mules Core Detection Panel (Highlighting Low Profile ASN receiving billions) */}
                    <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl mt-4 space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                        <span className="text-[9px] font-mono font-extrabold text-white uppercase tracking-wider block">MONEY MULE / REKENING PENAMPUNG ALERTS</span>
                        <span className="text-[8px] font-mono text-red-400 font-bold">1 SYSTEMIC VIOLATION</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[10px] font-mono">
                          <thead>
                            <tr className="border-b border-zinc-800/60 text-zinc-500 uppercase">
                              <th className="pb-2">Individu Terlapor</th>
                              <th className="pb-2">Profil Pekerjaan</th>
                              <th className="pb-2 font-black text-zinc-300">Nominal Inflow</th>
                              <th className="pb-2">Yurisdiksi Inbound</th>
                              <th className="pb-2 text-right">GNN Risk Score</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-zinc-900/40 text-zinc-300">
                              <td className="py-2.5 font-bold text-white">Andi P. (ID: 0098)</td>
                              <td className="py-2.5">ASN Golongan II-B (PNS Daerah Luar)</td>
                              <td className="py-2.5 font-black text-[#DFFF00]">Rp 36.600.000.000</td>
                              <td className="py-2.5">Domestic (BCA Gajah Mada)</td>
                              <td className="py-2.5 text-right font-bold text-red-500">98% (MULE_VERIFIED)</td>
                            </tr>
                            <tr className="border-b border-zinc-900/40 text-zinc-500">
                              <td className="py-2.5">Suherman (ID: 0412)</td>
                              <td className="py-2.5">Pegawai Harian Lepas</td>
                              <td className="py-2.5 font-bold text-zinc-400">Rp 120.000.000</td>
                              <td className="py-2.5">Domestic Bank Transfer</td>
                              <td className="py-2.5 text-right font-bold text-emerald-400 font-mono">14% (BENIGN)</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <p className="text-[8.5px] text-zinc-500 leading-normal">
                        *Note Analis GNN: Rekening Andi P. (ASN Golongan II-B dengan gaji dasar Rp 3.5 juta/bulan) menerima transfer Rp 36.6 Miliar dari PT Halmahera Industrial Nickel dalam satu siklus tender pengerjaan IUP. Profil transaksi ini dinilai tidak mungkin secara legalitas riil, sehingga GNN secara otomatis memetakan target sebagai "Money Mule" bagi entitas pengendali bayangan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {gnnViewMode === 'PEPLINK' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Config Deck */}
                <div className="lg:col-span-5 bg-[#020407] border border-zinc-900 rounded-[2rem] p-6 space-y-4">
                  <div className="border-b border-zinc-900 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#DFFF00]" />
                      <span className="text-xs font-black text-white uppercase tracking-wider font-mono">1. DATABASE INTEGRITY DECK</span>
                    </div>
                    <span className="px-2 py-0.5 bg-zinc-950 text-zinc-500 text-[8px] font-mono rounded">
                      VERSI: 1.0.4-LHKPN
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">Company Target Name (Tender Winner)</label>
                      <input 
                        type="text" 
                        value={pepQueryCompany}
                        onChange={(e) => setPepQueryCompany(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-xl font-mono text-xs text-white uppercase focus:outline-none focus:border-[#DFFF00]"
                        placeholder="PT SAMUDRA ORE MINING"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">AHU Owner / UBO Name</label>
                        <input 
                          type="text" 
                          value={pepQueryAhuOwner}
                          onChange={(e) => setPepQueryAhuOwner(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-xl font-mono text-xs text-white uppercase focus:outline-none focus:border-[#DFFF00]"
                          placeholder="HENDRA PRAYOGA"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">Family Associate Link</label>
                        <input 
                          type="text" 
                          value={pepQueryFamilyLink}
                          onChange={(e) => setPepQueryFamilyLink(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-xl font-mono text-xs text-white uppercase focus:outline-none focus:border-[#DFFF00]"
                          placeholder="BAMBANG PRAYOGA"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">Relation Type Status</label>
                        <select
                          value={pepFamilyRelationType}
                          onChange={(e) => setPepFamilyRelationType(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-xl font-mono text-xs text-white uppercase focus:outline-none focus:border-[#DFFF00]"
                        >
                          <option value="Aparatur Sipil / Kakak Kandung">Kakak Kandung / PNS</option>
                          <option value="Istri Kandung">Istri Kandung</option>
                          <option value="Suami Kandung">Suami Kandung</option>
                          <option value="Anak Kandung">Anak Kandung</option>
                          <option value="Ipar Dekat">Ipar Dekat</option>
                          <option value="Sepupu Dekat">Sepupu Dekat</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">PEP Target Position</label>
                        <input 
                          type="text" 
                          value={pepQueryPepPosition}
                          onChange={(e) => setPepQueryPepPosition(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-900 p-2.5 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-[#DFFF00]"
                          placeholder="Direktur Jenderal Pertambangan Minerba"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold text-[#DFFF00] uppercase">Procurement Conflict Link (Three-Way check)</span>
                        <input 
                          type="checkbox" 
                          checked={pepQueryHasTenderWon} 
                          onChange={(e) => setPepQueryHasTenderWon(e.target.checked)}
                          className="rounded text-[#DFFF00] focus:ring-0 bg-black border-zinc-800"
                        />
                      </div>

                      {pepQueryHasTenderWon && (
                        <div className="grid grid-cols-2 gap-3 mt-2 animate-fade-in">
                          <div>
                            <label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Target Department</label>
                            <input 
                              type="text" 
                              value={pepQueryProcurementDept}
                              onChange={(e) => setPepQueryProcurementDept(e.target.value)}
                              className="w-full bg-black border border-zinc-900 p-2 text-[11px] rounded-lg text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Contract Tender Value (IDR)</label>
                            <input 
                              type="number" 
                              value={pepQueryTenderWorth}
                              onChange={(e) => setPepQueryTenderWorth(Number(e.target.value))}
                              className="w-full bg-black border border-zinc-900 p-2 text-[11px] rounded-lg text-white font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Safety Policies */}
                    <div className="p-3 bg-zinc-950/40 border border-zinc-900 border-dashed rounded-2xl space-y-2">
                      <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">GOVERNANCE & AUDIT CONTROLS</span>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-300 font-bold">Anonymized Processing Toggle</span>
                          <span className="text-[8px] text-zinc-500 font-mono">Mask confidential PEP identity unless Risk Score &gt; 80%</span>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={pepAnonymize} 
                          onChange={(e) => setPepAnonymize(e.target.checked)}
                          className="rounded text-[#DFFF00] focus:ring-0 bg-black border-zinc-800"
                        />
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-900/60 pt-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-300 font-bold">Fuzzy Matching Sensitivity</span>
                          <span className="text-[8px] text-zinc-500 font-mono">Address Indonesian duplicate names & locations</span>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={pepFuzzyMatching} 
                          onChange={(e) => setPepFuzzyMatching(e.target.checked)}
                          className="rounded text-[#DFFF00] focus:ring-0 bg-black border-zinc-800"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isPepScanning}
                      onClick={handleRunPepLinkageScan}
                      className="w-full py-3.5 bg-[#DFFF00] hover:bg-[#deff9a] text-black font-black text-xs tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isPepScanning ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-black" />
                          MENGEVALUASI TIGA KELAYAKAN...
                        </>
                      ) : (
                        <>
                          <Activity className="w-4 h-4 text-black" />
                          PROSES EVALUASI PEP-LINKAGE (3-WAY MATCH)
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right Column: Dynamic Results & Code / Immutable Logging */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  
                  {/* Performance Analysis Gauge */}
                  <div className="bg-[#020407] border border-zinc-900 rounded-[2rem] p-6 relative overflow-hidden min-h-[220px] flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/[0.01] blur-2xl rounded-full" />
                    
                    <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                      <span className="text-[9px] font-mono font-extrabold text-[#DFFF00] uppercase tracking-wider block">REALTIME PEP-LINKAGE AUDIT STATUS</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border tracking-wider ${
                        pepRiskScore === null 
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-500' 
                          : pepRiskScore >= 80 
                            ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' 
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      }`}>
                        {pepRiskScore === null ? 'IDLE' : pepRiskScore >= 80 ? 'HIGH RISK ALERT (3-WAY MATCHED)' : 'COMPLIANT'}
                      </span>
                    </div>

                    {isPepScanning && (
                      <div className="flex-1 py-12 flex flex-col items-center justify-center space-y-3">
                        <RefreshCw className="w-8 h-8 text-[#DFFF00] animate-spin" />
                        <div className="text-center">
                          <p className="text-[10px] font-mono text-zinc-300 font-bold uppercase animate-pulse">MEMPROSES DATA GNN KSEI + AHU + LPSE</p>
                          <p className="text-[8px] font-mono text-zinc-500 uppercase mt-1">Menggabungkan data LHKPN & silsilah kekeluargaan...</p>
                        </div>
                      </div>
                    )}

                    {!isPepScanning && pepRiskScore === null && (
                      <div className="flex-1 py-10 flex flex-col items-center justify-center text-center">
                        <HelpCircle className="w-10 h-10 text-zinc-700 block mb-2" />
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Belum Ada Analisis Terbuka</h4>
                        <p className="text-[10px] text-zinc-500 max-w-sm leading-normal mt-1 font-mono">
                          Silakan isi data deck di sebelah kiri lalu klik tombol evaluasi untuk menjalankan algoritma pendeteksi keterlibatan internal pemerintah.
                        </p>
                      </div>
                    )}

                    {!isPepScanning && pepRiskScore !== null && (
                      <div className="space-y-4 pt-3 flex-1 flex flex-col justify-between">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          
                          {/* Left: Score Box */}
                          <div className={`md:col-span-4 p-4 rounded-2xl border text-center font-mono ${
                            pepRiskScore >= 80 
                              ? 'bg-red-950/20 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.05)]' 
                              : pepRiskScore >= 40 
                                ? 'bg-amber-950/20 border-amber-500/30 text-amber-400' 
                                : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                          }`}>
                            <span className="text-[8px] text-zinc-500 uppercase block font-bold mb-1">PEP RISK SCORE</span>
                            <span className="text-3xl font-black block">{pepRiskScore}/100</span>
                            <span className="text-[7.5px] uppercase font-bold block mt-1 tracking-widest">
                              {pepRiskScore >= 80 ? 'EMBEZZLEMENT RISK' : pepRiskScore >= 40 ? 'MEDIUM CONFLICT' : 'LOW CONFLICT'}
                            </span>
                          </div>

                          {/* Right: Matches Descriptions */}
                          <div className="md:col-span-8 space-y-2">
                            <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase block">INTEGRITY BREACH IDENTIFIERS:</span>
                            <div className="space-y-1.5 text-[10px] font-mono">
                              {pepMatchedLinks.map((link, idx) => {
                                const isMasked = pepAnonymize && pepRiskScore < 80;
                                const displayedLabel = isMasked ? "●●●●● (MASKED POLICY)" : link.label;
                                return (
                                  <div key={idx} className="p-2.5 bg-black rounded-lg border border-zinc-900 flex items-start gap-2">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                      <p className="text-[#DFFF00] font-bold text-[9.5px] uppercase">{link.type}</p>
                                      <p className="text-white font-semibold text-[10px] mt-0.5">{displayedLabel}</p>
                                      <p className="text-zinc-400 text-[9px] font-normal leading-normal mt-0.5">{link.details}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                        </div>

                        {/* Governance Footnote details */}
                        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900/40 text-[9px] font-mono text-zinc-400">
                          <div className="flex items-center gap-1.5 mb-1.5 font-bold text-zinc-300">
                            <Lock className="w-3 h-3 text-[#DFFF00]" />
                            <span>CONFIDENTIALITY MASKING REPORT</span>
                          </div>
                          {pepAnonymize && pepRiskScore < 80 ? (
                            <p className="leading-relaxed">
                              [MASKING ACTIVE] Identitas PEP dienkripsi penuh karena skor risiko belum mencapai ambang audit &lt;80% untuk dipublikasikan ke PPATK. Tuntutan hukum dan LHKPN dicegah secara otomatis.
                            </p>
                          ) : (
                            <p className="leading-relaxed text-red-400 font-bold">
                              [DECRYPTED ACTION] Ambang batas risiko kritis terlampaui (RISK: {pepRiskScore}%). Identitas PEP dinyalakan penuh untuk keperluan eksportasi pelaporan resmi (LTKM-PPATK-01).
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pseudo-code specifications tab from specs */}
                  <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-5 space-y-3 font-mono">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-[#DFFF00]" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">PEP-LINKAGE ALGORITHM CODE EXCEL</span>
                      </div>
                      <span className="text-[7.5px] text-zinc-500">python / engine_pep_core.py</span>
                    </div>

                    <div className="p-3 bg-black rounded-xl border border-zinc-900 overflow-x-auto text-[9.5px] leading-relaxed text-zinc-400 font-mono select-all">
                      <pre>
{`def check_pep_involvement(CompanyEntity):
    risk_score = 0
    pep_links = []
    
    # 1. Direct Ownership Check (AHU)
    beneficial_owners = get_beneficial_owners(CompanyEntity)
    for owner in beneficial_owners:
        if is_pep(owner):
            risk_score += 60
            pep_links.append({"owner": owner, "type": "Direct PEP Ownership"})
            
    # 2. Indirect Ownership/Family Link (Graph Traversal)
    family_members = get_family_relatives(owner)
    for member in family_members:
        if is_pep(member):
            risk_score += 50
            pep_links.append({"link": member, "type": "Family PEP Connection"})

    # 3. Procurement Conflict Check (The "Internal Government" Link)
    if has_won_tenders(CompanyEntity, target_pep_department=get_pep_dept(owner)):
        risk_score += 40
        pep_links.append({"link": "Procurement Conflict", "type": "Tender Integrity Breach"})

    return risk_score, pep_links`}
                      </pre>
                    </div>
                  </div>

                  {/* Governance Active Logging Footer (Immutable Activity Log) */}
                  <div className="bg-[#020407] border border-zinc-900 rounded-[2rem] p-6 space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-black text-white uppercase tracking-wider font-mono">3. GOVERNMENT TENDER (LPSE) INGESTION PORT</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[8px] font-mono font-bold animate-pulse">LPSE INTEGRATED</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Sub-block A: Pipeline Monitor */}
                      <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900 space-y-2">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase font-black block">LPSE DATA-INGEST PIPELINE MONITOR</span>
                        <div className="space-y-1.5 font-mono text-[9px] text-zinc-350">
                          <div className="flex justify-between">
                            <span>LPSE RSS Stream:</span>
                            <span className="text-emerald-400 font-bold">READY (SECURE FEED)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Ingestion Rate:</span>
                            <span className="text-[#DFFF00] font-bold">14,842 Contracts/Day</span>
                          </div>
                          <div className="flex justify-between">
                            <span>"Smoking Gun" Clues:</span>
                            <span className="text-red-400 font-bold">3 Conflict Matches active</span>
                          </div>
                        </div>
                      </div>

                      {/* Sub-block B: Digital Footprint Audit Logs */}
                      <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900 space-y-1 overflow-y-auto max-h-[85px]">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase font-black block mb-1">AUDIT DIGITAL FOOTPRINT LOGS (IMMUTABLE)</span>
                        <div className="space-y-1 text-[8px] font-mono">
                          {pepAuditLogs.map((log) => (
                            <div key={log.id} className="flex justify-between border-b border-zinc-900 pb-1 mt-1 text-zinc-400">
                              <span className="text-zinc-200 font-bold">[{log.id}]</span>
                              <span className="truncate max-w-[80px]">{log.target}</span>
                              <span className="text-[#DFFF00]">{log.action.replace('Three-Way Match ', '')}</span>
                              <span className={log.status === 'ALERT_CONFIRMED' || log.status === 'HIGH_RISK_AUDITED' ? 'text-red-400 font-bold' : 'text-zinc-500'}>
                                {log.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}
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

        {/* TAB 6: DATA STANDARDISATION HUB */}
        {activeSubTab === 'DATA_STANDARD' && (
          <motion.div
            key="tbml-data-standard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
            id="tbml-data-standard-view"
          >
            {/* Header / Intro */}
            <div className="p-6 bg-[#020407] border border-zinc-900 rounded-[2rem] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <span className="text-[8px] font-black text-[#DFFF00] uppercase tracking-[0.2em] block mb-1">Standardisasi Data Multi-Sumber</span>
                <h2 className="text-xl font-black text-white uppercase tracking-wider">REGULATORY DATA INTEGRATION & STANDARDISATION</h2>
                <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
                  Sistem integrasi dinamis yang memetakan format data heterogen dari berbagai instansi nasional (Perbankan/SWIFT, Bea Cukai, Bursa Efek/SID, & Kemenkumham AHU) ke dalam skema data terpadu untuk analisis TBML otomatis.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <span className="px-3 py-1.5 bg-zinc-950 rounded-xl border border-zinc-900 text-[10px] font-mono font-bold text-zinc-400">
                  ISO-20022 ALIGNED
                </span>
                <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 text-[10px] font-mono font-bold">
                  VALIDATION: ACTIVE
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Data Input Deck */}
              <div className="lg:col-span-5 bg-[#020407] border border-zinc-900 rounded-[2rem] p-6 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-900">
                  <Database className="w-4 h-4 text-[#DFFF00]" />
                  <h3 className="text-xs font-black text-white uppercase tracking-widest font-mono">1. PILIH SUMBER & REKAYASA PAYLOAD</h3>
                </div>

                {/* Sub-tabs inside the panel for source selection */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'BEA_CUKAI', label: 'Bea Cukai (Manifest)', icon: FileSpreadsheet, desc: 'BC 1.1 HS-Code Bills' },
                    { id: 'PERBANKAN', label: 'Perbankan (SWIFT)', icon: Globe, desc: 'MT103 Wire Transfers' },
                    { id: 'BURSA_SID', label: 'Bursa Efek (SID)', icon: Activity, desc: 'KUSTODIAN KPEI Stock' },
                    { id: 'KEMENKUMHAM', label: 'Kemenkumham (AHU)', icon: Building, desc: 'Akta Korporasi & UBO' }
                  ].map(source => {
                    const isSel = selectedDataSource === source.id;
                    const Icon = source.icon;
                    return (
                      <button
                        key={source.id}
                        type="button"
                        onClick={() => {
                          setSelectedDataSource(source.id as any);
                          setRawInputPayload(SOURCES_RAW_PRESETS[source.id as keyof typeof SOURCES_RAW_PRESETS]);
                          setStandardizedOutput(null);
                          setHasInjectedStandard(false);
                          setIngestionLogs([]);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between h-20 ${
                          isSel 
                            ? 'bg-[#DFFF00]/10 border-[#DFFF00] text-white' 
                            : 'bg-zinc-950/60 border-zinc-900 text-zinc-400 hover:border-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[10px] font-black uppercase tracking-wider">{source.label}</span>
                          <Icon className={`w-3.5 h-3.5 ${isSel ? 'text-[#DFFF00]' : 'text-zinc-500'}`} />
                        </div>
                        <span className="text-[8px] text-zinc-500 font-mono block mt-1">{source.desc}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Payload Editor */}
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[8.5px] font-mono font-bold text-zinc-500 uppercase">RAW SOURCE PAYLOAD PREVIEW (EDITABLE)</span>
                    <button
                      type="button"
                      onClick={() => {
                        setRawInputPayload(SOURCES_RAW_PRESETS[selectedDataSource]);
                        setStandardizedOutput(null);
                        setHasInjectedStandard(false);
                      }}
                      className="text-[8px] font-bold text-red-400 hover:underline uppercase"
                    >
                      Reset Template
                    </button>
                  </div>
                  <textarea
                    value={rawInputPayload}
                    onChange={(e) => setRawInputPayload(e.target.value)}
                    className="w-full h-64 bg-black/90 text-zinc-300 font-mono text-[9.5px] p-4 rounded-xl border border-zinc-900 focus:outline-none focus:border-[#DFFF00]/60 resize-none leading-relaxed custom-scrollbar"
                    placeholder="Tempel dokumen raw data XML, JSON atau SWIFT MT103 di sini..."
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsProcessingStandard(true);
                    setHasInjectedStandard(false);
                    setIngestionLogs([
                      `[INGEST] Membaca payload format raw: ${selectedDataSource}...`,
                      `[PARSER] Melakukan inisialisasi parser skema pengurai regulasi nasional...`
                    ]);

                    setTimeout(() => {
                      setIngestionLogs(prev => [
                        ...prev,
                        `[VALIDATOR] Menguji validitas baris kode integritas data... OK (Verified)`,
                        `[CORRELATOR] Menyelaraskan atribut dasar: Unit Price, Volume, Hash Tag, & Origin.`
                      ]);
                    }, 600);

                    setTimeout(() => {
                      // Generate standardized data based on choice
                      let out: StandardDataModel;
                      if (selectedDataSource === 'BEA_CUKAI') {
                        out = {
                          origin_channel: 'BEA_CUKAI',
                          transaction_id: 'BC-COAL-998',
                          timestamp: new Date().toLocaleDateString('id-ID'),
                          item_name: 'Thermal Coal (Gar 4200)',
                          item_id: 'COAL',
                          sender_entity: 'Bumi Minerals Clearing Tbk',
                          recipient_entity: 'Pacific Horizon Venture Corp',
                          unit_price: 1490000,
                          quantity: 1250,
                          total_value: 1862500000,
                          matched_ubo_names: ['Anonymous Shadow Trustee #491'],
                          jurisdiction_route: 'British Virgin Islands (BVI) -> Indonesia',
                          baseline_deviation_percentage: -2, 
                          suspicious_rating: 'SUSPICIOUS_MAPPED'
                        };
                      } else if (selectedDataSource === 'PERBANKAN') {
                        out = {
                          origin_channel: 'PERBANKAN',
                          transaction_id: 'TX-SWIFT-99120',
                          timestamp: new Date().toLocaleDateString('id-ID'),
                          item_name: 'Offshore Bilateral Nickel SWIFT Outflow',
                          item_id: 'NICKEL',
                          sender_entity: 'PT Halmahera Industrial Nickel',
                          recipient_entity: 'BVI Trust Wallets 0x8a',
                          unit_price: 360000000,
                          quantity: 50,
                          total_value: 18000000000,
                          matched_ubo_names: ['BVI Shadow Trust Corp UBO', 'Pacific Horizon Trust'],
                          jurisdiction_route: 'BVI Agent (Cayman Gateway)',
                          baseline_deviation_percentage: 44, 
                          suspicious_rating: 'CRITICAL_RISK'
                        };
                      } else if (selectedDataSource === 'BURSA_SID') {
                        out = {
                          origin_channel: 'BURSA_SID',
                          transaction_id: 'BEI-SEC-721',
                          timestamp: new Date().toLocaleDateString('id-ID'),
                          item_name: 'Bursa Shares Nickel Liquidity Inflow',
                          item_id: 'TECH_LICENSE', 
                          sender_entity: 'Kustodian KPEI Clearing',
                          recipient_entity: 'Bumi Minerals Clearing Account Target',
                          unit_price: 320000,
                          quantity: 85000,
                          total_value: 27200000000,
                          matched_ubo_names: ['PT Capital Gate Nominee'],
                          jurisdiction_route: 'Indonesia Domestik',
                          baseline_deviation_percentage: 0,
                          suspicious_rating: 'NOMINAL_STABLE'
                        };
                      } else {
                        out = {
                          origin_channel: 'KEMENKUMHAM',
                          transaction_id: 'AHU-009812-PT',
                          timestamp: new Date().toLocaleDateString('id-ID'),
                          item_name: 'Corporate Deed Holding Structure Alignment',
                          item_id: 'COAL',
                          sender_entity: 'Pacific Horizon Venture Ltd (BVI)',
                          recipient_entity: 'PT Halmahera Industrial Nickel',
                          unit_price: 1530000,
                          quantity: 1000,
                          total_value: 1530000000,
                          matched_ubo_names: ['Pacific Horizon Venture Ltd (UBO)', 'Sovereign Nominee Group (UBO)'],
                          jurisdiction_route: 'BVI -> Indonesia Corporate Web',
                          baseline_deviation_percentage: 0,
                          suspicious_rating: 'SUSPICIOUS_MAPPED'
                        };
                      }

                      setIngestionLogs(prev => [
                        ...prev,
                        `[RESOLVER] Berhasil memetakan UBO penerima manfaat akhir: [${out.matched_ubo_names.join(', ')}]`,
                        `[STANDARDIZER] Selesai menyusun skema terpadu UNIFORM_COMPLIANCE_MODEL.`,
                        `[SYSTEM] Penyelarasan format data bursa, perbankan, dan Kemenkumham sukses.`
                      ]);

                      setStandardizedOutput(out);
                      setIsProcessingStandard(false);

                      setTerminalFeed(prev => [
                        `[DATA INTEGRATION] Standardised payload successfully compiled for source: ${selectedDataSource}. Transaction ID: ${out.transaction_id}`,
                        ...prev
                      ]);
                    }, 1200);
                  }}
                  className="w-full py-3 bg-[#DFFF00] hover:bg-[#deff9a] text-black font-black text-xs tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 transition-all font-sans cursor-pointer mt-2"
                >
                  {isProcessingStandard ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                      MEMROSES STANDARISASI...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 text-black" />
                      PROSES & STANDARISASI DATA
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: Processing logs & Uniform Standard Schema Card */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                {/* Standardization Live Pipeline Logs */}
                <div className="bg-[#020407] border border-zinc-900 rounded-[2rem] p-6">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-900">
                    <Terminal className="w-4 h-4 text-[#DFFF00]" />
                    <span className="text-xs font-black text-white uppercase tracking-wider font-mono">2. STANDARDISED PARSING PIPELINE MONITOR</span>
                  </div>

                  <div className="bg-black border border-zinc-900 p-4 rounded-xl h-36 overflow-y-auto font-mono text-[9px] text-[#DFFF00] space-y-1.5 custom-scrollbar">
                    {ingestionLogs.length === 0 ? (
                      <p className="text-zinc-650 italic">Sistem standarisasi siap dilakukan. Pilih sumber data di sebelah kiri lalu jalankan proses parser...</p>
                    ) : (
                      ingestionLogs.map((log, i) => (
                        <p key={i} className={log.includes('[VALIDATOR]') ? 'text-emerald-400' : log.includes('[RESOLVER]') ? 'text-fuchsia-400' : 'text-[#DFFF00]'}>
                          {log}
                        </p>
                      ))
                    )}
                  </div>
                </div>

                {/* Standardized Structure View Container */}
                <div className="bg-zinc-950 p-6 border border-zinc-900 rounded-[2rem] flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
                      <span className="text-[10px] font-mono font-extrabold text-white uppercase tracking-wider block">UNIFORM DATA MODEL PREVIEW</span>
                      {standardizedOutput && (
                        <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black border ${
                          standardizedOutput.suspicious_rating === 'CRITICAL_RISK' 
                            ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-sm' 
                            : standardizedOutput.suspicious_rating === 'SUSPICIOUS_MAPPED'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {standardizedOutput.suspicious_rating}
                        </span>
                      )}
                    </div>

                    {standardizedOutput ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-black/60 border border-zinc-900 rounded-xl">
                            <span className="text-[8px] text-zinc-500 font-bold block uppercase tracking-wider">Unified Transaction ID</span>
                            <span className="text-xs font-mono font-black text-white">{standardizedOutput.transaction_id}</span>
                          </div>
                          <div className="p-3 bg-black/60 border border-zinc-900 rounded-xl">
                            <span className="text-[8px] text-zinc-500 font-bold block uppercase tracking-wider">Source Registry Channel</span>
                            <span className="text-xs font-mono font-black text-[#DFFF00]">{standardizedOutput.origin_channel}</span>
                          </div>
                        </div>

                        <div className="p-4 bg-black/60 border border-zinc-900 rounded-xl space-y-2">
                          <span className="text-[8px] text-zinc-500 font-bold block uppercase tracking-wider">Sender (Origin Physical / Legal Entity)</span>
                          <p className="text-xs font-sans font-extrabold text-white uppercase">{standardizedOutput.sender_entity}</p>
                          
                          <span className="text-[8px] text-zinc-500 font-bold block uppercase tracking-wider pt-1.5">Recipient (Beneficiary Legal Entity)</span>
                          <p className="text-xs font-sans font-extrabold text-emerald-400 uppercase">{standardizedOutput.recipient_entity}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 bg-black/40 border border-zinc-900 rounded-xl">
                            <span className="text-[7.5px] text-zinc-500 block uppercase font-bold">Unified Item ID</span>
                            <span className="text-[11px] font-sans font-extrabold text-white">{standardizedOutput.item_id}</span>
                          </div>
                          <div className="p-3 bg-black/40 border border-zinc-900 rounded-xl col-span-2">
                            <span className="text-[7.5px] text-zinc-500 block uppercase font-bold">Matched Ultimate Beneficial Owners (UBO) via Kemenkumham</span>
                            <span className="text-[10px] font-mono font-medium text-fuchsia-400 truncate block">
                              {standardizedOutput.matched_ubo_names.join(', ')}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 font-mono">
                          <div className="p-3 bg-[#0d0d12]/60 border border-zinc-900 rounded-xl">
                            <span className="text-[7.5px] text-zinc-500 block uppercase">Standard Price</span>
                            <span className="text-[10px] font-black text-white">Rp {standardizedOutput.unit_price.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="p-3 bg-[#0d0d12]/60 border border-zinc-900 rounded-xl">
                            <span className="text-[7.5px] text-zinc-500 block uppercase">Standard Qty</span>
                            <span className="text-[10px] font-black text-white">{standardizedOutput.quantity.toLocaleString('id-ID')} unit</span>
                          </div>
                          <div className="p-3 bg-[#0d0d12]/60 border border-zinc-900 rounded-xl">
                            <span className="text-[7.5px] text-zinc-500 block uppercase">Calculated Value</span>
                            <span className="text-[10px] font-black text-emerald-400">Rp {standardizedOutput.total_value.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-20 text-center text-zinc-650 border border-dashed border-zinc-900 rounded-2xl">
                        Sistem sedia memetakan data. Silakan jalankan parser di sebelah kiri untuk melihat standardisasi schema.
                      </div>
                    )}
                  </div>

                  {standardizedOutput && (
                    <div className="pt-4 border-t border-zinc-900 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          const newInvoice: InvoiceData = {
                            id: standardizedOutput.transaction_id,
                            item_id: standardizedOutput.item_id,
                            commodity_name: standardizedOutput.item_name,
                            unit_price: standardizedOutput.unit_price,
                            quantity: standardizedOutput.quantity,
                            manifest_id: `MNF-${standardizedOutput.item_id}-${Date.now().toString().slice(-4)}`,
                            seller_id: standardizedOutput.origin_channel === 'KEMENKUMHAM' ? 'UBO-SHELL-BVI' : 'BVI-TRUST-99',
                            seller_name: standardizedOutput.sender_entity,
                            origin: standardizedOutput.origin_channel === 'PERBANKAN' ? 'British Virgin Islands' : 'Indonesia',
                            channel: standardizedOutput.origin_channel === 'PERBANKAN' ? 'SWIFT_WIRE' : standardizedOutput.origin_channel === 'BURSA_SID' ? 'BURSA_SID' : standardizedOutput.origin_channel === 'BEA_CUKAI' ? 'OTC_BILATERAL' : 'SHELL_TRANSFER',
                            sender_entity: standardizedOutput.sender_entity,
                            recipient_entity: standardizedOutput.recipient_entity,
                            hash_address: `STD:CORR:${Date.now().toString().slice(-6)}`
                          };

                          setInvoices(prev => [newInvoice, ...prev]);

                          const newBankLog: BankingLog = {
                            transaction_id: `TX-BANK-STD-${Date.now().toString().slice(-3)}`,
                            invoice_id: standardizedOutput.transaction_id,
                            amount: standardizedOutput.total_value,
                            sender_bank_routing: selectedDataSource === 'PERBANKAN' ? 'Swiss Offshore Wire' : 'Domestic Central Bank',
                            recipient_bank_routing: 'BCA Gajah Mada Jakarta',
                            seller_id: newInvoice.seller_id,
                            timestamp: Date.now()
                          };
                          setBankLogs(prev => [newBankLog, ...prev]);

                          const newSid: SIDActivity = {
                            sid_id: `SID-ING-${Date.now().toString().slice(-3)}`,
                            investor_name: standardizedOutput.recipient_entity,
                            amount_deposited: standardizedOutput.total_value,
                            timestamp: Date.now() + 60000
                          };
                          setSidActivities(prev => [newSid, ...prev]);

                          setAuditedLogsCount(prev => prev + 1);

                          setTerminalFeed(prev => [
                            `[DATA_STANDARD] Injected standardized transaction directly into Surveillance Radar Hub: ID ${newInvoice.id} | Val Rp ${standardizedOutput.total_value.toLocaleString('id-ID')} | Status AUDITED`,
                            ...prev
                          ]);

                          setHasInjectedStandard(true);
                          alert(`Data Standardisasi ${standardizedOutput.transaction_id} sukses disuntikkan ke dalam Live Surveillance Stream!`);
                        }}
                        disabled={hasInjectedStandard}
                        className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          hasInjectedStandard 
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed' 
                            : 'bg-[#DFFF00] border-[#DFFF00] text-black hover:bg-[#deff9a]'
                        }`}
                      >
                        <Database className="w-4 h-4 text-black" />
                        {hasInjectedStandard ? "SUKSES DISUNTIKKAN KE SURVEILLANCE RADAR HUB" : "DISUNTIKKAN KE SURVEILLANCE RADAR HUB (LIVE)"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 7: AI-POWERED SUSPICIOUS ACTIVITY REPORT (SAR) */}
        {activeSubTab === 'SAR_INTEL' && (
          <motion.div
            key="tbml-sar-generator"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
            id="tbml-sar-intelligence-view"
          >
            {/* Header / Intro */}
            <div className="p-6 bg-[#020407] border border-zinc-900 rounded-[2rem] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <span className="text-[8px] font-black text-[#DFFF00] uppercase tracking-[0.2em] block mb-1">Penyusunan LTKM Kepatuhan Nasional (PPATK)</span>
                <h2 className="text-xl font-black text-white uppercase tracking-wider">AI-POWERED SUSPICIOUS ACTIVITY REPORT (SAR)</h2>
                <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
                  Modul automasi cerdas yang menangkap anomali transaksi mencurigakan dari sistem deteksi radar, kemudian langsung meramu rancangan Laporan Transaksi Keuangan Mencurigakan (LTKM) resmi sesuai dengan format standar otoritas kepatuhan PPATK Republik Indonesia (UU No. 8 Tahun 2010).
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <span className="px-3 py-1.5 bg-zinc-950 rounded-xl border border-zinc-900 text-[10px] font-mono font-bold text-red-100">
                  PPATK LOGO SECURE
                </span>
                <span className="px-3 py-1.5 bg-red-400/10 text-red-500 rounded-xl border border-red-500/20 text-[10px] font-mono font-bold">
                  AUTONOMOUS SAR
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Config Deck & Alert Node Selector */}
              <div className="lg:col-span-12 xl:col-span-5 bg-[#020407] border border-zinc-900 rounded-[2rem] p-6 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-900">
                  <Sliders className="w-4 h-4 text-[#DFFF00]" />
                  <h3 className="text-xs font-black text-white uppercase tracking-widest font-mono">1. PARAMETER PENYALURAN SAR</h3>
                </div>

                <div className="space-y-3">
                  {/* Select alert to report on */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-400 block uppercase font-mono">Pilih Node Anomali Aktif</label>
                    <select
                      value={selectedSarAlertId}
                      onChange={(e) => {
                        setSelectedSarAlertId(e.target.value);
                        setSarDraftText('');
                        setSarReportSubmitted(false);
                      }}
                      className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-xs text-white uppercase focus:outline-none focus:border-[#DFFF00]"
                    >
                      <option value="">-- PILIH ALIRAN ANOMALI YANG MAU DI-REPORT --</option>
                      {alerts.map((el, idx) => (
                        <option key={`${el.id}-${idx}`} value={el.id}>
                          [{el.severity}] {el.type} - REF: {el.referenceId}
                        </option>
                      ))}
                      <option value="AL-OTC-TX-OTC-812">[CRITICAL] Private OTC Commodity Swap - NICKEL (Pacific Horizon BVI)</option>
                      <option value="AL-CRYP-CRYP-7302">[CRITICAL] Crypto Ledger Dispersion - LUXURY WATCH</option>
                      <option value="AL-WIRE-SWIFT-4091">[HIGH] Unmanifested Bank Wire - Cayman/SWIFT</option>
                      <option value="AL-GOLD">[CRITICAL] Under-Invoiced 24K Gold Bars - SEY-SHELL</option>
                    </select>
                  </div>

                  {/* Institution Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 block uppercase font-mono">Tipe Lembaga Pelapor</label>
                      <input 
                        type="text" 
                        readOnly 
                        value="Penyedia Jasa Keuangan (Bank Mandat)" 
                        className="w-full bg-zinc-950 border border-zinc-900 p-3 rounded-xl text-[10px] text-zinc-400 font-bold uppercase"
                      />
                    </div>
                    <div className="space-y-1 font-mono">
                      <label className="text-[9px] font-bold text-zinc-400 block uppercase">Format Laporan</label>
                      <div className="flex gap-2">
                        {['LTKM-PPATK-01', 'STANDARD-ISO-20022'].map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setSarReportFormat(opt as any)}
                            className={`flex-1 py-2 rounded-lg text-[8px] font-black border uppercase transition-all ${
                              sarReportFormat === opt 
                                ? 'bg-zinc-900 text-white border-[#DFFF00]' 
                                : 'bg-zinc-950 text-zinc-500 border-zinc-900'
                            }`}
                          >
                            {opt === 'LTKM-PPATK-01' ? 'Form LTKM-01' : 'ISO 20022'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Violation Suspicions (Checkbox representation) */}
                  <div className="p-3 bg-[#0d0d12]/60 border border-zinc-900 rounded-xl space-y-2">
                    <span className="text-[9px] font-mono text-zinc-500 block uppercase font-bold">Klasifikasi Dugaan Pelanggaran Kepatuhan</span>
                    <div className="grid grid-cols-2 gap-2 text-[8.5px] font-mono font-medium text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#DFFF00]" /> Pencucian Uang (TPPU)
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Tbml (Over-Invoicing)
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#DFFF00]" /> Pendanaan Terorisme
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400" /> Capital Flight Tambang
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsGeneratingSar(true);
                    setSarReportSubmitted(false);
                    setSarDraftText('');

                    const currentAlertId = selectedSarAlertId || 'AL-OTC-TX-OTC-812';
                    const activeAlertTarget = alerts.find(a => a.id === currentAlertId);
                    
                    const payload = {
                      alertId: currentAlertId,
                      refId: activeAlertTarget?.referenceId || 'INV-SANDBOX-99',
                      type: activeAlertTarget?.type || 'Trade-Based Money Laundering',
                      ubo: activeAlertTarget?.referenceId ? `Beneficial ownership linked to Ref: ${activeAlertTarget.referenceId}` : 'Pacific Horizon Venture Ltd (BVI)',
                      sender: activeAlertTarget?.description ? (activeAlertTarget.description.split('->')[0] || 'PT Halmahera Industrial Nickel').trim() : 'PT Halmahera Industrial Nickel',
                      recipient: activeAlertTarget?.description ? (activeAlertTarget.description.split('->')[1] || 'Pacific Horizon Venture Ltd (BVI)').trim() : 'Pacific Horizon Venture Ltd (BVI)',
                      amount: 'Rp 36,000,000,000 (Trade Commodity Volume Valuation)',
                      severity: activeAlertTarget?.severity || 'CRITICAL',
                      format: sarReportFormat,
                      customIndicators: itmSelectedTriggers,
                      notes: activeAlertTarget?.description || 'Detected high pricing skew deviation on batter nickel export.'
                    };

                    fetch('/api/tbml/sar-generate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                    })
                    .then(response => {
                      if (!response.ok) throw new Error('API server returned error');
                      return response.json();
                    })
                    .then(data => {
                      setSarDraftText(data.draft || 'Gagal meramu draf laporan.');
                      setIsGeneratingSar(false);
                      setTerminalFeed(prev => [
                        `[AI SAR ENGINE] Synthesized detailed Suspicious Activity Report (LTKM) for alert ${payload.refId} via Gemini AI.`,
                        ...prev
                      ]);
                    })
                    .catch(err => {
                      console.error('[AI SAR ENGINE] fail:', err);
                      setIsGeneratingSar(false);
                      setSarDraftText(`================================================================================
LAPORAN TRANSAKSI KEUANGAN MENCURIGAKAN (LTKM) - PPATK FORM ${sarReportFormat || 'LTKM-PPATK-01'}
================================================================================
KONFIDENSIALITAS: SANGAT RAHASIA / EXTREMELY CONFIDENTIAL (PPATK LAW NO. 8/2010 SECTOR 3)
--------------------------------------------------------------------------------

BAGIAN I: PROFIL LEMBAGA PELAPOR DAN METADATA SISTEM
1. Lembaga Pelapor: VentureAM Cybernetic Compliance Module
2. ID Sistem      : VAM-RADAR-SAR-AIRGAP-RESILIENCE
3. Operator       : Automated Guardian Daemon

BAGIAN II: PROFIL TERLAPOR DAN ULTIMATE BENEFICIAL OWNER (UBO)
1. Terlapor Utama : PT Halmahera Industrial Nickel
2. Penerima Manfaat: Pacific Horizon Venture Ltd (BVI)
3. Struktur Korporasi: Jaringan Shell Proxy under Offshore Trust

BAGIAN III: INDIKATOR PENIPUAN DAGANG DAN PENJELASAN ALIRAN DANA (TBML FORENSICS)
Sistem mengalami kendala timeout atau kunci API tidak terpasang, namun analisis heuristik lokal tetap mengonversi hasil scan sebagai berikut:
1. Deviasi Harga Dagang: Transaksi atas indikator ${itmSelectedTriggers.join(', ') || 'Trade-Based Money Laundering'} terdeteksi menyimpang sebesar +44% dari Baseline Nilai Pasar Adil.
2. Pola Penempatan (Placement): Dana dialirkan keluar yurisdiksi Republik Indonesia menuju British Virgin Islands (BVI).

BAGIAN IV: REKOMENDASI AUDIT DAN TINDAKAN INTEGRITAS GATEWAY
1. Rekomendasi: Membekukan sementara sisa penyelesaian kliring yang tidak tercatat.
2. Pelaporan: Teruskan dokumen draf ini ke portal FIU-PPATK setelah dipadatkan.

--------------------------------------------------------------------------------
INTEGRITAS FORENSIK DIGITAL:
Kode Hash digital SHA-256: sha256-d8f303ea00ebd8391745499cf8e10398f5a28392fb2c0d87
Status Pengiriman        : CONVERTED LIVE RESILIENCE STYLING ACTIVE
--------------------------------------------------------------------------------`);
                    });
                  }}
                  className="w-full py-3 bg-[#DFFF00] hover:bg-[#deff9a] text-black font-black text-xs tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 transition-all font-sans cursor-pointer mt-2"
                >
                  {isGeneratingSar ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                      MENYUSUN DRAFT LAPORAN AI...
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-4 h-4 text-black animate-pulse" />
                      SUSUN DRAFT LAPORAN AI (LTKM)
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: SAR Report Sheet Presenter */}
              <div className="lg:col-span-12 xl:col-span-7 flex flex-col gap-4">
                {/* Official Compliance Report Preview Card */}
                <div className="bg-[#0b0c10] border border-red-500/15 p-6 rounded-[2.5rem] flex-1 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-400/5 blur-3xl rounded-full" />
                  
                  <div>
                    {/* Header of Report Document */}
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="w-5 h-5 text-red-500" />
                        <div>
                          <span className="text-[7px] text-zinc-500 uppercase block font-mono font-black tracking-widest leading-none">PPATK-01 OFFICIAL PRO-FORMA</span>
                          <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">LTKM INTEL REPORT DRAFT</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 text-red-400 border border-red-500/10 bg-red-500/[0.02]/30 rounded-lg text-[8px] font-mono font-medium tracking-wide">
                        STATUS: UNRELEASED DRAFT
                      </span>
                    </div>

                    {/* Report Text Frame */}
                    <div className="bg-black/95 border border-zinc-900/60 p-4 rounded-xl leading-relaxed max-h-[460px] overflow-y-auto font-mono text-[9px] text-[#DFFF00] relative custom-scrollbar select-text">
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none select-all rotate-12">
                        <span className="text-4xl font-extrabold text-white uppercase">DRAFT PPATK COMPLIANT</span>
                      </div>

                      {sarDraftText ? (
                        <pre className="whitespace-pre-wrap leading-relaxed">{sarDraftText}</pre>
                      ) : (
                        <div className="py-24 text-center text-zinc-650 font-sans italic">
                          Pilih indikator anomali penipuan dagang (TBML) di sisi kiri, klik tombol penyusun draf AI untuk menghasilkan dokumen laporan patuh PPATK resmi secara otomatis.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Frame at the bottom of the document */}
                  {sarDraftText && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-zinc-900">
                      <button
                        type="button"
                        onClick={() => {
                          const note = sarDraftText;
                          navigator.clipboard.writeText(note);
                          alert("Draft Laporan LTKM berhasil disalin ke clipboard!");
                          setTerminalFeed(prev => [
                            `[SAR EXPORT] Laporan LTKM draft text copied to clipboard.`,
                            ...prev
                          ]);
                        }}
                        className="py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-[9px] font-black uppercase tracking-wider text-zinc-350 border border-zinc-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-emerald-400" />
                        Salin Isi Draf Laporan
                      </button>
                      
                      {sarReportSubmitted ? (
                        <div className="flex flex-col gap-2 col-span-1 sm:col-span-2">
                          <button
                            type="button"
                            disabled
                            className="py-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-[9.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-not-allowed w-full"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            SUCCESS TRANSMITTED TO CENTRAL FIU
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSubTab('VIU_TRANSMITTED');
                            }}
                            className="py-3 bg-gradient-to-r from-emerald-500 to-[#DFFF00] hover:from-[#DFFF00] hover:to-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(16,185,129,0.3)] animate-pulse"
                          >
                            <ArrowRight className="w-3.5 h-3.5 text-black" />
                            BUKA TIKET DI VIU TRANSMITTED SYSTEM &rarr;
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSarReportSubmitted(true);
                            const ticketId = `PPATK-LTKM-2026-${Date.now().toString().slice(-4)}`;
                            setTerminalFeed(prev => [
                              `[TRANSMISSION] Mengirimkan data XML sandboxed port 8090...`,
                              `[PPATK GATEWAY] Terkoneksi ke portal pelaporan terintegrasi...`,
                              `[PPATK GATEWAY] Transmisi berhasil! Laporan LTKM dicatat dengan ID Tiket: ${ticketId}`
                            ]);
                            
                            // Insert the actual compiled draft to our VIU transmitted records list too!
                            const newRecord = {
                              ticketId: ticketId,
                              timestamp: new Date().toISOString(),
                              alertId: selectedSarAlertId || "AL-GEN-99",
                              ubo: selectedSarAlertId ? (alerts.find(a => a.id === selectedSarAlertId)?.referenceId || "Pacific Horizon Venture Ltd (BVI)") : "Pacific Horizon Venture Ltd (BVI)",
                              entityName: selectedSarAlertId ? (alerts.find(a => a.id === selectedSarAlertId)?.type || "PT Halmahera Industrial Nickel") : "PT Halmahera Industrial Nickel",
                              severity: "CRITICAL",
                              route: "ID -> BVI -> SINGAPORE -> MONGOLIA",
                              xmlHash: `sha256-d8f303ea00ebd8391745499cf8e10398f5a28392fb2c0d87`,
                              text: sarDraftText || `VAM SYSTEMIC SAR DISPATCH REPORT\n===============================\nTICKET NO: ${ticketId}\nDATE: ${new Date().toLocaleString()}\nTARGET CORP: PT Halmahera Industrial Nickel\nUBO: Pacific Horizon Venture Ltd (BVI)\nROUTE: Offshore Shell Tunnel`
                            };
                            setViuTransmittedRecords(prev => [newRecord, ...prev]);
                            setSelectedViuRecordTicketId(ticketId);
                            alert(`Draft Laporan berhasil ditransmisikan secara langsung menuju Sandbox Portal PPATK via VPN Tunnel Hub! Dokumen dicatat dengan nomor tiket: ${ticketId}`);
                          }}
                          className="py-3 bg-red-400/10 hover:bg-red-400/20 text-red-400 border border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          Kirim Ke Portal PPATK (Sandbox)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 8: INDIKATOR TRANSAKSI MENCURIGAKAN (ITM) */}
        {activeSubTab === 'ITM_INDICATORS' && (
          <motion.div
            key="tbml-itm-indicators"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
            id="tbml-itm-indicators-view"
          >
            {/* Header Box */}
            <div className="p-6 bg-[#020407] border border-zinc-900 rounded-[2rem] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <span className="text-[8px] font-black text-[#DFFF00] uppercase tracking-[0.2em] block mb-1">Mekanisme Pemicu Otomatis Compliance Engine</span>
                <h2 className="text-xl font-black text-white uppercase tracking-wider">MATRIKS INDIKATOR TRANSAKSI MENCURIGAKAN (ITM)</h2>
                <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
                  Sistem pemeringkat risiko & trigger kepatuhan transaksi. Diprogram berdasarkan standar pencegahan korupsi, anti-pencucian uang (AML), mitigasi Conflict of Interest (LHKPN), serta audit Trade-Based Money Laundering (TBML) merujuk pada standar tata kelola FATF dan PPATK Republik Indonesia.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <span className="px-3 py-1.5 bg-zinc-950 rounded-xl border border-zinc-900 text-[10px] font-mono font-bold text-emerald-400">
                  FATF COMPLIANT
                </span>
                <span className="px-3 py-1.5 bg-zinc-950 text-[#DFFF00] rounded-xl border border-zinc-900 text-[10px] font-mono font-bold">
                  ACTIVE SCORER
                </span>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-zinc-950/70 border border-zinc-900 rounded-2xl flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest font-black">Total Aturan ITM</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="mt-2 text-2xl font-black text-white font-mono">14 Trigger</div>
                <p className="text-[8px] text-zinc-500 font-mono mt-1">Dikelompokkan dalam 4 Kategori</p>
              </div>

              <div className="p-4 bg-zinc-950/70 border border-zinc-900 rounded-2xl flex flex-col justify-between">
                <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest font-black">Ambang Batas Kritis</span>
                <div className="mt-2 flex items-baseline gap-1 font-mono">
                  <span className="text-2xl font-black text-red-400">{itmCustomThreshold}</span>
                  <span className="text-xs text-zinc-500">/100</span>
                </div>
                <p className="text-[8px] text-zinc-500 font-mono mt-1">Skor untuk blokir transaksi otomatis</p>
              </div>

              <div className="p-4 bg-zinc-950/70 border border-zinc-900 rounded-2xl flex flex-col justify-between">
                <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest font-black">Akurasi Validasi Model</span>
                <div className="mt-2 text-2xl font-black text-[#DFFF00] font-mono">99.12%</div>
                <p className="text-[8px] text-zinc-500 font-mono mt-1">Merujuk pada filter audit historis</p>
              </div>

              <div className="p-4 bg-zinc-950/70 border border-zinc-900 rounded-2xl flex flex-col justify-between">
                <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest font-black">Mode Deteksi Saat Ini</span>
                <div className="mt-2 text-xs font-black text-white font-mono bg-[#DFFF00]/10 border border-[#DFFF00]/20 rounded-lg p-1.5 inline-block text-center uppercase tracking-wider">
                  Sistem + Verifikasi Manual
                </div>
                <p className="text-[8px] text-zinc-500 font-mono mt-1">Sinergi Otomasi vs Profesional</p>
              </div>
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: List of 14 Indicators in 4 Categories */}
              <div className="lg:col-span-5 bg-[#020407] border border-zinc-900 rounded-[2.5rem] p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#DFFF00]" />
                    <span className="text-xs font-black text-white uppercase tracking-wider font-mono">DAFTAR PICU INDIKATOR</span>
                  </div>
                  <span className="text-[8.5px] font-mono text-zinc-500">PILIH UNTUK SIMULASI</span>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                    <input 
                      type="text"
                      placeholder="Cari indikator kecurigaan..."
                      value={itmFilterSearch}
                      onChange={(e) => setItmFilterSearch(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 pl-9 pr-4 py-2 rounded-xl text-xs font-mono text-white placeholder-zinc-550 focus:outline-none focus:border-[#DFFF00] transition-all"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1 bg-black p-1 rounded-xl border border-zinc-900 text-[8.5px] font-mono">
                    {[
                      { key: 'ALL', label: 'SEMUA' },
                      { key: 'KATEGORI_1', label: 'TENDER' },
                      { key: 'KATEGORI_2', label: 'APU-PPT' },
                      { key: 'KATEGORI_3', label: 'PEP-LINK' },
                      { key: 'KATEGORI_4', label: 'TBML' }
                    ].map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setItmSelectedCategory(tab.key as any)}
                        className={`flex-1 py-1 text-center font-bold uppercase rounded-lg transition-all ${
                          itmSelectedCategory === tab.key 
                            ? 'bg-zinc-900 text-white border border-zinc-800' 
                            : 'text-zinc-500 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rules List (14 triggers segmented or filtered) */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 select-none custom-scrollbar">
                  {[
                    {
                      id: 'KATEGORI_1',
                      title: 'Kategori 1: Indikator Tender & Pengadaan (Anti-Korupsi)',
                      indicators: [
                        { name: 'The Single Runner', detail: 'Tender yang hanya diikuti oleh 1 (satu) peserta saja dan langsung dinyatakan menang.', defaultWeight: 35 },
                        { name: 'Newborn Winner', detail: 'Pemenang tender adalah perusahaan yang didirikan kurang dari 6 bulan sebelum tanggal pengumuman tender.', defaultWeight: 40 },
                        { name: 'Address-in-Common', detail: 'Alamat domisili perusahaan pemenang tender sama dengan alamat domisili PPK atau anggota panitia tender.', defaultWeight: 35 },
                        { name: 'Patterned Bidder', detail: 'Perusahaan selalu menang tender di instansi tertentu, namun selalu kalah/tidak ikut di instansi lain meskipun jenis pekerjaannya sama.', defaultWeight: 25 },
                        { name: 'Fast-Track Award', detail: 'Jarak antara tanggal pendirian perusahaan di akta AHU dengan penandatanganan kontrak kurang dari 30 hari kerja.', defaultWeight: 30 }
                      ]
                    },
                    {
                      id: 'KATEGORI_2',
                      title: 'Kategori 2: Indikator Perilaku Korporasi (Anti-Pencucian Uang)',
                      indicators: [
                        { name: 'The Dormant-to-Active Spike', detail: 'Perusahaan tidak aktif bertahun-tahun tiba-tiba melakukan transaksi bernilai miliaran rupiah dalam waktu 1-2 hari.', defaultWeight: 45 },
                        { name: 'Capital-Revenue Imbalance', detail: 'Perusahaan dengan modal disetor sangat minim (misal: Rp 50 juta) melakukan transaksi atau memotong kontrak senilai di atas Rp 10 Miliar.', defaultWeight: 30 },
                        { name: 'Circular Trading', detail: 'Dana mengalir keluar dari korporasi ke rekening pribadi, lalu kembali lagi ke korporasi dalam bentuk setoran modal atau pinjaman.', defaultWeight: 35 },
                        { name: 'Layering Pattern', detail: 'Dana masuk ke perusahaan, lalu dalam hitungan jam dipecah ke 10+ rekening pribadi (smurfing untuk menghindari threshold pelaporan).', defaultWeight: 40 }
                      ]
                    },
                    {
                      id: 'KATEGORI_3',
                      title: 'Kategori 3: Indikator Hubungan Pribadi (Conflict of Interest)',
                      indicators: [
                        { name: 'The PEP-Family Nexus', detail: 'Terdapat relasi keluarga (istri/anak/saudara kandung) antara pemilik efektif (BO) dengan pejabat publik berwenang anggaran.', defaultWeight: 50 },
                        { name: 'The Revolving Door', detail: 'Mantan pejabat publik yang baru pensiun/mundur kurang dari 1 tahun langsung menduduki posisi pimpinan di perusahaan pemenang tender di instansi asalnya.', defaultWeight: 40 },
                        { name: 'Asset Mismatch', detail: 'Individu dengan jabatan publik (PEP) memiliki profil kekayaan tidak sesuai dengan penghasilan resmi dalam sistem, namun terhubung ke banyak aset via perusahaan cangkang.', defaultWeight: 45 }
                      ]
                    },
                    {
                      id: 'KATEGORI_4',
                      title: 'Kategori 4: Indikator Komoditas (Trade-Based Money Laundering)',
                      indicators: [
                        { name: 'Price Out-of-Range', detail: 'Harga komoditas (misal: batubara/nikel) dalam invoice melenceng jauh (>20%) dari rata-rata harga spot pasar global.', defaultWeight: 30 },
                        { name: 'High-Volume Small-Market', detail: 'Transaksi komoditas fisik yang volumenya tidak masuk akal dengan kapasitas produksi riil atau gudang yang dimiliki.', defaultWeight: 25 }
                      ]
                    }
                  ]
                    .filter(cat => itmSelectedCategory === 'ALL' || cat.id === itmSelectedCategory)
                    .map((catGroup) => {
                      // Filter indicators inside category based on search
                      const filteredIndicators = catGroup.indicators.filter(ind => 
                        ind.name.toLowerCase().includes(itmFilterSearch.toLowerCase()) || 
                        ind.detail.toLowerCase().includes(itmFilterSearch.toLowerCase())
                      );

                      if (filteredIndicators.length === 0) return null;

                      return (
                        <div key={catGroup.id} className="space-y-2 border-b border-zinc-900/40 pb-3 last:border-0 last:pb-0">
                          <span className="text-[8px] font-mono font-black text-zinc-550 uppercase tracking-widest block">
                            {catGroup.title}
                          </span>
                          <div className="space-y-1.5">
                            {filteredIndicators.map((ind) => {
                              const isChecked = itmSelectedTriggers.includes(ind.name);
                              const currentWeight = itmRuleWeights[ind.name] || ind.defaultWeight;
                              return (
                                <div 
                                  key={ind.name}
                                  onClick={() => {
                                    if (isChecked) {
                                      setItmSelectedTriggers(prev => prev.filter(t => t !== ind.name));
                                    } else {
                                      setItmSelectedTriggers(prev => [...prev, ind.name]);
                                    }
                                  }}
                                  className={`p-3 rounded-xl border transition-all cursor-pointer text-left flex items-start gap-2.5 ${
                                    isChecked 
                                      ? 'bg-zinc-950 border-[#DFFF00]/30 text-white shadow-sm' 
                                      : 'bg-black/60 border-zinc-900/60 text-zinc-400 hover:border-zinc-800'
                                  }`}
                                >
                                  <input 
                                    type="checkbox"
                                    checked={isChecked}
                                    readOnly
                                    className="rounded mt-0.5 text-[#DFFF00] focus:ring-0 bg-transparent border-zinc-700"
                                  />
                                  <div className="flex-1">
                                    <div className="flex justify-between items-baseline gap-2">
                                      <span className={`text-[10px] font-bold uppercase font-sans ${isChecked ? 'text-[#DFFF00]' : 'text-zinc-200'}`}>
                                        "{ind.name}"
                                      </span>
                                      <span className="text-[8.5px] font-mono font-black shrink-0 px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded">
                                        W: {currentWeight}
                                      </span>
                                    </div>
                                    <p className="text-[9px] text-zinc-400 italic mt-1 leading-normal">
                                      {ind.detail}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Reset button */}
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setItmSelectedTriggers(['Newborn Winner', 'The PEP-Family Nexus', 'Capital-Revenue Imbalance'])}
                    className="flex-1 py-2 text-center bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-[9.5px] font-mono text-zinc-350 cursor-pointer transition-all"
                  >
                    Atur Semula Presets
                  </button>
                  <button
                    type="button"
                    onClick={() => setItmSelectedTriggers([])}
                    className="flex-1 py-2 text-center bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 rounded-xl text-[9.5px] font-mono text-zinc-550 cursor-pointer transition-all"
                  >
                    Reset Pilihan
                  </button>
                </div>
              </div>

              {/* Right Columns Grid: Scorer Tool, Priority Table, and Strategic Workflow */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                
                {/* 1. Real-time Scorer Simulator Box */}
                <div className="bg-[#020407] border border-zinc-900 rounded-[2.5rem] p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-400/[0.01] blur-2xl rounded-full" />
                  
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-3 mb-4">
                    <span className="text-[9px] font-mono font-extrabold text-[#DFFF00] uppercase tracking-wider block">REALTIME COMPLIANCE RISK EVALUATOR</span>
                    <span className="px-2 py-0.5 bg-zinc-950 text-zinc-500 font-mono text-[8px] rounded uppercase">
                      API VERSI 3.4.1
                    </span>
                  </div>

                  {/* Calculations & Output */}
                  {(() => {
                    // Compute combined rule score based on choices
                    let totalScore = 0;
                    itmSelectedTriggers.forEach(triggerName => {
                      totalScore += itmRuleWeights[triggerName] || 30;
                    });

                    // Evaluate outcome trigger
                    let outcomeStatus = "COMPLIANT_LOW_CONFLICT";
                    let outcomeColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                    let outcomeDetails = "Hasil evaluasi menunjukkan kepatuhan parameter wajar. Transaksi tidak memicu batasan kritis AML RI.";
                    let outcomeTag = "LOW RISK / COMPLIANT";

                    if (totalScore >= itmCustomThreshold) {
                      outcomeStatus = "CRITICAL_ACTION_REQUIRED";
                      outcomeColor = "text-red-500 bg-red-500/10 border-red-500/30 font-black animate-pulse";
                      outcomeDetails = "SKENARIO KRITIS: Sistem secara otomatis menjalankan Auto-Reject, membekukan dana kliring sementara, mencegah outflow, dan langsung memicu draft digital untuk diserahkan sebagai LTKM ke PPATK.";
                      outcomeTag = "CRITICAL LIMIT REACHED (AUTO-REJECT)";
                    } else if (totalScore >= 50) {
                      outcomeStatus = "INTERNAL_INVESTIGATION";
                      outcomeColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                      outcomeDetails = "SKENARIO SEDANG: Tim Compliance Officer wajib melakukan review silsilah terperinci (Fuzzy check) dan melakukan kunjungan lapangan pencegahan pembentukan Shell Company.";
                      outcomeTag = "INTERNAL AUDIT SUGGESTED";
                    }

                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                          
                          {/* Live Combined Score Circular / Box Gauge */}
                          <div className={`md:col-span-4 p-4 rounded-2xl border text-center font-mono ${
                            totalScore >= itmCustomThreshold 
                              ? 'bg-red-950/20 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.06)]' 
                              : totalScore >= 50 
                                ? 'bg-amber-950/20 border-amber-500/30 text-amber-500' 
                                : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                          }`}>
                            <span className="text-[7.5px] text-zinc-550 uppercase font-black block tracking-widest mb-1">TOTAL RISK SCORE</span>
                            <span className="text-4xl font-black block">{totalScore}/100</span>
                            <span className="text-[7.5px] uppercase font-bold block mt-1 tracking-wider text-zinc-300">
                              Ambang Batas: {itmCustomThreshold}
                            </span>
                          </div>

                          {/* Scorer Details */}
                          <div className="md:col-span-8 space-y-2">
                            <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase block">STATUS KEPUTUSAN KEPATUHAN:</span>
                            <div className="space-y-1.5 text-[10px] font-mono">
                              <div className={`p-3 rounded-xl border flex items-center gap-2 ${outcomeColor}`}>
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <div className="flex-1">
                                  <p className="text-[9.5px] font-black uppercase tracking-wider">{outcomeStatus}</p>
                                  <p className="text-zinc-350 text-[9px] font-normal leading-relaxed mt-1">
                                    {outcomeDetails}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* Adjust Threshold Slider & Weights Adjuster */}
                        <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-900 space-y-3">
                          <div className="flex justify-between items-center text-xs font-mono">
                            <span className="font-bold text-zinc-300">Konfigurasi Ambang Batas Auto-Reject (Threshold Score)</span>
                            <span className="px-2 py-0.5 bg-black border border-zinc-800 rounded font-black text-[#DFFF00]">{itmCustomThreshold} Poin</span>
                          </div>
                          
                          <input 
                            type="range"
                            min="30"
                            max="100"
                            step="5"
                            value={itmCustomThreshold}
                            onChange={(e) => setItmCustomThreshold(parseInt(e.target.value))}
                            className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#DFFF00]"
                          />
                          <div className="flex justify-between text-[8px] font-mono text-zinc-550 uppercase">
                            <span>Sensitivitas Tinggi (30)</span>
                            <span>Standard PPATK RI (75-80)</span>
                            <span>Konservatif (100)</span>
                          </div>
                        </div>

                        {/* Interactive Weighted rules adjust parameters when expand desired */}
                        <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-900 space-y-2">
                          <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400 uppercase">
                            <span>Bobot Aturan Aktif Terpilih ({itmSelectedTriggers.length})</span>
                            <span className="text-zinc-500 font-bold">Ubah bobot pemicu secara manual</span>
                          </div>
                          
                          {itmSelectedTriggers.length === 0 ? (
                            <p className="text-[9px] text-zinc-650 font-mono italic text-center py-2">
                              Silakan gunakan daftar pemicu penuang di sisi kiri untuk memilih indikator transaksi aktif.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                              {itmSelectedTriggers.map((trig) => {
                                const weightVal = itmRuleWeights[trig] || 30;
                                return (
                                  <div key={trig} className="p-2 bg-black rounded-xl border border-zinc-900 flex items-center justify-between text-[10px] font-mono">
                                    <span className="truncate max-w-[120px] text-zinc-300 font-bold block">{trig}</span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button 
                                        type="button" 
                                        onClick={() => setItmRuleWeights(prev => ({...prev, [trig]: Math.max(10, weightVal - 5)}))}
                                        className="w-4 h-4 bg-zinc-900 rounded hover:bg-zinc-800 text-zinc-400 flex items-center justify-center font-black"
                                      >-</button>
                                      <span className="w-5 text-center font-black text-white">{weightVal}</span>
                                      <button 
                                        type="button" 
                                        onClick={() => setItmRuleWeights(prev => ({...prev, [trig]: Math.min(60, weightVal + 5)}))}
                                        className="w-4 h-4 bg-zinc-900 rounded hover:bg-zinc-800 text-zinc-400 flex items-center justify-center font-black"
                                      >+</button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Live Python code for transparency & compliance auditability */}
                        <div className="bg-black/80 rounded-xl border border-zinc-900 p-3 font-mono text-[8px] leading-relaxed text-zinc-500 overflow-x-auto select-all">
                          <div className="text-zinc-600 border-b border-zinc-900/60 pb-1 mb-1 font-bold flex justify-between uppercase">
                            <span>Sistem Validasi Rule Engine</span>
                            <span className="text-[#DFFF00]">ACTIVE COMPLIANCE EXEC</span>
                          </div>
{`def evaluate_compliance_scoring(active_triggers, user_threshold=${itmCustomThreshold}):
    risk_score = sum([get_weight(trigger) for trigger in active_triggers])
    if risk_score >= user_threshold:
        return { "status": "CRITICAL_ACTION_REQUIRED", "preventive_hold": True }
    elif risk_score >= 50:
        return { "status": "INTERNAL_INVESTIGATION", "preventive_hold": False }
    return { "status": "COMPLIANT_LOW_CONFLICT", "preventive_hold": False }`}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 2. Matriks Prioritas Penanganan ITM (VAM Compliance Engine) */}
                <div className="bg-[#020407] border border-zinc-900 rounded-[2.5rem] p-6 space-y-3">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-black text-white uppercase tracking-wider font-mono">TABEL PRIORITAS PENANGANAN ITM</span>
                    </div>
                    <span className="px-2 py-0.5 bg-[#deff9a]/10 border border-[#deff9a]/20 text-[#deff9a] text-[8px] font-mono rounded font-bold uppercase">
                      Klasifikasi Workload
                    </span>
                  </div>

                  <p className="text-[10px] text-zinc-450 font-mono leading-relaxed">
                    Setiap indikator di bawah telah dipetakan berdasarkan tingkat kepastian matematis. Klik pada baris tabel untuk memicu pemicu transaksi tersebut di simulator compliance secara instan!
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[9.5px] font-mono leading-relaxed">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-500 uppercase font-bold">
                          <th className="pb-2 py-1">Kategori</th>
                          <th className="pb-2">Indikator (ITM)</th>
                          <th className="pb-2 font-bold text-zinc-300">Prioritas Penanganan</th>
                          <th className="pb-2">Justifikasi / Alasan Aturan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { cat: 'Data Statis', name: 'Newborn Winner', priority: 'Otomatis (Alert)', color: 'text-red-400 bg-red-400/10 border-red-500/20', reason: 'Pemeriksaan akta, domisili, dan kepesertaan AHU riil diproses seketika.' },
                          { cat: 'Data Statis', name: 'Address-in-Common', priority: 'Otomatis (Alert)', color: 'text-red-400 bg-red-400/10 border-red-500/20', reason: 'Melakukan deteksi instan persamaan alamat pendaftar tender dengan PPK.' },
                          { cat: 'Transaksi', name: 'The Single Runner', priority: 'Otomatis (Flagging)', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-500/20', reason: 'Pola jumlah bidders pengadaan didata secara numerik berulang tanpa bias subjektif.' },
                          { cat: 'Transaksi', name: 'Fast-Track Award', priority: 'Otomatis (Flagging)', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-500/20', reason: 'Audit numerik tanggal didirikannya korporasi vs tanggal teken tender.' },
                          { cat: 'Perilaku', name: 'Circular Trading', priority: 'Sistem + Audit', color: 'text-amber-400 bg-amber-400/10 border-amber-500/20', reason: 'Sistem melacak flow melingkar, namun butuh validasi tim audit untuk motif pencucian uang.' },
                          { cat: 'Perilaku', name: 'Layering Pattern', priority: 'Sistem + Audit', color: 'text-amber-400 bg-amber-400/10 border-amber-500/20', reason: 'Deteksi dispersi terpecah ke banyak akun (smurfing) butuh tinjauan log harian.' },
                          { cat: 'Koneksi', name: 'The PEP-Family Nexus', priority: 'Investigasi Manual', color: 'text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-500/20', reason: 'Butuh validasi silsilah komprehensif, sanksi pelanggaran nepotisme moral denda berat.' },
                          { cat: 'Koneksi', name: 'The Revolving Door', priority: 'Investigasi Manual', color: 'text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-500/20', reason: 'Tanggungan masa transisi pensiun membutuhkan tinjauan etika kerja korps berwenang.' },
                          { cat: 'Komoditas', name: 'Price Out-of-Range', priority: 'Sistem (Threshold)', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20', reason: 'Memanfaatkan deviasi kuantitatif harga pasar global secara mandiri dan objektif.' }
                        ].map((row, idx) => {
                          const isCurrentlySelected = itmSelectedTriggers.includes(row.name);
                          return (
                            <tr 
                              key={idx} 
                              onClick={() => {
                                if (isCurrentlySelected) {
                                  setItmSelectedTriggers(prev => prev.filter(t => t !== row.name));
                                } else {
                                  setItmSelectedTriggers(prev => [...prev, row.name]);
                                }
                              }}
                              className={`border-b border-zinc-900/60 cursor-pointer transition-all hover:bg-zinc-950/40 ${
                                isCurrentlySelected ? 'bg-[#DFFF00]/5 text-white font-bold' : 'text-zinc-400'
                              }`}
                            >
                              <td className="py-2.5 font-bold uppercase text-[9px] text-zinc-500">{row.cat}</td>
                              <td className="py-2.5">
                                <span className={isCurrentlySelected ? 'text-[#DFFF00] underline font-bold' : 'text-zinc-200'}>
                                  "{row.name}"
                                </span>
                              </td>
                              <td className="py-2.5 pr-2">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase tracking-wider ${row.color}`}>
                                  {row.priority}
                                </span>
                              </td>
                              <td className="py-2.5 text-[8.5px] italic leading-normal text-zinc-400">{row.reason}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Peta Alur Kerja (Workload Management) - Rule of Three */}
                <div className="bg-[#020407] border border-zinc-900 rounded-[2.5rem] p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-fuchsia-400" />
                      <span className="text-xs font-black text-white uppercase tracking-wider font-mono">PETA ALUR KERJA (RULE OF THREE)</span>
                    </div>
                    <span className="text-[8px] text-zinc-500 font-mono">FATF / PPATK ALIGNMENT</span>
                  </div>

                  {/* Operational description of both systems */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[#DFFF00] font-black text-[9.5px] uppercase">
                        <Cpu className="w-3.5 h-3.5" />
                        <span>1. Jalur Otomasi (Sistem)</span>
                      </div>
                      <p className="text-[9px] text-zinc-400 leading-normal">
                        Mengeksekusi kebijakan preventif perlindungan (Auto-Reject, Blacklisting, Hold Clearing, Lock Outflow) seketika jika bobot akumulasi skor risiko melampaui batas kritis sistem (&gt; {itmCustomThreshold}). Hal ini mencegah perpindahan aset sengketa di awal.
                      </p>
                    </div>

                    <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-1.5 text-fuchsia-400 font-black text-[9.5px] uppercase">
                        <Sliders className="w-3.5 h-3.5" />
                        <span>2. Jalur Verifikasi Manual (Manusia)</span>
                      </div>
                      <p className="text-[9px] text-zinc-400 leading-normal">
                        Fokus penuh pada peninjauan penipuan silsilah (Fuzzy match matching), sengketa kepatuhan nepotisme politik yang berbelit, mewawancarai saksi, serta investigasi substansi riil lokasi kantor pendirian pemenang tender.
                      </p>
                    </div>
                  </div>

                  {/* Strategic "Rule of Three" Interactive Steps */}
                  <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-900 space-y-4">
                    <span className="text-[8.5px] font-mono text-[#DFFF00] uppercase font-black tracking-widest block">RULE OF THREE WORKFLOW STRATEGY</span>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { level: 1 as const, title: 'Level 1: System', desc: 'Cleansing & Scoring' },
                        { level: 2 as const, title: 'Level 2: Officer', desc: 'Manual Compliance Check' },
                        { level: 3 as const, title: 'Level 3: PPATK FIU', desc: 'Report & Prosecution' }
                      ].map((step) => (
                        <button
                          key={step.level}
                          type="button"
                          onClick={() => setItmWorkflowLevel(step.level)}
                          className={`p-3 rounded-xl border text-left font-mono transition-all uppercase flex flex-col justify-between cursor-pointer ${
                            itmWorkflowLevel === step.level
                              ? 'bg-zinc-900 border-[#DFFF00] text-white'
                              : 'bg-black border-zinc-900 text-zinc-500 hover:border-zinc-800'
                          }`}
                        >
                          <span className={`text-[8.5px] font-black ${itmWorkflowLevel === step.level ? 'text-[#DFFF00]' : 'text-zinc-600'}`}>
                            Langkah {step.level}
                          </span>
                          <span className="text-[10px] font-extrabold mt-1 leading-tight">{step.title}</span>
                          <span className="text-[7.5px] text-zinc-455 font-medium mt-0.5">{step.desc}</span>
                        </button>
                      ))}
                    </div>

                    {/* Stepper details */}
                    <div className="p-3 bg-black rounded-xl border border-zinc-900 text-[10px] font-mono leading-relaxed text-zinc-350">
                      {itmWorkflowLevel === 1 && (
                        <div className="space-y-1">
                          <span className="text-emerald-400 font-bold uppercase block">[LEVEL 1: CLEANSING & SCORING MATRIKS]</span>
                          <p className="text-[9.5px]">
                            Engine internal mengumpulkan jutaan item tender (LPSE), silsilah (AHU & KSEI), serta pergerakan dana koresponden. Sistem melakukan standardisasi, mencocokkan indikator (ITM), dan meluncurkan alert bertingkat. Compliance Officer menerima notifikasi instan.
                          </p>
                        </div>
                      )}
                      {itmWorkflowLevel === 2 && (
                        <div className="space-y-1">
                          <span className="text-amber-400 font-bold uppercase block">[LEVEL 2: INTEGRITY VERIFICATION OFFICER]</span>
                          <p className="text-[9.5px]">
                            Dibutuhkan analisis profesional oleh Tim Kepatuhan. Merinci fuzzy matching atas duplikasi nama yang mirip, menilai niat/motif di balik Circular Trading, melakukan wawancara langsung, serta mengaudit perizinan korporasi yang mencurigakan.
                          </p>
                        </div>
                      )}
                      {itmWorkflowLevel === 3 && (
                        <div className="space-y-1">
                          <span className="text-red-400 font-bold uppercase block">[LEVEL 3: FORMAL REPORTING TRANSMISSION]</span>
                          <p className="text-[9.5px]">
                            Setelah kecurigaan divalidasi dan ditemukan bukti pendukung, sistem automasi mengumpulkan data log audit serta berkas silsilah, menyusun draf Laporan Transaksi Keuangan Mencurigakan (LTKM-01), lalu mentransmisikan data langsung ke PPATK Indonesia.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 9: REAL-TIME DNS & REGISTRY INTELLIGENCE FORENSICS (FATF COMPLIANCE GOALS) */}
        {activeSubTab === 'DNS_INTEL' && (
          <motion.div
            key="tbml-dns-intel-forensics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
            id="tbml-dns-intel-view"
          >
            {/* FATF Context Banner */}
            <div className="bg-gradient-to-r from-zinc-950 to-zinc-900 border border-[#DFFF00]/25 rounded-[2rem] p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#DFFF00]/5 blur-3xl rounded-full -mr-20 -mt-20" />
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1.5 max-w-3xl">
                  <span className="px-2.5 py-0.5 bg-[#DFFF00]/10 border border-[#DFFF00]/20 text-[8px] font-black font-mono text-[#DFFF00] uppercase tracking-[0.2em] rounded-full inline-block">
                    FATF Recommendation 24 & 25 (Beneficial Ownership & Shell Forensics)
                  </span>
                  <h3 className="text-lg font-black text-white tracking-wide uppercase">
                    STRATEGI PERCEPATAN KEANGGOTAAN PENUH INDONESIA PADA FATF
                  </h3>
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
                    Untuk memenuhi kriteria keanggotaan penuh <strong className="text-white">Financial Action Task Force (FATF)</strong>, Pemerintah Indonesia harus mendemonstrasikan transparansi ekosistem korporasi yang tangguh terhadap pencucian uang berbasis perdagangan (<strong className="text-[#DFFF00]">Trade-Based Money Laundering - TBML</strong>). Modul forensik DNS ini melacak identitas digital, keabsahan server, dan kelemahan email korporasi untuk membedakan antara vendor riil dengan perusahaan cangkang buatan (<strong className="text-white">Shell Corporate Vehicles</strong>) di bursa saham maupun tender nasional.
                  </p>
                </div>
                <div className="flex flex-col items-end text-right font-mono self-stretch justify-between bg-black/40 border border-zinc-800 p-4 rounded-2xl min-w-[180px]">
                  <div>
                    <span className="text-[8px] text-zinc-500 uppercase block">FATF STATUS TARGET</span>
                    <span className="text-sm font-black text-[#DFFF00]">KEANGGOTAAN PENUH</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-[8px] text-zinc-500 uppercase block">AUDIT TRANSPARANSI</span>
                    <span className="text-[10px] font-bold text-white uppercase">[ 100% TERINTEGRASI ]</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Forensics Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Resolver Input and Log Feed */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Domain Input Card */}
                <div className="p-6 bg-zinc-950/40 border border-zinc-800/60 rounded-[2.5rem] space-y-4">
                  <div className="flex gap-2 items-center">
                    <div className="p-2 bg-[#DFFF00]/10 rounded-xl border border-[#DFFF00]/20 text-[#DFFF00]">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-extrabold text-white uppercase tracking-wider font-mono">DNS Scraping & Intel Gateway</h4>
                      <p className="text-[8px] text-zinc-500 font-mono uppercase">Automated Digital Footprint Profiler</p>
                    </div>
                  </div>

                  {/* Input area */}
                  <div className="space-y-2">
                    <label className="text-[8px] font-mono text-zinc-500 uppercase font-black block">URL Domain Target Analisis</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={dnsInputDomain}
                        onChange={(e) => setDnsInputDomain(e.target.value)}
                        placeholder="Contoh: bvi-shell-partners.co.vg"
                        className="flex-1 bg-black text-white placeholder-zinc-700 text-xs font-mono px-4 py-3 rounded-xl border border-zinc-900 focus:border-[#DFFF00] focus:outline-none transition-all placeholder:font-mono"
                      />
                      <button
                        onClick={handleDnsScrape}
                        disabled={isDnsScraping || !dnsInputDomain.trim()}
                        className="px-4 py-3 bg-[#DFFF00] hover:bg-white text-black font-mono font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed"
                      >
                        {isDnsScraping ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Search className="w-3.5 h-3.5" />
                        )}
                        <span>{isDnsScraping ? 'PEMINDAIAN...' : 'SCRAPE'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Presets Grid */}
                  <div className="space-y-1.5">
                    <span className="text-[7.5px] font-mono text-zinc-650 uppercase font-black tracking-widest block">Quick Intelligence Presets</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: 'BVI Shell Partner (vg)', domain: 'bvi-shell-partners.co.vg' },
                        { label: 'S-Ore Mining (net)', domain: 'sumatera-ore-mining.net' },
                        { label: 'Kemenkeu LPSE (go.id)', domain: 'lpse.kemenkeu.go.id' },
                        { label: 'Bursa Nominee Proxy', domain: 'bursa-indonesia-sid.org' }
                      ].map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setDnsInputDomain(p.domain);
                          }}
                          className={`p-2 text-left rounded-xl border text-[9px] font-mono transition-all truncate hover:border-[#DFFF00]/40 ${
                            dnsInputDomain === p.domain
                              ? 'bg-zinc-900/60 border-[#DFFF00]/30 text-[#DFFF00]'
                              : 'bg-black border-zinc-900 text-zinc-400'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Real-time Log Stream Feed */}
                <div className="p-6 bg-black border border-zinc-900 rounded-[2.5rem] space-y-3">
                  <div className="flex justify-between items-center text-zinc-500 text-[8px] font-mono uppercase tracking-widest border-b border-zinc-900 pb-2">
                    <span className="flex items-center gap-1"><Terminal className="w-3.5 h-3.5 text-[#DFFF00]" /> Terminal Log Aliran Scraping</span>
                    <span className="text-[7.5px] px-1.5 py-0.5 bg-zinc-950 border border-zinc-850 rounded">Live Feed</span>
                  </div>

                  <div className="h-44 overflow-y-auto bg-zinc-950 border border-zinc-950 p-4 rounded-xl space-y-1.5 font-mono text-[9px] leading-relaxed select-all">
                    {dnsLogFeed.map((log, i) => {
                      let color = "text-zinc-400";
                      if (log.startsWith("[SUCCESS]")) color = "text-emerald-400 font-bold";
                      else if (log.startsWith("[ERROR]")) color = "text-red-400 font-bold";
                      else if (log.startsWith("[SYSTEM]")) color = "text-blue-400";
                      else if (log.includes("FATF")) color = "text-[#DFFF00]";
                      return (
                        <div key={i} className={color}>
                          {log}
                        </div>
                      );
                    })}

                    {dnsLogFeed.length === 0 && (
                      <p className="text-zinc-650 py-10 text-center uppercase tracking-widest select-none">
                        Silakan tekan tombol 'SCRAPE' untuk melihat alur forensik jaringan internet korporasi...
                      </p>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: In-depth Scraped Result Detail view */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Result Block */}
                <AnimatePresence mode="wait">
                  {dnsScrapedResult ? (
                    <motion.div
                      key="dns-scraped-result-display"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      {/* Top Summary Card (Score, Risk level) */}
                      <div className="p-6 bg-zinc-950/40 border border-zinc-800/60 rounded-[2.5rem] grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        <div className="md:col-span-5 text-center flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-zinc-900/80 pb-6 md:pb-0 md:pr-6">
                          <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">FATF AML SHELL RISK</span>
                          <div className={`p-5 rounded-full border mb-3 flex flex-col justify-center items-center h-20 w-20 relative ${
                            dnsScrapedResult.fatf_aml_risk_score >= 75 
                              ? 'bg-red-950/20 border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]' 
                              : dnsScrapedResult.fatf_aml_risk_score >= 40 
                              ? 'bg-amber-950/20 border-amber-500/30 text-amber-400' 
                              : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                          }`}>
                            <span className="text-2xl font-mono font-black">{dnsScrapedResult.fatf_aml_risk_score}</span>
                            <span className="text-[6.5px] font-mono block -mt-1">SKOR / 100</span>
                          </div>
                          <span className={`text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded ${
                            dnsScrapedResult.fatf_aml_risk_score >= 75 
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                              : dnsScrapedResult.fatf_aml_risk_score >= 40 
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {dnsScrapedResult.fatf_aml_risk_rating}
                          </span>
                        </div>

                        <div className="md:col-span-7 space-y-3">
                          <div className="space-y-1">
                            <span className="text-[8px] font-mono text-zinc-500 uppercase">IDENTITAS ASAL NEGARA / PENDAFTARAN</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-white uppercase">{dnsScrapedResult.domain}</span>
                              <span className="text-[9px] text-zinc-500 font-mono">({dnsScrapedResult.country_of_origin})</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2 text-[10px] font-mono">
                            <div className="space-y-1">
                              <span className="text-[8px] text-zinc-600 block uppercase">PENGELOLA SERVER (HOST)</span>
                              <span className="text-white font-bold leading-normal block text-[9.5px] uppercase">{dnsScrapedResult.hosting_provider}</span>
                              <span className="text-zinc-500 font-medium block text-[8px]">{dnsScrapedResult.autonomous_system}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[8px] text-zinc-600 block uppercase">UMUR / USIA DOMAIN</span>
                              <span className="text-[#DFFF00] font-bold block text-[9.5px]">{dnsScrapedResult.domain_age}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Diagnostic DNS Record details table */}
                      <div className="p-6 bg-zinc-950/40 border border-zinc-800/60 rounded-[2.5rem] space-y-4">
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                          <span className="text-[9px] font-mono font-black text-white uppercase tracking-wider">Hasil Scraping Record DNS Publik</span>
                          <span className="text-[8px] text-[#DFFF00] bg-[#DFFF00]/10 border border-[#DFFF00]/20 px-2 py-0.5 rounded-lg font-mono">Real-time Resolved</span>
                        </div>

                        <div className="space-y-2.5 text-[9px] font-mono">
                          
                          {/* A Records */}
                          <div className="flex items-start justify-between border-b border-zinc-900/60 pb-1.5">
                            <div className="w-24 font-bold text-zinc-500 uppercase">A Record (IPv4)</div>
                            <div className="flex-1 text-right text-gray-200 truncate select-all">
                              {dnsScrapedResult.dns_records.A.join(', ')}
                            </div>
                          </div>

                          {/* MX Records */}
                          <div className="flex items-start justify-between border-b border-zinc-900/60 pb-1.5">
                            <div className="w-24 font-bold text-zinc-500 uppercase">MX (Mail Servers)</div>
                            <div className="flex-1 text-right text-purple-400 select-all truncate">
                              {dnsScrapedResult.dns_records.MX.join(', ')}
                            </div>
                          </div>

                          {/* NS Nameservers */}
                          <div className="flex items-start justify-between border-b border-zinc-900/60 pb-1.5">
                            <div className="w-24 font-bold text-zinc-500 uppercase">Nameservers (NS)</div>
                            <div className="flex-1 text-right text-zinc-400 select-all truncate">
                              {dnsScrapedResult.dns_records.NS.join(' | ')}
                            </div>
                          </div>

                          {/* TXT records */}
                          <div className="flex items-start justify-between">
                            <div className="w-24 font-bold text-zinc-500 uppercase">TXT (Validasi ID)</div>
                            <div className="flex-1 text-right text-zinc-500 select-all truncate max-w-[280px]" title={dnsScrapedResult.dns_records.TXT.join(', ')}>
                              {dnsScrapedResult.dns_records.TXT.length > 0 ? dnsScrapedResult.dns_records.TXT.join(', ') : 'No verification string'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Triggered Risk Checklist */}
                      <div className="p-6 bg-black border border-zinc-900 rounded-[2.5rem] space-y-3">
                        <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                          <AlertTriangle className={`w-4 h-4 ${dnsScrapedResult.fatf_aml_risk_score >= 75 ? 'text-red-400' : 'text-zinc-500'}`} />
                          <span className="text-[9px] font-mono font-black text-white uppercase tracking-wider">REKOMENDASI DEPARTEMEN FATF R24 / DETEKSI INTEGRITAS</span>
                        </div>

                        <div className="space-y-2">
                          {dnsScrapedResult.risk_indicators_triggered.map((ind: string, idx: number) => (
                            <div key={idx} className="flex gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-900 text-[9.5px] font-mono leading-relaxed select-all">
                              <span className="text-red-500 leading-none">●</span>
                              <p className="text-zinc-300">
                                <strong className="text-red-400">{ind.split(': ')[0]}:</strong>{' '}
                                {ind.split(': ')[1] || ind}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="p-3 bg-[#DFFF00]/5 border border-[#DFFF00]/15 rounded-xl mt-2">
                          <p className="text-[9px] text-[#DFFF00]/90 leading-relaxed font-sans font-medium">
                            💡 <strong className="uppercase font-mono">Fatf Insight Note:</strong> {dnsScrapedResult.fatf_compliance_note}
                          </p>
                        </div>
                      </div>

                      {/* ADVANCED MULTI-CHANNEL FOLLOW-UP ACTIONS */}
                      <div className="p-6 bg-gradient-to-br from-zinc-950 via-zinc-900/40 to-black border border-zinc-800 rounded-[2.5rem] space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                              <ExternalLink className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-[10px] font-extrabold text-white uppercase tracking-wider font-mono">Tindakan Lanjut Investigasi (Action Hub)</h4>
                              <p className="text-[7.5px] text-zinc-500 font-mono uppercase">Decisive Regulatory Follow-Ups</p>
                            </div>
                          </div>
                          {blockedDomains.includes(dnsScrapedResult.domain) && (
                            <span className="px-2 py-0.5 bg-red-500/15 border border-red-500/30 text-[8px] text-red-400 rounded font-black font-mono uppercase animate-pulse">
                              🚫 BLOCKED BY KOMINFO
                            </span>
                          )}
                        </div>

                        <p className="text-[9.5px] text-zinc-400 font-sans leading-relaxed">
                          Sistem mendeteksi deviasi kepatuhan pada domain <strong className="text-white">{dnsScrapedResult.domain}</strong>. Pilih salah satu rute legal berikut untuk memproses tindakan lanjut regulasi secara formal:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* Action 1: Escalate to PPATK Report Generator */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSarAlertId('');
                              const docTime = new Date().toLocaleString('id-ID');
                              const templateText = `LAPORAN FORENSIK TEKNOLOGI INFORMASI DAN DOMAIN (LTKM)\n=======================================================\nNOMOR TRANSAKSI AUDIT: INTEL-DNS-${Date.now().toString().slice(-6)}\nWAKTU AUDIT SISTEM: ${docTime}\nDOMAIN TARGET INVESTIGASI: ${dnsScrapedResult.domain}\nNILAI INDEKS RISIKO AML FATF: ${dnsScrapedResult.fatf_aml_risk_score} / 100 (${dnsScrapedResult.fatf_aml_risk_rating})\n\nTEMUAN ELEKTRONIK & DIGITAL:\n1. Server Host: ${dnsScrapedResult.hosting_provider} (${dnsScrapedResult.autonomous_system})\n2. Negara Asal Registrasi: ${dnsScrapedResult.country_of_origin}\n3. Usia Domain/Whois: ${dnsScrapedResult.domain_age}\n4. IP Server Terselesaikan: ${dnsScrapedResult.ip_addresses.join(', ')}\n\nPEDOMAN SILSILAH HUKUM (FATF R24/25):\nIndikator digital di atas mengarah secara signifikan pada struktur penyamaran identitas milik beneficial owner (UBO) asing guna menghindari transparansi pajak dan penyaluran dana tender nasional secara ilegal.\n\nSTATUS TINDAKAN: DIAJUKAN KE PROTOKOL SATUAN INTELIJEN PPATK RI.`;
                              
                              setSarDraftText(templateText);
                              setSarReportSubmitted(false);
                              setActiveSubTab('SAR_INTEL');
                              
                              alert(`Sesi forensik berhasil diekspor! Data teknis '${dnsScrapedResult.domain}' dimasukkan ke draf Laporan LTKM pada tab 'Pembuat Laporan PPATK'.`);
                              
                              setTimeout(() => {
                                const el = document.getElementById('tab-tbml-sar-intel');
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }, 100);
                            }}
                            className="p-3 bg-zinc-950 hover:bg-black border border-zinc-800 hover:border-[#DFFF00]/40 transition-all rounded-xl text-left font-mono text-[9px] cursor-pointer group flex flex-col justify-between"
                          >
                            <div className="flex gap-1.5 items-center text-[#DFFF00]">
                              <FileText className="w-3.5 h-3.5" />
                              <span className="font-bold uppercase">ESKALASIKAN KE PPATK</span>
                            </div>
                            <span className="text-[7.5px] text-zinc-500 mt-2 font-sans leading-normal group-hover:text-zinc-300">
                              Kompilasikan bukti DNS ini ke draf resmi Laporan LTKM di Sentinel Core.
                            </span>
                          </button>

                          {/* Action 2: Trigger Domain block in Sandbox Kominfo */}
                          <button
                            type="button"
                            disabled={isKominfoBlocking || blockedDomains.includes(dnsScrapedResult.domain)}
                            onClick={() => {
                              setIsKominfoBlocking(true);
                              
                              setDnsLogFeed(prev => [
                                ...prev,
                                `[KOMINFO REGISTRY] Memulai pengajuan pemblokiran domain: ${dnsScrapedResult.domain}`,
                                `[KOMINFO REGISTRY] Mengirimkan paket XML tanda tangan digital ke V-Block Port 8443...`,
                                `[KOMINFO REGISTRY] Memverifikasi legalitas surat perintah audit PPATK... OK.`
                              ]);

                              setTimeout(() => {
                                setBlockedDomains(prev => [...prev, dnsScrapedResult.domain]);
                                setIsKominfoBlocking(false);
                                setDnsLogFeed(prev => [
                                  ...prev,
                                  `[SUCCESS] Domain '${dnsScrapedResult.domain}' ditambahkan ke TRUST+ Positif Registry Kominfo (Muted).`,
                                  `[SUCCESS] Distribusi DNS Sinkhole berhasil ke server DNS Nasional.`
                                ]);
                                alert(`Sukses Transmisi! Perintah pemblokiran darurat untuk domain '${dnsScrapedResult.domain}' telah diverifikasi secara instan oleh Sandbox Gateway Kementerian KOMINFO.`);
                              }, 1800);
                            }}
                            className={`p-3 border transition-all rounded-xl text-left font-mono text-[9px] flex flex-col justify-between ${
                              blockedDomains.includes(dnsScrapedResult.domain)
                                ? 'bg-zinc-950/20 border-red-500/20 text-red-500 cursor-not-allowed'
                                : isKominfoBlocking
                                ? 'bg-zinc-950 border-zinc-800 text-zinc-650 cursor-wait'
                                : 'bg-zinc-950 hover:bg-black border-zinc-800 hover:border-red-400/40 text-red-400 cursor-pointer group'
                            }`}
                          >
                            <div className="flex gap-1.5 items-center">
                              <Lock className="w-3.5 h-3.5" />
                              <span className="font-bold uppercase">
                                {blockedDomains.includes(dnsScrapedResult.domain) 
                                  ? 'TERBLOKIR (KOMINFO)' 
                                  : isKominfoBlocking 
                                  ? 'MEMPROSES BLOKIR...' 
                                  : 'AJUKAN BLOKIR INTERNET'}
                              </span>
                            </div>
                            <span className="text-[7.5px] mt-2 font-sans text-zinc-500 leading-normal group-hover:text-zinc-300">
                              Kirim perintah ke KOMINFO d/h DNS Nasional (Trust+) untuk isolasi trafik.
                            </span>
                          </button>

                          {/* Action 3: Cross link back to GNN visualizer */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSubTab('GNNSYSTEM');
                              alert(`Menavigasi ke GNN Graph. Visualisasi silsilah entitas penerima dana '${dnsScrapedResult.domain}' akan ditarik meloncati 4 node shell proxy.`);
                              setTimeout(() => {
                                const el = document.getElementById('tab-tbml-gnnsystem');
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }, 100);
                            }}
                            className="p-3 bg-zinc-950 hover:bg-black border border-zinc-800 hover:border-emerald-500/40 transition-all rounded-xl text-left font-mono text-[9px] cursor-pointer group flex flex-col justify-between"
                          >
                            <div className="flex gap-1.5 items-center text-emerald-400">
                              <Network className="w-3.5 h-3.5" />
                              <span className="font-bold uppercase">PELACAKAN RELASI GNN</span>
                            </div>
                            <span className="text-[7.5px] text-zinc-500 mt-2 font-sans leading-normal group-hover:text-zinc-300">
                              Tarik visualisasi silsilah pemegang saham di GNN Graph untuk cluster ini.
                            </span>
                          </button>

                          {/* Action 4: Download Audit Blockchain Seal */}
                          <button
                            type="button"
                            onClick={() => {
                              const reportHash = dnsScrapedResult.xmlHash || `sha256-d8f303ea00ebd8391745499cf8e10398f5a28392fb2c0d87`;
                              alert(`LOG BUKTI DIGITAL DI-CUP SECARA KRIPTOGRAFI:\n==========================================\n\nDomain: ${dnsScrapedResult.domain}\nScore: ${dnsScrapedResult.fatf_aml_risk_score}\nIp Server: ${dnsScrapedResult.ip_addresses[0]}\nChecksum Audit: ${reportHash}\n\nDokumen JSON bergaransi hukum diunduh ke Sandbox Local Storage.`);
                            }}
                            className="p-3 bg-zinc-950 hover:bg-black border border-zinc-800 hover:border-zinc-300 transition-all rounded-xl text-left font-mono text-[9px] cursor-pointer group flex flex-col justify-between"
                          >
                            <div className="flex gap-1.5 items-center text-zinc-300">
                              <Check className="w-3.5 h-3.5" />
                              <span className="font-bold uppercase">UNDUH SEGEL BUKTI</span>
                            </div>
                            <span className="text-[7.5px] text-zinc-500 mt-2 font-sans leading-normal group-hover:text-zinc-300">
                              Ekspor bukti forensik digital lengkap beserta cap digital SHA-256 legal.
                            </span>
                          </button>
                        </div>
                      </div>

                    </motion.div>
                  ) : (
                    <div className="bg-zinc-950/45 border border-dashed border-zinc-900 rounded-[2.5rem] flex flex-col items-center justify-center py-28 text-center px-6">
                      {isDnsScraping ? (
                        <div className="space-y-4">
                          <div className="flex justify-center">
                            <RefreshCw className="w-8 h-8 text-[#DFFF00] animate-spin" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-mono font-black text-white block">Melakukan Resolving DNS & WHOIS forensik...</span>
                            <span className="text-[8px] text-[#DFFF00] font-mono block mt-1 uppercase tracking-widest animate-pulse">Menghubungi Server Terkait</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 max-w-md">
                          <div className="flex justify-center text-zinc-700">
                            <Globe className="w-12 h-12 stroke-[1.25]" />
                          </div>
                          <div>
                            <span className="text-[11px] font-black font-mono text-zinc-500 uppercase tracking-widest block">BELUM ADA DATA PEMINDAIAN ACTIVE</span>
                            <p className="text-[9px] text-zinc-650 leading-relaxed font-mono mt-2">
                              Masukkan domain target atau pilih preset silsilah offshore disebelah kiri, kemudian pilih tombol 'SCRAPE' untuk melihat hasil dan audit risiko digital.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </AnimatePresence>

              </div>
            </div>

            {/* Riwayat Investigasi / History Grid */}
            <div className="p-6 bg-zinc-950/40 border border-zinc-800/60 rounded-[2.5rem] space-y-4">
              <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="text-[10.5px] font-mono font-black text-white uppercase tracking-wider">RIWAYAT SCAN IDENTITAS DIGITAL DOMAIN (PERSISTEN GNN METRICS)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[9.5px]">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-500 uppercase text-[8px] font-black pb-2">
                      <th className="py-2">Domain Korporat</th>
                      <th className="py-2">Score / Rating</th>
                      <th className="py-2">Penyedia Server (Hosting)</th>
                      <th className="py-2">Negara Lokasi</th>
                      <th className="py-2 text-right">Aksi Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60">
                    {dnsHistory.map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/30 transition-colors">
                        <td className="py-2.5 font-bold text-white selection:bg-[#DFFF00] selection:text-black">{item.domain}</td>
                        <td className="py-2.5">
                          <span className={`px-1.5 py-0.5 rounded font-black text-[8px] ${
                            item.fatf_aml_risk_score >= 75
                              ? 'bg-red-500/10 text-red-400'
                              : item.fatf_aml_risk_score >= 40
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {item.fatf_aml_risk_score} / 100 ({item.fatf_aml_risk_score >= 75 ? 'RISK' : item.fatf_aml_risk_score >= 40 ? 'MEDIUM' : 'SAFE'})
                          </span>
                        </td>
                        <td className="py-2.5 text-zinc-400 truncate max-w-[200px]">{item.hosting_provider}</td>
                        <td className="py-2.5 text-zinc-500">{item.country_of_origin}</td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => {
                              setDnsInputDomain(item.domain);
                              // Trigger automatic fast audit from cache
                              setIsDnsScraping(true);
                              
                              setDnsLogFeed([
                                `[OIDC] Sesi penyidik terotentikasi (aidilsyahdan2000@gmail.com).`,
                                `[SYSTEM] Memulai pemindaian identitas digital domain: ${item.domain}`,
                                `[NET] Melakukan query silang DNS & WHOIS ke server registrasi...`,
                                `[NET] IP terdeteksi: ${(item.ip_addresses && item.ip_addresses[0]) || '104.21.73.54'}`,
                                `[FATF R24] Menganalisis parameter risiko entitas cangkang (Shell vehicle analyzer)...`,
                                `[SUCCESS] Pengambilan data forensik selesai. Hasil ter-audit!`
                              ]);

                              setTimeout(() => {
                                // Find full info or generate local data
                                setDnsScrapedResult({
                                  domain: item.domain,
                                  live_resolved: item.domain !== 'bvi-shell-partners.co.vg',
                                  ip_addresses: item.ip_addresses || ["104.21.73.54"],
                                  hosting_provider: item.hosting_provider,
                                  autonomous_system: item.domain === 'bvi-shell-partners.co.vg' ? 'AS43412' : item.domain === 'lpse.kemenkeu.go.id' ? 'AS17974' : 'AS24581',
                                  country_of_origin: item.country_of_origin,
                                  domain_age: item.domain_age || "Registered Entity",
                                  bulletproof_stealth: item.bulletproof_stealth,
                                  email_capability: item.email_capability,
                                  fatf_aml_risk_score: item.fatf_aml_risk_score,
                                  fatf_aml_risk_rating: item.fatf_aml_risk_rating,
                                  dns_records: {
                                    A: item.ip_addresses || ["104.21.73.54"],
                                    MX: item.email_capability ? ["10 mail.protection.outlook.com"] : ["No valid MX record setup"],
                                    NS: ["ns1.commonnameservers.org", "ns2.commonnameservers.org"],
                                    TXT: ["v=spf1 include:_spf.redshield.com -all"]
                                  },
                                  risk_indicators_triggered: item.bulletproof_stealth ? [
                                    "TEMPORAL_ANOMALY: Domain registered less than 90 days before major corporate transaction",
                                    "OFFSHORE_HOSTING: Server hosted behind high-stealth bulletproof proxy in loose AML compliance jurisdiction",
                                    "EMAIL_ABSENCE: Domain has blank or placeholder MX mail records (No operational corporate communication capability)"
                                  ] : ["None (Standard legitimate domain configuration matches industry norms)"],
                                  fatf_compliance_note: "Sistem pendataan identitas domain membantu pencapaian Kriteria Kunci Indikator FATF Bab Kelompok Kerja Rekomendasi 24 & 25 tentang Transparansi dan Kepemilikan Manfaat (Beneficial Ownership) Badan Hukum."
                                });
                                setIsDnsScraping(false);

                                // Smooth scroll up to result
                                setTimeout(() => {
                                  const element = document.getElementById('tbml-dns-intel-view') || document.getElementById('tab-tbml-dns-intel');
                                  if (element) {
                                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  }
                                }, 100);
                              }, 500);

                              alert(`Inspeksi Lanjut dimulai: Mengambil parameter WHOIS & DNS untuk '${item.domain}' dan memetakan aksi penindakan.`);
                            }}
                            className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 text-[8.5px] font-black text-[#DFFF00] hover:text-white hover:border-[#DFFF00] uppercase rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 inline-flex"
                          >
                            <Search className="w-3 h-3 text-[#DFFF00]" />
                            Inspeksi Lanjut
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </motion.div>
        )}

        {/* TAB 10: REAL-TIME VIU / FIU TRANSMITTED MONITORING PORTAL */}
        {activeSubTab === 'VIU_TRANSMITTED' && (
          <motion.div
            key="tbml-viu-transmitted-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
            id="tbml-viu-transmitted-view"
          >
            {/* PPATK Official Cryptographic Banner */}
            <div className="bg-gradient-to-r from-zinc-950 via-emerald-950/20 to-zinc-950 border border-emerald-500/25 rounded-[2rem] p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-3xl rounded-full -mr-20 -mt-20" />
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1.5 max-w-3xl">
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black font-mono text-emerald-400 uppercase tracking-[0.2em] rounded-full inline-block">
                    PRO-SE SENTINEL LAYER GATEWAY
                  </span>
                  <h3 className="text-lg font-black text-white tracking-wide uppercase">
                    VIU / FIU TRANSMISSION LOGS SYSTEM (PPATK REPORTING CENTRE)
                  </h3>
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
                    Arsip digital dan pemantau transmisi Laporan Transaksi Keuangan Mencurigakan (<strong className="text-white">LTKM / Suspicious Activity Report</strong>) yang secara sukses terkirim ke sistem kliring pusat PPATK Republik Indonesia. Setiap dokumen di-enkripsi menyeluruh dan dibubuhi tanda tangan kriptografi <strong className="text-emerald-400">SHA-256</strong> guna menjamin orisinalitas audit kepatuhan FATF Recommendation 24 & 25 demi kestabilan makro-financial negara.
                  </p>
                </div>
                <div className="flex flex-col items-end text-right font-mono self-stretch justify-between bg-black/45 border border-emerald-500/15 p-4 rounded-2xl min-w-[200px]">
                  <div>
                    <span className="text-[8px] text-zinc-500 uppercase block">FIU TRANSMISSION INDEX</span>
                    <span className="text-xs font-black text-emerald-400">100% OPERATIONAL</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-[8px] text-zinc-500 uppercase block">CRYPTOGRAPHIC KEY VALID</span>
                    <span className="text-[9.5px] font-bold text-white uppercase">[ TRUSTED NODE ]</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-2">
              <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl">
                <span className="text-[8px] font-mono text-zinc-500 uppercase block">Total Transmitted Reports</span>
                <span className="text-xl font-bold font-mono text-white mt-1 block">{viuTransmittedRecords.length} LTKMs</span>
              </div>
              <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl">
                <span className="text-[8px] font-mono text-zinc-500 uppercase block">SLA Response Latency</span>
                <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">240ms (API-9)</span>
              </div>
              <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl">
                <span className="text-[8px] font-mono text-zinc-500 uppercase block">Integrity Signatures</span>
                <span className="text-xl font-bold font-mono text-[#DFFF00] mt-1 block">100% MATCHED</span>
              </div>
              <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl">
                <span className="text-[8px] font-mono text-zinc-500 uppercase block">PPATK Active Connection</span>
                <span className="text-xl font-bold font-mono text-[#DFFF00] mt-1 block">SECURE VPN</span>
              </div>
            </div>

            {/* Main structural layout split columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: List of sent records */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-6 bg-zinc-950/40 border border-zinc-800/60 rounded-[2.5rem] space-y-4">
                  <div className="flex gap-2 items-center justify-between pb-2 border-b border-zinc-900">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                        <Terminal className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-extrabold text-white uppercase tracking-wider font-mono">Daftar Transmisi Sukses</h4>
                        <p className="text-[8px] text-zinc-500 font-mono uppercase">Verified Sentinel Submissions</p>
                      </div>
                    </div>
                  </div>

                  {/* Sent items list list */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {viuTransmittedRecords.map((rec) => (
                      <div
                        key={rec.ticketId}
                        onClick={() => {
                          setSelectedViuRecordTicketId(rec.ticketId);
                        }}
                        className={`p-3.5 rounded-2xl border text-left font-mono text-[9.5px] transition-all cursor-pointer block relative ${
                          selectedViuRecordTicketId === rec.ticketId
                            ? "bg-zinc-900/80 border-emerald-500/30 text-[#DFFF00]"
                            : "bg-black border-zinc-900 hover:border-zinc-800 text-zinc-400"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-white text-[10px] bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-850">
                            {rec.ticketId}
                          </span>
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-black text-[7px] uppercase tracking-wider">
                            {rec.severity}
                          </span>
                        </div>
                        <p className="font-sans text-xs text-zinc-300 font-semibold line-clamp-1 mt-1.5">
                          {rec.entityName}
                        </p>
                        <div className="mt-1 flex justify-between text-[7px] text-zinc-500">
                          <span>UBO: {rec.ubo}</span>
                          <span>{new Date(rec.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Helpful instructional tip */}
                  <div className="p-3.5 bg-[#DFFF00]/5 border border-[#DFFF00]/15 rounded-2xl text-[9px] text-zinc-400 leading-relaxed font-sans">
                    💡 <strong className="text-white uppercase font-mono">Petunjuk Investigasi Lanjut:</strong> Pilih baris tiket terkirim di atas untuk memuat riwayat forensik pabean dan pelacakan digital bursa efek secara langsung.
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Detail and Forensic action center */}
              <div className="lg:col-span-7">
                {(() => {
                  const currentReport = viuTransmittedRecords.find(r => r.ticketId === selectedViuRecordTicketId);
                  if (!currentReport) {
                    return (
                      <div className="bg-zinc-950/45 border border-dashed border-zinc-900 rounded-[2.5rem] flex flex-col items-center justify-center py-20 text-center text-zinc-550 font-mono text-[10px]">
                        Silakan pilih tiket di sebelah kiri...
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-4">
                      
                      {/* Ticket Header & Forensic details */}
                      <div className="p-6 bg-zinc-950/40 border border-zinc-800/60 rounded-[2.5rem] space-y-4">
                        <div className="flex justify-between items-start border-b border-zinc-900 pb-3">
                          <div>
                            <span className="text-[7.5px] font-mono text-zinc-500 uppercase font-bold tracking-widest block mb-0.5">FIU CENTRAL REGISTRY RECORD</span>
                            <h4 className="text-base font-extrabold text-white font-mono">{currentReport.ticketId}</h4>
                          </div>

                          <span className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-mono text-[9px] font-bold">
                            ✔ VERIFIED TRANSMISSION
                          </span>
                        </div>

                        {/* Route and Metadata */}
                        <div className="grid grid-cols-2 gap-4 font-mono text-[9px] bg-black p-4 rounded-2xl border border-zinc-900">
                          <div className="space-y-1">
                            <span className="text-[7.5px] text-zinc-500 block uppercase font-bold">UBO (Beneficial Owner)</span>
                            <span className="text-[#DFFF00] font-black uppercase text-[10px] break-keep">{currentReport.ubo}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[7.5px] text-zinc-500 block uppercase font-bold">Instansi Pemeriksa</span>
                            <span className="text-white font-semibold">PPATK HUB GATEWAY 9A</span>
                          </div>
                          <div className="space-y-1 pt-1 border-t border-zinc-900">
                            <span className="text-[7.5px] text-zinc-500 block uppercase font-bold">Timestamp Transmisi</span>
                            <span className="text-zinc-300 font-medium">{new Date(currentReport.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="space-y-1 pt-1 border-t border-zinc-900">
                            <span className="text-[7.5px] text-zinc-500 block uppercase font-bold">Keaktifan Investigasi</span>
                            <span className="text-amber-400 font-extrabold uppercase animate-pulse">UNDER FIU REVIEW</span>
                          </div>
                        </div>

                        {/* Signature validation */}
                        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-2">
                          <div className="flex justify-between items-center text-[8px] font-mono font-bold text-zinc-400 uppercase">
                            <span>Sandi Tanda Tangan Kriptografi (Checksum)</span>
                            <span className="text-emerald-400">MATCHED OK</span>
                          </div>
                          <div className="text-[8.5px] bg-black text-[#DFFF00] font-mono p-2 rounded border border-zinc-900/60 select-all overflow-x-auto whitespace-nowrap">
                            {currentReport.xmlHash}
                          </div>
                        </div>

                        {/* Embedded report viewer */}
                        <div className="space-y-1.5">
                          <span className="text-[7.5px] font-mono text-zinc-500 uppercase block font-bold">Draft Teks Laporan Transmisi (Pro-Forma XML)</span>
                          <div className="bg-black text-emerald-400 font-mono text-[8.5px] p-4 rounded-2xl max-h-[160px] overflow-y-auto leading-relaxed border border-zinc-900 select-all custom-scrollbar whitespace-pre-wrap">
                            {currentReport.text}
                          </div>
                        </div>

                        {/* INVESTIGATIVE ACTION CLUSTERING FOR ADVANCED INQUESTS */}
                        <div className="space-y-2 mt-4 pt-3 border-t border-zinc-900">
                          <span className="text-[8px] font-mono text-zinc-500 uppercase font-black tracking-widest block mb-2">
                            LANGKAH INVESTIGASI TINGKAT LANJUT / DEEP INTELLIGENCE CROSS-LINKS
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* Option 1: Trigger Domain verification in the DNS tab directly */}
                            <button
                              type="button"
                              onClick={() => {
                                // Extract target domain or default to preset domain based on UBO
                                let targetDomain = "bvi-shell-partners.co.vg";
                                if (currentReport.ubo.includes("Sovereign")) {
                                  targetDomain = "sumatera-ore-mining.net";
                                }
                                
                                setDnsInputDomain(targetDomain);
                                setActiveSubTab('DNS_INTEL');
                                
                                // Auto-trigger of live scrape simulation for best experience!
                                setIsDnsScraping(true);
                                setDnsLogFeed([
                                  `[SYSTEM] Memulai pemindaian identitas digital domain: ${targetDomain}`,
                                  `[OIDC] Hak jaminan investigasi diperiksa (aidilsyahdan2000@gmail.com)... OK.`,
                                  `[NET] Menghubungi multi-node gateway DNS di private subnet VAM...`
                                ]);
                                
                                setTimeout(() => {
                                  // Populate result from cache
                                  const cacheData = targetDomain === 'bvi-shell-partners.co.vg' 
                                    ? dnsHistory[0] 
                                    : dnsHistory[2];
                                  
                                  setDnsScrapedResult({
                                    domain: targetDomain,
                                    live_resolved: true,
                                    ip_addresses: cacheData.ip_addresses,
                                    hosting_provider: cacheData.hosting_provider,
                                    autonomous_system: targetDomain === 'bvi-shell-partners.co.vg' ? 'AS43412' : 'AS24581',
                                    country_of_origin: cacheData.country_of_origin,
                                    domain_age: cacheData.domain_age,
                                    bulletproof_stealth: cacheData.bulletproof_stealth,
                                    email_capability: cacheData.email_capability,
                                    fatf_aml_risk_score: cacheData.fatf_aml_risk_score,
                                    fatf_aml_risk_rating: cacheData.fatf_aml_risk_rating,
                                    dns_records: {
                                      A: cacheData.ip_addresses,
                                      MX: cacheData.email_capability ? ["10 mail.protection.outlook.com"] : ["No valid MX record setup"],
                                      NS: ["ns1.commonnameservers.org", "ns2.commonnameservers.org"],
                                      TXT: ["v=spf1 include:_spf.redshield.com -all"]
                                    },
                                    risk_indicators_triggered: cacheData.bulletproof_stealth ? [
                                      "TEMPORAL_ANOMALY: Domain registered less than 90 days before major corporate transaction",
                                      "OFFSHORE_HOSTING: Server hosted behind high-stealth bulletproof proxy in loose AML compliance jurisdiction",
                                      "EMAIL_ABSENCE: Domain has blank or placeholder MX mail records (No operational corporate communication capability)"
                                    ] : ["None (Standard legitimate domain configuration matches industry norms)"],
                                    fatf_compliance_note: "Sistem pendataan identitas domain membantu pencapaian Kriteria Kunci Indikator FATF Bab Kelompok Kerja Rekomendasi 24 & 25 tentang Transparansi dan Kepemilikan Manfaat (Beneficial Ownership) Badan Hukum."
                                  });
                                  setIsDnsScraping(false);
                                  setDnsLogFeed(prev => [...prev, `[SUCCESS] Forensik identitas selesai. Tingkat Kepercayaan Riset: 99.4%`]);
                                }, 1500);

                                alert(`Melakukan transfer sesi. Sedang memverifikasi record DNS untuk domain: ${targetDomain}`);
                              }}
                              className="py-2.5 px-3 bg-zinc-900 border border-zinc-800 hover:border-[#DFFF00] text-[#DFFF00] rounded-xl text-[8.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:bg-black"
                            >
                              <Globe className="w-3.5 h-3.5 text-[#DFFF00]" />
                              Lacak Server & DNS UBO Forensik
                            </button>

                            {/* Option 2: Redirect to GNN Beneficial Ownership */}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSubTab('GNNSYSTEM');
                                alert("Mengarahkan penyelidikan ke pemetaan jaringan struktur relasi bayangan (GNN Beneficial Ownership Graph)!");
                              }}
                              className="py-2.5 px-3 bg-zinc-900 border border-zinc-800 hover:border-emerald-400 text-emerald-400 rounded-xl text-[8.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:bg-black"
                            >
                              <Network className="w-3.5 h-3.5 text-emerald-400" />
                              Visualisasikan Relasi GNN UBO
                            </button>
                          </div>
                        </div>

                      </div>

                    </div>
                  );
                })()}

              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
