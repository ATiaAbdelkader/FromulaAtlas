'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gauge, CheckCircle2, AlertTriangle } from 'lucide-react';

export function YieldMonitorCalibrator() {
  const [crop, setCrop] = useState('wheat');
  const [monitorWeight, setMonitorWeight] = useState('2500');
  const [actualWeight, setActualWeight] = useState('2400');
  const [monitorMoisture, setMonitorMoisture] = useState('14');
  const [standardMoisture, setStandardMoisture] = useState('13');
  const [testWeight, setTestWeight] = useState('75');

  const result = useMemo(() => {
    const mw = parseFloat(monitorWeight), aw = parseFloat(actualWeight);
    const mm = parseFloat(monitorMoisture), sm = parseFloat(standardMoisture);
    const tw = parseFloat(testWeight);
    if (!Number.isFinite(mw) || !Number.isFinite(aw)) return null;
    const cfMoisture = (100 - mm) / (100 - sm);
    const cfFlow = aw / mw;
    const correctedYield = mw * cfMoisture * cfFlow / 1000; // t/ha simplified
    const twStatus = crop === 'wheat' ? (tw >= 76 ? 'good' : tw >= 72 ? 'fair' : 'poor') : crop === 'corn' ? (tw >= 70 ? 'good' : tw >= 65 ? 'fair' : 'poor') : 'check';
    return { cfMoisture, cfFlow, correctedYield, twStatus };
  }, [crop, monitorWeight, actualWeight, monitorMoisture, standardMoisture, testWeight]);

  return (
    <Card className="overflow-hidden border-indigo-100 shadow-sm dark:border-indigo-900/60">
      <CardHeader className="border-b border-border/60 bg-indigo-50/50 pb-4 dark:bg-indigo-950/10"><CardTitle className="flex items-center gap-2 text-base"><span className="rounded-lg bg-indigo-100 p-2 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"><Gauge className="h-4 w-4" /></span> Yield Monitor Calibrator</CardTitle><p className="text-[10px] text-muted-foreground">Moisture correction · flow calibration · test weight assessment</p></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-indigo-200/70 bg-indigo-50/30 p-3 sm:grid-cols-2 dark:border-indigo-900/60 dark:bg-indigo-950/10">
          <div><Label className="text-xs font-medium">Crop</Label><select aria-label="Crop" value={crop} onChange={e => setCrop(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="wheat">Wheat 🌾</option><option value="corn">Corn 🌽</option><option value="soybean">Soybean 🫘</option><option value="barley">Barley 🌾</option></select></div>
          <div><Label className="text-xs font-medium">Test weight (kg/hL)</Label><Input aria-label="Test weight" value={testWeight} onChange={e => setTestWeight(e.target.value)} type="number" step="0.5" className="mt-1 h-10 text-sm" /></div>
        </div>
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 sm:grid-cols-2">
          <div><Label className="text-xs font-medium">Monitor weight (kg)</Label><Input aria-label="Monitor weight" value={monitorWeight} onChange={e => setMonitorWeight(e.target.value)} type="number" step="10" className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium">Actual weight (kg)</Label><Input aria-label="Actual measured weight" value={actualWeight} onChange={e => setActualWeight(e.target.value)} type="number" step="10" className="mt-1 h-10 text-sm" /></div>
        </div>
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 sm:grid-cols-2">
          <div><Label className="text-xs font-medium">Monitor moisture (%)</Label><Input aria-label="Monitor moisture percentage" value={monitorMoisture} onChange={e => setMonitorMoisture(e.target.value)} type="number" step="0.5" className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium">Standard moisture (%)</Label><Input aria-label="Standard moisture percentage" value={standardMoisture} onChange={e => setStandardMoisture(e.target.value)} type="number" step="0.5" className="mt-1 h-10 text-sm" /></div>
        </div>
        {result && (
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-xl border bg-background/70 p-3 text-center shadow-sm"><div className="text-[9px] text-muted-foreground uppercase">Moisture CF</div><div className="font-mono text-sm font-bold">{result.cfMoisture.toFixed(3)}</div></div>
              <div className="rounded-xl border bg-background/70 p-3 text-center shadow-sm"><div className="text-[9px] text-muted-foreground uppercase">Flow CF</div><div className="font-mono text-sm font-bold">{result.cfFlow.toFixed(3)}</div></div>
              <div className="rounded-xl border bg-background/70 p-3 text-center shadow-sm"><div className="text-[9px] text-muted-foreground uppercase">Test weight</div><div className={`font-mono text-sm font-bold ${result.twStatus === 'good' ? 'text-emerald-600' : result.twStatus === 'fair' ? 'text-amber-600' : 'text-rose-600'}`}>{result.twStatus}</div></div>
            </div>
            <div className={`rounded-xl border p-3 text-xs leading-relaxed flex items-start gap-2 ${Math.abs(result.cfFlow - 1) < 0.05 ? 'border-emerald-200 bg-emerald-50/60 text-emerald-700' : 'border-amber-200 bg-amber-50/60 text-amber-700'}`}>
              {Math.abs(result.cfFlow - 1) < 0.05 ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
              <span>{Math.abs(result.cfFlow - 1) < 0.05 ? <strong>Monitor is accurate (±5%).</strong> : <strong>Monitor is off by {((result.cfFlow - 1) * 100).toFixed(1)}%. Recalibrate with 6-8 loads spanning expected flow rates.</strong>}</span>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">💡 Calibrate per crop + moisture range. Low test weight indicates immature or damaged grain — may affect pricing.</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
