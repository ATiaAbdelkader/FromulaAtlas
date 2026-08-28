'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sprout, CheckCircle2, AlertTriangle } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';

const CROP_SEEDS: Record<string, { name: string; emoji: string; tgw: number; germination: number; targetPop: number; rowSpacing: number }> = {
  wheat: { name: 'Wheat', emoji: '🌾', tgw: 40, germination: 90, targetPop: 400, rowSpacing: 15 },
  barley: { name: 'Barley', emoji: '🌾', tgw: 42, germination: 90, targetPop: 350, rowSpacing: 15 },
  corn: { name: 'Corn', emoji: '🌽', tgw: 300, germination: 92, targetPop: 8, rowSpacing: 75 },
  soybean: { name: 'Soybean', emoji: '🫘', tgw: 180, germination: 90, targetPop: 40, rowSpacing: 45 },
  rice: { name: 'Rice', emoji: '🍚', tgw: 25, germination: 88, targetPop: 500, rowSpacing: 20 },
  canola: { name: 'Canola', emoji: '🌼', tgw: 4, germination: 90, targetPop: 800, rowSpacing: 15 },
};
const CROP_AR: Record<string, string> = { wheat: 'قمح', barley: 'شعير', corn: 'ذرة', soybean: 'فول الصويا', rice: 'أرز', canola: 'كانولا' };

export function SeedRateCalculator() {
  const { language } = useTranslation();
  const [crop, setCrop] = useState('wheat');
  const [targetPop, setTargetPop] = useState('');
  const [tgw, setTgw] = useState('');
  const [germination, setGermination] = useState('');
  const [fieldLoss, setFieldLoss] = useState('10');

  const result = useMemo(() => {
    const c = CROP_SEEDS[crop];
    const tp = parseFloat(targetPop) || c.targetPop;
    const t = parseFloat(tgw) || c.tgw;
    const g = (parseFloat(germination) || c.germination) / 100;
    const fl = parseFloat(fieldLoss) / 100;
    // Seed rate = targetPop × TGW / (germination × (1 - fieldLoss) × 100)
    const seedRate = tp * t / (g * (1 - fl) * 100); // kg/ha
    const plantSpacing = 10000 / (tp * (c.rowSpacing / 100)); // cm between plants in row
    return { seedRate, plantSpacing, effectivePop: tp * g * (1 - fl), crop: c, tp, t, g, fl };
  }, [crop, targetPop, tgw, germination, fieldLoss]);

  return (
    <Card className="overflow-hidden border-emerald-200/60 shadow-sm dark:border-emerald-900/60">
      <CardHeader className="border-b bg-gradient-to-r from-emerald-50 via-background to-lime-50/50 pb-4 dark:from-emerald-950/30 dark:via-background dark:to-lime-950/20">
        <CardTitle className="flex items-center gap-2 text-base"><Sprout className="h-4 w-4 text-emerald-600" /> {copyFor(language, 'Seed Rate Calculator', 'حاسبة معدل البذور')}</CardTitle>
        <p className="text-xs leading-relaxed text-muted-foreground">{copyFor(language, 'Target population × TGW × germination × field loss → kg seed/ha', 'الكثافة المستهدفة × وزن ألف حبة × الإنبات × فاقد الحقل → كغ بذور/هكتار')}</p>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div><Label className="text-xs font-medium">{copyFor(language, 'Crop', 'المحصول')}</Label><select aria-label={copyFor(language, 'Crop', 'المحصول')} value={crop} onChange={e => setCrop(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{Object.entries(CROP_SEEDS).map(([k, v]) => <option key={k} value={k}>{v.emoji} {copyFor(language, v.name, CROP_AR[k])} (TGW:{v.tgw}g)</option>)}</select></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div><Label className="text-xs font-medium">{copyFor(language, 'Target population (plants/m²)', 'الكثافة المستهدفة (نبات/م²)')}</Label><Input aria-label={copyFor(language, 'Target population in plants per square metre', 'الكثافة المستهدفة بالنبات لكل متر مربع')} value={targetPop || result.crop.targetPop} onChange={e => setTargetPop(e.target.value)} type="number" step="5" placeholder={String(result.crop.targetPop)} className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium">{copyFor(language, '1000-grain weight (g)', 'وزن ألف حبة (غ)')}</Label><Input aria-label={copyFor(language, 'Thousand grain weight in grams', 'وزن ألف حبة بالغرام')} value={tgw || result.crop.tgw} onChange={e => setTgw(e.target.value)} type="number" step="1" placeholder={String(result.crop.tgw)} className="mt-1 h-10 text-sm" /></div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div><Label className="text-xs font-medium">{copyFor(language, 'Germination (%)', 'الإنبات (%)')}</Label><Input aria-label={copyFor(language, 'Germination percentage', 'نسبة الإنبات')} value={germination || result.crop.germination} onChange={e => setGermination(e.target.value)} type="number" step="1" placeholder={String(result.crop.germination)} className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium">{copyFor(language, 'Field loss (%)', 'فاقد الحقل (%)')}</Label><Input aria-label={copyFor(language, 'Field loss percentage', 'نسبة فاقد الحقل')} value={fieldLoss} onChange={e => setFieldLoss(e.target.value)} type="number" step="1" className="mt-1 h-10 text-sm" /></div>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 text-center shadow-sm"><div className="text-[9px] uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Seed rate', 'معدل البذور')}</div><div className="text-2xl font-bold font-mono text-emerald-700">{result.seedRate.toFixed(0)}</div><div className="text-[9px] text-muted-foreground">kg/ha</div></div>
            <div className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-3 text-center shadow-sm"><div className="text-[9px] uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Effective pop', 'الكثافة الفعلية')}</div><div className="text-2xl font-bold font-mono text-cyan-700">{result.effectivePop.toFixed(0)}</div><div className="text-[9px] text-muted-foreground">plants/m²</div></div>
            <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-3 text-center shadow-sm"><div className="text-[9px] uppercase tracking-wide text-muted-foreground">{copyFor(language, 'In-row spacing', 'التباعد داخل الصف')}</div><div className="text-2xl font-bold font-mono text-violet-700">{result.plantSpacing.toFixed(1)}</div><div className="text-[9px] text-muted-foreground">cm</div></div>
          </div>
          <div className="rounded-xl border bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">💡 {copyFor(language, `Order ${(result.seedRate * 1.1).toFixed(0)} kg/ha (add 10% safety for calibration error + seed size variation). Calibrate drill per seed lot — TGW varies 20% between varieties.`, `اطلب ${(result.seedRate * 1.1).toFixed(0)} كغ/هكتار (أضف هامش أمان 10٪ لأخطاء المعايرة واختلاف حجم البذور). عاير آلة الزراعة لكل دفعة بذور — يختلف وزن ألف حبة بنسبة 20٪ بين الأصناف.`)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
