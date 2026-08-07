'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Recycle, Plus, Trash2, CheckCircle2, AlertTriangle, Droplets } from 'lucide-react';

interface Feedstock { id: string; name: string; C: number; N: number; moisture: number; weight: number; }

const COMMON_FEEDSTOCKS = [
  { name: 'Grass clippings', C: 45, N: 3.0, moisture: 80 },
  { name: 'Leaves (dry)', C: 48, N: 0.8, moisture: 15 },
  { name: 'Food waste', C: 45, N: 2.5, moisture: 75 },
  { name: 'Manure (cattle)', C: 40, N: 2.0, moisture: 80 },
  { name: 'Manure (poultry)', C: 35, N: 4.0, moisture: 60 },
  { name: 'Straw', C: 48, N: 0.5, moisture: 10 },
  { name: 'Wood chips', C: 50, N: 0.2, moisture: 20 },
  { name: 'Coffee grounds', C: 50, N: 2.0, moisture: 60 },
  { name: 'Cardboard (shredded)', C: 45, N: 0.1, moisture: 8 },
  { name: 'Alfalfa hay', C: 45, N: 3.0, moisture: 15 },
];

export function CompostMixerCalculator() {
  const [feedstocks, setFeedstocks] = useState<Feedstock[]>([
    { id: '1', name: 'Grass clippings', C: 45, N: 3.0, moisture: 80, weight: 50 },
    { id: '2', name: 'Leaves (dry)', C: 48, N: 0.8, moisture: 15, weight: 50 },
  ]);
  const [targetCn, setTargetCn] = useState(30);

  const result = useMemo(() => {
    const totalC = feedstocks.reduce((s, f) => s + f.C * f.weight, 0);
    const totalN = feedstocks.reduce((s, f) => s + f.N * f.weight, 0);
    const totalWeight = feedstocks.reduce((s, f) => s + f.weight, 0);
    const cn = totalN > 0 ? totalC / totalN : 0;
    const avgMoisture = totalWeight > 0 ? feedstocks.reduce((s, f) => s + f.moisture * f.weight, 0) / totalWeight : 0;
    const dryWeight = totalWeight * (1 - avgMoisture / 100);
    const waterToAdd = avgMoisture < 55 ? dryWeight * (0.60 - avgMoisture / 100) / (1 - 0.60) : 0;
    const waterToRemove = avgMoisture > 65 ? totalWeight * (avgMoisture - 0.60) / (1 - 0.60) : 0;
    return { cn, avgMoisture, totalWeight, waterToAdd, waterToRemove, targetMet: cn >= targetCn * 0.85 && cn <= targetCn * 1.15 };
  }, [feedstocks, targetCn]);

  const addFeedstock = () => {
    const f = COMMON_FEEDSTOCKS[feedstocks.length % COMMON_FEEDSTOCKS.length];
    setFeedstocks([...feedstocks, { id: String(Date.now()), ...f, weight: 20 }]);
  };
  const update = (id: string, patch: Partial<Feedstock>) => setFeedstocks(fs => fs.map(f => f.id === id ? { ...f, ...patch } : f));
  const remove = (id: string) => setFeedstocks(fs => fs.filter(f => f.id !== id));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Recycle className="h-4 w-4 text-emerald-600" /> Compost Mixer Calculator
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">C:N ratio · moisture adjustment · 10 common feedstocks · target 30:1</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Label className="text-[10px] shrink-0">Target C:N:</Label>
          <Input value={targetCn} onChange={e => setTargetCn(parseInt(e.target.value) || 30)} type="number" min="15" max="40" className="h-7 text-xs w-20" />
          <Button size="sm" variant="outline" onClick={addFeedstock} className="gap-1.5 text-xs ml-auto h-7">
            <Plus className="h-3 w-3" /> Add feedstock
          </Button>
        </div>

        <div className="space-y-1.5">
          {feedstocks.map(f => (
            <div key={f.id} className="flex items-center gap-1.5 rounded-md border p-1.5">
              <select value={f.name} onChange={e => {
                const preset = COMMON_FEEDSTOCKS.find(c => c.name === e.target.value);
                if (preset) update(f.id, { name: preset.name, C: preset.C, N: preset.N, moisture: preset.moisture });
                else update(f.id, { name: e.target.value });
              }} className="h-7 text-[10px] rounded border border-input bg-background px-1 flex-1 min-w-0">
                {COMMON_FEEDSTOCKS.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              <Input value={f.weight} onChange={e => update(f.id, { weight: parseFloat(e.target.value) || 0 })} type="number" step="1" className="h-7 text-[10px] w-14" title="Weight (kg)" />
              <span className="text-[9px] text-muted-foreground">kg</span>
              <Badge variant="outline" className="text-[8px] font-mono shrink-0">{(f.C / f.N).toFixed(0)}:1</Badge>
              <button onClick={() => remove(f.id)} className="text-rose-500 hover:text-rose-700 shrink-0"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
        </div>

        {/* Results */}
        <div className="grid grid-cols-3 gap-2">
          <div className={`rounded-md border p-2 text-center ${result.targetMet ? 'border-emerald-300 bg-emerald-50/40' : 'border-amber-300 bg-amber-50/40'}`}>
            <div className="text-[9px] text-muted-foreground uppercase">C:N Ratio</div>
            <div className="text-xl font-bold font-mono">{result.cn.toFixed(1)}:1</div>
            <div className="text-[9px] text-muted-foreground">target {targetCn}:1</div>
          </div>
          <div className="rounded-md border border-cyan-300 bg-cyan-50/40 p-2 text-center">
            <div className="text-[9px] text-muted-foreground uppercase">Moisture</div>
            <div className="text-xl font-bold font-mono">{result.avgMoisture.toFixed(0)}%</div>
            <div className="text-[9px] text-muted-foreground">target 55-65%</div>
          </div>
          <div className="rounded-md border border-violet-300 bg-violet-50/40 p-2 text-center">
            <div className="text-[9px] text-muted-foreground uppercase">Total mass</div>
            <div className="text-xl font-bold font-mono">{result.totalWeight.toFixed(0)}</div>
            <div className="text-[9px] text-muted-foreground">kg</div>
          </div>
        </div>

        {/* Recommendations */}
        {result.targetMet ? (
          <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span><strong>C:N ratio is good ({result.cn.toFixed(1)}:1).</strong> Microbes will efficiently decompose. Pile should reach 55-65°C within 3 days.</span>
          </div>
        ) : (
          <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-2 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span><strong>Adjust feedstock mix.</strong> {result.cn > targetCn ? `C:N too high — add nitrogen-rich material (grass, manure, food waste).` : `C:N too low — add carbon-rich material (leaves, straw, cardboard).`}</span>
          </div>
        )}

        {result.waterToAdd > 0 && (
          <div className="rounded-md border border-cyan-200 dark:border-cyan-900 bg-cyan-50/60 dark:bg-cyan-950/20 p-2 text-xs text-cyan-700 dark:text-cyan-300 flex items-start gap-1.5">
            <Droplets className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span><strong>Add {result.waterToAdd.toFixed(0)} L water</strong> to reach 60% moisture. Sprinkle while turning pile for even distribution.</span>
          </div>
        )}
        {result.waterToRemove > 0 && (
          <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-2 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span><strong>Too wet ({result.avgMoisture.toFixed(0)}%).</strong> Add {result.waterToRemove.toFixed(0)} kg dry material (straw, cardboard) or turn pile to dry. Anaerobic risk if &gt;70%.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
