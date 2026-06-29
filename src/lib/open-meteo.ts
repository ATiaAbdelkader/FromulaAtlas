/**
 * Open-Meteo API client — pure functions (no React, no global state).
 * Free API, no key required. https://open-meteo.com/
 *
 * Three core calls + one autocomplete helper:
 *   - geocodeCity(query)        → single GeoLocation | null
 *   - searchCities(query)        → GeoLocation[] (for autocomplete dropdowns)
 *   - fetchCurrentWeather(lat,lng) → temperature / humidity / solar / UV
 *   - fetchDailyEto(lat,lng)     → ET₀ per day array
 *
 * All requests use a 10-second AbortController timeout and swallow
 * network/parse errors as `null` (or `[]` for searchCities) so callers
 * can render a friendly fallback instead of crashing.
 */

export interface GeoLocation {
  lat: number;
  lng: number;
  name: string;
  country: string;
}

export interface CurrentWeather {
  temperature: number;
  humidity: number;
  solarRadiation: number;
  uvIndex: number;
  fetchedAt: number;
}

export interface DailyEto {
  etoPerDay: number[];
  fetchedAt: number;
}

const TIMEOUT_MS = 10_000;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Geocode a city name → first matching result.
 * Returns null on error or no results.
 */
export async function geocodeCity(query: string): Promise<GeoLocation | null> {
  const q = query.trim();
  if (!q) return null;
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const data = await res.json();
    const hit = data?.results?.[0];
    if (!hit) return null;
    return {
      lat: hit.latitude,
      lng: hit.longitude,
      name: hit.name,
      country: hit.country ?? '',
    };
  } catch {
    return null;
  }
}

/**
 * Geocode a city name → up to 5 matching results (for autocomplete dropdowns).
 * Returns empty array on error or short/blank query.
 */
export async function searchCities(query: string): Promise<GeoLocation[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data?.results) return [];
    return data.results.map((r: any) => ({
      lat: r.latitude,
      lng: r.longitude,
      name: r.name,
      country: r.country ?? '',
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch current temperature (°C), relative humidity (%),
 * shortwave radiation (W/m²), and UV index.
 */
export async function fetchCurrentWeather(
  lat: number,
  lng: number,
): Promise<CurrentWeather | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,relative_humidity_2m,shortwave_radiation,uv_index`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const data = await res.json();
    const c = data?.current;
    if (!c) return null;
    return {
      temperature: typeof c.temperature_2m === 'number' ? c.temperature_2m : 0,
      humidity: typeof c.relative_humidity_2m === 'number' ? c.relative_humidity_2m : 0,
      solarRadiation: typeof c.shortwave_radiation === 'number' ? c.shortwave_radiation : 0,
      uvIndex: typeof c.uv_index === 'number' ? c.uv_index : 0,
      fetchedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Fetch reference evapotranspiration (ET₀ FAO, mm/day) per day for the
 * next ~7 days from the Open-Meteo evapotranspiration endpoint.
 *
 * Callers can sum the last 1 entry (daily value) or last 7 entries (weekly)
 * depending on the period they're sizing for.
 */
export async function fetchDailyEto(
  lat: number,
  lng: number,
): Promise<DailyEto | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/evapotranspiration?latitude=${lat}&longitude=${lng}` +
      `&daily=et0_fao_evapotranspiration&timezone=auto`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const data = await res.json();
    const arr = data?.daily?.et0_fao_evapotranspiration;
    if (!Array.isArray(arr)) return null;
    return {
      etoPerDay: arr,
      fetchedAt: Date.now(),
    };
  } catch {
    return null;
  }
}
