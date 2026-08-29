import React from 'react';
import {
  Package,
  Activity,
  Timer,
  ShieldCheck,
  Globe,
  Sparkles,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Droplets,
  Zap,
  Wind,
  Bug,
  Layers,
  Thermometer,
  Sprout,
  Scale,
  Gauge,
  Sun,
  CloudRain,
  Mountain,
} from 'lucide-react';

export type ToolExplainerCategory =
  | 'fertilizer_bags'
  | 'satellite_ndvi'
  | 'irrigation_salinity'
  | 'dar_safety'
  | 'digital_twin_soil'
  | 'backpack_sprayer'
  | 'spray_weather_deltat'
  | 'tank_mix_compatibility'
  | 'symptom_checker'
  | 'soil_texture_awc'
  | 'soil_ph_nutrients'
  | 'fertigation_ab_tanks'
  | 'gdd_phenology'
  | 'seed_rate_population'
  | 'yield_estimation'
  | 'water_hardness_sar'
  | 'compost_c_n_balance'
  | 'active_matter_irac_frac'
  | 'rusle_erosion'
  | 'vpd_greenhouse'
  | 'frost_protection'
  | 'ipm_pest_threshold'
  | 'generic_formula';

export interface ToolExplainerTopic {
  id: ToolExplainerCategory;
  titleEn: string;
  titleFr: string;
  titleAr: string;
  shortSubtitleEn: string;
  shortSubtitleFr: string;
  shortSubtitleAr: string;
  formulaNotation: string;
  iconName: string;
  accentColor: string;
  summaryEn: string;
  summaryFr: string;
  summaryAr: string;
  steps: Array<{
    stepNumber: number;
    headingEn: string;
    headingFr: string;
    headingAr: string;
    bodyEn: string;
    bodyFr: string;
    bodyAr: string;
    scientificDetail?: string;
  }>;
  algerianContextEn: string;
  algerianContextFr: string;
  algerianContextAr: string;
  practicalTips: Array<{
    tipEn: string;
    tipFr: string;
    tipAr: string;
  }>;
}

export const TOOL_EXPLAINER_DATA: Record<ToolExplainerCategory, ToolExplainerTopic> = {
  fertilizer_bags: {
    id: 'fertilizer_bags',
    titleEn: 'How the 50kg Fertilizer Bag Program Works',
    titleFr: 'Comment fonctionne le calcul des sacs d’engrais 50 kg',
    titleAr: 'كيف يعمل برنامج حساب أكياس السماد (50 كغ)',
    shortSubtitleEn: 'From target soil units (N, P₂O₅, K₂O) to real market bags without waste',
    shortSubtitleFr: 'De l’unité fertilisante pure aux sacs réels du marché sans gaspillage',
    shortSubtitleAr: 'من الوحدات الصافية (N, P₂O₅, K₂O) إلى أكياس السوق الفعلية بدقة',
    formulaNotation: 'Bags = ⌈(Target Unit (kg/ha) × Area (ha)) / (Bag Weight (50kg) × Concentration %)⌉',
    iconName: 'Package',
    accentColor: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
    summaryEn: 'Converts raw agronomic recommendations (kg/ha of N, P₂O₅, K₂O) into integer counts of commercial 50kg bags commonly traded in Algeria (DAP 18-46-0, Urea 46%, SOP 0-0-50, NPK 15-15-15, Calcium Nitrate). It accounts for secondary nutrient contributions (e.g. nitrogen in DAP).',
    summaryFr: 'Transforme les besoins agronomiques théoriques (unités pures N, P₂O₅, K₂O / ha) en nombre entier de sacs de 50 kg disponibles sur le marché algérien (DAP 18-46-0, Urée 46%, Sulfate de potasse SOP, NPK 15-15-15, Nitrate de chaux) en déduisant les apports croisés.',
    summaryAr: 'يحول الاحتياجات السمادية الصافية (كغ/هكتار من N، P₂O₅، K₂O) إلى عدد أكياس تجارية كاملة سعة 50 كغ متوفرة في السوق الجزائرية مع احتساب النيتروجين المرفق في سماد الداب (DAP).',
    steps: [
      {
        stepNumber: 1,
        headingEn: 'Phosphorus (P₂O₅) Priority via DAP (18-46-0)',
        headingFr: 'Priorité au Phosphore (P₂O₅) via le DAP (18-46-0)',
        headingAr: 'أولوية الفوسفور عبر سماد الداب (18-46-0)',
        bodyEn: '1 bag of DAP (50 kg) contains 46% P₂O₅ = 23 kg of pure P₂O₅. The tool computes required DAP bags first: Total P₂O₅ needed ÷ 23 kg. It simultaneously notes that each DAP bag automatically contributes 9 kg of pure Nitrogen (18% of 50 kg).',
        bodyFr: '1 sac de DAP (50 kg) contient 46% de P₂O₅ = 23 kg d’unités P. Le système calcule les sacs de DAP nécessaires d’abord : Besoin P ÷ 23 kg. Il enregistre au passage que chaque sac apporte 9 kg d’Azote pur (18% de 50 kg).',
        bodyAr: 'كيس واحد من الداب (50 كغ) يحتوي على 46% فوسفور = 23 كغ فوسفور صافي. يحسب النظام أكياس الداب أولاً، ويسجل أن كل كيس يضيف تلقائياً 9 كغ نيتروجين صافي.',
        scientificDetail: 'P₂O₅ uptake efficiency: ~20–30% in high pH calcareous soils.',
      },
      {
        stepNumber: 2,
        headingEn: 'Nitrogen Balance via Urea 46%',
        headingFr: 'Ajustement de l’Azote via l’Urée 46%',
        headingAr: 'موازنة النيتروجين المتبقي عبر اليوريا 46%',
        bodyEn: 'The tool subtracts the nitrogen already supplied by DAP from total requirement: Remaining N = Total N - (DAP bags × 9 kg). The rest is converted to Urea 46% bags (1 bag = 23 kg pure N).',
        bodyFr: 'L’outil soustrait l’Azote déjà fourni par le DAP : Azote restant = Besoin N - (Sacs DAP × 9 kg). Le solde est converti en sacs d’Urée 46% (1 sac = 23 kg d’Azote pur).',
        bodyAr: 'يطرح النظام النيتروجين المقدم من الداب من الاحتياج الكلي، ثم يقسم الباقي على 23 كغ لحساب أكياس اليوريا (50 كغ يوريا = 23 كغ نيتروجين).',
        scientificDetail: 'Incorporate Urea or irrigate within 4 hours to stop ammonia volatilization.',
      },
      {
        stepNumber: 3,
        headingEn: 'Potassium via Sulfate of Potash (SOP 0-0-50)',
        headingFr: 'Potasse via Sulfate de Potasse (SOP 0-0-50)',
        headingAr: 'البوتاسيوم عبر سلفات البوتاس (SOP 0-0-50)',
        bodyEn: '1 bag of SOP (50 kg) contains 50% K₂O = 25 kg of pure Potassium. Total K₂O bags = Target K ÷ 25 kg. SOP is favored over MOP (Potassium Chloride) to prevent salt stress in arid soils.',
        bodyFr: '1 sac de SOP (50 kg) contient 50% de K₂O = 25 kg de Potasse pure. Sacs de SOP = Besoin K ÷ 25 kg. Le SOP est préféré au chlorure pour éviter la salinisation.',
        bodyAr: 'كيس واحد من سلفات البوتاس (50 كغ) يعطي 25 كغ بوتاسيوم صافي (50%). يُفضل السلفات على الكلور لتفادي ملوحة التربة.',
      },
    ],
    algerianContextEn: 'Algerian soils (Mitidja, Chéliff, Sétif, Biskra, El Oued) have high calcium carbonate (pH 7.8 - 8.5), causing applied phosphorus to precipitate as insoluble calcium phosphate. Applying DAP localized in the furrow rather than broadcast increases uptake efficiency by 40%.',
    algerianContextFr: 'Les sols algériens (Mitidja, Chéliff, Hauts Plateaux, Sud) sont très calcaires (pH 7.8 à 8.5), provoquant le blocage du phosphore par rétrogradation en phosphate tricalcique. L’application localisée en ligne au lieu de l’épandage à la volée améliore l’efficacité de 40%.',
    algerianContextAr: 'تتميز الأراضي الجزائرية بارتفاع نسبة الكلس (pH بين 7.8 و 8.5)، مما يؤدي لتثبيت الفوسفور. وضع سماد الداب موضعياً في خطوط الزراعة يرفع امتصاصه بنسبة 40%.',
    practicalTips: [
      {
        tipEn: 'Never mix Calcium Nitrate and Sulfate/Phosphate fertilizers in the same fertigation tank to avoid gypsum sludge.',
        tipFr: 'Ne mélangez jamais le Nitrate de chaux avec les Sulfates ou Phosphates dans le même bac pour éviter les précipitations de plâtre.',
        tipAr: 'لا تخلط نترات الكالسيوم مع السلفات أو الفوسفات في نفس خزان التسميد لتفادي انسداد المنقطات برواسب الجبس.',
      },
      {
        tipEn: 'Split Urea applications into 2–3 doses during active vegetative growth instead of a single heavy dose.',
        tipFr: 'Fractionnez les apports d’Urée en 2 à 3 passages durant la montaison/croissance plutôt qu’un seul apport massif.',
        tipAr: 'قسّم اليوريا إلى دفعتين أو ثلاث دفعات أثناء فترات النمو النشط لتفادي الغسيل والتبخر.',
      },
    ],
  },

  backpack_sprayer: {
    id: 'backpack_sprayer',
    titleEn: 'How Backpack Sprayer Calibration & Tank Dosing Works',
    titleFr: 'Comment fonctionne le dosage et l’étalonnage du pulvérisateur à dos',
    titleAr: 'كيف يعمل حساب جرعات بخاخ الظهر ومعايرة الرش',
    shortSubtitleEn: 'Accurate per-tank dosage in bottle caps without scorched foliage or wasted pesticide',
    shortSubtitleFr: 'Dosage précis par dosée en bouchons pour éviter phytotoxicité et gaspillage',
    shortSubtitleAr: 'جرعة دقيقة لكل خزان رش بالغطاء لتجنب حرق الأوراق وهدر المبيدات',
    formulaNotation: 'Dose_{tank} (mL) = (Dose_{ha} (L/ha) × 1000 × Tank_{vol} (L)) / Water_{ha} (L/ha)',
    iconName: 'Droplets',
    accentColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
    summaryEn: 'Translates per-hectare commercial pesticide recommendations into exact bottle-cap measurements (standard 25 mL cap) per 16L or 20L backpack tank, based on your spray carrier water volume (typically 300-600 L/ha).',
    summaryFr: 'Convertit les recommandations de produits phytosanitaires (exprimées en L/ha ou kg/ha) en nombre exact de bouchons (bouchon standard de 25 mL) par pulvérisateur de 16L ou 20L selon le volume de bouillie réel.',
    summaryAr: 'يحول الجرعات الرسمية للمبيدات (لتر/هكتار أو كغ/هكتار) إلى عدد أغطية قياسية (غطاء 25 ملل) لكل خزان رش سعة 16 أو 20 لتر حسب حجم مياه الرش بالهكتار.',
    steps: [
      {
        stepNumber: 1,
        headingEn: 'Carrier Water Volume per Hectare',
        headingFr: 'Volume de Bouillie par Hectare',
        headingAr: 'حجم مياه الرش للهكتار',
        bodyEn: 'Backpack spraying requires between 400 L/ha (vegetable beds) and 600 L/ha (dense foliage/orchards). This determines the number of tanks needed: Tanks = Area (ha) × Volume (L/ha) ÷ Tank Size (L).',
        bodyFr: 'La pulvérisation manuelle utilise entre 400 L/ha (maraîchage) et 600 L/ha (arboriculture). Nombre de pleins = Surface (ha) × Volume (L/ha) ÷ Capacité du réservoir (L).',
        bodyAr: 'يحتاج الرش اليدوي بين 400 إلى 600 لتر ماء للهكتار. عدد الخزانات = المساحة × حجم الماء ÷ سعة الخزان.',
        scientificDetail: 'Walking pace calibration: 1 m/s pace with 1 bar pressure gives ~0.8 L/min nozzle discharge.',
      },
      {
        stepNumber: 2,
        headingEn: 'Dose per Tank Calculation',
        headingFr: 'Calcul de la Dose par Pulvérisateur',
        headingAr: 'حساب جرعة الخزان الواحد',
        bodyEn: 'If a fungicide requires 2 L/ha with 400 L/ha of water, the concentration is 5 mL/L. For a 16 L tank: Dose = 16 × 5 = 80 mL (approx. 3.2 bottle caps).',
        bodyFr: 'Si un fongicide préconise 2 L/ha avec 400 L/ha d’eau, la concentration est de 5 mL/L. Pour un dos d’homme de 16 L : Dose = 16 × 5 = 80 mL (~3.2 bouchons).',
        bodyAr: 'إذا كانت جرعة المبيد 2 لتر/هكتار في 400 لتر ماء، فالتركيز هو 5 ملل/لتر. لخزان 16 لتر: الجرعة = 80 ملل (حوالي 3 أغطية وربع).',
      },
    ],
    algerianContextEn: 'In Algerian greenhouses (Biskra, Tipaza, Mostaganem), over-concentrated spraying with manual knapsacks is the #1 cause of leaf burn during hot months. Always test nozzle pressure and spray before 9:00 AM.',
    algerianContextFr: 'Dans les serres algériennes (Biskra, Tipaza, Mostaganem), le surdosage au pulvérisateur à dos est la cause principale de phytotoxicité en saison chaude. Traitez toujours avant 9h du matin.',
    algerianContextAr: 'في البيوت المحمية الجزائرية (بسكرة، تيبازة، مستغانم)، زيادة تركيز الرش اليدوي هي السبب الرئيسي لحروق الأوراق صيفاً. التزم بالرش قبل 9 صباحاً.',
    practicalTips: [
      {
        tipEn: 'Fill tank half with clean water first, dissolve product thoroughly, then top up with water.',
        tipFr: 'Remplissez le pulvérisateur à moitié d’eau propre, dissolvez le produit, puis complétez avec l’eau restante.',
        tipAr: 'املأ نصف الخزان بالماء النظيف أولاً، ثم ذوب المبيد جيداً، ثم أتمم ملء باقي الخزان بالماء.',
      },
    ],
  },

  spray_weather_deltat: {
    id: 'spray_weather_deltat',
    titleEn: 'How Spray Weather Windows & Delta-T (ΔT) Work',
    titleFr: 'Comment fonctionnent les fenêtres de pulvérisation et le Delta-T (ΔT)',
    titleAr: 'كيف تعمل نوافذ الرش ومؤشر دلتا تي (ΔT) الجوي',
    shortSubtitleEn: 'Evaporation risk, droplet lifespan, and drift prevention for phytosanitary treatments',
    shortSubtitleFr: 'Risque d’évaporation, durée de vie des gouttelettes et dérive des traitements',
    shortSubtitleAr: 'مخاطر تبخر القطرات وحمايتها من الانجراف بالرياح أثناء المعالجة',
    formulaNotation: 'ΔT = T_{dry} - T_{wet}  |  Optimum: 2°C ≤ ΔT ≤ 8°C  |  Wind < 15 km/h',
    iconName: 'Wind',
    accentColor: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900',
    summaryEn: 'Delta-T is the difference between dry bulb and wet bulb temperatures, reflecting atmospheric evaporative demand. If ΔT > 8°C, fine droplets evaporate in mid-air before hitting leaves; if ΔT < 2°C, droplets fail to dry, promoting fungal runoff; wind > 15 km/h causes severe drift.',
    summaryFr: 'Le Delta-T représente l’écart entre la température sèche et humide. Si ΔT > 8°C, les gouttelettes s’évaporent en vol avant d’atteindre la cible. Si ΔT < 2°C, l’humidité excessive empêche l’adhérence. Un vent > 15 km/h provoque une dérive dangereuse.',
    summaryAr: 'دلتا تي (ΔT) هو الفارق بين درجة الحرارة الجافة والرطبة. إذا تجاوز 8 درجات مئوية تتبخر قطرات المبيد في الهواء قبل وصولها للورقة. إذا قل عن درجتين تسيل القطرات دون ثبات. والرياح فوق 15 كم/سا تسبب انجرافاً خطيراً.',
    steps: [
      {
        stepNumber: 1,
        headingEn: 'Safe Spray Range: 2°C to 8°C',
        headingFr: 'Zone Optimale de Traitement : 2°C à 8°C',
        headingAr: 'النطاق الآمن والمثالي: 2 إلى 8 درجات مئوية',
        bodyEn: 'Droplets survive long enough to impact and spread over leaf cuticle without premature crystallization or pesticide wash-off.',
        bodyFr: 'Les gouttelettes restent liquides assez longtemps pour se fixer sur la cuticule foliaire sans cristallisation précoce.',
        bodyAr: 'تبقى القطرات سائلة بما يكفي لتلتصق بسطح الورقة وتمتصها النبتة بدون تبلور مبكر أو جفاف مفاجئ.',
      },
      {
        stepNumber: 2,
        headingEn: 'Chehili / Sirocco Wind & Heat Shock (> 8°C)',
        headingFr: 'Risque de Chaleur et Sirocco / Chehili (> 8°C)',
        headingAr: 'مخاطر رياح الشهيلي وارتفاع درجات الحرارة (> 8°C)',
        bodyEn: 'Under hot dry conditions (high temp, low humidity), droplets lose 50% of volume in 3 seconds. Chemical concentration spikes on the leaf surface, causing severe chemical burn.',
        bodyFr: 'Par temps chaud et sec (Sirocco), la gouttelette perd 50% de son volume en 3 secondes, provoquant une brûlure chimique sur la feuille.',
        bodyAr: 'في الجو الحار والجاف (الشهيلي)، تفقد القطرة نصف حجمها في 3 ثوانٍ فقط مما يرفع تركيز المبيد فجأة ويحرق الأوراق.',
      },
    ],
    algerianContextEn: 'Across Algerian plains (Mitidja, Chlef, Sétif, Biskra), morning calm (5:30 AM – 8:30 AM) offers optimal ΔT (3–6°C) and low wind before the convective thermals rise.',
    algerianContextFr: 'Dans les plaines algériennes, le créneau matinal (5h30 à 8h30) offre un ΔT idéal (3 à 6°C) et un vent faible avant la hausse thermique de la mi-journée.',
    algerianContextAr: 'في السهول والهضاب الجزائرية، الفترة الصباحية المبكرة (5:30 إلى 8:30 صباحاً) هي الأفضل للرش حيث يكون مؤشر دلتا تي بين 3 و6 والرياح هادئة.',
    practicalTips: [
      {
        tipEn: 'Do not spray when wind exceeds 15 km/h or during thermal inversion (smoke trapped horizontally).',
        tipFr: 'Ne traitez pas si le vent dépasse 15 km/h ou en cas d’inversion thermique.',
        tipAr: 'توقف فوراً عن الرش إذا تجاوزت سرعة الرياح 15 كم/سا أو عند وجود انقلاب حراري.',
      },
    ],
  },

  tank_mix_compatibility: {
    id: 'tank_mix_compatibility',
    titleEn: 'How Chemical Tank Mixing & Compatibility Matrix Works',
    titleFr: 'Comment fonctionne la compatibilité des mélanges en cuve',
    titleAr: 'كيف يعمل فحص توافق خلط الأسمدة والمبيدات في الخزان',
    shortSubtitleEn: 'W.A.L.E.S. mixing order, jar tests, and chemical precipitate prevention',
    shortSubtitleFr: 'Ordre d’incorporation W.A.L.E.S., test du bocal et prévention des dépôts',
    shortSubtitleAr: 'ترتيب الخلط العلمي W.A.L.E.S. وتفادي ترسبات الجبس والفوسفات الكيميائية',
    formulaNotation: 'Order: Water → [W] Wettable Powders → [A] Agitation → [L] Liquids → [E] Emulsifiables → [S] Surfactants',
    iconName: 'FlaskConical',
    accentColor: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900',
    summaryEn: 'Prevents dangerous chemical antagonisms, nozzle clogging, and phytotoxic curdling when combining fungicides, insecticides, foliar fertilizers, and adjuvants in a single spray tank.',
    summaryFr: 'Empêche les précipitations, le colmatage des buses et la phytotoxicité lors du mélange de plusieurs fongicides, insecticides et engrais foliaires dans la même cuve.',
    summaryAr: 'يمنع التفاعلات الكيميائية الضارة وانسداد الرشاشات وظهور كتل غير ذائبة عند خلط المبيدات الفطرية والحشرية والأسمدة الورقية معاً.',
    steps: [
      {
        stepNumber: 1,
        headingEn: 'Standard W.A.L.E.S. Incorporation Order',
        headingFr: 'Protocole d’Ordre d’Incorporation W.A.L.E.S.',
        headingAr: 'ترتيب إضافة المواد في خزان الرش (W.A.L.E.S.)',
        bodyEn: '1. Fill tank 75% with water. 2. Add Wettable Powders (WP/WG). 3. Agitate thoroughly. 4. Add Liquid flowables (SC/SL). 5. Add Emulsifiable Concentrates (EC). 6. Add Surfactants/Foliar nutrients.',
        bodyFr: '1. Remplir à 75% d’eau. 2. Poudres mouillables (WP/WG). 3. Agitation vigoureuse. 4. Suspensions liquides (SC/SL). 5. Concentrés émulsionnables (EC). 6. Mouillants et engrais foliaires.',
        bodyAr: '1. املأ 75% من الخزان بالماء. 2. أضف المساحيق القابلة للبلل (WP/WG). 3. شغّل التقليب. 4. أضف السوائل المعلقة (SC/SL). 5. أضف المركزات القابلة للاستحلاب (EC). 6. أضف المواد الناشرة والسماد الورقي.',
      },
      {
        stepNumber: 2,
        headingEn: 'Incompatible Chemical Combinations',
        headingFr: 'Associations Strictement Interdites',
        headingAr: 'خلطات ممنوعة كيميائياً',
        bodyEn: 'Never mix: Copper + Amino Acids (severe phytotoxicity), Calcium Nitrate + Potassium Sulfate (Gypsum sludge), Mineral Oils + Wettable Sulfur (leaf burn within 21 days).',
        bodyFr: 'À proscrire : Cuivre + Acides Aminés (brûlures), Nitrate de Chaux + Sulfate de Potasse (plâtre), Huiles Minérales + Soufre (attendre 21 jours).',
        bodyAr: 'ممنوع نهائياً: النحاس مع الأحماض الأمينية (حرق فوري)، نترات الكالسيوم مع سلفات البوتاس (تكون جبس)، الزيوت المعدنية مع الكبريت (انتظر 21 يوماً).',
      },
    ],
    algerianContextEn: 'Hard well water in Biskra, El Oued, and Mascara with high bicarbonates destabilizes pesticide emulsions. Always add a pH acidifier/corrector before adding sensitive insecticides.',
    algerianContextFr: 'Les eaux de puits très dures et calcaires (Biskra, El Oued, Mascara) dégradent l’efficacité des bouillies. Utilisez un régulateur de pH avant d’incorporer les insecticides.',
    algerianContextAr: 'المياه الكلسية والقاسية في بسكرة والوادي ومعسكر تفكك جزيئات المبيدات. ينصح بإضافة منظم حموضة للماء قبل وضع المبيدات الحشرية.',
    practicalTips: [
      {
        tipEn: 'Always perform a small 1-liter jar test 15 minutes before filling the full tractor tank.',
        tipFr: 'Faites toujours un test dans un bocal de 1L 15 minutes avant de préparer la grande cuve.',
        tipAr: 'قم دائماً بتجربة الخلط في قارورة صغيرة سعة 1 لتر لمدة 15 دقيقة قبل خلط الخزان الكبير.',
      },
    ],
  },

  dar_safety: {
    id: 'dar_safety',
    titleEn: 'How INPV Pre-Harvest Intervals (DAR) & MRL Safety Work',
    titleFr: 'Comment fonctionne le Délai Avant Récolte (DAR) et la sécurité INPV',
    titleAr: 'كيف تعمل فترة الأمان قبل الجني (DAR) ومعايير السلامة INPV',
    shortSubtitleEn: 'Ensuring zero toxic chemical residues in harvested crops for consumer safety',
    shortSubtitleFr: 'Garantir l’absence de résidus chimiques toxiques dans les récoltes',
    shortSubtitleAr: 'ضمان خلو المحاصيل المحصودة من بقايا المبيدات السامة لسلامة المستهلك',
    formulaNotation: 'Harvest Date ≥ Spray Date + INPV DAR (Days)  |  MRL (mg/kg) ≤ Official Limit',
    iconName: 'ShieldCheck',
    accentColor: 'text-purple-700 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900',
    summaryEn: 'DAR (Délai Avant Récolte / Pre-Harvest Interval) is the mandatory minimum number of days between the last chemical treatment and the harvest of agricultural produce, as regulated by the Algerian National Institute of Plant Protection (INPV).',
    summaryFr: 'Le DAR (Délai Avant Récolte) est la durée légale minimale obligatoire entre le dernier traitement phytosanitaire et la récolte, homologuée par l’INPV en Algérie.',
    summaryAr: 'فترة الأمان (DAR) هي المدة القانونية الإلزامية الفاصلة بين آخر عملية رش للمبيد ويوم جني المحصول لحماية صحة المستهلك وفق السجل الرسمي للمعهد الوطني لحماية النباتات (INPV).',
    steps: [
      {
        stepNumber: 1,
        headingEn: 'Active Ingredient Degradation Half-Life',
        headingFr: 'Demi-Vie de Dégradation de la Molécule',
        headingAr: 'فترة تحلل المادة الفعالة داخل النبتة',
        bodyEn: 'UV radiation, leaf enzymes, and rain gradually metabolize pesticide molecules into non-toxic compounds. DAR ensures residues fall strictly below Maximum Residue Limits (MRL/LMR).',
        bodyFr: 'Les rayons solaires, les enzymes de la plante et l’eau dégradent la matière active. Le DAR garantit que les résidus tombent sous la Limite Maximale de Résidus (LMR).',
        bodyAr: 'تعمل أشعة الشمس والإنزيمات على تكسير جزيئات المبيد تدريجياً، وفترة الأمان تضمن انخفاض البقايا تحت الحد الأقصى المسموح به دولياً ومحلياً.',
      },
    ],
    algerianContextEn: 'Crucial for early greenhouse tomato, pepper, and potato harvests in southern wilayas (Biskra, El Oued, Ouargla) intended for national wholesale markets (Eulma, Bougara, Chalghoum) and export.',
    algerianContextFr: 'Indispensable pour les primeurs (tomate, poivron, pomme de terre) de Biskra et Oued Souf destinées aux marchés de gros (Bougara, Eulma) et à l’exportation.',
    algerianContextAr: 'بالغ الأهمية لمحاصيل الخضر المبكرة والبطاطا في بسكرة ووادي سوف المسوقة لأسواق الجملة الكبرى (بوقرة، العلمة) والتصدير.',
    practicalTips: [
      {
        tipEn: 'When multiple products are mixed, always respect the LONGEST DAR among all tank components.',
        tipFr: 'En cas de mélange de plusieurs produits, appliquez toujours le DAR le PLUS LONG.',
        tipAr: 'عند خلط أكثر من مبيد، يجب دائماً الالتزام بفترة الأمان الأطول بين جميع المواد المخلوطة.',
      },
    ],
  },

  irrigation_salinity: {
    id: 'irrigation_salinity',
    titleEn: 'How Drip Run-Time & Salinity Leaching Work',
    titleFr: 'Comment fonctionne la durée d’arrosage et le lessivage de salinité',
    titleAr: 'كيف يعمل حساب مدة الري بالتنقيط وغسيل الأملاح',
    shortSubtitleEn: 'FAO-56 Penman-Monteith crop water requirements, leaching fractions, and energy costs',
    shortSubtitleFr: 'Besoins en eau FAO-56, fraction de lessivage et coûts énergétiques (Sonelgaz/Gazole)',
    shortSubtitleAr: 'احتياجات المياه حسب FAO-56 ونسبة غسيل الأملاح وتكاليف الطاقة بالدينار الجزائري',
    formulaNotation: 'Run Time (h) = (Area (m²) × ET_c (mm) / (1 - LF)) / Total Dripper Flow (L/h)  |  LF = EC_w / (5·EC_e - EC_w)',
    iconName: 'Timer',
    accentColor: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-900',
    summaryEn: 'Calculates the precise valve run time required to satisfy crop evapotranspiration while adding a leaching fraction to flush accumulated rootzone salts, accounting for Sirocco heat surges and pumping energy costs.',
    summaryFr: 'Calcule la durée exacte d’ouverture de vanne pour satisfaire l’évapotranspiration de la culture avec une fraction de lessivage pour évacuer les sels de la zone racinaire.',
    summaryAr: 'يحسب المدة الدقيقة لتشغيل صمام السقي بالتنقيط لتلبية احتياج المحصول المائي مع إضافة نسبة غسيل لطرد الأملاح من منطقة الجذور واحتساب تكلفة المازوت والكهرباء.',
    steps: [
      {
        stepNumber: 1,
        headingEn: 'Crop Water Demand (ETc = ET0 × Kc)',
        headingFr: 'Besoin en Eau de la Culture (ETc = ET0 × Kc)',
        headingAr: 'احتياج المحصول المائي (ETc = ET0 × Kc)',
        bodyEn: 'Multiplies baseline reference evapotranspiration (ET0) by the crop phenological coefficient (Kc). E.g. Potato at tuber initiation (Kc = 1.15) with ET0 = 5 mm needs 5.75 mm/day (57.5 m³/ha).',
        bodyFr: 'Multiplie l’évapotranspiration de référence (ET0) par le coefficient cultural (Kc). Ex : Pomme de terre en tubérisation (Kc = 1.15) avec ET0 = 5 mm nécessite 5.75 mm/jour.',
        bodyAr: 'يضرب البخر المرجعي (ET0) في معامل المحصول (Kc). مثلاً البطاطا في مرحلة تكوين الدرنات تحتاج 5.75 ملم/يوم (57.5 م³ للهكتار).',
      },
      {
        stepNumber: 2,
        headingEn: 'Salinity Leaching Fraction (LF)',
        headingFr: 'Fraction de Lessivage des Sels (LF)',
        headingAr: 'نسبة غسيل الأملاح (Leaching Fraction)',
        bodyEn: 'Saline borehole water deposits salt in the rootzone with every watering. To prevent osmotic stress, extra water is applied: LF = EC_w / (5·EC_e - EC_w). Saline waters (3.5 dS/m) require 15-25% more volume.',
        bodyFr: 'L’eau de forage saline dépose des sels. Pour éviter le blocage osmotique, un surplus d’eau est injecté : LF = EC_w / (5·EC_e - EC_w) (+15 à 25% de volume).',
        bodyAr: 'مياه الآبار المالحة تراكم الأملاح حول الجذور. يضاف ماء إضافي لغسلها نحو العمق بنسبة 15 إلى 25% حسب ملوحة الماء.',
      },
    ],
    algerianContextEn: 'Saharan aquifers (Continental Intercalaire in Biskra, El Oued, Ghardaïa) frequently have EC > 3.0 dS/m and high sulfates. Short frequent irrigation pulses prevent salt capillary rise into topsoil.',
    algerianContextFr: 'Les nappes sahariennes (Continental Intercalaire à Biskra, Oued Souf) ont souvent une CE > 3.0 dS/m. Des arrosages fractionnés courts empêchent la remontée des sels par capillarité.',
    algerianContextAr: 'المياه الجوفية في الجنوب (بسكرة والوادي) تتجاوز ملوحتها 3 ديسيمنس/م. الري على دفعات متقاربة يمنع صعود الأملاح إلى سطح التربة بالخاصية الشعرية.',
    practicalTips: [
      {
        tipEn: 'During Chehili / Sirocco heatwaves (> 40°C), activate a 25% irrigation boost early in the morning to prevent flower abortion.',
        tipFr: 'Pendant le Sirocco (> 40°C), augmentez le temps d’arrosage de 25% à l’aube pour éviter l’avortement des fleurs.',
        tipAr: 'أثناء موجات الشهيلي والحرارة فوق 40 درجة، قم بزيادة مدة السقي 25% فجراً لحماية الأزهار من السقوط.',
      },
    ],
  },

  satellite_ndvi: {
    id: 'satellite_ndvi',
    titleEn: 'How Satellite Vegetation Monitoring (NDVI & NDRE) Works',
    titleFr: 'Comment fonctionne la télédétection par satellite (NDVI & NDRE)',
    titleAr: 'كيف تعمل مراقبة المحاصيل بالأقمار الصناعية (NDVI و NDRE)',
    shortSubtitleEn: 'Decoding chlorophyll spectral reflectance from Sentinel-2 & Landsat constellations',
    shortSubtitleFr: 'Décoder la réflectance spectrale de la chlorophylle par Sentinel-2 et Landsat',
    shortSubtitleAr: 'تفسير انعكاس الكلوروفيل الضوئي من أقمار سينتينل ولاندسات',
    formulaNotation: 'NDVI = (NIR - RED) / (NIR + RED)  |  NDRE = (NIR - RedEdge) / (NIR + RedEdge)',
    iconName: 'Activity',
    accentColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
    summaryEn: 'Measures the ratio between Near-Infrared light (reflected by healthy spongy mesophyll cell structure) and Red light (absorbed by active chlorophyll). Values range from 0.0 (bare soil/water) to 0.9 (dense, thriving canopy).',
    summaryFr: 'Mesure le contraste entre le Proche Infrarouge (PIR / NIR, réfléchi par les cellules végétales saines) et le Rouge (absorbé par la chlorophylle active). Les valeurs s’étendent de 0.0 (sol nu) à 0.9 (canopée dense et saine).',
    summaryAr: 'يقيس النسبة بين الأشعة تحت الحمراء القريبة (التي تعكسها خلايا الأوراق الحية) والضوء الأحمر (الذي يمتصه الكلوروفيل). تتراوح القيم من 0.0 (تربة جرداء) إلى 0.9 (غطاء نباتي كثيف ونشط).',
    steps: [
      {
        stepNumber: 1,
        headingEn: 'Spectral Absorption vs. Reflection',
        headingFr: 'Absorption vs Réflectance Spectrale',
        headingAr: 'الامتصاص مقابل الانعكاس الطيفي',
        bodyEn: 'Healthy plant leaves absorb 85–90% of visible Red light for photosynthesis, while reflecting up to 50% of invisible Near-Infrared (NIR) light to avoid overheating.',
        bodyFr: 'Les feuilles saines absorbent 85 à 90% du rouge pour la photosynthèse, mais réfléchissent 50% de l’infrarouge pour ne pas surchauffer.',
        bodyAr: 'تمتص الأوراق السليمة 90% من الضوء الأحمر للتركيب الضوئي وتعكس 50% من الأشعة تحت الحمراء لتجنب ارتفاع حرارتها.',
      },
    ],
    algerianContextEn: 'In Algerian cereal basins (Sétif, Constantine, Tiaret), Sentinel-2 5-day revisits help detect dry spells and nitrogen deficiencies across hundreds of contiguous hectares before visual yellowing occurs.',
    algerianContextFr: 'Dans les bassins céréaliers algériens (Sétif, Constantine, Tiaret), le passage de Sentinel-2 tous les 5 jours permet de cartographier le stress hydrique avant l’apparition du jaunissement.',
    algerianContextAr: 'في أحواض زراعة الحبوب بالهضاب العليا (سطيف، قسنطينة، تيارت)، يمر القمر الصناعي كل 5 أيام لكشف نقص النيتروجين والإجهاد المائي قبل ظهور الاصفرار بالعين.',
    practicalTips: [
      {
        tipEn: 'Do not base spray decisions on satellite imagery taken during cloudy or dusty (sand haze) pass-overs.',
        tipFr: 'Évitez d’interpréter les images satellite lors des passages nuageux ou des brumes de poussière saharienne.',
        tipAr: 'تجنب اتخاذ قرارات التسميد بناءً على صور الأقمار الصناعية الملتقطة أثناء الغيوم أو الغبار العالق في الجو.',
      },
    ],
  },

  digital_twin_soil: {
    id: 'digital_twin_soil',
    titleEn: 'How the Farm Digital Twin & 7 Soil Zones Work',
    titleFr: 'Comment fonctionne le Jumeau Numérique et les 7 Zones Pédologiques',
    titleAr: 'كيف يعمل التوأم الرقمي للمزرعة والمناطق الزراعية السبع',
    shortSubtitleEn: 'Multi-layer field modeling: phenology, root-depth water balance, soil chemistry, and economics',
    shortSubtitleFr: 'Modélisation multi-couches : phénologie, bilan hydrique, chimie du sol et rentabilité',
    shortSubtitleAr: 'نمذجة متعددة الطبقات: الأطوار الفسيولوجية، موازين الرطوبة، كيمياء التربة والجدوى الاقتصادية',
    formulaNotation: 'Field State = f(Texture, pH, Active CaCO₃, Root Depth, Dynamic ETc, Scouting Alerts)',
    iconName: 'Globe',
    accentColor: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
    summaryEn: 'Integrates geospatial parcel boundaries, soil laboratory properties across 7 Algerian agro-ecological zones, daily weather telemetry, crop development stages, and input economics into a living digital model of your farm.',
    summaryFr: 'Agrège les limites parcellaires, les caractéristiques des 7 zones pédoclimatiques algériennes, la télémétrie météo, les stades végétatifs et les coûts de revient dans un jumeau numérique interactif.',
    summaryAr: 'يدمج حدود القطع الجغرافية، وخصائص المناطق الزراعية السبع في الجزائر، وبيانات الطقس الحية، ومراحل نمو النبات، والتكاليف في نموذج رقمي حي ودقيق للمزرعة.',
    steps: [
      {
        stepNumber: 1,
        headingEn: '7 Algerian Agro-Ecological Zones',
        headingFr: 'Les 7 Zones Agro-Écologiques Algériennes',
        headingAr: 'المناطق الزراعية السبع في الجزائر',
        bodyEn: '1. Mitidja & Coastal Plain (alluvial clays, rich). 2. Chéliff Valley (heavy alkaline clays, drought prone). 3. High Plains East (Sétif/Constantine: cereals, cold winters). 4. High Plains West (SBA/Tiaret: semi-arid). 5. Saharan Oases (Biskra/Oued Souf: sandy reg, high salinity). 6. Tell Atlas Foothills (orchards, slope). 7. South Deep Sahara (Adrar: pivot pivot farming).',
        bodyFr: '1. Mitidja et Sahel. 2. Vallée du Chéliff. 3. Hauts Plateaux Est. 4. Hauts Plateaux Ouest. 5. Oasis Sahariennes. 6. Piémonts de l’Atlas. 7. Grand Sud.',
        bodyAr: '1. المتيجة والساحل. 2. وادي الشلف. 3. الهضاب العليا الشرقية (سطيف/قسنطينة). 4. الهضاب الغربية (سيدي بلعباس). 5. الواحات الصحراوية (بسكرة/الوادي). 6. الأطلس التلي. 7. الجنوب الكبير (أدرار).',
      },
    ],
    algerianContextEn: 'Tailors all fertilization doses, irrigation intervals, and frost warnings to the distinct soil physics and microclimates of Algeria’s agricultural regions.',
    algerianContextFr: 'Adapte les calculs de fertilisation et d’irrigation aux contraintes physico-chimiques propres à chaque wilaya.',
    algerianContextAr: 'يكيف جميع برامج التسميد ومواقيت الري مع طبيعة التربة والمناخ الخاص بكل ولاية جزائرية.',
    practicalTips: [
      {
        tipEn: 'Update your field stage whenever you notice 50% of plants reaching a new phenological milestone (e.g. flowering).',
        tipFr: 'Mettez à jour le stade de la parcelle dès que 50% des plantes atteignent une nouvelle phase (ex : floraison).',
        tipAr: 'قم بتحديث مرحلة الحقل عندما يبلغ 50% من النباتات طوراً جديداً (مثل بداية الإزهار).',
      },
    ],
  },

  symptom_checker: {
    id: 'symptom_checker',
    titleEn: 'How the Symptom Checker & Disease Triad Work',
    titleFr: 'Comment fonctionne le diagnostic des symptômes et le triangle des maladies',
    titleAr: 'كيف يعمل تشخيص الأعراض والمثلث الوبائي لأمراض النبات',
    shortSubtitleEn: 'Differentiating biotic pathogens from abiotic nutritional & salinity deficiencies',
    shortSubtitleFr: 'Différencier les attaques parasitaires des carences nutritionnelles et du stress abiotique',
    shortSubtitleAr: 'التمييز العلمي بين الأمراض الفطرية والحشرية ونقص العناصر الغذائية والإجهاد',
    formulaNotation: 'Disease Outbreak = Susceptible Host + Virulent Pathogen + Favorable Microclimate (T° & RH%)',
    iconName: 'Bug',
    accentColor: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900',
    summaryEn: 'Identifies crop disorders by analyzing symptom location (older vs younger leaves), lesion patterns (concentric rings, chlorotic halos, vein-delimited spots), and microclimate conditions, linking directly to Algerian INPV station hotlines.',
    summaryFr: 'Diagnostique les anomalies des cultures en analysant la position des symptômes (feuilles âgées vs jeunes pousses), la morphologie des taches et le climat, avec contact direct des stations INPV.',
    summaryAr: 'يشخص إصابات النباتات من خلال تحليل موقع العرض (أوراق سفلية قديمة أو قمم نامية) ونمط التبقع (حلقات متداخلة، اصفرار بين العروق) وربطها بمحطات المعهد الوطني لحماية النباتات (INPV).',
    steps: [
      {
        stepNumber: 1,
        headingEn: 'Nutrient Mobility vs Pathogen Attack',
        headingFr: 'Mobilité des Éléments vs Attaque Parasitaire',
        headingAr: 'حركية العناصر الغذائية مقابل الإصابة الحيوية',
        bodyEn: 'Mobile nutrient shortages (N, P, K, Mg) appear first on OLDER bottom leaves because the plant translocates reserves to new growth. Immobile shortages (Fe, Ca, B) appear on NEW young shoots. Fungal spots (Late Blight, Alternaria) have irregular margins and fungal mycelium.',
        bodyFr: 'Les carences en éléments mobiles (N, P, K, Mg) apparaissent d’abord sur les VIEILLES feuilles du bas. Les carences immobiles (Fe, Ca, B) touchent les JEUNES pousses. Les champignons présentent des taches avec nécrose et feutrage.',
        bodyAr: 'نقص العناصر المتحركة (N, P, K, Mg) يظهر أولاً على الأوراق السفلية القديمة. أما العناصر غير المتحركة (Fe, Ca, B) فتظهر على القمم النامية الجديدة. الفطريات تتميز ببقع غير منتظمة مع نمو غبيري.',
      },
    ],
    algerianContextEn: 'Addresses the major epidemic pressures in Algeria: Late Blight (Mildiou) in potato/tomato, Tuta absoluta in greenhouses, Yellow Rust in high-plain durum wheat, and Parlatoria date scale in southern palm groves.',
    algerianContextFr: 'Cible les menaces majeures en Algérie : Mildiou de la pomme de terre, Tuta absoluta sous serre, Rouille jaune du blé dur et Cochenille blanche du palmier.',
    algerianContextAr: 'يركز على أهم الآفات في الجزائر: الميلديو في البطاطا والطماطم، توتا أبسولوتـا، الصدأ الأصفر في القمح الصلب، وحشرة البارلاتوريا في النخيل.',
    practicalTips: [
      {
        tipEn: 'Take photos of both the upper and lower leaf surface in natural shade rather than direct blinding sunlight.',
        tipFr: 'Photographiez la face supérieure et inférieure des feuilles à l’ombre plutôt qu’en plein soleil direct.',
        tipAr: 'التقط صوراً للوجهين العلوي والسفلي للورقة في الظل الطبيعي وليس تحت أشعة الشمس المباشرة الساطعة.',
      },
    ],
  },

  soil_texture_awc: {
    id: 'soil_texture_awc',
    titleEn: 'How USDA Soil Texture & Available Water Capacity (AWC) Work',
    titleFr: 'Comment fonctionne la texture du sol USDA et la Réserve Utile (RU)',
    titleAr: 'كيف يعمل مثلث قوام التربة والسعة الحقلية والماء المتاح',
    shortSubtitleEn: 'Sand, silt, clay proportions and soil water retention hydraulics',
    shortSubtitleFr: 'Proportions sable, limon, argile et hydraulique de rétention d’eau',
    shortSubtitleAr: 'نسب الرمل والغرين والطين وقدرة التربة على تخزين المياه وتغذية الجذور',
    formulaNotation: 'AWC (mm/m) = 10 × (θ_{Field Capacity} - θ_{Wilting Point}) × Depth (m) × (1 - Stones)',
    iconName: 'Layers',
    accentColor: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
    summaryEn: 'Determines the soil textural class on the USDA ternary triangle (Sand, Silt, Clay %) and calculates Field Capacity (FC), Permanent Wilting Point (PWP), and Available Water Capacity (AWC / RU in mm/m) to govern irrigation depth.',
    summaryFr: 'Détermine la classe texturale sur le triangle USDA (Sable, Limon, Argile) et calcule la Capacité au Champ (CC), le Point de Flétrissement (PF) et la Réserve Utile (RU) pour optimiser les doses d’irrigation.',
    summaryAr: 'يحدد رتبة قوام التربة عبر المثلث الثلاثي العالمي، ويحسب السعة الحقلية ونقطة الذبول الدائم والماء المتاح في التربة (RU) لتحديد عمق ومواعيد الري بدقة.',
    steps: [
      {
        stepNumber: 1,
        headingEn: 'The Soil Textural Triangle',
        headingFr: 'Le Triangle des Textures',
        headingAr: 'مثلث قوام التربة الثلاثي',
        bodyEn: 'Clay (<0.002 mm) provides high water and nutrient storage but slow infiltration. Sand (0.05-2.0 mm) gives rapid drainage and aeration but low retention. Loam represents the agronomic sweet spot.',
        bodyFr: 'L’argile stocke l’eau et les minéraux mais draine lentement. Le sable draine vite mais retient peu. Le limon équilibré (loam) offre le compromis agronomique idéal.',
        bodyAr: 'الطين يخزن الماء والغذاء ولكن صرفه بطيء. الرمل سريع الصرف والتهوية ولكن تخزينه ضعيف. الطمي المتوازن هو الأفضل زراعياً.',
      },
    ],
    algerianContextEn: 'Heavy cracking vertic clays in the Chéliff valley require slow drip application to avoid surface ponding, whereas sandy soils in Oued Souf require ultra-frequent pulse fertigation.',
    algerianContextFr: 'Les argiles lourdes de la vallée du Chéliff exigent un goutte-à-goutte lent pour éviter la stagnation, tandis que les sables d’El Oued demandent des micro-irrigations très fréquentes.',
    algerianContextAr: 'أراضي وادي الشلف الطينية الثقيلة تتطلب رياً هادئاً بالتنقيط لمنع تجمع الماء، بينما رمال وادي سوف تتطلب رياً نبضياً متكرراً.',
    practicalTips: [
      {
        tipEn: 'Do not irrigate beyond Field Capacity; excess water drains below roots, wasting costly water and soluble nitrogen.',
        tipFr: 'N’irriguez jamais au-delà de la Capacité au Champ : l’eau excédentaire percole et lessive les nitrates hors des racines.',
        tipAr: 'لا تروِ أبداً بما يتجاوز السعة الحقلية؛ فالماء الزائد يتسرب تحت الجذور ويهدر النيتروجين والسماد الثمين.',
      },
    ],
  },

  soil_ph_nutrients: {
    id: 'soil_ph_nutrients',
    titleEn: 'How Soil pH & Nutrient Bioavailability Work',
    titleFr: 'Comment fonctionne le pH du sol et la biodisponibilité des éléments',
    titleAr: 'كيف تعمل حموضة التربة (pH) وقابلية امتصاص العناصر الغذائية',
    shortSubtitleEn: 'Troug diagram, alkaline calcareous fixation, and chelation strategies',
    shortSubtitleFr: 'Diagramme de Troug, blocage calcaire et stratégies de chélation du fer',
    shortSubtitleAr: 'مخطط تروغ لتيسر العناصر وتثبيت الكلس لشيلات الحديد والفوسفور',
    formulaNotation: 'Bioavailability = f(pH, Active CaCO₃ %, Redox Potential, Chelation Agent)',
    iconName: 'FlaskConical',
    accentColor: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900',
    summaryEn: 'Illustrates how soil acidity or alkalinity dictates the chemical solubility of macro- and micronutrients. In alkaline soils (pH > 7.8), Phosphorus, Iron, Zinc, and Manganese precipitate into unavailable insoluble mineral complexes.',
    summaryFr: 'Montre comment le pH conditionne la solubilité chimique des éléments minéraux. En sol calcaire alcalin (pH > 7.8), le Phosphore, le Fer, le Zinc et le Manganèse sont bloqués sous forme insoluble.',
    summaryAr: 'يوضح كيف تؤثر درجة حموضة وقلوية التربة على ذوبان العناصر الغذائية؛ حيث يؤدي ارتفاع الـ pH فوق 7.8 في الأراضي الكلسية إلى تثبيت الفوسفور والحديد والزنك والمنغنيز.',
    steps: [
      {
        stepNumber: 1,
        headingEn: 'Alkaline Calcareous Lock-up (pH 7.8–8.5)',
        headingFr: 'Blocage en Sol Calcaire Alcalin (pH 7.8 à 8.5)',
        headingAr: 'تثبيت العناصر في التربة الكلسية القلوية',
        bodyEn: 'Free calcium ions (Ca²⁺) react with applied orthophosphate (H₂PO₄⁻) to form insoluble tricalcium phosphate. Iron precipitates as ferric hydroxide Fe(OH)₃. Iron must be supplied as Fe-EDDHA (ortho-ortho isomer), which remains stable up to pH 9.0.',
        bodyFr: 'Le calcium libre réagit avec le phosphore pour former du phosphate tricalcique insoluble. Le fer précipite en hydroxyde. Il faut impérativement utiliser du Fer chélaté EDDHA (isomère ortho-ortho) stable jusqu’à pH 9.0.',
        bodyAr: 'يتفاعل الكالسيوم مع الفوسفور ليكون فوسفات ثلاثي الكالسيوم غير الذائب، ويترسب الحديد. الحل هو استخدام شيلات حديد EDDHA (أورثو-أورثو) المستقرة حتى pH 9.',
      },
    ],
    algerianContextEn: 'Over 85% of agricultural land in northern and steppe Algeria is alkaline calcareous (pH 7.8 - 8.4). Broadcast EDTA iron chelates degrade in 24 hours; only soil-applied EDDHA or foliar sprays succeed.',
    algerianContextFr: 'Plus de 85% des sols agricoles algériens sont calcaires (pH 7.8 à 8.4). Le Fer EDTA se dégrade en 24h ; seul le Fer EDDHA au sol ou les pulvérisations foliaires sont efficaces.',
    algerianContextAr: 'أكثر من 85% من أراضي الجزائر الزراعية كلسية قلوية. شيلات الحديد EDTA تفقد فعاليتها في التربة سريعاً، والاعتماد يجب أن يكون على شيلات EDDHA في الري.',
    practicalTips: [
      {
        tipEn: 'Inject nitric or phosphoric acid into drip lines to lower rootzone micro-pH from 8.2 to 6.5 during fertigation pulses.',
        tipFr: 'Injectez de l’acide nitrique ou phosphorique pour acidifier la zone racinaire à pH 6.5 pendant l’injection d’engrais.',
        tipAr: 'احقن حمض النيتريك أو الفوسفوريك لخفض pH حول الجذور إلى 6.5 أثناء دفعات التسميد لتحرير العناصر المثبتة.',
      },
    ],
  },

  fertigation_ab_tanks: {
    id: 'fertigation_ab_tanks',
    titleEn: 'How Dual Fertigation Stock Tanks (A & B Tanks) Work',
    titleFr: 'Comment fonctionne la gestion des bacs A et B de fertigation',
    titleAr: 'كيف تعمل كيمياء خلط أسمدة الري في خزاني التسميد A و B',
    shortSubtitleEn: 'Preventing insoluble gypsum and calcium phosphate precipitation in concentrated stock solutions',
    shortSubtitleFr: 'Éviter la formation de plâtre et de phosphate de calcium dans les solutions mères',
    shortSubtitleAr: 'منع ترسب الجبس وفوسفات الكالسيوم وانسداد شبكة الري بالتنقيط',
    formulaNotation: 'Tank A (Ca²⁺ + Fe-Chelates + K⁺)  ||  Tank B (Phosphates H₂PO₄⁻ + Sulfates SO₄²⁻ + Mg²⁺ + Acid)',
    iconName: 'Droplets',
    accentColor: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900',
    summaryEn: 'Enforces strict separation of incompatible fertilizer salts into two 100× concentrated stock tanks (Tank A and Tank B) to prevent the instant formation of insoluble gypsum (CaSO₄) and dicalcium phosphate (CaHPO₄) sludge.',
    summaryFr: 'Sépare les engrais incompatibles dans deux bacs concentrés à 100× (Bac A et Bac B) pour empêcher la formation immédiate de précipités de plâtre ou de phosphate de chaux.',
    summaryAr: 'يفصل الأسمدة غير المتوافقة في خزانين مركزين (خزان A وخزان B) لمنع التفاعل الكيميائي الذي ينتج عنه رواسب الجبس الأبيض التي تسد النقاطات فوراً.',
    steps: [
      {
        stepNumber: 1,
        headingEn: 'Tank A: The Calcium & Chelates Tank',
        headingFr: 'Bac A : Le Bac Calcium et Chélates',
        headingAr: 'الخزان A: خزان الكالسيوم والحديد والشيلات',
        bodyEn: 'Contains Calcium Nitrate Ca(NO₃)₂, Potassium Nitrate KNO₃, and Iron chelates (Fe-EDDHA / Fe-EDTA). Contains ZERO sulfates and ZERO phosphates.',
        bodyFr: 'Contient le Nitrate de Chaux, le Nitrate de Potasse et les Chélates de Fer. Zéro sulfate et zéro phosphate.',
        bodyAr: 'يحتوي على نترات الكالسيوم، نترات البوتاسيوم، وشيلات الحديد. خالٍ تماماً من السلفات والفوسفات.',
      },
      {
        stepNumber: 2,
        headingEn: 'Tank B: The Sulfate, Phosphate & Acid Tank',
        headingFr: 'Bac B : Le Bac Sulfates, Phosphates et Acides',
        headingAr: 'الخزان B: خزان السلفات والفوسفات والأحماض',
        bodyEn: 'Contains MAP (12-61-0), MKP (0-52-34), Potassium Sulfate (SOP), Magnesium Sulfate, Micronutrients (Zn, Mn, Cu, B), and Phosphoric/Nitric Acid.',
        bodyFr: 'Contient le MAP, MKP, Sulfate de Potasse, Sulfate de Magnésium, Oligo-éléments et Acide phosphorique.',
        bodyAr: 'يحتوي على سماد الماب، سلفات البوتاسيوم، سلفات المغنيسيوم، العناصر الصغرى وحمض الفوسفوريك.',
      },
    ],
    algerianContextEn: 'Essential for high-tech greenhouse plasticulture in Biskra (sidi okba, m\'ziraa) and Tipaza. Stock solutions are diluted 1:100 into the main irrigation line where concentrations remain well below precipitation thresholds.',
    algerianContextFr: 'Crucial pour le maraîchage sous serre à Biskra et Tipaza. Les solutions mères sont diluées à 1/100 dans la conduite principale sans risque de précipitation.',
    algerianContextAr: 'ضروري لبيوت البلاستيك في بسكرة وتيبازة. تخلط المحاليل المخففة بنسبة 1 إلى 100 في خط الري الرئيسي بأمان تام.',
    practicalTips: [
      {
        tipEn: 'Dissolve iron chelates in lukewarm water inside Tank A, and never put acids directly with iron EDDHA.',
        tipFr: 'Dissolvez les chélates de fer dans de l’eau tiède dans le Bac A, sans contact direct avec les acides purs.',
        tipAr: 'قم بإذابة شيلات الحديد في ماء فاتر في الخزان A، وتجنب وضع الأحماض المركزة مباشرة فوق شيلات الحديد.',
      },
    ],
  },

  gdd_phenology: {
    id: 'gdd_phenology',
    titleEn: 'How Growing Degree Days (GDD) & Thermal Time Work',
    titleFr: 'Comment fonctionnent les Degrés-Jours de Croissance (GDD) et la phénologie',
    titleAr: 'كيف تعمل الأيام الحرارية المتراكمة (GDD) وتتبع أطوار النمو',
    shortSubtitleEn: 'Predicting crop stages, flowering, and harvest maturity through accumulated heat units',
    shortSubtitleFr: 'Prédire les stades phénologiques, la floraison et la récolte par les sommes de températures',
    shortSubtitleAr: 'التنبؤ الدقيق بمواعيد التزهير والنضج والحصاد عبر تجميع الوحدات الحرارية',
    formulaNotation: 'GDD = max(0, ((T_{max} + T_{min}) / 2) - T_{base})',
    iconName: 'Thermometer',
    accentColor: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
    summaryEn: 'Plants require a specific cumulative thermal sum (heat units) above a biological base temperature (T_base) to transition from emergence to tillering, flowering, tuber bulking, and physiological maturity.',
    summaryFr: 'Les cultures nécessitent une somme thermique cumulée au-dessus d’une température de base biologique (T_base) pour franchir chaque stade : levée, floraison, tubérisation et maturité.',
    summaryAr: 'تحتاج النباتات إلى مجموع حراري تراكمي فوق درجة الحرارة الأساسية (T_base) للانتقال من مرحلة الإنبات إلى التفريع والتزهير وتعبئة الحبوب أو الدرنات والنضج التام.',
    steps: [
      {
        stepNumber: 1,
        headingEn: 'Biological Base Temperatures (T_base)',
        headingFr: 'Températures de Base Biologiques (T_base)',
        headingAr: 'درجات الحرارة الأساسية للمحاصيل',
        bodyEn: 'Cereals (Wheat/Barley): T_base = 0°C or 4°C. Potato: T_base = 6°C. Maize / Tomato: T_base = 10°C. Days with mean temperatures below T_base generate zero GDD.',
        bodyFr: 'Céréales (Blé/Orge) : T_base = 0°C à 4°C. Pomme de terre : 6°C. Maïs / Tomate : 10°C. Les jours froids sous la base ne cumulent aucun GDD.',
        bodyAr: 'الحبوب (قمح/شعير): 0 إلى 4 درجات مئوية. البطاطا: 6 درجات. الطماطم والذرة: 10 درجات مئوية. الأيام الباردة لا تراكم وحدات حرارية.',
      },
    ],
    algerianContextEn: 'Explains why potatoes planted in September in Ain Defla take 110 days to mature, whereas autumn potatoes planted in Biskra mature in just 85 days due to higher daily thermal sums.',
    algerianContextFr: 'Explique pourquoi la pomme de terre d’arrière-saison met 110 jours à mûrir à Aïn Defla contre seulement 85 jours à Biskra grâce au climat saharien chaud.',
    algerianContextAr: 'يفسر لماذا تأخذ بطاطا عين الدفلى 110 أيام للنضج بينما تنضج بطاطا بسكرة في 85 يوماً فقط بفضل تراكم الحرارة السريع.',
    practicalTips: [
      {
        tipEn: 'Use GDD forecasts to schedule preventative fungicide sprays right before the high-risk sporulation thermal window.',
        tipFr: 'Utilisez les GDD pour caler les traitements fongicides préventifs avant le pic thermique de sporulation.',
        tipAr: 'استخدم مؤشر GDD لجدولة رش المبيدات الفطرية الوقائية قبل وصول الطقس للمرحلة الحرارية الملائمة لانتشار الفطر.',
      },
    ],
  },

  seed_rate_population: {
    id: 'seed_rate_population',
    titleEn: 'How Seeding Rate & Plant Density Calculation Works',
    titleFr: 'Comment fonctionne le calcul de la dose de semis et de la densité de peuplement',
    titleAr: 'كيف يعمل حساب كمية البذور وكثافة الزراعة بالهكتار',
    shortSubtitleEn: 'Certified seed requirements adjusted for Thousand Kernel Weight (TKW), purity, and germination loss',
    shortSubtitleFr: 'Besoins en semences certifiées ajustés au PMG, à la pureté et aux pertes à la levée',
    shortSubtitleAr: 'حساب كمية البذور المعتمدة بدقة بناءً على وزن 1000 حبة ونسبة الإنبات وخسائر الحقل',
    formulaNotation: 'Seed Rate (kg/ha) = (Target Plants/m² × TKW (g)) / (Purity % × Germination % × (1 - Field Loss)) ÷ 100',
    iconName: 'Sprout',
    accentColor: 'text-lime-600 bg-lime-50 dark:bg-lime-950/40 border-lime-200 dark:border-lime-900',
    summaryEn: 'Computes exact seed mass (kg/ha) or potato seed tubers required per hectare, factoring in Thousand Kernel Weight (TKW / PMG), official certified germination rates, and seedbed preparation losses.',
    summaryFr: 'Calcule la masse exacte de semences (kg/ha) ou de plants de pomme de terre par hectare selon le Poids de Mille Grains (PMG), la faculté germinative et les pertes de lit de semence.',
    summaryAr: 'يحسب الوزن الدقيق للبذور (كغ/هكتار) أو درنات البطاطا المطلوبة، مع مراعاة وزن 1000 حبة (PMG) ونسبة الإنبات المعتمدة من CCLS وخسائر مرقد البذرة.',
    steps: [
      {
        stepNumber: 1,
        headingEn: 'Target Plant Density per m²',
        headingFr: 'Densité de Plantes Cible par m²',
        headingAr: 'الكثافة النباتية المستهدفة في المتر المربع',
        bodyEn: 'Durum wheat in semi-arid Sétif: 280–320 grains/m² (limited moisture). Irrigated wheat in Mitidja/Guelma: 380–450 grains/m². Potato: 40,000–50,000 plants/ha.',
        bodyFr: 'Blé dur à Sétif (pluvial) : 280 à 320 grains/m². Blé irrigué à Guelma/Mitidja : 380 à 450 grains/m². Pomme de terre : 40 000 à 50 000 pieds/ha.',
        bodyAr: 'القمح الصلب في سطيف (بعلي): 280 إلى 320 حبة/م². القمح المسقي في قالمة والمتيجة: 380 إلى 450 حبة/م². البطاطا: 40 إلى 50 ألف نبتة/هكتار.',
      },
    ],
    algerianContextEn: 'Optimizes seed expenses with CCLS (Coopérative des Céréales et Légumes Secs) certified seed bags, preventing overly dense sowing that exhausts soil moisture during spring droughts.',
    algerianContextFr: 'Évite le gaspillage de semences certifiées CCLS et prévient la surdensité qui épuise la réserve en eau du sol avant l’épiaison.',
    algerianContextAr: 'يوفر تكاليف شراء البذور المعتمدة من تعاونيات الحبوب CCLS، ويمنع الزراعة الكثيفة التي تستنزف رطوبة التربة قبل مرحلة طرد السنابل.',
    practicalTips: [
      {
        tipEn: 'Calibrate your drill seeder on a 100m test track before sowing the entire parcel.',
        tipFr: 'Étalonnez votre semoir sur une bande d’essai de 100 mètres avant d’ensemencer la parcelle.',
        tipAr: 'قم بمعايرة آلة البذر (Semoir) على مسافة 100 متر للتأكد من نزول الوزن الدقيق قبل زراعة كامل الحقل.',
      },
    ],
  },

  yield_estimation: {
    id: 'yield_estimation',
    titleEn: 'How Pre-Harvest Yield Estimation & Yield Gap Work',
    titleFr: 'Comment fonctionne l’estimation du rendement avant récolte et le Yield Gap',
    titleAr: 'كيف يعمل تقدير المحصول قبل الحصاد وتحليل الفجوة الإنتاجية',
    shortSubtitleEn: 'Yield components breakdown: ear density, grains per spikelet, and thousand-kernel weight',
    shortSubtitleFr: 'Composantes du rendement : épis au m², grains par épi et poids de mille grains',
    shortSubtitleAr: 'تفكيك مكونات الإنتاج: عدد السنابل في المتر المربع، حبوب السنبلة، ووزن 1000 حبة',
    formulaNotation: 'Yield (t/ha) = Ears/m² × Grains/Ear × TKW (g) × 10⁻⁵',
    iconName: 'Scale',
    accentColor: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
    summaryEn: 'Forecasts final field yield 3-4 weeks prior to harvest by sampling biological yield components across representative quadrats, helping plan storage, logistics, and harvest machinery.',
    summaryFr: 'Estime le rendement final 3 à 4 semaines avant la moisson en échantillonnant les composantes biologiques sur des placettes représentatives.',
    summaryAr: 'يقدر الإنتاج النهائي بدقة قبل 3 إلى 4 أسابيع من الحصاد عبر أخذ عينات عشوائية من الحقل، مما يساعد في التخطيط اللوجستي وتوفير الحصادات وشاحنات النقل.',
    steps: [
      {
        stepNumber: 1,
        headingEn: 'Biological Yield Components',
        headingFr: 'Les Trois Composantes du Rendement',
        headingAr: 'المكونات الثلاثة لإنتاج الحبوب',
        bodyEn: '1. Number of fertile ears per m². 2. Number of filled grains per ear. 3. Thousand Kernel Weight (TKW). For Potato: Number of stems/m² × Tubers/plant × Average tuber mass (g).',
        bodyFr: '1. Nombre d’épis fertiles/m². 2. Nombre de grains pleins par épi. 3. PMG (g). Pour la pomme de terre : Tiges/m² × Tubercules/pied × Poids moyen.',
        bodyAr: '1. عدد السنابل الخصبة في المتر المربع. 2. عدد الحبوب الممتلئة في السنبلة. 3. وزن 1000 حبة. وللبطاطا: عدد الدرنات في الشجيرة × متوسط وزن الدرنة.',
      },
    ],
    algerianContextEn: 'Enables grain farmers to accurately declare expected tonnage to OAIC (Office Algérien Interprofessionnel des Céréales) collection silos ahead of peak harvest queues.',
    algerianContextFr: 'Permet aux céréaliculteurs d’anticiper les livraisons aux silos de l’OAIC et d’organiser les moissonneuses-batteuses sans retard.',
    algerianContextAr: 'يمكن مزارعي الحبوب من التصريح الدقيق بالكميات المتوقعة لصوامع الديوان المهني للحبوب (OAIC) وحجز الحصادات والشاحنات مسبقاً.',
    practicalTips: [
      {
        tipEn: 'Sample at least 5 different 1-square-meter quadrats across a diagonal W-pattern in each parcel.',
        tipFr: 'Prélévez au moins 5 placettes de 1 m² selon un parcours en W sur l’ensemble de la parcelle.',
        tipAr: 'خذ عينات من 5 مواقع مختلفة على شكل حرف W عبر الحقل لتفادي تأثير أطراف الأرض والحصول على متوسط دقيق.',
      },
    ],
  },

  water_hardness_sar: {
    id: 'water_hardness_sar',
    titleEn: 'How Water Salinity, Hardness & SAR Diagnostics Work',
    titleFr: 'Comment fonctionne le diagnostic de salinité, dureté et SAR de l’eau',
    titleAr: 'كيف يعمل تشخيص ملوحة وقساوة مياه الري ونسبة امتزاز الصوديوم (SAR)',
    shortSubtitleEn: 'ECw, Sodium Adsorption Ratio, Residual Sodium Carbonate (RSC), and soil structure risk',
    shortSubtitleFr: 'Conductivité électrique, rapport d’adsorption du sodium (SAR) et risque d’alcalinisation',
    shortSubtitleAr: 'الناقلية الكهربائية، خطر الصوديوم على بنية التربة، والبيكربونات المسببة لانسداد الشبكات',
    formulaNotation: 'SAR = Na⁺ / √((Ca²⁺ + Mg²⁺) / 2)  |  RSC = (CO₃²⁻ + HCO₃⁻) - (Ca²⁺ + Mg²⁺) (meq/L)',
    iconName: 'Droplets',
    accentColor: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
    summaryEn: 'Assesses irrigation water quality risks: osmotic salinity stress (ECw in dS/m), soil dispersion/infiltration hazard (SAR), and lime precipitation risk in drip emitters (RSC and bicarbonates).',
    summaryFr: 'Évalue la qualité de l’eau d’irrigation : stress osmotique (CE en dS/m), risque de dégradation de la structure du sol (SAR) et entartrage des goutteurs (RSC et bicarbonates).',
    summaryAr: 'يشخص جودة مياه الري ومخاطرها: الإجهاد الأسموزي الملحي (ECw)، تدهور نفاذية وبنية التربة بفعل الصوديوم (SAR)، وتكلس وانسداد النقاطات بسبب البيكربونات (RSC).',
    steps: [
      {
        stepNumber: 1,
        headingEn: 'Sodium Adsorption Ratio (SAR)',
        headingFr: 'Rapport d’Adsorption du Sodium (SAR)',
        headingAr: 'نسبة امتزاز الصوديوم (SAR)',
        bodyEn: 'High sodium with low calcium/magnesium disperses soil clay platelets, causing soil sealing, crusting, and total loss of infiltration. Corrected with agricultural gypsum (CaSO₄).',
        bodyFr: 'Un excès de sodium par rapport au calcium détruit la structure de l’argile et bloque l’infiltration de l’eau. Corrigé par apport de gypse.',
        bodyAr: 'زيادة الصوديوم مقارنة بالكالسيوم تفكك حبيبات الطين وتغلق مسامات التربة فتمنع تسرب الماء. يعالج ذلك بإضافة الجبس الزراعي.',
      },
    ],
    algerianContextEn: 'Essential for deep Saharan borehole management (Chott Melrhir basin, Souf, M’zab), where high mineralized water must be balanced with gypsum and organic soil amendments.',
    algerianContextFr: 'Crucial pour les forages sahariens profonds (bassin du Chott Melrhir, Souf, M’zab) où les eaux minéralisées nécessitent des amendements réguliers.',
    algerianContextAr: 'ضروري لآبار الجنوب الجزائري العميقة ذات الملوحة العالية، للحفاظ على خصوبة الرمل وعدم تملح التربة حول جذور النخيل والخضار.',
    practicalTips: [
      {
        tipEn: 'Inject 0.5-1.0 L of nitric acid per 1000L irrigation cycle monthly to descale calcium carbonate from drip labyrinths.',
        tipFr: 'Injectez de l’acide nitrique à faible dose une fois par mois pour dissoudre le tartre dans les labyrinthes des goutteurs.',
        tipAr: 'احقن كمية بسيطة من حمض النيتريك شهرياً لإذابة التكلسات الكلسية داخل مجاري المنقطات والحفاظ على تدفقها المنتظم.',
      },
    ],
  },

  compost_c_n_balance: {
    id: 'compost_c_n_balance',
    titleEn: 'How Organic Matter & Compost C:N Ratio Work',
    titleFr: 'Comment fonctionne l’équilibre C/N du compost et de la matière organique',
    titleAr: 'كيف يعمل توازن نسبة الكربون إلى النيتروجين (C:N) في التسميد العضوي',
    shortSubtitleEn: 'Optimal 25:1 to 30:1 microbial composting ratio and prevention of nitrogen lock-up',
    shortSubtitleFr: 'Rapport optimal de 25 à 30 pour l’activité microbienne et prévention de la faim d’azote',
    shortSubtitleAr: 'النسبة المثالية 25 إلى 30 لنشاط بكتيريا التحلل ومنع حدوث ظاهرة جوع النيتروجين',
    formulaNotation: 'C:N Ratio = Total Carbon (kg) / Total Nitrogen (kg)  |  Optimum: 25 - 30 : 1',
    iconName: 'Package',
    accentColor: 'text-amber-800 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
    summaryEn: 'Balances high-carbon "brown" materials (straw, palm fronds, sawdust: 80:1) with high-nitrogen "green" materials (manure, vegetable waste: 12:1) to fuel thermophilic microbial humification without nitrogen immobilization ("faim d’azote").',
    summaryFr: 'Équilibre les matières carbonées brunes (paille, palmes, sciure) et azotées vertes (fumier, déchets végétaux) pour réussir le compostage aérobie sans bloquer l’azote du sol.',
    summaryAr: 'يوازن بين المواد الكربونية البنية (القش، جريد النخيل، نشارة الخشب) والمواد النيتروجينية الخضراء (السماد الحيواني، بقايا الخضر) لتنشيط التحلل دون تجويع النبات.',
    steps: [
      {
        stepNumber: 1,
        headingEn: 'The Nitrogen Starvation Risk (C:N > 35:1)',
        headingFr: 'Le Risque de Faim d’Azote (C/N > 35)',
        headingAr: 'خطر ظاهرة جوع النيتروجين (C:N > 35)',
        bodyEn: 'When raw uncomposted straw or wood chips are incorporated into soil, soil bacteria consume all available soil nitrate to break down the carbon, leaving zero nitrogen for the crop.',
        bodyFr: 'Si de la paille brute ou de la sciure est enfouie sans azote, les bactéries consomment tout l’azote du sol pour décomposer le carbone, affamant la culture.',
        bodyAr: 'عند دفن القش أو النشارة غير المتحللة في التربة، تستهلك البكتيريا كل نيتروجين الأرض لتحليل الكربون فيصفر المحصول ويجوع.',
      },
    ],
    algerianContextEn: 'Recycling sheep and poultry manure (Fumier de volaille/ovin) with date palm biomass in Biskra and cereal straw in Sétif restores soil organic matter from < 1.0% to healthy 2.5%.',
    algerianContextFr: 'Le compostage des fumiers de volailles et d’ovins avec les palmes sèches au Sud ou la paille dans les Hauts Plateaux permet de remonter le taux de matière organique de <1% à 2.5%.',
    algerianContextAr: 'خلط غبار الدواجن أو الأغنام مع جريد النخيل في الجنوب أو التبن في الهضاب يرفع المادة العضوية في التربة الجزائرية من أقل من 1% إلى 2.5%.',
    practicalTips: [
      {
        tipEn: 'Maintain 50–60% moisture in the compost pile (a squeezed handful should feel like a damp sponge without dripping).',
        tipFr: 'Maintenez 50 à 60% d’humidité dans le tas de compost (humide au toucher sans goutter).',
        tipAr: 'حافظ على رطوبة كومة الكمبوست بين 50 و60% (تكون رطبة كالإسفنجة المعصورة دون أن تقطر ماءً).',
      },
    ],
  },

  active_matter_irac_frac: {
    id: 'active_matter_irac_frac',
    titleEn: 'How Active Ingredients & IRAC/FRAC Resistance Work',
    titleFr: 'Comment fonctionne la rotation des matières actives et les codes IRAC/FRAC',
    titleAr: 'كيف تعمل المواد الفعالة وتناوب مجموعات المقاومة IRAC و FRAC',
    shortSubtitleEn: 'Biochemical mode of action classification and preventing pest resistance selection',
    shortSubtitleFr: 'Modes d’action biochimiques et prévention de l’accoutumance des ravageurs',
    shortSubtitleAr: 'طرق التأثير البيوكيميائية وتناوب المبيدات لمنع اكتساب الآفات للمناعة والمقاومة',
    formulaNotation: 'Rotation Rule: Alternate Group X (e.g. IRAC 28 Diamides) with Group Y (e.g. IRAC 5 Spinosyns)',
    iconName: 'ShieldCheck',
    accentColor: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900',
    summaryEn: 'Groups active substances by their cellular target site (nerve & muscle, respiration, sterol biosynthesis, lipid synthesis) to enforce rotating different chemical families, stopping resistant biotypes from spreading.',
    summaryFr: 'Regroupe les matières actives selon leur site d’action biochimique (système nerveux, respiration, biosynthèse des stérols) pour imposer une alternance stricte contre les résistances.',
    summaryAr: 'يصنف المبيدات حسب آلية تأثيرها داخل جسم الحشرة أو الفطر (الجهاز العصبي، التنفس الخلوي، بناء الجدار) لإلزام المزارع بتغيير العائلة الكيميائية ومنع ظهور سلالات مقاومة.',
    steps: [
      {
        stepNumber: 1,
        headingEn: 'Target Site Cross-Resistance',
        headingFr: 'Résistance Croisée au Même Site d’Action',
        headingAr: 'المقاومة المتصالبة لنفس موقع التأثير',
        bodyEn: 'Changing commercial brand names does NOT prevent resistance if both products share the same IRAC/FRAC code (e.g. switching between two pyrethroids IRAC 3A).',
        bodyFr: 'Changer de nom commercial ne sert à rien si les deux produits ont le même code IRAC/FRAC (ex : alterner deux pyréthrinoïdes du groupe 3A).',
        bodyAr: 'تغيير الاسم التجاري للمبيد لا يفيد إذا كان المنتجان ينتميان لنفس رمز المجموعة الكيميائية (مثل التبديل بين مبيدين من مجموعة البيرثرينات 3A).',
      },
    ],
    algerianContextEn: 'Vital for combating Tuta absoluta and Whitefly (Bemisia tabaci) resistance in tomato crops across Biskra, and powdery mildew (Oïdium) resistance in Mitidja vineyards.',
    algerianContextFr: 'Indispensable pour briser la résistance de Tuta absoluta et de la mouche blanche sous serre à Biskra, ainsi que l’oïdium de la vigne en Mitidja.',
    algerianContextAr: 'حاسم للقضاء على مناعة حشرة التوتا أبسولوتا والذبابة البيضاء في طماطم بسكرة، والبياض الدقيقي في كروم المتيجة.',
    practicalTips: [
      {
        tipEn: 'Never apply products from the same IRAC/FRAC group more than twice consecutively in a single growing season.',
        tipFr: 'N’appliquez jamais un produit du même groupe IRAC/FRAC plus de 2 fois de suite au cours d’une saison.',
        tipAr: 'لا ترش أي مبيد من نفس المجموعة الكيميائية أكثر من مرتين متتاليتين في الموسم الواحد.',
      },
    ],
  },

  rusle_erosion: {
    id: 'rusle_erosion',
    titleEn: 'How RUSLE Soil Erosion Risk Modeling Works',
    titleFr: 'Comment fonctionne la modélisation de l’érosion des sols RUSLE',
    titleAr: 'كيف يعمل نموذج تقدير انجراف التربة العالمي (RUSLE)',
    shortSubtitleEn: 'Rainfall erosivity, soil erodibility, slope length, cover management, and contour protection',
    shortSubtitleFr: 'Érosivité des pluies, érodibilité du sol, longueur de pente et pratiques antiérosives',
    shortSubtitleAr: 'قوة الأمطار، قابلية التربة للانجراف، طول وانحدار الميل، والغطاء النباتي الواقي',
    formulaNotation: 'A = R × K × LS × C × P  (Soil Loss in tons/ha/year)',
    iconName: 'Mountain',
    accentColor: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
    summaryEn: 'Estimates annual soil loss (tons/ha/year) caused by water runoff using the Revised Universal Soil Loss Equation (RUSLE), accounting for slope angle, storm intensity, and conservation practices.',
    summaryFr: 'Estime les pertes annuelles en terre (tonnes/ha/an) sous l’effet du ruissellement selon l’Équation Universelle de Perte en Terre Révisée (RUSLE).',
    summaryAr: 'يحسب كمية التربة المنجرفة سنوياً (طن/هكتار/سنة) بفعل مياه الأمطار والجريان السطحي بناءً على معادلة الانجراف العالمية المعتمدة.',
    steps: [
      {
        stepNumber: 1,
        headingEn: 'The Five Erosion Factors',
        headingFr: 'Les Cinq Facteurs d’Érosion',
        headingAr: 'العوامل الخمسة المسببة لانجراف التربة',
        bodyEn: 'R = Rainfall erosivity. K = Soil erodibility (silt/sand content). LS = Slope length & steepness. C = Crop cover management. P = Support practices (terracing, contour plowing).',
        bodyFr: 'R = Pluie. K = Vulnérabilité du sol. LS = Pente. C = Couverture végétale. P = Pratiques anti-érosives (banquettes, travail en courbes de niveau).',
        bodyAr: 'R = شدة الأمطار. K = هشاشة التربة. LS = طول وشدة الانحدار. C = نوع الغطاء النباتي. P = الإجراءات الوقائية (الحراثة الكنتورية والمصاطب).',
      },
    ],
    algerianContextEn: 'Critical for the mountainous Tell Atlas, Dahra, and Medea hillsides, where torrential autumn storms wash away topsoil into dam reservoirs (siltation of dams like Keddara and Beni Haroun).',
    algerianContextFr: 'Critique pour les montagnes de l’Atlas Tellien, du Dahra et des collines de Médéa, où les orages automnaux torrentiels lessivent la terre arable vers les retenues de barrages (envasement de Keddara et Beni Haroun).',
    algerianContextAr: 'بالغ الأهمية لمرتفعات الأطلس التلي والظهرة والمدية لحماية التربة الخصبة من الانجراف ومنع توحل السدود (سد بني هارون وقدارة).',
    practicalTips: [
      {
        tipEn: 'Always plow across the contour lines (perpendicular to slope) rather than up-and-down the hill.',
        tipFr: 'Labourez toujours perpendiculairement à la pente (en suivant les courbes de niveau).',
        tipAr: 'احرث دائماً بشكل عمودي على اتجاه انحدار الجبل (على خطوط التسوية الكنتورية) وليس من الأعلى إلى الأسفل.',
      },
    ],
  },

  vpd_greenhouse: {
    id: 'vpd_greenhouse',
    titleEn: 'How Vapor Pressure Deficit (VPD) in Greenhouses Works',
    titleFr: 'Comment fonctionne le Déficit de Pression de Vapeur (DPV / VPD)',
    titleAr: 'كيف يعمل عجز ضغط البخار (VPD) والتحكم في رطوبة البيوت المحمية',
    shortSubtitleEn: 'Transpiration driving force, calcium mobility, and powdery mildew prevention',
    shortSubtitleFr: 'Moteur de la transpiration, transport du calcium et prévention des maladies',
    shortSubtitleAr: 'القوة المحركة لنتح النبات وامتصاص الكالسيوم ومنع تعفن القمة النامية والبياض الدقيقي',
    formulaNotation: 'VPD (kPa) = VP_{sat}(T_{leaf}) - VP_{air}(T_{air}, RH%)  |  Optimum: 0.8 - 1.2 kPa',
    iconName: 'Thermometer',
    accentColor: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900',
    summaryEn: 'VPD represents the drying power of the greenhouse atmosphere. It controls stomatal aperture: low VPD (<0.4 kPa) halts transpiration and causes Blossom End Rot (Calcium deficiency), while high VPD (>1.6 kPa) causes stomatal closure and wilting.',
    summaryFr: 'Le DPV mesure la force d’évaporation de l’air dans la serre. Il régule l’ouverture des stomates : un DPV trop bas (<0.4 kPa) bloque le calcium et provoque le cul noir de la tomate.',
    summaryAr: 'يمثل عجز ضغط البخار القوة التي تسحب الماء من الجذور إلى الأوراق. إذا كان منخفضاً جداً يتوقف انتقال الكالسيوم ويحدث تعفن طرف الثمرة (Blossom End Rot).',
    steps: [
      {
        stepNumber: 1,
        headingEn: 'Target VPD Zones',
        headingFr: 'Plages Cibles de VPD',
        headingAr: 'نطاقات VPD المثالية للنمو',
        bodyEn: 'Seedlings/Propagation: 0.4–0.8 kPa. Vegetative Growth: 0.8–1.1 kPa. Flowering & Fruit Set: 1.0–1.3 kPa. Above 1.6 kPa: Severe heat/dry stress.',
        bodyFr: 'Jeunes plants : 0.4 à 0.8 kPa. Croissance végétative : 0.8 à 1.1 kPa. Floraison et nouaison : 1.0 à 1.3 kPa. Au-delà de 1.6 kPa : fermeture des stomates.',
        bodyAr: 'الشتلات: 0.4 إلى 0.8. النمو الخضري: 0.8 إلى 1.1. التزهير والعقد: 1.0 إلى 1.3 كيلوباسكال. فوق 1.6: إجهاد حراري وإغلاق للثغور.',
      },
    ],
    algerianContextEn: 'Essential for protected tomato and pepper crops in Biskra and Tipaza. Opening roof vents at dawn evacuates saturated humid air (VPD < 0.3), preventing Botrytis and Cladosporium outbreaks.',
    algerianContextFr: 'Indispensable sous serre maraîchère à Biskra et Tipaza. Aérer à l’aube évacue l’air saturé pour stopper le Botrytis et le Cladosporiose.',
    algerianContextAr: 'ضروري لبيوت الطماطم البلاستيكية في بسكرة وتيبازة؛ فتح التهوية عند الفجر يطرد الرطوبة الخانقة ويمنع مرض العفن الرمادي (Botrytis).',
    practicalTips: [
      {
        tipEn: 'Measure leaf temperature with an infrared thermometer; sunlit greenhouse leaves are often 2–3°C warmer than ambient air.',
        tipFr: 'Mesurez la température des feuilles au thermomètre infrarouge (souvent 2 à 3°C de plus que l’air ambiant).',
        tipAr: 'قس درجة حرارة الورقة بمحرار الأشعة تحت الحمراء؛ فالأوراق المعرضة للشمس تكون أدفأ بـ 2-3 درجات من هواء البيت.',
      },
    ],
  },

  frost_protection: {
    id: 'frost_protection',
    titleEn: 'How Radiation & Advective Frost Protection Works',
    titleFr: 'Comment fonctionne la protection contre les gelées blanches et noires',
    titleAr: 'كيف تعمل حماية المحاصيل من الصقيع الإشعاعي والانتقالي',
    shortSubtitleEn: 'Wet-bulb temperature, dew point, inversion layers, and latent heat of freezing',
    shortSubtitleFr: 'Température du thermomètre mouillé, point de rosée et chaleur latente de congélation',
    shortSubtitleAr: 'درجة حرارة النقطة الرطبة ونقطة الندى والحرارة الكامنة لتحول الماء إلى جليد واقٍ',
    formulaNotation: 'T_{wet} = f(T_{dry}, RH%, Pressure)  |  Latent Heat Released = 334 kJ/kg of freezing water',
    iconName: 'Sun',
    accentColor: 'text-cyan-700 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-900',
    summaryEn: 'Differentiates spring radiation frosts (clear skies, calm wind, thermal inversion) from advective polar cold fronts, evaluating wet-bulb temperature and sprinkler irrigation protection.',
    summaryFr: 'Distingue les gelées radiatives de printemps (ciel clair, vent nul) des gelées advectives polaires, en calculant la température humide pour activer l’aspersion.',
    summaryAr: 'يميز بين الصقيع الإشعاعي الربيعي (سماء صافية ورياح ساكنة) والصقيع الهوائي القطبي، ويحسب نقطة الندى لتشغيل الرش الوقائي وإطلاق الحرارة الكامنة.',
    steps: [
      {
        stepNumber: 1,
        headingEn: 'Sprinkler Protection & Latent Heat',
        headingFr: 'Protection par Aspersion et Chaleur Latente',
        headingAr: 'الحماية بالرش بالماء والحرارة الكامنة',
        bodyEn: 'When liquid water freezes into ice on the plant surface, it releases 334 Joules of heat per gram of water, holding the plant tissue at exactly 0°C without freezing inside the cell.',
        bodyFr: 'Lorsque l’eau liquide gèle sur la plante, elle libère 334 J/g de chaleur latente, maintenant le tissu végétal à 0°C sans gel intracellulaire.',
        bodyAr: 'عندما يتجمد الماء فوق الورقة فإنه يطلق 334 جول/غرام من الحرارة الكامنة، مما يحفظ الأنسجة عند 0 مئوية ويمنع تجمد خلايا النبات الداخلية.',
      },
    ],
    algerianContextEn: 'Protects spring potato crops in Batna, Sétif, and Ain Oussera, and early almond/apricot flowering in Aurès and Hodna basins against late March frost spells.',
    algerianContextFr: 'Protège la pomme de terre à Batna et Sétif, ainsi que les vergers d’abricotiers et d’amandiers des Aurès contre les gelées tardives de mars.',
    algerianContextAr: 'يحمي حقول بطاطا باتنة وسطيف وعين وسارة وبساتين المشمش واللوز في الأوراس والحضنة من صقيع أواخر مارس المباغت.',
    practicalTips: [
      {
        tipEn: 'Do not turn off frost sprinkler pumps in the morning until all ice has completely melted under the sun.',
        tipFr: 'N’arrêtez jamais l’aspersion anti-gel le matin tant que la glace n’a pas complètement fondu au soleil.',
        tipAr: 'لا توقف مضخة الرش في الصباح حتى يذوب كل الجليد المتراكم تماماً تحت أشعة الشمس لمنع تجمد النبتة فجأة.',
      },
    ],
  },

  ipm_pest_threshold: {
    id: 'ipm_pest_threshold',
    titleEn: 'How Economic Injury Level (EIL) & IPM Thresholds Work',
    titleFr: 'Comment fonctionne le Seuil Économique de Nuisibilité (SEN / EIL)',
    titleAr: 'كيف يعمل الحد الاقتصادي الحرج والمكافحة المتكاملة للآفات (IPM)',
    shortSubtitleEn: 'Cost-benefit balance between chemical application costs and prevented crop loss',
    shortSubtitleFr: 'Arbitrage coût du traitement vs valeur de la récolte préservée',
    shortSubtitleAr: 'الموازنة الاقتصادية بين تكلفة رش المبيد وقيمة المحصول المهدد بالضرر',
    formulaNotation: 'EIL = Cost of Control / (Market Value × Damage per Pest × Efficacy)  |  Action Threshold ≈ 0.75 × EIL',
    iconName: 'Bug',
    accentColor: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900',
    summaryEn: 'Defines the exact pest infestation level at which the financial cost of a chemical spray is strictly less than the crop value that would otherwise be lost.',
    summaryFr: 'Définit le seuil d’infestation exact à partir duquel le coût d’une intervention chimique est inférieur aux pertes financières causées par le ravageur.',
    summaryAr: 'يحدد الكثافة العددية الدقيقة للآفة في الحقل التي يصبح عندها التدخل بالمبيد مجدياً اقتصادياً لأن تكلفة الرش أقل من الخسارة المتوقعة في المحصول.',
    steps: [
      {
        stepNumber: 1,
        headingEn: 'Action Threshold (AT) vs Economic Injury Level (EIL)',
        headingFr: 'Seuil d’Intervention (SI) vs Seuil de Nuisibilité (SEN)',
        headingAr: 'عتبة التدخل مقابل الحد الاقتصادي الحرج',
        bodyEn: 'Treatment must be triggered at the Action Threshold (before the pest population reaches the damaging EIL), accounting for incubation time and sprayer logistics.',
        bodyFr: 'Le traitement doit être déclenché au Seuil d’Intervention, avant que la population n’atteigne le seuil de dégâts irrémédiables.',
        bodyAr: 'يجب البدء في الرش عند بلوغ عتبة التدخل وقبل وصول أعداد الآفة إلى الحد الحرج لإعطاء المبيد وقتاً للتأثير.',
      },
    ],
    algerianContextEn: 'Prevents routine, calendar-based prophylactic spraying in Algerian potato and olive crops, protecting beneficial predatory insects (ladybirds, chrysopes) and saving thousands of Dinars.',
    algerianContextFr: 'Met fin aux traitements calendaires systématiques en maraîchage et arboriculture en Algérie, préservant la faune utile et réduisant les charges.',
    algerianContextAr: 'يوقف الرش العشوائي المعتمد على التواريخ الروتينية في الخضار والزيتون، مما يحمي الحشرات النافعة ويوفر ميزانية المزارع.',
    practicalTips: [
      {
        tipEn: 'Count pests across 20 randomly distributed plants per hectare once every 4 days during peak vegetative growth.',
        tipFr: 'Contrôlez 20 plantes au hasard par hectare tous les 4 jours en période de forte pousse.',
        tipAr: 'افحص 20 نبتة عشوائية في الهكتار كل 4 أيام خلال فترات النمو السريع للتأكد من أعداد الآفة بدقة.',
      },
    ],
  },

  generic_formula: {
    id: 'generic_formula',
    titleEn: 'How Agronomic Formulas & Scientific Principles Work',
    titleFr: 'Comment fonctionnent les formules et principes agronomiques',
    titleAr: 'كيف تعمل النماذج والمعادلات الزراعية العلمية',
    shortSubtitleEn: 'First-principles physics, plant physiology, and soil chemistry models',
    shortSubtitleFr: 'Modélisation physique, physiologique et chimique des cultures',
    shortSubtitleAr: 'نماذج الفيزياء وفسيولوجيا النبات وكيمياء التربة المطبقة في الحسابات',
    formulaNotation: 'Output = f(Agronomic Variables, Physical Constants, Environmental Boundary Conditions)',
    iconName: 'Sparkles',
    accentColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
    summaryEn: 'Provides verified mathematical and biological algorithms derived from FAO, USDA, INRA, and Algerian field trial standards to optimize resource efficiency, prevent soil degradation, and maximize crop yields.',
    summaryFr: 'Fournit des algorithmes validés issus des standards FAO, USDA, INRA et des essais au champ en Algérie pour optimiser les rendements et préserver les sols.',
    summaryAr: 'يقدم معادلات رياضية وبيولوجية معتمدة من منظمة الفاو والجامعات ومحطات التجارب الجزائرية لرفع كفاءة الإنتاج وحماية التربة من التدهور.',
    steps: [
      {
        stepNumber: 1,
        headingEn: 'Rigorous Verification',
        headingFr: 'Vérification Scientifique',
        headingAr: 'التدقيق العلمي',
        bodyEn: 'Every calculation is cross-checked against unit dimensional analysis and realistic biological agronomic thresholds.',
        bodyFr: 'Chaque calcul est vérifié selon l’analyse dimensionnelle et les seuils biologiques réels.',
        bodyAr: 'كل عملية حسابية يتم تدقيقها بناءً على تناسق الوحدات والحدود الحيوية الحقيقية لنمو النبات.',
      },
    ],
    algerianContextEn: 'Calibrated with real local coefficients for Algerian wilayas, soil types, and climate conditions.',
    algerianContextFr: 'Calibré avec les coefficients locaux des wilayas et des types de sols algériens.',
    algerianContextAr: 'معاير بالمعاملات المحلية لولايات الجزائر وظروفها المناخية.',
    practicalTips: [
      {
        tipEn: 'Always ensure your soil test and field area inputs are accurate before applying calculated field treatments.',
        tipFr: 'Assurez-vous de l’exactitude des analyses de sol et des surfaces avant d’appliquer les doses calculées.',
        tipAr: 'تأكد دائماً من دقة تحاليل التربة والمساحات المدخلة قبل تطبيق التوصيات في الحقل.',
      },
    ],
  },
};
