'use client';

/**
 * FarmPilotDecisionCard — bridges FarmPilot's decision engine into My Field.
 *
 * Shows three FarmPilot-powered cards at the top of My Field:
 *   1. Today's Decision (irrigation + fertilizer with WHY? + provenance + confidence)
 *   2. Crop Recommendation preview (top 3 crops if no crop set, or current crop score)
 *   3. Atlas Estimates status (how many values are measured vs estimated)
 *
 * This is the Option B integration: FarmPilot's engine lives inside My Field,
 * so the farmer gets decision intelligence + operational tools in one place.
 *
 * Reuses:
 *  - FarmPilot engine functions (calculateIrrigation, calculateFertilizer,
 *    recommendCrops, scoreCrop, getActiveStage)
 *  - FarmPilot data (FARMPILOT_CROPS, PROVENANCE_BADGES, CONFIDENCE_BADGES)
 *  - My Field's existing forecast (ForecastResult) + farm profile
 *  - My Field's sunMode for high-contrast outdoor display
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Droplets, FlaskConical, Sparkles, HelpCircle, Database,
  CheckCircle2, AlertTriangle, ChevronRight, Compass, Info,
} from 'lucide-react';
import { useTranslation, copyFor } from '@/lib/language-store';
import type { ForecastResult } from '@/lib/open-meteo';
import { cn } from '@/lib/utils';

import {
  CONFIDENCE_BADGES,
  CROP_STAGE_LABELS,
  type ProductionSystem, type Confidence,
} from '@/lib/farmpilot-data';

import {
  recommendCrops, scoreCrop, calculateIrrigation, calculateFertilizer,
  getActiveStage, getCropById,
  type FarmContext,
} from '@/lib/farmpilot-engine';

// ---------------------------------------------------------------------------
// Crop ID mapper — CROP_LIFECYCLES uses different IDs than FARMPILOT_CROPS
// ---------------------------------------------------------------------------

const LIFECYCLE_TO_FARMPILOT: Record<string, string> = {
  potato: 'potato',
  tomato: 'tomato',
  onion: 'onion',
  carrot: 'carrot',
  wheat: 'wheat_durum',
  barley: 'barley',
  maize: 'maize',
  lettuce: 'lettuce',
  'bell-pepper': 'bell_pepper',
  cucumber: 'cucumber',
  alfalfa: 'alfalfa',
  // Crops in CROP_LIFECYCLES but not in FARMPILOT_CROPS (no engine data):
  // rice, soybean, cotton, coffee, apple, sunflower, citrus, sorghum, canola, grapes
};

export function mapLifecycleIdToFarmPilotId(lifecycleId: string | undefined): string | undefined {
  if (!lifecycleId) return undefined;
  return LIFECYCLE_TO_FARMPILOT[lifecycleId];
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FarmPilotDecisionCardProps {
  /** Crop ID from the farm profile (CROP_LIFECYCLES format, e.g. 'potato', 'wheat'). */
  cropId?: string;
  /** Planting date ISO string. */
  plantingDate?: string;
  /** Farm area in hectares. */
  areaHa: number;
  /** Live weather forecast from Open-Meteo (already fetched by FarmerField). */
  forecast: ForecastResult | null;
  /** Whether forecast is live (true) or fell back to Atlas default (false). */
  isLiveForecast: boolean;
  /** Sun mode for high-contrast outdoor display. */
  sunMode: boolean;
  /** Callback to navigate to the FarmPilot wizard tab. */
  onOpenFarmPilotWizard: () => void;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function FarmPilotDecisionCard({
  cropId, plantingDate, areaHa, forecast, isLiveForecast, sunMode, onOpenFarmPilotWizard,
}: FarmPilotDecisionCardProps) {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  // Map lifecycle crop ID → FarmPilot crop ID
  const farmPilotCropId = mapLifecycleIdToFarmPilotId(cropId);
  const crop = farmPilotCropId ? getCropById(farmPilotCropId) : undefined;

  // Build a minimal FarmContext for the engine (using Atlas estimates for soil/water
  // since FarmerField doesn't have a soil/water editor — that lives in FarmPilot's
  // Soil/Water views).
  const context: FarmContext = useMemo(() => ({
    areaHa,
    productionSystem: 'open_field' as ProductionSystem,
    soil: { provenance: { texture: 'unknown', ph: 'unknown', ecDsm: 'unknown', organicMatterPct: 'unknown', nPpm: 'unknown', pPpm: 'unknown', kPpm: 'unknown', cecCmolKg: 'unknown', sar: 'unknown', caCO3Pct: 'unknown' } },
    water: { provenance: { ph: 'unknown', ecDsm: 'unknown', tdsPpm: 'unknown', sodiumMeqL: 'unknown', chlorideMeqL: 'unknown', calciumMeqL: 'unknown', magnesiumMeqL: 'unknown', bicarbonateMeqL: 'unknown', sar: 'unknown', boronPpm: 'unknown' } },
    plantingDate,
  }), [areaHa, plantingDate]);

  // Today's ET₀ + rainfall from forecast
  const today = forecast?.daily?.[0];
  const etoMmPerDay = today?.et0 ?? 5.0;
  const rainfallMm = today?.precipitationSum ?? 0;

  // Active stage from FarmPilot's engine (date-based)
  const activeStage = crop && plantingDate ? getActiveStage(crop, plantingDate) : undefined;

  // Irrigation calculation (FarmPilot engine)
  const irrigation = useMemo(() => {
    if (!crop || !activeStage) return null;
    // Build a minimal plan for the engine
    const plan = {
      cropId: crop.id,
      plantingDate: plantingDate ?? new Date().toISOString().slice(0, 10),
      areaHa,
      productionSystem: 'open_field' as ProductionSystem,
      irrigationSystem: 'drip' as const,
      irrigationFlowLph: 2000, // default assumption
      fertilizerProduct: '15-15-15',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return calculateIrrigation(crop, activeStage.stage, plan, etoMmPerDay, rainfallMm);
  }, [crop, activeStage, plantingDate, areaHa, etoMmPerDay, rainfallMm]);

  // Fertilizer calculation (FarmPilot engine)
  const fertilizer = useMemo(() => {
    if (!crop) return null;
    const plan = {
      cropId: crop.id,
      plantingDate: plantingDate ?? new Date().toISOString().slice(0, 10),
      areaHa,
      productionSystem: 'open_field' as ProductionSystem,
      irrigationSystem: 'drip' as const,
      irrigationFlowLph: 2000,
      fertilizerProduct: '15-15-15',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return calculateFertilizer(crop, plan, '15-15-15', 1.0);
  }, [crop, plantingDate, areaHa]);

  // Crop recommendation (always show top 3 — useful even when a crop is set)
  const recommendations = useMemo(() => recommendCrops(context, undefined, 3), [context]);
  const currentCropScore = crop ? scoreCrop(crop, context, {
    climateSuitability: 0.18, soilSuitability: 0.18, waterCompatibility: 0.14,
    salinityTolerance: 0.10, plantingSeason: 0.10, productionSystem: 0.10,
    waterRequirement: 0.08, farmerObjective: 1.0, economicPotential: 0.12,
  }) : null;

  return (
    <div className="space-y-3">
      {/* Card 1: Today's Decision (irrigation + fertilizer) */}
      {crop && irrigation && (
        <Card className={cn(
          'border-emerald-300 dark:border-emerald-800',
          sunMode && 'border-foreground bg-background text-foreground',
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span>{tr("Today's Decision", 'قرار اليوم', 'Décision du jour')}</span>
              </div>
              <Badge variant="outline" className="text-[10px] gap-0.5">
                <span>{crop.emoji}</span>
                <span>{crop.name[language]}</span>
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Irrigation row */}
            <DecisionRow
              icon={<Droplets className="h-4 w-4 text-sky-600" />}
              color="sky"
              label={tr('Irrigate', 'اسقِ', 'Irriguer')}
              value={`${irrigation.totalM3PerDay} m³`}
              subtitle={irrigation.irrigationDurationMinutes
                ? `${irrigation.irrigationDurationMinutes} min @ 2000 L/h`
                : tr('Set flow rate in FarmPilot', 'حدد التدفق في FarmPilot', 'Débit dans FarmPilot')}
              confidence={irrigation.confidence}
              whyDetails={[
                { label: 'ET₀', value: `${irrigation.etoMmPerDay.toFixed(2)} mm/day` },
                { label: 'Kc', value: irrigation.kc.toFixed(2) },
                { label: 'ETc', value: `${irrigation.etcMmPerDay.toFixed(2)} mm/day` },
                { label: tr('Efficiency', 'الكفاءة', 'Efficacité'), value: `${(irrigation.irrigationEfficiency * 100).toFixed(0)}%` },
                { label: tr('Rain', 'مطر', 'Pluie'), value: `${irrigation.effectiveRainfallMm.toFixed(1)} mm` },
                { label: tr('Stage', 'المرحلة', 'Stade'), value: activeStage ? CROP_STAGE_LABELS[activeStage.stage].label[language] : '—' },
              ]}
              provenanceNote={isLiveForecast
                ? tr('ET₀ from live Open-Meteo forecast', 'ET₀ من توقعات Open-Meteo المباشرة', 'ET₀ issu des prévisions Open-Meteo en direct')
                : tr('ET₀ from Atlas climatic default', 'ET₀ من القيمة المناخية الافتراضية لأطلس', 'ET₀ issu du défaut climatique Atlas')}
              sunMode={sunMode}
              tr={tr}
            />

            {/* Fertilizer row */}
            {fertilizer && activeStage && (() => {
              const split = fertilizer.splitApplications.find((s) => s.stage === activeStage.stage);
              if (!split || split.kgPerHa <= 0) return null;
              return (
                <DecisionRow
                  icon={<FlaskConical className="h-4 w-4 text-amber-600" />}
                  color="amber"
                  label={tr('Fertilize', 'سمّد', 'Fertiliser')}
                  value={`${split.kgPerHa.toFixed(1)} kg/ha`}
                  subtitle={`15-15-15 · ${(split.fraction * 100).toFixed(0)}% N for ${CROP_STAGE_LABELS[activeStage.stage].label[language]}`}
                  confidence={fertilizer.confidence}
                  whyDetails={[
                    { label: 'N', value: `${fertilizer.requiredNutrient.n} kg/ha` },
                    { label: 'P', value: `${fertilizer.requiredNutrient.p} kg/ha` },
                    { label: 'K', value: `${fertilizer.requiredNutrient.k} kg/ha` },
                    { label: tr('Total for area', 'الإجمالي للمساحة', 'Total surface'), value: `${(split.kgPerHa * areaHa).toFixed(0)} kg` },
                  ]}
                  provenanceNote={tr('Based on reference yield; adjust after soil test', 'بناءً على المحصول المرجعي؛ عدّل بعد تحليل التربة', 'Basé sur rendement de référence; ajuster après analyse sol')}
                  sunMode={sunMode}
                  tr={tr}
                />
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Card 2: Crop Recommendation preview */}
      <Card className={cn(sunMode && 'border-foreground bg-background text-foreground')}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-600" />
              <span>{tr('Crop Recommendations', 'توصيات المحاصيل', 'Recommandations cultures')}</span>
            </div>
            {currentCropScore && (
              <Badge variant="outline" className="text-[10px]">
                {tr('Your crop', 'محصولك', 'Votre culture')}: {currentCropScore.score}%
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recommendations.map((rec, idx) => {
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
            const isCurrent = rec.crop.id === farmPilotCropId;
            return (
              <div
                key={rec.crop.id}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-lg border text-xs',
                  isCurrent ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-border',
                )}
              >
                <span className="text-base">{medal}</span>
                <span className="text-xl">{rec.crop.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{rec.crop.name[language]}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {rec.strengths.length > 0 && <span className="text-emerald-700 dark:text-emerald-300">✓ {rec.strengths[0][language]}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold tabular-nums">{rec.score}%</div>
                  <ConfidenceBadgeInline confidence={rec.confidence} language={language} />
                </div>
              </div>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-1 gap-1.5 text-xs"
            onClick={onOpenFarmPilotWizard}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>{tr('Open FarmPilot wizard', 'افتح معالج FarmPilot', 'Ouvrir l’assistant FarmPilot')}</span>
            <ChevronRight className="h-3 w-3 rtl:rotate-180" />
          </Button>
        </CardContent>
      </Card>

      {/* Card 3: Atlas Estimates status */}
      <AtlasEstimatesStatusCard
        sunMode={sunMode}
        isLiveForecast={isLiveForecast}
        hasCrop={Boolean(crop)}
        tr={tr}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Decision row (irrigation / fertilizer) with WHY? toggle
// ---------------------------------------------------------------------------

function DecisionRow({
  icon, color, label, value, subtitle, confidence, whyDetails, provenanceNote, sunMode, tr,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string;
  subtitle: string;
  confidence: Confidence;
  whyDetails: { label: string; value: string }[];
  provenanceNote: string;
  sunMode: boolean;
  tr: (en: string, ar: string, fr: string) => string;
}) {
  const [showWhy, setShowWhy] = useState(false);

  return (
    <div className={cn(
      'rounded-lg border p-3 space-y-2',
      sunMode ? 'border-foreground bg-background' : cn('border-', color, '-200 bg-', color, '-50/40 dark:bg-', color, '-950/20'),
    )}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn('rounded-lg p-1.5 bg-', color, '-100 dark:bg-', color, '-950/40')}>
            {icon}
          </span>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="text-lg font-bold tabular-nums">{value}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-muted-foreground">{subtitle}</div>
          <ConfidenceBadgeInline confidence={confidence} language={tr('en', 'ar', 'fr') === 'ar' ? 'ar' : tr('en', 'ar', 'fr') === 'fr' ? 'fr' : 'en'} />
        </div>
      </div>

      {/* Provenance note */}
      <div className="text-[10px] text-muted-foreground flex items-start gap-1">
        <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
        <span>{provenanceNote}</span>
      </div>

      {/* WHY? toggle */}
      <Button size="sm" variant="ghost" onClick={() => setShowWhy(!showWhy)} className="text-xs h-7">
        <HelpCircle className="h-3 w-3 me-1" />
        {showWhy ? tr('Hide', 'إخفاء', 'Masquer') : tr('WHY?', 'لماذا؟', 'POURQUOI ?')}
      </Button>
      {showWhy && (
        <div className="rounded-lg bg-muted/30 p-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {whyDetails.map((d) => (
            <div key={d.label}>
              <div className="text-muted-foreground text-[10px] uppercase tracking-wide">{d.label}</div>
              <div className="font-mono font-semibold">{d.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confidence badge (inline, language-aware)
// ---------------------------------------------------------------------------

function ConfidenceBadgeInline({ confidence, language }: { confidence: Confidence; language: 'en' | 'fr' | 'ar' }) {
  const badge = CONFIDENCE_BADGES[confidence];
  return (
    <Badge variant="outline" className="text-[9px] gap-0.5">
      <span>{badge.emoji}</span>
      <span>{badge.label[language]}</span>
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Atlas Estimates status card
// ---------------------------------------------------------------------------

function AtlasEstimatesStatusCard({
  sunMode, isLiveForecast, hasCrop, tr,
}: {
  sunMode: boolean;
  isLiveForecast: boolean;
  hasCrop: boolean;
  tr: (en: string, ar: string, fr: string) => string;
}) {
  const measuredCount = (isLiveForecast ? 1 : 0) + (hasCrop ? 1 : 0); // weather + crop
  const atlasCount = isLiveForecast ? 0 : 1; // weather fallback
  const unknownCount = 4; // soil + water (no editor in My Field yet)

  return (
    <Card className={cn(sunMode && 'border-foreground bg-background text-foreground')}>
      <CardContent className="pt-3 pb-3 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Database className="h-3.5 w-3.5 text-sky-600" />
          <span>{tr('Data Provenance', 'مصدر البيانات', 'Provenance des données')}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[10px]">
          <Badge variant="outline" className="gap-0.5">
            <span>🟢</span>
            <span>{measuredCount} {tr('measured', 'مقيس', 'mesuré')}</span>
          </Badge>
          <Badge variant="outline" className="gap-0.5">
            <span>🔵</span>
            <span>{atlasCount} {tr('Atlas', 'أطلس', 'Atlas')}</span>
          </Badge>
          <Badge variant="outline" className="gap-0.5">
            <span>🔴</span>
            <span>{unknownCount} {tr('unknown', 'غير معروف', 'inconnu')}</span>
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {tr(
            'For higher accuracy, add soil + water lab analyses in the FarmPilot wizard.',
            'للحصول على دقة أعلى، أضف تحاليل التربة والماء المخبرية في معالج FarmPilot.',
            'Pour plus de précision, ajoutez les analyses sol + eau dans l’assistant FarmPilot.',
          )}
        </p>
      </CardContent>
    </Card>
  );
}
