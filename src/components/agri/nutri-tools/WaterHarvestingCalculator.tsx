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
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Droplets className="h-4 w-4 text-cyan-600" /> Water Harvesting Calculator</CardTitle><p className="text-[10px] text-muted-foreground">Rooftop rainwater collection · cistern sizing · demand coverage</p></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div><Label className="text-[10px]">Roof area (m²)</Label><Input value={roofArea} onChange={e => setRoofArea(e.target.value)} type="number" step="5" className="h-8 text-xs mt-0.5" /></div>
          <div><Label className="text-[10px]">Annual rain (mm)</Label><Input value={annualRain} onChange={e => setAnnualRain(e.target.value)} type="number" step="10" className="h-8 text-xs mt-0.5" /></div>
          <div><Label className="text-[10px]">Roof type</Label><select value={roofType} onChange={e => setRoofType(e.target.value)} className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5"><option value="metal">Metal (0.85)</option><option value="concrete">Concrete (0.80)</option><option value="tile">Tile (0.75)</option><option value="thatch">Thatch (0.25)</option></select></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-[10px]">Daily demand (L/day)</Label><Input value={demand} onChange={e => setDemand(e.target.value)} type="number" step="10" className="h-8 text-xs mt-0.5" /></div>
          <div><Label className="text-[10px]">Cistern size (m³)</Label><Input value={cisternSize} onChange={e => setCisternSize(e.target.value)} type="number" step="1" className="h-8 text-xs mt-0.5" /></div>
        </div>
        {result && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md border border-cyan-200 bg-cyan-50/40 p-2 text-center"><div className="text-[9px] text-muted-foreground uppercase">Annual supply</div><div className="font-mono text-lg font-bold text-cyan-700">{result.annualSupply.toFixed(1)}</div><div className="text-[9px] text-muted-foreground">m³/year</div></div>
              <div className="rounded-md border border-amber-200 bg-amber-50/40 p-2 text-center"><div className="text-[9px] text-muted-foreground uppercase">Daily avg</div><div className="font-mono text-lg font-bold text-amber-700">{result.dailySupply.toFixed(0)}</div><div className="text-[9px] text-muted-foreground">L/day</div></div>
              <div className="rounded-md border p-2 text-center" style={{ borderColor: result.enough ? '#10b98160' : '#dc262660', backgroundColor: result.enough ? '#10b98110' : '#dc262610' }}><div className="text-[9px] text-muted-foreground uppercase">Coverage</div><div className="font-mono text-lg font-bold" style={{ color: result.enough ? '#10b981' : '#dc2626' }}>{result.coverage.toFixed(0)}%</div><div className="text-[9px] text-muted-foreground">of demand</div></div>
            </div>
            {result.enough ? (
              <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 p-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>System covers {(result.coverage).toFixed(0)}% of demand.</strong> Cistern fills {result.fillsPerYear.toFixed(1)}×/year — right-size for dry season storage.</span></div>
            ) : (
              <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 p-2 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5"><AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>Covers only {(result.coverage).toFixed(0)}%.</strong> Increase roof area, reduce demand, or supplement with well water.</span></div>
            )}
            <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">💡 Install first-flush diverter (skips dirty first 0.5mm of rain). Use 200µm leaf filter. Cover cistern to prevent mosquito + evaporation.</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
