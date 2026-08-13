import assert from 'node:assert/strict';
import { calculateSoilHealthPlan } from '../src/lib/soil-health-planner';
import { suggestRotation } from '../src/lib/rotation-data';

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
  texture: 'loam' as const,
  slopePct: 8,
  slopeLengthM: 120,
  omPercent: 2.5,
  pH: 6.8,
  tillage: 'conventional' as const,
  supportPractice: 'none' as const,
  rotation: suggestRotation('maize', 4),
};

test('calculates a finite erosion and soil-health scenario from valid inputs', () => {
  const result = calculateSoilHealthPlan(base);
  assert.ok(Number.isFinite(result.current.erosionLossTonsPerHa));
  assert.ok(result.current.erosionLossTonsPerHa > 0);
  assert.ok(result.current.erosionLossTotalTons > 0);
  assert.ok(result.current.soilHealthScore >= 0 && result.current.soilHealthScore <= 100);
  assert.equal(result.current.rotation.length, 4);
});

test('scales total erosion by area while keeping per-hectare loss constant', () => {
  const oneHa = calculateSoilHealthPlan({ ...base, areaHa: 1 });
  const fourHa = calculateSoilHealthPlan({ ...base, areaHa: 4 });
  assert.equal(fourHa.current.erosionLossTonsPerHa, oneHa.current.erosionLossTonsPerHa);
  assert.equal(fourHa.current.erosionLossTotalTons, oneHa.current.erosionLossTotalTons * 4);
});

test('reduces erosion in the recommended scenario through tillage and support changes', () => {
  const result = calculateSoilHealthPlan(base);
  assert.ok(result.recommended.erosionLossTonsPerHa < result.current.erosionLossTonsPerHa);
  assert.ok(result.erosionReductionPercent > 0);
  assert.equal(result.recommended.tillage, 'reduced');
  assert.equal(result.recommended.supportPractice, 'contour');
});

test('responds to texture, slope, and conservation practice factors', () => {
  const sandySlope = calculateSoilHealthPlan({ ...base, texture: 'sand', slopePct: 15, supportPractice: 'none' });
  const protectedClay = calculateSoilHealthPlan({ ...base, texture: 'clay', slopePct: 5, tillage: 'no-till', supportPractice: 'terrace' });
  assert.ok(sandySlope.current.erosionLossTonsPerHa > protectedClay.current.erosionLossTonsPerHa);
});

test('adds soil-health recommendations for missing cover, reduced tillage, support, and soil tests', () => {
  const result = calculateSoilHealthPlan({ ...base, omPercent: 1.2, pH: 5.1, rotation: [{ ...base.rotation[0], cropId: 'maize', year: 1 }, { ...base.rotation[1], cropId: 'wheat', year: 2 }, { ...base.rotation[2], cropId: 'rice', year: 3 }, { ...base.rotation[3], cropId: 'barley', year: 4 }] });
  assert.ok(result.current.recommendations.includes('cover-crop'));
  assert.ok(result.current.recommendations.includes('reduced-tillage'));
  assert.ok(result.current.recommendations.includes('support-practice'));
  assert.ok(result.current.recommendations.includes('rotation-diversity'));
  assert.ok(result.current.recommendations.includes('soil-test'));
  assert.ok(result.current.recommendations.includes('pH-balance'));
});

test('shows the conservation benefit of cover crops and legumes', () => {
  const result = calculateSoilHealthPlan(base);
  assert.ok(result.recommended.coverCropYears >= result.current.coverCropYears);
  assert.ok(result.recommended.organicMatterAddedTonsPerHa >= result.current.organicMatterAddedTonsPerHa);
  assert.ok(result.recommended.nitrogenCreditKgPerHa >= result.current.nitrogenCreditKgPerHa);
  assert.ok(result.soilHealthGain >= 0);
});

test('normalizes unsafe numeric inputs without producing invalid output', () => {
  const result = calculateSoilHealthPlan({ ...base, areaHa: 0, slopePct: -10, slopeLengthM: 0, omPercent: 20, pH: 20, rotation: [] });
  assert.equal(result.input.areaHa, 1);
  assert.equal(result.input.slopePct, 0.1);
  assert.equal(result.input.slopeLengthM, 100);
  assert.equal(result.input.omPercent, 12);
  assert.equal(result.input.pH, 11);
  assert.ok(result.current.rotation.length > 0);
  assert.ok(result.current.erosionLossTonsPerHa >= 0);
});

console.log(`\n${passed} soil-health-planner domain tests passed.`);
