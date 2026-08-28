/**
 * Algerian & Mediterranean Crop Phenology Database
 * Complete stage-by-stage phenological models synchronized with:
 *  - FAO-56 Crop Water Coefficients (Kc) & Regional Water Demands
 *  - Stage-specific N-P-K-Ca-Mg & Micronutrient Fertigation Recipes
 *  - Timed Phytosanitary Scouting & Critical Cultural Operations
 */

export interface PhenologyLocalizedText {
  en: string;
  fr: string;
  ar: string;
}

export interface PhenologyTask {
  id: string;
  title: PhenologyLocalizedText;
  type: 'irrigation' | 'fertigation' | 'scouting' | 'protection' | 'canopy' | 'soil_work' | 'harvest';
  priority: 'critical' | 'high' | 'standard';
  timingDay: number; // Day in season
  details: PhenologyLocalizedText;
}

export interface PhenologyRiskAlert {
  title: PhenologyLocalizedText;
  severity: 'danger' | 'warning' | 'info';
  description: PhenologyLocalizedText;
}

export interface PhenologyStage {
  id: string;
  name: PhenologyLocalizedText;
  bbchScale: string;
  emoji: string;
  startDay: number;
  endDay: number;
  kc: number; // FAO-56 midpoint crop coefficient
  gddAccumulated: number; // Growing Degree Days target (°C·d)
  description: PhenologyLocalizedText;
  colorScheme: {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    accentHex: string;
  };
  irrigation: {
    waterDemandMmPerDay: {
      coastal: number;
      plateaus: number;
      sahara: number;
    };
    irrigationIntervalDays: number;
    stressSensitivity: 'critical' | 'high' | 'moderate' | 'low';
    depletionThresholdP: number; // FAO-56 p factor
    rootDepthCm: number;
    tacticalGuidance: PhenologyLocalizedText;
  };
  nutrients: {
    stageTotalsKgHa: {
      n: number;
      p: number;
      k: number;
      ca?: number;
      mg?: number;
      s?: number;
    };
    pctOfSeasonalTotal: {
      n: number;
      p: number;
      k: number;
    };
    recommendedFormulas: string[];
    applicationMethod: 'fertigation' | 'side_dress' | 'foliar' | 'basal_incorporation';
    tacticalGuidance: PhenologyLocalizedText;
  };
  tasks: PhenologyTask[];
  riskAlerts: PhenologyRiskAlert[];
}

export interface PhenologyCrop {
  id: string;
  name: PhenologyLocalizedText;
  scientificName: string;
  emoji: string;
  category: 'cereal' | 'vegetable' | 'orchard' | 'perennial' | 'legume' | 'industrial';
  seasonLengthDays: number;
  typicalSowingMonths: {
    coastal: number[];
    plateaus: number[];
    sahara: number[];
  };
  faoReference: string;
  stages: PhenologyStage[];
  seasonalNutrientTotalsKgHa: {
    n: number;
    p: number;
    k: number;
    ca?: number;
    mg?: number;
  };
  overview: PhenologyLocalizedText;
}

export const PHENOLOGY_CROPS: PhenologyCrop[] = [
  // --------------------------------------------------------------------------
  // 1. DURUM WHEAT (BLÉ DUR)
  // --------------------------------------------------------------------------
  {
    id: 'durum-wheat',
    name: {
      en: 'Durum Wheat (Blé Dur)',
      fr: 'Blé Dur',
      ar: 'القمح الصلب',
    },
    scientificName: 'Triticum durum L.',
    emoji: '🌾',
    category: 'cereal',
    seasonLengthDays: 160,
    typicalSowingMonths: {
      coastal: [11, 12],
      plateaus: [10, 11, 12],
      sahara: [11, 12],
    },
    faoReference: 'FAO-56 Irrigation and Drainage Paper No. 56 (Wheat Kc curve)',
    seasonalNutrientTotalsKgHa: { n: 160, p: 70, k: 90, ca: 15, mg: 15 },
    overview: {
      en: 'Strategic staple cereal across Algeria. High moisture sensitivity at Heading/Flowering and critical grain filling stages.',
      fr: 'Céréale stratégique majeure en Algérie. Forte sensibilité hydrique à l’épiaison/floraison et au remplissage.',
      ar: 'المحصول الاستراتيجي الأول في الجزائر. حساسية مائية قصوى أثناء مرحلتي طرد السنابل والإزهار وامتلاء الحبوب.',
    },
    stages: [
      {
        id: 'w-emergence',
        name: { en: 'Germination & Emergence', fr: 'Germination & Levée', ar: 'الإنبات والظهور' },
        bbchScale: 'BBCH 00–13',
        emoji: '🌱',
        startDay: 1,
        endDay: 20,
        kc: 0.35,
        gddAccumulated: 180,
        description: {
          en: 'Coleoptile emergence, primary root system establishment up to 3-leaf stage.',
          fr: 'Émergence du coléoptile et mise en place du système racinaire jusqu’au stade 3 feuilles.',
          ar: 'ظهور الغمد الورقي وتأسيس المجموع الجذري الأولي حتى مرحلة 3 ورقات.',
        },
        colorScheme: {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40',
          border: 'border-emerald-300 dark:border-emerald-800',
          text: 'text-emerald-900 dark:text-emerald-200',
          badgeBg: 'bg-emerald-600',
          accentHex: '#059669',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 1.2, plateaus: 1.0, sahara: 2.2 },
          irrigationIntervalDays: 7,
          stressSensitivity: 'moderate',
          depletionThresholdP: 0.55,
          rootDepthCm: 25,
          tacticalGuidance: {
            en: 'Ensure seedbed has sufficient starting moisture. In arid zones, apply auxiliary emergence watering (25–30 mm).',
            fr: 'Assurer une humidité adéquate du lit de semences. En zone aride, apporter une irrigation de levée (25–30 mm).',
            ar: 'تأمين رطوبة مهد البذرة. في المناطق الجافة، تقديم رية إنبات تكميلية (25-30 ملم).',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 30, p: 70, k: 40 },
          pctOfSeasonalTotal: { n: 20, p: 100, k: 45 },
          recommendedFormulas: ['DAP 18-46-0 (150 kg/ha)', 'Potassium Sulfate 0-0-50 (80 kg/ha)'],
          applicationMethod: 'basal_incorporation',
          tacticalGuidance: {
            en: 'Apply all Phosphorus (DAP) and starter Potassium banded or incorporated pre-sowing.',
            fr: 'Apporter la totalité du Phosphore (DAP) et le Potassium de fond enfouis avant le semis.',
            ar: 'تقديم كامل الفوسفور (DAP) وبوتاسيوم القاعدة ودمجهما قبل البذر لتشجيع تجذير قوي.',
          },
        },
        tasks: [
          {
            id: 'task-w-1',
            title: { en: 'Seedbed Emergence Count', fr: 'Contrôle de densité de levée', ar: 'مراقبة كثافة الإنبات' },
            type: 'scouting',
            priority: 'high',
            timingDay: 15,
            details: {
              en: 'Target 300–350 seedlings/m² for durum wheat; inspect for slug and wireworm damage.',
              fr: 'Cibler 300 à 350 pieds levés/m² ; surveiller les attaques de taupins et limaces.',
              ar: 'استهداف كثافة 300 إلى 350 نبتة/م² والتأكد من خلو الحقل من الديدان السلكية والحلزون.',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Crusting Risk in Clay Soils', fr: 'Risque de battance sur sols argileux', ar: 'خطر تشكل القشرة الصلبة' },
            severity: 'warning',
            description: {
              en: 'Heavy autumn rain followed by sunshine can create a crust blocking seedling emergence.',
              fr: 'De fortes pluies suivies d’ensoleillement peuvent former une croûte gênant la levée.',
              ar: 'الأمطار الغزيرة المتبوعة بالشمس قد تشكل قشرة صلبة تعيق بزوغ البادرات.',
            },
          },
        ],
      },
      {
        id: 'w-tillering',
        name: { en: 'Tillering (Tallage)', fr: 'Tallage', ar: 'التفريع (الإشطاء)' },
        bbchScale: 'BBCH 21–29',
        emoji: '🌿',
        startDay: 21,
        endDay: 65,
        kc: 0.70,
        gddAccumulated: 450,
        description: {
          en: 'Formation of secondary crown roots and multiple productive tillers per plant.',
          fr: 'Formation des talles et développement du réseau racinaire fasciculé adventif.',
          ar: 'تكوين الإشطاءات (الفروع القاعدية) ونمو المجموع الجذري التاجي الثانوي.',
        },
        colorScheme: {
          bg: 'bg-teal-50 dark:bg-teal-950/40',
          border: 'border-teal-300 dark:border-teal-800',
          text: 'text-teal-900 dark:text-teal-200',
          badgeBg: 'bg-teal-600',
          accentHex: '#0d9488',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 2.0, plateaus: 1.8, sahara: 3.5 },
          irrigationIntervalDays: 10,
          stressSensitivity: 'moderate',
          depletionThresholdP: 0.55,
          rootDepthCm: 50,
          tacticalGuidance: {
            en: 'Mild cold winter suppresses water demand in the North; in southern pivot irrigation, maintain 65% soil capacity.',
            fr: 'Les pluies hivernales couvrent généralement les besoins au Nord ; sous pivot au Sud, maintenir 65% de la réserve utile.',
            ar: 'تغطي الأمطار الشتوية الاحتياجات في الشمال؛ وتحت المحاور بالجنوب يحافظ على 65% من السعة الحقلية.',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 55, p: 0, k: 0 },
          pctOfSeasonalTotal: { n: 35, p: 0, k: 0 },
          recommendedFormulas: ['Urea 46% (120 kg/ha) or Ammonium Nitrate 33.5% (165 kg/ha)'],
          applicationMethod: 'side_dress',
          tacticalGuidance: {
            en: 'First major Nitrogen top-dress at full tillering (Zadoks 25) right before expected rain or pivot run.',
            fr: 'Premier apport d’azote de couverture au plein tallage (Zadoks 25) juste avant pluie ou passage de pivot.',
            ar: 'الدفعة الأولى من النيتروجين في مرحلة ذروة التفريع (Zadoks 25) قبل الري أو المطر مباشرة.',
          },
        },
        tasks: [
          {
            id: 'task-w-2',
            title: { en: 'Post-Emergence Herbicide Treatment', fr: 'Désherbage de post-levée', ar: 'مكافحة الأعشاب الضارة' },
            type: 'protection',
            priority: 'critical',
            timingDay: 45,
            details: {
              en: 'Target broadleaf weeds (Sinapis, Papaver) and wild oats before jointing stage.',
              fr: 'Traiter les dicotylédones (Moutarde, Coquelicot) et folle-avoine avant le stade montaison.',
              ar: 'معالجة الأعشاب عريضة الأوراق (الخردل، شقائق النعمان) والرويد قبل بدء الاستطالة.',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Winter Frost on High Plateaus', fr: 'Gelées hivernales sur les Hauts Plateaux', ar: 'الصقيع الشتوي في الهضاب العليا' },
            severity: 'warning',
            description: {
              en: 'Sétif/Batna freeze events down to -6°C. Avoid N fertilization right before severe cold snaps.',
              fr: 'Gelées à Sétif/Batna jusqu’à -6°C. Éviter d’épandre l’azote juste avant une vague de gel intense.',
              ar: 'انخفاض درجات الحرارة في سطيف وباتنة إلى -6° مئوية. تجنب التسميد النيتروجيني قبل موجات الصقيع.',
            },
          },
        ],
      },
      {
        id: 'w-stem-elongation',
        name: { en: 'Stem Elongation (Montaison)', fr: 'Montaison', ar: 'الاستطالة (العقد)' },
        bbchScale: 'BBCH 30–39',
        emoji: '🌾',
        startDay: 66,
        endDay: 105,
        kc: 1.15,
        gddAccumulated: 850,
        description: {
          en: 'First node detection to flag leaf fully unrolled. Rapid biomass expansion and spikelet differentiation.',
          fr: 'Du stade 1er nœud jusqu’au déploiement de la feuille étendard. Différenciation des épillets.',
          ar: 'من مرحلة العقدة الأولى حتى ظهور ورقة الراية. تمايز السنيبلات وزيادة سريعة في الكتلة الحيوية.',
        },
        colorScheme: {
          bg: 'bg-amber-50 dark:bg-amber-950/40',
          border: 'border-amber-300 dark:border-amber-800',
          text: 'text-amber-900 dark:text-amber-200',
          badgeBg: 'bg-amber-600',
          accentHex: '#d97706',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 3.8, plateaus: 3.5, sahara: 6.2 },
          irrigationIntervalDays: 5,
          stressSensitivity: 'high',
          depletionThresholdP: 0.50,
          rootDepthCm: 90,
          tacticalGuidance: {
            en: 'Water stress here directly reduces the number of grains per spike. Supplemental irrigation is highly profitable.',
            fr: 'Tout stress hydrique à ce stade réduit directement le nombre d’épillets fertiles par épi.',
            ar: 'أي إجهاد مائي هنا يقلل مباشرة من عدد الحبوب في السنبلة. الري التكميلي ضروري للغاية.',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 60, p: 0, k: 50 },
          pctOfSeasonalTotal: { n: 40, p: 0, k: 55 },
          recommendedFormulas: ['Ammonium Nitrate 33.5% (180 kg/ha)', 'Potassium Nitrate foliar (3 kg/ha)'],
          applicationMethod: 'side_dress',
          tacticalGuidance: {
            en: 'Second N application at 1st-2nd node (Zadoks 31–32) for spikelet fertility and grain protein.',
            fr: 'Deuxième apport d’azote au stade 1-2 nœuds (Zadoks 31–32) pour le nombre de grains et le taux de protéines.',
            ar: 'الدفعة الثانية من النيتروجين عند العقدة الأولى والثانية (Zadoks 31–32) لرفع خصوبة السنابل ونسبة البروتين.',
          },
        },
        tasks: [
          {
            id: 'task-w-3',
            title: { en: 'Scout for Septoria & Yellow Rust', fr: 'Surveillance Septoriose et Rouille Jaune', ar: 'فحص التبقع السبتوري والصدأ الأصفر' },
            type: 'scouting',
            priority: 'critical',
            timingDay: 85,
            details: {
              en: 'Check bottom 3 leaves for Septoria tritici lesions after humid warm spring rain events.',
              fr: 'Inspecter les 3 dernières feuilles pour détecter la septoriose après les pluies tièdes de printemps.',
              ar: 'فحص الأوراق السفلية لكشف بقع السبتوريا والصدأ بعد الأمطار الربيعية الرطبة.',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Septoria Leaf Blight Risk', fr: 'Alerte Septoriose Foliaire', ar: 'خطر لفحة السبتوريا' },
            severity: 'danger',
            description: {
              en: 'High humidity (>85%) and 15–20°C temperatures trigger explosive spore spreading.',
              fr: 'Une humidité >85% et 15–20°C déclenchent une propagation rapide des spores.',
              ar: 'الرطوبة العالية (>85%) مع درجات حرارة 15-20°م تؤدي لانتشار وبائي لأبواغ السبتوريا.',
            },
          },
        ],
      },
      {
        id: 'w-heading-flowering',
        name: { en: 'Heading & Flowering (Épiaison/Floraison)', fr: 'Épiaison & Floraison', ar: 'طرد السنابل والإزهار' },
        bbchScale: 'BBCH 51–69',
        emoji: '🌸',
        startDay: 106,
        endDay: 125,
        kc: 1.25,
        gddAccumulated: 1200,
        description: {
          en: 'Spike completely emerged from flag leaf sheath; yellow anthers visible. Peak transpiration rate.',
          fr: 'Sortie complète de l’épi et anthèse (visibilité des étamines). Transpiration maximale.',
          ar: 'خروج السنبلة بالكامل وتفتح المتوك (الإزهار والتلقيح). ذروة استهلاك المياه والنتح.',
        },
        colorScheme: {
          bg: 'bg-rose-50 dark:bg-rose-950/40',
          border: 'border-rose-300 dark:border-rose-800',
          text: 'text-rose-900 dark:text-rose-200',
          badgeBg: 'bg-rose-600',
          accentHex: '#e11d48',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 4.8, plateaus: 4.5, sahara: 7.8 },
          irrigationIntervalDays: 4,
          stressSensitivity: 'critical',
          depletionThresholdP: 0.45,
          rootDepthCm: 110,
          tacticalGuidance: {
            en: 'ZERO drought tolerance. Drought or Sirocco (Chergui) during anthesis causes sterile florets and massive yield collapse.',
            fr: 'Tolérance au stress hydrique NULLE. Le manque d’eau ou le sirocco pendant l’anthèse provoque la coulure.',
            ar: 'تسامح معدوم مع العطش. أي جفاف أو رياح سيروكو (الشهيلي) أثناء الإزهار يسبب عقم الأزهار وفقدان المحصول.',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 15, p: 0, k: 0 },
          pctOfSeasonalTotal: { n: 5, p: 0, k: 0 },
          recommendedFormulas: ['Foliar Urea 2% + Micronutrients (Zn, B) (5 kg/ha)'],
          applicationMethod: 'foliar',
          tacticalGuidance: {
            en: 'Light foliar N + Zinc spray if high protein grain is targeted for couscous and pasta manufacturing.',
            fr: 'Pulvérisation foliaire légère d’urée (2%) + Zinc pour maximiser la vitrosité et les protéines.',
            ar: 'رش ورقي خفيف باليوريا (2%) والزنك لرفع نسبة الزجاجية والبروتين لصناعة السميد والعجائن.',
          },
        },
        tasks: [
          {
            id: 'task-w-4',
            title: { en: 'Sirocco & Fusarium Head Blight Watch', fr: 'Vigilance Sirocco & Fusariose de l’épi', ar: 'مراقبة رياح الشهيلي ولفحة السنابل الفيوزاريمية' },
            type: 'protection',
            priority: 'critical',
            timingDay: 115,
            details: {
              en: 'If wet conditions during flowering, apply targeted triazole fungicide to protect against Fusarium head blight.',
              fr: 'En cas de temps pluvieux à la floraison, traiter contre la fusariose des épis pour éviter les mycotoxines.',
              ar: 'في حال تزامن الإزهار مع أمطار رطبة، استخدام مبيد تريازول وقائي ضد الفيوزاريوم لمنع السموم الفطرية.',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Sirocco (Hot Desert Wind) Thermal Shock', fr: 'Choc thermique du Sirocco (Chergui)', ar: 'الصدمة الحرارية لرياح الشهيلي' },
            severity: 'danger',
            description: {
              en: 'Sudden temperatures >32°C with low humidity abort pollen tube germination. Irrigate proactively.',
              fr: 'Des températures >32°C accompagnées de vent sec avortent le pollen. Irriguer par anticipation.',
              ar: 'درجات حرارة تفوق 32°م مع جفاف شديد تجهض حبوب اللقاح. ينصح بالري المسبق لتبريد المحيط النباتي.',
            },
          },
        ],
      },
      {
        id: 'w-grain-fill',
        name: { en: 'Grain Fill (Remplissage du grain)', fr: 'Remplissage du grain', ar: 'امتلاء الحبوب' },
        bbchScale: 'BBCH 71–87',
        emoji: '🌾',
        startDay: 126,
        endDay: 150,
        kc: 0.85,
        gddAccumulated: 1600,
        description: {
          en: 'Milk stage to soft dough and hard dough. Starch and protein deposition into the kernel.',
          fr: 'Stade laiteux puis pâteux. Migration des réserves glucidiques et protéiques vers le grain.',
          ar: 'المرحلة اللبنية ثم العجينية الطرية والصلبة. ترسب النشا والبروتين داخل الحبة.',
        },
        colorScheme: {
          bg: 'bg-yellow-50 dark:bg-yellow-950/40',
          border: 'border-yellow-300 dark:border-yellow-800',
          text: 'text-yellow-900 dark:text-yellow-200',
          badgeBg: 'bg-yellow-600',
          accentHex: '#ca8a04',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 3.2, plateaus: 3.0, sahara: 5.5 },
          irrigationIntervalDays: 6,
          stressSensitivity: 'high',
          depletionThresholdP: 0.60,
          rootDepthCm: 120,
          tacticalGuidance: {
            en: 'Water stress causes premature "échaudage" (shriveled grain with low thousand-kernel weight). Final watering at milky stage.',
            fr: 'Un arrêt trop précoce des irrigations provoque l’échaudage (grains ridés à faible PMG). Dernière eau au stade laiteux.',
            ar: 'انقطاع المياه المبكر يسبب الضمور (الحبوب المجعدة خفيفة الوزن). تقديم آخر رية عند الطور اللبني.',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 0, p: 0, k: 0 },
          pctOfSeasonalTotal: { n: 0, p: 0, k: 0 },
          recommendedFormulas: ['No soil fertilizer; translocation from vegetative tissue occurs naturally'],
          applicationMethod: 'foliar',
          tacticalGuidance: {
            en: 'No additional soil fertilizers. Plant mobilizes stem carbohydrates to grain.',
            fr: 'Aucun engrais supplémentaire. La plante mobilise les glucides de la tige vers le grain.',
            ar: 'توقف كامل عن التسميد الأرضي. النبتة تحول مخزون الساق والأوراق نحو الحبوب.',
          },
        },
        tasks: [
          {
            id: 'task-w-5',
            title: { en: 'Suni Bug (Punaise des céréales) Sampling', fr: 'Dépistage des punaises des céréales (Eurygaster)', ar: 'مراقبة حشرة السونة (بق الحبوب)' },
            type: 'scouting',
            priority: 'high',
            timingDay: 135,
            details: {
              en: 'Sample for Eurygaster integriceps feeding on milky grains which degrades gluten baking quality.',
              fr: 'Vérifier la présence d’Eurygaster qui injecte des enzymes protéolytiques dégradant le gluten.',
              ar: 'فحص الحقل للكشف عن حشرة السونة التي تفرز إنزيمات تدمر الغلوتين وصلاحية الطحين.',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Grain Shriveling (Échaudage) Risk', fr: 'Risque d’Échaudage', ar: 'خطر ضمور الحبوب (الشياط)' },
            severity: 'warning',
            description: {
              en: 'Late spring heatwaves (>35°C) halt starch synthase enzyme, locking in small grain size.',
              fr: 'Les vagues de chaleur de fin de printemps (>35°C) stoppent la synthèse d’amidon.',
              ar: 'الموجات الحارة المتأخرة (>35°م) توقف إنزيم تصنيع النشا مما يؤدي لصغر حجم الحبات.',
            },
          },
        ],
      },
      {
        id: 'w-maturation-harvest',
        name: { en: 'Maturation & Harvest (Maturation & Moisson)', fr: 'Maturation & Moisson', ar: 'النضج والحصاد' },
        bbchScale: 'BBCH 89–92',
        emoji: '🚜',
        startDay: 151,
        endDay: 160,
        kc: 0.25,
        gddAccumulated: 1850,
        description: {
          en: 'Complete desiccation of straw and grain down to harvest moisture (<13%).',
          fr: 'Dessèchement complet de la paille et du grain jusqu’au taux d’humidité de récolte (<13%).',
          ar: 'جفاف كامل للقش والحبوب حتى الوصول لنسبة رطوبة الحصاد الآمنة (أقل من 13%).',
        },
        colorScheme: {
          bg: 'bg-orange-50 dark:bg-orange-950/40',
          border: 'border-orange-300 dark:border-orange-800',
          text: 'text-orange-900 dark:text-orange-200',
          badgeBg: 'bg-orange-600',
          accentHex: '#ea580c',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 0, plateaus: 0, sahara: 0 },
          irrigationIntervalDays: 0,
          stressSensitivity: 'low',
          depletionThresholdP: 0.80,
          rootDepthCm: 120,
          tacticalGuidance: {
            en: 'Irrigation completely stopped 15–20 days prior to combine entry to allow soil bearing capacity.',
            fr: 'Arrêt total de l’irrigation 15–20 jours avant pour assurer la portance des moissonneuses-batteuses.',
            ar: 'توقف تام عن الري قبل الحصاد بـ 15-20 يوماً لضمان صلابة الأرض لدخول الحصادات.',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 0, p: 0, k: 0 },
          pctOfSeasonalTotal: { n: 0, p: 0, k: 0 },
          recommendedFormulas: ['None'],
          applicationMethod: 'basal_incorporation',
          tacticalGuidance: {
            en: 'Post-harvest soil analysis recommended to measure residual mineral nitrogen and phosphorus for next crop.',
            fr: 'Analyse de sol post-récolte conseillée pour quantifier l’azote résiduel avant la rotation.',
            ar: 'يوصى بتحليل التربة بعد الحصاد لقياس النيتروجين المعدني المتبقي قبل المحصول اللاحق.',
          },
        },
        tasks: [
          {
            id: 'task-w-6',
            title: { en: 'Combine Harvester Calibration & Moisture Test', fr: 'Calibrage de la moissonneuse et test d’humidité', ar: 'معايرة الحصادة واختبار رطوبة الحبوب' },
            type: 'harvest',
            priority: 'critical',
            timingDay: 155,
            details: {
              en: 'Measure grain moisture (<13% for silo storage). Adjust drum speed and concave clearance to minimize broken kernels.',
              fr: 'Mesurer l’humidité (<13% pour stockage). Régler batteur et contre-batteur pour éviter les grains cassés.',
              ar: 'قياس رطوبة الحبوب (أقل من 13% للتخزين بالصوامع) وضبط السرعة لتقليل تكسير الحبوب.',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Grain Shattering & Wildfire Risk', fr: 'Risque d’Égrenage et Feux de Récolte', ar: 'خطر انفراط الحبوب وحرائق المحاصيل' },
            severity: 'danger',
            description: {
              en: 'Extreme dry heat increases grain shattering in high winds. Maintain fire breaks and water tanker near combines.',
              fr: 'Chaleur extrême favorisant l’égrenage au vent et risques d’incendie. Prévoir citernes anti-feu.',
              ar: 'الحر الشديد يزيد انفراط الحبوب مع الرياح وخطر الحرائق. يجب توفير صهريج مياه مرافق للحصاد.',
            },
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------------------------
  // 2. POTATO (POMME DE TERRE)
  // --------------------------------------------------------------------------
  {
    id: 'potato',
    name: {
      en: 'Potato (Pomme de terre)',
      fr: 'Pomme de terre',
      ar: 'البطاطا',
    },
    scientificName: 'Solanum tuberosum L.',
    emoji: '🥔',
    category: 'vegetable',
    seasonLengthDays: 115,
    typicalSowingMonths: {
      coastal: [1, 2, 8, 9], // Primeur / Arrière-saison
      plateaus: [3, 4, 5],
      sahara: [10, 11], // Wadi Souf winter crop
    },
    faoReference: 'FAO-56 Irrigation Paper No. 56 (Potato Kc curve)',
    seasonalNutrientTotalsKgHa: { n: 190, p: 90, k: 240, ca: 60, mg: 30 },
    overview: {
      en: 'Major cash and food security crop in Algeria (Wadi Souf, Ain Defla, Mostaganem, Mascara). Very sensitive to soil moisture fluctuations and Late Blight.',
      fr: 'Culture maraîchère majeure en Algérie (Oued Souf, Aïn Defla, Mostaganem, Mascara). Forte sensibilité à la régularité hydrique et au mildiou.',
      ar: 'محصول استراتيجي هام في الجزائر (وادي سوف، عين الدفلى، مستغانم، معسكر). شديد الحساسية لانتظام الري ومرض اللفحة المتأخرة (الميلديو).',
    },
    stages: [
      {
        id: 'p-sprouting',
        name: { en: 'Sprouting & Emergence', fr: 'Levée & Émergence', ar: 'الإنبات والانبثاق' },
        bbchScale: 'BBCH 00–19',
        emoji: '🌱',
        startDay: 1,
        endDay: 25,
        kc: 0.50,
        gddAccumulated: 220,
        description: {
          en: 'Eye sprouting, root system initiation, and emergence of first vegetative stems through the ridge.',
          fr: 'Développement des germes, enracinement et percée des tiges à travers la butte.',
          ar: 'نمو العيون وتأسيس المجموع الجذري وبزوغ السيقان عبر ظهر الخط (المتن).',
        },
        colorScheme: {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40',
          border: 'border-emerald-300 dark:border-emerald-800',
          text: 'text-emerald-900 dark:text-emerald-200',
          badgeBg: 'bg-emerald-600',
          accentHex: '#059669',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 1.8, plateaus: 1.5, sahara: 3.2 },
          irrigationIntervalDays: 4,
          stressSensitivity: 'moderate',
          depletionThresholdP: 0.45,
          rootDepthCm: 30,
          tacticalGuidance: {
            en: 'Maintain light, frequent water applications. Avoid waterlogging which rots seed tubers (Rhizoctonia/Erwinia).',
            fr: 'Apports légers et fréquents. Éviter tout engorgement provoquant la pourriture du plant mère.',
            ar: 'ريات خفيفة ومتقاربة. تجنب تشبع التربة بالماء لتفادي تعفن درنات البذار (الريزوكتونيا والإروينيا).',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 40, p: 90, k: 80, ca: 60 },
          pctOfSeasonalTotal: { n: 20, p: 100, k: 33 },
          recommendedFormulas: ['DAP 18-46-0 (200 kg/ha)', 'Sulfate of Potash 0-0-50 (160 kg/ha)', 'Gypsum (200 kg/ha)'],
          applicationMethod: 'basal_incorporation',
          tacticalGuidance: {
            en: 'Apply full Phosphorus, 33% Potassium, and Calcium pre-planting inside the ridge bed.',
            fr: 'Enfouir tout le Phosphore, 33% du Potassium et du Calcium de fond dans le billon au planting.',
            ar: 'وضع كامل الفوسفور وثلث البوتاسيوم والكالسيوم داخل الخطوط أثناء الغرس.',
          },
        },
        tasks: [
          {
            id: 'task-p-1',
            title: { en: 'Check Emergence Uniformity & Hilling (Buttage)', fr: 'Contrôle de levée et Premier Buttage', ar: 'مراقبة تجانس الإنبات والتحضين الأول' },
            type: 'canopy',
            priority: 'high',
            timingDay: 22,
            details: {
              en: 'Perform first ridge reshaping (hilling) to cover young stems and suppress early weed flushes.',
              fr: 'Effectuer le premier buttage pour recouvrir la base des tiges et détruire les mauvaises herbes.',
              ar: 'إجراء عملية التحضين (الردم) الأولى لتغطية قواعد السيقان ومكافحة الأعشاب الفتية.',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Rhizoctonia Stem Canker Risk', fr: 'Risque de Rhizoctone brun', ar: 'خطر تقرح الساق الريزوكتوني' },
            severity: 'warning',
            description: {
              en: 'Cold wet soil delays sprouting and allows Rhizoctonia solani to girdle emerging shoots.',
              fr: 'Un sol froid et saturé favorise les attaques de Rhizoctone sur les germes.',
              ar: 'التربة الباردة والرطبة تؤخر الإنبات وتساعد فطر الريزوكتونيا على خنق البادرات.',
            },
          },
        ],
      },
      {
        id: 'p-vegetative',
        name: { en: 'Vegetative Canopy & Tuber Initiation', fr: 'Croissance Végétative & Initiation des Tubercules', ar: 'النمو الخضري وبدء تشكل الدرنات' },
        bbchScale: 'BBCH 20–49',
        emoji: '🌿',
        startDay: 26,
        endDay: 55,
        kc: 0.85,
        gddAccumulated: 520,
        description: {
          en: 'Stolon tips swell into baby tubers (marble size). Rapid canopy closure over the inter-row.',
          fr: 'Gonflement de l’extrémité des stolons en ébauches de tubercules et fermeture du couvert.',
          ar: 'انتفاخ أطراف المدادات وتشكل الدرنات الوليدة (بحجم حبة الحمص) مع اكتمال تغطية المجموع الخضري.',
        },
        colorScheme: {
          bg: 'bg-teal-50 dark:bg-teal-950/40',
          border: 'border-teal-300 dark:border-teal-800',
          text: 'text-teal-900 dark:text-teal-200',
          badgeBg: 'bg-teal-600',
          accentHex: '#0d9488',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 3.5, plateaus: 3.2, sahara: 5.5 },
          irrigationIntervalDays: 2,
          stressSensitivity: 'high',
          depletionThresholdP: 0.35,
          rootDepthCm: 45,
          tacticalGuidance: {
            en: 'Critical stage for tuber number per plant. Water stress here causes Common Scab and fewer tubers.',
            fr: 'Stade déterminant pour le nombre de tubercules par pied. Éviter tout à-coup d’irrigation.',
            ar: 'مرحلة حاسمة لتحديد عدد الدرنات في كل جورة. العطش هنا يسبب الجرب العادي وقلة الدرنات.',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 75, p: 0, k: 60, mg: 15 },
          pctOfSeasonalTotal: { n: 40, p: 0, k: 25 },
          recommendedFormulas: ['Ammonium Nitrate 33.5% (110 kg/ha)', 'Potassium Nitrate 13-0-46 (130 kg/ha)', 'Magnesium Sulfate (30 kg/ha)'],
          applicationMethod: 'fertigation',
          tacticalGuidance: {
            en: 'High Nitrogen split via drip or sprinkler to power canopy photosynthesis without excessive haulm elongation.',
            fr: 'Apport régulier d’azote et début de potassium via fertigation pour soutenir la photosynthèse.',
            ar: 'تغذية نيتروجينية وبوتاسية منتظمة عبر شبكة الري بالتنقيط لبناء مجموع خضري متوازن.',
          },
        },
        tasks: [
          {
            id: 'task-p-2',
            title: { en: 'Late Blight (Phytophthora) Preventive Spray', fr: 'Protection Préventive Mildiou (Phytophthora)', ar: 'الرش الوقائي ضد اللفحة المتأخرة (الميلديو)' },
            type: 'protection',
            priority: 'critical',
            timingDay: 40,
            details: {
              en: 'Apply preventive contact fungicide (copper hydroxide or mancozeb) before canopy closes completely.',
              fr: 'Appliquer un fongicide préventif avant la fermeture complète des rangs.',
              ar: 'استخدام مبيد نحاسي أو مانكوزيب وقائي قبل انغلاق خطوط النباتات وتراكم الرطوبة.',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Late Blight (Mildiou) Epidemic Warning', fr: 'Alerte Épidémique Mildiou', ar: 'إنذار بوباء اللفحة المتأخرة (الميلديو)' },
            severity: 'danger',
            description: {
              en: 'Night temperature 12–18°C + relative humidity >90% for 6 hours triggers sporulation within 4 days.',
              fr: 'Température nocturne 12–18°C avec humidité >90% déclenche une sporulation foudroyante.',
              ar: 'حرارة ليلية 12-18°م مع رطوبة تفوق 90% لعدة ساعات تؤدي لانتشار وبائي للميلديو خلال أيام.',
            },
          },
        ],
      },
      {
        id: 'p-tuber-bulking',
        name: { en: 'Tuber Bulking & Flowering', fr: 'Grossissement des Tubercules & Floraison', ar: 'تضخم الدرنات والإزهار' },
        bbchScale: 'BBCH 60–79',
        emoji: '🥔',
        startDay: 56,
        endDay: 95,
        kc: 1.15,
        gddAccumulated: 1050,
        description: {
          en: 'Peak starch accumulation into tubers. 75% of total final tuber weight is deposited during this 40-day window.',
          fr: 'Phase de remplissage intense des tubercules. 75% du rendement final se joue durant cette période.',
          ar: 'ذروة تراكم النشا وتضخم حجم الدرنات. 75% من وزن المحصول النهائي يتكون في هذه الفترة.',
        },
        colorScheme: {
          bg: 'bg-amber-50 dark:bg-amber-950/40',
          border: 'border-amber-300 dark:border-amber-800',
          text: 'text-amber-900 dark:text-amber-200',
          badgeBg: 'bg-amber-600',
          accentHex: '#d97706',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 4.8, plateaus: 4.5, sahara: 7.2 },
          irrigationIntervalDays: 2,
          stressSensitivity: 'critical',
          depletionThresholdP: 0.35,
          rootDepthCm: 60,
          tacticalGuidance: {
            en: 'Peak water consumption! Maintain soil at 75–80% available capacity. Moisture fluctuations cause second growth, knobs, and hollow heart.',
            fr: 'Pic de consommation en eau. Maintenir 75-80% de la RU. Tout à-coup entraîne cœurs creux et malformations.',
            ar: 'أعلى معدل لاستهلاك الماء! الحفاظ على رطوبة منتظمة (75-80%). التفاوت يسبب التدرن الثانوي والقلب الأجوف.',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 60, p: 0, k: 100, ca: 0 },
          pctOfSeasonalTotal: { n: 32, p: 0, k: 42 },
          recommendedFormulas: ['Potassium Nitrate 13-0-46 (220 kg/ha split weekly)', 'Calcium Nitrate (40 kg/ha foliar)'],
          applicationMethod: 'fertigation',
          tacticalGuidance: {
            en: 'Heavy Potassium fertigation. High K:N ratio (2:1) accelerates dry matter accumulation and skin resistance.',
            fr: 'Fertigation massive en Potassium (ratio K/N de 2:1) pour stimuler le calibre et la matière sèche.',
            ar: 'تسميد بوتاسي مكثف بنسبة (2:1 مقابل النيتروجين) لزيادة حجم الدرنات ونسبة المادة الجافة وتحمل التخزين.',
          },
        },
        tasks: [
          {
            id: 'task-p-3',
            title: { en: 'Scout for Tuber Moth (Phthorimaea operculella) & Green Peach Aphid', fr: 'Surveillance Teigne de la PDT et Pucerons', ar: 'مراقبة فراشة درنات البطاطا (العثة) والمن' },
            type: 'scouting',
            priority: 'critical',
            timingDay: 75,
            details: {
              en: 'Ensure ridges have no cracks exposing tubers to tuber moth egg laying. Deploy pheromone delta traps.',
              fr: 'Veiller à ce que les buttes ne présentent pas de fentes exposant les tubercules à la teigne.',
              ar: 'التأكد من عدم وجود تشققات في الخطوط تكشف الدرنات لعثة البطاطا ووضع مصائد فرمونية.',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Tuber Cracking & Secondary Growth Risk', fr: 'Risque d’Éclatement et Repousses', ar: 'خطر تشقق الدرنات والنمو الثانوي' },
            severity: 'warning',
            description: {
              en: 'Heavy irrigation following dry soil shock causes violent tuber bursting and growth cracks.',
              fr: 'Une irrigation abondante succédant à un coup de sec provoque l’éclatement des tubercules.',
              ar: 'الري الغزير بعد فترة عطش يسبب انفجار الدرنات وظهور تشققات عميقة غير قابلة للتسويق.',
            },
          },
        ],
      },
      {
        id: 'p-maturation-harvest',
        name: { en: 'Vine Senescence & Skin Set (Défanage)', fr: 'Défanage & Maturation', ar: 'التجفيف (قطع العرش) وتصلب القشرة' },
        bbchScale: 'BBCH 81–99',
        emoji: '🧺',
        startDay: 96,
        endDay: 115,
        kc: 0.65,
        gddAccumulated: 1350,
        description: {
          en: 'Natural or chemical haulm killing (défanage). Tubers suberize in soil to harden skin against harvest bruising.',
          fr: 'Destruction des fanes (défanage mécanique/chimique) et subérisation de la peau dans le sol.',
          ar: 'إتلاف العرش (ميكانيكياً أو كيميائياً) لتصلب القشرة في التربة ومنع الخدوش أثناء القلع.',
        },
        colorScheme: {
          bg: 'bg-orange-50 dark:bg-orange-950/40',
          border: 'border-orange-300 dark:border-orange-800',
          text: 'text-orange-900 dark:text-orange-200',
          badgeBg: 'bg-orange-600',
          accentHex: '#ea580c',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 1.0, plateaus: 0.8, sahara: 1.5 },
          irrigationIntervalDays: 0,
          stressSensitivity: 'low',
          depletionThresholdP: 0.70,
          rootDepthCm: 60,
          tacticalGuidance: {
            en: 'Stop irrigation 10–14 days before harvest. Soil must be dry enough to separate from tubers during mechanical digging.',
            fr: 'Arrêter l’eau 10 à 14 jours avant récolte pour faciliter l’arrachage et le décollement de la terre.',
            ar: 'إيقاف الري قبل 10-14 يوماً من الحصاد لجفاف التربة وسهولة فصل الدرنات دون التصاق الطين.',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 15, p: 0, k: 0 },
          pctOfSeasonalTotal: { n: 8, p: 0, k: 0 },
          recommendedFormulas: ['Zero nitrogen; allow natural sugar-to-starch conversion'],
          applicationMethod: 'fertigation',
          tacticalGuidance: {
            en: 'Zero nitrogen! Late nitrogen keeps vines green, prevents skin set, and increases bruising.',
            fr: 'Zéro azote ! Un apport tardif maintient les fanes vertes et empêche le durcissement de la peau.',
            ar: 'توقف تام عن التسميد النيتروجيني! النيتروجين المتأخر يمنع تصلب القشرة ويزيد العفن في المخازن.',
          },
        },
        tasks: [
          {
            id: 'task-p-4',
            title: { en: 'Haulm Destruction (Défanage) & Harvest Timing', fr: 'Défanage et test de résistance de la peau', ar: 'قص العرش واختبار مقاومة القشرة بالفرك' },
            type: 'harvest',
            priority: 'critical',
            timingDay: 102,
            details: {
              en: 'Flail or spray vines 14 days before harvest. Rub skin with thumb: skin must not slip before digging starts.',
              fr: 'Broyer les fanes 14 jours avant récolte. La peau ne doit pas peler sous la pression du pouce.',
              ar: 'قص العرش قبل 14 يوماً من القلع. التأكد من ثبات القشرة تحت ضغط الإبهام قبل تشغيل القلاعات.',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Harvest Bruising & Soft Rot Risk', fr: 'Risque de Blessures et Pourriture Molle', ar: 'خطر الجروح والتعفن الطري أثناء الجني' },
            severity: 'warning',
            description: {
              en: 'Digging during midday heat (>30°C) predisposes tubers to blackheart and bacterial soft rot (Erwinia).',
              fr: 'Récolter aux heures chaudes (>30°C) favorise le cœur noir et les pourritures bactériennes.',
              ar: 'الحصاد تحت حرارة شمس الظهيرة (>30°م) يعرض الدرنات لمرض القلب الأسود والتعفن البكتيري.',
            },
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------------------------
  // 3. OPEN-FIELD & GREENHOUSE TOMATO (TOMATE)
  // --------------------------------------------------------------------------
  {
    id: 'tomato',
    name: {
      en: 'Tomato (Tomate)',
      fr: 'Tomate',
      ar: 'الطماطم',
    },
    scientificName: 'Solanum lycopersicum L.',
    emoji: '🍅',
    category: 'vegetable',
    seasonLengthDays: 135,
    typicalSowingMonths: {
      coastal: [3, 4, 5, 8],
      plateaus: [4, 5],
      sahara: [8, 9, 10], // Biskra primeur greenhouse season
    },
    faoReference: 'FAO-56 Irrigation Paper No. 56 (Tomato Kc curve)',
    seasonalNutrientTotalsKgHa: { n: 220, p: 90, k: 310, ca: 110, mg: 45 },
    overview: {
      en: 'Key economic vegetable across Algeria (Biskra plasticulture, Guelma processing, Tipaza open field). Highly dependent on balanced calcium fertigation to prevent Blossom-End Rot.',
      fr: 'Culture reine en Algérie (serres de Biskra, tomate industrielle à Guelma, plein champ côtier). Très sensible à l’équilibre calcique.',
      ar: 'المحصول الخضري الرائد في الجزائر (بيوت بسكرة البلاستيكية، الطماطم الصناعية بقالمة، الحقول الساحلية). شديد الحساسية للخلل الكالسيومي (عفن الطرف الزهري).',
    },
    stages: [
      {
        id: 't-transplant',
        name: { en: 'Transplant Recovery & Establishment', fr: 'Reprise & Enracinement', ar: 'الشتل والتجذير' },
        bbchScale: 'BBCH 10–19',
        emoji: '🌱',
        startDay: 1,
        endDay: 20,
        kc: 0.45,
        gddAccumulated: 240,
        description: {
          en: 'Recovery from transplant shock, deep root extension, and formation of first 5–7 true leaves.',
          fr: 'Reprise racinaire, développement végétatif initial et émission des 5–7 premières feuilles.',
          ar: 'تخطي صدمة الشتل وتعمق الجذور في التربة وتكوين 5 إلى 7 ورقات حقيقية.',
        },
        colorScheme: {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40',
          border: 'border-emerald-300 dark:border-emerald-800',
          text: 'text-emerald-900 dark:text-emerald-200',
          badgeBg: 'bg-emerald-600',
          accentHex: '#059669',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 2.0, plateaus: 1.8, sahara: 3.5 },
          irrigationIntervalDays: 1,
          stressSensitivity: 'high',
          depletionThresholdP: 0.40,
          rootDepthCm: 35,
          tacticalGuidance: {
            en: 'Short daily drip runs (30–45 min) to maintain moisture in the root ball without suffocating young rootlets.',
            fr: 'Irrigations goutte-à-goutte courtes et quotidiennes pour maintenir la motte humide sans asphyxie.',
            ar: 'ريات تنقيط يومية قصيرة (30-45 دقيقة) للحفاظ على رطوبة تربة الشتلة دون اختناق الجذور الفتية.',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 35, p: 60, k: 40, ca: 20 },
          pctOfSeasonalTotal: { n: 16, p: 66, k: 13 },
          recommendedFormulas: ['MAP 12-61-0 (80 kg/ha)', 'Humic & Fulvic acids via drip', 'Calcium Nitrate 15.5-0-0 (60 kg/ha)'],
          applicationMethod: 'fertigation',
          tacticalGuidance: {
            en: 'High starter Phosphorus (MAP) to stimulate rapid lateral rooting. Add humic extracts.',
            fr: 'Apport de phosphore starter (MAP) et acides humiques pour booster l’enracinement.',
            ar: 'تغذية بفوسفور البداية (MAP) مع الأحماض الهيوميكية لتنشيط المجموع الجذري بسرعة.',
          },
        },
        tasks: [
          {
            id: 'task-t-1',
            title: { en: 'Staking & Trellis Setup (Palissage)', fr: 'Palissage et tuteurage', ar: 'التربيط والتعليق على الخيوط' },
            type: 'canopy',
            priority: 'high',
            timingDay: 15,
            details: {
              en: 'Anchor vertical trellis strings and install drip lateral stabilizers.',
              fr: 'Installer les ficelles de tuteurage vertical et fixer les lignes de goutte-à-goutte.',
              ar: 'تثبيت خيوط التعليق العمودية وتثبيت خطوط الري بالتنقيط في مواضعها.',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Damping-off & Pythium Risk', fr: 'Risque de Fonte des semis (Pythium/Rhizoctonia)', ar: 'خطر موت البادرات وعفن الجذور (البيثيوم)' },
            severity: 'warning',
            description: {
              en: 'Overwatering in cold wet conditions rots the seedling collar.',
              fr: 'Un excès d’eau sur sol froid provoque le pourrissement du collet.',
              ar: 'الإفراط في الري مع برودة التربة يسبب تعفن رقبة الشتلة وموتها.',
            },
          },
        ],
      },
      {
        id: 't-flowering-fruitset',
        name: { en: 'Flowering & Fruit Set (Floraison & Nouaison)', fr: 'Floraison & Nouaison', ar: 'الإزهار والعقد' },
        bbchScale: 'BBCH 51–69',
        emoji: '🌸',
        startDay: 21,
        endDay: 60,
        kc: 0.85,
        gddAccumulated: 650,
        description: {
          en: 'Successive trusses open; pollination and cell division of set berries. Intense calcium demand.',
          fr: 'Épanouissement des bouquets floraux, nouaison et division cellulaire intense des jeunes fruits.',
          ar: 'تفتح العناقيد الزهرية وتلقيحها وبدء العقد والانقسام الخلوي لثمار الطماطم الفتية.',
        },
        colorScheme: {
          bg: 'bg-rose-50 dark:bg-rose-950/40',
          border: 'border-rose-300 dark:border-rose-800',
          text: 'text-rose-900 dark:text-rose-200',
          badgeBg: 'bg-rose-600',
          accentHex: '#e11d48',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 3.8, plateaus: 3.5, sahara: 6.0 },
          irrigationIntervalDays: 1,
          stressSensitivity: 'critical',
          depletionThresholdP: 0.35,
          rootDepthCm: 50,
          tacticalGuidance: {
            en: 'Continuous steady moisture is mandatory! Moisture drops interrupt Calcium uptake in the xylem, directly causing Blossom-End Rot.',
            fr: 'Régularité hydrique absolue obligatoire ! Tout stress bloque le calcium et provoque le cul noir.',
            ar: 'انتظام ري صارم لا غنى عنه! انقطاع الماء يوقف نقل الكالسيوم عبر الخشب ويسبب عفن الطرف الزهري (القعر الأكحل).',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 65, p: 30, k: 90, ca: 50, mg: 20 },
          pctOfSeasonalTotal: { n: 30, p: 34, k: 29 },
          recommendedFormulas: ['Calcium Nitrate 15.5-0-0 (150 kg/ha)', 'Potassium Nitrate 13-0-46 (120 kg/ha)', 'Foliar Boron (1.5 kg/ha)'],
          applicationMethod: 'fertigation',
          tacticalGuidance: {
            en: 'Inject Calcium Nitrate separately from Phosphates. Apply foliar Boron to stimulate pollen germination and fruit set.',
            fr: 'Apporter le Nitrate de Chaux (bac séparé) et pulvériser du Bore pour la viabilité du pollen.',
            ar: 'حقن نترات الكالسيوم في خزان منفصل عن الفوسفات، والرش بالبورون لزيادة حيوية حبوب اللقاح ونسبة العقد.',
          },
        },
        tasks: [
          {
            id: 'task-t-2',
            title: { en: 'Pruning & Desuckering (Ébourgeonnage) + Tuta absoluta Pheromones', fr: 'Ébourgeonnage et Piégeage Tuta absoluta', ar: 'التقليم وإزالة الفروع الجانبية ومصائد توتا أبسوليوتا' },
            type: 'canopy',
            priority: 'critical',
            timingDay: 35,
            details: {
              en: 'Remove all lateral axillary suckers weekly. Install delta & water pheromone traps for Tuta absoluta.',
              fr: 'Supprimer les gourmands chaque semaine. Installer des pièges à phéromones contre Tuta absoluta.',
              ar: 'إزالة السرطانات الجانبية أسبوعياً وتثبيت المصائد الفرمونية والمائية لمكافحة حافرة الطماطم (توتا أبسوليوتا).',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Blossom-End Rot (Cul Noir) Alert', fr: 'Alerte Cul Noir (Nécrose Apicale)', ar: 'إنذار بمرض عفن الطرف الزهري (القعر الأكحل)' },
            severity: 'danger',
            description: {
              en: 'Calcium deficiency during early fruit division causes black necrotic bottom on fruit. Never let soil dry out between irrigations.',
              fr: 'Une carence en calcium à la nouaison entraîne la nécrose apicale du fruit. Ne jamais assécher le sol.',
              ar: 'نقص الكالسيوم أثناء انقسام خلايا الثمار يسبب اسوداد قعر الحبة. تجنب جفاف التربة تماماً بين الريات.',
            },
          },
        ],
      },
      {
        id: 't-fruit-sizing',
        name: { en: 'Fruit Sizing & Color Break (Grossissement & Véraison)', fr: 'Grossissement & Véraison', ar: 'تضخم الثمار وتلونها (الكسر)' },
        bbchScale: 'BBCH 71–85',
        emoji: '🍅',
        startDay: 61,
        endDay: 105,
        kc: 1.15,
        gddAccumulated: 1250,
        description: {
          en: 'Heavy fruit expansion across 4–6 trusses. High potassium accumulation for sugars, acidity, and firm skin.',
          fr: 'Grossissement rapide des fruits sur plusieurs bouquets et virage de couleur (accumulation de lycopène).',
          ar: 'تضخم سريع للثمار على 4 إلى 6 عناقيد وبدء تحول اللون وتراكم الليكوبين والسكريات في اللب.',
        },
        colorScheme: {
          bg: 'bg-amber-50 dark:bg-amber-950/40',
          border: 'border-amber-300 dark:border-amber-800',
          text: 'text-amber-900 dark:text-amber-200',
          badgeBg: 'bg-amber-600',
          accentHex: '#d97706',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 5.2, plateaus: 4.8, sahara: 8.5 },
          irrigationIntervalDays: 1,
          stressSensitivity: 'high',
          depletionThresholdP: 0.35,
          rootDepthCm: 70,
          tacticalGuidance: {
            en: 'Peak crop evapotranspiration! Split daily watering into 2–3 pulses in hot weather to prevent fruit splitting.',
            fr: 'Pic absolu de transpiration. Fractionner les arrosages en 2 à 3 fois par jour en période chaude.',
            ar: 'ذروة استهلاك المياه! تجزئة الري اليومي إلى دفعتين أو 3 دفعات وقت الحر الشديد لمنع تشقق الثمار.',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 80, p: 0, k: 140, ca: 40, mg: 25 },
          pctOfSeasonalTotal: { n: 36, p: 0, k: 45 },
          recommendedFormulas: ['Potassium Sulfate 0-0-50 (200 kg/ha)', 'Potassium Nitrate 13-0-46 (100 kg/ha)', 'Calcium Nitrate (50 kg/ha)'],
          applicationMethod: 'fertigation',
          tacticalGuidance: {
            en: 'Maintain high Potassium to Nitrogen ratio (1.8–2.0:1) to boost fruit brix (°Brix > 5.0) and prevent yellow shoulders.',
            fr: 'Maintenir un ratio K/N élevé (1,8–2,0) pour favoriser le calibre, le °Brix et éviter le collet jaune.',
            ar: 'الحفاظ على نسبة بوتاسيوم عالية (1.8-2.0 مقابل النيتروجين) لرفع تركيز السكر (°Brix) ومنع الأكتاف الصفراء.',
          },
        },
        tasks: [
          {
            id: 'task-t-3',
            title: { en: 'Lower Leaf Stripping (Effeuillage bas)', fr: 'Effeuillage du bas de tige', ar: 'توريق وإزالة الأوراق السفلية' },
            type: 'canopy',
            priority: 'high',
            timingDay: 80,
            details: {
              en: 'Remove old yellow leaves below the ripening cluster to improve ventilation and reduce Botrytis / Early Blight.',
              fr: 'Enlever les vieilles feuilles sous le bouquet mûrissant pour aérer et limiter le botrytis.',
              ar: 'إزالة الأوراق المسنة أسفل العنقود الناضج لتهوية النبات والوقاية من العفن الرمادي واللفحة المبكرة.',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Fruit Cracking (Éclatement des fruits) Risk', fr: 'Risque d’Éclatement des fruits', ar: 'خطر تشقق ثمار الطماطم' },
            severity: 'warning',
            description: {
              en: 'Heavy irrigation following high greenhouse heat or sudden rain bursts skins on ripe fruits.',
              fr: 'Un apport d’eau massif après une période chaude fait éclater la peau des fruits mûrs.',
              ar: 'الري الغزير المفاجئ بعد عطش أو حرارة مرتفعة يسبب تمزق قشرة الثمار وتشققها.',
            },
          },
        ],
      },
      {
        id: 't-harvest-period',
        name: { en: 'Continuous Harvest & Finishing', fr: 'Récolte Continue & Finition', ar: 'الجني المستمر ونهاية الموسم' },
        bbchScale: 'BBCH 87–99',
        emoji: '🧺',
        startDay: 106,
        endDay: 135,
        kc: 0.80,
        gddAccumulated: 1550,
        description: {
          en: 'Sequential hand-picking every 3–4 days at turning to red-ripe stage. Lower canopy maintenance.',
          fr: 'Cueillette échelonnée tous les 3–4 jours au stade tournant à rouge selon le marché visé.',
          ar: 'جني يدوي متكرر كل 3-4 أيام عند مرحلة التحول للأحمر بحسب متطلبات السوق والتسويق.',
        },
        colorScheme: {
          bg: 'bg-orange-50 dark:bg-orange-950/40',
          border: 'border-orange-300 dark:border-orange-800',
          text: 'text-orange-900 dark:text-orange-200',
          badgeBg: 'bg-orange-600',
          accentHex: '#ea580c',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 3.5, plateaus: 3.0, sahara: 5.5 },
          irrigationIntervalDays: 1,
          stressSensitivity: 'moderate',
          depletionThresholdP: 0.45,
          rootDepthCm: 75,
          tacticalGuidance: {
            en: 'Slightly reduce water volumes 5–7 days before final picks to concentrate soluble sugars and enhance firmness.',
            fr: 'Modérer légèrement les apports d’eau pour concentrer les sucres et améliorer la fermeté au transport.',
            ar: 'تخفيف طفيف لكميات المياه قبل الجني الأخير لتركيز السكريات وزيادة صلابة الثمار أثناء النقل.',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 40, p: 0, k: 40 },
          pctOfSeasonalTotal: { n: 18, p: 0, k: 13 },
          recommendedFormulas: ['Low rate Potassium Nitrate (60 kg/ha)', 'No excess Nitrogen'],
          applicationMethod: 'fertigation',
          tacticalGuidance: {
            en: 'Low maintenance fertigation to sustain top truss development. Avoid high Nitrogen which softens fruit.',
            fr: 'Fertigation d’entretien modérée. Éviter l’excès d’azote qui ramollit les fruits récoltés.',
            ar: 'تغذية خفيفة لاستكمال نضج العناقيد العلوية مع تفادي النيتروجين الزائد المسبب لطراوة الثمار.',
          },
        },
        tasks: [
          {
            id: 'task-t-4',
            title: { en: 'Harvest Picking & Post-Harvest Cooling', fr: 'Récolte et mise à l’ombre immédiate', ar: 'الجني والتبريد الأولي في الظل' },
            type: 'harvest',
            priority: 'critical',
            timingDay: 115,
            details: {
              en: 'Harvest early morning when fruit pulp temperature is low. Transfer immediately to shaded packing area.',
              fr: 'Récolter tôt le matin lorsque les fruits sont frais. Stocker à l’ombre sans délai.',
              ar: 'الجني في الصباح الباكر حين تكون حرارة لب الثمار منخفضة والنقل الفوري لمنطقة مظللة.',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Post-Harvest Softening & Sunscald', fr: 'Risque de Coup de Soleil et Ramollissement', ar: 'خطر ضربة الشمس وتلف الثمار بعد القطف' },
            severity: 'info',
            description: {
              en: 'Direct sun exposure on harvested crates accelerates respiration and reduces shelf life by 50%.',
              fr: 'L’exposition directe des caisses au soleil accélère le ramollissement des fruits.',
              ar: 'تعريض صناديق الطماطم للشمس المباشرة يسرع تنفس الثمار ويفقدها نصف عمرها التسويقي.',
            },
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------------------------
  // 4. OLIVE (OLIVIER)
  // --------------------------------------------------------------------------
  {
    id: 'olive',
    name: {
      en: 'Olive (Olivier)',
      fr: 'Olivier',
      ar: 'الزيتون',
    },
    scientificName: 'Olea europaea L.',
    emoji: '🫒',
    category: 'orchard',
    seasonLengthDays: 365,
    typicalSowingMonths: {
      coastal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      plateaus: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      sahara: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    faoReference: 'FAO-56 Irrigation Paper No. 56 (Olive Tree Kc curve)',
    seasonalNutrientTotalsKgHa: { n: 120, p: 40, k: 160, ca: 30, mg: 20 },
    overview: {
      en: 'Ancestral perennial orchard across Algeria (Kabylie, Sig, Mascara, Batna, Biskra intensive groves). Well adapted to Mediterranean drought but highly responsive to deficit irrigation.',
      fr: 'Arbre emblématique d’Algérie (Kabylie, Sig, Mascara, Batna, plantations intensives au Sud). Très réactif à l’irrigation déficitaire régulée.',
      ar: 'الشجرة المباركة والتاريخية في الجزائر (القبائل، سيق، معسكر، باتنة، وبساتين الجنوب المكثفة). تستجيب بكفاءة عالية للري التكميلي المنظم.',
    },
    stages: [
      {
        id: 'o-bud-break',
        name: { en: 'Vegetative Flush & Bud Swell', fr: 'Débourrement & Pousse Végétative', ar: 'تفتح البراعم والنمو الخضري الربيعي' },
        bbchScale: 'BBCH 00–51',
        emoji: '🌿',
        startDay: 45,
        endDay: 110,
        kc: 0.65,
        gddAccumulated: 380,
        description: {
          en: 'Spring shoot extension and flower cluster (inflorescence) differentiation on 1-year-old wood.',
          fr: 'Démarrage de la pousse printanière et différenciation des grappes florales sur le bois de l’année précédente.',
          ar: 'انطلاق النمو الخضري الربيعي وتمايز العناقيد الزهرية على خشب العام السابق.',
        },
        colorScheme: {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40',
          border: 'border-emerald-300 dark:border-emerald-800',
          text: 'text-emerald-900 dark:text-emerald-200',
          badgeBg: 'bg-emerald-600',
          accentHex: '#059669',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 2.2, plateaus: 2.0, sahara: 4.0 },
          irrigationIntervalDays: 7,
          stressSensitivity: 'moderate',
          depletionThresholdP: 0.60,
          rootDepthCm: 120,
          tacticalGuidance: {
            en: 'Resume irrigation if winter rainfall was below average to support shoot growth and inflorescence development.',
            fr: 'Reprendre les arrosages si l’hiver a été sec pour soutenir la croissance des pousses et des grappes florales.',
            ar: 'استئناف الري إذا كانت الأمطار الشتوية دون المعدل لدعم النموات الجديدة والعناقيد الزهرية.',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 60, p: 40, k: 60, ca: 30 },
          pctOfSeasonalTotal: { n: 50, p: 100, k: 38 },
          recommendedFormulas: ['Ammonium Nitrate 33.5% (150 kg/ha)', 'DAP 18-46-0 (90 kg/ha)', 'Potassium Sulfate (120 kg/ha)'],
          applicationMethod: 'fertigation',
          tacticalGuidance: {
            en: 'Main annual fertilizer dose applied at green tip. Add foliar Boron (1 kg/ha) 2 weeks before bloom.',
            fr: 'Apport principal d’azote et phosphore au débourrement. Pulvériser du Bore 2 semaines avant fleur.',
            ar: 'تقديم الدفعة الأساسية من النيتروجين والفوسفور مع رش البورون الورقي قبل أسبوعين من التزهير.',
          },
        },
        tasks: [
          {
            id: 'task-o-1',
            title: { en: 'Annual Pruning (Taille d’entretien & d’aération)', fr: 'Taille d’entretien et aération de la frondaison', ar: 'تقليم الصيانة والتهوية وإزالة السرطانات' },
            type: 'canopy',
            priority: 'critical',
            timingDay: 60,
            details: {
              en: 'Thin central branches to let light into the canopy. Remove water sprouts and suckers.',
              fr: 'Éclaircir le centre de l’arbre pour faire entrer la lumière et éliminer les rejets et gourmands.',
              ar: 'فتح قلب الشجرة لتعريض الفروع للشمس والتهوية وإزالة السرطانات الماصة للغذاء.',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Olive Peacock Spot (Cycloconium / Œil de Paon) Risk', fr: 'Alerte Œil de Paon (Spilocaea oleaginea)', ar: 'إنذار بمرض عين الطاووس (تبقع أوراق الزيتون)' },
            severity: 'warning',
            description: {
              en: 'Humid spring conditions trigger leaf drop and defoliation. Apply copper preventive spray.',
              fr: 'Les pluies tièdes de printemps provoquent la chute prématurée des feuilles. Traiter au cuivre.',
              ar: 'الأمطار الربيعية تسبب تساقط أوراق الزيتون المصابة بعين الطاووس. ينصح بالرش النحاسي الوقائي.',
            },
          },
        ],
      },
      {
        id: 'o-flowering-fruitset',
        name: { en: 'Flowering & Fruit Set (Floraison & Nouaison)', fr: 'Floraison & Nouaison', ar: 'الإزهار والعقد' },
        bbchScale: 'BBCH 60–69',
        emoji: '🌸',
        startDay: 111,
        endDay: 155,
        kc: 0.70,
        gddAccumulated: 850,
        description: {
          en: 'Anthesis of thousands of white florets; wind pollination followed by initial berry set.',
          fr: 'Floraison massive, pollinisation anémophile (par le vent) et fixation des jeunes olives.',
          ar: 'تفتح الأزهار والتلقيح بواسطة الرياح ثم عقد حبات الزيتون الفتية وسقوط البتلات.',
        },
        colorScheme: {
          bg: 'bg-rose-50 dark:bg-rose-950/40',
          border: 'border-rose-300 dark:border-rose-800',
          text: 'text-rose-900 dark:text-rose-200',
          badgeBg: 'bg-rose-600',
          accentHex: '#e11d48',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 3.2, plateaus: 3.0, sahara: 5.5 },
          irrigationIntervalDays: 5,
          stressSensitivity: 'critical',
          depletionThresholdP: 0.50,
          rootDepthCm: 140,
          tacticalGuidance: {
            en: 'Maintain steady soil moisture. Drought or hot Sirocco winds cause massive flower drop (coulure).',
            fr: 'Maintenir une humidité régulière. Le vent sec et le manque d’eau provoquent la coulure des fleurs.',
            ar: 'الحفاظ على رطوبة منتظمة. رياح الشهيلي الحارة أو الجفاف يسببان تساقطاً كثيفاً للأزهار (العقص).',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 20, p: 0, k: 30 },
          pctOfSeasonalTotal: { n: 17, p: 0, k: 19 },
          recommendedFormulas: ['Potassium Nitrate via drip (60 kg/ha)', 'Foliar Zinc & Boron spray'],
          applicationMethod: 'fertigation',
          tacticalGuidance: {
            en: 'Light Potassium and foliar micronutrient feeding to support young fruit set retention.',
            fr: 'Apport léger de potassium et oligo-éléments pour stimuler la rétention des fruits noués.',
            ar: 'تغذية خفيفة بالبوتاسيوم والعناصر الصغرى الورقية لزيادة تثبيت الثمار العاقدة.',
          },
        },
        tasks: [
          {
            id: 'task-o-2',
            title: { en: 'Scout for Olive Moth (Prays oleae) Flower Generation', fr: 'Surveillance Teigne de l’Olivier (Prays oleae)', ar: 'مراقبة عثة الزيتون (جيل الأزهار والثمار)' },
            type: 'scouting',
            priority: 'high',
            timingDay: 130,
            details: {
              en: 'Check flower clusters for webbing and caterpillars feeding on floral ovaries.',
              fr: 'Surveiller les glomérules soyeux de chenilles de Prays sur les inflorescences.',
              ar: 'فحص العناقيد الزهرية لكشف خيوط ويرقات عثة الزيتون التي تتغذى على مبايض الأزهار.',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Flower Drop from Early Summer Heatwaves', fr: 'Risque de Coulure Florale', ar: 'خطر تساقط الأزهار بفعل موجات الحر المبكرة' },
            severity: 'danger',
            description: {
              en: 'Temperatures exceeding 35°C desiccate styles and prevent pollen fertilization.',
              fr: 'Des températures >35°C dessèchent les stigmates et empêchent la fécondation.',
              ar: 'درجات حرارة تفوق 35°م تجفف مياسم الأزهار وتمنع تخصيب حبات اللقاح.',
            },
          },
        ],
      },
      {
        id: 'o-pit-hardening',
        name: { en: 'Pit Hardening & Oil Accumulation', fr: 'Durcissement du Noyau & Lipogenèse', ar: 'تصلب النواة وتكوين الزيت (الليبوغينيز)' },
        bbchScale: 'BBCH 71–81',
        emoji: '🫒',
        startDay: 156,
        endDay: 280,
        kc: 0.65,
        gddAccumulated: 2100,
        description: {
          en: 'Endocarp hardens (knife resistance test); pulp cells expand and synthesize triglycerides (oil content).',
          fr: 'Lignification complète du noyau et début de la synthèse de l’huile dans la pulpe.',
          ar: 'تصلب النواة (مقاومة سكين القطع) وتمدد خلايا اللب وتصنيع قطيرات زيت الزيتون.',
        },
        colorScheme: {
          bg: 'bg-amber-50 dark:bg-amber-950/40',
          border: 'border-amber-300 dark:border-amber-800',
          text: 'text-amber-900 dark:text-amber-200',
          badgeBg: 'bg-amber-600',
          accentHex: '#d97706',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 3.5, plateaus: 3.2, sahara: 6.5 },
          irrigationIntervalDays: 7,
          stressSensitivity: 'moderate',
          depletionThresholdP: 0.65,
          rootDepthCm: 150,
          tacticalGuidance: {
            en: 'Regulated Deficit Irrigation (RDI): moderate summer deficit increases oil polyphenol content without hurting yield.',
            fr: 'Irrigation déficitaire régulée (RDI) : un stress modéré en été augmente la teneur en polyphénols.',
            ar: 'الري العجزي المنظم (RDI): التعطيش المعتدل صيفاً يرفع تركيز البوليفينولات المفيدة بالزيت.',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 40, p: 0, k: 70, mg: 20 },
          pctOfSeasonalTotal: { n: 33, p: 0, k: 43 },
          recommendedFormulas: ['Potassium Sulfate 0-0-50 (140 kg/ha)', 'Magnesium Nitrate (40 kg/ha)'],
          applicationMethod: 'fertigation',
          tacticalGuidance: {
            en: 'High Potassium injection during July–August accelerates oil lipogenesis and fruit weight.',
            fr: 'Apport de potassium en été pour maximiser le rendement en huile et la taille des olives.',
            ar: 'تسميد بوتاسي صيفي مكثف لتسريع تراكم الزيت وزيادة حجم ولحم حبات الزيتون.',
          },
        },
        tasks: [
          {
            id: 'task-o-3',
            title: { en: 'Olive Fruit Fly (Bactrocera oleae) Monitoring Traps', fr: 'Piégeage de la Mouche de l’Olive (Bactrocera)', ar: 'مراقبة ونصب مصائد ذبابة ثمار الزيتون' },
            type: 'protection',
            priority: 'critical',
            timingDay: 210,
            details: {
              en: 'Deploy McPhail / yellow sticky traps with diammonium phosphate attractant. Treat when 1–2% stung fruit threshold is reached.',
              fr: 'Poser des pièges McPhail et traiter dès le seuil de 1 à 2% de piqûres sur fruits.',
              ar: 'تثبيت مصائد ماكفيل الصفراء ومعالجة البستان عند وصول نسبة وخز الثمار إلى 1-2%.',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Olive Fruit Fly (Dacus / Bactrocera) Attack', fr: 'Attaque de la Mouche de l’Olive', ar: 'هجوم ذبابة ثمار الزيتون' },
            severity: 'danger',
            description: {
              en: 'Larval feeding inside olive flesh oxidizes oil, spiking free acidity above extra-virgin limits (>0.8%).',
              fr: 'Les larves dans la pulpe dégradent l’huile et font grimper l’acidité au-delà des normes extra-vierge.',
              ar: 'تغذي اليرقات داخل لب الزيتون يرفع نسبة الحموضة الحرة ويفقد الزيت تصنيف البكر الممتاز.',
            },
          },
        ],
      },
      {
        id: 'o-veraison-harvest',
        name: { en: 'Veraison, Maturation & Harvesting', fr: 'Véraison, Maturation & Récolte', ar: 'تغير اللون (الفيريزون)، النضج والجني' },
        bbchScale: 'BBCH 81–89',
        emoji: '🫒',
        startDay: 281,
        endDay: 350,
        kc: 0.50,
        gddAccumulated: 2800,
        description: {
          en: 'Color shifts from green to purple and black. Peak oil content and optimum polyphenol-to-acidity index.',
          fr: 'Virage de couleur du vert au violet puis noir. Optimum du rapport teneur en huile / polyphénols.',
          ar: 'تحول لون الزيتون من الأخضر إلى البنفسجي فالأسود. الوصول لذروة كمية الزيت وأجود نكهة متوازنة.',
        },
        colorScheme: {
          bg: 'bg-purple-50 dark:bg-purple-950/40',
          border: 'border-purple-300 dark:border-purple-800',
          text: 'text-purple-900 dark:text-purple-200',
          badgeBg: 'bg-purple-600',
          accentHex: '#9333ea',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 1.5, plateaus: 1.2, sahara: 2.5 },
          irrigationIntervalDays: 10,
          stressSensitivity: 'low',
          depletionThresholdP: 0.75,
          rootDepthCm: 150,
          tacticalGuidance: {
            en: 'Stop irrigation 2–3 weeks before mechanical shaking to avoid root loosening and watery oil emulsion.',
            fr: 'Stopper les irrigations 2 à 3 semaines avant récolte pour préserver la qualité de l’huile.',
            ar: 'توقيف الري قبل الجني بـ 2-3 أسابيع لمنع امتلاء الثمار بالماء الزائد وتسهيل استخلاص الزيت.',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 0, p: 0, k: 0 },
          pctOfSeasonalTotal: { n: 0, p: 0, k: 0 },
          recommendedFormulas: ['No soil application; post-harvest copper spray for wood disinfection'],
          applicationMethod: 'foliar',
          tacticalGuidance: {
            en: 'Post-harvest copper oxychloride spray (300 g/100 L) to protect branch wounds made by vibrating combs.',
            fr: 'Traitement au cuivre post-récolte pour désinfecter les plaies de gaulage ou peignes vibrants.',
            ar: 'رش نحاسي علاجي بعد الجني لتعقيم الجروح الناتجة عن الأمشاط والاهتزاز وحماية الأغصان.',
          },
        },
        tasks: [
          {
            id: 'task-o-4',
            title: { en: 'Harvesting by Ripeness Index & Same-Day Cold Pressing', fr: 'Récolte à l’indice de maturité optimal et Trituration en 24h', ar: 'الجني عند مؤشر النضج المثالي والعصر خلال 24 ساعة' },
            type: 'harvest',
            priority: 'critical',
            timingDay: 320,
            details: {
              en: 'Harvest using nets and handheld vibrators. Press olives within 24 hours below 27°C (cold extraction).',
              fr: 'Récolter sur filets et acheminer au moulin dans les 24h pour une extraction à froid (<27°C).',
              ar: 'الجني على الشباك والنقل الفوري للمعصرة خلال 24 ساعة للعصر على البارد (أقل من 27°م).',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Fermentation & Heating in Piled Olives', fr: 'Risque d’Échauffement des Olives entassées', ar: 'خطر تخمر وحرارة الزيتون المكدس' },
            severity: 'danger',
            description: {
              en: 'Storing olives in plastic bags creates fusty/musty sensory defects. Use aerated shallow crates only.',
              fr: 'Stocker les olives en sacs plastiques provoque le défaut de chomé/moisi. Utiliser des caisses ajourées.',
              ar: 'تخزين الزيتون في أكياس بلاستيكية يسبب التخمر وعيب "الشوميزي". يجب استخدام صناديق مهواة فقط.',
            },
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------------------------
  // 5. DATE PALM / DEGLET NOUR (PALMIER DATTIER)
  // --------------------------------------------------------------------------
  {
    id: 'date-palm',
    name: {
      en: 'Date Palm (Palmier Dattier / Deglet Nour)',
      fr: 'Palmier Dattier (Deglet Nour)',
      ar: 'نخيل التمر (دقلة نور)',
    },
    scientificName: 'Phoenix dactylifera L.',
    emoji: '🌴',
    category: 'orchard',
    seasonLengthDays: 365,
    typicalSowingMonths: {
      coastal: [],
      plateaus: [],
      sahara: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    faoReference: 'FAO Irrigation and Drainage Paper 56 (Date Palm Kc curve)',
    seasonalNutrientTotalsKgHa: { n: 150, p: 60, k: 220, ca: 40, mg: 30 },
    overview: {
      en: 'Emblematic Saharan oasis tree (Biskra Tolga, El Oued, Ouargla, Ghardaia). Outstanding economic value for export. Requires enormous summer water volumes (up to 150 L/tree/day in July).',
      fr: 'Arbre emblématique des oasis sahariennes (Biskra Tolga, Oued Souf, Ouargla, Ghardaïa). Valeur d’exportation majeure. Consommation hydrique estivale colossale.',
      ar: 'رمز الواحات الصحراوية الجزائرية (بسكرة طولقة، وادي سوف، ورقلة، غرداية). قيمة اقتصادية تصديرية كبرى مع استهلاك مائي صيفي ضخم يصل إلى 150 لتر/شجرة/يوم.',
    },
    stages: [
      {
        id: 'dp-pollination',
        name: { en: 'Pollination & Fruit Set (Talaa / تلقيح)', fr: 'Pollinisation (Talaa)', ar: 'التلقيح والإبار (الطلعة)' },
        bbchScale: 'BBCH 61–69',
        emoji: '🌸',
        startDay: 75,
        endDay: 120,
        kc: 0.80,
        gddAccumulated: 480,
        description: {
          en: 'Spathe opening, manual male spikelet insertion (Dhoukar) into female spadix, fruit set.',
          fr: 'Éclosion des spathes, insémination manuelle avec brins mâles (Dhoukar) et nouaison.',
          ar: 'انشقاق الكافور (الكم)، إدخال شماريخ الذكار يدوياً في العراجين المؤنثة وعقد الثمار الأولى.',
        },
        colorScheme: {
          bg: 'bg-rose-50 dark:bg-rose-950/40',
          border: 'border-rose-300 dark:border-rose-800',
          text: 'text-rose-900 dark:text-rose-200',
          badgeBg: 'bg-rose-600',
          accentHex: '#e11d48',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 0, plateaus: 0, sahara: 4.5 },
          irrigationIntervalDays: 4,
          stressSensitivity: 'high',
          depletionThresholdP: 0.45,
          rootDepthCm: 180,
          tacticalGuidance: {
            en: 'Keep basin/bubbler irrigation steady. Avoid wetting flower spathes with overhead sprinklers during pollination.',
            fr: 'Irrigations régulières au pied. Ne jamais mouiller les inflorescences pendant le travail de pollinisation.',
            ar: 'ري منتظم حول الجذع وتجنب رش الرؤوس بالمياه لتفادي غسل حبوب اللقاح وإفساد الإبار.',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 45, p: 60, k: 50 },
          pctOfSeasonalTotal: { n: 30, p: 100, k: 23 },
          recommendedFormulas: ['DAP 18-46-0 (130 kg/ha)', 'Potassium Nitrate (100 kg/ha)'],
          applicationMethod: 'fertigation',
          tacticalGuidance: {
            en: 'Annual Phosphorus and first third of Nitrogen/Potassium applied to stimulate root uptake before summer.',
            fr: 'Apport de tout le phosphore et 1/3 de l’azote et du potassium avant les chaleurs estivales.',
            ar: 'إضافة كامل الفوسفور وثلث النيتروجين والبوتاسيوم لتنشيط الجذور قبل الدخول في حر الصيف.',
          },
        },
        tasks: [
          {
            id: 'task-dp-1',
            title: { en: 'Manual Pollination & Spadix Binding', fr: 'Pollinisation manuelle et ligature légère des régimes', ar: 'التلقيح اليدوي بالذكار وربط العراجين خفيفاً' },
            type: 'canopy',
            priority: 'critical',
            timingDay: 90,
            details: {
              en: 'Insert 3–5 fresh male strands per female bunch; tie loosely with palm leaflet.',
              fr: 'Insérer 3 à 5 brins mâles dans chaque régime femelle et lier avec une foliole.',
              ar: 'وضع 3 إلى 5 شماريخ ذكار نشطة في كل عرجون وربطها برفق بسعفة خضراء.',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Incomplete Pollination (Shees / عرجون شيص) Risk', fr: 'Risque de Nouaison Parthénocarpique (Chis)', ar: 'خطر عدم الإخصاب وتكون الشيص' },
            severity: 'danger',
            description: {
              en: 'Cold spells below 18°C or dry sandstorms during flowering prevent pollen tube growth, yielding seedless worthless dates.',
              fr: 'Températures <18°C ou tempête de sable empêchant la fécondation, créant des fruits sans noyau.',
              ar: 'برودة الطقس أقل من 18°م أو العواصف الرملية تمنع الإخصاب وتنتج تموراً عديمة النوى (الشيص).',
            },
          },
        ],
      },
      {
        id: 'dp-hababouk-chimri',
        name: { en: 'Hababouk & Chimri (Green Fruit Sizing)', fr: 'Hababouk & Chimri (Fruits Verts)', ar: 'الحبابوك والجمري (النمو الأخضر)' },
        bbchScale: 'BBCH 71–79',
        emoji: '🌴',
        startDay: 121,
        endDay: 210,
        kc: 0.95,
        gddAccumulated: 1650,
        description: {
          en: 'Intense cell expansion; dates become round, firm, dark green. Bunch thinning and bunch lowering (Tedllia).',
          fr: 'Grossissement cellulaire intense ; dates vertes dures. Éclaircissage et descente des régimes (Tedllia).',
          ar: 'تضخم خلوي سريع؛ الثمار خضراء صلبة (الجمري). إجراء خف الثمار والتدلية وتعديل وضع العراجين.',
        },
        colorScheme: {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40',
          border: 'border-emerald-300 dark:border-emerald-800',
          text: 'text-emerald-900 dark:text-emerald-200',
          badgeBg: 'bg-emerald-600',
          accentHex: '#059669',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 0, plateaus: 0, sahara: 9.5 },
          irrigationIntervalDays: 2,
          stressSensitivity: 'critical',
          depletionThresholdP: 0.40,
          rootDepthCm: 200,
          tacticalGuidance: {
            en: 'Maximum summer evapotranspiration! Provide 100–150 L/tree/day during Saharan June–July peaks.',
            fr: 'Pic absolu de chaleur au Sahara. Apporter 100 à 150 L/palmier/jour pour éviter le flétrissement.',
            ar: 'ذروة الاستهلاك المائي في الصحراء. توفير 100-150 لتر/نخلة/يوم لمنع جفاف الثمار وصغر حجمها.',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 60, p: 0, k: 100, mg: 30 },
          pctOfSeasonalTotal: { n: 40, p: 0, k: 45 },
          recommendedFormulas: ['Potassium Sulfate 0-0-50 (200 kg/ha)', 'Urea 46% (130 kg/ha)'],
          applicationMethod: 'fertigation',
          tacticalGuidance: {
            en: 'Heavy Potassium and Nitrogen feeding split into bi-weekly bubbler doses to build fruit pulp size.',
            fr: 'Fertilisation potassique et azotée soutenue toutes les 2 semaines pour le calibre de la chair.',
            ar: 'تسميد بوتاسي ونيتروجيني مكثف كل أسبوعين لبناء لحم الثمرة وضمان أحجام تجارية ممتازة.',
          },
        },
        tasks: [
          {
            id: 'task-dp-2',
            title: { en: 'Bunch Thinning & Lowering (Tedllia / التدلية)', fr: 'Éclaircissage et descente des régimes (Tedllia)', ar: 'خف الثمار وتدلية العراجين على السعف' },
            type: 'canopy',
            priority: 'critical',
            timingDay: 150,
            details: {
              en: 'Thin central strand by 25–30% for Deglet Nour. Lower heavy bunches and rest them on fronds to avoid stalk breakage.',
              fr: 'Éclaircir le cœur du régime de 30% et poser les régimes sur les palmes pour éviter la casse.',
              ar: 'خف 25-30% من الشماريخ الداخلية وتنزيل العراجين الثقيلة لتستند على السعف لمنع انكسار الحوامل.',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Old World Date Mite (Boufaroua / بوفروة) Epidemic', fr: 'Alerte Acarien du Palmier (Boufaroua - Oligonychus afrasiaticus)', ar: 'إنذار بوباء حلم الغبار (البوفروة)' },
            severity: 'danger',
            description: {
              en: 'Dust spider mites spin fine webs collecting sand, drying and scarring young dates. Apply wettable sulfur preventive dust.',
              fr: 'L’acarien tisse une toile retenant le sable et momifie les dattes. Traiter au soufre mouillable.',
              ar: 'حلم البوفروة ينسج خيوطاً تجمع الغبار وتخنق الثمار الخضراء. التعفير أو الرش الوقائي بالكبريت.',
            },
          },
        ],
      },
      {
        id: 'dp-khalal-rutab-tamar',
        name: { en: 'Khalal, Rutab & Tamar (Ripening & Harvest)', fr: 'Bser, Rutab & Tamar (Maturation)', ar: 'الخلال (البسر)، الرطب والتمر (النضج والجني)' },
        bbchScale: 'BBCH 81–89',
        emoji: '🌴',
        startDay: 211,
        endDay: 320,
        kc: 0.70,
        gddAccumulated: 3200,
        description: {
          en: 'Color turns translucent amber-yellow (Deglet Nour), pulp softens into golden honey texture, final harvest.',
          fr: 'Virage au jaune ambré translucide, ramollissement mielleux et récolte des régimes mûrs.',
          ar: 'تحول اللون للأصفر الكهرماني الشفاف، تحول اللحم لقوام عسلي طري (الرطب ثم التمر) والجني النهائي.',
        },
        colorScheme: {
          bg: 'bg-amber-50 dark:bg-amber-950/40',
          border: 'border-amber-300 dark:border-amber-800',
          text: 'text-amber-900 dark:text-amber-200',
          badgeBg: 'bg-amber-600',
          accentHex: '#d97706',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 0, plateaus: 0, sahara: 4.0 },
          irrigationIntervalDays: 7,
          stressSensitivity: 'moderate',
          depletionThresholdP: 0.65,
          rootDepthCm: 200,
          tacticalGuidance: {
            en: 'Reduce irrigation gradually. Excessive late moisture causes skin fermentation, date puffiness, and fungal rot.',
            fr: 'Réduire l’eau progressivement. Tout excès d’humidité fait fermenter la datte et décolle la peau.',
            ar: 'تخفيض الري تدريجياً. الرطوبة الزائدة المتأخرة تسبب تخمر التمور وانفصال القشرة وتعفن الرؤوس.',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 45, p: 0, k: 70 },
          pctOfSeasonalTotal: { n: 30, p: 0, k: 32 },
          recommendedFormulas: ['Potassium Nitrate late finish (80 kg/ha)', 'No late ammonium'],
          applicationMethod: 'fertigation',
          tacticalGuidance: {
            en: 'Final Potassium dose in August to finalize sugar crystallization and translucent amber color.',
            fr: 'Dernier apport de potassium en août pour la brillance, la couleur ambrée et la tenue au stockage.',
            ar: 'آخر دفعة بوتاسيوم في أوت لتعزيز تبلور السكريات واللون الذهبي اللامع وتحمل التخزين الطويل.',
          },
        },
        tasks: [
          {
            id: 'task-dp-3',
            title: { en: 'Bunch Bagging (Tackmiche) against Rain & Ectomyelois Moths', fr: 'Ensachage des régimes contre la pluie et la pyrale (Ectomyelois)', ar: 'تكميم وتغليف العراجين ضد الأمطار ودودة التمر (عثة الدقلة)' },
            type: 'protection',
            priority: 'critical',
            timingDay: 230,
            details: {
              en: 'Cover bunches with breathable kraft paper / microperforated plastic hoods to protect against autumn rain and moth egg laying.',
              fr: 'Protéger les régimes avec des housses aérées contre les pluies d’automne et la pyrale des dattes.',
              ar: 'تغطية العراجين بأكياس واقية مهواة لحمايتها من أمطار الخريف المفاجئة ودودة التمر (الخروب).',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Autumn Rain & Fungal Souring Risk', fr: 'Risque de Pluies d’Automne et Acidification', ar: 'خطر أمطار الخريف وحموضة التمور' },
            severity: 'danger',
            description: {
              en: 'Rain during Rutab stage causes yeast fermentation and fruit cracking within 48 hours.',
              fr: 'La pluie au stade Rutab déclenche une fermentation acétique foudroyante.',
              ar: 'هطول الأمطار في طور الرطب يسبب تخمراً فطرياً سريعاً وحموضة للتمور خلال 48 ساعة.',
            },
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------------------------
  // 6. CITRUS / CLEMENTINE (AGRUMES)
  // --------------------------------------------------------------------------
  {
    id: 'citrus',
    name: {
      en: 'Citrus (Clementine & Orange)',
      fr: 'Agrumes (Clémentinier & Oranger)',
      ar: 'الحمضيات (الكلمنتين والبرتقال)',
    },
    scientificName: 'Citrus reticulata / Citrus sinensis',
    emoji: '🍊',
    category: 'orchard',
    seasonLengthDays: 365,
    typicalSowingMonths: {
      coastal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      plateaus: [],
      sahara: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    faoReference: 'FAO-56 Irrigation Paper No. 56 (Citrus Trees Kc curve)',
    seasonalNutrientTotalsKgHa: { n: 180, p: 50, k: 210, ca: 80, mg: 40 },
    overview: {
      en: 'Major fruit sector along the Mitidja plain, Chlef valley, Relizane, and coastal plains. Clementine of Misserghin and oranges. Critical water and micronutrient sensitivity.',
      fr: 'Filière fruitière majeure de la Mitidja, vallée du Chéliff, Relizane et plaines côtières. Forte sensibilité au stress hydrique et aux carences en fer/zinc.',
      ar: 'شعبة الفواكه الرائدة في متيجة وحوض الشلف وغليزان والسهول الساحلية (كلمنتين مسرغين والبرتقال). حساسية عالية لنقص الحديد والزنك والإجهاد المائي.',
    },
    stages: [
      {
        id: 'c-bloom-fruitset',
        name: { en: 'Spring Flush, Bloom & Petal Fall', fr: 'Pousse de Printemps & Floraison', ar: 'النمو الربيعي، الإزهار وعقد الثمار' },
        bbchScale: 'BBCH 51–69',
        emoji: '🌸',
        startDay: 60,
        endDay: 130,
        kc: 0.70,
        gddAccumulated: 420,
        description: {
          en: 'Fragrant white blossom flush, bee pollination, petal fall and initial pea-sized fruit set.',
          fr: 'Floraison blanche parfumée, nouaison et chute physiologique des pétales.',
          ar: 'تفتح الأزهار البيضاء العطرة، نشاط النحل في التلقيح وسقوط البتلات وعقد الثمار بحجم حبة الحمص.',
        },
        colorScheme: {
          bg: 'bg-rose-50 dark:bg-rose-950/40',
          border: 'border-rose-300 dark:border-rose-800',
          text: 'text-rose-900 dark:text-rose-200',
          badgeBg: 'bg-rose-600',
          accentHex: '#e11d48',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 2.8, plateaus: 2.5, sahara: 4.8 },
          irrigationIntervalDays: 4,
          stressSensitivity: 'critical',
          depletionThresholdP: 0.40,
          rootDepthCm: 100,
          tacticalGuidance: {
            en: 'Avoid moisture fluctuations. Drought shock during flowering triggers catastrophic fruitlet drop.',
            fr: 'Éviter tout stress hydrique. Un coup de sec à la floraison provoque une chute massive des nouaisons.',
            ar: 'تجنب أي تذبذب في الري. العطش أثناء التزهير يسبب تساقطاً كارثياً للعقد الثمري الفتي.',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 80, p: 50, k: 60, ca: 40 },
          pctOfSeasonalTotal: { n: 44, p: 100, k: 28 },
          recommendedFormulas: ['Calcium Nitrate 15.5-0-0 (150 kg/ha)', 'Iron Chelate EDDHA 6% (25 kg/ha)', 'Foliar Zn-Mn mix'],
          applicationMethod: 'fertigation',
          tacticalGuidance: {
            en: 'Soil apply Iron EDDHA to prevent calcareous chlorosis. Foliar spray Zinc + Manganese at 2/3 leaf expansion.',
            fr: 'Apporter le Chélate de Fer EDDHA au sol contre la chlorose et pulvériser Zinc + Manganèse.',
            ar: 'إضافة مخلب الحديد EDDHA في التربة الكلسية ورش الزنك والمنغنيز مع اكتمال نمو الأوراق الربيعية.',
          },
        },
        tasks: [
          {
            id: 'task-c-1',
            title: { en: 'Scout for Aphids, Thrips & Citrus Leafminer (Phyllocnistis)', fr: 'Surveillance Pucerons, Thrips et Mineuse des agrumes', ar: 'مراقبة حشرات المن، التريبس وصانعة أنفاق أوراق الحمضيات' },
            type: 'scouting',
            priority: 'critical',
            timingDay: 95,
            details: {
              en: 'Check tender spring shoots for leaf curling aphids and serpentine leafminer trails.',
              fr: 'Inspecter les jeunes pousses tendres pour détecter les pucerons et les galeries de mineuse.',
              ar: 'فحص النموات الربيعية الغضة لكشف التفاف الأوراق بفعل المن وأنفاق حشرة صانعة الأنفاق.',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Iron Chlorosis (Jaunisse du Calcaire) Alert', fr: 'Alerte Chlorose Ferrique', ar: 'إنذار باصفرار الأوراق (نقص الحديد الكلسي)' },
            severity: 'warning',
            description: {
              en: 'High soil active limestone blocks iron uptake, turning young leaves bright yellow with green veins.',
              fr: 'Le calcaire actif bloque le fer et jaunit les jeunes feuilles.',
              ar: 'الكلس الفعال في التربة يحبس الحديد ويحول الأوراق الحديثة للون الأصفر مع عروق خضراء.',
            },
          },
        ],
      },
      {
        id: 'c-fruit-sizing',
        name: { en: 'Fruit Sizing & Cell Expansion', fr: 'Grossissement des Fruits', ar: 'تضخم الثمار وتمدد الخلايا' },
        bbchScale: 'BBCH 71–79',
        emoji: '🍊',
        startDay: 131,
        endDay: 250,
        kc: 0.75,
        gddAccumulated: 1750,
        description: {
          en: 'Juice sac development, peel thickness regulation, and continuous fruit diameter expansion.',
          fr: 'Développement des vésicules à jus, régulation de l’épaisseur de l’écorce et gain de calibre.',
          ar: 'تطور أكياس العصير داخل فصوص البرتقال، ضبط سمك القشرة وتضخم قطر الثمار المستمر.',
        },
        colorScheme: {
          bg: 'bg-amber-50 dark:bg-amber-950/40',
          border: 'border-amber-300 dark:border-amber-800',
          text: 'text-amber-900 dark:text-amber-200',
          badgeBg: 'bg-amber-600',
          accentHex: '#d97706',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 4.2, plateaus: 3.8, sahara: 7.0 },
          irrigationIntervalDays: 3,
          stressSensitivity: 'high',
          depletionThresholdP: 0.45,
          rootDepthCm: 110,
          tacticalGuidance: {
            en: 'High water demand throughout Mediterranean summer. Maintain drip schedule to maximize final fruit caliber.',
            fr: 'Besoins élevés tout l’été. Maintenir le goutte-à-goutte pour garantir le calibre commercial.',
            ar: 'احتياجات مائية مرتفعة طيلة الصيف. المحافظة على انتظام التنقيط لضمان العيار التجاري الممتاز.',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 70, p: 0, k: 110, mg: 40 },
          pctOfSeasonalTotal: { n: 39, p: 0, k: 52 },
          recommendedFormulas: ['Potassium Nitrate 13-0-46 (180 kg/ha)', 'Magnesium Nitrate (50 kg/ha)'],
          applicationMethod: 'fertigation',
          tacticalGuidance: {
            en: 'Heavy Potassium fertigation is the #1 determinant of citrus fruit size, juice volume, and peel resistance.',
            fr: 'Le Potassium est le facteur clé du calibre des agrumes, de la teneur en jus et de la résistance de l’écorce.',
            ar: 'التسميد البوتاسي هو العامل الحاسم الأول لحجم حبات البرتقال وغزارة العصير ومقاومة القشرة.',
          },
        },
        tasks: [
          {
            id: 'task-c-2',
            title: { en: 'Mediterranean Fruit Fly (Ceratitis capitata / Cératite) Trapping', fr: 'Piégeage de la Cératite (Mouche méditerranéenne des fruits)', ar: 'نصب مصائد ذبابة الفاكهة المتوسطية (السيراتيت)' },
            type: 'protection',
            priority: 'critical',
            timingDay: 210,
            details: {
              en: 'Deploy yellow sticky traps with trimedlure sex attractant. Begin bait sprays when threshold is exceeded.',
              fr: 'Installer les pièges à phéromones pour surveiller la mouche des fruits avant le virage de couleur.',
              ar: 'تثبيت مصائد فرمونية لمراقبة ذبابة الفاكهة وبدء الرش بالطعوم السامة عند تجاوز العتبة الاقتصادية.',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Fruit Splitting (Éclatement) Risk', fr: 'Risque d’Éclatement des Fruits', ar: 'خطر تشقق قشرة البرتقال والكلمنتين' },
            severity: 'warning',
            description: {
              en: 'Severe water stress followed by heavy watering expands internal pulp faster than peel elasticity.',
              fr: 'Un apport d’eau massif après un stress hydrique fait éclater l’écorce des fruits.',
              ar: 'الري الغزير بعد فترة عطش يسبب تمدد اللب الداخلي بسرعة تفوق مرونة القشرة فتنقسم الثمار.',
            },
          },
        ],
      },
      {
        id: 'c-veraison-harvest',
        name: { en: 'Color Break, Degreening & Harvest', fr: 'Véraison, Déverdissage & Récolte', ar: 'تلون القشرة، زوال اللون الأخضر والجني' },
        bbchScale: 'BBCH 81–89',
        emoji: '🍊',
        startDay: 251,
        endDay: 350,
        kc: 0.65,
        gddAccumulated: 2400,
        description: {
          en: 'Peel turns orange as chlorophyll degrades; sugar-acid ratio (Maturity Index E/A) reaches sweet peak.',
          fr: 'Virage de l’écorce à l’orange éclatant et optimisation du rapport sucres/acides (Indice E/A).',
          ar: 'تحول القشرة إلى اللون البرتقالي الزاهي واكتمال النسبة المثالية بين السكر والحموضة (مؤشر النضج E/A).',
        },
        colorScheme: {
          bg: 'bg-orange-50 dark:bg-orange-950/40',
          border: 'border-orange-300 dark:border-orange-800',
          text: 'text-orange-900 dark:text-orange-200',
          badgeBg: 'bg-orange-600',
          accentHex: '#ea580c',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 2.0, plateaus: 1.8, sahara: 3.5 },
          irrigationIntervalDays: 6,
          stressSensitivity: 'low',
          depletionThresholdP: 0.60,
          rootDepthCm: 110,
          tacticalGuidance: {
            en: 'Moderate water supplies during autumn to concentrate sugars and enhance peel coloration naturally.',
            fr: 'Modérer les arrosages en automne pour concentrer les sucres et stimuler la coloration naturelle.',
            ar: 'تعديل وتخفيف الري خريفاً لتركيز العصارة السكرية وتسريع التلون البرتقالي الطبيعي للقشرة.',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 30, p: 0, k: 40 },
          pctOfSeasonalTotal: { n: 17, p: 0, k: 20 },
          recommendedFormulas: ['Potassium Sulfate finish', 'No nitrogen to avoid thick green rind'],
          applicationMethod: 'fertigation',
          tacticalGuidance: {
            en: 'Zero nitrogen in late autumn! Late nitrogen causes thick, coarse rinds and delays degreening.',
            fr: 'Arrêter l’azote en automne ! L’azote tardif épaissit la peau et retarde le déverdissage.',
            ar: 'إيقاف التسميد النيتروجيني خريفاً! النيتروجين المتأخر يجعل القشرة سميكة خشنة ويؤخر زوال اللون الأخضر.',
          },
        },
        tasks: [
          {
            id: 'task-c-3',
            title: { en: 'Selective Clipper Harvesting (Cisaillage)', fr: 'Récolte au sécateur sans arrachage du calice', ar: 'الجني بالمقصات اليدوية دون اقتلاع الكأس' },
            type: 'harvest',
            priority: 'critical',
            timingDay: 300,
            details: {
              en: 'Clip fruit stalks cleanly with curved shears. Never pull or tear fruit by hand to prevent stem-end rot.',
              fr: 'Couper le pédoncule au sécateur ras du calice pour éviter les blessures lors du stockage en caisse.',
              ar: 'قص العنق بالمقصات بمحاذاة الكأس الأخضر لمنع جرح الثمار الأخرى عند تكديسها في الصناديق.',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Medfly (Ceratitis) Stings on Ripening Peel', fr: 'Piqûres de Cératite sur Fruits Mûrs', ar: 'وخز ذبابة السيراتيت على الثمار الملونة' },
            severity: 'danger',
            description: {
              en: 'Females lay eggs under the colored peel, creating soft rotting spots. Treat promptly or deploy mass trapping.',
              fr: 'Les pontes sous l’écorce provoquent la pourriture rapide du fruit sur l’arbre.',
              ar: 'تضع إناث الذبابة بيضها تحت القشرة الملونة مما يسبب تعفناً طرياً وسقوط الثمار قبل الجني.',
            },
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------------------------
  // 7. GRAPEVINE (VIGNE)
  // --------------------------------------------------------------------------
  {
    id: 'grapevine',
    name: {
      en: 'Grapevine (Table & Wine Grapes)',
      fr: 'Vigne (Raisin de Table & de Cuve)',
      ar: 'الكرمة (عنب المائدة والعصير)',
    },
    scientificName: 'Vitis vinifera L.',
    emoji: '🍇',
    category: 'orchard',
    seasonLengthDays: 220,
    typicalSowingMonths: {
      coastal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      plateaus: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      sahara: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    faoReference: 'FAO-56 Irrigation Paper No. 56 (Grapevine Kc curve)',
    seasonalNutrientTotalsKgHa: { n: 90, p: 40, k: 140, ca: 50, mg: 25 },
    overview: {
      en: 'Historic Mediterranean crop (Medea, Mascara, Mostaganem, Tlemcen, Mitidja). Highly responsive to canopy management, powdery mildew protection, and deficit irrigation at veraison.',
      fr: 'Vignobles historiques (Médéa, Mascara, Mostaganem, Tlemcen, Mitidja). Forte dépendance à la conduite du feuillage et au contrôle de l’oïdium/mildiou.',
      ar: 'زراعة تاريخية في الجزائر (المدية، معسكر، مستغانم، تلمسان، متيجة). تعتمد كلياً على حسن تربية المجموع الخضري والمكافحة الدقيقة للبياض الدقيقي والميلديو.',
    },
    stages: [
      {
        id: 'g-budbreak-shoot',
        name: { en: 'Bud Break & Shoot Growth (Débourrement)', fr: 'Débourrement & Pousse des Rameaux', ar: 'تفتح العيون وانطلاق الفروع الخضراء' },
        bbchScale: 'BBCH 01–53',
        emoji: '🌿',
        startDay: 1,
        endDay: 50,
        kc: 0.35,
        gddAccumulated: 250,
        description: {
          en: 'Woolly buds open to green shoots; rapid elongation and flower cluster emergence.',
          fr: 'Éclatement des bourgeons d’hiver, croissance rapide des sarments et apparition des inflorescences.',
          ar: 'انفتاح العيون الشتوية، نمو سريع للأفرخ الخضراء وظهور العناقيد الزهرية الأولية.',
        },
        colorScheme: {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40',
          border: 'border-emerald-300 dark:border-emerald-800',
          text: 'text-emerald-900 dark:text-emerald-200',
          badgeBg: 'bg-emerald-600',
          accentHex: '#059669',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 1.5, plateaus: 1.2, sahara: 2.8 },
          irrigationIntervalDays: 7,
          stressSensitivity: 'moderate',
          depletionThresholdP: 0.55,
          rootDepthCm: 120,
          tacticalGuidance: {
            en: 'Rely on spring soil water reserves. Light supplemental irrigation only if winter rain was deficient.',
            fr: 'S’appuyer sur les réserves hydriques du sol. Arrosage léger uniquement si hiver très sec.',
            ar: 'الاعتماد على مخزون التربة الشتوي. ري تكميلي خفيف فقط في حال جفاف الشتاء.',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 40, p: 40, k: 30, ca: 50 },
          pctOfSeasonalTotal: { n: 44, p: 100, k: 21 },
          recommendedFormulas: ['DAP 18-46-0 (90 kg/ha)', 'Ammonium Nitrate (80 kg/ha)'],
          applicationMethod: 'fertigation',
          tacticalGuidance: {
            en: 'Early spring nitrogen to support vigor, and full phosphorus to stimulate root renewal.',
            fr: 'Apport précoce d’azote pour la vigueur des pousses et tout le phosphore pour les racines.',
            ar: 'تسميد نيتروجيني مبكر لدعم قوة النموات وكامل الفوسفور لتنشيط تجديد الشعيرات الجذرية.',
          },
        },
        tasks: [
          {
            id: 'task-g-1',
            title: { en: 'Shoot Thinning & Tying (Épamprage et relevage)', fr: 'Épamprage et relevage des sarments', ar: 'إزالة النموات القاعدية الزائدة ورفع الأغصان على الأسلاك' },
            type: 'canopy',
            priority: 'high',
            timingDay: 35,
            details: {
              en: 'Remove non-fruitful suckers on the trunk and tuck growing shoots between trellis wires.',
              fr: 'Supprimer les gourmands sur le tronc et relever les rameaux dans le palissage.',
              ar: 'إزالة السرطانات غير المثمرة على الساق وتوجيه الأفرخ بين أسلاك التدعيم.',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Spring Frost on Emerging Grape Shoots', fr: 'Risque de Gelée de Printemps', ar: 'خطر الصقيع الربيعي على البراعم الغضة' },
            severity: 'danger',
            description: {
              en: 'Temperatures below -1°C kill green shoots instantly. Prepare frost protection or wind machines.',
              fr: 'Des températures <-1°C détruisent les jeunes sarments verts en quelques heures.',
              ar: 'درجات حرارة تحت -1°م تتلف النموات الغضة فوراً وتدمر المحصول. الاستعداد للحماية من الصقيع.',
            },
          },
        ],
      },
      {
        id: 'g-bloom-berryset',
        name: { en: 'Bloom & Berry Set (Floraison & Nouaison)', fr: 'Floraison & Nouaison', ar: 'الإزهار وعقد الحبات' },
        bbchScale: 'BBCH 60–71',
        emoji: '🌸',
        startDay: 51,
        endDay: 85,
        kc: 0.65,
        gddAccumulated: 650,
        description: {
          en: 'Floral caps (calyptra) shed, pollination, and transformation into green buckshot-size berries.',
          fr: 'Chute des capuchons floraux, fécondation et formation des jeunes baies taille grain de plomb.',
          ar: 'سقوط أغطية الأزهار، التلقيح والإخصاب وتحول الأزهار لحبات خضراء صغيرة بحجم حبة الخردل.',
        },
        colorScheme: {
          bg: 'bg-rose-50 dark:bg-rose-950/40',
          border: 'border-rose-300 dark:border-rose-800',
          text: 'text-rose-900 dark:text-rose-200',
          badgeBg: 'bg-rose-600',
          accentHex: '#e11d48',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 3.0, plateaus: 2.8, sahara: 5.0 },
          irrigationIntervalDays: 5,
          stressSensitivity: 'critical',
          depletionThresholdP: 0.45,
          rootDepthCm: 140,
          tacticalGuidance: {
            en: 'Maintain steady moisture. Extreme water stress or severe heat during bloom causes coulure (flower shedding).',
            fr: 'Humidité régulière obligatoire. Un manque d’eau provoque la coulure des grappes.',
            ar: 'الحفاظ على رطوبة متوازنة. الجفاف أو الحر الشديد يسبب تساقط الأزهار وفشل العقد (الحت).',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 25, p: 0, k: 40, mg: 25 },
          pctOfSeasonalTotal: { n: 28, p: 0, k: 29 },
          recommendedFormulas: ['Potassium Nitrate 13-0-46 (80 kg/ha)', 'Foliar Boron & Magnesium spray'],
          applicationMethod: 'fertigation',
          tacticalGuidance: {
            en: 'Apply foliar Boron 10 days before bloom to ensure uniform pollen tube germination.',
            fr: 'Pulvérisation de Bore 10 jours avant floraison pour favoriser la germination pollinique.',
            ar: 'رش البورون الورقي قبل 10 أيام من التزهير لضمان حيوية حبوب اللقاح وانتظام العقد.',
          },
        },
        tasks: [
          {
            id: 'task-g-2',
            title: { en: 'Powdery Mildew (Oïdium) & Downy Mildew (Mildiou) Strategy', fr: 'Traitement Clé Oïdium et Mildiou', ar: 'المكافحة الاستراتيجية للبياض الدقيقي والميلديو' },
            type: 'protection',
            priority: 'critical',
            timingDay: 65,
            details: {
              en: 'Apply sulfur and systemic fungicide right at full bloom to protect young berry skins from powdery mildew scarring.',
              fr: 'Appliquer du soufre et un antioïdium systémique en pleine fleur pour protéger la peau des baies.',
              ar: 'استخدام الكبريت ومبيد جهازي أثناء التزهير لحماية قشرة الحبات الفتية من تشققات البياض الدقيقي.',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Powdery Mildew (Oïdium) Critical Window', fr: 'Alerte Oïdium sur Jeunes Baies', ar: 'إنذار بمرض البياض الدقيقي (الرمد)' },
            severity: 'danger',
            description: {
              en: 'Berries remain highly susceptible until bunch closure. Oïdium bursts skins and ruins table grapes.',
              fr: 'Les baies sont hyper-sensibles jusqu’à la fermeture de la grappe. L’oïdium fait éclater le raisin.',
              ar: 'تظل الحبات شديدة الحساسية حتى انغلاق العنقود. البياض الدقيقي يشوه القشرة ويفسد عنب المائدة.',
            },
          },
        ],
      },
      {
        id: 'g-veraison-ripening',
        name: { en: 'Veraison & Ripening (Véraison & Maturation)', fr: 'Véraison & Maturation', ar: 'تلون العنب (الفيريزون) والنضج' },
        bbchScale: 'BBCH 81–89',
        emoji: '🍇',
        startDay: 86,
        endDay: 180,
        kc: 0.60,
        gddAccumulated: 1850,
        description: {
          en: 'Berries soften and change color (green to red/purple or golden yellow). Rapid sugar accumulation and acid degradation.',
          fr: 'Ramollissement des baies, virage de couleur et accumulation massive des sucres.',
          ar: 'طراوة الحبات وتغير لونها (للأحمر أو البنفسجي أو الأصفر الذهبي)، وتراكم سريع للسكريات وانخفاض الحموضة.',
        },
        colorScheme: {
          bg: 'bg-purple-50 dark:bg-purple-950/40',
          border: 'border-purple-300 dark:border-purple-800',
          text: 'text-purple-900 dark:text-purple-200',
          badgeBg: 'bg-purple-600',
          accentHex: '#9333ea',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 2.2, plateaus: 2.0, sahara: 4.0 },
          irrigationIntervalDays: 8,
          stressSensitivity: 'moderate',
          depletionThresholdP: 0.65,
          rootDepthCm: 150,
          tacticalGuidance: {
            en: 'Regulated deficit irrigation (RDI): slight water stress stops shoot growth and channels carbohydrates into grape bunches.',
            fr: 'Déficit hydrique contrôlé pour stopper la pousse végétative et concentrer les sucres dans le raisin.',
            ar: 'الري العجزي المنظم: إجهاد مائي خفيف يوقف نمو الأفرخ ويوجه الطاقة السكرية لتغذية عناقيد العنب.',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 25, p: 0, k: 70 },
          pctOfSeasonalTotal: { n: 28, p: 0, k: 50 },
          recommendedFormulas: ['Potassium Sulfate 0-0-50 (140 kg/ha)', 'No nitrogen'],
          applicationMethod: 'fertigation',
          tacticalGuidance: {
            en: 'Heavy Potassium fertigation during veraison is vital for berry sugar accumulation (°Brix > 16) and bunch coloring.',
            fr: 'Le Potassium à la véraison est indispensable pour la montée en sucre (°Brix) et la belle coloration.',
            ar: 'التسميد البوتاسي المكثف أثناء الفيريزون حيوي لرفع السكريات وتوحيد لون العناقيد الجذاب.',
          },
        },
        tasks: [
          {
            id: 'task-g-3',
            title: { en: 'Leaf Removal in Cluster Zone (Effeuillage) & Grape Berry Moth (Eudemis)', fr: 'Effeuillage de la zone des grappes et surveillance Eudémis', ar: 'توريق منطقة العناقيد ومراقبة دودة ثمار العنب (الأوديميس)' },
            type: 'canopy',
            priority: 'critical',
            timingDay: 110,
            details: {
              en: 'Strip leaves around bunches to maximize morning sun and wind penetration, stopping Botrytis bunch rot.',
              fr: 'Effeuiller autour des grappes pour aérer et empêcher la pourriture grise (Botrytis).',
              ar: 'إزالة الأوراق المحيطة بالعناقيد لتهويتها وتعريضها للشمس الصباحية لمنع العفن الرمادي (البوتريتيس).',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Botrytis Bunch Rot (Pourriture Grise) Alert', fr: 'Alerte Pourriture Grise (Botrytis cinerea)', ar: 'إنذار بمرض العفن الرمادي (البوتريتيس)' },
            severity: 'danger',
            description: {
              en: 'Humid late summer showers on tight bunches cause rapid skin breakdown and gray mold.',
              fr: 'Des pluies d’orage en fin d’été sur grappes compactes entraînent une pourriture grise rapide.',
              ar: 'الأمطار الخريفية على العناقيد المتراصة تسبب تمزق القشرة وانتشار العفن الرمادي المخرب.',
            },
          },
        ],
      },
      {
        id: 'g-harvest-dormancy',
        name: { en: 'Harvest & Post-Harvest Cane Lignification (Aoûtement)', fr: 'Vendange & Aoûtement des Sarments', ar: 'قطف العنب وتخشب القصبات (العقل)' },
        bbchScale: 'BBCH 89–97',
        emoji: '🧺',
        startDay: 181,
        endDay: 220,
        kc: 0.30,
        gddAccumulated: 2200,
        description: {
          en: 'Careful bunch cutting, crate packing, and post-harvest storage of carbohydrate reserves in the trunk.',
          fr: 'Récolte soignée des grappes entières et mise en réserve des glucides dans les sarments (aoûtement).',
          ar: 'جني العناقيد الكاملة بعناية والتعبئة في الصناديق وتخزين الاحتياطي الغذائي في الخشب والقصبات.',
        },
        colorScheme: {
          bg: 'bg-orange-50 dark:bg-orange-950/40',
          border: 'border-orange-300 dark:border-orange-800',
          text: 'text-orange-900 dark:text-orange-200',
          badgeBg: 'bg-orange-600',
          accentHex: '#ea580c',
        },
        irrigation: {
          waterDemandMmPerDay: { coastal: 0.8, plateaus: 0.5, sahara: 1.5 },
          irrigationIntervalDays: 14,
          stressSensitivity: 'low',
          depletionThresholdP: 0.75,
          rootDepthCm: 150,
          tacticalGuidance: {
            en: 'Post-harvest maintenance irrigation ensures leaves remain photosynthetically active to build reserves for next year.',
            fr: 'Un arrosage post-récolte maintient les feuilles actives pour faire les réserves du printemps prochain.',
            ar: 'ري خفيف بعد الجني للحفاظ على نشاط الأوراق لبناء مخزون الشجرة الكربوهيدراتي للموسم القادم.',
          },
        },
        nutrients: {
          stageTotalsKgHa: { n: 0, p: 0, k: 0 },
          pctOfSeasonalTotal: { n: 0, p: 0, k: 0 },
          recommendedFormulas: ['Post-harvest foliar Urea 2% + Zinc before natural leaf drop'],
          applicationMethod: 'foliar',
          tacticalGuidance: {
            en: 'Foliar urea + zinc spray after harvest recharges perennial wood reserves before dormancy.',
            fr: 'Pulvérisation foliaire d’urée + zinc pour enrichir le bois avant la chute des feuilles.',
            ar: 'رش ورقي باليوريا والزنك بعد القطف لتغذية الخشب المعمر قبل سكون الشتاء.',
          },
        },
        tasks: [
          {
            id: 'task-g-4',
            title: { en: 'Selective Table Grape Picking & Cold Storage Pre-Cooling', fr: 'Récolte sélective et pré-réfrigération immédiate', ar: 'الجني الانتقائي والتبريد الأولي الفوري' },
            type: 'harvest',
            priority: 'critical',
            timingDay: 195,
            details: {
              en: 'Handle clusters by the stem only to preserve the white waxy bloom (pruine). Cool to 0–1°C within 6 hours.',
              fr: 'Manipuler les grappes par le pédoncule pour conserver la pruine protectrice.',
              ar: 'مسك العناقيد من الحامل فقط للحفاظ على الطبقة الشمعية البيضاء (البروين) والتبريد السريع.',
            },
          },
        ],
        riskAlerts: [
          {
            title: { en: 'Stem Dehydration & Berry Shatter', fr: 'Dessèchement de la Rafle', ar: 'خطر جفاف الشماريخ وسقوط الحبات' },
            severity: 'info',
            description: {
              en: 'High ambient temperatures desiccate the green stem, turning it brown and brittle within 12 hours.',
              fr: 'La chaleur assèche la rafle verte qui brunit et perd sa fraîcheur commerciale.',
              ar: 'الحرارة العالية تجفف العناقيد الخضراء وتحولها للبني وتفقدها نضارتها التسويقية.',
            },
          },
        ],
      },
    ],
  },
];

export function getPhenologyCrop(cropId: string): PhenologyCrop | undefined {
  return PHENOLOGY_CROPS.find(c => c.id === cropId) ?? PHENOLOGY_CROPS[0];
}

