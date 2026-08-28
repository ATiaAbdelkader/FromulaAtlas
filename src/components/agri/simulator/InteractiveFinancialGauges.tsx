'use client';

import React, { useMemo, useState } from 'react';
import {
  CircleDollarSign,
  TrendingUp,
  TrendingDown,
  Gauge,
  Sliders,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Zap,
  Target,
  Layers,
  ArrowRight,
  RefreshCw,
  Percent,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation, copyFor, type Language } from '@/lib/language-store';
import {
  formatSimulatorDzd,
  formatSimulatorNumber,
  type SimulatorScenario,
  type SimulatorResult,
  type SimulatorCostLineItem,
} from '@/lib/crop-simulator';

interface InteractiveFinancialGaugesProps {
  scenario: SimulatorScenario;
  result: SimulatorResult;
  onUpdateScenario: (patch: Partial<SimulatorScenario>) => void;
  cropName: string;
  cropEmoji: string;
}

function tr(language: Language, english: string, arabic: string, french: string): string {
  return copyFor(language, english, arabic, french);
}

/**
 * Clean SVG Semi-Circle Radial Gauge Dial Component
 */
function SemiCircleGauge({
  value,
  min = -50,
  max = 150,
  label,
  sublabel,
  unit = '%',
  zones,
  formattedValue,
  size = 200,
}: {
  value: number;
  min?: number;
  max?: number;
  label: string;
  sublabel?: string;
  unit?: string;
  zones: Array<{ from: number; to: number; color: string; label?: string }>;
  formattedValue?: string;
  size?: number;
}) {
  const clamped = Math.max(min, Math.min(max, value));
  // Map value to angle between -90 deg (left) and +90 deg (right)
  const ratio = (clamped - min) / (max - min);
  const angleDeg = -90 + ratio * 180;
  const angleRad = (angleDeg * Math.PI) / 180;

  const cx = 100;
  const cy = 100;
  const radius = 75;
  const strokeWidth = 14;

  // Function to create an arc SVG path from angle1 to angle2 (in degrees, from -90 to +90)
  const createArc = (startDeg: number, endDeg: number, r: number) => {
    const sRad = (startDeg * Math.PI) / 180;
    const eRad = (endDeg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(sRad);
    const y1 = cy + r * Math.sin(sRad);
    const x2 = cx + r * Math.cos(eRad);
    const y2 = cy + r * Math.sin(eRad);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // Needle tip coordinates
  const needleLength = radius - 8;
  const nx = cx + needleLength * Math.cos(angleRad);
  const ny = cy + needleLength * Math.sin(angleRad);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size * 0.62 }}>
        <svg viewBox="0 0 200 125" className="w-full h-full overflow-visible">
          {/* Background Track */}
          <path
            d={createArc(-90, 90, radius)}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="text-slate-200 dark:text-slate-800"
          />

          {/* Colored Zone Arcs */}
          {zones.map((zone, idx) => {
            const zMin = Math.max(min, Math.min(max, zone.from));
            const zMax = Math.max(min, Math.min(max, zone.to));
            if (zMin >= zMax) return null;
            const startAngle = -90 + ((zMin - min) / (max - min)) * 180;
            const endAngle = -90 + ((zMax - min) / (max - min)) * 180;
            return (
              <path
                key={idx}
                d={createArc(startAngle, endAngle, radius)}
                fill="none"
                stroke={zone.color}
                strokeWidth={strokeWidth - 2}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            );
          })}

          {/* Center Hub */}
          <circle cx={cx} cy={cy} r="7" className="fill-slate-900 dark:fill-white" />
          <circle cx={cx} cy={cy} r="3.5" className="fill-white dark:fill-slate-900" />

          {/* Needle Indicator */}
          <line
            x1={cx}
            y1={cy}
            x2={nx}
            y2={ny}
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="text-slate-900 dark:text-white transition-all duration-500 ease-out"
          />

          {/* Ticks at 0%, 50%, 100% */}
          <text x="18" y="112" fontSize="9" fontWeight="bold" className="fill-slate-400">
            {min}
            {unit}
          </text>
          <text x="100" y="24" fontSize="9" fontWeight="bold" textAnchor="middle" className="fill-slate-400">
            {Math.round((min + max) / 2)}
            {unit}
          </text>
          <text x="182" y="112" fontSize="9" fontWeight="bold" textAnchor="end" className="fill-slate-400">
            {max}
            {unit}
          </text>
        </svg>

        {/* Readout at bottom center */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {formattedValue || `${formatSimulatorNumber(value, 1)}${unit}`}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</div>
        </div>
      </div>
      {sublabel && <p className="mt-1 text-[11px] text-muted-foreground text-center">{sublabel}</p>}
    </div>
  );
}

export function InteractiveFinancialGauges({
  scenario,
  result,
  onUpdateScenario,
  cropName,
  cropEmoji,
}: InteractiveFinancialGaugesProps) {
  const { language } = useTranslation();

  // Local state for interactive sliders and target ROI simulation
  const [costMultiplier, setCostMultiplier] = useState<number>(100); // 100% base
  const [targetRoiPct, setTargetRoiPct] = useState<number>(30); // Target 30% ROI
  const [activePreset, setActivePreset] = useState<'custom' | 'low_input' | 'standard' | 'high_input'>('standard');

  // Calculate current baseline input-specific costs (seeds, fertilizer, phyto, water, fuel, labor)
  const inputCostSummary = useMemo(() => {
    const totalCost = result.totalCost;
    const totalCostPerHa = result.totalCostPerHa;
    const grossMargin = result.grossMargin;
    const netMargin = result.netMargin;
    const roiPct = result.roiPct;

    // Classification benchmark based on crop & area (DZD/ha)
    // Low: < 120k DZD/ha, Moderate: 120k-250k DZD/ha, High: 250k-450k DZD/ha, Intensive: > 450k DZD/ha
    let costIntensityLabel = tr(language, 'Moderate Cost', 'تكلفة معتدلة', 'Coût Modéré');
    let costIntensityTone = 'emerald';
    if (totalCostPerHa < 140000) {
      costIntensityLabel = tr(language, 'Low / Extensive Cost', 'تكلفة منخفضة / زراعة واسعة', 'Coût Faible / Extensif');
      costIntensityTone = 'blue';
    } else if (totalCostPerHa > 380000) {
      costIntensityLabel = tr(language, 'High / Intensive Cost', 'تكلفة مرتفعة / زراعة مكثفة', 'Coût Élevé / Intensif');
      costIntensityTone = 'amber';
    }

    return {
      totalCost,
      totalCostPerHa,
      grossMargin,
      netMargin,
      roiPct,
      costIntensityLabel,
      costIntensityTone,
    };
  }, [result, language]);

  // Handle direct scale change of all variable input items
  const handleScaleInputCosts = (newMultiplier: number) => {
    setCostMultiplier(newMultiplier);
    setActivePreset('custom');

    const factor = newMultiplier / 100;
    // Scale variable items without scaling land rent or household overhead
    const updatedCosts = scenario.costs.map((c) => {
      if (c.category === 'rent' || c.category === 'household_overhead' || c.isHouseholdOverhead) {
        return c;
      }
      // calculate baseline unscaled amount if not already saved
      const baseAmount = (c as any)._originalAmount ?? c.amount;
      return {
        ...c,
        amount: Math.round(baseAmount * factor),
        _originalAmount: baseAmount,
      };
    });

    onUpdateScenario({ costs: updatedCosts });
  };

  // Quick Preset Strategies
  const applyPresetStrategy = (strategy: 'low_input' | 'standard' | 'high_input') => {
    setActivePreset(strategy);
    if (strategy === 'low_input') {
      handleScaleInputCosts(80); // -20% input reduction
    } else if (strategy === 'standard') {
      handleScaleInputCosts(100); // Baseline 100%
    } else if (strategy === 'high_input') {
      handleScaleInputCosts(125); // +25% Intensive fertilizing/protection
    }
  };

  // Dynamic what-if analysis on target ROI: What price or yield is needed?
  const targetRoiAnalysis = useMemo(() => {
    const totalCost = result.totalCost;
    const requiredNetMargin = (totalCost * targetRoiPct) / 100;
    const requiredRevenue = totalCost + requiredNetMargin;
    const currentYieldT = result.totalYieldT;
    const currentPricePerT = scenario.expectedPricePerT;

    const requiredPricePerT = currentYieldT > 0 ? Math.round(requiredRevenue / currentYieldT) : 0;
    const requiredYieldTPerHa =
      currentPricePerT > 0 ? parseFloat((requiredRevenue / (currentPricePerT * Math.max(0.1, scenario.areaHa))).toFixed(2)) : 0;

    const priceDeltaVsCurrent = requiredPricePerT - currentPricePerT;
    const yieldDeltaVsCurrent = requiredYieldTPerHa - scenario.expectedYieldTPerHa;

    return {
      requiredRevenue,
      requiredPricePerT,
      requiredYieldTPerHa,
      priceDeltaVsCurrent,
      yieldDeltaVsCurrent,
    };
  }, [result.totalCost, result.totalYieldT, targetRoiPct, scenario.expectedPricePerT, scenario.expectedYieldTPerHa, scenario.areaHa]);

  // Sensitivity Matrix points (-20%, -10%, 0%, +10%, +20% cost shifts)
  const sensitivityCurve = useMemo(() => {
    const deltas = [-20, -10, 0, 10, 20];
    return deltas.map((delta) => {
      const simCost = result.totalCost * (1 + delta / 100);
      const simRevenue = result.totalRevenue;
      const simNetMargin = simRevenue - simCost;
      const simRoi = simCost > 0 ? (simNetMargin / simCost) * 100 : 0;
      return {
        delta,
        label: delta === 0 ? '0%' : delta > 0 ? `+${delta}%` : `${delta}%`,
        simCost,
        simNetMargin,
        simRoi: parseFloat(simRoi.toFixed(1)),
        profitable: simNetMargin >= 0,
      };
    });
  }, [result.totalCost, result.totalRevenue]);

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      {/* Title Header with Badges */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-xs">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                {tr(language, 'Visual Decision Engine', 'محرك القرار البصري', 'Moteur de Décision Visuel')}
              </span>
              <Badge variant="outline" className="text-[10px] font-semibold border-emerald-300 text-emerald-700">
                {cropEmoji} {cropName} ({formatSimulatorNumber(scenario.areaHa, 1)} ha)
              </Badge>
            </div>
            <h3 className="text-base font-bold text-foreground">
              {tr(
                language,
                'Input Cost Dial vs Estimated ROI Dashboard',
                'مؤشرات تكاليف المدخلات والعائد على الاستثمار التفاعلية',
                'Cadrans Interactifs : Coût des Intrants vs ROI Estimé'
              )}
            </h3>
          </div>
        </div>

        {/* Quick Strategy Presets */}
        <div className="inline-flex rounded-xl border border-border bg-muted/60 p-1 text-xs">
          <button
            type="button"
            onClick={() => applyPresetStrategy('low_input')}
            className={`rounded-lg px-2.5 py-1.5 font-semibold transition-all ${
              activePreset === 'low_input'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tr(language, '🌱 Eco / Low-Cost (-20%)', '🌱 اقتصادي / قليل المدخلات (-٢٠٪)', '🌱 Éco / Bas intrants (-20%)')}
          </button>
          <button
            type="button"
            onClick={() => applyPresetStrategy('standard')}
            className={`rounded-lg px-2.5 py-1.5 font-semibold transition-all ${
              activePreset === 'standard'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tr(language, '⚖️ Baseline (100%)', '⚖️ الأساسي (١٠٠٪)', '⚖️ Référence (100%)')}
          </button>
          <button
            type="button"
            onClick={() => applyPresetStrategy('high_input')}
            className={`rounded-lg px-2.5 py-1.5 font-semibold transition-all ${
              activePreset === 'high_input'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tr(language, '🚀 Intensive (+25%)', '🚀 مكثف عالي الأداء (+٢٥٪)', '🚀 Intensif (+25%)')}
          </button>
        </div>
      </div>

      {/* DUAL GAUGES CONTAINER: Input Cost vs Estimated ROI */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* GAUGE 1: EXPECTED INPUT COST DIAL */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-muted/20 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                <CircleDollarSign className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {tr(language, 'Expected Input & Field Cost', 'تكلفة المدخلات المتوقعة للحقل', 'Coût des Intrants & Parcelle')}
                </h4>
                <div className="text-sm font-bold text-foreground">
                  {formatSimulatorDzd(result.totalCost)}
                </div>
              </div>
            </div>
            <Badge
              className={
                inputCostSummary.costIntensityTone === 'amber'
                  ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                  : inputCostSummary.costIntensityTone === 'blue'
                  ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
              }
            >
              {inputCostSummary.costIntensityLabel}
            </Badge>
          </div>

          {/* Radial Cost Dial */}
          <div className="my-3">
            <SemiCircleGauge
              value={Math.round(result.totalCostPerHa / 1000)}
              min={50}
              max={600}
              label={tr(language, 'Cost Intensity (k DZD/ha)', 'كثافة التكلفة (ألف دج/هكتار)', 'Intensité Coût (k DZD/ha)')}
              formattedValue={`${formatSimulatorNumber(result.totalCostPerHa / 1000, 0)} k DZD/ha`}
              sublabel={`${formatSimulatorDzd(result.totalCost)} ${tr(language, 'total field budget', 'إجمالي ميزانية الحقل', 'budget total parcelle')}`}
              zones={[
                { from: 50, to: 180, color: '#3b82f6', label: 'Low' },
                { from: 180, to: 350, color: '#10b981', label: 'Standard' },
                { from: 350, to: 480, color: '#f59e0b', label: 'High' },
                { from: 480, to: 600, color: '#ef4444', label: 'Intensive' },
              ]}
              size={220}
            />
          </div>

          {/* Interactive Cost Multiplier Slider */}
          <div className="mt-2 space-y-2 rounded-xl bg-card p-3 border border-border">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-emerald-600" />
                {tr(language, 'Input Cost Scaling Multiplier', 'مقياس تعديل تكاليف المدخلات', 'Curseur de variation des coûts')}
              </span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {costMultiplier}% ({costMultiplier >= 100 ? `+${costMultiplier - 100}%` : `${costMultiplier - 100}%`})
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="160"
              step="5"
              value={costMultiplier}
              onChange={(e) => handleScaleInputCosts(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg dark:bg-slate-700"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>50% ({tr(language, 'Minimal', 'حد أدنى', 'Minimal')})</span>
              <span>100% ({tr(language, 'Baseline', 'المرجع', 'Référence')})</span>
              <span>160% ({tr(language, 'Intensive', 'مكثف', 'Intensif')})</span>
            </div>
          </div>
        </div>

        {/* GAUGE 2: ESTIMATED ROI & PROFITABILITY DIAL */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-muted/20 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <TrendingUp className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {tr(language, 'Estimated Return on Investment (ROI)', 'العائد التقديري على الاستثمار (ROI)', 'Retour sur Investissement Estimé (ROI)')}
                </h4>
                <div className="text-sm font-bold text-foreground">
                  {formatSimulatorDzd(result.netMargin)} {tr(language, 'net profit', 'صافي ربح', 'bénéfice net')}
                </div>
              </div>
            </div>
            <Badge
              className={
                result.roiPct >= 35
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                  : result.roiPct >= 0
                  ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
              }
            >
              {result.roiPct >= 0
                ? tr(language, 'Profitable', 'مشروع رابح', 'Rentable')
                : tr(language, 'Deficit / Loss', 'عجز / غير مربح', 'Déficitaire')}
            </Badge>
          </div>

          {/* Radial ROI Speedometer */}
          <div className="my-3">
            <SemiCircleGauge
              value={Math.round(result.roiPct)}
              min={-40}
              max={120}
              label={tr(language, 'Estimated ROI (%)', 'نسبة العائد على التكلفة (ROI)', 'ROI Estimé (%)')}
              unit="%"
              formattedValue={`${formatSimulatorNumber(result.roiPct, 1)}%`}
              sublabel={`${tr(language, 'Net Margin:', 'الهامش الصافي:', 'Marge nette :')} ${formatSimulatorDzd(result.netMargin)} (${formatSimulatorNumber(result.marginPct, 1)}% ${tr(language, 'of sales', 'من المبيعات', 'du CA')})`}
              zones={[
                { from: -40, to: 0, color: '#ef4444', label: 'Loss' },
                { from: 0, to: 20, color: '#f59e0b', label: 'Low' },
                { from: 20, to: 60, color: '#10b981', label: 'Good' },
                { from: 60, to: 120, color: '#06b6d4', label: 'Excellent' },
              ]}
              size={220}
            />
          </div>

          {/* Interactive Target ROI Stress Slider */}
          <div className="mt-2 space-y-2 rounded-xl bg-card p-3 border border-border">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-indigo-600" />
                {tr(language, 'Target ROI Goal Simulation', 'محاكاة هدف العائد المطلوب', 'Objectif ROI Cible')}
              </span>
              <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400">
                {targetRoiPct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              step="5"
              value={targetRoiPct}
              onChange={(e) => setTargetRoiPct(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg dark:bg-slate-700"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0% ({tr(language, 'Break-even', 'التعادل', 'Seuil')})</span>
              <span>30% ({tr(language, 'Standard', 'المعيار', 'Standard')})</span>
              <span>80% ({tr(language, 'High Ambition', 'طموح مرتفع', 'Haut rendement')})</span>
            </div>
          </div>
        </div>
      </div>

      {/* SENSITIVITY FEEDBACK BAR & TARGET GOAL READOUT */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Sensitivity Matrix Card */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-600" />
              <h4 className="text-xs font-bold text-foreground">
                {tr(
                  language,
                  'Input Cost Sensitivity vs ROI Elasticity',
                  'حساسية تغير تكاليف المدخلات على العائد',
                  'Sensibilité du Coût des Intrants sur le ROI'
                )}
              </h4>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {tr(language, '±20% Cost Shifts', 'تغيرات ±٢٠٪ في التكلفة', 'Variations ±20%')}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 text-center">
            {sensitivityCurve.map((point) => (
              <div
                key={point.delta}
                className={`rounded-lg p-2 text-xs border transition-all ${
                  point.delta === 0
                    ? 'border-emerald-400 bg-emerald-50/80 font-bold dark:bg-emerald-950/40 dark:border-emerald-700'
                    : 'border-border bg-muted/40'
                }`}
              >
                <div className="text-[10px] font-semibold text-muted-foreground">{point.label} Coûts</div>
                <div className={`mt-1 font-mono font-bold ${point.simRoi >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'}`}>
                  {point.simRoi}%
                </div>
                <div className="mt-0.5 text-[9px] text-muted-foreground line-clamp-1">
                  {formatSimulatorDzd(point.simNetMargin)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Goal Achievement Readout */}
        <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 to-teal-50/70 p-4 dark:border-indigo-900/60 dark:from-indigo-950/20 dark:to-teal-950/20 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-700 dark:text-indigo-400" />
              <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                {tr(
                  language,
                  `To Reach Target ROI of ${targetRoiPct}%:`,
                  `لبلوغ هدف عائد ${targetRoiPct}٪:`,
                  `Pour Atteindre un ROI Cible de ${targetRoiPct}% :`
                )}
              </h4>
            </div>
            <Badge variant="outline" className="border-indigo-300 text-indigo-800 dark:text-indigo-300">
              {targetRoiAnalysis.priceDeltaVsCurrent <= 0
                ? tr(language, 'Already Met', 'متحقق حالياً', 'Objectif Déjà Atteint')
                : tr(language, 'Requires Adjustment', 'يتطلب تعديل السعر/المردود', 'Ajustement Requis')}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-white/80 p-2.5 dark:bg-slate-900/80 border border-indigo-100 dark:border-indigo-900">
              <span className="text-[10px] text-muted-foreground block">
                {tr(language, 'Needed Selling Price', 'سعر البيع المطلوب', 'Prix de Vente Nécessaire')}
              </span>
              <strong className="text-sm font-black text-indigo-900 dark:text-indigo-200">
                {formatSimulatorDzd(targetRoiAnalysis.requiredPricePerT)}/t
              </strong>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                {targetRoiAnalysis.priceDeltaVsCurrent > 0
                  ? `+${formatSimulatorDzd(targetRoiAnalysis.priceDeltaVsCurrent)}/t vs actuel`
                  : `${formatSimulatorDzd(targetRoiAnalysis.priceDeltaVsCurrent)}/t (marge de sécurité)`}
              </span>
            </div>

            <div className="rounded-lg bg-white/80 p-2.5 dark:bg-slate-900/80 border border-indigo-100 dark:border-indigo-900">
              <span className="text-[10px] text-muted-foreground block">
                {tr(language, 'Needed Harvest Yield', 'المردود المطلوب', 'Rendement Requis')}
              </span>
              <strong className="text-sm font-black text-emerald-900 dark:text-emerald-200">
                {targetRoiAnalysis.requiredYieldTPerHa} t/ha
              </strong>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                {targetRoiAnalysis.yieldDeltaVsCurrent > 0
                  ? `+${formatSimulatorNumber(targetRoiAnalysis.yieldDeltaVsCurrent, 2)} t/ha vs prévu`
                  : `${formatSimulatorNumber(targetRoiAnalysis.yieldDeltaVsCurrent, 2)} t/ha (sécurité)`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
