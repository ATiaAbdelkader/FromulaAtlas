import { getCropLifecycle, type FertilizationApplication } from '@/lib/crop-lifecycle';

export type NutrientKey = 'n' | 'p' | 'k';
export type IncorporationTiming = 'immediate' | 'hours12' | 'days1' | 'days7' | 'none';
export type ManureType = keyof typeof MANURE_SOURCES;
export type NutrientPlannerLanguage = 'en' | 'fr' | 'ar';

export interface NutrientAmounts {
  n: number;
  p: number;
  k: number;
}

export const MANURE_SOURCES = {
  dairy_solid: { name: 'Dairy solid', n: 10, p: 5, k: 10 },
  dairy_liquid: { name: 'Dairy liquid', n: 5, p: 2.5, k: 5 },
  beef_solid: { name: 'Beef solid', n: 11, p: 7, k: 12 },
  poultry: { name: 'Poultry layer', n: 30, p: 25, k: 15 },
  swine: { name: 'Swine liquid', n: 6, p: 3, k: 4 },
  composted: { name: 'Composted manure', n: 8, p: 6, k: 8 },
} as const;

export const N_AVAILABILITY: Record<IncorporationTiming, number> = {
  immediate: 0.4,
  hours12: 0.3,
  days1: 0.2,
  days7: 0.1,
  none: 0.05,
};

export interface NutrientBudgetInput {
  cropId: string;
  areaHa: number;
  plantingDate: string;
  yieldAdjustmentPct: number;
  organicMatterPct: number;
  cec: number;
  ph: number;
  soilPppm: number;
  soilKMeq: number;
  manureType: ManureType | 'none';
  manureRateTHa: number;
  incorporation: IncorporationTiming;
  slopePct: number;
  nearestWaterM: number;
}

export interface StagedApplication extends NutrientAmounts {
  day: number;
  date: string;
  stage: string;
  method: FertilizationApplication['method'];
  sources: FertilizationApplication['sources'];
  notes: string;
}

export interface NutrientBudgetPlan {
  cropName: string;
  cropEmoji: string;
  seasonLengthDays: number;
  target: NutrientAmounts;
  credits: NutrientAmounts;
  remaining: NutrientAmounts;
  totalRemaining: NutrientAmounts;
  soilNCredit: number;
  soilKCredit: number;
  manureCredit: NutrientAmounts;
  manureTotal: NutrientAmounts;
  manureNAvailabilityPct: number;
  applications: StagedApplication[];
  minBufferM: number;
  bufferCompliant: boolean;
  warnings: string[];
  guidance: {
    source: string[];
    rate: string[];
    time: string[];
    place: string[];
  };
}

const zero = (): NutrientAmounts => ({ n: 0, p: 0, k: 0 });

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function positive(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function addDays(date: string, days: number): string {
  const result = new Date(`${date}T12:00:00`);
  if (Number.isNaN(result.getTime())) return '—';
  result.setDate(result.getDate() + days);
  return result.toISOString().slice(0, 10);
}

function scaleNutrient(value: number, scale: number): number {
  return round(positive(value) * Math.max(0, scale));
}

/**
 * Creates a planning estimate only. Crop lifecycle totals are reusable defaults;
 * local laboratory results, product labels, weather and local regulations must
 * override this estimate before a field application is made.
 */
export function calculateNutrientBudget(input: NutrientBudgetInput, language: NutrientPlannerLanguage = 'en'): NutrientBudgetPlan | null {
  const crop = getCropLifecycle(input.cropId);
  if (!crop) return null;
  const tr = (english: string, arabic: string) => language === 'ar' ? arabic : english;

  const scale = Math.max(0, positive(input.yieldAdjustmentPct)) / 100;
  const areaHa = positive(input.areaHa);
  const target: NutrientAmounts = {
    n: scaleNutrient(crop.fertilization.totals.n, scale),
    p: scaleNutrient(crop.fertilization.totals.p, scale),
    k: scaleNutrient(crop.fertilization.totals.k, scale),
  };

  // Reuses the existing Season Plan planning credit: approximately 50 kg N/ha
  // per 1% soil organic matter at a 2% mineralization assumption.
  const soilNCredit = round(positive(input.organicMatterPct) * 50);
  // Reuses the existing Season Plan rough K credit for the top 30 cm of soil.
  const soilKCredit = round(positive(input.soilKMeq) * 350);

  const manureTotal = zero();
  const manureCredit = zero();
  let manureNAvailabilityPct = 0;
  if (input.manureType !== 'none') {
    const manure = MANURE_SOURCES[input.manureType];
    const rate = positive(input.manureRateTHa);
    manureTotal.n = round(rate * manure.n);
    manureTotal.p = round(rate * manure.p);
    manureTotal.k = round(rate * manure.k);
    manureNAvailabilityPct = N_AVAILABILITY[input.incorporation] * 100;
    manureCredit.n = round(manureTotal.n * N_AVAILABILITY[input.incorporation]);
    manureCredit.p = round(manureTotal.p * 0.6);
    manureCredit.k = round(manureTotal.k * 0.9);
  }

  const credits: NutrientAmounts = {
    n: round(soilNCredit + manureCredit.n),
    p: manureCredit.p,
    k: round(soilKCredit + manureCredit.k),
  };
  const remaining: NutrientAmounts = {
    n: round(Math.max(0, target.n - credits.n)),
    p: round(Math.max(0, target.p - credits.p)),
    k: round(Math.max(0, target.k - credits.k)),
  };
  const totalRemaining: NutrientAmounts = {
    n: round(remaining.n * areaHa),
    p: round(remaining.p * areaHa),
    k: round(remaining.k * areaHa),
  };

  const ratio = (nutrient: NutrientKey): number => {
    const denominator = target[nutrient];
    return denominator > 0 ? remaining[nutrient] / denominator : 0;
  };
  const applications: StagedApplication[] = crop.fertilization.applications.map(application => ({
    day: application.day,
    date: addDays(input.plantingDate, application.day),
    stage: application.stage,
    method: application.method,
    n: round(application.n * ratio('n')),
    p: round(application.p * ratio('p')),
    k: round(application.k * ratio('k')),
    sources: application.sources,
    notes: application.notes,
  })).filter(application => application.n > 0 || application.p > 0 || application.k > 0);

  const minBufferM = input.slopePct > 5 ? 30 : input.slopePct > 2 ? 20 : 10;
  const bufferCompliant = positive(input.nearestWaterM) >= minBufferM;
  const warnings: string[] = [];
  const source: string[] = [];
  const rate: string[] = [];
  const time: string[] = [];
  const place: string[] = [];

  source.push(tr('Match each nutrient gap with a tested material and use the crop-stage source list as the starting point.', 'طابق كل فجوة مغذيات مع مادة مُحلَّلة واستخدم قائمة مصادر مرحلة المحصول كنقطة بداية.'));
  if (input.manureType !== 'none') {
    source.push(tr('Credit only first-year available manure nutrients; test the material whenever a laboratory analysis is available.', 'احسب فقط مغذيات السماد المتاحة في السنة الأولى؛ وحلّل المادة كلما توفر تحليل مخبري.'));
  }
  if (input.ph < 5.5) {
    warnings.push(tr(`Soil pH ${input.ph.toFixed(1)} is acidic. Correct pH before relying on the nutrient plan.`, `الرقم الهيدروجيني للتربة ${input.ph.toFixed(1)} حمضي. صحح الرقم الهيدروجيني قبل الاعتماد على خطة المغذيات.`));
    source.push(tr('Prioritize liming and avoid assuming that fertilizer alone will overcome a strong pH constraint.', 'أعطِ الأولوية للتجيير ولا تفترض أن السماد وحده سيتغلب على قيد قوي في الرقم الهيدروجيني.'));
  } else if (input.ph > 7.8) {
    warnings.push(tr(`Soil pH ${input.ph.toFixed(1)} is alkaline. Confirm micronutrient availability and choose compatible sources.`, `الرقم الهيدروجيني للتربة ${input.ph.toFixed(1)} قلوي. تحقق من توافر المغذيات الصغرى واختر مصادر متوافقة.`));
    source.push(tr('Consider compatible or acidifying nutrient sources only with local agronomic guidance.', 'لا تستخدم مصادر مغذيات متوافقة أو مُحمِّضة إلا بتوجيه زراعي محلي.'));
  }
  if (input.organicMatterPct < 1.5) {
    warnings.push(tr(`Soil organic matter ${input.organicMatterPct.toFixed(1)}% is low; the mineralizable-N credit may be limited.`, `المادة العضوية في التربة ${input.organicMatterPct.toFixed(1)}% منخفضة؛ وقد يكون ائتمان النيتروجين القابل للتمعدن محدوداً.`));
  }
  if (input.soilPppm > 50) {
    warnings.push(tr(`Soil P ${input.soilPppm.toFixed(0)} ppm is high. Confirm the need for any additional P before applying it.`, `فسفور التربة ${input.soilPppm.toFixed(0)} جزء في المليون مرتفع. أكد الحاجة إلى أي فسفور إضافي قبل تطبيقه.`));
  }
  if (input.soilKMeq < 0.3) {
    warnings.push(tr(`Soil K ${input.soilKMeq.toFixed(2)} meq/100g is low. Protect early-season K supply and validate the soil credit.`, `بوتاسيوم التربة ${input.soilKMeq.toFixed(2)} meq/100g منخفض. احمِ إمداد البوتاسيوم في بداية الموسم وتحقق من ائتمان التربة.`));
  }

  rate.push(tr('The crop target is scaled from the selected crop lifecycle by the yield-target percentage.', 'يُضبط هدف المحصول من دورة حياة المحصول المختارة بحسب نسبة هدف الإنتاجية.'));
  rate.push(tr('Credits are planning estimates: soil organic matter contributes to N, soil-test K contributes to K, and manure availability depends on incorporation timing.', 'الائتمانات تقديرات تخطيطية: تساهم المادة العضوية في N، ويساهم K في تحليل التربة في K، ويعتمد توفر السماد على توقيت الدمج.'));
  if (remaining.n === 0 && remaining.p === 0 && remaining.k === 0) {
    rate.push(tr('Current planning credits meet or exceed the default crop nutrient target; verify against a current soil and material analysis before reducing fertilizer to zero.', 'تلبي الائتمانات التخطيطية الحالية هدف مغذيات المحصول الافتراضي أو تتجاوزه؛ تحقق من تحليل تربة ومادة حديث قبل خفض السماد إلى الصفر.'));
  }

  time.push(tr('Use the staged schedule to place nutrients near crop demand; reassess if crop condition, source analysis, or weather changes.', 'استخدم الجدول المرحلي لوضع المغذيات قرب طلب المحصول؛ وأعد التقييم إذا تغيرت حالة المحصول أو تحليل المصدر أو الطقس.'));
  if (input.cec < 5) {
    warnings.push(tr(`Soil CEC ${input.cec.toFixed(1)} is low. Use smaller, more frequent applications to reduce loss risk.`, `السعة التبادلية الكاتيونية للتربة ${input.cec.toFixed(1)} منخفضة. استخدم تطبيقات أصغر وأكثر تكراراً لتقليل خطر الفقد.`));
    time.push(tr('Low CEC favors split applications rather than a single large dose.', 'انخفاض السعة التبادلية الكاتيونية يفضّل التطبيقات المقسمة بدلاً من جرعة واحدة كبيرة.'));
  } else {
    time.push(tr('Maintain the crop lifecycle timing and split nitrogen across active demand stages.', 'حافظ على توقيت دورة حياة المحصول وقسّم النيتروجين عبر مراحل الطلب النشط.'));
  }
  time.push(tr('Do not apply immediately before a major rainfall event; reassess the plan after a material or field-condition change.', 'لا تطبق مباشرة قبل حدث هطول كبير؛ وأعد تقييم الخطة بعد تغيير المادة أو حالة الحقل.'));

  place.push(tr('Follow the stage-specific placement method shown in the schedule and keep nutrients in the root zone where practical.', 'اتبع طريقة الوضع الخاصة بالمرحلة الظاهرة في الجدول وأبقِ المغذيات في منطقة الجذور قدر الإمكان.'));
  if (input.manureType !== 'none') {
    place.push(tr(`The minimum planning buffer is ${minBufferM} m based on the entered slope. ${bufferCompliant ? 'The entered waterway distance meets this planner check.' : 'The entered waterway distance does not meet this planner check; do not apply until the setback is addressed.'}`, `الحد الأدنى التخطيطي لمنطقة العزل هو ${minBufferM} م بناءً على الانحدار المُدخل. ${bufferCompliant ? 'تفي مسافة المجرى المائي المُدخلة بفحص المخطط.' : 'لا تفي مسافة المجرى المائي المُدخلة بفحص المخطط؛ لا تطبق حتى معالجة مسافة الارتداد.'}`));
  }
  if (input.slopePct > 5) {
    warnings.push(tr(`Field slope ${input.slopePct.toFixed(1)}% increases runoff risk. Avoid surface application before rainfall and protect the waterway setback.`, `انحدار الحقل ${input.slopePct.toFixed(1)}% يزيد خطر الجريان السطحي. تجنب التطبيق السطحي قبل المطر واحمِ مسافة الارتداد عن المجرى المائي.`));
  }
  if (!bufferCompliant && input.manureType !== 'none') {
    warnings.push(tr(`Nearest waterway distance ${input.nearestWaterM.toFixed(0)} m is below the ${minBufferM} m planning buffer for the entered slope.`, `مسافة أقرب مجرى مائي ${input.nearestWaterM.toFixed(0)} م أقل من منطقة العزل التخطيطية ${minBufferM} م للانحدار المُدخل.`));
  }

  return {
    cropName: crop.name,
    cropEmoji: crop.emoji,
    seasonLengthDays: crop.seasonLength,
    target,
    credits,
    remaining,
    totalRemaining,
    soilNCredit,
    soilKCredit,
    manureCredit,
    manureTotal,
    manureNAvailabilityPct,
    applications,
    minBufferM,
    bufferCompliant,
    warnings,
    guidance: { source, rate, time, place },
  };
}

export function methodLabel(method: FertilizationApplication['method']): string {
  return method.replace(/_/g, ' ');
}

export function nutrientTotal(amounts: NutrientAmounts): number {
  return round(amounts.n + amounts.p + amounts.k);
}
