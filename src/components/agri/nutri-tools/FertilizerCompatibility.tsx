'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  FERTILIZERS_COMPAT, COMPAT_LABELS, inferCompatLevel,
} from '@/lib/nutri-tools-data';

/**
 * Tool 12 — Fertilizer Compatibility Matrix
 * Triangular matrix (lower) of C/R/I codes between 32 fertilizers + acids.
 */
export function FertilizerCompatibility() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<[number, number] | null>(null);

  const filtered = FERTILIZERS_COMPAT.map((f, i) => ({ ...f, idx: i }))
    .filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));

  // Build a mapping from original indices to filtered positions
  const filteredIndices = filtered.map(f => f.idx);
  const isShown = (i: number) => filteredIndices.includes(i);

  const detail = selected
    ? (() => {
        const [i, j] = selected;
        const a = FERTILIZERS_COMPAT[i];
        const b = FERTILIZERS_COMPAT[j];
        const level = inferCompatLevel(a.id, b.id);
        const lbl = COMPAT_LABELS[level];
        return { a, b, level, lbl };
      })()
    : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Fertilizer Compatibility Matrix</CardTitle>
        <p className="text-xs text-muted-foreground">Click a cell to see details. C = Compatible, R = Caution, I = Incompatible.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter fertilizers..."
          className="max-w-sm"
        />

        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-20 bg-background border border-border p-2 min-w-[180px]"></th>
                {FERTILIZERS_COMPAT.map((f, j) => isShown(j) && (
                  <th key={f.id} className="sticky top-0 z-10 bg-background border border-border p-1 min-w-[40px] max-w-[40px]">
                    <div className="text-[10px] leading-tight break-words text-center" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '110px' }}>{f.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FERTILIZERS_COMPAT.map((f, i) => isShown(i) && (
                <tr key={f.id}>
                  <td className="sticky left-0 z-10 bg-background border border-border p-2 text-xs font-medium whitespace-nowrap min-w-[180px]">{f.name}</td>
                  {FERTILIZERS_COMPAT.map((g, j) => isShown(j) && (
                    <td key={g.id} className="border border-border p-0">
                      {j <= i ? (
                        <button
                          onClick={() => setSelected([i, j])}
                          className="w-full h-full min-w-[40px] min-h-[36px] flex items-center justify-center font-bold text-sm transition-all hover:scale-110"
                          style={{
                            background: COMPAT_LABELS[inferCompatLevel(f.id, g.id)].bg,
                            color: COMPAT_LABELS[inferCompatLevel(f.id, g.id)].color,
                            outline: selected && selected[0] === i && selected[1] === j ? '2px solid #000' : undefined,
                          }}
                          title={`${f.name} ↔ ${g.name}`}
                        >
                          {i === j ? '·' : COMPAT_LABELS[inferCompatLevel(f.id, g.id)].label}
                        </button>
                      ) : (
                        <div className="min-w-[40px] min-h-[36px]"></div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-3 text-[11px]">
          {(['C','R','I'] as const).map(l => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded flex items-center justify-center font-bold text-[10px]" style={{ background: COMPAT_LABELS[l].bg, color: COMPAT_LABELS[l].color }}>{l}</div>
              <span>{COMPAT_LABELS[l].title}</span>
            </div>
          ))}
        </div>

        {detail && (
          <div className="rounded-lg p-4 border" style={{ background: detail.lbl.bg + '30', borderColor: detail.lbl.color }}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-sm">{detail.a.name} ↔ {detail.b.name}</div>
              <span className="font-bold px-2 py-0.5 rounded text-xs" style={{ background: detail.lbl.bg, color: detail.lbl.color }}>{detail.lbl.title}</span>
            </div>
            {detail.level === 'C' && (
              <p className="text-xs text-muted-foreground">
                Under typical working-solution conditions no severe precipitate is expected. Always validate with a jar test.
              </p>
            )}
            {detail.level === 'R' && (
              <div className="space-y-1.5 text-xs">
                <p><strong>What happens:</strong> Interaction or solubility limit per matrix and experience.</p>
                <p><strong>Impact:</strong> Possible turbidity or reduced efficacy.</p>
                <p><strong>Critical factor:</strong> Concentration, pH, temperature.</p>
                <p><strong>Recommended action:</strong> Dilute more, separate tanks, consult technical expert.</p>
              </div>
            )}
            {detail.level === 'I' && (
              <div className="space-y-1.5 text-xs">
                <p><strong>What happens:</strong> High risk of precipitate or obstruction under typical fertigation conditions.</p>
                <p><strong>Impact:</strong> Obstruction, nutrient loss.</p>
                <p><strong>Critical factor:</strong> Concentration.</p>
                <p><strong>Recommended action:</strong> Separate into tank A / B; inject separately.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
