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

const DEFAULT_HISTORY: Transaction[] = [
  {
    id: 'TX-1',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    assetType: 'EQUITY',
    ticker: 'BBRI',
    side: 'BUY',
    quantity: 1000,
    price: 4820,
    currency: 'IDR',
    broker: 'CGS_INTERNATIONAL'
  },
  {
    id: 'TX-2',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    assetType: 'EQUITY',
    ticker: 'GOTO',
    side: 'SELL',
    quantity: 50000,
    price: 68,
    currency: 'IDR',
    broker: 'CGS_INTERNATIONAL'
  }
];

export const useTransactionManager = () => {
  const [history, setHistory] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('transaction_history_v3');
      if (saved) return JSON.parse(saved);
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

