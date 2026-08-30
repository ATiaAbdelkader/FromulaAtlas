'use client';

import { useState, useMemo } from 'react';
import {
  Bug,
  Copy,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  CalculatorShell,
  type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';

const PEST_NAME_AR: Record<string, string> = {
  'Soybean aphid': 'منّ فول الصويا',
  'Fall armyworm': 'دودة الحشد الخريفية',
  'Corn borer': 'حفّار الذرة',
  Whitefly: 'الذبابة البيضاء',
  Thrips: 'التربس',
};
const PEST_NAME_FR: Record<string, string> = {
  'Soybean aphid': 'Puceron du soja',
  'Fall armyworm': 'Légionnaire d’automne',
  'Corn borer': 'Pyrale du maïs',
  Whitefly: 'Mouche blanche',
  Thrips: 'Thrips',
};
const PEST_UNIT_AR: Record<string, string> = {
  'aphids/plant': 'منّ/نبات',
  'larvae/m²': 'يرقات/م²',
  'larvae/plant': 'يرقات/نبات',
  'adults/leaf': 'بالغات/ورقة',
  'thrips/flower': 'تربس/زهرة',
};
const PEST_UNIT_FR: Record<string, string> = {
  'aphids/plant': 'pucerons/plante',
  'larvae/m²': 'larves/m²',
  'larvae/plant': 'larves/plante',
  'adults/leaf': 'adultes/feuille',
  'thrips/flower': 'thrips/fleur',
};

const PESTS: Record<
  string,
  { name: string; unit: string; etl: number; action: number; emoji: string }
> = {
  aphid: { name: 'Soybean aphid', unit: 'aphids/plant', etl: 250, action: 200, emoji: '🫛' },
  armyworm: { name: 'Fall armyworm', unit: 'larvae/m²', etl: 5, action: 3, emoji: '🐛' },
  borer: { name: 'Corn borer', unit: 'larvae/plant', etl: 1, action: 0.5, emoji: '🦗' },
  whitefly: { name: 'Whitefly', unit: 'adults/leaf', etl: 10, action: 6, emoji: '🦟' },
  thrips: { name: 'Thrips', unit: 'thrips/flower', etl: 5, action: 3, emoji: '🐜' },
};

export function PestThresholdCalculator() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [pest, setPest] = useState('aphid');
  const [count, setCount] = useState('15');
  const [samples, setSamples] = useState('10');
  const [cropValue, setCropValue] = useState('800');
  const [controlCost, setControlCost] = useState('40');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const c = parseFloat(count),
      n = parseFloat(samples),
      cv = parseFloat(cropValue),
      cc = parseFloat(controlCost);
    const p = PESTS[pest];
    if (!Number.isFinite(c)) return null;
    const avg = c / n;
    // EIL = C / (V × D × P) — simplified: use pre-set ETL
    const aboveEIL = avg >= p.etl;
    const aboveAction = avg >= p.action;
    const economicLoss = aboveEIL ? (avg - p.etl) * cv * 0.001 : 0;
    return { avg, aboveEIL, aboveAction, economicLoss, pest: p };
    // cc reserved for future EIL = C / (V × D × P)
    void cc;
  }, [pest, count, samples, cropValue, controlCost]);

  const pestInfo = PESTS[pest];
  const unitLabel = tr(
    pestInfo.unit,
    PEST_UNIT_AR[pestInfo.unit] ?? pestInfo.unit,
    PEST_UNIT_FR[pestInfo.unit] ?? pestInfo.unit,
  );

  const handleReset = () => {
    setCount('15');
    setSamples('10');
    setCropValue('800');
    setControlCost('40');
    toast({
      title: tr(
        'Reset to Defaults',
        'تمت استعادة القيم الافتراضية',
        'Valeurs réinitialisées',
      ),
    });
  };

  const handleCopy = () => {
    if (!result) return;
    const status = result.aboveEIL
      ? 'Above EIL — Spray now!'
      : result.aboveAction
        ? 'Above action threshold — Scout intensively'
        : 'Below threshold — No action needed';
    const text = `
=== PEST THRESHOLD REPORT ===
Pest: ${result.pest.emoji} ${result.pest.name}
Average density: ${result.avg.toFixed(1)} ${result.pest.unit}
Economic Injury Level (EIL): ${result.pest.etl} ${result.pest.unit}
Action threshold: ${result.pest.action} ${result.pest.unit}
Status: ${status}
Estimated economic loss if untreated: $${result.economicLoss.toFixed(0)}/ha/day
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: tr('Summary Copied!', 'تم نسخ التقرير!', 'Résumé copié !'),
      description: tr(
        'Pest scouting report copied to clipboard.',
        'تم نسخ تقرير الاستطلاع إلى الحافظة.',
        'Rapport copié dans le presse-papiers.',
      ),
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const pills: CalculatorPill[] = Object.entries(PESTS).map(([k, v]) => ({
    key: k,
    label: tr(v.name, PEST_NAME_AR[v.name] ?? v.name, PEST_NAME_FR[v.name] ?? v.name),
    emoji: v.emoji,
  }));

  return (
    <CalculatorShell
      icon={Bug}
      accent="rose"
      title={{
        en: 'Pest Threshold Calculator',
        ar: 'حاسبة عتبة الآفات',
        fr: 'Calculateur de Seuil de Nuisibles',
      }}
      description={{
        en: 'EIL · action threshold · sequential sampling — 5 pest types',
        ar: 'حد الضرر الاقتصادي · عتبة التدخل · أخذ عينات متسلسل — 5 أنواع من الآفات',
        fr: 'NEP · seuil d’intervention · échantillonnage séquentiel — 5 types de ravageurs',
      }}
      badge="IPM Standard"
      pills={pills}
      activePill={pest}
      onPillClick={setPest}
      pillLabel={{ en: 'Select Pest:', ar: 'اختر الآفة:', fr: 'Ravageur :' }}
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
      protocolNote={{
        en: 'EIL = cost of control / (crop value × damage per pest). Action threshold is set below EIL to allow time for treatment.',
        ar: 'حد الضرر الاقتصادي = تكلفة المكافحة ÷ (قيمة المحصول × الضرر لكل آفة). تُحدّد عتبة التدخل أقل من حد الضرر الاقتصادي لإتاحة وقت للعلاج.',
        fr: 'NEP = coût de lutte / (valeur de la culture × dégât par ravageur). Le seuil d’intervention est fixé sous le NEP pour laisser le temps d’agir.',
      }}
    >
      <CalculatorShell.Inputs>
        <CalculatorShell.InputField
          label={tr('Total pest count', 'إجمالي عدد الآفات', 'Nombre total de ravageurs')}
          value={count}
          onChange={setCount}
          step="1"
          helper={tr(
            'Sum counted across all samples',
            'العدد الإجمالي عبر جميع العينات',
            'Total compté sur tous les échantillons',
          )}
        />
        <CalculatorShell.InputField
          label={tr('# samples', 'عدد العينات', "Nb d'échantillons")}
          value={samples}
          onChange={setSamples}
          step="1"
          helper={tr(
            'Number of plants/locations sampled',
            'عدد النباتات/المواقع المفحوصة',
            'Nombre de plantes/sites échantillonnés',
          )}
        />
        <CalculatorShell.InputField
          label={tr('Crop value ($/ha)', 'قيمة المحصول ($/هكتار)', 'Valeur de la culture ($/ha)')}
          value={cropValue}
          onChange={setCropValue}
          step="50"
          helper={tr(
            'Expected gross revenue per hectare',
            'العائد الإجمالي المتوقع لكل هكتار',
            'Revenu brut prévu par hectare',
          )}
        />
        <CalculatorShell.InputField
          label={tr('Control cost ($/ha)', 'تكلفة المكافحة ($/هكتار)', 'Coût de lutte ($/ha)')}
          value={controlCost}
          onChange={setControlCost}
          step="5"
          helper={tr(
            'Pesticide + application cost',
            'تكلفة المبيد + التطبيق',
            'Coût pesticide + application',
          )}
        />
      </CalculatorShell.Inputs>
      <CalculatorShell.Results>
        {result ? (
          <>
            <CalculatorShell.MetricTile
              label={tr('Average density', 'الكثافة المتوسطة', 'Densité moyenne')}
              value={result.avg.toFixed(1)}
              unit={unitLabel}
              color={result.aboveEIL ? 'rose' : result.aboveAction ? 'amber' : 'emerald'}
              helper={
                result.aboveEIL
                  ? tr(
                      'Above EIL — Spray now!',
                      'تجاوز حد الضرر الاقتصادي — رش الآن!',
                      'Au-dessus du NEP — Traiter maintenant !',
                    )
                  : result.aboveAction
                    ? tr(
                        'Above action threshold — Scout intensively',
                        'تجاوز عتبة التدخل — نفّذ استطلاعاً مكثفاً',
                        'Au-dessus du seuil d’intervention — Surveiller intensivement',
                      )
                    : tr(
                        'Below threshold — No action needed',
                        'أقل من العتبة — لا حاجة إلى إجراء',
                        'Sous le seuil — Aucune intervention',
                      )
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CalculatorShell.MetricTile
                label={tr('EIL', 'حد الضرر الاقتصادي', 'NEP')}
                value={result.pest.etl}
                unit={unitLabel}
                color="rose"
              />
              <CalculatorShell.MetricTile
                label={tr('Action threshold', 'عتبة التدخل', "Seuil d'intervention")}
                value={result.pest.action}
                unit={unitLabel}
                color="amber"
              />
            </div>
            <CalculatorShell.MetricTile
              label={tr(
                'Economic loss if untreated',
                'الخسارة الاقتصادية بدون علاج',
                'Perte économique sans traitement',
              )}
              value={`$${result.economicLoss.toFixed(0)}`}
              unit={tr('/ha/day', '/هكتار/يوم', '/ha/jour')}
              color="default"
              helper={tr(
                'Yield lost per day above EIL',
                'المحصول المفقود لكل يوم فوق حد الضرر',
                'Rendement perdu par jour au-dessus du NEP',
              )}
            />
            {result.aboveEIL ? (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-sm leading-relaxed text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  <strong>{tr('Spray now.', 'رش الآن.', 'Traiter maintenant.')}</strong>{' '}
                  {tr(
                    'Economic injury level exceeded. Every day of delay costs',
                    'تم تجاوز حد الضرر الاقتصادي. كل يوم تأخير يكلّف',
                    'Niveau de blessure économique dépassé. Chaque jour de retard coûte',
                  )}{' '}
                  ~${result.economicLoss.toFixed(0)}/
                  {tr(
                    'ha in lost yield.',
                    'هكتار من المحصول المفقود.',
                    'ha de rendement perdu.',
                  )}
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-sm leading-relaxed text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  <strong>{tr('No spray needed.', 'لا حاجة إلى الرش.', 'Aucune intervention.')}</strong>{' '}
                  {tr(
                    'Continue scouting every 3-5 days. Threshold protects beneficial insects + saves money.',
                    'واصل الاستطلاع كل 3–5 أيام. تحمي العتبة الحشرات النافعة وتوفّر التكاليف.',
                    'Continuez la surveillance tous les 3-5 jours. Le seuil protège les insectes utiles et fait économiser.',
                  )}
                </span>
              </div>
            )}
          </>
        ) : (
          <CalculatorShell.MetricTile
            label={tr('Average density', 'الكثافة المتوسطة', 'Densité moyenne')}
            value="—"
            color="default"
            helper={tr(
              'Enter total pest count to calculate',
              'أدخل إجمالي عدد الآفات للحساب',
              'Saisissez le nombre total de ravageurs',
            )}
          />
        )}
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
