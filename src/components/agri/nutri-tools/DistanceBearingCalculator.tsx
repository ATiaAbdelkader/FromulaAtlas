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

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Compass, ArrowRight, MapPin, Download, Copy, Check,
  Navigation, Globe2, FileSpreadsheet, Layers, AlertTriangle,
  CheckCircle2, RotateCcw,
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
import { copyFor, useTranslation } from '@/lib/language-store';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

type Tab = 'point' | 'destination' | 'batch' | 'fields';

const TITLE: TrilingualString = {
  en: 'Distance & Bearing Calculator',
  ar: 'حاسبة المسافة والاتجاه',
  fr: 'Calculateur de Distance & Azimut',
};

const DESC: TrilingualString = {
  en: 'Vincenty geodesic distance, initial + final bearing, midpoint, batch CSV processing, and field-to-field centroid / edge distances on the WGS84 ellipsoid.',
  ar: 'حساب دقيق للمسافة والاتجاه على مجسم WGS84، معالجة دفعة CSV، ومسافات بين الحقول (مركز/حافة).',
  fr: 'Distance géodésique (Vincenty), azimuts, point milieu, traitement par lot CSV et distances inter-parcelles sur l\'ellipsoïde WGS84.',
};

const TAB_LABELS: Record<Tab, TrilingualString> = {
  point:       { en: 'Point-to-Point',  ar: 'من نقطة إلى نقطة',     fr: 'Point à Point' },
  destination: { en: 'Destination',     ar: 'الوجهة',                fr: 'Destination' },
  batch:       { en: 'Batch CSV',       ar: 'CSV متعدد السجلات',     fr: 'Lot CSV' },
  fields:      { en: 'Field-to-Field',  ar: 'من حقل إلى حقل',        fr: 'Parcelle à Parcelle' },
};

// ============================================================================
// Main component
// ============================================================================

export function DistanceBearingCalculator() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);
  const [tab, setTab] = useState<Tab>('point');
  const [copied, setCopied] = useState(false);

  const handleCopySummary = () => {
    const text = `=== DISTANCE & BEARING CALCULATOR ===\nActive tab: ${tr(TAB_LABELS[tab].en, TAB_LABELS[tab].ar, TAB_LABELS[tab].fr)}\n\nUse the per-tab "Copy Summary" button to copy detailed geodesic results.`.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: tr('Summary Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleReset = () => {
    setTab('point');
    toast({ title: tr('Reset to Point-to-Point', 'تمت الإعادة إلى نقطة-نقطة', 'Réinitialisé') });
  };

  return (
    <CalculatorShell
      icon={Compass}
      title={TITLE}
      description={DESC}
      badge="WGS84 Geodesic"
      accent="sky"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' },
          onClick: handleCopySummary,
          variant: 'primary',
          showCheck: copied,
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
    >
      <div className="lg:col-span-12 space-y-4">
        {/* Tab Switcher Bar */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/50 p-1 sm:grid-cols-4">
          <TabBtn active={tab === 'point'} onClick={() => setTab('point')} icon={Navigation} label={tr(TAB_LABELS.point.en, TAB_LABELS.point.ar, TAB_LABELS.point.fr)} />
          <TabBtn active={tab === 'destination'} onClick={() => setTab('destination')} icon={Globe2} label={tr(TAB_LABELS.destination.en, TAB_LABELS.destination.ar, TAB_LABELS.destination.fr)} />
          <TabBtn active={tab === 'batch'} onClick={() => setTab('batch')} icon={FileSpreadsheet} label={tr(TAB_LABELS.batch.en, TAB_LABELS.batch.ar, TAB_LABELS.batch.fr)} />
          <TabBtn active={tab === 'fields'} onClick={() => setTab('fields')} icon={Layers} label={tr(TAB_LABELS.fields.en, TAB_LABELS.fields.ar, TAB_LABELS.fields.fr)} />
        </div>

        {/* Tab Body */}
        {tab === 'point' && <PointToPoint />}
        {tab === 'destination' && <Destination />}
        {tab === 'batch' && <BatchCsv />}
        {tab === 'fields' && <FieldToField />}
      </div>
    </CalculatorShell>
  );
}

// ============================================================================
// Tab 1 — Point-to-Point
// ============================================================================

function PointToPoint() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);
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
      tr(`Distance: ${formatDistance(result.distance)} (${result.distance.toFixed(2)} m)`, `المسافة: ${formatDistance(result.distance)} (${result.distance.toFixed(2)} م)`),
      tr(`Initial bearing: ${result.initialBearing.toFixed(2)}° (${compass16(result.initialBearing)})`, `الاتجاه الابتدائي: ${result.initialBearing.toFixed(2)}° (${compass16(result.initialBearing)})`),
      tr(`Final bearing: ${result.finalBearing.toFixed(2)}° (${compass16(result.finalBearing)})`, `الاتجاه النهائي: ${result.finalBearing.toFixed(2)}° (${compass16(result.finalBearing)})`),
      mid ? tr(`Midpoint: ${mid.lat.toFixed(6)}, ${mid.lng.toFixed(6)}`, `نقطة المنتصف: ${mid.lat.toFixed(6)}, ${mid.lng.toFixed(6)}`) : '',
    ].filter(Boolean).join('\n');
  }, [language, result, mid]);

  const copy = () => { navigator.clipboard.writeText(summary); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2 rounded-xl border border-cyan-200/70 bg-cyan-50/30 p-3 dark:border-cyan-950/70 dark:bg-cyan-950/10">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">{tr('Point A (from)', 'النقطة أ (من)')}</div>
          <div>
            <Label className="text-[10px]">{tr('Latitude', 'خط العرض')}</Label>
            <Input value={aLat} onChange={e => setALat(e.target.value)} type="number" step="0.000001" className="mt-1 h-10 text-xs sm:h-8" />
          </div>
          <div>
            <Label className="text-[10px]">{tr('Longitude', 'خط الطول')}</Label>
            <Input value={aLng} onChange={e => setALng(e.target.value)} type="number" step="0.000001" className="mt-1 h-10 text-xs sm:h-8" />
          </div>
        </div>
        <div className="space-y-2 rounded-xl border border-emerald-200/70 bg-emerald-50/30 p-3 dark:border-emerald-950/70 dark:bg-emerald-950/10">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{tr('Point B (to)', 'النقطة ب (إلى)')}</div>
          <div>
            <Label className="text-[10px]">{tr('Latitude', 'خط العرض')}</Label>
            <Input value={bLat} onChange={e => setBLat(e.target.value)} type="number" step="0.000001" className="mt-1 h-10 text-xs sm:h-8" />
          </div>
          <div>
            <Label className="text-[10px]">{tr('Longitude', 'خط الطول')}</Label>
            <Input value={bLng} onChange={e => setBLng(e.target.value)} type="number" step="0.000001" className="mt-1 h-10 text-xs sm:h-8" />
          </div>
        </div>
      </div>

      {result && (
        <>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Metric label={tr('Distance', 'المسافة')} value={formatDistance(result.distance)} sub={`${result.distance.toFixed(1)} m`} accent="cyan" />
            <Metric label={tr('Initial Bearing', 'الاتجاه الابتدائي')} value={`${result.initialBearing.toFixed(1)}°`} sub={compass16(result.initialBearing)} accent="emerald" />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Metric label={tr('Final Bearing', 'الاتجاه النهائي')} value={`${result.finalBearing.toFixed(1)}°`} sub={compass16(result.finalBearing)} accent="indigo" />
            {mid && (
              <Metric label={tr('Midpoint', 'نقطة المنتصف')} value={`${mid.lat.toFixed(5)}, ${mid.lng.toFixed(5)}`} sub="lat, lng" accent="amber" />
            )}
          </div>
          {!result.converged && (
            <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-2 text-[10px] text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{tr('Vincenty did not converge (likely near-antipodal points). Falling back to haversine — accuracy < 0.5%.', 'لم تتقارب خوارزمية فينسنتي (غالباً بسبب نقاط متقابلة تقريباً). تم الرجوع إلى هافرسين — دقة أقل من 0.5%.')}</span>
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={copy} className="gap-1.5 text-xs flex-1">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} {tr('Copy Summary', 'نسخ الملخص')}
            </Button>
          </div>
        </>
      )}

      <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-[10px] leading-relaxed text-muted-foreground">
        {tr('Vincenty inverse formula on the WGS84 ellipsoid gives millimetre-level accuracy — far better than haversine for surveyor-grade work. Bearing is initial (at A); final bearing differs slightly due to meridian convergence.', 'تعطي صيغة فينسنتي العكسية على مجسم WGS84 دقة بمستوى المليمتر، وهي أدق كثيراً من هافرسين لأعمال المساحة. الاتجاه ابتدائي (عند أ)، وقد يختلف الاتجاه النهائي قليلاً بسبب تقارب خطوط الطول.')}
      </div>
    </div>
  );
}

// ============================================================================
// Tab 2 — Destination
// ============================================================================

function Destination() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);
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
      tr(`Start: ${lat}, ${lng}`, `البداية: ${lat}, ${lng}`),
      tr(`Bearing: ${bearing}° (${compass16(parseFloat(bearing))})`, `الاتجاه: ${bearing}° (${compass16(parseFloat(bearing))})`),
      tr(`Distance: ${distance} m (${formatDistance(parseFloat(distance))})`, `المسافة: ${distance} م (${formatDistance(parseFloat(distance))})`),
      tr(`Destination: ${result.point.lat.toFixed(6)}, ${result.point.lng.toFixed(6)}`, `الوجهة: ${result.point.lat.toFixed(6)}, ${result.point.lng.toFixed(6)}`),
      tr(`Final bearing: ${result.finalBearing.toFixed(2)}°`, `الاتجاه النهائي: ${result.finalBearing.toFixed(2)}°`),
    ].join('\n');
  }, [bearing, distance, language, lat, lng, result]);

  const copy = () => { navigator.clipboard.writeText(summary); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <Label className="text-[10px]">{tr('Start Latitude', 'خط عرض البداية')}</Label>
          <Input value={lat} onChange={e => setLat(e.target.value)} type="number" step="0.000001" className="mt-1 h-10 text-xs sm:h-8" />
        </div>
        <div>
          <Label className="text-[10px]">{tr('Start Longitude', 'خط طول البداية')}</Label>
          <Input value={lng} onChange={e => setLng(e.target.value)} type="number" step="0.000001" className="mt-1 h-10 text-xs sm:h-8" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <Label className="text-[10px]">{tr('Bearing (° clockwise from N)', 'الاتجاه (° باتجاه عقارب الساعة من الشمال)')}</Label>
          <Input value={bearing} onChange={e => setBearing(e.target.value)} type="number" step="0.1" className="mt-1 h-10 text-xs sm:h-8" />
        </div>
        <div>
          <Label className="text-[10px]">{tr('Distance (m)', 'المسافة (م)')}</Label>
          <Input value={distance} onChange={e => setDistance(e.target.value)} type="number" step="0.01" className="mt-1 h-10 text-xs sm:h-8" />
        </div>
      </div>

      {result && (
        <>
          <div className="rounded-lg border border-cyan-200 dark:border-cyan-900 bg-cyan-50/40 dark:bg-cyan-950/20 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-cyan-600" />
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{tr('Destination Point', 'نقطة الوجهة')}</span>
            </div>
            <div className="text-lg font-bold font-mono text-cyan-700 dark:text-cyan-300">
              {result.point.lat.toFixed(6)}, {result.point.lng.toFixed(6)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {tr('Final bearing on arrival:', 'الاتجاه النهائي عند الوصول:')} <strong className="font-mono">{result.finalBearing.toFixed(2)}°</strong> ({compass16(result.finalBearing)})
            </div>
          </div>

          {/* Compass visualisation */}
          <div className="flex justify-center">
            <CompassRose bearing={parseFloat(bearing) || 0} finalBearing={result.finalBearing} />
          </div>

          <Button size="sm" variant="outline" onClick={copy} className="gap-1.5 text-xs w-full">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} {tr('Copy Summary', 'نسخ الملخص')}
          </Button>
        </>
      )}

      <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-[10px] leading-relaxed text-muted-foreground">
        {tr('Useful for "where will I end up if I walk 500 m NE from the barn?" or for laying out sample points at known offsets along a transect.', 'مفيد للإجابة عن سؤال «أين أصل إذا مشيت 500 م شمال شرق الحظيرة؟» أو لتخطيط نقاط عينات بإزاحات معلومة على طول مسار.')}
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
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);
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
          <Label className="text-[10px]">{tr('Origin Latitude', 'خط عرض نقطة الأصل')}</Label>
          <Input value={originLat} onChange={e => setOriginLat(e.target.value)} type="number" step="0.000001" className="mt-1 h-10 text-xs sm:h-8" />
        </div>
        <div>
          <Label className="text-[10px]">{tr('Origin Longitude', 'خط طول نقطة الأصل')}</Label>
          <Input value={originLng} onChange={e => setOriginLng(e.target.value)} type="number" step="0.000001" className="mt-1 h-10 text-xs sm:h-8" />
        </div>
      </div>

      <div>
        <Label className="text-[10px]">{tr('Destinations CSV (header must include latitude + longitude; name optional)', 'CSV للوجهات (يجب أن يتضمن العنوان خط العرض وخط الطول؛ والاسم اختياري)')}</Label>
        <Textarea value={csvInput} onChange={e => setCsvInput(e.target.value)} className="text-xs font-mono mt-0.5 min-h-[100px]" />
      </div>

      {result && result.error !== null && (
        <div className="rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 p-2 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span className="font-mono">{tr(result.error, 'يتطلب ملف CSV عنواناً وصفاً واحداً صالحاً على الأقل، مع أعمدة خط العرض وخط الطول.')}</span>
        </div>
      )}

      {result && result.error === null && result.rows.length > 0 && (
        <>
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 p-2 text-xs">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span className="font-medium">{tr(`${result.rows.length} destination${result.rows.length > 1 ? 's' : ''} computed`, `تم حساب ${result.rows.length} وجهة`)}</span>
            </div>
            <div className="text-muted-foreground mt-0.5 text-[10px]">
              {tr('Total path (origin → all):', 'إجمالي المسار (الأصل ← الكل):')} {formatDistance(result.rows.reduce((s, r) => s + r.distance, 0))}
              {' · '}
              {tr('Closest:', 'الأقرب:')} {formatDistance(Math.min(...result.rows.map(r => r.distance)))}
              {' · '}
              {tr('Farthest:', 'الأبعد:')} {formatDistance(Math.max(...result.rows.map(r => r.distance)))}
            </div>
          </div>

          <div className="border rounded-md max-h-[200px] overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                <tr className="text-left text-[10px] text-muted-foreground uppercase">
                  <th className="px-2 py-1">{tr('Name', 'الاسم')}</th>
                  <th className="px-2 py-1">Distance</th>
                  <th className="px-2 py-1">{tr('Bearing', 'الاتجاه')}</th>
                  <th className="px-2 py-1">{tr('Compass', 'البوصلة')}</th>
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
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} {tr('Copy CSV', 'نسخ CSV')}
            </Button>
            <Button size="sm" onClick={download} className="gap-1.5 text-xs flex-1">
              <Download className="h-3.5 w-3.5" /> {tr('Download CSV', 'تنزيل CSV')}
            </Button>
          </div>
        </>
      )}

      <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-[10px] leading-relaxed text-muted-foreground">
        {tr('Useful for "from the barn, how far is each field?" or for laying out irrigation mainline runs. Paste a CSV from Excel or from the Coordinate Converter\'s batch output.', 'مفيد للإجابة عن «كم يبعد كل حقل عن الحظيرة؟» أو لتخطيط خطوط الري الرئيسية. الصق ملف CSV من Excel أو من مخرجات محول الإحداثيات المتعددة.')}
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
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);
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
          <Label className="text-[10px]">{tr('Field A (paste GeoJSON / KML / WKT / CSV)', 'الحقل أ (الصق GeoJSON / KML / WKT / CSV)')}</Label>
          <Textarea value={aText} onChange={e => setAText(e.target.value)} className="text-xs font-mono mt-0.5 min-h-[80px]" />
        </div>
        <div>
          <Label className="text-[10px]">{tr('Field B (paste GeoJSON / KML / WKT / CSV)', 'الحقل ب (الصق GeoJSON / KML / WKT / CSV)')}</Label>
          <Textarea value={bText} onChange={e => setBText(e.target.value)} className="text-xs font-mono mt-0.5 min-h-[80px]" />
        </div>
      </div>

      {result.error !== null && (
        <div className="rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 p-2 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span className="font-mono">{tr(result.error, 'تعذر تحليل حدود الحقل. راجع صحة بيانات GeoJSON أو KML أو WKT أو CSV.')}</span>
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
              <Metric label={tr('Centroid Distance', 'مسافة المركز')} value={formatDistance(result.centroidDistance)} sub={`${result.centroidDistance.toFixed(1)} m`} accent="cyan" />
              <Metric label={tr('Bearing A→B', 'الاتجاه أ←ب')} value={`${result.centroidBearing.toFixed(1)}°`} sub={result.centroidCompass} accent="emerald" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Metric label={tr('Edge-to-Edge (min)', 'من حافة إلى حافة (الأدنى)')} value={formatDistance(result.edgeDistance)} sub={`${result.edgeDistance.toFixed(1)} m`} accent="indigo" />
              <Metric label={tr('Combined Area', 'المساحة المجمعة')} value={formatDistance(result.aArea + result.bArea)} sub={`${((result.aArea + result.bArea) / 10000).toFixed(2)} ha`} accent="amber" />
            </div>
            {result.closestPair && (
              <div className="text-[10px] text-muted-foreground font-mono pt-1 border-t border-cyan-200/50 dark:border-cyan-900/50">
                {tr('Nearest points: A', 'أقرب النقاط: أ')} ({result.closestPair.a[1].toFixed(5)}, {result.closestPair.a[0].toFixed(5)}) ↔ {tr('B', 'ب')} ({result.closestPair.b[1].toFixed(5)}, {result.closestPair.b[0].toFixed(5)})
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="rounded-md border bg-muted/20 p-2">
              <div className="font-medium text-muted-foreground uppercase tracking-wide">{tr('Field A', 'الحقل أ')}</div>
              <div>{(result.aArea / 10000).toFixed(2)} {tr('ha', 'هكتار')} · {result.aVertices} {tr('verts', 'رؤوس')}</div>
            </div>
            <div className="rounded-md border bg-muted/20 p-2">
              <div className="font-medium text-muted-foreground uppercase tracking-wide">{tr('Field B', 'الحقل ب')}</div>
              <div>{(result.bArea / 10000).toFixed(2)} {tr('ha', 'هكتار')} · {result.bVertices} {tr('verts', 'رؤوس')}</div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-[10px] leading-relaxed text-muted-foreground">
        {tr('Paste boundaries from the Field Boundary Importer (#2). Centroid distance is for planning travel routes; edge-to-edge minimum is for shared-fence / irrigation-line / spray-buffer calculations.', 'الصق الحدود من مستورد حدود الحقول (#2). تستخدم مسافة المركز لتخطيط مسارات التنقل، بينما يستخدم الحد الأدنى بين الحافتين لحسابات السياج المشترك أو خطوط الري أو مناطق حواجز الرش.')}
      </div>
    </div>
  );
}

// ============================================================================
// Compass rose SVG (for Destination tab)
// ============================================================================

function CompassRose({ bearing, finalBearing }: { bearing: number; finalBearing: number }) {
  const { language } = useTranslation();
  const size = 160, c = size / 2, r = c - 12;
  const toXY = (deg: number, rad: number) => {
    const a = (deg - 90) * Math.PI / 180;
    return [c + rad * Math.cos(a), c + rad * Math.sin(a)] as const;
  };
  const [ax, ay] = toXY(bearing, r * 0.85);
  const [fx, fy] = toXY(finalBearing, r * 0.6);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={copyFor(language, 'Compass rose', 'وردة البوصلة')}>
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
    <div className={`rounded-xl border px-3 py-2 ${ACCENT_BG[accent] || ACCENT_BG.cyan}`}>
      <div className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="font-mono text-sm font-semibold">{value}</div>
      {sub && <div className="text-[9px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Compass; label: string }) {
  return (
      <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${active ? 'bg-cyan-100 text-cyan-700 shadow-sm dark:bg-cyan-950/50 dark:text-cyan-300' : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'}`}
    >
      <Icon className="h-3.5 w-3.5" /><span>{label}</span>
    </button>
  );
}
