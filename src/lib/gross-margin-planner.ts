import { CATEGORY_META, type FinancialEntry } from '@/lib/financial-store';

export interface GrossMarginScenarioInput {
  id: string;
  crop: string;
  areaHa: number;
  expectedYieldTPerHa: number;
  expectedPricePerT: number;
  variableCostPerHa: number;
  fixedCostPerHa: number;
  otherRevenuePerHa: number;
  actualYieldTPerHa?: number;
  actualPricePerT?: number;
}

export interface GrossMarginSensitivity {
  label: 'yieldDown' | 'priceDown' | 'costUp' | 'yieldUp' | 'priceUp';
  grossMarginPerHa: number;
  deltaPerHa: number;
}

export interface GrossMarginScenarioResult {
  id: string;
  crop: string;
  areaHa: number;
  totalCostPerHa: number;
  totalCost: number;
  revenuePerHa: number;
  totalRevenue: number;
  grossMarginPerHa: number;
  totalGrossMargin: number;
  marginPct: number;
  roiPct: number;
  breakEvenYieldTPerHa: number;
  breakEvenPricePerT: number;
  costPerTonne: number;
  status: 'profitable' | 'breakEven' | 'loss';
  actualGrossMarginPerHa: number | null;
  budgetVariancePerHa: number | null;
  sensitivity: GrossMarginSensitivity[];
}

export interface GrossMarginPortfolioResult {
  totalAreaHa: number;
  totalCost: number;
  totalRevenue: number;
  totalGrossMargin: number;
  weightedMarginPct: number;
  scenarios: GrossMarginScenarioResult[];
}

function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function marginFor(
  input: GrossMarginScenarioInput,
  yieldTPerHa = input.expectedYieldTPerHa,
  pricePerT = input.expectedPricePerT,
  costMultiplier = 1,
): number {
  const cost = (safeNumber(input.variableCostPerHa) + safeNumber(input.fixedCostPerHa)) * costMultiplier;
  const revenue = safeNumber(yieldTPerHa) * safeNumber(pricePerT) + safeNumber(input.otherRevenuePerHa);
  return revenue - cost;
}

function makeSensitivity(input: GrossMarginScenarioInput, baseMargin: number): GrossMarginSensitivity[] {
  const cases: Array<{ label: GrossMarginSensitivity['label']; margin: number }> = [
    { label: 'yieldDown', margin: marginFor(input, input.expectedYieldTPerHa * 0.9) },
    { label: 'priceDown', margin: marginFor(input, input.expectedYieldTPerHa, input.expectedPricePerT * 0.9) },
    { label: 'costUp', margin: marginFor(input, input.expectedYieldTPerHa, input.expectedPricePerT, 1.1) },
    { label: 'yieldUp', margin: marginFor(input, input.expectedYieldTPerHa * 1.1) },
    { label: 'priceUp', margin: marginFor(input, input.expectedYieldTPerHa, input.expectedPricePerT * 1.1) },
  ];
  return cases.map(({ label, margin }) => ({ label, grossMarginPerHa: margin, deltaPerHa: margin - baseMargin }));
}

export function calculateGrossMarginScenario(input: GrossMarginScenarioInput): GrossMarginScenarioResult {
  const areaHa = Math.max(0, safeNumber(input.areaHa));
  const expectedYield = Math.max(0, safeNumber(input.expectedYieldTPerHa));
  const expectedPrice = Math.max(0, safeNumber(input.expectedPricePerT));
  const totalCostPerHa = Math.max(0, safeNumber(input.variableCostPerHa) + safeNumber(input.fixedCostPerHa));
  const revenuePerHa = Math.max(0, expectedYield * expectedPrice + safeNumber(input.otherRevenuePerHa));
  const grossMarginPerHa = revenuePerHa - totalCostPerHa;
  const breakEvenYieldTPerHa = expectedPrice > 0 ? Math.max(0, (totalCostPerHa - safeNumber(input.otherRevenuePerHa)) / expectedPrice) : 0;
  const breakEvenPricePerT = expectedYield > 0 ? Math.max(0, (totalCostPerHa - safeNumber(input.otherRevenuePerHa)) / expectedYield) : 0;
  const actualYield = input.actualYieldTPerHa === undefined ? null : Math.max(0, safeNumber(input.actualYieldTPerHa));
  const actualPrice = input.actualPricePerT === undefined ? null : Math.max(0, safeNumber(input.actualPricePerT));
  const actualGrossMarginPerHa = actualYield === null || actualPrice === null
    ? null
    : actualYield * actualPrice + safeNumber(input.otherRevenuePerHa) - totalCostPerHa;

  return {
    id: input.id,
    crop: input.crop,
    areaHa,
    totalCostPerHa,
    totalCost: totalCostPerHa * areaHa,
    revenuePerHa,
    totalRevenue: revenuePerHa * areaHa,
    grossMarginPerHa,
    totalGrossMargin: grossMarginPerHa * areaHa,
    marginPct: revenuePerHa > 0 ? (grossMarginPerHa / revenuePerHa) * 100 : 0,
    roiPct: totalCostPerHa > 0 ? (grossMarginPerHa / totalCostPerHa) * 100 : 0,
    breakEvenYieldTPerHa,
    breakEvenPricePerT,
    costPerTonne: expectedYield > 0 ? totalCostPerHa / expectedYield : 0,
    status: grossMarginPerHa > 0 ? 'profitable' : grossMarginPerHa === 0 ? 'breakEven' : 'loss',
    actualGrossMarginPerHa,
    budgetVariancePerHa: actualGrossMarginPerHa === null ? null : actualGrossMarginPerHa - grossMarginPerHa,
    sensitivity: makeSensitivity(input, grossMarginPerHa),
  };
}

export function calculateGrossMarginPortfolio(inputs: GrossMarginScenarioInput[]): GrossMarginPortfolioResult {
  const scenarios = inputs.map(calculateGrossMarginScenario);
  const totalAreaHa = scenarios.reduce((sum, scenario) => sum + scenario.areaHa, 0);
  const totalCost = scenarios.reduce((sum, scenario) => sum + scenario.totalCost, 0);
  const totalRevenue = scenarios.reduce((sum, scenario) => sum + scenario.totalRevenue, 0);
  const totalGrossMargin = totalRevenue - totalCost;
  return {
    totalAreaHa,
    totalCost,
    totalRevenue,
    totalGrossMargin,
    weightedMarginPct: totalRevenue > 0 ? (totalGrossMargin / totalRevenue) * 100 : 0,
    scenarios,
  };
}

export function costPerHaFromEntries(entries: FinancialEntry[]): number {
  return entries
    .filter(entry => CATEGORY_META[entry.category]?.type === 'cost')
    .reduce((sum, entry) => sum + Math.max(0, safeNumber(entry.amount)), 0);
}

export function revenuePerHaFromEntries(entries: FinancialEntry[]): number {
  return entries
    .filter(entry => CATEGORY_META[entry.category]?.type === 'revenue')
    .reduce((sum, entry) => sum + Math.max(0, safeNumber(entry.amount)), 0);
}
