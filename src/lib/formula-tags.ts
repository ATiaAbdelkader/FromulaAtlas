/**
 * Auto-computed formula metadata: difficulty level + contextual tags.
 *
 * These are derived heuristically from each formula's existing fields
 * (part, code, name, variables, formula, purpose) — no manual tagging
 * needed for 500 formulas. The heuristics are tuned to be useful, not
 * perfect.
 */

export type FormulaDifficulty = 'basic' | 'intermediate' | 'advanced';

export interface FormulaMeta {
  difficulty: FormulaDifficulty;
  tags: string[];
}

/** Tag extraction rules: if the formula text or variables contain the
 *  key, the tag is applied. Keys are lowercase-matched against the
 *  concatenated formula+variables+name+purpose haystack. */
const TAG_RULES: { key: string; tag: string }[] = [
  // Nutrient / chemistry
  { key: 'npk', tag: 'NPK' },
  { key: 'nitrogen', tag: 'N' },
  { key: 'phosphor', tag: 'P' },
  { key: 'potass', tag: 'K' },
  { key: 'calcium', tag: 'Ca' },
  { key: 'magnesium', tag: 'Mg' },
  { key: 'sulfur', tag: 'S' },
  { key: 'cec', tag: 'CEC' },
  { key: 'ph ', tag: 'pH' },
  { key: 'organic matter', tag: 'OM' },
  { key: 'ec ', tag: 'EC' },
  // Water / irrigation
  { key: 'et0', tag: 'ET₀' },
  { key: 'et₀', tag: 'ET₀' },
  { key: 'evapotranspiration', tag: 'ET₀' },
  { key: 'kc', tag: 'Kc' },
  { key: 'irrigation', tag: 'Irrigation' },
  { key: 'drip', tag: 'Drip' },
  { key: 'sprinkler', tag: 'Sprinkler' },
  { key: 'pump', tag: 'Pump' },
  { key: 'flow', tag: 'Flow' },
  { key: 'precipitation', tag: 'Rain' },
  { key: 'rain', tag: 'Rain' },
  // Soil
  { key: 'bulk density', tag: 'Bulk Density' },
  { key: 'texture', tag: 'Texture' },
  { key: 'erosion', tag: 'Erosion' },
  { key: 'compaction', tag: 'Compaction' },
  { key: 'infiltration', tag: 'Infiltration' },
  // Crop
  { key: 'yield', tag: 'Yield' },
  { key: 'growth', tag: 'Growth' },
  { key: 'phenology', tag: 'Phenology' },
  { key: 'gdd', tag: 'GDD' },
  { key: 'degree day', tag: 'GDD' },
  { key: 'plant population', tag: 'Density' },
  { key: 'seed', tag: 'Seed' },
  { key: 'harvest', tag: 'Harvest' },
  // Protection
  { key: 'pest', tag: 'Pest' },
  { key: 'disease', tag: 'Disease' },
  { key: 'weed', tag: 'Weed' },
  { key: 'spray', tag: 'Spray' },
  { key: 'pesticide', tag: 'Pesticide' },
  { key: 'threshold', tag: 'Threshold' },
  // Livestock
  { key: 'feed', tag: 'Feed' },
  { key: 'ration', tag: 'Ration' },
  { key: 'milk', tag: 'Milk' },
  { key: 'weight gain', tag: 'Growth' },
  { key: 'livestock', tag: 'Livestock' },
  { key: 'cattle', tag: 'Cattle' },
  { key: 'poultry', tag: 'Poultry' },
  { key: 'fish', tag: 'Aquaculture' },
  // Climate / sustainability
  { key: 'carbon', tag: 'Carbon' },
  { key: 'emission', tag: 'Emissions' },
  { key: 'greenhouse', tag: 'Greenhouse' },
  { key: 'climate', tag: 'Climate' },
  { key: 'energy', tag: 'Energy' },
  { key: 'solar', tag: 'Solar' },
  { key: 'wind', tag: 'Wind' },
  { key: 'frost', tag: 'Frost' },
  // Economics
  { key: 'cost', tag: 'Cost' },
  { key: 'revenue', tag: 'Revenue' },
  { key: 'profit', tag: 'Profit' },
  { key: 'roi', tag: 'ROI' },
  { key: 'break-even', tag: 'Break-even' },
  { key: 'margin', tag: 'Margin' },
];

const ADVANCED_PART_KEYWORDS = ['advanced', 'specialist', 'precision', 'genetics', 'pathology', 'meteorology'];
const BASIC_PART_KEYWORDS = ['foundations', 'tools & applications'];

/**
 * Computes difficulty + tags for a formula based on its existing fields.
 * Results are deterministic (same formula → same meta) so they can be
 * memoized.
 */
export function getFormulaMeta(formula: {
  code: string;
  name: string;
  formula: string;
  variables?: string;
  purpose?: string;
  part: string;
}): FormulaMeta {
  const haystack = `${formula.name} ${formula.formula} ${formula.variables || ''} ${formula.purpose || ''} ${formula.part}`.toLowerCase();
  const partLower = formula.part.toLowerCase();

  // --- Difficulty ---
  let difficulty: FormulaDifficulty = 'intermediate';

  // Part name hints
  if (ADVANCED_PART_KEYWORDS.some(k => partLower.includes(k))) {
    difficulty = 'advanced';
  } else if (BASIC_PART_KEYWORDS.some(k => partLower.includes(k))) {
    difficulty = 'basic';
  }

  // Variable count heuristic: count comma-separated items in variables field
  const varCount = formula.variables ? formula.variables.split(',').length : 0;
  if (difficulty === 'intermediate') {
    if (varCount <= 3) difficulty = 'basic';
    else if (varCount >= 7) difficulty = 'advanced';
  }

  // Formula complexity: longer formulas with more operators tend to be harder
  const formulaLen = formula.formula.length;
  const hasNestedParens = (formula.formula.match(/\(/g) || []).length >= 2;
  if (formulaLen > 80 || (hasNestedParens && varCount >= 5)) {
    difficulty = 'advanced';
  }

  // --- Tags ---
  const tags: string[] = [];
  const seen = new Set<string>();

  for (const rule of TAG_RULES) {
    if (haystack.includes(rule.key) && !seen.has(rule.tag)) {
      tags.push(rule.tag);
      seen.add(rule.tag);
    }
  }

  // Cap at 4 tags for card display
  return { difficulty, tags: tags.slice(0, 4) };
}

// Difficulty display config
export const DIFFICULTY_CONFIG: Record<FormulaDifficulty, {
  label: string;
  label_ar: string;
  color: string;
  bg: string;
  border: string;
}> = {
  basic: {
    label: 'Basic',
    label_ar: 'أساسي',
    color: '#16a34a',
    bg: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    border: 'border-emerald-300 dark:border-emerald-800',
  },
  intermediate: {
    label: 'Intermediate',
    label_ar: 'متوسط',
    color: '#f59e0b',
    bg: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    border: 'border-amber-300 dark:border-amber-800',
  },
  advanced: {
    label: 'Advanced',
    label_ar: 'متقدّم',
    color: '#dc2626',
    bg: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800',
    border: 'border-red-300 dark:border-red-800',
  },
};
