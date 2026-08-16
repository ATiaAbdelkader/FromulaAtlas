/**
 * Algeria Agriculture Calendar — supporting data for the 19 calendar features.
 *
 * Includes:
 *   - 3 agro-climatic zones (Tell / Hauts Plateaux / Sahara)
 *   - Wilaya → zone mapping
 *   - Frost-risk windows per zone
 *   - Key Algerian pest biofix calendar (locust, olive fly, citrus scale, bayoud)
 *   - CNCA / subsidy deadlines (Algerian agricultural aid calendar)
 *   - Wholesale market (Marché de Gros) seasonal price patterns
 *   - Weekly souk days per wilaya
 *   - Moon-phase helper
 *   - Ramadan adjustment helpers
 *   - BBCH stage shortcuts (crops in this app)
 *   - Tank-mix compatibility matrix (subset)
 *   - Equipment & worker scheduling defaults
 *
 * Sources:
 *   - INPV (Institut National de la Protection des Végétaux) pest alerts
 *   - ONAB / CNCA algerian agricultural aid calendar 2024-2025
 *   - ITGC / INRAA technical guides for field crops
 *   - Direction des Statistiques Agricoles (DSA) — marché de gros averages
 *   - Phases astronomiques (standard synodic period 29.53059 d)
 *
 * All data is informational and reflects publicly available Algerian references.
 * Local advisers should always confirm dates against the current season's
 * INRAA / ITGC / DSA bulletins.
 */

// ============================================================================
// 1. AGRO-CLIMATIC ZONES (3 macro-zones used by Algerian extension services)
// ============================================================================

export type AgroClimaticZone = 'tell' | 'hauts_plateaux' | 'sahara';

export interface ZoneInfo {
  id: AgroClimaticZone;
  /** Localized labels — UI picks based on language. */
  label: { en: string; fr: string; ar: string };
  emoji: string;
  /** Average annual rainfall (mm). */
  rainfallMm: [number, number]; // [min, max]
  /** Typical frost risk window — month indices [start, end] (0=Jan). */
  frostWindow: [number, number] | null;
  /** Whether frost risk is significant for fruit trees. */
  frostRisk: 'none' | 'low' | 'high';
  /** Average ET₀ peak (mm/day) in summer. */
  et0Peak: number;
  /** Predominant soil types. */
  soils: string[];
  /** Predominant crops grown in this zone. */
  mainCrops: string[];
  /** Recommended planting window shift (days vs Tell baseline). */
  plantingShiftDays: number;
  /** Color used in UI. */
  color: string;
  bg: string;
  border: string;
}

export const AGRO_CLIMATIC_ZONES: ZoneInfo[] = [
  {
    id: 'tell',
    label: {
      en: 'Tell (North — coastal & fertile plains)',
      fr: 'Tell (Nord — plaines côtières et fertiles)',
      ar: 'التل (الشمال — السهول الساحلية والخصبة)',
    },
    emoji: '🌊',
    rainfallMm: [400, 1200],
    frostWindow: null,
    frostRisk: 'none',
    et0Peak: 6,
    soils: ['Alluvial', 'Clay-loam', 'Red Mediterranean'],
    mainCrops: ['citrus', 'vine', 'olive', 'wheat', 'barley', 'tomato', 'potato', 'strawberry'],
    plantingShiftDays: 0,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  {
    id: 'hauts_plateaux',
    label: {
      en: 'Hauts Plateaux (Central — steppe, cereals & fruit trees)',
      fr: 'Hauts Plateaux (Centre — steppe, céréales et arbres fruitiers)',
      ar: 'الهضاب العليا (الوسط — السهوب والحبوب والأشجار المثمرة)',
    },
    emoji: '⛰️',
    rainfallMm: [200, 500],
    frostWindow: [0, 2], // Jan–Mar
    frostRisk: 'high',
    et0Peak: 7,
    soils: ['Calcareous', 'Silty-loam', 'Steppe chotts'],
    mainCrops: ['wheat', 'barley', 'almond', 'apricot', 'vine', 'lentils', 'chickpea'],
    plantingShiftDays: 14, // ~2 weeks later vs Tell
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
  },
  {
    id: 'sahara',
    label: {
      en: 'Sahara (South — oases, date palms, irrigated)',
      fr: 'Sahara (Sud — oasis, palmiers dattiers, irrigation)',
      ar: 'الصحراء (الجنوب — الواحات والنخيل والري)',
    },
    emoji: '🏜️',
    rainfallMm: [0, 150],
    frostWindow: null,
    frostRisk: 'none',
    et0Peak: 10,
    soils: ['Sandy', 'Sandy-loam', 'Stony hamada'],
    mainCrops: ['datepalm', 'citrus', 'tomato', 'potato', 'alfalfa', 'wheat (irrigated)'],
    plantingShiftDays: -21, // earlier (milder winter allows)
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800',
  },
];

// Map major wilayas to zones (selection by user overrides).
export const WILAYA_ZONE: Record<string, AgroClimaticZone> = {
  // Tell
  'Alger': 'tell', 'Blida': 'tell', 'Tipaza': 'tell', 'Boumerdès': 'tell',
  'Tizi Ouzou': 'tell', 'Béjaïa': 'tell', 'Jijel': 'tell', 'Skikda': 'tell',
  'Annaba': 'tell', 'El Tarf': 'tell', 'Oran': 'tell', 'Mostaganem': 'tell',
  'Aïn Témouchent': 'tell', 'Tlemcen': 'tell', 'Chlef': 'tell', 'TiziOuzou': 'tell',
  // Hauts Plateaux
  'Médéa': 'hauts_plateaux', 'Aïn Defla': 'hauts_plateaux', 'Bouira': 'hauts_plateaux',
  'Tissemsilt': 'hauts_plateaux', 'Relizane': 'hauts_plateaux', 'Tiaret': 'hauts_plateaux',
  'Djelfa': 'hauts_plateaux', "M'Sila": 'hauts_plateaux', 'Sétif': 'hauts_plateaux',
  'Bordj Bou Arréridj': 'hauts_plateaux', 'Batna': 'hauts_plateaux', 'Khenchela': 'hauts_plateaux',
  'Oum El Bouaghi': 'hauts_plateaux', 'Souk Ahras': 'hauts_plateaux', 'Tébessa': 'hauts_plateaux',
  // Sahara
  'Biskra': 'sahara', 'Ouargla': 'sahara', 'El Oued': 'sahara', 'Ghardaïa': 'sahara',
  'Djelfa Sud': 'sahara', 'Laghouat': 'sahara', 'Touggourt': 'sahara',
  'Adrar': 'sahara', 'Béchar': 'sahara', 'Tamanrasset': 'sahara', 'Illizi': 'sahara',
  'Tindouf': 'sahara', 'Naâma': 'sahara', 'El Bayadh': 'sahara',
};

export function zoneById(id: AgroClimaticZone): ZoneInfo {
  return AGRO_CLIMATIC_ZONES.find(z => z.id === id) ?? AGRO_CLIMATIC_ZONES[0];
}

// ============================================================================
// 2. FROST ALERTS — for Hauts Plateaux fruit trees
// ============================================================================

export interface FrostRisk {
  crop: string;
  stage: string;
  /** Month indices (0=Jan) where frost risk is highest. */
  riskMonths: number[];
  /** Critical temperature (°C) below which damage occurs. */
  criticalTempC: number;
  /** Recommended protection method. */
  protection: string;
  /** Localized crop name. */
  cropLabel: { en: string; fr: string; ar: string };
}

export const FROST_RISKS: FrostRisk[] = [
  {
    crop: 'almond',
    stage: 'Bloom / Petal-fall (Feb–Mar)',
    riskMonths: [1, 2],
    criticalTempC: -2,
    protection: 'Smudge pots / sprinkler frost protection / wind machines',
    cropLabel: { en: 'Almond', fr: 'Amandier', ar: 'اللوز' },
  },
  {
    crop: 'apricot',
    stage: 'Bloom / Early fruit set (Mar)',
    riskMonths: [2, 3],
    criticalTempC: -1.5,
    protection: 'Overhead sprinkler, cover young trees with frost cloth',
    cropLabel: { en: 'Apricot', fr: 'Abricotier', ar: 'المشمش' },
  },
  {
    crop: 'vine',
    stage: 'Bud break (Mar–Apr)',
    riskMonths: [2, 3],
    criticalTempC: -2.5,
    protection: 'Late pruning, double Guyot to delay budbreak',
    cropLabel: { en: 'Vine', fr: 'Vigne', ar: 'الكروم' },
  },
  {
    crop: 'stonefruit',
    stage: 'Flowering (Mar–Apr)',
    riskMonths: [2, 3],
    criticalTempC: -2,
    protection: 'Smudge pots, windbreaks, anti-transpirant sprays',
    cropLabel: { en: 'Stone fruit', fr: 'Fruitiers à noyau', ar: 'الفواكه ذات النواة' },
  },
];

/** Returns active frost risks for given zone + month. */
export function frostRisksFor(zone: AgroClimaticZone, monthIdx: number): FrostRisk[] {
  if (zone === 'sahara') return [];
  if (zone === 'tell') return FROST_RISKS.filter(r => r.riskMonths.includes(monthIdx)).slice(0, 1);
  return FROST_RISKS.filter(r => r.riskMonths.includes(monthIdx));
}

// ============================================================================
// 3. PEST BIOFIX CALENDAR — key Algerian pests with emergence predictions
// ============================================================================

export interface PestBiofix {
  id: string;
  pest: string;
  pestAr: string;
  crop: string[];
  /** Threshold GDD base temp (°C). */
  baseTempC: number;
  /** GDD from Jan 1 to predicted emergence (deg·day). */
  emergenceGDD: number;
  /** Approximate calendar window (month indices). */
  window: [number, number]; // [start, end]
  /** Whether traps should be set in advance. */
  trapType: string;
  /** Treatment threshold (pests/trap/week). */
  treatmentThreshold: number;
  /** Recommended active-matter groups for rotation. */
  rotationGroups: string[];
  /** Wilayas of highest historical pressure. */
  highRiskWilayas: string[];
  emoji: string;
}

export const PEST_BIOFIX: PestBiofix[] = [
  {
    id: 'olive-fly',
    pest: 'Olive fruit fly (Bactrocera oleae)',
    pestAr: 'ذبابة ثمار الزيتون',
    crop: ['olive'],
    baseTempC: 10,
    emergenceGDD: 350,
    window: [5, 9], // Jun–Oct
    trapType: 'Pheromone (DacusTrap) + food bait',
    treatmentThreshold: 5,
    rotationGroups: ['Spinosad', 'Deltamethrin', 'Lambda-cyhalothrin', 'Dimethoate'],
    highRiskWilayas: ['Béjaïa', 'Tizi Ouzou', 'Skikda', 'Bouira', 'Médéa'],
    emoji: '🪰',
  },
  {
    id: 'locust',
    pest: 'Desert Locust (Schistocerca gregaria)',
    pestAr: 'الجراد الصحراوي',
    crop: ['wheat', 'barley', 'maize', 'vegetables'],
    baseTempC: 15,
    emergenceGDD: 600,
    window: [2, 6], // Mar–Jul
    trapType: 'Ground survey (CLAAVO + FAO Locust Hub)',
    treatmentThreshold: 0, // report-only — state-managed control
    rotationGroups: ['Diflubenzuron', 'Metarhizium acridum', 'Chlorpyrifos'],
    highRiskWilayas: ['Adrar', 'Tamanrasset', 'Illizi', 'Tindouf', 'Béchar', 'Ouargla'],
    emoji: '🦗',
  },
  {
    id: 'citrus-scale',
    pest: 'Citrus scale (Aonidiella aurantii)',
    pestAr: 'حشرة الحمضيات القشرية',
    crop: ['citrus'],
    baseTempC: 12,
    emergenceGDD: 450,
    window: [4, 9], // May–Oct
    trapType: 'Pheromone trap (males) + visual inspection of fruit',
    treatmentThreshold: 10,
    rotationGroups: ['Chlorpyrifos', 'Spirotetramat', 'Mineral oil', 'Pyriproxyfen'],
    highRiskWilayas: ['Blida', 'Boumerdès', 'Skikda', 'Annaba', 'Oran'],
    emoji: '🐞',
  },
  {
    id: 'bayoud',
    pest: 'Bayoud disease (Fusarium oxysporum f. sp. albedinis)',
    pestAr: 'مرض البيوض (فطر فيوزاريوم)',
    crop: ['datepalm'],
    baseTempC: 18,
    emergenceGDD: 800,
    window: [3, 9],
    trapType: 'Soil & tissue sampling (PCR detection)',
    treatmentThreshold: 0, // preventive only
    rotationGroups: ['Resistant cultivars', 'Tissue culture plants', 'Soil disinfection'],
    highRiskWilayas: ['Biskra', 'Ouargla', 'El Oued', 'Ghardaïa', 'Adrar', 'Touggourt'],
    emoji: '🦠',
  },
  {
    id: 'potato-late-blight',
    pest: 'Potato late blight (Phytophthora infestans)',
    pestAr: 'اللفحة المتأخرة للبطاطا',
    crop: ['potato', 'tomato'],
    baseTempC: 8,
    emergenceGDD: 180,
    window: [2, 6],
    trapType: 'Weather-based (Smith Period — T>10°C & RH>90% ≥ 11h)',
    treatmentThreshold: 0,
    rotationGroups: ['Mancozeb', 'Metalaxyl-M', 'Cymoxanil', 'Fluopicolide'],
    highRiskWilayas: ['Aïn Defla', 'Mostaganem', 'Tiaret', 'Bouira', 'Skikda'],
    emoji: '🍄',
  },
  {
    id: 'citrus-leafminer',
    pest: 'Citrus leafminer (Phyllocnistis citrella)',
    pestAr: 'خادم أوراق الحمضيات',
    crop: ['citrus'],
    baseTempC: 12,
    emergenceGDD: 250,
    window: [3, 9],
    trapType: 'Pheromone trap',
    treatmentThreshold: 0.5, // mines per young flush leaf
    rotationGroups: ['Imidacloprid', 'Azadirachtin', 'Abamectin', 'Mineral oil'],
    highRiskWilayas: ['Blida', 'Boumerdès', 'Tipaza', 'Skikda', 'Annaba'],
    emoji: '🦋',
  },
];

// ============================================================================
// 4. CNCA / SUBSIDY DEADLINES — Algerian agricultural aid calendar
// ============================================================================

export interface SubsidyDeadline {
  id: string;
  /** Title (localized). */
  title: { en: string; fr: string; ar: string };
  /** Localized description. */
  description: { en: string; fr: string; ar: string };
  /** Day-of-month (1–31) — typical deadline day. */
  day: number;
  /** Month index (0 = January). */
  month: number;
  /** Authority managing the aid. */
  authority: string;
  /** Category. */
  category: 'surface_declaration' | 'equipment_subsidy' | 'organic_certification' | 'irrigation_aid' | 'seed_subsidy';
  /** Approximate subsidy amount (DZD). */
  amountDZD?: string;
  /** Where to apply. */
  applyAt: string;
  emoji: string;
}

export const SUBSIDY_DEADLINES: SubsidyDeadline[] = [
  {
    id: 'surface-declaration',
    title: {
      en: 'Surface declaration (Campagne agricole)',
      fr: 'Déclaration des surfaces (Campagne agricole)',
      ar: 'تصريح بالمساحات (الحملة الفلاحية)',
    },
    description: {
      en: 'Annual declaration of cultivated areas to access CAM/CAAR aid. Required for cereal, legume and oilseed growers.',
      fr: 'Déclaration annuelle des surfaces cultivées pour accéder aux aides CAM/CAAR. Obligatoire pour les céréaliers et oléoprotéagineux.',
      ar: 'تصريح سنوي بالمساحات المزروعة للوصول إلى مساعدات CAM/CAAR. إلزامي لمزارعي الحبوب والبقوليات.',
    },
    day: 30,
    month: 4, // May 30
    authority: 'Direction des Services Agricoles (DSA)',
    category: 'surface_declaration',
    amountDZD: 'Variable per crop (e.g. durum wheat: 6,000 DZD/ha)',
    applyAt: 'DSA de la wilaya',
    emoji: '📋',
  },
  {
    id: 'cereal-subsidy-application',
    title: {
      en: 'Cereal marketing subsidy application',
      fr: 'Demande de subvention céréalière (collecte)',
      ar: 'طلب دعم تسويق الحبوب',
    },
    description: {
      en: 'Application window for cereal price-support subsidy (OAIC collection). Submit invoices to OAIC.',
      fr: 'Ouverture du dépôt des demandes de subvention sur les prix céréaliers (collecte OAIC). Déposer les factures auprès de l\'OAIC.',
      ar: 'فتح تقديم طلبات الدعم على أسعار الحبوب (تسويق OAIC).',
    },
    day: 15,
    month: 5, // June 15
    authority: 'OAIC (Office Algérien Interprofessionnel des Céréales)',
    category: 'equipment_subsidy',
    amountDZD: 'Variable — bonus sur prix plancher',
    applyAt: 'OAIC / DSA',
    emoji: '🌾',
  },
  {
    id: 'irrigation-equipment-aid',
    title: {
      en: 'Irrigation equipment subsidy (drip / pivots)',
      fr: 'Subvention équipements d\'irrigation (goutte-à-goutte / pivots)',
      ar: 'دعم معدات الري (التنقيط / المحاور)',
    },
    description: {
      en: 'Subsidy up to 50–80% on drip, sprinkler and pivot equipment. Applications submitted via FNDA / CNIAL.',
      fr: 'Subvention jusqu\'à 50–80% sur le matériel d\'irrigation. Dossier via le FNDA / CNIAL.',
      ar: 'دعم يصل إلى 50–80% لمعدات الري. عبر FNDA / CNIAL.',
    },
    day: 31,
    month: 2, // March 31
    authority: 'FNDA (Fonds National de Développement Agricole) / CNIAL',
    category: 'irrigation_aid',
    amountDZD: '50–80% of equipment cost (capped per ha)',
    applyAt: 'DSA + CNIAL delegation',
    emoji: '💧',
  },
  {
    id: 'tractor-equipment-aid',
    title: {
      en: 'Tractor & farm equipment subsidy (CNIAL)',
      fr: 'Subvention tracteur & matériel (CNIAL)',
      ar: 'دعم الجرارات والمعدات (CNIAL)',
    },
    description: {
      en: 'Subsidy on locally-assembled tractors, plows, seeders. Apply via CNIAL with invoice from dealer.',
      fr: 'Subvention sur tracteurs assemblés localement, charrues, semoirs. Dépôt via CNIAL avec facture.',
      ar: 'دعم على الجرارات المجمّعة محلياً والمعدات. عبر CNIAL.',
    },
    day: 30,
    month: 8, // Sept 30
    authority: 'CNIAL (Caisse Nationale d\'Assurance Agricole)',
    category: 'equipment_subsidy',
    amountDZD: 'Up to 100,000 DZD per tractor unit (resale subsidy)',
    applyAt: 'CNIAL / agricultural cooperative',
    emoji: '🚜',
  },
  {
    id: 'seed-cereal-application',
    title: {
      en: 'Certified cereal seed application',
      fr: 'Demande de semences certifiées (céréales)',
      ar: 'طلب بذور الحبوب المعتمدة',
    },
    description: {
      en: 'Place orders for certified durum/bread wheat, barley and oat seed at the discounted rate. Late applicants pay full price.',
      fr: 'Commande de semences certifiées (blé dur, blé tendre, orge, avoine) au tarif subventionné. Retard = tarif plein.',
      ar: 'طلب بذور الحبوب المعتمدة بالسعر المدعوم. التأخّر = دفع السعر الكامل.',
    },
    day: 31,
    month: 7, // Aug 31
    authority: 'ONAB / FNDSA seed distribution',
    category: 'seed_subsidy',
    amountDZD: '50% reduction on certified seed price',
    applyAt: 'Cooperative / ONAB regional office',
    emoji: '🌱',
  },
  {
    id: 'organic-certification',
    title: {
      en: 'Organic certification renewal',
      fr: 'Renouvellement de la certification biologique',
      ar: 'تجديد الشهادة العضوية',
    },
    description: {
      en: 'Annual renewal for organic producers. Inspector visit + soil & residue analysis.',
      fr: 'Renouvellement annuel pour les producteurs bio. Visite d\'inspection + analyses de sol et résidus.',
      ar: 'تجديد سنوي للمنتجين العضويين. زيارة تفتيش وتحاليل.',
    },
    day: 15,
    month: 9, // Oct 15
    authority: 'Direction du Développement Rural (DDA) — INPV residue testing',
    category: 'organic_certification',
    amountDZD: 'Inspection fee ~15,000 DZD',
    applyAt: 'DDA / certification body approved by MINAG',
    emoji: '🍃',
  },
  {
    id: 'crop-insurance-cnac',
    title: {
      en: 'Crop insurance subscription (CNAC)',
      fr: 'Souscription assurance-récolte (CNAC)',
      ar: 'اشتراك التأمين على المحاصيل (CNAC)',
    },
    description: {
      en: 'Catastrophic-risk insurance (drought, hail, locust) for cereals, legumes and olive. Subsidized premium (~70%).',
      fr: 'Assurance contre les risques catastrophiques (sécheresse, grêle, criquets) pour céréales, légumineuses, olivier. Prime subventionnée (~70%).',
      ar: 'تأمين ضد المخاطر الكارثية (جفاف، بَرَد، جراد). قسط مدعوم (~70%).',
    },
    day: 30,
    month: 10, // Nov 30
    authority: 'CNAC (Caisse Nationale d\'Assurance Agricole)',
    category: 'surface_declaration',
    amountDZD: 'Premium ~1,500 DZD/ha (after subsidy)',
    applyAt: 'CNAC local agent / cooperative',
    emoji: '🛡️',
  },
];

// ============================================================================
// 5. WEEKLY SOUK DAYS — by wilaya / commune
// ============================================================================

export interface SoukInfo {
  commune: string;
  wilaya: string;
  /** Day of week (0=Sunday ... 6=Saturday). */
  dayOfWeek: number;
  /** Specialty of this souk. */
  specialty: string;
}

export const SOUKS: SoukInfo[] = [
  { commune: 'El Attaf', wilaya: 'Aïn Defla', dayOfWeek: 5, specialty: 'Livestock + cereals' },
  { commune: 'M\'chedallah', wilaya: 'Bouira', dayOfWeek: 6, specialty: 'Vegetables + olive oil' },
  { commune: 'Theniet El Had', wilaya: 'Tiaret', dayOfWeek: 5, specialty: 'Sheep + cereals' },
  { commune: 'Sigus', wilaya: 'Oum El Bouaghi', dayOfWeek: 4, specialty: 'Cereals + livestock' },
  { commune: 'Boghni', wilaya: 'Tizi Ouzou', dayOfWeek: 4, specialty: 'Olive oil + honey' },
  { commune: 'Akbou', wilaya: 'Béjaïa', dayOfWeek: 1, specialty: 'Citrus + vegetables' },
  { commune: 'Berrouaghia', wilaya: 'Médéa', dayOfWeek: 4, specialty: 'Sheep + cereals' },
  { commune: 'Sidi Aïch', wilaya: 'Béjaïa', dayOfWeek: 5, specialty: 'Vegetables + fish' },
  { commune: 'Tadjena', wilaya: 'Chlef', dayOfWeek: 4, specialty: 'Cattle + citrus' },
  { commune: 'Ksar El Boukhari', wilaya: 'Médéa', dayOfWeek: 5, specialty: 'Sheep + cereals' },
  { commune: 'El Eulma', wilaya: 'Sétif', dayOfWeek: 5, specialty: 'Cereals + livestock' },
  { commune: 'Bir El Ater', wilaya: 'Tébessa', dayOfWeek: 5, specialty: 'Sheep + wool' },
  { commune: 'Laghouat Centre', wilaya: 'Laghouat', dayOfWeek: 5, specialty: 'Dates + livestock' },
  { commune: 'Touggourt Centre', wilaya: 'Touggourt', dayOfWeek: 5, specialty: 'Dates + vegetables' },
  { commune: 'Sidi Okba', wilaya: 'Biskra', dayOfWeek: 4, specialty: 'Dates + early vegetables' },
];

export function soukForDay(dayOfWeek: number): SoukInfo[] {
  return SOUKS.filter(s => s.dayOfWeek === dayOfWeek);
}

// ============================================================================
// 6. MARKET PRICE CALENDAR — typical wholesale price patterns (Marché de Gros)
// ============================================================================

export interface MarketPricePattern {
  crop: string;
  /** Localized label. */
  label: { en: string; fr: string; ar: string };
  /** Best selling months (month indices, 0=Jan). */
  bestMonths: number[];
  /** Worst selling months. */
  worstMonths: number[];
  /** Typical wholesale price band, DZD/kg. */
  priceBandDZD: [number, number];
  /** Peak-price month (highest historical average). */
  peakMonth: number;
  /** Low-price month (glut). */
  lowMonth: number;
  emoji: string;
}

export const MARKET_PRICE_PATTERNS: MarketPricePattern[] = [
  {
    crop: 'potato',
    label: { en: 'Potato', fr: 'Pomme de terre', ar: 'البطاطا' },
    bestMonths: [4, 5, 6, 7], // May–Aug (after winter storage ends)
    worstMonths: [9, 10, 11], // autumn harvest glut
    priceBandDZD: [40, 90],
    peakMonth: 5, // June — spring prices
    lowMonth: 10, // November — harvest glut
    emoji: '🥔',
  },
  {
    crop: 'tomato',
    label: { en: 'Tomato', fr: 'Tomate', ar: 'الطماطم' },
    bestMonths: [5, 6, 7, 8],
    worstMonths: [9, 10],
    priceBandDZD: [50, 130],
    peakMonth: 6,
    lowMonth: 9,
    emoji: '🍅',
  },
  {
    crop: 'onion',
    label: { en: 'Onion', fr: 'Oignon', ar: 'البصل' },
    bestMonths: [0, 1, 2, 11],
    worstMonths: [6, 7, 8],
    priceBandDZD: [60, 150],
    peakMonth: 1,
    lowMonth: 7,
    emoji: '🧅',
  },
  {
    crop: 'citrus',
    label: { en: 'Citrus', fr: 'Agrumes', ar: 'الحمضيات' },
    bestMonths: [0, 1, 11],
    worstMonths: [4, 5, 6],
    priceBandDZD: [40, 120],
    peakMonth: 4, // May — late orange scarcity
    lowMonth: 1,
    emoji: '🍊',
  },
  {
    crop: 'olive-oil',
    label: { en: 'Olive oil', fr: 'Huile d\'olive', ar: 'زيت الزيتون' },
    bestMonths: [10, 11, 0, 1],
    worstMonths: [5, 6, 7, 8],
    priceBandDZD: [800, 1400],
    peakMonth: 6, // July — end-of-stock
    lowMonth: 11, // Dec — fresh harvest
    emoji: '🫒',
  },
  {
    crop: 'datepalm',
    label: { en: 'Deglet Nour dates', fr: 'Dattes Deglet Nour', ar: 'تمر دڨلة نور' },
    bestMonths: [9, 10, 11],
    worstMonths: [3, 4, 5],
    priceBandDZD: [200, 400],
    peakMonth: 4, // May — pre-harvest scarcity
    lowMonth: 10, // November — harvest
    emoji: '🌴',
  },
  {
    crop: 'wheat',
    label: { en: 'Durum wheat', fr: 'Blé dur', ar: 'قمح صلب' },
    bestMonths: [4, 5, 6],
    worstMonths: [7, 8],
    priceBandDZD: [50, 75],
    peakMonth: 5, // June — pre-harvest
    lowMonth: 8, // Sept — post-harvest
    emoji: '🌾',
  },
  {
    crop: 'almond',
    label: { en: 'Almond', fr: 'Amande', ar: 'اللوز' },
    bestMonths: [11, 0, 1, 2],
    worstMonths: [7, 8, 9],
    priceBandDZD: [900, 1300],
    peakMonth: 7, // Aug — pre-harvest
    lowMonth: 9, // Oct — post-harvest
    emoji: '🌰',
  },
];

/** Returns the price-band position for the given month: 'low' | 'mid' | 'high'. */
export function priceTier(pattern: MarketPricePattern, monthIdx: number): 'low' | 'mid' | 'high' {
  if (pattern.bestMonths.includes(monthIdx)) return 'high';
  if (pattern.worstMonths.includes(monthIdx)) return 'low';
  return 'mid';
}

// ============================================================================
// 7. MOON PHASE — standard synodic period algorithm (Conway approximation)
// ============================================================================

export type MoonPhaseName =
  | 'new' | 'waxing-crescent' | 'first-quarter' | 'waxing-gibbous'
  | 'full' | 'waning-gibbous' | 'last-quarter' | 'waning-crescent';

export interface MoonPhase {
  /** Phase name. */
  name: MoonPhaseName;
  /** Localized label. */
  label: { en: string; fr: string; ar: string };
  /** Approximate illuminated fraction (0..1). */
  illumination: number;
  /** Emoji. */
  emoji: string;
  /** Traditional farming advice for this phase. */
  farmingAdvice: { en: string; fr: string; ar: string };
}

const MOON_PHASES: MoonPhase[] = [
  {
    name: 'new',
    label: { en: 'New moon', fr: 'Nouvelle lune', ar: 'محاق' },
    illumination: 0,
    emoji: '🌑',
    farmingAdvice: {
      en: 'Root crops sown now tend to develop well below ground.',
      fr: 'Semer les racines maintenant favorise le développement souterrain.',
      ar: 'زراعة المحاصيل الجذرية الآن يعزّز نموّ الجذور.',
    },
  },
  {
    name: 'waxing-crescent',
    label: { en: 'Waxing crescent', fr: 'Premier croissant', ar: 'هلال متزايد' },
    illumination: 0.25,
    emoji: '🌒',
    farmingAdvice: {
      en: 'Good for sowing leafy vegetables and above-ground crops.',
      fr: 'Bon pour semer les légumes feuilles et cultures aériennes.',
      ar: 'جيد لزراعة الخضروات الورقية والمحاصيل الهوائية.',
    },
  },
  {
    name: 'first-quarter',
    label: { en: 'First quarter', fr: 'Premier quartier', ar: 'التربيع الأول' },
    illumination: 0.5,
    emoji: '🌓',
    farmingAdvice: {
      en: 'Favorable for cereals and grafting.',
      fr: 'Favorable aux céréales et à la greffe.',
      ar: 'مواتي للحبوب والتطعيم.',
    },
  },
  {
    name: 'waxing-gibbous',
    label: { en: 'Waxing gibbous', fr: 'Gibbeuse croissante', ar: 'أحدب متزايد' },
    illumination: 0.75,
    emoji: '🌔',
    farmingAdvice: {
      en: 'Good for fruit development and foliar feeding.',
      fr: 'Bon pour le développement des fruits et pulvérisation foliaire.',
      ar: 'جيد لنمو الفاكهة والتغذية الورقية.',
    },
  },
  {
    name: 'full',
    label: { en: 'Full moon', fr: 'Pleine lune', ar: 'بدر' },
    illumination: 1,
    emoji: '🌕',
    farmingAdvice: {
      en: 'Avoid sowing; harvest above-ground crops for best quality.',
      fr: 'Éviter de semer ; récolter les cultures aériennes pour meilleure qualité.',
      ar: 'تجنّب البذار؛ احصد المحاصيل الهوائية لأفضل جودة.',
    },
  },
  {
    name: 'waning-gibbous',
    label: { en: 'Waning gibbous', fr: 'Gibbeuse décroissante', ar: 'أحدب متناقص' },
    illumination: 0.75,
    emoji: '🌖',
    farmingAdvice: {
      en: 'Good for pruning and weeding.',
      fr: 'Bon pour la taille et le désherbage.',
      ar: 'جيد للتقليم وإزالة الأعشاب.',
    },
  },
  {
    name: 'last-quarter',
    label: { en: 'Last quarter', fr: 'Dernier quartier', ar: 'التربيع الأخير' },
    illumination: 0.5,
    emoji: '🌗',
    farmingAdvice: {
      en: 'Time to prepare beds and apply compost.',
      fr: 'Préparer les planches et appliquer le compost.',
      ar: 'وقت تحضير الأحواض ووضع السماد العضوي.',
    },
  },
  {
    name: 'waning-crescent',
    label: { en: 'Waning crescent', fr: 'Dernier croissant', ar: 'هلال متناقص' },
    illumination: 0.25,
    emoji: '🌘',
    farmingAdvice: {
      en: 'Rest period — best for pest control and maintenance.',
      fr: 'Période de repos — bon pour la lutte anti-parasitaire et l\'entretien.',
      ar: 'فترة راحة — مناسبة لمكافحة الآفات والصيانة.',
    },
  },
];

/** Simple Conway-style moon-phase approximation (no external API). */
export function moonPhaseForDate(date: Date): MoonPhase {
  // Reference new moon: 1900-01-21
  const ref = new Date(Date.UTC(1900, 0, 21, 13, 50));
  const synodic = 29.530588853; // mean synodic month (days)
  const diffMs = date.getTime() - ref.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const cycles = diffDays / synodic;
  const phase = cycles - Math.floor(cycles); // 0..1
  const phaseIdx = Math.floor(phase * 8) % 8;
  return MOON_PHASES[phaseIdx];
}

// ============================================================================
// 8. RAMADAN ADJUSTMENT — shift task windows earlier in the day
// ============================================================================

/** Approximate Ramadan start dates (Hijri → Gregorian approximation). */
export const RAMADAN_START_DATES: { year: number; startDate: string }[] = [
  { year: 2025, startDate: '2025-03-01' },
  { year: 2026, startDate: '2026-02-20' },
  { year: 2027, startDate: '2027-02-10' },
  { year: 2028, startDate: '2028-01-31' },
  { year: 2029, startDate: '2029-01-21' },
  { year: 2030, startDate: '2030-01-11' },
];

/** Returns Ramadan window for a given year (start, end = start + 29 days). */
export function ramadanWindow(year: number): { start: Date; end: Date } | null {
  const entry = RAMADAN_START_DATES.find(r => r.year === year);
  if (!entry) return null;
  const start = new Date(entry.startDate + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 29);
  return { start, end };
}

/** Returns true if the given date falls in Ramadan. */
export function isRamadan(date: Date): boolean {
  const year = date.getFullYear();
  const w1 = ramadanWindow(year);
  const w2 = ramadanWindow(year + 1); // for Dec dates that may belong to next year's Ramadan
  if (w1 && date >= w1.start && date <= w1.end) return true;
  if (w2 && date >= w2.start && date <= w2.end) return true;
  return false;
}

/** Suggested work-window adjustments during Ramadan. */
export function ramadanWorkShift(): { start: string; end: string; note: { en: string; fr: string; ar: string } } {
  return {
    start: '06:00',
    end: '13:00',
    note: {
      en: 'Shift field work to early morning. Avoid spraying during fasting hours if workers are observant.',
      fr: 'Déplacer le travail des champs en début de matinée. Éviter les pulvérisations pendant les heures de jeûne.',
      ar: 'أحِل عمل الحقل إلى الصباح الباكر. تجنّب الرش أثناء ساعات الصيام.',
    },
  };
}

// ============================================================================
// 9. BBCH STAGE SHORTCUTS — per-crop simplified phenology
// ============================================================================

export interface BBCHStage {
  code: string;
  name: string;
  nameAr: string;
  emoji: string;
  /** Recommended operations. */
  ops: string[];
}

export const BBCH_STAGES: Record<string, BBCHStage[]> = {
  wheat: [
    { code: '00-09', name: 'Germination & emergence', nameAr: 'الإنبات والظهور', emoji: '🌱', ops: ['Check stand density', 'Apply pre-em herbicide if missed'] },
    { code: '10-19', name: 'Seedling (3 leaves)', nameAr: 'البادرات (3 أوراق)', emoji: '🌿', ops: ['Weed scout', 'Apply early herbicide'] },
    { code: '20-29', name: 'Tillering', nameAr: 'التفريع', emoji: '🌾', ops: ['N top-dressing', 'Monitor aphids'] },
    { code: '30-39', name: 'Stem elongation', nameAr: 'استطالة الساق', emoji: '📈', ops: ['Apply growth regulator', 'Fungicide T1'] },
    { code: '40-49', name: 'Booting', nameAr: 'التسنبل', emoji: '🍃', ops: ['Fungicide T2'] },
    { code: '50-59', name: 'Heading', nameAr: 'الرؤوس', emoji: '🌾', ops: ['Fungicide T3 (ear)'] },
    { code: '60-69', name: 'Flowering', nameAr: 'الإزهار', emoji: '🌼', ops: ['Fusarium monitoring'] },
    { code: '70-79', name: 'Milk development', nameAr: 'تكوّن الحليب', emoji: '🥛', ops: ['Stop irrigation'] },
    { code: '80-89', name: 'Dough development', nameAr: 'تكوّن العجينة', emoji: '🟡', ops: ['Pre-harvest scout'] },
    { code: '90-99', name: 'Ripening & harvest', nameAr: 'النضج والحصاد', emoji: '🌾', ops: ['Harvest at <14% moisture'] },
  ],
  citrus: [
    { code: '00-09', name: 'Bud dormancy', nameAr: 'سكون البرعم', emoji: '😴', ops: ['Pruning', 'Dormant oil spray'] },
    { code: '50-59', name: 'Bud break & inflorescence', nameAr: 'تفتّح البرعم والإزهار', emoji: '🌼', ops: ['Bee protection', 'Foliar B'] },
    { code: '60-69', name: 'Flowering', nameAr: 'الإزهار', emoji: '🌼', ops: ['Avoid spraying during bloom'] },
    { code: '70-79', name: 'Fruit set', nameAr: 'العقد', emoji: '🍊', ops: ['Foliar N + Ca', 'Fruit-drop monitor'] },
    { code: '80-89', name: 'Fruit development', nameAr: 'نمو الثمرة', emoji: '🍊', ops: ['Irrigation peak', 'Citrus leafminer scout'] },
    { code: '90-99', name: 'Maturation', nameAr: 'النضج', emoji: '🍊', ops: ['Harvest', 'Maturity index'] },
  ],
  olive: [
    { code: '00-09', name: 'Bud dormancy', nameAr: 'سكون البرعم', emoji: '😴', ops: ['Pruning', 'Soil amendment'] },
    { code: '50-59', name: 'Inflorescence emergence', nameAr: 'ظهور النورة', emoji: '🌼', ops: ['Foliar B', 'Avoid spray on bloom'] },
    { code: '60-69', name: 'Flowering', nameAr: 'الإزهار', emoji: '🌼', ops: ['Olive-fly trap deployment'] },
    { code: '70-79', name: 'Fruit set', nameAr: 'العقد', emoji: '🫒', ops: ['Monitor fruit drop'] },
    { code: '80-89', name: 'Pit hardening', nameAr: 'تصلّب النواة', emoji: '🫒', ops: ['Olive-fly threshold check'] },
    { code: '90-99', name: 'Veraison & harvest', nameAr: 'النضج والحصاد', emoji: '🫒', ops: ['Harvest (table → early, oil → late)'] },
  ],
  potato: [
    { code: '00-09', name: 'Sprouting', nameAr: 'الإنبات', emoji: '🌱', ops: ['Pre-em herbicide', 'Ridging'] },
    { code: '10-19', name: 'Emergence', nameAr: 'الظهور', emoji: '🌿', ops: ['Soil scout', 'Early blight monitor'] },
    { code: '20-29', name: 'Canopy development', nameAr: 'نمو المجموع الخضري', emoji: '🌱', ops: ['Fungicide (Smith period)'] },
    { code: '30-39', name: 'Tuber initiation', nameAr: 'تكوّن الدرنات', emoji: '🥔', ops: ['Hilling', 'Pest scout (aphids)'] },
    { code: '40-49', name: 'Tuber bulking', nameAr: 'تضخّم الدرنات', emoji: '🥔', ops: ['Irrigation peak', 'Late blight spray'] },
    { code: '90-99', name: 'Senescence & harvest', nameAr: 'الشيخوخة والحصاد', emoji: '🥔', ops: ['Skin set', 'Harvest'] },
  ],
};

// ============================================================================
// 10. TANK MIX COMPATIBILITY — simplified matrix
// ============================================================================

export type CompatibilityResult = 'compatible' | 'caution' | 'incompatible' | 'unknown';

/** Simplified tank-mix matrix — for full checks consult product label. */
const TANK_MIX_MATRIX: Record<string, Record<string, CompatibilityResult>> = {
  'mancozeb': {
    'copper': 'compatible',
    'chlorpyrifos': 'compatible',
    'mineral-oil': 'compatible',
    'sulphur': 'caution', // can burn at high temps
    'calcium-nitrate': 'incompatible', // precipitates
  },
  'copper': {
    'mineral-oil': 'incompatible', // phytotoxicity
    'sulphur': 'incompatible',
    'calcium-nitrate': 'compatible',
  },
  'abamectin': {
    'mineral-oil': 'compatible',
    'mancozeb': 'compatible',
    'copper': 'caution',
  },
  'azadirachtin': {
    'mineral-oil': 'compatible',
    'bacillus-thuringiensis': 'compatible',
    'copper': 'compatible',
  },
  'glyphosate': {
    'mancozeb': 'incompatible',
    'mineral-oil': 'caution',
  },
};

export function checkTankMix(a: string, b: string): CompatibilityResult {
  const aKey = a.toLowerCase().trim();
  const bKey = b.toLowerCase().trim();
  const r1 = TANK_MIX_MATRIX[aKey]?.[bKey];
  const r2 = TANK_MIX_MATRIX[bKey]?.[aKey];
  return r1 ?? r2 ?? 'unknown';
}

// ============================================================================
// 11. PRE-HARVEST INTERVAL DATABASE (DAR — Délai Avant Récolte)
// ============================================================================

export interface PHIData {
  activeMatter: string;
  /** DAR in days. */
  darDays: number;
  /** Crop restriction (if specific). */
  cropRestriction?: string;
  /** Source label. */
  source: string;
}

export const PHI_DATABASE: PHIData[] = [
  { activeMatter: 'mancozeb', darDays: 7, source: 'INPV 2017' },
  { activeMatter: 'chlorpyrifos', darDays: 21, cropRestriction: 'tomato', source: 'INPV 2017' },
  { activeMatter: 'chlorpyrifos', darDays: 30, cropRestriction: 'citrus', source: 'INPV 2017' },
  { activeMatter: 'deltamethrin', darDays: 7, source: 'INPV 2017' },
  { activeMatter: 'lambda-cyhalothrin', darDays: 14, source: 'INPV 2017' },
  { activeMatter: 'abamectin', darDays: 14, source: 'INPV 2017' },
  { activeMatter: 'spirotetramat', darDays: 7, source: 'INPV 2017' },
  { activeMatter: 'pyriproxyfen', darDays: 14, source: 'INPV 2017' },
  { activeMatter: 'metalaxyl-m', darDays: 14, source: 'INPV 2017' },
  { activeMatter: 'copper-hydroxide', darDays: 3, source: 'INPV 2017' },
  { activeMatter: 'azadirachtin', darDays: 3, source: 'Biopesticide — organic compatible' },
  { activeMatter: 'spinosad', darDays: 7, source: 'INPV 2017' },
  { activeMatter: 'imidacloprid', darDays: 21, source: 'INPV 2017' },
  { activeMatter: 'glyphosate', darDays: 7, source: 'INPV 2017' },
  { activeMatter: 'dimethoate', darDays: 21, source: 'INPV 2017' },
];

/** Look up DAR for an active matter (optionally crop-specific). */
export function darFor(activeMatter: string, crop?: string): number | null {
  const lower = activeMatter.toLowerCase().trim();
  // Prefer crop-specific entry if crop provided
  if (crop) {
    const specific = PHI_DATABASE.find(p =>
      p.activeMatter === lower && p.cropRestriction === crop.toLowerCase()
    );
    if (specific) return specific.darDays;
  }
  const general = PHI_DATABASE.find(p => p.activeMatter === lower && !p.cropRestriction);
  return general?.darDays ?? null;
}

// ============================================================================
// 12. WORKER & EQUIPMENT SCHEDULING
// ============================================================================

export interface Equipment {
  id: string;
  name: string;
  nameAr: string;
  /** Capacity (ha/day). */
  capacityHaPerDay: number;
  emoji: string;
}

export const EQUIPMENT_CATALOG: Equipment[] = [
  { id: 'tractor-60hp', name: 'Tractor 60 HP', nameAr: 'جرار 60 حصان', capacityHaPerDay: 3, emoji: '🚜' },
  { id: 'tractor-90hp', name: 'Tractor 90 HP', nameAr: 'جرار 90 حصان', capacityHaPerDay: 5, emoji: '🚜' },
  { id: 'boom-sprayer-12m', name: 'Boom sprayer 12 m', nameAr: 'رشاشة 12م', capacityHaPerDay: 20, emoji: '💦' },
  { id: 'combine-harvester', name: 'Combine harvester', nameAr: 'حصّادة', capacityHaPerDay: 8, emoji: '🌾' },
  { id: 'drip-line-laying', name: 'Drip-line layer', nameAr: 'ناشر التنقيط', capacityHaPerDay: 1.5, emoji: '💧' },
  { id: 'seed-drill', name: 'Seed drill', nameAr: 'بذّارة', capacityHaPerDay: 6, emoji: '🌱' },
];

/** Detect scheduling conflicts: returns overlapping tasks. */
export interface ScheduleConflict {
  taskA: string;
  taskB: string;
  reason: string;
}

export function detectConflicts(
  bookings: Array<{ id: string; taskId: string; equipmentId: string; date: string; hoursNeeded: number }>
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  for (let i = 0; i < bookings.length; i++) {
    for (let j = i + 1; j < bookings.length; j++) {
      const a = bookings[i];
      const b = bookings[j];
      if (a.equipmentId === b.equipmentId && a.date === b.date) {
        conflicts.push({
          taskA: a.taskId,
          taskB: b.taskId,
          reason: `Same equipment ${a.equipmentId} booked twice on ${a.date}`,
        });
      }
    }
  }
  return conflicts;
}

// ============================================================================
// 13. AI TASK GENERATOR — preset field profiles
// ============================================================================

export interface FieldProfile {
  id: string;
  label: { en: string; fr: string; ar: string };
  cropId: string;
  area: number;
  zone: AgroClimaticZone;
  irrigation: 'drip' | 'sprinkler' | 'furrow' | 'rainfed';
  soil: string;
  description: { en: string; fr: string; ar: string };
}

export const FIELD_PROFILES: FieldProfile[] = [
  {
    id: 'mitidja-citrus',
    label: { en: 'Citrus in Mitidja (drip, sandy-loam)', fr: 'Agrumes en Mitidja (goutte-à-goutte, sablo-limoneux)', ar: 'حمضيات في المتيجة (تنقيط، رملي طيني)' },
    cropId: 'citrus',
    area: 3,
    zone: 'tell',
    irrigation: 'drip',
    soil: 'Sandy-loam',
    description: {
      en: '3 ha citrus orchard in Blida plain, drip-irrigated, sandy-loam soil. Standard local configuration.',
      fr: '3 ha d\'agrumes en plaine de Blida, irrigation au goutte-à-goutte, sol sablo-limoneux.',
      ar: '3 هكتار حمضيات في سهل البليدة، ري بالتنقيط، تربة رملي-طيني.',
    },
  },
  {
    id: 'hauts-plateaux-wheat',
    label: { en: 'Durum wheat in Sétif (rainfed, calcareous)', fr: 'Blé dur à Sétif (bour, calcaire)', ar: 'قمح صلب في سطيف (بوري، كلسي)' },
    cropId: 'wheat',
    area: 20,
    zone: 'hauts_plateaux',
    irrigation: 'rainfed',
    soil: 'Calcareous',
    description: {
      en: '20 ha durum wheat in Sétif, rainfed, calcareous soil, typical Hauts Plateaux rotation.',
      fr: '20 ha de blé dur à Sétif, en bour, sol calcaire. Rotation typique des Hauts Plateaux.',
      ar: '20 هكتار قمح صلب في سطيف، بوري، تربة كلسية. دورة نموذجية للهضاب العليا.',
    },
  },
  {
    id: 'sahara-datepalm',
    label: { en: 'Date palm in Ouargla (basin, sandy)', fr: 'Palmier dattier à Ouargla (bassin, sableux)', ar: 'نخيل التمر في ورقلة (حوض، رملي)' },
    cropId: 'datepalm',
    area: 5,
    zone: 'sahara',
    irrigation: 'drip',
    soil: 'Sandy',
    description: {
      en: '5 ha date palm in Ouargla basin, sandy soil, drip-irrigated, Deglet Nour variety.',
      fr: '5 ha de palmier dattier à Ouargla, sol sableux, goutte-à-goutte, variété Deglet Nour.',
      ar: '5 هكتار نخيل في ورقلة، تربة رملية، ري بالتنقيط، صنف دڨلة نور.',
    },
  },
  {
    id: 'tell-tomato',
    label: { en: 'Tomato in Chlef (drip, alluvial)', fr: 'Tomate à Chlef (goutte-à-goutte, alluvial)', ar: 'طماطم في الشلف (تنقيط، غريني)' },
    cropId: 'tomato',
    area: 2,
    zone: 'tell',
    irrigation: 'drip',
    soil: 'Alluvial',
    description: {
      en: '2 ha processing tomato in Chlef plain, drip-irrigated, alluvial soil.',
      fr: '2 ha de tomate industrielle à Chlef, goutte-à-goutte, sol alluvial.',
      ar: '2 هكتار طماطم صناعية في الشلف، تنقيط، تربة غرينية.',
    },
  },
];

// ============================================================================
// 14. SEASON-LONG PREVENTIVE CALENDAR — month-by-month preventive tasks
// ============================================================================

export interface PreventiveTask {
  month: number; // 0=Jan
  zone: AgroClimaticZone | 'all';
  task: { en: string; fr: string; ar: string };
  category: 'soil' | 'pest_monitoring' | 'irrigation' | 'fertilization' | 'pruning' | 'harvest_prep' | 'equipment';
  emoji: string;
}

export const PREVENTIVE_CALENDAR: PreventiveTask[] = [
  // January
  { month: 0, zone: 'all', category: 'pruning', emoji: '✂️', task: { en: 'Prune deciduous fruit trees (apple, almond, vine) while dormant', fr: 'Tailler les arbres fruitiers caducs (pommier, amandier, vigne) en dormance', ar: 'تقليم الأشجار المثمرة النفضية (التفاح، اللوز، الكروم) في فترة السكون' } },
  { month: 0, zone: 'hauts_plateaux', category: 'equipment', emoji: '🚜', task: { en: 'Service tractors and harvesters before spring workload', fr: 'Réviser tracteurs et moissonneuses avant la charge printanière', ar: 'صيانة الجرارات والحصّادات قبل موسم الربيع' } },
  // February
  { month: 1, zone: 'hauts_plateaux', category: 'pest_monitoring', emoji: '❄️', task: { en: 'Monitor frost forecasts nightly for almond/apricot bloom', fr: 'Surveiller les prévisions de gel nocturne pour floraison amandier/abricotier', ar: 'مراقبة توقعات الصقيع الليلي لإزهار اللوز والمشمش' } },
  { month: 1, zone: 'tell', category: 'fertilization', emoji: '🌱', task: { en: 'Apply pre-plant basal NPK for early potato and vegetable crops', fr: 'Apporter NPK de fond pour pomme de terre et légumes précoces', ar: 'تطبيق NPK أساسي للبطاطا والخضروات المبكرة' } },
  // March
  { month: 2, zone: 'all', category: 'soil', emoji: '🧪', task: { en: 'Take soil samples for analysis before spring planting', fr: 'Prélever des échantillons de sol pour analyse avant plantations printanières', ar: 'أخذ عينات التربة للتحليل قبل الزراعة الربيعية' } },
  { month: 2, zone: 'hauts_plateaux', category: 'pest_monitoring', emoji: '🦗', task: { en: 'Begin locust ground surveys (CLAAVO bulletin)', fr: 'Commencer les prospections acridiennes (bulletin CLAAVO)', ar: 'بدء مسوحات الجراد الأرضية (نشرة CLAAVO)' } },
  // April
  { month: 3, zone: 'all', category: 'irrigation', emoji: '💧', task: { en: 'Test drip system uniformity before peak demand', fr: 'Tester l\'uniformité du goutte-à-goutte avant la pointe', ar: 'اختبار تجانس التنقيط قبل ذروة الطلب' } },
  { month: 3, zone: 'tell', category: 'pest_monitoring', emoji: '🍄', task: { en: 'Set up Smith-period monitoring for potato late blight', fr: 'Mettre en place le suivi Smith pour mildou pomme de terre', ar: 'إعداد مراقبة فترة سميث للفحة البطاطا' } },
  // May
  { month: 4, zone: 'tell', category: 'pest_monitoring', emoji: '🪰', task: { en: 'Deploy olive-fly pheromone traps in orchards', fr: 'Disposer les pièges à phéromone pour mouche de l\'olive', ar: 'نصب مصائد الفيرومون لذبابة الزيتون' } },
  { month: 4, zone: 'all', category: 'fertilization', emoji: '🟢', task: { en: 'Apply side-dress N to cereals at stem elongation (BBCH 30-32)', fr: 'Apporter l\'azote de couverture au stade montaison (BBCH 30-32)', ar: 'تطبيق النيتروجين الجانبي للحبوب في مرحلة الاستطالة (BBCH 30-32)' } },
  // June
  { month: 5, zone: 'all', category: 'irrigation', emoji: '🌊', task: { en: 'Peak ET — check pump capacity and filter cleanliness weekly', fr: 'Pic d\'ET — vérifier pompe et filtres chaque semaine', ar: 'ذروة ET — افحص المضخة والفلاتر أسبوعياً' } },
  { month: 5, zone: 'tell', category: 'harvest_prep', emoji: '🌾', task: { en: 'Service combine harvester for cereal harvest', fr: 'Préparer la moissonneuse-batteuse pour moisson', ar: 'تحضير الحصّادة لموسم الحصاد' } },
  // July
  { month: 6, zone: 'hauts_plateaux', category: 'harvest_prep', emoji: '🌾', task: { en: 'Monitor grain moisture (target <14% for storage)', fr: 'Surveiller l\'humidité du grain (cible <14%)', ar: 'مراقبة رطوبة الحبوب (الهدف <14%)' } },
  { month: 6, zone: 'sahara', category: 'pest_monitoring', emoji: '🌴', task: { en: 'Inspect date palms for bayoud symptoms in valley oases', fr: 'Inspecter les palmiers pour symptômes du bayoud dans les vallées oasisiennes', ar: 'فحص النخيل لأعراض البيوض في الواحات' } },
  // August
  { month: 7, zone: 'all', category: 'soil', emoji: '🌾', task: { en: 'Plan cover-crop seeding for post-harvest soil cover', fr: 'Planifier les cultures intermédiaires post-récolte', ar: 'تخطيط المحاصيل المغطية بعد الحصاد' } },
  { month: 7, zone: 'sahara', category: 'harvest_prep', emoji: '🌴', task: { en: 'Prepare date harvest: gather bins, ladders, labour', fr: 'Préparer récolte des dattes : paniers, échelles, main-d\'œuvre', ar: 'تحضير حصاد التمر: سلال، سلالم، عمال' } },
  // September
  { month: 8, zone: 'tell', category: 'pest_monitoring', emoji: '🐞', task: { en: 'Monitor citrus scale populations on maturing fruit', fr: 'Surveiller les cochenilles des agrumes sur fruits en maturation', ar: 'مراقبة حشرات القشور على الحمضيات الناضجة' } },
  { month: 8, zone: 'all', category: 'equipment', emoji: '🔧', task: { en: 'Post-summer equipment maintenance (oil, filters, blades)', fr: 'Maintenance post-été (huile, filtres, lames)', ar: 'صيانة ما بعد الصيف (زيت، فلاتر، شفرات)' } },
  // October
  { month: 9, zone: 'tell', category: 'fertilization', emoji: '🌾', task: { en: 'Order certified cereal seed for autumn sowing (deadline Aug — verify)', fr: 'Commander les semences certifiées pour semis automnal', ar: 'طلب بذور الحبوب المعتمدة للزراعة الخريفية' } },
  { month: 9, zone: 'hauts_plateaux', category: 'soil', emoji: '🌱', task: { en: 'Begin primary tillage for cereal sowing', fr: 'Commencer le labour principal pour semis céréalier', ar: 'بدء الحراثة الأساسية لزراعة الحبوب' } },
  // November
  { month: 10, zone: 'all', category: 'harvest_prep', emoji: '🫒', task: { en: 'Olive harvest — schedule pickers and press appointment', fr: 'Récolte olives — planifier cueilleurs et rendez-vous moulin', ar: 'حصاد الزيتون — جدولة القاطفين وموعد المعصرة' } },
  { month: 10, zone: 'tell', category: 'soil', emoji: '🌱', task: { en: 'Sow durum wheat before soil temperature drops below 12°C', fr: 'Semer le blé dur avant que T° sol descende sous 12°C', ar: 'زراعة القمح الصلب قبل انخفاض حرارة التربة عن 12°م' } },
  // December
  { month: 11, zone: 'all', category: 'equipment', emoji: '🚜', task: { en: 'Winterize irrigation system: drain pipes, store pumps indoors', fr: 'Hiverner le système d\'irrigation: vidanger, stocker pompes', ar: 'تجهيز النظام الشتوي: تفريغ الأنابيب وتخزين المضخات' } },
  { month: 11, zone: 'sahara', category: 'pruning', emoji: '🌴', task: { en: 'Prune date palm dead fronds and remove offshoots', fr: 'Tailler les palmes mortes et retirer les rejets du palmier dattier', ar: 'تقليم سعف النخيل الميت وإزالة الفسائل' } },
];

// ============================================================================
// 15. CROP ROTATION MULTI-YEAR — recommended sequences per zone
// ============================================================================

export interface RotationPlan {
  zone: AgroClimaticZone;
  years: { year: number; crop: string; rationale: string }[];
  totalYears: number;
  notes: { en: string; fr: string; ar: string };
}

export const ROTATION_PLANS: RotationPlan[] = [
  {
    zone: 'hauts_plateaux',
    totalYears: 4,
    years: [
      { year: 1, crop: 'Durum wheat', rationale: 'High-value cash crop, deep roots open soil' },
      { year: 2, crop: 'Food legume (chickpea / lentil)', rationale: 'N-fixation (~40 kg N/ha), breaks cereal disease cycle' },
      { year: 3, crop: 'Barley', rationale: 'Lower N demand, tolerates lower rainfall' },
      { year: 4, crop: 'Fallow or forage (vetch-oat)', rationale: 'Soil rest + organic matter build-up' },
    ],
    notes: {
      en: 'Classic 4-year Hauts Plateaux rotation. Maximizes durum wheat yield in year 1 thanks to legume N credit from year 2.',
      fr: 'Rotation classique 4 ans des Hauts Plateaux. Maximise le rendement blé dur (an 1) grâce au crédit d\'azote de la légumineuse (an 2).',
      ar: 'دورة 4 سنوات كلاسيكية للهضاب العليا. تعظم إنتاجية القمح الصلب (س1) بفضل نيتروجين البقوليات (س2).',
    },
  },
  {
    zone: 'tell',
    totalYears: 3,
    years: [
      { year: 1, crop: 'Potato', rationale: 'High-value, deep tillage breaks compaction' },
      { year: 2, crop: 'Wheat', rationale: 'Stabilizes soil, less disease with potato preceding' },
      { year: 3, crop: 'Food legume or forage', rationale: 'N-fixation, soil cover' },
    ],
    notes: {
      en: '3-year Tell rotation. Potato leaves loose, weed-free soil ideal for wheat sowing.',
      fr: 'Rotation 3 ans du Tell. La pomme de terre laisse un sol meuble et propre, idéal pour semer le blé.',
      ar: 'دورة 3 سنوات للتل. تترك البطاطا تربة مفككة ونظيفة، مثالية لزراعة القمح.',
    },
  },
  {
    zone: 'sahara',
    totalYears: 5,
    years: [
      { year: 1, crop: 'Date palm (establishment)', rationale: 'Long-term perennial; intercrop in years 1-4' },
      { year: 2, crop: 'Inter-row: tomato / pepper', rationale: 'Use inter-row space before palm canopy closes' },
      { year: 3, crop: 'Inter-row: barley / alfalfa', rationale: 'Soil cover + forage' },
      { year: 4, crop: 'Inter-row: alfalfa (continued)', rationale: 'N-fixation, hay, soil-building' },
      { year: 5, crop: 'Date palm (full production)', rationale: 'Intercropping ends; dates are main crop' },
    ],
    notes: {
      en: 'Sahara 5-year plan: date palm establishment with intercropping. Most profitable long-term.',
      fr: 'Plan 5 ans Sahara : establishment du palmier avec cultures intercalaires. Le plus rentable à long terme.',
      ar: 'خطة 5 سنوات صحراوية: تأسيس النخيل مع زراعة بينية. الأكثر ربحية على المدى الطويل.',
    },
  },
];

// ============================================================================
// 16. SAMPLE EXPORT HELPERS — weekly print view
// ============================================================================

export function formatWeekRange(weekStart: Date): { range: string; days: Date[] } {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  const start = days[0];
  const end = days[6];
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
  return {
    range: `${start.toLocaleDateString('en-GB', opts)} – ${end.toLocaleDateString('en-GB', opts)}`,
    days,
  };
}

// ============================================================================
// 17. WORKER ROLE — for labor scheduler
// ============================================================================

export interface WorkerRole {
  id: string;
  label: { en: string; fr: string; ar: string };
  hourlyRateDZD: number;
  emoji: string;
}

export const WORKER_ROLES: WorkerRole[] = [
  { id: 'general', label: { en: 'General field worker', fr: 'Ouvrier agricole', ar: 'عامل ميداني عام' }, hourlyRateDZD: 400, emoji: '👷' },
  { id: 'sprayer', label: { en: 'Certified sprayer operator', fr: 'Pulvérisateur certifié', ar: 'رشّاش معتمد' }, hourlyRateDZD: 700, emoji: '💦' },
  { id: 'tractor-driver', label: { en: 'Tractor driver', fr: 'Chauffeur de tracteur', ar: 'سائق جرار' }, hourlyRateDZD: 600, emoji: '🚜' },
  { id: 'pruner', label: { en: 'Skilled pruner (trees / vine)', fr: 'Tailleur spécialisé', ar: 'مقلّم مختص' }, hourlyRateDZD: 800, emoji: '✂️' },
  { id: 'harvester', label: { en: 'Harvest hand', fr: 'Cueilleur', ar: 'قطّاف' }, hourlyRateDZD: 500, emoji: '🧺' },
];
