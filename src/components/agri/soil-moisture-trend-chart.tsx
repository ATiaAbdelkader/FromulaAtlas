'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import {
  Droplets,
  CloudRain,
  Sun,
  TrendingDown,
  TrendingUp,
  Minus,
  RefreshCw,
  Info,
  Layers,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getSoilMoistureAndEt0Trend,
  SoilMoistureTrendResult,
  SoilMoistureEt0DailyPoint,
} from '@/lib/open-meteo';
import { UserLevel } from '@/lib/user-level';

interface SoilMoistureTrendChartProps {
  lat?: number;
  lng?: number;
  language?: 'en' | 'fr' | 'ar';
  level?: UserLevel;
  onNavigate?: (tab: string) => void;
  className?: string;
}

function copyFor(
  lang: 'en' | 'fr' | 'ar' | undefined,
  en: string,
  fr: string,
  ar: string
): string {
  if (lang === 'fr') return fr;
  if (lang === 'ar') return ar;
  return en;
}

/**
 * Custom SVG Interactive Vertical Crosshair cursor.
 * Follows mouse movement and renders a crisp dashed crosshair spanning top-to-bottom.
 */
function VerticalCrosshairCursor(props: any) {
  const { points, height = 240, top = 12 } = props;
  const x = points && points[0] ? points[0].x : props.x;
  if (x === undefined || Number.isNaN(x)) return null;

  return (
    <g className="recharts-custom-crosshair pointer-events-none">
      {/* Ambient background column glow */}
      <rect
        x={x - 14}
        y={top}
        width={28}
        height={height}
        fill="currentColor"
        className="text-cyan-500/5 dark:text-cyan-400/10"
        rx={6}
      />
      {/* High-visibility dashed vertical line */}
      <line
        x1={x}
        y1={top}
        x2={x}
        y2={top + height}
        stroke="#06b6d4"
        strokeWidth={1.5}
        strokeDasharray="4 3"
        opacity={0.9}
      />
      {/* Top alignment node */}
      <circle cx={x} cy={top + 2} r={3} fill="#06b6d4" stroke="#ffffff" strokeWidth={1} />
      {/* Bottom alignment node */}
      <circle cx={x} cy={top + height - 2} r={3} fill="#06b6d4" stroke="#ffffff" strokeWidth={1} />
    </g>
  );
}

export function SoilMoistureTrendChart({
  lat = 36.75,
  lng = 3.05,
  language = 'en',
  level = 'farmer',
  onNavigate,
  className = '',
}: SoilMoistureTrendChartProps) {
  const gradientId = useId();
  const [data, setData] = useState<SoilMoistureTrendResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'dual' | 'balance' | 'depths'>('dual');
  const [rangeMode, setRangeMode] = useState<'7d3f' | '7d' | '14d'>('7d3f');
  const [selectedPoint, setSelectedPoint] = useState<SoilMoistureEt0DailyPoint | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pastDays = rangeMode === '14d' ? 14 : 7;
      const forecastDays = rangeMode === '7d3f' ? 4 : 1; // 4 includes today + 3 forecast days
      const result = await getSoilMoistureAndEt0Trend(lat, lng, {
        pastDays,
        forecastDays,
      });
      setData(result);
      if (result.points.length > 0) {
        // Default to today point or last point
        const todayOrLast = result.points.find((p) => p.isToday) || result.points[result.points.length - 1];
        setSelectedPoint(todayOrLast);
      }
    } catch (err: any) {
      console.error('Failed to load soil moisture & ET0 trend:', err);
      setError(err?.message || 'Failed to fetch Open-Meteo soil data');
    } finally {
      setLoading(false);
    }
  }, [lat, lng, rangeMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isRtl = language === 'ar';
  const todayPoint = data?.points.find((p) => p.isToday);

  return (
    <div
      id="soil-moisture-et0-trend-card"
      className={`rounded-xl border bg-card p-4 sm:p-5 shadow-xs transition-all ${className}`}
    >
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Droplets className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              {copyFor(
                language,
                '7-Day Soil Moisture & ET₀ Trend + 3-Day Forecast',
                'Tendance Humidité du Sol (7J) & Prévision 3 Jours',
                'مؤشر رطوبة التربة لـ 7 أيام + توقعات 3 أيام'
              )}
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono font-medium">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              FAO-56 Model
            </span>
          </div>
          <p className="text-xs text-muted-foreground max-w-2xl">
            {copyFor(
              language,
              'Root-zone volumetric water content (%) correlated with atmospheric crop water demand (ET₀ mm/day) and 3-day predictive depletion forecast.',
              'Teneur en eau racinaire (%) corrélée à la demande en eau (ET₀ mm/j) et prévision d’épuisement hydrique à 3 jours.',
              'رطوبة الجذور (%) مقترنة بالطلب المائي للغلاف الجوي (ET₀) ونموذج التنبؤ بالاستنزاف المائي لـ 3 أيام قادمة.'
            )}
          </p>
        </div>

        {/* Action controls & View selectors */}
        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
          {/* Time range switcher */}
          <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setRangeMode('7d3f')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                rangeMode === '7d3f'
                  ? 'bg-background text-foreground shadow-xs font-semibold text-indigo-600 dark:text-indigo-400'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {copyFor(language, '7d + 3d Forecast', '7j + Prév. 3j', '٧ي + توقع ٣ي')}
            </button>
            <button
              type="button"
              onClick={() => setRangeMode('7d')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                rangeMode === '7d'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {copyFor(language, '7 Days History', '7 Jours Historique', '٧ أيام سابقة')}
            </button>
            <button
              type="button"
              onClick={() => setRangeMode('14d')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                rangeMode === '14d'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {copyFor(language, '14 Days History', '14 Jours', '١٤ يوماً')}
            </button>
          </div>

          {/* Refresh button */}
          <Button
            size="sm"
            variant="outline"
            onClick={fetchData}
            disabled={loading}
            className="h-7 w-7 p-0"
            title={copyFor(language, 'Refresh trend data', 'Actualiser les données', 'تحديث البيانات')}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && !data && (
        <div className="space-y-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-amber-700 dark:text-amber-400 gap-2">
          <AlertTriangle className="h-6 w-6" />
          <p>
            {copyFor(
              language,
              `Unable to load soil moisture trend: ${error}`,
              `Impossible de charger l'historique d'humidité du sol : ${error}`,
              `تعذر تحميل مؤشر رطوبة التربة: ${error}`
            )}
          </p>
          <Button size="sm" variant="outline" onClick={fetchData} className="h-7 text-xs mt-2">
            {copyFor(language, 'Retry Open-Meteo', 'Réessayer', 'إعادة المحاولة')}
          </Button>
        </div>
      )}

      {/* Main Content Area */}
      {!error && data && (
        <div className="space-y-4 pt-3">
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* 1. Root Zone Current Moisture */}
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg border bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                  <Droplets className="h-3.5 w-3.5" />
                  {copyFor(language, 'Current Root Moisture', 'Humidité Racinaire Actuelle', 'رطوبة الجذور الحالية')}
                </span>
                <span className="text-[10px] font-mono opacity-80">9–27 cm</span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                  {data.summary.currentRootMoisture.toFixed(1)}%
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase tracking-wider ${
                    data.summary.currentRootMoisture >= 25
                      ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200'
                      : data.summary.currentRootMoisture >= 18
                      ? 'bg-amber-500/20 text-amber-800 dark:text-amber-200'
                      : 'bg-rose-500/20 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  {data.summary.currentRootMoisture >= 25
                    ? copyFor(language, 'Optimal', 'Optimale', 'مثالية')
                    : data.summary.currentRootMoisture >= 18
                    ? copyFor(language, 'Adequate', 'Adéquate', 'مقبولة')
                    : copyFor(language, 'Deficit', 'Déficit', 'عجز')}
                </span>
              </div>
            </motion.div>

            {/* 2. 3-Day Forecast Moisture & Projected Depletion */}
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="p-3 rounded-lg border bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/20 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  {copyFor(language, '3-Day Forecast Moisture', 'Prévision à 3 Jours', 'توقع الرطوبة بعد ٣ أيام')}
                </span>
                <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">+3 Days</span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono text-indigo-700 dark:text-indigo-300">
                  {data.summary.forecast3DayMoisture.toFixed(1)}%
                </span>
                <span
                  className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                    data.summary.forecast3DayDelta >= 0
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                  }`}
                >
                  {data.summary.forecast3DayDelta >= 0 ? '+' : ''}
                  {data.summary.forecast3DayDelta}%
                </span>
              </div>
            </motion.div>

            {/* 3. Total ET0 Atmospheric Demand */}
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-3 rounded-lg border bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                  <Sun className="h-3.5 w-3.5" />
                  {copyFor(language, 'Cumulative ET₀ Demand', 'Demande ET₀ Cumulée', 'الطلب التراكمي ET₀')}
                </span>
                <span className="text-[10px] font-mono opacity-80">FAO-56</span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono text-amber-700 dark:text-amber-300">
                  {data.summary.totalEt0.toFixed(1)} <span className="text-xs font-normal">mm</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  ~{(data.summary.totalEt0 / data.points.length).toFixed(1)} mm/d
                </span>
              </div>
            </motion.div>

            {/* 4. Net Hydrologic Balance & Recommendation */}
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="p-3 rounded-lg border bg-muted/40 border-border flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5 text-foreground font-medium">
                  {data.summary.netBalance >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                  )}
                  {copyFor(language, 'Net Balance (P − ET₀)', 'Bilan Net (P − ET₀)', 'صافي الميزان المائي')}
                </span>
                <span className="text-[10px] font-mono opacity-80">
                  {data.summary.totalRain.toFixed(0)}mm rain
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span
                  className={`text-xl font-bold font-mono ${
                    data.summary.netBalance >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {data.summary.netBalance > 0 ? `+${data.summary.netBalance}` : data.summary.netBalance} <span className="text-xs font-normal">mm</span>
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase ${
                    data.summary.recommendedAction === 'irrigate'
                      ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                      : data.summary.recommendedAction === 'hold_drainage'
                      ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                      : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {data.summary.recommendedAction === 'irrigate'
                    ? copyFor(language, 'Irrigate', 'Irriguer', 'ري مطلوب')
                    : data.summary.recommendedAction === 'hold_drainage'
                    ? copyFor(language, 'Drainage', 'Drainage', 'صرف مائي')
                    : copyFor(language, 'Stable', 'Stable', 'مستقر')}
                </span>
              </div>
            </motion.div>
          </div>

          {/* View Mode Tabs & Series Legend */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('dual')}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                  viewMode === 'dual'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {copyFor(language, 'Moisture & ET₀ (Dual Axis)', 'Humidité & ET₀ (Double Axe)', 'الرطوبة والتبخر (محورين)')}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('balance')}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                  viewMode === 'balance'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {copyFor(language, 'Hydrologic Balance (Rain vs ET₀)', 'Bilan Hydrique (Pluie vs ET₀)', 'الميزان المائي (مطر vs تبخر)')}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('depths')}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                  viewMode === 'depths'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {copyFor(language, 'Multi-Depth Soil Profile', 'Profil Multi-Profondeurs', 'أعماق التربة المتعددة')}
              </button>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                <span>{copyFor(language, 'Historical Measured (9-27cm)', 'Mesuré Historique', 'المقاس تاريخياً')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 rounded-xs bg-indigo-500 inline-block border-b border-indigo-400" />
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                  {copyFor(language, '3-Day Forecast (FAO-56)', 'Prévision 3 Jours', 'توقع ٣ أيام')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
                <span>{copyFor(language, 'ET₀ Demand', 'Demande ET₀', 'الطلب ET₀')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-cyan-500 inline-block" />
                <span>{copyFor(language, 'Rain (mm)', 'Pluie (mm)', 'المطر (مم)')}</span>
              </div>
            </div>
          </div>

          {/* Recharts Interactive Visualizer with entry animations and forecast series */}
          <motion.div
            key={`chart-container-${viewMode}-${rangeMode}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-72 sm:h-80 pt-2 relative"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data.points}
                margin={{ top: 14, right: 12, bottom: 0, left: 0 }}
                onMouseMove={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    setSelectedPoint(e.activePayload[0].payload);
                  }
                }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    setSelectedPoint(e.activePayload[0].payload);
                  }
                }}
              >
                <defs>
                  <linearGradient id={`smGradient-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id={`foreGradient-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id={`rainGradient-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.18} />

                {/* XAxis */}
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => {
                    const d = new Date(val + 'T12:00:00Z');
                    return d.toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-DZ' : 'en-US', {
                      weekday: 'short',
                      day: 'numeric',
                    });
                  }}
                  tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.7 }}
                  axisLine={{ stroke: 'currentColor', opacity: 0.15 }}
                  tickLine={false}
                />

                {/* Left YAxis: Soil Moisture % (0 - 45%) */}
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  domain={[0, 45]}
                  tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.7 }}
                  axisLine={{ stroke: 'currentColor', opacity: 0.15 }}
                  tickLine={false}
                  unit="%"
                  width={38}
                />

                {/* Right YAxis: ET0 & Rain (mm) */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, (dataMax: number) => Math.max(10, Math.ceil(dataMax * 1.2))]}
                  tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.7 }}
                  axisLine={{ stroke: 'currentColor', opacity: 0.15 }}
                  tickLine={false}
                  unit=" mm"
                  width={42}
                />

                {/* Reference Area for Optimal Moisture (24% - 34%) */}
                <ReferenceArea
                  yAxisId="left"
                  y1={24}
                  y2={34}
                  fill="#10b981"
                  fillOpacity={0.06}
                  strokeOpacity={0}
                />

                {/* Critical Stress Threshold Line (18%) */}
                <ReferenceLine
                  yAxisId="left"
                  y={18}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.2}
                  label={{
                    value: copyFor(language, 'Stress threshold (18%)', 'Seuil de stress (18%)', 'عتبة الإجهاد (18%)'),
                    position: 'insideBottomLeft',
                    fill: '#ef4444',
                    fontSize: 10,
                  }}
                />

                {/* Reference marker for Today bridging into 3-Day Forecast */}
                {todayPoint && (
                  <ReferenceLine
                    yAxisId="left"
                    x={todayPoint.date}
                    stroke="#8b5cf6"
                    strokeDasharray="3 3"
                    strokeWidth={1.2}
                    strokeOpacity={0.7}
                    label={{
                      value: copyFor(language, 'Today ⮞ 3d Forecast', 'Aujourd’hui ⮞ Prév. 3j', 'اليوم ⮞ توقع ٣ أيام'),
                      position: 'top',
                      fill: '#8b5cf6',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                )}

                {/* Interactive Vertical Crosshair Tooltip */}
                <Tooltip
                  cursor={<VerticalCrosshairCursor />}
                  isAnimationActive={true}
                  animationDuration={150}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const pt = payload[0].payload as SoilMoistureEt0DailyPoint;
                    const dateFormatted = new Date(pt.date + 'T12:00:00Z').toLocaleDateString(
                      language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-DZ' : 'en-US',
                      { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }
                    );

                    return (
                      <div className="rounded-lg border bg-popover/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-2.5 min-w-[250px]">
                        <div className="flex items-center justify-between border-b pb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-3.5 rounded-xs ${
                                pt.isForecast ? 'bg-indigo-500' : 'bg-emerald-500'
                              }`}
                            />
                            <span className="font-semibold text-popover-foreground">{dateFormatted}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {pt.isToday && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[9px] font-bold">
                                {copyFor(language, 'TODAY', 'AUJOURD’HUI', 'اليوم')}
                              </span>
                            )}
                            {pt.isForecast && (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono text-[9px] font-bold flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                {copyFor(language, '3D FORECAST', 'PRÉVISION 3J', 'توقع ٣ أيام')}
                              </span>
                            )}
                            {!pt.isToday && !pt.isForecast && (
                              <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[9px]">
                                {copyFor(language, 'ERA5 MEASURED', 'ERA5 MESURÉ', 'مقاس ERA5')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Multi-Series Values at Cursor Position */}
                        <div className="space-y-1.5 font-mono text-[11px]">
                          {/* Soil Moisture Section */}
                          <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider font-sans pt-0.5">
                            {copyFor(language, 'Soil Moisture Profile', 'Profil Humidité du Sol', 'مؤشرات رطوبة التربة')}
                          </div>

                          {/* Historical or Forecast Root Zone */}
                          {pt.isForecast ? (
                            <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-1 rounded border border-indigo-500/20">
                              <span className="font-sans font-medium flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
                                {copyFor(language, '3-Day Forecast Root Zone:', 'Prévision Racinaire :', 'توقع الجذور:')}
                              </span>
                              <span className="font-bold text-xs">{pt.soilMoistureForecast}%</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded">
                              <span className="font-sans text-muted-foreground flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                                {copyFor(language, 'Root Zone (9-27cm):', 'Zone Racinaire :', 'رطوبة الجذور:')}
                              </span>
                              <span className="font-bold">{pt.soilMoistureRootZone}%</span>
                            </div>
                          )}

                          {pt.soilMoistureForecastUpper && pt.soilMoistureForecastLower && (
                            <div className="flex items-center justify-between text-[10px] text-indigo-600/80 dark:text-indigo-400/80 px-1.5">
                              <span className="font-sans">{copyFor(language, 'Confidence Range:', 'Fourchette :', 'نطاق الثقة:')}</span>
                              <span>{pt.soilMoistureForecastLower}% – {pt.soilMoistureForecastUpper}%</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-teal-600 dark:text-teal-400 px-1.5 py-0.5">
                            <span className="font-sans text-muted-foreground flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                              {copyFor(language, 'Topsoil (0-9cm):', 'Surface (0-9cm) :', 'السطح (0-9سم):')}
                            </span>
                            <span>{pt.soilMoistureSurface}%</span>
                          </div>

                          <div className="flex items-center justify-between text-muted-foreground px-1.5 py-0.5">
                            <span className="font-sans text-muted-foreground flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                              {copyFor(language, 'Subsoil (27-81cm):', 'Profondeur (27-81cm) :', 'العمق (27-81سم):')}
                            </span>
                            <span>{pt.soilMoistureDeep}%</span>
                          </div>

                          {/* Atmospheric & Hydrologic Section */}
                          <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider font-sans pt-1 border-t">
                            {copyFor(language, 'Atmosphere & Balance', 'Atmosphère & Bilan', 'الجو والميزان')}
                          </div>

                          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 px-1.5 py-0.5">
                            <span className="font-sans text-muted-foreground flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                              {copyFor(language, 'Evapotranspiration ET₀:', 'Évapotranspiration :', 'التبخر ET₀:')}
                            </span>
                            <span className="font-bold">{pt.et0} mm</span>
                          </div>

                          <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-400 px-1.5 py-0.5">
                            <span className="font-sans text-muted-foreground flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0" />
                              {copyFor(language, 'Rainfall (P):', 'Précipitations (P) :', 'الأمطار (P):')}
                            </span>
                            <span className="font-bold">{pt.precipitation} mm</span>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t px-1.5 py-0.5 bg-muted/30 rounded">
                            <span className="font-sans text-muted-foreground">
                              {copyFor(language, 'Daily Balance (P − ET₀):', 'Bilan Journalier :', 'صافي اليوم:')}
                            </span>
                            <span
                              className={`font-bold ${
                                pt.netWaterBalance >= 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {pt.netWaterBalance > 0 ? `+${pt.netWaterBalance}` : pt.netWaterBalance} mm
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />

                {/* View Mode 1: Dual Axis (Default) */}
                {viewMode === 'dual' && (
                  <>
                    {/* Rain as light blue bars with entrance animation */}
                    <Bar
                      yAxisId="right"
                      dataKey="precipitation"
                      name={copyFor(language, 'Rain (mm)', 'Pluie (mm)', 'المطر')}
                      fill="#06b6d4"
                      opacity={0.7}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={22}
                      isAnimationActive={true}
                      animationBegin={100}
                      animationDuration={1100}
                      animationEasing="ease-out"
                    />

                    {/* Historical Measured Root Zone Moisture Area */}
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="soilMoistureHistorical"
                      name={copyFor(language, 'Historical Root Moisture (%)', 'Humidité Racinaire Historique (%)', 'رطوبة الجذور المقاسة')}
                      stroke="#10b981"
                      strokeWidth={2.6}
                      fill={`url(#smGradient-${gradientId})`}
                      dot={{ r: 3.5, fill: '#10b981', strokeWidth: 1.5, stroke: '#ffffff' }}
                      activeDot={{ r: 6.5, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2.5 }}
                      isAnimationActive={true}
                      animationBegin={250}
                      animationDuration={1300}
                      animationEasing="ease-out"
                      connectNulls={false}
                    />

                    {/* 3-Day Forecast Soil Moisture Series (Dashed Indigo with glowing nodes) */}
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="soilMoistureForecast"
                      name={copyFor(language, '3-Day Forecast Moisture (%)', 'Prévision Humidité 3j (%)', 'توقع رطوبة التربة')}
                      stroke="#8b5cf6"
                      strokeWidth={2.8}
                      strokeDasharray="5 4"
                      dot={{ r: 4.5, fill: '#8b5cf6', strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 7, fill: '#8b5cf6', stroke: '#ffffff', strokeWidth: 2.5 }}
                      isAnimationActive={true}
                      animationBegin={500}
                      animationDuration={1400}
                      animationEasing="ease-out"
                      connectNulls={false}
                    />

                    {/* ET0 Line with staggered entrance animation */}
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="et0"
                      name={copyFor(language, 'ET₀ (mm/d)', 'ET₀ (mm/j)', 'التبخر')}
                      stroke="#f59e0b"
                      strokeWidth={2.2}
                      strokeDasharray="4 2"
                      dot={{ r: 3.5, fill: '#f59e0b', strokeWidth: 1, stroke: '#ffffff' }}
                      activeDot={{ r: 6, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                      isAnimationActive={true}
                      animationBegin={650}
                      animationDuration={1400}
                      animationEasing="ease-out"
                    />
                  </>
                )}

                {/* View Mode 2: Hydrologic Water Balance */}
                {viewMode === 'balance' && (
                  <>
                    <Bar
                      yAxisId="right"
                      dataKey="precipitation"
                      name={copyFor(language, 'Rainfall Inflow (mm)', 'Pluie Entrante (mm)', 'الأمطار')}
                      fill="#06b6d4"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={26}
                      isAnimationActive={true}
                      animationBegin={100}
                      animationDuration={1100}
                      animationEasing="ease-out"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="et0"
                      name={copyFor(language, 'ET₀ Outflow (mm)', 'Perte ET₀ (mm)', 'فقد التبخر')}
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 1.5 }}
                      isAnimationActive={true}
                      animationBegin={350}
                      animationDuration={1400}
                      animationEasing="ease-out"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="soilMoistureHistorical"
                      name={copyFor(language, 'Measured Moisture (%)', 'Humidité Mesurée (%)', 'الرطوبة المقاسة')}
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#10b981', stroke: '#ffffff', strokeWidth: 1.5 }}
                      isAnimationActive={true}
                      animationBegin={500}
                      animationDuration={1400}
                      animationEasing="ease-out"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="soilMoistureForecast"
                      name={copyFor(language, '3-Day Forecast Moisture (%)', 'Prévision Humidité (%)', 'توقع الرطوبة')}
                      stroke="#8b5cf6"
                      strokeWidth={2.8}
                      strokeDasharray="5 4"
                      dot={{ r: 4, fill: '#8b5cf6', stroke: '#ffffff', strokeWidth: 1.5 }}
                      isAnimationActive={true}
                      animationBegin={650}
                      animationDuration={1400}
                      animationEasing="ease-out"
                    />
                  </>
                )}

                {/* View Mode 3: Multi-depth profile */}
                {viewMode === 'depths' && (
                  <>
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="soilMoistureSurface"
                      name={copyFor(language, 'Surface (0-9cm)', 'Surface (0-9cm)', 'السطح')}
                      stroke="#06b6d4"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#06b6d4', stroke: '#ffffff', strokeWidth: 1 }}
                      isAnimationActive={true}
                      animationBegin={150}
                      animationDuration={1300}
                      animationEasing="ease-out"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="soilMoistureHistorical"
                      name={copyFor(language, 'Root Zone (9-27cm)', 'Zone Racinaire (9-27cm)', 'الجذور')}
                      stroke="#10b981"
                      strokeWidth={2.8}
                      dot={{ r: 4, fill: '#10b981', stroke: '#ffffff', strokeWidth: 1.5 }}
                      isAnimationActive={true}
                      animationBegin={350}
                      animationDuration={1400}
                      animationEasing="ease-out"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="soilMoistureForecast"
                      name={copyFor(language, '3-Day Forecast Root Zone', 'Prévision Racinaire 3j', 'توقع الجذور ٣ أيام')}
                      stroke="#8b5cf6"
                      strokeWidth={2.8}
                      strokeDasharray="5 4"
                      dot={{ r: 4.5, fill: '#8b5cf6', stroke: '#ffffff', strokeWidth: 1.5 }}
                      isAnimationActive={true}
                      animationBegin={500}
                      animationDuration={1400}
                      animationEasing="ease-out"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="soilMoistureDeep"
                      name={copyFor(language, 'Deep (27-81cm)', 'Profondeur (27-81cm)', 'العميق')}
                      stroke="#6366f1"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      dot={{ r: 3, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 1 }}
                      isAnimationActive={true}
                      animationBegin={650}
                      animationDuration={1400}
                      animationEasing="ease-out"
                    />
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Interactive Inspection Card / Agronomic Takeaway */}
          {selectedPoint && (
            <div className="rounded-lg border bg-muted/20 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">
                    {new Date(selectedPoint.date + 'T12:00:00Z').toLocaleDateString(
                      language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-DZ' : 'en-US',
                      { weekday: 'long', month: 'short', day: 'numeric' }
                    )}
                  </span>
                  {selectedPoint.isForecast ? (
                    <span className="px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold">
                      {copyFor(language, '3-Day Forecast', 'Prévision 3 Jours', 'توقع ٣ أيام')}
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">
                      {copyFor(language, 'Measured', 'Mesuré', 'مقاس')}
                    </span>
                  )}
                  <span className="text-muted-foreground font-mono">
                    • {copyFor(language, 'Root Moisture', 'Humidité racine', 'رطوبة الجذور')}:{' '}
                    <strong className={selectedPoint.isForecast ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}>
                      {selectedPoint.soilMoistureRootZone}%
                    </strong>
                  </span>
                  <span className="text-muted-foreground font-mono">
                    • ET₀:{' '}
                    <strong className="text-amber-600 dark:text-amber-400">
                      {selectedPoint.et0} mm
                    </strong>
                  </span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  {selectedPoint.isForecast
                    ? selectedPoint.soilMoistureRootZone >= 22
                      ? copyFor(
                          language,
                          'Forecasted ET₀ water demand is within sustainable range. Soil moisture will remain adequate over the next 3 days.',
                          'La demande en eau prévue reste soutenable. L’humidité du sol restera convenable sur les 3 prochains jours.',
                          'الطلب المائي المتوقع ضمن النطاق الآمن. ستبقى رطوبة التربة مقبولة خلال الأيام الثلاثة القادمة.'
                        )
                      : copyFor(
                          language,
                          'Forecasted ET₀ indicates imminent soil moisture depletion. Irrigation should be scheduled in the next 48-72 hours.',
                          'L’ET₀ prévue indique un épuisement imminent de la réserve utile. Prévoyez une irrigation dans les 48 à 72h.',
                          'تشير توقعات ET₀ إلى استنزاف وشيك لرطوبة التربة. يُفضل جدولة الري خلال 48 إلى 72 ساعة.'
                        )
                    : selectedPoint.soilMoistureRootZone >= 25
                    ? copyFor(
                        language,
                        'Soil water reservoir is in the optimal comfort range. No immediate stress detected.',
                        'La réserve utile du sol est dans la plage optimale. Aucun stress hydrique détecté.',
                        'مخزون الماء في التربة ضمن النطاق المثالي. لا يوجد إجهاد مائي حالياً.'
                      )
                    : selectedPoint.soilMoistureRootZone >= 18
                    ? copyFor(
                        language,
                        'Soil moisture is declining. Plan irrigation within 24-48 hours depending on crop stage.',
                        'L’humidité diminue. Planifiez une irrigation sous 24 à 48h selon le stade de la culture.',
                        'الرطوبة تتناقص. يُنصح بجدولة الري خلال 24-48 ساعة حسب طور المحصول.'
                      )
                    : copyFor(
                        language,
                        'Severe soil moisture depletion near wilting threshold. Immediate irrigation advised.',
                        'Déficit sévère proche du point de flétrissement. Irrigation immédiate recommandée.',
                        'عجز شديد في رطوبة التربة بالقرب من نقطة الذبول. يُنصح بالري الفوري.'
                      )}
                </p>
              </div>

              {onNavigate && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate('tools')}
                  className="shrink-0 h-7 text-[11px] gap-1 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10"
                >
                  <Sparkles className="h-3 w-3" />
                  {copyFor(language, 'Open Irrigation Balance', 'Calculateur d’Irrigation', 'حاسبة ميزان الري')}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
