import { allFormulas, partsWithCounts } from './formulas-data';

/** Counts derived from the canonical catalog data used by the app. */
export const FORMULA_COUNT = allFormulas.length;
export const FORMULA_PART_COUNT = partsWithCounts.length;
export const FORMULA_SECTION_COUNT = partsWithCounts.reduce((sum, part) => sum + part.chapterCount, 0);

/** The free-tool catalog is declared in FreeToolsSection.tsx. Keep this value guarded by scripts/verify-catalog.mjs. */
export const FREE_TOOL_COUNT = 19;
