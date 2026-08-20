import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  GeneratedReport, 
  reportNotificationService, 
  triggerReportToast,
  saveAndNotifyPdf,
  saveAndNotifyExcel,
  saveAndNotifyCsv
} from '../services/reportNotificationService';
import { ReportToastContainer } from '../components/ReportToastNotification';
import { ReportFileViewerModal } from '../components/ReportFileViewerModal';

interface ReportToastContextType {
  activeReports: GeneratedReport[];
  viewingReport: GeneratedReport | null;
  dismissToast: (id: string) => void;
  openViewer: (report: GeneratedReport) => void;
  closeViewer: () => void;
  notifyReport: typeof triggerReportToast;
}

const ReportToastContext = createContext<ReportToastContextType | undefined>(undefined);

export const ReportToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeReports, setActiveReports] = useState<GeneratedReport[]>([]);
  const [viewingReport, setViewingReport] = useState<GeneratedReport | null>(null);

  // Subscribe to singleton report notification manager
  useEffect(() => {
    const unsubscribe = reportNotificationService.subscribe((newReport) => {
      setActiveReports((prev) => {
        // Keep up to 4 concurrent toasts to avoid screen clutter
        const filtered = prev.filter((r) => r.id !== newReport.id);
        return [newReport, ...filtered].slice(0, 4);
      });
    });

    // Also listen to window custom event if dispatched externally
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<GeneratedReport>;
      if (customEvent.detail) {
        setActiveReports((prev) => {
          const filtered = prev.filter((r) => r.id !== customEvent.detail.id);
          return [customEvent.detail, ...filtered].slice(0, 4);
        });
      }
    };

    window.addEventListener('vam-report-generated', handleCustomEvent);

    return () => {
      unsubscribe();
      window.removeEventListener('vam-report-generated', handleCustomEvent);
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    setActiveReports((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const openViewer = useCallback((report: GeneratedReport) => {
    setViewingReport(report);
  }, []);

  const closeViewer = useCallback(() => {
    setViewingReport(null);
  }, []);

  return (
    <ReportToastContext.Provider
      value={{
        activeReports,
        viewingReport,
        dismissToast,
        openViewer,
        closeViewer,
        notifyReport: triggerReportToast
      }}
    >
      {children}

      {/* Floating Toast Notification Stack */}
      <ReportToastContainer
        reports={activeReports}
        onDismiss={dismissToast}
        onView={openViewer}
      />

      {/* Immediate File Viewer Modal */}
      <ReportFileViewerModal
        isOpen={viewingReport !== null}
        report={viewingReport}
        onClose={closeViewer}
      />
    </ReportToastContext.Provider>
  );
};

export const useReportToast = (): ReportToastContextType => {
  const context = useContext(ReportToastContext);
  if (!context) {
    throw new Error('useReportToast must be used within a ReportToastProvider');
  }
  return context;
};

export { saveAndNotifyPdf, saveAndNotifyExcel, saveAndNotifyCsv };
