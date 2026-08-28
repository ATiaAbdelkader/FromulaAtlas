import assert from 'node:assert/strict';
import { buildFieldRecordTimeline, createManualFieldRecord, getFieldRecordBookStats, type FieldRecord } from '../src/lib/field-record-book';
import type { SavedFieldRecord } from '../src/lib/farm-digital-twin';
import type { ScoutEntry } from '../src/lib/scouting-store';
import type { SoilTestEntry } from '../src/lib/soil-history-store';
import type { SatelliteHealthRecord } from '../src/lib/satellite-health';

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

const field: SavedFieldRecord = {
  id: 'field-north',
  name: 'North 40',
  crop: 'wheat',
  areaHa: 4,
  plantingDate: '2026-01-15',
  soil: { ph: '6.5', om: '2.5', cec: '15', texture: 'loam' },
};

const scout: ScoutEntry = {
  id: 'scout-1',
  timestamp: new Date('2026-05-10T12:00:00Z').getTime(),
  fieldName: 'North 40',
  crop: 'wheat',
  note: 'Aphid pressure along the eastern edge.',
  severity: 'warning',
};

const soil: SoilTestEntry = {
  id: 'soil-1',
  date: '2026-03-01',
  fieldName: 'North 40',
  ph: 6.4,
  om: 2.6,
  cec: 15,
  ca: 9,
  mg: 1.4,
  k: 0.5,
  na: 0.2,
  p: 28,
  sand: 45,
  silt: 35,
  clay: 20,
};

const satellite: SatelliteHealthRecord = {
  fieldId: 'field-north',
  fieldName: 'North 40',
  crop: 'wheat',
  source: 'sentinel-2',
  date: '2026-05-20',
  averageNdvi: 0.41,
  minNdvi: 0.18,
  maxNdvi: 0.72,
  stressedAreaPct: 24,
  stressedAreaHa: 0.96,
  cloudCover: 7,
  zoneCount: 4,
  level: 'stressed',
  recommendations: ['Scout the eastern edge.'],
  updatedAt: new Date('2026-05-20T12:00:00Z').getTime(),
};

const manual: FieldRecord = createManualFieldRecord({
  fieldId: field.id,
  fieldName: field.name,
  crop: field.crop,
  date: '2026-05-25',
  kind: 'input',
  title: 'Applied foliar feed',
  summary: 'Applied the planned foliar nutrition pass after scouting.',
  amountDzd: 12500,
}, 1234);

const timeline = buildFieldRecordTimeline({ fields: [field], scoutEntries: [scout], soilTests: [soil], satelliteRecords: [satellite], manualRecords: [manual] });

 test('aggregates connected sources into one descending timeline', () => {
  assert.equal(timeline.length, 5);
  assert.equal(timeline[0].source, 'manual');
  assert.equal(timeline[1].source, 'satellite');
  assert.equal(timeline[2].source, 'scouting');
  assert.equal(timeline[3].source, 'soil-test');
  assert.equal(timeline[4].source, 'field-profile');
  assert.ok(timeline.every((entry, index) => index === 0 || entry.timestamp <= timeline[index - 1].timestamp));
});

test('keeps field linkage, source labels, and important metadata', () => {
  const satelliteEntry = timeline.find((entry) => entry.source === 'satellite');
  const scoutEntry = timeline.find((entry) => entry.source === 'scouting');
  assert.equal(satelliteEntry?.fieldId, 'field-north');
  assert.equal(satelliteEntry?.severity, 'warning');
  assert.equal(satelliteEntry?.metadata?.stressedAreaHa, 0.96);
  assert.equal(scoutEntry?.metadata?.status, 'monitoring');
});

test('computes traceability and DZD activity metrics', () => {
  const stats = getFieldRecordBookStats(timeline);
  assert.equal(stats.total, 5);
  assert.equal(stats.fields, 1);
  assert.equal(stats.observations, 3);
  assert.equal(stats.actions, 1);
  assert.equal(stats.critical, 0);
  assert.equal(stats.linkedSources, 4);
  assert.equal(stats.totalAmountDzd, 12500);
});

test('normalizes manual entry dates and never makes a negative DZD amount', () => {
  const entry = createManualFieldRecord({ fieldName: 'Field B', date: '2026-06-01', kind: 'note', title: 'Note', summary: 'Details', amountDzd: -50 });
  assert.equal(entry.timestamp, new Date('2026-06-01T12:00:00').getTime());
  assert.equal(entry.amountDzd, 0);
  assert.equal(entry.source, 'manual');
});

console.log(`\n${passed} field-record-book domain tests passed.`);
