/**
 * Algeria Advanced Agricultural Intelligence Dataset
 * 
 * Includes:
 * 1. Deep Hydro-Geology & Aquifers (Continental Intercalaire, Complexe Terminal, Tellian Basins)
 * 2. National Strategic Concession Poles & Mega-Perimeters (ODAS, ONTA, Pivot Cereal belts, Baladna dairy)
 * 3. Agro-Meteorological Risk Matrix (Frost Risk, Sirocco/Chehili surge factor, Chilling hours vernalization)
 * 4. Sentinel-2 NDVI Time Series & Standardized Precipitation Drought Index (SPI)
 * 5. Soil Lab Calibration Matrix with Local Fertilizer Formulations (TSP, Urea, Sulfate, MAP)
 */

import { type Language } from '@/lib/language-store';

export interface AquiferSystem {
  id: string;
  name: { en: string; ar: string; fr: string };
  code: string;
  type: 'deep_fossil' | 'alluvial_shallow' | 'karstic_limestone' | 'coastal_phreatic';
  depthRangeMeters: [number, number];
  waterSalinityGPerL: number; // Mineralization in g/l (TDS)
  waterECwDsm: number; // Electrical conductivity dS/m
  pumpingCostDzdM3: number; // Approximate extraction cost (DA / m3)
  drillingCostPerMeterDzd: number;
  coverageWilayas: number[]; // Wilaya codes
  rechargeStatus: 'non_renewable' | 'seasonal_recharge' | 'regulated_dam_fed';
  description: { en: string; ar: string; fr: string };
  agriRecommendation: { en: string; ar: string; fr: string };
}

export const ALGERIA_AQUIFER_SYSTEMS: AquiferSystem[] = [
  {
    id: 'continental_intercalaire',
    name: {
      en: 'Continental Intercalaire (Albian Deep Sandstones)',
      ar: 'المائدة القارية المتداخلة (الألبيان العريق)',
      fr: 'Continental Intercalaire (Grès de l’Albien)',
    },
    code: 'CI-ALBIEN',
    type: 'deep_fossil',
    depthRangeMeters: [800, 2200],
    waterSalinityGPerL: 1.8,
    waterECwDsm: 2.8,
    pumpingCostDzdM3: 4.5,
    drillingCostPerMeterDzd: 18000,
    coverageWilayas: [1, 30, 39, 47, 49, 50, 52, 53, 58], // Adrar, Ouargla, El Oued, Ghardaia, Timimoun, etc.
    rechargeStatus: 'non_renewable',
    description: {
      en: 'Colossal fossil groundwater reserve spanning over 600,000 km² beneath the Sahara desert. High artesian pressure in certain sectors; thermal water (45–60°C) requiring cooling towers before pivot irrigation.',
      ar: 'مخزون مياه أحفوري هائل يمتد على مساحة تتجاوز 600 ألف كم² تحت رمال الصحراء. يتميز بضغط ارتوازي وحرارة مرتفعة (45-60°م) تتطلب أبراج تبريد قبل سقي الرشاشات المحورية.',
      fr: 'Réserve fossile colossale de plus de 600 000 km². Eau géothermale (45–60°C) nécessitant un dégazage et tours de refroidissement avant l’aspersion sous pivots.',
    },
    agriRecommendation: {
      en: 'Ideal for large-scale pivot wheat, barley, and alfalfa fodder. Requires gypsum or phosphatic conditioning to balance high sodium adsorption ratio (SAR).',
      ar: 'مثالي للقمح والشعير والأعلاف تحت الرشاشات المحورية. يوصى بمعاملة التربة بالجبس الفوسفاتي لتعديل نسبة امتزاز الصوديوم (SAR).',
      fr: 'Idéal pour le blé sous pivot, l’orge et la luzerne. Traitement au phosphogypse recommandé pour stabiliser le SAR.',
    },
  },
  {
    id: 'complexe_terminal',
    name: {
      en: 'Complexe Terminal (Upper Neogene / Senonian Limestone)',
      ar: 'المركب النهائي (الكلس والرمال النيوجينية)',
      fr: 'Complexe Terminal (Calcaires et Sables Sénoniens)',
    },
    code: 'CT-NEOGENE',
    type: 'deep_fossil',
    depthRangeMeters: [120, 450],
    waterSalinityGPerL: 3.6,
    waterECwDsm: 5.2,
    pumpingCostDzdM3: 3.2,
    drillingCostPerMeterDzd: 12000,
    coverageWilayas: [7, 39, 51, 57], // Biskra, El Oued, Ouled Djellal, El M'Ghair
    rechargeStatus: 'non_renewable',
    description: {
      en: 'Primary water source fueling the massive date palm groves and greenhouse vegetable boom in the Ziban and Oued Souf basins. Highly mineralized, requiring leaching fractions.',
      ar: 'المصدر الرئيسي لغابات النخيل وبيوت الخضار البلاستيكية في الزيبان ووادي سوف. مياه متمعدنة بكثافة تتطلب إدارة محكمة لغسيل الأملاح.',
      fr: 'Nappe stratégique alimentant la phoeniciculture des Ziban et serres du Souf. Forte minéralisation exigeant une fraction de lessivage.',
    },
    agriRecommendation: {
      en: 'Suited for Deglet Nour dates, greenhouse tomatoes, and peppers. Frequent drainage monitoring needed to prevent salt crust formation.',
      ar: 'مناسب لتمور دقلة نور، طماطم وفلفل البيوت المحمية. يتطلب شبكات صرف لمنع تراكم القشرة الملحية.',
      fr: 'Parfait pour le palmier et primeurs sous serre. Suivi rigoureux du drainage requis.',
    },
  },
  {
    id: 'mitidja_alluvial',
    name: {
      en: 'Mitidja & Coastal Alluvial Aquifers (Quaternary Alluvium)',
      ar: 'المائدة الغرينية الساحلية لمتيجة والساحل',
      fr: 'Nappe Alluviale de la Mitidja & Plaines Côtières',
    },
    code: 'ALLUV-MITIDJA',
    type: 'alluvial_shallow',
    depthRangeMeters: [30, 110],
    waterSalinityGPerL: 0.65,
    waterECwDsm: 1.1,
    pumpingCostDzdM3: 1.8,
    drillingCostPerMeterDzd: 7000,
    coverageWilayas: [9, 16, 35, 42, 44, 21, 23], // Blida, Alger, Boumerdes, Tipaza, Ain Defla, Skikda, Annaba
    rechargeStatus: 'seasonal_recharge',
    description: {
      en: 'Rich, freshwater alluvial water tables regularly replenished by mountain runoff from the Blidean Atlas and Dahra ranges. Low salinity, optimal for citrus, viticulture, and early market garden crops.',
      ar: 'فرشات مائية عذبة متجددة بفضل سيول أطلس البليدة والظهرة. ملوحة منخفضة جداً ومثالية للحمضيات والكروم والخضروات المكثفة.',
      fr: 'Nappe alluviale d’eau douce rechargée par l’Atlas Blidéen. Faible salinité, idéale pour les agrumes, vignobles et maraîchage.',
    },
    agriRecommendation: {
      en: 'Perfect water quality for micro-fertigation and acid injection. Nitrate protection zones recommended near intensive livestock farms.',
      ar: 'جودة مياه ممتازة للتسميد بالري والحقن الحمضي. يُنصح بحماية الآبار من تسرب النترات في محيط مزارع الأبقار.',
      fr: 'Excellente qualité pour la fertigation et l’injection acide. Préserver des nitrates.',
    },
  },
  {
    id: 'high_plateaus_karstic',
    name: {
      en: 'High Plateaus Limestone Karsts (Chott Zahrez & Hodna Basins)',
      ar: 'الموائد الكارستية الكلسية للهضاب العليا والحضنة',
      fr: 'Karsts Calcaires des Hauts Plateaux & Bassin du Hodna',
    },
    code: 'KARST-HP',
    type: 'karstic_limestone',
    depthRangeMeters: [70, 280],
    waterSalinityGPerL: 1.4,
    waterECwDsm: 2.1,
    pumpingCostDzdM3: 2.6,
    drillingCostPerMeterDzd: 9500,
    coverageWilayas: [5, 17, 19, 28, 14, 43], // Batna, Djelfa, Sétif, M'Sila, Tiaret, Mila
    rechargeStatus: 'seasonal_recharge',
    description: {
      en: 'Carbonate aquifers fractured in Jurassic and Cretaceous limestones. Powers supplemental cereal irrigation and highland arboriculture (apples, apricots, almonds).',
      ar: 'مكامن مائية كربونية في الصخور الكلسية المتشققة. تدعم الري التكميلي للحبوب وغراسة الأشجار المثمرة (التفاح، المشمش، اللوز).',
      fr: 'Aquifères carbonatés karstiques. Soutiennent l’irrigation d’appoint des céréales et l’arboriculture d’altitude.',
    },
    agriRecommendation: {
      en: 'High bicarbonate levels ($>300\\,\\text{mg/L}$). Add nitric or phosphoric acid during fertigation to prevent emitter clogging.',
      ar: 'محتوى مرتفع من البيكربونات ($>300\\,\\text{mg/L}$). يوصى بحقن حمض النيتريك أو الفوسفوريك لتفادي انسداد المنقطات.',
      fr: 'Teneur élevée en bicarbonates. Injection d’acide nitrique/phosphorique recommandée.',
    },
  },
];

export interface ConcessionPerimeter {
  id: string;
  name: { en: string; ar: string; fr: string };
  wilayaCode: number;
  wilayaName: { en: string; ar: string; fr: string };
  coordinates: { lat: number; lng: number };
  allocatedAreaHa: number;
  agencyType: 'ODAS' | 'ONTA' | 'GIPLAIT_BALADNA' | 'PRIVATE_CONSORTIUM';
  strategicPillar: 'cereal_pivot' | 'oilseeds_colza' | 'sugar_beet' | 'dairy_mega_farm' | 'date_export' | 'arboriculture';
  pivotCountEstimate: number;
  investmentStatus: 'operational' | 'rapid_expansion' | 'drilling_phase' | 'planned';
  distanceToOAICSiloKm: number;
  description: { en: string; ar: string; fr: string };
}

export const ALGERIA_STRATEGIC_CONCESSIONS: ConcessionPerimeter[] = [
  {
    id: 'odas_timimoun_baladna',
    name: {
      en: 'Timimoun Mega-Agro Pastoral Pole (Baladna Partnership)',
      ar: 'القطب الفلاحي والصناعي الضخم بتيميمون (مشروع بلدنا)',
      fr: 'Méga-Pôle Agro-Pastoral de Timimoun (Partenariat Baladna)',
    },
    wilayaCode: 49,
    wilayaName: { en: 'Timimoun', ar: 'تيميمون', fr: 'Timimoun' },
    coordinates: { lat: 29.25, lng: 0.23 },
    allocatedAreaHa: 117000,
    agencyType: 'GIPLAIT_BALADNA',
    strategicPillar: 'dairy_mega_farm',
    pivotCountEstimate: 420,
    investmentStatus: 'drilling_phase',
    distanceToOAICSiloKm: 18,
    description: {
      en: 'Historic 3.5 billion USD agro-industrial project combining 270,000 head dairy cow herds with high-yield pivot alfalfa, maize, and durum wheat production.',
      ar: 'مشروع استراتيجي بقيمة 3.5 مليار دولار لتربية 270 ألف رأس من أبقار الحليب مع زراعة الأعلاف (البرسيم، الذرة) والقمح تحت الرشاشات المحورية.',
      fr: 'Méga-projet de 3.5 milliards USD combinant 270 000 têtes bovines laitières et pivots de luzerne, maïs et blé dur.',
    },
  },
  {
    id: 'odas_el_meniaa_cereal',
    name: {
      en: 'El Meniaa Strategic Desert Cereal Hub (Hassi Gara)',
      ar: 'المحيط الاستراتيجي للحبوب بحاسي قارة والمنيعة',
      fr: 'Pôle Céréalier Stratégique d’El Meniaa (Hassi Gara)',
    },
    wilayaCode: 58,
    wilayaName: { en: 'El Meniaa', ar: 'المنيعة', fr: 'El Meniaa' },
    coordinates: { lat: 30.58, lng: 2.87 },
    allocatedAreaHa: 65000,
    agencyType: 'ODAS',
    strategicPillar: 'cereal_pivot',
    pivotCountEstimate: 680,
    investmentStatus: 'operational',
    distanceToOAICSiloKm: 8,
    description: {
      en: 'Pacesetter desert grain basket generating average yields of 65–85 Qx/ha of durum wheat with automated central pivots drawing from the Albian aquifer.',
      ar: 'رائد إنتاج الحبوب الصحراوية بمردودية 65-85 قنطار/هكتار من القمح الصلب بالرشاشات المحورية الآلية المربوطة بالألبيان.',
      fr: 'Grenier céréalier saharien avec des rendements de 65 à 85 Qx/ha en blé dur sous pivots automatisés.',
    },
  },
  {
    id: 'odas_adrar_grains_oilseed',
    name: {
      en: 'Adrar Touat Cereal & Sunflower Corridor (Sbaa / Reggane)',
      ar: 'رواق توات للحبوب والسلجم الزيتي بأدرار ورقان',
      fr: 'Corridor Céréalier & Oléagineux du Touat (Adrar - Reggane)',
    },
    wilayaCode: 1,
    wilayaName: { en: 'Adrar', ar: 'أدرار', fr: 'Adrar' },
    coordinates: { lat: 27.87, lng: -0.29 },
    allocatedAreaHa: 85000,
    agencyType: 'ODAS',
    strategicPillar: 'oilseeds_colza',
    pivotCountEstimate: 510,
    investmentStatus: 'operational',
    distanceToOAICSiloKm: 12,
    description: {
      en: 'Pioneering southern perimeter specializing in durum wheat seed multiplication, silage corn, and large-scale sunflower test programs.',
      ar: 'محيط صحراوي رائد في إكثار بذور القمح الصلب، الذرة العلفية وزراعة عباد الشمس والسلجم الزيتي.',
      fr: 'Pôle pionnier en multiplication de semences certifiées de blé dur et ensilage de maïs.',
    },
  },
  {
    id: 'onta_setif_high_plateaus',
    name: {
      en: 'Sétif - Bordj Bou Arreridj Cereal & Oilseed Plain (El Eulma)',
      ar: 'سهل العلمة وسطيف للحبوب والبذور الزيتية',
      fr: 'Plaine Céréalière & Oléagineuse d’El Eulma (Sétif)',
    },
    wilayaCode: 19,
    wilayaName: { en: 'Sétif', ar: 'سطيف', fr: 'Sétif' },
    coordinates: { lat: 36.15, lng: 5.68 },
    allocatedAreaHa: 48000,
    agencyType: 'ONTA',
    strategicPillar: 'cereal_pivot',
    pivotCountEstimate: 180,
    investmentStatus: 'operational',
    distanceToOAICSiloKm: 5,
    description: {
      en: 'Historic granary of Algeria. Features modern supplementary drip and pivot irrigation for durum wheat and colza (canola).',
      ar: 'المطمورة التاريخية للجزائر. تشهد إدخال الري التكميلي الحديث للقمح الصلب والسلجم الزيتي (الكولزا).',
      fr: 'Grenier historique d’Algérie avec irrigation d’appoint au goutte-à-goutte et rampes pour le blé et colza.',
    },
  },
  {
    id: 'odas_ouargla_sugar_beet',
    name: {
      en: 'Ouargla - Hassi Ben Abdallah Sugar Beet & Potato Perimeter',
      ar: 'محيط حاسي بن عبد الله لشمندر السكر وبطاطا الرشاشات بورقلة',
      fr: 'Périmètre Betteravier & Pomme de Terre d’Ouargla (Hassi Ben Abdallah)',
    },
    wilayaCode: 30,
    wilayaName: { en: 'Ouargla', ar: 'ورقلة', fr: 'Ouargla' },
    coordinates: { lat: 31.98, lng: 5.48 },
    allocatedAreaHa: 38000,
    agencyType: 'ODAS',
    strategicPillar: 'sugar_beet',
    pivotCountEstimate: 290,
    investmentStatus: 'rapid_expansion',
    distanceToOAICSiloKm: 14,
    description: {
      en: 'Strategic agro-industrial cluster targeting winter sugar beet production (yielding up to 110 t/ha) alongside late potato cycles.',
      ar: 'قطب صناعي زراعي استراتيجي لتطوير شمندر السكر الشتوي (إنتاجية حتى 110 طن/هكتار) وبطاطا الاستهلاك والتحويل.',
      fr: 'Pôle stratégique pour la betterave sucrière d’hiver (jusqu’à 110 t/ha) et pomme de terre de saison.',
    },
  },
];

export interface AgroRiskProfile {
  wilayaCode: number;
  springFrostRisk: 'none' | 'low' | 'moderate' | 'critical';
  frostWindow: { en: string; ar: string; fr: string };
  siroccoSurgeIndex: number; // 1 to 10 scale (ET0 surge intensity)
  siroccoPeakMonths: { en: string; ar: string; fr: string };
  chillingHoursAvg: number; // accumulated hours < 7.2°C for vernalization
  recommendedEmergencyProtocol: { en: string; ar: string; fr: string };
}

export const ALGERIA_AGRO_RISKS: Record<number, AgroRiskProfile> = {
  5: { // Batna
    wilayaCode: 5,
    springFrostRisk: 'critical',
    frostWindow: { en: 'March 15 – April 25', ar: '15 مارس – 25 أفريل', fr: '15 Mars – 25 Avril' },
    siroccoSurgeIndex: 6.8,
    siroccoPeakMonths: { en: 'June – August', ar: 'جوان – أوت', fr: 'Juin – Août' },
    chillingHoursAvg: 1050,
    recommendedEmergencyProtocol: {
      en: 'Deploy micro-sprinkler anti-frost misting during bud burst. Apply potassium silicate and brassinosteroids 48h before forecasted frost.',
      ar: 'تشغيل الرش الرذاذي لمكافحة الصقيع عند انتفاخ البراعم. رش سيليكات البوتاسيوم والبراسينوسترودات 48 ساعة قبل موجة الصقيع.',
      fr: 'Déclencher la brumisation anti-gel au débourrement. Pulvériser du silicate de potassium 48h avant.',
    },
  },
  19: { // Sétif
    wilayaCode: 19,
    springFrostRisk: 'critical',
    frostWindow: { en: 'March 20 – May 05', ar: '20 مارس – 05 ماي', fr: '20 Mars – 05 Mai' },
    siroccoSurgeIndex: 7.2,
    siroccoPeakMonths: { en: 'July – August', ar: 'جويلية – أوت', fr: 'Juillet – Août' },
    chillingHoursAvg: 1180,
    recommendedEmergencyProtocol: {
      en: 'Avoid early spring nitrogen overdosing which softens tissues. Run emergency nocturnal night-irrigation during radiative freeze.',
      ar: 'تجنب الإفراط في التسميد الآزوتي المبكر لتفادي هشاشة الأنسجة. تفعيل الري الليلي التكميلي عند الصقيع الإشعاعي.',
      fr: 'Éviter les excès d’azote précoce. Activer l’irrigation nocturne lors des gelées radiatives.',
    },
  },
  7: { // Biskra
    wilayaCode: 7,
    springFrostRisk: 'none',
    frostWindow: { en: 'Negligible', ar: 'منعدم', fr: 'Négligeable' },
    siroccoSurgeIndex: 9.8,
    siroccoPeakMonths: { en: 'May – September', ar: 'ماي – سبتمبر', fr: 'Mai – Septembre' },
    chillingHoursAvg: 180,
    recommendedEmergencyProtocol: {
      en: 'Severe Sirocco danger: ET0 can exceed 14 mm/day. Activate shade nets, boost night irrigation, and apply foliar potassium phosphite to curb sunburn.',
      ar: 'خطر شديد لرياح الشهيلي: النتح يتجاوز 14 ملم/يوم. تشغيل شباك التظليل وتكثيف الري الليلي ورش فوسفايت البوتاسيوم.',
      fr: 'Risque extrême de Chehili (ET0 > 14 mm/j). Fermer les filets d’ombrage, irriguer de nuit et appliquer du phosphite de potassium.',
    },
  },
  39: { // El Oued
    wilayaCode: 39,
    springFrostRisk: 'none',
    frostWindow: { en: 'Negligible', ar: 'منعدم', fr: 'Négligeable' },
    siroccoSurgeIndex: 9.6,
    siroccoPeakMonths: { en: 'May – September', ar: 'ماي – سبتمبر', fr: 'Mai – Septembre' },
    chillingHoursAvg: 150,
    recommendedEmergencyProtocol: {
      en: 'Hot dry wind can cause rapid pollen sterilization in greenhouses. Run intermittent evaporative pad cooling and maintain sand humidity.',
      ar: 'رياح جافة حارة تسبب عقم حبوب اللقاح. تشغيل خلايا التبريد بالتبخير والمحافظة على رطوبة الرمال.',
      fr: 'Vents brûlants provoquant l’avortement floral. Activer le cooling-pad et humidifier le sable.',
    },
  },
  9: { // Blida
    wilayaCode: 9,
    springFrostRisk: 'low',
    frostWindow: { en: 'January 10 – February 15', ar: '10 جانفي – 15 فيفري', fr: '10 Janvier – 15 Février' },
    siroccoSurgeIndex: 5.2,
    siroccoPeakMonths: { en: 'July – August', ar: 'جويلية – أوت', fr: 'Juillet – Août' },
    chillingHoursAvg: 580,
    recommendedEmergencyProtocol: {
      en: 'Maintain active drainage ditches in clay soils. For citrus, apply organic copper post-frost to prevent Botrytis entry.',
      ar: 'صيانة مصارف المياه في الترب الطينية. رش النحاس العضوي على الحمضيات بعد الصقيع لمنع دخول الفطريات.',
      fr: 'Entretenir le réseau de drainage. Cuivre préventif sur agrumes après grand froid.',
    },
  },
};

export interface NDVITrendPoint {
  month: string;
  monthAr: string;
  monthFr: string;
  ndviCurrent: number; // 0 to 1
  ndvi5YearAvg: number;
  spiDroughtIndex: number; // -3 (extreme drought) to +3 (extremely wet)
}

export const SAMPLE_NDVI_TRENDS: Record<string, NDVITrendPoint[]> = {
  tell_coastal: [
    { month: 'Oct', monthAr: 'أكتوبر', monthFr: 'Oct', ndviCurrent: 0.38, ndvi5YearAvg: 0.42, spiDroughtIndex: -0.4 },
    { month: 'Nov', monthAr: 'نوفمبر', monthFr: 'Nov', ndviCurrent: 0.52, ndvi5YearAvg: 0.55, spiDroughtIndex: -0.2 },
    { month: 'Dec', monthAr: 'ديسمبر', monthFr: 'Déc', ndviCurrent: 0.65, ndvi5YearAvg: 0.68, spiDroughtIndex: +0.3 },
    { month: 'Jan', monthAr: 'جانفي', monthFr: 'Jan', ndviCurrent: 0.74, ndvi5YearAvg: 0.72, spiDroughtIndex: +0.6 },
    { month: 'Feb', monthAr: 'فيفري', monthFr: 'Fév', ndviCurrent: 0.81, ndvi5YearAvg: 0.79, spiDroughtIndex: +0.8 },
    { month: 'Mar', monthAr: 'مارس', monthFr: 'Mar', ndviCurrent: 0.85, ndvi5YearAvg: 0.82, spiDroughtIndex: +0.5 },
    { month: 'Apr', monthAr: 'أفريل', monthFr: 'Avr', ndviCurrent: 0.72, ndvi5YearAvg: 0.75, spiDroughtIndex: -0.1 },
    { month: 'May', monthAr: 'ماي', monthFr: 'Mai', ndviCurrent: 0.54, ndvi5YearAvg: 0.58, spiDroughtIndex: -0.5 },
    { month: 'Jun', monthAr: 'جوان', monthFr: 'Juin', ndviCurrent: 0.39, ndvi5YearAvg: 0.41, spiDroughtIndex: -0.8 },
  ],
  high_plateaus: [
    { month: 'Oct', monthAr: 'أكتوبر', monthFr: 'Oct', ndviCurrent: 0.22, ndvi5YearAvg: 0.28, spiDroughtIndex: -1.1 },
    { month: 'Nov', monthAr: 'نوفمبر', monthFr: 'Nov', ndviCurrent: 0.31, ndvi5YearAvg: 0.36, spiDroughtIndex: -0.9 },
    { month: 'Dec', monthAr: 'ديسمبر', monthFr: 'Déc', ndviCurrent: 0.41, ndvi5YearAvg: 0.45, spiDroughtIndex: -0.5 },
    { month: 'Jan', monthAr: 'جانفي', monthFr: 'Jan', ndviCurrent: 0.48, ndvi5YearAvg: 0.52, spiDroughtIndex: -0.4 },
    { month: 'Feb', monthAr: 'فيفري', monthFr: 'Fév', ndviCurrent: 0.58, ndvi5YearAvg: 0.62, spiDroughtIndex: -0.2 },
    { month: 'Mar', monthAr: 'مارس', monthFr: 'Mar', ndviCurrent: 0.68, ndvi5YearAvg: 0.71, spiDroughtIndex: +0.1 },
    { month: 'Apr', monthAr: 'أفريل', monthFr: 'Avr', ndviCurrent: 0.61, ndvi5YearAvg: 0.66, spiDroughtIndex: -0.6 },
    { month: 'May', monthAr: 'ماي', monthFr: 'Mai', ndviCurrent: 0.42, ndvi5YearAvg: 0.48, spiDroughtIndex: -1.2 },
    { month: 'Jun', monthAr: 'جوان', monthFr: 'Juin', ndviCurrent: 0.25, ndvi5YearAvg: 0.29, spiDroughtIndex: -1.4 },
  ],
  deep_sahara: [
    { month: 'Oct', monthAr: 'أكتوبر', monthFr: 'Oct', ndviCurrent: 0.15, ndvi5YearAvg: 0.14, spiDroughtIndex: 0.0 },
    { month: 'Nov', monthAr: 'نوفمبر', monthFr: 'Nov', ndviCurrent: 0.35, ndvi5YearAvg: 0.32, spiDroughtIndex: +0.1 },
    { month: 'Dec', monthAr: 'ديسمبر', monthFr: 'Déc', ndviCurrent: 0.62, ndvi5YearAvg: 0.58, spiDroughtIndex: +0.2 },
    { month: 'Jan', monthAr: 'جانفي', monthFr: 'Jan', ndviCurrent: 0.78, ndvi5YearAvg: 0.74, spiDroughtIndex: +0.3 },
    { month: 'Feb', monthAr: 'فيفري', monthFr: 'Fév', ndviCurrent: 0.84, ndvi5YearAvg: 0.81, spiDroughtIndex: +0.4 },
    { month: 'Mar', monthAr: 'مارس', monthFr: 'Mar', ndviCurrent: 0.88, ndvi5YearAvg: 0.85, spiDroughtIndex: +0.3 },
    { month: 'Apr', monthAr: 'أفريل', monthFr: 'Avr', ndviCurrent: 0.52, ndvi5YearAvg: 0.50, spiDroughtIndex: 0.0 },
    { month: 'May', monthAr: 'ماي', monthFr: 'Mai', ndviCurrent: 0.21, ndvi5YearAvg: 0.20, spiDroughtIndex: 0.0 },
    { month: 'Jun', monthAr: 'جوان', monthFr: 'Juin', ndviCurrent: 0.16, ndvi5YearAvg: 0.15, spiDroughtIndex: 0.0 },
  ],
};

export interface SoilLabInterpolationInput {
  ph: number;
  ecDsm: number;
  organicMatterPct: number;
  activeCaCO3Pct: number;
  olsenPppm: number;
  exchangeableKPpm: number;
}

export interface SoilLabPrescriptionResult {
  phDiagnosis: { status: 'acid' | 'neutral' | 'calcareous' | 'hyper_alkaline'; label: string };
  salinityDiagnosis: { status: 'safe' | 'slight' | 'moderate' | 'severe'; label: string };
  omDiagnosis: { status: 'depleted' | 'low' | 'optimal' | 'rich'; label: string; deficitTonPerHa: number };
  pPrescriptionKgHaTSP: number; // Triple Super Phosphate 46%
  kPrescriptionKgHaSOP: number; // Potassium Sulfate 50%
  nPrescriptionKgHaUrea: number; // Urea 46%
  recommendedSoilAmenders: {
    productName: string;
    dosage: string;
    reason: string;
  }[];
}

export function computeSoilLabPrescription(
  sample: SoilLabInterpolationInput,
  lang: Language
): SoilLabPrescriptionResult {
  // pH diagnosis
  let phDiagnosis: { status: 'acid' | 'neutral' | 'calcareous' | 'hyper_alkaline'; label: string };
  if (sample.ph < 6.8) {
    phDiagnosis = {
      status: 'acid',
      label: lang === 'ar' ? 'حامضية خفيفة إلى متوسطة' : 'Sol acide',
    };
  } else if (sample.ph <= 7.5) {
    phDiagnosis = {
      status: 'neutral',
      label: lang === 'ar' ? 'متعادلة ومثالية للتغذية' : 'Neutre et optimal',
    };
  } else if (sample.ph <= 8.2) {
    phDiagnosis = {
      status: 'calcareous',
      label: lang === 'ar' ? 'قلوية كلسية (تثبيت الفوسفور)' : 'Alcalin calcaire',
    };
  } else {
    phDiagnosis = {
      status: 'hyper_alkaline',
      label: lang === 'ar' ? 'شديدة القلوية / خطر صودية' : 'Fortement alcalin',
    };
  }

  // Salinity
  let salinityDiagnosis: { status: 'safe' | 'slight' | 'moderate' | 'severe'; label: string };
  if (sample.ecDsm < 2.0) {
    salinityDiagnosis = { status: 'safe', label: lang === 'ar' ? 'معدومة / تربة عذبة' : 'Non salin' };
  } else if (sample.ecDsm < 4.0) {
    salinityDiagnosis = { status: 'slight', label: lang === 'ar' ? 'ملوحة خفيفة' : 'Faiblement salin' };
  } else if (sample.ecDsm < 8.0) {
    salinityDiagnosis = { status: 'moderate', label: lang === 'ar' ? 'ملوحة متوسطة' : 'Modérément salin' };
  } else {
    salinityDiagnosis = { status: 'severe', label: lang === 'ar' ? 'ملوحة شديدة (سبخة)' : 'Sévèrement salin' };
  }

  // OM Deficit
  const targetOM = 2.5;
  const omDeficit = Math.max(0, targetOM - sample.organicMatterPct);
  const compostNeededTons = Math.round(omDeficit * 12);

  // Phosphorus Prescription (P2O5 via TSP 46%)
  let pPrescriptionKgHaTSP = 0;
  if (sample.olsenPppm < 10) {
    pPrescriptionKgHaTSP = 220;
  } else if (sample.olsenPppm < 20) {
    pPrescriptionKgHaTSP = 140;
  } else if (sample.olsenPppm < 35) {
    pPrescriptionKgHaTSP = 80;
  } else {
    pPrescriptionKgHaTSP = 30; // maintenance
  }
  // If pH > 7.8, increase P prescription due to limestone fixation
  if (sample.activeCaCO3Pct > 12) {
    pPrescriptionKgHaTSP = Math.round(pPrescriptionKgHaTSP * 1.25);
  }

  // Potassium Prescription (K2O via SOP 50%)
  let kPrescriptionKgHaSOP = 0;
  if (sample.exchangeableKPpm < 100) {
    kPrescriptionKgHaSOP = 250;
  } else if (sample.exchangeableKPpm < 200) {
    kPrescriptionKgHaSOP = 160;
  } else if (sample.exchangeableKPpm < 300) {
    kPrescriptionKgHaSOP = 90;
  } else {
    kPrescriptionKgHaSOP = 40;
  }

  // Urea 46% baseline
  const nPrescriptionKgHaUrea = sample.organicMatterPct < 1.0 ? 240 : sample.organicMatterPct < 2.0 ? 190 : 140;

  // Specific Amenders
  const amenders: { productName: string; dosage: string; reason: string }[] = [];

  if (compostNeededTons > 0) {
    amenders.push({
      productName: lang === 'ar' ? 'كمبوست / سماد عضوي متخمر' : 'Compost mûr / Fumier de ferme',
      dosage: `${compostNeededTons} t/ha`,
      reason:
        lang === 'ar'
          ? 'رفع المادة العضوية وتحسين السعة الحقلية والنشاط الميكروبي'
          : 'Reconstitution du stock humique et rétention hydrique',
    });
  }

  if (sample.activeCaCO3Pct > 15 || sample.ph > 8.0) {
    amenders.push({
      productName: lang === 'ar' ? 'كبريت زراعي ناعم (99% S)' : 'Soufre élémentaire micronisé',
      dosage: '400 – 600 kg/ha',
      reason:
        lang === 'ar'
          ? 'تخفيض موضعي للحموضة وتفكيك الكلس وتحرير الفوسفور والعناصر الصغرى (Fe, Zn)'
          : 'Acidification de la rhizosphère et déblocage du phosphore & fer',
    });
  }

  if (sample.ecDsm > 4.0) {
    amenders.push({
      productName: lang === 'ar' ? 'جبس زراعي / فوسفوجبس' : 'Phosphogypse / Gypse agricole',
      dosage: '1.5 – 3.0 t/ha',
      reason:
        lang === 'ar'
          ? 'استبدال الصوديوم بالكالسيوم في معقد الامتزاز وغسيل الأملاح'
          : 'Remplacement du Na+ échangeable par Ca2+ et drainage des sels',
    });
  }

  return {
    phDiagnosis,
    salinityDiagnosis,
    omDiagnosis: {
      status: sample.organicMatterPct < 1.0 ? 'depleted' : sample.organicMatterPct < 2.0 ? 'low' : 'optimal',
      label:
        sample.organicMatterPct < 1.0
          ? lang === 'ar'
            ? 'فقيرة جداً بالمادة العضوية'
            : 'Très pauvre en humus'
          : sample.organicMatterPct < 2.0
          ? lang === 'ar'
            ? 'متوسطة'
            : 'Moyenne'
          : lang === 'ar'
          ? 'مثالية وممتازة'
          : 'Excellente',
      deficitTonPerHa: compostNeededTons,
    },
    pPrescriptionKgHaTSP,
    kPrescriptionKgHaSOP,
    nPrescriptionKgHaUrea,
    recommendedSoilAmenders: amenders,
  };
}
