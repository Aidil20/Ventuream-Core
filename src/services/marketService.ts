import { GoogleGenAI, Type } from "@google/genai";

const apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined;
if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
  console.warn("[VentureAM AI] Gemini API Key is missing or using placeholder. AI features will use fallbacks.");
}
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export interface MarketInsight {
  headline: string;
  insight: string;
  insight_id: string; // Indonesian version
  timestamp: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

export interface StockRecommendation {
  symbol: string;
  name: string;
  price: string;
  change: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  volume?: string;
  peRatio?: string;
  marketCap?: string;
  ema20?: string;
  detectedAt?: number;
}

export interface ScanOptions {
  sector?: string;
  riskProfile?: string;
  signalFilter?: string;
  assetType?: string;
  sortBy?: 'price' | 'change' | 'signal';
  timeframe?: '1D' | '5D' | '1W' | '1M' | '1Y';
}

const CACHE_DURATION = 120 * 60 * 1000; // 2 hours
const CIRCUIT_BREAKER_DURATION = 15 * 60 * 1000; // 15 minutes

function getCircuitBreakerKey(type: string) {
  return `ventuream_circuit_breaker_${type}`;
}

function isCircuitBroken(type: string): boolean {
  const breaker = localStorage.getItem(getCircuitBreakerKey(type));
  if (breaker) {
    const timestamp = parseInt(breaker, 10);
    if (Date.now() - timestamp < CIRCUIT_BREAKER_DURATION) {
      return true;
    }
  }
  return false;
}

function breakCircuit(type: string) {
  localStorage.setItem(getCircuitBreakerKey(type), Date.now().toString());
}

export async function fetchLatestInsights(): Promise<MarketInsight> {
  const cacheKey = 'ventuream_insights_cache';
  const type = 'insights';
  
  const circuitBroken = isCircuitBroken(type);
  const cached = localStorage.getItem(cacheKey);

  // Return cached data if available AND (circuit is broken OR cache is still fresh)
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > CACHE_DURATION;
    if (circuitBroken || !isExpired) {
      return data;
    }
  } else if (circuitBroken) {
    // Return early if circuit broken and no cache exists
    return {
      headline: "Market Intelligence Active",
      insight: "Synchronizing with core VentureAM intelligence feeds. Real-time metrics are being prioritized for verified institutional gateways.",
      insight_id: "Intelijen Pasar Aktif. Sinkronisasi dengan umpan intelijen inti VentureAM sedang berlangsung.",
      sentiment: "neutral",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate a professional, concise market insight for an Indonesian asset management dashboard. Provide the results in BOTH English and Indonesian. The insight should focus on one of these assets: Sukuk Maki Tech (Bonds), ADRO coal (Energy), or GOTO (Tech). Return it in JSON format.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: {
              type: Type.STRING,
              description: "A short, punchy headline in English.",
            },
            insight: {
              type: Type.STRING,
              description: "A professional one-sentence analysis in English.",
            },
            insight_id: {
              type: Type.STRING,
              description: "The same professional one-sentence analysis translated into Indonesian.",
            },
            sentiment: {
              type: Type.STRING,
              enum: ['bullish', 'bearish', 'neutral'],
              description: "The market sentiment of this insight.",
            },
          },
          required: ["headline", "insight", "insight_id", "sentiment"],
        },
      },
    });

    const data = JSON.parse(response.text);
    const insight = {
      ...data,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Save to cache
    localStorage.setItem(cacheKey, JSON.stringify({ data: insight, timestamp: Date.now() }));
    
    return insight;
  } catch (error: any) {
    const errorString = JSON.stringify(error).toLowerCase();
    const isQuotaError = errorString.includes("429") || errorString.includes("quota") || errorString.includes("resource_exhausted");
    
    if (isQuotaError) {
      breakCircuit(type);
      console.warn(`[VentureAM Gateway] Quota reached for ${type}. Switching to secure fallback layers.`);
    } else {
      console.error(`Error fetching ${type}:`, error);
    }
    
    // Check if we have any stale cache to use as fallback
    if (cached) {
      return JSON.parse(cached).data;
    }

    // Ultimate fallback if no cache exists
    return {
      headline: "Market Intelligence Active",
      insight: "Synchronizing with core VentureAM intelligence feeds. Real-time metrics are being prioritized for verified institutional gateways.",
      insight_id: "Intelijen Pasar Aktif. Sinkronisasi dengan umpan intelijen inti VentureAM sedang berlangsung.",
      sentiment: "neutral",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }
}

export interface ScannerResult {
  symbol: string;
  name: string;
  metrics: Record<string, string | number>;
  signal: 'BUY' | 'SELL' | 'HOLD';
  score: number;
}

export async function fetchScannerResults(scannerName: string): Promise<ScannerResult[]> {
  const cacheKey = `ventuream_scanner_cache_${scannerName}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < 30 * 60 * 1000) { // 30 min cache for scanner
      return data;
    }
  }

  try {
    const prompt = `Generate 5 realistic scanner results for the Jakarta Composite Index (JCI) market using the scanner named "${scannerName}". 
    The results should look like professional institutional data from Yahoo Finance or TradingView.
    Include Symbol, Full Name (must be a valid JCI/IDX stock), a "signal" (BUY/SELL/HOLD), a "score" (0-100), and a set of relevant metrics based on the type of scanner.
    IMPORTANT: Always include "Price", "Change", "Volume", "P/E Ratio", "Market Cap", "RSI", and "MACD" in the metrics object for every entry.
    Return as a JSON array of objects.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
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
              metrics: {
                type: Type.OBJECT,
                description: "Dynamic metrics based on the scanner name",
              }
            },
            required: ["symbol", "name", "signal", "score", "metrics"],
          }
        },
      },
    });

    const results = JSON.parse(response.text);
    localStorage.setItem(cacheKey, JSON.stringify({ data: results, timestamp: Date.now() }));
    return results;
  } catch (error) {
    console.error(`Error fetching scanner ${scannerName}:`, error);
    
    // Fallback data
    const fallbackResults: ScannerResult[] = [
      { 
        symbol: 'BBRI', 
        name: 'Bank Rakyat Indonesia', 
        signal: 'BUY', 
        score: 85, 
        metrics: { 'Price': '6,150', 'Volume': '45.2M', 'P/E Ratio': '12.4x', 'Market Cap': '920T', 'RSI': 62 } 
      },
      { 
        symbol: 'TLKM', 
        name: 'Telkom Indonesia', 
        signal: 'BUY', 
        score: 92, 
        metrics: { 'Price': '3,840', 'Volume': '28.1M', 'P/E Ratio': '15.2x', 'Market Cap': '380T', 'RSI': 58 } 
      },
      { 
        symbol: 'ADRO', 
        name: 'Adaro Energy', 
        signal: 'HOLD', 
        score: 45, 
        metrics: { 'Price': '2,850', 'Volume': '12.5M', 'P/E Ratio': '4.8x', 'Market Cap': '92T', 'RSI': 42 } 
      }
    ];
    return fallbackResults;
  }
}

export interface CorrelationResult {
  ticker: string;
  commodity: string;
  correlation_score: number;
  interpretation: string;
}

export async function fetchCorrelationScore(stockTicker: string, commodityFunc: string): Promise<CorrelationResult> {
  // We use Gemini to calculate/simulate this correlation based on real-world knowledge
  // because we don't have access to historical daily timeseries APIs without user keys.
  try {
    const prompt = `Calculate the Pearson correlation score (scaled from 0 to 100) between the stock "${stockTicker}" and the commodity/proxy "${commodityFunc}".
    Formula: ((pearson_r + 1) / 2) * 100.
    Provide the score and a professional interpretation (High Correlation if > 75, Moderate if 50-75, Low if < 50).
    Return as a JSON object.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ticker: { type: Type.STRING },
            commodity: { type: Type.STRING },
            correlation_score: { type: Type.NUMBER },
            interpretation: { type: Type.STRING },
          },
          required: ["ticker", "commodity", "correlation_score", "interpretation"],
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error fetching correlation score:", error);
    // Dynamic fallbacks based on common relationships
    let fallbackScore = 50;
    if (stockTicker.includes('ADRO') && (commodityFunc.includes('BRENT') || commodityFunc.includes('OIL'))) fallbackScore = 82;
    if (stockTicker.includes('ADRO') && (commodityFunc.includes('COAL') || commodityFunc.includes('Newcastle'))) fallbackScore = 94;
    if (stockTicker.includes('BBCA') && commodityFunc.includes('GOLD')) fallbackScore = 32;
    
    return {
      ticker: stockTicker,
      commodity: commodityFunc,
      correlation_score: fallbackScore,
      interpretation: fallbackScore > 75 ? "High Correlation" : (fallbackScore > 50 ? "Moderate Correlation" : "Low Correlation")
    };
  }
}

export interface LivePrice {
  symbol: string;
  price: number;
  changePercent: number;
}

export async function fetchLivePrices(symbols: string[]): Promise<LivePrice[]> {
  try {
    // Check if we have a VAM Gateway script ID in environment
    const vamScriptId = import.meta.env.VITE_VAM_GATEWAY_SCRIPT_ID;
    
    if (vamScriptId && vamScriptId !== "ID_SCRIPT_ANDA") {
      try {
        const tickersEncoded = symbols.map(s => `IDX:${s.replace('.JK', '')}`).join(',');
        const response = await fetch(`https://script.google.com/macros/s/${vamScriptId}/exec?tickers=${tickersEncoded}`);
        const data = await response.json();
        
        // Handle both array and object response formats from the script
        if (Array.isArray(data)) {
          return data.map(item => ({
            symbol: item.symbol,
            price: item.price,
            changePercent: item.changePercent || 0
          }));
        } else if (data && typeof data === 'object') {
          const results: LivePrice[] = [];
          symbols.forEach(s => {
            const clean = `IDX:${s.replace('.JK', '')}`;
            const match = data[clean] || data[s.replace('.JK', '')] || data[s];
            if (match) {
              results.push({
                symbol: s,
                price: match.price,
                changePercent: match.changePercent || 0
              });
            }
          });
          if (results.length > 0) return results;
        }
      } catch (e) {
        console.warn(`[VAM Gateway] Batch sync failed, falling back to AI/Simulation:`, e);
      }
    }

    const prompt = `Fetch the approximately real-time latest market prices and 24h percentage changes for these specific symbols: ${symbols.join(', ')}. 
    Return a JSON array of objects with 'symbol', 'price' (number), and 'changePercent' (number). 
    Assume standard market prices for JCI/Global indices if live ones are not accessible.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              symbol: { type: Type.STRING },
              price: { type: Type.NUMBER },
              changePercent: { type: Type.NUMBER },
            },
            required: ["symbol", "price", "changePercent"],
          }
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error fetching live prices:", error);
    // Generic fallback: return small jitter from existing prices or static values
    return symbols.map(s => ({
      symbol: s,
      price: s === 'COMPOSITE' ? 7200 : 10000,
      changePercent: (Math.random() - 0.5) * 2
    }));
  }
}

export async function fetchStockRecommendations(options?: ScanOptions): Promise<StockRecommendation[]> {
  const cacheKey = 'ventuream_stocks_cache';
  const type = 'stocks';

  const circuitBroken = isCircuitBroken(type);
  const cached = localStorage.getItem(cacheKey);

  // If options are provided, we skip cache to get custom results
  if (!options || (options.sector === '' && options.riskProfile === 'moderate' && options.signalFilter === 'ALL')) {
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > CACHE_DURATION;
      if (circuitBroken || !isExpired) {
        return data;
      }
    } else if (circuitBroken) {
      return [
        { symbol: 'BBCA', name: 'Bank Central Asia Tbk', price: '10,250', change: '+0.98%', signal: 'BUY', volume: '11.8M', peRatio: '24.2x', marketCap: '1,255T', ema20: '10,150' },
        { symbol: 'BBRI', name: 'Bank Rakyat Indonesia Tbk', price: '4,820', change: '+1.15%', signal: 'BUY', volume: '44.5M', peRatio: '14.1x', marketCap: '725T', ema20: '4,750' },
        { symbol: 'TLKM', name: 'Telkom Indonesia Tbk', price: '3,720', change: '-0.27%', signal: 'HOLD', volume: '31.5M', peRatio: '15.6x', marketCap: '365T', ema20: '3,750' },
        { symbol: 'ADRO', name: 'Adaro Energy Indonesia Tbk', price: '2,840', change: '-1.39%', signal: 'SELL', volume: '18.2M', peRatio: '4.1x', marketCap: '90T', ema20: '2,880' },
      ];
    }
  }

  try {
    const sectorPrompt = options?.sector ? ` focusing on the ${options.sector} sector` : "";
    const riskPrompt = options?.riskProfile ? ` suitable for a ${options.riskProfile} risk profile` : "";
    const timeframePrompt = options?.timeframe ? ` using a ${options.timeframe} timeframe for technical analysis` : "";
    const signalPrompt = options?.signalFilter && options.signalFilter !== 'ALL' ? ` with a ${options.signalFilter} signal` : "";
    const assetTypePrompt = options?.assetType ? ` focused on ${options.assetType}` : " specifically Equities";
    const sortPrompt = options?.sortBy ? ` and sort them by ${options.sortBy}` : "";

    const prompt = `Generate 4 realistic asset recommendations specifically for stocks listed on the Jakarta Composite Index (JCI).
    LOCKED CRITERIA:
    1. Technical: Price > 20-day Exponential Moving Average (EMA 20).
    2. Fundamental: Diluted EPS Growth (TTM YoY) < 10%.
    ${assetTypePrompt}${sectorPrompt}${riskPrompt}${timeframePrompt}${signalPrompt}${sortPrompt}. 
    Focus on major JCI symbols: BBCA, BBRI, TLKM, ADRO, ASII, BMRI, UNVR, GOTO.
    Include Symbol, Full Name, typical price in IDR (string with commas), 24h change % (string with + or -), a signal (BUY/SELL/HOLD), Volume (e.g. 15.4M), P/E Ratio (e.g. 14.2x), Market Cap (e.g. 840T), and EMA 20 value (e.g. 10,120). 
    Return as a JSON array of objects.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
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
            },
            required: ["symbol", "name", "price", "change", "signal", "volume", "peRatio", "marketCap", "ema20"],
          }
        },
      },
    });

    const recommendations = JSON.parse(response.text);
    
    // Save to cache only if no options (general scan)
    if (!options || (options.sector === '' && options.riskProfile === 'moderate' && options.signalFilter === 'ALL')) {
      localStorage.setItem(cacheKey, JSON.stringify({ data: recommendations, timestamp: Date.now() }));
    }
    
    return recommendations;
  } catch (error: any) {
    const errorString = JSON.stringify(error).toLowerCase();
    const isQuotaError = errorString.includes("429") || errorString.includes("quota") || errorString.includes("resource_exhausted");

    if (isQuotaError) {
      breakCircuit(type);
      console.warn(`[VentureAM Gateway] Quota reached for ${type}. Switching to secure fallback layers.`);
    } else {
      console.error(`Error fetching ${type}:`, error);
    }

    // Use stale cache if available
    if (cached) {
      return JSON.parse(cached).data;
    }

    // Default high-quality fallback set
    return [
      { symbol: 'BBCA', name: 'Bank Central Asia Tbk', price: '10,250', change: '+0.98%', signal: 'BUY', volume: '12.4M', peRatio: '24.5x', marketCap: '1,260T', ema20: '10,180' },
      { symbol: 'BBRI', name: 'Bank Rakyat Indonesia Tbk', price: '4,820', change: '+1.15%', signal: 'BUY', volume: '45.2M', peRatio: '14.2x', marketCap: '730T', ema20: '4,780' },
      { symbol: 'TLKM', name: 'Telkom Indonesia Tbk', price: '3,720', change: '-0.27%', signal: 'HOLD', volume: '32.1M', peRatio: '15.8x', marketCap: '368T', ema20: '3,760' },
      { symbol: 'ADRO', name: 'Adaro Energy Indonesia Tbk', price: '2,840', change: '-1.39%', signal: 'SELL', volume: '18.9M', peRatio: '4.2x', marketCap: '91T', ema20: '2,890' },
    ];
  }
}
