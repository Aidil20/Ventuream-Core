import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  const PORT = 3000;

  // Middleware for parsing JSON
  app.use(express.json());

  // API Proxy for MarketStack
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

  // --- Real-time Data Stream Logic ---
  // In a real institutional setup, this would be a feed from a Bloomberg Terminal API or FIX Protocol.
  // Here we simulate a high-frequency market feed.
  const tickers = ["BBCA", "TLKM", "ASII", "ADRO", "UNVR", "COAL", "DEFI", "OTAS", "ANDI", "LPKR", "IPAC", "BMRI", "BBNI", "MDKA", "ANTM", "GOTO", "PTBA", "ITMG", "HRUM", "SMGR", "BBYB", "ESSA"];
  
  // Storage for latest prices to provide on connection
  const latestPrices: Record<string, any> = {};

  // Tick state to simulate indicator movements
  const tickerStats: Record<string, { basePrice: number, ema20: number, ema50: number, rsi: number }> = {};
  tickers.forEach(t => {
    const base = t === "BBCA" ? 10000 : t === "BMRI" ? 7000 : t === "TLKM" ? 3800 : Math.random() * 2000 + 100;
    tickerStats[t] = {
      basePrice: base,
      ema20: base * 1.02,
      ema50: base * 0.98,
      rsi: 45 + Math.random() * 20
    };
  });

  setInterval(() => {
    const ticker = tickers[Math.floor(Math.random() * tickers.length)];
    const stats = tickerStats[ticker];
    
    // Base price simulation logic
    const currentPrice = latestPrices[ticker]?.price || stats.basePrice;
    const movement = (Math.random() - 0.5) * (currentPrice * 0.003);
    const newPrice = Math.max(10, currentPrice + movement);
    const changePercent = ((newPrice - stats.basePrice) / stats.basePrice) * 100;

    // Simulate technical indicators for the Intraday Scanner Signal logic
    stats.rsi = Math.max(10, Math.min(90, stats.rsi + (Math.random() - 0.5) * 5));
    const vwap = stats.basePrice * (1 + (Math.sin(Date.now() / 10000) * 0.01));
    const macdHist = (Math.random() - 0.4) * 20; // Slight bullish bias

    const data = {
      symbol: ticker,
      price: Math.round(newPrice),
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
  }, 600); // Higher frequency for institutional feel

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

startServer();
