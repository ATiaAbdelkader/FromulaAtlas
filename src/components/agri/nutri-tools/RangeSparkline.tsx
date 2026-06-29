'use client';

/**
 * RangeSparkline — a small horizontal bar showing where a value sits within
 * its typical range, with arbitrary color zones (Low / Optimal / High, etc.)
 * and an optional thin white marker line at the value position.
 *
 * Zones are positioned absolutely as a percentage of the [min, max] span;
 * gaps between zones (if any) are left transparent so callers can express
 * "don't care" bands. The marker is clamped to [0, 100]% so out-of-range
 * values don't escape the bar.
 */

export interface RangeSparklineZone {
  /** Inclusive lower bound of the zone (in value units). */
  from: number;
  /** Exclusive upper bound of the zone (in value units). */
  to: number;
  /** CSS color for the zone band. */
  color: string;
  /** Optional label, currently unused but reserved for future tooltips. */
  label?: string;
}

export interface RangeSparklineProps {
  /** Current value (clamped to the bar visually). */
  value: number;
  /** Lower bound of the displayed range. */
  min: number;
  /** Upper bound of the displayed range. */
  max: number;
  /** Color bands to render inside the bar. */
  zones: RangeSparklineZone[];
  /** Bar height in px (default 12). */
  height?: number;
  /** Show a vertical marker line at the value position (default true). */
  showMarker?: boolean;
  /** Show min/max labels beneath the bar (default false). */
  showLabels?: boolean;
  /** className applied to the outer wrapper. */
  className?: string;
}

export function RangeSparkline({
  value,
  min,
  max,
  zones,
  height = 12,
  showMarker = true,
  showLabels = false,
  className,
}: RangeSparklineProps) {
  const span = max - min;
  // Guard against a degenerate range so we never divide by zero.
  const safeSpan = span > 0 ? span : 1;

  const pct = (v: number) => ((v - min) / safeSpan) * 100;
  const markerPct = Math.max(0, Math.min(100, pct(value)));

  return (
    <div className={className}>
      <div
        className="relative w-full rounded-full overflow-hidden bg-muted/40 ring-1 ring-inset ring-black/5 dark:ring-white/10"
        style={{ height: `${height}px` }}
      >
        {zones.map((zone, i) => {
          const left = Math.max(0, Math.min(100, pct(zone.from)));
          const right = Math.max(0, Math.min(100, pct(zone.to)));
          const width = right - left;
          if (width <= 0) return null;
          return (
            <div
              key={i}
              className="absolute top-0 bottom-0"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                backgroundColor: zone.color,
              }}
              title={zone.label}
            />
          );
        })}
        {showMarker && (
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-white shadow-sm pointer-events-none"
            style={{
              left: `${markerPct}%`,
              transform: 'translateX(-50%)',
            }}
          />
        )}
      </div>
      {showLabels && (
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1 tabular-nums">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
}
