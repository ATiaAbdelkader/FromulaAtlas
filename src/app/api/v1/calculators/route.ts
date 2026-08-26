import { NextRequest, NextResponse } from 'next/server';
import { calculators, type CalcConfig } from '@/components/agri/calculators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/calculators
 *   - code: get a specific calculator's fields and metadata
 *   Response: { results: [{ code, fields, hasCompute }] }
 *
 * POST /api/v1/calculators
 *   Body: { code: string, values: Record<string, number> }
 *   Response: { result: { value, label, interpretation } }
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (code) {
    const config = calculators[code];
    if (!config) return NextResponse.json({ error: 'Calculator not found' }, { status: 404 });
    return NextResponse.json({
      code,
      fields: config.fields.map(f => ({
        key: f.key, label: f.label, unit: f.unit,
        defaultValue: f.defaultValue, step: f.step, min: f.min, max: f.max,
      })),
    });
  }

  // List all calculators
  const codes = Object.keys(calculators);
  return NextResponse.json({
    total: codes.length,
    results: codes.map(c => ({
      code: c,
      fieldCount: calculators[c].fields.length,
      fields: calculators[c].fields.map(f => ({ key: f.key, label: f.label, unit: f.unit })),
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, values } = body as { code: string; values: Record<string, number> };

    if (!code) return NextResponse.json({ error: 'code is required' }, { status: 400 });
    const config: CalcConfig | undefined = calculators[code];
    if (!config) return NextResponse.json({ error: `Calculator '${code}' not found` }, { status: 404 });
    if (!values) return NextResponse.json({ error: 'values object is required' }, { status: 400 });

    // Fill missing fields with defaults
    const fullValues: Record<string, number> = {};
    for (const field of config.fields) {
      fullValues[field.key] = values[field.key] !== undefined ? Number(values[field.key]) : field.defaultValue;
    }

    const result = config.compute(fullValues);
    return NextResponse.json({ code, input: fullValues, result });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Compute failed' }, { status: 500 });
  }
}
