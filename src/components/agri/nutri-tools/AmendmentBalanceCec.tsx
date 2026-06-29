'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import {
  BASE_AMENDMENTS, CATION_LABELS, EQUIV_WEIGHTS, IDEAL_CATION_RANGES, phIndicator,
} from '@/lib/nutri-tools-data';
import { CropPresetDropdown } from './CropPresetDropdown';
import type { CropPreset } from '@/lib/crop-presets';
import { useBridgePayload } from '@/lib/use-bridge-payload';

/**
 * Tool 7 — Amendment Balance by CEC
 */
export function AmendmentBalanceCec() {
  const [initial, setInitial] = useState<Record<string, string>>({
    k: '0.3', ca: '8', mg: '1.5', h: '0.5', na: '0.2', al: '0',
  });
  const [target, setTarget] = useState<Record<string, string>>({});
  const [density, setDensity] = useState('1.1');
  const [depth, setDepth] = useState('30');
  const [ph, setPh] = useState('');
  const [reach, setReach] = useState('100');
  const [preset, setPreset] = useState<CropPreset | null>(null);

  // "Send to" bridge — receive cation values + pH from Field Data Capture.
  const bridgePayload = useBridgePayload('amendment-balance');
  const [bridgeBanner, setBridgeBanner] = useState<{ count: number } | null>(null);
  useEffect(() => {
    if (!bridgePayload) return;
    const v = bridgePayload.values;
    const num = (k: string): number =>
      typeof v[k] === 'number' ? (v[k] as number) : parseFloat(String(v[k] ?? '0')) || 0;
    const cationKeys = ['k', 'ca', 'mg', 'h', 'na', 'al'] as const;
    const next: Record<string, string> = { ...initial };
    let count = 0;
    for (const c of cationKeys) {
      const val = num(c);
      if (Number.isFinite(val) && val >= 0) {
        next[c] = String(val);
        if (val > 0) count++;
      }
    }
    setInitial(next);
    const phVal = num('ph');
    if (phVal > 0) {
      setPh(String(phVal));
      count++;
    }
    setBridgeBanner({ count });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bridgePayload]);

  const applyCropPreset = (p: CropPreset) => {
    // Per spec: read-only display — does not modify the existing target inputs.
    setPreset(p);
  };

  const cations = ['k', 'ca', 'mg', 'h', 'na', 'al'] as const;

  const parsed = useMemo(() => {
    const out: Record<string, number> = {};
    for (const c of cations) out[c] = parseFloat(initial[c] || '0') || 0;
    return out;
  }, [initial]);

  const cic = parsed.k + parsed.ca + parsed.mg + parsed.h + parsed.na + parsed.al;

  // Auto-compute ideal targets (Ca=75%, K=5%, Mg=15% of CEC, others=0)
  const autoTargets = useMemo(() => {
    return {
      k: Math.round(cic * 0.05 * 100) / 100,
      ca: Math.round(cic * 0.75 * 100) / 100,
      mg: Math.round(cic * 0.15 * 100) / 100,
      h: 0, na: 0, al: 0,
    } as Record<string, number>;
  }, [cic]);

  // Apply auto targets if user hasn't entered
  const effectiveTargets = useMemo(() => {
    const out: Record<string, number> = {};
    for (const c of cations) {
      const t = parseFloat(target[c] || '');
      out[c] = Number.isFinite(t) ? t : (autoTargets[c] - parsed[c]);
    }
    return out;
  }, [target, autoTargets, parsed]);

  const densityN = parseFloat(density) || 1.1;
  const depthN = parseFloat(depth) || 30;
  const phN = parseFloat(ph) || 0;
  const reachN = Math.min(100, Math.max(10, parseFloat(reach) || 100));
  const factor = reachN / 100;

  const phInd = phIndicator(phN);

  const meqToKgHa = (meq: number, eqWeight: number) =>
    meq * eqWeight * 10 * (100 * 100 * (depthN / 100) * densityN) / 1000;

  // Strategy: dolomite first (if ca+mg both needed), then gypsum/lime for ca, mgso4 for mg, sop for k, gypsum for so4
  const selected = BASE_AMENDMENTS;
  const strategy = useMemo(() => {
    const out: { amendment: typeof BASE_AMENDMENTS[0]; dosis: number; ca: number; mg: number; k: number; so4: number; si: number }[] = [];
    let caRest = Math.max(0, effectiveTargets.ca);
    let mgRest = Math.max(0, effectiveTargets.mg);
    const kRest = Math.max(0, effectiveTargets.k);
    const naExcess = effectiveTargets.na < 0 ? Math.abs(effectiveTargets.na) : 0;

    const dolomite = selected.find(a => a.id === 'dolomite');
    const gypsum = selected.find(a => a.id === 'gypsum');
    const lime = selected.find(a => a.id === 'lime');
    const mgso4 = selected.find(a => a.id === 'mgso4-mono');
    const sop = selected.find(a => a.id === 'sop-granular');

    if (dolomite && caRest > 0 && mgRest > 0) {
      const caKg = meqToKgHa(caRest, EQUIV_WEIGHTS.ca);
      const mgKg = meqToKgHa(mgRest, EQUIV_WEIGHTS.mg);
      const caAmt = caKg / (dolomite.ca / 100);
      const mgAmt = mgKg / (dolomite.mg / 100);
      const dosis = Math.max(caAmt, mgAmt);
      out.push({ amendment: dolomite, dosis, ca: dosis * dolomite.ca/100, mg: dosis * dolomite.mg/100, k: 0, so4: 0, si: 0 });
      caRest = Math.max(0, caRest - (dosis * dolomite.ca / 100) / (EQUIV_WEIGHTS.ca * 10 * (100 * 100 * (depthN / 100) * densityN) / 1000) / 1000);
      mgRest = Math.max(0, mgRest - (dosis * dolomite.mg / 100) / (EQUIV_WEIGHTS.mg * 10 * (100 * 100 * (depthN / 100) * densityN) / 1000) / 1000);
    }
    if (caRest > 0 && gypsum) {
      const caKg = meqToKgHa(caRest, EQUIV_WEIGHTS.ca);
      const dosis = caKg / (gypsum.ca / 100);
      out.push({ amendment: gypsum, dosis, ca: dosis * gypsum.ca/100, mg: 0, k: 0, so4: dosis * gypsum.so4/100, si: 0 });
      caRest = 0;
    } else if (caRest > 0 && lime) {
      const caKg = meqToKgHa(caRest, EQUIV_WEIGHTS.ca);
      const dosis = caKg / (lime.ca / 100);
      out.push({ amendment: lime, dosis, ca: dosis * lime.ca/100, mg: 0, k: 0, so4: 0, si: 0 });
      caRest = 0;
    }
    if (mgRest > 0 && mgso4) {
      const mgKg = meqToKgHa(mgRest, EQUIV_WEIGHTS.mg);
      const dosis = mgKg / (mgso4.mg / 100);
      out.push({ amendment: mgso4, dosis, ca: 0, mg: dosis * mgso4.mg/100, k: 0, so4: dosis * mgso4.so4/100, si: 0 });
      mgRest = 0;
    }
    if (kRest > 0 && sop) {
      const kKg = meqToKgHa(kRest, EQUIV_WEIGHTS.k);
      const dosis = kKg / (sop.k / 100);
      out.push({ amendment: sop, dosis, ca: 0, mg: 0, k: dosis * sop.k/100, so4: dosis * sop.so4/100, si: 0 });
    }
    // Na excess → gypsum for displacement
    if (naExcess > 0 && gypsum) {
      const dosis = naExcess / (gypsum.so4 / 100) * 100; // simplified
      out.push({ amendment: gypsum, dosis, ca: dosis * gypsum.ca/100, mg: 0, k: 0, so4: dosis * gypsum.so4/100, si: 0 });
    }
    return out.filter(s => s.dosis >= 100);
  }, [effectiveTargets, selected, densityN, depthN]);

  const reset = () => {
    setInitial({ k: '0', ca: '0', mg: '0', h: '0', na: '0', al: '0' });
    setTarget({});
    setDensity('1.1'); setDepth('30'); setPh(''); setReach('100');
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2 flex-wrap">
        <div>
          <CardTitle className="text-base">Amendment Balance by CEC</CardTitle>
          <p className="text-xs text-muted-foreground">Soil cation analysis → amendment doses (kg/ha).</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <CropPresetDropdown onSelect={applyCropPreset} value={preset?.id ?? null} />
          <Button size="sm" variant="outline" onClick={reset}>Reset</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {bridgeBanner && (
          <div className="rounded-md border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 flex items-start gap-2">
            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-emerald-800 dark:text-emerald-200 flex-1 leading-snug">
              Received from <strong>Field Data Capture</strong>:{' '}
              {bridgeBanner.count} {bridgeBanner.count === 1 ? 'value' : 'values'} —
              cations and pH updated.
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
        {preset && (
          <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-3 space-y-2">
            <div className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Target base saturation — {preset.emoji} {preset.name} (read-only reference)
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md border border-emerald-200/60 dark:border-emerald-800/60 bg-background/60 p-2 text-center">
                <div className="text-[10px] text-muted-foreground">Ca target</div>
                <div className="text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">{preset.amendment.targetPct.ca}%</div>
              </div>
              <div className="rounded-md border border-emerald-200/60 dark:border-emerald-800/60 bg-background/60 p-2 text-center">
                <div className="text-[10px] text-muted-foreground">Mg target</div>
                <div className="text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">{preset.amendment.targetPct.mg}%</div>
              </div>
              <div className="rounded-md border border-emerald-200/60 dark:border-emerald-800/60 bg-background/60 p-2 text-center">
                <div className="text-[10px] text-muted-foreground">K target</div>
                <div className="text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">{preset.amendment.targetPct.k}%</div>
              </div>
            </div>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-200 leading-relaxed">{preset.amendment.notes}</p>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left column: cation inputs + soil properties + pH indicator */}
          <div className="space-y-3">
            <div className="rounded-lg p-3 bg-muted/40">
              <div className="grid grid-cols-6 gap-2 text-center">
                {cations.map(c => {
                  const val = parsed[c];
                  const pct = cic > 0 ? (val / cic) * 100 : 0;
                  const range = IDEAL_CATION_RANGES[c];
                  const status = val === 0 ? 'none' : pct < range.min ? 'low' : pct > range.max ? 'high' : 'ok';
                  const color = status === 'ok' ? '#16a34a' : status === 'low' ? '#2563eb' : status === 'high' ? '#ea580c' : '#64748b';
                  return (
                    <div key={c}>
                      <Label className="text-[10px] text-muted-foreground">{CATION_LABELS[c].ion}</Label>
                      <Input
                        value={initial[c]}
                        onChange={e => setInitial(p => ({ ...p, [c]: e.target.value }))}
                        className="h-8 text-xs mt-1"
                        step="0.01"
                      />
                      <div className="text-[10px] mt-1" style={{ color }}>{pct.toFixed(1)}%</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-xs text-muted-foreground">CEC Total</span>
                <span className="font-mono font-bold text-2xl">{cic.toFixed(2)} <span className="text-xs font-normal">meq/100g</span></span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Bulk density (g/cm³)" value={density} onChange={setDensity} />
              <Field label="Effective depth (cm)" value={depth} onChange={setDepth} />
              <Field label="Soil pH (optional)" value={ph} onChange={setPh} />
              <Field label="Root reach (% of soil)" value={reach} onChange={setReach} />
            </div>

            {phN > 0 && (
              <div className="text-xs" style={{ color: phInd.color }}>
                pH indicator: <strong>{phInd.label}</strong>
              </div>
            )}
          </div>

          {/* Right column: amendment strategy table or empty state */}
          <div>
            {strategy.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[200px] text-sm text-muted-foreground bg-muted/30 rounded-lg border border-dashed">No amendments needed with the selected inputs.</div>
            ) : (
              <div className="rounded-lg p-3 border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Recommended amendment strategy</div>
                <table className="w-full text-sm">
                  <thead className="text-[10px] uppercase text-muted-foreground">
                    <tr className="border-b">
                      <th className="py-1 text-left">Amendment</th>
                      <th className="py-1 text-right">Dose (kg/ha)</th>
                      <th className="py-1 text-right">Ca</th>
                      <th className="py-1 text-right">Mg</th>
                      <th className="py-1 text-right">K</th>
                      <th className="py-1 text-right">SO₄</th>
                    </tr>
                  </thead>
                  <tbody>
                    {strategy.map((s, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-1.5">{s.amendment.name}<div className="text-[10px] text-muted-foreground font-mono">{s.amendment.formula}</div></td>
                        <td className="py-1.5 text-right font-mono">{(s.dosis * factor).toFixed(0)}</td>
                        <td className="py-1.5 text-right font-mono text-xs">{(s.ca * factor).toFixed(1)}</td>
                        <td className="py-1.5 text-right font-mono text-xs">{(s.mg * factor).toFixed(1)}</td>
                        <td className="py-1.5 text-right font-mono text-xs">{(s.k * factor).toFixed(1)}</td>
                        <td className="py-1.5 text-right font-mono text-xs">{(s.so4 * factor).toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-[10px] text-muted-foreground mt-2">
                  Doses adjusted by root reach factor ({reachN}%).
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
