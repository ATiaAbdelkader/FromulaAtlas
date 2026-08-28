import { NextRequest, NextResponse } from 'next/server';
import { PLANT_DISEASES } from '@/lib/plant-disease-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/diseases
 *   - crop: filter by crop name (e.g. ?crop=Tomato)
 *   - healthy: "true" to include healthy entries, "false" to exclude
 *   - search: search disease names
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const crop = searchParams.get('crop');
  const healthy = searchParams.get('healthy');
  const search = searchParams.get('search')?.toLowerCase();

  let results = PLANT_DISEASES;
  if (crop) results = results.filter(d => d.crop.toLowerCase() === crop.toLowerCase());
  if (healthy === 'false') results = results.filter(d => !d.is_healthy);
  if (healthy === 'true') results = results.filter(d => d.is_healthy);
  if (search) results = results.filter(d => d.disease_name.toLowerCase().includes(search));

  return NextResponse.json({
    total: results.length,
    results: results.map(d => ({
      id: d.id, disease_name: d.disease_name, crop: d.crop,
      is_healthy: d.is_healthy, severity: d.severity,
      description: d.description, prevention: d.prevention, treatment: d.treatment,
    })),
  });
}
