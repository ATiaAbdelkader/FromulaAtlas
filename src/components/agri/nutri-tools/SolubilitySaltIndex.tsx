'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SOLUBILITY_ROWS, solubilityClass } from '@/lib/nutri-tools-data';

const MAX_IS = 116.3;

type SortKey = 'name' | 'formula' | 'solMid' | 'is';
type SortDir = 'asc' | 'desc';

/**
 * Tool 17 — Solubility & Salt Index
 */
export function SolubilitySaltIndex() {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('is');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      // numeric columns default desc, text columns default asc
      setSortDir(key === 'name' || key === 'formula' ? 'asc' : 'desc');
    }
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = SOLUBILITY_ROWS.filter(r => {
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.formula.toLowerCase().includes(q) ||
        (r.note || '').toLowerCase().includes(q)
      );
    });
    const sorted = [...filtered].sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      if (sortKey === 'solMid') {
        av = (a.solLo + a.solHi) / 2;
        bv = (b.solLo + b.solHi) / 2;
      } else if (sortKey === 'is') {
        av = a.is ?? -1;
        bv = b.is ?? -1;
      } else {
        av = a[sortKey];
        bv = b[sortKey];
      }
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc'
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number);
    });
    return sorted;
  }, [query, sortKey, sortDir]);

  const arrow = (key: SortKey) =>
    sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Solubility & Salt Index</CardTitle>
        <p className="text-xs text-muted-foreground">
          Solubility (g/L at 20 °C) and salt index (NaNO₃ = 100 base). Click any header to sort.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs" htmlFor="sol-search">Search by name, formula, or note</Label>
          <Input
            id="sol-search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. nitrate, KNO₃, amendment"
            className="h-9 mt-1"
          />
        </div>

        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="px-2 py-2 font-semibold cursor-pointer hover:bg-muted/70 select-none" onClick={() => toggleSort('name')}>
                  Fertilizer{arrow('name')}
                </th>
                <th className="px-2 py-2 font-semibold cursor-pointer hover:bg-muted/70 select-none" onClick={() => toggleSort('formula')}>
                  Formula{arrow('formula')}
                </th>
                <th className="px-2 py-2 font-semibold text-right cursor-pointer hover:bg-muted/70 select-none" onClick={() => toggleSort('solMid')}>
                  Sol. (g/L){arrow('solMid')}
                </th>
                <th className="px-2 py-2 font-semibold">Class</th>
                <th className="px-2 py-2 font-semibold text-right cursor-pointer hover:bg-muted/70 select-none" onClick={() => toggleSort('is')}>
                  IS{arrow('is')}
                </th>
                <th className="px-2 py-2 font-semibold w-[40%]">Salt index bar</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const mid = (r.solLo + r.solHi) / 2;
                const cls = solubilityClass(mid);
                const isVal = r.is;
                const width = isVal != null ? Math.max(2, (isVal / MAX_IS) * 100) : 0;
                const isDisplay = r.noteIs ? r.noteIs : (isVal != null ? isVal.toFixed(1) : '—');
                return (
                  <tr key={r.name} className="border-t border-border/40">
                    <td className="px-2 py-2">
                      <div className="font-medium">{r.name}</div>
                      {r.note && <div className="text-[10px] text-muted-foreground italic">{r.note}</div>}
                    </td>
                    <td className="px-2 py-2 font-mono text-muted-foreground">{r.formula}</td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {r.solLo === r.solHi ? r.solLo : `${r.solLo}–${r.solHi}`}
                    </td>
                    <td className="px-2 py-2">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: cls.color }} />
                        <span className="text-[11px]" style={{ color: cls.color }}>{cls.label}</span>
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums font-medium">{isDisplay}</td>
                    <td className="px-2 py-2">
                      {isVal != null ? (
                        <div className="h-2.5 w-full rounded-full overflow-hidden bg-muted/50">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${width}%`,
                              background: 'linear-gradient(90deg, #38bdf8, #fbbf24 50%, #ea580c)',
                            }}
                          />
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">n/a</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-2 py-6 text-center text-muted-foreground">
                    No fertilizers match “{query}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Salt index bar scale: 0 to {MAX_IS} (KCl = {MAX_IS}, the highest reference).
        </p>
      </CardContent>
    </Card>
  );
}
