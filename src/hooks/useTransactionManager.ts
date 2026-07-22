import { useState, useCallback, useEffect } from 'react';

export interface Transaction {
  id: string;
  timestamp: string;
  assetType: 'EQUITY' | 'SUKUK' | 'COMMODITY';
  ticker: string;
  side: 'BUY' | 'SELL' | 'STOP_LOSS';
  quantity: number;
  price: number;
  currency: string;
  broker: 'CGS_INTERNATIONAL' | 'IBKR';
}

const DEFAULT_HISTORY: Transaction[] = [];

export const useTransactionManager = () => {
  const [history, setHistory] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('transaction_history_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out dummy items if any are present from previous sessions
          return parsed.filter((tx: any) => tx.id !== 'TX-1' && tx.id !== 'TX-2');
        }
      }
    } catch (e) {
      console.error("Failed to parse transaction history", e);
    }
    return DEFAULT_HISTORY;
  });

  useEffect(() => {
    try {
      localStorage.setItem('transaction_history_v3', JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save transaction history", e);
    }
  }, [history]);

  const recordTransaction = useCallback((newTx: Omit<Transaction, 'id' | 'timestamp'>) => {
    const transaction: Transaction = {
      ...newTx,
      id: `TX-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    setHistory(prev => [transaction, ...prev]);
    console.log(`[Ventuream Gateway] Transaction Recorded: ${transaction.side} ${transaction.ticker}`);
  }, []);

  const resetHistory = useCallback(() => {
    setHistory(DEFAULT_HISTORY);
    try {
      localStorage.removeItem('transaction_history_v3');
    } catch (e) {
      console.error("Failed to clear transaction history from local storage", e);
    }
  }, []);

  return { history, recordTransaction, resetHistory };
};

