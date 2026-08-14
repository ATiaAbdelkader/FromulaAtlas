import assert from 'node:assert/strict';
import {
  buildFieldWorkbenchSnapshot,
  daysSincePlanting,
  getFieldIrrigationDemand,
  getLatestFieldSoilTest,
  getSoilConstraints,
  type WorkbenchField,
} from '../src/lib/field-workbench';
import type { ScoutEntry } from '../src/lib/scouting-store';
import type { SoilTestEntry } from '../src/lib/soil-history-store';

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

const now = Date.parse('2026-06-01T12:00:00Z');
const field: WorkbenchField = {
  id: 'field-1',
  name: 'North 40',
  crop: 'tomato',
  areaHa: 2.5,
  plantingDate: '2026-04-01',
  soil: { ph: '6.5', om: '2.5', cec: '15', texture: 'loam' },
};

const olderTest: SoilTestEntry = {
  id: 'soil-older', date: '2025-09-01', fieldName: 'North 40', ph: 6.4, om: 2.3, cec: 14, ca: 9, mg: 1.2, k: 0.45, na: 0.2, p: 30, sand: 40, silt: 35, clay: 25,
};
const latestTest: SoilTestEntry = {
  id: 'soil-latest', date: '2026-05-20', fieldName: 'north 40', ph: 5.4, om: 1.2, cec: 4, ca: 5, mg: 0.8, k: 0.2, na: 0.8, p: 55, sand: 40, silt: 35, clay: 25,
};

const scouts: ScoutEntry[] = [
  { id: 'resolved', timestamp: now - 30_000, fieldName: 'North 40', crop: 'tomato', note: 'Resolved historic issue', severity: 'critical', status: 'resolved', followUpDate: now - 86_400_000 },
  { id: 'warning', timestamp: now - 20_000, fieldName: 'North 40', crop: 'tomato', note: 'Monitor leaf margin symptoms', severity: 'warning', status: 'monitoring' },
  { id: 'critical', timestamp: now - 10_000, fieldName: 'North 40', crop: 'tomato', note: 'Check suspected disease hot spot', severity: 'critical', status: 'open', followUpDate: now - 86_400_000 },
  { id: 'other-field', timestamp: now, fieldName: 'South 10', crop: 'tomato', note: 'Unrelated observation', severity: 'critical', status: 'open' },
];

test('calculates non-negative days since planting deterministically', () => {
  assert.equal(daysSincePlanting('2026-04-01', now), 61);
  assert.equal(daysSincePlanting('2026-09-01', now), 0);
  assert.equal(daysSincePlanting('invalid', now), 0);
});

test('selects the newest case-insensitive matching soil result for a field', () => {
  const latest = getLatestFieldSoilTest('NORTH 40', [olderTest, latestTest]);
  assert.equal(latest?.id, 'soil-latest');
  assert.equal(getLatestFieldSoilTest('Missing field', [olderTest, latestTest]), null);
});

test('flags agronomic soil constraints using the established workbench thresholds', () => {
  const constraints = getSoilConstraints(latestTest);
  assert.deepEqual(constraints.map(constraint => constraint.key), ['ph', 'om', 'k', 'p', 'na']);
  assert.equal(constraints.find(constraint => constraint.key === 'na')?.level, 'critical');
  assert.deepEqual(getSoilConstraints(null), []);
});

test('derives crop-stage irrigation demand from crop preset data', () => {
  const demand = getFieldIrrigationDemand('tomato', 61);
  assert.ok(demand);
  assert.ok(demand.mmPerDay > 0);
  assert.ok(['low', 'medium', 'high'].includes(demand.level));
  assert.equal(getFieldIrrigationDemand('unknown-crop', 10), null);
});

test('aggregates soil, scouting and nutrient-plan inputs without creating duplicate field data', () => {
  const snapshot = buildFieldWorkbenchSnapshot(field, [olderTest, latestTest], scouts, now);
  assert.equal(snapshot.field.id, field.id);
  assert.equal(snapshot.latestSoilTest?.id, 'soil-latest');
  assert.equal(snapshot.scouting.entries.length, 3);
  assert.equal(snapshot.scouting.openCount, 2);
  assert.equal(snapshot.scouting.criticalCount, 1);
  assert.equal(snapshot.scouting.overdueCount, 1);
  assert.equal(snapshot.scouting.recent[0].id, 'critical');
  assert.ok(snapshot.nutrientPlan);
  assert.ok(snapshot.nutrientPlan?.warnings.some(warning => warning.includes('Soil pH')));
});

test('places overdue follow-ups, critical observations, soil constraints and nutrient guardrails on the priority board', () => {
  const snapshot = buildFieldWorkbenchSnapshot(field, [latestTest], scouts, now);
  const kinds = snapshot.priorities.map(priority => priority.kind);
  assert.ok(kinds.includes('overdue_follow_up'));
  assert.ok(kinds.includes('critical_observation'));
  assert.equal(snapshot.priorities.filter(priority => priority.kind === 'soil_constraint').length, 5);
  assert.ok(kinds.includes('nutrient_guardrail'));
});

test('falls back to saved field soil values when no linked soil test exists', () => {
  const snapshot = buildFieldWorkbenchSnapshot({ ...field, soil: { ph: '6.1', om: '1.0', cec: '12', texture: 'loam' } }, [], [], now);
  assert.equal(snapshot.latestSoilTest, null);
  assert.ok(snapshot.nutrientPlan);
  assert.equal(snapshot.nutrientPlan?.soilNCredit, 50);
  assert.equal(snapshot.scouting.openCount, 0);
});

console.log(`\n${passed} field-workbench domain tests passed.`);
