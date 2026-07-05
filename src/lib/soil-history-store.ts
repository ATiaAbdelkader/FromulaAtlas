/**
 * Soil test history store — track soil test results over time
 * and detect trends (improving, declining, stable).
 */

const KEY = 'nutriplant_soil_history_v1';

export interface SoilTestEntry {
  id: string;
  date: string;           // ISO date
  fieldName: string;
  ph: number;
  om: number;             // organic matter %
  cec: number;            // meq/100g
  ca: number;             // meq/100g
  mg: number;             // meq/100g
  k: number;              // meq/100g
  na: number;             // meq/100g
  p: number;              // ppm (Olsen or Bray)
  sand: number;           // %
  silt: number;           // %
  clay: number;           // %
  notes?: string;
}

export interface SoilTrend {
  param: string;
  label: string;
  unit: string;
  values: { date: string; value: number }[];
  direction: 'improving' | 'declining' | 'stable';
  change: number;         // absolute change from first to last
  changePct: number;      // % change
  current: number;
  optimal: [number, number];
  status: 'low' | 'optimal' | 'high';
  recommendation: string;
}

export function getSoilTests(): SoilTestEntry[] {
  if (typeof window === 'undefined') return SEED_TESTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) { localStorage.setItem(KEY, JSON.stringify(SEED_TESTS)); return SEED_TESTS; }
    return JSON.parse(raw);
  } catch { return SEED_TESTS; }
}

export function saveSoilTest(entry: SoilTestEntry): SoilTestEntry[] {
  const all = getSoilTests();
  all.push(entry);
  all.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* ignore */ }
  return all;
}

export function deleteSoilTest(id: string): SoilTestEntry[] {
  const all = getSoilTests().filter(e => e.id !== id);
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* ignore */ }
  return all;
}

/** Compute trends for each soil parameter across all test entries. */
export function computeTrends(entries: SoilTestEntry[]): SoilTrend[] {
  if (entries.length === 0) return [];
  const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const params: { key: keyof SoilTestEntry; label: string; unit: string; optimal: [number, number]; }[] = [
    { key: 'ph',  label: 'pH',          unit: '',         optimal: [6.0, 7.0] },
    { key: 'om',  label: 'Organic Matter', unit: '%',     optimal: [2.5, 5.0] },
    { key: 'cec', label: 'CEC',         unit: 'meq/100g', optimal: [10, 25] },
    { key: 'ca',  label: 'Calcium',     unit: 'meq/100g', optimal: [6, 15] },
    { key: 'mg',  label: 'Magnesium',   unit: 'meq/100g', optimal: [1, 3] },
    { key: 'k',   label: 'Potassium',   unit: 'meq/100g', optimal: [0.3, 0.8] },
    { key: 'p',   label: 'Phosphorus',  unit: 'ppm',      optimal: [15, 40] },
    { key: 'na',  label: 'Sodium',      unit: 'meq/100g', optimal: [0, 0.5] },
  ];

  return params.map(p => {
    const values = sorted.map(e => ({ date: e.date, value: e[p.key] as number })).filter(v => v.value != null && !isNaN(v.value));
    if (values.length === 0) return null;

    const first = values[0].value;
    const last = values[values.length - 1].value;
    const change = last - first;
    const changePct = first !== 0 ? (change / Math.abs(first)) * 100 : 0;

    let direction: SoilTrend['direction'] = 'stable';
    if (Math.abs(changePct) > 5) {
      // "Improving" depends on whether we're moving toward optimal
      const [lo, hi] = p.optimal;
      if (last < lo) direction = change > 0 ? 'improving' : 'declining';
      else if (last > hi) direction = change < 0 ? 'improving' : 'declining';
      else direction = 'stable';
    }

    const [lo, hi] = p.optimal;
    let status: SoilTrend['status'] = 'optimal';
    if (last < lo) status = 'low';
    else if (last > hi) status = 'high';

    let recommendation = '';
    if (p.key === 'ph') {
      if (last < 6.0) recommendation = `Apply ${(Math.ceil((6.5 - last) * 1.5 * 10) / 10)} t/ha agricultural lime to raise pH to 6.5.`;
      else if (last > 7.5) recommendation = `Apply elemental sulfur (200-400 kg/ha) to lower pH. Use acidifying fertigation.`;
      else recommendation = 'pH is in optimal range — maintain current management.';
    } else if (p.key === 'om') {
      if (last < 2.0) recommendation = 'Apply compost (10-20 t/ha) + plant cover crops. Target +0.3%/year.';
      else if (last < 2.5) recommendation = 'Add cover crops + reduced tillage to build OM.';
      else recommendation = 'OM is good — continue cover cropping and residue retention.';
    } else if (p.key === 'k') {
      if (last < 0.3) recommendation = `Apply K₂O at ${(Math.ceil((0.5 - last) * 350))} kg/ha (MOP or SOP).`;
      else recommendation = 'K adequate — monitor with petiole tests during season.';
    } else if (p.key === 'p') {
      if (last < 15) recommendation = `Apply 40-60 kg P₂O₅/ha as DAP or MAP at planting.`;
      else if (last > 50) recommendation = 'P high — skip P fertilizer this season to avoid environmental loss.';
      else recommendation = 'P optimal — apply maintenance rate (20-30 kg P₂O₅/ha).';
    } else if (p.key === 'ca') {
      if (last < 6) recommendation = 'Apply gypsum (500-1000 kg/ha) or lime if pH also low.';
      else recommendation = 'Ca adequate.';
    } else if (p.key === 'mg') {
      if (last < 1) recommendation = 'Apply dolomitic lime or MgSO₄ (Epsom salt, 50-100 kg/ha).';
      else recommendation = 'Mg adequate.';
    } else if (p.key === 'na') {
      if (last > 0.5) recommendation = `High Na (${last} meq/100g) — apply gypsum to displace Na + leach with good quality water.`;
      else recommendation = 'Na levels safe.';
    } else if (p.key === 'cec') {
      if (last < 5) recommendation = 'Low CEC — split fertilizer applications, add OM to improve retention.';
      else if (last > 30) recommendation = 'High CEC — good nutrient buffer, can apply larger doses.';
      else recommendation = 'CEC in normal range.';
    }

    return {
      param: p.key as string,
      label: p.label,
      unit: p.unit,
      values,
      direction,
      change: Math.round(change * 100) / 100,
      changePct: Math.round(changePct * 10) / 10,
      current: last,
      optimal: p.optimal,
      status,
      recommendation,
    } as SoilTrend;
  }).filter((t): t is SoilTrend => t !== null);
}

/** Get the latest soil test for a field. */
export function getLatestTest(entries: SoilTestEntry[], fieldName?: string): SoilTestEntry | null {
  const filtered = fieldName ? entries.filter(e => e.fieldName === fieldName) : entries;
  if (filtered.length === 0) return null;
  return [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
}

/** Get unique field names from all entries. */
export function getFieldNames(entries: SoilTestEntry[]): string[] {
  return [...new Set(entries.map(e => e.fieldName))].sort();
}

// Seed data — 5 years of soil tests showing improvement
const SEED_TESTS: SoilTestEntry[] = [
  { id: 's1', date: '2021-03-15', fieldName: 'Field A', ph: 5.8, om: 1.8, cec: 12, ca: 5.5, mg: 0.8, k: 0.2, na: 0.3, p: 12, sand: 45, silt: 35, clay: 20, notes: 'Baseline test. Low pH, OM, K.' },
  { id: 's2', date: '2022-03-10', fieldName: 'Field A', ph: 6.1, om: 2.0, cec: 13, ca: 6.8, mg: 1.0, k: 0.3, na: 0.2, p: 18, sand: 45, silt: 35, clay: 20, notes: 'After 1.5 t/ha lime + cover crop.' },
  { id: 's3', date: '2023-03-12', fieldName: 'Field A', ph: 6.4, om: 2.3, cec: 14, ca: 8.0, mg: 1.2, k: 0.4, na: 0.2, p: 25, sand: 45, silt: 35, clay: 20, notes: 'OM improving. K still borderline.' },
  { id: 's4', date: '2024-03-08', fieldName: 'Field A', ph: 6.6, om: 2.6, cec: 15, ca: 9.2, mg: 1.4, k: 0.5, na: 0.2, p: 30, sand: 45, silt: 35, clay: 20, notes: 'All parameters in or near optimal.' },
  { id: 's5', date: '2025-03-05', fieldName: 'Field A', ph: 6.7, om: 2.8, cec: 15, ca: 9.5, mg: 1.5, k: 0.6, na: 0.2, p: 32, sand: 45, silt: 35, clay: 20, notes: 'Stable. Continue cover crops + compost.' },
  { id: 's6', date: '2023-03-15', fieldName: 'Field B', ph: 7.8, om: 1.5, cec: 18, ca: 12.0, mg: 0.6, k: 0.3, na: 1.2, p: 45, sand: 30, silt: 40, clay: 30, notes: 'High pH, high Na. Sodic soil risk.' },
  { id: 's7', date: '2025-03-05', fieldName: 'Field B', ph: 7.5, om: 1.8, cec: 19, ca: 13.0, mg: 0.8, k: 0.4, na: 0.8, p: 38, sand: 30, silt: 40, clay: 30, notes: 'After gypsum + leaching. Na improving.' },
];
