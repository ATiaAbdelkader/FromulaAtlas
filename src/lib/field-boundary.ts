/**
 * Field boundary geometry utilities.
 *
 * Pure functions — no React, no DOM. Safe to use in any context (workers,
 * server routes, scripts, tests).
 *
 * All math uses WGS84 sphere (R = 6378137 m). Spherical-excess formula
 * for polygon area, haversine for distances, equirectangular projection
 * (centred on bbox) for centroid.
 *
 * Supported formats:
 *   - GeoJSON  (Feature / FeatureCollection / Polygon / MultiPolygon)
 *   - KML      (<Placemark><Polygon><outerBoundaryIs>… / <MultiGeometry>)
 *   - WKT      (POLYGON ((…)) / MULTIPOLYGON (((…))))
 *   - CSV      (header row with latitude,longitude columns; optional name)
 */

export type Ring = [number, number][];          // [lng, lat][] in degrees
export type Polygon = Ring[];                    // [outerRing, ...holes]
export type MultiPolygon = Polygon[];

export interface Boundary {
  name: string;
  type: 'Polygon' | 'MultiPolygon';
  coordinates: Polygon | MultiPolygon;
}

export type ImportFormat = 'geojson' | 'kml' | 'wkt' | 'csv';
export type ExportFormat = 'geojson' | 'kml' | 'wkt' | 'csv';

export interface BoundaryMetrics {
  areaM2: number;
  perimeterM: number;
  centroid: [number, number];
  bbox: { west: number; south: number; east: number; north: number };
  vertexCount: number;
  valid: boolean;
  issues: string[];
}

const R_EARTH = 6378137.0;

// ============================================================================
// Geometry math
// ============================================================================

/** Great-circle distance between two [lng, lat] points (metres). */
export function haversine(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => d * Math.PI / 180;
  const [lng1, lat1] = a, [lng2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinDLng * sinDLng;
  return 2 * R_EARTH * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Spherical-excess polygon area (m²). Ring is [lng, lat][] in degrees. */
export function ringArea(ring: Ring): number {
  if (ring.length < 3) return 0;
  const pts = isClosed(ring) ? ring.slice(0, -1) : ring;
  if (pts.length < 3) return 0;
  const toRad = (d: number) => d * Math.PI / 180;
  let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const [lng1, lat1] = pts[i];
    const [lng2, lat2] = pts[(i + 1) % pts.length];
    total += toRad(lng2 - lng1) * (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
  }
  return Math.abs(total * R_EARTH * R_EARTH / 2);
}

/** Perimeter (m) — outer ring only. */
export function ringPerimeter(ring: Ring): number {
  if (ring.length < 2) return 0;
  const pts = isClosed(ring) ? ring : [...ring, ring[0]];
  let p = 0;
  for (let i = 0; i < pts.length - 1; i++) p += haversine(pts[i], pts[i + 1]);
  return p;
}

/** Bounding box [west, south, east, north]. */
export function bbox(ring: Ring): { west: number; south: number; east: number; north: number } {
  let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
  for (const [lng, lat] of ring) {
    if (lng < west) west = lng;
    if (lng > east) east = lng;
    if (lat < south) south = lat;
    if (lat > north) north = lat;
  }
  return { west, south, east, north };
}

/** Area-weighted centroid of a ring. Returns [lng, lat]. */
export function ringCentroid(ring: Ring): [number, number] {
  if (ring.length < 3) {
    let sumLng = 0, sumLat = 0;
    for (const [lng, lat] of ring) { sumLng += lng; sumLat += lat; }
    return [sumLng / ring.length, sumLat / ring.length];
  }
  const pts = isClosed(ring) ? ring.slice(0, -1) : ring;
  // Equirectangular projection centred on bbox midpoint → planar shoelace centroid.
  const b = bbox(ring);
  const midLat = (b.north + b.south) / 2 * Math.PI / 180;
  const kLng = Math.cos(midLat) * R_EARTH * Math.PI / 180;
  const kLat = R_EARTH * Math.PI / 180;
  let cx = 0, cy = 0, area2 = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = [(pts[i][0] - b.west) * kLng, (pts[i][1] - b.south) * kLat];
    const [x2, y2] = [(pts[(i + 1) % pts.length][0] - b.west) * kLng, (pts[(i + 1) % pts.length][1] - b.south) * kLat];
    const cross = x1 * y2 - x2 * y1;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
    area2 += cross;
  }
  if (Math.abs(area2) < 1e-6) {
    let sumLng = 0, sumLat = 0;
    for (const [lng, lat] of pts) { sumLng += lng; sumLat += lat; }
    return [sumLng / pts.length, sumLat / pts.length];
  }
  return [cx / (3 * area2) / kLng + b.west, cy / (3 * area2) / kLat + b.south];
}

/** O(n²) segment-intersection check (basic self-intersection). */
export function ringsSelfIntersect(ring: Ring): boolean {
  const pts = isClosed(ring) ? ring.slice(0, -1) : ring;
  const n = pts.length;
  if (n < 4) return false;
  const segIntersect = (
    p1: [number, number], p2: [number, number],
    p3: [number, number], p4: [number, number],
  ): boolean => {
    const d = (p2[0] - p1[0]) * (p4[1] - p3[1]) - (p2[1] - p1[1]) * (p4[0] - p3[0]);
    if (Math.abs(d) < 1e-12) return false;
    const t = ((p3[0] - p1[0]) * (p4[1] - p3[1]) - (p3[1] - p1[1]) * (p4[0] - p3[0])) / d;
    const u = ((p3[0] - p1[0]) * (p2[1] - p1[1]) - (p3[1] - p1[1]) * (p2[0] - p1[0])) / d;
    return t > 1e-9 && t < 1 - 1e-9 && u > 1e-9 && u < 1 - 1e-9;
  };
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      if (segIntersect(pts[i], pts[(i + 1) % n], pts[j], pts[(j + 1) % n])) return true;
    }
  }
  return false;
}

function isClosed(ring: Ring): boolean {
  if (ring.length < 2) return false;
  const a = ring[0], b = ring[ring.length - 1];
  return a[0] === b[0] && a[1] === b[1];
}

// ============================================================================
// Boundary metrics
// ============================================================================

export function computeMetrics(b: Boundary): BoundaryMetrics {
  const issues: string[] = [];
  if (b.type === 'Polygon') {
    const outer = (b.coordinates as Polygon)[0];
    if (!outer || outer.length < 3) {
      issues.push('Polygon needs at least 3 vertices');
      return { areaM2: 0, perimeterM: 0, centroid: [0, 0], bbox: outer ? bbox(outer) : { west: 0, south: 0, east: 0, north: 0 }, vertexCount: outer ? outer.length : 0, valid: false, issues };
    }
    const valid = !ringsSelfIntersect(outer);
    if (!valid) issues.push('Outer ring self-intersects');
    if ((b.coordinates as Polygon).length > 1) {
      issues.push(`Has ${(b.coordinates as Polygon).length - 1} interior hole(s) — metrics use outer ring only`);
    }
    return {
      areaM2: ringArea(outer),
      perimeterM: ringPerimeter(outer),
      centroid: ringCentroid(outer),
      bbox: bbox(outer),
      vertexCount: outer.length,
      valid,
      issues,
    };
  }
  const polys = b.coordinates as MultiPolygon;
  let totalArea = 0, totalPerim = 0, vCount = 0;
  let wMin = Infinity, sMin = Infinity, eMax = -Infinity, nMax = -Infinity;
  let cxAcc = 0, cyAcc = 0, wAcc = 0;
  let allValid = true;
  for (const poly of polys) {
    if (!poly[0] || poly[0].length < 3) continue;
    const outer = poly[0];
    const a = ringArea(outer);
    totalArea += a;
    totalPerim += ringPerimeter(outer);
    vCount += outer.length;
    const bb = bbox(outer);
    wMin = Math.min(wMin, bb.west); sMin = Math.min(sMin, bb.south);
    eMax = Math.max(eMax, bb.east); nMax = Math.max(nMax, bb.north);
    const [clng, clat] = ringCentroid(outer);
    cxAcc += clng * a; cyAcc += clat * a; wAcc += a;
    if (ringsSelfIntersect(outer)) { allValid = false; issues.push(`A polygon ring self-intersects`); }
  }
  if (polys.length > 1) issues.push(`MultiPolygon with ${polys.length} parts — area & perimeter summed across parts`);
  if (!allValid) issues.unshift('One or more rings self-intersect');
  return {
    areaM2: totalArea,
    perimeterM: totalPerim,
    centroid: wAcc > 0 ? [cxAcc / wAcc, cyAcc / wAcc] : [0, 0],
    bbox: { west: wMin, south: sMin, east: eMax, north: nMax },
    vertexCount: vCount,
    valid: allValid && vCount >= 3,
    issues,
  };
}

// ============================================================================
// Parsers
// ============================================================================

export function parseGeoJSON(text: string): Boundary[] {
  const obj = JSON.parse(text);
  const out: Boundary[] = [];
  const feats = obj.type === 'FeatureCollection' ? obj.features
    : obj.type === 'Feature' ? [obj]
    : [obj];
  let idx = 0;
  for (const f of feats) {
    const g = f.geometry ?? f;
    const name = f.properties?.name ?? f.properties?.NAME ?? `Imported ${++idx}`;
    if (g.type === 'Polygon') {
      out.push({ name, type: 'Polygon', coordinates: g.coordinates });
    } else if (g.type === 'MultiPolygon') {
      out.push({ name, type: 'MultiPolygon', coordinates: g.coordinates });
    }
  }
  if (out.length === 0) throw new Error('No Polygon/MultiPolygon found in GeoJSON');
  return out;
}

export function parseWKT(text: string): Boundary[] {
  const t = text.trim();
  const out: Boundary[] = [];
  const polyMatch = t.match(/POLYGON\s*\(([^)]*(?:\([^)]*\)[^)]*)*)\)/i);
  const mPolyMatch = t.match(/MULTIPOLYGON\s*\(\s*(.*?)\s*\)\s*$/i);
  const parseRing = (s: string): Ring => {
    const nums = s.trim().split(/[\s,]+/).map(Number).filter(n => Number.isFinite(n));
    const ring: Ring = [];
    for (let i = 0; i + 1 < nums.length; i += 2) ring.push([nums[i], nums[i + 1]]);
    return ring;
  };
  if (mPolyMatch) {
    const polys: Polygon[] = [];
    const polyStrs = mPolyMatch[1].match(/\(\([^)]*\)\)/g);
    if (polyStrs) {
      for (const ps of polyStrs) {
        const inner = ps.slice(2, -2);
        const rings: Ring[] = inner.split(',').map(parseRing).filter(r => r.length >= 3);
        polys.push(rings);
      }
    }
    out.push({ name: 'Imported MultiPolygon', type: 'MultiPolygon', coordinates: polys });
  } else if (polyMatch) {
    const inner = polyMatch[1].trim();
    const body = inner.replace(/^\(/, '').replace(/\)$/, '');
    const rings: Ring[] = body.split(/\)\s*,\s*\(/).map((s) => {
      const clean = s.replace(/^\(/, '').replace(/\)$/, '');
      return parseRing(clean);
    }).filter(r => r.length >= 3);
    out.push({ name: 'Imported Polygon', type: 'Polygon', coordinates: rings });
  } else {
    throw new Error('Not a valid WKT POLYGON/MULTIPOLYGON');
  }
  return out;
}

export function parseKML(text: string): Boundary[] {
  const out: Boundary[] = [];
  const doc = typeof DOMParser !== 'undefined' ? new DOMParser().parseFromString(text, 'application/xml') : null;
  if (!doc) throw new Error('KML parsing requires a browser environment');
  const placemarks = doc.getElementsByTagName('Placemark');
  const list = placemarks.length ? Array.from(placemarks) : [];
  if (list.length === 0) throw new Error('No <Placemark> found in KML');
  let idx = 0;
  for (const pm of list) {
    const nameEl = pm.getElementsByTagName('name')[0];
    const name = nameEl?.textContent?.trim() || `Imported ${++idx}`;
    const coordEls = pm.getElementsByTagName('coordinates');
    if (!coordEls.length) continue;
    const multiGeo = pm.getElementsByTagName('MultiGeometry')[0];
    if (multiGeo) {
      const polys: Polygon[] = [];
      const polyEls = multiGeo.getElementsByTagName('Polygon');
      for (const pe of Array.from(polyEls)) {
        const outerBoundary = pe.getElementsByTagName('outerBoundaryIs')[0];
        const coords = outerBoundary?.getElementsByTagName('coordinates')[0]?.textContent?.trim();
        if (!coords) continue;
        const ring: Ring = coords.split(/\s+/).filter(Boolean).map(t => {
          const [lng, lat] = t.split(',').map(Number);
          return [lng, lat];
        });
        if (ring.length >= 3) polys.push([ring]);
      }
      if (polys.length) out.push({ name, type: 'MultiPolygon', coordinates: polys });
    } else {
      const coords = coordEls[0].textContent?.trim();
      if (!coords) continue;
      const ring: Ring = coords.split(/\s+/).filter(Boolean).map(t => {
        const [lng, lat] = t.split(',').map(Number);
        return [lng, lat];
      });
      if (ring.length >= 3) out.push({ name, type: 'Polygon', coordinates: [ring] });
    }
  }
  if (out.length === 0) throw new Error('No Polygon coordinates parsed from KML');
  return out;
}

export function parseCSV(text: string): Boundary[] {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 3) throw new Error('CSV needs a header and ≥3 coordinate rows');
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const latIdx = header.findIndex(h => h.includes('lat'));
  const lngIdx = header.findIndex(h => h.includes('lon') || h.includes('lng'));
  const nameIdx = header.findIndex(h => h === 'name' || h === 'field');
  if (latIdx === -1 || lngIdx === -1) throw new Error('CSV must have latitude and longitude columns');
  const ring: Ring = [];
  let lastName = '';
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const lat = parseFloat(cols[latIdx]);
    const lng = parseFloat(cols[lngIdx]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    ring.push([lng, lat]);
    if (nameIdx !== -1 && cols[nameIdx]) lastName = cols[nameIdx];
  }
  if (ring.length < 3) throw new Error('CSV yielded fewer than 3 valid coordinate rows');
  return [{ name: lastName || 'Imported CSV Polygon', type: 'Polygon', coordinates: [ring] }];
}

export function detectAndParse(text: string): { boundaries: Boundary[]; format: ImportFormat } {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Empty input');
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return { boundaries: parseGeoJSON(trimmed), format: 'geojson' };
  }
  if (/^\s*<\?xml|^\s*<kml/i.test(trimmed)) {
    return { boundaries: parseKML(trimmed), format: 'kml' };
  }
  if (/^POLYGON|^MULTIPOLYGON/i.test(trimmed)) {
    return { boundaries: parseWKT(trimmed), format: 'wkt' };
  }
  return { boundaries: parseCSV(trimmed), format: 'csv' };
}

// ============================================================================
// Serialisers (export)
// ============================================================================

export function toGeoJSON(b: Boundary): string {
  return JSON.stringify({
    type: 'Feature',
    properties: { name: b.name },
    geometry: { type: b.type, coordinates: b.coordinates },
  }, null, 2);
}

export function toWKT(b: Boundary): string {
  const ringToWKT = (r: Ring) => {
    const closed = isClosed(r) ? r : [...r, r[0]];
    return `(${closed.map(([lng, lat]) => `${lng} ${lat}`).join(', ')})`;
  };
  if (b.type === 'Polygon') {
    return `POLYGON (${(b.coordinates as Polygon).map(ringToWKT).join(', ')})`;
  }
  return `MULTIPOLYGON (${(b.coordinates as MultiPolygon).map(p => `(${p.map(ringToWKT).join(', ')})`).join(', ')})`;
}

export function toKML(b: Boundary): string {
  const ringCoords = (r: Ring) => {
    const closed = isClosed(r) ? r : [...r, r[0]];
    return closed.map(([lng, lat]) => `${lng},${lat},0`).join(' ');
  };
  const polyBlock = (p: Polygon) => `<Polygon><outerBoundaryIs><LinearRing><coordinates>${ringCoords(p[0])}</coordinates></LinearRing></outerBoundaryIs></Polygon>`;
  let geom: string;
  if (b.type === 'Polygon') geom = polyBlock(b.coordinates as Polygon);
  else geom = `<MultiGeometry>${(b.coordinates as MultiPolygon).map(polyBlock).join('')}</MultiGeometry>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>${escapeXml(b.name)}</name>
      ${geom}
    </Placemark>
  </Document>
</kml>`;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!));
}

export function toCSV(b: Boundary): string {
  const rows: string[] = ['name,latitude,longitude'];
  const walkRing = (r: Ring) => {
    for (const [lng, lat] of r) rows.push(`${b.name},${lat},${lng}`);
  };
  if (b.type === 'Polygon') {
    (b.coordinates as Polygon).forEach(walkRing);
  } else {
    (b.coordinates as MultiPolygon).flat().forEach(walkRing);
  }
  return rows.join('\n');
}
