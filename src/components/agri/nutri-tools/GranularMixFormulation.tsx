'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  GRANULAR_KEYS, GRANULAR_MATERIALS, GRANULAR_KEY_LABELS,
} from '@/lib/nutri-tools-data';
import { useBridgePayload } from '@/lib/use-bridge-payload';

/**
 * Tool 8 — Granular Mix Formulation
 */
export function GranularMixFormulation() {
  const [rows, setRows] = useState<{ name: string; pct: string }[]>([
    { name: 'Urea', pct: '' },
    { name: 'DAP', pct: '' },
    { name: 'Potassium Chloride (MOP)', pct: '' },
  ]);
  const [doseKgHa, setDoseKgHa] = useState('500');

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
  const clearMix = () => setRows([{ name: 'Urea', pct: '' }]);

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Granular Mix Formulation</CardTitle>
          <p className="text-xs text-muted-foreground">Build a granular blend — get NPK analysis and kg/ha.</p>
        </div>
        <Button size="sm" variant="outline" onClick={clearMix}>Clear mix</Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {bridgeBanner && (
          <div className="rounded-md border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 flex items-start gap-2">
            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-emerald-800 dark:text-emerald-200 flex-1 leading-snug">
              Received formula from <strong>Fertilizer Composition</strong>:{' '}
              <span className="font-mono">{bridgeBanner.formula}</span> — added as a new row.
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left column: fertilizer rows + dose + Sum % */}
          <div className="space-y-3">
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
                    <Input
                      type="number"
                      value={r.pct}
                      onChange={e => setRows(rows.map((row, idx) => idx === i ? { ...row, pct: e.target.value } : row))}
                      placeholder="0"
                      className="h-9 pr-8 text-sm"
                      min={0}
                      max={100}
                      step={0.01}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeRow(i)} className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive">×</Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={addRow} className="w-full">+ Add fertilizer</Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Blend dose (kg/ha)" value={doseKgHa} onChange={setDoseKgHa} />
              <div>
                <Label className="text-xs">Sum %</Label>
                <div className={`h-9 mt-1 px-3 flex items-center rounded-md border text-sm font-mono ${Math.abs(totals.sumPct - 100) < 0.5 ? 'text-emerald-600 border-emerald-300' : 'text-amber-600 border-amber-300'}`}>
                  {totals.sumPct.toFixed(2)}% {Math.abs(totals.sumPct - 100) < 0.5 ? '✓' : '⚠'}
                </div>
              </div>
            </div>
          </div>

          {/* Right column: blend analysis + NPK ratio, or empty state */}
          <div>
            {totals.sumPct === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[200px] text-sm text-muted-foreground bg-muted/30 rounded-lg border border-dashed">Enter inputs to see results.</div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg p-3 border bg-muted/40">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Blend analysis (% in mix)</div>
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

                <div className="rounded-lg p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">N-P₂O₅-K₂O ratio</span>
                    <span className="font-bold text-2xl font-mono">{npk}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={e => onChange(e.target.value)} className="h-9 mt-1" />
    </div>
  );
}
