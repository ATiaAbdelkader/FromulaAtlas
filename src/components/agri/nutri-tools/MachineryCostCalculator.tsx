'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tractor, DollarSign } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';

export function MachineryCostCalculator() {
  const { language } = useTranslation();
  const [purchasePrice, setPurchasePrice] = useState('80000');
  const [salvageValue, setSalvageValue] = useState('20000');
  const [usefulLife, setUsefulLife] = useState('10');
  const [annualHours, setAnnualHours] = useState('400');
  const [fuelPrice, setFuelPrice] = useState('1.20');
  const [fuelRate, setFuelRate] = useState('20');
  const [workRate, setWorkRate] = useState('1.5');
  const [interestRate, setInterestRate] = useState('6');

  const result = useMemo(() => {
    const P = parseFloat(purchasePrice), S = parseFloat(salvageValue), L = parseFloat(usefulLife);
    const AH = parseFloat(annualHours), FP = parseFloat(fuelPrice), FR = parseFloat(fuelRate);
    const WR = parseFloat(workRate), IR = parseFloat(interestRate) / 100;
    if (!Number.isFinite(P) || !Number.isFinite(L) || L <= 0) return null;
    // Fixed costs
    const depreciation = (P - S) / L;
    const interest = (P + S) / 2 * IR;
    const insurance = P * 0.01;
    const housing = P * 0.005;
    const totalFixed = depreciation + interest + insurance + housing;
    const fixedPerHour = totalFixed / AH;
    const fixedPerHa = fixedPerHour / WR;
    // Variable costs
    const fuelPerHour = FR * FP;
    const repairPerHour = P * 0.03 / AH; // ~3% of purchase per year
    const laborPerHour = 15;
    const totalVariable = fuelPerHour + repairPerHour + laborPerHour;
    const variablePerHa = totalVariable / WR;
    const totalPerHa = fixedPerHa + variablePerHa;
    const totalPerHour = fixedPerHour + totalVariable;
    return { depreciation, interest, totalFixed, fixedPerHa, fixedPerHour, fuelPerHour, totalVariable, variablePerHa, totalPerHa, totalPerHour };
  }, [purchasePrice, salvageValue, usefulLife, annualHours, fuelPrice, fuelRate, workRate, interestRate]);

  return (
    <Card className="overflow-hidden border-amber-100 shadow-sm dark:border-amber-900/60">
      <CardHeader className="border-b border-border/60 bg-amber-50/50 pb-4 dark:bg-amber-950/10"><CardTitle className="flex items-center gap-2 text-base"><span className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"><Tractor className="h-4 w-4" /></span> {copyFor(language, 'Machinery Cost Calculator', 'حاسبة تكلفة الآلات')}</CardTitle><p className="text-[10px] text-muted-foreground">{copyFor(language, 'Ownership + operating cost → $/ha + $/hr · buy vs custom hire', 'تكلفة التملك والتشغيل → $/هكتار + $/ساعة · الشراء مقابل الاستئجار')}</p></CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-3 rounded-xl border border-amber-200/70 bg-amber-50/30 p-3 dark:border-amber-900/60 dark:bg-amber-950/10"><p className="text-xs font-semibold">{copyFor(language, 'Ownership assumptions', 'افتراضات التملك')}</p><div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div><Label className="text-xs font-medium">{copyFor(language, 'Purchase price ($)', 'سعر الشراء ($)')}</Label><Input aria-label={copyFor(language, 'Purchase price', 'سعر الشراء')} value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} type="number" step="1000" className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium">{copyFor(language, 'Salvage value ($)', 'قيمة الخردة ($)')}</Label><Input aria-label={copyFor(language, 'Salvage value', 'قيمة الخردة')} value={salvageValue} onChange={e => setSalvageValue(e.target.value)} type="number" step="1000" className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium">{copyFor(language, 'Useful life (yr)', 'العمر الإنتاجي (سنة)')}</Label><Input aria-label={copyFor(language, 'Useful life in years', 'العمر الإنتاجي بالسنوات')} value={usefulLife} onChange={e => setUsefulLife(e.target.value)} type="number" step="1" className="mt-1 h-10 text-sm" /></div>
        </div></div>
        <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-3"><p className="text-xs font-semibold">{copyFor(language, 'Operating assumptions', 'افتراضات التشغيل')}</p><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div><Label className="text-xs font-medium">{copyFor(language, 'Annual hours', 'الساعات السنوية')}</Label><Input aria-label={copyFor(language, 'Annual operating hours', 'ساعات التشغيل السنوية')} value={annualHours} onChange={e => setAnnualHours(e.target.value)} type="number" step="10" className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium">{copyFor(language, 'Fuel ($/L)', 'الوقود ($/لتر)')}</Label><Input aria-label={copyFor(language, 'Fuel price per liter', 'سعر الوقود لكل لتر')} value={fuelPrice} onChange={e => setFuelPrice(e.target.value)} type="number" step="0.1" className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium">{copyFor(language, 'Fuel (L/hr)', 'الوقود (لتر/ساعة)')}</Label><Input aria-label={copyFor(language, 'Fuel consumption per hour', 'استهلاك الوقود لكل ساعة')} value={fuelRate} onChange={e => setFuelRate(e.target.value)} type="number" step="1" className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium">{copyFor(language, 'Work (ha/hr)', 'العمل (هكتار/ساعة)')}</Label><Input aria-label={copyFor(language, 'Work rate in hectares per hour', 'معدل العمل بالهكتار لكل ساعة')} value={workRate} onChange={e => setWorkRate(e.target.value)} type="number" step="0.1" className="mt-1 h-10 text-sm" /></div>
        </div></div>
        {result && (
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 text-center shadow-sm"><div className="text-[9px] text-muted-foreground uppercase">{copyFor(language, 'Cost per hectare', 'التكلفة لكل هكتار')}</div><div className="text-2xl font-bold font-mono text-indigo-700">${result.totalPerHa.toFixed(0)}</div></div>
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 text-center shadow-sm"><div className="text-[9px] text-muted-foreground uppercase">{copyFor(language, 'Cost per hour', 'التكلفة لكل ساعة')}</div><div className="text-2xl font-bold font-mono text-amber-700">${result.totalPerHour.toFixed(0)}</div></div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border bg-background/60 p-3"><span className="text-muted-foreground">{copyFor(language, 'Fixed ($/ha):', 'الثابتة ($/هكتار):')}</span> <strong className="font-mono">${result.fixedPerHa.toFixed(0)}</strong> {copyFor(language, '(depreciation + interest + insurance)', '(الاستهلاك + الفائدة + التأمين)')}</div>
              <div className="rounded-lg border bg-background/60 p-3"><span className="text-muted-foreground">{copyFor(language, 'Variable ($/ha):', 'المتغيرة ($/هكتار):')}</span> <strong className="font-mono">${result.variablePerHa.toFixed(0)}</strong> {copyFor(language, '(fuel + repair + labor)', '(الوقود + الإصلاح + العمالة)')}</div>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">💡 {copyFor(language, `If custom hire < $${result.totalPerHa.toFixed(0)}/ha, custom hire is cheaper. Minimum 200 hr/yr use to justify ownership. No-till cuts fuel 60-70%.`, `إذا كان الاستئجار < ${result.totalPerHa.toFixed(0)}$/هكتار فهو أوفر. يلزم استخدام 200 ساعة/سنة على الأقل لتبرير التملك. تقلل الزراعة بدون حرث الوقود 60–70%.`)}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
