/**
 * Active Matter Mechanisms & Mode of Action (MoA) Knowledge Base for Algerian Agriculture
 *
 * Comprehensive biochemical, physiological, and operational guides explaining how each
 * active substance works against pests, fungal diseases, and weeds in the Algerian context.
 *
 * Curated from:
 *   - IRAC (Insecticide Resistance Action Committee)
 *   - FRAC (Fungicide Resistance Action Committee)
 *   - HRAC (Herbicide Resistance Action Committee)
 *   - INPV (Institut National de la Protection des Végétaux — Algérie)
 *   - EPPO / Anses E-Phy scientific monographs
 */

export type PlantMobility = 'contact' | 'translaminar' | 'xylem-systemic' | 'full-systemic';
export type ActionSpeed = 'ultra-fast' | 'fast' | 'moderate' | 'slow';
export type ResistanceRisk = 'low' | 'medium' | 'high';

export interface MechanismStep {
  step: number;
  title: { fr: string; ar: string; en: string };
  desc: { fr: string; ar: string; en: string };
}

export interface ActiveMatterMechanism {
  id: string;
  substanceKey: string;
  nameFr: string;
  nameAr: string;
  nameEn: string;
  type: 'insecticide' | 'acaricide' | 'fungicide' | 'herbicide' | 'nematicide' | 'bio-insecticide' | 'bio-fongicide' | 'molluscicide' | 'rodenticide';
  groupCode: string;
  groupFamily: string;
  targetSite: string;
  targetSiteAr: string;
  mobility: PlantMobility;
  actionSpeed: ActionSpeed;
  knockdownEffect: boolean;
  rainfastnessHours: number;
  curativeWindowHours?: number; // 0 = preventive only
  resistanceRisk: ResistanceRisk;
  
  // Trilingual biochemical explanation
  summary: { fr: string; ar: string; en: string };
  howItWorksSteps: MechanismStep[];
  pestOrDiseaseSymptoms: { fr: string; ar: string; en: string };
  
  // Practical field application tips
  optimalConditions: {
    tempMinC?: number;
    tempMaxC?: number;
    idealTemp: string;
    waterPhAdvice: string;
    adjuvantOrMixing: string;
    solarOrTimeOfDay: string;
  };
  
  resistanceManagement: { fr: string; ar: string; en: string };
  algerianAgroTip: { fr: string; ar: string; en: string };
}

export const ACTIVE_MATTER_MECHANISMS: ActiveMatterMechanism[] = [
  // =========================================================================
  // 1. INSECTICIDES & ACARICIDES
  // =========================================================================
  {
    id: 'abamectine',
    substanceKey: 'abamectine',
    nameFr: 'Abamectine (Avermectines)',
    nameAr: 'أبامكتين (أفرمكتين)',
    nameEn: 'Abamectin',
    type: 'insecticide',
    groupCode: 'IRAC 6',
    groupFamily: 'Avermectines (Macrolides dérivés de Streptomyces avermitilis)',
    targetSite: 'Canaux chlorures activés par le glutamate (GluCl) et GABA',
    targetSiteAr: 'قنوات الكلوريد المنشطة بالغلوتامات ومستقبلات GABA',
    mobility: 'translaminar',
    actionSpeed: 'moderate',
    knockdownEffect: false,
    rainfastnessHours: 2,
    resistanceRisk: 'high',
    summary: {
      fr: "L'abamectine se fixe sur les canaux chlorures des synapses nerveuses et neuromusculaires des acariens et insectes piqueurs/mineurs. Elle provoque un influx continu d'ions chlorure qui hyperpolarise les neurones et paralyse irréversiblement l'insecte.",
      ar: "يرتبط الأبامكتين بقنوات الكلوريد في المشابك العصبية للآفات، مما يؤدي لتدفق مستمر لأيونات الكلور وشلل الأعصاب والعضلات، وتوقف فوري للتغذية قبل الموت.",
      en: "Abamectin binds to glutamate-gated chloride channels in insect nerves and muscles, causing irreversible chloride influx, neuromuscular paralysis, and feeding cessation.",
    },
    howItWorksSteps: [
      {
        step: 1,
        title: { fr: "Pénétration translaminaire", ar: "الامتصاص عبر أنسجة الورقة", en: "Translaminar Absorption" },
        desc: {
          fr: "Après pulvérisation, la molécule traverse la cuticule et forme un réservoir actif à l'intérieur du parenchyme foliaire (protégé du lessivage et des UV).",
          ar: "تخترق المادة بشرة الورقة وتستقر داخل النسيج المتوسط لتشكل مخزوناً فعالاً ضد الآفات التي تتغذى على العصارة أو الأنفاق.",
          en: "Absorbs into leaf tissue forming a reservoir in the parenchyma, protected from rain and sunlight degradation.",
        },
      },
      {
        step: 2,
        title: { fr: "Ingestion & Contact", ar: "الابتلاع والتلامس", en: "Ingestion & Contact" },
        desc: {
          fr: "L'acarien ou la mineuse ingère la sève cellulaire contenant la matière active lors de la piqûre ou du creusement de galeries.",
          ar: "تمتص الحشرة أو العنكبوت العصارة المحتوية على المادة الفعالة أثناء التغذية أو حفر الأنفاق.",
          en: "Target pest ingests cell sap or tissue while feeding or mining inside leaves.",
        },
      },
      {
        step: 3,
        title: { fr: "Blocage de la transmission nerveuse", ar: "تثبيط السيالة العصبية", en: "Nerve Transmission Blockade" },
        desc: {
          fr: "Ouverture permanente des canaux chlorures GluCl → flux massif de Cl⁻ → perte de transmission de l'influx moteur.",
          ar: "فتح دائم لقنوات الكلوريد مما يوقف نقل الإشارات العصبية تماماً.",
          en: "Persistent opening of chloride channels hyperpolarizes membranes, stopping electrical signals.",
        },
      },
      {
        step: 4,
        title: { fr: "Arrêt de nutrition & mortalité", ar: "توقف التغذية والنفوق", en: "Feeding Cessation & Death" },
        desc: {
          fr: "Cessation immédiate des dégâts en 2 heures. Mortalité complète atteinte en 48 à 72 heures par inanition et paralysie.",
          ar: "تتوقف الحشرة عن التغذية وإحداث الضرر خلال ساعتين، ويحدث النفوق التام خلال 48-72 ساعة.",
          en: "Feeding stops within 2 hours, preventing further crop damage; death follows in 2-4 days.",
        },
      },
    ],
    pestOrDiseaseSymptoms: {
      fr: "Les acariens deviennent immobiles, ne piquent plus les feuilles et tombent ; les larves de Tuta absoluta ou de mouches mineuses s'arrêtent au bout de leur galerie sans nymphoser.",
      ar: "تصبح العناكب ساكنة تماماً وتتوقف عن امتصاص العصارة؛ تتوقف يرقات التوتا أبسولوتا وصانعات الأنفاق عن إكمال أنفاقها وتموت داخلها.",
      en: "Mites freeze and cease feeding; leafminer larvae stop gallery expansion and die inside tissue.",
    },
    optimalConditions: {
      idealTemp: '20 °C à 28 °C',
      tempMinC: 15,
      tempMaxC: 32,
      waterPhAdvice: "Efficace à pH 5.5 - 7.0. Acidifier l'eau calcaire en Algérie pour éviter l'hydrolyse alcaline.",
      adjuvantOrMixing: "L'ajout d'une huile minérale ou d'un mouillant non-ionique (0.1-0.2%) améliore considérablement la pénétration translaminaire.",
      solarOrTimeOfDay: "Traiter en fin d'après-midi ou tôt le matin (dégradation rapide par les UV solaires directs en plein midi).",
    },
    resistanceManagement: {
      fr: "Maximum 2 applications par campagne. Alterner impérativement avec IRAC 28 (chlorantraniliprole), IRAC 5 (spinosad) ou IRAC 21 (pyridabène).",
      ar: "حد أقصى معاملتان في الموسم. التناوب إجباري مع مجموعات مختلفة مثل السبيوساد (IRAC 5) أو الكورانجين (IRAC 28) لتفادي ظهور سلالات مقاومة.",
      en: "Max 2 sprays per season. Rotate with IRAC 28, IRAC 5, or IRAC 21 to prevent rapid resistance build-up.",
    },
    algerianAgroTip: {
      fr: "En maraîchage sous serre (Biskra, Tipaza, Mostaganem), cibler la face inférieure des feuilles où se réfugient les acariens et jeunes larves de Tuta.",
      ar: "في البيوت البلاستيكية (بسكرة، تيبازة، مستغانم)، يجب توجيه الرش نحو السطح السفلي للأوراق حيث تختبئ العناكب ويرقات التوتا.",
      en: "Under plastic tunnels in Biskra and coastal zones, ensure thorough underside leaf coverage.",
    },
  },

  {
    id: 'acetamipride',
    substanceKey: 'acetamipride',
    nameFr: 'Acétamipride (Néonicotinoïde)',
    nameAr: 'أسيتامبريد (نيونيكوتينويد)',
    nameEn: 'Acetamiprid',
    type: 'insecticide',
    groupCode: 'IRAC 4A',
    groupFamily: 'Néonicotinoïdes (Agonistes des récepteurs nicotiniques)',
    targetSite: 'Récepteurs nicotiniques de l’acétylcholine (nAChR)',
    targetSiteAr: 'مستقبلات الأسيتيل كولين النيكوتينية (nAChR)',
    mobility: 'xylem-systemic',
    actionSpeed: 'fast',
    knockdownEffect: true,
    rainfastnessHours: 2,
    resistanceRisk: 'medium',
    summary: {
      fr: "L'acétamipride mime l'acétylcholine au niveau des récepteurs synaptiques des insectes suceurs. Il provoque une hyperexcitation continue du système nerveux central, des tremblements musculaires incontrôlés et une paralysie rapide.",
      ar: "يحاكي الأسيتامبريد الناقل العصبي الأسيتيل كولين ويرتبط بمستقبلاته بشكل دائم، مما يسبب إثارة مفرطة للجهاز العصبي ورعاشاً يتبعه شلل وموت سريع للآفات الماصة.",
      en: "Acetamiprid acts as an agonist on insect nicotinic acetylcholine receptors, triggering non-stop nerve firing, convulsions, paralysis, and swift mortality.",
    },
    howItWorksSteps: [
      {
        step: 1,
        title: { fr: "Absorption & Migration xylémienne", ar: "الامتصاص والانتقال في أوعية الخشب", en: "Xylem Systemic Uptake" },
        desc: {
          fr: "Absorbé par les feuilles et racines, transporté de manière ascendante par la sève brute vers les jeunes pousses en croissance.",
          ar: "يمتص عبر الأوراق والجذور وينتقل صعوداً عبر النسغ الناقص ليحمي النموات والأوراق الجديدة.",
          en: "Quickly absorbed and carried upward through xylem sap to protect newly emerging shoots.",
        },
      },
      {
        step: 2,
        title: { fr: "Fixation sur récepteur nAChR", ar: "الارتباط بمستقبلات nAChR", en: "Receptor Binding" },
        desc: {
          fr: "Se lie avec une très haute affinité aux récepteurs nicotiniques d'acétylcholine des insectes sans pouvoir être détruit par l'acétylcholinestérase.",
          ar: "يرتبط بقوة بمستقبلات الجهاز العصبي للحشرة ولا يتفكك بواسطة إنزيم الأستيل كولين إستراز الطبيعي.",
          en: "Binds irreversibly to insect nAChR channels, remaining resistant to breakdown by acetylcholinesterase.",
        },
      },
      {
        step: 3,
        title: { fr: "Hyperexcitation & Convulsions", ar: "إثارة عصبية وتشنجات", en: "Neuronal Hyperexcitation" },
        desc: {
          fr: "Décharge continue des neurones moteurs, tremblements rapides, désorientation et perte de coordination motrice.",
          ar: "إرسال نبضات عصبية مستمرة تؤدي إلى حركات غير منتظمة ورعاش وفقدان السيطرة الحركية.",
          en: "Continuous electrical discharges cause frantic tremors, loss of posture, and incoordination.",
        },
      },
      {
        step: 4,
        title: { fr: "Paralysie & Chute de population", ar: "الشلل التام والانهيار", en: "Paralysis & Death" },
        desc: {
          fr: "Blocage complet des synapses motrices en 6 à 12 heures, chute des pucerons et mouches blanches.",
          ar: "شلل تام خلال 6-12 ساعة وسقوط حشرات المن والذبابة البيضاء وموتها.",
          en: "Complete synaptic fatigue and paralysis occur within 6-12 hours, clearing the canopy.",
        },
      },
    ],
    pestOrDiseaseSymptoms: {
      fr: "Pucerons décrochés des tiges, dessèchement rapide des colonies, arrêt de la production de miellat et de fumagine.",
      ar: "تساقط حشرات المن من الساق، جفاف مستعمرات الذبابة البيضاء، وتوقف فوري لإفراز الندوة العسلية.",
      en: "Aphids fall from stems, whitefly colonies dry up, honeydew secretion halts immediately.",
    },
    optimalConditions: {
      idealTemp: '18 °C à 30 °C',
      tempMinC: 12,
      tempMaxC: 35,
      waterPhAdvice: "Stable à pH 5 - 8. Efficace dans les eaux de forage courantes en Algérie.",
      adjuvantOrMixing: "Excellente compatibilité en bouillie avec les fongicides triazoles et strobilurines.",
      solarOrTimeOfDay: "Éviter impérativement le traitement en pleine floraison pour préserver les abeilles et pollinisateurs.",
    },
    resistanceManagement: {
      fr: "Ne pas enchaîner plus de 2 néonicotinoïdes consécutifs. Alterner avec pyréthrinoïdes (IRAC 3A) ou bio-insecticides (spinosad IRAC 5, huile minérale).",
      ar: "عدم تكرار النيونيكوتينويد لأكثر من رشتين متتاليتين. التبديل مع البيرثرينات أو الزيوت المعدنية لتفادي مقاومة المن.",
      en: "Rotate with IRAC 3A, IRAC 5, or horticultural oils to prevent neonicotinoid resistance in aphids and whiteflies.",
    },
    algerianAgroTip: {
      fr: "Remarquable contre le puceron des agrumes dans la Mitidja et la cicadelle de la vigne en zone littorale.",
      ar: "فعالية عالية جداً ضد من الحمضيات في متيجة ونطاطات أوراق الكرمة في المناطق الساحلية.",
      en: "Highly effective for citrus aphid in Mitidja and grapevine leafhopper in Algerian coastal vineyards.",
    },
  },

  {
    id: 'lambda-cyhalothrine',
    substanceKey: 'lambda-cyhalothrine',
    nameFr: 'Lambda-cyhalothrine (Pyréthrinoïde de synthèse)',
    nameAr: 'لامبدا-سيهالوثرين (بيريثرين)',
    nameEn: 'Lambda-cyhalothrin',
    type: 'insecticide',
    groupCode: 'IRAC 3A',
    groupFamily: 'Pyréthrinoïdes de type II (à groupement alpha-cyano)',
    targetSite: 'Canaux sodium voltage-dépendants des axones nerveux',
    targetSiteAr: 'قنوات الصوديوم المعتمدة على الجهد في المحاور العصبية',
    mobility: 'contact',
    actionSpeed: 'ultra-fast',
    knockdownEffect: true,
    rainfastnessHours: 1,
    resistanceRisk: 'high',
    summary: {
      fr: "Modulateur des canaux sodium axonaux. Maintient les canaux ouverts, provoquant un effet de choc ('knockdown') foudroyant par décharges répétitives, spasmes musculaires et paralysie en quelques minutes.",
      ar: "معدل لقنوات الصوديوم العصبية. يبقي القنوات مفتوحة مما يسبب صدمة عصبية فورية (Knockdown) وتشنجات وارتخاء وشلل وموت الحشرة في دقائق معدودة.",
      en: "Keeps voltage-gated sodium channels open, causing massive repetitive axonal discharges, immediate knockdown, muscle paralysis, and rapid death.",
    },
    howItWorksSteps: [
      {
        step: 1,
        title: { fr: "Contact cuticulaire foudroyant", ar: "تلامس جلدي فوري", en: "Cuticular Contact" },
        desc: {
          fr: "Très lipophile, pénètre instantanément à travers la cuticule cireuse de l'insecte dès la pulvérisation ou la marche sur le feuillage.",
          ar: "مادة شديدة الذوبان في الدهون، تخترق فوراً الطبقة الشمعية للحشرة بمجرد ملامستها لرذاذ الرش.",
          en: "Lipophilic compound rapidly penetrates the waxy insect cuticle upon direct contact or deposit walking.",
        },
      },
      {
        step: 2,
        title: { fr: "Blocage de la fermeture des canaux Na⁺", ar: "تعطيل إغلاق قنوات الصوديوم", en: "Sodium Channel Prolongation" },
        desc: {
          fr: "Empêche la repolarisation membranaire des axones en maintenant le flux d'ions sodium actif en continu.",
          ar: "يمنع عودة استقطاب غشاء المحور العصبي عبر إبقاء تدفق شوارد الصوديوم مستمراً دون انقطاع.",
          en: "Prevents channel closing, causing a continuous train of repetitive action potentials.",
        },
      },
      {
        step: 3,
        title: { fr: "Effet Choc (Knockdown)", ar: "تأثير الصعق والشلل الحركي", en: "Instant Knockdown" },
        desc: {
          fr: "Spasmes violents, chute immédiate de la plante en moins de 15 minutes, paralysie respiratoire.",
          ar: "تشنجات عضلية عنيفة وسقوط فوري للحشرة من المحصول في أقل من 15 دقيقة.",
          en: "Violent convulsions cause immediate knockdown and falling from the plant within minutes.",
        },
      },
      {
        step: 4,
        title: { fr: "Effet répulsif résiduel", ar: "خاصية الطرد المتبقية", en: "Repellent Guard" },
        desc: {
          fr: "Les dépôts foliaires repoussent les adultes volants et dissuadent les nouvelles pontes pendant plusieurs jours.",
          ar: "الرواسب المتبقية على السطح تبعد الحشرات البالغة وتمنع وضع بيض جديد لعدة أيام.",
          en: "Foliar deposit exhibits strong repellent and anti-oviposition properties on surviving adults.",
        },
      },
    ],
    pestOrDiseaseSymptoms: {
      fr: "Chute spectaculaire des noctuelles, criquets, pucerons et altises au sol dans les 20 minutes suivant le passage du pulvérisateur.",
      ar: "سقوط فوري للديدان القارضة، الجراد، المن وخنافس القفز على الأرض خلال دقائق من انتهاء الرش.",
      en: "Immediate drop of caterpillars, aphids, locusts, and flea beetles to the ground.",
    },
    optimalConditions: {
      idealTemp: '12 °C à 24 °C',
      tempMinC: 5,
      tempMaxC: 28,
      waterPhAdvice: "Préfère une eau légèrement acide (pH 5.5 - 6.5). Moins stable en eau très calcaire alcaline.",
      adjuvantOrMixing: "Formulation micro-encapsulée (Karate Zeon) offrant une meilleure résistance aux UV et à la pluie.",
      solarOrTimeOfDay: "Traiter de préférence au coucher du soleil pour maximiser l'effet choc sur chenilles nocturnes.",
    },
    resistanceManagement: {
      fr: "Risque de résistance rapide (mutation kdr). Ne pas dépasser 2 applications/saison et alterner avec IRAC 28 (Coragen) ou IRAC 5 (Spinosad).",
      ar: "خطر تطور مناعة سريع (طفرة kdr). لا تتجاوز رشتين في الموسم مع التبديل الإجباري مع مجاميع أخرى كالكورانجين.",
      en: "High resistance risk (kdr mutation). Limit to 2 sprays per year; rotate with diamides or spinosyns.",
    },
    algerianAgroTip: {
      fr: "Arme de premier secours pour stopper une attaque massive de noctuelles défoliatrices ou de criquets en Grandes Cultures et Maraîchage.",
      ar: "سلاح التدخل السريع لمكافحة الهجمات الكثيفة للديدان القارضة أو الجراد في الحبوب والزراعات الحقلية.",
      en: "Primary emergency knockdown tool against sudden caterpillar or locust swarms in cereal fields.",
    },
  },

  {
    id: 'chlorantraniliprole',
    substanceKey: 'chlorantraniliprole',
    nameFr: 'Chlorantraniliprole (Diamide anthranilique)',
    nameAr: 'كلورانترانيليبرول (كوراجين)',
    nameEn: 'Chlorantraniliprole',
    type: 'insecticide',
    groupCode: 'IRAC 28',
    groupFamily: 'Diamides anthraniliques (Modulateurs des récepteurs de la ryanodine)',
    targetSite: 'Récepteurs de la ryanodine (RyR) du réticulum sarcoplasmique',
    targetSiteAr: 'مستقبلات الريانودين (RyR) في العضلات',
    mobility: 'translaminar',
    actionSpeed: 'fast',
    knockdownEffect: false,
    rainfastnessHours: 2,
    resistanceRisk: 'medium',
    summary: {
      fr: "Active sélectivement les récepteurs à la ryanodine des muscles d'insectes, vidant les réserves intracellulaires de calcium (Ca²⁺). Provoque la contraction spasmodique permanente des muscles, l'arrêt immédiat de l'alimentation en 15 minutes et la mort.",
      ar: "ينشط مستقبلات الريانودين في عضلات يرقات الحشرات، مما يؤدي إلى استنزاف مخزون الكالسيوم الداخلي، وتقلص مستمر للعضلات، وتوقف فوري للتغذية في 15 دقيقة وموت اليرقة.",
      en: "Binds to insect ryanodine receptors, unleashing uncontrolled intracellular calcium release from muscle stores, causing muscular paralysis, feeding cessation within minutes, and death.",
    },
    howItWorksSteps: [
      {
        step: 1,
        title: { fr: "Ingestion translaminaire & Ovi-larvicide", ar: "الابتلاع والتأثير على البيض واليرقات", en: "Ingestion & Ovi-larvicidal Action" },
        desc: {
          fr: "Agit par ingestion (très puissant) et contact. Pénètre dans les feuilles et détruit les larves néonates dès l'éclosion du chorion.",
          ar: "يعمل بالابتلاع بقوة والتلامس. يمتص عبر الأوراق ويقضي على اليرقات حديثة الفقس أثناء خروجها من البيضة.",
          en: "Potent ingestion and contact action; penetrates leaf tissue to kill hatching larvae upon eggshell chewing.",
        },
      },
      {
        step: 2,
        title: { fr: "Ouverture des canaux calciques RyR", ar: "فتح قنوات الكالسيوم العضلية", en: "Ryanodine Activation" },
        desc: {
          fr: "Se fixe spécifiquement sur le récepteur RyR des lépidoptères, provoquant une fuite incontrôlée de calcium Ca²⁺ dans le cytosol.",
          ar: "يرتبط بمستقبلات الريانودين مسبباً تدفقاً هائلاً وغير منضبط لأيونات الكالسيوم داخل خلايا العضلات.",
          en: "Stimulates ryanodine receptors, dumping internal calcium reserves into muscle cells.",
        },
      },
      {
        step: 3,
        title: { fr: "Tétanie musculaire & Arrêt de nutrition", ar: "تشنج العضلات وتوقف التغذية", en: "Muscle Rigidity & Cessation" },
        desc: {
          fr: "Les mandibules et le tube digestif se tétanisent. La chenille cesse instantanément de dévorer la feuille ou de forer le fruit.",
          ar: "تتشنج الفكوك وعضلات اليرقة وتتوقف تماماً عن ثقب الثمار أو قرض الأوراق خلال ربع ساعة.",
          en: "Mandibles and gut muscles freeze; caterpillar stops damaging fruits and leaves within 15 minutes.",
        },
      },
      {
        step: 4,
        title: { fr: "Élimination sélective sans danger auxiliaires", ar: "موت بطيء مع أمان للأعداء الحيوية", en: "Safe Selective Elimination" },
        desc: {
          fr: "Mort finale en 2-3 jours. Totalement inoffensif pour les abeilles, bourdons et insectes utiles (faible affinité pour les RyR mammifères/pollinisateurs).",
          ar: "موت كامل خلال 2-3 أيام، مع أمان تام ومثالي للنحل والمفترسات الطبيعية والأعداء الحيوية.",
          en: "Target dies in 2-3 days while completely sparing honeybees, predatory mites, and beneficial insects.",
        },
      },
    ],
    pestOrDiseaseSymptoms: {
      fr: "Les chenilles de Tuta absoluta, Helicoverpa et Carpocapse se rétractent, noircissent sans grossir et sèchent sur place sans pénétrer dans les fruits.",
      ar: "تنكمش يرقات التوتا أبسولوتا والدودة الخضراء وتسود وتجف مكانها دون أن تتمكن من ثقب حبات الطماطم أو التفاح.",
      en: "Caterpillars retract, turn lethargic, and desiccate without burrowing deeper into tomatoes or apples.",
    },
    optimalConditions: {
      idealTemp: '15 °C à 32 °C',
      tempMinC: 10,
      tempMaxC: 38,
      waterPhAdvice: "Très stable sur une large plage de pH (4 à 9). Idéal pour les eaux dures algériennes.",
      adjuvantOrMixing: "Très grande miscibilité avec la plupart des fongicides et engrais foliaires.",
      solarOrTimeOfDay: "Appliquer dès la détection des premiers vols ou pontes (piégeage phéromone) avant pénétration dans le fruit.",
    },
    resistanceManagement: {
      fr: "Maximum 2 applications par cycle de culture. Alterner avec spinosad (IRAC 5) ou émamectine (IRAC 6).",
      ar: "أقصى حد رشتين في الموسم. يجب التناوب مع السبيوساد أو الإمامكتين لتفادي مناعة التوتا أبسولوتا.",
      en: "Maximum 2 sprays per crop cycle; alternate with spinosyns or avermectins.",
    },
    algerianAgroTip: {
      fr: "Le standard de référence n°1 contre Tuta absoluta sur tomate industrielle et sous serre en Algérie, respectant la faune auxiliaire.",
      ar: "المعيار المرجعي الأول لمكافحة توتا أبسولوتا في طماطم التحويل والبيوت المحمية في الجزائر مع حماية الحشرات النافعة.",
      en: "The #1 gold-standard treatment against Tuta absoluta in Algerian open field and greenhouse tomato crops.",
    },
  },

  // =========================================================================
  // 2. FUNGICIDES
  // =========================================================================
  {
    id: 'mancozebe',
    substanceKey: 'mancozebe',
    nameFr: 'Mancozèbe (Dithiocarbamate multisite)',
    nameAr: 'مانكوزيب (مبيد فطري متعدد المواقع)',
    nameEn: 'Mancozeb',
    type: 'fungicide',
    groupCode: 'FRAC M3',
    groupFamily: 'Dithiocarbamates et précurseurs (Complexes Zinc-Manganèse)',
    targetSite: 'Inhibition non-spécifique multisite des enzymes à groupements thiols (-SH)',
    targetSiteAr: 'تثبيط غير نوعي متعدد المواقع لإنزيمات السيتوبلازم الفطرية (-SH)',
    mobility: 'contact',
    actionSpeed: 'fast',
    knockdownEffect: false,
    rainfastnessHours: 3,
    curativeWindowHours: 0, // strict preventive
    resistanceRisk: 'low',
    summary: {
      fr: "Fongicide protecteur multisite de contact. Se décompose à la surface des feuilles en isothiocyanates qui inactivent simultanément de multiples enzymes respiratoires et le métabolisme lipidique des spores fongiques, empêchant toute germination.",
      ar: "مبيد وقائي سطحي متعدد المواقع. يتحلل على سطح الورقة ليعطل عدداً كبيراً من الإنزيمات الحيوية للجراثيم الفطرية، مما يمنع إنباتها واختراقها لأنسجة النبات نهائياً.",
      en: "Broad-spectrum multisite contact protectant. Releases isothiocyanate radicals that deactivate multiple sulfhydryl-containing enzymes, completely blocking fungal spore germination.",
    },
    howItWorksSteps: [
      {
        step: 1,
        title: { fr: "Bouclier protecteur de surface", ar: "درع وقائي سطحي", en: "Surface Protective Film" },
        desc: {
          fr: "Forme un film résiduel microscopique homogène sur la cuticule des feuilles et des tiges.",
          ar: "يشكل طبقة مجهرية متجانسة تغطي سطح الأوراق والسوق لحمايتها من السقوط المباشر للجراثيم.",
          en: "Coats leaf and fruit surfaces with an uninterrupted protective barrier layer.",
        },
      },
      {
        step: 2,
        title: { fr: "Libération d'agents actifs sous humidité", ar: "تحرر المادة الفعالة مع الرطوبة", en: "Moisture-Triggered Release" },
        desc: {
          fr: "En présence de rosée ou de gouttes de pluie (conditions d'infection), le mancozèbe libère des groupements isothiocyanates hautement réactifs.",
          ar: "مع توفر قطرات الندى أو المطر (شروط العدوى الفطرية)، يحرر جزيئات نشطة تتفاعل فوراً مع بوغ الفطر.",
          en: "Moisture and dew activate the release of reactive isothiocyanate groups around landing spores.",
        },
      },
      {
        step: 3,
        title: { fr: "Inhibition enzymatique multiple (-SH)", ar: "تعطيل إنزيمات تنفس الفطر", en: "Multisite Enzyme Disruption" },
        desc: {
          fr: "Attaque simultanée du cycle de Krebs, de la glycolyse et de la production d'ATP dans le cytoplasme fongique.",
          ar: "تهاجم المادة مراكز إنتاج الطاقة (دورة كريبس) والتنفس الخلوي داخل الفطر في آن واحد.",
          en: "Simultaneously shuts down ATP synthesis, glycolysis, and membrane amino acid transport.",
        },
      },
      {
        step: 4,
        title: { fr: "Avortement de la germination", ar: "إجهاض إنبات البوغ الفطري", en: "Spore Germination Failure" },
        desc: {
          fr: "Le tube germinatif du champignon ne peut pas se développer ni pénétrer les stomates de la plante.",
          ar: "يعجز أنبوب إنبات الفطر عن التطور أو اختراق مسام وثغور الورقة، ويموت الفطر قبل إحداث أي إصابة.",
          en: "The fungal germ tube collapses before stomatal penetration, preventing any initial infection.",
        },
      },
    ],
    pestOrDiseaseSymptoms: {
      fr: "Les spores de mildiou, d'alternaria ou de septoriose sont tuées à l'atterrissage sur la feuille. Aucune tache d'huile ou nécrose n'apparaît.",
      ar: "موت جراثيم الميلديو، الألترناريا والسبتوريا بمجرد ملامستها للأوراق دون ظهور بقع زيتية أو لفحة.",
      en: "Spores of downy mildew, alternaria, and septoria die on impact; no lesions ever develop.",
    },
    optimalConditions: {
      idealTemp: '10 °C à 25 °C',
      tempMinC: 5,
      tempMaxC: 30,
      waterPhAdvice: "Stable à pH neutre (6.0 - 7.0). Éviter les mélanges avec les bouillies très alcalines (chaux vive).",
      adjuvantOrMixing: "Partenaire de mélange indispensable avec les fongicides systémiques (métalaxyl, cymoxanil, azoxystrobine) pour protéger contre les résistances.",
      solarOrTimeOfDay: "Appliquer AVANT l'épisode pluvieux ou le brouillard matinal (fongicide 100% préventif).",
    },
    resistanceManagement: {
      fr: "Risque de résistance nul (FRAC M3). Utilisable de manière répétée comme partenaire de sécurisation des molécules uni-sites.",
      ar: "خطر انعدام الفعالية منعدم تماماً (FRAC M3) لتأثيره على مواقع متعددة. الشريك الأفضل عالمياً لحماية المبيدات الجهازية من المقاومة.",
      en: "Zero resistance risk (FRAC M3). Essential tank-mix partner to protect single-site fungicides.",
    },
    algerianAgroTip: {
      fr: "La pierre angulaire de la protection contre le mildiou de la pomme de terre à Oued Souf, Mascara et Ain Defla.",
      ar: "حجر الزاوية في برنامج حماية البطاطا من البياض الزغبي في وادي سوف، معسكر وعين الدفلى.",
      en: "The foundational backbone for potato late blight prevention across Algerian production basins.",
    },
  },

  {
    id: 'metalaxyl-m',
    substanceKey: 'metalaxyl-m',
    nameFr: 'Métalaxyl-M / Méfénoxam (Acylalanine systémique)',
    nameAr: 'ميتالاكسيل-إم / ميفينوكسام (أسيلا لالانين)',
    nameEn: 'Metalaxyl-M',
    type: 'fungicide',
    groupCode: 'FRAC 4',
    groupFamily: 'Acylalanines / Phénylamides',
    targetSite: 'Inhibition de l’ARN polymérase I (synthèse de l’ARN ribosomique des Oomycètes)',
    targetSiteAr: 'تثبيط إنزيم ARN بوليميراز 1 المسؤول عن تكاثر الفطريات البيضية',
    mobility: 'xylem-systemic',
    actionSpeed: 'fast',
    knockdownEffect: false,
    rainfastnessHours: 1,
    curativeWindowHours: 48,
    resistanceRisk: 'high',
    summary: {
      fr: "Fongicide systémique puissant spécifique des Oomycètes (Mildiou, Phytophthora, Pythium). Pénètre rapidement et bloque la synthèse des ARN ribosomiques par l'ARN polymérase I, stoppant la croissance du mycélium et la sporulation.",
      ar: "مبيد فطري جهازي متخصص في مكافحة الفطريات البيضية (البياض الزغبي وعفن الجذور). يمتص بسرعة فائقة ويوقف تكوين الأحماض النووية للفطر مما يوقف نمو وتجرثم الفطر من الداخل.",
      en: "Specific systemic oomycete fungicide. Rapidly absorbed and transported acropetally to inhibit RNA polymerase I, halting ribosomal RNA synthesis and suppressing mycelial colonisation.",
    },
    howItWorksSteps: [
      {
        step: 1,
        title: { fr: "Pénétration éclair (< 30 min)", ar: "امتصاص فائق السرعة", en: "Rapid Penetration" },
        desc: {
          fr: "Pénètre la cuticule foliaire en moins de 30 minutes, devenant totalement résistant aux fortes pluies et au lessivage.",
          ar: "ينفذ عبر بشرة الأوراق في أقل من 30 دقيقة، مما يجعله آمناً ضد الغسيل بالأمطار الغزيرة.",
          en: "Penetrates leaf tissues in under 30 minutes, securing complete rainfastness.",
        },
      },
      {
        step: 2,
        title: { fr: "Transport ascendant vers les néo-organes", ar: "انتقال صاعد لحماية النموات الجديدة", en: "Acropetal Xylem Transport" },
        desc: {
          fr: "Remonte par le flux de sève brute (xylème) vers les jeunes feuilles et pousses formées après le traitement.",
          ar: "ينتقل مع عصارة الخشب نحو القمم النامية والأوراق الجديدة التي ظهرت بعد عملية الرش.",
          en: "Flows upward through the transpiration stream to protect un-sprayed new growth.",
        },
      },
      {
        step: 3,
        title: { fr: "Blocage de l'ARN polymérase I", ar: "تثبيط تخليق البروتين الفطري", en: "RNA Polymerase I Inactivation" },
        desc: {
          fr: "Inhibe l'incorporation de l'uridine dans l'ARN ribosomal du champignon oomycète, bloquant sa reproduction.",
          ar: "يعطل بناء الحمض النووي الريبوزي للفطر مما يمنع إنتاج البروتينات الضرورية لحياة الفطر.",
          en: "Blocks uridine incorporation into rRNA, terminating fungal cell multiplication.",
        },
      },
      {
        step: 4,
        title: { fr: "Action curative 'Stop' (24-48h)", ar: "تأثير علاجي فوري وإيقاف العدوى", en: "Curative Stop Action" },
        desc: {
          fr: "Détruit le mycélium déjà installé à l'intérieur des tissus végétaux s'il est appliqué dans les 48 heures suivant la contamination.",
          ar: "يقضي على ميسليوم الفطر المتسلل داخل أنسجة النبات إذا رُش خلال 48 ساعة من حدوث العدوى.",
          en: "Eradicates incubating mycelium inside plant mesophyll when applied within 48h of rain contamination.",
        },
      },
    ],
    pestOrDiseaseSymptoms: {
      fr: "Assèchement immédiat des taches de mildiou, disparition du feutrage blanc sporulant sur la face inférieure des feuilles de pomme de terre et tomate.",
      ar: "جفاف سريع لبقع الميلديو الزيتية واختفاء الزغب الأبيض الحامل للأبواغ من السطح السفلي للأوراق.",
      en: "Rapid drying of oily mildew lesions; white sporulating down on leaf undersides vanishes.",
    },
    optimalConditions: {
      idealTemp: '12 °C à 26 °C',
      tempMinC: 8,
      tempMaxC: 30,
      waterPhAdvice: "Compatible avec tous les pH agricoles courants (5 à 8).",
      adjuvantOrMixing: "En Algérie, toujours commercialisé ou mélangé avec du mancozèbe (Ridomil Gold) pour empêcher la sélection de souches résistantes.",
      solarOrTimeOfDay: "Idéal dès qu'une période pluvieuse favorable au mildiou survient.",
    },
    resistanceManagement: {
      fr: "Risque de résistance très élevé (FRAC 4 - mutation unisite). Ne jamais appliquer le métalaxyl seul. Maximum 2 à 3 applications par an.",
      ar: "خطر مقاومة مرتفع جداً (طفرة موقع وحيد). يُمنع منعاً باتاً رشه منفرداً بدون شريك مانكوزيب. أقصى حد 3 رشات في السنة.",
      en: "High single-site resistance risk (FRAC 4). Never apply solo; max 2-3 sprays per season co-formulated with mancozeb.",
    },
    algerianAgroTip: {
      fr: "Le traitement curatif de référence lors des épisodes pluvieux de printemps sur pomme de terre primeur et de saison.",
      ar: "العلاج الاستدراكي الأقوى عند نزول أمطار الربيع على محاصيل البطاطا المبكرة والموسمية.",
      en: "The primary systemic rescue treatment during spring rain events on potato crops.",
    },
  },

  {
    id: 'tebuconazole',
    substanceKey: 'tebuconazole',
    nameFr: 'Tébuconazole (Triazole DMI systémique)',
    nameAr: 'تيبوكونازول (تريازول جهازي DMI)',
    nameEn: 'Tebuconazole',
    type: 'fungicide',
    groupCode: 'FRAC 3',
    groupFamily: 'Triazoles / DMI (Inhibiteurs de la déméthylation des stérols)',
    targetSite: 'Inhibition de la C14-déméthylase (CYP51 / biosynthèse de l’ergostérol)',
    targetSiteAr: 'تثبيط إنزيم C14-ديميثيلاز المسؤول عن غشاء الخلية الفطرية',
    mobility: 'xylem-systemic',
    actionSpeed: 'moderate',
    knockdownEffect: false,
    rainfastnessHours: 2,
    curativeWindowHours: 72,
    resistanceRisk: 'medium',
    summary: {
      fr: "Fongicide systémique polyvalent à large spectre. Bloque l'enzyme CYP51 nécessaire à la synthèse de l'ergostérol (constituant essentiel de la membrane fongique), provoquant la désintégration des parois du champignon.",
      ar: "مبيد فطري جهازي واسع الطيف. يعطل إنزيم CYP51 المسؤول عن بناء الإرغوستيرول في جدران خلايا الفطر، مما يسبب تمزق أغشيتها وموت الفطريات الزقية والدعامية.",
      en: "Broad-spectrum xylem-systemic DMI fungicide. Inhibits CYP51 sterol 14-demethylase, disrupting fungal ergosterol biosynthesis and cellular membrane integrity.",
    },
    howItWorksSteps: [
      {
        step: 1,
        title: { fr: "Absorption & Répartition uniforme", ar: "الامتصاص والتوزيع المتوازن", en: "Foliar Uptake & Translocation" },
        desc: {
          fr: "Pénètre rapidement dans les feuilles de céréales ou d'arbres fruitiers et se diffuse de façon acropétale vers le sommet du végétal.",
          ar: "يمتص بسرعة داخل الأوراق وينتقل بانتظام نحو أطراف النبات وسنابل الحبوب.",
          en: "Rapidly absorbed by leaves and stems, translocating acropetally to protect newly expanding leaves and cereal ears.",
        },
      },
      {
        step: 2,
        title: { fr: "Blocage de l'enzyme CYP51", ar: "تثبيط إنزيم بناء الأغشية", en: "Ergosterol Synthesis Arrest" },
        desc: {
          fr: "Se lie à l'atome de fer du cytochrome P450 fungal, empêchant la déméthylation du lanostérol en ergostérol.",
          ar: "يرتبط بإنزيم السيتوكروم الفطري ويمنع تحويل اللانوستيرول إلى إرغوستيرول أساسي للغشاء.",
          en: "Binds to fungal CYP51 heme iron, preventing conversion of lanosterol into functional ergosterol.",
        },
      },
      {
        step: 3,
        title: { fr: "Accumulation de stérols toxiques & Fuite cellulaire", ar: "تراكم الستيرولات السامة وتمزق الغشاء", en: "Membrane Lysis & Cell Leakage" },
        desc: {
          fr: "L'absence d'ergostérol déstabilise la membrane fongique : perte de perméabilité, fuite des électrolytes et mort cellulaire.",
          ar: "يؤدي غياب الإرغوستيرول إلى فقدان صلابة الغشاء الفطري وتسرب السوائل الخلوية وتلف الفطر.",
          en: "Unstable, defective fungal cell membranes leak vital nutrients and collapse under osmotic pressure.",
        },
      },
      {
        step: 4,
        title: { fr: "Excellente action curative (jusqu'à 3-4 jours)", ar: "فعالية علاجية ممتدة حتى 3-4 أيام", en: "Extended Curative Stop" },
        desc: {
          fr: "Stoppe net les rouilles (brune/jaune), l'oïdium et la septoriose même si l'infection est déjà installée.",
          ar: "يوقف تماماً تطور الصدأ، البياض الدقيقي والسبتوريا حتى بعد بداية انتشار الخيوط الفطرية.",
          en: "Arrests existing rust, powdery mildew, and septoria infections up to 72h after initial penetration.",
        },
      },
    ],
    pestOrDiseaseSymptoms: {
      fr: "Dessèchement des pustules orangées de rouille sur blé ; arrêt de l'extension des taches nécrotiques de septoriose.",
      ar: "جفاف بثور الصدأ البرتقالية والصفراء على أوراق القمح، وتوقف تمدد بقع السبتوريا المحروقة.",
      en: "Orange rust pustules dry up into sterile black specks; septoria spots cease enlargement.",
    },
    optimalConditions: {
      idealTemp: '14 °C à 28 °C',
      tempMinC: 8,
      tempMaxC: 32,
      waterPhAdvice: "Très stable à pH 5.0 - 8.0.",
      adjuvantOrMixing: "Synergie remarquable en association avec une strobilurine (azoxystrobine) pour une protection céréale complète.",
      solarOrTimeOfDay: "Appliquer au stade montaison à dernière feuille étalée / épiaison sur blé dur et orge.",
    },
    resistanceManagement: {
      fr: "Risque de résistance moyen (mécanisme quantitatif / déplacement de sensibilité). Limiter à 2 passages de triazoles par campagne et alterner les familles.",
      ar: "خطر مقاومة متوسط. يجب عدم تجاوز معاملتين بالتريازول في الموسم، مع التناوب مع عائلات أخرى كالستروبيلورينات.",
      en: "Moderate resistance risk (quantitative shifts). Limit to 2 applications per cereal season and rotate with multi-sites or QoIs.",
    },
    algerianAgroTip: {
      fr: "Le pilier central de la protection des céréales (blé dur/tendre) contre la rouille jaune et la septoriose dans les plaines de Sétif, Constantine et Guelma.",
      ar: "الركيزة الأساسية لحماية القمح والصلب واللين ضد الصدأ الأصفر والسبتوريا في سهول سطيف، قسنطينة وقالمة.",
      en: "The primary cereal fungicide against yellow rust and septoria in High Plateaus and eastern plains.",
    },
  },

  {
    id: 'azoxystrobine',
    substanceKey: 'azoxystrobine',
    nameFr: 'Azoxystrobine (Strobilurine QoI)',
    nameAr: 'أزوكسيستروبين (ستروبيلورين QoI)',
    nameEn: 'Azoxystrobin',
    type: 'fungicide',
    groupCode: 'FRAC 11',
    groupFamily: 'Strobilurines / QoI (Inhibiteurs du complexe III mitochondrial)',
    targetSite: 'Site Qo du cytochrome bc1 (complexe III de la chaîne respiratoire mitochondriale)',
    targetSiteAr: 'الموقع Qo في السيتوكروم bc1 (معقد إنتاج الطاقة التنفسية III)',
    mobility: 'translaminar',
    actionSpeed: 'fast',
    knockdownEffect: false,
    rainfastnessHours: 2,
    curativeWindowHours: 24,
    resistanceRisk: 'high',
    summary: {
      fr: "Inhibiteur de la respiration cellulaire fongique. Bloque le complexe III des mitochondries au site Qo, arrêtant net la production d'ATP chez le champignon. Possède également un effet physiologique 'vert' stimulant le rendement.",
      ar: "مبيد فطري يثبط التنفس الخلوي للفطريات. يغلق معقد الميتوكوندريا III مانعاً إنتاج طاقة ATP، كما يمنح النبات تأثيراً فيزيولوجياً مخضراً (Greening effect) يرفع المحصول.",
      en: "Mitochondrial respiration inhibitor. Binds to the Qo site of cytochrome bc1 (Complex III), stopping ATP synthesis in fungal spores and providing a yield-boosting physiological greening effect.",
    },
    howItWorksSteps: [
      {
        step: 1,
        title: { fr: "Diffusion translaminaire & Effet vapeur", ar: "انتشار عبر الورقة وتأثير بخاري موضعي", en: "Translaminar Distribution" },
        desc: {
          fr: "Pénètre rapidement les deux faces foliaires et diffuse de manière homogène dans le mésophylle.",
          ar: "ينفذ عبر سطحي الورقة ويتوزع بانتظام داخل الأنسجة الداخلية مع حركة بخارية موضعية.",
          en: "Rapidly penetrates both leaf surfaces with localized vapor redistribution.",
        },
      },
      {
        step: 2,
        title: { fr: "Blocage de la production d'ATP", ar: "إيقاف إنتاج الطاقة ATP", en: "Cellular Energy Shutdown" },
        desc: {
          fr: "Se fixe sur le cytochrome bc1, empêchant le transfert des électrons dans la chaîne respiratoire.",
          ar: "يرتبط بالسيتوكروم ويعطل انتقال الإلكترونات، فتنعدم الطاقة الحيوية اللازمة لنمو الفطر.",
          en: "Blocks electron transfer at the Qo site, depriving the fungal cell of metabolic energy.",
        },
      },
      {
        step: 3,
        title: { fr: "Inhibition totale de la germination des spores", ar: "شلل تام لإنبات الأبواغ", en: "Complete Spore Inactivation" },
        desc: {
          fr: "Action préventive maximale : les spores atterrissant sur la feuille ne peuvent libérer d'énergie pour germer.",
          ar: "تأثير وقائي خارق: تفشل الأبواغ الساقطة في توليد الطاقة لإنبات أنابيبها وتتلاشى فوراً.",
          en: "Unmatched preventive power: landing spores cannot generate energy to initiate germ tubes.",
        },
      },
      {
        step: 4,
        title: { fr: "Effet 'Greening' sur la plante", ar: "التأثير الأخضر وتأخير الشيخوخة", en: "Physiological Greening Effect" },
        desc: {
          fr: "Ralentit la biosynthèse d'éthylène dans la plante, prolonge la photosynthèse et améliore le remplissage des grains/fruits.",
          ar: "يقلل من هرمون الإيثيلين المسبب للشيخوخة، مما يطيل عمر الورقة الخضراء ويزيد امتلاء الحبوب والثمار.",
          en: "Reduces plant ethylene production, prolongs active green photosynthesis and boosts grain filling.",
        },
      },
    ],
    pestOrDiseaseSymptoms: {
      fr: "Protection intégrale contre l'oïdium, les rouilles, l'anthracnose et l'alternaria avec un feuillage visiblement plus vert et vigoureux.",
      ar: "حماية شاملة ضد البياض الدقيقي، الصدأ، الأنثراكنوز والألترناريا مع أوراق أكثر خضرة وصحة ونشاطاً.",
      en: "Total prevention against powdery mildew, rusts, anthracnose, and alternaria with visibly greener foliage.",
    },
    optimalConditions: {
      idealTemp: '12 °C à 30 °C',
      tempMinC: 8,
      tempMaxC: 35,
      waterPhAdvice: "Stable entre pH 5.0 et 8.5.",
      adjuvantOrMixing: "Toujours associer en mélange avec un fongicide multisite (mancozèbe, cuivre) ou triazole pour sécuriser contre la mutation G143A.",
      solarOrTimeOfDay: "Appliquer en préventif dès l'apparition des premières conditions d'infection.",
    },
    resistanceManagement: {
      fr: "Risque de résistance très élevé (mutation qualitative G143A). Maximum 2 applications par campagne, toujours en alternance ou association.",
      ar: "خطر مقاومة شديد (طفرة G143A المفاجئة). حد أقصى رشتين في الموسم، دائماً بالتناوب أو الخلط مع مبيد multisite.",
      en: "Very high single-step resistance risk (G143A mutation). Maximum 2 sprays/season strictly co-applied or rotated.",
    },
    algerianAgroTip: {
      fr: "Apporte une excellente protection des feuilles supérieures (F1/F2) et de l'épi du blé dur pour maximiser le poids de mille grains (PMG).",
      ar: "حماية فائقة لورقة العلم وسنبلة القمح الصلب لرفع الوزن النوعي للحبوب (PMG) في مختلف ولايات الوطن.",
      en: "Maximizes grain quality and thousand-grain weight (TKW) on durum wheat flag leaves across Algeria.",
    },
  },

  {
    id: 'cuivre',
    substanceKey: 'cuivre',
    nameFr: 'Cuivre (Bouillie bordelaise / Oxychlorure / Hydroxyde)',
    nameAr: 'النحاس (العصارة البوردية / أوكسي كلوريد النحاس)',
    nameEn: 'Copper (Bordeaux mixture / Oxychloride)',
    type: 'fungicide',
    groupCode: 'FRAC M1',
    groupFamily: 'Composés minéraux inorganiques du cuivre',
    targetSite: 'Dénaturation non-spécifique des protéines et enzymes cellulaires fongiques et bactériennes',
    targetSiteAr: 'تخثير وتفكيك بروتينات وإنزيمات الخلايا الفطرية والبكتيرية',
    mobility: 'contact',
    actionSpeed: 'fast',
    knockdownEffect: false,
    rainfastnessHours: 3,
    curativeWindowHours: 0,
    resistanceRisk: 'low',
    summary: {
      fr: "Fongicide et bactéricide minéral multisite de référence. Les ions Cu²⁺ libérés se fixent sur les groupements carboxyles et thiols des protéines du pathogène, provoquant la précipitation et la dénaturation irréversible des enzymes.",
      ar: "مبيد فطري وبكتيري معدني وقائي واسع الاستخدام. تطلق شوارد النحاس Cu²⁺ لتلتصق ببروتينات الفطريات والبكتيريا مما يسبب تخثرها وموتها الفوري قبل اختراق النبات.",
      en: "Broad-spectrum mineral contact fungicide and bactericide. Released Cu²⁺ ions bind to microbial protein carboxyl and thiol groups, denaturing enzymes and lysing spores.",
    },
    howItWorksSteps: [
      {
        step: 1,
        title: { fr: "Dépôt minéral résistant", ar: "ترسيب معدني ملتصق", en: "Mineral Surface Deposit" },
        desc: {
          fr: "Forme un dépôt d'ions cuivre insoluble fixé à la surface des écorces, feuilles et rameaux.",
          ar: "يشكل طبقة صلبة من جزيئات النحاس الملتصقة بسطح الأغصان، الجذوع والأوراق.",
          en: "Forms a tenacious reservoir of insoluble copper salts adhering to plant bark and foliage.",
        },
      },
      {
        step: 2,
        title: { fr: "Libération progressive d'ions Cu²⁺", ar: "تحرر تدريجي لشوارد النحاس", en: "Progressive Cu²⁺ Release" },
        desc: {
          fr: "Au contact de l'humidité et des sécrétions acides des spores, les ions Cu²⁺ solubles se libèrent progressivement.",
          ar: "عند هطول الأمطار أو توفر الرطوبة، تذوب شوارد Cu²⁺ بتركيز كافٍ لقتل أي ميكروب مجاور.",
          en: "Moisture and fungal spore exudates slowly solubilize free bioactive Cu²⁺ ions.",
        },
      },
      {
        step: 3,
        title: { fr: "Précipitation des protéines & Dénaturation", ar: "تخثير البروتينات وتدمير الأغشية", en: "Protein Coagulation & Lysis" },
        desc: {
          fr: "Les ions Cu²⁺ pénètrent les spores et bactéries, dénaturent les protéines membranaires et bloquent les enzymes respiratoires.",
          ar: "تخترق شوارد النحاس غشاء الفطر أو البكتيريا وتخثر البروتينات الإنزيمية مما يوقف التنفس فوراً.",
          en: "Cu²⁺ ions penetrate spore walls, precipitating enzymes and destroying membrane integrity.",
        },
      },
      {
        step: 4,
        title: { fr: "Action bactéricide unique", ar: "مكافحة فريدة للأمراض البكتيرية", en: "Dual Bactericidal Shield" },
        desc: {
          fr: "Seule solution homologuée efficace contre les bactéries végétales (Feu bactérien, Pseudomonas, Xanthomonas).",
          ar: "المبيد المعتمد والفعال لمكافحة البكتيريا الزراعية كاللفحة النارية والتبقعات البكتيرية.",
          en: "Provides essential preventive control against phytopathogenic bacteria (Erwinia, Pseudomonas).",
        },
      },
    ],
    pestOrDiseaseSymptoms: {
      fr: "Prévention complète de la cloque du pêcher, de l'œil de paon de l'olivier, du mildiou de la vigne et du chancre bactérien.",
      ar: "وقاية شاملة من تجعد أوراق الخوخ، عين الطاووس في الزيتون، بياض الكرمة واللفحة النارية في التفاحيات.",
      en: "Total prevention of peach leaf curl, olive peacock spot, downy mildew, and bacterial canker.",
    },
    optimalConditions: {
      idealTemp: '8 °C à 22 °C',
      tempMinC: 3,
      tempMaxC: 28,
      waterPhAdvice: "Ne pas acidifier excessivement la bouillie (risque de phytotoxicité par libération brutale de cuivre libre).",
      adjuvantOrMixing: "Éviter de mélanger avec des acides forts ou des produits contenant du phosphonate.",
      solarOrTimeOfDay: "Traitements d'automne (chute des feuilles) et d'hiver (gonflement des bourgeons) indispensables sur arboriculture.",
    },
    resistanceManagement: {
      fr: "Risque de résistance nul (FRAC M1). Utilisé depuis plus de 130 ans sans aucune apparition de résistance fongique.",
      ar: "خطر المقاومة منعدم تماماً (FRAC M1). مستخدم منذ أكثر من 130 عاماً دون أي مقاومة فطرية مسجلة.",
      en: "Zero resistance risk (FRAC M1). Reliable multisite standard with over a century of proven efficacy.",
    },
    algerianAgroTip: {
      fr: "Le traitement d'automne et d'hiver obligatoire sur oliviers (Kabylie, Sig, Guelma) contre l'œil de paon et sur agrumes contre la gommose.",
      ar: "المعاملة الخريفية والشتوية الإجبارية للزيتون في القبائل وسيق وقالمة ضد عين الطاووس، وللحمضيات ضد التصمغ.",
      en: "Indispensable autumn and winter sanitation spray for Algerian olive orchards and citrus groves.",
    },
  },

  // =========================================================================
  // 3. HERBICIDES
  // =========================================================================
  {
    id: 'glyphosate',
    substanceKey: 'glyphosate',
    nameFr: 'Glyphosate (Herbicide total systémique)',
    nameAr: 'غليفوسات (مبيد أعشاب كلي جهازي)',
    nameEn: 'Glyphosate',
    type: 'herbicide',
    groupCode: 'HRAC 9 (G)',
    groupFamily: 'Glycines substituées / Organophosphonates',
    targetSite: 'Inhibition de l’enzyme EPSPS (voie de biosynthèse du shikimate)',
    targetSiteAr: 'تثبيط إنزيم EPSPS في مسار الشيكيمات لبناء الأحماض الأمينية العطرية',
    mobility: 'full-systemic',
    actionSpeed: 'slow',
    knockdownEffect: false,
    rainfastnessHours: 4,
    resistanceRisk: 'medium',
    summary: {
      fr: "Herbicide total foliaire non sélectif à très forte systémie bidirectionnelle (xylème et phloème). Inhibe l'enzyme EPSP synthase dans la voie du shikimate, bloquant la synthèse des acides aminés aromatiques (phénylalanine, tyrosine, tryptophane) indispensables aux plantes.",
      ar: "مبيد أعشاب جهازي شامل غير اختياري ينتقل في كامل أجزاء النبتة صعوداً وهبوطاً. يثبط إنزيم EPSPS في مسار الشيكيمات مما يمنع بناء الأحماض الأمينية الأساسية ويؤدي لجفاف وتدمير الجذور والرايزومات بالكامل.",
      en: "Non-selective total systemic herbicide with full xylem and phloem mobility. Inhibits EPSP synthase in the shikimate pathway, starving plants of essential aromatic amino acids (Phe, Tyr, Trp).",
    },
    howItWorksSteps: [
      {
        step: 1,
        title: { fr: "Absorption foliaire & Migration descendante", ar: "الامتصاص والانتقال الشامل للجذور", en: "Foliar Uptake & Phloem Loading" },
        desc: {
          fr: "Absorbé uniquement par les parties vertes, pénètre dans le phloème et migre avec les sucres vers les racines profondes, rhizomes et tubercules de chiendent.",
          ar: "يمتص حصراً عبر الأجزاء الخضراء، وينتقل مع النسغ الكامل إلى أعماق الجذور والريزومات والدرنات التكاثرية.",
          en: "Absorbed exclusively by green foliage, loading into phloem to travel deeply into root systems and rhizomes.",
        },
      },
      {
        step: 2,
        title: { fr: "Blocage de l'enzyme EPSP synthase", ar: "تعطيل إنزيم EPSPS", en: "EPSPS Inhibition" },
        desc: {
          fr: "Se lie au site actif de l'enzyme EPSPS, stoppant net la production de préphénate et d'acides aminés aromatiques.",
          ar: "يغلق الموقع النشط لإنزيم EPSPS فيتوقف إنتاج الأحماض الأمينية الحيوية لبناء بروتينات النبات.",
          en: "Competitively blocks the EPSP synthase enzyme, terminating aromatic amino acid synthesis.",
        },
      },
      {
        step: 3,
        title: { fr: "Arrêt de la division cellulaire & Déplétion", ar: "توقف انقسام الخلايا ونضوب البروتينات", en: "Meristematic Starvation" },
        desc: {
          fr: "Les méristèmes apicaux et racinaires cessent toute croissance en 24 heures par manque de protéines et de lignine.",
          ar: "تتوقف القمم النامية في الأوراق والجذور عن الانقسام والنمو خلال 24 ساعة.",
          en: "Active growing points in roots and shoots halt cell division due to severe protein starvation.",
        },
      },
      {
        step: 4,
        title: { fr: "Flétrissement & Destruction complète du rhizome", ar: "اصفرار تدريجي وموت الجذور نهائياً", en: "Progressive Necrosis & Root Death" },
        desc: {
          fr: "Jaunissement progressif du feuillage en 5-10 jours, suivi du brunissement et de la pourriture irréversible des rhizomes sous terre en 14-21 jours.",
          ar: "اصفرار تدريجي للأوراق خلال 5-10 أيام، يتبعه تعفن كامل للجذور والرايزومات التحت أرضية في غضون 2-3 أسابيع.",
          en: "Foliar chlorosis appears in 5-10 days, followed by complete underground rhizome rot in 14-21 days.",
        },
      },
    ],
    pestOrDiseaseSymptoms: {
      fr: "Chlorose des jeunes pousses, rougissement des tiges de graminées vivaces, puis dessèchement total du chiendent et des adventices sans repousse.",
      ar: "اصفرار القمم النامية واحمرار أوراق النجيليات، يتبعه جفاف تام لعشبة النجم (النجيل) دون أي إعادة إنبات من الجذور.",
      en: "Gradual yellowing of shoot tips turning brown and brittle, with permanent elimination of Bermuda grass rhizomes.",
    },
    optimalConditions: {
      idealTemp: '16 °C à 28 °C',
      tempMinC: 10,
      tempMaxC: 32,
      waterPhAdvice: "Très sensible aux eaux dures et calcaires (les ions Ca²⁺ et Mg²⁺ inactivent la molécule). Ajouter 1-2% de sulfate d'ammonium ou un acidifiant.",
      adjuvantOrMixing: "Ne jamais mélanger avec des herbicides de contact brûlants (comme l'oxyfluorfène) qui empêcheraient la migration phloémienne.",
      solarOrTimeOfDay: "Appliquer sur adventices vertes et vigoureuses en pleine sève (éviter les périodes de sécheresse sévère).",
    },
    resistanceManagement: {
      fr: "Réservé au désherbage d'interculture, au défrichage ou au désherbage sous la ligne d'arbres avec buses caches. Ne jamais appliquer sur culture en place.",
      ar: "مخصص لتنظيف الأراضي البور قبل الغرس أو تحت الأشجار المثمرة مع حماية الساق. يُمنع رشه فوق المحاصيل الحقلية النامية.",
      en: "Use strictly for pre-planting knockdown or targeted shielded orchard floor cleanup. Never spray over standing crops.",
    },
    algerianAgroTip: {
      fr: "Le traitement le plus efficace contre le chiendent (*Cynodon dactylon*) appliqué à l'automne avant les labours de printemps.",
      ar: "العلاج الأكثر نجاعة للقضاء على النجيل المعمر (النجم) في الخريف قبل عمليات الحرث الربيعية في الأراضي الجزائرية.",
      en: "The definitive solution for perennial Bermuda grass eradication when applied in autumn.",
    },
  },

  {
    id: '2,4-d',
    substanceKey: '2,4-d',
    nameFr: '2,4-D (Auxine de synthèse / Hormone herbicide)',
    nameAr: '2,4-D (أوكسين اصطناعي / هرمون مبيد للأعشاب)',
    nameEn: '2,4-D (Synthetic Auxin)',
    type: 'herbicide',
    groupCode: 'HRAC 4 (O)',
    groupFamily: 'Acides phénoxycarboxyliques (Auxines synthétiques mimant l’AIA)',
    targetSite: 'Perturbation de la régulation de l’acide indole-acétique (AIA / Auxine végétale)',
    targetSiteAr: 'اختلال تنظيمي هرموني يحاكي هرمون النمو الأوكسين (AIA)',
    mobility: 'full-systemic',
    actionSpeed: 'fast',
    knockdownEffect: false,
    rainfastnessHours: 2,
    resistanceRisk: 'low',
    summary: {
      fr: "Herbicide sélectif des céréales contre les dicotylédones. Mime l'hormone de croissance naturelle auxine à concentration léthale, provoquant une élongation cellulaire anarchique, la torsion des tiges (épinastie), l'éclatement des vaisseaux et la mort rapide des adventices à larges feuilles.",
      ar: "مبيد أعشاب اختياري للحبوب ضد الأعشاب عريضة الأوراق. يحاكي هرمون النمو الطبيعي بتركيز سام مما يسبب نمواً عشوائياً وتلوياً شديداً للسيقان والأوراق وانفجار الأوعية الناقلة وموت العشبة الضارة مع الحفاظ على القمح والشعير.",
      en: "Selective hormone herbicide for cereals against broadleaf weeds. Mimics natural auxin at toxic levels, causing uncontrolled cell elongation, stem curling (epinasty), vascular collapse, and death.",
    },
    howItWorksSteps: [
      {
        step: 1,
        title: { fr: "Absorption foliaire sélective", ar: "امتصاص ورقي اختياري", en: "Selective Foliar Penetration" },
        desc: {
          fr: "Pénètre rapidement dans les feuilles larges des dicotylédones. Les céréales (graminées) le métabolisent et l'inactivent naturellement sans dommage.",
          ar: "تمتصه الأوراق العريضة بسرعة، بينما تمتلك نباتات الحبوب (القمح والشعير) قدرة طبيعية على تفكيكه دون أن تتأثر.",
          en: "Rapidly absorbed by broadleaf foliage, while cereal crops naturally metabolize and detoxify the molecule.",
        },
      },
      {
        step: 2,
        title: { fr: "Dérégulation génétique de l'auxine", ar: "فوضى جينية في مسار هرمون النمو", en: "Auxin Pathway Disruption" },
        desc: {
          fr: "Provoque l'expression non contrôlée des gènes de croissance et une surproduction massive d'éthylène et d'acide abscissique.",
          ar: "يسبب تحفيزاً مفرطاً لجينات النمو وإنتاجاً هائلاً لهرمونات الشيخوخة (الإيثيلين وABA).",
          en: "Triggers uncontrolled transcription of growth genes and massive toxic ethylene bursts.",
        },
      },
      {
        step: 3,
        title: { fr: "Épinastie & Torsion spectaculaire", ar: "التواء السيقان وتشوه الأوراق (Epinasty)", en: "Stem Twisting & Epinasty" },
        desc: {
          fr: "Élongation inégale des parois cellulaires : les tiges se tordent en spirale en quelques heures et les feuilles se recroquevillent.",
          ar: "استطالة غير متساوية لجدران الخلايا تؤدي إلى التواء حلزوني للسيقان وانكماش الأوراق خلال ساعات قليلة.",
          en: "Unequal cell wall expansion causes rapid stem curling, leaf cupping, and tumorous swellings.",
        },
      },
      {
        step: 4,
        title: { fr: "Écrasement des vaisseaux & Dessèchement", ar: "سحق الأوعية الناقلة والجفاف", en: "Vascular Blockage & Death" },
        desc: {
          fr: "La prolifération cellulaire compresse les faisceaux conducteurs de sève ; la plante ne peut plus s'alimenter et se dessèche en 7 à 14 jours.",
          ar: "تتضخم الخلايا وتسحق الأوعية الناقلة للماء والغذاء، فتموت العشبة الضارة وتجف خلال أسبوعين.",
          en: "Hypertrophic cell growth crushes phloem and xylem vessels, cutting off sap flow and killing the weed.",
        },
      },
    ],
    pestOrDiseaseSymptoms: {
      fr: "Torsion caractéristique en 'tire-bouchon' du coquelicot, de la moutarde sauvage et des chardons dans les parcelles de blé.",
      ar: "التواء حلزوني مميز لنباتات الخشخاش البري (بلعمان)، الخردل البري والشوكيات في حقول القمح.",
      en: "Characteristic corkscrew stem twisting of wild poppy, mustard, and thistles within wheat fields.",
    },
    optimalConditions: {
      idealTemp: '12 °C à 22 °C',
      tempMinC: 8,
      tempMaxC: 25,
      waterPhAdvice: "Efficace à pH 5.5 - 7.5.",
      adjuvantOrMixing: "Ne jamais pulvériser par vent > 10 km/h ou température > 25 °C (risque extrême de dérive volatile sur vignes et tomates voisines).",
      solarOrTimeOfDay: "Appliquer au stade tallage des céréales jusqu'au début montaison (épi 1 cm).",
    },
    resistanceManagement: {
      fr: "Faible risque de résistance (HRAC 4). Alterner ou associer avec un inhibiteur de l'ALS (metsulfuron-méthyl) pour élargir le spectre.",
      ar: "خطر مقاومة منخفض. يفضل الخلط أو التناوب مع مبيدات السلفونيل يوريا لتوسيع طيف مكافحة الأعشاب عريضة الأوراق.",
      en: "Low resistance risk (HRAC 4). Rotate or tank-mix with ALS inhibitors to widen the broadleaf spectrum.",
    },
    algerianAgroTip: {
      fr: "L'herbicide anti-dicotylédones historique et économique des céréaliers algériens. Attention absolue aux parcelles maraîchères et vignobles adjacents.",
      ar: "المبيد الاقتصادي الأكثر شعبية لدى مزارعي الحبوب في الجزائر. الحذر الشديد من تطاير الرذاذ نحو حقول الطماطم والكرمة المجاورة.",
      en: "The historic, highly cost-effective broadleaf cereal herbicide; strict drift caution near vineyards and vegetables.",
    },
  },

  {
    id: 'clodinafop',
    substanceKey: 'clodinafop',
    nameFr: 'Clodinafop-propargyl (Fop - Anti-graminées foliaire)',
    nameAr: 'كلودينافوب-بروبارجيل (توبيك - مبيد نجيليات للقمح)',
    nameEn: 'Clodinafop-propargyl',
    type: 'herbicide',
    groupCode: 'HRAC 1 (A)',
    groupFamily: 'Aryloxyphénoxypropionates (Fops)',
    targetSite: 'Inhibition de l’acétyl-CoA carboxylase (ACCase plastidiale)',
    targetSiteAr: 'تثبيط إنزيم ACCase المسؤول عن تكوين الدهون في النجيليات',
    mobility: 'xylem-systemic',
    actionSpeed: 'moderate',
    knockdownEffect: false,
    rainfastnessHours: 1,
    resistanceRisk: 'high',
    summary: {
      fr: "Herbicide anti-graminées foliaire hautement sélectif du blé. Bloque l'enzyme ACCase dans les chloroplastes des graminées adventices (folle avoine, phalaris, ray-grass), stoppant la synthèse des lipides membranaires dans les zones de croissance méristématiques.",
      ar: "مبيد اختياري متخصص لمكافحة الأعشاب النجيلية في القمح (الشوفان البري، الزوان، الفالاريس). يعطل إنزيم ACCase المسؤول عن بناء الدهون في الخلايا المرستيمية للنجيليات الضارة دون الإضرار بالقمح بفضل مادة الأمان (Cloquintocet-mexyl).",
      en: "Selective post-emergence graminicide for wheat. Inhibits plastidic acetyl-CoA carboxylase (ACCase), shutting down fatty acid and lipid biosynthesis in grass weed meristems.",
    },
    howItWorksSteps: [
      {
        step: 1,
        title: { fr: "Pénétration foliaire rapide & Safener", ar: "امتصاص سريع ومادة حماية للقمح", en: "Foliar Uptake & Safener Protection" },
        desc: {
          fr: "Pénètre en 1 heure dans le feuillage. Contient un phytoprotecteur (safener) qui accélère la détoxification chez le blé mais pas chez les mauvaises herbes.",
          ar: "يمتص خلال ساعة واحدة فقط. يحتوي على مادة أمان تسرع تفكيكه في نبات القمح بينما يظل فعالاً ضد الأعشاب الضارة.",
          en: "Absorbed within 1 hour; includes a cloquintocet safener enabling wheat to detoxify the herbicide rapidly.",
        },
      },
      {
        step: 2,
        title: { fr: "Blocage de l'enzyme ACCase", ar: "تثبيط إنزيم ACCase", en: "ACCase Inhibition" },
        desc: {
          fr: "Inhibe l'acétyl-CoA carboxylase des graminées, empêchant la première étape de la synthèse des acides gras.",
          ar: "يوقف عمل إنزيم ACCase فتتوقف عملية تصنيع الأحماض الدهنية الأساسية للأغشية الخلوية.",
          en: "Inactivates plastidic ACCase, halting the synthesis of long-chain fatty acids.",
        },
      },
      {
        step: 3,
        title: { fr: "Destruction des méristèmes de croissance", ar: "تلف القمم النامية للنجيليات", en: "Meristematic Necrosis" },
        desc: {
          fr: "Les nœuds de tallage et le cœur des graminées adventices brunissent et pourrissent sans possibilité de nouvelles feuilles.",
          ar: "تتحول العقد السفلية وقلب نبات الشوفان البري والزوان إلى اللون البني وتتعفن القمم النامية.",
          en: "Growing points at the base of grass tillers turn brown and die; no new leaves can form.",
        },
      },
      {
        step: 4,
        title: { fr: "Élimination totale de la folle avoine", ar: "موت الشوفان البري والزوان", en: "Complete Grass Eradication" },
        desc: {
          fr: "Le cœur de la mauvaise herbe s'arrache facilement sans résistance ; dessèchement complet en 2 à 3 semaines.",
          ar: "يمكن سحب قلب العشبة بسهولة عند شده باليد؛ ويحدث الجفاف والموت التام في غضون أسبوعين إلى 3 أسابيع.",
          en: "Central shoot pulls out effortlessly; weed desiccates completely within 2-3 weeks.",
        },
      },
    ],
    pestOrDiseaseSymptoms: {
      fr: "Rougit puis brunit au niveau du collet de la folle avoine (*Avena fatua*) et du ray-grass (*Lolium*) ; le blé reste parfaitement vert et sain.",
      ar: "احمرار ثم اسوداد في قاعدة ساق الشوفان البري والزوان، بينما يواصل محصول القمح نموه الطبيعي دون أي اصفرار.",
      en: "Basal rot and reddish chlorosis of wild oat and ryegrass tillers; wheat remains vibrant and green.",
    },
    optimalConditions: {
      idealTemp: '10 °C à 22 °C',
      tempMinC: 6,
      tempMaxC: 25,
      waterPhAdvice: "Stable à pH 5.0 - 7.5.",
      adjuvantOrMixing: "Toujours ajouter l'adjuvant huilé recommandé pour assurer un étalement optimal sur feuilles cireuses de graminées.",
      solarOrTimeOfDay: "Stade optimal : du tallage au début montaison de la folle avoine (2 feuilles à 2 talles).",
    },
    resistanceManagement: {
      fr: "Risque de résistance élevé (mutation de l'ACCase). Alterner impérativement avec des herbicides du groupe HRAC 2 (sulfosulfuron, pyroxsulame) ou méthodes agronomiques.",
      ar: "خطر مقاومة مرتفع (طفرة في إنزيم ACCase). التناوب إجباري مع مجموعة السلفونيل يوريا (HRAC 2) واتباع دورة زراعية لتفادي مناعة الزوان.",
      en: "High resistance risk (ACCase target site mutations). Strictly alternate with HRAC 2 ALS inhibitors and cultural rotations.",
    },
    algerianAgroTip: {
      fr: "Le standard de référence incontournable (Topik) contre la folle avoine dans les périmètres céréaliers du Nord et des Hauts Plateaux.",
      ar: "المبيد المرجعي الأول (توبيك) لمكافحة الشوفان البري (الخرطال) في حقول الحبوب بشمال وهضاب الجزائر.",
      en: "The historic #1 reference standard against wild oat (*Avena fatua*) across Algerian wheat basins.",
    },
  },
];

/** Index by ID or substance name */
export const MECHANISM_BY_ID: Record<string, ActiveMatterMechanism> = Object.fromEntries(
  ACTIVE_MATTER_MECHANISMS.map((m) => [m.id, m]),
);

/** Helper to find mechanism data for any active matter ID or substance name */
export function getMechanismForActiveMatter(idOrSubstance: string): ActiveMatterMechanism | null {
  if (!idOrSubstance) return null;
  const key = idOrSubstance.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  
  // Direct ID lookup
  if (MECHANISM_BY_ID[key]) return MECHANISM_BY_ID[key];
  
  // Partial matches on substanceKey
  const found = ACTIVE_MATTER_MECHANISMS.find(
    (m) => key.includes(m.substanceKey) || m.substanceKey.includes(key) ||
           key.includes(m.id) || m.id.includes(key)
  );
  return found || null;
}
