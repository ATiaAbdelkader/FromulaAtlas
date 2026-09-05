/**
 * Weather cache for the daily brief pipeline.
 *
 * One Open-Meteo fetch per (lat rounded to 0.1°, lng rounded to 0.1°)
 * per 5-minute window. A wilaya like El Oued (33.5, 6.86) covers ~all
 * farmers within ~10 km, so one fetch serves all of them.
 *
 * Open-Meteo free tier: 10K calls/day. With caching, we use ~60 calls/day
 * (one per Algerian wilaya that has subscribers).
 */

import { getForecast, type ForecastResult, type DailyForecast } from '@/lib/open-meteo';

interface CacheEntry {
  data: ForecastResult | null;
  fetchedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry>();

function roundCoord(v: number | null | undefined): number | null {
  if (v == null || !Number.isFinite(v)) return null;
  return Math.round(v * 10) / 10;
}

function cacheKey(lat: number, lng: number): string {
  return `${roundCoord(lat)},${roundCoord(lng)}`;
}

/**
 * Get a 7-day forecast for the given location, with caching.
 * Returns null on fetch failure (caller falls back to Atlas default ET₀).
 */
export async function getCachedForecast(lat: number, lng: number): Promise<ForecastResult | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const key = cacheKey(lat, lng);
  const now = Date.now();

  const cached = cache.get(key);
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const data = await getForecast(lat, lng, { days: 7 });
    cache.set(key, { data, fetchedAt: now });
    return data;
  } catch (e) {
    console.warn(`[weather-cache] fetch failed for ${key}:`, e instanceof Error ? e.message : e);
    cache.set(key, { data: null, fetchedAt: now - CACHE_TTL_MS + 60_000 });
    return null;
  }
}

export function getTodayFromForecast(forecast: ForecastResult | null): DailyForecast | undefined {
  if (!forecast?.daily?.length) return undefined;
  const today = new Date().toISOString().slice(0, 10);
  return forecast.daily.find(d => d.date === today) ?? forecast.daily[0];
}

export function _clearWeatherCache(): void {
  cache.clear();
}
