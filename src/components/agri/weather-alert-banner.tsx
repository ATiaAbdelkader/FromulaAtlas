'use client';

/**
 * WeatherAlertBanner — proactive warning banner for frost, heat, heavy rain,
 * or spray-unfriendly conditions. Shows at the top of the Home Dashboard when
 * the forecast warrants it.
 *
 * Pulls from the same Open-Meteo forecast the Home Dashboard already fetches.
 * No separate API call — the parent passes the ForecastResult.
 *
 * Alert types:
 *   - FROST:  min temp < 2°C in next 3 nights → red banner
 *   - HEAT:   max temp > 35°C in next 3 days → orange banner
 *   - RAIN:   precipitation > 25 mm in any day → blue banner
 *   - WIND:   wind > 30 km/h → yellow banner (spray risk)
 *   - GOOD:   no alerts → green "conditions are good" banner (dismissable)
 */

import { useMemo } from 'react';
import {
  AlertTriangle, Snowflake, Sun, CloudRain, Wind, CheckCircle2, X,
} from 'lucide-react';
import { type ForecastResult, wmoDescription } from '@/lib/open-meteo';

interface WeatherAlertBannerProps {
  forecast: ForecastResult | null;
}

type AlertType = 'frost' | 'heat' | 'rain' | 'wind' | 'good';

interface Alert {
  type: AlertType;
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  icon: typeof Snowflake;
  color: string;
  bgColor: string;
  borderColor: string;
}

const ALERT_STYLES: Record<AlertType, { color: string; bg: string; border: string }> = {
  frost:   { color: '#1e40af', bg: '#dbeafe', border: '#3b82f6' },
  heat:    { color: '#9a3412', bg: '#fed7aa', border: '#f97316' },
  rain:    { color: '#0c4a6e', bg: '#bae6fd', border: '#0ea5e9' },
  wind:    { color: '#713f12', bg: '#fef08a', border: '#eab308' },
  good:    { color: '#166534', bg: '#dcfce7', border: '#22c55e' },
};

export function WeatherAlertBanner({ forecast }: WeatherAlertBannerProps) {
  const alerts = useMemo(() => computeAlerts(forecast), [forecast]);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => (
        <AlertBanner key={i} alert={alert} />
      ))}
    </div>
  );
}

function AlertBanner({ alert }: { alert: Alert }) {
  const styles = ALERT_STYLES[alert.type];
  const Icon = alert.icon;

  return (
    <div
      className="rounded-lg border p-3 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300"
      style={{
        backgroundColor: styles.bg,
        borderColor: styles.border,
        color: styles.color,
      }}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">{alert.title}</div>
        <div className="text-xs mt-0.5 opacity-90">{alert.message}</div>
      </div>
    </div>
  );
}

// ============================================================================
// Alert computation
// ============================================================================

function computeAlerts(forecast: ForecastResult | null): Alert[] {
  if (!forecast || !forecast.daily || forecast.daily.length === 0) return [];

  const alerts: Alert[] = [];
  const next3 = forecast.daily.slice(0, 3);

  // Frost: min temp < 2°C
  for (const day of next3) {
    if (day.tempMin < 2) {
      alerts.push({
        type: 'frost',
        severity: day.tempMin < -2 ? 'critical' : 'warning',
        title: `❄️ Frost warning — ${day.tempMin.toFixed(1)}°C`,
        message: `Low of ${day.tempMin.toFixed(1)}°C on ${formatDate(day.date)}. Protect sensitive crops: cover, irrigate before nightfall, or run wind machines. Tomatoes, peppers, citrus, and young seedlings are most at risk.`,
        icon: Snowflake,
        color: ALERT_STYLES.frost.color,
        bgColor: ALERT_STYLES.frost.bg,
        borderColor: ALERT_STYLES.frost.border,
      });
      break;  // one frost alert is enough
    }
  }

  // Heat: max temp > 35°C
  for (const day of next3) {
    if (day.tempMax > 35) {
      alerts.push({
        type: 'heat',
        severity: day.tempMax > 40 ? 'critical' : 'warning',
        title: `🔥 Heat stress — ${day.tempMax.toFixed(1)}°C`,
        message: `High of ${day.tempMax.toFixed(1)}°C on ${formatDate(day.date)}. Increase irrigation, use shade cloth on vegetables, avoid spraying during peak heat (10am–4pm). Livestock need shade + extra water.`,
        icon: Sun,
        color: ALERT_STYLES.heat.color,
        bgColor: ALERT_STYLES.heat.bg,
        borderColor: ALERT_STYLES.heat.border,
      });
      break;
    }
  }

  // Heavy rain: > 25 mm in any day
  for (const day of next3) {
    if (day.precipitationSum > 25) {
      alerts.push({
        type: 'rain',
        severity: day.precipitationSum > 50 ? 'warning' : 'info',
        title: `🌧️ Heavy rain — ${day.precipitationSum.toFixed(0)} mm`,
        message: `${day.precipitationSum.toFixed(0)} mm rain expected on ${formatDate(day.date)}. Delay fertilizer application + spraying. Check drainage in low-lying fields. Drip irrigation can likely be paused for 2–3 days.`,
        icon: CloudRain,
        color: ALERT_STYLES.rain.color,
        bgColor: ALERT_STYLES.rain.bg,
        borderColor: ALERT_STYLES.rain.border,
      });
      break;
    }
  }

  // Wind: > 30 km/h (spray risk)
  for (const day of next3) {
    if (day.windSpeedMax > 30) {
      alerts.push({
        type: 'wind',
        severity: 'info',
        title: `💨 High wind — ${day.windSpeedMax.toFixed(0)} km/h`,
        message: `Wind up to ${day.windSpeedMax.toFixed(0)} km/h on ${formatDate(day.date)}. Avoid pesticide/herbicide spraying — drift risk. Secure greenhouse vents + young trellised plants.`,
        icon: Wind,
        color: ALERT_STYLES.wind.color,
        bgColor: ALERT_STYLES.wind.bg,
        borderColor: ALERT_STYLES.wind.border,
      });
      break;
    }
  }

  // Good conditions: no alerts + mild weather
  if (alerts.length === 0) {
    const today = next3[0];
    if (today && today.tempMin > 5 && today.tempMax < 32 && today.precipitationSum < 5) {
      alerts.push({
        type: 'good',
        severity: 'success',
        title: '✅ Conditions are good today',
        message: `Mild weather (${today.tempMin.toFixed(0)}–${today.tempMax.toFixed(0)}°C), low rain risk. Good day for field work, spraying, and fertilizing. ET₀ is ${today.et0.toFixed(1)} mm/day.`,
        icon: CheckCircle2,
        color: ALERT_STYLES.good.color,
        bgColor: ALERT_STYLES.good.bg,
        borderColor: ALERT_STYLES.good.border,
      });
    }
  }

  return alerts;
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00').toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}
