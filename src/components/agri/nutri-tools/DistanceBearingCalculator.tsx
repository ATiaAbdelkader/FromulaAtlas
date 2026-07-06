'use client';

/**
 * Distance & Bearing Calculator — GeoAPIHub-inspired feature #3
 *
 * Four-tab UI:
 *   1. Point-to-Point — Vincenty geodesic distance, initial + final bearing,
 *                       midpoint, compass direction.
 *   2. Destination    — Given a start point, bearing, and distance, compute
 *                       the destination point (Vincenty direct).
 *   3. Batch CSV      — One origin + a CSV of destination points → distances
 *                       and bearings for each, with totals and CSV export.
 *   4. Field-to-Field — Two polygon boundaries (paste GeoJSON / reuse from
 *                       #2's parsers) → centroid-to-centroid distance, edge-
 *                       to-edge minimum distance, and direction each way.
 *
 * All math is client-side via `@/lib/geodesy` and `@/lib/field-boundary`.
 */

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Compass, ArrowRight, MapPin, Download, Copy, Check,
  Navigation, Globe2, FileSpreadsheet, Layers, AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  type LatLng, type GeodesicResult,
  vincentyInverse, vincentyDirect, midpoint, compass16, formatDistance,
  nearestEdgeDistance,
} from '@/lib/geodesy';
import {
  type Boundary,
  detectAndParse, computeMetrics,
} from '@/lib/field-boundary';

type Tab = 'point' | 'destination' | 'batch' | 'fields';

// ============================================================================
// Main component
// ============================================================================

export function DistanceBearingCalculator() {
  const [tab, setTab] = useState<Tab>('point');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Compass className="h-4 w-4 text-cyan-600" /> Distance &amp; Bearing Calculator
        </CardTitle>
        <div className="flex gap-1 mt-2 flex-wrap">
          <TabBtn active={tab === 'point'} onClick={() => setTab('point')} icon={Navigation} label="Point-to-Point" />
          <TabBtn active={tab === 'destination'} onClick={() => setTab('destination')} icon={Globe2} label="Destination" />
          <TabBtn active={tab === 'batch'} onClick={() => setTab('batch')} icon={FileSpreadsheet} label="Batch CSV" />
          <TabBtn active={tab === 'fields'} onClick={() => setTab('fields')} icon={Layers} label="Field-to-Field" />
        </div>
      </CardHeader>
      <CardContent>
        {tab === 'point' && <PointToPoint />}
        {tab === 'destination' && <Destination />}
        {tab === 'batch' && <BatchCsv />}
        {tab === 'fields' && <FieldToField />}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Tab 1 — Point-to-Point
// ============================================================================

function PointToPoint() {
  const [aLat, setALat] = useState('37.77');
  const [aLng, setALng] = useState('-122.42');
  const [bLat, setBLat] = useState('37.78');
  const [bLng, setBLng] = useState('-122.41');
  const [copied, setCopied] = useState(false);

  const result = useMemo<GeodesicResult | null>(() => {
    const a = { lat: parseFloat(aLat), lng: parseFloat(aLng) };
    const b = { lat: parseFloat(bLat), lng: parseFloat(bLng) };
    if (!Number.isFinite(a.lat) || !Number.isFinite(a.lng) ||
        !Number.isFinite(b.lat) || !Number.isFinite(b.lng)) return null;
    if (Math.abs(a.lat) > 90 || Math.abs(b.lat) > 90 ||
        Math.abs(a.lng) > 180 || Math.abs(b.lng) > 180) return null;
    return vincentyInverse(a, b);
  }, [aLat, aLng, bLat, bLng]);

  const mid = useMemo<LatLng | null>(() => {
    const a = { lat: parseFloat(aLat), lng: parseFloat(aLng) };
    const b = { lat: parseFloat(bLat), lng: parseFloat(bLng) };
    if (!Number.isFinite(a.lat) || !Number.isFinite(b.lat)) return null;
    return midpoint(a, b);
  }, [aLat, aLng, bLat, bLng]);

  const summary = useMemo(() => {
    if (!result) return '';
    return [
      `Distance: ${formatDistance(result.distance)} (${result.distance.toFixed(2)} m)`,
      `Initial bearing: ${result.initialBearing.toFixed(2)}° (${compass16(result.initialBearing)})`,
      `Final bearing: ${result.finalBearing.toFixed(2)}° (${compass16(result.finalBearing)})`,
      mid ? `Midpoint: ${mid.lat.toFixed(6)}, ${mid.lng.toFixed(6)}` : '',
    ].filter(Boolean).join('\n');
  }, [result, mid]);

  const copy = () => { navigator.clipboard.writeText(summary); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="text-[10px] font-semibold text-cyan-700 dark:text-cyan-300 uppercase tracking-wide">Point A (from)</div>
          <div>
            <Label className="text-[10px]">Latitude</Label>
            <Input value={aLat} onChange={e => setALat(e.target.value)} type="number" step="0.000001" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Longitude</Label>
            <Input value={aLng} onChange={e => setALng(e.target.value)} type="number" step="0.000001" className="h-8 text-xs mt-0.5" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Point B (to)</div>
          <div>
            <Label className="text-[10px]">Latitude</Label>
            <Input value={bLat} onChange={e => setBLat(e.target.value)} type="number" step="0.000001" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Longitude</Label>
            <Input value={bLng} onChange={e => setBLng(e.target.value)} type="number" step="0.000001" className="h-8 text-xs mt-0.5" />
          </div>
        </div>
      </div>

      {result && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Distance" value={formatDistance(result.distance)} sub={`${result.distance.toFixed(1)} m`} accent="cyan" />
            <Metric label="Initial Bearing" value={`${result.initialBearing.toFixed(1)}°`} sub={compass16(result.initialBearing)} accent="emerald" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Final Bearing" value={`${result.finalBearing.toFixed(1)}°`} sub={compass16(result.finalBearing)} accent="indigo" />
            {mid && (
              <Metric label="Midpoint" value={`${mid.lat.toFixed(5)}, ${mid.lng.toFixed(5)}`} sub="lat, lng" accent="amber" />
            )}
          </div>
          {!result.converged && (
            <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-2 text-[10px] text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>Vincenty did not converge (likely near-antipodal points). Falling back to haversine — accuracy &lt; 0.5%.</span>
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={copy} className="gap-1.5 text-xs flex-1">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} Copy Summary
            </Button>
          </div>
        </>
      )}

      <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">
        💡 Vincenty inverse formula on the WGS84 ellipsoid gives millimetre-level accuracy — far better than haversine for surveyor-grade work. Bearing is initial (at A); final bearing differs slightly due to meridian convergence.
      </div>
    </div>
  );
}

// ============================================================================
// Tab 2 — Destination
// ============================================================================

function Destination() {
  const [lat, setLat] = useState('37.77');
  const [lng, setLng] = useState('-122.42');
  const [bearing, setBearing] = useState('45');
  const [distance, setDistance] = useState('1000');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const start = { lat: parseFloat(lat), lng: parseFloat(lng) };
    const brg = parseFloat(bearing);
    const dist = parseFloat(distance);
    if (!Number.isFinite(start.lat) || !Number.isFinite(start.lng) ||
        !Number.isFinite(brg) || !Number.isFinite(dist)) return null;
    if (Math.abs(start.lat) > 90 || Math.abs(start.lng) > 180 || dist < 0) return null;
    return vincentyDirect(start, brg, dist);
  }, [lat, lng, bearing, distance]);

  const summary = useMemo(() => {
    if (!result) return '';
    return [
      `Start: ${lat}, ${lng}`,
      `Bearing: ${bearing}° (${compass16(parseFloat(bearing))})`,
      `Distance: ${distance} m (${formatDistance(parseFloat(distance))})`,
      `Destination: ${result.point.lat.toFixed(6)}, ${result.point.lng.toFixed(6)}`,
      `Final bearing: ${result.finalBearing.toFixed(2)}°`,
    ].join('\n');
  }, [result, lat, lng, bearing, distance]);

  const copy = () => { navigator.clipboard.writeText(summary); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px]">Start Latitude</Label>
          <Input value={lat} onChange={e => setLat(e.target.value)} type="number" step="0.000001" className="h-8 text-xs mt-0.5" />
        </div>
        <div>
          <Label className="text-[10px]">Start Longitude</Label>
          <Input value={lng} onChange={e => setLng(e.target.value)} type="number" step="0.000001" className="h-8 text-xs mt-0.5" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px]">Bearing (° clockwise from N)</Label>
          <Input value={bearing} onChange={e => setBearing(e.target.value)} type="number" step="0.1" className="h-8 text-xs mt-0.5" />
        </div>
        <div>
          <Label className="text-[10px]">Distance (m)</Label>
          <Input value={distance} onChange={e => setDistance(e.target.value)} type="number" step="0.01" className="h-8 text-xs mt-0.5" />
        </div>
      </div>

      {result && (
        <>
          <div className="rounded-lg border border-cyan-200 dark:border-cyan-900 bg-cyan-50/40 dark:bg-cyan-950/20 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-cyan-600" />
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Destination Point</span>
            </div>
            <div className="text-lg font-bold font-mono text-cyan-700 dark:text-cyan-300">
              {result.point.lat.toFixed(6)}, {result.point.lng.toFixed(6)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              Final bearing on arrival: <strong className="font-mono">{result.finalBearing.toFixed(2)}°</strong> ({compass16(result.finalBearing)})
            </div>
          </div>

          {/* Compass visualisation */}
          <div className="flex justify-center">
            <CompassRose bearing={parseFloat(bearing) || 0} finalBearing={result.finalBearing} />
          </div>

          <Button size="sm" variant="outline" onClick={copy} className="gap-1.5 text-xs w-full">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} Copy Summary
          </Button>
        </>
      )}

      <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">
        💡 Useful for "where will I end up if I walk 500 m NE from the barn?" or for laying out sample points at known offsets along a transect.
      </div>
    </div>
  );
}

// ============================================================================
// Tab 3 — Batch CSV
// ============================================================================

type BatchResult =
  | { error: string }
  | { rows: { name: string; lat: number; lng: number; distance: number; bearing: number; compass: string }[]; error: null };

function BatchCsv() {
  const [originLat, setOriginLat] = useState('37.77');
  const [originLng, setOriginLng] = useState('-122.42');
  const [csvInput, setCsvInput] = useState(
    'name,latitude,longitude\nField A,37.78,-122.41\nField B,37.79,-122.43\nBarn,37.775,-122.415\nWell,37.765,-122.40',
  );
  const [copied, setCopied] = useState(false);

  const result = useMemo<BatchResult | null>(() => {
    const origin = { lat: parseFloat(originLat), lng: parseFloat(originLng) };
    if (!Number.isFinite(origin.lat) || !Number.isFinite(origin.lng)) return null;
    const lines = csvInput.trim().split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return { error: 'CSV needs a header + at least 1 row' };
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const latIdx = header.findIndex(h => h.includes('lat'));
    const lngIdx = header.findIndex(h => h.includes('lon') || h.includes('lng'));
    const nameIdx = header.findIndex(h => h === 'name' || h === 'field' || h === 'label');
    if (latIdx === -1 || lngIdx === -1) return { error: 'CSV must have latitude and longitude columns' };
    const rows: { name: string; lat: number; lng: number; distance: number; bearing: number; compass: string }[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      const lat = parseFloat(cols[latIdx]);
      const lng = parseFloat(cols[lngIdx]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const r = vincentyInverse(origin, { lat, lng });
      rows.push({
        name: nameIdx !== -1 ? (cols[nameIdx] || `Row ${i}`) : `Row ${i}`,
        lat, lng,
        distance: r.distance,
        bearing: r.initialBearing,
        compass: compass16(r.initialBearing),
      });
    }
    if (rows.length === 0) return { error: 'No valid coordinate rows found' };
    return { rows, error: null };
  }, [originLat, originLng, csvInput]);

  const csvOutput = useMemo(() => {
    if (!result || result.error !== null || result.rows.length === 0) return '';
    const out = ['name,latitude,longitude,distance_m,distance_km,bearing_deg,compass'];
    for (const r of result.rows) {
      out.push([
        r.name, r.lat.toFixed(6), r.lng.toFixed(6),
        r.distance.toFixed(2), (r.distance / 1000).toFixed(3),
        r.bearing.toFixed(2), r.compass,
      ].join(','));
    }
    return out.join('\n');
  }, [result]);

  const copy = () => { navigator.clipboard.writeText(csvOutput); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const download = () => {
    const blob = new Blob([csvOutput], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'distances_from_origin.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 rounded-lg border border-cyan-200 dark:border-cyan-900 bg-cyan-50/40 dark:bg-cyan-950/20 p-3">
        <div>
          <Label className="text-[10px]">Origin Latitude</Label>
          <Input value={originLat} onChange={e => setOriginLat(e.target.value)} type="number" step="0.000001" className="h-8 text-xs mt-0.5" />
        </div>
        <div>
          <Label className="text-[10px]">Origin Longitude</Label>
          <Input value={originLng} onChange={e => setOriginLng(e.target.value)} type="number" step="0.000001" className="h-8 text-xs mt-0.5" />
        </div>
      </div>

      <div>
        <Label className="text-[10px]">Destinations CSV (header must include latitude + longitude; name optional)</Label>
        <Textarea value={csvInput} onChange={e => setCsvInput(e.target.value)} className="text-xs font-mono mt-0.5 min-h-[100px]" />
      </div>

      {result && result.error !== null && (
        <div className="rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 p-2 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span className="font-mono">{result.error}</span>
        </div>
      )}

      {result && result.error === null && result.rows.length > 0 && (
        <>
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 p-2 text-xs">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span className="font-medium">{result.rows.length} destination{result.rows.length > 1 ? 's' : ''} computed</span>
            </div>
            <div className="text-muted-foreground mt-0.5 text-[10px]">
              Total path (origin → all): {formatDistance(result.rows.reduce((s, r) => s + r.distance, 0))}
              {' · '}
              Closest: {formatDistance(Math.min(...result.rows.map(r => r.distance)))}
              {' · '}
              Farthest: {formatDistance(Math.max(...result.rows.map(r => r.distance)))}
            </div>
          </div>

          <div className="border rounded-md max-h-[200px] overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                <tr className="text-left text-[10px] text-muted-foreground uppercase">
                  <th className="px-2 py-1">Name</th>
                  <th className="px-2 py-1">Distance</th>
                  <th className="px-2 py-1">Bearing</th>
                  <th className="px-2 py-1">Compass</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r, i) => (
                  <tr key={i} className="border-t hover:bg-muted/30">
                    <td className="px-2 py-1 truncate max-w-[120px]">{r.name}</td>
                    <td className="px-2 py-1 font-mono">{formatDistance(r.distance)}</td>
                    <td className="px-2 py-1 font-mono">{r.bearing.toFixed(1)}°</td>
                    <td className="px-2 py-1 text-muted-foreground">{r.compass}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={copy} className="gap-1.5 text-xs flex-1">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} Copy CSV
            </Button>
            <Button size="sm" onClick={download} className="gap-1.5 text-xs flex-1">
              <Download className="h-3.5 w-3.5" /> Download CSV
            </Button>
          </div>
        </>
      )}

      <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">
        💡 Useful for "from the barn, how far is each field?" or for laying out irrigation mainline runs. Paste a CSV from Excel or from the Coordinate Converter's batch output.
      </div>
    </div>
  );
}

// ============================================================================
// Tab 4 — Field-to-Field
// ============================================================================

type FieldToFieldResult =
  | { error: string }
  | {
      aName: string;
      bName: string;
      aArea: number;
      bArea: number;
      aVertices: number;
      bVertices: number;
      centroidDistance: number;
      centroidBearing: number;
      centroidCompass: string;
      edgeDistance: number;
      closestPair: { a: [number, number]; b: [number, number] } | null;
      error: null;
    };

function FieldToField() {
  const [aText, setAText] = useState('{"type":"Feature","properties":{"name":"Field A"},"geometry":{"type":"Polygon","coordinates":[[[-122.42,37.77],[-122.41,37.77],[-122.41,37.78],[-122.42,37.78],[-122.42,37.77]]]}}');
  const [bText, setBText] = useState('{"type":"Feature","properties":{"name":"Field B"},"geometry":{"type":"Polygon","coordinates":[[[-122.40,37.79],[-122.39,37.79],[-122.39,37.80],[-122.40,37.80],[-122.40,37.79]]]}}');

  const result = useMemo<FieldToFieldResult>(() => {
    let aBoundary: Boundary, bBoundary: Boundary;
    try {
      const pa = detectAndParse(aText);
      if (!pa.boundaries.length) throw new Error('No boundary in Field A');
      aBoundary = pa.boundaries[0];
    } catch (e: any) { return { error: `Field A: ${e?.message || e}` }; }
    try {
      const pb = detectAndParse(bText);
      if (!pb.boundaries.length) throw new Error('No boundary in Field B');
      bBoundary = pb.boundaries[0];
    } catch (e: any) { return { error: `Field B: ${e?.message || e}` }; }

    const am = computeMetrics(aBoundary);
    const bm = computeMetrics(bBoundary);
    if (!am.valid || !bm.valid) {
      return { error: 'One or both boundaries are invalid (e.g. self-intersecting).' };
    }

    const aCentroid: LatLng = { lat: am.centroid[1], lng: am.centroid[0] };
    const bCentroid: LatLng = { lat: bm.centroid[1], lng: bm.centroid[0] };
    const centroidResult = vincentyInverse(aCentroid, bCentroid);

    const aRings = flatRings(aBoundary);
    const bRings = flatRings(bBoundary);
    let minEdge = Infinity, closestPair: { a: [number, number]; b: [number, number] } | null = null;
    for (const ringA of aRings) {
      for (const [vLng, vLat] of ringA) {
        const v: LatLng = { lat: vLat, lng: vLng };
        for (const ringB of bRings) {
          const ne = nearestEdgeDistance(v, ringB);
          if (ne.distance < minEdge) {
            minEdge = ne.distance;
            closestPair = { a: [vLng, vLat], b: ne.closest };
          }
        }
      }
    }
    for (const ringB of bRings) {
      for (const [vLng, vLat] of ringB) {
        const v: LatLng = { lat: vLat, lng: vLng };
        for (const ringA of aRings) {
          const ne = nearestEdgeDistance(v, ringA);
          if (ne.distance < minEdge) {
            minEdge = ne.distance;
            closestPair = { a: ne.closest, b: [vLng, vLat] };
          }
        }
      }
    }

    return {
      aName: aBoundary.name,
      bName: bBoundary.name,
      aArea: am.areaM2,
      bArea: bm.areaM2,
      aVertices: am.vertexCount,
      bVertices: bm.vertexCount,
      centroidDistance: centroidResult.distance,
      centroidBearing: centroidResult.initialBearing,
      centroidCompass: compass16(centroidResult.initialBearing),
      edgeDistance: minEdge,
      closestPair,
      error: null,
    };
  }, [aText, bText]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px]">Field A (paste GeoJSON / KML / WKT / CSV)</Label>
          <Textarea value={aText} onChange={e => setAText(e.target.value)} className="text-xs font-mono mt-0.5 min-h-[80px]" />
        </div>
        <div>
          <Label className="text-[10px]">Field B (paste GeoJSON / KML / WKT / CSV)</Label>
          <Textarea value={bText} onChange={e => setBText(e.target.value)} className="text-xs font-mono mt-0.5 min-h-[80px]" />
        </div>
      </div>

      {result.error !== null && (
        <div className="rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 p-2 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span className="font-mono">{result.error}</span>
        </div>
      )}

      {result.error === null && (
        <div className="space-y-2">
          <div className="rounded-lg border border-cyan-200 dark:border-cyan-900 bg-cyan-50/40 dark:bg-cyan-950/20 p-3 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-[10px]">{result.aName}</Badge>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <Badge variant="secondary" className="text-[10px]">{result.bName}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Metric label="Centroid Distance" value={formatDistance(result.centroidDistance)} sub={`${result.centroidDistance.toFixed(1)} m`} accent="cyan" />
              <Metric label="Bearing A→B" value={`${result.centroidBearing.toFixed(1)}°`} sub={result.centroidCompass} accent="emerald" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Metric label="Edge-to-Edge (min)" value={formatDistance(result.edgeDistance)} sub={`${result.edgeDistance.toFixed(1)} m`} accent="indigo" />
              <Metric label="Combined Area" value={formatDistance(result.aArea + result.bArea)} sub={`${((result.aArea + result.bArea) / 10000).toFixed(2)} ha`} accent="amber" />
            </div>
            {result.closestPair && (
              <div className="text-[10px] text-muted-foreground font-mono pt-1 border-t border-cyan-200/50 dark:border-cyan-900/50">
                Nearest points: A ({result.closestPair.a[1].toFixed(5)}, {result.closestPair.a[0].toFixed(5)}) ↔ B ({result.closestPair.b[1].toFixed(5)}, {result.closestPair.b[0].toFixed(5)})
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="rounded-md border bg-muted/20 p-2">
              <div className="font-medium text-muted-foreground uppercase tracking-wide">Field A</div>
              <div>{(result.aArea / 10000).toFixed(2)} ha · {result.aVertices} verts</div>
            </div>
            <div className="rounded-md border bg-muted/20 p-2">
              <div className="font-medium text-muted-foreground uppercase tracking-wide">Field B</div>
              <div>{(result.bArea / 10000).toFixed(2)} ha · {result.bVertices} verts</div>
            </div>
          </div>
        </div>
      )}

      <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">
        💡 Paste boundaries from the Field Boundary Importer (#2). Centroid distance is for planning travel routes; edge-to-edge minimum is for shared-fence / irrigation-line / spray-buffer calculations.
      </div>
    </div>
  );
}

// ============================================================================
// Compass rose SVG (for Destination tab)
// ============================================================================

function CompassRose({ bearing, finalBearing }: { bearing: number; finalBearing: number }) {
  const size = 160, c = size / 2, r = c - 12;
  const toXY = (deg: number, rad: number) => {
    const a = (deg - 90) * Math.PI / 180;
    return [c + rad * Math.cos(a), c + rad * Math.sin(a)] as const;
  };
  const [ax, ay] = toXY(bearing, r * 0.85);
  const [fx, fy] = toXY(finalBearing, r * 0.6);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Compass rose">
      <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeWidth="1" className="text-muted-foreground/40" />
      <circle cx={c} cy={c} r={r * 0.7} fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/20" />
      {/* Cardinal labels */}
      {(['N', 'E', 'S', 'W'] as const).map((dir, i) => {
        const [x, y] = toXY(i * 90, r + 8);
        return (
          <text key={dir} x={x} y={y} fontSize="11" textAnchor="middle" dominantBaseline="middle"
            className={dir === 'N' ? 'fill-rose-500 font-bold' : 'fill-muted-foreground font-mono'}>
            {dir}
          </text>
        );
      })}
      {/* Initial bearing arrow (cyan, full length) */}
      <line x1={c} y1={c} x2={ax} y2={ay} stroke="#0891b2" strokeWidth="2" />
      <polygon
        points={`${ax},${ay} ${ax - 4},${ay} ${ax + 4},${ay}`}
        fill="#0891b2"
        transform={`rotate(${bearing} ${ax} ${ay})`}
      />
      {/* Final bearing arrow (emerald, shorter) */}
      <line x1={c} y1={c} x2={fx} y2={fy} stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 2" />
      <circle cx={c} cy={c} r="2" fill="currentColor" className="text-foreground" />
    </svg>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function flatRings(b: Boundary): Ring[] {
  if (b.type === 'Polygon') return b.coordinates as Ring[];
  // MultiPolygon: flatten to list of outer rings only.
  return (b.coordinates as any[][]).map(p => p[0]);
}

// We import Ring as a type via re-export from field-boundary (avoids duplicating).
type Ring = [number, number][];

// ============================================================================
// Shared
// ============================================================================

const ACCENT_BG: Record<string, string> = {
  cyan: 'border-cyan-200 dark:border-cyan-900 bg-cyan-50/50 dark:bg-cyan-950/20',
  emerald: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20',
  indigo: 'border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20',
  amber: 'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20',
};

function Metric({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: keyof typeof ACCENT_BG | string }) {
  return (
    <div className={`rounded-md border px-2 py-1.5 ${ACCENT_BG[accent] || ACCENT_BG.cyan}`}>
      <div className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="font-mono text-sm font-semibold">{value}</div>
      {sub && <div className="text-[9px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Compass; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${active ? 'bg-cyan-100 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300' : 'text-muted-foreground hover:bg-muted/50'}`}
    >
      <Icon className="h-3.5 w-3.5" /><span>{label}</span>
    </button>
  );
}
