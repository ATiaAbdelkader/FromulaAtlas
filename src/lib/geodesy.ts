/**
 * Geodesy utilities — distance, bearing, midpoint, destination, point-in-polygon.
 *
 * Pure functions — no React, no DOM, no network. Safe to use server-side,
 * in workers, in tests, or in any agri component.
 *
 * Algorithms:
 *   - Vincenty inverse (geodesic distance + initial/final bearings) — WGS84
 *     ellipsoid, ~mm accuracy. Iterative; falls back to haversine if no
 *     convergence (rare, near-antipodal points).
 *   - Vincenty direct (destination point given start, bearing, distance).
 *   - Midpoint via spherical interpolation (sufficient for any practical
 *     field scale; error < 1 mm at 100 km).
 *   - Point-in-polygon via ray casting (planar, lat/lng). Robust for any
 *     field-size polygon (< 10 km on a side).
 *
 * References:
 *   - Vincenty, T. (1975). "Direct and Inverse Solutions of Geodesics on
 *     the Ellipsoid with Application of Nested Equations."
 *     Survey Review 23 (176): 88–93.
 */

import type { Ring } from './field-boundary';

const A = 6378137.0;            // WGS84 semi-major axis (m)
const F = 1 / 298.257223563;    // WGS84 flattening
const B = (1 - F) * A;          // semi-minor axis
const EPS = 1e-12;
const MAX_ITER = 200;

export interface LatLng { lat: number; lng: number; }

export interface GeodesicResult {
  /** Geodesic distance in metres. */
  distance: number;
  /** Initial bearing at point A, in degrees clockwise from north (0–360). */
  initialBearing: number;
  /** Final bearing arriving at point B, in degrees clockwise from north (0–360). */
  finalBearing: number;
  /** Convergence status — false means haversine fallback was used. */
  converged: boolean;
}

/**
 * Vincenty inverse — distance + bearings between two lat/lng points.
 * Falls back to haversine if iteration fails to converge (rare).
 */
export function vincentyInverse(a: LatLng, b: LatLng): GeodesicResult {
  const toRad = (d: number) => d * Math.PI / 180;
  const toDeg = (r: number) => r * 180 / Math.PI;

  const L = toRad(b.lng - a.lng);
  const U1 = Math.atan((1 - F) * Math.tan(toRad(a.lat)));
  const U2 = Math.atan((1 - F) * Math.tan(toRad(b.lat)));
  const sinU1 = Math.sin(U1), cosU1 = Math.cos(U1);
  const sinU2 = Math.sin(U2), cosU2 = Math.cos(U2);

  let lambda = L;
  let lambdaP: number;
  let sinSigma = 0, cosSigma = 0, sigma = 0;
  let cosSqAlpha = 0, cos2SigmaM = 0;
  let iter = 0;

  do {
    const sinLambda = Math.sin(lambda);
    const cosLambda = Math.cos(lambda);
    sinSigma = Math.sqrt(
      (cosU2 * sinLambda) ** 2 +
      (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) ** 2,
    );
    if (sinSigma === 0) {
      // Co-incident points.
      return { distance: 0, initialBearing: 0, finalBearing: 0, converged: true };
    }
    cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    sigma = Math.atan2(sinSigma, cosSigma);
    const sinAlpha = (cosU1 * cosU2 * sinLambda) / sinSigma;
    cosSqAlpha = 1 - sinAlpha ** 2;
    cos2SigmaM = cosSigma - (2 * sinU1 * sinU2) / (cosSqAlpha || 1);
    if (!Number.isFinite(cos2SigmaM)) cos2SigmaM = 0;  // equatorial line
    const C = (F / 16) * cosSqAlpha * (4 + F * (4 - 3 * cosSqAlpha));
    lambdaP = lambda;
    lambda = L + (1 - C) * F * sinAlpha *
      (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM ** 2)));
    iter++;
  } while (Math.abs(lambda - lambdaP) > EPS && iter < MAX_ITER);

  if (iter >= MAX_ITER) {
    // Fallback to haversine for near-antipodal cases.
    const d = haversineDistance(a, b);
    const brg = initialBearingSpherical(a, b);
    return { distance: d, initialBearing: brg, finalBearing: brg, converged: false };
  }

  const uSq = cosSqAlpha * (A ** 2 - B ** 2) / (B ** 2);
  const A_ = 1 + (uSq / 16384) * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  const B_ = (uSq / 1024) * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  const deltaSigma = B_ * sinSigma *
    (cos2SigmaM + (B_ / 4) *
      (cosSigma * (-1 + 2 * cos2SigmaM ** 2) -
        (B_ / 6) * cos2SigmaM * (-3 + 4 * sinSigma ** 2) * (-3 + 4 * cos2SigmaM ** 2)));

  const distance = B * A_ * (sigma - deltaSigma);

  // Bearing at A (forward azimuth).
  const alpha1 = Math.atan2(
    cosU2 * Math.sin(lambda),
    cosU1 * sinU2 - sinU1 * cosU2 * Math.cos(lambda),
  );
  // Bearing at B (back-azimuth flipped to forward).
  const alpha2 = Math.atan2(
    cosU1 * Math.sin(lambda),
    -sinU1 * cosU2 + cosU1 * sinU2 * Math.cos(lambda),
  );

  const norm = (deg: number) => (deg + 360) % 360;
  return {
    distance,
    initialBearing: norm(toDeg(alpha1)),
    finalBearing: norm(toDeg(alpha2)),
    converged: true,
  };
}

export interface DestinationResult {
  point: LatLng;
  finalBearing: number;
}

/**
 * Vincenty direct — destination point given start, bearing, distance.
 */
export function vincentyDirect(start: LatLng, bearingDeg: number, distance: number): DestinationResult {
  const toRad = (d: number) => d * Math.PI / 180;
  const toDeg = (r: number) => r * 180 / Math.PI;
  const norm = (deg: number) => (deg + 360) % 360;

  const alpha1 = toRad(bearingDeg);
  const sinAlpha1 = Math.sin(alpha1);
  const cosAlpha1 = Math.cos(alpha1);

  const tanU1 = (1 - F) * Math.tan(toRad(start.lat));
  const cosU1 = 1 / Math.sqrt(1 + tanU1 ** 2);
  const sinU1 = tanU1 * cosU1;
  const sigma1 = Math.atan2(tanU1, cosAlpha1);
  const sinAlpha = cosU1 * sinAlpha1;
  const cosSqAlpha = 1 - sinAlpha ** 2;
  const uSq = cosSqAlpha * (A ** 2 - B ** 2) / (B ** 2);
  const A_ = 1 + (uSq / 16384) * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  const B_ = (uSq / 1024) * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));

  let sigma = distance / (B * A_);
  let sigmaP: number;
  let cos2SigmaM = 0, sinSigma = 0, cosSigma = 0;
  let iter = 0;
  do {
    cos2SigmaM = Math.cos(2 * sigma1 + sigma);
    sinSigma = Math.sin(sigma);
    cosSigma = Math.cos(sigma);
    const deltaSigma = B_ * sinSigma *
      (cos2SigmaM + (B_ / 4) *
        (cosSigma * (-1 + 2 * cos2SigmaM ** 2) -
          (B_ / 6) * cos2SigmaM * (-3 + 4 * sinSigma ** 2) * (-3 + 4 * cos2SigmaM ** 2)));
    sigmaP = sigma;
    sigma = distance / (B * A_) + deltaSigma;
    iter++;
  } while (Math.abs(sigma - sigmaP) > EPS && iter < MAX_ITER);

  const tmp = sinU1 * sinSigma - cosU1 * cosSigma * cosAlpha1;
  const lat2 = Math.atan2(
    sinU1 * cosSigma + cosU1 * sinSigma * cosAlpha1,
    (1 - F) * Math.sqrt(sinAlpha ** 2 + tmp ** 2),
  );
  const lambda = Math.atan2(sinSigma * sinAlpha1, cosU1 * cosSigma - sinU1 * sinSigma * cosAlpha1);
  const C = (F / 16) * cosSqAlpha * (4 + F * (4 - 3 * cosSqAlpha));
  const L = lambda - (1 - C) * F * sinAlpha *
    (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM ** 2)));
  const lng2 = start.lng + toDeg(L);

  const alpha2 = Math.atan2(sinAlpha, -tmp);
  return {
    point: { lat: toDeg(lat2), lng: ((lng2 + 540) % 360) - 180 },
    finalBearing: norm(toDeg(alpha2)),
  };
}

/** Spherical midpoint (sufficient for field-scale distances). */
export function midpoint(a: LatLng, b: LatLng): LatLng {
  const toRad = (d: number) => d * Math.PI / 180;
  const toDeg = (r: number) => r * 180 / Math.PI;
  const lat1 = toRad(a.lat), lng1 = toRad(a.lng);
  const lat2 = toRad(b.lat), lng2 = toRad(b.lng);
  const dLng = lng2 - lng1;
  const bx = Math.cos(lat2) * Math.cos(dLng);
  const by = Math.cos(lat2) * Math.sin(dLng);
  const lat3 = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt((Math.cos(lat1) + bx) ** 2 + by ** 2),
  );
  const lng3 = lng1 + Math.atan2(by, Math.cos(lat1) + bx);
  return { lat: toDeg(lat3), lng: ((toDeg(lng3) + 540) % 360) - 180 };
}

/**
 * Haversine great-circle distance (m).
 * Used as fallback for non-converging Vincenty.
 */
export function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6378137.0;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial bearing (spherical). Used as Vincenty fallback. */
function initialBearingSpherical(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => d * Math.PI / 180;
  const toDeg = (r: number) => r * 180 / Math.PI;
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Compass direction (16-point rose) from a bearing in degrees.
 * 0°=N, 22.5°=NNE, 45°=NE, etc.
 */
export function compass16(bearingDeg: number): string {
  const dirs = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
  ];
  const idx = Math.round(((bearingDeg % 360) + 360) % 360 / 22.5) % 16;
  return dirs[idx];
}

/** Format a distance in metres as either m or km depending on magnitude. */
export function formatDistance(m: number): string {
  if (m < 1000) return `${m.toFixed(1)} m`;
  if (m < 100_000) return `${(m / 1000).toFixed(3)} km`;
  return `${(m / 1000).toFixed(1)} km`;
}

// ============================================================================
// Polygon-aware helpers (work on Ring = [lng, lat][])
// ============================================================================

/** Nearest distance (m) from a point to any vertex of a ring. */
export function nearestVertexDistance(p: LatLng, ring: Ring): { distance: number; vertex: [number, number]; index: number } {
  let best = Infinity;
  let bestV: [number, number] = ring[0];
  let bestI = 0;
  for (let i = 0; i < ring.length; i++) {
    const v = ring[i];
    const d = haversineDistance(p, { lat: v[1], lng: v[0] });
    if (d < best) { best = d; bestV = v; bestI = i; }
  }
  return { distance: best, vertex: bestV, index: bestI };
}

/**
 * Minimum distance (m) from a point to a ring (segment-aware). Iterates over
 * all edges and uses spherical approximation: project the segment locally to
 * a planar coordinate system (equirectangular at the segment midpoint), find
 * the planar perpendicular distance, then convert back to metres.
 *
 * Good for any field-scale polygon. Edge effects <1 cm at 10 km.
 */
export function nearestEdgeDistance(p: LatLng, ring: Ring): { distance: number; closest: [number, number] } {
  if (ring.length < 2) return { distance: Infinity, closest: ring[0] || [0, 0] };
  const closed = ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
    ? ring
    : [...ring, ring[0]];
  let best = Infinity;
  let bestPt: [number, number] = closed[0];
  const R = 6378137.0;
  for (let i = 0; i < closed.length - 1; i++) {
    const [lng1, lat1] = closed[i];
    const [lng2, lat2] = closed[i + 1];
    const midLat = (lat1 + lat2) / 2 * Math.PI / 180;
    const kLng = Math.cos(midLat) * R * Math.PI / 180;
    const kLat = R * Math.PI / 180;
    // Planar projection around segment start.
    const x1 = 0, y1 = 0;
    const x2 = (lng2 - lng1) * kLng, y2 = (lat2 - lat1) * kLat;
    const px = (p.lng - lng1) * kLng, py = (p.lat - lat1) * kLat;
    const dx = x2 - x1, dy = y2 - y1;
    const segLen2 = dx * dx + dy * dy;
    let t = segLen2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / segLen2;
    t = Math.max(0, Math.min(1, t));
    const cx = x1 + t * dx, cy = y1 + t * dy;
    const planarDist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
    if (planarDist < best) {
      best = planarDist;
      // Convert back to lng/lat.
      bestPt = [lng1 + cx / kLng, lat1 + cy / kLat];
    }
  }
  return { distance: best, closest: bestPt };
}

/**
 * Point-in-polygon test (ray casting, planar).
 * Ring is [lng, lat][] in degrees. Handles closed or unclosed rings.
 */
export function pointInRing(p: LatLng, ring: Ring): boolean {
  if (ring.length < 3) return false;
  const closed = ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
    ? ring
    : [...ring, ring[0]];
  let inside = false;
  for (let i = 0, j = closed.length - 2; i < closed.length - 1; j = i++) {
    const [xi, yi] = closed[i];
    const [xj, yj] = closed[j];
    const intersect = (yi > p.lat) !== (yj > p.lat) &&
      p.lng < ((xj - xi) * (p.lat - yi)) / (yj - yi + 1e-18) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
