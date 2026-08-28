// Weather store: persists user location and fetches weather from Open-Meteo API.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserLocation { name: string; latitude: number; longitude: number; country?: string; admin1?: string; }
export interface WeatherData {
  current: { temperature: number; humidity: number; windSpeed: number; precipitation: number; weatherCode: number; isDay: boolean; };
  daily: { et0: number; precipitationSum: number; tempMax: number; tempMin: number; windSpeedMax: number; };
  fetchedAt: number;
}

interface WeatherState {
  location: UserLocation | null; weather: WeatherData | null; isLoading: boolean; error: string | null;
  setLocation: (loc: UserLocation) => void; clearLocation: () => void; fetchWeather: () => Promise<void>;
}

export function weatherCodeToText(code: number): { text: string; icon: string } {
  const map: Record<number, { text: string; icon: string }> = {
    0: { text: 'Clear sky', icon: 'Sun' }, 1: { text: 'Mainly clear', icon: 'Sun' },
    2: { text: 'Partly cloudy', icon: 'CloudSun' }, 3: { text: 'Overcast', icon: 'Cloud' },
    45: { text: 'Fog', icon: 'CloudFog' }, 48: { text: 'Rime fog', icon: 'CloudFog' },
    51: { text: 'Light drizzle', icon: 'CloudDrizzle' }, 53: { text: 'Drizzle', icon: 'CloudDrizzle' },
    55: { text: 'Dense drizzle', icon: 'CloudDrizzle' }, 61: { text: 'Light rain', icon: 'CloudRain' },
    63: { text: 'Rain', icon: 'CloudRain' }, 65: { text: 'Heavy rain', icon: 'CloudRain' },
    71: { text: 'Light snow', icon: 'CloudSnow' }, 73: { text: 'Snow', icon: 'CloudSnow' },
    75: { text: 'Heavy snow', icon: 'CloudSnow' }, 80: { text: 'Rain showers', icon: 'CloudRain' },
    81: { text: 'Rain showers', icon: 'CloudRain' }, 82: { text: 'Violent showers', icon: 'CloudRain' },
    95: { text: 'Thunderstorm', icon: 'CloudLightning' }, 96: { text: 'Thunderstorm + hail', icon: 'CloudLightning' },
  };
  return map[code] || { text: 'Unknown', icon: 'Cloud' };
}

export const useWeatherStore = create<WeatherState>()(
  persist(
    (set, get) => ({
      location: null, weather: null, isLoading: false, error: null,
      setLocation: (loc) => { set({ location: loc, error: null }); get().fetchWeather(); },
      clearLocation: () => set({ location: null, weather: null, error: null }),
      fetchWeather: async () => {
        const loc = get().location; if (!loc) return;
        set({ isLoading: true, error: null });
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code,is_day&daily=et0_fao_evapotranspiration,precipitation_sum,temperature_2m_max,temperature_2m_min,wind_speed_10m_max&timezone=auto&forecast_days=1`;
          const res = await fetch(url); if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
          const data = await res.json();
          set({ weather: {
            current: { temperature: data.current?.temperature_2m ?? 0, humidity: data.current?.relative_humidity_2m ?? 0, windSpeed: data.current?.wind_speed_10m ?? 0, precipitation: data.current?.precipitation ?? 0, weatherCode: data.current?.weather_code ?? 0, isDay: data.current?.is_day === 1 },
            daily: { et0: data.daily?.et0_fao_evapotranspiration?.[0] ?? 0, precipitationSum: data.daily?.precipitation_sum?.[0] ?? 0, tempMax: data.daily?.temperature_2m_max?.[0] ?? 0, tempMin: data.daily?.temperature_2m_min?.[0] ?? 0, windSpeedMax: data.daily?.wind_speed_10m_max?.[0] ?? 0 },
            fetchedAt: Date.now(),
          }, isLoading: false, error: null });
        } catch (err) { set({ isLoading: false, error: (err as Error).message }); }
      },
    }),
    { name: 'agri-atlas-weather', version: 1, partialize: (state) => ({ location: state.location }) }
  )
);

export async function searchLocation(query: string): Promise<UserLocation[]> {
  if (!query.trim()) return [];
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    const res = await fetch(url); if (!res.ok) return [];
    const data = await res.json(); if (!data.results) return [];
    return data.results.map((r: any) => ({ name: r.name, latitude: r.latitude, longitude: r.longitude, country: r.country, admin1: r.admin1 }));
  } catch { return []; }
}
