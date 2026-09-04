/**
 * Crop ID unification tests
 *
 * Verifies the canonical crop ID system in src/lib/crop-id-unified.ts:
 *   - canonicalCropId() correctly normalizes IDs from all 7 source systems
 *   - toFarmPilotId / toSuitabilityId / toSeedRateId / toAlgeriaCalendarId
 *     produce the IDs expected by each downstream system
 *   - cropDisplayName() returns trilingual labels for every canonical crop
 *   - round-trips are stable: canonical → system → canonical is identity
 *
 * Run:  npm run test:domain   (or)   npx tsx scripts/test-crop-id-unified.ts
 */
import assert from 'node:assert/strict';
import {
  canonicalCropId,
  isKnownCrop,
  toFarmPilotId,
  toSuitabilityId,
  toSeedRateId,
  toAlgeriaCalendarId,
  toPhenologyId,
  cropDisplayName,
  localizedCropDisplayName,
} from '../src/lib/crop-id-unified';

// ---------------------------------------------------------------------------
// 1. canonicalCropId — accepts any ID from any system, returns canonical
// ---------------------------------------------------------------------------

const CANONICAL_CASES: Array<[string, string]> = [
  // Already canonical — pass through unchanged
  ['maize', 'maize'],
  ['wheat', 'wheat'],
  ['bell-pepper', 'bell-pepper'],
  ['date-palm', 'date-palm'],
  ['grapes', 'grapes'],

  // FarmPilot-style (underscore, longer names)
  ['wheat_durum', 'wheat'],
  ['bell_pepper', 'bell-pepper'],
  ['date_palm', 'date-palm'],
  ['cucumber_greenhouse', 'cucumber'],

  // Algeria suitability rules
  ['tomato_greenhouse', 'tomato'],
  ['corn_grain', 'maize'],
  ['corn', 'maize'],

  // Phenology data (kebab-case with longer names)
  ['durum-wheat', 'wheat'],
  ['grapevine', 'grapes'],

  // Common alternates
  ['durum_wheat', 'wheat'],
  ['bread_wheat', 'wheat'],
  ['capsicum', 'bell-pepper'],
  ['sweet_pepper', 'bell-pepper'],
  ['lucerne', 'alfalfa'],
  ['rapeseed', 'canola'],
  ['oilseed_rape', 'canola'],
  ['grape', 'grapes'],
  ['vitis', 'grapes'],
  ['datepalm', 'date-palm'],
  ['phoenix', 'date-palm'],
];

let pass = 0;
let fail = 0;
for (const [input, expected] of CANONICAL_CASES) {
  try {
    assert.equal(canonicalCropId(input), expected);
    pass++;
  } catch (e) {
    console.error(`  ✗ canonicalCropId('${input}') = '${canonicalCropId(input)}' (expected '${expected}')`);
    fail++;
  }
}

// Case-insensitive
try {
  assert.equal(canonicalCropId('WHEAT'), 'wheat');
  assert.equal(canonicalCropId('  Bell_Pepper  '), 'bell-pepper');
  pass++;
} catch (e) {
  console.error(`  ✗ canonicalCropId should be case-insensitive and trim whitespace`);
  fail++;
}

// Unknown IDs pass through (important — don't lose data we don't recognize)
try {
  assert.equal(canonicalCropId('quinoa'), 'quinoa');
  assert.equal(canonicalCropId('teff'), 'teff');
  pass++;
} catch (e) {
  console.error(`  ✗ canonicalCropId should pass through unknown IDs unchanged`);
  fail++;
}

// ---------------------------------------------------------------------------
// 2. toFarmPilotId — canonical → FarmPilot
// ---------------------------------------------------------------------------

const FARMPILOT_CASES: Array<[string, string]> = [
  ['wheat', 'wheat_durum'],
  ['bell-pepper', 'bell_pepper'],
  ['date-palm', 'date_palm'],
  // Pass-through (no rename needed)
  ['maize', 'maize'],
  ['potato', 'potato'],
  ['tomato', 'tomato'],
  ['barley', 'barley'],
  ['lettuce', 'lettuce'],
  ['cucumber', 'cucumber'],
  ['alfalfa', 'alfalfa'],
  // Unknown — pass through
  ['rice', 'rice'],
  ['quinoa', 'quinoa'],
];

for (const [input, expected] of FARMPILOT_CASES) {
  try {
    assert.equal(toFarmPilotId(input), expected);
    pass++;
  } catch (e) {
    console.error(`  ✗ toFarmPilotId('${input}') = '${toFarmPilotId(input)}' (expected '${expected}')`);
    fail++;
  }
}

// ---------------------------------------------------------------------------
// 3. toSuitabilityId — canonical → Algeria suitability rules
// ---------------------------------------------------------------------------

const SUITABILITY_CASES: Array<[string, string]> = [
  ['wheat', 'wheat_durum'],
  ['maize', 'corn_grain'],
  ['tomato', 'tomato_greenhouse'],
  ['date-palm', 'date_palm'],
  // Pass-through
  ['potato', 'potato'],
  // Unknown — pass through
  ['quinoa', 'quinoa'],
];

for (const [input, expected] of SUITABILITY_CASES) {
  try {
    assert.equal(toSuitabilityId(input), expected);
    pass++;
  } catch (e) {
    console.error(`  ✗ toSuitabilityId('${input}') = '${toSuitabilityId(input)}' (expected '${expected}')`);
    fail++;
  }
}

// ---------------------------------------------------------------------------
// 4. toSeedRateId — canonical → SeedRateCalculator
// ---------------------------------------------------------------------------

const SEEDRATE_CASES: Array<[string, string]> = [
  ['maize', 'corn'],
  ['wheat', 'wheat'],
  ['rice', 'rice'],
  ['canola', 'canola'],
  // Unknown — pass through
  ['quinoa', 'quinoa'],
];

for (const [input, expected] of SEEDRATE_CASES) {
  try {
    assert.equal(toSeedRateId(input), expected);
    pass++;
  } catch (e) {
    console.error(`  ✗ toSeedRateId('${input}') = '${toSeedRateId(input)}' (expected '${expected}')`);
    fail++;
  }
}

// ---------------------------------------------------------------------------
// 5. toAlgeriaCalendarId / toPhenologyId — canonical → phenology timeline
// ---------------------------------------------------------------------------

const PHENOLOGY_CASES: Array<[string, string]> = [
  ['wheat', 'durum-wheat'],
  ['grapes', 'grapevine'],
  // Pass-through (already same in both systems)
  ['potato', 'potato'],
  ['tomato', 'tomato'],
  ['olive', 'olive'],
  ['date-palm', 'date-palm'],
  ['citrus', 'citrus'],
  // Unknown — pass through
  ['quinoa', 'quinoa'],
];

for (const [input, expected] of PHENOLOGY_CASES) {
  try {
    assert.equal(toAlgeriaCalendarId(input), expected);
    pass++;
  } catch (e) {
    console.error(`  ✗ toAlgeriaCalendarId('${input}') = '${toAlgeriaCalendarId(input)}' (expected '${expected}')`);
    fail++;
  }
  // Verify alias equivalence
  try {
    assert.equal(toPhenologyId(input), expected);
    pass++;
  } catch (e) {
    console.error(`  ✗ toPhenologyId should equal toAlgeriaCalendarId`);
    fail++;
  }
}

// ---------------------------------------------------------------------------
// 6. Round-trip stability — canonical → system → canonical is identity
//    (for crops that have a 1:1 mapping; round-trips through 'corn_grain' etc.
//    should be stable because the alias map covers them)
// ---------------------------------------------------------------------------

const ROUND_TRIP_CROPS = [
  'maize', 'wheat', 'rice', 'soybean', 'cotton',
  'tomato', 'potato', 'lettuce', 'onion', 'alfalfa',
  'coffee', 'apple', 'sunflower', 'citrus', 'sorghum',
  'barley', 'canola', 'bell-pepper', 'cucumber', 'grapes',
  'date-palm', 'olive', 'pepper',
];

for (const crop of ROUND_TRIP_CROPS) {
  // canonical → farmPilot → canonical
  try {
    const fp = toFarmPilotId(crop);
    const back = canonicalCropId(fp);
    assert.equal(back, crop, `Round-trip farmPilot failed for ${crop}: ${fp} → ${back}`);
    pass++;
  } catch (e) {
    console.error(`  ✗ Round-trip farmPilot failed for '${crop}': ${e instanceof Error ? e.message : e}`);
    fail++;
  }
  // canonical → suitability → canonical
  try {
    const su = toSuitabilityId(crop);
    const back = canonicalCropId(su);
    assert.equal(back, crop, `Round-trip suitability failed for ${crop}: ${su} → ${back}`);
    pass++;
  } catch (e) {
    console.error(`  ✗ Round-trip suitability failed for '${crop}': ${e instanceof Error ? e.message : e}`);
    fail++;
  }
  // canonical → phenology → canonical
  try {
    const ph = toAlgeriaCalendarId(crop);
    const back = canonicalCropId(ph);
    assert.equal(back, crop, `Round-trip phenology failed for ${crop}: ${ph} → ${back}`);
    pass++;
  } catch (e) {
    console.error(`  ✗ Round-trip phenology failed for '${crop}': ${e instanceof Error ? e.message : e}`);
    fail++;
  }
}

// ---------------------------------------------------------------------------
// 7. cropDisplayName — trilingual labels for every canonical crop
// ---------------------------------------------------------------------------

const CANONICAL_CROPS = [
  'maize', 'wheat', 'rice', 'soybean', 'cotton',
  'tomato', 'potato', 'lettuce', 'onion', 'alfalfa',
  'coffee', 'apple', 'sunflower', 'citrus', 'sorghum',
  'barley', 'canola', 'bell-pepper', 'cucumber', 'grapes',
  'cassava', 'cashew', 'carrot', 'strawberry', 'date-palm',
  'olive', 'pepper',
];

for (const crop of CANONICAL_CROPS) {
  const labels = cropDisplayName(crop, 'en');
  try {
    assert.ok(labels.en && labels.en.length > 0, `${crop}: missing en label`);
    assert.ok(labels.fr && labels.fr.length > 0, `${crop}: missing fr label`);
    assert.ok(labels.ar && labels.ar.length > 0, `${crop}: missing ar label`);
    // Arabic label must actually contain Arabic characters (not fall back to en)
    assert.ok(/[\u0600-\u06FF]/.test(labels.ar), `${crop}: ar label '${labels.ar}' has no Arabic characters`);
    pass++;
  } catch (e) {
    console.error(`  ✗ cropDisplayName('${crop}') = ${JSON.stringify(labels)} — ${e instanceof Error ? e.message : e}`);
    fail++;
  }
}

// localizedCropDisplayName returns the right language
try {
  assert.equal(localizedCropDisplayName('wheat', 'en'), 'Wheat');
  assert.equal(localizedCropDisplayName('wheat', 'fr'), 'Blé');
  assert.equal(localizedCropDisplayName('wheat', 'ar'), 'القمح');
  pass++;
} catch (e) {
  console.error(`  ✗ localizedCropDisplayName failed: ${e instanceof Error ? e.message : e}`);
  fail++;
}

// Accepts non-canonical input too (resolves via canonicalCropId internally)
try {
  assert.equal(localizedCropDisplayName('wheat_durum', 'en'), 'Wheat');
  assert.equal(localizedCropDisplayName('bell_pepper', 'fr'), 'Poivron');
  assert.equal(localizedCropDisplayName('durum-wheat', 'ar'), 'القمح');
  pass++;
} catch (e) {
  console.error(`  ✗ localizedCropDisplayName should accept non-canonical input: ${e instanceof Error ? e.message : e}`);
  fail++;
}

// ---------------------------------------------------------------------------
// 8. isKnownCrop
// ---------------------------------------------------------------------------

try {
  assert.equal(isKnownCrop('wheat'), true);
  assert.equal(isKnownCrop('wheat_durum'), true); // alias
  assert.equal(isKnownCrop('durum-wheat'), true); // alias
  assert.equal(isKnownCrop('quinoa'), false);     // unknown
  pass++;
} catch (e) {
  console.error(`  ✗ isKnownCrop failed: ${e instanceof Error ? e.message : e}`);
  fail++;
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\nCrop ID unification tests: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  process.exit(1);
}
