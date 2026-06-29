'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';
import { OXIDE_CONVERSIONS } from '@/lib/nutri-tools-data';

/**
 * Tool 1 — Oxide ↔ Elemental Converter
 * Bidirectional: type in either side, the other side updates.
 * Layout: 2-column grid of conversion pairs so all 15 fit comfortably
 * in the landscape dialog without scrolling.
 */
export function ConversionCalculator() {
  const [oxideValues, setOxideValues] = useState<Record<string, string>>({});
  const [elementValues, setElementValues] = useState<Record<string, string>>({});

  const setOxide = (key: string, v: string) => {
    setOxideValues(prev => ({ ...prev, [key]: v }));
    const n = parseFloat(v.replace(',', '.'));
    if (v && Number.isFinite(n)) {
      const pair = OXIDE_CONVERSIONS.find(p => p.key === key)!;
      setElementValues(prev => ({ ...prev, [key]: (n * pair.oxideToElement).toFixed(3) }));
    } else {
      setElementValues(prev => ({ ...prev, [key]: '' }));
    }
  };

  const setElement = (key: string, v: string) => {
    setElementValues(prev => ({ ...prev, [key]: v }));
    const n = parseFloat(v.replace(',', '.'));
    if (v && Number.isFinite(n)) {
      const pair = OXIDE_CONVERSIONS.find(p => p.key === key)!;
      setOxideValues(prev => ({ ...prev, [key]: (n * pair.elementToOxide).toFixed(3) }));
    } else {
      setOxideValues(prev => ({ ...prev, [key]: '' }));
    }
  };

  const clear = () => {
    setOxideValues({});
    setElementValues({});
  };

  const hasAnyValue = Object.values(oxideValues).some(v => v) || Object.values(elementValues).some(v => v);

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base">Oxide ↔ Elemental Converter</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Type in either column — the other side updates automatically.</p>
        </div>
        <Button size="sm" variant="outline" onClick={clear} disabled={!hasAnyValue} className="gap-1.5">
          <Eraser className="h-3.5 w-3.5" /> Clear all
        </Button>
      </CardHeader>
      <CardContent>
        {/* Column headers — repeated once per grid column for alignment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
          {OXIDE_CONVERSIONS.map(pair => (
            <div key={pair.key} className="rounded-lg border border-border bg-card/50 p-2.5 hover:border-emerald-300 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  {pair.oxide} <span className="text-emerald-600 mx-1">↔</span> {pair.elemental}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  ×{pair.oxideToElement}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_20px_1fr] gap-1.5 items-center">
                <div className="relative">
                  <Input
                    type="number"
                    value={oxideValues[pair.key] ?? ''}
                    onChange={e => setOxide(pair.key, e.target.value)}
                    placeholder="0"
                    className="pr-10 h-9 text-sm"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">{pair.oxide}</span>
                </div>
                <div className="text-center text-muted-foreground text-xs">→</div>
                <div className="relative">
                  <Input
                    type="number"
                    value={elementValues[pair.key] ?? ''}
                    onChange={e => setElement(pair.key, e.target.value)}
                    placeholder="0"
                    className="pr-10 h-9 text-sm"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">{pair.elemental}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-[11px] text-muted-foreground bg-muted/30 rounded p-2.5">
          <strong className="text-foreground">Tip:</strong> The factor shown in the top-right of each card (×0.715, ×1.399, etc.) is the multiplier used to go from oxide → elemental. The reverse direction uses its reciprocal (shown in the data table). Values round to 3 decimals.
        </div>
      </CardContent>
    </Card>
  );
}
