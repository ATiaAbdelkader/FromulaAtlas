'use client';

import { useState, useMemo } from 'react';
import { Droplets, Copy, Check, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

const TITLE: TrilingualString = {
  en: 'Water Harvesting Calculator',
  ar: 'حاسبة حصاد المياه',
  fr: 'Calculateur de Récupération d\'Eau',
};
const DESC: TrilingualString = {
  en: 'Rooftop rainwater collection · cistern sizing · demand coverage',
  ar: 'جمع مياه الأمطار من الأسطح · تحديد حجم الخزان · تغطية الطلب',
  fr: 'Récupération pluviale · dimensionnement citerne · couverture besoin',
};

export function WaterHarvestingCalculator() {
  const { language, isRTL } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [roofArea, setRoofArea] = useState('100');
  const [annualRain, setAnnualRain] = useState('400');
  const [roofType, setRoofType] = useState('metal');
  const [demand, setDemand] = useState('100');
  const [cisternSize, setCisternSize] = useState('10');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const A = parseFloat(roofArea), R = parseFloat(annualRain), D = parseFloat(demand);
    const Cs = parseFloat(cisternSize);
    const coeff: Record<string, number> = { metal: 0.85, concrete: 0.80, tile: 0.75, thatch: 0.25 };
    const c = coeff[roofType] ?? 0.8;
    const annualSupply = A * R * 0.001 * c;
    const dailySupply = annualSupply / 365;
    const annualDemand = (D * 365) / 1000;
    const coverage = annualDemand > 0 ? (annualSupply / annualDemand) * 100 : 0;
    const fillsPerYear = annualSupply / Cs;
    const enough = coverage >= 80;
    return { annualSupply, dailySupply, annualDemand, coverage, fillsPerYear, enough };
  }, [roofArea, annualRain, roofType, demand, cisternSize]);

  const handleReset = () => {
    setRoofArea('100'); setAnnualRain('400'); setRoofType('metal'); setDemand('100'); setCisternSize('10');
    toast({ title: tr('Reset', 'إعادة', 'Réinitialiser') });
  };

  const handleCopy = () => {
    const text = `=== WATER HARVESTING ===\nRoof: ${roofArea} m² (${roofType})\nRain: ${annualRain} mm/yr\nDemand: ${demand} L/day\nCistern: ${cisternSize} m³\n\nSupply: ${result.annualSupply.toFixed(1)} m³/yr\nDaily: ${result.dailySupply.toFixed(0)} L/day\nCoverage: ${result.coverage.toFixed(0)}%\nFills: ${result.fillsPerYear.toFixed(1)}x/yr`.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: tr('Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <CalculatorShell
      icon={Droplets}
      title={TITLE}
      description={DESC}
      badge="FAO Standard"
      accent="sky"
      actions={[
        { icon: Copy, label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' }, onClick: handleCopy, variant: 'primary', showCheck: copied },
        { icon: RotateCcw, label: { en: 'Reset', ar: 'إعادة', fr: 'Réinitialiser' }, onClick: handleReset },
      ]}
      protocolNote={{
        en: 'Install first-flush diverter (skips dirty first 0.5mm of rain). Use 200µm leaf filter. Cover cistern to prevent mosquito + evaporation.',
        ar: 'ركّب محوّل التدفق الأول (لتجاوز أول 0.5 مم الملوثة من المطر). استخدم مرشح أوراق بحجم 200 ميكرومتر. غطِّ الخزان لمنع البعوض والتبخر.',
        fr: 'Installez un déverseur de premières eaux (évite les 0,5 mm initiaux). Filtre feuilles 200 µm. Couvrez la citerne.',
      }}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Droplets className="h-4 w-4 text-sky-600" />
            <span className="text-base font-bold">{tr('Catchment Parameters', 'مدخلات التجميع', 'Paramètres de captage')}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CalculatorShell.InputField label={tr('Roof area (m²)', 'مساحة السطح (م²)', 'Surface toit (m²)')} value={roofArea} onChange={setRoofArea} step="5" helper={tr('Collection surface', 'مساحة التجميع', 'Surface collectrice')} />
            <CalculatorShell.InputField label={tr('Annual rain (mm)', 'الأمطار السنوية (مم)', 'Pluie annuelle (mm)')} value={annualRain} onChange={setAnnualRain} step="10" helper={tr('Local rainfall data', 'بيانات الأمطار المحلية', 'Données pluviométriques')} />
            <div className="p-3 rounded-xl border bg-card space-y-1 sm:col-span-2">
              <span className="text-xs font-bold">{tr('Roof type', 'نوع السطح', 'Type de toit')}</span>
              <select value={roofType} onChange={(e) => setRoofType(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
                <option value="metal">{tr('Metal', 'معدني', 'Métal')} (0.85)</option>
                <option value="concrete">{tr('Concrete', 'خرسانة', 'Béton')} (0.80)</option>
                <option value="tile">{tr('Tile', 'قرميد', 'Tuile')} (0.75)</option>
                <option value="thatch">{tr('Thatch', 'قش', 'Chaume')} (0.25)</option>
              </select>
              <div className="text-[10px] text-muted-foreground">{tr('Runoff coefficient', 'معامل الجريان السطحي', 'Coefficient de ruissellement')}</div>
            </div>
            <CalculatorShell.InputField label={tr('Daily demand (L/day)', 'الطلب اليومي (لتر/يوم)', 'Demande quotidienne (L/j)')} value={demand} onChange={setDemand} step="10" helper={tr('Irrigation + livestock', 'الري + الماشية', 'Irrigation + élevage')} />
            <CalculatorShell.InputField label={tr('Cistern size (m³)', 'حجم الخزان (م³)', 'Citerne (m³)')} value={cisternSize} onChange={setCisternSize} step="1" helper={tr('Storage capacity', 'سعة التخزين', 'Capacité stockage')} />
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
          <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-sky-50 via-transparent to-blue-50/50 dark:from-sky-950/30 dark:to-blue-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
            <span className="text-base font-bold flex items-center gap-2">✨ {tr('Water Supply & Coverage', 'الإمداد وتغطية الطلب', 'Approvisionnement & couverture')}</span>
            <span className="font-mono text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 rounded-lg px-2 py-0.5">{result.coverage.toFixed(0)}%</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CalculatorShell.MetricTile label={tr('Annual Supply', 'الإمداد السنوي', 'Approvisionnement')} value={result.annualSupply.toFixed(1)} unit="m³/yr" color="sky" />
            <CalculatorShell.MetricTile label={tr('Daily Average', 'المتوسط اليومي', 'Moyenne quotidienne')} value={result.dailySupply.toFixed(0)} unit="L/day" color="amber" />
            <CalculatorShell.MetricTile label={tr('Demand Coverage', 'تغطية الطلب', 'Couverture')} value={`${result.coverage.toFixed(0)}%`} color={result.enough ? 'emerald' : 'rose'} />
            <CalculatorShell.MetricTile label={tr('Cistern Fills', 'مرات امتلاء الخزان', 'Remplissages')} value={result.fillsPerYear.toFixed(1)} unit="×/yr" color="teal" />
          </div>

          {result.enough ? (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span><strong>{tr(`System covers ${result.coverage.toFixed(0)}% of demand.`, `يغطي النظام ${result.coverage.toFixed(0)}% من الطلب.`)}</strong> {tr(`Cistern fills ${result.fillsPerYear.toFixed(1)}×/year — right-size for dry season storage.`, `يمتلئ الخزان ${result.fillsPerYear.toFixed(1)} مرة/سنة.`)}</span>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span><strong>{tr(`Covers only ${result.coverage.toFixed(0)}%.`, `يغطي ${result.coverage.toFixed(0)}% فقط.`)}</strong> {tr('Increase roof area, reduce demand, or supplement with well water.', 'زد مساحة السطح، أو خفّض الطلب، أو أكمل الإمداد بمياه البئر.', 'Augmentez la surface, réduisez la demande, ou complétez avec un puits.')}</span>
            </div>
          )}
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
