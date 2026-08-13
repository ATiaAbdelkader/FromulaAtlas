'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Droplets, CheckCircle2, AlertTriangle } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';

const MANURE_AR: Record<string, string> = { dairy_solid: 'روث صلب للأبقار الحلوب', dairy_liquid: 'روث سائل للأبقار الحلوب', beef_solid: 'روث صلب للأبقار اللحمية', poultry: 'روث دجاج بياض', swine: 'روث خنازير سائل', composted: 'روث مُكمَّر' };
const INCORPORATION_AR: Record<string, string> = { immediate: 'فوراً', hours12: 'خلال 12 ساعة', days1: 'خلال يوم واحد', days7: 'خلال 7 أيام', none: 'غير مدمج' };
type UiLanguage = Parameters<typeof copyFor>[0];

const MANURE_TYPES: Record<string, { name: string; n: number; p: number; k: number; dm: number }> = {
  dairy_solid: { name: 'Dairy solid', n: 10, p: 5, k: 10, dm: 25 },
  dairy_liquid: { name: 'Dairy liquid', n: 5, p: 2.5, k: 5, dm: 8 },
  beef_solid: { name: 'Beef solid', n: 11, p: 7, k: 12, dm: 25 },
  poultry: { name: 'Poultry layer', n: 30, p: 25, k: 15, dm: 45 },
  swine: { name: 'Swine liquid', n: 6, p: 3, k: 4, dm: 5 },
  composted: { name: 'Composted manure', n: 8, p: 6, k: 8, dm: 40 },
};

export function ManureManagementPlanner() {
  const { language } = useTranslation();
  const [manureType, setManureType] = useState('dairy_solid');
  const [rate, setRate] = useState('40');
  const [area, setArea] = useState('10');
  const [incorporation, setIncorporation] = useState('immediate');
  const [slope, setSlope] = useState('3');
  const [nearestWater, setNearestWater] = useState('50');

  const result = useMemo(() => {
    const m = MANURE_TYPES[manureType];
    const r = parseFloat(rate), a = parseFloat(area), s = parseFloat(slope), nw = parseFloat(nearestWater);
    if (!Number.isFinite(r)) return null;
    // N availability: Year 1 depends on incorporation
    const nAvail: Record<string, number> = { immediate: 0.40, hours12: 0.30, days1: 0.20, days7: 0.10, none: 0.05 };
    const nY1 = r * m.n * (nAvail[incorporation] ?? 0.3);
    const pY1 = r * m.p * 0.6; // P availability Year 1
    const kY1 = r * m.k * 0.9; // K availability Year 1
    // Buffer requirement
    const minBuffer = s > 5 ? 30 : s > 2 ? 20 : 10;
    const bufferOK = nw >= minBuffer;
    return { m, nY1, pY1, kY1, totalN: r * m.n, totalP: r * m.p, totalK: r * m.k, minBuffer, bufferOK };
  }, [manureType, rate, area, incorporation, slope, nearestWater]);

  return (
    <Card className="overflow-hidden border-violet-100 shadow-sm dark:border-violet-900/60">
      <CardHeader className="border-b border-border/60 bg-violet-50/50 pb-4 dark:bg-violet-950/10"><CardTitle className="flex items-center gap-2 text-base"><span className="rounded-lg bg-violet-100 p-2 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"><Droplets className="h-4 w-4" /></span> {copyFor(language, 'Manure Management Planner', 'مخطط إدارة الروث')}</CardTitle><p className="text-[10px] text-muted-foreground">{copyFor(language, 'N-P-K value · application timing · buffer zone compliance', 'قيمة N-P-K · توقيت التطبيق · الالتزام بمنطقة العزل')}</p></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-violet-200/70 bg-violet-50/30 p-3 sm:grid-cols-2 dark:border-violet-900/60 dark:bg-violet-950/10">
          <div><Label className="text-xs font-medium">{copyFor(language, 'Manure type', 'نوع الروث')}</Label><select aria-label={copyFor(language, 'Manure type', 'نوع الروث')} value={manureType} onChange={e => setManureType(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{Object.entries(MANURE_TYPES).map(([k, v]) => <option key={k} value={k}>{copyFor(language, v.name, MANURE_AR[k])} (N:{v.n} P:{v.p} K:{v.k})</option>)}</select></div>
          <div><Label className="text-xs font-medium">{copyFor(language, 'Application rate (t/ha)', 'معدل التطبيق (طن/هكتار)')}</Label><Input aria-label={copyFor(language, 'Application rate in tonnes per hectare', 'معدل التطبيق بالطن لكل هكتار')} value={rate} onChange={e => setRate(e.target.value)} type="number" step="5" className="mt-1 h-10 text-sm" /></div>
        </div>
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 sm:grid-cols-3">
          <div><Label className="text-xs font-medium">{copyFor(language, 'Incorporation timing', 'توقيت الدمج')}</Label><select aria-label={copyFor(language, 'Incorporation timing', 'توقيت الدمج')} value={incorporation} onChange={e => setIncorporation(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="immediate">{copyFor(language, 'Immediate', INCORPORATION_AR.immediate)}</option><option value="hours12">{copyFor(language, 'Within 12 hr', INCORPORATION_AR.hours12)}</option><option value="days1">{copyFor(language, 'Within 1 day', INCORPORATION_AR.days1)}</option><option value="days7">{copyFor(language, 'Within 7 days', INCORPORATION_AR.days7)}</option><option value="none">{copyFor(language, 'Not incorporated', INCORPORATION_AR.none)}</option></select></div>
          <div><Label className="text-xs font-medium">{copyFor(language, 'Field slope (%)', 'انحدار الحقل (%)')}</Label><Input aria-label={copyFor(language, 'Field slope percentage', 'نسبة انحدار الحقل')} value={slope} onChange={e => setSlope(e.target.value)} type="number" step="0.5" className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium">{copyFor(language, 'Nearest waterway (m)', 'أقرب مجرى مائي (م)')}</Label><Input aria-label={copyFor(language, 'Distance to nearest waterway in meters', 'المسافة إلى أقرب مجرى مائي بالمتر')} value={nearestWater} onChange={e => setNearestWater(e.target.value)} type="number" step="5" className="mt-1 h-10 text-sm" /></div>
        </div>
        {result && (
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 text-center shadow-sm"><div className="text-[9px] text-muted-foreground uppercase">N ({copyFor(language, 'Yr 1', 'السنة 1')})</div><div className="font-mono text-lg font-bold text-emerald-700">{result.nY1.toFixed(0)}</div><div className="text-[9px] text-muted-foreground">{copyFor(language, 'kg/ha', 'كغ/هكتار')}</div></div>
              <div className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-3 text-center shadow-sm"><div className="text-[9px] text-muted-foreground uppercase">P ({copyFor(language, 'Yr 1', 'السنة 1')})</div><div className="font-mono text-lg font-bold text-cyan-700">{result.pY1.toFixed(0)}</div><div className="text-[9px] text-muted-foreground">{copyFor(language, 'kg/ha', 'كغ/هكتار')}</div></div>
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 text-center shadow-sm"><div className="text-[9px] text-muted-foreground uppercase">K ({copyFor(language, 'Yr 1', 'السنة 1')})</div><div className="font-mono text-lg font-bold text-amber-700">{result.kY1.toFixed(0)}</div><div className="text-[9px] text-muted-foreground">{copyFor(language, 'kg/ha', 'كغ/هكتار')}</div></div>
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
              <div className="rounded-lg border bg-background/60 p-3"><span className="text-muted-foreground">{copyFor(language, 'Total N applied:', 'إجمالي N المطبق:')}</span> <strong className="font-mono">{result.totalN.toFixed(0)} kg/ha</strong></div>
              <div className="rounded-lg border bg-background/60 p-3"><span className="text-muted-foreground">{copyFor(language, 'N availability:', 'توفر N:')}</span> <strong>{((result.nY1 / result.totalN) * 100).toFixed(0)}% {copyFor(language, 'Yr 1', 'السنة 1')}</strong></div>
            </div>
            {result.bufferOK ? (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>{copyFor(language, 'Buffer zone compliant.', 'منطقة العزل مطابقة.')}</strong> {copyFor(language, `${nearestWater}m to nearest waterway exceeds ${result.minBuffer}m minimum.`, `المسافة ${nearestWater}م إلى أقرب مجرى مائي تتجاوز الحد الأدنى ${result.minBuffer}م.`)}</span></div>
            ) : (
              <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/60 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5"><AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>{copyFor(language, 'Buffer zone violation!', 'مخالفة لمنطقة العزل!')}</strong> {copyFor(language, `Need ${result.minBuffer}m minimum (you have ${nearestWater}m). Do not apply — move setback or use buffer strip.`, `يلزم حد أدنى ${result.minBuffer}م (المتاح ${nearestWater}م). لا تطبق — زد مسافة الارتداد أو استخدم شريطاً عازلاً.`)}</span></div>
            )}
            <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">💡 {copyFor(language, 'Incorporate within 12 hr to save 30% of N (ammonia volatilization). Don\'t exceed crop N needs — soil test first. Year 2 releases additional 20-30% of total N.', 'ادمج الروث خلال 12 ساعة للحفاظ على 30% من N (تطاير الأمونيا). لا تتجاوز احتياجات المحصول من N — أجرِ اختباراً للتربة أولاً. تطلق السنة الثانية 20–30% إضافية من إجمالي N.')}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
