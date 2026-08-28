'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gauge, CheckCircle2, AlertTriangle } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';

export function YieldMonitorCalibrator() {
  const { language } = useTranslation();
  const [crop, setCrop] = useState('wheat');
  const [monitorWeight, setMonitorWeight] = useState('2500');
  const [actualWeight, setActualWeight] = useState('2400');
  const [monitorMoisture, setMonitorMoisture] = useState('14');
  const [standardMoisture, setStandardMoisture] = useState('13');
  const [testWeight, setTestWeight] = useState('75');

  const result = useMemo(() => {
    const mw = parseFloat(monitorWeight), aw = parseFloat(actualWeight);
    const mm = parseFloat(monitorMoisture), sm = parseFloat(standardMoisture);
    const tw = parseFloat(testWeight);
    if (!Number.isFinite(mw) || !Number.isFinite(aw)) return null;
    const cfMoisture = (100 - mm) / (100 - sm);
    const cfFlow = aw / mw;
    const correctedYield = mw * cfMoisture * cfFlow / 1000; // t/ha simplified
    const twStatus = crop === 'wheat' ? (tw >= 76 ? 'good' : tw >= 72 ? 'fair' : 'poor') : crop === 'corn' ? (tw >= 70 ? 'good' : tw >= 65 ? 'fair' : 'poor') : 'check';
    return { cfMoisture, cfFlow, correctedYield, twStatus };
  }, [crop, monitorWeight, actualWeight, monitorMoisture, standardMoisture, testWeight]);

  return (
    <Card className="overflow-hidden border-indigo-100 shadow-sm dark:border-indigo-900/60">
      <CardHeader className="border-b border-border/60 bg-indigo-50/50 pb-4 dark:bg-indigo-950/10"><CardTitle className="flex items-center gap-2 text-base"><span className="rounded-lg bg-indigo-100 p-2 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"><Gauge className="h-4 w-4" /></span> {copyFor(language, 'Yield Monitor Calibrator', 'معاير مراقب الإنتاجية')}</CardTitle><p className="text-[10px] text-muted-foreground">{copyFor(language, 'Moisture correction · flow calibration · test weight assessment', 'تصحيح الرطوبة · معايرة التدفق · تقييم الوزن الاختباري')}</p></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-indigo-200/70 bg-indigo-50/30 p-3 sm:grid-cols-2 dark:border-indigo-900/60 dark:bg-indigo-950/10">
          <div><Label className="text-xs font-medium">{copyFor(language, 'Crop', 'المحصول')}</Label><select aria-label={copyFor(language, 'Crop', 'المحصول')} value={crop} onChange={e => setCrop(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="wheat">{copyFor(language, 'Wheat', 'قمح')} 🌾</option><option value="corn">{copyFor(language, 'Corn', 'ذرة')} 🌽</option><option value="soybean">{copyFor(language, 'Soybean', 'فول الصويا')} 🫘</option><option value="barley">{copyFor(language, 'Barley', 'شعير')} 🌾</option></select></div>
          <div><Label className="text-xs font-medium">{copyFor(language, 'Test weight (kg/hL)', 'الوزن الاختباري (كغ/هكتولتر)')}</Label><Input aria-label={copyFor(language, 'Test weight', 'الوزن الاختباري')} value={testWeight} onChange={e => setTestWeight(e.target.value)} type="number" step="0.5" className="mt-1 h-10 text-sm" /></div>
        </div>
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 sm:grid-cols-2">
          <div><Label className="text-xs font-medium">{copyFor(language, 'Monitor weight (kg)', 'وزن المراقب (كغ)')}</Label><Input aria-label={copyFor(language, 'Monitor weight', 'وزن المراقب')} value={monitorWeight} onChange={e => setMonitorWeight(e.target.value)} type="number" step="10" className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium">{copyFor(language, 'Actual weight (kg)', 'الوزن الفعلي (كغ)')}</Label><Input aria-label={copyFor(language, 'Actual measured weight', 'الوزن المقاس فعلياً')} value={actualWeight} onChange={e => setActualWeight(e.target.value)} type="number" step="10" className="mt-1 h-10 text-sm" /></div>
        </div>
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 sm:grid-cols-2">
          <div><Label className="text-xs font-medium">{copyFor(language, 'Monitor moisture (%)', 'رطوبة المراقب (%)')}</Label><Input aria-label={copyFor(language, 'Monitor moisture percentage', 'نسبة رطوبة المراقب')} value={monitorMoisture} onChange={e => setMonitorMoisture(e.target.value)} type="number" step="0.5" className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium">{copyFor(language, 'Standard moisture (%)', 'الرطوبة القياسية (%)')}</Label><Input aria-label={copyFor(language, 'Standard moisture percentage', 'نسبة الرطوبة القياسية')} value={standardMoisture} onChange={e => setStandardMoisture(e.target.value)} type="number" step="0.5" className="mt-1 h-10 text-sm" /></div>
        </div>
        {result && (
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-xl border bg-background/70 p-3 text-center shadow-sm"><div className="text-[9px] text-muted-foreground uppercase">{copyFor(language, 'Moisture CF', 'معامل تصحيح الرطوبة')}</div><div className="font-mono text-sm font-bold">{result.cfMoisture.toFixed(3)}</div></div>
              <div className="rounded-xl border bg-background/70 p-3 text-center shadow-sm"><div className="text-[9px] text-muted-foreground uppercase">{copyFor(language, 'Flow CF', 'معامل تصحيح التدفق')}</div><div className="font-mono text-sm font-bold">{result.cfFlow.toFixed(3)}</div></div>
              <div className="rounded-xl border bg-background/70 p-3 text-center shadow-sm"><div className="text-[9px] text-muted-foreground uppercase">{copyFor(language, 'Test weight', 'الوزن الاختباري')}</div><div className={`font-mono text-sm font-bold ${result.twStatus === 'good' ? 'text-emerald-600' : result.twStatus === 'fair' ? 'text-amber-600' : 'text-rose-600'}`}>{copyFor(language, result.twStatus, result.twStatus === 'good' ? 'جيد' : result.twStatus === 'fair' ? 'مقبول' : result.twStatus === 'poor' ? 'ضعيف' : 'تحقق') }</div></div>
            </div>
            <div className={`rounded-xl border p-3 text-xs leading-relaxed flex items-start gap-2 ${Math.abs(result.cfFlow - 1) < 0.05 ? 'border-emerald-200 bg-emerald-50/60 text-emerald-700' : 'border-amber-200 bg-amber-50/60 text-amber-700'}`}>
              {Math.abs(result.cfFlow - 1) < 0.05 ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
              <span>{Math.abs(result.cfFlow - 1) < 0.05 ? <strong>{copyFor(language, 'Monitor is accurate (±5%).', 'المراقب دقيق (±5%).')}</strong> : <strong>{copyFor(language, `Monitor is off by ${((result.cfFlow - 1) * 100).toFixed(1)}%. Recalibrate with 6-8 loads spanning expected flow rates.`, `يختلف المراقب بنسبة ${((result.cfFlow - 1) * 100).toFixed(1)}%. أعد المعايرة باستخدام 6–8 حمولات تغطي معدلات التدفق المتوقعة.`)}</strong>}</span>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">💡 {copyFor(language, 'Calibrate per crop + moisture range. Low test weight indicates immature or damaged grain — may affect pricing.', 'عاير كل محصول ولكل نطاق رطوبة. يشير الوزن الاختباري المنخفض إلى حبوب غير ناضجة أو متضررة — وقد يؤثر ذلك في التسعير.')}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
