'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bug, CheckCircle2, AlertTriangle } from 'lucide-react';

export function BeeHiveHoneyCalculator() {
  const [hiveCount, setHiveCount] = useState('10');
  const [nectarFlow, setNectarFlow] = useState('2.5');
  const [flowDays, setFlowDays] = useState('30');
  const [sugarContent, setSugarContent] = useState('40');

  const result = useMemo(() => {
    const N = parseFloat(hiveCount), NF = parseFloat(nectarFlow), D = parseFloat(flowDays), SC = parseFloat(sugarContent) / 100;
    if (!Number.isFinite(N) || !Number.isFinite(NF)) return null;

    // Daily weight gain per hive = nectar flow (kg/day) × sugar content / 0.82 (honey sugar concentration)
    const dailyGain = NF * SC / 0.82;
    const totalNectar = NF * D * N;
    const totalHoney = dailyGain * D * N;
    const honeyPerHive = dailyGain * D;
    const revenue = totalHoney * 8; // $8/kg honey

    // Hive health indicators
    const goodFlow = NF >= 2.0;
    const enoughDays = D >= 21;

    return { dailyGain, totalNectar, totalHoney, honeyPerHive, revenue, goodFlow, enoughDays };
  }, [hiveCount, nectarFlow, flowDays, sugarContent]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bug className="h-4 w-4 text-amber-600" /> 🐝 Bee Hive + Honey Yield
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">Daily weight gain · nectar flow projection · honey yield + revenue</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">Number of hives</Label>
            <Input value={hiveCount} onChange={e => setHiveCount(e.target.value)} type="number" step="1" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Nectar flow (kg/hive/day)</Label>
            <Input value={nectarFlow} onChange={e => setNectarFlow(e.target.value)} type="number" step="0.1" className="h-8 text-xs mt-0.5" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">Flow duration (days)</Label>
            <Input value={flowDays} onChange={e => setFlowDays(e.target.value)} type="number" step="1" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Nectar sugar content (%)</Label>
            <Input value={sugarContent} onChange={e => setSugarContent(e.target.value)} type="number" step="1" className="h-8 text-xs mt-0.5" />
          </div>
        </div>
        {result && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Metric label="Daily gain/hive" value={`${result.dailyGain.toFixed(2)} kg`} color="amber" />
              <Metric label="Honey/hive" value={`${result.honeyPerHive.toFixed(1)} kg`} color="emerald" />
              <Metric label="Total honey" value={`${result.totalHoney.toFixed(0)} kg`} color="cyan" />
              <Metric label="Revenue" value={`$${result.revenue.toFixed(0)}`} color="violet" />
            </div>
            {result.goodFlow && result.enoughDays ? (
              <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 p-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>Strong nectar flow.</strong> Expect {result.honeyPerHive.toFixed(0)} kg/hive. Add supers as needed. Monitor for swarming.</span>
              </div>
            ) : (
              <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 p-2 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>Weak flow.</strong> {!result.goodFlow && 'Nectar flow below 2 kg/hive/day. '} {!result.enoughDays && 'Flow duration too short. '} Consider supplemental feeding.</span>
              </div>
            )}
            <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">
              💡 Monitor hive weight daily with scale. 1 kg gain = good flow. 0 kg = dearth — feed sugar syrup. Honey = nectar × sugar% / 82% (honey moisture ~18%).
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
function Metric({ label, value, color }: { label: string; value: string; color: keyof typeof ACCENT }) {
  return <div className={`rounded-md border px-2 py-1.5 ${ACCENT[color]}`}><div className="text-[9px] text-muted-foreground uppercase">{label}</div><div className="font-mono text-sm font-semibold">{value}</div></div>;
}
