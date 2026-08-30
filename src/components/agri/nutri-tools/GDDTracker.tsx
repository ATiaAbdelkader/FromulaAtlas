'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Sun, Calendar, TrendingUp, RefreshCw, Copy, RotateCcw } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  CalculatorShell,
  type TrilingualString,
  type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';

const CROP_AR: Record<string, string> = { corn: 'ذرة (مايز)', wheat: 'قمح', soybean: 'فول الصويا', rice: 'أرز', tomato: 'طماطم' };
const CROP_FR: Record<string, string> = { corn: 'Maïs', wheat: 'Blé', soybean: 'Soja', rice: 'Riz', tomato: 'Tomate' };
const STAGE_AR: Record<string, string> = {
  Emergence: 'الإنبات', V6: 'V6', V12: 'V12', 'VT (tasseling)': 'VT (ظهور النورة المذكرة)', Silking: 'ظهور الحرير', 'Black layer': 'الطبقة السوداء',
  Tillering: 'التفريع', 'Stem elongation': 'استطالة الساق', Heading: 'طرد السنابل', Flowering: 'الإزهار', Maturity: 'النضج',
  'Emergence (VE)': 'الإنبات (VE)', V3: 'V3', 'R1 (begin bloom)': 'R1 (بداية الإزهار)', 'R3 (begin pod)': 'R3 (بداية تكوين القرنات)',
  'R5 (begin seed)': 'R5 (بداية تكوين البذور)', 'R8 (maturity)': 'R8 (النضج)', 'Panicle init': 'بدء تكوين النورة',
  'Transplant recovery': 'التعافي بعد الشتل', Vegetative: 'النمو الخضري', 'First flower': 'أول زهرة', 'First fruit': 'أول ثمرة',
  'First harvest': 'أول حصاد', 'End harvest': 'نهاية الحصاد',
};
const STAGE_FR: Record<string, string> = {
  Emergence: 'Levée', V6: 'V6', V12: 'V12', 'VT (tasseling)': 'VT (floraison mâle)', Silking: 'Apparition des soies', 'Black layer': 'Couche noire',
  Tillering: 'Tallage', 'Stem elongation': 'Élongation de la tige', Heading: 'Épiaison', Flowering: 'Floraison', Maturity: 'Maturité',
  'Emergence (VE)': 'Levée (VE)', V3: 'V3', 'R1 (begin bloom)': 'R1 (début floraison)', 'R3 (begin pod)': 'R3 (début gousse)',
  'R5 (begin seed)': 'R5 (début graine)', 'R8 (maturity)': 'R8 (maturité)', 'Panicle init': 'Initiation panicule',
  'Transplant recovery': 'Reprise repiquage', Vegetative: 'Végétatif', 'First flower': 'Première fleur', 'First fruit': 'Premier fruit',
  'First harvest': 'Première récolte', 'End harvest': 'Fin de récolte',
};

function stageLabel(language: string, name: string): string {
  if (language === 'ar') return STAGE_AR[name] || name;
  if (language === 'fr') return STAGE_FR[name] || name;
  return name;
}

const CROP_BASE_TEMPS: Record<string, { name: string; emoji: string; tbase: number; targetGDD: number; stages: { gdd: number; name: string; emoji: string }[] }> = {
  corn: { name: 'Corn (maize)', emoji: '🌽', tbase: 10, targetGDD: 1500, stages: [
    { gdd: 150, name: 'Emergence', emoji: '🌱' }, { gdd: 350, name: 'V6', emoji: '🌿' },
    { gdd: 700, name: 'V12', emoji: '🌿' }, { gdd: 1000, name: 'VT (tasseling)', emoji: '🌾' },
    { gdd: 1300, name: 'Silking', emoji: '🌼' }, { gdd: 1500, name: 'Black layer', emoji: '🌽' },
  ]},
  wheat: { name: 'Wheat', emoji: '🌾', tbase: 0, targetGDD: 1800, stages: [
    { gdd: 100, name: 'Emergence', emoji: '🌱' }, { gdd: 400, name: 'Tillering', emoji: '🌿' },
    { gdd: 800, name: 'Stem elongation', emoji: '🌾' }, { gdd: 1200, name: 'Heading', emoji: '🌼' },
    { gdd: 1500, name: 'Flowering', emoji: '🌾' }, { gdd: 1800, name: 'Maturity', emoji: '🍂' },
  ]},
  soybean: { name: 'Soybean', emoji: '🫘', tbase: 10, targetGDD: 1400, stages: [
    { gdd: 100, name: 'Emergence (VE)', emoji: '🌱' }, { gdd: 300, name: 'V3', emoji: '🌿' },
    { gdd: 600, name: 'R1 (begin bloom)', emoji: '🌼' }, { gdd: 900, name: 'R3 (begin pod)', emoji: '🫘' },
    { gdd: 1200, name: 'R5 (begin seed)', emoji: '🫘' }, { gdd: 1400, name: 'R8 (maturity)', emoji: '🍂' },
  ]},
  rice: { name: 'Rice', emoji: '🍚', tbase: 10, targetGDD: 1700, stages: [
    { gdd: 100, name: 'Emergence', emoji: '🌱' }, { gdd: 400, name: 'Tillering', emoji: '🌿' },
    { gdd: 800, name: 'Panicle init', emoji: '🌾' }, { gdd: 1200, name: 'Heading', emoji: '🌼' },
    { gdd: 1500, name: 'Flowering', emoji: '🌾' }, { gdd: 1700, name: 'Maturity', emoji: '🍚' },
  ]},
  tomato: { name: 'Tomato', emoji: '🍅', tbase: 10, targetGDD: 1200, stages: [
    { gdd: 100, name: 'Transplant recovery', emoji: '🌱' }, { gdd: 400, name: 'Vegetative', emoji: '🌿' },
    { gdd: 600, name: 'First flower', emoji: '🌼' }, { gdd: 800, name: 'First fruit', emoji: '🍅' },
    { gdd: 1000, name: 'First harvest', emoji: '🍅' }, { gdd: 1200, name: 'End harvest', emoji: '🍅' },
  ]},
};

const TITLE: TrilingualString = {
  en: 'GDD Tracker (Growing Degree Days)',
  ar: 'متتبع الأيام الحرارية (GDD)',
  fr: 'Suivi des Degrés-Jours de Croissance (GDD)',
};

const DESC: TrilingualString = {
  en: 'Accumulates thermal time from Open-Meteo historical data · predicts growth stages',
  ar: 'يجمع الزمن الحراري من بيانات Open-Meteo التاريخية · ويتنبأ بمراحل النمو',
  fr: 'Cumule le temps thermique depuis les données historiques Open-Meteo · prédit les stades de croissance',
};

const PILL_LABEL: TrilingualString = { en: 'Select Crop:', ar: 'اختر المحصول:', fr: 'Culture :' };

const PROTOCOL_NOTE: TrilingualString = {
  en: 'GDD = ((Tmax + Tmin) / 2) − Tbase. More accurate than calendar days for predicting flowering, fertilizing, and harvest timing.',
  ar: 'GDD = ((Tmax + Tmin) / 2) − Tbase. أدق من الأيام التقويمية للتنبؤ بتوقيت الإزهار والتسميد والحصاد.',
  fr: 'GDD = ((Tmax + Tmin) / 2) − Tbase. Plus précis que les jours calendaires pour prédire floraison, fertilisation et récolte.',
};

export function GDDTracker() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  const [crop, setCrop] = useState('corn');
  const [plantingDate, setPlantingDate] = useState(new Date().toISOString().slice(0, 10));
  const [lat, setLat] = useState('37.77');
  const [lng, setLng] = useState('-122.42');
  const [weather, setWeather] = useState<{ date: string; tmax: number; tmin: number; gdd: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const cropInfo = CROP_BASE_TEMPS[crop];

  const fetchGDD = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const la = parseFloat(lat), ln = parseFloat(lng);
      const start = new Date(plantingDate + 'T00:00:00');
      const end = new Date();
      const daysDiff = Math.min(90, Math.floor((end.getTime() - start.getTime()) / 86400000));
      if (daysDiff <= 0) {
        setError(tr('Planting date must be in the past', 'يجب أن يكون تاريخ الزراعة في الماضي', 'La date de plantation doit être dans le passé'));
        setLoading(false);
        return;
      }

      const startDate = plantingDate;
      const endDate = end.toISOString().slice(0, 10);
      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${la}&longitude=${ln}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${tr('Weather API failed', 'فشل جلب بيانات الطقس', 'Échec de l\'API météo')}: ${res.status}`);
      const data = await res.json();
      const dates: string[] = data.daily.time;
      const tmaxes: number[] = data.daily.temperature_2m_max;
      const tmins: number[] = data.daily.temperature_2m_min;

      let cumulative = 0;
      const dailyGDD = dates.map((date, i) => {
        const tmax = Math.min(tmaxes[i], 30); // cap for corn-style
        const tmin = Math.max(tmins[i], 10);
        const gdd = Math.max(0, ((tmax + tmin) / 2) - cropInfo.tbase);
        cumulative += gdd;
        return { date, tmax: tmaxes[i], tmin: tmins[i], gdd: cumulative };
      });
      setWeather(dailyGDD);
    } catch (e: any) {
      setError(e?.message || tr('Failed to fetch weather', 'تعذر جلب بيانات الطقس', 'Échec de récupération de la météo'));
    } finally {
      setLoading(false);
    }
  }, [lat, lng, plantingDate, cropInfo, language]);

  useEffect(() => { fetchGDD(); }, [crop]);

  const currentGDD = weather.length > 0 ? weather[weather.length - 1].gdd : 0;
  const currentStage = useMemo(() => {
    let stage = cropInfo.stages[0];
    for (const s of cropInfo.stages) {
      if (currentGDD >= s.gdd) stage = s;
    }
    return stage;
  }, [currentGDD, cropInfo]);

  const nextStage = useMemo(() => {
    return cropInfo.stages.find(s => s.gdd > currentGDD);
  }, [currentGDD, cropInfo]);

  const pctProgress = (currentGDD / cropInfo.targetGDD) * 100;

  const handleReset = () => {
    setPlantingDate(new Date().toISOString().slice(0, 10));
    setLat('37.77');
    setLng('-122.42');
    setWeather([]);
    setError(null);
    toast({ title: tr('Reset to defaults', 'تمت إعادة التعيين', 'Réinitialisé') });
  };

  const handleCopy = () => {
    if (weather.length === 0) {
      toast({ title: tr('No data to copy', 'لا توجد بيانات للنسخ', 'Aucune donnée à copier') });
      return;
    }
    const cropName = tr(cropInfo.name, CROP_AR[crop], CROP_FR[crop]);
    const lines = [
      `=== GDD TRACKER ===`,
      `Crop: ${cropInfo.emoji} ${cropName}`,
      `Planting date: ${plantingDate}`,
      `Location: ${lat}, ${lng}`,
      ``,
      `Cumulative GDD: ${currentGDD.toFixed(0)} / ${cropInfo.targetGDD} (${pctProgress.toFixed(0)}%)`,
      `Days since planting: ${weather.length}`,
      `Current stage: ${currentStage.emoji} ${stageLabel(language, currentStage.name)}`,
      nextStage
        ? `Next stage: ${nextStage.emoji} ${stageLabel(language, nextStage.name)} (${(nextStage.gdd - currentGDD).toFixed(0)} GDD to go)`
        : `Next stage: Mature! ✅`,
      ``,
      `Tbase: ${cropInfo.tbase}°C`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    toast({ title: tr('Summary Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  const pills: CalculatorPill[] = Object.entries(CROP_BASE_TEMPS).map(([k, v]) => ({
    key: k,
    emoji: v.emoji,
    label: tr(v.name, CROP_AR[k], CROP_FR[k]),
  }));

  return (
    <CalculatorShell
      icon={Sun}
      title={TITLE}
      description={DESC}
      badge="Open-Meteo"
      accent="amber"
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
      pills={pills}
      activePill={crop}
      onPillClick={setCrop}
      pillLabel={PILL_LABEL}
      protocolNote={PROTOCOL_NOTE}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-600" />
              {tr('Field & Planting Setup', 'إعداد الحقل والزراعة', 'Configuration du champ et du semis')}
            </span>
            <span className="text-xs font-bold bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 rounded-lg px-2 py-0.5">
              {cropInfo.emoji} {tr(cropInfo.name, CROP_AR[crop], CROP_FR[crop])}
            </span>
          </div>

          <CalculatorShell.InputField
            label={tr('Planting date', 'تاريخ الزراعة', 'Date de plantation')}
            value={plantingDate}
            onChange={setPlantingDate}
            type="date"
            helper={tr('Start of thermal accumulation', 'بداية التراكم الحراري', 'Début du cumul thermique')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CalculatorShell.InputField
              label={tr('Latitude', 'خط العرض', 'Latitude')}
              value={lat}
              onChange={setLat}
              type="number"
              step="0.0001"
              placeholder="37.77"
            />
            <CalculatorShell.InputField
              label={tr('Longitude', 'خط الطول', 'Longitude')}
              value={lng}
              onChange={setLng}
              type="number"
              step="0.0001"
              placeholder="-122.42"
            />
          </div>

          <Button size="sm" onClick={fetchGDD} disabled={loading} className="h-11 w-full gap-2">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading
              ? tr('Fetching weather…', 'جارٍ جلب الطقس…', 'Récupération de la météo…')
              : tr('Recalculate GDD', 'إعادة حساب الأيام الحرارية', 'Recalculer les GDD')}
          </Button>

          {loading && <Skeleton className="h-24 w-full" />}

          {error && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-sm leading-relaxed text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300">
              {error}
            </div>
          )}
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
          {!loading && !error && weather.length > 0 ? (
            <>
              <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-amber-50 via-transparent to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
                <span className="text-base font-bold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                  {tr('Cumulative GDD', 'الأيام الحرارية التراكمية', 'GDD cumulé')}
                </span>
                <span className="font-mono text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 rounded-lg px-2 py-0.5">
                  {currentGDD.toFixed(0)} / {cropInfo.targetGDD}
                </span>
              </div>

              <CalculatorShell.MetricTile
                label={tr('Cumulative GDD', 'الأيام الحرارية التراكمية', 'GDD cumulé')}
                value={currentGDD.toFixed(0)}
                unit={`/ ${cropInfo.targetGDD}`}
                color="amber"
                helper={tr(`${weather.length} days since planting (${pctProgress.toFixed(0)}%)`, `${weather.length} يوماً منذ الزراعة (${pctProgress.toFixed(0)}%)`, `${weather.length} jours depuis le semis (${pctProgress.toFixed(0)}%)`)}
              />

              {/* Progress bar */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-900 dark:bg-amber-950/20">
                <div className="h-3 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.min(100, Math.max(0, pctProgress))} aria-valuemin={0} aria-valuemax={100} aria-label={tr('GDD progress to maturity', 'تقدم الأيام الحرارية نحو النضج', 'Progression des GDD vers la maturité')}>
                  <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all" style={{ width: `${Math.min(100, pctProgress)}%` }} />
                </div>
                <div className="flex justify-between mt-1 text-[8px] text-muted-foreground">
                  {cropInfo.stages.map(s => <span key={s.name} className={currentGDD >= s.gdd ? 'text-foreground font-bold' : ''}>{s.emoji}</span>)}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <CalculatorShell.MetricTile
                  label={tr('Current stage', 'المرحلة الحالية', 'Stade actuel')}
                  value={`${currentStage.emoji} ${stageLabel(language, currentStage.name)}`}
                  color="emerald"
                />
                <CalculatorShell.MetricTile
                  label={tr('Next stage', 'المرحلة التالية', 'Prochain stade')}
                  value={nextStage ? `${nextStage.emoji} ${stageLabel(language, nextStage.name)}` : '✅ ' + tr('Mature!', 'ناضج!', 'Mûr !')}
                  color="teal"
                  helper={nextStage ? `${(nextStage.gdd - currentGDD).toFixed(0)} GDD` : undefined}
                />
              </div>

              {/* Daily GDD sparkline */}
              <div className="rounded-xl border bg-muted/10 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 text-amber-600" />
                  {tr('Daily GDD accumulation', 'تراكم الأيام الحرارية اليومية', 'Accumulation quotidienne des GDD')}
                </div>
                <div className="flex items-end gap-0.5 h-16">
                  {weather.slice(-30).map((d, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-amber-500/70 rounded-t"
                      style={{ height: `${Math.min(100, (d.gdd / cropInfo.targetGDD) * 100)}%` }}
                      title={`${d.date}: ${d.gdd.toFixed(0)} GDD`}
                    />
                  ))}
                </div>
                <div className="text-[8px] text-muted-foreground text-center mt-0.5">
                  {tr('Last', 'آخر', 'Derniers')} {Math.min(30, weather.length)} {tr('days', 'يوماً', 'jours')}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center text-sm text-muted-foreground">
              <Sun className="h-8 w-8 mb-2 opacity-40" />
              {loading
                ? tr('Fetching weather…', 'جارٍ جلب الطقس…', 'Récupération de la météo…')
                : tr('Enter location & planting date, then click Recalculate.', 'أدخل الموقع وتاريخ الزراعة ثم اضغط إعادة الحساب.', 'Saisissez le lieu et la date, puis cliquez sur Recalculer.')}
            </div>
          )}
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
