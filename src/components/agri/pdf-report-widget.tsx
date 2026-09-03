'use client';

/**
 * PdfReportWidget (Feature #10)
 * =============================
 *
 * A wrapper around `generateFarmReport()` that assembles the ReportData from
 * the user's localStorage stores (farm profile, soil tests, FarmPilot plan,
 * field records) and triggers a printable farm report in a new window.
 *
 * - Uses CalculatorShell with `accent="violet"`, `icon={FileText}`,
 *   `badge="Printable"`.
 * - The "Generate PDF Report" action button lives in the hero header.
 * - SSR-safe: all localStorage reads are guarded behind `useEffect` and
 *   the click handler.
 * - Trilingual: all UI strings are localized EN/FR/AR via `copyFor`.
 */

import { useState, useEffect, useCallback } from 'react';
import { FileText, Printer, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CalculatorShell, type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';
import { useTranslation, copyFor } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  generateFarmReport,
  type ReportData,
  type ReportFarmProfile,
  type ReportSoilData,
  type ReportIrrigation,
  type ReportFertilizer,
  type ReportWeatherDay,
  type ReportFieldRecord,
  type ReportEconomics,
} from '@/lib/pdf-report-generator';
import { getSoilTests, getLatestTest } from '@/lib/soil-history-store';
import {
  calculateFertilityScore, soilTestToFertilityInput, bandLabel,
} from '@/lib/soil-fertility-score';
import { buildFieldRecordTimeline, type FieldRecord } from '@/lib/field-record-book';
import {
  FARMPILOT_PLAN_KEY, FARMPILOT_CROPS, CROP_STAGE_LABELS,
  type FarmPilotPlan,
} from '@/lib/farmpilot-data';
import {
  calculateIrrigation, calculateFertilizer, calculateEconomics,
  getActiveStage, getCropById, formatDzd,
} from '@/lib/farmpilot-engine';
import { ALL_58_WILAYAS } from '@/lib/algeria-wilayas-58';
import { getForecast } from '@/lib/open-meteo';

// ---------------------------------------------------------------------------
// Localized strings
// ---------------------------------------------------------------------------

const TITLE: TrilingualString = {
  en: 'Farm PDF Report',
  ar: 'تقرير المزرعة PDF',
  fr: 'Rapport de Ferme PDF',
};

const DESC: TrilingualString = {
  en: 'Generate a printable, trilingual farm report combining your soil tests, today\'s irrigation & fertilizer plan, weather, field records and economics — opens in a new window ready to save as PDF.',
  ar: 'أنشئ تقرير مزرعة ثلاثي اللغات قابل للطباعة يجمع تحاليل التربة وخطة الري والتسميد اليومية والطقس وسجلات الحقل والاقتصاد — يفتح في نافذة جديدة جاهزة للحفظ كـ PDF.',
  fr: 'Générez un rapport de ferme trilingue imprimable combinant vos analyses de sol, le plan d\'irrigation et de fertilisation du jour, la météo, les registres de parcelle et l\'économie — s\'ouvre dans une nouvelle fenêtre prête à enregistrer en PDF.',
};

// ---------------------------------------------------------------------------
// Data-source status (what was found in localStorage)
// ---------------------------------------------------------------------------

interface SourceStatus {
  key: string;
  labelEn: string;
  labelAr: string;
  labelFr: string;
  found: boolean;
  detail?: string;
}

// ---------------------------------------------------------------------------
// Helper: assemble ReportData from localStorage
// ---------------------------------------------------------------------------

function readFarmProfile(): ReportFarmProfile & { lat?: number; lng?: number } {
  const empty: ReportFarmProfile = { name: '', location: '' };
  if (typeof window === 'undefined') return empty;
  try {
    const raw = window.localStorage.getItem('farm_profile_v1');
    if (!raw) return empty;
    const p = JSON.parse(raw);
    const lat = p.lat != null ? parseFloat(p.lat) : undefined;
    const lng = p.lng != null ? parseFloat(p.lng) : undefined;
    const wilayaName = resolveWilayaName(lat, lng);
    return {
      name: p.name || '',
      location: wilayaName || (lat != null && lng != null ? `${lat.toFixed(3)}, ${lng.toFixed(3)}` : ''),
      lat,
      lng,
      areaHa: p.area != null ? parseFloat(p.area) : undefined,
      crop: p.crop,
      cropLabel: p.crop,
      plantingDate: p.plantingDate,
    };
  } catch {
    return empty;
  }
}

function resolveWilayaName(lat?: number, lng?: number): string {
  if (lat == null || lng == null) return '';
  // Find the closest wilaya centroid
  let best: { name: string; dist: number } | null = null;
  for (const w of ALL_58_WILAYAS) {
    const d = Math.hypot(w.lat - lat, w.lng - lng);
    if (!best || d < best.dist) best = { name: w.nameEn, dist: d };
  }
  return best ? best.name : '';
}

function readPlan(): FarmPilotPlan | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(FARMPILOT_PLAN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FarmPilotPlan;
  } catch {
    return null;
  }
}

function buildSoilReport(language: 'en' | 'fr' | 'ar'): { soil: ReportSoilData; status: SourceStatus } {
  const tests = getSoilTests();
  const latest = getLatestTest(tests);
  if (!latest) {
    return {
      soil: {},
      status: {
        key: 'soil', labelEn: 'Soil test', labelAr: 'تحليل التربة', labelFr: 'Analyse de sol',
        found: false,
      },
    };
  }
  let fertilityScore: number | undefined;
  let fertilityBand: string | undefined;
  try {
    const fertilityInput = soilTestToFertilityInput(latest);
    const result = calculateFertilityScore(fertilityInput);
    fertilityScore = result.totalScore;
    fertilityBand = bandLabel(result.band, language);
  } catch {
    /* keep undefined */
  }
  return {
    soil: {
      ph: latest.ph,
      om: latest.om,
      pPpm: latest.p,
      kPpm: latest.k,
      cec: latest.cec,
      ec: latest.ec_ds_m,
      fertilityScore,
      fertilityBand,
      testDate: latest.date,
      fieldName: latest.fieldName,
    },
    status: {
      key: 'soil', labelEn: 'Soil test', labelAr: 'تحليل التربة', labelFr: 'Analyse de sol',
      found: true,
      detail: `${latest.fieldName} · ${latest.date}`,
    },
  };
}

function buildIrrigationReport(plan: FarmPilotPlan | null, etoMmPerDay = 5.0): ReportIrrigation | undefined {
  if (!plan) return undefined;
  const crop = getCropById(plan.cropId);
  if (!crop) return undefined;
  const activeStage = getActiveStage(crop, plan.plantingDate);
  if (!activeStage || activeStage.stage === 'planting' || activeStage.stage === 'harvest') {
    return undefined;
  }
  try {
    const ir = calculateIrrigation(crop, activeStage.stage, plan, etoMmPerDay);
    return {
      etcMmPerDay: ir.etcMmPerDay,
      totalM3PerDay: ir.totalM3PerDay,
      durationMinutes: ir.irrigationDurationMinutes,
      etoMmPerDay: ir.etoMmPerDay,
      kc: ir.kc,
      effectiveRainfallMm: ir.effectiveRainfallMm,
      efficiency: ir.irrigationEfficiency,
    };
  } catch {
    return undefined;
  }
}

function buildFertilizerReport(plan: FarmPilotPlan | null): ReportFertilizer | undefined {
  if (!plan) return undefined;
  const crop = getCropById(plan.cropId);
  if (!crop || !plan.fertilizerProduct) return undefined;
  try {
    const fr = calculateFertilizer(crop, plan, plan.fertilizerProduct, 1.0);
    return {
      product: plan.fertilizerProduct,
      npk: plan.fertilizerProduct,
      requiredProductKgPerHa: fr.requiredProductKgPerHa,
      totalProductKg: fr.totalProductKg,
      requiredN: fr.requiredNutrient.n,
      requiredP: fr.requiredNutrient.p,
      requiredK: fr.requiredNutrient.k,
    };
  } catch {
    return undefined;
  }
}

function buildEconomicsReport(plan: FarmPilotPlan | null): ReportEconomics | undefined {
  if (!plan) return undefined;
  const crop = getCropById(plan.cropId);
  if (!crop) return undefined;
  const yieldTonsHa = plan.targetYieldTonsHa ?? crop.referenceYieldTonsHa;
  try {
    const ec = calculateEconomics(crop, plan.areaHa, yieldTonsHa, crop.typicalPriceDzdPerKg);
    return {
      totalRevenueDzd: ec.totalRevenueDzd,
      totalCostDzd: ec.totalCostDzd,
      grossMarginDzd: ec.grossMarginDzd,
      roiPct: ec.roiPct,
      expectedYieldTonsHa: ec.expectedYieldTonsHa,
      priceDzdPerKg: ec.priceDzdPerKg,
      breakEvenPriceDzdPerKg: ec.breakEvenPriceDzdPerKg,
    };
  } catch {
    return undefined;
  }
}

function buildRecordsReport(language: 'en' | 'fr' | 'ar'): { records: ReportFieldRecord[]; status: SourceStatus } {
  try {
    const timeline = buildFieldRecordTimeline().slice(0, 10);
    const records: ReportFieldRecord[] = timeline.map(r => ({
      date: new Date(r.timestamp).toISOString().slice(0, 10),
      kind: kindLabel(r.kind, language),
      title: r.title,
      summary: r.summary,
      source: sourceLabel(r.source, language),
    }));
    return {
      records,
      status: {
        key: 'records', labelEn: 'Field records', labelAr: 'سجلات الحقل', labelFr: 'Registres parcelle',
        found: records.length > 0,
        detail: records.length > 0 ? `${records.length} entries` : undefined,
      },
    };
  } catch {
    return {
      records: [],
      status: {
        key: 'records', labelEn: 'Field records', labelAr: 'سجلات الحقل', labelFr: 'Registres parcelle',
        found: false,
      },
    };
  }
}

function kindLabel(kind: FieldRecord['kind'], language: 'en' | 'fr' | 'ar'): string {
  const map: Record<FieldRecord['kind'], { en: string; fr: string; ar: string }> = {
    observation: { en: 'Observation', fr: 'Observation', ar: 'ملاحظة' },
    decision: { en: 'Decision', fr: 'Décision', ar: 'قرار' },
    input: { en: 'Input / cost', fr: 'Intrant / coût', ar: 'مدخل / تكلفة' },
    irrigation: { en: 'Irrigation', fr: 'Irrigation', ar: 'ري' },
    harvest: { en: 'Harvest', fr: 'Récolte', ar: 'حصاد' },
    note: { en: 'Note', fr: 'Note', ar: 'مذكرة' },
  };
  return map[kind]?.[language] || kind;
}

function sourceLabel(source: FieldRecord['source'], language: 'en' | 'fr' | 'ar'): string {
  const map: Record<FieldRecord['source'], { en: string; fr: string; ar: string }> = {
    manual: { en: 'Manual', fr: 'Manuel', ar: 'يدوي' },
    demo: { en: 'Demo', fr: 'Démo', ar: 'عرض' },
    'field-profile': { en: 'Field profile', fr: 'Profil parcelle', ar: 'ملف الحقل' },
    scouting: { en: 'Scouting', fr: 'Prospection', ar: 'كشف' },
    'soil-test': { en: 'Soil test', fr: 'Analyse sol', ar: 'تحليل تربة' },
    satellite: { en: 'Satellite', fr: 'Satellite', ar: 'قمر صناعي' },
  };
  return map[source]?.[language] || source;
}

async function buildWeatherReport(lat?: number, lng?: number): Promise<{ weather: ReportWeatherDay[]; status: SourceStatus }> {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return {
      weather: [],
      status: {
        key: 'weather', labelEn: 'Weather forecast', labelAr: 'توقعات الطقس', labelFr: 'Prévisions météo',
        found: false,
      },
    };
  }
  try {
    const forecast = await getForecast(lat, lng, { days: 4 });
    const weather: ReportWeatherDay[] = forecast.daily.slice(0, 4).map(d => ({
      date: d.date,
      tempMax: d.tempMax,
      tempMin: d.tempMin,
      precipitationSum: d.precipitationSum,
      weatherCode: d.weatherCode,
      et0: d.et0,
    }));
    return {
      weather,
      status: {
        key: 'weather', labelEn: 'Weather forecast', labelAr: 'توقعات الطقس', labelFr: 'Prévisions météo',
        found: weather.length > 0,
        detail: weather.length > 0 ? `${weather.length}-day forecast` : undefined,
      },
    };
  } catch {
    return {
      weather: [],
      status: {
        key: 'weather', labelEn: 'Weather forecast', labelAr: 'توقعات الطقس', labelFr: 'Prévisions météo',
        found: false,
      },
    };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PdfReportWidget() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  const [statuses, setStatuses] = useState<SourceStatus[]>([]);
  const [generating, setGenerating] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const refreshStatuses = useCallback(() => {
    const farmProfile = readFarmProfile();
    const plan = readPlan();
    const { status: soilStatus } = buildSoilReport(language);
    const { status: recordsStatus } = buildRecordsReport(language);

    const farmStatus: SourceStatus = {
      key: 'farm',
      labelEn: 'Farm profile', labelAr: 'ملف المزرعة', labelFr: 'Profil ferme',
      found: Boolean(farmProfile.name || farmProfile.location),
      detail: farmProfile.name || farmProfile.location || undefined,
    };
    const planStatus: SourceStatus = {
      key: 'plan',
      labelEn: 'FarmPilot plan', labelAr: 'خطة FarmPilot', labelFr: 'Plan FarmPilot',
      found: plan != null,
      detail: plan ? `${plan.cropId} · ${plan.areaHa} ha` : undefined,
    };

    setStatuses([farmStatus, soilStatus, planStatus, recordsStatus]);
  }, [language]);

  useEffect(() => {
    setHydrated(true);
    refreshStatuses();
  }, [refreshStatuses]);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      const farmProfile = readFarmProfile();
      const plan = readPlan();
      const { soil } = buildSoilReport(language);
      const { records } = buildRecordsReport(language);
      const { weather } = await buildWeatherReport(farmProfile.lat, farmProfile.lng);

      // Enrich farm profile with plan + crop + stage info
      const crop = plan ? getCropById(plan.cropId) : undefined;
      const activeStage = crop && plan ? getActiveStage(crop, plan.plantingDate) : undefined;
      const stageLabel = activeStage ? CROP_STAGE_LABELS[activeStage.stage].label[language] : undefined;
      const cropLabel = crop ? crop.name[language] : farmProfile.cropLabel;

      const enrichedFarm: ReportFarmProfile = {
        ...farmProfile,
        crop: plan?.cropId || farmProfile.crop,
        cropLabel,
        stage: stageLabel,
        plantingDate: plan?.plantingDate || farmProfile.plantingDate,
        areaHa: plan?.areaHa ?? farmProfile.areaHa,
        productionSystem: plan?.productionSystem,
        irrigationSystem: plan?.irrigationSystem,
      };

      // Use today's ET₀ from the weather forecast if available, else default 5 mm/day
      const todayEto = weather[0]?.et0 ?? 5.0;

      const data: ReportData = {
        farm: enrichedFarm,
        soil,
        irrigation: buildIrrigationReport(plan, todayEto),
        fertilizer: buildFertilizerReport(plan),
        weather,
        records,
        economics: buildEconomicsReport(plan),
      };

      generateFarmReport(language, data);
      toast({
        title: tr('Report opened in new window', 'فُتح التقرير في نافذة جديدة', 'Rapport ouvert dans une nouvelle fenêtre'),
        description: tr('Use your browser\'s print dialog to save as PDF.', 'استخدم نافذة الطباعة في المتصفح للحفظ كـ PDF.', 'Utilisez la boîte d\'impression pour enregistrer en PDF.'),
      });
    } catch (err) {
      toast({
        title: tr('Could not generate report', 'تعذّر إنشاء التقرير', 'Impossible de générer le rapport'),
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
      refreshStatuses();
    }
  }, [language, refreshStatuses, tr]);

  // Section preview list
  const sections: { n: number; en: string; ar: string; fr: string }[] = [
    { n: 1, en: 'Farm header', ar: 'ترويسة المزرعة', fr: 'En-tête ferme' },
    { n: 2, en: 'Soil summary + fertility gauge', ar: 'ملخص التربة + مؤشر الخصوبة', fr: 'Sol + jauge fertilité' },
    { n: 3, en: "Today's irrigation", ar: 'ري اليوم', fr: 'Irrigation du jour' },
    { n: 4, en: "Today's fertilizer", ar: 'تسميد اليوم', fr: 'Fertilisation du jour' },
    { n: 5, en: '4-day weather forecast', ar: 'توقعات الطقس 4 أيام', fr: 'Météo 4 jours' },
    { n: 6, en: 'Field records timeline', ar: 'سجل الحقل', fr: 'Registres parcelle' },
    { n: 7, en: 'Economics summary', ar: 'ملخص الاقتصاد', fr: 'Synthèse économique' },
  ];

  return (
    <CalculatorShell
      icon={FileText}
      title={TITLE}
      description={DESC}
      badge="Printable"
      accent="violet"
      actions={[
        {
          icon: generating ? Loader2 : Printer,
          label: {
            en: generating ? 'Generating...' : 'Generate PDF Report',
            ar: generating ? 'يُنشئ...' : 'إنشاء تقرير PDF',
            fr: generating ? 'Génération...' : 'Générer le rapport PDF',
          },
          onClick: handleGenerate,
          variant: 'primary',
        },
        {
          icon: RefreshCw,
          label: { en: 'Refresh data', ar: 'تحديث البيانات', fr: 'Rafraîchir' },
          onClick: refreshStatuses,
        },
      ]}
      protocolNote={{
        en: 'No external PDF library — uses your browser\'s native print-to-PDF. The report opens in a new window; pop-up blockers may need to be disabled. All data stays in your browser.',
        ar: 'بدون مكتبة PDF خارجية — يستخدم ميزة الطباعة إلى PDF المدمجة في المتصفح. يفتح التقرير في نافذة جديدة؛ قد تحتاج إلى تعطيل مانع النوافذ المنبثقة. كل البيانات تبقى في متصفحك.',
        fr: 'Aucune librairie PDF externe — utilise l\'impression native du navigateur. Le rapport s\'ouvre dans une nouvelle fenêtre ; désactivez le bloqueur de pop-ups si besoin. Toutes les données restent dans votre navigateur.',
      }}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-violet-600" />
              {tr('Data sources', 'مصادر البيانات', 'Sources de données')}
            </span>
            <Badge variant="outline" className="text-[10px]">
              {hydrated ? `${statuses.filter(s => s.found).length}/${statuses.length}` : '—'}
            </Badge>
          </div>

          <div className="space-y-2">
            {statuses.length === 0 && (
              <div className="text-xs text-muted-foreground italic py-2">
                {tr('Loading data sources...', 'يحمّل مصادر البيانات...', 'Chargement des sources...')}
              </div>
            )}
            {statuses.map((s) => (
              <div
                key={s.key}
                className={`flex items-start gap-2 p-2.5 rounded-lg border ${
                  s.found
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
                    : 'bg-muted/30 border-dashed'
                }`}
              >
                {s.found ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold">{tr(s.labelEn, s.labelAr, s.labelFr)}</div>
                  {s.detail && (
                    <div className="text-[10px] text-muted-foreground truncate">{s.detail}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-muted-foreground bg-muted/30 p-2.5 rounded-lg border">
            {tr(
              'Tip: configure your Farm Profile and FarmPilot plan first to populate the report fully. Soil tests and field records are auto-included when present.',
              'نصيحة: اضبط ملف المزرعة وخطة FarmPilot أولاً لتعبئة التقرير بالكامل. تُدرج تحاليل التربة وسجلات الحقل تلقائياً عند توفرها.',
              'Astuce : configurez d\'abord le Profil Ferme et le plan FarmPilot pour remplir le rapport. Les analyses de sol et registres sont inclus automatiquement.',
            )}
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              ✨ {tr('Report sections', 'أقسام التقرير', 'Sections du rapport')}
            </span>
            <Badge variant="outline" className="text-[10px]">{sections.length} {tr('sections', 'أقسام', 'sections')}</Badge>
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {sections.map(s => (
              <div key={s.n} className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xs font-bold shrink-0">
                  {s.n}
                </div>
                <div className="text-xs font-medium">{tr(s.en, s.ar, s.fr)}</div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t space-y-2">
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full gap-2 h-11 bg-violet-600 hover:bg-violet-700 text-white"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
              {generating
                ? tr('Generating report...', 'يُنشئ التقرير...', 'Génération du rapport...')
                : tr('Generate PDF Report', 'إنشاء تقرير PDF', 'Générer le rapport PDF')}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              {tr(
                'Opens in a new window · uses your browser\'s print-to-PDF',
                'يفتح في نافذة جديدة · يستخدم طباعة المتصفح إلى PDF',
                'S\'ouvre dans une nouvelle fenêtre · impression native navigateur',
              )}
            </p>
          </div>
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}

// Re-export for convenience (used by parent pages that want to display the
// economics summary inline — e.g., a Farm Dashboard tile).
export { formatDzd };
export type { ReportData };
