'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Droplets, CheckCircle2, AlertTriangle } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';

export function WaterHarvestingCalculator() {
  const { language } = useTranslation();
  const [roofArea, setRoofArea] = useState('100');
  const [annualRain, setAnnualRain] = useState('400');
  const [roofType, setRoofType] = useState('metal');
  const [demand, setDemand] = useState('100');
  const [cisternSize, setCisternSize] = useState('10');

  const result = useMemo(() => {
    const A = parseFloat(roofArea), R = parseFloat(annualRain), D = parseFloat(demand);
    const Cs = parseFloat(cisternSize);
    const coeff: Record<string, number> = { metal: 0.85, concrete: 0.80, tile: 0.75, thatch: 0.25 };
    const c = coeff[roofType] ?? 0.8;
    const annualSupply = A * R * 0.001 * c; // m³ (mm → m conversion)
    const dailySupply = annualSupply / 365;
    const annualDemand = D * 365 / 1000; // L/day → m³/year
    const coverage = annualDemand > 0 ? (annualSupply / annualDemand) * 100 : 0;
    const fillsPerYear = annualSupply / Cs;
    const enough = coverage >= 80;
    return { annualSupply, dailySupply, annualDemand, coverage, fillsPerYear, enough };
  }, [roofArea, annualRain, roofType, demand, cisternSize]);

  return (
    <Card className="overflow-hidden border-cyan-100 shadow-sm dark:border-cyan-900/60">
      <CardHeader className="border-b border-border/60 bg-cyan-50/50 pb-4 dark:bg-cyan-950/10"><CardTitle className="flex items-center gap-2 text-base"><span className="rounded-lg bg-cyan-100 p-2 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300"><Droplets className="h-4 w-4" /></span> {copyFor(language, 'Water Harvesting Calculator', 'حاسبة حصاد المياه')}</CardTitle><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{copyFor(language, 'Rooftop rainwater collection · cistern sizing · demand coverage', 'جمع مياه الأمطار من الأسطح · تحديد حجم الخزان · تغطية الطلب')}</p></CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 rounded-xl border border-cyan-200/70 bg-cyan-50/30 p-3 dark:border-cyan-900/60 dark:bg-cyan-950/10">
          <div><p className="text-xs font-semibold text-cyan-950 dark:text-cyan-100">{copyFor(language, 'Collection potential', 'إمكانات الجمع')}</p><p className="text-[11px] leading-relaxed text-muted-foreground">{copyFor(language, 'Start with the catchment surface and local rainfall, then account for the roof material.', 'ابدأ بمساحة التجميع والأمطار المحلية، ثم ضع مادة السطح في الحسبان.')}</p></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div><Label className="text-xs font-medium">{copyFor(language, 'Roof area (m²)', 'مساحة السطح (م²)')}</Label><Input aria-label={copyFor(language, 'Roof area in square metres', 'مساحة السطح بالمتر المربع')} value={roofArea} onChange={e => setRoofArea(e.target.value)} type="number" step="5" className="mt-1 h-10 text-sm" /></div>
            <div><Label className="text-xs font-medium">{copyFor(language, 'Annual rain (mm)', 'الأمطار السنوية (مم)')}</Label><Input aria-label={copyFor(language, 'Annual rainfall in millimetres', 'هطول الأمطار السنوي بالملليمتر')} value={annualRain} onChange={e => setAnnualRain(e.target.value)} type="number" step="10" className="mt-1 h-10 text-sm" /></div>
            <div><Label className="text-xs font-medium">{copyFor(language, 'Roof type', 'نوع السطح')}</Label><select aria-label={copyFor(language, 'Roof type', 'نوع السطح')} value={roofType} onChange={e => setRoofType(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="metal">{copyFor(language, 'Metal', 'معدني')} (0.85)</option><option value="concrete">{copyFor(language, 'Concrete', 'خرسانة')} (0.80)</option><option value="tile">{copyFor(language, 'Tile', 'قرميد')} (0.75)</option><option value="thatch">{copyFor(language, 'Thatch', 'قش')} (0.25)</option></select></div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 sm:grid-cols-2">
          <div><Label className="text-xs font-medium">{copyFor(language, 'Daily demand (L/day)', 'الطلب اليومي (لتر/يوم)')}</Label><Input aria-label={copyFor(language, 'Daily water demand', 'الطلب اليومي على المياه')} value={demand} onChange={e => setDemand(e.target.value)} type="number" step="10" className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium">{copyFor(language, 'Cistern size (m³)', 'حجم الخزان (م³)')}</Label><Input aria-label={copyFor(language, 'Cistern size in cubic metres', 'حجم الخزان بالمتر المكعب')} value={cisternSize} onChange={e => setCisternSize(e.target.value)} type="number" step="1" className="mt-1 h-10 text-sm" /></div>
        </div>
        {result && (
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-3 shadow-sm dark:border-cyan-900 dark:bg-cyan-950/20"><div className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Annual supply', 'الإمداد السنوي')}</div><div className="mt-1 font-mono text-xl font-bold text-cyan-700 dark:text-cyan-300">{result.annualSupply.toFixed(1)}</div><div className="text-[10px] text-muted-foreground">{copyFor(language, 'm³/year', 'م³/سنة')}</div></div>
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 shadow-sm dark:border-amber-900 dark:bg-amber-950/20"><div className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Daily average', 'المتوسط اليومي')}</div><div className="mt-1 font-mono text-xl font-bold text-amber-700 dark:text-amber-300">{result.dailySupply.toFixed(0)}</div><div className="text-[10px] text-muted-foreground">{copyFor(language, 'L/day', 'لتر/يوم')}</div></div>
              <div className="rounded-xl border p-3 shadow-sm" style={{ borderColor: result.enough ? '#10b98160' : '#dc262660', backgroundColor: result.enough ? '#10b98110' : '#dc262610' }}><div className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Demand coverage', 'تغطية الطلب')}</div><div className="mt-1 font-mono text-xl font-bold" style={{ color: result.enough ? '#10b981' : '#dc2626' }}>{result.coverage.toFixed(0)}%</div><div className="text-[10px] text-muted-foreground">{copyFor(language, 'of annual demand', 'من الطلب السنوي')}</div></div>
            </div>
            {result.enough ? (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs leading-relaxed text-emerald-700 dark:border-emerald-900 dark:text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>{copyFor(language, `System covers ${result.coverage.toFixed(0)}% of demand.`, `يغطي النظام ${result.coverage.toFixed(0)}% من الطلب.`)}</strong> {copyFor(language, `Cistern fills ${result.fillsPerYear.toFixed(1)}×/year — right-size for dry season storage.`, `يمتلئ الخزان ${result.fillsPerYear.toFixed(1)} مرة/سنة — اختر حجماً مناسباً للتخزين في موسم الجفاف.`)}</span></div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-700 dark:border-amber-900 dark:text-amber-300"><AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>{copyFor(language, `Covers only ${result.coverage.toFixed(0)}%.`, `يغطي ${result.coverage.toFixed(0)}% فقط.`)}</strong> {copyFor(language, 'Increase roof area, reduce demand, or supplement with well water.', 'زد مساحة السطح، أو خفّض الطلب، أو أكمل الإمداد بمياه البئر.')}</span></div>
            )}
            <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">💡 {copyFor(language, 'Install first-flush diverter (skips dirty first 0.5mm of rain). Use 200µm leaf filter. Cover cistern to prevent mosquito + evaporation.', 'ركّب محوّل التدفق الأول (لتجاوز أول 0.5 مم الملوثة من المطر). استخدم مرشح أوراق بحجم 200 ميكرومتر. غطِّ الخزان لمنع البعوض والتبخر.')}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
