
export type UserRole = 'Public' | 'Analyst' | 'Trader' | 'Manager' | 'President_Director';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  updatedAt: number;
}

export type AmirTriggerType = 'SCHEDULED' | 'MANUAL';
export type AmirJobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type AmirCategory = 
  | 'MACRO_ECONOMY' 
  | 'COMMODITY_PRICES' 
  | 'REGULATORY_COMPLIANCE' 
  | 'COMPETITOR_BENCHMARK' 
  | 'EXECUTIVE_SYNTHESIS';

export type AmirScope = 
  | 'commodity_energy' 
  | 'macro_idr_usd' 
  | 'regulatory_updates' 
  | 'competitor_peers' 
  | 'internal_portfolio';

export interface AmirExecutionStep {
  step: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: string;
  detail?: string;
  sources_scanned?: string[];
}

export interface MarketResearchJob {
  id: string;
  trigger_type: AmirTriggerType;
  status: AmirJobStatus;
  parameters: {
    scopes: AmirScope[];
    target_report_period: string;
    custom_focus?: string;
    depth_level?: 'STANDARD_DEEP_SEARCH' | 'COMPREHENSIVE_FORENSIC';
    internal_portfolio_summary?: any;
  };
  progress_percent: number;
  current_step?: string;
  execution_steps: AmirExecutionStep[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
  error?: string;
  summary_stats?: {
    total_logs: number;
    sources_count: number;
    risk_flags: number;
    compliance_score: number;
  };
}

export interface AmirSourceCitation {
  title: string;
  uri?: string;
  authority: string;
  date?: string;
}

export interface AmirKeyMetric {
  label: string;
  value: string;
  change?: string;
  trend?: 'UP' | 'DOWN' | 'STABLE';
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface AmirCompetitorItem {
  peer_name: string;
  market_cap: string;
  p_e: string;
  strategic_move: string;
  threat_level: string;
}

export interface AmirComplianceCheck {
  ojk_rules_status: string;
  mifid_sec_alignment: string;
  tax_policy_alert: string;
  capital_adequacy_impact: string;
}

export interface RawInsightData {
  executive_summary: string;
  key_metrics: AmirKeyMetric[];
  strategic_implications: string[];
  action_recommendations: string[];
  sources: AmirSourceCitation[];
  forensic_analysis_paragraphs: string[];
  compliance_check?: AmirComplianceCheck;
  competitor_matrix?: AmirCompetitorItem[];
}

export interface MarketIntelligenceLog {
  id: string;
  job_id: string;
  category: AmirCategory;
  summary_title: string;
  raw_insight_data: RawInsightData;
  audit_notes: string;
  executed_by: string;
  sha256_hash: string;
  created_at: string;
}

export interface AmirScheduleConfig {
  enabled: boolean;
  frequency: 'WEEKLY_MONDAY' | 'MONTHLY_CLOSING' | 'PRE_BOARD_MEETING' | 'DAILY_OPEN';
  run_time: string;
  scopes: AmirScope[];
  target_report_period: string;
  notify_emails: string[];
  last_run?: string;
  next_run?: string;
  auto_inject_to_management_report: boolean;
}

// ----------------------------------------------------
// BANK INDONESIA (BI) REAL-TIME KURS & MACRO TYPES
// ----------------------------------------------------
export interface BankIndonesiaExchangeRate {
  currency: string;
  name: string;
  symbol: string;
  kurs_jual: number;
  kurs_beli: number;
  kurs_tengah: number;
  change_idr: number;
  change_percent: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  unit: number;
  last_updated: string;
}

export interface BankIndonesiaMacroRates {
  jisdor_usd_idr: number;
  jisdor_date: string;
  jisdor_change: number;
  jisdor_change_percent: number;
  bi_rate: number;
  deposit_facility_rate: number;
  lending_facility_rate: number;
  sbn_10yr_yield: number;
  cadangan_devisa_usd: number;
  inflasi_ihk_yoy: number;
  srbi_12m_yield: number;
  last_sync_timestamp: string;
  source_authority: string;
}

export interface LiveRealMarketStock {
  ticker: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  market_cap_idr: string;
  pe_ratio: number;
  pbv: number;
  sector: string;
  last_trade_time: string;
}

export interface LiveRealMarketCommodity {
  name: string;
  symbol: string;
  price: string;
  numeric_price: number;
  unit: string;
  change_percent: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  authority: string;
  category: 'ENERGY' | 'METAL' | 'AGRICULTURE';
}

export interface LiveRealMarketPayload {
  status: string;
  timestamp: string;
  bi_rates: BankIndonesiaExchangeRate[];
  bi_macro: BankIndonesiaMacroRates;
  ihsg: {
    level: number;
    change: number;
    change_percent: number;
    high: number;
    low: number;
    volume_shares: string;
    value_idr: string;
    status: 'OPEN' | 'CLOSED';
    last_updated: string;
  };
  stocks: LiveRealMarketStock[];
  commodities: LiveRealMarketCommodity[];
}

// ----------------------------------------------------
// CUSTODY & PORTFOLIO INTEGRATION (CPI) TYPES
// ----------------------------------------------------
export type CustodianInstitution = 
  | 'CIMB_NIAGA_RDN' 
  | 'CIMB_NIAGA_GIRO' 
  | 'CGS_SEKURITAS' 
  | 'IBKR_GATEWAY';

export interface CustodyAccount {
  id: string;
  name: string;
  institution: CustodianInstitution;
  account_number: string;
  account_number_masked?: string;
  currency: 'IDR' | 'USD';
  balance: number;
  available_cash: number;
  reserved_cash: number;
  last_reconciled_at: string;
  status: 'ACTIVE' | 'SYNCED' | 'REQUIRES_RECONCILIATION' | 'DISCREPANCY';
  psak71_category?: 'FVOCI' | 'FVTPL' | 'AMORTIZED_COST';
  branch_or_entity?: string;
}

export interface CustodyMutationItem {
  id: string;
  date: string;
  description: string;
  type: 'CREDIT' | 'DEBIT' | 'FEE' | 'TAX' | 'DIVIDEND' | 'SETTLEMENT';
  amount: number;
  balance_after?: number;
  reference_no?: string;
  verified: boolean;
}

export interface CustodyExtractedHolding {
  ticker: string;
  name: string;
  asset_class: 'EQUITY' | 'SUKUK' | 'BOND' | 'MMF' | 'OFFSHORE_EQUITY';
  quantity: number;
  avg_cost: number;
  market_price: number;
  market_value: number;
  currency: 'IDR' | 'USD';
  verified: boolean;
}

export interface CustodyStatementParseResult {
  statement_id: string;
  institution: CustodianInstitution;
  account_number: string;
  period_start: string;
  period_end: string;
  currency: 'IDR' | 'USD';
  opening_balance: number;
  closing_balance: number;
  total_credits: number;
  total_debits: number;
  mutations: CustodyMutationItem[];
  holdings: CustodyExtractedHolding[];
  confidence_score: number;
  raw_text_snippet?: string;
  ai_notes: string;
  extracted_at: string;
}

export interface PortfolioHolding {
  id: string;
  ticker: string;
  asset_name: string;
  asset_class: 'EQUITY' | 'SUKUK' | 'BOND' | 'MMF' | 'OFFSHORE_EQUITY' | 'WARRANT' | 'FIXED_ASSET' | 'PROPERTY' | 'IT_INFRASTRUCTURE' | 'INTANGIBLE_ASSET' | 'INTANGIBLE' | 'PRIVATE_EQUITY' | 'DIRECT_LOAN' | 'OTHER';
  quantity: number;
  avg_price: number;
  current_price: number;
  market_value_idr: number;
  market_value_usd: number;
  currency: 'IDR' | 'USD';
  allocation_percent: number;
  custodian_id: string;
  custodian_name: string;
  pnl_unrealized_idr: number;
  pnl_unrealized_percent: number;
  psak71_category: 'FVOCI' | 'FVTPL' | 'AMORTIZED_COST';
  source_origin?: 'PORTFOLIO_ANALYST' | 'WAP_INVENTORY' | 'WAP_INVESTMENT' | 'INTANGIBLE_ASSET' | 'CUSTODIAN_STATEMENT' | 'MANUAL';
  category_detail?: string;
  location?: string;
  serial_number?: string;
  last_updated: string;
}

export interface ReconciliationAccountSummary {
  institution: CustodianInstitution;
  account_name: string;
  account_no: string;
  reported_balance: number;
  ledger_balance: number;
  difference: number;
  status: 'MATCHED' | 'VARIANCE_DETECTED';
}

export interface ReconciliationVarianceDetail {
  id: string;
  account: string;
  item_type: 'CASH_DRIFT' | 'UNSETTLED_TRADE' | 'WITHHOLDING_TAX' | 'CUSTODIAN_FEE' | 'DIVIDEND_ACCRUAL';
  discrepancy_amount: number;
  description: string;
  recommended_action: string;
}

export interface ReconciliationRecord {
  id: string;
  timestamp: string;
  status: 'BALANCED' | 'DISCREPANCY_DETECTED' | 'PENDING_REVIEW';
  total_ledger_cash_idr: number;
  total_custodian_cash_idr: number;
  cash_drift_idr: number;
  psak71_compliant: boolean;
  accounts_summary: ReconciliationAccountSummary[];
  variance_details: ReconciliationVarianceDetail[];
  audited_by: string;
  sha256_hash: string;
}

// ----------------------------------------------------
// EXECUTIVE BOARD PACK (AMIR SYNTHESIS)
// ----------------------------------------------------
export interface StrategicPillarAssessment {
  pillar_name: string;
  assessment: string;
  conviction_score: number; // 0-100
  outlook: 'BULLISH' | 'NEUTRAL' | 'DEFENSIVE' | 'HIGH_ALERT';
}

export interface RegulatoryMatrixClearance {
  framework: 'OJK_POJK' | 'DJP_TAX' | 'MIFID_II' | 'SEC_144A';
  rule_reference: string;
  compliance_status: 'CLEARED' | 'CONDITIONAL' | 'ACTION_REQUIRED';
  clearance_note: string;
  review_date: string;
}

export interface AssetAllocationConviction {
  asset_class: string;
  current_weight: number; // e.g. 45%
  target_weight: number; // e.g. 40%
  conviction_sizing: 'OVERWEIGHT' | 'EQUALWEIGHT' | 'UNDERWEIGHT';
  rationale: string;
}

export interface GovernanceSignatureBlock {
  prepared_by: string;
  prepared_by_title: string;
  reviewed_by: string;
  reviewed_by_title: string;
  approved_by: string;
  approved_by_title: string;
  sign_off_timestamp: string;
  sha256_seal: string;
}

export interface ExecutiveBoardPack {
  id: string;
  job_id: string;
  title: string;
  target_period: string;
  generated_at: string;
  macro_economic_overview: string;
  energy_commodity_analysis: string;
  strategic_pillars: StrategicPillarAssessment[];
  regulatory_clearances: RegulatoryMatrixClearance[];
  asset_convictions: AssetAllocationConviction[];
  internal_portfolio_alignment: {
    total_aum_idr: string;
    cash_liquidity_ratio: string;
    dssa_defi_allocation_notes: string;
    stress_test_scenario: string;
  };
  governance_signatures: GovernanceSignatureBlock;
  sha256_hash: string;
}

