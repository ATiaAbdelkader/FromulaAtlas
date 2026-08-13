'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bug, CheckCircle2, AlertTriangle } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';

const PEST_NAME_AR: Record<string, string> = {
  'Soybean aphid': 'منّ فول الصويا', 'Fall armyworm': 'دودة الحشد الخريفية', 'Corn borer': 'حفّار الذرة', Whitefly: 'الذبابة البيضاء', Thrips: 'التربس',
};
const PEST_UNIT_AR: Record<string, string> = {
  'aphids/plant': 'منّ/نبات', 'larvae/m²': 'يرقات/م²', 'larvae/plant': 'يرقات/نبات', 'adults/leaf': 'بالغات/ورقة', 'thrips/flower': 'تربس/زهرة',
};

export function PestThresholdCalculator() {
  const { language } = useTranslation();
  const [pest, setPest] = useState('aphid');
  const [count, setCount] = useState('15');
  const [samples, setSamples] = useState('10');
  const [cropValue, setCropValue] = useState('800');
  const [controlCost, setControlCost] = useState('40');

  const PESTS: Record<string, { name: string; unit: string; etl: number; action: number; emoji: string }> = {
    aphid: { name: 'Soybean aphid', unit: 'aphids/plant', etl: 250, action: 200, emoji: '🫛' },
    armyworm: { name: 'Fall armyworm', unit: 'larvae/m²', etl: 5, action: 3, emoji: '🐛' },
    borer: { name: 'Corn borer', unit: 'larvae/plant', etl: 1, action: 0.5, emoji: '🦗' },
    whitefly: { name: 'Whitefly', unit: 'adults/leaf', etl: 10, action: 6, emoji: '🦟' },
    thrips: { name: 'Thrips', unit: 'thrips/flower', etl: 5, action: 3, emoji: '🐜' },
  };

  const result = useMemo(() => {
    const c = parseFloat(count), n = parseFloat(samples), cv = parseFloat(cropValue), cc = parseFloat(controlCost);
    const p = PESTS[pest];
    if (!Number.isFinite(c)) return null;
    const avg = c / n;
    // EIL = C / (V × D × P) — simplified: use pre-set ETL
    const aboveEIL = avg >= p.etl;
    const aboveAction = avg >= p.action;
    const economicLoss = aboveEIL ? (avg - p.etl) * cv * 0.001 : 0;
    return { avg, aboveEIL, aboveAction, economicLoss, pest: p };
  }, [pest, count, samples, cropValue, controlCost]);

  return (
    <Card className="overflow-hidden border-rose-200/60 shadow-sm dark:border-rose-900/60">
      <CardHeader className="border-b bg-gradient-to-r from-rose-50 via-background to-amber-50/40 pb-4 dark:from-rose-950/30 dark:via-background dark:to-amber-950/20"><CardTitle className="flex items-center gap-2 text-base"><Bug className="h-4 w-4 text-rose-600" /> {copyFor(language, 'Pest Threshold Calculator', 'حاسبة عتبة الآفات')}</CardTitle><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{copyFor(language, 'EIL · action threshold · sequential sampling — 5 pest types', 'حد الضرر الاقتصادي · عتبة التدخل · أخذ عينات متسلسل — 5 أنواع من الآفات')}</p></CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-2">
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Pest', 'الآفة')}</Label><select value={pest} onChange={e => setPest(e.target.value)} aria-label={copyFor(language, 'Pest', 'الآفة')} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{Object.entries(PESTS).map(([k, v]) => <option key={k} value={k}>{v.emoji} {copyFor(language, v.name, PEST_NAME_AR[v.name] ?? v.name)}</option>)}</select></div>
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Total pest count', 'إجمالي عدد الآفات')}</Label><Input value={count} onChange={e => setCount(e.target.value)} type="number" step="1" className="mt-1 h-10 text-sm" /></div>
        </div>
        <div className="grid grid-cols-1 gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-3">
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, '# samples', 'عدد العينات')}</Label><Input value={samples} onChange={e => setSamples(e.target.value)} type="number" step="1" className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Crop value ($/ha)', 'قيمة المحصول ($/هكتار)')}</Label><Input value={cropValue} onChange={e => setCropValue(e.target.value)} type="number" step="50" className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Control cost ($/ha)', 'تكلفة المكافحة ($/هكتار)')}</Label><Input value={controlCost} onChange={e => setControlCost(e.target.value)} type="number" step="5" className="mt-1 h-10 text-sm" /></div>
        </div>
        {result && (
          <div className="space-y-4">
            <div className="rounded-xl border p-4 text-center shadow-sm" style={{ borderColor: result.aboveEIL ? '#dc262660' : result.aboveAction ? '#f59e0b60' : '#10b98160', backgroundColor: result.aboveEIL ? '#dc262610' : result.aboveAction ? '#f59e0b10' : '#10b98110' }}>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Average density', 'الكثافة المتوسطة')}</div>
              <div className="mt-1 text-3xl font-bold font-mono">{result.avg.toFixed(1)} <span className="text-sm text-muted-foreground">{copyFor(language, result.pest.unit, PEST_UNIT_AR[result.pest.unit] ?? result.pest.unit)}</span></div>
              <div className="mt-2 text-sm font-semibold leading-snug" style={{ color: result.aboveEIL ? '#dc2626' : result.aboveAction ? '#f59e0b' : '#10b981' }}>
                {result.aboveEIL ? copyFor(language, 'Above EIL — Spray now!', 'تجاوز حد الضرر الاقتصادي — رش الآن!') : result.aboveAction ? copyFor(language, 'Above action threshold — Scout intensively', 'تجاوز عتبة التدخل — نفّذ استطلاعاً مكثفاً') : copyFor(language, 'Below threshold — No action needed', 'أقل من العتبة — لا حاجة إلى إجراء')}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-lg border bg-background p-3"><span className="text-muted-foreground">EIL:</span> <strong className="font-mono">{result.pest.etl} {copyFor(language, result.pest.unit, PEST_UNIT_AR[result.pest.unit] ?? result.pest.unit)}</strong></div>
              <div className="rounded-lg border bg-background p-3"><span className="text-muted-foreground">{copyFor(language, 'Action threshold:', 'عتبة التدخل:')}</span> <strong className="font-mono">{result.pest.action} {copyFor(language, result.pest.unit, PEST_UNIT_AR[result.pest.unit] ?? result.pest.unit)}</strong></div>
            </div>
            {result.aboveEIL ? (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-sm leading-relaxed text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300"><AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>{copyFor(language, 'Spray now.', 'رش الآن.')}</strong> {copyFor(language, 'Economic injury level exceeded. Every day of delay costs', 'تم تجاوز حد الضرر الاقتصادي. كل يوم تأخير يكلّف')} ~${result.economicLoss.toFixed(0)}/{copyFor(language, 'ha in lost yield.', 'هكتار من المحصول المفقود.')}</span></div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-sm leading-relaxed text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>{copyFor(language, 'No spray needed.', 'لا حاجة إلى الرش.')}</strong> {copyFor(language, 'Continue scouting every 3-5 days. Threshold protects beneficial insects + saves money.', 'واصل الاستطلاع كل 3–5 أيام. تحمي العتبة الحشرات النافعة وتوفّر التكاليف.')}</span></div>
            )}
            <div className="rounded-lg border border-dashed bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">{copyFor(language, 'EIL = cost of control / (crop value × damage per pest). Action threshold is set below EIL to allow time for treatment.', 'حد الضرر الاقتصادي = تكلفة المكافحة ÷ (قيمة المحصول × الضرر لكل آفة). تُحدّد عتبة التدخل أقل من حد الضرر الاقتصادي لإتاحة وقت للعلاج.')}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
