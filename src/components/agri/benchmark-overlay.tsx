'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

/**
 * A simple benchmarks map for selected formulas. Each benchmark defines a
 * numeric range and color zones used to plot the user's value on a horizontal
 * bar. Zones are left-to-right and should be contiguous (low → high).
 *
 * `value` is the user's current numeric result; `resultLabel` is shown
 * alongside. If `formulaCode` is not in the map, the overlay is not rendered.
 */
export interface BenchmarkZone {
  /** zone label, e.g. "Poor" */
  label: string;
  /** lower bound (inclusive) */
  from: number;
  /** upper bound (exclusive on the last zone; inclusive otherwise) */
  to: number;
  /** tailwind text + bg classes for the segment */
  tone: 'rose' | 'amber' | 'emerald' | 'sky' | 'slate';
}

export interface Benchmark {
  /** display name of the metric */
  metric: string;
  /** unit suffix shown after the value */
  unit?: string;
  /** minimum extent of the bar (defaults to first zone `from`) */
  min?: number;
  /** maximum extent of the bar (defaults to last zone `to`) */
  max?: number;
  zones: BenchmarkZone[];
}

const toneClasses: Record<BenchmarkZone['tone'], { bg: string; text: string; ring: string }> = {
  rose: {
    bg: 'bg-rose-400 dark:bg-rose-600',
    text: 'text-rose-700 dark:text-rose-300',
    ring: 'ring-rose-400',
  },
  amber: {
    bg: 'bg-amber-400 dark:bg-amber-600',
    text: 'text-amber-700 dark:text-amber-300',
    ring: 'ring-amber-400',
  },
  emerald: {
    bg: 'bg-emerald-400 dark:bg-emerald-600',
    text: 'text-emerald-700 dark:text-emerald-300',
    ring: 'ring-emerald-400',
  },
  sky: {
    bg: 'bg-sky-400 dark:bg-sky-600',
    text: 'text-sky-700 dark:text-sky-300',
    ring: 'ring-sky-400',
  },
  slate: {
    bg: 'bg-slate-400 dark:bg-slate-600',
    text: 'text-slate-700 dark:text-slate-300',
    ring: 'ring-slate-400',
  },
};

/**
 * Curated benchmarks for the most-checked formulas. Values are typical
 * smallholder-to-commercial ranges drawn from the glossary.
 */
export const benchmarks: Record<string, Benchmark> = {
  // Water use efficiency — kg grain per mm of water used
  '6.4': {
    metric: 'Water Use Efficiency',
    unit: 'kg/mm',
    zones: [
      { label: 'Low', from: 0, to: 5, tone: 'rose' },
      { label: 'Average', from: 5, to: 12, tone: 'amber' },
      { label: 'Good', from: 12, to: 20, tone: 'emerald' },
      { label: 'Excellent', from: 20, to: 30, tone: 'sky' },
    ],
  },
  // Harvest index — %
  '8.9': {
    metric: 'Harvest Index',
    unit: '%',
    zones: [
      { label: 'Low', from: 0, to: 30, tone: 'rose' },
      { label: 'Typical cereals', from: 30, to: 50, tone: 'amber' },
      { label: 'High', from: 50, to: 65, tone: 'emerald' },
    ],
  },
  // THI — temperature-humidity index
  '37.1': {
    metric: 'Temperature-Humidity Index',
    zones: [
      { label: 'Comfort', from: 0, to: 68, tone: 'emerald' },
      { label: 'Mild', from: 68, to: 72, tone: 'sky' },
      { label: 'Moderate', from: 72, to: 80, tone: 'amber' },
      { label: 'Severe', from: 80, to: 90, tone: 'rose' },
      { label: 'Extreme', from: 90, to: 100, tone: 'rose' },
    ],
  },
  // FCR — feed conversion ratio (lower is better)
  '14.5': {
    metric: 'Feed Conversion Ratio',
    unit: 'kg feed / kg gain',
    zones: [
      { label: 'Excellent', from: 0, to: 1.6, tone: 'emerald' },
      { label: 'Good', from: 1.6, to: 2.0, tone: 'sky' },
      { label: 'Average', from: 2.0, to: 2.5, tone: 'amber' },
      { label: 'Poor', from: 2.5, to: 4, tone: 'rose' },
    ],
  },
  // Agronomic efficiency — kg grain per kg N applied
  '4.8a': {
    metric: 'Agronomic Efficiency',
    unit: 'kg/kg N',
    zones: [
      { label: 'Low', from: 0, to: 10, tone: 'rose' },
      { label: 'Typical', from: 10, to: 25, tone: 'amber' },
      { label: 'Good', from: 25, to: 40, tone: 'emerald' },
      { label: 'Excellent', from: 40, to: 60, tone: 'sky' },
    ],
  },
  // Bulk density — g/cm³
  '7.1': {
    metric: 'Bulk Density',
    unit: 'g/cm³',
    zones: [
      { label: 'Loose / organic', from: 0.8, to: 1.1, tone: 'sky' },
      { label: 'Ideal', from: 1.1, to: 1.5, tone: 'emerald' },
      { label: 'Compact', from: 1.5, to: 1.7, tone: 'amber' },
      { label: 'Root-limiting', from: 1.7, to: 2.0, tone: 'rose' },
    ],
  },
};

interface BenchmarkOverlayProps {
  /** formula code, e.g. "6.4" */
  formulaCode: string;
  /** numeric value to plot */
  value: number;
  /** label shown next to the value (usually a unit) */
  resultLabel?: string;
  /** extra class for outer container */
  className?: string;
}

export function BenchmarkOverlay({
  formulaCode,
  value,
  resultLabel,
  className,
}: BenchmarkOverlayProps) {
  const bench = useMemo(() => benchmarks[formulaCode], [formulaCode]);

  if (!bench) return null;

  const min = bench.min ?? bench.zones[0].from;
  const max = bench.max ?? bench.zones[bench.zones.length - 1].to;
  const span = Math.max(0.0001, max - min);

  // Clamp the marker to [min, max] for display.
  const clamped = Math.max(min, Math.min(max, value));
  const markerPct = ((clamped - min) / span) * 100;

  // Which zone does the value fall in?
  const activeZone =
    bench.zones.find(
      (z) => value >= z.from && value < z.to,
    ) ?? bench.zones[bench.zones.length - 1];

  return (
    <div className={cn('rounded-lg border border-border bg-card p-3 space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-foreground">{bench.metric}</div>
        <div className="flex items-baseline gap-1">
          <span className={cn('text-sm font-bold tabular-nums', toneClasses[activeZone.tone].text)}>
            {Number.isFinite(value) ? value.toFixed(2) : '—'}
          </span>
          {(resultLabel || bench.unit) && (
            <span className="text-[10px] text-muted-foreground">
              {resultLabel || bench.unit}
            </span>
          )}
        </div>
      </div>

      {/* Range bar */}
      <div className="relative h-2.5 rounded-full overflow-hidden flex">
        {bench.zones.map((zone) => {
          const zMin = Math.max(min, zone.from);
          const zMax = Math.min(max, zone.to);
          const zPct = ((zMax - zMin) / span) * 100;
          if (zPct <= 0) return null;
          return (
            <div
              key={zone.label}
              className={cn('h-full', toneClasses[zone.tone].bg)}
              style={{ width: `${zPct}%` }}
              title={`${zone.label}: ${zone.from}–${zone.to}`}
            />
          );
        })}
        {/* Position marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${markerPct}%` }}
        >
          <div className="h-4 w-1 rounded-full bg-foreground shadow-sm" />
        </div>
      </div>

      {/* Zone labels */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{min}</span>
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {bench.zones.map((zone) => (
            <span
              key={zone.label}
              className={cn(
                'inline-flex items-center gap-0.5',
                zone.label === activeZone.label && toneClasses[zone.tone].text,
                zone.label !== activeZone.label && 'opacity-60',
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', toneClasses[zone.tone].bg)} />
              {zone.label}
            </span>
          ))}
        </div>
        <span>{max}</span>
      </div>
    </div>
  );
}

export default BenchmarkOverlay;
