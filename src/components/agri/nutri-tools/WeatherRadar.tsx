'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  CloudRain, MapPin, Loader2, Download, AlertTriangle,
  Wind, Droplets, Sun, Thermometer, Eye, RefreshCw, RotateCcw,
} from 'lucide-react';
import {
  fetchWeather, weatherEmoji, windDirection, type WeatherResult,
} from '@/lib/weather-service';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

const FROST_COLORS: Record<string, string> = { none: '#16a34a', low: '#84cc16', moderate: '#f59e0b', high: '#ea580c', severe: '#dc2626' };
const HEAT_COLORS: Record<string, string> = { none: '#16a34a', low: '#84cc16', moderate: '#f59e0b', high: '#ea580c', severe: '#dc2626' };

const TITLE: TrilingualString = {
  en: 'Weather Radar',
  ar: 'رادار الطقس',
  fr: 'Radar Météo',
};

const DESC: TrilingualString = {
  en: 'Live current conditions + 7-day forecast with frost, heat, and heavy-rain warnings for your field.',
  ar: 'الظروف الجوية الحية وتوقعات لـ 7 أيام مع تنبيهات الصقيع والحرارة والأمطار الغزيرة لحقلك.',
  fr: 'Conditions en direct + prévisions sur 7 jours avec alertes gel, canicule et fortes pluies pour votre parcelle.',
};

export function WeatherRadar() {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const isFr = language === 'fr';
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

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

  const handleReset = () => {
    setLat('19.4326');
    setLng('-99.1332');
    setLocationName('');
    toast({ title: tr('Location reset to default', 'تمت إعادة تعيين الموقع إلى الافتراضي', 'Lieu réinitialisé par défaut') });
  };

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
    <CalculatorShell
      icon={CloudRain}
      title={TITLE}
      description={DESC}
      badge="Live Data"
      accent="sky"
      actions={[
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <CloudRain className="h-4 w-4 text-sky-600" />
              {tr('Location', 'الموقع', 'Localisation')}
            </span>
            {weather && (
              <span className="font-mono text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 rounded-lg px-2 py-0.5">
                {weather.current.temp}°C
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CalculatorShell.InputField
              label={tr('Latitude', 'خط العرض', 'Latitude')}
              value={lat}
              onChange={setLat}
              helper={tr('Decimal degrees', 'درجات عشرية', 'Degrés décimaux')}
            />
            <CalculatorShell.InputField
              label={tr('Longitude', 'خط الطول', 'Longitude')}
              value={lng}
              onChange={setLng}
              helper={tr('Decimal degrees', 'درجات عشرية', 'Degrés décimaux')}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={useGps} className="gap-1.5 text-xs h-9">
              <MapPin className="h-3.5 w-3.5" /> {tr('GPS', 'تحديد المواقع', 'GPS')}
            </Button>
            <Button size="sm" onClick={fetchWx} disabled={loading} className="gap-1.5 text-xs h-9">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {tr('Fetch', 'جلب', 'Actualiser')}
            </Button>
            {weather && (
              <Button size="sm" variant="ghost" onClick={exportPdf} className="gap-1 text-xs h-9">
                <Download className="h-3.5 w-3.5" /> {tr('PDF', 'بي دي إف', 'PDF')}
              </Button>
            )}
          </div>

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 rounded p-2">{error}</div>
          )}

          {loading && !weather && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> {tr('Fetching live weather data...', 'جارٍ جلب بيانات الطقس الحية...', 'Récupération des données météo en direct...')}
            </div>
          )}
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        {weather && (
          <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
            <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-sky-50 via-transparent to-blue-50/50 dark:from-sky-950/30 dark:to-blue-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
              <span className="text-base font-bold flex items-center gap-2">
                ✨ {tr('Current Conditions', 'الظروف الحالية', 'Conditions actuelles')}
              </span>
              <span className="font-mono text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 rounded-lg px-2 py-0.5">
                {weatherEmoji(weather.current.weatherCode)} {weather.current.temp}°C
              </span>
            </div>

            <div className="rounded-xl p-4 bg-gradient-to-br from-sky-500 to-blue-600 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-3xl">{weatherEmoji(weather.current.weatherCode)} {weather.current.temp}°C</div>
                  <div className="text-sm text-sky-100">{weather.current.weatherDesc}</div>
                  <div className="text-xs text-sky-200 mt-1">{tr('Feels like', 'يبدو وكأنه', 'Ressenti')} {weather.current.feelsLike}°C</div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-sky-100">
                  <div className="flex items-center gap-1"><Droplets className="h-3 w-3" /> {weather.current.humidity}%</div>
                  <div className="flex items-center gap-1"><Wind className="h-3 w-3" /> {weather.current.windSpeed} km/h {windDirection(weather.current.windDir)}</div>
                  <div className="flex items-center gap-1"><CloudRain className="h-3 w-3" /> {weather.current.precipitation}mm</div>
                  <div className="flex items-center gap-1"><Eye className="h-3 w-3" /> {weather.current.cloudCover}% {tr('cloud', 'غيوم', 'nuage')}</div>
                  <div className="flex items-center gap-1"><Sun className="h-3 w-3" /> UV {weather.current.uvIndex}</div>
                  <div className="flex items-center gap-1"><Thermometer className="h-3 w-3" /> {weather.current.pressure} hPa</div>
                </div>
              </div>
            </div>

            {(weather.frostWarning || weather.heatWarning || weather.heavyRainWarning) && (
              <div className="space-y-1.5">
                {weather.frostWarning && <WarningBar text={weather.frostWarning} color="#dc2626" />}
                {weather.heatWarning && <WarningBar text={weather.heatWarning} color="#ea580c" />}
                {weather.heavyRainWarning && <WarningBar text={weather.heavyRainWarning} color="#0891b2" />}
              </div>
            )}

            {weather.microclimateNote && (
              <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded p-2 border border-amber-200 dark:border-amber-900">
                🏔️ {weather.microclimateNote}
              </div>
            )}
          </div>
        )}
      </CalculatorShell.Results>

      {weather && (
        <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 7-day forecast */}
          <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-base font-bold">{tr('7-Day Forecast', 'توقعات 7 أيام', 'Prévisions 7 jours')}</span>
              <span className="text-xs text-muted-foreground">{weather.timezone}</span>
            </div>
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
          <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-2">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-base font-bold">{tr('AI Weather Recommendations', 'توصيات الطقس الذكية', 'Recommandations météo IA')}</span>
            </div>
            {weather.recommendations.map((r, i) => (
              <div key={i} className={`text-xs rounded-lg p-2 ${r.includes('⚠️') || r.includes('❄️') || r.includes('🔥') || r.includes('🌧️') ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900' : r.includes('✅') ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900' : 'bg-muted/30 border border-border'}`}>
                {r}
              </div>
            ))}
          </div>
        </div>
      )}
    </CalculatorShell>
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
