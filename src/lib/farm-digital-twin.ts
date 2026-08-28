import { calculateCropSimulator, type SimulatorResult, type SimulatorScenario } from '@/lib/crop-simulator';
import { buildFieldWorkbenchSnapshot, type FieldWorkbenchSnapshot, type WorkbenchField, type WorkbenchPriority } from '@/lib/field-workbench';
import { loadScoutEntries, type ScoutEntry } from '@/lib/scouting-store';
import { getSoilTests, type SoilTestEntry } from '@/lib/soil-history-store';
import { getCropLifecycle, stageForDay } from '@/lib/crop-lifecycle';
import { getSatelliteHealthForField, readSatelliteHealthRecords, type SatelliteHealthRecord } from '@/lib/satellite-health';

export const DIGITAL_TWIN_STORAGE_KEY = 'formula-atlas-digital-twin-v1';
export const DIGITAL_TWIN_CHANGED_EVENT = 'formula-atlas-digital-twin-changed';
export const SAVED_FIELDS_STORAGE_KEY = 'nutriplant_fields_v1';
export const SAVED_SIMULATOR_STORAGE_KEY = 'formula-atlas-crop-simulator-v1';

export type DigitalTwinFieldStatus = 'planned' | 'active' | 'paused' | 'harvested';

export interface DigitalTwinFieldState {
  fieldId: string;
  status: DigitalTwinFieldStatus;
  statusNote: string;
  simulatorScenarioId?: string;
  updatedAt: number;
}

export interface DigitalTwinState {
  selectedFieldId: string | null;
  fieldStates: Record<string, DigitalTwinFieldState>;
}

export interface SavedFieldRecord extends WorkbenchField {
  lastYield?: number;
}

export interface DigitalTwinPriority extends WorkbenchPriority {
  fieldId: string;
  fieldName: string;
  title: string;
  detail: string;
}

export interface DigitalTwinFieldSnapshot {
  field: SavedFieldRecord;
  status: DigitalTwinFieldStatus;
  statusNote: string;
  workbench: FieldWorkbenchSnapshot;
  simulator: SimulatorResult | null;
  satellite: SatelliteHealthRecord | null;
  healthScore: number;
  priorityCount: number;
  nextAction: DigitalTwinPriority | null;
}

export interface DigitalTwinSnapshot {
  generatedAt: number;
  state: DigitalTwinState;
  fields: DigitalTwinFieldSnapshot[];
  selectedFieldId: string | null;
  totals: {
    fieldCount: number;
    totalAreaHa: number;
    activeFieldCount: number;
    plannedFieldCount: number;
    harvestedFieldCount: number;
    totalOpenScouting: number;
    totalCriticalScouting: number;
    totalOverdueFollowUps: number;
    fieldsWithSoilConstraints: number;
    fieldsWithSimulator: number;
    totalSimulatorCost: number;
    totalSimulatorRevenue: number;
    totalSimulatorNetMargin: number;
    lowWaterDemandFields: number;
    mediumWaterDemandFields: number;
    highWaterDemandFields: number;
    fieldsWithSatellite: number;
    stressedSatelliteFields: number;
    criticalSatelliteFields: number;
    totalSatelliteStressedAreaHa: number;
  };
  priorities: DigitalTwinPriority[];
  nextBestActions: DigitalTwinPriority[];
}

function safeNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[ _-]+/g, '');
}

function cropIdFromLabel(value: string): string {
  const key = normalized(value);
  const aliases: Record<string, string> = {
    maize: 'maize', corn: 'maize', wheat: 'wheat', ble: 'wheat', القمح: 'wheat',
    barley: 'barley', orge: 'barley', الشعير: 'barley',
    potato: 'potato', pommesdeterre: 'potato', البطاطا: 'potato',
    tomato: 'tomato', tomate: 'tomato', الطماطم: 'tomato',
    onion: 'onion', oignon: 'onion', البصل: 'onion',
    sunflower: 'sunflower', tournesol: 'sunflower', عبادالشمس: 'sunflower',
    canola: 'canola', colza: 'canola', اللفتالزيتي: 'canola',
    alfalfa: 'alfalfa', luzerne: 'alfalfa', الفصة: 'alfalfa',
    sorghum: 'sorghum', sorgho: 'sorghum', الذرةالرفيعة: 'sorghum',
    soybean: 'soybean', soja: 'soybean', فولالصويا: 'soybean',
  };
  return aliases[key] ?? key;
}

function normalizeSoil(value: unknown): WorkbenchField['soil'] {
  const soil = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  return {
    ph: String(soil.ph ?? '6.5'),
    om: String(soil.om ?? '2.5'),
    cec: String(soil.cec ?? '15'),
    texture: String(soil.texture ?? 'loam'),
  };
}

export function normalizeSavedField(value: unknown, index = 0): SavedFieldRecord | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const name = String(raw.name ?? '').trim();
  if (!name) return null;
  const id = String(raw.id ?? `field-${index + 1}`);
  return {
    id,
    name,
    crop: cropIdFromLabel(String(raw.crop ?? '')) || 'tomato',
    areaHa: Math.max(0, safeNumber(raw.areaHa ?? raw.area ?? 0)),
    plantingDate: String(raw.plantingDate ?? new Date().toISOString().slice(0, 10)),
    soil: normalizeSoil(raw.soil),
    notes: raw.notes ? String(raw.notes) : undefined,
    lastYield: Math.max(0, safeNumber(raw.lastYield ?? 0)),
  };
}

export function readSavedFields(): SavedFieldRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SAVED_FIELDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeSavedField).filter((field): field is SavedFieldRecord => Boolean(field)) : [];
  } catch {
    return [];
  }
}

export function readSavedSimulatorScenario(): SimulatorScenario | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SAVED_SIMULATOR_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SimulatorScenario>;
    if (!parsed || typeof parsed !== 'object' || !parsed.cropId || !Array.isArray(parsed.costs)) return null;
    return parsed as SimulatorScenario;
  } catch {
    return null;
  }
}

export function createDefaultDigitalTwinState(): DigitalTwinState {
  return { selectedFieldId: null, fieldStates: {} };
}

function normalizeState(value: unknown): DigitalTwinState {
  if (!value || typeof value !== 'object') return createDefaultDigitalTwinState();
  const raw = value as Partial<DigitalTwinState>;
  const fieldStates: Record<string, DigitalTwinFieldState> = {};
  if (raw.fieldStates && typeof raw.fieldStates === 'object') {
    for (const [fieldId, entry] of Object.entries(raw.fieldStates)) {
      if (!entry || typeof entry !== 'object') continue;
      const candidate = entry as Partial<DigitalTwinFieldState>;
      fieldStates[fieldId] = {
        fieldId,
        status: candidate.status === 'planned' || candidate.status === 'paused' || candidate.status === 'harvested' ? candidate.status : 'active',
        statusNote: String(candidate.statusNote ?? ''),
        simulatorScenarioId: candidate.simulatorScenarioId ? String(candidate.simulatorScenarioId) : undefined,
        updatedAt: safeNumber(candidate.updatedAt, Date.now()),
      };
    }
  }
  return {
    selectedFieldId: raw.selectedFieldId ? String(raw.selectedFieldId) : null,
    fieldStates,
  };
}

export function loadDigitalTwinState(): DigitalTwinState {
  if (typeof window === 'undefined') return createDefaultDigitalTwinState();
  try {
    const raw = window.localStorage.getItem(DIGITAL_TWIN_STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : createDefaultDigitalTwinState();
  } catch {
    return createDefaultDigitalTwinState();
  }
}

export function saveDigitalTwinState(state: DigitalTwinState): DigitalTwinState {
  const normalizedState = normalizeState(state);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(DIGITAL_TWIN_STORAGE_KEY, JSON.stringify(normalizedState));
      window.dispatchEvent(new Event(DIGITAL_TWIN_CHANGED_EVENT));
    } catch {
      // Keep the in-memory experience usable if localStorage is unavailable.
    }
  }
  return normalizedState;
}

export function updateDigitalTwinFieldState(
  state: DigitalTwinState,
  fieldId: string,
  patch: Partial<Omit<DigitalTwinFieldState, 'fieldId' | 'updatedAt'>>,
): DigitalTwinState {
  const current = state.fieldStates[fieldId] ?? {
    fieldId,
    status: 'active' as const,
    statusNote: '',
    updatedAt: Date.now(),
  };
  return saveDigitalTwinState({
    ...state,
    fieldStates: {
      ...state.fieldStates,
      [fieldId]: { ...current, ...patch, fieldId, updatedAt: Date.now() },
    },
  });
}

export function setDigitalTwinSelectedField(state: DigitalTwinState, fieldId: string | null): DigitalTwinState {
  return saveDigitalTwinState({ ...state, selectedFieldId: fieldId });
}

function statusForField(field: SavedFieldRecord, state: DigitalTwinState, now: number): DigitalTwinFieldState {
  const saved = state.fieldStates[field.id];
  if (saved) return saved;
  const plantingTime = new Date(`${field.plantingDate}T12:00:00`).getTime();
  const status: DigitalTwinFieldStatus = Number.isFinite(plantingTime) && plantingTime > now ? 'planned' : 'active';
  return { fieldId: field.id, status, statusNote: '', updatedAt: now };
}

function priorityCopy(priority: WorkbenchPriority): Pick<DigitalTwinPriority, 'title' | 'detail'> {
  if (priority.kind === 'overdue_follow_up') return { title: 'Overdue scouting follow-up', detail: `${priority.count ?? 0} follow-up item(s) need attention.` };
  if (priority.kind === 'critical_observation') return { title: 'Critical field observation', detail: `${priority.count ?? 0} critical observation(s) remain unresolved.` };
  if (priority.kind === 'soil_constraint') return { title: `Soil constraint: ${priority.constraint?.key ?? 'review'}`, detail: 'Review the latest soil test and apply a corrective plan.' };
  return { title: 'Nutrient plan guardrail', detail: `${priority.count ?? 0} nutrient warning(s) should be reviewed before application.` };
}

function lifecycleIrrigation(cropId: string, daysSincePlanting: number): FieldWorkbenchSnapshot['irrigation'] {
  const lifecycle = getCropLifecycle(cropId);
  if (!lifecycle?.stages.length) return null;
  const stage = stageForDay(lifecycle, Math.max(1, daysSincePlanting)) ?? lifecycle.stages[lifecycle.stages.length - 1];
  const kc = stage.kc;
  return {
    kc,
    mmPerDay: Math.round(kc * 5 * 10) / 10,
    level: kc < 0.5 ? 'low' : kc < 0.9 ? 'medium' : 'high',
  };
}

function healthScore(workbench: FieldWorkbenchSnapshot, status: DigitalTwinFieldStatus): number {
  let score = status === 'paused' ? 60 : status === 'harvested' ? 85 : 100;
  score -= workbench.scouting.criticalCount * 22;
  score -= workbench.scouting.overdueCount * 14;
  score -= workbench.soilConstraints.filter(c => c.level === 'critical').length * 18;
  score -= workbench.soilConstraints.filter(c => c.level === 'attention').length * 8;
  score -= workbench.nutrientPlan?.warnings.length ? 8 : 0;
  return Math.max(0, Math.min(100, score));
}

function buildFieldSimulatorResult(field: SavedFieldRecord, scenario: SimulatorScenario | null): SimulatorResult | null {
  if (!scenario) return null;
  if (cropIdFromLabel(field.crop) !== cropIdFromLabel(scenario.cropId)) return null;
  return calculateCropSimulator(scenario);
}

export interface DigitalTwinSnapshotOptions {
  fields?: SavedFieldRecord[];
  soilTests?: SoilTestEntry[];
  scoutEntries?: ScoutEntry[];
  state?: DigitalTwinState;
  simulatorScenario?: SimulatorScenario | null;
  satelliteRecords?: SatelliteHealthRecord[];
  now?: number;
}

export function buildFarmDigitalTwinSnapshot(options: DigitalTwinSnapshotOptions = {}): DigitalTwinSnapshot {
  const now = options.now ?? Date.now();
  const fields = options.fields ?? readSavedFields();
  const soilTests = options.soilTests ?? (typeof window === 'undefined' ? [] : getSoilTests());
  const scoutEntries = options.scoutEntries ?? (typeof window === 'undefined' ? [] : loadScoutEntries());
  const state = normalizeState(options.state ?? (typeof window === 'undefined' ? createDefaultDigitalTwinState() : loadDigitalTwinState()));
  const simulatorScenario = options.simulatorScenario === undefined ? readSavedSimulatorScenario() : options.simulatorScenario;
  const satelliteRecords = options.satelliteRecords ?? (typeof window === 'undefined' ? [] : readSatelliteHealthRecords());

  const fieldSnapshots = fields.map((field) => {
    const workbenchBase = buildFieldWorkbenchSnapshot(field, soilTests, scoutEntries, now);
    const workbench = workbenchBase.irrigation
      ? workbenchBase
      : { ...workbenchBase, irrigation: lifecycleIrrigation(cropIdFromLabel(field.crop), workbenchBase.daysSincePlanting) };
    const savedState = statusForField(field, state, now);
    const simulator = buildFieldSimulatorResult(field, simulatorScenario);
    const satellite = getSatelliteHealthForField(field.id, satelliteRecords);
    const priorities = workbench.priorities.map((priority) => {
      const copy = priorityCopy(priority);
      return { ...priority, ...copy, fieldId: field.id, fieldName: field.name };
    });
    return {
      field,
      status: savedState.status,
      statusNote: savedState.statusNote,
      workbench,
      simulator,
      satellite,
      healthScore: healthScore(workbench, savedState.status),
      priorityCount: priorities.length,
      nextAction: priorities[0] ?? null,
    } satisfies DigitalTwinFieldSnapshot;
  });

  const priorities = fieldSnapshots.flatMap((fieldSnapshot) => fieldSnapshot.workbench.priorities.map((priority) => {
    const copy = priorityCopy(priority);
    return { ...priority, ...copy, fieldId: fieldSnapshot.field.id, fieldName: fieldSnapshot.field.name };
  })).sort((a, b) => {
    const levelScore = (level: DigitalTwinPriority['level']) => level === 'critical' ? 0 : 1;
    return levelScore(a.level) - levelScore(b.level) || a.fieldName.localeCompare(b.fieldName);
  });

  const linkedSimulators = fieldSnapshots.flatMap((field) => field.simulator ? [field.simulator] : []);
  const linkedSatellite = fieldSnapshots.flatMap((field) => field.satellite ? [field.satellite] : []);
  const selectedFieldId = state.selectedFieldId && fields.some((field) => field.id === state.selectedFieldId)
    ? state.selectedFieldId
    : fields[0]?.id ?? null;
  const waterCounts = { low: 0, medium: 0, high: 0 };
  for (const field of fieldSnapshots) {
    const level = field.workbench.irrigation?.level;
    if (level) waterCounts[level] += 1;
  }

  return {
    generatedAt: now,
    state: { ...state, selectedFieldId },
    fields: fieldSnapshots,
    selectedFieldId,
    totals: {
      fieldCount: fields.length,
      totalAreaHa: fields.reduce((sum, field) => sum + Math.max(0, field.areaHa), 0),
      activeFieldCount: fieldSnapshots.filter((field) => field.status === 'active').length,
      plannedFieldCount: fieldSnapshots.filter((field) => field.status === 'planned').length,
      harvestedFieldCount: fieldSnapshots.filter((field) => field.status === 'harvested').length,
      totalOpenScouting: fieldSnapshots.reduce((sum, field) => sum + field.workbench.scouting.openCount, 0),
      totalCriticalScouting: fieldSnapshots.reduce((sum, field) => sum + field.workbench.scouting.criticalCount, 0),
      totalOverdueFollowUps: fieldSnapshots.reduce((sum, field) => sum + field.workbench.scouting.overdueCount, 0),
      fieldsWithSoilConstraints: fieldSnapshots.filter((field) => field.workbench.soilConstraints.length > 0).length,
      fieldsWithSimulator: linkedSimulators.length,
      totalSimulatorCost: linkedSimulators.reduce((sum, result) => sum + result.totalCost, 0),
      totalSimulatorRevenue: linkedSimulators.reduce((sum, result) => sum + result.totalRevenue, 0),
      totalSimulatorNetMargin: linkedSimulators.reduce((sum, result) => sum + result.netMargin, 0),
      lowWaterDemandFields: waterCounts.low,
      mediumWaterDemandFields: waterCounts.medium,
      highWaterDemandFields: waterCounts.high,
      fieldsWithSatellite: linkedSatellite.length,
      stressedSatelliteFields: linkedSatellite.filter((record) => record.level === 'stressed' || record.level === 'critical').length,
      criticalSatelliteFields: linkedSatellite.filter((record) => record.level === 'critical').length,
      totalSatelliteStressedAreaHa: linkedSatellite.reduce((sum, record) => sum + record.stressedAreaHa, 0),
    },
    priorities,
    nextBestActions: priorities.slice(0, 6),
  };
}

export function createDigitalTwinFieldState(fieldId: string): DigitalTwinFieldState {
  return { fieldId, status: 'active', statusNote: '', updatedAt: Date.now() };
}

export function createDigitalTwinActionId(): string {
  return createId('twin-action');
}
