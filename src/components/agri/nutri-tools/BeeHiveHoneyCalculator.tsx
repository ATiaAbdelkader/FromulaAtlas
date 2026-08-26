'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bug, CheckCircle2, AlertTriangle } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';

export function BeeHiveHoneyCalculator() {
  const { language } = useTranslation();
  const [hiveCount, setHiveCount] = useState('10');
  const [nectarFlow, setNectarFlow] = useState('2.5');
  const [flowDays, setFlowDays] = useState('30');
  const [sugarContent, setSugarContent] = useState('40');

  const result = useMemo(() => {
    const N = parseFloat(hiveCount), NF = parseFloat(nectarFlow), D = parseFloat(flowDays), SC = parseFloat(sugarContent) / 100;
    if (!Number.isFinite(N) || !Number.isFinite(NF)) return null;

    // Daily weight gain per hive = nectar flow (kg/day) × sugar content / 0.82 (honey sugar concentration)
    const dailyGain = NF * SC / 0.82;
    const totalNectar = NF * D * N;
    const totalHoney = dailyGain * D * N;
    const honeyPerHive = dailyGain * D;
    const revenue = totalHoney * 8; // $8/kg honey

    // Hive health indicators
    const goodFlow = NF >= 2.0;
    const enoughDays = D >= 21;

    return { dailyGain, totalNectar, totalHoney, honeyPerHive, revenue, goodFlow, enoughDays };
  }, [hiveCount, nectarFlow, flowDays, sugarContent]);

  return (
    <Card className="overflow-hidden border-amber-100 shadow-sm dark:border-amber-900/60">
      <CardHeader className="border-b border-border/60 bg-amber-50/50 pb-4 dark:bg-amber-950/10">
        <CardTitle className="flex items-center gap-2 text-base"><span className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"><Bug className="h-4 w-4" /></span> 🐝 {copyFor(language, 'Bee Hive + Honey Yield', 'خلية النحل + إنتاج العسل')}</CardTitle>
        <p className="text-[10px] text-muted-foreground">{copyFor(language, 'Daily weight gain · nectar flow projection · honey yield + revenue', 'الزيادة اليومية في الوزن · توقع تدفق الرحيق · إنتاج العسل + الإيرادات')}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-amber-200/70 bg-amber-50/30 p-3 sm:grid-cols-2 dark:border-amber-900/60 dark:bg-amber-950/10">
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Number of hives', 'عدد الخلايا')}</Label>
            <Input aria-label={copyFor(language, 'Number of hives', 'عدد الخلايا')} value={hiveCount} onChange={e => setHiveCount(e.target.value)} type="number" step="1" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Nectar flow (kg/hive/day)', 'تدفق الرحيق (كغ/خلية/يوم)')}</Label>
            <Input aria-label={copyFor(language, 'Nectar flow per hive per day', 'تدفق الرحيق لكل خلية في اليوم')} value={nectarFlow} onChange={e => setNectarFlow(e.target.value)} type="number" step="0.1" className="mt-1 h-10 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Flow duration (days)', 'مدة التدفق (يوم)')}</Label>
            <Input aria-label={copyFor(language, 'Nectar flow duration', 'مدة تدفق الرحيق')} value={flowDays} onChange={e => setFlowDays(e.target.value)} type="number" step="1" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Nectar sugar content (%)', 'محتوى سكر الرحيق (%)')}</Label>
            <Input aria-label={copyFor(language, 'Nectar sugar content', 'محتوى سكر الرحيق')} value={sugarContent} onChange={e => setSugarContent(e.target.value)} type="number" step="1" className="mt-1 h-10 text-sm" />
          </div>
        </div>
        {result && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Metric label={copyFor(language, 'Daily gain/hive', 'الزيادة اليومية/خلية')} value={`${result.dailyGain.toFixed(2)} kg`} color="amber" />
              <Metric label={copyFor(language, 'Honey/hive', 'العسل/خلية')} value={`${result.honeyPerHive.toFixed(1)} kg`} color="emerald" />
              <Metric label={copyFor(language, 'Total honey', 'إجمالي العسل')} value={`${result.totalHoney.toFixed(0)} kg`} color="cyan" />
              <Metric label={copyFor(language, 'Revenue', 'الإيرادات')} value={`$${result.revenue.toFixed(0)}`} color="violet" />
            </div>
            {result.goodFlow && result.enoughDays ? (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs leading-relaxed text-emerald-700 dark:border-emerald-900 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>{copyFor(language, 'Strong nectar flow.', 'تدفق رحيق قوي.')}</strong> {copyFor(language, `Expect ${result.honeyPerHive.toFixed(0)} kg/hive. Add supers as needed. Monitor for swarming.`, `توقع ${result.honeyPerHive.toFixed(0)} كغ/خلية. أضف صناديق العسل عند الحاجة. راقب التطريد.`)}</span>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-700 dark:border-amber-900 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>{copyFor(language, 'Weak flow.', 'تدفق ضعيف.')}</strong> {!result.goodFlow && copyFor(language, 'Nectar flow below 2 kg/hive/day. ', 'تدفق الرحيق أقل من 2 كغ/خلية/يوم. ')} {!result.enoughDays && copyFor(language, 'Flow duration too short. ', 'مدة التدفق قصيرة جداً. ')} {copyFor(language, 'Consider supplemental feeding.', 'فكّر في التغذية التكميلية.')}</span>
              </div>
            )}
            <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
              💡 {copyFor(language, 'Monitor hive weight daily with scale. 1 kg gain = good flow. 0 kg = dearth — feed sugar syrup. Honey = nectar × sugar% / 82% (honey moisture ~18%).', 'راقب وزن الخلية يومياً باستخدام الميزان. زيادة 1 كغ تعني تدفقاً جيداً. عدم وجود زيادة يعني انقطاع الرحيق — قدّم شراب السكر. العسل = الرحيق × نسبة السكر / 82% (رطوبة العسل نحو 18%).')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const ACCENT: Record<string, string> = {
  cyan: 'border-cyan-200 dark:border-cyan-900 bg-cyan-50/40 dark:bg-cyan-950/20',
  emerald: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20',
  amber: 'border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20',
  violet: 'border-violet-200 dark:border-violet-900 bg-violet-50/40 dark:bg-violet-950/20',
};
function Metric({ label, value, color }: { label: string; value: string; color: keyof typeof ACCENT }) {
  return     <div className={`rounded-xl border p-3 shadow-sm ${ACCENT[color]}`}><div className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 font-mono text-base font-semibold">{value}</div></div>;
}
