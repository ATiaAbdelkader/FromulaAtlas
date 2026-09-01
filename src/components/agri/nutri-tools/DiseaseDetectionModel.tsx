'use client';

/**
 * DiseaseDetectionModel — in-browser plant disease detection
 * =====================================================================
 * Loads a pre-trained CNN model (TensorFlow.js LayersModel) from
 * `/models/plant-disease/model.json`, accepts an uploaded leaf photo,
 * preprocesses it (resize → 224×224 → tensor → expand batch dim) and runs
 * `model.predict()` to produce a 15-way softmax over PlantVillage-style
 * classes for Pepper, Potato and Tomato.
 *
 * Why split into two files?
 *   TensorFlow.js registers WebGL / WebGPU backends at import time which
 *   require `window`. We therefore wrap the actual UI in `next/dynamic`
 *   with `{ ssr: false }` (see end of this file). The inner component is
 *   imported lazily so that the `@tensorflow/tfjs` module is only evaluated
 *   in the browser.
 *
 * Model facts:
 *   - Input  : 224×224×3 RGB image (uint8 [0,255] — the model has its own
 *              `Rescaling(1/255)` first layer, so we feed raw pixels).
 *   - Output : 15-class softmax.
 *   - Size   : ~33 MB (weights.bin).
 *   - Load   : typically 3–5 seconds on a warm connection.
 *
 * The result cross-references our expanded disease database
 * (`src/lib/expanded-disease-database.ts`) and the Disease Reference
 * Gallery (`src/lib/disease-ref-data.ts`) so the farmer can jump straight
 * to trilingual symptoms, treatments and INPV-approved active substances.
 */

import * as tf from '@tensorflow/tfjs';
import dynamic from 'next/dynamic';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScanFace, Upload, ImageIcon, Loader2, RotateCcw, Copy, Check, AlertTriangle, CheckCircle2, ExternalLink, Cpu, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CalculatorShell, type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';
import { copyFor, useTranslation, type Language } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { EXPANDED_DISEASES, getExpandedDisease } from '@/lib/expanded-disease-database';
import { DISEASE_REFS } from '@/lib/disease-ref-data';

// ---------------------------------------------------------------------------
// Static metadata — class taxonomy + cross-references
// ---------------------------------------------------------------------------

const MODEL_URL = '/models/plant-disease/model.json';
const CLASS_NAMES_URL = '/models/plant-disease/class_names.json';
const INPUT_SIZE = 224;

/** Fallback class list used if `/models/plant-disease/class_names.json` fails to load. */
const FALLBACK_CLASS_NAMES: string[] = [
  'Pepper__bell___Bacterial_spot',
  'Pepper__bell___healthy',
  'Potato___Early_blight',
  'Potato___Late_blight',
  'Potato___healthy',
  'Tomato_Bacterial_spot',
  'Tomato_Early_blight',
  'Tomato_Late_blight',
  'Tomato_Leaf_Mold',
  'Tomato_Septoria_leaf_spot',
  'Tomato_Spider_mites_Two_spotted_spider_mite',
  'Tomato__Target_Spot',
  'Tomato__Tomato_YellowLeaf__Curl_Virus',
  'Tomato__Tomato_mosaic_virus',
  'Tomato_healthy',
];

type CropKey = 'Pepper' | 'Potato' | 'Tomato';
type ProblemType = 'fungal' | 'bacterial' | 'viral' | 'pest' | 'healthy';

interface ClassMeta {
  /** Display name (trilingual). */
  label: TrilingualString;
  /** Crop family. */
  crop: CropKey;
  /** True if the class represents a healthy plant. */
  isHealthy: boolean;
  /** Pathogen / problem type. */
  type: ProblemType;
  /** ID into DISEASE_REFS (disease-ref-data.ts), if a curated entry exists. */
  diseaseRefId?: string;
  /** ID into EXPANDED_DISEASES (expanded-disease-database.ts), if a curated entry exists. */
  expandedDiseaseId?: string;
  /** Emoji used in result chips. */
  emoji: string;
}

/**
 * Master class-name → metadata table. Maps the 15 PlantVillage-style model
 * classes onto the disease IDs used by our reference galleries so the
 * detection result can deep-link into trilingual treatment cards.
 */
const CLASS_META: Record<string, ClassMeta> = {
  Pepper__bell___Bacterial_spot: {
    label: { en: 'Pepper — Bacterial Spot', fr: 'Poivron — Tache bactérienne', ar: 'الفلفل — التبقع البكتيري' },
    crop: 'Pepper', isHealthy: false, type: 'bacterial',
    diseaseRefId: 'pep-bacterial-spot', emoji: '🫑',
  },
  Pepper__bell___healthy: {
    label: { en: 'Pepper — Healthy', fr: 'Poivron — Sain', ar: 'الفلفل — سليم' },
    crop: 'Pepper', isHealthy: true, type: 'healthy', emoji: '🫑',
  },
  Potato___Early_blight: {
    label: { en: 'Potato — Early Blight', fr: 'Pomme de terre — Alternariose', ar: 'البطاطا — اللفحة المبكرة' },
    crop: 'Potato', isHealthy: false, type: 'fungal',
    diseaseRefId: 'pot-early-blight', expandedDiseaseId: 'tomato-early-blight', emoji: '🥔',
  },
  Potato___Late_blight: {
    label: { en: 'Potato — Late Blight', fr: 'Pomme de terre — Mildiou', ar: 'البطاطا — اللفحة المتأخرة' },
    crop: 'Potato', isHealthy: false, type: 'fungal',
    diseaseRefId: 'pot-late-blight', expandedDiseaseId: 'tomato-late-blight', emoji: '🥔',
  },
  Potato___healthy: {
    label: { en: 'Potato — Healthy', fr: 'Pomme de terre — Saine', ar: 'البطاطا — سليمة' },
    crop: 'Potato', isHealthy: true, type: 'healthy', emoji: '🥔',
  },
  Tomato_Bacterial_spot: {
    label: { en: 'Tomato — Bacterial Spot', fr: 'Tomate — Tache bactérienne', ar: 'الطماطم — التبقع البكتيري' },
    crop: 'Tomato', isHealthy: false, type: 'bacterial', emoji: '🍅',
  },
  Tomato_Early_blight: {
    label: { en: 'Tomato — Early Blight', fr: 'Tomate — Alternariose', ar: 'الطماطم — اللفحة المبكرة' },
    crop: 'Tomato', isHealthy: false, type: 'fungal',
    diseaseRefId: 'tom-early-blight', expandedDiseaseId: 'tomato-early-blight', emoji: '🍅',
  },
  Tomato_Late_blight: {
    label: { en: 'Tomato — Late Blight', fr: 'Tomate — Mildiou', ar: 'الطماطم — اللفحة المتأخرة' },
    crop: 'Tomato', isHealthy: false, type: 'fungal',
    diseaseRefId: 'tom-late-blight', expandedDiseaseId: 'tomato-late-blight', emoji: '🍅',
  },
  Tomato_Leaf_Mold: {
    label: { en: 'Tomato — Leaf Mold', fr: 'Tomate — Moisissure des feuilles', ar: 'الطماطم — عفن الأوراق' },
    crop: 'Tomato', isHealthy: false, type: 'fungal',
    diseaseRefId: 'tom-leaf-mold', emoji: '🍅',
  },
  Tomato_Septoria_leaf_spot: {
    label: { en: 'Tomato — Septoria Leaf Spot', fr: 'Tomate — Septoriose', ar: 'الطماطم — تبقع السيبتوريا' },
    crop: 'Tomato', isHealthy: false, type: 'fungal',
    diseaseRefId: 'tom-septoria', expandedDiseaseId: 'tomato-septoria', emoji: '🍅',
  },
  Tomato_Spider_mites_Two_spotted_spider_mite: {
    label: { en: 'Tomato — Spider Mites (Two-spotted)', fr: 'Tomate — Tétranyques tisserands', ar: 'الطماطم — العنكبوت الأحمر ذو البقع' },
    crop: 'Tomato', isHealthy: false, type: 'pest',
    diseaseRefId: 'tom-spider-mites', expandedDiseaseId: 'tomato-spider-mites', emoji: '🍅',
  },
  Tomato__Target_Spot: {
    label: { en: 'Tomato — Target Spot', fr: 'Tomate — Tache cible', ar: 'الطماطم — البقعة الهادفة' },
    crop: 'Tomato', isHealthy: false, type: 'fungal', emoji: '🍅',
  },
  Tomato__Tomato_YellowLeaf__Curl_Virus: {
    label: { en: 'Tomato — Yellow Leaf Curl Virus', fr: 'Tomate — Virus de l\'enroulement jaune', ar: 'الطماطم — فيروس تجعد واصفرار الأوراق' },
    crop: 'Tomato', isHealthy: false, type: 'viral',
    diseaseRefId: 'tom-leaf-curl-virus', emoji: '🍅',
  },
  Tomato__Tomato_mosaic_virus: {
    label: { en: 'Tomato — Mosaic Virus', fr: 'Tomate — Virus de la mosaïque', ar: 'الطماطم — فيروس الموزاييك' },
    crop: 'Tomato', isHealthy: false, type: 'viral',
    diseaseRefId: 'tom-mosaic-virus', emoji: '🍅',
  },
  Tomato_healthy: {
    label: { en: 'Tomato — Healthy', fr: 'Tomate — Saine', ar: 'الطماطم — سليمة' },
    crop: 'Tomato', isHealthy: true, type: 'healthy',
    expandedDiseaseId: 'tomato-healthy', emoji: '🍅',
  },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Prediction {
  className: string;
  meta: ClassMeta;
  confidence: number; // 0..1
}

interface DiseaseDetectionModelProps {
  /** Optional: open the Disease Reference Gallery section. Defaults to a toast hint. */
  onOpenDiseaseRef?: () => void;
}

// ---------------------------------------------------------------------------
// Trilingual UI copy
// ---------------------------------------------------------------------------

const TITLE: TrilingualString = {
  en: 'AI Disease Detection (CNN Model)',
  ar: 'كشف الأمراض بالذكاء الاصطناعي (نموذج CNN)',
  fr: 'Détection de Maladies IA (Modèle CNN)',
};

const DESC: TrilingualString = {
  en: 'Upload a leaf photo → instant disease detection with 15 classes across pepper, potato and tomato. Runs entirely in your browser — no internet, no cloud, no API.',
  ar: 'ارفع صورة ورقة ← كشف فوري للمرض عبر 15 فئة للفلفل والبطاطا والطماطم. يعمل بالكامل في متصفحك — بدون إنترنت أو سحابة أو واجهة برمجية.',
  fr: 'Téléversez une photo de feuille → détection instantanée parmi 15 classes pour poivron, pomme de terre et tomate. Tout dans le navigateur — sans internet ni cloud.',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Model: 3-conv-layer CNN (32→64→128 filters) trained on PlantVillage subset. Input 224×224×3, output 15-way softmax. The first model layer is Rescaling(1/255) so we feed raw pixel values. Predictions run via WebGL/WebGPU when available. Use top-1 result for action only when confidence > 70% — otherwise collect a clearer photo.',
  ar: 'النموذج: شبكة CNN من 3 طبقات التفاف (32←64←128 فلتر) مدرّب على جزء من PlantVillage. المدخل 224×224×3، والمخرج softmax من 15 فئة. الطبقة الأولى للنموذج هي Rescaling(1/255) لذلك نمرّر قيم البكسل الخام. يعمل التنبؤ عبر WebGL/WebGPU عند التوفر. اتخذ إجراءً بناءً على أعلى نتيجة فقط عندما تكون الثقة > 70% — وإلا التقط صورة أوضح.',
  fr: 'Modèle : CNN à 3 conv (32→64→128 filtres) entraîné sur PlantVillage. Entrée 224×224×3, sortie softmax 15 classes. La première couche est Rescaling(1/255) — nous passons donc les pixels bruts. Inférence WebGL/WebGPU quand disponible. N\'agir sur le top-1 que si confiance > 70 %, sinon reprendre une photo plus nette.',
};

// ---------------------------------------------------------------------------
// Helper: format confidence as a percentage
// ---------------------------------------------------------------------------

function pct(confidence: number): string {
  return `${(confidence * 100).toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Inner component (loaded only in the browser via next/dynamic)
// ---------------------------------------------------------------------------

function DiseaseDetectionModelInner({ onOpenDiseaseRef }: DiseaseDetectionModelProps) {
  const { language, isRTL } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  // Model + class names state -------------------------------------------------
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [classNames, setClassNames] = useState<string[]>(FALLBACK_CLASS_NAMES);
  const [loadingModel, setLoadingModel] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);

  // Image + prediction state --------------------------------------------------
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[] | null>(null);
  const [predictError, setPredictError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  // Refs ----------------------------------------------------------------------
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const [backend, setBackend] = useState<string>('—');

  // ---- Load model + class names on mount -----------------------------------
  useEffect(() => {
    let cancelled = false;
    let loadedModel: tf.LayersModel | null = null;

    async function loadAll() {
      try {
        // Try WebGL backend, fall back to CPU
        try {
          await tf.setBackend('webgl');
          await tf.ready();
        } catch {
          await tf.setBackend('cpu');
          await tf.ready();
        }
        if (cancelled) return;
        setBackend(tf.getBackend());

        // Load class names (non-blocking — uses fallback on failure)
        try {
          const res = await fetch(CLASS_NAMES_URL, { cache: 'no-store' });
          if (res.ok) {
            const names = (await res.json()) as string[];
            if (Array.isArray(names) && names.length > 0) {
              if (!cancelled) setClassNames(names);
            }
          }
        } catch {
          // Use fallback class names — model still works.
        }
        if (cancelled) return;

        // Load model
        loadedModel = await tf.loadLayersModel(MODEL_URL);
        if (cancelled) {
          loadedModel.dispose();
          return;
        }
        // Warm up: run a zero-tensor through the model to JIT-compile shaders.
        tf.tidy(() => {
          const warmup = tf.zeros([INPUT_SIZE, INPUT_SIZE, 3]);
          loadedModel!.predict(warmup.expandDims(0)) as tf.Tensor;
        });
        setModel(loadedModel);
        setLoadingModel(false);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        setModelError(msg);
        setLoadingModel(false);
        toast({
          title: tr('Model load failed', 'فشل تحميل النموذج', 'Échec du chargement du modèle'),
          description: msg,
          variant: 'destructive',
        });
      }
    }

    loadAll();
    return () => {
      cancelled = true;
      if (loadedModel) {
        try { loadedModel.dispose(); } catch { /* noop */ }
      }
    };
  }, []);

  // ---- Image handling -------------------------------------------------------

  const handleFile = useCallback(
    (file: File) => {
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        toast({
          title: tr('Not an image', 'الملف ليس صورة', 'Pas une image'),
          description: tr('Please upload a JPG, PNG or WEBP photo.', 'يرجى رفع صورة بصيغة JPG أو PNG أو WEBP.', 'Veuillez téléverser une photo JPG, PNG ou WEBP.'),
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 12 * 1024 * 1024) {
        toast({
          title: tr('Image too large', 'الصورة كبيرة جداً', 'Image trop grande'),
          description: tr('Max 12 MB. Please compress or crop the photo.', 'الحد الأقصى 12 ميغابايت. يرجى ضغط أو قص الصورة.', 'Max 12 Mo. Veuillez compresser ou recadrer la photo.'),
          variant: 'destructive',
        });
        return;
      }
      setPredictError(null);
      setPredictions(null);
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const url = typeof reader.result === 'string' ? reader.result : null;
        setImageDataUrl(url);
      };
      reader.onerror = () => {
        toast({
          title: tr('Failed to read file', 'فشل قراءة الملف', 'Échec de lecture du fichier'),
          variant: 'destructive',
        });
      };
      reader.readAsDataURL(file);
    },
    [tr],
  );

  const onFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset value so the same file can be re-selected later.
      e.target.value = '';
    },
    [handleFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // ---- Prediction -----------------------------------------------------------

  const runDetection = useCallback(async () => {
    if (!model) {
      toast({
        title: tr('Model not ready', 'النموذج غير جاهز', 'Modèle non prêt'),
        description: tr('Please wait for the CNN model to finish loading.', 'يرجى انتظار تحميل نموذج CNN.', 'Veuillez attendre le chargement du modèle CNN.'),
        variant: 'destructive',
      });
      return;
    }
    const img = imageElementRef.current;
    if (!img || !img.complete || img.naturalWidth === 0) {
      toast({
        title: tr('Image not ready', 'الصورة غير جاهزة', 'Image non prête'),
        description: tr('Wait a moment for the photo to decode, then retry.', 'انتظر قليلاً لفك ترميز الصورة ثم أعد المحاولة.', 'Attendez que la photo se décode puis réessayez.'),
        variant: 'destructive',
      });
      return;
    }

    setPredicting(true);
    setPredictError(null);

    // Yield to the browser so the spinner can paint before the (sync) predict.
    await new Promise((r) => setTimeout(r, 16));

    try {
      // Preprocess: fromPixels returns int32 [0,255] tensor in HWC format.
      // The model has its own Rescaling(1/255) layer so we feed raw pixels.
      // We use tf.tidy() to auto-dispose intermediate tensors and prevent
      // WebGL memory leaks across many predictions.
      const probs = tf.tidy(() => {
        const raw = tf.browser.fromPixels(img).toFloat();
        const resized = tf.image.resizeBilinear(raw, [INPUT_SIZE, INPUT_SIZE]);
        const batched = resized.expandDims(0); // [1,224,224,3]
        const out = model.predict(batched) as tf.Tensor;
        return out.squeeze().softmax(); // ensure normalized probabilities
      });

      const probsData = await probs.data();
      probs.dispose();

      // Build ranked predictions using class-name order.
      const ranked: Prediction[] = classNames.map((className, idx) => {
        const meta = CLASS_META[className] ?? {
          label: { en: className.replace(/_/g, ' ').trim(), fr: className.replace(/_/g, ' ').trim(), ar: className.replace(/_/g, ' ').trim() },
          crop: 'Tomato' as CropKey,
          isHealthy: /healthy/i.test(className),
          type: (/healthy/i.test(className) ? 'healthy' : /virus/i.test(className) ? 'viral' : /spider|mite/i.test(className) ? 'pest' : /bacterial/i.test(className) ? 'bacterial' : 'fungal') as ProblemType,
          emoji: /tomato/i.test(className) ? '🍅' : /potato/i.test(className) ? '🥔' : /pepper/i.test(className) ? '🫑' : '🌿',
        };
        return { className, meta, confidence: Number(probsData[idx]) || 0 };
      });
      ranked.sort((a, b) => b.confidence - a.confidence);
      setPredictions(ranked.slice(0, 3));
      toast({
        title: tr('Detection complete', 'اكتمل الكشف', 'Détection terminée'),
        description: `${ranked[0].meta.emoji} ${copyFor(language, ranked[0].meta.label.en, ranked[0].meta.label.ar, ranked[0].meta.label.fr)} — ${pct(ranked[0].confidence)}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setPredictError(msg);
      toast({
        title: tr('Prediction failed', 'فشل التنبؤ', 'Échec de la prédiction'),
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setPredicting(false);
    }
  }, [model, classNames, language]);

  // ---- Reset + copy summary -------------------------------------------------

  const handleReset = useCallback(() => {
    setImageDataUrl(null);
    setFileName(null);
    setPredictions(null);
    setPredictError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast({ title: tr('Reset', 'إعادة تعيين', 'Réinitialiser') });
  }, [tr]);

  const topPrediction = predictions?.[0];
  const isHealthyTop = topPrediction?.meta.isHealthy ?? false;

  const summaryText = useMemo(() => {
    if (!predictions || !topPrediction) return '';
    const lines = [
      `Plant Disease Detection — ${new Date().toISOString()}`,
      `Image: ${fileName ?? 'untitled'}`,
      '',
      'Top-3 predictions:',
      ...predictions.map(
        (p, i) =>
          `  ${i + 1}. ${p.meta.label.en} — ${pct(p.confidence)} (${p.meta.crop}, ${p.meta.type})`,
      ),
      '',
      isHealthyTop
        ? 'Verdict: LEAF APPEARS HEALTHY — continue routine scouting.'
        : `Verdict: POSSIBLE DISEASE — ${topPrediction.meta.label.en}. See Disease Reference Gallery for treatment.`,
    ];
    return lines.join('\n');
  }, [predictions, topPrediction, fileName, isHealthyTop]);

  const handleCopySummary = useCallback(async () => {
    if (!summaryText) return;
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast({ title: tr('Summary copied', 'تم نسخ الملخص', 'Résumé copié') });
    } catch {
      toast({
        title: tr('Copy failed', 'فشل النسخ', 'Échec de la copie'),
        variant: 'destructive',
      });
    }
  }, [summaryText, tr]);

  const handleOpenDiseaseRef = useCallback(() => {
    if (onOpenDiseaseRef) {
      onOpenDiseaseRef();
    } else {
      toast({
        title: tr('Disease Reference Gallery', 'معرض الأمراض المرجعي', 'Galerie de référence Maladies'),
        description: tr('Open it from the Plant Protection section below.', 'افتحه من قسم وقاية النباتات أدناه.', 'Ouvrez-le depuis la section Protection des plantes ci-dessous.'),
      });
    }
  }, [onOpenDiseaseRef, tr]);

  // ---- Cross-reference lookups ---------------------------------------------

  const expandedDisease = topPrediction?.meta.expandedDiseaseId
    ? getExpandedDisease(topPrediction.meta.expandedDiseaseId)
    : undefined;

  const diseaseRef = topPrediction?.meta.diseaseRefId
    ? DISEASE_REFS.find((d) => d.id === topPrediction!.meta.diseaseRefId)
    : undefined;

  // ---- Top-3 colors (rose/amber/emerald) -----------------------------------
  const rankColors = ['bg-rose-500', 'bg-amber-500', 'bg-emerald-500'];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <CalculatorShell
      icon={ScanFace}
      title={TITLE}
      description={DESC}
      badge={loadingModel ? tr('Loading…', 'جارٍ التحميل…', 'Chargement…') : model ? tr('CNN Model', 'نموذج CNN', 'Modèle CNN') : tr('Error', 'خطأ', 'Erreur')}
      accent="rose"
      protocolNote={PROTOCOL_NOTE}
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ الملخص', fr: 'Copier le résumé' },
          onClick: handleCopySummary,
          showCheck: copied,
          variant: 'primary',
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
    >
      {/* ----------------------------- Inputs column --------------------------- */}
      <CalculatorShell.Inputs>
        {/* Model status banner */}
        <div className="p-4 rounded-xl border bg-card space-y-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <Cpu className="h-4 w-4 text-rose-600 shrink-0" />
              <span className="text-sm font-bold truncate">
                {tr('CNN Model Status', 'حالة نموذج CNN', 'État du modèle CNN')}
              </span>
            </div>
            {loadingModel ? (
              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950 dark:text-amber-300">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                {tr('Loading model…', 'جارٍ تحميل النموذج…', 'Chargement…')}
              </Badge>
            ) : modelError ? (
              <Badge variant="destructive">{tr('Load failed', 'فشل التحميل', 'Échec')}</Badge>
            ) : model ? (
              <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {tr('Model loaded ✓', 'تم تحميل النموذج ✓', 'Modèle chargé ✓')}
              </Badge>
            ) : null}
          </div>
          {modelError && (
            <div className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-md p-2 leading-relaxed">
              {modelError}
            </div>
          )}
          {model && (
            <div className="text-[11px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
              <span>Backend: <span className="font-mono font-bold">{backend}</span></span>
              <span>Classes: <span className="font-mono font-bold">{classNames.length}</span></span>
              <span>Input: <span className="font-mono font-bold">224×224×3</span></span>
              <span>Size: <span className="font-mono font-bold">~33 MB</span></span>
            </div>
          )}
        </div>

        {/* Drag-and-drop / file input */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={cn(
            'relative rounded-xl border-2 border-dashed p-6 text-center transition-colors',
            isDragging
              ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40'
              : 'border-muted-foreground/30 hover:border-rose-400 hover:bg-rose-50/40 dark:hover:bg-rose-950/20',
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileInputChange}
            className="hidden"
            aria-label={tr('Upload leaf photo', 'ارفع صورة ورقة', 'Téléverser une photo de feuille')}
          />
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300">
              <Upload className="h-6 w-6" />
            </div>
            <div className="text-sm font-semibold">
              {tr('Drag & drop a leaf photo here', 'اسحب وأفلت صورة ورقة هنا', 'Glissez-déposez une photo de feuille ici')}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {tr('JPG, PNG or WEBP — up to 12 MB', 'JPG أو PNG أو WEBP — حتى 12 ميغابايت', 'JPG, PNG ou WEBP — jusqu\'à 12 Mo')}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2"
            >
              <Camera className="h-4 w-4 mr-1.5" />
              {tr('Choose photo', 'اختر صورة', 'Choisir une photo')}
            </Button>
          </div>
        </div>

        {/* Image preview with detection overlay */}
        {imageDataUrl && (
          <div className="rounded-xl border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {tr('Preview', 'معاينة', 'Aperçu')}
              </span>
              {fileName && (
                <span className="text-[11px] text-muted-foreground truncate max-w-[60%]" title={fileName}>
                  {fileName}
                </span>
              )}
            </div>
            <div className="relative w-full aspect-square max-w-sm mx-auto rounded-lg overflow-hidden bg-muted">
              <img
                ref={imageElementRef}
                src={imageDataUrl}
                alt={tr('Uploaded leaf preview', 'معاينة الورقة المرفوعة', 'Aperçu de la feuille téléversée')}
                crossOrigin="anonymous"
                className="w-full h-full object-cover"
                onLoad={() => {
                  // Mark image as ready — tf.browser.fromPixels can read it.
                }}
              />
              {/* Detection overlay frame */}
              <div
                className={cn(
                  'pointer-events-none absolute inset-0 border-4 transition-colors',
                  predictions
                    ? isHealthyTop
                      ? 'border-emerald-500/80'
                      : 'border-rose-500/80'
                    : 'border-transparent',
                )}
              />
              {predictions && topPrediction && (
                <div
                  className={cn(
                    'absolute top-2 left-2 right-2 flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md backdrop-blur-md text-xs font-bold shadow-lg',
                    isHealthyTop
                      ? 'bg-emerald-600/85 text-white'
                      : 'bg-rose-600/85 text-white',
                  )}
                >
                  <span className="truncate flex items-center gap-1.5">
                    <span className="text-base leading-none">{topPrediction.meta.emoji}</span>
                    {copyFor(language, topPrediction.meta.label.en, topPrediction.meta.label.ar, topPrediction.meta.label.fr)}
                  </span>
                  <span className="font-mono shrink-0">{pct(topPrediction.confidence)}</span>
                </div>
              )}
              {predicting && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2 text-rose-600 dark:text-rose-300">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-xs font-bold">
                      {tr('Running CNN inference…', 'جارٍ تشغيل الاستدلال…', 'Inférence CNN…')}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <Button
              type="button"
              onClick={runDetection}
              disabled={!model || loadingModel || predicting || !imageDataUrl}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white"
            >
              {predicting ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <ScanFace className="h-4 w-4 mr-1.5" />
              )}
              {tr('Detect Disease', 'اكتشف المرض', 'Détecter la maladie')}
            </Button>
            {predictError && (
              <div className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-md p-2 leading-relaxed">
                {predictError}
              </div>
            )}
          </div>
        )}
      </CalculatorShell.Inputs>

      {/* ----------------------------- Results column -------------------------- */}
      <CalculatorShell.Results>
        {!predictions && !predicting && (
          <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground space-y-2">
            <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <div className="font-semibold text-foreground">
              {tr('No detection yet', 'لا يوجد كشف بعد', 'Pas encore de détection')}
            </div>
            <div className="text-xs leading-relaxed max-w-md mx-auto">
              {tr(
                'Upload a clear photo of a pepper, potato or tomato leaf (top surface, well-lit, single leaf filling most of the frame), then press “Detect Disease”.',
                'ارفع صورة واضحة لورقة فلفل أو بطاطا أو طماطم (السطح العلوي، إضاءة جيدة، ورقة واحدة تملأ معظم الإطار)، ثم اضغط «اكتشف المرض».',
                'Téléversez une photo nette de feuille de poivron, pomme de terre ou tomate (face supérieure, bien éclairée, une seule feuille remplissant le cadre), puis cliquez sur « Détecter la maladie ».',
              )}
            </div>
          </div>
        )}

        {/* Top-3 predictions with confidence bars */}
        {predictions && predictions.length > 0 && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {tr('Top-3 Predictions', 'أعلى 3 تنبؤات', 'Top-3 prédictions')}
              </span>
              <Badge variant="outline" className="text-rose-700 border-rose-300 bg-rose-50 dark:bg-rose-950 dark:text-rose-300">
                {tr('softmax', 'softmax', 'softmax')}
              </Badge>
            </div>
            <div className="space-y-2.5">
              {predictions.map((p, i) => (
                <div key={p.className} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn('h-2 w-2 rounded-full shrink-0', rankColors[i])} />
                      <span className="text-base leading-none">{p.meta.emoji}</span>
                      <span className="text-sm font-semibold truncate">
                        {copyFor(language, p.meta.label.en, p.meta.label.ar, p.meta.label.fr)}
                      </span>
                    </div>
                    <span className="font-mono text-sm font-bold tabular-nums">
                      {pct(p.confidence)}
                    </span>
                  </div>
                  <Progress
                    value={p.confidence * 100}
                    className="h-2"
                    // Force-override the indicator color via inline style — shadcn
                    // Progress uses `--primary` by default which would clash
                    // with the rose accent gradient.
                    style={{
                      ['--progress-foreground' as string]: i === 0 ? '#e11d48' : i === 1 ? '#f59e0b' : '#10b981',
                    } as React.CSSProperties}
                  />
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                      {p.meta.crop}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 capitalize">
                      {p.meta.type}
                    </Badge>
                    {p.meta.diseaseRefId && (
                      <span className="truncate">
                        {tr('Ref:', 'مرجع:', 'Réf:')} <span className="font-mono">{p.meta.diseaseRefId}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Healthy success card */}
        {predictions && isHealthyTop && topPrediction && (
          <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4 space-y-2">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-300 shrink-0 mt-0.5" />
              <div className="space-y-1 min-w-0">
                <div className="font-bold text-emerald-900 dark:text-emerald-100">
                  {tr('Leaf appears healthy ✓', 'الورقة تبدو سليمة ✓', 'Feuille saine ✓')}
                </div>
                <div className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
                  {copyFor(language,
                    'No disease symptoms detected with high confidence. Continue routine scouting every 5–7 days during flowering and fruit set.',
                    'لم تُكتشف أعراض مرض بثقة عالية. واصل الكشف الدوري كل 5–7 أيام أثناء الإزهار وعقد الثمار.',
                    'Aucun symptôme de maladie détecté avec une confiance élevée. Continuez la prospection tous les 5–7 jours pendant la floraison et le nouaison.',
                  )}
                </div>
                {expandedDisease && (
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-300 italic pt-1">
                    {copyFor(language, expandedDisease.treatment.en, expandedDisease.treatment.ar, expandedDisease.treatment.fr)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Disease warning card */}
        {predictions && !isHealthyTop && topPrediction && (
          <div className="rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-300 shrink-0 mt-0.5" />
              <div className="space-y-1 min-w-0 flex-1">
                <div className="font-bold text-rose-900 dark:text-rose-100 flex items-center gap-2 flex-wrap">
                  <span>{tr('Possible disease detected', 'مرض محتمل مكتشف', 'Maladie possible détectée')}</span>
                  <Badge variant="destructive" className="capitalize">
                    {topPrediction.meta.type}
                  </Badge>
                </div>
                <div className="text-sm font-semibold text-rose-900 dark:text-rose-100">
                  {copyFor(language, topPrediction.meta.label.en, topPrediction.meta.label.ar, topPrediction.meta.label.fr)}
                  {' '}
                  <span className="font-mono text-xs text-rose-700 dark:text-rose-300">
                    ({pct(topPrediction.confidence)})
                  </span>
                </div>
                {topPrediction.confidence < 0.7 && (
                  <div className="text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded p-2">
                    {tr(
                      '⚠ Low confidence — collect a clearer photo (top surface, daylight, single leaf in focus) before applying any treatment.',
                      '⚠ ثقة منخفضة — التقط صورة أوضح (السطح العلوي، ضوء النهار، ورقة واحدة في التركيز البؤري) قبل تطبيق أي علاج.',
                      '⚠ Confiance faible — reprenez une photo plus nette (face supérieure, lumière du jour, une feuille nette) avant tout traitement.',
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Recommended treatment summary */}
            {expandedDisease && (
              <div className="rounded-lg bg-white/60 dark:bg-background/40 border border-rose-200 dark:border-rose-900 p-3 space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                  <span>🧪</span>
                  {tr('Recommended treatment', 'العلاج الموصى به', 'Traitement recommandé')}
                </div>
                <p className="text-xs leading-relaxed text-foreground">
                  {copyFor(language, expandedDisease.treatment.en, expandedDisease.treatment.ar, expandedDisease.treatment.fr)}
                </p>
                {expandedDisease.inpvActives && expandedDisease.inpvActives.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="text-[10px] text-muted-foreground font-semibold me-1">
                      {tr('INPV actives:', 'المواد الفعالة INPV:', 'Matières actures INPV:')}
                    </span>
                    {expandedDisease.inpvActives.map((a) => (
                      <Badge key={a} variant="secondary" className="text-[10px] h-4 px-1.5 font-mono">
                        {a}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cross-reference link to Disease Reference Gallery */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleOpenDiseaseRef}
                className="border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/60"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                {tr('View full disease details', 'عرض تفاصيل المرض الكاملة', 'Voir les détails complets')}
              </Button>
              {diseaseRef && (
                <a
                  href={diseaseRef.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-rose-700 dark:text-rose-300 hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  {tr('Source dataset', 'مجموعة البيانات المصدر', 'Dataset source')}
                  <span className="font-mono">({diseaseRef.sourceDataset})</span>
                </a>
              )}
            </div>

            {/* Fallback hint when no curated cross-reference exists */}
            {!expandedDisease && !diseaseRef && (
              <div className="text-[11px] text-rose-700 dark:text-rose-300 italic">
                {tr(
                  'No curated reference entry for this class yet — consult a local phytopathologist for confirmation.',
                  'لا يوجد إدخال مرجعي منسّق لهذه الفئة بعد — استشر أخصائي أمراض نبات محلي للتأكيد.',
                  'Pas encore d\'entrée de référence pour cette classe — consultez un phytopathologiste local pour confirmer.',
                )}
              </div>
            )}
          </div>
        )}

        {/* Coverage hint footer */}
        <div className="rounded-xl border bg-muted/40 p-3 text-[11px] text-muted-foreground leading-relaxed">
          <div className="font-bold text-foreground mb-1 flex items-center gap-1.5">
            <ScanFace className="h-3.5 w-3.5 text-rose-600" />
            {tr('Coverage', 'التغطية', 'Couverture')}
          </div>
          {tr(
            '15 classes across 3 crops: Pepper (2), Potato (3), Tomato (10). Cross-references the expanded disease database (' + EXPANDED_DISEASES.length + ' curated entries) and the PlantVillage / DeepWeeds reference gallery for trilingual treatment cards.',
            '15 فئة عبر 3 محاصيل: الفلفل (2)، البطاطا (3)، الطماطم (10). يربط بقاعدة الأمراض الموسّعة (' + EXPANDED_DISEASES.length + ' إدخالاً منسّقاً) ومعرض PlantVillage / DeepWeeds المرجعي لبطاقات العلاج ثلاثية اللغة.',
            '15 classes sur 3 cultures : Poivron (2), Pomme de terre (3), Tomate (10). Liens croisés avec la base étendue (' + EXPANDED_DISEASES.length + ' entrées) et la galerie PlantVillage / DeepWeeds pour fiches de traitement trilingues.',
          )}
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}

// ---------------------------------------------------------------------------
// Export — wrap with next/dynamic so SSR is skipped (TF.js needs window/WebGL)
// ---------------------------------------------------------------------------

/**
 * Public export. `next/dynamic` with `{ ssr: false }` ensures the inner
 * component (which imports `@tensorflow/tfjs`) is only evaluated in the
 * browser. A lightweight placeholder is shown during SSR / first paint.
 */
function LoadingPlaceholder() {
  return (
    <div className="w-full rounded-2xl border bg-card p-6 flex flex-col items-center justify-center gap-3 min-h-[260px]">
      <Loader2 className="h-8 w-8 text-rose-500 animate-spin" />
      <div className="text-sm font-semibold text-muted-foreground">
        Loading CNN model viewer…
      </div>
      <div className="text-[11px] text-muted-foreground">
        TensorFlow.js is initialising in your browser.
      </div>
    </div>
  );
}

export const DiseaseDetectionModel = dynamic<
  React.ComponentProps<typeof DiseaseDetectionModelInner>
>(
  () => Promise.resolve(DiseaseDetectionModelInner),
  {
    ssr: false,
    loading: () => <LoadingPlaceholder />,
  },
);
