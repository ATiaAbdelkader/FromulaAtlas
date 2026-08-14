import assert from 'node:assert/strict';
import { createDemoScenario } from '../src/lib/demo-scenario';

const recipe = { masterSeed: 'qa-seed-001', baseYear: 2026, density: 'standard' as const, locale: 'fr' as const };
const first = createDemoScenario(recipe, 1_700_000_000_000);
const second = createDemoScenario(recipe, 1_800_000_000_000);

assert.equal(first.manifest.fakeData, true);
assert.equal(first.manifest.currency, 'DZD');
assert.equal(first.manifest.generator, 'formula-atlas-demo-scenario-engine');
assert.equal(first.manifest.locale, 'fr');
assert.equal(first.fields.length, 3);
assert.equal(first.metrics.fieldCount, 3);
assert.equal(first.metrics.totalAreaHa, 13.4);
assert.equal(first.scoutEntries.length, 3);
assert.equal(first.soilTests.length, 3);
assert.equal(first.satelliteRecords.length, 3);
assert.equal(first.fieldRecords.length, 15);
assert.equal(new Set(first.fields.map((field) => field.id)).size, first.fields.length);
assert.equal(new Set(first.fieldRecords.map((record) => record.id)).size, first.fieldRecords.length);
assert.ok(first.fieldRecords.every((record) => record.source === 'demo'));
assert.ok(first.fieldRecords.every((record) => record.metadata?.fakeData === true));
assert.ok(first.fields.every((field) => field.id.startsWith('demo-field-')));
assert.ok(first.satelliteRecords.every((record) => record.source === 'simulated'));
assert.ok(first.simulatorScenario.id === `${first.manifest.scenarioId}-simulator`);
assert.ok(first.simulatorResult.totalCost > 0);
assert.ok(first.simulatorResult.totalRevenue > 0);
assert.ok(first.metrics.totalYieldT > 0);

// Generated records remain stable for the same recipe; only the audit timestamp changes.
assert.equal(first.manifest.scenarioId, second.manifest.scenarioId);
assert.deepEqual(first.fields, second.fields);
assert.deepEqual(first.scoutEntries, second.scoutEntries);
assert.deepEqual(first.soilTests, second.soilTests);
assert.deepEqual(first.satelliteRecords, second.satelliteRecords);
assert.deepEqual(first.fieldRecords, second.fieldRecords);
assert.deepEqual(first.simulatorScenario, second.simulatorScenario);
assert.equal(first.manifest.generatedAt, new Date(1_700_000_000_000).toISOString());
assert.equal(second.manifest.generatedAt, new Date(1_800_000_000_000).toISOString());

const compact = createDemoScenario({ ...recipe, masterSeed: 'qa-seed-compact', density: 'compact' }, 1_700_000_000_000);
const showcase = createDemoScenario({ ...recipe, masterSeed: 'qa-seed-showcase', density: 'showcase' }, 1_700_000_000_000);
assert.equal(compact.fields.length, 2);
assert.equal(compact.fieldRecords.length, 10);
assert.equal(showcase.fields.length, 4);
assert.equal(showcase.fieldRecords.length, 20);
assert.notEqual(first.manifest.scenarioId, compact.manifest.scenarioId);
assert.notDeepEqual(first.fields, compact.fields);

console.log('Demo Scenario Engine tests passed: deterministic generation, manifests, provenance, metrics, density modes, and simulator grounding.');
