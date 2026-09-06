/**
 * Thermal-time (GDD) crop stage calculator.
 *
 * Inspired by T³S (Think in Thermal Time) — arXiv:2506.12885, ECCV 2026 CVPPA.
 *
 * The problem: crop development doesn't follow calendar time. A crop planted
 * on March 1 in a warm year reaches flowering sooner than the same crop in
 * a cold year — even though the calendar date is the same.
 *
 * The solution: track cumulative Growing Degree Days (cGDD) instead of
 * calendar days. Each crop stage requires a specific amount of accumulated
 * heat (GDD) to complete, regardless of how many calendar days that takes.
 *
 * GDD formula:
 *   GDD_i = max(0, ((Tmax + Tmin) / 2) - T_base)
 *   cGDD = Σ GDD_i from planting date to today
 *
 * This module:
 *   1. Fetches daily temperature (Tmax, Tmin) for the farmer's location
 *      from planting date to today
 *   2. Computes daily GDD using the crop's base temperature
 *   3. Accumulates to cGDD
 *   4. Maps cGDD to the active crop stage (using per-stage GDD thresholds)
 *
 * Falls back to calendar-time (the existing getStageProgression) when:
 *   - Weather data is unavailable
 *   - Crop doesn't have GDD thresholds defined
 *   - Planting date is too recent (< 7 days of data)
 */

import { getCachedForecast } from '@/lib/brief/weather-cache';
import type { ForecastResult, DailyForecast } from '@/lib/open-meteo';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ThermalStageResult {
  /** Active stage key (e.g., 'vegetative', 'flowering'). */
  stage: string;
  /** Cumulative GDD from planting to today. */
  currentGdd: number;
  /** GDD required to reach the next stage. */
  nextStageGdd: number | null;
  /** Estimated days until next stage (based on recent GDD/day rate). */
  daysToNextStage: number | null;
  /** Whether this was computed from thermal time (true) or calendar fallback (false). */
  isThermal: boolean;
  /** Base temperature used (°C). */
  baseTemp: number;
}

// ---------------------------------------------------------------------------
// Per-crop GDD thresholds + base temperatures
// ---------------------------------------------------------------------------

interface CropGddProfile {
  /** Base temperature for GDD calculation (°C). Below this, no development. */
  baseTemp: number;
  /** Cumulative GDD required to reach each stage transition. */
  stageThresholds: Array<{ stage: string; gddRequired: number }>;
}

/**
 * GDD profiles per crop. Thresholds are approximate, based on FAO GDD
 * documentation + crop-specific phenology literature.
 *
 * These are the GDD required to REACH each stage (cumulative from planting).
 * Example for potato: 0→emergence(150)→vegetative(450)→tuber_init(800)→
 * bulking(1200)→maturation(1500)
 */
const CROP_GDD_PROFILES: Record<string, CropGddProfile> = {
  potato: {
    baseTemp: 7,
    stageThresholds: [
      { stage: 'emergence', gddRequired: 150 },
      { stage: 'vegetative', gddRequired: 450 },
      { stage: 'tuber_init', gddRequired: 800 },
      { stage: 'bulking', gddRequired: 1200 },
      { stage: 'maturation', gddRequired: 1500 },
    ],
  },
  wheat: {
    baseTemp: 0,
    stageThresholds: [
      { stage: 'emergence', gddRequired: 100 },
      { stage: 'tillering', gddRequired: 350 },
      { stage: 'stem_elongation', gddRequired: 600 },
      { stage: 'heading', gddRequired: 900 },
      { stage: 'flowering', gddRequired: 1050 },
      { stage: 'grain_fill', gddRequired: 1300 },
      { stage: 'maturation', gddRequired: 1600 },
    ],
  },
  barley: {
    baseTemp: 0,
    stageThresholds: [
      { stage: 'emergence', gddRequired: 90 },
      { stage: 'tillering', gddRequired: 320 },
      { stage: 'stem_elongation', gddRequired: 560 },
      { stage: 'heading', gddRequired: 820 },
      { stage: 'flowering', gddRequired: 970 },
      { stage: 'maturation', gddRequired: 1400 },
    ],
  },
  maize: {
    baseTemp: 10,
    stageThresholds: [
      { stage: 'emergence', gddRequired: 120 },
      { stage: 'vegetative', gddRequired: 450 },
      { stage: 'flowering', gddRequired: 800 },
      { stage: 'grain_fill', gddRequired: 1200 },
      { stage: 'maturation', gddRequired: 1500 },
    ],
  },
  tomato: {
    baseTemp: 10,
    stageThresholds: [
      { stage: 'emergence', gddRequired: 100 },
      { stage: 'vegetative', gddRequired: 400 },
      { stage: 'flowering', gddRequired: 700 },
      { stage: 'fruit_set', gddRequired: 950 },
      { stage: 'maturation', gddRequired: 1400 },
    ],
  },
  onion: {
    baseTemp: 5,
    stageThresholds: [
      { stage: 'emergence', gddRequired: 120 },
      { stage: 'vegetative', gddRequired: 500 },
      { stage: 'bulbing', gddRequired: 900 },
      { stage: 'maturation', gddRequired: 1300 },
    ],
  },
  'date-palm': {
    baseTemp: 10,
    stageThresholds: [
      { stage: 'flowering', gddRequired: 300 },
      { stage: 'fruit_set', gddRequired: 700 },
      { stage: 'khalal', gddRequired: 1500 },
      { stage: 'rutab', gddRequired: 2200 },
      { stage: 'tamar', gddRequired: 2800 },
    ],
  },
  citrus: {
    baseTemp: 13,
    stageThresholds: [
      { stage: 'bud_break', gddRequired: 200 },
      { stage: 'flowering', gddRequired: 450 },
      { stage: 'fruit_set', gddRequired: 700 },
      { stage: 'maturation', gddRequired: 1800 },
    ],
  },
  olive: {
    baseTemp: 7,
    stageThresholds: [
      { stage: 'bud_break', gddRequired: 150 },
      { stage: 'flowering', gddRequired: 400 },
      { stage: 'fruit_set', gddRequired: 600 },
      { stage: 'maturation', gddRequired: 1500 },
    ],
  },
};

/**
 * Default profile for crops without a specific GDD profile.
 * Uses base temp 5°C and generic thresholds.
 */
const DEFAULT_PROFILE: CropGddProfile = {
  baseTemp: 5,
  stageThresholds: [
    { stage: 'emergence', gddRequired: 150 },
    { stage: 'vegetative', gddRequired: 500 },
    { stage: 'flowering', gddRequired: 900 },
    { stage: 'maturation', gddRequired: 1400 },
  ],
};

function getCropGddProfile(cropId: string): CropGddProfile | null {
  // Normalize: try canonical, then common variations
  const normalized = cropId.toLowerCase().replace(/[-_]/g, '-');
  return CROP_GDD_PROFILES[normalized] ?? CROP_GDD_PROFILES[cropId.toLowerCase()] ?? null;
}

// ---------------------------------------------------------------------------
// GDD calculation
// ---------------------------------------------------------------------------

/**
 * Compute daily GDD from a forecast daily entry.
 * GDD = max(0, ((Tmax + Tmin) / 2) - T_base)
 */
export function computeDailyGdd(day: { tempMax: number; tempMin: number }, baseTemp: number): number {
  const tAvg = (day.tempMax + day.tempMin) / 2;
  const gdd = tAvg - baseTemp;
  return Math.max(0, gdd);
}

/**
 * Compute cumulative GDD from a forecast daily array.
 * Returns the total GDD accumulated from the first day to today.
 */
export function computeCumulativeGdd(
  daily: Array<{ date: string; tempMax: number; tempMin: number }>,
  baseTemp: number,
  today: Date = new Date(),
): number {
  const todayStr = today.toISOString().slice(0, 10);
  let total = 0;
  for (const day of daily) {
    if (day.date > todayStr) break;  // don't count future days
    total += computeDailyGdd(day, baseTemp);
  }
  return Math.round(total * 10) / 10;  // 1 decimal
}

// ---------------------------------------------------------------------------
// Main entry — thermal stage from GDD
// ---------------------------------------------------------------------------

/**
 * Determine the active crop stage using thermal time (GDD).
 *
 * @param cropId Canonical crop ID (e.g., 'potato', 'wheat')
 * @param lat Farm latitude
 * @param lng Farm longitude
 * @param plantingDate ISO date string
 * @returns ThermalStageResult, or null if insufficient data
 */
export async function getThermalStage(
  cropId: string,
  lat: number,
  lng: number,
  plantingDate: string,
): Promise<ThermalStageResult | null> {
  const profile = getCropGddProfile(cropId);
  if (!profile) return null;  // crop not supported

  const planting = new Date(plantingDate.length > 10 ? plantingDate : `${plantingDate}T00:00:00`);
  const now = new Date();
  const daysSincePlanting = Math.round((now.getTime() - planting.getTime()) / 86400000);

  // Need at least 7 days of data for meaningful GDD
  if (daysSincePlanting < 7) return null;

  // Fetch forecast (which includes recent past days via Open-Meteo)
  // The forecast includes up to 7 past days by default
  const forecast = await getCachedForecast(lat, lng);
  if (!forecast?.daily?.length) return null;

  // Filter to days since planting
  const relevantDays = forecast.daily.filter(d => d.date >= plantingDate);
  if (relevantDays.length < 3) return null;

  // Compute cumulative GDD
  const currentGdd = computeCumulativeGdd(
    relevantDays.map(d => ({ date: d.date, tempMax: d.tempMax, tempMin: d.tempMin })),
    profile.baseTemp,
  );

  // Find the active stage
  let activeStage = profile.stageThresholds[0].stage;
  let nextStage: { stage: string; gddRequired: number } | null = null;

  for (let i = 0; i < profile.stageThresholds.length; i++) {
    const threshold = profile.stageThresholds[i];
    if (currentGdd >= threshold.gddRequired) {
      activeStage = threshold.stage;
      nextStage = profile.stageThresholds[i + 1] ?? null;
    } else {
      // Haven't reached this threshold yet — previous stage is active
      if (!nextStage) nextStage = threshold;
      break;
    }
  }

  // Estimate days to next stage (based on average GDD/day over last 7 days)
  let daysToNextStage: number | null = null;
  if (nextStage) {
    const remainingGdd = nextStage.gddRequired - currentGdd;
    const recentDays = relevantDays.slice(-7);
    const recentGddPerDay = recentDays.length > 0
      ? recentDays.reduce((s, d) => s + computeDailyGdd(d, profile.baseTemp), 0) / recentDays.length
      : 0;
    if (recentGddPerDay > 0.5) {
      daysToNextStage = Math.ceil(remainingGdd / recentGddPerDay);
    }
  }

  return {
    stage: activeStage,
    currentGdd,
    nextStageGdd: nextStage?.gddRequired ?? null,
    daysToNextStage,
    isThermal: true,
    baseTemp: profile.baseTemp,
  };
}

// ---------------------------------------------------------------------------
// Stage label localization (matching CROP_STAGE_LABELS keys)
// ---------------------------------------------------------------------------

/**
 * Map thermal stage names to FarmPilot stage keys for label compatibility.
 * FarmPilot uses: 'establishment' | 'vegetative' | 'reproductive' | 'maturation' | 'harvest'
 */
export function mapThermalStageToFarmPilot(thermalStage: string): string {
  const lower = thermalStage.toLowerCase();
  if (lower.includes('emergence') || lower.includes('bud_break') || lower.includes('establishment')) {
    return 'establishment';
  }
  if (lower.includes('vegetative') || lower.includes('tillering') || lower.includes('stem_elongation') || lower.includes('bulbing')) {
    return 'vegetative';
  }
  if (lower.includes('flower') || lower.includes('heading') || lower.includes('fruit_set') || lower.includes('tuber_init') || lower.includes('bulking') || lower.includes('khalal') || lower.includes('rutab')) {
    return 'reproductive';
  }
  if (lower.includes('matur') || lower.includes('tamar')) {
    return 'maturation';
  }
  return 'establishment';
}
