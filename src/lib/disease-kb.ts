/**
 * Disease Knowledge Base — adapted from AgroAI's disease_kb.json
 * (https://github.com/Aniket-Asawale/AgroAI---AI-and-Automation-in-Agriculture)
 *
 * Extended with Algerian-specific diseases from our INPV 2017 phyto data
 * and algeria-phyto-data.ts. Each disease entry includes:
 *   - crop: crop name (EN)
 *   - cropAr: crop name (AR)
 *   - type: Fungal / Bacterial / Viral / Insect Pest / Healthy / Physiological
 *   - symptoms: list of observable symptoms (what the farmer sees)
 *   - chemical_treatment: { medicine, dosage, frequency }
 *   - organic_treatment: { medicine, dosage }
 *   - precautions: list of preventive measures
 *   - inpvActives: matching INPV-registered active substances (from our data)
 *
 * Source: AgroAI MIT-licensed disease_kb.json + INPV 2017 catalogue.
 * Adapted for Algerian crops (wheat, barley, maize, potato, tomato, citrus,
 * olive, vine, datepalm) — Indian-specific crops (sugarcane, millet, ragi)
 * kept as reference but marked with `regional: false`.
 */

export interface DiseaseTreatment {
  medicine: string;
  dosage: string;
  frequency?: string;
}

export interface DiseaseEntry {
  id: string;
  crop: string;
  cropAr: string;
  type: 'Fungal' | 'Bacterial' | 'Viral' | 'Insect Pest' | 'Healthy' | 'Physiological';
  symptoms: string[];
  chemical_treatment: DiseaseTreatment;
  organic_treatment: DiseaseTreatment;
  precautions: string[];
  /** Matching INPV-registered active substances (from our enriched data). */
  inpvActives?: string[];
  /** Whether this disease is relevant to Algeria. */
  regional: boolean;
}

export const DISEASE_KB: DiseaseEntry[] = [
  // === WHEAT (Algerian) ===
  {
    id: 'wheat_yellow_rust',
    crop: 'Wheat',
    cropAr: 'القمح',
    type: 'Fungal',
    symptoms: ['Yellow stripes on leaves', 'Orange pustules in rows', 'Premature leaf drying'],
    chemical_treatment: { medicine: 'Propiconazole', dosage: '1 ml/L', frequency: '2 sprays' },
    organic_treatment: { medicine: 'Sulphur', dosage: '3-5 kg/ha' },
    precautions: ['Use resistant varieties', 'Early planting', 'Monitor during cool humid weather'],
    inpvActives: ['propiconazole', 'tebuconazole', 'azoxystrobin'],
    regional: true,
  },
  {
    id: 'wheat_brown_rust',
    crop: 'Wheat',
    cropAr: 'القمح',
    type: 'Fungal',
    symptoms: ['Reddish-brown pustules', 'Rust on stems', 'Reduced grain fill'],
    chemical_treatment: { medicine: 'Propiconazole', dosage: '1 ml/L', frequency: '2 sprays' },
    organic_treatment: { medicine: 'Neem oil', dosage: '3 ml/L' },
    precautions: ['Use resistant varieties', 'Destroy infected debris'],
    inpvActives: ['propiconazole', 'tebuconazole'],
    regional: true,
  },
  {
    id: 'wheat_fusarium_head_blight',
    crop: 'Wheat',
    cropAr: 'القمح',
    type: 'Fungal',
    symptoms: ['Bleached spikelets', 'Pink/orange mold on grains', 'Shrivelled grains'],
    chemical_treatment: { medicine: 'Azoxystrobin', dosage: '1 ml/L', frequency: '1 spray at flowering' },
    organic_treatment: { medicine: 'Trichoderma viride', dosage: '5 g/L' },
    precautions: ['Crop rotation', 'Avoid maize as preceding crop', 'Monitor at flowering'],
    inpvActives: ['azoxystrobin', 'prothioconazole'],
    regional: true,
  },
  {
    id: 'wheat_septoria',
    crop: 'Wheat',
    cropAr: 'القمح',
    type: 'Fungal',
    symptoms: ['Gray lesions with black pycnidia', 'Yellow halos', 'Leaf necrosis'],
    chemical_treatment: { medicine: 'Azoxystrobin', dosage: '1 ml/L', frequency: '2 sprays' },
    organic_treatment: { medicine: 'Compost tea', dosage: 'Weekly spray' },
    precautions: ['Crop rotation', 'Good drainage', 'Resistant varieties'],
    inpvActives: ['azoxystrobin', 'chlorothalonil'],
    regional: true,
  },
  {
    id: 'wheat_aphid',
    crop: 'Wheat',
    cropAr: 'القمح',
    type: 'Insect Pest',
    symptoms: ['Clusters of green/black insects on ears', 'Sticky honeydew', 'Curled leaves'],
    chemical_treatment: { medicine: 'Imidacloprid', dosage: '0.3-0.5 L/ha' },
    organic_treatment: { medicine: 'Neem oil', dosage: '3 ml/L' },
    precautions: ['Encourage beneficial insects', 'Monitor at heading', 'Avoid broad-spectrum sprays'],
    inpvActives: ['imidacloprid', 'acetamipride', 'lambda-cyhalothrine'],
    regional: true,
  },

  // === MAIZE / CORN (Algerian) ===
  {
    id: 'corn_blight',
    crop: 'Maize',
    cropAr: 'الذرة',
    type: 'Fungal',
    symptoms: ['Long cigar-shaped lesions', 'Gray-green leaf spots', 'Premature drying of leaves'],
    chemical_treatment: { medicine: 'Mancozeb 75% WP', dosage: '2.5 g/L', frequency: '2 sprays at 10-day interval' },
    organic_treatment: { medicine: 'Trichoderma viride', dosage: '5 g/L' },
    precautions: ['Use resistant varieties', 'Avoid overhead irrigation', 'Consult local agricultural officer'],
    inpvActives: ['mancozebe', 'azoxystrobine'],
    regional: true,
  },
  {
    id: 'corn_common_rust',
    crop: 'Maize',
    cropAr: 'الذرة',
    type: 'Fungal',
    symptoms: ['Reddish-brown pustules', 'Yellow halos', 'Reduced photosynthesis'],
    chemical_treatment: { medicine: 'Propiconazole', dosage: '1 ml/L', frequency: '2 sprays' },
    organic_treatment: { medicine: 'Neem oil', dosage: '3 ml/L' },
    precautions: ['Early monitoring', 'Destroy infected debris'],
    inpvActives: ['propiconazole', 'mancozebe'],
    regional: true,
  },

  // === POTATO (Algerian) ===
  {
    id: 'potato_late_blight',
    crop: 'Potato',
    cropAr: 'البطاطا',
    type: 'Fungal',
    symptoms: ['Water-soaked dark lesions on leaves', 'White mold on underside', 'Rapid vine collapse'],
    chemical_treatment: { medicine: 'Metalaxyl-M + Mancozeb', dosage: '2.5 g/L', frequency: '3 sprays at 7-day interval' },
    organic_treatment: { medicine: 'Copper hydroxide', dosage: '3 g/L' },
    precautions: ['Use certified seed', 'Monitor humidity > 90%', 'Destroy volunteer plants'],
    inpvActives: ['metalaxyl-m', 'mancozebe', 'cymoxanil', 'fluopicolide'],
    regional: true,
  },
  {
    id: 'potato_early_blight',
    crop: 'Potato',
    cropAr: 'البطاطا',
    type: 'Fungal',
    symptoms: ['Concentric ring lesions (target spots)', 'Yellow halos', 'Lower leaf yellowing'],
    chemical_treatment: { medicine: 'Azoxystrobin', dosage: '1 ml/L', frequency: '2 sprays' },
    organic_treatment: { medicine: 'Copper hydroxide', dosage: '3 g/L' },
    precautions: ['Crop rotation', 'Avoid water stress', 'Remove infected foliage'],
    inpvActives: ['azoxystrobine', 'mancozebe', 'chlorothalonil'],
    regional: true,
  },

  // === TOMATO (Algerian) ===
  {
    id: 'tomato_early_blight',
    crop: 'Tomato',
    cropAr: 'الطماطم',
    type: 'Fungal',
    symptoms: ['Concentric ring lesions on leaves', 'Stem cankers', 'Fruit rot'],
    chemical_treatment: { medicine: 'Azoxystrobin', dosage: '1 ml/L', frequency: '2 sprays' },
    organic_treatment: { medicine: 'Copper hydroxide', dosage: '3 g/L' },
    precautions: ['Crop rotation', 'Staking for air flow', 'Remove infected leaves'],
    inpvActives: ['azoxystrobine', 'mancozebe', 'chlorothalonil'],
    regional: true,
  },
  {
    id: 'tomato_late_blight',
    crop: 'Tomato',
    cropAr: 'الطماطم',
    type: 'Fungal',
    symptoms: ['Large dark lesions on leaves', 'White sporulation on underside', 'Fruit browning'],
    chemical_treatment: { medicine: 'Metalaxyl-M + Mancozeb', dosage: '2.5 g/L', frequency: '3 sprays at 7-day interval' },
    organic_treatment: { medicine: 'Copper hydroxide', dosage: '3 g/L' },
    precautions: ['Avoid overhead irrigation', 'Use resistant varieties', 'Monitor humidity'],
    inpvActives: ['metalaxyl-m', 'mancozebe', 'cymoxanil'],
    regional: true,
  },

  // === CITRUS (Algerian) ===
  {
    id: 'citrus_scale',
    crop: 'Citrus',
    cropAr: 'الحمضيات',
    type: 'Insect Pest',
    symptoms: ['Brown/white scales on branches', 'Yellowing leaves', 'Sticky honeydew on fruit'],
    chemical_treatment: { medicine: 'Chlorpyrifos', dosage: '30-50 ml/hl', frequency: '1 spray' },
    organic_treatment: { medicine: 'Mineral oil', dosage: '1-2%' },
    precautions: ['Monitor from May', 'Encourage parasitic wasps', 'Prune infested branches'],
    inpvActives: ['chlorpyrifos', 'spirotetramat', 'pyriproxyfen', 'mineral-oil'],
    regional: true,
  },
  {
    id: 'citrus_leafminer',
    crop: 'Citrus',
    cropAr: 'الحمضيات',
    type: 'Insect Pest',
    symptoms: ['Serpentine mines in young leaves', 'Curled distorted flush', 'Reduced growth'],
    chemical_treatment: { medicine: 'Imidacloprid', dosage: '0.3-0.5 L/ha' },
    organic_treatment: { medicine: 'Azadirachtin', dosage: '3 ml/L' },
    precautions: ['Monitor new flush', 'Avoid spraying during bloom', 'Use pheromone traps'],
    inpvActives: ['imidacloprid', 'abamectine', 'azadirachtine'],
    regional: true,
  },

  // === OLIVE (Algerian) ===
  {
    id: 'olive_fruit_fly',
    crop: 'Olive',
    cropAr: 'الزيتون',
    type: 'Insect Pest',
    symptoms: ['Sting marks on olives', 'Brown tunnels in fruit', 'Premature fruit drop'],
    chemical_treatment: { medicine: 'Deltamethrin', dosage: '50 ml/hl', frequency: '2 sprays' },
    organic_treatment: { medicine: 'Spinosad', dosage: '0.2 L/ha' },
    precautions: ['Deploy pheromone traps from June', 'Harvest early', 'Remove fallen fruit'],
    inpvActives: ['deltamethrine', 'lambda-cyhalothrine', 'spinosad', 'dimethoate'],
    regional: true,
  },

  // === VINE / GRAPE (Algerian) ===
  {
    id: 'vine_powdery_mildew',
    crop: 'Vine',
    cropAr: 'الكروم',
    type: 'Fungal',
    symptoms: ['White powdery patches on leaves', 'Bloom on grape clusters', 'Cracked berries'],
    chemical_treatment: { medicine: 'Sulphur', dosage: '3-5 kg/ha', frequency: '3-4 sprays' },
    organic_treatment: { medicine: 'Sulphur', dosage: '5 kg/ha' },
    precautions: ['Prune for air flow', 'Monitor during warm dry weather', 'Remove infected canes'],
    inpvActives: ['sulphur', 'myclobutanil', 'quinoxyfen'],
    regional: true,
  },
  {
    id: 'vine_downy_mildew',
    crop: 'Vine',
    cropAr: 'الكروم',
    type: 'Fungal',
    symptoms: ['Yellow oil spots on upper leaf', 'White mold on underside', 'Brown necrotic patches'],
    chemical_treatment: { medicine: 'Mancozeb', dosage: '2.5 g/L', frequency: '3 sprays at 10-day interval' },
    organic_treatment: { medicine: 'Copper hydroxide', dosage: '3 g/L' },
    precautions: ['Monitor humidity > 95%', 'Prune for air flow', 'Remove infected leaves'],
    inpvActives: ['mancozebe', 'metalaxyl-m', 'cymoxanil', 'folpet'],
    regional: true,
  },

  // === DATE PALM (Algerian) ===
  {
    id: 'datepalm_bayoud',
    crop: 'Date Palm',
    cropAr: 'نخيل التمر',
    type: 'Fungal',
    symptoms: ['One-sided wilting of fronds', 'Brown discoloration of vascular tissue', 'Drying of central bud'],
    chemical_treatment: { medicine: 'No chemical cure — resistant varieties only', dosage: 'N/A' },
    organic_treatment: { medicine: 'Tissue-cultured resistant cultivars', dosage: 'Plant resistant varieties' },
    precautions: ['Use resistant cultivars (e.g. Bechara)', 'Avoid contaminated irrigation', 'Sanitize tools'],
    inpvActives: [],
    regional: true,
  },

  // === RICE (reference — from AgroAI) ===
  {
    id: 'rice_bacterialblight',
    crop: 'Rice',
    cropAr: 'الأرز',
    type: 'Bacterial',
    symptoms: ['Yellowing leaf margins', 'Wilting', 'Water-soaked lesions'],
    chemical_treatment: { medicine: 'Copper hydroxide', dosage: '2 g/L', frequency: '2 sprays' },
    organic_treatment: { medicine: 'Trichoderma viride', dosage: '5 g/L' },
    precautions: ['Use resistant varieties', 'Avoid overhead irrigation', 'Field sanitation'],
    inpvActives: ['copper-hydroxide'],
    regional: false,
  },
  {
    id: 'rice_brownspot',
    crop: 'Rice',
    cropAr: 'الأرز',
    type: 'Fungal',
    symptoms: ['Oval brown spots on leaves', 'Dark brown margins', 'Grain discoloration'],
    chemical_treatment: { medicine: 'Mancozeb', dosage: '2.5 g/L', frequency: '2 sprays' },
    organic_treatment: { medicine: 'Compost tea', dosage: 'Weekly spray' },
    precautions: ['Balanced fertilization', 'Use certified seed', 'Crop rotation'],
    inpvActives: ['mancozebe'],
    regional: false,
  },

  // === SUGARCANE (reference — from AgroAI) ===
  {
    id: 'sugarcane_red_rot',
    crop: 'Sugarcane',
    cropAr: 'قصب السكر',
    type: 'Fungal',
    symptoms: ['Red lesions in stem pith', 'White patches in internodes', 'Top drying'],
    chemical_treatment: { medicine: 'Carbendazim', dosage: '1 g/L', frequency: '2 sprays' },
    organic_treatment: { medicine: 'Trichoderma viride', dosage: '5 g/L' },
    precautions: ['Use disease-free setts', 'Crop rotation', 'Rogue infected stools'],
    regional: false,
  },
];

/** Get all diseases for a specific crop. */
export function getDiseasesByCrop(crop: string): DiseaseEntry[] {
  const cropLower = crop.toLowerCase();
  return DISEASE_KB.filter(d =>
    d.crop.toLowerCase() === cropLower ||
    d.cropAr === crop
  );
}

/** Get all unique crops from the knowledge base. */
export function getDiseaseKBCrops(): string[] {
  return [...new Set(DISEASE_KB.filter(d => d.regional).map(d => d.crop))].sort();
}

/** Search diseases by symptom keyword. */
export function searchDiseasesBySymptom(keyword: string): DiseaseEntry[] {
  const kw = keyword.toLowerCase();
  return DISEASE_KB.filter(d =>
    d.symptoms.some(s => s.toLowerCase().includes(kw)) ||
    d.crop.toLowerCase().includes(kw) ||
    d.type.toLowerCase().includes(kw)
  );
}
