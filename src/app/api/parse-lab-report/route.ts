import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import {
  clampConfidence,
  consumeAiRateLimit,
  getClientKey,
  publicAiError,
  validateImageDataUrl,
} from '@/lib/ai-governance';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const REPORT_TYPES = ['soil', 'water', 'fertilizer_bag', 'lab_report', 'unknown'] as const;
const SUGGESTED_TOOLS = [
  'soil-water-texture', 'amendment-balance', 'water-hardness', 'hydro-solution',
  'granular-mix', 'fertilizer-composition', 'nutrient-units', 'unknown',
] as const;
type ReportType = typeof REPORT_TYPES[number];
type SuggestedTool = typeof SUGGESTED_TOOLS[number];

interface ParsedReport {
  type: ReportType;
  confidence: number;
  values: Record<string, number | string>;
  notes: string;
  suggestedTool: SuggestedTool;
  reviewRequired: boolean;
}

const SYSTEM_PROMPT = `You are an agricultural data extraction assistant. You analyze photos of:
1. Soil lab reports (laboratory analysis sheets with pH, OM, CEC, Ca, Mg, K, Na, P, etc.)
2. Water analysis reports (hardness, HCO₃⁻, CO₃²⁻, Ca, Mg, Na, Cl, SO₄, EC, pH)
3. Fertilizer bag labels (N-P-K grade, micronutrients, formula, weight)

Extract ALL numeric values you can read. Be precise about units. If a value is unreadable or uncertain, omit it (do NOT guess).

Respond with a JSON object ONLY (no markdown, no explanation), in this exact schema:
{
  "type": "soil" | "water" | "fertilizer_bag" | "lab_report" | "unknown",
  "confidence": 0.0-1.0,
  "values": {},
  "notes": "short description of what was detected + any caveats",
  "suggestedTool": "soil-water-texture" | "amendment-balance" | "water-hardness" | "hydro-solution" | "granular-mix" | "fertilizer-composition" | "nutrient-units" | "unknown"
}

Never invent unreadable values. If the image is not a report or fertilizer label, return type="unknown", confidence=0, empty values, notes="Image not recognized", suggestedTool="unknown".`;

function unknownReport(notes = 'The image could not be confidently interpreted.') : ParsedReport {
  return { type: 'unknown', confidence: 0, values: {}, notes, suggestedTool: 'unknown', reviewRequired: true };
}

function normalizeReport(input: unknown): ParsedReport {
  if (!input || typeof input !== 'object') return unknownReport();
  const raw = input as Record<string, unknown>;
  const type = REPORT_TYPES.includes(raw.type as ReportType) ? raw.type as ReportType : 'unknown';
  const suggestedTool = SUGGESTED_TOOLS.includes(raw.suggestedTool as SuggestedTool) ? raw.suggestedTool as SuggestedTool : 'unknown';
  const values: Record<string, number | string> = {};
  if (raw.values && typeof raw.values === 'object') {
    Object.entries(raw.values as Record<string, unknown>).slice(0, 50).forEach(([key, value]) => {
      if (!/^[a-z][a-z0-9_]{0,48}$/i.test(key)) return;
      if (typeof value === 'number' && Number.isFinite(value)) values[key] = value;
      else if (typeof value === 'string' && value.trim().length <= 120) values[key] = value.trim();
    });
  }
  const confidence = clampConfidence(raw.confidence);
  const notes = typeof raw.notes === 'string' ? raw.notes.trim().slice(0, 1_000) : '';
  return {
    type,
    confidence,
    values,
    notes: notes || (type === 'unknown' ? 'No report type was confidently identified.' : 'Review extracted values against the original report.'),
    suggestedTool,
    reviewRequired: confidence < 0.75 || Object.keys(values).length === 0,
  };
}

export async function POST(req: NextRequest) {
  const limit = consumeAiRateLimit(getClientKey(req));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many AI requests. Please wait before trying again.', retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  try {
    const body = await req.json();
    const image = validateImageDataUrl(body?.image);
    if (!image.ok) return NextResponse.json({ error: image.error }, { status: 400 });

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.createVision({
      model: 'glm-4.6v',
      messages: [
        { role: 'assistant', content: [{ type: 'text', text: SYSTEM_PROMPT }] },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract all readable values from this image and respond as JSON per the schema. Do not guess.' },
            { type: 'image_url', image_url: { url: image.value } },
          ],
        } as any,
      ],
      thinking: { type: 'disabled' },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response || typeof response !== 'string') {
      return NextResponse.json({ error: 'The AI returned no usable extraction. Please retry with a clearer image.' }, { status: 502 });
    }

    let parsed: unknown;
    try {
      const cleaned = response.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(unknownReport('The model response was not structured. Please retry with a clearer image.'), { status: 200 });
    }

    return NextResponse.json(normalizeReport(parsed));
  } catch (error) {
    console.error('Parse lab report error:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: publicAiError(error) }, { status: 503 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'NutriPlant PRO Lab Report Parser',
    description: 'Extracts numeric values from photos of soil/water lab reports and fertilizer labels with review-required confidence metadata.',
    endpoint: 'POST /api/parse-lab-report',
    body: { image: 'base64 data URL (PNG, JPG, WEBP, or GIF; max 8 MB)' },
    response: 'ParsedReport { type, confidence, values, notes, suggestedTool, reviewRequired }',
  });
}
