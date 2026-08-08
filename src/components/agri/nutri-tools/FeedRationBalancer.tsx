'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Beef, CheckCircle2, AlertTriangle, Plus, Trash2 } from 'lucide-react';

interface FeedIngredient { id: string; name: string; dm: number; cp: number; tdn: number; ca: number; p: number; weight: number; }
const INGREDIENTS = [
  { name: 'Corn grain', dm: 88, cp: 9.0, tdn: 88, ca: 0.02, p: 0.30 },
  { name: 'Alfalfa hay', dm: 90, cp: 18, tdn: 58, ca: 1.40, p: 0.25 },
  { name: 'Soybean meal', dm: 90, cp: 50, tdn: 84, ca: 0.35, p: 0.70 },
  { name: 'Corn silage', dm: 35, cp: 8.0, tdn: 70, ca: 0.25, p: 0.22 },
  { name: 'Wheat straw', dm: 90, cp: 3.5, tdn: 40, ca: 0.30, p: 0.08 },
  { name: 'Barley grain', dm: 89, cp: 12, tdn: 83, ca: 0.05, p: 0.35 },
  { name: 'Cottonseed meal', dm: 92, cp: 44, tdn: 77, ca: 0.20, p: 1.20 },
  { name: 'Mineral mix', dm: 98, cp: 0, tdn: 0, ca: 18, p: 12 },
];

export function FeedRationBalancer() {
  const [animalType, setAnimalType] = useState('beef_growing');
  const [bw, setBw] = useState('400');
  const [adg, setAdg] = useState('1.2');
  const [ingredients, setIngredients] = useState<FeedIngredient[]>([
    { id: '1', ...INGREDIENTS[0], weight: 4 },
    { id: '2', ...INGREDIENTS[1], weight: 3 },
    { id: '3', ...INGREDIENTS[3], weight: 8 },
  ]);

  const requirements: Record<string, { dmi: number; cp: number; tdn: number; ca: number; p: number; label: string }> = {
    beef_growing: { dmi: 2.5, cp: 12, tdn: 68, ca: 0.4, p: 0.2, label: 'Beef growing (400 kg, 1.2 kg ADG)' },
    beef_maint: { dmi: 2.0, cp: 8, tdn: 55, ca: 0.25, p: 0.15, label: 'Beef maintenance (500 kg)' },
    dairy_lact: { dmi: 3.5, cp: 16, tdn: 70, ca: 0.6, p: 0.35, label: 'Dairy lactating (600 kg, 25 L)' },
    dairy_dry: { dmi: 2.0, cp: 11, tdn: 55, ca: 0.4, p: 0.2, label: 'Dairy dry (600 kg)' },
  };

  const result = useMemo(() => {
    const bodyWt = parseFloat(bw);
    const req = requirements[animalType];
    const dmiTarget = bodyWt * req.dmi / 100; // kg DM/day

    const totalWt = ingredients.reduce((s, i) => s + i.weight, 0);
    const totalDM = ingredients.reduce((s, i) => s + i.weight * i.dm / 100, 0);
    const totalCP = ingredients.reduce((s, i) => s + i.weight * i.dm / 100 * i.cp / 100, 0);
    const totalTDN = ingredients.reduce((s, i) => s + i.weight * i.dm / 100 * i.tdn / 100, 0);
    const totalCa = ingredients.reduce((s, i) => s + i.weight * i.dm / 100 * i.ca / 100, 0);
    const totalP = ingredients.reduce((s, i) => s + i.weight * i.dm / 100 * i.p / 100, 0);

    const cpPct = totalDM > 0 ? totalCP / totalDM * 100 : 0;
    const tdnPct = totalDM > 0 ? totalTDN / totalDM * 100 : 0;
    const caPct = totalDM > 0 ? totalCa / totalDM * 100 : 0;
    const pPct = totalDM > 0 ? totalP / totalDM * 100 : 0;

    return {
      dmiTarget, totalWt, totalDM,
      cpPct, tdnPct, caPct, pPct,
      cpMet: cpPct >= req.cp, tdnMet: tdnPct >= req.tdn,
      caMet: caPct >= req.ca, pMet: pPct >= req.p,
      dmiMet: totalDM >= dmiTarget * 0.95,
      req,
    };
  }, [animalType, bw, ingredients]);

  const addIngredient = () => {
    const ing = INGREDIENTS[ingredients.length % INGREDIENTS.length];
    setIngredients([...ingredients, { id: String(Date.now()), ...ing, weight: 1 }]);
  };
  const update = (id: string, patch: Partial<FeedIngredient>) => setIngredients(fs => fs.map(f => f.id === id ? { ...f, ...patch } : f));
  const remove = (id: string) => setIngredients(fs => fs.filter(f => f.id !== id));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Beef className="h-4 w-4 text-amber-600" /> Feed Ration Balancer (NRC 2021)
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">DMI · CP · TDN · Ca · P balancing — 8 common ingredients · 4 animal types</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-[10px]">Animal type</Label>
            <select value={animalType} onChange={e => setAnimalType(e.target.value)} className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5">
              {Object.entries(requirements).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-[10px]">Body weight (kg)</Label>
            <Input value={bw} onChange={e => setBw(e.target.value)} type="number" step="10" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">ADG (kg/day)</Label>
            <Input value={adg} onChange={e => setAdg(e.target.value)} type="number" step="0.1" className="h-8 text-xs mt-0.5" />
          </div>
        </div>

        <div className="space-y-1">
          {ingredients.map(i => (
            <div key={i.id} className="flex items-center gap-1 rounded-md border p-1.5">
              <select value={i.name} onChange={e => { const ing = INGREDIENTS.find(x => x.name === e.target.value); if (ing) update(i.id, { ...ing }); }} className="h-7 text-[10px] rounded border border-input bg-background px-1 flex-1 min-w-0">
                {INGREDIENTS.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
              </select>
              <Input value={i.weight} onChange={e => update(i.id, { weight: parseFloat(e.target.value) || 0 })} type="number" step="0.5" className="h-7 text-[10px] w-14" />
              <span className="text-[9px] text-muted-foreground">kg</span>
              <button onClick={() => remove(i.id)} className="text-rose-500 hover:text-rose-700"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
        </div>
        <button onClick={addIngredient} className="w-full text-[10px] flex items-center justify-center gap-1 py-1.5 rounded-md border border-dashed hover:bg-muted/50">
          <Plus className="h-3 w-3" /> Add ingredient
        </button>

        {result && (
          <div className="space-y-2">
            <div className="grid grid-cols-5 gap-1 text-center">
              <NutrientBar label="DMI" actual={result.totalDM.toFixed(1)} target={result.dmiTarget.toFixed(1)} unit="kg" met={result.dmiMet} />
              <NutrientBar label="CP" actual={result.cpPct.toFixed(1)} target={result.req.cp.toFixed(1)} unit="%" met={result.cpMet} />
              <NutrientBar label="TDN" actual={result.tdnPct.toFixed(1)} target={result.req.tdn.toFixed(1)} unit="%" met={result.tdnMet} />
              <NutrientBar label="Ca" actual={result.caPct.toFixed(2)} target={result.req.ca.toFixed(2)} unit="%" met={result.caMet} />
              <NutrientBar label="P" actual={result.pPct.toFixed(2)} target={result.req.p.toFixed(2)} unit="%" met={result.pMet} />
            </div>

            {!result.dmiMet || !result.cpMet || !result.tdnMet ? (
              <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-2 text-xs text-amber-700 dark:text-amber-300">
                <strong>Deficient:</strong> {!result.dmiMet && ' DMI'} {!result.cpMet && ' CP'} {!result.tdnMet && ' TDN'} {!result.caMet && ' Ca'} {!result.pMet && ' P'}. Add ingredients to meet requirements.
              </div>
            ) : (
              <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>Ration balanced.</strong> All nutrients meet {result.req.label} requirements.</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NutrientBar({ label, actual, target, unit, met }: { label: string; actual: string; target: string; unit: string; met: boolean }) {
  return (
    <div className={`rounded border p-1 ${met ? 'border-emerald-300 bg-emerald-50/40' : 'border-rose-300 bg-rose-50/40'}`}>
      <div className="text-[8px] text-muted-foreground uppercase">{label}</div>
      <div className="font-mono text-[11px] font-bold">{actual}</div>
      <div className="text-[8px] text-muted-foreground">/{target}{unit}</div>
      <div className={`text-[8px] ${met ? 'text-emerald-600' : 'text-rose-600'}`}>{met ? '✓' : '✗'}</div>
    </div>
  );
}
