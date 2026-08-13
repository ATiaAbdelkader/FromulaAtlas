'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CloudHail, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function HailDamageEstimator() {
  const [crop, setCrop] = useState('corn');
  const [stage, setStage] = useState('v6');
  const [hailSize, setHailSize] = useState('20');
  const [defoliation, setDefoliation] = useState('30');

  // Simplified yield loss tables (USDA crop insurance)
  const result = useMemo(() => {
    const hs = parseFloat(hailSize), df = parseFloat(defoliation);
    if (!Number.isFinite(hs)) return null;
    // Base loss from defoliation by stage
    const stageFactor: Record<string, number> = { seedling: 0.2, v6: 0.3, v10: 0.5, tassel: 0.9, silking: 1.0, milk: 0.7, dough: 0.4, dent: 0.2 };
    const sf = stageFactor[stage] ?? 0.5;
    const defolLoss = df * sf * 0.01;
    // Additional loss from stalk/stem bruising by hail size
    const stalkLoss = hs > 30 ? 0.15 : hs > 20 ? 0.08 : hs > 10 ? 0.03 : 0;
    const totalLoss = Math.min(0.95, defolLoss + stalkLoss);
    return { totalLoss: totalLoss * 100, defolLoss: defolLoss * 100, stalkLoss: stalkLoss * 100 };
  }, [crop, stage, hailSize, defoliation]);

  return (
    <Card className="overflow-hidden border-slate-200/70 shadow-sm dark:border-slate-800">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 via-background to-blue-50/40 pb-4 dark:from-slate-950/30 dark:via-background dark:to-blue-950/20">
        <CardTitle className="flex items-center gap-2 text-base"><CloudHail className="h-4 w-4 text-slate-500" /> Hail Damage Estimator</CardTitle>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Crop stage × hail size × defoliation → estimated yield loss</p>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-3">
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Crop</Label><select value={crop} onChange={e => setCrop(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="corn">Corn</option><option value="soybean">Soybean</option><option value="wheat">Wheat</option></select></div>
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Stage</Label><select value={stage} onChange={e => setStage(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="seedling">Seedling</option><option value="v6">V6 (vegetative)</option><option value="v10">V10</option><option value="tassel">Tasseling</option><option value="silking">Silking</option><option value="milk">Milk</option><option value="dough">Dough</option><option value="dent">Dent</option></select></div>
          <div><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Hail size (mm)</Label><Input value={hailSize} onChange={e => setHailSize(e.target.value)} type="number" step="5" className="mt-1 h-10 text-sm" /></div>
        </div>
        <div className="rounded-xl border bg-muted/20 p-3"><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Defoliation (%)</Label><Input value={defoliation} onChange={e => setDefoliation(e.target.value)} type="number" step="5" min="0" max="100" className="mt-1 h-10 text-sm" /></div>
        {result && (
          <div className="space-y-4">
            <div className="rounded-xl border p-5 text-center shadow-sm" style={{ borderColor: result.totalLoss > 30 ? '#dc262660' : result.totalLoss > 10 ? '#f59e0b60' : '#10b98160', backgroundColor: result.totalLoss > 30 ? '#dc262610' : result.totalLoss > 10 ? '#f59e0b10' : '#10b98110' }}>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Estimated Yield Loss</div>
              <div className="mt-1 text-4xl font-bold font-mono" style={{ color: result.totalLoss > 30 ? '#dc2626' : result.totalLoss > 10 ? '#f59e0b' : '#10b981' }}>{result.totalLoss.toFixed(0)}%</div>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-xl border bg-background p-3"><span className="text-muted-foreground">Defoliation loss:</span> <strong>{result.defolLoss.toFixed(0)}%</strong></div>
              <div className="rounded-xl border bg-background p-3"><span className="text-muted-foreground">Stalk bruising:</span> <strong>{result.stalkLoss.toFixed(0)}%</strong></div>
            </div>
            {result.totalLoss > 30 ? (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-sm leading-relaxed text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300"><AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>Severe damage.</strong> Contact crop insurance within 72 hr. Document with photos. Consider replanting if &lt;30 days left in season.</span></div>
            ) : result.totalLoss > 10 ? (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm leading-relaxed text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300"><AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>Moderate damage.</strong> Monitor recovery. Crop may compensate if enough growing season remains.</span></div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-sm leading-relaxed text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>Minimal damage.</strong> Crop should recover fully. Scout for secondary disease entry through bruised tissue.</span></div>
            )}
            <div className="rounded-lg border border-dashed bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">💡 Silking/flowering stage is most vulnerable. Early vegetative stages can recover from significant defoliation. Document damage within 72 hr for insurance claims.</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
