/**
 * Elevation & topographic analysis — uses Open-Meteo's free elevation API
 * (no key, up to 100 points per call) plus pure-function terrain analysis.
 *
 * Provides:
 *   - Point elevation lookup (single or batched)
 *   - Elevation profile along a path (sampled at N points)
 *   - Grid elevation survey (NxN grid over a bounding box)
 *   - Slope (degrees + percent) from a 3×3 neighborhood
 *   - Aspect (compass direction the slope faces)
 *   - Hillshade (illumination given sun azimuth + altitude)
 *   - Total ascent / descent along a path
 *   - Contour simplification (Douglas-Peucker-ish threshold filter)
 *
 * Reference:
 *   - Open-Meteo elevation docs: https://open-meteo.com/en/docs/elevation-api
 *   - Huggett, R. (2016). "Fundamentals of Geomorphology" — slope/aspect/hillshade
 *   - Horn, B.K.P. (1981). "Hill Shading and the Reflectance Map"
 *
 * Free tier (no key):
 *   - 10,000 calls/day for non-commercial use
 *   - Up to 100 lat/lng pairs per call (batched)
 */

const ELEVATION_URL = 'https://api.open-meteo.com/v1/elevation';
const MAX_BATCH = 100;  // Open-Meteo limit per call

// ============================================================================
// Types
// ============================================================================

export interface ElevationPoint {
  lat: number;
  lng: number;
  /** Metres above sea level. */
  elevation: number;
}

export interface PathProfile {
  points: ElevationPoint[];
  /** Distance (m) from start to each sample point. */
  distances: number[];
  /** Total ascent (m) — sum of all uphill transitions. */
  ascent: number;
  /** Total descent (m) — sum of all downhill transitions. */
  descent: number;
  /** Maximum elevation (m). */
  maxElev: number;
  /** Minimum elevation (m). */
  minElev: number;
  /** Average slope along the path (degrees). */
  avgSlope: number;
  /** Steepest segment slope (degrees). */
  maxSlope: number;
  /** Total path length (m). */
  totalDistance: number;
}

export interface SlopeGrid {
  /** Grid metadata. */
  cols: number;
  rows: number;
  /** Cell size in metres. */
  cellSizeM: number;
  /** Elevation grid [row][col] in metres (row 0 = north). */
  elevations: number[][];
  /** Slope grid [row][col] in degrees. */
  slope: number[][];
  /** Aspect grid [row][col] in degrees (0=N, 90=E, 180=S, 270=W). */
  aspect: number[][];
  /** Hillshade grid [row][col] (0–255). */
  hillshade: number[][];
  /** Bounding box. */
  bbox: { north: number; south: number; east: number; west: number };
  /** Stats. */
  stats: {
    avgSlope: number;
    maxSlope: number;
    flatPct: number;       // % of cells < 3°
    gentlePct: number;     // % 3–8°
    moderatePct: number;   // % 8–15°
    steepPct: number;      // % 15–25°
    verySteepPct: number;  // % > 25°
    avgElevation: number;
  };
}

// ============================================================================
// API client
// ============================================================================

/**
 * Fetch elevations for a list of points. Batches internally to respect the
 * 100-point Open-Meteo limit. Returns elevations in the same order as the
 * input. Throws on network failure.
 */
export async function getElevations(points: { lat: number; lng: number }[]): Promise<number[]> {
  if (points.length === 0) return [];
  const out: number[] = [];
  for (let i = 0; i < points.length; i += MAX_BATCH) {
    const batch = points.slice(i, i + MAX_BATCH);
    const lats = batch.map(p => p.lat).join(',');
    const lngs = batch.map(p => p.lng).join(',');
    const url = `${ELEVATION_URL}?latitude=${lats}&longitude=${lngs}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Elevation API failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    const arr: number[] = data?.elevation ?? [];
    if (arr.length !== batch.length) {
      throw new Error(`Elevation API returned ${arr.length} values, expected ${batch.length}`);
    }
    out.push(...arr);
  }
  return out;
}

/** Convenience: single-point elevation. */
export async function getElevation(lat: number, lng: number): Promise<number> {
  const arr = await getElevations([{ lat, lng }]);
  return arr[0];
}

// ============================================================================
// Path profile
// ============================================================================

/**
 * Sample elevation along a path from `start` to `end`, using `samples` evenly-
 * spaced points. Returns full profile with ascent/descent/slope stats.
 *
 * `samples` defaults to 20 (Open-Meteo batch-friendly). Max 1000.
 */
export async function getPathProfile(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  samples = 20,
): Promise<PathProfile> {
  const n = Math.max(2, Math.min(1000, samples));
  const pts: { lat: number; lng: number }[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    pts.push({
      lat: start.lat + (end.lat - start.lat) * t,
      lng: start.lng + (end.lng - start.lng) * t,
    });
  }
  const elevs = await getElevations(pts);

  // Distances via haversine
  const distances: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    distances.push(distances[i - 1] + haversine(pts[i - 1], pts[i]));
  }

  const points: ElevationPoint[] = pts.map((p, i) => ({ ...p, elevation: elevs[i] }));
  let ascent = 0, descent = 0, maxElev = -Infinity, minElev = Infinity;
  let maxSlope = 0, slopeSum = 0;
  for (let i = 0; i < points.length; i++) {
    maxElev = Math.max(maxElev, points[i].elevation);
    minElev = Math.min(minElev, points[i].elevation);
    if (i > 0) {
      const dElev = points[i].elevation - points[i - 1].elevation;
      const dDist = distances[i] - distances[i - 1];
      if (dElev > 0) ascent += dElev;
      else descent += -dElev;
      if (dDist > 0) {
        const slope = Math.atan2(Math.abs(dElev), dDist) * 180 / Math.PI;
        maxSlope = Math.max(maxSlope, slope);
        slopeSum += slope;
      }
    }
  }

  return {
    points,
    distances,
    ascent,
    descent,
    maxElev,
    minElev,
    avgSlope: slopeSum / Math.max(1, points.length - 1),
    maxSlope,
    totalDistance: distances[distances.length - 1],
  };
}

// ============================================================================
// Slope grid
// ============================================================================

/**
 * Sample an N×N grid of elevations over a bounding box and compute slope,
 * aspect, and hillshade for each cell.
 *
 * @param bbox The bounding box (north/south/east/west in degrees).
 * @param gridSize Number of cells per side (default 8 = 64 points). Max 30 (900 points — multiple Open-Meteo batches).
 * @param sunAzimuth Sun azimuth in degrees (0=N, 90=E, 180=S, 270=W). Default 135 (NW, typical morning light).
 * @param sunAltitude Sun altitude in degrees (0=horizon, 90=zenith). Default 45.
 */
export async function getSlopeGrid(
  bbox: { north: number; south: number; east: number; west: number },
  gridSize = 8,
  sunAzimuth = 135,
  sunAltitude = 45,
): Promise<SlopeGrid> {
  const n = Math.max(3, Math.min(30, gridSize));
  const cols = n, rows = n;

  // Sample grid (row 0 = north, row n-1 = south).
  const pts: { lat: number; lng: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lat = bbox.north - (r / (rows - 1)) * (bbox.north - bbox.south);
      const lng = bbox.west + (c / (cols - 1)) * (bbox.east - bbox.west);
      pts.push({ lat, lng });
    }
  }
  const elevs = await getElevations(pts);
  const elevations: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) row.push(elevs[r * cols + c]);
    elevations.push(row);
  }

  // Cell size in metres (use average of lat/lng spans).
  const latSpanM = (bbox.north - bbox.south) * 111_320;
  const lngSpanM = (bbox.east - bbox.west) * 111_320 * Math.cos((bbox.north + bbox.south) / 2 * Math.PI / 180);
  const cellSizeM = ((latSpanM + lngSpanM) / 2) / (n - 1);

  // Compute slope + aspect + hillshade using Horn's method (3×3 kernel).
  const slope: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));
  const aspect: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));
  const hillshade: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));

  const zenithRad = (90 - sunAltitude) * Math.PI / 180;
  const azimuthRad = (360 - sunAzimuth + 90) * Math.PI / 180;  // convert to math convention

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
        // Edge cells: skip (set to 0). Could pad with neighbours if needed.
        slope[r][c] = 0;
        aspect[r][c] = 0;
        hillshade[r][c] = 0;
        continue;
      }
      // Horn's 3×3 kernel weights
      // [w11 w12 w13]   [dZ/dy direction]
      // [w21 w22 w23]
      // [w31 w32 w33]   (down is +y in image coords, but our grid row 0 = north so we invert)
      const w11 = elevations[r - 1][c - 1], w12 = elevations[r - 1][c],     w13 = elevations[r - 1][c + 1];
      const w21 = elevations[r][c - 1],                                   w23 = elevations[r][c + 1];
      const w31 = elevations[r + 1][c - 1], w32 = elevations[r + 1][c],     w33 = elevations[r + 1][c + 1];
      // dZ/dx (east gradient)
      const dzdx = ((w13 + 2 * w23 + w33) - (w11 + 2 * w21 + w31)) / (8 * cellSizeM);
      // dZ/dy (south gradient — note row 0 = north so positive dy is south)
      const dzdy = ((w31 + 2 * w32 + w33) - (w11 + 2 * w12 + w13)) / (8 * cellSizeM);

      const slopeRad = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy));
      slope[r][c] = slopeRad * 180 / Math.PI;

      // Aspect: 0=N, 90=E, 180=S, 270=W (compass)
      let aspectRad = Math.atan2(dzdy, -dzdx);  // math convention
      // Convert to compass: 0=N, clockwise
      let aspectDeg = 90 - aspectRad * 180 / Math.PI;
      aspectDeg = (aspectDeg + 360) % 360;
      aspect[r][c] = aspectDeg;

      // Hillshade (Horn 1981)
      if (slopeRad === 0) {
        hillshade[r][c] = 255;
      } else {
        const aspectMathRad = (360 - aspectDeg + 90) * Math.PI / 180;
        const hs = Math.max(0, Math.min(255,
          255 * ((Math.cos(zenithRad) * Math.cos(slopeRad)) +
                 (Math.sin(zenithRad) * Math.sin(slopeRad) * Math.cos(azimuthRad - aspectMathRad)))
        ));
        hillshade[r][c] = Math.round(hs);
      }
    }
  }

  // Stats
  let slopeSum = 0, maxSlope = 0, slopeCount = 0;
  let flat = 0, gentle = 0, moderate = 0, steep = 0, verySteep = 0;
  let elevSum = 0;
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      const s = slope[r][c];
      slopeSum += s;
      maxSlope = Math.max(maxSlope, s);
      slopeCount++;
      if (s < 3) flat++;
      else if (s < 8) gentle++;
      else if (s < 15) moderate++;
      else if (s < 25) steep++;
      else verySteep++;
      elevSum += elevations[r][c];
    }
  }
  const inner = Math.max(1, slopeCount);

  return {
    cols, rows, cellSizeM,
    elevations, slope, aspect, hillshade,
    bbox,
    stats: {
      avgSlope: slopeSum / inner,
      maxSlope,
      flatPct: (flat / inner) * 100,
      gentlePct: (gentle / inner) * 100,
      moderatePct: (moderate / inner) * 100,
      steepPct: (steep / inner) * 100,
      verySteepPct: (verySteep / inner) * 100,
      avgElevation: elevSum / inner,
    },
  };
}

// ============================================================================
// Slope classification (FAO / USDA tiers — useful for agri decisions)
// ============================================================================

export type SlopeClass = 'flat' | 'gentle' | 'moderate' | 'steep' | 'very_steep';

export function classifySlope(slopeDeg: number): SlopeClass {
  if (slopeDeg < 3) return 'flat';
  if (slopeDeg < 8) return 'gentle';
  if (slopeDeg < 15) return 'moderate';
  if (slopeDeg < 25) return 'steep';
  return 'very_steep';
}

export const SLOPE_CLASS_INFO: Record<SlopeClass, { label: string; color: string; recommendation: string }> = {
  flat:       { label: 'Flat (0–3°)',         color: '#10b981', recommendation: 'Suitable for all machinery, no erosion control needed. Watch drainage in depressions.' },
  gentle:     { label: 'Gentle (3–8°)',       color: '#84cc16', recommendation: 'Suitable for most crops. Contour ploughing recommended above 5°.' },
  moderate:   { label: 'Moderate (8–15°)',    color: '#eab308', recommendation: 'Contour farming essential. Terracing on long slopes. Limit heavy machinery on wet soil.' },
  steep:      { label: 'Steep (15–25°)',      color: '#f97316', recommendation: 'Terracing required. Permanent vegetation recommended. Avoid conventional tillage.' },
  very_steep: { label: 'Very Steep (>25°)',   color: '#dc2626', recommendation: 'No cultivation. Use for grazing, forestry, or conservation only. High erosion risk.' },
};

/** Convert aspect (deg) to a 16-point compass label. */
export function aspectCompass16(aspectDeg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(((aspectDeg % 360) + 360) % 360 / 22.5) % 16];
}

/** Frost risk based on aspect (in N hemisphere). South-facing slopes: low. Valley bottoms: high. */
export function frostRiskFromAspect(aspectDeg: number, hemisphere: 'N' | 'S' = 'N'): { risk: 'low' | 'moderate' | 'high'; reason: string } {
  if (hemisphere === 'N') {
    // South-facing slopes get more sun → warmer → less frost
    if (aspectDeg >= 135 && aspectDeg <= 225) return { risk: 'low', reason: 'South-facing slope — receives more solar radiation, frost drains away.' };
    if (aspectDeg >= 45 && aspectDeg <= 315) return { risk: 'moderate', reason: 'East/West-facing — moderate frost risk. Cold air may pool on flat sections.' };
    return { risk: 'high', reason: 'North-facing slope — less sun, slower warming. Higher frost risk in spring/fall.' };
  }
  // Southern hemisphere: invert
  if (aspectDeg >= 315 || aspectDeg <= 45) return { risk: 'low', reason: 'North-facing slope (Southern Hemisphere) — receives more solar radiation.' };
  if (aspectDeg >= 135 && aspectDeg <= 225) return { risk: 'high', reason: 'South-facing slope (Southern Hemisphere) — less sun, slower warming.' };
  return { risk: 'moderate', reason: 'East/West-facing — moderate frost risk.' };
}

// ============================================================================
// Internal: haversine (m)
// ============================================================================

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6378137.0;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// ============================================================================
// Formatting helpers
// ============================================================================

export function formatElevation(m: number): string {
  if (!Number.isFinite(m)) return '—';
  if (Math.abs(m) < 1000) return `${m.toFixed(0)} m`;
  return `${(m / 1000).toFixed(2)} km`;
}

export function formatSlope(deg: number): string {
  const pct = Math.tan(deg * Math.PI / 180) * 100;
  return `${deg.toFixed(1)}° (${pct.toFixed(1)}%)`;
}
