'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, DollarSign, Gauge, Printer, Tractor } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { copyFor, useTranslation } from '@/lib/language-store';
import {
  calculateMachineryOptimizer,
  DEFAULT_MACHINERY_OPERATIONS,
  type MachineryOperationId,
  type MachineryOperationInput,
} from '@/lib/machinery-field-optimizer';

const operationNames: Record<MachineryOperationId, [string, string, string]> = {
  tillage: ['Primary tillage', 'الحرث الأساسي', 'Labour primaire'],
  planting: ['Planting', 'الزراعة', 'Semis'],
  spraying: ['Crop protection', 'حماية المحصول', 'Protection des cultures'],
  harvest: ['Harvest', 'الحصاد', 'Récolte'],
};

function numberValue(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number): string {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function MachineryFieldOptimizer() {
  const { language, isRTL } = useTranslation();
  const [purchasePrice, setPurchasePrice] = useState('80000');
  const [salvageValue, setSalvageValue] = useState('20000');
  const [usefulLifeYears, setUsefulLifeYears] = useState('10');
  const [annualHours, setAnnualHours] = useState('400');
  const [interestRatePct, setInterestRatePct] = useState('6');
  const [fuelPricePerL, setFuelPricePerL] = useState('1.20');
  const [repairRatePct, setRepairRatePct] = useState('3');
  const [laborCostPerHour, setLaborCostPerHour] = useState('15');
  const [hoursPerDay, setHoursPerDay] = useState('8');
  const [operations, setOperations] = useState<MachineryOperationInput[]>(DEFAULT_MACHINERY_OPERATIONS);

  const result = useMemo(() => calculateMachineryOptimizer({
    purchasePrice: numberValue(purchasePrice),
    salvageValue: numberValue(salvageValue),
    usefulLifeYears: numberValue(usefulLifeYears),
    annualHours: numberValue(annualHours),
    interestRatePct: numberValue(interestRatePct),
    fuelPricePerL: numberValue(fuelPricePerL),
    repairRatePct: numberValue(repairRatePct),
    laborCostPerHour: numberValue(laborCostPerHour),
    hoursPerDay: numberValue(hoursPerDay),
    operations,
  }), [annualHours, fuelPricePerL, hoursPerDay, interestRatePct, laborCostPerHour, operations, purchasePrice, repairRatePct, salvageValue, usefulLifeYears]);

  const updateOperation = (id: MachineryOperationId, key: keyof MachineryOperationInput, value: string) => {
    setOperations((current) => current.map((operation) => operation.id === id ? { ...operation, [key]: key === 'name' ? value : numberValue(value) } : operation));
  };

  const tr = (english: string, arabic: string, french?: string) => copyFor(language, english, arabic, french);
  const recommendation = result.recommendation === 'own'
    ? tr('Own / operate', 'التملك والتشغيل', 'Acheter / exploiter')
    : result.recommendation === 'hire'
      ? tr('Custom hire', 'الاستئجار من مقدم خدمة', 'Prestation externe')
      : tr('Mixed strategy', 'استراتيجية مختلطة', 'Stratégie mixte');

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'} className="overflow-hidden border-amber-100 shadow-sm dark:border-amber-900/60">
      <CardHeader className="border-b border-border/60 bg-amber-50/50 pb-4 dark:bg-amber-950/10">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"><Tractor className="h-4 w-4" /></span>
          {tr('Machinery & Field-Operation Optimizer', 'مُحسّن الآلات وعمليات الحقل', 'Optimiseur des machines et des opérations au champ')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {tr('Compare ownership with custom hire, schedule field work, and find the utilization break-even point.', 'قارن بين التملك والاستئجار، وجدول عمليات الحقل، وحدد نقطة التعادل لاستخدام الآلة.', 'Comparez la propriété à la prestation, planifiez les travaux et trouvez le seuil de rentabilité d’utilisation.')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-amber-200/70 bg-amber-50/30 p-3 dark:border-amber-900/60 dark:bg-amber-950/10">
            <p className="text-xs font-semibold">{tr('Ownership assumptions', 'افتراضات التملك', 'Hypothèses de propriété')}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div><Label className="text-xs">{tr('Purchase price ($)', 'سعر الشراء ($)', 'Prix d’achat ($)')}</Label><Input aria-label={tr('Purchase price', 'سعر الشراء', 'Prix d’achat')} value={purchasePrice} onChange={(event) => setPurchasePrice(event.target.value)} type="number" min="0" step="1000" className="mt-1 h-9" /></div>
              <div><Label className="text-xs">{tr('Salvage value ($)', 'قيمة الخردة ($)', 'Valeur résiduelle ($)')}</Label><Input aria-label={tr('Salvage value', 'قيمة الخردة', 'Valeur résiduelle')} value={salvageValue} onChange={(event) => setSalvageValue(event.target.value)} type="number" min="0" step="1000" className="mt-1 h-9" /></div>
              <div><Label className="text-xs">{tr('Useful life (years)', 'العمر الإنتاجي (سنوات)', 'Durée de vie (ans)')}</Label><Input aria-label={tr('Useful life in years', 'العمر الإنتاجي بالسنوات', 'Durée de vie en années')} value={usefulLifeYears} onChange={(event) => setUsefulLifeYears(event.target.value)} type="number" min="1" step="1" className="mt-1 h-9" /></div>
            </div>
          </div>
          <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-3">
            <p className="text-xs font-semibold">{tr('Operating assumptions', 'افتراضات التشغيل', 'Hypothèses d’exploitation')}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div><Label className="text-xs">{tr('Annual hours', 'الساعات السنوية', 'Heures annuelles')}</Label><Input aria-label={tr('Annual available hours', 'الساعات المتاحة سنوياً', 'Heures disponibles par an')} value={annualHours} onChange={(event) => setAnnualHours(event.target.value)} type="number" min="1" step="10" className="mt-1 h-9" /></div>
              <div><Label className="text-xs">{tr('Interest (%)', 'الفائدة (%)', 'Intérêt (%)')}</Label><Input aria-label={tr('Interest rate', 'معدل الفائدة', 'Taux d’intérêt')} value={interestRatePct} onChange={(event) => setInterestRatePct(event.target.value)} type="number" min="0" step="0.5" className="mt-1 h-9" /></div>
              <div><Label className="text-xs">{tr('Fuel ($/L)', 'الوقود ($/لتر)', 'Carburant ($/L)')}</Label><Input aria-label={tr('Fuel price per liter', 'سعر الوقود لكل لتر', 'Prix du carburant par litre')} value={fuelPricePerL} onChange={(event) => setFuelPricePerL(event.target.value)} type="number" min="0" step="0.1" className="mt-1 h-9" /></div>
              <div><Label className="text-xs">{tr('Repair rate (%)', 'معدل الإصلاح (%)', 'Taux de réparation (%)')}</Label><Input aria-label={tr('Annual repair rate', 'معدل الإصلاح السنوي', 'Taux annuel de réparation')} value={repairRatePct} onChange={(event) => setRepairRatePct(event.target.value)} type="number" min="0" step="0.5" className="mt-1 h-9" /></div>
              <div><Label className="text-xs">{tr('Labor ($/hr)', 'العمالة ($/ساعة)', 'Main-d’œuvre ($/h)')}</Label><Input aria-label={tr('Labor cost per hour', 'تكلفة العمالة لكل ساعة', 'Coût de main-d’œuvre par heure')} value={laborCostPerHour} onChange={(event) => setLaborCostPerHour(event.target.value)} type="number" min="0" step="1" className="mt-1 h-9" /></div>
              <div><Label className="text-xs">{tr('Workday (hours)', 'يوم العمل (ساعات)', 'Journée de travail (heures)')}</Label><Input aria-label={tr('Hours per workday', 'ساعات يوم العمل', 'Heures par journée')} value={hoursPerDay} onChange={(event) => setHoursPerDay(event.target.value)} type="number" min="1" step="1" className="mt-1 h-9" /></div>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-border/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold">{tr('Field-operation plan', 'خطة عمليات الحقل', 'Plan des opérations au champ')}</p>
              <p className="text-[11px] text-muted-foreground">{tr('Adjust area, capacity, fuel, and local custom-hire quotes for each operation.', 'عدّل المساحة والسعة والوقود وعروض الاستئجار المحلية لكل عملية.', 'Ajustez la surface, la capacité, le carburant et les devis locaux pour chaque opération.')}</p>
            </div>
            <Badge variant="outline" className="gap-1"><CalendarClock className="h-3 w-3" />{result.totalRequiredHours.toFixed(1)} {tr('hours planned', 'ساعة مخططة', 'heures planifiées')}</Badge>
          </div>
          <div className="space-y-3">
            {operations.map((operation) => {
              const name = operationNames[operation.id];
              return (
                <div key={operation.id} className="grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)] lg:items-end">
                  <div className="flex items-center gap-2 lg:pb-1"><span className="rounded-md bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"><Tractor className="h-4 w-4" /></span><div><p className="text-sm font-medium">{copyFor(language, name[0], name[1], name[2])}</p><p className="text-[10px] text-muted-foreground">{tr('Operation', 'عملية', 'Opération')}</p></div></div>
                  <div><Label className="text-[11px]">{tr('Area (ha)', 'المساحة (هكتار)', 'Surface (ha)')}</Label><Input aria-label={`${tr('Area for', 'مساحة', 'Surface de')} ${copyFor(language, name[0], name[1], name[2])}`} value={operation.areaHa} onChange={(event) => updateOperation(operation.id, 'areaHa', event.target.value)} type="number" min="0" step="1" className="mt-1 h-9" /></div>
                  <div><Label className="text-[11px]">{tr('Capacity (ha/hr)', 'السعة (هكتار/ساعة)', 'Capacité (ha/h)')}</Label><Input aria-label={`${tr('Capacity for', 'سعة', 'Capacité de')} ${copyFor(language, name[0], name[1], name[2])}`} value={operation.workRateHaPerHour} onChange={(event) => updateOperation(operation.id, 'workRateHaPerHour', event.target.value)} type="number" min="0.1" step="0.1" className="mt-1 h-9" /></div>
                  <div><Label className="text-[11px]">{tr('Fuel (L/hr)', 'الوقود (لتر/ساعة)', 'Carburant (L/h)')}</Label><Input aria-label={`${tr('Fuel for', 'وقود', 'Carburant de')} ${copyFor(language, name[0], name[1], name[2])}`} value={operation.fuelLPerHour} onChange={(event) => updateOperation(operation.id, 'fuelLPerHour', event.target.value)} type="number" min="0" step="1" className="mt-1 h-9" /></div>
                  <div><Label className="text-[11px]">{tr('Hire ($/ha)', 'الاستئجار ($/هكتار)', 'Prestation ($/ha)')}</Label><Input aria-label={`${tr('Custom hire quote for', 'عرض الاستئجار لـ', 'Devis de prestation pour')} ${copyFor(language, name[0], name[1], name[2])}`} value={operation.customHirePerHa} onChange={(event) => updateOperation(operation.id, 'customHirePerHa', event.target.value)} type="number" min="0" step="5" className="mt-1 h-9" /></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3 text-center dark:border-indigo-900/60 dark:bg-indigo-950/20"><DollarSign className="mx-auto h-4 w-4 text-indigo-600" /><p className="mt-1 text-[10px] uppercase text-muted-foreground">{tr('Owned cost', 'تكلفة التملك', 'Coût de propriété')}</p><p className="text-xl font-bold font-mono text-indigo-700">{money(result.ownedCostTotal)}</p></div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 text-center dark:border-amber-900/60 dark:bg-amber-950/20"><DollarSign className="mx-auto h-4 w-4 text-amber-600" /><p className="mt-1 text-[10px] uppercase text-muted-foreground">{tr('Custom hire', 'الاستئجار', 'Prestation')}</p><p className="text-xl font-bold font-mono text-amber-700">{money(result.customHireTotal)}</p></div>
          <div className={`rounded-xl border p-3 text-center ${result.savingsComparedWithHire >= 0 ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20' : 'border-rose-200 bg-rose-50/40 dark:border-rose-900/60 dark:bg-rose-950/20'}`}><Gauge className="mx-auto h-4 w-4 text-emerald-600" /><p className="mt-1 text-[10px] uppercase text-muted-foreground">{tr('Hire savings', 'وفر الاستئجار', 'Économie prestation')}</p><p className="text-xl font-bold font-mono">{money(result.savingsComparedWithHire)}</p></div>
          <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-3 text-center dark:border-sky-900/60 dark:bg-sky-950/20"><CalendarClock className="mx-auto h-4 w-4 text-sky-600" /><p className="mt-1 text-[10px] uppercase text-muted-foreground">{tr('Annual utilization', 'الاستخدام السنوي', 'Utilisation annuelle')}</p><p className="text-xl font-bold font-mono text-sky-700">{result.utilizationPct.toFixed(0)}%</p></div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 p-3">
          <div><p className="text-xs text-muted-foreground">{tr('Planning recommendation', 'توصية التخطيط', 'Recommandation de planification')}</p><p className="font-semibold">{recommendation}</p></div>
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()} className="gap-2"><Printer className="h-4 w-4" />{tr('Print plan', 'طباعة الخطة', 'Imprimer le plan')}</Button>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[720px] text-xs">
            <thead className="bg-muted/40 text-left"><tr><th className="p-2 font-medium">{tr('Operation', 'العملية', 'Opération')}</th><th className="p-2 font-medium">{tr('Hours', 'الساعات', 'Heures')}</th><th className="p-2 font-medium">{tr('Days', 'الأيام', 'Jours')}</th><th className="p-2 font-medium">{tr('Owned $/ha', 'التملك $/هكتار', 'Propriété $/ha')}</th><th className="p-2 font-medium">{tr('Hire $/ha', 'الاستئجار $/هكتار', 'Prestation $/ha')}</th><th className="p-2 font-medium">{tr('Break-even hours', 'ساعات التعادل', 'Heures de seuil')}</th></tr></thead>
            <tbody>{result.operations.map((operation) => <tr key={operation.id} className="border-t"><td className="p-2 font-medium">{copyFor(language, operationNames[operation.id][0], operationNames[operation.id][1], operationNames[operation.id][2])}</td><td className="p-2 font-mono">{operation.requiredHours.toFixed(1)}</td><td className="p-2 font-mono">{operation.scheduledDays.toFixed(1)}</td><td className="p-2 font-mono">{money(operation.ownedCostPerHa)}</td><td className="p-2 font-mono">{money(operation.customHirePerHa)}</td><td className="p-2 font-mono">{operation.breakEvenHours === null ? '—' : operation.breakEvenHours.toFixed(1)}</td></tr>)}</tbody>
          </table>
        </div>

        {result.warnings.length > 0 && <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/20 dark:text-amber-100"><p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" />{tr('Planning guardrails', 'ضوابط التخطيط', 'Garde-fous de planification')}</p>{result.warnings.map((warning) => <p key={warning}>• {warning}</p>)}</div>}

        <p className="text-[10px] leading-relaxed text-muted-foreground">{tr('Planning estimate only. Update fuel, labor, local hire quotes, field capacity, and annual utilization with your farm records before making a capital or contracting decision.', 'هذا تقدير للتخطيط فقط. حدّث الوقود والعمالة وعروض الاستئجار المحلية وسعة الحقل والاستخدام السنوي وفق سجلات مزرعتك قبل اتخاذ قرار شراء أو تعاقد.', 'Estimation de planification uniquement. Actualisez les données locales avant toute décision d’achat ou de prestation.')}</p>
      </CardContent>
    </Card>
  );
}
