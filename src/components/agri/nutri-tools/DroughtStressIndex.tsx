'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Flame, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';

const STAGE_AR: Record<string, string> = { establishment: 'التأسيس', vegetative: 'النمو الخضري', flowering: 'الإزهار', filling: 'امتلاء الحبوب', maturation: 'النضج' };
const LEVEL_AR: Record<string, string> = { None: 'لا يوجد', Mild: 'خفيف', Moderate: 'متوسط', Severe: 'شديد' };
const ADVICE_AR: Record<string, string> = {
  'No drought stress. Crop water needs are being met.': 'لا يوجد إجهاد جفاف. يتم تلبية احتياجات المحصول المائية.',
  'Mild stress. Monitor soil moisture. Consider light irrigation.': 'إجهاد خفيف. راقب رطوبة التربة وفكّر في ري خفيف.',
  'Moderate stress. Irrigate within 2-3 days to prevent yield loss.': 'إجهاد متوسط. ابدأ الري خلال 2–3 أيام لمنع فقد المحصول.',
  'Severe stress! Irrigate immediately. Yield loss likely at this stage.': 'إجهاد شديد! ابدأ الري فوراً. يُحتمل فقد المحصول في هذه المرحلة.',
};

export function DroughtStressIndex() {
  const { language } = useTranslation();
  const [et0, setEt0] = useState('5.0');
  const [rain, setRain] = useState('2.0');
  const [soilWater, setSoilWater] = useState('60');
  const [taw, setTaw] = useState('120');
  const [stage, setStage] = useState('flowering');

  const result = useMemo(() => {
    const ET0 = parseFloat(et0), R = parseFloat(rain), SW = parseFloat(soilWater), TAW = parseFloat(taw);
    if (!Number.isFinite(ET0) || !Number.isFinite(TAW) || TAW <= 0) return null;

    const deficit = Math.max(0, ET0 - R * 0.8); // net water deficit mm/day
    const depletionPct = ((TAW - SW) / TAW) * 100;
    const stageFactor: Record<string, number> = { establishment: 0.5, vegetative: 0.7, flowering: 1.0, filling: 0.9, maturation: 0.5 };
    const sf = stageFactor[stage] ?? 0.7;
    const dsi = (deficit / ET0) * 0.4 + (depletionPct / 100) * 0.4 + sf * 0.2;
    const dsiScore = Math.min(100, dsi * 100);

    let level: string, color: string, advice: string;
    if (dsiScore < 25) { level = 'None'; color = '#10b981'; advice = 'No drought stress. Crop water needs are being met.'; }
    else if (dsiScore < 50) { level = 'Mild'; color = '#eab308'; advice = 'Mild stress. Monitor soil moisture. Consider light irrigation.'; }
    else if (dsiScore < 75) { level = 'Moderate'; color = '#f97316'; advice = 'Moderate stress. Irrigate within 2-3 days to prevent yield loss.'; }
    else { level = 'Severe'; color = '#dc2626'; advice = 'Severe stress! Irrigate immediately. Yield loss likely at this stage.'; }

    return { dsiScore, level, color, advice, deficit, depletionPct };
  }, [et0, rain, soilWater, taw, stage]);

  return (
    <Card className="overflow-hidden border-orange-200/60 shadow-sm dark:border-orange-900/60">
      <CardHeader className="border-b bg-gradient-to-r from-orange-50 via-background to-amber-50/40 pb-4 dark:from-orange-950/30 dark:via-background dark:to-amber-950/20">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="h-4 w-4 text-orange-600" /> {copyFor(language, 'Drought Stress Index', 'مؤشر إجهاد الجفاف')}
        </CardTitle>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{copyFor(language, 'Combines ET₀ deficit + soil water depletion + crop stage sensitivity', 'يجمع بين عجز ET₀ واستنزاف ماء التربة وحساسية مرحلة المحصول')}</p>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'ET₀ today (mm/day)', 'ET₀ اليوم (ملم/يوم)')}</Label>
            <Input value={et0} onChange={e => setEt0(e.target.value)} type="number" step="0.1" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Rain today (mm)', 'مطر اليوم (ملم)')}</Label>
            <Input value={rain} onChange={e => setRain(e.target.value)} type="number" step="0.1" className="mt-1 h-10 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-3">
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Soil water (mm)', 'ماء التربة (ملم)')}</Label>
            <Input value={soilWater} onChange={e => setSoilWater(e.target.value)} type="number" step="5" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'TAW (mm)', 'الماء المتاح الكلي (ملم)')}</Label>
            <Input value={taw} onChange={e => setTaw(e.target.value)} type="number" step="10" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Growth stage', 'مرحلة النمو')}</Label>
            <select value={stage} onChange={e => setStage(e.target.value)} aria-label={copyFor(language, 'Growth stage', 'مرحلة النمو')} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              {Object.entries({ establishment: 'Establishment', vegetative: 'Vegetative', flowering: 'Flowering', filling: 'Grain fill', maturation: 'Maturation' }).map(([key, label]) => <option key={key} value={key}>{copyFor(language, label, STAGE_AR[key])}</option>)}
            </select>
          </div>
        </div>
        {result && (
          <div className="space-y-4">
            <div className="rounded-xl border p-5 text-center shadow-sm" style={{ borderColor: result.color + '60', backgroundColor: result.color + '15' }}>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Drought Stress Index', 'مؤشر إجهاد الجفاف')}</div>
              <div className="mt-1 text-4xl font-bold font-mono" style={{ color: result.color }}>{result.dsiScore.toFixed(0)}<span className="text-sm">/100</span></div>
              <div className="mt-1 text-sm font-semibold" style={{ color: result.color }}>{copyFor(language, result.level, LEVEL_AR[result.level] ?? result.level)}</div>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-xl border bg-background p-3"><span className="text-muted-foreground">{copyFor(language, 'Water deficit:', 'عجز الماء:')}</span> <strong>{result.deficit.toFixed(1)} mm/day</strong></div>
              <div className="rounded-xl border bg-background p-3"><span className="text-muted-foreground">{copyFor(language, 'Soil depletion:', 'استنزاف التربة:')}</span> <strong>{result.depletionPct.toFixed(0)}%</strong></div>
            </div>
            <div className="flex items-start gap-2 rounded-xl border p-3 text-sm leading-relaxed" style={{ borderColor: result.color + '40', color: result.color }}>
              {result.dsiScore < 50 ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
              <span>{copyFor(language, result.advice, ADVICE_AR[result.advice] ?? result.advice)}</span>
            </div>
            <div className="rounded-lg border border-dashed bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
              {copyFor(language, 'DSI = 40% ET₀ deficit + 40% soil depletion + 20% stage sensitivity. Flowering is most sensitive — water stress here causes irreversible yield loss.', 'مؤشر إجهاد الجفاف = 40% عجز ET₀ + 40% استنزاف التربة + 20% حساسية المرحلة. الإزهار هو الأكثر حساسية — ويسبب الإجهاد المائي فيه فقداً غير قابل للعكس في المحصول.')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
