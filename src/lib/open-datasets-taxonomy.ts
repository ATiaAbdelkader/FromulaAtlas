/**
 * Open-Source Plant Pathology & Pest Vision Datasets Taxonomy & Benchmark Library.
 * Synthesizes annotations, class taxonomies, and diagnostic metrics from:
 *   1. PlantVillage (54,306 images / 14 crops / 38 classes)
 *   2. PlantDoc (2,598 images / 17 diseases / YOLO bounding box annotations in-the-wild)
 *   3. PlantWild & MVPDR (18,542 real field images with multi-modal taxonomy)
 *   4. CropDeep (31,147 greenhouse & field instances)
 *   5. IP102 (75,222 insect pest images & sticky trap detection)
 *
 * Grounded with Algerian INPV (Institut National de la Protection des Végétaux)
 * homologated active ingredients, trade names, and legal DAR (Délai d'Attente Avant Récolte).
 */

export interface OpenDatasetReference {
  id: string;
  name: string;
  repo: string;
  paperTitle: string;
  imageCount: string;
  annotationType: 'Classification' | 'Bounding Boxes (YOLO / COCO)' | 'Segmentation Masks' | 'Multi-modal';
  focus: string;
  cropsCovered: string[];
  keyStrengths: string;
}

export interface DiseaseTaxonomyEntry {
  id: string;
  datasetOrigin: 'PlantVillage' | 'PlantDoc' | 'PlantWild' | 'CropDeep' | 'IP102';
  crop: string;
  crop_ar: string;
  crop_fr: string;
  diseaseName: string;
  diseaseName_ar: string;
  diseaseName_fr: string;
  pathogenType: 'fungal' | 'bacterial' | 'viral' | 'pest' | 'physiological';
  scientificName: string;
  visualSymptomSignature: {
    lesionShape: string;
    colorSpectrum: string[];
    concentricRings: boolean;
    chloroticHalo: boolean;
    waterSoakedEdges: boolean;
    textureType: 'necrotic' | 'powdery' | 'pustular' | 'mosaic' | 'gall';
  };
  algerianRiskRegions: string[];
  inpvProducts: {
    tradeName: string;
    activeIngredient: string;
    dosagePerHaOrHl: string;
    darDays: number; // Pre-harvest interval (Délai avant récolte)
  }[];
  biologicalControls: string[];
  faoSeverityThreshold: string;
}

export const OPEN_AGRI_DATASETS: OpenDatasetReference[] = [
  {
    id: 'plantvillage',
    name: 'PlantVillage Dataset',
    repo: 'https://github.com/spMohanty/PlantVillage-Dataset',
    paperTitle: 'Using Deep Learning for Image-Based Plant Disease Detection (Mohanty et al., 2016)',
    imageCount: '54,306 images',
    annotationType: 'Classification',
    focus: 'Standard laboratory benchmark across 14 crops and 38 healthy/diseased classes.',
    cropsCovered: ['Tomato', 'Potato', 'Apple', 'Grape', 'Corn', 'Pepper', 'Strawberry', 'Peach', 'Soybean', 'Citrus'],
    keyStrengths: 'Massive training baseline, clean segmented leaves, canonical ground truth for 38 disease categories.',
  },
  {
    id: 'plantdoc',
    name: 'PlantDoc Dataset',
    repo: 'https://github.com/pratikkayal/PlantDoc-Dataset',
    paperTitle: 'PlantDoc: A Dataset for Visual Plant Disease Detection in Natural Field Settings (Singh et al., 2020)',
    imageCount: '2,598 in-field images',
    annotationType: 'Bounding Boxes (YOLO / COCO)',
    focus: 'Natural outdoor agricultural conditions with complex foliage backgrounds, occlusions, and multi-disease leaves.',
    cropsCovered: ['Tomato', 'Potato', 'Bell Pepper', 'Apple', 'Corn', 'Grape', 'Soybean'],
    keyStrengths: 'High generalization for drone/smartphone cameras, YOLOv8/v11 bounding boxes on specific leaf lesions.',
  },
  {
    id: 'plantwild',
    name: 'PlantWild / MVPDR',
    repo: 'https://github.com/tqwei05/MVPDR',
    paperTitle: 'Benchmarking In-the-Wild Multimodal Plant Disease Recognition (Wei et al., 2023)',
    imageCount: '18,542 field images',
    annotationType: 'Multi-modal',
    focus: 'Large intra-class variance and subtle inter-class differences in unconstrained farm environments across 115 classes.',
    cropsCovered: ['Tomato', 'Cereals', 'Vegetables', 'Orchards', 'Cash Crops'],
    keyStrengths: 'Trained on fine-grained visual symptoms paired with textual descriptions and disease stage metadata.',
  },
  {
    id: 'cropdeep',
    name: 'CropDeep Precision Dataset',
    repo: 'CropDeep: The Crop Vision Dataset for Deep-Learning-Based Classification & Detection',
    paperTitle: 'CropDeep: The Crop Vision Dataset for Deep-Learning-Based Classification & Detection (Zheng et al., 2019)',
    imageCount: '31,147 images (49,000+ instances)',
    annotationType: 'Bounding Boxes (YOLO / COCO)',
    focus: 'Greenhouse and canopy monitoring sensors under varying daylight, artificial lighting, and plant growth phases.',
    cropsCovered: ['Tomato', 'Cucumber', 'Pepper', 'Eggplant'],
    keyStrengths: 'Greenhouse tunnel crop tracking, fruit counting, and stem/foliage pathology.',
  },
  {
    id: 'ip102',
    name: 'IP102 Insect Pest Dataset',
    repo: 'https://github.com/jason-ying/IP102',
    paperTitle: 'IP102: A Large-Scale Benchmark Dataset for Insect Pest Recognition (Wu et al., 2019)',
    imageCount: '75,222 images',
    annotationType: 'Bounding Boxes (YOLO / COCO)',
    focus: '102 insect pest classes spanning crop foliage damage and sticky trap monitoring cards.',
    cropsCovered: ['Tomato', 'Olive', 'Citrus', 'Wheat', 'Corn', 'Date Palm', 'Potato'],
    keyStrengths: 'Accurate yellow/blue sticky trap spot counting, nymph vs adult instar detection, and economic injury levels.',
  },
];

export const BENCHMARK_DISEASE_TAXONOMY: DiseaseTaxonomyEntry[] = [
  {
    id: 'tomato-early-blight',
    datasetOrigin: 'PlantVillage',
    crop: 'Tomato',
    crop_ar: 'طماطم',
    crop_fr: 'Tomate',
    diseaseName: 'Early Blight (Alternaria solani)',
    diseaseName_ar: 'اللفحة المبكرة (ألترناريا سولاني)',
    diseaseName_fr: 'Alternariose de la tomate (Alternaria solani)',
    pathogenType: 'fungal',
    scientificName: 'Alternaria solani',
    visualSymptomSignature: {
      lesionShape: 'Concentric "target-board" circular/irregular dark brown spots',
      colorSpectrum: ['#451a03', '#78350f', '#eab308', '#15803d'],
      concentricRings: true,
      chloroticHalo: true,
      waterSoakedEdges: false,
      textureType: 'necrotic',
    },
    algerianRiskRegions: ['Mitidja (Blida/Tipaza)', 'Mostaganem', 'Biskra greenhouses', 'Chlef'],
    inpvProducts: [
      { tradeName: 'Score 250 EC', activeIngredient: 'Difénoconazole 250 g/L', dosagePerHaOrHl: '0.05 L/hl', darDays: 3 },
      { tradeName: 'Kocide Opti', activeIngredient: 'Hydroxyde de Cuivre 46.1%', dosagePerHaOrHl: '2.0 kg/ha', darDays: 3 },
      { tradeName: 'Ortiva 250 SC', activeIngredient: 'Azoxystrobine 250 g/L', dosagePerHaOrHl: '0.8 L/ha', darDays: 3 },
    ],
    biologicalControls: ['Bacillus subtilis QST 713', 'Trichoderma harzianum T-22', 'Copper Bordeaux mixture at early canopy'],
    faoSeverityThreshold: '>15% leaf area affected triggers compulsory systemic treatment.',
  },
  {
    id: 'tomato-late-blight',
    datasetOrigin: 'PlantDoc',
    crop: 'Tomato / Potato',
    crop_ar: 'طماطم / بطاطا',
    crop_fr: 'Tomate / Pomme de terre',
    diseaseName: 'Late Blight (Phytophthora infestans)',
    diseaseName_ar: 'اللفحة المتأخرة (فيتوفثورا)',
    diseaseName_fr: 'Mildiou de la tomate et pomme de terre (Phytophthora infestans)',
    pathogenType: 'fungal',
    scientificName: 'Phytophthora infestans',
    visualSymptomSignature: {
      lesionShape: 'Rapidly expanding water-soaked pale-green to dark brown lesions with white fuzzy sporulation on leaf underside',
      colorSpectrum: ['#1c1917', '#3f3f46', '#e4e4e7', '#166534'],
      concentricRings: false,
      chloroticHalo: true,
      waterSoakedEdges: true,
      textureType: 'necrotic',
    },
    algerianRiskRegions: ['El Oued (Pivot Potato)', 'Mascara (Ghriss)', 'Aïn Defla', 'Mitidja'],
    inpvProducts: [
      { tradeName: 'Ridomil Gold MZ', activeIngredient: 'Méfénoxam 4% + Mancozèbe 64%', dosagePerHaOrHl: '2.5 kg/ha', darDays: 7 },
      { tradeName: 'Revus 250 SC', activeIngredient: 'Mandipropamide 250 g/L', dosagePerHaOrHl: '0.6 L/ha', darDays: 3 },
      { tradeName: 'Infinito', activeIngredient: 'Fluopicolide + Propamocarbe', dosagePerHaOrHl: '1.4 L/ha', darDays: 7 },
    ],
    biologicalControls: ['Phosphonate de potassium', 'Cuivre cuprique préventif', 'Gestion de l\'hygrométrie sous abri'],
    faoSeverityThreshold: 'Zero tolerance (1 lesion found in parcel requires immediate preventive spray across entire pivot).',
  },
  {
    id: 'potato-early-blight',
    datasetOrigin: 'PlantVillage',
    crop: 'Potato',
    crop_ar: 'بطاطا',
    crop_fr: 'Pomme de terre',
    diseaseName: 'Potato Early Blight (Alternaria grandis / solani)',
    diseaseName_ar: 'اللفحة المبكرة للبطاطا',
    diseaseName_fr: 'Alternariose de la pomme de terre',
    pathogenType: 'fungal',
    scientificName: 'Alternaria grandis',
    visualSymptomSignature: {
      lesionShape: 'Angular necrotic spots delimited by leaf veins with yellow surrounding chlorosis',
      colorSpectrum: ['#3f2e18', '#854d0e', '#ca8a04', '#15803d'],
      concentricRings: true,
      chloroticHalo: true,
      waterSoakedEdges: false,
      textureType: 'necrotic',
    },
    algerianRiskRegions: ['El Oued', 'Mascara', 'Aïn Defla', 'Bouira', 'Mostaganem'],
    inpvProducts: [
      { tradeName: 'Nativo 75 WG', activeIngredient: 'Tébuconazole 50% + Trifloxystrobine 25%', dosagePerHaOrHl: '0.3 kg/ha', darDays: 14 },
      { tradeName: 'Daconil 500 SC', activeIngredient: 'Chlorothalonil 500 g/L', dosagePerHaOrHl: '2.0 L/ha', darDays: 7 },
    ],
    biologicalControls: ['Élimination des fanes infectées', 'Rotation triennale hors solanacées'],
    faoSeverityThreshold: '>10% canopy necrosis requires alternating strobilurin and triazole applications.',
  },
  {
    id: 'olive-peacock-spot',
    datasetOrigin: 'PlantWild',
    crop: 'Olive',
    crop_ar: 'زيتون',
    crop_fr: 'Olivier',
    diseaseName: 'Olive Peacock Spot (Spilocaea oleagina / Cycloconium)',
    diseaseName_ar: 'عين الطاووس في الزيتون',
    diseaseName_fr: 'Œil de paon de l’olivier (Spilocaea oleagina)',
    pathogenType: 'fungal',
    scientificName: 'Venturia oleaginea / Spilocaea oleagina',
    visualSymptomSignature: {
      lesionShape: 'Sooty concentric rings with greenish-black centers surrounded by a yellow halo resembling a peacock tail',
      colorSpectrum: ['#14532d', '#713f12', '#ca8a04', '#1e293b'],
      concentricRings: true,
      chloroticHalo: true,
      waterSoakedEdges: false,
      textureType: 'necrotic',
    },
    algerianRiskRegions: ['Tizi Ouzou', 'Béjaïa', 'Boumerdès', 'Guelma', 'Mascara', 'Médéa'],
    inpvProducts: [
      { tradeName: 'Bouillie Bordelaise RSR', activeIngredient: 'Sulfate de Cuivre neutralisé 20%', dosagePerHaOrHl: '1.5 kg/hl', darDays: 14 },
      { tradeName: 'Flint 50 WG', activeIngredient: 'Trifloxystrobine 50%', dosagePerHaOrHl: '0.15 kg/ha', darDays: 21 },
    ],
    biologicalControls: ['Taille d\'aération de la frondaison après récolte', 'Application d\'argile kaolin préventive'],
    faoSeverityThreshold: '>5% infected leaves sampled after autumn rains warrants copper treatment.',
  },
  {
    id: 'sticky-trap-tuta',
    datasetOrigin: 'IP102',
    crop: 'Tomato / Solanaceae',
    crop_ar: 'طماطم / بيوت بلاستيكية',
    crop_fr: 'Tomate sous serre',
    diseaseName: 'Tuta Absoluta Trap Monitoring (IP102 Pest Class #42)',
    diseaseName_ar: 'حصر عثة الطماطم (توتا أبسولوتا) في المصائد الصفراء',
    diseaseName_fr: 'Comptage Piège Englué Mineuse Tuta absoluta',
    pathogenType: 'pest',
    scientificName: 'Tuta absoluta (Meyrick)',
    visualSymptomSignature: {
      lesionShape: 'Dark elongated micro-moths trapped on yellow sticky surface grid (5-7mm adult length)',
      colorSpectrum: ['#0f172a', '#eab308', '#facc15', '#ef4444'],
      concentricRings: false,
      chloroticHalo: false,
      waterSoakedEdges: false,
      textureType: 'pustular',
    },
    algerianRiskRegions: ['Biskra (Sidi Okba)', 'El Oued', 'Mostaganem', 'Tipaza', 'Blida'],
    inpvProducts: [
      { tradeName: 'Proclaim 05 SG', activeIngredient: 'Emamectine benzoate 50 g/kg', dosagePerHaOrHl: '0.25 kg/ha', darDays: 3 },
      { tradeName: 'Coragen 20 SC', activeIngredient: 'Chlorantraniliprole 200 g/L', dosagePerHaOrHl: '175 mL/ha', darDays: 1 },
      { tradeName: 'Affirm Opti', activeIngredient: 'Emamectine benzoate 0.95%', dosagePerHaOrHl: '1.5 kg/ha', darDays: 3 },
    ],
    biologicalControls: ['Lâchers d\'auxiliaires prédateurs Nesidiocoris tenuis / Macrolophus pygmaeus', 'Diffuseurs de phéromones de confusion sexuelle (Isonet T)'],
    faoSeverityThreshold: 'Economic Threshold: ≥10 adults/trap/week triggers immediate biological or bio-rational chemical spray.',
  },
  {
    id: 'citrus-leafminer',
    datasetOrigin: 'PlantDoc',
    crop: 'Citrus',
    crop_ar: 'حمضيات',
    crop_fr: 'Agrumes',
    diseaseName: 'Citrus Leafminer (Phyllocnistis citrella)',
    diseaseName_ar: 'حفارة أوراق الحمضيات (المينوز)',
    diseaseName_fr: 'Mineuse des feuilles des agrumes (Phyllocnistis citrella)',
    pathogenType: 'pest',
    scientificName: 'Phyllocnistis citrella',
    visualSymptomSignature: {
      lesionShape: 'Serpentine silvery translucent mines curling new young shoots with leaf curling and distortion',
      colorSpectrum: ['#e2e8f0', '#94a3b8', '#16a34a', '#ca8a04'],
      concentricRings: false,
      chloroticHalo: false,
      waterSoakedEdges: false,
      textureType: 'mosaic',
    },
    algerianRiskRegions: ['Mitidja (Blida)', 'Chlef', 'Guelma', 'Mostaganem', 'Skikda'],
    inpvProducts: [
      { tradeName: 'Vertimec 018 EC', activeIngredient: 'Abamectine 18 g/L', dosagePerHaOrHl: '0.075 L/hl', darDays: 7 },
      { tradeName: 'Confidor 200 SL', activeIngredient: 'Imidaclopride 200 g/L', dosagePerHaOrHl: '0.05 L/hl', darDays: 14 },
    ],
    biologicalControls: ['Huile blanche minérale en traitement de jeunes pousses', 'Protection des parasitoïdes naturels (Cirrospilus)'],
    faoSeverityThreshold: '>20% young flush shoots showing active mines on young trees under 4 years.',
  },
  {
    id: 'grape-powdery-mildew',
    datasetOrigin: 'PlantVillage',
    crop: 'Grapevine',
    crop_ar: 'كرمة العنب',
    crop_fr: 'Vigne',
    diseaseName: 'Grape Powdery Mildew (Erysiphe necator / Oïdium)',
    diseaseName_ar: 'البياض الدقيقي في العنب (الأوديوم)',
    diseaseName_fr: 'Oïdium de la vigne (Erysiphe necator)',
    pathogenType: 'fungal',
    scientificName: 'Erysiphe necator',
    visualSymptomSignature: {
      lesionShape: 'White to grayish powdery fungal coating covering both sides of leaves and young grape clusters',
      colorSpectrum: ['#f8fafc', '#cbd5e1', '#64748b', '#15803d'],
      concentricRings: false,
      chloroticHalo: false,
      waterSoakedEdges: false,
      textureType: 'powdery',
    },
    algerianRiskRegions: ['Mascara (Tighennif)', 'Médéa (Coteaux)', 'Tlemcen', 'Boumerdès (Dellys)'],
    inpvProducts: [
      { tradeName: 'Thiovit Jet', activeIngredient: 'Soufre micronisé 80%', dosagePerHaOrHl: '5.0 kg/ha', darDays: 3 },
      { tradeName: 'Topas 100 EC', activeIngredient: 'Penconazole 100 g/L', dosagePerHaOrHl: '0.025 L/hl', darDays: 14 },
      { tradeName: 'Luna Experience', activeIngredient: 'Fluopyram 200 g/L + Tébuconazole 200 g/L', dosagePerHaOrHl: '0.375 L/ha', darDays: 14 },
    ],
    biologicalControls: ['Soufre mouillable bio', 'Bicarbonate de potassium (Armicarb)', 'Effeuillage de la zone des grappes'],
    faoSeverityThreshold: 'Preventive treatment from 5-6 leaves stage through bunch closure.',
  },
  {
    id: 'wheat-yellow-rust',
    datasetOrigin: 'PlantWild',
    crop: 'Durum Wheat / Cereals',
    crop_ar: 'قمح صلب / حبوب',
    crop_fr: 'Blé dur / Céréales',
    diseaseName: 'Yellow Stripe Rust (Puccinia striiformis)',
    diseaseName_ar: 'الصدأ الأصفر المخطط في القمح الصلب',
    diseaseName_fr: 'Rouille jaune striée du blé dur (Puccinia striiformis)',
    pathogenType: 'fungal',
    scientificName: 'Puccinia striiformis f. sp. tritici',
    visualSymptomSignature: {
      lesionShape: 'Parallel linear yellow-orange powdery pustules along leaf veins forming stripes',
      colorSpectrum: ['#f97316', '#ea580c', '#eab308', '#166534'],
      concentricRings: false,
      chloroticHalo: true,
      waterSoakedEdges: false,
      textureType: 'pustular',
    },
    algerianRiskRegions: ['Hautes Plaines (Sétif, Bordj Bou Arreridj, Constantine)', 'Tiaret', 'Guelma'],
    inpvProducts: [
      { tradeName: 'Amistar Xtra', activeIngredient: 'Azoxystrobine 200 g/L + Cyproconazole 80 g/L', dosagePerHaOrHl: '0.75 L/ha', darDays: 35 },
      { tradeName: 'Prosaro 250 EC', activeIngredient: 'Prothioconazole 125 g/L + Tébuconazole 125 g/L', dosagePerHaOrHl: '1.0 L/ha', darDays: 35 },
    ],
    biologicalControls: ['Utilisation de variétés résistantes homologuées par l\'ITGC (Bousselem, Carioca, Cirta)', 'Éviter les excès de fumure azotée au tallage'],
    faoSeverityThreshold: 'First pustules on F3 leaf before heading requires immediate field-scale fungicidal coverage.',
  },
];
