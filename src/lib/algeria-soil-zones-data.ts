/**
 * Algeria Provincial Soil Zones & Pedological Dataset
 * Based on INRAA, BNEDER, FAO-UNESCO & USDA WRB pedological classifications.
 * 
 * Provides provincial soil zone profiles (e.g., Vertisols in Mitidja plain,
 * Calcisoils in the High Plateaus, Arenosols in the Souf/Ziban basins)
 * with physical-chemical parameters and crop yield calibration factors.
 */

import { type Language } from '@/lib/language-store';

export type AlgeriaSoilClass =
  | 'vertisol'       // Tirs / Vertisols (Mitidja, Habra, Sidi Bel Abbès)
  | 'calcisol'       // Sols bruns calcaires / Rendsines (Hauts Plateaux, Sétif, Constantine)
  | 'arenosol'       // Sols sableux d'Erg / Éoliens (El Oued, Biskra, Ouargla)
  | 'fluvisol'       // Sols alluviaux récents / Vallées d'Oueds (Cheliff, Soummam, Seybouse)
  | 'solonchak'      // Sols halomorphes / Salés / Sebkhas (Chott Melghir, Relizane plain, Hodna)
  | 'luvisol'        // Sols rouges fersiallitiques / Terra Rossa (Tlemcen, Dahra, Kabylie)
  | 'cambisol';      // Sols bruns eutrophes / Piémonts (Médéa, Mascara, Guelma)

export interface SoilHorizonLayer {
  horizon: string;
  depthCm: string;
  description: Record<Language, string>;
  organicMatterPct: number;
  clayPct: number;
  ph: number;
  calciumCarbonatePct: number;
}

export interface SoilYieldMultiplier {
  cropId: string;
  cropName: Record<Language, string>;
  cropEmoji: string;
  baseYieldTonsHa: number;
  calibratedYieldTonsHa: number;
  multiplier: number;
  confidencePct: number;
  agronomicNote: Record<Language, string>;
}

export interface AlgeriaSoilZone {
  id: string;
  soilClass: AlgeriaSoilClass;
  name: Record<Language, string>;
  localPedologicalTerm: Record<Language, string>; // e.g. "Tirs noir de la Mitidja", "Hamada calcaire", "Sable du Souf (Erg)"
  regionName: Record<Language, string>;
  provinces: string[]; // Wilayas
  coordinates: {
    lat: number;
    lng: number;
  };
  svgMapPathId?: string;
  
  // Physical & Chemical properties
  clayPct: number;
  siltPct: number;
  sandPct: number;
  textureLabel: Record<Language, string>;
  phH2O: number;
  activeLimeCaCO3Pct: number;
  organicMatterPct: number;
  cecMeq100g: number;
  bulkDensityGcm3: number;
  electricalConductivityDsm: number;
  availableWaterCapacityMmPerM: number;
  infiltrationRateMmh: number;

  // Pedological & Structural dynamics
  swellingShrinkageRisk: 'none' | 'low' | 'moderate' | 'high' | 'very_high';
  waterloggingRisk: 'none' | 'low' | 'moderate' | 'high' | 'severe';
  chlorosisRisk: 'none' | 'low' | 'moderate' | 'high' | 'severe';
  salinityRisk: 'none' | 'low' | 'moderate' | 'high' | 'severe';
  compactionRisk: 'none' | 'low' | 'moderate' | 'high' | 'severe';
  erosionRisk: 'low' | 'moderate' | 'high' | 'very_high';

  // Profile Horizons
  horizons: SoilHorizonLayer[];

  // Crop Yield Calibrations
  cropYieldMultipliers: SoilYieldMultiplier[];

  // Agronomic recommendations
  tillageGuidance: Record<Language, string>;
  irrigationGuidance: Record<Language, string>;
  nutrientAmendmentGuidance: Record<Language, string>;
  drainageGuidance: Record<Language, string>;
}

export const ALGERIA_SOIL_ZONES: AlgeriaSoilZone[] = [
  {
    id: 'mitidja_vertisols',
    soilClass: 'vertisol',
    name: {
      en: 'Mitidja Plain Vertisols (Deep Heavy Clays / Tirs)',
      ar: 'تربة الفيرتيسول بسهل متيجة (تربة التيرس الطينية العميقة)',
      fr: 'Vertisols de la plaine de la Mitidja (Tirs profonds argileux)',
    },
    localPedologicalTerm: {
      en: 'Tirs Noirs & Gris de la Mitidja (Smectite Vertisols)',
      ar: 'تربة التيرس السوداء والرمادية بالمتيجة (طين سمكتيتي متمدد)',
      fr: 'Tirs noirs et gris de la Mitidja (Vertisols à smectite)',
    },
    regionName: {
      en: 'Mitidja & Coastal Plain (Central Algeria)',
      ar: 'سهل متيجة والساحل الأوسط',
      fr: 'Mitidja & Plaine Côtière Centrale',
    },
    provinces: ['Blida (09)', 'Alger (16)', 'Tipaza (42)', 'Boumerdès (35)'],
    coordinates: { lat: 36.58, lng: 2.87 },
    clayPct: 54,
    siltPct: 28,
    sandPct: 18,
    textureLabel: {
      en: 'Heavy Clay to Silty Clay (Argile lourde)',
      ar: 'طين ثقيل إلى طين طميي',
      fr: 'Argile lourde à argilo-limoneuse',
    },
    phH2O: 7.7,
    activeLimeCaCO3Pct: 8.5,
    organicMatterPct: 2.2,
    cecMeq100g: 38.5,
    bulkDensityGcm3: 1.42,
    electricalConductivityDsm: 1.1,
    availableWaterCapacityMmPerM: 195,
    infiltrationRateMmh: 8,
    swellingShrinkageRisk: 'very_high',
    waterloggingRisk: 'high',
    chlorosisRisk: 'low',
    salinityRisk: 'low',
    compactionRisk: 'very_high',
    erosionRisk: 'low',
    horizons: [
      {
        horizon: 'Ap (0-35 cm)',
        depthCm: '0 - 35 cm',
        description: {
          en: 'Dark grayish brown heavy clay, granular-prismatic structure, self-mulching surface, deep shrinkage cracks when desiccated.',
          ar: 'طين ثقيل بني رمادي داكن، بنية حُبيبية منشورية، تشققات جفافية عميقة، قدرة احتفاظ مائي استثنائية.',
          fr: 'Argile lourde brun-gris foncé, structure granulaire-prismatique, fentes de retrait profondes à sec.',
        },
        organicMatterPct: 2.3,
        clayPct: 52,
        ph: 7.6,
        calciumCarbonatePct: 7.0,
      },
      {
        horizon: 'Bw/Bss (35-85 cm)',
        depthCm: '35 - 85 cm',
        description: {
          en: 'Dense montmorillonite clay with prominent slickensides (surfaces de glissement), high water retention, slow hydraulic conductivity.',
          ar: 'طين مونتموريلونيت كثيف مع أسطح انزلاق صقيلة (Slickensides)، نفاذية بطيئة مع تشبع مائي شتوي.',
          fr: 'Argile montmorillonite très dense avec slickensides nets, forte rétention d’eau, conductivité lente.',
        },
        organicMatterPct: 1.4,
        clayPct: 58,
        ph: 7.8,
        calciumCarbonatePct: 9.5,
      },
      {
        horizon: 'Ck (85-130+ cm)',
        depthCm: '85 - 130+ cm',
        description: {
          en: 'Calcareous alluvial substratum, calcium carbonate nodules, sub-hydromorphic mottling.',
          ar: 'طبقة رسوبية طميية جيرية مع عقيدات كلسية ورطوبة تحتية.',
          fr: 'Substratum alluvionnaire calcaire avec nodules et pseudogley temporaire.',
        },
        organicMatterPct: 0.6,
        clayPct: 46,
        ph: 8.0,
        calciumCarbonatePct: 14.0,
      },
    ],
    cropYieldMultipliers: [
      {
        cropId: 'citrus',
        cropName: { en: 'Citrus & Clementines (Mitidja)', ar: 'الحمضيات والكليمونتين بالمتيجة', fr: 'Agrumes & Clémentines de la Mitidja' },
        cropEmoji: '🍊',
        baseYieldTonsHa: 28.0,
        calibratedYieldTonsHa: 34.5,
        multiplier: 1.23,
        confidencePct: 92,
        agronomicNote: {
          en: 'Outstanding water and potassium holding capacity boosts citrus fruit caliber and juice yield; requires rootstock resistant to root asphyxia (Carrizo/Citrange or P. trifoliata).',
          ar: 'قدرة استثنائية على تخزين المياه والبوتاسيوم ترفع حجم الثمار ونسبة العصير؛ تتطلب حامل طعم مقاوم للاختناق الجذري.',
          fr: 'Excellente réserve utile et richesse en K qui augmentent le calibre; porte-greffe résistant à l’asphyxie racinaire requis.',
        },
      },
      {
        cropId: 'wheat_durum',
        cropName: { en: 'Durum Wheat (Blé Dur)', ar: 'القمح الصلب', fr: 'Blé dur' },
        cropEmoji: '🌾',
        baseYieldTonsHa: 3.5,
        calibratedYieldTonsHa: 4.6,
        multiplier: 1.31,
        confidencePct: 89,
        agronomicNote: {
          en: 'High available water buffer buffers terminal spring heatwaves (Sirocco), yielding superior grain protein content and specific weight.',
          ar: 'المخزون المائي الكبير في التربة يحمي المحصول من لفحات الصيف (الشهيلي) ويضمن وزناً نوعياً ونسبة بروتين ممتازة.',
          fr: 'Le volant d’eau disponible atténue les coups de sirocco au remplissage, garantissant un très bon PS et taux de protéines.',
        },
      },
      {
        cropId: 'potato',
        cropName: { en: 'Early Season Potato (Primeur)', ar: 'البطاطا البدرية (المبكرة)', fr: 'Pomme de terre primeur' },
        cropEmoji: '🥔',
        baseYieldTonsHa: 26.0,
        calibratedYieldTonsHa: 23.5,
        multiplier: 0.90,
        confidencePct: 85,
        agronomicNote: {
          en: 'Heavy clay soil causes minor tuber deformation and difficult mechanical harvesting when wet; requires elevated ridges and organic matter addition.',
          ar: 'الصلابة العالية للطين تصعب الحصاد الآلي عند الرطوبة وتسبب تشوهات طفيفة؛ تتطلب زراعة على مصاطب مرتفعة.',
          fr: 'L’argile lourde entrave la récolte mécanique par temps humide; plantation sur billons hauts indispensable.',
        },
      },
      {
        cropId: 'tomato_open',
        cropName: { en: 'Industrial / Open-field Tomato', ar: 'الطماطم الحقلية والصناعية', fr: 'Tomate industrielle plein champ' },
        cropEmoji: '🍅',
        baseYieldTonsHa: 50.0,
        calibratedYieldTonsHa: 58.0,
        multiplier: 1.16,
        confidencePct: 91,
        agronomicNote: {
          en: 'High CEC and potassium supply yield high Brix (°Bx > 5.2) and dense pulp for canning/paste transformation.',
          ar: 'التغذية البوتاسية الطبيعية وسعة التبادل تضمن مادة جافة عالية وبريكس مرتفع (°Bx > 5.2) للتحويل الصناعي.',
          fr: 'La richesse en K échangeable assure un Brix élevé (> 5.2) et une haute densité pour la transformation.',
        },
      },
    ],
    tillageGuidance: {
      en: 'Work exclusively at optimal soil moisture ("état friable"). Avoid plowing when wet (severe smearing/compaction) or overly dry (massive hard clods). Subsoiling (decompaction) to 45-50 cm every 3 years is strongly recommended.',
      ar: 'الحراثة حصرًا عند الرطوبة المثالية (حالة التفتت). تجنب الحرث الرطب منعاً للانضغاط، والحرث الجاف منعاً للكتل الصلبة. ينصح بالتفكيك العميق للتربة (Sous-solage) بعمق 45-50 سم كل 3 سنوات.',
      fr: 'Travaillez impérativement au ressuyage optimal. Évitez le labour en conditions humides (lissage/compactage) ou trop sèches. Sous-solage à 45-50 cm tous les 3 ans fortement conseillé.',
    },
    irrigationGuidance: {
      en: 'High water retention capacity allows longer irrigation intervals (6-9 days) with higher application depths (35-45 mm). Use drip with pressure compensation to avoid surface puddling.',
      ar: 'السعة العالية للاحتفاظ بالماء تسمح بفترات ري متباعدة (6-9 أيام) بكميات أكبر (35-45 ملم). يفضل الري بالتنقيط لتجنب التغدق السطحي.',
      fr: 'Forte réserve utile permettant des tours d’eau espacés (6-9 jours) à forte dose (35-45 mm). Privilégier le goutte-à-goutte pour éviter la stagnation.',
    },
    nutrientAmendmentGuidance: {
      en: 'Soil has excellent native Potassium (K) reserve. Phosphatic fertilization requires localized placement due to slight fixation. Regular organic manure (20-30 t/ha) or green manure improves structural resilience.',
      ar: 'احتياطي بوتاسي ممتاز. يتطلب التسميد الفوسفوري التموضع الموضعي قرب الجذور. إضافة المادة العضوية أو السماد الأخضر يحسن بنية التربة وتفتتها.',
      fr: 'Excellente réserve naturelle en K. Localiser les engrais phosphatés au plus près des racines. Apport de compost/fumier (20-30 t/ha) pour aérer la structure.',
    },
    drainageGuidance: {
      en: 'Install perimeter collectors and maintain laser-guided drainage furrows to evacuate excess winter rainfall (avoid waterlogging during December-February).',
      ar: 'إنشاء خنادق تصريف محيطية وتسوية بالليزر لتصريف مياه الأمطار الشتوية الغزيرة ومنع اختناق الجذور في الشتاء.',
      fr: 'Créer des fossés de drainage et pratiquer un nivellement laser pour évacuer les excès pluviométriques hivernaux.',
    },
  },

  {
    id: 'hauts_plateaux_calcisols',
    soilClass: 'calcisol',
    name: {
      en: 'Eastern High Plateaus Calcisoils & Cambisols (Cereal Steppe Plains)',
      ar: 'تربة الكالسيسول بالهضاب العليا الشرقية (تربة بنية كلسية لسهوب الحبوب)',
      fr: 'Calcisols & Cambisols des Hauts Plateaux de l’Est (Sols bruns calcaires)',
    },
    localPedologicalTerm: {
      en: 'Sols Bruns Calcaires & Rendsines des Hautes Plaines Céréalières',
      ar: 'التربة البنية الكلسية والرندزينا لسهول الحبوب العليا (سطيف، قسنطينة)',
      fr: 'Sols bruns calcaires et rendzines de la steppe céréalière',
    },
    regionName: {
      en: 'Eastern High Plateaus (Hauts Plateaux Est)',
      ar: 'الهضاب العليا الشرقية',
      fr: 'Hauts Plateaux de l’Est',
    },
    provinces: ['Sétif (19)', 'Constantine (25)', 'Bordj Bou Arreridj (34)', 'Mila (43)', 'Oum El Bouaghi (04)', 'Batna (05)', 'Guelma (24)'],
    coordinates: { lat: 36.19, lng: 5.41 },
    clayPct: 34,
    siltPct: 42,
    sandPct: 24,
    textureLabel: {
      en: 'Silty Clay Loam to Calcareous Loam (Limono-argileux)',
      ar: 'طميي طيني كلسي',
      fr: 'Limono-argilo-calcaire',
    },
    phH2O: 8.2,
    activeLimeCaCO3Pct: 24.5,
    organicMatterPct: 1.3,
    cecMeq100g: 22.0,
    bulkDensityGcm3: 1.35,
    electricalConductivityDsm: 0.8,
    availableWaterCapacityMmPerM: 140,
    infiltrationRateMmh: 16,
    swellingShrinkageRisk: 'low',
    waterloggingRisk: 'low',
    chlorosisRisk: 'very_high',
    salinityRisk: 'low',
    compactionRisk: 'moderate',
    erosionRisk: 'high',
    horizons: [
      {
        horizon: 'Ap (0-25 cm)',
        depthCm: '0 - 25 cm',
        description: {
          en: 'Pale brown silty-clay topsoil, moderately structured, high free and active calcium carbonate, moderate crusting susceptibility.',
          ar: 'أفق سطحي طميي كلسي بني فاتح، نسبة كلس حر ونشط مرتفعة، قابلية للتشدق القشري بعد الأمطار.',
          fr: 'Horizon superficiel limoneux-calcaire brun clair, forte teneur en calcaire actif, battance modérée.',
        },
        organicMatterPct: 1.4,
        clayPct: 32,
        ph: 8.1,
        calciumCarbonatePct: 22.0,
      },
      {
        horizon: 'Bk / Calcic (25-70 cm)',
        depthCm: '25 - 70 cm',
        description: {
          en: 'Whitish-nodular calcic accumulation zone (croute/encroûtement calcaire), high calcium saturation, high phosphorus precipitation potential.',
          ar: 'أفق تراكم كلسي عقدية بيضاء، تركيز عالٍ للكالسيوم يثبت الفوسفور والعناصر الصغرى كالحديد والزنك.',
          fr: 'Horizon d’accumulation calcaire nodulaire, forte fixation des phosphates et blocage du fer/zinc.',
        },
        organicMatterPct: 0.8,
        clayPct: 36,
        ph: 8.3,
        calciumCarbonatePct: 32.0,
      },
      {
        horizon: 'C (70-120+ cm)',
        depthCm: '70 - 120+ cm',
        description: {
          en: 'Marl or limestone parent rock with moderate depth penetration for taproots.',
          ar: 'صخور أم مارلية أو كلسية متبلورة تسمح بتعمق الجذور الوتدية للحبوب والأعلاف.',
          fr: 'Substratum marneux ou calcaire rocheux semi-perméable.',
        },
        organicMatterPct: 0.3,
        clayPct: 28,
        ph: 8.4,
        calciumCarbonatePct: 38.0,
      },
    ],
    cropYieldMultipliers: [
      {
        cropId: 'wheat_durum',
        cropName: { en: 'Durum Wheat (Bousselam / Cirta / Gt1)', ar: 'القمح الصلب (بوسلام / سيرتا / محمد بن بوعبدالله)', fr: 'Blé dur de plateau' },
        cropEmoji: '🌾',
        baseYieldTonsHa: 3.2,
        calibratedYieldTonsHa: 3.8,
        multiplier: 1.19,
        confidencePct: 94,
        agronomicNote: {
          en: 'The natural biotope for premier durum wheat; balanced silt-clay texture provides ideal seedbed friability and vitreous grain quality.',
          ar: 'المهد الطبيعي للقمح الصلب الجزائري؛ التركيبة الطميية الكلسية توفر مهد بذور مثالي ونوعية حبات زجاجية ممتازة.',
          fr: 'Biotope d’élection du blé dur algérien; excellente structure pour la levée et haute vitrosité du grain.',
        },
      },
      {
        cropId: 'chickpea_lentil',
        cropName: { en: 'Food Legumes (Chickpea / Lentil)', ar: 'البقوليات الغذائية (حمص / عدس)', fr: 'Légumineuses (Pois-chiche / Lentille)' },
        cropEmoji: '🫘',
        baseYieldTonsHa: 1.6,
        calibratedYieldTonsHa: 2.1,
        multiplier: 1.31,
        confidencePct: 90,
        agronomicNote: {
          en: 'Legumes thrive on well-drained calcic soils with active rhizobium nodulation, fixing up to 60-80 kg N/ha for following cereal rotation.',
          ar: 'تزدهر البقوليات في التربة الكلسية جيدة الصرف مع نشاط عقدي ممتاز للبكتيريا التكافلية لتثبيت 60-80 كغ آزوت/هـ للدورة الزراعية.',
          fr: 'Les légumineuses profitent du bon drainage et du calcaire pour une excellente nodulation Rhizobium (crédit N +60 kg/ha).',
        },
      },
      {
        cropId: 'olive',
        cropName: { en: 'Olive Groves (Chemlal / Sigoise)', ar: 'أشجار الزيتون (شملال / سيقواز)', fr: 'Oliviers (Chemlal / Sigoise)' },
        cropEmoji: '🫒',
        baseYieldTonsHa: 6.0,
        calibratedYieldTonsHa: 7.2,
        multiplier: 1.20,
        confidencePct: 88,
        agronomicNote: {
          en: 'Tolerates alkaline pH and limestone presence exceptionally well, yielding superior polyphenol oil profile.',
          ar: 'تحمل استثنائي لحموضة التربة والكلس مع إنتاج زيت ذو محتوى بوليفينول ونكهة عالية الجودة.',
          fr: 'Parfaite adaptation au pH alcalin et au calcaire; huile à haute teneur en polyphénols.',
        },
      },
      {
        cropId: 'fruit_stone',
        cropName: { en: 'Stone Fruits (Peach, Apricot, Apple)', ar: 'الأشجار المثمرة ذات النواة (خوخ، مشمش، تفاح)', fr: 'Arbres fruitiers (Pêcher, Abricotier, Pommier)' },
        cropEmoji: '🍎',
        baseYieldTonsHa: 18.0,
        calibratedYieldTonsHa: 15.0,
        multiplier: 0.83,
        confidencePct: 86,
        agronomicNote: {
          en: 'High active CaCO3 triggers iron deficiency chlorosis (yellow foliage); rootstock must be GF677 or Cadaman with chelated Fe-EDDHA supplementation.',
          ar: 'الكلس النشط العالي يسبب الاصفرار الكلوروزي لنقص الحديد؛ يتطلب أصولاً كلسية (GF677) وتسميد بالحديد المخلبي EDDHA.',
          fr: 'Le calcaire actif provoque la chlorose ferrique; porte-greffe tolérant (GF677) et apports de fer chélaté EDDHA indispensables.',
        },
      },
    ],
    tillageGuidance: {
      en: 'Reduced tillage or direct seeding (semis direct) works very well. Preserve crop residues to avoid wind and water erosion on sloped plateaus.',
      ar: 'الحراثة المخففة أو الزرع المباشر (Direct Seeding) يحقق نتائج ممتازة. الحفاظ على بقايا المحصول لحماية التربة من الانجراف الريحي والمائي.',
      fr: 'Le non-labour et le semis direct sont très efficaces. Maintenir les résidus de culture pour lutter contre l’érosion hydrique et éolienne.',
    },
    irrigationGuidance: {
      en: 'Supplement cereal irrigation with center pivots at critical stages (tillering, stem elongation, grain filling) with 25-30 mm applications.',
      ar: 'الري التكميلي للحبوب بالمحاور الرشاشة في المراحل الحرجة (التفريع، الاستطالة، وامتلاء الحبوب) بجرعات 25-30 ملم.',
      fr: 'Irrigation d’appoint par pivot aux stades clés (tallage, montaison, remplissage) par passages de 25-30 mm.',
    },
    nutrientAmendmentGuidance: {
      en: 'High active lime precipitates standard phosphates; use MAP/DAP banded near the seedline. Apply sulfur or acidifying nitrogen (ammonium sulfate). Add Fe-EDDHA for sensitive crops.',
      ar: 'الكلس العالي يثبت الفوسفور العادي؛ ينصح بإضافة MAP أو DAP موضعيًا مع البذور. استخدام أسمدة ذات تأثير محمض ككبريتات الأمونيوم والحديد المخلبي.',
      fr: 'Localiser les engrais P (MAP/DAP) sur la ligne de semis. Utiliser des engrais acidifiants (sulfate d’ammoniaque) et chélates Fe-EDDHA.',
    },
    drainageGuidance: {
      en: 'Natural internal drainage is generally good; focus on contour farming and vegetative filter strips to prevent gullying during autumn flash rains.',
      ar: 'الصرف الداخلي جيد عمومًا؛ التركيز على الحراثة الكنتورية وأشرطة التصفية العشبية لمنع تشكل الأخاديد أثناء أمطار الخريف.',
      fr: 'Drainage naturel satisfaisant; privilégier le travail en courbes de niveau pour limiter le ravinement automnal.',
    },
  },

  {
    id: 'sahara_arenosols_erg',
    soilClass: 'arenosol',
    name: {
      en: 'Saharan Deep Arenosols (Erg Sand & Oases Basins)',
      ar: 'التربة الرملية الصحراوية العميقة (رمال العرق والواحات)',
      fr: 'Arénosols sahariens (Sables éoliens de l’Erg & Bassins oasiens)',
    },
    localPedologicalTerm: {
      en: 'Sables du Grand Erg Oriental (Souf / Ziban / Ouargla)',
      ar: 'رمال العرق الشرقي الكبير (وادي سوف، بسكرة، ورقلة)',
      fr: 'Sables éoliens du Souf et des Ziban (Arénosols dunaires)',
    },
    regionName: {
      en: 'Bas-Sahara & Ziban (Desert Agricultural Poles)',
      ar: 'الصحراء والزيبان (الأقطاب الزراعية الصحراوية)',
      fr: 'Bas-Sahara & Bassin des Ziban',
    },
    provinces: ['El Oued (39)', 'Biskra (07)', 'Ouargla (30)', 'Ghardaïa (47)', 'Adrar (01)', 'Timimoun (49)', 'Touggourt (55)'],
    coordinates: { lat: 33.36, lng: 6.86 },
    clayPct: 4,
    siltPct: 6,
    sandPct: 90,
    textureLabel: {
      en: 'Coarse Desert Sand (Sable grossier à moyen)',
      ar: 'رمل صحراوي خشن إلى متوسط',
      fr: 'Sable dunaire grossier à moyen',
    },
    phH2O: 8.3,
    activeLimeCaCO3Pct: 11.0,
    organicMatterPct: 0.35,
    cecMeq100g: 4.8,
    bulkDensityGcm3: 1.62,
    electricalConductivityDsm: 2.8,
    availableWaterCapacityMmPerM: 55,
    infiltrationRateMmh: 85,
    swellingShrinkageRisk: 'none',
    waterloggingRisk: 'none',
    chlorosisRisk: 'moderate',
    salinityRisk: 'very_high',
    compactionRisk: 'none',
    erosionRisk: 'very_high',
    horizons: [
      {
        horizon: 'A (0-20 cm)',
        depthCm: '0 - 20 cm',
        description: {
          en: 'Wind-blown quartz desert sand, almost zero structural cohesion, minimal organic matter, ultra-fast drainage and aeration.',
          ar: 'رمال كوارتزية صحراوية هشة، شبه منعدمة المادة العضوية، نفاذية وتهوية فائقة السرعة.',
          fr: 'Sable dunaire éolien quartzeux, cohésion nulle, quasi dépourvu de matière organique, filtration extrême.',
        },
        organicMatterPct: 0.4,
        clayPct: 3,
        ph: 8.2,
        calciumCarbonatePct: 10.0,
      },
      {
        horizon: 'C1 (20-90 cm)',
        depthCm: '20 - 90 cm',
        description: {
          en: 'Homogeneous loose sand with gypsum veinlets (Gypse), low cation exchange capacity, high root penetration speed.',
          ar: 'رمال حرة متجانسة مع عروق جبسية رقيقة، تسمح بتعمق وتفرع جذري هائل وسريع.',
          fr: 'Sable meuble avec veinules gypseuses, très faible CEC, pénétration racinaire sans obstacle.',
        },
        organicMatterPct: 0.2,
        clayPct: 4,
        ph: 8.3,
        calciumCarbonatePct: 12.0,
      },
      {
        horizon: 'C2 / Gyp (90-150+ cm)',
        depthCm: '90 - 150+ cm',
        description: {
          en: 'Gypsiferous or sandstone hardpan layer at variable depth, water table depth varies with hydro-agricultural management.',
          ar: 'طبقة جبسية أو صخرية صلبة على أعماق متفاوتة تحدد مستوى المياه الجوفية.',
          fr: 'Horizon gypseux encroûté à profondeur variable sous-jacent.',
        },
        organicMatterPct: 0.1,
        clayPct: 5,
        ph: 8.4,
        calciumCarbonatePct: 15.0,
      },
    ],
    cropYieldMultipliers: [
      {
        cropId: 'potato_pivot',
        cropName: { en: 'Pivot Desert Potato (Spunta / El Oued)', ar: 'بطاطا السوف تحت الرش المحوري (سبونتا)', fr: 'Pomme de terre sous pivot (El Oued)' },
        cropEmoji: '🥔',
        baseYieldTonsHa: 32.0,
        calibratedYieldTonsHa: 52.0,
        multiplier: 1.62,
        confidencePct: 96,
        agronomicNote: {
          en: 'Frictionless sandy soil allows perfect spherical tuber expansion, clean skin, and record yields under automated pivot fertigation (12-16 cycles/day).',
          ar: 'التربة الرملية غير المقاومة تتيح تدرنًا مثاليًا للدرنات وبشرة ناصعة ومردوداً قياسياً مع التسميد بالري المحوري (12-16 نبضة يومياً).',
          fr: 'Le sable meuble permet un développement parfait des tubercules et des rendements records sous fertigation par pivot.',
        },
      },
      {
        cropId: 'tomato_greenhouse',
        cropName: { en: 'Early Greenhouse Tomato (Biskra Ziban)', ar: 'طماطم البيوت البلاستيكية المبكرة (بسكرة)', fr: 'Tomate primeur sous serre (Biskra)' },
        cropEmoji: '🍅',
        baseYieldTonsHa: 90.0,
        calibratedYieldTonsHa: 145.0,
        multiplier: 1.61,
        confidencePct: 95,
        agronomicNote: {
          en: 'Unmatched solar radiation combined with soil acting as a pure hydroponic substrate enables exceptional early winter yields under micro-drip fertigation.',
          ar: 'الإشعاع الشمسي الاستثنائي مع تصرف التربة كوسط هيدروبونيكي يسمح بإنتاج شتوي مبكر هائل مع التسميد بالتنقيط الدقيق.',
          fr: 'Le sable sert de substrat hydroponique naturel permettant des rendements hivernaux hors pair sous fertigation régulée.',
        },
      },
      {
        cropId: 'date_palm',
        cropName: { en: 'Deglet Nour Date Palm (Phoenix dactylifera)', ar: 'نخيل دقلة نور الأصيلة', fr: 'Palmier Dattier Deglet Nour' },
        cropEmoji: '🌴',
        baseYieldTonsHa: 8.5,
        calibratedYieldTonsHa: 11.8,
        multiplier: 1.39,
        confidencePct: 98,
        agronomicNote: {
          en: 'The legendary terroir for Deglet Nour; deep aeration and sandy drainage prevent root rot while warm soil enhances date sugar accumulation.',
          ar: 'الموطن الأسطوري لدقلة نور؛ التهوية العميقة تحمي الجذور والحرارة الأرضية تسرع نضج وتسكير التمور.',
          fr: 'Terroir d’excellence de la Deglet Nour; l’aération profonde et la chaleur du sol favorisent la translucidité et la teneur en sucre.',
        },
      },
      {
        cropId: 'wheat_pivot',
        cropName: { en: 'Saharan Irrigated Wheat (Adrar / Timimoun / El Menia)', ar: 'القمح الصحراوي المسقي (أدرار / المنيعة)', fr: 'Blé saharien sous pivot' },
        cropEmoji: '🌾',
        baseYieldTonsHa: 4.5,
        calibratedYieldTonsHa: 6.8,
        multiplier: 1.51,
        confidencePct: 93,
        agronomicNote: {
          en: 'High photosynthetic active radiation + precision pivot irrigation achieves 6.5-7.5 t/ha with high protein, requiring split nitrogen applications.',
          ar: 'إشعاع ضوئي مرتفع مع الري المحوري الدقيق يحقق 6.5 إلى 7.5 طن/هكتار، ويتطلب تجزئة التسميد الآزوتي لمنع الغسيل.',
          fr: 'Rayonnement solaire intense et pivots permettent d’atteindre 7 t/ha, à condition de fractionner rigoureusement l’azote.',
        },
      },
    ],
    tillageGuidance: {
      en: 'No deep plowing needed (loose soil). Light harrowing or laser leveling only. Establish windbreaks (palisades / casuarina) to halt dune migration and sandblasting on young seedlings.',
      ar: 'لا حاجة للحراثة العميقة لليونة التربة. تسوية بالليزر فقط. ضرورة إنشاء مصدات رياح (أسيجة جريد النخيل أو الكازورينا) لمنع زحف الرمال وحماية الشتلات.',
      fr: 'Pas de labour profond nécessaire. Simple nivellement laser. Brise-vents indispensables pour protéger les semis du vent de sable.',
    },
    irrigationGuidance: {
      en: 'Low water storage (AWC < 60 mm/m) mandates high-frequency micro-irrigation (2 to 5 daily pulses in summer). Automated solenoid valves and soil moisture tensiometers are critical.',
      ar: 'ضعف السعة الاحتفاظية يفرض الري النبضي متعدد الجرعات (2 إلى 5 نبضات يوميًا صيفًا). استخدام المحابس الأوتوماتيكية ومجسات الرطوبة أمر حاسم.',
      fr: 'Très faible réserve utile : irriguer par pulsations fréquentes (2 à 5 fois/jour en été) au goutte-à-goutte ou pivot automatisé.',
    },
    nutrientAmendmentGuidance: {
      en: 'Very low CEC means nutrients leach rapidly. Deliver 100% of N-P-K-Ca-Mg through dissolved fertigation (daily micro-doses). Regular compost or fermented manure (30-40 t/ha) builds organic buffer.',
      ar: 'ضعف التبادل الأيوني يسبب غسيل العناصر بسرعة؛ يجب تقديم جميع المغذيات عبر ماء الري (تسميد بالري اليومي). إضافة السماد العضوي المعقم لرفع السعة التخزينية.',
      fr: 'Fertigation continue en micro-doses indispensables (le lessivage est instantané). Apport massif de fumier décomposé (30-40 t/ha) pour créer du complexe.',
    },
    drainageGuidance: {
      en: 'Natural percolation is rapid, but rising saline groundwater in low-lying oasis basins requires deep open drainage ditches or buried perforated PVC collectors.',
      ar: 'النفاذية سريعة، لكن صعود المياه الجوفية المالحة في المنخفضات الواحية يتطلب شبكات تصريف عميقة مغطاة أو مكشوفة.',
      fr: 'Surveiller les remontées de nappes saumâtres; installer des drains collecteurs profonds dans les cuvettes oasiennes.',
    },
  },

  {
    id: 'cheliff_fluvisols',
    soilClass: 'fluvisol',
    name: {
      en: 'Cheliff & Seybouse River Valley Fluvisols (Rich Stratified Alluvium)',
      ar: 'تربة الفلوفيسول بوديان الشلف والسيبوس (التربة الرسوبية الفيضية الغنية)',
      fr: 'Fluvisols des vallées du Cheliff & de la Seybouse (Alluvions fertiles)',
    },
    localPedologicalTerm: {
      en: 'Sols Alluviaux de Terrasses d’Oueds (Cheliff, Seybouse, Soummam)',
      ar: 'التربة الطمية الرسوبية لضفاف الأودية والسهول الفيضية',
      fr: 'Sols d’alluvions récentes et de terrasses fluviatiles',
    },
    regionName: {
      en: 'Cheliff Valley & Coastal River Basins',
      ar: 'حوض وادي الشلف والوديان الساحلية',
      fr: 'Vallée du Chéliff & Bassins Fluviaux',
    },
    provinces: ['Aïn Defla (44)', 'Chlef (02)', 'Relizane (48)', 'Mascara (29)', 'Béjaïa (06)', 'Annaba (23)', 'El Tarf (36)'],
    coordinates: { lat: 36.26, lng: 1.96 },
    clayPct: 30,
    siltPct: 48,
    sandPct: 22,
    textureLabel: {
      en: 'Silt Loam to Fine Sandy Loam (Limono-sableux)',
      ar: 'طميي غريني ناعم وخصب',
      fr: 'Limoneux à limono-sableux alluvial',
    },
    phH2O: 7.8,
    activeLimeCaCO3Pct: 14.0,
    organicMatterPct: 2.1,
    cecMeq100g: 24.5,
    bulkDensityGcm3: 1.32,
    electricalConductivityDsm: 1.6,
    availableWaterCapacityMmPerM: 175,
    infiltrationRateMmh: 24,
    swellingShrinkageRisk: 'low',
    waterloggingRisk: 'moderate',
    chlorosisRisk: 'moderate',
    salinityRisk: 'moderate',
    compactionRisk: 'moderate',
    erosionRisk: 'moderate',
    horizons: [
      {
        horizon: 'Ap (0-30 cm)',
        depthCm: '0 - 30 cm',
        description: {
          en: 'Deep friable silt loam topsoil, dark yellowish brown, highly biologically active, excellent root development.',
          ar: 'أفق سطحي طميي غريني عميق وهش، نشاط بيولوجي كثيف، وسط مثالي لانتشار الجذور.',
          fr: 'Horizon superficiel limoneux profond, très meuble, excellente activité biologique et enracinement.',
        },
        organicMatterPct: 2.2,
        clayPct: 28,
        ph: 7.7,
        calciumCarbonatePct: 12.0,
      },
      {
        horizon: 'C1 (30-80 cm)',
        depthCm: '30 - 80 cm',
        description: {
          en: 'Stratified river alluvium, alternating silt and fine sand lenses, high moisture storage without compaction.',
          ar: 'طبقات طميية رسوبية متعاقبة من الطمي والرمل الناعم، تخزين مائي مريح دون اختناق.',
          fr: 'Alluvions stratifiées avec lentilles de sables fins et limons fertiles.',
        },
        organicMatterPct: 1.5,
        clayPct: 32,
        ph: 7.8,
        calciumCarbonatePct: 15.0,
      },
      {
        horizon: '2C (80-140+ cm)',
        depthCm: '80 - 140+ cm',
        description: {
          en: 'Gravelly and sandy deeper layer providing natural deep drainage.',
          ar: 'طبقة سفلية حصوية رملية تضمن صرفاً عميقاً طبيعياً للمياه الزائدة.',
          fr: 'Couche sous-jacente graveleuse assurant un bon drainage profond.',
        },
        organicMatterPct: 0.5,
        clayPct: 24,
        ph: 7.9,
        calciumCarbonatePct: 16.0,
      },
    ],
    cropYieldMultipliers: [
      {
        cropId: 'potato',
        cropName: { en: 'Late & Season Potato (Ain Defla / Cheliff)', ar: 'بطاطا عين الدفلى والشلف الموسمية', fr: 'Pomme de terre d’Aïn Defla' },
        cropEmoji: '🥔',
        baseYieldTonsHa: 34.0,
        calibratedYieldTonsHa: 46.0,
        multiplier: 1.35,
        confidencePct: 96,
        agronomicNote: {
          en: 'The national capital for seed and consumption potatoes; deep alluvial silt gives premium tuber size and high marketable percentage (>90%).',
          ar: 'القطب الوطني الأول لإنتاج بذور واستهلاك البطاطا؛ الطمي العميق يعطي حجماً ممتازاً وتجانساً تجارياً يفوق 90%.',
          fr: 'Cœur de la production nationale de pomme de terre; le limon alluvionnaire permet un calibre homogène et un rendement commercial > 90%.',
        },
      },
      {
        cropId: 'apple_orchard',
        cropName: { en: 'Apple & Pear Orchards (Ain Defla / Medea)', ar: 'بساتين التفاح والإجاص (عين الدفلى / المدية)', fr: 'Vergers de pommiers & poiriers' },
        cropEmoji: '🍏',
        baseYieldTonsHa: 25.0,
        calibratedYieldTonsHa: 33.0,
        multiplier: 1.32,
        confidencePct: 91,
        agronomicNote: {
          en: 'Deep soil profile allows deep taproot development with abundant mineral replenishment during fruit enlargement.',
          ar: 'العمق الكبير للتربة يسمح بتمدد الجذور وامتصاص العناصر المغذية بكفاءة في مرحلة تحجيم الثمار.',
          fr: 'Le profil profond favorise l’ancrage racinaire et la nutrition minérale soutenue pendant le grossissement.',
        },
      },
      {
        cropId: 'watermelon_melon',
        cropName: { en: 'Watermelon & Melon (Pastèque de Chlef)', ar: 'البطيخ والشمام (دلاع الشلف وريغ)', fr: 'Pastèque & Melon du Chéliff' },
        cropEmoji: '🍉',
        baseYieldTonsHa: 42.0,
        calibratedYieldTonsHa: 56.0,
        multiplier: 1.33,
        confidencePct: 92,
        agronomicNote: {
          en: 'Warm alluvial soil + high sunshine in the Cheliff valley produces high sucrose concentrations and rapid biomass accumulation.',
          ar: 'دفء التربة الرسوبية مع شمس حوض الشلف ينتج حلاوة وسكرية عالية ونمواً خضرياً سريعاً.',
          fr: 'Terroir chaud et meuble favorisant une croissance rapide et un taux de sucre exceptionnel.',
        },
      },
    ],
    tillageGuidance: {
      en: 'Very easily workable soil with high tilth. Rotary tillage or disc cultivation in spring produces an ideal fine seedbed. Avoid working during winter river overflow periods.',
      ar: 'تربة سهلة الخدمة وذات قابلية تفتت عالية. التنعيم السطحي في الربيع يعطي مهد بذور ممتاز. تجنب العمل عند فيضان الأودية شتاءً.',
      fr: 'Sol très facile à travailler. Le travail superficiel au printemps produit un lit de semences parfait. Éviter les périodes de crues hivernales.',
    },
    irrigationGuidance: {
      en: 'Balanced water holding capacity (AWC ~175 mm/m) fits drip or sprinkler systems. Monitor salinity of irrigation water pumped from Oued Cheliff in late summer.',
      ar: 'السعة الاحتفاظية المتوازنة تناسب الري بالتنقيط أو الرش. مراقبة ملوحة مياه وادي الشلف في أواخر الصيف.',
      fr: 'Très bonne réserve utile. Adapter la fréquence d’arrosage au goutte-à-goutte. Surveiller la salinité de l’eau du Chéliff en fin d’été.',
    },
    nutrientAmendmentGuidance: {
      en: 'Balanced base fertility; respond excellently to standard N-P-K balanced programs with soluble calcium nitrate and potassium sulfate during bulking.',
      ar: 'خصوبة طبيعية متوازنة؛ استجابة ممتازة للتسميد المتوازن N-P-K مع نترات الكالسيوم وسلفات البوتاسيوم في مرحلة التحجيم.',
      fr: 'Fertilité naturelle élevée; excellente réponse aux programmes équilibrés N-P-K avec apports de calcium et sulfate de potassium.',
    },
    drainageGuidance: {
      en: 'Good vertical drainage, but maintain elevated dikes to protect alluvial parcels against seasonal river overflow during heavy storms.',
      ar: 'صرف عمودي جيد، مع ضرورة صيانة السواتر الترابية لحماية الحقول من فيضانات الأودية الموسمية.',
      fr: 'Bonne perméabilité verticale; entretenir les digues de protection contre les crues de l’oued.',
    },
  },

  {
    id: 'relizane_hodna_solonchaks',
    soilClass: 'solonchak',
    name: {
      en: 'Chott & Sebkha Halomorphic Solonchaks (Saline / Sodic Soils)',
      ar: 'تربة السولونشاك الملحية بالسباخ والشطوط (تربة ملحية وصودية)',
      fr: 'Solonchaks halomorphes des Chotts & Sebkhas (Sols salés / sodiques)',
    },
    localPedologicalTerm: {
      en: 'Sols Salés et Sebkhas (Chott Melghir / Hodna / Mina)',
      ar: 'تربة السباخ والأراضي الملحية (شط الحضنة / ملغيغ / محيط المينا)',
      fr: 'Sols halomorphes salins et sols à alcalis (Sebkhas)',
    },
    regionName: {
      en: 'Chott Depressions & Lower Plains (Saline Belts)',
      ar: 'منخفضات الشطوط والسهول الملحية',
      fr: 'Dépressions des Chotts & Bassins Salins',
    },
    provinces: ['M’Sila (28)', 'Relizane (48)', 'Mascara - Habra (29)', 'Oran Sebkha (31)', 'Biskra - Sidi Okba (07)'],
    coordinates: { lat: 35.70, lng: 4.54 },
    clayPct: 40,
    siltPct: 38,
    sandPct: 22,
    textureLabel: {
      en: 'Saline Silty Clay with Surface Salt Efflorescence',
      ar: 'طين طميي ملحي مع قشور ملحية سطحية',
      fr: 'Argilo-limoneux salé avec efflorescences salines',
    },
    phH2O: 8.6,
    activeLimeCaCO3Pct: 18.0,
    organicMatterPct: 0.9,
    cecMeq100g: 28.0,
    bulkDensityGcm3: 1.55,
    electricalConductivityDsm: 7.8,
    availableWaterCapacityMmPerM: 110,
    infiltrationRateMmh: 4,
    swellingShrinkageRisk: 'moderate',
    waterloggingRisk: 'high',
    chlorosisRisk: 'high',
    salinityRisk: 'severe',
    compactionRisk: 'severe',
    erosionRisk: 'moderate',
    horizons: [
      {
        horizon: 'Az (0-15 cm)',
        depthCm: '0 - 15 cm',
        description: {
          en: 'Surface salic horizon with white crystalline salt crusts (NaCl, Na2SO4), high electrical conductivity, poor structural stability.',
          ar: 'أفق ملحي سطحي مع قشور بلورية بيضاء، ناقلية كهربائية مرتفعة وهشاشة في البنية.',
          fr: 'Horizon salic de surface avec croûtes de sels blancs, forte conductivité électrique.',
        },
        organicMatterPct: 0.9,
        clayPct: 38,
        ph: 8.5,
        calciumCarbonatePct: 16.0,
      },
      {
        horizon: 'Bzn (15-60 cm)',
        depthCm: '15 - 60 cm',
        description: {
          en: 'Dense natric layer with high Exchangeable Sodium Percentage (ESP > 15%), dispersed clay particles, slow permeability.',
          ar: 'أفق صودي كثيف مع نسبة صوديوم متبادل تفوق 15% وتشتت حبيبات الطين وضعف شديد في النفاذية.',
          fr: 'Horizon natrique dense avec fort pourcentage de sodium échangeable (ESP > 15%) et argile dispersée.',
        },
        organicMatterPct: 0.6,
        clayPct: 44,
        ph: 8.7,
        calciumCarbonatePct: 20.0,
      },
      {
        horizon: 'C (60-110+ cm)',
        depthCm: '60 - 110+ cm',
        description: {
          en: 'Gleyed hydromorphic salty alluvium, high groundwater table during winter.',
          ar: 'رواسب طميية ملحية رطبة مع تأثر بالماء الجوفي المالح شتاءً.',
          fr: 'Alluvions salines hydromorphes avec niveau de nappe salée peu profond.',
        },
        organicMatterPct: 0.3,
        clayPct: 36,
        ph: 8.6,
        calciumCarbonatePct: 22.0,
      },
    ],
    cropYieldMultipliers: [
      {
        cropId: 'barley',
        cropName: { en: 'Salt-Tolerant Barley (Orge Saida / Tichedrett)', ar: 'الشعير المقاوم للملوحة (سعيدة / تيشدريت)', fr: 'Orge tolérante à la salinité' },
        cropEmoji: '🌾',
        baseYieldTonsHa: 2.8,
        calibratedYieldTonsHa: 3.1,
        multiplier: 1.11,
        confidencePct: 91,
        agronomicNote: {
          en: 'Barley has high osmotic tolerance (ECe threshold ~8.0 dS/m) and yields reliably where other cereals fail.',
          ar: 'يمتلك الشعير قدرة تحمل أسموزية عالية (عتبة ملوحة حتى 8.0 ديسي سيمنز/م) وينتج بثبات حيث تفشل الحبوب الأخرى.',
          fr: 'L’orge possède une forte tolérance osmotique (seuil CEe ~8.0 dS/m) et réussit là où le blé échoue.',
        },
      },
      {
        cropId: 'date_palm',
        cropName: { en: 'Date Palm (Halotolerant varieties: Ghars / Deglet)', ar: 'نخيل التمر (أصناف متحملة للملوحة كالغرس والدقلة)', fr: 'Palmier Dattier (Ghars / Deglet)' },
        cropEmoji: '🌴',
        baseYieldTonsHa: 8.0,
        calibratedYieldTonsHa: 8.2,
        multiplier: 1.02,
        confidencePct: 94,
        agronomicNote: {
          en: 'Excellent natural salinity tolerance; requires leaching fraction of 15-20% to prevent root zone salt build-up.',
          ar: 'تحمل طبيعي ممتاز للملوحة؛ يتطلب نسبة غسيل مائي 15-20% لمنع تراكم الأملاح حول الجذور.',
          fr: 'Très bonne tolérance naturelle; nécessite une fraction de lessivage (15-20%) pour maintenir la fertilité.',
        },
      },
      {
        cropId: 'citrus',
        cropName: { en: 'Citrus (Salt sensitive)', ar: 'الحمضيات (حساسة جداً للملوحة)', fr: 'Agrumes (Sensibles à la salinité)' },
        cropEmoji: '🍊',
        baseYieldTonsHa: 26.0,
        calibratedYieldTonsHa: 13.5,
        multiplier: 0.52,
        confidencePct: 95,
        agronomicNote: {
          en: 'Severe osmotic and chloride toxicity penalty; leaf burn, drop in fruit size. Must use Cleopatra mandarin or Volkameriana rootstocks with desalting amendments.',
          ar: 'انخفاض شديد بسبب السمية الأسموزية للكلور؛ احتراق حواف الأوراق وصغر حجم الثمار. يتطلب أصولاً متحملة (Cleopatra/Volkameriana).',
          fr: 'Pénalité sévère due à la toxicité chlorée; nécroses foliaires. Porte-greffe tolérant (Mandarine Cléopâtre) obligatoire.',
        },
      },
    ],
    tillageGuidance: {
      en: 'Do not pulverize soil structure (prevents clay dispersion). Deep ripping to break salt pan layers followed by flood leaching during rainy season.',
      ar: 'تجنب التنعيم المفرط للتربة لمنع تفكك وتشتت الطين. إجراء شق عميق لكسر الطبقات الملحية الصلبة مع الغسيل المائي.',
      fr: 'Éviter le broyage fin du sol pour ne pas disperser les argiles. Pratiquer un sous-solage profond pour fissurer les horizons salins.',
    },
    irrigationGuidance: {
      en: 'Mandatory Leaching Fraction (LF = 15-25% extra water) to flush salts below the active root zone. Night irrigation minimizes evaporation and surface salinization.',
      ar: 'تطبيق نسبة غسيل مائي إضافية (15-25% ماء إضافي) لدفع الأملاح أسفل منطقة الجذور. الري الليلي يقلل التبخر وتراكم الملح السطحي.',
      fr: 'Appliquer systématiquement une fraction de lessivage (15-25%) pour chasser les sels en profondeur. Privilégier les arrosages nocturnes.',
    },
    nutrientAmendmentGuidance: {
      en: 'Apply Agricultural Gypsum (Plâtre agricole / Phosphogypse 3-6 t/ha) to displace toxic Exchangeable Sodium ($Na^+$) with beneficial Calcium ($Ca^{2+}$). Use potassium sulfate to restore K/Na ratio.',
      ar: 'إضافة الجبس الزراعي (3-6 طن/هـ) لاستبدال الصوديوم الضار بالكالسيوم المفيد. استخدام سلفات البوتاسيوم لتعديل نسبة K/Na.',
      fr: 'Apport de gypse agricole (3-6 t/ha) pour remplacer le sodium échangeable par du calcium. Préférer le sulfate de potassium.',
    },
    drainageGuidance: {
      en: 'Subsurface tile drainage (drains enterrés) spaced at 15-20 meters is essential to evacuate saline water and lower the saline water table.',
      ar: 'شبكة صرف مغطاة على مسافات 15-20 متراً أمر أساسي لخفض مستوى الماء الأرضي المالح وتصريف مياه الغسيل.',
      fr: 'Réseau de drainage enterré espacé de 15-20 m indispensable pour évacuer les eaux de lessivage et rabattre la nappe.',
    },
  },

  {
    id: 'tlemcen_dahra_luvisols',
    soilClass: 'luvisol',
    name: {
      en: 'Mediterranean Red Luvisols & Terra Rossa (Tlemcen / Dahra / Kabylie Hills)',
      ar: 'التربة الحمراء المتوسطية وتيرا روزا (تلمسان / الظهرة / تلال القبائل)',
      fr: 'Luvisols & Terra Rossa méditerranéens (Tlemcen / Dahra / Kabylie)',
    },
    localPedologicalTerm: {
      en: 'Sols Rouges Fersiallitiques sur Calcaires Durs (Terra Rossa)',
      ar: 'التربة الحمراء الفيرسياليتية على صخور كلسية صلبة (تيرا روزا)',
      fr: 'Sols rouges fersiallitiques et Luvisols chromiques',
    },
    regionName: {
      en: 'Coastal Hills, Monts de Tlemcen & Tellian Atlas',
      ar: 'تلال الساحل، جبال تلمسان والأطلس التلي',
      fr: 'Monts de Tlemcen, Dahra & Atlas Tellien',
    },
    provinces: ['Tlemcen (13)', 'Tizi Ouzou (15)', 'Médéa (26)', 'Mostaganem (27)', 'Skikda (21)', 'Jijel (18)', 'Ain Témouchent (46)'],
    coordinates: { lat: 34.88, lng: -1.31 },
    clayPct: 38,
    siltPct: 32,
    sandPct: 30,
    textureLabel: {
      en: 'Clay Loam to Sandy Clay Loam (Argilo-limoneux rouge)',
      ar: 'طين طميي أحمر غني بأكاسيد الحديد',
      fr: 'Argilo-limoneux à argilo-sableux rouge',
    },
    phH2O: 7.2,
    activeLimeCaCO3Pct: 4.5,
    organicMatterPct: 2.6,
    cecMeq100g: 26.0,
    bulkDensityGcm3: 1.34,
    electricalConductivityDsm: 0.6,
    availableWaterCapacityMmPerM: 165,
    infiltrationRateMmh: 20,
    swellingShrinkageRisk: 'low',
    waterloggingRisk: 'low',
    chlorosisRisk: 'none',
    salinityRisk: 'none',
    compactionRisk: 'moderate',
    erosionRisk: 'high',
    horizons: [
      {
        horizon: 'A (0-25 cm)',
        depthCm: '0 - 25 cm',
        description: {
          en: 'Reddish brown granular topsoil, rich in organic matter and iron oxides (hematite), stable crumb structure.',
          ar: 'أفق سطحي بني محمر حُبيبي، غني بالمادة العضوية وأكاسيد الحديد (الهيماتيت)، بنية ممتازة ومقاومة.',
          fr: 'Horizon superficiel brun-rougeâtre granulaire, riche en MO et oxydes de fer, structure grumeleuse très stable.',
        },
        organicMatterPct: 2.7,
        clayPct: 34,
        ph: 7.1,
        calciumCarbonatePct: 3.5,
      },
      {
        horizon: 'Bt / Argic (25-75 cm)',
        depthCm: '25 - 75 cm',
        description: {
          en: 'Vivid brick-red argic horizon with clay illuviation, well structured, good nutrient storage capacity.',
          ar: 'أفق طيني أحمر قرميدي غني بالطين المتراكم، قدرة تخزين غذائي وتوازن كاتيونات ممتاز.',
          fr: 'Horizon Bt rouge brique bien structuré avec illuviation d’argile, excellente capacité d’échange.',
        },
        organicMatterPct: 1.6,
        clayPct: 42,
        ph: 7.3,
        calciumCarbonatePct: 5.5,
      },
      {
        horizon: 'R (75-120+ cm)',
        depthCm: '75 - 120+ cm',
        description: {
          en: 'Hard Jurassic / Cretaceous limestone bedrock with karst fissures allowing deep root anchoring.',
          ar: 'صخور كلسية صلبة ذات شقوق كارستية تسمح بتعمق وتثبيت جذور الأشجار العتيقة.',
          fr: 'Substratum calcaire dur karstifié avec fissures pénétrées par les racines profondes.',
        },
        organicMatterPct: 0.4,
        clayPct: 26,
        ph: 7.5,
        calciumCarbonatePct: 12.0,
      },
    ],
    cropYieldMultipliers: [
      {
        cropId: 'olive',
        cropName: { en: 'High Density Olive (Sigoise / Chemlal)', ar: 'الزيتون المكثف (سيقواز / شملال)', fr: 'Oliveraies intensives & traditionnelles' },
        cropEmoji: '🫒',
        baseYieldTonsHa: 6.5,
        calibratedYieldTonsHa: 8.8,
        multiplier: 1.35,
        confidencePct: 95,
        agronomicNote: {
          en: 'The prime soil for world-class olive oil; iron-rich red clay confers rich fruity aromatics and high stability.',
          ar: 'التربة المثالية لإنتاج أجود زيوت الزيتون؛ الطين الأحمر الغني بالحديد يمنح نكهة فواكه فريدة وثباتية عالية.',
          fr: 'Terroir d’excellence de l’oléiculture; le sol rouge confère une typicité fruitée et une grande stabilité.',
        },
      },
      {
        cropId: 'grapevine',
        cropName: { en: 'Table & Wine Grapes (Vignoble de Tlemcen / Dahra)', ar: 'كروم العنب (تلمسان / الظهرة / المدية)', fr: 'Vignobles de Tlemcen & du Dahra' },
        cropEmoji: '🍇',
        baseYieldTonsHa: 12.0,
        calibratedYieldTonsHa: 15.6,
        multiplier: 1.30,
        confidencePct: 93,
        agronomicNote: {
          en: 'Excellent aeration, balanced pH (7.0-7.3), and iron availability yield high sugar/acid balance and deep color pigmentation.',
          ar: 'تهوية ممتازة وحموضة متوازنة ووفرة الحديد تعطي توازناً سكرياً ولوناً صبغياً جذاباً للعناقيد.',
          fr: 'Aération parfaite et richesse en fer assurant un équilibre sucre/acidité idéal et une coloration intense.',
        },
      },
      {
        cropId: 'fig_almond',
        cropName: { en: 'Figs & Almonds (Figuier / Amandier)', ar: 'التين واللوز', fr: 'Figuiers & Amandiers' },
        cropEmoji: '🌰',
        baseYieldTonsHa: 4.5,
        calibratedYieldTonsHa: 5.8,
        multiplier: 1.29,
        confidencePct: 90,
        agronomicNote: {
          en: 'Deep fissures in limestone subsoil provide drought resilience for dryland Mediterranean orchards.',
          ar: 'الشقوق العميقة في الصخور الكلسية السفلية تمنح مقاومة استثنائية للجفاف في الزراعات البعلية.',
          fr: 'Enracinement profond dans les fissures karstiques assurant une excellente tolérance à la sécheresse.',
        },
      },
    ],
    tillageGuidance: {
      en: 'Contour tillage across slopes is vital to curb erosion. Maintain grass strips between tree rows (enherbement inter-rang) to protect red topsoil from runoff.',
      ar: 'الحراثة الكنتورية المتعامدة مع الانحدار أمر حيوي لمنع الانجراف. ترك أشرطة عشبية بين صفوف الأشجار لحماية التربة الحمراء.',
      fr: 'Labour impératif suivant les courbes de niveau. Enherbement inter-rangs conseillé pour fixer le sol superficiel.',
    },
    irrigationGuidance: {
      en: 'Good water retention and infiltration. Localized drip irrigation with pressure regulators accommodates hill slope gradients.',
      ar: 'احتفاظ ونفاذية جيدة للمياه. استخدام التنقيط الموضعي مع منظمات الضغط للتغلب على فروقات الارتفاع في التلال.',
      fr: 'Bonne perméabilité et réserve utile. Utiliser des goutteurs auto-régulants pour compenser les dénivelés de pente.',
    },
    nutrientAmendmentGuidance: {
      en: 'Optimal natural pH (7.0-7.4) and iron availability. Supplement with phosphorus and boron for fruit setting in orchards. Maintain organic matter with pruned branch shredding.',
      ar: 'حموضة طبيعية مثالية وتوافر ممتاز للحديد. تزويد البساتين بالفوسفور والبورون لتحسين العقد. فرم مخلفات التقليم لتعزيز المادة العضوية.',
      fr: 'pH neutre idéal et fer assimilable. Compléter en phosphore et bore à la floraison. Broyage des sarments et résidus pour nourrir la MO.',
    },
    drainageGuidance: {
      en: 'Excellent natural drainage on sloped karst terrain; build stone retaining terraces on steep hillsides to prevent gullying.',
      ar: 'صرف طبيعي ممتاز على التضاريس الكارستية المنحدرة؛ تشييد مصاطب حجرية في المنحدرات الشديدة لمنع الانجراف.',
      fr: 'Drainage naturel excellent; aménager des banquettes et murets en pierres sèches sur les fortes pentes.',
    },
  },
];

/**
 * Helper to get a soil zone by ID
 */
export function getAlgeriaSoilZoneById(id: string): AlgeriaSoilZone {
  return ALGERIA_SOIL_ZONES.find((zone) => zone.id === id) || ALGERIA_SOIL_ZONES[0];
}

/**
 * Helper to find matching soil zones for a specific Wilaya (Province)
 */
export function findSoilZonesByWilaya(wilayaQuery: string): AlgeriaSoilZone[] {
  const query = wilayaQuery.toLowerCase().trim();
  return ALGERIA_SOIL_ZONES.filter((zone) =>
    zone.provinces.some((p) => p.toLowerCase().includes(query)) ||
    zone.regionName.en.toLowerCase().includes(query) ||
    zone.regionName.fr.toLowerCase().includes(query)
  );
}

/**
 * Calculates a calibrated yield multiplier for any crop given a selected soil zone and custom EC/OM overrides
 */
export function calculateSoilCalibratedYield(
  cropId: string,
  baseYieldTonsHa: number,
  soilZoneId: string,
  overrides?: {
    customSoilSalinityDsm?: number;
    customOrganicMatterPct?: number;
    hasDrainage?: boolean;
    hasSubsoiling?: boolean;
  }
): {
  calibratedYieldTonsHa: number;
  multiplier: number;
  confidencePct: number;
  soilClass: AlgeriaSoilClass;
  soilName: Record<Language, string>;
  agronomicFactors: Array<{
    name: Record<Language, string>;
    multiplier: number;
    status: 'positive' | 'neutral' | 'penalty';
    explanation: Record<Language, string>;
  }>;
} {
  const zone = getAlgeriaSoilZoneById(soilZoneId);
  const matchedCrop = zone.cropYieldMultipliers.find((c) => c.cropId.toLowerCase().includes(cropId.toLowerCase()));
  
  let baseMultiplier = matchedCrop ? matchedCrop.multiplier : 1.0;
  let confidence = matchedCrop ? matchedCrop.confidencePct : 82;
  const factors: Array<{
    name: Record<Language, string>;
    multiplier: number;
    status: 'positive' | 'neutral' | 'penalty';
    explanation: Record<Language, string>;
  }> = [];

  // 1. Base Soil Pedological Texture Factor
  factors.push({
    name: {
      en: `${zone.textureLabel.en} Texture Effect`,
      ar: `تأثير قوام التربة (${zone.textureLabel.ar})`,
      fr: `Effet texture (${zone.textureLabel.fr})`,
    },
    multiplier: baseMultiplier,
    status: baseMultiplier >= 1.05 ? 'positive' : baseMultiplier < 0.95 ? 'penalty' : 'neutral',
    explanation: matchedCrop?.agronomicNote || {
      en: `Regional pedological baseline for ${zone.name.en}.`,
      ar: `المعدل المرجعي الإقليمي للتربة (${zone.name.ar}).`,
      fr: `Référence pédologique régionale pour ${zone.name.fr}.`,
    },
  });

  // 2. Salinity Factor adjustment
  const activeSalinity = overrides?.customSoilSalinityDsm ?? zone.electricalConductivityDsm;
  if (activeSalinity > 4.0) {
    const salPenalty = Math.max(0.45, 1.0 - (activeSalinity - 3.5) * 0.08);
    baseMultiplier *= salPenalty;
    factors.push({
      name: {
        en: `High Salinity Stress (ECe: ${activeSalinity.toFixed(1)} dS/m)`,
        ar: `إجهاد الملوحة العالية (${activeSalinity.toFixed(1)} ديسي سيمنز/م)`,
        fr: `Stress salin élevé (${activeSalinity.toFixed(1)} dS/m)`,
      },
      multiplier: salPenalty,
      status: 'penalty',
      explanation: {
        en: `Osmotic barrier restricts water and nutrient uptake. Requires leaching fraction or salt-tolerant rootstocks.`,
        ar: `الحاجز الأسموزي يحد من امتصاص الماء والمغذيات. يتطلب زيادة جرعات الغسيل أو أصول مقاومة للملوحة.`,
        fr: `L'effet osmotique freine l'absorption d'eau. Fraction de lessivage ou porte-greffe résistant requis.`,
      },
    });
  } else if (activeSalinity < 1.5) {
    factors.push({
      name: {
        en: `Low Salinity Sweet Soil (ECe: ${activeSalinity.toFixed(1)} dS/m)`,
        ar: `تربة عذبة خالية من الملوحة (${activeSalinity.toFixed(1)} ديسي سيمنز/م)`,
        fr: `Sol doux sans salinité (${activeSalinity.toFixed(1)} dS/m)`,
      },
      multiplier: 1.04,
      status: 'positive',
      explanation: {
        en: `Optimal osmotic conditions with zero sodium toxicity risk.`,
        ar: `ظروف أسموزية مثالية دون مخاطر لسمية الصوديوم.`,
        fr: `Conditions osmotiques optimales sans risque de toxicité sodique.`,
      },
    });
    baseMultiplier *= 1.04;
  }

  // 3. Organic Matter Buffer
  const activeOM = overrides?.customOrganicMatterPct ?? zone.organicMatterPct;
  if (activeOM >= 2.2) {
    baseMultiplier *= 1.05;
    factors.push({
      name: {
        en: `High Organic Matter (${activeOM.toFixed(1)}% SOM)`,
        ar: `مادة عضوية ممتازة (${activeOM.toFixed(1)}%)`,
        fr: `Matière organique élevée (${activeOM.toFixed(1)}%)`,
      },
      multiplier: 1.05,
      status: 'positive',
      explanation: {
        en: `Strong microbial activity, enhanced cation exchange and moisture retention.`,
        ar: `نشاط ميكروبي حيوي يعزز التبادل الأيوني والاحتفاظ برطوبة التربة.`,
        fr: `Activité biologique et complexe argilo-humique renforcés.`,
      },
    });
  } else if (activeOM < 0.6) {
    baseMultiplier *= 0.94;
    factors.push({
      name: {
        en: `Low Organic Matter (${activeOM.toFixed(1)}% SOM)`,
        ar: `مادة عضوية ضعيفة (${activeOM.toFixed(1)}%)`,
        fr: `Faible matière organique (${activeOM.toFixed(1)}%)`,
      },
      multiplier: 0.94,
      status: 'penalty',
      explanation: {
        en: `Low buffer capacity; requires frequent micro-fertigation and compost amendments.`,
        ar: `ضعف السعة التخزينية؛ يتطلب التسميد المتكرر بالري وإضافة الكومبوست.`,
        fr: `Faible pouvoir tampon; nécessite des apports réguliers de fumier/compost.`,
      },
    });
  }

  // 4. Subsoiling & Drainage boost
  if (overrides?.hasSubsoiling && (zone.soilClass === 'vertisol' || zone.compactionRisk === 'severe' || zone.compactionRisk === 'very_high')) {
    baseMultiplier *= 1.08;
    factors.push({
      name: {
        en: `Deep Subsoiling Decompaction (+45cm)`,
        ar: `التفكيك العميق للتربة (+45 سم)`,
        fr: `Sous-solage décompacteur (+45cm)`,
      },
      multiplier: 1.08,
      status: 'positive',
      explanation: {
        en: `Eliminates hardpan compaction in heavy clays, boosting root penetration.`,
        ar: `يكسر الطبقة الصماء في التربة الطينية ويسرع تمدد الجذور.`,
        fr: `Fissuration de la semelle de labour favorisant l'aération racinaire.`,
      },
    });
  }

  const calibratedYield = Number((baseYieldTonsHa * baseMultiplier).toFixed(2));

  return {
    calibratedYieldTonsHa: Math.max(0.2, calibratedYield),
    multiplier: Number(baseMultiplier.toFixed(2)),
    confidencePct: confidence,
    soilClass: zone.soilClass,
    soilName: zone.name,
    agronomicFactors: factors,
  };
}

/**
 * Common Algerian Crops Regional Benchmark Profile
 */
export interface RegionalCropBenchmark {
  cropId: string;
  name: Record<Language, string>;
  category: 'cereal' | 'vegetable' | 'fruit' | 'legume' | 'forage';
  emoji: string;
  officialSupportPriceDzdQx: number; // Price per Quintal (100 kg)
  nationalMeanYieldTonsHa: number; // Historical standard average (conventional rainfed/irrigation)
  geneticPotentialCeilingTonsHa: number; // Maximum biophysical potential with optimal conditions
  salinityThresholdDsm: number; // Maas-Hoffman ECe threshold before yield decline
  salinitySlopePctPerDsm: number; // % yield loss per 1 dS/m increase above threshold
  activeLimeTolerancePct: number; // % active CaCO3 threshold before iron chlorosis
  waterRegimeBaseline: {
    rainfedTonsHa: number;
    supplementalTonsHa: number;
    fullIrrigatedTonsHa: number;
  };
  soilClassMultipliers: Record<
    AlgeriaSoilClass,
    {
      multiplier: number;
      compatibility: 'optimal' | 'good' | 'moderate' | 'challenging' | 'unsuitable';
      reason: Record<Language, string>;
    }
  >;
  regionalBenchmarks: Array<{
    regionKey: string;
    regionName: Record<Language, string>;
    benchmarkTonsHa: number;
    benchmarkQxHa: number;
    provincesIncluded: string[];
    context: Record<Language, string>;
  }>;
}

export const REGIONAL_CROP_BENCHMARKS: RegionalCropBenchmark[] = [
  {
    cropId: 'wheat_durum',
    name: {
      en: 'Durum Wheat (Blé Dur CCLS)',
      ar: 'القمح الصلب (القمح المعتمد لدى CCLS)',
      fr: 'Blé dur (Prix garanti CCLS)',
    },
    category: 'cereal',
    emoji: '🌾',
    officialSupportPriceDzdQx: 6000, // 6000 DZD / Qx = 60 DZD / kg
    nationalMeanYieldTonsHa: 2.8,
    geneticPotentialCeilingTonsHa: 6.5,
    salinityThresholdDsm: 5.9,
    salinitySlopePctPerDsm: 3.8,
    activeLimeTolerancePct: 20.0,
    waterRegimeBaseline: {
      rainfedTonsHa: 2.6,
      supplementalTonsHa: 4.2,
      fullIrrigatedTonsHa: 5.8,
    },
    soilClassMultipliers: {
      calcisol: {
        multiplier: 1.25,
        compatibility: 'optimal',
        reason: {
          en: 'Calcisols on the High Plateaus enhance vitreousness, amber translucency, and grain protein (>13.5%) crucial for semolina quality.',
          ar: 'التربة الكلسية في الهضاب العليا تعزز نسبة التزجيج واللون الكهرماني والبروتين (>13.5%) الممتاز للسميد.',
          fr: 'Les sols calcaires des Hauts Plateaux stimulent la vitrosité et la teneur en protéines (>13.5%) pour la semoulerie.',
        },
      },
      vertisol: {
        multiplier: 1.30,
        compatibility: 'optimal',
        reason: {
          en: 'Heavy clays hold spring reserve moisture, protecting grain filling from hot Sirocco desiccating winds.',
          ar: 'التربة الطينية الثقيلة تحتفظ بالرطوبة لامتلاء الحبوب وتحمي المحصول من رياح السيروكو (الشهيلي).',
          fr: 'Les tirs argileux conservent l’eau utile protégeant le remplissage du grain des coups de sirocco printaniers.',
        },
      },
      fluvisol: {
        multiplier: 1.20,
        compatibility: 'optimal',
        reason: {
          en: 'Deep alluvial profiles allow extensive root exploration and high response to nitrogen topdressing.',
          ar: 'التربة الرسوبية العميقة تسمح بتغلغل جذري قوي واستجابة عالية للتسميد الآزوتي.',
          fr: 'Profil alluvionnaire profond autorisant un enracinement vigoureux et une forte valorisation de l’azote.',
        },
      },
      arenosol: {
        multiplier: 0.85,
        compatibility: 'moderate',
        reason: {
          en: 'Under rainfed conditions, sand loses water rapidly. Requires continuous center-pivot fertigation in Saharan areas (El Menia/Adrar) to reach 5.5-6.5 t/ha.',
          ar: 'في الزراعة البعلية تفقد الرمال الرطوبة بسرعة. يتطلب رياً محورياً وتسميداً دورياً في الصحراء لتحقيق 5.5-6.5 طن/هـ.',
          fr: 'En sec, le sable est trop drainant. Nécessite une ferti-irrigation sous pivot au Sahara (El Menia) pour atteindre 5.5-6.5 t/ha.',
        },
      },
      luvisol: {
        multiplier: 1.15,
        compatibility: 'good',
        reason: {
          en: 'Well-structured Terra Rossa offers balanced drainage and good phosphorus availability for tillering.',
          ar: 'التربة الحمراء جيدة البنية توفر صرفاً متوازناً وتيسيراً جيداً للفوسفور في مرحلة التفريع.',
          fr: 'Terra rossa bien structurée offrant un bon ressuyage et une bonne biodisponibilité du phosphore au tallage.',
        },
      },
      solonchak: {
        multiplier: 0.65,
        compatibility: 'challenging',
        reason: {
          en: 'Elevated salts reduce germination emergence and spikelet fertility unless salt leaching is applied.',
          ar: 'الأملاح المرتفعة تقلل نسبة الإنبات وخصوبة السنيبلات ما لم تُجرَ عمليات غسيل للتربة.',
          fr: 'La salinité freine la levée et la fertilité des épillets sans lessivage hivernal préalable.',
        },
      },
      cambisol: {
        multiplier: 1.12,
        compatibility: 'good',
        reason: {
          en: 'Eutrophic brown soils provide reliable rooting depth and moderate cation exchange capacity.',
          ar: 'التربة البنية الخصبة توفر عمق تجذير موثوق وسعة تبادل كاتيوني معتدلة.',
          fr: 'Sols bruns fertiles assurant un développement racinaire régulier et une CEC équilibrée.',
        },
      },
    },
    regionalBenchmarks: [
      {
        regionKey: 'high_plateaus_east',
        regionName: { en: 'High Plateaus East (Sétif, Constantine, Oum El Bouaghi, Mila)', ar: 'الهضاب العليا الشرقية (سطيف، قسنطينة، أم البواقي، ميلة)', fr: 'Hauts Plateaux Est (Sétif, Constantine, OEB, Mila)' },
        benchmarkTonsHa: 2.9,
        benchmarkQxHa: 29.0,
        provincesIncluded: ['Sétif (19)', 'Constantine (25)', 'Oum El Bouaghi (04)', 'Mila (43)', 'Guelma (24)'],
        context: {
          en: 'Cereal heartland of Algeria; high spring frost and Sirocco variability.',
          ar: 'القلب النابض لزراعة الحبوب؛ تباين في صقيع الربيع ولفحات الصيف.',
          fr: 'Bassin céréalier majeur; aléas de gelées printanières et sirocco.',
        },
      },
      {
        regionKey: 'mitidja_central',
        regionName: { en: 'Mitidja & Coastal Plain (Blida, Tipaza, Boumerdès)', ar: 'سهل متيجة والساحل الأوسط (البليدة، تيبازة، بومرداس)', fr: 'Mitidja & Plaine Centrale (Blida, Tipaza, Boumerdès)' },
        benchmarkTonsHa: 4.1,
        benchmarkQxHa: 41.0,
        provincesIncluded: ['Blida (09)', 'Tipaza (42)', 'Boumerdès (35)', 'Alger (16)'],
        context: {
          en: 'Favorable rainfall (550-700mm) and deep moisture-retaining soils.',
          ar: 'معدل أمطار ملائم (550-700 ملم) وتربة عميقة ذات احتفاظ مائي ممتاز.',
          fr: 'Pluviométrie généreuse (550-700mm) et forte réserve utile.',
        },
      },
      {
        regionKey: 'cheliff_interior',
        regionName: { en: 'Cheliff & Western Plains (Chlef, Aïn Defla, Sidi Bel Abbès)', ar: 'سهل الشلف والسهول الغربية (الشلف، عين الدفلى، سيدي بلعباس)', fr: 'Chéliff & Plaines de l’Ouest (Chlef, Aïn Defla, SBA)' },
        benchmarkTonsHa: 3.4,
        benchmarkQxHa: 34.0,
        provincesIncluded: ['Chlef (02)', 'Aïn Defla (44)', 'Sidi Bel Abbès (22)', 'Mascara (29)'],
        context: {
          en: 'Intensive cereal-legume rotations with supplemental irrigation access.',
          ar: 'دورات زراعية مكثفة بين الحبوب والبقوليات مع توفر الري التكميلي.',
          fr: 'Rotations céréales-légumineuses intensives avec accès à l’irrigation d’appoint.',
        },
      },
      {
        regionKey: 'sahara_pivots',
        regionName: { en: 'Saharan Center Pivots (El Menia, Adrar, Ouargla, Biskra)', ar: 'الرش المحوري الصحراوي (المنيعة، أدرار، ورقلة، بسكرة)', fr: 'Pivots Sahariens (El Menia, Adrar, Ouargla, Biskra)' },
        benchmarkTonsHa: 5.6,
        benchmarkQxHa: 56.0,
        provincesIncluded: ['El Menia (58)', 'Adrar (01)', 'Ouargla (30)', 'Biskra (07)', 'Timimoun (49)'],
        context: {
          en: 'Intensive continuous center-pivot fertigation, high solar radiation, zero disease pressure.',
          ar: 'تسميد مكثف بالرش المحوري، إشعاع شمسي هائل، وانعدام الأمراض الفطرية.',
          fr: 'Ferti-irrigation sous pivot continue, fort ensoleillement, faible pression fongique.',
        },
      },
    ],
  },
  {
    cropId: 'bread_wheat',
    name: {
      en: 'Bread Wheat (Blé Tendre / Farine CCLS)',
      ar: 'القمح اللين (الفرينة CCLS)',
      fr: 'Blé tendre (CCLS)',
    },
    category: 'cereal',
    emoji: '🌾',
    officialSupportPriceDzdQx: 5000, // 5000 DZD / Qx
    nationalMeanYieldTonsHa: 3.2,
    geneticPotentialCeilingTonsHa: 7.2,
    salinityThresholdDsm: 6.0,
    salinitySlopePctPerDsm: 4.0,
    activeLimeTolerancePct: 18.0,
    waterRegimeBaseline: {
      rainfedTonsHa: 3.0,
      supplementalTonsHa: 4.8,
      fullIrrigatedTonsHa: 6.4,
    },
    soilClassMultipliers: {
      calcisol: { multiplier: 1.18, compatibility: 'good', reason: { en: 'Good response on deep calcic silt-loams.', ar: 'استجابة جيدة في التربة الكلسية الطمية العميقة.', fr: 'Bonne réponse sur limons calcaires profonds.' } },
      vertisol: { multiplier: 1.28, compatibility: 'optimal', reason: { en: 'High yield potential with balanced lodging resistance.', ar: 'إنتاجية مرتفعة مع مقاومة متوازنة للرقاد.', fr: 'Fort potentiel avec résistance au couchage.' } },
      fluvisol: { multiplier: 1.24, compatibility: 'optimal', reason: { en: 'High tillering density in alluvial valleys.', ar: 'كثافة تفريع عالية في السهول الرسوبية.', fr: 'Forte densité d’épis en vallées alluviales.' } },
      arenosol: { multiplier: 0.82, compatibility: 'moderate', reason: { en: 'Leaching prone; requires split nitrogen dosing.', ar: 'عرضة لغسيل الآزوت؛ يتطلب تقسيم جرعات التسميد.', fr: 'Lessivage rapide; fractionnement azoté requis.' } },
      luvisol: { multiplier: 1.14, compatibility: 'good', reason: { en: 'Uniform grain development and healthy straw.', ar: 'نمو متجانس للحبوب وقش سليم.', fr: 'Développement homogène et paille saine.' } },
      solonchak: { multiplier: 0.60, compatibility: 'challenging', reason: { en: 'Sensitive during anthesis to osmotic spikes.', ar: 'حساس في مرحلة الإزهار للارتفاع الأسموزي.', fr: 'Sensibilité accrue à la floraison.' } },
      cambisol: { multiplier: 1.12, compatibility: 'good', reason: { en: 'Reliable all-around performance.', ar: 'أداء مستقر وموثوق.', fr: 'Performance équilibrée.' } },
    },
    regionalBenchmarks: [
      {
        regionKey: 'national_plains',
        regionName: { en: 'National Plains Average', ar: 'معدل السهول الوطنية', fr: 'Moyenne des plaines nationales' },
        benchmarkTonsHa: 3.2,
        benchmarkQxHa: 32.0,
        provincesIncluded: ['Sidi Bel Abbès (22)', 'Chlef (02)', 'Tiaret (14)', 'Bouira (10)'],
        context: { en: 'Standard rainfed with one winter weed & nitrogen application.', ar: 'زراعة بعلية عادية مع مكافحة الأعشاب وتسميد شتوي.', fr: 'Conduite standard en sec avec désherbage et apport azoté.' },
      },
    ],
  },
  {
    cropId: 'barley',
    name: {
      en: 'Barley (Orge CCLS)',
      ar: 'الشعير (CCLS)',
      fr: 'Orge fourragère (CCLS)',
    },
    category: 'cereal',
    emoji: '🌾',
    officialSupportPriceDzdQx: 3400, // 3400 DZD / Qx
    nationalMeanYieldTonsHa: 2.2,
    geneticPotentialCeilingTonsHa: 5.5,
    salinityThresholdDsm: 8.0, // Highly salt tolerant
    salinitySlopePctPerDsm: 2.5,
    activeLimeTolerancePct: 25.0,
    waterRegimeBaseline: {
      rainfedTonsHa: 2.0,
      supplementalTonsHa: 3.5,
      fullIrrigatedTonsHa: 4.8,
    },
    soilClassMultipliers: {
      calcisol: { multiplier: 1.25, compatibility: 'optimal', reason: { en: 'High calcium tolerance and drought hardiness on calcareous steppe.', ar: 'تحمل عالي للكلس والجفاف في أراضي السهوب الكلسية.', fr: 'Excellente tolérance au calcaire et rusticité en steppe.' } },
      vertisol: { multiplier: 1.18, compatibility: 'good', reason: { en: 'Produces abundant biomass and forage straw.', ar: 'يعطي كتلة حيوية وقشاً وفيراً.', fr: 'Forte production de biomasse et paille.' } },
      fluvisol: { multiplier: 1.15, compatibility: 'good', reason: { en: 'Rapid vegetative growth and early harvest.', ar: 'نمو خضري سريع وحصاد مبكر.', fr: 'Croissance rapide et récolte précoce.' } },
      arenosol: { multiplier: 0.90, compatibility: 'good', reason: { en: 'Superior drought extraction in coarse sandy soils.', ar: 'قدرة متفوقة على امتصاص الرطوبة في الرمال.', fr: 'Bonne extraction racinaire en sol sableux.' } },
      luvisol: { multiplier: 1.10, compatibility: 'good', reason: { en: 'Balanced fodder grain weight.', ar: 'وزن نوعي ممتاز لحبوب العلف.', fr: 'Bonne densité du grain fourrager.' } },
      solonchak: { multiplier: 0.88, compatibility: 'good', reason: { en: 'Top-tier tolerance to moderate salinity (up to 7.5 dS/m).', ar: 'قدرة فائقة على تحمل الملوحة المتوسطة حتى 7.5 ديسي سيمنز/م.', fr: 'Excellente rusticité en milieu modérément salé (jusqu’à 7.5 dS/m).' } },
      cambisol: { multiplier: 1.10, compatibility: 'good', reason: { en: 'Consistent pasture and grain yield.', ar: 'إنتاجية مستقرة للحبوب والمرعى.', fr: 'Rendement grain et pâture régulier.' } },
    },
    regionalBenchmarks: [
      {
        regionKey: 'steppe_highlands',
        regionName: { en: 'Steppe & Highlands (Tiaret, Djelfa, Batna, Saïda, M’Sila)', ar: 'مناطق السهوب والهضاب (تيارت، الجلفة، باتنة، سعيدة، المسيلة)', fr: 'Zone Steppique & Piémonts (Tiaret, Djelfa, Batna, Saïda)' },
        benchmarkTonsHa: 2.2,
        benchmarkQxHa: 22.0,
        provincesIncluded: ['Tiaret (14)', 'Djelfa (17)', 'Batna (05)', 'Saïda (20)', 'M’Sila (28)'],
        context: { en: 'Semi-arid pastoral region; barley serves as vital livestock security feed.', ar: 'منطقة رعوية شبه جافة؛ الشعير يوفر أماناً غذائياً للثروة الحيوانية.', fr: 'Région agro-pastorale; orge essentielle pour le cheptel.' },
      },
    ],
  },
  {
    cropId: 'potato',
    name: {
      en: 'Potato (Pomme de terre Spunta / Bellini)',
      ar: 'البطاطا الحقلية والمحورية (سبونتا / بيليني)',
      fr: 'Pomme de terre de consommation',
    },
    category: 'vegetable',
    emoji: '🥔',
    officialSupportPriceDzdQx: 7000, // 7000 DZD / Qx = 70 DZD / kg average
    nationalMeanYieldTonsHa: 31.0,
    geneticPotentialCeilingTonsHa: 60.0,
    salinityThresholdDsm: 1.7, // Sensitive to salts
    salinitySlopePctPerDsm: 12.0,
    activeLimeTolerancePct: 8.0,
    waterRegimeBaseline: {
      rainfedTonsHa: 16.0,
      supplementalTonsHa: 28.0,
      fullIrrigatedTonsHa: 42.0,
    },
    soilClassMultipliers: {
      arenosol: {
        multiplier: 1.45,
        compatibility: 'optimal',
        reason: {
          en: 'Desert sand under center-pivot fertigation produces smooth, golden skin, unhindered tuber expansion, and high yields (45-55 t/ha in El Oued).',
          ar: 'الرمال الصحراوية تحت الرش المحوري تمنح درنات ناعمة ذهبية وتوسعاً سلساً بدون مقاومة (45-55 طن/هـ بالوادي).',
          fr: 'Le sable sous pivot permet un grossissement libre des tubercules sans déformation (45-55 t/ha à Oued Souf).'
        },
      },
      fluvisol: {
        multiplier: 1.35,
        compatibility: 'optimal',
        reason: {
          en: 'Alluvial soils of Aïn Defla & Mostaganem offer ideal sandy-loam texture and easy mechanical harvesting.',
          ar: 'تربة عين الدفلى ومستغانم الرسوبية توفر قواماً طمياً مثالياً وسهولة فائقة في القلع الآلي.',
          fr: 'Les limons alluviaux d’Aïn Defla assurent une structure aérée et une récolte mécanisée aisée.'
        },
      },
      calcisol: {
        multiplier: 0.95,
        compatibility: 'moderate',
        reason: {
          en: 'High active CaCO3 can trigger scab (Gale commune) and iron deficiency; requires sulfur acidification.',
          ar: 'الكلس النشط المرتفع قد يسبب الجرب الشائع ونقص الحديد؛ يتطلب التسميد الكبريتي لمعادلة القلوية.',
          fr: 'Le calcaire actif favorise la gale commune et la chlorose; acidification au soufre recommandée.'
        },
      },
      vertisol: {
        multiplier: 0.82,
        compatibility: 'challenging',
        reason: {
          en: 'Heavy clay restricts tuber swelling, causes misshapen tubers and clod contamination during wet harvest.',
          ar: 'الطين الثقيل يقاوم انتفاخ الدرنات ويسبب تشوهات وتكتل الطين أثناء الجني في الرطوبة.',
          fr: 'L’argile lourde contraint le grossissement des tubercules et colle à la récolte humide.'
        },
      },
      luvisol: { multiplier: 1.10, compatibility: 'good', reason: { en: 'Good results on loose, elevated ridges.', ar: 'نتائج جيدة على الخطوط الترابية المرتفعة والمفككة.', fr: 'Bons résultats sur billons meubles.' } },
      solonchak: { multiplier: 0.40, compatibility: 'unsuitable', reason: { en: 'Severe sensitivity to salinity (ECe > 2.5 causes stunted tubers and tip burn).', ar: 'حساسية شديدة للملوحة (ECe > 2.5 تسبب تقزم الدرنات واحتراق الأوراق).', fr: 'Très forte intolérance au sel (perte drastique au-delà de 2.5 dS/m).' } },
      cambisol: { multiplier: 1.15, compatibility: 'good', reason: { en: 'Well-drained hill soils produce sound storage tubers.', ar: 'تربة جيدة الصرف تعطي درنات ممتازة للتخزين.', fr: 'Bonne conservation en sols bruns filtrants.' } },
    },
    regionalBenchmarks: [
      {
        regionKey: 'oued_souf_desert',
        regionName: { en: 'Oued Souf & Ziban Pivot Basins (El Oued, Biskra)', ar: 'حوض وادي سوف والزيبان (الوادي، بسكرة)', fr: 'Bassins Sahariens Oued Souf & Ziban' },
        benchmarkTonsHa: 42.0,
        benchmarkQxHa: 420.0,
        provincesIncluded: ['El Oued (39)', 'Biskra (07)', 'Touggourt (55)'],
        context: { en: 'Leading national potato producer; intensive drip and pivot fertigation on sand.', ar: 'الرائد الوطني في إنتاج البطاطا؛ ري محوري وتنقيط مكثف في رمال العرق.', fr: 'Pôle national leader; ferti-irrigation intensive sous pivot sur sable.' },
      },
      {
        regionKey: 'cheliff_valley',
        regionName: { en: 'Cheliff Valley (Aïn Defla, Chlef)', ar: 'حوض الشلف (عين الدفلى، الشلف)', fr: 'Vallée du Chéliff (Aïn Defla, Chlef)' },
        benchmarkTonsHa: 34.0,
        benchmarkQxHa: 340.0,
        provincesIncluded: ['Aïn Defla (44)', 'Chlef (02)'],
        context: { en: 'Historic alluvial potato zone for seasonal (saison) and late (arrière-saison) crops.', ar: 'المنطقة التاريخية لإنتاج بطاطا الموسم والآخر موسم.', fr: 'Zone alluviale historique pour la pomme de terre de saison et d’arrière-saison.' },
      },
    ],
  },
  {
    cropId: 'citrus',
    name: {
      en: 'Citrus & Clementines (Agrumes / Clémentines)',
      ar: 'الحمضيات والكليمونتين (البرتقال والكليمونتين)',
      fr: 'Agrumes & Clémentines',
    },
    category: 'fruit',
    emoji: '🍊',
    officialSupportPriceDzdQx: 12500, // 12500 DZD / Qx = 125 DZD / kg
    nationalMeanYieldTonsHa: 22.0,
    geneticPotentialCeilingTonsHa: 45.0,
    salinityThresholdDsm: 1.7,
    salinitySlopePctPerDsm: 13.0,
    activeLimeTolerancePct: 10.0,
    waterRegimeBaseline: {
      rainfedTonsHa: 8.0,
      supplementalTonsHa: 18.0,
      fullIrrigatedTonsHa: 32.0,
    },
    soilClassMultipliers: {
      vertisol: { multiplier: 1.25, compatibility: 'optimal', reason: { en: 'Mitidja deep soils with high potassium holding boost fruit caliber and juice °Brix.', ar: 'تربة متيجة العميقة ذات المحتوى البوتاسي العالي ترفع حجم الثمار ونسبة العصير.', fr: 'Excellente réserve utile et potassium disponible augmentant le calibre et le jus.' } },
      fluvisol: { multiplier: 1.30, compatibility: 'optimal', reason: { en: 'Aerated alluvials promote vigorous feeder roots and rapid sap circulation.', ar: 'التربة الرسوبية المهواة تشجع الجذور الماصة وتدفق العصارة.', fr: 'Alluvions aérées idéales pour le chevelu racinaire.' } },
      calcisol: { multiplier: 0.78, compatibility: 'challenging', reason: { en: 'Severe iron chlorosis risk on lime > 12%; mandatory Fe-EDDHA chelate application.', ar: 'خطر اصفرار حديدي حاد عند زيادة الكلس عن 12%؛ يتطلب شيلات الحديد Fe-EDDHA.', fr: 'Forte chlorose ferrique sur calcaire > 12%; chélate Fe-EDDHA indispensable.' } },
      arenosol: { multiplier: 0.85, compatibility: 'moderate', reason: { en: 'High water requirement; requires frequent micro-sprinkler or drip cycles.', ar: 'احتياج مائي مرتفع؛ يتطلب دورات ري بالتنقيط متقاربة لمنع الجفاف.', fr: 'Besoins hydriques élevés; cycles de goutte-à-goutte rapprochés requis.' } },
      luvisol: { multiplier: 1.18, compatibility: 'optimal', reason: { en: 'Terra rossa provides balanced iron and magnesium nutrition with good drainage.', ar: 'التربة الحمراء توفر تغذية متوازنة بالحديد والمغنيسيوم مع صرف ممتاز.', fr: 'Nutrition équilibrée en Fe/Mg et bon drainage.' } },
      solonchak: { multiplier: 0.35, compatibility: 'unsuitable', reason: { en: 'Citrus is extremely sensitive to sodium and chloride toxicities.', ar: 'أشجار الحمضيات شديدة الحساسية لسمية الصوديوم والكلور.', fr: 'Toxicité sévère aux chlorures et au sodium.' } },
      cambisol: { multiplier: 1.10, compatibility: 'good', reason: { en: 'Favorable orchard performance on foothill slopes.', ar: 'أداء ممتاز للبساتين في سفوح التلال.', fr: 'Bonne tenue en piémonts drainés.' } },
    },
    regionalBenchmarks: [
      {
        regionKey: 'mitidja_citrus_belt',
        regionName: { en: 'Mitidja Citrus Belt (Blida, Boufarik, Tipaza)', ar: 'حزام حمضيات متيجة (البليدة، بوفاريك، تيبازة)', fr: 'Ceinture d’agrumes de la Mitidja' },
        benchmarkTonsHa: 26.0,
        benchmarkQxHa: 260.0,
        provincesIncluded: ['Blida (09)', 'Tipaza (42)', 'Boumerdès (35)'],
        context: { en: 'Famous historic terroir for Clementine de Misserghin and Thomson Navel.', ar: 'الموطن التاريخي الشهير لكليمونتين مسرغين وبرتقال طومسون نافال.', fr: 'Terroir historique réputé pour la clémentine et l’orange Thomson.' },
      },
    ],
  },
  {
    cropId: 'olive',
    name: {
      en: 'Olive Groves (Olivier / Huile d\'olive Chemlal & Sigoise)',
      ar: 'الزيتون (شملال، سيقواز، طبعة)',
      fr: 'Oliveraies (Huile & Table)',
    },
    category: 'fruit',
    emoji: '🫒',
    officialSupportPriceDzdQx: 18000, // 18000 DZD / Qx = 180 DZD / kg fruit equivalent
    nationalMeanYieldTonsHa: 5.5,
    geneticPotentialCeilingTonsHa: 14.0,
    salinityThresholdDsm: 4.0,
    salinitySlopePctPerDsm: 6.0,
    activeLimeTolerancePct: 22.0,
    waterRegimeBaseline: {
      rainfedTonsHa: 3.8,
      supplementalTonsHa: 6.5,
      fullIrrigatedTonsHa: 9.5,
    },
    soilClassMultipliers: {
      luvisol: { multiplier: 1.30, compatibility: 'optimal', reason: { en: 'Terra Rossa on limestone slopes produces supreme olive oil aromatic richness.', ar: 'التربة الحمراء فوق الصخور الكلسية تعطي زيتاً فائق الجودة والنكهة العطرية.', fr: 'Terra rossa sur calcaire offrant une huile fruitée de qualité supérieure.' } },
      calcisol: { multiplier: 1.20, compatibility: 'optimal', reason: { en: 'High calcium tolerance, deep root foraging in rocky subsoils.', ar: 'تحمل ممتاز للكلس وتعمق جذري في الشقوق الصخرية.', fr: 'Excellente tolérance au calcaire et prospection racinaire profonde.' } },
      vertisol: { multiplier: 1.15, compatibility: 'good', reason: { en: 'High vegetative growth, requires pruning to maintain oil content.', ar: 'نمو خضري قوي يتطلب تقليماً جيداً للحفاظ على نسبة الزيت.', fr: 'Forte vigueur nécessitant une taille d’aération.' } },
      cambisol: { multiplier: 1.18, compatibility: 'optimal', reason: { en: 'Traditional Kabylie & Mascara terroir of high hardiness.', ar: 'موطن قبائلي ومعسكري تقليدي عالي الصلابة والإنتاج.', fr: 'Terroir traditionnel réputé en Kabylie et à Mascara.' } },
      fluvisol: { multiplier: 1.10, compatibility: 'good', reason: { en: 'High table olive caliber (Sigoise).', ar: 'حجم ثمار كبير لزيتون المائدة (السيقواز).', fr: 'Gros calibre pour olive de table (Sigoise).' } },
      arenosol: { multiplier: 0.90, compatibility: 'moderate', reason: { en: 'Requires localized drip; flourishes in Biskra oases.', ar: 'يتطلب رياً موضعياً بالتنقيط؛ يزدهر في واحات بسكرة.', fr: 'Nécessite du goutte-à-goutte; performant dans les oasis de Biskra.' } },
      solonchak: { multiplier: 0.70, compatibility: 'moderate', reason: { en: 'Moderate salt tolerance, but reduces fruit weight if ECe > 5.5 dS/m.', ar: 'تحمل معتدل للملوحة، لكنه يقلل وزن الثمار إذا تجاوزت 5.5 ديسي سيمنز/م.', fr: 'Tolérance modérée, mais baisse du poids du fruit si CEe > 5.5 dS/m.' } },
    },
    regionalBenchmarks: [
      {
        regionKey: 'tell_and_highlands',
        regionName: { en: 'Tellian Hills & Sig Plain (Tizi Ouzou, Mascara, Bejaia, Batna)', ar: 'تلال الأطلس التلي وسهل سيق (تيزي وزو، معسكر، بجاية، باتنة)', fr: 'Collines du Tell & Plaine de Sig' },
        benchmarkTonsHa: 5.5,
        benchmarkQxHa: 55.0,
        provincesIncluded: ['Tizi Ouzou (15)', 'Mascara (29)', 'Béjaïa (06)', 'Batna (05)', 'Bouira (10)'],
        context: { en: 'Prime Algerian olive heritage zone with centuries-old groves.', ar: 'المنطقة التراثية الأولى للزيتون الجزائري بأشجار معمرة.', fr: 'Bassin oléicole patrimonial majeur d’Algérie.' },
      },
    ],
  },
  {
    cropId: 'date_palm',
    name: {
      en: 'Deglet Nour Date Palm (Palmier Dattier Deglet Nour)',
      ar: 'نخيل دقلة نور (تمور الواحات)',
      fr: 'Palmier Dattier Deglet Nour',
    },
    category: 'fruit',
    emoji: '🌴',
    officialSupportPriceDzdQx: 35000, // 35000 DZD / Qx = 350 DZD / kg premium
    nationalMeanYieldTonsHa: 8.5,
    geneticPotentialCeilingTonsHa: 16.0,
    salinityThresholdDsm: 4.0,
    salinitySlopePctPerDsm: 3.6,
    activeLimeTolerancePct: 30.0,
    waterRegimeBaseline: {
      rainfedTonsHa: 0.5,
      supplementalTonsHa: 4.5,
      fullIrrigatedTonsHa: 10.5,
    },
    soilClassMultipliers: {
      arenosol: { multiplier: 1.40, compatibility: 'optimal', reason: { en: 'Porous desert sands with high aeration allow immense root respiration under hot Saharan sun.', ar: 'الرمال الصحراوية المنفذة تمنح تنفساً جذرياً ممتازاً تحت شمس الصحراء الحارقة.', fr: 'Sable saharien chaud et aéré idéal pour l’enracinement profond du palmier.' } },
      fluvisol: { multiplier: 1.20, compatibility: 'optimal', reason: { en: 'Oued alluvials provide deep moisture and nutrient reserves.', ar: 'الرواسب الودية توفر رطوبة ومخزوناً غذائياً عميقاً.', fr: 'Alluvions d’oued riches en nutriments.' } },
      solonchak: { multiplier: 0.85, compatibility: 'good', reason: { en: 'High natural resistance to brackish oasis waters up to 5-6 dS/m.', ar: 'مقاومة طبيعية عالية لمياه الواحات المالحة حتى 5-6 ديسي سيمنز/م.', fr: 'Résistance naturelle remarquable aux eaux saumâtres des oasis.' } },
      calcisol: { multiplier: 1.05, compatibility: 'good', reason: { en: 'Tolerates limestone gypsiferous crusts with ease.', ar: 'يتحمل القشور الجبسية والكلسية بكل سهولة.', fr: 'Tolérance parfaite aux croûtes gypseuses et calcaires.' } },
      vertisol: { multiplier: 0.65, compatibility: 'challenging', reason: { en: 'Heavy clay limits root aeration and promotes root rot under heavy flood irrigation.', ar: 'الطين الثقيل يحد من تهوية الجذور ويزيد من تعفنها عند الغمر.', fr: 'Argile trop lourde asphyxiante sous submersion.' } },
      luvisol: { multiplier: 0.80, compatibility: 'moderate', reason: { en: 'Outside climatic thermal optimum.', ar: 'خارج النطاق الحراري المثالي للنخيل.', fr: 'En dehors de l’optimum thermique saharien.' } },
      cambisol: { multiplier: 0.80, compatibility: 'moderate', reason: { en: 'Suboptimal thermal unit accumulation.', ar: 'تراكم وحدات حرارية غير كافٍ لنضج دقلة نور.', fr: 'Somme de températures insuffisante.' } },
    },
    regionalBenchmarks: [
      {
        regionKey: 'ziban_and_oued_souf',
        regionName: { en: 'Ziban & Oued Souf Terroirs (Tolga, Biskra, El Oued, Ouargla)', ar: 'موطن الزيبان ووادي سوف (طولقة، بسكرة، الوادي، ورقلة)', fr: 'Terroirs des Ziban & Oued Souf' },
        benchmarkTonsHa: 9.5,
        benchmarkQxHa: 95.0,
        provincesIncluded: ['Biskra (07)', 'El Oued (39)', 'Ouargla (30)', 'Ghardaïa (47)'],
        context: { en: 'World capital of transparent golden Deglet Nour date palm.', ar: 'العاصمة العالمية لتمور دقلة نور الذهبية الشفافة.', fr: 'Capitale mondiale de la datte Deglet Nour dorée et translucide.' },
      },
    ],
  },
  {
    cropId: 'chickpea_lentil',
    name: {
      en: 'Food Legumes (Chickpea / Lentil / Fève)',
      ar: 'البقوليات الغذائية (الحمص / العدس / الفول)',
      fr: 'Légumineuses alimentaires (Pois chiche / Lentille)',
    },
    category: 'legume',
    emoji: '🫘',
    officialSupportPriceDzdQx: 15000, // 15000 DZD / Qx
    nationalMeanYieldTonsHa: 1.5,
    geneticPotentialCeilingTonsHa: 3.5,
    salinityThresholdDsm: 1.5,
    salinitySlopePctPerDsm: 14.0,
    activeLimeTolerancePct: 15.0,
    waterRegimeBaseline: {
      rainfedTonsHa: 1.4,
      supplementalTonsHa: 2.2,
      fullIrrigatedTonsHa: 3.0,
    },
    soilClassMultipliers: {
      calcisol: { multiplier: 1.30, compatibility: 'optimal', reason: { en: 'Active calcium stimulates Rhizobium bacteria nodulation, fixing atmospheric nitrogen without chemical fertilizers.', ar: 'الكالسيوم النشط يحفز عقد بكتيريا الريزوبيوم لتثبيت الآزوت الجوي طبيعياً دون أسمدة كيماوية.', fr: 'Le calcium stimule la nodulation par Rhizobium, fixant l’azote gratuitement.' } },
      vertisol: { multiplier: 1.25, compatibility: 'optimal', reason: { en: 'Soil moisture reserves support pod filling during spring dry spells.', ar: 'مخزون الرطوبة يدعم امتلاء القرون أثناء فترات الجفاف الربيعية.', fr: 'La réserve utile soutient le remplissage des gousses au printemps.' } },
      luvisol: { multiplier: 1.20, compatibility: 'optimal', reason: { en: 'Terra rossa provides balanced drainage preventing root rot (Ascochyta).', ar: 'التربة الحمراء توفر صرفاً ممتازاً يمنع تعفن الجذور ومرض الأسكوكيتا.', fr: 'Excellent drainage évitant l’asphyxie et l’anthracnose.' } },
      fluvisol: { multiplier: 1.15, compatibility: 'good', reason: { en: 'High vegetative vigor in alluvial plains.', ar: 'نمو خضري ممتاز في السهول الرسوبية.', fr: 'Bonne vigueur végétative.' } },
      arenosol: { multiplier: 0.70, compatibility: 'challenging', reason: { en: 'Poor nodulation and low water holding capacity.', ar: 'ضعف العقد البكتيرية وانخفاض السعة التخزينية للمياه.', fr: 'Faible nodulation et dessèchement rapide.' } },
      solonchak: { multiplier: 0.30, compatibility: 'unsuitable', reason: { en: 'Legumes are extremely sensitive to chloride and osmotic shock.', ar: 'البقوليات شديدة الحساسية للكلوريدات والصدمات الأسموزية.', fr: 'Très forte intolérance à la salinité.' } },
      cambisol: { multiplier: 1.15, compatibility: 'good', reason: { en: 'Ideal crop in rotation with durum wheat.', ar: 'محصول مثالي في الدورة الزراعية مع القمح الصلب.', fr: 'Culture de coupure idéale en rotation avec le blé dur.' } },
    },
    regionalBenchmarks: [
      {
        regionKey: 'legumes_high_plateaus',
        regionName: { en: 'High Plateaus & Tellian Hills (Constantine, Guelma, Sidi Bel Abbès)', ar: 'الهضاب العليا والتلال التلية (قسنطينة، قالمة، سيدي بلعباس)', fr: 'Hauts Plateaux & Collines du Tell' },
        benchmarkTonsHa: 1.6,
        benchmarkQxHa: 16.0,
        provincesIncluded: ['Constantine (25)', 'Guelma (24)', 'Sidi Bel Abbès (22)', 'Mascara (29)'],
        context: { en: 'Strategic rotational crop to replenish soil nitrogen and break weed cycles.', ar: 'محصول دوري استراتيجي لإعادة تزويد التربة بالآزوت وكسر دورة الأعشاب.', fr: 'Tête de rotation stratégique pour fixer l’azote et assainir la parcelle.' },
      },
    ],
  },
  {
    cropId: 'tomato_open',
    name: {
      en: 'Field & Processing Tomato (Tomate Industrielle & Maraîchère)',
      ar: 'الطماطم الحقلية والصناعية',
      fr: 'Tomate de plein champ & d’industrie',
    },
    category: 'vegetable',
    emoji: '🍅',
    officialSupportPriceDzdQx: 4500, // 4500 DZD / Qx = 45 DZD / kg
    nationalMeanYieldTonsHa: 48.0,
    geneticPotentialCeilingTonsHa: 110.0,
    salinityThresholdDsm: 2.5,
    salinitySlopePctPerDsm: 9.9,
    activeLimeTolerancePct: 12.0,
    waterRegimeBaseline: {
      rainfedTonsHa: 18.0,
      supplementalTonsHa: 45.0,
      fullIrrigatedTonsHa: 75.0,
    },
    soilClassMultipliers: {
      fluvisol: { multiplier: 1.30, compatibility: 'optimal', reason: { en: 'Rich alluvial soils in Skikda/Guelma/Cheliff maximize total tonnage.', ar: 'التربة الرسوبية الغنية بسكيكدة وقالمة والشلف تعطي أعلى حمولة إنتاجية.', fr: 'Alluvions fertiles de Skikda/Guelma offrant un tonnage record.' } },
      vertisol: { multiplier: 1.20, compatibility: 'optimal', reason: { en: 'High natural potassium supply yields high sugar content (°Brix > 5.4).', ar: 'التغذية البوتاسية الطبيعية تضمن بريكس مرتفع (°Brix > 5.4) للجودة الصناعية.', fr: 'Richesse en potassium naturel assurant un Brix élevé (> 5.4).' } },
      arenosol: { multiplier: 1.25, compatibility: 'optimal', reason: { en: 'Biskra desert sands under greenhouse produce ultra-early spring crops.', ar: 'رمال بسكرة بالبيوت البلاستيكية تنتج محاصيل مبكرة فائقة الجودة.', fr: 'Sable de Biskra sous serre produisant des primeurs réputées.' } },
      luvisol: { multiplier: 1.15, compatibility: 'good', reason: { en: 'Good firmness and shelf-life.', ar: 'صلابة ممتازة وقدرة حفظ عالية للثمار.', fr: 'Bonne fermeté et conservation.' } },
      calcisol: { multiplier: 1.05, compatibility: 'good', reason: { en: 'Good color and blossom-end rot resistance with abundant calcium.', ar: 'لون جذاب ومقاومة لعفن الطرف الزهري بفضل وفرة الكالسيوم.', fr: 'Bonne coloration et résistance au cul noir grâce au calcium.' } },
      solonchak: { multiplier: 0.55, compatibility: 'challenging', reason: { en: 'Increases fruit sugar concentration but drastically cuts total fruit volume.', ar: 'يرفع تركيز السكر في الثمار لكنه يخفض الحجم الكلي بشدة.', fr: 'Augmente le sucre mais réduit drastiquement le calibre.' } },
      cambisol: { multiplier: 1.12, compatibility: 'good', reason: { en: 'Balanced field production.', ar: 'إنتاج حقلي متوازن.', fr: 'Production de plein champ équilibrée.' } },
    },
    regionalBenchmarks: [
      {
        regionKey: 'east_and_cheliff_processing',
        regionName: { en: 'Eastern Industrial Tomato Belt & Cheliff (Skikda, Annaba, Guelma, Chlef)', ar: 'حزام الطماطم الصناعية بالشرق والشلف (سكيكدة، عنابة، قالمة، الشلف)', fr: 'Bassin Tomate Industrielle Est & Chéliff' },
        benchmarkTonsHa: 55.0,
        benchmarkQxHa: 550.0,
        provincesIncluded: ['Skikda (21)', 'Annaba (23)', 'Guelma (24)', 'Chlef (02)', 'El Tarf (36)'],
        context: { en: 'Main hub for industrial processing concentrate and canning factories.', ar: 'القطب الرئيسي لمعامل تصبير وتحويل معجون الطماطم.', fr: 'Pôle majeur des conserveries et de la transformation industrielle.' },
      },
    ],
  },
];

/**
 * Helper to get a regional crop benchmark by ID
 */
export function getRegionalCropBenchmark(cropId: string): RegionalCropBenchmark {
  return (
    REGIONAL_CROP_BENCHMARKS.find((c) => c.cropId.toLowerCase() === cropId.toLowerCase()) ||
    REGIONAL_CROP_BENCHMARKS[0]
  );
}

/**
 * Result structure of the Dynamic Regional Cross-Referencing Yield Potential calculation
 */
export interface DynamicYieldCrossReferenceResult {
  crop: RegionalCropBenchmark;
  soilZone: AlgeriaSoilZone;
  waterRegime: 'rainfed' | 'supplemental' | 'full_irrigated';
  
  // Yield Outputs
  dynamicYieldTonsHa: number;
  dynamicYieldQxHa: number;
  regionalBenchmarkTonsHa: number;
  regionalBenchmarkQxHa: number;
  nationalMeanTonsHa: number;
  geneticPotentialCeilingTonsHa: number;
  
  // Gap & Performance Indices
  yieldGapDeltaTonsHa: number; // positive = above benchmark, negative = below
  yieldGapPct: number; // e.g. +28.5%
  yieldPotentialIndexPct: number; // e.g. 78% of genetic potential ceiling
  
  // Financial Valuation
  estimatedGrossRevenueDzdHa: number;
  benchmarkGrossRevenueDzdHa: number;
  economicGainOverBenchmarkDzdHa: number;
  officialPricePerQx: number;

  // Diagnostic breakdown
  pedologicalFactors: Array<{
    name: Record<Language, string>;
    multiplier: number;
    deltaPct: number;
    status: 'positive' | 'neutral' | 'penalty';
    explanation: Record<Language, string>;
  }>;

  // Actionable Soil Management Recommendations
  targetedSoilRecommendations: Array<{
    title: Record<Language, string>;
    impact: string;
    description: Record<Language, string>;
  }>;
}

/**
 * Calculates a dynamic cross-referenced yield potential estimate for a specific Algeria soil zone and crop benchmark
 */
export function calculateDynamicYieldCrossReference(
  cropId: string,
  soilZoneId: string,
  waterRegime: 'rainfed' | 'supplemental' | 'full_irrigated' = 'supplemental',
  customOverrides?: {
    customSoilSalinityDsm?: number;
    customOrganicMatterPct?: number;
    customPh?: number;
    hasSubsoiling?: boolean;
    hasOrganicAmendment?: boolean;
    hasAcidifyingOrGypsum?: boolean;
  }
): DynamicYieldCrossReferenceResult {
  const crop = getRegionalCropBenchmark(cropId);
  const zone = getAlgeriaSoilZoneById(soilZoneId);

  // 1. Determine baseline from water regime
  let baseYield = crop.waterRegimeBaseline.supplementalTonsHa;
  if (waterRegime === 'rainfed') {
    baseYield = crop.waterRegimeBaseline.rainfedTonsHa;
  } else if (waterRegime === 'full_irrigated') {
    baseYield = crop.waterRegimeBaseline.fullIrrigatedTonsHa;
  }

  // 2. Find regional benchmark for this zone
  let regionalBenchTons = crop.nationalMeanYieldTonsHa;
  const matchedRegion = crop.regionalBenchmarks.find((r) =>
    r.provincesIncluded.some((p) => zone.provinces.some((zp) => zp.includes(p.split(' ')[0])))
  );
  if (matchedRegion) {
    regionalBenchTons = matchedRegion.benchmarkTonsHa;
    if (waterRegime === 'rainfed') regionalBenchTons *= 0.85;
    if (waterRegime === 'full_irrigated') regionalBenchTons *= 1.25;
  }

  // 3. Evaluate Pedological Affinity
  const soilAffinity = crop.soilClassMultipliers[zone.soilClass] || {
    multiplier: 1.0,
    compatibility: 'moderate' as const,
    reason: { en: 'Standard regional soil interaction.', ar: 'تفاعل ترابي قياسي.', fr: 'Interaction standard.' },
  };

  let cumulativeMultiplier = soilAffinity.multiplier;
  const factors: DynamicYieldCrossReferenceResult['pedologicalFactors'] = [];

  // Add Soil Class Baseline factor
  factors.push({
    name: {
      en: `${zone.name.en} Pedological Base`,
      ar: `الأساس البيدولوجي (${zone.name.ar})`,
      fr: `Base pédologique (${zone.name.fr})`,
    },
    multiplier: soilAffinity.multiplier,
    deltaPct: Math.round((soilAffinity.multiplier - 1.0) * 100),
    status: soilAffinity.multiplier >= 1.05 ? 'positive' : soilAffinity.multiplier < 0.95 ? 'penalty' : 'neutral',
    explanation: soilAffinity.reason,
  });

  // 4. Salinity (Maas-Hoffman curve)
  const activeSalinity = customOverrides?.customSoilSalinityDsm ?? zone.electricalConductivityDsm;
  if (activeSalinity > crop.salinityThresholdDsm) {
    const excessSalinity = activeSalinity - crop.salinityThresholdDsm;
    const lossPct = Math.min(65, excessSalinity * crop.salinitySlopePctPerDsm);
    const salMultiplier = Number(Math.max(0.35, 1.0 - lossPct / 100).toFixed(2));
    cumulativeMultiplier *= salMultiplier;

    factors.push({
      name: {
        en: `Salinity Stress (${activeSalinity.toFixed(1)} dS/m vs ${crop.salinityThresholdDsm} threshold)`,
        ar: `إجهاد الملوحة (${activeSalinity.toFixed(1)} ديسي سيمنز/م مقارنة بعتبة ${crop.salinityThresholdDsm})`,
        fr: `Stress salin (${activeSalinity.toFixed(1)} dS/m vs seuil ${crop.salinityThresholdDsm})`,
      },
      multiplier: salMultiplier,
      deltaPct: -Math.round(lossPct),
      status: 'penalty',
      explanation: {
        en: `Osmotic pressure exceeds crop threshold; water absorption is hindered. Leaching fraction and gypsum amendment recommended.`,
        ar: `الضغط الأسموزي يتجاوز عتبة المحصول؛ امتصاص الماء يتباطأ. ينصح بزيادة جرعات الغسيل وإضافة الجبس الزراعي.`,
        fr: `La pression osmotique dépasse le seuil; l’absorption hydrique est réduite. Lessivage et gypse recommandés.`,
      },
    });
  } else if (activeSalinity <= 1.2) {
    const lowSalMultiplier = 1.04;
    cumulativeMultiplier *= lowSalMultiplier;
    factors.push({
      name: {
        en: `Sweet Soil Advantage (${activeSalinity.toFixed(1)} dS/m ECe)`,
        ar: `ميزة التربة العذبة الخالية من الأملاح (${activeSalinity.toFixed(1)} ديسي سيمنز/م)`,
        fr: `Avantage sol doux sans sel (${activeSalinity.toFixed(1)} dS/m)`,
      },
      multiplier: lowSalMultiplier,
      deltaPct: 4,
      status: 'positive',
      explanation: {
        en: `Zero osmotic tension barrier allows unrestrained root nutrient uptake.`,
        ar: `انعدام الإجهاد الأسموزي يتيح امتصاصاً غذائياً سلساً وكاملاً.`,
        fr: `Aucune barrière osmotique, absorption racinaire optimale.`,
      },
    });
  }

  // 5. Active Lime & pH Iron Availability
  const activeLime = zone.activeLimeCaCO3Pct;
  if (activeLime > crop.activeLimeTolerancePct) {
    const chlorosisPenalty = 0.92;
    cumulativeMultiplier *= chlorosisPenalty;
    factors.push({
      name: {
        en: `Active Lime Chlorosis Risk (${activeLime}% CaCO₃ vs ${crop.activeLimeTolerancePct}% limit)`,
        ar: `مخاطر الاصفرار الكلوروزي (${activeLime}% كلس نشط مقارنة بحد ${crop.activeLimeTolerancePct}%)`,
        fr: `Risque de chlorose calcaire (${activeLime}% CaCO₃ vs limite ${crop.activeLimeTolerancePct}%)`,
      },
      multiplier: chlorosisPenalty,
      deltaPct: -8,
      status: 'penalty',
      explanation: {
        en: `High active lime locks iron (Fe) and phosphorus (P). Apply chelated Fe-EDDHA and ammonium sulfate fertilizer.`,
        ar: `الكلس النشط المرتفع يثبت الحديد والفوسفور. ينصح بإضافة شيلات الحديد Fe-EDDHA وكبريتات الأمونيوم.`,
        fr: `Le calcaire bloque le fer et le phosphore. Apporter du fer chélaté Fe-EDDHA et du sulfate d'ammoniaque.`,
      },
    });
  }

  // 6. Organic Matter Humus Buffer
  const activeOM = customOverrides?.customOrganicMatterPct ?? zone.organicMatterPct;
  if (activeOM >= 2.0) {
    const omBoost = 1.06;
    cumulativeMultiplier *= omBoost;
    factors.push({
      name: {
        en: `High Humic Buffer (${activeOM.toFixed(1)}% Organic Matter)`,
        ar: `مخزون دبالي ممتاز (${activeOM.toFixed(1)}% مادة عضوية)`,
        fr: `Excellente réserve humique (${activeOM.toFixed(1)}% MO)`,
      },
      multiplier: omBoost,
      deltaPct: 6,
      status: 'positive',
      explanation: {
        en: `Enhanced cation exchange capacity (CEC) and moisture retention amplify nutrient uptake.`,
        ar: `تعزيز سعة التبادل الكاتيوني والاحتفاظ بالرطوبة يضاعف فاعلية التسميد.`,
        fr: `CEC et rétention hydrique accrues stimulant l’assimilation.`,
      },
    });
  } else if (activeOM < 0.8) {
    const omPenalty = 0.94;
    cumulativeMultiplier *= omPenalty;
    factors.push({
      name: {
        en: `Low Humus Depletion (${activeOM.toFixed(1)}% Organic Matter)`,
        ar: `فقر المادة العضوية والدبال (${activeOM.toFixed(1)}%)`,
        fr: `Faible teneur en humus (${activeOM.toFixed(1)}% MO)`,
      },
      multiplier: omPenalty,
      deltaPct: -6,
      status: 'penalty',
      explanation: {
        en: `Prone to rapid nutrient leaching and structural crusting. Incorporate well-decomposed manure or compost.`,
        ar: `عرضة للغسيل السريع للعناصر وتشكل القشور السطحية. ينصح بإضافة سماد عضوي متحلل أو كومبوست.`,
        fr: `Sensibilité au lessivage et à la battance. Apporter du compost ou fumier mûr.`,
      },
    });
  }

  // 7. Management practices: Subsoiling & Amendments
  if (customOverrides?.hasSubsoiling && (zone.soilClass === 'vertisol' || zone.compactionRisk === 'severe' || zone.compactionRisk === 'very_high')) {
    const subsoilingBoost = 1.08;
    cumulativeMultiplier *= subsoilingBoost;
    factors.push({
      name: {
        en: `Deep Subsoiling Decompaction (+45cm)`,
        ar: `التفكيك العميق للتربة (+45 سم)`,
        fr: `Sous-solage décompacteur (+45cm)`,
      },
      multiplier: subsoilingBoost,
      deltaPct: 8,
      status: 'positive',
      explanation: {
        en: `Fissures the plow pan, facilitating deep root taproot elongation.`,
        ar: `يكسر الطبقة الصماء الناتجة عن الحراثة ويسمح بتعمق الجذور الوتدية.`,
        fr: `Fissure la semelle de labour et favorise l'enracinement profond.`,
      },
    });
  }

  if (customOverrides?.hasOrganicAmendment) {
    const manureBoost = 1.05;
    cumulativeMultiplier *= manureBoost;
    factors.push({
      name: {
        en: `Compost / Manure Bio-Stimulation`,
        ar: `التحسين العضوي والكومبوست الحيوي`,
        fr: `Amendement organique & compost`,
      },
      multiplier: manureBoost,
      deltaPct: 5,
      status: 'positive',
      explanation: {
        en: `Injects beneficial soil mycorrhizae and improves structural aggregate stability.`,
        ar: `ينشط المايكورايزا المفيدة ويعزز تماسك الحبيبات البنيوية للتربة.`,
        fr: `Améliore la stabilité structurale et la flore microbienne.`,
      },
    });
  }

  // Calculate final dynamic yields
  const rawYield = baseYield * cumulativeMultiplier;
  const dynamicYieldTonsHa = Number(Math.min(crop.geneticPotentialCeilingTonsHa, Math.max(0.3, rawYield)).toFixed(2));
  const dynamicYieldQxHa = Number((dynamicYieldTonsHa * 10).toFixed(1));
  const regionalBenchmarkQxHa = Number((regionalBenchTons * 10).toFixed(1));

  const yieldGapDeltaTonsHa = Number((dynamicYieldTonsHa - regionalBenchTons).toFixed(2));
  const yieldGapPct = Number((((dynamicYieldTonsHa - regionalBenchTons) / regionalBenchTons) * 100).toFixed(1));
  const yieldPotentialIndexPct = Number(Math.min(100, Math.round((dynamicYieldTonsHa / crop.geneticPotentialCeilingTonsHa) * 100)));

  const estimatedGrossRevenueDzdHa = Math.round(dynamicYieldQxHa * crop.officialSupportPriceDzdQx);
  const benchmarkGrossRevenueDzdHa = Math.round(regionalBenchmarkQxHa * crop.officialSupportPriceDzdQx);
  const economicGainOverBenchmarkDzdHa = estimatedGrossRevenueDzdHa - benchmarkGrossRevenueDzdHa;

  // Build 3 targeted recommendations
  const recommendations: DynamicYieldCrossReferenceResult['targetedSoilRecommendations'] = [];
  
  if (zone.soilClass === 'vertisol') {
    recommendations.push({
      title: { en: 'Sirocco & Cracking Water Guard', ar: 'حماية الرطوبة من تشققات التيرس والشهيلي', fr: 'Gestion des fentes de retrait & sirocco' },
      impact: '+12% Yield Security',
      description: {
        en: 'Maintain surface mulching or straw residues to prevent deep cracking evaporation in late spring.',
        ar: 'الاحتفاظ ببقايا القش أو التغطية السطحية لمنع تبخر الرطوبة عبر الشقوق العميقة في أواخر الربيع.',
        fr: 'Conserver les résidus de paille pour limiter l’évaporation par les fentes en fin de cycle.',
      },
    });
  } else if (zone.soilClass === 'calcisol') {
    recommendations.push({
      title: { en: 'Active Lime Buffering & Micro-elements', ar: 'معادلة الكلس النشط وتغذية العناصر الصغرى', fr: 'Tamponnage calcaire & oligo-éléments' },
      impact: '+10% Vitrosity / Quality',
      description: {
        en: 'Apply localized ammonium phosphate (DAP/MAP) and foliar zinc/iron at tillering to bypass calcareous fixation.',
        ar: 'إضافة فوسفات الأمونيوم الموضعي والرش الورقي بالزنك والحديد عند التفريع لتجاوز التثبيت الكلسي.',
        fr: 'Localiser le DAP/MAP et pulvériser du zinc/fer au tallage pour contourner le blocage calcaire.',
      },
    });
  } else if (zone.soilClass === 'arenosol') {
    recommendations.push({
      title: { en: 'High-Frequency Micro-Fertigation', ar: 'التسميد بالري الدقيق عالي التردد', fr: 'Ferti-irrigation à haute fréquence' },
      impact: '+25% Nutrient Efficiency',
      description: {
        en: 'Split nitrogen and potassium into 8-12 small doses via pivot/drip to prevent leaching into desert sands.',
        ar: 'تقسيم جرعات الآزوت والبوتاسيوم إلى 8-12 دفعة صغيرة عبر الرش المحوري لمنع الضياع في الرمال.',
        fr: 'Fractionner l’azote et la potasse en 8-12 petits apports sous pivot pour éviter le lessivage.',
      },
    });
  } else {
    recommendations.push({
      title: { en: 'Organic Humic Enrichment', ar: 'التزويد بالدبال والمادة العضوية', fr: 'Enrichissement en humus' },
      impact: '+8% Soil CEC',
      description: {
        en: 'Incorporate 15-20 t/ha of well-matured compost before plowing to build long-term microbial reserves.',
        ar: 'إضافة 15-20 طن/هكتار من السماد العضوي المتخمر قبل الحراثة لبناء مخزون ميكروبي مستدام.',
        fr: 'Apporter 15-20 t/ha de compost mûr au labour pour renforcer la fertilité biologique.',
      },
    });
  }

  recommendations.push({
    title: { en: 'Optimized Water Delivery Regimen', ar: 'توقيت الري الحرج ومرحلة امتلاء الحبوب', fr: 'Optimisation du stade critique' },
    impact: '+15% Grain Specific Weight',
    description: {
      en: 'Deliver 35 mm of supplemental water at flowering and early grain fill to ensure maximum kernel weight (PMG).',
      ar: 'تقديم رية تكميلية بمقدار 35 ملم عند الإزهار وبداية امتلاء الحبوب لضمان أعلى وزن لألف حبة (PMG).',
      fr: 'Apporter 35 mm à l’épiaison/début remplissage pour maximiser le poids de mille grains (PMG).',
    },
  });

  recommendations.push({
    title: { en: 'Soil Biological & Inoculation Boost', ar: 'التلقيح البكتيري والحيوي للتربة', fr: 'Stimulation biologique du sol' },
    impact: '+5% to +10% Uptake',
    description: {
      en: 'Incorporate legume rotation (chickpea/faba bean) to naturally enrich soil nitrogen stock for subsequent cereal crops.',
      ar: 'إدراج البقوليات (حمص/فول) في الدورة الزراعية لإثراء مخزون الآزوت الطبيعي للمحصول اللاحق.',
      fr: 'Intégrer une légumineuse en rotation pour enrichir naturellement le stock azoté.',
    },
  });

  return {
    crop,
    soilZone: zone,
    waterRegime,
    dynamicYieldTonsHa,
    dynamicYieldQxHa,
    regionalBenchmarkTonsHa: Number(regionalBenchTons.toFixed(2)),
    regionalBenchmarkQxHa,
    nationalMeanTonsHa: crop.nationalMeanYieldTonsHa,
    geneticPotentialCeilingTonsHa: crop.geneticPotentialCeilingTonsHa,
    yieldGapDeltaTonsHa,
    yieldGapPct,
    yieldPotentialIndexPct,
    estimatedGrossRevenueDzdHa,
    benchmarkGrossRevenueDzdHa,
    economicGainOverBenchmarkDzdHa,
    officialPricePerQx: crop.officialSupportPriceDzdQx,
    pedologicalFactors: factors,
    targetedSoilRecommendations: recommendations,
  };
}
