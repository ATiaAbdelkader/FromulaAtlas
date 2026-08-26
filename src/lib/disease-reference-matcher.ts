import { DISEASE_REFS, type DiseaseRef } from '@/lib/disease-ref-data';

export type DetectionProblemType = 'disease' | 'pest' | 'weed' | 'nutrient_deficiency' | 'abiotic_stress' | 'unknown';
export type VerificationPhotoTarget = 'leaf_top' | 'leaf_underside' | 'stem' | 'fruit' | 'whole_plant' | 'field_pattern';

export interface ReferenceMatch {
  diseaseRefId: string;
  rank: number;
  matchReason: string;
  discriminators: string[];
  verificationQuestions: string[];
  source: {
    dataset: string;
    url: string;
    imageCount: number;
  };
}

export interface ReferenceMatchInput {
  crop?: string;
  problemType: DetectionProblemType;
  problemName?: string;
  symptomsObserved?: string[];
  possibleCauses?: string[];
}

export interface ReferenceMatchResult {
  matches: ReferenceMatch[];
  nextPhotoTarget?: VerificationPhotoTarget;
}

const STOP_WORDS = new Set([
  'and', 'the', 'with', 'from', 'leaf', 'leaves', 'plant', 'crop', 'symptom', 'symptoms',
  'maladie', 'les', 'des', 'une', 'avec', 'feuille', 'feuilles', 'plante', 'culture',
  'مرض', 'أعراض', 'ورقة', 'أوراق', 'نبات', 'محصول',
]);

const CROP_ALIASES: Record<string, string> = {
  tomato: 'tomato', tomate: 'tomato', طماطم: 'tomato',
  potato: 'potato', pomme_de_terre: 'potato', بطاطا: 'potato', بطاطس: 'potato',
  pepper: 'pepper', poivron: 'pepper', فلفل: 'pepper',
  corn: 'corn', maize: 'corn', mais: 'corn', maïs: 'corn', ذرة: 'corn',
  wheat: 'wheat', ble: 'wheat', blé: 'wheat', قمح: 'wheat',
  apple: 'apple', pomme: 'apple', تفاح: 'apple',
  grape: 'grape', raisin: 'grape', vigne: 'grape', عنب: 'grape',
  rice: 'rice', riz: 'rice', أرز: 'rice',
  citrus: 'citrus', agrume: 'citrus', agrumes: 'citrus', حمضيات: 'citrus', برتقال: 'citrus',
  strawberry: 'strawberry', fraise: 'strawberry', فراولة: 'strawberry',
};

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value: unknown): string[] {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function canonicalCrop(value: unknown): string | undefined {
  const normalized = normalizeText(value).replace(/ /g, '_');
  if (!normalized) return undefined;
  return CROP_ALIASES[normalized] ?? normalized;
}

function cropMatches(inputCrop: string | undefined, reference: DiseaseRef): boolean {
  const crop = canonicalCrop(inputCrop);
  if (!crop) return false;
  if (reference.type === 'weed' || reference.crop === 'General') return crop === 'general' || crop === 'unknown';
  return canonicalCrop(reference.crop) === crop;
}

function typeMatches(problemType: DetectionProblemType, reference: DiseaseRef): boolean {
  if (problemType === 'unknown' || problemType === 'abiotic_stress') return false;
  if (problemType === 'nutrient_deficiency') return reference.type === 'nutrient';
  return problemType === reference.type || (problemType === 'disease' && ['fungal', 'bacterial', 'viral'].includes(reference.type));
}

function overlapScore(candidateTokens: string[], referenceTokens: string[]): number {
  const referenceSet = new Set(referenceTokens);
  return candidateTokens.filter((token) => referenceSet.has(token)).length;
}

function buildEvidenceText(input: ReferenceMatchInput): string {
  return [input.problemName, ...(input.symptomsObserved ?? []), ...(input.possibleCauses ?? [])].filter(Boolean).join(' ');
}

function discriminators(reference: DiseaseRef): string[] {
  const values = [reference.visualDescription, reference.symptoms]
    .flatMap((value) => value.split(/[,;]+/).map((part) => part.trim()))
    .filter(Boolean)
    .slice(0, 3);
  return values.length > 0 ? values : [reference.symptoms];
}

function verificationQuestions(reference: DiseaseRef): string[] {
  const visual = normalizeText(reference.visualDescription);
  const questions: string[] = [];
  if (visual.includes('underside') || visual.includes('under')) {
    questions.push('Can you photograph the underside of the affected leaf?');
  }
  if (visual.includes('fruit') || normalizeText(reference.symptoms).includes('fruit')) {
    questions.push('Can you photograph one affected fruit and one healthy fruit?');
  }
  if (reference.type === 'weed') {
    questions.push('Can you capture the whole plant, including the stem, flowers, or seed pods?');
  } else {
    questions.push('Are the symptoms present on one plant or spreading across a field pattern?');
  }
  if (reference.severity === 'high') {
    questions.push('Please add a wider field photo to check how quickly the problem is spreading.');
  }
  return questions.slice(0, 3);
}

function nextPhotoTarget(reference: DiseaseRef): VerificationPhotoTarget {
  const visual = normalizeText(reference.visualDescription);
  const symptoms = normalizeText(reference.symptoms);
  if (visual.includes('underside') || visual.includes('under')) return 'leaf_underside';
  if (visual.includes('fruit') || symptoms.includes('fruit')) return 'fruit';
  if (reference.type === 'weed') return 'whole_plant';
  if (reference.severity === 'high') return 'field_pattern';
  return 'leaf_top';
}

function reasonForMatch(cropMatch: boolean, typeMatch: boolean, nameScore: number, evidenceScore: number): string {
  const reasons: string[] = [];
  if (cropMatch) reasons.push('crop match');
  if (typeMatch) reasons.push('problem type match');
  if (nameScore > 0) reasons.push('name match');
  if (evidenceScore > 0) reasons.push('visual or symptom overlap');
  return reasons.length > 0 ? reasons.join(' + ') : 'weak catalog similarity; verify before action';
}

export function matchDiseaseReferences(input: ReferenceMatchInput): ReferenceMatchResult {
  const candidateText = buildEvidenceText(input);
  const candidateTokens = tokens(candidateText);
  if (input.problemType === 'unknown' || candidateTokens.length === 0) return { matches: [] };

  const scored = DISEASE_REFS.map((reference) => {
    const cropMatch = reference.type === 'weed' && input.problemType === 'weed' ? true : cropMatches(input.crop, reference);
    const typeMatch = typeMatches(input.problemType, reference);
    const nameScore = overlapScore(tokens(input.problemName), tokens(`${reference.disease} ${reference.diseaseAr ?? ''}`));
    const evidenceScore = overlapScore(candidateTokens, tokens(`${reference.symptoms} ${reference.visualDescription}`));
    const exactName = normalizeText(input.problemName) && normalizeText(`${reference.disease} ${reference.diseaseAr ?? ''}`).includes(normalizeText(input.problemName));
    const cropEligible = !canonicalCrop(input.crop) || cropMatch;
    const evidenceEligible = Boolean(exactName || nameScore > 0 || evidenceScore > 0);
    const score = cropEligible && evidenceEligible ? (cropMatch ? 5 : 0) + (typeMatch ? 3 : 0) + (exactName ? 5 : nameScore * 2) + Math.min(evidenceScore, 4) : -1;
    return { reference, score, cropMatch, typeMatch, nameScore, evidenceScore };
  })
    .filter((entry) => entry.score >= 5)
    .sort((a, b) => b.score - a.score || a.reference.id.localeCompare(b.reference.id))
    .slice(0, 3);

  const matches = scored.map(({ reference, cropMatch, typeMatch, nameScore, evidenceScore }, index) => ({
    diseaseRefId: reference.id,
    rank: index + 1,
    matchReason: reasonForMatch(cropMatch, typeMatch, nameScore, evidenceScore),
    discriminators: discriminators(reference),
    verificationQuestions: verificationQuestions(reference),
    source: { dataset: reference.sourceDataset, url: reference.sourceUrl, imageCount: reference.imageCount },
  }));

  const top = scored[0]?.reference;
  return { matches, nextPhotoTarget: top ? nextPhotoTarget(top) : undefined };
}

export function getDiseaseReference(id: string): DiseaseRef | undefined {
  return DISEASE_REFS.find((reference) => reference.id === id);
}
