/**
 * Safety & Provenance Layer — addresses the P0/P1 audit findings.
 *
 * P0-1: Irrigation volume consistency check (mm × ha → m³)
 * P0-3: ETc ≠ irrigation need disclaimer
 * P0-4: Spray window safety disclaimer
 * P0-5: Product vs active ingredient distinction
 * P1-1: Data provenance badges
 * P1-5: "Sourced from peer-reviewed references" rephrasing
 * P2: Safety by Design — no "Safe" without full factor check
 */

// ============================================================================
// P0-1: Irrigation consistency check
// ============================================================================

/**
 * Verify that irrigation mm, area ha, and volume m³ are consistent.
 * Formula: volume_m3 = mm × ha × 10
 *
 * @returns { consistent, expected_m3, actual_m3, warning }
 */
export function checkIrrigationConsistency(
  irrigationMm: number,
  areaHa: number,
  volumeM3?: number,
): { consistent: boolean; expectedM3: number; actualM3?: number; warning?: string } {
  if (irrigationMm <= 0 || areaHa <= 0) {
    return { consistent: true, expectedM3: 0 };
  }

  const expectedM3 = irrigationMm * areaHa * 10; // 1 mm × 1 ha = 10 m³

  if (volumeM3 === undefined) {
    return { consistent: true, expectedM3 };
  }

  const tolerance = 0.05; // 5% tolerance
  const ratio = volumeM3 / expectedM3;

  if (ratio < (1 - tolerance) || ratio > (1 + tolerance)) {
    return {
      consistent: false,
      expectedM3,
      actualM3: volumeM3,
      warning: `Inconsistency: ${irrigationMm}mm × ${areaHa}ha should = ${expectedM3.toFixed(0)}m³, but showing ${volumeM3}m³. Check if a sub-section area is being used.`,
    };
  }

  return { consistent: true, expectedM3, actualM3: volumeM3 };
}

/**
 * Compute irrigation volume from mm and ha.
 * 1 mm × 1 ha = 10 m³ (standard conversion).
 */
export function mmHaToM3(mm: number, ha: number): number {
  return mm * ha * 10;
}

/**
 * Compute irrigation mm from volume m³ and ha.
 */
export function m3HaToMm(m3: number, ha: number): number {
  if (ha <= 0) return 0;
  return m3 / (ha * 10);
}

// ============================================================================
// P0-3: ETc ≠ Irrigation Need
// ============================================================================

/**
 * Compute the full water balance:
 *   ETc = Kc × ET₀  (crop evapotranspiration — what the crop USED)
 *   Effective rainfall = rainfall × 0.8 (FAO-56, ~80% reaches root zone)
 *   Net irrigation need = max(0, ETc - effective_rainfall)
 *   Gross irrigation = Net / Application efficiency
 *
 * The audit correctly noted that ETc alone is NOT the irrigation need.
 * This function makes the full chain explicit.
 */
export interface WaterBalanceResult {
  et0: number;           // mm/day — reference evapotranspiration
  kc: number;            // crop coefficient
  etc: number;           // mm/day — crop evapotranspiration (Kc × ET₀)
  rainfall: number;       // mm/day — total precipitation
  effectiveRainfall: number; // mm/day — rainfall that reaches root zone (~80%)
  netIrrigationMm: number; // mm/day — net irrigation need (ETc - effective rain)
  irrigationEfficiency: number; // 0-1 (drip=0.9, sprinkler=0.75, furrow=0.6)
  grossIrrigationMm: number; // mm/day — gross irrigation to apply
  grossIrrigationM3: number; // m³/day — gross irrigation volume (mm × ha × 10)
  areaHa: number;
  /** True if there's a rainfall estimate (not just ET₀) */
  hasRainfallData: boolean;
  /** Advisory disclaimer — ETc is crop water use, NOT irrigation command */
  disclaimer: { en: string; fr: string; ar: string };
}

export function computeWaterBalance(params: {
  et0: number;
  kc: number;
  rainfall?: number;
  areaHa: number;
  irrigationEfficiency?: number;
}): WaterBalanceResult {
  const { et0, kc, rainfall = 0, areaHa } = params;
  const irrigationEfficiency = params.irrigationEfficiency ?? 0.9; // default drip

  const etc = kc * et0;
  const effectiveRainfall = rainfall * 0.8; // FAO-56: ~80% of rain reaches root zone
  const netIrrigationMm = Math.max(0, etc - effectiveRainfall);
  const grossIrrigationMm = netIrrigationMm / irrigationEfficiency;
  const grossIrrigationM3 = grossIrrigationMm * areaHa * 10;

  return {
    et0,
    kc,
    etc,
    rainfall,
    effectiveRainfall,
    netIrrigationMm,
    irrigationEfficiency,
    grossIrrigationMm,
    grossIrrigationM3,
    areaHa,
    hasRainfallData: rainfall > 0,
    disclaimer: {
      en: 'ETc = crop water use (Kc × ET₀). Net irrigation = ETc − effective rain. Gross irrigation = Net ÷ efficiency. This is advisory — verify with soil moisture sensors and label restrictions.',
      fr: 'ETc = consommation de la culture (Kc × ET₀). Irrigation nette = ETc − pluie efficace. Irrigation brute = Nette ÷ efficacité. Ceci est indicatif — vérifiez avec des capteurs d\'humidité du sol.',
      ar: 'ETc = استهلاك المحصول المائي (Kc × ET₀). الري الصافي = ETc − المطر الفعّال. الري الإجمالي = الصافي ÷ الكفاءة. هذه توصية استرشادية — تحقّق بمستشعرات رطوبة التربة.',
    },
  };
}

// ============================================================================
// P0-4: Spray Window Safety Disclaimer
// ============================================================================

export const SPRAY_SAFETY_DISCLAIMER = {
  en: 'Conditions appear suitable based on weather only. Before spraying, also verify: wind speed & direction, temperature inversion risk (dawn/dusk), nozzle type & droplet size, boom height, product label restrictions, buffer zones near water bodies, and proximity to sensitive crops or beehives.',
  fr: 'Les conditions semblent favorables selon la météo uniquement. Avant de traiter, vérifiez également : vent (vitesse & direction), risque d\'inversion thermique (aube/crépuscule), type de buse & taille de gouttes, hauteur de rampe, restrictions de l\'étiquette, zones tampon près des points d\'eau, et proximité des cultures sensibles ou ruches.',
  ar: 'الظروف تبدو ملائمة بناءً على الطقس فقط. قبل الرش، تحقّق أيضاً من: سرعة واتجاه الرياح، خطر الانقلاب الحراري (الفجر/الغروب)، نوع الفوهة وحجم القطرات، ارتفاع البوم، قيود ملصق المنتج، مناطق العزل قرب المسطحات المائية، وقرب المحاصيل الحساسة أو خلايا النحل.',
};

/**
 * Check all spray safety factors — not just Delta-T.
 * The audit noted that using Delta-T alone is insufficient.
 */
export interface SpraySafetyCheck {
  // Weather factors (checked automatically)
  windOk: boolean;
  windSpeed: number;
  rainOk: boolean;
  rainProbability: number;
  tempOk: boolean;
  tempMax: number;
  deltaTOk: boolean;
  deltaT?: number;

  // Factors that must be checked manually (cannot be automated)
  inversionRisk: 'unknown'; // must be assessed at spray time (dawn/dusk calm)
  nozzleChecked: 'unknown';  // must verify nozzle type matches product label
  labelChecked: 'unknown';   // must read product label for specific restrictions
  bufferChecked: 'unknown';  // must verify buffer zones near water/sensitive areas

  /** Overall: NOT "safe" — only "weather conditions appear suitable" */
  weatherSuitable: boolean;
  /** Always false — we never declare spray "safe" */
  fullySafe: false;

  recommendation: { en: string; fr: string; ar: string };
}

export function checkSpraySafety(weather: {
  windSpeedMax?: number;
  precipitationProbability?: number;
  tempMax?: number;
  tempMin?: number;
  deltaT?: number;
}): SpraySafetyCheck {
  const windSpeed = weather.windSpeedMax ?? 0;
  const rainProb = weather.precipitationProbability ?? 0;
  const tempMax = weather.tempMax ?? 20;
  const deltaT = weather.deltaT;

  const windOk = windSpeed < 15;
  const rainOk = rainProb < 60;
  const tempOk = tempMax >= 12 && tempMax <= 28;
  const deltaTOk = deltaT !== undefined ? deltaT >= 2 && deltaT <= 8 : true;

  const weatherSuitable = windOk && rainOk && tempOk && deltaTOk;

  return {
    windOk,
    windSpeed,
    rainOk,
    rainProbability: rainProb,
    tempOk,
    tempMax,
    deltaTOk,
    deltaT,
    inversionRisk: 'unknown',
    nozzleChecked: 'unknown',
    labelChecked: 'unknown',
    bufferChecked: 'unknown',
    weatherSuitable,
    fullySafe: false,
    recommendation: {
      en: weatherSuitable
        ? 'Weather conditions appear suitable for spraying. Check label, nozzle, inversion risk, and buffer zones before proceeding.'
        : 'Weather conditions are NOT suitable for spraying. Wait for better conditions.',
      fr: weatherSuitable
        ? 'Les conditions météo semblent favorables. Vérifiez l\'étiquette, les buses, le risque d\'inversion et les zones tampon avant de traiter.'
        : 'Les conditions météo NE sont PAS favorables. Attendez de meilleures conditions.',
      ar: weatherSuitable
        ? 'الظروف الجوية تبدو ملائمة للرش. تحقّق من الملصق والفوهة وخطر الانقلاب ومناطق العزل قبل المتابعة.'
        : 'الظروف الجوية غير ملائمة للرش. انتظر ظروفاً أفضل.',
    },
  };
}

// ============================================================================
// P0-5: Product vs Active Ingredient distinction
// ============================================================================

export const PRODUCT_VS_ACTIVE_DISCLAIMER = {
  en: 'Note: Commercial products (brand names) are different from active ingredients (chemical substances). One active ingredient may have multiple commercial products. Always read the product label for the specific formulation, dose, and registration status.',
  fr: 'Note : Les produits commerciaux (noms de marque) sont différents des matières actives (substances chimiques). Une matière active peut avoir plusieurs produits commerciaux. Lisez toujours l\'étiquette du produit pour la formulation, la dose et le statut d\'homologation.',
  ar: 'ملاحظة: المنتجات التجارية (الأسماء التجارية) تختلف عن المواد الفعّالة (المواد الكيميائية). مادة فعّالة واحدة قد يكون لها عدة منتجات تجارية. اقرأ دائماً ملصق المنتج للتحقق من الصيغة والجرعة وحالة الترخيص.',
};

// ============================================================================
// P1-1: Data Provenance Badges
// ============================================================================

export type DataProvenance =
  | 'LIVE'           // Real-time data from API (e.g., Open-Meteo current weather)
  | 'FORECAST'       // Weather forecast (7-day prediction)
  | 'CACHED'         // Cached from previous API call (show last-update time)
  | 'DEMO'           // Simulated/sample data for demonstration
  | 'REGULATORY'     // Official regulatory reference (e.g., INPV 2017, price support)
  | 'USER_INPUT'     // Data entered by the user
  | 'DERIVED'        // Computed from other data sources
  | 'REFERENCE';     // Static reference data (e.g., FAO-56 Kc values)

export interface ProvenanceBadge {
  type: DataProvenance;
  label: { en: string; fr: string; ar: string };
  color: string;
  bgColor: string;
  icon: string;
}

export const PROVENANCE_BADGES: Record<DataProvenance, ProvenanceBadge> = {
  LIVE: {
    type: 'LIVE',
    label: { en: 'Live', fr: 'En direct', ar: 'مباشر' },
    color: '#16a34a',
    bgColor: '#dcfce7',
    icon: '●',
  },
  FORECAST: {
    type: 'FORECAST',
    label: { en: 'Forecast', fr: 'Prévision', ar: 'توقّع' },
    color: '#0284c7',
    bgColor: '#e0f2fe',
    icon: '☁',
  },
  CACHED: {
    type: 'CACHED',
    label: { en: 'Cached', fr: 'En cache', ar: 'مخزّن' },
    color: '#f59e0b',
    bgColor: '#fef3c7',
    icon: '⏱',
  },
  DEMO: {
    type: 'DEMO',
    label: { en: 'Demo', fr: 'Démo', ar: 'عرض' },
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    icon: '◇',
  },
  REGULATORY: {
    type: 'REGULATORY',
    label: { en: 'Regulatory', fr: 'Réglementaire', ar: 'تنظيمي' },
    color: '#dc2626',
    bgColor: '#fee2e2',
    icon: '§',
  },
  USER_INPUT: {
    type: 'USER_INPUT',
    label: { en: 'Your input', fr: 'Votre saisie', ar: 'إدخالك' },
    color: '#0891b2',
    bgColor: '#cffafe',
    icon: '✎',
  },
  DERIVED: {
    type: 'DERIVED',
    label: { en: 'Calculated', fr: 'Calculé', ar: 'محسوب' },
    color: '#6366f1',
    bgColor: '#e0e7ff',
    icon: '∑',
  },
  REFERENCE: {
    type: 'REFERENCE',
    label: { en: 'Reference', fr: 'Référence', ar: 'مرجعي' },
    color: '#64748b',
    bgColor: '#f1f5f9',
    icon: '📖',
  },
};

// ============================================================================
// P1-5: Rephrase "peer-reviewed formulas"
// ============================================================================

export const FORMULA_PROVENANCE_TEXT = {
  en: '500 agronomic formulas sourced from peer-reviewed references, technical standards, and institutional sources (FAO, USDA, ASABE, INPV, Fertial).',
  fr: '500 formules agronomiques issues de références évaluées par des pairs, de normes techniques et de sources institutionnelles (FAO, USDA, ASABE, INPV, Fertial).',
  ar: '500 معادلة زراعية مستقاة من مراجع محكّمة ومعايير تقنية ومصادر مؤسسية (الفاو، USDA، ASABE، INPV، Fertial).',
};

// ============================================================================
// P1-2: Separate official price from market price
// ============================================================================

export const PRICE_TYPE_DISCLAIMER = {
  en: 'Prices shown are official regulatory reference prices (e.g., OAIC purchase price), not live wholesale market prices. Actual market prices vary daily by region, season, and supply/demand. Verify current local prices at your nearest Marché de Gros.',
  fr: 'Les prix affichés sont des prix de référence réglementaires officiels (ex. prix d\'achat OAIC), et non des prix de marché de gros en direct. Les prix réels varient quotidiennement selon la région, la saison et l\'offre/demande. Vérifiez les prix locaux actuels au Marché de Gros le plus proche.',
  ar: 'الأسعار المعروضة هي أسعار مرجعية تنظيمية رسمية (مثل سعر شراء OAIC)، وليست أسعار سوق الجملة الحية. تختلف الأسعار الفعلية يومياً حسب المنطقة والموسم والعرض/الطلب. تحقّق من الأسعار المحلية الحالية في أقرب سوق جملة.',
};

export interface PriceInfo {
  /** The displayed price value. */
  value: number;
  /** Currency unit (e.g., 'DZD/Qx', 'DZD/kg'). */
  unit: string;
  /** What type of price this is. */
  type: 'official_reference' | 'market_estimate' | 'historical_average' | 'user_input';
  /** Source of the price. */
  source: string;
  /** Date the price was last verified. */
  lastVerified?: string;
}

export function formatPriceWithProvenance(info: PriceInfo, language: 'en' | 'fr' | 'ar'): string {
  const typeLabels = {
    official_reference: { en: 'Official ref.', fr: 'Réf. officiel', ar: 'مرجعي رسمي' },
    market_estimate: { en: 'Market est.', fr: 'Est. marché', ar: 'تقدير سوق' },
    historical_average: { en: 'Historical avg.', fr: 'Moy. historique', ar: 'متوسط تاريخي' },
    user_input: { en: 'Your input', fr: 'Votre saisie', ar: 'إدخالك' },
  };
  const label = typeLabels[info.type][language];
  return `${info.value.toLocaleString()} ${info.unit} (${label})`;
}

// ============================================================================
// P1-3: Version Governance
// ============================================================================

export const VERSION_INFO = {
  productVersion: '0.2.0 (Prototype)',
  agronomicEngineVersion: '1.0',
  knowledgeBaseRelease: '2026.08',
  inpvDatasetVersion: '2017 (INPV official index — may be outdated)',
  aiModelVersion: 'gpt-5-mini (via ZAI SDK)',
  formulaCatalogVersion: '3.5 (500 formulas)',
};

// ============================================================================
// P1-4: Feature status — LIVE / BETA / ROADMAP
// ============================================================================

export type FeatureStatus = 'LIVE' | 'BETA' | 'ROADMAP';

export interface FeatureStatusInfo {
  status: FeatureStatus;
  label: { en: string; fr: string; ar: string };
  color: string;
  bgColor: string;
}

export const FEATURE_STATUS: Record<FeatureStatus, FeatureStatusInfo> = {
  LIVE: {
    status: 'LIVE',
    label: { en: 'Live', fr: 'En direct', ar: 'مباشر' },
    color: '#16a34a', bgColor: '#dcfce7',
  },
  BETA: {
    status: 'BETA',
    label: { en: 'Beta', fr: 'Bêta', ar: 'تجريبي' },
    color: '#f59e0b', bgColor: '#fef3c7',
  },
  ROADMAP: {
    status: 'ROADMAP',
    label: { en: 'Roadmap', fr: 'Feuille de route', ar: 'قيد التطوير' },
    color: '#6366f1', bgColor: '#e0e7ff',
  },
};

/** Feature status registry — fixes NDVI contradiction (was marketed as available but roadmap says In Progress). */
export const FEATURE_REGISTRY: Record<string, FeatureStatus> = {
  'ndvi_satellite': 'BETA',        // Works but limited coverage in Algeria
  'weather_live': 'LIVE',          // Open-Meteo real-time, no key needed
  'et0_tracker': 'LIVE',
  'irrigation_scheduler': 'LIVE',
  'crop_simulator': 'LIVE',
  'ai_agronomist': 'LIVE',
  'inpv_product_finder': 'LIVE',   // Based on 2017 data (may be outdated)
  'disease_encyclopedia': 'LIVE',
  'climate_simulator': 'LIVE',
  'soil_sensor_dashboard': 'BETA', // Simulated readings (no real Modbus sensors)
  'crop_recommender': 'LIVE',
  'satellite_crop_health': 'BETA',  // Sentinel-2 works but limited Algerian coverage
  'farm_digital_twin': 'BETA',
  'marketplace': 'ROADMAP',
  'farmer_community': 'ROADMAP',
  'carbon_credit': 'BETA',
};

// ============================================================================
// P1-6: VPD crop-specific interpretation
// ============================================================================

export interface VPDCropRange {
  crop: string;
  cropAr: string;
  /** Optimal VPD range for this crop (kPa). */
  optimalMin: number;
  optimalMax: number;
  /** VPD above which stress occurs. */
  stressThreshold: number;
  /** Environment: greenhouse or open field. */
  environment: 'greenhouse' | 'open_field' | 'both';
}

export const VPD_CROP_RANGES: VPDCropRange[] = [
  { crop: 'Tomato', cropAr: 'الطماطم', optimalMin: 0.8, optimalMax: 1.2, stressThreshold: 1.5, environment: 'greenhouse' },
  { crop: 'Tomato', cropAr: 'الطماطم', optimalMin: 1.0, optimalMax: 2.0, stressThreshold: 2.5, environment: 'open_field' },
  { crop: 'Cucumber', cropAr: 'الخيار', optimalMin: 0.8, optimalMax: 1.0, stressThreshold: 1.3, environment: 'greenhouse' },
  { crop: 'Pepper', cropAr: 'الفلفل', optimalMin: 0.7, optimalMax: 1.1, stressThreshold: 1.4, environment: 'greenhouse' },
  { crop: 'Strawberry', cropAr: 'الفراولة', optimalMin: 0.4, optimalMax: 0.8, stressThreshold: 1.0, environment: 'both' },
  { crop: 'Lettuce', cropAr: 'الخس', optimalMin: 0.6, optimalMax: 1.0, stressThreshold: 1.2, environment: 'greenhouse' },
  { crop: 'Citrus', cropAr: 'الحمضيات', optimalMin: 1.0, optimalMax: 2.5, stressThreshold: 3.5, environment: 'open_field' },
  { crop: 'Wheat', cropAr: 'القمح', optimalMin: 1.0, optimalMax: 2.5, stressThreshold: 3.0, environment: 'open_field' },
  { crop: 'Potato', cropAr: 'البطاطا', optimalMin: 0.8, optimalMax: 1.8, stressThreshold: 2.5, environment: 'open_field' },
  { crop: 'Vine', cropAr: 'الكروم', optimalMin: 1.2, optimalMax: 2.5, stressThreshold: 3.5, environment: 'open_field' },
  { crop: 'Olive', cropAr: 'الزيتون', optimalMin: 1.5, optimalMax: 3.0, stressThreshold: 4.0, environment: 'open_field' },
  { crop: 'Date Palm', cropAr: 'نخيل التمر', optimalMin: 2.0, optimalMax: 4.0, stressThreshold: 5.0, environment: 'open_field' },
];

/**
 * Interpret VPD for a specific crop + environment.
 * The audit correctly noted that VPD interpretation should not be universal.
 */
export function interpretVPD(vpdKPa: number, crop?: string, environment?: 'greenhouse' | 'open_field'): {
  status: 'optimal' | 'moderate' | 'stress' | 'unknown';
  message: { en: string; fr: string; ar: string };
} {
  if (!crop) {
    // No crop specified — use generic interpretation with disclaimer
    return {
      status: vpdKPa < 1.5 ? 'optimal' : vpdKPa < 2.5 ? 'moderate' : 'stress',
      message: {
        en: `VPD ${vpdKPa.toFixed(2)} kPa. Interpretation is crop-specific — select a crop for accurate assessment.`,
        fr: `VPD ${vpdKPa.toFixed(2)} kPa. L'interprétation dépend de la culture — sélectionnez une culture pour une évaluation précise.`,
        ar: `VPD ${vpdKPa.toFixed(2)} كيلوباسكال. التفسير يعتمد على المحصول — اختر محصولاً لتقييم دقيق.`,
      },
    };
  }

  const ranges = VPD_CROP_RANGES.filter(r =>
    r.crop.toLowerCase() === crop.toLowerCase() &&
    (!environment || r.environment === environment || r.environment === 'both')
  );

  if (ranges.length === 0) {
    return {
      status: 'unknown',
      message: {
        en: `VPD ${vpdKPa.toFixed(2)} kPa. No crop-specific range available for ${crop}. Using general reference.`,
        fr: `VPD ${vpdKPa.toFixed(2)} kPa. Pas de plage spécifique pour ${crop}. Utilisation d'une référence générale.`,
        ar: `VPD ${vpdKPa.toFixed(2)} كيلوباسكال. لا يوجد نطاق محدد لـ ${crop}. استخدام مرجع عام.`,
      },
    };
  }

  const range = ranges[0];
  if (vpdKPa < range.optimalMin) {
    return {
      status: 'moderate',
      message: {
        en: `VPD ${vpdKPa.toFixed(2)} kPa is below optimal for ${crop} (${range.optimalMin}-${range.optimalMax} kPa). Low transpiration — risk of fungal diseases.`,
        fr: `VPD ${vpdKPa.toFixed(2)} kPa sous l'optimal pour ${crop} (${range.optimalMin}-${range.optimalMax} kPa). Transpiration faible — risque de maladies fongiques.`,
        ar: `VPD ${vpdKPa.toFixed(2)} كيلوباسكال أقل من المثالي لـ ${crop} (${range.optimalMin}-${range.optimalMax}). تبخّر منخفض — خطر الإصابة بالأمراض الفطرية.`,
      },
    };
  } else if (vpdKPa > range.stressThreshold) {
    return {
      status: 'stress',
      message: {
        en: `VPD ${vpdKPa.toFixed(2)} kPa exceeds stress threshold for ${crop} (>${range.stressThreshold} kPa). High transpiration — stomata may close, reducing photosynthesis.`,
        fr: `VPD ${vpdKPa.toFixed(2)} kPa dépasse le seuil de stress pour ${crop} (>${range.stressThreshold} kPa). Transpiration élevée — fermeture stomatique possible.`,
        ar: `VPD ${vpdKPa.toFixed(2)} كيلوباسكال يتجاوز عتبة الإجهاد لـ ${crop} (>${range.stressThreshold}). تبخّر مرتفع — قد تُغلق الثغور وتنخفض البناء الضوئي.`,
      },
    };
  } else if (vpdKPa > range.optimalMax) {
    return {
      status: 'moderate',
      message: {
        en: `VPD ${vpdKPa.toFixed(2)} kPa is above optimal for ${crop} (${range.optimalMin}-${range.optimalMax} kPa). Monitor for early stress signs.`,
        fr: `VPD ${vpdKPa.toFixed(2)} kPa au-dessus de l'optimal pour ${crop}. Surveillez les signes de stress.`,
        ar: `VPD ${vpdKPa.toFixed(2)} كيلوباسكال فوق المثالي لـ ${crop}. راقب علامات الإجهاد المبكرة.`,
      },
    };
  }

  return {
    status: 'optimal',
    message: {
      en: `VPD ${vpdKPa.toFixed(2)} kPa is optimal for ${crop} (${range.optimalMin}-${range.optimalMax} kPa).`,
      fr: `VPD ${vpdKPa.toFixed(2)} kPa optimal pour ${crop} (${range.optimalMin}-${range.optimalMax} kPa).`,
      ar: `VPD ${vpdKPa.toFixed(2)} كيلوباسكال مثالي لـ ${crop} (${range.optimalMin}-${range.optimalMax}).`,
    },
  };
}

// ============================================================================
// P1-7: Separate Required dose from Purchase quantity
// ============================================================================

export interface NutrientPurchaseResult {
  /** Required nutrient amount (kg/ha). */
  requiredNutrientKgPerHa: number;
  /** Product concentration (% nutrient). */
  productConcentrationPct: number;
  /** Required product amount (kg/ha). */
  requiredProductKgPerHa: number;
  /** Bag size (kg). */
  bagSizeKg: number;
  /** Number of bags needed (exact). */
  bagsExact: number;
  /** Number of bags to purchase (rounded up). */
  bagsToPurchase: number;
  /** Total product purchased (kg). */
  totalProductPurchasedKg: number;
  /** Surplus product beyond requirement (kg). */
  surplusKg: number;
  /** Surplus as % of requirement. */
  surplusPct: number;
  /** Area (ha). */
  areaHa: number;
  /** Actual nutrient applied if all purchased product is used (kg/ha). */
  actualNutrientAppliedKgPerHa: number;
  /** Warning if surplus > 5% (risk of over-application). */
  warning?: { en: string; fr: string; ar: string };
}

export function computeNutrientPurchase(params: {
  requiredNutrientKgPerHa: number;
  productConcentrationPct: number; // e.g., 46 for urea (46% N)
  bagSizeKg: number;               // typically 50 kg
  areaHa: number;
}): NutrientPurchaseResult {
  const { requiredNutrientKgPerHa, productConcentrationPct, bagSizeKg, areaHa } = params;

  const requiredProductKgPerHa = requiredNutrientKgPerHa / (productConcentrationPct / 100);
  const totalRequiredKg = requiredProductKgPerHa * areaHa;
  const bagsExact = totalRequiredKg / bagSizeKg;
  const bagsToPurchase = Math.ceil(bagsExact);
  const totalProductPurchasedKg = bagsToPurchase * bagSizeKg;
  const surplusKg = totalProductPurchasedKg - totalRequiredKg;
  const surplusPct = totalRequiredKg > 0 ? (surplusKg / totalRequiredKg) * 100 : 0;
  const actualNutrientAppliedKgPerHa = (totalProductPurchasedKg / areaHa) * (productConcentrationPct / 100);

  let warning: { en: string; fr: string; ar: string } | undefined;
  if (surplusPct > 5) {
    warning = {
      en: `Purchasing ${bagsToPurchase} bags gives ${surplusKg.toFixed(0)} kg surplus (${surplusPct.toFixed(1)}%). Applying all bags raises the dose to ${actualNutrientAppliedKgPerHa.toFixed(1)} kg/ha (target: ${requiredNutrientKgPerHa} kg/ha). Consider partial bag application or adjust area.`,
      fr: `L'achat de ${bagsToPurchase} sacs donne un surplus de ${surplusKg.toFixed(0)} kg (${surplusPct.toFixed(1)}%). L'application totale porte la dose à ${actualNutrientAppliedKgPerHa.toFixed(1)} kg/ha (cible: ${requiredNutrientKgPerHa} kg/ha).`,
      ar: `شراء ${bagsToPurchase} كيس يعطي فائضاً ${surplusKg.toFixed(0)} كغ (${surplusPct.toFixed(1)}%). التطبيق الكامل يرفع الجرعة إلى ${actualNutrientAppliedKgPerHa.toFixed(1)} كغ/هكتار (الهدف: ${requiredNutrientKgPerHa} كغ/هكتار).`,
    };
  }

  return {
    requiredNutrientKgPerHa,
    productConcentrationPct,
    requiredProductKgPerHa,
    bagSizeKg,
    bagsExact,
    bagsToPurchase,
    totalProductPurchasedKg,
    surplusKg,
    surplusPct,
    areaHa,
    actualNutrientAppliedKgPerHa,
    warning,
  };
}

export const GLOBAL_SAFETY_DISCLAIMER = {
  en: 'Formula Atlas is an advisory tool. All recommendations must be verified against product labels, local regulations, and field conditions before implementation. The final decision is the responsibility of the farmer or agronomist.',
  fr: 'Formula Atlas est un outil consultatif. Toutes les recommandations doivent être vérifiées par rapport aux étiquettes des produits, aux réglementations locales et aux conditions du terrain. La décision finale relève de la responsabilité de l\'agriculteur ou de l\'agronome.',
  ar: 'فورمولا أطلس أداة استشارية. يجب التحقق من جميع التوصيات مقابل ملصقات المنتجات واللوائح المحلية وظروف الحقل. القرار النهائي يقع على مسؤولية المزارع أو المهندس الزراعي.',
};
