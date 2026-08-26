export type MachineryOperationId = 'tillage' | 'planting' | 'spraying' | 'harvest';

export interface MachineryOperationInput {
  id: MachineryOperationId;
  name: string;
  areaHa: number;
  workRateHaPerHour: number;
  fuelLPerHour: number;
  customHirePerHa: number;
}

export interface MachineryOptimizerInput {
  purchasePrice: number;
  salvageValue: number;
  usefulLifeYears: number;
  annualHours: number;
  interestRatePct: number;
  fuelPricePerL: number;
  repairRatePct: number;
  laborCostPerHour: number;
  hoursPerDay: number;
  operations: MachineryOperationInput[];
}

export interface MachineryOperationPlan extends MachineryOperationInput {
  requiredHours: number;
  scheduledDays: number;
  ownershipCostPerHa: number;
  variableCostPerHa: number;
  ownedCostPerHa: number;
  ownedCostTotal: number;
  customHireTotal: number;
  savingsComparedWithHire: number;
  breakEvenHectares: number | null;
  breakEvenHours: number | null;
}

export interface MachineryOptimizerPlan {
  input: MachineryOptimizerInput;
  annualDepreciation: number;
  annualInterest: number;
  annualInsurance: number;
  annualHousing: number;
  annualFixedCost: number;
  fixedCostPerHour: number;
  repairCostPerHour: number;
  totalAreaHa: number;
  totalRequiredHours: number;
  utilizationPct: number;
  ownedCostTotal: number;
  customHireTotal: number;
  savingsComparedWithHire: number;
  recommendation: 'own' | 'hire' | 'mixed';
  warnings: string[];
  operations: MachineryOperationPlan[];
}

function nonNegative(value: number, fallback = 0): number {
  return Number.isFinite(value) ? Math.max(0, value) : fallback;
}

function positive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/**
 * Compare ownership with custom hire and schedule multiple field operations.
 * The ownership assumptions intentionally match MachineryCostCalculator so the
 * optimizer extends, rather than silently changes, the existing cost model.
 */
export function calculateMachineryOptimizer(input: MachineryOptimizerInput): MachineryOptimizerPlan {
  const purchasePrice = nonNegative(input.purchasePrice);
  const salvageValue = Math.min(nonNegative(input.salvageValue), purchasePrice);
  const usefulLifeYears = positive(input.usefulLifeYears, 1);
  const annualHours = positive(input.annualHours, 1);
  const interestRatePct = nonNegative(input.interestRatePct);
  const fuelPricePerL = nonNegative(input.fuelPricePerL);
  const repairRatePct = nonNegative(input.repairRatePct);
  const laborCostPerHour = nonNegative(input.laborCostPerHour);
  const hoursPerDay = positive(input.hoursPerDay, 8);

  const annualDepreciation = (purchasePrice - salvageValue) / usefulLifeYears;
  const annualInterest = ((purchasePrice + salvageValue) / 2) * (interestRatePct / 100);
  const annualInsurance = purchasePrice * 0.01;
  const annualHousing = purchasePrice * 0.005;
  const annualFixedCost = annualDepreciation + annualInterest + annualInsurance + annualHousing;
  const fixedCostPerHour = annualFixedCost / annualHours;
  const repairCostPerHour = (purchasePrice * (repairRatePct / 100)) / annualHours;

  const operations = input.operations.map((operation) => {
    const areaHa = nonNegative(operation.areaHa);
    const workRateHaPerHour = positive(operation.workRateHaPerHour, 0.1);
    const fuelLPerHour = nonNegative(operation.fuelLPerHour);
    const customHirePerHa = nonNegative(operation.customHirePerHa);
    const requiredHours = areaHa / workRateHaPerHour;
    const ownershipCostPerHa = fixedCostPerHour / workRateHaPerHour;
    const variableCostPerHa = ((fuelLPerHour * fuelPricePerL) + repairCostPerHour + laborCostPerHour) / workRateHaPerHour;
    const ownedCostPerHa = ownershipCostPerHa + variableCostPerHa;
    const ownedCostTotal = ownedCostPerHa * areaHa;
    const customHireTotal = customHirePerHa * areaHa;
    const savingsComparedWithHire = customHireTotal - ownedCostTotal;
    const contributionMarginPerHa = customHirePerHa - variableCostPerHa;
    const breakEvenHectares = contributionMarginPerHa > 0 ? round(annualFixedCost / contributionMarginPerHa) : null;
    const breakEvenHours = breakEvenHectares === null ? null : round(breakEvenHectares / workRateHaPerHour);

    return {
      ...operation,
      areaHa,
      workRateHaPerHour,
      fuelLPerHour,
      customHirePerHa,
      requiredHours: round(requiredHours),
      scheduledDays: round(requiredHours / hoursPerDay),
      ownershipCostPerHa: round(ownershipCostPerHa),
      variableCostPerHa: round(variableCostPerHa),
      ownedCostPerHa: round(ownedCostPerHa),
      ownedCostTotal: round(ownedCostTotal),
      customHireTotal: round(customHireTotal),
      savingsComparedWithHire: round(savingsComparedWithHire),
      breakEvenHectares,
      breakEvenHours,
    };
  });

  const totalAreaHa = operations.reduce((total, operation) => total + operation.areaHa, 0);
  const totalRequiredHours = operations.reduce((total, operation) => total + operation.requiredHours, 0);
  const ownedCostTotal = operations.reduce((total, operation) => total + operation.ownedCostTotal, 0);
  const customHireTotal = operations.reduce((total, operation) => total + operation.customHireTotal, 0);
  const savingsComparedWithHire = customHireTotal - ownedCostTotal;
  const utilizationPct = (totalRequiredHours / annualHours) * 100;
  const warnings: string[] = [];

  if (purchasePrice <= 0) warnings.push('Enter a positive purchase price to model ownership.');
  if (annualHours <= 0) warnings.push('Annual available hours must be positive.');
  if (totalRequiredHours > annualHours) warnings.push('Planned field operations exceed annual machine-hour capacity.');
  if (totalRequiredHours > 0 && utilizationPct < 25) warnings.push('Low utilization: custom hire may be safer than owning this machine.');
  if (savingsComparedWithHire < 0) warnings.push('Custom hire is cheaper than ownership for the selected operations.');
  if (operations.some((operation) => operation.workRateHaPerHour <= 0)) warnings.push('Every operation needs a positive field capacity.');

  const hasPositiveSavings = operations.some((operation) => operation.savingsComparedWithHire > 0);
  const hasNegativeSavings = operations.some((operation) => operation.savingsComparedWithHire < 0);
  const recommendation: MachineryOptimizerPlan['recommendation'] = hasPositiveSavings && hasNegativeSavings
    ? 'mixed'
    : hasPositiveSavings
      ? 'own'
      : 'hire';

  return {
    input: {
      ...input,
      purchasePrice,
      salvageValue,
      usefulLifeYears,
      annualHours,
      interestRatePct,
      fuelPricePerL,
      repairRatePct,
      laborCostPerHour,
      hoursPerDay,
      operations: operations.map(({ requiredHours: _requiredHours, scheduledDays: _scheduledDays, ownershipCostPerHa: _ownershipCostPerHa, variableCostPerHa: _variableCostPerHa, ownedCostPerHa: _ownedCostPerHa, ownedCostTotal: _ownedCostTotal, customHireTotal: _customHireTotal, savingsComparedWithHire: _savingsComparedWithHire, breakEvenHectares: _breakEvenHectares, breakEvenHours: _breakEvenHours, ...operation }) => operation),
    },
    annualDepreciation: round(annualDepreciation),
    annualInterest: round(annualInterest),
    annualInsurance: round(annualInsurance),
    annualHousing: round(annualHousing),
    annualFixedCost: round(annualFixedCost),
    fixedCostPerHour: round(fixedCostPerHour),
    repairCostPerHour: round(repairCostPerHour),
    totalAreaHa: round(totalAreaHa),
    totalRequiredHours: round(totalRequiredHours),
    utilizationPct: round(utilizationPct),
    ownedCostTotal: round(ownedCostTotal),
    customHireTotal: round(customHireTotal),
    savingsComparedWithHire: round(savingsComparedWithHire),
    recommendation,
    warnings,
    operations,
  };
}

export const DEFAULT_MACHINERY_OPERATIONS: MachineryOperationInput[] = [
  { id: 'tillage', name: 'Primary tillage', areaHa: 10, workRateHaPerHour: 1.5, fuelLPerHour: 20, customHirePerHa: 75 },
  { id: 'planting', name: 'Planting', areaHa: 10, workRateHaPerHour: 2, fuelLPerHour: 12, customHirePerHa: 55 },
  { id: 'spraying', name: 'Crop protection', areaHa: 10, workRateHaPerHour: 6, fuelLPerHour: 8, customHirePerHa: 30 },
  { id: 'harvest', name: 'Harvest', areaHa: 10, workRateHaPerHour: 1, fuelLPerHour: 35, customHirePerHa: 150 },
];
