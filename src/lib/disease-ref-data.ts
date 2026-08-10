/**
 * Disease + Weed reference gallery data — curated from PlantVillage (50K images),
 * PlantDoc (2,482 images), DeepWeeds (17,509 images), and Weed25 datasets.
 *
 * Each entry includes: crop, disease/weed name, symptoms, visual description,
 * and a link to the source dataset for browsing actual photos.
 *
 * Sources:
 *   - PlantVillage: https://github.com/spMohanty/PlantVillage-Dataset
 *   - PlantDoc: https://github.com/pratikkayal/PlantDoc-Object-Detection-Dataset
 *   - DeepWeeds: https://github.com/AlexOlsen/DeepWeeds
 *   - Weed25: https://doi.org/10.3389/fpls.2022.1053329
 */

export interface DiseaseRef {
  id: string;
  crop: string;
  cropEmoji: string;
  disease: string;
  diseaseAr?: string;
  type: 'fungal' | 'bacterial' | 'viral' | 'pest' | 'nutrient' | 'weed';
  symptoms: string;
  visualDescription: string;
  severity: 'low' | 'medium' | 'high';
  sourceDataset: string;
  sourceUrl: string;
  imageCount: number;
}

export const DISEASE_REFS: DiseaseRef[] = [
  // === TOMATO ===
  { id: 'tom-early-blight', crop: 'Tomato', cropEmoji: '🍅', disease: 'Early Blight (Alternaria solani)', diseaseAr: 'اللفحة المبكرة', type: 'fungal', symptoms: 'Dark brown concentric rings on older leaves, yellowing, defoliation', visualDescription: 'Target-like concentric ring lesions on lower leaves, chlorotic halo', severity: 'medium', sourceDataset: 'PlantVillage', sourceUrl: 'https://github.com/spMohanty/PlantVillage-Dataset', imageCount: 1000 },
  { id: 'tom-late-blight', crop: 'Tomato', cropEmoji: '🍅', disease: 'Late Blight (Phytophthora infestans)', diseaseAr: 'اللفحة المتأخرة', type: 'fungal', symptoms: 'Large dark brown spots on leaves + stems, white fuzzy growth underneath, rapid defoliation', visualDescription: 'Irregular dark water-soaked lesions, white sporulation on leaf underside', severity: 'high', sourceDataset: 'PlantVillage', sourceUrl: 'https://github.com/spMohanty/PlantVillage-Dataset', imageCount: 1910 },
  { id: 'tom-leaf-mold', crop: 'Tomato', cropEmoji: '🍅', disease: 'Leaf Mold (Passalora fulva)', type: 'fungal', symptoms: 'Pale yellow spots on upper leaf, olive-green velvety growth underneath', visualDescription: 'Yellow spots on top, fuzzy olive patches on leaf underside (humid greenhouse)', severity: 'medium', sourceDataset: 'PlantVillage', sourceUrl: 'https://github.com/spMohanty/PlantVillage-Dataset', imageCount: 952 },
  { id: 'tom-septoria', crop: 'Tomato', cropEmoji: '🍅', disease: 'Septoria Leaf Spot', type: 'fungal', symptoms: 'Small circular spots with dark borders + gray centers on lower leaves', visualDescription: 'Numerous tiny (2-3mm) circular gray lesions with dark brown margins', severity: 'medium', sourceDataset: 'PlantVillage', sourceUrl: 'https://github.com/spMohanty/PlantVillage-Dataset', imageCount: 1771 },
  { id: 'tom-spider-mites', crop: 'Tomato', cropEmoji: '🍅', disease: 'Spider Mites (Tetranychus spp.)', type: 'pest', symptoms: 'Stippled yellow leaves, fine webbing, tiny moving dots on underside', visualDescription: 'Yellow-speckled leaves, visible webbing between leaves, mites visible with magnification', severity: 'medium', sourceDataset: 'PlantVillage', sourceUrl: 'https://github.com/spMohanty/PlantVillage-Dataset', imageCount: 1676 },
  { id: 'tom-leaf-curl-virus', crop: 'Tomato', cropEmoji: '🍅', disease: 'Tomato Leaf Curl Virus (TYLCV)', type: 'viral', symptoms: 'Upward curling of leaves, stunting, yellowing, reduced fruit set', visualDescription: 'Leaves curl upward + become thick + leathery, plant stunted, transmitted by whitefly', severity: 'high', sourceDataset: 'PlantVillage', sourceUrl: 'https://github.com/spMohanty/PlantVillage-Dataset', imageCount: 3208 },
  { id: 'tom-mosaic-virus', crop: 'Tomato', cropEmoji: '🍅', disease: 'Tomato Mosaic Virus (ToMV)', type: 'viral', symptoms: 'Mottled light/dark green pattern on leaves, leaf distortion, reduced yield', visualDescription: 'Mosaic pattern of alternating light and dark green on leaves, fern-like appearance', severity: 'medium', sourceDataset: 'PlantVillage', sourceUrl: 'https://github.com/spMohanty/PlantVillage-Dataset', imageCount: 373 },

  // === POTATO ===
  { id: 'pot-early-blight', crop: 'Potato', cropEmoji: '🥔', disease: 'Early Blight (Alternaria solani)', type: 'fungal', symptoms: 'Dark brown concentric ring lesions on lower leaves, "target spot" pattern', visualDescription: 'Concentric ring "target" lesions, chlorotic halo, starts on oldest leaves', severity: 'medium', sourceDataset: 'PlantVillage', sourceUrl: 'https://github.com/spMohanty/PlantVillage-Dataset', imageCount: 1000 },
  { id: 'pot-late-blight', crop: 'Potato', cropEmoji: '🥔', disease: 'Late Blight (Phytophthora infestans)', diseaseAr: 'اللفحة المتأخرة', type: 'fungal', symptoms: 'Water-soaked dark lesions on leaves + stems, white sporulation, tuber rot', visualDescription: 'Dark olive-green to black irregular lesions, white mold ring on leaf underside', severity: 'high', sourceDataset: 'PlantVillage', sourceUrl: 'https://github.com/spMohanty/PlantVillage-Dataset', imageCount: 1000 },

  // === PEPPER ===
  { id: 'pep-bacterial-spot', crop: 'Pepper', cropEmoji: '🫑', disease: 'Bacterial Spot (Xanthomonas spp.)', type: 'bacterial', symptoms: 'Small water-soaked spots on leaves → brown raised scab-like lesions on fruit', visualDescription: 'Tiny brown raised lesions on fruit, yellow-brown leaf spots with necrotic centers', severity: 'medium', sourceDataset: 'PlantVillage', sourceUrl: 'https://github.com/spMohanty/PlantVillage-Dataset', imageCount: 997 },

  // === CORN/MAIZE ===
  { id: 'corn-gray-leaf-spot', crop: 'Corn', cropEmoji: '🌽', disease: 'Gray Leaf Spot (Cercospora zeae-maydis)', type: 'fungal', symptoms: 'Rectangular gray-tan lesions between veins, restricted by leaf veins', visualDescription: 'Long rectangular gray lesions parallel to leaf veins, starts on lower leaves', severity: 'high', sourceDataset: 'PlantDoc', sourceUrl: 'https://github.com/pratikkayal/PlantDoc-Object-Detection-Dataset', imageCount: 300 },
  { id: 'corn-rust', crop: 'Corn', cropEmoji: '🌽', disease: 'Common Rust (Puccinia sorghi)', type: 'fungal', symptoms: 'Cinnamon-brown raised pustules on both leaf surfaces', visualDescription: 'Small raised golden-brown pustules in clusters on leaves, powdery spore mass', severity: 'medium', sourceDataset: 'PlantDoc', sourceUrl: 'https://github.com/pratikkayal/PlantDoc-Object-Detection-Dataset', imageCount: 200 },
  { id: 'corn-northern-blight', crop: 'Corn', cropEmoji: '🌽', disease: 'Northern Corn Leaf Blight (Exserohilum turcicum)', type: 'fungal', symptoms: 'Long cigar-shaped gray-green lesions on leaves', visualDescription: 'Cigar-shaped lesions (2.5-15 cm), gray-green → tan with age, distinct margins', severity: 'high', sourceDataset: 'PlantDoc', sourceUrl: 'https://github.com/pratikkayal/PlantDoc-Object-Detection-Dataset', imageCount: 250 },

  // === WHEAT ===
  { id: 'wheat-stripe-rust', crop: 'Wheat', cropEmoji: '🌾', disease: 'Stripe Rust (Puccinia striiformis)', type: 'fungal', symptoms: 'Yellow-orange pustules in stripes along leaf veins', visualDescription: 'Bright yellow-orange powdery stripes running parallel to leaf veins', severity: 'high', sourceDataset: 'PlantDoc', sourceUrl: 'https://github.com/pratikkayal/PlantDoc-Object-Detection-Dataset', imageCount: 150 },
  { id: 'wheat-leaf-rust', crop: 'Wheat', cropEmoji: '🌾', disease: 'Leaf Rust (Puccinia triticina)', type: 'fungal', symptoms: 'Small orange-brown round pustules scattered on leaf surface', visualDescription: 'Orange to brown powdery pustules (1-2 mm), scattered randomly on leaves', severity: 'medium', sourceDataset: 'PlantDoc', sourceUrl: 'https://github.com/pratikkayal/PlantDoc-Object-Detection-Dataset', imageCount: 150 },

  // === APPLE ===
  { id: 'apple-scab', crop: 'Apple', cropEmoji: '🍎', disease: 'Apple Scab (Venturia inaequalis)', type: 'fungal', symptoms: 'Olive-green to dark brown spots on leaves + fruit, cracked deformed fruit', visualDescription: 'Dark olive-green velvety spots on leaves, scabby corky lesions on fruit surface', severity: 'high', sourceDataset: 'PlantVillage', sourceUrl: 'https://github.com/spMohanty/PlantVillage-Dataset', imageCount: 630 },
  { id: 'apple-cedar-rust', crop: 'Apple', cropEmoji: '🍎', disease: 'Cedar Apple Rust (Gymnosporangium juniperi-virginianae)', type: 'fungal', symptoms: 'Bright orange-yellow spots on leaves, fruit lesions with fringed margins', visualDescription: 'Brilliant orange-yellow spots with tiny black dots, fringed margin, fruit deformation', severity: 'medium', sourceDataset: 'PlantVillage', sourceUrl: 'https://github.com/spMohanty/PlantVillage-Dataset', imageCount: 275 },

  // === GRAPE ===
  { id: 'grape-black-rot', crop: 'Grape', cropEmoji: '🍇', disease: 'Black Rot (Guignardia bidwellii)', type: 'fungal', symptoms: 'Tan lesions with dark borders on leaves, shriveled black mummified berries', visualDescription: 'Brown circular leaf spots with dark borders, berries turn brown → black → shrivel', severity: 'high', sourceDataset: 'PlantVillage', sourceUrl: 'https://github.com/spMohanty/PlantVillage-Dataset', imageCount: 1188 },
  { id: 'grape-esca', crop: 'Grape', cropEmoji: '🍇', disease: 'Esca (Petri disease)', type: 'fungal', symptoms: 'Tiger-stripe pattern on leaves (interveinal chlorosis + necrosis), sudden wilting', visualDescription: 'Yellow + brown tiger-stripe pattern between veins, "apoplexy" = sudden vine death', severity: 'high', sourceDataset: 'PlantVillage', sourceUrl: 'https://github.com/spMohanty/PlantVillage-Dataset', imageCount: 1113 },

  // === RICE ===
  { id: 'rice-brown-spot', crop: 'Rice', cropEmoji: '🍚', disease: 'Brown Spot (Bipolaris oryzae)', type: 'fungal', symptoms: 'Small oval brown spots with gray center on leaves + grains', visualDescription: 'Oval dark brown spots (2-10mm) with gray-white centers on leaves + panicles', severity: 'medium', sourceDataset: 'PlantVillage', sourceUrl: 'https://github.com/spMohanty/PlantVillage-Dataset', imageCount: 523 },
  { id: 'rice-leaf-blast', crop: 'Rice', cropEmoji: '🍚', disease: 'Rice Blast (Magnaporthe oryzae)', type: 'fungal', symptoms: 'Diamond-shaped lesions with gray center + brown border on leaves', visualDescription: 'Diamond/eye-shaped lesions, gray center with brown margin, can cause neck rot', severity: 'high', sourceDataset: 'PlantVillage', sourceUrl: 'https://github.com/spMohanty/PlantVillage-Dataset', imageCount: 1066 },

  // === CITRUS ===
  { id: 'citrus-greening', crop: 'Citrus', cropEmoji: '🍊', disease: 'Huanglongbing (HLB / Citrus Greening)', type: 'bacterial', symptoms: 'Asymmetric yellowing of leaves, lopsided bitter fruit, tree decline', visualDescription: 'Blotchy mottled yellow pattern (asymmetric), not uniform — key distinction from nutrient deficiency', severity: 'high', sourceDataset: 'PlantVillage', sourceUrl: 'https://github.com/spMohanty/PlantVillage-Dataset', imageCount: 5502 },

  // === STRAWBERRY ===
  { id: 'straw-leaf-scorch', crop: 'Strawberry', cropEmoji: '🍓', disease: 'Leaf Scorch (Diplocarpon earlianum)', type: 'fungal', symptoms: 'Small dark purple spots on leaves, irregular shape, coalescing', visualDescription: 'Purple-brown angular spots (3-6mm), dark purple border, scattered on leaf', severity: 'medium', sourceDataset: 'PlantVillage', sourceUrl: 'https://github.com/spMohanty/PlantVillage-Dataset', imageCount: 1109 },

  // === WEEDS (from DeepWeeds) ===
  { id: 'weed-chinee-apple', crop: 'General', cropEmoji: '🌿', disease: 'Chinee Apple (Ziziphus mauritiana)', type: 'weed', symptoms: 'Invasive shrub with thorny branches, round leaves, yellow fruits', visualDescription: 'Shrub/tree with grey-green rounded leaves, thorns, small yellow-brown edible fruits', severity: 'medium', sourceDataset: 'DeepWeeds', sourceUrl: 'https://github.com/AlexOlsen/DeepWeeds', imageCount: 1507 },
  { id: 'weed-lantana', crop: 'General', cropEmoji: '🌿', disease: 'Lantana (Lantana camara)', type: 'weed', symptoms: 'Invasive shrub with clusters of small colorful flowers, rough leaves', visualDescription: 'Shrub with square stems, opposite leaves, clusters of pink/yellow/orange tubular flowers', severity: 'high', sourceDataset: 'DeepWeeds', sourceUrl: 'https://github.com/AlexOlsen/DeepWeeds', imageCount: 1697 },
  { id: 'weed-parkinsonia', crop: 'General', cropEmoji: '🌿', disease: 'Parkinsonia (Parkinsonia aculeata)', type: 'weed', symptoms: 'Invasive tree with long green strap-like stems, small leaves, yellow flowers', visualDescription: 'Tree with photosynthetic green bark, flat leaf stalks, pendulous branches, yellow flowers', severity: 'medium', sourceDataset: 'DeepWeeds', sourceUrl: 'https://github.com/AlexOlsen/DeepWeeds', imageCount: 1660 },
  { id: 'weed-parthenium', crop: 'General', cropEmoji: '🌿', disease: 'Parthenium (Parthenium hysterophorus)', type: 'weed', symptoms: 'Invasive annual with deeply divided leaves, small white flowers, causes allergies', visualDescription: 'Small plant with deeply lobed leaves, branched stems, tiny white flower clusters, causes dermatitis', severity: 'high', sourceDataset: 'DeepWeeds', sourceUrl: 'https://github.com/AlexOlsen/DeepWeeds', imageCount: 1562 },
  { id: 'weed-prickly-acacia', crop: 'General', cropEmoji: '🌿', disease: 'Prickly Acacia (Vachellia nilotica)', type: 'weed', symptoms: 'Thorny tree with bipinnate leaves, yellow puffball flowers, long seed pods', visualDescription: 'Tree with paired thorns, feathery leaves, yellow spherical flower clusters, long narrow pods', severity: 'medium', sourceDataset: 'DeepWeeds', sourceUrl: 'https://github.com/AlexOlsen/DeepWeeds', imageCount: 1635 },
  { id: 'weed-rubber-vine', crop: 'General', cropEmoji: '🌿', disease: 'Rubber Vine (Cryptostegia grandiflora)', type: 'weed', symptoms: 'Aggressive climbing vine with milky sap, pink-purple flowers, paired pods', visualDescription: 'Woody vine with glossy dark green leaves, large pink-purple trumpet flowers, white latex sap', severity: 'high', sourceDataset: 'DeepWeeds', sourceUrl: 'https://github.com/AlexOlsen/DeepWeeds', imageCount: 1634 },
  { id: 'weed-siam-weed', crop: 'General', cropEmoji: '🌿', disease: 'Siam Weed (Chromolaena odorata)', type: 'weed', symptoms: 'Fast-growing shrub with triangular leaves, pale blue/purple flowers, strong odor', visualDescription: 'Tall shrub with opposite triangular leaves, fluffy pale flower clusters, distinctive smell when crushed', severity: 'high', sourceDataset: 'DeepWeeds', sourceUrl: 'https://github.com/AlexOlsen/DeepWeeds', imageCount: 1662 },
  { id: 'weed-snake-weed', crop: 'General', cropEmoji: '🌿', disease: 'Snake Weed (Stachytarpheta spp.)', type: 'weed', symptoms: 'Herb with serrated leaves, thin spike-like flower stalks, small purple flowers', visualDescription: 'Small herb with toothed leaves, long thin flower spikes with tiny blue-purple flowers', severity: 'low', sourceDataset: 'DeepWeeds', sourceUrl: 'https://github.com/AlexOlsen/DeepWeeds', imageCount: 1585 },
];

// ============================================================================
// Research datasets reference
// ============================================================================

export interface ResearchDataset {
  id: string;
  name: string;
  category: 'classification' | 'segmentation' | 'detection' | 'instance_seg' | 'hyperspectral' | 'robotics' | 'tracking' | 'large_scale' | 'tools' | 'collectors';
  description: string;
  size: string;
  modalities: string;
  url: string;
  paperUrl?: string;
}

export const RESEARCH_DATASETS: ResearchDataset[] = [
  // Classification
  { id: 'plantvillage', name: 'PlantVillage Dataset', category: 'classification', description: '50,000 images of healthy and infected crop leaves across 38 crop-disease combinations', size: '50,000 images', modalities: 'RGB', url: 'https://github.com/spMohanty/PlantVillage-Dataset' },
  { id: 'deepweeds', name: 'DeepWeeds', category: 'classification', description: '17,509 images of 8 Australian weed species in situ', size: '17,509 images', modalities: 'RGB', url: 'https://github.com/AlexOlsen/DeepWeeds' },
  { id: 'plantnet300k', name: 'Pl@ntNet-300K', category: 'classification', description: 'Large-scale plant image collection covering 1,081 plant species', size: '306,146 images', modalities: 'RGB', url: 'https://doi.org/10.5281/zenodo.4726653' },
  { id: 'plantclef2022', name: 'PlantCLEF2022', category: 'classification', description: 'Image-based plant identification at global scale', size: 'Large', modalities: 'RGB', url: 'https://www.imageclef.org/plantclef2022' },
  { id: 'weed25', name: 'Weed25', category: 'classification', description: 'Deep learning dataset for weed identification (25 species)', size: 'Large', modalities: 'RGB', url: 'https://doi.org/10.3389/fpls.2022.1053329' },
  { id: 'inatag', name: 'iNatAg', category: 'classification', description: 'Over 4.7 million images of 2,959 crop and weed species with hierarchical labels', size: '4.7M images', modalities: 'RGB', url: 'https://github.com/Project-AgML/AgML' },

  // Segmentation — Crop/Weed
  { id: 'sugarbeets2016', name: 'Sugar Beets 2016', category: 'segmentation', description: 'Semantic segmentation of sugar beet fields with weed labels', size: 'Large', modalities: 'RGB', url: 'https://www.ipb.uni-bonn.de/data/sugarbeets2016/' },
  { id: 'weedmap', name: 'WeedMap', category: 'segmentation', description: 'Large-scale semantic segmentation crop-weed dataset using aerial color and multispectral imaging', size: 'Large', modalities: 'RGB + Multispectral', url: 'https://projects.asl.ethz.ch/datasets/doku.php?id=weedmap:remotesensing2018weedmap' },
  { id: 'we3ds', name: 'WE3DS', category: 'segmentation', description: 'RGB-D images with 2,568 annotated images containing 17 plant species', size: '2,568 images', modalities: 'RGB-D', url: 'https://zenodo.org/records/7457983' },
  { id: 'vegann', name: 'VegAnn', category: 'segmentation', description: 'Multi-crop RGB dataset for vegetation segmentation — 3,775 labeled images, 26+ crop species', size: '3,775 images', modalities: 'RGB', url: 'https://doi.org/10.5281/zenodo.7636408' },

  // Detection — Crop/Weed
  { id: 'weedcrop', name: 'WeedCrop Image Dataset', category: 'detection', description: '2,822 images annotated in YOLO v5 PyTorch format', size: '2,822 images', modalities: 'RGB', url: 'https://www.kaggle.com/datasets/vinayakshanawad/weedcrop-image-dataset' },
  { id: 'cornweed', name: 'CornWeed Dataset', category: 'detection', description: 'Dataset for training maize and weed object detectors for agricultural machines', size: 'Large', modalities: 'RGB', url: 'https://zenodo.org/records/7961764' },
  { id: 'weedmaize', name: 'WeedMaize Dataset', category: 'detection', description: '7,784 images with 121,635 bounding-box annotations across 18 classes', size: '7,784 images', modalities: 'RGB', url: 'https://doi.org/10.5281/zenodo.5106795' },
  { id: 'cottonweeddet3', name: 'CottonWeedDet3', category: 'detection', description: '848 RGB images with 1,532 bounding-box annotations across 3 weed classes', size: '848 images', modalities: 'RGB', url: 'https://doi.org/10.34740/KAGGLE/DSV/4090494' },

  // Detection — Fruit
  { id: 'citdet', name: 'CitDet', category: 'detection', description: 'Benchmark dataset for citrus fruit detection', size: 'Large', modalities: 'RGB', url: 'https://robotic-vision-lab.github.io/citdet/' },
  { id: 'minneapple', name: 'MinneApple', category: 'detection', description: 'Benchmark dataset for apple detection and segmentation', size: 'Large', modalities: 'RGB', url: 'https://github.com/nicolaihaeni/MinneApple' },
  { id: 'gwhd', name: 'Global Wheat Head Detection', category: 'detection', description: '4,948 high-resolution RGB images with 188,500 labeled wheat heads across 12 countries', size: '4,948 images', modalities: 'RGB', url: 'https://doi.org/10.5281/zenodo.5092309' },
  { id: 'tomato-det', name: 'Tomato Detection Dataset', category: 'detection', description: '895 images with 4,930 labeled tomatoes in greenhouse environments', size: '895 images', modalities: 'RGB', url: 'https://www.kaggle.com/datasets/andrewmvd/tomato-detection' },
  { id: 'strawberry-det', name: 'Strawberry Object Detection', category: 'detection', description: '813 images with 4,568 labeled objects (ripe, peduncle, unripe)', size: '813 images', modalities: 'RGB', url: 'https://doi.org/10.5281/zenodo.6126677' },
  { id: 'deepnir', name: 'deepNIR Fruit Detection', category: 'detection', description: '4,295 RGB + synthetic NIR images, 161,979 bounding boxes over 11 fruit/crop classes', size: '4,295 images', modalities: 'RGB + NIR', url: 'https://doi.org/10.5281/zenodo.6324489' },

  // Disease detection
  { id: 'plantdoc', name: 'PlantDoc', category: 'detection', description: '2,482 images with 8,595 bounding-box annotations across 29 disease classes', size: '2,482 images', modalities: 'RGB', url: 'https://github.com/pratikkayal/PlantDoc-Object-Detection-Dataset' },
  { id: 'rice-disease', name: 'Rice Disease Dataset', category: 'detection', description: '470 images with 1,956 bounding box annotations (Bacterial Blight, Brown Spot, Rice Blast)', size: '470 images', modalities: 'RGB', url: 'https://www.kaggle.com/dsv/2481060' },

  // Instance segmentation
  { id: 'cropandweed', name: 'CropAndWeed Dataset', category: 'instance_seg', description: '8K images, 112K annotated plant instances with bounding boxes, masks, stems, 16 crop + 58 weed species', size: '8,000 images', modalities: 'RGB', url: 'https://github.com/cropandweed/cropandweed-dataset/tree/main' },
  { id: 'minneapple-seg', name: 'MinneApple (Segmentation)', category: 'instance_seg', description: 'Apple detection and segmentation benchmark with pixel-level masks', size: 'Large', modalities: 'RGB', url: 'https://github.com/nicolaihaeni/MinneApple' },
  { id: 'strawdi', name: 'StrawDI_Db1', category: 'instance_seg', description: '3,100 high-resolution images with 17,938 pixel-level annotations of strawberries', size: '3,100 images', modalities: 'RGB', url: 'https://strawdi.github.io/' },

  // Hyperspectral
  { id: 'citrusfarm', name: 'CitrusFarm Dataset', category: 'hyperspectral', description: 'Multimodal agricultural robotics dataset with multispectral images + navigation data', size: 'Large', modalities: 'Multispectral + Nav', url: 'https://ucr-robotics.github.io/Citrus-Farm-Dataset/' },
  { id: 'ardvo', name: 'ARD-VO', category: 'hyperspectral', description: 'Agricultural robot data of vineyards and olive groves — stereo + LiDAR + GPS-RTK + multispectral', size: 'Multi-session', modalities: 'Stereo + LiDAR + MS', url: 'https://github.com/isarlab-department-engineering/ARDVO' },

  // Robotics
  { id: 'rellis3d', name: 'RELLIS-3D', category: 'robotics', description: 'Multi-modal dataset for off-road robotics — 2D RGB + 3D LiDAR semantic segmentation', size: 'Large', modalities: 'RGB + LiDAR', url: 'https://github.com/unmannedlab/RELLIS-3D' },
  { id: 'rugd', name: 'RUGD Dataset', category: 'robotics', description: 'Semantic understanding of unstructured outdoor environments for off-road navigation', size: 'Large', modalities: 'RGB video', url: 'http://rugd.vision/' },
  { id: 'crdld', name: 'CRDLD (Crop Row Detection)', category: 'robotics', description: 'Crop-row detection dataset for agricultural robot navigation — 2,000 field images, 50 condition classes', size: '2,000 images', modalities: 'RGB', url: 'https://github.com/JunfengGaolab/CropRowDetection' },
  { id: 'botanicgarden', name: 'BotanicGarden', category: 'robotics', description: 'Robot navigation dataset in a 48,000m² botanic garden — stereo + LiDAR + IMU, 17.1km trajectories', size: '33 sequences', modalities: 'Stereo + LiDAR + IMU', url: 'https://github.com/robot-pesg/BotanicGarden' },

  // Large-scale
  { id: 'imag4wheat', name: 'ImAg4Wheat', category: 'large_scale', description: 'Massive wheat imagery dataset — 2.5M images, ~2,000 genotypes, ~500 environments, 10 countries', size: '2.5M images', modalities: 'RGB', url: 'https://huggingface.co/datasets/PheniX-Lab/ImAg4Wheat' },

  // Collectors
  { id: 'agml', name: 'AgML', category: 'collectors', description: 'Open-source Python framework for agricultural ML — standardized access to public ag-vision datasets', size: '30+ datasets', modalities: 'Various', url: 'https://github.com/Project-AgML/AgML' },
  { id: 'weed-ai', name: 'Weed-AI', category: 'collectors', description: 'Repository of weed images in crops from University of Sydney', size: 'Many', modalities: 'RGB', url: 'https://weed-ai.sydney.edu.au/' },
  { id: 'dataset-ninja', name: 'Dataset Ninja', category: 'collectors', description: 'Searchable database of agricultural computer vision datasets', size: 'Many', modalities: 'Various', url: 'https://datasetninja.com/category/agriculture' },
  { id: 'quantplant', name: 'Quantitative Plant', category: 'collectors', description: 'Website collecting datasets for image classification, segmentation and phenotyping', size: 'Many', modalities: 'Various', url: 'https://www.quantitative-plant.org/dataset' },

  // Tools
  { id: 'cropcraft', name: 'CropCraft', category: 'tools', description: 'Python script that generates 3D models of crop fields for real-time robotics simulation', size: 'Tool', modalities: '3D synthetic', url: 'https://github.com/Romea/cropcraft' },
  { id: 'tomatosynth', name: 'TomatoSynth', category: 'tools', description: 'Generates realistic synthetic tomato plant training data for deep learning', size: 'Tool', modalities: '3D synthetic', url: 'https://github.com/SCT-lab/TomatoSynth' },
];
