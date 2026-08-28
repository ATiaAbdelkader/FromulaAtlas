export type SoilEvidenceProperty =
  | 'pH'
  | 'EC'
  | 'ECe'
  | 'texture'
  | 'CEC'
  | 'SOC'
  | 'organic-matter'
  | 'total-N'
  | 'available-P'
  | 'available-K'
  | 'SAR'
  | 'bicarbonate';

export type SoilEvidenceSource = 'lab' | 'field-test' | 'observation' | 'estimate' | 'model';
export type EvidenceConfidence = 'high' | 'medium' | 'low';
export type EvidenceFreshness = 'fresh' | 'aging' | 'stale' | 'undated';
export type SamplingObjective = 'baseline' | 'covariate-coverage' | 'model-improvement' | 'certification' | 'management-comparison';
export type SamplingPattern = 'stratified-random' | 'grid' | 'transect' | 'paired-zones' | 'composite-zones';
export type SamplingMissionStatus = 'planned' | 'in-field' | 'completed' | 'needs-review';
export type SamplingSampleStatus = 'planned' | 'collected' | 'skipped';

export interface SamplingDepthRule {
  label: string;
  topCm: number;
  bottomCm: number;
  purpose: string;
}

export interface SamplingSampleLabel {
  id: string;
  sequence: number;
  code: string;
  stratum: string;
  depthCm: number;
  status: SamplingSampleStatus;
  locationNote: string;
  collectedAt?: string;
  collector?: string;
}

export interface SamplingChainOfCustody {
  sampleSetId: string;
  collector: string;
  handoffTo: string;
  laboratory: string;
  handoffDate: string;
  storage: string;
  notes: string;
}

export interface SoilEvidenceCard {
  id: string;
  property: SoilEvidenceProperty;
  value: number;
  unit: string;
  sampleDate: string;
  depthCm: number;
  source: SoilEvidenceSource;
  location: string;
  cropId: string;
  irrigationSource: string;
  notes: string;
  createdAt: string;
}

export type OfflineCaptureSyncStatus = 'pending' | 'synced' | 'conflict';
export type OfflineCaptureFieldValue = number | { value: number; unit: string };

export interface OfflineCaptureCoordinates {
  latitude: number;
  longitude: number;
}

export interface OfflineCaptureRecord {
  id?: string;
  sampleLabelId: string;
  missionId: string;
  coordinates: OfflineCaptureCoordinates;
  observationNotes: string;
  photoRefs: string[];
  labResultFields: Partial<Record<SoilEvidenceProperty, OfflineCaptureFieldValue>>;
  /** Optional numeric field-test result used when no laboratory result is available. */
  fieldTestResult?: { property: SoilEvidenceProperty; value: number; unit: string };
  /** Denormalized mission context keeps reconciliation usable after a device-only capture is reloaded. */
  sampleCode?: string;
  depthCm?: number;
  cropId?: string;
  irrigationSource?: string;
  capturedAt: string;
  capturedBy: string;
  syncStatus: OfflineCaptureSyncStatus;
  importedEvidenceId?: string;
}

export interface CaptureReconciliation {
  toImport: SoilEvidenceCard[];
  duplicates: string[];
  conflicts: string[];
}

export interface SoilEvidenceAssessment {
  confidence: EvidenceConfidence;
  freshness: EvidenceFreshness;
  ageDays: number | null;
  decisionReady: boolean;
  posture: 'mappable-screening' | 'measured-management-caution' | 'insufficient-evidence';
  nextAction: 'use-within-scope' | 'retest-root-zone' | 'collect-lab-sample' | 'document-reference';
}

export interface SoilEvidenceSummary {
  total: number;
  labCount: number;
  freshCount: number;
  staleCount: number;
  lowConfidenceCount: number;
  decisionReadyCount: number;
  propertiesCovered: SoilEvidenceProperty[];
}

export interface SamplingMissionInput {
  objective: SamplingObjective;
  targetProperty: SoilEvidenceProperty;
  studyAreaHa: number;
  targetSamples: number;
  strata: string[];
  cropId: string;
  irrigationSource: string;
  salinityConcern: boolean;
  notes: string;
  scorecardGaps?: SoilQualityIndicatorKey[];
  samplingPattern?: SamplingPattern;
  primaryDepthCm?: number;
  includeSubsoilDepth?: boolean;
  chainOfCustody?: Partial<SamplingChainOfCustody>;
}

export interface SamplingMission {
  id: string;
  objective: SamplingObjective;
  targetProperty: SoilEvidenceProperty;
  studyAreaHa: number;
  targetSamples: number;
  strata: string[];
  cropId: string;
  irrigationSource: string;
  salinityConcern: boolean;
  notes: string;
  samplingPattern: SamplingPattern;
  depthRules: SamplingDepthRule[];
  sampleLabels: SamplingSampleLabel[];
  chainOfCustody: SamplingChainOfCustody;
  scorecardGaps: SoilQualityIndicatorKey[];
  status: SamplingMissionStatus;
  offlineCompletedCount: number;
  lastSyncedAt?: string;
  tasks: string[];
  qualityGates: string[];
  createdAt: string;
}

const MAPPABLE_PROPERTIES = new Set<SoilEvidenceProperty>(['pH', 'EC', 'ECe', 'texture', 'CEC', 'SOC', 'organic-matter']);
const MANAGEMENT_SENSITIVE_PROPERTIES = new Set<SoilEvidenceProperty>(['total-N', 'available-P', 'available-K']);

function finite(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function daysBetween(from: string, now: Date): number | null {
  if (!from) return null;
  const date = new Date(`${from}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86_400_000));
}

export function createEvidenceCard(input: Omit<SoilEvidenceCard, 'id' | 'createdAt'>, now = new Date().toISOString()): SoilEvidenceCard {
  return { ...input, id: `evidence-${now.replace(/[^0-9]/g, '').slice(-14)}`, createdAt: now };
}

function captureId(capture: OfflineCaptureRecord): string {
  return capture.id ?? `${capture.missionId}:${capture.sampleLabelId}:${capture.capturedAt}`;
}

function captureResultValue(result: OfflineCaptureFieldValue | undefined, property: SoilEvidenceProperty): { value: number; unit: string } | undefined {
  if (typeof result === 'number') return Number.isFinite(result) ? { value: result, unit: property } : undefined;
  if (!result || !Number.isFinite(result.value)) return undefined;
  return { value: result.value, unit: result.unit?.trim() || property };
}

function coordinateLocation(coordinates: OfflineCaptureCoordinates): string {
  return `GPS ${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
}

function normalizedLocation(location: string): string {
  return location.trim().toLowerCase().replace(/\s+/g, ' ');
}

function captureLocationMatches(a: string, b: string): boolean {
  const normalizedA = normalizedLocation(a);
  const normalizedB = normalizedLocation(b);
  if (normalizedA === normalizedB) return true;
  const coordinates = (location: string): OfflineCaptureCoordinates | undefined => {
    const match = location.match(/gps\s*(-?\d+(?:\.\d+)?)[,;\s]+(-?\d+(?:\.\d+)?)/i);
    return match ? { latitude: Number(match[1]), longitude: Number(match[2]) } : undefined;
  };
  const first = coordinates(a);
  const second = coordinates(b);
  return Boolean(first && second && Math.abs(first.latitude - second.latitude) <= 0.0005 && Math.abs(first.longitude - second.longitude) <= 0.0005);
}

export function buildEvidenceFromCapture(capture: OfflineCaptureRecord, mission: SamplingMission, now = new Date().toISOString()): SoilEvidenceCard {
  const sample = mission.sampleLabels.find(item => item.id === capture.sampleLabelId);
  const labEntries = Object.entries(capture.labResultFields ?? {}) as Array<[SoilEvidenceProperty, OfflineCaptureFieldValue]>;
  const labResult = labEntries.map(([property, result]) => ({ property, result: captureResultValue(result, property) })).find(item => item.result);
  const fieldResult = capture.fieldTestResult && Number.isFinite(capture.fieldTestResult.value) ? capture.fieldTestResult : undefined;
  const property = labResult?.property ?? fieldResult?.property ?? mission.targetProperty;
  const result = labResult?.result ?? (fieldResult ? { value: fieldResult.value, unit: fieldResult.unit.trim() || property } : { value: 0, unit: property });
  const source: SoilEvidenceSource = labResult ? 'lab' : 'field-test';
  const coordinateText = coordinateLocation(capture.coordinates);
  const provenance = [
    `Offline capture ${captureId(capture)}`,
    `Mission ${mission.id}`,
    sample ? `Sample ${sample.code}` : `Sample ${capture.sampleLabelId}`,
    `Captured by ${capture.capturedBy}`,
    `Captured at ${capture.capturedAt}`,
    coordinateText,
    capture.photoRefs.length > 0 ? `Photo references: ${capture.photoRefs.join(', ')}` : '',
  ].filter(Boolean).join(' · ');
  const card = createEvidenceCard({
    property,
    value: result.value,
    unit: result.unit,
    sampleDate: capture.capturedAt.slice(0, 10),
    depthCm: sample?.depthCm ?? capture.depthCm ?? 0,
    source,
    location: coordinateText,
    cropId: mission.cropId === 'unknown' ? (capture.cropId ?? mission.cropId) : mission.cropId,
    irrigationSource: mission.irrigationSource === 'unknown' ? (capture.irrigationSource ?? mission.irrigationSource) : mission.irrigationSource,
    notes: [capture.observationNotes.trim(), provenance].filter(Boolean).join(' | '),
  }, now);
  return { ...card, id: `evidence-offline-${captureId(capture).replace(/[^a-zA-Z0-9]+/g, '-').slice(0, 80)}` };
}

export function reconcileCaptures(captures: OfflineCaptureRecord[], existingCards: SoilEvidenceCard[], missions: SamplingMission[] = []): CaptureReconciliation {
  const toImport: SoilEvidenceCard[] = [];
  const duplicates: string[] = [];
  const conflicts: string[] = [];
  const accepted = [...existingCards];

  for (const capture of captures) {
    const id = captureId(capture);
    if (capture.syncStatus === 'synced' && capture.importedEvidenceId) {
      duplicates.push(id);
      continue;
    }
    const mission = missions.find(item => item.id === capture.missionId) ?? {
      id: capture.missionId,
      objective: 'baseline',
      targetProperty: 'pH',
      studyAreaHa: 0,
      targetSamples: 0,
      strata: [],
      cropId: 'unknown',
      irrigationSource: 'unknown',
      salinityConcern: false,
      notes: '',
      samplingPattern: 'stratified-random',
      depthRules: [],
      sampleLabels: [{ id: capture.sampleLabelId, sequence: 1, code: capture.sampleLabelId, stratum: '', depthCm: 0, status: 'collected', locationNote: '', collectedAt: capture.capturedAt, collector: capture.capturedBy }],
      chainOfCustody: { sampleSetId: '', collector: capture.capturedBy, handoffTo: '', laboratory: '', handoffDate: '', storage: '', notes: '' },
      scorecardGaps: [],
      status: 'in-field',
      offlineCompletedCount: 1,
      tasks: [],
      qualityGates: [],
      createdAt: capture.capturedAt,
    };
    const candidate = buildEvidenceFromCapture(capture, mission, capture.capturedAt);
    const matching = accepted.find(card => card.property === candidate.property && card.sampleDate === candidate.sampleDate && card.depthCm === candidate.depthCm && captureLocationMatches(card.location, candidate.location));
    if (matching) {
      if (matching.value === candidate.value && matching.unit === candidate.unit) duplicates.push(id);
      else conflicts.push(id);
      continue;
    }
    toImport.push(candidate);
    accepted.push(candidate);
  }
  return { toImport, duplicates, conflicts };
}

export function assessSoilEvidence(card: Pick<SoilEvidenceCard, 'property' | 'source' | 'sampleDate' | 'depthCm'>, now = new Date()): SoilEvidenceAssessment {
  const ageDays = daysBetween(card.sampleDate, now);
  const freshness: EvidenceFreshness = ageDays == null ? 'undated' : ageDays <= 180 ? 'fresh' : ageDays <= 365 ? 'aging' : 'stale';
  let confidence: EvidenceConfidence = card.source === 'lab' ? 'high' : card.source === 'field-test' ? 'medium' : 'low';
  if (freshness === 'stale' || freshness === 'undated') confidence = confidence === 'high' ? 'medium' : 'low';
  const decisionReady = confidence === 'high' && freshness !== 'stale' && freshness !== 'undated' && card.depthCm > 0;
  const posture = MAPPABLE_PROPERTIES.has(card.property)
    ? 'mappable-screening'
    : MANAGEMENT_SENSITIVE_PROPERTIES.has(card.property)
      ? 'measured-management-caution'
      : 'insufficient-evidence';
  const nextAction = card.source === 'lab' && freshness !== 'stale' && card.depthCm > 0
    ? freshness === 'aging' ? 'retest-root-zone' : 'use-within-scope'
    : card.source === 'lab' ? 'retest-root-zone' : card.source === 'observation' ? 'collect-lab-sample' : 'document-reference';
  return { confidence, freshness, ageDays, decisionReady, posture, nextAction };
}

export function summarizeSoilEvidence(cards: SoilEvidenceCard[], now = new Date()): SoilEvidenceSummary {
  const assessments = cards.map(card => assessSoilEvidence(card, now));
  return {
    total: cards.length,
    labCount: cards.filter(card => card.source === 'lab').length,
    freshCount: assessments.filter(item => item.freshness === 'fresh').length,
    staleCount: assessments.filter(item => item.freshness === 'stale' || item.freshness === 'undated').length,
    lowConfidenceCount: assessments.filter(item => item.confidence === 'low').length,
    decisionReadyCount: assessments.filter(item => item.decisionReady).length,
    propertiesCovered: [...new Set(cards.map(card => card.property))],
  };
}

export type SoilQualitySignalStatus = 'favorable' | 'watch' | 'limiting' | 'missing';
export type SoilQualityIndicatorKey = 'pH' | 'salinity' | 'CEC' | 'SOC' | 'organic-matter' | 'total-N' | 'available-P' | 'available-K' | 'SAR' | 'texture' | 'drainage' | 'compaction';
export type SoilQualityPosture = 'screening-only' | 'limiting-factor' | 'evidence-gap' | 'management-caution' | 'insufficient-evidence';

export interface SoilQualitySignal {
  key: SoilQualityIndicatorKey;
  property?: SoilEvidenceProperty;
  value: number | null;
  unit: string;
  status: SoilQualitySignalStatus;
  score: number | null;
  confidence: EvidenceConfidence | 'none';
  freshness?: EvidenceFreshness;
  source?: SoilEvidenceSource;
  evidenceId?: string;
  detail: string;
  action: string;
}

export interface SoilQualityScorecard {
  score: number | null;
  coverage: number;
  scoredCount: number;
  totalIndicators: number;
  limitingCount: number;
  missingIndicators: SoilQualityIndicatorKey[];
  confidence: EvidenceConfidence;
  posture: SoilQualityPosture;
  signals: SoilQualitySignal[];
  recommendations: string[];
  referenceNote: string;
}

const SOIL_QUALITY_INDICATORS: SoilQualityIndicatorKey[] = ['pH', 'salinity', 'CEC', 'SOC', 'organic-matter', 'total-N', 'available-P', 'available-K', 'SAR', 'texture', 'drainage', 'compaction'];

function sourceRank(source: SoilEvidenceSource): number {
  return source === 'lab' ? 5 : source === 'field-test' ? 4 : source === 'observation' ? 3 : source === 'estimate' ? 2 : 1;
}

function selectEvidence(cards: SoilEvidenceCard[], properties: SoilEvidenceProperty[], now: Date): SoilEvidenceCard | undefined {
  return cards
    .filter(card => properties.includes(card.property))
    .sort((a, b) => {
      const aAssessment = assessSoilEvidence(a, now);
      const bAssessment = assessSoilEvidence(b, now);
      const confidenceDelta = sourceRank(b.source) - sourceRank(a.source);
      if (confidenceDelta !== 0) return confidenceDelta;
      return (aAssessment.ageDays ?? Number.MAX_SAFE_INTEGER) - (bAssessment.ageDays ?? Number.MAX_SAFE_INTEGER);
    })[0];
}

function classifyRange(value: number, favorableMin: number, favorableMax: number, watchMin: number, watchMax: number): SoilQualitySignalStatus {
  if (value >= favorableMin && value <= favorableMax) return 'favorable';
  if (value >= watchMin && value <= watchMax) return 'watch';
  return 'limiting';
}

function signalScore(status: SoilQualitySignalStatus): number | null {
  return status === 'favorable' ? 100 : status === 'watch' ? 60 : status === 'limiting' ? 20 : null;
}

function measuredSignal(
  key: SoilQualityIndicatorKey,
  card: SoilEvidenceCard | undefined,
  now: Date,
  evaluator: (value: number) => SoilQualitySignalStatus,
  detail: string,
  action: string,
): SoilQualitySignal {
  if (!card) return { key, value: null, unit: '', status: 'missing', score: null, confidence: 'none', detail: `No measured ${key} evidence is saved.`, action };
  const assessment = assessSoilEvidence(card, now);
  const status = evaluator(card.value);
  const caution = assessment.confidence === 'low' || assessment.freshness === 'stale' || assessment.freshness === 'undated';
  return {
    key,
    property: card.property,
    value: card.value,
    unit: card.unit,
    status: caution && status === 'favorable' ? 'watch' : status,
    score: signalScore(caution && status === 'favorable' ? 'watch' : status),
    confidence: assessment.confidence,
    freshness: assessment.freshness,
    source: card.source,
    evidenceId: card.id,
    detail: caution ? `${detail} Verify freshness and scope before a high-impact decision.` : detail,
    action,
  };
}

export function buildSoilQualityScorecard(cards: SoilEvidenceCard[], now = new Date()): SoilQualityScorecard {
  const ph = selectEvidence(cards, ['pH'], now);
  const salinity = selectEvidence(cards, ['ECe', 'EC'], now);
  const cec = selectEvidence(cards, ['CEC'], now);
  const soc = selectEvidence(cards, ['SOC'], now);
  const organicMatter = selectEvidence(cards, ['organic-matter'], now);
  const totalN = selectEvidence(cards, ['total-N'], now);
  const availableP = selectEvidence(cards, ['available-P'], now);
  const availableK = selectEvidence(cards, ['available-K'], now);
  const sar = selectEvidence(cards, ['SAR'], now);
  const signals: SoilQualitySignal[] = [
    measuredSignal('pH', ph, now, value => classifyRange(value, 6, 7.8, 5.5, 8.5), 'Screening band: near-neutral pH is treated as favorable for many crops.', 'Confirm crop-specific pH targets before amendment.'),
    measuredSignal('salinity', salinity, now, value => value <= 2 ? 'favorable' : value <= 4 ? 'watch' : 'limiting', 'Screening band uses ECe/EC in dS/m or an equivalent mS/cm value.', 'Review leaching, drainage, irrigation water, and salt-tolerant crop options.'),
    measuredSignal('CEC', cec, now, value => value >= 15 ? 'favorable' : value >= 5 ? 'watch' : 'limiting', 'Screening band uses CEC in cmol(+)/kg and is texture-dependent.', 'Confirm texture and organic matter before changing nutrient strategy.'),
    measuredSignal('SOC', soc, now, value => value >= 1.5 ? 'favorable' : value >= 0.8 ? 'watch' : 'limiting', 'Screening band uses SOC percentage; local reference soils should refine it.', 'Review residue, cover-crop, organic-input, and erosion actions.'),
    measuredSignal('organic-matter', organicMatter, now, value => value >= 2.5 ? 'favorable' : value >= 1.5 ? 'watch' : 'limiting', 'Screening band uses organic-matter percentage and should be interpreted with texture.', 'Review organic inputs and retest with a consistent laboratory method.'),
    measuredSignal('total-N', totalN, now, value => value >= 0.15 ? 'watch' : 'limiting', 'Management-sensitive nutrient: this is a caution screen, not a fertilizer recommendation.', 'Use a crop-specific laboratory interpretation before applying nitrogen.'),
    measuredSignal('available-P', availableP, now, value => value >= 20 ? 'favorable' : value >= 10 ? 'watch' : 'limiting', 'Screening band assumes mg/kg or ppm; verify extraction method and unit.', 'Use a laboratory method and crop target before phosphorus application.'),
    measuredSignal('available-K', availableK, now, value => value >= 200 ? 'favorable' : value >= 100 ? 'watch' : 'limiting', 'Screening band assumes mg/kg or ppm; verify extraction method and soil CEC.', 'Use a laboratory method and crop target before potassium application.'),
    measuredSignal('SAR', sar, now, value => value < 6 ? 'favorable' : value <= 13 ? 'watch' : 'limiting', 'Screening band uses SAR as a sodicity warning, not a complete infiltration diagnosis.', 'Pair SAR with EC, bicarbonate, texture, and drainage evidence.'),
    { key: 'texture', value: null, unit: '', status: 'missing', score: null, confidence: 'none', detail: 'Categorized texture evidence is not yet saved in the numeric evidence contract.', action: 'Collect a texture result before interpreting CEC, drainage, or infiltration.' },
    { key: 'drainage', value: null, unit: '', status: 'missing', score: null, confidence: 'none', detail: 'Drainage condition is not yet recorded as a structured evidence property.', action: 'Add a field drainage observation or root-zone assessment.' },
    { key: 'compaction', value: null, unit: '', status: 'missing', score: null, confidence: 'none', detail: 'Compaction evidence is not yet recorded as a structured evidence property.', action: 'Add a penetrometer, bulk-density, or root-zone observation.' },
  ];
  const scored = signals.filter(signal => signal.score !== null);
  const limitingCount = signals.filter(signal => signal.status === 'limiting').length;
  const coverage = Math.round((scored.length / SOIL_QUALITY_INDICATORS.length) * 100);
  const score = scored.length > 0 ? Math.round(scored.reduce((sum, signal) => sum + (signal.score ?? 0), 0) / scored.length) : null;
  const missingIndicators = signals.filter(signal => signal.status === 'missing').map(signal => signal.key);
  const hasLowConfidence = scored.some(signal => signal.confidence === 'low' || signal.freshness === 'stale' || signal.freshness === 'undated');
  const hasManagementSensitive = signals.some(signal => ['total-N', 'available-P', 'available-K'].includes(signal.key) && signal.score !== null);
  const confidence: EvidenceConfidence = scored.length === 0 || coverage < 35 || hasLowConfidence ? 'low' : coverage < 65 || hasManagementSensitive ? 'medium' : 'high';
  const posture: SoilQualityPosture = scored.length === 0 ? 'insufficient-evidence' : limitingCount > 0 ? 'limiting-factor' : coverage < 65 ? 'evidence-gap' : hasManagementSensitive ? 'management-caution' : 'screening-only';
  const recommendations = [
    ...(signals.some(signal => signal.key === 'salinity' && signal.status === 'limiting') ? ['review-salinity'] : []),
    ...(signals.some(signal => signal.key === 'pH' && signal.status === 'limiting') ? ['review-pH'] : []),
    ...(signals.some(signal => ['total-N', 'available-P', 'available-K'].includes(signal.key) && signal.status === 'limiting') ? ['soil-test-nutrients'] : []),
    ...(missingIndicators.includes('texture') || missingIndicators.includes('CEC') ? ['collect-texture-CEC'] : []),
    ...(missingIndicators.includes('drainage') ? ['confirm-drainage'] : []),
    ...(missingIndicators.includes('compaction') ? ['verify-compaction'] : []),
    ...(coverage < 65 ? ['expand-soil-evidence'] : []),
  ];
  return {
    score,
    coverage,
    scoredCount: scored.length,
    totalIndicators: SOIL_QUALITY_INDICATORS.length,
    limitingCount,
    missingIndicators,
    confidence,
    posture,
    signals,
    recommendations: [...new Set(recommendations)],
    referenceNote: 'Screening thresholds are not universal soil standards. Confirm crop, depth, texture, laboratory method, units, local reference soil, and agronomist interpretation before high-impact action or any map claim.',
  };
}

function normalizedStrata(strata: string[]): string[] {
  return [...new Set(strata.map(item => item.trim()).filter(Boolean))].slice(0, 8);
}

function samplingPatternFor(input: SamplingMissionInput): SamplingPattern {
  if (input.samplingPattern) return input.samplingPattern;
  if (input.objective === 'covariate-coverage') return 'stratified-random';
  if (input.objective === 'model-improvement') return 'grid';
  if (input.objective === 'management-comparison') return 'paired-zones';
  if (input.objective === 'certification') return 'stratified-random';
  return 'composite-zones';
}

function depthRulesFor(input: SamplingMissionInput): SamplingDepthRule[] {
  const primaryDepthCm = clamp(Math.round(finite(input.primaryDepthCm ?? 30, 30)), 5, 120);
  const rules: SamplingDepthRule[] = [{ label: 'Primary decision layer', topCm: 0, bottomCm: primaryDepthCm, purpose: 'Use the consistent root-zone or topsoil depth defined by the study protocol.' }];
  if (input.salinityConcern || input.includeSubsoilDepth) rules.push({ label: 'Salinity / drainage companion layer', topCm: primaryDepthCm, bottomCm: Math.min(primaryDepthCm + 30, 150), purpose: 'Collect only when the protocol requires a paired subsoil view for salinity, drainage, or rooting depth.' });
  return rules;
}

function sampleLabelsFor(missionId: string, targetSamples: number, strata: string[], depthCm: number): SamplingSampleLabel[] {
  const labelStrata = strata.length > 0 ? strata : ['unspecified stratum'];
  return Array.from({ length: targetSamples }, (_, index) => {
    const sequence = index + 1;
    const stratum = labelStrata[index % labelStrata.length];
    return { id: `${missionId}-sample-${sequence}`, sequence, code: `FA-${String(sequence).padStart(3, '0')}`, stratum, depthCm, status: 'planned', locationNote: '' };
  });
}

export function getSamplingPatternLabel(pattern: SamplingPattern, language: 'en' | 'fr' | 'ar'): string {
  const labels: Record<SamplingPattern, [string, string, string]> = {
    'stratified-random': ['Stratified random', 'Aléatoire stratifié', 'عشوائي طبقي'],
    grid: ['Grid coverage', 'Maillage régulier', 'تغطية شبكية'],
    transect: ['Transect', 'Transect', 'مسار أخذ العينات'],
    'paired-zones': ['Paired management zones', 'Zones de gestion appariées', 'مناطق إدارة متقابلة'],
    'composite-zones': ['Composite by zone', 'Composite par zone', 'عينات مركبة حسب المنطقة'],
  };
  const index = language === 'fr' ? 1 : language === 'ar' ? 2 : 0;
  return labels[pattern][index];
}

export function getSamplingMissionStatusLabel(status: SamplingMissionStatus, language: 'en' | 'fr' | 'ar'): string {
  const labels: Record<SamplingMissionStatus, [string, string, string]> = {
    planned: ['Planned', 'Planifiée', 'مخططة'],
    'in-field': ['In field', 'Sur le terrain', 'في الحقل'],
    completed: ['Completed', 'Terminée', 'مكتملة'],
    'needs-review': ['Needs review', 'À vérifier', 'تحتاج مراجعة'],
  };
  const index = language === 'fr' ? 1 : language === 'ar' ? 2 : 0;
  return labels[status][index];
}

export function getSamplingSampleStatusLabel(status: SamplingSampleStatus, language: 'en' | 'fr' | 'ar'): string {
  const labels: Record<SamplingSampleStatus, [string, string, string]> = {
    planned: ['Planned', 'Prévu', 'مخطط'],
    collected: ['Collected', 'Prélevé', 'تم جمعه'],
    skipped: ['Skipped', 'Ignoré', 'تم تخطيه'],
  };
  const index = language === 'fr' ? 1 : language === 'ar' ? 2 : 0;
  return labels[status][index];
}

export function buildSamplingMission(input: SamplingMissionInput, now = new Date().toISOString()): SamplingMission {
  const studyAreaHa = Math.max(0, finite(input.studyAreaHa));
  const targetSamples = Math.max(1, Math.round(finite(input.targetSamples, 1)));
  const strata = normalizedStrata(input.strata);
  const samplingPattern = samplingPatternFor(input);
  const depthRules = depthRulesFor(input);
  const scorecardGaps = [...new Set(input.scorecardGaps ?? [])];
  const id = `mission-${now.replace(/[^0-9]/g, '').slice(-14)}`;
  const tasks = [
    'Confirm the target property, depth, unit, and decision before field collection.',
    `Plan ${targetSamples} georeferenced samples across ${studyAreaHa.toFixed(2)} ha; this is a planning target, not a universal statistical guarantee.`,
    `Use the ${samplingPattern} pattern and keep the selected strata visible on every label.`,
    'Record coordinates, sample date, depth, crop, irrigation source, and management history for every sample.',
    strata.length > 0 ? `Cover the selected strata: ${strata.join(', ')}.` : 'Define strata before sampling so contrasting soil and management settings are not missed.',
    'Keep independent validation samples separate from model-training samples when mapping or certifying a surface.',
  ];
  if (scorecardGaps.length > 0) tasks.push(`Prioritize scorecard gaps before adding new modelled surfaces: ${scorecardGaps.join(', ')}.`);
  if (input.salinityConcern) tasks.push('Add root-zone ECe/EC, irrigation-water EC, drainage condition, and well/source identifiers to the field record.');
  const qualityGates = [
    'Do not interpret a modelled value as a laboratory result.',
    'Use measured values for management-sensitive nutrients until local validation supports broader inference.',
    'Document laboratory method, detection limits, units, and any depth harmonization.',
    'Verify each label code, stratum, depth, and coordinate before sealing the sample bag.',
    input.objective === 'certification' ? 'Use an independent probability-based validation design for certification claims.' : 'Choose spatial or nearest-neighbour-aware validation before making map claims.',
  ];
  return {
    id,
    objective: input.objective,
    targetProperty: input.targetProperty,
    studyAreaHa,
    targetSamples,
    strata,
    cropId: input.cropId,
    irrigationSource: input.irrigationSource,
    salinityConcern: input.salinityConcern,
    notes: input.notes,
    samplingPattern,
    depthRules,
    sampleLabels: sampleLabelsFor(id, targetSamples, strata, depthRules[0].bottomCm),
    chainOfCustody: { sampleSetId: `SET-${id.replace('mission-', '')}`, collector: input.chainOfCustody?.collector ?? '', handoffTo: input.chainOfCustody?.handoffTo ?? '', laboratory: input.chainOfCustody?.laboratory ?? '', handoffDate: input.chainOfCustody?.handoffDate ?? '', storage: input.chainOfCustody?.storage ?? 'Cool, dry, sealed, and protected from contamination', notes: input.chainOfCustody?.notes ?? '' },
    scorecardGaps,
    status: 'planned',
    offlineCompletedCount: 0,
    tasks,
    qualityGates,
    createdAt: now,
  };
}

export function normalizeSamplingMission(mission: SamplingMission): SamplingMission {
  const samplingPattern = mission.samplingPattern ?? 'composite-zones';
  const strata = normalizedStrata(mission.strata ?? []);
  const targetSamples = Math.max(1, Math.round(finite(mission.targetSamples, 1)));
  const depthRules = mission.depthRules?.length ? mission.depthRules : [{ label: 'Primary decision layer', topCm: 0, bottomCm: 30, purpose: 'Use the consistent root-zone or topsoil depth defined by the study protocol.' }];
  const sampleLabels = mission.sampleLabels?.length ? mission.sampleLabels : sampleLabelsFor(mission.id, targetSamples, strata, depthRules[0].bottomCm);
  const chainOfCustody = mission.chainOfCustody ?? { sampleSetId: `SET-${mission.id.replace('mission-', '')}`, collector: '', handoffTo: '', laboratory: '', handoffDate: '', storage: 'Cool, dry, sealed, and protected from contamination', notes: '' };
  const collected = sampleLabels.filter(sample => sample.status === 'collected').length;
  return { ...mission, samplingPattern, strata, targetSamples, depthRules, sampleLabels, chainOfCustody, scorecardGaps: mission.scorecardGaps ?? [], status: mission.status ?? (collected === targetSamples ? 'completed' : collected > 0 ? 'in-field' : 'planned'), offlineCompletedCount: mission.offlineCompletedCount ?? collected };
}

export function updateSamplingSample(mission: SamplingMission, sampleId: string, status: SamplingSampleStatus, details: Pick<SamplingSampleLabel, 'locationNote' | 'collector'> = { locationNote: '', collector: '' }, now = new Date().toISOString()): SamplingMission {
  const sampleLabels = mission.sampleLabels.map(sample => sample.id === sampleId ? { ...sample, status, locationNote: details.locationNote, collector: details.collector, collectedAt: status === 'collected' ? now : sample.collectedAt } : sample);
  const collected = sampleLabels.filter(sample => sample.status === 'collected').length;
  const skipped = sampleLabels.filter(sample => sample.status === 'skipped').length;
  const statusValue: SamplingMissionStatus = collected === sampleLabels.length ? 'completed' : collected > 0 || skipped > 0 ? skipped > 0 ? 'needs-review' : 'in-field' : 'planned';
  return { ...mission, sampleLabels, status: statusValue, offlineCompletedCount: collected };
}

export function getSamplingObjectiveLabel(objective: SamplingObjective, language: 'en' | 'fr' | 'ar'): string {
  const labels: Record<SamplingObjective, [string, string, string]> = {
    baseline: ['First soil baseline', 'Premier état de référence', 'خط أساس التربة الأول'],
    'covariate-coverage': ['Cover environmental diversity', 'Couvrir la diversité environnementale', 'تغطية التنوع البيئي'],
    'model-improvement': ['Improve a weak model', 'Améliorer un modèle faible', 'تحسين نموذج ضعيف'],
    certification: ['Certify a map or estimate', 'Certifier une carte ou une estimation', 'اعتماد خريطة أو تقدير'],
    'management-comparison': ['Compare management over time', 'Comparer les pratiques dans le temps', 'مقارنة الإدارة عبر الزمن'],
  };
  const index = language === 'fr' ? 1 : language === 'ar' ? 2 : 0;
  return labels[objective][index];
}

export function getEvidencePropertyLabel(property: SoilEvidenceProperty, language: 'en' | 'fr' | 'ar'): string {
  const labels: Record<SoilEvidenceProperty, [string, string, string]> = {
    pH: ['pH', 'pH', 'الأس الهيدروجيني pH'],
    EC: ['Electrical conductivity (EC)', 'Conductivité électrique (CE)', 'التوصيل الكهربائي EC'],
    ECe: ['Root-zone salinity (ECe)', 'Salinité racinaire (ECe)', 'ملوحة منطقة الجذور ECe'],
    texture: ['Texture', 'Texture', 'قوام التربة'],
    CEC: ['CEC', 'CEC', 'السعة التبادلية الكاتيونية CEC'],
    SOC: ['Soil organic carbon (SOC)', 'Carbone organique du sol (COS)', 'الكربون العضوي في التربة SOC'],
    'organic-matter': ['Organic matter', 'Matière organique', 'المادة العضوية'],
    'total-N': ['Total nitrogen', 'Azote total', 'النيتروجين الكلي'],
    'available-P': ['Available phosphorus', 'Phosphore assimilable', 'الفوسفور المتاح'],
    'available-K': ['Available potassium', 'Potassium assimilable', 'البوتاسيوم المتاح'],
    SAR: ['Sodium adsorption ratio (SAR)', 'Rapport d’adsorption du sodium (SAR)', 'نسبة امتزاز الصوديوم SAR'],
    bicarbonate: ['Bicarbonate', 'Bicarbonates', 'البيكربونات'],
  };
  const index = language === 'fr' ? 1 : language === 'ar' ? 2 : 0;
  return labels[property][index];
}

export function getEvidenceSourceLabel(source: SoilEvidenceSource, language: 'en' | 'fr' | 'ar'): string {
  const labels: Record<SoilEvidenceSource, [string, string, string]> = {
    lab: ['Laboratory', 'Laboratoire', 'مختبر'],
    'field-test': ['Field test', 'Test terrain', 'اختبار ميداني'],
    observation: ['Observation', 'Observation', 'ملاحظة'],
    estimate: ['Estimate', 'Estimation', 'تقدير'],
    model: ['Model output', 'Sortie de modèle', 'مخرج نموذج'],
  };
  const index = language === 'fr' ? 1 : language === 'ar' ? 2 : 0;
  return labels[source][index];
}
