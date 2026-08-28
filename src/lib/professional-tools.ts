import {
  ALGERIAN_ACTIVE_MATTERS,
  ACTIVE_MATTER_BY_ID,
  PLANT_PROBLEMS,
  type ActiveMatter,
  type ProblemType,
} from '@/lib/algeria-phyto-data';
import {
  calculateCropSimulator,
  type SimulatorResult,
  type SimulatorScenario,
} from '@/lib/crop-simulator';
import { calculateWaterBudget, type WaterBudgetInput } from '@/lib/water-budget';

export type ProfessionalToolId =
  | 'water-salinity'
  | 'ipm-compliance'
  | 'scenario-lab'
  | 'casebook'
  | 'field-missions'
  | 'soil-evidence';

export interface WaterSalinityInput extends WaterBudgetInput {
  waterEcDsM: number;
  soilEcDsM: number;
  cropSalinityThresholdDsM: number;
  drainageEfficiencyPct: number;
  pumpHeadM: number;
  pumpEfficiencyPct: number;
  electricityDzdPerKwh: number;
}

export interface WaterSalinityResult {
  waterBudget: ReturnType<typeof calculateWaterBudget>;
  leachingFractionPct: number;
  salinityAdjustedGrossMm: number;
  salinityAdjustedVolumeM3: number;
  pumpEnergyKwh: number;
  pumpCostDzd: number;
  soilSalinityRisk: 'low' | 'watch' | 'high' | 'critical';
  drainageRisk: 'low' | 'watch' | 'high';
  warnings: string[];
}

function finite(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function calculateWaterSalinityDecision(input: WaterSalinityInput): WaterSalinityResult {
  const waterBudget = calculateWaterBudget(input);
  const waterEc = Math.max(0, finite(input.waterEcDsM));
  const soilEc = Math.max(0, finite(input.soilEcDsM));
  const threshold = Math.max(0.1, finite(input.cropSalinityThresholdDsM, 2));
  const drainageEfficiencyPct = clamp(finite(input.drainageEfficiencyPct, 80), 20, 100);
  const pumpHeadM = Math.max(0, finite(input.pumpHeadM, 30));
  const pumpEfficiencyPct = clamp(finite(input.pumpEfficiencyPct, 70), 20, 100);
  const electricityRate = Math.max(0, finite(input.electricityDzdPerKwh, 8));

  // FAO-style leaching requirement approximation. It is intentionally capped
  // and presented as a screening result, not as a reclamation prescription.
  const denominator = 5 * threshold - waterEc;
  const rawLeachingFraction = denominator > 0 ? waterEc / denominator : 0.4;
  const leachingFraction = clamp(rawLeachingFraction, 0, 0.4);
  const drainageFactor = drainageEfficiencyPct / 100;
  const salinityAdjustedGrossMm = waterBudget.grossIrrigationNeedMm * (1 + leachingFraction) / drainageFactor;
  const salinityAdjustedVolumeM3 = salinityAdjustedGrossMm * Math.max(0, finite(input.areaHa)) * 10;
  const pumpEnergyKwh = salinityAdjustedVolumeM3 * 0.002725 * pumpHeadM / (pumpEfficiencyPct / 100);
  const pumpCostDzd = pumpEnergyKwh * electricityRate;

  const salinityRatio = soilEc / threshold;
  const soilSalinityRisk: WaterSalinityResult['soilSalinityRisk'] =
    salinityRatio >= 1.5 ? 'critical' : salinityRatio >= 1 ? 'high' : salinityRatio >= 0.7 ? 'watch' : 'low';
  const drainageRisk: WaterSalinityResult['drainageRisk'] =
    drainageEfficiencyPct < 50 ? 'high' : drainageEfficiencyPct < 70 ? 'watch' : 'low';

  const warnings = [...waterBudget.warnings];
  if (waterEc > threshold) warnings.push('Irrigation-water EC exceeds the selected crop tolerance threshold; verify the laboratory test and source blend before increasing irrigation.');
  if (soilSalinityRisk === 'high' || soilSalinityRisk === 'critical') warnings.push('Root-zone salinity is above the crop threshold; confirm ECe, drainage, and crop stage with a qualified agronomist before a leaching event.');
  if (drainageRisk !== 'low') warnings.push('Drainage efficiency is limited; a larger irrigation dose may increase waterlogging and salinity movement into the root zone.');
  if (input.areaHa <= 0) warnings.push('Enter a positive field area to estimate total volume and pumping cost.');

  return {
    waterBudget,
    leachingFractionPct: round(leachingFraction * 100),
    salinityAdjustedGrossMm: round(salinityAdjustedGrossMm),
    salinityAdjustedVolumeM3: round(salinityAdjustedVolumeM3),
    pumpEnergyKwh: round(pumpEnergyKwh),
    pumpCostDzd: round(pumpCostDzd),
    soilSalinityRisk,
    drainageRisk,
    warnings,
  };
}

export interface IpmComplianceInput {
  cropId: string;
  problemType: ProblemType;
  problemId: string;
  observedLevelPct: number;
  actionThresholdPct: number;
  daysToHarvest: number;
  selectedActiveMatterId?: string;
  windSafe: boolean;
  labelVerified: boolean;
  lastModeOfAction?: string;
}

export interface IpmComplianceResult {
  problemName: string;
  matchedActives: ActiveMatter[];
  selectedActiveMatter?: ActiveMatter;
  decision: 'monitor' | 'review-treatment' | 'hold';
  urgency: 'low' | 'medium' | 'high';
  thresholdReached: boolean;
  complianceChecks: {
    registered: boolean;
    cropListed: boolean;
    labelVerified: boolean;
    windSafe: boolean;
    resistanceRotationNeeded: boolean;
    harvestWindowSafe: boolean;
  };
  warnings: string[];
}

function parseFirstNumber(value: string): number | null {
  const match = value.match(/\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0].replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildIpmComplianceReview(input: IpmComplianceInput): IpmComplianceResult {
  const problem = PLANT_PROBLEMS.find((entry) => entry.id === input.problemId);
  const observed = clamp(finite(input.observedLevelPct), 0, 100);
  const threshold = clamp(finite(input.actionThresholdPct, 5), 0, 100);
  const thresholdReached = observed >= threshold;
  const matchedActives = problem
    ? problem.actives.map((id) => ACTIVE_MATTER_BY_ID[id]).filter((entry): entry is ActiveMatter => Boolean(entry))
    : ALGERIAN_ACTIVE_MATTERS.filter((entry) => entry.crops.includes(input.cropId)).slice(0, 8);
  const selectedActiveMatter = input.selectedActiveMatterId ? ACTIVE_MATTER_BY_ID[input.selectedActiveMatterId] : undefined;
  const phiDays = selectedActiveMatter ? parseFirstNumber(selectedActiveMatter.preHarvestInterval) : null;
  const cropListed = Boolean(selectedActiveMatter?.crops.includes(input.cropId));
  const harvestWindowSafe = phiDays == null || input.daysToHarvest >= phiDays;
  const resistanceRotationNeeded = Boolean(selectedActiveMatter?.resistanceCode && input.lastModeOfAction && selectedActiveMatter.resistanceCode === input.lastModeOfAction);
  const complianceChecks = {
    registered: selectedActiveMatter?.registeredAlgeria ?? false,
    cropListed,
    labelVerified: input.labelVerified,
    windSafe: input.windSafe,
    resistanceRotationNeeded,
    harvestWindowSafe,
  };
  const warnings: string[] = [];
  if (!thresholdReached) warnings.push('Observed pressure is below the action threshold; continue scouting and preserve beneficial organisms.');
  if (thresholdReached && !selectedActiveMatter) warnings.push('The threshold is reached, but no treatment has been selected; review biological, cultural, and mechanical controls first.');
  if (selectedActiveMatter && !selectedActiveMatter.registeredAlgeria) warnings.push('This active matter is not confirmed as registered in the curated Algerian catalogue; verify current INPV authorization before use.');
  if (selectedActiveMatter && !cropListed) warnings.push('The selected crop is not listed in the current product record; do not use this selection without label confirmation.');
  if (!input.labelVerified) warnings.push('Label, dose, DAR/PHI, application count, and permitted crop must be verified before any spray decision.');
  if (!input.windSafe) warnings.push('Weather is not suitable for spraying; postpone and reassess wind, temperature, and nearby sensitive areas.');
  if (resistanceRotationNeeded) warnings.push('The same resistance group was recently used; select a different mode of action and follow the label rotation rules.');
  if (!harvestWindowSafe) warnings.push('The current harvest interval is shorter than the selected product’s listed pre-harvest interval.');

  const hold = Boolean(selectedActiveMatter && (!complianceChecks.registered || !cropListed || !complianceChecks.labelVerified || !complianceChecks.windSafe || !harvestWindowSafe));
  const decision: IpmComplianceResult['decision'] = hold ? 'hold' : thresholdReached && selectedActiveMatter ? 'review-treatment' : 'monitor';
  const urgency: IpmComplianceResult['urgency'] = hold || observed >= threshold * 2 ? 'high' : thresholdReached ? 'medium' : 'low';

  return {
    problemName: problem?.name ?? input.problemId,
    matchedActives,
    selectedActiveMatter,
    decision,
    urgency,
    thresholdReached,
    complianceChecks,
    warnings,
  };
}

export interface ScenarioLabInput {
  scenario: SimulatorScenario;
  droughtPct: number;
  salinityYieldLossPct: number;
  marketPriceChangePct: number;
  inputInflationPct: number;
}

export interface ScenarioLabVariant {
  id: 'baseline' | 'drought' | 'salinity' | 'market' | 'compound';
  label: string;
  result: SimulatorResult;
  deltaNetMarginDzd: number;
  deltaYieldPct: number;
}

export interface ScenarioLabResult {
  variants: ScenarioLabVariant[];
  mostExposedVariant: ScenarioLabVariant;
  resilienceScore: number;
}

function adjustedScenario(base: SimulatorScenario, options: { yieldDeltaPct?: number; priceDeltaPct?: number; costDeltaPct?: number }): SimulatorScenario {
  const yieldMultiplier = 1 + clamp(finite(options.yieldDeltaPct ?? 0), -90, 200) / 100;
  const priceMultiplier = 1 + clamp(finite(options.priceDeltaPct ?? 0), -90, 200) / 100;
  const costMultiplier = 1 + clamp(finite(options.costDeltaPct ?? 0), -90, 300) / 100;
  return {
    ...base,
    expectedYieldTPerHa: Math.max(0, base.expectedYieldTPerHa * yieldMultiplier),
    expectedPricePerT: Math.max(0, base.expectedPricePerT * priceMultiplier),
    costs: base.costs.map((line) => ({ ...line, amount: Math.max(0, line.amount * costMultiplier) })),
  };
}

export function calculateScenarioLab(input: ScenarioLabInput): ScenarioLabResult {
  const drought = clamp(finite(input.droughtPct, 20), 0, 90);
  const salinity = clamp(finite(input.salinityYieldLossPct, 15), 0, 90);
  const market = clamp(finite(input.marketPriceChangePct, -20), -90, 200);
  const inflation = clamp(finite(input.inputInflationPct, 15), 0, 300);
  const variants: Array<{ id: ScenarioLabVariant['id']; label: string; options: { yieldDeltaPct?: number; priceDeltaPct?: number; costDeltaPct?: number } }> = [
    { id: 'baseline', label: 'Baseline', options: {} },
    { id: 'drought', label: 'Drought stress', options: { yieldDeltaPct: -drought } },
    { id: 'salinity', label: 'Salinity stress', options: { yieldDeltaPct: -salinity } },
    { id: 'market', label: 'Market shock', options: { priceDeltaPct: market } },
    { id: 'compound', label: 'Compound shock', options: { yieldDeltaPct: -(drought + salinity) / 2, priceDeltaPct: market, costDeltaPct: inflation } },
  ];
  const baseline = calculateCropSimulator(input.scenario);
  const evaluated = variants.map((variant) => {
    const result = variant.id === 'baseline' ? baseline : calculateCropSimulator(adjustedScenario(input.scenario, variant.options));
    return {
      id: variant.id,
      label: variant.label,
      result,
      deltaNetMarginDzd: round(result.netMargin - baseline.netMargin),
      deltaYieldPct: baseline.totalYieldT > 0 ? round((result.totalYieldT / baseline.totalYieldT - 1) * 100) : 0,
    };
  });
  const worst = evaluated.reduce((current, candidate) => candidate.result.netMargin < current.result.netMargin ? candidate : current, evaluated[0]);
  const baseMargin = Math.max(1, Math.abs(baseline.netMargin));
  const resilienceScore = round(clamp(100 + (worst.result.netMargin - baseline.netMargin) / baseMargin * 100, 0, 100));
  return { variants: evaluated, mostExposedVariant: worst, resilienceScore };
}

export function getProfessionalToolLabel(id: ProfessionalToolId, language: 'en' | 'fr' | 'ar'): string {
  const labels: Record<ProfessionalToolId, [string, string, string]> = {
    'water-salinity': ['Water · Salinity Decision Engine', 'Moteur eau · salinité', 'محرك المياه والملوحة'],
    'ipm-compliance': ['Phytosanitary & IPM Workbench', 'Poste phytosanitaire et I P M', 'لوحة الصحة النباتية والإدارة المتكاملة'],
    'scenario-lab': ['Climate · Market Scenario Lab', 'Laboratoire climat · marché', 'مختبر سيناريوهات المناخ والسوق'],
    casebook: ['Agronomic Casebook', 'Dossier agronomique', 'السجل الزراعي التفسيري'],
    'field-missions': ['Offline Field Missions', 'Missions terrain hors ligne', 'مهام الحقل دون اتصال'],
    'soil-evidence': ['Soil Evidence & Mapping', 'Preuves et cartographie des sols', 'أدلة ورسم خرائط التربة'],
  };
  const index = language === 'fr' ? 1 : language === 'ar' ? 2 : 0;
  return labels[id][index];
}
