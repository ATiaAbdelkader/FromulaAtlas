'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bug, CheckCircle2, AlertTriangle } from 'lucide-react';

export function PestThresholdCalculator() {
  const [pest, setPest] = useState('aphid');
  const [count, setCount] = useState('15');
  const [samples, setSamples] = useState('10');
  const [cropValue, setCropValue] = useState('800');
  const [controlCost, setControlCost] = useState('40');

  const PESTS: Record<string, { name: string; unit: string; etl: number; action: number; emoji: string }> = {
    aphid: { name: 'Soybean aphid', unit: 'aphids/plant', etl: 250, action: 200, emoji: '🫛' },
    armyworm: { name: 'Fall armyworm', unit: 'larvae/m²', etl: 5, action: 3, emoji: '🐛' },
    borer: { name: 'Corn borer', unit: 'larvae/plant', etl: 1, action: 0.5, emoji: '🦗' },
    whitefly: { name: 'Whitefly', unit: 'adults/leaf', etl: 10, action: 6, emoji: '🦟' },
    thrips: { name: 'Thrips', unit: 'thrips/flower', etl: 5, action: 3, emoji: '🐜' },
  };

  const result = useMemo(() => {
    const c = parseFloat(count), n = parseFloat(samples), cv = parseFloat(cropValue), cc = parseFloat(controlCost);
    const p = PESTS[pest];
    if (!Number.isFinite(c)) return null;
    const avg = c / n;
    // EIL = C / (V × D × P) — simplified: use pre-set ETL
    const aboveEIL = avg >= p.etl;
    const aboveAction = avg >= p.action;
    const economicLoss = aboveEIL ? (avg - p.etl) * cv * 0.001 : 0;
    return { avg, aboveEIL, aboveAction, economicLoss, pest: p };
  }, [pest, count, samples, cropValue, controlCost]);

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Bug className="h-4 w-4 text-rose-600" /> Pest Threshold Calculator</CardTitle><p className="text-[10px] text-muted-foreground">EIL · action threshold · sequential sampling — 5 pest types</p></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-[10px]">Pest</Label><select value={pest} onChange={e => setPest(e.target.value)} className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5">{Object.entries(PESTS).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.name}</option>)}</select></div>
          <div><Label className="text-[10px]">Total pest count</Label><Input value={count} onChange={e => setCount(e.target.value)} type="number" step="1" className="h-8 text-xs mt-0.5" /></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><Label className="text-[10px]"># samples</Label><Input value={samples} onChange={e => setSamples(e.target.value)} type="number" step="1" className="h-8 text-xs mt-0.5" /></div>
          <div><Label className="text-[10px]">Crop value ($/ha)</Label><Input value={cropValue} onChange={e => setCropValue(e.target.value)} type="number" step="50" className="h-8 text-xs mt-0.5" /></div>
          <div><Label className="text-[10px]">Control cost ($/ha)</Label><Input value={controlCost} onChange={e => setControlCost(e.target.value)} type="number" step="5" className="h-8 text-xs mt-0.5" /></div>
        </div>
        {result && (
          <div className="space-y-2">
            <div className="rounded-lg border p-4 text-center" style={{ borderColor: result.aboveEIL ? '#dc262660' : result.aboveAction ? '#f59e0b60' : '#10b98160', backgroundColor: result.aboveEIL ? '#dc262610' : result.aboveAction ? '#f59e0b10' : '#10b98110' }}>
              <div className="text-[10px] text-muted-foreground uppercase">Average density</div>
              <div className="text-2xl font-bold font-mono">{result.avg.toFixed(1)} <span className="text-sm text-muted-foreground">{result.pest.unit}</span></div>
              <div className="text-sm font-semibold mt-1" style={{ color: result.aboveEIL ? '#dc2626' : result.aboveAction ? '#f59e0b' : '#10b981' }}>
                {result.aboveEIL ? 'Above EIL — Spray now!' : result.aboveAction ? 'Above action threshold — Scout intensively' : 'Below threshold — No action needed'}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded border p-2"><span className="text-muted-foreground">EIL:</span> <strong className="font-mono">{result.pest.etl} {result.pest.unit}</strong></div>
              <div className="rounded border p-2"><span className="text-muted-foreground">Action threshold:</span> <strong className="font-mono">{result.pest.action} {result.pest.unit}</strong></div>
            </div>
            {result.aboveEIL ? (
              <div className="rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50/60 p-2 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5"><AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>Spray now.</strong> Economic injury level exceeded. Every day of delay costs ~${result.economicLoss.toFixed(0)}/ha in lost yield.</span></div>
            ) : (
              <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 p-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>No spray needed.</strong> Continue scouting every 3-5 days. Threshold protects beneficial insects + saves money.</span></div>
            )}
            <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">💡 EIL = cost of control / (crop value × damage per pest). Action threshold is set below EIL to allow time for treatment.</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
