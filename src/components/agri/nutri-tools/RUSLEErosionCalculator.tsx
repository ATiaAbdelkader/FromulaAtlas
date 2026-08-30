'use client';

import { useState, useMemo } from 'react';
import { Mountain, Copy, Check, RotateCcw, CheckCircle2, TrendingDown } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

// R factor lookup (approximate, by region)
const R_FACTORS: Record<string, number> = {
  'North Africa (Algeria/Tunisia)': 60,
  'West Africa': 100,
  'East Africa': 80,
  'Southern Africa': 50,
  'US Midwest': 150,
  'US Southeast': 350,
  'US Great Plains': 100,
  'Brazil (Cerrado)': 600,
  'India (monsoon)': 400,
  'Europe (north)': 50,
  'Europe (south)': 100,
  'Australia (east)': 100,
  'Middle East': 40,
  'Custom': 100,
};

// K factor by soil texture
const K_FACTORS: Record<string, number> = {
  'Sand': 0.05, 'Loamy sand': 0.12, 'Sandy loam': 0.20, 'Loam': 0.30,
  'Silt loam': 0.38, 'Silt': 0.42, 'Sandy clay loam': 0.25, 'Clay loam': 0.28,
  'Silty clay loam': 0.32, 'Sandy clay': 0.20, 'Silty clay': 0.28, 'Clay': 0.22,
};

// C factor by management
const C_FACTORS: Record<string, number> = {
  'Bare fallow': 1.0,
  'Conventional tillage (corn)': 0.35,
  'Conventional tillage (soybean)': 0.30,
  'No-till (corn, 30% residue)': 0.15,
  'No-till (soybean, 30% residue)': 0.10,
  'No-till (wheat, 60% residue)': 0.05,
  'Cover crop + no-till': 0.03,
  'Pasture/grassland': 0.01,
  'Forest': 0.001,
};

// P factor by practice
const P_FACTORS: Record<string, number> = {
  'Up-down slope': 1.0,
  'Contour (1-3% slope)': 0.5,
  'Contour (3-8% slope)': 0.6,
  'Contour (8-13% slope)': 0.8,
  'Contour + strip crop': 0.4,
  'Terraces': 0.3,
};

const TITLE: TrilingualString = {
  en: 'RUSLE Erosion Calculator',
  ar: 'حاسبة تآكل التربة RUSLE',
  fr: 'Calculateur d\'Érosion RUSLE',
};

const DESC: TrilingualString = {
  en: 'A = R × K × LS × C × P — universal soil loss equation · 14 regions · tolerance T = 5 t/ha/yr.',
  ar: 'أ = ر × ك × LS × ج × ب — معادلة فقدان التربة العالمية · 14 منطقة · الحد المسموح ر = 5 طن/هكتار/سنة.',
  fr: 'A = R × K × LS × C × P — équation universelle de perte de sol · 14 régions · tolérance T = 5 t/ha/an.',
};

export function RUSLEErosionCalculator() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [region, setRegion] = useState('North Africa (Algeria/Tunisia)');
  const [customR, setCustomR] = useState('100');
  const [soil, setSoil] = useState('Loam');
  const [slope, setSlope] = useState('5');
  const [slopeLength, setSlopeLength] = useState('60');
  const [management, setManagement] = useState('Conventional tillage (corn)');
  const [practice, setPractice] = useState('Up-down slope');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const R = region === 'Custom' ? parseFloat(customR) : (R_FACTORS[region] ?? 100);
    const K = K_FACTORS[soil] ?? 0.3;
    const s = parseFloat(slope), l = parseFloat(slopeLength);
    if (!Number.isFinite(s) || !Number.isFinite(l)) return null;

    // LS factor (RUSLE): β = 0.0896 - 0.0587×sin(arctan(S/100))
    // LS = (λ/22.13)^β × (10.8×sin(θ) + 0.03) for slopes <9%, simplified:
    const theta = Math.atan(s / 100);
    const beta = s < 9 ? 0.5 : 0.6;  // simplified
    const LS = Math.pow(l / 22.13, beta) * (10.8 * Math.sin(theta) + 0.03);

    const C = C_FACTORS[management] ?? 0.3;
    const P = P_FACTORS[practice] ?? 1.0;

    const A = R * K * LS * C * P;  // t/ha/yr
    const T = 5;  // tolerance (t/ha/yr) — varies by soil depth, use 5

    return { R, K, LS, C, P, A, T, sustainable: A <= T };
  }, [region, customR, soil, slope, slopeLength, management, practice]);

  const handleReset = () => {
    setRegion('North Africa (Algeria/Tunisia)');
    setCustomR('100');
    setSoil('Loam');
    setSlope('5');
    setSlopeLength('60');
    setManagement('Conventional tillage (corn)');
    setPractice('Up-down slope');
    toast({ title: tr('Reset', 'إعادة', 'Réinitialiser') });
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `=== RUSLE EROSION ===\nRegion: ${region} (R=${result.R})\nSoil: ${soil} (K=${result.K})\nSlope: ${slope}% / length ${slopeLength}m (LS=${result.LS.toFixed(2)})\nManagement: ${management} (C=${result.C})\nPractice: ${practice} (P=${result.P})\n\nAnnual soil loss A = ${result.A.toFixed(1)} t/ha/yr\nTolerance T = ${result.T} t/ha/yr\nStatus: ${result.sustainable ? 'Sustainable' : 'Over tolerance'}`.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: tr('Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <CalculatorShell
      icon={Mountain}
      title={TITLE}
      description={DESC}
      badge="USDA-NRCS"
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
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <Mountain className="h-4 w-4 text-amber-700" />
              {tr('Erosion Factors', 'عوامل التآكل', 'Facteurs d\'érosion')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Region select */}
            <div className="p-3 rounded-xl border bg-card space-y-1">
              <span className="text-xs font-bold text-foreground">{tr('Region (R factor)', 'المنطقة (عامل R)', 'Région (facteur R)')}</span>
              <select value={region} onChange={e => setRegion(e.target.value)} className="h-9 text-xs w-full rounded-md border border-input bg-background px-2">
                {Object.keys(R_FACTORS).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <div className="text-[10px] text-muted-foreground">{tr('Rainfall erosivity', 'تآكلية الأمطار', 'Érosivité pluie')}</div>
            </div>

            {/* Soil select */}
            <div className="p-3 rounded-xl border bg-card space-y-1">
              <span className="text-xs font-bold text-foreground">{tr('Soil texture (K factor)', 'قوام التربة (عامل K)', 'Texture sol (facteur K)')}</span>
              <select value={soil} onChange={e => setSoil(e.target.value)} className="h-9 text-xs w-full rounded-md border border-input bg-background px-2">
                {Object.keys(K_FACTORS).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="text-[10px] text-muted-foreground">{tr('Erodibility', 'قابلية التآكل', 'Érodibilité')}</div>
            </div>
          </div>

          {region === 'Custom' && (
            <CalculatorShell.InputField
              label={tr('Custom R factor (MJ·mm/ha/hr/yr)', 'عامل R مخصص (ميجاجول·مم/هكتار/ساعة/سنة)', 'Facteur R personnalisé (MJ·mm/ha/h/an)')}
              value={customR}
              onChange={setCustomR}
              step="1"
              helper={tr('Rainfall erosivity factor', 'عامل تآكلية الأمطار', 'Érosivité des pluies')}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CalculatorShell.InputField
              label={tr('Slope steepness (%)', 'انحدار المنحدر (%)', 'Pente (%)')}
              value={slope}
              onChange={setSlope}
              step="0.5"
              helper={tr('Percent rise', 'نسبة الارتفاع', 'Pourcentage de pente')}
            />
            <CalculatorShell.InputField
              label={tr('Slope length (m)', 'طول المنحدر (م)', 'Longueur de pente (m)')}
              value={slopeLength}
              onChange={setSlopeLength}
              step="5"
              helper={tr('Overland flow length', 'طول الجريان السطحي', 'Longueur ruissellement')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border bg-card space-y-1">
              <span className="text-xs font-bold text-foreground">{tr('Cover management (C factor)', 'إدارة الغطاء (عامل C)', 'Couverture (facteur C)')}</span>
              <select value={management} onChange={e => setManagement(e.target.value)} className="h-9 text-xs w-full rounded-md border border-input bg-background px-2">
                {Object.keys(C_FACTORS).map(m => <option key={m} value={m}>{m} (C={C_FACTORS[m]})</option>)}
              </select>
            </div>
            <div className="p-3 rounded-xl border bg-card space-y-1">
              <span className="text-xs font-bold text-foreground">{tr('Support practice (P factor)', 'الممارسة المساندة (عامل P)', 'Pratique support (facteur P)')}</span>
              <select value={practice} onChange={e => setPractice(e.target.value)} className="h-9 text-xs w-full rounded-md border border-input bg-background px-2">
                {Object.keys(P_FACTORS).map(p => <option key={p} value={p}>{p} (P={P_FACTORS[p]})</option>)}
              </select>
            </div>
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        {result && (
          <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
            <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-amber-50 via-transparent to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
              <span className="text-base font-bold flex items-center gap-2">
                ✨ {tr('Annual Soil Loss', 'فقدان التربة السنوي', 'Perte de sol annuelle')}
              </span>
              <span className={`font-mono text-xs font-bold border rounded-lg px-2 py-0.5 ${result.sustainable ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300'}`}>
                {result.A.toFixed(1)} t/ha/yr
              </span>
            </div>

            {/* Factor breakdown */}
            <div className="grid grid-cols-5 gap-1.5">
              <FactorChip label="R" value={result.R.toFixed(0)} />
              <FactorChip label="K" value={result.K.toFixed(2)} />
              <FactorChip label="LS" value={result.LS.toFixed(2)} />
              <FactorChip label="C" value={result.C.toFixed(2)} />
              <FactorChip label="P" value={result.P.toFixed(2)} />
            </div>

            <CalculatorShell.MetricTile
              label={tr('Annual Soil Loss', 'فقدان التربة السنوي', 'Perte de sol annuelle')}
              value={result.A.toFixed(1)}
              unit="t/ha/yr"
              color={result.sustainable ? 'emerald' : 'rose'}
              helper={tr(`Tolerance T = ${result.T} t/ha/yr · ${result.sustainable ? '✅ sustainable' : `⚠️ ${((result.A / result.T - 1) * 100).toFixed(0)}% over tolerance`}`, `الحد المسموح ر = ${result.T} طن/هكتار/سنة · ${result.sustainable ? '✅ ضمن الحد' : `⚠️ ${((result.A / result.T - 1) * 100).toFixed(0)}٪ فوق الحد`}`, `Tolérance T = ${result.T} t/ha/an · ${result.sustainable ? '✅ durable' : `⚠️ ${((result.A / result.T - 1) * 100).toFixed(0)}% au-dessus`}`)}
            />

            {result.sustainable ? (
              <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>{tr('Erosion is within tolerance.', 'التآكل ضمن الحد المسموح.', 'L\'érosion est dans la tolérance.')}</strong> {tr('Current management preserves topsoil. Maintain cover + practices.', 'الإدارة الحالية تحافظ على التربة السطحية. حافظ على الغطاء والممارسات.', 'Le maintien préserve le sol. Conserver couverture + pratiques.')}</span>
              </div>
            ) : (
              <div className="rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/20 p-2 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
                <TrendingDown className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>{tr('Reduce soil loss by:', 'قلل فقدان التربة بـ:', 'Réduisez la perte de sol par :')}</strong> {tr('switch to no-till (C drops 50-85%), add cover crop (C drops to 0.03), build terraces/contour (P drops to 0.3-0.6). Each reduces A proportionally.', 'التحول إلى الزراعة دون حراثة (C ينخفض 50-85٪)، إضافة محصول غطائي (C ينخفض إلى 0.03)، بناء مصاطب/كنتور (P ينخفض إلى 0.3-0.6). كل واحد يخفض أ نسبياً.', 'passage en semis direct (C baisse de 50-85%), couverture végétale (C à 0.03), terrasses/contour (P à 0.3-0.6). Chacun réduit A proportionnellement.')}</span>
              </div>
            )}
          </div>
        )}
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}

function FactorChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border bg-muted/20 px-1 py-1 text-center">
      <div className="text-[8px] text-muted-foreground">{label}</div>
      <div className="font-mono text-xs font-bold">{value}</div>
    </div>
  );
}
