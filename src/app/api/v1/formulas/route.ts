import { NextRequest, NextResponse } from 'next/server';
import { allFormulas } from '@/lib/formulas-data';
import { calculators } from '@/components/agri/calculators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/formulas
 * Query params:
 *   - code: filter by formula code (e.g. ?code=2.1)
 *   - part: filter by part name (e.g. ?part=Crop Production Formulas)
 *   - calculator: "true" to filter only formulas with calculators
 *   - search: full-text search across name, formula, purpose
 *   - limit: max results (default 50, max 200)
 *   - offset: pagination offset
 *
 * Response: { results: Formula[], total: number, limit: number, offset: number }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const part = searchParams.get('part');
  const calculatorOnly = searchParams.get('calculator') === 'true';
  const search = searchParams.get('search')?.toLowerCase().trim();
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const offset = parseInt(searchParams.get('offset') || '0');

  let results = allFormulas;

  if (code) results = results.filter(f => f.code === code);
  if (part) results = results.filter(f => f.part.toLowerCase().includes(part.toLowerCase()));
  if (calculatorOnly) results = results.filter(f => f.code in calculators);
  if (search) {
    results = results.filter(f => {
      const hay = `${f.code} ${f.name} ${f.formula} ${f.purpose} ${f.variables} ${f.chapter} ${f.part}`.toLowerCase();
      return hay.includes(search);
    });
  }

  const total = results.length;
  const paginated = results.slice(offset, offset + limit);

  return NextResponse.json({
    results: paginated.map(f => ({
      code: f.code,
      name: f.name,
      formula: f.formula,
      variables: f.variables,
      purpose: f.purpose,
      example: f.example,
      pitfall: f.pitfall,
      decision: f.decision,
      notes: f.notes,
      part: f.part,
      chapter: f.chapter,
      chapter_number: f.chapter_number,
      hasCalculator: f.code in calculators,
    })),
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  });
}
