import { useState, useCallback } from 'react';

export interface Transaction {
  id: string;
  timestamp: string;
  assetType: 'EQUITY' | 'SUKUK' | 'COMMODITY';
  ticker: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  currency: string;
  broker: 'CGS_INTERNATIONAL' | 'IBKR';
}

export const useTransactionManager = () => {
  const [history, setHistory] = useState<Transaction[]>([
    {
      id: 'TX-1',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      assetType: 'EQUITY',
      ticker: 'BBCA',
      side: 'BUY',
      quantity: 1000,
      price: 10250,
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
  ]);

  const recordTransaction = useCallback((newTx: Omit<Transaction, 'id' | 'timestamp'>) => {
    const transaction: Transaction = {
      ...newTx,
      id: `TX-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    setHistory(prev => [transaction, ...prev]);
    console.log(`[Ventuream Gateway] Transaction Recorded: ${transaction.side} ${transaction.ticker}`);
  }, []);

  return { history, recordTransaction };
};
