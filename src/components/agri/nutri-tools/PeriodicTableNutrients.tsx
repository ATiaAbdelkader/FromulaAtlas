'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  PERIODIC_ELEMENTS, ELEMENT_DETAILS, ATOMIC_WEIGHTS,
  ESSENTIAL_ELEMENTS, BENEFICIAL_ELEMENTS, CHO_ELEMENTS,
  elementCategory, compFromFormula,
} from '@/lib/nutri-tools-data';

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  essential:  { bg: 'bg-emerald-100 dark:bg-emerald-950/60',  text: 'text-emerald-700 dark:text-emerald-300',  label: 'Essential'  },
  beneficial: { bg: 'bg-amber-100 dark:bg-amber-950/60',       text: 'text-amber-700 dark:text-amber-300',       label: 'Beneficial' },
  cho:        { bg: 'bg-sky-100 dark:bg-sky-950/60',           text: 'text-sky-700 dark:text-sky-300',           label: 'CHO'        },
  other:      { bg: 'bg-muted/60',                              text: 'text-muted-foreground',                    label: ''           },
};

/**
 * Tool 11 — Periodic Table of Essential Plant Nutrients
 * Two tabs: (1) interactive periodic table, (2) molecular weight calculator.
 */
export function PeriodicTableNutrients() {
  const [tab, setTab] = useState<'table' | 'calc'>('table');
  const [selected, setSelected] = useState('N');
  const [formula, setFormula] = useState('KNO3');
  const [result, setResult] = useState<ReturnType<typeof compFromFormula> | null>(null);

  const sel = PERIODIC_ELEMENTS.find(e => e.s === selected);
  const detail = ELEMENT_DETAILS[selected];
  const cat = elementCategory(selected);

  // Layout: periods 1-7 use rows 2-8 of the CSS grid; period 8 (lanthanides) and 9 (actinides) go to rows 9-10.
  const gridPos = (p: number, g: number) => ({
    gridColumn: g + 1,
    gridRow: p <= 7 ? p + 1 : p, // 8 → row 9, 9 → row 10 (after a gap row at 8)
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Periodic Table — Essential Plant Nutrients</CardTitle>
          <div className="flex gap-1">
            <Button size="sm" variant={tab === 'table' ? 'default' : 'outline'} onClick={() => setTab('table')}>Table</Button>
            <Button size="sm" variant={tab === 'calc' ? 'default' : 'outline'} onClick={() => setTab('calc')}>Mol weight</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {tab === 'table' && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3 text-[11px]">
              {['essential','beneficial','cho'].map(c => (
                <div key={c} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded ${CATEGORY_STYLES[c].bg} border`} />
                  <span className={CATEGORY_STYLES[c].text}>{CATEGORY_STYLES[c].label}</span>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto">
              <div className="inline-grid gap-[3px]" style={{
                gridTemplateColumns: '28px repeat(18, 38px)',
                gridTemplateRows: '20px repeat(7, 38px) 8px repeat(2, 38px)',
                minWidth: '740px',
              }}>
                {/* Top row group numbers */}
                {Array.from({ length: 18 }, (_, i) => (
                  <div key={`g${i+1}`} className="text-[10px] text-muted-foreground flex items-end justify-center pb-0.5" style={{ gridColumn: i + 2, gridRow: 1 }}>{i + 1}</div>
                ))}
                {/* Side period numbers */}
                {[1,2,3,4,5,6,7].map(p => (
                  <div key={`p${p}`} className="text-[10px] text-muted-foreground flex items-center justify-center" style={{ gridColumn: 1, gridRow: p + 1 }}>{p}</div>
                ))}
                <div className="text-[10px] text-muted-foreground flex items-center justify-center" style={{ gridColumn: 1, gridRow: 9 }}>Ln</div>
                <div className="text-[10px] text-muted-foreground flex items-center justify-center" style={{ gridColumn: 1, gridRow: 10 }}>Ac</div>

                {/* Elements */}
                {PERIODIC_ELEMENTS.map(el => {
                  const c = elementCategory(el.s);
                  const isSel = el.s === selected;
                  const style = CATEGORY_STYLES[c];
                  return (
                    <button
                      key={el.z}
                      onClick={() => setSelected(el.s)}
                      style={gridPos(el.p, el.g)}
                      className={`flex flex-col items-center justify-center rounded text-[10px] leading-tight border transition-all ${style.bg} ${style.text} ${isSel ? 'ring-2 ring-emerald-500 border-emerald-500 scale-105' : 'border-border'} hover:scale-105 hover:border-emerald-400`}
                      title={`${el.n} (Z=${el.z})`}
                    >
                      <div className="font-bold text-[11px]">{el.s}</div>
                      <div className="text-[8px] opacity-80">{el.z}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detail card */}
            {sel && detail && (
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <span className="text-xl font-bold">{sel.s}</span>
                    <span className="text-sm text-muted-foreground ml-2">{sel.n}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${CATEGORY_STYLES[cat].bg} ${CATEGORY_STYLES[cat].text}`}>
                    {CATEGORY_STYLES[cat].label || 'Other'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs mb-3">
                  <DetailItem label="Atomic weight" value={detail.aw} />
                  <DetailItem label="Valence(s)" value={detail.val} />
                  <DetailItem label="Atomic radius" value={detail.rad} />
                  <DetailItem label="Electronegativity" value={detail.en} />
                  <DetailItem label="Atomic number" value={String(sel.z)} />
                </div>
                <div className="text-xs">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Agronomic role</div>
                  <p className="text-sm leading-relaxed">{detail.role}</p>
                </div>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => { setFormula(selected); setTab('calc'); }}>
                  Use in molecular calculator →
                </Button>
              </div>
            )}
          </div>
        )}

        {tab === 'calc' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input value={formula} onChange={e => setFormula(e.target.value)} onKeyDown={e => e.key === 'Enter' && setResult(compFromFormula(formula))} placeholder="e.g. KNO3, Ca(NO3)2·4H2O" className="font-mono" />
              <Button onClick={() => setResult(compFromFormula(formula))}>Calc</Button>
            </div>
            {result && !result.ok && <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">{result.error}</div>}
            {result && result.ok && result.comp && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Molecular weight</div>
                    <div className="text-xl font-bold">{result.mw!.toFixed(3)} g/mol</div>
                  </div>
                  <div className="rounded-lg p-3 bg-muted/40 border">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Normalized</div>
                    <div className="text-sm font-mono mt-1 break-all">{result.normalized}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {Object.entries(result.comp).map(([sym, v]) => v < 0.0001 ? null : (
                    <div key={sym} className="rounded p-2 bg-muted/40 text-center">
                      <div className="text-[10px] text-muted-foreground">{sym}</div>
                      <div className="font-mono font-semibold text-sm">{v.toFixed(2)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded p-2 bg-background/60 border">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-mono font-semibold text-sm">{value}</div>
    </div>
  );
}
