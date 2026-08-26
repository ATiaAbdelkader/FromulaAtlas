'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Mountain, AlertTriangle, CheckCircle2, TrendingDown } from 'lucide-react';

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

export function RUSLEErosionCalculator() {
  const [region, setRegion] = useState('North Africa (Algeria/Tunisia)');
  const [customR, setCustomR] = useState('100');
  const [soil, setSoil] = useState('Loam');
  const [slope, setSlope] = useState('5');
  const [slopeLength, setSlopeLength] = useState('60');
  const [management, setManagement] = useState('Conventional tillage (corn)');
  const [practice, setPractice] = useState('Up-down slope');

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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Mountain className="h-4 w-4 text-amber-700" /> RUSLE Erosion Calculator
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">A = R × K × LS × C × P — universal soil loss equation · 14 regions · tolerance T=5 t/ha/yr</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">Region (R factor)</Label>
            <select value={region} onChange={e => setRegion(e.target.value)} className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5">
              {Object.keys(R_FACTORS).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-[10px]">Soil texture (K factor)</Label>
            <select value={soil} onChange={e => setSoil(e.target.value)} className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5">
              {Object.keys(K_FACTORS).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        {region === 'Custom' && (
          <div>
            <Label className="text-[10px]">Custom R factor (MJ·mm/ha/hr/yr)</Label>
            <Input value={customR} onChange={e => setCustomR(e.target.value)} type="number" className="h-8 text-xs mt-0.5" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">Slope steepness (%)</Label>
            <Input value={slope} onChange={e => setSlope(e.target.value)} type="number" step="0.5" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Slope length (m)</Label>
            <Input value={slopeLength} onChange={e => setSlopeLength(e.target.value)} type="number" step="5" className="h-8 text-xs mt-0.5" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">Cover management (C factor)</Label>
            <select value={management} onChange={e => setManagement(e.target.value)} className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5">
              {Object.keys(C_FACTORS).map(m => <option key={m} value={m}>{m} (C={C_FACTORS[m]})</option>)}
            </select>
          </div>
          <div>
            <Label className="text-[10px]">Support practice (P factor)</Label>
            <select value={practice} onChange={e => setPractice(e.target.value)} className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5">
              {Object.keys(P_FACTORS).map(p => <option key={p} value={p}>{p} (P={P_FACTORS[p]})</option>)}
            </select>
          </div>
        </div>

        {result && (
          <div className="space-y-2">
            {/* Factor breakdown */}
            <div className="grid grid-cols-5 gap-1 text-center">
              <FactorChip label="R" value={result.R.toFixed(0)} />
              <FactorChip label="K" value={result.K.toFixed(2)} />
              <FactorChip label="LS" value={result.LS.toFixed(2)} />
              <FactorChip label="C" value={result.C.toFixed(2)} />
              <FactorChip label="P" value={result.P.toFixed(2)} />
            </div>

            {/* Result */}
            <div className={`rounded-lg border p-3 text-center ${result.sustainable ? 'border-emerald-300 bg-emerald-50/40' : 'border-rose-300 bg-rose-50/40'}`}>
              <div className="text-[10px] text-muted-foreground uppercase">Annual Soil Loss</div>
              <div className={`text-3xl font-bold font-mono ${result.sustainable ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                {result.A.toFixed(1)} <span className="text-sm">t/ha/yr</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                Tolerance T = {result.T} t/ha/yr · {result.sustainable ? '✅ sustainable' : `⚠️ ${((result.A / result.T - 1) * 100).toFixed(0)}% over tolerance`}
              </div>
            </div>

            {result.sustainable ? (
              <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>Erosion is within tolerance.</strong> Current management preserves topsoil. Maintain cover + practices.</span>
              </div>
            ) : (
              <div className="rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/20 p-2 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
                <TrendingDown className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>Reduce soil loss by:</strong> switch to no-till (C drops 50-85%), add cover crop (C drops to 0.03), build terraces/contour (P drops to 0.3-0.6). Each reduces A proportionally.</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FactorChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border bg-muted/20 px-1 py-1">
      <div className="text-[8px] text-muted-foreground">{label}</div>
      <div className="font-mono text-xs font-bold">{value}</div>
    </div>
  );
}
