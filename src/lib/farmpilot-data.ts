/**
 * FarmPilot data layer — crop database, soil/water defaults, recommendation weights.
 *
 * FarmPilot is a guided farm decision assistant inside Formula Atlas that turns
 * the farmer's available context (location, soil, water, crop, resources) into
 * actionable recommendations: what to plant, how to irrigate, how much to
 * fertilize, what to do today, and how the economics stack up.
 *
 * Design principles (see master prompt):
 *  - Reuse Formula Atlas data whenever possible (FarmProfile, ALL_58_WILAYAS,
 *    ALGERIA_CROP_SUITABILITY_RULES, ALGERIA_AGRO_ZONES_CONFIG).
 *  - Every value carries a clear provenance tag (Measured / Farmer estimate /
 *    Atlas estimate / Unknown).
 *  - Trilingual (EN/FR/AR) — no hard-coded UI text outside this file's labels.
 *  - No false precision: estimates are clearly labelled as estimates.
 */

import type { Language } from './language-store';

// ---------------------------------------------------------------------------
// 1. Production system
// ---------------------------------------------------------------------------

export type ProductionSystem = 'open_field' | 'greenhouse' | 'oasis' | 'hydroponic';

export interface ProductionSystemOption {
  id: ProductionSystem;
  emoji: string;
  label: Record<Language, string>;
  /** Kc adjustment vs open field (e.g. greenhouse ≈ 0.8 due to reduced ET). */
  kcMultiplier: number;
  /** Irrigation efficiency multiplier (1.0 = no change). */
  irrigationEfficiencyMultiplier: number;
}

export const PRODUCTION_SYSTEMS: ProductionSystemOption[] = [
  {
    id: 'open_field',
    emoji: '🌱',
    label: { en: 'Open field', fr: 'Plein champ', ar: 'حقل مفتوح' },
    kcMultiplier: 1.0,
    irrigationEfficiencyMultiplier: 1.0,
  },
  {
    id: 'greenhouse',
    emoji: '🏠',
    label: { en: 'Greenhouse', fr: 'Serre', ar: 'بيت محمي' },
    kcMultiplier: 0.75,
    irrigationEfficiencyMultiplier: 0.95, // drip under cover ≈ 95% efficient
  },
  {
    id: 'oasis',
    emoji: '🌴',
    label: { en: 'Oasis', fr: 'Oasis', ar: 'واحة' },
    kcMultiplier: 0.9,
    irrigationEfficiencyMultiplier: 0.85,
  },
  {
    id: 'hydroponic',
    emoji: '💧',
    label: { en: 'Soilless / Hydroponic', fr: 'Hors-sol / Hydroponique', ar: 'بدون تربة / مائي' },
    kcMultiplier: 0.85,
    irrigationEfficiencyMultiplier: 1.0, // recirculating
  },
];

// ---------------------------------------------------------------------------
// 2. Provenance (Measurable → Estimate)
// ---------------------------------------------------------------------------

export type Provenance = 'measured' | 'farmer_estimate' | 'atlas_estimate' | 'unknown';

export interface ProvenanceBadge {
  emoji: string;
  color: string;
  label: Record<Language, string>;
}

export const PROVENANCE_BADGES: Record<Provenance, ProvenanceBadge> = {
  measured: {
    emoji: '🟢',
    color: 'emerald',
    label: { en: 'Measured', fr: 'Mesuré', ar: 'مقيس' },
  },
  farmer_estimate: {
    emoji: '🟡',
    color: 'amber',
    label: { en: 'Farmer estimate', fr: 'Estimation agriculteur', ar: 'تقدير المزارع' },
  },
  atlas_estimate: {
    emoji: '🔵',
    color: 'sky',
    label: { en: 'Atlas estimate', fr: 'Estimation Atlas', ar: 'تقدير أطلس' },
  },
  unknown: {
    emoji: '🔴',
    color: 'rose',
    label: { en: 'Unknown', fr: 'Inconnu', ar: 'غير معروف' },
  },
};

// ---------------------------------------------------------------------------
// 3. Confidence levels
// ---------------------------------------------------------------------------

export type Confidence = 'high' | 'medium' | 'low';

export const CONFIDENCE_BADGES: Record<Confidence, { emoji: string; color: string; label: Record<Language, string> }> = {
  high: {
    emoji: '🟢',
    color: 'emerald',
    label: { en: 'High', fr: 'Élevée', ar: 'عالية' },
  },
  medium: {
    emoji: '🟡',
    color: 'amber',
    label: { en: 'Medium', fr: 'Moyenne', ar: 'متوسطة' },
  },
  low: {
    emoji: '🔴',
    color: 'rose',
    label: { en: 'Low', fr: 'Faible', ar: 'منخفضة' },
  },
};

// ---------------------------------------------------------------------------
// 4. Soil data
// ---------------------------------------------------------------------------

export interface SoilData {
  texture?: 'sand' | 'loamy_sand' | 'sandy_loam' | 'loam' | 'silt_loam' | 'clay_loam' | 'clay';
  ph?: number;
  ecDsm?: number;          // Electrical conductivity dS/m
  organicMatterPct?: number;
  nPpm?: number;           // Available nitrogen (ppm)
  pPpm?: number;           // Available phosphorus (Olsen ppm)
  kPpm?: number;           // Exchangeable potassium (ppm)
  cecCmolKg?: number;      // Cation exchange capacity (cmol+/kg)
  sar?: number;            // Sodium adsorption ratio
  caCO3Pct?: number;       // Active lime %
  provenance: Record<keyof Omit<SoilData, 'provenance'>, Provenance>;
}

export const SOIL_TEXTURES: Record<NonNullable<SoilData['texture']>, { label: Record<Language, string>; waterHoldCapacityMmPerM: number; infiltrationMmPerDay: number }> = {
  sand: { label: { en: 'Sand', fr: 'Sable', ar: 'رملي' }, waterHoldCapacityMmPerM: 50, infiltrationMmPerDay: 50 },
  loamy_sand: { label: { en: 'Loamy sand', fr: 'Sable limoneux', ar: 'رملي طميي' }, waterHoldCapacityMmPerM: 80, infiltrationMmPerDay: 40 },
  sandy_loam: { label: { en: 'Sandy loam', fr: 'Limon sableux', ar: 'طمي رملي' }, waterHoldCapacityMmPerM: 120, infiltrationMmPerDay: 30 },
  loam: { label: { en: 'Loam', fr: 'Limon', ar: 'طمي' }, waterHoldCapacityMmPerM: 180, infiltrationMmPerDay: 20 },
  silt_loam: { label: { en: 'Silt loam', fr: 'Limon fin', ar: 'طمي طفيلي' }, waterHoldCapacityMmPerM: 200, infiltrationMmPerDay: 15 },
  clay_loam: { label: { en: 'Clay loam', fr: 'Argile limoneuse', ar: 'طيني طميي' }, waterHoldCapacityMmPerM: 220, infiltrationMmPerDay: 10 },
  clay: { label: { en: 'Clay', fr: 'Argile', ar: 'طيني' }, waterHoldCapacityMmPerM: 250, infiltrationMmPerDay: 5 },
};

export function emptySoilProvenance(): SoilData['provenance'] {
  return {
    texture: 'unknown',
    ph: 'unknown',
    ecDsm: 'unknown',
    organicMatterPct: 'unknown',
    nPpm: 'unknown',
    pPpm: 'unknown',
    kPpm: 'unknown',
    cecCmolKg: 'unknown',
    sar: 'unknown',
    caCO3Pct: 'unknown',
  };
}

// ---------------------------------------------------------------------------
// 5. Water data
// ---------------------------------------------------------------------------

export interface WaterData {
  ph?: number;
  ecDsm?: number;          // dS/m
  tdsPpm?: number;         // Total dissolved solids mg/L
  sodiumMeqL?: number;
  chlorideMeqL?: number;
  calciumMeqL?: number;
  magnesiumMeqL?: number;
  bicarbonateMeqL?: number;
  sar?: number;
  boronPpm?: number;
  provenance: Record<keyof Omit<WaterData, 'provenance'>, Provenance>;
}

export function emptyWaterProvenance(): WaterData['provenance'] {
  return {
    ph: 'unknown',
    ecDsm: 'unknown',
    tdsPpm: 'unknown',
    sodiumMeqL: 'unknown',
    chlorideMeqL: 'unknown',
    calciumMeqL: 'unknown',
    magnesiumMeqL: 'unknown',
    bicarbonateMeqL: 'unknown',
    sar: 'unknown',
    boronPpm: 'unknown',
  };
}

export type WaterSuitability = 'suitable' | 'moderate_limitations' | 'significant_limitations';

export const WATER_SUITABILITY_LABELS: Record<WaterSuitability, { emoji: string; color: string; label: Record<Language, string> }> = {
  suitable: {
    emoji: '🟢',
    color: 'emerald',
    label: { en: 'Suitable', fr: 'Adéquate', ar: 'مناسبة' },
  },
  moderate_limitations: {
    emoji: '🟡',
    color: 'amber',
    label: { en: 'Moderate limitations', fr: 'Limitations modérées', ar: 'قيود متوسطة' },
  },
  significant_limitations: {
    emoji: '🔴',
    color: 'rose',
    label: { en: 'Significant limitations', fr: 'Limitations significatives', ar: 'قيود كبيرة' },
  },
};

// ---------------------------------------------------------------------------
// 6. FarmPilot crop database
//
// The 16 MVP crops chosen below cover the main Algerian cropping systems:
// cereals, vegetables (open + greenhouse), roots/tubers, legumes, forage,
// industrial, and arboriculture. They extend (do not duplicate) the existing
// ALGERIA_CROP_SUITABILITY_RULES by adding FarmPilot-specific parameters
// (Kc stages, nutrient uptake, planting density, season windows).
// ---------------------------------------------------------------------------

export type CropStage =
  | 'planting'
  | 'germination'
  | 'vegetative'
  | 'flowering'
  | 'fruit_development'
  | 'maturation'
  | 'harvest';

export const CROP_STAGE_ORDER: CropStage[] = [
  'planting', 'germination', 'vegetative', 'flowering',
  'fruit_development', 'maturation', 'harvest',
];

export const CROP_STAGE_LABELS: Record<CropStage, { emoji: string; label: Record<Language, string> }> = {
  planting: { emoji: '🌱', label: { en: 'Planting', fr: 'Semis / Plantation', ar: 'الزراعة' } },
  germination: { emoji: '🌿', label: { en: 'Germination', fr: 'Germination', ar: 'الإنبات' } },
  vegetative: { emoji: '🍃', label: { en: 'Vegetative growth', fr: 'Croissance végétative', ar: 'النمو الخضري' } },
  flowering: { emoji: '🌸', label: { en: 'Flowering', fr: 'Floraison', ar: 'الإزهار' } },
  fruit_development: { emoji: '🍅', label: { en: 'Fruit / grain development', fr: 'Développement fruit / grain', ar: 'تكوين الثمار / الحبوب' } },
  maturation: { emoji: '🌾', label: { en: 'Maturation', fr: 'Maturation', ar: 'النضج' } },
  harvest: { emoji: '🧺', label: { en: 'Harvest', fr: 'Récolte', ar: 'الحصاد' } },
};

export interface CropStageKc {
  /** Typical duration in days for this stage. */
  durationDays: number;
  /** FAO-56 single-crop coefficient Kc for this stage. */
  kc: number;
  /** Cumulative fraction of total N uptake (0-1) by end of this stage. */
  nUptakeFraction: number;
  /** Cumulative fraction of total P uptake by end of this stage. */
  pUptakeFraction: number;
  /** Cumulative fraction of total K uptake by end of this stage. */
  kUptakeFraction: number;
}

export interface FarmPilotCrop {
  id: string;
  emoji: string;
  name: Record<Language, string>;
  category: 'cereal' | 'vegetable' | 'tuber' | 'legume' | 'forage' | 'industrial' | 'arboriculture';
  /** Suitable production systems. */
  productionSystems: ProductionSystem[];
  /** Total cycle length in days (planting → harvest). */
  cycleLengthDays: number;
  /** Soil pH range [min, max] for optimal growth. */
  idealPhRange: [number, number];
  /** Max soil ECe (dS/m) tolerated before yield loss. */
  maxSoilEcDsm: number;
  /** Water demand in m³/ha over the full cycle (open field, drip 90% efficiency). */
  waterDemandM3Ha: number;
  /** Reference yield in tons/ha under good management. */
  referenceYieldTonsHa: number;
  /** Planting density: plants per m² (or per ha × 0.0001). */
  plantsPerM2: number;
  /** Seed / planting material required (kg/ha). */
  seedKgPerHa: number;
  /** Total nutrient uptake (kg/ha) for the reference yield. */
  nutrientUptake: { n: number; p: number; k: number };
  /** Recommended planting windows by month (1-12, northern hemisphere). */
  plantingMonths: number[];
  /** Per-stage parameters. */
  stages: Record<CropStage, CropStageKc>;
  /** Best-suited wilaya zones (matches AlgeriaAgroZone keys). */
  favorableZones: string[];
  unsuitableZones: string[];
  /** Typical Algerian wholesale price in DZD/kg (for economics). */
  typicalPriceDzdPerKg: number;
  /** Indicative production cost in DZD/ha (seed + fertilizer + irrigation + labor). */
  indicativeCostDzdPerHa: number;
}

export const FARMPILOT_CROPS: FarmPilotCrop[] = [
  {
    id: 'potato',
    emoji: '🥔',
    name: { en: 'Potato', fr: 'Pomme de terre', ar: 'البطاطا' },
    category: 'tuber',
    productionSystems: ['open_field', 'greenhouse', 'oasis'],
    cycleLengthDays: 110,
    idealPhRange: [5.5, 7.5],
    maxSoilEcDsm: 2.5,
    waterDemandM3Ha: 5500,
    referenceYieldTonsHa: 35,
    plantsPerM2: 4,
    seedKgPerHa: 2000,
    nutrientUptake: { n: 150, p: 50, k: 250 },
    plantingMonths: [1, 2, 9, 10, 11],
    favorableZones: ['sahara_oasis', 'deep_sahara', 'tell_coastal', 'high_plateaus'],
    unsuitableZones: ['mountains'],
    typicalPriceDzdPerKg: 60,
    indicativeCostDzdPerHa: 280000,
    stages: {
      planting:       { durationDays: 10,  kc: 0.5,  nUptakeFraction: 0.0,  pUptakeFraction: 0.0,  kUptakeFraction: 0.0 },
      germination:     { durationDays: 25,  kc: 0.6,  nUptakeFraction: 0.15, pUptakeFraction: 0.2,  kUptakeFraction: 0.15 },
      vegetative:      { durationDays: 30,  kc: 0.85, nUptakeFraction: 0.5,  pUptakeFraction: 0.55, kUptakeFraction: 0.55 },
      flowering:       { durationDays: 15,  kc: 1.05, nUptakeFraction: 0.75, pUptakeFraction: 0.8,  kUptakeFraction: 0.8 },
      fruit_development:{ durationDays: 20,  kc: 1.15, nUptakeFraction: 0.9,  pUptakeFraction: 0.9,  kUptakeFraction: 0.9 },
      maturation:      { durationDays: 7,   kc: 0.85, nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
      harvest:         { durationDays: 3,   kc: 0.6,  nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
    },
  },
  {
    id: 'tomato',
    emoji: '🍅',
    name: { en: 'Tomato (Fresh)', fr: 'Tomate (fraîche)', ar: 'الطماطم الطازجة' },
    category: 'vegetable',
    productionSystems: ['open_field', 'greenhouse', 'oasis'],
    cycleLengthDays: 130,
    idealPhRange: [6.0, 7.0],
    maxSoilEcDsm: 3.5,
    waterDemandM3Ha: 6500,
    referenceYieldTonsHa: 55,
    plantsPerM2: 2.5,
    seedKgPerHa: 0.4,
    nutrientUptake: { n: 180, p: 60, k: 320 },
    plantingMonths: [2, 3, 4, 8, 9],
    favorableZones: ['sahara_oasis', 'tell_coastal', 'deep_sahara'],
    unsuitableZones: ['mountains'],
    typicalPriceDzdPerKg: 80,
    indicativeCostDzdPerHa: 380000,
    stages: {
      planting:       { durationDays: 8,   kc: 0.6,  nUptakeFraction: 0.0,  pUptakeFraction: 0.0,  kUptakeFraction: 0.0 },
      germination:     { durationDays: 18,  kc: 0.7,  nUptakeFraction: 0.1,  pUptakeFraction: 0.15, kUptakeFraction: 0.1 },
      vegetative:      { durationDays: 35,  kc: 0.9,  nUptakeFraction: 0.4,  pUptakeFraction: 0.5,  kUptakeFraction: 0.45 },
      flowering:       { durationDays: 20,  kc: 1.1,  nUptakeFraction: 0.7,  pUptakeFraction: 0.75, kUptakeFraction: 0.75 },
      fruit_development:{ durationDays: 35,  kc: 1.2,  nUptakeFraction: 0.9,  pUptakeFraction: 0.9,  kUptakeFraction: 0.9 },
      maturation:      { durationDays: 10,  kc: 0.95, nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
      harvest:         { durationDays: 4,   kc: 0.8,  nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
    },
  },
  {
    id: 'onion',
    emoji: '🧅',
    name: { en: 'Onion (Dry Bulb)', fr: 'Oignon (bulbe sec)', ar: 'البصل (جاف)' },
    category: 'vegetable',
    productionSystems: ['open_field', 'oasis'],
    cycleLengthDays: 150,
    idealPhRange: [6.0, 7.5],
    maxSoilEcDsm: 4.0,
    waterDemandM3Ha: 4500,
    referenceYieldTonsHa: 40,
    plantsPerM2: 25,
    seedKgPerHa: 4,
    nutrientUptake: { n: 120, p: 50, k: 160 },
    plantingMonths: [10, 11, 12, 1],
    favorableZones: ['tell_coastal', 'sahara_oasis', 'high_plateaus'],
    unsuitableZones: ['mountains'],
    typicalPriceDzdPerKg: 70,
    indicativeCostDzdPerHa: 220000,
    stages: {
      planting:       { durationDays: 10,  kc: 0.5,  nUptakeFraction: 0.0,  pUptakeFraction: 0.0,  kUptakeFraction: 0.0 },
      germination:     { durationDays: 25,  kc: 0.6,  nUptakeFraction: 0.1,  pUptakeFraction: 0.15, kUptakeFraction: 0.1 },
      vegetative:      { durationDays: 50,  kc: 0.85, nUptakeFraction: 0.4,  pUptakeFraction: 0.5,  kUptakeFraction: 0.45 },
      flowering:       { durationDays: 10,  kc: 1.05, nUptakeFraction: 0.7,  pUptakeFraction: 0.75, kUptakeFraction: 0.75 },
      fruit_development:{ durationDays: 35,  kc: 1.1,  nUptakeFraction: 0.9,  pUptakeFraction: 0.9,  kUptakeFraction: 0.9 },
      maturation:      { durationDays: 15,  kc: 0.85, nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
      harvest:         { durationDays: 5,   kc: 0.6,  nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
    },
  },
  {
    id: 'carrot',
    emoji: '🥕',
    name: { en: 'Carrot', fr: 'Carotte', ar: 'الجزر' },
    category: 'vegetable',
    productionSystems: ['open_field', 'oasis'],
    cycleLengthDays: 100,
    idealPhRange: [6.0, 7.0],
    maxSoilEcDsm: 2.0,
    waterDemandM3Ha: 4000,
    referenceYieldTonsHa: 35,
    plantsPerM2: 80,
    seedKgPerHa: 4,
    nutrientUptake: { n: 100, p: 40, k: 200 },
    plantingMonths: [2, 3, 9, 10, 11],
    favorableZones: ['tell_coastal', 'high_plateaus', 'sahara_oasis'],
    unsuitableZones: ['mountains', 'deep_sahara'],
    typicalPriceDzdPerKg: 50,
    indicativeCostDzdPerHa: 180000,
    stages: {
      planting:       { durationDays: 10,  kc: 0.5,  nUptakeFraction: 0.0,  pUptakeFraction: 0.0,  kUptakeFraction: 0.0 },
      germination:     { durationDays: 20,  kc: 0.6,  nUptakeFraction: 0.1,  pUptakeFraction: 0.15, kUptakeFraction: 0.1 },
      vegetative:      { durationDays: 40,  kc: 0.9,  nUptakeFraction: 0.5,  pUptakeFraction: 0.55, kUptakeFraction: 0.5 },
      flowering:       { durationDays: 10,  kc: 1.05, nUptakeFraction: 0.7,  pUptakeFraction: 0.75, kUptakeFraction: 0.75 },
      fruit_development:{ durationDays: 10,  kc: 1.1,  nUptakeFraction: 0.9,  pUptakeFraction: 0.9,  kUptakeFraction: 0.9 },
      maturation:      { durationDays: 5,   kc: 0.85, nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
      harvest:         { durationDays: 5,   kc: 0.6,  nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
    },
  },
  {
    id: 'wheat_durum',
    emoji: '🌾',
    name: { en: 'Durum Wheat', fr: 'Blé dur', ar: 'القمح الصلب' },
    category: 'cereal',
    productionSystems: ['open_field'],
    cycleLengthDays: 180,
    idealPhRange: [6.5, 8.0],
    maxSoilEcDsm: 6.0,
    waterDemandM3Ha: 4500,
    referenceYieldTonsHa: 4.5,
    plantsPerM2: 350,
    seedKgPerHa: 130,
    nutrientUptake: { n: 130, p: 50, k: 130 },
    plantingMonths: [11, 12, 1],
    favorableZones: ['high_plateaus', 'tell_coastal'],
    unsuitableZones: ['deep_sahara'],
    typicalPriceDzdPerKg: 60, // CCLS support price ~6000 DZD/qx
    indicativeCostDzdPerHa: 95000,
    stages: {
      planting:       { durationDays: 7,   kc: 0.3,  nUptakeFraction: 0.0,  pUptakeFraction: 0.0,  kUptakeFraction: 0.0 },
      germination:     { durationDays: 25,  kc: 0.4,  nUptakeFraction: 0.1,  pUptakeFraction: 0.15, kUptakeFraction: 0.1 },
      vegetative:      { durationDays: 60,  kc: 0.7,  nUptakeFraction: 0.5,  pUptakeFraction: 0.55, kUptakeFraction: 0.5 },
      flowering:       { durationDays: 20,  kc: 1.05, nUptakeFraction: 0.8,  pUptakeFraction: 0.8,  kUptakeFraction: 0.8 },
      fruit_development:{ durationDays: 35,  kc: 1.1,  nUptakeFraction: 0.95, pUptakeFraction: 0.95, kUptakeFraction: 0.95 },
      maturation:      { durationDays: 25,  kc: 0.5,  nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
      harvest:         { durationDays: 8,   kc: 0.3,  nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
    },
  },
  {
    id: 'barley',
    emoji: '🌾',
    name: { en: 'Barley', fr: 'Orge', ar: 'الشعير' },
    category: 'cereal',
    productionSystems: ['open_field'],
    cycleLengthDays: 160,
    idealPhRange: [6.5, 8.5],
    maxSoilEcDsm: 8.0,
    waterDemandM3Ha: 3500,
    referenceYieldTonsHa: 3.5,
    plantsPerM2: 300,
    seedKgPerHa: 120,
    nutrientUptake: { n: 100, p: 40, k: 100 },
    plantingMonths: [10, 11, 12],
    favorableZones: ['high_plateaus', 'tell_coastal', 'deep_sahara'],
    unsuitableZones: [],
    typicalPriceDzdPerKg: 45,
    indicativeCostDzdPerHa: 75000,
    stages: {
      planting:       { durationDays: 7,   kc: 0.3,  nUptakeFraction: 0.0,  pUptakeFraction: 0.0,  kUptakeFraction: 0.0 },
      germination:     { durationDays: 20,  kc: 0.4,  nUptakeFraction: 0.1,  pUptakeFraction: 0.15, kUptakeFraction: 0.1 },
      vegetative:      { durationDays: 55,  kc: 0.7,  nUptakeFraction: 0.5,  pUptakeFraction: 0.55, kUptakeFraction: 0.5 },
      flowering:       { durationDays: 18,  kc: 1.05, nUptakeFraction: 0.8,  pUptakeFraction: 0.8,  kUptakeFraction: 0.8 },
      fruit_development:{ durationDays: 35,  kc: 1.1,  nUptakeFraction: 0.95, pUptakeFraction: 0.95, kUptakeFraction: 0.95 },
      maturation:      { durationDays: 18,  kc: 0.5,  nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
      harvest:         { durationDays: 7,   kc: 0.3,  nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
    },
  },
  {
    id: 'maize',
    emoji: '🌽',
    name: { en: 'Maize (Forage)', fr: 'Maïs (fourrage)', ar: 'الذرة (علف)' },
    category: 'forage',
    productionSystems: ['open_field'],
    cycleLengthDays: 120,
    idealPhRange: [6.0, 7.5],
    maxSoilEcDsm: 2.5,
    waterDemandM3Ha: 7000,
    referenceYieldTonsHa: 55, // forage fresh weight
    plantsPerM2: 8,
    seedKgPerHa: 30,
    nutrientUptake: { n: 200, p: 70, k: 250 },
    plantingMonths: [3, 4, 5],
    favorableZones: ['tell_coastal', 'deep_sahara'],
    unsuitableZones: ['mountains'],
    typicalPriceDzdPerKg: 18, // forage price
    indicativeCostDzdPerHa: 180000,
    stages: {
      planting:       { durationDays: 7,   kc: 0.3,  nUptakeFraction: 0.0,  pUptakeFraction: 0.0,  kUptakeFraction: 0.0 },
      germination:     { durationDays: 15,  kc: 0.4,  nUptakeFraction: 0.1,  pUptakeFraction: 0.15, kUptakeFraction: 0.1 },
      vegetative:      { durationDays: 45,  kc: 0.85, nUptakeFraction: 0.5,  pUptakeFraction: 0.55, kUptakeFraction: 0.5 },
      flowering:       { durationDays: 18,  kc: 1.15, nUptakeFraction: 0.75, pUptakeFraction: 0.8,  kUptakeFraction: 0.75 },
      fruit_development:{ durationDays: 25,  kc: 1.2,  nUptakeFraction: 0.9,  pUptakeFraction: 0.9,  kUptakeFraction: 0.9 },
      maturation:      { durationDays: 7,   kc: 0.85, nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
      harvest:         { durationDays: 3,   kc: 0.5,  nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
    },
  },
  {
    id: 'lettuce',
    emoji: '🥬',
    name: { en: 'Lettuce', fr: 'Laitue', ar: 'الخس' },
    category: 'vegetable',
    productionSystems: ['open_field', 'greenhouse', 'hydroponic'],
    cycleLengthDays: 70,
    idealPhRange: [6.0, 7.0],
    maxSoilEcDsm: 2.0,
    waterDemandM3Ha: 2500,
    referenceYieldTonsHa: 25,
    plantsPerM2: 11,
    seedKgPerHa: 0.5,
    nutrientUptake: { n: 80, p: 25, k: 100 },
    plantingMonths: [1, 2, 3, 9, 10, 11],
    favorableZones: ['tell_coastal', 'high_plateaus', 'sahara_oasis'],
    unsuitableZones: ['deep_sahara'],
    typicalPriceDzdPerKg: 80,
    indicativeCostDzdPerHa: 120000,
    stages: {
      planting:       { durationDays: 5,   kc: 0.4,  nUptakeFraction: 0.0,  pUptakeFraction: 0.0,  kUptakeFraction: 0.0 },
      germination:     { durationDays: 10,  kc: 0.5,  nUptakeFraction: 0.15, pUptakeFraction: 0.2,  kUptakeFraction: 0.15 },
      vegetative:      { durationDays: 30,  kc: 0.85, nUptakeFraction: 0.7,  pUptakeFraction: 0.7,  kUptakeFraction: 0.7 },
      flowering:       { durationDays: 5,   kc: 1.0,  nUptakeFraction: 0.85, pUptakeFraction: 0.85, kUptakeFraction: 0.85 },
      fruit_development:{ durationDays: 10,  kc: 1.05, nUptakeFraction: 0.95, pUptakeFraction: 0.95, kUptakeFraction: 0.95 },
      maturation:      { durationDays: 5,   kc: 0.85, nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
      harvest:         { durationDays: 5,   kc: 0.5,  nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
    },
  },
  {
    id: 'bell_pepper',
    emoji: '🫑',
    name: { en: 'Bell Pepper', fr: 'Poivron', ar: 'الفلفل الحلو' },
    category: 'vegetable',
    productionSystems: ['open_field', 'greenhouse'],
    cycleLengthDays: 140,
    idealPhRange: [6.0, 7.0],
    maxSoilEcDsm: 2.5,
    waterDemandM3Ha: 6000,
    referenceYieldTonsHa: 40,
    plantsPerM2: 3,
    seedKgPerHa: 0.4,
    nutrientUptake: { n: 160, p: 50, k: 250 },
    plantingMonths: [2, 3, 4, 5],
    favorableZones: ['tell_coastal', 'sahara_oasis'],
    unsuitableZones: ['mountains'],
    typicalPriceDzdPerKg: 120,
    indicativeCostDzdPerHa: 320000,
    stages: {
      planting:       { durationDays: 8,   kc: 0.5,  nUptakeFraction: 0.0,  pUptakeFraction: 0.0,  kUptakeFraction: 0.0 },
      germination:     { durationDays: 20,  kc: 0.6,  nUptakeFraction: 0.1,  pUptakeFraction: 0.15, kUptakeFraction: 0.1 },
      vegetative:      { durationDays: 40,  kc: 0.85, nUptakeFraction: 0.4,  pUptakeFraction: 0.5,  kUptakeFraction: 0.45 },
      flowering:       { durationDays: 20,  kc: 1.05, nUptakeFraction: 0.7,  pUptakeFraction: 0.75, kUptakeFraction: 0.75 },
      fruit_development:{ durationDays: 40,  kc: 1.15, nUptakeFraction: 0.9,  pUptakeFraction: 0.9,  kUptakeFraction: 0.9 },
      maturation:      { durationDays: 7,   kc: 0.9,  nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
      harvest:         { durationDays: 5,   kc: 0.75, nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
    },
  },
  {
    id: 'cucumber',
    emoji: '🥒',
    name: { en: 'Cucumber', fr: 'Concombre', ar: 'الخيار' },
    category: 'vegetable',
    productionSystems: ['open_field', 'greenhouse'],
    cycleLengthDays: 90,
    idealPhRange: [6.0, 7.0],
    maxSoilEcDsm: 3.0,
    waterDemandM3Ha: 5500,
    referenceYieldTonsHa: 50,
    plantsPerM2: 1.5,
    seedKgPerHa: 1.5,
    nutrientUptake: { n: 140, p: 45, k: 220 },
    plantingMonths: [3, 4, 8, 9],
    favorableZones: ['tell_coastal', 'sahara_oasis'],
    unsuitableZones: ['mountains'],
    typicalPriceDzdPerKg: 70,
    indicativeCostDzdPerHa: 260000,
    stages: {
      planting:       { durationDays: 5,   kc: 0.5,  nUptakeFraction: 0.0,  pUptakeFraction: 0.0,  kUptakeFraction: 0.0 },
      germination:     { durationDays: 10,  kc: 0.6,  nUptakeFraction: 0.1,  pUptakeFraction: 0.15, kUptakeFraction: 0.1 },
      vegetative:      { durationDays: 25,  kc: 0.85, nUptakeFraction: 0.4,  pUptakeFraction: 0.5,  kUptakeFraction: 0.45 },
      flowering:       { durationDays: 12,  kc: 1.05, nUptakeFraction: 0.7,  pUptakeFraction: 0.75, kUptakeFraction: 0.75 },
      fruit_development:{ durationDays: 28,  kc: 1.15, nUptakeFraction: 0.9,  pUptakeFraction: 0.9,  kUptakeFraction: 0.9 },
      maturation:      { durationDays: 5,   kc: 0.9,  nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
      harvest:         { durationDays: 5,   kc: 0.75, nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
    },
  },
  {
    id: 'strawberry',
    emoji: '🍓',
    name: { en: 'Strawberry', fr: 'Fraise', ar: 'الفراولة' },
    category: 'vegetable',
    productionSystems: ['open_field', 'greenhouse', 'hydroponic'],
    cycleLengthDays: 200,
    idealPhRange: [6.0, 6.8],
    maxSoilEcDsm: 1.5,
    waterDemandM3Ha: 5000,
    referenceYieldTonsHa: 30,
    plantsPerM2: 5,
    seedKgPerHa: 0, // uses plantlets, not seeds
    nutrientUptake: { n: 100, p: 35, k: 180 },
    plantingMonths: [9, 10, 11],
    favorableZones: ['tell_coastal', 'high_plateaus'],
    unsuitableZones: ['deep_sahara'],
    typicalPriceDzdPerKg: 250,
    indicativeCostDzdPerHa: 450000,
    stages: {
      planting:       { durationDays: 10,  kc: 0.4,  nUptakeFraction: 0.0,  pUptakeFraction: 0.0,  kUptakeFraction: 0.0 },
      germination:     { durationDays: 30,  kc: 0.5,  nUptakeFraction: 0.1,  pUptakeFraction: 0.15, kUptakeFraction: 0.1 },
      vegetative:      { durationDays: 70,  kc: 0.75, nUptakeFraction: 0.4,  pUptakeFraction: 0.5,  kUptakeFraction: 0.45 },
      flowering:       { durationDays: 20,  kc: 0.9,  nUptakeFraction: 0.7,  pUptakeFraction: 0.75, kUptakeFraction: 0.75 },
      fruit_development:{ durationDays: 50,  kc: 1.0,  nUptakeFraction: 0.9,  pUptakeFraction: 0.9,  kUptakeFraction: 0.9 },
      maturation:      { durationDays: 15,  kc: 0.85, nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
      harvest:         { durationDays: 5,   kc: 0.7,  nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
    },
  },
  {
    id: 'alfalfa',
    emoji: '🌱',
    name: { en: 'Alfalfa (Lucerne)', fr: 'Luzerne', ar: 'الفصة (البرسيم)' },
    category: 'forage',
    productionSystems: ['open_field', 'oasis'],
    cycleLengthDays: 365, // perennial, multi-cut
    idealPhRange: [6.5, 8.0],
    maxSoilEcDsm: 8.0,
    waterDemandM3Ha: 12000, // multi-cut total
    referenceYieldTonsHa: 80, // dry matter across cuts
    plantsPerM2: 400,
    seedKgPerHa: 25,
    nutrientUptake: { n: 0, p: 50, k: 250 }, // N-fixing
    plantingMonths: [3, 4, 10, 11],
    favorableZones: ['tell_coastal', 'high_plateaus', 'deep_sahara'],
    unsuitableZones: [],
    typicalPriceDzdPerKg: 25,
    indicativeCostDzdPerHa: 120000,
    stages: {
      planting:       { durationDays: 10,  kc: 0.3,  nUptakeFraction: 0.0,  pUptakeFraction: 0.0,  kUptakeFraction: 0.0 },
      germination:     { durationDays: 20,  kc: 0.5,  nUptakeFraction: 0.1,  pUptakeFraction: 0.15, kUptakeFraction: 0.1 },
      vegetative:      { durationDays: 240, kc: 0.95, nUptakeFraction: 0.7,  pUptakeFraction: 0.75, kUptakeFraction: 0.7 },
      flowering:       { durationDays: 30,  kc: 1.1,  nUptakeFraction: 0.85, pUptakeFraction: 0.85, kUptakeFraction: 0.85 },
      fruit_development:{ durationDays: 30,  kc: 1.1,  nUptakeFraction: 0.95, pUptakeFraction: 0.95, kUptakeFraction: 0.95 },
      maturation:      { durationDays: 20,  kc: 0.95, nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
      harvest:         { durationDays: 15,  kc: 0.85, nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
    },
  },
  {
    id: 'date_palm',
    emoji: '🌴',
    name: { en: 'Date Palm (Deglet Nour)', fr: 'Palmier dattier (Deglet Nour)', ar: 'نخيل التمر (دقلة نور)' },
    category: 'arboriculture',
    productionSystems: ['oasis'],
    cycleLengthDays: 365,
    idealPhRange: [7.0, 8.5],
    maxSoilEcDsm: 12.0, // highly salt-tolerant
    waterDemandM3Ha: 18000,
    referenceYieldTonsHa: 8,
    plantsPerM2: 0.07, // 7m × 7m spacing ≈ 200 palms/ha
    seedKgPerHa: 0, // offshoots, not seeds
    nutrientUptake: { n: 80, p: 30, k: 110 },
    plantingMonths: [2, 3, 10, 11],
    favorableZones: ['sahara_oasis', 'deep_sahara'],
    unsuitableZones: ['tell_coastal', 'mountains'],
    typicalPriceDzdPerKg: 350,
    indicativeCostDzdPerHa: 200000,
    stages: {
      planting:       { durationDays: 30,  kc: 0.4,  nUptakeFraction: 0.0,  pUptakeFraction: 0.0,  kUptakeFraction: 0.0 },
      germination:     { durationDays: 60,  kc: 0.5,  nUptakeFraction: 0.1,  pUptakeFraction: 0.15, kUptakeFraction: 0.1 },
      vegetative:      { durationDays: 150, kc: 0.85, nUptakeFraction: 0.4,  pUptakeFraction: 0.5,  kUptakeFraction: 0.45 },
      flowering:       { durationDays: 45,  kc: 1.05, nUptakeFraction: 0.7,  pUptakeFraction: 0.75, kUptakeFraction: 0.75 },
      fruit_development:{ durationDays: 60,  kc: 1.15, nUptakeFraction: 0.9,  pUptakeFraction: 0.9,  kUptakeFraction: 0.9 },
      maturation:      { durationDays: 15,  kc: 0.95, nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
      harvest:         { durationDays: 5,   kc: 0.7,  nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
    },
  },
  {
    id: 'cucumber_greenhouse',
    emoji: '🥒',
    name: { en: 'Greenhouse Cucumber (Long)', fr: 'Concombre de serre (long)', ar: 'خيار البيوت المحمية (طويل)' },
    category: 'vegetable',
    productionSystems: ['greenhouse'],
    cycleLengthDays: 120,
    idealPhRange: [6.0, 7.0],
    maxSoilEcDsm: 3.0,
    waterDemandM3Ha: 4500, // greenhouse reduces ET
    referenceYieldTonsHa: 180, // protected high yield
    plantsPerM2: 1.5,
    seedKgPerHa: 1.2,
    nutrientUptake: { n: 220, p: 70, k: 350 },
    plantingMonths: [9, 10, 11, 12, 1, 2],
    favorableZones: ['sahara_oasis', 'tell_coastal'],
    unsuitableZones: ['mountains'],
    typicalPriceDzdPerKg: 80,
    indicativeCostDzdPerHa: 800000,
    stages: {
      planting:       { durationDays: 7,   kc: 0.5,  nUptakeFraction: 0.0,  pUptakeFraction: 0.0,  kUptakeFraction: 0.0 },
      germination:     { durationDays: 14,  kc: 0.6,  nUptakeFraction: 0.1,  pUptakeFraction: 0.15, kUptakeFraction: 0.1 },
      vegetative:      { durationDays: 35,  kc: 0.9,  nUptakeFraction: 0.4,  pUptakeFraction: 0.5,  kUptakeFraction: 0.45 },
      flowering:       { durationDays: 14,  kc: 1.05, nUptakeFraction: 0.7,  pUptakeFraction: 0.75, kUptakeFraction: 0.75 },
      fruit_development:{ durationDays: 40,  kc: 1.2,  nUptakeFraction: 0.9,  pUptakeFraction: 0.9,  kUptakeFraction: 0.9 },
      maturation:      { durationDays: 7,   kc: 1.0,  nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
      harvest:         { durationDays: 3,   kc: 0.85, nUptakeFraction: 1.0,  pUptakeFraction: 1.0,  kUptakeFraction: 1.0 },
    },
  },
];

// ---------------------------------------------------------------------------
// 7. Recommendation weights (configurable)
// ---------------------------------------------------------------------------

export interface RecommendationWeights {
  climateSuitability: number;   // 0-1 weight
  soilSuitability: number;
  waterCompatibility: number;
  salinityTolerance: number;
  plantingSeason: number;
  productionSystem: number;
  waterRequirement: number;
  farmerObjective: number;      // not used in MVP (defaults to 1)
  economicPotential: number;
}

export const DEFAULT_RECOMMENDATION_WEIGHTS: RecommendationWeights = {
  climateSuitability: 0.18,
  soilSuitability: 0.18,
  waterCompatibility: 0.14,
  salinityTolerance: 0.10,
  plantingSeason: 0.10,
  productionSystem: 0.10,
  waterRequirement: 0.08,
  farmerObjective: 1.0,
  economicPotential: 0.12,
};

// ---------------------------------------------------------------------------
// 8. Demo farm (El Oued potato, 0.5 ha sandy, drip, moderate salinity)
// ---------------------------------------------------------------------------

export const DEMO_FARM = {
  isDemo: true,
  name: 'Demo Farm (El Oued)',
  wilayaCode: 39, // El Oued
  areaHa: 0.5,
  productionSystem: 'open_field' as ProductionSystem,
  irrigationSystem: 'drip' as const,
  crop: 'potato',
  plantingDate: new Date(new Date().getFullYear(), 0, 15).toISOString().slice(0, 10), // Jan 15
  soil: {
    texture: 'sand' as const,
    ph: 8.1,
    ecDsm: 3.2,
    organicMatterPct: 0.7,
    nPpm: 15,
    pPpm: 12,
    kPpm: 180,
    provenance: {
      texture: 'atlas_estimate',
      ph: 'atlas_estimate',
      ecDsm: 'atlas_estimate',
      organicMatterPct: 'atlas_estimate',
      nPpm: 'atlas_estimate',
      pPpm: 'atlas_estimate',
      kPpm: 'atlas_estimate',
      cecCmolKg: 'unknown',
      sar: 'unknown',
      caCO3Pct: 'atlas_estimate',
    },
  } as SoilData,
  water: {
    ph: 7.8,
    ecDsm: 2.2,
    tdsPpm: 1400,
    sodiumMeqL: 12,
    chlorideMeqL: 8,
    calciumMeqL: 6,
    magnesiumMeqL: 4,
    bicarbonateMeqL: 3,
    sar: 5.4,
    boronPpm: 0.5,
    provenance: {
      ph: 'atlas_estimate',
      ecDsm: 'atlas_estimate',
      tdsPpm: 'atlas_estimate',
      sodiumMeqL: 'atlas_estimate',
      chlorideMeqL: 'atlas_estimate',
      calciumMeqL: 'atlas_estimate',
      magnesiumMeqL: 'atlas_estimate',
      bicarbonateMeqL: 'atlas_estimate',
      sar: 'atlas_estimate',
      boronPpm: 'atlas_estimate',
    },
  } as WaterData,
};

// ---------------------------------------------------------------------------
// 9. FarmPilot plan persistence (localStorage)
// ---------------------------------------------------------------------------

export interface FarmPilotPlan {
  cropId: string;
  plantingDate: string;       // ISO date
  areaHa: number;
  productionSystem: ProductionSystem;
  irrigationSystem: 'drip' | 'sprinkler' | 'furrow' | 'rainfed';
  irrigationFlowLph?: number;  // flow rate L/h for duration calc
  targetYieldTonsHa?: number;
  fertilizerProduct?: string; // NPK 15-15-15 etc
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export const FARMPILOT_PLAN_KEY = 'farmpilot_plan_v1';
