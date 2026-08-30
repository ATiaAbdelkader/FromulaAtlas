'use client';

import { useEffect, useMemo, useState } from 'react';
import { FlaskConical, Copy, Check, RotateCcw, Plus, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  GRANULAR_KEYS, GRANULAR_MATERIALS, GRANULAR_KEY_LABELS,
} from '@/lib/nutri-tools-data';
import { useBridgePayload } from '@/lib/use-bridge-payload';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

const TITLE: TrilingualString = {
  en: 'Granular Mix Formulation',
  ar: 'تركيب الخليط الحبيبي',
  fr: 'Formulation de Mélange Granulé',
};

const DESC: TrilingualString = {
  en: 'Build a granular blend from raw materials — get NPK analysis, kg/ha delivered, and N-P₂O₅-K₂O ratio.',
  ar: 'اصنع خليطاً حبيبياً من المواد الخام — احصل على تحليل NPK وكمية كغ/هكتار ونسبة N-P₂O₅-K₂O.',
  fr: 'Construisez un mélange granulé à partir de matières premières — analyse NPK, kg/ha, et ratio N-P₂O₅-K₂O.',
};

/**
 * Tool 8 — Granular Mix Formulation
 */
export function GranularMixFormulation() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [rows, setRows] = useState<{ name: string; pct: string }[]>([
    { name: 'Urea', pct: '' },
    { name: 'DAP', pct: '' },
    { name: 'Potassium Chloride (MOP)', pct: '' },
  ]);
  const [doseKgHa, setDoseKgHa] = useState('500');
  const [copied, setCopied] = useState(false);

  // "Send to" bridge — receive a formula from Fertilizer Composition.
  const bridgePayload = useBridgePayload('granular-mix');
  const [bridgeBanner, setBridgeBanner] = useState<{ formula: string } | null>(null);
  useEffect(() => {
    if (!bridgePayload) return;
    const v = bridgePayload.values;
    const formula = typeof v.formula === 'string' ? v.formula : String(v.formula ?? '');
    const name = typeof v.name === 'string' ? v.name : String(v.name ?? '') || formula;
    if (!name) return;
    setRows((prev) => {
      // Skip if a row with the same name already exists.
      if (prev.some((r) => r.name === name)) return prev;
      return [...prev, { name, pct: '' }];
    });
    setBridgeBanner({ formula: formula || name });
  }, [bridgePayload]);

  const materialNames = Object.keys(GRANULAR_MATERIALS);

  const totals = useMemo(() => {
    const out: Record<string, number> = {};
    for (const k of GRANULAR_KEYS) out[k] = 0;
    let sumPct = 0;
    for (const r of rows) {
      const p = parseFloat(r.pct) || 0;
      sumPct += p;
      const comp = GRANULAR_MATERIALS[r.name];
      if (comp) {
        for (const k of GRANULAR_KEYS) {
          out[k] += (p / 100) * (comp[k] || 0);
        }
      }
    }
    return { out, sumPct };
  }, [rows]);

  const doseN = parseFloat(doseKgHa) || 0;

  const npk = (() => {
    const n = totals.out.N, p = totals.out.P2O5, k = totals.out.K2O;
    if (n > 0 && p > 0 && k > 0) {
      const m = Math.min(n, p, k);
      const fmtRatio = (v: number) => (v / m).toFixed(1).replace(/\.0$/, '');
      return `${fmtRatio(n)} - ${fmtRatio(p)} - ${fmtRatio(k)}`;
    }
    return '—';
  })();

  const addRow = () => setRows([...rows, { name: 'Urea', pct: '' }]);
  const removeRow = (i: number) => rows.length > 1 ? setRows(rows.filter((_, idx) => idx !== i)) : null;
  const clearMix = () => {
    setRows([{ name: 'Urea', pct: '' }]);
    setDoseKgHa('500');
    toast({ title: tr('Mix cleared', 'تم مسح الخليط', 'Mélange effacé') });
  };

  const handleCopy = () => {
    const lines = rows.map(r => `  • ${r.name}: ${r.pct || '0'}%`).join('\n');
    const analysis = GRANULAR_KEYS.map(k => `${GRANULAR_KEY_LABELS[k]}: ${totals.out[k].toFixed(2)}% (${(doseN * totals.out[k] / 100).toFixed(2)} kg/ha)`).join('\n  ');
    const text = `=== GRANULAR MIX ===\nComponents:\n${lines}\nSum %: ${totals.sumPct.toFixed(2)}%\nBlend dose: ${doseKgHa} kg/ha\n\nBlend analysis:\n  ${analysis}\nN-P₂O₅-K₂O ratio: ${npk}`.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: tr('Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <CalculatorShell
      icon={FlaskConical}
      title={TITLE}
      description={DESC}
      badge="Blend Lab"
      accent="amber"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' },
          onClick: handleCopy,
          variant: 'primary',
          showCheck: copied,
        },
        {
          icon: RotateCcw,
          label: { en: 'Clear Mix', ar: 'مسح الخليط', fr: 'Effacer' },
          onClick: clearMix,
        },
      ]}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-amber-700" />
              {tr('Blend Components', 'مكونات الخليط', 'Composants du mélange')}
            </span>
            <span className={`font-mono text-xs font-bold border rounded-lg px-2 py-0.5 ${Math.abs(totals.sumPct - 100) < 0.5 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'}`}>
              {totals.sumPct.toFixed(2)}% {Math.abs(totals.sumPct - 100) < 0.5 ? '✓' : '⚠'}
            </span>
          </div>

          {bridgeBanner && (
            <div className="rounded-md border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-emerald-800 dark:text-emerald-200 flex-1 leading-snug">
                {tr('Received formula from', 'استُلمت صيغة من', 'Formule reçue de')} <strong>Fertilizer Composition</strong>:{' '}
                <span className="font-mono">{bridgeBanner.formula}</span> — {tr('added as a new row.', 'أُضيفت كصف جديد.', 'ajoutée comme nouvelle ligne.')}
              </div>
              <button
                type="button"
                onClick={() => setBridgeBanner(null)}
                className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 flex-shrink-0"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Fertilizer rows */}
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_90px_auto] gap-2 items-center">
                <Select value={r.name} onValueChange={v => setRows(rows.map((row, idx) => idx === i ? { ...row, name: v } : row))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {materialNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    {/* Render a custom (non-catalog) name received via the Send-to bridge so it stays selectable. */}
                    {!materialNames.includes(r.name) && r.name && (
                      <SelectItem value={r.name}>{r.name}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <input
                    type="number"
                    value={r.pct}
                    onChange={e => setRows(rows.map((row, idx) => idx === i ? { ...row, pct: e.target.value } : row))}
                    placeholder="0"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 pr-8 text-sm font-mono font-bold shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    min={0}
                    max={100}
                    step={0.01}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeRow(i)} className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive">×</Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={addRow} className="w-full gap-1.5">
              <Plus className="h-3.5 w-3.5" /> {tr('Add fertilizer', 'أضف سماداً', 'Ajouter engrais')}
            </Button>
          </div>

          <CalculatorShell.InputField
            label={tr('Blend dose (kg/ha)', 'جرعة الخليط (كغ/هكتار)', 'Dose du mélange (kg/ha)')}
            value={doseKgHa}
            onChange={setDoseKgHa}
            step="10"
            helper={tr('Total application rate per hectare', 'إجمالي معدل التطبيق لكل هكتار', 'Dose totale par hectare')}
          />
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        {totals.sumPct === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[200px] text-sm text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
            {tr('Enter inputs to see results.', 'أدخل القيم لرؤية النتائج.', 'Saisissez les valeurs pour voir les résultats.')}
          </div>
        ) : (
          <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
            <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-amber-50 via-transparent to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
              <span className="text-base font-bold flex items-center gap-2">
                ✨ {tr('Blend Analysis', 'تحليل الخليط', 'Analyse du mélange')}
              </span>
              <span className="font-mono text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 rounded-lg px-2 py-0.5">
                {npk}
              </span>
            </div>

            {/* Blend analysis grid */}
            <div className="rounded-lg p-3 border bg-muted/40">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{tr('% in mix', '% في الخليط', '% dans le mélange')}</div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {GRANULAR_KEYS.map(k => (
                  <div key={k} className="text-center">
                    <div className="text-[10px] text-muted-foreground">{GRANULAR_KEY_LABELS[k]}</div>
                    <div className="font-mono font-semibold text-lg">{totals.out[k].toFixed(2)}</div>
                    <div className="text-[10px] text-muted-foreground">{(doseN * totals.out[k] / 100).toFixed(2)} kg/ha</div>
                  </div>
                ))}
              </div>
            </div>

            <CalculatorShell.MetricTile
              label={tr('N-P₂O₅-K₂O Ratio', 'نسبة N-P₂O₅-K₂O', 'Ratio N-P₂O₅-K₂O')}
              value={npk}
              color="emerald"
              helper={tr('Normalized to lowest nutrient', 'مُطبَّعة على العنصر الأقل', 'Normalisé au nutriment le plus faible')}
            />
          </div>
        )}
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
