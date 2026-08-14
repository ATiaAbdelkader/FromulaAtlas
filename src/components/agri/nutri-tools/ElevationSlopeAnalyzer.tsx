'use client';

/**
 * Elevation & Slope Analyzer — GeoAPIHub-inspired feature #4
 *
 * Three-tab UI:
 *   1. Point        — single-point elevation lookup (any lat/lng).
 *   2. Path Profile — elevation transect from A to B with ascent/descent.
 *   3. Slope Grid   — N×N elevation grid over a bounding box, with slope,
 *                     aspect, and hillshade rasters rendered as SVG.
 *
 * All data via Open-Meteo's free elevation API (no key). Math is in
 * `@/lib/elevation`.
 *
 * Use cases:
 *   - Point: "What's the elevation at my field's centroid?"
 *   - Path:  "How much climb does the irrigation pipeline face from pump to
 *             highest sprinkler?" (affects pump head required)
 *   - Grid:  "Where are the steep zones I shouldn't till? Where are the
 *             frost pockets (north-facing, low-lying)?"
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Mountain, MapPin, Route, Grid3x3, RefreshCw, AlertTriangle,
  CheckCircle2, ArrowRight, Compass, Sun, TrendingUp, Snowflake,
} from 'lucide-react';
import {
  type PathProfile, type SlopeGrid, type ElevationPoint,
  getElevation, getPathProfile, getSlopeGrid,
  classifySlope, SLOPE_CLASS_INFO, aspectCompass16, frostRiskFromAspect,
  formatElevation, formatSlope,
} from '@/lib/elevation';

type Tab = 'point' | 'path' | 'grid';

const LAST_LOC_KEY = 'elevation_analyzer_last_loc_v1';

export function ElevationSlopeAnalyzer() {
  const [tab, setTab] = useState<Tab>('point');

  return (
    <Card className="overflow-hidden border-stone-200/80 shadow-sm dark:border-stone-800/80">
      <CardHeader className="border-b border-stone-200/70 bg-gradient-to-br from-stone-50/80 via-card to-card pb-4 dark:border-stone-800/70 dark:from-stone-950/30">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-300"><Mountain className="h-4 w-4" /></span> Elevation &amp; Slope Analyzer
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">Free Open-Meteo elevation API · no key required · slope / aspect / hillshade / frost risk</p>
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-muted/50 p-1">
          <TabBtn active={tab === 'point'} onClick={() => setTab('point')} icon={MapPin} label="Point" />
          <TabBtn active={tab === 'path'} onClick={() => setTab('path')} icon={Route} label="Path Profile" />
          <TabBtn active={tab === 'grid'} onClick={() => setTab('grid')} icon={Grid3x3} label="Slope Grid" />
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        {tab === 'point' && <PointTab />}
        {tab === 'path' && <PathTab />}
        {tab === 'grid' && <GridTab />}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Tab 1 — Point elevation
// ============================================================================

function PointTab() {
  const [lat, setLat] = useState('37.77');
  const [lng, setLng] = useState('-122.42');
  const [elev, setElev] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore last location from localStorage on mount.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAST_LOC_KEY);
      if (saved) {
        const obj = JSON.parse(saved);
        if (typeof obj.lat === 'string') setLat(obj.lat);
        if (typeof obj.lng === 'string') setLng(obj.lng);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchElev = useCallback(async () => {
    setLoading(true); setError(null);
    const la = parseFloat(lat), ln = parseFloat(lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln) || Math.abs(la) > 90 || Math.abs(ln) > 180) {
      setError('Enter valid latitude (-90..90) and longitude (-180..180)');
      setLoading(false); return;
    }
    try {
      const v = await getElevation(la, ln);
      setElev(v);
      localStorage.setItem(LAST_LOC_KEY, JSON.stringify({ lat, lng }));
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch elevation');
      setElev(null);
    } finally { setLoading(false); }
  }, [lat, lng]);

  // Auto-fetch on mount.
  useEffect(() => { fetchElev(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  const frost = elev !== null ? frostRiskFromAspect(0, parseFloat(lat) >= 0 ? 'N' : 'S') : null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <Label className="text-[10px]">Latitude</Label>
          <Input value={lat} onChange={e => setLat(e.target.value)} type="number" step="0.000001" className="mt-1 h-10 text-xs sm:h-8" />
        </div>
        <div>
          <Label className="text-[10px]">Longitude</Label>
          <Input value={lng} onChange={e => setLng(e.target.value)} type="number" step="0.000001" className="mt-1 h-10 text-xs sm:h-8" />
        </div>
      </div>
      <Button size="sm" onClick={fetchElev} disabled={loading} className="gap-1.5 w-full">
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Fetching…' : 'Get elevation'}
      </Button>
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-900 dark:bg-rose-950/20 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span className="font-mono">{error}</span>
        </div>
      )}
      {elev !== null && (
        <>
          <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-4 shadow-sm dark:border-stone-800 dark:bg-stone-950/20">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Elevation above sea level</div>
            <div className="font-mono text-2xl font-bold text-stone-700 dark:text-stone-200">{formatElevation(elev)}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{elev.toFixed(1)} m · {elev < 0 ? 'below sea level' : elev < 200 ? 'lowland' : elev < 1000 ? 'upland' : 'highland'}</div>
          </div>
          {frost && (
            <div className={`rounded-xl border p-3 text-xs flex items-start gap-2 shadow-sm ${
              frost.risk === 'low' ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300'
              : frost.risk === 'moderate' ? 'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300'
              : 'border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300'
            }`}>
              <Snowflake className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <div>
                <strong>Frost risk: {frost.risk}.</strong> {frost.reason}
              </div>
            </div>
          )}
        </>
      )}
      <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-[10px] leading-relaxed text-muted-foreground">
        💡 Elevation affects growing season length (≈ 0.6 °C cooler per 100 m), frost risk, and pump head for irrigation. Use this to plan crop variety selection and pipeline sizing.
      </div>
    </div>
  );
}

// ============================================================================
// Tab 2 — Path profile
// ============================================================================

function PathTab() {
  const [aLat, setALat] = useState('37.77');
  const [aLng, setALng] = useState('-122.42');
  const [bLat, setBLat] = useState('37.85');
  const [bLng, setBLng] = useState('-122.30');
  const [samples, setSamples] = useState(20);
  const [profile, setProfile] = useState<PathProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true); setError(null);
    const a = { lat: parseFloat(aLat), lng: parseFloat(aLng) };
    const b = { lat: parseFloat(bLat), lng: parseFloat(bLng) };
    if (!Number.isFinite(a.lat) || !Number.isFinite(a.lng) || !Number.isFinite(b.lat) || !Number.isFinite(b.lng)) {
      setError('Enter valid lat/lng for both endpoints'); setLoading(false); return;
    }
    try {
      const p = await getPathProfile(a, b, samples);
      setProfile(p);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch profile'); setProfile(null);
    } finally { setLoading(false); }
  }, [aLat, aLng, bLat, bLng, samples]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold text-stone-700 dark:text-stone-300 uppercase">Start (A)</div>
          <div>
            <Label className="text-[10px]">Latitude</Label>
            <Input value={aLat} onChange={e => setALat(e.target.value)} type="number" step="0.000001" className="mt-1 h-10 text-xs sm:h-8" />
          </div>
          <div>
            <Label className="text-[10px]">Longitude</Label>
            <Input value={aLng} onChange={e => setALng(e.target.value)} type="number" step="0.000001" className="mt-1 h-10 text-xs sm:h-8" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase">End (B)</div>
          <div>
            <Label className="text-[10px]">Latitude</Label>
            <Input value={bLat} onChange={e => setBLat(e.target.value)} type="number" step="0.000001" className="mt-1 h-10 text-xs sm:h-8" />
          </div>
          <div>
            <Label className="text-[10px]">Longitude</Label>
            <Input value={bLng} onChange={e => setBLng(e.target.value)} type="number" step="0.000001" className="mt-1 h-10 text-xs sm:h-8" />
          </div>
        </div>
      </div>
      <div>
        <Label className="text-[10px]">Samples ({samples} points along transect)</Label>
        <input
          type="range" min={2} max={100} step={1} value={samples}
          onChange={e => setSamples(parseInt(e.target.value))}
          className="w-full h-1.5 mt-1"
        />
      </div>
      <Button size="sm" onClick={fetchProfile} disabled={loading} className="gap-1.5 w-full">
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Fetching…' : 'Compute path profile'}
      </Button>
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-900 dark:bg-rose-950/20 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span className="font-mono">{error}</span>
        </div>
      )}
      {profile && (
        <>
          <ProfileChart profile={profile} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
            <Stat icon={TrendingUp} color="emerald" label="Total ascent" value={formatElevation(profile.ascent)} />
            <Stat icon={TrendingUp} color="rose" label="Total descent" value={formatElevation(profile.descent)} rotate />
            <Stat icon={Mountain} color="indigo" label="Max elevation" value={formatElevation(profile.maxElev)} />
            <Stat icon={Mountain} color="amber" label="Min elevation" value={formatElevation(profile.minElev)} />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs">
            <Stat icon={Route} color="cyan" label="Path length" value={`${(profile.totalDistance / 1000).toFixed(2)} km`} />
            <Stat icon={TrendingUp} color="violet" label="Avg slope" value={formatSlope(profile.avgSlope)} />
            <Stat icon={TrendingUp} color="rose" label="Max slope" value={formatSlope(profile.maxSlope)} />
          </div>
          {profile.ascent > 30 && (
            <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-2 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <div>
                <strong>Pump head warning.</strong> {profile.ascent.toFixed(0)} m of elevation gain requires an additional {(profile.ascent * 9.81).toFixed(0)} kPa (~{profile.ascent.toFixed(1)} bar) of pump pressure for irrigation.
              </div>
            </div>
          )}
        </>
      )}
      <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-[10px] leading-relaxed text-muted-foreground">
        💡 Use this for irrigation pipeline planning (pump head), access road design, and gravity-fed water system layout. Each 10 m of rise needs ~1 bar extra pump pressure.
      </div>
    </div>
  );
}

// ============================================================================
// Tab 3 — Slope grid
// ============================================================================

function GridTab() {
  const [nLat, setNLat] = useState('37.86');
  const [sLat, setSLat] = useState('37.83');
  const [eLng, setELng] = useState('-122.47');
  const [wLng, setWLng] = useState('-122.51');
  const [gridSize, setGridSize] = useState(8);
  const [sunAz, setSunAz] = useState(135);
  const [sunAlt, setSunAlt] = useState(45);
  const [grid, setGrid] = useState<SlopeGrid | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGrid = useCallback(async () => {
    setLoading(true); setError(null);
    const bbox = {
      north: parseFloat(nLat), south: parseFloat(sLat),
      east: parseFloat(eLng), west: parseFloat(wLng),
    };
    if (!Number.isFinite(bbox.north) || !Number.isFinite(bbox.south) || !Number.isFinite(bbox.east) || !Number.isFinite(bbox.west)) {
      setError('Enter valid bounding box coordinates'); setLoading(false); return;
    }
    if (bbox.north <= bbox.south || bbox.east <= bbox.west) {
      setError('North must be > south and east must be > west'); setLoading(false); return;
    }
    try {
      const g = await getSlopeGrid(bbox, gridSize, sunAz, sunAlt);
      setGrid(g);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch grid'); setGrid(null);
    } finally { setLoading(false); }
  }, [nLat, sLat, eLng, wLng, gridSize, sunAz, sunAlt]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div>
          <Label className="text-[10px]">North lat</Label>
          <Input value={nLat} onChange={e => setNLat(e.target.value)} type="number" step="0.0001" className="mt-1 h-10 text-xs sm:h-8" />
        </div>
        <div>
          <Label className="text-[10px]">South lat</Label>
          <Input value={sLat} onChange={e => setSLat(e.target.value)} type="number" step="0.0001" className="mt-1 h-10 text-xs sm:h-8" />
        </div>
        <div>
          <Label className="text-[10px]">East lng</Label>
          <Input value={eLng} onChange={e => setELng(e.target.value)} type="number" step="0.0001" className="mt-1 h-10 text-xs sm:h-8" />
        </div>
        <div>
          <Label className="text-[10px]">West lng</Label>
          <Input value={wLng} onChange={e => setWLng(e.target.value)} type="number" step="0.0001" className="mt-1 h-10 text-xs sm:h-8" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div>
          <Label className="text-[10px]">Grid size ({gridSize}×{gridSize})</Label>
          <input type="range" min={3} max={20} step={1} value={gridSize} onChange={e => setGridSize(parseInt(e.target.value))} className="w-full h-1.5 mt-2" />
        </div>
        <div>
          <Label className="text-[10px]">Sun azimuth ({sunAz}°)</Label>
          <input type="range" min={0} max={360} step={1} value={sunAz} onChange={e => setSunAz(parseInt(e.target.value))} className="w-full h-1.5 mt-2" />
        </div>
        <div>
          <Label className="text-[10px]">Sun altitude ({sunAlt}°)</Label>
          <input type="range" min={0} max={90} step={1} value={sunAlt} onChange={e => setSunAlt(parseInt(e.target.value))} className="w-full h-1.5 mt-2" />
        </div>
      </div>
      <Button size="sm" onClick={fetchGrid} disabled={loading} className="gap-1.5 w-full">
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Fetching elevations…' : `Survey ${gridSize * gridSize} points`}
      </Button>
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-900 dark:bg-rose-950/20 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span className="font-mono">{error}</span>
        </div>
      )}
      {grid && (
        <>
          <GridMap grid={grid} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
            <Stat icon={Mountain} color="indigo" label="Avg elevation" value={formatElevation(grid.stats.avgElevation)} />
            <Stat icon={TrendingUp} color="violet" label="Avg slope" value={formatSlope(grid.stats.avgSlope)} />
            <Stat icon={TrendingUp} color="rose" label="Max slope" value={formatSlope(grid.stats.maxSlope)} />
            <Stat icon={Grid3x3} color="cyan" label="Cell size" value={`${grid.cellSizeM.toFixed(0)} m`} />
          </div>

          {/* Slope distribution */}
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Slope distribution</div>
            <div className="space-y-1">
              {(['flat', 'gentle', 'moderate', 'steep', 'very_steep'] as const).map(cls => {
                const info = SLOPE_CLASS_INFO[cls];
                const pct = cls === 'flat' ? grid.stats.flatPct
                  : cls === 'gentle' ? grid.stats.gentlePct
                  : cls === 'moderate' ? grid.stats.moderatePct
                  : cls === 'steep' ? grid.stats.steepPct
                  : grid.stats.verySteepPct;
                return (
                  <div key={cls} className="flex items-center gap-2 text-[10px]">
                    <span className="w-28 truncate" style={{ color: info.color }}>● {info.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full" style={{ width: `${pct}%`, backgroundColor: info.color }} />
                    </div>
                    <span className="w-10 text-right font-mono">{pct.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendation based on dominant class */}
          {(() => {
            const classes = [
              { cls: 'flat' as const, pct: grid.stats.flatPct },
              { cls: 'gentle' as const, pct: grid.stats.gentlePct },
              { cls: 'moderate' as const, pct: grid.stats.moderatePct },
              { cls: 'steep' as const, pct: grid.stats.steepPct },
              { cls: 'very_steep' as const, pct: grid.stats.verySteepPct },
            ].sort((a, b) => b.pct - a.pct);
            const dominant = classes[0];
            const info = SLOPE_CLASS_INFO[dominant.cls];
            return (
              <div className="rounded-xl border p-3 text-xs flex items-start gap-2 shadow-sm" style={{ borderColor: info.color + '60', backgroundColor: info.color + '15' }}>
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: info.color }} />
                <div>
                  <strong style={{ color: info.color }}>{dominant.pct.toFixed(0)}% of the area is {info.label.toLowerCase()}.</strong>{' '}
                  {info.recommendation}
                </div>
              </div>
            );
          })()}
        </>
      )}
      <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-[10px] leading-relaxed text-muted-foreground">
        💡 Larger grids (20×20 = 400 points) take a few seconds — Open-Meteo limits to 100 points per call. Use slope maps to plan terraces, drainage, and avoid cultivating steep zones (erosion risk).
      </div>
    </div>
  );
}

// ============================================================================
// Profile SVG chart
// ============================================================================

function ProfileChart({ profile }: { profile: PathProfile }) {
  const W = 320, H = 120, padX = 6, padY = 12;
  const maxDist = profile.distances[profile.distances.length - 1] || 1;
  const elevRange = Math.max(1, profile.maxElev - profile.minElev);
  const xScale = (d: number) => padX + (d / maxDist) * (W - 2 * padX);
  const yScale = (e: number) => H - padY - ((e - profile.minElev) / elevRange) * (H - 2 * padY);

  const pathD = profile.points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${xScale(profile.distances[i]).toFixed(1)},${yScale(p.elevation).toFixed(1)}`
  ).join(' ');
  const fillD = pathD + ` L${xScale(maxDist).toFixed(1)},${H - padY} L${xScale(0).toFixed(1)},${H - padY} Z`;

  return (
    <div className="rounded-md border bg-gradient-to-b from-sky-50/40 to-stone-50/30 dark:from-sky-950/10 dark:to-stone-950/10 p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Elevation profile">
        {/* Sky gradient already via container */}
        {/* Reference lines at 25/50/75% of elev range */}
        {[0.25, 0.5, 0.75].map(t => {
          const y = padY + t * (H - 2 * padY);
          return <line key={t} x1={padX} y1={y} x2={W - padX} y2={y} stroke="currentColor" strokeWidth="0.4" className="text-muted-foreground/20" strokeDasharray="2 3" />;
        })}
        {/* Filled area */}
        <path d={fillD} fill="rgba(120, 113, 108, 0.25)" />
        {/* Profile line */}
        <path d={pathD} fill="none" stroke="#78716c" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        {/* Start and end markers */}
        <circle cx={xScale(0)} cy={yScale(profile.points[0].elevation)} r="3" fill="#16a34a" />
        <circle cx={xScale(maxDist)} cy={yScale(profile.points[profile.points.length - 1].elevation)} r="3" fill="#0891b2" />
        {/* Labels */}
        <text x={padX} y={10} fontSize="8" className="fill-muted-foreground font-mono">
          {formatElevation(profile.maxElev)}
        </text>
        <text x={padX} y={H - 2} fontSize="8" className="fill-muted-foreground font-mono">
          {formatElevation(profile.minElev)}
        </text>
        <text x={W - padX} y={H - 2} fontSize="8" textAnchor="end" className="fill-muted-foreground font-mono">
          {(maxDist / 1000).toFixed(2)} km
        </text>
      </svg>
    </div>
  );
}

// ============================================================================
// Slope grid SVG (overlays slope color + hillshade + aspect arrows)
// ============================================================================

function GridMap({ grid }: { grid: SlopeGrid }) {
  const W = 320, H = 320, pad = 12;
  const cellW = (W - 2 * pad) / grid.cols;
  const cellH = (H - 2 * pad) / grid.rows;

  const slopeColor = (s: number): string => {
    const cls = classifySlope(s);
    return SLOPE_CLASS_INFO[cls].color;
  };

  // For each cell, draw a colored rect with hillshade alpha.
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const x = pad + c * cellW;
      const y = pad + r * cellH;
      const s = grid.slope[r][c];
      const h = grid.hillshade[r][c];
      const a = grid.aspect[r][c];
      const elev = grid.elevations[r][c];
      const color = slopeColor(s);
      // Hillshade darkens the cell: 0 (dark) → 255 (bright)
      const alpha = 0.4 + (h / 255) * 0.5;
      const isEdge = r === 0 || r === grid.rows - 1 || c === 0 || c === grid.cols - 1;
      cells.push(
        <g key={`${r}-${c}`}>
          <rect
            x={x} y={y} width={cellW + 0.5} height={cellH + 0.5}
            fill={color}
            opacity={isEdge ? 0.3 : alpha}
          />
          {/* Aspect arrow — small line from cell center pointing downhill */}
          {!isEdge && cellW > 16 && (
            <g transform={`translate(${x + cellW / 2}, ${y + cellH / 2})`}>
              <line
                x1={0} y1={0}
                x2={Math.sin(a * Math.PI / 180) * cellW * 0.3}
                y2={-Math.cos(a * Math.PI / 180) * cellW * 0.3}
                stroke="white"
                strokeWidth="0.8"
                opacity="0.7"
              />
            </g>
          )}
          {/* Elevation label on large grids */}
          {cellW > 28 && (
            <text
              x={x + cellW / 2} y={y + cellH / 2 + 3}
              fontSize="6"
              textAnchor="middle"
              className="fill-white font-mono font-bold pointer-events-none"
              opacity="0.9"
            >
              {elev.toFixed(0)}
            </text>
          )}
        </g>
      );
    }
  }

  return (
    <div className="rounded-md border bg-stone-50 dark:bg-stone-950 p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Slope grid map">
        {/* Grid cells */}
        {cells}
        {/* North arrow */}
        <g transform={`translate(${W - 18}, 18)`} className="text-muted-foreground">
          <line x1="0" y1="6" x2="0" y2="-6" stroke="currentColor" strokeWidth="1" />
          <polygon points="0,-6 -2,-2 2,-2" fill="currentColor" />
          <text x="0" y="18" fontSize="8" textAnchor="middle" fill="currentColor" className="font-mono">N</text>
        </g>
        {/* Compass legend top-left */}
        <text x={pad} y={10} fontSize="8" className="fill-muted-foreground font-mono">
          {grid.cols}×{grid.rows} · {grid.cellSizeM.toFixed(0)} m cells
        </text>
      </svg>
    </div>
  );
}

// ============================================================================
// Shared
// ============================================================================

const ACCENT_BG: Record<string, string> = {
  cyan: 'border-cyan-200 dark:border-cyan-900 bg-cyan-50/40 dark:bg-cyan-950/20',
  emerald: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20',
  indigo: 'border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20',
  amber: 'border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20',
  rose: 'border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20',
  violet: 'border-violet-200 dark:border-violet-900 bg-violet-50/40 dark:bg-violet-950/20',
  stone: 'border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-950/20',
};

function Stat({ icon: Icon, color, label, value, rotate }: {
  icon: typeof Mountain; color: keyof typeof ACCENT_BG; label: string; value: string; rotate?: boolean;
}) {
  return (
    <div className={`rounded-xl border px-3 py-2 ${ACCENT_BG[color]}`}>
      <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase tracking-wide">
        <Icon className={`h-2.5 w-2.5 ${rotate ? 'rotate-180' : ''}`} />{label}
      </div>
      <div className="font-mono text-sm font-semibold leading-tight">{value}</div>
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof MapPin; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${active ? 'bg-stone-100 text-stone-700 shadow-sm dark:bg-stone-950/50 dark:text-stone-300' : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'}`}
    >
      <Icon className="h-3.5 w-3.5" /><span>{label}</span>
    </button>
  );
}
