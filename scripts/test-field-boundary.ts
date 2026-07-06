/**
 * Smoke test for src/lib/field-boundary.ts
 *   npx tsx scripts/test-field-boundary.ts
 *
 * Verifies:
 *   - Parser round-trips (GeoJSON / WKT / KML / CSV)
 *   - Spherical area & haversine perimeter math
 *   - Self-intersection detection
 *   - Format serialisers (GeoJSON / KML / WKT / CSV)
 */

import {
  parseGeoJSON, parseWKT, parseKML, parseCSV, detectAndParse,
  computeMetrics, ringArea, ringPerimeter, ringCentroid, ringsSelfIntersect,
  toGeoJSON, toWKT, toKML, toCSV,
  type Boundary, type Ring,
} from '../src/lib/field-boundary';

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra = '') => {
  if (cond) { console.log(`  ✓ ${name}`); pass++; }
  else { console.log(`  ✗ ${name} ${extra}`); fail++; }
};

// ============================================================================
// 1. Spherical area & perimeter — 1°×1° square at the equator.
//    Expected: ~12,308 km² area, ~445 km perimeter.
// ============================================================================
console.log('\nGeometry math:');
const square: Ring = [[0,0],[1,0],[1,1],[0,1],[0,0]];
const area = ringArea(square);
ok('1°×1° equatorial square area ≈ 12,308 km²',
   area > 1.22e10 && area < 1.24e10, `(got ${(area/1e6).toFixed(0)} km²)`);
const perim = ringPerimeter(square);
ok('1°×1° square perimeter ≈ 445 km',
   perim > 440_000 && perim < 450_000, `(got ${(perim/1000).toFixed(0)} km)`);
const c = ringCentroid(square);
ok('centroid of unit square ≈ (0.5, 0.5)',
   Math.abs(c[0] - 0.5) < 0.001 && Math.abs(c[1] - 0.5) < 0.001, `(got ${c})`);

// ============================================================================
// 2. Self-intersection detection.
// ============================================================================
console.log('\nSelf-intersection:');
ok('clean square does NOT self-intersect', ringsSelfIntersect(square) === false);
const bowtie: Ring = [[0,0],[1,1],[1,0],[0,1],[0,0]];
ok('bowtie polygon DOES self-intersect', ringsSelfIntersect(bowtie) === true);

// ============================================================================
// 3. Parsers.
// ============================================================================
console.log('\nParsers:');

// GeoJSON
const gj = parseGeoJSON(JSON.stringify({
  type: 'Feature',
  properties: { name: 'North 40' },
  geometry: { type: 'Polygon', coordinates: [[[0,0],[1,0],[1,1],[0,1],[0,0]]] },
}));
ok('parseGeoJSON returns 1 boundary', gj.length === 1);
ok('parseGeoJSON keeps name', gj[0].name === 'North 40');
ok('parseGeoJSON outer ring closed', gj[0].coordinates[0].length === 5);

// WKT
const wkt = parseWKT('POLYGON ((-122.42 37.77, -122.41 37.77, -122.41 37.78, -122.42 37.78, -122.42 37.77))');
ok('parseWKT returns 1 boundary', wkt.length === 1);
ok('parseWKT ring has 5 vertices', (wkt[0].coordinates as any)[0].length === 5);
ok('parseWKT first vertex correct', (wkt[0].coordinates as any)[0][0][0] === -122.42);

// MultiPolygon WKT
const mwkt = parseWKT('MULTIPOLYGON (((0 0, 1 0, 1 1, 0 1, 0 0)), ((10 10, 11 10, 11 11, 10 11, 10 10)))');
ok('parseWKT MultiPolygon returns 1 boundary', mwkt.length === 1);
ok('parseWKT MultiPolygon has 2 parts', (mwkt[0].coordinates as any).length === 2);

// CSV
const csv = parseCSV('name,latitude,longitude\nF,37.77,-122.42\nF,37.77,-122.41\nF,37.78,-122.41\nF,37.78,-122.42\nF,37.77,-122.42');
ok('parseCSV returns 1 boundary named "F"', csv.length === 1 && csv[0].name === 'F');
ok('parseCSV ring has 5 vertices', (csv[0].coordinates as any)[0].length === 5);

// detectAndParse auto-detection
ok('detectAndParse detects GeoJSON ({)', detectAndParse('{ "type":"Feature" }'.replace('"Feature"','"Polygon"') + '').format === 'geojson');
ok('detectAndParse detects WKT (POLYGON)', detectAndParse('POLYGON ((0 0, 1 0, 1 1, 0 0))').format === 'wkt');
ok('detectAndParse detects CSV (lat/lng header)', detectAndParse('latitude,longitude\n0,0\n1,0\n1,1').format === 'csv');

// ============================================================================
// 4. Serialisers.
// ============================================================================
console.log('\nSerialisers:');
const b: Boundary = { name: 'Test', type: 'Polygon', coordinates: [[[0,0],[1,0],[1,1],[0,1],[0,0]]] };

const outGj = toGeoJSON(b);
ok('toGeoJSON is valid JSON Feature', JSON.parse(outGj).type === 'Feature');
ok('toGeoJSON preserves name', JSON.parse(outGj).properties.name === 'Test');
ok('toGeoJSON geometry type = Polygon', JSON.parse(outGj).geometry.type === 'Polygon');

const outWkt = toWKT(b);
ok('toWKT starts with POLYGON', outWkt.startsWith('POLYGON'));
ok('toWKT contains all 5 vertices (closed)', (outWkt.match(/,/g) || []).length === 4);

const outKml = toKML(b);
ok('toKML has <kml> root', outKml.includes('<kml'));
ok('toKML has <Placemark>', outKml.includes('<Placemark>'));
ok('toKML has <Polygon>', outKml.includes('<Polygon>'));
ok('toKML has <coordinates>', outKml.includes('<coordinates>'));
ok('toKML escapes XML in name', toKML({ ...b, name: 'A&B<C>' }).includes('A&amp;B&lt;C&gt;'));

const outCsv = toCSV(b);
ok('toCSV has header + 5 rows', outCsv.split('\n').length === 6);
ok('toCSV header correct', outCsv.split('\n')[0] === 'name,latitude,longitude');

// ============================================================================
// 5. Round-trip: serialise then parse back.
// ============================================================================
console.log('\nRound-trips:');
const rtWkt = parseWKT(toWKT(b));
ok('WKT → parse → matches original', JSON.stringify(rtWkt[0].coordinates) === JSON.stringify(b.coordinates));
const rtGj = parseGeoJSON(toGeoJSON(b));
ok('GeoJSON → parse → matches original', JSON.stringify(rtGj[0].coordinates) === JSON.stringify(b.coordinates));

// ============================================================================
// 6. computeMetrics — end-to-end.
// ============================================================================
console.log('\ncomputeMetrics:');
const m = computeMetrics(b);
ok('metrics.valid is true for clean square', m.valid === true);
ok('metrics.areaM2 ≈ 12,308 km²', m.areaM2 > 1.22e10 && m.areaM2 < 1.24e10, `(got ${(m.areaM2/1e6).toFixed(0)} km²)`);
ok('metrics.vertexCount = 5', m.vertexCount === 5);
ok('metrics.centroid ≈ (0.5, 0.5)', Math.abs(m.centroid[0] - 0.5) < 0.001 && Math.abs(m.centroid[1] - 0.5) < 0.001);
ok('metrics.bbox correct', m.bbox.west === 0 && m.bbox.south === 0 && m.bbox.east === 1 && m.bbox.north === 1);

// MultiPolygon metrics
const mp: Boundary = {
  name: 'TwoFields',
  type: 'MultiPolygon',
  coordinates: [
    [[[0,0],[1,0],[1,1],[0,1],[0,0]]],
    [[[10,10],[11,10],[11,11],[10,11],[10,10]]],
  ],
};
const mm = computeMetrics(mp);
ok('MultiPolygon metrics valid', mm.valid === true);
// Second square is at 10°N → ~cos(10°) smaller due to longitude shrinkage.
const expectedMpArea = m.areaM2 + ringArea([[10,10],[11,10],[11,11],[10,11],[10,10]]);
ok('MultiPolygon area = sum of both squares', Math.abs(mm.areaM2 - expectedMpArea) / expectedMpArea < 0.001,
   `(got ${(mm.areaM2/1e6).toFixed(0)} km², expected ${(expectedMpArea/1e6).toFixed(0)} km²)`);
ok('MultiPolygon bbox spans both parts', mm.bbox.west === 0 && mm.bbox.east === 11);
ok('MultiPolygon vertexCount = 10', mm.vertexCount === 10);

// Invalid polygon (bowtie)
const bad: Boundary = { name: 'Bad', type: 'Polygon', coordinates: [[[0,0],[1,1],[1,0],[0,1],[0,0]]] };
const bm = computeMetrics(bad);
ok('bowtie polygon metrics.valid = false', bm.valid === false);
ok('bowtie polygon has issues', bm.issues.length > 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
