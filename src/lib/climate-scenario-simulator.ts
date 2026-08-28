/**
 * Farm Climate Scenario Simulator — adapted from the En-ROADS pattern
 * (https://en-roads.climateinteractive.org)
 *
 * En-ROADS is a global climate solutions simulator that uses sliders →
 * real-time graphs → "what if?" exploration. We apply the same pattern
 * at the FARM level: farmers drag sliders for their practices and instantly
 * see the impact on CO₂ emissions, carbon sequestration, water savings,
 * soil health, and DZD cost/savings.
 *
 * Levers (climate-smart agriculture practices):
 *   1. Cover crop adoption (% of area)
 *   2. Reduced tillage (% of area)
 *   3. Organic amendment rate (t/ha/yr compost/manure)
 *   4. Drip irrigation adoption (% replacing flood)
 *   5. Tree planting (trees/ha — agroforestry)
 *   6. Solar pump adoption (% of pumping)
 *   7. Nitrogen fertilizer reduction (% — precision application)
 *   8. Crop residue retention (% — no burning)
 *
 * Outputs:
 *   - Annual CO₂ emissions (tCO₂e/yr) — baseline vs scenario
 *   - Carbon sequestration potential (tCO₂e/yr)
 *   - Water savings (m³/yr)
 *   - Soil organic matter improvement (% over 10 years)
 *   - Net DZD cost/savings (DZD/yr)
 *   - 10-year trajectory chart data
 *
 * Source: En-ROADS pattern (Climate Interactive, MIT Sloan).
 * Adapted for Algerian farm-level agriculture with FAO + IPCC coefficients.
 */

// ============================================================================
// Levers
// ============================================================================

export interface ClimateLever {
  id: string;
  label: { en: string; fr: string; ar: string };
  description: { en: string; fr: string; ar: string };
  unit: string;
  min: number;
  max: number;
  default: number;
  step: number;
  emoji: string;
  color: string;
}

export const CLIMATE_LEVERS: ClimateLever[] = [
  {
    id: 'cover_crop',
    label: { en: 'Cover crop adoption', fr: 'Cultures intermédiaires', ar: 'المحاصيل المغطّية' },
    description: { en: '% of farm area planted with cover crops between cash crops', fr: '% de la surface en cultures intermédiaires', ar: 'نسبة المساحة المزروعة بمحاصيل تغطية' },
    unit: '%', min: 0, max: 100, default: 0, step: 5,
    emoji: '🌱', color: '#16a34a',
  },
  {
    id: 'reduced_tillage',
    label: { en: 'Reduced tillage', fr: 'Travail réduit du sol', ar: 'الحرث المُقلّل' },
    description: { en: '% of area under no-till or minimum tillage', fr: '% en semis direct ou travail minimal', ar: 'نسبة المساحة بالحراثة المُقلّلة' },
    unit: '%', min: 0, max: 100, default: 0, step: 5,
    emoji: '🚜', color: '#f59e0b',
  },
  {
    id: 'organic_amendment',
    label: { en: 'Organic amendment', fr: 'Amendement organique', ar: 'التعديل العضوي' },
    description: { en: 'Compost or manure applied per hectare per year', fr: 'Compost ou fumier appliqué par hectare', ar: 'سماد عضوي لكل هكتار سنوياً' },
    unit: 't/ha', min: 0, max: 20, default: 0, step: 1,
    emoji: '🧪', color: '#8b5cf6',
  },
  {
    id: 'drip_irrigation',
    label: { en: 'Drip irrigation adoption', fr: 'Adoption du goutte-à-goutte', ar: 'اعتماد الري بالتنقيط' },
    description: { en: '% of irrigated area converted from flood to drip', fr: '% converti du gravitaire au goutte-à-goutte', ar: 'نسبة المساحة المحوّلة من الغمر إلى التنقيط' },
    unit: '%', min: 0, max: 100, default: 0, step: 5,
    emoji: '💧', color: '#0284c7',
  },
  {
    id: 'tree_planting',
    label: { en: 'Tree planting (agroforestry)', fr: 'Plantation d\'arbres', ar: 'زراعة الأشجار' },
    description: { en: 'Trees planted per hectare (windbreaks, shade, fruit)', fr: 'Arbres par hectare (brise-vent, ombrage)', ar: 'أشجار لكل هكتار' },
    unit: 'trees/ha', min: 0, max: 100, default: 0, step: 5,
    emoji: '🌳', color: '#15803d',
  },
  {
    id: 'solar_pump',
    label: { en: 'Solar pump adoption', fr: 'Pompe solaire', ar: 'مضخة شمسية' },
    description: { en: '% of pumping energy from solar vs diesel/grid', fr: '% d\'énergie de pompage solaire', ar: 'نسبة طاقة الضخ الشمسية' },
    unit: '%', min: 0, max: 100, default: 0, step: 5,
    emoji: '☀️', color: '#f97316',
  },
  {
    id: 'nitrogen_reduction',
    label: { en: 'Nitrogen fertilizer reduction', fr: 'Réduction d\'azote', ar: 'تقليل سماد النيتروجين' },
    description: { en: '% reduction in N fertilizer via precision application', fr: '% de réduction d\'azote (precision)', ar: 'نسبة تقليل النيتروجين' },
    unit: '%', min: 0, max: 50, default: 0, step: 5,
    emoji: '📉', color: '#dc2626',
  },
  {
    id: 'residue_retention',
    label: { en: 'Crop residue retention', fr: 'Rétention des résidus', ar: 'الاحتفاظ بمخلفات المحصول' },
    description: { en: '% of crop residue retained (no burning)', fr: '% de résidus conservés (sans brûlage)', ar: 'نسبة المخلفات المحتفظ بها' },
    unit: '%', min: 0, max: 100, default: 0, step: 5,
    emoji: '🌾', color: '#84cc16',
  },
];

// ============================================================================
// Emission factors (IPCC + FAO)
// ============================================================================

// Baseline emissions per hectare (Algerian averages, tCO₂e/ha/yr)
const BASELINE_N2O_PER_KG_N = 0.01;      // tCO₂e per kg N applied (IPCC)
const BASELINE_DIESEL_CO2_PER_L = 0.00267; // tCO₂ per liter diesel
const BASELINE_RESIDUE_BURN_CO2 = 0.3;     // tCO₂e/ha per burn event
const BASELINE_SOIL_CO2_LOSS = 0.5;       // tCO₂e/ha/yr from conventional tillage

// Sequestration rates (tCO₂e/ha/yr)
const SEQ_COVER_CROP = 0.8;       // per ha of cover crop
const SEQ_REDUCED_TILL = 0.3;     // per ha of reduced tillage
const SEQ_ORGANIC_PER_T = 0.1;    // per tonne compost/manure
const SEQ_TREE_PER_TREE = 0.022;  // per tree per year (averaged)

// Water savings (m³/ha/yr)
const WATER_SAVINGS_DRIP = 2000;  // m³/ha saved by drip vs flood

// Cost factors (DZD)
const DZD_PER_KG_N = 70;           // cost of 1 kg N fertilizer
const DZD_PER_L_DIESEL = 45;      // diesel price
const DZD_PER_M3_WATER = 5;       // water cost
const DZD_PER_T_COMPOST = 2000;   // compost cost
const DZD_PER_TREE = 100;         // tree planting cost (one-time, amortized)
const DZD_SOLAR_SAVINGS_PER_PCT = 500; // DZD/yr saved per 1% solar pump adoption
const DZD_PER_TCO2_CREDIT = 1500;  // carbon credit value (DZD per tCO₂e)

// ============================================================================
// Simulation
// ============================================================================

export interface ScenarioState {
  cover_crop: number;
  reduced_tillage: number;
  organic_amendment: number;
  drip_irrigation: number;
  tree_planting: number;
  solar_pump: number;
  nitrogen_reduction: number;
  residue_retention: number;
}

export interface ScenarioResult {
  // Emissions
  baselineEmissions: number;       // tCO₂e/yr
  scenarioEmissions: number;       // tCO₂e/yr
  emissionReduction: number;      // tCO₂e/yr
  emissionReductionPct: number;    // %

  // Sequestration
  sequestrationPotential: number;  // tCO₂e/yr
  netCarbonBalance: number;        // tCO₂e/yr (negative = carbon sink)

  // Water
  waterSavings: number;            // m³/yr

  // Soil health
  soilOMImprovement: number;       // % over 10 years

  // Economics
  nitrogenSavingsDZD: number;      // DZD/yr
  dieselSavingsDZD: number;        // DZD/yr
  waterSavingsDZD: number;         // DZD/yr
  compostCostDZD: number;          // DZD/yr
  treeCostDZD: number;             // DZD/yr
  solarSavingsDZD: number;         // DZD/yr
  carbonCreditRevenue: number;     // DZD/yr
  netDZD: number;                  // DZD/yr (positive = net savings)

  // Trajectory (10-year projection)
  trajectory: { year: number; baseline: number; scenario: number }[];
}

export const DEFAULT_SCENARIO: ScenarioState = {
  cover_crop: 0,
  reduced_tillage: 0,
  organic_amendment: 0,
  drip_irrigation: 0,
  tree_planting: 0,
  solar_pump: 0,
  nitrogen_reduction: 0,
  residue_retention: 0,
};

/**
 * Run the climate scenario simulation.
 *
 * @param state — lever positions (0 = no action, max = full adoption)
 * @param areaHa — farm area in hectares
 * @param baselineN — baseline N application (kg/ha/yr)
 * @param baselineDiesel — baseline diesel use (L/yr)
 */
export function simulateScenario(
  state: ScenarioState,
  areaHa: number = 5,
  baselineN: number = 120,
  baselineDiesel: number = 2000,
): ScenarioResult {
  // === BASELINE EMISSIONS ===
  const baselineN2O = baselineN * areaHa * BASELINE_N2O_PER_KG_N;     // tCO₂e
  const baselineDieselEmissions = baselineDiesel * BASELINE_DIESEL_CO2_PER_L;
  const baselineResidueBurn = areaHa * BASELINE_RESIDUE_BURN_CO2 * 0.5; // assume 50% burn
  const baselineSoilLoss = areaHa * BASELINE_SOIL_CO2_LOSS;
  const baselineEmissions = baselineN2O + baselineDieselEmissions + baselineResidueBurn + baselineSoilLoss;

  // === SCENARIO EMISSIONS ===
  // N₂O reduction
  const nReduction = (state.nitrogen_reduction / 100) * baselineN * areaHa;
  const scenarioN2O = baselineN2O - nReduction * BASELINE_N2O_PER_KG_N;

  // Diesel reduction from solar pump
  const dieselSaved = (state.solar_pump / 100) * baselineDiesel * 0.3; // 30% of diesel is pumping
  const scenarioDieselEmissions = (baselineDiesel - dieselSaved) * BASELINE_DIESEL_CO2_PER_L;

  // Residue burn reduction
  const scenarioResidueBurn = baselineResidueBurn * (1 - state.residue_retention / 100);

  // Soil carbon loss reduction from reduced tillage
  const scenarioSoilLoss = baselineSoilLoss * (1 - state.reduced_tillage / 100);

  const scenarioEmissions = scenarioN2O + scenarioDieselEmissions + scenarioResidueBurn + scenarioSoilLoss;
  const emissionReduction = baselineEmissions - scenarioEmissions;
  const emissionReductionPct = baselineEmissions > 0 ? (emissionReduction / baselineEmissions) * 100 : 0;

  // === SEQUESTRATION ===
  const seqCoverCrop = (state.cover_crop / 100) * areaHa * SEQ_COVER_CROP;
  const seqReducedTill = (state.reduced_tillage / 100) * areaHa * SEQ_REDUCED_TILL;
  const seqOrganic = state.organic_amendment * areaHa * SEQ_ORGANIC_PER_T;
  const seqTrees = state.tree_planting * areaHa * SEQ_TREE_PER_TREE;
  const sequestrationPotential = seqCoverCrop + seqReducedTill + seqOrganic + seqTrees;
  const netCarbonBalance = scenarioEmissions - sequestrationPotential;

  // === WATER SAVINGS ===
  const waterSavings = (state.drip_irrigation / 100) * areaHa * WATER_SAVINGS_DRIP;

  // === SOIL HEALTH ===
  // Cover crops + organic amendment + reduced tillage → SOM increase
  const somCoverCrop = (state.cover_crop / 100) * 0.05;  // 0.05% per year per 100% adoption
  const somOrganic = state.organic_amendment * 0.02;     // 0.02% per t/ha
  const somReducedTill = (state.reduced_tillage / 100) * 0.03;
  const annualSOMIncrease = somCoverCrop + somOrganic + somReducedTill;
  const soilOMImprovement = annualSOMIncrease * 10; // 10-year projection

  // === ECONOMICS ===
  const nitrogenSavingsDZD = nReduction * DZD_PER_KG_N;
  const dieselSavingsDZD = dieselSaved * DZD_PER_L_DIESEL;
  const waterSavingsDZD = waterSavings * DZD_PER_M3_WATER;
  const compostCostDZD = state.organic_amendment * areaHa * DZD_PER_T_COMPOST;
  const treeCostDZD = state.tree_planting * areaHa * DZD_PER_TREE;
  const solarSavingsDZD = (state.solar_pump / 100) * DZD_SOLAR_SAVINGS_PER_PCT * areaHa;
  const carbonCreditRevenue = sequestrationPotential * DZD_PER_TCO2_CREDIT;

  const totalSavings = nitrogenSavingsDZD + dieselSavingsDZD + waterSavingsDZD + solarSavingsDZD + carbonCreditRevenue;
  const totalCosts = compostCostDZD + treeCostDZD;
  const netDZD = totalSavings - totalCosts;

  // === 10-YEAR TRAJECTORY ===
  const trajectory: { year: number; baseline: number; scenario: number }[] = [];
  let cumulativeBaseline = 0;
  let cumulativeScenario = 0;

  for (let year = 0; year <= 10; year++) {
    trajectory.push({
      year,
      baseline: cumulativeBaseline,
      scenario: cumulativeScenario,
    });
    // Each year adds to cumulative emissions (minus sequestration for scenario)
    cumulativeBaseline += baselineEmissions;
    cumulativeScenario += Math.max(0, scenarioEmissions - sequestrationPotential);
  }

  return {
    baselineEmissions,
    scenarioEmissions,
    emissionReduction,
    emissionReductionPct,
    sequestrationPotential,
    netCarbonBalance,
    waterSavings,
    soilOMImprovement,
    nitrogenSavingsDZD,
    dieselSavingsDZD,
    waterSavingsDZD,
    compostCostDZD,
    treeCostDZD,
    solarSavingsDZD,
    carbonCreditRevenue,
    netDZD,
    trajectory,
  };
}

/**
 * Generate a shareable URL for the current scenario.
 * Encodes lever values in the URL hash.
 */
export function generateScenarioURL(state: ScenarioState): string {
  const params = Object.entries(state)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return `${window.location.origin}/app?scenario=${btoa(params)}`;
}
