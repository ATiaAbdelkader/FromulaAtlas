'use client';

import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
  CartesianGrid,
} from 'recharts';
import {
  Droplets,
  CloudRain,
  Activity,
  Maximize2,
  Minimize2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  Layers,
  Sparkles,
  Gauge,
  Sliders,
  ShieldCheck,
  CircleDollarSign,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCropLifecycle, type LifecycleStage, type CropLifecycle } from '@/lib/crop-lifecycle';
import { useTranslation, copyFor, type Language } from '@/lib/language-store';
import { formatSimulatorNumber, formatSimulatorDzd } from '@/lib/crop-simulator';

export interface CropWaterBudgetVisualizerProps {
  cropId: string;
  plantingDate?: string;
  areaHa?: number;
  avgET0?: number;
  irrigationSystem?: 'drip' | 'sprinkler' | 'furrow' | 'rainfed';
  waterCostPerM3?: number;
  className?: string;
}

type ChartViewMode = 'cumulative' | 'weekly_rates' | 'balance_delta';
type UnitMode = 'mm' | 'm3';
type WaterStrategy = 'optimal' | 'regulated_deficit' | 'rainfed_supplemental';

interface WeeklyWaterPoint {
  week: number;
  dayStart: number;
  dayEnd: number;
  dateStr: string;
  stageName: string;
  stageEmoji: string;
  isCriticalStage: boolean;
  kc: number;
  weeklyEt0Mm: number;
  weeklyEtcMm: number;
  weeklyEffectiveRainMm: number;
  weeklyNetIrrigationMm: number;
  weeklyGrossIrrigationMm: number;
  weeklyBalanceMm: number; // Net Irrigation + Rain - ETc
  // Volumes in m3 for the whole field
  weeklyEtcM3: number;
  weeklyNetIrrigationM3: number;
  weeklyGrossIrrigationM3: number;
  // Cumulative metrics
  cumEtcMm: number;
  cumNetIrrigationMm: number;
  cumGrossIrrigationMm: number;
  cumRainMm: number;
  cumBalanceMm: number;
  cumEtcM3: number;
  cumNetIrrigationM3: number;
  cumGrossIrrigationM3: number;
}

const SYSTEM_EFFICIENCIES: Record<string, number> = {
  drip: 0.90,
  sprinkler: 0.75,
  furrow: 0.60,
  rainfed: 0.50,
};

const STAGE_COLORS = [
  { bg: 'rgba(16, 185, 129, 0.08)', stroke: '#10b981' }, // Stage 0
  { bg: 'rgba(6, 182, 212, 0.08)', stroke: '#06b6d4' },  // Stage 1
  { bg: 'rgba(245, 158, 11, 0.08)', stroke: '#f59e0b' }, // Stage 2
  { bg: 'rgba(139, 92, 246, 0.08)', stroke: '#8b5cf6' }, // Stage 3
  { bg: 'rgba(249, 115, 22, 0.08)', stroke: '#f97316' }, // Stage 4
  { bg: 'rgba(132, 204, 22, 0.08)', stroke: '#84cc16' }, // Stage 5
];

export function CropWaterBudgetVisualizer({
  cropId,
  plantingDate = '2026-10-15',
  areaHa = 1,
  avgET0 = 5,
  irrigationSystem = 'drip',
  waterCostPerM3 = 18,
  className = '',
}: CropWaterBudgetVisualizerProps) {
  const { language } = useTranslation();
  const tr = copyFor;

  const [viewMode, setViewMode] = useState<ChartViewMode>('cumulative');
  const [unitMode, setUnitMode] = useState<UnitMode>('mm');
  const [strategy, setStrategy] = useState<WaterStrategy>('optimal');
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeHoverPoint, setActiveHoverPoint] = useState<WeeklyWaterPoint | null>(null);
  const [effectiveRainPct, setEffectiveRainPct] = useState<number>(15); // Avg seasonal rainfall contribution %

  const lifecycle: CropLifecycle = useMemo(() => {
    return getCropLifecycle(cropId) ?? (getCropLifecycle('wheat') as CropLifecycle);
  }, [cropId]);

  const efficiency = SYSTEM_EFFICIENCIES[irrigationSystem] ?? 0.85;

  // Build weekly water budget data across crop season
  const { weeklyData, seasonTotals, stagesWithWeeks } = useMemo(() => {
    const totalDays = lifecycle.seasonLength || 120;
    const totalWeeks = Math.ceil(totalDays / 7);
    const parsedPlanting = new Date(plantingDate || '2026-10-15');
    const validPlanting = isNaN(parsedPlanting.getTime()) ? new Date() : parsedPlanting;

    // Daily ET0 estimation with seasonal curve variation
    const baseDailyEt0 = Math.max(1, avgET0 || 5);

    let cumEtcMm = 0;
    let cumNetIrrigationMm = 0;
    let cumGrossIrrigationMm = 0;
    let cumRainMm = 0;
    let peakEtcWeek = 1;
    let maxWeeklyEtc = 0;

    const data: WeeklyWaterPoint[] = [];

    // Map stages to week ranges
    const stagesMapped = lifecycle.stages.map((stage, sIdx) => {
      const startWeek = Math.max(1, Math.floor(stage.startDay / 7) + 1);
      const endWeek = Math.min(totalWeeks, Math.ceil(stage.endDay / 7));
      const isCritical =
        stage.name.toLowerCase().includes('flower') ||
        stage.name.toLowerCase().includes('heading') ||
        stage.name.toLowerCase().includes('silking') ||
        stage.name.toLowerCase().includes('tassel') ||
        stage.name.toLowerCase().includes('fruit') ||
        stage.name.toLowerCase().includes('grain');

      return {
        ...stage,
        index: sIdx,
        startWeek,
        endWeek,
        isCritical,
      };
    });

    for (let w = 1; w <= totalWeeks; w++) {
      const dayStart = (w - 1) * 7 + 1;
      const dayEnd = Math.min(totalDays, w * 7);
      const midDay = Math.round((dayStart + dayEnd) / 2);

      // Date for this week
      const weekDate = new Date(validPlanting);
      weekDate.setDate(validPlanting.getDate() + dayStart - 1);
      const dateStr = weekDate.toISOString().slice(0, 10);

      // Find stage for midDay
      const activeStage =
        lifecycle.stages.find((s) => midDay >= s.startDay && midDay <= s.endDay) ??
        lifecycle.stages[lifecycle.stages.length - 1];

      const stageIdx = lifecycle.stages.indexOf(activeStage);
      const isCritical = stagesMapped[stageIdx]?.isCritical ?? false;

      // Kc interpolation
      let kc = activeStage.kc;
      if (stageIdx > 0 && midDay < activeStage.startDay + 7) {
        const prevStage = lifecycle.stages[stageIdx - 1];
        const progress = Math.max(0, (midDay - prevStage.endDay) / Math.max(1, activeStage.startDay + 7 - prevStage.endDay));
        kc = prevStage.kc + progress * (activeStage.kc - prevStage.kc);
      }

      // Climate curve factor over season (e.g. summer heating or winter cooling)
      const seasonProgress = midDay / totalDays;
      const climateFactor = 1.0 + Math.sin(seasonProgress * Math.PI) * 0.25; // 25% peak mid-season temperature
      const weeklyEt0 = baseDailyEt0 * 7 * climateFactor;

      // Crop water demand (ETc = Kc * ET0)
      const weeklyEtcMm = Math.round(weeklyEt0 * kc * 10) / 10;
      if (weeklyEtcMm > maxWeeklyEtc) {
        maxWeeklyEtc = weeklyEtcMm;
        peakEtcWeek = w;
      }

      // Effective rainfall contribution
      const weeklyRainMm = Math.round((weeklyEtcMm * (effectiveRainPct / 100)) * (0.8 + Math.cos(w) * 0.4) * 10) / 10;
      const effectiveRain = Math.max(0, Math.min(weeklyEtcMm * 0.6, weeklyRainMm));

      // Net Irrigation requirement based on chosen management strategy
      let strategyFactor = 1.0;
      if (strategy === 'regulated_deficit') {
        // Full irrigation in critical flowering/grain fill, 70-80% in early vegetative and ripening
        strategyFactor = isCritical ? 1.0 : (activeStage.name.toLowerCase().includes('matur') || activeStage.name.toLowerCase().includes('emerg')) ? 0.65 : 0.80;
      } else if (strategy === 'rainfed_supplemental') {
        // Rainfed supplemental supplies water primarily during dry stress spikes & critical reproduction
        strategyFactor = isCritical ? 0.85 : 0.45;
      }

      const netDemandAfterRain = Math.max(0, weeklyEtcMm - effectiveRain);
      const weeklyNetIrrigationMm = Math.round(netDemandAfterRain * strategyFactor * 10) / 10;
      const weeklyGrossIrrigationMm = Math.round((weeklyNetIrrigationMm / efficiency) * 10) / 10;
      const weeklyBalanceMm = Math.round((weeklyNetIrrigationMm + effectiveRain - weeklyEtcMm) * 10) / 10;

      // M3 conversions (1 mm over 1 ha = 10 m³)
      const weeklyEtcM3 = Math.round(weeklyEtcMm * areaHa * 10);
      const weeklyNetIrrigationM3 = Math.round(weeklyNetIrrigationMm * areaHa * 10);
      const weeklyGrossIrrigationM3 = Math.round(weeklyGrossIrrigationMm * areaHa * 10);

      cumEtcMm += weeklyEtcMm;
      cumNetIrrigationMm += weeklyNetIrrigationMm;
      cumGrossIrrigationMm += weeklyGrossIrrigationMm;
      cumRainMm += effectiveRain;

      data.push({
        week: w,
        dayStart,
        dayEnd,
        dateStr,
        stageName: activeStage.name,
        stageEmoji: activeStage.emoji,
        isCriticalStage: isCritical,
        kc: Math.round(kc * 100) / 100,
        weeklyEt0Mm: Math.round(weeklyEt0 * 10) / 10,
        weeklyEtcMm,
        weeklyEffectiveRainMm: effectiveRain,
        weeklyNetIrrigationMm,
        weeklyGrossIrrigationMm,
        weeklyBalanceMm,
        weeklyEtcM3,
        weeklyNetIrrigationM3,
        weeklyGrossIrrigationM3,
        cumEtcMm: Math.round(cumEtcMm * 10) / 10,
        cumNetIrrigationMm: Math.round(cumNetIrrigationMm * 10) / 10,
        cumGrossIrrigationMm: Math.round(cumGrossIrrigationMm * 10) / 10,
        cumRainMm: Math.round(cumRainMm * 10) / 10,
        cumBalanceMm: Math.round((cumNetIrrigationMm + cumRainMm - cumEtcMm) * 10) / 10,
        cumEtcM3: Math.round(cumEtcMm * areaHa * 10),
        cumNetIrrigationM3: Math.round(cumNetIrrigationMm * areaHa * 10),
        cumGrossIrrigationM3: Math.round(cumGrossIrrigationMm * areaHa * 10),
      });
    }

    const totals = {
      totalEtcMm: Math.round(cumEtcMm),
      totalNetIrrigationMm: Math.round(cumNetIrrigationMm),
      totalGrossIrrigationMm: Math.round(cumGrossIrrigationMm),
      totalRainMm: Math.round(cumRainMm),
      totalBalanceMm: Math.round(cumNetIrrigationMm + cumRainMm - cumEtcMm),
      totalEtcM3: Math.round(cumEtcMm * areaHa * 10),
      totalNetIrrigationM3: Math.round(cumNetIrrigationMm * areaHa * 10),
      totalGrossIrrigationM3: Math.round(cumGrossIrrigationMm * areaHa * 10),
      peakEtcWeek,
      maxWeeklyEtc,
      coveragePct: cumEtcMm > 0 ? Math.round(((cumNetIrrigationMm + cumRainMm) / cumEtcMm) * 100) : 100,
      totalWaterCostDzd: Math.round(cumGrossIrrigationMm * areaHa * 10 * waterCostPerM3),
    };

    return {
      weeklyData: data,
      seasonTotals: totals,
      stagesWithWeeks: stagesMapped,
    };
  }, [lifecycle, plantingDate, areaHa, avgET0, irrigationSystem, strategy, effectiveRainPct, efficiency, waterCostPerM3]);

  // Strategy badge styling
  const strategyInfo = useMemo(() => {
    switch (strategy) {
      case 'optimal':
        return {
          title: tr(language, 'Full FAO-56 Replenishment (100%)', 'تعويض كامل وفق FAO-56 (100%)', 'Compensation intégrale FAO-56 (100%)'),
          desc: tr(language, 'Satisfies 100% of weekly crop evapotranspiration (ETc) to prevent any water-induced yield reduction.', 'يغطي 100% من الاحتياج المائي للمحصول لتفادي أي انخفاض في المردود.', 'Couvre 100 % de l’ETc pour éliminer tout stress hydrique.'),
          tone: 'emerald',
        };
      case 'regulated_deficit':
        return {
          title: tr(language, 'Regulated Deficit Irrigation (RDI)', 'الري الناقص المقنن (RDI)', 'Irrigation déficitaire régulée (RDI)'),
          desc: tr(language, 'Reduces water application during low-sensitivity vegetative stages (70-80%) while maintaining 100% during critical flowering/fill.', 'يقلل الري في المراحل الخضرية (70-80%) مع الحفاظ على 100% أثناء التزهير وتعبئة الحبوب/الثمار.', 'Réduit l’apport en phase végétative en maintenant 100 % à la floraison.'),
          tone: 'amber',
        };
      case 'rainfed_supplemental':
        return {
          title: tr(language, 'Supplemental Irrigation Strategy', 'استراتيجية الري التكميلي', 'Stratégie d’irrigation de complément'),
          desc: tr(language, 'Buffers rainfed fields against severe droughts, applying water strictly during critical reproductive windows.', 'يدعم الزراعات البعلية ضد موجات الجفاف بالري فقط في المراحل الحرجة.', 'Sécurise les cultures pluviales en intervenant lors des stades sensibles.'),
          tone: 'blue',
        };
    }
  }, [strategy, language]);

  return (
    <div
      id="crop-water-budget-visualizer"
      className={`rounded-2xl border border-blue-200/80 bg-card p-4 shadow-sm sm:p-6 dark:border-blue-900/60 dark:bg-slate-900/70 transition-all ${
        isExpanded ? 'ring-2 ring-blue-500/20' : ''
      } ${className}`}
    >
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-4 border-b border-border/80 pb-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
            <Droplets className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">
                {tr(language, 'FAO-56 Water Budget Strategy', 'ميزانية المياه واستراتيجية التوازن (FAO-56)', 'Budget hydrique & Stratégie FAO-56')}
              </span>
              <Badge variant="outline" className="border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-300 text-[10px] py-0 px-2">
                {irrigationSystem.toUpperCase()} ({Math.round(efficiency * 100)}% {tr(language, 'eff.', 'كفاءة', 'eff.')})
              </Badge>
            </div>
            <h3 className="font-bold text-base text-foreground sm:text-lg">
              {tr(language, 'Net Irrigation vs. Cumulative Crop ETc', 'الري الصافي مقابل البخر-نتح التراكمي (ETc)', 'Irrigation nette vs ETc cumulée')}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {tr(
                language,
                `Lifecycle water balance simulation for ${lifecycle.emoji} ${lifecycle.name} across ${areaHa} ha.`,
                `محاكاة التوازن المائي الشامل لمحصول ${lifecycle.emoji} ${lifecycle.name} على مساحة ${areaHa} هكتار.`,
                `Simulation du bilan hydrique sur le cycle de ${lifecycle.emoji} ${lifecycle.name} pour ${areaHa} ha.`
              )}
            </p>
          </div>
        </div>

        {/* View Controls & Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Unit Toggle (mm vs m³) */}
          <div className="inline-flex rounded-lg border border-border bg-muted/60 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setUnitMode('mm')}
              className={`rounded-md px-2.5 py-1 font-semibold transition-all ${
                unitMode === 'mm'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              mm ({tr(language, 'Depth', 'العمق', 'Lame')})
            </button>
            <button
              type="button"
              onClick={() => setUnitMode('m3')}
              className={`rounded-md px-2.5 py-1 font-semibold transition-all ${
                unitMode === 'm3'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              m³ ({tr(language, 'Volume', 'الحجم', 'Volume')})
            </button>
          </div>

          {/* Chart Mode Selector */}
          <div className="inline-flex rounded-lg border border-border bg-muted/60 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('cumulative')}
              className={`rounded-md px-2.5 py-1 font-semibold transition-all ${
                viewMode === 'cumulative'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tr(language, 'Cumulative Trajectory', 'التراكمي', 'Trajectoire cumulée')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('weekly_rates')}
              className={`rounded-md px-2.5 py-1 font-semibold transition-all ${
                viewMode === 'weekly_rates'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tr(language, 'Weekly Rates & Kc', 'المعدلات الأسبوعية', 'Taux hebdo & Kc')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('balance_delta')}
              className={`rounded-md px-2.5 py-1 font-semibold transition-all ${
                viewMode === 'balance_delta'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tr(language, 'Water Balance Delta', 'فارق التوازن', 'Bilan net')}
            </button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-label={isExpanded ? 'Collapse chart' : 'Expand chart'}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Top Strategy & KPI Scoreboard */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Cumulative ETc Metric */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{tr(language, 'Cumulative Crop ETc', 'إجمالي البخر-نتح (ETc)', 'ETc cumulée')}</span>
            <Activity className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-black text-foreground">
              {unitMode === 'mm' ? `${seasonTotals.totalEtcMm} mm` : `${seasonTotals.totalEtcM3.toLocaleString()} m³`}
            </span>
            <span className="text-[11px] text-emerald-600 font-bold">
              {unitMode === 'mm' ? `(${seasonTotals.totalEtcM3.toLocaleString()} m³)` : `(${seasonTotals.totalEtcMm} mm)`}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {tr(language, 'Peak week', 'ذروة الاحتياج', 'Pic')} W{seasonTotals.peakEtcWeek} ({seasonTotals.maxWeeklyEtc} mm/wk)
          </div>
        </div>

        {/* Scheduled Net Irrigation */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{tr(language, 'Scheduled Net Irrigation', 'الري الصافي المجدول', 'Irrigation nette prévue')}</span>
            <Droplets className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-black text-blue-700 dark:text-blue-300">
              {unitMode === 'mm' ? `${seasonTotals.totalNetIrrigationMm} mm` : `${seasonTotals.totalNetIrrigationM3.toLocaleString()} m³`}
            </span>
            <span className="text-[11px] text-blue-600 font-bold">
              {seasonTotals.coveragePct}% {tr(language, 'of demand', 'من الاحتياج', 'du besoin')}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {tr(language, 'Effective rain offset:', 'مساهمة الأمطار الفعالة:', 'Pluie utile :')} {seasonTotals.totalRainMm} mm
          </div>
        </div>

        {/* Gross Volume Pumped (with Efficiency) */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{tr(language, 'Gross Pumping Volume', 'حجم الضخ الإجمالي', 'Volume brut pompé')}</span>
            <Gauge className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-black text-amber-700 dark:text-amber-300">
              {seasonTotals.totalGrossIrrigationM3.toLocaleString()} m³
            </span>
            <span className="text-[11px] text-amber-600 font-bold">
              η = {Math.round(efficiency * 100)}%
            </span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {tr(language, 'Gross depth:', 'العمق الإجمالي:', 'Lame brute :')} {seasonTotals.totalGrossIrrigationMm} mm
          </div>
        </div>

        {/* Water Cost Impact */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{tr(language, 'Irrigation Energy / Cost', 'تكلفة طاقة ومياه الري', 'Coût eau & pompage')}</span>
            <CircleDollarSign className="h-3.5 w-3.5 text-rose-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-black text-foreground">
              {formatSimulatorDzd(seasonTotals.totalWaterCostDzd)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {formatSimulatorDzd(Math.round(seasonTotals.totalWaterCostDzd / Math.max(0.1, areaHa)))} / ha ({waterCostPerM3} DZD/m³)
          </div>
        </div>
      </div>

      {/* Strategy Selector Toolbar */}
      <div className="mt-4 flex flex-col justify-between gap-3 rounded-xl border border-border bg-muted/40 p-3 text-xs sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-foreground flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-blue-600" />
            {tr(language, 'Water Strategy Model:', 'نموذج استراتيجية المياه:', 'Modèle de stratégie :')}
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setStrategy('optimal')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                strategy === 'optimal'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-card border border-border text-foreground hover:bg-muted'
              }`}
            >
              🌱 {tr(language, 'Full FAO-56 (100%)', 'تعويض كامل (100%)', 'Optimal (100%)')}
            </button>
            <button
              type="button"
              onClick={() => setStrategy('regulated_deficit')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                strategy === 'regulated_deficit'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-card border border-border text-foreground hover:bg-muted'
              }`}
            >
              ⚡ {tr(language, 'Regulated Deficit (RDI)', 'عجز مقنن (RDI)', 'Déficit régulé (RDI)')}
            </button>
            <button
              type="button"
              onClick={() => setStrategy('rainfed_supplemental')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                strategy === 'rainfed_supplemental'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-card border border-border text-foreground hover:bg-muted'
              }`}
            >
              🌧️ {tr(language, 'Supplemental Buffer', 'تكميلي لحالات الجفاف', 'Complément pluvial')}
            </button>
          </div>
        </div>

        {/* Effective Rain contribution slider / preset */}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground flex items-center gap-1">
            <CloudRain className="h-3.5 w-3.5 text-sky-500" />
            {tr(language, 'Rain offset:', 'مساهمة المطر:', 'Part pluie :')}
          </span>
          <select
            className="h-7 rounded-md border border-input bg-card px-2 text-xs font-semibold"
            value={effectiveRainPct}
            onChange={(e) => setEffectiveRainPct(Number(e.target.value))}
          >
            <option value={0}>{tr(language, '0% (Arid / Zero rain)', '0% (جاف / بدون مطر)', '0% (Aride / sans pluie)')}</option>
            <option value={15}>{tr(language, '15% (Typical Spring)', '15% (ربيعي اعتيادي)', '15% (Printemps type)')}</option>
            <option value={30}>{tr(language, '30% (High Rainfall)', '30% (أمطار غزيرة)', '30% (Forte pluviométrie)')}</option>
            <option value={50}>{tr(language, '50% (Sub-humid)', '50% (رطب / مطري)', '50% (Sub-humide)')}</option>
          </select>
        </div>
      </div>

      {/* Main Recharts Container */}
      <div className="mt-4 rounded-xl border border-border/90 bg-card p-3 shadow-xs">
        <div className={`w-full transition-all duration-300 ${isExpanded ? 'h-[460px]' : 'h-[320px]'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={weeklyData}
              margin={{ top: 15, right: 25, left: 10, bottom: 20 }}
              onMouseMove={(state) => {
                if (state?.activePayload && state.activePayload.length > 0) {
                  const point = state.activePayload[0].payload as WeeklyWaterPoint;
                  setActiveHoverPoint(point);
                }
              }}
              onMouseLeave={() => setActiveHoverPoint(null)}
            >
              <defs>
                {/* Gradient for Cumulative ETc */}
                <linearGradient id="wbEtcGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>

                {/* Gradient for Cumulative Net Irrigation */}
                <linearGradient id="wbIrrigGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                </linearGradient>

                {/* Gradient for Water Balance Delta */}
                <linearGradient id="wbDeltaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.15} vertical={false} />

              {/* Background Reference Areas for Phenological Stages */}
              {stagesWithWeeks.map((stage) => (
                <ReferenceArea
                  key={stage.name}
                  x1={stage.startWeek}
                  x2={stage.endWeek}
                  yAxisId="left"
                  fill={STAGE_COLORS[stage.index % STAGE_COLORS.length].bg}
                  stroke={stage.isCritical ? '#f59e0b' : 'transparent'}
                  strokeDasharray={stage.isCritical ? '3 3' : undefined}
                  strokeWidth={stage.isCritical ? 1.5 : 0}
                />
              ))}

              <XAxis
                dataKey="week"
                tickLine={false}
                axisLine={{ stroke: '#888888', opacity: 0.3 }}
                tick={{ fontSize: 11, fill: '#888888' }}
                tickFormatter={(val) => `W${val}`}
                label={{
                  value: tr(language, 'Season Week (from Planting)', 'أسبوع الموسم (من الغرس)', 'Semaine de saison'),
                  position: 'insideBottom',
                  offset: -12,
                  fill: '#888888',
                  fontSize: 11,
                }}
              />

              {/* Left Y-Axis for Depth/Volume */}
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={{ stroke: '#888888', opacity: 0.3 }}
                tick={{ fontSize: 11, fill: '#888888' }}
                tickFormatter={(val) => (unitMode === 'mm' ? `${val} mm` : `${val} m³`)}
                label={{
                  value:
                    viewMode === 'cumulative'
                      ? tr(language, `Cumulative Water (${unitMode})`, `الماء التراكمي (${unitMode})`, `Eau cumulée (${unitMode})`)
                      : viewMode === 'weekly_rates'
                      ? tr(language, `Weekly Depth (${unitMode}/wk)`, `العمق الأسبوعي (${unitMode}/أسبوع)`, `Lame hebdo (${unitMode}/sem)`)
                      : tr(language, `Balance Delta (${unitMode})`, `فارق التوازن (${unitMode})`, `Écart du bilan (${unitMode})`),
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#888888',
                  fontSize: 11,
                  offset: 0,
                }}
              />

              {/* Right Y-Axis for Kc when in Weekly Rates mode */}
              {viewMode === 'weekly_rates' && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 1.4]}
                  tickCount={6}
                  tickLine={false}
                  axisLine={{ stroke: '#f59e0b', opacity: 0.3 }}
                  tick={{ fontSize: 10, fill: '#d97706' }}
                  tickFormatter={(val) => `Kc ${val.toFixed(1)}`}
                />
              )}

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as WeeklyWaterPoint;
                    return (
                      <div className="rounded-xl border border-border bg-card/95 p-3.5 text-xs shadow-xl backdrop-blur-sm">
                        <div className="flex items-center justify-between gap-3 border-b border-border/80 pb-2 font-bold">
                          <span className="flex items-center gap-1.5">
                            <span>{d.stageEmoji}</span>
                            <span>
                              W{d.week} · {d.stageName} (D{d.dayStart}–D{d.dayEnd})
                            </span>
                          </span>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {d.dateStr}
                          </Badge>
                        </div>

                        <div className="mt-2.5 space-y-1.5">
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              {tr(language, 'Cumulative Crop ETc:', 'البخر-نتح التراكمي (ETc):', 'ETc cumulée :')}
                            </span>
                            <span className="font-mono font-bold">
                              {unitMode === 'mm' ? `${d.cumEtcMm} mm` : `${d.cumEtcM3.toLocaleString()} m³`}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
                              <span className="h-2 w-2 rounded-full bg-blue-600" />
                              {tr(language, 'Cumulative Net Irrigation:', 'الري الصافي التراكمي:', 'Irrigation nette cumulée :')}
                            </span>
                            <span className="font-mono font-bold">
                              {unitMode === 'mm' ? `${d.cumNetIrrigationMm} mm` : `${d.cumNetIrrigationM3.toLocaleString()} m³`}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300">
                              <span className="h-2 w-2 rounded-full bg-amber-500" />
                              {tr(language, 'Gross Pumping Volume:', 'حجم الضخ الإجمالي:', 'Volume brut pompé :')}
                            </span>
                            <span className="font-mono font-bold">
                              {unitMode === 'mm' ? `${d.cumGrossIrrigationMm} mm` : `${d.cumGrossIrrigationM3.toLocaleString()} m³`}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-1.5">
                            <span className="text-muted-foreground">{tr(language, 'Weekly ETc Rate:', 'معدل ETc الأسبوعي:', 'Taux ETc hebdo :')}</span>
                            <span className="font-mono">{d.weeklyEtcMm} mm/wk (Kc {d.kc.toFixed(2)})</span>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">{tr(language, 'Weekly Net Irrigation:', 'الري الصافي الأسبوعي:', 'Irrigation nette hebdo :')}</span>
                            <span className="font-mono font-semibold text-blue-600">{d.weeklyNetIrrigationMm} mm/wk</span>
                          </div>

                          {d.isCriticalStage && (
                            <div className="mt-2 rounded-md bg-amber-500/10 p-1.5 text-[10px] font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              <span>{tr(language, 'Critical Reproductive Stage — avoid water stress', 'مرحلة تكاثر حرجة — تجنب الإجهاد المائي', 'Stade critique — éviter tout stress')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Legend
                verticalAlign="top"
                height={32}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
              />

              {/* VIEW 1: CUMULATIVE TRAJECTORY (Net Irrigation vs. Cumulative ETc) */}
              {viewMode === 'cumulative' && (
                <>
                  {/* Cumulative ETc Area */}
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey={unitMode === 'mm' ? 'cumEtcMm' : 'cumEtcM3'}
                    name={tr(language, 'Cumulative Crop ETc', 'البخر-نتح التراكمي ETc', 'ETc cumulée')}
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#wbEtcGrad)"
                  />

                  {/* Cumulative Net Irrigation Area */}
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey={unitMode === 'mm' ? 'cumNetIrrigationMm' : 'cumNetIrrigationM3'}
                    name={tr(language, 'Cumulative Net Irrigation', 'الري الصافي التراكمي', 'Irrigation nette cumulée')}
                    stroke="#2563eb"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#wbIrrigGrad)"
                  />

                  {/* Cumulative Gross Volume Line */}
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey={unitMode === 'mm' ? 'cumGrossIrrigationMm' : 'cumGrossIrrigationM3'}
                    name={tr(language, 'Cumulative Gross Pumping', 'الضخ الإجمالي التراكمي', 'Pompage brut cumulé')}
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </>
              )}

              {/* VIEW 2: WEEKLY RATES & KC DEMAND */}
              {viewMode === 'weekly_rates' && (
                <>
                  {/* Weekly ETc Bar */}
                  <Bar
                    yAxisId="left"
                    dataKey={unitMode === 'mm' ? 'weeklyEtcMm' : 'weeklyEtcM3'}
                    name={tr(language, 'Weekly ETc Demand', 'الاحتياج الأسبوعي ETc', 'Besoin ETc hebdo')}
                    fill="#10b981"
                    opacity={0.65}
                    radius={[4, 4, 0, 0]}
                  />

                  {/* Weekly Net Irrigation Bar */}
                  <Bar
                    yAxisId="left"
                    dataKey={unitMode === 'mm' ? 'weeklyNetIrrigationMm' : 'weeklyNetIrrigationM3'}
                    name={tr(language, 'Weekly Net Irrigation', 'الري الصافي الأسبوعي', 'Irrigation nette hebdo')}
                    fill="#2563eb"
                    radius={[4, 4, 0, 0]}
                  />

                  {/* Weekly Effective Rain Bar */}
                  <Bar
                    yAxisId="left"
                    dataKey={unitMode === 'mm' ? 'weeklyEffectiveRainMm' : 'weeklyEffectiveRainM3'}
                    name={tr(language, 'Effective Rain', 'المطر الفعال', 'Pluie utile')}
                    fill="#06b6d4"
                    radius={[4, 4, 0, 0]}
                  />

                  {/* Kc Coefficient Overlay */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="kc"
                    name={tr(language, 'Crop Kc', 'معامل المحصول Kc', 'Facteur Kc')}
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#f59e0b' }}
                  />
                </>
              )}

              {/* VIEW 3: WATER BALANCE DELTA */}
              {viewMode === 'balance_delta' && (
                <>
                  <ReferenceLine yAxisId="left" y={0} stroke="#888888" strokeWidth={1.5} />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey={unitMode === 'mm' ? 'cumBalanceMm' : 'cumBalanceMm'}
                    name={tr(language, 'Cumulative Water Balance (Irrig + Rain - ETc)', 'التوازن التراكمي (ري + مطر - ETc)', 'Bilan cumulé (Irrig + Pluie - ETc)')}
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#wbDeltaGrad)"
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="weeklyBalanceMm"
                    name={tr(language, 'Weekly Surplus / Deficit', 'الفائض / العجز الأسبوعي', 'Excédent / Déficit hebdo')}
                    fill="#06b6d4"
                    radius={[4, 4, 0, 0]}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Phenology Stages Legend & Active Stage Highlights */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground font-semibold flex items-center gap-1">
          <Layers className="h-3.5 w-3.5 text-emerald-600" />
          {tr(language, 'Stages:', 'المراحل:', 'Stades :')}
        </span>
        {stagesWithWeeks.map((stage) => (
          <div
            key={stage.name}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 transition-all ${
              activeHoverPoint?.stageName === stage.name
                ? 'border-blue-500 bg-blue-50/80 font-bold dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-xs'
                : 'border-border bg-card text-muted-foreground'
            }`}
          >
            <span>{stage.emoji}</span>
            <span>{stage.name}</span>
            <span className="font-mono text-[10px] text-muted-foreground">(W{stage.startWeek}–W{stage.endWeek})</span>
            {stage.isCritical && (
              <Badge className="h-4 px-1 text-[9px] bg-amber-500/20 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 border-amber-300">
                {tr(language, 'Critical', 'حرجة', 'Critique')}
              </Badge>
            )}
          </div>
        ))}
      </div>

      {/* Strategy Guidance Note & Insights */}
      <div className="mt-4 rounded-xl border border-blue-200/80 bg-blue-50/50 p-3.5 text-xs dark:border-blue-900/60 dark:bg-blue-950/20">
        <div className="flex items-start gap-2.5">
          <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-blue-950 dark:text-blue-200 flex items-center gap-2">
              <span>{strategyInfo.title}</span>
              <Badge variant="outline" className="text-[10px] bg-white dark:bg-slate-900">
                {seasonTotals.coveragePct}% {tr(language, 'Seasonal FAO-56 Satisfaction', 'تغطية الاحتياج الموسمي', 'Satisfaction FAO-56')}
              </Badge>
            </div>
            <p className="leading-5 text-blue-900/80 dark:text-blue-100/80">{strategyInfo.desc}</p>
            <p className="text-[11px] text-muted-foreground">
              {tr(
                language,
                `With ${irrigationSystem.toUpperCase()} irrigation at ${Math.round(efficiency * 100)}% efficiency, gross pumping demand is ${seasonTotals.totalGrossIrrigationM3.toLocaleString()} m³ for ${areaHa} ha, costing approximately ${formatSimulatorDzd(seasonTotals.totalWaterCostDzd)}.`,
                `بنظام الري بال${irrigationSystem} وكفاءة ${Math.round(efficiency * 100)}%، يبلغ حجم الضخ الإجمالي ${seasonTotals.totalGrossIrrigationM3.toLocaleString()} م³ لمساحة ${areaHa} هكتار، بتكلفة تقديرية ${formatSimulatorDzd(seasonTotals.totalWaterCostDzd)}.`,
                `Avec un système ${irrigationSystem} à ${Math.round(efficiency * 100)} % d’efficacité, le volume pompé brut est de ${seasonTotals.totalGrossIrrigationM3.toLocaleString()} m³ pour ${areaHa} ha, pour un coût estimé de ${formatSimulatorDzd(seasonTotals.totalWaterCostDzd)}.`
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
