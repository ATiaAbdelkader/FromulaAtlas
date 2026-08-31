/**
 * WUR Leaching Fraction & ΔEC washing logic — SRC:PRACTICE
 *
 * Ported from engine.py (M3 module).
 *
 * The WUR manual publishes no irrigation volumes; this module's wash trigger
 * and target LF band are grower-practice defaults calibrated against the
 * manual's single anchor: "adjustments for high water supply are recommended
 * when water supply exceeds 5 l/m²/day" (e.g. p. 41).
 */

import type {
  Gate,
  LeachingBand,
  LeachingResult,
  SitePolicy,
  WashCase,
} from "./wur-types";
import { bi } from "./wur-types";
import {
  DEFAULT_POLICY,
  referenceIrrigation,
} from "./wur-fertilizer-catalogue";

// ---------------------------------------------------------------------------
// Public constants
// ---------------------------------------------------------------------------

export const LF_BANDS: ReadonlyArray<
  readonly [number, number, LeachingBand, string, string]
> = [
  [0.0, 10.0, "DEFICIT", "Deficit", "亏缺"],
  [10.0, 20.0, "NORMAL_GENERATIVE", "Normal generative", "生殖生长正常区"],
  [20.0, 30.0, "NORMAL_VEGETATIVE", "Normal vegetative", "营养生长正常区"],
  [30.0, 40.0, "WASH", "Wash / flush", "冲洗区"],
  [40.0, 1e9, "EXCESS", "Excess", "过量"],
];

export const EPS = 1e-9;

// ---------------------------------------------------------------------------
// Simplified public API (per task spec)
// ---------------------------------------------------------------------------

/**
 * Leaching fraction, as a percent.
 *
 *     LF = (V_drain / V_irrigation) × 100%
 */
export function calculateLeachingFraction(
  vDrain: number,
  vIrrigation: number,
): number {
  if (vIrrigation <= 0) return 0.0;
  return (100.0 * vDrain) / vIrrigation;
}

/**
 * Wash cycle trigger. ΔEC = EC_drain − EC_dripper ≥ 2.0 mS/cm.
 *
 * Includes a tiny epsilon tolerance so that exact-threshold readings such as
 * 4.6 − 2.6 (= 1.9999999999999996 in binary floating point) still trip the
 * trigger (matches the Python implementation).
 */
export function checkWashTrigger(
  ecDrain: number,
  ecDripper: number,
  policy: SitePolicy = DEFAULT_POLICY,
): boolean {
  const delta = ecDrain - ecDripper;
  return delta >= policy.wash_trigger_delta_ec - 1e-9;
}

/**
 * Additional daily irrigation needed to lift the leaching fraction from
 * `lfCurrentFrac` to `lfTargetFrac`, in L/m².
 *
 * Plant uptake is the conserved quantity over the short term, not drain:
 *
 *     V_uptake     = V_irrigation × (1 − LF_current)
 *     V_target_irr = V_uptake / (1 − LF_target)
 *     ΔV_extra     = V_irrigation × ((1 − LF_current)/(1 − LF_target) − 1)
 *
 * Returns 0.0 when the current LF already meets or exceeds the target.
 */
export function calculateExtraIrrigation(
  vIrrigation: number,
  lfCurrentFrac: number,
  lfTargetFrac: number,
): number {
  return extraIrrigationForTargetLf(vIrrigation, lfCurrentFrac, lfTargetFrac);
}

/**
 * Detect the agronomic anomaly case: a high leaching fraction paired with a
 * persistent EC gap. When this fires, more water is the wrong answer — the
 * problem is substrate channeling, stock EC over-calibration, or severe salt
 * accumulation beyond what volume alone can shift.
 */
export function detectWashAnomaly(
  lfPct: number,
  deltaEc: number,
  policy: SitePolicy = DEFAULT_POLICY,
): boolean {
  if (deltaEc < policy.wash_trigger_delta_ec - 1e-9) return false;
  return lfPct >= policy.wash_lf_anomaly_min;
}

// ---------------------------------------------------------------------------
// Full engine API (mirrors engine.py M3)
// ---------------------------------------------------------------------------

/**
 * Choose the wash target leaching fraction for the CURRENT leaching fraction.
 *
 * A fixed 32.5% target is only correct while the crop is under-leaching. Once
 * the measured LF is already at or above that figure, "raise LF to 32.5%"
 * describes a reduction, the solver returns a negative volume, the clamp
 * turns it into zero, and the grower is told to "add 0.00 L/m²/day" — advice
 * that is both contradictory and useless.
 *
 *   STANDARD  LF < 30%        -> 32.5% (midpoint of the 30-35% band)
 *   MODERATE  30% <= LF < 40% -> LF + 10 points, capped at 50%
 *   ANOMALY   LF >= 40%       -> no volume target at all
 *
 * The ANOMALY case is a genuine agronomic finding, not a clamp. An EC gap
 * that persists while more than 40% of applied water already drains away is
 * not a leaching deficit: the water is bypassing the root zone (substrate
 * channeling / preferential flow), the dripper or stock EC is over-calibrated,
 * or salt has accumulated beyond what volume alone can shift. Adding more
 * water would waste water and fertiliser without closing the gap.
 */
export function washTargetLf(
  lfCurrentPct: number,
  policy: SitePolicy = DEFAULT_POLICY,
): [number, WashCase] {
  if (lfCurrentPct < policy.wash_lf_moderate_min) {
    return [policy.wash_lf_target, "STANDARD"];
  }
  if (lfCurrentPct < policy.wash_lf_anomaly_min) {
    return [
      Math.min(
        policy.wash_lf_moderate_cap,
        lfCurrentPct + policy.wash_lf_moderate_step,
      ),
      "MODERATE",
    ];
  }
  return [lfCurrentPct, "ANOMALY"];
}

/**
 * Additional daily irrigation needed to lift the leaching fraction from
 * `lfCurrentFrac` to `lfTargetFrac`, in L/m².
 *
 * Plant uptake is the conserved quantity over the short term, not drain:
 *
 *     V_uptake     = V_irrigation × (1 − LF_current)
 *     V_target_irr = V_uptake / (1 − LF_target)
 *     ΔV_extra     = V_irrigation × ((1 − LF_current)/(1 − LF_target) − 1)
 *
 * Returns 0.0 when the current LF already meets or exceeds the target.
 */
export function extraIrrigationForTargetLf(
  vIrrigation: number,
  lfCurrentFrac: number,
  lfTargetFrac: number,
): number {
  if (vIrrigation <= EPS) return 0.0;
  if (lfCurrentFrac >= lfTargetFrac) return 0.0;
  if (lfTargetFrac >= 1.0 - EPS) {
    // LF = 100% means zero uptake; the ratio is undefined.
    throw new Error("Target leaching fraction must be below 100%");
  }
  const ratio = (1.0 - lfCurrentFrac) / (1.0 - lfTargetFrac);
  return Math.max(0.0, vIrrigation * (ratio - 1.0));
}

/**
 * Full leaching evaluation.
 *
 * LF = (V_drain / V_irrigation) × 100%.
 *
 * When the irrigation volume is missing or zero, a crop- and stage-based
 * reference volume stands in so the wash increment can still be estimated;
 * the result is flagged `is_estimated_volume`.
 */
export function evaluateLeaching(
  vIrrigation: number | null,
  vDrain: number,
  ecDrip: number,
  ecDrain: number,
  policy: SitePolicy = DEFAULT_POLICY,
  cropId: string | null = null,
  stages: string[] | null = null,
): LeachingResult {
  let isEstimated = vIrrigation === null || vIrrigation <= EPS;
  let vIrr = vIrrigation;
  if (isEstimated) {
    vIrr = referenceIrrigation(
      cropId ?? "",
      stages,
      policy.reference_irrigation_overrides,
    );
    if (vIrr <= EPS) {
      throw new Error(
        "No irrigation volume supplied and no reference volume available",
      );
    }
  }

  const vIrrFinal = vIrr as number;
  const vDrainClamped = Math.max(0.0, vDrain);
  if (vDrainClamped > vIrrFinal) {
    throw new Error("Drain volume cannot exceed irrigation volume");
  }

  const lf = (100.0 * vDrainClamped) / vIrrFinal;
  const deltaEc = ecDrain - ecDrip;
  const uptake = vIrrFinal - vDrainClamped;

  let band: LeachingBand = "DEFICIT";
  for (const [lo, hi, code] of LF_BANDS) {
    if (lf >= lo && lf < hi) {
      band = code;
      break;
    }
  }

  // Tolerance so that an exact-threshold reading such as 4.6 - 2.6 (which is
  // 1.9999999999999996 in binary floating point) still trips the trigger.
  const wash = deltaEc >= policy.wash_trigger_delta_ec - 1e-9;

  let targetLfPct = policy.wash_lf_target;
  let washCase: WashCase = "NONE";
  let extra = 0.0;
  let targetIrrigation = vIrrFinal;
  if (wash) {
    [targetLfPct, washCase] = washTargetLf(lf, policy);
    if (washCase !== "ANOMALY") {
      extra = extraIrrigationForTargetLf(
        vIrrFinal,
        lf / 100.0,
        targetLfPct / 100.0,
      );
      targetIrrigation = vIrrFinal + extra;
    }
  }

  return {
    lf_pct: lf,
    delta_ec: deltaEc,
    band,
    wash_required: wash,
    target_lf_min: policy.wash_lf_min,
    target_lf_max: policy.wash_lf_max,
    target_lf_pct: targetLfPct,
    extra_irrigation_l_m2: extra,
    target_irrigation_l_m2: targetIrrigation,
    used_irrigation_l_m2: vIrrFinal,
    drain_l_m2: vDrainClamped,
    uptake_l_m2: uptake,
    is_estimated_volume: isEstimated,
    wash_case: washCase,
    is_wash_anomaly: washCase === "ANOMALY",
  };
}

/**
 * Bilingual rendering of the volume increment.
 *
 * A non-positive increment is never shown as a bare "+0.00": it means no
 * additional volume is recommended, which is a different statement from
 * "add nothing and carry on".
 */
export function formatExtraIrrigation(deltaV: number): [string, string] {
  if (deltaV > EPS) {
    return [
      `+${deltaV.toFixed(2)} L/m2/day`,
      `每日 +${deltaV.toFixed(2)} L/m2`,
    ];
  }
  return [
    "+0.00 L/m2/day (no additional volume recommended)",
    "+0.00 L/m2/天（不建议增加灌溉量）",
  ];
}

/**
 * Build the safety gates for a LeachingResult.
 */
export function leachingGates(
  r: LeachingResult,
  policy: SitePolicy = DEFAULT_POLICY,
): Gate[] {
  const gates: Gate[] = [];

  if (r.wash_required && r.is_wash_anomaly) {
    gates.push({
      gid: "G-WASH-ANOMALY",
      severity: "CRITICAL",
      title: "Critical agronomic anomaly - do not add irrigation volume",
      title_text: bi(
        "Critical agronomic anomaly - do not add irrigation volume",
        "严重农艺异常 - 请勿增加灌溉量",
      ),
      message:
        `Leaching fraction is already high (${r.lf_pct.toFixed(1)}%), yet the ` +
        `drain-dripper EC gap is ${r.delta_ec.toFixed(2)} mS/cm. More than ` +
        `${r.lf_pct.toFixed(0)}% of applied water already leaves the substrate, ` +
        `so the salt load is not a leaching deficit and additional volume ` +
        `will not close the gap - it will only waste water and fertiliser.`,
      message_text: bi(
        `Leaching fraction is already high (${r.lf_pct.toFixed(1)}%), yet the ` +
          `drain-dripper EC gap is ${r.delta_ec.toFixed(2)} mS/cm. More than ` +
          `${r.lf_pct.toFixed(0)}% of applied water already leaves the substrate, ` +
          `so the salt load is not a leaching deficit and additional volume ` +
          `will not close the gap - it will only waste water and fertiliser.`,
        `排液比已偏高（${r.lf_pct.toFixed(1)}%），但排液与滴灌电导差仍达 ` +
          `${r.delta_ec.toFixed(2)} mS/cm。已有超过 ${r.lf_pct.toFixed(0)}% 的灌溉水排出基质，` +
          `说明盐分问题并非淋洗不足，增加水量无法缩小电导差，只会浪费水与肥料。`,
      ),
      triggered_by: {
        lf_pct: round(r.lf_pct, 1),
        delta_ec: round(r.delta_ec, 2),
        extra_irrigation_l_m2: 0.0,
      },
      remedy:
        "DO NOT simply increase irrigation volume. Check for: " +
        "1) substrate channeling / preferential flow, water bypassing the " +
        "root zone; 2) dripper or stock tank EC over-calibration; " +
        "3) severe root-zone salt accumulation. " +
        "Switch to shorter, more frequent irrigation pulses.",
      remedy_text: bi(
        "DO NOT simply increase irrigation volume. Check for: " +
          "1) substrate channeling / preferential flow, water bypassing the " +
          "root zone; 2) dripper or stock tank EC over-calibration; " +
          "3) severe root-zone salt accumulation. " +
          "Switch to shorter, more frequent irrigation pulses.",
        "请勿单纯增加灌溉量。请依次排查：" +
          "1) 基质偏流／优势流，水分绕过根区；" +
          "2) 滴灌或母液电导率标定过高；" +
          "3) 根际盐分严重累积。" +
          "并改为短时、高频的脉冲灌溉。",
      ),
      provenance: "SRC:PRACTICE",
    });
  }

  if (r.wash_required && !r.is_wash_anomaly) {
    const [extraEn, extraZh] = formatExtraIrrigation(r.extra_irrigation_l_m2);
    const estimateSuffixEn = r.is_estimated_volume
      ? " Irrigation volume was not supplied, so a crop-stage reference volume was used - verify against your own metering."
      : "";
    const estimateSuffixZh = r.is_estimated_volume
      ? "（未提供灌溉量，已采用作物阶段参考值估算，请与实际计量核对。）"
      : "";
    gates.push({
      gid: "G-WASH-TRIGGER",
      severity: "CRITICAL",
      title: "Dynamic wash cycle triggered",
      title_text: bi(
        "Dynamic wash cycle triggered",
        "触发动态冲洗循环",
      ),
      message:
        `Drain-dripper EC gap is ${r.delta_ec.toFixed(2)} mS/cm, at or above the ` +
        `${policy.wash_trigger_delta_ec} mS/cm trigger. Salts are ` +
        `accumulating in the root zone.`,
      message_text: bi(
        `Drain-dripper EC gap is ${r.delta_ec.toFixed(2)} mS/cm, at or above the ` +
          `${policy.wash_trigger_delta_ec} mS/cm trigger. Salts are ` +
          `accumulating in the root zone.`,
        `排液与滴灌电导差为 ${r.delta_ec.toFixed(2)} mS/cm，达到或超过 ` +
          `${policy.wash_trigger_delta_ec} mS/cm 触发阈值。根际正在积盐。`,
      ),
      triggered_by: {
        delta_ec: round(r.delta_ec, 2),
        lf_pct: round(r.lf_pct, 1),
        extra_irrigation_l_m2: round(r.extra_irrigation_l_m2, 2),
        target_irrigation_l_m2: round(r.target_irrigation_l_m2, 2),
      },
      remedy:
        `Raise leaching fraction from ${r.lf_pct.toFixed(1)}% to ` +
        `${r.target_lf_pct.toFixed(1)}%: add ${extraEn}, increasing irrigation ` +
        `from ${r.used_irrigation_l_m2.toFixed(2)} to ` +
        `${r.target_irrigation_l_m2.toFixed(2)} L/m2/day until the EC gap closes.` +
        estimateSuffixEn,
      remedy_text: bi(
        `Raise leaching fraction from ${r.lf_pct.toFixed(1)}% to ` +
          `${r.target_lf_pct.toFixed(1)}%: add ${extraEn}, increasing irrigation ` +
          `from ${r.used_irrigation_l_m2.toFixed(2)} to ` +
          `${r.target_irrigation_l_m2.toFixed(2)} L/m2/day until the EC gap closes.` +
          estimateSuffixEn,
        `将排液比由 ${r.lf_pct.toFixed(1)}% 提高至 ${r.target_lf_pct.toFixed(1)}%：` +
          `增加 ${extraZh}，灌溉量由 ${r.used_irrigation_l_m2.toFixed(2)} 提高至 ` +
          `${r.target_irrigation_l_m2.toFixed(2)} L/m2/天，直至电导差回落。` +
          estimateSuffixZh,
      ),
      provenance: "SRC:PRACTICE",
    });
  }

  if (r.band === "DEFICIT") {
    gates.push({
      gid: "G-LF-DEFICIT",
      severity: "WARNING",
      title: "Leaching fraction below operating band",
      title_text: bi(
        "Leaching fraction below operating band",
        "排液比低于运行区间",
      ),
      message:
        `LF is ${r.lf_pct.toFixed(1)}%, below 10%. Under-irrigation risks salt ` +
        `accumulation and uneven root-zone moisture.`,
      message_text: bi(
        `LF is ${r.lf_pct.toFixed(1)}%, below 10%. Under-irrigation risks salt ` +
          `accumulation and uneven root-zone moisture.`,
        `排液比为 ${r.lf_pct.toFixed(1)}%，低于 10%。灌溉不足会导致积盐与根际水分不均。`,
      ),
      triggered_by: { lf_pct: round(r.lf_pct, 1) },
      remedy: "",
      remedy_text: "",
      provenance: "SRC:PRACTICE",
    });
  } else if (r.band === "EXCESS") {
    gates.push({
      gid: "G-LF-EXCESS",
      severity: "WARNING",
      title: "Leaching fraction above operating band",
      title_text: bi(
        "Leaching fraction above operating band",
        "排液比高于运行区间",
      ),
      message:
        `LF is ${r.lf_pct.toFixed(1)}%, above 40%. Check emitter uniformity; ` +
        `nutrients and water are being wasted.`,
      message_text: bi(
        `LF is ${r.lf_pct.toFixed(1)}%, above 40%. Check emitter uniformity; ` +
          `nutrients and water are being wasted.`,
        `排液比为 ${r.lf_pct.toFixed(1)}%，高于 40%。请检查滴头均匀性；养分与水正在浪费。`,
      ),
      triggered_by: { lf_pct: round(r.lf_pct, 1) },
      remedy: "",
      remedy_text: "",
      provenance: "SRC:PRACTICE",
    });
  }

  return gates;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round(n: number, digits: number): number {
  const f = Math.pow(10, digits);
  return Math.round(n * f) / f;
}
