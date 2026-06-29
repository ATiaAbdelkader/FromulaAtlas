'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import {
  HYDRO_EQ_WEIGHTS, HYDRO_MEQ_NUTRIENTS, HYDRO_NUTRIENT_LABELS, HYDRO_ANION_POLYGON,
} from '@/lib/nutri-tools-data';
import { CropPresetDropdown } from './CropPresetDropdown';
import type { CropPreset } from '@/lib/crop-presets';
import { useBridgePayload } from '@/lib/use-bridge-payload';

const ANIONS = ['N_NO3', 'P', 'S'] as const;
const CATIONS = ['K', 'Ca', 'Mg'] as const;

const PRESETS: { name: string; values: Record<string, number> }[] = [
  { name: 'Steiner solution',     values: { N_NO3: 12, P: 3,    S: 6,  Cl: 0, K: 7,  Ca: 10,  Mg: 4,   N_NH4: 0   } },
  { name: 'Hoagland 50%',         values: { N_NO3: 8,  P: 1,    S: 2,  Cl: 0, K: 6,  Ca: 8,   Mg: 2,   N_NH4: 0   } },
  { name: 'Tomato generic',       values: { N_NO3: 12, P: 1.5,  S: 4,  Cl: 0, K: 8,  Ca: 8,   Mg: 3,   N_NH4: 1   } },
  { name: 'Strawberry generic',   values: { N_NO3: 8,  P: 1.5,  S: 3,  Cl: 0, K: 5,  Ca: 5,   Mg: 2,   N_NH4: 0.5 } },
  { name: 'Lettuce generic',      values: { N_NO3: 10, P: 1.5,  S: 2,  Cl: 0, K: 6,  Ca: 5,   Mg: 1.5, N_NH4: 0   } },
];

const EMPTY: Record<string, number> = Object.fromEntries(HYDRO_MEQ_NUTRIENTS.map(n => [n, 0]));

/**
 * Tool 4 — Hydroponic Solution Designer (simplified)
 */
export function HydroSolutionDesigner() {
  const [meq, setMeq] = useState<Record<string, number>>({ ...PRESETS[0].values });
  const [preset, setPreset] = useState<CropPreset | null>(null);

  // "Send to" bridge — receive HCO₃⁻ from Water Hardness Diagnostic.
  const bridgePayload = useBridgePayload('hydro-solution');
  const [bridgeBanner, setBridgeBanner] = useState<{ hco3: number } | null>(null);
  useEffect(() => {
    if (!bridgePayload) return;
    const v = bridgePayload.values;
    const hco3 = typeof v.hco3 === 'number' ? v.hco3 : parseFloat(String(v.hco3 ?? '0')) || 0;
    if (hco3 > 0) {
      // Use the HCO₃⁻ value as a proxy anion load on Cl⁻.
      setMeq((prev) => ({ ...prev, Cl: Number(hco3.toFixed(2)) }));
      setBridgeBanner({ hco3 });
    }
  }, [bridgePayload]);

  const applyCropPreset = (p: CropPreset) => {
    setPreset(p);
    const h = p.hydroSolution;
    setMeq(prev => ({
      ...prev,
      N_NO3: h.N_NO3,
      N_NH4: h.N_NH4,
      P:     h.P,
      S:     h.S,
      K:     h.K,
      Ca:    h.Ca,
      Mg:    h.Mg,
      Cl:    h.Cl,
    }));
  };

  const setMeqValue = (key: string, v: number) => setMeq(prev => ({ ...prev, [key]: v }));
  const setPpmValue = (key: string, ppm: number) => {
    const w = HYDRO_EQ_WEIGHTS[key] || 1;
    setMeq(prev => ({ ...prev, [key]: w > 0 ? ppm / w : 0 }));
  };

  const ce = useMemo(() => {
    const sum = HYDRO_MEQ_NUTRIENTS.reduce((a, k) => a + (meq[k] || 0), 0);
    return sum / 20;
  }, [meq]);

  const anionDist = useMemo(() => {
    const sum = ANIONS.reduce((a, k) => a + (meq[k] || 0), 0);
    return {
      N_NO3: sum > 0 ? (meq.N_NO3 / sum) * 100 : 0,
      P:     sum > 0 ? (meq.P     / sum) * 100 : 0,
      S:     sum > 0 ? (meq.S     / sum) * 100 : 0,
      sum,
    };
  }, [meq]);

  const cationDist = useMemo(() => {
    const sum = CATIONS.reduce((a, k) => a + (meq[k] || 0), 0);
    return {
      K:  sum > 0 ? (meq.K  / sum) * 100 : 0,
      Ca: sum > 0 ? (meq.Ca / sum) * 100 : 0,
      Mg: sum > 0 ? (meq.Mg / sum) * 100 : 0,
      sum,
    };
  }, [meq]);

  // SVG anion triangle: top=NO3, left=P, right=S
  const toSvg = (aPct: number, bPct: number, cPct: number) => {
    const a = aPct / 100, b = bPct / 100, c = cPct / 100;
    return {
      x: 120 + (c - b) * 110,
      y: 10 + (1 - a) * 200,
    };
  };
  const marker = toSvg(anionDist.N_NO3, anionDist.P, anionDist.S);
  const polyPts = HYDRO_ANION_POLYGON
    .map(([a, b, c]) => { const p = toSvg(a, b, c); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; })
    .join(' ');

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-base">Hydroponic Solution Designer</CardTitle>
            <p className="text-xs text-muted-foreground">
              Edit meq/L or ppm for the 8 core hydro nutrients. CE = Σ meq/L ÷ 20.
            </p>
          </div>
          <CropPresetDropdown onSelect={applyCropPreset} value={preset?.id ?? null} />
        </div>
        {preset && (
          <div className="text-[11px] rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 px-2.5 py-1.5 mt-1">
            <strong className="font-medium">{preset.emoji} {preset.name}:</strong>{' '}
            {preset.hydroSolution.notes}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {bridgeBanner && (
          <div className="rounded-md border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 flex items-start gap-2">
            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-emerald-800 dark:text-emerald-200 flex-1 leading-snug">
              Received HCO₃⁻ from <strong>Water Hardness</strong>:{' '}
              {bridgeBanner.hco3.toFixed(2)} meq/L — Cl⁻ meq/L set as anion-load proxy.
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

        {/* Preset bar */}
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(p => (
            <Button
              key={p.name}
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setMeq({ ...EMPTY, ...p.values })}
            >
              {p.name}
            </Button>
          ))}
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setMeq({ ...EMPTY })}>
            Reset
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Editor table */}
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <table className="w-full text-xs">
                <thead className="bg-muted/40">
                  <tr className="text-left">
                    <th className="px-2 py-1.5 font-semibold">Nutrient</th>
                    <th className="px-2 py-1.5 font-semibold text-right">meq/L</th>
                    <th className="px-2 py-1.5 font-semibold text-right">ppm</th>
                  </tr>
                </thead>
                <tbody>
                  {HYDRO_MEQ_NUTRIENTS.map(key => {
                    const lbl = HYDRO_NUTRIENT_LABELS[key];
                    const w = HYDRO_EQ_WEIGHTS[key] || 1;
                    const m = meq[key] || 0;
                    const ppm = m * w;
                    return (
                      <tr key={key} className="border-t border-border/40">
                        <td className="px-2 py-1.5">
                          <span className="font-mono">{lbl.ion}</span>
                          <span className="text-[10px] text-muted-foreground block">{lbl.name}</span>
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            type="number"
                            value={m}
                            onChange={e => setMeqValue(key, parseFloat(e.target.value) || 0)}
                            className="h-7 text-xs text-right px-1.5"
                            step="0.1"
                            min="0"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            type="number"
                            value={ppm.toFixed(2)}
                            onChange={e => setPpmValue(key, parseFloat(e.target.value) || 0)}
                            className="h-7 text-xs text-right px-1.5"
                            step="0.1"
                            min="0"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">CE</div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {ce.toFixed(2)} <span className="text-xs font-normal">dS/m</span>
                </div>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Σ meq/L</div>
                <div className="text-2xl font-bold tabular-nums">
                  {(ce * 20).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Anion triangle + distribution */}
          <div className="space-y-3">
            <div className="rounded-lg border border-border/60 p-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 text-center">Anion triangle (% meq)</div>
              <svg viewBox="0 0 240 230" className="w-full h-auto">
                {/* triangle outline */}
                <polygon points="120,10 10,210 230,210" fill="none" stroke="#94a3b8" strokeWidth="1" />
                {/* equilibrium polygon overlay */}
                <polygon points={polyPts} fill="#10b98133" stroke="#10b981" strokeWidth="1" strokeDasharray="3,2" />
                {/* vertex labels */}
                <text x="120" y="6" textAnchor="middle" fontSize="9" fill="#475569">NO₃ {anionDist.N_NO3.toFixed(0)}%</text>
                <text x="6" y="222" textAnchor="start" fontSize="9" fill="#475569">P {anionDist.P.toFixed(0)}%</text>
                <text x="234" y="222" textAnchor="end" fontSize="9" fill="#475569">S {anionDist.S.toFixed(0)}%</text>
                {/* marker */}
                <circle cx={marker.x} cy={marker.y} r="5" fill="#ea580c" stroke="#fff" strokeWidth="1.5" />
              </svg>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <DistCard title="Anion %" dist={anionDist} keys={[...ANIONS]} tone="#2563eb" />
              <DistCard title="Cation %" dist={cationDist} keys={[...CATIONS]} tone="#ea580c" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DistCard({
  title, dist, keys, tone,
}: {
  title: string;
  dist: Record<string, number>;
  keys: string[];
  tone: string;
}) {
  const total = keys.reduce((a, k) => a + (dist[k] || 0), 0);
  return (
    <div className="rounded-lg border border-border/60 p-2.5 space-y-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className="flex h-2 rounded-full overflow-hidden bg-muted/40">
        {keys.map((k, i) => (
          <div
            key={k}
            style={{
              width: total > 0 ? `${((dist[k] || 0) / total) * 100}%` : 0,
              background: tone,
              opacity: 1 - i * 0.25,
            }}
          />
        ))}
      </div>
      <div className="space-y-0.5">
        {keys.map(k => (
          <div key={k} className="flex justify-between text-[10px]">
            <span className="text-muted-foreground font-mono">{HYDRO_NUTRIENT_LABELS[k].ion}</span>
            <span className="tabular-nums">{(dist[k] || 0).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
