'use client';

import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import {
  Calendar,
  Layers,
  Sprout,
  Activity,
  Maximize2,
  Minimize2,
  TrendingUp,
  Clock,
  Sparkles,
  Droplets,
  CalendarCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCropLifecycle, type LifecycleStage, type CropLifecycle } from '@/lib/crop-lifecycle';
import { useTranslation, copyFor, type Language } from '@/lib/language-store';

export interface CropGrowthStagesVisualizerProps {
  cropId: string;
  plantingDate?: string;
  areaHa?: number;
  currentDayOffset?: number; // Optional simulated current day (DAP: days after planting)
  onSelectStage?: (stage: LifecycleStage) => void;
  className?: string;
}

interface StageCurvePoint {
  day: number;
  dateStr: string;
  stageName: string;
  stageEmoji: string;
  stageIndex: number;
  kc: number;
  heightCm: number;
  canopyCoverPct: number; // 0 to 100%
  biomassIndex: number; // 0 to 100 relative scale
  isCurrentDay?: boolean;
}

// Typical crop morphological benchmarks for height and canopy curves
interface CropGrowthProfile {
  maxHeightCm: number;
  maxCanopyCoverPct: number;
  senescenceDropPct: number; // how much canopy drops at maturation (e.g., drying leaves)
}

const CROP_GROWTH_PROFILES: Record<string, CropGrowthProfile> = {
  maize: { maxHeightCm: 240, maxCanopyCoverPct: 92, senescenceDropPct: 35 },
  wheat: { maxHeightCm: 100, maxCanopyCoverPct: 88, senescenceDropPct: 40 },
  barley: { maxHeightCm: 85, maxCanopyCoverPct: 85, senescenceDropPct: 45 },
  potato: { maxHeightCm: 65, maxCanopyCoverPct: 95, senescenceDropPct: 60 },
  tomato: { maxHeightCm: 160, maxCanopyCoverPct: 90, senescenceDropPct: 25 },
  onion: { maxHeightCm: 45, maxCanopyCoverPct: 70, senescenceDropPct: 55 },
  sunflower: { maxHeightCm: 210, maxCanopyCoverPct: 90, senescenceDropPct: 40 },
  canola: { maxHeightCm: 130, maxCanopyCoverPct: 95, senescenceDropPct: 50 },
  alfalfa: { maxHeightCm: 70, maxCanopyCoverPct: 95, senescenceDropPct: 10 },
  sorghum: { maxHeightCm: 220, maxCanopyCoverPct: 88, senescenceDropPct: 35 },
  soybean: { maxHeightCm: 90, maxCanopyCoverPct: 92, senescenceDropPct: 45 },
  rice: { maxHeightCm: 110, maxCanopyCoverPct: 95, senescenceDropPct: 35 },
  cotton: { maxHeightCm: 140, maxCanopyCoverPct: 85, senescenceDropPct: 30 },
  sugarcane: { maxHeightCm: 350, maxCanopyCoverPct: 98, senescenceDropPct: 15 },
  grapes: { maxHeightCm: 180, maxCanopyCoverPct: 80, senescenceDropPct: 30 },
  citrus: { maxHeightCm: 280, maxCanopyCoverPct: 85, senescenceDropPct: 10 },
  apple: { maxHeightCm: 320, maxCanopyCoverPct: 85, senescenceDropPct: 20 },
  lettuce: { maxHeightCm: 25, maxCanopyCoverPct: 90, senescenceDropPct: 10 },
  cucumber: { maxHeightCm: 180, maxCanopyCoverPct: 92, senescenceDropPct: 30 },
  'bell-pepper': { maxHeightCm: 80, maxCanopyCoverPct: 85, senescenceDropPct: 20 },
};

const DEFAULT_GROWTH_PROFILE: CropGrowthProfile = {
  maxHeightCm: 120,
  maxCanopyCoverPct: 85,
  senescenceDropPct: 30,
};

const STAGE_COLOR_PALETTE = [
  { fill: '#10b981', stroke: '#059669', bg: 'rgba(16, 185, 129, 0.08)' }, // Emerald (Emergence/Establishment)
  { fill: '#06b6d4', stroke: '#0891b2', bg: 'rgba(6, 182, 212, 0.08)' }, // Cyan (Vegetative/Tillering)
  { fill: '#f59e0b', stroke: '#d97706', bg: 'rgba(245, 158, 11, 0.08)' }, // Amber (Flowering/Heading/Silking)
  { fill: '#8b5cf6', stroke: '#7c3aed', bg: 'rgba(139, 92, 246, 0.08)' }, // Purple (Yield/Grain/Fruit Fill)
  { fill: '#f97316', stroke: '#ea580c', bg: 'rgba(249, 115, 22, 0.08)' }, // Orange (Ripening)
  { fill: '#84cc16', stroke: '#65a30d', bg: 'rgba(132, 204, 22, 0.08)' }, // Lime
];

function tr(language: Language, en: string, ar: string, fr: string): string {
  return copyFor(language, en, ar, fr);
}

export function CropGrowthStagesVisualizer({
  cropId,
  plantingDate = '2026-10-15',
  areaHa = 1,
  currentDayOffset,
  onSelectStage,
  className = '',
}: CropGrowthStagesVisualizerProps) {
  const { language, isRTL } = useTranslation();
  const [selectedMetric, setSelectedMetric] = useState<'both' | 'height' | 'canopy' | 'kc'>('both');
  const [activeStageIndex, setActiveStageIndex] = useState<number | null>(null);
  const [simulatedDay, setSimulatedDay] = useState<number | null>(currentDayOffset ?? null);

  // Fetch full crop lifecycle definition
  const lifecycle: CropLifecycle | null = useMemo(() => {
    return getCropLifecycle(cropId) ?? null;
  }, [cropId]);

  const growthProfile = CROP_GROWTH_PROFILES[cropId] || DEFAULT_GROWTH_PROFILE;

  // Base planting Date object
  const startDate = useMemo(() => {
    try {
      const parsed = new Date(plantingDate);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    } catch {
      return new Date();
    }
  }, [plantingDate]);

  // Calculate actual day offset since planting if not explicitly provided
  const realCurrentDap = useMemo(() => {
    const today = new Date();
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [startDate]);

  const effectiveDap = simulatedDay ?? (realCurrentDap >= 0 && lifecycle && realCurrentDap <= lifecycle.seasonLength ? realCurrentDap : null);

  // Generate continuous progression data points (interpolated by Day After Planting - DAP)
  const trajectoryData = useMemo(() => {
    if (!lifecycle || !lifecycle.stages || lifecycle.stages.length === 0) return [];

    const totalDays = lifecycle.seasonLength || lifecycle.stages[lifecycle.stages.length - 1].endDay || 120;
    const points: StageCurvePoint[] = [];
    const stages = lifecycle.stages;

    // Build day-by-day continuous sigmoid / Gompertz curve tailored to stages
    for (let d = 1; d <= totalDays; d += Math.max(1, Math.floor(totalDays / 50))) {
      // Find current stage
      let stageIdx = stages.findIndex((s) => d >= s.startDay && d <= s.endDay);
      if (stageIdx === -1) {
        stageIdx = d < stages[0].startDay ? 0 : stages.length - 1;
      }
      const st = stages[stageIdx];

      // Relative season progress [0, 1]
      const t = d / totalDays;

      // Sigmoid growth curve for Height: S-curve peaked around mid-season
      // Height(t) = Hmax / (1 + exp(-k * (t - t_mid)))
      const kH = 8.5;
      const tMidH = 0.42;
      const heightFraction = 1 / (1 + Math.exp(-kH * (t - tMidH)));
      const heightCm = Math.round(heightFraction * growthProfile.maxHeightCm * (d < 5 ? 0.05 : 1));

      // Canopy Cover (fc) curve: Rises rapidly in vegetative, plateaus at mid-season, drops during ripening
      const kC = 10;
      const tMidC = 0.35;
      let canopyFraction = 1 / (1 + Math.exp(-kC * (t - tMidC)));
      
      // Senescence attenuation in the final stage (maturation / harvest)
      const lateThreshold = stages.length > 2 ? stages[stages.length - 2].endDay / totalDays : 0.78;
      if (t > lateThreshold) {
        const lateProgress = (t - lateThreshold) / (1 - lateThreshold);
        canopyFraction -= (lateProgress * (growthProfile.senescenceDropPct / 100));
      }
      const canopyCoverPct = Math.max(0, Math.min(100, Math.round(canopyFraction * growthProfile.maxCanopyCoverPct)));

      // Interpolate Kc value across stages
      const kc = Number(st.kc.toFixed(2));

      // Biomass relative index (0-100)
      const biomassIndex = Math.round((heightFraction * 0.4 + canopyFraction * 0.6) * 100);

      // Calendar date
      const ptDate = new Date(startDate);
      ptDate.setDate(ptDate.getDate() + d - 1);
      const dateStr = ptDate.toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US', {
        month: 'short',
        day: 'numeric',
      });

      points.push({
        day: d,
        dateStr,
        stageName: st.name,
        stageEmoji: st.emoji,
        stageIndex: stageIdx,
        kc,
        heightCm,
        canopyCoverPct,
        biomassIndex,
        isCurrentDay: effectiveDap !== null && Math.abs(d - effectiveDap) <= 2,
      });
    }

    return points;
  }, [lifecycle, growthProfile, startDate, language, effectiveDap]);

  // Find active stage object
  const currentActiveStage = useMemo(() => {
    if (!lifecycle || !lifecycle.stages) return null;
    if (activeStageIndex !== null && lifecycle.stages[activeStageIndex]) {
      return lifecycle.stages[activeStageIndex];
    }
    if (effectiveDap !== null) {
      return lifecycle.stages.find((s) => effectiveDap >= s.startDay && effectiveDap <= s.endDay) || lifecycle.stages[0];
    }
    return lifecycle.stages[0];
  }, [lifecycle, activeStageIndex, effectiveDap]);

  if (!lifecycle || !lifecycle.stages || lifecycle.stages.length === 0) {
    return (
      <div className={`rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground ${className}`}>
        {tr(
          language,
          'No phenology lifecycle model available for this crop profile.',
          'لا يتوفر نموذج دورة نمو ظاهري لهذا المحصول.',
          'Aucun modèle phénologique disponible pour cette culture.'
        )}
      </div>
    );
  }

  return (
    <div
      id="crop-growth-stages-visualizer"
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`rounded-2xl border border-border bg-card p-4 shadow-sm transition-all sm:p-6 ${className}`}
    >
      {/* Header & Controls */}
      <div className="flex flex-col justify-between gap-4 border-b border-border/80 pb-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-lg dark:bg-emerald-950/60">
              {lifecycle.emoji || '🌱'}
            </span>
            <h3 className="text-base font-bold text-foreground sm:text-lg">
              {tr(
                language,
                `${lifecycle.name} — Growth Stages & Canopy Trajectory`,
                `${lifecycle.name} — مراحل النمو ومسار الغطاء الخضري`,
                `${lifecycle.name} — Stades de croissance et trajectoire du couvert`
              )}
            </h3>
            <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
              <Calendar className="mr-1 h-3 w-3" />
              {lifecycle.seasonLength} {tr(language, 'days', 'يوم', 'jours')}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {tr(
              language,
              'Projected plant height (cm), canopy ground cover fraction (fc %), and FAO-56 Kc progression based on verified Algerian agronomic lifecycles.',
              'توقعات طول النبتة (سم)، نسبة تغطية الغطاء الخضري (fc %)، ومعامل المحصول FAO-56 استناداً إلى دورات النمو المعتمدة.',
              'Projection de la hauteur (cm), fraction de couverture du sol (fc %) et coefficient FAO-56 Kc selon les cycles agronomiques.'
            )}
          </p>
        </div>

        {/* Metric Selector Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-muted/60 p-1 text-xs">
          <Button
            size="sm"
            variant={selectedMetric === 'both' ? 'default' : 'ghost'}
            className={`h-7 px-2.5 text-xs font-semibold ${selectedMetric === 'both' ? 'bg-emerald-700 text-white hover:bg-emerald-800' : ''}`}
            onClick={() => setSelectedMetric('both')}
          >
            <Layers className="mr-1.5 h-3.5 w-3.5" />
            {tr(language, 'Height & Canopy', 'الطول والتغطية', 'Hauteur & Couvert')}
          </Button>
          <Button
            size="sm"
            variant={selectedMetric === 'height' ? 'default' : 'ghost'}
            className={`h-7 px-2.5 text-xs font-semibold ${selectedMetric === 'height' ? 'bg-emerald-700 text-white hover:bg-emerald-800' : ''}`}
            onClick={() => setSelectedMetric('height')}
          >
            <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
            {tr(language, 'Height (cm)', 'الطول (سم)', 'Hauteur (cm)')}
          </Button>
          <Button
            size="sm"
            variant={selectedMetric === 'canopy' ? 'default' : 'ghost'}
            className={`h-7 px-2.5 text-xs font-semibold ${selectedMetric === 'canopy' ? 'bg-emerald-700 text-white hover:bg-emerald-800' : ''}`}
            onClick={() => setSelectedMetric('canopy')}
          >
            <Sprout className="mr-1.5 h-3.5 w-3.5" />
            {tr(language, 'Canopy Cover (%)', 'الغطاء الخضري (%)', 'Couvert (%)')}
          </Button>
          <Button
            size="sm"
            variant={selectedMetric === 'kc' ? 'default' : 'ghost'}
            className={`h-7 px-2.5 text-xs font-semibold ${selectedMetric === 'kc' ? 'bg-emerald-700 text-white hover:bg-emerald-800' : ''}`}
            onClick={() => setSelectedMetric('kc')}
          >
            <Droplets className="mr-1.5 h-3.5 w-3.5" />
            {tr(language, 'Crop Kc', 'معامل المحصول Kc', 'Kc Culture')}
          </Button>
        </div>
      </div>

      {/* Phenology Stages Timeline Cards */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {lifecycle.stages.map((stage, idx) => {
          const isSelected = activeStageIndex === idx;
          const isCurrent = effectiveDap !== null && effectiveDap >= stage.startDay && effectiveDap <= stage.endDay;
          const palette = STAGE_COLOR_PALETTE[idx % STAGE_COLOR_PALETTE.length];

          return (
            <button
              type="button"
              key={stage.name}
              onClick={() => {
                const nextIdx = isSelected ? null : idx;
                setActiveStageIndex(nextIdx);
                if (onSelectStage) onSelectStage(stage);
              }}
              className={`group flex flex-col justify-between rounded-xl border p-3 text-left transition-all hover:border-emerald-400 dark:hover:border-emerald-700 ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50/90 ring-2 ring-emerald-500/20 dark:bg-emerald-950/40'
                  : isCurrent
                  ? 'border-amber-400 bg-amber-50/60 dark:border-amber-700 dark:bg-amber-950/20'
                  : 'border-border bg-muted/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-base">{stage.emoji}</span>
                  {isCurrent && (
                    <Badge className="h-4 px-1 text-[9px] font-black bg-amber-500 text-white">
                      {tr(language, 'NOW', 'الآن', 'ACTUEL')}
                    </Badge>
                  )}
                  <span className="text-[10px] font-bold text-muted-foreground">
                    D{stage.startDay}–{stage.endDay}
                  </span>
                </div>
                <div className="mt-1.5 font-bold text-xs leading-tight text-foreground line-clamp-1">
                  {stage.name}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {stage.description}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2 text-[10px]">
                <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                  Kc: {stage.kc.toFixed(2)}
                </span>
                <span className="text-muted-foreground">
                  {stage.endDay - stage.startDay + 1} {tr(language, 'days', 'يوم', 'j')}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Recharts Area & Line Visualization */}
      <div className="mt-5 rounded-xl border border-border/80 bg-background/50 p-3 pt-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
              {tr(language, 'Height (cm)', 'الطول (سم)', 'Hauteur (cm)')} [Max ~{growthProfile.maxHeightCm}cm]
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-cyan-700 dark:text-cyan-400">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
              {tr(language, 'Canopy Cover (%)', 'تغطية الغطاء الخضري (%)', 'Couverture du couvert (%)')} [Max {growthProfile.maxCanopyCoverPct}%]
            </span>
            {selectedMetric === 'kc' && (
              <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                {tr(language, 'Kc Factor', 'معامل Kc', 'Facteur Kc')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <CalendarCheck className="h-3.5 w-3.5" />
            <span>
              {tr(language, 'Planting:', 'تاريخ البذر:', 'Semis :')} {startDate.toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="h-[280px] w-full sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={trajectoryData}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="growthCanopyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="growthHeightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickFormatter={(val) => `D${val}`}
              />

              {/* Left Axis: Height in cm */}
              <YAxis
                yAxisId="left"
                orientation="left"
                domain={[0, Math.ceil(growthProfile.maxHeightCm * 1.15)]}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickFormatter={(val) => `${val}cm`}
              />

              {/* Right Axis: Percentage 0-100% or Kc */}
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickFormatter={(val) => `${val}%`}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload as StageCurvePoint;
                  return (
                    <div className="rounded-xl border border-border bg-popover p-3 text-xs shadow-xl">
                      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-1.5 font-bold">
                        <span className="flex items-center gap-1 text-foreground">
                          <span>{data.stageEmoji}</span>
                          <span>{data.stageName}</span>
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          Day {data.day} ({data.dateStr})
                        </Badge>
                      </div>
                      <div className="mt-2 space-y-1.5">
                        <div className="flex justify-between gap-3 text-emerald-700 dark:text-emerald-400">
                          <span>{tr(language, 'Plant Height:', 'طول النبتة:', 'Hauteur plante :')}</span>
                          <strong className="font-mono">{data.heightCm} cm</strong>
                        </div>
                        <div className="flex justify-between gap-3 text-cyan-700 dark:text-cyan-400">
                          <span>{tr(language, 'Canopy Cover (fc):', 'تغطية الغطاء (fc):', 'Couverture couvert (fc) :')}</span>
                          <strong className="font-mono">{data.canopyCoverPct}%</strong>
                        </div>
                        <div className="flex justify-between gap-3 text-amber-700 dark:text-amber-400">
                          <span>{tr(language, 'Crop Factor (Kc):', 'معامل المحصول (Kc):', 'Coefficient Kc :')}</span>
                          <strong className="font-mono">{data.kc}</strong>
                        </div>
                        <div className="flex justify-between gap-3 text-purple-700 dark:text-purple-400">
                          <span>{tr(language, 'Biomass Index:', 'مؤشر الكتلة الحيوية:', 'Indice biomasse :')}</span>
                          <strong className="font-mono">{data.biomassIndex}/100</strong>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />

              {/* Stage Bands Highlighting */}
              {activeStageIndex !== null && lifecycle.stages[activeStageIndex] && (
                <ReferenceArea
                  yAxisId="left"
                  x1={lifecycle.stages[activeStageIndex].startDay}
                  x2={lifecycle.stages[activeStageIndex].endDay}
                  fill="#10b981"
                  fillOpacity={0.12}
                  stroke="#059669"
                  strokeOpacity={0.4}
                  strokeDasharray="3 3"
                />
              )}

              {/* Current Day Reference Line */}
              {effectiveDap !== null && (
                <ReferenceLine
                  yAxisId="left"
                  x={effectiveDap}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  label={{
                    value: tr(language, `Today (D${effectiveDap})`, `اليوم (يوم ${effectiveDap})`, `Aujourd'hui (J${effectiveDap})`),
                    position: 'top',
                    fill: '#d97706',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
              )}

              {/* Canopy Cover Area Curve */}
              {(selectedMetric === 'both' || selectedMetric === 'canopy') && (
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="canopyCoverPct"
                  name={tr(language, 'Canopy Cover %', 'الغطاء الخضري %', 'Couvert %')}
                  stroke="#0891b2"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#growthCanopyGrad)"
                />
              )}

              {/* Height Area / Line Curve */}
              {(selectedMetric === 'both' || selectedMetric === 'height') && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="heightCm"
                  name={tr(language, 'Height (cm)', 'الطول (سم)', 'Hauteur (cm)')}
                  stroke="#059669"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#growthHeightGrad)"
                />
              )}

              {/* Kc Step/Spline Line */}
              {(selectedMetric === 'both' || selectedMetric === 'kc') && (
                <Line
                  yAxisId="right"
                  type="stepAfter"
                  dataKey="kc"
                  name={tr(language, 'Crop Kc (×100)', 'معامل المحصول Kc', 'Facteur Kc')}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detail Inspector for Selected or Current Stage */}
      {currentActiveStage && (
        <div className="mt-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 text-xs dark:border-emerald-900/60 dark:bg-emerald-950/20">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="text-xl">{currentActiveStage.emoji}</span>
              <div>
                <h4 className="font-bold text-sm text-foreground">
                  {currentActiveStage.name} ({tr(language, 'Days', 'الأيام', 'Jours')} {currentActiveStage.startDay}–{currentActiveStage.endDay})
                </h4>
                <p className="text-muted-foreground">{currentActiveStage.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-emerald-300 bg-white font-mono dark:bg-slate-900">
                {tr(language, 'Kc Mid:', 'معامل Kc المتوسط:', 'Kc moyen :')} {currentActiveStage.kc.toFixed(2)}
              </Badge>
              <Badge variant="outline" className="border-cyan-300 bg-white font-mono dark:bg-slate-900">
                {tr(language, 'Typical Stage Duration:', 'مدة المرحلة:', 'Durée du stade :')} {currentActiveStage.endDay - currentActiveStage.startDay + 1} {tr(language, 'days', 'يوم', 'j')}
              </Badge>
            </div>
          </div>

          {/* Key Management Operations during this stage */}
          {lifecycle.labor && lifecycle.labor.filter((l) => l.stage.toLowerCase().includes(currentActiveStage.name.toLowerCase())).length > 0 && (
            <div className="mt-3 border-t border-emerald-200/60 pt-2.5 dark:border-emerald-900/50">
              <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                {tr(language, 'Recommended Field Operations in this stage:', 'العمليات الحقلية الموصى بها في هذه المرحلة:', 'Opérations recommandées dans ce stade :')}
              </span>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {lifecycle.labor
                  .filter((l) => l.stage.toLowerCase().includes(currentActiveStage.name.toLowerCase()))
                  .map((op, opIdx) => (
                    <div
                      key={`${op.task}-${opIdx}`}
                      className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-[11px] shadow-xs dark:border-emerald-800 dark:bg-slate-900"
                    >
                      <Activity className="h-3 w-3 text-emerald-600" />
                      <span>{op.task}</span>
                      <span className="text-muted-foreground">({op.laborDaysPerHa} d/ha)</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
