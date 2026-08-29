import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const handbook = JSON.parse(fs.readFileSync(path.join(root, 'src/data/agri_formulas.json'), 'utf8'));
const freeToolsSource = fs.readFileSync(path.join(root, 'src/components/agri/nutri-tools/FreeToolsSection.tsx'), 'utf8');
const statsSource = fs.readFileSync(path.join(root, 'src/lib/catalog-stats.ts'), 'utf8');

const formulaCount = handbook.all_formulas.length;
const partCount = handbook.parts.length;
const sectionCount = handbook.parts.reduce((total, part) => total + part.chapters.length, 0);
const freeToolCount = (freeToolsSource.match(/^    id: '/gm) ?? []).length;

const expected = {
  formulaCount: 500,
  partCount: 44,
  sectionCount: 120,
  freeToolCount: 27,
};
const actual = { formulaCount, partCount, sectionCount, freeToolCount };

for (const [key, value] of Object.entries(expected)) {
  if (actual[key] !== value) {
    throw new Error(`${key} drifted: expected ${value}, found ${actual[key]}`);
  }
}

const constantChecks = [
  [`FORMULA_COUNT = allFormulas.length`, /FORMULA_COUNT = allFormulas\.length/],
  [`FORMULA_PART_COUNT = partsWithCounts.length`, /FORMULA_PART_COUNT = partsWithCounts\.length/],
  [`FORMULA_SECTION_COUNT = partsWithCounts.reduce`, /FORMULA_SECTION_COUNT = partsWithCounts\.reduce/],
  [`FREE_TOOL_COUNT = ${expected.freeToolCount}`, new RegExp(`FREE_TOOL_COUNT = ${expected.freeToolCount}`)],
];
for (const [label, pattern] of constantChecks) {
  if (!pattern.test(statsSource)) throw new Error(`Missing shared catalog contract: ${label}`);
}

console.log(`Catalog regression check passed: ${formulaCount} formulas, ${partCount} parts, ${sectionCount} sections, ${freeToolCount} free tools.`);
