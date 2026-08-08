'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Droplets, CheckCircle2, AlertTriangle } from 'lucide-react';

const MANURE_TYPES: Record<string, { name: string; n: number; p: number; k: number; dm: number }> = {
  dairy_solid: { name: 'Dairy solid', n: 10, p: 5, k: 10, dm: 25 },
  dairy_liquid: { name: 'Dairy liquid', n: 5, p: 2.5, k: 5, dm: 8 },
  beef_solid: { name: 'Beef solid', n: 11, p: 7, k: 12, dm: 25 },
  poultry: { name: 'Poultry layer', n: 30, p: 25, k: 15, dm: 45 },
  swine: { name: 'Swine liquid', n: 6, p: 3, k: 4, dm: 5 },
  composted: { name: 'Composted manure', n: 8, p: 6, k: 8, dm: 40 },
};

export function ManureManagementPlanner() {
  const [manureType, setManureType] = useState('dairy_solid');
  const [rate, setRate] = useState('40');
  const [area, setArea] = useState('10');
  const [incorporation, setIncorporation] = useState('immediate');
  const [slope, setSlope] = useState('3');
  const [nearestWater, setNearestWater] = useState('50');

  const result = useMemo(() => {
    const m = MANURE_TYPES[manureType];
    const r = parseFloat(rate), a = parseFloat(area), s = parseFloat(slope), nw = parseFloat(nearestWater);
    if (!Number.isFinite(r)) return null;
    // N availability: Year 1 depends on incorporation
    const nAvail: Record<string, number> = { immediate: 0.40, hours12: 0.30, days1: 0.20, days7: 0.10, none: 0.05 };
    const nY1 = r * m.n * (nAvail[incorporation] ?? 0.3);
    const pY1 = r * m.p * 0.6; // P availability Year 1
    const kY1 = r * m.k * 0.9; // K availability Year 1
    // Buffer requirement
    const minBuffer = s > 5 ? 30 : s > 2 ? 20 : 10;
    const bufferOK = nw >= minBuffer;
    return { m, nY1, pY1, kY1, totalN: r * m.n, totalP: r * m.p, totalK: r * m.k, minBuffer, bufferOK };
  }, [manureType, rate, area, incorporation, slope, nearestWater]);

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Droplets className="h-4 w-4 text-amber-600" /> Manure Management Planner</CardTitle><p className="text-[10px] text-muted-foreground">N-P-K value · application timing · buffer zone compliance</p></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-[10px]">Manure type</Label><select value={manureType} onChange={e => setManureType(e.target.value)} className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5">{Object.entries(MANURE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.name} (N:{v.n} P:{v.p} K:{v.k})</option>)}</select></div>
          <div><Label className="text-[10px]">Application rate (t/ha)</Label><Input value={rate} onChange={e => setRate(e.target.value)} type="number" step="5" className="h-8 text-xs mt-0.5" /></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><Label className="text-[10px]">Incorporation</Label><select value={incorporation} onChange={e => setIncorporation(e.target.value)} className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5"><option value="immediate">Immediate</option><option value="hours12">Within 12 hr</option><option value="days1">Within 1 day</option><option value="days7">Within 7 days</option><option value="none">Not incorporated</option></select></div>
          <div><Label className="text-[10px]">Slope (%)</Label><Input value={slope} onChange={e => setSlope(e.target.value)} type="number" step="0.5" className="h-8 text-xs mt-0.5" /></div>
          <div><Label className="text-[10px]">Nearest water (m)</Label><Input value={nearestWater} onChange={e => setNearestWater(e.target.value)} type="number" step="5" className="h-8 text-xs mt-0.5" /></div>
        </div>
        {result && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md border border-emerald-200 bg-emerald-50/40 p-2 text-center"><div className="text-[9px] text-muted-foreground uppercase">N (Yr 1)</div><div className="font-mono text-lg font-bold text-emerald-700">{result.nY1.toFixed(0)}</div><div className="text-[9px] text-muted-foreground">kg/ha</div></div>
              <div className="rounded-md border border-cyan-200 bg-cyan-50/40 p-2 text-center"><div className="text-[9px] text-muted-foreground uppercase">P (Yr 1)</div><div className="font-mono text-lg font-bold text-cyan-700">{result.pY1.toFixed(0)}</div><div className="text-[9px] text-muted-foreground">kg/ha</div></div>
              <div className="rounded-md border border-amber-200 bg-amber-50/40 p-2 text-center"><div className="text-[9px] text-muted-foreground uppercase">K (Yr 1)</div><div className="font-mono text-lg font-bold text-amber-700">{result.kY1.toFixed(0)}</div><div className="text-[9px] text-muted-foreground">kg/ha</div></div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded border p-2"><span className="text-muted-foreground">Total N applied:</span> <strong className="font-mono">{result.totalN.toFixed(0)} kg/ha</strong></div>
              <div className="rounded border p-2"><span className="text-muted-foreground">N availability:</span> <strong>{((result.nY1 / result.totalN) * 100).toFixed(0)}% Yr 1</strong></div>
            </div>
            {result.bufferOK ? (
              <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 p-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>Buffer zone compliant.</strong> {nearestWater}m to nearest waterway exceeds {result.minBuffer}m minimum.</span></div>
            ) : (
              <div className="rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50/60 p-2 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5"><AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>Buffer zone violation!</strong> Need {result.minBuffer}m minimum (you have {nearestWater}m). Do not apply — move setback or use buffer strip.</span></div>
            )}
            <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">💡 Incorporate within 12 hr to save 30% of N (ammonia volatilization). Don't exceed crop N needs — soil test first. Year 2 releases additional 20-30% of total N.</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
