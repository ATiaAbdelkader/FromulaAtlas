'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, CloudRain, Droplets, Loader2, Printer, RefreshCw, Sprout, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { copyFor, useTranslation, type Language } from '@/lib/language-store';
import { CROP_KCS, getForecast, kcForDay, type ForecastResult } from '@/lib/open-meteo';
import { calculateWaterBudget, type WaterBudgetResult } from '@/lib/water-budget';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

const CROP_AR: Record<string, string> = {
  'Maize (field)': 'ذرة حقلية', 'Maize (sweet)': 'ذرة حلوة', Wheat: 'قمح', Rice: 'أرز', Soybean: 'فول الصويا', Cotton: 'قطن',
  Potato: 'بطاطس', Tomato: 'طماطم', Onion: 'بصل', Alfalfa: 'برسيم حجازي', 'Grapes (wine)': 'عنب (نبيذ)', Citrus: 'حمضيات',
  Apple: 'تفاح', Coffee: 'قهوة', Sunflower: 'عباد الشمس', Sorghum: 'ذرة رفيعة', Barley: 'شعير', 'Canola / Rapeseed': 'كانولا / اغتصاب',
  Lettuce: 'خس', Cabbage: 'ملفوف', 'Bell pepper': 'فلفل حلو', Cucumber: 'خيار',
};

const CROP_FR: Record<string, string> = {
  'Maize (field)': 'Maïs grain', 'Maize (sweet)': 'Maïs doux', Wheat: 'Blé', Rice: 'Riz', Soybean: 'Soja', Cotton: 'Coton',
  Potato: 'Pomme de terre', Tomato: 'Tomate', Onion: 'Oignon', Alfalfa: 'Luzerne', 'Grapes (wine)': 'Raisin de cuve', Citrus: 'Agrumes',
  Apple: 'Pomme', Coffee: 'Café', Sunflower: 'Tournesol', Sorghum: 'Sorgho', Barley: 'Orge', 'Canola / Rapeseed': 'Colza',
  Lettuce: 'Laitue', Cabbage: 'Chou', 'Bell pepper': 'Poivron', Cucumber: 'Concombre',
};

function cropLabel(language: Language, name: string): string {
  return copyFor(language, name, CROP_AR[name] ?? name, CROP_FR[name] ?? name);
}

function parseSeries(value: string): number[] {
  return value.split(/[,\s;]+/).map(Number).filter(number => Number.isFinite(number) && number >= 0);
}

function localizeWarning(language: Language, warning: string): string {
  const ar: Record<string, string> = {
    'Enter a positive field area to calculate total irrigation volume.': 'أدخل مساحة حقل موجبة لحساب إجمالي حجم الري.',
    'Enter root-zone available water to activate depletion guardrails.': 'أدخل كمية الماء المتاح في منطقة الجذور لتفعيل ضوابط الاستنزاف.',
    'Low system efficiency increases the gross irrigation requirement; inspect distribution uniformity and losses.': 'تزيد كفاءة النظام المنخفضة إجمالي احتياج الري؛ افحص انتظام التوزيع والفواقد.',
    'A high allowable-depletion setting may expose shallow-rooted or sensitive crops to water stress.': 'قد يعرّض إعداد الاستنزاف المسموح المرتفع المحاصيل سطحية الجذور أو الحساسة للإجهاد المائي.',
    'Forecast rainfall exceeds crop ETc for part of the period; verify field drainage before irrigating.': 'يتجاوز المطر المتوقع ETc للمحصول خلال جزء من الفترة؛ تحقق من تصريف الحقل قبل الري.',
  };
  const fr: Record<string, string> = {
    'Enter a positive field area to calculate total irrigation volume.': 'Saisissez une surface positive pour calculer le volume total d’irrigation.',
    'Enter root-zone available water to activate depletion guardrails.': 'Saisissez l’eau disponible dans la zone racinaire pour activer les garde-fous.',
    'Low system efficiency increases the gross irrigation requirement; inspect distribution uniformity and losses.': 'Une faible efficacité augmente le besoin brut ; vérifiez l’uniformité et les pertes.',
    'A high allowable-depletion setting may expose shallow-rooted or sensitive crops to water stress.': 'Un seuil de déplétion élevé peut exposer les cultures sensibles ou à racines superficielles au stress hydrique.',
    'Forecast rainfall exceeds crop ETc for part of the period; verify field drainage before irrigating.': 'Les pluies prévues dépassent l’ETc pendant une partie de la période ; vérifiez le drainage avant d’irriguer.',
  };
  return copyFor(language, warning, ar[warning] ?? warning, fr[warning] ?? warning);
}

function statusCopy(language: Language, status: WaterBudgetResult['status']): string {
  const values = {
    surplus: ['Surplus', 'فائض', 'Excédent'],
    balanced: ['Balanced', 'متوازن', 'Équilibré'],
    deficit: ['Deficit', 'عجز', 'Déficit'],
    urgent: ['Urgent refill', 'إعادة تعبئة عاجلة', 'Recharge urgente'],
  } as const;
  const [en, ar, fr] = values[status];
  return copyFor(language, en, ar, fr);
}

function statusClass(status: WaterBudgetResult['status']): string {
  if (status === 'surplus') return 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200';
  if (status === 'urgent') return 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200';
  if (status === 'deficit') return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200';
  return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200';
}

function metricLabel(language: Language, english: string, arabic: string, french: string): string {
  return copyFor(language, english, arabic, french);
}

const TITLE: TrilingualString = {
  en: 'Water Budget Optimizer',
  ar: 'محسّن ميزانية المياه',
  fr: 'Optimiseur de budget hydrique',
};

const DESC: TrilingualString = {
  en: 'FAO-56 ETc × soil-water balance · forecast-aware irrigation depth and volume',
  ar: 'ميزان مياه التربة وفق ETc بطريقة FAO-56 · عمق وحجم الري مع مراعاة التوقعات',
  fr: 'Bilan hydrique du sol ETc FAO-56 · profondeur et volume d’irrigation selon les prévisions',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Planning aid only: verify soil moisture, field drainage, weather, system capacity, and local agronomic guidance before irrigating.',
  ar: 'أداة مساعدة للتخطيط فقط: تحقق من رطوبة التربة وتصريف الحقل والطقس وقدرة النظام والإرشادات الزراعية المحلية قبل الري.',
  fr: 'Aide à la planification uniquement : vérifiez l’humidité du sol, le drainage, la météo, la capacité du système et les conseils agronomiques locaux avant d’irriguer.',
};

export function WaterBudgetOptimizer() {
  const { language, isRTL } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  const [cropName, setCropName] = useState('Maize (field)');
  const [dayOfSeason, setDayOfSeason] = useState('60');
  const [areaHa, setAreaHa] = useState('1');
  const [dailyEt0, setDailyEt0] = useState('4.5, 5.0, 5.2, 4.8, 4.2, 3.9, 3.7');
  const [dailyRain, setDailyRain] = useState('0, 0, 2, 0, 0, 5, 0');
  const [appliedGross, setAppliedGross] = useState('0');
  const [efficiency, setEfficiency] = useState('85');
  const [rootWater, setRootWater] = useState('140');
  const [initialDepletion, setInitialDepletion] = useState('30');
  const [allowedDepletion, setAllowedDepletion] = useState('50');
  const [effectiveRain, setEffectiveRain] = useState('80');
  const [latitude, setLatitude] = useState('36.75');
  const [longitude, setLongitude] = useState('3.05');
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState('');
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [copied, setCopied] = useState(false);

  const crop = useMemo(() => CROP_KCS.find(entry => entry.crop === cropName) ?? CROP_KCS[0], [cropName]);
  const kc = useMemo(() => kcForDay(crop, Math.max(1, Math.min(crop.seasonLength, Number(dayOfSeason) || 1))), [crop, dayOfSeason]);
  const et0Series = useMemo(() => parseSeries(dailyEt0), [dailyEt0]);
  const rainSeries = useMemo(() => parseSeries(dailyRain), [dailyRain]);
  const result = useMemo(() => calculateWaterBudget({
    areaHa: Number(areaHa) || 0,
    dailyEt0Mm: et0Series,
    dailyRainMm: rainSeries,
    kc,
    irrigationAppliedGrossMm: Number(appliedGross) || 0,
    systemEfficiencyPct: Number(efficiency) || 0,
    rootZoneAvailableWaterMm: Number(rootWater) || 0,
    initialDepletionPct: Number(initialDepletion) || 0,
    allowedDepletionPct: Number(allowedDepletion) || 0,
    effectiveRainPct: Number(effectiveRain) || 0,
  }), [areaHa, et0Series, rainSeries, kc, appliedGross, efficiency, rootWater, initialDepletion, allowedDepletion, effectiveRain]);

  const loadForecast = async () => {
    setLoadingWeather(true);
    setWeatherError('');
    try {
      const la = Number(latitude);
      const lo = Number(longitude);
      if (!Number.isFinite(la) || !Number.isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) {
        throw new Error(tr('Enter valid latitude and longitude.', 'أدخل خط العرض وخط الطول الصحيحين.', 'Saisissez une latitude et une longitude valides.'));
      }
      const response = await getForecast(la, lo, { days: 7 });
      setForecast(response);
      setDailyEt0(response.daily.map(day => day.et0.toFixed(1)).join(', '));
      setDailyRain(response.daily.map(day => day.precipitationSum.toFixed(1)).join(', '));
    } catch (error) {
      setWeatherError(error instanceof Error ? error.message : tr('Could not load forecast.', 'تعذّر تحميل التوقعات.', 'Impossible de charger les prévisions.'));
    } finally {
      setLoadingWeather(false);
    }
  };

  const printReport = () => {
    const popup = window.open('', '_blank', 'noopener,noreferrer');
    if (!popup) return;
    const ttr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
    popup.document.write(`<!doctype html><html dir="${isRTL ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>${ttr('Water Budget Optimizer', 'محسّن ميزانية المياه', 'Optimiseur de budget hydrique')}</title><style>body{font-family:Arial,sans-serif;max-width:900px;margin:32px auto;padding:0 20px;color:#172033}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ccd4df;padding:7px;text-align:start}h1{color:#0e7490}small{color:#64748b}</style></head><body><h1>${ttr('Water Budget Optimizer', 'محسّن ميزانية المياه', 'Optimiseur de budget hydrique')}</h1><p>${cropLabel(language, crop.crop)} · ${areaHa} ha · Kc ${kc.toFixed(2)}</p><h2>${ttr('Summary', 'الملخص', 'Résumé')}</h2><p>${ttr('Gross irrigation need', 'إجمالي احتياج الري', 'Besoin brut d’irrigation')}: ${result.grossIrrigationNeedMm.toFixed(1)} mm (${result.grossVolumeM3.toFixed(0)} m³)</p><p>${ttr('Additional volume needed', 'الحجم الإضافي المطلوب', 'Volume supplémentaire requis')}: ${result.additionalVolumeM3.toFixed(0)} m³</p><table><thead><tr><th>${ttr('Day', 'اليوم', 'Jour')}</th><th>ETc (mm)</th><th>${ttr('Effective rain', 'المطر الفعال', 'Pluie efficace')}</th><th>${ttr('Recommended irrigation', 'الري الموصى به', 'Irrigation recommandée')}</th></tr></thead><tbody>${result.days.map(day => `<tr><td>${day.day}</td><td>${day.etcMm.toFixed(1)}</td><td>${day.effectiveRainMm.toFixed(1)}</td><td>${day.recommendedGrossIrrigationMm.toFixed(1)} mm</td></tr>`).join('')}</tbody></table><small>${ttr('Planning aid only. Verify soil moisture, weather, system capacity, and local agronomic guidance before irrigating.', 'أداة مساعدة للتخطيط فقط. تحقق من رطوبة التربة والطقس وقدرة النظام والإرشادات الزراعية المحلية قبل الري.', 'Aide à la planification uniquement. Vérifiez l’humidité du sol, la météo, la capacité du système et les conseils locaux avant d’irriguer.')}</small><script>window.print()</script></body></html>`);
    popup.document.close();
  };

  const handleReset = () => {
    setCropName('Maize (field)');
    setDayOfSeason('60');
    setAreaHa('1');
    setDailyEt0('4.5, 5.0, 5.2, 4.8, 4.2, 3.9, 3.7');
    setDailyRain('0, 0, 2, 0, 0, 5, 0');
    setAppliedGross('0');
    setEfficiency('85');
    setRootWater('140');
    setInitialDepletion('30');
    setAllowedDepletion('50');
    setEffectiveRain('80');
    setLatitude('36.75');
    setLongitude('3.05');
    setForecast(null);
    setWeatherError('');
    toast({ title: tr('Reset to defaults', 'تمت إعادة التعيين', 'Réinitialisé') });
  };

  const handleCopy = () => {
    const lines = [
      `=== WATER BUDGET OPTIMIZER ===`,
      `Crop: ${cropLabel(language, crop.crop)}`,
      `Day of season: ${dayOfSeason}`,
      `Area: ${areaHa} ha · Kc ${kc.toFixed(2)}`,
      ``,
      `Crop ETc: ${result.totalEtcMm.toFixed(1)} mm`,
      `Effective rain: ${result.totalEffectiveRainMm.toFixed(1)} mm (${result.totalRainMm.toFixed(1)} total)`,
      `Gross irrigation need: ${result.grossIrrigationNeedMm.toFixed(1)} mm (${result.grossVolumeM3.toFixed(0)} m³)`,
      `Additional volume needed: ${result.additionalVolumeM3.toFixed(0)} m³`,
      `Status: ${statusCopy(language, result.status)}`,
      ``,
      `7-day plan:`,
      ...result.days.map(day => `  Day ${day.day}: ETc ${day.etcMm.toFixed(1)} · rain ${day.effectiveRainMm.toFixed(1)} · irrigate ${day.recommendedGrossIrrigationMm.toFixed(1)} mm${day.shouldIrrigate ? ' ✅' : ''}`),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    toast({ title: tr('Summary Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <CalculatorShell
      icon={Droplets}
      title={TITLE}
      description={DESC}
      badge="FAO-56"
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
          icon: RefreshCw,
          label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
        {
          icon: Printer,
          label: { en: 'Print plan', ar: 'طباعة الخطة', fr: 'Imprimer le plan' },
          onClick: printReport,
        },
      ]}
      protocolNote={PROTOCOL_NOTE}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
          <section className="space-y-3" aria-labelledby="water-budget-inputs">
            <h3 id="water-budget-inputs" className="flex items-center gap-2 text-sm font-semibold">
              <Sprout className="h-4 w-4 text-emerald-600" />
              {tr('Crop and field inputs', 'مدخلات المحصول والحقل', 'Données de culture et de parcelle')}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={tr('Crop', 'المحصول', 'Culture')} value={cropName} onChange={setCropName} selectOptions={CROP_KCS.map(entry => ({ value: entry.crop, label: cropLabel(language, entry.crop) }))} />
              <Field label={tr('Day of season', 'يوم الموسم', 'Jour de la saison')} value={dayOfSeason} onChange={setDayOfSeason} type="number" min="1" max={String(crop.seasonLength)} suffix={`1–${crop.seasonLength}`} />
              <Field label={tr('Field area (ha)', 'مساحة الحقل (هكتار)', 'Surface (ha)')} value={areaHa} onChange={setAreaHa} type="number" min="0" step="0.1" />
              <Field label={tr('Applied irrigation (gross mm)', 'الري المطبق (مم إجمالي)', 'Irrigation appliquée (mm brut)')} value={appliedGross} onChange={setAppliedGross} type="number" min="0" step="0.1" />
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/30">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
                <CalendarDays className="h-3.5 w-3.5 text-cyan-600" />
                {tr('7-day water inputs', 'مدخلات المياه لـ 7 أيام', 'Données hydriques sur 7 jours')}
              </div>
              <Field label="ET₀ (mm/day)" value={dailyEt0} onChange={setDailyEt0} placeholder="4.5, 5.0, 5.2…" />
              <Field label={tr('Rainfall (mm/day)', 'المطر (مم/يوم)', 'Pluie (mm/jour)')} value={dailyRain} onChange={setDailyRain} placeholder="0, 0, 2…" />
              <p className="mt-2 text-[10px] text-muted-foreground">{tr('Enter comma-separated values. The last value repeats if the two series have different lengths.', 'أدخل قيماً مفصولة بفواصل. تتكرر القيمة الأخيرة إذا اختلف طول السلسلتين.', 'Saisissez des valeurs séparées par des virgules. La dernière valeur est répétée si les séries diffèrent.')}</p>
            </div>
            <div className="rounded-lg border border-sky-200/70 bg-sky-50/50 p-3 dark:border-sky-900/60 dark:bg-sky-950/20">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
                <CloudRain className="h-3.5 w-3.5 text-sky-600" />
                {tr('Load live 7-day weather', 'تحميل الطقس المباشر لـ 7 أيام', 'Charger la météo en direct sur 7 jours')}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={tr('Latitude', 'خط العرض', 'Latitude')} value={latitude} onChange={setLatitude} type="number" step="0.0001" />
                <Field label={tr('Longitude', 'خط الطول', 'Longitude')} value={longitude} onChange={setLongitude} type="number" step="0.0001" />
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-3 w-full gap-1.5" onClick={loadForecast} disabled={loadingWeather}>
                {loadingWeather ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                {loadingWeather ? tr('Loading forecast…', 'جارٍ تحميل التوقعات…', 'Chargement…') : tr('Use live forecast', 'استخدام التوقعات المباشرة', 'Utiliser les prévisions')}
              </Button>
              {forecast && <p className="mt-2 text-[10px] text-emerald-700 dark:text-emerald-300">{tr('Forecast loaded', 'تم تحميل التوقعات', 'Prévisions chargées')} · {forecast.timezone}</p>}
              {weatherError && <p className="mt-2 text-xs text-red-600">{weatherError}</p>}
            </div>
          </section>

          <section className="space-y-3" aria-labelledby="water-budget-guardrails">
            <h3 id="water-budget-guardrails" className="flex items-center gap-2 text-sm font-semibold">
              <Droplets className="h-4 w-4 text-cyan-600" />
              {tr('Soil-water guardrails', 'ضوابط مياه التربة', 'Garde-fous hydriques du sol')}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={tr('Root-zone available water (mm)', 'الماء المتاح في منطقة الجذور (مم)', 'Eau disponible en zone racinaire (mm)')} value={rootWater} onChange={setRootWater} type="number" min="0" step="1" />
              <Field label={tr('Initial depletion (%)', 'الاستنزاف الأولي (%)', 'Déplétion initiale (%)')} value={initialDepletion} onChange={setInitialDepletion} type="number" min="0" max="100" />
              <Field label={tr('Allowed depletion (%)', 'الاستنزاف المسموح (%)', 'Déplétion autorisée (%)')} value={allowedDepletion} onChange={setAllowedDepletion} type="number" min="1" max="100" />
              <Field label={tr('System efficiency (%)', 'كفاءة النظام (%)', 'Efficacité du système (%)')} value={efficiency} onChange={setEfficiency} type="number" min="1" max="100" />
              <Field label={tr('Effective rainfall (%)', 'المطر الفعال (%)', 'Pluie efficace (%)')} value={effectiveRain} onChange={setEffectiveRain} type="number" min="0" max="100" />
            </div>
            <div className={`rounded-lg border p-3 ${statusClass(result.status)}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold">{tr('Current water status', 'حالة المياه الحالية', 'État hydrique actuel')}</span>
                <Badge variant="outline" className="border-current text-current">{statusCopy(language, result.status)}</Badge>
              </div>
              <p className="mt-1 text-xs">{result.status === 'urgent' ? tr('Without the recommended refill, depletion approaches the root-zone limit.', 'من دون إعادة التعبئة الموصى بها، يقترب الاستنزاف من حد منطقة الجذور.', 'Sans recharge recommandée, la déplétion approche la limite de la zone racinaire.') : result.status === 'deficit' ? tr('Applied water is below the crop demand for this forecast window.', 'المياه المطبقة أقل من احتياج المحصول خلال فترة التوقع.', 'L’eau appliquée est inférieure au besoin de la culture sur cette période.') : result.status === 'surplus' ? tr('Applied water and effective rainfall exceed modeled crop demand.', 'تتجاوز المياه المطبقة والمطر الفعال الطلب المقدر للمحصول.', 'L’eau appliquée et la pluie efficace dépassent le besoin modélisé.') : tr('Applied water is close to modeled crop demand.', 'المياه المطبقة قريبة من الطلب المقدر للمحصول.', 'L’eau appliquée est proche du besoin modélisé.')}</p>
            </div>
          </section>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-sky-50 via-transparent to-blue-50/50 dark:from-sky-950/30 dark:to-blue-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
            <span className="text-base font-bold flex items-center gap-2">
              <Droplets className="h-4 w-4 text-sky-600" />
              {tr('Irrigation Requirements', 'متطلبات الري', 'Besoins d\'irrigation')}
            </span>
            <span className="font-mono text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 rounded-lg px-2 py-0.5">
              {result.grossIrrigationNeedMm.toFixed(1)} mm
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CalculatorShell.MetricTile
              label={metricLabel(language, 'Crop ETc', 'ETc للمحصول', 'ETc de la culture')}
              value={`${result.totalEtcMm.toFixed(1)}`}
              unit="mm"
              color="teal"
              helper={`Kc ${kc.toFixed(2)}`}
            />
            <CalculatorShell.MetricTile
              label={metricLabel(language, 'Effective rain', 'المطر الفعال', 'Pluie efficace')}
              value={`${result.totalEffectiveRainMm.toFixed(1)}`}
              unit="mm"
              color="sky"
              helper={`${result.totalRainMm.toFixed(1)} mm ${tr('total', 'إجمالي', 'total')}`}
            />
            <CalculatorShell.MetricTile
              label={metricLabel(language, 'Gross irrigation need', 'إجمالي احتياج الري', 'Besoin brut d’irrigation')}
              value={`${result.grossIrrigationNeedMm.toFixed(1)}`}
              unit="mm"
              color="emerald"
              helper={`${result.grossVolumeM3.toFixed(0)} m³`}
            />
            <CalculatorShell.MetricTile
              label={metricLabel(language, 'Additional volume', 'الحجم الإضافي', 'Volume supplémentaire')}
              value={`${result.additionalVolumeM3.toFixed(0)}`}
              unit="m³"
              color="amber"
              helper={tr('after applied water', 'بعد المياه المطبقة', 'après l’eau appliquée')}
            />
          </div>

          {result.warnings.length > 0 && (
            <div className="space-y-2">
              {result.warnings.map(warning => (
                <div key={warning} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {localizeWarning(language, warning)}
                </div>
              ))}
            </div>
          )}
        </div>
      </CalculatorShell.Results>

      {/* Full-width staged irrigation table */}
      <div className="lg:col-span-12">
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="flex items-center gap-2 border-b pb-3 text-sm font-semibold">
            <CalendarDays className="h-4 w-4 text-cyan-600" />
            {tr('Staged irrigation recommendation', 'توصية الري المرحلية', 'Recommandation d’irrigation par étapes')}
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[620px] text-xs">
              <thead>
                <tr className="border-b text-start text-muted-foreground bg-muted/30">
                  <th className="px-3 py-2 text-start">{tr('Day', 'اليوم', 'Jour')}</th>
                  <th className="px-3 py-2 text-start">ETc</th>
                  <th className="px-3 py-2 text-start">{tr('Effective rain', 'المطر الفعال', 'Pluie efficace')}</th>
                  <th className="px-3 py-2 text-start">{tr('Depletion before', 'الاستنزاف قبل الري', 'Déplétion avant')}</th>
                  <th className="px-3 py-2 text-start">{tr('Gross irrigation', 'الري الإجمالي', 'Irrigation brute')}</th>
                  <th className="px-3 py-2 text-start">{tr('Action', 'الإجراء', 'Action')}</th>
                </tr>
              </thead>
              <tbody>
                {result.days.map(day => (
                  <tr key={day.day} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">{day.day}</td>
                    <td className="px-3 py-2">{day.etcMm.toFixed(1)} mm</td>
                    <td className="px-3 py-2">{day.effectiveRainMm.toFixed(1)} mm</td>
                    <td className="px-3 py-2">{day.depletionBeforeIrrigationMm.toFixed(1)} mm</td>
                    <td className="px-3 py-2 font-semibold text-cyan-700 dark:text-cyan-300">{day.recommendedGrossIrrigationMm.toFixed(1)} mm</td>
                    <td className="px-3 py-2">
                      {day.shouldIrrigate
                        ? <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300"><Droplets className="h-3.5 w-3.5" />{tr('Irrigate', 'ارْوِ', 'Irriguer')}</span>
                        : <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" />{tr('Monitor', 'راقب', 'Surveiller')}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </CalculatorShell>
  );
}

function Field({ label, value, onChange, type = 'text', min, max, step, suffix, placeholder, selectOptions }: { label: string; value: string; onChange: (value: string) => void; type?: string; min?: string; max?: string; step?: string; suffix?: string; placeholder?: string; selectOptions?: { value: string; label: string }[] }) {
  return <div><Label className="flex items-center gap-1 text-xs font-medium">{label}{suffix && <span className="text-[10px] font-normal text-muted-foreground">({suffix})</span>}</Label>{selectOptions ? <select aria-label={label} value={value} onChange={event => onChange(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm">{selectOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <Input aria-label={label} value={value} onChange={event => onChange(event.target.value)} type={type} min={min} max={max} step={step} placeholder={placeholder} className="mt-1 h-9 text-sm" />}</div>;
}
