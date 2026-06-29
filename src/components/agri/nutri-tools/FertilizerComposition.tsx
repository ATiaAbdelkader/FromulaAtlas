'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { compFromFormula } from '@/lib/nutri-tools-data';
import { SendToMenu } from './SendToMenu';
import { AnimatedCounter } from './AnimatedCounter';

/**
 * Tool 9 — Fertilizer Composition (% from chemical formula)
 */
export function FertilizerComposition() {
  const [formula, setFormula] = useState('KNO3');
  const [result, setResult] = useState<ReturnType<typeof compFromFormula> | null>(null);

  const calc = () => setResult(compFromFormula(formula));

  const elementLabels: Record<string, string> = {
    N: 'N', N_NO3: 'N as NO₃⁻', N_NH4: 'N as NH₄⁺',
    P: 'P', K: 'K', Ca: 'Ca', Mg: 'Mg', S: 'S', Si: 'Si',
    Zn: 'Zn', Fe: 'Fe', Mn: 'Mn', B: 'B', Cu: 'Cu', Mo: 'Mo',
    C: 'C', H: 'H', O: 'O',
    P2O5: 'P₂O₅', K2O: 'K₂O', CaO: 'CaO', MgO: 'MgO', SiO2: 'SiO₂',
  };

  const examples = ['KNO3', 'H2SO4', 'Ca(NO3)2·4H2O', 'NH4NO3', '(NH4)2SO4', 'KH2PO4', 'MgSO4·7H2O', 'H3BO3', 'ZnSO4'];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Fertilizer Composition (from formula)</CardTitle>
        <p className="text-xs text-muted-foreground">Parse a chemical formula → elemental %, oxide %, N partition, MW.</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left column: formula input + examples */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={formula}
                onChange={e => setFormula(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && calc()}
                placeholder="e.g. KNO3, Ca(NO3)2·4H2O, NH4NO3"
                className="h-9 font-mono text-sm"
              />
              <Button onClick={calc} size="sm" className="h-9">Calculate</Button>
            </div>

            <div className="flex flex-wrap gap-1">
              {examples.map(ex => (
                <button
                  key={ex}
                  onClick={() => { setFormula(ex); setResult(compFromFormula(ex)); }}
                  className="text-[11px] px-2 py-1 rounded border bg-muted/40 hover:bg-muted font-mono"
                >{ex}</button>
              ))}
            </div>

            {result && !result.ok && (
              <div className="text-xs text-destructive bg-destructive/10 rounded p-2">{result.error}</div>
            )}
          </div>

          {/* Right column: results */}
          <div>
            {result && result.ok && result.comp ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="grid grid-cols-2 gap-2 flex-1 min-w-[200px]">
                    <div className="rounded-lg p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Molecular weight</div>
                      <div className="mt-1">
                        <AnimatedCounter value={result.mw} decimals={3} suffix=" g/mol" className="text-3xl font-bold" />
                      </div>
                    </div>
                    <div className="rounded-lg p-3 bg-muted/40 border">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Normalized</div>
                      <div className="text-sm font-mono mt-1 break-all">{result.normalized}</div>
                    </div>
                  </div>
                  <SendToMenu
                    sourceToolId="fertilizer-composition"
                    targets={[
                      {
                        toolId: 'granular-mix',
                        label: 'Granular Mix Formulation',
                        values: {
                          formula: result.normalized ?? formula,
                          name: result.normalized ?? formula,
                        },
                        description: `add "${result.normalized ?? formula}" as a row`,
                      },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Elemental composition (%)</div>
                    <div className="space-y-1">
                      {['N','N_NO3','N_NH4','P','K','Ca','Mg','S','Si','Zn','Fe','Mn','B','Cu','Mo','C','H','O'].map(sym => {
                        const v = result.comp![sym];
                        if (v == null || v < 0.0001) return null;
                        const isNutrient = !['C','H','O'].includes(sym);
                        return (
                          <div key={sym} className="flex justify-between text-xs">
                            <span className={isNutrient ? 'font-medium' : 'text-muted-foreground'}>{elementLabels[sym] || sym}</span>
                            <span className="font-mono">{v.toFixed(3)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Oxide equivalents (%)</div>
                    <div className="space-y-1">
                      {['P2O5','K2O','CaO','MgO','SiO2'].map(sym => {
                        const v = result.comp![sym];
                        if (v == null || v < 0.0001) return null;
                        return (
                          <div key={sym} className="flex justify-between text-xs">
                            <span className="font-medium">{elementLabels[sym]}</span>
                            <span className="font-mono">{v.toFixed(3)}%</span>
                          </div>
                        );
                      })}
                    </div>
                    {result.comp!.N != null && result.comp!.N > 0 && (
                      <>
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 mt-3">NPK tag</div>
                        <div className="text-sm font-mono font-bold">
                          {result.comp!.N.toFixed(1)}-{(result.comp!.P2O5 || 0).toFixed(1)}-{(result.comp!.K2O || 0).toFixed(1)}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[200px] text-sm text-muted-foreground bg-muted/30 rounded-lg border border-dashed">Enter inputs to see results.</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
