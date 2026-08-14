'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Cloud, Droplets, ExternalLink, Loader2, MapPin, Printer, RefreshCw, Satellite, Save, ScanLine, Wind } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { copyFor, useTranslation, type Language } from '@/lib/language-store';
import { useWeatherStore, type WeatherData } from '@/lib/weather-store';
import { readSavedFields, type SavedFieldRecord } from '@/lib/farm-digital-twin';
import { fieldFromCenter, healthLabel, healthRecommendation, ndviColor, simulateNdvi, type NdviResult, type NdviZone } from '@/lib/satellite-service';
import { createSatelliteHealthRecord, saveSatelliteHealthRecord, SATELLITE_HEALTH_CHANGED_EVENT, type SatelliteHealthLevel } from '@/lib/satellite-health';

interface SatelliteCropHealthMonitorProps {
  onOpenFarmTool?: (storageKey: string) => void;
}

const CROP_OPTIONS = ['maize', 'tomato', 'wheat', 'rice', 'potato', 'soybean', 'cotton', 'strawberry', 'avocado'];
const GRID_SIZE = 8;

function tr(language: Language, english: string, arabic: string, french: string): string {
  return copyFor(language, english, arabic, french);
}

function numberFormat(value: number, language: Language, digits = 1): string {
  return new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en-DZ', { maximumFractionDigits: digits }).format(value);
}

function levelTone(level: SatelliteHealthLevel): string {
  return level === 'critical'
    ? 'border-rose-200 bg-rose-50/80 text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100'
    : level === 'stressed'
      ? 'border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100'
      : level === 'watch'
        ? 'border-yellow-200 bg-yellow-50/80 text-yellow-900 dark:border-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-100'
        : 'border-emerald-200 bg-emerald-50/80 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100';
}

function levelLabel(language: Language, level: SatelliteHealthLevel): string {
  const labels: Record<SatelliteHealthLevel, [string, string, string]> = {
    excellent: ['Excellent', 'ممتاز', 'Excellent'],
    watch: ['Watch', 'تحتاج متابعة', 'À surveiller'],
    stressed: ['Stressed', 'إجهاد', 'Stressée'],
    critical: ['Critical', 'حرج', 'Critique'],
  };
  return tr(language, ...labels[level]);
}

function cropLabel(language: Language, crop: string): string {
  const labels: Record<string, [string, string, string]> = {
    maize: ['Maize', 'ذرة', 'Maïs'], tomato: ['Tomato', 'طماطم', 'Tomate'], wheat: ['Wheat', 'قمح', 'Blé'], rice: ['Rice', 'أرز', 'Riz'], potato: ['Potato', 'بطاطا', 'Pomme de terre'], soybean: ['Soybean', 'صويا', 'Soja'], cotton: ['Cotton', 'قطن', 'Coton'], strawberry: ['Strawberry', 'فراولة', 'Fraise'], avocado: ['Avocado', 'أفوكادو', 'Avocat'],
  };
  return labels[crop] ? tr(language, ...labels[crop]) : crop;
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail?: string; tone: 'green' | 'amber' | 'rose' | 'slate' }) {
  const tones = {
    green: 'border-emerald-200 bg-emerald-50/80 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100',
    amber: 'border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100',
    rose: 'border-rose-200 bg-rose-50/80 text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100',
    slate: 'border-border bg-muted/25 text-foreground',
  };
  return <div className={`rounded-xl border p-3 ${tones[tone]}`}><div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</div><div className="mt-1 text-xl font-black">{value}</div>{detail && <div className="mt-1 text-[10px] opacity-70">{detail}</div>}</div>;
}

function weatherSignal(language: Language, weather: WeatherData | null): { tone: 'green' | 'amber' | 'rose'; text: string } | null {
  if (!weather) return null;
  const heat = weather.daily.tempMax >= 35 || weather.current.temperature >= 35;
  const dry = weather.daily.precipitationSum < 2 && weather.daily.et0 >= 5;
  const storm = weather.daily.windSpeedMax >= 45 || weather.current.weatherCode >= 95;
  if (storm) return { tone: 'rose', text: tr(language, 'Weather shock watch: wind or storm conditions can amplify visible crop stress.', 'مراقبة صدمة الطقس: الرياح أو العواصف قد تزيد إجهاد المحصول الظاهر.', 'Surveillance météo : vent ou orage pouvant amplifier le stress visible.') };
  if (heat && dry) return { tone: 'amber', text: tr(language, 'Heat and low rainfall may explain part of the stress signal. Validate irrigation before treating disease.', 'الحرارة وقلة الأمطار قد تفسران جزءاً من إشارة الإجهاد. تحقق من الري قبل معالجة المرض.', 'Chaleur et faibles pluies peuvent expliquer une partie du stress. Vérifiez l’irrigation avant de traiter une maladie.') };
  if (heat || dry) return { tone: 'amber', text: tr(language, 'Weather context suggests a water-stress check should accompany satellite scouting.', 'سياق الطقس يقترح أن يرافق الكشف بالقمر الصناعي فحص لإجهاد المياه.', 'Le contexte météo recommande de vérifier le stress hydrique avec l’observation satellite.') };
  return { tone: 'green', text: tr(language, 'No strong weather shock is visible in the saved forecast context. Investigate crop-specific causes if stress persists.', 'لا تظهر صدمة طقس قوية في سياق التنبؤ المحفوظ. افحص أسباب المحصول إذا استمر الإجهاد.', 'Aucun choc météo fort dans le contexte enregistré. Cherchez les causes propres à la culture si le stress persiste.') };
}

export function SatelliteCropHealthMonitor({ onOpenFarmTool }: SatelliteCropHealthMonitorProps) {
  const { language, isRTL } = useTranslation();
  const weather = useWeatherStore((state) => state.weather);
  const location = useWeatherStore((state) => state.location);
  const [fields, setFields] = useState<SavedFieldRecord[]>(() => readSavedFields());
  const [fieldId, setFieldId] = useState('');
  const [fieldName, setFieldName] = useState('Algeria field');
  const [crop, setCrop] = useState('wheat');
  const [areaHa, setAreaHa] = useState('10');
  const [latitude, setLatitude] = useState('36.7378');
  const [longitude, setLongitude] = useState('3.0867');
  const [result, setResult] = useState<NdviResult | null>(null);
  const [selectedZone, setSelectedZone] = useState<NdviZone | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const refreshFields = () => setFields(readSavedFields());

  useEffect(() => {
    refreshFields();
    const refresh = () => refreshFields();
    window.addEventListener('formula-atlas-fields-changed', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('formula-atlas-fields-changed', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  useEffect(() => {
    if (location && !result) {
      setLatitude(location.latitude.toFixed(4));
      setLongitude(location.longitude.toFixed(4));
    }
  }, [location, result]);

  useEffect(() => {
    const selected = fields.find((field) => field.id === fieldId);
    if (!selected) return;
    setFieldName(selected.name);
    setCrop(CROP_OPTIONS.includes(selected.crop) ? selected.crop : 'wheat');
    setAreaHa(String(selected.areaHa || 1));
  }, [fieldId, fields]);

  useEffect(() => {
    const refresh = () => setNotice('');
    window.addEventListener(SATELLITE_HEALTH_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(SATELLITE_HEALTH_CHANGED_EVENT, refresh);
  }, []);

  const weatherContext = useMemo(() => weatherSignal(language, weather), [language, weather]);
  const selectedHealth = result ? (result.averageNdvi < 0.3 || result.stressedAreaPct >= 35 ? 'critical' : result.averageNdvi < 0.45 || result.stressedAreaPct >= 20 ? 'stressed' : result.averageNdvi < 0.6 || result.stressedAreaPct >= 10 ? 'watch' : 'excellent') : null;
  const sourceText = result?.satellite.includes('simulated')
    ? tr(language, 'Demo signal · simulated until Sentinel Hub credentials are connected', 'إشارة تجريبية · محاكاة حتى ربط بيانات Sentinel Hub', 'Signal de démonstration · simulé jusqu’à la connexion Sentinel Hub')
    : result?.satellite ?? '';

  const useGps = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(4));
        setLongitude(position.coords.longitude.toFixed(4));
      },
      () => setNotice(tr(language, 'GPS permission was not available. Enter coordinates manually.', 'تعذر استخدام إذن GPS. أدخل الإحداثيات يدوياً.', 'Permission GPS indisponible. Saisissez les coordonnées manuellement.')),
    );
  };

  const analyze = () => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    const area = Number(areaHa);
    if (![lat, lng, area].every(Number.isFinite) || area <= 0 || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      setNotice(tr(language, 'Enter valid coordinates and an area greater than zero.', 'أدخل إحداثيات صحيحة ومساحة أكبر من صفر.', 'Saisissez des coordonnées valides et une surface supérieure à zéro.'));
      return;
    }
    setLoading(true);
    setSelectedZone(null);
    setNotice('');
    window.setTimeout(() => {
      const boundary = fieldFromCenter(lat, lng, area, fieldName.trim() || tr(language, 'Field', 'حقل', 'Parcelle'));
      setResult(simulateNdvi(boundary, crop));
      setLoading(false);
    }, 600);
  };

  const saveToTwin = () => {
    if (!result) return;
    const matchingField = fields.find((field) => field.id === fieldId);
    const record = createSatelliteHealthRecord(fieldId || `satellite-${fieldName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'field'}`, fieldName.trim() || result.field.name, crop, matchingField?.areaHa ?? Number(areaHa), result);
    saveSatelliteHealthRecord(record);
    setNotice(tr(language, 'Latest satellite health snapshot saved to the Farm Digital Twin.', 'تم حفظ أحدث لقطة لصحة القمر الصناعي في التوأم الرقمي للمزرعة.', 'La dernière analyse satellite a été enregistrée dans le jumeau numérique.'));
  };

  const printReport = () => {
    if (typeof window !== 'undefined') window.print();
  };

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'} className="overflow-hidden border-indigo-100/80 dark:border-indigo-950/60">
      <CardHeader className="border-b border-indigo-100/70 bg-gradient-to-r from-indigo-50/80 via-card to-teal-50/50 pb-4 dark:border-indigo-950/70 dark:from-indigo-950/25 dark:to-teal-950/20">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div><div className="mb-2 flex flex-wrap items-center gap-2"><Badge className="bg-indigo-600 text-white"><Satellite className="me-1 h-3 w-3" />{tr(language, 'Satellite intelligence', 'ذكاء الأقمار الصناعية', 'Intelligence satellite')}</Badge><Badge variant="outline">{tr(language, 'Algeria-ready', 'جاهز للجزائر', 'Prêt pour l’Algérie')}</Badge></div><CardTitle className="text-xl">{tr(language, 'Satellite Crop Health Monitor', 'مراقب صحة المحصول بالقمر الصناعي', 'Suivi satellite de la santé des cultures')}</CardTitle><CardDescription className="mt-1 max-w-3xl leading-5">{tr(language, 'Scan a saved field, see where crop stress is concentrated, and turn the signal into a reviewed scouting or irrigation action.', 'افحص حقلاً محفوظاً، واعرف أين يتركز إجهاد المحصول، وحوّل الإشارة إلى كشف أو إجراء ري بعد المراجعة.', 'Analysez une parcelle, localisez le stress et transformez le signal en observation ou action d’irrigation vérifiée.')}</CardDescription></div>
          <div className="flex shrink-0 gap-2"><Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={refreshFields}><RefreshCw className="h-3.5 w-3.5" />{tr(language, 'Refresh fields', 'تحديث الحقول', 'Actualiser')}</Button>{result && <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={printReport}><Printer className="h-3.5 w-3.5" />{tr(language, 'Print', 'طباعة', 'Imprimer')}</Button>}</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="grid gap-3 rounded-2xl border border-border/70 bg-muted/15 p-4 lg:grid-cols-[1.1fr_1fr_1fr_1fr]">
          <label className="space-y-1.5"><span className="text-xs font-semibold">{tr(language, 'Saved field', 'الحقل المحفوظ', 'Parcelle enregistrée')}</span><select value={fieldId} onChange={(event) => setFieldId(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">{tr(language, 'Manual / new field', 'حقل يدوي / جديد', 'Parcelle manuelle / nouvelle')}</option>{fields.map((field) => <option key={field.id} value={field.id}>{field.name} · {field.areaHa} ha</option>)}</select></label>
          <label className="space-y-1.5"><span className="text-xs font-semibold">{tr(language, 'Field name', 'اسم الحقل', 'Nom de la parcelle')}</span><Input value={fieldName} onChange={(event) => setFieldName(event.target.value)} className="h-10" /></label>
          <label className="space-y-1.5"><span className="text-xs font-semibold">{tr(language, 'Crop', 'المحصول', 'Culture')}</span><select value={crop} onChange={(event) => setCrop(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{CROP_OPTIONS.map((option) => <option key={option} value={option}>{cropLabel(language, option)}</option>)}</select></label>
          <label className="space-y-1.5"><span className="text-xs font-semibold">{tr(language, 'Area (ha)', 'المساحة (هكتار)', 'Surface (ha)')}</span><Input type="number" min="0.1" step="0.1" value={areaHa} onChange={(event) => setAreaHa(event.target.value)} className="h-10" /></label>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
          <label className="space-y-1.5"><span className="text-xs font-semibold">{tr(language, 'Latitude', 'خط العرض', 'Latitude')}</span><Input value={latitude} onChange={(event) => setLatitude(event.target.value)} /></label>
          <label className="space-y-1.5"><span className="text-xs font-semibold">{tr(language, 'Longitude', 'خط الطول', 'Longitude')}</span><Input value={longitude} onChange={(event) => setLongitude(event.target.value)} /></label>
          <Button type="button" variant="outline" className="mt-auto gap-1.5" onClick={useGps}><MapPin className="h-4 w-4" />GPS</Button>
          <Button type="button" className="mt-auto gap-1.5 bg-indigo-600 hover:bg-indigo-700" onClick={analyze} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}{loading ? tr(language, 'Scanning…', 'جارٍ الفحص…', 'Analyse…') : tr(language, 'Analyze field', 'تحليل الحقل', 'Analyser')}</Button>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-xs text-sky-950 dark:border-sky-900 dark:bg-sky-950/20 dark:text-sky-100 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-2"><Satellite className="mt-0.5 h-4 w-4 shrink-0" /><span>{tr(language, 'Satellite output is decision support, not a diagnosis. Confirm the zone on the ground before spraying or changing irrigation.', 'مخرجات القمر الصناعي لدعم القرار وليست تشخيصاً. أكد المنطقة ميدانياً قبل الرش أو تغيير الري.', 'La sortie satellite aide à décider mais ne constitue pas un diagnostic. Confirmez sur le terrain avant de traiter ou modifier l’irrigation.')}</span></div><Button type="button" variant="link" className="h-auto justify-start p-0 text-sky-800 dark:text-sky-200" onClick={() => onOpenFarmTool?.('collapse_scouting')}><ExternalLink className="me-1 h-3 w-3" />{tr(language, 'Open scouting log', 'فتح سجل الكشف', 'Ouvrir le journal')}</Button></div>

        {weatherContext && <div className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${weatherContext.tone === 'rose' ? levelTone('critical') : weatherContext.tone === 'amber' ? levelTone('watch') : levelTone('excellent')}`}><Cloud className="mt-0.5 h-4 w-4 shrink-0" /><div className="flex-1"><div className="font-bold">{tr(language, 'Weather context', 'سياق الطقس', 'Contexte météo')}</div><p className="mt-0.5 opacity-80">{weatherContext.text}</p></div>{weather && <div className="flex shrink-0 flex-wrap gap-2 font-mono text-[10px]"><span><Droplets className="me-1 inline h-3 w-3" />{numberFormat(weather.daily.precipitationSum, language)} mm</span><span><Wind className="me-1 inline h-3 w-3" />{numberFormat(weather.daily.windSpeedMax, language)} km/h</span></div>}</div>}

        {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200">{notice}</div>}

        {result ? <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-4"><Metric label={tr(language, 'Average NDVI', 'متوسط NDVI', 'NDVI moyen')} value={numberFormat(result.averageNdvi, language, 2)} detail={`${result.date} · ${sourceText}`} tone={selectedHealth === 'excellent' ? 'green' : selectedHealth === 'watch' ? 'amber' : selectedHealth === 'stressed' || selectedHealth === 'critical' ? 'rose' : 'slate'} /><Metric label={tr(language, 'Stressed area', 'المساحة المجهدة', 'Surface stressée')} value={`${numberFormat(result.stressedAreaPct, language, 0)}%`} detail={`${numberFormat(Number(areaHa) * result.stressedAreaPct / 100, language, 2)} ha`} tone={result.stressedAreaPct >= 20 ? 'rose' : result.stressedAreaPct >= 10 ? 'amber' : 'green'} /><Metric label={tr(language, 'NDVI range', 'نطاق NDVI', 'Plage NDVI')} value={`${numberFormat(result.minNdvi, language, 2)}–${numberFormat(result.maxNdvi, language, 2)}`} detail={`${result.zones.length} ${tr(language, 'zones', 'مناطق', 'zones')}`} tone="slate" /><Metric label={tr(language, 'Cloud cover', 'الغطاء السحابي', 'Couverture nuageuse')} value={`${numberFormat(result.cloudCover, language, 0)}%`} detail={selectedHealth ? levelLabel(language, selectedHealth) : ''} tone="slate" /></div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.7fr)]"><div className="space-y-3"><div className="flex items-center justify-between gap-2"><div><h3 className="text-sm font-bold">{result.field.name} · {cropLabel(language, crop)}</h3><p className="text-[11px] text-muted-foreground">{tr(language, 'Click a zone to inspect its recommended next check.', 'اضغط على منطقة لفحص الإجراء التالي المقترح.', 'Cliquez sur une zone pour voir le prochain contrôle recommandé.')}</p></div><Badge className={selectedHealth ? levelTone(selectedHealth) : ''}>{selectedHealth ? levelLabel(language, selectedHealth) : ''}</Badge></div><div className="grid aspect-square max-w-[430px] gap-1 rounded-2xl border bg-border p-1" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}>{result.zones.map((zone) => <button key={zone.id} type="button" onClick={() => setSelectedZone(zone)} aria-label={`${zone.id} NDVI ${zone.ndvi}`} className="min-h-0 rounded-sm transition hover:scale-105 hover:ring-2 hover:ring-white" style={{ backgroundColor: ndviColor(zone.ndvi), outline: selectedZone?.id === zone.id ? '3px solid #111827' : undefined, outlineOffset: '-2px' }} />)}</div><div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">{[0.2, 0.35, 0.5, 0.65, 0.8].map((value) => <span key={value} className="flex items-center gap-1"><span className="h-3 w-3 rounded" style={{ background: ndviColor(value) }} />{numberFormat(value, language, 2)}</span>)}</div></div>
            <div className="space-y-3">{selectedZone ? <div className="rounded-xl border p-4" style={{ borderColor: `${ndviColor(selectedZone.ndvi)}80`, background: `${ndviColor(selectedZone.ndvi)}15` }}><div className="flex items-center gap-2"><span className="h-4 w-4 rounded" style={{ background: ndviColor(selectedZone.ndvi) }} /><span className="font-bold">{selectedZone.id} · NDVI {numberFormat(selectedZone.ndvi, language, 2)}</span></div><Badge variant="outline" className="mt-2">{healthLabel(selectedZone.health)}</Badge><p className="mt-2 text-xs leading-5 text-muted-foreground">{healthRecommendation(selectedZone.health)}</p><div className="mt-2 text-[10px] text-muted-foreground">{tr(language, 'Zone share', 'حصة المنطقة', 'Part de zone')}: {numberFormat(selectedZone.areaPct, language, 1)}%</div></div> : <div className="rounded-xl border border-dashed p-5 text-center text-xs text-muted-foreground"><ScanLine className="mx-auto mb-2 h-6 w-6 opacity-50" />{tr(language, 'Select a colored zone for the field-level explanation.', 'اختر منطقة ملونة لعرض شرح مستوى الحقل.', 'Sélectionnez une zone colorée pour voir l’explication.')}</div>}<div className="space-y-2"><div className="flex items-center gap-2 text-xs font-bold"><AlertTriangle className="h-4 w-4 text-amber-600" />{tr(language, 'Recommended review', 'المراجعة المقترحة', 'Revue recommandée')}</div>{result.recommendations.map((recommendation, index) => <div key={`${recommendation}-${index}`} className="rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 text-xs text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">{recommendation}</div>)}</div></div>
          </div>

          <div className="flex flex-col justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 sm:flex-row sm:items-center"><div className="flex items-start gap-2 text-xs text-muted-foreground"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /><span>{tr(language, 'Save only after reviewing the colored zones. The Digital Twin will then show the latest field health snapshot.', 'احفظ فقط بعد مراجعة المناطق الملونة. سيعرض التوأم الرقمي أحدث لقطة لصحة الحقل.', 'Enregistrez après avoir vérifié les zones. Le jumeau affichera la dernière analyse de santé.')}</span></div><div className="flex shrink-0 gap-2"><Button type="button" variant="outline" className="gap-1.5" onClick={() => onOpenFarmTool?.('collapse_ipm_action')}><AlertTriangle className="h-4 w-4" />{tr(language, 'Open IPM review', 'فتح مراجعة IPM', 'Ouvrir la revue IPM')}</Button><Button type="button" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={saveToTwin}><Save className="h-4 w-4" />{tr(language, 'Save to Digital Twin', 'حفظ في التوأم الرقمي', 'Enregistrer dans le jumeau')}</Button></div></div>
        </div> : <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-8 text-center dark:border-indigo-900 dark:bg-indigo-950/20"><Satellite className="mx-auto mb-3 h-10 w-10 text-indigo-500/70" /><h3 className="text-base font-bold">{tr(language, 'Ready for a field scan', 'جاهز لفحص الحقل', 'Prêt pour une analyse')}</h3><p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">{tr(language, 'Choose a saved field or enter an Algerian location. The first version uses a transparent simulated Sentinel-2 signal; the data contract is ready for a real imagery provider.', 'اختر حقلاً محفوظاً أو أدخل موقعاً جزائرياً. الإصدار الأول يستخدم إشارة Sentinel-2 محاكاة وشفافة؛ وعقد البيانات جاهز لمزود صور حقيقي.', 'Choisissez une parcelle ou saisissez une localisation algérienne. La première version utilise un signal Sentinel-2 simulé et transparent ; le contrat est prêt pour un fournisseur réel.')}</p></div>}
      </CardContent>
    </Card>
  );
}
