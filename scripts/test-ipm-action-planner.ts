import assert from 'node:assert/strict';
import { calculateIpmPlan } from '../src/lib/ipm-action-planner';

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
  fieldName: 'North Field',
  crop: 'Tomato',
  targetName: 'Aphids',
  targetType: 'insect' as const,
  observedCount: 18,
  sampleCount: 10,
  actionThreshold: 2,
  unit: 'aphids/plant',
  cropValuePerHa: 2400,
  controlCostPerHa: 120,
  daysSinceScouting: 3,
  recentSeverity: 'warning' as const,
  previousModesOfAction: ['4A', '4A'],
};

test('calculates average density and threshold ratio from samples', () => {
  const result = calculateIpmPlan(base);
  assert.equal(result.averageDensity, 1.8);
  assert.equal(result.thresholdRatio, 0.9);
  assert.equal(result.thresholdStatus, 'prepare');
});

test('moves to action when the threshold is reached', () => {
  const result = calculateIpmPlan({ ...base, observedCount: 25, recentSeverity: 'info' });
  assert.equal(result.thresholdStatus, 'act');
  assert.equal(result.actionRecommended, true);
  assert.equal(result.priority, 'urgent');
  assert.ok(result.warnings.some(warning => warning.includes('threshold signal')));
});

test('critical scouting severity elevates action even below threshold', () => {
  const result = calculateIpmPlan({ ...base, observedCount: 1, recentSeverity: 'critical' });
  assert.equal(result.thresholdStatus, 'monitor');
  assert.equal(result.actionRecommended, true);
  assert.equal(result.priority, 'urgent');
});

test('flags stale scouting and recommends a new observation', () => {
  const result = calculateIpmPlan({ ...base, daysSinceScouting: 9, recentSeverity: 'info', previousModesOfAction: [] });
  assert.equal(result.scoutingDue, true);
  assert.equal(result.priority, 'watch');
  assert.ok(result.nextActions.some(action => action.includes('Scout again')));
});

test('detects repeated mode of action and requests rotation', () => {
  const result = calculateIpmPlan({ ...base, previousModesOfAction: ['3A', '3A', '3A'] });
  assert.equal(result.recentSameModeOfActionCount, 3);
  assert.equal(result.resistanceWarning, true);
  assert.ok(result.nextActions.some(action => action.includes('Rotate away')));
  assert.ok(result.warnings.some(warning => warning.includes('same mode')));
});

test('prioritizes lower-risk controls before chemical review', () => {
  const result = calculateIpmPlan({ ...base, observedCount: 1, recentSeverity: 'info', previousModesOfAction: [] });
  assert.equal(result.controls[0].method, 'cultural');
  assert.equal(result.controls[0].recommended, true);
  assert.equal(result.controls[3].recommended, false);
});

test('reports economic exposure above zero when density exceeds threshold', () => {
  const result = calculateIpmPlan({ ...base, observedCount: 40, sampleCount: 10 });
  assert.ok(result.economicExposurePerHa > 0);
});

test('guards missing samples, thresholds, and identity inputs', () => {
  const result = calculateIpmPlan({ ...base, fieldName: '', targetName: '', sampleCount: 0, actionThreshold: 0 });
  assert.equal(result.averageDensity, 0);
  assert.ok(result.warnings.some(warning => warning.includes('field name')));
  assert.ok(result.warnings.some(warning => warning.includes('Identify')));
  assert.ok(result.warnings.some(warning => warning.includes('Sample count')));
  assert.ok(result.warnings.some(warning => warning.includes('action threshold')));
});

console.log(`\n${passed} ipm-action-planner domain tests passed.`);
