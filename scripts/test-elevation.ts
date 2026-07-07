/**
 * Smoke test for src/lib/elevation.ts
 *   npx tsx scripts/test-elevation.ts
 *
 * Verifies:
 *   - Live Open-Meteo elevation API responds with sensible values for known peaks
 *   - Slope classification tiers match FAO/USDA standards
 *   - Aspect → compass-rose conversion matches 16-point convention
 *   - Frost risk logic correct for N vs S hemisphere
 *   - Path profile: ascent/descent/slope math
 *   - Slope grid: Hillshade within [0, 255], slope within [0, 90°]
 */

import {
  getElevation, getElevations, getPathProfile, getSlopeGrid,
  classifySlope, SLOPE_CLASS_INFO, aspectCompass16, frostRiskFromAspect,
  formatElevation, formatSlope,
} from '../src/lib/elevation';

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra = '') => {
  if (cond) { console.log(`  ✓ ${name}`); pass++; }
  else { console.log(`  ✗ ${name} ${extra}`); fail++; }
};

const NO_NETWORK = process.env.NO_NETWORK === '1';

async function main() {

// ============================================================================
// 1. Slope classification — FAO tiers
// ============================================================================
console.log('\nSlope classification:');
ok('0° = flat', classifySlope(0) === 'flat');
ok('2.99° = flat', classifySlope(2.99) === 'flat');
ok('3° = gentle', classifySlope(3) === 'gentle');
ok('7.99° = gentle', classifySlope(7.99) === 'gentle');
ok('8° = moderate', classifySlope(8) === 'moderate');
ok('14.99° = moderate', classifySlope(14.99) === 'moderate');
ok('15° = steep', classifySlope(15) === 'steep');
ok('24.99° = steep', classifySlope(24.99) === 'steep');
ok('25° = very_steep', classifySlope(25) === 'very_steep');
ok('45° = very_steep', classifySlope(45) === 'very_steep');
ok('All 5 classes have FAO-style recommendations', Object.keys(SLOPE_CLASS_INFO).length === 5);

// ============================================================================
// 2. Aspect → compass
// ============================================================================
console.log('\nAspect → compass:');
ok('0° = N', aspectCompass16(0) === 'N');
ok('90° = E', aspectCompass16(90) === 'E');
ok('180° = S', aspectCompass16(180) === 'S');
ok('270° = W', aspectCompass16(270) === 'W');
ok('45° = NE', aspectCompass16(45) === 'NE');
ok('22.5° = NNE', aspectCompass16(22.5) === 'NNE');
ok('359.99° wraps to N', aspectCompass16(359.99) === 'N');

// ============================================================================
// 3. Frost risk (N hemisphere)
// ============================================================================
console.log('\nFrost risk (Northern Hemisphere):');
ok('South-facing (180°) = low risk',
   frostRiskFromAspect(180, 'N').risk === 'low');
ok('North-facing (0°) = high risk',
   frostRiskFromAspect(0, 'N').risk === 'high');
ok('East-facing (90°) = moderate risk',
   frostRiskFromAspect(90, 'N').risk === 'moderate');

console.log('\nFrost risk (Southern Hemisphere):');
ok('North-facing (0°) = low risk (S. Hem.)',
   frostRiskFromAspect(0, 'S').risk === 'low');
ok('South-facing (180°) = high risk (S. Hem.)',
   frostRiskFromAspect(180, 'S').risk === 'high');

// ============================================================================
// 4. Formatters
// ============================================================================
console.log('\nFormatters:');
ok('formatElevation(50) = "50 m"', formatElevation(50) === '50 m');
ok('formatElevation(1500) = "1.50 km"', formatElevation(1500) === '1.50 km');
ok('formatSlope(0°) = "0.0° (0.0%)"', formatSlope(0) === '0.0° (0.0%)');
// 45° slope = 100% grade
ok('formatSlope(45°) ≈ "45.0° (100.0%)"', formatSlope(45).includes('45.0°') && formatSlope(45).includes('100.0'));

// ============================================================================
// 5. Live API — known elevation points
// ============================================================================
console.log('\nLive API (Open-Meteo elevation):');

if (NO_NETWORK) {
  console.log('  ⏭️  Skipped (NO_NETWORK=1)');
} else {
  try {
    // 1. Single point — San Francisco (sea level-ish, ~14 m)
    const sf = await getElevation(37.77, -122.42);
    ok('San Francisco elevation between 0–200 m',
       sf >= 0 && sf < 200, `(got ${sf} m)`);

    // 2. Batched — 3 points
    const batch = await getElevations([
      { lat: 37.77, lng: -122.42 },
      { lat: 37.78, lng: -122.41 },
      { lat: 37.79, lng: -122.40 },
    ]);
    ok('Batched elevation returns 3 values', batch.length === 3);
    ok('All batched values are finite numbers',
       batch.every(v => Number.isFinite(v)));

    // 3. Death Valley (Badwater Basin) — should be negative or near sea level
    const dv = await getElevation(36.24, -116.82);
    ok('Death Valley elevation < 100 m (likely below sea level)',
       dv < 100, `(got ${dv} m)`);

    // 4. Mt Everest region (near base camp) — should be ~5000+ m
    const everest = await getElevation(28.0, 86.85);
    ok('Everest base camp region > 4000 m',
       everest > 4000, `(got ${everest} m)`);

    // 5. Large batch (>100 points) — should auto-paginate
    const bigPts = Array.from({ length: 150 }, (_, i) => ({
      lat: 37.77 + (i - 75) * 0.001,
      lng: -122.42 + (i - 75) * 0.001,
    }));
    const big = await getElevations(bigPts);
    ok('Large batch (150 points) paginated correctly',
       big.length === 150, `(got ${big.length})`);
  } catch (e: any) {
    ok(`Live API call succeeded`, false, `(error: ${e?.message})`);
  }
}

// ============================================================================
// 6. Path profile — along a transect
// ============================================================================
console.log('\nPath profile:');

if (NO_NETWORK) {
  console.log('  ⏭️  Skipped (NO_NETWORK=1)');
} else {
  try {
    // Transect from sea level SF to inland hills
    const profile = await getPathProfile(
      { lat: 37.77, lng: -122.42 },
      { lat: 37.85, lng: -122.30 },
      15,
    );
    ok('Path profile has 15 sample points', profile.points.length === 15);
    ok('Path profile distances array matches length',
       profile.distances.length === 15);
    ok('First distance = 0', profile.distances[0] === 0);
    ok('Last distance > 0', profile.distances[profile.distances.length - 1] > 0);
    ok('Total ascent ≥ 0', profile.ascent >= 0);
    ok('Total descent ≥ 0', profile.descent >= 0);
    ok('Max elevation ≥ min elevation', profile.maxElev >= profile.minElev);
    ok('Max slope ≥ 0', profile.maxSlope >= 0);
    ok('Avg slope within [0, 90°]',
       profile.avgSlope >= 0 && profile.avgSlope <= 90);
    ok('Total distance > 1 km (SF to inland hills)',
       profile.totalDistance > 1000, `(got ${profile.totalDistance.toFixed(0)} m)`);
  } catch (e: any) {
    ok(`Path profile succeeded`, false, `(error: ${e?.message})`);
  }
}

// ============================================================================
// 7. Slope grid — over a real mountainous area
// ============================================================================
console.log('\nSlope grid:');

if (NO_NETWORK) {
  console.log('  ⏭️  Skipped (NO_NETWORK=1)');
} else {
  try {
    // A small grid in the Marin Headlands (north of SF, hilly)
    const grid = await getSlopeGrid({
      north: 37.86, south: 37.83, east: -122.47, west: -122.51,
    }, 8, 135, 45);
    ok('Slope grid is 8×8', grid.cols === 8 && grid.rows === 8);
    ok('Elevation grid has 64 cells', grid.elevations.flat().length === 64);
    ok('Slope grid has 64 cells', grid.slope.flat().length === 64);
    ok('Aspect grid has 64 cells', grid.aspect.flat().length === 64);
    ok('Hillshade grid has 64 cells', grid.hillshade.flat().length === 64);
    ok('All hillshade values in [0, 255]',
       grid.hillshade.flat().every(h => h >= 0 && h <= 255));
    ok('All slope values in [0, 90°]',
       grid.slope.flat().every(s => s >= 0 && s <= 90));
    ok('All aspect values in [0, 360°)',
       grid.aspect.flat().every(a => a >= 0 && a < 360));
    ok('Stats: flat + gentle + moderate + steep + verySteep = 100%',
       Math.abs(grid.stats.flatPct + grid.stats.gentlePct + grid.stats.moderatePct + grid.stats.steepPct + grid.stats.verySteepPct - 100) < 0.01);
    ok('Max slope ≥ avg slope', grid.stats.maxSlope >= grid.stats.avgSlope);
    ok('Cell size > 0', grid.cellSizeM > 0);
    ok('Average elevation > 0 (Marin Headlands)',
       grid.stats.avgElevation > 0, `(got ${grid.stats.avgElevation.toFixed(1)})`);
  } catch (e: any) {
    ok(`Slope grid succeeded`, false, `(error: ${e?.message})`);
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);

}

main();
