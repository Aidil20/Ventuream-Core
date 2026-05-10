import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
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
}

export interface ScanOptions {
  sector?: string;
  riskProfile?: string;
  signalFilter?: string;
  assetType?: string;
  sortBy?: 'price' | 'change' | 'signal';
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
      model: "gemini-1.5-flash",
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
        { symbol: 'BBCA', name: 'Bank Central Asia', price: '10,250', change: '+0.5%', signal: 'HOLD' },
        { symbol: 'TLKM', name: 'Telkom Indonesia', price: '3,840', change: '+1.2%', signal: 'BUY' },
        { symbol: 'ADRO', name: 'Adaro Energy Indonesia', price: '2,850', change: '-0.3%', signal: 'BUY' },
        { symbol: 'GOTO', name: 'GoTo Gojek Tokopedia', price: '68', change: '0.0%', signal: 'HOLD' },
      ];
    }
  }

  try {
    const sectorPrompt = options?.sector ? ` focusing on the ${options.sector} sector` : "";
    const riskPrompt = options?.riskProfile ? ` suitable for a ${options.riskProfile} risk profile` : "";
    const signalPrompt = options?.signalFilter && options.signalFilter !== 'ALL' ? ` with a ${options.signalFilter} signal` : "";
    const assetTypePrompt = options?.assetType ? ` focused on ${options.assetType}` : " specifically Equities";
    const sortPrompt = options?.sortBy ? ` and sort them by ${options.sortBy}` : "";

    const prompt = `Generate 4 realistic asset recommendations for the Indonesian market${assetTypePrompt}${sectorPrompt}${riskPrompt}${signalPrompt}${sortPrompt}. Include Symbol, Full Name, typical price in IDR (string with commas), 24h change % (string with + or -), and a signal (BUY/SELL/HOLD). Return as a JSON array of objects.`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
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
            },
            required: ["symbol", "name", "price", "change", "signal"],
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
      { symbol: 'BBCA', name: 'Bank Central Asia', price: '10,250', change: '+0.5%', signal: 'HOLD' },
      { symbol: 'TLKM', name: 'Telkom Indonesia', price: '3,840', change: '+1.2%', signal: 'BUY' },
      { symbol: 'ADRO', name: 'Adaro Energy Indonesia', price: '2,850', change: '-0.3%', signal: 'BUY' },
      { symbol: 'GOTO', name: 'GoTo Gojek Tokopedia', price: '68', change: '0.0%', signal: 'HOLD' },
    ];
  }
}
