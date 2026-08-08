/**
 * Algeria Phyto Data — active-matter decision support catalogue.
 *
 * Curated from:
 *   - "Index des Produits Phytosanitaires à Usage Agricole" — Algérie, INPV 2017
 *     (INDEX_PRODUITS_PHYTO_2017.pdf in the repo root)
 *   - E-Phy (Anses, France) open-data dump (data.gouv.fr) — Licence Ouverte 2.0
 *   - EPPO registered-products index
 *
 * DISCLAIMER: informational support only. Always verify the current Algerian
 * registration (INPV — Ministère de l'Agriculture) and the product label
 * (dose, DAR, cultures autorisées) before any use.
 */

export type ProblemType = 'disease' | 'pest' | 'weed';

export type ActiveMatterType =
  | 'insecticide'
  | 'acaricide'
  | 'fungicide'
  | 'herbicide'
  | 'nematicide'
  | 'rodenticide'
  | 'molluscicide'
  | 'bio-insecticide'
  | 'bio-fongicide';

export interface ActiveMatter {
  id: string;
  /** Commercial name (Algerian brand when known from the 2017 index). */
  name: string;
  /** Active substance, e.g. 'abamectine 1,8 %'. */
  activeSubstance: string;
  type: ActiveMatterType;
  formulation: string;
  /** Crops this product is registered / used on in Algeria. */
  crops: string[];
  /** IDs of PlantProblem entries this active matter targets. */
  targets: string[];
  /** IRAC / FRAC / HRAC code when known. */
  resistanceCode?: string;
  modeOfAction: string;
  applicationRate: string;
  preHarvestInterval: string;
  safetyLevel: 'low' | 'medium' | 'high';
  cost: 'low' | 'medium' | 'high';
  availability: 'common' | 'moderate' | 'rare';
  restrictions: string[];
  /** Names of alternative products / active substances. */
  alternatives: string[];
  /** True when the product appears in the Algerian 2017 index. */
  registeredAlgeria: boolean;
  /** e.g. 'inpv-2017', 'ephy', 'eppo', 'expert' */
  source: string;
}

export interface PlantProblem {
  id: string;
  name: string;
  nameAr?: string;
  type: ProblemType;
  crops: string[];
  /** Free-text symptom / damage keywords used for free-text matching. */
  symptoms: string[];
  /** IDs of active matters to consider (ranked in this order). */
  actives: string[];
  notes?: string;
}

/** Algeria-relevant crops with emoji for the dropdown. */
export const ALGERIA_CROPS: { id: string; name: string; emoji: string }[] = [
  { id: 'wheat', name: 'Blé (dur / tendre)', emoji: '🌾' },
  { id: 'barley', name: 'Orge', emoji: '🌾' },
  { id: 'maize', name: 'Maïs', emoji: '🌽' },
  { id: 'potato', name: 'Pomme de terre', emoji: '🥔' },
  { id: 'tomato', name: 'Tomate', emoji: '🍅' },
  { id: 'pepper', name: 'Poivron / Piment', emoji: '🫑' },
  { id: 'cucurbits', name: 'Cucurbitacées (melon, pastèque, concombre)', emoji: '🍉' },
  { id: 'onion', name: 'Oignon / Ail', emoji: '🧅' },
  { id: 'olive', name: 'Olivier', emoji: '🫒' },
  { id: 'datepalm', name: 'Palmier dattier', emoji: '🌴' },
  { id: 'vine', name: 'Vigne', emoji: '🍇' },
  { id: 'citrus', name: 'Agrumes (oranger, mandarinier…)', emoji: '🍊' },
  { id: 'apple', name: 'Pommier / Poirier', emoji: '🍎' },
  { id: 'stonefruit', name: 'Pêcher / Abricotier / Cerisier', emoji: '🍑' },
  { id: 'legumes', name: 'Pois chiche / Lentille / Fève / Haricot', emoji: '🫘' },
  { id: 'sugarbeet', name: 'Betterave sucrière', emoji: '🍬' },
  { id: 'sunflower', name: 'Tournesol', emoji: '🌻' },
  { id: 'strawberry', name: 'Fraise', emoji: '🍓' },
  { id: 'almond', name: 'Amandier', emoji: '🌰' },
];

export const CROP_BY_ID: Record<string, { name: string; emoji: string }> =
  Object.fromEntries(ALGERIA_CROPS.map((c) => [c.id, { name: c.name, emoji: c.emoji }]));

// ===========================================================================
// Plant problems — diseases, pests and weeds relevant to Algerian agriculture
// ===========================================================================
export const PLANT_PROBLEMS: PlantProblem[] = [
  // ---------------------------------------------------------------- DISEASES
  { id: 'mildew-potato', name: 'Mildiou (Phytophthora infestans)', nameAr: 'البياض الزغبي', type: 'disease', crops: ['potato', 'tomato'], symptoms: ['mildiou', 'taches brunes', 'pourriture humide', 'feuilles', 'phytophthora'], actives: ['metalaxyl-m', 'mancozebe', 'cymoxanil', 'cuivre', 'azoxystrobine'], notes: 'Intervenir en préventif dès les conditions favorables (humidité + 10-25 °C) ; alterner les familles chimiques pour limiter les résistances.' },
  { id: 'mildew-vine', name: 'Mildiou de la vigne (Plasmopara viticola)', type: 'disease', crops: ['vine'], symptoms: ['mildiou', 'taches d huile', 'grappes', 'vigne', 'feuilles'], actives: ['metalaxyl-m', 'mancozebe', 'cymoxanil', 'cuivre', 'fosetyl-aluminium'], notes: 'Déclencher à partir du stade 3-4 feuilles si pluie + 10 °C ; protéger les grappes jusqu’à la véraison.' },
  { id: 'mildew-onion', name: 'Mildiou de l’oignon (Peronospora destructor)', type: 'disease', crops: ['onion'], symptoms: ['mildiou', 'oignon', 'taches violacees', 'plumes'], actives: ['mancozebe', 'metalaxyl-m', 'cuivre', 'cymoxanil'], notes: 'Favoriser l’aération, éviter les irrigations le soir ; appliquer en préventif en période humide.' },
  { id: 'mildew-cucurbits', name: 'Mildiou des cucurbitacées (Pseudoperonospora)', type: 'disease', crops: ['cucurbits'], symptoms: ['mildiou', 'cucurbitacees', 'melon', 'pastèque', 'taches jaunes'], actives: ['mancozebe', 'metalaxyl-m', 'cymoxanil', 'cuivre'], notes: 'Surveiller le feuillage inférieur ; traitements préventifs par temps frais et humide.' },
  { id: 'alternaria', name: 'Alternariose / brûlure précoce (Alternaria solani)', nameAr: 'التبقع المبكر', type: 'disease', crops: ['potato', 'tomato', 'olive', 'citrus'], symptoms: ['alternaria', 'taches brunes concentriques', 'brulure', 'feuilles agees'], actives: ['mancozebe', 'chlorothalonil', 'azoxystrobine', 'cuivre'], notes: 'Souvent lié au stress et aux carences ; débuter dès l’apparition des premières taches sur feuilles âgées.' },
  { id: 'septoria', name: 'Septoriose du blé (Septoria tritici)', nameAr: 'التبقع السبوري', type: 'disease', crops: ['wheat', 'barley'], symptoms: ['septoria', 'taches brunes', 'blé', 'feuilles', 'nécrose'], actives: ['chlorothalonil', 'propiconazole', 'tebuconazole', 'cyproconazole', 'azoxystrobine'], notes: 'Le risque monte après des pluies sur la végétation ; traiter entre la montaison et l’épiaison si le seuil est atteint.' },
  { id: 'rust-wheat', name: 'Rouilles des céréales (jaune / brune)', nameAr: 'صدأ القمح', type: 'disease', crops: ['wheat', 'barley'], symptoms: ['rouille', 'pustules', 'orange', 'jaune', 'blé', 'orge'], actives: ['propiconazole', 'tebuconazole', 'cyproconazole', 'flutriafol', 'azoxystrobine'], notes: 'Traitement curatif dans les 5-7 jours suivant l’apparition des pustules ; alterner triazoles et strobilurines.' },
  { id: 'rust-onion', name: 'Rouille de l’oignon / de l’ail (Puccinia)', type: 'disease', crops: ['onion'], symptoms: ['rouille', 'oignon', 'ail', 'pustules', 'orangées'], actives: ['difenoconazole', 'tebuconazole', 'mancozebe'], notes: 'Éviter les excès d’azote et les densités trop fortes ; débuter le traitement dès les premières pustules.' },
  { id: 'powdery-cereals', name: 'Oïdium des céréales (Blumeria graminis)', nameAr: 'البياض الدقيقي', type: 'disease', crops: ['wheat', 'barley'], symptoms: ['oïdium', 'blanc', 'poudreuse', 'feuilles', 'blé'], actives: ['propiconazole', 'tebuconazole', 'azoxystrobine', 'soufre'], notes: 'Souvent favorisé par des semis denses et un excès d’azote ; intervenir sur les premières pustules blanches.' },
  { id: 'powdery-vine', name: 'Oïdium de la vigne (Erysiphe necator)', type: 'disease', crops: ['vine'], symptoms: ['oïdium', 'blanc', 'poudreuse', 'vigne', 'grappes'], actives: ['soufre', 'penconazole', 'myclobutanil', 'azoxystrobine'], notes: 'Les grappes sont sensibles de la floraison à la fermeture ; alterner soufre et triazoles pour éviter les résistances.' },
  { id: 'powdery-cucurbits', name: 'Oïdium des cucurbitacées', type: 'disease', crops: ['cucurbits'], symptoms: ['oïdium', 'blanc', 'cucurbitacees', 'melon'], actives: ['soufre', 'difenoconazole', 'azoxystrobine', 'kresoxim-methyl'], notes: 'Intervenir sur les premières plages blanches, souvent en fin de cycle ; favoriser l’aération du feuillage.' },
  { id: 'powdery-olive', name: 'Oïdium / autres maladies foliaires de l’olivier', type: 'disease', crops: ['olive'], symptoms: ['oïdium', 'olivier', 'blanc'], actives: ['soufre', 'cuivre'], notes: 'Les maladies foliaires de l’olivier sont surtout maîtrisées par le cuivre en automne-hiver.' },
  { id: 'gray-mold', name: 'Pourriture grise / Botrytis', nameAr: 'العفن الرمادي', type: 'disease', crops: ['vine', 'tomato', 'strawberry', 'stonefruit'], symptoms: ['botrytis', 'pourriture grise', 'moisissure', 'grappes', 'fruits'], actives: ['iprodione', 'thiophanate-methyl', 'carbendazime'], notes: 'Travailler l’aération, éviter les blessures ; appliquer au début de la floraison et avant fermeture des grappes.' },
  { id: 'fusarium-head', name: 'Fusariose des épis (Fusarium graminearum)', type: 'disease', crops: ['wheat', 'barley'], symptoms: ['fusariose', 'epis', 'blancs', 'echaudage', 'blé'], actives: ['tebuconazole', 'propiconazole', 'cyproconazole'], notes: 'Risque maximal si pluie + chaleur pendant la floraison ; traiter de la fin floraison au début de l’épiaison.' },
  { id: 'eyespot', name: 'Piétin-verse des céréales (Pseudocercosporella)', type: 'disease', crops: ['wheat', 'barley'], symptoms: ['piétin', 'taches ovales', 'verse', 'base des tiges'], actives: ['cyproconazole', 'tebuconazole'], notes: 'Intervenir au tallage-épi 1 cm en cas de précédent blé et de printemps frais et humide.' },
  { id: 'peacock', name: 'Œil de paon de l’olivier (Spilocaea oleaginea)', nameAr: 'عين الطاووس', type: 'disease', crops: ['olive'], symptoms: ['œil de paon', 'cycloconium', 'taches rondes', 'olivier', 'feuilles'], actives: ['cuivre', 'mancozebe', 'difenoconazole'], notes: 'Le cuivre en automne (avant les pluies) et au printemps limite fortement le développement ; surveiller les feuilles de l’année.' },
  { id: 'bayoud', name: 'Bayoud du palmier dattier (Fusarium oxysporum f. sp. albedinis)', nameAr: 'مرض البيوض', type: 'disease', crops: ['datepalm'], symptoms: ['bayoud', 'fusariose', 'palmier', 'dessèchement', 'feuilles'], actives: ['thiophanate-methyl'], notes: 'Aucun traitement curatif réel : arrachage des pieds atteints, plantation de variétés tolérantes (Takerbucht…) et désinfection du sol.' },
  { id: 'gummosis-citrus', name: 'Gommose des agrumes (Phytophthora spp.)', type: 'disease', crops: ['citrus'], symptoms: ['gommose', 'gomme', 'tronc', 'agrumes', 'phytophthora'], actives: ['metalaxyl-m', 'cuivre', 'fosetyl-aluminium'], notes: 'Badigeonner la base du tronc au cuivre ; améliorer le drainage et éviter les blessures du collet.' },
  { id: 'anthracnose-legumes', name: 'Anthracnose / Ascochyta des légumineuses', type: 'disease', crops: ['legumes'], symptoms: ['anthracnose', 'ascochyta', 'pois chiche', 'lentille', 'fève', 'taches noires'], actives: ['mancozebe', 'chlorothalonil', 'azoxystrobine'], notes: 'Utiliser des semences saines ; rotation longue ; traiter préventivement en végétation humide.' },
  { id: 'chocolate-spot', name: 'Botrytis de la fève (taches chocolat)', type: 'disease', crops: ['legumes'], symptoms: ['chocolat', 'taches brunes', 'fève', 'botrytis'], actives: ['iprodione', 'thiophanate-methyl'], notes: 'Favorisé par la densité et l’humidité ; intervenir au début de la floraison si les conditions sont propices.' },
  { id: 'scab-apple', name: 'Tavelure du pommier / poirier (Venturia)', type: 'disease', crops: ['apple'], symptoms: ['tavelure', 'taches', 'pommier', 'fruits', 'feuilles'], actives: ['captan', 'difenoconazole', 'mancozebe'], notes: 'Caler les traitements sur les pluies contaminatrices du printemps ; le mancozèbe en préventif reste la base.' },
  { id: 'monilia', name: 'Moniliose des arbres fruitiers (Monilinia)', type: 'disease', crops: ['stonefruit'], symptoms: ['moniliose', 'pourriture', 'fruits', 'momifiés', 'pêcher', 'abricotier'], actives: ['iprodione', 'thiophanate-methyl'], notes: 'Retirer les fruits momifiés ; traiter à la floraison (botrytis) puis avant récolte si le risque est élevé.' },
  { id: 'cercospora-beet', name: 'Cercosporiose de la betterave sucrière', type: 'disease', crops: ['sugarbeet'], symptoms: ['cercospora', 'taches grises', 'betterave', 'feuilles'], actives: ['mancozebe', 'difenoconazole', 'azoxystrobine'], notes: 'Intervenir dès 3-5 % de feuilles atteintes par temps chaud et humide ; alterner les familles.' },

  // ------------------------------------------------------------------ PESTS
  { id: 'tuta', name: 'Tuta absoluta (mineuse de la tomate)', nameAr: 'توتا أبسولوتا', type: 'pest', crops: ['tomato', 'potato'], symptoms: ['tuta', 'mineuse', 'galeries', 'feuilles', 'tomate'], actives: ['emamectine', 'spinosad', 'chlorantraniliprole', 'indoxacarbe', 'abamectine', 'bt'], notes: 'Piégeage massif (phéromones) + traitements dès l’apparition des premières mines ; alterner les groupes IRAC.' },
  { id: 'spodoptera', name: 'Spodoptera littoralis (ver du cotonnier / légionnaire)', nameAr: 'دودة ورق القطن', type: 'pest', crops: ['tomato', 'potato', 'pepper', 'legumes', 'sugarbeet', 'maize', 'cucurbits'], symptoms: ['spodoptera', 'légionnaire', 'chenilles', 'feuilles decoupees', 'grecques'], actives: ['emamectine', 'spinosad', 'lambda-cyhalothrine', 'chlorantraniliprole', 'methomyl', 'bt'], notes: 'Intervenir sur jeunes chenilles (L1-L2) ; rotations de familles pour éviter les résistances.' },
  { id: 'helicoverpa', name: 'Noctuelle de la tomate (Helicoverpa armigera)', nameAr: 'دودة الثمار', type: 'pest', crops: ['tomato', 'pepper', 'maize', 'legumes'], symptoms: ['helicoverpa', 'noctuelle', 'chenilles', 'fruits perforés', 'tomate'], actives: ['emamectine', 'spinosad', 'chlorantraniliprole', 'indoxacarbe', 'lambda-cyhalothrine'], notes: 'Surveiller les vols au piège ; traiter les jeunes stades larvaires en fin de journée.' },
  { id: 'aphids', name: 'Pucerons (toutes cultures)', nameAr: 'المن', type: 'pest', crops: ['wheat', 'barley', 'potato', 'tomato', 'citrus', 'olive', 'legumes', 'vine', 'apple', 'stonefruit', 'cucurbits', 'datepalm'], symptoms: ['pucerons', 'miellat', 'fumagine', 'feuilles enroulees', 'piqures'], actives: ['acetamipride', 'lambda-cyhalothrine', 'imidaclopride', 'thiamethoxame', 'dimethoate', 'cypermethrine', 'azadirachtine'], notes: 'Vérifier la présence d’auxiliaires avant de traiter ; les pucerons transmettent des viroses — agir vite.' },
  { id: 'whitefly', name: 'Aleurodes / mouches blanches (Bemisia, Trialeurodes)', nameAr: 'الذبابة البيضاء', type: 'pest', crops: ['tomato', 'cucurbits', 'pepper', 'citrus'], symptoms: ['aleurodes', 'mouches blanches', 'miellat', 'fumagine', 'feuilles jaunes'], actives: ['acetamipride', 'imidaclopride', 'thiamethoxame', 'spinosad', 'azadirachtine', 'beauveria'], notes: 'Intervenir sur jeunes larves ; associer aux lâchers d’auxiliaires (Encarsia) et aux pièges jaunes.' },
  { id: 'thrips', name: 'Thrips (oignon, cultures maraîchères, agrumes)', nameAr: 'التربس', type: 'pest', crops: ['onion', 'pepper', 'tomato', 'citrus', 'strawberry'], symptoms: ['thrips', 'stries argentées', 'oignon', 'deformations'], actives: ['spinosad', 'acetamipride', 'lambda-cyhalothrine', 'abamectine'], notes: 'Détecter tôt (pièges bleus) ; le spinosad est efficace mais à alterner pour préserver son efficacité.' },
  { id: 'mites', name: 'Acariens / araignées rouges (Tetranychus, Panonychus)', nameAr: 'العنكبوت الأحمر', type: 'pest', crops: ['tomato', 'cucurbits', 'citrus', 'vine', 'strawberry', 'olive', 'apple'], symptoms: ['acariens', 'araignees rouges', 'taches jaunâtres', 'toiles', 'feuilles'], actives: ['abamectine', 'pyridabene', 'fenpyroximate', 'hexythiazox', 'bifenthrine', 'fenbutatin'], notes: 'Temps chaud et sec = risque ; alterner les groupes chimiques, le soufre peut aider en prévention sur certaines cultures.' },
  { id: 'leafminer', name: 'Mineuses (agrumes, maraîchage)', type: 'pest', crops: ['citrus', 'tomato', 'cucurbits'], symptoms: ['mineuses', 'galeries', 'serpentines', 'feuilles'], actives: ['abamectine', 'diflubenzuron', 'spinosad'], notes: 'Traiter les jeunes larves avant qu’elles ne pénètrent dans le feuillage ; surveiller les repousses.' },
  { id: 'medfly', name: 'Mouche méditerranéenne des fruits / cératite (Ceratitis capitata)', nameAr: 'ذبابة البحر المتوسط', type: 'pest', crops: ['citrus', 'stonefruit', 'apple', 'vine'], symptoms: ['cératite', 'mouche des fruits', 'pigures', 'fruits véreux'], actives: ['deltamethrine', 'lambda-cyhalothrine', 'dimethoate'], notes: 'Associer piégeage massif et appâts ; la deltaméthrine appâtée sur le feuillage est plus respectueuse des auxiliaires.' },
  { id: 'olivefly', name: 'Mouche de l’olive (Bactrocera oleae)', nameAr: 'ذبابة الزيتون', type: 'pest', crops: ['olive'], symptoms: ['mouche de l olive', 'pigures', 'fruits troues', 'chutes', 'olivier'], actives: ['deltamethrine', 'lambda-cyhalothrine', 'dimethoate'], notes: 'Déclencher après piégeage (seuil) ; combiner appâts protéinés et traitements localisés.' },
  { id: 'olivemoth', name: 'Teigne de l’olivier (Prays oleae)', type: 'pest', crops: ['olive'], symptoms: ['teigne', 'prays', 'galeries', 'fleurs', 'fruits'], actives: ['deltamethrine', 'lambda-cyhalothrine', 'diflubenzuron'], notes: 'Intervenir sur la génération anthophage (boutons floraux) qui conditionne la nuisibilité.' },
  { id: 'blackscale', name: 'Cochenilles (noires, virgules…) — agrumes, olivier', nameAr: 'الحشرات القشرية', type: 'pest', crops: ['citrus', 'olive', 'vine', 'stonefruit'], symptoms: ['cochenilles', 'boucliers', 'miellat', 'fumagine', 'rameaux'], actives: ['chlorpyriphos-ethyl', 'dimethoate', 'acetamipride'], notes: 'Traitements d’hiver à l’huile minérale + intervention estivale sur jeunes larves mobiles.' },
  { id: 'citrusleafminer', name: 'Mineuse des agrumes (Phyllocnistis citrella)', type: 'pest', crops: ['citrus'], symptoms: ['mineuse', 'agrumes', 'galeries argentées', 'jeunes pousses'], actives: ['abamectine', 'diflubenzuron', 'spinosad'], notes: 'Protéger les jeunes pousses ; les dégâts sont surtout esthétiques sur arbres adultes.' },
  { id: 'codlingmoth', name: 'Carpocapse (ver de la pomme / poire)', type: 'pest', crops: ['apple'], symptoms: ['carpocapse', 'vers', 'fruits', 'pommier', 'galeries'], actives: ['chlorantraniliprole', 'spinosad', 'lambda-cyhalothrine'], notes: 'Piégeage sexuel pour le déclenchement ; viser l’éclosion des œufs avant pénétration dans le fruit.' },
  { id: 'doryphore', name: 'Doryphore de la pomme de terre (Leptinotarsa)', nameAr: 'خنفساء كولورادو', type: 'pest', crops: ['potato'], symptoms: ['doryphore', 'coléoptère', 'feuilles dévorées', 'larves', 'pomme de terre'], actives: ['lambda-cyhalothrine', 'chlorantraniliprole', 'spinosad', 'thiamethoxame'], notes: 'Intervenir sur les jeunes larves (stade L2-L3) ; surveiller les bordures de parcelle en premier.' },
  { id: 'dubas', name: 'Boufaroua / Dubas du palmier (Ommatissus lybicus)', nameAr: 'دوباس النخيل', type: 'pest', crops: ['datepalm'], symptoms: ['dubas', 'boufaroua', 'miellat', 'feuilles', 'palmier'], actives: ['imidaclopride', 'thiamethoxame', 'acetamipride', 'lambda-cyhalothrine'], notes: 'Surveiller la première génération après la pollinisation ; le miellat favorise la fumagine.' },
  { id: 'pyrale-dattes', name: 'Pyrale des dattes (Ectomyelois ceratoniae)', nameAr: 'فراشة التمر', type: 'pest', crops: ['datepalm'], symptoms: ['pyrale', 'vers des dattes', 'fruits', 'toiles', 'palmier'], actives: ['spinosad', 'deltamethrine', 'bt'], notes: 'Envelopper les régimes, récolte précoce, hygiène des dattes tombées ; le traitement chimique est difficile à positionner.' },
  { id: 'redweevil', name: 'Charançon rouge du palmier (Rhynchophorus ferrugineus)', nameAr: 'سوسة النخيل الحمراء', type: 'pest', crops: ['datepalm'], symptoms: ['charançon', 'sciure', 'palmes', 'palmier', 'couronne'], actives: ['imidaclopride', 'chlorpyriphos-ethyl', 'fipronil'], notes: 'Détection précoce obligatoire (phéromones) ; injections de tronc réservées aux professionnels ; arrachage des arbres très atteints.' },
  { id: 'locust', name: 'Criquet pèlerin (Schistocerca gregaria)', nameAr: 'الجراد الصحراوي', type: 'pest', crops: ['wheat', 'barley', 'maize', 'legumes', 'datepalm'], symptoms: ['criquet', 'essaims', 'sauterelles', 'feuilles dévorées'], actives: ['deltamethrine', 'lambda-cyhalothrine', 'alpha-cypermethrine', 'metarhizium'], notes: 'Traitement en ULV, déclenché par les services de l’INPV en lutte anti-acridienne ; le Metarhizium convient en lutte biologique.' },
  { id: 'nematodes', name: 'Nématodes à galles (Meloidogyne)', nameAr: 'النيماتودا', type: 'pest', crops: ['tomato', 'cucurbits', 'potato', 'legumes'], symptoms: ['nématodes', 'galles', 'racines', 'rabougrissement', 'jaunissement'], actives: ['chlorpyriphos-ethyl'], notes: 'Le traitement chimique est limité : rotation, plantes pièges (tagète), solarisation et variétés résistantes d’abord.' },
  { id: 'wireworm', name: 'Vers blancs / taupins (sols)', type: 'pest', crops: ['potato', 'wheat', 'maize'], symptoms: ['taupins', 'vers blancs', 'tubercules piqués', 'racines'], actives: ['chlorpyriphos-ethyl', 'fipronil'], notes: 'Intervenir à la plantation (localisé) ; labour et rotation réduisent les populations.' },
  { id: 'sitona', name: 'Sitone du pois chiche (Sitona) et charançons des légumineuses', type: 'pest', crops: ['legumes'], symptoms: ['sitone', 'charançon', 'encoches', 'feuilles', 'pois chiche'], actives: ['lambda-cyhalothrine', 'deltamethrine'], notes: 'Surveiller à la levée ; le seuil d’intervention est bas car les larves attaquent les nodosités.' },
  { id: 'clb', name: 'Criocère / lémas des céréales (Oulema)', type: 'pest', crops: ['wheat', 'barley'], symptoms: ['criocere', 'lemas', 'feuilles striees', 'blé', 'larves'], actives: ['lambda-cyhalothrine', 'deltamethrine', 'cypermethrine'], notes: 'Intervenir si 10 % des feuilles portent des larves au stade montaison-épiaison.' },
  { id: 'hessefly', name: 'Mouche de Hesse / cécidomyies des céréales', type: 'pest', crops: ['wheat', 'barley'], symptoms: ['mouche de hesse', 'cécidomyie', 'pieds cassés', 'blé'], actives: ['lambda-cyhalothrine', 'deltamethrine'], notes: 'Semis tardifs et destruction des repousses réduisent le risque ; traitement localisé en bordure.' },
  { id: 'onionfly', name: 'Mouche de l’oignon (Delia antiqua)', type: 'pest', crops: ['onion'], symptoms: ['mouche de l oignon', 'larves', 'bulbes', 'plantes jaunies'], actives: ['chlorpyriphos-ethyl', 'lambda-cyhalothrine'], notes: 'Rotation stricte, destruction des débris ; le traitement est surtout efficace en préventif au semis/plantation.' },
  { id: 'termites', name: 'Termites (cultures et palmiers)', type: 'pest', crops: ['datepalm', 'maize', 'sugarbeet'], symptoms: ['termites', 'galeries', 'racines', 'dessèchement'], actives: ['fipronil', 'chlorpyriphos-ethyl'], notes: 'Traitement localisé du sol et du collet ; éliminer les débris de bois.' },
  { id: 'slugs', name: 'Limaces (maraîchage, céréales)', type: 'pest', crops: ['wheat', 'tomato', 'cucurbits', 'legumes'], symptoms: ['limaces', 'bave', 'feuilles grignotees', 'pluies'], actives: ['methiocarbe'], notes: 'Appâts à épandre en soirée après pluie ; travail du sol et passage de rouleau cassent le cycle.' },
  { id: 'rodents', name: 'Rongeurs (campagnols, rats)', type: 'pest', crops: ['wheat', 'barley', 'legumes', 'datepalm'], symptoms: ['rongeurs', 'campagnols', 'rats', 'galeries', 'plantes rongees'], actives: ['bromadiolone'], notes: 'Appâts anticoagulants à positionner dans les galeries ; respecter scrupuleusement les consignes pour protéger la faune.' },

  // ------------------------------------------------------------------ WEEDS
  { id: 'wild-oat', name: 'Folle avoine (Avena fatua)', nameAr: 'الشوفان البري', type: 'weed', crops: ['wheat', 'barley'], symptoms: ['folle avoine', 'graminée', 'champ de céréales'], actives: ['clodinafop', 'fenoxaprop-p', 'diclofop-methyl', 'sulfosulfuron'], notes: 'Dose et stade (tallage) essentiels ; alterner les familles HRAC pour éviter les résistances.' },
  { id: 'ryegrass', name: 'Ivraie (Lolium rigidum)', nameAr: 'الزوان', type: 'weed', crops: ['wheat', 'barley'], symptoms: ['ivraie', 'graminée', 'lolium'], actives: ['sulfosulfuron', 'clodinafop', 'pendimethaline'], notes: 'L’ivraie résistante est un problème croissant : rotation, faux-semis, désherbage mécanique.' },
  { id: 'bromegrass', name: 'Brome des céréales', type: 'weed', crops: ['wheat', 'barley'], symptoms: ['brome', 'graminée'], actives: ['sulfosulfuron', 'clodinafop'], notes: 'Intervenir précocement au tallage.' },
  { id: 'broadleaf-cereals', name: 'Dicotylédones des céréales (coquelicot, vesce, moutarde…)', nameAr: 'الأعشاب عريضة الأوراق', type: 'weed', crops: ['wheat', 'barley'], symptoms: ['dicotylédones', 'coquelicot', 'vesce', 'moutarde', 'chardons'], actives: ['2,4-d', 'mcpa', 'metsulfuron-methyl', 'fluroxypyr'], notes: 'Stade optimal : tallage — début montaison ; éviter les températures < 5 °C.' },
  { id: 'annual-grasses-maize', name: 'Graminées annuelles du maïs (panic, sétaire…)', type: 'weed', crops: ['maize'], symptoms: ['graminées', 'maïs', 'panic', 'sétaire'], actives: ['nicosulfuron', 'atrazine', 's-metolachlore', 'acetochlore'], notes: 'L’atrazine est interdite en Europe mais encore homologuée dans certains pays : vérifier la réglementation algérienne en vigueur.' },
  { id: 'broadleaf-veg', name: 'Dicotylédones des cultures maraîchères et industrielles', type: 'weed', crops: ['potato', 'tomato', 'onion', 'sugarbeet', 'sunflower'], symptoms: ['dicotylédones', 'maraîchage', 'betterave', 'tournesol'], actives: ['metribuzine', 'linuron', 'oxyfluorfene', 'pendimethaline', 'bentazone'], notes: 'Respecter les cultures et stades homologués ; la metribuzine s’emploie en pré-levée de la pomme de terre.' },
  { id: 'orobanche', name: 'Orobanche (plante parasite)', nameAr: 'الهالوك', type: 'weed', crops: ['legumes', 'tomato', 'sunflower'], symptoms: ['orobanche', 'plante parasite', 'tiges roses', 'collet'], actives: ['glyphosate'], notes: 'Aucun herbicide n’est réellement curatif : solarisation, faux-semis, variétés résistantes, arrachage manuel avant floraison ; glyphosate en traitement localisé exceptionnel.' },
  { id: 'perennial-grasses', name: 'Chiendent et graminées vivaces', type: 'weed', crops: ['wheat', 'potato', 'vine', 'citrus'], symptoms: ['chiendent', 'vivaces', 'rhizomes'], actives: ['glyphosate', 'glufosinate', 'quizalofop-p', 'haloxyfop', 'sethoxydim'], notes: 'Glyphosate sur repousses en automne ou avant plantation ; pour les cultures de légumineuses : graminicides foliaires spécifiques.' },
];

// Index helpers ------------------------------------------------------------
export const PROBLEM_BY_ID: Record<string, PlantProblem> = Object.fromEntries(
  PLANT_PROBLEMS.map((p) => [p.id, p]),
);

export const problemTypeLabel: Record<ProblemType, string> = {
  disease: 'Maladie',
  pest: 'Ravageur',
  weed: 'Adventice',
};

export const problemTypeEmoji: Record<ProblemType, string> = {
  disease: '🦠',
  pest: '🐛',
  weed: '🌿',
};

export const problemTypeAr: Record<ProblemType, string> = {
  disease: 'مرض',
  pest: 'آفة',
  weed: 'حشيشة',
};

// ===========================================================================
// Active matters — curated Algerian catalogue (v1)
//   Names: Algerian brands when known from the 2017 INPV index, otherwise the
//   active substance itself. `registeredAlgeria` = seen in the 2017 index.
// ===========================================================================
export const ALGERIAN_ACTIVE_MATTERS: ActiveMatter[] = [
  // ------------------------------------------------------------- INSECTICIDES
  { id: 'abamectine', name: 'Acrimactine 1,8 EC', activeSubstance: 'abamectine 18 g/L', type: 'insecticide', formulation: 'EC', crops: ['citrus', 'tomato', 'cucurbits'], targets: ['leafminer', 'mites', 'tuta', 'citrusleafminer'], resistanceCode: 'IRAC 6', modeOfAction: 'Macrolide — agoniste du glutamate (chlorures)', applicationRate: '0,5-0,75 L/ha', preHarvestInterval: '7 j', safetyLevel: 'medium', cost: 'medium', availability: 'common', restrictions: ['Interdit près des points d’eau (toxique poissons)', 'Max 2 applications'], alternatives: ['Spinosad (Tracer)', 'Emamectine (Proclaim)'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'acetamipride', name: 'Acetamiprid 200 SL (Jordan)', activeSubstance: 'acétamipride 200 g/L', type: 'insecticide', formulation: 'SL', crops: ['tomato', 'cucurbits', 'citrus', 'olive'], targets: ['aphids', 'whitefly', 'thrips', 'dubas'], resistanceCode: 'IRAC 4A', modeOfAction: 'Néonicotinoïde — agoniste des récepteurs nicotiniques', applicationRate: '0,3-0,5 L/ha', preHarvestInterval: '7 j', safetyLevel: 'medium', cost: 'medium', availability: 'common', restrictions: ['Risque pour les abeilles (éviter la floraison)', 'Max 2-3 applications'], alternatives: ['Lambda-cyhalothrine (Karate)', 'Spinosad'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'alpha-cypermethrine', name: 'Alphacyperméthrine 100 EC', activeSubstance: 'alpha-cyperméthrine 100 g/L', type: 'insecticide', formulation: 'EC', crops: ['wheat', 'barley', 'legumes', 'datepalm'], targets: ['locust', 'clb', 'hessefly', 'sitona'], resistanceCode: 'IRAC 3A', modeOfAction: 'Pyréthrinoïde — modulateur des canaux sodium', applicationRate: '0,15-0,3 L/ha', preHarvestInterval: '14 j', safetyLevel: 'medium', cost: 'low', availability: 'common', restrictions: ['Toxique abeilles et faune aquatique', 'Traitement ULV autorisé en lutte antiacridienne'], alternatives: ['Deltaméthrine (Decis)', 'Karate Zeon'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'bifenthrine', name: 'Bifenthrine 100 EC (Talstar)', activeSubstance: 'bifenthrine 100 g/L', type: 'insecticide', formulation: 'EC', crops: ['citrus', 'tomato', 'vine', 'strawberry'], targets: ['mites', 'aphids', 'whitefly', 'thrips'], resistanceCode: 'IRAC 3A', modeOfAction: 'Pyréthrinoïde — modulateur des canaux sodium', applicationRate: '0,4-0,8 L/ha', preHarvestInterval: '14 j', safetyLevel: 'high', cost: 'high', availability: 'moderate', restrictions: ['Très toxique pour les abeilles', 'Un seul traitement sur fruits'], alternatives: ['Abamectine', 'Pyridabène'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'chlorpyriphos-ethyl', name: 'Chlorpyriphos-éthyl 480 EC', activeSubstance: 'chlorpyriphos-éthyl 480 g/L', type: 'insecticide', formulation: 'EC', crops: ['potato', 'onion', 'maize', 'citrus', 'datepalm'], targets: ['wireworm', 'onionfly', 'blackscale', 'redweevil', 'termites', 'nematodes'], resistanceCode: 'IRAC 1B', modeOfAction: 'Organophosphoré — inhibiteur des cholinestérases', applicationRate: '1,5-3 L/ha', preHarvestInterval: '21 j', safetyLevel: 'high', cost: 'low', availability: 'common', restrictions: ['Toxique (classe II OMS) — port des EPI obligatoire', 'Interdit en Europe — usage réglementé en Algérie'], alternatives: ['Fipronil', 'Imidaclopride'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'cypermethrine', name: 'Cyperméthrine 200 EC', activeSubstance: 'cyperméthrine 200 g/L', type: 'insecticide', formulation: 'EC', crops: ['wheat', 'barley', 'legumes'], targets: ['clb', 'hessefly', 'aphids', 'locust'], resistanceCode: 'IRAC 3A', modeOfAction: 'Pyréthrinoïde — modulateur des canaux sodium', applicationRate: '0,2-0,4 L/ha', preHarvestInterval: '14 j', safetyLevel: 'medium', cost: 'low', availability: 'common', restrictions: ['Toxique abeilles', 'Éviter le ruissellement'], alternatives: ['Deltaméthrine', 'Lambda-cyhalothrine'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'deltamethrine', name: 'Decis 25 EC', activeSubstance: 'deltaméthrine 25 g/L', type: 'insecticide', formulation: 'EC', crops: ['olive', 'citrus', 'wheat', 'barley', 'vine', 'legumes', 'datepalm'], targets: ['medfly', 'olivefly', 'olivemoth', 'locust', 'clb', 'sitona', 'pyrale-dattes'], resistanceCode: 'IRAC 3A', modeOfAction: 'Pyréthrinoïde — modulateur des canaux sodium', applicationRate: '0,3-0,6 L/ha', preHarvestInterval: '7-14 j', safetyLevel: 'medium', cost: 'low', availability: 'common', restrictions: ['Toxique pour les abeilles — éviter la floraison', 'Appâts recommandés contre la mouche des fruits'], alternatives: ['Lambda-cyhalothrine (Karate)', 'Alpha-cyperméthrine'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'diflubenzuron', name: 'Diflubenzuron 250 WP (Dimilin)', activeSubstance: 'diflubenzuron 250 g/kg', type: 'insecticide', formulation: 'WP', crops: ['citrus', 'tomato', 'vine', 'olive'], targets: ['leafminer', 'citrusleafminer', 'olivemoth', 'pyrale-dattes'], resistanceCode: 'IRAC 15', modeOfAction: 'Régulateur de croissance — inhibiteur de la synthèse de chitine', applicationRate: '0,4-0,6 kg/ha', preHarvestInterval: '21 j', safetyLevel: 'low', cost: 'medium', availability: 'moderate', restrictions: ['Intervenir sur jeunes larves', 'Respectueux des auxiliaires adultes'], alternatives: ['Spinosad', 'Abamectine'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'dimethoate', name: 'Diméthoate 400 EC (Rogor)', activeSubstance: 'diméthoate 400 g/L', type: 'insecticide', formulation: 'EC', crops: ['citrus', 'olive', 'vine', 'legumes'], targets: ['aphids', 'blackscale', 'olivefly', 'medfly'], resistanceCode: 'IRAC 1B', modeOfAction: 'Organophosphoré systémique — inhibiteur des cholinestérases', applicationRate: '0,75-1,5 L/ha', preHarvestInterval: '21 j', safetyLevel: 'high', cost: 'low', availability: 'moderate', restrictions: ['Interdit en Europe (pomme de terre)', 'Toxicité élevée — EPI obligatoires', 'Délai avant récolte long'], alternatives: ['Acétamipride', 'Lambda-cyhalothrine'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'imidaclopride', name: 'Confidor 200 SL', activeSubstance: 'imidaclopride 200 g/L', type: 'insecticide', formulation: 'SL', crops: ['tomato', 'citrus', 'datepalm', 'potato'], targets: ['aphids', 'whitefly', 'dubas', 'redweevil'], resistanceCode: 'IRAC 4A', modeOfAction: 'Néonicotinoïde — agoniste des récepteurs nicotiniques', applicationRate: '0,4-0,6 L/ha', preHarvestInterval: '14 j', safetyLevel: 'medium', cost: 'low', availability: 'common', restrictions: ['Interdit en Europe (ruches) — vérifier la réglementation algérienne', 'Max 1-2 applications'], alternatives: ['Thiaméthoxame (Actara)', 'Acétamipride'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'thiamethoxame', name: 'Actara 25 WG', activeSubstance: 'thiaméthoxame 250 g/kg', type: 'insecticide', formulation: 'WG', crops: ['tomato', 'potato', 'cucurbits', 'citrus', 'datepalm'], targets: ['aphids', 'whitefly', 'thrips', 'doryphore', 'dubas'], resistanceCode: 'IRAC 4A', modeOfAction: 'Néonicotinoïde systémique — agoniste nicotinique', applicationRate: '0,2-0,4 kg/ha', preHarvestInterval: '14 j', safetyLevel: 'medium', cost: 'high', availability: 'common', restrictions: ['Risque abeilles', 'Max 2 applications par saison'], alternatives: ['Confidor', 'Acétamipride'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'lambda-cyhalothrine', name: 'Karate Zeon 5 EC', activeSubstance: 'lambda-cyhalothrine 50 g/L', type: 'insecticide', formulation: 'EC (capsule)', crops: ['wheat', 'barley', 'potato', 'tomato', 'olive', 'vine', 'legumes', 'maize'], targets: ['aphids', 'spodoptera', 'helicoverpa', 'doryphore', 'locust', 'clb', 'sitona', 'thrips'], resistanceCode: 'IRAC 3A', modeOfAction: 'Pyréthrinoïde encapsulé — modulateur des canaux sodium', applicationRate: '0,15-0,25 L/ha', preHarvestInterval: '7-14 j', safetyLevel: 'medium', cost: 'medium', availability: 'common', restrictions: ['Toxique abeilles — éviter la floraison', 'Max 2 applications'], alternatives: ['Decis', 'Alpha-cyperméthrine'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'indoxacarbe', name: 'Indoxacarbe 150 SC (Avaunt)', activeSubstance: 'indoxacarbe 150 g/L', type: 'insecticide', formulation: 'SC', crops: ['tomato', 'pepper'], targets: ['tuta', 'helicoverpa', 'spodoptera'], resistanceCode: 'IRAC 22A', modeOfAction: 'Oxadiazine — bloqueur des canaux sodium (ingestion)', applicationRate: '0,25-0,4 L/ha', preHarvestInterval: '7 j', safetyLevel: 'medium', cost: 'high', availability: 'moderate', restrictions: ['Appliquer sur jeunes chenilles', 'Max 2-3 applications'], alternatives: ['Emamectine (Proclaim)', 'Spinosad'], registeredAlgeria: false, source: 'ephy' },
  { id: 'spinosad', name: 'Tracer 480 SC', activeSubstance: 'spinosad 480 g/L', type: 'insecticide', formulation: 'SC', crops: ['tomato', 'onion', 'citrus', 'datepalm', 'strawberry'], targets: ['tuta', 'spodoptera', 'thrips', 'leafminer', 'codlingmoth', 'pyrale-dattes'], resistanceCode: 'IRAC 5', modeOfAction: 'Spinosynes — modulateur des récepteurs nicotiniques', applicationRate: '0,2-0,4 L/ha', preHarvestInterval: '7 j', safetyLevel: 'low', cost: 'high', availability: 'moderate', restrictions: ['Toxique abeilles par contact direct', 'Max 4 applications'], alternatives: ['Emamectine', 'Chlorantraniliprole'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'emamectine', name: 'Proclaim 5 SG', activeSubstance: 'émamectine benzoate 50 g/kg', type: 'insecticide', formulation: 'SG', crops: ['tomato', 'potato', 'pepper'], targets: ['tuta', 'spodoptera', 'helicoverpa'], resistanceCode: 'IRAC 6', modeOfAction: 'Avermectine — activation des canaux chlorures', applicationRate: '0,5-1 kg/ha', preHarvestInterval: '7 j', safetyLevel: 'medium', cost: 'high', availability: 'moderate', restrictions: ['Toxique pour les abeilles', 'Max 3 applications'], alternatives: ['Spinosad', 'Indoxacarbe'], registeredAlgeria: false, source: 'ephy' },
  { id: 'chlorantraniliprole', name: 'Coragen 20 SC', activeSubstance: 'chlorantraniliprole 200 g/L', type: 'insecticide', formulation: 'SC', crops: ['tomato', 'potato', 'apple', 'vine'], targets: ['tuta', 'spodoptera', 'helicoverpa', 'doryphore', 'codlingmoth'], resistanceCode: 'IRAC 28', modeOfAction: 'Diamide anthranilique — modulateur des récepteurs de la ryanodine', applicationRate: '0,15-0,3 L/ha', preHarvestInterval: '7 j', safetyLevel: 'low', cost: 'high', availability: 'moderate', restrictions: ['Max 2 applications', 'Très sélectif — préserve les auxiliaires'], alternatives: ['Emamectine', 'Spinosad'], registeredAlgeria: false, source: 'ephy' },
  { id: 'methomyl', name: 'Méthomyl 200 SL (Lannate)', activeSubstance: 'méthomyl 200 g/L', type: 'insecticide', formulation: 'SL', crops: ['tomato', 'pepper', 'legumes'], targets: ['spodoptera', 'helicoverpa', 'aphids'], resistanceCode: 'IRAC 1A', modeOfAction: 'Carbamate — inhibiteur des cholinestérases', applicationRate: '0,5-1 L/ha', preHarvestInterval: '14 j', safetyLevel: 'high', cost: 'low', availability: 'moderate', restrictions: ['Très toxique — usage professionnel strict', 'Interdit sur de nombreuses cultures en Europe'], alternatives: ['Emamectine', 'Spinosad'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'fipronil', name: 'Fipronil 200 SC (Regent)', activeSubstance: 'fipronil 200 g/L', type: 'insecticide', formulation: 'SC', crops: ['maize', 'sugarbeet', 'datepalm'], targets: ['wireworm', 'termites', 'redweevil'], resistanceCode: 'IRAC 2B', modeOfAction: 'Fénylpyrazole — antagoniste des récepteurs GABA', applicationRate: '0,15-0,3 L/ha', preHarvestInterval: '30 j', safetyLevel: 'high', cost: 'medium', availability: 'moderate', restrictions: ['Très toxique pour les abeilles — traitement de sol surtout', 'Interdit en Europe en plein champ'], alternatives: ['Chlorpyriphos-éthyl', 'Imidaclopride'], registeredAlgeria: true, source: 'inpv-2017' },

  // ------------------------------------------------------- BIO-INSECTICIDES
  { id: 'bt', name: 'Bacillus thuringiensis (BT)', activeSubstance: 'Bacillus thuringiensis var. kurstaki', type: 'bio-insecticide', formulation: 'WP/SC', crops: ['tomato', 'cucurbits', 'vine', 'datepalm', 'legumes'], targets: ['tuta', 'spodoptera', 'helicoverpa', 'pyrale-dattes'], resistanceCode: 'IRAC 11', modeOfAction: 'Toxines cristallines — larvicide par ingestion', applicationRate: '0,5-1 kg/ha', preHarvestInterval: '0 j', safetyLevel: 'low', cost: 'medium', availability: 'moderate', restrictions: ['Agir sur jeunes larves (L1-L2)', 'Éviter l’UV fort — traitement en fin de journée'], alternatives: ['Spinosad', 'Neem'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'metarhizium', name: 'Metarhizium anisopliae (Green Muscle)', activeSubstance: 'Metarhizium anisopliae var. acridum', type: 'bio-insecticide', formulation: 'ULV/GR', crops: ['wheat', 'barley', 'maize', 'datepalm'], targets: ['locust'], resistanceCode: 'n/a', modeOfAction: 'Champignon entomopathogène', applicationRate: '100-200 g/ha (ULV)', preHarvestInterval: '0 j', safetyLevel: 'low', cost: 'high', availability: 'rare', restrictions: ['Utilisé en lutte biologique antiacridienne', 'Efficace sur jeunes larves de criquets'], alternatives: ['Deltaméthrine', 'Alpha-cyperméthrine'], registeredAlgeria: false, source: 'expert' },
  { id: 'beauveria', name: 'Beauveria bassiana', activeSubstance: 'Beauveria bassiana (souche)', type: 'bio-insecticide', formulation: 'WP', crops: ['tomato', 'cucurbits', 'pepper'], targets: ['whitefly', 'thrips', 'aphids'], resistanceCode: 'n/a', modeOfAction: 'Champignon entomopathogène', applicationRate: '0,5-1 kg/ha', preHarvestInterval: '0 j', safetyLevel: 'low', cost: 'high', availability: 'rare', restrictions: ['Conditions fraîches et humides', 'Compatibilité avec les fongicides à vérifier'], alternatives: ['Spinosad', 'Neem'], registeredAlgeria: false, source: 'expert' },
  { id: 'azadirachtine', name: 'Neem / azadirachtine', activeSubstance: 'azadirachtine 10 g/L', type: 'bio-insecticide', formulation: 'EC', crops: ['tomato', 'cucurbits', 'citrus', 'olive', 'strawberry'], targets: ['aphids', 'whitefly', 'thrips', 'mites'], resistanceCode: 'IRAC 18', modeOfAction: 'Régulateur de croissance — antiappétant', applicationRate: '1-2 L/ha', preHarvestInterval: '3 j', safetyLevel: 'low', cost: 'medium', availability: 'moderate', restrictions: ['Action lente — intervenir précocement', 'Réappliquer après la pluie'], alternatives: ['Spinosad', 'Acétamipride'], registeredAlgeria: false, source: 'expert' },

  // --------------------------------------------------------------- ACARICIDES
  { id: 'pyridabene', name: 'Pyridabène 20 WP', activeSubstance: 'pyridabène 200 g/kg', type: 'acaricide', formulation: 'WP', crops: ['citrus', 'tomato', 'apple'], targets: ['mites'], resistanceCode: 'IRAC 21A', modeOfAction: 'Pyridazinone — inhibition de la chaîne respiratoire', applicationRate: '0,3-0,5 kg/ha', preHarvestInterval: '14 j', safetyLevel: 'medium', cost: 'medium', availability: 'moderate', restrictions: ['Appliquer sur les deux faces des feuilles', 'Max 1-2 applications'], alternatives: ['Fenpyroximate', 'Abamectine'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'fenpyroximate', name: 'Fenpyroximate 5 SC', activeSubstance: 'fenpyroximate 50 g/L', type: 'acaricide', formulation: 'SC', crops: ['citrus', 'vine', 'apple'], targets: ['mites'], resistanceCode: 'IRAC 21A', modeOfAction: 'Inhibiteur du complexe I mitochondrial', applicationRate: '0,3-0,6 L/ha', preHarvestInterval: '14 j', safetyLevel: 'medium', cost: 'high', availability: 'rare', restrictions: ['Traiter par temps doux (< 28 °C)', 'Alterner avec des acaricides à autre mode d’action'], alternatives: ['Pyridabène', 'Hexythiazox'], registeredAlgeria: false, source: 'ephy' },
  { id: 'hexythiazox', name: 'Hexythiazox 10 WP (Nissorun)', activeSubstance: 'hexythiazox 100 g/kg', type: 'acaricide', formulation: 'WP', crops: ['citrus', 'vine', 'apple', 'strawberry'], targets: ['mites'], resistanceCode: 'IRAC 10A', modeOfAction: 'Régulateur de croissance — ovicide/larvicide', applicationRate: '0,3-0,5 kg/ha', preHarvestInterval: '14 j', safetyLevel: 'low', cost: 'medium', availability: 'moderate', restrictions: ['Agir sur œufs et jeunes larves', 'Peu efficace sur adultes'], alternatives: ['Pyridabène', 'Fenpyroximate'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'fenbutatin', name: 'Fenbutatin oxyde 550 SC', activeSubstance: 'fenbutatin oxyde 550 g/L', type: 'acaricide', formulation: 'SC', crops: ['citrus', 'apple', 'vine'], targets: ['mites'], resistanceCode: 'IRAC 12B', modeOfAction: 'Organo-étain — inhibition de la phosphorylation oxydative', applicationRate: '0,5-1 L/ha', preHarvestInterval: '21 j', safetyLevel: 'medium', cost: 'medium', availability: 'rare', restrictions: ['N’utiliser qu’en cas de forte pression', 'Long DAR'], alternatives: ['Abamectine', 'Pyridabène'], registeredAlgeria: true, source: 'inpv-2017' },

  // -------------------------------------------------------------- FONGICIDES
  { id: 'thiophanate-methyl', name: 'Thiophanate-méthyl 500 SC', activeSubstance: 'thiophanate-méthyl 500 g/L', type: 'fungicide', formulation: 'SC', crops: ['stonefruit', 'apple', 'legumes', 'datepalm'], targets: ['monilia', 'gray-mold', 'scab-apple', 'chocolate-spot', 'bayoud'], resistanceCode: 'FRAC 1', modeOfAction: 'Benzimidazole — inhibition de la tubuline', applicationRate: '0,5-1 L/ha', preHarvestInterval: '21 j', safetyLevel: 'medium', cost: 'low', availability: 'common', restrictions: ['Risque de résistance élevé — max 1-2 applications', 'Bayoud : désinfection des outils et du sol surtout'], alternatives: ['Iprodione', 'Captan'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'mancozebe', name: 'Dithane M-45 80 WP', activeSubstance: 'mancozèbe 800 g/kg', type: 'fungicide', formulation: 'WP', crops: ['potato', 'tomato', 'vine', 'onion', 'wheat', 'legumes', 'sugarbeet', 'apple'], targets: ['mildew-potato', 'mildew-vine', 'mildew-onion', 'mildew-cucurbits', 'alternaria', 'septoria', 'anthracnose-legumes', 'cercospora-beet', 'scab-apple', 'peacock', 'rust-onion'], resistanceCode: 'FRAC M3', modeOfAction: 'Dithiocarbamate multisite — protecteur de contact', applicationRate: '1,5-2,5 kg/ha', preHarvestInterval: '7-21 j', safetyLevel: 'medium', cost: 'low', availability: 'common', restrictions: ['Traitement préventif exclusivement', 'Renouveler après pluie (> 20 mm)'], alternatives: ['Chlorothalonil', 'Cuivre'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'chlorothalonil', name: 'Chlorothalonil 720 SC', activeSubstance: 'chlorothalonil 720 g/L', type: 'fungicide', formulation: 'SC', crops: ['wheat', 'potato', 'tomato', 'legumes'], targets: ['septoria', 'alternaria', 'anthracnose-legumes'], resistanceCode: 'FRAC M5', modeOfAction: 'Chloronitrile multisite — protecteur', applicationRate: '1,5-2 L/ha', preHarvestInterval: '14-21 j', safetyLevel: 'medium', cost: 'low', availability: 'common', restrictions: ['Interdit en Europe depuis 2020 — vérifier l’homologation INPV', 'Préventif uniquement'], alternatives: ['Mancozèbe', 'Azoxystrobine'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'cuivre', name: 'Bouillie bordelaise / oxychlorure de cuivre', activeSubstance: 'cuivre (sulfate/oxychlorure)', type: 'fungicide', formulation: 'WP', crops: ['vine', 'potato', 'tomato', 'olive', 'citrus', 'onion', 'apple', 'cucurbits'], targets: ['mildew-vine', 'mildew-potato', 'mildew-onion', 'mildew-cucurbits', 'peacock', 'gummosis-citrus', 'alternaria', 'powdery-olive'], resistanceCode: 'FRAC M1', modeOfAction: 'Multisite — protecteur de contact', applicationRate: '2-3 kg/ha (1,5 kg Cu métal max)', preHarvestInterval: '7-21 j', safetyLevel: 'low', cost: 'low', availability: 'common', restrictions: ['Utilisable en agriculture biologique (avec limites)', 'Éviter l’accumulation dans le sol'], alternatives: ['Mancozèbe', 'Métalaxyl-M'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'soufre', name: 'Soufre mouillable 80 WG', activeSubstance: 'soufre 800 g/kg', type: 'fungicide', formulation: 'WG', crops: ['vine', 'cucurbits', 'wheat', 'barley', 'olive', 'strawberry'], targets: ['powdery-vine', 'powdery-cucurbits', 'powdery-cereals', 'powdery-olive', 'mites'], resistanceCode: 'FRAC M2', modeOfAction: 'Multisite — protecteur de contact', applicationRate: '2-4 kg/ha', preHarvestInterval: '1-7 j', safetyLevel: 'low', cost: 'low', availability: 'common', restrictions: ['Ne pas appliquer au-dessus de 30 °C (phytotoxicité)', 'Autorisé en agriculture biologique'], alternatives: ['Penconazole', 'Difenoconazole'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'difenoconazole', name: 'Score 250 EC', activeSubstance: 'difénoconazole 250 g/L', type: 'fungicide', formulation: 'EC', crops: ['vine', 'apple', 'onion', 'sugarbeet', 'stonefruit'], targets: ['powdery-vine', 'powdery-cucurbits', 'rust-onion', 'scab-apple', 'cercospora-beet', 'peacock'], resistanceCode: 'FRAC 3', modeOfAction: 'Triazole (DMI) — inhibition de la biosynthèse des stérols', applicationRate: '0,3-0,5 L/ha', preHarvestInterval: '14-35 j', safetyLevel: 'medium', cost: 'medium', availability: 'common', restrictions: ['Max 3 applications', 'Alterner avec des multisites'], alternatives: ['Tébuconazole', 'Penconazole'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'propiconazole', name: 'Propiconazole 250 EC (Tilt)', activeSubstance: 'propiconazole 250 g/L', type: 'fungicide', formulation: 'EC', crops: ['wheat', 'barley', 'maize', 'vine'], targets: ['rust-wheat', 'septoria', 'powdery-cereals', 'fusarium-head'], resistanceCode: 'FRAC 3', modeOfAction: 'Triazole (DMI)', applicationRate: '0,4-0,8 L/ha', preHarvestInterval: '35 j', safetyLevel: 'medium', cost: 'low', availability: 'common', restrictions: ['Long DAR sur céréales', 'Alterner les familles'], alternatives: ['Tébuconazole', 'Cyproconazole'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'tebuconazole', name: 'Folicur 250 EW', activeSubstance: 'tébuconazole 250 g/L', type: 'fungicide', formulation: 'EW', crops: ['wheat', 'barley', 'potato', 'vine', 'sugarbeet'], targets: ['rust-wheat', 'septoria', 'powdery-cereals', 'fusarium-head', 'eyespot', 'rust-onion'], resistanceCode: 'FRAC 3', modeOfAction: 'Triazole (DMI)', applicationRate: '0,5-1 L/ha', preHarvestInterval: '35 j', safetyLevel: 'medium', cost: 'low', availability: 'common', restrictions: ['Max 2 applications sur céréales', 'Bien positionner sur la floraison pour la fusariose'], alternatives: ['Propiconazole', 'Cyproconazole'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'flutriafol', name: 'Flutriafol 200 EC', activeSubstance: 'flutriafol 200 g/L', type: 'fungicide', formulation: 'EC', crops: ['wheat', 'barley'], targets: ['rust-wheat', 'septoria'], resistanceCode: 'FRAC 3', modeOfAction: 'Triazole (DMI)', applicationRate: '0,5-1 L/ha', preHarvestInterval: '35 j', safetyLevel: 'medium', cost: 'medium', availability: 'moderate', restrictions: ['Réservé aux céréales', 'Max 2 applications'], alternatives: ['Propiconazole', 'Tébuconazole'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'cyproconazole', name: 'Cyproconazole 100 EC', activeSubstance: 'cyproconazole 100 g/L', type: 'fungicide', formulation: 'EC', crops: ['wheat', 'barley'], targets: ['septoria', 'rust-wheat', 'eyespot', 'fusarium-head'], resistanceCode: 'FRAC 3', modeOfAction: 'Triazole (DMI)', applicationRate: '0,3-0,5 L/ha', preHarvestInterval: '35 j', safetyLevel: 'medium', cost: 'medium', availability: 'moderate', restrictions: ['Dose faible — à associer à un multisite', 'Max 2 applications'], alternatives: ['Tébuconazole', 'Propiconazole'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'azoxystrobine', name: 'Amistar 25 SC', activeSubstance: 'azoxystrobine 250 g/L', type: 'fungicide', formulation: 'SC', crops: ['wheat', 'barley', 'potato', 'tomato', 'vine', 'cucurbits', 'legumes', 'sugarbeet'], targets: ['septoria', 'rust-wheat', 'powdery-cereals', 'mildew-potato', 'alternaria', 'powdery-cucurbits', 'anthracnose-legumes', 'cercospora-beet'], resistanceCode: 'FRAC 11', modeOfAction: 'Strobilurine — inhibition du complexe III mitochondrial', applicationRate: '0,5-1 L/ha', preHarvestInterval: '7-35 j', safetyLevel: 'low', cost: 'high', availability: 'common', restrictions: ['Risque de résistance élevé — max 2 applications', 'Toujours associer à un multisite'], alternatives: ['Propiconazole', 'Tébuconazole'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'trifloxystrobine', name: 'Trifloxystrobine 500 WG (Flint)', activeSubstance: 'trifloxystrobine 500 g/kg', type: 'fungicide', formulation: 'WG', crops: ['vine', 'apple', 'cucurbits'], targets: ['powdery-vine', 'scab-apple', 'powdery-cucurbits'], resistanceCode: 'FRAC 11', modeOfAction: 'Strobilurine (complexe III)', applicationRate: '0,15-0,25 kg/ha', preHarvestInterval: '35 j', safetyLevel: 'low', cost: 'high', availability: 'rare', restrictions: ['Max 2 applications', 'Alterner avec triazoles'], alternatives: ['Krésoxim-méthyl', 'Difenoconazole'], registeredAlgeria: false, source: 'ephy' },
  { id: 'pyraclostrobine', name: 'Pyraclostrobine 250 EC (Comet)', activeSubstance: 'pyraclostrobine 250 g/L', type: 'fungicide', formulation: 'EC', crops: ['wheat', 'potato', 'vine'], targets: ['septoria', 'rust-wheat', 'powdery-vine'], resistanceCode: 'FRAC 11', modeOfAction: 'Strobilurine (complexe III)', applicationRate: '0,4-0,8 L/ha', preHarvestInterval: '35 j', safetyLevel: 'low', cost: 'high', availability: 'rare', restrictions: ['Max 2 applications', 'Associer à un multisite'], alternatives: ['Azoxystrobine', 'Tébuconazole'], registeredAlgeria: false, source: 'ephy' },
  { id: 'kresoxim-methyl', name: 'Krésoxim-méthyl 500 WG (Stroby)', activeSubstance: 'krésoxim-méthyl 500 g/kg', type: 'fungicide', formulation: 'WG', crops: ['cucurbits', 'vine', 'apple'], targets: ['powdery-cucurbits', 'powdery-vine', 'scab-apple'], resistanceCode: 'FRAC 11', modeOfAction: 'Strobilurine (complexe III)', applicationRate: '0,15-0,3 kg/ha', preHarvestInterval: '14-35 j', safetyLevel: 'low', cost: 'high', availability: 'rare', restrictions: ['Max 2 applications', 'Alterner avec triazoles'], alternatives: ['Azoxystrobine', 'Difenoconazole'], registeredAlgeria: false, source: 'ephy' },
  { id: 'fosetyl-aluminium', name: 'Fosétyl-Al 800 WP (Aliette)', activeSubstance: 'fosétyl-aluminium 800 g/kg', type: 'fungicide', formulation: 'WP', crops: ['vine', 'citrus', 'cucurbits'], targets: ['mildew-vine', 'gummosis-citrus', 'mildew-cucurbits'], resistanceCode: 'FRAC 33', modeOfAction: 'Phosphonate systémique — stimule les défenses', applicationRate: '2-3 kg/ha', preHarvestInterval: '21-60 j', safetyLevel: 'low', cost: 'medium', availability: 'moderate', restrictions: ['Long DAR sur agrumes', 'Utiliser en préventif ou curatif précoce'], alternatives: ['Métalaxyl-M', 'Cuivre'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'metalaxyl-m', name: 'Ridomil Gold (métalaxyl-M + mancozèbe)', activeSubstance: 'métalaxyl-M 40 g/kg + mancozèbe 640 g/kg', type: 'fungicide', formulation: 'WG', crops: ['potato', 'tomato', 'vine', 'onion', 'cucurbits'], targets: ['mildew-potato', 'mildew-vine', 'mildew-onion', 'mildew-cucurbits', 'gummosis-citrus'], resistanceCode: 'FRAC 4 + M3', modeOfAction: 'Acylalanine systémique + dithiocarbamate multisite', applicationRate: '2-2,5 kg/ha', preHarvestInterval: '14-21 j', safetyLevel: 'medium', cost: 'medium', availability: 'common', restrictions: ['Max 3-4 applications', 'Alterner avec d’autres familles anti-mildiou'], alternatives: ['Cymoxanil + mancozèbe', 'Cuivre'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'cymoxanil', name: 'Cymoxanil + mancozèbe (Curzate)', activeSubstance: 'cymoxanil 450 g/kg + mancozèbe', type: 'fungicide', formulation: 'WG', crops: ['potato', 'tomato', 'vine'], targets: ['mildew-potato', 'mildew-vine', 'mildew-onion', 'mildew-cucurbits'], resistanceCode: 'FRAC 27 + M3', modeOfAction: 'Cymoxanil (translaminaire) + dithiocarbamate multisite', applicationRate: '1,5-2 kg/ha', preHarvestInterval: '7-14 j', safetyLevel: 'medium', cost: 'medium', availability: 'moderate', restrictions: ['Max 4 applications', 'Curatif précoce (48-72 h après infection)'], alternatives: ['Ridomil Gold', 'Cuivre'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'myclobutanil', name: 'Myclobutanil 240 EC (Systhane)', activeSubstance: 'myclobutanil 240 g/L', type: 'fungicide', formulation: 'EC', crops: ['vine', 'apple', 'cucurbits'], targets: ['powdery-vine', 'scab-apple', 'powdery-cucurbits'], resistanceCode: 'FRAC 3', modeOfAction: 'Triazole (DMI)', applicationRate: '0,3-0,4 L/ha', preHarvestInterval: '14-35 j', safetyLevel: 'low', cost: 'medium', availability: 'moderate', restrictions: ['Max 3 applications', 'Alterner avec le soufre'], alternatives: ['Penconazole', 'Soufre'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'penconazole', name: 'Penconazole 100 EC (Topas)', activeSubstance: 'penconazole 100 g/L', type: 'fungicide', formulation: 'EC', crops: ['vine', 'cucurbits'], targets: ['powdery-vine', 'powdery-cucurbits'], resistanceCode: 'FRAC 3', modeOfAction: 'Triazole (DMI)', applicationRate: '0,2-0,4 L/ha', preHarvestInterval: '21-35 j', safetyLevel: 'low', cost: 'medium', availability: 'moderate', restrictions: ['Spécialisé oïdium', 'Max 3 applications'], alternatives: ['Soufre', 'Myclobutanil'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'iprodione', name: 'Iprodione 500 SC (Rovral)', activeSubstance: 'iprodione 500 g/L', type: 'fungicide', formulation: 'SC', crops: ['vine', 'tomato', 'stonefruit', 'legumes'], targets: ['gray-mold', 'chocolate-spot', 'monilia', 'alternaria'], resistanceCode: 'FRAC 2', modeOfAction: 'Dicarboximide — inhibiteur de la MAP kinase', applicationRate: '0,5-1 L/ha', preHarvestInterval: '14-21 j', safetyLevel: 'medium', cost: 'medium', availability: 'moderate', restrictions: ['Interdit en Europe depuis 2018 — vérifier l’homologation INPV', 'Max 2 applications'], alternatives: ['Thiophanate-méthyl', 'Carbendazime'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'carbendazime', name: 'Carbendazime 500 SC', activeSubstance: 'carbendazime 500 g/L', type: 'fungicide', formulation: 'SC', crops: ['wheat', 'barley', 'stonefruit', 'legumes'], targets: ['gray-mold', 'monilia', 'chocolate-spot'], resistanceCode: 'FRAC 1', modeOfAction: 'Benzimidazole — inhibition de la tubuline', applicationRate: '0,5-1 L/ha', preHarvestInterval: '21 j', safetyLevel: 'high', cost: 'low', availability: 'moderate', restrictions: ['Interdit en Europe — usage réglementé en Algérie', 'Risque de résistance très élevé'], alternatives: ['Thiophanate-méthyl', 'Iprodione'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'captan', name: 'Captan 80 WG', activeSubstance: 'captan 800 g/kg', type: 'fungicide', formulation: 'WG', crops: ['apple', 'stonefruit', 'strawberry'], targets: ['scab-apple', 'monilia', 'gray-mold'], resistanceCode: 'FRAC M4', modeOfAction: 'Phtalimide multisite — protecteur', applicationRate: '1,5-2 kg/ha', preHarvestInterval: '14 j', safetyLevel: 'low', cost: 'medium', availability: 'moderate', restrictions: ['Préventif — renouveler après pluie', 'Peu efficace en curatif'], alternatives: ['Dithane (mancozèbe)', 'Difenoconazole'], registeredAlgeria: true, source: 'inpv-2017' },

  // ---------------------------------------------------------------- HERBICIDES
  { id: 'glyphosate', name: 'Roundup 360 SL', activeSubstance: 'glyphosate 360 g/L', type: 'herbicide', formulation: 'SL', crops: ['wheat', 'barley', 'vine', 'citrus', 'olive', 'potato', 'tomato', 'datepalm'], targets: ['perennial-grasses', 'orobanche'], resistanceCode: 'HRAC 9 (G)', modeOfAction: 'Inhibiteur de l’EPSPS — systémique foliaire total', applicationRate: '3-6 L/ha', preHarvestInterval: '—', safetyLevel: 'medium', cost: 'low', availability: 'common', restrictions: ['Désherbage total — hors culture ou en localisé', 'Éviter toute dérive sur cultures sensibles', 'N’est pas un herbicide de culture'], alternatives: ['Glufosinate', '2,4-D'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'glufosinate', name: 'Glufosinate-ammonium 200 SL (Basta)', activeSubstance: 'glufosinate-ammonium 200 g/L', type: 'herbicide', formulation: 'SL', crops: ['vine', 'citrus', 'potato'], targets: ['perennial-grasses'], resistanceCode: 'HRAC 10 (H)', modeOfAction: 'Inhibiteur de la glutamine synthétase — de contact', applicationRate: '3-5 L/ha', preHarvestInterval: '—', safetyLevel: 'medium', cost: 'medium', availability: 'moderate', restrictions: ['Action de contact — bien mouiller le feuillage', 'Interdit en Europe en plein champ'], alternatives: ['Glyphosate', 'Paraquat'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'paraquat', name: 'Paraquat 200 SL (Gramoxone)', activeSubstance: 'paraquat 200 g/L', type: 'herbicide', formulation: 'SL', crops: ['vine', 'citrus', 'potato'], targets: ['perennial-grasses'], resistanceCode: 'HRAC 22 (D)', modeOfAction: 'Bipyridyle — inhibiteur du photosystème I (défanant)', applicationRate: '2-4 L/ha', preHarvestInterval: '—', safetyLevel: 'high', cost: 'low', availability: 'moderate', restrictions: ['Très toxique — interdit en Europe', 'Usage professionnel strict, port des EPI obligatoire'], alternatives: ['Glyphosate', 'Glufosinate'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: '2,4-d', name: '2,4-D 500 SL', activeSubstance: '2,4-D 500 g/L (ester)', type: 'herbicide', formulation: 'SL', crops: ['wheat', 'barley', 'maize'], targets: ['broadleaf-cereals'], resistanceCode: 'HRAC 4 (O)', modeOfAction: 'Auxine de synthèse — hormone herbicide', applicationRate: '0,5-1,5 L/ha', preHarvestInterval: '—', safetyLevel: 'medium', cost: 'low', availability: 'common', restrictions: ['Dérive très dangereuse sur vigne, tomate, légumineuses', 'Éviter les températures > 25 °C'], alternatives: ['MCPA', 'Metsulfuron-méthyl'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'mcpa', name: 'MCPA 750 SL', activeSubstance: 'MCPA 750 g/L', type: 'herbicide', formulation: 'SL', crops: ['wheat', 'barley'], targets: ['broadleaf-cereals'], resistanceCode: 'HRAC 4 (O)', modeOfAction: 'Auxine de synthèse', applicationRate: '1-1,5 L/ha', preHarvestInterval: '—', safetyLevel: 'medium', cost: 'low', availability: 'common', restrictions: ['Risque de dérive', 'Stade tallage-début montaison'], alternatives: ['2,4-D', 'Fluroxypyr'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'metsulfuron-methyl', name: 'Metsulfuron-méthyl 20 WG', activeSubstance: 'metsulfuron-méthyl 200 g/kg', type: 'herbicide', formulation: 'WG', crops: ['wheat', 'barley'], targets: ['broadleaf-cereals'], resistanceCode: 'HRAC 2 (B)', modeOfAction: 'ALS inhibitor (sulfonylurée) — systémique', applicationRate: '30-50 g/ha', preHarvestInterval: '—', safetyLevel: 'low', cost: 'low', availability: 'common', restrictions: ['Doses très faibles — soigner l’étalonnage', 'Résidus actifs dans le sol (rotation à respecter)'], alternatives: ['2,4-D', 'MCPA'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'sulfosulfuron', name: 'Monitor 75 WG', activeSubstance: 'sulfosulfuron 750 g/kg', type: 'herbicide', formulation: 'WG', crops: ['wheat'], targets: ['ryegrass', 'wild-oat', 'bromegrass'], resistanceCode: 'HRAC 2 (B)', modeOfAction: 'ALS inhibitor (sulfonylurée) anti-graminées', applicationRate: '30-40 g/ha', preHarvestInterval: '—', safetyLevel: 'low', cost: 'medium', availability: 'common', restrictions: ['Blé dur uniquement — l’orge est très sensible', 'Stade tallage'], alternatives: ['Clodinafop (Topik)', 'Fenoxaprop-P'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'nicosulfuron', name: 'Nicosulfuron 40 SC (Milagro)', activeSubstance: 'nicosulfuron 40 g/L', type: 'herbicide', formulation: 'SC', crops: ['maize'], targets: ['annual-grasses-maize', 'broadleaf-veg'], resistanceCode: 'HRAC 2 (B)', modeOfAction: 'ALS inhibitor (sulfonylurée) post-levée', applicationRate: '1-1,5 L/ha', preHarvestInterval: '—', safetyLevel: 'low', cost: 'medium', availability: 'common', restrictions: ['Maïs uniquement — stade 3-6 feuilles', 'Ne pas utiliser en pré-levée'], alternatives: ['Atrazine', 'S-métolachlore'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'atrazine', name: 'Atrazine 500 SC', activeSubstance: 'atrazine 500 g/L', type: 'herbicide', formulation: 'SC', crops: ['maize'], targets: ['annual-grasses-maize', 'broadleaf-veg'], resistanceCode: 'HRAC 5 (C1)', modeOfAction: 'Triazine — inhibiteur du photosystème II (pré-levée)', applicationRate: '1-1,5 L/ha', preHarvestInterval: '—', safetyLevel: 'medium', cost: 'low', availability: 'common', restrictions: ['Interdite en Europe — vérifier la réglementation algérienne en vigueur', 'Risque de lessivage — ne pas utiliser en zone karstique'], alternatives: ['Nicosulfuron', 'S-métolachlore'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'pendimethaline', name: 'Stomp 330 EC', activeSubstance: 'pendiméthaline 330 g/L', type: 'herbicide', formulation: 'EC', crops: ['wheat', 'barley', 'onion', 'tomato', 'legumes', 'vine'], targets: ['ryegrass', 'broadleaf-veg', 'wild-oat'], resistanceCode: 'HRAC 3 (K1)', modeOfAction: 'Dinitroaniline — inhibiteur de la division cellulaire (pré-levée)', applicationRate: '3-5 L/ha', preHarvestInterval: '—', safetyLevel: 'medium', cost: 'low', availability: 'common', restrictions: ['Incorporation ou irrigation après application', 'Pré-levée uniquement'], alternatives: ['Trifluraline', 'S-métolachlore'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'trifluraline', name: 'Trifluraline 480 EC (Treflan)', activeSubstance: 'trifluraline 480 g/L', type: 'herbicide', formulation: 'EC', crops: ['legumes', 'sunflower', 'tomato'], targets: ['broadleaf-veg', 'annual-grasses-maize'], resistanceCode: 'HRAC 3 (K1)', modeOfAction: 'Dinitroaniline — anti-germination (pré-semis incorporé)', applicationRate: '1,2-2,4 L/ha', preHarvestInterval: '—', safetyLevel: 'medium', cost: 'low', availability: 'moderate', restrictions: ['Incorporation dans les 24 h', 'Interdite en Europe — vérifier l’homologation INPV'], alternatives: ['Pendiméthaline', 'Oxyfluorfène'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 's-metolachlore', name: 'Dual Gold 960 EC', activeSubstance: 'S-métolachlore 960 g/L', type: 'herbicide', formulation: 'EC', crops: ['maize', 'potato', 'sugarbeet', 'sunflower'], targets: ['annual-grasses-maize', 'broadleaf-veg'], resistanceCode: 'HRAC 15 (K3)', modeOfAction: 'Chloroacétamide — inhibition de la synthèse des lipides (pré-levée)', applicationRate: '1-1,5 L/ha', preHarvestInterval: '—', safetyLevel: 'medium', cost: 'medium', availability: 'common', restrictions: ['Pré-levée ou post-levée précoce', 'Risque de lessivage'], alternatives: ['Acétochlore', 'Pendiméthaline'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'acetochlore', name: 'Acétochlore 900 EC', activeSubstance: 'acétochlore 900 g/L', type: 'herbicide', formulation: 'EC', crops: ['maize', 'sugarbeet'], targets: ['annual-grasses-maize', 'broadleaf-veg'], resistanceCode: 'HRAC 15 (K3)', modeOfAction: 'Chloroacétamide — pré-levée', applicationRate: '1,5-2 L/ha', preHarvestInterval: '—', safetyLevel: 'medium', cost: 'medium', availability: 'moderate', restrictions: ['Interdit en Europe — vérifier l’homologation INPV', 'Pré-levée uniquement'], alternatives: ['S-métolachlore', 'Atrazine'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'clodinafop', name: 'Topik 240 EC', activeSubstance: 'clodinafop-propargyl 240 g/L', type: 'herbicide', formulation: 'EC', crops: ['wheat'], targets: ['wild-oat', 'ryegrass', 'bromegrass'], resistanceCode: 'HRAC 1 (A)', modeOfAction: 'Aryloxyphenoxypropionate — anti-graminées foliaire', applicationRate: '0,3-0,5 L/ha', preHarvestInterval: '—', safetyLevel: 'low', cost: 'medium', availability: 'common', restrictions: ['Blé tendre et blé dur — l’orge est très sensible', 'Stade tallage'], alternatives: ['Fenoxaprop-P', 'Sulfosulfuron'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'fenoxaprop-p', name: 'Fenoxaprop-P-éthyl 110 EC (Puma)', activeSubstance: 'fenoxaprop-P-éthyl 110 g/L', type: 'herbicide', formulation: 'EC', crops: ['wheat', 'barley', 'sugarbeet'], targets: ['wild-oat', 'ryegrass'], resistanceCode: 'HRAC 1 (A)', modeOfAction: 'Aryloxyphenoxypropionate — anti-graminées foliaire', applicationRate: '0,8-1,2 L/ha', preHarvestInterval: '—', safetyLevel: 'low', cost: 'medium', availability: 'moderate', restrictions: ['Associer un adjuvant', 'Stade tallage'], alternatives: ['Clodinafop', 'Diclofop-méthyl'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'diclofop-methyl', name: 'Diclofop-méthyl 360 EC', activeSubstance: 'diclofop-méthyl 360 g/L', type: 'herbicide', formulation: 'EC', crops: ['wheat', 'barley'], targets: ['wild-oat'], resistanceCode: 'HRAC 1 (A)', modeOfAction: 'Aryloxyphenoxypropionate — anti-folle avoine', applicationRate: '1,5-2,5 L/ha', preHarvestInterval: '—', safetyLevel: 'low', cost: 'low', availability: 'moderate', restrictions: ['Spécialisé folle avoine', 'Ne pas mélanger avec les hormones (2,4-D)'], alternatives: ['Clodinafop', 'Fenoxaprop-P'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'metribuzine', name: 'Métribuzine 700 WG (Sencor)', activeSubstance: 'métribuzine 700 g/kg', type: 'herbicide', formulation: 'WG', crops: ['potato', 'tomato'], targets: ['broadleaf-veg'], resistanceCode: 'HRAC 5 (C1)', modeOfAction: 'Triazinone — inhibition du photosystème II', applicationRate: '0,5-1 kg/ha', preHarvestInterval: '—', safetyLevel: 'medium', cost: 'low', availability: 'moderate', restrictions: ['Risque de phytotoxicité selon texture du sol', 'Pré-levée de la pomme de terre'], alternatives: ['Linuron', 'Pendiméthaline'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'linuron', name: 'Linuron 450 SC (Afalon)', activeSubstance: 'linuron 450 g/L', type: 'herbicide', formulation: 'SC', crops: ['potato', 'onion'], targets: ['broadleaf-veg'], resistanceCode: 'HRAC 7 (C2)', modeOfAction: 'Urée substituée — inhibition du photosystème II', applicationRate: '1-2 L/ha', preHarvestInterval: '—', safetyLevel: 'medium', cost: 'low', availability: 'moderate', restrictions: ['Interdit en Europe — vérifier l’homologation INPV', 'Pré-levée ou post-levée précoce'], alternatives: ['Métribuzine', 'Oxyfluorfène'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'oxyfluorfene', name: 'Oxyfluorfène 240 EC (Goal)', activeSubstance: 'oxyfluorfène 240 g/L', type: 'herbicide', formulation: 'EC', crops: ['onion', 'citrus', 'vine', 'olive'], targets: ['broadleaf-veg'], resistanceCode: 'HRAC 14 (E)', modeOfAction: 'Diphenyléther — inhibition de la PPO (contact)', applicationRate: '0,5-1,2 L/ha', preHarvestInterval: '—', safetyLevel: 'medium', cost: 'medium', availability: 'moderate', restrictions: ['Oignon : 2-4 feuilles', 'Contact — bon mouillage nécessaire'], alternatives: ['Pendiméthaline', 'Linuron'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'fluroxypyr', name: 'Fluroxypyr 200 EC (Starane)', activeSubstance: 'fluroxypyr 200 g/L', type: 'herbicide', formulation: 'EC', crops: ['wheat', 'barley', 'maize'], targets: ['broadleaf-cereals'], resistanceCode: 'HRAC 4 (O)', modeOfAction: 'Auxine de synthèse — post-levée', applicationRate: '0,5-1 L/ha', preHarvestInterval: '—', safetyLevel: 'low', cost: 'medium', availability: 'moderate', restrictions: ['Efficace sur chardons et gaillets', 'Respecter les délais avant semis des légumineuses'], alternatives: ['2,4-D', 'MCPA'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'imazethapyr', name: 'Imazéthapyr 100 SL (Pursuit)', activeSubstance: 'imazéthapyr 100 g/L', type: 'herbicide', formulation: 'SL', crops: ['legumes'], targets: ['broadleaf-veg'], resistanceCode: 'HRAC 2 (B)', modeOfAction: 'Imidazolinone — ALS inhibitor post-levée', applicationRate: '0,5-1 L/ha', preHarvestInterval: '—', safetyLevel: 'low', cost: 'medium', availability: 'moderate', restrictions: ['Pois chiche, lentille, fève : vérifier les stades homologués', 'Résidus dans le sol — rotation sensible'], alternatives: ['Bentazone', 'Quizalofop-P'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'imazamox', name: 'Imazamox 40 SL', activeSubstance: 'imazamox 40 g/L', type: 'herbicide', formulation: 'SL', crops: ['legumes'], targets: ['broadleaf-veg'], resistanceCode: 'HRAC 2 (B)', modeOfAction: 'Imidazolinone — ALS inhibitor post-levée', applicationRate: '0,5-1 L/ha', preHarvestInterval: '—', safetyLevel: 'low', cost: 'medium', availability: 'rare', restrictions: ['Associer un adjuvant', 'Stades jeunes des adventices'], alternatives: ['Imazéthapyr', 'Bentazone'], registeredAlgeria: false, source: 'ephy' },
  { id: 'bentazone', name: 'Bentazone 480 SL (Basagran)', activeSubstance: 'bentazone 480 g/L', type: 'herbicide', formulation: 'SL', crops: ['legumes', 'maize'], targets: ['broadleaf-veg'], resistanceCode: 'HRAC 6 (C3)', modeOfAction: 'Benzothiadiazinone — inhibition du photosystème II (contact)', applicationRate: '1,5-2,5 L/ha', preHarvestInterval: '—', safetyLevel: 'medium', cost: 'medium', availability: 'moderate', restrictions: ['Fève/haricot : sensibles selon stade', 'Conditions chaudes et humides'], alternatives: ['Imazéthapyr', 'Métribuzine'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'quizalofop-p', name: 'Quizalofop-P-éthyl 50 EC (Fusilade)', activeSubstance: 'quizalofop-P-éthyl 50 g/L', type: 'herbicide', formulation: 'EC', crops: ['legumes', 'sugarbeet', 'onion'], targets: ['perennial-grasses'], resistanceCode: 'HRAC 1 (A)', modeOfAction: 'Aryloxyphenoxypropionate — anti-graminées foliaire', applicationRate: '1-2 L/ha', preHarvestInterval: '—', safetyLevel: 'low', cost: 'medium', availability: 'moderate', restrictions: ['Sélectif des cultures dicotylédones', 'Intervenir sur jeunes graminées'], alternatives: ['Haloxyfop', 'Séthoxydim'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'haloxyfop', name: 'Haloxyfop-R 108 EC', activeSubstance: 'haloxyfop-P 108 g/L', type: 'herbicide', formulation: 'EC', crops: ['legumes', 'sugarbeet'], targets: ['perennial-grasses'], resistanceCode: 'HRAC 1 (A)', modeOfAction: 'Aryloxyphenoxypropionate — anti-graminées foliaire', applicationRate: '0,5-1 L/ha', preHarvestInterval: '—', safetyLevel: 'low', cost: 'medium', availability: 'rare', restrictions: ['Dicotylédones uniquement', 'Agir sur jeunes graminées'], alternatives: ['Quizalofop-P', 'Séthoxydim'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'sethoxydim', name: 'Séthoxydim 200 EC (Nabu)', activeSubstance: 'séthoxydim 200 g/L', type: 'herbicide', formulation: 'EC', crops: ['legumes', 'sunflower'], targets: ['perennial-grasses'], resistanceCode: 'HRAC 1 (A)', modeOfAction: 'Cyclohexanedione — anti-graminées foliaire', applicationRate: '1-1,5 L/ha', preHarvestInterval: '—', safetyLevel: 'low', cost: 'low', availability: 'moderate', restrictions: ['Sélectif des dicotylédones', 'Éviter les températures > 25 °C'], alternatives: ['Quizalofop-P', 'Clethodim'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'clethodim', name: 'Cléthodime 240 EC (Select)', activeSubstance: 'cléthodime 240 g/L', type: 'herbicide', formulation: 'EC', crops: ['legumes', 'sunflower'], targets: ['perennial-grasses'], resistanceCode: 'HRAC 1 (A)', modeOfAction: 'Cyclohexanedione — anti-graminées foliaire', applicationRate: '0,3-0,6 L/ha', preHarvestInterval: '—', safetyLevel: 'low', cost: 'medium', availability: 'rare', restrictions: ['Associer un adjuvant', 'Dicotylédones uniquement'], alternatives: ['Séthoxydim', 'Quizalofop-P'], registeredAlgeria: false, source: 'ephy' },

  // --------------------------------------------------- NÉMATICIDES / AUTRES
  { id: 'methiocarbe', name: 'Méthiocarbe 5 GB (appâts anti-limaces)', activeSubstance: 'méthiocarbe 50 g/kg', type: 'molluscicide', formulation: 'GB', crops: ['wheat', 'barley', 'tomato', 'cucurbits', 'legumes'], targets: ['slugs'], resistanceCode: 'IRAC 1A', modeOfAction: 'Carbamate — appât d’ingestion', applicationRate: '5-7 kg/ha', preHarvestInterval: '21 j', safetyLevel: 'high', cost: 'low', availability: 'moderate', restrictions: ['Toxique pour chiens/chats et faune', 'Épandre le soir, renouveler après pluie'], alternatives: ['Phosphate ferrique (bio)', 'Métaldéhyde'], registeredAlgeria: true, source: 'inpv-2017' },
  { id: 'bromadiolone', name: 'Bromadiolone 0,005 % (appâts)', activeSubstance: 'bromadiolone 50 mg/kg', type: 'rodenticide', formulation: 'GB', crops: ['wheat', 'barley', 'legumes', 'datepalm'], targets: ['rodents'], resistanceCode: '—', modeOfAction: 'Anticoagulant — inhibiteur de la vitamine K', applicationRate: '2-5 appâts/10 m', preHarvestInterval: '—', safetyLevel: 'high', cost: 'low', availability: 'moderate', restrictions: ['Positionner dans les galeries', 'Ramasser les appâts consommés', 'Risque pour les rapaces (chaîne alimentaire)'], alternatives: ['Piégeage mécanique', 'Raticide à base de phosphure'], registeredAlgeria: true, source: 'inpv-2017' },
];

export const ACTIVE_MATTER_BY_ID: Record<string, ActiveMatter> = Object.fromEntries(
  ALGERIAN_ACTIVE_MATTERS.map((m) => [m.id, m]),
);

// ===========================================================================
// INPV 2017 — homologation references per curated active matter (brand + n° INPV)
// Generated from public/data/phyto-2017-index.json (Index des produits phytosanitaires,
// INPV Algérie 2017). Cross-check any use against the current INPV registration.
// ===========================================================================

export interface InpvProductRef {
  brand: string;
  /** Algerian INPV registration number, e.g. '12 52 001'. */
  homologation: string;
  concentration?: string;
  formulation?: string;
}

/** INPV 2017 registration references, keyed by curated active-matter id. */
export const INPV_HOMOLOGATIONS: Record<string, InpvProductRef[]> = {
  'abamectine': [
    { brand: 'ABACTIN', homologation: '12 52 001', concentration: '18 g/L' },
    { brand: 'ABAMECTIN', homologation: '14 54 001', concentration: '1,8 %' },
    { brand: 'ABANUTINA', homologation: '16 56 017', concentration: '18 g/L', formulation: 'EC' },
    { brand: 'ACRIMACTINE', homologation: '07 45 005', concentration: '1,8 %', formulation: 'EC' },
    { brand: 'ACRIVERTINE', homologation: '12 52 033', concentration: '18 g/L' },
    { brand: 'ADVANCE', homologation: '10 50 001', concentration: '18 g/L', formulation: 'EC' },
    { brand: 'AGROMEC', homologation: '16 56 014', concentration: '1,8 %', formulation: 'EC' },
    { brand: 'APACHE', homologation: '12 52 006', concentration: '18 g/L' },
    { brand: 'BACTIMEC', homologation: '08 46 004', concentration: '18 g/L', formulation: 'SC' },
    { brand: 'BIOK', homologation: '07 45 015', concentration: '18 g/L', formulation: 'EC' },
    { brand: 'LIMACTINE', homologation: '07 45 039', concentration: '18 g/L', formulation: 'EC' },
    { brand: 'MECTIN', homologation: '08 46 051', concentration: '18 g/L', formulation: 'EC' },
    { brand: 'METRY', homologation: '73 15 552', concentration: '18 g/L', formulation: 'EC' },
    { brand: 'ROMECTIN', homologation: '15 55 245', concentration: '18 g/L', formulation: 'EC' },
    { brand: 'SOMECTIN', homologation: '16 56 013', concentration: '18 g/L', formulation: 'EC' },
    { brand: 'TINA', homologation: '15 55 249', concentration: '18 g/L', formulation: 'EC' },
    { brand: 'TINAMEXEC', homologation: '08 46 063', concentration: '1,8 %', formulation: 'EC' },
    { brand: 'TINAMGX', homologation: '08 46 068', concentration: '1,8 %', formulation: 'EC' },
    { brand: 'TRANSACT', homologation: '12 52 030', concentration: '18 g/L', formulation: 'EC' },
    { brand: 'VERLAN', homologation: '16 56 016', concentration: '18 g/L', formulation: 'EC' },
    { brand: 'VERTIMEC', homologation: '16 56 011', concentration: '18 g/L', formulation: 'EC' },
    { brand: 'VERTIN', homologation: '10 50 009', concentration: '18 g/L' },
    { brand: 'VOLIAM', homologation: '11 51 032', concentration: '45 g/L', formulation: 'SC' },
    { brand: 'YAMACTIN', homologation: '15 55 251', concentration: '18 g/L', formulation: 'EC' },
    { brand: 'ZELTIMEC', homologation: '16 56 012', concentration: '18 g/L', formulation: 'EC' },
    { brand: 'ZOROTM', homologation: '16 56 015', concentration: '18 g/L', formulation: 'EC' },
  ],
  'acetamipride': [
    { brand: 'ACEPLAN', homologation: '15 55 223', concentration: '20 %', formulation: 'SP' },
    { brand: 'ACETAMEPRIDE', homologation: '13 53 025', concentration: '20 %', formulation: 'SL' },
    { brand: 'ACETAPLAN', homologation: '16 56 028', concentration: '200 g/L', formulation: 'SL' },
    { brand: 'ACETIN', homologation: '16 56 025', concentration: '200 g/L', formulation: 'SL' },
    { brand: 'ALBIS', homologation: '14 54 150', concentration: '20 %', formulation: 'SP' },
    { brand: 'AMIPRID', homologation: '08 46 002', concentration: '20 %', formulation: 'SP' },
    { brand: 'ASTEREX', homologation: '08 46 003', concentration: '150 g/L', formulation: 'SL' },
    { brand: 'BEMIOFF +CYPERME', homologation: '10 50 003', concentration: '100 g/L', formulation: 'EC' },
    { brand: 'CETAN', homologation: '16 56 026', concentration: '200 g/L', formulation: 'SP' },
    { brand: 'CONFIDENTE', homologation: '08 46 017', concentration: '200 g/L', formulation: 'SL' },
    { brand: 'MOPISTOP', homologation: '07 45 048', concentration: '20 %', formulation: 'SP' },
    { brand: 'PRIDE ACETAMI- IMPALA Pucerons', homologation: '08 46 038', concentration: '200 g/L', formulation: 'SL' },
    { brand: 'PRIDE ACETAMI- MIR', homologation: '08 46 064', concentration: '70 %', formulation: 'WP' },
    { brand: 'PRIDE ACETAMI- MOSPRID', homologation: '08 46 048', concentration: '200 g/L', formulation: 'SP' },
    { brand: 'PRIDE ACETAMI- VAPCOMOR Ale', homologation: '15 55 250', concentration: '20 %', formulation: 'SP' },
    { brand: 'PRIDE ACETAMI- WIDE', homologation: '07 45 063', concentration: '20 %', formulation: 'SP' },
    { brand: 'PROCARPIL', homologation: '12 52 021', concentration: '2,5 g/L' },
    { brand: 'RUSTILAN', homologation: '16 56 023', concentration: '20 %', formulation: 'SP' },
  ],
  'azoxystrobine': [
    { brand: 'AMISTAR + TOP G/L NAZOLE', homologation: '16 56 074', formulation: 'SC' },
    { brand: 'AZOLE', homologation: '14 54 152', concentration: '25 %', formulation: 'SC' },
    { brand: 'AZOX', homologation: '14 54 152', concentration: '250 g/L', formulation: 'SC' },
    { brand: 'BOMA', homologation: '08 46 076', concentration: '250 g/L', formulation: 'SC' },
    { brand: 'FOLISUR', homologation: '16 56 064', concentration: '250 g/L', formulation: 'SC' },
    { brand: 'ORTIVA', homologation: '09 47 007', concentration: '250 g/L', formulation: 'SC' },
    { brand: 'PRIORIOPTI +CHLOROTHA- LONIL', homologation: '16 56 073', concentration: '80 g/L', formulation: 'SC' },
    { brand: 'STRIMACH', homologation: '08 46 111', concentration: '250 g/L', formulation: 'SC' },
    { brand: 'STROMAC', homologation: '16 56 066', concentration: '25 %', formulation: 'SC' },
    { brand: 'XTRA AMISTAR BINE +AZOXYSTRO', homologation: '15 55 255', concentration: '200 g/L', formulation: 'SC' },
  ],
  'bentazone': [
    { brand: 'BASAGRAN', homologation: '16 56 137', concentration: '480 g/L', formulation: 'SL' },
    { brand: 'BLAST', homologation: '07 45 130', concentration: '41,1 %', formulation: 'SL' },
  ],
  'bifenthrine': [
    { brand: 'BATON', homologation: '15 55 228', concentration: '100 g/L', formulation: 'EC' },
    { brand: 'BISECT', homologation: '08 46 008', concentration: '100 g/L', formulation: 'EC' },
  ],
  'bromadiolone': [
    { brand: 'HUNTERSEC', homologation: '07 45 145', concentration: '0,01 %' },
  ],
  'captan': [
    { brand: 'CAPITAN', homologation: '13 53 004', formulation: 'WP' },
    { brand: 'CAPTAN', homologation: '14 54 145', concentration: '50 %', formulation: 'WP' },
    { brand: 'CRIPTAN', homologation: '16 56 071', concentration: '50 %', formulation: 'WP' },
    { brand: 'FUNGORO', homologation: '07 45 082', concentration: '50 %', formulation: 'WP' },
    { brand: 'PHYTOCAP', homologation: '12 05 205', concentration: '50 %', formulation: 'WP' },
  ],
  'carbendazime': [
    { brand: 'OCCIDOR', homologation: '08 46 096', concentration: '500 g/L', formulation: 'SC' },
    { brand: 'REVOLT', homologation: '08 46 102', concentration: '500 g/L', formulation: 'SC' },
    { brand: 'RODAZIME', homologation: '07 45 115', concentration: '500 g/L', formulation: 'SC' },
  ],
  'chlorantraniliprole': [
    { brand: 'CORAGEN', homologation: '11 51 015', concentration: '200 g/L', formulation: 'SC' },
    { brand: 'VOLIAM', homologation: '11 51 031', concentration: '100 g/L', formulation: 'SC' },
    { brand: 'VOLIAM', homologation: '11 51 032', concentration: '45 g/L', formulation: 'SC' },
  ],
  'chlorothalonil': [
    { brand: 'BALEAR LONIL CHLOROTHA', homologation: '05 43 046', concentration: '72 %', formulation: 'SC' },
    { brand: 'LONIL CHLOROTHA- ARDAVO', homologation: '20 74 506', concentration: '720 g/L', formulation: 'SC' },
    { brand: 'LONIL CHLOROTHA- BANKO', homologation: '05 43 171', concentration: '500 g/L', formulation: 'SC' },
    { brand: 'LONIL CHLOROTHA- NOL', homologation: '16 56 063', concentration: '750 g/L', formulation: 'SC' },
    { brand: 'THIRAMCHIM', homologation: '14 54 026', concentration: '720 g/L', formulation: 'SC' },
  ],
  'chlorpyriphos-ethyl': [
    { brand: 'AKOFOS', homologation: '13 53 023', concentration: '480 g/L', formulation: 'EC' },
    { brand: 'ATIFOS', homologation: '07 45 012', concentration: '480 g/L', formulation: 'EC' },
    { brand: 'CARLOFOS', homologation: '13 53 024', concentration: '48 %', formulation: 'EC' },
    { brand: 'MONDIAL', homologation: '08 46 049', formulation: 'EC' },
    { brand: 'PHOS-ETHYL CHLORPYRI- CHLORBAN', homologation: '08 46 018', concentration: '480 g/L', formulation: 'EC' },
    { brand: 'PHOS-ETHYL CHLORPYRI- DURSBAN Lutte', homologation: '16 56 035', concentration: '480 g/L', formulation: 'EC' },
    { brand: 'PILORI', homologation: '14 54 163', concentration: '480 g/L', formulation: 'EC' },
    { brand: 'PYRIBAN', homologation: '14 54 164', concentration: '480 g/L', formulation: 'EC' },
    { brand: 'PYRICAL G G/Kg PHOS-ETHYL CHLORPYRI', homologation: '13 53 017', concentration: '5 %', formulation: 'GR' },
    { brand: 'ROCHLOP', homologation: '12 05 205', concentration: '480 g/L', formulation: 'EC' },
  ],
  'clethodim': [
    { brand: 'LECT', homologation: '15 55 294', concentration: '120 g/L', formulation: 'EC' },
  ],
  'clodinafop': [
    { brand: 'RAVINOL GYL CLODINAFOP-PROPAR', homologation: '08 46 136', concentration: '80 g/L', formulation: 'EC' },
    { brand: 'TOPIK GYL CLODINAFOP-PROPAR', homologation: '08 46 187', concentration: '80 g/L', formulation: 'EC' },
    { brand: 'TRAXOS', homologation: '08 46 156', concentration: '22,5 g/L', formulation: 'EC' },
    { brand: 'ZELLAMIN', homologation: '07 45 142', concentration: '60 %', formulation: 'SL' },
  ],
  'cymoxanil': [
    { brand: 'CADILAC', homologation: '07 45 075', concentration: '80 %', formulation: 'WP' },
    { brand: 'CUPERTINE', homologation: '15 55 007', formulation: 'WP' },
    { brand: 'CYMOXANYL', homologation: '07 45 079', concentration: '4 %', formulation: 'WP' },
    { brand: 'DITHANE M', homologation: '07 45 154', concentration: '80 %', formulation: 'WP' },
    { brand: 'EQUATION', homologation: '08 46 179', concentration: '22,5 %', formulation: 'WG' },
    { brand: 'FORTUNE TALXYL', homologation: '07 45 085', concentration: '72 %', formulation: 'WP' },
    { brand: 'M CUPROZATE', homologation: '07 45 162', concentration: '29 %', formulation: 'WP' },
    { brand: 'MANCOMED', homologation: '07 45 099', concentration: '80 %', formulation: 'WP' },
    { brand: 'MANCOZEBE', homologation: '07 45 095', concentration: '64 %', formulation: 'WP' },
    { brand: 'MANCOZEBE', homologation: '13 53 015', concentration: '64 %', formulation: 'WP' },
    { brand: 'MATALAXYL TALAXYL+ MZ', homologation: '07 45 097', concentration: '8 %', formulation: 'WP' },
    { brand: 'PROPINEBE', homologation: '15 55 261', concentration: '70 %', formulation: 'WP' },
    { brand: 'PROPINEBE', homologation: '16 56 062', concentration: '58 %', formulation: 'WP' },
    { brand: 'SATEC CUPRO- DE', homologation: '08 46 114', concentration: '4,2 %', formulation: 'WP' },
    { brand: 'ZELLOMIL MZWP DIMETHO', homologation: '07 45 123', concentration: '6 g/L', formulation: 'WP' },
  ],
  'cypermethrine': [
    { brand: 'CYPERAS', homologation: '13 53 003', concentration: '25 %', formulation: 'EC' },
    { brand: 'CYPERMEDIA', homologation: '14 54 002', concentration: '250 g/L', formulation: 'EC' },
    { brand: 'CYPERMIGHT', homologation: '08 46 012', concentration: '100 g/L', formulation: 'EC' },
    { brand: 'CYRENC', homologation: '08 46 014', concentration: '500 g/L', formulation: 'EC' },
    { brand: 'CYRPA', homologation: '07 45 018', concentration: '250 g/L', formulation: 'EC' },
    { brand: 'CYTHRINE', homologation: '15 55 230', concentration: '100 g/L', formulation: 'EC' },
    { brand: 'FURY', homologation: '09 47 001', concentration: '10 %', formulation: 'EC' },
    { brand: 'MONDIAL', homologation: '08 46 049', formulation: 'EC' },
    { brand: 'POWER', homologation: '16 56 003', concentration: '100 g/L', formulation: 'EC' },
    { brand: 'SHERPA', homologation: '16 56 005', concentration: '250 g/L', formulation: 'EC' },
    { brand: 'THRINE CYPERME- CIRTANEC', homologation: '08 46 010', concentration: '100 g/L', formulation: 'EC' },
    { brand: 'THRINE THRINE CYPERME- CYPERME', homologation: '14 54 003', concentration: '10 %', formulation: 'EC' },
    { brand: 'THRINE THRINE CYPERME- CYPERME', homologation: '15 55 231', concentration: '250 g/L', formulation: 'EC' },
  ],
  'deltamethrine': [
    { brand: 'ALPHYTHRINE', homologation: '15 55 224', concentration: '12,5 g/L', formulation: 'ULV' },
    { brand: 'ALPHYTHRINE', homologation: '15 55 225', concentration: '25 g/L', formulation: 'EC' },
    { brand: 'CERATHRINE', homologation: '10 50 004', concentration: '2,5 %', formulation: 'EC' },
    { brand: 'DECIS THRINE DELTAME', homologation: '12 52 011', concentration: '25 g/L', formulation: 'EC' },
    { brand: 'DEL- THRINE DELTAME- STOCK', homologation: '08 46 022', concentration: '0,05 %', formulation: 'DP' },
    { brand: 'DELTA', homologation: '15 55 236', concentration: '12,5 g/L', formulation: 'ULV' },
    { brand: 'DELTACAL', homologation: '15 55 295', concentration: '12,5 g/L', formulation: 'ULV' },
    { brand: 'DELTACIS', homologation: '07 45 020', concentration: '25 g/L', formulation: 'EC' },
    { brand: 'DELTACOP THRINE DELTAME', homologation: '08 46 196', concentration: '2,5 %', formulation: 'WP' },
    { brand: 'DELTAMAC', homologation: '15 55 235', concentration: '25 g/L', formulation: 'EC' },
    { brand: 'DELTAME', homologation: '15 55 233', concentration: '25 g/L', formulation: 'EC' },
    { brand: 'DELTAME-', homologation: '15 55 234', concentration: '12,5 g/L', formulation: 'ULV' },
    { brand: 'DELTARIN', homologation: '13 53 007', concentration: '2,5 %', formulation: 'EC' },
    { brand: 'DELTARIN THRINE DELTAME', homologation: '07 45 021', concentration: '0,05 %', formulation: 'DP' },
    { brand: 'DELTATOP', homologation: '07 45 022', concentration: '12,5 g/L', formulation: 'ULV' },
    { brand: 'G/L OTEUS', homologation: '08 46 150', formulation: 'OD' },
    { brand: 'THRINE DELTAME- DELTA', homologation: '08 46 026', concentration: '0,05 %', formulation: 'DP' },
  ],
  'diclofop-methyl': [
    { brand: 'CALLIOFOP', homologation: '09 47 014', concentration: '360 g/L', formulation: 'EC' },
    { brand: 'DILOXAN CE', homologation: '16 56 075', concentration: '360 g/L', formulation: 'EC' },
    { brand: 'ELOGRASS', homologation: '14 54 029', concentration: '36 %', formulation: 'EC' },
  ],
  'difenoconazole': [
    { brand: 'AGRICO- %EC', homologation: '13 53 030', concentration: '250 g/L', formulation: 'EC' },
    { brand: 'CAMIZOLE', homologation: '14 54 154', concentration: '25 %', formulation: 'EC' },
    { brand: 'DIFENOCO-', homologation: '12 52 012', concentration: '30 g/L', formulation: 'FS' },
    { brand: 'DIFENOCO-', homologation: '12 52 027', concentration: '250 g/L', formulation: 'EC' },
    { brand: 'DIFENOCO-', homologation: '13 53 033', concentration: '25 %', formulation: 'EC' },
    { brand: 'DIFENOCO-', homologation: '16 56 057', concentration: '250 g/L', formulation: 'EC' },
    { brand: 'DIFESOLE', homologation: '16 56 056', concentration: '25 %', formulation: 'EC' },
    { brand: 'DIVIDEND', homologation: '12 52 012', concentration: '30 g/L', formulation: 'FS' },
    { brand: 'DIVISOLE', homologation: '08 46 088', concentration: '250 g/L', formulation: 'EC' },
    { brand: 'ELWAKI NAZOLE+PROPI- DIFENOCO- CONAZOLE + G/L', homologation: '12 05 204', formulation: 'EC' },
  ],
  'dimethoate': [
    { brand: 'DRAGO-COM-CHLORPYRIFOS + BI', homologation: '12 52 013', concentration: '27,8 %', formulation: 'EC' },
    { brand: 'EMULSION OROSIST', homologation: '07 45 050', concentration: '40 %', formulation: 'EC' },
    { brand: 'LIMATOATE', homologation: '06 50 074', concentration: '40 %', formulation: 'EC' },
    { brand: 'THOATE', homologation: '65 01 555', concentration: '400 g/L', formulation: 'EC' },
    { brand: 'UNIDIM +CHLORPYRI', homologation: '08 46 070', concentration: '27,8 %', formulation: 'EC' },
  ],
  'emamectine': [
    { brand: 'EMACIDE ZOATE EMAMECTINBEN', homologation: '10 50 006' },
    { brand: 'PROACT', homologation: '10 50 008', concentration: '50 g/L', formulation: 'EC' },
    { brand: 'PROCLAIM BENZOATE EMAMECTIN Noctuelle', homologation: '15 55 244', concentration: '5 %', formulation: 'WG' },
    { brand: 'PROMED', homologation: '12 05 206', concentration: '5 %', formulation: 'SG' },
  ],
  'fenoxaprop-p': [
    { brand: 'DOPLERPLUS', homologation: '07 45 164', concentration: '20 g/L', formulation: 'EW' },
    { brand: 'PEREC', homologation: '15 55 006', concentration: '250 g/L', formulation: 'EC' },
    { brand: 'SUPER OMEROUS', homologation: '08 46 134', concentration: '75 g/L', formulation: 'EW' },
  ],
  'fenpyroximate': [
    { brand: 'ORTUS', homologation: '08 46 054', concentration: '5,2 %', formulation: 'SC' },
  ],
  'flutriafol': [
    { brand: 'IMPACT', homologation: '16 56 043', concentration: '125 g/L', formulation: 'SC' },
  ],
  'fosetyl-aluminium': [
    { brand: 'ELITE NIUM FOSETYL-ALUMI', homologation: '15 55 262', concentration: '80 %', formulation: 'WG' },
    { brand: 'GOLDFOS NIUM FOSETYL-ALUMI', homologation: '08 46 090', concentration: '80 %', formulation: 'WP' },
    { brand: 'PHYTOFOSIE NIUM FOSETYLALUMI', homologation: '14 54 162', concentration: '80 %', formulation: 'WP' },
  ],
  'glufosinate': [
    { brand: 'GLUSAR', homologation: '11 51 020', concentration: '20 %', formulation: 'SL' },
  ],
  'glyphosate': [
    { brand: 'AGRI-WEEDKILL', homologation: '13 53 034', concentration: '360 g/L', formulation: 'SL' },
    { brand: 'CEROSATE', homologation: '13 53 035', concentration: '480 g/L', formulation: 'SL' },
    { brand: 'DISSSTOP', homologation: '08 46 120', concentration: '360 g/L', formulation: 'SL' },
    { brand: 'FORTINSL', homologation: '14 54 030', concentration: '360 g/L', formulation: 'SL' },
    { brand: 'FREELAND', homologation: '10 13 530', concentration: '480 g/L', formulation: 'SL' },
    { brand: 'GLITAN', homologation: '08 46 122', concentration: '360 g/L', formulation: 'SL' },
    { brand: 'GLYFONUT', homologation: '07 45 136', concentration: '360 g/L', formulation: 'SL' },
    { brand: 'GLYFOZELL', homologation: '07 45 137', concentration: '360 g/L', formulation: 'SL' },
    { brand: 'GLYPHON', homologation: '08 46 129', concentration: '480 g/L', formulation: 'SL' },
    { brand: 'GLYPHON', homologation: '08 46 130', concentration: '360 g/L', formulation: 'SL' },
    { brand: 'GLYPHOS', homologation: '07 45 133', concentration: '360 g/L', formulation: 'SL' },
    { brand: 'GROUND-UP', homologation: '13 53 010', concentration: '360 g/L', formulation: 'SL' },
    { brand: 'HERBASATE', homologation: '07 45 138', concentration: '360 g/L', formulation: 'SL' },
    { brand: 'MAMBA', homologation: '12 52 074', concentration: '360 g/L', formulation: 'SL' },
    { brand: 'NASA', homologation: '13 53 038', concentration: '360 g/L', formulation: 'SL' },
    { brand: 'PHOMAC', homologation: '14 54 028', concentration: '480 g/L', formulation: 'SL' },
    { brand: 'PROPER', homologation: '08 46 135', concentration: '480 g/L', formulation: 'SL' },
    { brand: 'RIDASATE', homologation: '08 46 186', concentration: '360 g/L', formulation: 'EC' },
    { brand: 'ROPHOSATE', homologation: '07 45 149', concentration: '480 g/L', formulation: 'SL' },
    { brand: 'SYSTEME', homologation: '13 53 016', concentration: '360 g/L', formulation: 'SL' },
    { brand: 'TILLER', homologation: '12 52 087', concentration: '48 %', formulation: 'SL' },
    { brand: 'TRAGLI', homologation: '08 46 139', concentration: '360 g/L', formulation: 'SL' },
  ],
  'haloxyfop': [
    { brand: 'SUPER ESTER GALLANT', homologation: '08 46 184', concentration: '104 g/L', formulation: 'EC' },
  ],
  'hexythiazox': [
    { brand: 'ACAROL', homologation: '08 46 148', concentration: '10 %', formulation: 'WP' },
    { brand: 'HEXIZOX THIAZOX HEXY', homologation: '16 56 033', concentration: '10 %', formulation: 'WP' },
  ],
  'imidaclopride': [
    { brand: 'CHLORPRID', homologation: '16 56 008', concentration: '200 g/L', formulation: 'SL' },
    { brand: 'COMMANDO', homologation: '15 55 229', concentration: '70 %', formulation: 'DP' },
    { brand: 'COMODOR', homologation: '12 52 009', concentration: '200 g/L', formulation: 'SL' },
    { brand: 'CONFIDOR', homologation: '08 46 016', concentration: '200 g/L', formulation: 'OD' },
    { brand: 'CONFIDOR PRA', homologation: '16 56 010', formulation: 'WG' },
  ],
  'indoxacarbe': [
    { brand: 'ARIZONATE', homologation: '07 45 011', concentration: '15 %', formulation: 'SC' },
    { brand: 'ZINAD', homologation: '08 46 071', concentration: '150 g/L', formulation: 'SC' },
  ],
  'iprodione': [
    { brand: 'ALDABON', homologation: '11 51 003', concentration: '500 g/L', formulation: 'SC' },
    { brand: 'CORVAL', homologation: '12 05 206', formulation: 'WP' },
    { brand: 'IPPON', homologation: '12 05 206', concentration: '500 g/L', formulation: 'SC' },
    { brand: 'ROVER', homologation: '08 46 153', concentration: '50 %', formulation: 'WP' },
    { brand: 'ROVRAL', homologation: '08 46 183', concentration: '500 g/L', formulation: 'SC' },
  ],
  'kresoxim-methyl': [
    { brand: 'SOXIM-METHYL KRE- ROSIM', homologation: '16 56 065', concentration: '50 %', formulation: 'WG' },
    { brand: 'STROBYWG SOXIM-METHYL KRE', homologation: '08 46 154', concentration: '50 %', formulation: 'WG' },
  ],
  'lambda-cyhalothrine': [
    { brand: 'CYCLONE', homologation: '08 46 011', concentration: '50 g/L', formulation: 'EC' },
    { brand: 'LERATEX', homologation: '16 56 022', concentration: '50 g/L', formulation: 'EC' },
    { brand: 'PULSAR', homologation: '08 46 060', concentration: '25 g/L', formulation: 'EC' },
  ],
  'linuron': [
    { brand: 'LINU', homologation: '08 46 124', concentration: '50 %', formulation: 'WP' },
    { brand: 'LINUCHEM', homologation: '08 46 126', concentration: '50 %', formulation: 'WG' },
    { brand: 'LUNITOP', homologation: '07 45 139', concentration: '50 %', formulation: 'WP' },
    { brand: 'TEFLON', homologation: '07 45 144', concentration: '50 %', formulation: 'WP' },
  ],
  'mancozebe': [
    { brand: 'CADILAC', homologation: '07 45 075', concentration: '80 %', formulation: 'WP' },
    { brand: 'CYMOXANYL', homologation: '07 45 079', concentration: '4 %', formulation: 'WP' },
    { brand: 'DITHANE M', homologation: '07 45 154', concentration: '80 %', formulation: 'WP' },
    { brand: 'FORTUNE TALXYL', homologation: '07 45 085', concentration: '72 %', formulation: 'WP' },
    { brand: 'M CUPROZATE', homologation: '07 45 162', concentration: '29 %', formulation: 'WP' },
    { brand: 'MANCOMED', homologation: '07 45 099', concentration: '80 %', formulation: 'WP' },
    { brand: 'MANCOZEBE', homologation: '07 45 095', concentration: '64 %', formulation: 'WP' },
    { brand: 'MANCOZEBE', homologation: '13 53 015', concentration: '64 %', formulation: 'WP' },
    { brand: 'MATALAXYL TALAXYL+ MZ', homologation: '07 45 097', concentration: '8 %', formulation: 'WP' },
    { brand: 'ZELLOMIL MZWP DIMETHO', homologation: '07 45 123', concentration: '6 g/L', formulation: 'WP' },
  ],
  'metalaxyl-m': [
    { brand: 'APRONS-', homologation: '16 56 072', concentration: '20 %', formulation: 'WS' },
    { brand: 'CADILAC', homologation: '07 45 075', concentration: '80 %', formulation: 'WP' },
    { brand: 'CYMOXANYL', homologation: '07 45 079', concentration: '4 %', formulation: 'WP' },
    { brand: 'DITHANE M', homologation: '07 45 154', concentration: '80 %', formulation: 'WP' },
    { brand: 'FORTUNE TALXYL', homologation: '07 45 085', concentration: '72 %', formulation: 'WP' },
    { brand: 'GOLDPLUS', homologation: '03 02 804', concentration: '2,5 %', formulation: 'WP' },
    { brand: 'M CUPROZATE', homologation: '07 45 162', concentration: '29 %', formulation: 'WP' },
    { brand: 'MANCOMED', homologation: '07 45 099', concentration: '80 %', formulation: 'WP' },
    { brand: 'MANCOZEBE', homologation: '07 45 095', concentration: '64 %', formulation: 'WP' },
    { brand: 'MANCOZEBE', homologation: '13 53 015', concentration: '64 %', formulation: 'WP' },
    { brand: 'MATALAXYL TALAXYL+ MZ', homologation: '07 45 097', concentration: '8 %', formulation: 'WP' },
    { brand: 'METALAXYL', homologation: '07 45 117', concentration: '8 %', formulation: 'WP' },
    { brand: 'Metalaxyl', homologation: '08 46 073', concentration: '400 g/L', formulation: 'EC' },
    { brand: 'THIAMETOXAM', homologation: '16 56 072', concentration: '20 %', formulation: 'WS' },
    { brand: 'ZELLOMIL MZWP DIMETHO', homologation: '07 45 123', concentration: '6 g/L', formulation: 'WP' },
  ],
  'methiocarbe': [
    { brand: 'TANROSSE', homologation: '07 45 158', concentration: '4 %' },
  ],
  'metribuzine': [
    { brand: 'AINDEFLAHOCK', homologation: '12 52 034', concentration: '70 %', formulation: 'WG' },
    { brand: 'ALISO', homologation: '07 45 127', concentration: '70 %', formulation: 'WP' },
    { brand: 'ARDOBUZINE', homologation: '07 45 129', concentration: '70 %', formulation: 'WG' },
    { brand: 'BUZZ', homologation: '07 45 132', concentration: '70 %', formulation: 'WP' },
    { brand: 'LEXONE', homologation: '07 45 150', concentration: '75 %', formulation: 'WG' },
    { brand: 'MANDOR', homologation: '12 05 204', concentration: '70 %', formulation: 'WG' },
    { brand: 'METABUZINE', homologation: '08 46 127', concentration: '70 %', formulation: 'WP' },
    { brand: 'METRIBUZELL', homologation: '07 45 141', concentration: '70 %', formulation: 'WP' },
    { brand: 'METRICAM', homologation: '15 55 288', concentration: '70 %', formulation: 'WP' },
    { brand: 'METRIPHAR', homologation: '08 46 128', concentration: '70 %', formulation: 'WG' },
    { brand: 'METRIXONE', homologation: '16 56 076', concentration: '70 %', formulation: 'WP' },
    { brand: 'RIBUZINE', homologation: '16 56 078', concentration: '75 %', formulation: 'DP' },
    { brand: 'ROMETRI', homologation: '11 51 028', concentration: '480 g/L', formulation: 'SC' },
    { brand: 'SENCOR', homologation: '09 47 010', concentration: '70 %', formulation: 'WG' },
    { brand: 'SENCORATE', homologation: '16 56 077', concentration: '75 %', formulation: 'WG' },
    { brand: 'STARZIN', homologation: '12 05 205', concentration: '70 %', formulation: 'WG' },
    { brand: 'TRIBUZIN', homologation: '14 54 019', concentration: '70 %', formulation: 'WP' },
    { brand: 'TURBO', homologation: '08 46 138', concentration: '70 %', formulation: 'WG' },
    { brand: 'UNIMARK', homologation: '08 46 141', concentration: '70 %', formulation: 'WG' },
    { brand: 'VAPCOR', homologation: '13 53 020', concentration: '70 %', formulation: 'WP' },
  ],
  'metsulfuron-methyl': [
    { brand: 'SULFURONMETHYL', homologation: '14 54 168', concentration: '75 %', formulation: 'WG' },
  ],
  'myclobutanil': [
    { brand: 'BUTANIL', homologation: '08 46 151', concentration: '125 g/L', formulation: 'EC' },
    { brand: 'MYCLO', homologation: '08 46 094', concentration: '120 g/L', formulation: 'EC' },
    { brand: 'SYSTHANE', homologation: '08 46 109', concentration: '240 g/L', formulation: 'EC' },
  ],
  'oxyfluorfene': [
    { brand: 'AKOFENSUPER + YFOSATE', homologation: '07 45 126', concentration: '30 %', formulation: 'SC' },
    { brand: 'ARGOL', homologation: '08 46 116', concentration: '240 g/L', formulation: 'EC' },
    { brand: 'DAGO', homologation: '11 51 017', concentration: '24 %', formulation: 'EC' },
    { brand: 'GERONIMO', homologation: '08 46 121', concentration: '240 g/L', formulation: 'EC' },
    { brand: 'GOAL E', homologation: '08 46 188', concentration: '2 %', formulation: 'EC' },
    { brand: 'GOLDATE', homologation: '15 55 286', concentration: '240 g/L', formulation: 'EC' },
    { brand: 'HADAF', homologation: '15 55 287', concentration: '240 g/L', formulation: 'EC' },
    { brand: 'HADAF', homologation: '21 55 528', concentration: '240 g/L', formulation: 'EC' },
    { brand: 'MARACANA', homologation: '15 55 289', concentration: '240 g/L', formulation: 'EC' },
    { brand: 'OXFORD', homologation: '08 46 133', concentration: '240 g/L', formulation: 'SL' },
    { brand: 'OXYFEN', homologation: '15 55 291', concentration: '240 g/L', formulation: 'EC' },
    { brand: 'OXYGLORY', homologation: '16 56 089', concentration: '240 g/L', formulation: 'EC' },
    { brand: 'ROOL', homologation: '14 54 018', concentration: '240 g/L', formulation: 'EC' },
  ],
  'penconazole': [
    { brand: 'BAYADEX', homologation: '16 56 045', concentration: '10 %', formulation: 'EC' },
    { brand: 'MIRACLE MADJLOUL', homologation: '16 56 044', concentration: '100 g/L', formulation: 'EC' },
    { brand: 'PAZACHEM', homologation: '08 46 097', concentration: '100 g/L', formulation: 'EC' },
    { brand: 'PENCONATE', homologation: '07 45 110', concentration: '10 %', formulation: 'EC' },
    { brand: 'PENZOLE', homologation: '16 56 047', concentration: '100 g/L', formulation: 'EC' },
    { brand: 'TOPAZE', homologation: '12 52 028', concentration: '100 g/L', formulation: 'EC' },
    { brand: 'TOPAZOL', homologation: '16 56 046', concentration: '100 g/L', formulation: 'EC' },
  ],
  'pendimethaline': [
    { brand: 'PROWLAQUA', homologation: '11 51 026', concentration: '455 g/L', formulation: 'CS' },
  ],
  'propiconazole': [
    { brand: 'PROPICONAZOLE', homologation: '12 52 026', concentration: '250 g/L', formulation: 'EC' },
    { brand: 'PROPIVAP', homologation: '07 45 112', concentration: '25 %', formulation: 'EC' },
    { brand: 'PROPIVAP', homologation: '08 46 100', concentration: '25 %', formulation: 'EC' },
    { brand: 'TELEMAC', homologation: '12 05 205', concentration: '250 g/L', formulation: 'EC' },
    { brand: 'TILT', homologation: '08 46 181', concentration: '250 g/L', formulation: 'EC' },
  ],
  'pyraclostrobine': [
    { brand: 'BELLISWG RACLOSTROBINE', homologation: '08 46 152', concentration: '12,8 %', formulation: 'WG' },
  ],
  'soufre': [
    { brand: 'ACIDESORGANIQUE CaO', homologation: '16 56 097', concentration: '7,5 %' },
    { brand: 'AFEPASA', homologation: '16 56 041', concentration: '60 %', formulation: 'DP' },
    { brand: 'BIO', homologation: '07 45 074', concentration: '80 %', formulation: 'WP' },
    { brand: 'BROYE', homologation: '15 55 279', concentration: '98 %', formulation: 'DP' },
    { brand: 'KUMULUS', homologation: '16 56 037', concentration: '80 %', formulation: 'WG' },
    { brand: 'LEGERE', homologation: '15 55 278', concentration: '98 %', formulation: 'DP' },
    { brand: 'MICROTHIOL ECIAL', homologation: '16 56 039', concentration: '80 %', formulation: 'WG' },
    { brand: 'MICROVITE', homologation: '08 46 093', concentration: '80 %', formulation: 'WP' },
    { brand: 'MISTRAL', homologation: '14 54 158', formulation: 'WP' },
    { brand: 'NECATOR', homologation: '09 47 013', concentration: '80 %', formulation: 'WP' },
    { brand: 'PREVICATOR', homologation: '08 46 098', concentration: '80 %', formulation: 'WP' },
    { brand: 'SOFRAL', homologation: '15 55 280' },
    { brand: 'SOLFOLI', homologation: '08 46 177', concentration: '800 g/L', formulation: 'SC' },
    { brand: 'SOLFOM', homologation: '08 46 178', concentration: '80 %', formulation: 'WP' },
    { brand: 'SOUFRE', homologation: '11 51 021', concentration: '700 g/L', formulation: 'SC' },
    { brand: 'SOUFRE', homologation: '16 56 040', concentration: '80 %', formulation: 'WG' },
    { brand: 'THIOVITJET', homologation: '14 54 014', concentration: '80 %', formulation: 'WG' },
    { brand: 'TRA BLE SIARKOLEX', homologation: '07 45 116', concentration: '80 %', formulation: 'WG' },
    { brand: 'TRITURÉ AFEPASA', homologation: '16 56 038', concentration: '98,69 %', formulation: 'DP' },
  ],
  'spinosad': [
    { brand: 'SUCCES', homologation: '08 46 061', concentration: '0,24 g/L' },
    { brand: 'TRACER', homologation: '08 46 065', concentration: '240 g/L', formulation: 'SC' },
  ],
  'tebuconazole': [
    { brand: 'ACIL', homologation: '15 55 252', concentration: '60 g/L', formulation: 'FS' },
    { brand: 'AKORUS', homologation: '07 45 068', concentration: '0,25 %', formulation: 'OD' },
    { brand: 'BUNAZOL', homologation: '16 56 055', concentration: '250 g/L', formulation: 'EW' },
    { brand: 'CORAIL', homologation: '14 54 009', concentration: '250 g/L', formulation: 'EW' },
    { brand: 'DALION', homologation: '10 50 043', concentration: '430 g/L', formulation: 'SC' },
    { brand: 'FALCON', homologation: '15 55 269', concentration: '250 g/L', formulation: 'EC' },
    { brand: 'HORIZELL', homologation: '16 56 054', concentration: '250 g/L', formulation: 'EC' },
    { brand: 'HORIZON', homologation: '14 54 010', concentration: '250 g/L', formulation: 'EW' },
    { brand: 'MICO- NAZOLE', homologation: '15 55 275', concentration: '60 g/L', formulation: 'FS' },
    { brand: 'RAXIL', homologation: '14 54 013', concentration: '60 g/L', formulation: 'FS' },
    { brand: 'SARGO', homologation: '15 55 277', concentration: '60 g/L', formulation: 'FS' },
    { brand: 'TALENT', homologation: '07 45 122', concentration: '250 g/L', formulation: 'EC' },
    { brand: 'TEBIZOLE %WP', homologation: '12 05 205', concentration: '25 %', formulation: 'WP' },
    { brand: 'TEBUCONATE', homologation: '07 45 121', concentration: '25 %', formulation: 'EW' },
    { brand: 'TOLEDO', homologation: '14 54 167', concentration: '250 g/L', formulation: 'EC' },
  ],
  'thiamethoxame': [
    { brand: 'ACTARA', homologation: '12 52 002', concentration: '25 %', formulation: 'WG' },
    { brand: 'FLYCLEAN THOXAM THIAME', homologation: '11 51 018', concentration: '25 %', formulation: 'WG' },
    { brand: 'MANARA', homologation: '16 56 034', concentration: '25 %', formulation: 'WG' },
    { brand: 'THIOXAM', homologation: '13 53 029', concentration: '25 %', formulation: 'WG' },
    { brand: 'THOXAM THIAME- IKE', homologation: '13 53 028', concentration: '25 %', formulation: 'WG' },
    { brand: 'THOXAM THIAME- RAM', homologation: '15 55 012', concentration: '25 %', formulation: 'WG' },
    { brand: 'THOXAM THIAME- TIAM', homologation: '08 46 067', concentration: '25 %', formulation: 'WG' },
  ],
  'thiophanate-methyl': [
    { brand: 'PELT NATE-METHYL THIOPHA', homologation: '16 56 051', concentration: '70 %', formulation: 'WG' },
  ],
  'trifloxystrobine': [
    { brand: 'BINE TRIFLOXYSTRO- PINK', homologation: '07 45 111', concentration: '50 %', formulation: 'WG' },
    { brand: 'FLINT XG BINE TRIFLOXYSTRO', homologation: '12 52 014', concentration: '50 %', formulation: 'WG' },
  ],
  'trifluraline': [
    { brand: 'HERBALINE', homologation: '08 46 198', concentration: '480 g/L', formulation: 'EC' },
  ],
};
