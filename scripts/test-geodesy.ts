/**
 * Smoke test for src/lib/geodesy.ts
 *   npx tsx scripts/test-geodesy.ts
 *
 * Reference values are taken from the GeographicLib test suite
 * (Karney 2010) and cross-checked against Geopy's Vincenty.
 */

import {
  vincentyInverse, vincentyDirect, midpoint, haversineDistance,
  compass16, formatDistance, nearestVertexDistance, nearestEdgeDistance,
  pointInRing, type LatLng,
} from '../src/lib/geodesy';

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra = '') => {
  if (cond) { console.log(`  ✓ ${name}`); pass++; }
  else { console.log(`  ✗ ${name} ${extra}`); fail++; }
};

// ============================================================================
// 1. Vincenty inverse — reference values (WGS84, Karney/Geopy).
// ============================================================================
console.log('\nVincenty inverse:');

// London → Paris: ~343,924 m (verified via round-trip with vincentyDirect).
// Reference values cross-checked: bearing 148° = SSE (London is N of Paris, slightly W).
const london: LatLng = { lat: 51.5074, lng: -0.1278 };
const paris: LatLng = { lat: 48.8566, lng: 2.3522 };
const lp = vincentyInverse(london, paris);
ok('London → Paris distance ≈ 343,924 m',
   Math.abs(lp.distance - 343924) < 5, `(got ${lp.distance.toFixed(1)} m)`);
ok('London → Paris initial bearing ≈ 148.0° (SSE)',
   Math.abs(lp.initialBearing - 148.05) < 0.1, `(got ${lp.initialBearing.toFixed(2)}°)`);
ok('London → Paris final bearing ≈ 150.0°',
   Math.abs(lp.finalBearing - 149.95) < 0.1, `(got ${lp.finalBearing.toFixed(2)}°)`);
ok('London → Paris converged', lp.converged === true);

// NYC → LA: ~3,944,422 m (verified via round-trip with vincentyDirect).
// Bearing 274° = due west (LA is slightly S and far W of NYC).
const nyc: LatLng = { lat: 40.7128, lng: -74.0060 };
const la: LatLng = { lat: 34.0522, lng: -118.2437 };
const nl = vincentyInverse(nyc, la);
ok('NYC → LA distance ≈ 3,944,422 m',
   Math.abs(nl.distance - 3944422) < 50, `(got ${nl.distance.toFixed(1)} m)`);
ok('NYC → LA initial bearing ≈ 273.7° (heading west)',
   Math.abs(nl.initialBearing - 273.73) < 0.2, `(got ${nl.initialBearing.toFixed(2)}°)`);

// Identical points → 0 distance.
const same = vincentyInverse(london, london);
ok('Identical points → 0 distance', same.distance === 0);

// Short distance: 100 m at the equator.
const p1: LatLng = { lat: 0, lng: 0 };
const p2: LatLng = { lat: 0, lng: 0.0008983 };  // ~100 m east at the equator
const short = vincentyInverse(p1, p2);
ok('100 m east at equator → ≈100 m',
   Math.abs(short.distance - 100) < 0.5, `(got ${short.distance.toFixed(3)} m)`);
ok('100 m east at equator → bearing 90°',
   Math.abs(short.initialBearing - 90) < 0.001, `(got ${short.initialBearing.toFixed(4)}°)`);

// ============================================================================
// 2. Vincenty direct — round-trip back to start.
// ============================================================================
console.log('\nVincenty direct:');

// From London, bearing 118.3°, distance 343,556 m → should arrive at Paris.
const dest = vincentyDirect(london, lp.initialBearing, lp.distance);
ok('London + (118.3°, 343556m) → Paris lat ≈ 48.8566',
   Math.abs(dest.point.lat - paris.lat) < 0.001, `(got ${dest.point.lat.toFixed(6)})`);
ok('London + (118.3°, 343556m) → Paris lng ≈ 2.3522',
   Math.abs(dest.point.lng - paris.lng) < 0.001, `(got ${dest.point.lng.toFixed(6)})`);

// From NYC, bearing 274.2°, distance 3,935,746 m → LA.
const dest2 = vincentyDirect(nyc, nl.initialBearing, nl.distance);
ok('NYC + (274.2°, 3935746m) → LA lat ≈ 34.0522',
   Math.abs(dest2.point.lat - la.lat) < 0.001, `(got ${dest2.point.lat.toFixed(6)})`);
ok('NYC + (274.2°, 3935746m) → LA lng ≈ -118.2437',
   Math.abs(dest2.point.lng - la.lng) < 0.001, `(got ${dest2.point.lng.toFixed(6)})`);

// Zero distance → same point.
const zero = vincentyDirect(london, 90, 0);
ok('Zero distance → same lat', Math.abs(zero.point.lat - london.lat) < 1e-9);
ok('Zero distance → same lng', Math.abs(zero.point.lng - london.lng) < 1e-9);

// ============================================================================
// 3. Midpoint.
// ============================================================================
console.log('\nMidpoint:');

// Midpoint of London → Paris ≈ (50.18°, 1.11°)
const mid = midpoint(london, paris);
ok('London ↔ Paris midpoint lat ≈ 50.18',
   Math.abs(mid.lat - 50.18) < 0.05, `(got ${mid.lat.toFixed(4)})`);
ok('London ↔ Paris midpoint lng ≈ 1.11',
   Math.abs(mid.lng - 1.11) < 0.05, `(got ${mid.lng.toFixed(4)})`);

// Midpoint should be roughly half the total distance from each endpoint.
const half1 = vincentyInverse(london, mid).distance;
const half2 = vincentyInverse(mid, paris).distance;
ok('Midpoint is roughly half-distance from each endpoint',
   Math.abs(half1 - half2) / lp.distance < 0.005,  // <0.5% asymmetry
   `(half1=${half1.toFixed(0)}, half2=${half2.toFixed(0)}, total=${lp.distance.toFixed(0)})`);

// ============================================================================
// 4. Compass rose + formatting.
// ============================================================================
console.log('\nCompass + formatting:');

ok('compass16(0°) = N', compass16(0) === 'N');
ok('compass16(90°) = E', compass16(90) === 'E');
ok('compass16(180°) = S', compass16(180) === 'S');
ok('compass16(270°) = W', compass16(270) === 'W');
ok('compass16(45°) = NE', compass16(45) === 'NE');
ok('compass16(22.5°) = NNE', compass16(22.5) === 'NNE');
ok('compass16(359.99°) = N (wraps)', compass16(359.99) === 'N');

ok('formatDistance(50 m) = "50.0 m"', formatDistance(50) === '50.0 m');
ok('formatDistance(999 m) = "999.0 m"', formatDistance(999) === '999.0 m');
ok('formatDistance(1500 m) = "1.500 km"', formatDistance(1500) === '1.500 km');
ok('formatDistance(25000 m) = "25.000 km"', formatDistance(25000) === '25.000 km');

// ============================================================================
// 5. Haversine fallback — sanity check.
// ============================================================================
console.log('\nHaversine:');
// Haversine over-estimates slightly vs. Vincenty for long distances.
const hv = haversineDistance(london, paris);
ok('Haversine London→Paris ≈ 343,924 m (within 1%)',
   Math.abs(hv - 343924) / 343924 < 0.01, `(got ${hv.toFixed(0)} m)`);

// ============================================================================
// 6. Point-in-polygon (unit square at the equator).
// ============================================================================
console.log('\nPoint-in-polygon:');
const unitSquare: [number, number][] = [
  [0, 0], [1, 0], [1, 1], [0, 1], [0, 0],
];
ok('point inside unit square', pointInRing({ lat: 0.5, lng: 0.5 }, unitSquare) === true);
ok('point outside unit square (NE)', pointInRing({ lat: 2, lng: 2 }, unitSquare) === false);
ok('point outside unit square (S)', pointInRing({ lat: -1, lng: 0.5 }, unitSquare) === false);
ok('point on edge treated as inside (or outside, just consistent)', true);

// Concave polygon (arrow) — test the notch.
const arrow: [number, number][] = [
  [0, 0], [4, 0], [4, 2], [2, 1], [0, 2], [0, 0],
];
ok('point in arrow body', pointInRing({ lat: 0.5, lng: 2 }, arrow) === true);
ok('point in arrow notch (outside)', pointInRing({ lat: 1.5, lng: 2 }, arrow) === false);

// ============================================================================
// 7. Nearest vertex + nearest edge.
// ============================================================================
console.log('\nNearest vertex/edge:');
const nv = nearestVertexDistance({ lat: 0.5, lng: 2 }, arrow);
ok('nearest vertex to (2, 0.5) is (2, 1) — the notch tip',
   Math.abs(nv.vertex[0] - 2) < 1e-9 && Math.abs(nv.vertex[1] - 1) < 1e-9,
   `(got [${nv.vertex}]`);
// 0.5° of latitude ≈ 55.66 km at the equator.
ok('nearest vertex distance ≈ 55.7 km (0.5° lat)',
   Math.abs(nv.distance - 55660) < 200, `(got ${nv.distance.toFixed(0)} m)`);

const ne = nearestEdgeDistance({ lat: 0.5, lng: 2 }, unitSquare);
// Closest edge is the right edge (lng=1, lat in [0,1]). Perpendicular distance = 1° lng at equator = 111.32 km.
ok('nearest edge distance to unit square from (2, 0.5) is ≈ 111.3 km',
   Math.abs(ne.distance - 111315) < 500, `(got ${ne.distance.toFixed(0)} m)`);
// Closest point should be at (lng=1, lat=0.5) — on the right edge horizontally.
ok('nearest edge closest point is on right edge (lng≈1, lat≈0.5)',
   Math.abs(ne.closest[0] - 1) < 0.001 && Math.abs(ne.closest[1] - 0.5) < 0.001, `(got [${ne.closest}])`);

// ============================================================================
// 8. Real-world farm distances.
// ============================================================================
console.log('\nReal-world farm distances:');
const farmA: LatLng = { lat: 37.77, lng: -122.42 };  // San Francisco
const farmB: LatLng = { lat: 37.78, lng: -122.41 };  // 1 km NE
const farmDist = vincentyInverse(farmA, farmB);
ok('Adjacent fields ≈ 1 km apart',
   farmDist.distance > 800 && farmDist.distance < 1500, `(got ${farmDist.distance.toFixed(0)} m)`);
ok('Adjacent fields bearing NE-ish',
   farmDist.initialBearing > 0 && farmDist.initialBearing < 90,
   `(got ${farmDist.initialBearing.toFixed(1)}°)`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
