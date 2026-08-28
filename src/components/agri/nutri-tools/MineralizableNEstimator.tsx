'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { TMIN_PRESETS, ROOT_REACH_BY_SYSTEM } from '@/lib/nutri-tools-data';
import { AnimatedCounter } from './AnimatedCounter';

/**
 * Tool 14 — Mineralizable N Estimation
 */

interface MineralNExample {
  label: string;
  mo: string;
  da: string;
  p: string;
  r: string;
  tmin: string;
}

const MINERAL_N_EXAMPLES: MineralNExample[] = [
  { label: 'Loamy soil 2% OM', mo: '2',   da: '1.3', p: '30', r: '80', tmin: '2' },
  { label: 'Sandy poor soil',  mo: '0.8', da: '1.5', p: '20', r: '60', tmin: '1' },
  { label: 'Rich clayey',      mo: '3.5', da: '1.1', p: '40', r: '90', tmin: '3' },
];

export function MineralizableNEstimator() {
  const [mo, setMo] = useState('2');
  const [da, setDa] = useState('1.20');
  const [p, setP] = useState('30');
  const [r, setR] = useState('70');
  const [nmo, setNmo] = useState('5');
  const [tmin, setTmin] = useState('2');

  const applyExample = (ex: MineralNExample) => {
    setMo(ex.mo);
    setDa(ex.da);
    setP(ex.p);
    setR(ex.r);
    setTmin(ex.tmin);
  };

  const MO = parseFloat(mo) || 0;
  const DA = parseFloat(da) || 0;
  const Pn = parseFloat(p) || 0;
  const R = Math.min(100, Math.max(1, parseFloat(r) || 0));
  const Nmo = Math.min(100, Math.max(0.1, parseFloat(nmo) || 0));
  const Tmin = Math.min(3, Math.max(1, parseFloat(tmin) || 0));

  const Mtotal = 10000 * (Pn / 100) * DA * 1000;
  const Meff = Mtotal * (R / 100);
  const MOkg = Meff * (MO / 100);
  const Norg = MOkg * (Nmo / 100);
  const Nmin = Norg * (Tmin / 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Mineralizable N Estimation</CardTitle>
        <p className="text-xs text-muted-foreground">Annual N release from soil organic matter (kg N/ha/year).</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left column: inputs */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Soil organic matter (%)" value={mo} onChange={setMo} />
              <Field label="Bulk density (g/cm³)" value={da} onChange={setDa} />
              <Field label="Effective depth (cm)" value={p} onChange={setP} />
              <Field label="Root exploration (%)" value={r} onChange={setR} />
              <Field label="N fraction in OM (%)" value={nmo} onChange={setNmo} />
              <div>
                <Label className="text-xs">Mineralization rate T_min (%)</Label>
                <Input value={tmin} onChange={e => setTmin(e.target.value)} className="h-9 mt-1" step="0.1" />
                <div className="flex gap-1 mt-1">
                  {TMIN_PRESETS.map(preset => (
                    <button
                      key={preset.tmin}
                      onClick={() => setTmin(String(preset.tmin))}
                      className={`text-[10px] px-2 py-0.5 rounded border ${Math.abs(parseFloat(tmin) - preset.tmin) < 0.05 ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-400 text-emerald-700 dark:text-emerald-300' : 'bg-muted/40 border-border'}`}
                      title={preset.title}
                    >{preset.tmin}%</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Worked-example chips */}
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Try an example</div>
              <div className="flex flex-wrap gap-1.5">
                {MINERAL_N_EXAMPLES.map(ex => (
                  <button
                    key={ex.label}
                    type="button"
                    onClick={() => applyExample(ex)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: results */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <ResultCard label="Total soil mass (kg/ha)" value={Mtotal.toFixed(0)} />
              <ResultCard label="Effective soil mass (kg/ha)" value={Meff.toFixed(0)} />
              <ResultCard label="Organic matter (kg/ha)" value={MOkg.toFixed(0)} />
              <ResultCard label="Organic N (kg/ha)" value={Norg.toFixed(1)} />
            </div>

            <div className="rounded-lg p-4 bg-gradient-to-br from-emerald-600 to-green-700 text-white text-center">
              <div className="text-xs uppercase tracking-wide opacity-90">Mineralizable N (annual)</div>
              <div className="mt-1">
                <AnimatedCounter value={Nmin} decimals={2} suffix=" kg N/ha/yr" className="text-4xl font-bold" />
              </div>
              <div className="text-[11px] opacity-80 mt-1">
                T_min = {Tmin.toFixed(1)}% · OM = {MO}% · depth = {Pn} cm · reach = {R}%
              </div>
            </div>
          </div>
        </div>

        {/* Master formula — spans both columns */}
        <div className="rounded-lg p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Master formula</div>
          <div className="text-[11px] font-mono mt-1 text-muted-foreground">
            N_min = 10000 × (P/100) × DA × 1000 × (R/100) × (MO/100) × (N_MO/100) × (T_min/100)
          </div>
        </div>

        {/* Warning + root-reach reference — span both columns */}
        <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded p-2">
          ⚠️ Orientative result: sensitive to DA, depth, root %, and T_min. Validate with field observation.
        </div>

        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground">Root exploration reference by system</summary>
          <table className="w-full mt-2">
            <tbody>
              {ROOT_REACH_BY_SYSTEM.map(s => (
                <tr key={s.system} className="border-b last:border-0">
                  <td className="py-1 pr-3">{s.system}</td>
                  <td className="py-1 text-right font-mono">{s.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
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

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-3 border bg-muted/30">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold mt-0.5 font-mono">{value}</div>
    </div>
  );
}
