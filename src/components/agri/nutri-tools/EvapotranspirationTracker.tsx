'use client';

/**
 * Evapotranspiration Tracker — uses Open-Meteo's free API (no key) to compute
 * daily reference evapotranspiration (ET₀) and crop evapotranspiration (ETc)
 * for any location, plus a 7-day irrigation-need forecast.
 *
 * ET₀ comes from Open-Meteo's own FAO-56 implementation. ETc = Kc × ET₀,
 * where Kc is interpolated from FAO-56 Table 12 crop coefficients based on
 * the user-supplied day-of-season.
 *
 * All data is fetched client-side directly from api.open-meteo.com.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Droplets, MapPin, RefreshCw, AlertTriangle, CheckCircle2,
  Sprout, Calendar, TrendingUp, CloudRain, Sun, Wind,
} from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import {
  getForecast, getHistorical,
  CROP_KCS, kcForDay, etcForDay, wmoDescription,
  type ForecastResult, type HistoricalResult, type CropKc,
} from '@/lib/open-meteo';

const LAST_LOC_KEY = 'et_tracker_last_loc_v1';

const CROP_NAME_AR: Record<string, string> = {
  'Maize (field)': 'ذرة حقلية', 'Maize (sweet)': 'ذرة حلوة', Wheat: 'قمح', Rice: 'أرز', Soybean: 'فول الصويا', Cotton: 'قطن',
  Potato: 'بطاطس', Tomato: 'طماطم', Onion: 'بصل', Alfalfa: 'برسيم حجازي', 'Grapes (wine)': 'عنب (نبيذ)', Citrus: 'حمضيات',
  Apple: 'تفاح', Coffee: 'قهوة', Sunflower: 'عباد الشمس', Sorghum: 'ذرة رفيعة', Barley: 'شعير', 'Canola / Rapeseed': 'كانولا / اغتصاب',
  Lettuce: 'خس', Cabbage: 'ملفوف', 'Bell pepper': 'فلفل حلو', Cucumber: 'خيار',
};
const WEATHER_NAME_AR: Record<string, string> = {
  'Clear sky': 'سماء صافية', 'Mainly clear': 'صافية غالباً', 'Partly cloudy': 'غائم جزئياً', Overcast: 'غائم', Fog: 'ضباب', 'Rime fog': 'ضباب صقيعي',
  'Light drizzle': 'رذاذ خفيف', Drizzle: 'رذاذ', 'Heavy drizzle': 'رذاذ غزير', 'Light rain': 'مطر خفيف', Rain: 'مطر', 'Heavy rain': 'مطر غزير',
  'Light snow': 'ثلج خفيف', Snow: 'ثلج', 'Heavy snow': 'ثلج غزير', 'Rain showers': 'زخات مطر', 'Violent rain showers': 'زخات مطر شديدة',
  Thunderstorm: 'عاصفة رعدية', 'Thunderstorm + hail': 'عاصفة رعدية وبَرَد', 'Severe thunderstorm': 'عاصفة رعدية شديدة', Unknown: 'غير معروف',
};
const localizeCrop = (language: Parameters<typeof copyFor>[0], name: string) => copyFor(language, name, CROP_NAME_AR[name] ?? name);
const localizeWeather = (language: Parameters<typeof copyFor>[0], label: string) => copyFor(language, label, WEATHER_NAME_AR[label] ?? label);
const localizeWeatherError = (language: Parameters<typeof copyFor>[0], message: string) => copyFor(
  language,
  message,
  message.startsWith('Enter valid latitude') ? 'أدخل خط عرض وخط طول صالحين (‎-90..90 و‎-180..180)' : message.startsWith('Failed to fetch forecast') ? 'تعذّر جلب التوقعات الجوية' : message,
);

export function EvapotranspirationTracker() {
  const { language } = useTranslation();
  // Default: San Francisco
  const [lat, setLat] = useState('37.77');
  const [lng, setLng] = useState('-122.42');
  const [cropName, setCropName] = useState<string>('Maize (field)');
  const [dayOfSeason, setDayOfSeason] = useState<number>(60);
  const [irrigationEfficiency, setIrrigationEfficiency] = useState<number>(85);
  const [managedAllowedDepletion, setManagedAllowedDepletion] = useState<number>(50);

  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [history, setHistory] = useState<HistoricalResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore last location from localStorage on mount.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAST_LOC_KEY);
      if (saved) {
        const obj = JSON.parse(saved);
        if (typeof obj.lat === 'string') setLat(obj.lat);
        if (typeof obj.lng === 'string') setLng(obj.lng);
      }
    } catch { /* ignore */ }
  }, []);

  const crop = useMemo<CropKc>(
    () => CROP_KCS.find(c => c.crop === cropName) ?? CROP_KCS[0],
    [cropName],
  );

  const kc = useMemo(() => kcForDay(crop, dayOfSeason), [crop, dayOfSeason]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const la = parseFloat(lat), ln = parseFloat(lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln) || Math.abs(la) > 90 || Math.abs(ln) > 180) {
      setError(copyFor(language, 'Enter valid latitude (-90..90) and longitude (-180..180)', 'أدخل خط عرض وخط طول صالحين (‎-90..90 و‎-180..180)'));
      setLoading(false);
      return;
    }
    try {
      const f = await getForecast(la, ln, { days: 7 });
      setForecast(f);
      // Also fetch the last 7 days of historical data for context.
      const end = new Date();
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      try {
        const h = await getHistorical(la, ln, fmt(start), fmt(end));
        setHistory(h);
      } catch {
        // Historical is nice-to-have; don't fail the whole thing if it errors.
        setHistory(null);
      }
      localStorage.setItem(LAST_LOC_KEY, JSON.stringify({ lat, lng }));
    } catch (e: any) {
      setError(localizeWeatherError(language, e?.message || 'Failed to fetch forecast'));
      setForecast(null);
    } finally {
      setLoading(false);
    }
  }, [lat, lng]);

  // Auto-fetch on first mount (after restoring saved location).
  useEffect(() => {
    fetchAll();
  }, []);

  // ============================================================================
  // Derived: 7-day irrigation plan
  // ============================================================================
  const plan = useMemo(() => {
    if (!forecast) return null;
    return forecast.daily.map(day => {
      const etc = etcForDay(kc, day.et0);
      const effectiveRain = day.precipitationSum * 0.8;  // FAO-56: ~80% of rain is effective
      const netNeed = Math.max(0, etc - effectiveRain);
      // Gross irrigation need = net / efficiency
      const grossNeed = irrigationEfficiency > 0 ? netNeed / (irrigationEfficiency / 100) : netNeed;
      return {
        date: day.date,
        et0: day.et0,
        etc,
        rain: day.precipitationSum,
        rainProb: day.precipitationProbability,
        netNeed,
        grossNeed,
        wmo: day.weatherCode,
        tempMax: day.tempMax,
        tempMin: day.tempMin,
      };
    });
  }, [forecast, kc, irrigationEfficiency]);

  const totals = useMemo(() => {
    if (!plan) return null;
    return {
      et0: plan.reduce((s, d) => s + d.et0, 0),
      etc: plan.reduce((s, d) => s + d.etc, 0),
      rain: plan.reduce((s, d) => s + d.rain, 0),
      grossNeed: plan.reduce((s, d) => s + d.grossNeed, 0),
      irrigationDays: plan.filter(d => d.grossNeed > 1).length,
    };
  }, [plan]);

  const today = plan?.[0];

  return (
    <Card className="overflow-hidden border-cyan-100 shadow-sm dark:border-cyan-900/60">
      {/* Location + crop controls */}
      <Card className="border-0 shadow-none">
          <CardHeader className="border-b border-border/60 bg-cyan-50/40 pb-4 dark:bg-cyan-950/10">
          <CardTitle className="flex items-center gap-2 text-base"><span className="rounded-lg bg-cyan-100 p-2 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300"><Droplets className="h-4 w-4" /></span> {copyFor(language, 'Evapotranspiration Tracker', 'متتبّع التبخر والنتح')}</CardTitle>
          <p className="text-[10px] text-muted-foreground">{copyFor(language, 'Free Open-Meteo API · no key required · FAO-56 Penman-Monteith ET₀', 'واجهة Open-Meteo مجانية · لا تحتاج إلى مفتاح · ET₀ بطريقة بنمان-مونتيث FAO-56')}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-medium">{copyFor(language, 'Latitude', 'خط العرض')}</Label>
              <Input aria-label={copyFor(language, 'Latitude', 'خط العرض')} value={lat} onChange={e => setLat(e.target.value)} type="number" step="0.000001" className="mt-1 h-10 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-medium">{copyFor(language, 'Longitude', 'خط الطول')}</Label>
              <Input aria-label={copyFor(language, 'Longitude', 'خط الطول')} value={lng} onChange={e => setLng(e.target.value)} type="number" step="0.000001" className="mt-1 h-10 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-medium">{copyFor(language, 'Crop', 'المحصول')}</Label>
              <select
                value={cropName}
                onChange={e => setCropName(e.target.value)}
                aria-label={copyFor(language, 'Crop', 'المحصول')}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {CROP_KCS.map(c => <option key={c.crop} value={c.crop}>{localizeCrop(language, c.crop)}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs font-medium">{copyFor(language, 'Day of season', 'يوم الموسم')} (1–{crop.seasonLength})</Label>
              <Input
                value={dayOfSeason}
                onChange={e => setDayOfSeason(Math.max(1, Math.min(crop.seasonLength, parseInt(e.target.value) || 1)))}
                type="number" min={1} max={crop.seasonLength}
                className="mt-1 h-10 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-medium">{copyFor(language, 'Irrigation efficiency (%)', 'كفاءة الري (%)')}</Label>
              <Input aria-label={copyFor(language, 'Irrigation efficiency percentage', 'نسبة كفاءة الري')} value={irrigationEfficiency} onChange={e => setIrrigationEfficiency(Math.max(1, Math.min(100, parseInt(e.target.value) || 85)))} type="number" min={1} max={100} className="mt-1 h-10 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-medium">{copyFor(language, 'Managed allowed depletion (%)', 'الاستنزاف المسموح المُدار (%)')}</Label>
              <Input aria-label={copyFor(language, 'Managed allowed depletion percentage', 'نسبة الاستنزاف المسموح المُدار')} value={managedAllowedDepletion} onChange={e => setManagedAllowedDepletion(Math.max(1, Math.min(100, parseInt(e.target.value) || 50)))} type="number" min={1} max={100} className="mt-1 h-10 text-sm" />
            </div>
          </div>
          <Button size="sm" onClick={fetchAll} disabled={loading} className="h-10 w-full gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? copyFor(language, 'Fetching…', 'جارٍ الجلب…') : copyFor(language, 'Refresh forecast', 'تحديث التوقعات')}
          </Button>
          {error && (
            <EmptyState
              icon={AlertTriangle}
              title={copyFor(language, "Couldn't fetch weather data", 'تعذّر جلب بيانات الطقس')}
              description={error}
              color="#dc2626"
              variant="compact"
              action={{ label: copyFor(language, 'Retry', 'إعادة المحاولة'), onClick: fetchAll }}
            />
          )}
        </CardContent>
      </Card>

      {/* Current Kc + today's snapshot */}
      {forecast && today && (
        <Card className="border-emerald-200/70 shadow-sm dark:border-emerald-900/60">
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Sprout className="h-3.5 w-3.5 text-emerald-600" />
              <span className="font-semibold text-sm">{localizeCrop(language, crop.crop)}</span>
              <Badge variant="secondary" className="text-[10px]">{copyFor(language, 'Day', 'اليوم')} {dayOfSeason} / {crop.seasonLength}</Badge>
              <Badge variant="outline" className="text-[10px] font-mono">Kc = {kc.toFixed(2)}</Badge>
              <Badge variant="outline" className="text-[10px] uppercase">{forecast.timezone}</Badge>
            </div>

            {/* Today's stats grid */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Metric icon={Droplets} color="cyan" label={copyFor(language, 'Today ET₀', 'ET₀ اليوم')} value={`${today.et0.toFixed(1)}`} unit="mm/day" />
              <Metric icon={Sprout} color="emerald" label={copyFor(language, 'Today ETc', 'ETc اليوم')} value={`${today.etc.toFixed(1)}`} unit="mm/day" />
              <Metric icon={CloudRain} color="indigo" label={copyFor(language, 'Today rain', 'مطر اليوم')} value={`${today.rain.toFixed(1)}`} unit={`mm (${today.rainProb}%)`} />
              <Metric icon={Droplets} color={today.grossNeed > 1 ? 'amber' : 'emerald'} label={copyFor(language, 'Irrigation need', 'احتياج الري')} value={`${today.grossNeed.toFixed(1)}`} unit={copyFor(language, 'mm gross', 'مم إجمالي')} />
            </div>

            {/* Current conditions strip */}
            <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/20 p-3 text-xs">
              <span className="text-lg">{wmoDescription(forecast.current.weatherCode).icon}</span>
              <span className="font-medium">{localizeWeather(language, wmoDescription(forecast.current.weatherCode).label)}</span>
              <span className="text-muted-foreground">·</span>
              <span className="font-mono">{forecast.current.temperature.toFixed(1)}°C</span>
              <span className="text-muted-foreground">·</span>
              <span className="font-mono">{forecast.current.relativeHumidity}% {copyFor(language, 'RH', 'رطوبة نسبية')}</span>
              <span className="text-muted-foreground">·</span>
              <span className="font-mono">{forecast.current.windSpeed10m.toFixed(1)} {copyFor(language, 'km/h wind', 'كم/ساعة رياح')}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 7-day plan */}
      {plan && totals && (
        <Card>
          <CardHeader className="border-b border-border/60 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-3.5 w-3.5 text-indigo-600" /> {copyFor(language, '7-day irrigation plan', 'خطة الري لمدة 7 أيام')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Daily cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {plan.map((d, i) => (
                <div key={d.date} className={`rounded-xl border p-3 text-xs shadow-sm ${i === 0 ? 'border-emerald-300 bg-emerald-50/40 dark:border-emerald-800 dark:bg-emerald-950/20' : 'bg-card'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{i === 0 ? copyFor(language, 'Today', 'اليوم') : new Date(d.date + 'T00:00').toLocaleDateString(language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <span className="text-base">{wmoDescription(d.wmo).icon}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[10px]">
                    <div><span className="text-muted-foreground">ET₀</span> {d.et0.toFixed(1)} {copyFor(language, 'mm', 'مم')}</div>
                    <div><span className="text-muted-foreground">ETc</span> {d.etc.toFixed(1)} {copyFor(language, 'mm', 'مم')}</div>
                    <div><span className="text-muted-foreground">{copyFor(language, 'Rain', 'المطر')}</span> {d.rain.toFixed(1)} {copyFor(language, 'mm', 'مم')} ({d.rainProb}%)</div>
                    <div className={d.grossNeed > 1 ? 'text-amber-700 dark:text-amber-400 font-semibold' : ''}>
                      <span className="text-muted-foreground">{copyFor(language, 'Need', 'الاحتياج')}</span> {d.grossNeed.toFixed(1)} {copyFor(language, 'mm', 'مم')}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 p-3">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{copyFor(language, '7-day totals', 'إجماليات 7 أيام')}</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <Stat label={copyFor(language, 'Total ET₀', 'إجمالي ET₀')} value={`${totals.et0.toFixed(1)} ${copyFor(language, 'mm', 'مم')}`} />
                <Stat label={copyFor(language, 'Total ETc', 'إجمالي ETc')} value={`${totals.etc.toFixed(1)} ${copyFor(language, 'mm', 'مم')}`} sub={copyFor(language, 'crop water need', 'احتياج المحصول المائي')} />
                <Stat label={copyFor(language, 'Effective rain', 'المطر الفعّال')} value={`${(totals.rain * 0.8).toFixed(1)} ${copyFor(language, 'mm', 'مم')}`} sub={`${totals.rain.toFixed(1)} ${copyFor(language, 'mm gross', 'مم إجمالي')}`} />
                <Stat label={copyFor(language, 'Irrigation', 'الري')} value={`${totals.grossNeed.toFixed(1)} ${copyFor(language, 'mm', 'مم')}`} sub={`${totals.irrigationDays} ${copyFor(language, totals.irrigationDays === 1 ? 'day needed' : 'days needed', totals.irrigationDays === 1 ? 'يوم مطلوب' : 'أيام مطلوبة')}`} accent />
              </div>
            </div>

            {/* Recommendation */}
            {totals.grossNeed > 5 && (
              <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-2 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <div>
                  <strong>{copyFor(language, 'Irrigation recommended this week.', 'يوصى بالري هذا الأسبوع.')}</strong> {copyFor(language, 'Total gross irrigation need of', 'إجمالي احتياج الري')} {totals.grossNeed.toFixed(1)} {copyFor(language, 'mm across', 'مم على مدى')} {totals.irrigationDays} {copyFor(language, totals.irrigationDays === 1 ? 'day.' : 'days.', totals.irrigationDays === 1 ? 'يوم.' : 'أيام.')}
                  {' '}{copyFor(language, 'Apply', 'طبّق')} {copyFor(language, managedAllowedDepletion < 50 ? 'smaller, more frequent' : 'larger, less frequent', managedAllowedDepletion < 50 ? 'جرعات أصغر وأكثر تكراراً' : 'جرعات أكبر وأقل تكراراً')} {copyFor(language, 'doses based on your MAD setting.', 'بناءً على إعداد الاستنزاف المسموح المُدار لديك.')}
                </div>
              </div>
            )}
            {totals.grossNeed > 0 && totals.grossNeed <= 5 && (
              <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-2 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <div>
                  <strong>{copyFor(language, 'Light irrigation only.', 'ري خفيف فقط.')}</strong> {copyFor(language, "Rainfall covers most of this week's crop water need. Monitor soil moisture before irrigating.", 'يغطي المطر معظم احتياج المحصول المائي هذا الأسبوع. راقب رطوبة التربة قبل الري.')}
                </div>
              </div>
            )}
            {totals.grossNeed === 0 && (
              <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-2 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <div>
                  <strong>{copyFor(language, 'No irrigation needed this week.', 'لا حاجة إلى الري هذا الأسبوع.')}</strong> {copyFor(language, 'Forecast rainfall exceeds crop water demand.', 'يتجاوز المطر المتوقع الطلب المائي للمحصول.')}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Historical context */}
      {history && history.daily.length > 0 && (
        <Card>
          <CardHeader className="border-b border-border/60 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-3.5 w-3.5 text-violet-600" /> {copyFor(language, 'Last 7 days (historical ERA5)', 'آخر 7 أيام (بيانات ERA5 التاريخية)')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const total = history.daily.reduce((s, d) => s + (d.et0Sum || 0), 0);
              const totalRain = history.daily.reduce((s, d) => s + (d.precipitationSum || 0), 0);
              const avgT = history.daily.reduce((s, d) => s + (d.tempMean || 0), 0) / history.daily.length;
              return (
                <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                  <Stat label={copyFor(language, 'Past 7-day ET₀', 'ET₀ لآخر 7 أيام')} value={`${total.toFixed(1)} ${copyFor(language, 'mm', 'مم')}`} />
                  <Stat label={copyFor(language, 'Past 7-day rain', 'مطر آخر 7 أيام')} value={`${totalRain.toFixed(1)} ${copyFor(language, 'mm', 'مم')}`} />
                  <Stat label={copyFor(language, 'Avg temperature', 'متوسط الحرارة')} value={`${avgT.toFixed(1)}°C`} />
                </div>
              );
            })()}
            <p className="text-[10px] text-muted-foreground mt-2">
              {copyFor(language, "Compare last week's ET₀ to this week's forecast — if past ET₀ exceeded rainfall, soil moisture is depleted and irrigation should be heavier.", 'قارن ET₀ للأسبوع الماضي بتوقعات هذا الأسبوع — إذا تجاوز ET₀ السابق كمية المطر، تكون رطوبة التربة مستنزفة ويجب زيادة الري.')}
            </p>
          </CardContent>
        </Card>
      )}
    </Card>
  );
}

// ============================================================================
// Helpers
// ============================================================================

const ACCENT_BG: Record<string, string> = {
  cyan: 'border-cyan-200 dark:border-cyan-900 bg-cyan-50/40 dark:bg-cyan-950/20',
  emerald: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20',
  indigo: 'border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20',
  amber: 'border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20',
};

function Metric({ icon: Icon, color, label, value, unit }: {
  icon: typeof Droplets; color: keyof typeof ACCENT_BG; label: string; value: string; unit?: string;
}) {
  return (
    <div className={`rounded-xl border p-3 shadow-sm ${ACCENT_BG[color]}`}>
      <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase tracking-wide">
        <Icon className="h-2.5 w-2.5" />{label}
      </div>
      <div className="font-mono text-base font-semibold leading-tight">{value}</div>
      {unit && <div className="text-[9px] text-muted-foreground">{unit}</div>}
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 shadow-sm ${accent ? 'border-amber-300 bg-amber-50/40 dark:border-amber-800 dark:bg-amber-950/20' : 'bg-background/40'}`}>
      <div className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="font-mono text-sm font-semibold">{value}</div>
      {sub && <div className="text-[9px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
