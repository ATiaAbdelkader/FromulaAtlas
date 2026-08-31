/**
 * WUR Deterministic Calculation Engine — the hard layer.
 *
 * Ported from engine.py (reference implementation):
 *   https://github.com/Nutulip/fertilizer_helper-2
 *
 * Pure functions only: no I/O, no network, no LLM. Every public function is
 * f(inputs, reference_data) -> results. This is what makes the engine testable
 * against the manual's own worked examples.
 *
 * Module map (matches the implementation brief):
 *   M1  ppm → mmol/L conversion & HCO₃ acid dosing (0.5 mmol/L buffer)
 *   M2  Crop Na+ threshold check & discharge alert
 *   M3  Leaching Fraction & delta-EC washing logic    (see wur-leaching.ts)
 *   M4  3-level feedback correction (25% / 50% steps) + micro ladder
 *   M5  Stage steering adjustments (Fruit Set K:N shifts)
 *   M6  A/B stock tank mass splitting & Fe chelate selection
 *   M7  Base water nutrient auto-deduction (+ recipe pipeline)
 *   M8  Emergency meltdown gate (pH < 5.2 or EC > 4.5)
 */

import type {
  AcidPlan,
  Dose,
  FeChelatePlan,
  Finding,
  Fertiliser,
  Gate,
  Severity,
  SitePolicy,
  SodiumResult,
  SteeringResult,
  TankSplit,
  WURCropMatrix,
} from "./wur-types";
import { bi, massPerMolIon } from "./wur-types";
import {
  ANIONS,
  ATOMIC_WEIGHTS,
  CATIONS,
  CL_OFFSET_MMOL_L,
  DEFAULT_POLICY,
  EC_DIVISOR,
  FERTILISERS,
  FE_CHELATE_SWITCH_PH,
  ION_BALANCE_TOLERANCE,
  ION_CHARGE,
  NA_EC_FACTOR,
  NA_LIMITS_MMOL_L,
  PROPHYLACTIC_NFT,
  PROPHYLACTIC_SUBSTRATE,
  REFERENCE_EC_OFFSET,
  WATER_QUALITY_LEVELS,
} from "./wur-fertilizer-catalogue";
import {
  DEFAULT_SUBSTRATE,
  getCrop,
  HIGH_WATER_NOTE_EN,
  HIGH_WATER_NOTE_ZH,
} from "./wur-crop-matrices";

export const EPS = 1e-9;

export const MACRO_IONS = [
  "NH4",
  "K",
  "Ca",
  "Mg",
  "NO3",
  "Cl",
  "S",
  "P",
] as const;

export const MICRO_IONS = [
  "Fe",
  "Mn",
  "Zn",
  "B",
  "Cu",
  "Mo",
] as const;

// ==========================================================================
// Gates
// ==========================================================================

const _SEVERITY_TEXT: Record<Severity, string> = {
  BLOCKING: bi("Blocking", "阻断"),
  CRITICAL: bi("Critical", "严重"),
  WARNING: bi("Warning", "警告"),
  INFO: bi("Information", "提示"),
};

export const SEVERITY_ORDER: Record<Severity, number> = {
  BLOCKING: 0,
  CRITICAL: 1,
  WARNING: 2,
  INFO: 3,
};

/** Sort gates by severity (BLOCKING first, INFO last). */
export function sortGates(gates: Gate[]): Gate[] {
  return [...gates].sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9),
  );
}

// ==========================================================================
// M1a — Unit conversion (Ch. 12, p. 39)
// ==========================================================================

/** ppm (mg/L) / atomic weight = mmol/L. Macronutrients. */
export function ppmToMmol(ppm: number, ion: string): number {
  const aw = ATOMIC_WEIGHTS[ion];
  if (aw === undefined) {
    throw new Error(`Unknown ion for conversion: ${ion}`);
  }
  return ppm / aw;
}

/** mmol/L × atomic weight (mg/mmol) = ppm (mg/L). */
export function mmolToPpm(mmol: number, ion: string): number {
  const aw = ATOMIC_WEIGHTS[ion];
  if (aw === undefined) {
    throw new Error(`Unknown ion for conversion: ${ion}`);
  }
  return mmol * aw;
}

/** ppb (ug/L) / atomic weight = umol/L. Micronutrients. */
export function ppbToUmol(ppb: number, ion: string): number {
  return ppb / ATOMIC_WEIGHTS[ion];
}

/** umol/L × atomic weight (ug/umol) = ppb (ug/L). */
export function umolToPpb(umol: number, ion: string): number {
  return umol * ATOMIC_WEIGHTS[ion];
}

/** Convert a whole ppm analysis to mmol/L, macro ions only. */
export function convertAnalysisToMmol(
  ppmValues: Record<string, number>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [ion, v] of Object.entries(ppmValues)) {
    out[ion] = ppmToMmol(v, ion);
  }
  return out;
}

// ==========================================================================
// Ion balance and EC — Formulas 1-4, p. 21
// ==========================================================================

/** Eq Cations = NH4 + K + Na + Ca*2 + Mg*2 (+ H from acid). */
export function eqCations(m: Record<string, number>): number {
  return CATIONS.reduce(
    (sum, i) => sum + (ION_CHARGE[i] ?? 0) * (m[i] ?? 0.0),
    0.0,
  );
}

/** Eq Anions = NO3 + Cl + SO4*2 + HCO3 + H2PO4. */
export function eqAnions(m: Record<string, number>): number {
  return ANIONS.reduce(
    (sum, i) => sum + (ION_CHARGE[i] ?? 0) * (m[i] ?? 0.0),
    0.0,
  );
}

/** EC = (Eq cations + Eq anions) / 20. */
export function ecFromIons(m: Record<string, number>): number {
  return (eqCations(m) + eqAnions(m)) / EC_DIVISOR;
}

export interface BalanceReport {
  eq_cations_meq_l: number;
  eq_anions_meq_l: number;
  difference_pct: number;
  balanced: boolean;
  balanced_text: string;
  calculated_ec_ms_cm: number;
  tolerance_pct: number;
  provenance: string;
}

export function balanceReport(m: Record<string, number>): BalanceReport {
  const cat = eqCations(m);
  const an = eqAnions(m);
  const base = Math.max(cat, an, EPS);
  const diff = Math.abs(cat - an) / base;
  const balanced = diff <= ION_BALANCE_TOLERANCE;
  return {
    eq_cations_meq_l: round(cat, 3),
    eq_anions_meq_l: round(an, 3),
    difference_pct: round(diff * 100, 2),
    balanced,
    balanced_text: balanced
      ? bi("Balanced", "平衡")
      : bi("Not balanced", "不平衡"),
    calculated_ec_ms_cm: round(ecFromIons(m), 3),
    tolerance_pct: ION_BALANCE_TOLERANCE * 100,
    provenance: "SRC:WUR Formulas 1-4, p.21",
  };
}

/**
 * Convenience wrapper that runs cation, anion and EC computation in one call
 * (matches the brief's `calculateIonBalance` signature).
 */
export function calculateIonBalance(m: Record<string, number>): BalanceReport {
  return balanceReport(m);
}

// ==========================================================================
// M1b — Water classification & HCO3 acid dosing (Ch. 1-2, pp. 11-15, 24)
// ==========================================================================

/** Table 1, p. 11. Worst case of the EC-derived and ion-derived level. */
export function classifyWater(
  ec: number,
  na: number,
  cl: number,
): 1 | 2 | 3 | 4 {
  const ion = Math.max(na, cl);
  const byEc: 1 | 2 | 3 | 4 = ec < 0.5 ? 1 : ec <= 1.0 ? 2 : ec <= 1.5 ? 3 : 4;
  const byIon: 1 | 2 | 3 | 4 =
    ion < 1.5 ? 1 : ion <= 2.5 ? 2 : ion <= 4.0 ? 3 : 4;
  return Math.max(byEc, byIon) as 1 | 2 | 3 | 4;
}

/** Convenience wrapper that mirrors the brief's `checkWaterQuality`. */
export function checkWaterQuality(
  water: {
    ec: number;
    na: number;
    cl: number;
    recirculating?: boolean;
  },
  crop: WURCropMatrix | null = null,
): { level: 1 | 2 | 3 | 4; gates: Gate[] } {
  const level = classifyWater(water.ec, water.na, water.cl);
  const gates = waterQualityGates(
    level,
    Boolean(water.recirculating),
    crop,
  );
  return { level, gates };
}

export function waterQualityGates(
  level: number,
  recirculating: boolean,
  crop: WURCropMatrix | null,
): Gate[] {
  const gates: Gate[] = [];
  if (level >= 4) {
    gates.push({
      gid: "G-WATER-UNCLASSIFIED",
      severity: "CRITICAL",
      title: "Water beyond quality level 3",
      title_text: bi(
        "Water beyond quality level 3",
        "原水水质超出三级标准",
      ),
      message:
        "Na or Cl exceeds 4.0 mmol/L, or EC exceeds 1.5 mS/cm. This water " +
        "falls outside Table 1 and is not usable for hydroponics as supplied.",
      message_text: bi(
        "Na or Cl exceeds 4.0 mmol/L, or EC exceeds 1.5 mS/cm. This water " +
          "falls outside Table 1 and is not usable for hydroponics as supplied.",
        "Na 或 Cl 超过 4.0 mmol/L，或 EC 超过 1.5 mS/cm。该水质超出表 1 范围，不能直接用于无土栽培。",
      ),
      triggered_by: { level },
      remedy: "Install reverse osmosis, or switch to rainwater.",
      remedy_text: bi(
        "Install reverse osmosis, or switch to rainwater.",
        "安装反渗透装置，或改用雨水。",
      ),
      provenance: "SRC:WUR",
    });
  }
  if (level >= 2 && recirculating) {
    gates.push({
      gid: "G-WATER-RECIRC",
      severity: "CRITICAL",
      title: "Water not suitable for recirculation",
      title_text: bi(
        "Water not suitable for recirculation",
        "该水质不适合循环回用",
      ),
      message:
        "Level 2 water is not suitable when recirculation is necessary. " +
        "Irrigation water above 1.5 mmol/L Na is unsuitable for recirculating " +
        "systems, since recirculation raises Na over time.",
      message_text: bi(
        "Level 2 water is not suitable when recirculation is necessary. " +
          "Irrigation water above 1.5 mmol/L Na is unsuitable for recirculating " +
          "systems, since recirculation raises Na over time.",
        "二级水质在需要循环回用时不适用。Na 高于 1.5 mmol/L 的灌溉水不适合循环系统，因为循环会随时间推高钠浓度。",
      ),
      triggered_by: { level },
      remedy:
        "Use rainwater or RO for the recirculating loop, or plan routine discharge.",
      remedy_text: bi(
        "Use rainwater or RO for the recirculating loop, or plan routine discharge.",
        "循环回路改用雨水或反渗透水，或制定常规排液计划。",
      ),
      provenance: "SRC:WUR",
    });
  }
  if (
    level >= 3 &&
    crop !== null &&
    crop.na_max_root_zone !== null &&
    crop.na_max_root_zone <= 4.0
  ) {
    gates.push({
      gid: "G-WATER-SALT-SENSITIVE",
      severity: "CRITICAL",
      title: "Water not suitable for salt-sensitive crop",
      title_text: bi(
        "Water not suitable for salt-sensitive crop",
        "该水质不适合盐敏感作物",
      ),
      message:
        `Level 3 water must not be used for salt-sensitive crops. ` +
        `Root-zone Na ceiling is ${crop.na_max_root_zone} mmol/L.`,
      message_text: bi(
        `Level 3 water must not be used for salt-sensitive crops. ` +
          `Root-zone Na ceiling is ${crop.na_max_root_zone} mmol/L.`,
        `三级水质不得用于盐敏感作物。根际钠上限为 ${crop.na_max_root_zone} mmol/L。`,
      ),
      triggered_by: { level, na_max: crop.na_max_root_zone },
      remedy: "Use a lower-salinity water source for this crop.",
      remedy_text: bi(
        "Use a lower-salinity water source for this crop.",
        "该作物请改用低盐分水源。",
      ),
      provenance: "SRC:WUR",
    });
  }
  return gates;
}

export function ironScreeningGates(
  feUmol: number,
  irrigationType: string,
  organicMatter: boolean = false,
): Gate[] {
  /**
   * Ch. 1, pp. 13-14. Base-water Fe is NEVER credited toward the Fe dose:
   * it oxidises and precipitates at the emitter before reaching the plant.
   */
  const gates: Gate[] = [];
  if (irrigationType === "DRIP") {
    const limit = organicMatter ? 20.0 : 0.0;
    if (feUmol > limit + EPS) {
      const limitPhrase = organicMatter
        ? "10-20 umol/L where organic matter is present"
        : "no exception applies";
      const limitPhraseZh = organicMatter
        ? "含有机质时可放宽至 10-20 umol/L"
        : "本例不适用例外条款";
      gates.push({
        gid: "G-FE-DRIP",
        severity: "CRITICAL",
        title: "Iron in base water blocks drip emitters",
        title_text: bi(
          "Iron in base water blocks drip emitters",
          "原水铁将堵塞滴头",
        ),
        message:
          `Measured Fe ${feUmol} umol/L. The only acceptable level for ` +
          `drip irrigation is 0 umol/L (${limitPhrase}).`,
        message_text: bi(
          `Measured Fe ${feUmol} umol/L. The only acceptable level for ` +
            `drip irrigation is 0 umol/L (${limitPhrase}).`,
          `实测铁 ${feUmol} umol/L。滴灌系统可接受的铁含量为 0 umol/L（${limitPhraseZh}）。`,
        ),
        triggered_by: { fe_umol_l: feUmol, limit_umol_l: limit },
        remedy:
          "Aerate the water through a gravel bed or filter to precipitate " +
          "the iron before it enters the fertigation unit.",
        remedy_text: bi(
          "Aerate the water through a gravel bed or filter to precipitate " +
            "the iron before it enters the fertigation unit.",
          "进入施肥机前，先经砾石床或过滤器曝气，使铁预先沉淀。",
        ),
        provenance: "SRC:WUR",
      });
    }
  } else if (irrigationType === "SPRINKLER" && feUmol > 100.0) {
    gates.push({
      gid: "G-FE-SPRINKLER",
      severity: "WARNING",
      title: "Iron may cause leaf damage and staining",
      title_text: bi(
        "Iron may cause leaf damage and staining",
        "铁可能造成叶片伤害与锈斑",
      ),
      message:
        `Measured Fe ${feUmol} umol/L. Soft water should not exceed ` +
        `100 umol/L; where decorative quality matters, keep below 25-50 umol/L.`,
      message_text: bi(
        `Measured Fe ${feUmol} umol/L. Soft water should not exceed ` +
          `100 umol/L; where decorative quality matters, keep below 25-50 umol/L.`,
        `实测铁 ${feUmol} umol/L。软水不应超过 100 umol/L；对观赏品质有要求时应低于 25-50 umol/L。`,
      ),
      triggered_by: { fe_umol_l: feUmol },
      remedy: "",
      remedy_text: "",
      provenance: "SRC:WUR",
    });
  }
  if (feUmol > 0) {
    gates.push({
      gid: "G-FE-NOT-CREDITED",
      severity: "INFO",
      title: "Base-water iron is not counted as nutrient",
      title_text: bi(
        "Base-water iron is not counted as nutrient",
        "原水中的铁不计入养分供给",
      ),
      message:
        "Iron in irrigation water precipitates on contact with air at the " +
        "emitter and never reaches the roots. Chelated iron is dosed " +
        "independently of the iron already present in the water.",
      message_text: bi(
        "Iron in irrigation water precipitates on contact with air at the " +
          "emitter and never reaches the roots. Chelated iron is dosed " +
          "independently of the iron already present in the water.",
        "灌溉水中的铁在滴头处接触空气即沉淀，无法到达根系。螯合铁的投加量独立计算，与原水含铁量无关。",
      ),
      triggered_by: { fe_umol_l: feUmol },
      remedy: "",
      remedy_text: "",
      provenance: "SRC:WUR",
    });
  }
  return gates;
}

export function micronutrientScreeningGates(
  waterMicro: Record<string, number>,
): Gate[] {
  const gates: Gate[] = [];
  const b = waterMicro.B ?? 0.0;
  const mn = waterMicro.Mn ?? 0.0;
  const zn = waterMicro.Zn ?? 0.0;
  const cu = waterMicro.Cu ?? 0.0;
  if (b > 30.0) {
    gates.push({
      gid: "G-B-HIGH",
      severity: "WARNING",
      title: "Boron above tolerable upper limit",
      title_text: bi(
        "Boron above tolerable upper limit",
        "硼超过可耐受上限",
      ),
      message:
        `Boron ${b} umol/L exceeds the tolerable upper limit of about ` +
        `30 umol/L; tolerance varies by species.`,
      message_text: bi(
        `Boron ${b} umol/L exceeds the tolerable upper limit of about ` +
          `30 umol/L; tolerance varies by species.`,
        `硼 ${b} umol/L 超过约 30 umol/L 的可耐受上限；不同作物耐受度不同。`,
      ),
      triggered_by: { b_umol_l: b },
      remedy: "",
      remedy_text: "",
      provenance: "SRC:WUR",
    });
  }
  if (mn >= 10.0) {
    gates.push({
      gid: "G-MN-HIGH",
      severity: "WARNING",
      title: "Manganese above advised level",
      title_text: bi(
        "Manganese above advised level",
        "锰超过建议水平",
      ),
      message: `Manganese ${mn} umol/L. Irrigation water should stay below 10 umol/L.`,
      message_text: bi(
        `Manganese ${mn} umol/L. Irrigation water should stay below 10 umol/L.`,
        `锰 ${mn} umol/L。灌溉水应低于 10 umol/L。`,
      ),
      triggered_by: { mn_umol_l: mn },
      remedy: "",
      remedy_text: "",
      provenance: "SRC:WUR",
    });
  }
  if (zn > 0) {
    gates.push({
      gid: "G-ZN-SOURCE",
      severity: "INFO",
      title: "Check zinc source",
      title_text: bi("Check zinc source", "请核查锌来源"),
      message:
        "Elevated zinc commonly comes from galvanised steel gutters " +
        "collecting roof rainwater. Check after rainy periods.",
      message_text: bi(
        "Elevated zinc commonly comes from galvanised steel gutters " +
          "collecting roof rainwater. Check after rainy periods.",
        "锌偏高常来自收集屋面雨水的镀锌钢排水槽。雨季后应复检。",
      ),
      triggered_by: { zn_umol_l: zn },
      remedy: "",
      remedy_text: "",
      provenance: "SRC:WUR",
    });
  }
  if (cu > 0) {
    gates.push({
      gid: "G-CU-SOURCE",
      severity: "INFO",
      title: "Check copper source",
      title_text: bi("Check copper source", "请核查铜来源"),
      message:
        "Copper in irrigation water usually comes from copper-containing " +
        "taps, pipes and pumps in the irrigation equipment.",
      message_text: bi(
        "Copper in irrigation water usually comes from copper-containing " +
          "taps, pipes and pumps in the irrigation equipment.",
        "灌溉水中的铜通常来自灌溉设备中含铜的水龙头、管道与水泵。",
      ),
      triggered_by: { cu_umol_l: cu },
      remedy: "",
      remedy_text: "",
      provenance: "SRC:WUR",
    });
  }
  return gates;
}

// ---------------------------------------------------------------------------
// Acid dosing
// ---------------------------------------------------------------------------

export function acidMolarityMolPerL(fert: Fertiliser): number {
  /**
   * Moles of titratable H+ per litre of the liquid acid product.
   *
   *     mol/L = (density g/L) / (grams of product per mole of H+)
   *
   * For nitric acid 38% from Table 5 (p. 26): 1240 / 167 = 7.425 mol/L.
   *
   * Deriving it the other way round from mass fraction and formula weight,
   * 1.23 g/mL × 1000 × 0.38 / 63.01 = 7.418 mol/L, agrees to 0.1%. The
   * difference is only the density constant — real 38% HNO3 is 1.229-1.234
   * g/mL at 20°C. The catalogue value is used so that this path and the
   * stock-tank mass path cannot drift apart; override `density` on the
   * Fertiliser record if your supplier's data sheet says otherwise.
   */
  if (!fert.density) {
    throw new Error(`${fert.fid} has no density; molarity is undefined`);
  }
  return (fert.density * 1000.0) / massPerMolIon(fert);
}

export function acidVolumeDirectL(
  hRequiredMmolPerL: number,
  fert: Fertiliser,
  waterVolumeL: number = 1000.0,
): number {
  /**
   * Litres of liquid acid to dose DIRECTLY into `waterVolumeL` of irrigation
   * water at working strength.
   *
   *     H+ needed (mol) = h_required (mmol/L) / 1000 × water volume (L)
   *     volume (L)      = H+ needed / molarity of the product
   *
   * This is NOT the stock-tank figure. A 100× A/B tank needs 100 times this
   * volume, because one tank of stock treats 100 tank-volumes of water. Use
   * this when acid goes straight into a mixing tank or through a dosing pump
   * on the irrigation line; use `AcidPlan.nitric_l` when filling A/B tanks.
   */
  if (hRequiredMmolPerL <= 0 || waterVolumeL <= 0) {
    return 0.0;
  }
  const totalHMol = (hRequiredMmolPerL / 1000.0) * waterVolumeL;
  return totalHMol / acidMolarityMolPerL(fert);
}

export function planAcidDosing(
  hco3BaseWater: number,
  no3Headroom: number,
  pHeadroom: number,
  policy: SitePolicy = DEFAULT_POLICY,
): AcidPlan {
  /**
   * Neutralise excess HCO3 while retaining the pH buffer (p. 24).
   *
   *     H_required = max(0, HCO3_base_water - HCO3_buffer)
   *
   * Reaction: Ca²⁺ + 2HCO3⁻ + 2HNO3 ⇌ Ca²⁺ + 2CO2 + 2H2O + 2NO3⁻
   *
   * Each mole of H+ drags in a mole of acid anion, which counts against the
   * recipe. Acid is therefore capped by the anion headroom (p. 13).
   */
  const bufferTarget = policy.hco3_buffer_mmol_l;
  const hRequired = Math.max(0.0, hco3BaseWater - bufferTarget);

  let no3Head = Math.max(0.0, no3Headroom);
  let pHead = Math.max(0.0, pHeadroom);

  let hPhos: number;
  let hNitric: number;
  if (policy.acid_policy === "PHOSPHORIC_FIRST") {
    hPhos = Math.min(hRequired, pHead);
    hNitric = Math.min(hRequired - hPhos, no3Head);
  } else if (policy.acid_policy === "PROPORTIONAL") {
    const total = no3Head + pHead;
    const share = total > EPS ? no3Head / total : 0.0;
    hNitric = Math.min(hRequired * share, no3Head);
    hPhos = Math.min(hRequired - hNitric, pHead);
  } else {
    // NITRIC_FIRST (default)
    hNitric = Math.min(hRequired, no3Head);
    hPhos = Math.min(hRequired - hNitric, pHead);
  }

  const delivered = hNitric + hPhos;
  const shortfall = Math.max(0.0, hRequired - delivered);
  const hco3Residual = hco3BaseWater - delivered;

  const hno3 = FERTILISERS.hno3_38;
  const h3po4 = FERTILISERS.h3po4_59;
  const nitricKg = stockMassKg(hNitric, massPerMolIon(hno3), policy);
  const phosKg = stockMassKg(hPhos, massPerMolIon(h3po4), policy);

  const directBasis = policy.tank_volume_l;
  return {
    hco3_base_water: hco3BaseWater,
    hco3_buffer_target: bufferTarget,
    h_required: hRequired,
    h_from_nitric: hNitric,
    h_from_phosphoric: hPhos,
    shortfall,
    hco3_residual: hco3Residual,
    no3_added: hNitric,
    p_added: hPhos,
    nitric_kg: nitricKg,
    nitric_l: hno3.density ? nitricKg / hno3.density : 0.0,
    phosphoric_kg: phosKg,
    phosphoric_l: h3po4.density ? phosKg / h3po4.density : 0.0,
    nitric_l_direct: acidVolumeDirectL(hNitric, hno3, directBasis),
    phosphoric_l_direct: acidVolumeDirectL(hPhos, h3po4, directBasis),
    direct_basis_volume_l: directBasis,
    feasible: shortfall <= EPS,
  };
}

/** Convenience wrapper that matches the brief's `calculateAcidDose`. */
export function calculateAcidDose(
  water: { hco3: number; no3_headroom: number; p_headroom: number },
  targetBuffer: number = DEFAULT_POLICY.hco3_buffer_mmol_l,
  policy: SitePolicy = DEFAULT_POLICY,
): AcidPlan {
  const p: SitePolicy = { ...policy, hco3_buffer_mmol_l: targetBuffer };
  return planAcidDosing(water.hco3, water.no3_headroom, water.p_headroom, p);
}

export function acidGates(plan: AcidPlan): Gate[] {
  const gates: Gate[] = [];
  if (!plan.feasible) {
    gates.push({
      gid: "G-ACID-INFEASIBLE",
      severity: "CRITICAL",
      title: "Acid demand exceeds anion headroom",
      title_text: bi(
        "Acid demand exceeds anion headroom",
        "加酸需求超出阴离子余量",
      ),
      message:
        `Neutralising to the ${plan.hco3_buffer_target} mmol/L buffer needs ` +
        `${plan.h_required.toFixed(2)} mmol/L H+, but only ` +
        `${(plan.h_from_nitric + plan.h_from_phosphoric).toFixed(2)} mmol/L can be added ` +
        `without pushing NO3 or P above their recipe targets. ` +
        `${plan.hco3_residual.toFixed(2)} mmol/L HCO3 will remain.`,
      message_text: bi(
        `Neutralising to the ${plan.hco3_buffer_target} mmol/L buffer needs ` +
          `${plan.h_required.toFixed(2)} mmol/L H+, but only ` +
          `${(plan.h_from_nitric + plan.h_from_phosphoric).toFixed(2)} mmol/L can be added ` +
          `without pushing NO3 or P above their recipe targets. ` +
          `${plan.hco3_residual.toFixed(2)} mmol/L HCO3 will remain.`,
        `中和至 ${plan.hco3_buffer_target} mmol/L 缓冲量需要 ` +
          `${plan.h_required.toFixed(2)} mmol/L H+，但在不使 NO3 或 P 超过配方目标的前提下，仅可加入 ` +
          `${(plan.h_from_nitric + plan.h_from_phosphoric).toFixed(2)} mmol/L。` +
          `将残留 ${plan.hco3_residual.toFixed(2)} mmol/L HCO3。`,
      ),
      triggered_by: {
        h_required: round(plan.h_required, 3),
        h_delivered: round(plan.h_from_nitric + plan.h_from_phosphoric, 3),
        hco3_residual: round(plan.hco3_residual, 3),
      },
      remedy:
        "Dilute or replace the base water; or shift pH control to ammonium " +
        "and switch to a high-pH-stable Fe chelate (EDDHA / HBED).",
      remedy_text: bi(
        "Dilute or replace the base water; or shift pH control to ammonium " +
          "and switch to a high-pH-stable Fe chelate (EDDHA / HBED).",
        "稀释或更换原水；或改用铵态氮调控 pH，并改选高 pH 稳定的铁螯合物（EDDHA / HBED）。",
      ),
      provenance: "SRC:WUR",
    });
  }
  if (plan.h_required > EPS) {
    gates.push({
      gid: "G-CO2-ESCAPE",
      severity: "INFO",
      title: "Acid reaction requires an open mixing tank",
      title_text: bi(
        "Acid reaction requires an open mixing tank",
        "加酸反应须在开放式混合罐中进行",
      ),
      message:
        "Treating bicarbonate with acid releases CO2. The CO2 must be allowed " +
        "to escape; if it cannot, the pH will not drop and will fluctuate. " +
        "The reaction must take place in an open system.",
      message_text: bi(
        "Treating bicarbonate with acid releases CO2. The CO2 must be allowed " +
          "to escape; if it cannot, the pH will not drop and will fluctuate. " +
          "The reaction must take place in an open system.",
        "酸与碳酸氢盐反应会释放 CO2。CO2 必须能够逸出；否则 pH 不会下降且会波动。该反应必须在开放系统中进行。",
      ),
      triggered_by: {},
      remedy: "",
      remedy_text: "",
      provenance: "SRC:WUR",
    });
  }
  return gates;
}

// ==========================================================================
// M2 — Sodium accumulation & discharge gate (Ch. 1, pp. 11-12, 24)
// ==========================================================================

export function naLimitFor(
  cropId: string,
  substrateType: string = DEFAULT_SUBSTRATE,
  policy: SitePolicy = DEFAULT_POLICY,
): [number, string] {
  /**
   * The sodium ceiling is substrate-dependent, and dramatically so. Tomato is
   * 8 mmol/L on inert substrate but 2 mmol/L on organic material, because the
   * organic figure is read from a 1:1.5 water extract rather than from the
   * root-zone solution itself. Applying the inert ceiling to an organic sample
   * would let sodium run to four times the published limit before any gate
   * fired, so the crop × substrate matrix is the authority here and Table 2
   * (p. 12, stated on the solution basis) is used only as a fallback.
   */
  const crop = getCrop(cropId, substrateType);
  let canon: number | null | undefined;
  let source: string;
  if (crop !== null) {
    canon = crop.na_max_root_zone;
    source = `SRC:WUR crop page p.${crop.source_page} (${substrateType})`;
  } else {
    canon = NA_LIMITS_MMOL_L[cropId];
    source = "SRC:WUR Table 2, p.12";
  }
  if (canon === undefined || canon === null) {
    throw new Error(
      `No sodium limit known for crop '${cropId}' on '${substrateType}'`,
    );
  }
  const override = policy.na_overrides[cropId];
  if (override === undefined) {
    return [canon, source];
  }
  return [override, "SRC:PRACTICE site override"];
}

export function evaluateSodium(
  cropId: string,
  naRootZone: number,
  naBaseWater: number = 0.0,
  systemVolumeLM2: number = 0.0,
  drainComposition: Record<string, number> | null = null,
  policy: SitePolicy = DEFAULT_POLICY,
  substrateType: string = DEFAULT_SUBSTRATE,
): SodiumResult {
  /**
   * Mass balance for the forced-discharge volume (SRC:DERIVED — the manual
   * states the requirement, not the formula):
   *
   *     Na_after = (Na_cur × (V_sys - V_d) + Na_base × V_d) / V_sys
   *     =>  V_d = V_sys × (Na_cur - Na_target) / (Na_cur - Na_base)
   */
  const [limit, source] = naLimitFor(cropId, substrateType, policy);
  const target = limit * policy.na_safety_factor;
  const headroom = limit - naRootZone;
  const ratio = limit > EPS ? naRootZone / limit : Number.POSITIVE_INFINITY;

  let discharge = 0.0;
  let status: SodiumResult["status"];
  if (naRootZone > limit + EPS) {
    if (naBaseWater >= target - EPS) {
      status = "UNREACHABLE";
    } else {
      status = "EXCEEDED";
      if (systemVolumeLM2 > EPS) {
        discharge =
          (systemVolumeLM2 * (naRootZone - target)) /
          (naRootZone - naBaseWater);
      }
    }
  } else if (ratio >= policy.na_approach_ratio) {
    status = "APPROACHING";
  } else {
    status = "SAFE";
  }

  const loss: Record<string, number> = {};
  if (discharge > EPS && drainComposition) {
    for (const [ion, mmol] of Object.entries(drainComposition)) {
      const aw = ATOMIC_WEIGHTS[ion];
      if (aw !== undefined) {
        // mmol/L × L/m² × mg/mmol = mg/m² -> g/m²
        loss[ion] = round((mmol * discharge * aw) / 1000.0, 3);
      }
    }
  }

  return {
    na_current: naRootZone,
    na_limit: limit,
    na_target: target,
    na_base_water: naBaseWater,
    headroom,
    ratio,
    status,
    discharge_volume_l_m2: discharge,
    system_volume_l_m2: systemVolumeLM2,
    limit_source: source,
    nutrient_loss: loss,
  };
}

export function sodiumGates(r: SodiumResult, cropId: string): Gate[] {
  const gates: Gate[] = [];
  if (r.status === "EXCEEDED") {
    gates.push({
      gid: "G-NA-EXCEED",
      severity: "CRITICAL",
      title: "Sodium above crop ceiling - forced discharge required",
      title_text: bi(
        "Sodium above crop ceiling - forced discharge required",
        "钠超过作物上限 - 需要强行排液",
      ),
      message:
        `Root-zone Na is ${r.na_current} mmol/L against a ceiling of ` +
        `${r.na_limit} mmol/L for ${cropId}. Discharge a fraction of the ` +
        `recirculated solution to prevent yield reduction or a decline in ` +
        `produce quality.`,
      message_text: bi(
        `Root-zone Na is ${r.na_current} mmol/L against a ceiling of ` +
          `${r.na_limit} mmol/L for ${cropId}. Discharge a fraction of the ` +
          `recirculated solution to prevent yield reduction or a decline in ` +
          `produce quality.`,
        `根际钠为 ${r.na_current} mmol/L，而 ${cropId} 的上限为 ` +
          `${r.na_limit} mmol/L。需排放部分循环液，以避免减产或品质下降。`,
      ),
      triggered_by: {
        na_current: r.na_current,
        na_limit: r.na_limit,
        discharge_l_m2: round(r.discharge_volume_l_m2, 2),
      },
      remedy:
        `Discharge ${r.discharge_volume_l_m2.toFixed(1)} L/m2 and replace with fresh ` +
        `base water to reach ${r.na_target} mmol/L.`,
      remedy_text: bi(
        `Discharge ${r.discharge_volume_l_m2.toFixed(1)} L/m2 and replace with fresh ` +
          `base water to reach ${r.na_target} mmol/L.`,
        `排放 ${r.discharge_volume_l_m2.toFixed(1)} L/m2 并补充新鲜原水，使钠降至 ${r.na_target} mmol/L。`,
      ),
      provenance: "SRC:WUR",
    });
  } else if (r.status === "UNREACHABLE") {
    gates.push({
      gid: "G-NA-UNREACHABLE",
      severity: "CRITICAL",
      title: "Sodium target unreachable with this water",
      title_text: bi(
        "Sodium target unreachable with this water",
        "以该水源无法达成钠目标",
      ),
      message:
        `Base water Na is ${r.na_base_water} mmol/L, at or above the target ` +
        `${r.na_target} mmol/L. Flushing cannot reduce Na below the ` +
        `concentration of the water used to flush.`,
      message_text: bi(
        `Base water Na is ${r.na_base_water} mmol/L, at or above the target ` +
          `${r.na_target} mmol/L. Flushing cannot reduce Na below the ` +
          `concentration of the water used to flush.`,
        `原水钠为 ${r.na_base_water} mmol/L，已达到或超过目标值 ` +
          `${r.na_target} mmol/L。冲洗无法使钠低于所用冲洗水本身的浓度。`,
      ),
      triggered_by: {
        na_base_water: r.na_base_water,
        na_target: r.na_target,
      },
      remedy:
        "An alternative water source (rainwater / RO) or a sodium-removal " +
        "unit is required.",
      remedy_text: bi(
        "An alternative water source (rainwater / RO) or a sodium-removal " +
          "unit is required.",
        "需要替代水源（雨水 / 反渗透）或除钠装置。",
      ),
      provenance: "SRC:WUR",
    });
  } else if (r.status === "APPROACHING") {
    gates.push({
      gid: "G-NA-APPROACH",
      severity: "WARNING",
      title: "Sodium approaching crop ceiling",
      title_text: bi(
        "Sodium approaching crop ceiling",
        "钠接近作物上限",
      ),
      message:
        `Root-zone Na is ${r.na_current} mmol/L, ` +
        `${(r.ratio * 100).toFixed(0)}% of the ${r.na_limit} mmol/L ceiling.`,
      message_text: bi(
        `Root-zone Na is ${r.na_current} mmol/L, ` +
          `${(r.ratio * 100).toFixed(0)}% of the ${r.na_limit} mmol/L ceiling.`,
        `根际钠为 ${r.na_current} mmol/L，已达上限 ` +
          `${r.na_limit} mmol/L 的 ${(r.ratio * 100).toFixed(0)}%。`,
      ),
      triggered_by: { na_current: r.na_current, na_limit: r.na_limit },
      remedy: "Increase monitoring frequency and plan a discharge window.",
      remedy_text: bi(
        "Increase monitoring frequency and plan a discharge window.",
        "提高监测频次，并规划排液时段。",
      ),
      provenance: "SRC:WUR",
    });
  }
  return gates;
}

// ==========================================================================
// M4 — 3-level feedback correction (Ch. 5, p. 22)
// ==========================================================================

export function toReferenceEc(
  analysisMmol: Record<string, number>,
  ecAnalysed: number,
  ecTargetValues: number,
  crop: WURCropMatrix,
): [Record<string, number>, ReferenceEcMeta] {
  /**
   * Reference-EC normalisation, pp. 21-22.
   *
   *     EC_reference = EC_target_values - 0.30
   *     EC_nutrients  = EC_analysed - 0.10 × Na_analysed
   *     Nutrient_ref  = Nutrient_analysed × EC_reference / EC_nutrients
   *
   * Na and HCO3 are never converted (they never appear in target values).
   * Cl is converted only when the crop's target table lists a Cl target.
   */
  const ecRef = ecTargetValues - REFERENCE_EC_OFFSET;
  const na = analysisMmol.Na ?? 0.0;
  const ecNut = ecAnalysed - NA_EC_FACTOR * na;
  if (ecNut <= EPS) {
    throw new Error(
      "G-EC-NONPOSITIVE: sodium accounts for the entire EC",
    );
  }
  const factor = ecRef / ecNut;

  const never = new Set(["Na", "HCO3"]);
  const hasClTarget =
    crop.cl_max_root_zone !== null &&
    crop.cl_max_root_zone !== undefined &&
    "Cl" in crop.root_zone_targets;

  const out: Record<string, number> = {};
  for (const [ion, val] of Object.entries(analysisMmol)) {
    if (never.has(ion)) {
      out[ion] = val;
    } else if (ion === "Cl" && !hasClTarget) {
      out[ion] = val;
    } else {
      out[ion] = val * factor;
    }
  }

  const meta: ReferenceEcMeta = {
    ec_reference_ms_cm: round(ecRef, 3),
    ec_nutrients_ms_cm: round(ecNut, 3),
    conversion_factor: round(factor, 4),
    provenance: "SRC:WUR Ch.5, pp.21-22",
  };
  return [out, meta];
}

export interface ReferenceEcMeta {
  ec_reference_ms_cm: number;
  ec_nutrients_ms_cm: number;
  conversion_factor: number;
  provenance: string;
}

/** Convenience wrapper that mirrors the brief's `normalizeEC`. */
export function normalizeEC(
  analysed: Record<string, number>,
  target: number,
  na: number,
  ecAnalysed: number,
  crop: WURCropMatrix,
): [Record<string, number>, ReferenceEcMeta] {
  // Replicate the to_reference_ec logic but accept an explicit Na override
  // so callers can pass analysed macro with Na removed upstream.
  const withNa: Record<string, number> = { ...analysed, Na: na };
  return toReferenceEc(withNa, ecAnalysed, target, crop);
}

export function correctionFactor(
  deviation: number,
  policy: SitePolicy = DEFAULT_POLICY,
): [number, 0 | 1 | 2, [number, number]] {
  /**
   * Corrections are made at 25% deviation (level 1: 10-15%) and at 50%
   * deviation (level 2: a further 15-25%). Direction is inverse: root zone
   * above target ⇒ reduce supply.
   */
  const a = Math.abs(deviation);
  const sign = deviation > 0 ? 1.0 : -1.0;
  if (a < 0.25) {
    return [0.0, 0, [0.0, 0.0]];
  }
  if (a < 0.5) {
    return [-sign * policy.band1_default, 1, [0.1, 0.15]];
  }
  return [
    -sign * (policy.band1_default + policy.band2_default),
    2,
    [0.25, 0.4],
  ];
}

export const MICRO_LADDER: ReadonlyArray<readonly [number, number]> = [
  [-0.5, 0.5], // <= -50% deviation -> +50% supply
  [-0.25, 0.25], // -50% .. -25%      -> +25%
  [0.25, 0.0], // -25% .. +25%      ->   0%
  [0.5, -0.25], // +25% .. +50%      -> -25%
];

/** Micronutrient stepping ladder: +50%, +25%, 0%, -25%, -50%. */
export function microStep(deviation: number): number {
  if (deviation <= -0.5) return 0.5;
  if (deviation < -0.25) return 0.25;
  if (deviation < 0.25) return 0.0;
  if (deviation < 0.5) return -0.25;
  return -0.5;
}

export function evaluateCorrections(
  rootZoneMmol: Record<string, number>,
  rootZoneUmol: Record<string, number>,
  ecAnalysed: number,
  crop: WURCropMatrix,
  policy: SitePolicy = DEFAULT_POLICY,
): [Finding[], ReferenceEcMeta] {
  const [ref, meta] = toReferenceEc(
    rootZoneMmol,
    ecAnalysed,
    crop.ec_root_zone,
    crop,
  );
  const findings: Finding[] = [];

  for (const ion of MACRO_IONS) {
    const target = crop.root_zone_targets[ion];
    if (target === undefined || target <= EPS) continue;
    const value = ref[ion];
    if (value === undefined) continue;
    const dev = (value - target) / target;
    const [adj, level, rng] = correctionFactor(dev, policy);
    findings.push({
      ion,
      analysed: rootZoneMmol[ion] ?? 0.0,
      at_reference_ec: value,
      target,
      deviation_pct: dev * 100.0,
      level,
      band: dev >= 0.25 ? "HIGH" : dev <= -0.25 ? "LOW" : "NORMAL",
      adjustment_pct: adj * 100.0,
      adjustment_range: rng,
      is_micro: false,
    });
  }

  for (const ion of MICRO_IONS) {
    const target = crop.root_zone_targets[ion];
    if (target === undefined || target <= EPS) continue;
    const value = rootZoneUmol[ion];
    if (value === undefined) continue;
    const dev = (value - target) / target;
    const step = microStep(dev);
    findings.push({
      ion,
      analysed: value,
      at_reference_ec: value,
      target,
      deviation_pct: dev * 100.0,
      level: Math.abs(dev) >= 0.5 ? 2 : Math.abs(dev) >= 0.25 ? 1 : 0,
      band: dev >= 0.25 ? "HIGH" : dev <= -0.25 ? "LOW" : "NORMAL",
      adjustment_pct: step * 100.0,
      adjustment_range: [Math.abs(step), Math.abs(step)],
      is_micro: true,
    });
  }

  return [findings, meta];
}

export function applyCorrections(
  fertigation: Record<string, number>,
  micro: Record<string, number>,
  findings: Finding[],
): [Record<string, number>, Record<string, number>] {
  const macroOut: Record<string, number> = { ...fertigation };
  const microOut: Record<string, number> = { ...micro };
  for (const f of findings) {
    if (f.adjustment_pct === 0.0) continue;
    const factor = 1.0 + f.adjustment_pct / 100.0;
    if (f.is_micro) {
      if (f.ion in microOut) {
        microOut[f.ion] = microOut[f.ion] * factor;
      }
    } else if (f.ion in macroOut) {
      macroOut[f.ion] = macroOut[f.ion] * factor;
    }
  }
  return [macroOut, microOut];
}

// ==========================================================================
// M5 — Crop steering / stage adjustments (Section B)
// ==========================================================================

export const DRY_BACK_TARGETS: Record<
  string,
  [number, number, string, string]
> = {
  STRONGLY_VEGETATIVE: [6.0, 8.0, "Strongly vegetative", "强营养生长"],
  BALANCED: [8.0, 12.0, "Balanced", "平衡"],
  GENERATIVE: [12.0, 15.0, "Generative", "生殖生长"],
  STRONGLY_GENERATIVE: [15.0, 20.0, "Strongly generative", "强生殖生长"],
};

export function applyStageAdjustments(
  crop: WURCropMatrix,
  stages: string[],
  dryBackIntent: string = "BALANCED",
  isHighWaterSupply: boolean = false,
): SteeringResult {
  /**
   * Fruit Set K:N shift for cucumber and sweet pepper is +1 mmol/L K and
   * +1 mmol/L N-NO3 — exactly 1.0 mmol/L of KNO3. Tomato's Fruit Set column
   * is different (+1.5 K, -0.5 Ca, -0.25 Mg): adjustments are data-driven per
   * crop, never hardcoded.
   */
  const macro: Record<string, number> = { ...crop.fertigation };
  const micro: Record<string, number> = { ...crop.micro_fertigation };
  const macroBefore: Record<string, number> = { ...macro };
  const microBefore: Record<string, number> = { ...micro };

  const combined: Record<string, number> = {};
  const notes: Array<[string, string]> = [];

  for (const stage of stages) {
    if (stage === "high_water") {
      isHighWaterSupply = true;
      continue;
    }
    const adj = crop.growth_stages[stage];
    if (!adj) continue;
    for (const [ion, delta] of Object.entries(adj)) {
      combined[ion] = (combined[ion] ?? 0.0) + delta;
    }
  }

  if (isHighWaterSupply && crop.high_water_adjustment) {
    for (const [ion, delta] of Object.entries(crop.high_water_adjustment)) {
      combined[ion] = (combined[ion] ?? 0.0) + delta;
    }
    notes.push([HIGH_WATER_NOTE_EN, HIGH_WATER_NOTE_ZH]);
  }

  for (const [ion, delta] of Object.entries(combined)) {
    if ((MICRO_IONS as readonly string[]).includes(ion)) {
      micro[ion] = Math.max(0.0, (micro[ion] ?? 0.0) + delta);
    } else {
      macro[ion] = Math.max(0.0, (macro[ion] ?? 0.0) + delta);
    }
  }

  const ca = macro.Ca ?? 0.0;
  const totalN = (macro.NO3 ?? 0.0) + (macro.NH4 ?? 0.0);
  const kCa = ca > EPS ? (macro.K ?? 0.0) / ca : 0.0;
  const kN = totalN > EPS ? (macro.K ?? 0.0) / totalN : 0.0;

  const target = DRY_BACK_TARGETS[dryBackIntent] ?? DRY_BACK_TARGETS.BALANCED;
  const [lo, hi] = target;

  return {
    stages: stages.filter((s) => s !== "high_water"),
    deltas: combined,
    macro_before: macroBefore,
    macro_after: macro,
    micro_before: microBefore,
    micro_after: micro,
    k_ca_ratio: kCa,
    k_n_ratio: kN,
    dry_back_intent: dryBackIntent,
    dry_back_min: lo,
    dry_back_max: hi,
    notes,
    is_high_water_supply: isHighWaterSupply,
  };
}

export function ammoniumGates(recipe: Record<string, number>): Gate[] {
  /**
   * Ch. 2, p. 15. Must be evaluated against the recipe that will actually be
   * dosed — the M4 feedback correction can push NH4 past the ceiling after
   * stage adjustment, so checking the stage-adjusted vector alone misses it.
   */
  const gates: Gate[] = [];
  const nh4 = recipe.NH4 ?? 0.0;
  const totalN = (recipe.NO3 ?? 0.0) + nh4;
  if (nh4 > 1.5 + EPS) {
    gates.push({
      gid: "G-NH4-CEILING",
      severity: "CRITICAL",
      title: "Ammonium above the hydroponic ceiling",
      title_text: bi(
        "Ammonium above the hydroponic ceiling",
        "铵态氮超过无土栽培上限",
      ),
      message:
        `NH4 is ${nh4.toFixed(2)} mmol/L. A maximum of 1.0-1.5 mmol/L ` +
        `(14-21 ppm N) is acceptable; above this the pH will drop too much.`,
      message_text: bi(
        `NH4 is ${nh4.toFixed(2)} mmol/L. A maximum of 1.0-1.5 mmol/L ` +
          `(14-21 ppm N) is acceptable; above this the pH will drop too much.`,
        `铵态氮为 ${nh4.toFixed(2)} mmol/L。可接受上限为 1.0-1.5 mmol/L（14-21 ppm N）；超过后 pH 会下降过多。`,
      ),
      triggered_by: { nh4_mmol_l: round(nh4, 2) },
      remedy: "Reduce ammonium input.",
      remedy_text: bi("Reduce ammonium input.", "降低铵态氮投入。"),
      provenance: "SRC:WUR",
    });
  }
  if (totalN > EPS) {
    const share = nh4 / totalN;
    if (share > 0.15 + EPS) {
      gates.push({
        gid: "G-NH4-SHARE",
        severity: "WARNING",
        title: "Ammonium share of total N above 15%",
        title_text: bi(
          "Ammonium share of total N above 15%",
          "铵态氮占总氮比例超过 15%",
        ),
        message:
          `NH4 is ${(share * 100).toFixed(0)}% of total N. In hydroponic systems the ` +
          `proportion of ammonium should be limited to 5-15%.`,
        message_text: bi(
          `NH4 is ${(share * 100).toFixed(0)}% of total N. In hydroponic systems the ` +
            `proportion of ammonium should be limited to 5-15%.`,
          `铵态氮占总氮 ${(share * 100).toFixed(0)}%。无土栽培系统中铵态氮比例应控制在 5-15%。`,
        ),
        triggered_by: { nh4_share_pct: round(share * 100, 1) },
        remedy: "",
        remedy_text: "",
        provenance: "SRC:WUR",
      });
    }
  }
  return gates;
}

export function steeringGates(
  r: SteeringResult,
  crop: WURCropMatrix,
  naRatio: number | null = null,
  washActive: boolean = false,
  checkAmmonium: boolean = true,
): Gate[] {
  const gates: Gate[] = checkAmmonium ? ammoniumGates(r.macro_after) : [];
  if (
    (r.dry_back_intent === "GENERATIVE" ||
      r.dry_back_intent === "STRONGLY_GENERATIVE") &&
    naRatio !== null &&
    naRatio >= 0.8
  ) {
    gates.push({
      gid: "G-DRYBACK-NA",
      severity: "WARNING",
      title: "Generative dry-back suppressed by sodium load",
      title_text: bi(
        "Generative dry-back suppressed by sodium load",
        "钠负荷限制生殖型回干",
      ),
      message:
        `Root-zone Na is at ${(naRatio * 100).toFixed(0)}% of the crop ceiling. Drying ` +
        `back concentrates the root-zone solution, including sodium. ` +
        `Dry-back intent downgraded to Balanced.`,
      message_text: bi(
        `Root-zone Na is at ${(naRatio * 100).toFixed(0)}% of the crop ceiling. Drying ` +
          `back concentrates the root-zone solution, including sodium. ` +
          `Dry-back intent downgraded to Balanced.`,
        `根际钠已达作物上限的 ${(naRatio * 100).toFixed(0)}%。回干会浓缩根际溶液，钠亦随之升高。回干策略已降级为平衡型。`,
      ),
      triggered_by: { na_ratio: round(naRatio, 2) },
      remedy: "",
      remedy_text: "",
      provenance: "SRC:PRACTICE",
    });
  }
  if (washActive) {
    gates.push({
      gid: "G-DRYBACK-SUPPRESSED",
      severity: "INFO",
      title: "Dry-back guidance suppressed during wash",
      title_text: bi(
        "Dry-back guidance suppressed during wash",
        "冲洗期间暂停回干建议",
      ),
      message:
        "A wash cycle or forced discharge is active. Dry-back and leaching " +
        "are contradictory instructions; the wash takes precedence.",
      message_text: bi(
        "A wash cycle or forced discharge is active. Dry-back and leaching " +
          "are contradictory instructions; the wash takes precedence.",
        "当前处于冲洗或强行排液状态。回干与淋洗指令相互矛盾；以冲洗为准。",
      ),
      triggered_by: {},
      remedy: "",
      remedy_text: "",
      provenance: "SRC:PRACTICE",
    });
  }
  if (crop.substrate_type === "SOIL") {
    gates.push({
      gid: "G-DRYBACK-NA-SOIL",
      severity: "INFO",
      title: "Dry-back does not apply to soil",
      title_text: bi(
        "Dry-back does not apply to soil",
        "土壤栽培不适用回干策略",
      ),
      message:
        "Substrate dry-back targets do not transfer to soil-grown crops.",
      message_text: bi(
        "Substrate dry-back targets do not transfer to soil-grown crops.",
        "基质回干目标不适用于土壤栽培作物。",
      ),
      triggered_by: {},
      remedy: "",
      remedy_text: "",
      provenance: "SRC:PRACTICE",
    });
  }
  return gates;
}

// ==========================================================================
// Stock-tank mass — Ch. 8, p. 28
// ==========================================================================

export function stockMassKg(
  mmolPerL: number,
  massPerMolIonG: number,
  policy: SitePolicy = DEFAULT_POLICY,
): number {
  /**
   * kg per tank = mmol/L × (g per mol of driving ion) × CF/1000 × V/1000
   *
   * At the standard CF = 100 and V = 1000 L this reduces to the familiar
   * `Mass (kg) = mmol/L × MW × 0.1`.
   */
  return (
    mmolPerL *
    massPerMolIonG *
    (policy.concentration_factor / 1000.0) *
    (policy.tank_volume_l / 1000.0)
  );
}

export function stockMassMicroG(
  umolPerL: number,
  ion: string,
  fraction: number,
  policy: SitePolicy = DEFAULT_POLICY,
): number {
  /**
   * g per tank = umol/L × atomic weight / product fraction × CF/1000 × V/1000
   *
   * e.g. Fe 15 umol/L as Fe-DTPA 6%: 15 × 55.85 / 0.06 × 0.1 = 1396 g.
   */
  return (
    ((umolPerL * ATOMIC_WEIGHTS[ion]) / fraction) *
    (policy.concentration_factor / 1000.0) *
    (policy.tank_volume_l / 1000.0)
  );
}

/**
 * Convenience wrapper that mirrors the brief's `calculateMass`.
 *
 * Computes the mass of product needed to deliver `mmolPerL` of the
 * fertiliser's driving ion into a `volume` L tank at `concentration`
 * factor.
 */
export function calculateMass(
  fert: Fertiliser,
  mmolPerL: number,
  volume: number = DEFAULT_POLICY.tank_volume_l,
  concentration: number = DEFAULT_POLICY.concentration_factor,
): { mass_kg: number; volume_l: number | null } {
  const policy: SitePolicy = {
    ...DEFAULT_POLICY,
    tank_volume_l: volume,
    concentration_factor: concentration,
  };
  const massKg = stockMassKg(mmolPerL, massPerMolIon(fert), policy);
  const volL =
    fert.phase === "liquid" && fert.density ? massKg / fert.density : null;
  return { mass_kg: massKg, volume_l: volL };
}

// ==========================================================================
// Dose construction
// ==========================================================================

export function makeDose(
  f: Fertiliser,
  molFertiliser: number,
  policy: SitePolicy,
): Dose {
  /**
   * `molFertiliser` is mmol/L of the FERTILISER, so the per-mole mass is the
   * formula mass. The two conventions are equivalent:
   *
   *     mmol_ion × mass_per_mol_ion == mmol_fertiliser × formula_mass
   *
   * because mass_per_mol_ion = formula_mass / n_driving and
   * mmol_ion = mmol_fertiliser × n_driving. Mixing them silently under-doses
   * every multi-ion fertiliser (calcium nitrate by 5×, calcium chloride by 2×).
   */
  const kg = stockMassKg(molFertiliser, f.formula_mass, policy);
  const vol =
    f.phase === "liquid" && f.density ? kg / f.density : null;
  return {
    fert: f,
    amount_mmol_l: molFertiliser,
    mass_kg: kg,
    volume_l: vol,
    is_micro: false,
  };
}

export function makeMicroDose(
  f: Fertiliser,
  umol: number,
  policy: SitePolicy,
): Dose {
  if (f.micro_ion === null || f.micro_fraction === null) {
    throw new Error(`${f.fid} is not a micronutrient fertiliser`);
  }
  const g = stockMassMicroG(umol, f.micro_ion, f.micro_fraction, policy);
  const kg = g / 1000.0;
  const vol =
    f.phase === "liquid" && f.density ? kg / f.density : null;
  return {
    fert: f,
    amount_mmol_l: umol,
    mass_kg: kg,
    volume_l: vol,
    is_micro: true,
  };
}

/** Returns a new Dose scaled by `frac` (mass, volume, amount all scaled). */
export function scaleDose(d: Dose, frac: number): Dose {
  return {
    ...d,
    amount_mmol_l: d.amount_mmol_l * frac,
    mass_kg: d.mass_kg * frac,
    volume_l: d.volume_l !== null ? d.volume_l * frac : null,
  };
}

// ==========================================================================
// M7 — Base water deduction, EC scaling, allocation
// ==========================================================================

// Base-water Fe is deliberately absent: it precipitates at the emitter.
export const CREDITABLE_FROM_BASE_WATER = [
  "Ca",
  "Mg",
  "S",
  "K",
  "NO3",
  "NH4",
  "P",
  "Cl",
] as const;

export function deductBaseWater(
  recipe: Record<string, number>,
  baseWater: Record<string, number>,
): [Record<string, number>, Record<string, number>] {
  /**
   * Automatically deduct base-water nutrients from the target recipe (step 5
   * of the manual's pipeline, p. 23). Ca, Mg and SO4 are the usual credits.
   *
   * Returns [adjusted_recipe, credit_vector].
   */
  const out: Record<string, number> = { ...recipe };
  const credit: Record<string, number> = {};
  for (const ion of CREDITABLE_FROM_BASE_WATER) {
    const present = baseWater[ion] ?? 0.0;
    if (present <= EPS || !(ion in out)) continue;
    // Credit only up to the target. Water that already carries more of an
    // ion than the recipe wants cannot be un-supplied: a negative demand is
    // physically meaningless and would corrupt the ion balance downstream.
    const credited = Math.min(present, out[ion]);
    credit[ion] = credited;
    out[ion] = out[ion] - credited;
  }
  return [out, credit];
}

export function baseWaterExcess(
  recipe: Record<string, number>,
  baseWater: Record<string, number>,
): Record<string, number> {
  /**
   * Ions the base water supplies in excess of the recipe target. These cannot
   * be removed by fertiliser choice — only by dilution, blending or RO.
   */
  const out: Record<string, number> = {};
  for (const ion of CREDITABLE_FROM_BASE_WATER) {
    const present = baseWater[ion] ?? 0.0;
    const target = recipe[ion];
    if (target === undefined) continue;
    if (present > target + EPS) {
      out[ion] = present - target;
    }
  }
  return out;
}

export function baseWaterExcessGates(excess: Record<string, number>): Gate[] {
  if (Object.keys(excess).length === 0) return [];
  const detailEn = Object.entries(excess)
    .map(([ion, v]) => `${ion} +${v.toFixed(2)} mmol/L`)
    .join(", ");
  const detailZh = Object.entries(excess)
    .map(([ion, v]) => `${ion} 超出 ${v.toFixed(2)} mmol/L`)
    .join("、");
  const triggeredBy: Record<string, number> = {};
  for (const [ion, v] of Object.entries(excess)) {
    triggeredBy[ion] = round(v, 3);
  }
  return [
    {
      gid: "G-WATER-EXCESS",
      severity: "WARNING",
      title: "Base water exceeds recipe target for some ions",
      title_text: bi(
        "Base water exceeds recipe target for some ions",
        "原水中部分离子已超过配方目标",
      ),
      message:
        `The base water already supplies more than the recipe targets: ` +
        `${detailEn}. Fertiliser dosing for these ions is zero; the excess ` +
        `cannot be removed by changing the recipe.`,
      message_text: bi(
        `The base water already supplies more than the recipe targets: ` +
          `${detailEn}. Fertiliser dosing for these ions is zero; the excess ` +
          `cannot be removed by changing the recipe.`,
        `原水供应量已超过配方目标：${detailZh}。这些离子的施肥量为零；超出部分无法通过调整配方消除。`,
      ),
      triggered_by: triggeredBy,
      remedy:
        "Dilute with rainwater or RO water, or accept the higher concentration " +
        "and re-check the ion balance and EC headroom.",
      remedy_text: bi(
        "Dilute with rainwater or RO water, or accept the higher concentration " +
          "and re-check the ion balance and EC headroom.",
        "使用雨水或反渗透水稀释，或接受较高浓度并复核离子平衡与电导率余量。",
      ),
      provenance: "SRC:WUR",
    },
  ];
}

export function deductDrain(
  recipe: Record<string, number>,
  drain: Record<string, number>,
  drainFraction: number,
): [Record<string, number>, Record<string, number>] {
  /**
   * Step 6, p. 24: subtract drain nutrients in proportion to the drain share
   * of the irrigation water. The manual's illustration: drain at EC 4.0 reused
   * at 20% contributes 4.0 × 0.20 = 0.8 mS/cm.
   */
  const out: Record<string, number> = { ...recipe };
  const credit: Record<string, number> = {};
  for (const [ion, value] of Object.entries(drain)) {
    if (!(ion in out)) continue;
    const contribution = value * drainFraction;
    if (Math.abs(contribution) <= EPS) continue;
    const credited = out[ion] > 0 ? Math.min(contribution, out[ion]) : 0.0;
    credit[ion] = credited;
    out[ion] = out[ion] - credited;
  }
  return [out, credit];
}

export const SCALABLE_IONS = ["K", "Ca", "Mg", "NO3", "Cl", "S"] as const;
export const FIXED_IONS = ["NH4", "P"] as const;

export const SCALABLE_CATIONS = ["K", "Ca", "Mg"] as const;
export const SCALABLE_ANIONS = ["NO3", "Cl", "S"] as const;

export function scaleToEc(
  recipe: Record<string, number>,
  ecTarget: number,
): [Record<string, number>, { f_cations: number; f_anions: number }] {
  /**
   * Step 4, p. 23. All main nutrients EXCEPT NH4 and P are calculated to the
   * higher drip irrigation water level; micronutrients are not scaled at all.
   *
   * This is NOT a ratio scale, and it is not a single factor either. Because
   * a balanced solution carries equal cation and anion equivalents, and
   * Formula 4 gives EC = (EqCat + EqAn)/20, hitting the target EC means
   *
   *     EqCat = EqAn = 10 × EC_target
   *
   * Cations and anions therefore scale by SEPARATE factors, each solved with
   * its own fixed ion held back (NH4 on the cation side, P on the anion side):
   *
   *     f_cat = (10×EC_target - eq(NH4)) / eq(K + Ca + Mg)
   *     f_an  = (10×EC_target - eq(P))   / eq(NO3 + Cl + SO4)
   *
   * This lands on the target EC and restores the cation/anion balance in one
   * operation. Verified against Table 3 (EC 2.6 -> 3.0): f_cat = 1.1707 and
   * f_an = 1.1593, reproducing the published step-4 row (K 12.9, Mg 2.2,
   * NO3 17.4, Cl 1.2, SO4 5.1) and, after steps 5-6, the published step-7 row
   * to two decimals. A single shared factor is off by ~0.1 on K and Ca.
   */
  const half = 10.0 * ecTarget;

  const qFixedCat = FIXED_IONS.filter((i) =>
    (CATIONS as readonly string[]).includes(i),
  ).reduce(
    (sum, i) => sum + (ION_CHARGE[i] ?? 0) * (recipe[i] ?? 0.0),
    0.0,
  );
  const qScalCat = SCALABLE_CATIONS.reduce(
    (sum, i) => sum + (ION_CHARGE[i] ?? 0) * (recipe[i] ?? 0.0),
    0.0,
  );
  const qFixedAn = FIXED_IONS.filter((i) =>
    (ANIONS as readonly string[]).includes(i),
  ).reduce(
    (sum, i) => sum + (ION_CHARGE[i] ?? 0) * (recipe[i] ?? 0.0),
    0.0,
  );
  const qScalAn = SCALABLE_ANIONS.reduce(
    (sum, i) => sum + (ION_CHARGE[i] ?? 0) * (recipe[i] ?? 0.0),
    0.0,
  );

  if (qScalCat <= EPS || qScalAn <= EPS) {
    throw new Error("G-NO-SCALABLE-LOAD: nothing left to scale");
  }

  const fCat = (half - qFixedCat) / qScalCat;
  const fAn = (half - qFixedAn) / qScalAn;
  if (fCat <= 0 || fAn <= 0) {
    throw new Error("G-EC-TARGET-BELOW-FIXED-LOAD");
  }

  const out: Record<string, number> = {};
  for (const [ion, v] of Object.entries(recipe)) {
    if ((SCALABLE_CATIONS as readonly string[]).includes(ion)) {
      out[ion] = v * fCat;
    } else if ((SCALABLE_ANIONS as readonly string[]).includes(ion)) {
      out[ion] = v * fAn;
    } else {
      out[ion] = v;
    }
  }
  return [out, { f_cations: fCat, f_anions: fAn }];
}

export function allocateFertilisers(
  recipe: Record<string, number>,
  micro: Record<string, number>,
  acidPlan: AcidPlan | null = null,
  fePlan: FeChelatePlan | null = null,
  boronSource: string = "borax",
  policy: SitePolicy = DEFAULT_POLICY,
): [Dose[], Record<string, number>] {
  /**
   * Fixed greedy order from Ch. 8, p. 28:  H+ -> Cl -> Ca -> NH4 -> P ->
   * Mg -> S -> K, with NO3 closing last through potassium nitrate.
   *
   * Every step decrements the ions the chosen fertiliser co-delivers.
   * Calcium nitrate carries 5 Ca, 1 NH4 and 11 NO3 per mole; failing to
   * decrement those is the classic way to silently over-dose nitrogen.
   */
  const rem: Record<string, number> = {};
  for (const ion of MACRO_IONS) {
    rem[ion] = recipe[ion] ?? 0.0;
  }
  const doses: Dose[] = [];

  const consume = (fid: string, mol: number) => {
    if (mol <= EPS) return;
    const f = FERTILISERS[fid];
    if (!f) throw new Error(`Unknown fertiliser: ${fid}`);
    for (const [ion, n] of Object.entries(f.yields)) {
      if (ion === "H") continue;
      rem[ion] = (rem[ion] ?? 0.0) - n * mol;
    }
    doses.push(makeDose(f, mol, policy));
  };

  // a. H+ from nitric and/or phosphoric acid
  if (acidPlan !== null) {
    consume("hno3_38", acidPlan.h_from_nitric);
    consume("h3po4_59", acidPlan.h_from_phosphoric);
  }

  // b. Cl from calcium chloride (2 Cl per mole)
  if (rem.Cl > EPS) {
    consume("cacl2_s", rem.Cl / 2.0);
  }

  // c. Ca from calcium nitrate solid (5 Ca per mole)
  if (rem.Ca > EPS) {
    consume("can_solid", rem.Ca / 5.0);
  }

  // d. NH4 remainder from MAP
  if (rem.NH4 > EPS) {
    consume("map", rem.NH4);
  }

  // e. P from monopotassium phosphate
  if (rem.P > EPS) {
    consume("mkp", rem.P);
  }

  // f/g. Mg from magnesium sulphate, remainder from magnesium nitrate
  if (rem.Mg > EPS) {
    const fromSulphate = Math.min(rem.Mg, Math.max(rem.S, 0.0));
    consume("mgso4", fromSulphate);
    if (rem.Mg > EPS) {
      consume("mgno3_s", rem.Mg);
    }
  }

  // h. S from potassium sulphate
  if (rem.S > EPS) {
    consume("k2so4", rem.S);
  }

  // i. K (and closing NO3) from potassium nitrate
  if (rem.K > EPS) {
    consume("kno3", rem.K);
  }

  // j. micronutrients
  const microMap: Record<string, string> = {
    Mn: "mn_edta",
    Zn: "zn_edta",
    Cu: "cu_edta",
    Mo: "na_moly",
    B: boronSource,
  };
  for (const [ion, umol] of Object.entries(micro)) {
    if (umol <= EPS) continue;
    if (ion === "Fe") {
      const plan =
        fePlan ?? selectFeChelate(5.5, "INERT_SUBSTRATE", "DRIP");
      for (const [fid, share] of feChelateAllocation(plan)) {
        if (share > EPS) {
          const f = FERTILISERS[fid];
          if (!f) continue;
          doses.push(makeMicroDose(f, umol * share, policy));
        }
      }
    } else {
      const fid = microMap[ion];
      if (fid) {
        const f = FERTILISERS[fid];
        if (!f) continue;
        doses.push(makeMicroDose(f, umol, policy));
      }
    }
  }

  const residual: Record<string, number> = {};
  for (const [ion, v] of Object.entries(rem)) {
    if (Math.abs(v) > 1e-6) {
      residual[ion] = round(v, 4);
    }
  }
  return [doses, residual];
}

// ==========================================================================
// M6 — A/B tank splitting & Fe chelate selection (Ch. 9 & 11)
// ==========================================================================

export function selectFeChelate(
  phRootZone: number,
  medium: string = "INERT_SUBSTRATE",
  irrigationType: string = "DRIP",
  calcareousSoil: boolean = false,
): FeChelatePlan {
  /**
   * Ch. 11, p. 36. Below pH 6.5 a DTPA chelate provides sufficient stability;
   * above 6.5 Fe-EDDHA or Fe-HBED is strongly recommended.
   *
   * Note the switch point is 6.5, not 7.0 (design.md discrepancy D-2), and
   * Fe-EDTA's envelope ends at 6.5 while Fe-DTPA reaches 7.5, so the two are
   * not interchangeable at the top of the band.
   */
  if (calcareousSoil) {
    return {
      primary_fid: "fe_eddha",
      primary_share: 1.0,
      secondary_fid: null,
      secondary_share: 0.0,
      reason_en:
        "In calcareous soils iron is always needed as Fe-EDDHA or Fe-HBED. " +
        "Only the ortho-ortho fraction is active; non-ortho-ortho iron drops " +
        "off the chelate immediately after application.",
      reason_zh:
        "石灰质土壤中铁必须以 Fe-EDDHA 或 Fe-HBED 形式供应。仅邻-邻位组分有效；非邻-邻位的铁施用后立即从螯合物上脱落。",
      require_ortho_ortho: true,
    };
  }

  if (phRootZone > FE_CHELATE_SWITCH_PH) {
    return {
      primary_fid: "fe_eddha",
      primary_share: 1.0,
      secondary_fid: null,
      secondary_share: 0.0,
      reason_en:
        `Root-zone pH ${phRootZone} is above ${FE_CHELATE_SWITCH_PH}. ` +
        `Fe-EDDHA or Fe-HBED is strongly recommended; Fe-DTPA loses ` +
        `stability above pH 7.5 and Fe-EDTA above pH 6.5.`,
      reason_zh:
        `根际 pH ${phRootZone} 高于 ${FE_CHELATE_SWITCH_PH}。` +
        `强烈建议使用 Fe-EDDHA 或 Fe-HBED；Fe-DTPA 在 pH 7.5 以上、Fe-EDTA 在 pH 6.5 以上即失去稳定性。`,
      require_ortho_ortho: true,
    };
  }

  let prophylactic: number;
  let whyEn: string;
  let whyZh: string;
  if (irrigationType === "NFT") {
    prophylactic = PROPHYLACTIC_NFT;
    whyEn =
      "NFT systems carry a high risk of pH elevation, so 10% of the " +
      "iron is supplied as Fe-EDDHA or Fe-HBED as a precaution.";
    whyZh =
      "NFT 系统 pH 升高风险较高，因此将 10% 的铁以 Fe-EDDHA 或 Fe-HBED 形式供应作为预防。";
  } else if (medium === "INERT_SUBSTRATE") {
    prophylactic = PROPHYLACTIC_SUBSTRATE;
    whyEn =
      "Inert substrates carry a high risk of pH elevation, so 25% of " +
      "the iron is supplied as Fe-EDDHA or Fe-HBED as a precaution.";
    whyZh =
      "惰性基质 pH 升高风险较高，因此将 25% 的铁以 Fe-EDDHA 或 Fe-HBED 形式供应作为预防。";
  } else {
    prophylactic = 0.0;
    whyEn = "Fe-DTPA provides sufficient stability at this pH.";
    whyZh = "在该 pH 条件下 Fe-DTPA 具有足够稳定性。";
  }

  return {
    primary_fid: "fe_dtpa",
    primary_share: 1.0 - prophylactic,
    secondary_fid: prophylactic > EPS ? "fe_eddha" : null,
    secondary_share: prophylactic,
    reason_en:
      `Root-zone pH ${phRootZone} is at or below ` +
      `${FE_CHELATE_SWITCH_PH}. ${whyEn}`,
    reason_zh:
      `根际 pH ${phRootZone} 不高于 ${FE_CHELATE_SWITCH_PH}。${whyZh}`,
    require_ortho_ortho: prophylactic > EPS,
  };
}

/** Convenience wrapper matching the brief's `selectIronChelate`. */
export function selectIronChelate(phRootZone: number): FeChelatePlan {
  return selectFeChelate(phRootZone);
}

/** Allocation pairs for the Fe chelate plan: [(fid, share), ...]. */
export function feChelateAllocation(plan: FeChelatePlan): Array<[string, number]> {
  const out: Array<[string, number]> = [
    [plan.primary_fid, plan.primary_share],
  ];
  if (plan.secondary_fid !== null && plan.secondary_share > EPS) {
    out.push([plan.secondary_fid, plan.secondary_share]);
  }
  return out;
}

export function chelateGates(
  plan: FeChelatePlan,
  disinfection: string = "NONE",
  recirculating: boolean = false,
  metalSulphatesUsed: boolean = false,
): Gate[] {
  const gates: Gate[] = [];
  if (plan.require_ortho_ortho) {
    gates.push({
      gid: "G-OO-DECLARE",
      severity: "INFO",
      title: "Check ortho-ortho content on the product label",
      title_text: bi(
        "Check ortho-ortho content on the product label",
        "请核对产品标签上的邻-邻位含量",
      ),
      message:
        "For EDDHA and HBED products, only the ortho-ortho fraction is the " +
        "active ingredient in soil. In Europe this is an obligatory part of " +
        "the guaranteed analysis.",
      message_text: bi(
        "For EDDHA and HBED products, only the ortho-ortho fraction is the " +
          "active ingredient in soil. In Europe this is an obligatory part of " +
          "the guaranteed analysis.",
        "对于 EDDHA 与 HBED 产品，在土壤中仅邻-邻位组分为有效成分。在欧盟，该项是保证成分表的强制内容。",
      ),
      triggered_by: {},
      remedy: "",
      remedy_text: "",
      provenance: "SRC:WUR",
    });
  }
  if (disinfection === "UV" || disinfection === "OZONE" || disinfection === "H2O2") {
    gates.push({
      gid: "G-CHELATE-DISINFECT",
      severity: "WARNING",
      title: "Re-dose chelates after disinfection",
      title_text: bi(
        "Re-dose chelates after disinfection",
        "消毒后需补加螯合物",
      ),
      message:
        `Disinfecting drain water with ${disinfection} breaks down chelate ` +
        `structures to some extent. Replacing the chelates should be done ` +
        `AFTER disinfection, not before.`,
      message_text: bi(
        `Disinfecting drain water with ${disinfection} breaks down chelate ` +
          `structures to some extent. Replacing the chelates should be done ` +
          `AFTER disinfection, not before.`,
        `使用 ${disinfection} 对排液消毒会在一定程度上破坏螯合物结构。补加螯合物应在消毒之后进行，而非之前。`,
      ),
      triggered_by: { disinfection: 0.0 },
      remedy: "Also protect nutrient solutions containing chelates from daylight.",
      remedy_text: bi(
        "Also protect nutrient solutions containing chelates from daylight.",
        "含螯合物的营养液还须避光保存。",
      ),
      provenance: "SRC:WUR",
    });
  }
  if (recirculating) {
    gates.push({
      gid: "G-CHELATE-SODIUM",
      severity: "WARNING",
      title: "Use sodium-free chelates in recirculating systems",
      title_text: bi(
        "Use sodium-free chelates in recirculating systems",
        "循环系统请使用无钠螯合物",
      ),
      message:
        "When drain is recycled, sodium input must be minimised. Switching " +
        "from sodium-based chelates to potassium-based ones, and from borax " +
        "to boric acid, keeps recirculated sodium low.",
      message_text: bi(
        "When drain is recycled, sodium input must be minimised. Switching " +
          "from sodium-based chelates to potassium-based ones, and from borax " +
          "to boric acid, keeps recirculated sodium low.",
        "排液回用时须尽量降低钠输入。将钠基螯合物改为钾基、将硼砂改为硼酸，可保持循环液中钠含量较低。",
      ),
      triggered_by: {},
      remedy: "",
      remedy_text: "",
      provenance: "SRC:WUR",
    });
  }
  if (metalSulphatesUsed) {
    gates.push({
      gid: "G-FE-EXCHANGE-LOSS",
      severity: "WARNING",
      title: "Metal sulphates cause iron loss",
      title_text: bi(
        "Metal sulphates cause iron loss",
        "金属硫酸盐会造成铁损失",
      ),
      message:
        "Using Mn, Zn or Cu sulphates leads to losses of iron through " +
        "exchange of Fe in the chelate. Depending on pH, losses can be " +
        "20-50%. EDTA chelates of Mn, Zn and Cu avoid this.",
      message_text: bi(
        "Using Mn, Zn or Cu sulphates leads to losses of iron through " +
          "exchange of Fe in the chelate. Depending on pH, losses can be " +
          "20-50%. EDTA chelates of Mn, Zn and Cu avoid this.",
        "使用锰、锌、铜的硫酸盐会因螯合物中铁被置换而损失铁。视 pH 而定，损失可达 20-50%。改用 Mn、Zn、Cu 的 EDTA 螯合物可避免此问题。",
      ),
      triggered_by: {},
      remedy: "",
      remedy_text: "",
      provenance: "SRC:WUR",
    });
  }
  return gates;
}

// ---------------------------------------------------------------------------
// A/B tank splitting
// ---------------------------------------------------------------------------

export function validateTankSeparation(
  tankA: Dose[],
  tankB: Dose[],
): Gate[] {
  /**
   * Ksp safety. At 100× concentration both CaSO4 (Ksp ~3.14e-5) and
   * Ca3(PO4)2 (Ksp ~2.07e-33) are far past saturation, which is why the
   * separation is absolute rather than a computed margin. This gate is
   * BLOCKING and cannot be overridden.
   */
  const gates: Gate[] = [];
  for (const [tank, name, nameZh] of [
    [tankA, "A", "A 罐"],
    [tankB, "B", "B 罐"],
  ] as const) {
    const ions = new Set<string>();
    for (const d of tank) {
      for (const ion of Object.keys(d.fert.yields)) {
        ions.add(ion);
      }
    }
    if (!ions.has("Ca")) continue;
    const clashes: string[] = [];
    for (const i of ["S", "P"]) {
      if (ions.has(i)) clashes.push(i);
    }
    if (clashes.length > 0) {
      const product = clashes.includes("S") ? "CaSO4 (gypsum)" : "Ca3(PO4)2";
      gates.push({
        gid: "G-PRECIP-RISK",
        severity: "BLOCKING",
        title: `Precipitation risk in tank ${name}`,
        title_text: bi(
          `Precipitation risk in tank ${name}`,
          `${nameZh}存在沉淀风险`,
        ),
        message:
          `Tank ${name} contains calcium together with ` +
          `${clashes.join(" and ")}. At 100x concentration this ` +
          `precipitates as ${product} and will block the irrigation system. ` +
          `All calcium fertilisers must be separated from phosphate and ` +
          `sulphate fertilisers.`,
        message_text: bi(
          `Tank ${name} contains calcium together with ` +
            `${clashes.join(" and ")}. At 100x concentration this ` +
            `precipitates as ${product} and will block the irrigation system. ` +
            `All calcium fertilisers must be separated from phosphate and ` +
            `sulphate fertilisers.`,
          `${nameZh}同时含有钙与 ${clashes.join(" 和 ")}。在 100 倍浓缩条件下将析出 ${product} 沉淀并堵塞灌溉系统。所有钙肥必须与磷肥、硫酸盐肥分开存放。`,
        ),
        triggered_by: { tank: 0.0 },
        remedy:
          "Move the calcium fertilisers to tank A and the sulphate and " +
          "phosphate fertilisers to tank B.",
        remedy_text: bi(
          "Move the calcium fertilisers to tank A and the sulphate and " +
            "phosphate fertilisers to tank B.",
          "将钙肥移至 A 罐，硫酸盐与磷酸盐肥移至 B 罐。",
        ),
        provenance: "SRC:WUR",
      });
    }
  }
  return gates;
}

export function splitAbTanks(
  doses: Dose[],
  policy: SitePolicy = DEFAULT_POLICY,
): TankSplit {
  /**
   * Ch. 9, p. 31.
   *
   * All calcium fertilisers must be separated from phosphate and sulphate
   * fertilisers: calcium into tank A, sulphate and phosphate into tank B.
   * Potassium nitrate, magnesium nitrate, ammonium nitrate and nitric acid can
   * go into either tank; spreading them balances the load. Chelates prefer
   * tank A, but tank-A acid must stay low enough to keep pH above 3.5.
   */
  const fixedA: Dose[] = [];
  const fixedB: Dose[] = [];
  const either: Dose[] = [];

  for (const d of doses) {
    if (d.fert.tank === "A") {
      fixedA.push(d);
    } else if (d.fert.tank === "B") {
      fixedB.push(d);
    } else {
      either.push(d);
    }
  }

  const outA: Dose[] = [...fixedA];
  const outB: Dose[] = [...fixedB];
  const rest: Dose[] = [];

  // Acid: cap the volume placed in tank A so chelates there stay above pH 3.5
  for (const d of either) {
    if (d.fert.driving_ion === "H" && d.volume_l !== null) {
      const inA = Math.min(d.volume_l, policy.tank_a_acid_cap_l);
      const fracA = inA / d.volume_l;
      if (fracA > EPS) {
        outA.push(scaleDose(d, fracA));
      }
      if (1.0 - fracA > EPS) {
        outB.push(scaleDose(d, 1.0 - fracA));
      }
    } else {
      rest.push(d);
    }
  }

  // Balance the remaining either-class fertilisers by dissolved mass
  let massA = outA.reduce((s, x) => s + x.mass_kg, 0.0);
  const massB = outB.reduce((s, x) => s + x.mass_kg, 0.0);
  const totalRest = rest.reduce((s, x) => s + x.mass_kg, 0.0);
  const targetA = (massA + massB + totalRest) / 2.0;
  let budgetA = Math.max(0.0, Math.min(totalRest, targetA - massA));

  const sortedRest = [...rest].sort((a, b) => b.mass_kg - a.mass_kg);
  for (const d of sortedRest) {
    if (budgetA <= EPS) {
      outB.push(d);
    } else if (d.mass_kg <= budgetA) {
      outA.push(d);
      budgetA -= d.mass_kg;
      massA += d.mass_kg;
    } else {
      const frac = d.mass_kg > EPS ? budgetA / d.mass_kg : 0.0;
      if (frac > EPS) {
        outA.push(scaleDose(d, frac));
      }
      outB.push(scaleDose(d, 1.0 - frac));
      budgetA = 0.0;
    }
  }

  const gates = validateTankSeparation(outA, outB);
  return {
    tank_a: outA,
    tank_b: outB,
    mass_a_kg: outA.reduce((s, x) => s + x.mass_kg, 0.0),
    mass_b_kg: outB.reduce((s, x) => s + x.mass_kg, 0.0),
    gates,
  };
}

/** Convenience wrapper that matches the brief's `splitTanks`. */
export function splitTanks(doses: Dose[], policy: SitePolicy = DEFAULT_POLICY): TankSplit {
  return splitAbTanks(doses, policy);
}

export function tankPhGates(
  split: TankSplit,
  policy: SitePolicy = DEFAULT_POLICY,
): Gate[] {
  const gates: Gate[] = [];
  const acidA = split.tank_a
    .filter((d) => d.fert.driving_ion === "H")
    .reduce((s, d) => s + (d.volume_l ?? 0.0), 0.0);
  const hasChelateA = split.tank_a.some((d) => d.fert.chelate_agent !== null);
  if (hasChelateA && acidA > policy.tank_a_acid_cap_l + EPS) {
    gates.push({
      gid: "G-TANK-A-ACID",
      severity: "CRITICAL",
      title: "Too much acid in tank A for the chelates",
      title_text: bi(
        "Too much acid in tank A for the chelates",
        "A 罐酸量过高，将破坏螯合物",
      ),
      message:
        `Tank A holds ${acidA.toFixed(1)} L of acid alongside chelates. At pH 3.5 ` +
        `or lower the chelate structure breaks down, especially for EDDHA ` +
        `and HBED. Limit tank-A acid to a few litres per m3 and put the ` +
        `remainder in tank B.`,
      message_text: bi(
        `Tank A holds ${acidA.toFixed(1)} L of acid alongside chelates. At pH 3.5 ` +
          `or lower the chelate structure breaks down, especially for EDDHA ` +
          `and HBED. Limit tank-A acid to a few litres per m3 and put the ` +
          `remainder in tank B.`,
        `A 罐中酸量为 ${acidA.toFixed(1)} L 且同时存放螯合物。pH 3.5 及以下时螯合物结构会分解，EDDHA 与 HBED 尤为敏感。A 罐酸量应限制在每立方米数升，其余放入 B 罐。`,
      ),
      triggered_by: { acid_l: round(acidA, 2), cap_l: policy.tank_a_acid_cap_l },
      remedy: "",
      remedy_text: "",
      provenance: "SRC:WUR",
    });
  }
  gates.push({
    gid: "G-TANK-PH-CHECK",
    severity: "INFO",
    title: "Verify stock tank pH after filling",
    title_text: bi(
      "Verify stock tank pH after filling",
      "配罐后请核查母液 pH",
    ),
    message:
      "The pH of tank B should be below 5 and the pH of tank A between 3.5 " +
      "and 5, so that all fertilisers dissolve completely without breaking " +
      "down the chelates.",
    message_text: bi(
      "The pH of tank B should be below 5 and the pH of tank A between 3.5 " +
        "and 5, so that all fertilisers dissolve completely without breaking " +
        "down the chelates.",
      "B 罐 pH 应低于 5，A 罐 pH 应在 3.5 至 5 之间，以保证肥料完全溶解且不破坏螯合物。",
    ),
    triggered_by: {},
    remedy: "",
    remedy_text: "",
    provenance: "SRC:WUR",
  });
  return gates;
}

// ==========================================================================
// M8 — Emergency meltdown gate
// ==========================================================================

export interface EmergencyPayload {
  emergency: true;
  gate_id: "G-MELTDOWN";
  severity: "BLOCKING";
  severity_text: string;
  title: string;
  title_text: string;
  status_text: string;
  reason: string;
  reason_text: string;
  measured_ph: number;
  measured_ec_ms_cm: number;
  limit_ph_min: number;
  limit_ec_max: number;
  recipe_suppressed: true;
  llm_invoked: false;
  instructions: Array<{
    step: number;
    action: string;
    action_text: string;
  }>;
  provenance: string;
}

export function emergencyCheck(
  ph: number,
  ec: number,
  crop: WURCropMatrix | null = null,
  policy: SitePolicy = DEFAULT_POLICY,
): EmergencyPayload | null {
  /**
   * Hardcoded emergency payload. Evaluated FIRST, before every other module.
   * When it fires the recipe output is suppressed and the cognitive layer is
   * never invoked — the instruction set below is returned verbatim.
   */
  const phBad = ph < policy.meltdown_ph_min;
  const ecBad = ec > policy.meltdown_ec_max;
  if (!phBad && !ecBad) return null;

  const reasonsEn: string[] = [];
  const reasonsZh: string[] = [];
  if (phBad) {
    reasonsEn.push(`pH ${ph} is below the ${policy.meltdown_ph_min} floor`);
    reasonsZh.push(`pH ${ph} 低于 ${policy.meltdown_ph_min} 下限`);
  }
  if (ecBad) {
    reasonsEn.push(
      `EC ${ec} mS/cm is above the ${policy.meltdown_ec_max} mS/cm ceiling`,
    );
    reasonsZh.push(`EC ${ec} mS/cm 高于 ${policy.meltdown_ec_max} mS/cm 上限`);
  }

  const targetEc = crop ? crop.ec_root_zone : policy.meltdown_ec_max;

  const steps: Array<[string, string]> = [
    ["Stop nutrient dosing immediately.", "立即停止养分投加。"],
    [
      `Flush with clean base water (EC < 0.5 mS/cm, pH 5.5-6.0) at a ` +
        `leaching fraction of at least 50% until drain EC falls below ` +
        `${targetEc} mS/cm.`,
      `使用洁净原水（EC < 0.5 mS/cm，pH 5.5-6.0）冲洗，排液比不低于 50%，直至排液电导率降至 ${targetEc} mS/cm 以下。`,
    ],
    ["Re-measure drain pH and EC every 2 hours.", "每 2 小时复测排液 pH 与 EC。"],
    [
      "Verify the fertigation unit: injector calibration, acid pump setting, " +
        "A/B tank identification, EC and pH probe calibration.",
      "检查施肥机：注肥泵标定、加酸泵设定、A/B 罐标识、EC 与 pH 电极校准。",
    ],
    [
      "Send a root-zone sample to the laboratory before resuming dosing.",
      "恢复投加前，先送根际样品至实验室分析。",
    ],
    [
      "Do not resume the previous recipe until the cause is identified.",
      "在查明原因前，不得恢复原配方。",
    ],
  ];

  return {
    emergency: true,
    gate_id: "G-MELTDOWN",
    severity: "BLOCKING",
    severity_text: _SEVERITY_TEXT.BLOCKING,
    title: "EMERGENCY FLUSH REQUIRED",
    title_text: bi("EMERGENCY FLUSH REQUIRED", "紧急冲洗指令"),
    status_text: bi(
      "Emergency - Recipe Output Suspended",
      "紧急状态 - 配方输出已暂停",
    ),
    reason: reasonsEn.join("; "),
    reason_text: bi(reasonsEn.join("; "), reasonsZh.join("；")),
    measured_ph: ph,
    measured_ec_ms_cm: ec,
    limit_ph_min: policy.meltdown_ph_min,
    limit_ec_max: policy.meltdown_ec_max,
    recipe_suppressed: true,
    llm_invoked: false,
    instructions: steps.map(([en, zh], i) => ({
      step: i + 1,
      action: en,
      action_text: bi(en, zh),
    })),
    provenance:
      "SRC:PRACTICE thresholds; SRC:WUR agronomic basis (p.15, p.53)",
  };
}

// ==========================================================================
// Diagnostics helpers (M8 routine path)
// ==========================================================================

/** Na / K / Ca / Mg as % of cation equivalents (report chart, p. 30). */
export function cationBalancePct(
  m: Record<string, number>,
): Record<"Na" | "K" | "Ca" | "Mg", number> {
  const ions: Array<"Na" | "K" | "Ca" | "Mg"> = ["Na", "K", "Ca", "Mg"];
  const parts: Record<string, number> = {};
  for (const i of ions) {
    parts[i] = (ION_CHARGE[i] ?? 0) * (m[i] ?? 0.0);
  }
  const total = Object.values(parts).reduce((s, v) => s + v, 0.0);
  if (total <= EPS) {
    return { Na: 0.0, K: 0.0, Ca: 0.0, Mg: 0.0 };
  }
  const out: Record<string, number> = {};
  for (const k of ions) {
    out[k] = round((100.0 * parts[k]) / total, 1);
  }
  return out as Record<"Na" | "K" | "Ca" | "Mg", number>;
}

export const ANTAGONISM_RULES: ReadonlyArray<
  readonly [string, string, string]
> = [
  ["K_SUPPRESSES_CA_MG", "K blocks Ca and Mg uptake", "钾抑制钙镁吸收"],
  ["NA_DISPLACES_CATIONS", "Na displaces nutrient cations", "钠置换养分阳离子"],
  ["CA_SUPPRESSES_MG", "Ca blocks Mg uptake", "钙抑制镁吸收"],
  ["NH4_SUPPRESSES_CA_K", "Ammonium blocks Ca and K uptake", "铵抑制钙钾吸收"],
  [
    "METALS_DISPLACE_FE",
    "Mn, Zn and Cu displace Fe from the chelate",
    "锰锌铜从螯合物上置换铁",
  ],
  [
    "HIGH_PH_LIMITS_P_MICRO",
    "High pH limits P and micronutrient uptake",
    "高 pH 限制磷与微量元素吸收",
  ],
];

export interface AntagonismMatch {
  code: string;
  pattern: string;
  pattern_text: string;
  evidence: Record<string, number>;
}

export function screenAntagonism(
  m: Record<string, number>,
  ph: number,
  targets: Record<string, number>,
  metalSulphatesUsed: boolean = false,
): AntagonismMatch[] {
  /**
   * Deterministic pattern matching only. The engine emits the match; the
   * cognitive layer writes the explanation. The pattern is never invented
   * by the model.
   */
  const shares = cationBalancePct(m);
  const out: AntagonismMatch[] = [];

  const add = (code: string, evidence: Record<string, number>) => {
    const rule = ANTAGONISM_RULES.find((r) => r[0] === code);
    if (!rule) return;
    out.push({
      code,
      pattern: rule[1],
      pattern_text: bi(rule[1], rule[2]),
      evidence,
    });
  };

  const caLow = (m.Ca ?? 0.0) < (targets.Ca ?? 0.0) * 0.9;
  const mgLow = (m.Mg ?? 0.0) < (targets.Mg ?? 0.0) * 0.9;
  if (shares.K > 40.0 && (caLow || mgLow)) {
    add("K_SUPPRESSES_CA_MG", { k_share_pct: shares.K });
  }
  if (shares.Na > 15.0) {
    add("NA_DISPLACES_CATIONS", { na_share_pct: shares.Na });
  }
  const mg = m.Mg ?? 0.0;
  if (mg > EPS && (m.Ca ?? 0.0) / mg > 4.0) {
    add("CA_SUPPRESSES_MG", { ca_mg_ratio: round((m.Ca ?? 0.0) / mg, 2) });
  }
  const nh4 = m.NH4 ?? 0.0;
  const totalN = nh4 + (m.NO3 ?? 0.0);
  if (nh4 > 1.5 || (totalN > EPS && nh4 / totalN > 0.15)) {
    add("NH4_SUPPRESSES_CA_K", { nh4_mmol_l: round(nh4, 2) });
  }
  if (metalSulphatesUsed) {
    add("METALS_DISPLACE_FE", {
      expected_fe_loss_pct_min: 20.0,
      expected_fe_loss_pct_max: 50.0,
    });
  }
  if (ph > 6.5) {
    add("HIGH_PH_LIMITS_P_MICRO", { ph });
  }
  return out;
}

export function residualGates(
  residual: Record<string, number>,
  tolerance: number = 0.05,
): Gate[] {
  /**
   * Ions the fertiliser allocation could not land exactly on target.
   *
   * A negative residual means OVER-supply: the greedy order (Ch. 8, p. 28)
   * fixed that ion through a co-delivered salt before its own turn came up.
   * Nitrate is the usual case -- acid and calcium nitrate can together exceed
   * the NO3 target, leaving potassium nitrate nothing left to close with.
   * Reported rather than silently absorbed.
   */
  const notable: Record<string, number> = {};
  for (const [i, v] of Object.entries(residual)) {
    if (Math.abs(v) > tolerance) notable[i] = v;
  }
  if (Object.keys(notable).length === 0) return [];

  const over: Record<string, number> = {};
  const under: Record<string, number> = {};
  for (const [i, v] of Object.entries(notable)) {
    if (v < 0) over[i] = -v;
    else under[i] = v;
  }

  const partsEn: string[] = [];
  const partsZh: string[] = [];
  if (Object.keys(over).length > 0) {
    partsEn.push(
      "over-supplied: " +
        Object.entries(over)
          .map(([i, v]) => `${i} +${v.toFixed(2)}`)
          .join(", "),
    );
    partsZh.push(
      "过量供给：" +
        Object.entries(over)
          .map(([i, v]) => `${i} +${v.toFixed(2)}`)
          .join("、"),
    );
  }
  if (Object.keys(under).length > 0) {
    partsEn.push(
      "not fully supplied: " +
        Object.entries(under)
          .map(([i, v]) => `${i} ${v.toFixed(2)}`)
          .join(", "),
    );
    partsZh.push(
      "供给不足：" +
        Object.entries(under)
          .map(([i, v]) => `${i} ${v.toFixed(2)}`)
          .join("、"),
    );
  }

  const triggeredBy: Record<string, number> = {};
  for (const [i, v] of Object.entries(notable)) {
    triggeredBy[i] = round(v, 3);
  }

  return [
    {
      gid: "G-ALLOCATION-RESIDUAL",
      severity: "WARNING",
      title: "Fertiliser allocation did not close exactly",
      title_text: bi(
        "Fertiliser allocation did not close exactly",
        "肥料配比未完全闭合",
      ),
      message:
        "The chosen fertilisers cannot hit every target simultaneously (mmol/L) - " +
        partsEn.join("; ") +
        ". Co-delivered ions from acid and calcium " +
        "nitrate are the usual cause.",
      message_text: bi(
        "The chosen fertilisers cannot hit every target simultaneously (mmol/L) - " +
          partsEn.join("; ") +
          ". Co-delivered ions from acid and calcium " +
          "nitrate are the usual cause.",
        "所选肥料无法同时满足所有目标值（mmol/L）——" +
          partsZh.join("；") +
          "。通常源于酸与硝酸钙带入的伴随离子。",
      ),
      triggered_by: triggeredBy,
      remedy:
        "Substitute a fertiliser that carries less of the over-supplied ion " +
        "(e.g. phosphoric for nitric acid, or calcium chloride for part of the " +
        "calcium nitrate), or accept the deviation if it is within crop tolerance.",
      remedy_text: bi(
        "Substitute a fertiliser that carries less of the over-supplied ion " +
          "(e.g. phosphoric for nitric acid, or calcium chloride for part of the " +
          "calcium nitrate), or accept the deviation if it is within crop tolerance.",
        "改用伴随离子较少的肥料（如以磷酸替代硝酸，或以氯化钙替代部分硝酸钙），或在作物耐受范围内接受该偏差。",
      ),
      provenance: "SRC:WUR",
    },
  ];
}

export function ionBalanceGates(recipe: Record<string, number>): Gate[] {
  /**
   * Step 7 of the manual restores the cation/anion balance. This engine
   * REPORTS the imbalance but does not yet auto-restore it (see design.md
   * section 6.7.2, step 7 — counter-ion adjustment is not implemented).
   * A recipe flagged here needs manual counter-ion adjustment before use.
   */
  const rep = balanceReport(recipe);
  if (rep.balanced) return [];
  return [
    {
      gid: "G-ION-IMBALANCE",
      severity: "WARNING",
      title: "Cation/anion balance not restored",
      title_text: bi(
        "Cation/anion balance not restored",
        "阴阳离子平衡尚未恢复",
      ),
      message:
        `Cations total ${rep.eq_cations_meq_l} meq/L against anions ` +
        `${rep.eq_anions_meq_l} meq/L, a difference of ` +
        `${rep.difference_pct}%. A difference below 10% is acceptable ` +
        `analytical variation; above that the solution is genuinely unbalanced. ` +
        `Automatic counter-ion restoration is not implemented.`,
      message_text: bi(
        `Cations total ${rep.eq_cations_meq_l} meq/L against anions ` +
          `${rep.eq_anions_meq_l} meq/L, a difference of ` +
          `${rep.difference_pct}%. A difference below 10% is acceptable ` +
          `analytical variation; above that the solution is genuinely unbalanced. ` +
          `Automatic counter-ion restoration is not implemented.`,
        `阳离子合计 ${rep.eq_cations_meq_l} meq/L，阴离子合计 ` +
          `${rep.eq_anions_meq_l} meq/L，相差 ${rep.difference_pct}%。` +
          `低于 10% 属可接受的分析误差；高于该值则确实失衡。本引擎尚未实现自动配衡。`,
      ),
      triggered_by: {
        difference_pct: rep.difference_pct,
        eq_cations: rep.eq_cations_meq_l,
        eq_anions: rep.eq_anions_meq_l,
      },
      remedy:
        "Adjust the least-constrained counter-ion within its crop band " +
        "(SO4 or NO3 on the anion side, K or Ca on the cation side) before " +
        "filling the tanks.",
      remedy_text: bi(
        "Adjust the least-constrained counter-ion within its crop band " +
          "(SO4 or NO3 on the anion side, K or Ca on the cation side) before " +
          "filling the tanks.",
        "配罐前，请在作物允许区间内调整约束最少的配衡离子（阴离子侧为 SO4 或 NO3，阳离子侧为 K 或 Ca）。",
      ),
      provenance: "SRC:WUR",
    },
  ];
}

// ==========================================================================
// Aggregated safety-gate check (mirrors the brief's `checkSafetyGates`)
// ==========================================================================

export interface SafetyGateInput {
  /** EC (mS/cm), Na, Cl in mmol/L of the raw base water */
  water: { ec: number; na: number; cl: number; recirculating?: boolean };
  /** HCO3⁻ in mmol/L of the raw base water */
  hco3?: number;
  /** Acid-dosing headroom in mmol/L for the chosen recipe */
  no3_headroom?: number;
  p_headroom?: number;
  /** Fe (umol/L) and irrigation type for iron-screening gates */
  fe_umol?: number;
  irrigation_type?: "DRIP" | "SPRINKLER" | "NFT" | "NONE";
  organic_matter?: boolean;
  /** Micronutrient screening inputs (umol/L) */
  water_micro?: Record<string, number>;
  /** Crop matrix (used for the salt-sensitive check) */
  crop?: WURCropMatrix | null;
  /** Acid plan, if computed already */
  acid_plan?: AcidPlan | null;
}

/**
 * Run the M1 / M2 / M7 ion-balance gate set in one call.
 *
 * Mirrors the brief's `checkSafetyGates(water, crop_matrix)`.
 */
export function checkSafetyGates(
  input: SafetyGateInput,
  policy: SitePolicy = DEFAULT_POLICY,
): Gate[] {
  const gates: Gate[] = [];

  // M1a — water classification
  const level = classifyWater(
    input.water.ec,
    input.water.na,
    input.water.cl,
  );
  gates.push(...waterQualityGates(level, Boolean(input.water.recirculating), input.crop ?? null));

  // M1b — iron screening
  if (input.fe_umol !== undefined) {
    gates.push(
      ...ironScreeningGates(
        input.fe_umol,
        input.irrigation_type ?? "DRIP",
        Boolean(input.organic_matter),
      ),
    );
  }

  // M1b — micronutrient screening
  if (input.water_micro) {
    gates.push(...micronutrientScreeningGates(input.water_micro));
  }

  // M1b — acid feasibility
  if (input.acid_plan) {
    gates.push(...acidGates(input.acid_plan));
  } else if (
    input.hco3 !== undefined &&
    input.no3_headroom !== undefined &&
    input.p_headroom !== undefined
  ) {
    const plan = planAcidDosing(
      input.hco3,
      input.no3_headroom,
      input.p_headroom,
      policy,
    );
    gates.push(...acidGates(plan));
  }

  return gates;
}

// ==========================================================================
// 7-step recipe pipeline (mirrors the brief's `calculateRecipe`)
// ==========================================================================

export interface CalculateRecipeInput {
  /** Crop × substrate matrix (root-zone targets + stage adjustments) */
  crop_matrix: WURCropMatrix;
  /** Active growth stages, e.g. ["fruit_set"] */
  stage?: string;
  stages?: string[];
  /** Whether high-water-supply adjustment should apply (>5 L/m²/day) */
  is_high_water_supply?: boolean;
  /** Dry-back steering intent */
  dry_back_intent?: string;
  /** Optional analysed root-zone macro (mmol/L) + EC for feedback correction */
  analysis?: { macro?: Record<string, number>; micro?: Record<string, number>; ec?: number };
  /** Optional raw base water for deduction (step 5) */
  base_water?: Record<string, number>;
  /** Optional drain composition + drain fraction for step 6 */
  drain?: { composition?: Record<string, number>; fraction?: number };
  /** Acid plan; computed automatically if not supplied */
  acid_plan?: AcidPlan | null;
  /** Fe chelate plan; computed automatically from pH if not supplied */
  fe_chelate_plan?: FeChelatePlan | null;
  /** Boron source: "borax" (default) or "h3bo3" */
  boron_source?: string;
  policy?: SitePolicy;
}

export interface CalculateRecipeOutput {
  gates: Gate[];
  macro: Record<string, number>;
  micro: Record<string, number>;
  doses: Dose[];
  residual: Record<string, number>;
  acid_plan: AcidPlan | null;
  fe_chelate_plan: FeChelatePlan | null;
  base_water_credit: Record<string, number>;
  drain_credit: Record<string, number>;
  base_water_excess: Record<string, number>;
  scaling_factors: { f_cations: number; f_anions: number } | null;
  balance_report: BalanceReport;
  findings: Finding[];
  corrections_meta: ReferenceEcMeta | null;
  steering: SteeringResult;
  tank_split: TankSplit;
}

/**
 * 7-step recipe pipeline (Ch. 5, p. 22–24 + Ch. 8, p. 28 + Ch. 9, p. 31):
 *
 *   1. apply stage adjustments (M5)
 *   2. apply feedback corrections (M4) — only if analysis is provided
 *   3. compute acid demand (M1b)
 *   4. scale to target EC (M7, step 4)
 *   5. deduct base water nutrients (M7, step 5)
 *   6. deduct drain nutrients (M7, step 6)
 *   7. allocate fertilisers greedily (M7, step 7)
 *
 * The pipeline also runs the ion-balance gate (step 7 of the manual) and the
 * A/B tank split (M6).
 */
export function calculateRecipe(input: CalculateRecipeInput): CalculateRecipeOutput {
  const policy = input.policy ?? DEFAULT_POLICY;
  const crop = input.crop_matrix;
  const stages = input.stages ?? (input.stage ? [input.stage] : []);

  // 1. Stage adjustments
  const steering = applyStageAdjustments(
    crop,
    stages,
    input.dry_back_intent ?? "BALANCED",
    Boolean(input.is_high_water_supply),
  );

  let macro: Record<string, number> = { ...steering.macro_after };
  let micro: Record<string, number> = { ...steering.micro_after };

  // 2. Feedback corrections (M4)
  let findings: Finding[] = [];
  let correctionsMeta: ReferenceEcMeta | null = null;
  if (input.analysis && input.analysis.ec !== undefined) {
    const analysisMacro = input.analysis.macro ?? {};
    const analysisMicro = input.analysis.micro ?? {};
    const [f, meta] = evaluateCorrections(
      analysisMacro,
      analysisMicro,
      input.analysis.ec,
      crop,
      policy,
    );
    findings = f;
    correctionsMeta = meta;
    // Apply to the POST-stage recipe (matches the Python pipeline)
    const [mAdjusted, microAdjusted] = applyCorrections(macro, micro, findings);
    macro = mAdjusted;
    micro = microAdjusted;
  }

  // 3. Acid plan (M1b)
  const hco3 = input.base_water?.HCO3 ?? 0.0;
  const no3Headroom = Math.max(0.0, (macro.NO3 ?? 0.0) - (crop.fertigation.NO3 ?? 0.0));
  const pHeadroom = Math.max(0.0, (macro.P ?? 0.0) - (crop.fertigation.P ?? 0.0));
  const acidPlan =
    input.acid_plan !== undefined
      ? input.acid_plan
      : planAcidDosing(hco3, no3Headroom, pHeadroom, policy);

  // 4. Scale to target EC (Step 4)
  let scalingFactors: { f_cations: number; f_anions: number } | null = null;
  try {
    const [scaled, factors] = scaleToEc(macro, crop.ec_fertigation);
    macro = scaled;
    scalingFactors = factors;
  } catch {
    // keep unscaled recipe when nothing scalable remains
  }

  // 5. Deduct base-water nutrients (Step 5)
  let baseWaterCredit: Record<string, number> = {};
  if (input.base_water) {
    const [adjusted, credit] = deductBaseWater(macro, input.base_water);
    macro = adjusted;
    baseWaterCredit = credit;
  }

  // 6. Deduct drain nutrients (Step 6)
  let drainCredit: Record<string, number> = {};
  if (input.drain && input.drain.composition && input.drain.fraction !== undefined) {
    const [adjusted, credit] = deductDrain(
      macro,
      input.drain.composition,
      input.drain.fraction,
    );
    macro = adjusted;
    drainCredit = credit;
  }

  // Excess-ions gate
  const excess = input.base_water ? baseWaterExcess(macro, input.base_water) : {};

  // 7. Allocate fertilisers (Step 7)
  const fePlan: FeChelatePlan =
    input.fe_chelate_plan ??
    selectFeChelate(
      (crop.ph_root_zone[0] + crop.ph_root_zone[1]) / 2.0,
      crop.substrate_type,
      "DRIP",
    );
  const [doses, residual] = allocateFertilisers(
    macro,
    micro,
    acidPlan,
    fePlan,
    input.boron_source ?? "borax",
    policy,
  );

  // Tank split (M6)
  const tankSplit = splitAbTanks(doses, policy);

  // Ion balance gate (Step 7 of the manual)
  const balance = balanceReport(macro);

  const gates: Gate[] = [];
  gates.push(...ammoniumGates(macro));
  gates.push(...baseWaterExcessGates(excess));
  gates.push(...residualGates(residual));
  gates.push(...ionBalanceGates(macro));
  gates.push(...tankPhGates(tankSplit, policy));
  if (acidPlan) gates.push(...acidGates(acidPlan));
  gates.push(...chelateGates(fePlan, "NONE", false, false));

  return {
    gates,
    macro,
    micro,
    doses,
    residual,
    acid_plan: acidPlan,
    fe_chelate_plan: fePlan,
    base_water_credit: baseWaterCredit,
    drain_credit: drainCredit,
    base_water_excess: excess,
    scaling_factors: scalingFactors,
    balance_report: balance,
    findings,
    corrections_meta: correctionsMeta,
    steering,
    tank_split: tankSplit,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round(n: number, digits: number): number {
  if (!Number.isFinite(n)) return n;
  const f = Math.pow(10, digits);
  return Math.round(n * f) / f;
}

// Re-exports for convenience
export {
  WATER_QUALITY_LEVELS,
  CL_OFFSET_MMOL_L,
};
