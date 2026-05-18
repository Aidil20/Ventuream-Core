import requests
import pandas as pd
import json

class IDXRealTimeIngestor:
    def __init__(self):
        # Header untuk menyamar sebagai browser premium dari luar negeri
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.google.com/'
        }

    def get_stock_price(self, ticker):
        """Menarik data real-time IDX via Yahoo Finance Endpoint (Tanpa API Key)"""
        # Format ticker IDX untuk internasional adalah .JK (contoh: BBCA.JK)
        symbol = f"{ticker}.JK"
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1m&range=1d"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            data = response.json()
            
            # Parsing data harga terakhir
            meta = data['chart']['result'][0]['meta']
            current_price = meta['regularMarketPrice']
            prev_close = meta['chartPreviousClose']
            change_pct = round(((current_price - prev_close) / prev_close) * 100, 2)
            
            return {
                "ticker": ticker,
                "last_price": current_price,
                "change_pct": change_pct,
                "market_state": "OPEN" if meta['marketState'] == "REGULAR" else "CLOSED"
            }
        except Exception as e:
            return {"error": f"Internal Bug: {str(e)}"}

# Contoh untuk monitoring portofolio IDX Bapak (Contoh: ASII, BBRI, TLKM)
ingestor = IDXRealTimeIngestor()
target_tickers = ["ASII", "BBRI", "TLKM"] 
idx_summary = [ingestor.get_stock_price(t) for t in target_tickers]

print(json.dumps(idx_summary, indent=2))
