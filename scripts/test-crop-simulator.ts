import assert from 'node:assert/strict';
import {
  calculateCropSimulator,
  createDefaultSimulatorScenario,
  getPhytoOptionsForCrop,
  getSimulatorCropProfiles,
  type SimulatorScenario,
} from '../src/lib/crop-simulator';

const defaults = createDefaultSimulatorScenario('wheat', '2026-10-15', 2);
assert.equal(defaults.cropId, 'wheat');
assert.equal(defaults.areaHa, 2);
assert.equal(defaults.expectedPricePerT, 60_000);
assert.ok(defaults.costs.some((item) => item.category === 'labor'));
assert.ok(defaults.costs.some((item) => item.category === 'irrigation'));

const scenario: SimulatorScenario = {
  ...defaults,
  costs: [
    { id: 'seed', category: 'seed', label: 'Seed', amount: 100, basis: 'per_ha' },
    { id: 'house', category: 'household_overhead', label: 'Home electricity', amount: 1_000, basis: 'field_total', isHouseholdOverhead: true },
    { id: 'subsidy', category: 'subsidy', label: 'Planning subsidy', amount: 50, basis: 'per_ha' },
  ],
  overheadAllocationPct: 20,
  phytoProducts: [{
    id: 'phyto-1',
    productId: 'demo-1',
    productName: 'Demo protection product',
    activeSubstance: 'Demo active matter',
    applications: 2,
    pricePerApplication: 300,
    basis: 'per_ha',
    source: 'user',
  }],
  expectedYieldTPerHa: 2,
  expectedPricePerT: 1_000,
  risks: [
    { id: 'market-down', label: 'Market price drop', enabled: true, priceDeltaPct: -20, yieldDeltaPct: 0, costDeltaPct: 0, explanation: 'Price falls.' },
    { id: 'drought', label: 'Drought', enabled: true, priceDeltaPct: 0, yieldDeltaPct: -30, costDeltaPct: 5, explanation: 'Yield falls.' },
  ],
};

const result = calculateCropSimulator(scenario);
assert.equal(result.calendar?.crop.id, 'wheat');
assert.ok(result.totalSeasonLaborDays > 0);
assert.ok(result.totalSeasonIrrigationM3 >= 0);
assert.equal(result.operatingCost, 1_400);
assert.equal(result.householdOverheadCost, 200);
assert.equal(result.totalCost, 1_600);
assert.equal(result.otherRevenue, 100);
assert.equal(result.cropRevenue, 4_000);
assert.equal(result.totalRevenue, 4_100);
assert.equal(result.grossMargin, 2_700);
assert.equal(result.netMargin, 2_500);
assert.equal(result.breakEvenPricePerT, 375);
assert.equal(result.breakEvenYieldTPerHa, 0.75);
assert.equal(result.costPerTonne, 400);
assert.equal(result.marketPoints.length, 5);
assert.equal(result.marketPoints.find((point) => point.id === 'base')?.netMargin, 2_500);
assert.equal(result.marketPoints.find((point) => point.id === 'pessimistic')?.netMargin, 1_300);
assert.equal(result.riskResults.length, 2);
assert.equal(result.riskResults.find((risk) => risk.id === 'market-down')?.netMargin, 1_700);
assert.equal(result.riskResults.find((risk) => risk.id === 'drought')?.totalCost, 1_680);
assert.equal(result.riskResults.find((risk) => risk.id === 'drought')?.yieldTPerHa, 1.4);
assert.equal(result.riskResults.find((risk) => risk.id === 'drought')?.breakEvenPricePerT, 564.2857142857143);

const profiles = getSimulatorCropProfiles();
assert.ok(profiles.length >= 10);
assert.ok(profiles.some((profile) => profile.cropId === 'potato'));
assert.ok(getPhytoOptionsForCrop('wheat').length >= 0);

const invalidInputs = calculateCropSimulator({ ...scenario, areaHa: 0, expectedYieldTPerHa: 0, expectedPricePerT: 0 });
assert.equal(invalidInputs.totalCost, 200);
assert.equal(invalidInputs.breakEvenPricePerT, 0);
assert.ok(invalidInputs.warnings.some((warning) => warning.includes('positive yield')));

console.log('Crop Simulator tests passed: defaults, calendar integration, editable costs, household overhead, phyto pricing, break-even, market sensitivity, and risk shocks.');
