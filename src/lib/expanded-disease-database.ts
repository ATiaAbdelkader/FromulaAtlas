/**
 * Expanded Crop Disease Database — Formula Atlas
 * =====================================================================
 * Comprehensive, trilingual (EN / FR / AR) disease knowledge base
 * integrating 23 disease classes across 4 crops:
 *
 *   - Cashew  (5 classes — CCMT / Mendeley)
 *   - Cassava (5 classes — CCMT / Mendeley)
 *   - Maize   (7 classes — 6 CCMT + 1 Makerere MLN)
 *   - Tomato  (6 classes — CCMT)
 *
 * Dataset provenance:
 *   - CCMT (Crop Condition Monitoring Toolkit) — Mendeley Data,
 *     "Crop Disease Detection Dataset" — 22 classes / ~25,000 images
 *     covering Cassava, Cashew, Maize, Tomato.
 *   - Makerere University Maize Disease Dataset — Field images of
 *     Maize Leaf Blight, Maize Streak Virus and Maize Lethal Necrosis
 *     collected in Uganda (2019–2020).
 *
 * Each entry contains:
 *   - id                      Stable slug (e.g. "cashew-anthracnose")
 *   - crop                    Crop key matching CROP_LABELS in crop-localization.ts
 *   - diseaseName             Trilingual name {en, fr, ar}
 *   - pathogen                Scientific name + pathogen type
 *   - symptoms                Trilingual symptom description
 *   - treatment               IPM-based, trilingual — mentions INPV-approved
 *                             active substances where relevant for Algeria
 *   - prevention              Trilingual list of preventive measures
 *   - severity                low | moderate | high | critical
 *   - imageCategory           Coarse visual class used by the gallery UI
 *   - sourceDataset           CCMT | Makerere
 *   - sourceUrl               Link to original dataset
 *   - imageUrl                Placeholder for future dataset image hosting
 *   - inpvActives             Matching INPV-registered active substances
 *                             (cross-referenced with algeria-phyto-data.ts)
 *
 * Consumed by:
 *   - DiseaseReferenceGallery.tsx  (via the DISEASE_REFS mirror in disease-ref-data.ts)
 *   - DiseaseForecastDashboard.tsx (predictive alerting)
 *   - /api/v1/diseases/route.ts    (REST endpoint)
 *
 * Sources:
 *   - CCMT dataset: https://data.mendeley.com/datasets/bwh3zbpkpv
 *   - Makerere Maize: https://github.com/makerere-ai-lab/maskrcnn-benchmark
 */

import type { Language } from './language-store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExpandedSeverity = 'low' | 'moderate' | 'high' | 'critical';

export type PathogenType =
  | 'fungal'
  | 'bacterial'
  | 'viral'
  | 'pest'
  | 'algal'
  | 'healthy';

export type ExpandedCrop = 'cashew' | 'cassava' | 'maize' | 'tomato';

export type DatasetSource = 'CCMT' | 'Makerere';

export interface TrilingualText {
  en: string;
  fr: string;
  ar: string;
}

export interface ExpandedDisease {
  /** Stable slug, e.g. "cashew-anthracnose". */
  id: string;
  /** Crop key — must match CROP_LABELS in src/lib/crop-localization.ts. */
  crop: ExpandedCrop;
  /** Trilingual disease display name. */
  diseaseName: TrilingualText;
  /** Pathogen scientific name + pathogen type. */
  pathogen: {
    scientificName: string;
    type: PathogenType;
  };
  /** Trilingual symptom description (what the farmer sees). */
  symptoms: TrilingualText;
  /** IPM-based treatment recommendation (trilingual). */
  treatment: TrilingualText;
  /** Trilingual prevention measures (one string per measure). */
  prevention: TrilingualText[];
  /** Severity / risk band. */
  severity: ExpandedSeverity;
  /** Coarse visual class used by the gallery UI for icon/colour selection. */
  imageCategory:
    | 'leaf-spot'
    | 'leaf-blight'
    | 'mosaic-virus'
    | 'curl-virus'
    | 'insect-pest'
    | 'mite-pest'
    | 'canker'
    | 'algal'
    | 'healthy'
    | 'necrosis';
  /** Dataset the class was originally derived from. */
  sourceDataset: DatasetSource;
  /** Direct URL to the original dataset. */
  sourceUrl: string;
  /** Placeholder for future dataset image hosting (CCMT/Makerere sample). */
  imageUrl: string;
  /** Matching INPV-registered active substances (Algeria phyto 2017). */
  inpvActives?: string[];
}

// ---------------------------------------------------------------------------
// Dataset URLs
// ---------------------------------------------------------------------------

const CCMT_URL = 'https://data.mendeley.com/datasets/bwh3zbpkpv';
const MAKERERE_URL = 'https://github.com/makerere-ai-lab/maskrcnn-benchmark';

// ---------------------------------------------------------------------------
// The 23 expanded disease entries
// ---------------------------------------------------------------------------
// Ordering follows the CCMT class list:
//   Cashew  (1–5), Cassava (6–10), Maize (11–16, 23), Tomato (17–22).
// ---------------------------------------------------------------------------

export const EXPANDED_DISEASES: ExpandedDisease[] = [
  // ========================================================================
  // CASHEW — 5 classes (CCMT)
  // ========================================================================
  {
    id: 'cashew-anthracnose',
    crop: 'cashew',
    diseaseName: {
      en: 'Anthracnose',
      fr: 'Anthracnose',
      ar: 'الأنثراكنوز',
    },
    pathogen: {
      scientificName: 'Colletotrichum gloeosporioides',
      type: 'fungal',
    },
    symptoms: {
      en: 'Dark sunken lesions on leaves, panicles and fruits with characteristic salmon-pink spore masses under humid conditions; leaf necrosis and fruit drop.',
      fr: 'Lésions enfoncées sombres sur les feuilles, les panicules et les fruits avec des masses de spores salmonelloses roses en conditions humides ; nécrose foliaire et chute des fruits.',
      ar: 'بقع غائرة داكنة على الأوراق والنورات والثمار مع كتل بوغية وردية مائلة للسلمون في الظروف الرطبة؛ نخر ورقي وتساقط الثمار.',
    },
    treatment: {
      en: 'IPM: prune infected twigs and burn them, then apply a copper-based fungicide (copper oxychloride) or mancozeb at flowering and fruit set. INPV-approved: cuivre (oxychlorure), mancozèbe.',
      fr: 'PI : tailler et brûler les rameaux infectés, puis appliquer un fongicide à base de cuivre (oxychlorure de cuivre) ou mancozèbe à la floraison et au nouaison. Homologué INPV : cuivre (oxychlorure), mancozèbe.',
      ar: 'المكافحة المتكاملة: قم بتقليم الأغصان المصابة وحرقها، ثم رش مبيد فطري نحاسي (أوكلوريد النحاس) أو مانكوزيب عند الإزهار وعقد الثمار. المعتمد لدى المعهد الوطني لوقاية النباتات: النحاس (أوكلوريد)، مانكوزيب.',
    },
    prevention: [
      {
        en: 'Prune for airflow and remove fallen leaves and mummified fruits.',
        fr: 'Tailler pour aérer et éliminer les feuilles tombées et les fruits momifiés.',
        ar: 'قم بالتقليم لتحسين التهوية وأزل الأوراق المتساقطة والثمار المحنطة.',
      },
      {
        en: 'Avoid overhead irrigation; use drip irrigation to keep foliage dry.',
        fr: 'Éviter l\'irrigation par aspersion ; privilégier le goutte-à-goutte pour garder le feuillage sec.',
        ar: 'تجنب الري بالرش؛ استخدم الري بالتنقيط لإبقاء الأوراق جافة.',
      },
      {
        en: 'Plant resistant cashew varieties and maintain balanced nutrition.',
        fr: 'Planter des variétés résistantes et maintenir une nutrition équilibrée.',
        ar: 'ازرع أصناف الكاجو المقاومة وحافظ على تغذية متوازنة.',
      },
    ],
    severity: 'high',
    imageCategory: 'leaf-spot',
    sourceDataset: 'CCMT',
    sourceUrl: CCMT_URL,
    imageUrl: '/images/diseases/ccmt/cashew-anthracnose.jpg',
    inpvActives: ['cuivre (oxychlorure)', 'mancozèbe', 'azoxystrobine'],
  },
  {
    id: 'cashew-gummosis',
    crop: 'cashew',
    diseaseName: {
      en: 'Gummosis',
      fr: 'Gommose',
      ar: 'إفراز الصمغ (الجوموز)',
    },
    pathogen: {
      scientificName: 'Lasiodiplodia theobromae',
      type: 'fungal',
    },
    symptoms: {
      en: 'Exudation of gum from the bark, sunken cankers on trunk and branches, dieback of twigs and yellowing of the canopy.',
      fr: 'Exsudation de gomme à partir de l\'écorce, chancrens enfoncés sur le tronc et les branches, dépérissement des rameaux et jaunissement de la canopée.',
      ar: 'إفراز صمغ من القشرة، تقرحات غائرة على الجذع والأغصان، موت الأطراف واصفرار المجموع الخضري.',
    },
    treatment: {
      en: 'IPM: scrape the canker to healthy wood, apply a copper paste or thiophanate-methyl paste, and protect wounds with a Bordeaux mixture dressing. INPV-approved: cuivre (bouillie bordelaise), thiophanate-méthyl.',
      fr: 'PI : gratter le chancre jusqu\'au bois sain, appliquer une pâte cuprique ou de thiophanate-méthyl, et protéger les plaies avec de la bouillie bordelaise. Homologué INPV : cuivre (bouillie bordelaise), thiophanate-méthyl.',
      ar: 'المكافحة المتكاملة: اكشط التقرح حتى الخشب السليم، ثم ضع عجينة نحاسية أو عجينة ثيوفانات-ميثيل، وغطّ الجروح بمزيج بوردو. المعتمد لدى المعهد الوطني لوقاية النباتات: النحاس (مزيج بوردو)، ثيوفانات-ميثيل.',
    },
    prevention: [
      {
        en: 'Avoid mechanical injuries to the trunk during weeding and harvesting.',
        fr: 'Éviter les blessures mécaniques du tronc lors du désherbage et de la récolte.',
        ar: 'تجنب إصابة الجذع ميكانيكياً أثناء مكافحة الأعشاب والحصاد.',
      },
      {
        en: 'Maintain tree vigour with balanced fertilisation and irrigation.',
        fr: 'Maintenir la vigueur de l\'arbre par une fertilisation et une irrigation équilibrées.',
        ar: 'حافظ على حيوية الشجرة من خلال التسميد والري المتوازن.',
      },
      {
        en: 'Use healthy, certified planting material and protect graft unions.',
        fr: 'Utiliser du matériel végétal sain et certifié et protéger les points de greffe.',
        ar: 'استخدم مواد إكثار سليمة ومعتمدة واحمِ مواقع التطعيم.',
      },
    ],
    severity: 'high',
    imageCategory: 'canker',
    sourceDataset: 'CCMT',
    sourceUrl: CCMT_URL,
    imageUrl: '/images/diseases/ccmt/cashew-gummosis.jpg',
    inpvActives: ['cuivre (bouillie bordelaise)', 'thiophanate-méthyl'],
  },
  {
    id: 'cashew-healthy',
    crop: 'cashew',
    diseaseName: {
      en: 'Cashew — Healthy',
      fr: 'Anacardier — Sain',
      ar: 'الكاجو — سليم',
    },
    pathogen: {
      scientificName: '—',
      type: 'healthy',
    },
    symptoms: {
      en: 'No symptoms. Leaves are uniformly green, canopy dense, no lesions, gummosis or pest feeding signs.',
      fr: 'Aucun symptôme. Feuilles uniformément vertes, canopée dense, sans lésions, gommose ni traces d\'insectes.',
      ar: 'لا توجد أعراض. الأوراق خضراء منتظمة، المجموع الخضري كثيف، لا توجد بقع أو إفرازات صمغية أو آثار تغذية آفات.',
    },
    treatment: {
      en: 'No treatment needed. Continue routine scouting and IPM monitoring.',
      fr: 'Aucun traitement nécessaire. Continuer la surveillance de routine et le suivi PI.',
      ar: 'لا حاجة للعلاج. واصل الكشف الدوري والمتابعة ضمن المكافحة المتكاملة.',
    },
    prevention: [
      {
        en: 'Maintain balanced N-P-K + micronutrient (Zn, B) nutrition.',
        fr: 'Maintenir une nutrition N-P-K équilibrée + oligo-éléments (Zn, B).',
        ar: 'حافظ على تغذية متوازنة من N-P-K والعناصر الصغرى (الزنك، البورون).',
      },
      {
        en: 'Schedule irrigation to avoid water stress during flowering and fruit set.',
        fr: 'Programmer l\'irrigation pour éviter le stress hydrique à la floraison et au nouaison.',
        ar: 'نظم الري لتجنب الإجهاد المائي أثناء الإزهار وعقد الثمار.',
      },
    ],
    severity: 'low',
    imageCategory: 'healthy',
    sourceDataset: 'CCMT',
    sourceUrl: CCMT_URL,
    imageUrl: '/images/diseases/ccmt/cashew-healthy.jpg',
  },
  {
    id: 'cashew-leaf-miner',
    crop: 'cashew',
    diseaseName: {
      en: 'Leaf Miner',
      fr: 'Mineuse des feuilles',
      ar: 'ناخرة الأوراق',
    },
    pathogen: {
      scientificName: 'Ectomyelois spp.',
      type: 'pest',
    },
    symptoms: {
      en: 'Serpentine, translucent mines visible on the leaf blade; larvae feed between the epidermal layers causing blotches, premature leaf drop and reduced photosynthesis.',
      fr: 'Mines sereineuses translucides visibles sur le limbe ; les larves se nourrissent entre les couches épidermiques provoquant des taches, une chute prématurée des feuilles et une baisse de photosynthèse.',
      ar: 'أنفاق متعرجة شبه شفافة مرئية على نصل الورقة؛ تتغذى اليرقات بين طبقتي البشرة مسببة بقعاً وتساقطاً مبكراً للأوراق وانخفاضاً في التمثيل الضوئي.',
    },
    treatment: {
      en: 'IPM: monitor with yellow sticky traps, conserve parasitoids (Braconidae); apply azadirachtin (neem) or a spinosad-based product at first sign of new mines. INPV-approved: azadirachtine, spinosad.',
      fr: 'PI : surveiller avec des pièges jaunes englués, conserver les parasitoïdes (Braconidae) ; appliquer de l\'azadirachtine (neem) ou un produit à base de spinosad dès les premières mines. Homologué INPV : azadirachtine, spinosad.',
      ar: 'المكافحة المتكاملة: راقب باستخدام مصائد صفراء لاصقة، وحافظ على المتطفلات (Braconidae)؛ رش الأزاديراختين (النيم) أو منتج سبينوساد عند أول ظهور للأنفاق. المعتمد لدى المعهد الوطني لوقاية النباتات: أزاديراختين، سبينوساد.',
    },
    prevention: [
      {
        en: 'Remove and destroy heavily mined leaves during the dry season.',
        fr: 'Éliminer et détruire les feuilles fortement minées pendant la saison sèche.',
        ar: 'أزل وأتلف الأوراق المصابة بشدة خلال الموسم الجاف.',
      },
      {
        en: 'Encourage natural enemies by avoiding broad-spectrum insecticides.',
        fr: 'Favoriser les ennemis naturels en évitant les insecticides à large spectre.',
        ar: 'شجع الأعداء الطبيعيين بتجنب المبيدات الحشرية واسعة الطيف.',
      },
      {
        en: 'Monitor new flush growth weekly during the rainy season.',
        fr: 'Surveiller les nouvelles pousses chaque semaine pendant la saison des pluies.',
        ar: 'راقب النمو الجديد أسبوعياً خلال موسم الأمطار.',
      },
    ],
    severity: 'moderate',
    imageCategory: 'insect-pest',
    sourceDataset: 'CCMT',
    sourceUrl: CCMT_URL,
    imageUrl: '/images/diseases/ccmt/cashew-leaf-miner.jpg',
    inpvActives: ['azadirachtine', 'spinosad', 'Bacillus thuringiensis'],
  },
  {
    id: 'cashew-red-rust',
    crop: 'cashew',
    diseaseName: {
      en: 'Red Rust',
      fr: 'Rouille rouge',
      ar: 'الصدأ الأحمر',
    },
    pathogen: {
      scientificName: 'Cephaleuros virescens',
      type: 'algal',
    },
    symptoms: {
      en: 'Orange to rust-red velvet-like patches on the upper leaf surface and young twigs; in severe cases leaves yellow and drop, reducing canopy vigour.',
      fr: 'Taches veloutées orange à rouge rouille sur la face supérieure des feuilles et les jeunes rameaux ; dans les cas graves, les feuilles jaunissent et tombent, réduisant la vigueur de la canopée.',
      ar: 'بقع مخملية برتقالية إلى حمراء صدئة على السطح العلوي للأوراق والأغصان الصغيرة؛ في الحالات الشديدة تصفر الأوراق وتتساقط مما يضعف المجموع الخضري.',
    },
    treatment: {
      en: 'IPM: improve light penetration by pruning, then apply a copper-based fungicide (Bordeaux mixture or copper oxychloride) at the start of the rainy season. INPV-approved: cuivre (bouillie bordelaise, oxychlorure).',
      fr: 'PI : améliorer la pénétration de la lumière par la taille, puis appliquer un fongicide cuprique (bouillie bordelaise ou oxychlorure de cuivre) au début de la saison des pluies. Homologué INPV : cuivre (bouillie bordelaise, oxychlorure).',
      ar: 'المكافحة المتكاملة: حسّل نفاذ الضوء بالتقليم، ثم رش مبيد فطري نحاسي (مزيج بوردو أو أوكلوريد النحاس) في بداية موسم الأمطار. المعتمد لدى المعهد الوطني لوقاية النباتات: النحاس (مزيج بوردو، أوكلوريد).',
    },
    prevention: [
      {
        en: 'Avoid excessive shade and dense canopies — prune to improve aeration.',
        fr: 'Éviter l\'ombrage excessif et les canopées denses — tailler pour améliorer l\'aération.',
        ar: 'تجنب الظلال المفرطة وتزاحم المجموع الخضري — قم بالتقليم لتحسين التهوية.',
      },
      {
        en: 'Manage orchard humidity with adequate spacing between trees.',
        fr: 'Gérer l\'humidité du verger avec un espacement adéquat entre les arbres.',
        ar: 'تحكم برطوبة البستان بمسافات كافية بين الأشجار.',
      },
      {
        en: 'Remove and destroy heavily infected leaves to reduce inoculum.',
        fr: 'Éliminer et détruire les feuilles fortement infectées pour réduire l\'inoculum.',
        ar: 'أزل وأتلف الأوراق المصابة بشدة لتقليل مصدر العدوى.',
      },
    ],
    severity: 'moderate',
    imageCategory: 'algal',
    sourceDataset: 'CCMT',
    sourceUrl: CCMT_URL,
    imageUrl: '/images/diseases/ccmt/cashew-red-rust.jpg',
    inpvActives: ['cuivre (bouillie bordelaise)', 'cuivre (oxychlorure)'],
  },

  // ========================================================================
  // CASSAVA — 5 classes (CCMT)
  // ========================================================================
  {
    id: 'cassava-bacterial-blight',
    crop: 'cassava',
    diseaseName: {
      en: 'Bacterial Blight',
      fr: 'Bactériose vasculaire (Feu bactérien)',
      ar: 'اللفحة البكتيرية للكسافا',
    },
    pathogen: {
      scientificName: 'Xanthomonas axonopodis pv. manihotis',
      type: 'bacterial',
    },
    symptoms: {
      en: 'Angular water-soaked leaf spots that turn brown with yellow halos, blighting, leaf wilting, vascular exudate (gum) from cut stems, and defoliation in severe cases.',
      fr: 'Taches foliaires angulaires translucides devenant brunes avec des halos jaunes, brûlure, flétrissement des feuilles, exsudat vasculaire (gomme) des tiges coupées et défoliation dans les cas graves.',
      ar: 'بقع ورقية زاويّة مبللة تتحول إلى بنية مع هالات صفراء، لفحة، ذبول الأوراق، إفراز وعائي (صمغ) من السيقان المقطوعة، وتساقط الأوراق في الحالات الشديدة.',
    },
    treatment: {
      en: 'IPM: rogue infected plants immediately, apply copper-based bactericides (copper hydroxide) and disinfect tools with 10% bleach between plants. INPV-approved: hydroxyde de cuivre, cuivre (oxychlorure).',
      fr: 'PI : arracher immédiatement les plants infectés, appliquer des bactéricides cupriques (hydroxyde de cuivre) et désinfecter les outils avec de l\'eau de javel à 10 % entre les plants. Homologué INPV : hydroxyde de cuivre, cuivre (oxychlorure).',
      ar: 'المكافحة المتكاملة: اقتلع النباتات المصابة فوراً، رش مبيدات بكتيرية نحاسية (هيدروكسيد النحاس)، وعقّم الأدوات بمحلول كلور 10% بين النباتات. المعتمد لدى المعهد الوطني لوقاية النباتات: هيدروكسيد النحاس، النحاس (أوكلوريد).',
    },
    prevention: [
      {
        en: 'Use disease-free certified stem cuttings from tolerant varieties.',
        fr: 'Utiliser des boutures de tige saines certifiées issues de variétés tolérantes.',
        ar: 'استخدم عقل ساقية سليمة معتمدة من أصناف متحمّلة.',
      },
      {
        en: 'Crop rotation with non-hosts (maize, legumes) for 2 seasons.',
        fr: 'Rotation culturale avec des non-hôtes (maïs, légumineuses) pendant 2 saisons.',
        ar: 'دورة زراعية مع محاصيل غير عائلة (الذرة، البقوليات) لموسمين.',
      },
      {
        en: 'Avoid working in the field when foliage is wet to limit bacteria spread.',
        fr: 'Éviter de travailler dans le champ lorsque le feuillage est mouillé pour limiter la propagation bactérienne.',
        ar: 'تجنب العمل في الحقل عندما تكون الأوراق مبللة للحد من انتشار البكتيريا.',
      },
    ],
    severity: 'critical',
    imageCategory: 'leaf-blight',
    sourceDataset: 'CCMT',
    sourceUrl: CCMT_URL,
    imageUrl: '/images/diseases/ccmt/cassava-bacterial-blight.jpg',
    inpvActives: ['hydroxyde de cuivre', 'cuivre (oxychlorure)'],
  },
  {
    id: 'cassava-brown-spot',
    crop: 'cassava',
    diseaseName: {
      en: 'Brown Spot',
      fr: 'Tache brune',
      ar: 'البقعة البنية',
    },
    pathogen: {
      scientificName: 'Cercospora henningsii',
      type: 'fungal',
    },
    symptoms: {
      en: 'Brown circular spots with distinct yellow halos on the upper leaf surface; spots coalesce causing premature defoliation and yield loss under high humidity.',
      fr: 'Taches brunes circulaires avec des halos jaunes distincts sur la face supérieure des feuilles ; les taches coalescent provoquant une défoliation prématurée et des pertes de rendement en forte humidité.',
      ar: 'بقع بنية دائرية مع هالات صفراء واضحة على السطح العلوي للأوراق؛ تندمج البقع مسببة تساقطاً مبكراً للأوراق وفقداناً في المحصول في ظروف الرطوبة العالية.',
    },
    treatment: {
      en: 'IPM: remove and burn infected leaves; if defoliation exceeds 25%, apply mancozeb or azoxystrobin (strobilurin). INPV-approved: mancozèbe, azoxystrobine.',
      fr: 'PI : éliminer et brûler les feuilles infectées ; si la défoliation dépasse 25 %, appliquer du mancozèbe ou de l\'azoxystrobine (strobilurine). Homologué INPV : mancozèbe, azoxystrobine.',
      ar: 'المكافحة المتكاملة: أزل واحرق الأوراق المصابة؛ إذا تجاوز تساقط الأوراق 25%، رش مانكوزيب أو أزوكسيستروبين (ستروبيلورين). المعتمد لدى المعهد الوطني لوقاية النباتات: مانكوزيب، أزوكسيستروبين.',
    },
    prevention: [
      {
        en: 'Plant certified disease-free cuttings and resistant varieties.',
        fr: 'Planter des boutures certifiées saines et des variétés résistantes.',
        ar: 'ازرع عقاً معتمدة سليمة وأصنافاً مقاومة.',
      },
      {
        en: 'Maintain adequate spacing (1 × 1 m) for canopy aeration.',
        fr: 'Maintenir un espacement adéquat (1 × 1 m) pour l\'aération de la canopée.',
        ar: 'حافظ على مسافات كافية (1 × 1 م) لتهوية المجموع الخضري.',
      },
      {
        en: 'Avoid excess nitrogen which favours susceptible soft tissue.',
        fr: 'Éviter l\'excès d\'azote qui favorise les tissus tendres sensibles.',
        ar: 'تجنب الإفراط في النيتروجين الذي يُسهّل نمو الأنسجة الرخوة القابلة للإصابة.',
      },
    ],
    severity: 'moderate',
    imageCategory: 'leaf-spot',
    sourceDataset: 'CCMT',
    sourceUrl: CCMT_URL,
    imageUrl: '/images/diseases/ccmt/cassava-brown-spot.jpg',
    inpvActives: ['mancozèbe', 'azoxystrobine', 'cuivre (oxychlorure)'],
  },
  {
    id: 'cassava-green-mite',
    crop: 'cassava',
    diseaseName: {
      en: 'Green Mite',
      fr: 'Tetranyque vert',
      ar: 'العنكبوت الأخضر',
    },
    pathogen: {
      scientificName: 'Mononychellus tanajoa',
      type: 'pest',
    },
    symptoms: {
      en: 'Mite feeding causes leaf mottling, chlorosis, stunting and characteristic "pale" shoots; heavily infested plants show a sticky honeydew layer and deformed leaves, with yield losses up to 80% in susceptible varieties.',
      fr: 'L\'alimentation des acariens provoque une moucheture, une chlorose, un rabougrissement et des pousses « pâles » caractéristiques ; les plants fortement infestés présentent une couche de miellat collant et des feuilles déformées, avec des pertes de rendement allant jusqu\'à 80 % chez les variétés sensibles.',
      ar: 'تتسبب تغذية العنكبوت في تنقيط الأوراق، اصفرارها، تقزم النبات، وظهور نموات «شاحبة» مميزة؛ تظهر النباتات المصابة بشدة طبقة من الندوة العسلية اللاصقة وأوراق مشوّهة، مع خسائر في المحصول تصل إلى 80% في الأصناف الحساسة.',
    },
    treatment: {
      en: 'IPM: classical biological control with the predatory mite Typhlodromalus aripo (introduced by IITA); apply sulphur or abamectin only when infestation exceeds the action threshold. INPV-approved: soufre, abamectine.',
      fr: 'PI : lutte biologique classique avec l\'acarien prédateur Typhlodromalus aripo (introduit par l\'IITA) ; appliquer du soufre ou de l\'abamectine uniquement lorsque l\'infestation dépasse le seuil d\'intervention. Homologué INPV : soufre, abamectine.',
      ar: 'المكافحة المتكاملة: مكافحة حيوية كلاسيكية بالعنكبوت المفترس Typhlodromalus aripo (مقدَّم من IITA)؛ رش الكبريت أو الأبامكتين فقط عند تجاوز الإصابة للحد الحرج. المعتمد لدى المعهد الوطني لوقاية النباتات: الكبريت، الأبامكتين.',
    },
    prevention: [
      {
        en: 'Conserve predatory mites and lacewings by avoiding pyrethroid misuse.',
        fr: 'Conserver les acariens prédateurs et les chrysopes en évitant l\'usage abusif des pyréthrinoïdes.',
        ar: 'حافظ على العناكب المفترسة وأسد المنزل بتجنب الاستخدام الخاطئ للبيريثرويدات.',
      },
      {
        en: 'Plant mite-tolerant varieties (TMS 30572, TME 419).',
        fr: 'Planter des variétés tolérantes aux acariens (TMS 30572, TME 419).',
        ar: 'ازرع أصنافاً متحمّلة للعنكبوت (TMS 30572، TME 419).',
      },
      {
        en: 'Rogue and burn heavily infested shoots during the dry season.',
        fr: 'Arracher et brûler les pousses fortement infestées pendant la saison sèche.',
        ar: 'اقتلع واحرق النموات المصابة بشدة خلال الموسم الجاف.',
      },
    ],
    severity: 'high',
    imageCategory: 'mite-pest',
    sourceDataset: 'CCMT',
    sourceUrl: CCMT_URL,
    imageUrl: '/images/diseases/ccmt/cassava-green-mite.jpg',
    inpvActives: ['soufre', 'abamectine'],
  },
  {
    id: 'cassava-healthy',
    crop: 'cassava',
    diseaseName: {
      en: 'Cassava — Healthy',
      fr: 'Manioc — Sain',
      ar: 'الكاسافا — سليم',
    },
    pathogen: {
      scientificName: '—',
      type: 'healthy',
    },
    symptoms: {
      en: 'No symptoms detected. Leaves are uniformly green with no mosaic, mottling, spots, mite damage, or wilting; storage roots develop normally.',
      fr: 'Aucun symptôme. Feuilles uniformément vertes sans mosaïque, moucheture, taches, dégâts d\'acariens ni flétrissement ; les racines tubéreuses se développent normalement.',
      ar: 'لا توجد أعراض. الأوراق خضراء منتظمة دون فسيفساء أو تنقيط أو بقع أو أضرار عناكب أو ذبول؛ تتطور الجذور الدرنية بشكل طبيعي.',
    },
    treatment: {
      en: 'No treatment needed. Continue routine scouting every 2 weeks.',
      fr: 'Aucun traitement nécessaire. Continuer la surveillance de routine toutes les 2 semaines.',
      ar: 'لا حاجة للعلاج. واصل الكشف الدوري كل أسبوعين.',
    },
    prevention: [
      {
        en: 'Maintain soil pH 5.5–6.5 and use balanced K nutrition for tuber bulking.',
        fr: 'Maintenir le pH du sol à 5,5–6,5 et une nutrition potassique équilibrée pour le grossissement des tubercules.',
        ar: 'حافظ على حموضة التربة بين 5.5–6.5 واستخدم تغذية متوازنة بالبوتاسيوم لتضخيم الدرنات.',
      },
      {
        en: 'Weed regularly during the first 3 months to reduce competition.',
        fr: 'Désherber régulièrement pendant les 3 premiers mois pour réduire la concurrence.',
        ar: 'نظّم مكافحة الأعشاب خلال الأشهر الثلاثة الأولى للحد من المنافسة.',
      },
    ],
    severity: 'low',
    imageCategory: 'healthy',
    sourceDataset: 'CCMT',
    sourceUrl: CCMT_URL,
    imageUrl: '/images/diseases/ccmt/cassava-healthy.jpg',
  },
  {
    id: 'cassava-mosaic',
    crop: 'cassava',
    diseaseName: {
      en: 'Cassava Mosaic Disease',
      fr: 'Mosaïque du manioc',
      ar: 'فسيفساء الكاسافا',
    },
    pathogen: {
      scientificName: 'African Cassava Mosaic Virus (ACMV, EACMV)',
      type: 'viral',
    },
    symptoms: {
      en: 'Yellow-green mosaic pattern on leaves, leaf distortion, reduced leaf size, stunted plants and swollen, misshapen storage roots. Transmitted by the whitefly Bemisia tabaci and through infected cuttings.',
      fr: 'Motif de mosaïque jaune-vert sur les feuilles, distorsion foliaire, réduction de la taille des feuilles, plants rabougris et racines tubéreuses gonflées et déformées. Transmis par l\'aleurode Bemisia tabaci et par les boutures infectées.',
      ar: 'نمط فسيفسائي أصفر-أخضر على الأوراق، تشوّه الأوراق، صغر حجمها، تقزّم النباتات، وجذور درنية منتفخة ومشوّهة. ينتقل عبر الذبابة البيضاء Bemisia tabaci ومن خلال العقل المصابة.',
    },
    treatment: {
      en: 'IPM: no cure for infected plants — rogue and burn immediately. Vector control with insecticidal soaps or imidacloprid on whitefly hotspots. INPV-approved: imidaclopride, savon insecticide.',
      fr: 'PI : aucune guérison pour les plants infectés — arracher et brûler immédiatement. Lutte vectorielle avec des savons insecticides ou de l\'imidaclopride sur les foyers d\'aleurodes. Homologué INPV : imidaclopride, savon insecticide.',
      ar: 'المكافحة المتكاملة: لا يوجد علاج للنباتات المصابة — اقتلع واحرق فوراً. مكافحة الناقل بالصابون المبيد الحشري أو الإيميداكلوبريد في بؤر الذبابة البيضاء. المعتمد لدى المعهد الوطني لوقاية النباتات: إيميداكلوبريد، صابون مبيد حشري.',
    },
    prevention: [
      {
        en: 'Use virus-free certified cuttings and ACMV-resistant varieties (TME 419, TMS 30572).',
        fr: 'Utiliser des boutures certifiées sans virus et des variétés résistantes à l\'ACMV (TME 419, TMS 30572).',
        ar: 'استخدم عقاً معتمدة خالية من الفيروس وأصنافاً مقاومة لـ ACMV (TME 419، TMS 30572).',
      },
      {
        en: 'Control whitefly vectors early in the cropping cycle.',
        fr: 'Lutter précocement contre les aleurodes vecteurs dès le début du cycle cultural.',
        ar: 'كافح الذبابة البيضاء الناقلة مبكراً في دورة الزراعة.',
      },
      {
        en: 'Maintain a 100 m isolation distance from infected fields.',
        fr: 'Maintenir une distance d\'isolement de 100 m des champs infectés.',
        ar: 'حافظ على مسافة عزل 100 م عن الحقول المصابة.',
      },
    ],
    severity: 'critical',
    imageCategory: 'mosaic-virus',
    sourceDataset: 'CCMT',
    sourceUrl: CCMT_URL,
    imageUrl: '/images/diseases/ccmt/cassava-mosaic.jpg',
    inpvActives: ['imidaclopride', 'thiaméthoxame'],
  },

  // ========================================================================
  // MAIZE — 6 CCMT classes + 1 Makerere MLN
  // ========================================================================
  {
    id: 'maize-fall-armyworm',
    crop: 'maize',
    diseaseName: {
      en: 'Fall Armyworm',
      fr: 'Légionnaire d\'automne',
      ar: 'دودة الجيش الخريفية',
    },
    pathogen: {
      scientificName: 'Spodoptera frugiperda',
      type: 'pest',
    },
    symptoms: {
      en: 'Ragged feeding holes on leaves and whorls with characteristic green sawdust-like frass; larvae feed inside the whorl causing "window pane" damage and may destroy the growing point of young plants.',
      fr: 'Trous d\'alimentation déchiquetés sur les feuilles et les cornets avec excréments verts caractéristiques en sciure ; les chenilles se nourrissent à l\'intérieur du cornet causant des dégâts en « vitre » et peuvent détruire le point de croissance des jeunes plants.',
      ar: 'ثقوب تغذية ممزقة على الأوراق والكوز مع براز أخضر مميز يشبه نشارة الخشب؛ تتغذى اليرقات داخل الكوز مسببة أضراراً تشبه «الزجاج» وقد تدمر نقطة نمو النباتات الصغيرة.',
    },
    treatment: {
      en: 'IPM: scout weekly from emergence; apply Bacillus thuringiensis (Bt) or emamectin benzoate at early instars; deep-plough after harvest to expose pupae. INPV-approved: Bacillus thuringiensis, emamectine benzoate, spinosad.',
      fr: 'PI : surveiller chaque semaine dès la levée ; appliquer Bacillus thuringiensis (Bt) ou emamectine benzoate aux premiers stades larvaires ; labour profond après récolte pour exposer les nymphes. Homologué INPV : Bacillus thuringiensis, emamectine benzoate, spinosad.',
      ar: 'المكافحة المتكاملة: راقب أسبوعياً منذ الإنبات؛ رش Bacillus thuringiensis (Bt) أو إيمامكتين بنزوات في الأطوار اليرقية المبكرة؛ حرث عميق بعد الحصاد لكشف العذارى. المعتمد لدى المعهد الوطني لوقاية النباتات: Bacillus thuringiensis، إيمامكتين بنزوات، سبينوساد.',
    },
    prevention: [
      {
        en: 'Plant early to avoid peak moth flights and use push-pull strategies with Desmodium.',
        fr: 'Planter tôt pour éviter les pics de vols de papillons et utiliser la stratégie « push-pull » avec Desmodium.',
        ar: 'ازرع مبكراً لتجنب ذروة طيران الفراشات واستخدم استراتيجية «الدفع والجذب» مع الدزموديوم.',
      },
      {
        en: 'Intercrop with repellent plants (silverleaf desmodium, molasses grass).',
        fr: 'Associer avec des plantes répulsives (desmodium, herbe à melasse).',
        ar: 'ازرع محاصيل طاردة بينية (الدزموديوم، حشيشة المولاس).',
      },
      {
        en: 'Conserve natural enemies (Cotesia, Telenomus) by avoiding broad-spectrum pyrethroids.',
        fr: 'Conserver les ennemis naturels (Cotesia, Telenomus) en évitant les pyréthrinoïdes à large spectre.',
        ar: 'حافظ على الأعداء الطبيعيين (Cotesia، Telenomus) بتجنب البيريثرويدات واسعة الطيف.',
      },
    ],
    severity: 'critical',
    imageCategory: 'insect-pest',
    sourceDataset: 'CCMT',
    sourceUrl: CCMT_URL,
    imageUrl: '/images/diseases/ccmt/maize-fall-armyworm.jpg',
    inpvActives: ['Bacillus thuringiensis', 'emamectine benzoate', 'spinosad', 'lambda-cyhalothrine'],
  },
  {
    id: 'maize-grasshopper',
    crop: 'maize',
    diseaseName: {
      en: 'Grasshopper Damage',
      fr: 'Dégâts de criquets',
      ar: 'أضرار الجراد',
    },
    pathogen: {
      scientificName: 'Zonocerus variegatus / Oedaleus senegalensis',
      type: 'pest',
    },
    symptoms: {
      en: 'Irregular large feeding holes on leaf blades, often starting from the leaf margins; severe defoliation during outbreaks can strip a field within hours, leaving only midribs.',
      fr: 'Trous d\'alimentation irréguliers et larges sur le limbe, débutant souvent en marge des feuilles ; une défoliation sévère pendant les invasions peut mettre à nu tout un champ en quelques heures, ne laissant que les nervures principales.',
      ar: 'ثقوب تغذية كبيرة غير منتظمة على نصل الورقة، تبدأ غالباً من حواف الأوراق؛ يمكن أن يؤدي تساقط الأوراق الشديد أثناء الأوبئة إلى تجريد الحقل خلال ساعات، تاركاً العروق الوسطية فقط.',
    },
    treatment: {
      en: 'IPM: monitor with sweep nets; apply an insect growth regulator (teflubenzuron) or a pyrethroid (lambda-cyhalothrin) when populations exceed 10 nymphs/m². INPV-approved: lambda-cyhalothrine, diflubenzuron.',
      fr: 'PI : surveiller au filet fauchoir ; appliquer un régulateur de croissance (téflubenzuron) ou un pyréthrinoïde (lambda-cyhalothrine) lorsque les populations dépassent 10 nymphes/m². Homologué INPV : lambda-cyhalothrine, diflubenzuron.',
      ar: 'المكافحة المتكاملة: راقب بالشبكة الكاسحة؛ رش منظم نمو الحشرات (تيفلوبنزورون) أو بيريثرويد (لامبدا-سيهالوثرين) عند تجاوز الكثافة 10 حوريات/م². المعتمد لدى المعهد الوطني لوقاية النباتات: لامبدا-سيهالوثرين، ديفلوبنزورون.',
    },
    prevention: [
      {
        en: 'Tillage to destroy egg pods in the soil along field margins.',
        fr: 'Travail du sol pour détruire les oothèques le long des bordures de champ.',
        ar: 'الحرث لتدمير كبسولات البيض في التربة على حواف الحقل.',
      },
      {
        en: 'Use biological control with Nosema locustae or Metarhizium acridum.',
        fr: 'Lutte biologique avec Nosema locustae ou Metarhizium acridum.',
        ar: 'المكافحة الحيوية باستخدام Nosema locustae أو Metarhizium acridum.',
      },
      {
        en: 'Early planting and synchronized sowing at the landscape scale.',
        fr: 'Plantation précoce et semis synchronisés à l\'échelle du paysage.',
        ar: 'الزراعة المبكرة والبذور المتزامنة على مستوى المشهد.',
      },
    ],
    severity: 'high',
    imageCategory: 'insect-pest',
    sourceDataset: 'CCMT',
    sourceUrl: CCMT_URL,
    imageUrl: '/images/diseases/ccmt/maize-grasshopper.jpg',
    inpvActives: ['lambda-cyhalothrine', 'diflubenzuron', 'fipronil'],
  },
  {
    id: 'maize-leaf-beetle',
    crop: 'maize',
    diseaseName: {
      en: 'Leaf Beetle Damage',
      fr: 'Dégâts de chrysomèles',
      ar: 'أضرار الخنافس الآكلة للأوراق',
    },
    pathogen: {
      scientificName: 'Chaetocnema spp. / Diphaulaca spp.',
      type: 'pest',
    },
    symptoms: {
      en: 'Elongated feeding strips or "shot-holes" between the leaf veins, often on younger leaves; heavy infestation causes a skeletonised appearance and slows crop establishment.',
      fr: 'Stries d\'alimentation allongées ou « trous de fusil » entre les nervures, souvent sur les jeunes feuilles ; une forte infestation donne un aspect squelettique et ralentit l\'installation de la culture.',
      ar: 'خطوط تغذية مستطيلة أو «ثقوب رصاص» بين عروق الأوراق، غالباً على الأوراق الصغيرة؛ الإصابة الشديدة تعطي مظهراً هيكلياً وتبطئ تأسيس المحصول.',
    },
    treatment: {
      en: 'IPM: apply seed treatment with imidacloprid or thiamethoxam; foliar spray with lambda-cyhalothrin if defoliation exceeds 30% on young plants. INPV-approved: imidaclopride, thiaméthoxame, lambda-cyhalothrine.',
      fr: 'PI : traitement de semence à l\'imidaclopride ou thiaméthoxame ; pulvérisation foliaire de lambda-cyhalothrine si la défoliation dépasse 30 % sur jeunes plants. Homologué INPV : imidaclopride, thiaméthoxame, lambda-cyhalothrine.',
      ar: 'المكافحة المتكاملة: عالج البذور بالإيميداكلوبريد أو الثياميثوكسام؛ رش ورقي باللامبدا-سيهالوثرين إذا تجاوز تساقط الأوراق 30% على النباتات الصغيرة. المعتمد لدى المعهد الوطني لوقاية النباتات: إيميداكلوبريد، ثياميثوكسام، لامبدا-سيهالوثرين.',
    },
    prevention: [
      {
        en: 'Practice crop rotation with non-grass hosts (soybean, groundnut).',
        fr: 'Pratiquer la rotation avec des hôtes non-graminées (soja, arachide).',
        ar: 'طبق الدورة الزراعية مع محاصيل غير العائلة النجيلية (فول الصويا، الفول السوداني).',
      },
      {
        en: 'Use neem-based seed treatment in organic systems.',
        fr: 'Utiliser un traitement de semence à base de neem en agriculture biologique.',
        ar: 'استخدم معالجة البذور بمستخلص النيم في الزراعة العضوية.',
      },
      {
        en: 'Weed field margins to remove alternate hosts of beetles.',
        fr: 'Désherber les bordures pour éliminer les hôtes alternatifs des chrysomèles.',
        ar: 'نظّف حواف الحقل من الأعشاب لإزالة العوائل البديلة للخنافس.',
      },
    ],
    severity: 'moderate',
    imageCategory: 'insect-pest',
    sourceDataset: 'CCMT',
    sourceUrl: CCMT_URL,
    imageUrl: '/images/diseases/ccmt/maize-leaf-beetle.jpg',
    inpvActives: ['imidaclopride', 'thiaméthoxame', 'lambda-cyhalothrine'],
  },
  {
    id: 'maize-leaf-blight',
    crop: 'maize',
    diseaseName: {
      en: 'Northern Leaf Blight',
      fr: 'Helminthosporiose du maïs (NLB)',
      ar: 'لفحة الأوراق الشمالية للذرة',
    },
    pathogen: {
      scientificName: 'Exserohilum turcicum',
      type: 'fungal',
    },
    symptoms: {
      en: 'Long cigar-shaped grey-green lesions (2.5–15 cm) on leaves that turn tan with age, distinct margins; severe infection causes leaf blighting from the lower canopy upward and significant yield loss.',
      fr: 'Lésions gris-vert en forme de cigare (2,5–15 cm) sur les feuilles devenant fauve avec l\'âge, marges distinctes ; l\'infection sévère provoque une brûlure foliaire du bas vers le haut de la canopée et des pertes de rendement importantes.',
      ar: 'بقع رمادية-خضراء طويلة تشبه السيجار (2.5–15 سم) على الأوراق تتحول إلى بنية فاتحة مع تقدم العمر، ذات حواف مميزة؛ الإصابة الشديدة تسبب لفحةً ورقية تصعد من المجموع الخضري السفلي إلى الأعلى وخسائر كبيرة في المحصول.',
    },
    treatment: {
      en: 'IPM: apply mancozeb or azoxystrobin at first lesion appearance and repeat every 7–10 days if conditions remain favourable. INPV-approved: mancozèbe, azoxystrobine, pyraclostrobine.',
      fr: 'PI : appliquer du mancozèbe ou de l\'azoxystrobine dès l\'apparition des premières lésions et répéter tous les 7–10 jours si les conditions restent favorables. Homologué INPV : mancozèbe, azoxystrobine, pyraclostrobine.',
      ar: 'المكافحة المتكاملة: رش مانكوزيب أو أزوكسيستروبين عند أول ظهور للبقع وكرّر كل 7–10 أيام إذا استمرت الظروف الملائمة. المعتمد لدى المعهد الوطني لوقاية النباتات: مانكوزيب، أزوكسيستروبين، بيراكلوستروبين.',
    },
    prevention: [
      {
        en: 'Plant resistant hybrids carrying Ht1/Ht2/Ht3 resistance genes.',
        fr: 'Planter des hybrides résistants portant les gènes Ht1/Ht2/Ht3.',
        ar: 'ازرع هجينة مقاومة تحمل جينات المقاومة Ht1/Ht2/Ht3.',
      },
      {
        en: 'Rotate with non-host crops (legumes) for at least one season.',
        fr: 'Rotation avec des cultures non-hôtes (légumineuses) pendant au moins une saison.',
        ar: 'دورة زراعية مع محاصيل غير العائلة (البقوليات) لموسم واحد على الأقل.',
      },
      {
        en: 'Bury crop residues to reduce over-wintering inoculum.',
        fr: 'Enfouir les résidus de culture pour réduire l\'inoculum hivernal.',
        ar: 'ادفن بقايا المحصول لتقليل مصدر العدوى الشتوي.',
      },
    ],
    severity: 'high',
    imageCategory: 'leaf-blight',
    sourceDataset: 'CCMT',
    sourceUrl: CCMT_URL,
    imageUrl: '/images/diseases/ccmt/maize-leaf-blight.jpg',
    inpvActives: ['mancozèbe', 'azoxystrobine', 'pyraclostrobine', 'tebuconazole'],
  },
  {
    id: 'maize-leaf-spot',
    crop: 'maize',
    diseaseName: {
      en: 'Southern Leaf Blight (Leaf Spot)',
      fr: 'Helminthosporiose méridionale',
      ar: 'تبقع الأوراق الجنوبي',
    },
    pathogen: {
      scientificName: 'Cochliobolus heterostrophus',
      type: 'fungal',
    },
    symptoms: {
      en: 'Small oval tan spots (2–6 mm) with dark brown borders on leaves, lesions may coalesce into larger necrotic areas under heavy pressure; favours warm, humid conditions (28–32 °C).',
      fr: 'Petites taches fauve ovales (2–6 mm) à bordures brun foncé sur les feuilles, les lésions peuvent coalescer en zones nécrotiques plus larges sous forte pression ; favorise les conditions chaudes et humides (28–32 °C).',
      ar: 'بقع صغيرة بيضاوية بنية فاتحة (2–6 مم) ذات حواف بنية داكنة على الأوراق، قد تندمج البقع إلى مناطق نخرية أكبر تحت ضغط عالٍ؛ يفضّل الظروف الدافئة الرطبة (28–32 °م).',
    },
    treatment: {
      en: 'IPM: apply mancozeb or azoxystrobin at the first sign of lesions; rotate fungicide mode of action to delay resistance. INPV-approved: mancozèbe, azoxystrobine.',
      fr: 'PI : appliquer du mancozèbe ou de l\'azoxystrobine dès les premières lésions ; alterner les modes d\'action fongicides pour retarder la résistance. Homologué INPV : mancozèbe, azoxystrobine.',
      ar: 'المكافحة المتكاملة: رش مانكوزيب أو أزوكسيستروبين عند أول ظهور للبقع؛ بدّل آلية عمل المبيد لتأخير المقاومة. المعتمد لدى المعهد الوطني لوقاية النباتات: مانكوزيب، أزوكسيستروبين.',
    },
    prevention: [
      {
        en: 'Use resistant hybrids carrying the rhm gene.',
        fr: 'Utiliser des hybrides résistants portant le gène rhm.',
        ar: 'استخدم هجينة مقاومة تحمل جين rhm.',
      },
      {
        en: 'Crop rotation with soybean or groundnut for one season.',
        fr: 'Rotation culturale avec soja ou arachide pendant une saison.',
        ar: 'دورة زراعية مع فول الصويا أو الفول السوداني لموسم واحد.',
      },
      {
        en: 'Balanced nitrogen — excess N increases susceptibility.',
        fr: 'Azote équilibré — l\'excès d\'azote augmente la sensibilité.',
        ar: 'نيتروجين متوازن — الإفراط في النيتروجين يزيد الحساسية.',
      },
    ],
    severity: 'moderate',
    imageCategory: 'leaf-spot',
    sourceDataset: 'CCMT',
    sourceUrl: CCMT_URL,
    imageUrl: '/images/diseases/ccmt/maize-leaf-spot.jpg',
    inpvActives: ['mancozèbe', 'azoxystrobine', 'tebuconazole'],
  },
  {
    id: 'maize-streak-virus',
    crop: 'maize',
    diseaseName: {
      en: 'Maize Streak Virus',
      fr: 'Virus de la striure du maïs',
      ar: 'فيروس تخطيط الذرة',
    },
    pathogen: {
      scientificName: 'Maize Streak Virus (MSV, Mastrevirus)',
      type: 'viral',
    },
    symptoms: {
      en: 'Chlorotic streaks along leaf veins that follow the vascular pattern, leaves appear "striped"; severe infection in young plants (<6 weeks) causes stunting, shortened internodes and barren ears.',
      fr: 'Stries chlorotiques le long des nervures suivant le patron vasculaire, les feuilles paraissent « rayées » ; l\'infection sévère des jeunes plants (<6 semaines) provoque un rabougrissement, des entre-nœuds raccourcis et des épis stériles.',
      ar: 'خطوط صفراوية ممتدة على طول عروق الأوراق تتبع النمط الوعائي، تبدو الأوراق «مخططة»؛ الإصابة الشديدة في النباتات الصغيرة (<6 أسابيع) تسبب التقزم، وقصر المسافات بين العقد، وعدم تكوّن كوز ذرة.',
    },
    treatment: {
      en: 'IPM: no curative treatment — rogue infected plants early. Vector control against leafhoppers (Cicadulina spp.) with systemic insecticides. INPV-approved: imidaclopride (seed treatment), lambda-cyhalothrine.',
      fr: 'PI : aucun traitement curatif — arracher précocement les plants infectés. Lutte vectorielle contre les cicadelles (Cicadulina spp.) avec des insecticides systémiques. Homologué INPV : imidaclopride (traitement de semence), lambda-cyhalothrine.',
      ar: 'المكافحة المتكاملة: لا يوجد علاج شافٍ — اقتلع النباتات المصابة مبكراً. مكافحة الناقل ضد نطّاطات الأوراق (Cicadulina spp.) بمبيدات جهازية. المعتمد لدى المعهد الوطني لوقاية النباتات: إيميداكلوبريد (معالجة البذور)، لامبدا-سيهالوثرين.',
    },
    prevention: [
      {
        en: 'Use MSV-resistant hybrids and treat seed with imidacloprid.',
        fr: 'Utiliser des hybrides résistants au MSV et traiter les semences à l\'imidaclopride.',
        ar: 'استخدم هجينة مقاومة لـ MSV وعالج البذور بالإيميداكلوبريد.',
      },
      {
        en: 'Plant early to escape peak leafhopper populations.',
        fr: 'Planter tôt pour échapper aux pics de populations de cicadelles.',
        ar: 'ازرع مبكراً لتجنب ذروة أعداد نطّاطات الأوراق.',
      },
      {
        en: 'Control grass weeds that host the vector around the field.',
        fr: 'Lutter contre les graminées adventices qui hébergent le vecteur autour du champ.',
        ar: 'كافح الأعشاب النجيلية التي تأوي الناقل حول الحقل.',
      },
    ],
    severity: 'critical',
    imageCategory: 'mosaic-virus',
    sourceDataset: 'CCMT',
    sourceUrl: CCMT_URL,
    imageUrl: '/images/diseases/ccmt/maize-streak-virus.jpg',
    inpvActives: ['imidaclopride', 'thiaméthoxame', 'lambda-cyhalothrine'],
  },
  {
    id: 'maize-lethal-necrosis',
    crop: 'maize',
    diseaseName: {
      en: 'Maize Lethal Necrosis (MLN)',
      fr: 'Nécrose létale du maïs (MLN)',
      ar: 'النخر المميت للذرة',
    },
    pathogen: {
      scientificName: 'MLN virus complex (MSV + MCMV — synergistic)',
      type: 'viral',
    },
    symptoms: {
      en: 'Severe mottling and chlorotic streaking on leaves, leaf necrosis from the tip downward, plant stunting, sterile or malformed ears, and frequent plant death — yield losses can reach 100% in susceptible varieties.',
      fr: 'Moucheture sévère et stries chlorotiques sur les feuilles, nécrose foliaire du sommet vers la base, rabougrissement, épis stériles ou malformés, et mort fréquente des plants — les pertes de rendement peuvent atteindre 100 % chez les variétés sensibles.',
      ar: 'تنقيط شديد وخطوط صفراوية على الأوراق، نخر ورقي من القمة نحو الأسفل، تقزّم النبات، كوز ذرة عقيم أو مشوّه، وموت متكرر للنباتات — قد تصل خسائر المحصول إلى 100% في الأصناف الحساسة.',
    },
    treatment: {
      en: 'IPM: no curative treatment — rogue and destroy infected plants immediately. Vector control for thrips and leafhoppers with imidacloprid seed treatment. INPV-approved: imidaclopride, thiaméthoxame, lambda-cyhalothrine.',
      fr: 'PI : aucun traitement curatif — arracher et détruire immédiatement les plants infectés. Lutte vectorielle contre les thrips et cicadelles par traitement de semence à l\'imidaclopride. Homologué INPV : imidaclopride, thiaméthoxame, lambda-cyhalothrine.',
      ar: 'المكافحة المتكاملة: لا يوجد علاج شافٍ — اقتلع وأتلف النباتات المصابة فوراً. مكافحة الناقل (تربس ونطّاطات الأوراق) بمعالجة البذور بالإيميداكلوبريد. المعتمد لدى المعهد الوطني لوقاية النباتات: إيميداكلوبريد، ثياميثوكسام، لامبدا-سيهالوثرين.',
    },
    prevention: [
      {
        en: 'Use MLN-tolerant hybrids and certified virus-free seed.',
        fr: 'Utiliser des hybrides tolérants au MLN et des semences certifiées sans virus.',
        ar: 'استخدم هجينة متحمّلة لـ MLN وبذوراً معتمدة خالية من الفيروس.',
      },
      {
        en: 'Practice crop rotation and a 2-month " maize-free period" at landscape scale to break the virus cycle.',
        fr: 'Pratiquer la rotation et une « période sans maïs » de 2 mois à l\'échelle du paysage pour briser le cycle viral.',
        ar: 'طبق الدورة الزراعية و«فترة خالية من الذرة» لمدة شهرين على مستوى المشهد لكسر دورة الفيروس.',
      },
      {
        en: 'Control volunteer maize and grass weeds that host MCMV vectors.',
        fr: 'Lutter contre les repousses de maïs et les graminées adventices qui hébergent les vecteurs du MCMV.',
        ar: 'كافح ذرة المتطوعة والأعشاب النجيلية التي تأوي نواقل MCMV.',
      },
    ],
    severity: 'critical',
    imageCategory: 'necrosis',
    sourceDataset: 'Makerere',
    sourceUrl: MAKERERE_URL,
    imageUrl: '/images/diseases/makerere/maize-lethal-necrosis.jpg',
    inpvActives: ['imidaclopride', 'thiaméthoxame', 'lambda-cyhalothrine'],
  },

  // ========================================================================
  // TOMATO — 6 classes (CCMT)
  // ========================================================================
  {
    id: 'tomato-early-blight',
    crop: 'tomato',
    diseaseName: {
      en: 'Early Blight',
      fr: 'Alternariose (Mildiou précoce)',
      ar: 'اللفحة المبكرة للطماطم',
    },
    pathogen: {
      scientificName: 'Alternaria solani',
      type: 'fungal',
    },
    symptoms: {
      en: 'Dark brown concentric ring "target-board" lesions on older leaves with characteristic chlorotic halo, often on collar of leaflet; defoliation starts on lower canopy, lesions may also appear on stems and fruit.',
      fr: 'Lésions brunes en anneaux concentriques (« cible ») sur les feuilles âgées avec halo chlorotique caractéristique, souvent au collet du foliole ; la défoliation commence sur la canopée inférieure, des lésions peuvent aussi apparaître sur tiges et fruits.',
      ar: 'بقع بنية داكنة بشكل حلقات متّحدة المركز («لوحة هدف») على الأوراق السفلى مع هالة صفراء مميزة، غالباً عند عنق الورقة؛ يبدأ تساقط الأوراق من المجموع الخضري السفلي، وقد تظهر البقع أيضاً على الساق والثمار.',
    },
    treatment: {
      en: 'IPM: apply chlorothalonil or mancozeb preventively every 7–10 days; alternate with a strobilurin (azoxystrobin) or QoI+SDHI mixture to manage resistance. INPV-approved: chlorothalonil, mancozèbe, azoxystrobine, difénoconazole.',
      fr: 'PI : appliquer du chlorothalonil ou du mancozèbe en préventif tous les 7–10 jours ; alterner avec une strobilurine (azoxystrobine) ou un mélange QoI+SDHI pour gérer la résistance. Homologué INPV : chlorothalonil, mancozèbe, azoxystrobine, difénoconazole.',
      ar: 'المكافحة المتكاملة: رش كلوروثالونيل أو مانكوزيب وقائياً كل 7–10 أيام؛ بدّل مع الستروبيلورين (أزوكسيستروبين) أو خليط QoI+SDHI لإدارة المقاومة. المعتمد لدى المعهد الوطني لوقاية النباتات: كلوروثالونيل، مانكوزيب، أزوكسيستروبين، ديفينوكونازول.',
    },
    prevention: [
      {
        en: 'Use resistant or tolerant varieties and certified disease-free seed.',
        fr: 'Utiliser des variétés résistantes ou tolérantes et des semences certifiées saines.',
        ar: 'استخدم أصنافاً مقاومة أو متحمّلة وبذوراً معتمدة خالية من المرض.',
      },
      {
        en: 'Stake plants and mulch to reduce soil splash onto lower leaves.',
        fr: 'Tuteurer les plants et pailler pour réduire les éclaboussures de sol sur les feuilles basses.',
        ar: 'دعّم النباتات وغطّ التربة لتقليل تناثر التربة على الأوراق السفلى.',
      },
      {
        en: 'Rotate with non-solanaceous crops for 2–3 seasons.',
        fr: 'Rotation avec des cultures non-solanacées pendant 2–3 saisons.',
        ar: 'دورة زراعية مع محاصيل غير العائلة الباذنجانية لموسمين أو ثلاثة.',
      },
    ],
    severity: 'high',
    imageCategory: 'leaf-spot',
    sourceDataset: 'CCMT',
    sourceUrl: CCMT_URL,
    imageUrl: '/images/diseases/ccmt/tomato-early-blight.jpg',
    inpvActives: ['chlorothalonil', 'mancozèbe', 'azoxystrobine', 'difénoconazole'],
  },
  {
    id: 'tomato-healthy',
    crop: 'tomato',
    diseaseName: {
      en: 'Tomato — Healthy',
      fr: 'Tomate — Saine',
      ar: 'الطماطم — سليمة',
    },
    pathogen: {
      scientificName: '—',
      type: 'healthy',
    },
    symptoms: {
      en: 'No symptoms detected. Leaves are uniformly green with no lesions, mottling, curling or pest feeding; fruit set and colour development are normal.',
      fr: 'Aucun symptôme. Feuilles uniformément vertes sans lésions, moucheture, recroquevillement ni traces d\'insectes ; nouaison et développement de la couleur normaux.',
      ar: 'لا توجد أعراض. الأوراق خضراء منتظمة دون بقع أو تنقيط أو تجعّد أو آثار تغذية آفات؛ عقد الثمار وتطور اللون طبيعيان.',
    },
    treatment: {
      en: 'No treatment needed. Continue IPM scouting every 5–7 days during flowering.',
      fr: 'Aucun traitement nécessaire. Continuer la surveillance PI tous les 5–7 jours pendant la floraison.',
      ar: 'لا حاجة للعلاج. واصل الكشف ضمن المكافحة المتكاملة كل 5–7 أيام أثناء الإزهار.',
    },
    prevention: [
      {
        en: 'Maintain balanced Ca and K nutrition to prevent blossom-end rot.',
        fr: 'Maintenir une nutrition équilibrée en Ca et K pour prévenir la nécrose apicale.',
        ar: 'حافظ على تغذية متوازنة بالكالسيوم والبوتاسيوم لمنع النخر القمي.',
      },
      {
        en: 'Maintain pH 6.0–6.8 and avoid waterlogging.',
        fr: 'Maintenir le pH à 6,0–6,8 et éviter l\'asphyxie racinaire.',
        ar: 'حافظ على حموضة التربة 6.0–6.8 وتجنب الإغراق.',
      },
    ],
    severity: 'low',
    imageCategory: 'healthy',
    sourceDataset: 'CCMT',
    sourceUrl: CCMT_URL,
    imageUrl: '/images/diseases/ccmt/tomato-healthy.jpg',
  },
  {
    id: 'tomato-late-blight',
    crop: 'tomato',
    diseaseName: {
      en: 'Late Blight',
      fr: 'Mildiou de la tomate',
      ar: 'اللفحة المتأخرة للطماطم',
    },
    pathogen: {
      scientificName: 'Phytophthora infestans',
      type: 'fungal',
    },
    symptoms: {
      en: 'Greasy dark olive-green to black water-soaked lesions on leaves and stems, with white fluffy sporulation on the underside under humid conditions; rapid defoliation and fruit rot in cool wet weather (15–20 °C).',
      fr: 'Lésions grasses vert olive foncé à noires, imbibées d\'eau, sur feuilles et tiges, avec sporulation blanche duveteuse au revers en conditions humides ; défoliation rapide et pourriture des fruits par temps frais et humide (15–20 °C).',
      ar: 'بقع دهنية زيتونية داكنة إلى سوداء مبللة على الأوراق والسيقان، مع تكاثر أبيض زغبي على السطح السفلي في الظروف الرطبة؛ تساقط سريع للأوراق وعفن الثمار في الطقس البارد المبلل (15–20 °م).',
    },
    treatment: {
      en: 'IPM: apply cymoxanil + mancozeb or fluopicolide + propamocarb preventively when the Smith period is met; follow with mandipropamid every 5–7 days. INPV-approved: cymoxanil, mancozèbe, fluopicolide, mandipropamide.',
      fr: 'PI : appliquer du cymoxanil + mancozèbe ou fluopicolide + propamocarbe en préventif lorsque la période de Smith est atteinte ; suivre avec mandipropamide tous les 5–7 jours. Homologué INPV : cymoxanil, mancozèbe, fluopicolide, mandipropamide.',
      ar: 'المكافحة المتكاملة: رش سيموكسانيل + مانكوزيب أو فلوبكليد + بروباموكارب وقائياً عند تحقق فترة سميث؛ تابع بمانديبروباميد كل 5–7 أيام. المعتمد لدى المعهد الوطني لوقاية النباتات: سيموكسانيل، مانكوزيب، فلوبكليد، مانديبروباميد.',
    },
    prevention: [
      {
        en: 'Use resistant varieties carrying Ph-2 / Ph-3 genes.',
        fr: 'Utiliser des variétés résistantes portant les gènes Ph-2 / Ph-3.',
        ar: 'استخدم أصنافاً مقاومة تحمل جينات Ph-2 / Ph-3.',
      },
      {
        en: 'Avoid overhead irrigation and ensure good drainage.',
        fr: 'Éviter l\'irrigation par aspersion et assurer un bon drainage.',
        ar: 'تجنب الري بالرش ووفّر صرفاً جيداً.',
      },
      {
        en: 'Destroy volunteer potato and tomato plants that harbour the pathogen.',
        fr: 'Détruire les plants repousses de pomme de terre et tomate qui hébergent le pathogène.',
        ar: 'أتلف نباتات البطاطا والطماطم المتطوعة التي تأوي الممرض.',
      },
    ],
    severity: 'critical',
    imageCategory: 'leaf-blight',
    sourceDataset: 'CCMT',
    sourceUrl: CCMT_URL,
    imageUrl: '/images/diseases/ccmt/tomato-late-blight.jpg',
    inpvActives: ['cymoxanil', 'mancozèbe', 'fluopicolide', 'mandipropamide', 'azoxystrobine'],
  },
  {
    id: 'tomato-leaf-curl',
    crop: 'tomato',
    diseaseName: {
      en: 'Tomato Leaf Curl Virus',
      fr: 'Virus de l\'enroulement des feuilles de tomate (ToLCV)',
      ar: 'فيروس تجعّد أوراق الطماطم',
    },
    pathogen: {
      scientificName: 'Tomato Leaf Curl Virus (ToLCV, Begomovirus)',
      type: 'viral',
    },
    symptoms: {
      en: 'Upward curling and cupping of leaves, thickened and leathery texture, yellowing of leaf margins, stunting, flower drop and reduced fruit set; transmitted by the whitefly Bemisia tabaci.',
      fr: 'Enroulement et cupulation vers le haut des feuilles, texture épaissie et coriace, jaunissement des marges, rabougrissement, chute des fleurs et réduction du nouaison ; transmis par l\'aleurode Bemisia tabaci.',
      ar: 'تجعّد وتقبيب الأوراق للأعلى، قوام سميك جلدي، اصفرار حواف الأوراق، تقزّم النبات، تساقط الأزهار وانخفاض عقد الثمار؛ ينتقل عبر الذبابة البيضاء Bemisia tabaci.',
    },
    treatment: {
      en: 'IPM: no cure for infected plants — rogue and destroy. Vector control with imidacloprid or thiamethoxam seedling drench, plus yellow sticky traps. INPV-approved: imidaclopride, thiaméthoxame, spiromesifen (whitefly).',
      fr: 'PI : aucune guérison — arracher et détruire. Lutte vectorielle par trempage des plants à l\'imidaclopride ou thiaméthoxame, plus pièges jaunes englués. Homologué INPV : imidaclopride, thiaméthoxame, spiromesifen (aleurode).',
      ar: 'المكافحة المتكاملة: لا يوجد علاج — اقتلع وأتلف. مكافحة الناقل بغمر الشتلات بالإيميداكلوبريد أو الثياميثوكسام مع مصائد صفراء لاصقة. المعتمد لدى المعهد الوطني لوقاية النباتات: إيميداكلوبريد، ثياميثوكسام، سبيروميسيفين (الذبابة البيضاء).',
    },
    prevention: [
      {
        en: 'Use ToLCV-resistant varieties (Ty-1, Ty-2, Ty-3 genes).',
        fr: 'Utiliser des variétés résistantes au ToLCV (gènes Ty-1, Ty-2, Ty-3).',
        ar: 'استخدم أصنافاً مقاومة لـ ToLCV (جينات Ty-1، Ty-2، Ty-3).',
      },
      {
        en: 'Use reflective mulches to repel whiteflies in the seedling stage.',
        fr: 'Utiliser des paillis réfléchissants pour repousser les aleurodes au stade plantule.',
        ar: 'استخدم نشارة عاكسة لطرد الذبابة البيضاء في مرحلة الشتلة.',
      },
      {
        en: 'Maintain a 4-week tomato-free period at the landscape scale.',
        fr: 'Maintenir une période sans tomate de 4 semaines à l\'échelle du paysage.',
        ar: 'حافظ على فترة خالية من الطماطم لمدة 4 أسابيع على مستوى المشهد.',
      },
    ],
    severity: 'critical',
    imageCategory: 'curl-virus',
    sourceDataset: 'CCMT',
    sourceUrl: CCMT_URL,
    imageUrl: '/images/diseases/ccmt/tomato-leaf-curl.jpg',
    inpvActives: ['imidaclopride', 'thiaméthoxame', 'spiromesifen', 'lambda-cyhalothrine'],
  },
  {
    id: 'tomato-spider-mites',
    crop: 'tomato',
    diseaseName: {
      en: 'Spider Mites',
      fr: 'Tétranyques tisserands',
      ar: 'العنكبوت الأحمر ذو البقع',
    },
    pathogen: {
      scientificName: 'Tetranychus urticae',
      type: 'pest',
    },
    symptoms: {
      en: 'Fine stippling or "sand-blasted" appearance on upper leaf surface, yellow speckles coalescing into bronzed leaves, fine webbing under leaves and between petioles, premature leaf drop in hot dry weather (>30 °C, RH < 50%).',
      fr: 'Picotements fins ou aspect « sablé » sur la face supérieure des feuilles, ponctuations jaunes coalescent en feuilles bronzeées, fine toile sous les feuilles et entre les pétioles, chute prématurée des feuilles par temps chaud et sec (>30 °C, HR < 50 %).',
      ar: 'تنقيط دقيق أو مظهر «مصقول بالرمل» على السطح العلوي للأوراق، بقع صفراء تندمج إلى أوراق برونزية، نسيج عنكبوتي رقيق تحت الأوراق وبين العناقيد، تساقط مبكر للأوراق في الطقس الحار الجاف (>30 °م، رطوبة < 50%).',
    },
    treatment: {
      en: 'IPM: release predatory mites (Phytoseiulus persimilis, Neoseiulus californicus); apply sulphur or abamectin at the first sign of webbing. INPV-approved: soufre, abamectine, spiromesifen.',
      fr: 'PI : lâcher d\'acariens prédateurs (Phytoseiulus persimilis, Neoseiulus californicus) ; appliquer du soufre ou de l\'abamectine dès les premières toiles. Homologué INPV : soufre, abamectine, spiromesifen.',
      ar: 'المكافحة المتكاملة: أطلق العناكب المفترسة (Phytoseiulus persimilis، Neoseiulus californicus)؛ رش الكبريت أو الأبامكتين عند أول ظهور للنسيج. المعتمد لدى المعهد الوطني لوقاية النباتات: الكبريت، الأبامكتين، سبيروميسيفين.',
    },
    prevention: [
      {
        en: 'Avoid dusty field margins — rinse dust off plants to favour predatory mites.',
        fr: 'Éviter les bordures poussiéreuses — rincer la poussière pour favoriser les acariens prédateurs.',
        ar: 'تجنب حواف الحقل المغبرة — اغسل الغبار عن النباتات لدعم العناكب المفترسة.',
      },
      {
        en: 'Avoid broad-spectrum pyrethroids that kill predatory mites.',
        fr: 'Éviter les pyréthrinoïdes à large spectre qui tuent les acariens prédateurs.',
        ar: 'تجنب البيريثرويدات واسعة الطيف التي تقتل العناكب المفترسة.',
      },
      {
        en: 'Maintain overhead misting in greenhouses to raise humidity >60%.',
        fr: 'Maintenir une brumisation au-dessus des plantes en serre pour élever l\'humidité > 60 %.',
        ar: 'حافظ على رذاذ علوي في البيوت المحمية لرفع الرطوبة فوق 60%.',
      },
    ],
    severity: 'high',
    imageCategory: 'mite-pest',
    sourceDataset: 'CCMT',
    sourceUrl: CCMT_URL,
    imageUrl: '/images/diseases/ccmt/tomato-spider-mites.jpg',
    inpvActives: ['soufre', 'abamectine', 'spiromesifen'],
  },
  {
    id: 'tomato-septoria',
    crop: 'tomato',
    diseaseName: {
      en: 'Septoria Leaf Spot',
      fr: 'Septoriose de la tomate',
      ar: 'تبقع السيبتوريا للطماطم',
    },
    pathogen: {
      scientificName: 'Septoria lycopersici',
      type: 'fungal',
    },
    symptoms: {
      en: 'Numerous small circular spots (2–3 mm) with dark brown borders and grey-white centres (pycnidia visible with a lens) on lower leaves; spots enlarge and coalesce causing rapid defoliation under humid conditions.',
      fr: 'De nombreuses petites taches circulaires (2–3 mm) à bordures brun foncé et centres gris-blanc (pycnides visibles à la loupe) sur les feuilles inférieures ; les taches s\'agrandissent et coalescent provoquant une défoliation rapide en conditions humides.',
      ar: 'بقع دائرية صغيرة عديدة (2–3 مم) بحواف بنية داكنة ومراكز رمادية-بيضاء (البيكنيديا مرئية بالعدسة المكبرة) على الأوراق السفلى؛ تكبر البقع وتندمج مسببة تساقطاً سريعاً للأوراق في الظروف الرطبة.',
    },
    treatment: {
      en: 'IPM: apply copper-based fungicide (copper hydroxide) or chlorothalonil every 7–10 days from first symptom; alternate with mancozeb to manage resistance. INPV-approved: hydroxyde de cuivre, chlorothalonil, mancozèbe, azoxystrobine.',
      fr: 'PI : appliquer un fongicide cuprique (hydroxyde de cuivre) ou du chlorothalonil tous les 7–10 jours dès le premier symptôme ; alterner avec mancozèbe pour gérer la résistance. Homologué INPV : hydroxyde de cuivre, chlorothalonil, mancozèbe, azoxystrobine.',
      ar: 'المكافحة المتكاملة: رش مبيد فطري نحاسي (هيدروكسيد النحاس) أو كلوروثالونيل كل 7–10 أيام من أول عرض؛ بدّل مع مانكوزيب لإدارة المقاومة. المعتمد لدى المعهد الوطني لوقاية النباتات: هيدروكسيد النحاس، كلوروثالونيل، مانكوزيب، أزوكسيستروبين.',
    },
    prevention: [
      {
        en: 'Stake plants and use mulch to prevent soil splash.',
        fr: 'Tuteurer les plants et utiliser un paillis pour prévenir les éclaboussures de sol.',
        ar: 'دعّم النباتات واستخدم نشارة لمنع تناثر التربة.',
      },
      {
        en: 'Remove and destroy infected lower leaves weekly.',
        fr: 'Éliminer et détruire chaque semaine les feuilles basses infectées.',
        ar: 'أزل وأتلف أسبوعياً الأوراق السفلى المصابة.',
      },
      {
        en: 'Rotate with non-solanaceous crops for 2 years.',
        fr: 'Rotation avec des cultures non-solanacées pendant 2 ans.',
        ar: 'دورة زراعية مع محاصيل غير العائلة الباذنجانية لمدة سنتين.',
      },
    ],
    severity: 'high',
    imageCategory: 'leaf-spot',
    sourceDataset: 'CCMT',
    sourceUrl: CCMT_URL,
    imageUrl: '/images/diseases/ccmt/tomato-septoria.jpg',
    inpvActives: ['hydroxyde de cuivre', 'chlorothalonil', 'mancozèbe', 'azoxystrobine'],
  },
];

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * Returns the expanded disease entry for a given id, or undefined if not found.
 */
export function getExpandedDisease(id: string): ExpandedDisease | undefined {
  return EXPANDED_DISEASES.find((d) => d.id === id);
}

/**
 * Filters expanded diseases by crop key (e.g. "cassava", "cashew").
 */
export function getExpandedDiseasesByCrop(crop: ExpandedCrop): ExpandedDisease[] {
  return EXPANDED_DISEASES.filter((d) => d.crop === crop);
}

/**
 * Returns the list of unique crop keys covered by the expanded database.
 */
export function getExpandedCrops(): ExpandedCrop[] {
  const set = new Set<ExpandedCrop>();
  for (const d of EXPANDED_DISEASES) set.add(d.crop);
  return Array.from(set);
}

/**
 * Returns a count breakdown by crop — useful for the Disease Reference
 * Gallery header pills.
 */
export function getExpandedDiseaseCountsByCrop(): Record<ExpandedCrop, number> {
  const counts: Record<ExpandedCrop, number> = {
    cashew: 0,
    cassava: 0,
    maize: 0,
    tomato: 0,
  };
  for (const d of EXPANDED_DISEASES) counts[d.crop] += 1;
  return counts;
}

/**
 * Localised disease name helper — convenience wrapper around copyFor.
 */
export function localizedDiseaseName(
  language: Language,
  disease: ExpandedDisease,
): string {
  return disease.diseaseName[language];
}

/**
 * Localised symptom helper.
 */
export function localizedDiseaseSymptoms(
  language: Language,
  disease: ExpandedDisease,
): string {
  return disease.symptoms[language];
}

/**
 * Localised treatment helper.
 */
export function localizedDiseaseTreatment(
  language: Language,
  disease: ExpandedDisease,
): string {
  return disease.treatment[language];
}

/**
 * Localised prevention list helper.
 */
export function localizedDiseasePrevention(
  language: Language,
  disease: ExpandedDisease,
): string[] {
  return disease.prevention.map((p) => p[language]);
}

/**
 * Severity → human-readable trilingual label.
 */
export const SEVERITY_LABELS: Record<
  ExpandedSeverity,
  { en: string; fr: string; ar: string; color: string }
> = {
  low: { en: 'Low', fr: 'Faible', ar: 'منخفض', color: '#10b981' },
  moderate: { en: 'Moderate', fr: 'Modéré', ar: 'متوسط', color: '#f59e0b' },
  high: { en: 'High', fr: 'Élevé', ar: 'مرتفع', color: '#f97316' },
  critical: { en: 'Critical', fr: 'Critique', ar: 'حرج', color: '#dc2626' },
};

/**
 * Pathogen-type → trilingual label + emoji + colour (for gallery badges).
 */
export const PATHOGEN_TYPE_META: Record<
  PathogenType,
  { en: string; fr: string; ar: string; emoji: string; color: string }
> = {
  fungal: { en: 'Fungal', fr: 'Fongique', ar: 'فطري', emoji: '🦠', color: '#dc2626' },
  bacterial: { en: 'Bacterial', fr: 'Bactérien', ar: 'بكتيري', emoji: '🟠', color: '#f97316' },
  viral: { en: 'Viral', fr: 'Viral', ar: 'فيروسي', emoji: '🟣', color: '#8b5cf6' },
  pest: { en: 'Pest', fr: 'Ravageur', ar: 'آفة', emoji: '🐛', color: '#eab308' },
  algal: { en: 'Algal', fr: 'Algal', ar: 'طحلبي', emoji: '🟢', color: '#84cc16' },
  healthy: { en: 'Healthy', fr: 'Sain', ar: 'سليم', emoji: '✅', color: '#10b981' },
};

/**
 * Image-category → emoji + colour (for gallery card icon).
 */
export const IMAGE_CATEGORY_META: Record<
  ExpandedDisease['imageCategory'],
  { emoji: string; color: string }
> = {
  'leaf-spot': { emoji: '🍂', color: '#92400e' },
  'leaf-blight': { emoji: '🔥', color: '#b91c1c' },
  'mosaic-virus': { emoji: '🟪', color: '#7c3aed' },
  'curl-virus': { emoji: '🌀', color: '#6d28d9' },
  'insect-pest': { emoji: '🐛', color: '#ca8a04' },
  'mite-pest': { emoji: '🕷️', color: '#a16207' },
  canker: { emoji: '🪵', color: '#78350f' },
  algal: { emoji: '🟢', color: '#4d7c0f' },
  healthy: { emoji: '🌱', color: '#15803d' },
  necrosis: { emoji: '☠️', color: '#450a0a' },
};
