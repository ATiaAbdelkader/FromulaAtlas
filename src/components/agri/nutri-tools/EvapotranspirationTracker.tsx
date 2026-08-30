'use client';

/**
 * Evapotranspiration Tracker — uses Open-Meteo's free API (no key) to compute
 * daily reference evapotranspiration (ET₀) and crop evapotranspiration (ETc)
 * for any location, plus a 7-day irrigation-need forecast.
 *
 * Wrapped in CalculatorShell (sky accent, Droplets icon).
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Droplets, MapPin, RefreshCw, AlertTriangle, CheckCircle2,
  Sprout, Calendar, TrendingUp, CloudRain, Copy, RotateCcw,
} from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';
import {
  getForecast, getHistorical,
  CROP_KCS, kcForDay, etcForDay, wmoDescription,
  type ForecastResult, type HistoricalResult, type CropKc,
} from '@/lib/open-meteo';

const TITLE: TrilingualString = {
  en: 'Evapotranspiration Tracker',
  ar: 'متتبّع التبخر والنتح',
  fr: 'Suivi de l’Évapotranspiration',
};

const DESC: TrilingualString = {
  en: 'Free Open-Meteo API · no key required · FAO-56 Penman-Monteith ET₀ · 7-day irrigation forecast',
  ar: 'واجهة Open-Meteo مجانية · لا تحتاج إلى مفتاح · ET₀ بطريقة بنمان-مونتيث FAO-56 · توقعات الري لمدة 7 أيام',
  fr: 'API Open-Meteo gratuite · sans clé · ET₀ FAO-56 Penman-Monteith · prévision d’irrigation sur 7 jours',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'ET₀ from Open-Meteo’s own FAO-56 implementation. ETc = Kc × ET₀ where Kc is interpolated from FAO-56 Table 12 crop coefficients based on day-of-season. Effective rain = 80% of forecast precipitation (FAO-56). Gross irrigation need = net / efficiency.',
  ar: 'يأتي ET₀ من تطبيق Open-Meteo لمعادلة FAO-56. يُحسب ETc = Kc × ET₀ حيث يُستنتج Kc بالاستيفاء من جدول 12 في FAO-56 لمعاملات المحاصيل بناءً على يوم الموسم. المطر الفعّال = 80% من توقعات الهطول (FAO-56). احتياج الري الإجمالي = الصافي / الكفاءة.',
  fr: 'L’ET₀ provient de l’implémentation FAO-56 d’Open-Meteo. ETc = Kc × ET₀ où Kc est interpolé à partir des coefficients culturaux du Tableau 12 FAO-56 selon le jour de saison. Pluie efficace = 80% des précipitations prévues (FAO-56). Besoin brut = net / efficacité.',
};

const LAST_LOC_KEY = 'et_tracker_last_loc_v1';
const DEFAULT_LAT = '37.77';
const DEFAULT_LNG = '-122.42';

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
  'Thunderstorm': 'عاصفة رعدية', 'Thunderstorm + hail': 'عاصفة رعدية وبَرَد', 'Severe thunderstorm': 'عاصفة رعدية شديدة', Unknown: 'غير معروف',
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
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  // Default: San Francisco
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [cropName, setCropName] = useState<string>('Maize (field)');
  const [dayOfSeason, setDayOfSeason] = useState<number>(60);
  const [irrigationEfficiency, setIrrigationEfficiency] = useState<number>(85);
  const [managedAllowedDepletion, setManagedAllowedDepletion] = useState<number>(50);

  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [history, setHistory] = useState<HistoricalResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
      setError(tr('Enter valid latitude (-90..90) and longitude (-180..180)', 'أدخل خط عرض وخط طول صالحين (‎-90..90 و‎-180..180)', 'Saisir latitude (-90..90) et longitude (-180..180) valides'));
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

  // ============================================================================
  // Hero actions
  // ============================================================================
  const handleCopy = () => {
    if (!totals || !plan) {
      toast({ title: tr('Fetch forecast first', 'اجلب التوقعات أولاً', 'Chargez d’abord les prévisions') });
      return;
    }
    const lines = [
      '=== EVAPOTRANSPIRATION & 7-DAY IRRIGATION PLAN ===',
      `Location: ${lat}, ${lng} (${forecast?.timezone ?? '—'})`,
      `Crop: ${localizeCrop(language, crop.crop)} (Kc=${kc.toFixed(2)}, day ${dayOfSeason}/${crop.seasonLength})`,
      `Irrigation efficiency: ${irrigationEfficiency}%`,
      '',
      '--- Today ---',
      today ? `ET₀: ${today.et0.toFixed(1)} mm · ETc: ${today.etc.toFixed(1)} mm · Rain: ${today.rain.toFixed(1)} mm (${today.rainProb}%) · Irrigation need: ${today.grossNeed.toFixed(1)} mm` : '—',
      '',
      '--- 7-day totals ---',
      `ET₀: ${totals.et0.toFixed(1)} mm · ETc: ${totals.etc.toFixed(1)} mm`,
      `Effective rain: ${(totals.rain * 0.8).toFixed(1)} mm (${totals.rain.toFixed(1)} mm gross)`,
      `Gross irrigation need: ${totals.grossNeed.toFixed(1)} mm over ${totals.irrigationDays} day(s)`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    toast({ title: tr('Summary Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleReset = () => {
    setLat(DEFAULT_LAT);
    setLng(DEFAULT_LNG);
    setCropName('Maize (field)');
    setDayOfSeason(60);
    setIrrigationEfficiency(85);
    setManagedAllowedDepletion(50);
    localStorage.removeItem(LAST_LOC_KEY);
    toast({ title: tr('Reset to defaults', 'إعادة للقيم الافتراضية', 'Réinitialisé') });
    // Refetch with default location after state update.
    setTimeout(() => fetchAll(), 0);
  };

  return (
    <CalculatorShell
      icon={Droplets}
      title={TITLE}
      description={DESC}
      badge={tr('Open-Meteo · FAO-56', 'Open-Meteo · FAO-56', 'Open-Meteo · FAO-56')}
      accent="sky"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' },
          onClick: handleCopy,
          variant: 'primary',
          showCheck: copied,
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      protocolNote={PROTOCOL_NOTE}
    >
      {/* Inputs: location + crop + day + efficiency + MAD + refresh */}
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-600" />
              {tr('Location & Crop', 'الموقع والمحصول', 'Localisation & Culture')}
            </span>
            <Badge variant="outline" className="text-[10px] uppercase">{forecast?.timezone ?? '—'}</Badge>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-medium">{tr('Latitude', 'خط العرض', 'Latitude')}</Label>
              <Input aria-label={tr('Latitude', 'خط العرض', 'Latitude')} value={lat} onChange={e => setLat(e.target.value)} type="number" step="0.000001" className="mt-1 h-9 text-xs" />
            </div>
            <div>
              <Label className="text-xs font-medium">{tr('Longitude', 'خط الطول', 'Longitude')}</Label>
              <Input aria-label={tr('Longitude', 'خط الطول', 'Longitude')} value={lng} onChange={e => setLng(e.target.value)} type="number" step="0.000001" className="mt-1 h-9 text-xs" />
            </div>
            <div>
              <Label className="text-xs font-medium">{tr('Crop', 'المحصول', 'Culture')}</Label>
              <select
                value={cropName}
                onChange={e => setCropName(e.target.value)}
                aria-label={tr('Crop', 'المحصول', 'Culture')}
                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                {CROP_KCS.map(c => <option key={c.crop} value={c.crop}>{localizeCrop(language, c.crop)}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs font-medium">{tr('Day of season', 'يوم الموسم', 'Jour de saison')} (1–{crop.seasonLength})</Label>
              <Input
                value={dayOfSeason}
                onChange={e => setDayOfSeason(Math.max(1, Math.min(crop.seasonLength, parseInt(e.target.value) || 1)))}
                type="number" min={1} max={crop.seasonLength}
                className="mt-1 h-9 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">{tr('Irrigation efficiency (%)', 'كفاءة الري (%)', 'Efficacité irrigation (%)')}</Label>
              <Input aria-label={tr('Irrigation efficiency', 'كفاءة الري', 'Efficacité')} value={irrigationEfficiency} onChange={e => setIrrigationEfficiency(Math.max(1, Math.min(100, parseInt(e.target.value) || 85)))} type="number" min={1} max={100} className="mt-1 h-9 text-xs" />
            </div>
            <div>
              <Label className="text-xs font-medium">{tr('Managed allowed depletion (%)', 'الاستنزاف المسموح المُدار (%)', 'Épuisement admissible géré (%)')}</Label>
              <Input aria-label={tr('MAD', 'الاستنزاف المسموح', 'Épuisement')} value={managedAllowedDepletion} onChange={e => setManagedAllowedDepletion(Math.max(1, Math.min(100, parseInt(e.target.value) || 50)))} type="number" min={1} max={100} className="mt-1 h-9 text-xs" />
            </div>
          </div>

          <Button size="sm" onClick={fetchAll} disabled={loading} className="h-9 w-full gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? tr('Fetching…', 'جارٍ الجلب…', 'Chargement…') : tr('Refresh forecast', 'تحديث التوقعات', 'Actualiser')}
          </Button>
          {error && (
            <EmptyState
              icon={AlertTriangle}
              title={tr("Couldn't fetch weather data", 'تعذّر جلب بيانات الطقس', 'Échec du chargement météo')}
              description={error}
              color="#dc2626"
              variant="compact"
              action={{ label: tr('Retry', 'إعادة المحاولة', 'Réessayer'), onClick: fetchAll }}
            />
          )}
        </div>
      </CalculatorShell.Inputs>

      {/* Results */}
      <CalculatorShell.Results>
        <div className="space-y-4">
          {/* Current Kc + today's snapshot */}
          {forecast && today && (
            <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Sprout className="h-3.5 w-3.5 text-emerald-600" />
                <span className="font-semibold text-sm">{localizeCrop(language, crop.crop)}</span>
                <Badge variant="secondary" className="text-[10px]">{tr('Day', 'اليوم', 'Jour')} {dayOfSeason} / {crop.seasonLength}</Badge>
                <Badge variant="outline" className="text-[10px] font-mono">Kc = {kc.toFixed(2)}</Badge>
              </div>

              {/* Today's stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <CalculatorShell.MetricTile
                  label={tr('Today ET₀', 'ET₀ اليوم', 'ET₀ du jour')}
                  value={today.et0.toFixed(1)}
                  unit="mm/day"
                  color="sky"
                />
                <CalculatorShell.MetricTile
                  label={tr('Today ETc', 'ETc اليوم', 'ETc du jour')}
                  value={today.etc.toFixed(1)}
                  unit="mm/day"
                  color="emerald"
                />
                <CalculatorShell.MetricTile
                  label={tr('Today rain', 'مطر اليوم', 'Pluie du jour')}
                  value={today.rain.toFixed(1)}
                  unit={`mm (${today.rainProb}%)`}
                  color="default"
                />
                <CalculatorShell.MetricTile
                  label={tr('Irrigation need', 'احتياج الري', 'Besoin irrigation')}
                  value={today.grossNeed.toFixed(1)}
                  unit={tr('mm gross', 'مم إجمالي', 'mm brut')}
                  color={today.grossNeed > 1 ? 'amber' : 'emerald'}
                />
              </div>

              {/* Current conditions strip */}
              <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/20 p-3 text-xs">
                <span className="text-lg">{wmoDescription(forecast.current.weatherCode).icon}</span>
                <span className="font-medium">{localizeWeather(language, wmoDescription(forecast.current.weatherCode).label)}</span>
                <span className="text-muted-foreground">·</span>
                <span className="font-mono">{forecast.current.temperature.toFixed(1)}°C</span>
                <span className="text-muted-foreground">·</span>
                <span className="font-mono">{forecast.current.relativeHumidity}% {tr('RH', 'رطوبة نسبية', 'HR')}</span>
                <span className="text-muted-foreground">·</span>
                <span className="font-mono">{forecast.current.windSpeed10m.toFixed(1)} {tr('km/h wind', 'كم/ساعة رياح', 'km/h vent')}</span>
              </div>
            </div>
          )}

          {/* 7-day plan */}
          {plan && totals && (
            <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold border-b pb-3">
                <Calendar className="h-3.5 w-3.5 text-sky-600" /> {tr('7-day irrigation plan', 'خطة الري لمدة 7 أيام', 'Plan d’irrigation 7 jours')}
              </div>

              {/* Daily cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {plan.map((d, i) => (
                  <div key={d.date} className={`rounded-xl border p-3 text-xs ${i === 0 ? 'border-emerald-300 bg-emerald-50/40 dark:border-emerald-800 dark:bg-emerald-950/20' : 'bg-card'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{i === 0 ? tr('Today', 'اليوم', "Aujourd'hui") : new Date(d.date + 'T00:00').toLocaleDateString(language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      <span className="text-base">{wmoDescription(d.wmo).icon}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[10px]">
                      <div><span className="text-muted-foreground">ET₀</span> {d.et0.toFixed(1)} {tr('mm', 'مم', 'mm')}</div>
                      <div><span className="text-muted-foreground">ETc</span> {d.etc.toFixed(1)} {tr('mm', 'مم', 'mm')}</div>
                      <div><span className="text-muted-foreground">{tr('Rain', 'المطر', 'Pluie')}</span> {d.rain.toFixed(1)} {tr('mm', 'مم', 'mm')} ({d.rainProb}%)</div>
                      <div className={d.grossNeed > 1 ? 'text-amber-700 dark:text-amber-400 font-semibold' : ''}>
                        <span className="text-muted-foreground">{tr('Need', 'الاحتياج', 'Besoin')}</span> {d.grossNeed.toFixed(1)} {tr('mm', 'مم', 'mm')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <Stat label={tr('Total ET₀', 'إجمالي ET₀', 'Total ET₀')} value={`${totals.et0.toFixed(1)} ${tr('mm', 'مم', 'mm')}`} />
                <Stat label={tr('Total ETc', 'إجمالي ETc', 'Total ETc')} value={`${totals.etc.toFixed(1)} ${tr('mm', 'مم', 'mm')}`} sub={tr('crop water need', 'احتياج المحصول المائي', 'besoin en eau')} />
                <Stat label={tr('Effective rain', 'المطر الفعّال', 'Pluie efficace')} value={`${(totals.rain * 0.8).toFixed(1)} ${tr('mm', 'مم', 'mm')}`} sub={`${totals.rain.toFixed(1)} ${tr('mm gross', 'مم إجمالي', 'mm brut')}`} />
                <Stat label={tr('Irrigation', 'الري', 'Irrigation')} value={`${totals.grossNeed.toFixed(1)} ${tr('mm', 'مم', 'mm')}`} sub={`${totals.irrigationDays} ${tr(totals.irrigationDays === 1 ? 'day needed' : 'days needed', totals.irrigationDays === 1 ? 'يوم مطلوب' : 'أيام مطلوبة', totals.irrigationDays === 1 ? 'jour requis' : 'jours requis')}`} accent />
              </div>

              {/* Recommendation */}
              {totals.grossNeed > 5 && (
                <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <div>
                    <strong>{tr('Irrigation recommended this week.', 'يوصى بالري هذا الأسبوع.', 'Irrigation recommandée cette semaine.')}</strong> {tr('Total gross irrigation need of', 'إجمالي احتياج الري', 'Besoin brut total d’irrigation')} {totals.grossNeed.toFixed(1)} {tr('mm across', 'مم على مدى', 'mm sur')} {totals.irrigationDays} {tr(totals.irrigationDays === 1 ? 'day.' : 'days.', totals.irrigationDays === 1 ? 'يوم.' : 'أيام.', totals.irrigationDays === 1 ? 'jour.' : 'jours.')}
                    {' '}{tr('Apply', 'طبّق', 'Appliquer')} {tr(managedAllowedDepletion < 50 ? 'smaller, more frequent' : 'larger, less frequent', managedAllowedDepletion < 50 ? 'جرعات أصغر وأكثر تكراراً' : 'جرعات أكبر وأقل تكراراً', managedAllowedDepletion < 50 ? 'plus petites et fréquentes' : 'plus grandes et moins fréquentes')} {tr('doses based on your MAD setting.', 'بناءً على إعداد الاستنزاف المسموح المُدار لديك.', 'selon votre réglage MAD.')}
                  </div>
                </div>
              )}
              {totals.grossNeed > 0 && totals.grossNeed <= 5 && (
                <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <div>
                    <strong>{tr('Light irrigation only.', 'ري خفيف فقط.', 'Irrigation légère seulement.')}</strong> {tr("Rainfall covers most of this week's crop water need. Monitor soil moisture before irrigating.", 'يغطي المطر معظم احتياج المحصول المائي هذا الأسبوع. راقب رطوبة التربة قبل الري.', 'Les précipitations couvrent la plupart des besoins en eau de cette semaine. Surveiller l’humidité du sol avant d’irriguer.')}
                  </div>
                </div>
              )}
              {totals.grossNeed === 0 && (
                <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <div>
                    <strong>{tr('No irrigation needed this week.', 'لا حاجة إلى الري هذا الأسبوع.', 'Aucune irrigation nécessaire cette semaine.')}</strong> {tr('Forecast rainfall exceeds crop water demand.', 'يتجاوز المطر المتوقع الطلب المائي للمحصول.', 'Les précipitations dépassent la demande en eau de la culture.')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Historical context */}
          {history && history.daily.length > 0 && (
            <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold border-b pb-3">
                <TrendingUp className="h-3.5 w-3.5 text-violet-600" /> {tr('Last 7 days (historical ERA5)', 'آخر 7 أيام (بيانات ERA5 التاريخية)', '7 derniers jours (ERA5 historique)')}
              </div>
              {(() => {
                const total = history.daily.reduce((s, d) => s + (d.et0Sum || 0), 0);
                const totalRain = history.daily.reduce((s, d) => s + (d.precipitationSum || 0), 0);
                const avgT = history.daily.reduce((s, d) => s + (d.tempMean || 0), 0) / history.daily.length;
                return (
                  <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                    <Stat label={tr('Past 7-day ET₀', 'ET₀ لآخر 7 أيام', 'ET₀ 7 derniers jours')} value={`${total.toFixed(1)} ${tr('mm', 'مم', 'mm')}`} />
                    <Stat label={tr('Past 7-day rain', 'مطر آخر 7 أيام', 'Pluie 7 derniers jours')} value={`${totalRain.toFixed(1)} ${tr('mm', 'مم', 'mm')}`} />
                    <Stat label={tr('Avg temperature', 'متوسط الحرارة', 'Temp. moyenne')} value={`${avgT.toFixed(1)}°C`} />
                  </div>
                );
              })()}
              <p className="text-[10px] text-muted-foreground">
                {tr("Compare last week's ET₀ to this week's forecast — if past ET₀ exceeded rainfall, soil moisture is depleted and irrigation should be heavier.", 'قارن ET₀ للأسبوع الماضي بتوقعات هذا الأسبوع — إذا تجاوز ET₀ السابق كمية المطر، تكون رطوبة التربة مستنزفة ويجب زيادة الري.', 'Comparez l’ET₀ de la semaine dernière aux prévisions de cette semaine — si l’ET₀ passé a dépassé les précipitations, le sol est asséché et l’irrigation doit être plus abondante.')}
              </p>
            </div>
          )}
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 shadow-sm ${accent ? 'border-amber-300 bg-amber-50/40 dark:border-amber-800 dark:bg-amber-950/20' : 'bg-background/40'}`}>
      <div className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="font-mono text-sm font-semibold">{value}</div>
      {sub && <div className="text-[9px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
