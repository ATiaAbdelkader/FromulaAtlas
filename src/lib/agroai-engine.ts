/**
 * AgroAI Intelligence Engine
 * Inspired by AgroAI (AI & Automation in Agriculture)
 *
 * Implements:
 * 1. Chemical Usage & Human Health Impact Tracker (WHO classes, REI, PHI, PPE, Ecotox)
 * 2. Multi-Factor Bio-Climatic & Edaphic Crop Suitability Forecaster (Maas-Hoffman, GDD, pH, Frost, Water balance)
 * 3. Autonomous Multi-Agent Remediation Planner (Diagnostic agent, Bio-Control agent, Chemical prescriber, Economic/Safety evaluator)
 */

export interface ChemicalSubstance {
  id: string;
  tradeName: string;
  activeSubstance: string;
  category: 'insecticide' | 'fungicide' | 'herbicide' | 'acaricide' | 'nematicide' | 'bio-pesticide';
  whoClass: 'Ia' | 'Ib' | 'II' | 'III' | 'U';
  whoClassLabel: { en: string; fr: string; ar: string };
  whoColor: string; // hex
  reiHours: number; // Re-Entry Interval in hours
  phiDays: number; // Pre-Harvest Interval (DAR) in days
  oralLd50MgKg: number; // Acute oral toxicity (mg/kg)
  dermalLd50MgKg: number; // Acute dermal toxicity (mg/kg)
  beeToxicity: 'high' | 'moderate' | 'low' | 'non_toxic';
  aquaticToxicity: 'very_high' | 'high' | 'moderate' | 'low';
  soilPersistenceHalfLifeDays: number; // DT50 in days
  leachingPotentialKoc: number; // Adsorption coefficient (mL/g)
  iracFracHracCode: string;
  recommendedDosePerHa: string;
  mandatoryPpe: {
    respirator: 'none' | 'FFP2' | 'FFP3' | 'A2P3_gas_particulate' | 'supplied_air';
    gloves: 'nitrile_400' | 'neoprene' | 'butyl';
    bodySuit: 'cotton_standard' | 'type_6_spray' | 'type_4_liquid_tight' | 'type_3_heavy';
    eyeProtection: 'safety_glasses' | 'sealed_goggles' | 'full_face_shield';
    footwear: 'leather_boots' | 'nitrile_chemical_boots';
  };
  humanHealthHazards: string[];
  safeSprayingConditions: {
    maxWindSpeedKmh: number;
    maxTempC: number;
    minHumidityPct: number;
    idealDeltaT: { min: number; max: number };
  };
  algerianRegistered: boolean;
}

export const AGROAI_CHEMICAL_DATABASE: ChemicalSubstance[] = [
  {
    id: 'deltamethrin',
    tradeName: 'Decis 25 EC / Deltamethrine',
    activeSubstance: 'Deltamethrin (25 g/L)',
    category: 'insecticide',
    whoClass: 'II',
    whoClassLabel: { en: 'Class II - Moderately Hazardous', fr: 'Classe II - Modérément Dangereux', ar: 'الفئة II - متوسط الخطورة' },
    whoColor: '#f59e0b',
    reiHours: 24,
    phiDays: 3,
    oralLd50MgKg: 135,
    dermalLd50MgKg: 2000,
    beeToxicity: 'high',
    aquaticToxicity: 'very_high',
    soilPersistenceHalfLifeDays: 25,
    leachingPotentialKoc: 10240,
    iracFracHracCode: 'IRAC 3A (Pyrethroids)',
    recommendedDosePerHa: '300 - 500 mL/ha',
    mandatoryPpe: {
      respirator: 'A2P3_gas_particulate',
      gloves: 'nitrile_400',
      bodySuit: 'type_4_liquid_tight',
      eyeProtection: 'sealed_goggles',
      footwear: 'nitrile_chemical_boots',
    },
    humanHealthHazards: [
      'Skin tingling & facial paresthesia upon direct vapor contact',
      'Eye and upper respiratory tract irritation',
      'Neurotoxic risk in high concentration without A2P3 respirator',
    ],
    safeSprayingConditions: {
      maxWindSpeedKmh: 12,
      maxTempC: 25,
      minHumidityPct: 50,
      idealDeltaT: { min: 2, max: 8 },
    },
    algerianRegistered: true,
  },
  {
    id: 'chlorantraniliprole',
    tradeName: 'Coragen 20 SC / Voliam',
    activeSubstance: 'Chlorantraniliprole (200 g/L)',
    category: 'insecticide',
    whoClass: 'U',
    whoClassLabel: { en: 'Class U - Unlikely Acute Hazard', fr: 'Classe U - Peu Susceptible de Danger Aigu', ar: 'الفئة U - غير ضار حاد' },
    whoColor: '#10b981',
    reiHours: 4,
    phiDays: 1,
    oralLd50MgKg: 5000,
    dermalLd50MgKg: 5000,
    beeToxicity: 'low',
    aquaticToxicity: 'moderate',
    soilPersistenceHalfLifeDays: 180,
    leachingPotentialKoc: 328,
    iracFracHracCode: 'IRAC 28 (Diamides / Ryanodine)',
    recommendedDosePerHa: '150 - 200 mL/ha',
    mandatoryPpe: {
      respirator: 'FFP2',
      gloves: 'nitrile_400',
      bodySuit: 'type_6_spray',
      eyeProtection: 'safety_glasses',
      footwear: 'nitrile_chemical_boots',
    },
    humanHealthHazards: [
      'Very low mammalian toxicity',
      'Mild eye irritation if splashed directly',
    ],
    safeSprayingConditions: {
      maxWindSpeedKmh: 15,
      maxTempC: 28,
      minHumidityPct: 40,
      idealDeltaT: { min: 2, max: 10 },
    },
    algerianRegistered: true,
  },
  {
    id: 'abamectin',
    tradeName: 'Vertimec 018 EC / Acaristop',
    activeSubstance: 'Abamectin (18 g/L)',
    category: 'acaricide',
    whoClass: 'Ib',
    whoClassLabel: { en: 'Class Ib - Highly Hazardous', fr: 'Classe Ib - Très Dangereux', ar: 'الفئة Ib - عالي الخطورة' },
    whoColor: '#ef4444',
    reiHours: 48,
    phiDays: 7,
    oralLd50MgKg: 10,
    dermalLd50MgKg: 330,
    beeToxicity: 'high',
    aquaticToxicity: 'very_high',
    soilPersistenceHalfLifeDays: 14,
    leachingPotentialKoc: 4000,
    iracFracHracCode: 'IRAC 6 (Avermectins)',
    recommendedDosePerHa: '500 - 750 mL/ha',
    mandatoryPpe: {
      respirator: 'A2P3_gas_particulate',
      gloves: 'butyl',
      bodySuit: 'type_4_liquid_tight',
      eyeProtection: 'full_face_shield',
      footwear: 'nitrile_chemical_boots',
    },
    humanHealthHazards: [
      'Severe central nervous system depressant (GABA enhancer)',
      'High dermal absorption rate through skin and mucous membranes',
      'Strict exclusion of pregnant and lactating operators',
    ],
    safeSprayingConditions: {
      maxWindSpeedKmh: 10,
      maxTempC: 24,
      minHumidityPct: 55,
      idealDeltaT: { min: 2, max: 6 },
    },
    algerianRegistered: true,
  },
  {
    id: 'mancozeb',
    tradeName: 'Dithane M-45 / Manzate',
    activeSubstance: 'Mancozeb (80% WP)',
    category: 'fungicide',
    whoClass: 'U',
    whoClassLabel: { en: 'Class U - Unlikely Acute Hazard', fr: 'Classe U - Peu Susceptible de Danger Aigu', ar: 'الفئة U - غير ضار حاد' },
    whoColor: '#10b981',
    reiHours: 24,
    phiDays: 14,
    oralLd50MgKg: 5000,
    dermalLd50MgKg: 10000,
    beeToxicity: 'low',
    aquaticToxicity: 'high',
    soilPersistenceHalfLifeDays: 3,
    leachingPotentialKoc: 998,
    iracFracHracCode: 'FRAC M03 (Dithiocarbamates)',
    recommendedDosePerHa: '2.0 - 2.5 kg/ha',
    mandatoryPpe: {
      respirator: 'FFP3',
      gloves: 'nitrile_400',
      bodySuit: 'type_6_spray',
      eyeProtection: 'sealed_goggles',
      footwear: 'nitrile_chemical_boots',
    },
    humanHealthHazards: [
      'Potential endocrine disruptor via ETU metabolite (Ethylenethiourea)',
      'Thyroid hormone modulation on repeated long-term exposure',
      'Skin and respiratory sensitization with powder inhalation',
    ],
    safeSprayingConditions: {
      maxWindSpeedKmh: 12,
      maxTempC: 26,
      minHumidityPct: 45,
      idealDeltaT: { min: 2, max: 8 },
    },
    algerianRegistered: true,
  },
  {
    id: 'azoxystrobin',
    tradeName: 'Amistar 250 SC / Quadris',
    activeSubstance: 'Azoxystrobin (250 g/L)',
    category: 'fungicide',
    whoClass: 'III',
    whoClassLabel: { en: 'Class III - Slightly Hazardous', fr: 'Classe III - Légèrement Dangereux', ar: 'الفئة III - قليل الخطورة' },
    whoColor: '#3b82f6',
    reiHours: 12,
    phiDays: 3,
    oralLd50MgKg: 5000,
    dermalLd50MgKg: 4000,
    beeToxicity: 'low',
    aquaticToxicity: 'very_high',
    soilPersistenceHalfLifeDays: 89,
    leachingPotentialKoc: 423,
    iracFracHracCode: 'FRAC 11 (QoI / Strobilurins)',
    recommendedDosePerHa: '0.8 - 1.0 L/ha',
    mandatoryPpe: {
      respirator: 'FFP2',
      gloves: 'nitrile_400',
      bodySuit: 'type_6_spray',
      eyeProtection: 'safety_glasses',
      footwear: 'nitrile_chemical_boots',
    },
    humanHealthHazards: [
      'Moderate skin and eye irritation',
      'Extremely toxic to freshwater fish and aquatic invertebrates',
    ],
    safeSprayingConditions: {
      maxWindSpeedKmh: 14,
      maxTempC: 28,
      minHumidityPct: 40,
      idealDeltaT: { min: 2, max: 8 },
    },
    algerianRegistered: true,
  },
  {
    id: 'bacillus_thuringiensis',
    tradeName: 'Dipel 2X / Bactospeine',
    activeSubstance: 'Bacillus thuringiensis kurstaki (32,000 UI/mg)',
    category: 'bio-pesticide',
    whoClass: 'U',
    whoClassLabel: { en: 'Class U - Bio-Control Biological', fr: 'Classe U - Bio-Contrôle Biologique', ar: 'الفئة U - مكافحة بيولوجية' },
    whoColor: '#059669',
    reiHours: 4,
    phiDays: 0,
    oralLd50MgKg: 5000,
    dermalLd50MgKg: 5000,
    beeToxicity: 'non_toxic',
    aquaticToxicity: 'low',
    soilPersistenceHalfLifeDays: 4,
    leachingPotentialKoc: 80,
    iracFracHracCode: 'IRAC 11A (Bt Microbials)',
    recommendedDosePerHa: '0.75 - 1.0 kg/ha',
    mandatoryPpe: {
      respirator: 'FFP2',
      gloves: 'nitrile_400',
      bodySuit: 'cotton_standard',
      eyeProtection: 'safety_glasses',
      footwear: 'leather_boots',
    },
    humanHealthHazards: [
      'Non-toxic to humans and mammals',
      'Mild aerosol irritation from particulate dust',
    ],
    safeSprayingConditions: {
      maxWindSpeedKmh: 15,
      maxTempC: 30,
      minHumidityPct: 50,
      idealDeltaT: { min: 2, max: 10 },
    },
    algerianRegistered: true,
  },
  {
    id: 'glyphosate',
    tradeName: 'Roundup Ultra / Glyphogan 360',
    activeSubstance: 'Glyphosate (360 g/L acid equiv.)',
    category: 'herbicide',
    whoClass: 'III',
    whoClassLabel: { en: 'Class III - Slightly Hazardous', fr: 'Classe III - Légèrement Dangereux', ar: 'الفئة III - قليل الخطورة' },
    whoColor: '#3b82f6',
    reiHours: 24,
    phiDays: 30,
    oralLd50MgKg: 5600,
    dermalLd50MgKg: 5000,
    beeToxicity: 'low',
    aquaticToxicity: 'moderate',
    soilPersistenceHalfLifeDays: 47,
    leachingPotentialKoc: 24000,
    iracFracHracCode: 'HRAC 9 (EPSP synthase inhibitor)',
    recommendedDosePerHa: '3.0 - 5.0 L/ha',
    mandatoryPpe: {
      respirator: 'FFP2',
      gloves: 'nitrile_400',
      bodySuit: 'type_6_spray',
      eyeProtection: 'sealed_goggles',
      footwear: 'nitrile_chemical_boots',
    },
    humanHealthHazards: [
      'IARC Group 2A classification (probably carcinogenic to humans)',
      'Severe eye irritant if concentrated surfactant contacts cornea',
      'Surfactants (POEA) can cause mucosal erosion',
    ],
    safeSprayingConditions: {
      maxWindSpeedKmh: 10,
      maxTempC: 24,
      minHumidityPct: 50,
      idealDeltaT: { min: 2, max: 6 },
    },
    algerianRegistered: true,
  },
];

/* ========================================================================= */
/* 2. MULTI-FACTOR CROP SUITABILITY & PRODUCTIVITY MODEL (Maas-Hoffman + GDD) */
/* ========================================================================= */

export interface CropBioclimaticProfile {
  cropId: string;
  name: { en: string; fr: string; ar: string };
  emoji: string;
  category: 'cereal' | 'vegetable' | 'fruit_tree' | 'legume' | 'forage';
  
  // Maas-Hoffman Salinity Parameters
  // Yield loss formula: Y = 100 - b * (ECe - a) when ECe > a
  salinityThresholdA: number; // 'a' in dS/m (threshold without yield loss)
  salinitySlopeB: number; // 'b' in % yield loss per dS/m above threshold
  salinityMaxTolerance: number; // 50% yield loss ECe
  
  // Soil Edaphic Bounds
  optimalPh: { min: number; max: number };
  absolutePh: { min: number; max: number };
  maxActiveLimestonePct: number; // CaCO3 actif max % before chlorosis
  preferredTextures: Array<'sand' | 'sandy_loam' | 'loam' | 'clay_loam' | 'clay'>;

  // Thermal & GDD Requirements
  baseTempC: number; // Tb (°C)
  optTempMinC: number;
  optTempMaxC: number;
  maxTempC: number;
  requiredGddTotal: number; // GDD sum base Tb
  chillingHoursRequired: number; // Hours below 7.2°C (dormancy break)
  frostSensitivity: 'very_high' | 'high' | 'moderate' | 'tolerant';
  siroccoVulnerability: 'extreme' | 'high' | 'moderate' | 'tolerant';

  // Hydrological balance
  waterReqMmPerCycle: number;
  kcStages: { initial: number; mid: number; end: number };
  targetYieldPotentialTonsHa: number;
}

export const AGROAI_CROP_PROFILES: CropBioclimaticProfile[] = [
  {
    cropId: 'durum_wheat',
    name: { en: 'Durum Wheat (Blé Dur)', fr: 'Blé Dur (Triticum durum)', ar: 'القمح الصلب' },
    emoji: '🌾',
    category: 'cereal',
    salinityThresholdA: 5.9,
    salinitySlopeB: 3.8,
    salinityMaxTolerance: 13.0,
    optimalPh: { min: 6.5, max: 8.2 },
    absolutePh: { min: 5.5, max: 8.8 },
    maxActiveLimestonePct: 15,
    preferredTextures: ['clay_loam', 'loam', 'clay'],
    baseTempC: 4.0,
    optTempMinC: 15,
    optTempMaxC: 24,
    maxTempC: 32,
    requiredGddTotal: 1950,
    chillingHoursRequired: 200,
    frostSensitivity: 'high', // At heading/anthesis
    siroccoVulnerability: 'extreme', // Grain filling scorching
    waterReqMmPerCycle: 420,
    kcStages: { initial: 0.35, mid: 1.15, end: 0.3 },
    targetYieldPotentialTonsHa: 6.5,
  },
  {
    cropId: 'tomato_open',
    name: { en: 'Field Tomato (Tomate Plein Champ)', fr: 'Tomate de Plein Champ', ar: 'طماطم الحقل المفتوح' },
    emoji: '🍅',
    category: 'vegetable',
    salinityThresholdA: 2.5,
    salinitySlopeB: 9.9,
    salinityMaxTolerance: 7.6,
    optimalPh: { min: 6.0, max: 7.5 },
    absolutePh: { min: 5.5, max: 8.2 },
    maxActiveLimestonePct: 10,
    preferredTextures: ['sandy_loam', 'loam', 'clay_loam'],
    baseTempC: 10.0,
    optTempMinC: 20,
    optTempMaxC: 28,
    maxTempC: 36,
    requiredGddTotal: 1450,
    chillingHoursRequired: 0,
    frostSensitivity: 'very_high',
    siroccoVulnerability: 'high',
    waterReqMmPerCycle: 650,
    kcStages: { initial: 0.45, mid: 1.15, end: 0.75 },
    targetYieldPotentialTonsHa: 75.0,
  },
  {
    cropId: 'olive_tree',
    name: { en: 'Olive Grove (Olivier)', fr: 'Olivier (Olea europaea)', ar: 'أشجار الزيتون' },
    emoji: '🫒',
    category: 'fruit_tree',
    salinityThresholdA: 2.7,
    salinitySlopeB: 6.2,
    salinityMaxTolerance: 8.5,
    optimalPh: { min: 6.5, max: 8.5 },
    absolutePh: { min: 5.5, max: 9.0 },
    maxActiveLimestonePct: 20,
    preferredTextures: ['loam', 'sandy_loam', 'clay_loam'],
    baseTempC: 7.0,
    optTempMinC: 22,
    optTempMaxC: 30,
    maxTempC: 42,
    requiredGddTotal: 2800,
    chillingHoursRequired: 350,
    frostSensitivity: 'moderate',
    siroccoVulnerability: 'moderate',
    waterReqMmPerCycle: 550,
    kcStages: { initial: 0.65, mid: 0.7, end: 0.65 },
    targetYieldPotentialTonsHa: 8.0,
  },
  {
    cropId: 'potato_season',
    name: { en: 'Potato (Pomme de Terre)', fr: 'Pomme de Terre (Saison)', ar: 'البطاطا الموسمية' },
    emoji: '🥔',
    category: 'vegetable',
    salinityThresholdA: 1.7,
    salinitySlopeB: 12.0,
    salinityMaxTolerance: 5.9,
    optimalPh: { min: 5.5, max: 7.2 },
    absolutePh: { min: 5.0, max: 8.0 },
    maxActiveLimestonePct: 8,
    preferredTextures: ['sandy_loam', 'loam', 'sand'],
    baseTempC: 6.0,
    optTempMinC: 16,
    optTempMaxC: 22,
    maxTempC: 30,
    requiredGddTotal: 1200,
    chillingHoursRequired: 0,
    frostSensitivity: 'very_high',
    siroccoVulnerability: 'extreme',
    waterReqMmPerCycle: 500,
    kcStages: { initial: 0.45, mid: 1.15, end: 0.7 },
    targetYieldPotentialTonsHa: 38.0,
  },
  {
    cropId: 'date_palm',
    name: { en: 'Date Palm (Palmier Dattier - Deglet Nour)', fr: 'Palmier Dattier (Deglet Nour)', ar: 'نخيل التمر (دقلة نور)' },
    emoji: '🌴',
    category: 'fruit_tree',
    salinityThresholdA: 4.0,
    salinitySlopeB: 3.6,
    salinityMaxTolerance: 18.0,
    optimalPh: { min: 6.5, max: 8.5 },
    absolutePh: { min: 6.0, max: 9.2 },
    maxActiveLimestonePct: 25,
    preferredTextures: ['sand', 'sandy_loam', 'loam'],
    baseTempC: 18.0,
    optTempMinC: 30,
    optTempMaxC: 42,
    maxTempC: 50,
    requiredGddTotal: 3400,
    chillingHoursRequired: 0,
    frostSensitivity: 'moderate',
    siroccoVulnerability: 'tolerant',
    waterReqMmPerCycle: 1400,
    kcStages: { initial: 0.8, mid: 0.95, end: 0.8 },
    targetYieldPotentialTonsHa: 10.0,
  },
  {
    cropId: 'citrus_clementine',
    name: { en: 'Clementine / Citrus (Agrumes)', fr: 'Clémentinier / Agrumes', ar: 'الحمضيات / الكليمونتين' },
    emoji: '🍊',
    category: 'fruit_tree',
    salinityThresholdA: 1.7,
    salinitySlopeB: 16.0,
    salinityMaxTolerance: 4.8,
    optimalPh: { min: 6.0, max: 7.5 },
    absolutePh: { min: 5.5, max: 8.2 },
    maxActiveLimestonePct: 7,
    preferredTextures: ['sandy_loam', 'loam'],
    baseTempC: 13.0,
    optTempMinC: 22,
    optTempMaxC: 30,
    maxTempC: 38,
    requiredGddTotal: 2200,
    chillingHoursRequired: 100,
    frostSensitivity: 'high',
    siroccoVulnerability: 'high',
    waterReqMmPerCycle: 900,
    kcStages: { initial: 0.7, mid: 0.7, end: 0.7 },
    targetYieldPotentialTonsHa: 28.0,
  },
];

export interface SuitabilityCalculationInput {
  cropId: string;
  soilEceDsm: number;
  soilPh: number;
  activeCaCO3Pct: number;
  soilTexture: 'sand' | 'sandy_loam' | 'loam' | 'clay_loam' | 'clay';
  availableGdd: number;
  annualRainfallPlusIrrigationMm: number;
  springFrostRisk: 'none' | 'low' | 'moderate' | 'high';
  siroccoRisk: 'none' | 'low' | 'moderate' | 'extreme';
}

export interface SuitabilityScoreBreakdown {
  overallScorePct: number; // 0 - 100
  status: 'highly_suitable' | 'suitable' | 'marginally_suitable' | 'not_suitable';
  statusLabel: { en: string; fr: string; ar: string };
  salinityYieldPotentialPct: number; // Maas-Hoffman yield %
  phScorePct: number;
  limestoneScorePct: number;
  textureScorePct: number;
  thermalScorePct: number;
  waterScorePct: number;
  climateRiskPenaltyPct: number;
  limitingFactors: string[];
  agronomicMitigations: string[];
  expectedYieldTonsHa: number;
}

export function computeCropSuitability(
  input: SuitabilityCalculationInput
): SuitabilityScoreBreakdown {
  const profile = AGROAI_CROP_PROFILES.find((c) => c.cropId === input.cropId) || AGROAI_CROP_PROFILES[0];
  const limitingFactors: string[] = [];
  const mitigations: string[] = [];

  // 1. Maas-Hoffman Salinity Model
  let salinityYieldPct = 100;
  if (input.soilEceDsm > profile.salinityThresholdA) {
    const excess = input.soilEceDsm - profile.salinityThresholdA;
    salinityYieldPct = Math.max(0, 100 - profile.salinitySlopeB * excess);
    if (salinityYieldPct < 80) {
      limitingFactors.push(`Soil salinity (${input.soilEceDsm} dS/m) exceeds threshold of ${profile.salinityThresholdA} dS/m`);
      mitigations.push(`Apply leaching fraction (+15% irrigation) and humic acid to mitigate sodium toxicity`);
    }
  }

  // 2. Soil pH Scoring
  let phScore = 100;
  if (input.soilPh < profile.optimalPh.min || input.soilPh > profile.optimalPh.max) {
    if (input.soilPh < profile.absolutePh.min || input.soilPh > profile.absolutePh.max) {
      phScore = 30;
      limitingFactors.push(`Soil pH (${input.soilPh}) is outside tolerable physiological range (${profile.absolutePh.min}-${profile.absolutePh.max})`);
    } else {
      phScore = 75;
      limitingFactors.push(`Soil pH (${input.soilPh}) is outside optimum (${profile.optimalPh.min}-${profile.optimalPh.max})`);
      if (input.soilPh > 8.0) mitigations.push(`Use acidifying fertilizers (Ammonium sulfate, Urea phosphate) and chelated iron EDDHA`);
    }
  }

  // 3. Active Limestone (CaCO3 actif)
  let limestoneScore = 100;
  if (input.activeCaCO3Pct > profile.maxActiveLimestonePct) {
    const diff = input.activeCaCO3Pct - profile.maxActiveLimestonePct;
    limestoneScore = Math.max(20, 100 - diff * 5);
    limitingFactors.push(`Active limestone (${input.activeCaCO3Pct}%) exceeds chlorosis threshold (${profile.maxActiveLimestonePct}%)`);
    mitigations.push(`Apply Fe-EDDHA root drench (ortho-ortho isomer >4.8%) to prevent ferric chlorosis`);
  }

  // 4. Texture Suitability
  let textureScore = profile.preferredTextures.includes(input.soilTexture) ? 100 : 70;
  if (textureScore < 100) {
    limitingFactors.push(`Soil texture '${input.soilTexture}' is sub-optimal for root aeration and drainage`);
  }

  // 5. Thermal & GDD
  let thermalScore = 100;
  if (input.availableGdd < profile.requiredGddTotal) {
    const ratio = input.availableGdd / profile.requiredGddTotal;
    thermalScore = Math.max(30, Math.round(ratio * 100));
    limitingFactors.push(`Accumulated GDD (${input.availableGdd}°C-days) is below required ${profile.requiredGddTotal}°C-days`);
  }

  // 6. Water Balance
  let waterScore = 100;
  if (input.annualRainfallPlusIrrigationMm < profile.waterReqMmPerCycle) {
    const ratio = input.annualRainfallPlusIrrigationMm / profile.waterReqMmPerCycle;
    waterScore = Math.max(20, Math.round(ratio * 100));
    limitingFactors.push(`Water budget (${input.annualRainfallPlusIrrigationMm} mm) under-meets crop requirement (${profile.waterReqMmPerCycle} mm)`);
    mitigations.push(`Adopt precision drip irrigation with deficit irrigation scheduling at vegetative stages`);
  }

  // 7. Climate Risk Penalties
  let riskPenalty = 0;
  if (input.springFrostRisk === 'high' && (profile.frostSensitivity === 'very_high' || profile.frostSensitivity === 'high')) {
    riskPenalty += 20;
    limitingFactors.push(`High spring frost risk during sensitive phenological stage`);
    mitigations.push(`Equip anti-frost aspersion or delay sowing date by 15 days`);
  } else if (input.springFrostRisk === 'moderate' && profile.frostSensitivity === 'very_high') {
    riskPenalty += 10;
  }

  if (input.siroccoRisk === 'extreme' && (profile.siroccoVulnerability === 'extreme' || profile.siroccoVulnerability === 'high')) {
    riskPenalty += 15;
    limitingFactors.push(`Extreme Sirocco heatwave hazard during flowering/grain fill`);
    mitigations.push(`Establish windbreaks (Cypress/Casuarina) and foliar potassium silicate protection`);
  }

  // Aggregate weighted score
  const edaphicScore = (salinityYieldPct * 0.45) + (phScore * 0.25) + (limestoneScore * 0.15) + (textureScore * 0.15);
  const rawScore = (edaphicScore * 0.45) + (thermalScore * 0.25) + (waterScore * 0.30) - riskPenalty;
  const overallScorePct = Math.max(5, Math.min(100, Math.round(rawScore)));

  let status: SuitabilityScoreBreakdown['status'] = 'highly_suitable';
  let statusLabel = { en: 'Highly Suitable (S1)', fr: 'Très Favorable (S1)', ar: 'ملائم جداً (S1)' };

  if (overallScorePct < 40) {
    status = 'not_suitable';
    statusLabel = { en: 'Not Suitable (N)', fr: 'Non Adapté (N)', ar: 'غير ملائم (N)' };
  } else if (overallScorePct < 65) {
    status = 'marginally_suitable';
    statusLabel = { en: 'Marginally Suitable (S3)', fr: 'Marginalement Adapté (S3)', ar: 'ملائم هامشياً (S3)' };
  } else if (overallScorePct < 85) {
    status = 'suitable';
    statusLabel = { en: 'Moderately Suitable (S2)', fr: 'Moyennement Adapté (S2)', ar: 'ملائم باعتدال (S2)' };
  }

  const expectedYieldTonsHa = parseFloat(((profile.targetYieldPotentialTonsHa * overallScorePct) / 100).toFixed(2));

  return {
    overallScorePct,
    status,
    statusLabel,
    salinityYieldPotentialPct: parseFloat(salinityYieldPct.toFixed(1)),
    phScorePct: phScore,
    limestoneScorePct: limestoneScore,
    textureScorePct: textureScore,
    thermalScorePct: thermalScore,
    waterScorePct: waterScore,
    climateRiskPenaltyPct: riskPenalty,
    limitingFactors,
    agronomicMitigations: mitigations,
    expectedYieldTonsHa,
  };
}

/* ========================================================================= */
/* 3. AUTONOMOUS MULTI-AGENT REMEDIATION PLANNER                             */
/* ========================================================================= */

export interface PestProblemSpec {
  id: string;
  name: { en: string; fr: string; ar: string };
  scientificName: string;
  category: 'insect' | 'fungus' | 'bacterium' | 'virus' | 'deficiency' | 'nematode';
  cropsAffected: string[];
  economicThresholdDescription: string;
  diagnosticHallmarks: string[];
  organicProtocol: {
    title: string;
    bioAgents: string[];
    dosage: string;
    applicationMethod: string;
    safetyLevel: 'safe' | 'minimal_ppe';
    costDzdPerHa: number;
    delayToActHours: number;
  };
  chemicalProtocol: {
    title: string;
    activeSubstance: string;
    commercialProduct: string;
    iracFracGroup: string;
    dosagePerHa: string;
    waterVolumeLPerHa: number;
    reiHours: number;
    phiDays: number;
    whoToxClass: 'Ia' | 'Ib' | 'II' | 'III' | 'U';
    costDzdPerHa: number;
  };
}

export const AGROAI_PEST_DATABASE: PestProblemSpec[] = [
  {
    id: 'tuta_absoluta',
    name: { en: 'Tomato Leafminer (Tuta absoluta)', fr: 'Mineuse de la Tomate (Tuta absoluta)', ar: 'حافرة أنفاق الطماطم (توتا أبسولوتا)' },
    scientificName: 'Tuta absoluta',
    category: 'insect',
    cropsAffected: ['tomato_open', 'potato_season', 'eggplant'],
    economicThresholdDescription: '3 adults per delta pheromone trap / week or 1 active leaf gallery per 5 plants',
    diagnosticHallmarks: [
      'Irregular transparent leaf blotches/blisters with dark frass inside',
      'Stem and apical shoot tunneling causing wilting',
      'Pin-sized entry holes near calyx on developing fruit',
    ],
    organicProtocol: {
      title: 'Integrated Bio-Management & Pheromone Disruption',
      bioAgents: ['Bacillus thuringiensis kurstaki (Bactospeine 1kg/ha)', 'Azadirachtin (Neem Oil 0.3%)', 'Pheromone Mass Trapping (Tutatrack)'],
      dosage: 'Bt: 1.0 kg/ha + Neem: 2.5 L/ha in 400L water',
      applicationMethod: 'Targeted evening spraying + installation of 25 delta water pheromone traps/ha',
      safetyLevel: 'safe',
      costDzdPerHa: 14500,
      delayToActHours: 12,
    },
    chemicalProtocol: {
      title: 'Targeted Diamide / Spinosyn Treatment (Rotation)',
      activeSubstance: 'Chlorantraniliprole (200 g/L) OR Emamectin benzoate (50 g/kg)',
      commercialProduct: 'Coragen 20 SC (175 mL/ha) or Affirm 095 SG (1.5 kg/ha)',
      iracFracGroup: 'IRAC 28 (Diamides) / IRAC 6 (Avermectins)',
      dosagePerHa: '175 mL/ha in 500L water',
      waterVolumeLPerHa: 500,
      reiHours: 4,
      phiDays: 1,
      whoToxClass: 'U',
      costDzdPerHa: 18500,
    },
  },
  {
    id: 'phytophthora_infestans',
    name: { en: 'Late Blight (Mildiou)', fr: 'Mildiou de la Tomate & Pomme de Terre', ar: 'اللفحة المتأخرة / الميلديو' },
    scientificName: 'Phytophthora infestans',
    category: 'fungus',
    cropsAffected: ['tomato_open', 'potato_season'],
    economicThresholdDescription: 'Immediate intervention upon 1st necrotic lesion detected under 90%+ relative humidity',
    diagnosticHallmarks: [
      'Water-soaked oily dark green to brown lesions on leaves and stems',
      'White downy sporulating mold on leaf undersides in humid mornings',
      'Firm brown dry rot on potato tubers and tomato fruits',
    ],
    organicProtocol: {
      title: 'Preventive Copper Hydroxide & Equisetum Bio-Protection',
      bioAgents: ['Copper Hydroxide (Kocide 2000) 1.5 kg/ha', 'Horsetail extract (Equisetum arvense)', 'Bacillus amyloliquefaciens'],
      dosage: '1.5 kg/ha Copper Hydroxide in 400L water',
      applicationMethod: 'Full canopy preventive coverage before rain events',
      safetyLevel: 'minimal_ppe',
      costDzdPerHa: 9500,
      delayToActHours: 6,
    },
    chemicalProtocol: {
      title: 'Systemic Curative & Anti-Sporulant Tank Mix',
      activeSubstance: 'Cymoxanil + Mancozeb OR Mandipropamid',
      commercialProduct: 'Curzate M (2.5 kg/ha) or Revus Top (0.6 L/ha)',
      iracFracGroup: 'FRAC 27 + M03 (Multi-site)',
      dosagePerHa: '2.5 kg/ha in 600L water',
      waterVolumeLPerHa: 600,
      reiHours: 24,
      phiDays: 7,
      whoToxClass: 'II',
      costDzdPerHa: 16000,
    },
  },
  {
    id: 'tetranychus_urticae',
    name: { en: 'Two-Spotted Spider Mite (Tétranyque Tisserand)', fr: 'Acarien Jaune / Araignée Rouge', ar: 'العنكبوت الأحمر / الحلم الأصفر' },
    scientificName: 'Tetranychus urticae',
    category: 'insect',
    cropsAffected: ['tomato_open', 'citrus_clementine', 'potato_season'],
    economicThresholdDescription: '5 mites per leaf sample under hot, dry conditions (> 28°C, < 40% RH)',
    diagnosticHallmarks: [
      'Fine silvery-yellow stippling/speckling on upper leaf surfaces',
      'Dense silken webbing across leaf undersides and terminal buds',
      'Bronzing and premature defoliation under high pest pressure',
    ],
    organicProtocol: {
      title: 'Predatory Mite Release & Potassium Salt Soap',
      bioAgents: ['Phytoseiulus persimilis predatory mites (20/m²)', 'Potassium salts of fatty acids (2%)'],
      dosage: 'Biocontrol release + 3 L/ha potassium soap',
      applicationMethod: 'Targeted under-leaf spray followed by beneficial mite release',
      safetyLevel: 'safe',
      costDzdPerHa: 22000,
      delayToActHours: 24,
    },
    chemicalProtocol: {
      title: 'Specific Acaricide Ovicide / Larvicide Treatment',
      activeSubstance: 'Hexythiazox OR Spiromesifen',
      commercialProduct: 'Nissorun 10 WP (0.5 kg/ha) or Oberon 240 SC (0.6 L/ha)',
      iracFracGroup: 'IRAC 10A / IRAC 23',
      dosagePerHa: '0.5 kg/ha in 800L water',
      waterVolumeLPerHa: 800,
      reiHours: 24,
      phiDays: 3,
      whoToxClass: 'III',
      costDzdPerHa: 17500,
    },
  },
  {
    id: 'cereal_rust_puccinia',
    name: { en: 'Yellow / Stripe Rust (Rouille Jaune)', fr: 'Rouille Jaune du Blé (Puccinia striiformis)', ar: 'الصدأ الأصفر في القمح' },
    scientificName: 'Puccinia striiformis',
    category: 'fungus',
    cropsAffected: ['durum_wheat'],
    economicThresholdDescription: '1st pustule detected on F-3 or F-2 leaf during stem elongation (Zadoks 31-39)',
    diagnosticHallmarks: [
      'Linear stripes of bright yellow-orange pustules between leaf veins',
      'Powdery spore release on fingertips when brushing canopy',
      'Rapid chlorosis and early dry-out of upper leaves',
    ],
    organicProtocol: {
      title: 'Sulfur Dusting & Resistant Cultivar Strategy',
      bioAgents: ['Micronized Wettable Sulfur 80% (3.5 kg/ha)', 'Silicon foliar fortifier'],
      dosage: '3.5 kg/ha Sulfur in 300L water',
      applicationMethod: 'Early morning spray on dewy canopy',
      safetyLevel: 'safe',
      costDzdPerHa: 6500,
      delayToActHours: 12,
    },
    chemicalProtocol: {
      title: 'Triazole + Strobilurin Broad-Spectrum Fungicide',
      activeSubstance: 'Tebuconazole + Azoxystrobin',
      commercialProduct: 'Custodia (0.8 L/ha) or Prosaro (1.0 L/ha)',
      iracFracGroup: 'FRAC 3 (DMI) + FRAC 11 (QoI)',
      dosagePerHa: '0.8 L/ha in 300L water',
      waterVolumeLPerHa: 300,
      reiHours: 12,
      phiDays: 35,
      whoToxClass: 'II',
      costDzdPerHa: 11500,
    },
  },
];
