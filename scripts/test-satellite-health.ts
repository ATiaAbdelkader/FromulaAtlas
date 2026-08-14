import assert from 'node:assert/strict';
import { buildFarmDigitalTwinSnapshot, type SavedFieldRecord } from '../src/lib/farm-digital-twin';
import { classifySatelliteHealth, createSatelliteHealthRecord, satelliteHealthNeedsAction, type SatelliteHealthRecord } from '../src/lib/satellite-health';
import type { NdviResult } from '../src/lib/satellite-service';

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
  id: 'field-south',
  name: 'South 10',
  crop: 'tomato',
  areaHa: 4,
  plantingDate: '2026-04-01',
  soil: { ph: '6.5', om: '2.5', cec: '15', texture: 'loam' },
};

const stressedResult: NdviResult = {
  field: { name: 'South 10', lat: 36.75, lng: 3.05, areaHa: 4, north: 36.76, south: 36.74, east: 3.06, west: 3.04 },
  date: '2026-06-01',
  averageNdvi: 0.41,
  minNdvi: 0.18,
  maxNdvi: 0.72,
  stressedAreaPct: 24,
  satellite: 'Sentinel-2 simulated',
  cloudCover: 7,
  zones: Array.from({ length: 4 }, (_, index) => ({
    id: `zone-${index}`,
    row: Math.floor(index / 2),
    col: index % 2,
    x: index % 2,
    y: Math.floor(index / 2),
    ndvi: index === 0 ? 0.18 : 0.5,
    health: index === 0 ? 'poor' : 'good',
    areaPct: 25,
  })),
  recommendations: ['Scout the stressed zone within 48 hours.'],
};

const record = createSatelliteHealthRecord('field-south', 'South 10', 'tomato', field.areaHa, stressedResult, 'sentinel-2', 1234);

 test('classifies NDVI stress bands with transparent thresholds', () => {
  assert.equal(classifySatelliteHealth(0.72, 3), 'excellent');
  assert.equal(classifySatelliteHealth(0.55, 12), 'watch');
  assert.equal(classifySatelliteHealth(0.41, 24), 'stressed');
  assert.equal(classifySatelliteHealth(0.2, 40), 'critical');
});

test('creates a bounded satellite record with area-scaled stress', () => {
  assert.equal(record.level, 'stressed');
  assert.equal(record.averageNdvi, 0.41);
  assert.equal(record.zoneCount, 4);
  assert.equal(record.stressedAreaHa, 0.96);
  assert.equal(record.cloudCover, 7);
  assert.equal(satelliteHealthNeedsAction(record), true);
});

test('links the latest satellite record to the matching Digital Twin field', () => {
  const older: SatelliteHealthRecord = { ...record, averageNdvi: 0.7, level: 'excellent', updatedAt: 1000 };
  const snapshot = buildFarmDigitalTwinSnapshot({ fields: [field], soilTests: [], scoutEntries: [], satelliteRecords: [older, record], now: 2000 });
  assert.equal(snapshot.totals.fieldsWithSatellite, 1);
  assert.equal(snapshot.totals.stressedSatelliteFields, 1);
  assert.equal(snapshot.totals.criticalSatelliteFields, 0);
  assert.equal(snapshot.totals.totalSatelliteStressedAreaHa, 0.96);
  assert.equal(snapshot.fields[0].satellite?.updatedAt, 1234);
  assert.equal(snapshot.fields[0].satellite?.level, 'stressed');
});

test('does not attach a record to an unrelated field', () => {
  const snapshot = buildFarmDigitalTwinSnapshot({ fields: [{ ...field, id: 'other-field', name: 'Other Field' }], soilTests: [], scoutEntries: [], satelliteRecords: [record], now: 2000 });
  assert.equal(snapshot.totals.fieldsWithSatellite, 0);
  assert.equal(snapshot.fields[0].satellite, null);
});

console.log(`\n${passed} satellite-health domain tests passed.`);
