import assert from 'node:assert/strict';
import {
  buildFarmDigitalTwinSnapshot,
  createDefaultDigitalTwinState,
  normalizeSavedField,
  setDigitalTwinSelectedField,
  updateDigitalTwinFieldState,
  type SavedFieldRecord,
} from '../src/lib/farm-digital-twin';
import { createDefaultSimulatorScenario, calculateCropSimulator } from '../src/lib/crop-simulator';
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
const northField: SavedFieldRecord = {
  id: 'field-north',
  name: 'North 40',
  crop: 'wheat',
  areaHa: 2.5,
  plantingDate: '2026-04-01',
  soil: { ph: '6.5', om: '2.5', cec: '15', texture: 'loam' },
};
const southField: SavedFieldRecord = {
  id: 'field-south',
  name: 'South 10',
  crop: 'tomato',
  areaHa: 1,
  plantingDate: '2026-05-01',
  soil: { ph: '7.1', om: '2.1', cec: '14', texture: 'loam' },
};
const soilTests: SoilTestEntry[] = [{
  id: 'soil-north', date: '2026-05-20', fieldName: 'north 40', ph: 5.4, om: 1.2, cec: 4, ca: 5, mg: 0.8, k: 0.2, na: 0.8, p: 55, sand: 40, silt: 35, clay: 25,
}];
const scouts: ScoutEntry[] = [{
  id: 'scout-critical', timestamp: now - 10_000, fieldName: 'North 40', crop: 'wheat', note: 'Check disease hot spot', severity: 'critical', status: 'open', followUpDate: now - 86_400_000,
}];
const simulatorScenario = createDefaultSimulatorScenario('wheat', '2026-04-01', 2.5);

 test('normalizes saved fields into the workbench-compatible crop and area contract', () => {
  const field = normalizeSavedField({ id: 'raw-1', name: 'North 40', crop: 'Blé', area: '2.5', plantingDate: '2026-04-01', soil: { ph: 6.5 } });
  assert.ok(field);
  assert.equal(field?.id, 'raw-1');
  assert.equal(field?.crop, 'wheat');
  assert.equal(field?.areaHa, 2.5);
  assert.equal(field?.soil.texture, 'loam');
});

test('builds a portfolio snapshot with deterministic field totals and selection fallback', () => {
  const snapshot = buildFarmDigitalTwinSnapshot({ fields: [northField, southField], soilTests, scoutEntries: scouts, now });
  assert.equal(snapshot.totals.fieldCount, 2);
  assert.equal(snapshot.totals.totalAreaHa, 3.5);
  assert.equal(snapshot.totals.activeFieldCount, 2);
  assert.equal(snapshot.selectedFieldId, 'field-north');
  assert.equal(snapshot.fields[0].field.name, 'North 40');
});

test('rolls existing workbench priorities up to a farm-level next-best-action rail', () => {
  const snapshot = buildFarmDigitalTwinSnapshot({ fields: [northField, southField], soilTests, scoutEntries: scouts, now });
  assert.equal(snapshot.totals.totalCriticalScouting, 1);
  assert.equal(snapshot.totals.totalOverdueFollowUps, 1);
  assert.ok(snapshot.priorities.some(priority => priority.fieldId === 'field-north' && priority.kind === 'critical_observation'));
  assert.ok(snapshot.priorities.some(priority => priority.fieldId === 'field-north' && priority.kind === 'overdue_follow_up'));
  assert.ok(snapshot.nextBestActions.length > 0);
});

test('links a saved simulator scenario only to a matching crop and preserves simulator calculations', () => {
  const expected = calculateCropSimulator(simulatorScenario);
  const snapshot = buildFarmDigitalTwinSnapshot({ fields: [northField, southField], soilTests, scoutEntries: [], simulatorScenario, now });
  assert.equal(snapshot.totals.fieldsWithSimulator, 1);
  assert.equal(snapshot.fields.find(field => field.field.id === 'field-north')?.simulator?.totalCost, expected.totalCost);
  assert.equal(snapshot.fields.find(field => field.field.id === 'field-south')?.simulator, null);
  assert.equal(snapshot.totals.totalSimulatorNetMargin, expected.netMargin);
});

test('classifies water demand across fields without changing irrigation calculations', () => {
  const snapshot = buildFarmDigitalTwinSnapshot({ fields: [northField, southField], soilTests: [], scoutEntries: [], now });
  const totalWaterBuckets = snapshot.totals.lowWaterDemandFields + snapshot.totals.mediumWaterDemandFields + snapshot.totals.highWaterDemandFields;
  assert.equal(totalWaterBuckets, 2);
  assert.ok(snapshot.fields.every(field => field.workbench.irrigation));
});

test('persists selected field and operational status through the pure state helpers', () => {
  const initial = createDefaultDigitalTwinState();
  const selected = setDigitalTwinSelectedField(initial, 'field-north');
  const updated = updateDigitalTwinFieldState(selected, 'field-north', { status: 'paused', statusNote: 'Repair pump before next irrigation window.' });
  const snapshot = buildFarmDigitalTwinSnapshot({ fields: [northField], soilTests: [], scoutEntries: [], state: updated, now });
  assert.equal(snapshot.selectedFieldId, 'field-north');
  assert.equal(snapshot.fields[0].status, 'paused');
  assert.equal(snapshot.fields[0].statusNote, 'Repair pump before next irrigation window.');
  assert.ok(snapshot.fields[0].healthScore < 100);
});

console.log(`\n${passed} farm-digital-twin domain tests passed.`);
