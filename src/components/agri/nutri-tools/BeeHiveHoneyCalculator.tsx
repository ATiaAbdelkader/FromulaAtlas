'use client';

import { useState, useMemo } from 'react';
import { Bug, Copy, Check, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString, type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';

const TITLE: TrilingualString = {
  en: 'Bee Hive + Honey Yield',
  ar: 'خلية النحل + إنتاج العسل',
  fr: 'Ruche + Rendement Miel',
};
const DESC: TrilingualString = {
  en: 'Daily weight gain · nectar flow projection · honey yield + revenue',
  ar: 'الزيادة اليومية في الوزن · توقع تدفق الرحيق · إنتاج العسل + الإيرادات',
  fr: 'Gain quotidien · projection nectar · miel + revenu',
};

export function BeeHiveHoneyCalculator() {
  const { language, isRTL } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [hiveCount, setHiveCount] = useState('10');
  const [nectarFlow, setNectarFlow] = useState('2.5');
  const [flowDays, setFlowDays] = useState('30');
  const [sugarContent, setSugarContent] = useState('40');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const N = parseFloat(hiveCount), NF = parseFloat(nectarFlow), D = parseFloat(flowDays), SC = parseFloat(sugarContent) / 100;
    if (!Number.isFinite(N) || !Number.isFinite(NF)) return null;

    const dailyGain = (NF * SC) / 0.82;
    const totalNectar = NF * D * N;
    const totalHoney = dailyGain * D * N;
    const honeyPerHive = dailyGain * D;
    const revenue = totalHoney * 8;
    const goodFlow = NF >= 2.0;
    const enoughDays = D >= 21;

    return { dailyGain, totalNectar, totalHoney, honeyPerHive, revenue, goodFlow, enoughDays };
  }, [hiveCount, nectarFlow, flowDays, sugarContent]);

  const handleReset = () => {
    setHiveCount('10'); setNectarFlow('2.5'); setFlowDays('30'); setSugarContent('40');
    toast({ title: tr('Reset', 'إعادة', 'Réinitialiser') });
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `=== BEE HIVE + HONEY YIELD ===\nHives: ${hiveCount}\nNectar flow: ${nectarFlow} kg/hive/day\nFlow days: ${flowDays}\nSugar: ${sugarContent}%\n\nDaily gain/hive: ${result.dailyGain.toFixed(2)} kg\nHoney/hive: ${result.honeyPerHive.toFixed(1)} kg\nTotal honey: ${result.totalHoney.toFixed(0)} kg\nRevenue: $${result.revenue.toFixed(0)}`.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: tr('Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <CalculatorShell
      icon={Bug}
      title={TITLE}
      description={DESC}
      badge="Apiculture"
      accent="amber"
      actions={[
        { icon: Copy, label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' }, onClick: handleCopy, variant: 'primary', showCheck: copied },
        { icon: RotateCcw, label: { en: 'Reset', ar: 'إعادة', fr: 'Réinitialiser' }, onClick: handleReset },
      ]}
      protocolNote={{
        en: 'Monitor hive weight daily with scale. 1 kg gain = good flow. 0 kg = dearth — feed sugar syrup. Honey = nectar × sugar% / 82% (honey moisture ~18%).',
        ar: 'راقب وزن الخلية يومياً باستخدام الميزان. زيادة 1 كغ تعني تدفقاً جيداً. عدم وجود زيادة يعني انقطاع الرحيق — قدّم شراب السكر. العسل = الرحيق × نسبة السكر / 82% (رطوبة العسل نحو 18%).',
        fr: 'Pesez la ruche quotidiennement. +1 kg = bonne miellée. 0 = disette — nourrissez. Miel = nectar × %sucre / 82%.',
      }}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Bug className="h-4 w-4 text-amber-600" />
            <span className="text-base font-bold">🐝 {tr('Hive & Flow Parameters', 'مدخلات الخلية والتدفق', 'Paramètres ruche & miellée')}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CalculatorShell.InputField label={tr('Number of hives', 'عدد الخلايا', 'Nombre de ruches')} value={hiveCount} onChange={setHiveCount} step="1" helper={tr('Total apiary size', 'حجم المنحل الكلي', 'Taille du rucher')} />
            <CalculatorShell.InputField label={tr('Nectar flow (kg/hive/day)', 'تدفق الرحيق (كغ/خلية/يوم)', 'Miellée (kg/ruche/j)')} value={nectarFlow} onChange={setNectarFlow} step="0.1" helper={tr('Daily nectar intake', 'الوارد اليومي من الرحيق', 'Apport quotidien')} />
            <CalculatorShell.InputField label={tr('Flow duration (days)', 'مدة التدفق (يوم)', 'Durée miellée (j)')} value={flowDays} onChange={setFlowDays} step="1" helper={tr('Bloom period', 'فترة الإزهار', 'Période floraison')} />
            <CalculatorShell.InputField label={tr('Nectar sugar content (%)', 'محتوى سكر الرحيق (%)', 'Teneur sucre nectar (%)')} value={sugarContent} onChange={setSugarContent} step="1" helper={tr('Sugar concentration', 'تركيز السكر', 'Concentration sucre')} />
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        {result && (
          <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
            <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-amber-50 via-transparent to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
              <span className="text-base font-bold flex items-center gap-2">✨ {tr('Honey Yield & Revenue', 'إنتاج العسل والإيرادات', 'Rendement miel & revenu')}</span>
              <span className="font-mono text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 rounded-lg px-2 py-0.5">{result.totalHoney.toFixed(0)} kg</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CalculatorShell.MetricTile label={tr('Daily Gain/Hive', 'الزيادة اليومية/خلية', 'Gain/j/ruche')} value={result.dailyGain.toFixed(2)} unit="kg" color="amber" />
              <CalculatorShell.MetricTile label={tr('Honey/Hive', 'العسل/خلية', 'Miel/ruche')} value={result.honeyPerHive.toFixed(1)} unit="kg" color="emerald" />
              <CalculatorShell.MetricTile label={tr('Total Honey', 'إجمالي العسل', 'Miel total')} value={result.totalHoney.toFixed(0)} unit="kg" color="teal" />
              <CalculatorShell.MetricTile label={tr('Revenue', 'الإيرادات', 'Revenu')} value={`$${result.revenue.toFixed(0)}`} color="emerald" />
            </div>

            {result.goodFlow && result.enoughDays ? (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>{tr('Strong nectar flow.', 'تدفق رحيق قوي.', 'Miellée abondante.')}</strong> {tr(`Expect ${result.honeyPerHive.toFixed(0)} kg/hive. Add supers as needed. Monitor for swarming.`, `توقع ${result.honeyPerHive.toFixed(0)} كغ/خلية. أضف صناديق العسل عند الحاجة. راقب التطريد.`)}</span>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>{tr('Weak flow.', 'تدفق ضعيف.', 'Miellée faible.')}</strong> {tr('Consider supplemental feeding.', 'فكّر في التغذية التكميلية.', 'Nourrissement conseillé.')}</span>
              </div>
            )}
          </div>
        )}
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
