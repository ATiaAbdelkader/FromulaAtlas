import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs/promises';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface ParsedReport {
  type: 'soil' | 'water' | 'fertilizer_bag' | 'lab_report' | 'unknown';
  confidence: number;
  values: Record<string, number | string>;
  notes: string;
  suggestedTool: string;
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
  "values": {
    // For soil: ph, om_percent, cec_meq_100g, ca_meq_100g, mg_meq_100g, k_meq_100g, na_meq_100g, h_meq_100g, al_meq_100g, p_ppm, k_ppm, sand_percent, silt_percent, clay_percent, bulk_density
    // For water: ph, ec_ds_m, hardness_ppm, ca_ppm, mg_ppm, na_ppm, k_ppm, hco3_meq_l, co3_meq_l, cl_meq_l, so4_meq_l, no3_ppm, nh4_ppm
    // For fertilizer: npk_grade (string like "19-19-19"), formula (string like "KNO3"), n_percent, p2o5_percent, k2o_percent, ca_percent, mg_percent, s_percent, weight_kg
  },
  "notes": "short description of what was detected + any caveats",
  "suggestedTool": "soil-water-texture" | "amendment-balance" | "water-hardness" | "hydro-solution" | "granular-mix" | "fertilizer-composition" | "nutrient-units" | "unknown"
}

Map the suggested tool:
- soil report with CEC + cations → "amendment-balance"
- soil report with texture (sand/silt/clay) → "soil-water-texture"
- water report with HCO₃⁻/hardness → "water-hardness"
- water report with ions (Ca, Mg, Na, Cl, SO₄) → "hydro-solution"
- fertilizer bag with NPK grade → "granular-mix"
- fertilizer bag with chemical formula → "fertilizer-composition"
- any report with mixed units → "nutrient-units"

If the image is not a lab report / water analysis / fertilizer label, respond with type="unknown", confidence=0, empty values, notes="Image not recognized", suggestedTool="unknown".`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body as { image?: string };

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'image (base64 data URL) required' }, { status: 400 });
    }

    // Validate it's a data URL
    if (!image.startsWith('data:image/')) {
      return NextResponse.json({ error: 'image must be a base64 data URL (data:image/...;base64,...)' }, { status: 400 });
    }

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.createVision({
      model: 'glm-4.6v',
      messages: [
        {
          role: 'assistant',
          content: [{ type: 'text', text: SYSTEM_PROMPT }],
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract all numeric values from this image and respond as JSON per the schema.' },
            { type: 'image_url', image_url: { url: image } },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      return NextResponse.json({ error: 'Empty response from vision model' }, { status: 502 });
    }

    // Parse JSON — be lenient about markdown fences
    let cleaned = response.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }
    let parsed: ParsedReport;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({
        error: 'Failed to parse model response as JSON',
        raw: response,
      }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Parse lab report error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'NutriPlant PRO Lab Report Parser',
    description: 'Extracts numeric values from photos of soil/water lab reports and fertilizer labels.',
    endpoint: 'POST /api/parse-lab-report',
    body: { image: 'base64 data URL (data:image/...;base64,...)' },
    response: 'ParsedReport { type, confidence, values, notes, suggestedTool }',
  });
}

// Suppress unused import warning
void fs;
