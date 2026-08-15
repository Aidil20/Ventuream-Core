import { getStockInfo, normalizeTicker, formatStockPrice, getKnownStockPrice, roundToValidTick } from './stockUtils';

export interface OHLCVBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SwingPoint {
  index: number;
  date: string;
  type: 'SWING_HIGH' | 'SWING_LOW';
  price: number;
  strength: number; // e.g. lookback radius
  volume: number;
  label: string;
  isMajor: boolean;
}

export interface SRBand {
  id: string;
  type: 'RESISTANCE' | 'SUPPORT' | 'MIDPOINT' | 'FIBONACCI';
  tier: 'MAJOR' | 'INTERMEDIATE' | 'MINOR' | 'GOLDEN_POCKET' | 'MIDPOINT';
  label: string;
  code: string; // e.g., "R1", "R2", "R3", "S1", "S2", "S3", "EQ", "FIB-0.618"
  corePrice: number;
  upperPrice: number;
  lowerPrice: number;
  bandSpreadPct: number;
  testCount: number;
  strengthScore: number; // 1 - 100
  distancePct: number; // % from current price (+ above, - below)
  isNearest: boolean;
  status: 'HOLDING' | 'TESTING' | 'PROXIMITY_ALERT' | 'BREAKOUT_ZONE';
  touchDates: string[];
  tacticalNote: string;
}

export interface SwingAnalysisResult {
  symbol: string;
  cleanTicker: string;
  market: string;
  currentPrice: number;
  currencySymbol: string;
  lookbackBars: number;
  bars: OHLCVBar[];
  majorSwingHigh: SwingPoint;
  majorSwingLow: SwingPoint;
  rangeHigh: number;
  rangeLow: number;
  rangeSpreadPct: number;
  detectedSwingHighs: SwingPoint[];
  detectedSwingLows: SwingPoint[];
  resistanceBands: SRBand[];
  supportBands: SRBand[];
  fibonacciBands: SRBand[];
  nearestResistance: SRBand | null;
  nearestSupport: SRBand | null;
  pricePositionInRange: number; // 0 to 100%
  activeTacticalBias: 'BULLISH_SUPPORT_BOUNCE' | 'BEARISH_RESISTANCE_REJECTION' | 'RANGE_MIDPOINT_CONSOLIDATION' | 'BREAKOUT_ABOVE_RESISTANCE' | 'BREAKDOWN_BELOW_SUPPORT';
  tacticalSummary: string;
  proximityAlert: {
    active: boolean;
    bandLabel: string;
    distancePct: number;
    type: 'RESISTANCE' | 'SUPPORT';
    message: string;
  } | null;
  generatedPineScript: string;
}

/**
 * Generate historical price series for any symbol with realistic price swings & volatility
 */
export function getHistoricalBarsForSymbol(
  symbolStr: string, 
  barCount: number = 90,
  overrideBasePrice?: number
): OHLCVBar[] {
  const norm = normalizeTicker(symbolStr);
  const info = getStockInfo(symbolStr);

  let basePrice = overrideBasePrice || getKnownStockPrice(symbolStr);
  let volatility = 0.018;
  let volumeBase = 50000000;

  if (info.currency === 'USD') {
    volatility = norm === 'NVDA' || norm === 'TSLA' ? 0.032 : 0.016;
    volumeBase = 45000000;
  } else {
    if (basePrice < 100) {
      volatility = 0.045;
      volumeBase = 250000000;
    } else if (basePrice < 500) {
      volatility = 0.035;
      volumeBase = 95000000;
    } else if (basePrice < 3000) {
      volatility = 0.022;
      volumeBase = 65000000;
    } else {
      volatility = 0.015;
      volumeBase = 55000000;
    }
  }

  const bars: OHLCVBar[] = [];
  const today = new Date('2026-06-16');
  let currentPrice = basePrice;
  let daysGenerated = 0;
  let currentDate = new Date(today);

  // Deterministic pseudo-random seed based on symbol name to make swings stable per ticker
  let seed = 0;
  for (let i = 0; i < norm.length; i++) {
    seed += norm.charCodeAt(i) * (i + 1);
  }
  const pseudoRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  while (daysGenerated < barCount) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Harmonic wave to generate clear, authentic multi-week swing cycles (highs and lows)
      const wavePhase = (daysGenerated / 14) * Math.PI * 2;
      const microNoise = (pseudoRandom() - 0.485) * 2 * volatility;
      const waveFactor = Math.sin(wavePhase) * volatility * 0.9;
      
      const changePct = waveFactor + microNoise;
      const close = currentPrice;
      const open = Math.max(1, currentPrice / (1 + changePct));
      const candleSpread = Math.abs(close - open);
      const high = Math.max(open, close) + candleSpread * (0.3 + pseudoRandom() * 0.8) + (open * volatility * 0.4);
      const low = Math.min(open, close) - candleSpread * (0.3 + pseudoRandom() * 0.8) - (open * volatility * 0.4);
      const volume = Math.round(volumeBase * (0.6 + pseudoRandom() * 0.9));

      const isDecimals = basePrice < 1000 && info.currency === 'USD';
      bars.push({
        date: currentDate.toISOString().split('T')[0],
        open: isDecimals ? Number(open.toFixed(2)) : roundToValidTick(open, info.market),
        high: isDecimals ? Number(high.toFixed(2)) : roundToValidTick(high, info.market),
        low: isDecimals ? Math.max(1, Number(low.toFixed(2))) : Math.max(1, roundToValidTick(low, info.market)),
        close: isDecimals ? Number(close.toFixed(2)) : roundToValidTick(close, info.market),
        volume
      });

      currentPrice = open;
      daysGenerated++;
    }
    currentDate.setDate(currentDate.getDate() - 1);
  }

  // Reverse so chronological order (oldest bar at index 0, latest bar at index N-1)
  const chronological = bars.reverse();

  // Ensure latest bar close matches basePrice exactly
  if (chronological.length > 0) {
    const last = chronological[chronological.length - 1];
    last.close = basePrice;
    last.high = Math.max(last.high, basePrice);
    last.low = Math.min(last.low, basePrice);
  }

  return chronological;
}

/**
 * Detect Swing Highs & Lows using Multi-Bar Fractal Peak & Trough Recognition
 */
export function detectSwingPoints(bars: OHLCVBar[], lookbackRadius: number = 4): { swingHighs: SwingPoint[]; swingLows: SwingPoint[] } {
  const swingHighs: SwingPoint[] = [];
  const swingLows: SwingPoint[] = [];

  const n = bars.length;
  if (n < lookbackRadius * 2 + 1) return { swingHighs, swingLows };

  for (let i = lookbackRadius; i < n - 1; i++) {
    const current = bars[i];

    // Check if current bar is a Swing High (higher than adjacent bars in radius)
    let isSwingHigh = true;
    for (let r = 1; r <= lookbackRadius; r++) {
      if (bars[i - r].high >= current.high || (i + r < n && bars[i + r].high > current.high)) {
        isSwingHigh = false;
        break;
      }
    }

    if (isSwingHigh) {
      swingHighs.push({
        index: i,
        date: current.date,
        type: 'SWING_HIGH',
        price: current.high,
        strength: lookbackRadius,
        volume: current.volume,
        label: `Swing High (${current.date})`,
        isMajor: false
      });
    }

    // Check if current bar is a Swing Low (lower than adjacent bars in radius)
    let isSwingLow = true;
    for (let r = 1; r <= lookbackRadius; r++) {
      if (bars[i - r].low <= current.low || (i + r < n && bars[i + r].low < current.low)) {
        isSwingLow = false;
        break;
      }
    }

    if (isSwingLow) {
      swingLows.push({
        index: i,
        date: current.date,
        type: 'SWING_LOW',
        price: current.low,
        strength: lookbackRadius,
        volume: current.volume,
        label: `Swing Low (${current.date})`,
        isMajor: false
      });
    }
  }

  return { swingHighs, swingLows };
}

/**
 * Cluster raw swing points into cohesive Support & Resistance Bands with upper/lower channel buffers
 */
export function clusterSwingPointsIntoBands(
  points: SwingPoint[],
  type: 'RESISTANCE' | 'SUPPORT',
  currentPrice: number,
  currencySymbol: string,
  tolerancePct: number = 0.016 // 1.6% cluster window
): SRBand[] {
  if (points.length === 0) return [];

  // Sort points by price
  const sorted = [...points].sort((a, b) => a.price - b.price);
  const clusters: SwingPoint[][] = [];

  let currentCluster: SwingPoint[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = currentCluster[currentCluster.length - 1];
    const curr = sorted[i];

    const diffPct = Math.abs(curr.price - prev.price) / prev.price;
    if (diffPct <= tolerancePct) {
      currentCluster.push(curr);
    } else {
      clusters.push(currentCluster);
      currentCluster = [curr];
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // Convert clusters into SRBand objects
  const bands: SRBand[] = clusters.map((cluster, idx) => {
    const prices = cluster.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    // Core price weighted by volume
    const totalVol = cluster.reduce((acc, c) => acc + c.volume, 0);
    let corePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    if (totalVol > 0) {
      corePrice = cluster.reduce((acc, c) => acc + (c.price * c.volume), 0) / totalVol;
    }

    // Channel buffer (at least 0.5% band thickness)
    const bandThickness = Math.max((maxPrice - minPrice), corePrice * 0.008);
    const upperPrice = Math.max(maxPrice, corePrice + (bandThickness / 2));
    const lowerPrice = Math.min(minPrice, corePrice - (bandThickness / 2));
    const bandSpreadPct = ((upperPrice - lowerPrice) / corePrice) * 100;

    const distancePct = ((corePrice - currentPrice) / currentPrice) * 100;
    const testCount = cluster.length;
    const strengthScore = Math.min(98, Math.round(50 + testCount * 14 + (cluster.some(p => p.isMajor) ? 20 : 0)));

    let tier: SRBand['tier'] = 'MINOR';
    if (testCount >= 3 || cluster.some(p => p.isMajor)) {
      tier = 'MAJOR';
    } else if (testCount >= 2) {
      tier = 'INTERMEDIATE';
    }

    const touchDates = cluster.map(p => p.date);

    // Determine status
    let status: SRBand['status'] = 'HOLDING';
    if (Math.abs(distancePct) <= 1.2) {
      status = 'PROXIMITY_ALERT';
    } else if (Math.abs(distancePct) <= 2.5) {
      status = 'TESTING';
    }

    return {
      id: `${type.toLowerCase()}-band-${idx}-${Math.round(corePrice)}`,
      type,
      tier,
      label: `${type === 'RESISTANCE' ? 'R' : 'S'}${idx + 1} ${tier === 'MAJOR' ? 'Major' : 'Dynamic'} ${type === 'RESISTANCE' ? 'Ceiling' : 'Floor'}`,
      code: `${type === 'RESISTANCE' ? 'R' : 'S'}${idx + 1}`,
      corePrice: Math.round(corePrice * 100) / 100,
      upperPrice: Math.round(upperPrice * 100) / 100,
      lowerPrice: Math.round(lowerPrice * 100) / 100,
      bandSpreadPct: Math.round(bandSpreadPct * 10) / 10,
      testCount,
      strengthScore,
      distancePct: Math.round(distancePct * 10) / 10,
      isNearest: false,
      status,
      touchDates,
      tacticalNote: type === 'RESISTANCE'
        ? `Area resistensi hasil ${testCount}x swing high rejection. Potensi taking profit / resistance breakout.`
        : `Area support dari ${testCount}x swing low rejection. Zona akumulasi / penahan koreksi harga.`
    };
  });

  return bands;
}

/**
 * Generate full S/R Analysis including Swing Highs, Swing Lows, Dynamic Bands & Fibonacci Retracements
 */
export function analyzeAssetSwingSupportResistance(
  symbolStr: string,
  lookbackBars: number = 60,
  overrideCurrentPrice?: number
): SwingAnalysisResult {
  const info = getStockInfo(symbolStr);
  const cleanTicker = normalizeTicker(symbolStr);
  
  const knownPrice = overrideCurrentPrice || getKnownStockPrice(symbolStr);
  const bars = getHistoricalBarsForSymbol(symbolStr, Math.max(lookbackBars, 60), knownPrice);
  
  const latestBar = bars[bars.length - 1];
  const currentPrice = knownPrice || (latestBar ? latestBar.close : 5000);

  // Detect Swings
  const { swingHighs, swingLows } = detectSwingPoints(bars, 4);

  // Identify absolute Major High & Low in lookback range
  let maxHigh = -Infinity;
  let majorHighIndex = 0;
  let minLow = Infinity;
  let majorLowIndex = 0;

  bars.forEach((b, i) => {
    if (b.high > maxHigh) {
      maxHigh = b.high;
      majorHighIndex = i;
    }
    if (b.low < minLow) {
      minLow = b.low;
      majorLowIndex = i;
    }
  });

  // Ensure reasonable boundaries
  if (maxHigh <= currentPrice) {
    maxHigh = roundToValidTick(currentPrice * 1.15, info.market);
  }
  if (minLow >= currentPrice) {
    minLow = Math.max(1, roundToValidTick(currentPrice * 0.85, info.market));
  }

  const majorSwingHigh: SwingPoint = {
    index: majorHighIndex,
    date: bars[majorHighIndex]?.date || 'Recent Peak',
    type: 'SWING_HIGH',
    price: maxHigh,
    strength: 10,
    volume: bars[majorHighIndex]?.volume || 0,
    label: 'Major Swing High (Ceiling)',
    isMajor: true
  };

  const majorSwingLow: SwingPoint = {
    index: majorLowIndex,
    date: bars[majorLowIndex]?.date || 'Recent Trough',
    type: 'SWING_LOW',
    price: minLow,
    strength: 10,
    volume: bars[majorLowIndex]?.volume || 0,
    label: 'Major Swing Low (Base Floor)',
    isMajor: true
  };

  // Tag points that match major high/low
  swingHighs.forEach(sh => {
    if (Math.abs(sh.price - maxHigh) / maxHigh < 0.005) sh.isMajor = true;
  });
  swingLows.forEach(sl => {
    if (Math.abs(sl.price - minLow) / minLow < 0.005) sl.isMajor = true;
  });

  // Ensure major high and low are in the point lists
  if (!swingHighs.some(sh => sh.isMajor)) swingHighs.push(majorSwingHigh);
  if (!swingLows.some(sl => sl.isMajor)) swingLows.push(majorSwingLow);

  // Group into raw clusters
  const rawResistanceBands = clusterSwingPointsIntoBands(swingHighs, 'RESISTANCE', currentPrice, info.currencySymbol);
  const rawSupportBands = clusterSwingPointsIntoBands(swingLows, 'SUPPORT', currentPrice, info.currencySymbol);

  // Filter and build strictly ascending Resistance Bands (R1, R2, R3, R4) above current price
  const candidateResistances = rawResistanceBands
    .filter(b => b.corePrice > currentPrice * 1.002)
    .sort((a, b) => a.corePrice - b.corePrice);

  const swingRange = Math.max(1, maxHigh - minLow);
  const pivotPoint = (maxHigh + minLow + currentPrice) / 3;

  // Build definitive R1, R2, R3, R4
  const finalResistancePrices: number[] = [];
  candidateResistances.forEach(b => {
    if (!finalResistancePrices.some(p => Math.abs(p - b.corePrice) / b.corePrice < 0.02)) {
      finalResistancePrices.push(b.corePrice);
    }
  });

  // Supplement standard mathematical levels if fewer than 3 swing resistance points exist
  if (finalResistancePrices.length < 1) {
    finalResistancePrices.push(roundToValidTick(Math.max(currentPrice * 1.03, pivotPoint + (swingRange * 0.236)), info.market));
  }
  if (finalResistancePrices.length < 2) {
    const nextR = roundToValidTick(Math.max(finalResistancePrices[0] * 1.04, pivotPoint + (swingRange * 0.50)), info.market);
    finalResistancePrices.push(nextR);
  }
  if (finalResistancePrices.length < 3) {
    const nextR = roundToValidTick(Math.max(finalResistancePrices[1] * 1.05, maxHigh), info.market);
    finalResistancePrices.push(nextR);
  }
  if (finalResistancePrices.length < 4) {
    const nextR = roundToValidTick(Math.max(finalResistancePrices[2] * 1.06, maxHigh + (swingRange * 0.618)), info.market);
    finalResistancePrices.push(nextR);
  }

  // Sort ascending strictly
  finalResistancePrices.sort((a, b) => a - b);

  const resistanceBands: SRBand[] = finalResistancePrices.slice(0, 4).map((price, idx) => {
    const corePrice = roundToValidTick(price, info.market);
    const halfSpread = roundToValidTick(corePrice * 0.008, info.market);
    const upperPrice = roundToValidTick(corePrice + halfSpread, info.market);
    const lowerPrice = roundToValidTick(corePrice - halfSpread, info.market);
    const distancePct = Math.round(((corePrice - currentPrice) / currentPrice) * 1000) / 10;
    const bandSpreadPct = Math.round(((upperPrice - lowerPrice) / corePrice) * 1000) / 10;
    const code = `R${idx + 1}`;
    
    let tier: SRBand['tier'] = idx === 0 ? 'MINOR' : idx === 1 ? 'INTERMEDIATE' : 'MAJOR';
    if (Math.abs(corePrice - maxHigh) / maxHigh < 0.02) tier = 'MAJOR';

    return {
      id: `res-band-${code}-${corePrice}`,
      type: 'RESISTANCE',
      tier,
      label: `${code} ${idx === 0 ? 'Immediate Ceiling' : idx === 1 ? 'Key Swing Resistance' : idx === 2 ? 'Major Swing Ceiling' : 'Expansion Target'}`,
      code,
      corePrice,
      upperPrice,
      lowerPrice,
      bandSpreadPct,
      testCount: idx === 0 ? 3 : idx === 1 ? 2 : 1,
      strengthScore: Math.min(96, 70 + idx * 8),
      distancePct,
      isNearest: idx === 0,
      status: distancePct <= 1.5 ? 'PROXIMITY_ALERT' : 'HOLDING',
      touchDates: [majorSwingHigh.date],
      tacticalNote: idx === 0
        ? `Batas resistensi terdekat R1 (+${distancePct}%). Potensi uji aksi taking profit / breakout momentum.`
        : idx === 1
        ? `Batas resistensi kunci R2 (+${distancePct}%). Konfirmasi tren bullish kuat jika berhasil ditembus.`
        : `Target resistensi ekspansi / Major Ceiling R${idx + 1} (+${distancePct}%).`
    };
  });

  // Filter and build strictly descending Support Bands (S1, S2, S3, S4) below current price
  const candidateSupports = rawSupportBands
    .filter(b => b.corePrice < currentPrice * 0.998)
    .sort((a, b) => b.corePrice - a.corePrice);

  const finalSupportPrices: number[] = [];
  candidateSupports.forEach(b => {
    if (!finalSupportPrices.some(p => Math.abs(p - b.corePrice) / b.corePrice < 0.02)) {
      finalSupportPrices.push(b.corePrice);
    }
  });

  if (finalSupportPrices.length < 1) {
    finalSupportPrices.push(roundToValidTick(Math.min(currentPrice * 0.97, pivotPoint - (swingRange * 0.236)), info.market));
  }
  if (finalSupportPrices.length < 2) {
    const nextS = roundToValidTick(Math.min(finalSupportPrices[0] * 0.96, pivotPoint - (swingRange * 0.50)), info.market);
    finalSupportPrices.push(nextS);
  }
  if (finalSupportPrices.length < 3) {
    const nextS = roundToValidTick(Math.min(finalSupportPrices[1] * 0.95, minLow), info.market);
    finalSupportPrices.push(nextS);
  }
  if (finalSupportPrices.length < 4) {
    const nextS = roundToValidTick(Math.min(finalSupportPrices[2] * 0.94, Math.max(1, minLow - (swingRange * 0.382))), info.market);
    finalSupportPrices.push(nextS);
  }

  // Sort descending strictly
  finalSupportPrices.sort((a, b) => b - a);

  const supportBands: SRBand[] = finalSupportPrices.slice(0, 4).map((price, idx) => {
    const corePrice = roundToValidTick(price, info.market);
    const halfSpread = roundToValidTick(corePrice * 0.008, info.market);
    const upperPrice = roundToValidTick(corePrice + halfSpread, info.market);
    const lowerPrice = roundToValidTick(corePrice - halfSpread, info.market);
    const distancePct = Math.round(((corePrice - currentPrice) / currentPrice) * 1000) / 10;
    const bandSpreadPct = Math.round(((upperPrice - lowerPrice) / corePrice) * 1000) / 10;
    const code = `S${idx + 1}`;

    let tier: SRBand['tier'] = idx === 0 ? 'MINOR' : idx === 1 ? 'INTERMEDIATE' : 'MAJOR';
    if (Math.abs(corePrice - minLow) / minLow < 0.02) tier = 'MAJOR';

    return {
      id: `sup-band-${code}-${corePrice}`,
      type: 'SUPPORT',
      tier,
      label: `${code} ${idx === 0 ? 'Immediate Floor' : idx === 1 ? 'Key Swing Support' : idx === 2 ? 'Major Swing Floor' : 'Deep Base Support'}`,
      code,
      corePrice,
      upperPrice,
      lowerPrice,
      bandSpreadPct,
      testCount: idx === 0 ? 3 : idx === 1 ? 2 : 1,
      strengthScore: Math.min(96, 70 + idx * 8),
      distancePct,
      isNearest: idx === 0,
      status: Math.abs(distancePct) <= 1.5 ? 'PROXIMITY_ALERT' : 'HOLDING',
      touchDates: [majorSwingLow.date],
      tacticalNote: idx === 0
        ? `Batas support terdekat S1 (${distancePct}%). Titik pantulan pertama untuk menjaga momentum naik.`
        : idx === 1
        ? `Batas support kunci S2 (${distancePct}%). Area penahan koreksi sehat (pullback buy area).`
        : `Batas pertahanan terakhir / Major Base Floor S${idx + 1} (${distancePct}%). Stop loss wajib jika jebol.`
    };
  });

  // Nearest Resistance and Support
  const nearestResistance = resistanceBands.length > 0 ? resistanceBands[0] : null;
  const nearestSupport = supportBands.length > 0 ? supportBands[0] : null;

  // Calculate Fibonacci Retracement and Extension Levels based on Major Swing High & Low
  const rangeSpreadPct = Math.round(((maxHigh - minLow) / minLow) * 1000) / 10;
  const pricePositionInRange = Math.max(0, Math.min(100, Math.round(((currentPrice - minLow) / swingRange) * 100)));

  const fibRatios = [
    { ratio: 0.000, code: 'FIB-0.000', label: 'Fib 0.0% Major Swing High', tier: 'MAJOR' as const, note: 'Puncak tertinggi siklus swing (Major Ceiling)' },
    { ratio: 0.236, code: 'FIB-0.236', label: 'Fib 23.6% Pullback Support', tier: 'MINOR' as const, note: 'Level koreksi dangkal pada tren bullish kuat' },
    { ratio: 0.382, code: 'FIB-0.382', label: 'Fib 38.2% Intermediate Retracement', tier: 'INTERMEDIATE' as const, note: 'Area penahan koreksi pertama siklus sehat' },
    { ratio: 0.500, code: 'EQ-0.500', label: 'Equilibrium (50% Range Midpoint)', tier: 'MIDPOINT' as const, note: 'Titik tengah keseimbangan kekuatan Buyer vs Seller' },
    { ratio: 0.618, code: 'FIB-0.618', label: 'Golden Pocket (61.8% Key Level)', tier: 'GOLDEN_POCKET' as const, note: 'Golden Ratio — Probabilitas pantulan pembalikan arah (reversal) tertinggi' },
    { ratio: 0.786, code: 'FIB-0.786', label: 'Fib 78.6% Deep Retracement', tier: 'INTERMEDIATE' as const, note: 'Area koreksi dalam sebelum menguji dasar swing' },
    { ratio: 1.000, code: 'FIB-1.000', label: 'Fib 100.0% Major Swing Low', tier: 'MAJOR' as const, note: 'Dasar lantai terendah siklus swing (Major Floor)' },
    { ratio: -0.618, code: 'EXT-1.618', label: 'Fib 161.8% Golden Extension Target', tier: 'GOLDEN_POCKET' as const, note: 'Target ekspansi profit lanjutan pasca breakout All-Time High' }
  ];

  const fibonacciBands: SRBand[] = fibRatios.map(f => {
    let rawFibPrice = maxHigh - (swingRange * f.ratio);
    if (f.ratio === -0.618) {
      rawFibPrice = maxHigh + (swingRange * 0.618);
    }

    const corePrice = roundToValidTick(rawFibPrice, info.market);
    const halfSpread = roundToValidTick(corePrice * 0.006, info.market);
    const upperPrice = roundToValidTick(corePrice + halfSpread, info.market);
    const lowerPrice = roundToValidTick(corePrice - halfSpread, info.market);
    const distPct = Math.round(((corePrice - currentPrice) / currentPrice) * 1000) / 10;

    return {
      id: `fib-band-${f.code}`,
      type: 'FIBONACCI',
      tier: f.tier,
      label: f.label,
      code: f.code,
      corePrice,
      upperPrice,
      lowerPrice,
      bandSpreadPct: 1.2,
      testCount: 2,
      strengthScore: f.ratio === 0.618 || f.ratio === -0.618 ? 96 : f.ratio === 0.5 ? 90 : 82,
      distancePct: distPct,
      isNearest: false,
      status: Math.abs(distPct) <= 1.2 ? 'PROXIMITY_ALERT' : 'HOLDING',
      touchDates: [majorSwingHigh.date, majorSwingLow.date],
      tacticalNote: f.note
    };
  });

  // Tactical bias & Summary
  let activeTacticalBias: SwingAnalysisResult['activeTacticalBias'] = 'RANGE_MIDPOINT_CONSOLIDATION';
  let tacticalSummary = '';

  if (nearestResistance && nearestResistance.distancePct <= 1.8 && nearestResistance.distancePct >= 0) {
    activeTacticalBias = 'BEARISH_RESISTANCE_REJECTION';
    tacticalSummary = `Harga sedang menguji area batas atas (${nearestResistance.label} @ ${formatStockPrice(nearestResistance.corePrice, symbolStr)}). Waspadai penolakan harga atau siapkan entri breakout jika volume melonjak masif.`;
  } else if (nearestSupport && Math.abs(nearestSupport.distancePct) <= 1.8) {
    activeTacticalBias = 'BULLISH_SUPPORT_BOUNCE';
    tacticalSummary = `Harga berada di zona batas pantulan (${nearestSupport.label} @ ${formatStockPrice(nearestSupport.corePrice, symbolStr)}). Peluang swing buy dengan risk/reward optimal dan batas cut loss terukur.`;
  } else if (currentPrice >= maxHigh) {
    activeTacticalBias = 'BREAKOUT_ABOVE_RESISTANCE';
    tacticalSummary = `Harga berhasil breakout menembus Major Swing High (${formatStockPrice(maxHigh, symbolStr)}). Target ekspansi berikutnya menuju Fib 161.8% (${formatStockPrice(maxHigh + (swingRange * 0.618), symbolStr)}).`;
  } else if (currentPrice <= minLow) {
    activeTacticalBias = 'BREAKDOWN_BELOW_SUPPORT';
    tacticalSummary = `Harga berada di bawah batas lantai Major Swing Low (${formatStockPrice(minLow, symbolStr)}). Disiplin stop-loss diutamakan.`;
  } else {
    activeTacticalBias = 'RANGE_MIDPOINT_CONSOLIDATION';
    tacticalSummary = `Harga bergerak stabil di dalam koridor swing ${formatStockPrice(minLow, symbolStr)} (Floor) s/d ${formatStockPrice(maxHigh, symbolStr)} (Ceiling). Posisi harga berada di level ${pricePositionInRange}% dari total range.`;
  }

  // Proximity Alert
  let proximityAlert: SwingAnalysisResult['proximityAlert'] = null;
  if (nearestResistance && nearestResistance.distancePct <= 1.8 && nearestResistance.distancePct >= 0) {
    proximityAlert = {
      active: true,
      bandLabel: `${nearestResistance.label} (${formatStockPrice(nearestResistance.corePrice, symbolStr)})`,
      distancePct: nearestResistance.distancePct,
      type: 'RESISTANCE',
      message: `Harga mendekati ${nearestResistance.label} (+${nearestResistance.distancePct}%). Pantau level ${formatStockPrice(nearestResistance.corePrice, symbolStr)} untuk take profit atau breakout rally!`
    };
  } else if (nearestSupport && Math.abs(nearestSupport.distancePct) <= 1.8) {
    proximityAlert = {
      active: true,
      bandLabel: `${nearestSupport.label} (${formatStockPrice(nearestSupport.corePrice, symbolStr)})`,
      distancePct: nearestSupport.distancePct,
      type: 'SUPPORT',
      message: `Harga menguji ${nearestSupport.label} (${nearestSupport.distancePct}%). Batas support kuat di ${formatStockPrice(nearestSupport.corePrice, symbolStr)} untuk peluang pantulan (swing bounce)!`
    };
  }

  // Generate Pine Script v5 Code with exact Swing High/Low Bands and R1/R2/R3/S1/S2/S3
  const generatedPineScript = `//@version=5
indicator("VentureAM - Visual Swing High & Low S/R Bands [${cleanTicker}]", overlay=true)

// Asset: ${cleanTicker} (${info.name})
// Detected Range: ${formatStockPrice(minLow, symbolStr)} - ${formatStockPrice(maxHigh, symbolStr)}
// Live Price: ${formatStockPrice(currentPrice, symbolStr)}

// Major Swing Boundaries
highBand = ${maxHigh}
lowBand = ${minLow}
eqBand = ${(maxHigh + minLow) / 2}

// Plot Support & Resistance Levels
plot(highBand, "Major Ceiling (Resistance)", color=color.new(color.red, 20), linewidth=2, style=plot.style_line)
plot(lowBand, "Major Floor (Support)", color=color.new(color.green, 20), linewidth=2, style=plot.style_line)
plot(eqBand, "Range Equilibrium (EQ 50%)", color=color.new(color.yellow, 40), linewidth=1, style=plot.style_circles)

${resistanceBands.slice(0, 3).map((r, i) => `
// Resistance Band ${r.code} (${formatStockPrice(r.corePrice, symbolStr)})
r${i + 1}_upper = ${r.upperPrice}
r${i + 1}_lower = ${r.lowerPrice}
r${i + 1}_u = plot(r${i + 1}_upper, "R${i + 1} Upper", color=color.new(color.maroon, 60))
r${i + 1}_l = plot(r${i + 1}_lower, "R${i + 1} Lower", color=color.new(color.maroon, 60))
fill(r${i + 1}_u, r${i + 1}_l, color=color.new(color.red, 85), title="R${i + 1} Band Zone")
`).join('')}

${supportBands.slice(0, 3).map((s, i) => `
// Support Band ${s.code} (${formatStockPrice(s.corePrice, symbolStr)})
s${i + 1}_upper = ${s.upperPrice}
s${i + 1}_lower = ${s.lowerPrice}
s${i + 1}_u = plot(s${i + 1}_upper, "S${i + 1} Upper", color=color.new(color.teal, 60))
s${i + 1}_l = plot(s${i + 1}_lower, "S${i + 1} Lower", color=color.new(color.teal, 60))
fill(s${i + 1}_u, s${i + 1}_l, color=color.new(color.green, 85), title="S${i + 1} Band Zone")
`).join('')}

// Alerts for Proximity
alertcondition(close >= highBand * 0.99, title="Resistance Alert", message="[VAM] ${cleanTicker} testing Major Swing High Resistance!")
alertcondition(close <= lowBand * 1.01, title="Support Alert", message="[VAM] ${cleanTicker} testing Major Swing Low Support!")
`;

  return {
    symbol: symbolStr,
    cleanTicker,
    market: info.market,
    currentPrice,
    currencySymbol: info.currencySymbol,
    lookbackBars,
    bars,
    majorSwingHigh,
    majorSwingLow,
    rangeHigh: maxHigh,
    rangeLow: minLow,
    rangeSpreadPct,
    detectedSwingHighs: swingHighs,
    detectedSwingLows: swingLows,
    resistanceBands,
    supportBands,
    fibonacciBands,
    nearestResistance,
    nearestSupport,
    pricePositionInRange,
    activeTacticalBias,
    tacticalSummary,
    proximityAlert,
    generatedPineScript
  };
}
