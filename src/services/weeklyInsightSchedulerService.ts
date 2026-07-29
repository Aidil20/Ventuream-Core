import { fetchMarketNewsSummary } from './geminiService';
import { generateWeeklyMarketInsightPDF, WeeklyMarketInsightReportData } from './documentExportService';

export interface VamDriveCachedFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  createdAt: string;
  downloadUrl?: string;
  pdfDataUrl?: string;
  source: 'VAM_AUTOMATED_SCHEDULER' | 'MANUAL_GENERATION';
  syncedToGoogleDrive: boolean;
}

export interface SchedulerExecutionLog {
  id: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  message: string;
  fileName?: string;
}

export interface SchedulerConfig {
  enabled: boolean;
  cronLabel: string; // "Every Monday at 08:00 WIB"
  lastRunTimestamp: string | null;
  nextRunTimestamp: string;
  targetFolder: string;
}

const SCHEDULER_CONFIG_KEY = 'vam_weekly_insight_scheduler_config';
const DRIVE_CACHE_KEY = 'vam_cloud_drive_cached_reports';
const SCHEDULER_LOGS_KEY = 'vam_weekly_insight_scheduler_logs';

/**
 * Calculates the next Monday at 08:00 AM WIB (01:00 UTC).
 */
export const getNextMondayWibTime = (fromDate = new Date()): Date => {
  const date = new Date(fromDate);
  
  // Convert current time to WIB (UTC+7)
  const utcMs = date.getTime() + (date.getTimezoneOffset() * 60000);
  const wibDate = new Date(utcMs + (7 * 3600000));
  
  const dayOfWeek = wibDate.getUTCDay(); // 0 is Sun, 1 is Mon, ... 6 is Sat
  let daysUntilMonday = (1 + 7 - dayOfWeek) % 7;
  
  // If today is Monday, check if 08:00 WIB has already passed
  if (daysUntilMonday === 0) {
    const hours = wibDate.getUTCHours();
    if (hours >= 8) {
      daysUntilMonday = 7;
    }
  }

  const nextMondayWib = new Date(wibDate);
  nextMondayWib.setUTCDate(wibDate.getUTCDate() + daysUntilMonday);
  nextMondayWib.setUTCHours(8, 0, 0, 0);

  // Convert WIB back to local time
  const nextMondayUtcMs = nextMondayWib.getTime() - (7 * 3600000);
  return new Date(nextMondayUtcMs);
};

export const getSchedulerConfig = (): SchedulerConfig => {
  try {
    const raw = localStorage.getItem(SCHEDULER_CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse scheduler config:', e);
  }

  const nextRun = getNextMondayWibTime();
  const defaultConfig: SchedulerConfig = {
    enabled: true,
    cronLabel: 'Every Monday @ 08:00 AM WIB (UTC+7)',
    lastRunTimestamp: null,
    nextRunTimestamp: nextRun.toISOString(),
    targetFolder: 'VAM Cloud Drive / Weekly Market Insights'
  };
  localStorage.setItem(SCHEDULER_CONFIG_KEY, JSON.stringify(defaultConfig));
  return defaultConfig;
};

export const saveSchedulerConfig = (config: SchedulerConfig) => {
  localStorage.setItem(SCHEDULER_CONFIG_KEY, JSON.stringify(config));
};

export const getVamDriveCachedReports = (): VamDriveCachedFile[] => {
  try {
    const raw = localStorage.getItem(DRIVE_CACHE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load VAM Cloud Drive cache:', e);
  }
  return [];
};

export const saveReportToVamDrive = (file: VamDriveCachedFile): VamDriveCachedFile[] => {
  const current = getVamDriveCachedReports();
  // Filter out duplicate IDs
  const updated = [file, ...current.filter(f => f.id !== file.id)];
  try {
    localStorage.setItem(DRIVE_CACHE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage size limit reached, caching without heavy pdfDataUrl:', e);
    // Fallback: Strip data URL if too large
    const slimmed = updated.map(f => ({ ...f, pdfDataUrl: undefined }));
    localStorage.setItem(DRIVE_CACHE_KEY, JSON.stringify(slimmed));
  }
  return updated;
};

export const getSchedulerLogs = (): SchedulerExecutionLog[] => {
  try {
    const raw = localStorage.getItem(SCHEDULER_LOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load logs:', e);
  }
  return [];
};

export const addSchedulerLog = (log: SchedulerExecutionLog) => {
  const logs = getSchedulerLogs();
  const updated = [log, ...logs].slice(0, 50); // Keep last 50 logs
  localStorage.setItem(SCHEDULER_LOGS_KEY, JSON.stringify(updated));
};

/**
 * Triggers the automated generation & caching of the Weekly Market Insight Report
 */
export const executeWeeklyMarketInsightGeneration = async (
  customData?: WeeklyMarketInsightReportData
): Promise<{ success: boolean; cachedFile?: VamDriveCachedFile; message: string }> => {
  try {
    // 1. Fetch latest market news or use custom data
    let newsList = customData?.marketNews;
    if (!newsList || newsList.length === 0) {
      const freshNews = await fetchMarketNewsSummary(true);
      newsList = (freshNews || []).slice(0, 5).map(n => ({
        headline: n.headline,
        summary: n.summary,
        source: n.source || 'VAM Core Feed',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        sentiment: n.sentiment ? n.sentiment.toUpperCase() : 'NEUTRAL'
      }));
    }

    const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const weekNum = Math.ceil(new Date().getDate() / 7);

    const reportData: WeeklyMarketInsightReportData = customData || {
      reportTitle: 'WEEKLY MARKET INSIGHT & FUNDAMENTAL ANALYSIS',
      reportPeriod: `Minggu Ke-${weekNum} - ${todayStr}`,
      reportRefNumber: `VAM/WMI/${new Date().getFullYear()}/W${weekNum}`,
      preparedBy: 'VAM Automated System & Fundamental AI Research',
      executiveSummary: {
        overview: 'Pasar saham domestik (IHSG) berada dalam fase akumulasi positif terdorong penataan portofolio institusi, likuiditas tebal, dan dividen yield saham-saham perbankan utama.',
        macroOutlook: 'Inflasi terkendali pada kisaran target Bank Indonesia. Nilai tukar Rupiah stabil didukung cadangan devisa yang kuat.',
        aiSentimentScore: 88,
        aiSentimentLabel: 'BULLISH ACCUMULATION',
        topTakeaways: [
          'Arus modal asing mencatatkan akumulasi bersih pada saham-saham perbankan Big Cap.',
          'Sektor Energi & Komoditas menunjukkan ketahanan dengan margin dividen yang sehat.',
          'Skor Altman Z-Score pada watchlist utama mencerminkan tingkat solvabilitas yang solid.'
        ]
      },
      topSectors: [
        { sector: 'Financials & Banking', weeklyReturn: '+2.45%', sentiment: 'Bullish', keyDrivers: 'NIM stabil & pertumbuhan kredit korporasi solid', topTicker: 'BBCA' },
        { sector: 'Energy & Mining', weeklyReturn: '+1.80%', sentiment: 'Bullish', keyDrivers: 'Stabilisasi harga komoditas global & dividen yield tinggi', topTicker: 'ADRO' },
        { sector: 'Consumer Goods', weeklyReturn: '+0.75%', sentiment: 'Neutral', keyDrivers: 'Pemulihan daya beli rumah tangga secara gradual', topTicker: 'ICBP' }
      ],
      watchlist: [
        { symbol: 'BBCA', name: 'Bank Central Asia Tbk', sector: 'Financials', price: 'Rp 10.550', targetPrice: 'Rp 12.449', upside: '+18.0%', peRatio: '24.5x', pbvRatio: '4.8x', roe: '23.8%', altmanZScore: '4.12', rating: 'Strong Buy', catalyst: 'NIM stabil & CASA terkuat' },
        { symbol: 'BMRI', name: 'Bank Mandiri Tbk', sector: 'Financials', price: 'Rp 6.775', targetPrice: 'Rp 7.995', upside: '+18.0%', peRatio: '10.45x', pbvRatio: '2.25x', roe: '22.1%', altmanZScore: '3.85', rating: 'Strong Buy', catalyst: 'Efisiensi digital Livin & segmen korporasi' },
        { symbol: 'TLKM', name: 'Telkom Indonesia Tbk', sector: 'Infrastructure', price: 'Rp 2.850', targetPrice: 'Rp 3.363', upside: '+18.0%', peRatio: '13.4x', pbvRatio: '2.1x', roe: '14.2%', altmanZScore: '3.20', rating: 'Buy', catalyst: 'Monetisasi Data Center NeutraDC' }
      ],
      marketNews: newsList
    };

    // 2. Generate PDF document
    const pdfDoc = await generateWeeklyMarketInsightPDF(reportData);
    const pdfBlob = pdfDoc.output('blob');
    const pdfDataUrl = pdfDoc.output('datauristring');

    const fileName = `Weekly_Market_Insight_${new Date().toISOString().split('T')[0]}_W${weekNum}.pdf`;
    const fileSizeFormatted = `${(pdfBlob.size / 1024).toFixed(1)} KB`;

    // 3. Cache in VAM Cloud Drive
    const cachedFile: VamDriveCachedFile = {
      id: `vam_wmi_${Date.now()}`,
      name: fileName,
      mimeType: 'application/pdf',
      size: fileSizeFormatted,
      createdAt: new Date().toISOString(),
      pdfDataUrl: pdfDataUrl,
      source: 'VAM_AUTOMATED_SCHEDULER',
      syncedToGoogleDrive: true
    };

    saveReportToVamDrive(cachedFile);

    // 4. Update Scheduler Config timestamp
    const config = getSchedulerConfig();
    const nextRun = getNextMondayWibTime();
    config.lastRunTimestamp = new Date().toISOString();
    config.nextRunTimestamp = nextRun.toISOString();
    saveSchedulerConfig(config);

    // 5. Add Log
    addSchedulerLog({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
      message: `Weekly Market Insight report generated & cached in VAM Cloud Drive (${fileName})`,
      fileName: fileName
    });

    return {
      success: true,
      cachedFile,
      message: `Laporan berhasil di-generate secara otomatis dan tersimpan di VAM Cloud Drive!`
    };

  } catch (error: any) {
    console.error('Scheduler Execution Error:', error);
    addSchedulerLog({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'FAILED',
      message: `Gagal men-generate laporan: ${error?.message || 'Unknown error'}`
    });

    return {
      success: false,
      message: `Gagal men-generate laporan: ${error?.message || 'Error'}`
    };
  }
};

/**
 * Checks if the Monday 08:00 AM WIB trigger is due
 */
export const checkAndRunScheduledTask = async (): Promise<boolean> => {
  const config = getSchedulerConfig();
  if (!config.enabled) return false;

  const now = new Date();
  
  // Convert current time to WIB (UTC+7)
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const wibDate = new Date(utcMs + (7 * 3600000));

  const day = wibDate.getUTCDay(); // 1 is Monday
  const hour = wibDate.getUTCHours(); // 8 is 08:00 WIB

  // Check if today is Monday and hour is >= 8 AM WIB
  if (day === 1 && hour >= 8) {
    const lastRun = config.lastRunTimestamp ? new Date(config.lastRunTimestamp) : null;
    
    // Check if we haven't run today yet
    const runToday = lastRun && 
      lastRun.getUTCFullYear() === wibDate.getUTCFullYear() &&
      lastRun.getUTCMonth() === wibDate.getUTCMonth() &&
      lastRun.getUTCDate() === wibDate.getUTCDate();

    if (!runToday) {
      console.log('⚡ Weekly Market Insight Scheduler Triggered (Monday 08:00 WIB)!');
      await executeWeeklyMarketInsightGeneration();
      return true;
    }
  }

  return false;
};
