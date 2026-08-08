'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Warehouse, Plus, Trash2, DollarSign } from 'lucide-react';

interface BinEntry { id: string; crop: string; diameter: number; height: number; moisture: number; price: string; }

const CROP_DENSITY: Record<string, number> = { wheat: 780, corn: 720, rice: 720, barley: 650, soybean: 720, sorghum: 730, oats: 520 };

export function GrainBinInventoryTracker() {
  const [bins, setBins] = useState<BinEntry[]>([
    { id: '1', crop: 'wheat', diameter: 6, height: 3, moisture: 13.5, price: '0.25' },
  ]);

  const results = useMemo(() => {
    return bins.map(b => {
      const radius = b.diameter / 2;
      const volume = Math.PI * radius * radius * b.height; // m³
      const density = CROP_DROP_DENSITY[b.crop] ?? 750;
      const mass = volume * density; // kg
      const tonnes = mass / 1000;
      const price = parseFloat(b.price) || 0;
      const value = tonnes * price;
      // Dry matter adjustment (standard 13% moisture)
      const dmAdjust = (100 - b.moisture) / 87;
      const dryTonnes = tonnes * dmAdjust;
      return { ...b, volume, tonnes, dryTonnes, value };
    });
  }, [bins]);

  const totals = useMemo(() => {
    const t = results.reduce((s, r) => ({ tonnes: s.tonnes + r.tonnes, value: s.value + r.value, bins: s.bins + 1 }), { tonnes: 0, value: 0, bins: 0 });
    return t;
  }, [results]);

  const CROP_DROP_DENSITY = CROP_DENSITY;
  const addBin = () => setBins([...bins, { id: String(Date.now()), crop: 'wheat', diameter: 6, height: 3, moisture: 13.5, price: '0.25' }]);
  const update = (id: string, patch: Partial<BinEntry>) => setBins(bs => bs.map(b => b.id === id ? { ...b, ...patch } : b));
  const remove = (id: string) => setBins(bs => bs.filter(b => b.id !== id));

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Warehouse className="h-4 w-4 text-amber-600" /> Grain Bin Inventory Tracker</CardTitle><p className="text-[10px] text-muted-foreground">Volume × density × price → stored grain value</p></CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          {results.map(r => (
            <div key={r.id} className="rounded-md border p-2 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <select value={r.crop} onChange={e => update(r.id, { crop: e.target.value })} className="h-7 text-[10px] rounded border border-input bg-background px-1 flex-1">
                  {Object.keys(CROP_DENSITY).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <Input value={r.diameter} onChange={e => update(r.id, { diameter: parseFloat(e.target.value) || 0 })} type="number" step="0.5" className="h-7 text-[10px] w-14" title="Diameter (m)" />
                <Input value={r.height} onChange={e => update(r.id, { height: parseFloat(e.target.value) || 0 })} type="number" step="0.5" className="h-7 text-[10px] w-14" title="Height (m)" />
                <Input value={r.moisture} onChange={e => update(r.id, { moisture: parseFloat(e.target.value) || 0 })} type="number" step="0.5" className="h-7 text-[10px] w-14" title="Moisture (%)" />
                <Input value={r.price} onChange={e => update(r.id, { price: e.target.value })} type="number" step="0.01" className="h-7 text-[10px] w-14" title="Price ($/kg)" />
                <button onClick={() => remove(r.id)} className="text-rose-500 hover:text-rose-700"><Trash2 className="h-3 w-3" /></button>
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                <span>{r.tonnes.toFixed(1)} t · {r.volume.toFixed(0)} m³ · {r.moisture}% moist</span>
                <span className="font-mono font-bold text-emerald-600">${r.value.toFixed(0)}</span>
              </div>
            </div>
          ))}
        </div>
        <button onClick={addBin} className="w-full text-[10px] flex items-center justify-center gap-1 py-1.5 rounded-md border border-dashed hover:bg-muted/50"><Plus className="h-3 w-3" /> Add bin</button>
        <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 flex items-center justify-between">
          <div><div className="text-[10px] text-muted-foreground uppercase">Total inventory</div><div className="text-xl font-bold font-mono">{totals.tonnes.toFixed(1)} t</div><div className="text-[10px] text-muted-foreground">{totals.bins} bin{totals.bins !== 1 ? 's' : ''}</div></div>
          <div className="text-right"><div className="text-[10px] text-muted-foreground uppercase">Total value</div><div className="text-xl font-bold font-mono text-emerald-700">${totals.value.toFixed(0)}</div></div>
        </div>
        <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">💡 Monitor moisture monthly. Above 14% → aerate or dry. Grain value changes daily — update price to track real-time inventory value.</div>
      </CardContent>
    </Card>
  );
}
