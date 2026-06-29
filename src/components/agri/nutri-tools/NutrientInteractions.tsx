'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ION_SPEC, ROOT_ARRIVAL, MOBILITY_INFO, EL_NAMES, PH_NUTRIENTS,
} from '@/lib/nutri-tools-data';

const TABS = [
  { id: 'mulder',   label: 'Mulder Diagram' },
  { id: 'arrival',  label: 'Root Arrival' },
  { id: 'mobility', label: 'Mobility' },
  { id: 'ph',       label: 'pH Availability' },
] as const;

type TabId = typeof TABS[number]['id'];

const MOB_GROUPS = [
  { title: 'Mobile (old leaves first)',     syms: ['N','P','K','Mg','Mo'],            color: '#16a34a' },
  { title: 'Immobile (young leaves first)', syms: ['S','Fe','Mn','Zn','Cu','Ca','B'], color: '#ea580c' },
  { title: 'Very immobile (meristems/fruits)', syms: ['Ca','B'],                       color: '#dc2626' },
];

/**
 * Tool 13 — Nutrient Interactions & Mobility
 * Four-tab educational reference: Mulder diagram, root arrival mechanisms,
 * mobility & symptoms, pH vs availability.
 */
export function NutrientInteractions() {
  const [tab, setTab] = useState<TabId>('mulder');
  const [selIon, setSelIon] = useState('no3');
  const [selArrival, setSelArrival] = useState('h2po4');
  const [selMob, setSelMob] = useState('N');
  const [selPh, setSelPh] = useState('P');

  // Mulder diagram positions
  const cx = 130, cy = 130, r = 100;
  const positions = ION_SPEC.map((ion, i) => {
    const ang = -Math.PI / 2 + (i / ION_SPEC.length) * 2 * Math.PI;
    return { id: ion.id, x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) };
  });
  const posById = (id: string) => positions.find(p => p.id === id)!;
  const sel = ION_SPEC.find(i => i.id === selIon)!;

  // Antagonism edges (bidirectional)
  const antEdges: [string, string][] = [];
  for (const ion of ION_SPEC) {
    for (const a of ion.antagonists) {
      const k = [ion.id, a].sort().join('|');
      if (!antEdges.some(e => [e[0], e[1]].sort().join('|') === k)) {
        antEdges.push([ion.id, a]);
      }
    }
  }
  // Synergy edges (directional — only from focused)
  const synEdgesFromSel = sel.synergists.map(s => [sel.id, s] as [string, string]);

  const arrivalRow = ROOT_ARRIVAL.find(a => a.id === selArrival)!;
  const mobInfo = MOBILITY_INFO[selMob];
  const phInfo = PH_NUTRIENTS.find(p => p.id === selPh)!;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Nutrient Interactions & Mobility</CardTitle>
          <div className="flex gap-1 flex-wrap">
            {TABS.map(t => (
              <Button key={t.id} size="sm" variant={tab === t.id ? 'default' : 'outline'} onClick={() => setTab(t.id)}>{t.label}</Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {tab === 'mulder' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <svg viewBox="0 0 260 260" className="w-full max-w-md mx-auto">
                {/* Edges */}
                {antEdges.map(([a, b], i) => {
                  const pa = posById(a), pb = posById(b);
                  const isHi = selIon === a || selIon === b;
                  const isAnt = sel.antagonists.includes(a) || sel.antagonists.includes(b);
                  return <line key={`ant-${i}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                    stroke={isAnt ? '#dc2626' : '#cbd5e1'} strokeWidth={isAnt ? 2 : 1}
                    strokeOpacity={isHi || isAnt ? 0.9 : 0.3} />;
                })}
                {synEdgesFromSel.map(([a, b], i) => {
                  const pa = posById(a), pb = posById(b);
                  return <line key={`syn-${i}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                    stroke="#2563eb" strokeWidth={2} strokeDasharray="4 2" />;
                })}
                {/* Nodes */}
                {ION_SPEC.map(ion => {
                  const p = posById(ion.id);
                  const isSel = ion.id === selIon;
                  const dim = selIon !== ion.id && !sel.antagonists.includes(ion.id) && !sel.synergists.includes(ion.id);
                  return (
                    <g key={ion.id} onClick={() => setSelIon(ion.id)} style={{ cursor: 'pointer', opacity: dim ? 0.45 : 1 }}>
                      <circle cx={p.x} cy={p.y} r={isSel ? 22 : 18} fill={isSel ? '#16a34a' : '#fff'}
                        stroke={isSel ? '#15803d' : '#94a3b8'} strokeWidth={isSel ? 2 : 1} />
                      <text x={p.x} y={p.y + 1} textAnchor="middle" dominantBaseline="middle"
                        fontSize="8" fontWeight="bold" fill={isSel ? '#fff' : '#0f172a'}>{ion.ion}</text>
                    </g>
                  );
                })}
              </svg>
              <div className="flex flex-wrap gap-3 justify-center text-[11px] mt-2">
                <div className="flex items-center gap-1"><div className="w-4 h-0.5 bg-red-500"></div><span>Antagonism</span></div>
                <div className="flex items-center gap-1"><div className="w-4 h-0.5 bg-blue-600 border-t border-dashed"></div><span>Synergy (from selected)</span></div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-bold">{sel.ion} — {sel.name}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-red-600 mb-1">Antagonists</div>
                <div className="flex flex-wrap gap-1">
                  {sel.antagonists.map(a => {
                    const ion = ION_SPEC.find(i => i.id === a)!;
                    return <button key={a} onClick={() => setSelIon(a)} className="text-xs px-2 py-0.5 rounded border bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-900 text-red-700 dark:text-red-300 hover:bg-red-100">{ion.ion}</button>;
                  })}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-blue-600 mb-1">Synergists</div>
                <div className="flex flex-wrap gap-1">
                  {sel.synergists.length === 0 ? <span className="text-xs text-muted-foreground">None</span> :
                    sel.synergists.map(s => {
                      const ion = ION_SPEC.find(i => i.id === s)!;
                      return <button key={s} onClick={() => setSelIon(s)} className="text-xs px-2 py-0.5 rounded border bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-100">{ion.ion}</button>;
                    })}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-emerald-600 mb-1">Functional relations</div>
                <ul className="text-xs space-y-0.5 list-disc pl-4">
                  {sel.functional.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
              <div className="rounded p-2 bg-muted/40 text-xs text-muted-foreground">{sel.shortTip}</div>
            </div>
          </div>
        )}

        {tab === 'arrival' && (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">Contribution of mass-flow / diffusion / root-interception to nutrient arrival at the root.</div>
            <div className="space-y-1">
              {ROOT_ARRIVAL.map(row => {
                const isSel = row.id === selArrival;
                return (
                  <button key={row.id} onClick={() => setSelArrival(row.id)}
                    className={`w-full text-left rounded border p-2 transition-all ${isSel ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30' : 'border-border hover:border-emerald-300'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{row.lab} — {row.name}</span>
                      <span className="text-[10px] text-muted-foreground">{row.dom}</span>
                    </div>
                    <div className="flex h-3 rounded overflow-hidden">
                      <div style={{ width: `${row.mf}%`, background: '#2563eb' }} title={`Mass flow ${row.mf}%`} />
                      <div style={{ width: `${row.dif}%`, background: '#16a34a' }} title={`Diffusion ${row.dif}%`} />
                      <div style={{ width: `${row.int}%`, background: '#ea580c' }} title={`Interception ${row.int}%`} />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                      <span>MF {row.mf}%</span><span>Dif {row.dif}%</span><span>Int {row.int}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="rounded-lg p-3 bg-muted/40">
              <div className="text-sm font-bold mb-1">{arrivalRow.lab} — {arrivalRow.name}</div>
              <div className="text-xs space-y-1 text-muted-foreground">
                <div><strong>Dominant mechanism:</strong> {arrivalRow.dom}</div>
                <div><strong>What it means:</strong> {arrivalRow.mean}</div>
                <div><strong>Depends on:</strong> {arrivalRow.dep}</div>
                <div><strong>Common risk:</strong> {arrivalRow.risk}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-[11px]">
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-600 rounded-sm" /><span>Mass flow</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-600 rounded-sm" /><span>Diffusion</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-600 rounded-sm" /><span>Root interception</span></div>
            </div>
          </div>
        )}

        {tab === 'mobility' && (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-3 gap-2">
              {MOB_GROUPS.map(group => (
                <div key={group.title} className="rounded-lg p-2 border" style={{ borderColor: group.color + '60' }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: group.color }}>{group.title}</div>
                  <div className="flex flex-wrap gap-1">
                    {group.syms.map(s => (
                      <button key={s} onClick={() => setSelMob(s)}
                        className={`text-xs px-2 py-0.5 rounded border ${selMob === s ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-400 text-emerald-700 dark:text-emerald-300' : 'bg-muted/40 border-border'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {mobInfo && (
              <div className="rounded-lg p-3 border bg-muted/40">
                <div className="text-sm font-bold mb-2">{selMob} — {EL_NAMES[selMob]}</div>
                <div className="grid sm:grid-cols-2 gap-2 text-xs mb-3">
                  <div><strong className="text-muted-foreground">Mobility:</strong> {mobInfo.mob}</div>
                  <div><strong className="text-muted-foreground">Symptoms first:</strong> {mobInfo.where}</div>
                </div>
                <div className="text-xs mb-2"><strong className="text-muted-foreground">Common symptom:</strong> {mobInfo.sym}</div>
                <div className="text-xs mb-2">
                  <div className="text-muted-foreground mb-1">Main functions</div>
                  <ul className="space-y-1">
                    {mobInfo.functions.map((f, i) => (
                      <li key={i} className="pl-2 border-l-2 border-emerald-400">
                        <div className="font-medium">{f.text}</div>
                        <div className="text-muted-foreground text-[11px]">{f.detail}</div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-xs rounded p-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                  💡 {mobInfo.tip}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'ph' && (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">Relative nutrient availability across pH 4–9. Click a row to see chemistry notes.</div>
            <div className="space-y-1">
              {PH_NUTRIENTS.map(n => {
                const isSel = n.id === selPh;
                const path = n.points.map(([pH, av], i) => {
                  const x = ((pH - 4) / 5) * 100;
                  const y = 40 - av * 32;
                  return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
                }).join(' ');
                return (
                  <button key={n.id} onClick={() => setSelPh(n.id)}
                    className={`w-full text-left grid grid-cols-[60px_1fr_60px] gap-2 items-center rounded border p-1.5 transition-all ${isSel ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30' : 'border-border hover:border-emerald-300'}`}>
                    <div className="text-xs font-bold" style={{ color: n.color }}>{n.lab}</div>
                    <svg viewBox="0 0 100 44" className="w-full h-8">
                      {/* Ideal band pH 5.5-7 */}
                      <rect x={((5.5 - 4) / 5) * 100} y="2" width={((7 - 5.5) / 5) * 100} height="40" fill="rgba(100,116,139,0.12)" />
                      <path d={`${path} L100,42 L0,42 Z`} fill={n.color + '20'} />
                      <path d={path} stroke={n.color} strokeWidth="1.3" fill="none" />
                    </svg>
                    <div className="text-[10px] text-muted-foreground text-right">{n.tag}</div>
                  </button>
                );
              })}
            </div>
            {phInfo && (
              <div className="rounded-lg p-3 border bg-muted/40">
                <div className="flex items-baseline justify-between mb-1">
                  <div className="text-sm font-bold" style={{ color: phInfo.color }}>{phInfo.lab} — {phInfo.name}</div>
                </div>
                <div className="text-xs mb-2">{phInfo.intro}</div>
                <ul className="text-xs space-y-0.5 list-disc pl-4" dangerouslySetInnerHTML={{ __html: phInfo.bullets.map(b => `<li>${b}</li>`).join('') }} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
