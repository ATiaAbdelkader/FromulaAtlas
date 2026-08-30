'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Satellite, MapPin, Loader2, Download, AlertTriangle,
  Grid3x3, Eye, Copy, RotateCcw,
} from 'lucide-react';
import {
  simulateNdvi, ndviColor, healthLabel, healthRecommendation,
  fieldFromCenter, type NdviResult, type NdviZone,
} from '@/lib/satellite-service';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell, type TrilingualString, type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';

const GRID_SIZE = 8;
const CROPS = ['Maize', 'Tomato', 'Wheat', 'Rice', 'Potato', 'Soybean', 'Cotton', 'Strawberry', 'Avocado'];

const TITLE: TrilingualString = {
  en: 'NDVI Field Maps',
  ar: 'خرائط NDVI للحقول',
  fr: 'Cartes NDVI des Parcelles',
};

const DESC: TrilingualString = {
  en: 'Satellite vegetation index — identify stressed zones in your fields using a Sentinel-2 simulated NDVI grid (8×8 zones).',
  ar: 'مؤشر الغطاء النباتي بالأقمار الصناعية — حدّد المناطق المتضررة في حقلك باستخدام شبكة NDVI محاكاة من Sentinel-2 (8×8 منطقة).',
  fr: 'Indice de végétation satellite — identifiez les zones stressées de vos parcelles via une grille NDVI Sentinel-2 simulée (8×8).',
};

const PILL_LABEL: TrilingualString = { en: 'Select crop:', ar: 'اختر المحصول:', fr: 'Culture :' };

const CROP_EMOJI: Record<string, string> = {
  Maize: '🌽', Tomato: '🍅', Wheat: '🌾', Rice: '🍚', Potato: '🥔',
  Soybean: '🫘', Cotton: '☁️', Strawberry: '🍓', Avocado: '🥑',
};

export function NdviFieldMaps() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [fieldName, setFieldName] = useState('Field A');
  const [lat, setLat] = useState('19.4326');
  const [lng, setLng] = useState('-99.1332');
  const [areaHa, setAreaHa] = useState('10');
  const [crop, setCrop] = useState('Maize');
  const [result, setResult] = useState<NdviResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedZone, setSelectedZone] = useState<NdviZone | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [copied, setCopied] = useState(false);

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

  const handleReset = () => {
    setFieldName('Field A');
    setLat('19.4326');
    setLng('-99.1332');
    setAreaHa('10');
    setCrop('Maize');
    setResult(null);
    setSelectedZone(null);
    toast({ title: tr('Reset done', 'تمت إعادة التعيين', 'Réinitialisé') });
  };

  const handleCopy = () => {
    if (!result) {
      toast({ title: tr('Run analysis first', 'شغّل التحليل أولاً', 'Lancez l\'analyse d\'abord') });
      return;
    }
    const text = `=== NDVI FIELD REPORT ===\nField: ${result.field.name}\nDate: ${result.date}\nSatellite: ${result.satellite}\nCloud cover: ${result.cloudCover}%\nArea: ${result.field.areaHa} ha\nCrop: ${crop}\n\nAvg NDVI: ${result.averageNdvi}\nMin NDVI: ${result.minNdvi}\nMax NDVI: ${result.maxNdvi}\nStressed area: ${result.stressedAreaPct}%\n\nRecommendations:\n${result.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}`.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: tr('Summary copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  const pills: CalculatorPill[] = CROPS.map(c => ({
    key: c,
    emoji: CROP_EMOJI[c] ?? '🌱',
    label: c,
  }));

  return (
    <CalculatorShell
      icon={Satellite}
      title={TITLE}
      description={DESC}
      badge="Sentinel-2 (sim)"
      accent="violet"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ الملخّص', fr: 'Copier' },
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
      pills={pills}
      activePill={crop}
      onPillClick={setCrop}
      pillLabel={PILL_LABEL}
      protocolNote={{
        en: 'Uses Sentinel-2 satellite data (simulated for demo — connect Sentinel Hub API key for real imagery). Click any zone on the map to see detailed analysis and AI recommendations.',
        ar: 'يستخدم بيانات قمر Sentinel-2 (محاكاة للعرض — اربط مفتاح Sentinel Hub API للحصول على صور حقيقية). اضغط أي منطقة على الخريطة لرؤية التحليل المفصّل والتوصيات بالذكاء الاصطناعي.',
        fr: 'Utilise les données Sentinel-2 (simulées pour la démo — connectez une clé API Sentinel Hub pour des images réelles). Cliquez sur une zone de la carte pour l\'analyse détaillée et les recommandations IA.',
      }}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <Satellite className="h-4 w-4 text-violet-600" />
              {tr('Field Location', 'موقع الحقل', 'Localisation parcelle')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CalculatorShell.InputField
              label={tr('Field name', 'اسم الحقل', 'Nom parcelle')}
              value={fieldName}
              onChange={setFieldName}
              type="text"
              helper={tr('Label for the report', 'تسمية للتقرير', 'Libellé du rapport')}
            />
            <CalculatorShell.InputField
              label={tr('Area (ha)', 'المساحة (هـ)', 'Surface (ha)')}
              value={areaHa}
              onChange={setAreaHa}
              placeholder="10"
              helper={tr('Field area in hectares', 'مساحة الحقل بالهكتار', 'Surface en hectares')}
            />
            <CalculatorShell.InputField
              label={tr('Latitude', 'خط العرض', 'Latitude')}
              value={lat}
              onChange={setLat}
              type="text"
              helper={tr('Decimal degrees', 'درجات عشرية', 'Degrés décimaux')}
            />
            <CalculatorShell.InputField
              label={tr('Longitude', 'خط الطول', 'Longitude')}
              value={lng}
              onChange={setLng}
              type="text"
              helper={tr('Decimal degrees', 'درجات عشرية', 'Degrés décimaux')}
            />
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={useGps} className="gap-1.5 text-xs h-9 flex-1">
              <MapPin className="h-3.5 w-3.5" /> {tr('Use GPS', 'استخدم GPS', 'Utiliser GPS')}
            </Button>
            <Button size="sm" onClick={analyze} disabled={loading} className="gap-1.5 text-xs h-9 flex-[2]">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Satellite className="h-3.5 w-3.5" />}
              {loading ? tr('Analyzing...', 'يحلّل...', 'Analyse...') : tr('Analyze Field', 'تحليل الحقل', 'Analyser')}
            </Button>
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              ✨ {tr('NDVI Analysis', 'تحليل NDVI', 'Analyse NDVI')}
            </span>
            {result && (
              <Button onClick={exportPdf} size="sm" variant="outline" className="gap-1.5 text-xs h-8">
                <Download className="h-3.5 w-3.5" /> {tr('PDF', 'PDF', 'PDF')}
              </Button>
            )}
          </div>

          {result ? (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <SummaryCard label={tr('Avg NDVI', 'متوسط NDVI', 'NDVI moy.')} value={String(result.averageNdvi)} color={ndviColor(result.averageNdvi)} />
                <SummaryCard label={tr('Min', 'الأدنى', 'Min')} value={String(result.minNdvi)} color={ndviColor(result.minNdvi)} />
                <SummaryCard label={tr('Max', 'الأعلى', 'Max')} value={String(result.maxNdvi)} color={ndviColor(result.maxNdvi)} />
                <SummaryCard label={tr('Stressed', 'متضرر', 'Stressé')} value={`${result.stressedAreaPct}%`} color={result.stressedAreaPct > 20 ? '#dc2626' : '#16a34a'} />
              </div>

              {/* Map + Legend */}
              <div className="flex gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{result.field.name} — {result.date}</div>
                    <button onClick={() => setShowGrid(!showGrid)} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                      {showGrid ? <Eye className="h-3 w-3" /> : <Grid3x3 className="h-3 w-3" />}
                      {showGrid ? tr('Hide grid', 'إخفاء الشبكة', 'Cacher grille') : tr('Show grid', 'إظهار الشبكة', 'Afficher grille')}
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
                      { c: ndviColor(0.05), l: tr('Bare', 'عارية', 'Nu') },
                      { c: ndviColor(0.2), l: tr('Critical', 'حرج', 'Critique') },
                      { c: ndviColor(0.35), l: tr('Poor', 'ضعيف', 'Faible') },
                      { c: ndviColor(0.5), l: tr('Moderate', 'متوسط', 'Moyen') },
                      { c: ndviColor(0.65), l: tr('Good', 'جيد', 'Bon') },
                      { c: ndviColor(0.8), l: tr('Excellent', 'ممتاز', 'Excellent') },
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
                      <div className="text-[10px] text-muted-foreground mt-1">{tr('Zone area:', 'مساحة المنطقة:', 'Zone :')} {selectedZone.areaPct}%</div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground p-3 rounded-lg border border-dashed text-center">
                      {tr('Click any zone on the map to see detailed analysis', 'اضغط أي منطقة على الخريطة لرؤية التحليل المفصّل', 'Cliquez sur une zone de la carte pour l\'analyse détaillée')}
                    </div>
                  )}

                  {/* Recommendations */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> {tr('AI Recommendations', 'توصيات بالذكاء', 'Recommandations IA')}
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1.5">
                      {result.recommendations.map((r, i) => (
                        <div key={i} className="text-xs rounded-lg p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                          {r}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Satellite info */}
              <div className="text-[10px] text-muted-foreground flex items-center gap-2 pt-2 border-t border-border">
                <Satellite className="h-3 w-3" />
                {tr('Source', 'المصدر', 'Source')}: {result.satellite} · {tr('Cloud', 'الغيوم', 'Nuages')}: {result.cloudCover}% · {tr('Grid', 'الشبكة', 'Grille')}: {GRID_SIZE}×{GRID_SIZE} = {GRID_SIZE * GRID_SIZE} {tr('zones', 'مناطق', 'zones')}
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <Satellite className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
              <div className="text-sm text-muted-foreground">
                {tr(
                  'Enter your field location and click "Analyze Field" to generate an NDVI vegetation health map.',
                  'أدخل موقع حقلك واضغط «تحليل الحقل» لإنشاء خريطة صحة الغطاء النباتي NDVI.',
                  'Saisissez la localisation de votre parcelle et cliquez sur « Analyser » pour générer une carte NDVI.',
                )}
              </div>
            </div>
          )}
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
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
