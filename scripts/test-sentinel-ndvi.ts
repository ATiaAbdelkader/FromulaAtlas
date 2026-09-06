/**
 * Sentinel NDVI tests (Feature #11)
 *
 * Verifies src/lib/sentinel-ndvi.ts:
 *
 *   1. SSR safety — fetchNdviSeries returns [] without window
 *   2. Atlas estimate fallback when no token configured
 *   3. Sentinel Hub fetch attempted when token is present (mock fetch)
 *   4. Sentinel Hub fetch failure → graceful fallback to Atlas
 *   5. NDVI values are within physical range [-1, 1]
 *   6. Source tag is correct ('sentinel' vs 'atlas_estimate')
 *   7. Confidence is set ('high' for sentinel, 'medium'/'low' for atlas)
 *   8. latestNdvi() and meanNdvi() helpers
 *   9. setSentinelHubToken + getSentinelHubConfig round-trip
 *  10. Days clamped to [1, 90]
 *  11. Crop profile selection (known vs unknown crop)
 *  12. buildSeriesFromMean produces N points with sentinel source
 *
 * Network is mocked — no real fetch calls are made.
 *
 * Run:  npm run test:domain   (or)   npx tsx scripts/test-sentinel-ndvi.ts
 */
import assert from 'node:assert/strict';
import {
  fetchNdviSeries,
  latestNdvi,
  meanNdvi,
  getSentinelHubConfig,
  setSentinelHubToken,
  type NdviData,
  type SentinelHubConfig,
} from '../src/lib/sentinel-ndvi';

// ---------------------------------------------------------------------------
// Browser mock — localStorage + fetch
// ---------------------------------------------------------------------------

class FakeLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null { return this.store[key] ?? null; }
  setItem(key: string, value: string): void { this.store[key] = value; }
  removeItem(key: string): void { delete this.store[key]; }
  clear(): void { this.store = {}; }
}

interface FetchMock {
  impl: (url: string, init?: RequestInit) => Promise<{ ok: boolean; status: number; arrayBuffer: () => Promise<ArrayBuffer>; json: () => Promise<unknown>; text: () => Promise<string> }>;
  calls: { url: string; init?: RequestInit }[];
}

function installMockWindow(fetchImpl?: FetchMock['impl']): FakeLocalStorage {
  const ls = new FakeLocalStorage();
  (globalThis as { window?: unknown }).window = {
    localStorage: ls,
    dispatchEvent() { return true; },
  } as unknown as Window & typeof globalThis;
  (globalThis as { localStorage?: unknown }).localStorage = ls;
  // Stub global fetch — by default fail fast (so tests don't hang on network)
  const defaultFetch = async () => {
    throw new Error('Network calls not allowed in tests');
  };
  const calls: { url: string; init?: RequestInit }[] = [];
  (globalThis as { fetch?: unknown }).fetch = async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    if (fetchImpl) return fetchImpl(url, init);
    return defaultFetch();
  };
  // Expose calls on globalThis for inspection
  (globalThis as { __fetchCalls?: { url: string; init?: RequestInit }[] }).__fetchCalls = calls;
  return ls;
}

function uninstallMockWindow() {
  delete (globalThis as { window?: unknown }).window;
  delete (globalThis as { localStorage?: unknown }).localStorage;
  delete (globalThis as { fetch?: unknown }).fetch;
  delete (globalThis as { __fetchCalls?: unknown }).__fetchCalls;
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

// Wrap entire test suite in an async IIFE because the tests use top-level await
// and the CJS transform doesn't support top-level await.
(async () => {

// ---------------------------------------------------------------------------
// Test 1: SSR safety
// ---------------------------------------------------------------------------

console.log('Test 1: SSR safety');
uninstallMockWindow();
{
  let threw = false;
  try {
    const series = await fetchNdviSeries(36.75, 3.05, 14, { crop: 'potato' });
    ok('SSR fetchNdviSeries returns []', Array.isArray(series) && series.length === 0);
  } catch (e) {
    threw = true;
    console.error(`  ✗ SSR safety failed: ${e instanceof Error ? e.message : e}`);
    fail++;
  }
  if (!threw) pass++;
  ok('SSR getSentinelHubConfig returns null', getSentinelHubConfig() === null);
}

// ---------------------------------------------------------------------------
// Test 2: Atlas estimate fallback (no token)
// ---------------------------------------------------------------------------

console.log('Test 2: Atlas estimate fallback');
{
  installMockWindow(); // no token, fetch fails fast
  try {
    const series = await fetchNdviSeries(33.5, 6.86, 14, { crop: 'potato' });
    ok('returns 14 points', series.length === 14, `length=${series.length}`);
    ok('all source=atlas_estimate', series.every(p => p.source === 'atlas_estimate'));
    ok('confidence is medium or low', series.every(p => p.confidence === 'medium' || p.confidence === 'low'));
    // NDVI in valid physical range
    ok('all NDVI in [-1, 1]', series.every(p => p.ndvi >= -1 && p.ndvi <= 1));
    // Dates are ISO YYYY-MM-DD, descending from today
    ok('dates are ISO', series.every(p => /^\d{4}-\d{2}-\d{2}$/.test(p.date)));
    // Points ordered oldest → newest (index 0 is daysAgo=13, last is daysAgo=0)
    const today = new Date().toISOString().slice(0, 10);
    ok('last point is today', series[series.length - 1].date === today);
  } finally {
    uninstallMockWindow();
  }
}

// ---------------------------------------------------------------------------
// Test 3: Sentinel Hub success path (mock fetch returns valid TIFF buffer)
// ---------------------------------------------------------------------------

console.log('Test 3: Sentinel Hub success path');
{
  // Build a fake TIFF-like buffer: first 4 bytes = float32 mean NDVI
  // We can't easily produce a real TIFF, but the code only reads the first
  // float32 from the buffer (line 184: view.getFloat32(0, true)).
  const buf = new ArrayBuffer(64);
  const view = new DataView(buf);
  view.setFloat32(0, 0.65, true); // mean NDVI = 0.65

  installMockWindow(async (url, init) => {
    // Verify it's a Sentinel Hub request
    ok('fetch URL is Sentinel Hub', url === 'https://services.sentinel-hub.com/api/v1/process', `url=${url}`);
    if (init) {
      const body = JSON.parse(init.body as string);
      ok('body has bbox', Array.isArray(body.input?.bounds?.bbox) && body.input.bounds.bbox.length === 4);
      ok('body has sentinel-2-l2a data type', body.input?.data?.[0]?.type === 'sentinel-2-l2a');
      ok('Authorization header set', (init.headers as Record<string, string>)?.Authorization?.startsWith('Bearer '));
    }
    return { ok: true, status: 200, arrayBuffer: async () => buf, json: async () => ({}), text: async () => '' };
  });
  try {
    setSentinelHubToken('test-token-abc');
    const series = await fetchNdviSeries(33.5, 6.86, 7, { crop: 'potato' });
    ok('returns 7 points', series.length === 7, `length=${series.length}`);
    ok('all source=sentinel', series.every(p => p.source === 'sentinel'));
    ok('all confidence=high', series.every(p => p.confidence === 'high'));
    ok('mean NDVI ≈ 0.65', Math.abs(meanNdvi(series) - 0.65) < 0.1, `mean=${meanNdvi(series)}`);
    // Verify fetch was called exactly once
    const calls = (globalThis as { __fetchCalls?: { url: string }[] }).__fetchCalls ?? [];
    ok('fetch called once', calls.length === 1, `calls=${calls.length}`);
  } finally {
    uninstallMockWindow();
  }
}

// ---------------------------------------------------------------------------
// Test 4: Sentinel Hub failure → graceful fallback to Atlas
// ---------------------------------------------------------------------------

console.log('Test 4: Sentinel Hub failure → fallback');
{
  // Sentinel returns 401 (bad token)
  installMockWindow(async () => {
    return { ok: false, status: 401, arrayBuffer: async () => new ArrayBuffer(0), json: async () => ({}), text: async () => '' };
  });
  try {
    setSentinelHubToken('bad-token');
    const series = await fetchNdviSeries(33.5, 6.86, 7, { crop: 'potato' });
    ok('still returns 7 points (fallback)', series.length === 7);
    ok('all source=atlas_estimate (fallback)', series.every(p => p.source === 'atlas_estimate'));
  } finally {
    uninstallMockWindow();
  }
}

// ---------------------------------------------------------------------------
// Test 5: Sentinel Hub network error → fallback
// ---------------------------------------------------------------------------

console.log('Test 5: Sentinel Hub network error → fallback');
{
  installMockWindow(async () => { throw new Error('CORS blocked'); });
  try {
    setSentinelHubToken('test-token');
    const series = await fetchNdviSeries(33.5, 6.86, 5, { crop: 'wheat' });
    ok('network error falls back to atlas', series.length === 5 && series.every(p => p.source === 'atlas_estimate'));
  } finally {
    uninstallMockWindow();
  }
}

// ---------------------------------------------------------------------------
// Test 6: Days clamping
// ---------------------------------------------------------------------------

console.log('Test 6: Days clamping');
{
  installMockWindow();
  try {
    const tooMany = await fetchNdviSeries(33.5, 6.86, 365, { crop: 'potato' });
    ok('days clamped to 90 max', tooMany.length === 90, `length=${tooMany.length}`);
    const tooFew = await fetchNdviSeries(33.5, 6.86, 0, { crop: 'potato' });
    ok('days clamped to 1 min', tooFew.length === 1);
    const negative = await fetchNdviSeries(33.5, 6.86, -5, { crop: 'potato' });
    ok('negative days clamped to 1', negative.length === 1);
  } finally {
    uninstallMockWindow();
  }
}

// ---------------------------------------------------------------------------
// Test 7: latestNdvi() helper
// ---------------------------------------------------------------------------

console.log('Test 7: latestNdvi helper');
{
  const series: NdviData[] = [
    { date: '2026-09-01', ndvi: 0.4, source: 'atlas_estimate', confidence: 'medium' },
    { date: '2026-09-02', ndvi: 0.5, source: 'atlas_estimate', confidence: 'medium' },
    { date: '2026-09-03', ndvi: 0.6, source: 'atlas_estimate', confidence: 'medium' },
  ];
  const latest = latestNdvi(series);
  ok('latest is last point', latest?.date === '2026-09-03' && latest?.ndvi === 0.6);
  ok('empty series returns null', latestNdvi([]) === null);
}

// ---------------------------------------------------------------------------
// Test 8: meanNdvi() helper
// ---------------------------------------------------------------------------

console.log('Test 8: meanNdvi helper');
{
  const series: NdviData[] = [
    { date: '2026-09-01', ndvi: 0.4, source: 'atlas_estimate', confidence: 'medium' },
    { date: '2026-09-02', ndvi: 0.6, source: 'atlas_estimate', confidence: 'medium' },
  ];
  ok('mean = 0.5', meanNdvi(series) === 0.5);
  ok('empty series returns 0', meanNdvi([]) === 0);
  // NaN values are treated as 0
  const withNaN: NdviData[] = [
    { date: '2026-09-01', ndvi: NaN, source: 'atlas_estimate', confidence: 'medium' },
    { date: '2026-09-02', ndvi: 0.4, source: 'atlas_estimate', confidence: 'medium' },
  ];
  ok('NaN treated as 0', meanNdvi(withNaN) === 0.2);
}

// ---------------------------------------------------------------------------
// Test 9: setSentinelHubToken + getSentinelHubConfig round-trip
// ---------------------------------------------------------------------------

console.log('Test 9: token config round-trip');
{
  installMockWindow();
  try {
    ok('no token by default', getSentinelHubConfig() === null);
    setSentinelHubToken('my-secret-token');
    const cfg = getSentinelHubConfig();
    ok('token round-trips', cfg?.token === 'my-secret-token');
    ok('default collection is sentinel-2-l2a', cfg?.collection === 'sentinel-2-l2a');
    setSentinelHubToken('other-token', 'sentinel-1-grd');
    const cfg2 = getSentinelHubConfig();
    ok('custom collection persisted', cfg2?.collection === 'sentinel-1-grd');
    // Clear
    setSentinelHubToken('');
    ok('cleared token returns null', getSentinelHubConfig() === null);
  } finally {
    uninstallMockWindow();
  }
}

// ---------------------------------------------------------------------------
// Test 10: Crop profile affects NDVI range
// ---------------------------------------------------------------------------

console.log('Test 10: Crop profile affects NDVI');
{
  installMockWindow();
  try {
    // Citrus has high baseline (0.45) — NDVI should never go very low
    const citrus = await fetchNdviSeries(33.5, 6.86, 30, { crop: 'citrus' });
    const citrusMin = Math.min(...citrus.map(p => p.ndvi));
    ok('citrus NDVI stays high (>0.3)', citrusMin > 0.3, `min=${citrusMin}`);

    // Wheat in September (off-season, since wheat season is Nov-Jun) — should be near baseline
    const wheat = await fetchNdviSeries(33.5, 6.86, 30, { crop: 'wheat' });
    const wheatAvg = meanNdvi(wheat);
    ok('wheat off-season (Sep) NDVI near baseline', wheatAvg < 0.4, `avg=${wheatAvg}`);

    // Unknown crop uses default profile — should still produce valid NDVI
    const unknown = await fetchNdviSeries(33.5, 6.86, 7, { crop: 'quinoa' });
    ok('unknown crop produces valid NDVI', unknown.length === 7 && unknown.every(p => p.ndvi >= -1 && p.ndvi <= 1));
  } finally {
    uninstallMockWindow();
  }
}

// ---------------------------------------------------------------------------
// Test 11: Latitude affects NDVI baseline
// ---------------------------------------------------------------------------

console.log('Test 11: Latitude affects NDVI');
{
  installMockWindow();
  try {
    // Tropical latitude (close to equator) — should have higher baseline NDVI
    const tropical = await fetchNdviSeries(5, 20, 14, { crop: 'maize' });
    // High latitude (far north) — should have lower baseline NDVI
    const northern = await fetchNdviSeries(60, 10, 14, { crop: 'maize' });
    const tropAvg = meanNdvi(tropical);
    const northAvg = meanNdvi(northern);
    // Both should be valid NDVI
    ok('tropical NDVI valid', tropical.every(p => p.ndvi >= -1 && p.ndvi <= 1));
    ok('northern NDVI valid', northern.every(p => p.ndvi >= -1 && p.ndvi <= 1));
    // Tropical should generally have higher NDVI than northern (especially in fall when northern is off-season)
    // Note: this is a soft assertion because rainfall may shift things
    ok('tropical avg > northern avg (latitude effect)', tropAvg >= northAvg, `trop=${tropAvg} north=${northAvg}`);
  } finally {
    uninstallMockWindow();
  }
}

// ---------------------------------------------------------------------------
// Test 12: Determinism — same inputs produce same series (atlas estimate)
// ---------------------------------------------------------------------------

console.log('Test 12: Determinism');
{
  installMockWindow();
  let first: NdviData[] = [];
  let second: NdviData[] = [];
  try {
    first = await fetchNdviSeries(33.5, 6.86, 7, { crop: 'potato' });
  } finally {
    uninstallMockWindow();
  }
  installMockWindow();
  try {
    second = await fetchNdviSeries(33.5, 6.86, 7, { crop: 'potato' });
  } finally {
    uninstallMockWindow();
  }
  // Compare NDVI values (dates may differ if we cross midnight, but within same minute they should match)
  const firstNdvis = first.map(p => p.ndvi);
  const secondNdvis = second.map(p => p.ndvi);
  ok('deterministic NDVI values', JSON.stringify(firstNdvis) === JSON.stringify(secondNdvis));
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\nSentinel NDVI tests: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  process.exit(1);
}
})();

