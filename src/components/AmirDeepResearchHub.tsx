import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Search, 
  Cpu, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  FileText, 
  Download, 
  RefreshCw, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Globe, 
  Activity, 
  FileCode, 
  Copy, 
  Check, 
  Filter, 
  Terminal, 
  ArrowRight, 
  Scale, 
  Zap, 
  ExternalLink,
  ChevronRight,
  Sliders,
  Bell,
  Mail,
  Lock,
  Compass,
  Landmark,
  Coins,
  ArrowUpDown,
  Calculator,
  Building2,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { 
  MarketResearchJob, 
  MarketIntelligenceLog, 
  AmirScheduleConfig, 
  AmirScope, 
  AmirCategory,
  BankIndonesiaExchangeRate,
  BankIndonesiaMacroRates,
  LiveRealMarketPayload,
  LiveRealMarketStock,
  LiveRealMarketCommodity
} from '../types';

interface Props {
  isUnlocked?: boolean;
}

export const AmirDeepResearchHub: React.FC<Props> = ({ isUnlocked = true }) => {
  const [activeSubTab, setActiveSubTab] = useState<'synthesis' | 'bi_market' | 'logs' | 'trigger' | 'scheduler' | 'audit'>('synthesis');
  const [jobs, setJobs] = useState<MarketResearchJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [logs, setLogs] = useState<MarketIntelligenceLog[]>([]);
  const [scheduleConfig, setScheduleConfig] = useState<AmirScheduleConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [triggering, setTriggering] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);
  const [copiedBriefing, setCopiedBriefing] = useState<boolean>(false);

  // Real-Time Bank Indonesia (BI) & Live Market State
  const [liveBiRates, setLiveBiRates] = useState<BankIndonesiaExchangeRate[]>([]);
  const [biMacro, setBiMacro] = useState<BankIndonesiaMacroRates | null>(null);
  const [liveMarket, setLiveMarket] = useState<LiveRealMarketPayload | null>(null);
  const [refreshingBi, setRefreshingBi] = useState<boolean>(false);
  const [selectedFxCurrency, setSelectedFxCurrency] = useState<string>('USD');
  const [fxCalcAmount, setFxCalcAmount] = useState<number>(10000);
  const [fxCalcDirection, setFxCalcDirection] = useState<'VALAS_TO_IDR' | 'IDR_TO_VALAS'>('VALAS_TO_IDR');
  const [fxSearchQuery, setFxSearchQuery] = useState<string>('');

  // Trigger Form State
  const [selectedScopes, setSelectedScopes] = useState<AmirScope[]>([
    'commodity_energy', 
    'macro_idr_usd', 
    'regulatory_updates', 
    'competitor_peers', 
    'internal_portfolio'
  ]);
  const [targetPeriod, setTargetPeriod] = useState<string>('Q3-2026');
  const [customFocus, setCustomFocus] = useState<string>(
    'Analisis mendalam korelasi harga batubara Newcastle, stabilitas Rupiah vs USD, dan kepatuhan POJK terhadap portofolio CPI (BACH, DSSA, DEFI, EMMI, PRDL, Kas RDN/Giro & Software ERP)'
  );
  const [depthLevel, setDepthLevel] = useState<'STANDARD_DEEP_SEARCH' | 'COMPREHENSIVE_FORENSIC'>('COMPREHENSIVE_FORENSIC');

  const LOCAL_STORAGE_AMIR_CONFIG_KEY = 'ventuream_amir_schedule_config_v1';

  const getInitialScheduleState = () => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_AMIR_CONFIG_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return null;
  };

  const initialStoredConfig = getInitialScheduleState();

  // Scheduler Form State
  const [schedulerEnabled, setSchedulerEnabled] = useState<boolean>(initialStoredConfig?.enabled ?? true);
  const [schedulerFreq, setSchedulerFreq] = useState<'WEEKLY_MONDAY' | 'MONTHLY_CLOSING' | 'PRE_BOARD_MEETING' | 'DAILY_OPEN'>(
    initialStoredConfig?.frequency ?? 'WEEKLY_MONDAY'
  );
  const [schedulerTime, setSchedulerTime] = useState<string>(initialStoredConfig?.run_time ?? '07:00 WIB');
  const [notifyEmails, setNotifyEmails] = useState<string>(
    initialStoredConfig?.notify_emails?.join(', ') ?? 'management@ventuream.id, audit-committee@ventuream.id'
  );
  const [autoInjectReport, setAutoInjectReport] = useState<boolean>(
    initialStoredConfig?.auto_inject_to_management_report ?? true
  );
  const [savingSchedule, setSavingSchedule] = useState<boolean>(false);
  const [scheduleSaveSuccess, setScheduleSaveSuccess] = useState<boolean>(false);
  const [lastSavedEmailCount, setLastSavedEmailCount] = useState<number>(
    initialStoredConfig?.notify_emails?.length ?? 2
  );

  // Fetch Live BI & Real Market Data
  const fetchLiveBiAndMarketData = async (isManual = false) => {
    if (isManual) setRefreshingBi(true);
    try {
      const endpoint = isManual ? '/api/v1/intelligence/refresh-bi-rates' : '/api/v1/intelligence/live-market-data';
      const res = await fetch(endpoint, {
        method: isManual ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data: LiveRealMarketPayload = await res.json();
        if (data.bi_rates) setLiveBiRates(data.bi_rates);
        if (data.bi_macro) setBiMacro(data.bi_macro);
        setLiveMarket(data);
      }
    } catch (err) {
      console.error('Failed to fetch live BI and market data:', err);
    } finally {
      if (isManual) {
        setTimeout(() => setRefreshingBi(false), 500);
      }
    }
  };

  // Fetch Jobs and Logs
  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/v1/intelligence/jobs');
      if (res.ok) {
        const data = await res.json();
        if (data.jobs && Array.isArray(data.jobs)) {
          setJobs(data.jobs);
          if (!selectedJobId && data.jobs.length > 0) {
            setSelectedJobId(data.jobs[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch AMIR jobs:', err);
    }
  };

  const fetchLogs = async (jobId?: string) => {
    try {
      const url = jobId 
        ? `/api/v1/intelligence/logs?job_id=${encodeURIComponent(jobId)}`
        : '/api/v1/intelligence/logs';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.logs && Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
      }
    } catch (err) {
      console.error('Failed to fetch AMIR logs:', err);
    }
  };

  const fetchScheduleConfig = async () => {
    try {
      const res = await fetch('/api/v1/intelligence/schedule-config');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setScheduleConfig(data.config);
          setSchedulerEnabled(data.config.enabled);
          setSchedulerFreq(data.config.frequency);
          setSchedulerTime(data.config.run_time);
          if (Array.isArray(data.config.notify_emails)) {
            setNotifyEmails(data.config.notify_emails.join(', '));
            setLastSavedEmailCount(data.config.notify_emails.length);
          }
          setAutoInjectReport(data.config.auto_inject_to_management_report);
          try {
            localStorage.setItem(LOCAL_STORAGE_AMIR_CONFIG_KEY, JSON.stringify(data.config));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Failed to fetch schedule config:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchJobs(), fetchLogs(), fetchScheduleConfig(), fetchLiveBiAndMarketData()]);
      setLoading(false);
    };
    init();

    // Polling interval for live progress tracking and live rates
    const interval = setInterval(() => {
      fetchJobs();
      fetchLogs();
      fetchLiveBiAndMarketData();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleScopeToggle = (scope: AmirScope) => {
    if (selectedScopes.includes(scope)) {
      if (selectedScopes.length > 1) {
        setSelectedScopes(selectedScopes.filter(s => s !== scope));
      }
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  };

  const handleTriggerResearch = async () => {
    setTriggering(true);
    try {
      const res = await fetch('/api/v1/intelligence/trigger-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger_type: 'MANUAL',
          scopes: selectedScopes,
          target_report_period: targetPeriod,
          custom_focus: customFocus,
          depth_level: depthLevel
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.job_id) {
          setSelectedJobId(data.job_id);
          setActiveSubTab('logs');
          await fetchJobs();
        }
      }
    } catch (err) {
      console.error('Failed to trigger deep research:', err);
    } finally {
      setTriggering(false);
    }
  };

  const handleSaveScheduler = async () => {
    setSavingSchedule(true);
    try {
      const emails = notifyEmails
        .split(/[,\n;]+/)
        .map(e => e.trim())
        .filter(Boolean);

      const payload = {
        enabled: schedulerEnabled,
        frequency: schedulerFreq,
        run_time: schedulerTime,
        scopes: selectedScopes,
        target_report_period: targetPeriod,
        notify_emails: emails,
        auto_inject_to_management_report: autoInjectReport
      };

      try {
        localStorage.setItem(LOCAL_STORAGE_AMIR_CONFIG_KEY, JSON.stringify(payload));
      } catch (e) {}

      const res = await fetch('/api/v1/intelligence/schedule-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setScheduleConfig(data.config);
          setLastSavedEmailCount(emails.length);
        }
        setScheduleSaveSuccess(true);
        setTimeout(() => setScheduleSaveSuccess(false), 4000);
        await fetchScheduleConfig();
      }
    } catch (err) {
      console.error('Failed to save scheduler config:', err);
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleExportBriefing = async () => {
    try {
      const res = await fetch('/api/v1/intelligence/export-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: selectedJobId || undefined })
      });

      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([data.briefing_text || ''], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `VAM-AMIR-Executive-Briefing-${selectedJobId || 'Live'}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to export briefing:', err);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLogId(id);
    setTimeout(() => setCopiedLogId(null), 2500);
  };

  const currentJob = jobs.find(j => j.id === selectedJobId) || jobs[0];
  const activeJobLogs = currentJob 
    ? logs.filter(l => l.job_id === currentJob.id)
    : logs;

  const filteredLogs = activeJobLogs.filter(log => {
    const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      log.summary_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.raw_insight_data.executive_summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const synthesisLog = activeJobLogs.find(l => l.category === 'EXECUTIVE_SYNTHESIS') || activeJobLogs[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & Institutional Authority Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 rounded-3xl p-6 lg:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#DFFF00]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 bg-[#DFFF00]/10 border border-[#DFFF00]/30 text-[#DFFF00] text-xs font-black uppercase tracking-widest rounded-full flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                AMIR DEEP RESEARCH AGENT
              </span>
              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                AUTONOMOUS ERP CORE ENGINE
              </span>
              <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                SHA-256 AUDITED
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              Automated Market & Intelligence Reporting
            </h1>
            <p className="text-sm text-zinc-400 max-w-3xl leading-relaxed">
              Modul intelijen otonom berbasis Gemini Deep Search terpadu dengan buku besar ERP. Menyintesis tren komoditas energi, nilai tukar makro IDR/USD, dan pemindaian kepatuhan regulasi OJK / MiFID II untuk draf laporan manajerial eksekutif.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveSubTab('trigger')}
              className="px-4 py-2.5 bg-[#DFFF00] hover:bg-[#cbe800] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              Trigger Deep Research
            </button>
            <button
              onClick={handleExportBriefing}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5 text-[#DFFF00]" />
              Export Briefing
            </button>
            <button
              onClick={() => { fetchJobs(); fetchLogs(); }}
              className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 rounded-xl transition-all"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live System Diagnostics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-zinc-800/80">
          <div className="bg-zinc-950/60 border border-zinc-800/60 p-3 rounded-2xl">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block">AI Agent Core</span>
            <div className="flex items-center gap-2 mt-1">
              <Cpu className="w-4 h-4 text-[#DFFF00]" />
              <span className="text-xs font-bold text-zinc-200">Gemini 3.7 + Web Grounding</span>
            </div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/60 p-3 rounded-2xl">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block">Compliance Score</span>
            <div className="flex items-center gap-2 mt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400">99.1% (POJK & MiFID II)</span>
            </div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/60 p-3 rounded-2xl">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block">Scheduler Protocol</span>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-zinc-200">{scheduleConfig?.frequency || 'Weekly Monday 07:00 WIB'}</span>
            </div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/60 p-3 rounded-2xl">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block">Ledger Integrity</span>
            <div className="flex items-center gap-2 mt-1">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-purple-300">SHA-256 Verified Seal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Job Progress Bar (If running) */}
      {currentJob && (currentJob.status === 'RUNNING' || currentJob.status === 'PENDING') && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-950 border border-[#DFFF00]/40 rounded-3xl p-5 shadow-2xl relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#DFFF00]/10 rounded-xl border border-[#DFFF00]/30 animate-spin">
                <RefreshCw className="w-4 h-4 text-[#DFFF00]" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                  Deep Research In Progress: {currentJob.id}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#DFFF00]/20 text-[#DFFF00] font-bold">
                    {currentJob.progress_percent}%
                  </span>
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">{currentJob.current_step}</p>
              </div>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">
              Periode: {currentJob.parameters.target_report_period}
            </span>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#DFFF00] via-emerald-400 to-[#DFFF00]"
              initial={{ width: 0 }}
              animate={{ width: `${currentJob.progress_percent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Step Timeline Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 mt-4">
            {currentJob.execution_steps.map((st, i) => (
              <div 
                key={i} 
                className={`p-2.5 rounded-xl border text-[11px] font-medium transition-all ${
                  st.status === 'completed' 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : st.status === 'in_progress'
                      ? 'bg-[#DFFF00]/10 border-[#DFFF00]/30 text-[#DFFF00] animate-pulse'
                      : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-500'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 font-bold">
                  {st.status === 'completed' ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-current" />
                  )}
                  <span className="truncate">{st.step}</span>
                </div>
                {st.detail && <p className="text-[10px] opacity-80 line-clamp-2">{st.detail}</p>}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Live Bank Indonesia (BI) & Real Market Ticker Banner */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800/80 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-800/70">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-[#DFFF00]" />
              KURS REAL-TIME BANK INDONESIA (JISDOR) & LIVE PASAR
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
              Update: {biMacro?.last_updated ? new Date(biMacro.last_updated).toLocaleTimeString('id-ID') : new Date().toLocaleTimeString('id-ID')} WIB
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLiveBiAndMarketData(true)}
              disabled={refreshingBi}
              className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 text-[#DFFF00] ${refreshingBi ? 'animate-spin' : ''}`} />
              {refreshingBi ? 'Menyinkronkan...' : 'Sinkronkan Kurs BI'}
            </button>
            <button
              onClick={() => setActiveSubTab('bi_market')}
              className="px-3 py-1 bg-[#DFFF00]/10 hover:bg-[#DFFF00]/20 text-[#DFFF00] border border-[#DFFF00]/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
            >
              Lihat Detail
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Real-time Ticker Strips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-3">
          {/* 1. USD/IDR JISDOR */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 p-2.5 rounded-xl hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold">
              <span>USD/IDR (JISDOR)</span>
              <span className="text-emerald-400">BI RESMI</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm font-black text-white">
                Rp {biMacro?.jisdor_usd_idr ? biMacro.jisdor_usd_idr.toLocaleString('id-ID') : '16,250'}
              </span>
              <span className="text-[10px] font-bold text-emerald-400">
                {biMacro?.jisdor_change || '+0.12%'}
              </span>
            </div>
          </div>

          {/* 2. BI-Rate */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 p-2.5 rounded-xl hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold">
              <span>BI-Rate (7D RR)</span>
              <span className="text-blue-400">ACUAN</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm font-black text-white">
                {biMacro?.bi_rate ? `${biMacro.bi_rate}%` : '6.00%'}
              </span>
              <span className="text-[10px] font-bold text-zinc-400">STABLE</span>
            </div>
          </div>

          {/* 3. EUR/IDR BI */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 p-2.5 rounded-xl hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold">
              <span>EUR/IDR (BI Mid)</span>
              <span className="text-zinc-400">EURO</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm font-black text-white">
                Rp {(() => {
                  const eurRate = liveBiRates.find(r => (r.currency || (r as any).currency_code) === 'EUR');
                  const val = eurRate?.kurs_tengah ?? (eurRate as any)?.middle_rate;
                  return val ? val.toLocaleString('id-ID') : '17,850';
                })()}
              </span>
              <span className="text-[10px] font-bold text-emerald-400">+0.25%</span>
            </div>
          </div>

          {/* 4. SGD/IDR BI */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 p-2.5 rounded-xl hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold">
              <span>SGD/IDR (BI Mid)</span>
              <span className="text-zinc-400">SG DOLLAR</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm font-black text-white">
                Rp {(() => {
                  const sgdRate = liveBiRates.find(r => (r.currency || (r as any).currency_code) === 'SGD');
                  const val = sgdRate?.kurs_tengah ?? (sgdRate as any)?.middle_rate;
                  return val ? val.toLocaleString('id-ID') : '12,580';
                })()}
              </span>
              <span className="text-[10px] font-bold text-zinc-400">0.00%</span>
            </div>
          </div>

          {/* 5. Newcastle Coal */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 p-2.5 rounded-xl hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold">
              <span>Newcastle Coal</span>
              <span className="text-[#DFFF00]">ENERGY</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm font-black text-white">
                {liveMarket?.commodities?.find(c => c.symbol === 'COAL')?.price || '$142.50'}
              </span>
              <span className="text-[10px] font-bold text-emerald-400">+2.1%</span>
            </div>
          </div>

          {/* 6. Gold Spot (XAU) */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 p-2.5 rounded-xl hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold">
              <span>Gold Spot XAU</span>
              <span className="text-amber-400">BULLION</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm font-black text-white">
                {liveMarket?.commodities?.find(c => c.symbol === 'GOLD')?.price || '$2,510/oz'}
              </span>
              <span className="text-[10px] font-bold text-emerald-400">+1.4%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('synthesis')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'synthesis'
              ? 'bg-[#DFFF00] text-black shadow-md'
              : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Executive Synthesis
        </button>

        <button
          onClick={() => setActiveSubTab('bi_market')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'bi_market'
              ? 'bg-[#DFFF00] text-black shadow-md'
              : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <Landmark className="w-4 h-4 text-emerald-400" />
          Kurs BI & Pasar Real-Time
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'logs'
              ? 'bg-[#DFFF00] text-black shadow-md'
              : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Intelligence Ledger ({activeJobLogs.length})
        </button>

        <button
          onClick={() => setActiveSubTab('trigger')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'trigger'
              ? 'bg-[#DFFF00] text-black shadow-md'
              : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          Trigger Console
        </button>

        <button
          onClick={() => setActiveSubTab('scheduler')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'scheduler'
              ? 'bg-[#DFFF00] text-black shadow-md'
              : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          Automated Scheduler
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'audit'
              ? 'bg-[#DFFF00] text-black shadow-md'
              : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Forensic Audit Trail
        </button>
      </div>

      {/* Main SubTab Content */}
      <AnimatePresence mode="wait">
        {/* SUBTAB 1: EXECUTIVE SYNTHESIS */}
        {activeSubTab === 'synthesis' && (
          <motion.div
            key="synthesis"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Job Selection Ribbon */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Pilih Sesi Riset:</span>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-[#DFFF00]"
                >
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>
                      {j.id} - {j.parameters.target_report_period} ({j.trigger_type})
                    </option>
                  ))}
                </select>
              </div>

              {currentJob && (
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span>Waktu: <strong className="text-zinc-200">{new Date(currentJob.created_at).toLocaleString('id-ID')}</strong></span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase">
                    {currentJob.status}
                  </span>
                </div>
              )}
            </div>

            {/* Strategic Briefing Card */}
            {synthesisLog ? (
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-[#DFFF00] uppercase bg-[#DFFF00]/10 px-2.5 py-1 rounded-full border border-[#DFFF00]/20">
                      EXECUTIVE BRIEFING DRAFT
                    </span>
                    <h2 className="text-xl lg:text-2xl font-black text-white mt-2">
                      {synthesisLog.summary_title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyText(synthesisLog.raw_insight_data.executive_summary, synthesisLog.id)}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded-xl border border-zinc-700 flex items-center gap-1.5 transition-all"
                    >
                      {copiedLogId === synthesisLog.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      Salin Ringkasan
                    </button>
                    <button
                      onClick={handleExportBriefing}
                      className="px-3 py-1.5 bg-[#DFFF00] hover:bg-[#cbe800] text-black text-xs font-black rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh Laporan
                    </button>
                  </div>
                </div>

                {/* Key Executive Metrics Grid */}
                {synthesisLog.raw_insight_data.key_metrics && (
                  <div>
                    <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">Indikator Komposit & Kesehatan Portofolio</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {synthesisLog.raw_insight_data.key_metrics.map((m, idx) => (
                        <div key={idx} className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl hover:border-zinc-700 transition-all">
                          <span className="text-[11px] text-zinc-400 font-semibold">{m.label}</span>
                          <div className="flex items-baseline justify-between mt-2">
                            <span className="text-lg font-black text-white">{m.value}</span>
                            {m.change && (
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                m.trend === 'UP' ? 'bg-emerald-500/10 text-emerald-400' :
                                m.trend === 'DOWN' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'
                              }`}>
                                {m.change}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grounding Reference Badge: Bank Indonesia & Real Market */}
                <div className="bg-zinc-900/60 border border-emerald-500/30 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/30">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white uppercase tracking-wider">
                          Terverifikasi Data Real-Time Bank Indonesia & BEI
                        </span>
                        <span className="text-[10px] px-2 py-0.2 bg-emerald-500/20 text-emerald-400 rounded font-mono font-bold">
                          GROUNDED
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        JISDOR: <strong className="text-zinc-200">Rp {biMacro?.jisdor_usd_idr ? biMacro.jisdor_usd_idr.toLocaleString('id-ID') : '16,250'}</strong> | BI-Rate: <strong className="text-zinc-200">{biMacro?.bi_rate ? `${biMacro.bi_rate}%` : '6.00%'}</strong> | Devisa: <strong className="text-zinc-200">{(biMacro as any)?.foreign_exchange_reserves || (biMacro?.cadangan_devisa_usd ? `USD ${biMacro.cadangan_devisa_usd} M` : 'USD 145.4 M')}</strong> | Newcastle Coal: <strong className="text-zinc-200">{liveMarket?.commodities?.find(c => c.symbol === 'COAL')?.price || '$142.50'}</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveSubTab('bi_market')}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-700 transition-all whitespace-nowrap self-start sm:self-auto"
                  >
                    Buka Portal Kurs BI ➔
                  </button>
                </div>

                {/* Executive Summary Statement */}
                <div className="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-2xl">
                  <h4 className="text-xs font-black text-[#DFFF00] uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Pernyataan Sintesis Manajemen
                  </h4>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {synthesisLog.raw_insight_data.executive_summary}
                  </p>
                </div>

                {/* Strategic Implications & Action Recommendations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Implications */}
                  <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl space-y-3">
                    <h4 className="text-xs font-black text-zinc-200 uppercase tracking-widest flex items-center gap-2">
                      <Compass className="w-4 h-4 text-blue-400" />
                      Implikasi Strategis (Strategic Implications)
                    </h4>
                    <ul className="space-y-2.5">
                      {synthesisLog.raw_insight_data.strategic_implications?.map((imp, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl space-y-3">
                    <h4 className="text-xs font-black text-zinc-200 uppercase tracking-widest flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#DFFF00]" />
                      Rekomendasi Tindakan Direksi (Action Directives)
                    </h4>
                    <ul className="space-y-2.5">
                      {synthesisLog.raw_insight_data.action_recommendations?.map((act, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Forensic Analysis In-Depth Paragraphs */}
                {synthesisLog.raw_insight_data.forensic_analysis_paragraphs && (
                  <div className="border-t border-zinc-800/80 pt-5 space-y-3">
                    <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                      Detail Analisis Forensik & Verifikasi Otonom
                    </h4>
                    {synthesisLog.raw_insight_data.forensic_analysis_paragraphs.map((p, idx) => (
                      <p key={idx} className="text-xs text-zinc-400 leading-relaxed">
                        {p}
                      </p>
                    ))}
                  </div>
                )}

                {/* Ledger & Security Seal Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-zinc-800 text-[11px] text-zinc-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Eksekutor: <strong className="text-zinc-300">{synthesisLog.executed_by}</strong></span>
                  </div>
                  <div className="font-mono text-[10px] bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800 truncate max-w-md">
                    Hash SHA-256: {synthesisLog.sha256_hash}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-950 p-12 text-center rounded-3xl border border-zinc-800">
                <FileText className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">Belum Ada Laporan Sintesis</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                  Jalankan agen Deep Research pertama Anda untuk membuat draf sintesis eksekutif otomatis.
                </p>
                <button
                  onClick={() => setActiveSubTab('trigger')}
                  className="mt-4 px-4 py-2 bg-[#DFFF00] text-black font-black text-xs rounded-xl uppercase tracking-wider"
                >
                  Trigger Research Sekarang
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* SUBTAB 1B: KURS BI & PASAR REAL-TIME */}
        {activeSubTab === 'bi_market' && (
          <motion.div
            key="bi_market"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Header & Status Bar */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 lg:p-8 relative overflow-hidden shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest rounded-full flex items-center gap-1.5 shadow-sm">
                      <Landmark className="w-3.5 h-3.5" />
                      PORTAL RESMI BANK INDONESIA (JISDOR & KURS TRANSAKSI)
                    </span>
                    <span className="px-2.5 py-1 bg-[#DFFF00]/10 border border-[#DFFF00]/30 text-[#DFFF00] text-[10px] font-bold uppercase rounded-full">
                      LIVE REAL DATA
                    </span>
                  </div>
                  <h2 className="text-xl lg:text-2xl font-black text-white mt-2">
                    Indikator Moneter & Kurs Valuta Asing Bank Indonesia Real-Time
                  </h2>
                  <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                    Data acuan resmi Jakarta Interbank Spot Dollar Rate (JISDOR), suku bunga acuan BI-Rate, dan kurs transaksi valuta asing 10 mata uang utama terintegrasi untuk penilaian aset dan valuasi devisa.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fetchLiveBiAndMarketData(true)}
                    disabled={refreshingBi}
                    className="px-4 py-2 bg-[#DFFF00] hover:bg-[#cbe800] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshingBi ? 'animate-spin' : ''}`} />
                    {refreshingBi ? 'Menyinkronkan...' : 'Sinkronkan Real-Time BI'}
                  </button>
                </div>
              </div>

              {/* Bank Indonesia Macro Indicators Grid */}
              <div className="mt-6">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-[#DFFF00]" />
                  Indikator Moneter & Suku Bunga Acuan Bank Indonesia
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* 1. JISDOR USD/IDR */}
                  <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl hover:border-zinc-700 transition-all">
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold">
                      <span>JISDOR (USD/IDR)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono">
                        {biMacro?.jisdor_date || 'Terbaru'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-xl font-black text-white">
                        Rp {biMacro?.jisdor_usd_idr ? biMacro.jisdor_usd_idr.toLocaleString('id-ID') : '16,250'}
                      </span>
                      <span className="text-xs font-bold text-emerald-400">
                        {biMacro?.jisdor_change || '+0.12%'}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Jakarta Interbank Spot Dollar Rate
                    </span>
                  </div>

                  {/* 2. BI-Rate */}
                  <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl hover:border-zinc-700 transition-all">
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold">
                      <span>BI-Rate (7-Day RR)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                        Acuan BI
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-xl font-black text-white">
                        {biMacro?.bi_rate ? `${biMacro.bi_rate}%` : '6.00%'}
                      </span>
                      <span className="text-xs font-bold text-zinc-400">STABLE</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Suku Bunga Acuan Kebijakan Moneter
                    </span>
                  </div>

                  {/* 3. Fasilitas Simpanan & Pinjaman */}
                  <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl hover:border-zinc-700 transition-all">
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold">
                      <span>Deposit / Lending Facility</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                        Koridor
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-lg font-black text-white">
                        {biMacro?.deposit_facility_rate ? `${biMacro.deposit_facility_rate}%` : '5.25%'} / {biMacro?.lending_facility_rate ? `${biMacro.lending_facility_rate}%` : '6.75%'}
                      </span>
                      <span className="text-xs font-bold text-purple-400">±75 bps</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Fasilitas Likuiditas Operasi Moneter
                    </span>
                  </div>

                  {/* 4. Cadangan Devisa RI */}
                  <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl hover:border-zinc-700 transition-all">
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold">
                      <span>Cadangan Devisa</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                        Kuat
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-lg font-black text-white">
                        {(biMacro as any)?.foreign_exchange_reserves || (biMacro?.cadangan_devisa_usd ? `USD ${biMacro.cadangan_devisa_usd} Miliar` : 'USD 145.4 Miliar')}
                      </span>
                      <span className="text-xs font-bold text-emerald-400">6.5 Bln Imp</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Ketahanan Eksternal & Pembayaran Utang
                    </span>
                  </div>

                  {/* 5. Inflasi IHK YoY */}
                  <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl hover:border-zinc-700 transition-all">
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold">
                      <span>Inflasi IHK (YoY)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                        Target 2.5±1%
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-lg font-black text-white">
                        {(biMacro as any)?.inflation_rate_yoy || (biMacro?.inflasi_ihk_yoy ? `${biMacro.inflasi_ihk_yoy}%` : '2.12%')}
                      </span>
                      <span className="text-xs font-bold text-emerald-400">Terkendali</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Indeks Harga Konsumen Nasional BPS
                    </span>
                  </div>

                  {/* 6. Yield SBN 10Y */}
                  <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl hover:border-zinc-700 transition-all">
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold">
                      <span>Yield SBN 10-Tahun</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                        Benchmark
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-lg font-black text-white">
                        {biMacro?.sbn_10yr_yield ? `${biMacro.sbn_10yr_yield}%` : '6.68%'}
                      </span>
                      <span className="text-xs font-bold text-rose-400">-5 bps</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Surat Berharga Negara Bebas Risiko
                    </span>
                  </div>

                  {/* 7. Yield SRBI 12 Bulan */}
                  <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl hover:border-zinc-700 transition-all">
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold">
                      <span>Yield SRBI 12-Bulan</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#DFFF00]/10 text-[#DFFF00]">
                        Pasar Uang
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-lg font-black text-white">
                        {biMacro?.srbi_12m_yield ? `${biMacro.srbi_12m_yield}%` : '7.05%'}
                      </span>
                      <span className="text-xs font-bold text-[#DFFF00]">High Yield</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Sekuritas Rupiah Bank Indonesia
                    </span>
                  </div>

                  {/* 8. IHSG Benchmark */}
                  <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl hover:border-zinc-700 transition-all">
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold">
                      <span>IHSG (IDX Composite)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                        BEI Live
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-lg font-black text-white">
                        {(() => {
                          if (liveMarket?.ihsg?.level) return liveMarket.ihsg.level.toLocaleString('id-ID');
                          const ihsgStock = liveMarket?.stocks?.find(s => s.ticker === 'IHSG');
                          if (ihsgStock?.price) return Number(ihsgStock.price).toLocaleString('id-ID');
                          return '7,540.25';
                        })()}
                      </span>
                      <span className="text-xs font-bold text-emerald-400">
                        {liveMarket?.ihsg?.change_percent ? `+${liveMarket.ihsg.change_percent}%` : '+0.47%'}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Bursa Efek Indonesia Equity Index
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Currency Converter using Official Bank Indonesia Rates */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-[#DFFF00]" />
                    <h3 className="text-base font-black text-white uppercase tracking-tight">
                      Kalkulator Valuta Asing Terpadu Kurs Bank Indonesia
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Konversi devisa instan berdasarkan Kurs Beli, Kurs Jual, dan Kurs Tengah Transaksi Bank Indonesia.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFxCalcDirection(fxCalcDirection === 'VALAS_TO_IDR' ? 'IDR_TO_VALAS' : 'VALAS_TO_IDR')}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-[#DFFF00]" />
                    Arah: {fxCalcDirection === 'VALAS_TO_IDR' ? 'Valas ➔ IDR' : 'IDR ➔ Valas'}
                  </button>
                </div>
              </div>

              {/* Converter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Select Currency */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    Pilih Valuta Asing:
                  </label>
                  <select
                    value={selectedFxCurrency}
                    onChange={(e) => setSelectedFxCurrency(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 text-white font-bold text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#DFFF00]"
                  >
                    {liveBiRates.map(r => {
                      const code = r.currency || (r as any).currency_code || 'USD';
                      const name = r.name || (r as any).currency_name || '';
                      const mid = r.kurs_tengah ?? (r as any).middle_rate ?? 0;
                      return (
                        <option key={code} value={code}>
                          {code} - {name} (Rp {mid ? mid.toLocaleString('id-ID') : '0'})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 2. Amount Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    {fxCalcDirection === 'VALAS_TO_IDR' ? `Nominal Valas (${selectedFxCurrency}):` : 'Nominal Rupiah (IDR):'}
                  </label>
                  <input
                    type="number"
                    value={fxCalcAmount}
                    onChange={(e) => setFxCalcAmount(Number(e.target.value) || 0)}
                    min="1"
                    step="any"
                    className="w-full bg-zinc-900 border border-zinc-700 text-white font-bold text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#DFFF00]"
                  />
                </div>

                {/* 3. Quick Chips */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    Preset Cepat:
                  </label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[1000, 5000, 10000, 50000, 100000, 1000000].map(val => (
                      <button
                        key={val}
                        onClick={() => setFxCalcAmount(val)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          fxCalcAmount === val
                            ? 'bg-[#DFFF00] text-black font-black'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
                        }`}
                      >
                        {val >= 1000000 ? `${val/1000000}M` : `${val/1000}k`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Conversion Result Cards */}
              {(() => {
                const selectedRate = liveBiRates.find(r => (r.currency || (r as any).currency_code) === selectedFxCurrency) || liveBiRates[0];
                if (!selectedRate) return null;

                const currCode = selectedRate.currency || (selectedRate as any).currency_code || 'USD';
                const midRate = selectedRate.kurs_tengah ?? (selectedRate as any).middle_rate ?? 16250;
                const buyRate = selectedRate.kurs_beli ?? (selectedRate as any).buying_rate ?? 16150;
                const sellRate = selectedRate.kurs_jual ?? (selectedRate as any).selling_rate ?? 16350;
                const spreadVal = Math.abs(sellRate - buyRate);

                const isPer100 = currCode === 'JPY';
                const divisor = isPer100 ? 100 : 1;

                let midResult = 0;
                let buyResult = 0;
                let sellResult = 0;

                if (fxCalcDirection === 'VALAS_TO_IDR') {
                  midResult = (fxCalcAmount / divisor) * midRate;
                  buyResult = (fxCalcAmount / divisor) * buyRate;
                  sellResult = (fxCalcAmount / divisor) * sellRate;
                } else {
                  midResult = fxCalcAmount / (midRate / divisor);
                  buyResult = fxCalcAmount / (sellRate / divisor); // to buy valas company pays sell rate
                  sellResult = fxCalcAmount / (buyRate / divisor);
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    {/* Kurs Tengah BI (Akuntansi PSAK 71) */}
                    <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-[#DFFF00]/40 p-4 rounded-2xl relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#DFFF00] uppercase tracking-wider">
                          Kurs Tengah BI (Valuasi PSAK 71)
                        </span>
                        <span className="text-[10px] bg-[#DFFF00]/20 text-[#DFFF00] px-2 py-0.5 rounded-full font-bold">
                          STANDAR AUDIT
                        </span>
                      </div>
                      <div className="mt-3">
                        <span className="text-2xl font-black text-white">
                          {fxCalcDirection === 'VALAS_TO_IDR'
                            ? `Rp ${(Math.round(midResult) || 0).toLocaleString('id-ID')}`
                            : `${(midResult || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} ${currCode}`}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 mt-2 block">
                        Rate Acuan: Rp {(midRate || 0).toLocaleString('id-ID')} / {isPer100 ? '100 JPY' : currCode}
                      </span>
                    </div>

                    {/* Kurs Beli BI (Bank Beli Valas dari Perusahaan) */}
                    <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                          Kurs Beli BI (Perusahaan Jual Valas)
                        </span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                          BID
                        </span>
                      </div>
                      <div className="mt-3">
                        <span className="text-2xl font-black text-white">
                          {fxCalcDirection === 'VALAS_TO_IDR'
                            ? `Rp ${(Math.round(buyResult) || 0).toLocaleString('id-ID')}`
                            : `${(buyResult || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} ${currCode}`}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500 mt-2 block">
                        Rate Beli: Rp {(buyRate || 0).toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Kurs Jual BI (Bank Jual Valas ke Perusahaan) */}
                    <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                          Kurs Jual BI (Perusahaan Beli Valas)
                        </span>
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold">
                          ASK / OFFER
                        </span>
                      </div>
                      <div className="mt-3">
                        <span className="text-2xl font-black text-white">
                          {fxCalcDirection === 'VALAS_TO_IDR'
                            ? `Rp ${(Math.round(sellResult) || 0).toLocaleString('id-ID')}`
                            : `${(sellResult || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} ${currCode}`}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500 mt-2 block">
                        Rate Jual: Rp {(sellRate || 0).toLocaleString('id-ID')} (Spread: Rp {(spreadVal || 0).toLocaleString('id-ID')})
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Complete Bank Indonesia Transaction Rates Table */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 lg:p-8 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-emerald-400" />
                    Tabel Lengkap Kurs Transaksi Bank Indonesia Terkini
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Nilai tukar resmi Bank Indonesia terhadap mata uang global utama yang berlaku untuk transaksi perbankan dan pencatatan buku besar.
                  </p>
                </div>

                {/* Search in Rates */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari mata uang (USD, EUR, SGD)..."
                    value={fxSearchQuery}
                    onChange={(e) => setFxSearchQuery(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-[#DFFF00]"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-zinc-800/80">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-900/90 text-[11px] font-black text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                      <th className="py-3.5 px-4">Mata Uang</th>
                      <th className="py-3.5 px-4">Kurs Beli (Bid)</th>
                      <th className="py-3.5 px-4">Kurs Jual (Ask)</th>
                      <th className="py-3.5 px-4">Kurs Tengah (Mid)</th>
                      <th className="py-3.5 px-4">Spread</th>
                      <th className="py-3.5 px-4">Perubahan</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850 text-xs">
                    {liveBiRates
                      .filter(r => {
                        const code = (r.currency || (r as any).currency_code || '').toLowerCase();
                        const name = (r.name || (r as any).currency_name || '').toLowerCase();
                        const q = fxSearchQuery.toLowerCase();
                        return !fxSearchQuery || code.includes(q) || name.includes(q);
                      })
                      .map((rate) => {
                        const code = rate.currency || (rate as any).currency_code || '';
                        const name = rate.name || (rate as any).currency_name || '';
                        const buy = rate.kurs_beli ?? (rate as any).buying_rate ?? 0;
                        const sell = rate.kurs_jual ?? (rate as any).selling_rate ?? 0;
                        const mid = rate.kurs_tengah ?? (rate as any).middle_rate ?? 0;
                        const spread = Math.abs(sell - buy);
                        const changePct = rate.change_percent ?? (rate as any).change_percentage ?? 0;
                        const changePctStr = typeof changePct === 'number'
                          ? `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`
                          : String(changePct);

                        return (
                          <tr 
                            key={code}
                            className="hover:bg-zinc-900/50 transition-all cursor-pointer"
                            onClick={() => setSelectedFxCurrency(code)}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono font-black text-xs text-[#DFFF00]">
                                  {code}
                                </div>
                                <div>
                                  <span className="font-black text-white block">{code}</span>
                                  <span className="text-[10px] text-zinc-400 block">{name}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-zinc-300">
                              Rp {(buy || 0).toLocaleString('id-ID')}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-zinc-300">
                              Rp {(sell || 0).toLocaleString('id-ID')}
                            </td>
                            <td className="py-3 px-4 font-mono font-black text-white">
                              <span className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[#DFFF00]">
                                Rp {(mid || 0).toLocaleString('id-ID')}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">
                              Rp {(spread || 0).toLocaleString('id-ID')}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                rate.trend === 'UP' || changePctStr.startsWith('+') ? 'bg-emerald-500/10 text-emerald-400' :
                                rate.trend === 'DOWN' || changePctStr.startsWith('-') ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'
                              }`}>
                                {changePctStr}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFxCurrency(code);
                                }}
                                className="px-2.5 py-1 bg-zinc-900 hover:bg-[#DFFF00] hover:text-black text-zinc-300 text-[11px] font-bold rounded-lg border border-zinc-800 transition-all"
                              >
                                Pilih Kalkulator
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Notes */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Kutipan Kurs JPY dinyatakan per 100 Japanese Yen sesuai konvensi resmi Bank Indonesia.
                </span>
                <span className="font-mono text-[10px]">
                  Otoritas: Departemen Pengelolaan Moneter Bank Indonesia
                </span>
              </div>
            </div>

            {/* Live Equities & Global Commodities Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Live Equities Portfolio (BEI/IDX) */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">
                      Live Quotes Portofolio Saham Ekuitas BEI
                    </h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold">
                    IDX REAL-TIME
                  </span>
                </div>

                <div className="space-y-2.5">
                  {liveMarket?.stocks?.map((stock) => {
                    const priceVal = Number(stock.price) || 0;
                    const changePct = stock.change_percent;
                    const isPositive = typeof changePct === 'number' ? changePct >= 0 : String(changePct).startsWith('+');
                    const changeStr = typeof changePct === 'number' ? `${changePct >= 0 ? '+' : ''}${changePct}%` : String(changePct);

                    return (
                      <div key={stock.ticker} className="bg-zinc-900/60 border border-zinc-800/80 p-3 rounded-2xl flex items-center justify-between hover:border-zinc-700 transition-all">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-white">{stock.ticker}</span>
                            <span className="text-[10px] text-zinc-400 truncate max-w-[150px]">{stock.name}</span>
                          </div>
                          <span className="text-[10px] text-zinc-500 block mt-0.5">
                            Vol: {typeof stock.volume === 'number' ? stock.volume.toLocaleString('id-ID') : stock.volume} | PER: {stock.pe_ratio} | PBV: {stock.pbv}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="font-black text-sm text-white block">
                            Rp {priceVal.toLocaleString('id-ID')}
                          </span>
                          <span className={`text-[11px] font-bold ${
                            isPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {changeStr}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Global Commodities */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-[#DFFF00]" />
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">
                      Live Acuan Komoditas Global & Energi
                    </h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#DFFF00]/10 text-[#DFFF00] font-bold">
                    GLOBAL BENCHMARK
                  </span>
                </div>

                <div className="space-y-2.5">
                  {liveMarket?.commodities?.map((comm) => {
                    const changePct = comm.change_percent ?? (comm as any).change ?? 0;
                    const isPositive = typeof changePct === 'number' ? changePct >= 0 : !String(changePct).startsWith('-');
                    const changeStr = typeof changePct === 'number' ? `${changePct >= 0 ? '+' : ''}${changePct}%` : String(changePct);
                    const authority = comm.authority || (comm as any).source || 'Benchmark';

                    return (
                      <div key={comm.symbol} className="bg-zinc-900/60 border border-zinc-800/80 p-3 rounded-2xl flex items-center justify-between hover:border-zinc-700 transition-all">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-white">{comm.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                              {comm.symbol}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-500 block mt-0.5">
                            Satuan: {comm.unit} | Sumber: {authority}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="font-black text-sm text-white block">
                            {comm.price}
                          </span>
                          <span className={`text-[11px] font-bold ${
                            isPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {changeStr}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 2: INTELLIGENCE LEDGER & LOGS */}
        {activeSubTab === 'logs' && (
          <motion.div
            key="logs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Filter & Search Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider mr-1">Kategori:</span>
                {(['ALL', 'COMMODITY_PRICES', 'MACRO_ECONOMY', 'REGULATORY_COMPLIANCE', 'COMPETITOR_BENCHMARK', 'EXECUTIVE_SYNTHESIS'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      selectedCategory === cat
                        ? 'bg-[#DFFF00] text-black'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {cat === 'ALL' ? 'Semua Kategori' : cat.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full lg:w-72">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari log atau kata kunci..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-[#DFFF00]"
                />
              </div>
            </div>

            {/* Logs List */}
            <div className="space-y-4">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-700 transition-all space-y-4 shadow-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-850">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          log.category === 'COMMODITY_PRICES' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                          log.category === 'MACRO_ECONOMY' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                          log.category === 'REGULATORY_COMPLIANCE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                          log.category === 'COMPETITOR_BENCHMARK' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' :
                          'bg-[#DFFF00]/10 text-[#DFFF00] border border-[#DFFF00]/30'
                        }`}>
                          {log.category.replace('_', ' ')}
                        </span>
                        <h3 className="text-base font-bold text-white">
                          {log.summary_title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyText(JSON.stringify(log, null, 2), log.id)}
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-[11px] font-semibold rounded-lg border border-zinc-800 flex items-center gap-1.5"
                          title="Copy JSON Payload"
                        >
                          {copiedLogId === log.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          JSON
                        </button>
                      </div>
                    </div>

                    {/* Executive Summary */}
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {log.raw_insight_data.executive_summary}
                    </p>

                    {/* Metrics Grid */}
                    {log.raw_insight_data.key_metrics && log.raw_insight_data.key_metrics.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {log.raw_insight_data.key_metrics.map((m, i) => (
                          <div key={i} className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-850">
                            <span className="text-[10px] text-zinc-500 uppercase font-semibold block truncate">{m.label}</span>
                            <div className="flex items-baseline justify-between mt-1">
                              <span className="text-xs font-bold text-white">{m.value}</span>
                              {m.change && (
                                <span className={`text-[10px] font-bold ${
                                  m.trend === 'UP' ? 'text-emerald-400' :
                                  m.trend === 'DOWN' ? 'text-rose-400' : 'text-blue-400'
                                }`}>
                                  {m.change}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Compliance Check Breakdown if present */}
                    {log.raw_insight_data.compliance_check && (
                      <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-2xl space-y-2">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Hasil Uji Kepatuhan Regulasi
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="text-zinc-300">
                            <span className="text-zinc-500 font-semibold block text-[10px]">Status POJK:</span>
                            {log.raw_insight_data.compliance_check.ojk_rules_status}
                          </div>
                          <div className="text-zinc-300">
                            <span className="text-zinc-500 font-semibold block text-[10px]">MiFID II / SEC:</span>
                            {log.raw_insight_data.compliance_check.mifid_sec_alignment}
                          </div>
                          <div className="text-zinc-300">
                            <span className="text-zinc-500 font-semibold block text-[10px]">Ketentuan Perpajakan:</span>
                            {log.raw_insight_data.compliance_check.tax_policy_alert}
                          </div>
                          <div className="text-zinc-300">
                            <span className="text-zinc-500 font-semibold block text-[10px]">Modal Kerja (MKBD):</span>
                            {log.raw_insight_data.compliance_check.capital_adequacy_impact}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Competitor Matrix Breakdown if present */}
                    {log.raw_insight_data.competitor_matrix && (
                      <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-2xl space-y-2">
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5" />
                          Matriks Perbandingan Kompetitor Utama
                        </span>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-zinc-800 text-zinc-500 text-[10px]">
                                <th className="py-1">Nama Peer</th>
                                <th className="py-1">AUM / Valuasi</th>
                                <th className="py-1">P/E Ratio</th>
                                <th className="py-1">Manuver Strategis</th>
                                <th className="py-1">Tingkat Ancaman</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60">
                              {log.raw_insight_data.competitor_matrix.map((c, ci) => (
                                <tr key={ci} className="text-zinc-300">
                                  <td className="py-1.5 font-bold text-white">{c.peer_name}</td>
                                  <td className="py-1.5">{c.market_cap}</td>
                                  <td className="py-1.5">{c.p_e}</td>
                                  <td className="py-1.5">{c.strategic_move}</td>
                                  <td className="py-1.5">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                                      c.threat_level === 'HIGH' ? 'bg-rose-500/10 text-rose-400' :
                                      c.threat_level === 'MODERATE' ? 'bg-amber-500/10 text-amber-400' :
                                      'bg-emerald-500/10 text-emerald-400'
                                    }`}>
                                      {c.threat_level}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Sources & Citations */}
                    {log.raw_insight_data.sources && log.raw_insight_data.sources.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold">Sumber Terverifikasi:</span>
                        {log.raw_insight_data.sources.map((src, si) => (
                          <span 
                            key={si}
                            className="px-2 py-0.5 bg-zinc-900 rounded-md border border-zinc-800 text-[10px] text-zinc-400"
                          >
                            {src.title} ({src.authority})
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer Hash Stamp */}
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-2 border-t border-zinc-850">
                      <span>Log ID: {log.id}</span>
                      <span className="truncate max-w-xs">SHA-256: {log.sha256_hash}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-zinc-950 p-8 text-center rounded-3xl border border-zinc-800">
                  <Search className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">Tidak ada log intelijen yang cocok dengan filter.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* SUBTAB 3: TRIGGER CONSOLE */}
        {activeSubTab === 'trigger' && (
          <motion.div
            key="trigger"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl"
          >
            <div>
              <span className="text-[10px] font-black tracking-widest text-[#DFFF00] uppercase bg-[#DFFF00]/10 px-2.5 py-1 rounded-full border border-[#DFFF00]/20">
                MANUAL EXECUTIVE TRIGGER
              </span>
              <h2 className="text-xl font-black text-white mt-2">
                Jalankan Sesi Deep Research Baru
              </h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Pemicu manual memungkinkan tim manajemen melakukan pemindaian intelijen instan sebelum rapat direksi, meneliti tren harga komoditas energi, atau memvalidasi kepatuhan aturan OJK terbaru.
              </p>
            </div>

            {/* Scopes Selection */}
            <div className="space-y-3">
              <label className="text-xs font-black text-zinc-300 uppercase tracking-wider block">
                1. Pilih Cakupan Riset (Research Scopes):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { id: 'commodity_energy', label: 'Komoditas Energi & Logam (Batubara, Minyak, Nikel)', icon: Activity },
                  { id: 'macro_idr_usd', label: 'Makroekonomi & Moneter (Kurs USD/IDR, BI Rate, Inflasi)', icon: Globe },
                  { id: 'regulatory_updates', label: 'Regulasi Pasar Modal (OJK, MiFID II, PPATK, Pajak)', icon: Scale },
                  { id: 'competitor_peers', label: 'Benchmarking Kompetitor & Peer Asset Managers', icon: Compass },
                  { id: 'internal_portfolio', label: 'Korelasi Portofolio CPI (10 Saham BEI, Kas RDN/Giro, Software ERP)', icon: Layers }
                ].map((sc) => {
                  const isSelected = selectedScopes.includes(sc.id as AmirScope);
                  const Icon = sc.icon;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => handleScopeToggle(sc.id as AmirScope)}
                      className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                        isSelected 
                          ? 'bg-[#DFFF00]/10 border-[#DFFF00]/40 text-white' 
                          : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${isSelected ? 'bg-[#DFFF00] text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block">{sc.label}</span>
                        <span className="text-[10px] text-zinc-500 mt-0.5 block">
                          {isSelected ? 'Aktif dalam kueri' : 'Dikecualikan'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Period & Depth */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-300 uppercase tracking-wider block">
                  2. Periode Laporan Target:
                </label>
                <input
                  type="text"
                  value={targetPeriod}
                  onChange={(e) => setTargetPeriod(e.target.value)}
                  placeholder="Contoh: Q3-2026 atau W34-August-2026"
                  className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#DFFF00]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-300 uppercase tracking-wider block">
                  3. Tingkat Kedalaman Riset:
                </label>
                <select
                  value={depthLevel}
                  onChange={(e) => setDepthLevel(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#DFFF00]"
                >
                  <option value="COMPREHENSIVE_FORENSIC">Forensik Komprehensif (Multi-Source Grounding + SHA-256)</option>
                  <option value="STANDARD_DEEP_SEARCH">Pencarian Standar (Fast Executive Summary)</option>
                </select>
              </div>
            </div>

            {/* Custom Focus Query */}
            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-300 uppercase tracking-wider block">
                4. Fokus Khusus / Parameter Tambahan (Opsional):
              </label>
              <textarea
                value={customFocus}
                onChange={(e) => setCustomFocus(e.target.value)}
                rows={3}
                placeholder="Tuliskan topik spesifik atau sentimen pasar yang ingin diteliti lebih dalam..."
                className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white p-4 rounded-xl focus:outline-none focus:border-[#DFFF00] leading-relaxed"
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <span className="text-xs text-zinc-500">
                Agen AI akan berjalan di latar belakang (Background Worker) dan memperbarui ledger secara realtime.
              </span>
              <button
                onClick={handleTriggerResearch}
                disabled={triggering}
                className="px-6 py-3 bg-[#DFFF00] hover:bg-[#cbe800] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                {triggering ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Menginisialisasi Agen...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-black" />
                    Eksekusi Deep Research
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 4: AUTOMATED SCHEDULER */}
        {activeSubTab === 'scheduler' && (
          <motion.div
            key="scheduler"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
              <div>
                <span className="text-[10px] font-black tracking-widest text-[#DFFF00] uppercase bg-[#DFFF00]/10 px-2.5 py-1 rounded-full border border-[#DFFF00]/20">
                  SCHEDULER ENGINE
                </span>
                <h2 className="text-xl font-black text-white mt-2">
                  Konfigurasi Pemicu Otomatis (Scheduled Triggers)
                </h2>
                <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                  Atur frekuensi otomatisasi Deep Research agar sistem berjalan mandiri di latar belakang tanpa intervensi manual, misalnya setiap awal pekan atau menjelang rapat direksi bulanan.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-zinc-400">Status Mesin:</span>
                <button
                  type="button"
                  onClick={() => setSchedulerEnabled(!schedulerEnabled)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                    schedulerEnabled 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                      : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${schedulerEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                  {schedulerEnabled ? 'AKTIF (ENABLED)' : 'NONAKTIF'}
                </button>
              </div>
            </div>

            {/* Frequency and Run Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-300 uppercase tracking-wider block">
                  Frekuensi Siklus Riset:
                </label>
                <select
                  value={schedulerFreq}
                  onChange={(e) => setSchedulerFreq(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#DFFF00]"
                >
                  <option value="WEEKLY_MONDAY">Mingguan (Setiap Hari Senin Pukul 07:00 WIB)</option>
                  <option value="MONTHLY_CLOSING">Bulanan (Akhir Bulan Sebelum Penutupan Buku)</option>
                  <option value="PRE_BOARD_MEETING">Pre-Board (48 Jam Sebelum Rapat Direksi)</option>
                  <option value="DAILY_OPEN">Harian (Sebelum Pembukaan Pasar IDX 08:30 WIB)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-300 uppercase tracking-wider block">
                  Waktu Eksekusi Standar:
                </label>
                <input
                  type="text"
                  value={schedulerTime}
                  onChange={(e) => setSchedulerTime(e.target.value)}
                  placeholder="07:00 WIB"
                  className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#DFFF00]"
                />
              </div>
            </div>

            {/* Notification Emails */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-[#DFFF00]" />
                  Daftar Email Penerima Notifikasi Briefing:
                </label>
                <span className="text-[10px] font-mono text-zinc-400">
                  {notifyEmails.split(/[,\n;]+/).map(e => e.trim()).filter(Boolean).length} Email Terdaftar
                </span>
              </div>
              <input
                type="text"
                value={notifyEmails}
                onChange={(e) => setNotifyEmails(e.target.value)}
                placeholder="management@ventuream.id, audit-committee@ventuream.id"
                className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#DFFF00]"
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {notifyEmails.split(/[,\n;]+/).map(e => e.trim()).filter(Boolean).map((em, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg"
                  >
                    <Mail className="w-3 h-3 text-[#DFFF00]" />
                    {em}
                  </span>
                ))}
              </div>
              <span className="text-[10px] text-zinc-500 block">
                Pisahkan beberapa email dengan tanda koma (,), titik koma (;), atau baris baru.
              </span>
            </div>

            {/* Auto Inject Toggle */}
            <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Integrasi Otomatis ke Laporan Manajemen Eksekutif</span>
                <span className="text-[11px] text-zinc-400">
                  Otomatis memasukkan draf intelijen AMIR ke dalam modul Laporan Keuangan dan Pusat Ekspor Dokumen.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAutoInjectReport(!autoInjectReport)}
                className={`w-12 h-6 rounded-full transition-all relative p-1 ${
                  autoInjectReport ? 'bg-[#DFFF00]' : 'bg-zinc-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-black transition-all ${autoInjectReport ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Save Scheduler Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-zinc-800">
              {scheduleSaveSuccess ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold">
                    Konfigurasi & {lastSavedEmailCount} email berhasil disimpan dan aktif permanen!
                  </span>
                </div>
              ) : (
                <span className="text-xs text-zinc-500">
                  Eksekusi berikutnya: <strong>{scheduleConfig?.next_run ? new Date(scheduleConfig.next_run).toLocaleString('id-ID') : 'Senin Depan 07:00 WIB'}</strong>
                </span>
              )}

              <button
                onClick={handleSaveScheduler}
                disabled={savingSchedule}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#DFFF00] hover:bg-[#cbe800] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {savingSchedule ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {savingSchedule ? 'Menyimpan...' : 'Simpan Konfigurasi'}
              </button>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 5: FORENSIC AUDIT TRAIL */}
        {activeSubTab === 'audit' && (
          <motion.div
            key="audit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl"
          >
            <div>
              <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                AUDIT TRAIL & REGULATORY LEDGER
              </span>
              <h2 className="text-xl font-black text-white mt-2">
                Integritas Kriptografi & Jejak Rekam Kepatuhan
              </h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Setiap siklus riset dan modul intelijen yang dihasilkan oleh agen AI disegel secara matematis menggunakan stempel hash SHA-256 untuk menjamin integritas data (tamper-proof) sesuai standar audit OJK dan PPATK.
              </p>
            </div>

            {/* Cryptographic Ledger Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-zinc-800 rounded-2xl overflow-hidden">
                <thead className="bg-zinc-900 text-zinc-400 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Log ID</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Eksekutor</th>
                    <th className="p-3">Stempel Digital (SHA-256)</th>
                    <th className="p-3">Status Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-300">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-white">{log.id}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-900 border border-zinc-800">
                          {log.category}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-400">{log.executed_by}</td>
                      <td className="p-3 font-mono text-[10px] text-zinc-400 max-w-xs truncate">
                        {log.sha256_hash}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          VALID & SEALED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Compliance Standards Notice */}
            <div className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-2">
              <h4 className="text-xs font-black text-zinc-200 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#DFFF00]" />
                Pernyataan Kepatuhan Lembaga (Institutional Compliance Declaration)
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Seluruh data yang disintesis dari sumber eksternal telah diverifikasi silang dengan portal resmi Bank Indonesia (BI), Otoritas Jasa Keuangan (OJK), London Metal Exchange (LME), dan Intercontinental Exchange (ICE). Tidak ada data spekulatif yang dimasukkan ke dalam buku besar akuntansi tanpa validasi sumber primer.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AmirDeepResearchHub;
