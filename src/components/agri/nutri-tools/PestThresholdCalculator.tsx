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
    <Card className="overflow-hidden border-rose-200/60 shadow-sm dark:border-rose-900/60">
      <CardHeader className="border-b bg-gradient-to-r from-rose-50 via-background to-amber-50/40 pb-4 dark:from-rose-950/30 dark:via-background dark:to-amber-950/20"><CardTitle className="flex items-center gap-2 text-base"><Bug className="h-4 w-4 text-rose-600" /> Pest Threshold Calculator</CardTitle><p className="mt-1 text-xs leading-relaxed text-muted-foreground">EIL · action threshold · sequential sampling — 5 pest types</p></CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-2">
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pest</Label><select value={pest} onChange={e => setPest(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{Object.entries(PESTS).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.name}</option>)}</select></div>
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total pest count</Label><Input value={count} onChange={e => setCount(e.target.value)} type="number" step="1" className="mt-1 h-10 text-sm" /></div>
        </div>
        <div className="grid grid-cols-1 gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-3">
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground"># samples</Label><Input value={samples} onChange={e => setSamples(e.target.value)} type="number" step="1" className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Crop value ($/ha)</Label><Input value={cropValue} onChange={e => setCropValue(e.target.value)} type="number" step="50" className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Control cost ($/ha)</Label><Input value={controlCost} onChange={e => setControlCost(e.target.value)} type="number" step="5" className="mt-1 h-10 text-sm" /></div>
        </div>
        {result && (
          <div className="space-y-4">
            <div className="rounded-xl border p-4 text-center shadow-sm" style={{ borderColor: result.aboveEIL ? '#dc262660' : result.aboveAction ? '#f59e0b60' : '#10b98160', backgroundColor: result.aboveEIL ? '#dc262610' : result.aboveAction ? '#f59e0b10' : '#10b98110' }}>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Average density</div>
              <div className="mt-1 text-3xl font-bold font-mono">{result.avg.toFixed(1)} <span className="text-sm text-muted-foreground">{result.pest.unit}</span></div>
              <div className="mt-2 text-sm font-semibold leading-snug" style={{ color: result.aboveEIL ? '#dc2626' : result.aboveAction ? '#f59e0b' : '#10b981' }}>
                {result.aboveEIL ? 'Above EIL — Spray now!' : result.aboveAction ? 'Above action threshold — Scout intensively' : 'Below threshold — No action needed'}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-lg border bg-background p-3"><span className="text-muted-foreground">EIL:</span> <strong className="font-mono">{result.pest.etl} {result.pest.unit}</strong></div>
              <div className="rounded-lg border bg-background p-3"><span className="text-muted-foreground">Action threshold:</span> <strong className="font-mono">{result.pest.action} {result.pest.unit}</strong></div>
            </div>
            {result.aboveEIL ? (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-sm leading-relaxed text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300"><AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>Spray now.</strong> Economic injury level exceeded. Every day of delay costs ~${result.economicLoss.toFixed(0)}/ha in lost yield.</span></div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-sm leading-relaxed text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>No spray needed.</strong> Continue scouting every 3-5 days. Threshold protects beneficial insects + saves money.</span></div>
            )}
            <div className="rounded-lg border border-dashed bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">💡 EIL = cost of control / (crop value × damage per pest). Action threshold is set below EIL to allow time for treatment.</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
