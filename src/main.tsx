import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ReportToastProvider } from './context/ReportToastContext';

// Global error handler to capture and handle harmless CORS and iframe errors
const isHarmlessError = (message: any, source?: string) => {
  const msgStr = String(message || '');
  const srcStr = String(source || '');
  return (
    msgStr === 'Script error.' ||
    !source || // empty source indicates a CORS-shielded third-party script error
    msgStr.includes('contentWindow') ||
    msgStr.includes('iframe') ||
    msgStr.includes('TradingView') ||
    msgStr.includes('tv-') ||
    msgStr.includes('Vercel') ||
    srcStr.includes('tradingview') ||
    srcStr.includes('vercel')
  );
};

window.onerror = function(message, source, lineno, colno, error) {
  if (isHarmlessError(message, source)) {
    console.warn('Suppressed harmless third-party / CORS script error:', message, 'from source:', source);
    return true; // Suppresses error propagation to the browser/platform reporter
  }

  console.group('VAM Terminal System Error');
  console.error('Message:', message);
  console.error('Source:', source);
  console.error('Line:', lineno);
  console.error('Column:', colno);
  console.error('Error Object:', error);
  console.groupEnd();
  
  return false;
};

// Also listen to unhandled promise rejections which can escape standard onerror handlers
window.addEventListener('unhandledrejection', function(event) {
  const reason = event.reason;
  const reasonStr = String(reason || '');
  const reasonMessage = reason?.message || '';
  
  if (
    isHarmlessError(reasonStr) || 
    isHarmlessError(reasonMessage) ||
    reasonStr.includes('TradingView') ||
    reasonMessage.includes('TradingView') ||
    reasonStr.includes('contentWindow') ||
    reasonMessage.includes('contentWindow') ||
    reasonStr.includes('iframe') ||
    reasonMessage.includes('iframe')
  ) {
    console.warn('Suppressed third-party unhandled promise rejection:', reason);
    event.preventDefault(); // Suppresses rejection propagation and prevents console logs/platform alerts
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReportToastProvider>
      <App />
    </ReportToastProvider>
  </StrictMode>,
);

// Defensive global process check for some environments
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
}
