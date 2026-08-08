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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><CloudHail className="h-4 w-4 text-slate-500" /> Hail Damage Estimator</CardTitle>
        <p className="text-[10px] text-muted-foreground">Crop stage × hail size × defoliation → estimated yield loss</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div><Label className="text-[10px]">Crop</Label><select value={crop} onChange={e => setCrop(e.target.value)} className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5"><option value="corn">Corn</option><option value="soybean">Soybean</option><option value="wheat">Wheat</option></select></div>
          <div><Label className="text-[10px]">Stage</Label><select value={stage} onChange={e => setStage(e.target.value)} className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5"><option value="seedling">Seedling</option><option value="v6">V6 (vegetative)</option><option value="v10">V10</option><option value="tassel">Tasseling</option><option value="silking">Silking</option><option value="milk">Milk</option><option value="dough">Dough</option><option value="dent">Dent</option></select></div>
          <div><Label className="text-[10px]">Hail size (mm)</Label><Input value={hailSize} onChange={e => setHailSize(e.target.value)} type="number" step="5" className="h-8 text-xs mt-0.5" /></div>
        </div>
        <div><Label className="text-[10px]">Defoliation (%)</Label><Input value={defoliation} onChange={e => setDefoliation(e.target.value)} type="number" step="5" min="0" max="100" className="h-8 text-xs mt-0.5" /></div>
        {result && (
          <div className="space-y-2">
            <div className="rounded-lg border p-4 text-center" style={{ borderColor: result.totalLoss > 30 ? '#dc262660' : result.totalLoss > 10 ? '#f59e0b60' : '#10b98160', backgroundColor: result.totalLoss > 30 ? '#dc262610' : result.totalLoss > 10 ? '#f59e0b10' : '#10b98110' }}>
              <div className="text-[10px] text-muted-foreground uppercase">Estimated Yield Loss</div>
              <div className="text-3xl font-bold font-mono" style={{ color: result.totalLoss > 30 ? '#dc2626' : result.totalLoss > 10 ? '#f59e0b' : '#10b981' }}>{result.totalLoss.toFixed(0)}%</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded border p-2"><span className="text-muted-foreground">Defoliation loss:</span> <strong>{result.defolLoss.toFixed(0)}%</strong></div>
              <div className="rounded border p-2"><span className="text-muted-foreground">Stalk bruising:</span> <strong>{result.stalkLoss.toFixed(0)}%</strong></div>
            </div>
            {result.totalLoss > 30 ? (
              <div className="rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50/60 p-2 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5"><AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>Severe damage.</strong> Contact crop insurance within 72 hr. Document with photos. Consider replanting if &lt;30 days left in season.</span></div>
            ) : result.totalLoss > 10 ? (
              <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 p-2 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5"><AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>Moderate damage.</strong> Monitor recovery. Crop may compensate if enough growing season remains.</span></div>
            ) : (
              <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 p-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>Minimal damage.</strong> Crop should recover fully. Scout for secondary disease entry through bruised tissue.</span></div>
            )}
            <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">💡 Silking/flowering stage is most vulnerable. Early vegetative stages can recover from significant defoliation. Document damage within 72 hr for insurance claims.</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
