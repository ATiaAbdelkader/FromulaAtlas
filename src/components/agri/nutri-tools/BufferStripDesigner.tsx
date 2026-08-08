'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle2 } from 'lucide-react';

export function BufferStripDesigner() {
  const [width, setWidth] = useState('10');
  const [vegetation, setVegetation] = useState('grass');
  const [slope, setSlope] = useState('3');
  const [length, setLength] = useState('200');

  const result = useMemo(() => {
    const W = parseFloat(width), S = parseFloat(slope), L = parseFloat(length);
    if (!Number.isFinite(W)) return null;

    const vegFactor: Record<string, { name: string; k: number; n: number; p: number; sed: number }> = {
      grass: { name: 'Grass filter strip', k: 0.10, n: 0.55, p: 0.50, sed: 0.75 },
      grass_trees: { name: 'Grass + trees/shrubs', k: 0.08, n: 0.70, p: 0.65, sed: 0.85 },
      native: { name: 'Native prairie mix', k: 0.06, n: 0.65, p: 0.60, sed: 0.80 },
      forest: { name: 'Forest buffer (riparian)', k: 0.05, n: 0.80, p: 0.75, sed: 0.90 },
    };
    const v = vegFactor[vegetation];

    // Trapping efficiency: T = (1 - exp(-k × W × V)) × 100
    const V = S < 3 ? 1.2 : S < 8 ? 1.0 : 0.7; // density factor decreases with slope
    const sedimentTrapping = (1 - Math.exp(-v.k * W * V)) * 100;
    const nRemoval = Math.min(95, v.n * (W / 10) * 100);
    const pRemoval = Math.min(90, v.p * (W / 10) * 100);
    const sedimentRemoval = Math.min(98, v.sed * (W / 10) * 100);

    // Area of buffer
    const bufferArea = W * L / 10000; // ha

    return { sedimentTrapping, nRemoval, pRemoval, sedimentRemoval, bufferArea, vegName: v.name };
  }, [width, vegetation, slope, length]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-teal-600" /> Buffer Strip Designer
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">Width × vegetation type → sediment / N / P trapping efficiency</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">Buffer width (m)</Label>
            <Input value={width} onChange={e => setWidth(e.target.value)} type="number" step="1" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Slope (%)</Label>
            <Input value={slope} onChange={e => setSlope(e.target.value)} type="number" step="0.5" className="h-8 text-xs mt-0.5" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">Buffer length (m)</Label>
            <Input value={length} onChange={e => setLength(e.target.value)} type="number" step="10" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Vegetation type</Label>
            <select value={vegetation} onChange={e => setVegetation(e.target.value)} className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5">
              <option value="grass">Grass filter strip</option>
              <option value="grass_trees">Grass + trees/shrubs</option>
              <option value="native">Native prairie mix</option>
              <option value="forest">Forest buffer (riparian)</option>
            </select>
          </div>
        </div>
        {result && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <Bar label="Sediment" value={result.sedimentRemoval} color="#78716c" />
              <Bar label="Nitrogen" value={result.nRemoval} color="#0891b2" />
              <Bar label="Phosphorus" value={result.pRemoval} color="#f59e0b" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded border p-2">
                <span className="text-muted-foreground">Buffer area:</span> <strong>{result.bufferArea.toFixed(2)} ha</strong>
              </div>
              <div className="rounded border p-2">
                <span className="text-muted-foreground">Vegetation:</span> <strong>{result.vegName}</strong>
              </div>
            </div>
            {result.sedimentRemoval >= 70 ? (
              <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 p-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>Excellent buffer design.</strong> Removes {result.sedimentRemoval.toFixed(0)}% sediment + {result.nRemoval.toFixed(0)}% N. Meets most water quality standards.</span>
              </div>
            ) : (
              <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 p-2 text-xs text-amber-700 dark:text-amber-300">
                <strong>Increase width to 15-20 m</strong> for &gt;75% sediment removal. Native prairie + trees outperform grass alone by 15-20%.
              </div>
            )}
            <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">
              💡 NRCS standard: minimum 10 m grass buffer for 3-5% slope. Double width for every 5% slope increase. Forest buffers best for riparian zones.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className="text-[9px] text-muted-foreground uppercase mb-1">{label}</div>
      <div className="relative h-16 rounded-md overflow-hidden border" style={{ backgroundColor: color + '15' }}>
        <div className="absolute bottom-0 inset-x-0 transition-all" style={{ height: `${value}%`, backgroundColor: color }} />
      </div>
      <div className="font-mono text-sm font-bold mt-1">{value.toFixed(0)}%</div>
    </div>
  );
}
