import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const tsx = resolve(root, 'node_modules', '.bin', 'tsx');
const suites = [
  'scripts/test-geodesy.ts',
  'scripts/test-field-boundary.ts',
  'scripts/test-elevation.ts',
  'scripts/test-open-meteo.ts',
  'scripts/test-nutrient-budget.ts',
  'scripts/test-field-workbench.ts',
  'scripts/test-water-budget.ts',
  'scripts/test-ipm-action-planner.ts',
  'scripts/test-gross-margin-planner.ts',
  'scripts/test-harvest-forecast.ts',
  'scripts/test-soil-health-planner.ts',
  'scripts/test-machinery-field-optimizer.ts',
  'scripts/test-crop-simulator.ts',
  'scripts/test-farm-digital-twin.ts',
  'scripts/test-satellite-health.ts',
  'scripts/test-field-record-book.ts',
  'scripts/test-demo-scenario.ts',
  'scripts/test-ai-agent-orchestrator.ts',
];

if (!existsSync(tsx)) {
  console.error('tsx is not installed. Run npm ci or npm install first.');
  process.exit(1);
}

let failed = false;
for (const suite of suites) {
  console.log(`\n=== ${suite} ===`);
  const result = spawnSync(tsx, [resolve(root, suite)], {
    cwd: root,
    env: { ...process.env, NO_NETWORK: '1' },
    stdio: 'inherit',
  });
  if (result.error) {
    console.error(`Unable to run ${suite}: ${result.error.message}`);
    failed = true;
  } else if (result.status !== 0) {
    console.error(`${suite} failed with exit code ${result.status ?? 'unknown'}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log('\nAll deterministic domain suites passed.');
