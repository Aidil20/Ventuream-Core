import yfinance as yf
import json

class VamCrossMarketComparator:
    def __init__(self):
        # Pemetaan korelasi (Proxy) antara NASDAQ dan IDX
        self.correlation_map = {
            "NASDAQ_LEAD": ["QQQ", "NVDA", "AAPL", "MSFT"],
            "IDX_TECH": ["GOTO.JK", "BUKA.JK", "EMT K.JK", "WIRG.JK"]
        }

    def fetch_comparison_data(self):
        results = {}
        
        # 1. Ambil Performa NASDAQ (Leading Indicator)
        nasdaq_data = {}
        for ticker in self.correlation_map["NASDAQ_LEAD"]:
            stock = yf.Ticker(ticker)
            hist = stock.history(period="1d")
            if not hist.empty:
                nasdaq_data[ticker] = round(((hist['Close'].iloc[-1] - hist['Open'].iloc[-1]) / hist['Open'].iloc[-1]) * 100, 2)
        
        # 2. Ambil Performa IDX Tech (Lagging Follower)
        idx_data = {}
        for ticker in self.correlation_map["IDX_TECH"]:
            stock = yf.Ticker(ticker)
            hist = stock.history(period="1d")
            if not hist.empty:
                idx_data[ticker.replace(".JK", "")] = round(((hist['Close'].iloc[-1] - hist['Open'].iloc[-1]) / hist['Open'].iloc[-1]) * 100, 2)
        
        return {"nasdaq": nasdaq_data, "idx": idx_data}

    def get_divergence_signal(self, data):
        """
        Logika Divergensi: Jika NASDAQ naik tajam tapi IDX Tech masih diam/turun,
        maka ada potensi 'Catch-up' di pasar domestik.
        """
        nasdaq_avg = sum(data['nasdaq'].values()) / len(data['nasdaq']) if data['nasdaq'] else 0
        idx_avg = sum(data['idx'].values()) / len(data['idx']) if data['idx'] else 0
        
        divergence = round(nasdaq_avg - idx_avg, 2)
        
        if divergence > 1.5:
            return f"SIGNAL: POSITIVE DIVERGENCE (+{divergence}%). Potensi IDX Tech mengekor naik."
        elif divergence < -1.5:
            return f"SIGNAL: NEGATIVE DIVERGENCE ({divergence}%). Waspada tekanan jual di IDX Tech."
        else:
            return "SIGNAL: CORRELATED. Pergerakan pasar sinkron."

# Eksekusi AI Comparator
try:
    comparator = VamCrossMarketComparator()
    market_data = comparator.fetch_comparison_data()
    analysis_signal = comparator.get_divergence_signal(market_data)

    print(json.dumps({"comparison": market_data, "ai_logic": analysis_signal}, indent=2))
except Exception as e:
    print(json.dumps({"error": str(e)}, indent=2))
