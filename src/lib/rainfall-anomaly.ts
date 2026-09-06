/**
 * Rainfall anomaly service — compares current season's rainfall to a
 * 30-year climatology (1991-2020) using the Open-Meteo Archive API.
 *
 * Inspired by the Somaliland Gu 2026 Rainfall Explorer methodology
 * (https://github.com/AhmedEid02/somaliland-gu-2026-geolibre) which uses
 * CHIRPS3 satellite data. We use Open-Meteo's free Archive API instead
 * (same concept, no API key needed, 10K calls/day).
 *
 * The 1991-2020 normal is computed once per location and cached forever
 * (it doesn't change). The current season's rainfall is fetched fresh
 * each time (cached for 1 hour).
 *
 * API: https://archive-api.open-meteo.com/v1/archive
 *   ?latitude=X&longitude=Y
 *   &start_date=1991-01-01&end_date=2020-12-31
 *   &daily=precipitation_sum
 *   &timezone=auto
 */

import type { Language } from '@/lib/language-store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RainfallAnomaly {
  /** Current season's total rainfall (mm). */
  currentSeasonMm: number;
  /** 1991-2020 average for the same season (mm). */
  normalSeasonMm: number;
  /** Anomaly: currentSeasonMm - normalSeasonMm (negative = deficit). */
  anomalyMm: number;
  /** Percent of normal: (current / normal) * 100. */
  percentOfNormal: number;
  /** Season label (e.g., "Apr-Jun 2026"). */
  seasonLabel: string;
  /** Whether this is a drought (percentOfNormal < 80). */
  isDrought: boolean;
  /** Severity: 'normal' | 'mild_deficit' | 'moderate_deficit' | 'severe_deficit' */
  severity: 'normal' | 'mild_deficit' | 'moderate_deficit' | 'severe_deficit';
  /** Current season ET₀ (mm) — evapotranspiration demand. */
  currentEt0Mm?: number;
  /** Normal season ET₀ (mm). */
  normalEt0Mm?: number;
  /** Net water balance: rainfall - ET₀ (negative = deficit). */
  netBalanceMm?: number;
}

// ---------------------------------------------------------------------------
// Season definitions — Algerian agricultural seasons
// ---------------------------------------------------------------------------

interface Season {
  /** Months included (1-12). */
  months: number[];
  /** Short label (en). */
  labelEn: string;
  labelAr: string;
  labelFr: string;
}

const SEASONS: Record<string, Season> = {
  // Winter cereals: Nov-May (wheat, barley planted Nov, harvested May/Jun)
  winter_cereals: { months: [11, 12, 1, 2, 3, 4, 5], labelEn: 'Nov-May', labelAr: 'نوفمبر-مايو', labelFr: 'Nov-Mai' },
  // Spring/summer: Apr-Sep (most vegetable crops)
  spring_summer: { months: [4, 5, 6, 7, 8, 9], labelEn: 'Apr-Sep', labelAr: 'أبريل-سبتمبر', labelFr: 'Avr-Sep' },
  // Date palm season: Mar-Oct (flowering to harvest)
  date_palm: { months: [3, 4, 5, 6, 7, 8, 9, 10], labelEn: 'Mar-Oct', labelAr: 'مارس-أكتوبر', labelFr: 'Mar-Oct' },
  // Current half-year (auto-detect based on current month)
  auto: { months: [], labelEn: '', labelAr: '', labelFr: '' },  // filled dynamically
};

/**
 * Get the current agricultural season based on the month.
 * - Nov-Mar → winter_cereals season
 * - Apr-Oct → spring_summer season
 */
function getCurrentSeason(): Season {
  const month = new Date().getMonth() + 1;  // 1-12
  if (month >= 11 || month <= 3) {
    return SEASONS.winter_cereals;
  }
  return SEASONS.spring_summer;
}

/**
 * Get the months to include in the current season's rainfall total.
 * For a season like "Apr-Sep", if we're in June 2026, we include
 * Apr, May, Jun 2026 (completed months only).
 */
function getSeasonMonths(season: Season, now: Date = new Date()): Array<{ year: number; month: number }> {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;  // 1-12

  const result: Array<{ year: number; month: number }> = [];
  for (const m of season.months) {
    // Only include months that have already completed
    // (e.g., if we're in June, don't include Jul/Aug/Sep)
    if (m <= currentMonth) {
      result.push({ year: currentYear, month: m });
    } else {
      // Month hasn't happened yet this year — skip
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

const ARCHIVE_API = 'https://archive-api.open-meteo.com/v1/archive';

interface ArchiveResponse {
  daily: {
    time: string[];
    precipitation_sum: (number | null)[];
    et0_fao_evapotranspiration?: (number | null)[];
  };
}

/**
 * Fetch daily precipitation + ET₀ for a date range from the Open-Meteo Archive API.
 * Both variables in a single API call (efficient).
 */
async function fetchDailyClimate(
  lat: number,
  lng: number,
  startDate: string,  // YYYY-MM-DD
  endDate: string,    // YYYY-MM-DD
): Promise<Array<{ date: string; precipitation: number; et0: number }>> {
  const url = `${ARCHIVE_API}?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&start_date=${startDate}&end_date=${endDate}&daily=precipitation_sum,et0_fao_evapotranspiration&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Archive API failed: ${res.status}`);
  }
  const data: ArchiveResponse = await res.json();
  if (!data.daily?.time) return [];

  return data.daily.time.map((date, i) => ({
    date,
    precipitation: data.daily.precipitation_sum[i] ?? 0,
    et0: data.daily.et0_fao_evapotranspiration?.[i] ?? 0,
  }));
}

/**
 * @deprecated Use fetchDailyClimate instead (also returns ET₀).
 */
async function fetchDailyPrecipitation(
  lat: number,
  lng: number,
  startDate: string,
  endDate: string,
): Promise<Array<{ date: string; precipitation: number }>> {
  const data = await fetchDailyClimate(lat, lng, startDate, endDate);
  return data.map(d => ({ date: d.date, precipitation: d.precipitation }));
}

// ---------------------------------------------------------------------------
// Normal computation (cached forever — 1991-2020 doesn't change)
// ---------------------------------------------------------------------------

interface MonthlyNormals {
  precipitation: Record<number, number>;  // month → avg mm
  et0: Record<number, number>;            // month → avg mm
}

const normalCache = new Map<string, { normals: MonthlyNormals; fetchedAt: number }>();

function normalCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

/**
 * Fetch the 1991-2020 monthly average rainfall + ET₀ for a location.
 * Returns maps: month (1-12) → average (mm).
 *
 * Cached forever (the 1991-2020 normal doesn't change).
 */
async function getMonthlyNormals(lat: number, lng: number): Promise<MonthlyNormals> {
  const key = normalCacheKey(lat, lng);
  const cached = normalCache.get(key);
  if (cached) return cached.normals;

  // Fetch 30 years of daily data (one API call — Archive API supports long ranges)
  const data = await fetchDailyClimate(lat, lng, '1991-01-01', '2020-12-31');

  // Track per-year monthly sums for both precipitation and ET₀
  const yearlyPrecip: Record<string, number> = {};  // "2020-5" → sum
  const yearlyEt0: Record<string, number> = {};

  for (const day of data) {
    const [year, month] = day.date.split('-').map(Number);
    const ymKey = `${year}-${month}`;
    yearlyPrecip[ymKey] = (yearlyPrecip[ymKey] ?? 0) + day.precipitation;
    yearlyEt0[ymKey] = (yearlyEt0[ymKey] ?? 0) + day.et0;
  }

  // Sum each month per year, then average across 30 years
  const precipSums: Record<number, number[]> = {};
  const et0Sums: Record<number, number[]> = {};
  for (let m = 1; m <= 12; m++) {
    precipSums[m] = [];
    et0Sums[m] = [];
  }

  for (let year = 1991; year <= 2020; year++) {
    for (let m = 1; m <= 12; m++) {
      const ymKey = `${year}-${m}`;
      precipSums[m].push(yearlyPrecip[ymKey] ?? 0);
      et0Sums[m].push(yearlyEt0[ymKey] ?? 0);
    }
  }

  // Average
  const normals: MonthlyNormals = {
    precipitation: {},
    et0: {},
  };
  for (let m = 1; m <= 12; m++) {
    const pSums = precipSums[m];
    normals.precipitation[m] = pSums.length > 0 ? pSums.reduce((s, v) => s + v, 0) / pSums.length : 0;
    const eSums = et0Sums[m];
    normals.et0[m] = eSums.length > 0 ? eSums.reduce((s, v) => s + v, 0) / eSums.length : 0;
  }

  normalCache.set(key, { normals, fetchedAt: Date.now() });
  return normals;
}

// ---------------------------------------------------------------------------
// Current season rainfall (cached 1 hour)
// ---------------------------------------------------------------------------

const currentCache = new Map<string, { mm: number; et0?: number; fetchedAt: number }>();
const CURRENT_CACHE_TTL = 60 * 60 * 1000;  // 1 hour

/**
 * Fetch the current season's total rainfall (completed months only).
 */
/**
 * Fetch the current season's total rainfall + ET₀ (completed months only).
 * Returns both values in a single pass.
 */
async function getCurrentSeasonClimate(
  lat: number,
  lng: number,
  season: Season,
  now: Date = new Date(),
): Promise<{ rainfall: number; et0: number }> {
  const seasonMonths = getSeasonMonths(season, now);
  if (seasonMonths.length === 0) return { rainfall: 0, et0: 0 };

  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)},${seasonMonths.map(m => `${m.year}-${m.month}`).join(',')}`;
  const cached = currentCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CURRENT_CACHE_TTL) {
    return { rainfall: cached.mm, et0: cached.et0 ?? 0 };
  }

  let rainfall = 0;
  let et0 = 0;
  for (const { year, month } of seasonMonths) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

    try {
      const data = await fetchDailyClimate(lat, lng, startDate, endDate);
      rainfall += data.reduce((s, d) => s + d.precipitation, 0);
      et0 += data.reduce((s, d) => s + d.et0, 0);
    } catch {
      // Skip failed months — partial data is better than nothing
    }
  }

  currentCache.set(cacheKey, { mm: rainfall, et0, fetchedAt: Date.now() });
  return { rainfall, et0 };
}

// ---------------------------------------------------------------------------
// Main entry — compute rainfall anomaly
// ---------------------------------------------------------------------------

/**
 * Compute the rainfall anomaly for a location.
 *
 * Returns null if the API call fails or no data is available.
 */
export async function computeRainfallAnomaly(
  lat: number,
  lng: number,
  now: Date = new Date(),
): Promise<RainfallAnomaly | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  try {
    const season = getCurrentSeason();
    const [normals, current] = await Promise.all([
      getMonthlyNormals(lat, lng),
      getCurrentSeasonClimate(lat, lng, season, now),
    ]);

    // Compute the normal for this season (sum of monthly normals for season months)
    const seasonMonths = getSeasonMonths(season, now);
    const normalRainMm = seasonMonths.reduce((s, { month }) => s + (normals.precipitation[month] ?? 0), 0);
    const normalEt0Mm = seasonMonths.reduce((s, { month }) => s + (normals.et0[month] ?? 0), 0);

    const currentMm = current.rainfall;
    const anomalyMm = currentMm - normalRainMm;
    const percentOfNormal = normalRainMm > 0 ? Math.round((currentMm / normalRainMm) * 100) : 100;
    const isDrought = percentOfNormal < 80;

    let severity: RainfallAnomaly['severity'] = 'normal';
    if (percentOfNormal < 50) severity = 'severe_deficit';
    else if (percentOfNormal < 70) severity = 'moderate_deficit';
    else if (percentOfNormal < 80) severity = 'mild_deficit';

    const year = now.getFullYear();
    const seasonLabel = `${season.labelEn} ${year}`;

    // Net water balance: rainfall - ET₀ (negative = crop water deficit)
    const netBalanceMm = Math.round((currentMm - current.et0) * 10) / 10;

    return {
      currentSeasonMm: Math.round(currentMm * 10) / 10,
      normalSeasonMm: Math.round(normalRainMm * 10) / 10,
      anomalyMm: Math.round(anomalyMm * 10) / 10,
      percentOfNormal,
      seasonLabel,
      isDrought,
      severity,
      currentEt0Mm: Math.round(current.et0 * 10) / 10,
      normalEt0Mm: Math.round(normalEt0Mm * 10) / 10,
      netBalanceMm,
    };
  } catch (e) {
    console.warn('[rainfall-anomaly] Failed:', e instanceof Error ? e.message : e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Localization helpers
// ---------------------------------------------------------------------------

export function anomalyStatusLabel(anomaly: RainfallAnomaly, language: Language): string {
  const isArabic = language === 'ar';
  const isFrench = language === 'fr';

  switch (anomaly.severity) {
    case 'severe_deficit':
      return isArabic ? 'عجز شديد' : isFrench ? 'Déficit sévère' : 'Severe deficit';
    case 'moderate_deficit':
      return isArabic ? 'عجز متوسط' : isFrench ? 'Déficit modéré' : 'Moderate deficit';
    case 'mild_deficit':
      return isArabic ? 'عجز خفيف' : isFrench ? 'Déficit léger' : 'Mild deficit';
    default:
      return isArabic ? 'طبيعي' : isFrench ? 'Normal' : 'Normal';
  }
}

export function anomalyColor(anomaly: RainfallAnomaly): string {
  switch (anomaly.severity) {
    case 'severe_deficit': return '#dc2626';  // red-600
    case 'moderate_deficit': return '#ea580c';  // orange-600
    case 'mild_deficit': return '#d97706';  // amber-600
    default: return '#16a34a';  // green-600
  }
}

/**
 * Generate a brief message about rainfall anomaly for the WhatsApp brief.
 */
export function anomalyBriefText(anomaly: RainfallAnomaly, language: Language): string {
  const isArabic = language === 'ar';
  const isFrench = language === 'fr';

  // Net water balance suffix (included when ET₀ data is available)
  const balanceSuffix = anomaly.netBalanceMm != null
    ? isArabic
      ? ` · رصيد المياه: ${anomaly.netBalanceMm} ملم`
      : isFrench
        ? ` · Bilan hydrique: ${anomaly.netBalanceMm} mm`
        : ` · Water balance: ${anomaly.netBalanceMm} mm`
    : '';

  if (!anomaly.isDrought) {
    return isArabic
      ? `🌧 أمطار هذا الموسم: ${anomaly.currentSeasonMm} ملم (${anomaly.percentOfNormal}% من المعدل)${balanceSuffix}`
      : isFrench
        ? `🌧 Pluies saisonnières: ${anomaly.currentSeasonMm} mm (${anomaly.percentOfNormal}% de la normale)${balanceSuffix}`
        : `🌧 Seasonal rainfall: ${anomaly.currentSeasonMm} mm (${anomaly.percentOfNormal}% of normal)${balanceSuffix}`;
  }

  const deficit = anomaly.normalSeasonMm - anomaly.currentSeasonMm;
  return isArabic
    ? `⚠️ عجز أمطار: ${anomaly.currentSeasonMm} ملم (${anomaly.percentOfNormal}% من المعدل ${anomaly.normalSeasonMm} ملم). العجز: ${Math.round(deficit)} ملم. يوصى بزيادة الري.${balanceSuffix}`
    : isFrench
      ? `⚠️ Déficit: ${anomaly.currentSeasonMm} mm (${anomaly.percentOfNormal}% de ${anomaly.normalSeasonMm} mm). Manque: ${Math.round(deficit)} mm. Irrigation ++.${balanceSuffix}`
      : `⚠️ Rainfall deficit: ${anomaly.currentSeasonMm} mm (${anomaly.percentOfNormal}% of normal ${anomaly.normalSeasonMm} mm). Shortfall: ${Math.round(deficit)} mm. Irrigate more.${balanceSuffix}`;
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

export function _clearRainfallCache(): void {
  normalCache.clear();
  currentCache.clear();
}
