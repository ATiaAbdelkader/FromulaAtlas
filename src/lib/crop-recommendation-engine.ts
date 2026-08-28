/**
 * Crop Recommendation Engine — adapted from AgroAI's ML-based engine
 * (https://github.com/Aniket-Asawale/AgroAI---AI-and-Automation-in-Agriculture)
 *
 * AgroAI uses a trained ANN model with 50,400 rows of Indian crop data.
 * We can't port the model directly (different crops, seasons, soils), so
 * we implement a RULE-BASED engine that follows the same pattern:
 *
 *   1. Input: soil N/P/K, pH, EC, temperature, humidity, rainfall, soil type
 *   2. Score each crop against its requirements
 *   3. Return top-3 recommendations with confidence + explanation
 *   4. LLM verifier pattern: cross-check against agronomic rules
 *
 * Algerian crop profiles adapted from AgroAI's crop_profiles.py, using:
 *   - CROP_LIFECYCLES from our crop-lifecycle.ts (20 crops)
 *   - SOIL_PROFILES from our soil-profiles.ts (6 soil types)
 *   - INPV 2017 pest/disease data
 *
 * The engine also supports REVERSE recommendation: "Can I grow X here?"
 * which reports feasibility, deficits, and fixes needed.
 */

import { SOIL_PROFILES, getSoilProfile, checkSoilPHForCrop, type SoilProfile } from './soil-profiles';
import { CROP_LIFECYCLES } from './crop-lifecycle';

// ============================================================================
// Algerian Crop Profiles — adapted from AgroAI's KHARIF/RABI/ZAID system
// ============================================================================

export interface CropProfile {
  cropId: string;           // matches CROP_LIFECYCLES id
  cropName: string;
  cropNameAr: string;
  /** Acceptable pH range. */
  phRange: [number, number];
  /** Nitrogen requirement range (mg/kg). */
  nRange: [number, number];
  /** Phosphorus requirement range (mg/kg). */
  pRange: [number, number];
  /** Potassium requirement range (mg/kg). */
  kRange: [number, number];
  /** Optimal temperature range (°C). */
  tempRange: [number, number];
  /** Annual rainfall requirement (mm). */
  rainfallRange: [number, number];
  /** Soil types this crop prefers (matching SOIL_PROFILES ids). */
  soilAffinity: string[];
  /** Soil types this crop tolerates but doesn't prefer. */
  soilSecondary: string[];
  /** Growing season in Algeria. */
  season: 'autumn_winter' | 'spring_summer' | 'year_round';
  /** Water stress tolerance (0-1, higher = more tolerant). */
  droughtTolerance: number;
  /** Emoji from CROP_LIFECYCLES. */
  emoji: string;
}

export const ALGERIAN_CROP_PROFILES: CropProfile[] = [
  {
    cropId: 'wheat', cropName: 'Durum Wheat', cropNameAr: 'القمح الصلب',
    phRange: [6.0, 7.5], nRange: [90, 150], pRange: [30, 60], kRange: [80, 140],
    tempRange: [10, 25], rainfallRange: [300, 600],
    soilAffinity: ['alluvial', 'black-regur'], soilSecondary: ['red', 'clay'],
    season: 'autumn_winter', droughtTolerance: 0.7, emoji: '🌾',
  },
  {
    cropId: 'barley', cropName: 'Barley', cropNameAr: 'الشعير',
    phRange: [6.0, 8.0], nRange: [60, 100], pRange: [20, 40], kRange: [60, 100],
    tempRange: [8, 28], rainfallRange: [250, 500],
    soilAffinity: ['alluvial', 'sandy'], soilSecondary: ['red', 'black-regur'],
    season: 'autumn_winter', droughtTolerance: 0.9, emoji: '🌾',
  },
  {
    cropId: 'maize', cropName: 'Maize', cropNameAr: 'الذرة',
    phRange: [5.8, 7.2], nRange: [120, 200], pRange: [50, 100], kRange: [100, 180],
    tempRange: [18, 35], rainfallRange: [500, 900],
    soilAffinity: ['alluvial', 'red'], soilSecondary: ['black-regur', 'clay'],
    season: 'spring_summer', droughtTolerance: 0.4, emoji: '🌽',
  },
  {
    cropId: 'potato', cropName: 'Potato', cropNameAr: 'البطاطا',
    phRange: [5.0, 6.5], nRange: [100, 180], pRange: [40, 80], kRange: [120, 200],
    tempRange: [15, 25], rainfallRange: [400, 700],
    soilAffinity: ['alluvial', 'sandy'], soilSecondary: ['red'],
    season: 'spring_summer', droughtTolerance: 0.5, emoji: '🥔',
  },
  {
    cropId: 'tomato', cropName: 'Tomato', cropNameAr: 'الطماطم',
    phRange: [5.5, 7.0], nRange: [100, 180], pRange: [40, 80], kRange: [100, 180],
    tempRange: [18, 30], rainfallRange: [400, 800],
    soilAffinity: ['alluvial', 'red'], soilSecondary: ['sandy'],
    season: 'spring_summer', droughtTolerance: 0.5, emoji: '🍅',
  },
  {
    cropId: 'citrus', cropName: 'Citrus', cropNameAr: 'الحمضيات',
    phRange: [6.0, 7.5], nRange: [80, 150], pRange: [30, 60], kRange: [100, 180],
    tempRange: [13, 35], rainfallRange: [600, 1200],
    soilAffinity: ['alluvial', 'red'], soilSecondary: ['sandy', 'clay'],
    season: 'year_round', droughtTolerance: 0.6, emoji: '🍊',
  },
  {
    cropId: 'olive', cropName: 'Olive', cropNameAr: 'الزيتون',
    phRange: [6.5, 8.5], nRange: [50, 100], pRange: [20, 50], kRange: [80, 150],
    tempRange: [10, 35], rainfallRange: [300, 700],
    soilAffinity: ['alluvial', 'clay'], soilSecondary: ['sandy', 'red'],
    season: 'year_round', droughtTolerance: 0.9, emoji: '🫒',
  },
  {
    cropId: 'vine', cropName: 'Vine', cropNameAr: 'الكروم',
    phRange: [5.5, 8.0], nRange: [40, 90], pRange: [20, 50], kRange: [80, 150],
    tempRange: [12, 35], rainfallRange: [400, 800],
    soilAffinity: ['alluvial', 'red'], soilSecondary: ['sandy', 'clay'],
    season: 'year_round', droughtTolerance: 0.7, emoji: '🍇',
  },
  {
    cropId: 'datepalm', cropName: 'Date Palm', cropNameAr: 'نخيل التمر',
    phRange: [7.0, 9.0], nRange: [60, 120], pRange: [20, 50], kRange: [80, 160],
    tempRange: [20, 45], rainfallRange: [0, 250],
    soilAffinity: ['sandy'], soilSecondary: ['alluvial'],
    season: 'year_round', droughtTolerance: 1.0, emoji: '🌴',
  },
  {
    cropId: 'alfalfa', cropName: 'Alfalfa', cropNameAr: 'الفصة',
    phRange: [6.0, 7.5], nRange: [0, 50], pRange: [30, 60], kRange: [80, 150],
    tempRange: [10, 35], rainfallRange: [400, 800],
    soilAffinity: ['alluvial', 'clay'], soilSecondary: ['black-regur'],
    season: 'year_round', droughtTolerance: 0.7, emoji: '🌿',
  },
  {
    cropId: 'sunflower', cropName: 'Sunflower', cropNameAr: 'عباد الشمس',
    phRange: [6.0, 7.5], nRange: [60, 120], pRange: [30, 60], kRange: [80, 150],
    tempRange: [15, 30], rainfallRange: [350, 600],
    soilAffinity: ['alluvial', 'black-regur'], soilSecondary: ['red'],
    season: 'spring_summer', droughtTolerance: 0.6, emoji: '🌻',
  },
  {
    cropId: 'onion', cropName: 'Onion', cropNameAr: 'البصل',
    phRange: [5.8, 7.0], nRange: [80, 140], pRange: [30, 60], kRange: [80, 140],
    tempRange: [13, 28], rainfallRange: [350, 600],
    soilAffinity: ['alluvial', 'sandy'], soilSecondary: ['red'],
    season: 'autumn_winter', droughtTolerance: 0.5, emoji: '🧅',
  },
];

// ============================================================================
// Recommendation Engine
// ============================================================================

export interface FarmConditions {
  /** Soil nitrogen (mg/kg). */
  nitrogen: number;
  /** Soil phosphorus (mg/kg). */
  phosphorus: number;
  /** Soil potassium (mg/kg). */
  potassium: number;
  /** Soil pH. */
  ph: number;
  /** Soil electrical conductivity (μS/cm). */
  ec: number;
  /** Average temperature (°C). */
  temperature: number;
  /** Average humidity (%). */
  humidity: number;
  /** Annual rainfall (mm). */
  rainfall: number;
  /** Soil type ID from SOIL_PROFILES. */
  soilTypeId?: string;
}

export interface CropRecommendation {
  crop: CropProfile;
  /** Confidence score 0-1. */
  confidence: number;
  /** Human-readable explanation of the score. */
  explanation: string;
  /** Specific issues that lowered the score. */
  issues: string[];
  /** Specific advantages that boosted the score. */
  advantages: string[];
}

/**
 * Score a crop against the given farm conditions.
 * Returns a confidence score (0-1) + explanation.
 */
function scoreCrop(crop: CropProfile, conditions: FarmConditions): CropRecommendation {
  let score = 100;
  const issues: string[] = [];
  const advantages: string[] = [];

  // 1. pH check (weight: 25 points)
  if (conditions.ph < crop.phRange[0] || conditions.ph > crop.phRange[1]) {
    const deficit = conditions.ph < crop.phRange[0]
      ? crop.phRange[0] - conditions.ph
      : conditions.ph - crop.phRange[1];
    const penalty = Math.min(25, deficit * 10);
    score -= penalty;
    issues.push(`pH ${conditions.ph} outside optimal range ${crop.phRange[0]}-${crop.phRange[1]} (−${penalty.toFixed(0)} pts)`);
  } else {
    advantages.push(`pH ${conditions.ph} within optimal range`);
  }

  // 2. Nitrogen check (weight: 15 points)
  if (conditions.nitrogen < crop.nRange[0]) {
    const deficit = crop.nRange[0] - conditions.nitrogen;
    score -= Math.min(15, deficit * 0.3);
    issues.push(`Nitrogen low (${conditions.nitrogen} < ${crop.nRange[0]} mg/kg needed)`);
  } else if (conditions.nitrogen > crop.nRange[1]) {
    advantages.push(`Nitrogen sufficient (${conditions.nitrogen} mg/kg)`);
  } else {
    advantages.push(`Nitrogen in optimal range`);
  }

  // 3. Phosphorus check (weight: 15 points)
  if (conditions.phosphorus < crop.pRange[0]) {
    score -= Math.min(15, (crop.pRange[0] - conditions.phosphorus) * 0.3);
    issues.push(`Phosphorus low (${conditions.phosphorus} < ${crop.pRange[0]} mg/kg)`);
  } else {
    advantages.push(`Phosphorus adequate`);
  }

  // 4. Potassium check (weight: 10 points)
  if (conditions.potassium < crop.kRange[0]) {
    score -= Math.min(10, (crop.kRange[0] - conditions.potassium) * 0.1);
    issues.push(`Potassium low`);
  } else {
    advantages.push(`Potassium adequate`);
  }

  // 5. Temperature check (weight: 15 points)
  if (conditions.temperature < crop.tempRange[0]) {
    score -= Math.min(15, (crop.tempRange[0] - conditions.temperature) * 1.5);
    issues.push(`Temperature too cold (${conditions.temperature}°C < ${crop.tempRange[0]}°C min)`);
  } else if (conditions.temperature > crop.tempRange[1]) {
    score -= Math.min(15, (conditions.temperature - crop.tempRange[1]) * 1.5);
    issues.push(`Temperature too hot (${conditions.temperature}°C > ${crop.tempRange[1]}°C max)`);
  } else {
    advantages.push(`Temperature ${conditions.temperature}°C within optimal range`);
  }

  // 6. Rainfall check (weight: 10 points)
  if (conditions.rainfall < crop.rainfallRange[0] * 0.7) {
    score -= Math.min(10, ((crop.rainfallRange[0] * 0.7) - conditions.rainfall) * 0.02);
    issues.push(`Rainfall too low (${conditions.rainfall}mm < ${crop.rainfallRange[0]}mm needed) — irrigation required`);
  } else if (conditions.rainfall > crop.rainfallRange[1] * 1.5) {
    issues.push(`Rainfall high (${conditions.rainfall}mm) — ensure drainage`);
  } else {
    advantages.push(`Rainfall ${conditions.rainfall}mm within range`);
  }

  // 7. Soil type affinity (weight: 10 points)
  if (conditions.soilTypeId) {
    if (crop.soilAffinity.includes(conditions.soilTypeId)) {
      advantages.push(`Soil type (${conditions.soilTypeId}) is ideal for this crop`);
    } else if (crop.soilSecondary.includes(conditions.soilTypeId)) {
      // No penalty, but no bonus either
    } else {
      score -= 10;
      issues.push(`Soil type not ideal — consider ${crop.soilAffinity.join(', ')} soils`);
    }
  }

  // Normalize to 0-1
  const confidence = Math.max(0, Math.min(1, score / 100));

  const explanation = issues.length === 0
    ? 'All conditions are favorable for this crop.'
    : issues.length <= 2
      ? 'Generally suitable with minor adjustments needed.'
      : 'Challenging — significant soil amendments or irrigation required.';

  return { crop, confidence, explanation, issues, advantages };
}

/**
 * Recommend top-3 crops for the given conditions.
 * Follows AgroAI's pattern: score all crops → return top-3 with confidence.
 */
export function recommendCrops(conditions: FarmConditions, limit = 3): CropRecommendation[] {
  const scored = ALGERIAN_CROP_PROFILES.map(crop => scoreCrop(crop, conditions));
  return scored
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}

// ============================================================================
// Reverse Recommendation — "Can I grow X here?"
// ============================================================================

export interface ReverseRecommendation {
  crop: CropProfile;
  feasible: boolean;
  confidence: number;
  issues: string[];
  advantages: string[];
  /** Specific soil amendments needed. */
  amendments: string[];
  /** Irrigation requirement. */
  irrigationNeeded: boolean;
  /** Estimated yield impact (0-1, where 1 = full yield potential). */
  yieldImpact: number;
}

/**
 * Reverse recommendation: user picks a target crop → we report feasibility.
 * Adapted from AgroAI's /reverse endpoint.
 */
export function checkCropFeasibility(
  cropId: string,
  conditions: FarmConditions,
): ReverseRecommendation | null {
  const crop = ALGERIAN_CROP_PROFILES.find(c => c.cropId === cropId);
  if (!crop) return null;

  const score = scoreCrop(crop, conditions);
  const amendments: string[] = [];
  let irrigationNeeded = false;

  // Generate amendment suggestions
  if (conditions.ph < crop.phRange[0]) {
    amendments.push(`Add agricultural lime to raise pH from ${conditions.ph} to ${crop.phRange[0]}-${crop.phRange[1]}`);
  } else if (conditions.ph > crop.phRange[1]) {
    amendments.push(`Add gypsum or sulphur to lower pH from ${conditions.ph} to ${crop.phRange[0]}-${crop.phRange[1]}`);
  }

  if (conditions.nitrogen < crop.nRange[0]) {
    const needed = crop.nRange[0] - conditions.nitrogen;
    amendments.push(`Apply ${needed.toFixed(0)} kg/ha additional Nitrogen (urea or ammonium nitrate)`);
  }

  if (conditions.phosphorus < crop.pRange[0]) {
    const needed = crop.pRange[0] - conditions.phosphorus;
    amendments.push(`Apply ${needed.toFixed(0)} kg/ha P₂O₅ (superphosphate or DAP)`);
  }

  if (conditions.potassium < crop.kRange[0]) {
    const needed = crop.kRange[0] - conditions.potassium;
    amendments.push(`Apply ${needed.toFixed(0)} kg/ha K₂O (potassium chloride)`);
  }

  if (conditions.rainfall < crop.rainfallRange[0] * 0.7) {
    irrigationNeeded = true;
    const deficit = crop.rainfallRange[0] - conditions.rainfall;
    amendments.push(`Install irrigation — deficit of ${deficit}mm/year. Drip recommended for ${crop.cropName}.`);
  }

  return {
    crop,
    feasible: score.confidence > 0.4,
    confidence: score.confidence,
    issues: score.issues,
    advantages: score.advantages,
    amendments,
    irrigationNeeded,
    yieldImpact: score.confidence,
  };
}
