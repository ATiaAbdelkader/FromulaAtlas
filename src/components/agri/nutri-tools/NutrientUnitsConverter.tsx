'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NUTRIENT_DATA } from '@/lib/nutri-tools-data';

type Cell = { ppm: string; mmol: string; meq: string };

/**
 * Tool 2 — Nutrient Units Converter (ppm / mmol / meq)
 * Bidirectional 3-way conversion per nutrient.
 * Layout: 2-column grid of nutrient cards so all 22 fit in the
 * landscape dialog without scrolling.
 */
export function NutrientUnitsConverter() {
  const [cells, setCells] = useState<Record<string, Cell>>({});

  const update = (key: string, source: 'ppm' | 'mmol' | 'meq', raw: string) => {
    const data = NUTRIENT_DATA.find(n => n.key === key)!;
    const useUmol = !!data.useUmol;
    const value = parseFloat(raw.replace(',', '.'));
    setCells(prev => {
      const cell = { ...(prev[key] || { ppm: '', mmol: '', meq: '' }) };
      cell[source] = raw;
      if (!raw || !Number.isFinite(value)) {
        if (source === 'ppm') { cell.mmol = ''; cell.meq = ''; }
        if (source === 'mmol') { cell.ppm = ''; cell.meq = ''; }
        if (source === 'meq') { cell.ppm = ''; cell.mmol = ''; }
        return { ...prev, [key]: cell };
      }
      let ppm = 0, mmol = 0, meq = 0;
      if (source === 'ppm') {
        ppm = value;
        mmol = ppm / data.mw;
        meq = mmol * data.valence;
      } else if (source === 'mmol') {
        mmol = useUmol ? value / 1000 : value;
        ppm = mmol * data.mw;
        meq = mmol * data.valence;
      } else {
        meq = value;
        mmol = meq / data.valence;
        ppm = mmol * data.mw;
      }
      if (source !== 'ppm') cell.ppm = ppm.toFixed(3);
      if (source !== 'mmol') cell.mmol = useUmol ? (mmol * 1000).toFixed(2) : mmol.toFixed(3);
      if (source !== 'meq') cell.meq = meq.toFixed(3);
      return { ...prev, [key]: cell };
    });
  };

  // Split nutrients into macros and micros for clearer grouping
  const macros = NUTRIENT_DATA.filter(n => !n.useUmol);
  const micros = NUTRIENT_DATA.filter(n => n.useUmol);

  const renderCard = (n: typeof NUTRIENT_DATA[number]) => {
    const cell = cells[n.key] || { ppm: '', mmol: '', meq: '' };
    return (
      <div key={n.key} className="rounded-lg border border-border bg-card/50 p-2.5 hover:border-emerald-300 transition-colors">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold">{n.label}</span>
            <span className="text-[10px] text-muted-foreground font-mono">MW {n.mw} · val {n.valence}</span>
          </div>
          {n.useUmol && <Badge variant="outline" className="text-[9px] px-1 py-0">µmol</Badge>}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">ppm</div>
            <Input type="number" value={cell.ppm} onChange={e => update(n.key, 'ppm', e.target.value)} placeholder="0" className="h-8 text-xs" />
          </div>
          <div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">{n.useUmol ? 'µmol' : 'mmol'}</div>
            <Input type="number" value={cell.mmol} onChange={e => update(n.key, 'mmol', e.target.value)} placeholder="0" className="h-8 text-xs" />
          </div>
          <div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">meq/L</div>
            <Input type="number" value={cell.meq} onChange={e => update(n.key, 'meq', e.target.value)} placeholder="0" className="h-8 text-xs" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Nutrient Units Converter</CardTitle>
        <p className="text-xs text-muted-foreground">Bidirectional ppm ↔ mmol (or µmol for micros) ↔ meq/L. Type in any cell — the other two update.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Macronutrients &amp; ions</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {macros.map(renderCard)}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Micronutrients (use µmol/L)</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {micros.map(renderCard)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
