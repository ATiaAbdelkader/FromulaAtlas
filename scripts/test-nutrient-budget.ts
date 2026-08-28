import assert from 'node:assert/strict';
import { calculateNutrientBudget } from '../src/lib/nutrient-budget';

let passed = 0;
function test(name: string, run: () => void) {
  try {
    run();
    passed += 1;
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

const base = {
  cropId: 'maize',
  areaHa: 2,
  plantingDate: '2026-04-01',
  yieldAdjustmentPct: 100,
  organicMatterPct: 2,
  cec: 15,
  ph: 6.5,
  soilPppm: 25,
  soilKMeq: 0.4,
  manureType: 'none' as const,
  manureRateTHa: 0,
  incorporation: 'immediate' as const,
  slopePct: 3,
  nearestWaterM: 50,
};

test('returns no plan for an unknown crop', () => {
  assert.equal(calculateNutrientBudget({ ...base, cropId: 'unknown-crop' }), null);
});

test('calculates established soil organic-matter and potassium planning credits', () => {
  const plan = calculateNutrientBudget(base);
  assert.ok(plan);
  assert.equal(plan.soilNCredit, 100);
  assert.equal(plan.soilKCredit, 140);
  assert.equal(plan.credits.n, 100);
  assert.equal(plan.credits.p, 0);
  assert.equal(plan.credits.k, 140);
  assert.equal(plan.remaining.n, Math.max(0, plan.target.n - 100));
  assert.equal(plan.remaining.k, Math.max(0, plan.target.k - 140));
});

test('scales crop targets and field totals independently', () => {
  const fullPlan = calculateNutrientBudget({ ...base, organicMatterPct: 0, soilKMeq: 0 });
  const halfPlan = calculateNutrientBudget({ ...base, organicMatterPct: 0, soilKMeq: 0, yieldAdjustmentPct: 50 });
  assert.ok(fullPlan && halfPlan);
  assert.equal(halfPlan.target.n, fullPlan.target.n / 2);
  assert.equal(halfPlan.target.p, fullPlan.target.p / 2);
  assert.equal(halfPlan.totalRemaining.n, halfPlan.remaining.n * 2);
  assert.equal(halfPlan.totalRemaining.p, halfPlan.remaining.p * 2);
  assert.equal(halfPlan.totalRemaining.k, halfPlan.remaining.k * 2);
});

test('credits poultry manure by first-year availability and incorporation timing', () => {
  const plan = calculateNutrientBudget({
    ...base,
    organicMatterPct: 0,
    soilKMeq: 0,
    manureType: 'poultry',
    manureRateTHa: 10,
    incorporation: 'immediate',
  });
  assert.ok(plan);
  assert.equal(plan.manureTotal.n, 300);
  assert.equal(plan.manureTotal.p, 250);
  assert.equal(plan.manureTotal.k, 150);
  assert.equal(plan.manureNAvailabilityPct, 40);
  assert.equal(plan.manureCredit.n, 120);
  assert.equal(plan.manureCredit.p, 150);
  assert.equal(plan.manureCredit.k, 135);
});

test('reduces first-year manure nitrogen credit when material is not incorporated', () => {
  const immediate = calculateNutrientBudget({ ...base, organicMatterPct: 0, soilKMeq: 0, manureType: 'dairy_solid', manureRateTHa: 10, incorporation: 'immediate' });
  const surface = calculateNutrientBudget({ ...base, organicMatterPct: 0, soilKMeq: 0, manureType: 'dairy_solid', manureRateTHa: 10, incorporation: 'none' });
  assert.ok(immediate && surface);
  assert.ok(immediate.manureCredit.n > surface.manureCredit.n);
  assert.equal(immediate.manureCredit.p, surface.manureCredit.p);
  assert.equal(immediate.manureCredit.k, surface.manureCredit.k);
});

test('uses a slope-sensitive planning waterway buffer and flags short setbacks', () => {
  const plan = calculateNutrientBudget({
    ...base,
    manureType: 'composted',
    manureRateTHa: 5,
    slopePct: 6,
    nearestWaterM: 20,
  });
  assert.ok(plan);
  assert.equal(plan.minBufferM, 30);
  assert.equal(plan.bufferCompliant, false);
  assert.ok(plan.warnings.some(warning => warning.includes('waterway distance')));
});

test('creates dated, non-negative staged applications after credits', () => {
  const plan = calculateNutrientBudget(base);
  assert.ok(plan);
  assert.ok(plan.applications.length > 0);
  assert.ok(plan.applications.every(application => application.date >= base.plantingDate));
  assert.ok(plan.applications.every(application => application.n >= 0 && application.p >= 0 && application.k >= 0));
  assert.ok(plan.applications.every(application => application.method.length > 0));
});

test('localizes dynamic safety guidance in Arabic without changing the nutrient budget', () => {
  const input = { ...base, ph: 5.2, cec: 4, manureType: 'composted' as const, manureRateTHa: 5, slopePct: 6, nearestWaterM: 20 };
  const english = calculateNutrientBudget(input);
  const arabic = calculateNutrientBudget(input, 'ar');
  assert.ok(english && arabic);
  assert.deepEqual(arabic.remaining, english.remaining);
  assert.deepEqual(arabic.credits, english.credits);
  assert.ok(arabic.warnings.some(warning => warning.includes('الرقم الهيدروجيني')));
  assert.ok(arabic.guidance.place.some(item => item.includes('منطقة العزل')));
});

console.log(`\n${passed} nutrient-budget domain tests passed.`);
