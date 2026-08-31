/**
 * WUR Fertilizer Helper — Type definitions
 *
 * Mirrors the Python dataclasses in constants.py and engine.py.
 *
 * Source: Van der Lugt, G. et al. (2020). "Nutrient Solutions for Greenhouse
 * Crops", Version 4. ISBN 9789464021844. Eurofins Agro / Nouryon / SQM / Yara.
 *
 * Ported from the public reference implementation at
 * https://github.com/Nutulip/fertilizer_helper-2
 */

// ---------------------------------------------------------------------------
// Tank assignment for an A/B split stock-tank system
// ---------------------------------------------------------------------------
export type Tank = "A" | "B" | "EITHER";

// ---------------------------------------------------------------------------
// Substrate / growing-medium identifiers (Section B of the manual)
// ---------------------------------------------------------------------------
export type SubstrateType =
  | "INERT_SUBSTRATE"
  | "ORGANIC_MATERIAL"
  | "SOIL";

// ---------------------------------------------------------------------------
// Fertiliser record — Table 5, p. 26; tank class from Ch. 9, p. 31
// ---------------------------------------------------------------------------
export interface Fertiliser {
  /** Stable fertiliser id, e.g. "can_solid" */
  fid: string;
  /** English display name */
  name_en: string;
  /** Chinese display name */
  name_zh: string;
  /** Chemical formula as written in the manual */
  formula: string;
  /** g/mol of the written formula */
  formula_mass: number;
  /** Ion used to size the dose */
  driving_ion: string;
  /** mol ion per mol fertiliser */
  yields: Record<string, number>;
  /** Tank assignment */
  tank: Tank;
  /** "solid" (default) | "liquid" */
  phase: "solid" | "liquid";
  /** kg/L, liquids only */
  density: number | null;
  /** Micronutrient ion delivered (when this is a micro source) */
  micro_ion: string | null;
  /** w/w fraction, e.g. 0.06 for Fe 6% */
  micro_fraction: number | null;
  /** Whether the fertiliser carries sodium (recirculation concern) */
  sodium_bearing: boolean;
  /** Chelating agent, e.g. "EDTA" / "DTPA" / "EDDHA" / "HBED" */
  chelate_agent: string | null;
  /** (low, high) pH stability envelope */
  ph_stability: [number, number] | null;
}

/**
 * Compute grams of product per mole of the DRIVING ion.
 *
 * This is the 'MW' in `kg = mmol/L * MW * 0.1`. Calcium nitrate is
 * 1080 g/mol but carries 5 Ca, so the divisor is 1080/5 = 216 (p. 28).
 * Using the raw formula mass here over-doses by 5x.
 */
export function massPerMolIon(fert: Fertiliser): number {
  return fert.formula_mass / fert.yields[fert.driving_ion];
}

/** Bilingual display string: "English Term (中文翻译)" */
export function bi(en: string, zh: string): string {
  return `${en} (${zh})`;
}

// ---------------------------------------------------------------------------
// Crop growth-stage adjustment record
// ---------------------------------------------------------------------------
export interface StageAdjustment {
  stage: string;
  label_en: string;
  label_zh: string;
  /** mmol/L (macro) or umol/L (micro) deltas to apply */
  deltas: Record<string, number>;
  note_en?: string;
  note_zh?: string;
}

// ---------------------------------------------------------------------------
// Crop × substrate matrix — Section B of the manual
// ---------------------------------------------------------------------------
export interface WURCropMatrix {
  substrate_type: SubstrateType;
  source_page: number;
  /** How the root-zone target values were derived: "direct" / "1:1.5_volume" / "1:2_volume" */
  extract_method: string;
  /** (low, high) root-zone pH envelope */
  ph_root_zone: [number, number];
  /** Target fertigation pH */
  ph_fertigation: number;
  /** Target root-zone EC (mS/cm) */
  ec_root_zone: number;
  /** Target fertigation EC (mS/cm) */
  ec_fertigation: number;
  /** Macro (mmol/L) + micro (umol/L) root-zone targets */
  root_zone_targets: Record<string, number>;
  /** Macro fertigation recipe in mmol/L */
  fertigation: Record<string, number>;
  /** Micro fertigation recipe in umol/L */
  micro_fertigation: Record<string, number>;
  /** Crop root-zone Na ceiling (mmol/L) — null when no limit is published */
  na_max_root_zone: number | null;
  /** Crop root-zone Cl ceiling (mmol/L) — null when no limit is published */
  cl_max_root_zone: number | null;
  /** Per-stage adjustments (start / vegetative / flowering / fruit_set / production / end_season / winter) */
  growth_stages: Record<string, Record<string, number>>;
  /** Orthogonal CONDITION — supply above 5 L/m²/day — not a stage */
  high_water_adjustment: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Crop aggregate — all substrate matrices for one crop
// ---------------------------------------------------------------------------
export interface WURCrop {
  crop_id: string;
  name_en: string;
  name_zh: string;
  category: string;
  botanical: string;
  /** Substrate matrices — most crops publish 1–3 of the three substrate types */
  matrices: Partial<Record<SubstrateType, WURCropMatrix>>;
}

// ---------------------------------------------------------------------------
// Engine result types
// ---------------------------------------------------------------------------
export type Severity = "BLOCKING" | "CRITICAL" | "WARNING" | "INFO";

/** Safety gate raised by an engine check */
export interface Gate {
  /** Stable gate id, e.g. "G-PRECIP-RISK" */
  gid: string;
  severity: Severity;
  /** English title */
  title: string;
  /** Bilingual display title */
  title_text: string;
  /** English message */
  message: string;
  /** Bilingual display message */
  message_text: string;
  /** Trigger inputs (numeric) for diagnostics */
  triggered_by: Record<string, number>;
  /** English remedy */
  remedy: string;
  /** Bilingual display remedy */
  remedy_text: string;
  /** Source provenance tag, e.g. "SRC:WUR" or "SRC:PRACTICE" */
  provenance: string;
}

// ---------------------------------------------------------------------------
// Water quality classification (Table 1, p. 11)
// ---------------------------------------------------------------------------
export interface WaterQualityLevel {
  level: 1 | 2 | 3;
  ec_max: number;
  ion_max: number;
  na_ppm: string;
  cl_ppm: string;
  suitability_en: string;
  suitability_zh: string;
}

// ---------------------------------------------------------------------------
// Site policy — practice-layer defaults
// ---------------------------------------------------------------------------
export interface SitePolicy {
  // M1 — acid dosing
  /** Target HCO3⁻ buffer, mmol/L (WUR p. 24, range 0.50–0.75) */
  hco3_buffer_mmol_l: number;
  /** "NITRIC_FIRST" | "PHOSPHORIC_FIRST" | "PROPORTIONAL" */
  acid_policy: "NITRIC_FIRST" | "PHOSPHORIC_FIRST" | "PROPORTIONAL";

  // M2 — sodium
  /** Per-crop overrides of the WUR sodium ceiling */
  na_overrides: Record<string, number>;
  /** Multiplier on the ceiling to derive the operational target */
  na_safety_factor: number;
  /** Ratio (current/limit) at which "approaching" status fires */
  na_approach_ratio: number;
  /** Cl ceiling = Na ceiling + offset (mmol/L) */
  cl_offset: number;

  // M3 — leaching
  /** ΔEC (drain – dripper) that triggers a wash cycle, mS/cm */
  wash_trigger_delta_ec: number;
  /** Wash target LF band low edge (%) */
  wash_lf_min: number;
  /** Wash target LF band high edge (%) */
  wash_lf_max: number;
  /** Midpoint of the wash band; the STANDARD-case extra-irrigation target */
  wash_lf_target: number;
  /** At/above this LF, the 32.5 target is no longer a raise */
  wash_lf_moderate_min: number;
  /** At/above this LF, more volume is the wrong answer */
  wash_lf_anomaly_min: number;
  /** Points added to LF in the MODERATE case */
  wash_lf_moderate_step: number;
  /** Cap on MODERATE-case target LF */
  wash_lf_moderate_cap: number;
  /** {crop_id: {stage: L/m²/day}} overrides */
  reference_irrigation_overrides: Record<string, Record<string, number>>;

  // M4 — correction bands
  /** within 10–15% deviation → ±12.5% supply */
  band1_default: number;
  /** a further 15–25% deviation → ±20% supply */
  band2_default: number;

  // M6 — tanks
  /** "A few litres per m³" acid cap, p. 31 */
  tank_a_acid_cap_l: number;
  /** Stock tank volume (L) */
  tank_volume_l: number;
  /** 100× stock concentration factor */
  concentration_factor: number;

  // M8 — emergency gate
  /** Below this pH the recipe is suppressed */
  meltdown_ph_min: number;
  /** Above this EC the recipe is suppressed */
  meltdown_ec_max: number;
}

// ---------------------------------------------------------------------------
// Dose (per fertiliser)
// ---------------------------------------------------------------------------
export interface Dose {
  fert: Fertiliser;
  /** mmol/L (macro) or umol/L (micro) */
  amount_mmol_l: number;
  /** kg per stock tank */
  mass_kg: number;
  /** L per stock tank (liquids only) */
  volume_l: number | null;
  is_micro: boolean;
}

// ---------------------------------------------------------------------------
// Tank split (Ch. 9, p. 31)
// ---------------------------------------------------------------------------
export interface TankSplit {
  tank_a: Dose[];
  tank_b: Dose[];
  mass_a_kg: number;
  mass_b_kg: number;
  gates: Gate[];
}

// ---------------------------------------------------------------------------
// Acid dosing plan (Ch. 2, p. 24)
// ---------------------------------------------------------------------------
export interface AcidPlan {
  hco3_base_water: number;
  hco3_buffer_target: number;
  h_required: number;
  h_from_nitric: number;
  h_from_phosphoric: number;
  shortfall: number;
  hco3_residual: number;
  no3_added: number;
  p_added: number;
  /** Concentrated stock tank kg */
  nitric_kg: number;
  /** Concentrated stock tank L */
  nitric_l: number;
  /** Concentrated stock tank kg */
  phosphoric_kg: number;
  /** Concentrated stock tank L */
  phosphoric_l: number;
  /** Direct injection L (1× working strength) */
  nitric_l_direct: number;
  /** Direct injection L (1× working strength) */
  phosphoric_l_direct: number;
  /** Volume basis (L) for the direct-injection figures */
  direct_basis_volume_l: number;
  feasible: boolean;
}

// ---------------------------------------------------------------------------
// Iron chelate plan (Ch. 11, p. 36)
// ---------------------------------------------------------------------------
export interface FeChelatePlan {
  primary_fid: string;
  primary_share: number;
  secondary_fid: string | null;
  secondary_share: number;
  reason_en: string;
  reason_zh: string;
  require_ortho_ortho: boolean;
}

// ---------------------------------------------------------------------------
// Sodium accumulation result (Ch. 1, pp. 11–12, 24)
// ---------------------------------------------------------------------------
export interface SodiumResult {
  na_current: number;
  na_limit: number;
  na_target: number;
  na_base_water: number;
  headroom: number;
  ratio: number;
  status: "SAFE" | "APPROACHING" | "EXCEEDED" | "UNREACHABLE";
  discharge_volume_l_m2: number;
  system_volume_l_m2: number;
  limit_source: string;
  nutrient_loss: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Leaching fraction result (SRC:PRACTICE)
// ---------------------------------------------------------------------------
export type LeachingBand =
  | "DEFICIT"
  | "NORMAL_GENERATIVE"
  | "NORMAL_VEGETATIVE"
  | "WASH"
  | "EXCESS";

export type WashCase = "NONE" | "STANDARD" | "MODERATE" | "ANOMALY";

export interface LeachingResult {
  lf_pct: number;
  delta_ec: number;
  band: LeachingBand;
  wash_required: boolean;
  target_lf_min: number;
  target_lf_max: number;
  target_lf_pct: number;
  extra_irrigation_l_m2: number;
  target_irrigation_l_m2: number;
  used_irrigation_l_m2: number;
  drain_l_m2: number;
  uptake_l_m2: number;
  is_estimated_volume: boolean;
  wash_case: WashCase;
  is_wash_anomaly: boolean;
}

// ---------------------------------------------------------------------------
// Feedback correction finding (Ch. 5, p. 22)
// ---------------------------------------------------------------------------
export interface Finding {
  ion: string;
  analysed: number;
  at_reference_ec: number;
  target: number;
  deviation_pct: number;
  level: 0 | 1 | 2;
  band: "LOW" | "NORMAL" | "HIGH";
  adjustment_pct: number;
  adjustment_range: [number, number];
  is_micro: boolean;
}

// ---------------------------------------------------------------------------
// Steering result (Section B)
// ---------------------------------------------------------------------------
export interface SteeringResult {
  stages: string[];
  deltas: Record<string, number>;
  macro_before: Record<string, number>;
  macro_after: Record<string, number>;
  micro_before: Record<string, number>;
  micro_after: Record<string, number>;
  k_ca_ratio: number;
  k_n_ratio: number;
  dry_back_intent: string;
  dry_back_min: number;
  dry_back_max: number;
  notes: Array<[string, string]>;
  is_high_water_supply: boolean;
}

// ---------------------------------------------------------------------------
// Water analysis input
// ---------------------------------------------------------------------------
export interface WaterAnalysis {
  /** EC in mS/cm */
  ec?: number;
  /** Macro ions in mmol/L */
  macro?: Record<string, number>;
  /** Micro ions in umol/L */
  micro?: Record<string, number>;
  /** pH (optional) */
  ph?: number;
  /** HCO3⁻ in mmol/L */
  hco3?: number;
}

// ---------------------------------------------------------------------------
// Top-level engine result
// ---------------------------------------------------------------------------
export interface WURRecipe {
  /** Macro fertigation in mmol/L (post stage-adjustment, post feedback) */
  macro: Record<string, number>;
  /** Micro fertigation in umol/L (post stage-adjustment, post feedback) */
  micro: Record<string, number>;
  /** Per-fertiliser doses */
  doses: Dose[];
  /** Residual ion deviations from greedy allocation */
  residual: Record<string, number>;
}

export interface WURFertigationPrescription {
  ec_target: number;
  ph_target: number;
  acid_plan: AcidPlan | null;
  fe_chelate_plan: FeChelatePlan | null;
  base_water_credit: Record<string, number>;
  drain_credit: Record<string, number>;
  base_water_excess: Record<string, number>;
  scaling_factors: { f_cations: number; f_anions: number } | null;
  balance_report: {
    eq_cations_meq_l: number;
    eq_anions_meq_l: number;
    difference_pct: number;
    balanced: boolean;
    calculated_ec_ms_cm: number;
    tolerance_pct: number;
  } | null;
}

export interface WURTanks {
  tank_a: Dose[];
  tank_b: Dose[];
  mass_a_kg: number;
  mass_b_kg: number;
}

export interface WURAdvisories {
  sodium: SodiumResult | null;
  leaching: LeachingResult | null;
  steering: SteeringResult | null;
  findings: Finding[];
  corrections_meta: Record<string, number> | null;
}

export interface WURCalculationResult {
  gates: Gate[];
  recipe: WURRecipe | null;
  fertigation_prescription: WURFertigationPrescription;
  ab_tanks: WURTanks | null;
  advisories: WURAdvisories;
  emergency: {
    emergency: true;
    gate_id: "G-MELTDOWN";
    severity: "BLOCKING";
    title: string;
    title_text: string;
    reason: string;
    reason_text: string;
    measured_ph: number;
    measured_ec_ms_cm: number;
    limit_ph_min: number;
    limit_ec_max: number;
    instructions: Array<{
      step: number;
      action: string;
      action_text: string;
    }>;
    provenance: string;
  } | null;
}
