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
    id: 'TX-REBAL-101',
    timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
    assetType: 'EQUITY',
    ticker: 'PRDL.JK',
    side: 'BUY',
    quantity: 10,
    price: 980,
    currency: 'IDR',
    broker: 'CGS_INTERNATIONAL'
  },
  {
    id: 'TX-REBAL-102',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    assetType: 'EQUITY',
    ticker: 'EMMI.JK',
    side: 'BUY',
    quantity: 10,
    price: 720,
    currency: 'IDR',
    broker: 'CGS_INTERNATIONAL'
  },
  {
    id: 'TX-REBAL-103',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
    assetType: 'EQUITY',
    ticker: 'PJHB-W.JK',
    side: 'BUY',
    quantity: 5,
    price: 15,
    currency: 'IDR',
    broker: 'CGS_INTERNATIONAL'
  },
  {
    id: 'TX-REBAL-104',
    timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
    assetType: 'EQUITY',
    ticker: 'BACH.JK',
    side: 'BUY',
    quantity: 1,
    price: 22400,
    currency: 'IDR',
    broker: 'CGS_INTERNATIONAL'
  },
  {
    id: 'TX-REBAL-105',
    timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
    assetType: 'EQUITY',
    ticker: 'JECX.JK',
    side: 'BUY',
    quantity: 5,
    price: 420,
    currency: 'IDR',
    broker: 'CGS_INTERNATIONAL'
  },
  {
    id: 'TX-REBAL-106',
    timestamp: new Date(Date.now() - 86400000 * 6).toISOString(),
    assetType: 'EQUITY',
    ticker: 'RANS.JK',
    side: 'BUY',
    quantity: 10,
    price: 380,
    currency: 'IDR',
    broker: 'CGS_INTERNATIONAL'
  },
  {
    id: 'TX-REBAL-107',
    timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
    assetType: 'EQUITY',
    ticker: 'DEFI.JK',
    side: 'BUY',
    quantity: 10,
    price: 224,
    currency: 'IDR',
    broker: 'CGS_INTERNATIONAL'
  }
];

export const useTransactionManager = () => {
  const [history, setHistory] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('transaction_history_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
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

