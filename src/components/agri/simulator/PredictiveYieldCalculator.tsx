'use client';

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  MapPin,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Droplets,
  Sprout,
  ShieldCheck,
  Zap,
  Sliders,
  Calendar,
  Layers,
  Award,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation, copyFor, type Language } from '@/lib/language-store';
import {
  ALGERIA_REGIONAL_BENCHMARKS,
  calculateAlgeriaPredictiveYield,
  type AlgeriaRegionBenchmark,
  type PredictiveYieldInput,
  type PredictiveYieldResult,
} from '@/lib/algeria-predictive-yield';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';

export interface PredictiveYieldCalculatorProps {
  cropId: string;
  cropName: string;
  cropEmoji?: string;
  currentAreaHa?: number;
  currentExpectedYieldTPerHa: number;
  currentPlantingDate?: string;
  currentIrrigationSystem?: 'drip' | 'sprinkler' | 'furrow' | 'rainfed';
  onApplyPredictedYield: (yieldTonsHa: number) => void;
  className?: string;
}

export function PredictiveYieldCalculator({
  cropId,
  cropName,
  cropEmoji = '🌱',
  currentAreaHa = 5,
  currentExpectedYieldTPerHa,
  currentPlantingDate = '2026-10-15',
  currentIrrigationSystem = 'drip',
  onApplyPredictedYield,
  className = '',
}: PredictiveYieldCalculatorProps) {
  const { language, isRTL } = useTranslation();
  const tr = copyFor;

  // Selected Algerian agricultural region (default to first or intelligent match)
  const [selectedRegionId, setSelectedRegionId] = useState<string>(() => {
    if (cropId === 'tomato') return 'sahara_biskra_ziban';
    if (cropId === 'potato') return 'desert_erg_el_oued';
    return 'high_plateaus_east';
  });

  // User-provided inputs
  const [soilSalinityDsm, setSoilSalinityDsm] = useState<number>(1.6);
  const [soilOrganicMatterPct, setSoilOrganicMatterPct] = useState<number>(1.4);
  const [irrigationSystem, setIrrigationSystem] = useState<'drip' | 'sprinkler' | 'furrow' | 'rainfed'>(
    currentIrrigationSystem
  );
  const [fertilizerIntensity, setFertilizerIntensity] = useState<
    'sub_optimal' | 'moderate' | 'optimal' | 'intensive_fertigation'
  >('optimal');
  const [seedQualityTier, setSeedQualityTier] = useState<
    'farm_saved_untested' | 'standard_commercial' | 'certified_oaic_g1_g2'
  >('certified_oaic_g1_g2');
  const [cropProtectionLevel, setCropProtectionLevel] = useState<
    'none' | 'curative_minimal' | 'preventive_standard' | 'integrated_ipm'
  >('preventive_standard');
  const [appliedPlantingDate, setAppliedPlantingDate] = useState<string>(currentPlantingDate);
  const [showAdvancedInputs, setShowAdvancedInputs] = useState<boolean>(false);
  const [appliedFeedback, setAppliedFeedback] = useState<boolean>(false);

  // Auto-sync region defaults on region change
  const currentRegion = useMemo(
    () => ALGERIA_REGIONAL_BENCHMARKS.find((r) => r.id === selectedRegionId) || ALGERIA_REGIONAL_BENCHMARKS[0],
    [selectedRegionId]
  );

  const handleRegionChange = (newRegionId: string) => {
    setSelectedRegionId(newRegionId);
    const reg = ALGERIA_REGIONAL_BENCHMARKS.find((r) => r.id === newRegionId);
    if (reg) {
      setSoilSalinityDsm(reg.defaultSalinityDsm);
    }
  };

  // Run calculation
  const predictionResult: PredictiveYieldResult = useMemo(() => {
    const input: PredictiveYieldInput = {
      cropId,
      regionId: selectedRegionId,
      plantingDate: appliedPlantingDate,
      irrigationSystem,
      soilSalinityDsm,
      soilOrganicMatterPct,
      fertilizerIntensity,
      appliedNitrogenKgHa: 120,
      seedQualityTier,
      cropProtectionLevel,
    };
    return calculateAlgeriaPredictiveYield(input);
  }, [
    cropId,
    selectedRegionId,
    appliedPlantingDate,
    irrigationSystem,
    soilSalinityDsm,
    soilOrganicMatterPct,
    fertilizerIntensity,
    seedQualityTier,
    cropProtectionLevel,
  ]);

  const handleApplyYield = () => {
    onApplyPredictedYield(predictionResult.predictedYieldTonsHa);
    setAppliedFeedback(true);
    setTimeout(() => setAppliedFeedback(false), 2600);
  };

  // Chart data comparing historical baselines to predicted and user estimate
  const chartData = useMemo(() => {
    return [
      {
        name: tr(language, 'Hist. Low (Drought)', 'أدنى تاريخي (جفاف)', 'Bas historique (Sécheresse)'),
        yield: predictionResult.historicalLowYieldTonsHa,
        fill: '#f87171', // red-400
        category: 'historical',
      },
      {
        name: tr(language, 'Algeria Regional Mean', 'المتوسط الإقليمي الجزائري', 'Moyenne régionale Algérie'),
        yield: predictionResult.historicalMeanYieldTonsHa,
        fill: '#94a3b8', // slate-400
        category: 'baseline',
      },
      {
        name: tr(language, 'Predicted Yield (AI Model)', 'المردود المتوقع التقديري', 'Rendement prévu (Modèle)'),
        yield: predictionResult.predictedYieldTonsHa,
        fill: '#10b981', // emerald-500
        category: 'predicted',
      },
      {
        name: tr(language, 'Top 10% Tech Farmers', 'أعلى ١٠٪ مزارعون تقنيون', 'Top 10% Producteurs'),
        yield: predictionResult.historicalHighYieldTonsHa,
        fill: '#38bdf8', // sky-400
        category: 'historical',
      },
      {
        name: tr(language, 'Bioclimatic Potential', 'الإنتاجية البيومناخية القصوى', 'Potentiel bioclimatique'),
        yield: predictionResult.potentialCeilingTonsHa,
        fill: '#a855f7', // purple-500
        category: 'ceiling',
      },
    ];
  }, [predictionResult, language, tr]);

  // Color & Badge based on Success Rating
  const successBadgeConfig = useMemo(() => {
    switch (predictionResult.successRating) {
      case 'exceptional':
        return {
          label: tr(language, 'Exceptional Potential (High Tech)', 'إمكانات استثنائية (تقني عالٍ)', 'Potentiel exceptionnel'),
          color: 'bg-emerald-600 text-white',
          border: 'border-emerald-500',
          textColor: 'text-emerald-700 dark:text-emerald-300',
          bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
        };
      case 'high':
        return {
          label: tr(language, 'High Crop Success Rate', 'نسبة نجاح محصول عالية', 'Taux de réussite élevé'),
          color: 'bg-emerald-500 text-white',
          border: 'border-emerald-400',
          textColor: 'text-emerald-600 dark:text-emerald-400',
          bgLight: 'bg-emerald-50/70 dark:bg-emerald-950/30',
        };
      case 'moderate':
        return {
          label: tr(language, 'Moderate / Average Success', 'مردود ونجاح متوسط', 'Réussite modérée / Moyenne'),
          color: 'bg-amber-500 text-white',
          border: 'border-amber-400',
          textColor: 'text-amber-700 dark:text-amber-300',
          bgLight: 'bg-amber-50 dark:bg-amber-950/30',
        };
      case 'high_risk':
        return {
          label: tr(language, 'High Risk / Stress Penalties', 'مخاطر عالية / إجهادات تحد الإنتاج', 'Risque élevé / Pénalités de stress'),
          color: 'bg-orange-500 text-white',
          border: 'border-orange-400',
          textColor: 'text-orange-700 dark:text-orange-300',
          bgLight: 'bg-orange-50 dark:bg-orange-950/30',
        };
      case 'critical_failure_risk':
      default:
        return {
          label: tr(language, 'Critical Stress / Crop Failure Risk', 'إجهاد حرج / خطر فشل المحصول', 'Stress critique / Risque d’échec'),
          color: 'bg-rose-600 text-white',
          border: 'border-rose-500',
          textColor: 'text-rose-700 dark:text-rose-300',
          bgLight: 'bg-rose-50 dark:bg-rose-950/40',
        };
    }
  }, [predictionResult.successRating, language, tr]);

  return (
    <div
      id="algeria-predictive-yield-calculator"
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`rounded-2xl border border-emerald-300/80 bg-card p-4 shadow-sm sm:p-6 dark:border-emerald-800/80 ${className}`}
    >
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 lg:flex-row lg:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                {tr(
                  language,
                  'Algerian Predictive Yield & Crop Success Engine',
                  'المحرك التنبؤي لمردود المحاصيل ونسبة النجاح بالجزائر',
                  'Moteur prédictif de rendement & succès des cultures en Algérie'
                )}
              </span>
              <Badge className="bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0 h-4">
                MADR · ITGC · ITDAS
              </Badge>
            </div>
            <h3 className="mt-0.5 text-lg font-black tracking-tight text-foreground sm:text-xl">
              {cropEmoji} {cropName} — {tr(language, 'Estimated Agronomic Yield & Probability', 'المردود الزراعي المقدر واحتمالية النجاح', 'Rendement agronomique estimé & Probabilité')}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {tr(
                language,
                'Combines 10-year Algerian historical regional baselines with your soil salinity, irrigation type, nutrition, genetics, and planting dates.',
                'يدمج الإحصاءات المرجعية التاريخية لعشر سنوات مع ملوحة التربة، نظام الري، التغذية، جودة البذور، وتوقيت الزراعة.',
                'Combine les historiques régionaux algériens sur 10 ans avec la salinité du sol, le système d’irrigation, la nutrition et la génétique.'
              )}
            </p>
          </div>
        </div>

        {/* 1-Click Apply Button */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={handleApplyYield}
            className="gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700"
          >
            {appliedFeedback ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                <span>{tr(language, 'Applied to Simulator!', 'تم التطبيق على المحاكي!', 'Appliqué au simulateur !')}</span>
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4" />
                <span>
                  {tr(
                    language,
                    `Apply Predicted (${predictionResult.predictedYieldTonsHa} t/ha)`,
                    `تطبيق المردود المتوقع (${predictionResult.predictedYieldTonsHa} طن/هـ)`,
                    `Appliquer prévision (${predictionResult.predictedYieldTonsHa} t/ha)`
                  )}
                </span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Grid: Controls vs Visual Output */}
      <div className="mt-5 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        
        {/* Left Column: Interactive Inputs & Parameters */}
        <div className="space-y-4">
          
          {/* Region Selector */}
          <div className="rounded-xl border border-border bg-muted/40 p-3.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
              <span>{tr(language, 'Target Agro-Climatic Region & Wilaya', 'الإقليم الزراعي والمناخي والولاية', 'Région agro-climatique & Wilayas')}</span>
            </label>
            <select
              value={selectedRegionId}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-xs font-semibold"
            >
              {ALGERIA_REGIONAL_BENCHMARKS.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.name[language] || reg.name.en}
                </option>
              ))}
            </select>
            <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">{tr(language, 'Covered Wilayas:', 'الولايات المشمولة:', 'Wilayas couvertes :')}</span>
              {currentRegion.wilayas.map((w) => (
                <span key={w} className="rounded-md bg-background px-1.5 py-0.5 border border-border/80 text-[10px]">
                  {w}
                </span>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-emerald-700 dark:text-emerald-300">
              ⚡ {currentRegion.climateZone[language] || currentRegion.climateZone.en}
            </p>
          </div>

          {/* Key Factor Selectors */}
          <div className="grid gap-3 sm:grid-cols-2">
            
            {/* Irrigation Regime */}
            <div className="rounded-xl border border-border bg-card p-3">
              <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Droplets className="h-3.5 w-3.5 text-blue-600" />
                <span>{tr(language, 'Irrigation Delivery Mode', 'نظام وإمداد الري', 'Mode d’irrigation')}</span>
              </label>
              <select
                value={irrigationSystem}
                onChange={(e) => setIrrigationSystem(e.target.value as any)}
                className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-2 text-xs"
              >
                <option value="drip">{tr(language, 'Drip Fertigation (High WUE)', 'تنقيط مع التسميد (كفاءة عالية)', 'Goutte-à-goutte (Haute WUE)')}</option>
                <option value="sprinkler">{tr(language, 'Center-Pivot / Sprinkler', 'ري محوري / رشاش', 'Pivot / Aspersion')}</option>
                <option value="furrow">{tr(language, 'Furrow / Flood Surface', 'ري سطحي بالأخاديد/الغمر', 'Gravitaire / Raie')}</option>
                <option value="rainfed">{tr(language, 'Rainfed (Bour / Pluvial)', 'مطري (بور / اعتماد على الأمطار)', 'Pluvial (Bour)')}</option>
              </select>
            </div>

            {/* Seed Quality */}
            <div className="rounded-xl border border-border bg-card p-3">
              <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Award className="h-3.5 w-3.5 text-amber-600" />
                <span>{tr(language, 'Seed & Genetics Quality', 'جودة البذور والشتلات', 'Qualité semences & plants')}</span>
              </label>
              <select
                value={seedQualityTier}
                onChange={(e) => setSeedQualityTier(e.target.value as any)}
                className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-2 text-xs"
              >
                <option value="certified_oaic_g1_g2">{tr(language, 'Certified OAIC / G1-G2 (Elite)', 'معتمدة OAIC / G1-G2 (ممتازة)', 'Certifiées OAIC / G1-G2')}</option>
                <option value="standard_commercial">{tr(language, 'Standard Commercial Seed', 'بذور تجارية قياسية', 'Commerciales standard')}</option>
                <option value="farm_saved_untested">{tr(language, 'Farm-Saved / Untested Stock', 'بذور المزرعة غير المعتمدة', 'Semences de ferme non certifiées')}</option>
              </select>
            </div>

            {/* Fertilization Intensity */}
            <div className="rounded-xl border border-border bg-card p-3">
              <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Zap className="h-3.5 w-3.5 text-emerald-600" />
                <span>{tr(language, 'Fertilization Strategy', 'استراتيجية التسميد والتغذية', 'Niveau de fertilisation')}</span>
              </label>
              <select
                value={fertilizerIntensity}
                onChange={(e) => setFertilizerIntensity(e.target.value as any)}
                className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-2 text-xs"
              >
                <option value="intensive_fertigation">{tr(language, 'Intensive Fertigation (Micro-dosing)', 'تسميد مع الري مكثف ومجزأ', 'Fertigation intensive micro-dosée')}</option>
                <option value="optimal">{tr(language, 'Balanced N-P-K + Micronutrients', 'تسميد متكامل N-P-K وعناصر صغرى', 'Équilibré N-P-K + oligo-éléments')}</option>
                <option value="moderate">{tr(language, 'Moderate Basal / Broadcasting', 'تسميد نثري معتدل', 'Apports moyens en surface')}</option>
                <option value="sub_optimal">{tr(language, 'Sub-optimal / Deficient Supply', 'تسميد ضعيف أو ناقص', 'Sous-fertilisé / Déficitaire')}</option>
              </select>
            </div>

            {/* Crop Protection Level */}
            <div className="rounded-xl border border-border bg-card p-3">
              <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                <span>{tr(language, 'Phytosanitary & IPM Protection', 'حماية المحصول والمكافحة', 'Protection phytosanitaire')}</span>
              </label>
              <select
                value={cropProtectionLevel}
                onChange={(e) => setCropProtectionLevel(e.target.value as any)}
                className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-2 text-xs"
              >
                <option value="integrated_ipm">{tr(language, 'Integrated Pest Management (IPM)', 'مكافحة متكاملة IPM مع رصد العتبات', 'Protection intégrée (IPM)')}</option>
                <option value="preventive_standard">{tr(language, 'Standard Preventive Program', 'برنامج وقائي قياسي منتظم', 'Programme préventif standard')}</option>
                <option value="curative_minimal">{tr(language, 'Curative Only (Post-symptoms)', 'علاجي فقط عند ظهور الإصابة', 'Curatif après symptômes')}</option>
                <option value="none">{tr(language, 'No Chemical / Bio Protection', 'دون حماية مبيدات أو مكافحة', 'Aucune protection')}</option>
              </select>
            </div>
          </div>

          {/* Collapsible Advanced Soil & Planting Controls */}
          <div className="rounded-xl border border-border bg-muted/20 p-3">
            <button
              type="button"
              onClick={() => setShowAdvancedInputs((prev) => !prev)}
              className="flex w-full items-center justify-between text-xs font-bold text-foreground hover:text-emerald-600"
            >
              <span className="flex items-center gap-2">
                <Sliders className="h-3.5 w-3.5 text-muted-foreground" />
                {tr(language, 'Soil Salinity (EC) & Organic Matter Sliders', 'تعديل ملوحة التربة (EC) والمادة العضوية', 'Réglages salinité du sol & matière organique')}
              </span>
              {showAdvancedInputs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showAdvancedInputs && (
              <div className="mt-3 grid gap-4 border-t border-border/80 pt-3 sm:grid-cols-2">
                <div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{tr(language, 'Soil Salinity (ECe)', 'ملوحة التربة (ECe)', 'Salinité du sol (CEe)')}</span>
                    <strong className="text-foreground">{soilSalinityDsm.toFixed(1)} dS/m</strong>
                  </div>
                  <input
                    type="range"
                    min="0.4"
                    max="8.0"
                    step="0.1"
                    value={soilSalinityDsm}
                    onChange={(e) => setSoilSalinityDsm(Number(e.target.value))}
                    className="mt-1.5 w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{tr(language, 'Fresh (<1.2)', 'عذبة (<1.2)', 'Douce (<1.2)')}</span>
                    <span>{tr(language, 'Moderate (2-3.5)', 'متوسطة (2-3.5)', 'Modérée (2-3.5)')}</span>
                    <span className="text-rose-600">{tr(language, 'Saline (>4.5)', 'شديدة الملوحة', 'Salée (>4.5)')}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{tr(language, 'Soil Organic Matter (OM)', 'المادة العضوية بالتربة', 'Matière organique (MO)')}</span>
                    <strong className="text-foreground">{soilOrganicMatterPct.toFixed(1)} %</strong>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="4.5"
                    step="0.1"
                    value={soilOrganicMatterPct}
                    onChange={(e) => setSoilOrganicMatterPct(Number(e.target.value))}
                    className="mt-1.5 w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{tr(language, 'Desert Sand (0.2%)', 'رمال صحراوية (0.2%)', 'Sable désertique')}</span>
                    <span>{tr(language, 'Standard (1.5%)', 'قياسي (1.5%)', 'Standard')}</span>
                    <span className="text-emerald-600">{tr(language, 'Rich (>2.5%)', 'غنية (>2.5%)', 'Riche (>2.5%)')}</span>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{tr(language, 'Simulated Planting Date', 'تاريخ الزراعة المحاكى', 'Date de semis simulée')}</span>
                    <Input
                      type="date"
                      value={appliedPlantingDate}
                      onChange={(e) => setAppliedPlantingDate(e.target.value)}
                      className="h-8 w-40 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Factor Multipliers & Stress Penalties Breakdown */}
          <div className="space-y-2 rounded-xl border border-border p-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground">
                {tr(language, 'Agronomic Stress & Acceleration Factors', 'عوامل الإجهاد والتسريع الزراعي', 'Facteurs de stress & d’accélération')}
              </h4>
              <span className="text-[11px] text-muted-foreground">
                {tr(language, 'vs Regional Baseline', 'مقارنة بالمتوسط الإقليمي', 'vs Moyenne régionale')}
              </span>
            </div>

            <div className="grid gap-2 text-xs sm:grid-cols-2">
              {predictionResult.allFactors.map((f) => (
                <div
                  key={f.id}
                  className={`flex flex-col justify-between rounded-lg border p-2.5 ${
                    f.status === 'positive'
                      ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20'
                      : f.status === 'severe_penalty'
                      ? 'border-rose-300 bg-rose-50/80 dark:border-rose-900 dark:bg-rose-950/30'
                      : f.status === 'penalty'
                      ? 'border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20'
                      : 'border-border bg-background'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold">{f.label[language] || f.label.en}</span>
                    <span
                      className={`font-black ${
                        f.multiplier >= 1.05
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : f.multiplier < 0.98
                          ? 'text-rose-700 dark:text-rose-300'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {f.multiplier >= 1.0 ? `+${Math.round((f.multiplier - 1) * 100)}%` : `${Math.round((f.multiplier - 1) * 100)}%`}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] leading-tight text-muted-foreground">
                    {f.explanation[language] || f.explanation.en}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Key Prediction Outcome & Charts */}
        <div className="space-y-4">
          
          {/* Main Predicted Yield Hero Box */}
          <div className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${successBadgeConfig.border} ${successBadgeConfig.bgLight}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {tr(language, 'Model Predicted Yield', 'المردود المحسوب بالنموذج', 'Rendement prévu par le modèle')}
              </span>
              <Badge className={`${successBadgeConfig.color} text-xs font-bold px-2 py-0.5`}>
                {predictionResult.successProbabilityPct}% {tr(language, 'Success Index', 'مؤشر النجاح', 'Indice de réussite')}
              </Badge>
            </div>

            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                {predictionResult.predictedYieldTonsHa}
              </span>
              <span className="text-lg font-bold text-muted-foreground">
                {tr(language, 't / ha', 'طن / هكتار', 't / ha')}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                ({(predictionResult.predictedYieldTonsHa * currentAreaHa).toFixed(1)} {tr(language, 't total', 'طن إجمالي', 't total')})
              </span>
            </div>

            {/* 80% Confidence Interval Bar */}
            <div className="mt-3 rounded-xl bg-background/80 p-2.5 text-xs border border-border/70">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{tr(language, '80% Probability Interval:', 'مجال الثقة الإحصائي 80%:', 'Intervalle de confiance 80% :')}</span>
                <strong className="text-foreground">
                  {predictionResult.yieldConfidenceRange.min80Pct} – {predictionResult.yieldConfidenceRange.max80Pct} t/ha
                </strong>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    marginLeft: `${Math.min(80, Math.max(0, (predictionResult.yieldConfidenceRange.min80Pct / predictionResult.potentialCeilingTonsHa) * 100))}%`,
                    width: `${Math.min(100, Math.max(10, ((predictionResult.yieldConfidenceRange.max80Pct - predictionResult.yieldConfidenceRange.min80Pct) / predictionResult.potentialCeilingTonsHa) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Success Assessment Sentence */}
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold">
              <span className={successBadgeConfig.textColor}>●</span>
              <span className="text-foreground">{successBadgeConfig.label}</span>
            </div>
          </div>

          {/* Visual Benchmark Comparison (Recharts) */}
          <div className="rounded-xl border border-border bg-card p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-foreground">
                {tr(language, 'Yield Comparison vs Regional Historical Bounds', 'مقارنة المردود مع الحدود التاريخية للإقليم', 'Comparaison avec les repères historiques')}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {tr(language, 'Unit: Tons / Ha', 'الوحدة: طن / هكتار', 'Unité: t / ha')}
              </span>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    angle={-18}
                    textAnchor="end"
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    height={40}
                  />
                  <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-border bg-card p-2 text-xs shadow-md">
                            <div className="font-bold text-foreground">{data.name}</div>
                            <div className="mt-1 text-emerald-600 font-extrabold text-sm">
                              {data.yield} t/ha
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="yield" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Actionable Recommendations to Close Yield Gap */}
          {predictionResult.actionableRecommendations.length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs dark:border-emerald-900 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-200">
                <Sparkles className="h-4 w-4" />
                <span>{tr(language, 'Agronomic Interventions to Boost Yield:', 'توصيات زراعية لسد فجوة المردود ورفعه:', 'Leviers agronomiques pour combler l’écart :')}</span>
              </div>
              <ul className="mt-2 space-y-1.5 text-muted-foreground">
                {predictionResult.actionableRecommendations.slice(0, 3).map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                      +{rec.gainPotentialTonsHa}
                    </span>
                    <span className="leading-tight text-foreground">
                      {rec.action[language] || rec.action.en}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
