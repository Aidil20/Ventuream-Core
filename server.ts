import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  const PORT = 3000;

  // Simple in-memory cache
  const apiCache: Record<string, { data: any, timestamp: number }> = {};
  const CACHE_TTL = 60 * 60 * 1000; // 1 hour cache to reduce API calls

  function getCached(key: string) {
    const cached = apiCache[key];
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) return cached.data;
    return null;
  }

  function setCached(key: string, data: any) {
    if (!data) return;
    apiCache[key] = { data, timestamp: Date.now() };
  }

  function isQuotaError(error: any) {
    if (!error) return false;
    
    // Check status codes in various formats
    const statusCode = error.status || error.statusCode || error.error?.code;
    if (statusCode === 429) return true;
    
    // Check error message or details
    const message = error.message || "";
    const details = typeof error.details === 'string' ? error.details : JSON.stringify(error.details || "");
    const errString = (message + details + String(error)).toLowerCase();
    
    return (
      errString.includes("429") || 
      errString.includes("resource_exhausted") || 
      errString.includes("quota") ||
      errString.includes("limit_exceeded") ||
      errString.includes("rate limit")
    );
  }

  // Fallback Data for Quota Issues
  const FALLBACK_NEWS = [
    { headline: "IDX Corporate Action: Major Bank Restructuring Confirmed", summary: "Tier-1 Indonesian banks announce strategic alignment to improve capital adequacy ratios for H2 2026.", timestamp: new Date().toISOString(), source: "Bloomberg Technoz", sentiment: "bullish" },
    { headline: "Global Markets: Fed Maintains Neutral Stance on Emerging Markets", summary: "Federal Reserve indicates stability in interest rates, providing a positive tailwind for Indonesian JCI index components.", timestamp: new Date().toISOString(), source: "Reuters", sentiment: "neutral" },
    { headline: "Commodity Watch: Nickel Prices Surge on EV Supply Shortage", summary: "Supply constraints in major Southeast Asian hubs drive institutional investment into mining leaders.", timestamp: new Date().toISOString(), source: "Investing.com", sentiment: "bullish" },
    { headline: "Institutional Flow: Foreign Investors Eye Indonesian Tech Giants", summary: "Net buy positions recorded in major tech components as consolidation talks drive sentiment.", timestamp: new Date().toISOString(), source: "CNBC Indonesia", sentiment: "bullish" }
  ];

  const FALLBACK_INSIGHTS = [
    { 
      headline: "M&A Sector Resilience", 
      insight: "Consolidation in Indonesia's tech-fin sectors is accelerating as private equity seeks profitability over growth.", 
      insight_id: "Konsolidasi di sektor teknologi-finansial Indonesia sedang meningkat.", 
      sentiment: "bullish" 
    },
    { 
      headline: "Sukuk Market Liquidity", 
      insight: "Sharia-compliant bonds are seeing higher demand from Middle Eastern institutional investors.", 
      insight_id: "Obligasi syariah mendapatkan permintaan tinggi dari investor institusi Timur Tengah.", 
      sentiment: "neutral" 
    },
    {
      headline: "Bond Yield Stabilization",
      insight: "Government bond yields show stabilization as inflation outlook remains within targets.",
      insight_id: "Imbal hasil obligasi pemerintah menunjukkan stabilisasi seiring prospek inflasi yang terjaga.",
      sentiment: "bullish"
    }
  ];

  // Initialize Gemini
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Middleware for parsing JSON
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  const SOURCE_URLS = [
    "https://www.bloomberg.com/markets",
    "https://www.reuters.com/business",
    "https://www.investing.com/commodities/",
    "https://businessinvesting.com/commodities",
    "https://investasi.kontan.co.id",
    "https://www.cnbcindonesia.com/market",
    "https://www.bloombergtechnoz.com",
    "https://www.idnfinancials.com",
    "https://www.idx.co.id/id/berita/keterbukaan-informasi"
  ];

  // API Proxy for Market News via Gemini
  app.get("/api/news", async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    }

    const cached = getCached("news");
    if (cached) return res.json(cached);

    try {
      const prompt = `Summarize the top 5 latest institutional market news for IDX (Indonesia Stock Exchange) and global markets today. 
      Prioritize M&A Activity, corporate actions, and strategic divestments. 
      Base your findings as much as possible on these institutional sources:
      ${SOURCE_URLS.join("\n")}
      Return as JSON array of objects with: headline, summary, timestamp, source, sentiment (bullish, bearish, or neutral).`;

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                summary: { type: Type.STRING },
                timestamp: { type: Type.STRING },
                source: { type: Type.STRING },
                sentiment: { type: Type.STRING, enum: ['bullish', 'bearish', 'neutral'] }
              },
              required: ["headline", "summary", "timestamp", "source", "sentiment"]
            }
          }
        }
      });

      const data = JSON.parse(response.text || "[]");
      setCached("news", data);
      res.json(data);
    } catch (error: any) {
      // Fallback if Quota Exceeded or Error
      if (isQuotaError(error)) {
        console.warn("[VAM GATEWAY] News API Quota exceeded. Serving fallback news.");
        return res.json(FALLBACK_NEWS);
      }
      
      console.error("Gemini News API Error:", error);
      res.status(500).json({ 
        error: "Failed to fetch news", 
        details: error?.message,
        model: "gemini-flash-latest"
      });
    }
  });

  app.get("/api/market/insights", async (req, res) => {
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    
    const cached = getCached("insights");
    if (cached) return res.json(cached);

    try {
      const prompt = `Perform a fundamental analyst-level market research. Generate 5 high-priority market insights for an Indonesian institutional dashboard. 
      Focus heavily on:
      1. M&A activity and Private Equity flows.
      2. Sukuk transitions and Bond yield analysis.
      3. Corporate restructuring in IDX blue-chips (BBCA, BBRI, TLKM, ADRO, GOTO).
      4. Energy and Tech sector fundamental trends.
      
      Provide each insight in BOTH English and Indonesian. 
      Base your research on the latest data from these institutional sources:
      ${SOURCE_URLS.join("\n")}
      Return as a JSON array of objects.`;

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                insight: { type: Type.STRING },
                insight_id: { type: Type.STRING },
                sentiment: { type: Type.STRING, enum: ['bullish', 'bearish', 'neutral'] },
              },
              required: ["headline", "insight", "insight_id", "sentiment"],
            }
          }
        }
      });
      const data = JSON.parse(response.text || "[]");
      setCached("insights", data);
      res.json(data);
    } catch (error: any) {
      if (isQuotaError(error)) {
        console.warn("[VAM GATEWAY] Insights API Quota exceeded. Serving fallback insights.");
        return res.json(FALLBACK_INSIGHTS);
      }
      console.error("Gemini Insight Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/market/scanner", async (req, res) => {
    const { name } = req.query;
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    
    const cacheKey = `scanner_${name}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    try {
      const prompt = `Perform institutional-grade market scanning. Generate 5 realistic scanner results for the Jakarta Composite Index (JCI) market using the scanner named "${name}". 
      Base the logic on fundamental metrics found in these institutional sources:
      ${SOURCE_URLS.join("\n")}
      Include Symbol, Full Name, signal (BUY/SELL/HOLD), score (0-100), and metrics (Price, Volume, P/E Ratio, Market Cap, RSI, MACD). Return JSON.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                symbol: { type: Type.STRING },
                name: { type: Type.STRING },
                signal: { type: Type.STRING, enum: ['BUY', 'SELL', 'HOLD'] },
                score: { type: Type.NUMBER },
                metrics: { type: Type.OBJECT }
              },
              required: ["symbol", "name", "signal", "score", "metrics"],
            }
          }
        }
      });
      const data = JSON.parse(response.text || "[]");
      setCached(cacheKey, data);
      res.json(data);
    } catch (error: any) {
      console.error("Gemini Scanner Error:", error);
      if (isQuotaError(error)) {
        console.warn("Quota exceeded. Serving empty scanner results.");
        return res.json([]);
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/market/recommendations", async (req, res) => {
    const q = req.query;
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    
    const cacheKey = `recommendations_${JSON.stringify(q)}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    try {
      const { sector, riskProfile, rsiRange, macdLevel, minVolume, dateRange } = q as any;
      
      let criteria = `Price > EMA20, EPS Growth < 10%. Sector: ${sector || 'Any'}, Risk: ${riskProfile || 'Moderate'}.`;
      
      if (rsiRange) {
        const [min, max] = JSON.parse(rsiRange);
        criteria += ` RSI should be between ${min} and ${max}.`;
      }
      
      if (macdLevel && macdLevel !== 'all') {
        criteria += ` MACD Level condition: ${macdLevel.replace('_', ' ')}.`;
      }
      
      if (minVolume) {
        criteria += ` Minimum daily volume: ${minVolume}.`;
      }
      
      if (dateRange) {
        const { start, end } = JSON.parse(dateRange);
        criteria += ` Consider data freshness for the period: ${start} to ${end}.`;
      }

      const prompt = `Act as an Institutional Fundamental Analyst. Generate 4 realistic asset recommendations specifically for stocks listed on the Jakarta Composite Index (JCI). 
      Criteria: ${criteria}
      Ground your recommendations in the latest data from sources like Bloomberg Technoz, Kontan, CNBC Indonesia, and idx.co.id.
      Focus on major symbols like BBCA, BBRI, TLKM, ADRO. Return JSON with details.`;

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                symbol: { type: Type.STRING },
                name: { type: Type.STRING },
                price: { type: Type.STRING },
                change: { type: Type.STRING },
                signal: { type: Type.STRING, enum: ['BUY', 'SELL', 'HOLD'] },
                volume: { type: Type.STRING },
                peRatio: { type: Type.STRING },
                marketCap: { type: Type.STRING },
                ema20: { type: Type.STRING },
                rationale: { type: Type.STRING }
              },
              required: ["symbol", "name", "price", "change", "signal", "volume", "peRatio", "marketCap", "ema20", "rationale"],
            }
          }
        }
      });
      const data = JSON.parse(response.text || "[]");
      setCached(cacheKey, data);
      res.json(data);
    } catch (error: any) {
      console.error("Gemini Recommendations Error:", error);
      if (isQuotaError(error)) {
        console.warn("Quota exceeded. Serving empty recommendations.");
        return res.json([]);
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/gateway/check", async (req, res) => {
    const vamScriptId = process.env.VAM_GATEWAY_SCRIPT_ID || req.query.scriptId;
    if (!vamScriptId) return res.status(400).json({ error: "No script ID" });
    
    try {
      const resp = await fetch(`https://script.google.com/macros/s/${vamScriptId}/exec?ticker=IDX:BBCA`);
      res.status(resp.status).send(resp.ok ? "OK" : "Error");
    } catch (error) {
      res.status(500).send("Failed");
    }
  });

  // API Proxy for MarketStack Tickers
  app.get("/api/marketstack/tickers", async (req, res) => {
    const accessKey = process.env.MARKETSTACK_API_KEY;
    if (!accessKey) {
      return res.status(500).json({ error: "MARKETSTACK_API_KEY not configured" });
    }

    try {
      const response = await fetch(`https://api.marketstack.com/v2/exchanges/XIDX/tickers?access_key=${accessKey}&limit=100`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("MarketStack API Error:", error);
      res.status(500).json({ error: "Failed to fetch from MarketStack" });
    }
  });

  // API Proxy for MarketStack Latest Prices
  app.get("/api/marketstack/latest", async (req, res) => {
    const accessKey = process.env.MARKETSTACK_API_KEY;
    const symbols = req.query.symbols as string;

    if (!accessKey) {
      return res.status(500).json({ error: "MARKETSTACK_API_KEY not configured" });
    }

    if (!symbols) {
      return res.status(400).json({ error: "Symbols query parameter is required" });
    }

    try {
      // MarketStack expects symbols formatted correctly, usually with .XIDX for Jakarta
      const formattedSymbols = symbols.split(',').map(s => {
        const clean = s.trim().toUpperCase();
        if (clean.includes('.')) return clean;
        return `${clean}.XIDX`; // Default to Jakarta for symbol list
      }).join(',');

      const response = await fetch(`https://api.marketstack.com/v1/intraday/latest?access_key=${accessKey}&symbols=${formattedSymbols}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("MarketStack Price API Error:", error);
      res.status(500).json({ error: "Failed to fetch prices from MarketStack" });
    }
  });

  // --- Real-time Data Stream Logic ---
  // In a real institutional setup, this would be a feed from a Bloomberg Terminal API or FIX Protocol.
  // Here we simulate a high-frequency market feed.
  const tickers = [
    "BBCA", "TLKM", "ASII", "ADRO", "UNVR", 
    "COAL", "DEFI", "OTAS", "ANDI", "LPKR", 
    "IPAC", "BMRI", "BBNI", "MDKA", "ANTM", 
    "GOTO", "PTBA", "ITMG", "HRUM", "SMGR", 
    "BBYB", "ESSA", "KOTA", "LAND", "PIPA", "WMUU"
  ];
  
  // Storage for latest prices to provide on connection
  const latestPrices: Record<string, any> = {};
  const tickerStats: Record<string, { basePrice: number, ema20: number, ema50: number, rsi: number }> = {};
  
  // Initialize stats
  tickers.forEach(t => {
    let base = Math.random() * 2000 + 100;
    if (t === "BBCA") base = 10450; 
    else if (t === "BMRI") base = 7125;
    else if (t === "TLKM") base = 2820;
    else if (t === "ASII") base = 4850;
    else if (t === "BBNI") base = 5150;
    else if (t === "ADRO") base = 3680;
    else if (t === "UNVR") base = 2240;
    else if (t === "GOTO") base = 52;
    // Portfolio assets base prices
    else if (t === "COAL") base = 57;
    else if (t === "DEFI") base = 177;
    else if (t === "KOTA") base = 50; 
    else if (t === "LAND") base = 89;
    else if (t === "PIPA") base = 134;
    else if (t === "WMUU") base = 68;
    else if (t === "LPKR") base = 81;
    else if (t === "ANTM") base = 1530;
    else if (t === "MDKA") base = 2480;
    else if (t === "PTBA") base = 2650;
    else if (t === "ITMG") base = 27450;
    else if (t === "HRUM") base = 1310;
    else if (t === "SMGR") base = 4120;
    
    tickerStats[t] = {
      basePrice: base,
      ema20: base * 1.02,
      ema50: base * 0.98,
      rsi: 45 + Math.random() * 20
    };
  });

  // Background fetch for real market data
  const syncWithMarketStack = async () => {
    const accessKey = process.env.MARKETSTACK_API_KEY;
    if (!accessKey) return;

    try {
      const formattedSymbols = tickers.map(t => `${t}.XIDX`).join(',');
      const response = await fetch(`https://api.marketstack.com/v1/intraday/latest?access_key=${accessKey}&symbols=${formattedSymbols}`);
      const data = await response.json();
      
      if (data && data.data && Array.isArray(data.data)) {
        data.data.forEach((item: any) => {
          const symbol = item.symbol.split('.')[0];
          if (tickerStats[symbol]) {
            const price = item.last || item.close || item.open;
            if (price) {
              tickerStats[symbol].basePrice = price;
              console.log(`[VAM SYNC] Updated ${symbol} base price to ${price} from MarketStack`);
            }
          }
        });
      }
    } catch (error) {
      console.warn("[VAM SYNC] MarketStack background sync failed:", error);
    }
  };

  // Initial sync and then every 5 minutes
  syncWithMarketStack();
  setInterval(syncWithMarketStack, 300000);

  // High-frequency simulation feed (anchored to basePrice)
  setInterval(() => {
    const ticker = tickers[Math.floor(Math.random() * tickers.length)];
    const stats = tickerStats[ticker];
    
    // Base price simulation logic
    const currentPrice = latestPrices[ticker]?.price || stats.basePrice;
    const movement = (Math.random() - 0.5) * (currentPrice * 0.002); // Reduced jitter
    const newPrice = Math.max(10, currentPrice + movement);
    
    // Re-anchor if drifted too far from base price (real market price)
    const drift = (newPrice - stats.basePrice) / stats.basePrice;
    const adjustedPrice = Math.abs(drift) > 0.05 ? stats.basePrice * (1 + drift * 0.5) : newPrice;

    const changePercent = ((adjustedPrice - stats.basePrice) / stats.basePrice) * 100;

    // Simulate technical indicators
    stats.rsi = Math.max(10, Math.min(90, stats.rsi + (Math.random() - 0.5) * 5));
    const vwap = stats.basePrice * (1 + (Math.sin(Date.now() / 10000) * 0.01));
    const macdHist = (Math.random() - 0.4) * 20; 

    const data = {
      symbol: ticker,
      price: Math.round(adjustedPrice),
      changePercent: parseFloat(changePercent.toFixed(2)),
      vwap: Math.round(vwap),
      ema20: Math.round(stats.ema20),
      ema50: Math.round(stats.ema50),
      rsi: Math.round(stats.rsi),
      macdHist: parseFloat(macdHist.toFixed(2)),
      timestamp: Date.now()
    };

    latestPrices[ticker] = data;
    io.emit("market-update", data);
  }, 800);

  io.on("connection", (socket) => {
    console.log("[VAM STREAM] Client connected:", socket.id);
    socket.emit("market-init", latestPrices);
    
    socket.on("subscribe", (ticker) => {
      console.log(`[VAM STREAM] Client ${socket.id} subscribed to ${ticker}`);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`VAM Real-time Gateway running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("CRITICAL SERVER STARTUP ERROR:", err);
});
