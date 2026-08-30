'use client';

import { useMemo, useState } from 'react';
import { Tractor, Copy, Check, RotateCcw, AlertTriangle, CalendarClock, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';
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

const TITLE: TrilingualString = {
  en: 'Machinery & Field-Operation Optimizer',
  ar: 'مُحسّن الآلات وعمليات الحقل',
  fr: 'Optimiseur des machines et des opérations au champ',
};

const DESC: TrilingualString = {
  en: 'Compare ownership with custom hire, schedule field work, and find the utilization break-even point.',
  ar: 'قارن بين التملك والاستئجار، وجدول عمليات الحقل، وحدد نقطة التعادل لاستخدام الآلة.',
  fr: "Comparez la propriété à la prestation, planifiez les travaux et trouvez le seuil de rentabilité d'utilisation.",
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Planning estimate only. Update fuel, labor, local hire quotes, field capacity, and annual utilization with your farm records before making a capital or contracting decision.',
  ar: 'هذا تقدير للتخطيط فقط. حدّث الوقود والعمالة وعروض الاستئجار المحلية وسعة الحقل والاستخدام السنوي وفق سجلات مزرعتك قبل اتخاذ قرار شراء أو تعاقد.',
  fr: "Estimation de planification uniquement. Actualisez les données locales avant toute décision d'achat ou de prestation.",
};

function numberValue(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number): string {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function MachineryFieldOptimizer() {
  const { language } = useTranslation();
  const tr = (english: string, arabic: string, french?: string) => copyFor(language, english, arabic, french);

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
  const [copied, setCopied] = useState(false);

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

  const recommendation = result.recommendation === 'own'
    ? tr('Own / operate', 'التملك والتشغيل', 'Acheter / exploiter')
    : result.recommendation === 'hire'
      ? tr('Custom hire', 'الاستئجار من مقدم خدمة', 'Prestation externe')
      : tr('Mixed strategy', 'استراتيجية مختلطة', 'Stratégie mixte');

  const handleReset = () => {
    setPurchasePrice('80000'); setSalvageValue('20000'); setUsefulLifeYears('10');
    setAnnualHours('400'); setInterestRatePct('6'); setFuelPricePerL('1.20');
    setRepairRatePct('3'); setLaborCostPerHour('15'); setHoursPerDay('8');
    setOperations(DEFAULT_MACHINERY_OPERATIONS);
    toast({ title: tr('Reset', 'إعادة', 'Réinitialiser') });
  };

  const handleCopy = () => {
    const opLines = result.operations.map(op => {
      const name = operationNames[op.id];
      return `${copyFor(language, name[0], name[1], name[2])}: ${op.requiredHours.toFixed(1)}h, ${op.scheduledDays.toFixed(1)}d, owned ${money(op.ownedCostPerHa)}/ha, hire ${money(op.customHirePerHa)}/ha, break-even ${op.breakEvenHours === null ? '—' : op.breakEvenHours.toFixed(1) + 'h'}`;
    });
    const text = `=== MACHINERY OPTIMIZER ===\nRecommendation: ${recommendation}\nOwned cost: ${money(result.ownedCostTotal)}\nCustom hire: ${money(result.customHireTotal)}\nHire savings: ${money(result.savingsComparedWithHire)}\nUtilization: ${result.utilizationPct.toFixed(0)}%\nTotal hours planned: ${result.totalRequiredHours.toFixed(1)}\n\nPer operation:\n${opLines.join('\n')}`.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: tr('Summary Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <CalculatorShell
      icon={Tractor}
      title={TITLE}
      description={DESC}
      badge="Capital Decision"
      accent="amber"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' },
          onClick: handleCopy,
          variant: 'primary',
          showCheck: copied,
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      protocolNote={PROTOCOL_NOTE}
    >
      <CalculatorShell.Inputs>
        <div className="space-y-3">
          {/* Ownership assumptions */}
          <div className="space-y-3 rounded-xl border border-amber-200/70 bg-amber-50/30 p-3 dark:border-amber-900/60 dark:bg-amber-950/10">
            <p className="text-xs font-semibold">{tr('Ownership assumptions', 'افتراضات التملك', 'Hypothèses de propriété')}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div><Label className="text-xs">{tr('Purchase price ($)', 'سعر الشراء ($)', 'Prix d\'achat ($)')}</Label><Input aria-label={tr('Purchase price', 'سعر الشراء', 'Prix d\'achat')} value={purchasePrice} onChange={(event) => setPurchasePrice(event.target.value)} type="number" min="0" step="1000" className="mt-1 h-9" /></div>
              <div><Label className="text-xs">{tr('Salvage value ($)', 'قيمة الخردة ($)', 'Valeur résiduelle ($)')}</Label><Input aria-label={tr('Salvage value', 'قيمة الخردة', 'Valeur résiduelle')} value={salvageValue} onChange={(event) => setSalvageValue(event.target.value)} type="number" min="0" step="1000" className="mt-1 h-9" /></div>
              <div><Label className="text-xs">{tr('Useful life (years)', 'العمر الإنتاجي (سنوات)', 'Durée de vie (ans)')}</Label><Input aria-label={tr('Useful life in years', 'العمر الإنتاجي بالسنوات', 'Durée de vie en années')} value={usefulLifeYears} onChange={(event) => setUsefulLifeYears(event.target.value)} type="number" min="1" step="1" className="mt-1 h-9" /></div>
            </div>
          </div>

          {/* Operating assumptions */}
          <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-3">
            <p className="text-xs font-semibold">{tr('Operating assumptions', 'افتراضات التشغيل', 'Hypothèses d\'exploitation')}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div><Label className="text-xs">{tr('Annual hours', 'الساعات السنوية', 'Heures annuelles')}</Label><Input aria-label={tr('Annual available hours', 'الساعات المتاحة سنوياً', 'Heures disponibles par an')} value={annualHours} onChange={(event) => setAnnualHours(event.target.value)} type="number" min="1" step="10" className="mt-1 h-9" /></div>
              <div><Label className="text-xs">{tr('Interest (%)', 'الفائدة (%)', 'Intérêt (%)')}</Label><Input aria-label={tr('Interest rate', 'معدل الفائدة', 'Taux d\'intérêt')} value={interestRatePct} onChange={(event) => setInterestRatePct(event.target.value)} type="number" min="0" step="0.5" className="mt-1 h-9" /></div>
              <div><Label className="text-xs">{tr('Fuel ($/L)', 'الوقود ($/لتر)', 'Carburant ($/L)')}</Label><Input aria-label={tr('Fuel price per liter', 'سعر الوقود لكل لتر', 'Prix du carburant par litre')} value={fuelPricePerL} onChange={(event) => setFuelPricePerL(event.target.value)} type="number" min="0" step="0.1" className="mt-1 h-9" /></div>
              <div><Label className="text-xs">{tr('Repair rate (%)', 'معدل الإصلاح (%)', 'Taux de réparation (%)')}</Label><Input aria-label={tr('Annual repair rate', 'معدل الإصلاح السنوي', 'Taux annuel de réparation')} value={repairRatePct} onChange={(event) => setRepairRatePct(event.target.value)} type="number" min="0" step="0.5" className="mt-1 h-9" /></div>
              <div><Label className="text-xs">{tr('Labor ($/hr)', 'العمالة ($/ساعة)', 'Main-d\'œuvre ($/h)')}</Label><Input aria-label={tr('Labor cost per hour', 'تكلفة العمالة لكل ساعة', 'Coût de main-d\'œuvre par heure')} value={laborCostPerHour} onChange={(event) => setLaborCostPerHour(event.target.value)} type="number" min="0" step="1" className="mt-1 h-9" /></div>
              <div><Label className="text-xs">{tr('Workday (hours)', 'يوم العمل (ساعات)', 'Journée de travail (heures)')}</Label><Input aria-label={tr('Hours per workday', 'ساعات يوم العمل', 'Heures par journée')} value={hoursPerDay} onChange={(event) => setHoursPerDay(event.target.value)} type="number" min="1" step="1" className="mt-1 h-9" /></div>
            </div>
          </div>

          {/* Field-operation plan */}
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
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="space-y-3">
          {/* KPI tiles */}
          <div className="grid gap-3 sm:grid-cols-2">
            <CalculatorShell.MetricTile label={tr('Owned cost', 'تكلفة التملك', 'Coût de propriété')} value={money(result.ownedCostTotal)} color="amber" />
            <CalculatorShell.MetricTile label={tr('Custom hire', 'الاستئجار', 'Prestation')} value={money(result.customHireTotal)} color="teal" />
            <CalculatorShell.MetricTile label={tr('Hire savings', 'وفر الاستئجار', 'Économie prestation')} value={money(result.savingsComparedWithHire)} color={result.savingsComparedWithHire >= 0 ? 'emerald' : 'rose'} />
            <CalculatorShell.MetricTile label={tr('Annual utilization', 'الاستخدام السنوي', 'Utilisation annuelle')} value={`${result.utilizationPct.toFixed(0)}%`} color="sky" />
          </div>

          {/* Recommendation */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 p-3">
            <div><p className="text-xs text-muted-foreground">{tr('Planning recommendation', 'توصية التخطيط', 'Recommandation de planification')}</p><p className="font-semibold">{recommendation}</p></div>
            <Button type="button" variant="outline" size="sm" onClick={() => window.print()} className="gap-2"><Printer className="h-4 w-4" />{tr('Print plan', 'طباعة الخطة', 'Imprimer le plan')}</Button>
          </div>

          {/* Break-even table */}
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[720px] text-xs">
              <thead className="bg-muted/40 text-left"><tr><th className="p-2 font-medium">{tr('Operation', 'العملية', 'Opération')}</th><th className="p-2 font-medium">{tr('Hours', 'الساعات', 'Heures')}</th><th className="p-2 font-medium">{tr('Days', 'الأيام', 'Jours')}</th><th className="p-2 font-medium">{tr('Owned $/ha', 'التملك $/هكتار', 'Propriété $/ha')}</th><th className="p-2 font-medium">{tr('Hire $/ha', 'الاستئجار $/هكتار', 'Prestation $/ha')}</th><th className="p-2 font-medium">{tr('Break-even hours', 'ساعات التعادل', 'Heures de seuil')}</th></tr></thead>
              <tbody>{result.operations.map((operation) => <tr key={operation.id} className="border-t"><td className="p-2 font-medium">{copyFor(language, operationNames[operation.id][0], operationNames[operation.id][1], operationNames[operation.id][2])}</td><td className="p-2 font-mono">{operation.requiredHours.toFixed(1)}</td><td className="p-2 font-mono">{operation.scheduledDays.toFixed(1)}</td><td className="p-2 font-mono">{money(operation.ownedCostPerHa)}</td><td className="p-2 font-mono">{money(operation.customHirePerHa)}</td><td className="p-2 font-mono">{operation.breakEvenHours === null ? '—' : operation.breakEvenHours.toFixed(1)}</td></tr>)}</tbody>
            </table>
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/20 dark:text-amber-100">
              <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" />{tr('Planning guardrails', 'ضوابط التخطيط', 'Garde-fous de planification')}</p>
              {result.warnings.map((warning) => <p key={warning}>• {warning}</p>)}
            </div>
          )}
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
