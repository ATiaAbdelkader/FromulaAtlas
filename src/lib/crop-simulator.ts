import {
  ALGERIAN_ACTIVE_MATTERS,
  PLANT_PROBLEMS,
  type ActiveMatter,
} from './algeria-phyto-data';
import {
  CROP_LIFECYCLES,
  getCropLifecycle,
} from './crop-lifecycle';
import {
  generateCropCalendar,
  type CalendarEntry,
  type CropCalendarResult,
} from './crop-calendar-generator';
import type { FinancialEntry } from './financial-store';

/** Currency used by the simulator. All figures are editable DZD references. */
export const SIMULATOR_CURRENCY = 'DZD';
export const DEFAULT_PLANTING_DATE = '2026-10-15';
export const DEFAULT_AVG_ET0 = 5;
export const DEFAULT_LABOR_RATE_DZD_PER_DAY = 2500;
export const DEFAULT_IRRIGATION_COST_DZD_PER_M3 = 18;

export type SimulatorFinancialCategory = Exclude<
  FinancialEntry['category'],
  'crop_revenue'
>;
export type SimulatorCostCategory = Exclude<
  SimulatorFinancialCategory,
  'subsidy' | 'other_revenue'
> | 'household_overhead';
export type SimulatorRevenueCategory = 'subsidy' | 'other_revenue';
export type SimulatorLineCategory = SimulatorCostCategory | SimulatorRevenueCategory;
export type LineItemBasis = 'per_ha' | 'field_total';

export interface SimulatorCostLineItem {
  id: string;
  category: SimulatorLineCategory;
  label: string;
  amount: number;
  basis: LineItemBasis;
  /** Household lines use this global allocation percentage. */
  isHouseholdOverhead?: boolean;
  note?: string;
  source?: 'default' | 'calendar' | 'phyto' | 'user';
}

export interface SimulatorPhytoSelection {
  id: string;
  /** Curated ActiveMatter id or the runtime INPV product homologation. */
  productId: string;
  productName: string;
  activeSubstance: string;
  applications: number;
  pricePerApplication: number;
  basis: LineItemBasis;
  source: 'inpv-2017' | 'curated-algeria' | 'user';
}

export interface SimulatorRiskScenario {
  id: 'market-down' | 'drought' | 'input-inflation' | 'compound-shock' | string;
  label: string;
  enabled: boolean;
  priceDeltaPct: number;
  yieldDeltaPct: number;
  costDeltaPct: number;
  explanation: string;
}

export interface SimulatorScenario {
  id: string;
  cropId: string;
  areaHa: number;
  plantingDate: string;
  irrigationSystem: 'drip' | 'sprinkler' | 'furrow' | 'rainfed';
  avgET0: number;
  expectedYieldTPerHa: number;
  expectedPricePerT: number;
  overheadAllocationPct: number;
  costs: SimulatorCostLineItem[];
  phytoProducts: SimulatorPhytoSelection[];
  risks: SimulatorRiskScenario[];
}

export interface SimulatorCropProfile {
  cropId: string;
  cropName: string;
  emoji: string;
  referencePricePerT: number;
  expectedYieldTPerHa: number;
  note: string;
}

export interface SimulatorPhytoOption {
  activeMatter: ActiveMatter;
  problemIds: string[];
  problemNames: string[];
}

export interface SimulatorCostBreakdown {
  category: SimulatorLineCategory;
  label: string;
  amount: number;
}

export interface SimulatorMarketPoint {
  id: 'pessimistic' | 'downside' | 'base' | 'upside' | 'optimistic';
  label: string;
  pricePerT: number;
  revenue: number;
  netMargin: number;
  roiPct: number;
  profitable: boolean;
}

export interface SimulatorRiskResult {
  id: string;
  label: string;
  explanation: string;
  pricePerT: number;
  yieldTPerHa: number;
  totalCost: number;
  revenue: number;
  grossMargin: number;
  netMargin: number;
  roiPct: number;
  breakEvenPricePerT: number;
  profitable: boolean;
}

export interface SimulatorResult {
  scenario: SimulatorScenario;
  cropProfile: SimulatorCropProfile;
  calendar: CropCalendarResult | null;
  laborCalendar: CalendarEntry[];
  totalSeasonLaborDays: number;
  totalSeasonIrrigationM3: number;
  totalCost: number;
  totalCostPerHa: number;
  operatingCost: number;
  operatingCostPerHa: number;
  householdOverheadCost: number;
  cropRevenue: number;
  otherRevenue: number;
  totalRevenue: number;
  totalYieldT: number;
  grossMargin: number;
  grossMarginPerHa: number;
  netMargin: number;
  netMarginPerHa: number;
  marginPct: number;
  roiPct: number;
  breakEvenPricePerT: number;
  breakEvenYieldTPerHa: number;
  costPerTonne: number;
  marketPoints: SimulatorMarketPoint[];
  riskResults: SimulatorRiskResult[];
  costBreakdown: SimulatorCostBreakdown[];
  warnings: string[];
}

interface CropPreset {
  referencePricePerT: number;
  expectedYieldTPerHa: number;
  costPreset: Partial<Record<SimulatorCostCategory, number>>;
  note: string;
}

/** Editable starting references, not official quotations. */
const CROP_PRESETS: Record<string, CropPreset> = {
  wheat: {
    referencePricePerT: 60000,
    expectedYieldTPerHa: 3,
    costPreset: { seed: 9500, fertilizer: 18000, irrigation: 3500, fuel: 10000, labor: 10000, machinery: 14000, rent: 30000, other_cost: 4500 },
    note: 'Durum/bread wheat reference aligned with OAIC purchase references; verify the current local contract price.',
  },
  barley: {
    referencePricePerT: 34000,
    expectedYieldTPerHa: 2.5,
    costPreset: { seed: 8000, fertilizer: 14000, irrigation: 3000, fuel: 9000, labor: 9000, machinery: 13000, rent: 28000, other_cost: 4000 },
    note: 'Barley reference aligned with the OAIC barley/oats purchase reference; verify the current local contract price.',
  },
  maize: {
    referencePricePerT: 55000,
    expectedYieldTPerHa: 8,
    costPreset: { seed: 28000, fertilizer: 42000, irrigation: 22000, fuel: 18000, labor: 18000, machinery: 22000, rent: 35000, other_cost: 6500 },
    note: 'Irrigated maize reference with subsidized-energy assumptions; edit water and electricity costs for the farm.',
  },
  potato: {
    referencePricePerT: 65000,
    expectedYieldTPerHa: 25,
    costPreset: { seed: 260000, fertilizer: 90000, irrigation: 40000, fuel: 26000, labor: 85000, machinery: 30000, rent: 50000, other_cost: 12000 },
    note: 'Fresh-market potato reference; price volatility and grading losses should be stress-tested.',
  },
  tomato: {
    referencePricePerT: 70000,
    expectedYieldTPerHa: 45,
    costPreset: { seed: 70000, fertilizer: 120000, irrigation: 65000, fuel: 30000, labor: 180000, machinery: 40000, rent: 60000, other_cost: 18000 },
    note: 'Open-field tomato reference; harvest labor and market grade are major uncertainty drivers.',
  },
  onion: {
    referencePricePerT: 50000,
    expectedYieldTPerHa: 30,
    costPreset: { seed: 45000, fertilizer: 75000, irrigation: 45000, fuel: 25000, labor: 95000, machinery: 28000, rent: 50000, other_cost: 12000 },
    note: 'Onion reference with storage/market timing risk left for user adjustments.',
  },
  soybean: {
    referencePricePerT: 70000,
    expectedYieldTPerHa: 2.5,
    costPreset: { seed: 30000, fertilizer: 30000, irrigation: 18000, fuel: 14000, labor: 12000, machinery: 18000, rent: 35000, other_cost: 6000 },
    note: 'Generic oilseed reference; local buyer and water access should be confirmed.',
  },
  sunflower: {
    referencePricePerT: 80000,
    expectedYieldTPerHa: 1.8,
    costPreset: { seed: 18000, fertilizer: 24000, irrigation: 10000, fuel: 12000, labor: 10000, machinery: 16000, rent: 30000, other_cost: 5000 },
    note: 'Oilseed reference; price is a planning anchor rather than a guaranteed farm-gate quote.',
  },
  sorghum: {
    referencePricePerT: 45000,
    expectedYieldTPerHa: 4,
    costPreset: { seed: 15000, fertilizer: 24000, irrigation: 12000, fuel: 13000, labor: 11000, machinery: 16000, rent: 30000, other_cost: 5000 },
    note: 'Warm-season grain reference; irrigated and rainfed outcomes can differ materially.',
  },
  canola: {
    referencePricePerT: 85000,
    expectedYieldTPerHa: 1.8,
    costPreset: { seed: 20000, fertilizer: 30000, irrigation: 8000, fuel: 12000, labor: 11000, machinery: 16000, rent: 30000, other_cost: 5000 },
    note: 'Rapeseed reference; use a buyer-specific price before committing acreage.',
  },
  alfalfa: {
    referencePricePerT: 45000,
    expectedYieldTPerHa: 10,
    costPreset: { seed: 30000, fertilizer: 30000, irrigation: 45000, fuel: 17000, labor: 30000, machinery: 22000, rent: 35000, other_cost: 7000 },
    note: 'Perennial forage reference; model several cuts and local hay quality separately when needed.',
  },
};

const GENERIC_PRESET: CropPreset = {
  referencePricePerT: 50000,
  expectedYieldTPerHa: 4,
  costPreset: { seed: 25000, fertilizer: 35000, irrigation: 18000, fuel: 15000, labor: 25000, machinery: 20000, rent: 35000, other_cost: 8000 },
  note: 'Generic planning reference. Replace the price and input assumptions with a local buyer or supplier quote.',
};

const CATEGORY_LABELS: Record<SimulatorLineCategory, string> = {
  seed: 'Seed / planting material',
  fertilizer: 'Fertilizer and amendments',
  crop_protection: 'Crop protection',
  irrigation: 'Water and irrigation',
  fuel: 'Fuel and energy',
  labor: 'Labor',
  rent: 'Land rent',
  machinery: 'Machinery and equipment',
  other_cost: 'Other field costs',
  household_overhead: 'Allocated household overhead',
  subsidy: 'Subsidy',
  other_revenue: 'Other revenue',
};

const CROP_PHYTO_ALIASES: Record<string, string[]> = {
  wheat: ['wheat'], barley: ['barley', 'wheat', 'oats'], maize: ['maize', 'corn'],
  potato: ['potato'], tomato: ['tomato'], 'bell-pepper': ['pepper', 'bell-pepper'],
  cucumber: ['cucumber', 'cucurbits'], onion: ['onion'], lettuce: ['lettuce'],
  alfalfa: ['alfalfa', 'luzerne'], sorghum: ['sorghum', 'sorgho'], canola: ['canola', 'colza'],
  sunflower: ['sunflower', 'tournesol'], grapes: ['vine', 'vigne'], citrus: ['citrus', 'agrumes'],
  apple: ['apple', 'pommier'], soybean: ['soybean'], chickpea: ['chickpea', 'legumes'],
};

const RISK_DEFAULTS: SimulatorRiskScenario[] = [
  { id: 'market-down', label: 'Market price drop', enabled: true, priceDeltaPct: -20, yieldDeltaPct: 0, costDeltaPct: 0, explanation: 'Farm-gate price falls before sale while yield and input costs stay unchanged.' },
  { id: 'drought', label: 'Drought / climate shock', enabled: true, priceDeltaPct: 0, yieldDeltaPct: -30, costDeltaPct: 5, explanation: 'Water stress reduces saleable yield and adds a small resilience cost for pumping, replanting, or scouting.' },
  { id: 'input-inflation', label: 'Input cost increase', enabled: true, priceDeltaPct: 0, yieldDeltaPct: 0, costDeltaPct: 15, explanation: 'Seed, fertilizer, protection, labor, energy, rent, and overhead costs rise together.' },
  { id: 'compound-shock', label: 'Compound bad season', enabled: false, priceDeltaPct: -20, yieldDeltaPct: -35, costDeltaPct: 20, explanation: 'A severe season combines a lower market price, climate-related yield loss, and higher production costs.' },
];

function safeNumber(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

function positive(value: number): number {
  return Math.max(0, safeNumber(value));
}

function cropAliases(cropId: string): string[] {
  return CROP_PHYTO_ALIASES[cropId] ?? [cropId];
}

function lineItemAmount(item: SimulatorCostLineItem, areaHa: number, overheadAllocationPct: number): number {
  const base = positive(item.amount) * (item.basis === 'per_ha' ? areaHa : 1);
  if (item.category === 'household_overhead' || item.isHouseholdOverhead) {
    return base * Math.min(100, Math.max(0, positive(overheadAllocationPct))) / 100;
  }
  return base;
}

function revenueLineAmount(item: SimulatorCostLineItem, areaHa: number): number {
  return positive(item.amount) * (item.basis === 'per_ha' ? areaHa : 1);
}

function phytoAmount(item: SimulatorPhytoSelection, areaHa: number): number {
  return positive(item.pricePerApplication) * positive(item.applications) * (item.basis === 'per_ha' ? areaHa : 1);
}

function defaultCalendarForScenario(scenario: Pick<SimulatorScenario, 'cropId' | 'plantingDate' | 'areaHa' | 'irrigationSystem' | 'avgET0'>): CropCalendarResult | null {
  return generateCropCalendar({
    cropId: scenario.cropId,
    plantingDate: scenario.plantingDate,
    area: positive(scenario.areaHa),
    irrigationSystem: scenario.irrigationSystem,
    avgET0: positive(scenario.avgET0) || DEFAULT_AVG_ET0,
  });
}

export function getSimulatorCropProfile(cropId: string): SimulatorCropProfile {
  const crop = getCropLifecycle(cropId) ?? CROP_LIFECYCLES[0];
  const preset = CROP_PRESETS[cropId] ?? GENERIC_PRESET;
  return {
    cropId: crop.id,
    cropName: crop.name,
    emoji: crop.emoji,
    referencePricePerT: preset.referencePricePerT,
    expectedYieldTPerHa: preset.expectedYieldTPerHa,
    note: preset.note,
  };
}

export function getSimulatorCropProfiles(): SimulatorCropProfile[] {
  return CROP_LIFECYCLES.map((crop) => getSimulatorCropProfile(crop.id));
}

/** Returns active matters linked to plant problems affecting the selected crop. */
export function getPhytoOptionsForCrop(cropId: string): SimulatorPhytoOption[] {
  const aliases = cropAliases(cropId);
  const problems = PLANT_PROBLEMS.filter((problem) => problem.crops.some((crop) => aliases.includes(crop)));
  const problemIds = new Set(problems.map((problem) => problem.id));
  const activeIds = new Set(problems.flatMap((problem) => problem.actives));

  return ALGERIAN_ACTIVE_MATTERS
    .filter((matter) => activeIds.has(matter.id) || matter.crops.some((crop) => aliases.includes(crop)) || matter.targets.some((target) => problemIds.has(target)))
    .map((activeMatter) => {
      const linkedProblems = problems.filter((problem) => problem.actives.includes(activeMatter.id));
      return {
        activeMatter,
        problemIds: linkedProblems.map((problem) => problem.id),
        problemNames: linkedProblems.map((problem) => problem.name),
      };
    });
}

export function getSimulatorCategoryLabel(category: SimulatorLineCategory): string {
  return CATEGORY_LABELS[category];
}

export function getDefaultRiskScenarios(): SimulatorRiskScenario[] {
  return RISK_DEFAULTS.map((risk) => ({ ...risk }));
}

export function createDefaultSimulatorScenario(
  cropId = 'wheat',
  plantingDate = DEFAULT_PLANTING_DATE,
  areaHa = 1,
): SimulatorScenario {
  const profile = getSimulatorCropProfile(cropId);
  const area = positive(areaHa) || 1;
  const calendar = defaultCalendarForScenario({
    cropId: profile.cropId,
    plantingDate,
    areaHa: area,
    irrigationSystem: 'rainfed',
    avgET0: DEFAULT_AVG_ET0,
  });
  const preset = CROP_PRESETS[profile.cropId] ?? GENERIC_PRESET;
  const laborPerHa = calendar && area > 0
    ? (calendar.totalSeason.laborDays / area) * DEFAULT_LABOR_RATE_DZD_PER_DAY
    : preset.costPreset.labor ?? 0;
  const irrigationPerHa = calendar && area > 0
    ? (calendar.totalSeason.irrigationM3 / area) * DEFAULT_IRRIGATION_COST_DZD_PER_M3
    : preset.costPreset.irrigation ?? 0;

  const costOrder: SimulatorCostCategory[] = ['seed', 'fertilizer', 'irrigation', 'fuel', 'labor', 'machinery', 'rent', 'other_cost'];
  const costs = costOrder.map((category) => ({
    id: `default-${category}`,
    category,
    label: CATEGORY_LABELS[category],
    amount: category === 'labor' ? laborPerHa : category === 'irrigation' ? irrigationPerHa : (preset.costPreset[category] ?? 0),
    basis: 'per_ha' as const,
    note: category === 'irrigation'
      ? 'Calendar volume × editable DZD/m³ reference; update for your pump, well, tariff, or subsidy.'
      : category === 'labor'
        ? 'Calendar labor-days × editable DZD/day reference; edit for family or hired labor.'
        : 'Editable planning reference in DZD/ha.',
    source: category === 'labor' || category === 'irrigation' ? 'calendar' as const : 'default' as const,
  }));

  return {
    id: `sim-${profile.cropId}`,
    cropId: profile.cropId,
    areaHa: area,
    plantingDate,
    irrigationSystem: 'rainfed',
    avgET0: DEFAULT_AVG_ET0,
    expectedYieldTPerHa: profile.expectedYieldTPerHa,
    expectedPricePerT: profile.referencePricePerT,
    overheadAllocationPct: 10,
    costs,
    phytoProducts: [],
    risks: getDefaultRiskScenarios(),
  };
}

function calculateForFactors(
  scenario: SimulatorScenario,
  base: {
    totalCost: number;
    operatingCost: number;
    householdOverheadCost: number;
    otherRevenue: number;
    areaHa: number;
  },
  yieldTPerHa: number,
  pricePerT: number,
  costMultiplier: number,
): Omit<SimulatorRiskResult, 'id' | 'label' | 'explanation'> {
  const areaHa = base.areaHa;
  const totalCost = base.totalCost * costMultiplier;
  const operatingCost = base.operatingCost * costMultiplier;
  const householdOverheadCost = base.householdOverheadCost * costMultiplier;
  const cropRevenue = positive(yieldTPerHa) * areaHa * positive(pricePerT);
  const revenue = cropRevenue + base.otherRevenue;
  const grossMargin = revenue - operatingCost;
  const netMargin = revenue - totalCost;
  const breakEvenPricePerT = positive(yieldTPerHa) * areaHa > 0
    ? Math.max(0, (totalCost - base.otherRevenue) / (positive(yieldTPerHa) * areaHa))
    : 0;
  return {
    pricePerT: positive(pricePerT),
    yieldTPerHa: positive(yieldTPerHa),
    totalCost,
    revenue,
    grossMargin,
    netMargin,
    roiPct: totalCost > 0 ? (netMargin / totalCost) * 100 : 0,
    breakEvenPricePerT,
    profitable: netMargin > 0,
  };
}

export function calculateCropSimulator(scenario: SimulatorScenario): SimulatorResult {
  const areaHa = positive(scenario.areaHa);
  const profile = getSimulatorCropProfile(scenario.cropId);
  const calendar = defaultCalendarForScenario(scenario);
  const costs = scenario.costs ?? [];
  const costBreakdown: SimulatorCostBreakdown[] = [];
  let operatingCost = 0;
  let householdOverheadCost = 0;
  let otherRevenue = 0;

  for (const item of costs) {
    const amount = item.category === 'subsidy' || item.category === 'other_revenue'
      ? revenueLineAmount(item, areaHa)
      : lineItemAmount(item, areaHa, scenario.overheadAllocationPct);
    if (amount <= 0) continue;
    costBreakdown.push({ category: item.category, label: item.label || CATEGORY_LABELS[item.category], amount });
    if (item.category === 'subsidy' || item.category === 'other_revenue') {
      otherRevenue += amount;
    } else if (item.category === 'household_overhead' || item.isHouseholdOverhead) {
      householdOverheadCost += amount;
    } else {
      operatingCost += amount;
    }
  }

  const phytoTotal = (scenario.phytoProducts ?? []).reduce((sum, product) => sum + phytoAmount(product, areaHa), 0);
  if (phytoTotal > 0) {
    costBreakdown.push({ category: 'crop_protection', label: 'Selected INPV phytosanitary products', amount: phytoTotal });
    operatingCost += phytoTotal;
  }

  const totalCost = operatingCost + householdOverheadCost;
  const yieldTPerHa = positive(scenario.expectedYieldTPerHa);
  const pricePerT = positive(scenario.expectedPricePerT);
  const cropRevenue = yieldTPerHa * areaHa * pricePerT;
  const totalRevenue = cropRevenue + otherRevenue;
  const grossMargin = totalRevenue - operatingCost;
  const netMargin = totalRevenue - totalCost;
  const totalYieldT = yieldTPerHa * areaHa;
  const breakEvenPricePerT = totalYieldT > 0 ? Math.max(0, (totalCost - otherRevenue) / totalYieldT) : 0;
  const breakEvenYieldTPerHa = pricePerT > 0 && areaHa > 0 ? Math.max(0, (totalCost - otherRevenue) / pricePerT / areaHa) : 0;

  const marketCases: Array<SimulatorMarketPoint['id']> = ['pessimistic', 'downside', 'base', 'upside', 'optimistic'];
  const marketDelta: Record<SimulatorMarketPoint['id'], number> = {
    pessimistic: -30,
    downside: -15,
    base: 0,
    upside: 15,
    optimistic: 30,
  };
  const marketPoints = marketCases.map((id) => {
    const values = calculateForFactors(scenario, { totalCost, operatingCost, householdOverheadCost, otherRevenue, areaHa }, yieldTPerHa, pricePerT * (1 + marketDelta[id] / 100), 1);
    return { id, label: id, ...values };
  });

  const riskResults = (scenario.risks ?? []).filter((risk) => risk.enabled).map((risk) => {
    const values = calculateForFactors(
      scenario,
      { totalCost, operatingCost, householdOverheadCost, otherRevenue, areaHa },
      yieldTPerHa * (1 + safeNumber(risk.yieldDeltaPct) / 100),
      pricePerT * (1 + safeNumber(risk.priceDeltaPct) / 100),
      Math.max(0, 1 + safeNumber(risk.costDeltaPct) / 100),
    );
    return { id: risk.id, label: risk.label, explanation: risk.explanation, ...values };
  });

  const warnings: string[] = [];
  if (!calendar) warnings.push('The selected crop has no lifecycle calendar, so labor and irrigation estimates remain user-entered.');
  if (scenario.irrigationSystem === 'rainfed') warnings.push('Rainfed mode exposes the scenario to rainfall variability; compare it with a supplemental-irrigation case.');
  if (scenario.overheadAllocationPct > 25) warnings.push('Household overhead allocation is above 25%; confirm that the field is carrying a fair share of shared expenses.');
  if (netMargin < 0) warnings.push('The base case is loss-making after allocated overhead; the break-even price is the minimum target before negotiation and losses.');
  if (scenario.expectedYieldTPerHa <= 0 || scenario.expectedPricePerT <= 0) warnings.push('Enter a positive yield and selling price to interpret profitability and break-even results.');

  return {
    scenario,
    cropProfile: profile,
    calendar,
    laborCalendar: calendar?.weeks ?? [],
    totalSeasonLaborDays: calendar?.totalSeason.laborDays ?? 0,
    totalSeasonIrrigationM3: calendar?.totalSeason.irrigationM3 ?? 0,
    totalCost,
    totalCostPerHa: areaHa > 0 ? totalCost / areaHa : 0,
    operatingCost,
    operatingCostPerHa: areaHa > 0 ? operatingCost / areaHa : 0,
    householdOverheadCost,
    cropRevenue,
    otherRevenue,
    totalRevenue,
    totalYieldT,
    grossMargin,
    grossMarginPerHa: areaHa > 0 ? grossMargin / areaHa : 0,
    netMargin,
    netMarginPerHa: areaHa > 0 ? netMargin / areaHa : 0,
    marginPct: totalRevenue > 0 ? (netMargin / totalRevenue) * 100 : 0,
    roiPct: totalCost > 0 ? (netMargin / totalCost) * 100 : 0,
    breakEvenPricePerT,
    breakEvenYieldTPerHa,
    costPerTonne: totalYieldT > 0 ? totalCost / totalYieldT : 0,
    marketPoints,
    riskResults,
    costBreakdown,
    warnings,
  };
}

export function formatSimulatorDzd(value: number): string {
  return `${Math.round(safeNumber(value)).toLocaleString('fr-DZ')} DZD`;
}

export function formatSimulatorNumber(value: number, fractionDigits = 1): string {
  return safeNumber(value).toLocaleString('fr-DZ', { maximumFractionDigits: fractionDigits });
}

export function categoryIsRevenue(category: SimulatorLineCategory): boolean {
  return category === 'subsidy' || category === 'other_revenue';
}

export function categoryIsCost(category: SimulatorLineCategory): boolean {
  return !categoryIsRevenue(category);
}

export const SIMULATOR_COST_CATEGORIES: SimulatorCostCategory[] = [
  'seed', 'fertilizer', 'crop_protection', 'irrigation', 'fuel', 'labor', 'rent', 'machinery', 'other_cost', 'household_overhead',
];

export const SIMULATOR_REVENUE_CATEGORIES: SimulatorRevenueCategory[] = ['subsidy', 'other_revenue'];

export { ALGERIAN_ACTIVE_MATTERS, PLANT_PROBLEMS };
