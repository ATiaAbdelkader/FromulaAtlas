/**
 * Weather + Frost service — fetches live weather data from Open-Meteo,
 * computes frost risk, heat stress, and microclimate-adjusted forecasts.
 *
 * Uses Open-Meteo free API (no key required).
 * - Forecast: temperature, humidity, wind, precipitation, cloud cover
 * - Historical: for degree-day and GDD calculations
 */

export interface DailyForecast {
  date: string;
  tMax: number;
  tMin: number;
  tMean: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  precipitationProb: number;
  cloudCover: number;
  sunrise: string;
  sunset: string;
  uvIndex: number;
  frostRisk: 'none' | 'low' | 'moderate' | 'high' | 'severe';
  heatRisk: 'none' | 'low' | 'moderate' | 'high' | 'severe';
  weatherCode: number;
  weatherDesc: string;
}

export interface WeatherResult {
  location: { lat: number; lng: number; name?: string };
  timezone: string;
  current: {
    temp: number;
    humidity: number;
    windSpeed: number;
    windDir: number;
    precipitation: number;
    weatherCode: number;
    weatherDesc: string;
    feelsLike: number;
    cloudCover: number;
    pressure: number;
    uvIndex: number;
    isDay: boolean;
  };
  daily: DailyForecast[];
  frostWarning: string | null;
  heatWarning: string | null;
  heavyRainWarning: string | null;
  microclimateNote: string | null;
  recommendations: string[];
}

const WEATHER_CODES: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  66: 'Light freezing rain', 67: 'Heavy freezing rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
  85: 'Slight snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
};

function frostRisk(tMin: number): DailyForecast['frostRisk'] {
  if (tMin < -2) return 'severe';
  if (tMin < 0) return 'high';
  if (tMin < 2) return 'moderate';
  if (tMin < 4) return 'low';
  return 'none';
}

function heatRisk(tMax: number): DailyForecast['heatRisk'] {
  if (tMax > 42) return 'severe';
  if (tMax > 38) return 'high';
  if (tMax > 35) return 'moderate';
  if (tMax > 32) return 'low';
  return 'none';
}

/** Fetch 7-day weather forecast from Open-Meteo. */
export async function fetchWeather(lat: number, lng: number): Promise<WeatherResult> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,uv_index` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,temperature_2m_mean,relative_humidity_2m_mean,wind_speed_10m_max,precipitation_sum,precipitation_probability_max,cloud_cover_mean,sunrise,sunset,uv_index_max` +
    `&timezone=auto&forecast_days=7`;

  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error('Weather API failed');
  const data = await res.json();
  if (data.error) throw new Error(data.reason || 'Weather API error');

  const daily: DailyForecast[] = [];
  for (let i = 0; i < (data.daily?.time?.length || 0); i++) {
    daily.push({
      date: data.daily.time[i],
      tMax: data.daily.temperature_2m_max[i],
      tMin: data.daily.temperature_2m_min[i],
      tMean: data.daily.temperature_2m_mean[i],
      humidity: data.daily.relative_humidity_2m_mean[i],
      windSpeed: data.daily.wind_speed_10m_max[i],
      precipitation: data.daily.precipitation_sum[i],
      precipitationProb: data.daily.precipitation_probability_max[i],
      cloudCover: data.daily.cloud_cover_mean[i],
      sunrise: data.daily.sunrise[i],
      sunset: data.daily.sunset[i],
      uvIndex: data.daily.uv_index_max[i],
      frostRisk: frostRisk(data.daily.temperature_2m_min[i]),
      heatRisk: heatRisk(data.daily.temperature_2m_max[i]),
      weatherCode: data.daily.weather_code[i],
      weatherDesc: WEATHER_CODES[data.daily.weather_code[i]] || 'Unknown',
    });
  }

  // Warnings
  const frostDays = daily.filter(d => d.frostRisk === 'high' || d.frostRisk === 'severe');
  const heatDays = daily.filter(d => d.heatRisk === 'high' || d.heatRisk === 'severe');
  const rainDays = daily.filter(d => d.precipitation > 40);

  const frostWarning = frostDays.length > 0
    ? `❄️ Frost warning: ${frostDays[0].date} (min ${frostDays[0].tMin}°C). Protect sensitive crops with frost cloth or overhead irrigation.`
    : null;
  const heatWarning = heatDays.length > 0
    ? `🔥 Heat warning: ${heatDays[0].date} (max ${heatDays[0].tMax}°C). Increase irrigation, use 30-50% shade cloth, avoid foliar sprays.`
    : null;
  const heavyRainWarning = rainDays.length > 0
    ? `🌧️ Heavy rain: ${rainDays[0].date} (${rainDays[0].precipitation}mm). Delay fertilizer application. Ensure drainage is clear.`
    : null;

  // Microclimate note (elevation-based adjustment)
  const elevation = data.elevation || 0;
  let microclimateNote: string | null = null;
  if (elevation > 500) microclimateNote = `Elevation ${elevation}m — temperatures may be 2-4°C colder than lowland stations. Adjust frost risk upward.`;
  else if (elevation < 50) microclimateNote = `Low elevation (${elevation}m) — frost risk is lower but humidity may be higher (disease pressure).`;

  // Recommendations
  const recommendations: string[] = [];
  if (frostWarning) recommendations.push(frostWarning);
  if (heatWarning) recommendations.push(heatWarning);
  if (heavyRainWarning) recommendations.push(heavyRainWarning);

  const rainTotal = daily.reduce((s, d) => s + d.precipitation, 0);
  if (rainTotal < 5) recommendations.push(`☀️ Dry week ahead (${rainTotal.toFixed(0)}mm total rain) — irrigation essential. Check the Irrigation Balance tool.`);
  else if (rainTotal > 50) recommendations.push(`🌧️ Wet week (${rainTotal.toFixed(0)}mm total rain) — reduce irrigation, watch for disease.`);

  const avgTemp = daily.reduce((s, d) => s + d.tMean, 0) / daily.length;
  if (avgTemp < 10) recommendations.push(`🥶 Cold week (avg ${avgTemp.toFixed(1)}°C) — plant growth slow. Delay planting warm-season crops.`);
  else if (avgTemp > 28) recommendations.push(`🥵 Hot week (avg ${avgTemp.toFixed(1)}°C) — heat stress likely. Use mulch to cool soil.`);

  const avgWind = daily.reduce((s, d) => s + d.windSpeed, 0) / daily.length;
  if (avgWind > 25) recommendations.push(`💨 Windy week (avg ${avgWind.toFixed(0)} km/h) — avoid herbicide application. Stake young plants.`);

  // Spray window: low wind + no rain for 24h
  const sprayDays = daily.filter(d => d.windSpeed < 15 && d.precipitation < 2 && d.precipitationProb < 40);
  if (sprayDays.length > 0) {
    recommendations.push(`✅ Spray window: ${sprayDays.map(d => d.date).join(', ')} — low wind, dry conditions.`);
  } else {
    recommendations.push(`⚠️ No good spray window this week — all days have wind or rain risk.`);
  }

  return {
    location: { lat, lng },
    timezone: data.timezone || 'auto',
    current: {
      temp: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      windDir: data.current.wind_direction_10m,
      precipitation: data.current.precipitation,
      weatherCode: data.current.weather_code,
      weatherDesc: WEATHER_CODES[data.current.weather_code] || 'Unknown',
      feelsLike: data.current.apparent_temperature,
      cloudCover: data.current.cloud_cover,
      pressure: data.current.pressure_msl,
      uvIndex: data.current.uv_index,
      isDay: data.current.is_day === 1,
    },
    daily,
    frostWarning, heatWarning, heavyRainWarning, microclimateNote,
    recommendations,
  };
}

/** Weather emoji from code. */
export function weatherEmoji(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 57) return '🌦️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code <= 86) return '🌨️';
  return '⛈️';
}

/** Wind direction as compass text. */
export function windDirection(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}
