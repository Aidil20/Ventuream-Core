import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handler to capture "Script error" and provide more context
window.onerror = function(message, source, lineno, colno, error) {
  console.group('VAM Terminal System Error');
  console.error('Message:', message);
  console.error('Source:', source);
  console.error('Line:', lineno);
  console.error('Column:', colno);
  console.error('Error Object:', error);
  console.groupEnd();
  
  if (message === 'Script error.') {
    console.warn('Caught a generic "Script error.". This usually indicates a CORS issue with an external script (like TradingView or Vercel Insights).');
  }
  return false;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Defensive global process check for some environments
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
}
