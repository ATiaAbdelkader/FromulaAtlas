'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  MapPin, Copy, Check, ArrowRight, ArrowLeft, Upload, Download,
  Globe, Grid3x3, FileSpreadsheet,
} from 'lucide-react';

type Tab = 'dms' | 'utm' | 'batch';

export function CoordinateConverter() {
  const [tab, setTab] = useState<Tab>('dms');

  return (
    <Card className="overflow-hidden border-indigo-100/80 shadow-sm dark:border-indigo-950/60">
      <CardHeader className="border-b border-indigo-100/70 bg-gradient-to-br from-indigo-50/70 via-card to-card pb-4 dark:border-indigo-950/70 dark:from-indigo-950/30">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300"><MapPin className="h-4 w-4" /></span> Coordinate Converter</CardTitle>
        <div className="mt-3 grid grid-cols-1 gap-1 rounded-xl bg-muted/50 p-1 sm:grid-cols-3">
          <TabBtn active={tab === 'dms'} onClick={() => setTab('dms')} icon={Globe} label="DMS ↔ Decimal" />
          <TabBtn active={tab === 'utm'} onClick={() => setTab('utm')} icon={Grid3x3} label="UTM ↔ Lat/Lng" />
          <TabBtn active={tab === 'batch'} onClick={() => setTab('batch')} icon={FileSpreadsheet} label="Batch CSV" />
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        {tab === 'dms' && <DmsConverter />}
        {tab === 'utm' && <UtmConverter />}
        {tab === 'batch' && <BatchConverter />}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// 1. DMS ↔ Decimal Degrees
// ============================================================================

function DmsConverter() {
  const [deg, setDeg] = useState('37');
  const [min, setMin] = useState('46');
  const [sec, setSec] = useState('12');
  const [direction, setDirection] = useState<'N' | 'S' | 'E' | 'W'>('N');
  const [decimal, setDecimal] = useState('');
  const [copied, setCopied] = useState(false);

  // DMS → Decimal
  const dmsToDecimal = useMemo(() => {
    const d = parseFloat(deg) || 0;
    const m = parseFloat(min) || 0;
    const s = parseFloat(sec) || 0;
    let result = d + m / 60 + s / 3600;
    if (direction === 'S' || direction === 'W') result = -result;
    return Math.round(result * 1000000) / 1000000;
  }, [deg, min, sec, direction]);

  // Decimal → DMS
  const decimalToDms = useMemo(() => {
    const val = parseFloat(decimal);
    if (!Number.isFinite(val)) return null;
    const absVal = Math.abs(val);
    const d = Math.floor(absVal);
    const minFloat = (absVal - d) * 60;
    const m = Math.floor(minFloat);
    const s = Math.round((minFloat - m) * 60 * 100) / 100;
    const dir = val >= 0 ? (direction === 'N' || direction === 'S' ? 'N' : 'E') : (direction === 'N' || direction === 'S' ? 'S' : 'W');
    return { d, m, s, dir };
  }, [decimal, direction]);

  const copy = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="space-y-4">
      {/* DMS → Decimal */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">DMS → Decimal Degrees</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div><Label className="text-[10px]">Degrees (°)</Label><Input value={deg} onChange={e => setDeg(e.target.value)} type="number" className="h-8 text-xs mt-0.5" /></div>
          <div><Label className="text-[10px]">Minutes (')</Label><Input value={min} onChange={e => setMin(e.target.value)} type="number" className="h-8 text-xs mt-0.5" /></div>
          <div><Label className="text-[10px]">Seconds (")</Label><Input value={sec} onChange={e => setSec(e.target.value)} type="number" step="0.01" className="h-8 text-xs mt-0.5" /></div>
          <div>
            <Label className="text-[10px]">Direction</Label>
            <div className="flex gap-0.5 mt-0.5">
              {(['N', 'S', 'E', 'W'] as const).map(d => (
                <button key={d} onClick={() => setDirection(d)} className={`flex-1 h-8 text-xs rounded border ${direction === d ? 'bg-indigo-600 text-white border-indigo-600' : 'border-border'}`}>{d}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <div className="flex-1 rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 dark:border-indigo-900 dark:bg-indigo-950/20">
            <div className="text-[10px] text-muted-foreground">Decimal Degrees</div>
            <div className="text-lg font-bold font-mono text-indigo-700 dark:text-indigo-300">{dmsToDecimal}°</div>
          </div>
          <Button size="sm" variant="outline" onClick={() => copy(String(dmsToDecimal))} className="gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} Copy
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center"><ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" /></div>

      {/* Decimal → DMS */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Decimal → DMS</div>
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1"><Label className="text-[10px]">Decimal degrees</Label><Input value={decimal} onChange={e => setDecimal(e.target.value)} type="number" step="0.000001" placeholder="e.g. 37.770000" className="h-8 text-xs mt-0.5" /></div>
        </div>
        {decimalToDms && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
            <div className="text-[10px] text-muted-foreground">DMS Format</div>
            <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300">
              {decimalToDms.d}° {decimalToDms.m}' {decimalToDms.s}" {decimalToDms.dir}
            </div>
          </div>
        )}
      </div>

      <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">
        💡 DMS (Degrees/Minutes/Seconds) is used by surveyors and older GPS devices. Decimal degrees is used by web maps, APIs, and our NDVI/Weather tools.
      </div>
    </div>
  );
}

// ============================================================================
// 2. UTM ↔ Lat/Lng (WGS84)
// ============================================================================

// Simplified UTM conversion (WGS84 ellipsoid)
const A = 6378137.0;          // WGS84 semi-major axis
const F = 1 / 298.257223563;  // WGS84 flattening
const K0 = 0.9996;             // UTM scale factor

function latLngToUtm(lat: number, lng: number): { easting: number; northing: number; zone: number; hemisphere: 'N' | 'S' } {
  const zone = Math.floor((lng + 180) / 6) + 1;
  const centralMeridian = (zone - 1) * 6 - 180 + 3;
  
  const e2 = 2 * F - F * F;
  const e2sq = e2 / (1 - e2);
  const latRad = lat * Math.PI / 180;
  const lngRad = lng * Math.PI / 180;
  const lngOriginRad = centralMeridian * Math.PI / 180;
  
  const N = A / Math.sqrt(1 - e2 * Math.sin(latRad) ** 2);
  const T = Math.tan(latRad) ** 2;
  const C = e2sq * Math.cos(latRad) ** 2;
  const AVal = Math.cos(latRad) * (lngRad - lngOriginRad);
  
  const M = A * ((1 - e2/4 - 3*e2**2/64 - 5*e2**3/256) * latRad
    - (3*e2/8 + 3*e2**2/32 + 45*e2**3/1024) * Math.sin(2*latRad)
    + (15*e2**2/256 + 45*e2**3/1024) * Math.sin(4*latRad)
    - (35*e2**3/3072) * Math.sin(6*latRad));
  
  let easting = K0 * N * (AVal + (1 - T + C) * AVal**3 / 6 + (5 - 18*T + T**2 + 72*C - 58*e2sq) * AVal**5 / 120) + 500000;
  let northing = K0 * (M + N * Math.tan(latRad) * (AVal**2/2 + (5 - T + 9*C + 4*C**2) * AVal**4/24 + (61 - 58*T + T**2 + 600*C - 330*e2sq) * AVal**6/720));
  
  const hemisphere: 'N' | 'S' = lat >= 0 ? 'N' : 'S';
  if (hemisphere === 'S') northing += 10000000;
  
  return { easting: Math.round(easting * 100) / 100, northing: Math.round(northing * 100) / 100, zone, hemisphere };
}

function utmToLatLng(easting: number, northing: number, zone: number, hemisphere: 'N' | 'S'): { lat: number; lng: number } {
  const e2 = 2 * F - F * F;
  const e2sq = e2 / (1 - e2);
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  
  const x = easting - 500000;
  let y = northing;
  if (hemisphere === 'S') y -= 10000000;
  
  const M = y / K0;
  const mu = M / (A * (1 - e2/4 - 3*e2**2/64 - 5*e2**3/256));
  
  const phi1 = mu + (3*e1/2 - 27*e1**3/32) * Math.sin(2*mu)
    + (21*e1**2/16 - 55*e1**4/32) * Math.sin(4*mu)
    + (151*e1**3/96) * Math.sin(6*mu)
    + (1097*e1**4/512) * Math.sin(8*mu);
  
  const N1 = A / Math.sqrt(1 - e2 * Math.sin(phi1) ** 2);
  const T1 = Math.tan(phi1) ** 2;
  const C1 = e2sq * Math.cos(phi1) ** 2;
  const R1 = A * (1 - e2) / (1 - e2 * Math.sin(phi1) ** 2) ** 1.5;
  const D = x / (N1 * K0);
  
  const lat = phi1 - (N1 * Math.tan(phi1) / R1) * (D**2/2
    - (5 + 3*T1 + 10*C1 - 4*C1**2 - 9*e2sq) * D**4/24
    + (61 + 90*T1 + 298*C1 + 45*T1**2 - 252*e2sq - 3*C1**2) * D**6/720);
  
  const lng = (D - (1 + 2*T1 + C1) * D**3/6
    + (5 - 2*C1 + 28*T1 - 3*C1**2 + 8*e2sq + 24*T1**2) * D**5/120) / Math.cos(phi1);
  
  const centralMeridian = (zone - 1) * 6 - 180 + 3;
  
  return {
    lat: Math.round(lat * 180 / Math.PI * 1000000) / 1000000,
    lng: Math.round((centralMeridian + lng * 180 / Math.PI) * 1000000) / 1000000,
  };
}

function UtmConverter() {
  const [lat, setLat] = useState('37.77');
  const [lng, setLng] = useState('-122.42');
  const [easting, setEasting] = useState('');
  const [northing, setNorthing] = useState('');
  const [zone, setZone] = useState('10');
  const [hemisphere, setHemisphere] = useState<'N' | 'S'>('N');
  const [copied, setCopied] = useState(false);

  // Lat/Lng → UTM
  const utmResult = useMemo(() => {
    const la = parseFloat(lat), ln = parseFloat(lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
    return latLngToUtm(la, ln);
  }, [lat, lng]);

  // UTM → Lat/Lng
  const latlngResult = useMemo(() => {
    const e = parseFloat(easting), n = parseFloat(northing), z = parseInt(zone);
    if (!Number.isFinite(e) || !Number.isFinite(n) || !z) return null;
    return utmToLatLng(e, n, z, hemisphere);
  }, [easting, northing, zone, hemisphere]);

  const copy = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="space-y-4">
      {/* Lat/Lng → UTM */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lat/Lng → UTM</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div><Label className="text-[10px]">Latitude</Label><Input value={lat} onChange={e => setLat(e.target.value)} type="number" step="0.000001" className="h-8 text-xs mt-0.5" /></div>
          <div><Label className="text-[10px]">Longitude</Label><Input value={lng} onChange={e => setLng(e.target.value)} type="number" step="0.000001" className="h-8 text-xs mt-0.5" /></div>
        </div>
        {utmResult && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 shadow-sm dark:border-indigo-900 dark:bg-indigo-950/20 space-y-1">
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div><span className="text-muted-foreground">Zone:</span> <strong>{utmResult.zone}{utmResult.hemisphere}</strong></div>
              <div><span className="text-muted-foreground">Easting:</span> <strong className="font-mono">{utmResult.easting}</strong></div>
              <div><span className="text-muted-foreground">Northing:</span> <strong className="font-mono">{utmResult.northing}</strong></div>
              <Button size="sm" variant="ghost" onClick={() => copy(`${utmResult.easting}, ${utmResult.northing}, ${utmResult.zone}${utmResult.hemisphere}`)} className="h-6 text-[10px] gap-1">
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />} Copy
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center"><ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" /></div>

      {/* UTM → Lat/Lng */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">UTM → Lat/Lng</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div><Label className="text-[10px]">Easting</Label><Input value={easting} onChange={e => setEasting(e.target.value)} type="number" placeholder="e.g. 551234" className="h-8 text-xs mt-0.5" /></div>
          <div><Label className="text-[10px]">Northing</Label><Input value={northing} onChange={e => setNorthing(e.target.value)} type="number" placeholder="e.g. 4180345" className="h-8 text-xs mt-0.5" /></div>
          <div><Label className="text-[10px]">Zone</Label><Input value={zone} onChange={e => setZone(e.target.value)} type="number" min="1" max="60" className="h-8 text-xs mt-0.5" /></div>
          <div>
            <Label className="text-[10px]">Hemisphere</Label>
            <div className="flex gap-0.5 mt-0.5">
              <button onClick={() => setHemisphere('N')} className={`flex-1 h-8 text-xs rounded border ${hemisphere === 'N' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-border'}`}>N</button>
              <button onClick={() => setHemisphere('S')} className={`flex-1 h-8 text-xs rounded border ${hemisphere === 'S' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-border'}`}>S</button>
            </div>
          </div>
        </div>
        {latlngResult && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
            <div className="text-[10px] text-muted-foreground">Latitude / Longitude (WGS84)</div>
            <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300">
              {latlngResult.lat}, {latlngResult.lng}
            </div>
          </div>
        )}
      </div>

      <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">
        💡 UTM (Universal Transverse Mercator) is used by GPS devices, surveyors, and farm machinery. Decimal lat/lng is used by web maps. WGS84 datum (standard GPS).
      </div>
    </div>
  );
}

// ============================================================================
// 3. Batch CSV Converter
// ============================================================================

function BatchConverter() {
  const [csvInput, setCsvInput] = useState('name,latitude,longitude\nField A,37.77,-122.42\nField B,19.43,-99.13\nField C,-33.45,-70.66');
  const [convertType, setConvertType] = useState<'decimal_to_dms' | 'decimal_to_utm'>('decimal_to_utm');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const lines = csvInput.trim().split('\n');
    if (lines.length < 2) return 'Enter CSV with header + data rows';
    const header = lines[0].split(',').map(h => h.trim());
    const latIdx = header.findIndex(h => h.toLowerCase().includes('lat'));
    const lngIdx = header.findIndex(h => h.toLowerCase().includes('lon') || h.toLowerCase().includes('lng'));
    if (latIdx === -1 || lngIdx === -1) return 'CSV must have "latitude" and "longitude" columns';

    let outHeader = header.join(',');
    if (convertType === 'decimal_to_utm') outHeader += ',utm_zone,easting,northing';
    else outHeader += ',dms';

    const outLines = [outHeader];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      const lat = parseFloat(cols[latIdx]);
      const lng = parseFloat(cols[lngIdx]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      
      if (convertType === 'decimal_to_utm') {
        const utm = latLngToUtm(lat, lng);
        outLines.push([...cols, `${utm.zone}${utm.hemisphere}`, String(utm.easting), String(utm.northing)].join(','));
      } else {
        const dmsLat = decimalToDmsStr(lat, true);
        const dmsLng = decimalToDmsStr(lng, false);
        outLines.push([...cols, `${dmsLat} ${dmsLng}`].join(','));
      }
    }
    return outLines.join('\n');
  }, [csvInput, convertType]);

  const copy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const download = () => {
    const blob = new Blob([result], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'converted_coordinates.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
        <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Conversion output</Label>
        <select value={convertType} onChange={e => setConvertType(e.target.value as any)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-xs shadow-sm">
          <option value="decimal_to_utm">Decimal → UTM</option>
          <option value="decimal_to_dms">Decimal → DMS</option>
        </select>
      </div>
      <div>
        <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Input CSV</Label>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Include <code className="rounded bg-muted px-1">latitude</code> and <code className="rounded bg-muted px-1">longitude</code> columns.</p>
        <Textarea value={csvInput} onChange={e => setCsvInput(e.target.value)} className="mt-2 min-h-[140px] text-xs font-mono" />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button size="sm" variant="outline" onClick={copy} className="gap-1.5 text-xs flex-1">
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} Copy Result
        </Button>
        <Button size="sm" variant="outline" onClick={download} className="gap-1.5 text-xs flex-1">
          <Download className="h-3.5 w-3.5" /> Download CSV
        </Button>
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Output</Label>
          <Badge variant="outline" className="text-[10px]">Ready to export</Badge>
        </div>
        <Textarea value={result} readOnly className="min-h-[140px] bg-muted/30 text-xs font-mono" />
      </div>
      <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">
        💡 Paste a CSV from Excel with latitude/longitude columns. The converter adds UTM or DMS columns to each row. Perfect for converting farm GPS data for use in maps or machinery.
      </div>
    </div>
  );
}

function decimalToDmsStr(val: number, isLat: boolean): string {
  const absVal = Math.abs(val);
  const d = Math.floor(absVal);
  const m = Math.floor((absVal - d) * 60);
  const s = Math.round(((absVal - d) * 60 - m) * 60 * 100) / 100;
  const dir = isLat ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
  return `${d}°${m}'${s}"${dir}`;
}

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof MapPin; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${active ? 'bg-indigo-100 text-indigo-700 shadow-sm dark:bg-indigo-950/50 dark:text-indigo-300' : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'}`}>
      <Icon className="h-3.5 w-3.5" /><span>{label}</span>
    </button>
  );
}
