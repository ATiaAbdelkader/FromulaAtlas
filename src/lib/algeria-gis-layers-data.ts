/**
 * Algeria GIS Layers Data
 * Comprehensive geospatial datasets for:
 * 1. Major Strategic Water Dams & ANBT Irrigation Networks
 * 2. Southern Saharan Center-Pivot Clusters (>13,700 Pivots)
 * 3. CCLS Strategic Grain Silos & Agro-Supply Hubs (Fertilizers & Soil Labs)
 * 4. INPV / FAO Desert Locust & Phytosanitary Surveillance Radar
 * 5. Sentinel-2 NDVI/NDWI Biophysical Grid Points
 */

export interface DamData {
  id: string;
  name: { en: string; ar: string; fr: string };
  wilayaCode: number;
  wilayaName: string;
  basin: string;
  capacityMillionM3: number;
  currentFillRatePct: number;
  servedAreaHa: number;
  yearCommissioned: number;
  irrigationPerimeter: { en: string; ar: string; fr: string };
  geoCoords: { lat: number; lng: number };
}

export interface PivotClusterData {
  id: string;
  name: { en: string; ar: string; fr: string };
  wilayaCode: number;
  wilayaName: string;
  totalPivotsCount: number;
  totalAreaHa: number;
  averageWellDepthM: number;
  pivotDiameterMeters: number;
  aquiferSource: string;
  salinityECw: number;
  irrigationMethod: string;
  primaryCrops: Array<{ en: string; ar: string; fr: string }>;
  geoCoords: { lat: number; lng: number };
}

export interface CclsSiloData {
  id: string;
  name: { en: string; ar: string; fr: string };
  wilayaCode: number;
  wilayaName: string;
  storageCapacityTons: number;
  grainTypes: string[];
  railConnected: boolean;
  geoCoords: { lat: number; lng: number };
}

export interface AgroSupplyHub {
  id: string;
  name: { en: string; ar: string; fr: string };
  operator: string;
  type: 'fertilizer_plant' | 'soil_lab';
  wilayaCode: number;
  wilayaName: string;
  services: { en: string; ar: string; fr: string };
  geoCoords: { lat: number; lng: number };
}

export interface LocustRiskZone {
  id: string;
  name: { en: string; ar: string; fr: string };
  wilayaCode: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'vigilance';
  color: string;
  trajectoryFrom: string;
  pastureGreeningStatus: { en: string; ar: string; fr: string };
  recommendedBiocontrol: { en: string; ar: string; fr: string };
  geoCoords: { lat: number; lng: number };
}

export interface SatelliteAgriGridPoint {
  id: string;
  regionName: { en: string; ar: string; fr: string };
  wilayaCode: number;
  ndviSentinel2: number;
  ndwiWaterStress: number;
  canopyCoverPct: number;
  geoCoords: { lat: number; lng: number };
}

// 1. MAJOR DAMS DATA
export const ALGERIA_MAJOR_DAMS: DamData[] = [
  {
    id: 'dam_beni_haroun',
    name: {
      en: 'Beni Haroun Dam',
      ar: 'سد بني هارون',
      fr: 'Barrage de Béni Haroun',
    },
    wilayaCode: 43,
    wilayaName: 'Mila',
    basin: 'Kebir-Rhumel',
    capacityMillionM3: 960,
    currentFillRatePct: 82,
    servedAreaHa: 40000,
    yearCommissioned: 2007,
    irrigationPerimeter: {
      en: 'Teleghma, Oued Athmania & Batna Plains',
      ar: 'محيط التلاغمة، وادي العثمانية وسهول باتنة',
      fr: 'Plaines de Téléghma, Oued Athmania et Batna',
    },
    geoCoords: { lat: 36.55, lng: 6.27 },
  },
  {
    id: 'dam_koudiet_acerdoune',
    name: {
      en: 'Koudiet Acerdoune Dam',
      ar: 'سد كدية أسردون',
      fr: 'Barrage de Koudiat Acerdoune',
    },
    wilayaCode: 10,
    wilayaName: 'Bouira',
    basin: 'Isser',
    capacityMillionM3: 640,
    currentFillRatePct: 58,
    servedAreaHa: 22000,
    yearCommissioned: 2008,
    irrigationPerimeter: {
      en: 'Isser Valley & Upper Mitidja East',
      ar: 'وادي يسر ومحيط شرق متيجة العليا',
      fr: 'Vallée de l’Isser et Mitidja Orientale',
    },
    geoCoords: { lat: 36.56, lng: 3.65 },
  },
  {
    id: 'dam_gargar',
    name: {
      en: 'Gargar Dam',
      ar: 'سد قرقار',
      fr: 'Barrage de Gargar',
    },
    wilayaCode: 48,
    wilayaName: 'Relizane',
    basin: 'Rhiou',
    capacityMillionM3: 450,
    currentFillRatePct: 44,
    servedAreaHa: 18000,
    yearCommissioned: 1988,
    irrigationPerimeter: {
      en: 'Lower Cheliff Citrus & Market Gardens',
      ar: 'حمضيات وخضروات الشلف الأسفل',
      fr: 'Périmètre agrumicole du Bas-Chéliff',
    },
    geoCoords: { lat: 35.95, lng: 0.88 },
  },
  {
    id: 'dam_bouhanifia',
    name: {
      en: 'Bouhanifia Dam',
      ar: 'سد بوحنيفية',
      fr: 'Barrage de Bouhanifia',
    },
    wilayaCode: 29,
    wilayaName: 'Mascara',
    basin: 'Hammam',
    capacityMillionM3: 72,
    currentFillRatePct: 49,
    servedAreaHa: 12500,
    yearCommissioned: 1948,
    irrigationPerimeter: {
      en: 'Habra Plain Citrus & Olive Groves',
      ar: 'حمضيات وزيتون سهل الهبرة',
      fr: 'Plaine de l’Habra (Agrumes et Oliviers)',
    },
    geoCoords: { lat: 35.31, lng: -0.05 },
  },
  {
    id: 'dam_taksebt',
    name: {
      en: 'Taksebt Dam',
      ar: 'سد تاقسبت',
      fr: 'Barrage de Taksebt',
    },
    wilayaCode: 15,
    wilayaName: 'Tizi Ouzou',
    basin: 'Sébaou',
    capacityMillionM3: 180,
    currentFillRatePct: 76,
    servedAreaHa: 8000,
    yearCommissioned: 2007,
    irrigationPerimeter: {
      en: 'Lower Sebaou Valley & Arboriculture',
      ar: 'وادي سيباو السفلي والأشجار المثمرة',
      fr: 'Basse Vallée du Sébaou et Arboriculture',
    },
    geoCoords: { lat: 36.68, lng: 4.14 },
  },
  {
    id: 'dam_ain_zada',
    name: {
      en: 'Ain Zada Dam',
      ar: 'سد عين زادة',
      fr: 'Barrage d’Ain Zada',
    },
    wilayaCode: 34,
    wilayaName: 'Bordj Bou Arreridj',
    basin: 'Bousselam',
    capacityMillionM3: 125,
    currentFillRatePct: 52,
    servedAreaHa: 9500,
    yearCommissioned: 1986,
    irrigationPerimeter: {
      en: 'El Eulma & Setif Cereal Plateau',
      ar: 'هضبة العلمة وسطيف الحبوبية',
      fr: 'Hauts Plateaux Céréaliers de Sétif / El Eulma',
    },
    geoCoords: { lat: 36.17, lng: 5.16 },
  },
  {
    id: 'dam_djorf_torba',
    name: {
      en: 'Djorf Torba Dam',
      ar: 'سد جرف التربة',
      fr: 'Barrage de Djorf Torba',
    },
    wilayaCode: 8,
    wilayaName: 'Béchar',
    basin: 'Guir',
    capacityMillionM3: 365,
    currentFillRatePct: 38,
    servedAreaHa: 16000,
    yearCommissioned: 1969,
    irrigationPerimeter: {
      en: 'Abadla Oasis & Date Palm Perimeters',
      ar: 'واحة العبادلة ونخيل التمر',
      fr: 'Périmètre irrigué d’Abadla',
    },
    geoCoords: { lat: 31.48, lng: -2.78 },
  },
  {
    id: 'dam_fontaine_gazelles',
    name: {
      en: 'Fontaine des Gazelles Dam',
      ar: 'سد عين الغزال',
      fr: 'Barrage Fontaine des Gazelles',
    },
    wilayaCode: 7,
    wilayaName: 'Biskra',
    basin: 'El Hai',
    capacityMillionM3: 55,
    currentFillRatePct: 61,
    servedAreaHa: 6800,
    yearCommissioned: 2004,
    irrigationPerimeter: {
      en: 'El Outaya Early Vegetables & Date Palms',
      ar: 'باكورات ونخيل سهل الوطاية',
      fr: 'Primeurs sous serres & palmeraies d’El Outaya',
    },
    geoCoords: { lat: 35.08, lng: 5.61 },
  },
];

// 2. SOUTHERN CENTER-PIVOT CLUSTERS
export const ALGERIA_PIVOT_CLUSTERS: PivotClusterData[] = [
  {
    id: 'pivot_adrar_tsabit',
    name: {
      en: 'Adrar - Tsabit & Timimoun Cereal Pole',
      ar: 'قطب أدرار - تسابيت وتيميمون للحبوب',
      fr: 'Pôle Céréalier Adrar - Tsabit / Timimoun',
    },
    wilayaCode: 1,
    wilayaName: 'Adrar',
    totalPivotsCount: 4200,
    totalAreaHa: 135000,
    averageWellDepthM: 180,
    pivotDiameterMeters: 800,
    aquiferSource: 'Continental Intercalaire (Albien)',
    salinityECw: 2.4,
    irrigationMethod: 'Pivots Centraux Automatisés',
    primaryCrops: [
      { en: 'Certified Durum Wheat Seed', ar: 'بذور القمح الصلب المعتمدة', fr: 'Semences Blé Dur Certifiées' },
      { en: 'Silage Forage Maize', ar: 'ذرة علفية سيلاج', fr: 'Maïs Fourrager Ensilage' },
      { en: 'Perennial Alfalfa', ar: 'فصة معمرة', fr: 'Luzerne Pérenne' },
    ],
    geoCoords: { lat: 27.92, lng: -0.28 },
  },
  {
    id: 'pivot_el_oued_magrane',
    name: {
      en: 'El Oued - Magrane & Hassi Khelifa Belts',
      ar: 'حزام المقرن وحاسي خليفة (الوادي)',
      fr: 'Ceinture Pivots El Oued - Magrane',
    },
    wilayaCode: 39,
    wilayaName: 'El Oued',
    totalPivotsCount: 3800,
    totalAreaHa: 112000,
    averageWellDepthM: 140,
    pivotDiameterMeters: 600,
    aquiferSource: 'Complexe Terminal (Mio-Pliocène)',
    salinityECw: 3.1,
    irrigationMethod: 'Pivots Basse Pression',
    primaryCrops: [
      { en: 'Out-of-Season Seed Potato', ar: 'بطاطا غير موسمية', fr: 'Pomme de Terre Extra-Saison' },
      { en: 'Soft & Durum Wheat', ar: 'قمح لين وصلب', fr: 'Blé Tendre & Dur' },
      { en: 'Peanuts & Garlic', ar: 'فول سوداني وثوم', fr: 'Arachides et Ail' },
    ],
    geoCoords: { lat: 33.48, lng: 6.95 },
  },
  {
    id: 'pivot_ghardaia_meniaa',
    name: {
      en: 'El Meniaa - Ghardaïa Cereal & Feed Pole',
      ar: 'قطب المنيعة - غرداية الاستراتيجي للحبوب والأعلاف',
      fr: 'Pôle Céréalier & Fourrager El Meniaa',
    },
    wilayaCode: 58,
    wilayaName: 'El Meniaa',
    totalPivotsCount: 2600,
    totalAreaHa: 89000,
    averageWellDepthM: 260,
    pivotDiameterMeters: 750,
    aquiferSource: 'Continental Intercalaire',
    salinityECw: 1.8,
    irrigationMethod: 'Pivots avec Tours de Refroidissement',
    primaryCrops: [
      { en: 'Durum Wheat (Bousselam / Cirta)', ar: 'قمح صلب (بوسلام / سيرتا)', fr: 'Blé Dur de Qualité Supérieure' },
      { en: 'Alfalfa Hay Bales', ar: 'أعلاف بالات فصة', fr: 'Foin de Luzerne Déshydraté' },
      { en: 'Oilseed Sunflower', ar: 'دوار الشمس الزيتي', fr: 'Tournesol Oléagineux' },
    ],
    geoCoords: { lat: 30.58, lng: 2.88 },
  },
  {
    id: 'pivot_ouargla_ngoussa',
    name: {
      en: 'Ouargla - Ngoussa & Hassi Ben Abdellah',
      ar: 'محيط ورقلة - أنقوسة وحاسي بن عبد الله',
      fr: 'Périmètre Ngoussa & Hassi Ben Abdellah',
    },
    wilayaCode: 30,
    wilayaName: 'Ouargla',
    totalPivotsCount: 1900,
    totalAreaHa: 62000,
    averageWellDepthM: 220,
    pivotDiameterMeters: 700,
    aquiferSource: 'Complexe Terminal & Albien',
    salinityECw: 3.6,
    irrigationMethod: 'Pivots Anti-Corrosion',
    primaryCrops: [
      { en: 'Barley for Fodder', ar: 'شعير علفي', fr: 'Orge Fourragère' },
      { en: 'Tritordeum & Durum Wheat', ar: 'تريتيكال وقمح صلب', fr: 'Triticale et Blé' },
    ],
    geoCoords: { lat: 31.95, lng: 5.33 },
  },
  {
    id: 'pivot_biskra_djemorah',
    name: {
      en: 'Biskra - Sidi Okba & Djemorah Southern Belt',
      ar: 'حزام سيدي عقبة وجمورة (بسكرة)',
      fr: 'Ceinture Sud Biskra - Sidi Okba',
    },
    wilayaCode: 7,
    wilayaName: 'Biskra',
    totalPivotsCount: 1200,
    totalAreaHa: 40000,
    averageWellDepthM: 160,
    pivotDiameterMeters: 550,
    aquiferSource: 'Nappe Mio-Pliocène & Barrage',
    salinityECw: 2.8,
    irrigationMethod: 'Pivots & Goutte-à-Goutte Combiné',
    primaryCrops: [
      { en: 'Industrial Tomato & Melons', ar: 'طماطم صناعية وبطيخ', fr: 'Tomate Industrielle & Melons' },
      { en: 'Fodder Maize', ar: 'ذرة علفية', fr: 'Maïs Fourrage' },
    ],
    geoCoords: { lat: 34.75, lng: 5.89 },
  },
];

// 3. CCLS GRAIN SILOS
export const ALGERIA_CCLS_SILOS: CclsSiloData[] = [
  {
    id: 'silo_setif_bousselam',
    name: {
      en: 'CCLS Sétif - Mega Silo Bousselam',
      ar: 'تعاونية الحبوب سطيف - صومعة بوسلام الكبرى',
      fr: 'CCLS Sétif - Silo Géant Bousselam',
    },
    wilayaCode: 19,
    wilayaName: 'Sétif',
    storageCapacityTons: 160000,
    grainTypes: ['Blé Dur', 'Blé Tendre', 'Orge'],
    railConnected: true,
    geoCoords: { lat: 36.19, lng: 5.41 },
  },
  {
    id: 'silo_tiaret_dahra',
    name: {
      en: 'CCLS Tiaret - Sersou Strategic Grain Elevator',
      ar: 'تعاونية الحبوب تيارت - صومعة سرسو الإستراتيجية',
      fr: 'CCLS Tiaret - Silo Béton du Sersou',
    },
    wilayaCode: 14,
    wilayaName: 'Tiaret',
    storageCapacityTons: 140000,
    grainTypes: ['Blé Dur', 'Orge de Brasserie'],
    railConnected: true,
    geoCoords: { lat: 35.37, lng: 1.32 },
  },
  {
    id: 'silo_sba_tessala',
    name: {
      en: 'CCLS Sidi Bel Abbès - Tessala Hub',
      ar: 'تعاونية الحبوب سيدي بلعباس - مجمع تسالة',
      fr: 'CCLS Sidi Bel Abbès - Silo Tessala',
    },
    wilayaCode: 22,
    wilayaName: 'Sidi Bel Abbès',
    storageCapacityTons: 130000,
    grainTypes: ['Blé Dur', 'Avoine', 'Pois Chiche'],
    railConnected: true,
    geoCoords: { lat: 35.20, lng: -0.63 },
  },
  {
    id: 'silo_constantine_didouche',
    name: {
      en: 'CCLS Constantine - Didouche Mourad Storage',
      ar: 'تعاونية الحبوب قسنطينة - صومعة ديدوش مراد',
      fr: 'CCLS Constantine - Silo Didouche',
    },
    wilayaCode: 25,
    wilayaName: 'Constantine',
    storageCapacityTons: 150000,
    grainTypes: ['Blé Dur Semences', 'Blé Meunier'],
    railConnected: true,
    geoCoords: { lat: 36.36, lng: 6.61 },
  },
  {
    id: 'silo_guelma_bouchegouf',
    name: {
      en: 'CCLS Guelma - Seybouse Silos',
      ar: 'تعاونية الحبوب قالمة - صوامع سيبوس',
      fr: 'CCLS Guelma - Silos de Seybouse',
    },
    wilayaCode: 24,
    wilayaName: 'Guelma',
    storageCapacityTons: 110000,
    grainTypes: ['Blé Dur', 'Féverole'],
    railConnected: true,
    geoCoords: { lat: 36.46, lng: 7.43 },
  },
  {
    id: 'silo_biskra_outaya',
    name: {
      en: 'CCLS Biskra - Saharan Grain Logistics Terminal',
      ar: 'تعاونية الحبوب بسكرة - محطة التجميع الصحراوية بالوطاية',
      fr: 'CCLS Biskra - Terminal Céréalier d’El Outaya',
    },
    wilayaCode: 7,
    wilayaName: 'Biskra',
    storageCapacityTons: 95000,
    grainTypes: ['Blé Dur Saharien', 'Maïs Grains'],
    railConnected: true,
    geoCoords: { lat: 34.93, lng: 5.70 },
  },
  {
    id: 'silo_adrar_tsabit_hub',
    name: {
      en: 'CCLS Adrar - Deep South Seed Collection Base',
      ar: 'تعاونية الحبوب أدرار - قاعدة تجميع بذور الجنوب الكبير',
      fr: 'CCLS Adrar - Base de Collecte des Semences du Sud',
    },
    wilayaCode: 1,
    wilayaName: 'Adrar',
    storageCapacityTons: 85000,
    grainTypes: ['Blé Dur Semences R1/R2', 'Orge'],
    railConnected: false,
    geoCoords: { lat: 27.87, lng: -0.29 },
  },
];

// 4. AGRO SUPPLY HUBS (FERTILIZERS & SOIL LABS)
export const ALGERIA_SUPPLY_HUBS: AgroSupplyHub[] = [
  {
    id: 'hub_asmidal_annaba',
    name: {
      en: 'ASMIDAL Fertial Chemical Complex (Annaba)',
      ar: 'مركب أسمدال فرتيال للأسمدة الفوسفاتية والآزوتية (عنابة)',
      fr: 'Complexe Chimique ASMIDAL / FERTIAL Annaba',
    },
    operator: 'ASMIDAL - FERTIAL',
    type: 'fertilizer_plant',
    wilayaCode: 23,
    wilayaName: 'Annaba',
    services: {
      en: 'Synthesis of Granular Urea 46%, CAN 27%, TSP 46% & Technical MAP formulations.',
      ar: 'إنتاج اليوريا المحببة 46%، نترات الأمونيوم 27%، السوبر فوسفات الثلاثي TSP 46% وأسمدة MAP.',
      fr: 'Synthèse d’Urée 46%, Ammonitrate 27%, TSP 46% et formulations NPK techniques.',
    },
    geoCoords: { lat: 36.85, lng: 7.76 },
  },
  {
    id: 'hub_fertial_arzew',
    name: {
      en: 'FERTIAL Nitrogen Complex (Arzew - Oran)',
      ar: 'مركب فرتيال للأسمدة الآزوتية والأمونياك (أرزيو - وهران)',
      fr: 'Complexe Azoté FERTIAL Arzew',
    },
    operator: 'FERTIAL',
    type: 'fertilizer_plant',
    wilayaCode: 31,
    wilayaName: 'Oran',
    services: {
      en: 'Anhydrous Ammonia, Nitrogen Solutions UAN 32%, Liquid NPK blends for fertigation.',
      ar: 'الأمونياك اللامائي، المحاليل الآزوتية UAN 32% وخلطات NPK السائلة للتسميد مع مياه الري.',
      fr: 'Ammoniac anhydre, solutions azotées UAN 32% et engrais NPK solubles fertigation.',
    },
    geoCoords: { lat: 35.85, lng: -0.31 },
  },
  {
    id: 'hub_inraa_algiers',
    name: {
      en: 'INRAA Central Soil & Plant Laboratory (El Harrach)',
      ar: 'المخبر المركزي لتحاليل التربة والنبات - المعهد الوطني للبحث الزراعي (الحراش)',
      fr: 'Laboratoire Central des Sols INRAA (El Harrach)',
    },
    operator: 'INRAA Algérie',
    type: 'soil_lab',
    wilayaCode: 16,
    wilayaName: 'Alger',
    services: {
      en: 'Standard Olsen-P, Exchangeable K, Heavy metals, Salinity extract SAR, Trace minerals testing.',
      ar: 'تحليل الفوسفور (أولسن)، البوتاسيوم المتبادل، المعادن الثقيلة، الملوحة ونسبة SAR والعناصر النادرة.',
      fr: 'Analyses physico-chimiques complètes, CEC Metson, calcaire actif et oligo-éléments.',
    },
    geoCoords: { lat: 36.72, lng: 3.13 },
  },
  {
    id: 'hub_lab_ziban_biskra',
    name: {
      en: 'Ziban Agronomic Soil & Irrigation Water Testing Lab',
      ar: 'مخبر الزيبان لتحاليل تربة ومياه السقي بالجنوب',
      fr: 'Laboratoire Agronomique des Sols & Eaux des Zibans',
    },
    operator: 'Centre Scientifique Agricole des Zibans',
    type: 'soil_lab',
    wilayaCode: 7,
    wilayaName: 'Biskra',
    services: {
      en: 'Water salinity diagnostic, deep well chemistry, foliar diagnostics for date palms & greenhouses.',
      ar: 'تشخيص ملوحة المياه، كيمياء مياه الآبار العميقة، والتشخيص الورقي لنخيل التمر والبيوت المحمية.',
      fr: 'Diagnostic salinité des eaux d’irrigation forages, analyses foliaires palmier & serres.',
    },
    geoCoords: { lat: 34.85, lng: 5.73 },
  },
];

// 5. INPV / FAO LOCUST RADAR ZONES
export const ALGERIA_LOCUST_ZONES: LocustRiskZone[] = [
  {
    id: 'locust_tindouf_garet',
    name: {
      en: 'Tindouf - Garet Djebilet Southwestern Corridor',
      ar: 'تندوف - ممر غار جبيلات الجنوب الغربي',
      fr: 'Corridor Sud-Ouest Tindouf - Garet Djebilet',
    },
    wilayaCode: 37,
    riskLevel: 'vigilance',
    color: '#eab308',
    trajectoryFrom: 'Sahel / Mauritania border',
    pastureGreeningStatus: {
      en: 'Ephemeral acacia depressions greening after late rains',
      ar: 'اخضرار منخفضات السنط بعد الأمطار الرعدية المتأخرة',
      fr: 'Verdissement des dépressions d’acacias après pluies orageuses',
    },
    recommendedBiocontrol: {
      en: 'Metarhizium acridum bio-pesticide spray on juvenile hoppers',
      ar: 'الرش الحيوي بفطر الميتاريزيوم على الحوريات الفتية',
      fr: 'Épandage biologique à base de Metarhizium acridum sur larves',
    },
    geoCoords: { lat: 27.67, lng: -8.14 },
  },
  {
    id: 'locust_adrar_reggane',
    name: {
      en: 'Adrar - Reggane & Oued Saoura Depression',
      ar: 'أدرار - منخفض رقان ووادي الساورة',
      fr: 'Dépression de Reggane & Oued Saoura',
    },
    wilayaCode: 1,
    riskLevel: 'moderate',
    color: '#f97316',
    trajectoryFrom: 'Northern Mali corridor via Bordj Badji Mokhtar',
    pastureGreeningStatus: {
      en: 'Dense greening around oued beds and pivot perimeter fringes',
      ar: 'اخضرار كثيف على هوامش الرشاشات المحورية ومجاري الأودية',
      fr: 'Végétation spontanée dense autour des bordures de pivots',
    },
    recommendedBiocontrol: {
      en: 'Targeted ULV bio-insecticide barrier spraying',
      ar: 'حواجز وقائية بالمعاملات الحيوية منخفضة الحجم ULV',
      fr: 'Traitement par barrières ULV et régulateurs de croissance acridiens',
    },
    geoCoords: { lat: 26.72, lng: 0.17 },
  },
  {
    id: 'locust_tamanrasset_hoggar',
    name: {
      en: 'Tamanrasset - In Guezzam Southern Gateway',
      ar: 'تمنراست - بوابة عين قزام الجنوبية',
      fr: 'Porte Sud Tamanrasset - In Guezzam',
    },
    wilayaCode: 11,
    riskLevel: 'vigilance',
    color: '#eab308',
    trajectoryFrom: 'Air Mountains / Niger border',
    pastureGreeningStatus: {
      en: 'Scattered desert shrubs in oued beds (Schouwia / Tribulus)',
      ar: 'نباتات صحراوية متفرقة في بطون الأودية',
      fr: 'Broussailles éparses de Schouwia purpurea en lits d’oueds',
    },
    recommendedBiocontrol: {
      en: 'Ground scouting vehicles equipped with DGPS positioning',
      ar: 'فرق استكشاف برية مجهزة بنظام التموقع الجغرافي DGPS',
      fr: 'Prospection terrestre DGPS et pulvérisation ciblée',
    },
    geoCoords: { lat: 22.79, lng: 5.52 },
  },
  {
    id: 'locust_djanet_tassili',
    name: {
      en: 'Djanet - Tassili Southeast Passage',
      ar: 'جانت - ممر طاسيلي ناجر الجنوب الشرقي',
      fr: 'Passage Sud-Est Djanet - Tassili',
    },
    wilayaCode: 56,
    riskLevel: 'low',
    color: '#10b981',
    trajectoryFrom: 'Libya / Chad border',
    pastureGreeningStatus: {
      en: 'Dry arid conditions; no solitary hopper aggregation detected',
      ar: 'ظروف جافة مستقرة، لا وجود لتجمعات انفرادية للحوريات',
      fr: 'Conditions très sèches ; absence de grégarisation',
    },
    recommendedBiocontrol: {
      en: 'Routine satellite vegetative greening radar monitoring',
      ar: 'المراقبة الدورية بالاستشعار عن بعد ومؤشرات الغطاء النباتي',
      fr: 'Suivi régulier de l’indice de verdissement par télédétection',
    },
    geoCoords: { lat: 24.55, lng: 9.48 },
  },
  {
    id: 'locust_bbm_border',
    name: {
      en: 'Bordj Badji Mokhtar Transboundary Station',
      ar: 'محطة برج باجي مختار الحدودية الاستراتيجية',
      fr: 'Station Transfrontalière Bordj Badji Mokhtar',
    },
    wilayaCode: 50,
    riskLevel: 'moderate',
    color: '#f97316',
    trajectoryFrom: 'Sahelian transition belt',
    pastureGreeningStatus: {
      en: 'Moisture patches in wadi basins following seasonal storms',
      ar: 'بقع رطوبة في الأحواض المائية بعد العواصف الفصلية',
      fr: 'Poches d’humidité dans les bas-fonds après averses',
    },
    recommendedBiocontrol: {
      en: 'High alert rapid intervention response units',
      ar: 'فرق التدخل السريع في حالة تأهب قصوى',
      fr: 'Unités d’intervention rapide de l’INPV pré-positionnées',
    },
    geoCoords: { lat: 21.33, lng: 0.95 },
  },
];

// 6. SATELLITE NDVI BIOPHYSICAL GRID
export const ALGERIA_SATELLITE_GRID: SatelliteAgriGridPoint[] = [
  {
    id: 'sat_mitidja_blida',
    regionName: { en: 'Mitidja Plain (Blida)', ar: 'سهل متيجة (البليدة)', fr: 'Plaine de la Mitidja' },
    wilayaCode: 9,
    ndviSentinel2: 0.78,
    ndwiWaterStress: -0.12,
    canopyCoverPct: 85,
    geoCoords: { lat: 36.47, lng: 2.83 },
  },
  {
    id: 'sat_cheliff_ain_defla',
    regionName: { en: 'Middle Cheliff (Ain Defla)', ar: 'الشلف الأوسط (عين الدفلى)', fr: 'Moyen Chéliff' },
    wilayaCode: 44,
    ndviSentinel2: 0.71,
    ndwiWaterStress: -0.22,
    canopyCoverPct: 76,
    geoCoords: { lat: 36.26, lng: 1.96 },
  },
  {
    id: 'sat_setif_high_plateau',
    regionName: { en: 'Setif High Plains (Cereal)', ar: 'الهضاب العليا سطيف (حبوب)', fr: 'Hauts Plateaux Sétifiens' },
    wilayaCode: 19,
    ndviSentinel2: 0.54,
    ndwiWaterStress: -0.38,
    canopyCoverPct: 58,
    geoCoords: { lat: 36.19, lng: 5.41 },
  },
  {
    id: 'sat_tiaret_sersou',
    regionName: { en: 'Sersou Breadbasket (Tiaret)', ar: 'سهل سرسو الحبوبي (تيارت)', fr: 'Grenier du Sersou' },
    wilayaCode: 14,
    ndviSentinel2: 0.52,
    ndwiWaterStress: -0.41,
    canopyCoverPct: 54,
    geoCoords: { lat: 35.37, lng: 1.32 },
  },
  {
    id: 'sat_biskra_ziban',
    regionName: { en: 'Ziban Oasis & Serres (Biskra)', ar: 'واحات وبيوت الزيبان (بسكرة)', fr: 'Oasis & Plasticulture Zibans' },
    wilayaCode: 7,
    ndviSentinel2: 0.65,
    ndwiWaterStress: -0.28,
    canopyCoverPct: 68,
    geoCoords: { lat: 34.85, lng: 5.73 },
  },
  {
    id: 'sat_el_oued_souf',
    regionName: { en: 'El Oued Pivots & Ghouts', ar: 'رشاشات وغيطان وادي سوف', fr: 'Pivots & Ghouts d’El Oued' },
    wilayaCode: 39,
    ndviSentinel2: 0.62,
    ndwiWaterStress: -0.31,
    canopyCoverPct: 64,
    geoCoords: { lat: 33.37, lng: 6.86 },
  },
  {
    id: 'sat_adrar_touat',
    regionName: { en: 'Adrar - Touat Mega-Pivots', ar: 'الرشاشات العملاقة أدرار - توات', fr: 'Méga-Pivots du Touat' },
    wilayaCode: 1,
    ndviSentinel2: 0.74,
    ndwiWaterStress: -0.19,
    canopyCoverPct: 78,
    geoCoords: { lat: 27.87, lng: -0.29 },
  },
  {
    id: 'sat_el_meniaa_center',
    regionName: { en: 'El Meniaa Albien Pivot Hub', ar: 'قطب رشاشات الألبيان بالمنيعة', fr: 'Pivots de l’Albien El Meniaa' },
    wilayaCode: 58,
    ndviSentinel2: 0.72,
    ndwiWaterStress: -0.21,
    canopyCoverPct: 75,
    geoCoords: { lat: 30.58, lng: 2.88 },
  },
  {
    id: 'sat_tlemcen_maghnia',
    regionName: { en: 'Maghnia Plain (Tlemcen)', ar: 'سهل مغنية (تلمسان)', fr: 'Plaine de Maghnia' },
    wilayaCode: 13,
    ndviSentinel2: 0.68,
    ndwiWaterStress: -0.24,
    canopyCoverPct: 72,
    geoCoords: { lat: 34.86, lng: -1.73 },
  },
  {
    id: 'sat_mascara_habra',
    regionName: { en: 'Mascara Habra Orchards', ar: 'بساتين الهبرة (معسكر)', fr: 'Vergers de la Plaine de l’Habra' },
    wilayaCode: 29,
    ndviSentinel2: 0.66,
    ndwiWaterStress: -0.29,
    canopyCoverPct: 70,
    geoCoords: { lat: 35.40, lng: 0.14 },
  },
];
