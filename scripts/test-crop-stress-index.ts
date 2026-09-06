/**
 * Crop stress index tests
 *
 * Verifies src/lib/crop-stress-index.ts:
 *   1. normalCdf — standard normal CDF approximation
 *   2. computeNdviStress — NDVI decline → stress
 *   3. computeRainfallStress — rainfall deficit → stress
 *   4. computeTemperatureStress — temp outside optimal range → stress
 *   5. computeStressIndex — composite with weight redistribution
 *   6. Localization helpers
 *
 * Run:  npm run test:domain   (or)   npx tsx scripts/test-crop-stress-index.ts
 */
import assert from 'node:assert/strict';
import {
  normalCdf,
  computeNdviStress,
  computeRainfallStress,
  computeTemperatureStress,
  computeStressIndex,
  stressLevelLabel,
  stressColor,
  stressRecommendationText,
  stressBriefText,
} from '../src/lib/crop-stress-index';
import type { RainfallAnomaly } from '../src/lib/rainfall-anomaly';

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
// Test 1: normalCdf
// ---------------------------------------------------------------------------

console.log('Test 1: normalCdf');
{
  ok('Φ(0) ≈ 0.5', Math.abs(normalCdf(0) - 0.5) < 0.001);
  ok('Φ(1) ≈ 0.841', Math.abs(normalCdf(1) - 0.841) < 0.01);
  ok('Φ(-1) ≈ 0.159', Math.abs(normalCdf(-1) - 0.159) < 0.01);
  ok('Φ(2) ≈ 0.977', Math.abs(normalCdf(2) - 0.977) < 0.01);
  ok('Φ(-2) ≈ 0.023', Math.abs(normalCdf(-2) - 0.023) < 0.01);
  ok('Φ(3) ≈ 0.999', normalCdf(3) > 0.998);
  ok('Φ(-3) ≈ 0.001', normalCdf(-3) < 0.002);
  ok('Φ(100) = 1', normalCdf(100) === 1);
  ok('Φ(-100) = 0', normalCdf(-100) === 0);
}

// ---------------------------------------------------------------------------
// Test 2: computeNdviStress
// ---------------------------------------------------------------------------

console.log('Test 2: computeNdviStress');
{
  // NDVI at expected → 0 stress
  ok('at expected → 0', computeNdviStress(0.7, 0.7) === 0);
  // NDVI above expected → 0 stress
  ok('above expected → 0', computeNdviStress(0.8, 0.7) === 0);
  // NDVI 0.1 below expected → ~69% stress (Φ(0.5) = 0.691 per ICSI formula)
  const s1 = computeNdviStress(0.6, 0.7);
  ok('0.1 decline → ~69%', s1 !== null && s1 > 0.6 && s1 < 0.8, `got ${s1}`);
  // NDVI 0.2 below expected → ~84% stress (Φ(1.0) = 0.841 per ICSI formula)
  const s2 = computeNdviStress(0.5, 0.7);
  ok('0.2 decline → ~84%', s2 !== null && s2 > 0.75 && s2 < 0.9, `got ${s2}`);
  // Null inputs → null
  ok('null current → null', computeNdviStress(null, 0.7) === null);
  ok('null expected → null', computeNdviStress(0.7, null) === null);
}

// ---------------------------------------------------------------------------
// Test 3: computeRainfallStress
// ---------------------------------------------------------------------------

console.log('Test 3: computeRainfallStress');
{
  const makeAnomaly = (pct: number): RainfallAnomaly => ({
    currentSeasonMm: 100,
    normalSeasonMm: 200,
    anomalyMm: -100,
    percentOfNormal: pct,
    seasonLabel: 'Test',
    isDrought: pct < 80,
    severity: pct < 50 ? 'severe_deficit' : pct < 70 ? 'moderate_deficit' : pct < 80 ? 'mild_deficit' : 'normal',
  });

  ok('100% normal → 0', computeRainfallStress(makeAnomaly(100)) === 0);
  ok('80% normal → 0.2', Math.abs((computeRainfallStress(makeAnomaly(80)) ?? 0) - 0.2) < 0.01);
  ok('60% normal → 0.4', Math.abs((computeRainfallStress(makeAnomaly(60)) ?? 0) - 0.4) < 0.01);
  ok('40% normal → 0.6', Math.abs((computeRainfallStress(makeAnomaly(40)) ?? 0) - 0.6) < 0.01);
  ok('0% normal → 1.0', computeRainfallStress(makeAnomaly(0)) === 1);
  ok('null → null', computeRainfallStress(null) === null);
}

// ---------------------------------------------------------------------------
// Test 4: computeTemperatureStress
// ---------------------------------------------------------------------------

console.log('Test 4: computeTemperatureStress');
{
  const today = { tempMax: 25, tempMin: 15 } as any;  // avg 20
  const optimal: [number, number] = [18, 28];

  // Within range → 0
  ok('within range → 0', computeTemperatureStress(today, optimal) === 0);

  // Above range: avg 35, max 28 → excess 7 → 0.35 stress
  const hot = { tempMax: 40, tempMin: 30 } as any;  // avg 35
  const hotStress = computeTemperatureStress(hot, optimal);
  ok('7° above → ~0.35', hotStress !== null && Math.abs(hotStress - 0.35) < 0.05, `got ${hotStress}`);

  // Below range: avg 10, min 18 → deficit 8 → 0.24 stress
  const cold = { tempMax: 12, tempMin: 8 } as any;  // avg 10
  const coldStress = computeTemperatureStress(cold, optimal);
  ok('8° below → ~0.24', coldStress !== null && Math.abs(coldStress - 0.24) < 0.05, `got ${coldStress}`);

  // Null inputs
  ok('null today → null', computeTemperatureStress(null, optimal) === null);
  ok('null range → null', computeTemperatureStress(today, null) === null);
}

// ---------------------------------------------------------------------------
// Test 5: computeStressIndex — composite
// ---------------------------------------------------------------------------

console.log('Test 5: computeStressIndex');
{
  // All low → low
  const low = computeStressIndex({
    currentNdvi: 0.7, expectedNdvi: 0.7,
    rainfallAnomaly: { percentOfNormal: 100 } as RainfallAnomaly,
    today: { tempMax: 25, tempMin: 15 } as any,
    optimalTempRange: [18, 28],
  });
  ok('all low → low', low.level === 'low');
  ok('low index < 0.1', low.index < 0.1, `got ${low.index}`);

  // All high → high
  const high = computeStressIndex({
    currentNdvi: 0.4, expectedNdvi: 0.7,   // big NDVI decline
    rainfallAnomaly: { percentOfNormal: 40 } as RainfallAnomaly,  // severe drought
    today: { tempMax: 40, tempMin: 30 } as any,  // very hot
    optimalTempRange: [18, 28],
  });
  ok('all high → high', high.level === 'high');
  ok('high index > 0.6', high.index > 0.6, `got ${high.index}`);

  // Mixed: severe drought only (30% of normal) + normal temp + no NDVI
  // Rainfall stress = 0.7, weight redistributed → index > 0.4 → moderate
  const mixed = computeStressIndex({
    currentNdvi: null, expectedNdvi: null,
    rainfallAnomaly: { percentOfNormal: 30 } as RainfallAnomaly,
    today: { tempMax: 25, tempMin: 15 } as any,  // within optimal → 0 temp stress
    optimalTempRange: [18, 28],
  });
  ok('severe drought + normal temp → moderate+', mixed.level === 'moderate' || mixed.level === 'high', `level=${mixed.level}, index=${mixed.index}`);
  ok('dominant factor = rainfall', mixed.dominantFactor === 'rainfall');
  ok('recommendation = irrigate', mixed.recommendation === 'irrigate', `rec=${mixed.recommendation}`);

  // Weight redistribution: only one signal available
  const onlyRain = computeStressIndex({
    currentNdvi: null, expectedNdvi: null,
    rainfallAnomaly: { percentOfNormal: 60 } as RainfallAnomaly,
    today: null,
    optimalTempRange: null,
  });
  ok('only rainfall → still computes', onlyRain.index > 0);
  ok('only rainfall → dominant = rainfall', onlyRain.dominantFactor === 'rainfall');

  // No signals → 0 stress, no dominant
  const none = computeStressIndex({
    currentNdvi: null, expectedNdvi: null,
    rainfallAnomaly: null,
    today: null,
    optimalTempRange: null,
  });
  ok('no signals → 0', none.index === 0);
  ok('no signals → none', none.dominantFactor === 'none');
}

// ---------------------------------------------------------------------------
// Test 6: Localization
// ---------------------------------------------------------------------------

console.log('Test 6: localization');
{
  for (const lang of ['en', 'fr', 'ar'] as const) {
    const highLabel = stressLevelLabel('high', lang);
    ok(`${lang}: high label non-empty`, highLabel.length > 0);
    if (lang === 'ar') ok('ar: high has Arabic', /[\u0600-\u06FF]/.test(highLabel));

    const modLabel = stressLevelLabel('moderate', lang);
    ok(`${lang}: moderate label non-empty`, modLabel.length > 0);

    const lowLabel = stressLevelLabel('low', lang);
    ok(`${lang}: low label non-empty`, lowLabel.length > 0);
  }

  ok('high color = red', stressColor('high') === '#dc2626');
  ok('moderate color = amber', stressColor('moderate') === '#f59e0b');
  ok('low color = green', stressColor('low') === '#16a34a');

  // Recommendation text
  const irrigateAr = stressRecommendationText('irrigate', 'ar');
  ok('ar irrigate has Arabic', /[\u0600-\u06FF]/.test(irrigateAr));

  // Brief text — low stress returns empty
  const lowStress = { index: 0.1, level: 'low' as const, components: { ndviStress: 0, rainfallStress: 0, temperatureStress: 0 }, dominantFactor: 'none' as const, recommendation: 'none' as const };
  ok('low stress → empty brief', stressBriefText(lowStress, 'en') === '');

  const highStress = { index: 0.75, level: 'high' as const, components: { ndviStress: 0.8, rainfallStress: 0.6, temperatureStress: 0.7 }, dominantFactor: 'ndvi' as const, recommendation: 'monitor' as const };
  const briefEn = stressBriefText(highStress, 'en');
  ok('high stress → non-empty brief', briefEn.length > 0);
  ok('brief contains 75%', briefEn.includes('75%'));
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\nCrop stress index tests: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  process.exit(1);
}
