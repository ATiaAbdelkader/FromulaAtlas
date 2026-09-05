/**
 * Market Price Crowd-Sourcing Store (Feature #12)
 * ================================================
 *
 * A localStorage-based market price system where farmers can:
 *   1. Report current prices they've seen at their local market
 *   2. View prices reported by other farmers (simulated via seed data)
 *   3. See a price trend chart for their crop
 *
 * SSR-safe: every getter returns an empty array / zeroed summary on the server
 * (or seeds localStorage on first browser call).
 *
 * Seeded with realistic Algerian market data — 50 entries across 10 crops and
 * 15 wilayas, with realistic DZD/kg prices current as of 2023-2024 references.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReporterType = 'farmer' | 'trader' | 'extension_agent';

export interface MarketPriceReport {
  id: string;
  crop: string;             // crop id, e.g. 'potato'
  priceDzdPerKg: number;
  marketName: string;       // local market name
  wilaya: string;           // wilaya name (EN form — caller localizes)
  date: string;             // ISO YYYY-MM-DD
  reporterType: ReporterType;
}

export interface PriceStats {
  min: number;
  max: number;
  avg: number;
  count: number;
}

export interface PriceTrendPoint {
  date: string;             // ISO date
  avg: number;              // avg DZD/kg on that date
}

// ---------------------------------------------------------------------------
// Storage key
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'formula-atlas-market-prices-v1';

// ---------------------------------------------------------------------------
// Seed data — 50 realistic Algerian market price reports
// ---------------------------------------------------------------------------

const CROPS_AND_PRICES: { crop: string; min: number; max: number }[] = [
  { crop: 'potato',    min: 35,  max: 90  },
  { crop: 'tomato',    min: 50,  max: 140 },
  { crop: 'onion',     min: 30,  max: 80  },
  { crop: 'wheat',     min: 45,  max: 70  },
  { crop: 'barley',    min: 40,  max: 60  },
  { crop: 'citrus',    min: 40,  max: 120 },
  { crop: 'olive_oil', min: 600, max: 900 },
  { crop: 'dates',     min: 300, max: 800 },
  { crop: 'pepper',    min: 80,  max: 200 },
  { crop: 'carrot',    min: 35,  max: 75  },
];

const WILAYAS_AND_MARKETS: { wilaya: string; market: string }[] = [
  { wilaya: 'Alger', market: 'Wholesale Market of El Eulma' },
  { wilaya: 'Oran', market: 'Marché de gros d\'Oran' },
  { wilaya: 'Constantine', market: 'Souk El Ghezzel' },
  { wilaya: 'Annaba', market: 'Marché d\'El Bouni' },
  { wilaya: 'Blida', market: 'Souk El Sebt' },
  { wilaya: 'Sétif', market: 'Marché de Sétif' },
  { wilaya: 'Batna', market: 'Souk El Ahad' },
  { wilaya: 'Tlemcen', market: 'Marché de Tlemcen' },
  { wilaya: 'Tiaret', market: 'Souk El Khemis' },
  { wilaya: 'Béjaïa', market: 'Marché de Béjaïa' },
  { wilaya: 'Tizi Ouzou', market: 'Souk de Tizi' },
  { wilaya: 'Skikda', market: 'Marché de Skikda' },
  { wilaya: 'Biskra', market: 'Souk El Outaya' },
  { wilaya: 'Ouargla', market: 'Marché de Ouargla' },
  { wilaya: 'Ghardaïa', market: 'Souk de Ghardaïa' },
];

const REPORTER_TYPES: ReporterType[] = ['farmer', 'trader', 'extension_agent'];

/** Deterministic PRNG for reproducible seed data. */
function makeSeedRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function buildSeedReports(): MarketPriceReport[] {
  const rng = makeSeedRng(20240115);
  const reports: MarketPriceReport[] = [];
  const today = new Date();
  // 50 entries: ~5 per crop, spread across 15 wilayas and last 60 days
  for (let i = 0; i < 50; i++) {
    const crop = CROPS_AND_PRICES[i % CROPS_AND_PRICES.length];
    const loc = WILAYAS_AND_MARKETS[Math.floor(rng() * WILAYAS_AND_MARKETS.length)];
    // Random price within [min, max], biased slightly toward middle
    const t = 0.3 + rng() * 0.6;
    const price = Math.round((crop.min + (crop.max - crop.min) * t) * 100) / 100;
    const daysAgo = Math.floor(rng() * 60);
    const date = new Date(today.getTime() - daysAgo * 86400000).toISOString().slice(0, 10);
    const reporter = REPORTER_TYPES[Math.floor(rng() * REPORTER_TYPES.length)];
    reports.push({
      id: `seed-${i + 1}`,
      crop: crop.crop,
      priceDzdPerKg: price,
      marketName: loc.market,
      wilaya: loc.wilaya,
      date,
      reporterType: reporter,
    });
  }
  // Sort newest first
  reports.sort((a, b) => b.date.localeCompare(a.date));
  return reports;
}

// ---------------------------------------------------------------------------
// Storage helpers (SSR-safe)
// ---------------------------------------------------------------------------

function readAll(): MarketPriceReport[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = buildSeedReports();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidReport);
  } catch {
    return [];
  }
}

function writeAll(reports: MarketPriceReport[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch {
    /* ignore quota errors */
  }
}

function isValidReport(value: unknown): value is MarketPriceReport {
  if (!value || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.crop === 'string' &&
    typeof r.priceDzdPerKg === 'number' && Number.isFinite(r.priceDzdPerKg) &&
    typeof r.marketName === 'string' &&
    typeof r.wilaya === 'string' &&
    typeof r.date === 'string' &&
    typeof r.reporterType === 'string'
  );
}

function genId(): string {
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Persist a new price report (adds to the head of the list).
 * Returns the updated list (newest first).
 */
export function savePriceReport(report: MarketPriceReport): MarketPriceReport[] {
  const all = readAll();
  const toSave: MarketPriceReport = {
    ...report,
    id: report.id || genId(),
    date: report.date || new Date().toISOString().slice(0, 10),
  };
  const updated = [toSave, ...all];
  writeAll(updated);
  return updated;
}

/**
 * Read price reports, optionally filtered by crop.
 * Returns newest-first.
 */
export function getPriceReports(crop?: string): MarketPriceReport[] {
  const all = readAll();
  if (!crop) return all;
  const lower = crop.toLowerCase();
  return all.filter(r => r.crop.toLowerCase() === lower);
}

/**
 * Compute min / max / avg / count for a crop.
 * Falls back to zeros when no reports exist.
 */
export function getAveragePrice(crop: string): PriceStats {
  const reports = getPriceReports(crop);
  if (reports.length === 0) return { min: 0, max: 0, avg: 0, count: 0 };
  const prices = reports.map(r => r.priceDzdPerKg);
  const sum = prices.reduce((s, p) => s + p, 0);
  return {
    min: Math.round(Math.min(...prices) * 100) / 100,
    max: Math.round(Math.max(...prices) * 100) / 100,
    avg: Math.round((sum / prices.length) * 100) / 100,
    count: prices.length,
  };
}

/**
 * Daily average price trend for a crop over the last N days.
 * Days without reports are filled with the most recent prior avg
 * (forward-fill) so the chart line stays continuous.
 */
export function getPriceTrend(crop: string, days: number): PriceTrendPoint[] {
  const reports = getPriceReports(crop);
  const today = new Date();
  const safeDays = Math.max(1, Math.min(days, 90));

  // Group by date
  const byDate = new Map<string, number[]>();
  for (const r of reports) {
    const arr = byDate.get(r.date) || [];
    arr.push(r.priceDzdPerKg);
    byDate.set(r.date, arr);
  }

  const points: PriceTrendPoint[] = [];
  let lastAvg = 0;
  // Walk from oldest to newest so forward-fill works
  for (let i = safeDays - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    const arr = byDate.get(dateStr);
    if (arr && arr.length > 0) {
      const avg = arr.reduce((s, p) => s + p, 0) / arr.length;
      lastAvg = Math.round(avg * 100) / 100;
      points.push({ date: dateStr, avg: lastAvg });
    } else {
      // Forward-fill (or back-fill if at start with no data)
      points.push({ date: dateStr, avg: lastAvg });
    }
  }

  // Back-fill the head if the first few days had no data
  let firstReal = 0;
  for (let i = 0; i < points.length; i++) {
    if (points[i].avg > 0) { firstReal = points[i].avg; break; }
  }
  if (firstReal > 0) {
    for (let i = 0; i < points.length && points[i].avg === 0; i++) {
      points[i].avg = firstReal;
    }
  }

  return points;
}

/**
 * List of distinct crops present in the report store.
 */
export function listCrops(): string[] {
  const all = readAll();
  const set = new Set(all.map(r => r.crop));
  return Array.from(set).sort();
}

/**
 * Total report count (across all crops) — for UI badges.
 */
export function getTotalReportCount(): number {
  return readAll().length;
}

/**
 * Reset the store back to seed data (used by a "Reset" button in the UI).
 */
export function resetToSeed(): MarketPriceReport[] {
  const seed = buildSeedReports();
  writeAll(seed);
  return seed;
}

// ---------------------------------------------------------------------------
// Crop label localization helper (UI convenience)
// ---------------------------------------------------------------------------

export const MARKET_CROPS: { id: string; en: string; fr: string; ar: string; emoji: string }[] = [
  { id: 'potato',    en: 'Potato',    fr: 'Pomme de terre', ar: 'البطاطا',    emoji: '🥔' },
  { id: 'tomato',    en: 'Tomato',    fr: 'Tomate',         ar: 'الطماطم',    emoji: '🍅' },
  { id: 'onion',     en: 'Onion',     fr: 'Oignon',         ar: 'البصل',      emoji: '🧅' },
  { id: 'wheat',     en: 'Wheat',     fr: 'Blé',            ar: 'القمح',      emoji: '🌾' },
  { id: 'barley',    en: 'Barley',    fr: 'Orge',           ar: 'الشعير',     emoji: '🌾' },
  { id: 'citrus',    en: 'Citrus',    fr: 'Agrumes',        ar: 'الحمضيات',   emoji: '🍊' },
  { id: 'olive_oil', en: 'Olive Oil', fr: 'Huile d\'olive', ar: 'زيت الزيتون', emoji: '🫒' },
  { id: 'dates',     en: 'Dates',     fr: 'Dattes',         ar: 'التمور',     emoji: '🌴' },
  { id: 'oil_palm',  en: 'Oil Palm',  fr: 'Palmier à huile', ar: 'نخيل الزيت', emoji: '🌴' },
  { id: 'pepper',    en: 'Pepper',    fr: 'Poivron',        ar: 'الفلفل',     emoji: '🫑' },
  { id: 'carrot',    en: 'Carrot',    fr: 'Carotte',        ar: 'الجزر',      emoji: '🥕' },
];

export function localizeCrop(language: 'en' | 'fr' | 'ar', cropId: string): string {
  const found = MARKET_CROPS.find(c => c.id === cropId);
  if (!found) return cropId;
  return found[language];
}

export const REPORTER_TYPE_LABELS: Record<ReporterType, { en: string; fr: string; ar: string }> = {
  farmer:         { en: 'Farmer',          fr: 'Agriculteur',     ar: 'مزارع' },
  trader:         { en: 'Trader',          fr: 'Commerçant',      ar: 'تاجر' },
  extension_agent:{ en: 'Extension agent', fr: 'Conseiller agricole', ar: 'مرشد فلاحي' },
};
