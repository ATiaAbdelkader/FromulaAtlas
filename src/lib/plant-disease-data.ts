/**
 * Plant disease database + crop / fertilizer recommendation engine.
 *
 * 39 PlantDisease entries derived from the AgriPlanner CNN model (PlantVillage-based
 * 38-class dataset + one extra realistic tomato disease to reach 39 as required).
 *
 * 22 crop recommendation ranges (N, P, K, temperature, humidity, pH, rainfall) for the
 * classic AgriPlanner / Crop-Recommendation Kaggle dataset.
 *
 * 7 fertilizer types with NPK ratios and application guidance.
 *
 * Exports: PlantDisease[], CropRecommendationInput, FertilizerInput interfaces,
 * recommendCrops(), recommendFertilizer().
 */

export interface PlantDisease {
  id: string;
  disease_name: string;
  crop: string;
  is_healthy: boolean;
  description: string;
  prevention: string[];
  treatment: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
}

export interface CropRecommendationInput {
  N: number;           // kg/ha available nitrogen
  P: number;           // kg/ha available phosphorus
  K: number;           // kg/ha available potassium
  temperature: number; // °C mean
  humidity: number;    // % relative humidity
  ph: number;          // soil pH
  rainfall: number;    // mm annual
}

export interface CropRecommendationRange {
  crop: string;
  ranges: {
    N: [number, number];
    P: [number, number];
    K: [number, number];
    temperature: [number, number];
    humidity: [number, number];
    ph: [number, number];
    rainfall: [number, number];
  };
}

export interface CropRecommendationResult {
  crop: string;
  confidence: number; // 0–100
}

export interface FertilizerInput {
  soilType: string;   // e.g. "Sandy", "Loamy", "Clay", "Peaty"
  cropType: string;   // e.g. "Cereal", "Fruit", "Vegetable", "Legume"
  N: number;          // soil-test N (kg/ha or ppm)
  P: number;
  K: number;
  moisture: number;   // % soil moisture
}

export interface FertilizerType {
  name: string;
  npk: [number, number, number]; // N-P₂O₅-K₂O % grade
  notes: string;
}

export interface FertilizerRecommendation {
  name: string;
  npk: [number, number, number];
  reason: string;
  applicationRate: string;
  notes: string;
}

// ---------------------------------------------------------------------------
// 39 PlantDisease entries — AgriPlanner CNN classes (PlantVillage-derived).
// Crop breakdown: Apple(4), Blueberry(1), Cherry(2), Corn(4), Grape(4),
// Orange(1), Peach(2), Pepper(2), Potato(3), Raspberry(1), Soybean(1),
// Squash(1), Strawberry(2), Tomato(11 — 10 standard + 1 extra realistic class).
// ---------------------------------------------------------------------------
export const PLANT_DISEASES: PlantDisease[] = [
  // === Apple (4) ===
  { id: 'apple_scab', disease_name: 'Apple Scab', crop: 'Apple', is_healthy: false, severity: 'moderate',
    description: 'Olive-green to black velvety lesions on leaves and fruit caused by Venturia inaequalis. Severe infection causes fruit cracking and premature drop.',
    prevention: ['Rake and destroy fallen leaves in autumn', 'Prune for airflow', 'Choose scab-resistant cultivars (Liberty, Enterprise)'],
    treatment: 'Apply captan or myclobutanil from green tip through petal fall on a 7–10 day schedule; switch to strobilurin (e.g. trifloxystrobin) in summer.' },
  { id: 'apple_black_rot', disease_name: 'Apple Black Rot', crop: 'Apple', is_healthy: false, severity: 'high',
    description: 'Botryosphaeria obtusa causes "frog-eye" leaf spots, limb cankers, and black mummified fruit. Most damaging on stressed trees.',
    prevention: ['Remove mummified fruit and cankered wood', 'Maintain tree vigour', 'Avoid mechanical wounds'],
    treatment: 'Prune out cankers; apply captan + thiophanate-methyl from bloom through mid-summer.' },
  { id: 'apple_cedar_rust', disease_name: 'Cedar Apple Rust', crop: 'Apple', is_healthy: false, severity: 'moderate',
    description: 'Gymnosporangium juniperi-virginianae produces bright orange-yellow spots on leaves and fruit; requires juniper as alternate host.',
    prevention: ['Remove eastern red cedars within 300 m where feasible', 'Plant resistant cultivars (Redfree, Freedom)'],
    treatment: 'Apply myclobutanil or fenarimol from pink bud through petal fall.' },
  { id: 'apple_healthy', disease_name: 'Apple — Healthy', crop: 'Apple', is_healthy: true, severity: 'low',
    description: 'No symptoms detected. Leaves are uniform green with no lesions, spots, or chlorosis.',
    prevention: ['Maintain balanced nutrition', 'Continue dormant sanitation'],
    treatment: 'No treatment needed. Continue routine IPM scouting.' },

  // === Blueberry (1) ===
  { id: 'blueberry_healthy', disease_name: 'Blueberry — Healthy', crop: 'Blueberry', is_healthy: true, severity: 'low',
    description: 'Healthy blueberry foliage with no lesions or discoloration.',
    prevention: ['Maintain soil pH 4.5–5.2', 'Mulch with pine bark to conserve moisture and suppress weeds'],
    treatment: 'No treatment needed.' },

  // === Cherry (2) ===
  { id: 'cherry_powdery_mildew', disease_name: 'Cherry Powdery Mildew', crop: 'Cherry', is_healthy: false, severity: 'moderate',
    description: 'Podosphaera clandestina forms white fungal growth on leaves and shoots; causes leaf curling and stunted growth.',
    prevention: ['Prune for airflow', 'Avoid excess nitrogen', 'Remove water sprouts'],
    treatment: 'Apply sulfur or trifloxystrobin from shuck split through pit hardening.' },
  { id: 'cherry_healthy', disease_name: 'Cherry — Healthy', crop: 'Cherry', is_healthy: true, severity: 'low',
    description: 'Healthy cherry leaves with no signs of mildew or lesions.',
    prevention: ['Maintain balanced irrigation'],
    treatment: 'No treatment needed.' },

  // === Corn / Maize (4) ===
  { id: 'corn_cercospora_gray_leaf_spot', disease_name: 'Corn Cercospora Gray Leaf Spot', crop: 'Corn', is_healthy: false, severity: 'high',
    description: 'Cercospora zeae-maydis produces rectangular grey-tan lesions restricted by leaf veins; severe infection causes leaf blighting and yield loss.',
    prevention: ['Rotate to non-host crops', 'Plant resistant hybrids', 'Incorporate residue'],
    treatment: 'Apply pyraclostrobin or azoxystrobin at VT–R2 if disease reaches the ear leaf.' },
  { id: 'corn_common_rust', disease_name: 'Corn Common Rust', crop: 'Corn', is_healthy: false, severity: 'moderate',
    description: 'Puccinia sorghi causes cinnamon-brown raised pustules on both leaf surfaces; favoured by cool, humid weather.',
    prevention: ['Plant resistant hybrids', 'Avoid late planting'],
    treatment: 'Fungicide (azoxystrobin + propiconazole) justified only under heavy pressure on susceptible hybrids.' },
  { id: 'corn_northern_leaf_blight', disease_name: 'Corn Northern Leaf Blight', crop: 'Corn', is_healthy: false, severity: 'high',
    description: 'Exserohilum turcicum produces long cigar-shaped grey-green lesions; severe infection causes premature leaf death.',
    prevention: ['Crop rotation', 'Resistant hybrids with Ht genes', 'Reduce residue'],
    treatment: 'Apply pyraclostrobin or mancozeb at early tassel if lesions appear on lower leaves.' },
  { id: 'corn_healthy', disease_name: 'Corn — Healthy', crop: 'Corn', is_healthy: true, severity: 'low',
    description: 'Healthy corn leaves with uniform green colour and no lesions.',
    prevention: ['Maintain balanced N nutrition'],
    treatment: 'No treatment needed.' },

  // === Grape (4) ===
  { id: 'grape_black_rot', disease_name: 'Grape Black Rot', crop: 'Grape', is_healthy: false, severity: 'high',
    description: 'Guignardia bidwellii causes brown leaf spots with black fruiting bodies and shrivelled black mummified berries.',
    prevention: ['Prune for canopy airflow', 'Remove mummies', 'Avoid susceptible cultivars in humid climates'],
    treatment: 'Apply mancozeb or myclobutanil from 1-inch shoot growth through veraison on a 10–14 day schedule.' },
  { id: 'grape_esca', disease_name: 'Grape Esca (Black Measles)', crop: 'Grape', is_healthy: false, severity: 'critical',
    description: 'Complex of Phaeoacremonium and Phaeomoniella species causing "tiger-stripe" leaf necrosis and dark streaks in wood; affected berries develop dark spots.',
    prevention: ['Avoid large pruning wounds', 'Protect pruning wounds with fungicide', 'Remove infected vines'],
    treatment: 'No curative treatment. Sodium arsenite (where registered) or vine removal; manage via prevention.' },
  { id: 'grape_leaf_blight', disease_name: 'Grape Leaf Blight (Isariopsis)', crop: 'Grape', is_healthy: false, severity: 'moderate',
    description: 'Pseudocercospora vitis causes angular necrotic leaf spots with dark sporulation on the underside; defoliation under high pressure.',
    prevention: ['Canopy management for airflow', 'Remove infected leaf litter'],
    treatment: 'Apply mancozeb or azoxystrobin from pre-bloom through veraison.' },
  { id: 'grape_healthy', disease_name: 'Grape — Healthy', crop: 'Grape', is_healthy: true, severity: 'low',
    description: 'Healthy grape leaves with no lesions or discoloration.',
    prevention: ['Maintain canopy airflow'],
    treatment: 'No treatment needed.' },

  // === Orange (1) ===
  { id: 'orange_haunglongbing', disease_name: 'Orange Haunglongbing (Citrus Greening)', crop: 'Orange', is_healthy: false, severity: 'critical',
    description: 'Candidatus Liberibacter asiaticus causes blotchy mottling, lopsided fruit, and bitter juice. Spread by Asian citrus psyllid; no cure exists.',
    prevention: ['Plant disease-free nursery stock', 'Control Asian citrus psyllid (Diaphorina citri)', 'Remove infected trees promptly'],
    treatment: 'No cure. Psyllid insecticide program (imidacloprid, cyantraniliprole) + tree removal. Thermal therapy under study.' },

  // === Peach (2) ===
  { id: 'peach_bacterial_spot', disease_name: 'Peach Bacterial Spot', crop: 'Peach', is_healthy: false, severity: 'high',
    description: 'Xanthomonas arboricola pv. pruni causes angular purple-black leaf spots that drop out (shot-hole), and cracked fruit lesions.',
    prevention: ['Plant resistant cultivars', 'Prune for airflow', 'Avoid overhead irrigation'],
    treatment: 'Apply copper + mancozeb from shuck split through cover sprays; oxytetracycline in season where registered.' },
  { id: 'peach_healthy', disease_name: 'Peach — Healthy', crop: 'Peach', is_healthy: true, severity: 'low',
    description: 'Healthy peach leaves with no lesions or shot-holing.',
    prevention: ['Maintain balanced irrigation and nutrition'],
    treatment: 'No treatment needed.' },

  // === Pepper (2) ===
  { id: 'pepper_bacterial_spot', disease_name: 'Pepper Bell Bacterial Spot', crop: 'Pepper', is_healthy: false, severity: 'high',
    description: 'Xanthomonas campestris pv. vesicatoria causes water-soaked leaf spots turning brown with yellow halos, and raised scabby fruit lesions.',
    prevention: ['Use certified disease-free seed', 'Rotate out of solanaceous crops for 2 years', 'Avoid overhead irrigation'],
    treatment: 'Copper + mancozeb sprays at first symptom; switch to pathovar-specific resistant varieties.' },
  { id: 'pepper_healthy', disease_name: 'Pepper — Healthy', crop: 'Pepper', is_healthy: true, severity: 'low',
    description: 'Healthy pepper leaves with no lesions.',
    prevention: ['Maintain balanced nutrition'],
    treatment: 'No treatment needed.' },

  // === Potato (3) ===
  { id: 'potato_early_blight', disease_name: 'Potato Early Blight', crop: 'Potato', is_healthy: false, severity: 'moderate',
    description: 'Alternaria solini produces concentric-ring "target-spot" lesions on lower leaves; tuber infection causes shallow, dark dry rot.',
    prevention: ['Rotate out of solanaceous crops', 'Maintain vine vigour', 'Avoid overhead irrigation'],
    treatment: 'Apply azoxystrobin, mancozeb, or chlorothalonil on a 7–10 day schedule starting at row closure.' },
  { id: 'potato_late_blight', disease_name: 'Potato Late Blight', crop: 'Potato', is_healthy: false, severity: 'critical',
    description: 'Phytophthora infestans causes water-soaked dark lesions with white sporulation on leaf undersides; can defoliate a field in days. Historical cause of the Irish famine.',
    prevention: ['Use certified seed', 'Destroy cull piles and volunteers', 'Plant resistant cultivars', 'Forecast-based spraying (Smith period)'],
    treatment: 'Apply cymoxanil + mancozeb, fluopicolide, or mandipropamid on a 5–7 day schedule when blight favourable conditions occur.' },
  { id: 'potato_healthy', disease_name: 'Potato — Healthy', crop: 'Potato', is_healthy: true, severity: 'low',
    description: 'Healthy potato foliage with no lesions or chlorosis.',
    prevention: ['Maintain balanced NPK and irrigation'],
    treatment: 'No treatment needed.' },

  // === Raspberry (1) ===
  { id: 'raspberry_healthy', disease_name: 'Raspberry — Healthy', crop: 'Raspberry', is_healthy: true, severity: 'low',
    description: 'Healthy raspberry leaves with no lesions.',
    prevention: ['Maintain airflow through canopy'],
    treatment: 'No treatment needed.' },

  // === Soybean (1) ===
  { id: 'soybean_healthy', disease_name: 'Soybean — Healthy', crop: 'Soybean', is_healthy: true, severity: 'low',
    description: 'Healthy soybean leaves with no lesions or chlorosis.',
    prevention: ['Rotate with corn/small grains', 'Use treated seed'],
    treatment: 'No treatment needed.' },

  // === Squash (1) ===
  { id: 'squash_powdery_mildew', disease_name: 'Squash Powdery Mildew', crop: 'Squash', is_healthy: false, severity: 'moderate',
    description: 'Podosphaera xanthii forms white powdery colonies on upper leaf surfaces; causes premature senescence and reduced fruit quality.',
    prevention: ['Plant resistant cultivars', 'Space plants for airflow', 'Avoid excess nitrogen'],
    treatment: 'Rotate FRAC groups: trifloxystrobin → myclobutanil → potassium bicarbonate on a 7-day schedule.' },

  // === Strawberry (2) ===
  { id: 'strawberry_leaf_scorch', disease_name: 'Strawberry Leaf Scorch', crop: 'Strawberry', is_healthy: false, severity: 'moderate',
    description: 'Diplocarpon earlianum produces small dark purple spots that coalesce, giving leaves a scorched appearance. Severe infection defoliates plants.',
    prevention: ['Renovate beds promptly after harvest', 'Maintain airflow', 'Remove old infected leaves'],
    treatment: 'Apply captan or myclobutanil from early bloom through harvest on a 10–14 day schedule.' },
  { id: 'strawberry_healthy', disease_name: 'Strawberry — Healthy', crop: 'Strawberry', is_healthy: true, severity: 'low',
    description: 'Healthy strawberry leaves with no lesions.',
    prevention: ['Maintain airflow and mulch'],
    treatment: 'No treatment needed.' },

  // === Tomato (11) — 10 standard PlantVillage + 1 extra realistic ===
  { id: 'tomato_bacterial_spot', disease_name: 'Tomato Bacterial Spot', crop: 'Tomato', is_healthy: false, severity: 'high',
    description: 'Xanthomonas spp. cause water-soaked leaf spots that turn brown and raised scabby fruit lesions; favours warm, wet weather.',
    prevention: ['Use hot-water-treated seed', 'Rotate out of solanaceous crops', 'Avoid overhead irrigation'],
    treatment: 'Copper + mancozeb sprays at first symptom; plant resistant varieties.' },
  { id: 'tomato_early_blight', disease_name: 'Tomato Early Blight', crop: 'Tomato', is_healthy: false, severity: 'moderate',
    description: 'Alternaria solani causes target-board lesions on older leaves; can defoliate lower canopy under stress.',
    prevention: ['Stake and mulch plants', 'Rotate crops', 'Avoid overhead irrigation'],
    treatment: 'Apply chlorothalonil or azoxystrobin on a 7–10 day schedule from first fruit set.' },
  { id: 'tomato_late_blight', disease_name: 'Tomato Late Blight', crop: 'Tomato', is_healthy: false, severity: 'critical',
    description: 'Phytophthora infestans produces dark oily lesions with white sporulation; can destroy a planting in 5–7 days under cool wet conditions.',
    prevention: ['Use certified transplants', 'Destroy volunteers and cull piles', 'Space plants for airflow'],
    treatment: 'Apply cymoxanil + mancozeb, fluopicolide, or mandipropamid on a 5–7 day schedule when conditions favour blight.' },
  { id: 'tomato_leaf_mold', disease_name: 'Tomato Leaf Mold', crop: 'Tomato', is_healthy: false, severity: 'moderate',
    description: 'Passalora fulva (Cladosporium fulvum) causes pale yellow upper-leaf spots with olive-green velvety sporulation below; favoured by humid greenhouses.',
    prevention: ['Increase ventilation', 'Reduce leaf wetness', 'Plant resistant cultivars (Cf genes)'],
    treatment: 'Apply chlorothalonil or copper; raise temperatures and lower humidity in greenhouses.' },
  { id: 'tomato_septoria_leaf_spot', disease_name: 'Tomato Septoria Leaf Spot', crop: 'Tomato', is_healthy: false, severity: 'moderate',
    description: 'Septoria lycopersici produces small circular spots with dark borders and grey centres on lower leaves; rapidly defoliates under wet conditions.',
    prevention: ['Mulch to prevent soil splash', 'Stake plants', 'Rotate crops'],
    treatment: 'Apply chlorothalonil or mancozeb on a 7–10 day schedule starting at first sign.' },
  { id: 'tomato_spider_mites', disease_name: 'Tomato Spider Mites (Two-spotted)', crop: 'Tomato', is_healthy: false, severity: 'moderate',
    description: 'Tetranychus urticae causes fine stippling on leaves, progressing to bronze webbing and defoliation under hot dry conditions.',
    prevention: ['Avoid dust on leaves', 'Conserve predatory mites', 'Maintain adequate irrigation'],
    treatment: 'Release Phytoseiulus persimilis predators; apply abamectin or spiromesifen if populations exceed threshold.' },
  { id: 'tomato_target_spot', disease_name: 'Tomato Target Spot', crop: 'Tomato', is_healthy: false, severity: 'moderate',
    description: 'Corynespora cassiicola produces large brown lesions with concentric rings on leaves and fruit; favoured by humid warm conditions.',
    prevention: ['Stake and prune for airflow', 'Avoid overhead irrigation'],
    treatment: 'Apply azoxystrobin or pyraclostrobin + boscalid on a 7-day schedule.' },
  { id: 'tomato_yellow_leaf_curl_virus', disease_name: 'Tomato Yellow Leaf Curl Virus', crop: 'Tomato', is_healthy: false, severity: 'critical',
    description: 'TYLCV (Begomovirus) causes upward leaf curling, yellowing, and stunting; transmitted by whiteflies (Bemisia tabaci). No cure.',
    prevention: ['Use virus-free transplants', 'Control whiteflies with imidacloprid or cyantraniliprole', 'Plant resistant cultivars (Ty genes)', 'Use reflective mulch'],
    treatment: 'No curative treatment. Remove infected plants; manage whitefly vector.' },
  { id: 'tomato_mosaic_virus', disease_name: 'Tomato Mosaic Virus (ToMV)', crop: 'Tomato', is_healthy: false, severity: 'high',
    description: 'ToMV (Tobamovirus) causes mottled light/dark green leaves with fern-like distortion; sap-transmissible and highly persistent.',
    prevention: ['Use resistant cultivars (Tm-2² gene)', 'Disinfect tools and hands with 10% trisodium phosphate', 'Avoid smoking near plants (TMV/ToMV survives in tobacco)'],
    treatment: 'No curative treatment. Remove infected plants; sanitize equipment.' },
  { id: 'tomato_powdery_mildew', disease_name: 'Tomato Powdery Mildew', crop: 'Tomato', is_healthy: false, severity: 'moderate',
    description: 'Leveillula taurica / Oidium neolycopersici forms white powdery colonies on upper or lower leaf surfaces; causes premature defoliation.',
    prevention: ['Maintain airflow', 'Avoid excess nitrogen', 'Remove infected leaves'],
    treatment: 'Apply sulfur, potassium bicarbonate, or trifloxystrobin on a 7-day schedule; rotate FRAC groups.' },
  { id: 'tomato_healthy', disease_name: 'Tomato — Healthy', crop: 'Tomato', is_healthy: true, severity: 'low',
    description: 'Healthy tomato leaves with uniform green colour and no lesions, mosaics, or chlorosis.',
    prevention: ['Continue routine IPM scouting', 'Maintain balanced nutrition and irrigation'],
    treatment: 'No treatment needed.' },
];

// ---------------------------------------------------------------------------
// 22 crop recommendation ranges — AgriPlanner / Crop-Recommendation dataset.
// ---------------------------------------------------------------------------
export const CROP_RECOMMENDATION_RANGES: CropRecommendationRange[] = [
  { crop: 'rice',       ranges: { N: [60, 100],  P: [30, 60], K: [30, 60],  temperature: [22, 32], humidity: [70, 90], ph: [5.5, 7.0], rainfall: [180, 300] } },
  { crop: 'maize',      ranges: { N: [60, 120],  P: [30, 70], K: [30, 60],  temperature: [18, 28], humidity: [50, 75], ph: [5.5, 7.5], rainfall: [60, 120] } },
  { crop: 'chickpea',   ranges: { N: [10, 30],   P: [30, 60], K: [20, 40],  temperature: [15, 25], humidity: [30, 55], ph: [6.0, 7.5], rainfall: [40, 80] } },
  { crop: 'kidneybeans',ranges: { N: [20, 40],   P: [30, 60], K: [20, 40],  temperature: [18, 28], humidity: [40, 65], ph: [6.0, 7.0], rainfall: [60, 100] } },
  { crop: 'pigeonpeas', ranges: { N: [10, 30],   P: [30, 60], K: [20, 40],  temperature: [20, 30], humidity: [40, 65], ph: [5.5, 7.0], rainfall: [50, 100] } },
  { crop: 'mothbeans',  ranges: { N: [10, 30],   P: [20, 50], K: [20, 40],  temperature: [25, 35], humidity: [20, 45], ph: [6.0, 7.5], rainfall: [30, 70] } },
  { crop: 'mungbean',   ranges: { N: [15, 35],   P: [30, 60], K: [20, 40],  temperature: [25, 35], humidity: [50, 75], ph: [6.0, 7.5], rainfall: [60, 110] } },
  { crop: 'blackgram',  ranges: { N: [15, 35],   P: [30, 60], K: [20, 40],  temperature: [25, 35], humidity: [50, 75], ph: [6.0, 7.5], rainfall: [60, 100] } },
  { crop: 'lentil',     ranges: { N: [10, 30],   P: [30, 60], K: [20, 40],  temperature: [15, 25], humidity: [40, 65], ph: [6.0, 7.5], rainfall: [50, 90] } },
  { crop: 'pomegranate',ranges: { N: [40, 80],   P: [30, 60], K: [40, 80],  temperature: [20, 32], humidity: [30, 55], ph: [6.0, 7.5], rainfall: [40, 100] } },
  { crop: 'banana',     ranges: { N: [80, 140],  P: [40, 80], K: [80, 140], temperature: [25, 35], humidity: [70, 90], ph: [5.5, 7.5], rainfall: [200, 400] } },
  { crop: 'mango',      ranges: { N: [50, 100],  P: [30, 60], K: [40, 80],  temperature: [22, 32], humidity: [50, 75], ph: [5.5, 7.5], rainfall: [80, 200] } },
  { crop: 'grapes',     ranges: { N: [40, 80],   P: [30, 60], K: [40, 80],  temperature: [15, 25], humidity: [50, 75], ph: [6.0, 7.0], rainfall: [60, 120] } },
  { crop: 'watermelon', ranges: { N: [50, 100],  P: [30, 60], K: [60, 120], temperature: [22, 32], humidity: [50, 75], ph: [6.0, 7.5], rainfall: [60, 120] } },
  { crop: 'muskmelon',  ranges: { N: [40, 80],   P: [30, 60], K: [50, 100], temperature: [22, 32], humidity: [50, 75], ph: [6.0, 7.5], rainfall: [60, 120] } },
  { crop: 'apple',      ranges: { N: [40, 80],   P: [30, 60], K: [40, 80],  temperature: [15, 25], humidity: [50, 75], ph: [6.0, 7.0], rainfall: [80, 150] } },
  { crop: 'orange',     ranges: { N: [50, 100],  P: [30, 60], K: [40, 80],  temperature: [20, 30], humidity: [50, 75], ph: [6.0, 7.5], rainfall: [80, 180] } },
  { crop: 'papaya',     ranges: { N: [80, 140],  P: [40, 80], K: [80, 140], temperature: [25, 32], humidity: [70, 90], ph: [6.0, 7.0], rainfall: [150, 250] } },
  { crop: 'coconut',    ranges: { N: [50, 100],  P: [20, 50], K: [60, 120], temperature: [25, 32], humidity: [70, 90], ph: [5.5, 7.0], rainfall: [200, 400] } },
  { crop: 'cotton',     ranges: { N: [80, 140],  P: [30, 60], K: [40, 80],  temperature: [22, 32], humidity: [50, 75], ph: [6.0, 7.5], rainfall: [80, 150] } },
  { crop: 'jute',       ranges: { N: [60, 100],  P: [30, 60], K: [40, 80],  temperature: [24, 30], humidity: [70, 90], ph: [6.0, 7.0], rainfall: [150, 250] } },
  { crop: 'coffee',     ranges: { N: [50, 100],  P: [30, 60], K: [40, 80],  temperature: [18, 24], humidity: [70, 90], ph: [6.0, 6.5], rainfall: [150, 250] } },
];

// ---------------------------------------------------------------------------
// 7 fertilizer types — NPK grades and application guidance.
// ---------------------------------------------------------------------------
export const FERTILIZER_TYPES: FertilizerType[] = [
  { name: 'Urea (46-0-0)', npk: [46, 0, 0],
    notes: 'Highest-N solid fertiliser; surface-applied urea volatilises when moisture is low — incorporate or irrigate within 24 h.' },
  { name: 'DAP (18-46-0)', npk: [18, 46, 0],
    notes: 'Diammonium phosphate — high-P basal fertiliser for early root development; temporary soil pH drop around the granule releases P.' },
  { name: '14-35-14', npk: [14, 35, 14],
    notes: 'P-dominant NPK blend for low-P soils; balances early N and K alongside a strong P push.' },
  { name: '28-28 (28-28-0)', npk: [28, 28, 0],
    notes: 'Balanced N-P, no K — for K-rich soils or where K is supplied separately (e.g. muriate of potash).' },
  { name: '17-17-17', npk: [17, 17, 17],
    notes: 'General-purpose balanced NPK; versatile for maintenance fertilisation across cereals, vegetables and orchards.' },
  { name: '20-20 (20-20-0)', npk: [20, 20, 0],
    notes: 'Balanced N-P starter fertiliser for use on soils already adequate in potassium.' },
  { name: '10-26-26', npk: [10, 26, 26],
    notes: 'Low-N, high-P-K — ideal for tuber/root crops and for top-dress at flowering/grain-fill on vegetative-grown crops.' },
];

// ---------------------------------------------------------------------------
// Crop recommendation — score each crop by how close the input falls to its
// ideal range. Inside-range scores 1.0; outside-range decays linearly with
// distance scaled by the half-width of that range.
// ---------------------------------------------------------------------------
export function recommendCrops(
  input: CropRecommendationInput,
  topN = 5,
): CropRecommendationResult[] {
  const fields: (keyof CropRecommendationRange['ranges'])[] = [
    'N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall',
  ];

  const scored = CROP_RECOMMENDATION_RANGES.map((entry) => {
    let sum = 0;
    for (const f of fields) {
      const [lo, hi] = entry.ranges[f];
      const v = input[f];
      const span = Math.max(1, hi - lo);
      let s: number;
      if (v < lo) s = Math.max(0, 1 - (lo - v) / span);
      else if (v > hi) s = Math.max(0, 1 - (v - hi) / span);
      else s = 1;
      sum += s;
    }
    return { crop: entry.crop, confidence: Math.round((sum / fields.length) * 100) };
  });

  return scored.sort((a, b) => b.confidence - a.confidence).slice(0, topN);
}

// ---------------------------------------------------------------------------
// Fertilizer recommendation — pick the fertiliser best matched to the most
// deficient nutrient (lowest relative score), with soil/moisture adjustments.
// ---------------------------------------------------------------------------
export function recommendFertilizer(input: FertilizerInput): FertilizerRecommendation {
  const { soilType, cropType, N, P, K, moisture } = input;

  // Relative sufficiency: N typically needed at 100, P at 50, K at 80.
  const nScore = N / 100;
  const pScore = P / 50;
  const kScore = K / 80;
  const min = Math.min(nScore, pScore, kScore);

  let pick: FertilizerType;
  let reason: string;
  let applicationRate: string;

  if (min === nScore && nScore < 0.85) {
    pick = FERTILIZER_TYPES[0]; // Urea
    reason = `Low N relative to P/K (N=${N}, P=${P}, K=${K}) — urea delivers 46% N with minimal carryover of other nutrients.`;
    const base = soilType === 'Sandy' ? 50 : 80;
    applicationRate = moisture < 30
      ? `${base} kg/ha split into 3 applications (low moisture + ${soilType} soil — split to limit NH₃ volatilisation)`
      : `${base + 30} kg/ha split into 2 applications (incorporate or irrigate within 24 h)`;
  } else if (min === pScore && pScore < 0.85) {
    pick = FERTILIZER_TYPES[1]; // DAP
    reason = `Low P relative to N/K (N=${N}, P=${P}, K=${K}) — DAP delivers 46% P₂O₅ plus 18% N for early root development.`;
    applicationRate = `${cropType === 'Legume' ? 60 : 90} kg/ha as basal, banded 5 cm beside and below the seed row`;
  } else if (min === kScore && kScore < 0.85) {
    pick = FERTILIZER_TYPES[6]; // 10-26-26
    reason = `Low K relative to N/P (N=${N}, P=${P}, K=${K}) — 10-26-26 supplies K with supplemental P for tuber, fruit and grain filling.`;
    applicationRate = `80 kg/ha basal + 40 kg/ha top-dress at flowering (avoid on sandy soils with low CEC — split smaller)`;
  } else {
    pick = FERTILIZER_TYPES[4]; // 17-17-17
    reason = `Balanced NPK soil test (N=${N}, P=${P}, K=${K}) — 17-17-17 maintains fertility across all three macronutrients.`;
    applicationRate = `75 kg/ha as basal + 50 kg/ha top-dress at the active-growth stage for ${cropType.toLowerCase()} crops`;
  }

  return {
    name: pick.name,
    npk: pick.npk,
    reason,
    applicationRate,
    notes: pick.notes,
  };
}
