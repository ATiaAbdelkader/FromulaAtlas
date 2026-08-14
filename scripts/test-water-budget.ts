import assert from 'node:assert/strict';
import { calculateWaterBudget } from '../src/lib/water-budget';

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
  areaHa: 2,
  dailyEt0Mm: [5, 5, 5],
  dailyRainMm: [0, 0, 0],
  kc: 1.1,
  irrigationAppliedGrossMm: 0,
  systemEfficiencyPct: 80,
  rootZoneAvailableWaterMm: 120,
  initialDepletionPct: 20,
  allowedDepletionPct: 50,
  effectiveRainPct: 80,
};

test('calculates ETc from the supplied reference ET and crop coefficient', () => {
  const result = calculateWaterBudget(base);
  assert.equal(result.totalEt0Mm, 15);
  assert.equal(result.totalEtcMm, 16.5);
  assert.equal(result.netCropDemandMm, 16.5);
});

test('credits effective rainfall before calculating net crop demand', () => {
  const result = calculateWaterBudget({ ...base, dailyRainMm: [10, 0, 0], effectiveRainPct: 50 });
  assert.equal(result.totalEffectiveRainMm, 5);
  assert.equal(result.netCropDemandMm, 11.5);
});

test('converts net irrigation depth to gross depth using system efficiency', () => {
  const result = calculateWaterBudget({ ...base, dailyRainMm: [0, 0, 0], systemEfficiencyPct: 50 });
  assert.equal(result.grossIrrigationNeedMm, 33);
  assert.equal(result.grossVolumeM3, 660);
});

test('scales total irrigation volume by field area while keeping depth constant', () => {
  const oneHa = calculateWaterBudget({ ...base, areaHa: 1 });
  const fourHa = calculateWaterBudget({ ...base, areaHa: 4 });
  assert.equal(fourHa.grossIrrigationNeedMm, oneHa.grossIrrigationNeedMm);
  assert.equal(fourHa.grossVolumeM3, oneHa.grossVolumeM3 * 4);
});

test('triggers staged irrigation when depletion crosses the allowed threshold', () => {
  const result = calculateWaterBudget({ ...base, rootZoneAvailableWaterMm: 40, initialDepletionPct: 45, allowedDepletionPct: 50 });
  assert.ok(result.days.some(day => day.shouldIrrigate));
  assert.ok(result.days.some(day => day.recommendedGrossIrrigationMm > 0));
  assert.ok(result.days.every(day => day.depletionAfterRecommendationMm <= result.allowedDepletionMm + 0.01));
});

test('accounts for applied water when reporting additional volume', () => {
  const withoutApplied = calculateWaterBudget(base);
  const withApplied = calculateWaterBudget({ ...base, irrigationAppliedGrossMm: withoutApplied.grossIrrigationNeedMm });
  assert.equal(withApplied.additionalGrossNeedMm, 0);
  assert.equal(withApplied.additionalVolumeM3, 0);
});

test('flags low efficiency, high depletion, and missing soil-water inputs', () => {
  const result = calculateWaterBudget({ ...base, areaHa: 0, systemEfficiencyPct: 60, rootZoneAvailableWaterMm: 0, allowedDepletionPct: 70 });
  assert.ok(result.warnings.some(warning => warning.includes('positive field area')));
  assert.ok(result.warnings.some(warning => warning.includes('root-zone available water')));
  assert.ok(result.warnings.some(warning => warning.includes('Low system efficiency')));
  assert.ok(result.warnings.some(warning => warning.includes('high allowable-depletion')));
});

test('handles different ET and rainfall series lengths by repeating the last value', () => {
  const result = calculateWaterBudget({ ...base, dailyEt0Mm: [4, 5], dailyRainMm: [0] });
  assert.equal(result.days.length, 2);
  assert.equal(result.days[1].et0Mm, 5);
  assert.equal(result.days[1].rainfallMm, 0);
});

console.log(`\n${passed} water-budget domain tests passed.`);
