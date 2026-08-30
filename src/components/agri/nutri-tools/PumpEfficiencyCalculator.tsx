'use client';

import { useState, useMemo } from 'react';
import { Gauge, Copy, Check, RotateCcw, AlertTriangle } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

const TITLE: TrilingualString = {
  en: 'Pump Efficiency Calculator',
  ar: 'حاسبة كفاءة المضخة',
  fr: 'Calculateur de Rendement de Pompe',
};
const DESC: TrilingualString = {
  en: 'Hydraulic power · motor kW · daily energy cost · $/m³ · efficiency rating',
  ar: 'القدرة الهيدروليكية · كيلوواط المحرك · تكلفة الطاقة اليومية · $/م³ · تقييم الكفاءة',
  fr: 'Puissance hydraulique · kW moteur · coût énergie · $/m³ · classement rendement',
};

export function PumpEfficiencyCalculator() {
  const { language, isRTL } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [flow, setFlow] = useState('20');
  const [head, setHead] = useState('35');
  const [efficiency, setEfficiency] = useState('65');
  const [electricityPrice, setElectricityPrice] = useState('0.12');
  const [hoursPerDay, setHoursPerDay] = useState('8');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const Q = parseFloat(flow), H = parseFloat(head), eta = parseFloat(efficiency) / 100;
    const Pe = parseFloat(electricityPrice), hp = parseFloat(hoursPerDay);
    if (!Number.isFinite(Q) || !Number.isFinite(H) || eta <= 0) return null;

    const hydraulicPower = (Q * H * 9.81) / 60;
    const shaftPower = hydraulicPower / eta;
    const motorPower = shaftPower / 0.9;
    const dailyEnergy = motorPower * hp;
    const dailyCost = dailyEnergy * Pe;
    const costPerM3 = dailyCost / (Q * hp);
    const efficiencyPercent = eta * 100;

    let rating: string, color: string;
    if (efficiencyPercent >= 70) { rating = tr('Good', 'جيد', 'Bon'); color = '#10b981'; }
    else if (efficiencyPercent >= 50) { rating = tr('Fair', 'مقبول', 'Moyen'); color = '#eab308'; }
    else { rating = tr('Poor — consider replacement', 'ضعيف — يُنصح بالاستبدال', 'Faible — remplacer'); color = '#dc2626'; }

    return { hydraulicPower, shaftPower, motorPower, dailyEnergy, dailyCost, costPerM3, rating, color, efficiencyPercent };
  }, [flow, head, efficiency, electricityPrice, hoursPerDay, language]);

  const handleReset = () => {
    setFlow('20'); setHead('35'); setEfficiency('65'); setElectricityPrice('0.12'); setHoursPerDay('8');
    toast({ title: tr('Reset', 'إعادة', 'Réinitialiser') });
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `=== PUMP EFFICIENCY ===\nFlow: ${flow} m³/h\nHead: ${head} m\nEfficiency: ${efficiency}%\nElectricity: $${electricityPrice}/kWh\nHours: ${hoursPerDay}/day\n\nHydraulic: ${result.hydraulicPower.toFixed(1)} kW\nMotor: ${result.motorPower.toFixed(1)} kW\nDaily energy: ${result.dailyEnergy.toFixed(1)} kWh\nDaily cost: $${result.dailyCost.toFixed(2)}\nCost/m³: $${result.costPerM3.toFixed(4)}\nRating: ${result.rating}`.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: tr('Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <CalculatorShell
      icon={Gauge}
      title={TITLE}
      description={DESC}
      accent="violet"
      actions={[
        { icon: Copy, label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' }, onClick: handleCopy, variant: 'primary', showCheck: copied },
        { icon: RotateCcw, label: { en: 'Reset', ar: 'إعادة', fr: 'Réinitialiser' }, onClick: handleReset },
      ]}
      protocolNote={{
        en: 'Replace pump if η < 50%. VFD (variable frequency drive) saves 20-40% energy in variable-flow systems. Check impeller wear annually.',
        ar: 'استبدل المضخة إذا كانت الكفاءة أقل من 50%. محرك الأقراص متغير التردد (VFD) يوفر 20-40% من الطاقة. افحص تآكل المروحة سنوياً.',
        fr: 'Remplacez la pompe si η < 50%. Un variateur (VFD) économise 20-40% d\'énergie. Vérifiez la roue annuellement.',
      }}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Gauge className="h-4 w-4 text-violet-600" />
            <span className="text-base font-bold">{tr('Pump Parameters', 'مدخلات المضخة', 'Paramètres de pompe')}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CalculatorShell.InputField label={tr('Flow rate (m³/h)', 'معدل التدفق (م³/س)', 'Débit (m³/h)')} value={flow} onChange={setFlow} step="1" helper={tr('Water flow', 'تدفق المياه', 'Débit d\'eau')} />
            <CalculatorShell.InputField label={tr('Total head (m)', 'الارتفاع الإجمالي (م)', 'Hauteur manométrique (m)')} value={head} onChange={setHead} step="1" helper={tr('Lift + friction', 'الرفع + الاحتكاك', 'Élévation + pertes')} />
            <CalculatorShell.InputField label={tr('Pump η (%)', 'كفاءة المضخة (%)', 'Rendement pompe (%)')} value={efficiency} onChange={setEfficiency} step="5" helper={tr('From nameplate', 'من اللوحة التعريفية', 'Plaque signalétique')} />
            <CalculatorShell.InputField label={tr('Electricity ($/kWh)', 'الكهرباء ($/ك.و.س)', 'Électricité ($/kWh)')} value={electricityPrice} onChange={setElectricityPrice} step="0.01" helper={tr('Local tariff', 'تعريفة محلية', 'Tarif local')} />
            <CalculatorShell.InputField label={tr('Hours/day', 'ساعات/يوم', 'Heures/jour')} value={hoursPerDay} onChange={setHoursPerDay} step="1" helper={tr('Daily runtime', 'وقت التشغيل اليومي', 'Durée quotidienne')} className="sm:col-span-2" />
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        {result && (
          <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
            <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-violet-50 via-transparent to-indigo-50/50 dark:from-violet-950/30 dark:to-indigo-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
              <span className="text-base font-bold flex items-center gap-2">✨ {tr('Power & Cost Analysis', 'تحليل القدرة والتكلفة', 'Analyse puissance & coût')}</span>
              <span className="font-mono text-xs font-bold bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border border-violet-300 rounded-lg px-2 py-0.5">{result.motorPower.toFixed(1)} kW</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CalculatorShell.MetricTile label={tr('Hydraulic Power', 'القدرة الهيدروليكية', 'Puissance hydraulique')} value={result.hydraulicPower.toFixed(1)} unit="kW" color="sky" />
              <CalculatorShell.MetricTile label={tr('Motor Power', 'قدرة المحرك', 'Puissance moteur')} value={result.motorPower.toFixed(1)} unit="kW" color="teal" />
              <CalculatorShell.MetricTile label={tr('Daily Energy', 'الطاقة اليومية', 'Énergie quotidienne')} value={result.dailyEnergy.toFixed(1)} unit="kWh" color="amber" />
              <CalculatorShell.MetricTile label={tr('Daily Cost', 'التكلفة اليومية', 'Coût quotidien')} value={`$${result.dailyCost.toFixed(2)}`} color="emerald" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border bg-card space-y-1">
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{tr('Cost per m³', 'التكلفة/م³', 'Coût/m³')}</div>
                <div className="text-xl font-black font-mono">${result.costPerM3.toFixed(4)}</div>
              </div>
              <div className="p-3 rounded-xl border space-y-1" style={{ borderColor: result.color + '60', backgroundColor: result.color + '10' }}>
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{tr('Efficiency Rating', 'تقييم الكفاءة', 'Classement')}</div>
                <div className="text-xl font-black font-mono" style={{ color: result.color }}>{result.rating}</div>
                <div className="text-[10px] text-muted-foreground">{result.efficiencyPercent.toFixed(0)}% η</div>
              </div>
            </div>

            {result.efficiencyPercent < 50 && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>{tr('Pump efficiency is below 50%.', 'كفاءة المضخة أقل من 50%.', 'Rendement < 50%.')}</strong> {tr('Consider replacement or VFD installation for 20-40% energy savings.', 'فكر في الاستبدال أو تركيب VFD لتوفير 20-40% من الطاقة.', 'Remplacement ou VFD recommandé.')}</span>
              </div>
            )}
          </div>
        )}
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
