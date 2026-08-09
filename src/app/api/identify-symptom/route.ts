import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are an expert plant pathologist and entomologist specializing in Algerian agriculture. You analyze photos of crop problems — diseased leaves, pest damage, weed infestations — and identify the likely problem.

Focus on crops common in Algeria and North Africa: wheat, barley, maize, potato, tomato, pepper, onion, citrus, olive, date palm, grapevine, peach, apple, fig, pomegranate, almond, sorghum, cotton, peanut, chickpea, carrot, leek, eggplant, cucumber, melon, lettuce, strawberry, alfalfa, asparagus.

Respond with a JSON object ONLY (no markdown, no explanation), in this exact schema:
{
  "problem_type": "disease" | "pest" | "weed" | "nutrient_deficiency" | "abiotic_stress" | "unknown",
  "problem_name": "short name of the identified problem in French (e.g. 'Oïdium', 'Puceron', 'Mildiou')",
  "problem_name_ar": "Arabic name if known (e.g. 'البياض الدقيقي')",
  "confidence": 0.0-1.0,
  "symptoms_observed": ["list of visible symptoms in French"],
  "possible_causes": ["ranked list of likely causes, most probable first"],
  "severity": "low" | "medium" | "high",
  "recommendation": "short actionable advice in French",
  "suggested_active_matters": ["list of active substance names in French that could treat this problem"]
}

If you cannot identify the problem with confidence, set confidence < 0.4 and explain in recommendation.
If the image is not a plant/crop problem, return {"problem_type":"unknown","confidence":0,"problem_name":"","problem_name_ar":"","symptoms_observed":[],"possible_causes":[],"severity":"low","recommendation":"Image non reconnue","suggested_active_matters":[]}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const imageDataUrl: string = body.image;

    if (!imageDataUrl || !imageDataUrl.startsWith('data:image')) {
      return NextResponse.json({ error: 'Valid base64 image required' }, { status: 400 });
    }

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Identifiez ce problème phytosanitaire à partir de cette photo. Répondez en JSON.' },
            { type: 'image_url', image_url: { url: imageDataUrl } },
          ],
        } as any,
      ],
      thinking: { type: 'disabled' },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      return NextResponse.json({ error: 'Empty response from model' }, { status: 502 });
    }

    // Try to parse JSON from response (model may wrap in ```json blocks)
    let parsed: any;
    try {
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // If JSON parse fails, return raw text
      return NextResponse.json({
        problem_type: 'unknown',
        confidence: 0,
        problem_name: 'Analyse échouée',
        problem_name_ar: '',
        symptoms_observed: [],
        possible_causes: [],
        severity: 'low',
        recommendation: response.slice(0, 500),
        suggested_active_matters: [],
      });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Symptom identification error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Symptom Photo Identification API',
    description: 'Upload a photo of a crop problem → get AI-powered identification with treatment suggestions.',
    endpoint: 'POST /api/identify-symptom',
    body: { image: 'data:image/...;base64,...' },
  });
}
