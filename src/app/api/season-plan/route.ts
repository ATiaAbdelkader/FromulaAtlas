import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface SeasonPlanInput {
  crop: string;
  plantingDate: string;
  fieldAreaHa: number;
  soil: { ph: number; om: number; cec: number; ca: number; mg: number; k: number; texture: string };
  water: { ph: number; ec: number; hco3: number; hardness: string };
  targetYield: string;
}

interface WeekPlan {
  week: number;
  stage: 'establishment' | 'vegetative' | 'flowering' | 'filling' | 'maturation';
  kc: number;
  n: number;
  p: number;
  k: number;
  irrigation: number;
  fertigation: string;
  notes: string;
}

interface SeasonPlan {
  crop: string;
  plantingDate: string;
  fieldAreaHa: number;
  targetYield: string;
  totalSeason: { n: number; p: number; k: number; irrigationM3: number };
  weeks: WeekPlan[];
  warnings: string[];
  aiSummary: string;
}

// ---- Crop-specific extraction coefficients (kg nutrient per tonne of produce) ----
// Sources: FAO statistical bulletins, Marschner (2012), IPNI crop nutrient removal database
interface CropParams {
  seasonLengthWeeks: number;  // actual crop length; trailing weeks become fallow
  stages: { establishment: number; vegetative: number; flowering: number; filling: number; maturation: number };  // weeks per stage (sum should = seasonLengthWeeks)
  kc: { initial: number; mid: number; late: number };
  extraction: { n: number; p: number; k: number };  // kg per tonne of target yield
  // N distribution pattern (fraction of total N per stage, must sum to 1)
  distribution: { establishment: number; vegetative: number; flowering: number; filling: number; maturation: number };
}

const CROP_PARAMS: Record<string, CropParams> = {
  tomato:      { seasonLengthWeeks: 30, stages: { establishment: 3, vegetative: 7, flowering: 5, filling: 10, maturation: 5 }, kc: { initial: 0.6, mid: 1.15, late: 0.8 }, extraction: { n: 2.5, p: 0.4, k: 4.0 }, distribution: { establishment: 0.05, vegetative: 0.30, flowering: 0.20, filling: 0.35, maturation: 0.10 } },
  strawberry:  { seasonLengthWeeks: 36, stages: { establishment: 4, vegetative: 6, flowering: 6, filling: 14, maturation: 6 }, kc: { initial: 0.4, mid: 0.85, late: 0.7 }, extraction: { n: 3.0, p: 0.5, k: 4.5 }, distribution: { establishment: 0.05, vegetative: 0.25, flowering: 0.20, filling: 0.40, maturation: 0.10 } },
  avocado:     { seasonLengthWeeks: 52, stages: { establishment: 4, vegetative: 12, flowering: 6, filling: 22, maturation: 8 }, kc: { initial: 0.5, mid: 0.85, late: 0.7 }, extraction: { n: 4.0, p: 0.6, k: 6.0 }, distribution: { establishment: 0.04, vegetative: 0.25, flowering: 0.16, filling: 0.45, maturation: 0.10 } },
  blueberry:   { seasonLengthWeeks: 40, stages: { establishment: 3, vegetative: 8, flowering: 5, filling: 16, maturation: 8 }, kc: { initial: 0.4, mid: 0.85, late: 0.65 }, extraction: { n: 4.5, p: 0.5, k: 3.5 }, distribution: { establishment: 0.05, vegetative: 0.25, flowering: 0.20, filling: 0.40, maturation: 0.10 } },
  lettuce:     { seasonLengthWeeks: 12, stages: { establishment: 2, vegetative: 5, flowering: 2, filling: 2, maturation: 1 }, kc: { initial: 0.4, mid: 1.0, late: 0.9 }, extraction: { n: 2.0, p: 0.3, k: 3.0 }, distribution: { establishment: 0.05, vegetative: 0.50, flowering: 0.15, filling: 0.25, maturation: 0.05 } },
  pepper:      { seasonLengthWeeks: 30, stages: { establishment: 4, vegetative: 7, flowering: 5, filling: 10, maturation: 4 }, kc: { initial: 0.6, mid: 1.05, late: 0.85 }, extraction: { n: 2.8, p: 0.4, k: 3.8 }, distribution: { establishment: 0.05, vegetative: 0.28, flowering: 0.20, filling: 0.37, maturation: 0.10 } },
  cucumber:    { seasonLengthWeeks: 24, stages: { establishment: 3, vegetative: 5, flowering: 4, filling: 8, maturation: 4 }, kc: { initial: 0.6, mid: 1.0, late: 0.85 }, extraction: { n: 2.2, p: 0.4, k: 3.5 }, distribution: { establishment: 0.05, vegetative: 0.30, flowering: 0.20, filling: 0.35, maturation: 0.10 } },
  citrus:      { seasonLengthWeeks: 52, stages: { establishment: 2, vegetative: 10, flowering: 6, filling: 24, maturation: 10 }, kc: { initial: 0.7, mid: 0.9, late: 0.75 }, extraction: { n: 1.8, p: 0.3, k: 2.8 }, distribution: { establishment: 0.03, vegetative: 0.25, flowering: 0.15, filling: 0.45, maturation: 0.12 } },
  coffee:      { seasonLengthWeeks: 52, stages: { establishment: 4, vegetative: 14, flowering: 4, filling: 22, maturation: 8 }, kc: { initial: 0.9, mid: 1.05, late: 0.95 }, extraction: { n: 12.0, p: 1.5, k: 12.0 }, distribution: { establishment: 0.04, vegetative: 0.30, flowering: 0.10, filling: 0.45, maturation: 0.11 } },
  maize:       { seasonLengthWeeks: 22, stages: { establishment: 3, vegetative: 7, flowering: 3, filling: 6, maturation: 3 }, kc: { initial: 0.3, mid: 1.15, late: 0.5 }, extraction: { n: 18.0, p: 3.0, k: 4.0 }, distribution: { establishment: 0.04, vegetative: 0.30, flowering: 0.16, filling: 0.40, maturation: 0.10 } },
  default:     { seasonLengthWeeks: 28, stages: { establishment: 3, vegetative: 7, flowering: 5, filling: 9, maturation: 4 }, kc: { initial: 0.5, mid: 1.0, late: 0.75 }, extraction: { n: 3.0, p: 0.5, k: 4.0 }, distribution: { establishment: 0.05, vegetative: 0.28, flowering: 0.18, filling: 0.39, maturation: 0.10 } },
};

function getCropParams(crop: string): CropParams {
  const lower = crop.toLowerCase().trim();
  for (const [key, params] of Object.entries(CROP_PARAMS)) {
    if (key === 'default') continue;
    if (lower.includes(key) || key.includes(lower)) return params;
  }
  return CROP_PARAMS.default;
}

function parseTargetYieldTonnes(targetYield: string): number {
  const m = targetYield.match(/([\d.]+)/);
  if (!m) return 50; // default 50 t/ha
  const n = parseFloat(m[1]);
  if (/kg|kilo/i.test(targetYield)) return n / 1000;
  if (/t|ton|tonne/i.test(targetYield)) return n;
  return n; // assume tonnes if no unit
}

// Linear Kc interpolation across weeks
function weeklyKc(week: number, totalWeeks: number, kc: CropParams['kc']): number {
  const ratio = week / totalWeeks;
  if (ratio < 0.15) return kc.initial + (kc.mid - kc.initial) * (ratio / 0.15) * 0.5; // ease up
  if (ratio < 0.4) return kc.initial + (kc.mid - kc.initial) * ((ratio - 0.15) / 0.25);
  if (ratio < 0.75) return kc.mid;
  return kc.mid + (kc.late - kc.mid) * ((ratio - 0.75) / 0.25);
}

function stageForWeek(week: number, stages: CropParams['stages'], seasonLength: number): WeekPlan['stage'] {
  if (week > seasonLength) return 'maturation';
  const cum = [stages.establishment, stages.establishment + stages.vegetative, stages.establishment + stages.vegetative + stages.flowering, stages.establishment + stages.vegetative + stages.flowering + stages.filling, seasonLength];
  if (week <= cum[0]) return 'establishment';
  if (week <= cum[1]) return 'vegetative';
  if (week <= cum[2]) return 'flowering';
  if (week <= cum[3]) return 'filling';
  return 'maturation';
}

function buildWarnings(input: SeasonPlanInput, params: CropParams): string[] {
  const w: string[] = [];
  if (input.soil.ph < 5.5) w.push(`Soil pH ${input.soil.ph} is too acidic — apply lime before planting`);
  if (input.soil.ph > 7.8) w.push(`Soil pH ${input.soil.ph} is too alkaline — consider sulfur amendment or acidifying fertigation`);
  if (input.soil.om < 1.5) w.push(`Soil OM ${input.soil.om}% is low — apply compost or organic amendment`);
  if (input.soil.k < 0.3) w.push(`Soil K ${input.soil.k} meq/100g is low — increase early K supply`);
  if (input.water.hco3 > 2) w.push(`Water HCO₃⁻ ${input.water.hco3} meq/L is high — acid injection recommended for fertigation`);
  if (input.water.ec > 1.5) w.push(`Water EC ${input.water.ec} dS/m is high — reduce fertilizer rates ~10% and increase leaching fraction`);
  const caMgRatio = input.soil.mg > 0 ? input.soil.ca / input.soil.mg : 0;
  if (caMgRatio > 0 && (caMgRatio < 3 || caMgRatio > 8)) w.push(`Ca/Mg ratio ${caMgRatio.toFixed(1)} is outside the 3-8 ideal range`);
  if (input.soil.cec < 5) w.push(`Soil CEC ${input.soil.cec} is low — split fertilizer applications more frequently`);
  return w;
}

function buildWeekPlan(input: SeasonPlanInput, params: CropParams): { weeks: WeekPlan[]; totalSeason: SeasonPlan['totalSeason']; warnings: string[] } {
  const weeks: WeekPlan[] = [];
  const targetTonnes = parseTargetYieldTonnes(input.targetYield);
  const totalN = params.extraction.n * targetTonnes;
  const totalP = params.extraction.p * targetTonnes;
  const totalK = params.extraction.k * targetTonnes;
  // Soil K credit (rough): 0.3 meq/100g K ≈ 100 kg K/ha available in top 30 cm
  const soilKCredit = Math.max(0, input.soil.k) * 350;
  const adjTotalK = Math.max(0, totalK - soilKCredit);
  // Mineralizable N credit: ~50 kg N/ha per 1% OM at T_min 2%
  const soilNCredit = input.soil.om * 50;
  const adjTotalN = Math.max(0, totalN - soilNCredit);

  const totalSeason = { n: 0, p: 0, k: 0, irrigationM3: 0 };
  const stageTotals: Record<string, number> = { establishment: 0, vegetative: 0, flowering: 0, filling: 0, maturation: 0 };
  for (const s of ['establishment', 'vegetative', 'flowering', 'filling', 'maturation']) {
    stageTotals[s] = params.stages[s as keyof typeof params.stages];
  }

  // Typical ETo by stage (mm/day) — varies by climate; assume temperate
  const etoByStage: Record<WeekPlan['stage'], number> = {
    establishment: 2.5, vegetative: 4.0, flowering: 4.5, filling: 5.0, maturation: 3.5,
  };

  // Fertigation recipes by stage (simple generic recipes)
  const fertByStage: Record<WeekPlan['stage'], string> = {
    establishment: '10-30-10 starter @ 0.5 kg/m³, 1-2 irrigations/wk',
    vegetative:    '20-10-20 grow @ 1.0 kg/m³, 2-3 irrigations/wk',
    flowering:     '15-15-30 bloom @ 1.2 kg/m³, 2-3 irrigations/wk',
    filling:       '12-4-26 finish @ 1.3 kg/m³, 3 irrigations/wk',
    maturation:    '— (water only or low-rate finish)',
  };

  const notesByStage: Record<WeekPlan['stage'], string> = {
    establishment: 'Planting, emergence, root establishment — protect from stress',
    vegetative:    'Canopy expansion, support installation, monitor N & K uptake',
    flowering:     'Flowering, pollination, critical P and micronutrient window',
    filling:       'Fruit/grain fill — peak K and water demand, watch for Ca transport',
    maturation:    'Dry-down, reduce N, mild stress improves quality',
  };

  for (let w = 1; w <= 52; w++) {
    const stage = stageForWeek(w, params.stages, params.seasonLengthWeeks);
    const isFallow = w > params.seasonLengthWeeks;
    const kc = weeklyKc(w, params.seasonLengthWeeks, params.kc);
    const eto = etoByStage[stage];
    const etcMm = kc * eto;  // mm/day
    const irrigationMmPerWeek = etcMm * 7 * 0.9;  // 90% of ETc (assume 10% rain or savings)
    const irrigationM3 = Math.round(irrigationMmPerWeek * 10);  // 1 mm × 1 ha = 10 m³

    // Distribute nutrients by stage fraction
    const stageFrac = params.distribution[stage];
    const stageWeeks = stageTotals[stage] || 1;
    const weeklyN = (adjTotalN * stageFrac) / stageWeeks;
    const weeklyP = (totalP * stageFrac) / stageWeeks;
    const weeklyK = (adjTotalK * stageFrac) / stageWeeks;

    const weekPlan: WeekPlan = {
      week: w,
      stage,
      kc: Math.round(kc * 100) / 100,
      n: isFallow ? 0 : Math.round(weeklyN * 10) / 10,
      p: isFallow ? 0 : Math.round(weeklyP * 10) / 10,
      k: isFallow ? 0 : Math.round(weeklyK * 10) / 10,
      irrigation: isFallow ? 0 : irrigationM3,
      fertigation: isFallow ? '— (fallow / cover crop)' : fertByStage[stage],
      notes: isFallow ? `Crop harvested week ${params.seasonLengthWeeks} — fallow or cover crop` : notesByStage[stage],
    };

    weeks.push(weekPlan);
    totalSeason.n += weekPlan.n;
    totalSeason.p += weekPlan.p;
    totalSeason.k += weekPlan.k;
    totalSeason.irrigationM3 += weekPlan.irrigation;
  }

  totalSeason.n = Math.round(totalSeason.n * 10) / 10;
  totalSeason.p = Math.round(totalSeason.p * 10) / 10;
  totalSeason.k = Math.round(totalSeason.k * 10) / 10;
  totalSeason.irrigationM3 = Math.round(totalSeason.irrigationM3);

  return { weeks, totalSeason, warnings: buildWarnings(input, params) };
}

async function generateAiSummary(input: SeasonPlanInput, params: CropParams, plan: { totalSeason: SeasonPlan['totalSeason']; warnings: string[] }): Promise<string> {
  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are NutriPlant PRO\'s Season Plan Generator. Write a concise 3-4 sentence executive summary of the generated season plan for the grower. Cover: (1) total NPK and irrigation demand, (2) the most critical management weeks, (3) any soil/water quality warnings. Plain text, no markdown, no headers, max 600 characters.',
        },
        {
          role: 'user',
          content: `Crop: ${input.crop} (${params.seasonLengthWeeks}-week season). Target yield: ${input.targetYield}. Soil: pH ${input.soil.ph}, OM ${input.soil.om}%, CEC ${input.soil.cec}, texture ${input.soil.texture}. Water: EC ${input.water.ec}, HCO₃⁻ ${input.water.hco3}. Total seasonal demand: ${plan.totalSeason.n} kg N/ha, ${plan.totalSeason.p} kg P/ha, ${plan.totalSeason.k} kg K/ha, ${plan.totalSeason.irrigationM3} m³/ha irrigation. Warnings: ${plan.warnings.length ? plan.warnings.join('; ') : 'none'}.`,
        },
      ],
      thinking: { type: 'disabled' },
    });
    return completion.choices[0]?.message?.content?.trim() || '';
  } catch {
    return '';
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<SeasonPlanInput>;

    if (!body || !body.crop || !body.plantingDate) {
      return NextResponse.json(
        { error: 'crop and plantingDate are required' },
        { status: 400 },
      );
    }
    if (!body.soil || !body.water) {
      return NextResponse.json(
        { error: 'soil and water summaries are required' },
        { status: 400 },
      );
    }

    const input: SeasonPlanInput = {
      crop: String(body.crop),
      plantingDate: String(body.plantingDate),
      fieldAreaHa: Number(body.fieldAreaHa) || 1,
      targetYield: String(body.targetYield ?? ''),
      soil: {
        ph: Number(body.soil.ph) || 0,
        om: Number(body.soil.om) || 0,
        cec: Number(body.soil.cec) || 0,
        ca: Number(body.soil.ca) || 0,
        mg: Number(body.soil.mg) || 0,
        k: Number(body.soil.k) || 0,
        texture: String(body.soil.texture ?? ''),
      },
      water: {
        ph: Number(body.water.ph) || 0,
        ec: Number(body.water.ec) || 0,
        hco3: Number(body.water.hco3) || 0,
        hardness: String(body.water.hardness ?? ''),
      },
    };

    const params = getCropParams(input.crop);
    const { weeks, totalSeason, warnings } = buildWeekPlan(input, params);
    const aiSummary = await generateAiSummary(input, params, { totalSeason, warnings });

    const plan: SeasonPlan = {
      crop: input.crop,
      plantingDate: input.plantingDate,
      fieldAreaHa: input.fieldAreaHa,
      targetYield: input.targetYield,
      totalSeason,
      weeks,
      warnings,
      aiSummary,
    };

    return NextResponse.json(plan);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Season plan error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'NutriPlant PRO Season Plan Generator',
    description: 'Generates a 52-week agronomic plan (NPK + irrigation + fertigation + notes) using deterministic agronomic formulas + AI executive summary.',
    endpoint: 'POST /api/season-plan',
    body: {
      crop: 'string (tomato, strawberry, avocado, blueberry, lettuce, pepper, cucumber, citrus, coffee, maize, or any)',
      plantingDate: 'ISO date',
      fieldAreaHa: 'number',
      soil: { ph: 'number', om: 'number', cec: 'number', ca: 'number', mg: 'number', k: 'number', texture: 'string' },
      water: { ph: 'number', ec: 'number', hco3: 'number', hardness: 'string' },
      targetYield: 'string (e.g. "80 t/ha")',
    },
    response: '{ crop, plantingDate, fieldAreaHa, targetYield, totalSeason, weeks: [{ week, stage, kc, n, p, k, irrigation, fertigation, notes }], warnings, aiSummary }',
    supportedCrops: Object.keys(CROP_PARAMS).filter(k => k !== 'default'),
  });
}
