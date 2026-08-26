import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const stats = readFileSync(resolve(root, 'src/lib/catalog-stats.ts'), 'utf8');
const registry = readFileSync(resolve(root, 'src/lib/tool-registry.ts'), 'utf8');
const homepage = readFileSync(resolve(root, 'src/app/page.tsx'), 'utf8');
const landing = readFileSync(resolve(root, 'src/app/landing/page.tsx'), 'utf8');
const layout = readFileSync(resolve(root, 'src/app/layout.tsx'), 'utf8');

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Count consistency regression failed: ${message}`);
  }
}

assert(stats.includes('export const FORMULA_COUNT = allFormulas.length;'), 'formula count should derive from the canonical formula catalog');
assert(stats.includes('export const FREE_TOOL_COUNT = 19;'), 'free-tool count should remain the guarded catalog count');
assert(stats.includes('export const INTERACTIVE_TOOL_COUNT = 34;'), 'interactive-tool count should be explicit and canonical');
assert(stats.includes('export const CALCULATOR_COUNT = FREE_TOOL_COUNT;'), 'calculator count should reuse the free calculator catalog');

const registeredToolCount = (registry.match(/^  \{ id: '/gm) ?? []).length;
assert(registeredToolCount === 34, `tool registry should contain 34 registered destinations, found ${registeredToolCount}`);

assert(homepage.includes('value={FORMULA_COUNT}'), 'homepage formula stat should use FORMULA_COUNT');
assert(homepage.includes('value={INTERACTIVE_TOOL_COUNT}'), 'homepage interactive-tool stat should use INTERACTIVE_TOOL_COUNT');
assert(homepage.includes('`${CALCULATOR_COUNT} calculators`'), 'homepage calculator claim should use CALCULATOR_COUNT');
assert(landing.includes('{FORMULA_COUNT} agronomic formulas. {INTERACTIVE_TOOL_COUNT} interactive tools.'), 'landing hero should use canonical formula and tool counts');
assert(landing.includes('value={FORMULA_COUNT}'), 'landing formula stat should use FORMULA_COUNT');
assert(landing.includes('value={INTERACTIVE_TOOL_COUNT}'), 'landing interactive-tool stat should use INTERACTIVE_TOOL_COUNT');
assert(landing.includes('{INTERACTIVE_TOOL_COUNT} tools, zero friction'), 'landing tools heading should use INTERACTIVE_TOOL_COUNT');
assert(landing.includes('{CALCULATOR_COUNT} free calculators'), 'landing calculator claim should use CALCULATOR_COUNT');
assert(layout.includes('${FORMULA_COUNT} agronomic formulas'), 'metadata should use FORMULA_COUNT');
assert(layout.includes('${INTERACTIVE_TOOL_COUNT} interactive tools'), 'metadata should use INTERACTIVE_TOOL_COUNT');
assert(layout.includes('${CALCULATOR_COUNT} free calculators'), 'metadata should use CALCULATOR_COUNT');

for (const staleClaim of [
  '332 agronomic formulas',
  '50+ interactive tools',
  '50+ tools',
  '91 interactive tools',
  '218 calculators',
  '218 حاسبة',
]) {
  assert(!homepage.includes(staleClaim), `homepage should not contain stale claim: ${staleClaim}`);
  assert(!landing.includes(staleClaim), `landing should not contain stale claim: ${staleClaim}`);
  assert(!layout.includes(staleClaim), `metadata should not contain stale claim: ${staleClaim}`);
}

console.log('Count consistency regression passed: public surfaces use canonical catalog counts.');
