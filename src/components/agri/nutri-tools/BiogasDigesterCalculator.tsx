'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Flame, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';

const SUBSTRATE_AR: Record<string, string> = { dairy_manure: 'روث الأبقار الحلوب', poultry_manure: 'روث الدواجن', food_waste: 'مخلفات الطعام', crop_residue: 'مخلفات المحاصيل (قش)', grass: 'قصاصات الأعشاب' };

const SUBSTRATES: Record<string, { name: string; emoji: string; vs: number; bmp: number; cn: number }> = {
  dairy_manure: { name: 'Dairy manure', emoji: '🐄', vs: 80, bmp: 250, cn: 18 },
  poultry_manure: { name: 'Poultry manure', emoji: '🐔', vs: 75, bmp: 350, cn: 10 },
  food_waste: { name: 'Food waste', emoji: '🍽️', vs: 90, bmp: 500, cn: 15 },
  crop_residue: { name: 'Crop residue (straw)', emoji: '🌾', vs: 85, bmp: 300, cn: 60 },
  grass: { name: 'Grass clippings', emoji: '🌿', vs: 85, bmp: 400, cn: 15 },
};

export function BiogasDigesterCalculator() {
  const { language } = useTranslation();
  const [substrate, setSubstrate] = useState('dairy_manure');
  const [dailyFeed, setDailyFeed] = useState('50');
  const [hrt, setHrt] = useState('25');
  const [methanePct, setMethanePct] = useState('60');
  const [electricityPrice, setElectricityPrice] = useState('0.12');

  const result = useMemo(() => {
    const sub = SUBSTRATES[substrate];
    const feed = parseFloat(dailyFeed);
    const h = parseFloat(hrt);
    const ch4 = parseFloat(methanePct) / 100;
    const ep = parseFloat(electricityPrice);
    if (!Number.isFinite(feed) || !Number.isFinite(h)) return null;

    const vsPerDay = feed * sub.vs / 100; // kg VS/day
    const biogasPerDay = vsPerDay * sub.bmp * 0.7 / 1000; // m³/day (70% of BMP realistic)
    const ch4PerDay = biogasPerDay * ch4;
    const energyPerDay = ch4PerDay * 9.94; // kWh/day
    const electricityPerDay = energyPerDay * 0.35; // 35% generator efficiency
    const dailyRevenue = electricityPerDay * ep;
    const digesterVolume = (feed * 0.1) * h; // assume 10% solids → 10× dilution = volume m³
    const annualBiogas = biogasPerDay * 365;
    const annualRevenue = dailyRevenue * 365;
    const cn = sub.cn;

    return { sub, vsPerDay, biogasPerDay, ch4PerDay, energyPerDay, electricityPerDay, dailyRevenue, digesterVolume, annualBiogas, annualRevenue, cn };
  }, [substrate, dailyFeed, hrt, methanePct, electricityPrice]);

  return (
    <Card className="overflow-hidden border-orange-100 shadow-sm dark:border-orange-900/60">
      <CardHeader className="border-b border-border/60 bg-orange-50/50 pb-4 dark:bg-orange-950/10"><CardTitle className="flex items-center gap-2 text-base"><span className="rounded-lg bg-orange-100 p-2 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"><Flame className="h-4 w-4" /></span> {copyFor(language, 'Biogas Digester Calculator', 'حاسبة هاضم الغاز الحيوي')}</CardTitle><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{copyFor(language, 'Biogas yield · digester sizing · energy + revenue · 5 substrates', 'إنتاج الغاز الحيوي · تحديد حجم الهاضم · الطاقة + الإيرادات · 5 مواد أولية')}</p></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-orange-200/70 bg-orange-50/30 p-3 dark:border-orange-900/60 dark:bg-orange-950/10 sm:grid-cols-2">
          <div><Label className="text-xs font-medium">{copyFor(language, 'Substrate', 'المادة الأولية')}</Label><select aria-label={copyFor(language, 'Digester substrate', 'مادة الهاضم الأولية')} value={substrate} onChange={e => setSubstrate(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{Object.entries(SUBSTRATES).map(([k, v]) => <option key={k} value={k}>{v.emoji} {copyFor(language, v.name, SUBSTRATE_AR[k])}</option>)}</select></div>
          <div><Label className="text-xs font-medium">{copyFor(language, 'Daily feed (kg/day)', 'التغذية اليومية (كغ/يوم)')}</Label><Input aria-label={copyFor(language, 'Daily feed quantity', 'كمية التغذية اليومية')} value={dailyFeed} onChange={e => setDailyFeed(e.target.value)} type="number" step="5" className="mt-1 h-10 text-sm" /></div>
        </div>
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 sm:grid-cols-3">
          <div><Label className="text-xs font-medium">{copyFor(language, 'HRT (days)', 'زمن الاحتجاز الهيدروليكي (يوم)')}</Label><Input aria-label={copyFor(language, 'Hydraulic retention time', 'زمن الاحتجاز الهيدروليكي')} value={hrt} onChange={e => setHrt(e.target.value)} type="number" step="5" className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium">{copyFor(language, 'CH₄ content (%)', 'محتوى الميثان (%)')}</Label><Input aria-label={copyFor(language, 'Methane content', 'محتوى الميثان')} value={methanePct} onChange={e => setMethanePct(e.target.value)} type="number" step="5" className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium">{copyFor(language, 'Electricity ($/kWh)', 'الكهرباء (دولار/ك.و.س)')}</Label><Input aria-label={copyFor(language, 'Electricity price', 'سعر الكهرباء')} value={electricityPrice} onChange={e => setElectricityPrice(e.target.value)} type="number" step="0.01" className="mt-1 h-10 text-sm" /></div>
        </div>
        {result && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Metric label={copyFor(language, 'Daily biogas', 'الغاز الحيوي اليومي')} value={`${result.biogasPerDay.toFixed(1)} m³`} color="orange" />
              <Metric label={copyFor(language, 'CH₄ energy', 'طاقة CH₄')} value={`${result.energyPerDay.toFixed(1)} kWh`} color="amber" />
              <Metric label={copyFor(language, 'Electricity', 'الكهرباء')} value={`${result.electricityPerDay.toFixed(1)} kWh`} color="cyan" />
              <Metric label={copyFor(language, 'Daily revenue', 'الإيراد اليومي')} value={`$${result.dailyRevenue.toFixed(2)}`} color="emerald" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3"><span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Digester volume', 'حجم الهاضم')}</span><strong className="mt-1 block font-mono text-base">{result.digesterVolume.toFixed(1)} m³</strong></div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 dark:border-emerald-900 dark:bg-emerald-950/20"><span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Annual revenue', 'الإيراد السنوي')}</span><strong className="mt-1 block font-mono text-base text-emerald-600 dark:text-emerald-300">${result.annualRevenue.toFixed(0)}</strong></div>
            </div>
            {result.cn < 15 ? (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-700 dark:border-amber-900 dark:text-amber-300"><AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>{copyFor(language, `C:N = ${result.cn}:1 — too low.`, `C:N = ${result.cn}:1 — منخفض جداً.`)}</strong> {copyFor(language, 'Add carbon-rich co-substrate (straw, crop residue) to reach 20-30:1 for optimal digestion.', 'أضف مادة مساعدة غنية بالكربون (القش أو مخلفات المحاصيل) للوصول إلى 20–30:1 وتحقيق الهضم الأمثل.')}</span></div>
            ) : result.cn > 35 ? (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-700 dark:border-amber-900 dark:text-amber-300"><AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>{copyFor(language, `C:N = ${result.cn}:1 — too high.`, `C:N = ${result.cn}:1 — مرتفع جداً.`)}</strong> {copyFor(language, 'Add nitrogen-rich co-substrate (manure, food waste) to reach 20-30:1.', 'أضف مادة مساعدة غنية بالنيتروجين (الروث أو مخلفات الطعام) للوصول إلى 20–30:1.')}</span></div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs leading-relaxed text-emerald-700 dark:border-emerald-900 dark:text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>{copyFor(language, `C:N = ${result.cn}:1 — optimal.`, `C:N = ${result.cn}:1 — مثالي.`)}</strong> {copyFor(language, `Mesophilic digester (35°C) with ${result.digesterVolume.toFixed(0)} m³ working volume.`, `هاضم متوسط الحرارة (35°م) بحجم تشغيل ${result.digesterVolume.toFixed(0)} م³.`)}</span></div>
            )}
            <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">💡 {copyFor(language, 'Use CHP (combined heat + power) for 85% efficiency: 35% electricity + 50% heat. Digestate is excellent organic fertilizer — NPK retains 80-90% of feed value.', 'استخدم التوليد المشترك للحرارة والكهرباء (CHP) بكفاءة 85%: كهرباء 35% + حرارة 50%. المخلفات السائلة للهضم سماد عضوي ممتاز — يحتفظ NPK بنسبة 80–90% من قيمة التغذية.')}</div>
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
  orange: 'border-orange-200 dark:border-orange-900 bg-orange-50/40 dark:bg-orange-950/20',
};
function Metric({ label, value, color }: { label: string; value: string; color: keyof typeof ACCENT }) {
  return <div className={`rounded-xl border p-3 shadow-sm ${ACCENT[color]}`}><div className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 font-mono text-base font-semibold">{value}</div></div>;
}
