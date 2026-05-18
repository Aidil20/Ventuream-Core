class VamSentimentEngine:
    def __init__(self):
        # Kamus kata kunci dengan bobot dampak (-1.0 sampai 1.0)
        self.lexicon = {
            # Geopolitik & Komoditas
            "sanction": -0.8, "embargo": -0.9, "war": -0.7, "conflict": -0.5,
            "opec+": 0.6, "supply cut": 0.8, "production halt": 0.7,
            "trade deal": 0.6, "peace": 0.4, "tensions ease": 0.5,
            
            # Sektor Teknologi (Semiconductor/AI/Cloud)
            "earnings beat": 0.9, "acquisition": 0.7, "partnership": 0.5,
            "innovation": 0.4, "layoffs": -0.4, "interest rate hike": -0.8,
            "rate cut": 0.7, "chip shortage": -0.6, "surplus": -0.3
        }

    def analyze_impact(self, text):
        score = 0
        impact_level = "Low"
        text = text.lower()
        
        # Hitung skor berdasarkan kemunculan kata kunci
        found_keywords = []
        for word, weight in self.lexicon.items():
            if word in text:
                score += weight
                found_keywords.append(word)
        
        # Penentuan Level Dampak
        abs_score = abs(score)
        if abs_score > 1.2: impact_level = "CRITICAL"
        elif abs_score > 0.6: impact_level = "HIGH"
        elif abs_score > 0.2: impact_level = "MODERATE"
        
        return {
            "score": round(score, 2),
            "impact": impact_level,
            "keywords": found_keywords
        }

    def issue_signal(self, sentiment_data, technical_trend):
        """
        Menggabungkan Sentiment AI + Vam Smart Scanner (Technical)
        """
        score = sentiment_data['score']
        
        # Logika Sinyal (Buy/Sell/Neutral)
        if score >= 0.5 and technical_trend == "Bullish":
            return "ISSUE: BUY (High Conviction)"
        elif score <= -0.5 and technical_trend == "Bearish":
            return "ISSUE: SELL (Protective Action)"
        elif abs(score) < 0.2:
            return "ISSUE: NEUTRAL (Wait and Watch)"
        else:
            return "ISSUE: HOLD (Trend Check)"

if __name__ == "__main__":
    engine = VamSentimentEngine()
    test_text = "NVIDIA earnings beat expectations despite rising geopolitical conflict"
    sentiment = engine.analyze_impact(test_text)
    signal = engine.issue_signal(sentiment, "Bullish")
    print(f"Sentiment: {sentiment}")
    print(f"Signal: {signal}")
