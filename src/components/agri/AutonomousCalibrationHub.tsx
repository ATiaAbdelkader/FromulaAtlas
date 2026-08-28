'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  Cpu,
  Brain,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  Plus,
  Trash2,
  Download,
  Upload,
  Droplets,
  Sprout,
  Activity,
  Sliders,
  Scale,
  CloudSun,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  type GroundTruthRecord,
  type CropModelCalibration,
  type MicroclimateBias,
  type TrainingTelemetry,
  getGroundTruthRecords,
  saveGroundTruthRecord,
  deleteGroundTruthRecord,
  getCropCalibrations,
  getMicroclimateBiases,
  saveMicroclimateBiases,
  triggerFullEngineRetraining,
  getTrainingTelemetry,
  exportModelWeightsJson,
  importModelWeightsJson,
} from '@/lib/agronomic-calibration-engine';
import {
  type AiFeedbackEntry,
  getAiFeedbackEntries,
  saveAiFeedbackEntry,
  toggleFeedbackRuleActive,
  deleteAiFeedbackEntry,
} from '@/lib/ai-feedback-store';
import { useTranslation, copyFor } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export function AutonomousCalibrationHub() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'models' | 'logger' | 'rlhf' | 'microclimate'>('models');
  const [telemetry, setTelemetry] = useState<TrainingTelemetry | null>(null);
  const [calibrations, setCalibrations] = useState<CropModelCalibration[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<string>('tomato-gh');
  const [groundTruths, setGroundTruths] = useState<GroundTruthRecord[]>([]);
  const [aiFeedback, setAiFeedback] = useState<AiFeedbackEntry[]>([]);
  const [microclimates, setMicroclimates] = useState<MicroclimateBias[]>([]);
  const [isRetraining, setIsRetraining] = useState(false);

  // New Ground Truth Form State
  const [showLogForm, setShowLogForm] = useState(false);
  const [gtParcel, setGtParcel] = useState('Serre Sud 01 - Biskra');
  const [gtRegion, setGtRegion] = useState('Biskra / Zibans (بسكرة)');
  const [gtCropId, setGtCropId] = useState('tomato-gh');
  const [gtSeason, setGtSeason] = useState('2025/2026 Winter');
  const [gtHarvestDate, setGtHarvestDate] = useState(new Date().toISOString().slice(0, 10));
  const [gtSoil, setGtSoil] = useState<'sand' | 'loam' | 'clay' | 'sandy-clay' | 'silt'>('loam');
  const [gtPredYield, setGtPredYield] = useState<number>(130);
  const [gtActYield, setGtActYield] = useState<number>(142);
  const [gtPredWater, setGtPredWater] = useState<number>(4600);
  const [gtActWater, setGtActWater] = useState<number>(4300);
  const [gtIrrType, setGtIrrType] = useState<'drip' | 'pivot' | 'sprinkler' | 'gravity'>('drip');
  const [gtWaterEc, setGtWaterEc] = useState<number>(2.5);
  const [gtN, setGtN] = useState<number>(310);
  const [gtP, setGtP] = useState<number>(135);
  const [gtK, setGtK] = useState<number>(450);
  const [gtNotes, setGtNotes] = useState('');

  // New RLHF Feedback Rule Form State
  const [showRlhfForm, setShowRlhfForm] = useState(false);
  const [fbCategory, setFbCategory] = useState<'irrigation' | 'fertilization' | 'pest_disease' | 'soil' | 'general'>('irrigation');
  const [fbPrompt, setFbPrompt] = useState('');
  const [fbCorrection, setFbCorrection] = useState('');
  const [fbLearnedRule, setFbLearnedRule] = useState('');
  const [fbRegion, setFbRegion] = useState('Biskra');

  const refreshData = () => {
    setTelemetry(getTrainingTelemetry());
    setCalibrations(getCropCalibrations());
    setGroundTruths(getGroundTruthRecords());
    setAiFeedback(getAiFeedbackEntries());
    setMicroclimates(getMicroclimateBiases());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleRetrainAll = () => {
    setIsRetraining(true);
    setTimeout(() => {
      const res = triggerFullEngineRetraining();
      refreshData();
      setIsRetraining(false);
      toast({
        title: tr('Self-Training Pass Complete', 'تمت عملية إعادة التدريب الذاتي بنجاح', 'Réentraînement autonome terminé'),
        description: tr(
          `Updated ${res.modelsUpdated} agronomic models from ${res.groundTruthsProcessed} ground-truth samples (Average Confidence: ${res.averageConfidence}%).`,
          `تم تحديث ${res.modelsUpdated} نموذجاً زراعياً بالاعتماد على ${res.groundTruthsProcessed} عينة حقلية (متوسط الدقة: ${res.averageConfidence}٪).`,
          `Mise à jour de ${res.modelsUpdated} modèles avec ${res.groundTruthsProcessed} échantillons réels (Confiance moyenne : ${res.averageConfidence}%).`
        ),
      });
    }, 900);
  };

  const handleSaveGroundTruth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gtParcel || gtActYield <= 0) {
      toast({
        title: tr('Validation Error', 'خطأ في التحقق', 'Erreur de validation'),
        description: tr('Please provide a valid parcel name and actual yield.', 'يرجى إدخال اسم القطعة والمردود الفعلي بدقة.', 'Veuillez saisir un nom de parcelle et un rendement valide.'),
        variant: 'destructive',
      });
      return;
    }

    saveGroundTruthRecord({
      parcelName: gtParcel,
      region: gtRegion,
      cropId: gtCropId,
      season: gtSeason,
      harvestDate: gtHarvestDate,
      soilTexture: gtSoil,
      predictedYieldTonsHa: Number(gtPredYield),
      actualYieldTonsHa: Number(gtActYield),
      predictedWaterM3Ha: Number(gtPredWater),
      actualWaterM3Ha: Number(gtActWater),
      irrigationType: gtIrrType,
      waterEcDsm: Number(gtWaterEc),
      appliedN: Number(gtN),
      appliedP2O5: Number(gtP),
      appliedK2O: Number(gtK),
      agronomistNotes: gtNotes,
      verifiedByExpert: true,
    });

    refreshData();
    setShowLogForm(false);
    toast({
      title: tr('Harvest Outcome Saved & Model Auto-Tuned!', 'تم حفظ نتيجة الحصاد ومعايرة النموذج تلقائياً!', 'Résultat enregistré & modèle auto-calibré !'),
      description: tr(
        'Bayesian parameter optimizer updated regional Kc curve and nutrient extraction coefficients.',
        'قام المحسن البايزي بتحديث منحنى معامل المحصول ومعاملات استنزاف العناصر في منطقتك.',
        'L’optimiseur bayésien a recalibré le Kc et les coefficients d’extraction nutritive.'
      ),
    });
  };

  const handleSaveRlhfRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbLearnedRule || !fbCorrection) {
      toast({
        title: tr('Missing Rule Guideline', 'يرجى ملء نص القاعدة التوجيهية', 'Règle manquante'),
        description: tr('Please describe the distilled agronomic rule.', 'يرجى تحديد القاعدة الزراعية المستخلصة للذكاء الاصطناعي.', 'Veuillez décrire la règle agronomique synthétisée.'),
        variant: 'destructive',
      });
      return;
    }

    saveAiFeedbackEntry({
      category: fbCategory,
      region: fbRegion,
      userPromptSummary: fbPrompt || 'Agronomic advisory scenario',
      aiResponseSnippet: 'Default heuristic recommendation',
      rating: 'corrected',
      expertCorrectionText: fbCorrection,
      learnedRule: fbLearnedRule,
      authorRole: 'lead_agronomist',
      confidenceWeight: 5,
      isActiveForPrompt: true,
    });

    refreshData();
    setShowRlhfForm(false);
    setFbPrompt('');
    setFbCorrection('');
    setFbLearnedRule('');
    toast({
      title: tr('Expert Guideline Injected into AI Memory', 'تم حقن القاعدة الخبيرة في ذاكرة الذكاء الاصطناعي', 'Règle injectée dans la mémoire IA'),
      description: tr('All AI Specialists will now enforce this regional knowledge rule.', 'ستلتزم كافة روبوتات الذكاء الاصطناعي بهذه القاعدة التوجيهية في استجاباتها القادمة.', 'Les spécialistes IA appliqueront désormais cette règle terrain.'),
    });
  };

  const handleExportWeights = () => {
    const jsonStr = exportModelWeightsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formula-atlas-calibrated-weights-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: tr('Model Weights Exported', 'تم تصدير أوزان النموذج', 'Poids du modèle exportés'),
      description: tr('Portable JSON weights downloaded successfully.', 'تم تحميل ملف الأوزان والمعايرات بصيغة JSON.', 'Fichier JSON téléchargé avec succès.'),
    });
  };

  const handleImportWeights = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const ok = importModelWeightsJson(content);
      if (ok) {
        refreshData();
        toast({
          title: tr('Model Weights Imported Successfully', 'تم استيراد أوزان النموذج بنجاح', 'Poids du modèle importés avec succès'),
          description: tr('Tuned parameters have been restored.', 'تم تحديث معاملات المحاصيل ومنحنيات المعايرة.', 'Paramètres calibrés restaurés.'),
        });
      } else {
        toast({
          title: tr('Import Failed', 'فشل الاستيراد', 'Échec de l’importation'),
          description: tr('Invalid JSON format.', 'صيغة ملف غير صالحة.', 'Format JSON invalide.'),
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  const currentModel = calibrations.find((c) => c.cropId === selectedCropId) || calibrations[0];

  return (
    <div id="autonomous-calibration-hub" className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-2xl p-6 border border-emerald-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <Brain className="w-3.5 h-3.5 animate-pulse" />
              {tr('Autonomous Agronomic Learning & Self-Training Engine', 'المحرك الذاتي للتعلم المستمر والمعايرة الزراعية التلقائية', 'Moteur d’Apprentissage Agronomique Autonome')}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {tr('Continuous Model Training & Ground-Truth Calibration', 'معايرة النماذج وتدريبها تلقائياً عبر النتائج الحقلية الحقيقية', 'Calibrage Continu des Modèles via les Données Réelles')}
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              {tr(
                'Formula Atlas closes the loop between simulated agronomy and real field harvests. Every logged yield, irrigation batch, and expert override continuously refines FAO-56 Kc curves, nutrient response functions, and AI Specialist prompts for your local microclimate.',
                'يربط فورمولا أطلس بين المحاكاة النظرية والنتائج الحقلية الفعلية. كل محصول مسجل، وحجم ري حقيقي، وتوجيه خبير يساهم فورياً في تدريب معاملات المحاصيل (Kc) ودوال التسميد واستجابات الذكاء الاصطناعي وفق مناخك الخاص.',
                'Formula Atlas relie la simulation théorique aux rendements réels. Chaque récolte et ajustement affine les coefficients Kc, l’efficience fertilisante et les prompts de l’IA pour votre microclimat.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              id="retrain-all-btn"
              onClick={handleRetrainAll}
              disabled={isRetraining}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-900/40 gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRetraining ? 'animate-spin' : ''}`} />
              {isRetraining
                ? tr('Retraining Models...', 'جاري إعادة التدريب...', 'Réentraînement en cours...')
                : tr('Trigger Retraining Pass', 'إجراء تدريب شامل للنماذج', 'Lancer un réentraînement')}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportWeights}
                className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 gap-1.5"
                title={tr('Export Calibrated Weights JSON', 'تصدير ملف المعايرة', 'Exporter les poids JSON')}
              >
                <Download className="w-3.5 h-3.5" />
                {tr('Export Weights', 'تصدير الأوزان', 'Exporter')}
              </Button>

              <label className="cursor-pointer">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleImportWeights}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  {tr('Import', 'استيراد', 'Importer')}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Live Telemetry KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400 font-medium">{tr('Ground-Truth Samples', 'العينات الحقلية المسجلة', 'Échantillons Réels')}</div>
            <div className="text-xl font-bold text-emerald-400 mt-1 flex items-baseline gap-1.5">
              {telemetry?.totalGroundTruths || 0}
              <span className="text-[10px] text-slate-400 font-normal">{tr('harvest batches', 'محصول', 'lots')}</span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400 font-medium">{tr('Calibrated Crop Models', 'النماذج الزراعية المعايرة', 'Modèles Calibrés')}</div>
            <div className="text-xl font-bold text-cyan-400 mt-1 flex items-baseline gap-1.5">
              {telemetry?.calibratedModelsCount || 0}
              <span className="text-[10px] text-slate-400 font-normal">{tr('regional cultivars', 'أصناف جهوية', 'variétés')}</span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400 font-medium">{tr('Average Model Confidence', 'متوسط دقة وموثوقية النموذج', 'Confiance Moyenne')}</div>
            <div className="text-xl font-bold text-amber-400 mt-1 flex items-baseline gap-1.5">
              {telemetry?.averageConfidence || 85}%
              <span className="text-[10px] text-emerald-400 font-normal">R² ~ 0.91</span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400 font-medium">{tr('MSE Variance Reduction', 'نسبة تقليص خطأ التنبؤ', 'Réduction d’Erreur')}</div>
            <div className="text-xl font-bold text-teal-400 mt-1 flex items-baseline gap-1.5">
              -{telemetry?.globalMseReductionPercent || 18.4}%
              <span className="text-[10px] text-slate-400 font-normal">{tr('vs default FAO', 'مقارنة بالافتراضي', 'vs FAO')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('models')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'models'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          {tr('Calibrated Crop Parameters', 'المعاملات الزراعية المعايرة', 'Paramètres de Cultures Calibrés')}
        </button>

        <button
          onClick={() => setActiveTab('logger')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'logger'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          {tr('Harvest Ground-Truth Logger', 'سجل الحصاد والنتائج الحقلية', 'Journal des Récoltes Terrain')}
          <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
            {groundTruths.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('rlhf')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'rlhf'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Brain className="w-4 h-4" />
          {tr('AI Specialist In-Context Memory (RLHF)', 'ذاكرة التدريب للذكاء الاصطناعي (RLHF)', 'Mémoire Apprise Spécialistes IA')}
          <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
            {aiFeedback.filter((f) => f.isActiveForPrompt).length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('microclimate')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'microclimate'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <CloudSun className="w-4 h-4" />
          {tr('Microclimate Station Offsets', 'معايرة المحطات المناخية الدقيقة', 'Ajustement Microclimatique')}
        </button>
      </div>

      {/* TAB 1: CALIBRATED CROP MODELS */}
      {activeTab === 'models' && currentModel && (
        <div className="space-y-6">
          {/* Crop Selector Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Label className="text-xs font-semibold uppercase text-slate-500 shrink-0">
                {tr('Select Calibrated Crop Model:', 'اختر النموذج المحصولي المعاير:', 'Sélectionner un modèle :')}
              </Label>
              <Select value={selectedCropId} onValueChange={setSelectedCropId}>
                <SelectTrigger className="w-72 bg-white dark:bg-slate-800 font-medium text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {calibrations.map((c) => (
                    <SelectItem key={c.cropId} value={c.cropId}>
                      {c.cropName} — {c.region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>
                {tr('Samples:', 'العينات:', 'Échantillons :')} <strong className="text-slate-800 dark:text-slate-200">{currentModel.sampleCount}</strong>
              </span>
              <span>•</span>
              <span>
                {tr('Confidence:', 'الموثوقية:', 'Confiance :')}{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">{currentModel.confidence}%</strong>
              </span>
              <span>•</span>
              <span>
                {tr('Last Trained:', 'آخر تدريب:', 'Dernier entraînement :')}{' '}
                <strong className="text-slate-800 dark:text-slate-200">{currentModel.lastTrainedAt}</strong>
              </span>
            </div>
          </div>

          {/* Model Parameter Matrix Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* FAO-56 Kc Curve Calibration */}
            <Card className="p-5 border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {tr('Crop Coefficient (Kc) Tuning', 'معايرة معامل المحصول (Kc)', 'Calibrage Coefficient Kc')}
                  </h3>
                </div>
                <Badge className="bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border-cyan-300 text-[10px]">
                  FAO-56 Tuned
                </Badge>
              </div>

              <p className="text-xs text-slate-500">
                {tr(
                  'Empirical water consumption feedback dynamically adjusts baseline transpirational demand across phenological stages.',
                  'تعديل احتياجات النتح التبخيري بناء على بيانات الاستهلاك المائي الحقلي الفعلي.',
                  'Ajustement des coefficients culturaux selon la consommation d’eau réelle observée.'
                )}
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    Kc Initial (Stade Initial)
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-400 line-through">{currentModel.kcIniDefault.toFixed(2)}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{currentModel.kcIniTuned.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    Kc Mid-Season (Plein Développement)
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-400 line-through">{currentModel.kcMidDefault.toFixed(2)}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{currentModel.kcMidTuned.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    Kc End-Season (Fin de Cycle)
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-400 line-through">{currentModel.kcEndDefault.toFixed(2)}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{currentModel.kcEndTuned.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Water Use Efficiency & Thermal GDD */}
            <Card className="p-5 border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {tr('Water Use Efficiency (WUE)', 'كفاءة استخدام المياه (WUE)', 'Efficience de l’Eau (WUE)')}
                  </h3>
                </div>
                <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 text-[10px]">
                  Calibrated
                </Badge>
              </div>

              <p className="text-xs text-slate-500">
                {tr(
                  'Harvested kilograms produced per cubic meter of applied irrigation under regional conditions.',
                  'الإنتاجية الكيلوغرامية لكل متر مكعب من مياه الري المطبقة في ظروف المنطقة.',
                  'Kilogrammes de rendement obtenus par m³ d’eau d’irrigation apportée.'
                )}
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                      {tr('Calibrated Field WUE', 'كفاءة استغلال الماء الحقلية', 'WUE Calibrée')}
                    </div>
                    <div className="text-xl font-bold text-emerald-950 dark:text-emerald-100 font-mono mt-0.5">
                      {currentModel.wueTuned} <span className="text-xs font-normal">kg / m³</span>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-500 font-mono">
                    <div>{tr('FAO Prior:', 'الافتراضي:', 'Défaut :')} {currentModel.wueDefault} kg/m³</div>
                    <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                      +{(((currentModel.wueTuned - currentModel.wueDefault) / currentModel.wueDefault) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    {tr('Thermal Units to Maturity (GDD)', 'الوحدات الحرارية التراكمية للنضج', 'Somme thermique (DJC)')}
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-400 line-through">{currentModel.gddMaturityDefault}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">{currentModel.gddMaturityTuned}°C</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Nutrient Extraction & Recovery Efficiencies */}
            <Card className="p-5 border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {tr('Nutrient Recovery (N-P-K)', 'معاملات استخلاص الأسمدة', 'Coefficients d’Extraction')}
                  </h3>
                </div>
                <Badge className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 text-[10px]">
                  Tuned
                </Badge>
              </div>

              <p className="text-xs text-slate-500">
                {tr(
                  'Real active nutrient extraction per ton of harvest and soil fertilizer recovery efficiency.',
                  'الاستنزاف الحقيقي للأزوت لكل طن إنتاج وكفاءة امتصاص الأسمدة في التربة.',
                  'Besoins réels en azote par tonne et coefficient d’utilisation des engrais.'
                )}
              </p>

              <div className="space-y-2 pt-1 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    {tr('Nitrogen Extraction / Ton', 'استنزاف الأزوت / طن', 'Extraction N / Tonne')}
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {currentModel.nExtractionPerTonTuned} kg N / t
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    {tr('Fertilizer N Recovery (RE_N)', 'كفاءة امتصاص النيتروجين (RE_N)', 'Efficience N (RE_N)')}
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {(currentModel.recoveryEfficiencyN * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    {tr('Fertilizer P2O5 Recovery (RE_P)', 'كفاءة امتصاص الفوسفور (RE_P)', 'Efficience P (RE_P)')}
                  </span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {(currentModel.recoveryEfficiencyP * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    {tr('Fertilizer K2O Recovery (RE_K)', 'كفاءة امتصاص البوتاسيوم (RE_K)', 'Efficience K (RE_K)')}
                  </span>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                    {(currentModel.recoveryEfficiencyK * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: GROUND-TRUTH HARVEST LOGGER */}
      {activeTab === 'logger' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {tr('Field Harvest Ground-Truth Repository', 'سجل الحصاد والمردود الحقيقي بالقطعة', 'Registre des Récoltes & Vérités Terrain')}
              </h3>
              <p className="text-xs text-slate-500">
                {tr(
                  'Logging post-season harvest data automatically retrains the crop models using Bayesian parameter minimization.',
                  'تسجيل نتائج الحصاد الفعلي يغذي المحرك الرياضي لإعادة تدريب معاملات النموذج آلياً.',
                  'L’enregistrement des rendements réels recalibre instantanément les modèles de prévision.'
                )}
              </p>
            </div>

            <Button
              onClick={() => setShowLogForm(!showLogForm)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {showLogForm
                ? tr('Close Form', 'إغلاق النموذج', 'Fermer')
                : tr('Log New Harvest Outcome', 'تسجيل نتيجة حصاد جديدة', 'Enregistrer une récolte')}
            </Button>
          </div>

          {/* New Ground Truth Entry Form */}
          {showLogForm && (
            <Card className="p-5 border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10">
              <form onSubmit={handleSaveGroundTruth} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <Label className="text-xs font-semibold">{tr('Parcel / Field Name', 'اسم الحقل / القطعة', 'Nom de la parcelle')}</Label>
                    <Input
                      value={gtParcel}
                      onChange={(e) => setGtParcel(e.target.value)}
                      placeholder="e.g. Pivot 04 North"
                      className="mt-1 bg-white dark:bg-slate-900 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">{tr('Region / Agro-Zone', 'المنطقة الزراعية', 'Zone agricole')}</Label>
                    <Input
                      value={gtRegion}
                      onChange={(e) => setGtRegion(e.target.value)}
                      placeholder="e.g. Biskra / Zibans"
                      className="mt-1 bg-white dark:bg-slate-900 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">{tr('Crop Type', 'المحصول', 'Culture')}</Label>
                    <Select value={gtCropId} onValueChange={setGtCropId}>
                      <SelectTrigger className="mt-1 bg-white dark:bg-slate-900 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {calibrations.map((c) => (
                          <SelectItem key={c.cropId} value={c.cropId}>
                            {c.cropName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <Label className="text-xs font-semibold">{tr('Season', 'الموسم', 'Campagne')}</Label>
                    <Input
                      value={gtSeason}
                      onChange={(e) => setGtSeason(e.target.value)}
                      className="mt-1 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">{tr('Harvest Date', 'تاريخ الجني', 'Date récolte')}</Label>
                    <Input
                      type="date"
                      value={gtHarvestDate}
                      onChange={(e) => setGtHarvestDate(e.target.value)}
                      className="mt-1 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">{tr('Soil Texture', 'قوام التربة', 'Texture du sol')}</Label>
                    <Select value={gtSoil} onValueChange={(v: any) => setGtSoil(v)}>
                      <SelectTrigger className="mt-1 bg-white dark:bg-slate-900 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sand">{tr('Sand (رملية)', 'رملية', 'Sableux')}</SelectItem>
                        <SelectItem value="loam">{tr('Loam (طميية)', 'طميية', 'Limoneux')}</SelectItem>
                        <SelectItem value="clay">{tr('Clay (طينية)', 'طينية', 'Argileux')}</SelectItem>
                        <SelectItem value="sandy-clay">{tr('Sandy-Clay (رملية طينية)', 'رملية طينية', 'Sablo-argileux')}</SelectItem>
                        <SelectItem value="silt">{tr('Silt (غرينية)', 'غرينية', 'Limon fin')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">{tr('Irrigation Type', 'نظام الري', 'Système d’irrigation')}</Label>
                    <Select value={gtIrrType} onValueChange={(v: any) => setGtIrrType(v)}>
                      <SelectTrigger className="mt-1 bg-white dark:bg-slate-900 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="drip">{tr('Drip (تقطير)', 'تقطير', 'Goutte-à-goutte')}</SelectItem>
                        <SelectItem value="pivot">{tr('Center Pivot (محوري)', 'محوري', 'Pivot')}</SelectItem>
                        <SelectItem value="sprinkler">{tr('Sprinkler (رش)', 'رش', 'Aspersion')}</SelectItem>
                        <SelectItem value="gravity">{tr('Gravity (سطحي)', 'سطحي', 'Gravitaire')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <Label className="text-xs font-semibold">{tr('Predicted Yield (t/ha)', 'المردود المتوقع (طن/هكتار)', 'Rendement Prévu (t/ha)')}</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={gtPredYield}
                      onChange={(e) => setGtPredYield(Number(e.target.value))}
                      className="mt-1 bg-white dark:bg-slate-900 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      {tr('Actual Harvest Yield (t/ha)', 'المردود الفعلي المجني (طن/هكتار)', 'Rendement Réel (t/ha)')} *
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={gtActYield}
                      onChange={(e) => setGtActYield(Number(e.target.value))}
                      className="mt-1 bg-white dark:bg-slate-900 text-xs font-bold border-emerald-400"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">{tr('Predicted Water (m³/ha)', 'الماء المتوقع (م³/هكتار)', 'Eau Prévue (m³/ha)')}</Label>
                    <Input
                      type="number"
                      value={gtPredWater}
                      onChange={(e) => setGtPredWater(Number(e.target.value))}
                      className="mt-1 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                      {tr('Actual Water Applied (m³/ha)', 'الماء الفعلي المطبق (م³/هكتار)', 'Eau Réelle (m³/ha)')}
                    </Label>
                    <Input
                      type="number"
                      value={gtActWater}
                      onChange={(e) => setGtActWater(Number(e.target.value))}
                      className="mt-1 bg-white dark:bg-slate-900 text-xs font-bold border-cyan-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <Label className="text-xs font-semibold">{tr('Applied N (kg/ha)', 'الآزوت المطبق (كغ/هكتار)', 'N Apporté (kg/ha)')}</Label>
                    <Input
                      type="number"
                      value={gtN}
                      onChange={(e) => setGtN(Number(e.target.value))}
                      className="mt-1 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">{tr('Applied P2O5 (kg/ha)', 'الفوسفور المطبق (كغ/هكتار)', 'P2O5 Apporté (kg/ha)')}</Label>
                    <Input
                      type="number"
                      value={gtP}
                      onChange={(e) => setGtP(Number(e.target.value))}
                      className="mt-1 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">{tr('Applied K2O (kg/ha)', 'البوتاسيوم المطبق (كغ/هكتار)', 'K2O Apporté (kg/ha)')}</Label>
                    <Input
                      type="number"
                      value={gtK}
                      onChange={(e) => setGtK(Number(e.target.value))}
                      className="mt-1 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold">{tr('Agronomist Notes & Observations', 'ملاحظات المهندس الزراعي', 'Observations agronomiques')}</Label>
                  <Textarea
                    value={gtNotes}
                    onChange={(e) => setGtNotes(e.target.value)}
                    placeholder={tr(
                      'Describe cultivar nuances, climatic anomalies, or pest pressure that affected final yield...',
                      'سجل الصنف، الظروف المناخية الاستثنائية، أو الضغط الحشري الذي أثر على النتيجة...',
                      'Précisez la variété, les anomalies météo ou la pression parasitaire...'
                    )}
                    className="mt-1 bg-white dark:bg-slate-900 text-xs h-16"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowLogForm(false)}>
                    {tr('Cancel', 'إلغاء', 'Annuler')}
                  </Button>
                  <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                    {tr('Save Ground-Truth & Recalibrate Model', 'حفظ العينة وإعادة ضبط النموذج فورياً', 'Enregistrer et Recalibrer')}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Ground Truth Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                  <tr>
                    <th className="p-3">{tr('Parcel & Region', 'القطعة والمنطقة', 'Parcelle & Région')}</th>
                    <th className="p-3">{tr('Crop & Season', 'المحصول والموسم', 'Culture & Saison')}</th>
                    <th className="p-3">{tr('Yield: Predicted vs Actual', 'المردود: المتوقع مقابل الفعلي', 'Rendement : Prévu vs Réel')}</th>
                    <th className="p-3">{tr('Water: Pred vs Act', 'الماء: المتوقع مقابل الفعلي', 'Eau : Prévu vs Réel')}</th>
                    <th className="p-3">{tr('NPK Applied (kg/ha)', 'التسميد الفعلي المطبق', 'NPK Apporté')}</th>
                    <th className="p-3 text-right">{tr('Actions', 'الإجراءات', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                  {groundTruths.map((gt) => {
                    const yieldDiff = gt.actualYieldTonsHa - gt.predictedYieldTonsHa;
                    const yieldPct = ((yieldDiff / (gt.predictedYieldTonsHa || 1)) * 100).toFixed(1);
                    return (
                      <tr key={gt.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="p-3">
                          <div className="font-semibold text-slate-900 dark:text-white">{gt.parcelName}</div>
                          <div className="text-[10px] text-slate-500">{gt.region} • {gt.soilTexture}</div>
                        </td>

                        <td className="p-3">
                          <Badge variant="outline" className="font-medium text-[10px]">
                            {gt.cropId}
                          </Badge>
                          <div className="text-[10px] text-slate-500 mt-0.5">{gt.season}</div>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-1.5 font-mono font-medium">
                            <span className="text-slate-400">{gt.predictedYieldTonsHa}t</span>
                            <ArrowRight className="w-3 h-3 text-slate-300" />
                            <span className="font-bold text-slate-900 dark:text-white">{gt.actualYieldTonsHa} t/ha</span>
                            <span className={`text-[10px] font-bold ${yieldDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                              ({yieldDiff >= 0 ? '+' : ''}{yieldPct}%)
                            </span>
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="font-mono text-slate-700 dark:text-slate-300">
                            {gt.actualWaterM3Ha} m³/ha <span className="text-[10px] text-slate-400 font-normal">({gt.irrigationType})</span>
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="font-mono text-slate-700 dark:text-slate-300">
                            N:{gt.appliedN} · P:{gt.appliedP2O5} · K:{gt.appliedK2O}
                          </div>
                        </td>

                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              deleteGroundTruthRecord(gt.id);
                              refreshData();
                              toast({ title: tr('Record deleted', 'تم حذف السجل', 'Enregistrement supprimé') });
                            }}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 h-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RLHF & AI IN-CONTEXT MEMORY */}
      {activeTab === 'rlhf' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                {tr('Reinforcement Learning & Expert Overrides (RLHF)', 'التعلم المعزز وحقن القواعد الإرشادية للذكاء الاصطناعي (RLHF)', 'Apprentissage par Renforcement & Règles Expertes')}
              </h3>
              <p className="text-xs text-slate-500">
                {tr(
                  'Expert corrections transform into dynamic few-shot learning rules automatically fed into AI Specialist prompt headers.',
                  'تصويبات وتوجيهات المهندسين الزراعيين تتحول تلقائياً إلى قواعد توجيهية تُحقن في استجابات الذكاء الاصطناعي.',
                  'Les corrections d’experts deviennent des règles appliquées automatiquement aux assistants IA.'
                )}
              </p>
            </div>

            <Button
              onClick={() => setShowRlhfForm(!showRlhfForm)}
              className="bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {showRlhfForm
                ? tr('Close Form', 'إغلاق', 'Fermer')
                : tr('Teach New Agronomic Guideline', 'تعليم الذكاء الاصطناعي قاعدة جديدة', 'Enseigner une règle')}
            </Button>
          </div>

          {/* New Rule Form */}
          {showRlhfForm && (
            <Card className="p-5 border-purple-200 dark:border-purple-900/60 bg-purple-50/20 dark:bg-purple-950/10">
              <form onSubmit={handleSaveRlhfRule} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">{tr('Category', 'المجال الزراعي', 'Domaine')}</Label>
                    <Select value={fbCategory} onValueChange={(v: any) => setFbCategory(v)}>
                      <SelectTrigger className="mt-1 bg-white dark:bg-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="irrigation">{tr('Irrigation & Water (الري والماء)', 'الري', 'Irrigation')}</SelectItem>
                        <SelectItem value="fertilization">{tr('Fertilization & Chemistry (التسميد)', 'التسميد', 'Fertilisation')}</SelectItem>
                        <SelectItem value="pest_disease">{tr('Pest & Disease IPM (الوقاية والآفات)', 'الآفات', 'Protection des plantes')}</SelectItem>
                        <SelectItem value="soil">{tr('Soil & Salinity (التربة والملوحة)', 'التربة', 'Sols & Salinité')}</SelectItem>
                        <SelectItem value="general">{tr('General Agronomy (عام)', 'عام', 'Général')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="font-semibold">{tr('Target Region / Microclimate', 'المنطقة المستهدفة', 'Région cible')}</Label>
                    <Input
                      value={fbRegion}
                      onChange={(e) => setFbRegion(e.target.value)}
                      placeholder="e.g. Biskra, El Oued, Sétif..."
                      className="mt-1 bg-white dark:bg-slate-900"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="font-semibold">{tr('Scenario / Context Summary', 'سياق التساؤل أو التحدي', 'Contexte / Scénario')}</Label>
                  <Input
                    value={fbPrompt}
                    onChange={(e) => setFbPrompt(e.target.value)}
                    placeholder="e.g. January overcast spells in greenhouse tomatoes"
                    className="mt-1 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <Label className="font-semibold">{tr('Expert Correction & Technical Justification', 'تصويب الخبير والتعليل التقني', 'Correction & Justification technique')}</Label>
                  <Textarea
                    value={fbCorrection}
                    onChange={(e) => setFbCorrection(e.target.value)}
                    placeholder={tr(
                      'Explain what the standard recommendation was lacking and why this correction works in the field...',
                      'وضح سبب تصويب المعيار المعتاد والملاحظات الحقلية المؤكدة...',
                      'Expliquez pourquoi le conseil standard doit être ajusté pour ce terroir...'
                    )}
                    className="mt-1 bg-white dark:bg-slate-900 h-16"
                    required
                  />
                </div>

                <div>
                  <Label className="font-semibold text-purple-700 dark:text-purple-300">
                    {tr('Distilled AI Rule Guideline (Injected into System Prompt)', 'القاعدة المركزة المحقونة في توجيهات الذكاء الاصطناعي', 'Règle synthétisée injectée dans le prompt IA')} *
                  </Label>
                  <Textarea
                    value={fbLearnedRule}
                    onChange={(e) => setFbLearnedRule(e.target.value)}
                    placeholder={tr(
                      'Strict instruction for the AI (e.g. "For Biskra winter greenhouse tomatoes during overcast spells, reduce irrigation to 1.5 L/m²...")',
                      'توجيه صارم للذكاء الاصطناعي (مثلاً: لطماطم البيوت البلاستيكية ببسكرة شتاءً خلال الأيام الغائمة، قلص حجم الري إلى 1.5 لتر/م²...)',
                      'Consigne stricte pour l’IA (ex: "Pour la tomate sous serre à Biskra en hiver par temps couvert...")'
                    )}
                    className="mt-1 bg-white dark:bg-slate-900 font-medium border-purple-400 h-16"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowRlhfForm(false)}>
                    {tr('Cancel', 'إلغاء', 'Annuler')}
                  </Button>
                  <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-500 text-white font-semibold">
                    {tr('Inject into AI Prompt Memory', 'حقن وتفعيل القاعدة فورياً', 'Injecter dans la mémoire')}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Active Rules List */}
          <div className="space-y-3">
            {aiFeedback.map((entry) => (
              <Card key={entry.id} className="p-4 border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                      {entry.category}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {entry.region || 'Regional'} • {entry.userPromptSummary}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Label htmlFor={`switch-${entry.id}`} className="text-[10px]">
                        {entry.isActiveForPrompt
                          ? tr('Active in AI Prompt', 'مفعلة في الذكاء الاصطناعي', 'Active dans l’IA')
                          : tr('Inactive', 'غير مفعلة', 'Inactive')}
                      </Label>
                      <Switch
                        id={`switch-${entry.id}`}
                        checked={entry.isActiveForPrompt}
                        onCheckedChange={() => {
                          toggleFeedbackRuleActive(entry.id);
                          refreshData();
                        }}
                      />
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        deleteAiFeedbackEntry(entry.id);
                        refreshData();
                      }}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 h-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 text-xs">
                  <div className="text-[10px] font-bold uppercase text-purple-700 dark:text-purple-300">
                    {tr('Injected System Prompt Guideline:', 'القاعدة التوجيهية المحقونة:', 'Règle système injectée :')}
                  </div>
                  <p className="text-purple-950 dark:text-purple-100 font-medium mt-0.5">
                    "{entry.learnedRule}"
                  </p>
                </div>

                {entry.expertCorrectionText && (
                  <p className="text-[11px] text-slate-500 italic">
                    {tr('Expert justification:', 'التعليل الفني:', 'Justification :')} {entry.expertCorrectionText}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MICROCLIMATE STATION OFFSETS */}
      {activeTab === 'microclimate' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CloudSun className="w-5 h-5 text-amber-500" />
              {tr('Microclimate & Physical Station Calibration', 'معايرة المحطات المناخية الموضعية والوديان', 'Calibrage Stations Microclimatiques')}
            </h3>
            <p className="text-xs text-slate-500">
              {tr(
                'Auto-tunes global satellite weather models against on-farm weather stations to remove local topography and valley inversion bias.',
                'معايرة تنبؤات الأقمار الصناعية مقارنة بمحطات الأرصاد الحقلية لتصحيح تأثيرات التضاريس والوديان وموجات الصقيع.',
                'Corrige les biais des prévisions météo satellites par rapport aux stations météo physiques locales.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {microclimates.map((station) => (
              <Card key={station.regionId} className="p-4 border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{station.regionName}</h4>
                    <div className="text-[10px] text-slate-500 font-mono">{station.stationName}</div>
                  </div>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-[10px]">
                    {station.samplePoints} pts
                  </Badge>
                </div>

                <div className="space-y-2 text-xs pt-1">
                  <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-slate-900">
                    <span className="text-slate-600 dark:text-slate-400">{tr('Night Temp Offset (Radiative Cooling)', 'فارق الحرارة الليلية', 'Écart Nuit (Refroidissement)')}</span>
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{station.tempNightOffsetC > 0 ? '+' : ''}{station.tempNightOffsetC}°C</span>
                  </div>

                  <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-slate-900">
                    <span className="text-slate-600 dark:text-slate-400">{tr('Day Temp Offset (Solar Gain)', 'فارق الحرارة النهارية', 'Écart Jour')}</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{station.tempDayOffsetC > 0 ? '+' : ''}{station.tempDayOffsetC}°C</span>
                  </div>

                  <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-slate-900">
                    <span className="text-slate-600 dark:text-slate-400">{tr('ET₀ Scaling Multiplier', 'معامل تصحيح البخر نتح', 'Facteur d’Échelle ET₀')}</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">×{station.et0ScalingFactor}</span>
                  </div>

                  <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-slate-900">
                    <span className="text-slate-600 dark:text-slate-400">{tr('Relative Humidity Offset', 'فارق الرطوبة النسبية', 'Écart Humidité')}</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{station.rhOffsetPercent > 0 ? '+' : ''}{station.rhOffsetPercent}%</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
