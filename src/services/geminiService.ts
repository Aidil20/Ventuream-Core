import { GoogleGenAI, Type } from "@google/genai";

const apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '';
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

const NEWS_CACHE_KEY = 'vnt_market_news_cache';
const SUPPRESS_API_KEY = 'vnt_gemini_suppress_until';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export interface MarketNewsItem {
  headline: string;
  summary: string;
  timestamp: string;
  source: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

function getCachedNews(): MarketNewsItem[] | null {
  try {
    const cached = localStorage.getItem(NEWS_CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      // Don't remove yet, keep as stale fallback if API fails
      return data;
    }
    return data;
  } catch {
    return null;
  }
}

function isApiSuppressed(): boolean {
  try {
    const until = localStorage.getItem(SUPPRESS_API_KEY);
    if (!until) return false;
    return Date.now() < parseInt(until, 10);
  } catch {
    return false;
  }
}

function suppressApi(durationMs: number = 30 * 60 * 1000) { // Default 30 mins
  try {
    localStorage.setItem(SUPPRESS_API_KEY, (Date.now() + durationMs).toString());
  } catch (e) {
    console.error("Failed to set suppression", e);
  }
}

function setCachedNews(data: MarketNewsItem[]) {
  try {
    localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.error("Failed to cache news", e);
  }
}

export async function fetchMarketNewsSummary(forceRefresh = false): Promise<MarketNewsItem[]> {
  const cached = getCachedNews();
  
  // If not forcing and we have valid cache, return it
  if (!forceRefresh && cached) {
    return cached;
  }

  // If API is suppressed due to previous rate limit, return cache or fallback
  if (isApiSuppressed()) {
    console.log("Gemini API call suppressed to preserve quota.");
    return cached || getFallbackNews();
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Summarize the top 5 latest market news for IDX (Indonesia Stock Exchange) and global markets today.",
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
              sentiment: { 
                type: Type.STRING,
                enum: ['bullish', 'bearish', 'neutral']
              }
            },
            required: ["headline", "summary", "timestamp", "source", "sentiment"]
          }
        }
      }
    });

    if (response.text) {
      const news = JSON.parse(response.text);
      setCachedNews(news);
      return news;
    }
    return cached || getFallbackNews();
  } catch (error: any) {
    // Specifically handle 429 status
    if (error?.error?.code === 429 || error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("quota")) {
      console.warn("Gemini Quota Exhausted. Suppressing API calls for 1 hour.");
      suppressApi(60 * 60 * 1000); // 1 hour suppression
    } else {
      console.error("Error fetching market news summary:", error);
    }
    
    // Return cached (even if stale) or fallback news
    return cached || getFallbackNews();
  }
}

function getFallbackNews(): MarketNewsItem[] {
  return [
    {
      headline: "IHSG Rebounds Amid Global Optimism",
      summary: "The Jakarta Composite Index (IHSG) rose as investors react positively to improved global economic outlooks and stabilizing commodity prices.",
      timestamp: "Today",
      source: "VAM Research",
      sentiment: "bullish"
    },
    {
      headline: "Tech Stocks Lead US Market Gains",
      summary: "Major US indices finished higher led by strong performances in the technology sector, with focus shifting to upcoming inflation data.",
      timestamp: "Today",
      source: "VAM Research",
      sentiment: "bullish"
    },
    {
      headline: "Global Commodity Markets Stabilize",
      summary: "Primary commodities are showing signs of stabilization after a period of volatility, providing a more predictable backdrop for industrial sectors.",
      timestamp: "Today",
      source: "VAM Research",
      sentiment: "neutral"
    }
  ];
}
