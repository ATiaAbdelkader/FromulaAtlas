import { getCropPreset } from '@/lib/crop-presets';
import { calculateNutrientBudget, type NutrientBudgetPlan } from '@/lib/nutrient-budget';
import type { ScoutEntry } from '@/lib/scouting-store';
import type { SoilTestEntry } from '@/lib/soil-history-store';

export type IrrigationDemandLevel = 'low' | 'medium' | 'high';
export type WorkbenchPriorityKind = 'overdue_follow_up' | 'critical_observation' | 'soil_constraint' | 'nutrient_guardrail';
export type WorkbenchPriorityLevel = 'critical' | 'attention';

export interface WorkbenchField {
  id: string;
  name: string;
  crop: string;
  areaHa: number;
  plantingDate: string;
  soil: {
    ph: string;
    om: string;
    cec: string;
    texture: string;
  };
  notes?: string;
}

export interface SoilConstraint {
  key: 'ph' | 'om' | 'k' | 'p' | 'na';
  level: WorkbenchPriorityLevel;
  value: number;
}

export interface WorkbenchPriority {
  id: string;
  kind: WorkbenchPriorityKind;
  level: WorkbenchPriorityLevel;
  count?: number;
  constraint?: SoilConstraint;
}

export interface FieldWorkbenchSnapshot {
  field: WorkbenchField;
  daysSincePlanting: number;
  cropStage: string;
  irrigation: {
    kc: number;
    mmPerDay: number;
    level: IrrigationDemandLevel;
  } | null;
  latestSoilTest: SoilTestEntry | null;
  soilConstraints: SoilConstraint[];
  scouting: {
    entries: ScoutEntry[];
    openCount: number;
    criticalCount: number;
    overdueCount: number;
    recent: ScoutEntry[];
  };
  nutrientPlan: NutrientBudgetPlan | null;
  priorities: WorkbenchPriority[];
}

function positiveNumber(value: string | number | undefined, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value ?? '');
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function normalizedName(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function daysSincePlanting(plantingDate: string, now = Date.now()): number {
  const planting = new Date(`${plantingDate}T12:00:00`).getTime();
  if (!Number.isFinite(planting)) return 0;
  return Math.max(0, Math.floor((now - planting) / 86_400_000));
}

export function getFieldCropStage(cropId: string, daysSince: number): string {
  const crop = getCropPreset(cropId);
  if (!crop?.irrigation.stages.length) return '—';

  let elapsed = 0;
  for (const stage of crop.irrigation.stages) {
    elapsed += stage.days;
    if (daysSince <= elapsed) return stage.name;
  }
  return crop.irrigation.stages[crop.irrigation.stages.length - 1].name;
}

export function getFieldIrrigationDemand(cropId: string, daysSince: number): FieldWorkbenchSnapshot['irrigation'] {
  const crop = getCropPreset(cropId);
  if (!crop?.irrigation.stages.length) return null;

  let elapsed = 0;
  let kc = crop.irrigation.stages[crop.irrigation.stages.length - 1].kc;
  for (const stage of crop.irrigation.stages) {
    elapsed += stage.days;
    kc = stage.kc;
    if (daysSince <= elapsed) break;
  }

  return {
    kc,
    mmPerDay: Math.round(kc * 5 * 10) / 10,
    level: kc < 0.5 ? 'low' : kc < 0.9 ? 'medium' : 'high',
  };
}

export function getLatestFieldSoilTest(fieldName: string, tests: SoilTestEntry[]): SoilTestEntry | null {
  const name = normalizedName(fieldName);
  const matches = tests.filter(test => normalizedName(test.fieldName) === name);
  if (!matches.length) return null;
  return [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
}

export function getSoilConstraints(test: SoilTestEntry | null): SoilConstraint[] {
  if (!test) return [];
  const constraints: SoilConstraint[] = [];
  if (test.ph < 6 || test.ph > 7.5) constraints.push({ key: 'ph', level: 'attention', value: test.ph });
  if (test.om < 2) constraints.push({ key: 'om', level: 'attention', value: test.om });
  if (test.k < 0.3) constraints.push({ key: 'k', level: 'attention', value: test.k });
  if (test.p > 50) constraints.push({ key: 'p', level: 'attention', value: test.p });
  if (test.na > 0.5) constraints.push({ key: 'na', level: 'critical', value: test.na });
  return constraints;
}

function fieldScoutEntries(field: WorkbenchField, entries: ScoutEntry[]): ScoutEntry[] {
  const fieldName = normalizedName(field.name);
  return entries
    .filter(entry => normalizedName(entry.fieldName) === fieldName)
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function buildFieldWorkbenchSnapshot(
  field: WorkbenchField,
  soilTests: SoilTestEntry[],
  scoutEntries: ScoutEntry[],
  now = Date.now(),
): FieldWorkbenchSnapshot {
  const days = daysSincePlanting(field.plantingDate, now);
  const latestSoilTest = getLatestFieldSoilTest(field.name, soilTests);
  const soilConstraints = getSoilConstraints(latestSoilTest);
  const relatedScouting = fieldScoutEntries(field, scoutEntries);
  const activeScouting = relatedScouting.filter(entry => entry.status !== 'resolved');
  const criticalScouting = activeScouting.filter(entry => entry.severity === 'critical');
  const overdueScouting = activeScouting.filter(entry => Boolean(entry.followUpDate && entry.followUpDate < now));

  const organicMatterPct = latestSoilTest?.om ?? positiveNumber(field.soil.om, 2.5);
  const cec = latestSoilTest?.cec ?? positiveNumber(field.soil.cec, 15);
  const ph = latestSoilTest?.ph ?? positiveNumber(field.soil.ph, 6.5);
  const nutrientPlan = calculateNutrientBudget({
    cropId: field.crop,
    areaHa: positiveNumber(field.areaHa, 0),
    plantingDate: field.plantingDate,
    yieldAdjustmentPct: 100,
    organicMatterPct,
    cec,
    ph,
    soilPppm: latestSoilTest?.p ?? 25,
    soilKMeq: latestSoilTest?.k ?? 0.4,
    manureType: 'none',
    manureRateTHa: 0,
    incorporation: 'immediate',
    slopePct: 0,
    nearestWaterM: 100,
  });

  const priorities: WorkbenchPriority[] = [];
  if (overdueScouting.length) priorities.push({ id: 'overdue-follow-up', kind: 'overdue_follow_up', level: 'critical', count: overdueScouting.length });
  if (criticalScouting.length) priorities.push({ id: 'critical-observation', kind: 'critical_observation', level: 'critical', count: criticalScouting.length });
  for (const constraint of soilConstraints) priorities.push({ id: `soil-${constraint.key}`, kind: 'soil_constraint', level: constraint.level, constraint });
  if (nutrientPlan?.warnings.length) priorities.push({ id: 'nutrient-guardrail', kind: 'nutrient_guardrail', level: 'attention', count: nutrientPlan.warnings.length });

  return {
    field,
    daysSincePlanting: days,
    cropStage: getFieldCropStage(field.crop, days),
    irrigation: getFieldIrrigationDemand(field.crop, days),
    latestSoilTest,
    soilConstraints,
    scouting: {
      entries: relatedScouting,
      openCount: activeScouting.length,
      criticalCount: criticalScouting.length,
      overdueCount: overdueScouting.length,
      recent: relatedScouting.slice(0, 3),
    },
    nutrientPlan,
    priorities,
  };
}
