/**
 * Livestock management data — feed rations, pasture carrying capacity,
 * manure nutrient value, and rotational grazing scheduling.
 *
 * Sources:
 * - NRC Nutrient Requirements of Dairy Cattle (2021)
 * - NRC Nutrient Requirements of Beef Cattle (2016)
 * - FAO Animal Production & Health Division
 * - USDA-NRCS Grazing Lands Conservation
 * - SARE Managing Cover Crops for Fertility
 */

// ============================================================================
// 1. FEED RATION CALCULATOR (NRC 2021)
// ============================================================================

export interface FeedIngredient {
  id: string;
  name: string;
  emoji: string;
  dmPct: number;        // dry matter %
  cpPct: number;        // crude protein % of DM
  ndfPct: number;       // neutral detergent fiber % of DM
  adfPct: number;       // acid detergent fiber % of DM
  nel_Mcal_kg: number;  // net energy lactation (Mcal/kg DM)
  neg_Mcal_kg: number;  // net energy gain (Mcal/kg DM)
  pem_Mcal_kg: number;  // net energy maintenance (Mcal/kg DM)
  caPct: number;        // calcium % of DM
  pPct: number;         // phosphorus % of DM
  kgPct: number;        // potassium % of DM
  mgPct: number;        // magnesium % of DM
  price: number;        // $/tonne as-fed
}

export const FEED_INGREDIENTS: FeedIngredient[] = [
  { id: 'corn_silage', name: 'Corn Silage', emoji: '🌽', dmPct: 35, cpPct: 8.0, ndfPct: 45, adfPct: 28, nel_Mcal_kg: 1.55, neg_Mcal_kg: 0.99, pem_Mcal_kg: 1.48, caPct: 0.25, pPct: 0.22, kgPct: 1.0, mgPct: 0.18, price: 55 },
  { id: 'alfalfa_hay', name: 'Alfalfa Hay', emoji: '🌿', dmPct: 90, cpPct: 20.0, ndfPct: 40, adfPct: 32, nel_Mcal_kg: 1.35, neg_Mcal_kg: 0.62, pem_Mcal_kg: 1.27, caPct: 1.40, pPct: 0.30, kgPct: 2.0, mgPct: 0.30, price: 220 },
  { id: 'grass_hay', name: 'Grass Hay', emoji: '🌾', dmPct: 88, cpPct: 12.0, ndfPct: 55, adfPct: 38, nel_Mcal_kg: 1.22, neg_Mcal_kg: 0.48, pem_Mcal_kg: 1.15, caPct: 0.50, pPct: 0.25, kgPct: 1.5, mgPct: 0.20, price: 150 },
  { id: 'corn_grain', name: 'Corn Grain', emoji: '🌽', dmPct: 88, cpPct: 9.0, ndfPct: 9, adfPct: 4, nel_Mcal_kg: 1.96, neg_Mcal_kg: 1.43, pem_Mcal_kg: 1.86, caPct: 0.03, pPct: 0.29, kgPct: 0.4, mgPct: 0.11, price: 180 },
  { id: 'soybean_meal', name: 'Soybean Meal', emoji: '🫘', dmPct: 90, cpPct: 50.0, ndfPct: 10, adfPct: 7, nel_Mcal_kg: 1.89, neg_Mcal_kg: 1.28, pem_Mcal_kg: 1.79, caPct: 0.35, pPct: 0.71, kgPct: 2.1, mgPct: 0.30, price: 420 },
  { id: 'barley_grain', name: 'Barley Grain', emoji: '🌾', dmPct: 89, cpPct: 12.0, ndfPct: 17, adfPct: 6, nel_Mcal_kg: 1.80, neg_Mcal_kg: 1.27, pem_Mcal_kg: 1.70, caPct: 0.05, pPct: 0.34, kgPct: 0.5, mgPct: 0.13, price: 160 },
  { id: 'wheat_bran', name: 'Wheat Bran', emoji: '🌾', dmPct: 89, cpPct: 16.0, ndfPct: 42, adfPct: 13, nel_Mcal_kg: 1.38, neg_Mcal_kg: 0.79, pem_Mcal_kg: 1.30, caPct: 0.14, pPct: 1.15, kgPct: 1.2, mgPct: 0.52, price: 130 },
  { id: 'molasses', name: 'Molasses', emoji: '🍯', dmPct: 75, cpPct: 5.0, ndfPct: 0, adfPct: 0, nel_Mcal_kg: 1.50, neg_Mcal_kg: 1.04, pem_Mcal_kg: 1.43, caPct: 0.80, pPct: 0.10, kgPct: 3.8, mgPct: 0.38, price: 200 },
  { id: 'mineral_mix', name: 'Mineral Mix', emoji: '🧂', dmPct: 100, cpPct: 0, ndfPct: 0, adfPct: 0, nel_Mcal_kg: 0, neg_Mcal_kg: 0, pem_Mcal_kg: 0, caPct: 18.0, pPct: 8.0, kgPct: 0.1, mgPct: 8.0, price: 800 },
];

export interface RationLine {
  ingredientId: string;
  kgAsFed: number;  // kg as-fed per day
}

export interface RationResult {
  totalKgDM: number;
  totalCP_kg: number;
  totalNEL_Mcal: number;
  totalNDF_kg: number;
  totalCa_kg: number;
  totalP_kg: number;
  cpPctDM: number;
  ndfPctDM: number;
  nel_Mcal_kgDM: number;
  costPerDay: number;
  costPerKgDM: number;
  meetsDairy?: { nel: boolean; cp: boolean; ndf: boolean; ca: boolean; p: boolean };
  warnings: string[];
}

/** Compute ration analysis from ingredient proportions. */
export function computeRation(lines: RationLine[], animalType: 'dairy_lactating' | 'dairy_dry' | 'beef_growing' | 'beef_finishing' = 'dairy_lactating'): RationResult {
  let totalKgDM = 0, totalCP_kg = 0, totalNEL_Mcal = 0, totalNDF_kg = 0, totalCa_kg = 0, totalP_kg = 0, costPerDay = 0;
  const warnings: string[] = [];

  for (const line of lines) {
    const ing = FEED_INGREDIENTS.find(i => i.id === line.ingredientId);
    if (!ing) continue;
    const kgDM = line.kgAsFed * (ing.dmPct / 100);
    totalKgDM += kgDM;
    totalCP_kg += kgDM * (ing.cpPct / 100);
    totalNEL_Mcal += kgDM * ing.nel_Mcal_kg;
    totalNDF_kg += kgDM * (ing.ndfPct / 100);
    totalCa_kg += kgDM * (ing.caPct / 100);
    totalP_kg += kgDM * (ing.pPct / 100);
    costPerDay += line.kgAsFed * (ing.price / 1000);  // price is $/tonne, kgAsFed is kg
  }

  const cpPctDM = totalKgDM > 0 ? (totalCP_kg / totalKgDM) * 100 : 0;
  const ndfPctDM = totalKgDM > 0 ? (totalNDF_kg / totalKgDM) * 100 : 0;
  const nel_Mcal_kgDM = totalKgDM > 0 ? totalNEL_Mcal / totalKgDM : 0;
  const costPerKgDM = totalKgDM > 0 ? costPerDay / totalKgDM : 0;

  // NRC 2021 requirements for dairy lactating (650 kg cow, 30 L milk/day)
  const req = {
    dairy_lactating: { nel: 1.55, cp: 16, ndf_max: 35, ca: 0.7, p: 0.4 },
    dairy_dry:       { nel: 1.25, cp: 12, ndf_max: 50, ca: 0.5, p: 0.3 },
    beef_growing:    { nel: 1.40, cp: 13, ndf_max: 45, ca: 0.4, p: 0.3 },
    beef_finishing:  { nel: 1.70, cp: 11, ndf_max: 25, ca: 0.3, p: 0.25 },
  }[animalType];

  const meetsDairy = {
    nel: nel_Mcal_kgDM >= req.nel,
    cp: cpPctDM >= req.cp,
    ndf: ndfPctDM <= req.ndf_max,
    ca: totalKgDM > 0 ? (totalCa_kg / totalKgDM) * 100 >= req.ca : false,
    p: totalKgDM > 0 ? (totalP_kg / totalKgDM) * 100 >= req.p : false,
  };

  if (!meetsDairy.nel) warnings.push(`⚠️ Energy low: ${nel_Mcal_kgDM.toFixed(2)} Mcal/kg DM vs ${req.nel} required — add corn grain or fat.`);
  if (!meetsDairy.cp) warnings.push(`⚠️ Protein low: ${cpPctDM.toFixed(1)}% CP vs ${req.cp}% required — add soybean meal.`);
  if (!meetsDairy.ndf) warnings.push(`⚠️ Fiber high: ${ndfPctDM.toFixed(1)}% NDF vs max ${req.ndf_max}% — reduce forage, increase grain.`);
  if (!meetsDairy.ca) warnings.push(`⚠️ Calcium low — add mineral mix or limestone.`);
  if (!meetsDairy.p) warnings.push(`⚠️ Phosphorus low — add mineral mix or dicalcium phosphate.`);

  return { totalKgDM, totalCP_kg, totalNEL_Mcal, totalNDF_kg, totalCa_kg, totalP_kg, cpPctDM, ndfPctDM, nel_Mcal_kgDM, costPerDay, costPerKgDM, meetsDairy, warnings };
}

// ============================================================================
// 2. PASTURE CARRYING CAPACITY
// ============================================================================

export interface PastureResult {
  carryingCapacity: number;   // AU/ha (animal units per hectare)
  totalAU: number;            // total animal units supported
  recommendedStocking: number; // recommended head count
  grazingDays: number;        // days of grazing available
  forageProduced: number;     // kg DM/ha/season
  forageConsumed: number;     // kg DM/day total
  utilizationRate: number;    // %
  warnings: string[];
}

/** Calculate pasture carrying capacity. */
export function pastureCapacity(params: {
  areaHa: number;
  forageYield_kgDM_ha: number;  // seasonal forage production
  utilizationRate: number;       // 0.5 = 50% utilization (take half, leave half)
  animalWeight_kg: number;       // average animal weight
  intakePctBW: number;           // intake as % of body weight (2-4% typically)
  grazingSeasonDays: number;     // length of grazing season
}): PastureResult {
  const availableForage = params.areaHa * params.forageYield_kgDM_ha * (params.utilizationRate / 100);
  const dailyIntakePerHead = params.animalWeight_kg * (params.intakePctBW / 100);
  // 1 AU (Animal Unit) = 500 kg live weight
  const auPerHead = params.animalWeight_kg / 500;
  const dailyIntakePerAU = 500 * (params.intakePctBW / 100); // ~12 kg DM/AU/day at 2.5%
  const totalAU = availableForage / (dailyIntakePerAU * params.grazingSeasonDays);
  const carryingCapacity = totalAU / params.areaHa;
  const recommendedStocking = Math.floor(totalAU / auPerHead);
  const forageConsumed = recommendedStocking * dailyIntakePerHead;

  const warnings: string[] = [];
  if (params.utilizationRate > 60) warnings.push('⚠️ Utilization >60% risks overgrazing and pasture degradation.');
  if (carryingCapacity < 1) warnings.push(`Low carrying capacity (${carryingCapacity.toFixed(1)} AU/ha) — consider improving forage quality or reducing stock.`);
  if (carryingCapacity > 5) warnings.push('High carrying capacity — ensure rotational grazing to prevent selective overgrazing.');

  return {
    carryingCapacity: Math.round(carryingCapacity * 10) / 10,
    totalAU: Math.round(totalAU * 10) / 10,
    recommendedStocking,
    grazingDays: params.grazingSeasonDays,
    forageProduced: params.forageYield_kgDM_ha,
    forageConsumed: Math.round(forageConsumed),
    utilizationRate: params.utilizationRate,
    warnings,
  };
}

// ============================================================================
// 3. MANURE NUTRIENT VALUE
// ============================================================================

export interface ManureResult {
  nKgPerTonne: number;
  pKgPerTonne: number;
  kKgPerTonne: number;
  totalN_kg: number;
  totalP_kg: number;
  totalK_kg: number;
  nValue: number;    // $ value of N
  pValue: number;    // $ value of P₂O₅
  kValue: number;    // $ value of K₂O
  totalValue: number;
  ureaEquivalent: number;  // kg urea equivalent
  dapEquivalent: number;   // kg DAP equivalent
  mopEquivalent: number;   // kg MOP equivalent
  recommendations: string[];
}

const MANURE_TYPES: Record<string, { n: number; p: number; k: number; dmPct: number }> = {
  dairy_solid:    { n: 5.5, p: 2.3, k: 5.0, dmPct: 18 },
  dairy_liquid:   { n: 3.6, p: 1.4, k: 3.0, dmPct: 8 },
  beef_solid:     { n: 6.0, p: 3.0, k: 6.5, dmPct: 20 },
  poultry_litter: { n: 11.0, p: 9.0, k: 6.5, dmPct: 75 },
  swine_solid:    { n: 5.0, p: 2.8, k: 3.5, dmPct: 18 },
  sheep_solid:    { n: 7.0, p: 3.2, k: 7.0, dmPct: 25 },
  horse_solid:    { n: 4.0, p: 1.5, k: 4.5, dmPct: 28 },
  compost:        { n: 2.5, p: 1.5, k: 2.5, dmPct: 45 },
};

/** Calculate manure nutrient value. */
export function manureValue(manureType: string, tonnesProduced: number, priceN = 0.77, priceP = 1.04, priceK = 0.96): ManureResult {
  const mt = MANURE_TYPES[manureType] || MANURE_TYPES.dairy_solid;
  const nAvail = mt.n * 0.5;  // 50% N availability year 1
  const pAvail = mt.p * 0.8;  // 80% P availability year 1
  const kAvail = mt.k * 0.9;  // 90% K availability year 1

  const totalN_kg = nAvail * tonnesProduced;
  const totalP_kg = pAvail * tonnesProduced;
  const totalK_kg = kAvail * tonnesProduced;

  const nValue = totalN_kg * priceN;
  const pValue = totalP_kg * priceP;
  const kValue = totalK_kg * priceK;
  const totalValue = nValue + pValue + kValue;

  const recommendations: string[] = [];
  if (totalValue > 500) recommendations.push(`💰 Your manure is worth $${totalValue.toFixed(0)}/year — significant fertilizer savings!`);
  recommendations.push(`Apply manure to fields with low P and K soil test levels for maximum value.`);
  recommendations.push(`Incorporate within 24h to reduce N volatilization (saves 20-30% of N).`);
  if (manureType === 'poultry_litter') recommendations.push(`Poultry litter has high P — apply at P-based rate, supplement N with urea.`);

  return {
    nKgPerTonne: nAvail, pKgPerTonne: pAvail, kKgPerTonne: kAvail,
    totalN_kg: Math.round(totalN_kg), totalP_kg: Math.round(totalP_kg), totalK_kg: Math.round(totalK_kg),
    nValue: Math.round(nValue), pValue: Math.round(pValue), kValue: Math.round(kValue),
    totalValue: Math.round(totalValue),
    ureaEquivalent: Math.round(totalN_kg / 0.46),
    dapEquivalent: Math.round(totalP_kg / 0.46),
    mopEquivalent: Math.round(totalK_kg / 0.60),
    recommendations,
  };
}

export { MANURE_TYPES };

// ============================================================================
// 4. ROTATIONAL GRAZING SCHEDULER
// ============================================================================

export interface GrazingPlan {
  paddocks: number;
  grazeDaysPerPaddock: number;
  restDays: number;
  cycleDays: number;
  cyclesPerSeason: number;
  recommendations: string[];
}

/** Calculate rotational grazing plan. */
export function grazingPlan(params: {
  herdSize: number;
  areaHa: number;
  grazingSeasonDays: number;
  targetRestDays: number;
  forageGrowthRate: number;  // kg DM/ha/day
  animalWeight_kg: number;
  intakePctBW: number;
}): GrazingPlan {
  const dailyHerdDemand = params.herdSize * params.animalWeight_kg * (params.intakePctBW / 100);
  const dailyGrowth = params.areaHa * params.forageGrowthRate;
  const utilization = 0.5; // 50% utilization
  const grazeDaysPerPaddock = Math.max(1, Math.floor((params.areaHa * forageGrowthRate_available(dailyGrowth, utilization)) / dailyHerdDemand));

  // Calculate optimal paddock count for target rest
  // n paddocks, graze 1, rest n-1 → rest = (n-1) × grazeDays
  // Solve: targetRest = (n-1) × grazeDays → n = (targetRest / grazeDays) + 1
  const paddocks = Math.max(4, Math.ceil((params.targetRestDays / grazeDaysPerPaddock) + 1));
  const restDays = (paddocks - 1) * grazeDaysPerPaddock;
  const cycleDays = paddocks * grazeDaysPerPaddock;
  const cyclesPerSeason = Math.floor(params.grazingSeasonDays / cycleDays);

  const recommendations: string[] = [];
  if (paddocks < 6) recommendations.push('Consider more paddocks (8-12) for better rest and forage utilization.');
  if (grazeDaysPerPaddock > 4) recommendations.push(`Grazing ${grazeDaysPerPaddock} days per paddock — animals may re-graze regrowth. Reduce paddock size or increase paddock count.`);
  if (cyclesPerSeason < 3) recommendations.push(`Only ${cyclesPerSeason} grazing cycles — consider increasing fertility or reducing herd size.`);
  recommendations.push(`Move animals every ${grazeDaysPerPaddock} day(s). Each paddock rests ${restDays} days between grazings.`);
  recommendations.push(`Target: ${cyclesPerSeason} complete cycles per ${params.grazingSeasonDays}-day season.`);

  return { paddocks, grazeDaysPerPaddock, restDays, cycleDays, cyclesPerSeason, recommendations };
}

function forageGrowthRate_available(dailyGrowth: number, utilization: number): number {
  return dailyGrowth * utilization;
}
