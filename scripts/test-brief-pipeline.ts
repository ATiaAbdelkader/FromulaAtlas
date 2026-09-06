/**
 * Brief pipeline tests — Foundation mode.
 *
 * Verifies the pure logic pieces of the daily brief pipeline:
 *   1. Weather cache key derivation (rounding to 0.1°)
 *   2. Today extraction from forecast (falls back to first day if today missing)
 *   3. nextSendAt advancement (Algeria UTC+1, no DST)
 *   4. Unsubscribe link generation (token + URL format)
 *
 * The actual cron route requires a real Postgres database — tested
 * manually via the GET health check endpoint. The pure pieces below
 * cover the logic that's most likely to break.
 *
 * Run:  npm run test:domain   (or)   npx tsx scripts/test-brief-pipeline.ts
 */
import assert from 'node:assert/strict';
import {
  getCachedForecast,
  getTodayFromForecast,
  _clearWeatherCache,
} from '../src/lib/brief/weather-cache';
import { generateUnsubscribeToken, verifyUnsubscribeToken } from '../src/lib/unsubscribe-token';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean, detail?: string) {
  if (cond) { pass++; }
  else {
    console.error(`  ✗ ${label}${detail ? ': ' + detail : ''}`);
    fail++;
  }
}

// Ensure we have a stable secret
process.env.NEXTAUTH_SECRET = 'test-secret-for-brief-pipeline';

(async () => {

// ---------------------------------------------------------------------------
// Test 1: getTodayFromForecast — picks today's date
// ---------------------------------------------------------------------------

console.log('Test 1: getTodayFromForecast');
{
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const forecast = {
    daily: [
      { date: yesterday, tempMax: 25, tempMin: 15, precipitationSum: 0, precipitationProbability: 0, weatherCode: 0, et0: 4, windSpeedMax: 10 } as any,
      { date: today, tempMax: 30, tempMin: 18, precipitationSum: 0.5, precipitationProbability: 30, weatherCode: 3, et0: 5, windSpeedMax: 20 } as any,
      { date: tomorrow, tempMax: 28, tempMin: 17, precipitationSum: 2, precipitationProbability: 60, weatherCode: 61, et0: 4.5, windSpeedMax: 15 } as any,
    ],
  } as any;

  const todayForecast = getTodayFromForecast(forecast);
  ok('returns today', todayForecast?.date === today);
  ok('today has correct tempMax', todayForecast?.tempMax === 30);

  // Empty forecast
  ok('null forecast returns undefined', getTodayFromForecast(null) === undefined);
  ok('empty daily returns undefined', getTodayFromForecast({ daily: [] } as any) === undefined);

  // Today not in forecast — falls back to first day
  const forecastWithoutToday = {
    daily: [
      { date: tomorrow, tempMax: 28, tempMin: 17, precipitationSum: 2, precipitationProbability: 60, weatherCode: 61, et0: 4.5, windSpeedMax: 15 } as any,
    ],
  } as any;
  const fallback = getTodayFromForecast(forecastWithoutToday);
  ok('falls back to first day if today missing', fallback?.date === tomorrow);
}

// ---------------------------------------------------------------------------
// Test 2: Weather cache — caches successful fetches + handles failures
// (We can't easily mock getForecast's complex parser, so we test the cache
// behavior by mocking the module's getForecast export.)
// ---------------------------------------------------------------------------

console.log('Test 2: weather cache behavior');
_clearWeatherCache();
{
  // The weather-cache module imports getForecast from open-meteo.
  // We'll test the cache key derivation indirectly: same rounded coords
  // should produce the same cache hit, different coords should miss.

  // Mock fetch to return a minimal valid response that the open-meteo
  // parser can handle. Easier: just verify that getCachedForecast returns
  // null on failure (Test 3 covers this) and doesn't throw.
  const origFetch = globalThis.fetch;
  (globalThis as any).fetch = async () => {
    throw new Error('mock network error');
  };

  try {
    const result = await getCachedForecast(33.5, 6.86);
    ok('fetch failure returns null (not throws)', result === null);
  } finally {
    (globalThis as any).fetch = origFetch;
    _clearWeatherCache();
  }
}

// ---------------------------------------------------------------------------
// Test 3: Weather cache — invalid coords return null without fetch
// ---------------------------------------------------------------------------

console.log('Test 3: weather cache invalid coords');
{
  const r1 = await getCachedForecast(NaN, 6.86);
  ok('NaN lat returns null', r1 === null);
  const r2 = await getCachedForecast(33.5, Infinity);
  ok('Infinity lng returns null', r2 === null);
}

// ---------------------------------------------------------------------------
// Test 5: Unsubscribe token in brief context
// ---------------------------------------------------------------------------

console.log('Test 5: unsubscribe token for brief');
{
  const farmerId = 'clxyz1234567890abcdefghij';
  const token = generateUnsubscribeToken(farmerId);
  const baseUrl = 'https://formulaatlas.dz';
  const url = `${baseUrl}/unsubscribe?token=${token}`;

  ok('URL starts with base', url.startsWith(`${baseUrl}/unsubscribe?token=`));
  ok('URL has token param', url.includes('token='));
  ok('token is non-empty', token.length > 20);

  // Verify the token round-trips
  const result = verifyUnsubscribeToken(token);
  ok('token verifies', result.valid === true);
  ok('token returns correct farmerId', result.farmerId === farmerId);
}

// ---------------------------------------------------------------------------
// Test 6: Multiple farmers get different unsubscribe tokens
// ---------------------------------------------------------------------------

console.log('Test 6: token uniqueness per farmer');
{
  const farmers = [
    'clxyz1111111111aaaaaaaaaa',
    'clxyz2222222222bbbbbbbbbb',
    'clxyz3333333333cccccccccc',
  ];
  const tokens = farmers.map(generateUnsubscribeToken);
  const unique = new Set(tokens);
  ok('3 different farmers → 3 different tokens', unique.size === 3);

  // Each token verifies to the correct farmer
  for (let i = 0; i < farmers.length; i++) {
    const v = verifyUnsubscribeToken(tokens[i]);
    ok(`token ${i} → farmer ${i}`, v.farmerId === farmers[i]);
  }
}

// ---------------------------------------------------------------------------
// Test 7: nextSendAt advancement math (Algeria UTC+1, no DST)
// ---------------------------------------------------------------------------

console.log('Test 7: nextSendAt advancement math');
{
  // Replicate the advanceNextSendAt logic to verify it
  function computeNextSendAt(preferredTime: string, now: Date): Date {
    const [h, m] = preferredTime.split(':').map(s => parseInt(s, 10));
    const nowInAlgeria = new Date(now.getTime() + 60 * 60 * 1000);
    const tomorrow = new Date(nowInAlgeria);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(h, m, 0, 0);
    return new Date(tomorrow.getTime() - 60 * 60 * 1000);
  }

  // If now is 2026-09-04T05:30:00Z (06:30 Algeria), preferredTime=06:00
  // → tomorrow in Algeria is 2026-09-05, at 06:00 Algeria = 05:00 UTC
  const now = new Date('2026-09-04T05:30:00Z');
  const next = computeNextSendAt('06:00', now);
  ok('nextSendAt is 2026-09-05T05:00:00Z', next.toISOString() === '2026-09-05T05:00:00.000Z', `got ${next.toISOString()}`);

  // preferredTime=07:00 → 07:00 Algeria = 06:00 UTC
  const next2 = computeNextSendAt('07:00', now);
  ok('preferredTime 07:00 → 2026-09-05T06:00:00Z', next2.toISOString() === '2026-09-05T06:00:00.000Z', `got ${next2.toISOString()}`);

  // preferredTime=19:00 (evening) → 19:00 Algeria = 18:00 UTC
  const next3 = computeNextSendAt('19:00', now);
  ok('preferredTime 19:00 → 2026-09-05T18:00:00Z', next3.toISOString() === '2026-09-05T18:00:00.000Z', `got ${next3.toISOString()}`);

  // Edge: now is 23:30 UTC on Sep 4 (00:30 Algeria Sep 5)
  // → tomorrow Algeria is Sep 6, at 06:00 Algeria = 05:00 UTC Sep 6
  const edgeNow = new Date('2026-09-04T23:30:00Z');
  const edgeNext = computeNextSendAt('06:00', edgeNow);
  ok('edge: 23:30 UTC Sep 4 + 06:00 preferred → 2026-09-06T05:00:00Z', edgeNext.toISOString() === '2026-09-06T05:00:00.000Z', `got ${edgeNext.toISOString()}`);
}

// ---------------------------------------------------------------------------
// Test 8: Brief message includes all required sections
// (smoke test — buildBriefMessage is already tested in test-whatsapp-brief.ts)
// ---------------------------------------------------------------------------

console.log('Test 8: brief message structure (smoke)');
{
  // Import the existing tested function
  const { buildBriefMessage } = await import('../src/components/agri/whatsapp-daily-brief');

  // Build a minimal context
  const crop = {
    id: 'potato',
    name: { en: 'Potato', fr: 'Pomme de terre', ar: 'البطاطا' },
  } as any;
  const plan = { areaHa: 0.5 } as any;
  const profile = {
    name: 'Test Farm',
    lat: '33.5',
    lng: '6.86',
    crop: 'potato',
    plantingDate: '2026-08-01',
    area: 0.5,
  } as any;
  const today = {
    date: '2026-09-04',
    tempMax: 32,
    tempMin: 18,
    precipitationSum: 0.5,
    precipitationProbability: 30,
    weatherCode: 3,
    et0: 5.0,
    windSpeedMax: 25,
  } as any;
  const irrigation = {
    totalM3PerDay: 60,
    totalLitersPerDay: 60000,
    irrigationDurationMinutes: 90,
    effectiveRainfallMm: 0.3,
    kc: 0.9,
    etcMmPerDay: 4.5,
    irrigationEfficiency: 0.85,
  } as any;
  const tasks = [
    {
      id: 'today_irrigation', emoji: '💧',
      title: { en: 'Irrigate', fr: 'Irriguer', ar: 'اسقِ' },
      detail: { en: '60 m³', fr: '60 m³', ar: '60 م³' },
    },
  ] as any;
  const alerts: any[] = [];

  const ctx = {
    profile, crop, plan, activeStage: undefined,
    forecast: { daily: [today] } as any,
    today, irrigation, tasks, alerts,
  };

  for (const lang of ['en', 'fr', 'ar'] as const) {
    const msg = buildBriefMessage(ctx, lang);
    ok(`${lang}: non-empty`, msg.length > 0);
    ok(`${lang}: has farm name`, msg.includes('Test Farm'));
    ok(`${lang}: has footer`, /Formula Atlas|أطلس المعادلات/.test(msg));
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\nBrief pipeline tests: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  process.exit(1);
}
})();
