/**
 * Formula Atlas — AI Feedback & Reinforcement Memory Store (RLHF / In-Context Learning)
 * 
 * Captures agronomist overrides, dosage corrections, and diagnosis feedback.
 * Formats high-confidence corrections as dynamic few-shot learning exemplars to inject
 * into AI Specialist prompts.
 */

export interface AiFeedbackEntry {
  id: string;
  category: 'irrigation' | 'fertilization' | 'pest_disease' | 'soil' | 'general';
  cropId?: string;
  region?: string;
  userPromptSummary: string;
  aiResponseSnippet: string;
  rating: 'positive' | 'corrected' | 'negative';
  expertCorrectionText?: string;
  learnedRule: string; // Condensed guideline for AI context injection
  authorRole: 'lead_agronomist' | 'grower' | 'field_technician';
  confidenceWeight: number; // 1 to 5
  isActiveForPrompt: boolean;
  createdAt: string;
}

const STORAGE_KEY_AI_FEEDBACK = 'formula_atlas_ai_feedback_v1';

const INITIAL_AI_FEEDBACK: AiFeedbackEntry[] = [
  {
    id: 'fb-01',
    category: 'irrigation',
    cropId: 'tomato-gh',
    region: 'Biskra',
    userPromptSummary: 'Irrigation frequency during January overcast days in Biskra greenhouses',
    aiResponseSnippet: 'Recommended daily irrigation pulses of 4L/m2.',
    rating: 'corrected',
    expertCorrectionText: 'During persistent winter cloudy days with RH > 85%, transpiration drops by 60%. Cut irrigation to 1.5L/m2 and defer morning pulse until soil temperature exceeds 16°C to avoid Botrytis root asphyxiation.',
    learnedRule: 'For Biskra winter greenhouse tomatoes during overcast spells (RH > 80%), reduce irrigation volume to 1.5 L/m² and delay morning fertigation until greenhouse air warms.',
    authorRole: 'lead_agronomist',
    confidenceWeight: 5,
    isActiveForPrompt: true,
    createdAt: '2026-02-14T08:30:00Z',
  },
  {
    id: 'fb-02',
    category: 'fertilization',
    cropId: 'potato-pivot',
    region: 'El Oued',
    userPromptSummary: 'Potassium application timing on sandy soil pivots in El Oued',
    aiResponseSnippet: 'Apply 50% of K2O at planting and 50% at tuber initiation.',
    rating: 'corrected',
    expertCorrectionText: 'Sandy dunes in Souf have CEC < 5 meq/100g. Large basal K is instantly leached below root zone. Split K2O into weekly fertigation pulses from stolon hook to tuber bulking (SOP or Potassium Nitrate).',
    learnedRule: 'On El Oued sandy dune soils (CEC < 5), never apply large basal potassium; fractionate K2O fertigation into weekly doses across tuber bulking.',
    authorRole: 'lead_agronomist',
    confidenceWeight: 5,
    isActiveForPrompt: true,
    createdAt: '2026-03-01T11:20:00Z',
  },
  {
    id: 'fb-03',
    category: 'pest_disease',
    cropId: 'tomato-gh',
    region: 'Biskra',
    userPromptSummary: 'Tuta absoluta threshold and biological parasitoid release',
    aiResponseSnippet: 'Spray immediately upon seeing first leaf mine.',
    rating: 'corrected',
    expertCorrectionText: 'Always prioritize pheromone delta traps + Nesidiocoris tenuis beneficials establishment prior to chemical sprays. Use chlorantraniliprole or emamectin benzoate only when active mine count exceeds 3 mines/plant.',
    learnedRule: 'For Tuta absoluta in protected crops, prioritize Nesidiocoris tenuis bio-control and delta traps; spray chemical actives only when live leaf mines exceed 3/plant.',
    authorRole: 'lead_agronomist',
    confidenceWeight: 5,
    isActiveForPrompt: true,
    createdAt: '2026-04-10T14:45:00Z',
  },
  {
    id: 'fb-04',
    category: 'soil',
    cropId: 'wheat-durum',
    region: 'Sétif',
    userPromptSummary: 'Phosphorus fertilization on calcareous soils (pH > 8.0)',
    aiResponseSnippet: 'Broadcast Triple Superphosphate (TSP) on surface before harrowing.',
    rating: 'corrected',
    expertCorrectionText: 'In high-pH calcareous soils (CaCO3 > 15%), broadcast P is rapidly fixed as insoluble tricalcium phosphate. Band P fertilizer 5cm beside seed furrow with ammonium starter (DAP or MAP) to acidify rhizosphere microzone.',
    learnedRule: 'In high-pH (>8.0) calcareous soils of High Plains, band localized starter P (MAP/DAP) close to seed furrow rather than broad broadcasting to prevent calcium retrogradation.',
    authorRole: 'lead_agronomist',
    confidenceWeight: 5,
    isActiveForPrompt: true,
    createdAt: '2026-05-18T09:00:00Z',
  },
];

export function getAiFeedbackEntries(): AiFeedbackEntry[] {
  if (typeof window === 'undefined') return INITIAL_AI_FEEDBACK;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AI_FEEDBACK);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_AI_FEEDBACK, JSON.stringify(INITIAL_AI_FEEDBACK));
      return INITIAL_AI_FEEDBACK;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_AI_FEEDBACK;
  }
}

export function saveAiFeedbackEntry(entry: Omit<AiFeedbackEntry, 'id' | 'createdAt'>): AiFeedbackEntry {
  const current = getAiFeedbackEntries();
  const newEntry: AiFeedbackEntry = {
    ...entry,
    id: `fb-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [newEntry, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_AI_FEEDBACK, JSON.stringify(updated));
  }
  return newEntry;
}

export function toggleFeedbackRuleActive(id: string): void {
  const current = getAiFeedbackEntries();
  const updated = current.map(item => item.id === id ? { ...item, isActiveForPrompt: !item.isActiveForPrompt } : item);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_AI_FEEDBACK, JSON.stringify(updated));
  }
}

export function deleteAiFeedbackEntry(id: string): void {
  const current = getAiFeedbackEntries();
  const updated = current.filter(item => item.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_AI_FEEDBACK, JSON.stringify(updated));
  }
}

/**
 * Returns dynamic Few-Shot In-Context Training Rules for injection into AI system prompts.
 */
export function getActiveLearnedRulesForPrompt(category?: string, cropId?: string): string[] {
  const entries = getAiFeedbackEntries();
  return entries
    .filter(e => e.isActiveForPrompt && (e.confidenceWeight >= 3))
    .filter(e => !category || e.category === category || e.category === 'general')
    .filter(e => !cropId || !e.cropId || e.cropId === cropId)
    .map(e => `[Empirical Rule from Field Expert (${e.region || 'Regional'})]: ${e.learnedRule}`);
}
