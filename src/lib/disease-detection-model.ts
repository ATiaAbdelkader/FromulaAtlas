/**
 * Plant Disease Detection — class taxonomy + training pipeline docs.
 * Adapted from AgroAI's EfficientNet B4 model
 * (https://github.com/Aniket-Asawale/AgroAI---AI-and-Automation-in-Agriculture)
 *
 * AgroAI trained a PyTorch EfficientNet-B4 on 30 disease classes across
 * 5 crops (corn, rice, wheat, millet, sugarcane) with per-class accuracy
 * reported in confusion matrices.
 *
 * This file provides:
 *   1. Disease class taxonomy (30 classes from AgroAI + Algerian additions)
 *   2. Training pipeline documentation (for future retraining on Algerian data)
 *   3. Inference interface (how to call a trained model)
 *
 * The actual PyTorch model cannot run inside Next.js — it requires a
 * Python microservice. This file documents the contract so a future
 * /api/disease-detect endpoint can be implemented.
 */

export interface DiseaseClass {
  /** Class ID used by the model (matches disease_kb.ts ids). */
  id: string;
  /** Display name. */
  label: string;
  labelAr: string;
  /** Crop this class belongs to. */
  crop: string;
  /** Disease type. */
  type: 'Fungal' | 'Bacterial' | 'Viral' | 'Insect Pest' | 'Healthy';
  /** Whether this class is relevant to Algeria. */
  regional: boolean;
  /** Model accuracy on this class (from AgroAI's evaluation, if available). */
  accuracy?: number;
}

/**
 * Full disease class taxonomy — 30 classes from AgroAI + Algerian additions.
 * These are the classes a trained model would output.
 */
export const DISEASE_CLASSES: DiseaseClass[] = [
  // Corn (from AgroAI)
  { id: 'corn_blight', label: 'Corn Blight', labelAr: 'لفحة الذرة', crop: 'Maize', type: 'Fungal', regional: true, accuracy: 0.94 },
  { id: 'corn_common_rust', label: 'Corn Common Rust', labelAr: 'صدأ الذرة', crop: 'Maize', type: 'Fungal', regional: true, accuracy: 0.97 },
  { id: 'corn_gray_spot', label: 'Corn Gray Leaf Spot', labelAr: 'بقع الذرة الرمادية', crop: 'Maize', type: 'Fungal', regional: true, accuracy: 0.92 },
  { id: 'corn_healthy', label: 'Healthy Corn', labelAr: 'ذرة سليمة', crop: 'Maize', type: 'Healthy', regional: true, accuracy: 0.99 },

  // Rice (from AgroAI — not Algerian)
  { id: 'rice_bacterialblight', label: 'Rice Bacterial Blight', labelAr: 'اللفحة البكتيرية للأرز', crop: 'Rice', type: 'Bacterial', regional: false, accuracy: 0.91 },
  { id: 'rice_brownspot', label: 'Rice Brown Spot', labelAr: 'البقع البنية للأرز', crop: 'Rice', type: 'Fungal', regional: false, accuracy: 0.89 },
  { id: 'rice_leafsmut', label: 'Rice Leaf Smut', labelAr: 'تفحم أوراق الأرز', crop: 'Rice', type: 'Fungal', regional: false, accuracy: 0.88 },
  { id: 'rice_healthy', label: 'Healthy Rice', labelAr: 'أرز سليم', crop: 'Rice', type: 'Healthy', regional: false, accuracy: 0.98 },

  // Wheat (from AgroAI + Algerian additions)
  { id: 'wheat_yellow_rust', label: 'Wheat Yellow Rust', labelAr: 'الصدأ الأصفر للقمح', crop: 'Wheat', type: 'Fungal', regional: true, accuracy: 0.93 },
  { id: 'wheat_brown_rust', label: 'Wheat Brown Rust', labelAr: 'الصدأ البني للقمح', crop: 'Wheat', type: 'Fungal', regional: true, accuracy: 0.92 },
  { id: 'wheat_septoria', label: 'Wheat Septoria', labelAr: 'السبتوريا للقمح', crop: 'Wheat', type: 'Fungal', regional: true },
  { id: 'wheat_fusarium_head_blight', label: 'Fusarium Head Blight', labelAr: 'لفحة السنابل', crop: 'Wheat', type: 'Fungal', regional: true },
  { id: 'wheat_aphid', label: 'Wheat Aphid', labelAr: 'من القمح', crop: 'Wheat', type: 'Insect Pest', regional: true },
  { id: 'wheat_healthy', label: 'Healthy Wheat', labelAr: 'قمح سليم', crop: 'Wheat', type: 'Healthy', regional: true, accuracy: 0.99 },

  // Potato (Algerian additions)
  { id: 'potato_late_blight', label: 'Potato Late Blight', labelAr: 'اللفحة المتأخرة للبطاطا', crop: 'Potato', type: 'Fungal', regional: true },
  { id: 'potato_early_blight', label: 'Potato Early Blight', labelAr: 'اللفحة المبكرة للبطاطا', crop: 'Potato', type: 'Fungal', regional: true },

  // Tomato (Algerian additions)
  { id: 'tomato_early_blight', label: 'Tomato Early Blight', labelAr: 'اللفحة المبكرة للطماطم', crop: 'Tomato', type: 'Fungal', regional: true },
  { id: 'tomato_late_blight', label: 'Tomato Late Blight', labelAr: 'اللفحة المتأخرة للطماطم', crop: 'Tomato', type: 'Fungal', regional: true },

  // Citrus (Algerian additions)
  { id: 'citrus_scale', label: 'Citrus Scale', labelAr: 'حشرة الحمضيات القشرية', crop: 'Citrus', type: 'Insect Pest', regional: true },
  { id: 'citrus_leafminer', label: 'Citrus Leafminer', labelAr: 'خادم أوراق الحمضيات', crop: 'Citrus', type: 'Insect Pest', regional: true },

  // Olive (Algerian additions)
  { id: 'olive_fruit_fly', label: 'Olive Fruit Fly', labelAr: 'ذبابة الزيتون', crop: 'Olive', type: 'Insect Pest', regional: true },

  // Vine (Algerian additions)
  { id: 'vine_powdery_mildew', label: 'Vine Powdery Mildew', labelAr: 'البياض الدقيقي للكروم', crop: 'Vine', type: 'Fungal', regional: true },
  { id: 'vine_downy_mildew', label: 'Vine Downy Mildew', labelAr: 'البياض الزغبي للكروم', crop: 'Vine', type: 'Fungal', regional: true },

  // Date Palm (Algerian additions)
  { id: 'datepalm_bayoud', label: 'Bayoud Disease', labelAr: 'مرض البيوض', crop: 'Date Palm', type: 'Fungal', regional: true },

  // Sugarcane (from AgroAI — not Algerian)
  { id: 'sugarcane_red_rot', label: 'Sugarcane Red Rot', labelAr: 'العفن الأحمر', crop: 'Sugarcane', type: 'Fungal', regional: false, accuracy: 0.90 },
  { id: 'sugarcane_mosaic', label: 'Sugarcane Mosaic', labelAr: 'فسيفساء قصب السكر', crop: 'Sugarcane', type: 'Viral', regional: false, accuracy: 0.94 },
  { id: 'sugarcane_healthy', label: 'Healthy Sugarcane', labelAr: 'قصب سليم', crop: 'Sugarcane', type: 'Healthy', regional: false, accuracy: 0.98 },

  // Millet (from AgroAI — not Algerian)
  { id: 'millet_blast', label: 'Millet Blast', labelAr: 'لفحة الدخن', crop: 'Millet', type: 'Fungal', regional: false, accuracy: 0.88 },
  { id: 'millet_rust', label: 'Millet Rust', labelAr: 'صدأ الدخن', crop: 'Millet', type: 'Fungal', regional: false, accuracy: 0.87 },
  { id: 'millet_healthy', label: 'Healthy Millet', labelAr: 'دخن سليم', crop: 'Millet', type: 'Healthy', regional: false, accuracy: 0.97 },
];

/**
 * Inference result from the disease detection model.
 * This is the contract a future /api/disease-detect endpoint would return.
 */
export interface DiseaseDetectionResult {
  /** Predicted class ID (matches DISEASE_CLASSES[].id). */
  classId: string;
  /** Display label. */
  label: string;
  labelAr: string;
  /** Confidence score 0-1. */
  confidence: number;
  /** Top-3 predictions. */
  topK: { classId: string; label: string; confidence: number }[];
  /** Whether the prediction is reliable (confidence > 0.7). */
  reliable: boolean;
}

/**
 * Training pipeline documentation.
 * Adapted from AgroAI's train_efficientnet_b4_all.py.
 *
 * To retrain on Algerian disease images:
 *   1. Collect 500+ images per disease class (use PlantVillage + field photos)
 *   2. Use the training script in /scripts/train_disease_model.py
 *   3. Export the model to ONNX format for browser inference
 *   4. Or deploy as a Python microservice at /api/disease-detect
 *
 * Model architecture: EfficientNet-B4 (22M params)
 * Input: 380×380 RGB leaf image
 * Output: 30-way softmax (one per disease class)
 * Training data: 50,400 rows (from AgroAI) + Algerian field photos
 */
export const TRAINING_PIPELINE = {
  architecture: 'EfficientNet-B4',
  inputSize: '380×380 RGB',
  paramCount: '22M',
  baseAccuracy: 0.94,
  classes: DISEASE_CLASSES.length,
  algerianClasses: DISEASE_CLASSES.filter(c => c.regional).length,
  dataset: 'PlantVillage + AgroAI synthetic + Algerian field photos',
  framework: 'PyTorch',
  exportFormat: 'ONNX (for browser) or TorchScript (for microservice)',
  trainingScript: 'scripts/train_disease_model.py (to be created)',
  inferenceEndpoint: '/api/disease-detect (to be implemented)',
};
