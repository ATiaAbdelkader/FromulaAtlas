'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Beef, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  BROILER_BENCHMARKS, PIG_BENCHMARKS, CATTLE_BUTTERFAT_BENCHMARKS,
} from '@/lib/agri-ref-data';

type Animal = 'broiler' | 'pig' | 'cattle';

export function LivestockGrowthBenchmark() {
  const [animal, setAnimal] = useState<Animal>('broiler');
  // Broiler inputs
  const [broilerAge, setBroilerAge] = useState('150');
  const [broilerWeight, setBroilerWeight] = useState('2200');
  // Pig inputs
  const [pigWeight, setPigWeight] = useState('180');
  const [pigDays, setPigDays] = useState('90');
  // Cattle inputs
  const [cattleBreed, setCattleBreed] = useState('Holstein');
  const [cattleBf, setCattleBf] = useState('3.6');

  const broilerResult = useMemo(() => {
    const age = parseInt(broilerAge);
    const w = parseFloat(broilerWeight);
    const bench = BROILER_BENCHMARKS.find(b => b.age >= age) || BROILER_BENCHMARKS[BROILER_BENCHMARKS.length - 1];
    const target = bench.targetBW;
    const diff = w - target;
    const pct = (w / target) * 100;
    return { bench, target, diff, pct };
  }, [broilerAge, broilerWeight]);

  const pigResult = useMemo(() => {
    const w = parseFloat(pigWeight);
    const d = parseInt(pigDays);
    const avgAdg = PIG_BENCHMARKS.reduce((s, p) => s + p.adg, 0) / PIG_BENCHMARKS.length;
    const avgFcr = PIG_BENCHMARKS.reduce((s, p) => s + p.fcr, 0) / PIG_BENCHMARKS.length;
    const expectedWeight = 48 + (d / 100) * avgAdg * 10;
    const diff = w - expectedWeight;
    return { avgAdg, avgFcr, expectedWeight, diff };
  }, [pigWeight, pigDays]);

  const cattleResult = useMemo(() => {
    const bf = parseFloat(cattleBf);
    const benchmarks = CATTLE_BUTTERFAT_BENCHMARKS.filter(c => c.breed === cattleBreed && c.age === 'Mature');
    const avgBf = benchmarks.length > 0 ? benchmarks[0].butterfat : 3.7;
    const diff = bf - avgBf;
    return { avgBf, diff, benchmarks };
  }, [cattleBreed, cattleBf]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Beef className="h-4 w-4 text-amber-600" /> Livestock Growth Benchmarks
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">Real trial data from agridatasets-py (gpk R package) · broiler + pig + cattle</p>
        <div className="flex gap-1 mt-2">
          {(['broiler', 'pig', 'cattle'] as Animal[]).map(a => (
            <button key={a} onClick={() => setAnimal(a)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${animal === a ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300' : 'text-muted-foreground hover:bg-muted/50'}`}>
              {a === 'broiler' ? '🐔' : a === 'pig' ? '🐷' : '🐄'} {a.charAt(0).toUpperCase() + a.slice(1)}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {animal === 'broiler' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-[10px]">Age (days)</Label><Input value={broilerAge} onChange={e => setBroilerAge(e.target.value)} type="number" step="1" className="h-8 text-xs mt-0.5" /></div>
              <div><Label className="text-[10px]">Body weight (g)</Label><Input value={broilerWeight} onChange={e => setBroilerWeight(e.target.value)} type="number" step="10" className="h-8 text-xs mt-0.5" /></div>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: broilerResult.pct >= 95 ? '#10b98160' : broilerResult.pct >= 85 ? '#eab30860' : '#dc262660', backgroundColor: broilerResult.pct >= 95 ? '#10b98110' : broilerResult.pct >= 85 ? '#eab30810' : '#dc262610' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-muted-foreground uppercase">Benchmark at day {broilerResult.bench.age}</span>
                <Badge variant="outline" className="text-[9px]">{broilerResult.pct.toFixed(0)}% of target</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><div className="text-[9px] text-muted-foreground uppercase">Your bird</div><div className="font-mono text-lg font-bold">{broilerWeight}g</div></div>
                <div><div className="text-[9px] text-muted-foreground uppercase">Target</div><div className="font-mono text-lg font-bold text-amber-600">{broilerResult.target}g</div></div>
                <div><div className="text-[9px] text-muted-foreground uppercase">Difference</div><div className={`font-mono text-lg font-bold ${broilerResult.diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{broilerResult.diff >= 0 ? '+' : ''}{broilerResult.diff.toFixed(0)}g</div></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded border p-2"><span className="text-muted-foreground">Benchmark ADFI:</span> <strong className="font-mono">{broilerResult.bench.adfi} g/day</strong></div>
              <div className="rounded border p-2"><span className="text-muted-foreground">Benchmark ADG:</span> <strong className="font-mono">{broilerResult.bench.adg} g/day</strong></div>
            </div>
            {broilerResult.pct < 85 ? (
              <div className="rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/20 p-2 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5"><AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>Below target ({broilerResult.pct.toFixed(0)}%).</strong> Check: feed protein (should be 20-23% CP), temperature (21-23°C), stocking density (&lt;33 kg/m²), disease (coccidiosis, ND).</span></div>
            ) : broilerResult.pct < 95 ? (
              <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-2 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5"><AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>Slightly below target.</strong> Monitor feed intake + adjust lighting program (18hr light improves feed intake).</span></div>
            ) : (
              <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>On target or above.</strong> Growth performance excellent. Monitor for leg issues if growing too fast.</span></div>
            )}
            <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">💡 Source: gpk R package broiler growth trial data (9 age points, days 143-171).</div>
          </div>
        )}

        {animal === 'pig' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-[10px]">Current weight (kg)</Label><Input value={pigWeight} onChange={e => setPigWeight(e.target.value)} type="number" step="1" className="h-8 text-xs mt-0.5" /></div>
              <div><Label className="text-[10px]">Days on feed</Label><Input value={pigDays} onChange={e => setPigDays(e.target.value)} type="number" step="1" className="h-8 text-xs mt-0.5" /></div>
            </div>
            <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/40 p-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><div className="text-[9px] text-muted-foreground uppercase">Expected weight</div><div className="font-mono text-lg font-bold">{pigResult.expectedWeight.toFixed(0)} kg</div></div>
                <div><div className="text-[9px] text-muted-foreground uppercase">Benchmark ADG</div><div className="font-mono text-lg font-bold text-amber-600">{pigResult.avgAdg.toFixed(1)} kg</div></div>
                <div><div className="text-[9px] text-muted-foreground uppercase">Benchmark FCR</div><div className="font-mono text-lg font-bold text-amber-600">{pigResult.avgFcr.toFixed(2)}</div></div>
              </div>
            </div>
            <div className={`rounded-md border p-2 text-xs flex items-start gap-1.5 ${pigResult.diff >= 0 ? 'border-emerald-200 bg-emerald-50/60 text-emerald-700' : 'border-amber-200 bg-amber-50/60 text-amber-700'}`}>
              {pigResult.diff >= 0 ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
              <span>{pigResult.diff >= 0 ? `Above benchmark by ${pigResult.diff.toFixed(1)} kg — excellent growth.` : `${Math.abs(pigResult.diff).toFixed(1)} kg below expected. Check: feed energy (should be 13-14 MJ DE/kg), protein (16-18% CP), health (mycoplasma, APP), temperature (18-22°C).`}</span>
            </div>
            <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">💡 Source: gpk R package pig trial (Treatment A vs B, M+F, initial ~48 kg → final ~210 kg, 90-day feeding period).</div>
          </div>
        )}

        {animal === 'cattle' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-[10px]">Breed</Label><select value={cattleBreed} onChange={e => setCattleBreed(e.target.value)} className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5"><option>Holstein</option><option>Jersey</option><option>Ayrshire</option><option>Guernsey</option></select></div>
              <div><Label className="text-[10px]">Your butterfat (%)</Label><Input value={cattleBf} onChange={e => setCattleBf(e.target.value)} type="number" step="0.01" className="h-8 text-xs mt-0.5" /></div>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: cattleResult.diff >= -0.1 ? '#10b98160' : '#dc262660', backgroundColor: cattleResult.diff >= -0.1 ? '#10b98110' : '#dc262610' }}>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><div className="text-[9px] text-muted-foreground uppercase">Your BF%</div><div className="font-mono text-lg font-bold">{cattleBf}%</div></div>
                <div><div className="text-[9px] text-muted-foreground uppercase">Breed avg</div><div className="font-mono text-lg font-bold text-amber-600">{cattleResult.avgBf.toFixed(2)}%</div></div>
                <div><div className="text-[9px] text-muted-foreground uppercase">Difference</div><div className={`font-mono text-lg font-bold ${cattleResult.diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{cattleResult.diff >= 0 ? '+' : ''}{cattleResult.diff.toFixed(2)}%</div></div>
              </div>
            </div>
            {cattleResult.diff < -0.2 ? (
              <div className="rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/20 p-2 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5"><AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>Below breed average.</strong> Check: energy intake (low fiber → low BF), rumen pH (SARA reduces BF), stage of lactation, heat stress.</span></div>
            ) : (
              <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>At or above breed average.</strong> Butterfat production healthy.</span></div>
            )}
            <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">💡 Source: gpk R package cattle butterfat trial (4 breeds × 2 age classes). Jersey has highest BF (4.21%), Holstein lowest (3.58%).</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
