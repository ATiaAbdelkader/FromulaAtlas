/**
 * Soil Physics Profiles — adapted from AgroAI's SOIL_PROFILES
 * (https://github.com/Aniket-Asawale/AgroAI---AI-and-Automation-in-Agriculture)
 *
 * Each soil type defines physical properties that affect:
 *   - Irrigation scheduling (water retention + drainage rate)
 *   - Fertilizer recommendations (NPK baselines + pH)
 *   - EC / salinity risk assessment
 *
 * Used by:
 *   - Water Budget Optimizer — adjusts irrigation frequency/dose by soil type
 *   - Nutrient Budget Planner — adjusts NPK recommendations by soil baseline
 *   - Crop Recommendation Engine — matches crops to soil affinity
 *
 * Source: AgroAI MIT-licensed weather.py SOIL_PROFILES dict.
 * Extended with Algerian soil names (FR/AR).
 */

export interface SoilProfile {
  id: string;
  /** English name (matching AgroAI's keys for compatibility). */
  name: string;
  /** French name (used in Algeria). */
  nameFr: string;
  /** Arabic name. */
  nameAr: string;
  /** Short description. */
  description: string;
  descriptionAr: string;
  /** 0-1, how well soil holds moisture (higher = retains more). */
  waterRetention: number;
  /** 0-1, how fast water drains (higher = faster drainage). */
  drainageRate: number;
  /** Natural pH tendency. */
  phBase: number;
  /** Acceptable pH range [min, max]. */
  phRange: [number, number];
  /** Baseline electrical conductivity (μS/cm). */
  ecBase: number;
  /** EC range [min, max]. */
  ecRange: [number, number];
  /** Baseline Nitrogen (mg/kg). */
  nBase: number;
  /** Baseline Phosphorus (mg/kg). */
  pBase: number;
  /** Baseline Potassium (mg/kg). */
  kBase: number;
  /** Emoji for quick visual identification. */
  emoji: string;
  /** Color for UI chips/badges. */
  color: string;
}

export const SOIL_PROFILES: SoilProfile[] = [
  {
    id: 'alluvial',
    name: 'Alluvial',
    nameFr: 'Alluvial',
    nameAr: 'التربة الغرينية',
    description: 'Fertile river-deposited soil, good drainage & nutrient retention',
    descriptionAr: 'تربة خصبة من رواسب الأنهار، صرف وتغذية جيدين',
    waterRetention: 0.65,
    drainageRate: 0.6,
    phBase: 7.0,
    phRange: [6.5, 8.0],
    ecBase: 1100,
    ecRange: [400, 2200],
    nBase: 140, pBase: 90, kBase: 170,
    emoji: '🌾',
    color: '#8b6914',
  },
  {
    id: 'black-regur',
    name: 'Black (Regur)',
    nameFr: 'Noir (Regur)',
    nameAr: 'التربة السوداء',
    description: 'Clay-rich, high moisture retention, cracks when dry',
    descriptionAr: 'طينية غنية، احتفاظ عالي بالرطوبة، تتشقق عند الجفاف',
    waterRetention: 0.85,
    drainageRate: 0.3,
    phBase: 7.8,
    phRange: [7.0, 8.5],
    ecBase: 1400,
    ecRange: [600, 2800],
    nBase: 110, pBase: 70, kBase: 200,
    emoji: '⚫',
    color: '#1a1a1a',
  },
  {
    id: 'red',
    name: 'Red',
    nameFr: 'Rouge',
    nameAr: 'التربة الحمراء',
    description: 'Iron-rich, acidic, low fertility, porous',
    descriptionAr: 'غنية بالحديد، حمضية، خصوبة منخفضة، مسامية',
    waterRetention: 0.40,
    drainageRate: 0.75,
    phBase: 5.8,
    phRange: [4.5, 6.5],
    ecBase: 800,
    ecRange: [200, 1500],
    nBase: 80, pBase: 50, kBase: 100,
    emoji: '🔴',
    color: '#b91c1c',
  },
  {
    id: 'laterite',
    name: 'Laterite',
    nameFr: 'Latéritique',
    nameAr: 'التربة اللاتيريتية',
    description: 'Leached tropical soil, low nutrients, acidic',
    descriptionAr: 'تربة منقعية استوائية، عناصر منخفضة، حمضية',
    waterRetention: 0.35,
    drainageRate: 0.80,
    phBase: 5.5,
    phRange: [4.5, 6.0],
    ecBase: 600,
    ecRange: [150, 1200],
    nBase: 60, pBase: 40, kBase: 80,
    emoji: '🟤',
    color: '#92400e',
  },
  {
    id: 'sandy',
    name: 'Sandy',
    nameFr: 'Sableux',
    nameAr: 'التربة الرملية',
    description: 'Coarse-grained, very low retention, drains fast',
    descriptionAr: 'خشن الحبيبات، احتفاظ منخفض جداً، صرف سريع',
    waterRetention: 0.20,
    drainageRate: 0.90,
    phBase: 6.5,
    phRange: [5.5, 7.5],
    ecBase: 500,
    ecRange: [100, 1000],
    nBase: 50, pBase: 30, kBase: 60,
    emoji: '🟡',
    color: '#d4a017',
  },
  {
    id: 'clay',
    name: 'Clay',
    nameFr: 'Argileux',
    nameAr: 'التربة الطينية',
    description: 'Fine-grained, very high retention, poor drainage',
    descriptionAr: 'ناعم الحبيبات، احتفاظ عالي جداً، صرف ضعيف',
    waterRetention: 0.90,
    drainageRate: 0.20,
    phBase: 7.2,
    phRange: [6.5, 8.5],
    ecBase: 1500,
    ecRange: [700, 3000],
    nBase: 130, pBase: 80, kBase: 180,
    emoji: '🟠',
    color: '#c2410c',
  },
];

/** Get a soil profile by ID. */
export function getSoilProfile(id: string): SoilProfile | undefined {
  return SOIL_PROFILES.find(s => s.id === id);
}

/**
 * Compute an irrigation adjustment factor based on soil type.
 * Sandy soil needs more frequent, smaller irrigations.
 * Clay soil needs less frequent, larger irrigations.
 *
 * @returns { frequencyMultiplier, doseMultiplier }
 *   frequencyMultiplier: how many times more often to irrigate (1 = normal)
 *   doseMultiplier: what fraction of the normal dose per irrigation (1 = full dose)
 *
 * Example: Sandy soil → { frequency: 2.5, dose: 0.4 }
 *   → irrigate 2.5× more often, but with 40% of the normal dose each time.
 */
export function getIrrigationAdjustment(soilId: string): { frequencyMultiplier: number; doseMultiplier: number } {
  const soil = getSoilProfile(soilId);
  if (!soil) return { frequencyMultiplier: 1, doseMultiplier: 1 };

  // Low retention (sandy) → frequent small doses
  // High retention (clay) → infrequent large doses
  const retention = soil.waterRetention; // 0.2 (sandy) to 0.9 (clay)
  const frequencyMultiplier = 1 / (retention * 1.5 + 0.1); // sandy: ~3.2, clay: ~0.7
  const doseMultiplier = retention * 1.2 + 0.3; // sandy: ~0.54, clay: ~1.38

  return {
    frequencyMultiplier: Math.round(frequencyMultiplier * 10) / 10,
    doseMultiplier: Math.round(doseMultiplier * 10) / 10,
  };
}

/**
 * Check if a soil's pH is within a crop's acceptable range.
 * @returns 'optimal' | 'marginal' | 'unsuitable'
 */
export function checkSoilPHForCrop(
  soilId: string,
  cropPHRange: [number, number],
): 'optimal' | 'marginal' | 'unsuitable' {
  const soil = getSoilProfile(soilId);
  if (!soil) return 'optimal';

  const [cropMin, cropMax] = cropPHRange;
  const [soilMin, soilMax] = soil.phRange;

  // Check overlap
  if (soilMax < cropMin || soilMin > cropMax) return 'unsuitable';
  // Check if soil pH base is within crop range
  if (soil.phBase >= cropMin && soil.phBase <= cropMax) return 'optimal';
  return 'marginal';
}
