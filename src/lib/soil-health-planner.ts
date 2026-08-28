import { analyzeRotation, ROTATION_CROPS, suggestRotation, type RotationYear } from '@/lib/rotation-data';

export type SoilTexture = 'sand' | 'loam' | 'clay';
export type TillagePractice = 'conventional' | 'reduced' | 'no-till';
export type SupportPractice = 'none' | 'contour' | 'strip-crop' | 'terrace';
export type ErosionRisk = 'low' | 'moderate' | 'high';
export type SoilRecommendation =
  | 'cover-crop'
  | 'reduced-tillage'
  | 'support-practice'
  | 'rotation-diversity'
  | 'soil-test'
  | 'pH-balance';

export interface SoilHealthPlannerInput {
  areaHa: number;
  texture: SoilTexture;
  slopePct: number;
  slopeLengthM: number;
  omPercent: number;
  pH: number;
  tillage: TillagePractice;
  supportPractice: SupportPractice;
  rotation: RotationYear[];
}

export interface SoilHealthScenario {
  id: 'current' | 'recommended';
  label: string;
  erosionLossTonsPerHa: number;
  erosionLossTotalTons: number;
  toleranceTonsPerHa: number;
  erosionRisk: ErosionRisk;
  soilHealthScore: number;
  organicMatterAddedTonsPerHa: number;
  nitrogenCreditKgPerHa: number;
  coverCropYears: number;
  diseaseBreaksMet: boolean;
  carbonCoBenefitTonsPerHa: number;
  recommendations: SoilRecommendation[];
  rotation: RotationYear[];
  tillage: TillagePractice;
  supportPractice: SupportPractice;
}

export interface SoilHealthPlan {
  current: SoilHealthScenario;
  recommended: SoilHealthScenario;
  erosionReductionPercent: number;
  soilHealthGain: number;
  input: SoilHealthPlannerInput;
}

const K_FACTOR: Record<SoilTexture, number> = {
  sand: 0.12,
  loam: 0.32,
  clay: 0.28,
};

const TILLAGE_FACTOR: Record<TillagePractice, number> = {
  conventional: 1,
  reduced: 0.5,
  'no-till': 0.2,
};

const SUPPORT_FACTOR: Record<SupportPractice, number> = {
  none: 1,
  contour: 0.6,
  'strip-crop': 0.45,
  terrace: 0.25,
};

const BASE_R_FACTOR = 250;
const SOIL_TOLERANCE = 5;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function finitePositive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function normalizeRotation(rotation: RotationYear[]): RotationYear[] {
  return rotation
    .filter((year) => ROTATION_CROPS.some((crop) => crop.id === year.cropId))
    .map((year, index) => ({ ...year, year: index + 1 }));
}

function erosionLoss(input: SoilHealthPlannerInput): number {
  const slope = clamp(input.slopePct, 0.1, 60);
  const length = finitePositive(input.slopeLengthM, 100);
  const ls = Math.pow(slope / 9, 1.4) * Math.sqrt(length / 100);
  const raw = BASE_R_FACTOR * K_FACTOR[input.texture] * ls * TILLAGE_FACTOR[input.tillage] * SUPPORT_FACTOR[input.supportPractice];
  return Math.max(0, Math.round(raw * 100) / 100);
}

function erosionRisk(loss: number): ErosionRisk {
  if (loss <= SOIL_TOLERANCE) return 'low';
  if (loss <= SOIL_TOLERANCE * 2) return 'moderate';
  return 'high';
}

function healthScore(input: SoilHealthPlannerInput, rotation: RotationYear[], loss: number): number {
  const analysis = analyzeRotation(rotation);
  let score = analysis.soilHealthScore;
  const om = clamp(input.omPercent, 0, 12);
  const ph = input.pH;
  score += (om - 2.5) * 5;
  if (ph < 5.5 || ph > 8.2) score -= 10;
  else if (ph >= 6 && ph <= 7.5) score += 4;
  if (loss > SOIL_TOLERANCE) score -= Math.min(20, (loss - SOIL_TOLERANCE) * 1.5);
  return clamp(Math.round(score), 0, 100);
}

function recommendations(input: SoilHealthPlannerInput, rotation: RotationYear[], loss: number): SoilRecommendation[] {
  const analysis = analyzeRotation(rotation);
  const result: SoilRecommendation[] = [];
  if (analysis.coverCropYears === 0) result.push('cover-crop');
  if (input.tillage === 'conventional') result.push('reduced-tillage');
  if (input.supportPractice === 'none' && input.slopePct >= 5) result.push('support-practice');
  if (analysis.legumeYears === 0 || analysis.cashCropYears <= 1) result.push('rotation-diversity');
  if (input.omPercent < 2 || loss > SOIL_TOLERANCE) result.push('soil-test');
  if (input.pH < 5.5 || input.pH > 8.2) result.push('pH-balance');
  return result;
}

function scenario(
  input: SoilHealthPlannerInput,
  id: SoilHealthScenario['id'],
  label: string,
): SoilHealthScenario {
  const rotation = normalizeRotation(input.rotation);
  const analysis = analyzeRotation(rotation);
  const loss = erosionLoss(input);
  const area = finitePositive(input.areaHa, 1);
  const organicMatterAdded = Math.round(analysis.totalOmAdded * 100) / 100;
  return {
    id,
    label,
    erosionLossTonsPerHa: loss,
    erosionLossTotalTons: Math.round(loss * area * 100) / 100,
    toleranceTonsPerHa: SOIL_TOLERANCE,
    erosionRisk: erosionRisk(loss),
    soilHealthScore: healthScore(input, rotation, loss),
    organicMatterAddedTonsPerHa: organicMatterAdded,
    nitrogenCreditKgPerHa: analysis.totalNCredit,
    coverCropYears: analysis.coverCropYears,
    diseaseBreaksMet: analysis.diseaseBreaksMet,
    carbonCoBenefitTonsPerHa: Math.round(organicMatterAdded * 0.58 * 100) / 100,
    recommendations: recommendations(input, rotation, loss),
    rotation,
    tillage: input.tillage,
    supportPractice: input.supportPractice,
  };
}

/**
 * Compare the saved management scenario with a conservative soil-health
 * scenario. All values are planning estimates, not a substitute for a local
 * conservation plan or laboratory soil test.
 */
export function calculateSoilHealthPlan(input: SoilHealthPlannerInput): SoilHealthPlan {
  const rotation = normalizeRotation(input.rotation);
  const baseRotation = rotation.length > 0 ? rotation : suggestRotation('maize', 4);
  const normalizedInput = {
    ...input,
    areaHa: finitePositive(input.areaHa, 1),
    slopePct: clamp(input.slopePct, 0.1, 60),
    slopeLengthM: finitePositive(input.slopeLengthM, 100),
    omPercent: clamp(input.omPercent, 0, 12),
    pH: clamp(input.pH, 3, 11),
    rotation: baseRotation,
  };
  const current = scenario(normalizedInput, 'current', 'Current practice');
  const recommendedInput: SoilHealthPlannerInput = {
    ...normalizedInput,
    tillage: normalizedInput.tillage === 'conventional' ? 'reduced' : normalizedInput.tillage,
    supportPractice: normalizedInput.supportPractice === 'none' && normalizedInput.slopePct >= 5
      ? 'contour'
      : normalizedInput.supportPractice,
    rotation: normalizedInput.rotation.some((year) => year.isCoverCrop)
      ? normalizedInput.rotation
      : suggestRotation(normalizedInput.rotation[0]?.cropId || 'maize', Math.max(4, normalizedInput.rotation.length)),
  };
  const recommended = scenario(recommendedInput, 'recommended', 'Soil-health scenario');
  const erosionReductionPercent = current.erosionLossTonsPerHa === 0
    ? 0
    : Math.round((1 - recommended.erosionLossTonsPerHa / current.erosionLossTonsPerHa) * 100);
  return {
    current,
    recommended,
    erosionReductionPercent: clamp(erosionReductionPercent, 0, 100),
    soilHealthGain: recommended.soilHealthScore - current.soilHealthScore,
    input: normalizedInput,
  };
}

export function getRotationCropOptions(): Array<Pick<typeof ROTATION_CROPS[number], 'id' | 'name' | 'type' | 'emoji'>> {
  return ROTATION_CROPS.map(({ id, name, type, emoji }) => ({ id, name, type, emoji }));
}

export const SOIL_TOLERANCE_TONS_PER_HA = SOIL_TOLERANCE;
export const SOIL_TEXTURE_K_FACTORS = K_FACTOR;
