'use client';

/**
 * Field Boundary Importer — GeoAPIHub-inspired feature #2
 *
 * UI layer for the geometry utilities in `@/lib/field-boundary`. Supports
 * importing boundaries from GeoJSON, KML, WKT, or CSV, computing metrics,
 * drawing polygons manually, and converting between formats with SVG preview.
 */

import { useState, useMemo, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Shapes, FileJson, FileCode, FileSpreadsheet, Upload, Download,
  Copy, Check, Trash2, Plus, MapPin, AlertTriangle, CheckCircle2,
  FileText, ArrowRight,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  type Boundary, type ImportFormat, type ExportFormat, type Ring, type BoundaryMetrics,
  detectAndParse, computeMetrics,
  toGeoJSON, toKML, toWKT, toCSV,
} from '@/lib/field-boundary';

type Tab = 'import' | 'draw' | 'convert';

// ============================================================================
// Main component
// ============================================================================

export function FieldBoundaryImporter() {
  const [tab, setTab] = useState<Tab>('import');
  const [boundary, setBoundary] = useState<Boundary | null>(null);
  const [sourceFormat, setSourceFormat] = useState<ImportFormat | null>(null);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shapes className="h-4 w-4 text-emerald-600" /> Field Boundary Importer
        </CardTitle>
        <div className="flex gap-1 mt-2 flex-wrap">
          <TabBtn active={tab === 'import'} onClick={() => setTab('import')} icon={Upload} label="Import" />
          <TabBtn active={tab === 'draw'} onClick={() => setTab('draw')} icon={Shapes} label="Draw" />
          <TabBtn active={tab === 'convert'} onClick={() => setTab('convert')} icon={ArrowRight} label="Convert / Export" disabled={!boundary} />
        </div>
      </CardHeader>
      <CardContent>
        {tab === 'import' && (
          <ImportPanel onImport={(b, fmt) => { setBoundary(b); setSourceFormat(fmt); setTab('convert'); }} />
        )}
        {tab === 'draw' && (
          <DrawPanel onDraw={(b) => { setBoundary(b); setSourceFormat('csv'); setTab('convert'); }} />
        )}
        {tab === 'convert' && boundary && (
          <ConvertPanel boundary={boundary} sourceFormat={sourceFormat} />
        )}
        {tab === 'convert' && !boundary && (
          <div className="text-xs text-muted-foreground text-center py-6">
            Import or draw a boundary first.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Tab 1 — Import
// ============================================================================

const EXAMPLES: Record<ImportFormat, string> = {
  geojson: `{
  "type": "Feature",
  "properties": {"name": "North 40"},
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[-122.42, 37.77], [-122.41, 37.77], [-122.41, 37.78], [-122.42, 37.78], [-122.42, 37.77]]]
  }
}`,
  wkt: `POLYGON ((-122.42 37.77, -122.41 37.77, -122.41 37.78, -122.42 37.78, -122.42 37.77))`,
  kml: `<?xml version="1.0"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>South Field</name>
      <Polygon><outerBoundaryIs><LinearRing>
        <coordinates>-122.42,37.77,0 -122.41,37.77,0 -122.41,37.78,0 -122.42,37.78,0 -122.42,37.77,0</coordinates>
      </LinearRing></outerBoundaryIs></Polygon>
    </Placemark>
  </Document>
</kml>`,
  csv: `name,latitude,longitude
Field A,37.77,-122.42
Field A,37.77,-122.41
Field A,37.78,-122.41
Field A,37.78,-122.42
Field A,37.77,-122.42`,
};

function ImportPanel({ onImport }: { onImport: (b: Boundary, fmt: ImportFormat) => void }) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<{ count: number; firstName: string; format: ImportFormat } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleParse = useCallback(() => {
    setError(null); setParsedPreview(null);
    if (!text.trim()) { setError('Paste a GeoJSON, KML, WKT or CSV blob first'); return; }
    try {
      const { boundaries, format } = detectAndParse(text);
      setParsedPreview({ count: boundaries.length, firstName: boundaries[0].name, format });
    } catch (e: any) { setError(e?.message || 'Failed to parse input'); }
  }, [text]);

  const handleImport = useCallback(() => {
    setError(null);
    try {
      const { boundaries, format } = detectAndParse(text);
      onImport(boundaries[0], format);
    } catch (e: any) { setError(e?.message || 'Failed to import'); }
  }, [text, onImport]);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => { setText(String(reader.result || '')); setError(null); setParsedPreview(null); };
    reader.onerror = () => setError('Could not read file');
    reader.readAsText(file);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <input
          ref={fileRef}
          type="file"
          accept=".geojson,.json,.kml,.wkt,.csv,.txt"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="gap-1.5 text-xs">
          <Upload className="h-3.5 w-3.5" /> Upload File
        </Button>
        <span className="text-[10px] text-muted-foreground">Accepts .geojson · .kml · .wkt · .csv</span>
      </div>

      <div>
        <Label className="text-[10px]">Paste GeoJSON / KML / WKT / CSV</Label>
        <Textarea
          value={text}
          onChange={e => { setText(e.target.value); setError(null); setParsedPreview(null); }}
          placeholder="Auto-detected — paste any supported format…"
          className="text-xs font-mono mt-0.5 min-h-[140px]"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(EXAMPLES) as ImportFormat[]).map(fmt => (
          <button
            key={fmt}
            onClick={() => { setText(EXAMPLES[fmt]); setError(null); setParsedPreview(null); }}
            className="px-2 py-1 text-[10px] rounded border border-border hover:bg-muted/50 uppercase tracking-wide font-medium"
          >
            Load {fmt} example
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={handleParse} className="gap-1.5 text-xs">Validate</Button>
        <Button size="sm" onClick={handleImport} className="gap-1.5 text-xs flex-1">
          <CheckCircle2 className="h-3.5 w-3.5" /> Import Boundary
        </Button>
      </div>

      {parsedPreview && (
        <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 p-2 text-xs">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span className="font-medium">{parsedPreview.count} boundary{parsedPreview.count > 1 ? 'ies' : 'y'} parsed</span>
            <Badge variant="secondary" className="ml-auto text-[10px] uppercase">{parsedPreview.format}</Badge>
          </div>
          <div className="text-muted-foreground mt-0.5">First: “{parsedPreview.firstName}”. Click Import to load into Convert/Export.</div>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 p-2 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span className="font-mono">{error}</span>
        </div>
      )}

      <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">
        💡 Auto-detects format from the first non-whitespace character. Multi-feature GeoJSON/KML imports the first Polygon/MultiPolygon. For surveyor KML exports with multiple Placemarks, paste one block at a time.
      </div>
    </div>
  );
}

// ============================================================================
// Tab 2 — Draw
// ============================================================================

function DrawPanel({ onDraw }: { onDraw: (b: Boundary) => void }) {
  const [name, setName] = useState('New Field');
  const [points, setPoints] = useState<Ring>([
    [-122.42, 37.77], [-122.41, 37.77], [-122.41, 37.78], [-122.42, 37.78],
  ]);
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');

  const addPoint = useCallback(() => {
    const lat = parseFloat(latInput), lng = parseFloat(lngInput);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      toast({ title: 'Invalid coordinates', description: 'Enter numeric latitude and longitude', variant: 'destructive' });
      return;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({ title: 'Out of range', description: 'Latitude must be -90..90, longitude -180..180', variant: 'destructive' });
      return;
    }
    setPoints(prev => [...prev, [lng, lat]]);
    setLatInput(''); setLngInput('');
  }, [latInput, lngInput]);

  const removePoint = (idx: number) => setPoints(prev => prev.filter((_, i) => i !== idx));

  const handleDraw = useCallback(() => {
    if (points.length < 3) {
      toast({ title: 'Need at least 3 points', description: 'Add more vertices to form a polygon', variant: 'destructive' });
      return;
    }
    const first = points[0], last = points[points.length - 1];
    const closed = first[0] === last[0] && first[1] === last[1] ? points : [...points, points[0]];
    onDraw({ name: name || 'New Field', type: 'Polygon', coordinates: [closed] });
  }, [points, name, onDraw]);

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-[10px]">Field Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} className="h-8 text-xs mt-0.5" />
      </div>

      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
        <div>
          <Label className="text-[10px]">Latitude</Label>
          <Input value={latInput} onChange={e => setLatInput(e.target.value)} type="number" step="0.000001" placeholder="37.77" className="h-8 text-xs mt-0.5" />
        </div>
        <div>
          <Label className="text-[10px]">Longitude</Label>
          <Input value={lngInput} onChange={e => setLngInput(e.target.value)} type="number" step="0.000001" placeholder="-122.42" className="h-8 text-xs mt-0.5" />
        </div>
        <Button size="sm" variant="outline" onClick={addPoint} className="gap-1.5 h-8">
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>

      <div className="border rounded-md max-h-[180px] overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur">
            <tr className="text-left text-[10px] text-muted-foreground uppercase">
              <th className="px-2 py-1 w-8">#</th>
              <th className="px-2 py-1">Latitude</th>
              <th className="px-2 py-1">Longitude</th>
              <th className="px-2 py-1 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={i} className="border-t hover:bg-muted/30">
                <td className="px-2 py-1 text-muted-foreground">{i + 1}</td>
                <td className="px-2 py-1 font-mono">{p[1].toFixed(6)}</td>
                <td className="px-2 py-1 font-mono">{p[0].toFixed(6)}</td>
                <td className="px-2 py-1">
                  <button onClick={() => removePoint(i)} className="text-rose-500 hover:text-rose-700">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            ))}
            {points.length === 0 && (
              <tr><td colSpan={4} className="px-2 py-4 text-center text-muted-foreground text-[10px]">No vertices yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Button size="sm" onClick={handleDraw} className="gap-1.5 w-full">
        <CheckCircle2 className="h-3.5 w-3.5" /> Import Drawn Polygon ({points.length} pts)
      </Button>

      <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">
        💡 Click Add to append vertices in order (clockwise or counter-clockwise). Ring is auto-closed when imported. Use a paper map or GPS waypoints to transcribe corners.
      </div>
    </div>
  );
}

// ============================================================================
// Tab 3 — Convert / Export
// ============================================================================

const FMT_ICON: Record<ExportFormat, typeof FileJson> = {
  geojson: FileJson, kml: FileCode, wkt: FileText, csv: FileSpreadsheet,
};
const FMT_LABEL: Record<ExportFormat, string> = {
  geojson: 'GeoJSON', kml: 'KML', wkt: 'WKT', csv: 'CSV',
};

function ConvertPanel({ boundary, sourceFormat }: { boundary: Boundary; sourceFormat: ImportFormat | null }) {
  const metrics = useMemo<BoundaryMetrics>(() => computeMetrics(boundary), [boundary]);
  const [targetFmt, setTargetFmt] = useState<ExportFormat>('geojson');
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    switch (targetFmt) {
      case 'geojson': return toGeoJSON(boundary);
      case 'kml': return toKML(boundary);
      case 'wkt': return toWKT(boundary);
      case 'csv': return toCSV(boundary);
    }
  }, [targetFmt, boundary]);

  const copy = () => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const download = () => {
    const ext: Record<ExportFormat, string> = { geojson: 'geojson', kml: 'kml', wkt: 'wkt', csv: 'csv' };
    const mime: Record<ExportFormat, string> = {
      geojson: 'application/geo+json',
      kml: 'application/vnd.google-earth.kml+xml',
      wkt: 'text/plain',
      csv: 'text/csv',
    };
    const blob = new Blob([output], { type: mime[targetFmt] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${boundary.name.replace(/[^a-z0-9_-]+/gi, '_')}.${ext[targetFmt]}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmtArea = (m2: number) => m2 >= 10_000 ? `${(m2 / 10_000).toFixed(2)} ha` : `${m2.toFixed(0)} m²`;
  const fmtLen = (m: number) => m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${m.toFixed(0)} m`;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <MapPin className="h-3.5 w-3.5 text-emerald-600" />
          <span className="font-semibold text-sm">{boundary.name}</span>
          <Badge variant="secondary" className="text-[10px]">{boundary.type}</Badge>
          {sourceFormat && <Badge variant="outline" className="text-[10px] uppercase">from {sourceFormat}</Badge>}
          <Badge variant={metrics.valid ? 'default' : 'destructive'} className="text-[10px] ml-auto">
            {metrics.valid ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
            {metrics.valid ? 'Valid' : 'Invalid'}
          </Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <Metric label="Area" value={fmtArea(metrics.areaM2)} />
          <Metric label="Perimeter" value={fmtLen(metrics.perimeterM)} />
          <Metric label="Vertices" value={String(metrics.vertexCount)} />
          <Metric label="Centroid" value={`${metrics.centroid[1].toFixed(5)}, ${metrics.centroid[0].toFixed(5)}`} />
        </div>
        <div className="text-[10px] text-muted-foreground font-mono">
          BBox: W {metrics.bbox.west.toFixed(4)} · S {metrics.bbox.south.toFixed(4)} · E {metrics.bbox.east.toFixed(4)} · N {metrics.bbox.north.toFixed(4)}
        </div>
        {metrics.issues.length > 0 && (
          <div className="space-y-0.5 pt-1">
            {metrics.issues.map((iss, i) => (
              <div key={i} className="text-[10px] text-amber-700 dark:text-amber-400 flex items-start gap-1">
                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" /> {iss}
              </div>
            ))}
          </div>
        )}
      </div>

      <PolygonPreview boundary={boundary} bbox={metrics.bbox} />

      <div className="flex gap-1">
        {(['geojson', 'kml', 'wkt', 'csv'] as ExportFormat[]).map(f => {
          const Icon = FMT_ICON[f];
          return (
            <button
              key={f}
              onClick={() => setTargetFmt(f)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${targetFmt === f ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              <Icon className="h-3.5 w-3.5" /> {FMT_LABEL[f]}
            </button>
          );
        })}
      </div>

      <Textarea value={output} readOnly className="text-xs font-mono min-h-[160px] bg-muted/30" />

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={copy} className="gap-1.5 text-xs flex-1">
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} Copy
        </Button>
        <Button size="sm" onClick={download} className="gap-1.5 text-xs flex-1">
          <Download className="h-3.5 w-3.5" /> Download .{targetFmt}
        </Button>
      </div>

      <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">
        💡 GeoJSON is the native format for web maps (Leaflet, Mapbox). KML opens in Google Earth. WKT is used by PostGIS, QGIS expression engine, and spatial SQL. CSV is portable to Excel for paper-records workflows.
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-background/60 dark:bg-background/40 px-2 py-1">
      <div className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="font-mono text-sm font-semibold">{value}</div>
    </div>
  );
}

// ============================================================================
// Polygon preview (SVG, normalised to bbox)
// ============================================================================

function PolygonPreview({ boundary, bbox: bb }: { boundary: Boundary; bbox: BoundaryMetrics['bbox'] }) {
  const W = 320, H = 140, pad = 8;
  const spanLng = Math.max(1e-6, bb.east - bb.west);
  const spanLat = Math.max(1e-6, bb.north - bb.south);
  const scale = Math.min((W - 2 * pad) / spanLng, (H - 2 * pad) / spanLat);
  const offX = (W - spanLng * scale) / 2;
  const offY = (H - spanLat * scale) / 2;
  const proj = ([lng, lat]: [number, number]) => [
    offX + (lng - bb.west) * scale,
    H - (offY + (lat - bb.south) * scale),
  ] as [number, number];

  const rings: Ring[] = boundary.type === 'Polygon'
    ? (boundary.coordinates as any)
    : (boundary.coordinates as any[]).flat();
  const paths = rings.map(r => {
    if (r.length === 0) return '';
    const first = r[0], last = r[r.length - 1];
    const closed = first[0] === last[0] && first[1] === last[1] ? r : [...r, r[0]];
    return closed.map((p, i) => { const [x, y] = proj(p); return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`; }).join(' ') + ' Z';
  });

  return (
    <div className="rounded-md border bg-gradient-to-br from-sky-50/40 to-emerald-50/30 dark:from-sky-950/10 dark:to-emerald-950/10 p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Field boundary preview">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/20" />
          </pattern>
        </defs>
        <rect x="0" y="0" width={W} height={H} fill="url(#grid)" />
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill={i === 0 ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.18)'}
            stroke={i === 0 ? '#10b981' : '#f43f5e'}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <g transform={`translate(${W - 22}, 16)`} className="text-muted-foreground">
          <line x1="0" y1="8" x2="0" y2="-8" stroke="currentColor" strokeWidth="1" />
          <polygon points="0,-8 -3,-3 3,-3" fill="currentColor" />
          <text x="0" y="20" fontSize="8" textAnchor="middle" fill="currentColor" className="font-mono">N</text>
        </g>
      </svg>
    </div>
  );
}

// ============================================================================
// Shared
// ============================================================================

function TabBtn({ active, onClick, icon: Icon, label, disabled }: { active: boolean; onClick: () => void; icon: typeof MapPin; label: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${active ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground hover:bg-muted/50'}`}
    >
      <Icon className="h-3.5 w-3.5" /><span>{label}</span>
    </button>
  );
}
