'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * AnimatedCounter — rolls a number from its previous rendered value to the new
 * target value over `duration` ms using requestAnimationFrame and an ease-out
 * cubic curve. Renders the result with `toLocaleString('en-US', …)` so the
 * thousands separator and fixed decimal places match the rest of the suite.
 *
 * Null/undefined/NaN inputs render an em-dash placeholder so callers can pass
 * through `result?.value` without an extra guard.
 */

export interface AnimatedCounterProps {
  /** Target value to animate towards. */
  value: number | null | undefined;
  /** Number of decimal places to display (default 2). */
  decimals?: number;
  /** Text rendered after the number (e.g. " kPa", " g/m³"). */
  suffix?: string;
  /** Text rendered before the number (e.g. "+", "$"). */
  prefix?: string;
  /** className applied to the number+prefix+suffix wrapper span. */
  className?: string;
  /** Animation duration in ms (default 400). */
  duration?: number;
}

/** Ease-out cubic: fast at the start, decelerating towards the end. */
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Below this absolute delta we skip the animation entirely — the visible
 *  difference would be sub-pixel anyway and we avoid scheduling a frame. */
const SKIP_DELTA = 0.001;

function formatNumber(n: number, decimals: number): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function AnimatedCounter({
  value,
  decimals = 2,
  suffix = '',
  prefix = '',
  className,
  duration = 400,
}: AnimatedCounterProps) {
  // The value currently shown to the user (the source point for the next
  // animation). Kept in a ref so identity changes to the `value` prop don't
  // restart the effect — only the numeric content matters.
  const fromRef = useRef<number>(0);
  // The latest target value, mirrored into state so a re-render is triggered
  // on every animation frame (RAF can't update the DOM directly here because
  // we format through React).
  const [display, setDisplay] = useState<number>(0);
  // Tracks whether we've ever seen a valid value — used so the first render
  // (and recovery from null → number) jumps straight to the target without
  // animating from 0.
  const initialisedRef = useRef(false);
  // Holds the current RAF handle so it can be cancelled on cleanup or when
  // the target changes before the previous animation finished.
  const rafRef = useRef<number | null>(null);

  // Resolve the target once per render so the effect closure sees a stable
  // value for the duration of the animation.
  const target = typeof value === 'number' && Number.isFinite(value) ? value : null;

  useEffect(() => {
    // Cancel any in-flight animation before starting a new one.
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Invalid input → leave display untouched, the render path will show "—".
    if (target === null) {
      initialisedRef.current = false;
      return;
    }

    // First valid value (or recovering from an invalid one): snap, no anim.
    if (!initialisedRef.current) {
      fromRef.current = target;
      setDisplay(target);
      initialisedRef.current = true;
      return;
    }

    const from = fromRef.current;
    const delta = target - from;

    // No perceptible change — skip the frame.
    if (Math.abs(delta) < SKIP_DELTA) {
      setDisplay(target);
      fromRef.current = target;
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = duration <= 0 ? 1 : Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      const next = from + delta * eased;
      setDisplay(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // Snap to the exact target on the final frame to avoid float drift.
        setDisplay(target);
        fromRef.current = target;
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      // Persist the most recent animated value as the starting point for the
      // next animation. If we don't, a re-mount would jump back to 0.
      fromRef.current = target;
    };
  }, [target, duration]);

  // Invalid input → placeholder.
  if (target === null) {
    return <span className={className}>—</span>;
  }

  return (
    <span className={className}>
      {prefix}{formatNumber(display, decimals)}{suffix}
    </span>
  );
}
