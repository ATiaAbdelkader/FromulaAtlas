'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Droplets, CheckCircle2, AlertTriangle } from 'lucide-react';

export function WaterHarvestingCalculator() {
  const [roofArea, setRoofArea] = useState('100');
  const [annualRain, setAnnualRain] = useState('400');
  const [roofType, setRoofType] = useState('metal');
  const [demand, setDemand] = useState('100');
  const [cisternSize, setCisternSize] = useState('10');

  const result = useMemo(() => {
    const A = parseFloat(roofArea), R = parseFloat(annualRain), D = parseFloat(demand);
    const Cs = parseFloat(cisternSize);
    const coeff: Record<string, number> = { metal: 0.85, concrete: 0.80, tile: 0.75, thatch: 0.25 };
    const c = coeff[roofType] ?? 0.8;
    const annualSupply = A * R * 0.001 * c; // m³ (mm → m conversion)
    const dailySupply = annualSupply / 365;
    const annualDemand = D * 365 / 1000; // L/day → m³/year
    const coverage = annualDemand > 0 ? (annualSupply / annualDemand) * 100 : 0;
    const fillsPerYear = annualSupply / Cs;
    const enough = coverage >= 80;
    return { annualSupply, dailySupply, annualDemand, coverage, fillsPerYear, enough };
  }, [roofArea, annualRain, roofType, demand, cisternSize]);

  return (
    <Card className="overflow-hidden border-cyan-100 shadow-sm dark:border-cyan-900/60">
      <CardHeader className="border-b border-border/60 bg-cyan-50/50 pb-4 dark:bg-cyan-950/10"><CardTitle className="flex items-center gap-2 text-base"><span className="rounded-lg bg-cyan-100 p-2 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300"><Droplets className="h-4 w-4" /></span> Water Harvesting Calculator</CardTitle><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Rooftop rainwater collection · cistern sizing · demand coverage</p></CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 rounded-xl border border-cyan-200/70 bg-cyan-50/30 p-3 dark:border-cyan-900/60 dark:bg-cyan-950/10">
          <div><p className="text-xs font-semibold text-cyan-950 dark:text-cyan-100">Collection potential</p><p className="text-[11px] leading-relaxed text-muted-foreground">Start with the catchment surface and local rainfall, then account for the roof material.</p></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div><Label className="text-xs font-medium">Roof area (m²)</Label><Input aria-label="Roof area in square metres" value={roofArea} onChange={e => setRoofArea(e.target.value)} type="number" step="5" className="mt-1 h-10 text-sm" /></div>
            <div><Label className="text-xs font-medium">Annual rain (mm)</Label><Input aria-label="Annual rainfall in millimetres" value={annualRain} onChange={e => setAnnualRain(e.target.value)} type="number" step="10" className="mt-1 h-10 text-sm" /></div>
            <div><Label className="text-xs font-medium">Roof type</Label><select aria-label="Roof type" value={roofType} onChange={e => setRoofType(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="metal">Metal (0.85)</option><option value="concrete">Concrete (0.80)</option><option value="tile">Tile (0.75)</option><option value="thatch">Thatch (0.25)</option></select></div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 sm:grid-cols-2">
          <div><Label className="text-xs font-medium">Daily demand (L/day)</Label><Input aria-label="Daily water demand" value={demand} onChange={e => setDemand(e.target.value)} type="number" step="10" className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium">Cistern size (m³)</Label><Input aria-label="Cistern size in cubic metres" value={cisternSize} onChange={e => setCisternSize(e.target.value)} type="number" step="1" className="mt-1 h-10 text-sm" /></div>
        </div>
        {result && (
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-3 shadow-sm dark:border-cyan-900 dark:bg-cyan-950/20"><div className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">Annual supply</div><div className="mt-1 font-mono text-xl font-bold text-cyan-700 dark:text-cyan-300">{result.annualSupply.toFixed(1)}</div><div className="text-[10px] text-muted-foreground">m³/year</div></div>
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 shadow-sm dark:border-amber-900 dark:bg-amber-950/20"><div className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">Daily average</div><div className="mt-1 font-mono text-xl font-bold text-amber-700 dark:text-amber-300">{result.dailySupply.toFixed(0)}</div><div className="text-[10px] text-muted-foreground">L/day</div></div>
              <div className="rounded-xl border p-3 shadow-sm" style={{ borderColor: result.enough ? '#10b98160' : '#dc262660', backgroundColor: result.enough ? '#10b98110' : '#dc262610' }}><div className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">Demand coverage</div><div className="mt-1 font-mono text-xl font-bold" style={{ color: result.enough ? '#10b981' : '#dc2626' }}>{result.coverage.toFixed(0)}%</div><div className="text-[10px] text-muted-foreground">of annual demand</div></div>
            </div>
            {result.enough ? (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs leading-relaxed text-emerald-700 dark:border-emerald-900 dark:text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>System covers {(result.coverage).toFixed(0)}% of demand.</strong> Cistern fills {result.fillsPerYear.toFixed(1)}×/year — right-size for dry season storage.</span></div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-700 dark:border-amber-900 dark:text-amber-300"><AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>Covers only {(result.coverage).toFixed(0)}%.</strong> Increase roof area, reduce demand, or supplement with well water.</span></div>
            )}
            <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">💡 Install first-flush diverter (skips dirty first 0.5mm of rain). Use 200µm leaf filter. Cover cistern to prevent mosquito + evaporation.</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
