import {
  calculateMachineryOptimizer,
  type MachineryOptimizerInput,
} from '../src/lib/machinery-field-optimizer';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertClose(actual: number, expected: number, message: string, tolerance = 0.01): void {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message}: expected ${expected}, received ${actual}`);
  }
}

const baseInput: MachineryOptimizerInput = {
  purchasePrice: 100000,
  salvageValue: 20000,
  usefulLifeYears: 10,
  annualHours: 400,
  interestRatePct: 6,
  fuelPricePerL: 1.2,
  repairRatePct: 3,
  laborCostPerHour: 15,
  hoursPerDay: 8,
  operations: [
    { id: 'tillage', name: 'Primary tillage', areaHa: 20, workRateHaPerHour: 2, fuelLPerHour: 20, customHirePerHa: 120 },
    { id: 'planting', name: 'Planting', areaHa: 20, workRateHaPerHour: 4, fuelLPerHour: 12, customHirePerHa: 55 },
  ],
};

const result = calculateMachineryOptimizer(baseInput);
assert(result.operations.length === 2, 'Expected one plan row per field operation');
assertClose(result.operations[0].requiredHours, 10, 'Tillage hours should scale from area and capacity');
assertClose(result.totalRequiredHours, 15, 'Total hours should add operation requirements');
assertClose(result.operations[0].scheduledDays, 1.25, 'Scheduled days should use configured workday length');
assert(result.annualFixedCost > 0, 'Ownership fixed cost should be positive');
assert(result.operations[0].ownedCostTotal > 0, 'Owned operation cost should include fixed and variable costs');
assert(result.operations[0].customHireTotal === 2400, 'Custom hire total should equal area times quote');
assert(result.operations[0].breakEvenHectares !== null, 'Break-even should exist when hire rate exceeds variable cost');
assert(result.operations[0].breakEvenHours !== null, 'Break-even hours should exist when break-even hectares exist');

const areaDoubled = calculateMachineryOptimizer({
  ...baseInput,
  operations: baseInput.operations.map((operation) => ({ ...operation, areaHa: operation.areaHa * 2 })),
});
assertClose(areaDoubled.totalRequiredHours, result.totalRequiredHours * 2, 'Doubling area should double required hours');
assertClose(areaDoubled.ownedCostTotal, result.ownedCostTotal * 2, 'Doubling area should double owned operation cost');
assertClose(areaDoubled.customHireTotal, result.customHireTotal * 2, 'Doubling area should double custom-hire cost');
assertClose(areaDoubled.utilizationPct, result.utilizationPct * 2, 'Doubling area should double utilization');

const underUtilized = calculateMachineryOptimizer({
  ...baseInput,
  annualHours: 2000,
      operations: baseInput.operations.map((operation) => ({ ...operation, customHirePerHa: 5 })),

});
assert(underUtilized.recommendation === 'hire', 'Low utilization and expensive ownership should recommend hire');
assert(underUtilized.warnings.some((warning) => warning.includes('Low utilization')), 'Low utilization should create a planning warning');
assert(underUtilized.warnings.some((warning) => warning.includes('Custom hire is cheaper')), 'Cheaper hire should create a planning warning');

const overCapacity = calculateMachineryOptimizer({
  ...baseInput,
  annualHours: 10,
});
assert(overCapacity.warnings.some((warning) => warning.includes('exceed annual machine-hour capacity')), 'Over-capacity plan should warn the user');

const mixed = calculateMachineryOptimizer({
  ...baseInput,
  operations: [
    { ...baseInput.operations[0], customHirePerHa: 1000 },
    { ...baseInput.operations[1], customHirePerHa: 1 },
  ],
});
assert(mixed.recommendation === 'mixed', 'Different economics by operation should support a mixed strategy');

const invalid = calculateMachineryOptimizer({
  ...baseInput,
  purchasePrice: 0,
  annualHours: 0,
  operations: [{ ...baseInput.operations[0], workRateHaPerHour: 0 }],
});
assert(invalid.warnings.some((warning) => warning.includes('positive purchase price')), 'Invalid purchase price should be guarded');
assert(invalid.warnings.some((warning) => warning.includes('positive')), 'Invalid capacity or annual hours should be guarded');

console.log('Machinery field optimizer domain tests passed: cost comparison, scheduling, break-even, utilization, recommendations, and guardrails.');
