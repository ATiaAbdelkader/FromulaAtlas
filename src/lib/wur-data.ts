/**
 * WUR Fertilizer Helper — barrel export
 *
 * Re-exports everything from the WUR data + engine modules so callers can
 * `import { ... } from "@/lib/wur-data"` without having to know which file
 * a particular constant or function lives in.
 *
 * Modules:
 *   wur-types                   — TypeScript interfaces mirroring the Python
 *                                dataclasses.
 *   wur-fertilizer-catalogue    — 26 fertilisers + atomic weights + water
 *                                quality levels + site policy.
 *   wur-crop-matrices           — 24 crops × 47 crop×substrate matrices.
 *   wur-engine                  — deterministic calculation engine (M1, M2,
 *                                M4–M8).
 *   wur-leaching                — leaching fraction & ΔEC washing (M3).
 */

// Types
export type {
  AcidPlan,
  Dose,
  FeChelatePlan,
  Fertiliser,
  Finding,
  Gate,
  LeachingBand,
  LeachingResult,
  Severity,
  SitePolicy,
  SodiumResult,
  StageAdjustment,
  SteeringResult,
  SubstrateType,
  Tank,
  TankSplit,
  WashCase,
  WaterAnalysis,
  WaterQualityLevel,
  WURAdvisories,
  WURCalculationResult,
  WURCrop,
  WURCropMatrix,
  WURFertigationPrescription,
  WURRecipe,
  WURTanks,
} from "./wur-types";

// Engine-side types
export type {
  AntagonismMatch,
  BalanceReport,
  CalculateRecipeInput,
  CalculateRecipeOutput,
  EmergencyPayload,
  ReferenceEcMeta,
  SafetyGateInput,
} from "./wur-engine";

// Catalogue (constants.py port)
export {
  APN_UMOL_L,
  ATOMIC_WEIGHTS,
  CATIONS,
  ANIONS,
  CL_OFFSET_MMOL_L,
  DEFAULT_POLICY,
  EC_DIVISOR,
  ELEMENTAL_TO_OXIDE,
  FE_CHELATE_BANDS,
  FE_CHELATE_SWITCH_PH,
  FERTILISERS,
  ION_BALANCE_TOLERANCE,
  ION_CHARGE,
  NA_EC_FACTOR,
  NA_LIMITS_MMOL_L,
  OXIDE_TO_ELEMENTAL,
  PROPHYLACTIC_NFT,
  PROPHYLACTIC_SUBSTRATE,
  REFERENCE_EC_OFFSET,
  REFERENCE_IRRIGATION_BY_CATEGORY,
  REFERENCE_IRRIGATION_FALLBACK,
  REFERENCE_IRRIGATION_L_M2_DAY,
  WATER_QUALITY_LEVELS,
  referenceIrrigation,
  registerCropLookup,
} from "./wur-fertilizer-catalogue";
export { bi, massPerMolIon } from "./wur-types";

// Crop matrices (crops_wur.json port)
export {
  buildStageAdjustments,
  CROP_CATEGORIES,
  CROP_CATEGORY_LABELS,
  cropMeta,
  cropIds,
  cropsInCategory,
  DEFAULT_SUBSTRATE,
  END_SEASON_NOTE_EN,
  END_SEASON_NOTE_ZH,
  EXTRACT_METHOD_LABELS,
  EXTRACT_METHODS,
  FRUIT_SET_NOTE_EN,
  FRUIT_SET_NOTE_ZH,
  getCrop,
  GROWTH_STAGE_LABELS,
  growthStagesFor,
  HIGH_WATER_NOTE_EN,
  HIGH_WATER_NOTE_ZH,
  SUBSTRATE_LABELS,
  SUBSTRATE_TYPES,
  substratesFor,
  WUR_CROPS,
} from "./wur-crop-matrices";

// Engine (engine.py port — M1, M2, M4–M8)
export {
  acidGates,
  acidMolarityMolPerL,
  acidVolumeDirectL,
  allocateFertilisers,
  ammoniumGates,
  ANTAGONISM_RULES,
  applyCorrections,
  applyStageAdjustments,
  baseWaterExcess,
  baseWaterExcessGates,
  balanceReport,
  calculateAcidDose,
  calculateIonBalance,
  calculateMass,
  calculateRecipe,
  cationBalancePct,
  CREDITABLE_FROM_BASE_WATER,
  chelateGates,
  checkSafetyGates,
  checkWaterQuality,
  classifyWater,
  convertAnalysisToMmol,
  correctionFactor,
  deductBaseWater,
  deductDrain,
  DRY_BACK_TARGETS,
  ecFromIons,
  emergencyCheck,
  eqAnions,
  eqCations,
  evaluateCorrections,
  evaluateSodium,
  feChelateAllocation,
  FIXED_IONS,
  ironScreeningGates,
  ionBalanceGates,
  MACRO_IONS,
  makeDose,
  makeMicroDose,
  microStep,
  MICRO_LADDER,
  micronutrientScreeningGates,
  mmolToPpm,
  naLimitFor,
  normalizeEC,
  ppbToUmol,
  ppmToMmol,
  planAcidDosing,
  residualGates,
  scaleDose,
  scaleToEc,
  SCALABLE_ANIONS,
  SCALABLE_CATIONS,
  SCALABLE_IONS,
  screenAntagonism,
  selectFeChelate,
  selectIronChelate,
  SEVERITY_ORDER,
  sodiumGates,
  sortGates,
  splitAbTanks,
  splitTanks,
  stockMassKg,
  stockMassMicroG,
  steeringGates,
  tankPhGates,
  toReferenceEc,
  umolToPpb,
  validateTankSeparation,
  waterQualityGates,
} from "./wur-engine";

// Leaching (engine.py M3 module port)
export {
  calculateExtraIrrigation,
  calculateLeachingFraction,
  checkWashTrigger,
  detectWashAnomaly,
  EPS,
  evaluateLeaching,
  extraIrrigationForTargetLf,
  formatExtraIrrigation,
  LF_BANDS,
  leachingGates,
  washTargetLf,
} from "./wur-leaching";
