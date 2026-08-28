import assert from 'node:assert/strict';
import { calculateHarvestForecast } from '../src/lib/harvest-forecast';

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
  plantingDate: '2026-01-01',
  areaHa: 2,
  expectedYieldTPerHa: 7,
  expectedMoisturePct: 16,
  storageCapacityT: 40,
  currentInventoryT: 10,
};

const today = new Date('2026-01-01T00:00:00');

test('returns no forecast for an unknown crop or invalid planting date', () => {
  assert.equal(calculateHarvestForecast({ ...base, cropId: 'unknown' }, today), null);
  assert.equal(calculateHarvestForecast({ ...base, plantingDate: 'not-a-date' }, today), null);
});

test('derives a dated harvest window from the canonical lifecycle', () => {
  const result = calculateHarvestForecast(base, today);
  assert.ok(result);
  assert.equal(result.crop.id, 'maize');
  assert.match(result.harvestStartDate, /^2026-/);
  assert.ok(result.daysUntilHarvest >= 0);
  assert.ok(result.seasonEndDate >= result.harvestEndDate);
});

test('scales expected volume, dry matter, and labor by field area', () => {
  const oneHa = calculateHarvestForecast({ ...base, areaHa: 1 }, today);
  const fourHa = calculateHarvestForecast({ ...base, areaHa: 4 }, today);
  assert.ok(oneHa && fourHa);
  assert.equal(fourHa.totalExpectedVolumeT, oneHa.totalExpectedVolumeT * 4);
  assert.equal(fourHa.totalExpectedDryVolumeT, oneHa.totalExpectedDryVolumeT * 4);
  assert.equal(fourHa.totalHarvestLaborDays, oneHa.totalHarvestLaborDays * 4);
});

test('converts expected wet volume to dry-equivalent volume', () => {
  const result = calculateHarvestForecast({ ...base, expectedMoisturePct: 20 }, today);
  assert.ok(result);
  assert.ok(result.totalExpectedDryVolumeT > 0);
  assert.ok(result.totalExpectedDryVolumeT < result.totalExpectedVolumeT);
});

test('preserves multi-day harvest windows for continuous crops', () => {
  const result = calculateHarvestForecast({ ...base, cropId: 'cucumber' }, today);
  assert.ok(result);
  const lot = result.lots[0];
  assert.ok(lot);
  assert.ok(new Date(lot.endDate).getTime() >= new Date(lot.startDate).getTime());
  assert.ok(lot.operation.durationDays > 1);
  assert.ok(result.warnings.some(warning => warning.includes('multi-day')));
});

test('flags moisture and storage risks without changing the forecast math', () => {
  const result = calculateHarvestForecast({ ...base, expectedMoisturePct: 20, storageCapacityT: 15, currentInventoryT: 10 }, today);
  assert.ok(result);
  assert.equal(result.storageStatus, 'overCapacity');
  assert.ok(result.warnings.some(warning => warning.includes('drying')));
  assert.ok(result.warnings.some(warning => warning.includes('exceeds available storage')));
});

console.log(`\n${passed} harvest-forecast domain tests passed.`);
