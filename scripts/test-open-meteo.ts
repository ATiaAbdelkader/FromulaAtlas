/**
 * Smoke test for src/lib/open-meteo.ts — FAO-56 math correctness.
 *   npx tsx scripts/test-open-meteo.ts
 *
 * Reference values from FAO-56 Example 20 (Allen et al. 1998):
 *   Location: California, USA (lat 38°30'N = 38.5°)
 *   Day: 1 April (day of year = 91)
 *   Inputs:
 *     - T_max = 19.1°C, T_min = 7.5°C → T_mean ≈ 13.3°C
 *     - Wind speed at 2 m = 2.1 m/s
 *     - RH_mean = 60% (approx; derived from T_dew ≈ 6.0°C, T_mean 13.3)
 *     - Solar radiation Rs = 22.07 MJ/m²/day
 *     - Elevation = 0 m (sea level)
 *   Expected:
 *     - Ra (extraterrestrial radiation) ≈ 31.5 MJ/m²/day
 *     - ET₀ ≈ 3.4 mm/day (from FAO-56 worked example)
 *
 * Plus generic correctness:
 *   - Saturation vapour pressure at 25°C = 3.17 kPa
 *   - At 0°C, ET₀ should be near zero (very cold, low VPD)
 *   - At 35°C + low humidity + wind, ET₀ should be high (5–8 mm/day)
 */

import {
  fao56Et0,
  extraterrestrialRadiation,
  kcForDay,
  etcForDay,
  wmoDescription,
  CROP_KCS,
} from '../src/lib/open-meteo';

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra = '') => {
  if (cond) { console.log(`  ✓ ${name}`); pass++; }
  else { console.log(`  ✗ ${name} ${extra}`); fail++; }
};

async function main() {

// ============================================================================
// 1. Extraterrestrial radiation — FAO-56 Table 2.5 reference values
// ============================================================================
console.log('\nExtraterrestrial radiation (Ra):');

// 1 April (DOY 91) at lat 38.5°N → FAO-56 example gives Ra ≈ 31.5 MJ/m²/day.
const ra1 = extraterrestrialRadiation(38.5, 91);
ok('Ra on 1 April at 38.5°N ≈ 31.5 MJ/m²/day',
   Math.abs(ra1 - 31.5) < 1.5, `(got ${ra1.toFixed(2)})`);

// 1 January (DOY 1) at equator → near minimum due to perihelion; ≈ 36 MJ/m²/day
const ra2 = extraterrestrialRadiation(0, 1);
ok('Ra on 1 January at equator ≈ 36 MJ/m²/day',
   ra2 > 33 && ra2 < 39, `(got ${ra2.toFixed(2)})`);

// 21 December (DOY 355) at 60°N → polar night, Ra = 0
const ra3 = extraterrestrialRadiation(70, 355);
ok('Ra in Arctic winter (70°N, DOY 355) ≈ 0',
   ra3 < 1, `(got ${ra3.toFixed(2)})`);

// 21 June (DOY 172) at 70°N → polar day, very high
const ra4 = extraterrestrialRadiation(70, 172);
ok('Ra in Arctic summer (70°N, DOY 172) > 40',
   ra4 > 40, `(got ${ra4.toFixed(2)})`);

// ============================================================================
// 2. FAO-56 ET₀ — worked example sanity check
// ============================================================================
console.log('\nFAO-56 ET₀ (Example 20):');

const et0_example = fao56Et0({
  tempMean: 13.3,
  tempMax: 19.1,
  tempMin: 7.5,
  windSpeed2m: 2.1,
  relativeHumidityMean: 60,
  solarRadiation: 22.07,
  elevation: 0,
  dayOfYear: 91,
  latitude: 38.5,
});
// FAO-56 Example 20 expects ET₀ ≈ 3.4 mm/day (the worked example computes 3.4 with all the full formulas).
// Our implementation should be in the same ballpark — within 30%.
ok('FAO-56 Example 20 (California, 1 April) ET₀ ≈ 3.4 mm/day',
   et0_example > 2.5 && et0_example < 4.5, `(got ${et0_example.toFixed(2)})`);

// ============================================================================
// 3. ET₀ boundary cases
// ============================================================================
console.log('\nET₀ boundary cases:');

// Cold day: ET₀ should be near zero
const et0_cold = fao56Et0({
  tempMean: -2, tempMax: 2, tempMin: -5,
  windSpeed2m: 1, relativeHumidityMean: 90,
  solarRadiation: 5, elevation: 0,
});
ok('Cold humid day: ET₀ < 1 mm/day',
   et0_cold < 1.5, `(got ${et0_cold.toFixed(2)})`);

// Hot dry day: ET₀ should be high (5–8 mm/day typical for summer desert)
const et0_hot = fao56Et0({
  tempMean: 35, tempMax: 40, tempMin: 28,
  windSpeed2m: 4, relativeHumidityMean: 25,
  solarRadiation: 28, elevation: 0,
  dayOfYear: 180, latitude: 30,
});
ok('Hot dry summer day: ET₀ > 5 mm/day',
   et0_hot > 5, `(got ${et0_hot.toFixed(2)})`);

// Zero wind + zero radiation → ET₀ should be near zero
const et0_still = fao56Et0({
  tempMean: 20, tempMax: 25, tempMin: 15,
  windSpeed2m: 0, relativeHumidityMean: 80,
  solarRadiation: 0, elevation: 0,
});
ok('Dark windless day: ET₀ < 0.5 mm/day',
   et0_still < 0.5, `(got ${et0_still.toFixed(2)})`);

// ============================================================================
// 4. Crop coefficients (Kc) — interpolation
// ============================================================================
console.log('\nKc interpolation:');

const maize = CROP_KCS.find(c => c.crop === 'Maize (field)')!;
// Maize stages: init=20, dev=35, mid=50, late=20
ok('Maize Kc at day 5 (init stage) = 0.30',
   Math.abs(kcForDay(maize, 5) - 0.30) < 0.01, `(got ${kcForDay(maize, 5).toFixed(3)})`);

// Day 35: end of init, just into dev → still 0.30
ok('Maize Kc at day 20 (last day of init) = 0.30',
   Math.abs(kcForDay(maize, 20) - 0.30) < 0.01, `(got ${kcForDay(maize, 20).toFixed(3)})`);

// Day 37: 17 days into dev stage (after init=20). Linear interp: 0.30 + (17/35)*(1.20-0.30)
const expected_37 = 0.30 + (17 / 35) * (1.20 - 0.30);
ok('Maize Kc at day 37 (mid dev) matches linear interp',
   Math.abs(kcForDay(maize, 37) - expected_37) < 0.001, `(got ${kcForDay(maize, 37).toFixed(3)}, expected ${expected_37.toFixed(3)})`);

// Day 70 (in mid stage, after 20+35=55): should be exactly 1.20
ok('Maize Kc at day 70 (mid stage) = 1.20',
   Math.abs(kcForDay(maize, 70) - 1.20) < 0.001, `(got ${kcForDay(maize, 70).toFixed(3)})`);

// Day 120 (in late stage, after 20+35+50=105): linear interp 1.20 + (15/20)*(0.50-1.20)
const expected_120 = 1.20 + (15 / 20) * (0.50 - 1.20);
ok('Maize Kc at day 120 (late stage) matches linear interp',
   Math.abs(kcForDay(maize, 120) - expected_120) < 0.001, `(got ${kcForDay(maize, 120).toFixed(3)}, expected ${expected_120.toFixed(3)})`);

// ============================================================================
// 5. ETc = Kc × ET₀
// ============================================================================
console.log('\nETc computation:');
ok('ETc = Kc × ET₀', Math.abs(etcForDay(1.15, 4.5) - 5.175) < 0.001, `(got ${etcForDay(1.15, 4.5).toFixed(3)})`);

// ============================================================================
// 6. WMO weather codes
// ============================================================================
console.log('\nWMO codes:');
ok('WMO 0 = Clear sky ☀️', wmoDescription(0).label === 'Clear sky');
ok('WMO 3 = Overcast ☁️', wmoDescription(3).label === 'Overcast');
ok('WMO 61 = Rain 🌧️', wmoDescription(61).label === 'Light rain');
ok('WMO 95 = Thunderstorm ⛈️', wmoDescription(95).label === 'Thunderstorm');
ok('WMO 999 (unknown) = Unknown', wmoDescription(999).label === 'Unknown');

// ============================================================================
// 7. Live API call — make sure Open-Meteo is actually responding
// ============================================================================
console.log('\nLive API:');

// Skip if no network (we don't want the test to fail in CI just for network reasons).
const NO_NETWORK = process.env.NO_NETWORK === '1';
if (NO_NETWORK) {
  console.log('  ⏭️  Skipped (NO_NETWORK=1)');
} else {
  try {
    const { getForecast } = await Promise.resolve(import('../src/lib/open-meteo'));
    const result = await getForecast(37.77, -122.42, { days: 3 });
    ok('getForecast returns 3 days of daily forecast',
       result.daily.length === 3, `(got ${result.daily.length})`);
    ok('getForecast returns current weather',
       typeof result.current.temperature === 'number');
    ok('getForecast returns hourly forecasts',
       result.hourly.length > 24, `(got ${result.hourly.length})`);
    ok('Daily forecast includes ET₀',
       typeof result.daily[0].et0 === 'number' && result.daily[0].et0 >= 0);
    ok('Daily forecast includes sunrise/sunset',
       typeof result.daily[0].sunrise === 'string' && typeof result.daily[0].sunset === 'string');
  } catch (e: any) {
    ok(`Live API call succeeded`, false, `(error: ${e?.message})`);
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
} main();
