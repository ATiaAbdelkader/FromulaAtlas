'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CloudHail, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';

const CROP_AR: Record<string, string> = { corn: 'الذرة', soybean: 'فول الصويا', wheat: 'القمح' };
const STAGE_AR: Record<string, string> = { seedling: 'بادرة', v6: 'V6 (نمو خضري)', v10: 'V10', tassel: 'ظهور النورات', silking: 'ظهور الحرير', milk: 'طور الحليب', dough: 'طور العجين', dent: 'طور التسنين' };

export function HailDamageEstimator() {
  const { language } = useTranslation();
  const [crop, setCrop] = useState('corn');
  const [stage, setStage] = useState('v6');
  const [hailSize, setHailSize] = useState('20');
  const [defoliation, setDefoliation] = useState('30');

  // Simplified yield loss tables (USDA crop insurance)
  const result = useMemo(() => {
    const hs = parseFloat(hailSize), df = parseFloat(defoliation);
    if (!Number.isFinite(hs)) return null;
    // Base loss from defoliation by stage
    const stageFactor: Record<string, number> = { seedling: 0.2, v6: 0.3, v10: 0.5, tassel: 0.9, silking: 1.0, milk: 0.7, dough: 0.4, dent: 0.2 };
    const sf = stageFactor[stage] ?? 0.5;
    const defolLoss = df * sf * 0.01;
    // Additional loss from stalk/stem bruising by hail size
    const stalkLoss = hs > 30 ? 0.15 : hs > 20 ? 0.08 : hs > 10 ? 0.03 : 0;
    const totalLoss = Math.min(0.95, defolLoss + stalkLoss);
    return { totalLoss: totalLoss * 100, defolLoss: defolLoss * 100, stalkLoss: stalkLoss * 100 };
  }, [crop, stage, hailSize, defoliation]);

  return (
    <Card className="overflow-hidden border-slate-200/70 shadow-sm dark:border-slate-800">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 via-background to-blue-50/40 pb-4 dark:from-slate-950/30 dark:via-background dark:to-blue-950/20">
        <CardTitle className="flex items-center gap-2 text-base"><CloudHail className="h-4 w-4 text-slate-500" /> {copyFor(language, 'Hail Damage Estimator', 'مقدّر أضرار البَرَد')}</CardTitle>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{copyFor(language, 'Crop stage × hail size × defoliation → estimated yield loss', 'مرحلة المحصول × حجم البَرَد × إزالة الأوراق → فقد المحصول المقدّر')}</p>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-3">
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Crop', 'المحصول')}</Label><select value={crop} onChange={e => setCrop(e.target.value)} aria-label={copyFor(language, 'Crop', 'المحصول')} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="corn">{copyFor(language, 'Corn', CROP_AR.corn)}</option><option value="soybean">{copyFor(language, 'Soybean', CROP_AR.soybean)}</option><option value="wheat">{copyFor(language, 'Wheat', CROP_AR.wheat)}</option></select></div>
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Stage', 'المرحلة')}</Label><select value={stage} onChange={e => setStage(e.target.value)} aria-label={copyFor(language, 'Stage', 'المرحلة')} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="seedling">{copyFor(language, 'Seedling', STAGE_AR.seedling)}</option><option value="v6">{copyFor(language, 'V6 (vegetative)', STAGE_AR.v6)}</option><option value="v10">{copyFor(language, 'V10', STAGE_AR.v10)}</option><option value="tassel">{copyFor(language, 'Tasseling', STAGE_AR.tassel)}</option><option value="silking">{copyFor(language, 'Silking', STAGE_AR.silking)}</option><option value="milk">{copyFor(language, 'Milk', STAGE_AR.milk)}</option><option value="dough">{copyFor(language, 'Dough', STAGE_AR.dough)}</option><option value="dent">{copyFor(language, 'Dent', STAGE_AR.dent)}</option></select></div>
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Hail size (mm)', 'حجم البَرَد (ملم)')}</Label><Input value={hailSize} onChange={e => setHailSize(e.target.value)} type="number" step="5" className="mt-1 h-10 text-sm" /></div>
        </div>
        <div className="rounded-xl border bg-muted/20 p-3"><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Defoliation (%)', 'إزالة الأوراق (%)')}</Label><Input value={defoliation} onChange={e => setDefoliation(e.target.value)} type="number" step="5" min="0" max="100" className="mt-1 h-10 text-sm" /></div>
        {result && (
          <div className="space-y-4">
            <div className="rounded-xl border p-5 text-center shadow-sm" style={{ borderColor: result.totalLoss > 30 ? '#dc262660' : result.totalLoss > 10 ? '#f59e0b60' : '#10b98160', backgroundColor: result.totalLoss > 30 ? '#dc262610' : result.totalLoss > 10 ? '#f59e0b10' : '#10b98110' }}>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Estimated Yield Loss', 'فقد المحصول المقدّر')}</div>
              <div className="mt-1 text-4xl font-bold font-mono" style={{ color: result.totalLoss > 30 ? '#dc2626' : result.totalLoss > 10 ? '#f59e0b' : '#10b981' }}>{result.totalLoss.toFixed(0)}%</div>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-xl border bg-background p-3"><span className="text-muted-foreground">{copyFor(language, 'Defoliation loss:', 'فقد إزالة الأوراق:')}</span> <strong>{result.defolLoss.toFixed(0)}%</strong></div>
              <div className="rounded-xl border bg-background p-3"><span className="text-muted-foreground">{copyFor(language, 'Stalk bruising:', 'كدمات الساق:')}</span> <strong>{result.stalkLoss.toFixed(0)}%</strong></div>
            </div>
            {result.totalLoss > 30 ? (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-sm leading-relaxed text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300"><AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>{copyFor(language, 'Severe damage.', 'ضرر شديد.')}</strong> {copyFor(language, 'Contact crop insurance within 72 hr. Document with photos. Consider replanting if <30 days left in season.', 'تواصل مع تأمين المحاصيل خلال 72 ساعة. وثّق الضرر بالصور. فكّر في إعادة الزراعة إذا بقي أقل من 30 يوماً في الموسم.')}</span></div>
            ) : result.totalLoss > 10 ? (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm leading-relaxed text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300"><AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>{copyFor(language, 'Moderate damage.', 'ضرر متوسط.')}</strong> {copyFor(language, 'Monitor recovery. Crop may compensate if enough growing season remains.', 'راقب التعافي. قد يعوّض المحصول الضرر إذا بقي وقت كافٍ من موسم النمو.')}</span></div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-sm leading-relaxed text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>{copyFor(language, 'Minimal damage.', 'ضرر محدود.')}</strong> {copyFor(language, 'Crop should recover fully. Scout for secondary disease entry through bruised tissue.', 'ينبغي أن يتعافى المحصول بالكامل. افحص احتمال دخول أمراض ثانوية عبر الأنسجة المتضررة.')}</span></div>
            )}
            <div className="rounded-lg border border-dashed bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">{copyFor(language, 'Silking/flowering stage is most vulnerable. Early vegetative stages can recover from significant defoliation. Document damage within 72 hr for insurance claims.', 'مرحلة ظهور الحرير/الإزهار هي الأكثر تعرضاً للخطر. يمكن للمراحل الخضرية المبكرة التعافي من إزالة أوراق كبيرة. وثّق الضرر خلال 72 ساعة لمطالبات التأمين.')}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
