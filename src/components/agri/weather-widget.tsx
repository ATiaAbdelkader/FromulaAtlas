'use client';
import { useState, useEffect } from 'react';
import { MapPin, Search, RefreshCw, X, Droplets, Wind, Thermometer, Sun, Cloud, CloudRain, CloudSun, CloudSnow, CloudLightning, CloudFog, CloudDrizzle, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWeatherStore, searchLocation, weatherCodeToText, type UserLocation } from '@/lib/weather-store';
import { cn } from '@/lib/utils';

const iconMap: Record<string, typeof Sun> = { Sun, Cloud, CloudSun, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudDrizzle };

export function WeatherWidget() {
  const { location, weather, isLoading, error, setLocation, clearLocation, fetchWeather } = useWeatherStore();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserLocation[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!location) return;
    const interval = setInterval(() => fetchWeather(), 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [location, fetchWeather]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) return;
    const timer = setTimeout(async () => {
      setSearching(true);
      const results = await searchLocation(query);
      setSearchResults(results);
      setSearching(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!location) {
    return (
      <section className="mb-6">
        <div className="rounded-xl border-2 border-dashed border-border bg-card/50 p-6 text-center">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 mx-auto mb-3"><MapPin className="h-6 w-6" /></div>
          <h3 className="text-base font-semibold mb-1">Set your location for live weather</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">Get real-time ET₀, rainfall, temperature, and humidity. Weather data informs your irrigation decisions.</p>
          {!showSearch ? (
            <Button onClick={() => setShowSearch(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700"><Search className="h-4 w-4" /> Search for your location</Button>
          ) : (
            <div className="max-w-md mx-auto space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input autoFocus type="search" placeholder="Enter city name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 pr-9" />
                <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              {searching && <p className="text-xs text-muted-foreground">Searching...</p>}
              {searchResults.length > 0 && (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {searchResults.map((loc, idx) => (
                    <button key={idx} onClick={() => { setLocation(loc); setShowSearch(false); setSearchQuery(''); setSearchResults([]); }} className="w-full text-left flex items-center gap-2 p-2.5 rounded-lg border border-border hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors">
                      <MapPin className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <div className="min-w-0"><div className="text-sm font-medium truncate">{loc.name}</div><div className="text-xs text-muted-foreground truncate">{[loc.admin1, loc.country].filter(Boolean).join(', ')}</div></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    );
  }

  const weatherInfo = weather ? weatherCodeToText(weather.current.weatherCode) : null;
  const WeatherIcon = weatherInfo ? (iconMap[weatherInfo.icon] ?? Cloud) : Cloud;
  const et0 = weather?.daily.et0 ?? 0;
  const rainfall = weather?.daily.precipitationSum ?? 0;
  const nir = Math.max(0, et0 - rainfall);
  const thi = weather ? (1.8 * weather.current.temperature + 32) - (0.55 - 0.0055 * weather.current.humidity) * (1.8 * weather.current.temperature - 26) : 0;

  return (
    <section className="mb-6">
      <div className="rounded-xl border-2 border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-50 to-background dark:from-emerald-950/30 dark:to-background overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-600" /><span className="text-sm font-semibold">{location.name}</span>{location.country && <span className="text-xs text-muted-foreground">{location.country}</span>}</div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => fetchWeather()} disabled={isLoading} className="h-7 w-7 p-0" title="Refresh"><RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} /></Button>
            <Button variant="ghost" size="sm" onClick={() => clearLocation()} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" title="Change location"><X className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
        {error && <div className="px-5 py-3 text-sm text-red-600">Failed to fetch: {error}. <button onClick={() => fetchWeather()} className="underline">Retry</button></div>}
        {isLoading && !weather && <div className="px-5 py-8 text-center text-sm text-muted-foreground"><RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />Fetching weather...</div>}
        {weather && weatherInfo && (
          <div className="p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex-shrink-0"><WeatherIcon className="h-7 w-7" /></div>
              <div><div className="text-3xl font-bold">{weather.current.temperature.toFixed(1)}°C</div><div className="text-sm text-muted-foreground">{weatherInfo.text}</div></div>
              <div className="ml-auto text-right"><div className="text-xs text-muted-foreground">Today's ET₀</div><div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{et0.toFixed(1)} mm</div></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border border-border bg-card/50 p-2.5"><div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1"><Droplets className="h-3 w-3" /> Humidity</div><div className="text-lg font-bold">{weather.current.humidity}%</div></div>
              <div className="rounded-lg border border-border bg-card/50 p-2.5"><div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1"><Wind className="h-3 w-3" /> Wind</div><div className="text-lg font-bold">{weather.current.windSpeed.toFixed(1)} <span className="text-xs font-normal">km/h</span></div></div>
              <div className="rounded-lg border border-border bg-card/50 p-2.5"><div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1"><CloudRain className="h-3 w-3" /> Rainfall</div><div className="text-lg font-bold">{rainfall.toFixed(1)} <span className="text-xs font-normal">mm</span></div></div>
              <div className="rounded-lg border border-border bg-card/50 p-2.5"><div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1"><Thermometer className="h-3 w-3" /> Temp Range</div><div className="text-lg font-bold">{weather.daily.tempMin.toFixed(0)}–{weather.daily.tempMax.toFixed(0)}°</div></div>
            </div>
            <div className="mt-4 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-3">
              <div className="flex items-center gap-2 mb-1"><Zap className="h-3.5 w-3.5 text-emerald-600" /><span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Today's Irrigation Insight</span></div>
              {nir > 0 ? (
                <p className="text-sm text-emerald-900 dark:text-emerald-200">Net irrigation need: <span className="font-bold">{nir.toFixed(1)} mm</span> (ET₀ {et0.toFixed(1)} − rain {rainfall.toFixed(1)}).{thi > 72 && <span className="text-amber-700 dark:text-amber-400"> ⚠ Heat stress risk for livestock (THI {thi.toFixed(0)}).</span>}</p>
              ) : (
                <p className="text-sm text-emerald-900 dark:text-emerald-200">Rainfall ({rainfall.toFixed(1)} mm) covers today's ET₀ ({et0.toFixed(1)} mm). No irrigation needed.</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge variant="outline" className="text-[10px] font-mono">ET₀ = {et0.toFixed(1)} mm</Badge>
                <Badge variant="outline" className="text-[10px] font-mono">NIR = {nir.toFixed(1)} mm</Badge>
                {thi > 0 && <Badge variant="outline" className={cn('text-[10px] font-mono', thi > 72 && 'border-amber-400 text-amber-700 dark:text-amber-400')}>THI = {thi.toFixed(0)}</Badge>}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
