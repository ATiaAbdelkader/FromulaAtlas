'use client';

import { useState, useMemo } from 'react';
import {
  Tractor,
  Copy,
  RotateCcw,
} from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

// ---------------------------------------------------------------------------
// Trilingual content
// ---------------------------------------------------------------------------

const TITLE: TrilingualString = {
  en: 'Machinery Cost Calculator',
  ar: 'حاسبة تكلفة الآلات',
  fr: 'Calculateur de coût machine',
};

const DESCRIPTION: TrilingualString = {
  en: 'Ownership + operating cost → $/ha + $/hr · buy vs custom hire decision support.',
  ar: 'تكلفة التملك والتشغيل → $/هكتار + $/ساعة · الشراء مقابل الاستئجار.',
  fr: "Coût de possession + fonctionnement → $/ha + $/h · achat vs prestation.",
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'If custom hire < total $/ha, custom hire is cheaper. Minimum 200 hr/yr use to justify ownership. No-till cuts fuel 60–70%.',
  ar: 'إذا كان الاستئجار أقل من التكلفة لكل هكتار فهو أوفر. يلزم استخدام 200 ساعة/سنة على الأقل لتبرير التملك. تقلل الزراعة بدون حرث الوقود 60–70%.',
  fr: "Si la prestation < coût total $/ha, la prestation est plus avantageuse. 200 h/an minimum pour justifier la possession. Semis direct = −60 à 70 % de carburant.",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MachineryCostCalculator() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [purchasePrice, setPurchasePrice] = useState('80000');
  const [salvageValue, setSalvageValue] = useState('20000');
  const [usefulLife, setUsefulLife] = useState('10');
  const [annualHours, setAnnualHours] = useState('400');
  const [fuelPrice, setFuelPrice] = useState('1.20');
  const [fuelRate, setFuelRate] = useState('20');
  const [workRate, setWorkRate] = useState('1.5');
  const [interestRate, setInterestRate] = useState('6');
  const [copied, setCopied] = useState(false);

  // Calculation — UNCHANGED
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

  const handleReset = () => {
    setPurchasePrice('80000');
    setSalvageValue('20000');
    setUsefulLife('10');
    setAnnualHours('400');
    setFuelPrice('1.20');
    setFuelRate('20');
    setWorkRate('1.5');
    setInterestRate('6');
    toast({
      title: tr('Reset to Defaults', 'تمت استعادة القيم الافتراضية', 'Valeurs par défaut rétablies'),
    });
  };

  const handleCopySummary = () => {
    if (!result) return;
    const text = `=== MACHINERY COST ANALYSIS ===
Ownership:
  Purchase price: $${purchasePrice}
  Salvage value: $${salvageValue}
  Useful life: ${usefulLife} yr
  Interest rate: ${interestRate}%

Operating:
  Annual hours: ${annualHours} h
  Fuel: ${fuelPrice} $/L × ${fuelRate} L/hr
  Work rate: ${workRate} ha/hr

Cost Summary:
  Total cost / hectare: $${result.totalPerHa.toFixed(0)}/ha
  Total cost / hour:    $${result.totalPerHour.toFixed(0)}/hr
  Fixed ($/ha):   $${result.fixedPerHa.toFixed(0)}  (depreciation + interest + insurance)
  Variable ($/ha): $${result.variablePerHa.toFixed(0)}  (fuel + repair + labor)
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: tr('Summary Copied!', 'تم نسخ التقرير!', 'Résumé copié !'),
      description: tr('Machinery cost analysis copied to clipboard.', 'تم نسخ تحليل تكلفة الآلات إلى الحافظة.', 'Analyse copiée dans le presse-papiers.'),
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const actions = [
    {
      icon: Copy,
      label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' },
      onClick: handleCopySummary,
      variant: 'primary' as const,
      showCheck: copied,
    },
    {
      icon: RotateCcw,
      label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
      onClick: handleReset,
      variant: 'ghost' as const,
    },
  ];

  return (
    <CalculatorShell
      icon={Tractor}
      title={TITLE}
      description={DESCRIPTION}
      badge="Agricultural Eng."
      accent="amber"
      actions={actions}
      protocolNote={PROTOCOL_NOTE}
    >
      {/* ---------------- Inputs column ---------------- */}
      <CalculatorShell.Inputs>
        {/* Ownership assumptions */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            {tr('Ownership Assumptions', 'افتراضات التملك', 'Hypothèses de possession')}
          </p>
          <CalculatorShell.InputField
            label={tr('Purchase price ($)', 'سعر الشراء ($)', "Prix d'achat ($)")}
            value={purchasePrice}
            onChange={setPurchasePrice}
            step="1000"
            helper={tr('Initial acquisition cost', 'تكلفة الشراء الأولية', "Coût d'acquisition initial")}
          />
          <CalculatorShell.InputField
            label={tr('Salvage value ($)', 'قيمة الخردة ($)', 'Valeur résiduelle ($)')}
            value={salvageValue}
            onChange={setSalvageValue}
            step="1000"
            helper={tr('End-of-life residual', 'القيمة المتبقية في نهاية العمر', 'Valeur en fin de vie')}
          />
          <div className="grid grid-cols-2 gap-3">
            <CalculatorShell.InputField
              label={tr('Useful life (yr)', 'العمر الإنتاجي (سنة)', 'Durée de vie (an)')}
              value={usefulLife}
              onChange={setUsefulLife}
              step="1"
              helper={tr('Years of service', 'سنوات الخدمة', 'Années de service')}
            />
            <CalculatorShell.InputField
              label={tr('Interest rate (%)', 'نسبة الفائدة (%)', "Taux d'intérêt (%)")}
              value={interestRate}
              onChange={setInterestRate}
              step="0.5"
              helper={tr('Financing rate', 'نسبة التمويل', 'Taux de financement')}
            />
          </div>
        </div>

        {/* Operating assumptions */}
        <div className="space-y-3 pt-2 border-t">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            {tr('Operating Assumptions', 'افتراضات التشغيل', "Hypothèses d'exploitation")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <CalculatorShell.InputField
              label={tr('Annual hours', 'الساعات السنوية', 'Heures annuelles')}
              value={annualHours}
              onChange={setAnnualHours}
              step="10"
              helper={tr('Hours of use / year', 'ساعات التشغيل/السنة', 'Heures/an')}
            />
            <CalculatorShell.InputField
              label={tr('Fuel ($/L)', 'الوقود ($/لتر)', 'Carburant ($/L)')}
              value={fuelPrice}
              onChange={setFuelPrice}
              step="0.1"
              helper={tr('Diesel price', 'سعر الديزل', 'Prix du diesel')}
            />
            <CalculatorShell.InputField
              label={tr('Fuel (L/hr)', 'الوقود (لتر/ساعة)', 'Carburant (L/h)')}
              value={fuelRate}
              onChange={setFuelRate}
              step="1"
              helper={tr('Consumption rate', 'معدل الاستهلاك', 'Consommation')}
            />
            <CalculatorShell.InputField
              label={tr('Work (ha/hr)', 'العمل (هكتار/ساعة)', 'Travail (ha/h)')}
              value={workRate}
              onChange={setWorkRate}
              step="0.1"
              helper={tr('Field capacity', 'السعة الميدانية', 'Capacité au champ')}
            />
          </div>
        </div>
      </CalculatorShell.Inputs>

      {/* ---------------- Results column ---------------- */}
      <CalculatorShell.Results>
        {result && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CalculatorShell.MetricTile
                label={tr('Cost per Hectare', 'التكلفة لكل هكتار', 'Coût par hectare')}
                value={`$${result.totalPerHa.toFixed(0)}`}
                unit="/ha"
                color="amber"
              />
              <CalculatorShell.MetricTile
                label={tr('Cost per Hour', 'التكلفة لكل ساعة', 'Coût par heure')}
                value={`$${result.totalPerHour.toFixed(0)}`}
                unit="/hr"
                color="amber"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CalculatorShell.MetricTile
                label={tr('Fixed ($/ha)', 'الثابتة ($/هكتار)', 'Fixes ($/ha)')}
                value={`$${result.fixedPerHa.toFixed(0)}`}
                color="default"
                helper={tr('Depreciation + interest + insurance', 'الاستهلاك + الفائدة + التأمين', 'Amort. + intérêts + assurance')}
              />
              <CalculatorShell.MetricTile
                label={tr('Variable ($/ha)', 'المتغيرة ($/هكتار)', 'Variables ($/ha)')}
                value={`$${result.variablePerHa.toFixed(0)}`}
                color="default"
                helper={tr('Fuel + repair + labor', 'الوقود + الإصلاح + العمالة', 'Carburant + réparation + main-d’œuvre')}
              />
            </div>

            <CalculatorShell.MetricTile
              label={tr('Break-even Custom Hire Rate', 'سعر التعادل للاستئجار', 'Prix prestation seuil')}
              value={`$${result.totalPerHa.toFixed(0)}`}
              unit="/ha"
              color="emerald"
              helper={tr('Custom hire cheaper below this $/ha', 'الاستئجار أوفر أقل من هذا السعر', 'Prestation plus rentable en dessous')}
            />
          </>
        )}
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
