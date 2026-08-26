'use client';

import {
  calculateCropSimulator,
  createDefaultSimulatorScenario,
  getSimulatorCropProfile,
  type SimulatorResult,
  type SimulatorScenario,
} from '@/lib/crop-simulator';
import {
  DIGITAL_TWIN_CHANGED_EVENT,
  readSavedFields,
  SAVED_FIELDS_STORAGE_KEY,
  SAVED_SIMULATOR_STORAGE_KEY,
  type SavedFieldRecord,
} from '@/lib/farm-digital-twin';
import {
  FIELD_RECORD_BOOK_CHANGED_EVENT,
  loadManualFieldRecords,
  saveManualFieldRecords,
  type FieldRecord,
} from '@/lib/field-record-book';
import {
  loadScoutEntries,
  SCOUT_ENTRIES_CHANGED_EVENT,
  SCOUT_STORAGE_KEY,
  type ScoutEntry,
} from '@/lib/scouting-store';
import { getSoilTests, type SoilTestEntry } from '@/lib/soil-history-store';
import {
  readSatelliteHealthRecords,
  SATELLITE_HEALTH_CHANGED_EVENT,
  SATELLITE_HEALTH_STORAGE_KEY,
  type SatelliteHealthRecord,
} from '@/lib/satellite-health';

export const DEMO_SCENARIO_STORAGE_KEY = 'formula-atlas-demo-scenario-v1';
export const DEMO_SCENARIO_CHANGED_EVENT = 'formula-atlas-demo-scenario-changed';
export const DEMO_GENERATOR_VERSION = '1.0.0';
export const DEMO_DATA_WARNING = 'Synthetic demonstration data only — not for agronomic decisions.';

export type DemoScenarioDensity = 'compact' | 'standard' | 'showcase';

export interface DemoScenarioRecipe {
  masterSeed: string;
  baseYear: number;
  density: DemoScenarioDensity;
  locale?: 'en' | 'fr' | 'ar';
}

export interface DemoScenarioManifest {
  schemaVersion: 1;
  scenarioId: string;
  label: string;
  generatedAt: string;
  fakeData: true;
  warning: string;
  generator: 'formula-atlas-demo-scenario-engine';
  generatorVersion: string;
  masterSeed: string;
  baseYear: number;
  density: DemoScenarioDensity;
  locale: 'en' | 'fr' | 'ar';
  currency: 'DZD';
  modules: Array<'fields' | 'scouting' | 'soil' | 'satellite' | 'simulator' | 'record-book'>;
}

export interface DemoScenarioMetrics {
  fieldCount: number;
  totalAreaHa: number;
  recordCount: number;
  scoutingCount: number;
  soilTestCount: number;
  satelliteCount: number;
  criticalCount: number;
  totalCostDzd: number;
  totalRevenueDzd: number;
  totalYieldT: number;
}

export interface DemoScenario {
  manifest: DemoScenarioManifest;
  recipe: DemoScenarioRecipe;
  fields: SavedFieldRecord[];
  scoutEntries: ScoutEntry[];
  soilTests: SoilTestEntry[];
  satelliteRecords: SatelliteHealthRecord[];
  fieldRecords: FieldRecord[];
  simulatorScenario: SimulatorScenario;
  simulatorResult: SimulatorResult;
  metrics: DemoScenarioMetrics;
}

const SOIL_HISTORY_STORAGE_KEY = 'nutriplant_soil_history_v1';
const FIELDS_CHANGED_EVENT = 'formula-atlas-fields-changed';

const FIELD_BLUEPRINTS: Array<{
  suffix: string;
  name: string;
  cropId: string;
  areaHa: number;
  plantingDate: (year: number) => string;
  soil: { ph: string; om: string; cec: string; texture: string };
}> = [
  {
    suffix: 'mitidja-wheat',
    name: 'Mitidja Wheat Block',
    cropId: 'wheat',
    areaHa: 4.8,
    plantingDate: (year) => `${year - 1}-10-15`,
    soil: { ph: '6.7', om: '2.8', cec: '15', texture: 'loam' },
  },
  {
    suffix: 'highlands-barley',
    name: 'Highlands Barley Block',
    cropId: 'barley',
    areaHa: 6.2,
    plantingDate: (year) => `${year - 1}-11-02`,
    soil: { ph: '7.5', om: '1.8', cec: '19', texture: 'clay loam' },
  },
  {
    suffix: 'biskra-potato',
    name: 'Biskra Potato Block',
    cropId: 'potato',
    areaHa: 2.4,
    plantingDate: (year) => `${year}-01-20`,
    soil: { ph: '7.2', om: '2.2', cec: '12', texture: 'sandy loam' },
  },
  {
    suffix: 'oran-tomato',
    name: 'Oran Tomato Block',
    cropId: 'tomato',
    areaHa: 1.8,
    plantingDate: (year) => `${year}-03-10`,
    soil: { ph: '6.4', om: '3.1', cec: '17', texture: 'loam' },
  },
];

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function safeSeed(value: string): string {
  const seed = value.trim();
  return seed || 'formula-atlas-demo';
}

function slugify(value: string): string {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 36) || 'scenario';
}

function dateAt(baseYear: number, month: number, day: number): string {
  return `${baseYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function timestampFor(date: string): number {
  return new Date(`${date}T12:00:00`).getTime();
}

function densityCount(density: DemoScenarioDensity): number {
  return density === 'compact' ? 2 : density === 'showcase' ? FIELD_BLUEPRINTS.length : 3;
}

function scenarioIdFor(recipe: DemoScenarioRecipe): string {
  const normalized = `${safeSeed(recipe.masterSeed)}-${recipe.baseYear}-${recipe.density}`;
  return `demo-${slugify(normalized)}-${hashSeed(normalized).toString(36)}`;
}

function createFieldRecords(
  scenarioId: string,
  field: SavedFieldRecord,
  baseYear: number,
  random: () => number,
): { scout: ScoutEntry[]; soil: SoilTestEntry; satellite: SatelliteHealthRecord; records: FieldRecord[] } {
  const scoutDate = dateAt(baseYear, 4 + Math.floor(random() * 3), 8 + Math.floor(random() * 12));
  const severity = random() > 0.68 ? 'warning' : 'info';
  const soilDate = dateAt(baseYear, 3, 5);
  const ndvi = round(clamp(0.48 + random() * 0.34, 0.32, 0.86), 2);
  const stressedAreaPct = round(clamp((0.92 - ndvi) * 68 + random() * 5, 4, 38), 1);
  const level: SatelliteHealthRecord['level'] = ndvi < 0.3 || stressedAreaPct >= 35
    ? 'critical'
    : ndvi < 0.45 || stressedAreaPct >= 20
      ? 'stressed'
      : ndvi < 0.6 || stressedAreaPct >= 10
        ? 'watch'
        : 'excellent';
  const scout: ScoutEntry = {
    id: `demo-scout-${scenarioId}-${field.id}`,
    timestamp: timestampFor(scoutDate),
    fieldName: field.name,
    crop: field.crop,
    note: severity === 'warning'
      ? 'Synthetic scouting note: patchy canopy and mild water-stress symptoms flagged for follow-up.'
      : 'Synthetic scouting note: canopy is uniform; continue routine monitoring and irrigation checks.',
    severity,
    status: severity === 'warning' ? 'open' : 'monitoring',
    followUpDate: timestampFor(dateAt(baseYear, 5, 20)),
    followUpTask: 'Review irrigation uniformity and compare with satellite health.',
    updatedAt: timestampFor(scoutDate),
  };
  const soil: SoilTestEntry = {
    id: `demo-soil-${scenarioId}-${field.id}`,
    date: soilDate,
    fieldName: field.name,
    ph: Number(field.soil.ph),
    om: Number(field.soil.om),
    cec: Number(field.soil.cec),
    ca: 8 + random() * 4,
    mg: 1 + random() * 0.8,
    k: 0.3 + random() * 0.35,
    na: field.crop === 'potato' ? 0.7 : 0.2 + random() * 0.25,
    p: 18 + random() * 18,
    sand: field.soil.texture === 'sandy loam' ? 55 : 35,
    silt: field.soil.texture === 'loam' ? 40 : 30,
    clay: field.soil.texture === 'clay loam' ? 35 : 20,
    notes: `${DEMO_DATA_WARNING} Generated baseline for ${field.name}.`,
  };
  const satellite: SatelliteHealthRecord = {
    fieldId: field.id,
    fieldName: field.name,
    crop: field.crop,
    source: 'simulated',
    date: dateAt(baseYear, 5, 18),
    averageNdvi: ndvi,
    minNdvi: round(clamp(ndvi - 0.14 - random() * 0.06, 0.08, 0.9), 2),
    maxNdvi: round(clamp(ndvi + 0.12 + random() * 0.05, 0.2, 0.98), 2),
    stressedAreaPct,
    stressedAreaHa: round(field.areaHa * stressedAreaPct / 100, 2),
    cloudCover: round(5 + random() * 20, 1),
    zoneCount: 3 + Math.floor(random() * 4),
    level,
    recommendations: [
      'Synthetic recommendation: compare the satellite pattern with field scouting.',
      'Use the crop calendar and water budget before changing irrigation.',
    ],
    updatedAt: timestampFor(dateAt(baseYear, 5, 18)),
  };
  const records: FieldRecord[] = [
    {
      id: `demo-record-profile-${scenarioId}-${field.id}`,
      fieldId: field.id,
      fieldName: field.name,
      crop: field.crop,
      timestamp: timestampFor(field.plantingDate),
      source: 'demo',
      kind: 'note',
      title: 'Demo field profile',
      summary: `${DEMO_DATA_WARNING} ${field.areaHa} ha ${field.crop} block for product demonstration.`,
      metadata: { scenarioId, fakeData: true, areaHa: field.areaHa },
    },
    {
      id: `demo-record-input-${scenarioId}-${field.id}`,
      fieldId: field.id,
      fieldName: field.name,
      crop: field.crop,
      timestamp: timestampFor(dateAt(baseYear, 2, 20)),
      source: 'demo',
      kind: 'input',
      title: 'Synthetic seasonal input plan',
      summary: 'Illustrative seed, fertilizer, energy, and labor lines are available in the linked DZD simulator snapshot.',
      amountDzd: round(field.areaHa * (35000 + random() * 25000)),
      metadata: { scenarioId, fakeData: true, module: 'simulator' },
    },
    {
      id: `demo-record-scout-${scenarioId}-${field.id}`,
      fieldId: field.id,
      fieldName: field.name,
      crop: field.crop,
      timestamp: scout.timestamp,
      source: 'demo',
      kind: 'observation',
      title: 'Synthetic field scouting observation',
      summary: scout.note,
      severity,
      metadata: { scenarioId, fakeData: true, linkedScoutId: scout.id },
    },
    {
      id: `demo-record-satellite-${scenarioId}-${field.id}`,
      fieldId: field.id,
      fieldName: field.name,
      crop: field.crop,
      timestamp: satellite.updatedAt,
      source: 'demo',
      kind: 'observation',
      title: 'Synthetic satellite health check',
      summary: `NDVI ${satellite.averageNdvi.toFixed(2)} · ${satellite.stressedAreaPct.toFixed(1)}% stressed area · simulated Sentinel-style signal.`,
      severity: level === 'critical' ? 'critical' : level === 'stressed' ? 'warning' : 'info',
      metadata: { scenarioId, fakeData: true, ndvi: satellite.averageNdvi, stressedAreaPct: satellite.stressedAreaPct },
    },
    {
      id: `demo-record-harvest-${scenarioId}-${field.id}`,
      fieldId: field.id,
      fieldName: field.name,
      crop: field.crop,
      timestamp: timestampFor(dateAt(baseYear, 7, 12)),
      source: 'demo',
      kind: 'harvest',
      title: 'Synthetic harvest outcome placeholder',
      summary: 'Illustrative harvest milestone for timeline and investor-demo purposes; it is not a measured yield.',
      amountDzd: round(field.areaHa * (80000 + random() * 90000)),
      metadata: { scenarioId, fakeData: true, measured: false },
    },
  ];
  return { scout: [scout], soil, satellite, records };
}

export function createDemoScenario(recipe: DemoScenarioRecipe = {
  masterSeed: 'formula-atlas-2026',
  baseYear: 2026,
  density: 'standard',
  locale: 'en',
}, now = Date.now()): DemoScenario {
  const normalizedRecipe: DemoScenarioRecipe = {
    masterSeed: safeSeed(recipe.masterSeed),
    baseYear: Math.round(clamp(recipe.baseYear, 2020, 2035)),
    density: recipe.density === 'compact' || recipe.density === 'showcase' ? recipe.density : 'standard',
    locale: recipe.locale === 'fr' || recipe.locale === 'ar' ? recipe.locale : 'en',
  };
  const scenarioId = scenarioIdFor(normalizedRecipe);
  const random = seededRandom(hashSeed(`${scenarioId}|fields`));
  const fields = FIELD_BLUEPRINTS.slice(0, densityCount(normalizedRecipe.density)).map((blueprint) => ({
    id: `demo-field-${scenarioId}-${blueprint.suffix}`,
    name: blueprint.name,
    crop: blueprint.cropId,
    areaHa: blueprint.areaHa,
    plantingDate: blueprint.plantingDate(normalizedRecipe.baseYear),
    soil: blueprint.soil,
    lastYield: 0,
    notes: `${DEMO_DATA_WARNING} Generated from seed ${normalizedRecipe.masterSeed}.`,
  } satisfies SavedFieldRecord));
  const generated = fields.map((field) => createFieldRecords(scenarioId, field, normalizedRecipe.baseYear, random));
  const primaryField = fields[0];
  const baseSimulator = createDefaultSimulatorScenario(primaryField.crop, primaryField.plantingDate, primaryField.areaHa);
  const profile = getSimulatorCropProfile(primaryField.crop);
  const simulatorScenario: SimulatorScenario = {
    ...baseSimulator,
    id: `${scenarioId}-simulator`,
    expectedYieldTPerHa: round(profile.expectedYieldTPerHa * (0.88 + random() * 0.18), 2),
    expectedPricePerT: round(profile.referencePricePerT * (0.93 + random() * 0.14), 0),
    costs: baseSimulator.costs.map((line) => ({ ...line, id: `${scenarioId}-${line.id}`, note: `${line.note ?? ''} ${DEMO_DATA_WARNING}`.trim() })),
    risks: baseSimulator.risks.map((risk) => ({ ...risk })),
  };
  const simulatorResult = calculateCropSimulator(simulatorScenario);
  const satelliteRecords = generated.map((entry) => entry.satellite);
  const scoutEntries = generated.flatMap((entry) => entry.scout);
  const soilTests = generated.map((entry) => entry.soil);
  const fieldRecords = generated.flatMap((entry) => entry.records);
  const manifest: DemoScenarioManifest = {
    schemaVersion: 1,
    scenarioId,
    label: 'Algeria Demo Farm Scenario',
    generatedAt: new Date(now).toISOString(),
    fakeData: true,
    warning: DEMO_DATA_WARNING,
    generator: 'formula-atlas-demo-scenario-engine',
    generatorVersion: DEMO_GENERATOR_VERSION,
    masterSeed: normalizedRecipe.masterSeed,
    baseYear: normalizedRecipe.baseYear,
    density: normalizedRecipe.density,
    locale: normalizedRecipe.locale ?? 'en',
    currency: 'DZD',
    modules: ['fields', 'scouting', 'soil', 'satellite', 'simulator', 'record-book'],
  };
  return {
    manifest,
    recipe: normalizedRecipe,
    fields,
    scoutEntries,
    soilTests,
    satelliteRecords,
    fieldRecords,
    simulatorScenario,
    simulatorResult,
    metrics: {
      fieldCount: fields.length,
      totalAreaHa: round(fields.reduce((sum, field) => sum + field.areaHa, 0), 2),
      recordCount: fieldRecords.length,
      scoutingCount: scoutEntries.length,
      soilTestCount: soilTests.length,
      satelliteCount: satelliteRecords.length,
      criticalCount: fieldRecords.filter((record) => record.severity === 'critical').length,
      totalCostDzd: round(simulatorResult.totalCost, 0),
      totalRevenueDzd: round(simulatorResult.totalRevenue, 0),
      totalYieldT: round(simulatorResult.totalYieldT, 2),
    },
  };
}

function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const byId = new Map(existing.map((entry) => [entry.id, entry]));
  incoming.forEach((entry) => byId.set(entry.id, entry));
  return [...byId.values()];
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function dispatch(...events: string[]): void {
  if (typeof window === 'undefined') return;
  events.forEach((eventName) => window.dispatchEvent(new Event(eventName)));
}

export interface DemoApplyCounts {
  fields: number;
  scouting: number;
  soilTests: number;
  satellite: number;
  records: number;
}

export function applyDemoScenario(scenario: DemoScenario): DemoApplyCounts {
  if (typeof window === 'undefined') return { fields: 0, scouting: 0, soilTests: 0, satellite: 0, records: 0 };
  const scenarioId = scenario.manifest.scenarioId;
  const fieldIds = new Set(scenario.fields.map((field) => field.id));
  const existingFields = readSavedFields().filter((field) => !fieldIds.has(field.id));
  writeJson(SAVED_FIELDS_STORAGE_KEY, [...existingFields, ...scenario.fields]);

  const existingScouting = loadScoutEntries().filter((entry) => !entry.id.startsWith(`demo-scout-${scenarioId}-`));
  writeJson(SCOUT_STORAGE_KEY, mergeById(existingScouting, scenario.scoutEntries));

  const existingSoil = getSoilTests().filter((entry) => !entry.id.startsWith(`demo-soil-${scenarioId}-`));
  writeJson(SOIL_HISTORY_STORAGE_KEY, mergeById(existingSoil, scenario.soilTests));

  const existingSatellite = readSatelliteHealthRecords().filter((entry) => !fieldIds.has(entry.fieldId));
  const satelliteByField = new Map(existingSatellite.map((entry) => [entry.fieldId, entry]));
  scenario.satelliteRecords.forEach((entry) => satelliteByField.set(entry.fieldId, entry));
  writeJson(SATELLITE_HEALTH_STORAGE_KEY, [...satelliteByField.values()]);

  const existingRecords = loadManualFieldRecords().filter((record) => record.metadata?.scenarioId !== scenarioId);
  saveManualFieldRecords(mergeById(existingRecords, scenario.fieldRecords));
  writeJson(SAVED_SIMULATOR_STORAGE_KEY, scenario.simulatorScenario);
  writeJson(DEMO_SCENARIO_STORAGE_KEY, scenario);
  dispatch(FIELDS_CHANGED_EVENT, SCOUT_ENTRIES_CHANGED_EVENT, SATELLITE_HEALTH_CHANGED_EVENT, FIELD_RECORD_BOOK_CHANGED_EVENT, DIGITAL_TWIN_CHANGED_EVENT, DEMO_SCENARIO_CHANGED_EVENT);
  return {
    fields: scenario.fields.length,
    scouting: scenario.scoutEntries.length,
    soilTests: scenario.soilTests.length,
    satellite: scenario.satelliteRecords.length,
    records: scenario.fieldRecords.length,
  };
}

export function loadLastDemoScenario(): DemoScenario | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DEMO_SCENARIO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoScenario;
    return parsed?.manifest?.fakeData && parsed.manifest.generator === 'formula-atlas-demo-scenario-engine' ? parsed : null;
  } catch {
    return null;
  }
}

export function clearDemoScenario(): void {
  if (typeof window === 'undefined') return;
  const scenario = loadLastDemoScenario();
  if (!scenario) return;
  const scenarioId = scenario.manifest.scenarioId;
  const fieldIds = new Set(scenario.fields.map((field) => field.id));
  writeJson(SAVED_FIELDS_STORAGE_KEY, readSavedFields().filter((field) => !fieldIds.has(field.id)));
  writeJson(SCOUT_STORAGE_KEY, loadScoutEntries().filter((entry) => !entry.id.startsWith(`demo-scout-${scenarioId}-`)));
  writeJson(SOIL_HISTORY_STORAGE_KEY, getSoilTests().filter((entry) => !entry.id.startsWith(`demo-soil-${scenarioId}-`)));
  writeJson(SATELLITE_HEALTH_STORAGE_KEY, readSatelliteHealthRecords().filter((entry) => !fieldIds.has(entry.fieldId)));
  saveManualFieldRecords(loadManualFieldRecords().filter((record) => record.metadata?.scenarioId !== scenarioId));
  const simulator = window.localStorage.getItem(SAVED_SIMULATOR_STORAGE_KEY);
  if (simulator) {
    try {
      const parsed = JSON.parse(simulator) as Partial<SimulatorScenario>;
      if (parsed.id === scenario.simulatorScenario.id) window.localStorage.removeItem(SAVED_SIMULATOR_STORAGE_KEY);
    } catch {
      // Keep unrelated simulator data intact.
    }
  }
  window.localStorage.removeItem(DEMO_SCENARIO_STORAGE_KEY);
  dispatch(FIELDS_CHANGED_EVENT, SCOUT_ENTRIES_CHANGED_EVENT, SATELLITE_HEALTH_CHANGED_EVENT, FIELD_RECORD_BOOK_CHANGED_EVENT, DIGITAL_TWIN_CHANGED_EVENT, DEMO_SCENARIO_CHANGED_EVENT);
}
