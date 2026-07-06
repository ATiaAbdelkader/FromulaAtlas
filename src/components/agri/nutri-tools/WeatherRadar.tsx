'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CloudRain, MapPin, Loader2, Download, AlertTriangle, CheckCircle2,
  Wind, Droplets, Sun, Thermometer, Eye, RefreshCw, Sunrise, Sunset,
} from 'lucide-react';
import {
  fetchWeather, weatherEmoji, windDirection, type WeatherResult, type DailyForecast,
} from '@/lib/weather-service';

const FROST_COLORS: Record<string, string> = { none: '#16a34a', low: '#84cc16', moderate: '#f59e0b', high: '#ea580c', severe: '#dc2626' };
const HEAT_COLORS: Record<string, string> = { none: '#16a34a', low: '#84cc16', moderate: '#f59e0b', high: '#ea580c', severe: '#dc2626' };

export function WeatherRadar() {
  const [lat, setLat] = useState('19.4326');
  const [lng, setLng] = useState('-99.1332');
  const [locationName, setLocationName] = useState('');
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWx = async () => {
    setLoading(true); setError(null);
    try {
      const result = await fetchWeather(parseFloat(lat), parseFloat(lng));
      setWeather(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch weather');
    } finally { setLoading(false); }
  };

  const useGps = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      setLat(pos.coords.latitude.toFixed(4));
      setLng(pos.coords.longitude.toFixed(4));
    }, () => {});
  };

  // Auto-fetch on mount
  useEffect(() => { fetchWx(); }, []);

  const exportPdf = () => {
    if (!weather) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const dayRows = weather.daily.map(d => `<tr>
      <td>${d.date}</td><td>${weatherEmoji(d.weatherCode)} ${d.weatherDesc}</td>
      <td style="text-align:right">${d.tMax}°</td><td style="text-align:right">${d.tMin}°</td>
      <td style="text-align:right">${d.precipitation}mm (${d.precipitationProb}%)</td>
      <td style="text-align:right">${d.windSpeed} km/h</td>
      <td style="text-align:right">${d.humidity}%</td>
      <td style="text-transform:capitalize">${d.frostRisk}</td>
      <td style="text-transform:capitalize">${d.heatRisk}</td>
    </tr>`).join('');
    const recs = weather.recommendations.map(r => `<li>${r}</li>`).join('');
    win.document.write(`<!DOCTYPE html><html><head><title>Weather Forecast — ${locationName || lat + ',' + lng}</title><style>
      body{font-family:system-ui,sans-serif;margin:24px;color:#0f172a} h1{color:#0ea5e9;font-size:20px}
      .meta{color:#475569;font-size:12px;margin-bottom:16px}
      .current{background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px;margin-bottom:16px}
      table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px}
      th{background:#f0f9ff;color:#0284c7;padding:6px;border:1px solid #bae6fd;text-align:left} td{padding:4px 6px;border:1px solid #e0f2fe}
      @page{size:landscape;margin:12mm}
    </style></head><body>
      <h1>🌤️ Weather Forecast</h1>
      <div class="meta">${locationName || lat + ', ' + lng} · ${weather.timezone} · Generated: ${new Date().toLocaleString()}</div>
      <div class="current"><strong>Now:</strong> ${weather.current.temp}°C (feels ${weather.current.feelsLike}°C) · ${weather.current.weatherDesc} · ${weather.current.humidity}% RH · ${weather.current.windSpeed} km/h ${windDirection(weather.current.windDir)}</div>
      <table><thead><tr><th>Date</th><th>Conditions</th><th>Max</th><th>Min</th><th>Rain</th><th>Wind</th><th>Humidity</th><th>Frost</th><th>Heat</th></tr></thead><tbody>${dayRows}</tbody></table>
      <h2>Recommendations</h2><ul>${recs}</ul>
    </body></html>`);
    win.document.close(); setTimeout(() => win.print(), 300);
  };

  return (
    <div className="space-y-4">
      {/* Location input */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div><Label className="text-[10px]">Latitude</Label><Input value={lat} onChange={e => setLat(e.target.value)} className="h-8 text-xs mt-0.5" /></div>
          <div><Label className="text-[10px]">Longitude</Label><Input value={lng} onChange={e => setLng(e.target.value)} className="h-8 text-xs mt-0.5" /></div>
        </div>
        <Button size="sm" variant="outline" onClick={useGps} className="gap-1.5 text-xs h-8"><MapPin className="h-3.5 w-3.5" /> GPS</Button>
        <Button size="sm" onClick={fetchWx} disabled={loading} className="gap-1.5 text-xs h-8">{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Fetch</Button>
        {weather && <Button size="sm" variant="ghost" onClick={exportPdf} className="gap-1 text-xs h-8"><Download className="h-3.5 w-3.5" /></Button>}
      </div>

      {error && <div className="text-xs text-destructive bg-destructive/10 rounded p-2">{error}</div>}

      {loading && !weather && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Fetching live weather data...
        </div>
      )}

      {weather && (
        <>
          {/* Current conditions */}
          <div className="rounded-xl p-4 bg-gradient-to-br from-sky-500 to-blue-600 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl">{weatherEmoji(weather.current.weatherCode)} {weather.current.temp}°C</div>
                <div className="text-sm text-sky-100">{weather.current.weatherDesc}</div>
                <div className="text-xs text-sky-200 mt-1">Feels like {weather.current.feelsLike}°C</div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-sky-100">
                <div className="flex items-center gap-1"><Droplets className="h-3 w-3" /> {weather.current.humidity}%</div>
                <div className="flex items-center gap-1"><Wind className="h-3 w-3" /> {weather.current.windSpeed} km/h {windDirection(weather.current.windDir)}</div>
                <div className="flex items-center gap-1"><CloudRain className="h-3 w-3" /> {weather.current.precipitation}mm</div>
                <div className="flex items-center gap-1"><Eye className="h-3 w-3" /> {weather.current.cloudCover}% cloud</div>
                <div className="flex items-center gap-1"><Sun className="h-3 w-3" /> UV {weather.current.uvIndex}</div>
                <div className="flex items-center gap-1"><Thermometer className="h-3 w-3" /> {weather.current.pressure} hPa</div>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {(weather.frostWarning || weather.heatWarning || weather.heavyRainWarning) && (
            <div className="space-y-1.5">
              {weather.frostWarning && <WarningBar text={weather.frostWarning} color="#dc2626" />}
              {weather.heatWarning && <WarningBar text={weather.heatWarning} color="#ea580c" />}
              {weather.heavyRainWarning && <WarningBar text={weather.heavyRainWarning} color="#0891b2" />}
            </div>
          )}

          {/* Microclimate note */}
          {weather.microclimateNote && (
            <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded p-2 border border-amber-200 dark:border-amber-900">
              🏔️ {weather.microclimateNote}
            </div>
          )}

          {/* 7-day forecast */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">7-Day Forecast</div>
            <div className="grid grid-cols-7 gap-1">
              {weather.daily.map((d, i) => (
                <div key={i} className="rounded-lg border border-border p-2 text-center">
                  <div className="text-[9px] text-muted-foreground font-semibold">{d.date.slice(5)}</div>
                  <div className="text-2xl my-0.5">{weatherEmoji(d.weatherCode)}</div>
                  <div className="text-xs font-bold text-red-500">{d.tMax}°</div>
                  <div className="text-xs text-blue-500">{d.tMin}°</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">💧{d.precipitation}mm</div>
                  <div className="text-[9px] text-muted-foreground">💨{d.windSpeed}</div>
                  {d.frostRisk !== 'none' && (
                    <div className="text-[8px] font-bold rounded mt-0.5 px-0.5" style={{ background: FROST_COLORS[d.frostRisk] + '30', color: FROST_COLORS[d.frostRisk] }}>
                      ❄️{d.frostRisk}
                    </div>
                  )}
                  {d.heatRisk !== 'none' && (
                    <div className="text-[8px] font-bold rounded mt-0.5 px-0.5" style={{ background: HEAT_COLORS[d.heatRisk] + '30', color: HEAT_COLORS[d.heatRisk] }}>
                      🔥{d.heatRisk}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">AI Weather Recommendations</div>
            {weather.recommendations.map((r, i) => (
              <div key={i} className={`text-xs rounded-lg p-2 ${r.includes('⚠️') || r.includes('❄️') || r.includes('🔥') || r.includes('🌧️') ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900' : r.includes('✅') ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900' : 'bg-muted/30 border border-border'}`}>
                {r}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function WarningBar({ text, color }: { text: string; color: string }) {
  return (
    <div className="rounded-lg p-2 text-xs font-medium flex items-center gap-2" style={{ background: `${color}15`, border: `1px solid ${color}40`, color }}>
      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
      {text}
    </div>
  );
}
