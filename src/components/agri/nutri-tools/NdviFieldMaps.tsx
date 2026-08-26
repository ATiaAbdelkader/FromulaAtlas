'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Satellite, MapPin, Loader2, Download, AlertTriangle, CheckCircle2,
  Grid3x3, TrendingDown, Eye, Layers,
} from 'lucide-react';
import {
  simulateNdvi, ndviColor, classifyNdvi, healthLabel, healthRecommendation,
  fieldFromCenter, type FieldBoundary, type NdviResult, type NdviZone,
} from '@/lib/satellite-service';

const GRID_SIZE = 8;
const CROPS = ['Maize', 'Tomato', 'Wheat', 'Rice', 'Potato', 'Soybean', 'Cotton', 'Strawberry', 'Avocado'];

export function NdviFieldMaps() {
  const [fieldName, setFieldName] = useState('Field A');
  const [lat, setLat] = useState('19.4326');
  const [lng, setLng] = useState('-99.1332');
  const [areaHa, setAreaHa] = useState('10');
  const [crop, setCrop] = useState('Maize');
  const [result, setResult] = useState<NdviResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedZone, setSelectedZone] = useState<NdviZone | null>(null);
  const [showGrid, setShowGrid] = useState(true);

  const analyze = () => {
    setLoading(true);
    setSelectedZone(null);
    // Simulate API delay
    setTimeout(() => {
      const field = fieldFromCenter(parseFloat(lat), parseFloat(lng), parseFloat(areaHa), fieldName);
      const ndvi = simulateNdvi(field, crop);
      setResult(ndvi);
      setLoading(false);
    }, 1200);
  };

  const useGps = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude.toFixed(4)); setLng(pos.coords.longitude.toFixed(4)); },
      () => {},
    );
  };

  const exportPdf = () => {
    if (!result) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>NDVI Report — ${result.field.name}</title><style>
      body{font-family:system-ui,sans-serif;margin:24px;color:#0f172a}
      h1{color:#16a34a;font-size:20px} .meta{color:#475569;font-size:12px;margin-bottom:16px}
      .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px}
      .stat{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:8px}
      .stat-label{font-size:10px;color:#16a34a;text-transform:uppercase} .stat-value{font-size:18px;font-weight:bold}
      .legend{display:flex;gap:8px;margin-bottom:12px;font-size:10px}
      .legend-item{display:flex;align-items:center;gap:4px}
      .swatch{width:14px;height:14px;border-radius:2px}
      .map{display:grid;grid-template-columns:repeat(8,1fr);gap:1px;width:400px;height:400px;border:1px solid #ccc}
      .cell{border:none}
      .recs{margin-top:16px} .rec{background:#fef3c7;border:1px solid #fde68a;padding:8px;border-radius:4px;margin-bottom:4px;font-size:12px}
      @page{size:portrait;margin:12mm}
    </style></head><body>
      <h1>NDVI Field Report — ${result.field.name}</h1>
      <div class="meta">${result.date} · ${result.satellite} · Cloud: ${result.cloudCover}% · ${result.field.areaHa} ha · ${crop}</div>
      <div class="summary">
        <div class="stat"><div class="stat-label">Avg NDVI</div><div class="stat-value">${result.averageNdvi}</div></div>
        <div class="stat"><div class="stat-label">Min NDVI</div><div class="stat-value">${result.minNdvi}</div></div>
        <div class="stat"><div class="stat-label">Max NDVI</div><div class="stat-value">${result.maxNdvi}</div></div>
        <div class="stat"><div class="stat-label">Stressed area</div><div class="stat-value">${result.stressedAreaPct}%</div></div>
      </div>
      <div class="legend">${[
        { c: ndviColor(0.05), l: 'Bare' }, { c: ndviColor(0.2), l: 'Critical' },
        { c: ndviColor(0.35), l: 'Poor' }, { c: ndviColor(0.5), l: 'Moderate' },
        { c: ndviColor(0.65), l: 'Good' }, { c: ndviColor(0.8), l: 'Excellent' },
      ].map(x => `<div class="legend-item"><div class="swatch" style="background:${x.c}"></div>${x.l}</div>`).join('')}</div>
      <div class="map">${result.zones.map(z => `<div class="cell" style="background:${ndviColor(z.ndvi)}" title="NDVI: ${z.ndvi}"></div>`).join('')}</div>
      <div class="recs">${result.recommendations.map(r => `<div class="rec">${r}</div>`).join('')}</div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Satellite className="h-4 w-4 text-indigo-600" /> NDVI Field Maps
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Satellite vegetation index — identify stressed zones in your fields</p>
        </div>
        {result && (
          <Button onClick={exportPdf} size="sm" variant="outline" className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> PDF
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input form */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <Label className="text-[10px]">Field name</Label>
            <Input value={fieldName} onChange={e => setFieldName(e.target.value)} className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Latitude</Label>
            <Input value={lat} onChange={e => setLat(e.target.value)} className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Longitude</Label>
            <Input value={lng} onChange={e => setLng(e.target.value)} className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Area (ha)</Label>
            <Input value={areaHa} onChange={e => setAreaHa(e.target.value)} type="number" className="h-8 text-xs mt-0.5" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={useGps} className="gap-1.5 text-xs h-8">
            <MapPin className="h-3.5 w-3.5" /> GPS
          </Button>
          <select value={crop} onChange={e => setCrop(e.target.value)} className="h-8 text-xs rounded-md border border-input bg-background px-2">
            {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <Button size="sm" onClick={analyze} disabled={loading} className="gap-1.5 text-xs h-8 flex-1">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Satellite className="h-3.5 w-3.5" />}
            {loading ? 'Analyzing...' : 'Analyze Field'}
          </Button>
        </div>

        {/* NDVI Map */}
        {result && (
          <div className="space-y-3">
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-2">
              <SummaryCard label="Avg NDVI" value={String(result.averageNdvi)} color={ndviColor(result.averageNdvi)} />
              <SummaryCard label="Min" value={String(result.minNdvi)} color={ndviColor(result.minNdvi)} />
              <SummaryCard label="Max" value={String(result.maxNdvi)} color={ndviColor(result.maxNdvi)} />
              <SummaryCard label="Stressed" value={`${result.stressedAreaPct}%`} color={result.stressedAreaPct > 20 ? '#dc2626' : '#16a34a'} />
            </div>

            {/* Map + Legend */}
            <div className="flex gap-4 flex-wrap">
              {/* NDVI Grid */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{result.field.name} — {result.date}</div>
                  <button onClick={() => setShowGrid(!showGrid)} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                    {showGrid ? <Eye className="h-3 w-3" /> : <Grid3x3 className="h-3 w-3" />}
                    {showGrid ? 'Hide grid' : 'Show grid'}
                  </button>
                </div>
                <div className="grid gap-px bg-border p-px rounded-lg overflow-hidden" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, width: '320px', height: '320px' }}>
                  {result.zones.map((zone) => (
                    <button
                      key={zone.id}
                      onClick={() => setSelectedZone(zone)}
                      className="relative transition-all hover:scale-110 hover:z-10 hover:ring-2 hover:ring-white"
                      style={{
                        backgroundColor: ndviColor(zone.ndvi),
                        outline: selectedZone?.id === zone.id ? '2px solid #000' : 'none',
                        outlineOffset: '-2px',
                      }}
                      title={`NDVI: ${zone.ndvi} — ${healthLabel(zone.health)}`}
                    />
                  ))}
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-2 text-[9px]">
                  {[
                    { c: ndviColor(0.05), l: 'Bare' },
                    { c: ndviColor(0.2), l: 'Critical' },
                    { c: ndviColor(0.35), l: 'Poor' },
                    { c: ndviColor(0.5), l: 'Moderate' },
                    { c: ndviColor(0.65), l: 'Good' },
                    { c: ndviColor(0.8), l: 'Excellent' },
                  ].map(x => (
                    <div key={x.l} className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded" style={{ background: x.c }} />
                      <span className="text-muted-foreground">{x.l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Zone details + Recommendations */}
              <div className="flex-1 min-w-[200px] space-y-2">
                {selectedZone ? (
                  <div className="rounded-lg p-3 border" style={{ background: `${ndviColor(selectedZone.ndvi)}15`, borderColor: `${ndviColor(selectedZone.ndvi)}60` }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 rounded" style={{ background: ndviColor(selectedZone.ndvi) }} />
                      <span className="text-sm font-bold">NDVI: {selectedZone.ndvi}</span>
                      <Badge variant="outline" className="text-[9px]">{healthLabel(selectedZone.health)}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{healthRecommendation(selectedZone.health)}</p>
                    <div className="text-[10px] text-muted-foreground mt-1">Zone area: {selectedZone.areaPct}% of field</div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground p-3 rounded-lg border border-dashed text-center">
                    Click any zone on the map to see detailed analysis
                  </div>
                )}

                {/* Recommendations */}
                <div className="space-y-1.5">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> AI Recommendations
                  </div>
                  {result.recommendations.map((r, i) => (
                    <div key={i} className="text-xs rounded-lg p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Satellite info */}
            <div className="text-[10px] text-muted-foreground flex items-center gap-2 pt-2 border-t border-border">
              <Satellite className="h-3 w-3" />
              Source: {result.satellite} · Cloud cover: {result.cloudCover}% · Grid: {GRID_SIZE}×{GRID_SIZE} = {GRID_SIZE * GRID_SIZE} zones
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && (
          <div className="text-center py-8">
            <Satellite className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
            <div className="text-sm text-muted-foreground">Enter your field location and click "Analyze Field" to generate an NDVI vegetation health map.</div>
            <div className="text-[10px] text-muted-foreground mt-1">Uses Sentinel-2 satellite data (simulated for demo — connect Sentinel Hub API key for real imagery)</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg p-2 border bg-muted/20">
      <div className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</div>
      <div className="text-base font-bold mt-0.5" style={{ color }}>{value}</div>
    </div>
  );
}
