import { NextRequest, NextResponse } from 'next/server';
import { CROP_IRRIGATION_DATA, getCropIrrigation } from '@/lib/irrigation-crop-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/irrigation
 * Body: {
 *   cropId: string,         // e.g. "field_tomato"
 *   fieldAreaHa: number,
 *   efficiency: number,     // 0-100
 *   systemType: "drip" | "sprinkler" | "furrow"
 * }
 *
 * Response: {
 *   crop: string,
 *   grossAnnualMm: number,
 *   grossAnnualM3: number,
 *   peakDailyMm: number,
 *   monthly: [{ month, netMm, grossMm, grossM3 }],
 *   decadal: [{ decade, netMm, grossMm, grossM3 }]
 * }
 */

const DECADAL_MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cropId, fieldAreaHa = 1, efficiency = 85, systemType = 'drip' } = body;

    if (!cropId) return NextResponse.json({ error: 'cropId is required' }, { status: 400 });

    const crop = getCropIrrigation(cropId);
    if (!crop) return NextResponse.json({ error: `Crop '${cropId}' not found. Available: ${CROP_IRRIGATION_DATA.map(c => c.id).join(', ')}` }, { status: 404 });

    const eff = Math.max(0.1, Math.min(1, Number(efficiency) / 100));
    const area = Math.max(0.1, Number(fieldAreaHa));

    const grossAnnualMm = crop.annual_irrigation_mm / eff;
    const grossAnnualM3 = Math.round(grossAnnualMm * area * 10);

    const decadal = (crop.decadal_irrigation_mm || []).map((netMm, i) => {
      const grossMm = netMm / eff;
      const grossM3 = Math.round(grossMm * area * 10);
      return {
        decade: `${DECADAL_MONTHS[Math.floor(i / 3)]} D${(i % 3) + 1}`,
        netMm, grossMm: Math.round(grossMm * 100) / 100, grossM3,
      };
    });

    const monthly = DECADAL_MONTHS.map((month, mi) => {
      const start = mi * 3;
      const monthDecadals = decadal.slice(start, start + 3);
      return {
        month,
        netMm: monthDecadals.reduce((s, d) => s + d.netMm, 0),
        grossMm: Math.round(monthDecadals.reduce((s, d) => s + d.grossMm, 0) * 100) / 100,
        grossM3: monthDecadals.reduce((s, d) => s + d.grossM3, 0),
      };
    });

    const peak = decadal.reduce((max, d) => d.grossMm > max.grossMm ? d : max, decadal[0] || { grossMm: 0 });
    const peakDailyMm = Math.round((peak.grossMm / 10) * 100) / 100;

    return NextResponse.json({
      crop: crop.name_en,
      cropId: crop.id,
      fieldAreaHa: area,
      efficiency: eff,
      systemType,
      netAnnualMm: crop.annual_irrigation_mm,
      grossAnnualMm: Math.round(grossAnnualMm),
      grossAnnualM3,
      peakDailyMm,
      monthly,
      decadal,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    description: 'Compute irrigation program for a crop',
    method: 'POST',
    endpoint: '/api/v1/irrigation',
    body: {
      cropId: 'string (e.g. "field_tomato")',
      fieldAreaHa: 'number (default: 1)',
      efficiency: 'number 0-100 (default: 85)',
      systemType: '"drip" | "sprinkler" | "furrow" (default: "drip")',
    },
    availableCrops: CROP_IRRIGATION_DATA.map(c => ({ id: c.id, name: c.name_en, category: c.category })),
  });
}
