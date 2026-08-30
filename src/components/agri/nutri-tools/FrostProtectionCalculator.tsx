'use client';

import { useState, useMemo } from 'react';
import {
  Snowflake,
  Wind,
  Droplets,
  CheckCircle2,
  AlertTriangle,
  Copy,
  RotateCcw,
} from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
  type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';

// ---------------------------------------------------------------------------
// Trilingual content
// ---------------------------------------------------------------------------

const TITLE: TrilingualString = {
  en: 'Frost Protection Calculator',
  ar: 'حاسبة الحماية من الصقيع',
  fr: 'Calculateur de protection antigel',
};

const DESCRIPTION: TrilingualString = {
  en: 'Radiative vs advective frost · sprinkler / wind machine / smudge pot sizing.',
  ar: 'الصقيع الإشعاعي مقابل الحملي · تحجيم الرشاشات وآلات الرياح وأوعية التدخين.',
  fr: 'Gel radiatif vs advectif · dimensionnement asperseurs / brise-vent / pots à feu.',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Start sprinklers when wet-bulb temp reaches 0°C. Run continuously until ice melts next morning. Wind machines only work for radiative frost (inversion). Smudge pots: check local air quality regulations.',
  ar: 'شغّل الرشاشات عندما تصل حرارة البصيلة الرطبة إلى 0°م. شغّلها باستمرار حتى يذوب الجليد في صباح اليوم التالي. تعمل آلات الرياح فقط مع الصقيع الإشعاعي (الانقلاب). لأوعية التدخين: تحقّق من لوائح جودة الهواء المحلية.',
  fr: "Démarrez les asperseurs à 0 °C de bulbe humide. Fonctionnement continu jusqu\u2019au dégel matinal. Les turbines ne fonctionnent qu\u2019en gel radiatif (inversion). Pots à feu : vérifiez la réglementation locale de qualité de l\u2019air.",
};

const METHOD_PILLS: CalculatorPill[] = [
  { key: 'sprinkler', label: '💧 Overhead Sprinkler', emoji: '💧' },
  { key: 'windmachine', label: '🌀 Wind Machine', emoji: '🌀' },
  { key: 'smudge', label: '🔥 Smudge Pots', emoji: '🔥' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FrostProtectionCalculator() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [temp, setTemp] = useState('0');
  const [dewPoint, setDewPoint] = useState('-3');
  const [windSpeed, setWindSpeed] = useState('3');
  const [area, setArea] = useState('5');
  const [method, setMethod] = useState('sprinkler');
  const [copied, setCopied] = useState(false);

  // Calculation — UNCHANGED
  const result = useMemo(() => {
    const T = parseFloat(temp), DP = parseFloat(dewPoint), WS = parseFloat(windSpeed), A = parseFloat(area);
    if (!Number.isFinite(T)) return null;

    // Frost risk: temp below 2°C + low dew point + calm wind = radiative frost
    const isFrost = T <= 2;
    const isAdvective = WS > 5; // advective frost = windy, harder to protect
    const inversionStrength = T - DP; // larger = drier = colder burn potential

    let sprinklerRate = 0, sprinklerFlow = 0;
    if (method === 'sprinkler') {
      // Application rate depends on temp + wind (USDA NRCS method)
      sprinklerRate = Math.max(2.5, (2 - T) * 1.5 + (WS > 2 ? 2 : 0)); // mm/hr
      sprinklerFlow = sprinklerRate * A * 10; // m³/hr (mm/hr × ha × 10)
    }

    let windMachineCoverage = 0;
    if (method === 'windmachine') {
      windMachineCoverage = WS < 3 ? 2.5 : 1.5; // ha per machine (less effective in wind)
    }

    let smudgePotCount = 0;
    if (method === 'smudge') {
      smudgePotCount = Math.ceil(A * (isAdvective ? 60 : 40)); // pots/ha
    }

    const canProtect = !isAdvective || method === 'sprinkler';
    const effectiveness = isAdvective ? 30 : 70; // %

    return { isFrost, isAdvective, inversionStrength, sprinklerRate, sprinklerFlow, windMachineCoverage, smudgePotCount, canProtect, effectiveness };
  }, [temp, dewPoint, windSpeed, area, method]);

  const handleReset = () => {
    setTemp('0');
    setDewPoint('-3');
    setWindSpeed('3');
    setArea('5');
    setMethod('sprinkler');
    toast({
      title: tr('Reset to Defaults', 'تمت استعادة القيم الافتراضية', 'Valeurs par défaut rétablies'),
    });
  };

  const handleCopySummary = () => {
    if (!result) return;
    const frostType = result.isFrost
      ? (result.isAdvective ? 'Advective (wind)' : 'Radiative (calm)')
      : 'No frost';
    const text = `=== FROST PROTECTION PLAN ===
Conditions:
  Temp: ${temp} °C | Dew point: ${dewPoint} °C
  Wind: ${windSpeed} km/h | Area: ${area} ha

Frost type: ${frostType}
Effectiveness: ${result.effectiveness}%

Method: ${method}
${
  method === 'sprinkler'
    ? `Sprinkler rate: ${result.sprinklerRate.toFixed(1)} mm/hr\nTotal flow: ${result.sprinklerFlow.toFixed(0)} m³/hr`
    : method === 'windmachine'
    ? `Coverage: ${result.windMachineCoverage.toFixed(1)} ha/machine\nMachines needed: ${Math.ceil(parseFloat(area) / result.windMachineCoverage)}`
    : `Smudge pots needed: ${result.smudgePotCount} (${result.smudgePotCount / parseFloat(area)} /ha)`
}
${result.canProtect ? 'Protection feasible.' : 'Advective frost — limited protection (sprinklers only).'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: tr('Summary Copied!', 'تم نسخ التقرير!', 'Résumé copié !'),
      description: tr('Frost protection plan copied to clipboard.', 'تم نسخ خطة الحماية من الصقيع إلى الحافظة.', 'Plan copié dans le presse-papiers.'),
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const actions = [
    {
      icon: Copy,
      label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' },
      onClick: handleCopySummary,
      variant: 'primary' as const,
      showCheck: copied,
    },
    {
      icon: RotateCcw,
      label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
      onClick: handleReset,
      variant: 'ghost' as const,
    },
  ];

  const frostTypeLabel = result
    ? tr(
        result.isFrost ? (result.isAdvective ? 'Advective (wind)' : 'Radiative (calm)') : 'No frost',
        result.isFrost ? (result.isAdvective ? 'إشعاعي-حمل (رياح)' : 'إشعاعي (سكون)') : 'لا يوجد صقيع',
        result.isFrost ? (result.isAdvective ? 'Advection (vent)' : 'Radiatif (calme)') : 'Pas de gel',
      )
    : '';

  return (
    <CalculatorShell
      icon={Snowflake}
      title={TITLE}
      description={DESCRIPTION}
      badge="USDA NRCS"
      accent="sky"
      actions={actions}
      pills={METHOD_PILLS}
      activePill={method}
      onPillClick={setMethod}
      pillLabel={{ en: 'Protection Method:', ar: 'طريقة الحماية:', fr: 'Méthode :' }}
      protocolNote={PROTOCOL_NOTE}
    >
      {/* ---------------- Inputs column ---------------- */}
      <CalculatorShell.Inputs>
        <div className="grid grid-cols-2 gap-3">
          <CalculatorShell.InputField
            label={tr('Temp (°C)', 'الحرارة (°م)', 'Température (°C)')}
            value={temp}
            onChange={setTemp}
            step="0.5"
            helper={tr('Current air temp', 'الحرارة الحالية', 'Température actuelle')}
          />
          <CalculatorShell.InputField
            label={tr('Dew point (°C)', 'نقطة الندى (°م)', 'Point de rosée (°C)')}
            value={dewPoint}
            onChange={setDewPoint}
            step="0.5"
            helper={tr('Lower = drier air', 'أقل = هواء أكثر جفافاً', 'Plus bas = air plus sec')}
          />
          <CalculatorShell.InputField
            label={tr('Wind (km/h)', 'الرياح (كم/ساعة)', 'Vent (km/h)')}
            value={windSpeed}
            onChange={setWindSpeed}
            step="0.5"
            helper={tr('>5 km/h = advective', '>5 كم/ساعة = حملي', '>5 km/h = advection')}
          />
          <CalculatorShell.InputField
            label={tr('Area (ha)', 'المساحة (هكتار)', 'Surface (ha)')}
            value={area}
            onChange={setArea}
            step="0.5"
            helper={tr('Area to protect', 'المساحة المطلوب حمايتها', 'Surface à protéger')}
          />
        </div>
      </CalculatorShell.Inputs>

      {/* ---------------- Results column ---------------- */}
      <CalculatorShell.Results>
        {result && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CalculatorShell.MetricTile
                label={tr('Frost Type', 'نوع الصقيع', 'Type de gel')}
                value={frostTypeLabel}
                color={result.isFrost ? (result.isAdvective ? 'rose' : 'sky') : 'emerald'}
                helper={result.isFrost ? tr('Inversion strength', 'قوة الانقلاب', 'Force inversion') : tr('No frost risk', 'لا يوجد خطر صقيع', 'Pas de risque de gel')}
              />
              <CalculatorShell.MetricTile
                label={tr('Effectiveness', 'الفعالية', 'Efficacité')}
                value={`${result.effectiveness}%`}
                color={result.effectiveness > 50 ? 'emerald' : 'rose'}
                helper={result.isAdvective ? tr('Limited by wind', 'محدود بالرياح', 'Limité par le vent') : tr('Good protection potential', 'إمكانية حماية جيدة', 'Bon potentiel')}
              />
            </div>

            {/* Method-specific results */}
            {method === 'sprinkler' && result.isFrost && (
              <div className="space-y-2 rounded-xl border border-sky-200 bg-sky-50/60 p-4 dark:border-sky-900 dark:bg-sky-950/20">
                <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-300">
                  <Droplets className="h-4 w-4" />
                  <strong>{tr('Sprinkler Requirements', 'متطلبات الرشاشات', 'Besoin en asperseurs')}</strong>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <CalculatorShell.MetricTile
                    label={tr('Application Rate', 'معدل التطبيق', "Taux d'application")}
                    value={result.sprinklerRate.toFixed(1)}
                    unit="mm/hr"
                    color="sky"
                  />
                  <CalculatorShell.MetricTile
                    label={tr('Total Flow', 'التدفق الإجمالي', 'Débit total')}
                    value={result.sprinklerFlow.toFixed(0)}
                    unit="m³/hr"
                    color="sky"
                  />
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {tr(`For ${area} ha area`, `لمساحة ${area} هكتار`, `Pour ${area} ha`)}
                </div>
              </div>
            )}

            {method === 'windmachine' && result.isFrost && (
              <div className="space-y-2 rounded-xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-900 dark:bg-violet-950/20">
                <div className="flex items-center gap-1.5 text-violet-700 dark:text-violet-300">
                  <Wind className="h-4 w-4" />
                  <strong>{tr('Wind Machine Sizing', 'تحجيم آلة الرياح', 'Dimensionnement turbine')}</strong>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <CalculatorShell.MetricTile
                    label={tr('Coverage per Machine', 'التغطية لكل آلة', 'Couverture par machine')}
                    value={result.windMachineCoverage.toFixed(1)}
                    unit="ha"
                    color="sky"
                  />
                  <CalculatorShell.MetricTile
                    label={tr('Machines Needed', 'الآلات المطلوبة', 'Machines requises')}
                    value={Math.ceil(parseFloat(area) / result.windMachineCoverage)}
                    unit={tr('units', 'وحدة', 'unités')}
                    color="sky"
                  />
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {tr(`For ${area} ha area`, `لمساحة ${area} هكتار`, `Pour ${area} ha`)}
                </div>
              </div>
            )}

            {method === 'smudge' && result.isFrost && (
              <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/20">
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                  <Snowflake className="h-4 w-4" />
                  <strong>{tr('Smudge Pot Sizing', 'تحجيم أوعية التدخين', 'Dimensionnement pots à feu')}</strong>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <CalculatorShell.MetricTile
                    label={tr('Total Pots', 'إجمالي الأوعية', 'Pots totaux')}
                    value={result.smudgePotCount}
                    unit={tr('pots', 'أوعية', 'pots')}
                    color="amber"
                  />
                  <CalculatorShell.MetricTile
                    label={tr('Density', 'الكثافة', 'Densité')}
                    value={(result.smudgePotCount / parseFloat(area)).toFixed(0)}
                    unit="pots/ha"
                    color="amber"
                  />
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {tr(`For ${area} ha area`, `لمساحة ${area} هكتار`, `Pour ${area} ha`)}
                </div>
              </div>
            )}

            {/* Status banner */}
            {!result.canProtect ? (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-sm leading-relaxed text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  <strong>{tr('Advective frost — limited protection.', 'صقيع حملي — حماية محدودة.', 'Geler advectif — protection limitée.')}</strong>{' '}
                  {tr(
                    'Wind >5 km/h breaks inversion. Only sprinklers effective. Wind machines won\u2019t work.',
                    'الرياح التي تتجاوز 5 كم/ساعة تكسر الانقلاب الحراري. الرشاشات هي الفعالة فقط، ولن تعمل آلات الرياح.',
                    'Le vent >5 km/h brise l\u2019inversion. Seuls les asperseurs sont efficaces. Les turbines ne fonctionneront pas.'
                  )}
                </span>
              </div>
            ) : result.isFrost ? (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-sm leading-relaxed text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  <strong>{tr('Protection feasible.', 'الحماية ممكنة.', 'Protection possible.')}</strong>{' '}
                  {tr('Radiative frost — inversion layer present.', 'صقيع إشعاعي — توجد طبقة انقلاب حراري.', 'Gel radiatif — couche d\u2019inversion présente.')}{' '}
                  {method === 'sprinkler'
                    ? tr('Sprinklers most effective.', 'الرشاشات هي الأكثر فعالية.', 'Asperseurs les plus efficaces.')
                    : method === 'windmachine'
                    ? tr('Wind machines will mix warm air down.', 'ستخلط آلات الرياح الهواء الدافئ إلى الأسفل.', 'Les turbines mélangent l\u2019air chaud vers le bas.')
                    : tr('Smudge pots will create heat inversion.', 'ستنشئ أوعية التدخين انقلاباً حرارياً دافئاً.', 'Les pots à feu créeront une inversion thermique.')}
                </span>
              </div>
            ) : null}
          </>
        )}
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
