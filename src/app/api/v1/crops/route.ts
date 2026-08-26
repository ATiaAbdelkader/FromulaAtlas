import { NextRequest, NextResponse } from 'next/server';
import { CROP_IRRIGATION_DATA } from '@/lib/irrigation-crop-data';
import { CROP_PRESETS } from '@/lib/crop-presets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/crops
 *   - id: get specific crop irrigation data
 *   - category: filter by category (vegetable/fruit/cereal/industrial/forage)
 *
 * GET /api/v1/crops?presets=true — get crop presets for hydro/irrigation/etc.
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const category = searchParams.get('category');
  const presets = searchParams.get('presets') === 'true';

  if (presets) {
    return NextResponse.json({
      total: CROP_PRESETS.length,
      results: CROP_PRESETS.map(c => ({
        id: c.id, name: c.name, emoji: c.emoji, category: c.category,
        hydroSolution: c.hydroSolution,
        irrigation: c.irrigation,
      })),
    });
  }

  let results = CROP_IRRIGATION_DATA;
  if (id) results = results.filter(c => c.id === id);
  if (category) results = results.filter(c => c.category === category);

  return NextResponse.json({
    total: results.length,
    results: results.map(c => ({
      id: c.id, name_fr: c.name_fr, name_en: c.name_en, category: c.category,
      annual_consumption_mm: c.annual_consumption_mm,
      annual_irrigation_mm: c.annual_irrigation_mm,
      decadal_irrigation_mm: c.decadal_irrigation_mm,
      season_months: c.season_months,
      notes: c.notes,
    })),
  });
}
