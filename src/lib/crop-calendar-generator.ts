/**
 * Crop Calendar Generator — combines ALL data sources into a unified
 * week-by-week farm calendar.
 *
 * Pulls from:
 *   - src/lib/crop-lifecycle.ts (20 crops × stages + fertilization + labor)
 *   - src/lib/algeria-phyto-data.ts (INPV 2017 diseases/pests/weeds per crop)
 *   - src/lib/crop-lifecycle.ts (kcForDay for irrigation scheduling)
 *   - Seed rate calculator (target population)
 *
 * Output: CalendarEntry[] — one row per week with:
 *   - Growth stage + Kc
 *   - Labor operations (planting, fertilizing, scouting, harvesting…)
 *   - Fertilization applications (NPK + micros + source materials)
 *   - Irrigation recommendation (ETc = Kc × ET₀ × area)
 *   - Disease/pest/weed risks + recommended active matters
 *   - Seed rate (week 0)
 */

import {
  CROP_LIFECYCLES, getCropLifecycle, stageForDay,
  type CropLifecycle, type LaborOperation, type FertilizationApplication,
} from './crop-lifecycle';
import {
  PLANT_PROBLEMS, ALGERIAN_ACTIVE_MATTERS, ACTIVE_MATTER_BY_ID,
  type PlantProblem, type ActiveMatter,
} from './algeria-phyto-data';

// ============================================================================
// Kc interpolation for CropLifecycle (mirrors open-meteo.ts kcForDay but for
// CropLifecycle stages instead of CropKc presets)
// ============================================================================

function kcForDay(crop: CropLifecycle, dayOfSeason: number): number {
  const [init, dev, mid, late] = crop.stages;
  // Find stage boundaries
  let initEnd = 0, devEnd = 0, midEnd = 0;
  for (const s of crop.stages) {
    if (s.name === init?.name || s.startDay <= (init?.endDay ?? 0)) initEnd = s.endDay;
  }
  // Use stage startDay/endDay directly
  const stages = crop.stages;
  if (dayOfSeason <= stages[0].endDay) return stages[0].kc;
  for (let i = 1; i < stages.length; i++) {
    if (dayOfSeason <= stages[i].endDay) {
      // Interpolate between previous and current stage Kc
      const prev = stages[i - 1];
      const curr = stages[i];
      const t = (dayOfSeason - prev.endDay) / Math.max(1, curr.endDay - prev.endDay);
      return prev.kc + t * (curr.kc - prev.kc);
    }
  }
  return stages[stages.length - 1].kc;
}

// ============================================================================
// Types
// ============================================================================

export interface CalendarEntry {
  week: number;
  dayRange: string;           // "Day 1-7"
  date?: string;              // computed from planting date
  stage: string;
  stageEmoji: string;
  kc: number;
  /** Labor operations for this week */
  labor: LaborOperation[];
  /** Fertilization applications due this week */
  fertilization: FertilizationApplication[];
  /** Irrigation recommendation (mm/week) */
  irrigation: {
    etc: number;              // crop ET (mm/week)
    note: string;
  };
  /** Disease/pest/weed risks active at this stage */
  risks: PlantRisk[];
  /** Key milestone (if any) */
  milestone?: string;
}

export interface PlantRisk {
  problem: PlantProblem;
  recommendedActives: ActiveMatter[];
  type: 'disease' | 'pest' | 'weed';
}

export interface CropCalendarResult {
  crop: CropLifecycle;
  plantingDate: string;
  area: number;
  irrigationSystem: string;
  irrigationEfficiency: number;
  seedRate: {
    kgPerHa: number;
    plantsPerM2: number;
    plantSpacing: number;      // cm
    rowSpacing: number;        // cm
  };
  totalSeason: {
    n: number; p: number; k: number;
    irrigationM3: number;
    laborDays: number;
    riskCount: number;
  };
  weeks: CalendarEntry[];
}

// ============================================================================
// Irrigation system defaults
// ============================================================================

const IRRIGATION_SYSTEMS: Record<string, { efficiency: number; label: string }> = {
  drip: { efficiency: 0.90, label: 'Drip (goutte-à-goutte)' },
  sprinkler: { efficiency: 0.75, label: 'Sprinkler (aspersion)' },
  furrow: { efficiency: 0.60, label: 'Furrow (gravitaire)' },
  rainfed: { efficiency: 0.50, label: 'Rainfed + supplemental' },
};

export function getIrrigationSystems() {
  return Object.entries(IRRIGATION_SYSTEMS).map(([id, v]) => ({ id, ...v }));
}

// ============================================================================
// Seed rate computation (from SeedRateCalculator logic)
// ============================================================================

const CROP_SEEDS: Record<string, { tgw: number; germination: number; targetPop: number; rowSpacing: number }> = {
  maize: { tgw: 300, germination: 92, targetPop: 8, rowSpacing: 75 },
  wheat: { tgw: 40, germination: 90, targetPop: 400, rowSpacing: 15 },
  rice: { tgw: 25, germination: 88, targetPop: 500, rowSpacing: 20 },
  soybean: { tgw: 180, germination: 90, targetPop: 40, rowSpacing: 45 },
  barley: { tgw: 42, germination: 90, targetPop: 350, rowSpacing: 15 },
  sorghum: { tgw: 12, germination: 88, targetPop: 25, rowSpacing: 60 },
  canola: { tgw: 4, germination: 90, targetPop: 80, rowSpacing: 15 },
};

function computeSeedRate(cropId: string): { kgPerHa: number; plantsPerM2: number; plantSpacing: number; rowSpacing: number } {
  const c = CROP_SEEDS[cropId];
  if (!c) return { kgPerHa: 0, plantsPerM2: 0, plantSpacing: 0, rowSpacing: 0 };
  const fieldLoss = 0.10;
  const seedRate = c.targetPop * c.tgw / ((c.germination / 100) * (1 - fieldLoss) * 100);
  const effectivePop = c.targetPop * (c.germination / 100) * (1 - fieldLoss);
  const plantSpacing = 10000 / (c.targetPop * (c.rowSpacing / 100));
  return { kgPerHa: seedRate, plantsPerM2: effectivePop, plantSpacing, rowSpacing: c.rowSpacing };
}

// ============================================================================
// Risk mapping: find plant problems for this crop
// ============================================================================

function getRisksForCrop(cropId: string): PlantRisk[] {
  // Map our crop-lifecycle IDs to phyto-data crop IDs
  const cropMap: Record<string, string[]> = {
    maize: ['maize', 'corn'],
    wheat: ['wheat'],
    rice: ['rice'],
    soybean: ['soybean'],
    cotton: ['cotton'],
    tomato: ['tomato'],
    potato: ['potato'],
    onion: ['onion'],
    lettuce: ['lettuce'],
    'bell-pepper': ['pepper', 'bell-pepper'],
    cucumber: ['cucumber'],
    alfalfa: ['alfalfa'],
    sorghum: ['sorgho', 'sorghum'],
    barley: ['barley', 'wheat', 'oats'],
    canola: ['colza', 'canola'],
    coffee: ['coffee'],
    apple: ['apple', 'pommier'],
    citrus: ['citrus', 'agrumes'],
    sunflower: ['tournesol', 'sunflower'],
    grapes: ['vine', 'vigne', 'raisin'],
  };

  const cropNames = cropMap[cropId] || [cropId];
  const risks: PlantRisk[] = [];

  for (const p of PLANT_PROBLEMS) {
    const matches = p.crops.some(c => cropNames.includes(c));
    if (!matches) continue;

    const recommended: ActiveMatter[] = [];
    for (const activeId of p.actives.slice(0, 3)) {
      const m = ACTIVE_MATTER_BY_ID[activeId];
      if (m) recommended.push(m);
    }

    risks.push({
      problem: p,
      recommendedActives: recommended,
      type: p.type as 'disease' | 'pest' | 'weed',
    });
  }

  return risks;
}

/** Map risks to growth stages based on problem type + crop timing */
function risksForStage(risks: PlantRisk[], dayOfSeason: number, crop: CropLifecycle): PlantRisk[] {
  const stage = stageForDay(crop, dayOfSeason);
  if (!stage) return [];

  return risks.filter(r => {
    // Disease: most active during vegetative-flowering (high humidity)
    if (r.type === 'disease') {
      return stage.name === 'Vegetative' || stage.name === 'Flowering' ||
             stage.name === 'Fruit Set/Fill' || stage.name === 'Bloom' ||
             stage.name === 'Tuber Bulking' || stage.name === 'Grain Fill' ||
             stage.name === 'Reproductive' || stage.name === 'Berry Development' ||
             stage.name === 'Fruit Sizing';
    }
    // Pests: most active during vegetative + reproductive
    if (r.type === 'pest') {
      return stage.name !== 'Establishment' && stage.name !== 'Dormancy/Bud Break' &&
             stage.name !== 'Maturation' && stage.name !== 'Open Boll / Maturation' &&
             stage.name !== 'Curing' && stage.name !== 'Harvest' &&
             stage.name !== 'Harvest/Dormancy';
    }
    // Weeds: most critical during establishment + early vegetative
    if (r.type === 'weed') {
      return stage.name === 'Establishment' || stage.name === 'Vegetative' ||
             stage.name === 'Sprouting/Establishment' || stage.name === 'Emergence';
    }
    return false;
  });
}

// ============================================================================
// Main generator
// ============================================================================

export interface CalendarInput {
  cropId: string;
  plantingDate: string;       // YYYY-MM-DD
  area: number;               // hectares
  irrigationSystem: string;   // 'drip' | 'sprinkler' | 'furrow' | 'rainfed'
  avgET0?: number;            // average daily ET₀ (mm/day), default 5
}

export function generateCropCalendar(input: CalendarInput): CropCalendarResult | null {
  const crop = getCropLifecycle(input.cropId);
  if (!crop) return null;

  const efficiency = IRRIGATION_SYSTEMS[input.irrigationSystem]?.efficiency ?? 0.75;
  const avgET0 = input.avgET0 ?? 5; // mm/day default
  const allRisks = getRisksForCrop(input.cropId);
  const seedRate = computeSeedRate(input.cropId);

  const weeks: CalendarEntry[] = [];
  let totalN = 0, totalP = 0, totalK = 0, totalIrrM3 = 0, totalLaborDays = 0;

  const totalWeeks = Math.ceil(crop.seasonLength / 7);

  for (let week = 0; week < totalWeeks; week++) {
    const dayStart = week * 7 + 1;
    const dayEnd = Math.min((week + 1) * 7, crop.seasonLength);
    const midDay = Math.floor((dayStart + dayEnd) / 2);

    const stage = stageForDay(crop, midDay);
    if (!stage) continue;

    const kc = kcForDay(crop, midDay);

    // Date computation
    const plantingD = new Date(input.plantingDate + 'T00:00:00');
    const weekDate = new Date(plantingD);
    weekDate.setDate(weekDate.getDate() + dayStart - 1);
    const dateStr = weekDate.toISOString().slice(0, 10);

    // Labor operations this week (within ±3 days of midDay)
    const labor = crop.labor.filter(op => {
      const diff = Math.abs(op.day - midDay);
      return diff <= 4;
    });

    // Fertilization applications this week
    const fertilization = crop.fertilization.applications.filter(app => {
      const diff = Math.abs(app.day - midDay);
      return diff <= 4;
    });

    // Sum NPK
    for (const f of fertilization) {
      totalN += f.n * input.area;
      totalP += f.p * input.area;
      totalK += f.k * input.area;
    }

    // Irrigation: ETc = Kc × ET₀ × 7 days, gross = ETc / efficiency
    const etcDaily = kc * avgET0;
    const etcWeekly = etcDaily * 7;
    const grossWeekly = etcWeekly / efficiency;
    const irrigationM3 = grossWeekly * 10 * input.area; // mm × ha × 10 = m³
    totalIrrM3 += irrigationM3;

    // Labor days
    for (const op of labor) {
      totalLaborDays += op.laborDaysPerHa * input.area;
    }

    // Risks at this stage
    const stageRisks = risksForStage(allRisks, midDay, crop);

    // Milestone
    let milestone: string | undefined;
    if (week === 0) milestone = `🌱 Planting — ${seedRate.kgPerHa.toFixed(0)} kg seed/ha, ${seedRate.plantsPerM2.toFixed(0)} plants/m², ${seedRate.plantSpacing.toFixed(1)}cm × ${seedRate.rowSpacing}cm spacing`;
    if (stage.name === 'Flowering' || stage.name === 'Heading/Flowering' || stage.name === 'Bloom') milestone = '🌼 Flowering begins — critical period for pest/disease protection';
    if (stage.name === 'Harvest' || stage.name === 'Maturation' || stage.name === 'Maturation/Harvest' || stage.name === 'Open Boll / Maturation') milestone = '🌾 Harvest window — monitor maturity + moisture';

    weeks.push({
      week: week + 1,
      dayRange: `Day ${dayStart}-${dayEnd}`,
      date: dateStr,
      stage: stage.name,
      stageEmoji: stage.emoji,
      kc,
      labor,
      fertilization,
      irrigation: {
        etc: etcWeekly,
        note: irrigationM3 > 50 ? `Apply ~${irrigationM3.toFixed(0)} m³ (${grossWeekly.toFixed(1)} mm)` : irrigationM3 > 10 ? `Light irrigation ~${irrigationM3.toFixed(0)} m³` : 'Minimal irrigation needed',
      },
      risks: stageRisks,
      milestone,
    });
  }

  return {
    crop,
    plantingDate: input.plantingDate,
    area: input.area,
    irrigationSystem: IRRIGATION_SYSTEMS[input.irrigationSystem]?.label ?? input.irrigationSystem,
    irrigationEfficiency: efficiency,
    seedRate,
    totalSeason: {
      n: totalN,
      p: totalP,
      k: totalK,
      irrigationM3: totalIrrM3,
      laborDays: totalLaborDays,
      riskCount: allRisks.length,
    },
    weeks,
  };
}
