/**
 * Satellite NDVI service — fetches vegetation index data for field parcels.
 *
 * Architecture:
 * - Primary: Sentinel Hub Copernicus Data Space Ecosystem (free tier, requires API key)
 * - Fallback: Simulated NDVI based on field characteristics + historical patterns
 *
 * NDVI = (NIR - Red) / (NIR + Red)
 * Range: -1 (water) to +1 (dense vegetation)
 * Healthy crops: 0.6 - 0.9
 * Stressed: 0.3 - 0.5
 * Bare soil: 0.1 - 0.2
 */

export interface FieldBoundary {
  name: string;
  lat: number;
  lng: number;
  areaHa: number;
  // Bounding box (simplified rectangular field)
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface NdviZone {
  id: string;
  // Grid cell within the field (0-1 normalized position)
  x: number;  // 0 = west, 1 = east
  y: number;  // 0 = north, 1 = south
  ndvi: number;
  health: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
  areaPct: number;  // percentage of total field area
  recommendation?: string;
}

export interface NdviResult {
  field: FieldBoundary;
  zones: NdviZone[];
  averageNdvi: number;
  minNdvi: number;
  maxNdvi: number;
  stressedAreaPct: number;
  date: string;
  satellite: string;
  cloudCover: number;
  recommendations: string[];
}

/** Classify NDVI value into health category. */
export function classifyNdvi(ndvi: number): NdviZone['health'] {
  if (ndvi >= 0.7) return 'excellent';
  if (ndvi >= 0.55) return 'good';
  if (ndvi >= 0.4) return 'moderate';
  if (ndvi >= 0.25) return 'poor';
  return 'critical';
}

/** Color for NDVI value (red → yellow → green gradient). */
export function ndviColor(ndvi: number): string {
  if (ndvi < 0.1) return '#8B4513';     // bare soil (brown)
  if (ndvi < 0.25) return '#D32F2F';    // critical (red)
  if (ndvi < 0.4) return '#F57C00';     // poor (orange)
  if (ndvi < 0.55) return '#FBC02D';    // moderate (yellow)
  if (ndvi < 0.7) return '#7CB342';     // good (light green)
  if (ndvi < 0.8) return '#388E3C';     // excellent (green)
  return '#1B5E20';                      // dense vegetation (dark green)
}

const HEALTH_LABELS: Record<NdviZone['health'], string> = {
  excellent: 'Excellent',
  good: 'Good',
  moderate: 'Moderate stress',
  poor: 'Poor — action needed',
  critical: 'Critical — investigate',
};

const HEALTH_RECOMMENDATIONS: Record<NdviZone['health'], string> = {
  excellent: 'No action needed. Maintain current management.',
  good: 'Monitor regularly. Slight room for improvement.',
  moderate: 'Check for nutrient deficiency, water stress, or early disease. Petiole test recommended.',
  poor: 'Immediate scouting needed. Likely water stress, nutrient deficiency, or pest pressure. Apply corrective action within 7 days.',
  critical: 'Urgent field visit required. Severe stress — possible crop failure in this zone. Check for disease, pest, drainage, or irrigation failure.',
};

/**
 * Generate a simulated NDVI field map.
 *
 * In production, replace this with a real Sentinel-2 API call:
 *   POST https://services.sentinel-hub.com/api/v1/process
 *   Body: { input: { bounds: { bbox: [west, south, east, north] }, data: [{ type: 'sentinel-2-l2a' }] },
 *           evalscript: '// NDVI calculation' }
 *
 * The simulation creates a realistic pattern based on:
 * - Field area (larger fields have more variability)
 * - Random zones of stress (water, nutrients, pests)
 * - Edge effects (lower NDVI at field borders)
 */
export function simulateNdvi(field: FieldBoundary, cropType = 'maize'): NdviResult {
  const gridSize = 8;  // 8×8 grid = 64 zones
  const zones: NdviZone[] = [];

  // Base NDVI depends on crop type and season
  const baseNdvi: Record<string, number> = {
    maize: 0.68, tomato: 0.65, wheat: 0.62, rice: 0.70,
    potato: 0.63, soybean: 0.66, cotton: 0.60, default: 0.65,
  };
  const base = baseNdvi[cropType.toLowerCase()] || baseNdvi.default;

  // Generate 1-3 stress zones (random position + size)
  const stressZones: Array<{ cx: number; cy: number; radius: number; severity: number }> = [];
  const numStress = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < numStress; i++) {
    stressZones.push({
      cx: 0.2 + Math.random() * 0.6,
      cy: 0.2 + Math.random() * 0.6,
      radius: 0.1 + Math.random() * 0.2,
      severity: 0.15 + Math.random() * 0.25,
    });
  }

  let totalNdvi = 0;
  let minNdvi = 1;
  let maxNdvi = -1;
  let stressedCells = 0;

  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      const x = (gx + 0.5) / gridSize;
      const y = (gy + 0.5) / gridSize;

      // Start with base NDVI + small random variation
      let ndvi = base + (Math.random() - 0.5) * 0.08;

      // Apply stress zones (Gaussian falloff)
      for (const sz of stressZones) {
        const dist = Math.sqrt((x - sz.cx) ** 2 + (y - sz.cy) ** 2);
        if (dist < sz.radius) {
          const falloff = 1 - (dist / sz.radius);
          ndvi -= sz.severity * falloff;
        }
      }

      // Edge effect: lower NDVI at borders (1-2 cells from edge)
      const edgeDist = Math.min(x, y, 1 - x, 1 - y);
      if (edgeDist < 0.15) {
        ndvi -= (0.15 - edgeDist) * 0.3;
      }

      // Clamp
      ndvi = Math.max(0.05, Math.min(0.95, ndvi));

      const health = classifyNdvi(ndvi);
      if (health === 'poor' || health === 'critical') stressedCells++;

      totalNdvi += ndvi;
      minNdvi = Math.min(minNdvi, ndvi);
      maxNdvi = Math.max(maxNdvi, ndvi);

      zones.push({
        id: `zone-${gx}-${gy}`,
        x, y,
        ndvi: Math.round(ndvi * 100) / 100,
        health,
        areaPct: Math.round((100 / (gridSize * gridSize)) * 10) / 10,
      });
    }
  }

  const averageNdvi = Math.round((totalNdvi / zones.length) * 100) / 100;
  const stressedAreaPct = Math.round((stressedCells / zones.length) * 100);

  // Generate recommendations
  const recommendations: string[] = [];
  if (stressedAreaPct > 30) {
    recommendations.push(`⚠️ ${stressedAreaPct}% of the field shows stress. Priority scouting recommended in the next 48 hours.`);
  } else if (stressedAreaPct > 15) {
    recommendations.push(`${stressedAreaPct}% of the field shows moderate stress. Schedule a field walk this week.`);
  } else {
    recommendations.push(`✅ Field health is good. Only ${stressedAreaPct}% shows minor stress. Continue routine monitoring.`);
  }

  if (minNdvi < 0.3) {
    recommendations.push(`Critical zone detected (NDVI ${minNdvi}). Possible crop failure — check for irrigation failure, disease, or pest damage.`);
  }

  if (maxNdvi - minNdvi > 0.3) {
    recommendations.push(`High variability (Δ${Math.round((maxNdvi - minNdvi) * 100) / 100}) suggests uneven management. Consider variable-rate application.`);
  }

  if (averageNdvi < 0.5) {
    recommendations.push(`Average NDVI (${averageNdvi}) is below optimal for ${cropType}. Check overall nutrition and water status.`);
  }

  return {
    field,
    zones,
    averageNdvi,
    minNdvi: Math.round(minNdvi * 100) / 100,
    maxNdvi: Math.round(maxNdvi * 100) / 100,
    stressedAreaPct,
    date: new Date().toISOString().slice(0, 10),
    satellite: 'Sentinel-2 (simulated)',
    cloudCover: Math.round(Math.random() * 15),
    recommendations,
  };
}

/** Get health label for display. */
export function healthLabel(health: NdviZone['health']): string {
  return HEALTH_LABELS[health];
}

/** Get recommendation for a zone's health level. */
export function healthRecommendation(health: NdviZone['health']): string {
  return HEALTH_RECOMMENDATIONS[health];
}

/** Generate a field boundary from center point + area. */
export function fieldFromCenter(lat: number, lng: number, areaHa: number, name: string): FieldBoundary {
  // Approximate degrees per hectare (varies by latitude)
  const degPerHa = 0.001 / 100;  // rough: ~100m per 0.001°
  const halfSide = Math.sqrt(areaHa) * degPerHa * 50;  // half side in degrees
  return {
    name,
    lat, lng,
    areaHa,
    north: lat + halfSide,
    south: lat - halfSide,
    east: lng + halfSide / Math.cos(lat * Math.PI / 180),
    west: lng - halfSide / Math.cos(lat * Math.PI / 180),
  };
}
