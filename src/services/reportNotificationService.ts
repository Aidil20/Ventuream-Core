import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export type ReportFileType = 'pdf' | 'excel' | 'csv' | 'pptx' | 'json';

export interface GeneratedReport {
  id: string;
  title: string;
  fileName: string;
  fileType: ReportFileType;
  blob?: Blob;
  url?: string;
  sizeBytes?: number;
  formattedSize?: string;
  timestamp: string;
  sheetData?: (string | number)[][];
  workbook?: XLSX.WorkBook;
  metadata?: Record<string, any>;
}

type ReportListener = (report: GeneratedReport) => void;

class ReportNotificationManager {
  private listeners: Set<ReportListener> = new Set();
  private recentReports: GeneratedReport[] = [];

  public subscribe(listener: ReportListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public notify(reportData: Omit<GeneratedReport, 'id' | 'timestamp' | 'formattedSize'>): GeneratedReport {
    const id = `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const formattedSize = reportData.sizeBytes 
      ? formatBytes(reportData.sizeBytes) 
      : reportData.blob 
      ? formatBytes(reportData.blob.size) 
      : undefined;

    const fullReport: GeneratedReport = {
      ...reportData,
      id,
      timestamp,
      formattedSize: formattedSize || 'Siap Diunduh'
    };

    // Keep last 10 in memory
    this.recentReports.unshift(fullReport);
    if (this.recentReports.length > 10) {
      this.recentReports.pop();
    }

    // Broadcast to listeners
    this.listeners.forEach((listener) => {
      try {
        listener(fullReport);
      } catch (e) {
        console.error('Error dispatching report notification:', e);
      }
    });

    // Also dispatch a browser custom event for maximum compatibility
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('vam-report-generated', { detail: fullReport });
      window.dispatchEvent(event);
    }

    return fullReport;
  }

  public getRecentReports(): GeneratedReport[] {
    return [...this.recentReports];
  }
}

export const reportNotificationService = new ReportNotificationManager();

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Universal helper to save and notify a jsPDF document
 */
export function saveAndNotifyPdf(
  doc: jsPDF, 
  fileName: string, 
  title?: string, 
  metadata?: Record<string, any>
): GeneratedReport {
  const cleanFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);

  // Trigger browser download
  doc.save(cleanFileName);

  // Trigger toast notification with immediate view capability
  return reportNotificationService.notify({
    title: title || cleanFileName.replace(/\.pdf$/i, '').replace(/_/g, ' '),
    fileName: cleanFileName,
    fileType: 'pdf',
    blob,
    url,
    sizeBytes: blob.size,
    metadata
  });
}

/**
 * Universal helper to save and notify an Excel (XLSX) workbook
 */
export function saveAndNotifyExcel(
  workbook: XLSX.WorkBook,
  fileName: string,
  title?: string,
  sheetData?: (string | number)[][],
  metadata?: Record<string, any>
): GeneratedReport {
  const cleanFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  
  // Create binary array buffer for Blob
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = URL.createObjectURL(blob);

  // Trigger browser download
  XLSX.writeFile(workbook, cleanFileName);

  // Extract primary sheet data if not provided
  let extractedSheetData = sheetData;
  if (!extractedSheetData && workbook.SheetNames.length > 0) {
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    if (worksheet) {
      extractedSheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number)[][];
    }
  }

  // Trigger toast notification with immediate view capability
  return reportNotificationService.notify({
    title: title || cleanFileName.replace(/\.xlsx$/i, '').replace(/_/g, ' '),
    fileName: cleanFileName,
    fileType: 'excel',
    blob,
    url,
    sizeBytes: blob.size,
    sheetData: extractedSheetData,
    workbook,
    metadata
  });
}

/**
 * Universal helper to save and notify a CSV file
 */
export function saveAndNotifyCsv(
  csvContent: string,
  fileName: string,
  title?: string,
  sheetData?: (string | number)[][],
  metadata?: Record<string, any>
): GeneratedReport {
  const cleanFileName = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
  const formattedContent = csvContent.startsWith('\uFEFF') ? csvContent : '\uFEFF' + csvContent;
  const blob = new Blob([formattedContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  // Trigger download
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', cleanFileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return reportNotificationService.notify({
    title: title || cleanFileName.replace(/\.csv$/i, '').replace(/_/g, ' '),
    fileName: cleanFileName,
    fileType: 'csv',
    blob,
    url,
    sizeBytes: blob.size,
    sheetData,
    metadata
  });
}

/**
 * Direct notification trigger for any existing export
 */
export function triggerReportToast(params: {
  title: string;
  fileName: string;
  fileType: ReportFileType;
  blob?: Blob;
  url?: string;
  sizeBytes?: number;
  sheetData?: (string | number)[][];
  workbook?: XLSX.WorkBook;
  metadata?: Record<string, any>;
}): GeneratedReport {
  return reportNotificationService.notify(params);
}
