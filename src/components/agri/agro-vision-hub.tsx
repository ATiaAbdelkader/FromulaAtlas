'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Upload,
  Sparkles,
  Zap,
  Layers,
  Bug,
  Leaf,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  Clock,
  Send,
  Share2,
  RotateCcw,
  Wifi,
  WifiOff,
  Info,
  Maximize2,
  Database,
  ExternalLink,
  BookOpen,
  Check,
  Radio,
  Store,
  Mic,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTranslation, copyFor } from '@/lib/language-store';
import { OutbreakRadarMap } from '@/components/agri/outbreak-radar-map';
import { AgriSuppliersDirectory } from '@/components/agri/agri-suppliers-directory';
import { DarjaVoiceAssistant } from '@/components/agri/darja-voice-assistant';
import {
  analyzeCanopyCoverage,
  detectPestTrapSpots,
  analyzeLeafLesions,
  type CanopyAnalysisResult,
  type PestTrapResult,
  type LeafDiseaseResult,
  type BoundingBox,
} from '@/lib/agro-vision-engine';
import {
  OPEN_AGRI_DATASETS,
  BENCHMARK_DISEASE_TAXONOMY,
  type OpenDatasetReference,
  type DiseaseTaxonomyEntry,
} from '@/lib/open-datasets-taxonomy';

export type VisionTask = 'canopy' | 'pest_trap' | 'disease_lesion';

interface AgroVisionHubProps {
  initialCrop?: string;
  initialWilaya?: string;
  onSyncIrrigation?: (kcb: number, fc: number) => void;
  onLogToFieldBook?: (record: any) => void;
  sunMode?: boolean;
}

// Benchmark Presets from open-source repositories
interface PresetSample {
  id: string;
  datasetOrigin: 'PlantVillage' | 'PlantDoc' | 'PlantWild' | 'CropDeep' | 'IP102';
  task: VisionTask;
  titleEn: string;
  titleFr: string;
  titleAr: string;
  crop: string;
  generateSample: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

const PRESET_LIBRARY: PresetSample[] = [
  {
    id: 'sample-early-blight',
    datasetOrigin: 'PlantVillage',
    task: 'disease_lesion',
    titleEn: 'Tomato Early Blight (PlantVillage 54k)',
    titleFr: 'Alternariose de la tomate (PlantVillage 54k)',
    titleAr: 'اللفحة المبكرة للطماطم (PlantVillage)',
    crop: 'Tomato',
    generateSample: (ctx, w, h) => {
      // Leaf green background
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 0, w, h);
      // Veins
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w / 2, h);
      ctx.lineTo(w / 2, 20);
      ctx.stroke();
      // Concentric target-board lesions
      const lesions = [[w * 0.35, h * 0.35], [w * 0.65, h * 0.55], [w * 0.45, h * 0.75]];
      lesions.forEach(([lx, ly]) => {
        // Yellow chlorotic halo
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(lx, ly, 38, 0, Math.PI * 2);
        ctx.fill();
        // Brown necrotic center
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(lx, ly, 24, 0, Math.PI * 2);
        ctx.fill();
        // Dark ring
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(lx, ly, 14, 0, Math.PI * 2);
        ctx.stroke();
      });
    },
  },
  {
    id: 'sample-late-blight',
    datasetOrigin: 'PlantDoc',
    task: 'disease_lesion',
    titleEn: 'Potato Late Blight (PlantDoc Field YOLO)',
    titleFr: 'Mildiou de la pomme de terre (PlantDoc In-the-Wild)',
    titleAr: 'اللفحة المتأخرة للبطاطا (PlantDoc الحقل)',
    crop: 'Potato',
    generateSample: (ctx, w, h) => {
      ctx.fillStyle = '#166534';
      ctx.fillRect(0, 0, w, h);
      // Irregular dark water-soaked rot
      ctx.fillStyle = '#27272a';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.45, 75, 45, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
      // Pale halo
      ctx.strokeStyle = '#e4e4e7';
      ctx.lineWidth = 3;
      ctx.stroke();
    },
  },
  {
    id: 'sample-yellow-rust',
    datasetOrigin: 'PlantWild',
    task: 'disease_lesion',
    titleEn: 'Wheat Stripe Rust (PlantWild MVPDR)',
    titleFr: 'Rouille jaune striée du blé (PlantWild MVPDR)',
    titleAr: 'الصدأ الأصفر المخطط في القمح (PlantWild)',
    crop: 'Wheat',
    generateSample: (ctx, w, h) => {
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 0, w, h);
      // Parallel orange pustule stripes
      ctx.fillStyle = '#f97316';
      for (let x = 60; x < w - 40; x += 45) {
        for (let y = 30; y < h - 30; y += 12) {
          ctx.beginPath();
          ctx.ellipse(x + Math.sin(y) * 2, y, 4, 8, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
  },
  {
    id: 'sample-sticky-trap',
    datasetOrigin: 'IP102',
    task: 'pest_trap',
    titleEn: 'Yellow Sticky Trap · Tuta & Whiteflies (IP102 #42)',
    titleFr: 'Piège englué jaune · Tuta & Aleurodes (IP102)',
    titleAr: 'لاصق أصفر فرموني · عثة التوتا (IP102)',
    crop: 'Tomato',
    generateSample: (ctx, w, h) => {
      // Yellow card
      ctx.fillStyle = '#facc15';
      ctx.fillRect(0, 0, w, h);
      // Grid lines
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      // 14 dark insect spots
      ctx.fillStyle = '#0f172a';
      const spots = [
        [60, 50], [90, 120], [140, 80], [180, 190], [220, 70],
        [260, 150], [310, 90], [340, 220], [80, 210], [160, 260],
        [280, 240], [330, 130], [200, 130], [120, 170]
      ];
      spots.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.ellipse(x, y, 6, 4, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      });
    },
  },
  {
    id: 'sample-canopy-cropdeep',
    datasetOrigin: 'CropDeep',
    task: 'canopy',
    titleEn: 'Potato Pivot Field Canopy (CropDeep Benchmark)',
    titleFr: 'Couvert de pomme de terre sous pivot (CropDeep)',
    titleAr: 'غطاء خضري لمحصول بطاطا تحت محور (CropDeep)',
    crop: 'Potato',
    generateSample: (ctx, w, h) => {
      // Soil
      ctx.fillStyle = '#452b14';
      ctx.fillRect(0, 0, w, h);
      // Clusters
      ctx.fillStyle = '#22c55e';
      for (let i = 0; i < 40; i++) {
        const x = (i % 8) * (w / 7) + 15;
        const y = Math.floor(i / 8) * (h / 5) + 20;
        ctx.beginPath();
        ctx.arc(x + Math.sin(i) * 10, y + Math.cos(i) * 10, 24 + (i % 12), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(x + 5, y + 5, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
      }
    },
  },
];

export function AgroVisionHub({
  initialCrop = 'Tomato',
  initialWilaya = 'Blida / Mitidja',
  onSyncIrrigation,
  onLogToFieldBook,
  sunMode = false,
}: AgroVisionHubProps) {
  const { language, isRTL } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  const [activeTask, setActiveTask] = useState<VisionTask>('disease_lesion');
  const [selectedCrop, setSelectedCrop] = useState(initialCrop);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('sample-early-blight');
  const [hubMode, setHubMode] = useState<'vision' | 'outbreak_radar' | 'suppliers' | 'voice_assistant' | 'datasets_info'>('vision');
  const [targetPest, setTargetPest] = useState('Tuta Absoluta / Mineuse');
  const [sensitivityThreshold, setSensitivityThreshold] = useState<number>(18);
  const [showMaskOverlay, setShowMaskOverlay] = useState<boolean>(true);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<any | null>(null);

  // Results state
  const [canopyResult, setCanopyResult] = useState<CanopyAnalysisResult | null>(null);
  const [pestResult, setPestResult] = useState<PestTrapResult | null>(null);
  const [diseaseResult, setDiseaseResult] = useState<LeafDiseaseResult | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Monitor network status
  useEffect(() => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Run instant offline computer vision analysis
  const runOfflineAnalysis = useCallback((canvas: HTMLCanvasElement, task: VisionTask) => {
    setIsProcessing(true);
    try {
      if (task === 'canopy') {
        const res = analyzeCanopyCoverage(canvas, sensitivityThreshold);
        setCanopyResult(res);
      } else if (task === 'pest_trap') {
        const res = detectPestTrapSpots(canvas, targetPest);
        setPestResult(res);
      } else if (task === 'disease_lesion') {
        const res = analyzeLeafLesions(canvas);
        setDiseaseResult(res);
      }
    } catch (err) {
      console.error('Vision analysis error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [sensitivityThreshold, targetPest]);

  // Load a specific sample preset
  const loadPresetById = useCallback((presetId: string) => {
    const preset = PRESET_LIBRARY.find(p => p.id === presetId) || PRESET_LIBRARY[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 300;
    ctx.clearRect(0, 0, 400, 300);

    preset.generateSample(ctx, 400, 300);
    const dataUrl = canvas.toDataURL('image/png');
    setPreviewImage(dataUrl);
    setSelectedPresetId(preset.id);
    setActiveTask(preset.task);
    setSelectedCrop(preset.crop);
    setAiResult(null);
    runOfflineAnalysis(canvas, preset.task);
  }, [runOfflineAnalysis]);

  useEffect(() => {
    loadPresetById('sample-early-blight');
  }, [loadPresetById]);

  // Re-run when sensitivity or pest filter changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && previewImage) {
      runOfflineAnalysis(canvas, activeTask);
    }
  }, [sensitivityThreshold, targetPest, runOfflineAnalysis, activeTask, previewImage]);

  // Handle user photo upload / capture
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const scale = Math.min(1, 640 / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setPreviewImage(dataUrl);
        setAiResult(null);
        runOfflineAnalysis(canvas, activeTask);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Call Online Gemini Multi-modal API
  const handleRunOnlineAiAnalysis = async () => {
    if (!previewImage) return;
    setIsAiLoading(true);
    try {
      const taskApiMap: Record<VisionTask, string> = {
        canopy: 'canopy_analysis',
        pest_trap: 'pest_trap_counter',
        disease_lesion: 'disease_diagnosis',
      };

      const res = await fetch('/api/agro-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: previewImage,
          task: taskApiMap[activeTask],
          crop: selectedCrop,
          wilaya: initialWilaya,
          language,
          benchmarkDataset: 'PlantVillage & PlantDoc YOLO',
        }),
      });

      if (!res.ok) throw new Error('AI analysis error');
      const data = await res.json();
      setAiResult(data);
    } catch (err) {
      console.error('Online AI analysis failed:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleShareToWhatsApp = () => {
    let summaryText = '';
    if (activeTask === 'canopy' && canopyResult) {
      summaryText = `🌿 *AgroVision Canopy Cover Report (CropDeep Standard)*\nCrop: ${selectedCrop}\nCanopy Cover (fc): ${canopyResult.canopyCoverPercent}%\nEstimated Kcb: ${canopyResult.estimatedKcb}\nWeed Risk: ${canopyResult.weedPressureRisk}\nIrrigation Adjustment: ${canopyResult.irrigationRuntimeMultiplier}x`;
    } else if (activeTask === 'pest_trap' && pestResult) {
      summaryText = `🪤 *AgroVision Sticky Trap Scout (IP102 Benchmark)*\nPest: ${pestResult.targetPest}\nCount: ${pestResult.pestCount} pests\nStatus: ${pestResult.thresholdStatus.toUpperCase()}\nThreshold: ${pestResult.economicThresholdLevel}/trap\nAction: ${pestResult.recommendation}`;
    } else if (activeTask === 'disease_lesion' && diseaseResult) {
      summaryText = `🍂 *AgroVision Leaf Lesion Diagnostic (PlantVillage / PlantDoc)*\nCrop: ${selectedCrop}\nInfected Leaf Area: ${diseaseResult.infectedAreaPercent}%\nSeverity Stage: ${diseaseResult.severityStage.toUpperCase()}\nDiagnosis: ${aiResult?.diagnosis || diseaseResult.detectedSignature}\nINPV Protocol: ${aiResult?.recommendation || 'Apply authorized INPV copper / systemic fungicide'}\nDAR: ${aiResult?.darDays || 3} days`;
    }

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(summaryText)}`;
    window.open(url, '_blank');
  };

  return (
    <Card className={`border shadow-md overflow-hidden ${sunMode ? 'border-foreground bg-background text-foreground' : 'border-border bg-card'}`}>
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-extrabold tracking-tight">
                  {tr('AgroVision Studio · AI Vision & Open Dataset Hub', 'استوديو الرؤية الحاسوبية وقاعدة بيانات الأمراض المفتوحة', 'Studio AgroVision · Vision IA & Hub Datasets')}
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  PlantVillage + PlantDoc + IP102
                </Badge>
              </div>
              <CardDescription className="text-xs">
                {tr(
                  'Multi-modal pathology classification, YOLO bounding box lesion locator, and INPV phytosanitary guidance.',
                  'تصنيف متعدد الوسائط للأمراض، تحديد بؤر الإصابة بصناديق YOLO، ودليل المبيدات المرخصة جزائرياً مع فترة الأمان.',
                  'Classification multimodale des pathologies, localisation YOLO des lésions et guide phytosanitaire INPV.'
                )}
              </CardDescription>
            </div>
          </div>

          {/* Online / Offline Status Badge */}
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-[11px] font-medium flex items-center gap-1.5 px-2.5 py-1 ${
                isOnline
                  ? 'border-emerald-400 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-amber-400 bg-amber-500/10 text-amber-700 dark:text-amber-300'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{tr('Online + Gemini 2.5 Flash', 'متصل + ذكاء Gemini متعدد الوسائط', 'En ligne + Gemini 2.5 Flash')}</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-amber-600" />
                  <span>{tr('Offline (In-Browser Canvas Engine)', 'بدون إنترنت (محرك المتصفح الفوري)', 'Hors-Ligne (Moteur Canvas Local)')}</span>
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Top Feature Hub Mode Selector (Plantix Parity + AgroVision Super-Capabilities) */}
        <div className="flex items-center justify-between pt-3 gap-2 border-t mt-3 flex-wrap">
          {/* Main Top Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {[
              { id: 'vision', label: tr('📸 AI Vision & Lesion Scanner', '📸 الماسح البصري وبؤر الإصابة (YOLO)', '📸 Scanner Vision & Lésions (YOLO)'), icon: Camera },
              { id: 'outbreak_radar', label: tr('📡 Live Outbreak Radar', '📡 رادار الأوبئة والآفات الحية', '📡 Radar des Foyers d\'Infection'), icon: Radio, badge: 'Live' },
              { id: 'suppliers', label: tr('🏪 Certified Phyto Stores (INPV)', '🏪 المحلات والموزعين المعتمدين', '🏪 Magasins Phyto Agréés'), icon: Store },
              { id: 'voice_assistant', label: tr('🎙️ Darja Field Voice AI', '🎙️ المرشد الصوتي بالدارجة', '🎙️ Assistant Vocal Darja'), icon: Mic },
              { id: 'datasets_info', label: tr('📚 Datasets & INPV Index', '📚 قواعد البيانات المفتوحة وINPV', '📚 Datasets Open-Source'), icon: Database },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = hubMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setHubMode(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-muted/40 text-muted-foreground border-transparent hover:bg-muted/70 hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {hubMode === 'vision' && (
            /* Sub-task switcher when in Vision Mode */
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                { id: 'disease_lesion', label: tr('Pathology %', 'تشخيص %', 'Pathologie %'), icon: AlertTriangle, color: '#ef4444' },
                { id: 'pest_trap', label: tr('Traps (IP102)', 'مصائد', 'Pièges IP102'), icon: Bug, color: '#eab308' },
                { id: 'canopy', label: tr('Canopy (fc)', 'غطاء fc', 'Couvert fc'), icon: Leaf, color: '#16a34a' },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTask === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTask(tab.id as VisionTask);
                      const matchingPreset = PRESET_LIBRARY.find(p => p.task === tab.id);
                      if (matchingPreset) loadPresetById(matchingPreset.id);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                      isActive
                        ? 'bg-card text-foreground border-emerald-500 font-bold shadow-xs'
                        : 'bg-muted/20 text-muted-foreground border-transparent hover:bg-muted/50'
                    }`}
                  >
                    <Icon className="h-3 w-3" style={{ color: tab.color }} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {hubMode === 'outbreak_radar' ? (
          /* ============================================================== */
          /* LIVE OUTBREAK RADAR MAP (PLANTIX RADAR PARITY) */
          /* ============================================================== */
          <OutbreakRadarMap currentWilaya={initialWilaya || 'All'} sunMode={sunMode} />
        ) : hubMode === 'suppliers' ? (
          /* ============================================================== */
          /* CERTIFIED AGRI INPUT & PHYTO STORES DIRECTORY (PLANTIX PARITY) */
          /* ============================================================== */
          <AgriSuppliersDirectory initialWilaya={initialWilaya || 'All'} sunMode={sunMode} />
        ) : hubMode === 'voice_assistant' ? (
          /* ============================================================== */
          /* HANDS-FREE DARJA VOICE ASSISTANT */
          /* ============================================================== */
          <DarjaVoiceAssistant sunMode={sunMode} />
        ) : hubMode === 'datasets_info' ? (
          /* ============================================================== */
          /* OPEN SOURCE DATASETS REPOSITORIES & TAXONOMY EXPLORER */
          /* ============================================================== */
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
              <h4 className="font-extrabold text-sm text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                <span>{tr('Open-Source Agricultural Computer Vision Datasets', 'قواعد بيانات الرؤية الحاسوبية المفتوحة المصدر للزراعة', 'Datasets Open-Source de Vision par Ordinateur Agricole')}</span>
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {tr(
                  'These open-source GitHub repositories provided the training taxonomy, bounding box annotation standards, and spectral indices implemented in our AgroVision engine.',
                  'تم استلهام وتدريب خوارزميات AgroVision وفق تصنيفات هذه المستودعات المفتوحة ومعايير صناديق التحديد (YOLO) ومؤشرات التمايز الطيفي.',
                  'Ces répertoires GitHub ont fourni la taxonomie d\'entraînement, les annotations YOLO et les indices spectraux intégrés dans notre moteur AgroVision.'
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {OPEN_AGRI_DATASETS.map((ds) => (
                <div key={ds.id} className="p-4 rounded-2xl border bg-card shadow-sm space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground">{ds.name}</span>
                      <Badge variant="secondary" className="text-[10px] font-mono">{ds.imageCount}</Badge>
                    </div>
                    <Badge className="text-[9px] bg-muted text-foreground hover:bg-muted">
                      {ds.annotationType}
                    </Badge>
                    <p className="text-xs text-muted-foreground line-clamp-2">{ds.focus}</p>
                    <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 pt-1">
                      🌱 {ds.cropsCovered.slice(0, 4).join(', ')}
                    </div>
                  </div>

                  {ds.repo.startsWith('http') && (
                    <a
                      href={ds.repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 pt-2 border-t"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>{tr('View GitHub Repository', 'فتح مستودع GitHub', 'Voir sur GitHub')}</span>
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* Benchmark Disease Taxonomy List */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>{tr('Homologated Algerian INPV Disease & Pest Directory', 'دليل الأمراض والآفات المرخصة من INPV الجزائري', 'Index Phytosanitaire Homologué INPV Algérie')}</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {BENCHMARK_DISEASE_TAXONOMY.map((entry) => (
                  <div key={entry.id} className="p-3.5 rounded-xl border bg-muted/20 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b pb-1.5">
                      <span className="font-bold text-foreground">
                        {language === 'ar' ? entry.diseaseName_ar : entry.diseaseName}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {entry.datasetOrigin}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground text-[11px]">
                      <span className="font-semibold text-foreground">Wilayas: </span>
                      {entry.algerianRiskRegions.join(', ')}
                    </div>
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                        {tr('Recommended INPV Trade Products:', 'المركبات التجارية المرخصة من INPV:', 'Produits homologués INPV :')}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {entry.inpvProducts.map((p, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-card border text-[10px] font-medium">
                            💊 {p.tradeName} (DAR: {p.darDays}j)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* INTERACTIVE VISION STUDIO */
          /* ============================================================== */
          <>
            {/* Top Control Bar: Upload, Camera, Benchmark Sample Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-muted/40 border">
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-9 px-3.5 gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  <Camera className="h-4 w-4" />
                  <span>{tr('Snap / Upload Photo', 'التقط / ارفع صورة من الحقل', 'Prendre / Importer Photo')}</span>
                </Button>

                {/* Preset Selector Dropdown */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground font-medium hidden sm:inline">{tr('Benchmark Sample:', 'عينة معيارية:', 'Échantillon :')}</span>
                  <select
                    value={selectedPresetId}
                    onChange={(e) => loadPresetById(e.target.value)}
                    className="h-9 px-2.5 rounded-xl border bg-background text-xs font-medium max-w-[220px] sm:max-w-xs"
                  >
                    {PRESET_LIBRARY.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.datasetOrigin}] {language === 'ar' ? p.titleAr : p.titleEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Target Context Selector */}
              <div className="flex items-center gap-2 text-xs">
                {activeTask === 'pest_trap' ? (
                  <select
                    value={targetPest}
                    onChange={(e) => setTargetPest(e.target.value)}
                    className="h-9 px-2.5 rounded-xl border bg-background text-xs font-medium"
                  >
                    <option value="Tuta Absoluta / Mineuse">Tuta Absoluta (Mineuse)</option>
                    <option value="Whiteflies / Aleurodes">Whiteflies / Aleurodes</option>
                    <option value="Aphids / Pucerons">Aphids / Pucerons</option>
                    <option value="Olive Fly / Bactrocera">Olive Fly (Bactrocera)</option>
                    <option value="Fruit Fly / Ceratitis">Medfly (Ceratitis)</option>
                  </select>
                ) : (
                  <select
                    value={selectedCrop}
                    onChange={(e) => setSelectedCrop(e.target.value)}
                    className="h-9 px-2.5 rounded-xl border bg-background text-xs font-medium"
                  >
                    <option value="Tomato">Tomato (Tomate)</option>
                    <option value="Potato">Potato (Pomme de terre)</option>
                    <option value="Wheat">Durum Wheat (Blé Dur)</option>
                    <option value="Citrus">Citrus (Agrumes)</option>
                    <option value="Olive">Olive (Olivier)</option>
                    <option value="Grapevine">Grapevine (Vigne)</option>
                  </select>
                )}
              </div>
            </div>

            {/* Main Interactive Stage: Image Canvas & Visual Overlay */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Image Canvas Stage */}
              <div className="lg:col-span-7 space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-border/80 bg-slate-950 aspect-[4/3] flex items-center justify-center shadow-inner group">
                  {/* Hidden Working Canvas */}
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Base Image Render */}
                  {previewImage && (
                    <img
                      src={previewImage}
                      alt="Field inspection"
                      className="w-full h-full object-contain"
                    />
                  )}

                  {/* Segmentation Mask Overlay (For Canopy and Disease Lesions) */}
                  {showMaskOverlay && activeTask === 'canopy' && canopyResult?.maskDataUrl && (
                    <img
                      src={canopyResult.maskDataUrl}
                      alt="Canopy segmentation mask"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-80 mix-blend-screen"
                    />
                  )}

                  {showMaskOverlay && activeTask === 'disease_lesion' && diseaseResult?.maskDataUrl && (
                    <img
                      src={diseaseResult.maskDataUrl}
                      alt="Lesion segmentation mask"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-85 mix-blend-screen"
                    />
                  )}

                  {/* PlantDoc / YOLO Bounding Boxes Overlay for Leaf Lesions */}
                  {showBoundingBoxes && activeTask === 'disease_lesion' && (
                    <div className="absolute inset-0 pointer-events-none">
                      {aiResult?.detectedBoxes ? (
                        aiResult.detectedBoxes.map((box: any, idx: number) => (
                          <motion.div
                            key={idx}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute border-2 border-amber-400 bg-amber-500/20 rounded shadow-sm flex items-start justify-end p-0.5"
                            style={{
                              left: `${box.xmin / 10}%`,
                              top: `${box.ymin / 10}%`,
                              width: `${(box.xmax - box.xmin) / 10}%`,
                              height: `${(box.ymax - box.ymin) / 10}%`,
                            }}
                          >
                            <span className="bg-amber-600 text-white text-[9px] font-mono px-1.5 py-0.5 rounded -translate-y-4 font-bold shadow">
                              {box.label} {(box.confidence * 100).toFixed(0)}%
                            </span>
                          </motion.div>
                        ))
                      ) : diseaseResult?.detectedBoxes ? (
                        diseaseResult.detectedBoxes.map((box) => (
                          <motion.div
                            key={box.id}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute border-2 border-rose-500 bg-rose-500/20 rounded shadow-sm flex items-start justify-end p-0.5"
                            style={{
                              left: `${box.x}%`,
                              top: `${box.y}%`,
                              width: `${box.width}%`,
                              height: `${box.height}%`,
                            }}
                          >
                            <span className="bg-rose-600 text-white text-[9px] font-mono px-1.5 py-0.5 rounded -translate-y-4 font-bold shadow">
                              {box.label}
                            </span>
                          </motion.div>
                        ))
                      ) : null}
                    </div>
                  )}

                  {/* Bounding Boxes Overlay (For Sticky Pest Traps - IP102) */}
                  {showBoundingBoxes && activeTask === 'pest_trap' && pestResult?.boundingBoxes && (
                    <div className="absolute inset-0 pointer-events-none">
                      {pestResult.boundingBoxes.map((box) => (
                        <motion.div
                          key={box.id}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute border-2 border-rose-500 bg-rose-500/20 rounded shadow-sm flex items-start justify-end p-0.5"
                          style={{
                            left: `${box.x}%`,
                            top: `${box.y}%`,
                            width: `${box.width}%`,
                            height: `${box.height}%`,
                          }}
                        >
                          <span className="bg-rose-600 text-white text-[8px] font-mono px-1 rounded -translate-y-3 font-bold">
                            {box.label}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Loading spinner */}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center">
                      <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
                    </div>
                  )}

                  {/* Top-Right Mask & Box Toggle Buttons */}
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    {(activeTask === 'canopy' || activeTask === 'disease_lesion') && (
                      <button
                        type="button"
                        onClick={() => setShowMaskOverlay(!showMaskOverlay)}
                        className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold backdrop-blur-sm border border-slate-700 flex items-center gap-1.5 transition-all shadow-md"
                      >
                        {showMaskOverlay ? <Eye className="h-3.5 w-3.5 text-emerald-400" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                        <span>{showMaskOverlay ? tr('Mask ON', 'القناع مفعّل', 'Masque Actif') : tr('Original', 'الأصلية', 'Original')}</span>
                      </button>
                    )}

                    {(activeTask === 'disease_lesion' || activeTask === 'pest_trap') && (
                      <button
                        type="button"
                        onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                        className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold backdrop-blur-sm border border-slate-700 flex items-center gap-1.5 transition-all shadow-md"
                      >
                        <Layers className="h-3.5 w-3.5 text-amber-400" />
                        <span>{showBoundingBoxes ? 'YOLO Boxes ON' : 'Boxes OFF'}</span>
                      </button>
                    )}
                  </div>

                  {/* Bottom Caption Pill */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md text-white text-xs border border-slate-800">
                    <span className="font-mono text-[11px] truncate">
                      {PRESET_LIBRARY.find(p => p.id === selectedPresetId)?.titleEn || 'Live Custom Capture'}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">
                      {activeTask === 'canopy' ? 'U-Net ExG Mask' : activeTask === 'pest_trap' ? 'IP102 Trap Boxes' : 'PlantDoc YOLO'}
                    </span>
                  </div>
                </div>

                {/* Sensitivity / Tuning Slider */}
                <div className="p-3.5 rounded-xl bg-muted/30 border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <Sliders className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{tr('Vision Threshold Tuning', 'حساسية عتبة التجزئة للبكسل', 'Sensibilité du Seuil de Détection')}</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-600">{sensitivityThreshold}</span>
                  </div>
                  <Slider
                    value={[sensitivityThreshold]}
                    min={5}
                    max={45}
                    step={1}
                    onValueChange={(val) => setSensitivityThreshold(val[0])}
                  />
                </div>
              </div>

              {/* Right Column: Quantitative Agronomic Output & Actions */}
              <div className="lg:col-span-5 space-y-4">
                {/* ============================================================== */}
                {/* TASK 1: LEAF LESION SEVERITY (PlantVillage / PlantDoc) */}
                {/* ============================================================== */}
                {activeTask === 'disease_lesion' && diseaseResult && (
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl border bg-card shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-muted-foreground uppercase block">{tr('Optical Pathology Signature', 'البصمة الطيفية للمرض', 'Signature Optique Pathologique')}</span>
                          <span className="text-sm font-extrabold text-foreground">{diseaseResult.detectedSignature}</span>
                        </div>
                        <Badge
                          className={`font-mono text-sm px-2.5 py-1 ${
                            diseaseResult.severityStage === 'critical' || diseaseResult.severityStage === 'severe'
                              ? 'bg-rose-600 text-white'
                              : diseaseResult.severityStage === 'moderate'
                              ? 'bg-amber-500 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {diseaseResult.infectedAreaPercent}% {tr('Lesion Area', 'مساحة الإصابة', 'Surface Atteinte')}
                        </Badge>
                      </div>

                      <div className="w-full bg-muted rounded-full h-3.5 overflow-hidden flex border">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-500"
                          style={{ width: `${diseaseResult.healthyAreaPercent}%` }}
                        />
                        <div
                          className="bg-rose-600 h-full transition-all duration-500"
                          style={{ width: `${diseaseResult.infectedAreaPercent}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                        <div className="p-2.5 rounded-xl bg-muted/50 border">
                          <span className="text-[10px] text-muted-foreground block font-bold uppercase">{tr('Severity Stage', 'درجة الخطورة المرضية', 'Stade de Sévérité')}</span>
                          <span className="text-sm font-extrabold uppercase text-foreground">{diseaseResult.severityStage}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-muted/50 border">
                          <span className="text-[10px] text-muted-foreground block font-bold uppercase">{tr('Chlorotic Halo', 'اصفرار نسيجي مرافق', 'Halo Chlorotique')}</span>
                          <span className="text-sm font-bold text-foreground">{diseaseResult.chlorosisDetected ? tr('Detected', 'موجود', 'Détecté') : tr('None', 'غير موجود', 'Absent')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ============================================================== */}
                {/* TASK 2: PEST TRAP COUNTER (IP102) */}
                {/* ============================================================== */}
                {activeTask === 'pest_trap' && pestResult && (
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl border bg-card shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground uppercase">{tr('Detected Insects on Card', 'الحشرات المحصورة في المصيدة', 'Insectes Détectés sur Plaque')}</span>
                        <Badge
                          className={`font-mono text-sm px-2.5 py-0.5 ${
                            pestResult.thresholdStatus === 'critical'
                              ? 'bg-rose-600 text-white'
                              : pestResult.thresholdStatus === 'warning'
                              ? 'bg-amber-500 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {pestResult.pestCount} {tr('Pests', 'حشرة', 'Ravageurs')}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                        <div className="p-2.5 rounded-xl bg-muted/50 border">
                          <span className="text-[10px] text-muted-foreground block font-bold uppercase">{tr('Trap Density', 'الكثافة لكل ديسم²', 'Densité / dm²')}</span>
                          <span className="text-base font-mono font-bold">{pestResult.densityPerDm2} / dm²</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-muted/50 border">
                          <span className="text-[10px] text-muted-foreground block font-bold uppercase">{tr('Economic Threshold (ETL)', 'عتبة التدخل الاقتصادية', 'Seuil d’Intervention')}</span>
                          <span className="text-base font-mono font-bold">{pestResult.economicThresholdLevel} / trap</span>
                        </div>
                      </div>

                      <div
                        className={`p-3.5 rounded-xl border text-xs leading-relaxed font-medium ${
                          pestResult.thresholdStatus === 'critical'
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
                            : pestResult.thresholdStatus === 'warning'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold mb-1">
                          {pestResult.thresholdStatus === 'critical' ? (
                            <AlertTriangle className="h-4 w-4 text-rose-600" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          )}
                          <span>
                            {pestResult.thresholdStatus === 'critical'
                              ? tr('CRITICAL ETL EXCEEDED', 'تنبيه: تجاوز العتبة الاقتصادية', 'SEUIL CRITIQUE DÉPASSÉ')
                              : pestResult.thresholdStatus === 'warning'
                              ? tr('WARNING: APPROACHING THRESHOLD', 'تحذير: اقتراب من حد الخطر', 'ATTENTION: SEUIL PROCHE')
                              : tr('SAFE: BELOW ECONOMIC THRESHOLD', 'آمن: دون العتبة الاقتصادية', 'SÉCURISÉ: SOUS LE SEUIL')}
                          </span>
                        </div>
                        <p>{pestResult.recommendation}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ============================================================== */}
                {/* TASK 3: CANOPY COVER (CropDeep & FAO-56) */}
                {/* ============================================================== */}
                {activeTask === 'canopy' && canopyResult && (
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl border bg-card shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground uppercase">{tr('Canopy Fraction (fc)', 'نسبة الغطاء النباتي (fc)', 'Fraction de Couvert (fc)')}</span>
                        <Badge className="bg-emerald-600 text-white font-mono">{canopyResult.canopyCoverPercent}%</Badge>
                      </div>

                      <div className="w-full bg-muted rounded-full h-3.5 overflow-hidden flex border">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-500"
                          style={{ width: `${canopyResult.canopyCoverPercent}%` }}
                        />
                        <div
                          className="bg-amber-800 h-full transition-all duration-500"
                          style={{ width: `${canopyResult.bareSoilPercent}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <span className="text-[10px] text-muted-foreground block font-bold uppercase">{tr('Estimated Kcb', 'معامل المحصول القاعدي Kcb', 'Kcb Basal Estimé')}</span>
                          <span className="text-lg font-mono font-extrabold text-emerald-700 dark:text-emerald-300">{canopyResult.estimatedKcb}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                          <span className="text-[10px] text-muted-foreground block font-bold uppercase">{tr('Leaf Area Index (LAI)', 'دليل المساحة الورقية LAI', 'Indice Foliaire (LAI)')}</span>
                          <span className="text-lg font-mono font-extrabold text-cyan-700 dark:text-cyan-300">{canopyResult.leafAreaIndexEstimate} m²/m²</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-muted/40 border text-xs space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-foreground">
                          <Droplets className="h-3.5 w-3.5 text-cyan-600" />
                          <span>{tr('FAO-56 Irrigation Adjustment', 'ضبط توقيت الري حسب الغطاء الفعلي', 'Ajustement Irrigation FAO-56')}</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {tr(
                            `Crop is at ${canopyResult.canopyCoverPercent}% ground cover. Apply ${canopyResult.irrigationRuntimeMultiplier}x standard ET₀ runtime.`,
                            `المحصول يغطي ${canopyResult.canopyCoverPercent}% من المساحة. اضبط وقت الضخ بنسبة ${canopyResult.irrigationRuntimeMultiplier}× من المعدل النظري.`,
                            `Le couvert est à ${canopyResult.canopyCoverPercent}%. Appliquez ${canopyResult.irrigationRuntimeMultiplier}x le temps ET₀ standard.`
                          )}
                        </p>
                      </div>
                    </div>

                    {onSyncIrrigation && (
                      <Button
                        type="button"
                        onClick={() => onSyncIrrigation(canopyResult.estimatedKcb, canopyResult.canopyCoverPercent)}
                        className="w-full h-10 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs gap-2 shadow-sm"
                      >
                        <Droplets className="h-4 w-4" />
                        <span>{tr('Sync Kcb to FAO-56 Water Budget', 'تحديث معامل Kcb في حاسبة الري', 'Synchroniser avec le Bilan Hydrique')}</span>
                      </Button>
                    )}
                  </div>
                )}

                {/* ============================================================== */}
                {/* ONLINE GEMINI 2.5 FLASH MULTIMODAL DEEP DIAGNOSIS */}
                {/* ============================================================== */}
                <div className="pt-2 border-t space-y-3">
                  <Button
                    type="button"
                    onClick={handleRunOnlineAiAnalysis}
                    disabled={isAiLoading || !previewImage}
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs sm:text-sm gap-2 shadow-md hover:scale-[1.01] transition-all"
                  >
                    {isAiLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>{tr('Consulting Gemini 2.5 Flash Vision...', 'جارٍ التحليل الذكي عبر Gemini 2.5 Flash...', 'Analyse Multimodale Gemini 2.5 Flash...')}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-amber-300" />
                        <span>{tr('Deep AI Multi-modal Diagnosis (INPV + DAR)', 'تشخيص عميق بالذكاء الاصطناعي (دليل INPV وفترة الأمان)', 'Diagnostic Approfondi IA (Index INPV + DAR)')}</span>
                      </>
                    )}
                  </Button>

                  {/* Online AI Result Panel */}
                  <AnimatePresence>
                    {aiResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 space-y-3 text-xs"
                      >
                        <div className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                            <ShieldCheck className="h-4 w-4" />
                            <span>{language === 'ar' ? (aiResult.diagnosis_ar || aiResult.primarySpecies_ar || aiResult.summary_ar) : (aiResult.diagnosis || aiResult.primarySpecies || aiResult.summary)}</span>
                          </div>
                          {aiResult.darDays && (
                            <Badge className="bg-amber-600 text-white font-mono text-[10px]">
                              DAR: {aiResult.darDays} {tr('days safety', 'أيام أمان', 'jours')}
                            </Badge>
                          )}
                        </div>

                        <p className="text-muted-foreground leading-relaxed">
                          {language === 'ar' ? (aiResult.recommendation_ar || aiResult.summary_ar) : (aiResult.recommendation || aiResult.summary)}
                        </p>

                        {aiResult.inpvTradeProducts && (
                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{tr('Homologated INPV Commercial Formulations:', 'المركبات التجارية المرخصة رسمياً (INPV):', 'Produits commerciaux homologués INPV :')}</span>
                            <div className="flex flex-wrap gap-1">
                              {aiResult.inpvTradeProducts.map((prod: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 rounded-md bg-card border text-[11px] font-medium">
                                  💊 {prod}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action Buttons: WhatsApp Share & Field Record Book */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleShareToWhatsApp}
                      className="flex-1 h-9 rounded-xl text-xs gap-1.5 font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>{tr('WhatsApp Report', 'مشاركة عبر واتساب', 'Rapport WhatsApp')}</span>
                    </Button>

                    {onLogToFieldBook && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onLogToFieldBook({
                            date: new Date().toISOString(),
                            task: activeTask,
                            crop: selectedCrop,
                            summary: aiResult?.recommendation || 'Vision scout completed',
                          });
                        }}
                        className="flex-1 h-9 rounded-xl text-xs gap-1.5 font-semibold"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{tr('Save to Field Book', 'حفظ في سجل الحقل', 'Enregistrer au Carnet')}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
