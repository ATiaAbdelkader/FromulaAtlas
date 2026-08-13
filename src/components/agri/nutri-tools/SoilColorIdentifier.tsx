'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Droplets, Mountain, Search, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import {
  SOIL_MINERALS, MUNSELL_COLORS, US_STATE_SOILS,
  type SoilMineral,
} from '@/lib/agri-ref-data';

const HUES = ['N', '10YR', '7.5YR', '5YR', '2.5YR', '10R', '5R', '5Y', '5B'];

const DRAINAGE_META: Record<string, { label: string; color: string; emoji: string }> = {
  well: { label: 'Well-drained', color: '#10b981', emoji: '✅' },
  moderate: { label: 'Moderately drained', color: '#eab308', emoji: '⚡' },
  poor: { label: 'Poorly drained', color: '#f97316', emoji: '⚠️' },
  very_poor: { label: 'Very poorly drained', color: '#dc2626', emoji: '🚨' },
};

const IRON_META: Record<string, { label: string; color: string }> = {
  high: { label: 'Iron-rich', color: '#dc2626' },
  moderate: { label: 'Moderate iron', color: '#eab308' },
  low: { label: 'Low iron', color: '#0891b2' },
  depleted: { label: 'Iron-depleted (reduced)', color: '#6366f1' },
};

type Tab = 'identifier' | 'states';

export function SoilColorIdentifier() {
  const [tab, setTab] = useState<Tab>('identifier');

  return (
    <Card className="overflow-hidden border-stone-200 shadow-sm dark:border-stone-800">
      <CardHeader className="border-b border-border/60 bg-stone-50/60 pb-4 dark:bg-stone-950/20">
        <CardTitle className="flex items-center gap-2 text-base"><span className="rounded-lg bg-stone-200 p-2 text-stone-700 dark:bg-stone-800 dark:text-stone-200">
          <Mountain className="h-4 w-4" /></span> Soil Color Identifier
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">Munsell color → mineral + drainage + iron status · US state soils · from agridatasets-py (aqp R package)</p>
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1 dark:bg-stone-900">
          <button type="button" aria-pressed={tab === 'identifier'} onClick={() => setTab('identifier')} className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${tab === 'identifier' ? 'bg-background text-stone-700 shadow-sm dark:text-stone-200' : 'text-muted-foreground hover:text-foreground'}`}>
            <Mountain className="h-4 w-4" /> Color → Mineral
          </button>
          <button type="button" aria-pressed={tab === 'states'} onClick={() => setTab('states')} className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${tab === 'states' ? 'bg-background text-stone-700 shadow-sm dark:text-stone-200' : 'text-muted-foreground hover:text-foreground'}`}>
            <Droplets className="h-4 w-4" /> US State Soils
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {tab === 'identifier' && <IdentifierTab />}
        {tab === 'states' && <StatesTab />}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Tab 1: Soil Color → Mineral Identifier
// ============================================================================

function IdentifierTab() {
  const [hue, setHue] = useState('10YR');
  const [value, setValue] = useState('5');
  const [chroma, setChroma] = useState('6');

  const match = useMemo(() => {
    const v = parseInt(value), c = parseInt(chroma);
    // Find closest mineral match by hue + approximate value/chroma
    let best: SoilMineral | null = null;
    let bestDist = Infinity;
    for (const m of SOIL_MINERALS) {
      if (m.hue !== hue && !(m.hue === 'N' && hue === 'N')) continue;
      const dist = Math.abs(m.value - v) + Math.abs(m.chroma - c);
      if (dist < bestDist) {
        bestDist = dist;
        best = m;
      }
    }
    if (!best || bestDist > 5) return null;
    return { mineral: best, dist: bestDist };
  }, [hue, value, chroma]);

  const munsellNotation = `${hue} ${value}/${chroma}`;
  const traditionalName = useMemo(() => {
    const found = MUNSELL_COLORS.find(c => c.munsell === munsellNotation);
    if (found) return found.traditionalName;
    // Approximate
    if (parseInt(value) <= 2) return 'black';
    if (parseInt(value) <= 3) return 'very dark gray/brown';
    if (parseInt(value) <= 4) return 'dark grayish brown';
    if (parseInt(value) <= 5) return 'brown';
    if (parseInt(value) <= 6) return 'yellowish brown';
    if (parseInt(value) <= 7) return 'pale brown';
    return 'very pale brown/white';
  }, [munsellNotation]);

  const drainageMeta = match?.mineral ? DRAINAGE_META[match.mineral.drainage] : null;
  const ironMeta = match?.mineral ? IRON_META[match.mineral.ironStatus] : null;

  // Generate visual color swatch
  const colorSwatch = useMemo(() => {
    // Approximate Munsell to RGB
    const hueMap: Record<string, [number, number, number]> = {
      'N': [value as any * 25, value as any * 25, value as any * 25],
      '10YR': [200 - parseInt(value) * 10, 170 - parseInt(value) * 10, 120 - parseInt(value) * 8],
      '7.5YR': [190 - parseInt(value) * 10, 150 - parseInt(value) * 10, 100 - parseInt(value) * 8],
      '5YR': [180 - parseInt(value) * 10, 120 - parseInt(value) * 10, 80 - parseInt(value) * 6],
      '2.5YR': [170 - parseInt(value) * 10, 90 - parseInt(value) * 8, 60 - parseInt(value) * 5],
      '10R': [160 - parseInt(value) * 10, 80 - parseInt(value) * 8, 50 - parseInt(value) * 5],
      '5R': [150 - parseInt(value) * 10, 70 - parseInt(value) * 8, 40 - parseInt(value) * 5],
      '5Y': [180 - parseInt(value) * 10, 180 - parseInt(value) * 10, 100 - parseInt(value) * 8],
      '5B': [100 - parseInt(value) * 8, 150 - parseInt(value) * 10, 180 - parseInt(value) * 10],
    };
    const rgb = hueMap[hue] || [150, 150, 150];
    const c = parseInt(chroma);
    const factor = 0.5 + c * 0.08;
    const r = Math.min(255, Math.max(0, Math.round(rgb[0] * factor)));
    const g = Math.min(255, Math.max(0, Math.round(rgb[1] * factor)));
    const b = Math.min(255, Math.max(0, Math.round(rgb[2] * factor)));
    return `rgb(${r}, ${g}, ${b})`;
  }, [hue, value, chroma]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-stone-200/70 bg-stone-50/40 p-3 sm:grid-cols-3 dark:border-stone-800 dark:bg-stone-950/10">
        <div>
          <Label className="text-[11px] font-medium">Hue</Label>
          <select value={hue} onChange={e => setHue(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {HUES.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-[11px] font-medium">Value (1-8)</Label>
          <Input value={value} onChange={e => setValue(e.target.value)} type="number" min="1" max="8" step="1" className="mt-1 h-10 text-sm" />
        </div>
        <div>
          <Label className="text-[11px] font-medium">Chroma (0-8)</Label>
          <Input value={chroma} onChange={e => setChroma(e.target.value)} type="number" min="0" max="8" step="1" className="mt-1 h-10 text-sm" />
        </div>
      </div>

      {/* Color swatch + Munsell notation */}
      <div className="flex items-center gap-3 rounded-xl border border-stone-200/80 bg-background p-3 shadow-sm dark:border-stone-800">
        <div className="h-16 w-16 shrink-0 rounded-xl border-2 border-background shadow-inner ring-1 ring-border" aria-label={`Approximate soil color swatch for ${munsellNotation}`} style={{ backgroundColor: colorSwatch }} />
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Munsell notation</div>
          <div className="font-mono text-xl font-bold">{munsellNotation}</div>
          <div className="text-xs text-muted-foreground capitalize">{traditionalName}</div>
        </div>
      </div>

      {/* Mineral match result */}
      {match ? (
        <div className="space-y-2">
          <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/70 p-4 shadow-sm dark:border-stone-800 dark:bg-stone-950/20">
            <div className="flex items-center gap-2">
              <div><p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Closest mineral interpretation</p><span className="text-base font-bold">{match.mineral.mineral}</span></div>
              <Badge variant="outline" className="text-[9px]">match dist: {match.dist}</Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{match.mineral.interpretation}</p>

            <div className="grid grid-cols-2 gap-2">
              {drainageMeta && (
                <div className="rounded-md border p-2" style={{ borderColor: drainageMeta.color + '60', backgroundColor: drainageMeta.color + '15' }}>
                  <div className="text-[9px] text-muted-foreground uppercase">Drainage</div>
                  <div className="text-sm font-semibold" style={{ color: drainageMeta.color }}>{drainageMeta.emoji} {drainageMeta.label}</div>
                </div>
              )}
              {ironMeta && (
                <div className="rounded-md border p-2" style={{ borderColor: ironMeta.color + '60', backgroundColor: ironMeta.color + '15' }}>
                  <div className="text-[9px] text-muted-foreground uppercase">Iron Status</div>
                  <div className="text-sm font-semibold" style={{ color: ironMeta.color }}>{ironMeta.label}</div>
                </div>
              )}
            </div>
          </div>

          {/* Management recommendations */}
          {match.mineral.drainage === 'very_poor' && (
            <div className="rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/20 p-2 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span><strong>Very poor drainage.</strong> Waterlogged, anaerobic. Install drainage OR plant water-tolerant crops (rice). If drained: acid sulfate risk (pyrite) or P release (vivianite).</span>
            </div>
          )}
          {match.mineral.mineral === 'calcite' && (
            <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-2 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span><strong>Calcareous soil (high CaCO₃).</strong> pH 7.5-8.5. Iron + zinc deficiency likely. Apply chelated Fe/Zn or acid-forming amendments (sulfur, ammonium sulfate).</span>
            </div>
          )}
          {match.mineral.drainage === 'well' && match.mineral.ironStatus === 'high' && (
            <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span><strong>Healthy, well-drained soil.</strong> Iron is oxidized + stable. Good root environment. Maintain OM + avoid compaction.</span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4 text-xs text-muted-foreground">
          No close mineral match. Try different hue/value/chroma combination.
        </div>
      )}

      {/* All minerals reference */}
      <details className="text-xs">
        <summary className="min-h-11 cursor-pointer rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground">📋 View all {SOIL_MINERALS.length} soil minerals</summary>
        <div className="mt-2 space-y-1 max-h-[200px] overflow-y-auto">
          {SOIL_MINERALS.map(m => (
            <div key={m.mineral} className="flex items-center gap-2 rounded border p-1.5">
              <div className="w-6 h-6 rounded shrink-0" style={{
                backgroundColor: m.hue === 'N' ? `rgb(${m.value * 25}, ${m.value * 25}, ${m.value * 25})` :
                  m.hue === '10YR' ? `rgb(${200 - m.value * 10}, ${170 - m.value * 10}, ${120 - m.value * 8})` :
                  m.hue === '7.5YR' ? `rgb(${190 - m.value * 10}, ${150 - m.value * 10}, ${100 - m.value * 8})` :
                  m.hue === '5YR' ? `rgb(${180 - m.value * 10}, ${120 - m.value * 10}, ${80 - m.value * 6})` :
                  m.hue === '5R' || m.hue === '10R' ? `rgb(${160 - m.value * 10}, ${70 - m.value * 8}, ${40 - m.value * 5})` :
                  m.hue === '5Y' ? `rgb(${180 - m.value * 10}, ${180 - m.value * 10}, ${100 - m.value * 8})` :
                  m.hue === '5B' ? `rgb(${100 - m.value * 8}, ${150 - m.value * 10}, ${180 - m.value * 10})` :
                  'rgb(150,150,150)'
              }} />
              <div className="flex-1 min-w-0">
                <span className="font-mono text-[10px] font-semibold">{m.mineral}</span>
                <span className="text-[9px] text-muted-foreground ml-1.5">{m.color}</span>
              </div>
              <span className="text-[9px] text-muted-foreground">{DRAINAGE_META[m.drainage].emoji}</span>
            </div>
          ))}
        </div>
      </details>

      <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">
        💡 Munsell color is the universal soil color system. Hue = color family (YR=yellow-red), Value = lightness (0=black, 10=white), Chroma = intensity (0=gray, 8=vivid). Compare with a Munsell soil color book in the field.
      </div>
    </div>
  );
}

// ============================================================================
// Tab 2: US State Soils
// ============================================================================

function StatesTab() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return US_STATE_SOILS;
    return US_STATE_SOILS.filter(s =>
      s.state.toLowerCase().includes(q) ||
      s.abbreviation.toLowerCase().includes(q) ||
      s.series.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="Search state or soil series" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search state or soil series…" className="h-11 pl-10 text-sm" />
      </div>

      <div className="flex items-center justify-between gap-2"><div><p className="text-sm font-semibold">Reference soils by state</p><p className="text-xs text-muted-foreground">Use the series name as a starting point for local verification.</p></div><Badge variant="secondary" className="text-[10px]">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</Badge></div>

      <div className="grid max-h-[350px] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(s => (
          <div key={s.abbreviation} className="rounded-xl border bg-card p-3 transition-shadow hover:shadow-sm">
            <div className="text-[10px] font-semibold">{s.state}</div>
            <div className="text-[9px] text-muted-foreground">{s.abbreviation}</div>
            <div className="mt-1 text-[10px]">
              <span className="text-muted-foreground">Series:</span>{' '}
              <span className="font-medium">{s.series}</span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No state soils match “{search}”. Try a state abbreviation or soil-series name.</div>}

      <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
        💡 State soils are representative soil series designated by USDA-NRCS for each US state. They reflect the dominant agricultural soil and its management challenges. Source: aqp R package.
      </div>
    </div>
  );
}
