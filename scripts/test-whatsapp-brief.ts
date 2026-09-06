/**
 * WhatsApp Daily Brief tests (Feature #7)
 *
 * Verifies the message-building helpers exported from
 * src/components/agri/whatsapp-daily-brief.tsx:
 *
 *   1. timeGreeting — morning/afternoon/evening in 3 languages
 *   2. pick — trilingual string selector
 *   3. findWilaya — closest wilaya by lat/lng
 *   4. wilayaName — localized wilaya name
 *   5. detectAlerts — frost/heat/wind thresholds
 *   6. alertLabel — trilingual alert messages with date
 *   7. buildBriefMessage — full message structure (greeting, weather,
 *      irrigation, tasks, alerts, footer)
 *   8. Trilingual coverage — Arabic messages actually contain Arabic chars
 *   9. No "End of Report" / "Document Ends" markers
 *  10. Empty/missing data — message gracefully degrades
 *
 * Run:  npm run test:domain   (or)   npx tsx scripts/test-whatsapp-brief.ts
 */
import assert from 'node:assert/strict';
import {
  timeGreeting,
  pick,
  findWilaya,
  wilayaName,
  detectAlerts,
  alertLabel,
  buildBriefMessage,
  type WeatherAlert,
  type BriefContext,
} from '../src/components/agri/whatsapp-daily-brief';
import type { DailyForecast } from '../src/lib/open-meteo';
import type { FarmProfile } from '../src/components/agri/farm-profile-wizard';

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
// Test 1: timeGreeting
// ---------------------------------------------------------------------------

console.log('Test 1: timeGreeting');
{
  const morning = new Date('2026-09-04T07:30:00');
  const afternoon = new Date('2026-09-04T15:30:00');
  const evening = new Date('2026-09-04T20:30:00');

  // English
  ok('morning en', timeGreeting('en', morning) === 'Good morning');
  ok('afternoon en', timeGreeting('en', afternoon) === 'Good afternoon');
  ok('evening en', timeGreeting('en', evening) === 'Good evening');
  // French
  ok('morning fr', timeGreeting('fr', morning) === 'Bonjour');
  ok('afternoon fr', timeGreeting('fr', afternoon) === 'Bon après-midi');
  ok('evening fr', timeGreeting('fr', evening) === 'Bonsoir');
  // Arabic — must contain Arabic chars
  ok('morning ar has Arabic', /[\u0600-\u06FF]/.test(timeGreeting('ar', morning)));
  ok('afternoon ar has Arabic', /[\u0600-\u06FF]/.test(timeGreeting('ar', afternoon)));
  ok('evening ar has Arabic', /[\u0600-\u06FF]/.test(timeGreeting('ar', evening)));

  // Boundary: 11:59 → morning, 12:00 → afternoon
  const noon = new Date('2026-09-04T12:00:00');
  ok('noon is afternoon', timeGreeting('en', noon) === 'Good afternoon');
  const oneMinBeforeNoon = new Date('2026-09-04T11:59:00');
  ok('11:59 is morning', timeGreeting('en', oneMinBeforeNoon) === 'Good morning');
  // Boundary: 16:59 → afternoon, 17:00 → evening
  const fivePm = new Date('2026-09-04T17:00:00');
  ok('17:00 is evening', timeGreeting('en', fivePm) === 'Good evening');
}

// ---------------------------------------------------------------------------
// Test 2: pick
// ---------------------------------------------------------------------------

console.log('Test 2: pick');
{
  const trilingual = { en: 'Hello', fr: 'Bonjour', ar: 'مرحبا' };
  ok('pick en', pick('en', trilingual) === 'Hello');
  ok('pick fr', pick('fr', trilingual) === 'Bonjour');
  ok('pick ar', pick('ar', trilingual) === 'مرحبا');
}

// ---------------------------------------------------------------------------
// Test 3: findWilaya
// ---------------------------------------------------------------------------

console.log('Test 3: findWilaya');
{
  // El Oued (33.5, 6.86) → should be El Oued wilaya
  const profile1: FarmProfile = {
    name: 'Test',
    crop: 'potato',
    plantingDate: '2026-08-01',
    area: 0.5,
    lat: '33.5',
    lng: '6.86',
  };
  const w1 = findWilaya(profile1);
  ok('El Oued coords return a wilaya', w1 !== undefined);
  if (w1) {
    ok('wilaya name is non-empty', w1.nameEn.length > 0);
    ok('wilaya has Arabic name', /[\u0600-\u06FF]/.test(w1.nameAr));
  }

  // Algiers (36.75, 3.05) → Alger
  const profile2: FarmProfile = {
    name: 'Test',
    crop: 'potato',
    plantingDate: '2026-08-01',
    area: 0.5,
    lat: '36.75',
    lng: '3.05',
  };
  const w2 = findWilaya(profile2);
  ok('Algiers coords return Algiers wilaya', w2?.nameEn === 'Algiers');

  // Missing lat/lng → undefined
  const profile3: FarmProfile = {
    name: 'Test',
    crop: 'potato',
    plantingDate: '2026-08-01',
    area: 0.5,
  };
  ok('missing coords return undefined', findWilaya(profile3) === undefined);

  // Invalid lat/lng (NaN) → undefined
  const profile4: FarmProfile = {
    name: 'Test',
    crop: 'potato',
    plantingDate: '2026-08-01',
    area: 0.5,
    lat: 'not-a-number',
    lng: 'also-bad',
  };
  ok('invalid coords return undefined', findWilaya(profile4) === undefined);
}

// ---------------------------------------------------------------------------
// Test 4: wilayaName
// ---------------------------------------------------------------------------

console.log('Test 4: wilayaName');
{
  const profile: FarmProfile = {
    name: 'Test', crop: 'potato', plantingDate: '2026-08-01', area: 0.5,
    lat: '36.75', lng: '3.05',
  };
  const w = findWilaya(profile);
  ok('en name', wilayaName('en', w) === 'Algiers');
  ok('fr name non-empty', wilayaName('fr', w).length > 0);
  ok('ar name has Arabic', /[\u0600-\u06FF]/.test(wilayaName('ar', w)));
  ok('undefined wilaya returns empty string', wilayaName('en', undefined) === '');
}

// ---------------------------------------------------------------------------
// Test 5: detectAlerts
// ---------------------------------------------------------------------------

console.log('Test 5: detectAlerts');
{
  const daily: DailyForecast[] = [
    { date: '2026-09-04', tempMax: 35, tempMin: 18, precipitationSum: 0, precipitationProbability: 0, weatherCode: 0, et0: 5.0, windSpeedMax: 30 } as DailyForecast,
    { date: '2026-09-05', tempMax: 40, tempMin: 22, precipitationSum: 0, precipitationProbability: 0, weatherCode: 0, et0: 6.0, windSpeedMax: 25 } as DailyForecast,
    { date: '2026-09-06', tempMax: 25, tempMin: 1, precipitationSum: 0, precipitationProbability: 0, weatherCode: 0, et0: 4.0, windSpeedMax: 15 } as DailyForecast,
    { date: '2026-09-07', tempMax: 30, tempMin: 18, precipitationSum: 0, precipitationProbability: 0, weatherCode: 0, et0: 5.0, windSpeedMax: 60 } as DailyForecast,
  ];

  const alerts = detectAlerts(daily);
  // slice(0, 3) means only days 1-3 are checked. Day 1 has no alert, day 2 has
  // heat, day 3 has frost. Day 4 (wind) is NOT checked.
  ok('detects 2 alerts in first 3 days (heat + frost)', alerts.length === 2, `length=${alerts.length}`);
  ok('first alert is heat', alerts[0].kind === 'heat');
  ok('second alert is frost', alerts[1].kind === 'frost');

  // Wind on day 4 is NOT detected (beyond slice(0, 3))
  ok('wind on day 4 not detected (beyond slice)', !alerts.some(a => a.kind === 'wind'));

  // Only checks first 3 days — 4th day with wind should NOT be detected
  // Actually 4th day has wind but slice(0, 3) skips it — verify
  const only3Days = daily.slice(0, 3);
  ok('only first 3 days checked', detectAlerts(only3Days).length === 2);

  // Empty input
  ok('empty input returns []', detectAlerts([]).length === 0);
  ok('undefined input returns []', detectAlerts(undefined).length === 0);

  // Threshold boundaries
  const exactFrost: DailyForecast[] = [
    { date: '2026-09-04', tempMax: 15, tempMin: 2, precipitationSum: 0, precipitationProbability: 0, weatherCode: 0, et0: 4.0, windSpeedMax: 20 } as DailyForecast,
  ];
  ok('tempMin=2 is NOT frost (strict <)', detectAlerts(exactFrost).length === 0);
  const belowFrost: DailyForecast[] = [
    { date: '2026-09-04', tempMax: 15, tempMin: 1.9, precipitationSum: 0, precipitationProbability: 0, weatherCode: 0, et0: 4.0, windSpeedMax: 20 } as DailyForecast,
  ];
  ok('tempMin=1.9 IS frost', detectAlerts(belowFrost).length === 1);

  const exactHeat: DailyForecast[] = [
    { date: '2026-09-04', tempMax: 38, tempMin: 20, precipitationSum: 0, precipitationProbability: 0, weatherCode: 0, et0: 4.0, windSpeedMax: 20 } as DailyForecast,
  ];
  ok('tempMax=38 IS heat (>=)', detectAlerts(exactHeat).length === 1);

  const exactWind: DailyForecast[] = [
    { date: '2026-09-04', tempMax: 25, tempMin: 18, precipitationSum: 0, precipitationProbability: 0, weatherCode: 0, et0: 4.0, windSpeedMax: 50 } as DailyForecast,
  ];
  ok('windSpeedMax=50 IS wind (>=)', detectAlerts(exactWind).length === 1);
}

// ---------------------------------------------------------------------------
// Test 6: alertLabel — trilingual
// ---------------------------------------------------------------------------

console.log('Test 6: alertLabel');
{
  const frostAlert: WeatherAlert = {
    kind: 'frost',
    day: { date: '2026-09-04', tempMax: 15, tempMin: 1.5, precipitationSum: 0, precipitationProbability: 0, weatherCode: 0, et0: 4.0, windSpeedMax: 20 } as DailyForecast,
  };
  const enFrost = alertLabel('en', frostAlert);
  ok('en frost contains "FROST"', /FROST/i.test(enFrost));
  ok('en frost contains temp', enFrost.includes('1.5'));
  ok('en frost contains "protect"', /protect/i.test(enFrost));

  const arFrost = alertLabel('ar', frostAlert);
  ok('ar frost has Arabic', /[\u0600-\u06FF]/.test(arFrost));
  ok('ar frost contains temp', arFrost.includes('1.5'));

  const frFrost = alertLabel('fr', frostAlert);
  ok('fr frost contains "GEL"', /GEL/i.test(frFrost));

  // Heat
  const heatAlert: WeatherAlert = {
    kind: 'heat',
    day: { date: '2026-09-04', tempMax: 40, tempMin: 22, precipitationSum: 0, precipitationProbability: 0, weatherCode: 0, et0: 4.0, windSpeedMax: 20 } as DailyForecast,
  };
  ok('en heat contains "HEAT"', /HEAT/i.test(alertLabel('en', heatAlert)));
  ok('ar heat has Arabic', /[\u0600-\u06FF]/.test(alertLabel('ar', heatAlert)));

  // Wind
  const windAlert: WeatherAlert = {
    kind: 'wind',
    day: { date: '2026-09-04', tempMax: 25, tempMin: 18, precipitationSum: 0, precipitationProbability: 0, weatherCode: 0, et0: 4.0, windSpeedMax: 65 } as DailyForecast,
  };
  ok('en wind contains "WIND"', /WIND/i.test(alertLabel('en', windAlert)));
  ok('en wind contains "65"', alertLabel('en', windAlert).includes('65'));
}

// ---------------------------------------------------------------------------
// Test 7: buildBriefMessage — full structure
// ---------------------------------------------------------------------------

console.log('Test 7: buildBriefMessage structure');

// Build a minimal but complete BriefContext
function makeCtx(overrides: Partial<BriefContext> = {}): BriefContext {
  // We need a FarmPilotCrop. Since we don't want to import farmpilot-data
  // here (heavy), construct the minimum shape buildBriefMessage touches.
  const crop = {
    id: 'potato',
    name: { en: 'Potato', fr: 'Pomme de terre', ar: 'البطاطا' },
  } as BriefContext['crop'];
  const plan = {
    areaHa: 0.5,
  } as BriefContext['plan'];
  const profile: FarmProfile = {
    name: 'Test Farm',
    crop: 'potato',
    plantingDate: '2026-08-01',
    area: 0.5,
    lat: '33.5',
    lng: '6.86',
  };
  const today: DailyForecast = {
    date: '2026-09-04', tempMax: 32, tempMin: 18, precipitationSum: 0.5,
    precipitationProbability: 30, weatherCode: 3, et0: 5.0, windSpeedMax: 25,
  } as DailyForecast;
  const irrigation = {
    totalM3PerDay: 60,
    totalLitersPerDay: 60000,
    irrigationDurationMinutes: 90,
    effectiveRainfallMm: 0.3,
    kc: 0.9,
    etcMmPerDay: 4.5,
    irrigationEfficiency: 0.85,
  } as BriefContext['irrigation'];
  const tasks: BriefContext['tasks'] = [
    {
      id: 'today_irrigation', emoji: '💧',
      title: { en: 'Irrigate 60 m³', fr: 'Irriguer 60 m³', ar: 'اسقِ 60 م³' },
      detail: { en: 'Drip 90 min', fr: 'Goutte 90 min', ar: 'تنقيط 90 دقيقة' },
    },
    {
      id: 'today_fertilization', emoji: '🧪',
      title: { en: 'Apply NPK 15-15-15', fr: 'Appliquer NPK 15-15-15', ar: 'طبّق NPK 15-15-15' },
      detail: { en: '350 kg/ha', fr: '350 kg/ha', ar: '350 كغ/هكتار' },
    },
    {
      id: 'today_scout', emoji: '👁',
      title: { en: 'Scout for aphids', fr: 'Scouter pucerons', ar: 'كشف عن المن' },
      detail: { en: '10 plants', fr: '10 plantes', ar: '10 نباتات' },
    },
  ] as BriefContext['tasks'];
  const alerts: WeatherAlert[] = [];

  return {
    profile, crop, plan, activeStage: undefined,
    forecast: { daily: [today] } as BriefContext['forecast'],
    today, irrigation, tasks, alerts,
    ...overrides,
  };
}

for (const lang of ['en', 'fr', 'ar'] as const) {
  const ctx = makeCtx();
  const msg = buildBriefMessage(ctx, lang);

  ok(`${lang}: message is non-empty`, msg.length > 0);
  ok(`${lang}: contains farm name`, msg.includes('Test Farm'));
  ok(`${lang}: contains crop name`, /Potato|Pomme de terre|البطاطا/.test(msg));
  ok(`${lang}: contains weather section`, /Today['\u2019]s Weather|Météo du jour|طقس اليوم/.test(msg));
  ok(`${lang}: contains irrigation section`, /Irrigation Today|Irrigation du jour|ري اليوم/.test(msg));
  ok(`${lang}: contains tasks section`, /Top Tasks Today|Priorités du jour|أهم مهام اليوم/.test(msg));
  ok(`${lang}: contains temp range`, msg.includes('32') && msg.includes('18'));
  ok(`${lang}: contains irrigation volume`, msg.includes('60 m³'));
  ok(`${lang}: contains "Formula Atlas" footer`, /Formula Atlas|أطلس المعادلات/.test(msg));

  // Arabic must contain Arabic characters
  if (lang === 'ar') {
    ok('ar: message has substantial Arabic', (msg.match(/[\u0600-\u06FF]/g) ?? []).length > 30);
  }

  // No artificial ending markers (per rule #6)
  ok(`${lang}: no "End of Report" marker`, !/end of report|fin du rapport|نهاية التقرير/i.test(msg));
  ok(`${lang}: no "Document Ends" marker`, !/document ends|fin du document|نهاية المستند/i.test(msg));
}

// ---------------------------------------------------------------------------
// Test 8: buildBriefMessage — with alerts
// ---------------------------------------------------------------------------

console.log('Test 8: buildBriefMessage with alerts');
{
  const frostAlert: WeatherAlert = {
    kind: 'frost',
    day: { date: '2026-09-05', tempMax: 15, tempMin: 1, precipitationSum: 0, precipitationProbability: 0, weatherCode: 0, et0: 4.0, windSpeedMax: 20 } as DailyForecast,
  };
  const ctx = makeCtx({ alerts: [frostAlert] });
  const msg = buildBriefMessage(ctx, 'en');
  ok('message contains "Weather Alerts" section', /Weather Alerts/.test(msg));
  ok('message contains frost alert text', /FROST ALERT/.test(msg));
  ok('message contains frost temp (1.0)', msg.includes('1.0'));
}

// ---------------------------------------------------------------------------
// Test 9: buildBriefMessage — empty data graceful degradation
// ---------------------------------------------------------------------------

console.log('Test 9: empty data graceful degradation');
{
  // No forecast, no irrigation, no tasks, no alerts
  const ctx = makeCtx({
    forecast: null,
    today: undefined,
    irrigation: null,
    tasks: [],
    alerts: [],
  });
  const msg = buildBriefMessage(ctx, 'en');
  ok('still produces a message', msg.length > 0);
  ok('still has farm name', msg.includes('Test Farm'));
  ok('weather section shows unavailable', /Weather data unavailable|unavailable/i.test(msg));
  ok('irrigation section shows no recommendation', /No irrigation recommendation/i.test(msg));
  ok('tasks section shows "walk the field"', /walk the field/i.test(msg));
}

// ---------------------------------------------------------------------------
// Test 10: buildBriefMessage — missing farm name uses default
// ---------------------------------------------------------------------------

console.log('Test 10: missing farm name uses default');
{
  const ctx = makeCtx({
    profile: { ...makeCtx().profile, name: '' },
  });
  ok('en uses "My Farm"', buildBriefMessage(ctx, 'en').includes('My Farm'));
  ok('fr uses "Ma Ferme"', buildBriefMessage(ctx, 'fr').includes('Ma Ferme'));
  ok('ar uses Arabic default', /[\u0600-\u06FF]/.test(buildBriefMessage(ctx, 'ar')));
}

// ---------------------------------------------------------------------------
// Test 11: buildBriefMessage — fertilizer section only when fert task present
// ---------------------------------------------------------------------------

console.log('Test 11: fertilizer section conditional');
{
  // With fertilization task
  const withFert = makeCtx();
  const msgWith = buildBriefMessage(withFert, 'en');
  ok('with fert task: shows "Fertilizer Today" section', /Fertilizer Today/.test(msgWith));

  // Without fertilization task
  const withoutFert = makeCtx({
    tasks: makeCtx().tasks.filter(t => t.id !== 'today_fertilization'),
  });
  const msgWithout = buildBriefMessage(withoutFert, 'en');
  ok('without fert task: no "Fertilizer Today" section', !/Fertilizer Today/.test(msgWithout));
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\nWhatsApp brief tests: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  process.exit(1);
}
