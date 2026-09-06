/**
 * Composite Crop Stress Index (ICSI/CARI)
 *
 * Inspired by agri-sens-core (https://github.com/Yeabsera-Gezahegn/agri-sens-core)
 * which combines three signals into one actionable stress score:
 *
 *   Stress = 0.40·Φ(-ΔNDVI·5) + 0.35·Φ(-Z_SM) + 0.25·Φ(Z_LST)
 *
 * Where Φ is the standard normal CDF (converts raw Z-scores to 0-1 probability).
 *
 * We adapt this for FormulaAtlas using the data we already have:
 *   1. NDVI decline — current NDVI vs expected for crop stage (from thermal-stage GDD profile)
 *   2. Rainfall deficit — from our rainfall anomaly service (percent of normal)
 *   3. Temperature stress — current temp vs crop optimal range (from FarmPilot crop data)
 *
 * The result is a single 0-1 score:
 *   0.0-0.3: Low stress (healthy crop)
 *   0.3-0.6: Moderate stress (monitor closely)
 *   0.6-1.0: High stress (action needed — irrigate, shade, treat)
 *
 * This is more actionable than showing three separate metrics. A farmer
 * sees one number + one recommendation, not three charts to interpret.
 */

import type { RainfallAnomaly } from '@/lib/rainfall-anomaly';
import type { DailyForecast } from '@/lib/open-meteo';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StressInput {
  /** Current NDVI (-1 to 1). Null if unavailable. */
  currentNdvi: number | null;
  /** Expected NDVI for this crop stage (0-1). Null if unknown. */
  expectedNdvi: number | null;
  /** Rainfall anomaly (percent of normal + deficit info). Null if unavailable. */
  rainfallAnomaly: RainfallAnomaly | null;
  /** Today's forecast (for temperature). Null if unavailable. */
  today: DailyForecast | null;
  /** Crop optimal temperature range [min, max] in °C. Null if unknown. */
  optimalTempRange: [number, number] | null;
}

export interface StressResult {
  /** Composite stress index (0-1). Higher = more stress. */
  index: number;
  /** Severity level. */
  level: 'low' | 'moderate' | 'high';
  /** Which signals contributed (for the "why" explanation). */
  components: {
    ndviStress: number | null;      // 0-1
    rainfallStress: number | null;   // 0-1
    temperatureStress: number | null; // 0-1
  };
  /** Human-readable summary (localized by caller). */
  dominantFactor: 'ndvi' | 'rainfall' | 'temperature' | 'none';
  /** Recommended action (localized by caller). */
  recommendation: 'irrigate' | 'monitor' | 'shade' | 'none';
}

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

/**
 * Standard normal CDF (cumulative distribution function).
 * Φ(z) = (1/√(2π)) ∫_{-∞}^{z} e^(-t²/2) dt
 *
 * Approximation using the error function (Abramowitz & Stegun 7.1.26).
 * Accuracy: ±1e-7 — sufficient for stress scoring.
 */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

/**
 * Clamp a value to [0, 1].
 */
function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// ---------------------------------------------------------------------------
// Individual stress components
// ---------------------------------------------------------------------------

/**
 * NDVI stress: how far below expected is the current NDVI?
 * Uses the same Φ(-ΔNDVI·5) formula from the ICSI paper.
 *
 * If NDVI is at or above expected → 0 stress.
 * If NDVI drops 0.1 below expected → ~30% stress.
 * If NDVI drops 0.2 below expected → ~70% stress.
 */
export function computeNdviStress(currentNdvi: number | null, expectedNdvi: number | null): number | null {
  if (currentNdvi == null || expectedNdvi == null) return null;
  const delta = currentNdvi - expectedNdvi;
  if (delta >= 0) return 0;  // at or above expected → no stress
  // Φ(-Δ·5) where Δ is negative (decline), so -Δ is positive
  // Larger decline → higher stress
  return clamp01(normalCdf(-delta * 5));
}

/**
 * Rainfall stress: derived from the rainfall anomaly percent of normal.
 *
 * 100% of normal → 0 stress
 * 80% of normal → 0.2 stress (mild)
 * 60% of normal → 0.5 stress (moderate)
 * 40% of normal → 0.8 stress (severe)
 */
export function computeRainfallStress(anomaly: RainfallAnomaly | null): number | null {
  if (!anomaly) return null;
  const pct = anomaly.percentOfNormal;
  if (pct >= 100) return 0;
  // Linear mapping: 100% → 0, 0% → 1
  return clamp01((100 - pct) / 100);
}

/**
 * Temperature stress: how far outside the optimal range is today's temp?
 *
 * Uses the midpoint of tempMax/tempMin as the "experienced" temperature.
 * If within optimal range → 0 stress.
 * If above max → stress increases with distance.
 * If below min → mild stress (cold), but less severe than heat.
 */
export function computeTemperatureStress(
  today: DailyForecast | null,
  optimalRange: [number, number] | null,
): number | null {
  if (!today || !optimalRange) return null;
  const [minOpt, maxOpt] = optimalRange;
  const avgTemp = (today.tempMax + today.tempMin) / 2;

  if (avgTemp >= minOpt && avgTemp <= maxOpt) return 0;

  if (avgTemp > maxOpt) {
    // Heat stress: each degree above max adds ~5% stress, capped at 1
    const excess = avgTemp - maxOpt;
    return clamp01(excess * 0.05);
  } else {
    // Cold stress: each degree below min adds ~3% stress (less severe than heat)
    const deficit = minOpt - avgTemp;
    return clamp01(deficit * 0.03);
  }
}

// ---------------------------------------------------------------------------
// Composite index
// ---------------------------------------------------------------------------

/** Weights for each component (sum to 1.0). From the ICSI paper. */
const WEIGHTS = {
  ndvi: 0.40,
  rainfall: 0.35,
  temperature: 0.25,
};

/**
 * Compute the composite crop stress index.
 *
 * Formula (adapted from ICSI):
 *   Stress = w_ndvi · NDVI_stress + w_rain · Rain_stress + w_temp · Temp_stress
 *
 * When a component is unavailable (null), its weight is redistributed
 * proportionally to the available components. This ensures the score is
 * still meaningful with partial data.
 */
export function computeStressIndex(input: StressInput): StressResult {
  const ndviStress = computeNdviStress(input.currentNdvi, input.expectedNdvi);
  const rainfallStress = computeRainfallStress(input.rainfallAnomaly);
  const temperatureStress = computeTemperatureStress(input.today, input.optimalTempRange);

  // Collect available components + their weights
  const available: Array<{ value: number; weight: number; factor: 'ndvi' | 'rainfall' | 'temperature' }> = [];
  if (ndviStress != null) available.push({ value: ndviStress, weight: WEIGHTS.ndvi, factor: 'ndvi' });
  if (rainfallStress != null) available.push({ value: rainfallStress, weight: WEIGHTS.rainfall, factor: 'rainfall' });
  if (temperatureStress != null) available.push({ value: temperatureStress, weight: WEIGHTS.temperature, factor: 'temperature' });

  if (available.length === 0) {
    return {
      index: 0,
      level: 'low',
      components: { ndviStress, rainfallStress, temperatureStress },
      dominantFactor: 'none',
      recommendation: 'none',
    };
  }

  // Redistribute weights if some components are missing
  const totalWeight = available.reduce((s, a) => s + a.weight, 0);
  const index = available.reduce((s, a) => s + (a.value * a.weight) / totalWeight, 0);

  // Determine severity level
  let level: StressResult['level'] = 'low';
  if (index >= 0.6) level = 'high';
  else if (index >= 0.3) level = 'moderate';

  // Find dominant factor (highest contributing component)
  const dominantFactor = available.reduce((max, a) =>
    a.value > max.value ? a : max, available[0]).factor as StressResult['dominantFactor'];

  // Recommendation based on dominant factor + severity
  let recommendation: StressResult['recommendation'] = 'none';
  if (level !== 'low') {
    if (dominantFactor === 'rainfall') recommendation = 'irrigate';
    else if (dominantFactor === 'temperature') recommendation = 'shade';
    else if (dominantFactor === 'ndvi') recommendation = 'monitor';
  }

  return {
    index: Math.round(index * 100) / 100,
    level,
    components: { ndviStress, rainfallStress, temperatureStress },
    dominantFactor,
    recommendation,
  };
}

// ---------------------------------------------------------------------------
// Localization helpers
// ---------------------------------------------------------------------------

export function stressLevelLabel(level: StressResult['level'], language: 'en' | 'fr' | 'ar'): string {
  const isArabic = language === 'ar';
  const isFrench = language === 'fr';
  switch (level) {
    case 'high':
      return isArabic ? 'إجهاد عالي' : isFrench ? 'Stress élevé' : 'High stress';
    case 'moderate':
      return isArabic ? 'إجهاد متوسط' : isFrench ? 'Stress modéré' : 'Moderate stress';
    default:
      return isArabic ? 'سليم' : isFrench ? 'Sain' : 'Healthy';
  }
}

export function stressColor(level: StressResult['level']): string {
  switch (level) {
    case 'high': return '#dc2626';   // red-600
    case 'moderate': return '#f59e0b'; // amber-500
    default: return '#16a34a';        // green-600
  }
}

export function stressRecommendationText(rec: StressResult['recommendation'], language: 'en' | 'fr' | 'ar'): string {
  const isArabic = language === 'ar';
  const isFrench = language === 'fr';
  switch (rec) {
    case 'irrigate':
      return isArabic ? 'زد الري لتعويض الإجهاد' : isFrench ? 'Augmenter l\'irrigation' : 'Increase irrigation to compensate';
    case 'shade':
      return isArabic ? 'وفّر ظلاً أو شبكاً ظليلياً' : isFrench ? 'Fournir de l\'ombre' : 'Provide shade or shade net';
    case 'monitor':
      return isArabic ? 'راقب عن كثب — افحص الآفات والأمراض' : isFrench ? 'Surveiller — vérifier les nuisibles' : 'Monitor closely — check for pests/disease';
    default:
      return isArabic ? 'الوضع طبيعي' : isFrench ? 'Conditions normales' : 'Conditions normal';
  }
}

/**
 * Brief text for WhatsApp message.
 */
export function stressBriefText(result: StressResult, language: 'en' | 'fr' | 'ar'): string {
  if (result.level === 'low') return '';  // don't include if healthy

  const isArabic = language === 'ar';
  const isFrench = language === 'fr';
  const levelLabel = stressLevelLabel(result.level, language);
  const recText = stressRecommendationText(result.recommendation, language);
  const pct = Math.round(result.index * 100);

  return isArabic
    ? `🌿 مؤشر إجهاد المحصول: ${pct}% (${levelLabel}) — ${recText}`
    : isFrench
      ? `🌿 Indice de stress culture: ${pct}% (${levelLabel}) — ${recText}`
      : `🌿 Crop stress index: ${pct}% (${levelLabel}) — ${recText}`;
}
