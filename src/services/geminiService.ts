const NEWS_CACHE_KEY = 'vnt_market_news_cache';
const SUPPRESS_API_KEY = 'vnt_gemini_suppress_until';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export interface MarketNewsItem {
  headline: string;
  summary: string;
  timestamp: string;
  source: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  score?: number;
  confidence?: number;
  url?: string;
}

function getCachedNews(key: string): MarketNewsItem[] | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      return data;
    }
    return data;
  } catch {
    return null;
  }
}

function setCachedNews(key: string, data: MarketNewsItem[]) {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.error("Failed to cache news", e);
  }
}

export async function fetchMarketNewsSummary(forceRefresh = false, symbol?: string): Promise<MarketNewsItem[]> {
  const cacheKey = symbol ? `${NEWS_CACHE_KEY}_${symbol}` : NEWS_CACHE_KEY;
  const cached = getCachedNews(cacheKey);
  
  if (!forceRefresh && cached) {
    return cached;
  }

  try {
    const baseUrl = "/api/news";
    const params = new URLSearchParams();
    if (symbol) params.append('symbol', symbol);
    if (forceRefresh) params.append('force', 'true');
    
    const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    
    // Use an AbortController for institutional-grade timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const response = await fetch(url, { signal: controller.signal }).catch(err => {
      clearTimeout(timeoutId);
      console.warn("VAM News fetch soft-fail:", err.message);
      throw new Error(`Network failure: ${err.message || 'Check connection'}`);
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown error");
      console.error(`News API responded with ${response.status}: ${errText}`);
      throw new Error(`Server error: ${response.status}`);
    }

    const news = await response.json();
    
    // Stricter validation of institutional data
    if (!news || !Array.isArray(news) || news.length === 0) {
       console.warn("[VAM GATEWAY] Received empty news payload, using fallback.");
       return cached || getFallbackNews();
    }

    setCachedNews(cacheKey, news);
    return news;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn("[VAM GATEWAY] News fetch timed out. Using cached/fallback data.");
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
      sentiment: "bullish",
      url: "https://investasi.kontan.co.id"
    },
    {
      headline: "Tech Stocks Lead US Market Gains",
      summary: "Major US indices finished higher led by strong performances in the technology sector, with focus shifting to upcoming inflation data.",
      timestamp: "Today",
      source: "VAM Research",
      sentiment: "bullish",
      url: "https://www.bloomberg.com/markets"
    },
    {
      headline: "Global Commodity Markets Stabilize",
      summary: "Primary commodities are showing signs of stabilization after a period of volatility, providing a more predictable backdrop for industrial sectors.",
      timestamp: "Today",
      source: "VAM Research",
      sentiment: "neutral",
      url: "https://www.reuters.com/business"
    }
  ];
}
