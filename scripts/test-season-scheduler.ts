import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const source = readFileSync(resolve(root, 'src/components/agri/season-scheduler.tsx'), 'utf8');

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Seasonal planner regression failed: ${message}`);
  }
}

assert(
  source.includes('const [now, setNow] = useState<Date | null>(null);'),
  'seasonal planner should defer the current date until mount'
);
assert(
  source.includes('if (!now) {'),
  'seasonal guidance should wait for the real current date'
);
assert(
  source.includes('aria-live="polite"'),
  'date preparation state should be announced accessibly'
);
assert(
  source.includes('Preparing today’s date and seasonal guidance…'),
  'date preparation state should explain why guidance is temporarily withheld'
);
assert(
  source.includes('const month = now.getMonth();'),
  'season selection should use the mounted current date'
);
assert(
  !source.includes('new Date(2026, 0, 1)'),
  'the obsolete January 1 2026 placeholder must not return'
);
assert(
  !source.includes('const effectiveNow ='),
  'seasonal guidance must not be derived from a fake effective date'
);

console.log('Seasonal planner date safety regression passed.');
