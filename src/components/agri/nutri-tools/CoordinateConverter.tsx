'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  MapPin, Copy, Check, ArrowRight, Upload, Download, RotateCcw,
} from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
  type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';

const TITLE: TrilingualString = {
  en: 'Coordinate Converter',
  ar: 'محول الإحداثيات',
  fr: 'Convertisseur de Coordonnées',
};

const DESC: TrilingualString = {
  en: 'DMS ↔ Decimal · UTM ↔ Lat/Lng · Batch CSV — WGS84 datum (standard GPS).',
  ar: 'درجات/دقائق/ثوانٍ ↔ عشري · UTM ↔ خط العرض/الطول · CSV متعدد — مرجع WGS84 (معيار GPS).',
  fr: 'DMS ↔ Décimal · UTM ↔ Lat/Lng · CSV en lot — datum WGS84 (GPS standard).',
};

const PILL_LABEL: TrilingualString = { en: 'Conversion mode:', ar: 'نمط التحويل:', fr: 'Mode :' };

const PROTOCOL_NOTE: TrilingualString = {
  en: 'DMS (Degrees/Minutes/Seconds) is used by surveyors and older GPS devices. Decimal degrees is used by web maps, APIs, and our NDVI/Weather tools. UTM is used by farm machinery and surveyors. WGS84 datum (standard GPS).',
  ar: 'تُستخدم صيغة الدرجات/الدقائق/الثواني من قِبل المسّاحين وأجهزة GPS الأقدم. وتُستخدم الدرجات العشرية في خرائط الويب وواجهات البرمجة وأدوات NDVI والطقس. ويستخدم UTM في الآلات الزراعية والمسّاحين. مرجع WGS84 (معيار GPS).',
  fr: 'Le format DMS (Degrés/Minutes/Secondes) est utilisé par les géomètres et les anciens GPS. Les degrés décimaux sont utilisés par les cartes web, les API et nos outils NDVI/Météo. L’UTM est utilisé par les machines agricoles et géomètres. Datum WGS84 (GPS standard).',
};

type Tab = 'dms' | 'utm' | 'batch';

const PILLS: CalculatorPill[] = [
  { key: 'dms', label: 'DMS ↔ Decimal', emoji: '🌐' },
  { key: 'utm', label: 'UTM ↔ Lat/Lng', emoji: '🗺️' },
  { key: 'batch', label: 'Batch CSV', emoji: '📊' },
];

export function CoordinateConverter() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const [tab, setTab] = useState<Tab>('dms');
  const [summary, setSummary] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!summary) {
      toast({ title: tr('Nothing to copy yet', 'لا يوجد شيء للنسخ بعد', 'Rien à copier') });
      return;
    }
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast({ title: tr('Summary Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleReset = () => {
    setSummary('');
    // Each sub-component will reset its own inputs when key changes; force a remount.
    setTab(t => (t === t ? t : t));
    // Force remount via key bump.
    setResetKey(k => k + 1);
    toast({ title: tr('Reset', 'إعادة', 'Réinitialiser') });
  };
  const [resetKey, setResetKey] = useState(0);

  return (
    <CalculatorShell
      icon={MapPin}
      title={TITLE}
      description={DESC}
      badge={tr('WGS84', 'WGS84', 'WGS84')}
      accent="sky"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' },
          onClick: handleCopy,
          variant: 'primary',
          showCheck: copied,
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      pills={PILLS}
      activePill={tab}
      onPillClick={(k) => setTab(k as Tab)}
      pillLabel={PILL_LABEL}
      protocolNote={PROTOCOL_NOTE}
    >
      <div className="lg:col-span-12">
        {tab === 'dms' && <DmsConverter key={`dms-${resetKey}`} language={language} onSummary={setSummary} />}
        {tab === 'utm' && <UtmConverter key={`utm-${resetKey}`} language={language} onSummary={setSummary} />}
        {tab === 'batch' && <BatchConverter key={`batch-${resetKey}`} language={language} onSummary={setSummary} />}
      </div>
    </CalculatorShell>
  );
}

// ============================================================================
// 1. DMS ↔ Decimal Degrees
// ============================================================================

type UiLang = Parameters<typeof copyFor>[0];

function DmsConverter({ language, onSummary }: { language: UiLang; onSummary: (s: string) => void }) {
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
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

  // Push summary up.
  useMemo(() => {
    const dmsStr = decimalToDms
      ? `${decimalToDms.d}° ${decimalToDms.m}' ${decimalToDms.s}" ${decimalToDms.dir}`
      : '—';
    onSummary(
      `=== COORDINATE CONVERSION (DMS ↔ Decimal) ===\n` +
      `DMS input: ${deg}° ${min}' ${sec}" ${direction}\n` +
      `Decimal: ${dmsToDecimal}°\n` +
      `Decimal → DMS: ${dmsStr}\n` +
      `Datum: WGS84`.trim(),
    );
  }, [deg, min, sec, direction, decimal, dmsToDecimal, decimalToDms]);

  const copy = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="space-y-4">
      {/* DMS → Decimal */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{tr('DMS → Decimal Degrees', 'درجات/دقائق/ثوانٍ ←→ درجات عشرية', 'DMS → Degrés décimaux')}</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div><Label className="text-[10px]">{tr('Degrees (°)', 'الدرجات (°)', 'Degrés (°)')}</Label><Input value={deg} onChange={e => setDeg(e.target.value)} type="number" className="h-8 text-xs mt-0.5" /></div>
          <div><Label className="text-[10px]">{tr("Minutes (')", "الدقائق (')", "Minutes (')")}</Label><Input value={min} onChange={e => setMin(e.target.value)} type="number" className="h-8 text-xs mt-0.5" /></div>
          <div><Label className="text-[10px]">{tr('Seconds (")', 'الثواني (")', 'Secondes (")')}</Label><Input value={sec} onChange={e => setSec(e.target.value)} type="number" step="0.01" className="h-8 text-xs mt-0.5" /></div>
          <div>
            <Label className="text-[10px]">{tr('Direction', 'الاتجاه', 'Direction')}</Label>
            <div className="flex gap-0.5 mt-0.5">
              {(['N', 'S', 'E', 'W'] as const).map(d => (
                <button key={d} onClick={() => setDirection(d)} className={`flex-1 h-8 text-xs rounded border ${direction === d ? 'bg-sky-600 text-white border-sky-600' : 'border-border'}`}>{d}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <div className="flex-1 rounded-xl border border-sky-200 bg-sky-50/50 p-3 dark:border-sky-900 dark:bg-sky-950/20">
            <div className="text-[10px] text-muted-foreground">{tr('Decimal Degrees', 'الدرجات العشرية', 'Degrés décimaux')}</div>
            <div className="text-lg font-bold font-mono text-sky-700 dark:text-sky-300">{dmsToDecimal}°</div>
          </div>
          <Button size="sm" variant="outline" onClick={() => copy(String(dmsToDecimal))} className="gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} {tr('Copy', 'نسخ', 'Copier')}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center"><ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" /></div>

      {/* Decimal → DMS */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{tr('Decimal → DMS', 'درجات عشرية ←→ درجات/دقائق/ثوانٍ', 'Décimal → DMS')}</div>
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1"><Label className="text-[10px]">{tr('Decimal degrees', 'الدرجات العشرية', 'Degrés décimaux')}</Label><Input value={decimal} onChange={e => setDecimal(e.target.value)} type="number" step="0.000001" placeholder={tr('e.g. 37.770000', 'مثال: 37.770000', 'ex. 37.770000')} className="h-8 text-xs mt-0.5" /></div>
        </div>
        {decimalToDms && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
            <div className="text-[10px] text-muted-foreground">{tr('DMS Format', 'صيغة درجات/دقائق/ثوانٍ', 'Format DMS')}</div>
            <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300">
              {decimalToDms.d}° {decimalToDms.m}' {decimalToDms.s}" {decimalToDms.dir}
            </div>
          </div>
        )}
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

function UtmConverter({ language, onSummary }: { language: UiLang; onSummary: (s: string) => void }) {
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
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

  useMemo(() => {
    onSummary(
      `=== COORDINATE CONVERSION (UTM ↔ Lat/Lng) ===\n` +
      `Lat/Lng input: ${lat}, ${lng}\n` +
      (utmResult ? `UTM: Zone ${utmResult.zone}${utmResult.hemisphere}, E ${utmResult.easting}, N ${utmResult.northing}\n` : '') +
      (latlngResult ? `UTM → Lat/Lng: ${latlngResult.lat}, ${latlngResult.lng}\n` : '') +
      `Datum: WGS84`.trim(),
    );
  }, [lat, lng, utmResult, latlngResult]);

  const copy = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="space-y-4">
      {/* Lat/Lng → UTM */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{tr('Lat/Lng → UTM', 'خط العرض/الطول ←→ UTM', 'Lat/Lng → UTM')}</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div><Label className="text-[10px]">{tr('Latitude', 'خط العرض', 'Latitude')}</Label><Input value={lat} onChange={e => setLat(e.target.value)} type="number" step="0.000001" className="h-8 text-xs mt-0.5" /></div>
          <div><Label className="text-[10px]">{tr('Longitude', 'خط الطول', 'Longitude')}</Label><Input value={lng} onChange={e => setLng(e.target.value)} type="number" step="0.000001" className="h-8 text-xs mt-0.5" /></div>
        </div>
        {utmResult && (
          <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3 shadow-sm dark:border-sky-900 dark:bg-sky-950/20 space-y-1">
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div><span className="text-muted-foreground">{tr('Zone:', 'المنطقة:', 'Zone :')}</span> <strong>{utmResult.zone}{utmResult.hemisphere}</strong></div>
              <div><span className="text-muted-foreground">{tr('Easting:', 'الإحداثي الشرقي:', 'Easting :')}</span> <strong className="font-mono">{utmResult.easting}</strong></div>
              <div><span className="text-muted-foreground">{tr('Northing:', 'الإحداثي الشمالي:', 'Northing :')}</span> <strong className="font-mono">{utmResult.northing}</strong></div>
              <Button size="sm" variant="ghost" onClick={() => copy(`${utmResult.easting}, ${utmResult.northing}, ${utmResult.zone}${utmResult.hemisphere}`)} className="h-6 text-[10px] gap-1">
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />} {tr('Copy', 'نسخ', 'Copier')}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center"><ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" /></div>

      {/* UTM → Lat/Lng */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{tr('UTM → Lat/Lng', 'UTM ←→ خط العرض/الطول', 'UTM → Lat/Lng')}</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div><Label className="text-[10px]">{tr('Easting', 'الإحداثي الشرقي', 'Easting')}</Label><Input value={easting} onChange={e => setEasting(e.target.value)} type="number" placeholder={tr('e.g. 551234', 'مثال: 551234', 'ex. 551234')} className="h-8 text-xs mt-0.5" /></div>
          <div><Label className="text-[10px]">{tr('Northing', 'الإحداثي الشمالي', 'Northing')}</Label><Input value={northing} onChange={e => setNorthing(e.target.value)} type="number" placeholder={tr('e.g. 4180345', 'مثال: 4180345', 'ex. 4180345')} className="h-8 text-xs mt-0.5" /></div>
          <div><Label className="text-[10px]">{tr('Zone', 'المنطقة', 'Zone')}</Label><Input value={zone} onChange={e => setZone(e.target.value)} type="number" min="1" max="60" className="h-8 text-xs mt-0.5" /></div>
          <div>
            <Label className="text-[10px]">{tr('Hemisphere', 'نصف الكرة', 'Hémisphère')}</Label>
            <div className="flex gap-0.5 mt-0.5">
              <button onClick={() => setHemisphere('N')} className={`flex-1 h-8 text-xs rounded border ${hemisphere === 'N' ? 'bg-sky-600 text-white border-sky-600' : 'border-border'}`}>N</button>
              <button onClick={() => setHemisphere('S')} className={`flex-1 h-8 text-xs rounded border ${hemisphere === 'S' ? 'bg-sky-600 text-white border-sky-600' : 'border-border'}`}>S</button>
            </div>
          </div>
        </div>
        {latlngResult && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
            <div className="text-[10px] text-muted-foreground">{tr('Latitude / Longitude (WGS84)', 'خط العرض / خط الطول (WGS84)', 'Latitude / Longitude (WGS84)')}</div>
            <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300">
              {latlngResult.lat}, {latlngResult.lng}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 3. Batch CSV Converter
// ============================================================================

function BatchConverter({ language, onSummary }: { language: UiLang; onSummary: (s: string) => void }) {
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
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

  useMemo(() => { onSummary(result); }, [result]);

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
        <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{tr('Conversion output', 'مخرجات التحويل', 'Sortie de conversion')}</Label>
        <select value={convertType} onChange={e => setConvertType(e.target.value as any)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-xs shadow-sm">
          <option value="decimal_to_utm">{tr('Decimal → UTM', 'عشري ←→ UTM', 'Décimal → UTM')}</option>
          <option value="decimal_to_dms">{tr('Decimal → DMS', 'عشري ←→ درجات/دقائق/ثوانٍ', 'Décimal → DMS')}</option>
        </select>
      </div>
      <div>
        <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{tr('Input CSV', 'ملف CSV للإدخال', 'CSV en entrée')}</Label>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{tr('Include ', 'يتضمن الملف أعمدة ', 'Doit inclure des colonnes ')}<code className="rounded bg-muted px-1">latitude</code> {tr('and', 'و', 'et')} <code className="rounded bg-muted px-1">longitude</code> {tr('columns.', '.', '.')}</p>
        <Textarea value={csvInput} onChange={e => setCsvInput(e.target.value)} className="mt-2 min-h-[140px] text-xs font-mono" />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button size="sm" variant="outline" onClick={copy} className="gap-1.5 text-xs flex-1">
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} {tr('Copy Result', 'نسخ النتيجة', 'Copier')}
        </Button>
        <Button size="sm" variant="outline" onClick={download} className="gap-1.5 text-xs flex-1">
          <Download className="h-3.5 w-3.5" /> {tr('Download CSV', 'تنزيل CSV', 'Télécharger CSV')}
        </Button>
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{tr('Output', 'المخرجات', 'Sortie')}</Label>
          <Badge variant="outline" className="text-[10px]">{tr('Ready to export', 'جاهز للتصدير', 'Prêt à exporter')}</Badge>
        </div>
        <Textarea value={result} readOnly className="min-h-[140px] bg-muted/30 text-xs font-mono" />
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
