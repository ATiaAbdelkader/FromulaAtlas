/**
 * Open-Meteo API client — genuinely free, no API key required.
 *
 * Provides:
 *   - Current weather + 7-day forecast (already used by WeatherRadar)
 *   - Historical ERA5 data (2010-present) for trend analysis
 *   - All variables needed for FAO-56 Penman-Monteith ET₀:
 *       temperature (2 m), relative humidity, wind speed (10 m),
 *       shortwave radiation, dew point
 *
 * Reference:
 *   - Allen, R.G. et al. (1998). "Crop evapotranspiration — Guidelines for
 *     computing crop water requirements." FAO Irrigation and Drainage Paper 56.
 *   - Open-Meteo docs: https://open-meteo.com/en/docs
 *
 * Free tier limits (no key):
 *   - 10,000 API calls/day for non-commercial use
 *   - No key required, no credit card
 *
 * Backward-compatibility: the legacy `geocodeCity`, `searchCities`,
 * `fetchCurrentWeather`, and `fetchDailyEto` functions (and `GeoLocation` /
 * `DailyEto` types) are preserved at the bottom of this file so existing
 * consumers (WeatherFetcher, /api/alerts/route) keep working.
 */

const BASE = 'https://api.open-meteo.com/v1';
const ARCHIVE_BASE = 'https://archive-api.open-meteo.com/v1';

// ============================================================================
// Types (newer richer API — used by EvapotranspirationTracker)
// ============================================================================

export interface ForecastCurrent {
  time: string;
  temperature: number;        // °C
  apparentTemperature: number;
  relativeHumidity: number;   // %
  dewPoint: number;           // °C
  precipitation: number;      // mm
  windSpeed10m: number;       // km/h
  windDirection: number;      // °
  pressure: number;           // hPa
  cloudCover: number;         // %
  weatherCode: number;        // WMO code
  isDay: boolean;
}

export interface DailyForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;   // mm
  precipitationProbability: number;  // %
  windSpeedMax: number;       // km/h
  et0: number;                // mm/day — Open-Meteo's own ET₀ calculation
  sunrise: string;
  sunset: string;
  weatherCode: number;
  uvIndexMax: number;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  relativeHumidity: number;
  precipitation: number;
  windSpeed: number;
  shortwaveRadiation: number;  // W/m²
  et0: number;                 // mm/h
}

export interface ForecastResult {
  current: ForecastCurrent;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  timezone: string;
  utcOffsetSeconds: number;
}

export interface HistoricalDay {
  date: string;
  tempMax: number;
  tempMin: number;
  tempMean: number;
  precipitationSum: number;
  et0Sum: number;              // mm/day
  windSpeedMean: number;
  relativeHumidityMean: number;
  shortwaveRadiationMean: number;  // W/m²
}

export interface HistoricalResult {
  daily: HistoricalDay[];
  timezone: string;
}

// ============================================================================
// FAO-56 Penman-Monteith ET₀ (fallback when Open-Meteo doesn't supply et0)
// ============================================================================

const PSYCHOMETRIC_CONST = 0.665;  // kPa/°C, generic; refined below with altitude
const SOLAR_CONST = 0.408;         // MJ/m²/day → mm/day conversion

/**
 * FAO-56 Penman-Monteith reference evapotranspiration (mm/day).
 *
 * Inputs (all daily means or sums):
 *   - tempMean        (°C)     — mean daily air temperature at 2 m
 *   - tempMax, tempMin (°C)    — for saturation vapour pressure slope
 *   - windSpeed2m     (m/s)    — daily mean wind speed at 2 m
 *   - relativeHumidityMean (%) — daily mean RH
 *   - solarRadiation  (MJ/m²/day) — total shortwave radiation
 *   - elevation       (m)      — site elevation (affects pressure)
 *
 * Equation (FAO-56 Eq. 6):
 *   ET₀ = [0.408 Δ (Rn − G) + γ 900/(T+273) u₂ (es − ea)]
 *         / [Δ + γ (1 + 0.34 u₂)]
 */
export function fao56Et0(params: {
  tempMean: number;
  tempMax: number;
  tempMin: number;
  windSpeed2m: number;       // m/s
  relativeHumidityMean: number;  // %
  solarRadiation: number;    // MJ/m²/day
  elevation?: number;        // m
  dayOfYear?: number;        // 1-366, for extraterrestrial radiation
  latitude?: number;         // degrees, for Ra
}): number {
  const {
    tempMean, tempMax, tempMin,
    windSpeed2m, relativeHumidityMean,
    solarRadiation,
    elevation = 0,
  } = params;

  // Saturation vapour pressure (FAO-56 Eq. 11 + 12): mean of es(Tmax) and es(Tmin).
  const es = (satVapPressure(tempMax) + satVapPressure(tempMin)) / 2;
  // Actual vapour pressure (FAO-56 Eq. 14): ea = es(Tdew) ≈ es via RH.
  const ea = es * (relativeHumidityMean / 100);
  const vpd = es - ea;

  // Slope of saturation vapour pressure curve (FAO-56 Eq. 13).
  const delta = 4098 * (0.6108 * Math.exp(17.27 * tempMean / (tempMean + 237.3))) / (tempMean + 237.3) ** 2;

  // Atmospheric pressure (FAO-56 Eq. 7).
  const P = 101.3 * ((293 - 0.0065 * elevation) / 293) ** 5.26;
  // Psychrometric constant (FAO-56 Eq. 8).
  const gamma = PSYCHOMETRIC_CONST * P;  // ≈ 0.0677 kPa/°C at sea level

  // Net radiation — simplified FAO-56 (Eq. 40 + 38).
  // If we have day-of-year + latitude, compute Ra; otherwise assume Rs is provided
  // and use FAO-56 clear-sky radiation Rso ≈ 0.75 Ra.
  let Ra = 0;
  if (params.dayOfYear !== undefined && params.latitude !== undefined) {
    Ra = extraterrestrialRadiation(params.latitude, params.dayOfYear);
  }
  const Rso = Ra > 0 ? (0.75 + 2e-5 * elevation) * Ra : 0;
  // Rs/Rso ratio for cloudiness factor (limit to 1.0)
  const rsRatio = Rso > 0 ? Math.min(1.0, solarRadiation / Rso) : 0.8;
  // Net shortwave (FAO-56 Eq. 38): Rns = (1 − α) Rs, α = 0.23 for grass reference
  const Rns = (1 - 0.23) * solarRadiation;
  // Net longwave (FAO-56 Eq. 39)
  const sigma = 4.903e-9;  // MJ/K⁴/m²/day (Stefan-Boltzmann)
  const TkMax = tempMax + 273.15;
  const TkMin = tempMin + 273.15;
  const f = 1.35 * rsRatio - 0.35;  // cloudiness factor, clamped 0.05–1.0
  const fClamped = Math.max(0.05, Math.min(1.0, f));
  const Rnl = sigma * ((TkMax ** 4 + TkMin ** 4) / 2) * (0.34 - 0.14 * Math.sqrt(ea)) * fClamped;
  // Net radiation (FAO-56 Eq. 40). G (soil heat flux) ≈ 0 for daily timestep.
  const Rn = Rns - Rnl;
  const G = 0;  // daily timestep

  // FAO-56 Eq. 6
  const numerator = SOLAR_CONST * delta * (Rn - G) + gamma * (900 / (tempMean + 273)) * windSpeed2m * vpd;
  const denominator = delta + gamma * (1 + 0.34 * windSpeed2m);
  const et0 = numerator / denominator;

  // Sanity bounds: 0–15 mm/day for any real-world day
  return Math.max(0, Math.min(15, et0));
}

/** Saturation vapour pressure at temperature T (FAO-56 Eq. 11). */
function satVapPressure(T: number): number {
  return 0.6108 * Math.exp(17.27 * T / (T + 237.3));
}

/**
 * Extraterrestrial radiation (FAO-56 Eq. 21), in MJ/m²/day.
 *
 * `latDeg` in degrees; `dayOfYear` 1–366.
 */
export function extraterrestrialRadiation(latDeg: number, dayOfYear: number): number {
  const latRad = latDeg * Math.PI / 180;
  // Inverse relative distance Earth-Sun (Eq. 23)
  const dr = 1 + 0.033 * Math.cos(2 * Math.PI * dayOfYear / 365);
  // Solar declination (Eq. 24)
  const decl = 0.409 * Math.sin(2 * Math.PI * dayOfYear / 365 - 1.39);
  // Sunset hour angle (Eq. 25): cos(ωs) = -tan(φ) tan(δ)
  const cosOmegaS = -Math.tan(latRad) * Math.tan(decl);
  // Clamp to handle polar circles
  if (cosOmegaS > 1) return 0;       // polar night
  if (cosOmegaS < -1) {
    // polar day — ωs = π
    const omegaS = Math.PI;
    const Ra = 24 * 60 / Math.PI * 0.0820 * dr * (omegaS * Math.sin(latRad) * Math.sin(decl) + Math.cos(latRad) * Math.cos(decl) * Math.sin(omegaS));
    return Ra;
  }
  const omegaS = Math.acos(cosOmegaS);
  const Ra = 24 * 60 / Math.PI * 0.0820 * dr * (omegaS * Math.sin(latRad) * Math.sin(decl) + Math.cos(latRad) * Math.cos(decl) * Math.sin(omegaS));
  return Ra;
}

// ============================================================================
// Forecast endpoint
// ============================================================================

const FORECAST_VARS = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'dew_point_2m',
  'precipitation',
  'weather_code',
  'pressure_msl',
  'cloud_cover',
  'wind_speed_10m',
  'wind_direction_10m',
].join(',');

const HOURLY_VARS = [
  'temperature_2m',
  'relative_humidity_2m',
  'precipitation',
  'wind_speed_10m',
  'shortwave_radiation',
  'et0_fao_evapotranspiration',
].join(',');

const DAILY_VARS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'precipitation_probability_max',
  'wind_speed_10m_max',
  'et0_fao_evapotranspiration',
  'sunrise',
  'sunset',
  'uv_index_max',
].join(',');

// ---------------------------------------------------------------------------
// Forecast cache — prevents 429 Too Many Requests errors by caching
// responses in memory for 30 minutes. Each cache key is based on
// rounded lat/lng (2 decimal places ≈ 1.1 km precision) + days param.
// ---------------------------------------------------------------------------

const FORECAST_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const forecastCache = new Map<string, { data: Promise<ForecastResult>; timestamp: number }>();

function forecastCacheKey(lat: number, lng: number, days: number): string {
  // Round to 2 decimal places (~1.1 km) so nearby locations share cache
  return `${Math.round(lat * 100) / 100},${Math.round(lng * 100) / 100},${days}`;
}

/**
 * Get current + 7-day forecast for a location.
 * Free; no API key. Cached for 30 minutes to avoid rate-limiting.
 */
export async function getForecast(lat: number, lng: number, opts: { days?: number } = {}): Promise<ForecastResult> {
  const days = opts.days ?? 7;
  const key = forecastCacheKey(lat, lng, days);
  const now = Date.now();

  // Check cache — return existing promise if still fresh
  const cached = forecastCache.get(key);
  if (cached && now - cached.timestamp < FORECAST_CACHE_TTL_MS) {
    return cached.data;
  }

  // Create new fetch promise and cache it immediately (deduplicates concurrent calls)
  const fetchPromise = fetchForecastUncached(lat, lng, days);
  forecastCache.set(key, { data: fetchPromise, timestamp: now });

  // Clean old entries (prevent memory leak)
  if (forecastCache.size > 20) {
    for (const [k, v] of forecastCache.entries()) {
      if (now - v.timestamp > FORECAST_CACHE_TTL_MS) {
        forecastCache.delete(k);
      }
    }
  }

  return fetchPromise;
}

/** Internal: actual API call without caching. */
async function fetchForecastUncached(lat: number, lng: number, days: number): Promise<ForecastResult> {
  const url = `${BASE}/forecast?latitude=${lat}&longitude=${lng}&current=${FORECAST_VARS}&hourly=${HOURLY_VARS}&daily=${DAILY_VARS}&timezone=auto&forecast_days=${days}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo forecast failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();

  const cur = data.current;
  const current: ForecastCurrent = {
    time: cur.time,
    temperature: cur.temperature_2m,
    apparentTemperature: cur.apparent_temperature,
    relativeHumidity: cur.relative_humidity_2m,
    dewPoint: cur.dew_point_2m,
    precipitation: cur.precipitation,
    windSpeed10m: cur.wind_speed_10m,
    windDirection: cur.wind_direction_10m,
    pressure: cur.pressure_msl,
    cloudCover: cur.cloud_cover,
    weatherCode: cur.weather_code,
    isDay: cur.is_day === 1,
  };

  const h = data.hourly;
  const hourly: HourlyForecast[] = [];
  if (h?.time) {
    for (let i = 0; i < h.time.length; i++) {
      hourly.push({
        time: h.time[i],
        temperature: h.temperature_2m[i],
        relativeHumidity: h.relative_humidity_2m[i],
        precipitation: h.precipitation[i],
        windSpeed: h.wind_speed_10m[i],
        shortwaveRadiation: h.shortwave_radiation[i],
        et0: h.et0_fao_evapotranspiration[i],
      });
    }
  }

  const d = data.daily;
  const daily: DailyForecast[] = [];
  if (d?.time) {
    for (let i = 0; i < d.time.length; i++) {
      daily.push({
        date: d.time[i],
        tempMax: d.temperature_2m_max[i],
        tempMin: d.temperature_2m_min[i],
        precipitationSum: d.precipitation_sum[i],
        precipitationProbability: d.precipitation_probability_max[i] ?? 0,
        windSpeedMax: d.wind_speed_10m_max[i],
        et0: d.et0_fao_evapotranspiration[i],
        sunrise: d.sunrise[i],
        sunset: d.sunset[i],
        weatherCode: d.weather_code[i],
        uvIndexMax: d.uv_index_max[i],
      });
    }
  }

  return {
    current,
    hourly,
    daily,
    timezone: data.timezone,
    utcOffsetSeconds: data.utc_offset_seconds,
  };
}

// ============================================================================
// Historical ERA5 endpoint
// ============================================================================

const ARCHIVE_DAILY_VARS = [
  'temperature_2m_max',
  'temperature_2m_min',
  'temperature_2m_mean',
  'precipitation_sum',
  'et0_fao_evapotranspiration',
  'wind_speed_10m_max',
  'relative_humidity_2m_mean',
  'shortwave_radiation_sum',
].join(',');

/**
 * Get historical daily weather (ERA5 reanalysis, 2010 onward).
 *
 * Useful for:
 *   - "How much rain did we get this week last year?"
 *   - Long-term ET₀ trends for irrigation planning
 *   - Drought / heat stress analysis
 */
export async function getHistorical(
  lat: number,
  lng: number,
  startDate: string,  // YYYY-MM-DD
  endDate: string,
): Promise<HistoricalResult> {
  const url = `${ARCHIVE_BASE}/archive?latitude=${lat}&longitude=${lng}&start_date=${startDate}&end_date=${endDate}&daily=${ARCHIVE_DAILY_VARS}&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo historical failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const d = data.daily;
  const daily: HistoricalDay[] = [];
  if (d?.time) {
    for (let i = 0; i < d.time.length; i++) {
      daily.push({
        date: d.time[i],
        tempMax: d.temperature_2m_max[i],
        tempMin: d.temperature_2m_min[i],
        tempMean: d.temperature_2m_mean[i],
        precipitationSum: d.precipitation_sum[i],
        et0Sum: d.et0_fao_evapotranspiration[i],
        windSpeedMean: d.wind_speed_10m_max[i],
        relativeHumidityMean: d.relative_humidity_2m_mean[i],
        shortwaveRadiationMean: (d.shortwave_radiation_sum[i] || 0) / 24,  // sum→avg W/m²
      });
    }
  }
  return { daily, timezone: data.timezone };
}

// ============================================================================
// Soil Moisture & ET₀ Trend (Past 7-14 Days + Short Forecast)
// ============================================================================

export interface SoilMoistureEt0DailyPoint {
  date: string;              // YYYY-MM-DD
  dayOfWeek: string;         // e.g. "Wed"
  dayNumber: string;         // e.g. "19"
  isToday: boolean;
  isForecast: boolean;
  // Soil Moisture (% volumetric water content 0-100%)
  soilMoistureSurface: number;     // 0-9cm (%)
  soilMoistureRootZone: number;    // 9-27cm (%)
  soilMoistureDeep: number;        // 27-81cm (%)
  soilMoistureAvg: number;         // Weighted root-zone average (%)
  // Explicit separated series for crisp chart visualization
  soilMoistureHistorical?: number | null;     // Measured ERA5 series up to today
  soilMoistureForecast?: number | null;       // 3-day forecast series (bridges today to +3d)
  soilMoistureForecastUpper?: number | null;  // Uncertainty upper bound
  soilMoistureForecastLower?: number | null;  // Uncertainty lower bound
  soilTemp0cm: number;             // °C
  // Evapotranspiration and Hydrologic balance
  et0: number;                     // mm/day
  precipitation: number;           // mm/day
  netWaterBalance: number;         // mm/day (Precipitation - ET₀)
  cumulativeWaterBalance: number;  // mm
  // Agronomic classification
  moistureStatus: 'saturated' | 'optimal' | 'adequate' | 'depleted' | 'wilting_danger';
}

export interface SoilMoistureTrendResult {
  location: { lat: number; lng: number };
  timezone: string;
  points: SoilMoistureEt0DailyPoint[];
  summary: {
    currentRootMoisture: number;
    currentSurfaceMoisture: number;
    forecast3DayMoisture: number;
    forecast3DayDelta: number;
    totalEt0: number;
    totalRain: number;
    netBalance: number;
    moistureTrend: 'rising' | 'steady' | 'falling';
    recommendedAction: 'irrigate' | 'monitor' | 'hold_drainage';
    projectedStressDate?: string | null;
  };
}

/**
 * Fetch 7-day (or custom) historical + current + 3-day forecast soil moisture & ET₀ data from Open-Meteo.
 * Aggregates multi-depth volumetric soil moisture and FAO-56 Penman-Monteith ET₀.
 * Derives a 3-day predictive soil moisture curve from the 7-day historical momentum and forecasted ET₀ demand.
 */
// Soil moisture cache (same pattern as forecast cache)
const SM_CACHE_TTL_MS = 60 * 60 * 1000; // 60 minutes (soil moisture changes slowly)
const smCache = new Map<string, { data: Promise<SoilMoistureTrendResult>; timestamp: number }>();

export async function getSoilMoistureAndEt0Trend(
  lat: number,
  lng: number,
  opts: { pastDays?: number; forecastDays?: number } = {}
): Promise<SoilMoistureTrendResult> {
  const pastDays = opts.pastDays ?? 7;
  const forecastDays = opts.forecastDays ?? 4;

  // Check cache
  const smKey = `${Math.round(lat * 100) / 100},${Math.round(lng * 100) / 100},${pastDays},${forecastDays}`;
  const smCached = smCache.get(smKey);
  if (smCached && Date.now() - smCached.timestamp < SM_CACHE_TTL_MS) {
    return smCached.data;
  }

  // Create the fetch promise and cache it immediately
  const smFetchPromise = fetchSoilMoistureUncached(lat, lng, pastDays, forecastDays);
  smCache.set(smKey, { data: smFetchPromise, timestamp: Date.now() });
  return smFetchPromise;
}

/** Internal: actual soil moisture API call without caching. */
async function fetchSoilMoistureUncached(lat: number, lng: number, pastDays: number, forecastDays: number): Promise<SoilMoistureTrendResult> {
  const hourlyVars = [
    'soil_moisture_0_to_1cm',
    'soil_moisture_1_to_3cm',
    'soil_moisture_3_to_9cm',
    'soil_moisture_9_to_27cm',
    'soil_moisture_27_to_81cm',
    'soil_temperature_0cm',
    'et0_fao_evapotranspiration',
    'precipitation',
  ].join(',');

  const dailyVars = [
    'et0_fao_evapotranspiration',
    'precipitation_sum',
    'temperature_2m_max',
    'temperature_2m_min',
  ].join(',');

  const url = `${BASE}/forecast?latitude=${lat}&longitude=${lng}&past_days=${pastDays}&forecast_days=${forecastDays}&hourly=${hourlyVars}&daily=${dailyVars}&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo soil moisture fetch failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const todayStr = new Date().toISOString().slice(0, 10);

  // Group hourly data by date (YYYY-MM-DD)
  const hourly = data.hourly || {};
  const times: string[] = hourly.time || [];
  const sm0_1: number[] = hourly.soil_moisture_0_to_1cm || [];
  const sm1_3: number[] = hourly.soil_moisture_1_to_3cm || [];
  const sm3_9: number[] = hourly.soil_moisture_3_to_9cm || [];
  const sm9_27: number[] = hourly.soil_moisture_9_to_27cm || [];
  const sm27_81: number[] = hourly.soil_moisture_27_to_81cm || [];
  const st0: number[] = hourly.soil_temperature_0cm || [];
  const et0H: number[] = hourly.et0_fao_evapotranspiration || [];
  const precipH: number[] = hourly.precipitation || [];

  const dayBuckets: Record<
    string,
    {
      surfaceValues: number[];
      rootZoneValues: number[];
      deepValues: number[];
      tempValues: number[];
      et0Values: number[];
      precipValues: number[];
    }
  > = {};

  for (let i = 0; i < times.length; i++) {
    const dStr = times[i].slice(0, 10);
    if (!dayBuckets[dStr]) {
      dayBuckets[dStr] = {
        surfaceValues: [],
        rootZoneValues: [],
        deepValues: [],
        tempValues: [],
        et0Values: [],
        precipValues: [],
      };
    }

    // Surface average (0-9cm): weighted 0-1, 1-3, 3-9
    const s0 = sm0_1[i] ?? 0.25;
    const s1 = sm1_3[i] ?? 0.25;
    const s3 = sm3_9[i] ?? 0.25;
    const surfaceVal = (s0 * 1 + s1 * 2 + s3 * 6) / 9; // m³/m³
    const rootVal = sm9_27[i] ?? surfaceVal;
    const deepVal = sm27_81[i] ?? rootVal;

    dayBuckets[dStr].surfaceValues.push(surfaceVal * 100);
    dayBuckets[dStr].rootZoneValues.push(rootVal * 100);
    dayBuckets[dStr].deepValues.push(deepVal * 100);
    if (st0[i] !== undefined) dayBuckets[dStr].tempValues.push(st0[i]);
    if (et0H[i] !== undefined) dayBuckets[dStr].et0Values.push(et0H[i]);
    if (precipH[i] !== undefined) dayBuckets[dStr].precipValues.push(precipH[i]);
  }

  // Daily sums from daily array if available
  const dailyET0Map: Record<string, number> = {};
  const dailyPrecipMap: Record<string, number> = {};
  if (data.daily?.time) {
    for (let i = 0; i < data.daily.time.length; i++) {
      const d = data.daily.time[i];
      if (data.daily.et0_fao_evapotranspiration?.[i] !== undefined) {
        dailyET0Map[d] = data.daily.et0_fao_evapotranspiration[i];
      }
      if (data.daily.precipitation_sum?.[i] !== undefined) {
        dailyPrecipMap[d] = data.daily.precipitation_sum[i];
      }
    }
  }

  const sortedDates = Object.keys(dayBuckets).sort();
  let cumulativeBalance = 0;

  // Step 1: Pre-calculate raw data points for all available days
  const rawPoints = sortedDates.map((dateStr) => {
    const bucket = dayBuckets[dateStr];
    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const sum = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) : 0);

    const surface = Number(avg(bucket.surfaceValues).toFixed(1));
    const root = Number(avg(bucket.rootZoneValues).toFixed(1));
    const deep = Number(avg(bucket.deepValues).toFixed(1));
    const avgRootZone = Number(((surface * 0.35) + (root * 0.45) + (deep * 0.20)).toFixed(1));
    const soilTemp = Number(avg(bucket.tempValues).toFixed(1));

    const et0 = dailyET0Map[dateStr] ?? Number(sum(bucket.et0Values).toFixed(1));
    const precipitation = dailyPrecipMap[dateStr] ?? Number(sum(bucket.precipValues).toFixed(1));
    const netWaterBalance = Number((precipitation - et0).toFixed(1));
    cumulativeBalance = Number((cumulativeBalance + netWaterBalance).toFixed(1));

    const dObj = new Date(dateStr + 'T12:00:00Z');
    const dayOfWeek = dObj.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNumber = String(dObj.getUTCDate());

    return {
      date: dateStr,
      dayOfWeek,
      dayNumber,
      isToday: dateStr === todayStr,
      isForecast: dateStr > todayStr,
      surface,
      root,
      deep,
      avgRootZone,
      soilTemp,
      et0,
      precipitation,
      netWaterBalance,
      cumulativeBalance,
    };
  });

  // Step 2: Compute 7-day historical momentum & slope to today
  const historicalOnly = rawPoints.filter((p) => p.date <= todayStr);
  const todayPoint = rawPoints.find((p) => p.isToday) || historicalOnly[historicalOnly.length - 1] || rawPoints[0];
  const firstHistorical = historicalOnly[0] || todayPoint;
  
  const historicalDaysCount = Math.max(1, historicalOnly.length - 1);
  const historicalMoistureSlope = todayPoint
    ? (todayPoint.root - firstHistorical.root) / historicalDaysCount
    : 0; // % per day historical momentum

  // Step 3: Derive progressive 3-day predictive soil moisture curve using FAO-56 irrigation depletion
  let runningPredictedMoisture = todayPoint ? todayPoint.root : 24.5;
  let dayOffset = 0;
  let projectedStressDate: string | null = null;

  const points: SoilMoistureEt0DailyPoint[] = rawPoints.map((pt) => {
    const isPastOrToday = pt.date <= todayStr;
    let histVal: number | null = null;
    let foreVal: number | null = null;
    let foreUpper: number | null = null;
    let foreLower: number | null = null;

    let rootMoisture = pt.root;
    let surfaceMoisture = pt.surface;
    let deepMoisture = pt.deep;
    let avgMoisture = pt.avgRootZone;

    if (isPastOrToday) {
      // Historical or Today: real measured values
      histVal = pt.root;
      // Connect forecast series on today point to make the line continuous without gap
      if (pt.isToday) {
        foreVal = pt.root;
        foreUpper = pt.root;
        foreLower = pt.root;
        runningPredictedMoisture = pt.root;
      }
    } else {
      // Future Forecast: Project using FAO-56 hydrologic water balance + historical slope
      dayOffset++;
      const dailyCropWaterDeficit = pt.precipitation - pt.et0; // mm
      // In typical agricultural root zone (40cm depth), 1mm deficit translates to ~0.22% volumetric loss
      const waterBalanceDelta = dailyCropWaterDeficit * 0.22;
      const momentumDelta = historicalMoistureSlope * 0.20; // 20% momentum dampener

      runningPredictedMoisture = Math.max(
        8.0,
        Math.min(42.0, Number((runningPredictedMoisture + waterBalanceDelta + momentumDelta).toFixed(1)))
      );

      foreVal = runningPredictedMoisture;
      foreUpper = Math.min(45.0, Number((foreVal + 1.2 * dayOffset).toFixed(1)));
      foreLower = Math.max(6.0, Number((foreVal - 1.2 * dayOffset).toFixed(1)));
      histVal = null;

      rootMoisture = foreVal;
      avgMoisture = foreVal;
      surfaceMoisture = Number((foreVal * 0.92).toFixed(1));
      deepMoisture = Number((foreVal * 1.05).toFixed(1));

      // Check if critical stress threshold (< 18%) is breached during forecast
      if (foreVal < 18.0 && !projectedStressDate) {
        projectedStressDate = pt.date;
      }
    }

    // Agronomic soil status
    let moistureStatus: SoilMoistureEt0DailyPoint['moistureStatus'] = 'adequate';
    if (avgMoisture > 36) moistureStatus = 'saturated';
    else if (avgMoisture >= 26) moistureStatus = 'optimal';
    else if (avgMoisture >= 18) moistureStatus = 'adequate';
    else if (avgMoisture >= 12) moistureStatus = 'depleted';
    else moistureStatus = 'wilting_danger';

    return {
      date: pt.date,
      dayOfWeek: pt.dayOfWeek,
      dayNumber: pt.dayNumber,
      isToday: pt.isToday,
      isForecast: pt.isForecast,
      soilMoistureSurface: surfaceMoisture,
      soilMoistureRootZone: rootMoisture,
      soilMoistureDeep: deepMoisture,
      soilMoistureAvg: avgMoisture,
      soilMoistureHistorical: histVal,
      soilMoistureForecast: foreVal,
      soilMoistureForecastUpper: foreUpper,
      soilMoistureForecastLower: foreLower,
      soilTemp0cm: pt.soilTemp,
      et0: pt.et0,
      precipitation: pt.precipitation,
      netWaterBalance: pt.netWaterBalance,
      cumulativeWaterBalance: pt.cumulativeBalance,
      moistureStatus,
    };
  });

  // Calculate high-level summary
  const todayActual = points.find((p) => p.isToday) || points[points.length - 1];
  const lastForecastPoint = points[points.length - 1] || todayActual;
  const firstPoint = points[0] || todayActual;

  const totalEt0 = Number(points.reduce((acc, p) => acc + p.et0, 0).toFixed(1));
  const totalRain = Number(points.reduce((acc, p) => acc + p.precipitation, 0).toFixed(1));
  const netBalance = Number((totalRain - totalEt0).toFixed(1));

  const forecast3DayMoisture = lastForecastPoint.soilMoistureRootZone;
  const forecast3DayDelta = Number((forecast3DayMoisture - todayActual.soilMoistureRootZone).toFixed(1));

  const moistureDiff = todayActual.soilMoistureAvg - firstPoint.soilMoistureAvg;
  let moistureTrend: 'rising' | 'steady' | 'falling' = 'steady';
  if (moistureDiff > 1.2) moistureTrend = 'rising';
  else if (moistureDiff < -1.2) moistureTrend = 'falling';

  let recommendedAction: 'irrigate' | 'monitor' | 'hold_drainage' = 'monitor';
  if (
    forecast3DayMoisture < 18 ||
    todayActual.soilMoistureAvg < 18 ||
    (forecast3DayMoisture < 22 && forecast3DayDelta < -2.0)
  ) {
    recommendedAction = 'irrigate';
  } else if (todayActual.soilMoistureAvg > 36 || totalRain > 45) {
    recommendedAction = 'hold_drainage';
  }

  const result: SoilMoistureTrendResult = {
    location: { lat, lng },
    timezone: data.timezone || 'auto',
    points,
    summary: {
      currentRootMoisture: todayActual.soilMoistureRootZone,
      currentSurfaceMoisture: todayActual.soilMoistureSurface,
      forecast3DayMoisture,
      forecast3DayDelta,
      totalEt0,
      totalRain,
      netBalance,
      moistureTrend,
      recommendedAction,
      projectedStressDate,
    },
  };

  return result;
}

// ============================================================================
// Crop coefficients (Kc) — FAO-56 Table 12, selected major crops
// ============================================================================

export interface CropKc {
  crop: string;
  init: number;
  mid: number;
  end: number;
  /** Typical total season length (days). */
  seasonLength: number;
  /** Stage lengths (days): [init, dev, mid, late]. */
  stages: [number, number, number, number];
}

/** Subset of FAO-56 Table 12 — covers most major field + vegetable crops. */
export const CROP_KCS: CropKc[] = [
  { crop: 'Maize (field)',         init: 0.30, mid: 1.20, end: 0.50, seasonLength: 125, stages: [20, 35, 50, 20] },
  { crop: 'Maize (sweet)',         init: 0.30, mid: 1.15, end: 1.00, seasonLength: 90,  stages: [15, 25, 35, 15] },
  { crop: 'Wheat',                 init: 0.40, mid: 1.15, end: 0.30, seasonLength: 135, stages: [20, 35, 65, 15] },
  { crop: 'Rice',                  init: 1.05, mid: 1.20, end: 0.60, seasonLength: 150, stages: [30, 30, 70, 20] },
  { crop: 'Soybean',               init: 0.40, mid: 1.15, end: 0.50, seasonLength: 130, stages: [15, 25, 60, 30] },
  { crop: 'Cotton',                init: 0.35, mid: 1.20, end: 0.70, seasonLength: 180, stages: [25, 50, 65, 40] },
  { crop: 'Potato',                init: 0.50, mid: 1.15, end: 0.75, seasonLength: 120, stages: [25, 30, 50, 15] },
  { crop: 'Tomato',                init: 0.60, mid: 1.15, end: 0.80, seasonLength: 135, stages: [25, 35, 50, 25] },
  { crop: 'Onion',                 init: 0.50, mid: 1.05, end: 0.85, seasonLength: 150, stages: [20, 35, 75, 20] },
  { crop: 'Alfalfa',               init: 0.40, mid: 1.20, end: 1.15, seasonLength: 200, stages: [10, 20, 150, 20] },
  { crop: 'Grapes (wine)',         init: 0.30, mid: 0.85, end: 0.45, seasonLength: 180, stages: [20, 40, 90, 30] },
  { crop: 'Citrus',                init: 0.70, mid: 0.95, end: 0.90, seasonLength: 365, stages: [60, 90, 150, 65] },
  { crop: 'Apple',                 init: 0.45, mid: 0.95, end: 0.70, seasonLength: 180, stages: [20, 40, 90, 30] },
  { crop: 'Coffee',                init: 0.60, mid: 0.95, end: 0.90, seasonLength: 365, stages: [60, 90, 150, 65] },
  { crop: 'Sunflower',             init: 0.35, mid: 1.15, end: 0.35, seasonLength: 130, stages: [20, 35, 55, 20] },
  { crop: 'Sorghum',               init: 0.30, mid: 1.10, end: 0.55, seasonLength: 130, stages: [20, 35, 50, 25] },
  { crop: 'Barley',                init: 0.30, mid: 1.15, end: 0.25, seasonLength: 120, stages: [15, 25, 60, 20] },
  { crop: 'Canola / Rapeseed',     init: 0.40, mid: 1.15, end: 0.35, seasonLength: 140, stages: [25, 35, 60, 20] },
  { crop: 'Lettuce',               init: 0.50, mid: 1.00, end: 0.90, seasonLength: 75,  stages: [15, 20, 30, 10] },
  { crop: 'Cabbage',               init: 0.60, mid: 1.05, end: 0.95, seasonLength: 120, stages: [20, 25, 60, 15] },
  { crop: 'Bell pepper',           init: 0.60, mid: 1.05, end: 0.90, seasonLength: 130, stages: [25, 35, 50, 20] },
  { crop: 'Cucumber',              init: 0.60, mid: 1.00, end: 0.75, seasonLength: 105, stages: [20, 30, 40, 15] },
];

/**
 * Linearly interpolate Kc for a given day-of-season using FAO-56 staged model.
 *
 * Returns the Kc value at `dayOfSeason` (1-indexed) for the given crop.
 */
export function kcForDay(crop: CropKc, dayOfSeason: number): number {
  const [init, dev, mid, late] = crop.stages;
  const initEnd = init;
  const devEnd = init + dev;
  const midEnd = init + dev + mid;
  if (dayOfSeason <= initEnd) return crop.init;
  if (dayOfSeason <= devEnd) {
    // Linear interpolate from init → mid across the dev stage
    const t = (dayOfSeason - initEnd) / dev;
    return crop.init + t * (crop.mid - crop.init);
  }
  if (dayOfSeason <= midEnd) return crop.mid;
  // Late stage: linear interpolate mid → end
  const t = (dayOfSeason - midEnd) / late;
  return crop.mid + t * (crop.end - crop.mid);
}

/**
 * Crop evapotranspiration (ETc) under standard conditions (FAO-56 Eq. 58):
 *   ETc = Kc × ET₀
 */
export function etcForDay(kc: number, et0: number): number {
  return kc * et0;
}

/**
 * WMO weather code → human description (simplified subset).
 */
export function wmoDescription(code: number): { label: string; icon: string } {
  const map: Record<number, { label: string; icon: string }> = {
    0:  { label: 'Clear sky',           icon: '☀️' },
    1:  { label: 'Mainly clear',        icon: '🌤️' },
    2:  { label: 'Partly cloudy',       icon: '⛅' },
    3:  { label: 'Overcast',            icon: '☁️' },
    45: { label: 'Fog',                 icon: '🌫️' },
    48: { label: 'Rime fog',            icon: '🌫️' },
    51: { label: 'Light drizzle',       icon: '🌦️' },
    53: { label: 'Drizzle',             icon: '🌦️' },
    55: { label: 'Heavy drizzle',       icon: '🌧️' },
    61: { label: 'Light rain',          icon: '🌦️' },
    63: { label: 'Rain',                icon: '🌧️' },
    65: { label: 'Heavy rain',          icon: '🌧️' },
    71: { label: 'Light snow',          icon: '🌨️' },
    73: { label: 'Snow',                icon: '❄️' },
    75: { label: 'Heavy snow',          icon: '❄️' },
    80: { label: 'Rain showers',        icon: '🌦️' },
    81: { label: 'Rain showers',        icon: '🌧️' },
    82: { label: 'Violent rain showers',icon: '⛈️' },
    95: { label: 'Thunderstorm',        icon: '⛈️' },
    96: { label: 'Thunderstorm + hail', icon: '⛈️' },
    99: { label: 'Severe thunderstorm', icon: '⛈️' },
  };
  return map[code] ?? { label: 'Unknown', icon: '🌡️' };
}

// ============================================================================
// Legacy API — preserved for backward compatibility.
//
// The original `open-meteo.ts` (pre-2026) exported these names. They are kept
// here verbatim so that existing consumers (`WeatherFetcher.tsx`, the
// `/api/alerts/route.ts` endpoint) continue to work without changes.
//
// New consumers should prefer the richer `getForecast` / `getHistorical` /
// `fao56Et0` APIs defined above.
// ============================================================================

export interface GeoLocation {
  lat: number;
  lng: number;
  name: string;
  country: string;
}

/** Legacy minimal current-weather snapshot (kept for WeatherFetcher/alerts route). */
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

/**
 * Fetch forecast and historical weather bundle for a coordinate.
 */
export async function fetchForecastAndHistory(opts: {
  lat: number;
  lng: number;
  daysPast?: number;
  daysForecast?: number;
}): Promise<{
  current: ForecastCurrent | null;
  daily: DailyForecast[];
}> {
  try {
    const result = await getForecast(opts.lat, opts.lng, { days: opts.daysForecast ?? 7 });
    return {
      current: result.current,
      daily: result.daily,
    };
  } catch {
    return {
      current: null,
      daily: [],
    };
  }
}

