import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import {
  clampConfidence,
  consumeAiRateLimit,
  getClientKey,
  publicAiError,
  validateImageDataUrl,
} from '@/lib/ai-governance';
import { matchDiseaseReferences, type ReferenceMatch, type VerificationPhotoTarget } from '@/lib/disease-reference-matcher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PROBLEM_TYPES = ['disease', 'pest', 'weed', 'nutrient_deficiency', 'abiotic_stress', 'unknown'] as const;
const SEVERITIES = ['low', 'medium', 'high'] as const;
type ProblemType = typeof PROBLEM_TYPES[number];
type Severity = typeof SEVERITIES[number];

interface SymptomResult {
  problem_type: ProblemType;
  problem_name: string;
  problem_name_ar: string;
  confidence: number;
  symptoms_observed: string[];
  possible_causes: string[];
  severity: Severity;
  recommendation: string;
  suggested_active_matters: string[];
  reviewRequired: boolean;
  referenceMatches: ReferenceMatch[];
  needsSecondPhoto: boolean;
  nextPhotoTarget?: VerificationPhotoTarget;
  modelProvider?: string;
}

const SYSTEM_PROMPT = `You are an expert plant pathologist and entomologist specializing in Algerian agriculture. You analyze photos of crop problems — diseased leaves, pest damage, weed infestations — and identify the likely problem.

Focus on crops common in Algeria and North Africa. Respond with a JSON object ONLY (no markdown, no explanation), in this exact schema:
{
  "problem_type": "disease" | "pest" | "weed" | "nutrient_deficiency" | "abiotic_stress" | "unknown",
  "problem_name": "short name in French",
  "problem_name_ar": "Arabic name if known",
  "confidence": 0.0-1.0,
  "symptoms_observed": ["visible symptoms in French"],
  "possible_causes": ["ranked likely causes"],
  "severity": "low" | "medium" | "high",
  "recommendation": "short actionable advice in French",
  "suggested_active_matters": ["active substance names in French"]
}

Never claim certainty from one image. If confidence is below 0.4, use problem_type="unknown" and explain the limitation. Never recommend off-label pesticide use; direct the grower to verify the local label and consult a local extension specialist.`;

function unknownResult(recommendation = 'Image non reconnue ou analyse insuffisante. Vérifiez la photo et consultez un agronome local.') : SymptomResult {
  return {
    problem_type: 'unknown', problem_name: '', problem_name_ar: '', confidence: 0,
    symptoms_observed: [], possible_causes: [], severity: 'low', recommendation,
    suggested_active_matters: [], reviewRequired: true, referenceMatches: [], needsSecondPhoto: true,
  };
}

function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, 10).map(item => item.trim().slice(0, 240));
}

function normalizeResult(input: unknown, crop?: string): SymptomResult {
  if (!input || typeof input !== 'object') return unknownResult();
  const raw = input as Record<string, unknown>;
  const rawProblemType = PROBLEM_TYPES.includes(raw.problem_type as ProblemType) ? raw.problem_type as ProblemType : 'unknown';
  const severity = SEVERITIES.includes(raw.severity as Severity) ? raw.severity as Severity : 'low';
  const confidence = clampConfidence(raw.confidence);
  const problemType = confidence < 0.4 ? 'unknown' : rawProblemType;
  const problemName = typeof raw.problem_name === 'string' ? raw.problem_name.trim().slice(0, 160) : '';
  const symptomsObserved = normalizeList(raw.symptoms_observed);
  const possibleCauses = normalizeList(raw.possible_causes);
  const referenceResult = matchDiseaseReferences({
    crop,
    problemType,
    problemName,
    symptomsObserved,
    possibleCauses,
  });
  const reviewRequired = confidence < 0.75 || problemType === 'unknown' || referenceResult.matches.length === 0;
  return {
    problem_type: problemType,
    problem_name: problemName,
    problem_name_ar: typeof raw.problem_name_ar === 'string' ? raw.problem_name_ar.trim().slice(0, 160) : '',
    confidence,
    symptoms_observed: symptomsObserved,
    possible_causes: possibleCauses,
    severity,
    recommendation: typeof raw.recommendation === 'string' ? raw.recommendation.trim().slice(0, 1_000) : 'Review this image with a qualified agronomist before acting.',
    suggested_active_matters: normalizeList(raw.suggested_active_matters),
    reviewRequired,
    referenceMatches: referenceResult.matches,
    needsSecondPhoto: reviewRequired || referenceResult.matches.length > 1,
    nextPhotoTarget: referenceResult.nextPhotoTarget,
    modelProvider: 'z-ai-web-dev-sdk',
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
    const crop = typeof body?.crop === 'string' ? body.crop.trim().slice(0, 80) : undefined;

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: `${crop ? `La culture sélectionnée est « ${crop} ». ` : ''}Identifiez ce problème phytosanitaire à partir de cette photo. Répondez en JSON et indiquez clairement l’incertitude. Ne forcez pas un nom de maladie si la photo est ambiguë.` },
            { type: 'image_url', image_url: { url: image.value } },
          ],
        } as any,
      ],
      thinking: { type: 'disabled' },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response || typeof response !== 'string') {
      return NextResponse.json({ error: 'The AI returned no usable identification. Please retry with a clearer image.' }, { status: 502 });
    }

    let parsed: unknown;
    try {
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(unknownResult('La réponse de l’IA n’était pas structurée. Réessayez avec une photo plus nette.'), { status: 200 });
    }

    return NextResponse.json(normalizeResult(parsed, crop));
  } catch (error) {
    console.error('Symptom identification error:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: publicAiError(error) }, { status: 503 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Symptom Photo Identification API',
    description: 'Upload a crop-problem photo for normalized AI identification with confidence and review-required metadata.',
    endpoint: 'POST /api/identify-symptom',
    body: { image: 'base64 image data URL (PNG, JPG, WEBP, or GIF; max 8 MB)', crop: 'optional selected crop label used for Gallery grounding' },
    response: 'SymptomResult { existing fields plus referenceMatches, needsSecondPhoto, nextPhotoTarget, modelProvider }',
  });
}
