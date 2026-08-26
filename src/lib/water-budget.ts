/**
 * Water Budget Optimizer — deterministic soil-water balance calculations.
 *
 * The engine keeps the calculation layer free of UI and network concerns so it
 * can be reused by the Farm dashboard, printable output, and domain tests.
 * ETc follows the FAO-56 relationship ETc = Kc × ETo. Rainfall is reduced by
 * an explicit effective-rain factor before it is credited to the soil balance.
 */

export interface WaterBudgetInput {
  areaHa: number;
  dailyEt0Mm: number[];
  dailyRainMm: number[];
  kc: number;
  irrigationAppliedGrossMm: number;
  systemEfficiencyPct: number;
  rootZoneAvailableWaterMm: number;
  initialDepletionPct: number;
  allowedDepletionPct: number;
  effectiveRainPct?: number;
}

export interface WaterBudgetDay {
  day: number;
  et0Mm: number;
  etcMm: number;
  rainfallMm: number;
  effectiveRainMm: number;
  depletionBeforeIrrigationMm: number;
  recommendedGrossIrrigationMm: number;
  depletionAfterRecommendationMm: number;
  shouldIrrigate: boolean;
}

export interface WaterBudgetResult {
  days: WaterBudgetDay[];
  areaHa: number;
  kc: number;
  totalEt0Mm: number;
  totalEtcMm: number;
  totalRainMm: number;
  totalEffectiveRainMm: number;
  netCropDemandMm: number;
  grossIrrigationNeedMm: number;
  appliedGrossMm: number;
  additionalGrossNeedMm: number;
  grossVolumeM3: number;
  additionalVolumeM3: number;
  rootZoneAvailableWaterMm: number;
  initialDepletionMm: number;
  finalDepletionWithoutRecommendationMm: number;
  finalDepletionWithRecommendationMm: number;
  allowedDepletionMm: number;
  waterBalanceAfterAppliedMm: number;
  status: 'surplus' | 'balanced' | 'deficit' | 'urgent';
  warnings: string[];
}

export const DEFAULT_EFFECTIVE_RAIN_PCT = 80;

function finiteNonNegative(value: number, fallback = 0): number {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizedSeries(values: number[], fallback: number): number[] {
  const clean = values
    .filter(Number.isFinite)
    .map(value => Math.max(0, value));
  return clean.length > 0 ? clean.slice(0, 14) : [fallback];
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/**
 * Calculate a forecast water budget and trigger irrigation when depletion
 * crosses the managed allowable-depletion threshold.
 */
export function calculateWaterBudget(input: WaterBudgetInput): WaterBudgetResult {
  const et0Series = normalizedSeries(input.dailyEt0Mm, 0);
  const rainSeries = normalizedSeries(input.dailyRainMm, 0);
  const days = Math.max(et0Series.length, rainSeries.length);
  const effectiveRainPct = clamp(
    finiteNonNegative(input.effectiveRainPct ?? DEFAULT_EFFECTIVE_RAIN_PCT),
    0,
    100,
  );
  const kc = finiteNonNegative(input.kc);
  const areaHa = finiteNonNegative(input.areaHa);
  const efficiencyPct = clamp(finiteNonNegative(input.systemEfficiencyPct, 85), 1, 100);
  const efficiency = efficiencyPct / 100;
  const taw = finiteNonNegative(input.rootZoneAvailableWaterMm);
  const initialDepletionPct = clamp(finiteNonNegative(input.initialDepletionPct), 0, 100);
  const allowedDepletionPct = clamp(finiteNonNegative(input.allowedDepletionPct, 50), 1, 100);
  const initialDepletionMm = taw * initialDepletionPct / 100;
  const allowedDepletionMm = taw * allowedDepletionPct / 100;
  const effectiveRainFactor = effectiveRainPct / 100;

  const schedule: WaterBudgetDay[] = [];
  let depletion = initialDepletionMm;
  let depletionWithoutRecommendation = initialDepletionMm;
  let totalEt0Mm = 0;
  let totalEtcMm = 0;
  let totalRainMm = 0;
  let totalEffectiveRainMm = 0;
  let recommendedGrossTotal = 0;

  for (let index = 0; index < days; index += 1) {
    const et0Mm = et0Series[index] ?? et0Series[et0Series.length - 1] ?? 0;
    const rainfallMm = rainSeries[index] ?? rainSeries[rainSeries.length - 1] ?? 0;
    const etcMm = et0Mm * kc;
    const effectiveRainMm = rainfallMm * effectiveRainFactor;
    const depletionBeforeIrrigationMm = clamp(
      depletion + etcMm - effectiveRainMm,
      0,
      taw,
    );
    const depletionWithoutRecommendationMm = clamp(
      depletionWithoutRecommendation + etcMm - effectiveRainMm,
      0,
      taw,
    );
    const netRefillNeededMm = Math.max(0, depletionBeforeIrrigationMm - allowedDepletionMm);
    const recommendedGrossIrrigationMm = netRefillNeededMm / efficiency;
    const depletionAfterRecommendationMm = clamp(
      depletionBeforeIrrigationMm - netRefillNeededMm,
      0,
      taw,
    );

    schedule.push({
      day: index + 1,
      et0Mm: round(et0Mm),
      etcMm: round(etcMm),
      rainfallMm: round(rainfallMm),
      effectiveRainMm: round(effectiveRainMm),
      depletionBeforeIrrigationMm: round(depletionBeforeIrrigationMm),
      recommendedGrossIrrigationMm: round(recommendedGrossIrrigationMm),
      depletionAfterRecommendationMm: round(depletionAfterRecommendationMm),
      shouldIrrigate: recommendedGrossIrrigationMm > 0.1,
    });

    depletion = depletionAfterRecommendationMm;
    depletionWithoutRecommendation = depletionWithoutRecommendationMm;
    recommendedGrossTotal += recommendedGrossIrrigationMm;
    totalEt0Mm += et0Mm;
    totalEtcMm += etcMm;
    totalRainMm += rainfallMm;
    totalEffectiveRainMm += effectiveRainMm;
  }

  const netCropDemandMm = Math.max(0, totalEtcMm - totalEffectiveRainMm);
  const grossIrrigationNeedMm = netCropDemandMm / efficiency;
  const appliedGrossMm = finiteNonNegative(input.irrigationAppliedGrossMm);
  const additionalGrossNeedMm = Math.max(0, grossIrrigationNeedMm - appliedGrossMm);
  const grossVolumeM3 = grossIrrigationNeedMm * areaHa * 10;
  const additionalVolumeM3 = additionalGrossNeedMm * areaHa * 10;
  const appliedNetMm = appliedGrossMm * efficiency;
  const waterBalanceAfterAppliedMm = appliedNetMm + totalEffectiveRainMm - totalEtcMm;
  const finalDepletionWithRecommendationMm = clamp(
    initialDepletionMm - waterBalanceAfterAppliedMm,
    0,
    taw,
  );

  let status: WaterBudgetResult['status'] = 'balanced';
  if (taw > 0 && depletionWithoutRecommendation >= taw * 0.9) status = 'urgent';
  else if (waterBalanceAfterAppliedMm < -2) status = 'deficit';
  else if (waterBalanceAfterAppliedMm > 2) status = 'surplus';

  const warnings: string[] = [];
  if (areaHa <= 0) warnings.push('Enter a positive field area to calculate total irrigation volume.');
  if (taw <= 0) warnings.push('Enter root-zone available water to activate depletion guardrails.');
  if (efficiencyPct < 70) warnings.push('Low system efficiency increases the gross irrigation requirement; inspect distribution uniformity and losses.');
  if (allowedDepletionPct > 60) warnings.push('A high allowable-depletion setting may expose shallow-rooted or sensitive crops to water stress.');
  if (recommendedGrossTotal > 0 && totalRainMm > totalEtcMm) warnings.push('Forecast rainfall exceeds crop ETc for part of the period; verify field drainage before irrigating.');

  return {
    days: schedule,
    areaHa: round(areaHa),
    kc: round(kc, 3),
    totalEt0Mm: round(totalEt0Mm),
    totalEtcMm: round(totalEtcMm),
    totalRainMm: round(totalRainMm),
    totalEffectiveRainMm: round(totalEffectiveRainMm),
    netCropDemandMm: round(netCropDemandMm),
    grossIrrigationNeedMm: round(grossIrrigationNeedMm),
    appliedGrossMm: round(appliedGrossMm),
    additionalGrossNeedMm: round(additionalGrossNeedMm),
    grossVolumeM3: round(grossVolumeM3),
    additionalVolumeM3: round(additionalVolumeM3),
    rootZoneAvailableWaterMm: round(taw),
    initialDepletionMm: round(initialDepletionMm),
    finalDepletionWithoutRecommendationMm: round(depletionWithoutRecommendation),
    finalDepletionWithRecommendationMm: round(finalDepletionWithRecommendationMm),
    allowedDepletionMm: round(allowedDepletionMm),
    waterBalanceAfterAppliedMm: round(waterBalanceAfterAppliedMm),
    status,
    warnings,
  };
}
