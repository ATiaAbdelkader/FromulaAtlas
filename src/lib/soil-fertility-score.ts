/**
 * Soil Fertility Score Engine
 *
 * Computes a weighted 0–100 fertility score from soil test parameters.
 * Each parameter is scored independently against agronomic optimum
 * ranges, then combined with configurable weights.
 *
 * Scoring bands per parameter:
 *   90–100  Optimal   — no action needed
 *   70–89   Good      — minor adjustment
 *   50–69   Moderate  — amendment recommended
 *   0–49    Poor      — significant amendment required
 *
 * Weights sum to 1.0. The final score is the weighted sum of all
 * parameter sub-scores.
 *
 * Reference ranges adapted from:
 *  - FAO Soils Bulletin 42 (Soil Testing for Crop Production)
 *  - WUR Nutrient Solutions for Greenhouse Crops v4 (2020)
 *  - Algerian CCLS fertilization guidelines
 *  - USDA NRCS Soil Quality Indicators
 */

import type { Language } from './language-store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SoilFertilityInput {
  ph?: number;
  organicMatterPct?: number;
  ecDsm?: number;
  nitrogenPpm?: number;       // available N (NO₃-N)
  phosphorusPpm?: number;     // Olsen P
  potassiumPpm?: number;      // exchangeable K
  calciumCmolKg?: number;     // exchangeable Ca
  magnesiumCmolKg?: number;   // exchangeable Mg
  cecCmolKg?: number;         // cation exchange capacity
  zincPpm?: number;
  ironPpm?: number;
  boronPpm?: number;
  copperPpm?: number;
  manganesePpm?: number;
  sodiumPct?: number;         // ESP (exchangeable sodium percentage)
}

export type ScoreBand = 'optimal' | 'good' | 'moderate' | 'poor';

export interface ParameterScore {
  name: string;
  nameAr: string;
  nameFr: string;
  value: number | null;
  unit: string;
  score: number;          // 0-100
  band: ScoreBand;
  weight: number;         // 0-1
  optimalRange: string;   // e.g. "6.0 – 7.5"
  recommendation: {
    en: string;
    ar: string;
    fr: string;
  };
  emoji: string;
}

export interface FertilityResult {
  totalScore: number;          // 0-100
  band: ScoreBand;
  grade: string;               // A, B, C, D
  parameters: ParameterScore[];
  summary: {
    en: string;
    ar: string;
    fr: string;
  };
  topIssues: string[];         // parameter names scoring < 60
  measured: number;            // count of measured (non-null) parameters
  total: number;               // total possible parameters
  confidence: 'high' | 'medium' | 'low';
}

// ---------------------------------------------------------------------------
// Scoring functions — each returns 0-100
// ---------------------------------------------------------------------------

function scorePh(ph: number): number {
  // Optimal: 6.0-7.5 (most crops)
  if (ph >= 6.0 && ph <= 7.5) return 100;
  if (ph >= 5.5 && ph <= 8.0) return 80;
  if (ph >= 5.0 && ph <= 8.5) return 55;
  if (ph >= 4.5 && ph <= 9.0) return 30;
  return 10;
}

function scoreOM(om: number): number {
  // Organic matter %
  if (om >= 3.0) return 100;
  if (om >= 2.0) return 85;
  if (om >= 1.5) return 65;
  if (om >= 1.0) return 45;
  if (om >= 0.5) return 25;
  return 10;
}

function scoreEC(ec: number): number {
  // EC dS/m — lower is better for most crops
  if (ec <= 2.0) return 100;
  if (ec <= 4.0) return 80;
  if (ec <= 8.0) return 55;
  if (ec <= 16.0) return 30;
  return 10;
}

function scoreN(n: number): number {
  // NO₃-N ppm
  if (n >= 25 && n <= 50) return 100;
  if (n >= 15 && n <= 70) return 80;
  if (n >= 10 && n <= 100) return 55;
  if (n >= 5) return 30;
  return 10;
}

function scoreP(p: number): number {
  // Olsen P ppm
  if (p >= 15 && p <= 40) return 100;
  if (p >= 10 && p <= 60) return 80;
  if (p >= 5 && p <= 80) return 55;
  if (p >= 3) return 30;
  return 10;
}

function scoreK(k: number): number {
  // Exchangeable K ppm
  if (k >= 150 && k <= 400) return 100;
  if (k >= 100 && k <= 600) return 80;
  if (k >= 60 && k <= 800) return 55;
  if (k >= 30) return 30;
  return 10;
}

function scoreCa(ca: number): number {
  // Ca cmol/kg
  if (ca >= 5 && ca <= 20) return 100;
  if (ca >= 3 && ca <= 30) return 80;
  if (ca >= 2) return 55;
  if (ca >= 1) return 30;
  return 10;
}

function scoreMg(mg: number): number {
  // Mg cmol/kg
  if (mg >= 1 && mg <= 8) return 100;
  if (mg >= 0.5 && mg <= 12) return 80;
  if (mg >= 0.3) return 55;
  if (mg >= 0.1) return 30;
  return 10;
}

function scoreCEC(cec: number): number {
  // CEC cmol/kg — higher = more nutrient-holding capacity
  if (cec >= 15) return 100;
  if (cec >= 10) return 85;
  if (cec >= 7) return 65;
  if (cec >= 5) return 45;
  if (cec >= 3) return 25;
  return 10;
}

function scoreZn(zn: number): number {
  // Zn ppm
  if (zn >= 1.0 && zn <= 5.0) return 100;
  if (zn >= 0.5 && zn <= 10.0) return 75;
  if (zn >= 0.3) return 50;
  return 20;
}

function scoreFe(fe: number): number {
  // Fe ppm
  if (fe >= 4.5 && fe <= 50) return 100;
  if (fe >= 2.5 && fe <= 100) return 75;
  if (fe >= 1.0) return 50;
  return 20;
}

function scoreB(b: number): number {
  // B ppm (hot water extractable)
  if (b >= 0.5 && b <= 2.0) return 100;
  if (b >= 0.3 && b <= 3.0) return 75;
  if (b >= 0.15) return 50;
  return 20;
}

function scoreCu(cu: number): number {
  // Cu ppm
  if (cu >= 0.5 && cu <= 3.0) return 100;
  if (cu >= 0.3 && cu <= 5.0) return 75;
  if (cu >= 0.1) return 50;
  return 20;
}

function scoreMn(mn: number): number {
  // Mn ppm
  if (mn >= 1.0 && mn <= 15.0) return 100;
  if (mn >= 0.5 && mn <= 30.0) return 75;
  if (mn >= 0.3) return 50;
  return 20;
}

function scoreESP(esp: number): number {
  // Exchangeable Sodium Percentage — lower is better
  if (esp <= 5) return 100;
  if (esp <= 10) return 80;
  if (esp <= 15) return 55;
  if (esp <= 25) return 30;
  return 10;
}

// ---------------------------------------------------------------------------
// Band helpers
// ---------------------------------------------------------------------------

function bandFromScore(score: number): ScoreBand {
  if (score >= 90) return 'optimal';
  if (score >= 70) return 'good';
  if (score >= 50) return 'moderate';
  return 'poor';
}

function gradeFromScore(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

// ---------------------------------------------------------------------------
// Main scoring function
// ---------------------------------------------------------------------------

interface ParamConfig {
  key: keyof SoilFertilityInput;
  name: string;
  nameAr: string;
  nameFr: string;
  unit: string;
  weight: number;
  optimalRange: string;
  scoreFn: (v: number) => number;
  emoji: string;
  recommendation: {
    optimal: { en: string; ar: string; fr: string };
    good: { en: string; ar: string; fr: string };
    moderate: { en: string; ar: string; fr: string };
    poor: { en: string; ar: string; fr: string };
  };
}

const PARAM_CONFIGS: ParamConfig[] = [
  {
    key: 'ph', name: 'pH', nameAr: 'الحموضة', nameFr: 'pH', unit: '', weight: 0.12,
    optimalRange: '6.0 – 7.5', scoreFn: scorePh, emoji: '🧪',
    recommendation: {
      optimal: { en: 'pH is in the optimal range for most crops.', ar: 'الحموضة في النطاق الأمثل لمعظم المحاصيل.', fr: 'pH optimal pour la plupart des cultures.' },
      good: { en: 'pH slightly outside ideal — monitor for nutrient lock-up.', ar: 'الحموضة خارج النطاق المثالي قليلاً — راكن احتباس المغذيات.', fr: 'pH légèrement hors plage — surveiller la fixation des nutriments.' },
      moderate: { en: 'Apply lime (if acidic) or sulfur/ gypsum (if alkaline) to adjust pH.', ar: 'أضف الجير (إذا كانت حمضية) أو الكبريت/الجبس (إذا كانت قلوية) لضبط الحموضة.', fr: 'Appliquer chaux (acide) ou soufre/gypse (alcalin) pour ajuster le pH.' },
      poor: { en: 'Critical pH — soil amendment urgently needed before planting.', ar: 'حموضة حرجة — تعديل التربة مطلوب بشكل عاجل قبل الزراعة.', fr: 'pH critique — amendement urgent avant plantation.' },
    },
  },
  {
    key: 'organicMatterPct', name: 'Organic Matter', nameAr: 'المادة العضوية', nameFr: 'Matière organique', unit: '%', weight: 0.12,
    optimalRange: '≥ 3.0%', scoreFn: scoreOM, emoji: '🌿',
    recommendation: {
      optimal: { en: 'Excellent organic matter — supports soil structure and microbial life.', ar: 'مادة عضوية ممتازة — تدعم بنية التربة والحياة الميكروبية.', fr: 'Matière organique excellente — soutient la structure et la vie microbienne.' },
      good: { en: 'Adequate OM — add compost or cover crops to maintain levels.', ar: 'مادة عضوية كافية — أضف الكمبوست أو محاصيل التغطية للحفاظ على المستويات.', fr: 'MO adéquate — ajouter compost ou cultures couvertes.' },
      moderate: { en: 'Low OM — apply 20–40 t/ha compost or manure annually.', ar: 'مادة عضوية منخفضة — أضف 20-40 طن/هكتار كمبوست أو روث سنوياً.', fr: 'MO faible — appliquer 20–40 t/ha compost ou fumier annuellement.' },
      poor: { en: 'Very low OM — intensive organic amendment program needed.', ar: 'مادة عضوية منخفضة جداً — برنامج مكثف للتعديل العضوي مطلوب.', fr: "MO très faible — programme intensif d'amendement organique requis." },
    },
  },
  {
    key: 'ecDsm', name: 'Salinity (EC)', nameAr: 'الملوحة (EC)', nameFr: 'Salinité (CE)', unit: 'dS/m', weight: 0.10,
    optimalRange: '≤ 2.0', scoreFn: scoreEC, emoji: '🧂',
    recommendation: {
      optimal: { en: 'No salinity concern — safe for all crops.', ar: 'لا توجد مشكلة ملوحة — آمن لجميع المحاصيل.', fr: 'Aucune salinité — sûr pour toutes les cultures.' },
      good: { en: 'Slight salinity — choose salt-tolerant varieties if sensitive.', ar: 'ملوحة طفيفة — اختر أصنافاً تتحمل الملح إذا كانت حساسة.', fr: 'Salinité légère — choisir des variétés tolérantes.' },
      moderate: { en: 'Moderate salinity — leach with excess irrigation water.', ar: 'ملوحة متوسطة — اغسل التربة بمياه ري زائدة.', fr: "Salinité modérée — lessiver avec excès d'eau." },
      poor: { en: 'High salinity — gypsum application + deep leaching required.', ar: 'ملوحة عالية — مطلوب جبس + غسيل عميق.', fr: 'Salinité élevée — gypse + lessivage profond requis.' },
    },
  },
  {
    key: 'nitrogenPpm', name: 'Nitrogen (N)', nameAr: 'الآزوت (N)', nameFr: 'Azote (N)', unit: 'ppm', weight: 0.08,
    optimalRange: '25 – 50', scoreFn: scoreN, emoji: '🌱',
    recommendation: {
      optimal: { en: 'Nitrogen levels optimal for crop growth.', ar: 'مستويات الآزوت مثالية لنمو المحصول.', fr: 'Azote optimal pour la croissance.' },
      good: { en: 'Nitrogen adequate — split-apply during the season.', ar: 'الآزوت كافٍ — قسّم التطبيق خلال الموسم.', fr: 'Azote adéquat — fractionner en cours de saison.' },
      moderate: { en: 'Low N — apply 60–100 kg N/ha in split doses.', ar: 'آزوت منخفض — أضف 60-100 كغ N/هكتار على دفعات.', fr: 'N faible — appliquer 60–100 kg N/ha fractionné.' },
      poor: { en: 'Nitrogen deficient — urgent N application needed.', ar: 'نقص الآزوت — تطبيق عاجل للآزوت مطلوب.', fr: 'Carence en azote — application urgente requise.' },
    },
  },
  {
    key: 'phosphorusPpm', name: 'Phosphorus (P)', nameAr: 'الفوسفور (P)', nameFr: 'Phosphore (P)', unit: 'ppm', weight: 0.08,
    optimalRange: '15 – 40', scoreFn: scoreP, emoji: '🟡',
    recommendation: {
      optimal: { en: 'Phosphorus optimal — no P fertilizer needed this season.', ar: 'الفوسفور مثالي — لا حاجة لسماد P هذا الموسم.', fr: 'Phosphore optimal — pas de fertilisation P nécessaire.' },
      good: { en: 'P adequate — apply starter P at planting only.', ar: 'P كافٍ — أضف P بسيط عند الزراعة فقط.', fr: 'P adéquat — appliquer P de démarrage uniquement.' },
      moderate: { en: 'Low P — apply 40–80 kg P₂O₅/ha banded near seed.', ar: 'P منخفض — أضف 40-80 كغ P₂O₅/هكتار بجانب البذور.', fr: 'P faible — appliquer 40–80 kg P₂O₅/ha localisé.' },
      poor: { en: 'Phosphorus deficient — broadcast + band P application.', ar: 'نقص الفوسفور — تطبيق P منتشر + موضعي.', fr: 'Carence en P — application en surface + localisée.' },
    },
  },
  {
    key: 'potassiumPpm', name: 'Potassium (K)', nameAr: 'البوتاسيوم (K)', nameFr: 'Potassium (K)', unit: 'ppm', weight: 0.08,
    optimalRange: '150 – 400', scoreFn: scoreK, emoji: '🟠',
    recommendation: {
      optimal: { en: 'Potassium optimal for crop quality and stress tolerance.', ar: 'البوتاسيوم مثالي لجودة المحصول وتحمل الإجهاد.', fr: 'Potassium optimal pour qualité et tolérance au stress.' },
      good: { en: 'K adequate — apply maintenance dose if high-yield.', ar: 'K كافٍ — أضف جرعة صيانة إذا كان المحصول عالياً.', fr: "K adéquat — dose d'entretien si rendement élevé." },
      moderate: { en: 'Low K — apply 80–150 kg K₂O/ha.', ar: 'K منخفض — أضف 80-150 كغ K₂O/هكتار.', fr: 'K faible — appliquer 80–150 kg K₂O/ha.' },
      poor: { en: 'Potassium deficient — urgent K application + foliar spray.', ar: 'نقص البوتاسيوم — تطبيق عاجل K + رش ورقي.', fr: 'Carence en K — application urgente + pulvérisation foliaire.' },
    },
  },
  {
    key: 'cecCmolKg', name: 'CEC', nameAr: 'سعة التبادل', nameFr: 'CEC', unit: 'cmol/kg', weight: 0.08,
    optimalRange: '≥ 15', scoreFn: scoreCEC, emoji: '🔋',
    recommendation: {
      optimal: { en: 'High CEC — excellent nutrient retention capacity.', ar: 'سعة تبادل عالية — قدرة ممتازة على الاحتفاظ بالمغذيات.', fr: 'CEC élevé — excellente rétention des nutriments.' },
      good: { en: 'Good CEC — soil holds nutrients well with split application.', ar: 'سعة تبادل جيدة — تحتفظ التربة بالمغذيات جيداً.', fr: 'CEC bon — bonne rétention avec apport fractionné.' },
      moderate: { en: 'Moderate CEC — use split fertilizer doses to prevent leaching.', ar: 'سعة تبادل متوسطة — استخدم جرعات سماد مقسمة لمنع الغسيل.', fr: 'CEC modéré — fractionner les apports pour éviter le lessivage.' },
      poor: { en: 'Low CEC — sandy soil; frequent small doses + organic matter.', ar: 'سعة تبادل منخفضة — تربة رملية؛ جرعات صغيرة متكررة + مادة عضوية.', fr: 'CEC faible — sol sableux; petits apports fréquents + MO.' },
    },
  },
  {
    key: 'calciumCmolKg', name: 'Calcium (Ca)', nameAr: 'الكالسيوم (Ca)', nameFr: 'Calcium (Ca)', unit: 'cmol/kg', weight: 0.06,
    optimalRange: '5 – 20', scoreFn: scoreCa, emoji: '🦴',
    recommendation: {
      optimal: { en: 'Calcium optimal — strong cell walls and fruit quality.', ar: 'الكالسيوم مثالي — جدران خلوية قوية وجودة ثمار جيدة.', fr: 'Calcium optimal — parois cellulaires et qualité fruit.' },
      good: { en: 'Ca adequate — monitor Ca:K ratio for balance.', ar: 'Ca كافٍ — راقب نسبة Ca:K للتوازن.', fr: 'Ca adéquat — surveiller le ratio Ca:K.' },
      moderate: { en: 'Low Ca — apply gypsum (CaSO₄) at 1–2 t/ha.', ar: 'Ca منخفض — أضف جبس (CaSO₄) بمعدل 1-2 طن/هكتار.', fr: 'Ca faible — appliquer gypse 1–2 t/ha.' },
      poor: { en: 'Calcium deficient — urgent gypsum + foliar Ca spray.', ar: 'نقص الكالسيوم — جبس عاجل + رش ورقي Ca.', fr: 'Carence en Ca — gypse urgent + pulvérisation foliaire.' },
    },
  },
  {
    key: 'magnesiumCmolKg', name: 'Magnesium (Mg)', nameAr: 'المغنيسيوم (Mg)', nameFr: 'Magnésium (Mg)', unit: 'cmol/kg', weight: 0.06,
    optimalRange: '1 – 8', scoreFn: scoreMg, emoji: '💚',
    recommendation: {
      optimal: { en: 'Magnesium optimal — chlorophyll and enzyme function healthy.', ar: 'المغنيسيوم مثالي — الكلوروفيل ووظائف الإنزيم صحية.', fr: 'Magnésium optimal — chlorophylle et enzymes sains.' },
      good: { en: 'Mg adequate — watch Ca:Mg ratio (ideal ~7:1).', ar: 'Mg كافٍ — راقب نسبة Ca:Mg (المثالي ~7:1).', fr: 'Mg adéquat — surveiller le ratio Ca:Mg (~7:1).' },
      moderate: { en: 'Low Mg — apply Epsom salt (MgSO₄) at 200–400 kg/ha.', ar: 'Mg منخفض — أضف ملح إبسوم (MgSO₄) بمعدل 200-400 كغ/هكتار.', fr: 'Mg faible — appliquer MgSO₄ 200–400 kg/ha.' },
      poor: { en: 'Magnesium deficient — foliar Mg spray + soil amendment.', ar: 'نقص المغنيسيوم — رش ورقي Mg + تعديل التربة.', fr: 'Carence en Mg — pulvérisation foliaire + amendement.' },
    },
  },
  {
    key: 'zincPpm', name: 'Zinc (Zn)', nameAr: 'الزنك (Zn)', nameFr: 'Zinc (Zn)', unit: 'ppm', weight: 0.05,
    optimalRange: '1.0 – 5.0', scoreFn: scoreZn, emoji: '⚪',
    recommendation: {
      optimal: { en: 'Zinc optimal — enzyme activity and auxin synthesis healthy.', ar: 'الزنك مثالي — نشاط الإنزيمات وتخليق الأوكسين صحي.', fr: 'Zinc optimal — enzymes et auxine sains.' },
      good: { en: 'Zn adequate — monitor if high-P soils lock up Zn.', ar: 'Zn كافٍ — راقب إذا كانت التربة عالية P تحبس Zn.', fr: 'Zn adéquat — surveiller fixation par P élevé.' },
      moderate: { en: 'Low Zn — apply 10–25 kg ZnSO₄/ha or foliar spray.', ar: 'Zn منخفض — أضف 10-25 كغ ZnSO₄/هكتار أو رش ورقي.', fr: 'Zn faible — appliquer 10–25 kg ZnSO₄/ha ou foliaire.' },
      poor: { en: 'Zinc deficient — foliar Zn spray immediately + soil Zn.', ar: 'نقص الزنك — رش ورقي Zn فوراً + Zn للتربة.', fr: 'Carence en Zn — pulvérisation foliaire immédiate + sol.' },
    },
  },
  {
    key: 'ironPpm', name: 'Iron (Fe)', nameAr: 'الحديد (Fe)', nameFr: 'Fer (Fe)', unit: 'ppm', weight: 0.05,
    optimalRange: '4.5 – 50', scoreFn: scoreFe, emoji: '🔴',
    recommendation: {
      optimal: { en: 'Iron optimal — chlorophyll synthesis healthy.', ar: 'الحديد مثالي — تخليق الكلوروفيل صحي.', fr: 'Fer optimal — synthèse chlorophyllienne saine.' },
      good: { en: 'Fe adequate — monitor pH; high pH locks up Fe.', ar: 'Fe كافٍ — راقب الحموضة؛ الحموضة العالية تحبس Fe.', fr: 'Fe adéquat — surveiller pH; pH élevé fixe le Fe.' },
      moderate: { en: 'Low Fe — apply Fe-EDDHA chelate (6%) at 2–5 kg/ha.', ar: 'Fe منخفض — أضف مخلب Fe-EDDHA (6%) بمعدل 2-5 كغ/هكتار.', fr: 'Fe faible — appliquer Fe-EDDHA 6% à 2–5 kg/ha.' },
      poor: { en: 'Iron deficient — Fe chelate foliar + soil application urgent.', ar: 'نقص الحديد — مخلب Fe ورقي + تطبيق أرضي عاجل.', fr: 'Carence en Fe — chélate foliaire + sol urgent.' },
    },
  },
  {
    key: 'boronPpm', name: 'Boron (B)', nameAr: 'البورون (B)', nameFr: 'Bore (B)', unit: 'ppm', weight: 0.04,
    optimalRange: '0.5 – 2.0', scoreFn: scoreB, emoji: '🟤',
    recommendation: {
      optimal: { en: 'Boron optimal — pollen viability and sugar transport healthy.', ar: 'البورون مثالي — صلاحية حبوب اللقاح ونقل السكر صحي.', fr: 'Bore optimal — pollen et transport de sucres sains.' },
      good: { en: 'B adequate — monitor in high-rainfall sandy soils.', ar: 'B كافٍ — راقب في التربة الرملية عالية الأمطار.', fr: 'B adéquat — surveiller en sols sableux pluvieux.' },
      moderate: { en: 'Low B — apply Solubor (20% B) at 2–5 kg/ha.', ar: 'B منخفض — أضف Solubor (20% B) بمعدل 2-5 كغ/هكتار.', fr: 'B faible — appliquer Solubor 20% à 2–5 kg/ha.' },
      poor: { en: 'Boron deficient — foliar B spray + soil Solubor.', ar: 'نقص البورون — رش ورقي B + Solubor للتربة.', fr: 'Carence en B — pulvérisation foliaire + Solubor.' },
    },
  },
  {
    key: 'copperPpm', name: 'Copper (Cu)', nameAr: 'النحاس (Cu)', nameFr: 'Cuivre (Cu)', unit: 'ppm', weight: 0.03,
    optimalRange: '0.5 – 3.0', scoreFn: scoreCu, emoji: '🟤',
    recommendation: {
      optimal: { en: 'Copper optimal — lignin synthesis and disease resistance healthy.', ar: 'النحاس مثالي — تخليق اللينين ومقاومة الأمراض صحي.', fr: 'Cuivre optimal — lignine et résistance aux maladies.' },
      good: { en: 'Cu adequate — rarely deficient in mineral soils.', ar: 'Cu كافٍ — نادر النقص في التربة المعدنية.', fr: 'Cu adéquat — rarement déficient en sols minéraux.' },
      moderate: { en: 'Low Cu — apply CuSO₄ at 5–10 kg/ha or foliar.', ar: 'Cu منخفض — أضف CuSO₄ بمعدل 5-10 كغ/هكتار أو رش ورقي.', fr: 'Cu faible — appliquer CuSO₄ 5–10 kg/ha ou foliaire.' },
      poor: { en: 'Copper deficient — foliar Cu spray recommended.', ar: 'نقص النحاس — رش ورقي Cu موصى به.', fr: 'Carence en Cu — pulvérisation foliaire recommandée.' },
    },
  },
  {
    key: 'manganesePpm', name: 'Manganese (Mn)', nameAr: 'المنغنيز (Mn)', nameFr: 'Manganèse (Mn)', unit: 'ppm', weight: 0.03,
    optimalRange: '1.0 – 15.0', scoreFn: scoreMn, emoji: '🟣',
    recommendation: {
      optimal: { en: 'Manganese optimal — photosynthesis and enzyme activation healthy.', ar: 'المنغنيز مثالي — التمثيل الضوئي وتنشيط الإنزيمات صحي.', fr: 'Manganèse optimal — photosynthèse et enzymes sains.' },
      good: { en: 'Mn adequate — monitor in high-pH/calcareous soils.', ar: 'Mn كافٍ — راقب في التربة الجيرية عالية الحموضة.', fr: 'Mn adéquat — surveiller en sols calcaires.' },
      moderate: { en: 'Low Mn — apply MnSO₄ at 10–20 kg/ha or foliar.', ar: 'Mn منخفض — أضف MnSO₄ بمعدل 10-20 كغ/هكتار أو رش ورقي.', fr: 'Mn faible — appliquer MnSO₄ 10–20 kg/ha ou foliaire.' },
      poor: { en: 'Manganese deficient — foliar Mn spray immediately.', ar: 'نقص المنغنيز — رش ورقي Mn فوراً.', fr: 'Carence en Mn — pulvérisation foliaire immédiate.' },
    },
  },
  {
    key: 'sodiumPct', name: 'Sodium (ESP)', nameAr: 'الصوديوم (ESP)', nameFr: 'Sodium (ESP)', unit: '%', weight: 0.03,
    optimalRange: '≤ 5%', scoreFn: scoreESP, emoji: '⚠️',
    recommendation: {
      optimal: { en: 'Sodium levels safe — no sodicity risk.', ar: 'مستويات الصوديوم آمنة — لا خطر الصودية.', fr: 'Sodium sûr — aucun risque de sodicité.' },
      good: { en: 'ESP slightly elevated — monitor drainage.', ar: 'ESP مرتفع قليلاً — راقب الصرف.', fr: 'ESP légèrement élevé — surveiller le drainage.' },
      moderate: { en: 'Moderate sodicity — apply gypsum + leach with good water.', ar: 'صودية متوسطة — أضف جبس + اغسل بمياه جيدة.', fr: 'Sodicité modérée — appliquer gypse + lessivage.' },
      poor: { en: 'High sodicity — gypsum + deep ripping + leaching program.', ar: 'صودية عالية — جبس + تمزيق عميق + برنامج غسيل.', fr: 'Sodicité élevée — gypse + sous-solage + lessivage.' },
    },
  },
];

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

export function calculateFertilityScore(input: SoilFertilityInput): FertilityResult {
  const parameters: ParameterScore[] = [];
  let weightedSum = 0;
  let totalWeight = 0;
  let measuredCount = 0;

  for (const config of PARAM_CONFIGS) {
    const value = input[config.key];
    if (value == null || !Number.isFinite(value)) {
      // Skip unmeasured parameters
      continue;
    }
    measuredCount++;
    const score = config.scoreFn(value);
    const band = bandFromScore(score);
    const rec = config.recommendation[band];

    parameters.push({
      name: config.name,
      nameAr: config.nameAr,
      nameFr: config.nameFr,
      value,
      unit: config.unit,
      score,
      band,
      weight: config.weight,
      optimalRange: config.optimalRange,
      recommendation: rec,
      emoji: config.emoji,
    });

    weightedSum += score * config.weight;
    totalWeight += config.weight;
  }

  // Normalize to 0-100 if not all parameters were measured
  const totalScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;
  const band = bandFromScore(totalScore);
  const grade = gradeFromScore(totalScore);

  const topIssues = parameters
    .filter((p) => p.score < 60)
    .sort((a, b) => a.score - b.score)
    .map((p) => p.name);

  const confidence: 'high' | 'medium' | 'low' =
    measuredCount >= 12 ? 'high' : measuredCount >= 7 ? 'medium' : 'low';

  const summaryEn = totalScore >= 90
    ? `Excellent soil fertility (score ${totalScore}/100). All key parameters are in optimal ranges. Maintain current management practices.`
    : totalScore >= 70
    ? `Good soil fertility (score ${totalScore}/100). Some parameters need minor adjustments. Address the ${topIssues.length} issue(s) below for optimal yields.`
    : totalScore >= 50
    ? `Moderate soil fertility (score ${totalScore}/100). Several parameters need amendment. Address the ${topIssues.length} issue(s) below before planting for best results.`
    : `Poor soil fertility (score ${totalScore}/100). Significant amendments required. The ${topIssues.length} issue(s) below are limiting crop productivity.`;

  const summaryAr = totalScore >= 90
    ? `خصوبة تربة ممتازة (النتيجة ${totalScore}/100). جميع المعايير الرئيسية في النطاقات المثلى. حافظ على الممارسات الحالية.`
    : totalScore >= 70
    ? `خصوبة تربة جيدة (النتيجة ${totalScore}/100). بعض المعايير تحتاج تعديلات بسيطة. عالج ${topIssues.length} مشكلة أدناه للحصول على إنتاجية مثلى.`
    : totalScore >= 50
    ? `خصوبة تربة متوسطة (النتيجة ${totalScore}/100). عدة معايير تحتاج تعديل. عالج ${topIssues.length} مشكلة أدناه قبل الزراعة.`
    : `خصوبة تربة ضعيفة (النتيجة ${totalScore}/100). تعديلات كبيرة مطلوبة. ${topIssues.length} مشكلة أدناه تحد من إنتاجية المحصول.`;

  const summaryFr = totalScore >= 90
    ? `Fertilité excellente (score ${totalScore}/100). Tous les paramètres sont optimaux. Maintenir les pratiques actuelles.`
    : totalScore >= 70
    ? `Bonne fertilité (score ${totalScore}/100). Ajustements mineurs nécessaires. Traiter les ${topIssues.length} point(s) ci-dessous.`
    : totalScore >= 50
    ? `Fertilité modérée (score ${totalScore}/100). Amendements nécessaires. Traiter les ${topIssues.length} point(s) ci-dessous avant plantation.`
    : `Fertilité faible (score ${totalScore}/100). Amendements significatifs requis. Les ${topIssues.length} point(s) ci-dessous limitent la productivité.`;

  return {
    totalScore,
    band,
    grade,
    parameters,
    summary: { en: summaryEn, ar: summaryAr, fr: summaryFr },
    topIssues,
    measured: measuredCount,
    total: PARAM_CONFIGS.length,
    confidence,
  };
}

// ---------------------------------------------------------------------------
// Convert SoilTestEntry (from soil-history-store) to SoilFertilityInput
// ---------------------------------------------------------------------------

export interface SoilTestEntryLike {
  ph: number;
  om: number;
  cec: number;
  ca: number;
  mg: number;
  k: number;
  na: number;
  p: number;
  ec_ds_m?: number;
  // Optional micronutrients (may not be in all soil tests)
  zincPpm?: number;
  ironPpm?: number;
  boronPpm?: number;
  copperPpm?: number;
  manganesePpm?: number;
}

/**
 * Convert a SoilTestEntry (from soil-history-store) to a SoilFertilityInput
 * so the Fertility Score widget can auto-fill from saved soil tests.
 *
 * Key conversions:
 *   - SoilTestEntry uses meq/100g (cmol+/kg) for Ca, Mg, K, Na — same unit as SoilFertilityInput
 *   - P is already in ppm (Olsen) — matches SoilFertilityInput.phosphorusPpm
 *   - EC is optional — only filled if present
 *   - ESP (exchangeable sodium percentage) is computed from Na / CEC × 100
 *   - N (nitrogen) is NOT in SoilTestEntry — left as undefined (most soil tests don't include it)
 *   - Micronutrients (Zn, Fe, B, Cu, Mn) are optional — only filled if present
 */
export function soilTestToFertilityInput(test: SoilTestEntryLike): SoilFertilityInput {
  const cec = test.cec || 1; // avoid division by zero
  const esp = (test.na / cec) * 100;

  return {
    ph: test.ph,
    organicMatterPct: test.om,
    ecDsm: test.ec_ds_m,
    phosphorusPpm: test.p,
    // Convert K from meq/100g to ppm: 1 meq/100g K = 391 ppm K
    potassiumPpm: meqToPpm_K(test.k),
    cecCmolKg: test.cec,
    calciumCmolKg: test.ca,
    magnesiumCmolKg: test.mg,
    sodiumPct: Math.round(esp * 10) / 10,
    nitrogenPpm: undefined,
    zincPpm: test.zincPpm,
    ironPpm: test.ironPpm,
    boronPpm: test.boronPpm,
    copperPpm: test.copperPpm,
    manganesePpm: test.manganesePpm,
  };
}

/**
 * Convert meq/100g K to ppm K.
 * 1 meq/100g K = 391 mg/kg (ppm)
 * (K atomic weight = 39.1 g/mol × 10 = 391 mg per meq/100g)
 */
export function meqToPpm_K(meqPer100g: number): number {
  return meqPer100g * 391;
}

// ---------------------------------------------------------------------------
// Helpers for UI
// ---------------------------------------------------------------------------

export function bandColor(band: ScoreBand): string {
  switch (band) {
    case 'optimal': return '#16a34a';
    case 'good': return '#84cc16';
    case 'moderate': return '#f59e0b';
    case 'poor': return '#dc2626';
  }
}

export function bandLabel(band: ScoreBand, language: Language): string {
  const labels: Record<ScoreBand, Record<Language, string>> = {
    optimal: { en: 'Optimal', ar: 'مثالي', fr: 'Optimal' },
    good: { en: 'Good', ar: 'جيد', fr: 'Bon' },
    moderate: { en: 'Moderate', ar: 'متوسط', fr: 'Modéré' },
    poor: { en: 'Poor', ar: 'ضعيف', fr: 'Faible' },
  };
  return labels[band][language];
}

export function gradeColor(grade: string): string {
  if (grade === 'A') return '#16a34a';
  if (grade === 'B') return '#84cc16';
  if (grade === 'C') return '#f59e0b';
  if (grade === 'D') return '#f97316';
  return '#dc2626';
}
