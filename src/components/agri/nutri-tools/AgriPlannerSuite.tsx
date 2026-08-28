'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Microscope,
  Brain,
  FlaskConical,
  Upload,
  Leaf,
  Loader2,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Info,
  Layers,
  Sprout,
  Activity,
  Zap,
} from 'lucide-react';
import {
  PLANT_DISEASES,
  recommendCrops,
  recommendFertilizer,
  type PlantDisease,
} from '@/lib/plant-disease-data';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';

const SEVERITY_CLASSES: Record<PlantDisease['severity'], string> = {
  low: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
  moderate: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
  high: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800',
  critical: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800',
};

const CROP_LIST = [...new Set(PLANT_DISEASES.map((d) => d.crop))].sort();

function localizeSeverity(language: Parameters<typeof copyFor>[0], value: string) {
  const labels: Record<string, string> = { low: 'منخفضة', moderate: 'متوسطة', high: 'مرتفعة', critical: 'حرجة' };
  return copyFor(language, value, labels[value] || value);
}

function localizeStatus(language: Parameters<typeof copyFor>[0], value: string) {
  const labels: Record<string, string> = { unknown: 'غير مؤكد', disease: 'مرض نباتي', pest: 'آفة حشرية', nutrient: 'نقص غذائي' };
  return copyFor(language, value.replace('_', ' '), labels[value] || value.replace('_', ' '));
}

export function AgriPlannerSuite() {
  const { language, isRTL } = useTranslation();
  const isAr = language === 'ar';
  const isFr = language === 'fr';

  const tr = (enText: string, arText: string, frText?: string) => copyFor(language, enText, arText, frText);

  const [activeTab, setActiveTab] = useState<'disease' | 'crop' | 'fert'>('disease');

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-cyan-950 text-white p-6 shadow-xl border border-emerald-700/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                <Leaf className="h-6 w-6 text-emerald-300" />
              </span>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  {tr('AgriPlanner AI Diagnostics & Agronomy Suite', 'حزمة المخطط الزراعي الذكي وتشخيص الأمراض', 'Suite Agronomique & Diagnostic IA AgriPlanner')}
                  <Badge variant="outline" className="bg-emerald-500/20 text-emerald-200 border-emerald-400/40 text-[10px] uppercase tracking-wider">
                    AI VLM 2.5
                  </Badge>
                </h2>
              </div>
            </div>
            <p className="text-sm text-emerald-100/90 max-w-3xl leading-relaxed">
              {tr(
                'Integrated agronomist decision workspace: Computer-vision plant pathology, multi-factor crop suitability matching, and precise soil-adjusted fertilizer formulations.',
                'مساحة عمل متكاملة للمهندس والمزارع: تشخيص أمراض النبات بالرؤية الحاسوبية، وتوصيات المحاصيل بحسب المناخ والتربة، وحساب التسميد الدقيق.',
                'Espace décisionnel complet : Détection des maladies par vision IA, recommandation de cultures et plan de fertilisation ajusté au sol.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-black/25 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-xs text-emerald-200">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>{tr('FAO & Global Crop Registry', 'مطابق لمعايير الفاو وسجل المحاصيل', 'Normes FAO & Registre Mondial')}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill Bar inside Header */}
        <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('disease')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'disease'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-emerald-100'
            }`}
          >
            <Microscope className="h-4 w-4 text-emerald-200" />
            <span>{tr('Pathology & Disease AI', 'تشخيص الأمراض والآفات', 'Diagnostic Maladies & Ravageurs')}</span>
            <Badge variant="outline" className="bg-white/20 text-white border-0 text-[10px] px-1.5 py-0">
              {PLANT_DISEASES.length}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab('crop')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'crop'
                ? 'bg-teal-500 text-white shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-teal-100'
            }`}
          >
            <Brain className="h-4 w-4 text-teal-200" />
            <span>{tr('Crop Recommendation Engine', 'محرك توصية المحاصيل المثلى', 'Moteur de Choix Cultural')}</span>
          </button>

          <button
            onClick={() => setActiveTab('fert')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'fert'
                ? 'bg-cyan-500 text-white shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-cyan-100'
            }`}
          >
            <FlaskConical className="h-4 w-4 text-cyan-200" />
            <span>{tr('Fertilizer Formulator', 'مرشد التسميد والتراكيب', 'Formulation & Conseils Engrais')}</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'disease' && <DiseaseTab />}
      {activeTab === 'crop' && <CropTab />}
      {activeTab === 'fert' && <FertilizerTab />}
    </div>
  );
}

interface SymptomResult {
  problem_type: string;
  problem_name: string;
  problem_name_ar?: string;
  problem_name_fr?: string;
  confidence: number;
  symptoms_observed: string[];
  possible_causes: string[];
  severity: string;
  recommendation: string;
  suggested_active_matters: string[];
  reviewRequired?: boolean;
  referenceMatches?: { diseaseRefId: string; matchReason: string; source: { dataset: string; url: string; imageCount: number } }[];
  needsSecondPhoto?: boolean;
}

function DiseaseTab() {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const isFr = language === 'fr';
  const tr = (enText: string, arText: string, frText?: string) => copyFor(language, enText, arText, frText);

  const [cropFilter, setCropFilter] = useState<string>('all');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [vlmResponse, setVlmResponse] = useState<SymptomResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () => PLANT_DISEASES.filter((d) => cropFilter === 'all' || d.crop === cropFilter),
    [cropFilter]
  );

  const handleUpload = async (file: File) => {
    setError('');
    setVlmResponse(null);
    if (!file.type.startsWith('image/')) {
      setError(tr('Please upload a JPG, PNG, WEBP, or GIF image.', 'يرجى رفع صورة بصيغة JPG أو PNG أو WEBP أو GIF.'));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError(tr('Please choose an image smaller than 8 MB.', 'يرجى اختيار صورة أصغر من 8 ميغابايت.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setLoading(true);
      try {
        const res = await fetch('/api/identify-symptom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl, crop: cropFilter === 'all' ? undefined : cropFilter }),
        });
        const data = await res.json();
        if (!res.ok || data.error) setError(tr(data.error || `HTTP ${res.status}`, 'تعذر إكمال تحليل الصورة.'));
        else setVlmResponse(data as SymptomResult);
      } catch (e) {
        setError(tr(e instanceof Error ? e.message : 'The AI service is temporarily unavailable.', 'خدمة الذكاء الاصطناعي غير متاحة مؤقتاً.'));
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => setError(tr('Failed to read the image.', 'تعذر قراءة الصورة.'));
    reader.readAsDataURL(file);
  };

  const isUnknown = vlmResponse?.problem_type === 'unknown';

  return (
    <div className="space-y-6">
      {/* Upload and AI Analyzer Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Upload & Diagnostic Trigger */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/40 pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Upload className="h-4 w-4 text-emerald-600" />
                  {tr('Leaf & Symptom Image Input', 'رفع صورة الورقة أو العرض المرضي', 'Téléverser photo de feuille')}
                </CardTitle>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  Max 8 MB
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                  imagePreview
                    ? 'border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/20'
                    : 'border-muted-foreground/30 hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/30'
                }`}
              >
                {imagePreview ? (
                  <div className="space-y-3">
                    <img
                      src={imagePreview}
                      alt="Plant symptom preview"
                      className="max-h-48 mx-auto rounded-xl object-contain shadow-md border"
                    />
                    <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      {tr('Click to select another photo', 'انقر لاختيار صورة أخرى', 'Cliquer pour changer de photo')}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full w-12 h-12 mx-auto flex items-center justify-center shadow-inner">
                      <Microscope className="h-6 w-6" />
                    </div>
                    <div className="font-semibold text-sm">
                      {tr('Drop photo here or click to browse', 'اسحب الصورة هنا أو انقر للتصفح', 'Glissez la photo ou cliquez pour parcourir')}
                    </div>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      {tr('Clear close-up of leaf, stem, or fruit with lesions or yellowing', 'صورة واضحة وقريبة للورقة أو الساق أو الثمرة المصابة', 'Gros plan net des feuilles ou fruits avec symptômes')}
                    </p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              />

              {loading && (
                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-200">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  <span>{tr('Analyzing botanical symptoms via Vision AI model...', 'جارٍ فحص الأعراض النباتية عبر الذكاء الاصطناعي...', 'Analyse en cours par l’IA vision...')}</span>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: AI Diagnostic Results Report */}
        <div className="lg:col-span-7 space-y-4">
          {vlmResponse && !loading ? (
            <Card className="border-emerald-300 dark:border-emerald-800 shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-background dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-background pb-4 border-b">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold border-emerald-300">
                      {localizeStatus(language, vlmResponse.problem_type)}
                    </Badge>
                    <Badge variant="outline" className={`font-semibold ${SEVERITY_CLASSES[vlmResponse.severity as PlantDisease['severity'] || 'moderate']}`}>
                      {localizeSeverity(language, vlmResponse.severity)} {tr('Severity', 'الخطورة', 'Gravité')}
                    </Badge>
                  </div>
                  <div className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5" />
                    <span>{Math.round(vlmResponse.confidence * 100)}% {tr('Confidence', 'نسبة الثقة', 'Confiance')}</span>
                  </div>
                </div>

                <div className="mt-2">
                  <h3 className="text-lg font-black text-foreground">
                    {isAr ? vlmResponse.problem_name_ar || vlmResponse.problem_name : vlmResponse.problem_name}
                  </h3>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-4 text-xs">
                {/* Symptoms Observed */}
                {vlmResponse.symptoms_observed.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                      {tr('Observed Botanical Symptoms', 'الأعراض النباتية المرصودة', 'Symptômes botaniques observés')}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {vlmResponse.symptoms_observed.map((symp, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-muted text-foreground font-medium text-[11px] border">
                          {symp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Possible Causes */}
                {vlmResponse.possible_causes.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                      {tr('Etiology & Likely Causes', 'المسببات والعوامل المحفزة', 'Étiologie & causes probables')}
                    </div>
                    <p className="text-muted-foreground leading-relaxed bg-muted/30 p-2.5 rounded-xl border">
                      {vlmResponse.possible_causes.join(' · ')}
                    </p>
                  </div>
                )}

                {/* Recommendation */}
                <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-1.5">
                  <div className="font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>{tr('Agronomic Action Plan & Treatment', 'خطة العلاج والإجراءات الزراعية', 'Plan de traitement agronomique')}</span>
                  </div>
                  <p className="text-foreground leading-relaxed">
                    {vlmResponse.recommendation}
                  </p>
                </div>

                {/* Suggested Active Matters */}
                {vlmResponse.suggested_active_matters.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                      {tr('Authorized Active Ingredients / Molecules', 'المواد الفعالة المقترحة والموصى بها', 'Matières actives homologuées')}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {vlmResponse.suggested_active_matters.map((mat, i) => (
                        <Badge key={i} variant="outline" className="bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-200 border-cyan-300 font-mono">
                          {mat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gallery Reference Evidence */}
                {(vlmResponse.referenceMatches?.length ?? 0) > 0 && (
                  <div className="rounded-xl border border-cyan-200 bg-cyan-50/50 p-3 dark:border-cyan-900 dark:bg-cyan-950/20 space-y-2">
                    <div className="font-bold text-cyan-900 dark:text-cyan-200 flex items-center gap-1.5 text-xs">
                      <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
                      <span>{tr('Dataset Cross-Reference Evidence', 'أدلة المقارنة المرجعية مع قواعد البيانات', 'Preuves de correspondance')}</span>
                    </div>
                    <div className="space-y-1.5">
                      {vlmResponse.referenceMatches?.slice(0, 3).map((match) => (
                        <div key={match.diseaseRefId} className="flex flex-wrap items-center justify-between gap-1 text-[11px] bg-background/80 p-2 rounded-lg border">
                          <span className="font-medium">{match.diseaseRefId} · {match.matchReason} ({match.source.dataset})</span>
                          <a href={match.source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-700 hover:underline dark:text-cyan-300 font-semibold">
                            {tr('Dataset Link', 'رابط المرجع', 'Lien source')} <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(vlmResponse.reviewRequired || vlmResponse.needsSecondPhoto) && (
                  <div className="text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl p-3 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <span>
                      {tr(
                        'Review the evidence, capture another photo if needed, and verify local product registrations with an agronomist before spraying.',
                        'راجع الأدلة، والتقط صورة إضافية إذا لزم الأمر، وتحقق من تسجيلات المبيدات المحلية مع مهندس زراعي قبل الرش.',
                        'Vérifiez les homologations locales avec un conseiller agronomique avant tout traitement phytosanitaire.'
                      )}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border shadow-xs rounded-2xl p-6 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[300px] space-y-3">
              <div className="p-4 rounded-2xl bg-muted/60 text-muted-foreground">
                <Brain className="h-8 w-8 text-emerald-600/70" />
              </div>
              <div className="font-semibold text-sm text-foreground">
                {tr('Ready for Plant Pathology Diagnostics', 'جاهز للفحص وتشخيص الأعراض المرضية', 'Prêt pour le diagnostic phytosanitaire')}
              </div>
              <p className="text-xs max-w-md">
                {tr(
                  'Upload a photo on the left to run AI diagnosis, or explore the comprehensive pathology catalog below.',
                  'قم برفع صورة الورقة على اليسار لبدء التحليل الفوري، أو تصفح قاعدة بيانات الأمراض أدناه.',
                  'Téléversez une photo à gauche pour lancer le diagnostic IA ou parcourez le catalogue ci-dessous.'
                )}
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Disease Reference Database */}
      <Card className="border-border shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Microscope className="h-4 w-4 text-emerald-600" />
                {tr('Reference Plant Pathology Database', 'قاعدة بيانات الأمراض والآفات المرجعية', 'Base de données phytopathologique de référence')}
              </CardTitle>
              <CardDescription className="text-xs">
                {tr(
                  'Explore standard symptoms, biological agents, and management protocols for key agricultural crops.',
                  'استعرض الأعراض القياسية، والمسببات البيولوجية، وبروتوكولات المكافحة للمحاصيل الرئيسية.',
                  'Consultez les symptômes, agents pathogènes et protocoles de lutte pour les principales cultures.'
                )}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Select value={cropFilter} onValueChange={setCropFilter}>
                <SelectTrigger className="h-9 w-[200px] text-xs font-semibold bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs font-semibold">
                    {tr(`All Crops (${PLANT_DISEASES.length})`, `كل المحاصيل (${PLANT_DISEASES.length})`, `Toutes les cultures (${PLANT_DISEASES.length})`)}
                  </SelectItem>
                  {CROP_LIST.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
            {filtered.map((d) => (
              <div
                key={d.id}
                className="border rounded-xl p-3.5 space-y-2 bg-card hover:border-emerald-400/60 transition-colors shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold mb-1">
                      {d.crop}
                    </Badge>
                    <div className="font-bold text-sm text-foreground">{d.disease_name}</div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] font-bold ${SEVERITY_CLASSES[d.severity]}`}>
                    {d.severity}
                  </Badge>
                </div>

                <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3">
                  {d.description}
                </p>

                {!d.is_healthy && (
                  <div className="text-[11px] pt-1 border-t text-foreground">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      {tr('Management:', 'العلاج والمكافحة:', 'Traitement :')}{' '}
                    </span>
                    <span className="text-muted-foreground">{d.treatment}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CropTab() {
  const { language } = useTranslation();
  const tr = (enText: string, arText: string, frText?: string) => copyFor(language, enText, arText, frText);

  const [v, setV] = useState({
    N: '80',
    P: '50',
    K: '50',
    temperature: '25',
    humidity: '65',
    ph: '6.5',
    rainfall: '100',
  });

  const set = (k: keyof typeof v) => (e: { target: { value: string } }) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  const results = useMemo(
    () =>
      recommendCrops(
        {
          N: +v.N || 0,
          P: +v.P || 0,
          K: +v.K || 0,
          temperature: +v.temperature || 0,
          humidity: +v.humidity || 0,
          ph: +v.ph || 0,
          rainfall: +v.rainfall || 0,
        },
        6
      ),
    [v]
  );

  const inputs: [keyof typeof v, string, string, string][] = [
    ['N', 'Soil N (kg/ha)', 'النيتروجين N (كغ/هـ)', 'N sol (kg/ha)'],
    ['P', 'Soil P (kg/ha)', 'الفوسفور P (كغ/هـ)', 'P sol (kg/ha)'],
    ['K', 'Soil K (kg/ha)', 'البوتاسيوم K (كغ/هـ)', 'K sol (kg/ha)'],
    ['temperature', 'Temperature (°C)', 'درجة الحرارة (°م)', 'Température (°C)'],
    ['humidity', 'Humidity (%)', 'الرطوبة الجوية (%)', 'Humidité (%)'],
    ['ph', 'Soil pH', 'درجة حموضة التربة pH', 'pH du sol'],
    ['rainfall', 'Rainfall (mm)', 'معدل الأمطار (مم)', 'Pluviométrie (mm)'],
  ];

  const maxConf = Math.max(...results.map((r) => r.confidence), 1);

  return (
    <div className="space-y-6">
      <Card className="border-border shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-teal-50 via-background to-emerald-50/50 dark:from-teal-950/30 dark:via-background dark:to-emerald-950/20 pb-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Brain className="h-4 w-4 text-teal-600" />
                {tr('Pedoclimatic Crop Suitability Matching Engine', 'محرك المواءمة الزراعية للمحاصيل حسب المناخ والتربة', 'Moteur de Correspondance Pédoclimatique des Cultures')}
              </CardTitle>
              <CardDescription className="text-xs">
                {tr(
                  'Multi-variable decision model evaluating soil nutrients, climate envelope, pH tolerances, and precipitation regimes.',
                  'نموذج متعدد المتغيرات لتقييم المغذيات والمناخ ودرجة الحموضة ونظم الهطول المطري لاقتراح المحاصيل الأعلى إنتاجية.',
                  'Modèle décisionnel multi-critères évaluant éléments majeurs, climat, pH et pluviométrie.'
                )}
              </CardDescription>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setV({
                  N: '100',
                  P: '45',
                  K: '60',
                  temperature: '22',
                  humidity: '70',
                  ph: '7.2',
                  rainfall: '350',
                })
              }
              className="text-xs font-semibold"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              {tr('Reset Example', 'إعادة ضبط النموذج', 'Réinitialiser')}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-6">
          {/* Input Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 p-4 rounded-xl bg-card border text-xs shadow-xs">
            {inputs.map(([key, labelEn, labelAr, labelFr]) => (
              <div key={key}>
                <Label className="text-[11px] font-semibold text-muted-foreground">
                  {tr(labelEn, labelAr, labelFr)}
                </Label>
                <Input
                  type="number"
                  value={v[key]}
                  onChange={set(key)}
                  className="h-8 mt-1 text-xs font-mono font-bold"
                />
              </div>
            ))}
          </div>

          {/* Results Ranking */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {tr('Ranked Agronomic Recommendations', 'ترتيب المحاصيل الموصى بها حسب الملاءمة', 'Cultures Recommandées par Ordre d’Affinité')}
              </h4>
              <Badge variant="outline" className="text-[10px] text-teal-700 dark:text-teal-300 font-mono">
                {results.length} {tr('matches', 'محاصيل متوافقة', 'cultures')}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.map((r, i) => (
                <div
                  key={r.crop}
                  className="p-4 rounded-xl border bg-card hover:border-teal-400/60 transition-all shadow-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-black text-xs flex items-center justify-center">
                        #{i + 1}
                      </span>
                      <span className="font-bold text-sm capitalize text-foreground">{r.crop}</span>
                    </div>
                    <Badge variant="outline" className="bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border-teal-300 font-mono font-bold text-xs">
                      {r.confidence}% {tr('Fit', 'ملاءمة', 'Affinité')}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{tr('Ecological Suitability Score', 'درجة التوافق البيئي', 'Score d’affinité')}</span>
                      <span className="font-mono">{r.confidence}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${(r.confidence / maxConf) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FertilizerTab() {
  const { language } = useTranslation();
  const tr = (enText: string, arText: string, frText?: string) => copyFor(language, enText, arText, frText);

  const [soilType, setSoilType] = useState('Loamy');
  const [cropType, setCropType] = useState('Cereal');
  const [vals, setVals] = useState({ N: '40', P: '30', K: '60', moisture: '45' });

  const setVal = (k: keyof typeof vals) => (e: { target: { value: string } }) =>
    setVals((v) => ({ ...v, [k]: e.target.value }));

  const rec = useMemo(
    () =>
      recommendFertilizer({
        soilType,
        cropType,
        N: +vals.N || 0,
        P: +vals.P || 0,
        K: +vals.K || 0,
        moisture: +vals.moisture || 0,
      }),
    [soilType, cropType, vals]
  );

  const numInputs: [keyof typeof vals, string, string, string][] = [
    ['N', 'Soil Residual N (kg/ha)', 'النيتروجين المتبقي N (كغ/هـ)', 'N résiduel (kg/ha)'],
    ['P', 'Available P (kg/ha)', 'الفوسفور المتاح P (كغ/هـ)', 'P disponible (kg/ha)'],
    ['K', 'Exchangeable K (kg/ha)', 'البوتاسيوم المتبادل K (كغ/هـ)', 'K échangeable (kg/ha)'],
    ['moisture', 'Soil Moisture (%)', 'رطوبة التربة الحالية (%)', 'Humidité du sol (%)'],
  ];

  return (
    <div className="space-y-6">
      <Card className="border-border shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-cyan-50 via-background to-teal-50/50 dark:from-cyan-950/30 dark:via-background dark:to-teal-950/20 pb-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-cyan-600" />
                {tr('Fertilizer Prescription & Blend Optimization', 'مرشد وصفات التسميد وموازنة العناصر الكبرى', 'Prescription & Optimisation des Engrais')}
              </CardTitle>
              <CardDescription className="text-xs">
                {tr(
                  'Calculates targeted commercial fertilizer grades, timing, and soil moisture buffering requirements.',
                  'حساب تركيبات الأسمدة التجارية الموصى بها ومواعيد التطبيق وضبط المعاملات حسب رطوبة التربة وقوامها.',
                  'Calcul des formules d’engrais commerciales ciblées, des doses et des fractionnements.'
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-6">
          {/* Controls Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 rounded-xl bg-card border text-xs shadow-xs">
            <div>
              <Label className="text-[11px] font-semibold text-muted-foreground">
                {tr('Soil Texture / Type', 'نوع وقوام التربة', 'Type de sol')}
              </Label>
              <Select value={soilType} onValueChange={setSoilType}>
                <SelectTrigger className="h-8 mt-1 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['Sandy', 'Loamy', 'Clay', 'Peaty', 'Saline'].map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {copyFor(
                        language,
                        s,
                        ({
                          Sandy: 'رملية (خفيفة)',
                          Loamy: 'طميية (متوازنة)',
                          Clay: 'طينية (ثقيلة)',
                          Peaty: 'عضوية (خثية)',
                          Saline: 'ملحية',
                        } as Record<string, string>)[s]
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[11px] font-semibold text-muted-foreground">
                {tr('Target Crop Category', 'فئة المحصول المستهدف', 'Catégorie de culture')}
              </Label>
              <Select value={cropType} onValueChange={setCropType}>
                <SelectTrigger className="h-8 mt-1 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['Cereal', 'Vegetable', 'Fruit', 'Legume', 'Root', 'Oilseed'].map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">
                      {copyFor(
                        language,
                        c,
                        ({
                          Cereal: 'حبوب ونجيليات',
                          Vegetable: 'خضروات حقلية ومحمية',
                          Fruit: 'أشجار مثمرة وفاكهة',
                          Legume: 'بقوليات مثبتة للنيتروجين',
                          Root: 'محاصيل جذرية ودرنية',
                          Oilseed: 'محاصيل زيتية',
                        } as Record<string, string>)[c]
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {numInputs.map(([key, labelEn, labelAr, labelFr]) => (
              <div key={key}>
                <Label className="text-[11px] font-semibold text-muted-foreground">
                  {tr(labelEn, labelAr, labelFr)}
                </Label>
                <Input
                  type="number"
                  value={vals[key]}
                  onChange={setVal(key)}
                  className="h-8 mt-1 text-xs font-mono font-bold"
                />
              </div>
            ))}
          </div>

          {/* Recommendation Card */}
          <div className="rounded-2xl border border-cyan-200 dark:border-cyan-800 bg-gradient-to-br from-cyan-50/60 via-background to-emerald-50/40 dark:from-cyan-950/25 dark:via-background dark:to-emerald-950/20 p-5 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                  {tr('Recommended Primary Formulation', 'التركيبة السمادية الموصى بها', 'Formulation Principale Recommandée')}
                </div>
                <div className="text-xl font-black text-foreground flex items-center gap-2">
                  <span>{rec.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-mono font-black border-cyan-400 bg-cyan-100 dark:bg-cyan-900 text-cyan-900 dark:text-cyan-100 px-3 py-1">
                  NPK {rec.npk.join('-')}
                </Badge>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {rec.reason}
            </p>

            <div className="p-3.5 rounded-xl bg-card border space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-700 dark:text-cyan-300">
                <Sprout className="h-4 w-4" />
                <span>{tr('Application & Dosage Plan:', 'خطة ومعدل الإضافة:', 'Plan d’application & dosage :')}</span>
              </div>
              <div className="text-xs text-foreground font-medium pl-6">
                {rec.applicationRate}
              </div>
            </div>

            {rec.notes && (
              <p className="text-[11px] text-muted-foreground italic bg-muted/30 p-2.5 rounded-lg border">
                ℹ️ {rec.notes}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
