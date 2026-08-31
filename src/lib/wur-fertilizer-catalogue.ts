/**
 * WUR Fertiliser catalogue and reference constants
 *
 * Ported verbatim from constants.py (Table 5, p. 26 of the WUR manual).
 *
 * Every constant below is transcribed from the manual with its page citation.
 * Nothing in this module is invented.
 */

import type {
  Fertiliser,
  SitePolicy,
  WaterQualityLevel,
} from "./wur-types";

// ---------------------------------------------------------------------------
// WUR Atomic Weight Matrix — Table 7, p. 39 (g/mol == mg/mmol == ug/umol)
// ---------------------------------------------------------------------------
export const ATOMIC_WEIGHTS: Record<string, number> = {
  // Macronutrients (required by spec)
  K: 39.1,
  Ca: 40.08,
  Mg: 24.31,
  N: 14.0,
  P: 30.97,
  S: 32.06,
  // Remaining macro ions from Table 7
  N_NO3: 14.0,
  N_NH4: 14.0,
  NO3: 14.0, // reported as N-NO3
  NH4: 14.0, // reported as N-NH4
  Na: 22.99,
  Cl: 35.45,
  HCO3: 61.02,
  // Micronutrients
  Fe: 55.85,
  Mn: 54.94,
  Zn: 65.38,
  B: 10.81,
  Cu: 63.55,
  Mo: 95.94,
};

/**
 * Ion charge for equivalent arithmetic — Formulas 1-2, p. 21.
 * H+ participates as a cation (proven by Table 3 step 7 balance closure).
 */
export const ION_CHARGE: Record<string, number> = {
  NH4: 1,
  K: 1,
  Na: 1,
  Ca: 2,
  Mg: 2,
  H: 1,
  NO3: 1,
  Cl: 1,
  S: 2,
  HCO3: 1,
  P: 1,
};

export const CATIONS = ["NH4", "K", "Na", "Ca", "Mg", "H"] as const;
export const ANIONS = ["NO3", "Cl", "S", "HCO3", "P"] as const;

export const EC_DIVISOR = 20.0; // Formula 4, p. 21
export const ION_BALANCE_TOLERANCE = 0.1; // <10% acceptable, p. 21
export const REFERENCE_EC_OFFSET = 0.3; // EC_ref = EC_target - 0.30, p. 21
export const NA_EC_FACTOR = 0.1; // EC_nutrients = EC - 0.1 * Na, p. 22

// Oxide ↔ elemental conversion — Table 4, p. 25
export const OXIDE_TO_ELEMENTAL: Record<string, number> = {
  NO3_to_N: 0.226,
  NH4_to_N: 0.776,
  P2O5_to_P: 0.436,
  K2O_to_K: 0.83,
  CaO_to_Ca: 0.715,
  MgO_to_Mg: 0.603,
  SO4_to_S: 0.334,
  SO3_to_S: 0.4,
};

export const ELEMENTAL_TO_OXIDE: Record<string, number> = {
  N_to_NO3: 4.426,
  N_to_NH4: 1.288,
  P_to_P2O5: 2.292,
  K_to_K2O: 1.205,
  Ca_to_CaO: 1.399,
  Mg_to_MgO: 1.658,
  S_to_SO4: 2.996,
  S_to_SO3: 2.497,
};

// ---------------------------------------------------------------------------
// Fertiliser catalogue — Table 5, p. 26; tank class from Ch. 9, p. 31
// ---------------------------------------------------------------------------

export const FERTILISERS: Record<string, Fertiliser> = {
  // ---- acids ----
  hno3_38: {
    fid: "hno3_38",
    name_en: "Nitric acid 38%",
    name_zh: "硝酸 38%",
    formula: "HNO3",
    formula_mass: 167.0,
    driving_ion: "H",
    yields: { H: 1, NO3: 1 },
    tank: "EITHER",
    phase: "liquid",
    density: 1.24,
    micro_ion: null,
    micro_fraction: null,
    sodium_bearing: false,
    chelate_agent: null,
    ph_stability: null,
  },
  hno3_60: {
    fid: "hno3_60",
    name_en: "Nitric acid 60%",
    name_zh: "硝酸 60%",
    formula: "HNO3",
    formula_mass: 105.0,
    driving_ion: "H",
    yields: { H: 1, NO3: 1 },
    tank: "EITHER",
    phase: "liquid",
    density: 1.37,
    micro_ion: null,
    micro_fraction: null,
    sodium_bearing: false,
    chelate_agent: null,
    ph_stability: null,
  },
  h3po4_59: {
    fid: "h3po4_59",
    name_en: "Phosphoric acid 59%",
    name_zh: "磷酸 59%",
    formula: "H3PO4",
    formula_mass: 167.0,
    driving_ion: "H",
    yields: { H: 1, P: 1 },
    tank: "B",
    phase: "liquid",
    density: 1.42,
    micro_ion: null,
    micro_fraction: null,
    sodium_bearing: false,
    chelate_agent: null,
    ph_stability: null,
  },

  // ---- main elements ----
  can_solid: {
    fid: "can_solid",
    name_en: "Calcium nitrate solid",
    name_zh: "固体硝酸钙",
    formula: "5[Ca(NO3)2.2H2O].NH4NO3",
    formula_mass: 1080.0,
    driving_ion: "Ca",
    yields: { Ca: 5, NH4: 1, NO3: 11 },
    tank: "A",
    phase: "solid",
    density: null,
    micro_ion: null,
    micro_fraction: null,
    sodium_bearing: false,
    chelate_agent: null,
    ph_stability: null,
  },
  cacl2_s: {
    fid: "cacl2_s",
    name_en: "Calcium chloride anhydrous",
    name_zh: "无水氯化钙",
    formula: "CaCl2",
    formula_mass: 111.0,
    driving_ion: "Cl",
    yields: { Ca: 1, Cl: 2 },
    tank: "A",
    phase: "solid",
    density: null,
    micro_ion: null,
    micro_fraction: null,
    sodium_bearing: false,
    chelate_agent: null,
    ph_stability: null,
  },
  map: {
    fid: "map",
    name_en: "Monoammonium phosphate",
    name_zh: "磷酸一铵",
    formula: "NH4H2PO4",
    formula_mass: 115.0,
    driving_ion: "NH4",
    yields: { NH4: 1, P: 1 },
    tank: "B",
    phase: "solid",
    density: null,
    micro_ion: null,
    micro_fraction: null,
    sodium_bearing: false,
    chelate_agent: null,
    ph_stability: null,
  },
  nh4no3_liq: {
    fid: "nh4no3_liq",
    name_en: "Ammonium nitrate liquid",
    name_zh: "液体硝酸铵",
    formula: "NH4NO3",
    formula_mass: 156.0,
    driving_ion: "NH4",
    yields: { NH4: 1, NO3: 1 },
    tank: "EITHER",
    phase: "liquid",
    density: 1.25,
    micro_ion: null,
    micro_fraction: null,
    sodium_bearing: false,
    chelate_agent: null,
    ph_stability: null,
  },
  mkp: {
    fid: "mkp",
    name_en: "Monopotassium phosphate",
    name_zh: "磷酸二氢钾",
    formula: "KH2PO4",
    formula_mass: 136.1,
    driving_ion: "P",
    yields: { K: 1, P: 1 },
    tank: "B",
    phase: "solid",
    density: null,
    micro_ion: null,
    micro_fraction: null,
    sodium_bearing: false,
    chelate_agent: null,
    ph_stability: null,
  },
  mgso4: {
    fid: "mgso4",
    name_en: "Magnesium sulphate",
    name_zh: "七水硫酸镁",
    formula: "MgSO4.7H2O",
    formula_mass: 246.4,
    driving_ion: "Mg",
    yields: { Mg: 1, S: 1 },
    tank: "B",
    phase: "solid",
    density: null,
    micro_ion: null,
    micro_fraction: null,
    sodium_bearing: false,
    chelate_agent: null,
    ph_stability: null,
  },
  mgno3_s: {
    fid: "mgno3_s",
    name_en: "Magnesium nitrate",
    name_zh: "六水硝酸镁",
    formula: "Mg(NO3)2.6H2O",
    formula_mass: 256.0,
    driving_ion: "Mg",
    yields: { Mg: 1, NO3: 2 },
    tank: "EITHER",
    phase: "solid",
    density: null,
    micro_ion: null,
    micro_fraction: null,
    sodium_bearing: false,
    chelate_agent: null,
    ph_stability: null,
  },
  k2so4: {
    fid: "k2so4",
    name_en: "Potassium sulphate",
    name_zh: "硫酸钾",
    formula: "K2SO4",
    formula_mass: 174.3,
    driving_ion: "S",
    yields: { K: 2, S: 1 },
    tank: "B",
    phase: "solid",
    density: null,
    micro_ion: null,
    micro_fraction: null,
    sodium_bearing: false,
    chelate_agent: null,
    ph_stability: null,
  },
  kno3: {
    fid: "kno3",
    name_en: "Potassium nitrate",
    name_zh: "硝酸钾",
    formula: "KNO3",
    formula_mass: 101.1,
    driving_ion: "K",
    yields: { K: 1, NO3: 1 },
    tank: "EITHER",
    phase: "solid",
    density: null,
    micro_ion: null,
    micro_fraction: null,
    sodium_bearing: false,
    chelate_agent: null,
    ph_stability: null,
  },
  kcl: {
    fid: "kcl",
    name_en: "Potassium chloride",
    name_zh: "氯化钾",
    formula: "KCl",
    formula_mass: 74.6,
    driving_ion: "Cl",
    yields: { K: 1, Cl: 1 },
    tank: "EITHER",
    phase: "solid",
    density: null,
    micro_ion: null,
    micro_fraction: null,
    sodium_bearing: false,
    chelate_agent: null,
    ph_stability: null,
  },

  // ---- micronutrients: chelates (tank A preferred, Ch. 9 p. 31) ----
  fe_edta: {
    fid: "fe_edta",
    name_en: "Iron chelate Fe-EDTA 13%",
    name_zh: "铁螯合物 Fe-EDTA 13%",
    formula: "Fe-EDTA",
    formula_mass: 429.0,
    driving_ion: "Fe",
    yields: { Fe: 1 },
    tank: "A",
    phase: "solid",
    density: null,
    micro_ion: "Fe",
    micro_fraction: 0.13,
    sodium_bearing: false,
    chelate_agent: "EDTA",
    ph_stability: [1.5, 6.5],
  },
  fe_dtpa: {
    fid: "fe_dtpa",
    name_en: "Iron chelate Fe-DTPA 6%",
    name_zh: "铁螯合物 Fe-DTPA 6%",
    formula: "Fe-DTPA",
    formula_mass: 931.0,
    driving_ion: "Fe",
    yields: { Fe: 1 },
    tank: "A",
    phase: "solid",
    density: null,
    micro_ion: "Fe",
    micro_fraction: 0.06,
    sodium_bearing: false,
    chelate_agent: "DTPA",
    ph_stability: [1.5, 7.5],
  },
  fe_eddha: {
    fid: "fe_eddha",
    name_en: "Iron chelate Fe-EDDHA 6%",
    name_zh: "铁螯合物 Fe-EDDHA 6%",
    formula: "Fe-EDDHA",
    formula_mass: 931.0,
    driving_ion: "Fe",
    yields: { Fe: 1 },
    tank: "A",
    phase: "solid",
    density: null,
    micro_ion: "Fe",
    micro_fraction: 0.06,
    sodium_bearing: false,
    chelate_agent: "EDDHA",
    ph_stability: [3.0, 10.0],
  },
  fe_hbed: {
    fid: "fe_hbed",
    name_en: "Iron chelate Fe-HBED 6%",
    name_zh: "铁螯合物 Fe-HBED 6%",
    formula: "Fe-HBED",
    formula_mass: 931.0,
    driving_ion: "Fe",
    yields: { Fe: 1 },
    tank: "A",
    phase: "solid",
    density: null,
    micro_ion: "Fe",
    micro_fraction: 0.06,
    sodium_bearing: false,
    chelate_agent: "HBED",
    ph_stability: [3.0, 12.0],
  },
  mn_edta: {
    fid: "mn_edta",
    name_en: "Manganese EDTA 13%",
    name_zh: "锰螯合物 Mn-EDTA 13%",
    formula: "Mn-EDTA",
    formula_mass: 423.0,
    driving_ion: "Mn",
    yields: { Mn: 1 },
    tank: "A",
    phase: "solid",
    density: null,
    micro_ion: "Mn",
    micro_fraction: 0.13,
    sodium_bearing: false,
    chelate_agent: "EDTA",
    ph_stability: [3.0, 10.0],
  },
  zn_edta: {
    fid: "zn_edta",
    name_en: "Zinc EDTA 15%",
    name_zh: "锌螯合物 Zn-EDTA 15%",
    formula: "Zn-EDTA",
    formula_mass: 436.0,
    driving_ion: "Zn",
    yields: { Zn: 1 },
    tank: "A",
    phase: "solid",
    density: null,
    micro_ion: "Zn",
    micro_fraction: 0.15,
    sodium_bearing: false,
    chelate_agent: "EDTA",
    ph_stability: [2.0, 10.0],
  },
  cu_edta: {
    fid: "cu_edta",
    name_en: "Copper EDTA 15%",
    name_zh: "铜螯合物 Cu-EDTA 15%",
    formula: "Cu-EDTA",
    formula_mass: 424.0,
    driving_ion: "Cu",
    yields: { Cu: 1 },
    tank: "A",
    phase: "solid",
    density: null,
    micro_ion: "Cu",
    micro_fraction: 0.15,
    sodium_bearing: false,
    chelate_agent: "EDTA",
    ph_stability: [1.5, 10.0],
  },

  // ---- micronutrients: salts (tank B, Ch. 9 p. 31) ----
  borax: {
    fid: "borax",
    name_en: "Borax 11.3% B",
    name_zh: "硼砂 11.3% B",
    formula: "Na2B4O7.10H2O",
    formula_mass: 381.0,
    driving_ion: "B",
    yields: { B: 4 },
    tank: "B",
    phase: "solid",
    density: null,
    micro_ion: "B",
    micro_fraction: 0.113,
    sodium_bearing: true,
    chelate_agent: null,
    ph_stability: null,
  },
  h3bo3: {
    fid: "h3bo3",
    name_en: "Boric acid 17.5% B",
    name_zh: "硼酸 17.5% B",
    formula: "H3BO3",
    formula_mass: 62.0,
    driving_ion: "B",
    yields: { B: 1 },
    tank: "B",
    phase: "solid",
    density: null,
    micro_ion: "B",
    micro_fraction: 0.175,
    sodium_bearing: false,
    chelate_agent: null,
    ph_stability: null,
  },
  na_moly: {
    fid: "na_moly",
    name_en: "Sodium molybdate 39.6%",
    name_zh: "钼酸钠 39.6%",
    formula: "Na2MoO4.2H2O",
    formula_mass: 241.9,
    driving_ion: "Mo",
    yields: { Mo: 1 },
    tank: "B",
    phase: "solid",
    density: null,
    micro_ion: "Mo",
    micro_fraction: 0.396,
    sodium_bearing: true,
    chelate_agent: null,
    ph_stability: null,
  },
  mnso4: {
    fid: "mnso4",
    name_en: "Manganese sulphate 32.5%",
    name_zh: "硫酸锰 32.5%",
    formula: "MnSO4.H2O",
    formula_mass: 169.0,
    driving_ion: "Mn",
    yields: { Mn: 1, S: 1 },
    tank: "B",
    phase: "solid",
    density: null,
    micro_ion: "Mn",
    micro_fraction: 0.325,
    sodium_bearing: false,
    chelate_agent: null,
    ph_stability: null,
  },
  znso4: {
    fid: "znso4",
    name_en: "Zinc sulphate 22.7%",
    name_zh: "硫酸锌 22.7%",
    formula: "ZnSO4.7H2O",
    formula_mass: 287.5,
    driving_ion: "Zn",
    yields: { Zn: 1, S: 1 },
    tank: "B",
    phase: "solid",
    density: null,
    micro_ion: "Zn",
    micro_fraction: 0.227,
    sodium_bearing: false,
    chelate_agent: null,
    ph_stability: null,
  },
  cuso4: {
    fid: "cuso4",
    name_en: "Copper sulphate 25.5%",
    name_zh: "硫酸铜 25.5%",
    formula: "CuSO4.5H2O",
    formula_mass: 249.7,
    driving_ion: "Cu",
    yields: { Cu: 1, S: 1 },
    tank: "B",
    phase: "solid",
    density: null,
    micro_ion: "Cu",
    micro_fraction: 0.255,
    sodium_bearing: false,
    chelate_agent: null,
    ph_stability: null,
  },
};

// ---------------------------------------------------------------------------
// Water quality levels — Table 1, p. 11
// ---------------------------------------------------------------------------
export const WATER_QUALITY_LEVELS: WaterQualityLevel[] = [
  {
    level: 1,
    ec_max: 0.5,
    ion_max: 1.5,
    na_ppm: "< 34",
    cl_ppm: "< 53",
    suitability_en: "Suitable for all crops",
    suitability_zh: "适用于所有作物",
  },
  {
    level: 2,
    ec_max: 1.0,
    ion_max: 2.5,
    na_ppm: "34 - 57",
    cl_ppm: "53 - 87",
    suitability_en: "Not suitable when recirculation is necessary",
    suitability_zh: "需要循环回用时不适用",
  },
  {
    level: 3,
    ec_max: 1.5,
    ion_max: 4.0,
    na_ppm: "57 - 92",
    cl_ppm: "87 - 142",
    suitability_en: "Not to be used for salt-sensitive crops",
    suitability_zh: "不可用于盐敏感作物",
  },
];

// ---------------------------------------------------------------------------
// Maximum root-zone Na — Table 2, p. 12
//
// NOTE: these are the manual's values. The project brief quoted Tomato ≤ 15
// and Cucumber ≤ 8; both are looser than the source (8 and 6 respectively).
// See design.md section 2.2, discrepancy D-1. Overrides are possible through
// SitePolicy.na_overrides but are badged as practice, never as WUR canon.
// ---------------------------------------------------------------------------
export const NA_LIMITS_MMOL_L: Record<string, number> = {
  tomato: 8.0,
  sweet_pepper: 6.0,
  eggplant: 6.0,
  cucumber: 6.0,
  melon: 6.0,
  rose: 4.0,
  gerbera: 4.0,
  carnation: 4.0,
  orchid: 1.0,
};

/** Cl ceiling = Na ceiling + 0.2–0.5 mmol/L, p. 12 */
export const CL_OFFSET_MMOL_L = 0.2;

// ---------------------------------------------------------------------------
// Fe-chelate pH stability — Figure 3a, p. 35 (refined by Nouryon table, p. 27)
// ---------------------------------------------------------------------------
export const FE_CHELATE_BANDS: Record<string, [number, number]> = {
  fe_edta: [1.5, 6.5],
  fe_dtpa: [1.5, 7.5],
  fe_eddha: [3.0, 10.0],
  fe_hbed: [3.0, 12.0],
};

/** p. 36 — NOT 7.0; see design.md D-2 */
export const FE_CHELATE_SWITCH_PH = 6.5;
/** Replace 25% of Fe with EDDHA/HBED, p. 36 */
export const PROPHYLACTIC_SUBSTRATE = 0.25;
/** Replace 10% in NFT, p. 36 */
export const PROPHYLACTIC_NFT = 0.1;

// ---------------------------------------------------------------------------
// Average Plant Need — Table 6, p. 34 (umol/L)
// ---------------------------------------------------------------------------
export const APN_UMOL_L: Record<string, Record<string, number>> = {
  rose: { Fe: 25, Mn: 5, Zn: 3, B: 20, Cu: 0.8, Mo: 0.5 },
  potted_plant: { Fe: 15, Mn: 5, Zn: 4, B: 10, Cu: 0.5, Mo: 0.5 },
  tomato: { Fe: 15, Mn: 10, Zn: 5, B: 30, Cu: 0.8, Mo: 0.5 },
};

// ---------------------------------------------------------------------------
// Reference daily irrigation volumes — SRC:PRACTICE
// ---------------------------------------------------------------------------
export const REFERENCE_IRRIGATION_L_M2_DAY: Record<string, Record<string, number>> = {
  //                 start  fruit_set  high_water  end_season  standard
  tomato: { start: 1.5, fruit_set: 3.8, high_water: 5.5, end_season: 2.5, standard: 3.8 },
  cucumber: { start: 1.5, fruit_set: 4.0, high_water: 5.5, end_season: 2.5, standard: 4.0 },
  sweet_pepper: { start: 1.3, fruit_set: 3.5, high_water: 5.5, end_season: 2.2, standard: 3.5 },
};

export const REFERENCE_IRRIGATION_BY_CATEGORY: Record<string, Record<string, number>> = {
  fruiting_vegetables: { start: 1.5, fruit_set: 3.8, high_water: 5.5, end_season: 2.5, standard: 3.8 },
  soft_fruits: { start: 1.0, fruit_set: 2.5, high_water: 5.2, end_season: 1.5, standard: 2.5 },
  leafy_vegetables: { start: 0.8, fruit_set: 2.0, high_water: 5.2, end_season: 1.2, standard: 2.0 },
  cut_flowers: { start: 1.2, fruit_set: 3.0, high_water: 5.2, end_season: 1.8, standard: 3.0 },
  potted_plants: { start: 0.8, fruit_set: 1.8, high_water: 5.2, end_season: 1.2, standard: 1.8 },
};

/** Used when neither the crop nor its category is known. */
export const REFERENCE_IRRIGATION_FALLBACK = 3.5;

/**
 * Fallback daily irrigation volume in L/m²/day for a crop at given stage(s).
 *
 * Stages stack in this system, so when several are active the highest
 * demand wins — a crop in fruit set during a heat wave is watered to the
 * heat wave, not to the average of the two.
 */
export function referenceIrrigation(
  cropId: string,
  stages: string[] | null = null,
  overrides: Record<string, Record<string, number>> | null = null,
): number {
  const table: Record<string, Record<string, number>> = {
    ...REFERENCE_IRRIGATION_L_M2_DAY,
  };
  if (overrides) {
    for (const [cid, perStage] of Object.entries(overrides)) {
      table[cid] = { ...(table[cid] ?? {}), ...perStage };
    }
  }

  let perStage = table[cropId];
  if (!perStage) {
    // Look up category defaults from the WUR crop library (lazy import to
    // avoid circular module dependency).
    // We use a module-level cache flag to fetch the crop on demand.
    const meta = peekCropMeta(cropId);
    if (meta) {
      perStage = REFERENCE_IRRIGATION_BY_CATEGORY[meta.category];
    }
  }
  if (!perStage) {
    return REFERENCE_IRRIGATION_FALLBACK;
  }

  const active = (stages ?? []).filter((s) => s in perStage);
  if (active.length === 0) {
    return perStage.standard ?? REFERENCE_IRRIGATION_FALLBACK;
  }
  return Math.max(...active.map((s) => perStage[s]));
}

// ---------------------------------------------------------------------------
// Default site policy
// ---------------------------------------------------------------------------
export const DEFAULT_POLICY: SitePolicy = {
  // M1 — acid dosing
  hco3_buffer_mmol_l: 0.5,
  acid_policy: "NITRIC_FIRST",

  // M2 — sodium
  na_overrides: {},
  na_safety_factor: 0.9,
  na_approach_ratio: 0.8,
  cl_offset: CL_OFFSET_MMOL_L,

  // M3 — leaching
  wash_trigger_delta_ec: 2.0,
  wash_lf_min: 30.0,
  wash_lf_max: 35.0,
  wash_lf_target: 32.5,
  wash_lf_moderate_min: 30.0,
  wash_lf_anomaly_min: 40.0,
  wash_lf_moderate_step: 10.0,
  wash_lf_moderate_cap: 50.0,
  reference_irrigation_overrides: {},

  // M4 — correction bands
  band1_default: 0.125,
  band2_default: 0.2,

  // M6 — tanks
  tank_a_acid_cap_l: 4.0,
  tank_volume_l: 1000.0,
  concentration_factor: 100.0,

  // M8 — emergency gate
  meltdown_ph_min: 5.2,
  meltdown_ec_max: 4.5,
};

// ---------------------------------------------------------------------------
// Crop-meta resolver hook
//
// `wur-crop-matrices.ts` calls registerCropLookup so this module can use the
// crop library without a hard import (which would create a circular
// dependency when the crop-matrices module imports constants from here).
// ---------------------------------------------------------------------------
type CropMetaLookup = (cropId: string) => { category: string } | null;
let cropMetaLookup: CropMetaLookup = () => null;

export function registerCropLookup(fn: CropMetaLookup): void {
  cropMetaLookup = fn;
}

function peekCropMeta(cropId: string): { category: string } | null {
  return cropMetaLookup(cropId);
}
