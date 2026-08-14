import assert from 'node:assert/strict';
import { calculateGrossMarginPortfolio, calculateGrossMarginScenario, costPerHaFromEntries, revenuePerHaFromEntries } from '../src/lib/gross-margin-planner';

const base = {
  id: 'maize',
  crop: 'Maize',
  areaHa: 5,
  expectedYieldTPerHa: 8,
  expectedPricePerT: 220,
  variableCostPerHa: 760,
  fixedCostPerHa: 300,
  otherRevenuePerHa: 0,
};

const profitable = calculateGrossMarginScenario(base);
assert.equal(profitable.totalCostPerHa, 1060);
assert.equal(profitable.revenuePerHa, 1760);
assert.equal(profitable.grossMarginPerHa, 700);
assert.equal(profitable.totalGrossMargin, 3500);
assert.equal(profitable.breakEvenYieldTPerHa, 4.818181818181818);
assert.equal(profitable.breakEvenPricePerT, 132.5);
assert.equal(profitable.status, 'profitable');
assert.equal(profitable.sensitivity[0].grossMarginPerHa, 524);
assert.equal(profitable.sensitivity[2].grossMarginPerHa, 594);

const loss = calculateGrossMarginScenario({ ...base, expectedPricePerT: 100 });
assert.equal(loss.status, 'loss');
assert.ok(loss.grossMarginPerHa < 0);
assert.equal(loss.breakEvenPricePerT, 132.5);

const withActual = calculateGrossMarginScenario({ ...base, actualYieldTPerHa: 7, actualPricePerT: 210 });
assert.equal(withActual.actualGrossMarginPerHa, 410);
assert.equal(withActual.budgetVariancePerHa, -290);

const portfolio = calculateGrossMarginPortfolio([base, { ...base, id: 'wheat', crop: 'Wheat', areaHa: 2, expectedYieldTPerHa: 5, expectedPricePerT: 300, variableCostPerHa: 500, fixedCostPerHa: 250 }]);
assert.equal(portfolio.totalAreaHa, 7);
assert.equal(portfolio.totalCost, 6800);
assert.equal(portfolio.totalRevenue, 11800);
assert.equal(portfolio.totalGrossMargin, 5000);
assert.equal(portfolio.scenarios.length, 2);

const entries = [
  { id: '1', category: 'fertilizer' as const, label: 'Urea', amount: 150 },
  { id: '2', category: 'labor' as const, label: 'Labor', amount: 250 },
  { id: '3', category: 'crop_revenue' as const, label: 'Sales', amount: 1_900 },
];
assert.equal(costPerHaFromEntries(entries), 400);
assert.equal(revenuePerHaFromEntries(entries), 1900);

console.log('Gross-Margin Planner tests passed: crop math, break-even, area scaling, sensitivity, variance, and finance aggregation.');
