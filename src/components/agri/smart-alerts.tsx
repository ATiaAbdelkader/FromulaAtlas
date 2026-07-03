'use client';

import { useMemo, useState } from 'react';
import { X, Droplets, AlertTriangle, Flame, CloudRain } from 'lucide-react';
import { useWeatherStore } from '@/lib/weather-store';
import { cn } from '@/lib/utils';

/**
 * Alert severity → tailwind classes. The spec calls for:
 *   - amber for warnings
 *   - blue for info
 *   - red for critical
 *
 * We add a few extra touch-ups (icon color, border) per severity so each
 * banner reads at a glance.
 */
type AlertSeverity = 'info' | 'warning' | 'critical';

interface SeverityStyle {
  container: string;
  icon: string;
  dismiss: string;
}

const SEVERITY_STYLES: Record<AlertSeverity, SeverityStyle> = {
  info: {
    container:
      'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-100',
    icon: 'text-blue-600 dark:text-blue-400',
    dismiss: 'hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300',
  },
  warning: {
    container:
      'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-100',
    icon: 'text-amber-600 dark:text-amber-400',
    dismiss: 'hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300',
  },
  critical: {
    container:
      'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-900 dark:text-red-100',
    icon: 'text-red-600 dark:text-red-400',
    dismiss: 'hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300',
  },
};

interface WeatherAlert {
  /** Stable id used for dismiss tracking. */
  id: string;
  /** Lucide icon component. */
  icon: typeof Droplets;
  /** Already-formatted message (including emoji + interpolated values). */
  message: string;
  severity: AlertSeverity;
}

/**
 * Hargreaves–Samani reference ET estimate (mm/day). Mirrors the same helper
 * used by WeatherWidget so the SmartAlerts banner stays consistent with the
 * irrigation insight the user sees in the weather card.
 *
 *   ET0 = 0.0023 · Ra · (Tmean + 17.8) · sqrt(Tmax − Tmin)
 *
 * We don't have Tmin/Tmax from the Open-Meteo `current` endpoint, so we
 * approximate the daily swing from the gap between temperature and
 * apparentTemperature.
 */
function estimateET0(temperature: number, apparentTemperature: number): number {
  const tMean = (temperature + apparentTemperature) / 2;
  const swing = Math.max(4, Math.abs(temperature - apparentTemperature) * 1.5);
  const ra = 32; // tropical mid-season extraterrestrial radiation (mm/day)
  return Math.max(0, 0.0023 * ra * (tMean + 17.8) * Math.sqrt(swing));
}

/**
 * Temperature-Humidity Index (NWS formula adapted for °C). Same helper as
 * WeatherWidget — kept here locally so SmartAlerts has no cross-file
 * coupling to a component that renders UI.
 *
 *   THI = T − [(0.55 − 0.0055·RH) · (T − 14.5)]
 */
function computeTHI(tempC: number, humidity: number): number {
  return tempC - (0.55 - 0.0055 * humidity) * (tempC - 14.5);
}

/**
 * SmartAlerts — dismissible weather-action banners shown at the top of the
 * Home tab.
 *
 * Conditions (evaluated in priority order; multiple can fire at once and
 * stack vertically):
 *   - ET₀ > 6 mm  and  rainfall = 0   →  info:    irrigation needed today
 *   - THI > 80                          →  critical: severe livestock heat stress
 *   - 72 < THI < 80                     →  warning:  moderate livestock heat stress
 *   - temperature > 35 °C               →  critical: extreme heat, irrigate early/late
 *   - rainfall > 10 mm                  →  info:    heavy rainfall, skip irrigation
 *
 * Dismissed alerts stay dismissed for the session (in-memory `useState`,
 * intentionally not persisted — they re-evaluate on the next visit).
 *
 * If no alerts are active, this component renders `null` (no empty container).
 */
export function SmartAlerts() {
  const location = useWeatherStore((s) => s.location);
  const weather = useWeatherStore((s) => s.weather);

  // Track dismissed alert ids for the session. Using a Set in state — we
  // create a new Set on each dismiss so React re-renders.
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());

  const alerts = useMemo<WeatherAlert[]>(() => {
    if (!weather) return [];

    const et0 = estimateET0(weather.temperature, weather.apparentTemperature);
    const thi = computeTHI(weather.temperature, weather.humidity);
    const rainfall = weather.precipitation;
    const tempC = weather.temperature;

    const list: WeatherAlert[] = [];

    // 1) Irrigation needed: high ET₀ + no rainfall.
    if (et0 > 6 && rainfall === 0) {
      list.push({
        id: 'irrigation-needed',
        icon: Droplets,
        message: `💧 Irrigation needed today — ET₀ is ${et0.toFixed(1)}mm, no rainfall expected`,
        severity: 'info',
      });
    }

    // 2) Severe heat stress (THI > 80) — supersedes the moderate alert.
    if (thi > 80) {
      list.push({
        id: 'severe-heat-stress',
        icon: AlertTriangle,
        message: `⚠️ Severe heat stress risk for livestock (THI ${thi.toFixed(0)}) — provide shade and ventilation`,
        severity: 'critical',
      });
    } else if (thi > 72) {
      // 3) Moderate heat stress (72 < THI < 80).
      list.push({
        id: 'moderate-heat-stress',
        icon: AlertTriangle,
        message: `⚠️ Moderate heat stress (THI ${thi.toFixed(0)}) — monitor livestock closely`,
        severity: 'warning',
      });
    }

    // 4) Extreme heat — temperature > 35 °C.
    if (tempC > 35) {
      list.push({
        id: 'extreme-heat',
        icon: Flame,
        message: `🔥 Extreme heat — irrigate early morning or evening only`,
        severity: 'critical',
      });
    }

    // 5) Heavy rainfall — skip irrigation.
    if (rainfall > 10) {
      list.push({
        id: 'heavy-rainfall',
        icon: CloudRain,
        message: `🌧️ Heavy rainfall (${rainfall.toFixed(1)}mm) — skip irrigation today`,
        severity: 'info',
      });
    }

    return list;
  }, [weather]);

  // Hide entirely when there's no location or no weather data — the user
  // hasn't opted into weather yet, so we don't nag them with an empty
  // container.
  if (!location || !weather) return null;

  // Filter out dismissed alerts for this session.
  const visible = alerts.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  const handleDismiss = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  return (
    <section
      className="space-y-2 font-arabic"
      aria-label="Weather action alerts"
      aria-live="polite"
    >
      {visible.map((alert) => {
        const Icon = alert.icon;
        const style = SEVERITY_STYLES[alert.severity];
        return (
          <div
            key={alert.id}
            role="alert"
            className={cn(
              'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-sm',
              style.container,
            )}
          >
            <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', style.icon)} />
            <p className="flex-1 leading-relaxed font-medium">{alert.message}</p>
            <button
              onClick={() => handleDismiss(alert.id)}
              className={cn(
                'flex-shrink-0 p-1 rounded-md transition-colors',
                style.dismiss,
              )}
              aria-label="Dismiss alert"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </section>
  );
}

export default SmartAlerts;
