/**
 * Market Price Crowd-Sourcing tests (Feature #12)
 *
 * Verifies src/lib/market-price-store.ts:
 *
 *   1. SSR safety — every getter returns [] / zeros on the server
 *   2. Seed data — 50 reports across 10 crops / 15 wilayas, deterministic
 *   3. savePriceReport — persists, returns list with new item at head
 *   4. getPriceReports — filter by crop (case-insensitive)
 *   5. getAveragePrice — min/max/avg/count computation
 *   6. getPriceTrend — forward-fill + back-fill for missing days
 *   7. listCrops — distinct sorted list
 *   8. resetToSeed — restores seed data
 *   9. localizeCrop — trilingual lookup
 *  10. Seed determinism — same seed produces same data
 *  11. Validation — invalid entries are dropped on read
 *
 * Run:  npm run test:domain   (or)   npx tsx scripts/test-market-price-store.ts
 */
import assert from 'node:assert/strict';
import {
  savePriceReport,
  getPriceReports,
  getAveragePrice,
  getPriceTrend,
  listCrops,
  getTotalReportCount,
  resetToSeed,
  localizeCrop,
  MARKET_CROPS,
  REPORTER_TYPE_LABELS,
  type MarketPriceReport,
} from '../src/lib/market-price-store';

// ---------------------------------------------------------------------------
// Minimal browser mock
// ---------------------------------------------------------------------------

class FakeLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null { return this.store[key] ?? null; }
  setItem(key: string, value: string): void { this.store[key] = value; }
  removeItem(key: string): void { delete this.store[key]; }
  clear(): void { this.store = {}; }
}

function installMockWindow(): FakeLocalStorage {
  const ls = new FakeLocalStorage();
  (globalThis as { window?: unknown }).window = {
    localStorage: ls,
    dispatchEvent() { return true; },
  } as unknown as Window & typeof globalThis;
  (globalThis as { localStorage?: unknown }).localStorage = ls;
  return ls;
}

function uninstallMockWindow() {
  delete (globalThis as { window?: unknown }).window;
  delete (globalThis as { localStorage?: unknown }).localStorage;
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean, detail?: string) {
  if (cond) { pass++; }
  else {
    console.error(`  ✗ ${label}${detail ? ': ' + detail : ''}`);
    fail++;
  }
}

// ---------------------------------------------------------------------------
// Test 1: SSR safety — all functions return safe defaults without window
// ---------------------------------------------------------------------------

console.log('Test 1: SSR safety');
uninstallMockWindow();
{
  let threw = false;
  try {
    const r = getPriceReports();
    ok('SSR getPriceReports returns []', Array.isArray(r) && r.length === 0);
    const s = getAveragePrice('potato');
    ok('SSR getAveragePrice returns zeros', s.count === 0 && s.avg === 0);
    const t = getPriceTrend('potato', 30);
    // SSR returns N points (with avg=0 due to forward-fill), not an empty array
    ok('SSR getPriceTrend returns 30 zeroed points', Array.isArray(t) && t.length === 30 && t.every(p => p.avg === 0));
    const c = listCrops();
    ok('SSR listCrops returns []', Array.isArray(c) && c.length === 0);
    ok('SSR getTotalReportCount returns 0', getTotalReportCount() === 0);
    // savePriceReport on SSR — should silently no-op (writeAll returns void)
    savePriceReport({
      id: '', crop: 'potato', priceDzdPerKg: 50, marketName: 'X', wilaya: 'Y',
      date: '2026-09-04', reporterType: 'farmer',
    });
    ok('SSR savePriceReport did not throw', true);
  } catch (e) {
    threw = true;
    console.error(`  ✗ SSR safety failed: ${e instanceof Error ? e.message : e}`);
    fail++;
  }
  if (!threw) { pass++; }
}

// ---------------------------------------------------------------------------
// Test 2: Seed data — first read populates localStorage with 50 reports
// ---------------------------------------------------------------------------

console.log('Test 2: Seed data');
{
  const ls = installMockWindow();
  try {
    ok('localStorage starts empty', ls.getItem('formula-atlas-market-prices-v1') === null);
    const reports = getPriceReports();
    ok('seed returns 50 reports', reports.length === 50, `length=${reports.length}`);
    ok('localStorage now populated', ls.getItem('formula-atlas-market-prices-v1') !== null);
    // Each report has all required fields
    const first = reports[0];
    ok('first report has id', typeof first.id === 'string' && first.id.length > 0);
    ok('first report has crop', typeof first.crop === 'string' && first.crop.length > 0);
    ok('first report has priceDzdPerKg', typeof first.priceDzdPerKg === 'number' && first.priceDzdPerKg > 0);
    ok('first report has marketName', typeof first.marketName === 'string');
    ok('first report has wilaya', typeof first.wilaya === 'string');
    ok('first report has date', /^\d{4}-\d{2}-\d{2}$/.test(first.date));
    ok('first report has reporterType', ['farmer', 'trader', 'extension_agent'].includes(first.reporterType));
    // All 10 crops represented
    const crops = new Set(reports.map(r => r.crop));
    ok('all 10 crops present in seed', crops.size === 10, `crops.size=${crops.size}`);
    // Sorted newest first
    let sortedDesc = true;
    for (let i = 1; i < reports.length; i++) {
      if (reports[i - 1].date < reports[i].date) { sortedDesc = false; break; }
    }
    ok('reports sorted newest first', sortedDesc);
    // Prices within reasonable ranges per crop
    for (const r of reports) {
      if (r.priceDzdPerKg < 1 || r.priceDzdPerKg > 1000) {
        ok(`price for ${r.crop} in range`, false, `price=${r.priceDzdPerKg}`);
        break;
      }
    }
  } finally {
    uninstallMockWindow();
  }
}

// ---------------------------------------------------------------------------
// Test 3: Seed determinism — same seed produces same data
// ---------------------------------------------------------------------------

console.log('Test 3: Seed determinism');
{
  installMockWindow();
  let first: MarketPriceReport[] = [];
  try {
    first = getPriceReports();
  } finally {
    uninstallMockWindow();
  }
  installMockWindow();
  let second: MarketPriceReport[] = [];
  try {
    second = getPriceReports();
  } finally {
    uninstallMockWindow();
  }
  ok('seed produces same length', first.length === second.length);
  // Same first 5 IDs
  const firstIds = first.slice(0, 5).map(r => r.id);
  const secondIds = second.slice(0, 5).map(r => r.id);
  ok('seed produces same IDs in same order', JSON.stringify(firstIds) === JSON.stringify(secondIds));
}

// ---------------------------------------------------------------------------
// Test 4: savePriceReport — adds to head, returns updated list
// ---------------------------------------------------------------------------

console.log('Test 4: savePriceReport');
{
  installMockWindow();
  try {
    const before = getPriceReports();
    const newReport: MarketPriceReport = {
      id: '',
      crop: 'potato',
      priceDzdPerKg: 75.5,
      marketName: 'Test Market',
      wilaya: 'El Oued',
      date: '2026-09-04',
      reporterType: 'farmer',
    };
    const after = savePriceReport(newReport);
    ok('after save: 1 more report', after.length === before.length + 1);
    ok('new report at head', after[0].crop === 'potato' && after[0].priceDzdPerKg === 75.5);
    ok('new report has generated id', typeof after[0].id === 'string' && after[0].id.length > 0);
    ok('new report id starts with r-', after[0].id.startsWith('r-'));
    // Original report not mutated
    ok('caller report id unchanged', newReport.id === '');
  } finally {
    uninstallMockWindow();
  }
}

// ---------------------------------------------------------------------------
// Test 5: savePriceReport with default date — uses today
// ---------------------------------------------------------------------------

console.log('Test 5: savePriceReport default date');
{
  installMockWindow();
  try {
    const today = new Date().toISOString().slice(0, 10);
    const after = savePriceReport({
      id: '', crop: 'tomato', priceDzdPerKg: 100, marketName: 'X', wilaya: 'Y',
      date: '', reporterType: 'farmer',
    });
    ok('empty date defaults to today', after[0].date === today);
  } finally {
    uninstallMockWindow();
  }
}

// ---------------------------------------------------------------------------
// Test 6: getPriceReports — filter by crop, case-insensitive
// ---------------------------------------------------------------------------

console.log('Test 6: getPriceReports filter');
{
  installMockWindow();
  try {
    const all = getPriceReports();
    const potatoOnly = getPriceReports('potato');
    ok('filter by "potato" returns subset', potatoOnly.length <= all.length && potatoOnly.length > 0);
    ok('all filtered are potato', potatoOnly.every(r => r.crop === 'potato'));
    // Case-insensitive
    const upper = getPriceReports('POTATO');
    ok('case-insensitive: "POTATO" matches "potato"', upper.length === potatoOnly.length);
    // Unknown crop → empty
    const unknown = getPriceReports('quinoa');
    ok('unknown crop returns []', unknown.length === 0);
  } finally {
    uninstallMockWindow();
  }
}

// ---------------------------------------------------------------------------
// Test 7: getAveragePrice — min/max/avg/count
// ---------------------------------------------------------------------------

console.log('Test 7: getAveragePrice');
{
  installMockWindow();
  try {
    const reports = getPriceReports('potato');
    const stats = getAveragePrice('potato');
    ok('count matches filtered length', stats.count === reports.length);
    const prices = reports.map(r => r.priceDzdPerKg);
    const expectedMin = Math.round(Math.min(...prices) * 100) / 100;
    const expectedMax = Math.round(Math.max(...prices) * 100) / 100;
    const expectedAvg = Math.round((prices.reduce((s, p) => s + p, 0) / prices.length) * 100) / 100;
    ok('min correct', stats.min === expectedMin, `got=${stats.min} expected=${expectedMin}`);
    ok('max correct', stats.max === expectedMax, `got=${stats.max} expected=${expectedMax}`);
    ok('avg correct', stats.avg === expectedAvg, `got=${stats.avg} expected=${expectedAvg}`);
    ok('min <= avg <= max', stats.min <= stats.avg && stats.avg <= stats.max);
    // Unknown crop → zeros
    const empty = getAveragePrice('quinoa');
    ok('unknown crop returns zeros', empty.count === 0 && empty.avg === 0 && empty.min === 0 && empty.max === 0);
  } finally {
    uninstallMockWindow();
  }
}

// ---------------------------------------------------------------------------
// Test 8: getPriceTrend — N days, forward-fill, back-fill
// ---------------------------------------------------------------------------

console.log('Test 8: getPriceTrend');
{
  installMockWindow();
  try {
    const trend = getPriceTrend('potato', 30);
    ok('trend returns 30 points', trend.length === 30, `length=${trend.length}`);
    ok('each point has date + avg', trend.every(p => /^\d{4}-\d{2}-\d{2}$/.test(p.date) && typeof p.avg === 'number'));
    // Forward-fill: no zero avg unless the entire crop has no data (which we know it does)
    const nonZero = trend.filter(p => p.avg > 0);
    ok('trend has at least some non-zero points', nonZero.length > 0);
    // Days clamped to 90 max
    const long = getPriceTrend('potato', 365);
    ok('days clamped to 90', long.length === 90);
    // Days clamped to 1 min
    const short = getPriceTrend('potato', 0);
    ok('days clamped to 1 min', short.length === 1);
    // Back-fill: first point should be non-zero (forward-filled from earliest data)
    // Note: this may legitimately be 0 if all data is in the future, which won't happen here
    ok('first trend point back-filled (non-zero)', trend[0].avg > 0, `avg=${trend[0].avg}`);
  } finally {
    uninstallMockWindow();
  }
}

// ---------------------------------------------------------------------------
// Test 9: listCrops — distinct sorted
// ---------------------------------------------------------------------------

console.log('Test 9: listCrops');
{
  installMockWindow();
  try {
    const crops = listCrops();
    ok('returns 10 crops', crops.length === 10, `length=${crops.length}`);
    // Sorted alphabetically
    let sorted = true;
    for (let i = 1; i < crops.length; i++) {
      if (crops[i - 1] > crops[i]) { sorted = false; break; }
    }
    ok('crops sorted alphabetically', sorted);
    // Distinct
    const set = new Set(crops);
    ok('crops are distinct', set.size === crops.length);
  } finally {
    uninstallMockWindow();
  }
}

// ---------------------------------------------------------------------------
// Test 10: resetToSeed — restores seed data, discarding user additions
// ---------------------------------------------------------------------------

console.log('Test 10: resetToSeed');
{
  installMockWindow();
  try {
    // Add a user report
    savePriceReport({
      id: '', crop: 'potato', priceDzdPerKg: 999, marketName: 'X', wilaya: 'Y',
      date: '2026-09-04', reporterType: 'farmer',
    });
    const before = getPriceReports();
    ok('user report added', before.length === 51 && before[0].priceDzdPerKg === 999);
    // Reset
    const after = resetToSeed();
    ok('after reset: 50 reports', after.length === 50);
    ok('after reset: user report gone', !after.some(r => r.priceDzdPerKg === 999));
  } finally {
    uninstallMockWindow();
  }
}

// ---------------------------------------------------------------------------
// Test 11: localizeCrop — trilingual
// ---------------------------------------------------------------------------

console.log('Test 11: localizeCrop');
{
  // localizeCrop is pure (doesn't touch window)
  ok('potato en', localizeCrop('en', 'potato') === 'Potato');
  ok('potato fr', localizeCrop('fr', 'potato') === 'Pomme de terre');
  ok('potato ar', localizeCrop('ar', 'potato') === 'البطاطا');
  ok('potato ar contains Arabic', /[\u0600-\u06FF]/.test(localizeCrop('ar', 'potato')));
  // Unknown crop → returns the id unchanged
  ok('unknown crop passes through', localizeCrop('en', 'quinoa') === 'quinoa');
  // All 10 MARKET_CROPS have all 3 languages
  for (const c of MARKET_CROPS) {
    ok(`${c.id} en non-empty`, c.en.length > 0);
    ok(`${c.id} fr non-empty`, c.fr.length > 0);
    ok(`${c.id} ar non-empty`, c.ar.length > 0 && /[\u0600-\u06FF]/.test(c.ar));
  }
  // REPORTER_TYPE_LABELS — all 3 types have all 3 languages
  for (const [type, labels] of Object.entries(REPORTER_TYPE_LABELS)) {
    ok(`${type} en`, labels.en.length > 0);
    ok(`${type} fr`, labels.fr.length > 0);
    ok(`${type} ar with Arabic`, labels.ar.length > 0 && /[\u0600-\u06FF]/.test(labels.ar));
  }
}

// ---------------------------------------------------------------------------
// Test 12: Validation — invalid entries dropped on read
// ---------------------------------------------------------------------------

console.log('Test 12: Validation on read');
{
  const ls = installMockWindow();
  try {
    // Manually inject a mix of valid + invalid entries
    const mixed = [
      { id: 'good-1', crop: 'potato', priceDzdPerKg: 50, marketName: 'X', wilaya: 'Y', date: '2026-09-04', reporterType: 'farmer' },
      null, // invalid
      { id: 'good-2', crop: 'tomato', priceDzdPerKg: 80, marketName: 'X', wilaya: 'Y', date: '2026-09-04', reporterType: 'trader' },
      { crop: 'missing-fields' }, // invalid — missing required fields
      { id: 'bad-price', crop: 'potato', priceDzdPerKg: 'not-a-number', marketName: 'X', wilaya: 'Y', date: '2026-09-04', reporterType: 'farmer' },
      { id: 'good-3', crop: 'onion', priceDzdPerKg: 40, marketName: 'X', wilaya: 'Y', date: '2026-09-04', reporterType: 'extension_agent' },
    ];
    ls.setItem('formula-atlas-market-prices-v1', JSON.stringify(mixed));
    const reports = getPriceReports();
    ok('only 3 valid reports returned', reports.length === 3, `length=${reports.length}`);
    ok('valid ids preserved', reports.map(r => r.id).sort().join(',') === 'good-1,good-2,good-3');
  } finally {
    uninstallMockWindow();
  }
}

// ---------------------------------------------------------------------------
// Test 13: getTotalReportCount
// ---------------------------------------------------------------------------

console.log('Test 13: getTotalReportCount');
{
  installMockWindow();
  try {
    const count = getTotalReportCount();
    ok('seed count is 50', count === 50, `count=${count}`);
    savePriceReport({
      id: '', crop: 'potato', priceDzdPerKg: 1, marketName: 'X', wilaya: 'Y',
      date: '2026-09-04', reporterType: 'farmer',
    });
    ok('count after add: 51', getTotalReportCount() === 51);
  } finally {
    uninstallMockWindow();
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\nMarket price store tests: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  process.exit(1);
}
