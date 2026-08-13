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
    <Card className="overflow-hidden border-cyan-200/60 shadow-sm dark:border-cyan-900/60">
      <CardHeader className="border-b bg-gradient-to-r from-cyan-50 via-background to-sky-50/50 pb-4 dark:from-cyan-950/30 dark:via-background dark:to-sky-950/20">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-cyan-600" /> Yield Estimation Calculator
        </CardTitle>
        <p className="text-xs leading-relaxed text-muted-foreground">Heads/m² × kernels/head × kernel weight → yield (t/ha) — 6 crops</p>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div>
          <Label className="text-xs font-medium">Crop</Label>
          <select aria-label="Crop" value={crop} onChange={e => { setCrop(e.target.value); setHeadsPerM2(''); setKernelsPerHead(''); setKernelWeight(''); }} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {Object.entries(CROPS).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <Label className="text-xs font-medium">Heads/m²</Label>
            <Input aria-label="Heads per square metre" value={headsPerM2 || cropInfo.defaultHeads} onChange={e => setHeadsPerM2(e.target.value)} type="number" step="10" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium">Kernels/head</Label>
            <Input aria-label="Kernels per head" value={kernelsPerHead || cropInfo.defaultKernels} onChange={e => setKernelsPerHead(e.target.value)} type="number" step="1" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium">Kernel wt (g)</Label>
            <Input aria-label="Kernel weight in grams" value={kernelWeight || cropInfo.kernelWeight} onChange={e => setKernelWeight(e.target.value)} type="number" step="0.005" className="mt-1 h-10 text-sm" />
          </div>
        </div>
        <div className="max-w-sm">
          <Label className="text-xs font-medium">Area (ha)</Label>
          <Input aria-label="Field area in hectares" value={area} onChange={e => setArea(e.target.value)} type="number" step="0.5" className="mt-1 h-10 text-sm" />
        </div>

        {result && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Metric label="Yield" value={`${result.yieldTPerHa.toFixed(2)}`} unit="t/ha" color="emerald" highlight />
              <Metric label="Total" value={`${result.totalYield.toFixed(1)}`} unit="t" color="cyan" />
              <Metric label="Kernels/m²" value={result.kernelsPerM2.toFixed(0)} unit="" color="amber" />
              <Metric label="Biomass" value={result.biomassPerM2.toFixed(0)} unit="g/m²" color="violet" />
            </div>

            <div className="rounded-xl border bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
              <Calculator className="h-3 w-3 inline mr-1" />
              Formula: {cropInfo.emoji} {cropInfo.name} = {result.yieldKgPerHa.toFixed(0)} kg/ha<br />
              = {headsPerM2 || cropInfo.defaultHeads} heads/m² × {kernelsPerHead || cropInfo.defaultKernels} kernels/head × {(kernelWeight || cropInfo.kernelWeight)} g × 10
            </div>

            <div className="rounded-xl border bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
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
    <div className={`rounded-xl border px-3 py-2.5 shadow-sm ${ACCENT[color]} ${highlight ? 'ring-2 ring-emerald-400/30' : ''}`}>
      <div className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={`font-mono font-semibold leading-tight ${highlight ? 'text-xl' : 'text-base'}`}>{value}</div>
      {unit && <div className="text-[9px] text-muted-foreground">{unit}</div>}
    </div>
  );
}
