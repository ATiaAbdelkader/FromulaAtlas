/**
 * FarmPilot engine — pure calculation functions for the FarmPilot tool.
 *
 * Contains:
 *  - Recommendation scorer (ranks crops by multi-factor weighted score)
 *  - Atlas estimate fallbacks (when farmer doesn't have data)
 *  - Irrigation calculator (ETc = ETo × Kc, with efficiency + rainfall)
 *  - Fertilizer calculator (NPK product → kg/ha, split across stages)
 *  - Calendar generator (stage timeline from planting date)
 *  - Today's tasks engine (active stage + irrigation/fertilization due)
 *  - Economics (gross margin, break-even, cost/kg)
 *  - Water quality classifier
 *
 * All functions are pure (no React, no localStorage) so they can be unit
 * tested and shared across components.
 */

import type { Language } from './language-store';
import {
  FARMPILOT_CROPS,
  PRODUCTION_SYSTEMS,
  DEFAULT_RECOMMENDATION_WEIGHTS,
  CROP_STAGE_ORDER,
  CROP_STAGE_LABELS,
  type FarmPilotCrop,
  type CropStage,
  type CropStageKc,
  type SoilData,
  type WaterData,
  type WaterSuitability,
  type ProductionSystem,
  type Provenance,
  type Confidence,
  type RecommendationWeights,
  type FarmPilotPlan,
} from './farmpilot-data';
import { ALL_58_WILAYAS, type WilayaDataFull } from './algeria-wilayas-58';

// ---------------------------------------------------------------------------
// 1. Atlas estimates — fallback values when farmer has no measurement
// ---------------------------------------------------------------------------

/** Returns Atlas-estimated soil parameters for a wilaya, or null if unknown. */
export function atlasEstimateSoil(wilayaCode: number | undefined): SoilData | null {
  if (wilayaCode == null) return null;
  const w = ALL_58_WILAYAS.find((x) => x.code === wilayaCode);
  if (!w) return null;

  // Map wilaya's salinityEC (dS/m) and ph to FarmPilot soil shape
  // The wilaya dataset already provides these as curated Atlas estimates.
  const soil: SoilData = {
    texture: mapWilayaSoilToTexture(w.dominantSoil),
    ph: w.ph,
    ecDsm: w.salinityEC,
    organicMatterPct: w.omPct,
    caCO3Pct: w.limePct,
    provenance: {
      texture: 'atlas_estimate',
      ph: 'atlas_estimate',
      ecDsm: 'atlas_estimate',
      organicMatterPct: 'atlas_estimate',
      nPpm: 'unknown',
      pPpm: 'unknown',
      kPpm: 'unknown',
      cecCmolKg: 'unknown',
      sar: 'unknown',
      caCO3Pct: 'atlas_estimate',
    },
  };
  return soil;
}

function mapWilayaSoilToTexture(
  soilClass: WilayaDataFull['dominantSoil'],
): SoilData['texture'] {
  switch (soilClass) {
    case 'vertisol':
      return 'clay';
    case 'calcisol':
      return 'silty_clay_loam' as 'clay_loam'; // calcisols often silty
    case 'arenosol':
      return 'sand';
    case 'fluvisol':
      return 'loam';
    case 'solonchak':
      return 'sandy_loam'; // salty soils often sandy in Algeria
    case 'luvisol':
      return 'clay_loam';
    case 'cambisol':
      return 'loam';
    case 'lithosol':
      return 'sandy_loam';
    default:
      return 'loam';
  }
}

/** Returns Atlas-estimated water parameters for a wilaya, or null if unknown. */
export function atlasEstimateWater(wilayaCode: number | undefined): WaterData | null {
  if (wilayaCode == null) return null;
  const w = ALL_58_WILAYAS.find((x) => x.code === wilayaCode);
  if (!w) return null;

  // Use wilaya's salinityEC as a starting point — for groundwater the EC
  // is often 1.5-3× higher than soil ECe due to concentration, but for
  // surface water (dam) it's lower. We default to wilaya's salinityEC
  // as a conservative Atlas estimate.
  const water: WaterData = {
    ph: 7.8, // typical Algerian irrigation water pH
    ecDsm: w.salinityEC * 1.2, // water EC slightly higher than soil
    tdsPpm: w.salinityEC * 1.2 * 640, // 1 dS/m ≈ 640 ppm TDS
    provenance: {
      ph: 'atlas_estimate',
      ecDsm: 'atlas_estimate',
      tdsPpm: 'atlas_estimate',
      sodiumMeqL: 'unknown',
      chlorideMeqL: 'unknown',
      calciumMeqL: 'unknown',
      magnesiumMeqL: 'unknown',
      bicarbonateMeqL: 'unknown',
      sar: 'unknown',
      boronPpm: 'unknown',
    },
  };
  return water;
}

// ---------------------------------------------------------------------------
// 2. Water quality classification (FAO 29 Ayers & Westcot framework)
// ---------------------------------------------------------------------------

export function classifyWater(water: WaterData): {
  suitability: WaterSuitability;
  reasons: { en: string; fr: string; ar: string }[];
  confidence: Confidence;
} {
  const reasons: { en: string; fr: string; ar: string }[] = [];
  let worst: WaterSuitability = 'suitable';

  // EC thresholds (FAO 29)
  if (water.ecDsm != null) {
    if (water.ecDsm < 0.7) {
      // Suitable
    } else if (water.ecDsm < 3.0) {
      worst = worst === 'suitable' ? 'moderate_limitations' : worst;
      reasons.push({
        en: `EC ${water.ecDsm.toFixed(2)} dS/m — moderate salinity; restrict sensitive crops.`,
        fr: `CE ${water.ecDsm.toFixed(2)} dS/m — salinité modérée; éviter les cultures sensibles.`,
        ar: `التوصيلية ${water.ecDsm.toFixed(2)} ديسيمنس/م — ملوحة متوسطة؛ تجنب المحاصيل الحساسة.`,
      });
    } else {
      worst = 'significant_limitations';
      reasons.push({
        en: `EC ${water.ecDsm.toFixed(2)} dS/m — high salinity; leaching required, only tolerant crops.`,
        fr: `CE ${water.ecDsm.toFixed(2)} dS/m — forte salinité; lessivage requis, cultures tolérantes uniquement.`,
        ar: `التوصيلية ${water.ecDsm.toFixed(2)} ديسيمنس/م — ملوحة عالية؛ يتطلب الغسيل وزراعة المحاصيل المقاومة فقط.`,
      });
    }
  }

  // SAR thresholds
  if (water.sar != null) {
    if (water.sar >= 9 && (water.ecDsm ?? 0) < 0.5) {
      worst = worst === 'suitable' ? 'moderate_limitations' : worst;
      reasons.push({
        en: `SAR ${water.sar.toFixed(1)} with low EC — soil structure / infiltration risk.`,
        fr: `SAR ${water.sar.toFixed(1)} avec faible CE — risque de structure du sol / infiltration.`,
        ar: `SAR ${water.sar.toFixed(1)} مع توصيلية منخفضة — خطر على بنية التربة والترشيح.`,
      });
    } else if (water.sar >= 18) {
      worst = 'significant_limitations';
      reasons.push({
        en: `SAR ${water.sar.toFixed(1)} — severe sodium hazard.`,
        fr: `SAR ${water.sar.toFixed(1)} — fort danger sodique.`,
        ar: `SAR ${water.sar.toFixed(1)} — خطر صوديومي شديد.`,
      });
    }
  }

  // Chloride toxicity
  if (water.chlorideMeqL != null && water.chlorideMeqL > 10) {
    worst = worst === 'suitable' ? 'moderate_limitations' : worst;
    reasons.push({
      en: `Chloride ${water.chlorideMeqL} meq/L — leaf burn risk for sensitive crops.`,
      fr: `Chlorure ${water.chlorideMeqL} meq/L — risque de brûlure foliaire pour cultures sensibles.`,
      ar: `الكلور ${water.chlorideMeqL} مل مكافئ/ل — خطر حرق الأوراق للمحاصيل الحساسة.`,
    });
  }

  // Boron toxicity
  if (water.boronPpm != null && water.boronPpm > 1.0) {
    worst = worst === 'suitable' ? 'moderate_limitations' : worst;
    reasons.push({
      en: `Boron ${water.boronPpm} mg/L — chronic toxicity risk.`,
      fr: `Bore ${water.boronPpm} mg/L — risque de toxicité chronique.`,
      ar: `البورون ${water.boronPpm} ملغ/ل — خطر تسمم مزمن.`,
    });
  }

  // Confidence based on provenance
  const measuredCount = countMeasured(water.provenance);
  const confidence: Confidence =
    measuredCount >= 5 ? 'high' : measuredCount >= 2 ? 'medium' : 'low';

  if (reasons.length === 0) {
    reasons.push({
      en: 'All tested parameters within FAO-29 acceptable ranges.',
      fr: 'Tous les paramètres testés sont dans les plages FAO-29 acceptables.',
      ar: 'جميع المعايير المختبرة ضمن النطاقات المقبولة لـ FAO-29.',
    });
  }

  return { suitability: worst, reasons, confidence };
}

function countMeasured(provenance: Record<string, Provenance>): number {
  return Object.values(provenance).filter((p) => p === 'measured').length;
}

// ---------------------------------------------------------------------------
// 3. Crop recommendation engine
// ---------------------------------------------------------------------------

export interface CropRecommendationResult {
  crop: FarmPilotCrop;
  score: number;              // 0-100
  factors: {
    climateSuitability: { score: number; weight: number; reason: { en: string; fr: string; ar: string } };
    soilSuitability: { score: number; weight: number; reason: { en: string; fr: string; ar: string } };
    waterCompatibility: { score: number; weight: number; reason: { en: string; fr: string; ar: string } };
    salinityTolerance: { score: number; weight: number; reason: { en: string; fr: string; ar: string } };
    plantingSeason: { score: number; weight: number; reason: { en: string; fr: string; ar: string } };
    productionSystem: { score: number; weight: number; reason: { en: string; fr: string; ar: string } };
    waterRequirement: { score: number; weight: number; reason: { en: string; fr: string; ar: string } };
    economicPotential: { score: number; weight: number; reason: { en: string; fr: string; ar: string } };
  };
  strengths: { en: string; fr: string; ar: string }[];
  watchOuts: { en: string; fr: string; ar: string }[];
  confidence: Confidence;
}

export interface FarmContext {
  wilayaCode?: number;
  agroZone?: string;          // 'tell_coastal' | 'high_plateaus' | etc.
  areaHa: number;
  productionSystem: ProductionSystem;
  soil: SoilData;
  water: WaterData;
  plantingDate?: string;      // ISO date for season matching
  farmerObjective?: 'food_security' | 'cash_crop' | 'export' | 'self_consumption';
}

export function recommendCrops(
  context: FarmContext,
  weights: RecommendationWeights = DEFAULT_RECOMMENDATION_WEIGHTS,
  limit = 5,
): CropRecommendationResult[] {
  const results = FARMPILOT_CROPS
    .filter((crop) => crop.productionSystems.includes(context.productionSystem))
    .map((crop) => scoreCrop(crop, context, weights));

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function scoreCrop(
  crop: FarmPilotCrop,
  context: FarmContext,
  weights: RecommendationWeights,
): CropRecommendationResult {
  const plantingMonth = context.plantingDate
    ? new Date(context.plantingDate).getMonth() + 1
    : new Date().getMonth() + 1;

  // 1. Climate suitability — based on agro zone match
  const zoneMatch = context.agroZone
    ? crop.favorableZones.includes(context.agroZone)
      ? 1.0
      : crop.unsuitableZones.includes(context.agroZone)
        ? 0.0
        : 0.5
    : 0.6;
  const climateScore = zoneMatch * 100;
  const climateReason = {
    en: zoneMatch === 1 ? `Optimal for ${context.agroZone ?? 'your'} zone` : zoneMatch === 0 ? `Unsuitable for ${context.agroZone ?? 'your'} zone` : 'Marginal climate match',
    fr: zoneMatch === 1 ? `Optimal pour votre zone ${context.agroZone ?? ''}`.trim() : zoneMatch === 0 ? `Non adapté à votre zone` : 'Match climatique marginal',
    ar: zoneMatch === 1 ? 'مناسب لم区域内ك' : zoneMatch === 0 ? 'غير مناسب لم区域内ك' : 'تطابق مناخي محدود',
  };

  // 2. Soil suitability — pH range + texture
  const ph = context.soil.ph ?? 7.5;
  const phInRange = ph >= crop.idealPhRange[0] && ph <= crop.idealPhRange[1];
  let soilScore = phInRange ? 80 : 40;
  if (context.soil.texture) {
    // Sandy → good for potatoes/carrots; clay → good for wheat/alfalfa
    const sandy = ['sand', 'loamy_sand', 'sandy_loam'];
    const clayey = ['clay', 'clay_loam'];
    const cropPrefersSand = ['potato', 'carrot', 'onion'].includes(crop.id);
    const cropPrefersClay = ['wheat_durum', 'barley', 'alfalfa', 'date_palm'].includes(crop.id);
    if (cropPrefersSand && sandy.includes(context.soil.texture)) soilScore += 20;
    if (cropPrefersClay && clayey.includes(context.soil.texture)) soilScore += 20;
    if (cropPrefersSand && clayey.includes(context.soil.texture)) soilScore -= 10;
    if (cropPrefersClay && sandy.includes(context.soil.texture)) soilScore -= 10;
  }
  soilScore = Math.max(0, Math.min(100, soilScore));
  const soilReason = {
    en: phInRange ? `Soil pH ${ph.toFixed(1)} within optimal range` : `Soil pH ${ph.toFixed(1)} outside optimal range (${crop.idealPhRange[0]}-${crop.idealPhRange[1]})`,
    fr: phInRange ? `pH du sol ${ph.toFixed(1)} dans la plage optimale` : `pH du sol ${ph.toFixed(1)} hors plage optimale (${crop.idealPhRange[0]}-${crop.idealPhRange[1]})`,
    ar: phInRange ? `حموضة التربة ${ph.toFixed(1)} ضمن النطاق الأمثل` : `حموضة التربة ${ph.toFixed(1)} خارج النطاق الأمثل (${crop.idealPhRange[0]}-${crop.idealPhRange[1]})`,
  };

  // 3. Water compatibility — based on water EC vs crop tolerance
  const waterEC = context.water.ecDsm ?? 1.0;
  const waterScore = waterEC <= crop.maxSoilEcDsm * 0.5
    ? 100
    : waterEC <= crop.maxSoilEcDsm
      ? 70
      : waterEC <= crop.maxSoilEcDsm * 1.5
        ? 30
        : 0;
  const waterReason = {
    en: waterEC <= crop.maxSoilEcDsm ? `Water EC ${waterEC.toFixed(2)} dS/m within crop tolerance` : `Water EC ${waterEC.toFixed(2)} exceeds crop tolerance ${crop.maxSoilEcDsm}`,
    fr: waterEC <= crop.maxSoilEcDsm ? `CE de l'eau ${waterEC.toFixed(2)} dS/m dans la tolérance` : `CE de l'eau ${waterEC.toFixed(2)} dépasse la tolérance`,
    ar: waterEC <= crop.maxSoilEcDsm ? `توصيلية الماء ${waterEC.toFixed(2)} ضمن التحمل` : `توصيلية الماء ${waterEC.toFixed(2)} تتجاوز التحمل`,
  };

  // 4. Salinity tolerance — based on crop maxSoilEcDsm
  const soilEC = context.soil.ecDsm ?? 1.0;
  const salScore = soilEC <= crop.maxSoilEcDsm
    ? soilEC <= crop.maxSoilEcDsm * 0.5
      ? 100
      : 80
    : 0;
  const salReason = {
    en: soilEC <= crop.maxSoilEcDsm ? `Soil EC ${soilEC.toFixed(2)} within crop tolerance` : `Soil EC ${soilEC.toFixed(2)} exceeds crop tolerance`,
    fr: soilEC <= crop.maxSoilEcDsm ? `CE du sol ${soilEC.toFixed(2)} dans la tolérance` : `CE du sol ${soilEC.toFixed(2)} dépasse la tolérance`,
    ar: soilEC <= crop.maxSoilEcDsm ? `توصيلية التربة ${soilEC.toFixed(2)} ضمن التحمل` : `توصيلية التربة ${soilEC.toFixed(2)} تتجاوز التحمل`,
  };

  // 5. Planting season — month matches crop.plantingMonths
  const seasonMatch = crop.plantingMonths.includes(plantingMonth);
  const seasonScore = seasonMatch ? 100 : 30;
  const seasonReason = {
    en: seasonMatch ? `${monthName(plantingMonth, 'en')} is a good planting month` : `${monthName(plantingMonth, 'en')} is off-season (best: ${crop.plantingMonths.map((m) => monthName(m, 'en')).join(', ')})`,
    fr: seasonMatch ? `${monthName(plantingMonth, 'fr')} est un bon mois de semis` : `${monthName(plantingMonth, 'fr')} est hors saison (idéal: ${crop.plantingMonths.map((m) => monthName(m, 'fr')).join(', ')})`,
    ar: seasonMatch ? `${monthName(plantingMonth, 'ar')} شهر مناسب للزراعة` : `${monthName(plantingMonth, 'ar')} خارج الموسم (الأمثل: ${crop.plantingMonths.map((m) => monthName(m, 'ar')).join('، ')})`,
  };

  // 6. Production system — already filtered, but score by primary match
  const systemScore = crop.productionSystems.includes(context.productionSystem) ? 100 : 0;
  const systemReason = {
    en: `Suitable for ${context.productionSystem}`,
    fr: `Adapté au système ${context.productionSystem}`,
    ar: `مناسب لنظام ${context.productionSystem}`,
  };

  // 7. Water requirement — score by water efficiency (lower demand = higher score)
  const wr = crop.waterDemandM3Ha;
  const wrScore = wr <= 4000 ? 100 : wr <= 6000 ? 80 : wr <= 9000 ? 50 : 20;
  const wrReason = {
    en: `Water demand: ${wr.toLocaleString()} m³/ha (${wr <= 4000 ? 'low' : wr <= 6000 ? 'medium' : 'high'})`,
    fr: `Besoin en eau: ${wr.toLocaleString()} m³/ha (${wr <= 4000 ? 'faible' : wr <= 6000 ? 'moyen' : 'élevé'})`,
    ar: `احتياج مائي: ${wr.toLocaleString()} م³/ه (${wr <= 4000 ? 'منخفض' : wr <= 6000 ? 'متوسط' : 'مرتفع'})`,
  };

  // 8. Economic potential — gross revenue per ha
  const grossRevenue = crop.referenceYieldTonsHa * 1000 * crop.typicalPriceDzdPerKg;
  const econScore = grossRevenue >= 5_000_000 ? 100 : grossRevenue >= 2_000_000 ? 70 : grossRevenue >= 1_000_000 ? 50 : 30;
  const econReason = {
    en: `Gross revenue potential: ${grossRevenue.toLocaleString()} DZD/ha (${grossRevenue >= 5_000_000 ? 'high' : grossRevenue >= 2_000_000 ? 'medium' : 'lower'})`,
    fr: `Revenu brut potentiel: ${grossRevenue.toLocaleString()} DZD/ha`,
    ar: `الإيراد الإجمالي المحتمل: ${grossRevenue.toLocaleString()} دج/ه`,
  };

  // Weighted sum
  const factors = {
    climateSuitability: { score: climateScore, weight: weights.climateSuitability, reason: climateReason },
    soilSuitability: { score: soilScore, weight: weights.soilSuitability, reason: soilReason },
    waterCompatibility: { score: waterScore, weight: weights.waterCompatibility, reason: waterReason },
    salinityTolerance: { score: salScore, weight: weights.salinityTolerance, reason: salReason },
    plantingSeason: { score: seasonScore, weight: weights.plantingSeason, reason: seasonReason },
    productionSystem: { score: systemScore, weight: weights.productionSystem, reason: systemReason },
    waterRequirement: { score: wrScore, weight: weights.waterRequirement, reason: wrReason },
    economicPotential: { score: econScore, weight: weights.economicPotential, reason: econReason },
  };

  const totalWeight = Object.values(factors).reduce((s, f) => s + f.weight, 0);
  const weightedSum = Object.values(factors).reduce((s, f) => s + f.score * f.weight, 0);
  const score = Math.round((weightedSum / totalWeight));

  // Strengths (top 3 factors)
  const sortedFactors = Object.entries(factors).sort((a, b) => b[1].score - a[1].score);
  const strengths = sortedFactors
    .filter(([, f]) => f.score >= 80)
    .slice(0, 3)
    .map(([, f]) => f.reason);

  // Watch-outs (bottom 3)
  const watchOuts = sortedFactors
    .filter(([, f]) => f.score < 60)
    .slice(-3)
    .map(([, f]) => f.reason);

  // Confidence
  const measuredSoil = countMeasured(context.soil.provenance);
  const measuredWater = countMeasured(context.water.provenance);
  const confidence: Confidence =
    measuredSoil + measuredWater >= 8 ? 'high' : measuredSoil + measuredWater >= 4 ? 'medium' : 'low';

  return { crop, score, factors, strengths, watchOuts, confidence };
}

// ---------------------------------------------------------------------------
// 4. Irrigation calculator (ETc = ETo × Kc)
// ---------------------------------------------------------------------------

export interface IrrigationResult {
  etcMmPerDay: number;          // Crop evapotranspiration mm/day
  etcLitersPerM2PerDay: number; // 1 mm = 1 L/m²
  totalLitersPerDay: number;    // For the area
  totalM3PerDay: number;        // m³/day
  irrigationDurationMinutes?: number;
  etoMmPerDay: number;
  kc: number;
  effectiveRainfallMm: number;
  irrigationEfficiency: number;
  confidence: Confidence;
  reasons: { en: string; fr: string; ar: string }[];
}

export function calculateIrrigation(
  crop: FarmPilotCrop,
  stage: CropStage,
  plan: FarmPilotPlan,
  etoMmPerDay: number,
  rainfallMm: number = 0,
): IrrigationResult {
  const stageData: CropStageKc = crop.stages[stage];
  const ps = PRODUCTION_SYSTEMS.find((p) => p.id === plan.productionSystem);
  const efficiency = getIrrigationEfficiency(plan.irrigationSystem) * (ps?.irrigationEfficiencyMultiplier ?? 1);
  const kc = stageData.kc * (ps?.kcMultiplier ?? 1);

  // ETc = ETo × Kc
  const etcMmPerDay = etoMmPerDay * kc;

  // Effective rainfall (FAO-56: 0.7×rainfall above 8mm, else 0)
  const effectiveRainfallMm = rainfallMm > 8 ? rainfallMm * 0.7 : 0;

  // Net irrigation = ETc - effective rainfall
  const netIrrigationMm = Math.max(0, etcMmPerDay - effectiveRainfallMm);

  // Gross irrigation = Net / efficiency
  const grossIrrigationMm = netIrrigationMm / efficiency;
  const grossLitersPerM2 = grossIrrigationMm; // 1 mm = 1 L/m²
  const totalM2 = plan.areaHa * 10000;
  const totalLiters = grossLitersPerM2 * totalM2;
  const totalM3 = totalLiters / 1000;

  let irrigationDurationMinutes: number | undefined;
  if (plan.irrigationFlowLph) {
    irrigationDurationMinutes = (totalLiters / plan.irrigationFlowLph) * 60;
  }

  const reasons: { en: string; fr: string; ar: string }[] = [
    {
      en: `ETo=${etoMmPerDay.toFixed(2)} mm/day × Kc=${kc.toFixed(2)} = ETc ${etcMmPerDay.toFixed(2)} mm/day`,
      fr: `ETo=${etoMmPerDay.toFixed(2)} mm/j × Kc=${kc.toFixed(2)} = ETc ${etcMmPerDay.toFixed(2)} mm/j`,
      ar: `ETo=${etoMmPerDay.toFixed(2)} ملم/يوم × Kc=${kc.toFixed(2)} = ETc ${etcMmPerDay.toFixed(2)} ملم/يوم`,
    },
    {
      en: `Efficiency: ${(efficiency * 100).toFixed(0)}% (${plan.irrigationSystem}${ps ? ` + ${ps.id}` : ''})`,
      fr: `Efficacité: ${(efficiency * 100).toFixed(0)}% (${plan.irrigationSystem}${ps ? ` + ${ps.id}` : ''})`,
      ar: `الكفاءة: ${(efficiency * 100).toFixed(0)}% (${plan.irrigationSystem}${ps ? ` + ${ps.id}` : ''})`,
    },
  ];
  if (effectiveRainfallMm > 0) {
    reasons.push({
      en: `Effective rainfall: ${effectiveRainfallMm.toFixed(1)} mm deducted`,
      fr: `Précipitations efficaces: ${effectiveRainfallMm.toFixed(1)} mm déduites`,
      ar: `هطول فعال: ${effectiveRainfallMm.toFixed(1)} ملم مخصوم`,
    });
  }

  const confidence: Confidence = etoMmPerDay > 0 && plan.irrigationFlowLph != null ? 'high' : etoMmPerDay > 0 ? 'medium' : 'low';

  return {
    etcMmPerDay: parseFloat(grossIrrigationMm.toFixed(2)),
    etcLitersPerM2PerDay: parseFloat(grossLitersPerM2.toFixed(2)),
    totalLitersPerDay: Math.round(totalLiters),
    totalM3PerDay: parseFloat(totalM3.toFixed(2)),
    irrigationDurationMinutes: irrigationDurationMinutes ? Math.round(irrigationDurationMinutes) : undefined,
    etoMmPerDay,
    kc,
    effectiveRainfallMm: parseFloat(effectiveRainfallMm.toFixed(2)),
    irrigationEfficiency: efficiency,
    confidence,
    reasons,
  };
}

function getIrrigationEfficiency(system: FarmPilotPlan['irrigationSystem']): number {
  switch (system) {
    case 'drip':
      return 0.9;
    case 'sprinkler':
      return 0.75;
    case 'furrow':
      return 0.6;
    case 'rainfed':
      return 1.0; // no irrigation system, just rainfall
    default:
      return 0.8;
  }
}

// ---------------------------------------------------------------------------
// 5. Crop stage progression from planting date
// ---------------------------------------------------------------------------

export interface StageProgress {
  stage: CropStage;
  startDate: Date;
  endDate: Date;
  durationDays: number;
  daysSincePlanting: number; // cumulative
  isActive: boolean;
}

export function getStageProgression(crop: FarmPilotCrop, plantingDate: string): StageProgress[] {
  const start = new Date(plantingDate);
  let cursor = new Date(start);
  const today = new Date();

  return CROP_STAGE_ORDER.map((stage) => {
    const stageData = crop.stages[stage];
    const duration = stageData.durationDays;
    const endDate = new Date(cursor.getTime() + duration * 86400000);
    const daysSincePlanting = Math.round((cursor.getTime() - start.getTime()) / 86400000);
    const isActive = today >= cursor && today < endDate;

    const progress: StageProgress = {
      stage,
      startDate: new Date(cursor),
      endDate: new Date(endDate),
      durationDays: duration,
      daysSincePlanting,
      isActive,
    };

    cursor = new Date(endDate);
    return progress;
  });
}

export function getActiveStage(crop: FarmPilotCrop, plantingDate: string): StageProgress | undefined {
  return getStageProgression(crop, plantingDate).find((p) => p.isActive);
}

// ---------------------------------------------------------------------------
// 6. Fertilizer calculator (NPK product → kg/ha)
// ---------------------------------------------------------------------------

export interface FertilizerResult {
  crop: FarmPilotCrop;
  /** Required nutrient (kg/ha) — the agronomic target. */
  requiredNutrient: { n: number; p: number; k: number };
  /** Required product (kg/ha) adjusted for product concentration. */
  requiredProductKgPerHa: number;
  /** Total product for the area (kg). */
  totalProductKg: number;
  /** Split applications across stages. */
  splitApplications: { stage: CropStage; fraction: number; kgPerHa: number; label: { en: string; fr: string; ar: string } }[];
  confidence: Confidence;
}

export function calculateFertilizer(
  crop: FarmPilotCrop,
  plan: FarmPilotPlan,
  /** NPK product, e.g. "15-15-15" → 15% N, 15% P₂O₅, 15% K₂O. */
  product: string,
  /** Target yield multiplier (1.0 = reference yield). */
  yieldMultiplier: number = 1.0,
): FertilizerResult {
  // Determine which nutrient is "limiting" based on NPK product
  const [n, p, k] = product.split(/[-×x]/).map((s) => parseFloat(s) / 100);

  // Required nutrient scaled by yield target
  const requiredNutrient = {
    n: crop.nutrientUptake.n * yieldMultiplier,
    p: crop.nutrientUptake.p * yieldMultiplier,
    k: crop.nutrientUptake.k * yieldMultiplier,
  };

  // P₂O₅ ≈ P × 2.29 ; K₂O ≈ K × 1.20
  // Product supplies n%N, p%P2O5, k%K2O.
  // Determine kg of product needed to meet N demand (primary driver for vegetative growth)
  const requiredProductKgPerHa = requiredNutrient.n / (n || 0.15);

  // Split across stages using cumulative uptake fractions
  const stages = CROP_STAGE_ORDER.filter((s) => s !== 'planting' && s !== 'harvest');
  let prevN = 0;
  const splitApplications = stages.map((stage) => {
    const stageData = crop.stages[stage];
    const fraction = stageData.nUptakeFraction - prevN;
    prevN = stageData.nUptakeFraction;
    const kgPerHa = requiredProductKgPerHa * fraction;
    const label = {
      en: `${stage.replace('_', ' ')}: ${(fraction * 100).toFixed(0)}% of N`,
      fr: `${stage.replace('_', ' ')}: ${(fraction * 100).toFixed(0)}% de l'azote`,
      ar: `${stage.replace('_', ' ')}: ${(fraction * 100).toFixed(0)}% من الآزوت`,
    };
    return { stage, fraction, kgPerHa: parseFloat(kgPerHa.toFixed(1)), label };
  });

  const totalProductKg = requiredProductKgPerHa * plan.areaHa;

  const confidence: Confidence =
    requiredNutrient.n > 0 && n > 0 ? 'medium' : 'low';

  return {
    crop,
    requiredNutrient,
    requiredProductKgPerHa: parseFloat(requiredProductKgPerHa.toFixed(1)),
    totalProductKg: Math.round(totalProductKg),
    splitApplications,
    confidence,
  };
}

// ---------------------------------------------------------------------------
// 7. Planting calculator (density, seed requirement)
// ---------------------------------------------------------------------------

export interface PlantingResult {
  totalPlants: number;
  seedKgRequired: number;
  rowSpacingM: number;
  plantSpacingM: number;
  rowsPerHa: number;
}

export function calculatePlanting(
  crop: FarmPilotCrop,
  areaHa: number,
  rowSpacingM: number = 0.75,
  plantSpacingM: number = 0.3,
): PlantingResult {
  const totalM2 = areaHa * 10000;
  const totalPlants = Math.round(totalM2 * crop.plantsPerM2);
  const seedKgRequired = Math.round(crop.seedKgPerHa * areaHa);
  const rowsPerHa = Math.round(10000 / (rowSpacingM * rowSpacingM)); // approximate
  return {
    totalPlants,
    seedKgRequired,
    rowSpacingM,
    plantSpacingM,
    rowsPerHa,
  };
}

// ---------------------------------------------------------------------------
// 8. Economics calculator
// ---------------------------------------------------------------------------

export interface EconomicsResult {
  areaHa: number;
  expectedYieldTonsHa: number;
  expectedYieldTonsTotal: number;
  priceDzdPerKg: number;
  totalRevenueDzd: number;
  costPerHaDzd: number;
  totalCostDzd: number;
  grossMarginDzd: number;
  grossMarginPerHaDzd: number;
  costPerKgDzd: number;
  breakEvenPriceDzdPerKg: number;
  roiPct: number;
}

export function calculateEconomics(
  crop: FarmPilotCrop,
  areaHa: number,
  expectedYieldTonsHa: number,
  priceDzdPerKg: number,
  customCostPerHaDzd?: number,
): EconomicsResult {
  const expectedYieldTonsTotal = expectedYieldTonsHa * areaHa;
  const totalRevenueDzd = expectedYieldTonsTotal * 1000 * priceDzdPerKg;
  const costPerHaDzd = customCostPerHaDzd ?? crop.indicativeCostDzdPerHa;
  const totalCostDzd = costPerHaDzd * areaHa;
  const grossMarginDzd = totalRevenueDzd - totalCostDzd;
  const grossMarginPerHaDzd = grossMarginDzd / areaHa;
  const costPerKgDzd = totalCostDzd / (expectedYieldTonsTotal * 1000);
  const breakEvenPriceDzdPerKg = totalCostDzd / (expectedYieldTonsTotal * 1000);
  const roiPct = totalCostDzd > 0 ? Math.round((grossMarginDzd / totalCostDzd) * 100) : 0;

  return {
    areaHa,
    expectedYieldTonsHa,
    expectedYieldTonsTotal,
    priceDzdPerKg,
    totalRevenueDzd,
    costPerHaDzd,
    totalCostDzd,
    grossMarginDzd,
    grossMarginPerHaDzd,
    costPerKgDzd,
    breakEvenPriceDzdPerKg,
    roiPct,
  };
}

// ---------------------------------------------------------------------------
// 9. Today's tasks engine
// ---------------------------------------------------------------------------

export interface TodayTask {
  id: string;
  category: 'irrigation' | 'fertilization' | 'inspection' | 'field_work' | 'monitoring';
  emoji: string;
  color: string;
  title: { en: string; fr: string; ar: string };
  detail: { en: string; fr: string; ar: string };
  why?: { en: string; fr: string; ar: string };
  confidence: Confidence;
}

export function generateTodayTasks(
  crop: FarmPilotCrop,
  plan: FarmPilotPlan,
  activeStage: StageProgress | undefined,
  etoMmPerDay: number = 5.0,
): TodayTask[] {
  const tasks: TodayTask[] = [];

  // Irrigation task
  if (activeStage && activeStage.stage !== 'planting' && activeStage.stage !== 'harvest') {
    const ir = calculateIrrigation(crop, activeStage.stage, plan, etoMmPerDay);
    tasks.push({
      id: 'today_irrigation',
      category: 'irrigation',
      emoji: '💧',
      color: 'sky',
      title: {
        en: `Irrigate — ${ir.totalM3PerDay} m³ (${ir.totalLitersPerDay.toLocaleString()} L)`,
        fr: `Irriguer — ${ir.totalM3PerDay} m³ (${ir.totalLitersPerDay.toLocaleString()} L)`,
        ar: `الري — ${ir.totalM3PerDay} م³ (${ir.totalLitersPerDay.toLocaleString()} ل)`,
      },
      detail: {
        en: ir.irrigationDurationMinutes
          ? `Estimated duration: ${ir.irrigationDurationMinutes} minutes at ${plan.irrigationFlowLph?.toLocaleString()} L/h`
          : `Flow rate not set — cannot compute duration`,
        fr: ir.irrigationDurationMinutes
          ? `Durée estimée: ${ir.irrigationDurationMinutes} minutes à ${plan.irrigationFlowLph?.toLocaleString()} L/h`
          : `Débit non défini — durée impossible à calculer`,
        ar: ir.irrigationDurationMinutes
          ? `المدة المقدرة: ${ir.irrigationDurationMinutes} دقيقة بسرعة ${plan.irrigationFlowLph?.toLocaleString()} ل/س`
          : `معدل التدفق غير محدد — لا يمكن حساب المدة`,
      },
      why: ir.reasons[0],
      confidence: ir.confidence,
    });
  }

  // Fertilization task
  if (activeStage && ['germination', 'vegetative', 'flowering', 'fruit_development'].includes(activeStage.stage)) {
    const stageData = crop.stages[activeStage.stage];
    const prevStageIdx = CROP_STAGE_ORDER.indexOf(activeStage.stage) - 1;
    const prevStage = prevStageIdx >= 0 ? crop.stages[CROP_STAGE_ORDER[prevStageIdx]] : { nUptakeFraction: 0 };
    const fraction = stageData.nUptakeFraction - prevStage.nUptakeFraction;
    if (fraction > 0) {
      const npkProduct = plan.fertilizerProduct ?? '15-15-15';
      const fert = calculateFertilizer(crop, plan, npkProduct);
      const split = fert.splitApplications.find((s) => s.stage === activeStage.stage);
      if (split && split.kgPerHa > 0) {
        tasks.push({
          id: 'today_fertilization',
          category: 'fertilization',
          emoji: '🧪',
          color: 'amber',
          title: {
            en: `Fertilize — ${npkProduct} at ${split.kgPerHa.toFixed(1)} kg/ha`,
            fr: `Fertiliser — ${npkProduct} à ${split.kgPerHa.toFixed(1)} kg/ha`,
            ar: `التسميد — ${npkProduct} بمعدل ${split.kgPerHa.toFixed(1)} كغ/ه`,
          },
          detail: {
            en: `${(fraction * 100).toFixed(0)}% of total N for this stage. Total for ${plan.areaHa} ha: ${(split.kgPerHa * plan.areaHa).toFixed(0)} kg.`,
            fr: `${(fraction * 100).toFixed(0)}% de l'azote total pour ce stade. Total pour ${plan.areaHa} ha: ${(split.kgPerHa * plan.areaHa).toFixed(0)} kg.`,
            ar: `${(fraction * 100).toFixed(0)}% من إجمالي الآزوت لهذه المرحلة. الإجمالي لـ ${plan.areaHa} ه: ${(split.kgPerHa * plan.areaHa).toFixed(0)} كغ.`,
          },
          why: {
            en: `Crop is in ${activeStage.stage} stage; N uptake is ${(fraction * 100).toFixed(0)}% of total cycle.`,
            fr: `La culture est au stade ${activeStage.stage}; l'absorption d'azote est de ${(fraction * 100).toFixed(0)}% du cycle total.`,
            ar: `المحصول في مرحلة ${activeStage.stage}; امتصاص الآزوت هو ${(fraction * 100).toFixed(0)}% من الدورة الكاملة.`,
          },
          confidence: fert.confidence,
        });
      }
    }
  }

  // Inspection task
  tasks.push({
    id: 'today_inspection',
    category: 'inspection',
    emoji: '🔍',
    color: 'yellow',
    title: {
      en: 'Inspect crop health and soil moisture',
      fr: 'Inspecter la santé de la culture et l\'humidité du sol',
      ar: 'فحص صحة المحصول ورطوبة التربة',
    },
    detail: {
      en: 'Walk the field, check for pest/disease, monitor soil moisture at root depth.',
      fr: 'Parcourez la parcelle, vérifiez les ravageurs/maladies, surveillez l\'humidité du sol à la profondeur racinaire.',
      ar: 'تجول في الحقل، تحقق من الآفات والأمراض، راقب رطوبة التربة عند عمق الجذور.',
    },
    confidence: 'high',
  });

  // Field work task (based on stage)
  if (activeStage) {
    const stageWork: Record<CropStage, { en: string; fr: string; ar: string } | null> = {
      planting: { en: 'Complete planting / seeding operations', fr: 'Terminer les opérations de semis', ar: 'إكمال عمليات الزراعة' },
      germination: { en: 'Weed control — light cultivation between rows', fr: 'Désherbage — culture légère entre les rangs', ar: 'مكافحة الأعشاب — حرث خفيف بين الصفوف' },
      vegetative: { en: 'Hilling (potato) / pruning (tomato) / weeding', fr: 'Buttage (pomme de terre) / taille (tomate) / désherbage', ar: 'التكويم (بطاطا) / التقليم (طماطم) / مكافحة الأعشاب' },
      flowering: { en: 'Staking / support plants; protect flowers from heat', fr: 'Tuteurage des plantes; protéger les fleurs de la chaleur', ar: 'دعم النباتات؛ حماية الأزهار من الحرارة' },
      fruit_development: { en: 'Fruit thinning where needed; pest scouting', fr: 'Éclaircissage des fruits si nécessaire; surveillance des ravageurs', ar: 'تخفيف الثمار عند الحاجة؛ كشف الآفات' },
      maturation: { en: 'Stop irrigation 7-10 days before harvest', fr: 'Arrêter l\'irrigation 7-10 jours avant récolte', ar: 'إيقاف الري 7-10 أيام قبل الحصاد' },
      harvest: { en: 'Harvest at proper maturity; sort and pack', fr: 'Récolter à maturité; trier et emballer', ar: 'الحصاد عند النضج؛ فرز وتعبئة' },
    };
    const work = stageWork[activeStage.stage];
    if (work) {
      tasks.push({
        id: 'today_field_work',
        category: 'field_work',
        emoji: '👨‍🌾',
        color: 'emerald',
        title: work,
        detail: {
          en: `Active stage: ${activeStage.stage.replace('_', ' ')}`,
          fr: `Stade actif: ${activeStage.stage.replace('_', ' ')}`,
          ar: `المرحلة النشطة: ${activeStage.stage.replace('_', ' ')}`,
        },
        confidence: 'high',
      });
    }
  }

  return tasks;
}

// ---------------------------------------------------------------------------
// 10. Calendar generator (per-stage timeline from planting date)
// ---------------------------------------------------------------------------

export interface CalendarWeek {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  stage: CropStage;
  activities: { category: 'irrigation' | 'fertilization' | 'monitoring' | 'labor' | 'harvest'; emoji: string; label: { en: string; fr: string; ar: string } }[];
}

export function generateCalendar(crop: FarmPilotCrop, plantingDate: string): CalendarWeek[] {
  const progression = getStageProgression(crop, plantingDate);
  const weeks: CalendarWeek[] = [];

  for (const stageProgress of progression) {
    const weekCount = Math.max(1, Math.ceil(stageProgress.durationDays / 7));
    for (let w = 0; w < weekCount; w++) {
      const weekStart = new Date(stageProgress.startDate.getTime() + w * 7 * 86400000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
      const weekNumber = Math.round((weekStart.getTime() - new Date(plantingDate).getTime()) / (7 * 86400000)) + 1;

      const activities: CalendarWeek['activities'] = [
        {
          category: 'monitoring',
          emoji: '🔍',
          label: {
            en: `${CROP_STAGE_LABELS[stageProgress.stage].label.en} monitoring`,
            fr: `Suivi ${CROP_STAGE_LABELS[stageProgress.stage].label.fr.toLowerCase()}`,
            ar: `متابعة ${CROP_STAGE_LABELS[stageProgress.stage].label.ar}`,
          },
        },
      ];

      if (['vegetative', 'flowering', 'fruit_development'].includes(stageProgress.stage)) {
        activities.unshift({
          category: 'irrigation',
          emoji: '💧',
          label: { en: 'Irrigate as per ETc', fr: 'Irriguer selon ETc', ar: 'الري حسب ETc' },
        });
      }
      if (['germination', 'vegetative', 'flowering'].includes(stageProgress.stage)) {
        activities.push({
          category: 'fertilization',
          emoji: '🧪',
          label: { en: 'Apply NPK split', fr: 'Apport NPK fractionné', ar: 'إضافة NPK جزئية' },
        });
      }
      if (stageProgress.stage === 'harvest') {
        activities.push({
          category: 'harvest',
          emoji: '🧺',
          label: { en: 'Harvest window', fr: 'Fenêtre de récolte', ar: 'فترة الحصاد' },
        });
      }

      weeks.push({
        weekNumber,
        startDate: weekStart,
        endDate: weekEnd,
        stage: stageProgress.stage,
        activities,
      });
    }
  }

  return weeks;
}

// ---------------------------------------------------------------------------
// 11. Helpers
// ---------------------------------------------------------------------------

export function monthName(month: number, language: Language): string {
  const months: Record<Language, string[]> = {
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    fr: ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'],
    ar: ['يناير', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  };
  return months[language][month - 1] ?? '?';
}

export function formatDzd(n: number): string {
  return n.toLocaleString('en-US') + ' DZD';
}

export function getCropById(id: string): FarmPilotCrop | undefined {
  return FARMPILOT_CROPS.find((c) => c.id === id);
}
