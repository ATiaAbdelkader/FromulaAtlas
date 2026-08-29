/**
 * Comprehensive Algerian Agricultural GIS & Agro-Climatic Dataset
 * Covers all 58 Wilayas (Provinces), 5 Agro-Ecological Zones,
 * Soil Classifications, Climate Bioclimates, Crop Suitability & Water Systems.
 *
 * Grounded in INRAA (Institut National de la Recherche Agronomique d'Algérie),
 * BNEDER, MADR, and FAO-UNESCO pedological data.
 */

import { type Language } from '@/lib/language-store';

export type AlgeriaAgroZone =
  | 'tell_coastal'    // Tell & Coastal Plains (Mitidja, Sahel, Annaba, Skikda, Chéliff)
  | 'high_plateaus'   // High Plateaus & Steppes (Sétif, Constantine, Batna, Tiaret, Djelfa)
  | 'sahara_oasis'    // Saharan Oases & Basins (Biskra, El Oued, Touggourt, Ouled Djellal)
  | 'deep_sahara'     // Deep Saharan Mega-Pivots (Adrar, Timimoun, El Menia, In Salah, Ouargla)
  | 'mountains';      // Mountain Massifs & Forests (Kabylie, Aurès, Dahra, Tessala)

export type AlgeriaSoilClass =
  | 'vertisol'       // Tirs / Vertisols lourds
  | 'calcisol'       // Sols bruns calcaires / Rendzines
  | 'arenosol'       // Sols sableux d'Erg / Sables éoliens
  | 'fluvisol'       // Sols alluviaux fertiles de vallées d'oueds
  | 'solonchak'      // Sols halomorphes / Sebkhas et chotts
  | 'luvisol'        // Sols rouges fersiallitiques / Terra Rossa
  | 'cambisol'       // Sols bruns eutrophes de piémont
  | 'lithosol';      // Sols minces sur roche / Regs

export type AlgeriaBioclimate =
  | 'humid'          // Humide & Subhumide (> 700 mm/an)
  | 'semi_arid'      // Semi-aride (300 - 600 mm/an)
  | 'arid'           // Aride & Steppique (100 - 300 mm/an)
  | 'hyper_arid';    // Hyper-aride Saharien (< 100 mm/an)

export type MajorCropCategory =
  | 'cereals'        // Durum wheat, soft wheat, barley
  | 'greenhouses'    // Early vegetables under greenhouse (tomato, pepper)
  | 'pivot_potato'   // Desert pivot potato & field crops
  | 'date_palms'     // Deglet Nour date palm oasis
  | 'citrus'         // Oranges, clementines, lemons
  | 'olives'         // Olive orchards & oil mills
  | 'livestock'      // Sheep/bovine pastoralism & fodder (alfalfa)
  | 'viticulture'    // Table & wine grapes
  | 'arboriculture'; // Apples, apricots, figs, almonds

export interface WilayaAgroProfile {
  code: number;
  id: string;
  name: { en: string; ar: string; fr: string };
  capital: { en: string; ar: string; fr: string };
  region: AlgeriaAgroZone;
  coordinates: { lat: number; lng: number };
  
  // Area & Agricultural Land (SAU - Superficie Agricole Utile)
  totalAreaKm2: number;
  agriculturalAreaHa: number;
  irrigatedAreaHa: number;

  // Pedology & Soil
  dominantSoilClass: AlgeriaSoilClass;
  soilNameLocal: { en: string; ar: string; fr: string };
  soilTexture: { en: string; ar: string; fr: string };
  clayPct: number;
  siltPct: number;
  sandPct: number;
  ph: number;
  organicMatterPct: number;
  activeLimeCaCO3Pct: number;
  salinityECeDsm: number;
  waterHoldingCapacityMmPerM: number;
  salinityRisk: 'none' | 'low' | 'moderate' | 'high' | 'severe';
  erosionRisk: 'low' | 'moderate' | 'high' | 'severe';

  // Climate
  bioclimate: AlgeriaBioclimate;
  annualRainfallMm: number;
  avgTempSummer: number; // °C
  avgTempWinter: number; // °C
  avgET0MmDay: number;   // reference ET0
  frostDaysPerYear: number;
  siroccoDaysPerYear: number;

  // Agriculture
  dominantCrops: MajorCropCategory[];
  cropHighlights: {
    name: { en: string; ar: string; fr: string };
    emoji: string;
    avgYield: string;
    season: { en: string; ar: string; fr: string };
  }[];

  // Water & Irrigation
  primaryWaterSource: { en: string; ar: string; fr: string };
  majorDamsOrAquifers: { en: string; ar: string; fr: string };
  irrigationTechnique: { en: string; ar: string; fr: string };

  // Recommendations & Challenges
  agronomicAdvisory: { en: string; ar: string; fr: string };
  soilManagementTips: { en: string; ar: string; fr: string };
}

export const ALGERIA_AGRO_ZONES_CONFIG: Record<
  AlgeriaAgroZone,
  {
    name: { en: string; ar: string; fr: string };
    color: string;
    bgBadge: string;
    description: { en: string; ar: string; fr: string };
    rainfallRange: string;
    dominantSoils: string;
    keySpecialties: string;
  }
> = {
  tell_coastal: {
    name: {
      en: 'Tell & Coastal Plains',
      ar: 'السهول الساحلية والتِّل',
      fr: 'Plaines Côtières & Tell',
    },
    color: '#059669', // emerald
    bgBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300',
    description: {
      en: 'Fertile coastal valleys with Mediterranean subhumid climate, high rainfall, deep heavy vertisols and alluvial fluvisols. Prime region for citrus, market gardening, industrial tomatoes, and vineyards.',
      ar: 'سهول ساحلية خصبة بمناخ متوسطي شبه رطب، أمطار غزيرة، تربة تيرس طينية عميقة ورسوبيات فيضية. موطن الحموضيات والخضروات المبكرة والطماطم الصناعية.',
      fr: 'Vallées côtières fertiles au climat subméditerranéen, fortes précipitations, vertisols profonds et alluvions fertiles. Idéal pour agrumes, maraîchage et tomate.',
    },
    rainfallRange: '600 – 1100 mm/yr',
    dominantSoils: 'Vertisols (Tirs), Fluvisols, Luvisols',
    keySpecialties: 'Citrus, Early Vegetables, Industrial Tomatoes, Orchards',
  },
  high_plateaus: {
    name: {
      en: 'High Plateaus & Cereal Steppes',
      ar: 'الهضاب العليا والسهوب الحبوبية',
      fr: 'Hauts Plateaux & Steppes Céréalières',
    },
    color: '#d97706', // amber
    bgBadge: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300',
    description: {
      en: 'Semi-arid steppic cereal belt situated between 700m and 1200m altitude. Continental climate with winter frosts and dry summers. The national granary for durum wheat, barley, and sheep breeding.',
      ar: 'حزام حبوبي شبه جاف بين 700 و1200 متر ارتفاع. مناخ قاري بصقيع شتوي وصيف جاف. صومعة الجزائر لإنتاج القمح الصلب والشعير وتربية الأغنام.',
      fr: 'Grenier céréalier semi-aride entre 700m et 1200m d’altitude. Climat continental à gelées d’hiver. Zone reine du blé dur, orge et élevage ovin.',
    },
    rainfallRange: '300 – 600 mm/yr',
    dominantSoils: 'Calcisols, Rendzinas, Cambisols',
    keySpecialties: 'Durum Wheat, Barley, Sheep Farming, Apples/Stone Fruits',
  },
  sahara_oasis: {
    name: {
      en: 'Saharan Oases & Ziban / Souf Basins',
      ar: 'الواحات الصحراوية وأحواض الزيبان وسوف',
      fr: 'Oasis Sahariennes & Bassins Ziban/Souf',
    },
    color: '#ea580c', // orange
    bgBadge: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300',
    description: {
      en: 'Arid oases and erg sand dune agriculture relying on deep groundwater aquifers. National powerhouse for primeur protected greenhouse crops, winter potatoes under pivot, and royal Deglet Nour date palms.',
      ar: 'زراعة الواحات وكثبان الرمال المعتمدة على المياه الجوفية العميقة. قطب وطني لإنتاج الخضروات المحمية المبكرة، بطاطا الري المحوري، وتمور دقلة نور الملكية.',
      fr: 'Agriculture oasienne et sur sables d’Erg irriguée par nappes profondes. Pôle majeur de primeurs sous serre, pomme de terre sous pivot et dattes Deglet Nour.',
    },
    rainfallRange: '100 – 250 mm/yr',
    dominantSoils: 'Arenosols (Erg Sand), Gypsisols, Solonchaks',
    keySpecialties: 'Greenhouse Primeurs, Deglet Nour Dates, Desert Potatoes, Peppers',
  },
  deep_sahara: {
    name: {
      en: 'Deep Sahara Mega-Pivot Farming Poles',
      ar: 'أقطاب الفلاحة الصحراوية الكبرى بالري المحوري',
      fr: 'Grands Pôles Agricoles du Grand Sud',
    },
    color: '#dc2626', // red/rose
    bgBadge: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300',
    description: {
      en: 'Hyper-arid desert agriculture powered by massive center-pivots tapping the Continental Intercalaire (Albian) fossil aquifer. Strategic industrial production of wheat, corn, silage alfalfa, and oilseeds.',
      ar: 'زراعة صحراوية كبرى بالرش المحوري العملاق بالاستفادة من مياه طبقة الألبيان الجوفية. إنتاج استراتيجي للقمح، الذرة، الأعلاف كالفصة، والمحاصيل الزيتية.',
      fr: 'Agriculture intensive sous pivots géants exploitant la nappe de l’Albien. Production stratégique de blé, maïs grain, luzerne et oléagineux.',
    },
    rainfallRange: '< 50 mm/yr',
    dominantSoils: 'Arenosols, Regs, Lithosols, Desert Alluvia',
    keySpecialties: 'Strategic Wheat, Grain Corn, Alfalfa Forage, Desert Sunflowers',
  },
  mountains: {
    name: {
      en: 'Mountain Massifs & Forested Slopes',
      ar: 'الكتل الجبلية والسفوح الغابية',
      fr: 'Massifs Montagneux & Versants Forestiers',
    },
    color: '#0284c7', // sky/blue
    bgBadge: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300',
    description: {
      en: 'Rugged topography (Kabylie, Aurès, Dahra, Tessala) with rich microclimates, fersiallitic terra rossa and brown soils. Ideal for terraced olive groves, fig orchards, cherries, apiculture, and mountain pastoralism.',
      ar: 'تضاريس جبلية وعرة (القبائل، الأوراس، الظهرة، التسالة) بمناخات محلية مميزة وتربة حمراء. مثالية لبساتين الزيتون المدرجة، التين، الكرز، وتربية النحل.',
      fr: 'Reliefs accidentés (Kabylie, Aurès, Dahra) aux sols rouges fersiallitiques et bruns. Foyer de l’oléiculture traditionnelle, figues, cerisiers et apiculture.',
    },
    rainfallRange: '500 – 1200 mm/yr',
    dominantSoils: 'Luvisols (Terra Rossa), Cambisols, Lithosols',
    keySpecialties: 'Olive Oil, Mountain Figs, Cherries, Honey & Apiculture',
  },
};

export const SOIL_CLASSES_INFO: Record<
  AlgeriaSoilClass,
  {
    name: { en: string; ar: string; fr: string };
    color: string;
    description: { en: string; ar: string; fr: string };
    texture: string;
    keyChallenge: { en: string; ar: string; fr: string };
    recommendedAmendments: { en: string; ar: string; fr: string };
  }
> = {
  vertisol: {
    name: { en: 'Vertisol (Tirs / Heavy Clays)', ar: 'تربة الفيرتيسول (التيرس الطيني الثقيل)', fr: 'Vertisol (Tirs / Argiles lourdes)' },
    color: '#475569', // slate
    description: {
      en: 'Deep, dark, montmorillonite-rich heavy clay soils with high water capacity, swelling-shrinking cracks, and high cation exchange capacity (CEC > 35 meq/100g).',
      ar: 'تربة طينية ثقيلة داكنة غنية بالمونتموريلونيت، ذات سعة احتفاظ مائي هائلة وتشققات جفافية وسعة تبادل كاتيونية مرتفعة.',
      fr: 'Sols argileux lourds, profonds, riches en montmorillonite, à forte rétention d’eau et fentes de retrait.',
    },
    texture: 'Clay (> 50%)',
    keyChallenge: { en: 'Winter waterlogging, severe compaction, narrow workability window.', ar: 'التغدق المائي الشتوي، الانضغاط الشديد، وضيق فترة الحراثة.', fr: 'Engorgement hivernal, compactage sévère, fenêtre de travail étroite.' },
    recommendedAmendments: { en: 'Subsoiling (45cm), organic compost, laser drainage furrows.', ar: 'التفكيك العميق (45 سم)، إضافة السماد العضوي، وخنادق تصريف بالليزر.', fr: 'Sous-solage (45cm), compost organique, nivellement laser.' },
  },
  calcisol: {
    name: { en: 'Calcisol (Calcareous Brown Soils)', ar: 'تربة الكالسيسول (التربة البنية الجيرية)', fr: 'Calcisol (Sols bruns calcaires)' },
    color: '#b45309', // amber-700
    description: {
      en: 'Widespread on the High Plateaus and Tell slopes. Characterized by high active calcium carbonate (CaCO3 > 20%), alkaline pH (7.8–8.4), and good structural stability.',
      ar: 'واسعة الانتشار في الهضاب العليا وسفوح التل. تتميز بنسبة كلس فعال مرتفعة وحموضة قلوية (7.8–8.4) وثبات بنيوي جيد.',
      fr: 'Très répandu sur les Hauts Plateaux. Riche en calcaire actif (CaCO3 > 20%), pH alcalin et bonne stabilité structurale.',
    },
    texture: 'Clay Loam to Silty Clay',
    keyChallenge: { en: 'Iron chlorosis, phosphorus fixation, microelement insolubilization.', ar: 'اصفرار نقص الحديد (الكلوروز)، تثبيت الفوسفور، وضعف ذوبانية العناصر الصغرى.', fr: 'Chlorose ferrique, fixation du phosphore, blocage des oligo-éléments.' },
    recommendedAmendments: { en: 'Fe-EDDHA iron chelate, acidifying fertilizers (ammonium sulfate, MAP), sulfur.', ar: 'مخلبات الحديد Fe-EDDHA، أسمدة محمضة (سلفات الأمونيوم، MAP)، والكبريت الزراعي.', fr: 'Chélates de fer Fe-EDDHA, engrais acidifiants (sulfate d’ammoniaque, MAP).' },
  },
  arenosol: {
    name: { en: 'Arenosol (Erg Dune Sand)', ar: 'تربة الأرينوسول (رمال العرق الصحراوية)', fr: 'Arénosol (Sables dunaires d’Erg)' },
    color: '#f59e0b', // amber-500
    description: {
      en: 'Very coarse, hyper-porous eolian sands in Souf, Ouargla, and Erg basins. Excellent aeration and root expansion, but zero organic matter and near-zero CEC.',
      ar: 'رمال إيولية خشنة ونفاذة جداً في سوف وورقلة والعرق. تهوية ممتازة ونمو جذري سريع، لكن مادة عضوية وسعة تبادل تقارب الصفر.',
      fr: 'Sables éoliens très filtrants du Souf et de l’Erg. Aération maximale, mais réserve en eau et CEC quasi-nulles.',
    },
    texture: 'Sand (> 90%)',
    keyChallenge: { en: 'Instant nutrient leaching, rapid dehydration, wind erosion.', ar: 'الغسيل الفوري للأسمدة، الجفاف السريع، والانجراف الريحي.', fr: 'Lessivage rapide des nutriments, dessèchement éclair, érosion éolienne.' },
    recommendedAmendments: { en: 'Fractionated daily fertigation, humic acids, bentonite clay addition, windbreaks.', ar: 'التسميد اليومي المجزأ عبر الري، الأحماض الهيومية، إضافة البنتونايت، ومصدات الرياح.', fr: 'Fertigation fractionnée quotidienne, acides humiques, apport d’argile bentonitique.' },
  },
  fluvisol: {
    name: { en: 'Fluvisol (Alluvial Valley Soils)', ar: 'تربة الفلوفيسول (الرسوبيات الفيضية النهرية)', fr: 'Fluvisol (Sols alluviaux de vallées)' },
    color: '#0d9488', // teal-600
    description: {
      en: 'Rich, stratified alluvial silt and loam along major rivers (Oued Chéliff, Soummam, Seybouse, Habra). Deep rootable profile with balanced fertility.',
      ar: 'طمي ورسوبيات خصبة على ضفاف الأودية الكبرى (الشلف، الصومام، سيبوس، هبرة). عمق تأصيل ممتاز وخصوبة متوازنة.',
      fr: 'Alluvions limoneuses riches et profondes le long des grands oueds (Chéliff, Soummam, Seybouse). Grande fertilité naturelle.',
    },
    texture: 'Silt Loam to Loam',
    keyChallenge: { en: 'Flood risk, local river salinity in dry seasons.', ar: 'مخاطر الفيضانات الموسمية وملوحة مياه السقي في الصيف.', fr: 'Risque d’inondation, salinisation estivale des eaux d’oueds.' },
    recommendedAmendments: { en: 'Balanced NPK, maintenance organic matter, drip scheduling.', ar: 'تسميد NPK متوازن، الحفاظ على المادة العضوية، وبرمجة الري بالتنقيط.', fr: 'Fertilisation NPK équilibrée, maintien du taux de MO, goutte-à-goutte.' },
  },
  solonchak: {
    name: { en: 'Solonchak (Saline / Sebkha Soils)', ar: 'تربة السولونشاك (التربة الملحية والسباخ)', fr: 'Solonchak (Sols halomorphes / Salés)' },
    color: '#94a3b8', // slate-400
    description: {
      en: 'Soils with high soluble salts (ECe > 8 dS/m) found near Chott Melghir, Chott Ech Chergui, Relizane plain, and irrigated zones with saline groundwater.',
      ar: 'تربة غنية بالأملاح الذائبة (ECe > 8 dS/m) حول شط ملغيغ، الشط الشرقي، سهل غليزان، ومناطق الآبار المالحة.',
      fr: 'Sols à forte accumulation de sels solubles (CE > 8 dS/m) autour des chotts et plaines déprimées.',
    },
    texture: 'Variable (Loam to Clay)',
    keyChallenge: { en: 'High osmotic stress, sodium toxicity, soil dispersion.', ar: 'الإجهاد الأسموزي الشديد، سمية الصوديوم، وتفتت بنية التربة.', fr: 'Stress osmotique sévère, toxicité sodique, dégradation structurale.' },
    recommendedAmendments: { en: 'Gypsum (CaSO4) application, leaching fraction irrigation, salt-tolerant crops (Barley, Date Palm).', ar: 'إضافة الجبس الزراعي، ري إضافي لغسيل الأملاح، واختيار محاصيل متحملة للملوحة (شعير، نخيل).', fr: 'Apport de plâtre/gypse agricole, fraction de lessivage, cultures tolérantes.' },
  },
  luvisol: {
    name: { en: 'Luvisol (Terra Rossa / Red Mediterranean Soils)', ar: 'تربة اللوفيسول (التربة الحمراء المتوسطية)', fr: 'Luvisol (Terra Rossa / Sols rouges)' },
    color: '#e11d48', // rose-600
    description: {
      en: 'Fersiallitic red soils developed over limestone in subhumid coastal ranges (Tlemcen, Kabylie, Dahra). Rich in iron oxides, slightly acidic to neutral pH.',
      ar: 'تربة حمراء غنية بأكاسيد الحديد متطورة فوق الصخور الكلسية في السلاسل الساحلية (تلمسان، القبائل، الظهرة). حموضة معتدلة.',
      fr: 'Sols rouges fersiallitiques riches en oxydes de fer sur calcaires durs (Tlemcen, Kabylie, Dahra).',
    },
    texture: 'Clay Loam to Sandy Clay Loam',
    keyChallenge: { en: 'Water erosion on slopes, shallow depth in steep areas.', ar: 'الانجراف المائي على المنحدرات وقلة العمق في المرتفعات.', fr: 'Érosion hydrique sur pentes, faible profondeur en relief accentué.' },
    recommendedAmendments: { en: 'Contour plowing, cover crops, potassium maintenance, organic mulching.', ar: 'الحراثة الكنتورية، زراعة الغطاء النباتي، التسميد البوتاسي، والتغطية العضوية.', fr: 'Culture en courbes de niveau, enherbement, fumure potassique.' },
  },
  cambisol: {
    name: { en: 'Cambisol (Eutric Brown Soils)', ar: 'تربة الكامبيسول (التربة البنية الخصبة)', fr: 'Cambisol (Sols bruns eutrophes)' },
    color: '#84cc16', // lime-500
    description: {
      en: 'Moderately developed fertile brown soils in mountain foothills and valleys (Médéa, Mascara, Guelma). Highly versatile for arboriculture and cereal rotations.',
      ar: 'تربة بنية خصبة متوسطة التطور في سفوح الجبال والوديان (المدية، معسكر، قالمة). متعددة الاستخدامات للأشجار والحبوب.',
      fr: 'Sols bruns fertiles de piémonts et vallons (Médéa, Mascara, Guelma). Excellente polyvalence agronomique.',
    },
    texture: 'Loam to Clay Loam',
    keyChallenge: { en: 'Occasional crusting, erosion on rolling topography.', ar: 'تشكل القشرة السطحية والانجراف على المنحدرات.', fr: 'Battance superficielle, érosion sur coteaux.' },
    recommendedAmendments: { en: 'Organic inputs, minimum tillage, nitrogen split applications.', ar: 'إضافة المادة العضوية، الحراثة الحافظة، وتقسيم دفعات الآزوت.', fr: 'Apports organiques, travail simplifié du sol, fractionnement azoté.' },
  },
  lithosol: {
    name: { en: 'Lithosol / Reg (Desert Stony Soils)', ar: 'تربة الليثوسول / الرق (التربة الصخرية الصحراوية)', fr: 'Lithosol / Reg (Sols pierreux désertiques)' },
    color: '#78716c', // stone-500
    description: {
      en: 'Very shallow soils over bedrock or stony gravel desert pavement (Regs) in the Sahara and arid massifs. Minimal biological activity.',
      ar: 'تربة ضحلة جداً فوق الصخور أو فرش الحصى الصحراوي (الرق) في الصحراء. نشاط حيوي منخفض جداً.',
      fr: 'Sols très superficiels sur roche mère ou chaussée de galets (Regs) au Sahara.',
    },
    texture: 'Stony / Gravelly Sand',
    keyChallenge: { en: 'Extreme physical constraints, lack of topsoil.', ar: 'عوائق فيزيائية شديدة وانعدام التربة الخصبة.', fr: 'Contraintes physiques extrêmes, absence de terre arable.' },
    recommendedAmendments: { en: 'Rock clearing, localized soilless/container cultivation, deep ripper trenching for trees.', ar: 'استصلاح ونزع الحجارة، الزراعة الموضعية أو بدون تربة، وحفر الخنادق العميقة للأشجار.', fr: 'Épierrage, culture sous abri/hors sol, défoncement profond pour arbres.' },
  },
};

/**
 * Key 58 Algerian Wilayas Comprehensive Agricultural GIS Dataset
 */
export const ALGERIA_WILAYAS_DATA: WilayaAgroProfile[] = [
  // 01 - Adrar
  {
    code: 1,
    id: 'adrar',
    name: { en: 'Adrar', ar: 'أدرار', fr: 'Adrar' },
    capital: { en: 'Adrar', ar: 'أدرار', fr: 'Adrar' },
    region: 'deep_sahara',
    coordinates: { lat: 27.87, lng: -0.29 },
    totalAreaKm2: 245360,
    agriculturalAreaHa: 48000,
    irrigatedAreaHa: 42000,
    dominantSoilClass: 'arenosol',
    soilNameLocal: { en: 'Desert sands & alluvial oasis silt (Foggaras)', ar: 'رمال صحراوية وطمي الواحات (نظام الفقارات)', fr: 'Sables éoliens & limons d’oasis (Foggaras)' },
    soilTexture: { en: 'Sandy to Sandy-Loam', ar: 'رملية إلى رملية طميية', fr: 'Sableux à sablo-limoneux' },
    clayPct: 8,
    siltPct: 14,
    sandPct: 78,
    ph: 8.2,
    organicMatterPct: 0.3,
    activeLimeCaCO3Pct: 12.0,
    salinityECeDsm: 3.8,
    waterHoldingCapacityMmPerM: 55,
    salinityRisk: 'moderate',
    erosionRisk: 'severe',
    bioclimate: 'hyper_arid',
    annualRainfallMm: 15,
    avgTempSummer: 45,
    avgTempWinter: 12,
    avgET0MmDay: 7.8,
    frostDaysPerYear: 1,
    siroccoDaysPerYear: 42,
    dominantCrops: ['cereals', 'pivot_potato', 'date_palms', 'livestock'],
    cropHighlights: [
      { name: { en: 'Center-Pivot Desert Wheat', ar: 'قمح الري المحوري بالصحراء', fr: 'Blé sous pivot saharien' }, emoji: '🌾', avgYield: '5.2 t/ha', season: { en: 'Nov – May', ar: 'نوفمبر – ماي', fr: 'Nov – Mai' } },
      { name: { en: 'Oasis Date Palm (Cheikh/Hamraya)', ar: 'نخيل التمر الواحاتي', fr: 'Dattiers traditionnels' }, emoji: '🌴', avgYield: '65 kg/tree', season: { en: 'Sep – Nov', ar: 'سبتمبر – نوفمبر', fr: 'Sep – Nov' } },
      { name: { en: 'Pivot Grain Corn / Silage', ar: 'ذرة حبوب وأعلاف محورية', fr: 'Maïs grain sous pivot' }, emoji: '🌽', avgYield: '7.8 t/ha', season: { en: 'Jul – Nov', ar: 'جويلية – نوفمبر', fr: 'Juil – Nov' } },
    ],
    primaryWaterSource: { en: 'Continental Intercalaire (Albian) Deep Aquifer & Foggaras', ar: 'مياه طبقة الألبيان الجوفية العميقة ونظام الفقارات', fr: 'Nappe de l’Albien & Foggaras' },
    majorDamsOrAquifers: { en: 'Continental Intercalaire / Grand Erg Occidental', ar: 'حوض الألبيان / العرق الغربي الكبير', fr: 'Nappe du Continental Intercalaire' },
    irrigationTechnique: { en: 'Automated Center-Pivots (85%) & Foggara gravity channels (15%)', ar: 'رش محوري أوتوماتيكي (85%) وقنوات الفقارة التقليدية (15%)', fr: 'Pivots géants (85%) & Foggaras (15%)' },
    agronomicAdvisory: {
      en: 'Split nitrogen applications into daily fertigation pulses to prevent leaching in pure sand. Install perimeter Casuarina windbreaks against dune movement.',
      ar: 'تجزئة الأسمدة الآزوتية يومياً عبر مياه الري لتفادي غسيلها في الرمال. غرس مصدات رياح من الكازوارينا لوقف زحف الرمال.',
      fr: 'Fractionner l’azote au quotidien par fertigation. Implanter des brise-vents en Casuarina pour fixer les dunes.',
    },
    soilManagementTips: {
      en: 'Add humic substances and manure annually to build soil aggregation. Run nighttime irrigation in summer to cut evaporation losses.',
      ar: 'إضافة المواد الهيومية والسماد العضوي سنوياً لبناء تماسك التربة. الري الليلي صيفاً لتقليل الفاقد بالتبخر.',
      fr: 'Apporter acides humiques et fumier. Privilégier l’irrigation nocturne en été pour réduire l’évaporation.',
    },
  },

  // 02 - Chlef
  {
    code: 2,
    id: 'chlef',
    name: { en: 'Chlef', ar: 'الشلف', fr: 'Chlef' },
    capital: { en: 'Chlef', ar: 'الشلف', fr: 'Chlef' },
    region: 'tell_coastal',
    coordinates: { lat: 36.16, lng: 1.33 },
    totalAreaKm2: 4795,
    agriculturalAreaHa: 260000,
    irrigatedAreaHa: 45000,
    dominantSoilClass: 'fluvisol',
    soilNameLocal: { en: 'Chéliff alluvial loam & calcic vertisols', ar: 'طمي وادي الشلف الفيضي وتربة التيرس الكلسية', fr: 'Alluvions du Chéliff & vertisols calciques' },
    soilTexture: { en: 'Clay-Loam to Silty-Clay', ar: 'طميية طينية إلى طينية طميية', fr: 'Argilo-limoneux' },
    clayPct: 42,
    siltPct: 36,
    sandPct: 22,
    ph: 7.9,
    organicMatterPct: 1.8,
    activeLimeCaCO3Pct: 14.5,
    salinityECeDsm: 2.4,
    waterHoldingCapacityMmPerM: 175,
    salinityRisk: 'moderate',
    erosionRisk: 'moderate',
    bioclimate: 'semi_arid',
    annualRainfallMm: 420,
    avgTempSummer: 38,
    avgTempWinter: 8,
    avgET0MmDay: 4.6,
    frostDaysPerYear: 4,
    siroccoDaysPerYear: 18,
    dominantCrops: ['citrus', 'greenhouses', 'cereals', 'olives'],
    cropHighlights: [
      { name: { en: 'Chéliff Citrus & Navel Oranges', ar: 'حمضيات وبرتقال الشلف', fr: 'Agrumes & Oranges Navel du Chéliff' }, emoji: '🍊', avgYield: '28 t/ha', season: { en: 'Nov – Mar', ar: 'نوفمبر – مارس', fr: 'Nov – Mars' } },
      { name: { en: 'Open-field Industrial Tomato', ar: 'طماطم حقلية وصناعية', fr: 'Tomate industrielle plein champ' }, emoji: '🍅', avgYield: '55 t/ha', season: { en: 'Apr – Aug', ar: 'أفريل – أوت', fr: 'Avr – Août' } },
      { name: { en: 'Durum Wheat & Barley', ar: 'قمح صلب وشعير', fr: 'Blé dur & Orge' }, emoji: '🌾', avgYield: '3.2 t/ha', season: { en: 'Nov – Jun', ar: 'نوفمبر – جوان', fr: 'Nov – Juin' } },
    ],
    primaryWaterSource: { en: 'Sidi Yacoub Dam, Oued Chéliff & Tube wells', ar: 'سد سيدي يعقوب، وادي الشلف والآبار الارتوازية', fr: 'Barrage Sidi Yacoub & Oued Chéliff' },
    majorDamsOrAquifers: { en: 'Sidi Yacoub Dam / Chéliff Alluvial Aquifer', ar: 'سد سيدي يعقوب / الطبقة الرسوبية للشلف', fr: 'Barrage Sidi Yacoub' },
    irrigationTechnique: { en: 'Drip fertigation for citrus/vegetables (70%), gravity furrows (30%)', ar: 'تنقيط وتسميد للحمضيات والخضار (70%)، وسواقي تقليدية (30%)', fr: 'Goutte-à-goutte (70%), submersion (30%)' },
    agronomicAdvisory: {
      en: 'Monitor water electrical conductivity in summer as Oued Chéliff salinity rises. Use calcium-based amendments to prevent sodium buildup in clay layers.',
      ar: 'مراقبة ملوحة مياه السقي صيفاً مع انخفاض منسوب الوادي. استعمال الجبس الزراعي لمنع تراكم الصوديوم في الطين.',
      fr: 'Surveiller la CE des eaux d’irrigation en été. Utiliser le gypse agricole contre l’alcalinisation sodique.',
    },
    soilManagementTips: {
      en: 'Perform deep subsoiling between orchard rows every 2 seasons to maintain root zone aeration.',
      ar: 'إجراء تفكيك عميق للتربة بين خطوط الأشجار كل موسمين لتهوية منطقة الجذور.',
      fr: 'Sous-soler entre les rangs d’agrumes tous les 2 ans pour préserver l’aération racinaire.',
    },
  },

  // 03 - Laghouat
  {
    code: 3,
    id: 'laghouat',
    name: { en: 'Laghouat', ar: 'الأغواط', fr: 'Laghouat' },
    capital: { en: 'Laghouat', ar: 'الأغواط', fr: 'Laghouat' },
    region: 'sahara_oasis',
    coordinates: { lat: 33.8, lng: 2.87 },
    totalAreaKm2: 25057,
    agriculturalAreaHa: 85000,
    irrigatedAreaHa: 28000,
    dominantSoilClass: 'calcisol',
    soilNameLocal: { en: 'Saharan Atlas steppic calcisoils & alluvial oases', ar: 'تربة جيرية سهوبية وطمي الواحات', fr: 'Calcisols steppiques & limons d’oasis' },
    soilTexture: { en: 'Sandy-Clay-Loam', ar: 'رملية طينية طميية', fr: 'Sablo-argilo-limoneux' },
    clayPct: 24,
    siltPct: 32,
    sandPct: 44,
    ph: 8.1,
    organicMatterPct: 0.9,
    activeLimeCaCO3Pct: 18.0,
    salinityECeDsm: 2.8,
    waterHoldingCapacityMmPerM: 110,
    salinityRisk: 'moderate',
    erosionRisk: 'high',
    bioclimate: 'arid',
    annualRainfallMm: 180,
    avgTempSummer: 40,
    avgTempWinter: 4,
    avgET0MmDay: 5.4,
    frostDaysPerYear: 12,
    siroccoDaysPerYear: 26,
    dominantCrops: ['livestock', 'arboriculture', 'greenhouses', 'cereals'],
    cropHighlights: [
      { name: { en: 'Steppic Ovine Livestock (Ouled Djellal Sheep)', ar: 'تربية الأغنام السلالة أولاد جلال', fr: 'Élevage ovin Ouled Djellal' }, emoji: '🐑', avgYield: 'Premium Meat', season: { en: 'Year-round', ar: 'طوال العام', fr: 'Toute l’année' } },
      { name: { en: 'Apricots & Pome Fruits (Aflou)', ar: 'مشمش وفاكهة آفلو الجبلية', fr: 'Abricots & Pommiers d’Aflou' }, emoji: '🍑', avgYield: '14 t/ha', season: { en: 'May – Jul', ar: 'ماي – جويلية', fr: 'Mai – Juil' } },
      { name: { en: 'Desert Pivot Fodder Alfalfa', ar: 'فصة علفية بالري المحوري', fr: 'Luzerne sous pivot' }, emoji: '🌿', avgYield: '16 t/ha DM', season: { en: 'Mar – Nov', ar: 'مارس – نوفمبر', fr: 'Mars – Nov' } },
    ],
    primaryWaterSource: { en: 'Deep Albian wells & Sekkak/M’zi oued springs', ar: 'آبار الألبيان العميقة وينابيع وادي مزي', fr: 'Forages profonds Albien & Oued M’zi' },
    majorDamsOrAquifers: { en: 'Continental Intercalaire / Oued M’zi Watershed', ar: 'حوض الألبيان / حوض وادي مزي', fr: 'Nappe Albienne / Oued M’zi' },
    irrigationTechnique: { en: 'Center-pivots (50%), Drip (35%), Traditional seguias (15%)', ar: 'رش محوري (50%)، تنقيط (35%)، وسواقي تقليدية (15%)', fr: 'Pivots (50%), goutte-à-goutte (35%)' },
    agronomicAdvisory: {
      en: 'Protect young orchards from severe late spring frosts in Aflou region. Use sulfur and organic manures to buffer high lime and release tied phosphorus.',
      ar: 'حماية بساتين الأشجار من الصقيع الربيعي المتأخر في منطقة آفلو. استعمال الكبريت والمادة العضوية لتحرير الفوسفور المثبت بالكلس.',
      fr: 'Protéger contre les gelées tardives à Aflou. Apporter soufre et compost pour débloquer le phosphore.',
    },
    soilManagementTips: {
      en: 'Rotate alfalfa with fodder barley to improve soil nitrogen and organic matter dynamics.',
      ar: 'المناوبة بين الفصة والشعير العلفي لتحسين محتوى الآزوت والمادة العضوية في التربة.',
      fr: 'Alterner luzerne et orge fourragère pour enrichir le sol en azote organique.',
    },
  },

  // 07 - Biskra
  {
    code: 7,
    id: 'biskra',
    name: { en: 'Biskra', ar: 'بسكرة', fr: 'Biskra' },
    capital: { en: 'Biskra', ar: 'بسكرة', fr: 'Biskra' },
    region: 'sahara_oasis',
    coordinates: { lat: 34.85, lng: 5.73 },
    totalAreaKm2: 21671,
    agriculturalAreaHa: 185000,
    irrigatedAreaHa: 142000,
    dominantSoilClass: 'arenosol',
    soilNameLocal: { en: 'Ziban gypsum-sandy soils & rich oasis loams', ar: 'تربة الزيبان الجبسية الرملية وطمي الواحات', fr: 'Sols gypso-sableux des Ziban & limons d’oasis' },
    soilTexture: { en: 'Sandy-Loam to Gypsiferous Sand', ar: 'رملية طميية إلى رملية جبسية', fr: 'Sablo-limoneux à gypseux' },
    clayPct: 14,
    siltPct: 22,
    sandPct: 64,
    ph: 8.0,
    organicMatterPct: 0.7,
    activeLimeCaCO3Pct: 16.5,
    salinityECeDsm: 3.6,
    waterHoldingCapacityMmPerM: 85,
    salinityRisk: 'high',
    erosionRisk: 'high',
    bioclimate: 'arid',
    annualRainfallMm: 130,
    avgTempSummer: 44,
    avgTempWinter: 11,
    avgET0MmDay: 6.2,
    frostDaysPerYear: 2,
    siroccoDaysPerYear: 35,
    dominantCrops: ['greenhouses', 'date_palms', 'pivot_potato', 'arboriculture'],
    cropHighlights: [
      { name: { en: 'Intensive Greenhouse Tomato & Peppers', ar: 'طماطم وفلفل البيوت البلاستيكية', fr: 'Tomate & Poivron primeur sous serre' }, emoji: '🍅', avgYield: '95 t/ha', season: { en: 'Oct – May', ar: 'أكتوبر – ماي', fr: 'Oct – Mai' } },
      { name: { en: 'Deglet Nour Royal Dates (Tolga)', ar: 'تمور دقلة نور الملكية (طولقة)', fr: 'Dattes Deglet Nour de Tolga' }, emoji: '🌴', avgYield: '85 kg/palm', season: { en: 'Oct – Dec', ar: 'أكتوبر – ديسمبر', fr: 'Oct – Déc' } },
      { name: { en: 'Early Season Watermelon & Melons', ar: 'دلاع وبطيخ مبكر', fr: 'Pastèque & Melon primeurs' }, emoji: '🍉', avgYield: '45 t/ha', season: { en: 'Apr – Jun', ar: 'أفريل – جوان', fr: 'Avr – Juin' } },
    ],
    primaryWaterSource: { en: 'Fontaine des Gazelles Dam, Foum El Gherza Dam & Albian Wells', ar: 'سد فم الخرزة، سد عين الغزال والآبار الألبيانية', fr: 'Barrage Foum El Gherza & Forages Albien' },
    majorDamsOrAquifers: { en: 'Complexe Terminal & Continental Intercalaire Aquifers', ar: 'طبقة المركب النهائي وطبقة الألبيان', fr: 'Nappes CT et CI' },
    irrigationTechnique: { en: 'Drip fertigation in greenhouses (80%), Micro-sprinklers for dates (20%)', ar: 'ري وتسميد بالتنقيط في البيوت المحمية (80%)، رش دقيق للنخيل (20%)', fr: 'Fertigation goutte-à-goutte (80%)' },
    agronomicAdvisory: {
      en: 'Maintain high calcium/potassium ratios in fertigation recipes to prevent Blossom End Rot in tomato under warm Sirocco spells. Flush soil with 15% leaching fraction to manage salinity.',
      ar: 'الحفاظ على نسبة متوازنة من الكالسيوم والبوتاسيوم لتفادي عفن الطرف الزهري للطماطم عند هبوب الشهيلي. تطبيق ري غسيل 15% لضبط ملوحة التربة.',
      fr: 'Maintenir un bon ratio Ca/K contre la nécrose apicale de la tomate. Prévoir une fraction de lessivage de 15% contre les sels.',
    },
    soilManagementTips: {
      en: 'Incorporate solarization during July-August to sterilize soil and control nematodes before autumn greenhouse planting.',
      ar: 'تطبيق التعقيم الشمسي للتربة في شهري جويلية وأوت للقضاء على النيماتودا ومسببات الأمراض قبل الزراعة الخريفية.',
      fr: 'Pratiquer la solarisation en juillet-août pour assainir le sol des nématodes avant repiquage d’automne.',
    },
  },

  // 09 - Blida
  {
    code: 9,
    id: 'blida',
    name: { en: 'Blida', ar: 'البليدة', fr: 'Blida' },
    capital: { en: 'Blida', ar: 'البليدة', fr: 'Blida' },
    region: 'tell_coastal',
    coordinates: { lat: 36.47, lng: 2.83 },
    totalAreaKm2: 1575,
    agriculturalAreaHa: 68000,
    irrigatedAreaHa: 48000,
    dominantSoilClass: 'vertisol',
    soilNameLocal: { en: 'Deep Black & Grey Mitidja Tirs', ar: 'تربة التيرس السوداء والرمادية بسهل متيجة', fr: 'Tirs noirs et gris profonds de la Mitidja' },
    soilTexture: { en: 'Heavy Clay (Argile lourde)', ar: 'طين ثقيل', fr: 'Argile lourde' },
    clayPct: 54,
    siltPct: 28,
    sandPct: 18,
    ph: 7.7,
    organicMatterPct: 2.4,
    activeLimeCaCO3Pct: 8.5,
    salinityECeDsm: 1.1,
    waterHoldingCapacityMmPerM: 195,
    salinityRisk: 'low',
    erosionRisk: 'low',
    bioclimate: 'humid',
    annualRainfallMm: 780,
    avgTempSummer: 33,
    avgTempWinter: 9,
    avgET0MmDay: 3.8,
    frostDaysPerYear: 2,
    siroccoDaysPerYear: 10,
    dominantCrops: ['citrus', 'greenhouses', 'arboriculture', 'cereals'],
    cropHighlights: [
      { name: { en: 'Mitidja Clementines & Oranges', ar: 'كليمونتين وبرتقال متيجة', fr: 'Clémentines & Oranges de la Mitidja' }, emoji: '🍊', avgYield: '34 t/ha', season: { en: 'Oct – Feb', ar: 'أكتوبر – فيفري', fr: 'Oct – Fév' } },
      { name: { en: 'Table Grapes & Kiwis', ar: 'عنب المائدة والكيوي', fr: 'Raisin de table & Kiwis' }, emoji: '🍇', avgYield: '26 t/ha', season: { en: 'Jul – Oct', ar: 'جويلية – أكتوبر', fr: 'Juil – Oct' } },
      { name: { en: 'Industrial Primeur Potatoes', ar: 'بطاطا بدرية وموسمية', fr: 'Pomme de terre primeur' }, emoji: '🥔', avgYield: '32 t/ha', season: { en: 'Dec – May', ar: 'ديسمبر – ماي', fr: 'Déc – Mai' } },
    ],
    primaryWaterSource: { en: 'Mitidja Alluvial Aquifer & Chiffa / Bouroumi Dams', ar: 'الطبقة الجوفية لسهل متيجة وسد بورومي وسد الشفة', fr: 'Nappe de la Mitidja & Barrage Bouroumi' },
    majorDamsOrAquifers: { en: 'Mitidja Groundwater Basin & Bouroumi Dam', ar: 'حوض المياه الجوفية لمتيجة وسد بورومي', fr: 'Nappe phréatique de la Mitidja' },
    irrigationTechnique: { en: 'Localized Drip (85%), Underground perforated pipes (15%)', ar: 'ري موضعي بالتنقيط (85%) وأنابيب باطنية (15%)', fr: 'Goutte-à-goutte localisé (85%)' },
    agronomicAdvisory: {
      en: 'Heavy smectite clays require careful drainage management in winter. Use Carrizo rootstocks for citrus to guard against Phytophthora and asphyxiation.',
      ar: 'تربة التيرس الطينية تتطلب تصريفاً شتوياً فعالاً. اختيار حامل الطعم كاريزو للحمضيات لمقاومة الفيتوفثورا والاختناق الجذري.',
      fr: 'Gérer scrupuleusement le drainage hivernal. Utiliser le porte-greffe Carrizo contre le Phytophthora et l’asphyxie.',
    },
    soilManagementTips: {
      en: 'Tillage must strictly occur at optimal soil moisture ("état friable"). Avoid wet tractor traffic to prevent deep subsoil compaction.',
      ar: 'الحراثة حصرًا عند الرطوبة الملائمة (حالة التفتت). تجنب مرور الجرارات أثناء البلل لمنع الانضغاط العميق.',
      fr: 'Labourer au ressuyage idéal. Éviter le passage d’engins lourds sur sol détrempé.',
    },
  },

  // 15 - Tizi Ouzou
  {
    code: 15,
    id: 'tizi_ouzou',
    name: { en: 'Tizi Ouzou', ar: 'تيزي وزو', fr: 'Tizi Ouzou' },
    capital: { en: 'Tizi Ouzou', ar: 'تيزي وزو', fr: 'Tizi Ouzou' },
    region: 'mountains',
    coordinates: { lat: 36.71, lng: 4.04 },
    totalAreaKm2: 2958,
    agriculturalAreaHa: 95000,
    irrigatedAreaHa: 18000,
    dominantSoilClass: 'luvisol',
    soilNameLocal: { en: 'Kabylie fersiallitic red soils & mountain cambisols', ar: 'تربة حمراء متوسطية وتربة بنية جبلية بمنطقة القبائل', fr: 'Sols rouges fersiallitiques & cambisols de Kabylie' },
    soilTexture: { en: 'Sandy-Clay-Loam to Clay-Loam', ar: 'رملية طينية طميية إلى طينية طميية', fr: 'Sablo-argilo-limoneux' },
    clayPct: 34,
    siltPct: 28,
    sandPct: 38,
    ph: 6.8,
    organicMatterPct: 2.8,
    activeLimeCaCO3Pct: 4.0,
    salinityECeDsm: 0.6,
    waterHoldingCapacityMmPerM: 145,
    salinityRisk: 'none',
    erosionRisk: 'severe',
    bioclimate: 'humid',
    annualRainfallMm: 920,
    avgTempSummer: 32,
    avgTempWinter: 7,
    avgET0MmDay: 3.6,
    frostDaysPerYear: 6,
    siroccoDaysPerYear: 8,
    dominantCrops: ['olives', 'arboriculture', 'livestock'],
    cropHighlights: [
      { name: { en: 'Traditional Olive Oil (Chemlal Olive)', ar: 'زيت زيتون تقليدي رفيع (صنف شملال)', fr: 'Huile d’olive traditionnelle (Chemlal)' }, emoji: '🫒', avgYield: '22 L oil/100kg', season: { en: 'Nov – Feb', ar: 'نوفمبر – فيفري', fr: 'Nov – Fév' } },
      { name: { en: 'Mountain Figs (Beni Maouche type)', ar: 'تين جاف وعذب عالي الجودة', fr: 'Figues de Kabylie' }, emoji: '🍈', avgYield: '12 t/ha', season: { en: 'Aug – Oct', ar: 'أوت – أكتوبر', fr: 'Août – Oct' } },
      { name: { en: 'Mountain Apiculture (Thyme/Wildflower Honey)', ar: 'عسل الجبال والزعتر البري', fr: 'Miel de montagne & de thym' }, emoji: '🍯', avgYield: '8 kg/hive', season: { en: 'Jun – Aug', ar: 'جوان – أوت', fr: 'Juin – Août' } },
    ],
    primaryWaterSource: { en: 'Taksebt Dam, mountain springs & Oued Sebaou', ar: 'سد تاقسبت، الينابيع الجبلية ووادي سيباو', fr: 'Barrage Taksebt & Oued Sebaou' },
    majorDamsOrAquifers: { en: 'Taksebt Dam (180M m3) & Djurdjura Karst Springs', ar: 'سد تاقسبت وينابيع جرجرة الكارستية', fr: 'Barrage Taksebt' },
    irrigationTechnique: { en: 'Rainfed with supplemental drip for young orchards & berries', ar: 'مطري مع ري تكميلي بالتنقيط للبساتين الفتية', fr: 'Pluvial avec goutte-à-goutte d’appoint' },
    agronomicAdvisory: {
      en: 'Maintain terrace walls and vegetative cover to halt severe water erosion during autumn storms. Apply boron and zinc foliar sprays before olive bloom.',
      ar: 'صيانة الجدران الحجرية والمدرجات لمنع انجراف التربة خلال أمطار الخريف. رش البورون والزنك قبل إزهار الزيتون.',
      fr: 'Entretenir terrasses et murets contre le ravinement. Apporter bore et zinc par voie foliaire avant floraison de l’olivier.',
    },
    soilManagementTips: {
      en: 'Mulch with olive mill pruning chips to enrich organic matter and reduce soil temperature in dry summer.',
      ar: 'استعمال بقايا تقليم الزيتون كغطاء عضوي (Mulch) لخفض حرارة التربة صيفاً وحفظ الرطوبة.',
      fr: 'Broyer les sarments d’oliviers au sol comme paillage protecteur.',
    },
  },

  // 19 - Sétif
  {
    code: 19,
    id: 'setif',
    name: { en: 'Sétif', ar: 'سطيف', fr: 'Sétif' },
    capital: { en: 'Sétif', ar: 'سطيف', fr: 'Sétif' },
    region: 'high_plateaus',
    coordinates: { lat: 36.19, lng: 5.41 },
    totalAreaKm2: 6549,
    agriculturalAreaHa: 420000,
    irrigatedAreaHa: 62000,
    dominantSoilClass: 'calcisol',
    soilNameLocal: { en: 'High Plateaus calcic rendzinas & brown soils', ar: 'تربة الرندزينا والكالسيسول البنية بالهضاب العليا', fr: 'Rendzines & sols bruns calcaires des Hauts Plateaux' },
    soilTexture: { en: 'Clay-Loam to Silty-Clay', ar: 'طميية طينية إلى طينية طميية', fr: 'Argilo-limoneux' },
    clayPct: 38,
    siltPct: 34,
    sandPct: 28,
    ph: 8.1,
    organicMatterPct: 1.6,
    activeLimeCaCO3Pct: 22.0,
    salinityECeDsm: 1.2,
    waterHoldingCapacityMmPerM: 160,
    salinityRisk: 'low',
    erosionRisk: 'high',
    bioclimate: 'semi_arid',
    annualRainfallMm: 390,
    avgTempSummer: 35,
    avgTempWinter: 2,
    avgET0MmDay: 4.4,
    frostDaysPerYear: 32,
    siroccoDaysPerYear: 14,
    dominantCrops: ['cereals', 'arboriculture', 'livestock', 'pivot_potato'],
    cropHighlights: [
      { name: { en: 'National Leader: Durum Wheat (Blé Dur)', ar: 'رائد وطني: القمح الصلب (صنف سيميتو/محمد البشير)', fr: 'Leader National : Blé dur' }, emoji: '🌾', avgYield: '3.8 t/ha (up to 6.5 under pivot)', season: { en: 'Nov – Jun', ar: 'نوفمبر – جوان', fr: 'Nov – Juin' } },
      { name: { en: 'Highland Apples & Pears (Ain Oulmene)', ar: 'تفاح وإجاص الهضاب العليا (عين ولمان)', fr: 'Pommes & Poires d’altitude' }, emoji: '🍎', avgYield: '28 t/ha', season: { en: 'Aug – Oct', ar: 'أوت – أكتوبر', fr: 'Août – Oct' } },
      { name: { en: 'Seasonal & Arrière-Saison Potato', ar: 'بطاطا موسمية ومابعد موسمية', fr: 'Pomme de terre de saison' }, emoji: '🥔', avgYield: '34 t/ha', season: { en: 'Mar – Jul / Aug – Nov', ar: 'مارس – جويلية / أوت – نوفمبر', fr: 'Mars – Juil' } },
    ],
    primaryWaterSource: { en: 'Ain Zada & Mahouane Dams, Transfer from Ighil Emda & Deep wells', ar: 'سد عين زادة، سد مهوان والتحويل المائي من إيغيل أمدة والآبار', fr: 'Barrages Ain Zada, Mahouane & Forages' },
    majorDamsOrAquifers: { en: 'Ain Zada & Mahouane System (Grands Transferts)', ar: 'منظومة سد عين زادة وسد مهوان', fr: 'Système Ain Zada / Mahouane' },
    irrigationTechnique: { en: 'Supplemental Center-Pivots & Sprinklers for cereals (60%), Drip for apples (40%)', ar: 'رش محوري ورشاشات تكميلية للحبوب (60%)، وتنقيط للبساتين (40%)', fr: 'Pivots & aspersion pour céréales (60%)' },
    agronomicAdvisory: {
      en: 'Apply supplemental irrigation (30-40 mm) at cereal booting and flowering to prevent grain shriveling from late spring frosts and early Sirocco. Use MAP instead of DAP to counteract high soil lime.',
      ar: 'تطبيق ري تكميلي (30-40 ملم) عند مرحلتي الحبل والإزهار لحماية الحبوب من الصقيع الربيعي والشهيلي. استعمال سماد MAP لتحييد تأثير الكلس.',
      fr: 'Irrigation d’appoint cruciale au gonflement/floraison du blé. Préférer le MAP au DAP sur ces sols très calcaires.',
    },
    soilManagementTips: {
      en: 'Introduce grain legumes (chickpea, lentil) in biennial rotation with durum wheat to break weed cycles and naturally fix nitrogen.',
      ar: 'إدراج البقوليات الغذائية (حمص، عدس) في الدورة الزراعية مع القمح الصلب لكسر دورة الأعشاب وتثبيت الآزوت طبيعياً.',
      fr: 'Intégrer pois chiche ou lentille dans l’assolement céréalier pour rompre le cycle des adventices.',
    },
  },

  // 22 - Sidi Bel Abbès
  {
    code: 22,
    id: 'sidi_bel_abbes',
    name: { en: 'Sidi Bel Abbès', ar: 'سيدي بلعباس', fr: 'Sidi Bel Abbès' },
    capital: { en: 'Sidi Bel Abbès', ar: 'سيدي بلعباس', fr: 'Sidi Bel Abbès' },
    region: 'high_plateaus',
    coordinates: { lat: 35.19, lng: -0.63 },
    totalAreaKm2: 9150,
    agriculturalAreaHa: 340000,
    irrigatedAreaHa: 42000,
    dominantSoilClass: 'vertisol',
    soilNameLocal: { en: 'Tessala heavy tirs & western calcisoils', ar: 'تربة التيرس الثقيلة بسهل تسالة والتربة الكلسية', fr: 'Tirs de la plaine de la Tessala & calcisols' },
    soilTexture: { en: 'Clay to Clay-Loam', ar: 'طينية إلى طينية طميية', fr: 'Argileux à argilo-limoneux' },
    clayPct: 46,
    siltPct: 30,
    sandPct: 24,
    ph: 8.0,
    organicMatterPct: 1.7,
    activeLimeCaCO3Pct: 15.0,
    salinityECeDsm: 1.4,
    waterHoldingCapacityMmPerM: 180,
    salinityRisk: 'low',
    erosionRisk: 'moderate',
    bioclimate: 'semi_arid',
    annualRainfallMm: 380,
    avgTempSummer: 36,
    avgTempWinter: 5,
    avgET0MmDay: 4.5,
    frostDaysPerYear: 16,
    siroccoDaysPerYear: 15,
    dominantCrops: ['cereals', 'olives', 'livestock', 'viticulture'],
    cropHighlights: [
      { name: { en: 'Durum Wheat & Barley Grain', ar: 'القمح الصلب والشعير', fr: 'Blé dur & Orge de renommée' }, emoji: '🌾', avgYield: '3.4 t/ha', season: { en: 'Nov – Jun', ar: 'نوفمبر – جوان', fr: 'Nov – Juin' } },
      { name: { en: 'Highland Olive Groves (Sigoise/Chemlal)', ar: 'زيتون المائدة والزيت', fr: 'Vergers oléicoles' }, emoji: '🫒', avgYield: '4.8 t/ha', season: { en: 'Oct – Dec', ar: 'أكتوبر – ديسمبر', fr: 'Oct – Déc' } },
      { name: { en: 'Onion & Dry Legumes (Chickpeas)', ar: 'بصل وحمص عالي الجودة', fr: 'Oignon & Pois chiche' }, emoji: '🧅', avgYield: '28 t/ha', season: { en: 'May – Aug', ar: 'ماي – أوت', fr: 'Mai – Août' } },
    ],
    primaryWaterSource: { en: 'Tabia & Sarno Dams, Oued Mekerra & Deep Wells', ar: 'سد طابية، سد سارنو، وادي مكرة والآبار', fr: 'Barrages Tabia & Sarno' },
    majorDamsOrAquifers: { en: 'Sarno Dam & Tessala Plain Aquifer', ar: 'سد سارنو وطبقة سهل تسالة', fr: 'Barrage Sarno' },
    irrigationTechnique: { en: 'Sprinklers for cereals & legumes (55%), Drip for olives/onions (45%)', ar: 'رشاشات للحبوب والبقوليات (55%)، وتنقيط للزيتون والبصل (45%)', fr: 'Aspersion (55%), Goutte-à-goutte (45%)' },
    agronomicAdvisory: {
      en: 'Calcareous heavy soil requires split nitrogen applications. Practice minimum tillage to conserve seedbed moisture before autumn cereal sowing.',
      ar: 'التربة الكلسية الطينية تتطلب تقسيم دفعات التسميد الآزوتي. اعتماد الحراثة الحافظة لحفظ رطوبة مرقد البذرة قبل بذر الحبوب.',
      fr: 'Fractionner l’azote. Pratiquer le semis direct ou TCS pour conserver l’humidité du lit de semence.',
    },
    soilManagementTips: {
      en: 'Deep chisel plowing after dry harvest loosens the summer compaction without turning over subsoil horizons.',
      ar: 'استعمال المحراث الإزميلي (Chisel) بعد الحصاد لخلخلة التربة دون قلب الطبقات السفلية.',
      fr: 'Passage d’un décompacteur ou chisel après moisson.',
    },
  },

  // 39 - El Oued
  {
    code: 39,
    id: 'el_oued',
    name: { en: 'El Oued', ar: 'الوادي', fr: 'El Oued' },
    capital: { en: 'El Oued', ar: 'الوادي', fr: 'El Oued' },
    region: 'sahara_oasis',
    coordinates: { lat: 33.37, lng: 6.86 },
    totalAreaKm2: 45738,
    agriculturalAreaHa: 120000,
    irrigatedAreaHa: 108000,
    dominantSoilClass: 'arenosol',
    soilNameLocal: { en: 'Erg Oriental eolian sand dunes & Ghout oasis soils', ar: 'رمال العرق الشرقي الكثبانية ونظام الغيطان التقليدي', fr: 'Sables éoliens du Grand Erg Oriental & Ghouts' },
    soilTexture: { en: 'Pure Dune Sand (Sable pur)', ar: 'رمل صحراوي نقي', fr: 'Sable éolien pur' },
    clayPct: 3,
    siltPct: 5,
    sandPct: 92,
    ph: 8.3,
    organicMatterPct: 0.2,
    activeLimeCaCO3Pct: 7.0,
    salinityECeDsm: 2.2,
    waterHoldingCapacityMmPerM: 38,
    salinityRisk: 'moderate',
    erosionRisk: 'severe',
    bioclimate: 'hyper_arid',
    annualRainfallMm: 75,
    avgTempSummer: 46,
    avgTempWinter: 10,
    avgET0MmDay: 6.8,
    frostDaysPerYear: 1,
    siroccoDaysPerYear: 38,
    dominantCrops: ['pivot_potato', 'date_palms', 'greenhouses', 'arboriculture'],
    cropHighlights: [
      { name: { en: 'National Leader: Desert Pivot Potato', ar: 'رائد وطني: بطاطا الري المحوري بالرمال', fr: 'Leader National : Pomme de terre sous pivot' }, emoji: '🥔', avgYield: '38 t/ha (2 cycles/yr)', season: { en: 'Oct – Feb & Feb – Jun', ar: 'أكتوبر – فيفري & فيفري – جوان', fr: 'Oct – Fév & Fév – Juin' } },
      { name: { en: 'Deglet Nour Dates & Traditional Ghout Palms', ar: 'تمور دقلة نور ونخيل الغيطان', fr: 'Dattes Deglet Nour du Souf' }, emoji: '🌴', avgYield: '75 kg/palm', season: { en: 'Oct – Dec', ar: 'أكتوبر – ديسمبر', fr: 'Oct – Déc' } },
      { name: { en: 'Desert Onions & Garlic', ar: 'بصل وثوم صحراوي عالي الإنتاجية', fr: 'Oignons & Ail sous pivot' }, emoji: '🧄', avgYield: '42 t/ha', season: { en: 'Jan – May', ar: 'جانفي – ماي', fr: 'Janv – Mai' } },
    ],
    primaryWaterSource: { en: 'Complexe Terminal & Continental Intercalaire (Albian) Aquifers', ar: 'طبقة المركب النهائي وطبقة الألبيان الجوفية العميقة', fr: 'Nappes du Complexe Terminal et de l’Albien' },
    majorDamsOrAquifers: { en: 'Grand Erg Oriental Groundwater Basin', ar: 'حوض العرق الشرقي الجوفي العملاق', fr: 'Bassin hydrogéologique du Sahara septentrional' },
    irrigationTechnique: { en: 'Center-Pivots with computerized micro-dosing (80%), Drip (20%)', ar: 'ري محوري مبرمج بجرعات ميكروية (80%) وتنقيط (20%)', fr: 'Pivots géants automatisés (80%)' },
    agronomicAdvisory: {
      en: 'Sandy soil has near-zero nutrient buffer. Split potassium and nitrogen into every single irrigation cycle. Apply bentonite clay or leonardite humic acid at planting.',
      ar: 'الرمال النفاذة تنعدم فيها القدرة على حبس الأسمدة. تجزئة البوتاسيوم والآزوت مع كل دورة ري. إضافة طين البنتونايت أو حمض الهيوميك عند الغرس.',
      fr: 'Le sable ne retient aucun engrais. Injecter N et K à chaque tour d’eau. Apport de bentonite ou acides humiques au semis.',
    },
    soilManagementTips: {
      en: 'Maintain continuous pivot rotation to keep surface sand crust stable against blistering desert winds.',
      ar: 'تشغيل دورات ري سريعة ومتقاربة لتثبيت قشرة الرمال الرطبة ضد الرياح الصحراوية.',
      fr: 'Maintenir une humidité de surface par cycles courts pour freiner l’érosion éolienne.',
    },
  },

  // 47 - Ghardaïa
  {
    code: 47,
    id: 'ghardaia',
    name: { en: 'Ghardaïa', ar: 'غرداية', fr: 'Ghardaïa' },
    capital: { en: 'Ghardaïa', ar: 'غرداية', fr: 'Ghardaïa' },
    region: 'sahara_oasis',
    coordinates: { lat: 32.49, lng: 3.67 },
    totalAreaKm2: 86105,
    agriculturalAreaHa: 65000,
    irrigatedAreaHa: 52000,
    dominantSoilClass: 'arenosol',
    soilNameLocal: { en: 'M’Zab stony calcisoils & alluvial river terraces', ar: 'تربة وادي ميزاب الحصوية والطميية الفيضية', fr: 'Sols caillouteux du M’Zab & alluvions' },
    soilTexture: { en: 'Sandy-Loam to Gravelly Sand', ar: 'رملية طميية إلى رملية حصوية', fr: 'Sablo-limoneux à caillouteux' },
    clayPct: 12,
    siltPct: 18,
    sandPct: 70,
    ph: 8.2,
    organicMatterPct: 0.5,
    activeLimeCaCO3Pct: 19.0,
    salinityECeDsm: 2.9,
    waterHoldingCapacityMmPerM: 70,
    salinityRisk: 'moderate',
    erosionRisk: 'high',
    bioclimate: 'hyper_arid',
    annualRainfallMm: 95,
    avgTempSummer: 43,
    avgTempWinter: 9,
    avgET0MmDay: 6.0,
    frostDaysPerYear: 3,
    siroccoDaysPerYear: 30,
    dominantCrops: ['date_palms', 'pivot_potato', 'greenhouses', 'livestock'],
    cropHighlights: [
      { name: { en: 'M’Zab Valley Date Palms & Oases', ar: 'نخيل وادي ميزاب والواحات الحديثة', fr: 'Palmeraies du M’Zab & Nouvelles concessions' }, emoji: '🌴', avgYield: '68 kg/palm', season: { en: 'Oct – Dec', ar: 'أكتوبر – ديسمبر', fr: 'Oct – Déc' } },
      { name: { en: 'Guerrara Desert Pivot Potatoes & Wheat', ar: 'بطاطا وقمح الري المحوري بالقرارة', fr: 'Pomme de terre & Blé sous pivot à Guerrara' }, emoji: '🥔', avgYield: '35 t/ha', season: { en: 'Nov – May', ar: 'نوفمبر – ماي', fr: 'Nov – Mai' } },
      { name: { en: 'Protected Greenhouse Melons & Tomatoes', ar: 'بطيخ وطماطم البيوت المحمية', fr: 'Melon & Tomate sous serre' }, emoji: '🍈', avgYield: '40 t/ha', season: { en: 'Mar – Jun', ar: 'مارس – جوان', fr: 'Mars – Juin' } },
    ],
    primaryWaterSource: { en: 'Complexe Terminal & Albian Deep Wells, Traditional Flood Weirs', ar: 'آبار الألبيان والمركب النهائي وسدود التحويل التقليدية', fr: 'Forages Albien & Digues traditionnelles' },
    majorDamsOrAquifers: { en: 'Continental Intercalaire Aquifer', ar: 'طبقة الألبيان الجوفية العميقة', fr: 'Nappe de l’Albien' },
    irrigationTechnique: { en: 'Center-Pivots (55%), Drip in greenhouses and palm groves (45%)', ar: 'ري محوري (55%)، وتنقيط في البيوت المحمية والنخيل (45%)', fr: 'Pivots (55%), Goutte-à-goutte (45%)' },
    agronomicAdvisory: {
      en: 'Calcareous sandy soils require acidifying nutrition. Use chelated iron (Fe-EDDHA) to prevent palm leaf chlorosis and ensure balanced magnesium supply.',
      ar: 'التربة الرملية الكلسية تتطلب تسميداً محمضاً. استعمال مخلبات الحديد Fe-EDDHA لمنع اصفرار جريد النخيل وتوفير المغنيسيوم.',
      fr: 'Apporter des engrais acidifiants et fer chélaté Fe-EDDHA contre le jaunissement des palmes.',
    },
    soilManagementTips: {
      en: 'Add palm frond compost and manure to build sandy topsoil structure.',
      ar: 'استعمال سماد سعف النخيل المتحلل والسماد العضوي لبناء خصوبة التربة الرملية.',
      fr: 'Composter les sous-produits du palmier pour enrichir le sol.',
    },
  },

  // 58 - El Menia (New Agricultural Mega-Pole)
  {
    code: 58,
    id: 'el_menia',
    name: { en: 'El Menia', ar: 'المنيعة', fr: 'El Menia' },
    capital: { en: 'El Menia', ar: 'المنيعة', fr: 'El Menia' },
    region: 'deep_sahara',
    coordinates: { lat: 30.58, lng: 2.88 },
    totalAreaKm2: 62215,
    agriculturalAreaHa: 95000,
    irrigatedAreaHa: 78000,
    dominantSoilClass: 'arenosol',
    soilNameLocal: { en: 'El Golea sweet alluvial sands & Albian mega-concessions', ar: 'رمال القليعة العذبة ومحيطات الامتياز الفلاحي بالألبيان', fr: 'Sables fertiles d’El Goléa & grands périmètres Albien' },
    soilTexture: { en: 'Sandy to Loamy-Sand', ar: 'رملية إلى رملية طميية', fr: 'Sablo-limoneux fin' },
    clayPct: 7,
    siltPct: 13,
    sandPct: 80,
    ph: 7.9,
    organicMatterPct: 0.4,
    activeLimeCaCO3Pct: 8.0,
    salinityECeDsm: 1.6,
    waterHoldingCapacityMmPerM: 60,
    salinityRisk: 'low',
    erosionRisk: 'severe',
    bioclimate: 'hyper_arid',
    annualRainfallMm: 45,
    avgTempSummer: 44,
    avgTempWinter: 9,
    avgET0MmDay: 6.5,
    frostDaysPerYear: 2,
    siroccoDaysPerYear: 36,
    dominantCrops: ['cereals', 'pivot_potato', 'arboriculture', 'greenhouses'],
    cropHighlights: [
      { name: { en: 'Strategic Wheat & Grain Corn under Pivot', ar: 'القمح الاستراتيجي والذرة بالري المحوري', fr: 'Blé stratégique & Maïs grain sous pivot' }, emoji: '🌾', avgYield: '5.8 t/ha', season: { en: 'Nov – May', ar: 'نوفمبر – ماي', fr: 'Nov – Mai' } },
      { name: { en: 'Sweet El Golea Oranges & Citrus', ar: 'برتقال وحمضيات القليعة الشهيرة', fr: 'Agrumes réputés d’El Goléa' }, emoji: '🍊', avgYield: '30 t/ha', season: { en: 'Nov – Mar', ar: 'نوفمبر – مارس', fr: 'Nov – Mars' } },
      { name: { en: 'Desert Pivot Seed Potatoes', ar: 'إنتاج بذور البطاطا بالصحراء', fr: 'Plants de pomme de terre sous pivot' }, emoji: '🥔', avgYield: '36 t/ha', season: { en: 'Oct – Feb', ar: 'أكتوبر – فيفري', fr: 'Oct – Fév' } },
    ],
    primaryWaterSource: { en: 'Continental Intercalaire (Albian) High Quality Artesian Wells (TDS < 1.2 g/L)', ar: 'مياه طبقة الألبيان الارتوازية العذبة عالية الجودة (ملوحة أقل من 1.2 غ/ل)', fr: 'Forages artésiens de l’Albien de haute qualité' },
    majorDamsOrAquifers: { en: 'Continental Intercalaire Aquifer (Nappe Albienne)', ar: 'طبقة الألبيان الجوفية العميقة', fr: 'Nappe du Continental Intercalaire' },
    irrigationTechnique: { en: 'Automated Giant Center-Pivots (75%), Drip for citrus & greenhouses (25%)', ar: 'رش محوري عملاق مبرمج (75%) وتنقيط للحمضيات (25%)', fr: 'Pivots géants (75%), Goutte-à-goutte (25%)' },
    agronomicAdvisory: {
      en: 'Remarkable water quality allows high yields. Prioritize phosphorus placement at seeding depth and potassium fertigation during cereal grain filling.',
      ar: 'عذوبة وجودة مياه السقي تتيح مردوداً استثنائياً. التركيز على تموضع الفوسفور مع البذر والبوتاسيوم عند امتلاء الحبوب.',
      fr: 'Excellente qualité de l’eau permettant des rendements élevés. Soigner la fertilisation P au semis et K au remplissage.',
    },
    soilManagementTips: {
      en: 'Use precision variable-rate fertigation to optimize water pumping energy and fertilizer recovery in sandy soils.',
      ar: 'استعمال تقنيات التسميد الذكي متغير الجرعات لترشيد طاقة الضخ ورفع كفاءة امتصاص الأسمدة.',
      fr: 'Adopter la fertigation à débit variable pour maximiser l’efficience de l’eau et des nutriments.',
    },
  },
];

/**
 * Crop Suitability Matrix across Algerian Agro-Ecological Zones
 */
export interface CropSuitabilityRule {
  cropId: string;
  cropName: { en: string; ar: string; fr: string };
  emoji: string;
  category: MajorCropCategory;
  optimalZone: AlgeriaAgroZone;
  favorableZones: AlgeriaAgroZone[];
  marginalZones: AlgeriaAgroZone[];
  unsuitableZones: AlgeriaAgroZone[];
  idealSoilClasses: AlgeriaSoilClass[];
  idealPhRange: [number, number];
  maxSalinityECe: number;
  waterDemandM3Ha: number;
  potentialYieldTonsHa: number;
  nationalStrategyImportance: { en: string; ar: string; fr: string };
}

export const ALGERIA_CROP_SUITABILITY_RULES: CropSuitabilityRule[] = [
  {
    cropId: 'wheat_durum',
    cropName: { en: 'Durum Wheat (Blé Dur)', ar: 'القمح الصلب', fr: 'Blé dur' },
    emoji: '🌾',
    category: 'cereals',
    optimalZone: 'high_plateaus',
    favorableZones: ['tell_coastal', 'deep_sahara'],
    marginalZones: ['sahara_oasis', 'mountains'],
    unsuitableZones: [],
    idealSoilClasses: ['calcisol', 'vertisol', 'fluvisol', 'cambisol'],
    idealPhRange: [7.0, 8.3],
    maxSalinityECe: 6.0,
    waterDemandM3Ha: 4500,
    potentialYieldTonsHa: 6.5,
    nationalStrategyImportance: {
      en: 'Top strategic food security crop in Algeria. High plateaus provide ideal grain vitreousness and high protein content.',
      ar: 'المحصول الاستراتيجي الأول للأمن الغذائي بالجزائر. تمنح الهضاب العليا زجاجية ممتازة ونسبة بروتين مرتفعة.',
      fr: 'Culture stratégique n°1 de sécurité alimentaire. Les hauts plateaux confèrent une vitrosité et un taux de protéines optimaux.',
    },
  },
  {
    cropId: 'potato',
    cropName: { en: 'Potato (Pomme de Terre)', ar: 'البطاطا', fr: 'Pomme de terre' },
    emoji: '🥔',
    category: 'pivot_potato',
    optimalZone: 'sahara_oasis',
    favorableZones: ['tell_coastal', 'high_plateaus', 'deep_sahara'],
    marginalZones: ['mountains'],
    unsuitableZones: [],
    idealSoilClasses: ['arenosol', 'fluvisol', 'cambisol', 'calcisol'],
    idealPhRange: [6.0, 7.8],
    maxSalinityECe: 2.5,
    waterDemandM3Ha: 5500,
    potentialYieldTonsHa: 42.0,
    nationalStrategyImportance: {
      en: 'Major national staple with 2-3 harvest seasons per year. Desert pivot farming in El Oued and Biskra provides counter-season supply.',
      ar: 'محصول غذائي أساسي ينتج على دورتين إلى ثلاث سنوياً. زراعة الري المحوري بوادي سوف وبسكرة تضمن وفرة السوق في الشتاء.',
      fr: 'Aliment de base majeur. Les pivots sahariens d’El Oued et Biskra assurent l’approvisionnement précoce d’hiver.',
    },
  },
  {
    cropId: 'tomato_greenhouse',
    cropName: { en: 'Protected Primeur Tomato', ar: 'طماطم البيوت البلاستيكية', fr: 'Tomate primeur sous serre' },
    emoji: '🍅',
    category: 'greenhouses',
    optimalZone: 'sahara_oasis',
    favorableZones: ['tell_coastal'],
    marginalZones: ['deep_sahara', 'high_plateaus'],
    unsuitableZones: ['mountains'],
    idealSoilClasses: ['arenosol', 'fluvisol', 'calcisol'],
    idealPhRange: [6.5, 7.8],
    maxSalinityECe: 3.5,
    waterDemandM3Ha: 7200,
    potentialYieldTonsHa: 110.0,
    nationalStrategyImportance: {
      en: 'Massive economic motor in Biskra (Ziban) with high early-market export potential and winter domestic self-sufficiency.',
      ar: 'محرك اقتصادي ضخم بمنطقة الزيبان وبسكرة، يضمن الاكتفاء الذاتي الشتوي وتصدير البواكير.',
      fr: 'Moteur économique majeur à Biskra, garantissant l’autosuffisance hivernale et un fort potentiel export.',
    },
  },
  {
    cropId: 'date_palm',
    cropName: { en: 'Deglet Nour Date Palm', ar: 'نخيل دقلة نور', fr: 'Palmier Dattier Deglet Nour' },
    emoji: '🌴',
    category: 'date_palms',
    optimalZone: 'sahara_oasis',
    favorableZones: ['deep_sahara'],
    marginalZones: [],
    unsuitableZones: ['tell_coastal', 'high_plateaus', 'mountains'],
    idealSoilClasses: ['arenosol', 'solonchak', 'fluvisol'],
    idealPhRange: [7.2, 8.5],
    maxSalinityECe: 8.0,
    waterDemandM3Ha: 14000,
    potentialYieldTonsHa: 12.0,
    nationalStrategyImportance: {
      en: 'Algeria’s premier agricultural export commodity, celebrated globally for its translucent golden amber color and high honeyed sweetness.',
      ar: 'أهم محصول زراعي تصديري للجزائر، مشهور عالمياً بلونه العنبري الشفاف وطعمه العسلي الفريد.',
      fr: 'Premier produit agricole d’exportation d’Algérie, réputé mondialement pour sa robe ambrée translucide et sa finesse.',
    },
  },
  {
    cropId: 'citrus',
    cropName: { en: 'Citrus & Clementines', ar: 'الحمضيات والكليمونتين', fr: 'Agrumes & Clémentines' },
    emoji: '🍊',
    category: 'citrus',
    optimalZone: 'tell_coastal',
    favorableZones: ['sahara_oasis', 'deep_sahara'],
    marginalZones: ['high_plateaus'],
    unsuitableZones: ['mountains'],
    idealSoilClasses: ['vertisol', 'fluvisol', 'cambisol', 'arenosol'],
    idealPhRange: [6.5, 7.8],
    maxSalinityECe: 2.0,
    waterDemandM3Ha: 8000,
    potentialYieldTonsHa: 38.0,
    nationalStrategyImportance: {
      en: 'Historic specialty of Mitidja and Chéliff plains, expanding into sunny Saharan oases (El Menia, Biskra) with sweet juice quality.',
      ar: 'تخصص تاريخي لسهول متيجة والشلف، ويتوسع بنجاح في الواحات الصحراوية المشمسة (المنيعة، بسكرة) بجودة عصير وسكر عالية.',
      fr: 'Spécialité historique de la Mitidja et du Chéliff, en pleine expansion dans le Sud (El Goléa) avec une excellente teneur en jus.',
    },
  },
  {
    cropId: 'olive',
    cropName: { en: 'Olive Tree (Oil & Table)', ar: 'أشجار الزيتون (زيت ومائدة)', fr: 'Olivier (Huile & Table)' },
    emoji: '🫒',
    category: 'olives',
    optimalZone: 'mountains',
    favorableZones: ['tell_coastal', 'high_plateaus', 'sahara_oasis'],
    marginalZones: ['deep_sahara'],
    unsuitableZones: [],
    idealSoilClasses: ['luvisol', 'calcisol', 'cambisol', 'vertisol'],
    idealPhRange: [6.5, 8.4],
    maxSalinityECe: 5.0,
    waterDemandM3Ha: 3500,
    potentialYieldTonsHa: 6.0,
    nationalStrategyImportance: {
      en: 'Core heritage crop with over 500,000 hectares across Kabylie, Mascara, Médéa, and expanding across high plateaus and steppes.',
      ar: 'محصول تراثي عريق يغطي أكثر من 500 ألف هكتار في القبائل ومعسكر والمدية، ويمتد بقوة عبر الهضاب العليا والسهوب.',
      fr: 'Culture patrimoniale couvrant plus de 500 000 ha en Kabylie, Mascara, Médéa et en forte expansion sur les hauts plateaux.',
    },
  },
  {
    cropId: 'corn_grain',
    cropName: { en: 'Grain Corn & Silage', ar: 'الذرة الحبوبية والعلفية', fr: 'Maïs grain & Ensilage' },
    emoji: '🌽',
    category: 'cereals',
    optimalZone: 'deep_sahara',
    favorableZones: ['sahara_oasis', 'tell_coastal'],
    marginalZones: ['high_plateaus'],
    unsuitableZones: ['mountains'],
    idealSoilClasses: ['arenosol', 'fluvisol', 'vertisol'],
    idealPhRange: [6.5, 7.9],
    maxSalinityECe: 3.0,
    waterDemandM3Ha: 9500,
    potentialYieldTonsHa: 9.0,
    nationalStrategyImportance: {
      en: 'Crucial crop to substitute animal feed imports (poultry and dairy feed) through mega-pivots in Adrar, Timimoun, and El Menia.',
      ar: 'محصول حاسم لتعويض واردات أعلاف الدواجن والمواشي عبر أقطاب الري المحوري في أدرار وتيميمون والمنيعة.',
      fr: 'Enjeu stratégique pour réduire les importations d’aliments du bétail via les grands pivots d’Adrar et d’El Menia.',
    },
  },
];

// Re-export full 58-wilaya dataset and projection helper
export { ALL_58_WILAYAS, projectCoordinates, type WilayaDataFull } from './algeria-wilayas-58';

