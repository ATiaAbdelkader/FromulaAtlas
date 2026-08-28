'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  STAGE_BASE, STAGE_OPTIONAL, STAGE_DEFAULTS, STAGE_DEFAULT_PCT, STAGE_COLORS,
} from '@/lib/nutri-tools-data';
import { CropPresetDropdown } from './CropPresetDropdown';
import type { CropPreset } from '@/lib/crop-presets';

interface NutrientRow { id: string; label: string; total: number; }

/**
 * Tool 10 — Nutrient Distribution by Stage
 */
export function NutrientDistributionByStage() {
  const [nutrients, setNutrients] = useState<NutrientRow[]>(
    STAGE_BASE.map(n => ({ ...n })),
  );
  const [stages, setStages] = useState<string[]>([...STAGE_DEFAULTS]);
  // pct[nutrientId] = number[] (one per stage)
  const [pct, setPct] = useState<Record<string, number[]>>(() => {
    const out: Record<string, number[]> = {};
    for (const n of STAGE_BASE) out[n.id] = [...STAGE_DEFAULT_PCT[n.id]];
    return out;
  });
  const [preset, setPreset] = useState<CropPreset | null>(null);

  const applyCropPreset = (p: CropPreset) => {
    setPreset(p);
    const nd = p.nutrientDistribution;
    const totalsLookup = nd.totals as Record<string, number | undefined>;
    const baseRows: NutrientRow[] = STAGE_BASE.map(n => ({
      id: n.id,
      label: n.label,
      total: totalsLookup[n.id] ?? n.total,
    }));
    const optRows: NutrientRow[] = STAGE_OPTIONAL
      .filter(n => totalsLookup[n.id] != null)
      .map(n => ({
        id: n.id,
        label: n.label,
        total: totalsLookup[n.id] ?? 0,
      }));
    const allRows = [...baseRows, ...optRows];
    setNutrients(allRows);
    setStages([...nd.stages]);
    const newPct: Record<string, number[]> = {};
    for (const row of allRows) {
      const arr = nd.pct[row.id];
      newPct[row.id] = arr ? [...arr] : Array(nd.stages.length).fill(0);
    }
    setPct(newPct);
  };

  const ensureLength = (arr: number[], len: number) => {
    if (arr.length === len) return arr;
    if (arr.length < len) return [...arr, ...Array(len - arr.length).fill(0)];
    return arr.slice(0, len);
  };

  const setCell = (nutId: string, stageIdx: number, v: number) => {
    setPct(prev => {
      const cur = ensureLength(prev[nutId] || [], stages.length);
      const next = [...cur];
      next[stageIdx] = v;
      return { ...prev, [nutId]: next };
    });
  };

  const addNutrient = () => {
    const used = new Set(nutrients.map(n => n.id));
    const next = STAGE_OPTIONAL.find(n => !used.has(n.id));
    if (!next) return;
    setNutrients([...nutrients, { ...next }]);
    setPct(prev => ({ ...prev, [next.id]: Array(stages.length).fill(0) }));
  };

  const addStage = () => {
    if (stages.length >= 10) return;
    const newStages = [...stages, 'New stage'];
    // split last stage's percentages in half for each nutrient
    setPct(prev => {
      const out: Record<string, number[]> = {};
      for (const n of nutrients) {
        const cur = ensureLength(prev[n.id] || [], stages.length);
        const last = cur[cur.length - 1] || 0;
        const arr = [...cur];
        arr[arr.length - 1] = Math.round(last / 2 * 10) / 10;
        arr.push(Math.round(last / 2 * 10) / 10);
        out[n.id] = arr;
      }
      return out;
    });
    setStages(newStages);
  };

  const reset = () => {
    setNutrients(STAGE_BASE.map(n => ({ ...n })));
    setStages([...STAGE_DEFAULTS]);
    setPct(() => {
      const out: Record<string, number[]> = {};
      for (const n of STAGE_BASE) out[n.id] = [...STAGE_DEFAULT_PCT[n.id]];
      return out;
    });
  };

  // per-nutrient sums, per-stage totals (kg/ha), and chart series
  const computed = useMemo(() => {
    const sums: Record<string, number> = {};
    const stageTotals = Array(stages.length).fill(0);
    const series: { id: string; label: string; color: string; points: number[] }[] = [];

    nutrients.forEach((n, idx) => {
      const arr = ensureLength(pct[n.id] || [], stages.length);
      const sum = arr.reduce((a, b) => a + (b || 0), 0);
      sums[n.id] = sum;
      const kg = arr.map(p => (n.total * (p || 0)) / 100);
      kg.forEach((v, i) => { stageTotals[i] += v; });
      series.push({
        id: n.id,
        label: n.label,
        color: STAGE_COLORS[idx % STAGE_COLORS.length],
        points: kg,
      });
    });
    return { sums, stageTotals, series };
  }, [nutrients, stages, pct]);

  const maxY = Math.max(1, ...computed.series.flatMap(s => s.points));

  // Chart geometry
  const W = 480, H = 200, PADL = 36, PADR = 12, PADT = 12, PADB = 28;
  const xAt = (i: number) => PADL + (stages.length <= 1 ? (W - PADL - PADR) / 2 : (i / (stages.length - 1)) * (W - PADL - PADR));
  const yAt = (v: number) => PADT + (H - PADT - PADB) * (1 - v / maxY);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-base">Nutrient Distribution by Stage</CardTitle>
            <p className="text-xs text-muted-foreground">Edit the % of total nutrient applied at each phenological stage.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <CropPresetDropdown onSelect={applyCropPreset} value={preset?.id ?? null} />
            <Button size="sm" variant="outline" onClick={addNutrient} disabled={nutrients.length >= STAGE_BASE.length + STAGE_OPTIONAL.length}>+ Nutrient</Button>
            <Button size="sm" variant="outline" onClick={addStage} disabled={stages.length >= 10}>+ Stage</Button>
            <Button size="sm" variant="ghost" onClick={reset}>Reset</Button>
          </div>
        </div>
        {preset && (
          <div className="text-[11px] rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 px-2.5 py-1.5 mt-1">
            <strong className="font-medium">{preset.emoji} {preset.name}:</strong>{' '}
            {preset.nutrientDistribution.notes}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="px-2 py-1.5 font-semibold sticky left-0 bg-muted/40">Nutrient</th>
                <th className="px-2 py-1.5 font-semibold text-right">Total (kg/ha)</th>
                {stages.map((s, i) => (
                  <th key={i} className="px-2 py-1.5 font-semibold text-center min-w-[64px]">
                    <input
                      value={s}
                      onChange={e => setStages(stages.map((st, idx) => idx === i ? e.target.value : st))}
                      className="bg-transparent text-center w-full text-xs font-semibold outline-none focus:bg-background/60 rounded px-1"
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nutrients.map(n => {
                const arr = (pct[n.id] || Array(stages.length).fill(0));
                const sum = computed.sums[n.id] || 0;
                return (
                  <tr key={n.id} className="border-t border-border/40">
                    <td className="px-2 py-1.5 font-medium">{n.label}</td>
                    <td className="px-2 py-1.5 text-right">
                      <Input
                        type="number"
                        value={n.total}
                        onChange={e => setNutrients(nutrients.map(x => x.id === n.id ? { ...x, total: parseFloat(e.target.value) || 0 } : x))}
                        className="h-7 text-xs text-right w-20 px-1.5"
                      />
                    </td>
                    {stages.map((_, i) => (
                      <td key={i} className="px-2 py-1.5">
                        <Input
                          type="number"
                          value={arr[i] ?? 0}
                          onChange={e => setCell(n.id, i, parseFloat(e.target.value) || 0)}
                          className="h-7 text-xs text-center px-1"
                          step="1"
                          min="0"
                          max="100"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/30 font-medium">
                <td className="px-2 py-1.5" colSpan={2}>Σ per stage (kg/ha)</td>
                {computed.stageTotals.map((v, i) => (
                  <td key={i} className="px-2 py-1.5 text-center tabular-nums">{v.toFixed(1)}</td>
                ))}
              </tr>
              {/* Per-nutrient sum row */}
              {nutrients.map(n => {
                const sum = computed.sums[n.id] || 0;
                const ok = Math.abs(sum - 100) <= 5;
                return (
                  <tr key={`sum-${n.id}`} className="border-t border-border/40 text-[11px]">
                    <td className="px-2 py-1" colSpan={2}>Σ {n.label}</td>
                    <td className="px-2 py-1 text-center col-span-full" style={{ color: ok ? '#16a34a' : '#dc2626' }}>
                      <span className="font-semibold tabular-nums">{sum.toFixed(1)}%</span>
                      <span className="text-[10px] ml-1">{ok ? 'ok' : 'should = 100%'}</span>
                    </td>
                  </tr>
                );
              })}
            </tfoot>
          </table>
        </div>

        {/* SVG line chart */}
        <div className="rounded-lg border border-border/60 p-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">kg/ha per stage</div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
            {/* y gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map(f => (
              <g key={f}>
                <line x1={PADL} y1={yAt(maxY * f)} x2={W - PADR} y2={yAt(maxY * f)} stroke="#e2e8f0" strokeWidth="0.5" />
                <text x={PADL - 4} y={yAt(maxY * f) + 3} textAnchor="end" fontSize="9" fill="#94a3b8">{(maxY * f).toFixed(0)}</text>
              </g>
            ))}
            {/* x labels */}
            {stages.map((s, i) => (
              <text key={i} x={xAt(i)} y={H - 8} textAnchor="middle" fontSize="9" fill="#64748b">
                {s.length > 10 ? s.slice(0, 9) + '…' : s}
              </text>
            ))}
            {/* lines */}
            {computed.series.map(s => {
              if (s.points.length === 0) return null;
              const pts = s.points.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(' ');
              return (
                <g key={s.id}>
                  <polyline points={pts} fill="none" stroke={s.color} strokeWidth="1.75" />
                  {s.points.map((v, i) => (
                    <circle key={i} cx={xAt(i)} cy={yAt(v)} r="2.5" fill={s.color} />
                  ))}
                </g>
              );
            })}
          </svg>
          {/* legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {computed.series.map(s => (
              <span key={s.id} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
