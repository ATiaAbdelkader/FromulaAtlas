'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Warehouse, Plus, Trash2, DollarSign } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';

interface BinEntry { id: string; crop: string; diameter: number; height: number; moisture: number; price: string; }

const CROP_DENSITY: Record<string, number> = { wheat: 780, corn: 720, rice: 720, barley: 650, soybean: 720, sorghum: 730, oats: 520 };
const CROP_AR: Record<string, string> = { wheat: 'قمح', corn: 'ذرة', rice: 'أرز', barley: 'شعير', soybean: 'فول الصويا', sorghum: 'سورغم', oats: 'شوفان' };

export function GrainBinInventoryTracker() {
  const { language } = useTranslation();
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
    <Card className="overflow-hidden border-amber-100 shadow-sm dark:border-amber-900/60">
      <CardHeader className="border-b border-border/60 bg-amber-50/50 pb-4 dark:bg-amber-950/10"><CardTitle className="flex items-center gap-2 text-base"><span className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"><Warehouse className="h-4 w-4" /></span> {copyFor(language, 'Grain Bin Inventory Tracker', 'متتبع مخزون صوامع الحبوب')}</CardTitle><p className="text-[10px] text-muted-foreground">{copyFor(language, 'Volume × density × price → stored grain value', 'الحجم × الكثافة × السعر → قيمة الحبوب المخزنة')}</p></CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          {results.map(r => (
            <div key={r.id} className="rounded-xl border bg-background/70 p-3 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1"><Label className="text-xs font-medium">{copyFor(language, 'Crop', 'المحصول')}</Label><select aria-label={copyFor(language, 'Crop stored in bin', 'المحصول المخزن في الصومعة')} value={r.crop} onChange={e => update(r.id, { crop: e.target.value })} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  {Object.keys(CROP_DENSITY).map(c => <option key={c} value={c}>{copyFor(language, c, CROP_AR[c])}</option>)}
                </select></div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:flex-1">
                  <div><Label className="text-[11px]">{copyFor(language, 'Diameter (m)', 'القطر (م)')}</Label><Input aria-label={copyFor(language, 'Bin diameter in meters', 'قطر الصومعة بالمتر')} value={r.diameter} onChange={e => update(r.id, { diameter: parseFloat(e.target.value) || 0 })} type="number" step="0.5" className="mt-1 h-10 w-full text-sm" /></div>
                  <div><Label className="text-[11px]">{copyFor(language, 'Height (m)', 'الارتفاع (م)')}</Label><Input aria-label={copyFor(language, 'Bin height in meters', 'ارتفاع الصومعة بالمتر')} value={r.height} onChange={e => update(r.id, { height: parseFloat(e.target.value) || 0 })} type="number" step="0.5" className="mt-1 h-10 w-full text-sm" /></div>
                  <div><Label className="text-[11px]">{copyFor(language, 'Moisture (%)', 'الرطوبة (%)')}</Label><Input aria-label={copyFor(language, 'Grain moisture percentage', 'نسبة رطوبة الحبوب')} value={r.moisture} onChange={e => update(r.id, { moisture: parseFloat(e.target.value) || 0 })} type="number" step="0.5" className="mt-1 h-10 w-full text-sm" /></div>
                  <div><Label className="text-[11px]">{copyFor(language, 'Price ($/kg)', 'السعر ($/كغ)')}</Label><Input aria-label={copyFor(language, 'Grain price per kilogram', 'سعر الحبوب لكل كيلوغرام')} value={r.price} onChange={e => update(r.id, { price: e.target.value })} type="number" step="0.01" className="mt-1 h-10 w-full text-sm" /></div>
                </div>
                <button type="button" aria-label={copyFor(language, `Remove ${r.crop} bin`, `إزالة صومعة ${CROP_AR[r.crop] || r.crop}`)} title={copyFor(language, 'Remove bin', 'إزالة الصومعة')} onClick={() => remove(r.id)} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="mt-3 flex flex-col gap-1 border-t pt-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>{r.tonnes.toFixed(1)} t · {r.volume.toFixed(0)} m³ · {r.moisture}% {copyFor(language, 'moisture', 'رطوبة')}</span>
                <span className="font-mono text-sm font-bold text-emerald-600">${r.value.toFixed(0)}</span>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={addBin} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/50"><Plus className="h-4 w-4" /> {copyFor(language, 'Add another bin', 'إضافة صومعة أخرى')}</button>
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/60 dark:bg-amber-950/20">
          <div><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Total inventory', 'إجمالي المخزون')}</div><div className="text-2xl font-bold font-mono">{totals.tonnes.toFixed(1)} t</div><div className="text-xs text-muted-foreground">{totals.bins} {copyFor(language, totals.bins === 1 ? 'bin' : 'bins', totals.bins === 1 ? 'صومعة' : 'صوامع')}</div></div>
          <div className="sm:text-right"><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copyFor(language, 'Total value', 'القيمة الإجمالية')}</div><div className="text-2xl font-bold font-mono text-emerald-700">${totals.value.toFixed(0)}</div></div>
        </div>
        <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">💡 {copyFor(language, 'Monitor moisture monthly. Above 14% → aerate or dry. Grain value changes daily — update price to track real-time inventory value.', 'راقب الرطوبة شهرياً. إذا تجاوزت 14% → هوِّ الحبوب أو جففها. تتغير قيمة الحبوب يومياً — حدّث السعر لتتبع قيمة المخزون الفعلية.')}</div>
      </CardContent>
    </Card>
  );
}
