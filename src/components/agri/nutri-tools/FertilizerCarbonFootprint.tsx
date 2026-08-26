'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CARBON_FACTORS, computeCarbonRow, type CarbonRow, type CarbonResult,
} from '@/lib/nutri-tools-data';

interface ScenarioState {
  rows: CarbonRow[];
}

const newRow = (fertilizerId: string): CarbonRow => ({
  id: Math.random().toString(36).slice(2, 9),
  fertilizerId,
  rateKgPerHa: 100,
  originKm: 100,
  seaKm: 0,
  portKm: 50,
  mode: 'estimated',
});

const DEFAULT_A: ScenarioState = { rows: [newRow('urea')] };
const DEFAULT_B: ScenarioState = { rows: [newRow('ammonium_nitrate')] };

/**
 * Tool 18 — Fertilizer Carbon Footprint
 */
export function FertilizerCarbonFootprint() {
  const [a, setA] = useState<ScenarioState>(DEFAULT_A);
  const [b, setB] = useState<ScenarioState>(DEFAULT_B);

  const calcRows = useMemo(() => {
    const calc = (s: ScenarioState) =>
      s.rows.map(r => ({ row: r, res: computeCarbonRow(r) }));
    return { a: calc(a), b: calc(b) };
  }, [a, b]);

  const totals = useMemo(() => {
    const sum = (arr: { res: CarbonResult }[]) =>
      arr.reduce(
        (acc, x) => {
          acc.mfg += x.res.mfg;
          acc.transport += x.res.transport;
          acc.field += x.res.field;
          acc.total += x.res.total;
          return acc;
        },
        { mfg: 0, transport: 0, field: 0, total: 0 },
      );
    return { a: sum(calcRows.a), b: sum(calcRows.b) };
  }, [calcRows]);

  const maxTotal = Math.max(totals.a.total, totals.b.total, 1);
  const diff = totals.b.total - totals.a.total;
  const lower = diff > 0 ? 'A' : diff < 0 ? 'B' : 'tie';
  const pct = maxTotal > 0 ? Math.abs(diff) / maxTotal * 100 : 0;

  const updateRow = (which: 'a' | 'b', idx: number, patch: Partial<CarbonRow>) => {
    const set = which === 'a' ? setA : setB;
    set(prev => ({
      ...prev,
      rows: prev.rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    }));
  };

  const addRow = (which: 'a' | 'b') => {
    const set = which === 'a' ? setA : setB;
    set(prev => prev.rows.length < 5 ? { ...prev, rows: [...prev.rows, newRow('urea')] } : prev);
  };

  const removeRow = (which: 'a' | 'b', idx: number) => {
    const set = which === 'a' ? setA : setB;
    set(prev => prev.rows.length > 1
      ? { ...prev, rows: prev.rows.filter((_, i) => i !== idx) }
      : prev);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Fertilizer Carbon Footprint</CardTitle>
        <p className="text-xs text-muted-foreground">
          Compare two fertilization programs. Manufacturing (Fertilizers Europe 2020) + transport (DEFRA 2024) + field N₂O (IPCC 2006).
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comparison bar */}
        <div className="rounded-lg border border-border/60 p-3 space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span>Scenario A: <span className="tabular-nums">{totals.a.total.toFixed(1)}</span> kg CO₂e/ha</span>
            <span>Scenario B: <span className="tabular-nums">{totals.b.total.toFixed(1)}</span> kg CO₂e/ha</span>
          </div>
          <div className="space-y-1">
            <CompareBar label="A" total={totals.a.total} max={maxTotal} color="#2563eb" />
            <CompareBar label="B" total={totals.b.total} max={maxTotal} color="#ea580c" />
          </div>
          <div className="text-xs text-center pt-1">
            {lower === 'tie' ? (
              <span className="text-muted-foreground">Both scenarios are equal.</span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400">
                Scenario <strong>{lower}</strong> is lower by <strong className="tabular-nums">{Math.abs(diff).toFixed(1)}</strong> kg CO₂e/ha ({pct.toFixed(1)}%).
              </span>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <ScenarioEditor
            title="Scenario A"
            tone="#2563eb"
            scenario={a}
            rows={calcRows.a}
            totals={totals.a}
            maxTotal={maxTotal}
            onUpdate={(i, p) => updateRow('a', i, p)}
            onAdd={() => addRow('a')}
            onRemove={i => removeRow('a', i)}
          />
          <ScenarioEditor
            title="Scenario B"
            tone="#ea580c"
            scenario={b}
            rows={calcRows.b}
            totals={totals.b}
            maxTotal={maxTotal}
            onUpdate={(i, p) => updateRow('b', i, p)}
            onAdd={() => addRow('b')}
            onRemove={i => removeRow('b', i)}
          />
        </div>

        <p className="text-[10px] text-muted-foreground italic">
          Pickup-km equivalence uses DESNZ/DEFRA 2024 factor: 0.254 kg CO₂e/km.
        </p>
      </CardContent>
    </Card>
  );
}

function CompareBar({ label, total, max, color }: { label: string; total: number; max: number; color: string }) {
  const w = max > 0 ? Math.max(2, (total / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] w-3 text-muted-foreground">{label}</span>
      <div className="flex-1 h-3 rounded-full bg-muted/40 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${w}%`, background: color }} />
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground w-12 text-right">{total.toFixed(0)}</span>
    </div>
  );
}

function StackedBreakdown({ t, max }: { t: { mfg: number; transport: number; field: number; total: number }; max: number }) {
  const segs = [
    { v: t.mfg, color: '#1e3a8a', label: 'mfg' },
    { v: t.transport, color: '#0891b2', label: 'transport' },
    { v: t.field, color: '#16a34a', label: 'field' },
  ];
  return (
    <div className="space-y-1">
      <div className="flex h-3 rounded-full overflow-hidden bg-muted/40">
        {segs.map(s => (
          <div key={s.label}
            style={{
              width: `${max > 0 ? (s.v / max) * 100 : 0}%`,
              background: s.color,
            }}
            title={`${s.label}: ${s.v.toFixed(2)} kg CO₂e/ha`}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>mfg <span className="tabular-nums">{t.mfg.toFixed(1)}</span></span>
        <span>transport <span className="tabular-nums">{t.transport.toFixed(1)}</span></span>
        <span>field <span className="tabular-nums">{t.field.toFixed(1)}</span></span>
      </div>
    </div>
  );
}

function ScenarioEditor({
  title, tone, rows, totals, maxTotal, onUpdate, onAdd, onRemove,
}: {
  title: string;
  tone: string;
  scenario: ScenarioState;
  rows: { row: CarbonRow; res: CarbonResult }[];
  totals: { mfg: number; transport: number; field: number; total: number };
  maxTotal: number;
  onUpdate: (i: number, p: Partial<CarbonRow>) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="rounded-lg border border-border/60 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold" style={{ color: tone }}>{title}</h4>
        <Button size="sm" variant="outline" onClick={onAdd} disabled={rows.length >= 5}>+ Row</Button>
      </div>
      {rows.map(({ row, res }, i) => (
        <div key={row.id} className="rounded-md border border-border/40 p-2 space-y-1.5 text-xs">
          <div className="flex gap-2 items-center">
            <Select value={row.fertilizerId} onValueChange={v => onUpdate(i, { fertilizerId: v })}>
              <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CARBON_FACTORS.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <button
              onClick={() => onRemove(i)}
              className="text-muted-foreground hover:text-destructive px-1"
              aria-label="Remove row"
              disabled={rows.length <= 1}
            >×</button>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <NumCell label="Rate (kg/ha)" value={row.rateKgPerHa} onChange={v => onUpdate(i, { rateKgPerHa: v })} />
            <NumCell label="Origin road km" value={row.originKm} onChange={v => onUpdate(i, { originKm: v })} />
            <NumCell label="Sea km" value={row.seaKm} onChange={v => onUpdate(i, { seaKm: v })} />
            <NumCell label="Port road km" value={row.portKm} onChange={v => onUpdate(i, { portKm: v })} />
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-[10px] text-muted-foreground pt-0.5">
            <span>mfg: <span className="tabular-nums font-medium text-foreground">{res.mfg.toFixed(2)}</span></span>
            <span>transport: <span className="tabular-nums font-medium text-foreground">{res.transport.toFixed(2)}</span></span>
            <span>field: <span className="tabular-nums font-medium text-foreground">{res.field.toFixed(2)}</span></span>
            <span>total: <span className="tabular-nums font-bold" style={{ color: tone }}>{res.total.toFixed(2)}</span></span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            Pickup-km equivalent: <span className="tabular-nums font-medium text-foreground">{res.pickupKm.toFixed(0)} km</span>
          </div>
        </div>
      ))}
      <div className="pt-1">
        <div className="flex justify-between text-xs font-medium mb-1">
          <span>Total</span>
          <span className="tabular-nums" style={{ color: tone }}>{totals.total.toFixed(1)} kg CO₂e/ha</span>
        </div>
        <StackedBreakdown t={totals} max={maxTotal} />
      </div>
    </div>
  );
}

function NumCell({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <Label className="text-[9px] text-muted-foreground block leading-none mb-0.5">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="h-7 text-xs px-1.5"
      />
    </div>
  );
}
