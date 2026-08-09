'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calculator } from 'lucide-react';

const CROPS: Record<string, { name: string; emoji: string; kernelWeight: number; defaultHeads: number; defaultKernels: number }> = {
  wheat: { name: 'Wheat', emoji: '🌾', kernelWeight: 0.04, defaultHeads: 500, defaultKernels: 35 },
  barley: { name: 'Barley', emoji: '🌾', kernelWeight: 0.045, defaultHeads: 450, defaultKernels: 30 },
  corn: { name: 'Corn (maize)', emoji: '🌽', kernelWeight: 0.30, defaultHeads: 8, defaultKernels: 500 },
  rice: { name: 'Rice', emoji: '🍚', kernelWeight: 0.025, defaultHeads: 400, defaultKernels: 80 },
  sorghum: { name: 'Sorghum', emoji: '🌾', kernelWeight: 0.03, defaultHeads: 300, defaultKernels: 1200 },
  oats: { name: 'Oats', emoji: '🌾', kernelWeight: 0.035, defaultHeads: 400, defaultKernels: 40 },
};

export function YieldEstimationCalculator() {
  const [crop, setCrop] = useState('wheat');
  const [headsPerM2, setHeadsPerM2] = useState('');
  const [kernelsPerHead, setKernelsPerHead] = useState('');
  const [kernelWeight, setKernelWeight] = useState('');
  const [area, setArea] = useState('1');

  const cropInfo = CROPS[crop];

  const result = useMemo(() => {
    const h = parseFloat(headsPerM2) || cropInfo.defaultHeads;
    const k = parseFloat(kernelsPerHead) || cropInfo.defaultKernels;
    const w = parseFloat(kernelWeight) || cropInfo.kernelWeight;
    const a = parseFloat(area) || 1;

    // Yield (kg/ha) = heads/m² × kernels/head × kernel weight (g) × 10 (conversion m²→ha, g→kg)
    const yieldKgPerHa = h * k * w * 10;
    const yieldTPerHa = yieldKgPerHa / 1000;
    const totalYield = yieldTPerHa * a;

    // Components
    const kernelsPerM2 = h * k;
    const biomassPerM2 = kernelsPerM2 * w; // g/m²

    return { yieldKgPerHa, yieldTPerHa, totalYield, kernelsPerM2, biomassPerM2 };
  }, [crop, headsPerM2, kernelsPerHead, kernelWeight, area, cropInfo]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-cyan-600" /> Yield Estimation Calculator
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">Heads/m² × kernels/head × kernel weight → yield (t/ha) — 6 crops</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-[10px]">Crop</Label>
          <select value={crop} onChange={e => { setCrop(e.target.value); setHeadsPerM2(''); setKernelsPerHead(''); setKernelWeight(''); }} className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5">
            {Object.entries(CROPS).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-[10px]">Heads/m²</Label>
            <Input value={headsPerM2 || cropInfo.defaultHeads} onChange={e => setHeadsPerM2(e.target.value)} type="number" step="10" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Kernels/head</Label>
            <Input value={kernelsPerHead || cropInfo.defaultKernels} onChange={e => setKernelsPerHead(e.target.value)} type="number" step="1" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Kernel wt (g)</Label>
            <Input value={kernelWeight || cropInfo.kernelWeight} onChange={e => setKernelWeight(e.target.value)} type="number" step="0.005" className="h-8 text-xs mt-0.5" />
          </div>
        </div>
        <div>
          <Label className="text-[10px]">Area (ha)</Label>
          <Input value={area} onChange={e => setArea(e.target.value)} type="number" step="0.5" className="h-8 text-xs mt-0.5" />
        </div>

        {result && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Metric label="Yield" value={`${result.yieldTPerHa.toFixed(2)}`} unit="t/ha" color="emerald" highlight />
              <Metric label="Total" value={`${result.totalYield.toFixed(1)}`} unit="t" color="cyan" />
              <Metric label="Kernels/m²" value={result.kernelsPerM2.toFixed(0)} unit="" color="amber" />
              <Metric label="Biomass" value={result.biomassPerM2.toFixed(0)} unit="g/m²" color="violet" />
            </div>

            <div className="rounded-md border bg-muted/20 p-2 text-[10px] text-muted-foreground">
              <Calculator className="h-3 w-3 inline mr-1" />
              Formula: {cropInfo.emoji} {cropInfo.name} = {result.yieldKgPerHa.toFixed(0)} kg/ha<br />
              = {headsPerM2 || cropInfo.defaultHeads} heads/m² × {kernelsPerHead || cropInfo.defaultKernels} kernels/head × {(kernelWeight || cropInfo.kernelWeight)} g × 10
            </div>

            <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">
              💡 Count heads in 1 m² (use 1×1m quadrat), sample 10 heads for kernel count, weigh 100 kernels (÷100 for per-kernel weight). Reference: Global Wheat Head Detection dataset (188,500 labeled wheat heads across 12 countries).
            </div>
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
  violet: 'border-violet-200 dark:border-violet-900 bg-violet-50/40 dark:bg-violet-950/20',
};

function Metric({ label, value, unit, color, highlight }: { label: string; value: string; unit: string; color: keyof typeof ACCENT; highlight?: boolean }) {
  return (
    <div className={`rounded-md border px-2 py-1.5 ${ACCENT[color]} ${highlight ? 'ring-2 ring-emerald-400/30' : ''}`}>
      <div className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={`font-mono font-semibold leading-tight ${highlight ? 'text-lg' : 'text-sm'}`}>{value}</div>
      {unit && <div className="text-[9px] text-muted-foreground">{unit}</div>}
    </div>
  );
}
