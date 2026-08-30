'use client';

import { useState, useMemo } from 'react';
import {
  Warehouse,
  Plus,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

// ---------------------------------------------------------------------------
// Trilingual content
// ---------------------------------------------------------------------------

const TITLE: TrilingualString = {
  en: 'Grain Bin Inventory Tracker',
  ar: 'متتبع مخزون صوامع الحبوب',
  fr: 'Suivi de stock de silos à grains',
};

const DESCRIPTION: TrilingualString = {
  en: 'Volume × density × price → stored grain value across multiple bins.',
  ar: 'الحجم × الكثافة × السعر → قيمة الحبوب المخزنة عبر صوامع متعددة.',
  fr: 'Volume × densité × prix → valeur du grain stocké (silos multiples).',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Monitor moisture monthly. Above 14% → aerate or dry. Grain value changes daily — update price to track real-time inventory value.',
  ar: 'راقب الرطوبة شهرياً. إذا تجاوزت 14% → هوِّ الحبوب أو جففها. تتغير قيمة الحبوب يومياً — حدّث السعر لتتبع قيمة المخزون الفعلية.',
  fr: 'Contrôlez l\u2019humidité mensuellement. Au-dessus de 14 % → ventiler ou sécher. La valeur du grain change quotidiennement — mettez le prix à jour.',
};

// ---------------------------------------------------------------------------
// Crop density + labels — UNCHANGED data
// ---------------------------------------------------------------------------

const CROP_DENSITY: Record<string, number> = { wheat: 780, corn: 720, rice: 720, barley: 650, soybean: 720, sorghum: 730, oats: 520 };
const CROP_AR: Record<string, string> = { wheat: 'قمح', corn: 'ذرة', rice: 'أرز', barley: 'شعير', soybean: 'فول الصويا', sorghum: 'سورغم', oats: 'شوفان' };
const CROP_FR: Record<string, string> = { wheat: 'Blé', corn: 'Maïs', rice: 'Riz', barley: 'Orge', soybean: 'Soja', sorghum: 'Sorgho', oats: 'Avoine' };

interface BinEntry { id: string; crop: string; diameter: number; height: number; moisture: number; price: string; }

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GrainBinInventoryTracker() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [bins, setBins] = useState<BinEntry[]>([
    { id: '1', crop: 'wheat', diameter: 6, height: 3, moisture: 13.5, price: '0.25' },
  ]);

  // Calculation — UNCHANGED (CROP_DROP_DENSITY alias preserved)
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

  const handleReset = () => {
    setBins([{ id: '1', crop: 'wheat', diameter: 6, height: 3, moisture: 13.5, price: '0.25' }]);
    toast({
      title: tr('Inventory Reset', 'تمت إعادة تعيين المخزون', 'Inventaire réinitialisé'),
    });
  };

  const actions = [
    {
      icon: RotateCcw,
      label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
      onClick: handleReset,
      variant: 'ghost' as const,
    },
  ];

  return (
    <CalculatorShell
      icon={Warehouse}
      title={TITLE}
      description={DESCRIPTION}
      badge="Storage Mgmt"
      accent="amber"
      actions={actions}
      protocolNote={PROTOCOL_NOTE}
    >
      {/* ---------------- Inputs column: list of bin cards ---------------- */}
      <CalculatorShell.Inputs>
        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-amber-300/60
          dark:[&::-webkit-scrollbar-thumb]:bg-amber-700/60
          [&::-webkit-scrollbar-track]:bg-transparent">
          {results.map(r => (
            <div key={r.id} className="rounded-xl border bg-card p-3 space-y-3 shadow-sm">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <Label className="text-[11px] font-bold text-foreground">
                    {tr('Crop', 'المحصول', 'Culture')}
                  </Label>
                  <select
                    aria-label={tr('Crop stored in bin', 'المحصول المخزن في الصومعة', 'Culture stockée')}
                    value={r.crop}
                    onChange={e => update(r.id, { crop: e.target.value })}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-mono font-bold"
                  >
                    {Object.keys(CROP_DENSITY).map(c => (
                      <option key={c} value={c}>
                        {tr(c.charAt(0).toUpperCase() + c.slice(1), CROP_AR[c], CROP_FR[c])}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  aria-label={tr(`Remove ${r.crop} bin`, `إزالة صومعة ${CROP_AR[r.crop] || r.crop}`, `Supprimer silo ${CROP_FR[r.crop] || r.crop}`)}
                  title={tr('Remove bin', 'إزالة الصومعة', 'Supprimer le silo')}
                  onClick={() => remove(r.id)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg border bg-background space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground">
                    {tr('Diameter (m)', 'القطر (م)', 'Diamètre (m)')}
                  </Label>
                  <Input
                    aria-label={tr('Bin diameter', 'قطر الصومعة', 'Diamètre du silo')}
                    value={r.diameter}
                    onChange={e => update(r.id, { diameter: parseFloat(e.target.value) || 0 })}
                    type="number"
                    step="0.5"
                    className="h-8 text-xs font-mono font-bold"
                  />
                </div>
                <div className="p-2 rounded-lg border bg-background space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground">
                    {tr('Height (m)', 'الارتفاع (م)', 'Hauteur (m)')}
                  </Label>
                  <Input
                    aria-label={tr('Bin height', 'ارتفاع الصومعة', 'Hauteur du silo')}
                    value={r.height}
                    onChange={e => update(r.id, { height: parseFloat(e.target.value) || 0 })}
                    type="number"
                    step="0.5"
                    className="h-8 text-xs font-mono font-bold"
                  />
                </div>
                <div className="p-2 rounded-lg border bg-background space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground">
                    {tr('Moisture (%)', 'الرطوبة (%)', 'Humidité (%)')}
                  </Label>
                  <Input
                    aria-label={tr('Grain moisture', 'رطوبة الحبوب', 'Humidité du grain')}
                    value={r.moisture}
                    onChange={e => update(r.id, { moisture: parseFloat(e.target.value) || 0 })}
                    type="number"
                    step="0.5"
                    className="h-8 text-xs font-mono font-bold"
                  />
                </div>
                <div className="p-2 rounded-lg border bg-background space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground">
                    {tr('Price ($/kg)', 'السعر ($/كغ)', 'Prix ($/kg)')}
                  </Label>
                  <Input
                    aria-label={tr('Grain price per kg', 'سعر الحبوب لكل كغ', 'Prix du grain par kg')}
                    value={r.price}
                    onChange={e => update(r.id, { price: e.target.value })}
                    type="number"
                    step="0.01"
                    className="h-8 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Per-bin inline result */}
              <div className="flex items-center justify-between border-t pt-2 text-xs">
                <span className="text-muted-foreground font-mono">
                  {r.tonnes.toFixed(1)} t · {r.volume.toFixed(0)} m³ · {r.moisture}% {tr('moisture', 'رطوبة', 'humidité')}
                </span>
                <span className="font-mono text-sm font-bold text-emerald-600">
                  ${r.value.toFixed(0)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addBin}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/50 hover:border-amber-300 dark:hover:border-amber-700"
        >
          <Plus className="h-4 w-4" />
          {tr('Add another bin', 'إضافة صومعة أخرى', 'Ajouter un silo')}
        </button>
      </CalculatorShell.Inputs>

      {/* ---------------- Results column: totals ---------------- */}
      <CalculatorShell.Results>
        <CalculatorShell.MetricTile
          label={tr('Total Inventory', 'إجمالي المخزون', 'Inventaire total')}
          value={totals.tonnes.toFixed(1)}
          unit="t"
          color="amber"
          helper={tr(
            `${totals.bins} ${totals.bins === 1 ? 'bin' : 'bins'}`,
            `${totals.bins} ${totals.bins === 1 ? 'صومعة' : 'صوامع'}`,
            `${totals.bins} ${totals.bins === 1 ? 'silo' : 'silos'}`,
          )}
        />

        <CalculatorShell.MetricTile
          label={tr('Total Stored Value', 'القيمة الإجمالية', 'Valeur stockée totale')}
          value={`$${totals.value.toFixed(0)}`}
          color="emerald"
          helper={tr('At current grain prices', 'بالأسعار الحالية للحبوب', 'Aux prix actuels du grain')}
        />

        <CalculatorShell.MetricTile
          label={tr('Average Value per Bin', 'متوسط قيمة الصومعة', 'Valeur moyenne par silo')}
          value={totals.bins > 0 ? `$${(totals.value / totals.bins).toFixed(0)}` : '$0'}
          color="default"
          helper={tr('Across all bins', 'عبر جميع الصوامع', 'Sur tous les silos')}
        />
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
