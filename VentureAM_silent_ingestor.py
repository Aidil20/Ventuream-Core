import yfinance as yf
import requests
from bs4 import BeautifulSoup
import json

class VentureAMSilentIngestor:
    def __init__(self):
        self.headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

    def get_market_data(self, tickers):
        """Menarik data teknikal saham Tech untuk Swing/Holding"""
        data_results = {}
        for ticker in tickers:
            stock = yf.Ticker(ticker)
            # Mengambil data harga terakhir (Real-time delayed 15 min)
            hist = stock.history(period="1d")
            if not hist.empty:
                data_results[ticker] = {
                    "price": round(hist['Close'].iloc[-1], 2),
                    "change_pct": round(((hist['Close'].iloc[-1] - hist['Open'].iloc[-1]) / hist['Open'].iloc[-1]) * 100, 2)
                }
        return data_results

    def get_geo_intel(self):
        """Scraping berita Geopolitik & Komoditas dari sumber publik internasional"""
        url = "https://www.reuters.com/business/energy/" # Fokus pada Komoditas/Energi
        response = requests.get(url, headers=self.headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        news_items = []
        # Mencari headline berita utama
        headings = soup.find_all(['h2', 'h3'], limit=5)
        for h in headings:
            text = h.get_text().strip()
            if len(text) > 20: # Filter hanya judul yang valid
                news_items.append({"headline": text})
        return news_items

# Eksekusi AI Ingestor
if __name__ == "__main__":
    ingestor = VentureAMSilentIngestor()
    tech_stocks = ["NVDA", "AAPL", "MSFT", "TSM"] # Ticker Tech utama
    market_summary = ingestor.get_market_data(tech_stocks)
    intel_summary = ingestor.get_geo_intel()

    # Output untuk AI Engine Beranda
    print(json.dumps({
        "market": market_summary,
        "geopolitics": intel_summary,
        "status": "Secure - No API Leak"
    }, indent=2))
