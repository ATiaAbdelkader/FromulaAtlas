'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Award,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock,
  CloudRain,
  Copy,
  Droplets,
  Flame,
  FlaskConical,
  GitCompareArrows,
  Layers,
  Leaf,
  Plus,
  RefreshCw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sprout,
  Tractor,
  TrendingDown,
  TrendingUp,
  Users,
  Wheat,
  X,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  calculateCropSimulator,
  createDefaultSimulatorScenario,
  formatSimulatorDzd,
  formatSimulatorNumber,
  getSimulatorCategoryLabel,
  getSimulatorCropProfiles,
  SIMULATOR_COST_CATEGORIES,
  SIMULATOR_REVENUE_CATEGORIES,
  type SimulatorCostCategory,
  type SimulatorCostLineItem,
  type SimulatorLineCategory,
  type SimulatorPhytoSelection,
  type SimulatorRiskScenario,
  type SimulatorScenario,
} from '@/lib/crop-simulator';
import { productActiveName, type PhytoProduct } from '@/lib/phyto-index';
import { useTranslation, copyFor, type Language } from '@/lib/language-store';
import { CropGrowthStagesVisualizer } from './CropGrowthStagesVisualizer';
import { CropWaterBudgetVisualizer } from './CropWaterBudgetVisualizer';

export interface ScenarioComparisonOverlayProps {
  scenarioA: SimulatorScenario;
  scenarioB: SimulatorScenario;
  onUpdateScenarioA: (patch: Partial<SimulatorScenario>) => void;
  onUpdateScenarioB: (patch: Partial<SimulatorScenario>) => void;
  onCloneAtoB: () => void;
  onSwapScenarios: () => void;
  onResetB: () => void;
  phytoIndex?: PhytoProduct[];
}

const inputClass = 'h-9 rounded-lg border-input bg-background text-xs';
const selectClass = 'h-9 w-full rounded-lg border border-input bg-background px-2.5 text-xs';

function tr(language: Language, english: string, arabic: string, french: string): string {
  return copyFor(language, english, arabic, french);
}

function cropLabel(language: Language, cropId: string, fallback: string): string {
  const labels: Record<string, [string, string, string]> = {
    wheat: ['Wheat', 'القمح', 'Blé'],
    barley: ['Barley', 'الشعير', 'Orge'],
    maize: ['Maize', 'الذرة', 'Maïs'],
    potato: ['Potato', 'البطاطا', 'Pomme de terre'],
    tomato: ['Tomato', 'الطماطم', 'Tomate'],
    onion: ['Onion', 'البصل', 'Oignon'],
    sunflower: ['Sunflower', 'عباد الشمس', 'Tournesol'],
    canola: ['Canola', 'اللفت الزيتي', 'Colza'],
    alfalfa: ['Alfalfa', 'الفصة', 'Luzerne'],
    sorghum: ['Sorghum', 'الذرة الرفيعة', 'Sorgho'],
    soybean: ['Soybean', 'فول الصويا', 'Soja'],
    grapes: ['Grapes', 'العنب', 'Raisin'],
    citrus: ['Citrus', 'الحمضيات', 'Agrumes'],
    apple: ['Apple', 'التفاح', 'Pomme'],
    lettuce: ['Lettuce', 'الخس', 'Laitue'],
    cucumber: ['Cucumber', 'الخيار', 'Concombre'],
    'bell-pepper': ['Bell pepper', 'الفلفل', 'Poivron'],
  };
  const value = labels[cropId];
  return value ? tr(language, value[0], value[1], value[2]) : fallback;
}

function localizedCategory(language: Language, category: SimulatorLineCategory): string {
  const labels: Record<SimulatorLineCategory, [string, string, string]> = {
    seed: ['Seed / planting material', 'البذور / مواد الغرس', 'Semences / plants'],
    fertilizer: ['Fertilizer and amendments', 'الأسمدة ومحسنات التربة', 'Engrais et amendements'],
    crop_protection: ['Crop protection', 'حماية المحصول', 'Protection des cultures'],
    irrigation: ['Water and irrigation', 'الماء والري', 'Eau et irrigation'],
    fuel: ['Fuel and energy', 'الوقود والطاقة', 'Carburant et énergie'],
    labor: ['Labor', 'اليد العاملة', 'Main-d’œuvre'],
    rent: ['Land rent', 'إيجار الأرض', 'Location de la terre'],
    machinery: ['Machinery and equipment', 'الآلات والمعدات', 'Machines et équipements'],
    other_cost: ['Other field costs', 'تكاليف الحقل الأخرى', 'Autres coûts de parcelle'],
    household_overhead: ['Allocated household overhead', 'المصاريف المنزلية الموزعة', 'Frais généraux du ménage affectés'],
    subsidy: ['Subsidy', 'الدعم', 'Subvention'],
    other_revenue: ['Other revenue', 'إيرادات أخرى', 'Autres revenus'],
  };
  return tr(language, ...labels[category]);
}

interface PresetOption {
  id: string;
  name: { en: string; ar: string; fr: string };
  description: { en: string; ar: string; fr: string };
  cropA: { id: string; area: number; system: SimulatorScenario['irrigationSystem']; date: string };
  cropB: { id: string; area: number; system: SimulatorScenario['irrigationSystem']; date: string };
}

const COMPARISON_PRESETS: PresetOption[] = [
  {
    id: 'wheat-vs-potato',
    name: {
      en: 'Extensive Cereal vs Intensive Tuber',
      ar: 'حبوب واسعة (قمح) ضد درنات مكثفة (بطاطا)',
      fr: 'Céréale extensive vs Tubercule intensif',
    },
    description: {
      en: 'Rainfed Wheat (10 ha) vs Drip-irrigated Potato (3 ha) capital/margin trade-off',
      ar: 'قمح مطري (10 هكتار) ضد بطاطا بالتنقيط (3 هكتار) ومفاضلة رأس المال والهامش',
      fr: 'Blé pluvial (10 ha) vs Pomme de terre goutte-à-goutte (3 ha)',
    },
    cropA: { id: 'wheat', area: 10, system: 'rainfed', date: '2026-10-15' },
    cropB: { id: 'potato', area: 3, system: 'drip', date: '2026-11-01' },
  },
  {
    id: 'tomato-furrow-vs-drip',
    name: {
      en: 'Irrigation Modernization (Tomato)',
      ar: 'تحديث نظام الري (طماطم)',
      fr: 'Modernisation de l’irrigation (Tomate)',
    },
    description: {
      en: 'Traditional Furrow vs High-efficiency Drip on 2 ha Tomato',
      ar: 'ري سطحي تقليدي ضد ري بالتنقي عالي الكفاءة على 2 هكتار طماطم',
      fr: 'Gravitaire traditionnel vs Goutte-à-goutte moderne sur 2 ha de tomate',
    },
    cropA: { id: 'tomato', area: 2, system: 'furrow', date: '2026-04-01' },
    cropB: { id: 'tomato', area: 2, system: 'drip', date: '2026-04-01' },
  },
  {
    id: 'canola-vs-barley',
    name: {
      en: 'Subsidized Oilseed vs Feed Barley',
      ar: 'لفت زيتي مدعوم (كولزا) ضد شعير علفي',
      fr: 'Oléagineux subventionné vs Orge fourragère',
    },
    description: {
      en: 'Canola rotation opportunity vs Barley baseline on 5 ha',
      ar: 'فرصة دورة اللفت الزيتي ضد محصول الشعير على 5 هكتار',
      fr: 'Opportunité rotation colza vs orge sur 5 ha',
    },
    cropA: { id: 'barley', area: 5, system: 'rainfed', date: '2026-10-20' },
    cropB: { id: 'canola', area: 5, system: 'sprinkler', date: '2026-10-15' },
  },
  {
    id: 'alfalfa-vs-maize',
    name: {
      en: 'Perennial Forage vs Grain Maize',
      ar: 'فصة معمرة ضد ذرة حبوب صيفية',
      fr: 'Luzerne pérenne vs Maïs grain',
    },
    description: {
      en: 'Multi-cut Alfalfa (4 ha) vs High-water Maize (4 ha) water productivity',
      ar: 'فصة متعددة الحشات ضد ذرة صيفية ومقارنة إنتاجية المياه',
      fr: 'Luzerne multi-coupes vs Maïs grain haute demande hydrique',
    },
    cropA: { id: 'alfalfa', area: 4, system: 'sprinkler', date: '2026-09-15' },
    cropB: { id: 'maize', area: 4, system: 'drip', date: '2026-05-10' },
  },
];

export function ScenarioComparisonOverlay({
  scenarioA,
  scenarioB,
  onUpdateScenarioA,
  onUpdateScenarioB,
  onCloneAtoB,
  onSwapScenarios,
  onResetB,
  phytoIndex = [],
}: ScenarioComparisonOverlayProps) {
  const { language, isRTL } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'growth' | 'editors' | 'costs' | 'sensitivity' | 'risks'>('overview');
  const [activeEditorColumn, setActiveEditorColumn] = useState<'both' | 'a' | 'b'>('both');
  const [growthVizSubTab, setGrowthVizSubTab] = useState<'both' | 'water' | 'growth'>('both');

  const profiles = useMemo(() => getSimulatorCropProfiles(), []);
  const resultA = useMemo(() => calculateCropSimulator(scenarioA), [scenarioA]);
  const resultB = useMemo(() => calculateCropSimulator(scenarioB), [scenarioB]);

  const profileA = profiles.find((p) => p.cropId === scenarioA.cropId) ?? profiles[0];
  const profileB = profiles.find((p) => p.cropId === scenarioB.cropId) ?? profiles[0];

  // Deltas (Model B - Model A)
  const deltaRevenue = resultB.cropRevenue - resultA.cropRevenue;
  const deltaCost = resultB.totalCost - resultA.totalCost;
  const deltaNetMargin = resultB.netMargin - resultA.netMargin;
  const deltaGrossMargin = resultB.grossMargin - resultA.grossMargin;
  const deltaRoi = resultB.roiPct - resultA.roiPct;
  const deltaWaterM3 = resultB.totalSeasonIrrigationM3 - resultA.totalSeasonIrrigationM3;
  const deltaLaborDays = resultB.totalSeasonLaborDays - resultA.totalSeasonLaborDays;
  const deltaCostPerHa = resultB.totalCostPerHa - resultA.totalCostPerHa;
  const deltaMarginPerHa = resultB.netMarginPerHa - resultA.netMarginPerHa;

  // Water productivity: Net margin DZD per m3 of water
  const waterProdA = resultA.totalSeasonIrrigationM3 > 0 ? resultA.netMargin / resultA.totalSeasonIrrigationM3 : 0;
  const waterProdB = resultB.totalSeasonIrrigationM3 > 0 ? resultB.netMargin / resultB.totalSeasonIrrigationM3 : 0;

  // Capital Efficiency: Net margin per 1,000 DZD invested
  const capEffA = resultA.totalCost > 0 ? (resultA.netMargin / resultA.totalCost) * 1000 : 0;
  const capEffB = resultB.totalCost > 0 ? (resultB.netMargin / resultB.totalCost) * 1000 : 0;

  // Decisions / Highlights
  const highestProfitModel = resultA.netMargin >= resultB.netMargin ? 'A' : 'B';
  const highestRoiModel = resultA.roiPct >= resultB.roiPct ? 'A' : 'B';
  const bestWaterModel = waterProdA >= waterProdB ? 'A' : 'B';
  const lowestRiskModel = resultA.totalCost <= resultB.totalCost ? 'A' : 'B';

  const applyPreset = (preset: PresetOption) => {
    const nextA = createDefaultSimulatorScenario(preset.cropA.id, preset.cropA.date, preset.cropA.area);
    nextA.irrigationSystem = preset.cropA.system;
    onUpdateScenarioA(nextA);

    const nextB = createDefaultSimulatorScenario(preset.cropB.id, preset.cropB.date, preset.cropB.area);
    nextB.irrigationSystem = preset.cropB.system;
    onUpdateScenarioB(nextB);
  };

  const handleCropChangeA = (cropId: string) => {
    const next = createDefaultSimulatorScenario(cropId, scenarioA.plantingDate, scenarioA.areaHa);
    onUpdateScenarioA({ ...next, id: scenarioA.id, overheadAllocationPct: scenarioA.overheadAllocationPct });
  };

  const handleCropChangeB = (cropId: string) => {
    const next = createDefaultSimulatorScenario(cropId, scenarioB.plantingDate, scenarioB.areaHa);
    onUpdateScenarioB({ ...next, id: scenarioB.id, overheadAllocationPct: scenarioB.overheadAllocationPct });
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP COMPARISON HERO & PRESET SELECTOR                                    */}
      {/* ========================================================================= */}
      <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-slate-900 via-indigo-950 to-emerald-950 p-5 text-white shadow-xl sm:p-7">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge className="border-indigo-400/40 bg-indigo-500/20 text-indigo-200">
                <GitCompareArrows className="mr-1.5 h-3.5 w-3.5" />
                {tr(language, 'Side-by-Side Scenario Overlay', 'مقارنة السيناريوهات جنباً إلى جنب', 'Superposition des scénarios')}
              </Badge>
              <Badge className="border-emerald-400/40 bg-emerald-500/20 text-emerald-200">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                {tr(language, 'Live Synchronized Evaluation', 'تقييم فوري متزامن', 'Évaluation synchronisée en direct')}
              </Badge>
            </div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl text-white">
              {tr(language, 'Crop Model Comparison & Strategy Analyzer', 'محلل ومقارن استراتيجيات ونماذج المحاصيل', 'Comparateur de modèles de culture et d’arbitrage')}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300 sm:text-sm">
              {tr(
                language,
                'Simulate and contrast two independent production systems simultaneously. Gauge net cash margins, capital exposure, water efficiency (DZD/m³), and market shock resilience before planting.',
                'حاكِ وقارن بين نموذجين زراعيين مستقلين في نفس الوقت. قيّم هوامش الربح الصافي، رأس المال المطلوب، كفاءة استهلاك المياه، والقدرة على امتصاص تقلبات السوق قبل اتخاذ القرار.',
                'Simulez et comparez deux systèmes de production en temps réel. Évaluez la marge nette, le capital engagé, la productivité de l’eau (DZD/m³) et la résilience aux chocs de marché.'
              )}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={onCloneAtoB}
            >
              <Copy className="h-3.5 w-3.5" />
              {tr(language, 'Clone Model A → B', 'نسخ النموذج أ ← ب', 'Cloner Modèle A → B')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={onSwapScenarios}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {tr(language, 'Swap Models', 'تبديل النموذجين', 'Inverser les modèles')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={onResetB}
            >
              <X className="h-3.5 w-3.5" />
              {tr(language, 'Reset Model B', 'إعادة ضبط النموذج ب', 'Réinitialiser B')}
            </Button>
          </div>
        </div>

        {/* Quick Presets Grid */}
        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              {tr(language, 'Quick Agronomic Comparison Presets:', 'نماذج مقارنة زراعية جاهزة:', 'Préréglages d’arbitrage agronomique :')}
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {COMPARISON_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className="group flex flex-col justify-between rounded-xl border border-white/15 bg-white/5 p-2.5 text-left transition hover:border-emerald-400/60 hover:bg-white/10"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                    {tr(language, preset.name.en, preset.name.ar, preset.name.fr)}
                  </div>
                  <div className="mt-1 text-[11px] leading-tight text-slate-300/80">
                    {tr(language, preset.description.en, preset.description.ar, preset.description.fr)}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                  {tr(language, 'Load preset', 'تحميل النموذج', 'Charger')}
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUB-NAVIGATION TABS                                                     */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-border bg-card p-1.5 text-xs shadow-sm">
        {[
          { id: 'overview', label: tr(language, 'Executive Scorecard & Deltas', 'بطاقة الأداء والمفاضلة التنفيذية', 'Tableau comparatif & Écarts'), icon: Scale },
          { id: 'growth', label: tr(language, 'Crop Growth & Phenology', 'مراحل نمو وتطور المحصول', 'Croissance & Phénologie'), icon: Sprout },
          { id: 'editors', label: tr(language, 'Side-by-Side Model Editors', 'محرر المعاملات جنباً إلى جنب', 'Éditeurs côte à côte'), icon: Layers },
          { id: 'costs', label: tr(language, 'Cost Structure Overlay', 'مقارنة هياكل التكاليف', 'Structure des coûts'), icon: CircleDollarSign },
          { id: 'sensitivity', label: tr(language, 'Market Volatility Matrix', 'مصفوفة تقلبات السوق', 'Matrice de sensibilité marché'), icon: TrendingUp },
          { id: 'risks', label: tr(language, 'Risk Lab Stress-Test', 'مختبر الصدمات والمخاطر', 'Laboratoire de stress'), icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 font-medium transition ${
                isActive
                  ? 'bg-emerald-600 font-bold text-white shadow-sm dark:bg-emerald-700'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXECUTIVE SCORECARD & DELTAS                                        */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Models Header Bar */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Model A Summary Card */}
            <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 p-4 shadow-sm dark:border-emerald-800 dark:from-emerald-950/40 dark:to-teal-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">
                    A
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    {tr(language, 'Model A (Primary)', 'النموذج أ (الأساسي)', 'Modèle A (Principal)')}
                  </span>
                </div>
                <Badge className="bg-emerald-600 text-white">
                  {profileA.emoji} {cropLabel(language, scenarioA.cropId, profileA.cropName)}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-white/80 p-2 dark:bg-slate-900/60">
                  <div className="text-muted-foreground">{tr(language, 'Area', 'المساحة', 'Surface')}</div>
                  <div className="mt-0.5 font-bold">{scenarioA.areaHa} ha ({scenarioA.irrigationSystem})</div>
                </div>
                <div className="rounded-lg bg-white/80 p-2 dark:bg-slate-900/60">
                  <div className="text-muted-foreground">{tr(language, 'Net Margin', 'الهامش الصافي', 'Marge nette')}</div>
                  <div className={`mt-0.5 font-black ${resultA.netMargin >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700'}`}>
                    {formatSimulatorDzd(resultA.netMargin)}
                  </div>
                </div>
                <div className="rounded-lg bg-white/80 p-2 dark:bg-slate-900/60">
                  <div className="text-muted-foreground">{tr(language, 'ROI', 'العائد', 'ROI')}</div>
                  <div className="mt-0.5 font-black text-emerald-700 dark:text-emerald-400">
                    {formatSimulatorNumber(resultA.roiPct, 1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Model B Summary Card */}
            <div className="rounded-2xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50/70 to-blue-50/40 p-4 shadow-sm dark:border-indigo-800 dark:from-indigo-950/40 dark:to-blue-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">
                    B
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
                    {tr(language, 'Model B (Alternative)', 'النموذج ب (المقارن)', 'Modèle B (Alternatif)')}
                  </span>
                </div>
                <Badge className="bg-indigo-600 text-white">
                  {profileB.emoji} {cropLabel(language, scenarioB.cropId, profileB.cropName)}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-white/80 p-2 dark:bg-slate-900/60">
                  <div className="text-muted-foreground">{tr(language, 'Area', 'المساحة', 'Surface')}</div>
                  <div className="mt-0.5 font-bold">{scenarioB.areaHa} ha ({scenarioB.irrigationSystem})</div>
                </div>
                <div className="rounded-lg bg-white/80 p-2 dark:bg-slate-900/60">
                  <div className="text-muted-foreground">{tr(language, 'Net Margin', 'الهامش الصافي', 'Marge nette')}</div>
                  <div className={`mt-0.5 font-black ${resultB.netMargin >= 0 ? 'text-indigo-700 dark:text-indigo-400' : 'text-rose-700'}`}>
                    {formatSimulatorDzd(resultB.netMargin)}
                  </div>
                </div>
                <div className="rounded-lg bg-white/80 p-2 dark:bg-slate-900/60">
                  <div className="text-muted-foreground">{tr(language, 'ROI', 'العائد', 'ROI')}</div>
                  <div className="mt-0.5 font-black text-indigo-700 dark:text-indigo-400">
                    {formatSimulatorNumber(resultB.roiPct, 1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Strategic Decision Signals / Winners */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 dark:border-emerald-900 dark:bg-emerald-950/30">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  {tr(language, 'Highest Net Cash Margin', 'أعلى هامش ربح نقدي', 'Plus forte marge nette')}
                </span>
                <Award className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-lg font-black text-emerald-900 dark:text-emerald-100">
                  {tr(language, `Model ${highestProfitModel}`, `النموذج ${highestProfitModel === 'A' ? 'أ' : 'ب'}`, `Modèle ${highestProfitModel}`)}
                </span>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  (+{formatSimulatorDzd(Math.abs(deltaNetMargin))})
                </span>
              </div>
              <p className="mt-1 text-[11px] text-emerald-900/70 dark:text-emerald-200/70">
                {highestProfitModel === 'A'
                  ? `${profileA.cropName} (${scenarioA.areaHa} ha) generates more net profit.`
                  : `${profileB.cropName} (${scenarioB.areaHa} ha) generates more net profit.`}
              </p>
            </div>

            <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-3.5 dark:border-indigo-900 dark:bg-indigo-950/30">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
                  {tr(language, 'Highest Capital ROI %', 'أعلى عائد على الاستثمار', 'Meilleur retour / ROI')}
                </span>
                <TrendingUp className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-lg font-black text-indigo-900 dark:text-indigo-100">
                  {tr(language, `Model ${highestRoiModel}`, `النموذج ${highestRoiModel === 'A' ? 'أ' : 'ب'}`, `Modèle ${highestRoiModel}`)}
                </span>
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  ({formatSimulatorNumber(highestRoiModel === 'A' ? resultA.roiPct : resultB.roiPct, 1)}%)
                </span>
              </div>
              <p className="mt-1 text-[11px] text-indigo-900/70 dark:text-indigo-200/70">
                {tr(language, 'Generates higher profit per DZD spent on field operations.', 'يحقق عائدًا أعلى لكل دينار يتم إنفاقه على الحقل.', 'Génère plus de profit par DZD investi.')}
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 dark:border-blue-900 dark:bg-blue-950/30">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                  {tr(language, 'Best Water Productivity', 'أعلى إنتاجية للمياه', 'Meilleure valorisation de l’eau')}
                </span>
                <Droplets className="h-4 w-4 text-blue-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-lg font-black text-blue-900 dark:text-blue-100">
                  {tr(language, `Model ${bestWaterModel}`, `النموذج ${bestWaterModel === 'A' ? 'أ' : 'ب'}`, `Modèle ${bestWaterModel}`)}
                </span>
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                  ({formatSimulatorDzd(Math.max(waterProdA, waterProdB))}/m³)
                </span>
              </div>
              <p className="mt-1 text-[11px] text-blue-900/70 dark:text-blue-200/70">
                {tr(language, 'Net profit generated per cubic meter of irrigation water.', 'صافي الربح المحقق لكل متر مكعب من مياه السقي.', 'Bénéfice net généré par m³ d’eau d’irrigation.')}
              </p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 dark:border-amber-900 dark:bg-amber-950/30">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  {tr(language, 'Lowest Financial Outlay', 'أقل متطلبات لرأس المال', 'Moindre exposition financière')}
                </span>
                <ShieldCheck className="h-4 w-4 text-amber-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-lg font-black text-amber-900 dark:text-amber-100">
                  {tr(language, `Model ${lowestRiskModel}`, `النموذج ${lowestRiskModel === 'A' ? 'أ' : 'ب'}`, `Modèle ${lowestRiskModel}`)}
                </span>
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  ({formatSimulatorDzd(Math.min(resultA.totalCost, resultB.totalCost))})
                </span>
              </div>
              <p className="mt-1 text-[11px] text-amber-900/70 dark:text-amber-200/70">
                {tr(language, 'Requires lower upfront cash to finance the full season.', 'يتطلب سيولة نقدية أقل لتمويل موسم الزراعة بالكامل.', 'Exige moins de trésorerie initiale.')}
              </p>
            </div>
          </div>

          {/* Master Side-by-Side Comparison Table */}
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/60 text-muted-foreground">
                  <th className="p-3.5 font-bold">{tr(language, 'Agronomic & Financial Dimension', 'المعيار الزراعي والمالي', 'Dimension')}</th>
                  <th className="p-3.5 font-bold text-emerald-800 dark:text-emerald-400">
                    {tr(language, 'Model A', 'النموذج أ', 'Modèle A')} ({cropLabel(language, scenarioA.cropId, profileA.cropName)})
                  </th>
                  <th className="p-3.5 font-bold text-indigo-800 dark:text-indigo-400">
                    {tr(language, 'Model B', 'النموذج ب', 'Modèle B')} ({cropLabel(language, scenarioB.cropId, profileB.cropName)})
                  </th>
                  <th className="p-3.5 font-bold">{tr(language, 'Delta (B vs A)', 'الفارق (ب مقارنة بـ أ)', 'Écart (B vs A)')}</th>
                  <th className="p-3.5 font-bold text-center">{tr(language, 'Advantage', 'الأفضلية', 'Avantage')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {/* 1. Area & Yield */}
                <tr>
                  <td className="p-3.5 font-medium">{tr(language, 'Field Area & Method', 'المساحة ونظام الري', 'Surface & Irrigation')}</td>
                  <td className="p-3.5 font-bold text-emerald-700 dark:text-emerald-300">
                    {scenarioA.areaHa} ha · <span className="capitalize">{scenarioA.irrigationSystem}</span>
                  </td>
                  <td className="p-3.5 font-bold text-indigo-700 dark:text-indigo-300">
                    {scenarioB.areaHa} ha · <span className="capitalize">{scenarioB.irrigationSystem}</span>
                  </td>
                  <td className="p-3.5 text-muted-foreground">
                    {scenarioB.areaHa - scenarioA.areaHa > 0 ? `+${scenarioB.areaHa - scenarioA.areaHa}` : scenarioB.areaHa - scenarioA.areaHa} ha
                  </td>
                  <td className="p-3.5 text-center">
                    <Badge variant="outline" className="text-[10px]">
                      {scenarioA.areaHa === scenarioB.areaHa ? 'Same area' : scenarioA.areaHa > scenarioB.areaHa ? 'A larger' : 'B larger'}
                    </Badge>
                  </td>
                </tr>

                {/* 2. Total Yield */}
                <tr>
                  <td className="p-3.5 font-medium">{tr(language, 'Expected Harvest & Yield', 'المردود والإنتاج الكلي', 'Rendement & Production')}</td>
                  <td className="p-3.5">
                    <strong>{formatSimulatorNumber(resultA.totalYieldT, 1)} t</strong> ({scenarioA.expectedYieldTPerHa} t/ha)
                  </td>
                  <td className="p-3.5">
                    <strong>{formatSimulatorNumber(resultB.totalYieldT, 1)} t</strong> ({scenarioB.expectedYieldTPerHa} t/ha)
                  </td>
                  <td className="p-3.5 font-semibold text-foreground">
                    {resultB.totalYieldT - resultA.totalYieldT >= 0 ? `+${formatSimulatorNumber(resultB.totalYieldT - resultA.totalYieldT, 1)}` : formatSimulatorNumber(resultB.totalYieldT - resultA.totalYieldT, 1)} t
                  </td>
                  <td className="p-3.5 text-center">
                    <Badge variant="outline" className={resultA.totalYieldT >= resultB.totalYieldT ? 'border-emerald-300 text-emerald-700' : 'border-indigo-300 text-indigo-700'}>
                      {resultA.totalYieldT >= resultB.totalYieldT ? 'Model A' : 'Model B'}
                    </Badge>
                  </td>
                </tr>

                {/* 3. Expected Price */}
                <tr>
                  <td className="p-3.5 font-medium">{tr(language, 'Selling Price Assumed', 'سعر البيع الافتراضي', 'Prix de vente moyen')}</td>
                  <td className="p-3.5">{formatSimulatorDzd(scenarioA.expectedPricePerT)}/t</td>
                  <td className="p-3.5">{formatSimulatorDzd(scenarioB.expectedPricePerT)}/t</td>
                  <td className="p-3.5 text-muted-foreground">
                    {scenarioB.expectedPricePerT - scenarioA.expectedPricePerT >= 0 ? `+${formatSimulatorDzd(scenarioB.expectedPricePerT - scenarioA.expectedPricePerT)}` : formatSimulatorDzd(scenarioB.expectedPricePerT - scenarioA.expectedPricePerT)}/t
                  </td>
                  <td className="p-3.5 text-center">—</td>
                </tr>

                {/* 4. Total Gross Revenue */}
                <tr className="bg-muted/20">
                  <td className="p-3.5 font-bold">{tr(language, 'Gross Crop Revenue', 'إجمالي الإيرادات', 'Chiffre d’affaires brut')}</td>
                  <td className="p-3.5 font-bold text-emerald-700 dark:text-emerald-300">{formatSimulatorDzd(resultA.cropRevenue)}</td>
                  <td className="p-3.5 font-bold text-indigo-700 dark:text-indigo-300">{formatSimulatorDzd(resultB.cropRevenue)}</td>
                  <td className="p-3.5 font-bold">
                    <span className={deltaRevenue >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700'}>
                      {deltaRevenue >= 0 ? `+${formatSimulatorDzd(deltaRevenue)}` : formatSimulatorDzd(deltaRevenue)}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <Badge className={resultA.cropRevenue >= resultB.cropRevenue ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'}>
                      {resultA.cropRevenue >= resultB.cropRevenue ? 'Model A' : 'Model B'}
                    </Badge>
                  </td>
                </tr>

                {/* 5. Total Field Cost */}
                <tr>
                  <td className="p-3.5 font-medium">{tr(language, 'Total Field Cost (incl. Overhead)', 'إجمالي التكاليف (شاملة المصاريف)', 'Coût total complet')}</td>
                  <td className="p-3.5 font-semibold text-rose-700 dark:text-rose-400">
                    {formatSimulatorDzd(resultA.totalCost)} <span className="text-[10px] text-muted-foreground">({formatSimulatorDzd(resultA.totalCostPerHa)}/ha)</span>
                  </td>
                  <td className="p-3.5 font-semibold text-rose-700 dark:text-rose-400">
                    {formatSimulatorDzd(resultB.totalCost)} <span className="text-[10px] text-muted-foreground">({formatSimulatorDzd(resultB.totalCostPerHa)}/ha)</span>
                  </td>
                  <td className="p-3.5 font-semibold text-muted-foreground">
                    {deltaCost >= 0 ? `+${formatSimulatorDzd(deltaCost)}` : formatSimulatorDzd(deltaCost)}
                  </td>
                  <td className="p-3.5 text-center">
                    <Badge variant="outline" className={resultA.totalCost <= resultB.totalCost ? 'border-emerald-300 text-emerald-700' : 'border-indigo-300 text-indigo-700'}>
                      {resultA.totalCost <= resultB.totalCost ? 'Model A (Lower cost)' : 'Model B (Lower cost)'}
                    </Badge>
                  </td>
                </tr>

                {/* 6. Net Margin */}
                <tr className="bg-muted/40 font-bold">
                  <td className="p-3.5 font-black">{tr(language, 'Net Profit Margin', 'صافي هامش الربح', 'Marge nette bénéficiaire')}</td>
                  <td className="p-3.5 text-sm font-black text-emerald-700 dark:text-emerald-300">
                    {formatSimulatorDzd(resultA.netMargin)}
                    <div className="text-[10px] font-normal text-muted-foreground">
                      {formatSimulatorNumber(resultA.marginPct, 1)}% {tr(language, 'margin', 'هامش', 'marge')}
                    </div>
                  </td>
                  <td className="p-3.5 text-sm font-black text-indigo-700 dark:text-indigo-300">
                    {formatSimulatorDzd(resultB.netMargin)}
                    <div className="text-[10px] font-normal text-muted-foreground">
                      {formatSimulatorNumber(resultB.marginPct, 1)}% {tr(language, 'margin', 'هامش', 'marge')}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className={`text-sm font-black ${deltaNetMargin >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700'}`}>
                      {deltaNetMargin >= 0 ? `+${formatSimulatorDzd(deltaNetMargin)}` : formatSimulatorDzd(deltaNetMargin)}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <Badge className={`px-2.5 py-1 text-xs font-bold ${resultA.netMargin >= resultB.netMargin ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'}`}>
                      {resultA.netMargin >= resultB.netMargin ? 'Model A wins' : 'Model B wins'}
                    </Badge>
                  </td>
                </tr>

                {/* 7. Margin Per Hectare */}
                <tr>
                  <td className="p-3.5 font-medium">{tr(language, 'Net Margin per Hectare', 'الربح الصافي لكل هكتار', 'Marge nette / hectare')}</td>
                  <td className="p-3.5 font-bold text-emerald-700 dark:text-emerald-300">{formatSimulatorDzd(resultA.netMarginPerHa)}/ha</td>
                  <td className="p-3.5 font-bold text-indigo-700 dark:text-indigo-300">{formatSimulatorDzd(resultB.netMarginPerHa)}/ha</td>
                  <td className="p-3.5 font-semibold text-foreground">
                    {deltaMarginPerHa >= 0 ? `+${formatSimulatorDzd(deltaMarginPerHa)}` : formatSimulatorDzd(deltaMarginPerHa)}/ha
                  </td>
                  <td className="p-3.5 text-center">
                    <Badge variant="outline" className={resultA.netMarginPerHa >= resultB.netMarginPerHa ? 'border-emerald-300 text-emerald-700' : 'border-indigo-300 text-indigo-700'}>
                      {resultA.netMarginPerHa >= resultB.netMarginPerHa ? 'Model A' : 'Model B'}
                    </Badge>
                  </td>
                </tr>

                {/* 8. Return on Investment (ROI) */}
                <tr>
                  <td className="p-3.5 font-medium">{tr(language, 'Return on Investment (ROI)', 'العائد على التكلفة (ROI)', 'Retour sur investissement')}</td>
                  <td className="p-3.5 font-bold">{formatSimulatorNumber(resultA.roiPct, 1)}%</td>
                  <td className="p-3.5 font-bold">{formatSimulatorNumber(resultB.roiPct, 1)}%</td>
                  <td className="p-3.5 font-semibold">
                    <span className={deltaRoi >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700'}>
                      {deltaRoi >= 0 ? `+${formatSimulatorNumber(deltaRoi, 1)}%` : `${formatSimulatorNumber(deltaRoi, 1)}%`}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <Badge variant="outline" className={resultA.roiPct >= resultB.roiPct ? 'border-emerald-300 text-emerald-700' : 'border-indigo-300 text-indigo-700'}>
                      {resultA.roiPct >= resultB.roiPct ? 'Model A' : 'Model B'}
                    </Badge>
                  </td>
                </tr>

                {/* 9. Break-even Selling Price */}
                <tr>
                  <td className="p-3.5 font-medium">{tr(language, 'Break-Even Required Price', 'سعر البيع المطلوب للتعادل', 'Prix de rentabilité')}</td>
                  <td className="p-3.5 font-semibold text-amber-700 dark:text-amber-300">{formatSimulatorDzd(resultA.breakEvenPricePerT)}/t</td>
                  <td className="p-3.5 font-semibold text-amber-700 dark:text-amber-300">{formatSimulatorDzd(resultB.breakEvenPricePerT)}/t</td>
                  <td className="p-3.5 text-muted-foreground">
                    {formatSimulatorDzd(resultB.breakEvenPricePerT - resultA.breakEvenPricePerT)}/t
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="text-[11px] text-muted-foreground">{tr(language, 'Target minimum', 'الحد الأدنى', 'Seuil mini')}</span>
                  </td>
                </tr>

                {/* 10. Water Demand & Efficiency */}
                <tr>
                  <td className="p-3.5 font-medium">{tr(language, 'Irrigation Demand & Efficiency', 'استهلاك المياه وكفاءة الري', 'Besoins en eau & Efficacité')}</td>
                  <td className="p-3.5">
                    <div>{formatSimulatorNumber(resultA.totalSeasonIrrigationM3, 0)} m³</div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">{formatSimulatorDzd(waterProdA)}/m³</div>
                  </td>
                  <td className="p-3.5">
                    <div>{formatSimulatorNumber(resultB.totalSeasonIrrigationM3, 0)} m³</div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">{formatSimulatorDzd(waterProdB)}/m³</div>
                  </td>
                  <td className="p-3.5 text-muted-foreground">
                    {deltaWaterM3 >= 0 ? `+${formatSimulatorNumber(deltaWaterM3, 0)}` : formatSimulatorNumber(deltaWaterM3, 0)} m³
                  </td>
                  <td className="p-3.5 text-center">
                    <Badge variant="outline" className={waterProdA >= waterProdB ? 'border-blue-300 text-blue-700' : 'border-indigo-300 text-indigo-700'}>
                      {waterProdA >= waterProdB ? 'Model A (Higher DZD/m³)' : 'Model B (Higher DZD/m³)'}
                    </Badge>
                  </td>
                </tr>

                {/* 11. Labor Intensity */}
                <tr>
                  <td className="p-3.5 font-medium">{tr(language, 'Labor Requirement', 'اليد العاملة المطلوبة', 'Main-d’œuvre')}</td>
                  <td className="p-3.5">
                    <strong>{formatSimulatorNumber(resultA.totalSeasonLaborDays, 1)}</strong> {tr(language, 'days', 'يوم', 'j')}
                    <span className="text-[10px] text-muted-foreground"> ({formatSimulatorNumber(resultA.totalSeasonLaborDays / Math.max(scenarioA.areaHa, 0.01), 1)} j/ha)</span>
                  </td>
                  <td className="p-3.5">
                    <strong>{formatSimulatorNumber(resultB.totalSeasonLaborDays, 1)}</strong> {tr(language, 'days', 'يوم', 'j')}
                    <span className="text-[10px] text-muted-foreground"> ({formatSimulatorNumber(resultB.totalSeasonLaborDays / Math.max(scenarioB.areaHa, 0.01), 1)} j/ha)</span>
                  </td>
                  <td className="p-3.5 text-muted-foreground">
                    {deltaLaborDays >= 0 ? `+${formatSimulatorNumber(deltaLaborDays, 1)}` : formatSimulatorNumber(deltaLaborDays, 1)} {tr(language, 'days', 'يوم', 'j')}
                  </td>
                  <td className="p-3.5 text-center">
                    <Badge variant="outline" className="text-[10px]">
                      {resultA.totalSeasonLaborDays <= resultB.totalSeasonLaborDays ? 'A is lighter' : 'B is lighter'}
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: CROP GROWTH & PHENOLOGY / WATER BUDGET TRAJECTORIES                   */}
      {/* ========================================================================= */}
      {activeTab === 'growth' && (
        <div className="space-y-6">
          <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
            <div className="text-xs text-muted-foreground">
              {tr(
                language,
                'Compare projected phenological growth trajectories, height curves, canopy cover (%), and FAO-56 net irrigation water budgets over time for Model A and Model B.',
                'قارن منحنيات وتطور نمو المحصول، الارتفاع، الغطاء النباتي (%) وميزانيات مياه الري الصافي وفق FAO-56 عبر الزمن للنموذجين أ و ب.',
                'Comparez les trajectoires de croissance phénologique, courbes de hauteur, couverture de canopée (%) et bilans hydriques d’irrigation nette FAO-56 pour le Modèle A et le Modèle B.'
              )}
            </div>

            {/* Sub-tab view selector */}
            <div className="inline-flex rounded-xl border border-border bg-muted/60 p-1 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setGrowthVizSubTab('water')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all ${
                  growthVizSubTab === 'water'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Droplets className="h-3.5 w-3.5" />
                <span>{tr(language, 'Water Budget (ETc vs Irrig)', 'ميزانية المياه (الري vs ETc)', 'Budget hydrique (ETc vs Irrig)')}</span>
              </button>
              <button
                type="button"
                onClick={() => setGrowthVizSubTab('growth')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all ${
                  growthVizSubTab === 'growth'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sprout className="h-3.5 w-3.5" />
                <span>{tr(language, 'Growth & Canopy Cover', 'مراحل النمو والغطاء', 'Croissance & Canopée')}</span>
              </button>
              <button
                type="button"
                onClick={() => setGrowthVizSubTab('both')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all ${
                  growthVizSubTab === 'both'
                    ? 'bg-foreground text-background shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>{tr(language, 'Both', 'كلاهما', 'Les deux')}</span>
              </button>
            </div>
          </div>

          {/* Model A vs Model B Visualizer Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Model A Visualizers */}
            <div className="space-y-4 rounded-2xl border-2 border-emerald-300/80 bg-card p-2 shadow-sm dark:border-emerald-800">
              <div className="flex items-center justify-between border-b border-border bg-emerald-50/70 px-4 py-2.5 dark:bg-emerald-950/40 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">A</span>
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    {tr(language, 'Model A Agronomic Profile', 'الملف الزراعي للنموذج أ', 'Profil agronomique Modèle A')}
                  </span>
                </div>
                <Badge className="bg-emerald-600 text-white text-[11px]">
                  {profileA.emoji} {cropLabel(language, scenarioA.cropId, profileA.cropName)} ({scenarioA.areaHa} ha · {scenarioA.irrigationSystem})
                </Badge>
              </div>

              {(growthVizSubTab === 'water' || growthVizSubTab === 'both') && (
                <CropWaterBudgetVisualizer
                  cropId={scenarioA.cropId}
                  plantingDate={scenarioA.plantingDate}
                  areaHa={scenarioA.areaHa}
                  avgET0={scenarioA.avgET0}
                  irrigationSystem={scenarioA.irrigationSystem}
                />
              )}

              {(growthVizSubTab === 'growth' || growthVizSubTab === 'both') && (
                <CropGrowthStagesVisualizer
                  cropId={scenarioA.cropId}
                  plantingDate={scenarioA.plantingDate}
                  areaHa={scenarioA.areaHa}
                />
              )}
            </div>

            {/* Model B Visualizers */}
            <div className="space-y-4 rounded-2xl border-2 border-indigo-300/80 bg-card p-2 shadow-sm dark:border-indigo-800">
              <div className="flex items-center justify-between border-b border-border bg-indigo-50/70 px-4 py-2.5 dark:bg-indigo-950/40 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">B</span>
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    {tr(language, 'Model B Agronomic Profile', 'الملف الزراعي للنموذج ب', 'Profil agronomique Modèle B')}
                  </span>
                </div>
                <Badge className="bg-indigo-600 text-white text-[11px]">
                  {profileB.emoji} {cropLabel(language, scenarioB.cropId, profileB.cropName)} ({scenarioB.areaHa} ha · {scenarioB.irrigationSystem})
                </Badge>
              </div>

              {(growthVizSubTab === 'water' || growthVizSubTab === 'both') && (
                <CropWaterBudgetVisualizer
                  cropId={scenarioB.cropId}
                  plantingDate={scenarioB.plantingDate}
                  areaHa={scenarioB.areaHa}
                  avgET0={scenarioB.avgET0}
                  irrigationSystem={scenarioB.irrigationSystem}
                />
              )}

              {(growthVizSubTab === 'growth' || growthVizSubTab === 'both') && (
                <CropGrowthStagesVisualizer
                  cropId={scenarioB.cropId}
                  plantingDate={scenarioB.plantingDate}
                  areaHa={scenarioB.areaHa}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SIDE-BY-SIDE MODEL EDITORS                                         */}
      {/* ========================================================================= */}
      {activeTab === 'editors' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {tr(
                language,
                'Modify parameters in either column to see the comparative results update instantly.',
                'عدّل المعاملات في أي من العمودين لمشاهدة تحديث المقارنة فوراً.',
                'Modifiez les paramètres dans chaque colonne pour observer la mise à jour instantanée.'
              )}
            </div>
            <div className="flex gap-1">
              <Button
                variant={activeEditorColumn === 'both' ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setActiveEditorColumn('both')}
              >
                {tr(language, 'Both Columns', 'العمودان معاً', 'Les deux')}
              </Button>
              <Button
                variant={activeEditorColumn === 'a' ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setActiveEditorColumn('a')}
              >
                {tr(language, 'Model A Only', 'النموذج أ فقط', 'Modèle A seul')}
              </Button>
              <Button
                variant={activeEditorColumn === 'b' ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setActiveEditorColumn('b')}
              >
                {tr(language, 'Model B Only', 'النموذج ب فقط', 'Modèle B seul')}
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* COLUMN A: MODEL A */}
            {(activeEditorColumn === 'both' || activeEditorColumn === 'a') && (
              <div className="space-y-4 rounded-2xl border-2 border-emerald-300 bg-card p-4 shadow-sm sm:p-5 dark:border-emerald-800">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">
                      A
                    </span>
                    <h3 className="font-bold text-emerald-900 dark:text-emerald-300">
                      {tr(language, 'Model A Configuration', 'إعدادات النموذج أ', 'Configuration Modèle A')}
                    </h3>
                  </div>
                  <Badge className="bg-emerald-600 text-white">{profileA.emoji} {scenarioA.cropId}</Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-semibold">{tr(language, 'Crop', 'المحصول', 'Culture')}</label>
                    <select
                      className={`${selectClass} mt-1`}
                      value={scenarioA.cropId}
                      onChange={(e) => handleCropChangeA(e.target.value)}
                    >
                      {profiles.map((p) => (
                        <option key={p.cropId} value={p.cropId}>
                          {p.emoji} {cropLabel(language, p.cropId, p.cropName)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold">{tr(language, 'Field Area (ha)', 'مساحة الحقل (هكتار)', 'Surface (ha)')}</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.01"
                      className={`${inputClass} mt-1`}
                      value={scenarioA.areaHa}
                      onChange={(e) => onUpdateScenarioA({ areaHa: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold">{tr(language, 'Planting Date', 'تاريخ الغرس', 'Date de semis')}</label>
                    <Input
                      type="date"
                      className={`${inputClass} mt-1`}
                      value={scenarioA.plantingDate}
                      onChange={(e) => onUpdateScenarioA({ plantingDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold">{tr(language, 'Irrigation Mode', 'نظام الري', 'Système d’irrigation')}</label>
                    <select
                      className={`${selectClass} mt-1`}
                      value={scenarioA.irrigationSystem}
                      onChange={(e) => onUpdateScenarioA({ irrigationSystem: e.target.value as any })}
                    >
                      <option value="rainfed">{tr(language, 'Rainfed + supplemental', 'مطري + تكميلي', 'Pluvial + complément')}</option>
                      <option value="drip">{tr(language, 'Drip (Goutte-à-goutte)', 'تنقيط', 'Goutte-à-goutte')}</option>
                      <option value="sprinkler">{tr(language, 'Sprinkler (Aspersion)', 'رشاش', 'Aspersion')}</option>
                      <option value="furrow">{tr(language, 'Furrow / Gravitaire', 'ري سطحي', 'Raie / gravitaire')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold">{tr(language, 'Expected Yield (t/ha)', 'المردود المتوقع (طن/هكتار)', 'Rendement attendu (t/ha)')}</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      className={`${inputClass} mt-1`}
                      value={scenarioA.expectedYieldTPerHa}
                      onChange={(e) => onUpdateScenarioA({ expectedYieldTPerHa: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold">{tr(language, 'Expected Price (DZD/t)', 'سعر البيع المتوقع (دج/طن)', 'Prix attendu (DZD/t)')}</label>
                    <Input
                      type="number"
                      step="1000"
                      min="0"
                      className={`${inputClass} mt-1`}
                      value={scenarioA.expectedPricePerT}
                      onChange={(e) => onUpdateScenarioA({ expectedPricePerT: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-emerald-50/80 p-3 dark:bg-emerald-950/30">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{tr(language, 'Model A Total Outlay:', 'إجمالي تكلفة النموذج أ:', 'Coût total Modèle A :')}</span>
                    <strong className="text-foreground">{formatSimulatorDzd(resultA.totalCost)}</strong>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{tr(language, 'Net Margin:', 'صافي الربح:', 'Marge nette :')}</span>
                    <strong className="text-emerald-700 dark:text-emerald-400">{formatSimulatorDzd(resultA.netMargin)} ({formatSimulatorNumber(resultA.marginPct, 1)}%)</strong>
                  </div>
                </div>
              </div>
            )}

            {/* COLUMN B: MODEL B */}
            {(activeEditorColumn === 'both' || activeEditorColumn === 'b') && (
              <div className="space-y-4 rounded-2xl border-2 border-indigo-300 bg-card p-4 shadow-sm sm:p-5 dark:border-indigo-800">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">
                      B
                    </span>
                    <h3 className="font-bold text-indigo-900 dark:text-indigo-300">
                      {tr(language, 'Model B Configuration', 'إعدادات النموذج ب', 'Configuration Modèle B')}
                    </h3>
                  </div>
                  <Badge className="bg-indigo-600 text-white">{profileB.emoji} {scenarioB.cropId}</Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-semibold">{tr(language, 'Crop', 'المحصول', 'Culture')}</label>
                    <select
                      className={`${selectClass} mt-1`}
                      value={scenarioB.cropId}
                      onChange={(e) => handleCropChangeB(e.target.value)}
                    >
                      {profiles.map((p) => (
                        <option key={p.cropId} value={p.cropId}>
                          {p.emoji} {cropLabel(language, p.cropId, p.cropName)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold">{tr(language, 'Field Area (ha)', 'مساحة الحقل (هكتار)', 'Surface (ha)')}</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.01"
                      className={`${inputClass} mt-1`}
                      value={scenarioB.areaHa}
                      onChange={(e) => onUpdateScenarioB({ areaHa: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold">{tr(language, 'Planting Date', 'تاريخ الغرس', 'Date de semis')}</label>
                    <Input
                      type="date"
                      className={`${inputClass} mt-1`}
                      value={scenarioB.plantingDate}
                      onChange={(e) => onUpdateScenarioB({ plantingDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold">{tr(language, 'Irrigation Mode', 'نظام الري', 'Système d’irrigation')}</label>
                    <select
                      className={`${selectClass} mt-1`}
                      value={scenarioB.irrigationSystem}
                      onChange={(e) => onUpdateScenarioB({ irrigationSystem: e.target.value as any })}
                    >
                      <option value="rainfed">{tr(language, 'Rainfed + supplemental', 'مطري + تكميلي', 'Pluvial + complément')}</option>
                      <option value="drip">{tr(language, 'Drip (Goutte-à-goutte)', 'تنقيط', 'Goutte-à-goutte')}</option>
                      <option value="sprinkler">{tr(language, 'Sprinkler (Aspersion)', 'رشاش', 'Aspersion')}</option>
                      <option value="furrow">{tr(language, 'Furrow / Gravitaire', 'ري سطحي', 'Raie / gravitaire')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold">{tr(language, 'Expected Yield (t/ha)', 'المردود المتوقع (طن/هكتار)', 'Rendement attendu (t/ha)')}</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      className={`${inputClass} mt-1`}
                      value={scenarioB.expectedYieldTPerHa}
                      onChange={(e) => onUpdateScenarioB({ expectedYieldTPerHa: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold">{tr(language, 'Expected Price (DZD/t)', 'سعر البيع المتوقع (دج/طن)', 'Prix attendu (DZD/t)')}</label>
                    <Input
                      type="number"
                      step="1000"
                      min="0"
                      className={`${inputClass} mt-1`}
                      value={scenarioB.expectedPricePerT}
                      onChange={(e) => onUpdateScenarioB({ expectedPricePerT: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-indigo-50/80 p-3 dark:bg-indigo-950/30">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{tr(language, 'Model B Total Outlay:', 'إجمالي تكلفة النموذج ب:', 'Coût total Modèle B :')}</span>
                    <strong className="text-foreground">{formatSimulatorDzd(resultB.totalCost)}</strong>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{tr(language, 'Net Margin:', 'صافي الربح:', 'Marge nette :')}</span>
                    <strong className="text-indigo-700 dark:text-indigo-400">{formatSimulatorDzd(resultB.netMargin)} ({formatSimulatorNumber(resultB.marginPct, 1)}%)</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: COST STRUCTURE OVERLAY                                              */}
      {/* ========================================================================= */}
      {activeTab === 'costs' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
            <h3 className="font-bold">{tr(language, 'Comparative Cost Structure by Category', 'مقارنة هياكل التكاليف حسب الفئة', 'Structure comparée des coûts')}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {tr(
                language,
                'Overlay of cost line distributions across Model A (Emerald) and Model B (Indigo).',
                'توزيع بنود التكاليف ومقارنتها بين النموذج أ (أخضر) والنموذج ب (أزرق داكن).',
                'Superposition des postes de dépenses entre Modèle A (vert) et Modèle B (indigo).'
              )}
            </p>

            <div className="mt-6 space-y-4">
              {SIMULATOR_COST_CATEGORIES.map((cat) => {
                const itemA = resultA.costBreakdown.find((c) => c.category === cat)?.amount || 0;
                const itemB = resultB.costBreakdown.find((c) => c.category === cat)?.amount || 0;
                if (itemA === 0 && itemB === 0) return null;

                const maxAmount = Math.max(itemA, itemB, 1);
                const pctOfTotalA = resultA.totalCost > 0 ? (itemA / resultA.totalCost) * 100 : 0;
                const pctOfTotalB = resultB.totalCost > 0 ? (itemB / resultB.totalCost) * 100 : 0;

                return (
                  <div key={cat} className="rounded-xl border border-border bg-muted/20 p-3.5 text-xs">
                    <div className="mb-2 flex items-center justify-between font-bold">
                      <span className="text-foreground">{localizedCategory(language, cat)}</span>
                      <span className="text-muted-foreground">
                        {tr(language, 'Delta:', 'الفارق:', 'Écart :')} {formatSimulatorDzd(itemB - itemA)}
                      </span>
                    </div>

                    {/* Model A Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                          <span className="h-2 w-2 rounded-full bg-emerald-600" />
                          {tr(language, 'Model A', 'النموذج أ', 'Modèle A')}: {formatSimulatorDzd(itemA)} ({formatSimulatorNumber(pctOfTotalA, 1)}%)
                        </span>
                        <span className="text-muted-foreground">{formatSimulatorDzd(itemA / Math.max(scenarioA.areaHa, 0.01))}/ha</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-emerald-600 transition-all"
                          style={{ width: `${Math.min(100, Math.max(0, (itemA / maxAmount) * 100))}%` }}
                        />
                      </div>
                    </div>

                    {/* Model B Bar */}
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-400">
                          <span className="h-2 w-2 rounded-full bg-indigo-600" />
                          {tr(language, 'Model B', 'النموذج ب', 'Modèle B')}: {formatSimulatorDzd(itemB)} ({formatSimulatorNumber(pctOfTotalB, 1)}%)
                        </span>
                        <span className="text-muted-foreground">{formatSimulatorDzd(itemB / Math.max(scenarioB.areaHa, 0.01))}/ha</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-indigo-600 transition-all"
                          style={{ width: `${Math.min(100, Math.max(0, (itemB / maxAmount) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SENSITIVITY MATRIX                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'sensitivity' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
            <h3 className="font-bold">{tr(language, 'Market Volatility Sensitivity Matrix', 'مصفوفة الحساسية لتقلبات أسعار السوق', 'Sensibilité à la volatilité du marché')}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {tr(
                language,
                'Compare the resilience of Model A vs Model B across 5 price movements while holding production costs constant.',
                'قارن قدرة النموذجين على امتصاص 5 سيناريوهات لحركة الأسعار مع ثبات تكاليف الإنتاج.',
                'Comparez la résilience des deux modèles face aux fluctuations de prix.'
              )}
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-5">
              {['pessimistic', 'downside', 'base', 'upside', 'optimistic'].map((caseId) => {
                const ptA = resultA.marketPoints.find((p) => p.id === caseId);
                const ptB = resultB.marketPoints.find((p) => p.id === caseId);
                if (!ptA || !ptB) return null;

                const caseLabel =
                  caseId === 'pessimistic'
                    ? tr(language, 'Pessimistic (−30%)', 'متشائم (−٣٠٪)', 'Pessimiste (−30%)')
                    : caseId === 'downside'
                    ? tr(language, 'Downside (−15%)', 'تراجع (−١٥٪)', 'Baisse (−15%)')
                    : caseId === 'base'
                    ? tr(language, 'Base Case (0%)', 'الحالة الأساسية', 'Cas de base')
                    : caseId === 'upside'
                    ? tr(language, 'Upside (+15%)', 'تحسن (+١٥٪)', 'Hausse (+15%)')
                    : tr(language, 'Optimistic (+30%)', 'متفائل (+٣٠٪)', 'Optimiste (+30%)');

                return (
                  <div
                    key={caseId}
                    className={`rounded-xl border p-3.5 ${
                      caseId === 'base'
                        ? 'border-emerald-400 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20'
                        : 'border-border bg-muted/20'
                    }`}
                  >
                    <div className="text-xs font-bold">{caseLabel}</div>

                    {/* Model A outcome */}
                    <div className="mt-3 rounded-lg border border-emerald-200 bg-white/70 p-2 text-xs dark:border-emerald-900 dark:bg-slate-900/60">
                      <div className="font-bold text-emerald-800 dark:text-emerald-300">
                        {tr(language, 'Model A', 'النموذج أ', 'Modèle A')}
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">{formatSimulatorDzd(ptA.pricePerT)}/t</div>
                      <div className={`mt-1 font-black ${ptA.netMargin >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700'}`}>
                        {formatSimulatorDzd(ptA.netMargin)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">ROI {formatSimulatorNumber(ptA.roiPct, 1)}%</div>
                    </div>

                    {/* Model B outcome */}
                    <div className="mt-2 rounded-lg border border-indigo-200 bg-white/70 p-2 text-xs dark:border-indigo-900 dark:bg-slate-900/60">
                      <div className="font-bold text-indigo-800 dark:text-indigo-300">
                        {tr(language, 'Model B', 'النموذج ب', 'Modèle B')}
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">{formatSimulatorDzd(ptB.pricePerT)}/t</div>
                      <div className={`mt-1 font-black ${ptB.netMargin >= 0 ? 'text-indigo-700 dark:text-indigo-400' : 'text-rose-700'}`}>
                        {formatSimulatorDzd(ptB.netMargin)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">ROI {formatSimulatorNumber(ptB.roiPct, 1)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: RISKS LAB                                                          */}
      {/* ========================================================================= */}
      {activeTab === 'risks' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
            <h3 className="font-bold">{tr(language, 'Risk Laboratory Stress-Test Overlay', 'مقارنة اختبارات الإجهاد والمخاطر', 'Stress-tests de résilience')}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {tr(
                language,
                'Evaluate which crop model withstands extreme weather disruptions, pest outbreaks, and input inflation.',
                'اختبر أي النموذجين يتحمل الصدمات المناخية، تفشي الآفات، وتضخم أسعار الأسمدة والمدخلات.',
                'Évaluez quel modèle résiste le mieux aux aléas climatiques et aux hausses d’intrants.'
              )}
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {/* Risks for Model A */}
              <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                  <ShieldAlert className="h-4 w-4" />
                  {tr(language, 'Model A Shock Responses', 'استجابة النموذج أ للصدمات', 'Réponses aux chocs Modèle A')}
                </div>
                {resultA.riskResults.map((r) => (
                  <div key={r.id} className="rounded-lg border border-border bg-card p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{r.label}</span>
                      <Badge className={r.profitable ? 'bg-emerald-600' : 'bg-rose-600'}>
                        {r.profitable ? tr(language, 'Profitable', 'مربح', 'Rentable') : tr(language, 'Loss', 'خسارة', 'Perte')}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">{r.explanation}</p>
                    <div className="mt-2 flex items-center justify-between font-bold">
                      <span className="text-muted-foreground">{tr(language, 'Net Margin:', 'صافي الهامش:', 'Marge nette :')}</span>
                      <span className={r.netMargin >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700'}>
                        {formatSimulatorDzd(r.netMargin)} (ROI {formatSimulatorNumber(r.roiPct, 1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Risks for Model B */}
              <div className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/30 p-4 dark:border-indigo-900 dark:bg-indigo-950/20">
                <div className="flex items-center gap-2 font-bold text-indigo-800 dark:text-indigo-300">
                  <ShieldAlert className="h-4 w-4" />
                  {tr(language, 'Model B Shock Responses', 'استجابة النموذج ب للصدمات', 'Réponses aux chocs Modèle B')}
                </div>
                {resultB.riskResults.map((r) => (
                  <div key={r.id} className="rounded-lg border border-border bg-card p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{r.label}</span>
                      <Badge className={r.profitable ? 'bg-indigo-600' : 'bg-rose-600'}>
                        {r.profitable ? tr(language, 'Profitable', 'مربح', 'Rentable') : tr(language, 'Loss', 'خسارة', 'Perte')}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">{r.explanation}</p>
                    <div className="mt-2 flex items-center justify-between font-bold">
                      <span className="text-muted-foreground">{tr(language, 'Net Margin:', 'صافي الهامش:', 'Marge nette :')}</span>
                      <span className={r.netMargin >= 0 ? 'text-indigo-700 dark:text-indigo-400' : 'text-rose-700'}>
                        {formatSimulatorDzd(r.netMargin)} (ROI {formatSimulatorNumber(r.roiPct, 1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
