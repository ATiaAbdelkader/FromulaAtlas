'use client';

/**
 * FarmPilot — Your Farm Decision Assistant
 *
 * A new integrated tool inside Formula Atlas (Farmer mode). Turns the farmer's
 * available context (location, soil, water, crop, resources) into actionable
 * farming decisions: what to plant, how to irrigate, how much to fertilize,
 * what to do today, and how the economics stack up.
 *
 * Every value carries a clear provenance tag (Measured / Farmer estimate /
 * Atlas estimate / Unknown). Estimates are NEVER presented as measured.
 *
 * Reuses:
 *  - useFarmProfile() from farm-profile-wizard (location, area, crop, plantingDate)
 *  - ALL_58_WILAYAS from algeria-wilayas-58 (Atlas estimates fallback)
 *  - useTranslation() / copyFor() from language-store (trilingual EN/FR/AR)
 *  - appendManualFieldRecord() from field-record-book (task completion records)
 *
 * Mobile-first, RTL-safe, PWA-friendly (uses localStorage for plan persistence).
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sprout, Droplets, FlaskConical, CalendarDays, TrendingUp, ListTodo,
  Sparkles, CheckCircle2, AlertTriangle, HelpCircle, MapPin, Ruler,
  CloudRain, Beaker, Database, BookOpen, ArrowRight, RefreshCw,
  Leaf, Sun, ChevronRight, Info, X,
} from 'lucide-react';
import { useTranslation, copyFor } from '@/lib/language-store';
import { useFarmProfile } from '@/components/agri/farm-profile-wizard';
import { ALL_58_WILAYAS } from '@/lib/algeria-wilayas-58';
import { cn } from '@/lib/utils';

import {
  FARMPILOT_CROPS, PRODUCTION_SYSTEMS, PROVENANCE_BADGES, CONFIDENCE_BADGES,
  SOIL_TEXTURES, WATER_SUITABILITY_LABELS, CROP_STAGE_LABELS, CROP_STAGE_ORDER,
  DEMO_FARM, FARMPILOT_PLAN_KEY,
  type ProductionSystem, type SoilData, type WaterData, type Provenance,
  type Confidence, type FarmPilotCrop, type CropStage, type FarmPilotPlan,
} from '@/lib/farmpilot-data';

import {
  recommendCrops, scoreCrop, classifyWater, calculateIrrigation,
  calculateFertilizer, calculatePlanting, calculateEconomics,
  generateTodayTasks, generateCalendar, getStageProgression, getActiveStage,
  atlasEstimateSoil, atlasEstimateWater, getCropById, formatDzd, monthName,
  type CropRecommendationResult, type FarmContext, type TodayTask,
  type StageProgress, type CalendarWeek,
} from '@/lib/farmpilot-engine';

// ===========================================================================
// Main shell
// ===========================================================================

type View = 'home' | 'recommend' | 'soil' | 'water' | 'plan' | 'calendar' | 'today' | 'economics';

export function FarmPilot() {
  const { language, isRTL } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const profile = useFarmProfile();

  // Farm context state (loaded from profile or demo)
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [wilayaCode, setWilayaCode] = useState<number | undefined>(undefined);
  const [areaHa, setAreaHa] = useState<number>(0.5);
  const [productionSystem, setProductionSystem] = useState<ProductionSystem>('open_field');
  const [irrigationSystem, setIrrigationSystem] = useState<FarmPilotPlan['irrigationSystem']>('drip');
  const [irrigationFlowLph, setIrrigationFlowLph] = useState<number | undefined>(2000);
  const [soil, setSoil] = useState<SoilData>({ provenance: emptySoilProv() });
  const [water, setWater] = useState<WaterData>({ provenance: emptyWaterProv() });
  const [plan, setPlan] = useState<FarmPilotPlan | null>(null);

  // Persisted plan loading
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FARMPILOT_PLAN_KEY);
      if (saved) {
        const p: FarmPilotPlan = JSON.parse(saved);
        setPlan(p);
      }
    } catch { /* ignore */ }
  }, []);

  // Sync farm context from profile or demo
  useEffect(() => {
    if (isDemoMode) {
      setWilayaCode(DEMO_FARM.wilayaCode);
      setAreaHa(DEMO_FARM.areaHa);
      setProductionSystem(DEMO_FARM.productionSystem);
      setIrrigationSystem(DEMO_FARM.irrigationSystem);
      setSoil(DEMO_FARM.soil);
      setWater(DEMO_FARM.water);
      if (!plan) {
        setPlan({
          cropId: DEMO_FARM.crop,
          plantingDate: DEMO_FARM.plantingDate,
          areaHa: DEMO_FARM.areaHa,
          productionSystem: DEMO_FARM.productionSystem,
          irrigationSystem: DEMO_FARM.irrigationSystem,
          irrigationFlowLph: 2000,
          fertilizerProduct: '15-15-15',
          targetYieldTonsHa: 35,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    } else if (profile?.setupCompleted) {
      // Use real farm profile
      if (profile.area) setAreaHa(profile.area);
      if (profile.crop) {
        const crop = getCropById(profile.crop) ?? getCropById('potato');
        if (crop && !plan) {
          setPlan({
            cropId: crop.id,
            plantingDate: profile.plantingDate ?? new Date().toISOString().slice(0, 10),
            areaHa: profile.area ?? 0.5,
            productionSystem: 'open_field',
            irrigationSystem: 'drip',
            irrigationFlowLph: 2000,
            fertilizerProduct: '15-15-15',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      }
    }
  }, [isDemoMode, profile]);

  // Auto-load Atlas estimates when wilaya is set and soil/water are unknown
  useEffect(() => {
    if (wilayaCode == null) return;
    setSoil((prev) => {
      // Only auto-fill if all provenances are 'unknown'
      const allUnknown = Object.values(prev.provenance).every((p) => p === 'unknown');
      if (!allUnknown) return prev;
      const estimate = atlasEstimateSoil(wilayaCode);
      return estimate ?? prev;
    });
    setWater((prev) => {
      const allUnknown = Object.values(prev.provenance).every((p) => p === 'unknown');
      if (!allUnknown) return prev;
      const estimate = atlasEstimateWater(wilayaCode);
      return estimate ?? prev;
    });
  }, [wilayaCode]);

  const [view, setView] = useState<View>('home');

  const context: FarmContext = useMemo(() => {
    const wilaya = ALL_58_WILAYAS.find((w) => w.code === wilayaCode);
    return {
      wilayaCode,
      agroZone: wilaya?.zone,
      areaHa,
      productionSystem,
      soil,
      water,
      plantingDate: plan?.plantingDate,
    };
  }, [wilayaCode, areaHa, productionSystem, soil, water, plan]);

  const savePlan = useCallback((newPlan: FarmPilotPlan) => {
    setPlan(newPlan);
    try {
      localStorage.setItem(FARMPILOT_PLAN_KEY, JSON.stringify(newPlan));
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="w-full space-y-6 max-w-[1200px] mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <FarmPilotHeader
        isDemoMode={isDemoMode}
        onToggleDemo={() => setIsDemoMode(!isDemoMode)}
        wilayaCode={wilayaCode}
        areaHa={areaHa}
        productionSystem={productionSystem}
        cropId={plan?.cropId}
        plantingDate={plan?.plantingDate}
      />

      {/* Navigation */}
      <nav className="flex flex-wrap gap-2 sticky top-0 z-10 bg-background/95 backdrop-blur p-2 -mx-2 rounded-lg border border-border">
        {([
          { id: 'home', icon: Sprout, label: tr('Home', 'الرئيسية', 'Accueil') },
          { id: 'recommend', icon: Sparkles, label: tr('Choose Crop', 'اختر المحصول', 'Choisir culture') },
          { id: 'soil', icon: BookOpen, label: tr('Soil', 'التربة', 'Sol') },
          { id: 'water', icon: Droplets, label: tr('Water', 'الماء', 'Eau') },
          { id: 'plan', icon: FlaskConical, label: tr('My Plan', 'خطتي', 'Mon plan') },
          { id: 'today', icon: ListTodo, label: tr('Today', 'اليوم', "Aujourd'hui") },
          { id: 'calendar', icon: CalendarDays, label: tr('Calendar', 'التقويم', 'Calendrier') },
          { id: 'economics', icon: TrendingUp, label: tr('Economics', 'الاقتصاد', 'Économie') },
        ] as { id: View; icon: typeof Sprout; label: string }[]).map((item) => (
          <Button
            key={item.id}
            variant={view === item.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView(item.id)}
            className="gap-1.5"
          >
            <item.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{item.label}</span>
          </Button>
        ))}
      </nav>

      {/* Views */}
      {view === 'home' && (
        <HomeView
          context={context}
          plan={plan}
          isDemoMode={isDemoMode}
          onNavigate={setView}
        />
      )}
      {view === 'recommend' && (
        <RecommendView
          context={context}
          currentCropId={plan?.cropId}
          onSelectCrop={(cropId) => {
            if (plan) {
              savePlan({ ...plan, cropId, updatedAt: Date.now() });
            } else {
              savePlan({
                cropId,
                plantingDate: new Date().toISOString().slice(0, 10),
                areaHa,
                productionSystem,
                irrigationSystem,
                irrigationFlowLph,
                fertilizerProduct: '15-15-15',
                createdAt: Date.now(),
                updatedAt: Date.now(),
              });
            }
            setView('plan');
          }}
        />
      )}
      {view === 'soil' && (
        <SoilView soil={soil} onChange={setSoil} wilayaCode={wilayaCode} />
      )}
      {view === 'water' && (
        <WaterView water={water} onChange={setWater} wilayaCode={wilayaCode} />
      )}
      {view === 'plan' && plan && (
        <PlanView
          plan={plan}
          context={context}
          onChange={savePlan}
        />
      )}
      {view === 'today' && plan && (
        <TodayView plan={plan} context={context} />
      )}
      {view === 'calendar' && plan && (
        <CalendarView plan={plan} />
      )}
      {view === 'economics' && plan && (
        <EconomicsView plan={plan} context={context} />
      )}

      {/* Missing-plan fallback for plan/today/calendar/economics */}
      {['plan', 'today', 'calendar', 'economics'].includes(view) && !plan && (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="h-10 w-10 mx-auto text-amber-500" />
            <div className="space-y-1">
              <p className="font-semibold">{tr('No active plan yet', 'لا توجد خطة نشطة بعد', 'Aucun plan actif')}</p>
              <p className="text-sm text-muted-foreground">
                {tr(
                  'Choose a crop first to generate your production plan.',
                  'اختر المحصول أولاً لإنشاء خطة الإنتاج.',
                  "Choisissez d'abord une culture pour générer votre plan de production.",
                )}
              </p>
            </div>
            <Button onClick={() => setView('recommend')}>
              <Sparkles className="h-4 w-4 me-2" />
              {tr('Choose a Crop', 'اختر المحصول', 'Choisir une culture')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ===========================================================================
// Header
// ===========================================================================

function FarmPilotHeader({
  isDemoMode, onToggleDemo, wilayaCode, areaHa, productionSystem, cropId, plantingDate,
}: {
  isDemoMode: boolean;
  onToggleDemo: () => void;
  wilayaCode?: number;
  areaHa: number;
  productionSystem: ProductionSystem;
  cropId?: string;
  plantingDate?: string;
}) {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const wilaya = ALL_58_WILAYAS.find((w) => w.code === wilayaCode);
  const crop = cropId ? getCropById(cropId) : undefined;
  const ps = PRODUCTION_SYSTEMS.find((p) => p.id === productionSystem);

  // Determine current stage if plantingDate is set
  let stageLabel: string | null = null;
  if (crop && plantingDate) {
    const active = getActiveStage(crop, plantingDate);
    if (active) {
      stageLabel = CROP_STAGE_LABELS[active.stage].label[language];
    }
  }

  return (
    <header className="rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-5 sm:p-6 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sprout className="h-6 w-6" />
            <h1 className="text-2xl font-bold tracking-tight">FarmPilot</h1>
            {isDemoMode && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-900">
                {tr('DEMO DATA', 'بيانات تجريبية', 'DONNÉES DÉMO')}
              </Badge>
            )}
          </div>
          <p className="text-sm text-emerald-50">
            {tr('Your Farm Decision Assistant', 'مساعد قرارات المزرعة', 'Votre assistant de décisions agricoles')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleDemo}
          className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
        >
          <RefreshCw className="h-3.5 w-3.5 me-1.5" />
          {isDemoMode
            ? tr('Exit Demo', 'إنهاء العرض', 'Quitter démo')
            : tr('Load Demo Farm', 'حمّل مزرعة تجريبية', 'Charger ferme démo')}
        </Button>
      </div>

      {/* Farm summary */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm">
        <div className="rounded-lg bg-white/10 p-2">
          <div className="text-emerald-100 text-[10px] uppercase tracking-wide">{tr('Location', 'الموقع', 'Localisation')}</div>
          <div className="font-semibold flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {wilaya ? (language === 'ar' ? wilaya.nameAr : language === 'fr' ? wilaya.nameFr : wilaya.nameEn) : tr('Not set', 'غير محدد', 'Non défini')}
          </div>
        </div>
        <div className="rounded-lg bg-white/10 p-2">
          <div className="text-emerald-100 text-[10px] uppercase tracking-wide">{tr('Area', 'المساحة', 'Superficie')}</div>
          <div className="font-semibold flex items-center gap-1">
            <Ruler className="h-3 w-3" />
            {areaHa} ha
          </div>
        </div>
        <div className="rounded-lg bg-white/10 p-2">
          <div className="text-emerald-100 text-[10px] uppercase tracking-wide">{tr('System', 'النظام', 'Système')}</div>
          <div className="font-semibold flex items-center gap-1">
            <span>{ps?.emoji}</span>
            {ps ? ps.label[language] : '—'}
          </div>
        </div>
        <div className="rounded-lg bg-white/10 p-2">
          <div className="text-emerald-100 text-[10px] uppercase tracking-wide">{tr('Crop', 'المحصول', 'Culture')}</div>
          <div className="font-semibold flex items-center gap-1">
            {crop ? `${crop.emoji} ${crop.name[language]}` : tr('Not chosen', 'غير مختار', 'Non choisi')}
          </div>
          {stageLabel && (
            <div className="text-[10px] text-emerald-100 mt-0.5">{stageLabel}</div>
          )}
        </div>
      </div>
    </header>
  );
}

// ===========================================================================
// Home view
// ===========================================================================

function HomeView({
  context, plan, isDemoMode, onNavigate,
}: {
  context: FarmContext;
  plan: FarmPilotPlan | null;
  isDemoMode: boolean;
  onNavigate: (v: View) => void;
}) {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  const hour = new Date().getHours();
  const greeting = hour < 12
    ? tr('Good morning', 'صباح الخير', 'Bonjour')
    : hour < 18
      ? tr('Good afternoon', 'مساء الخير', 'Bon après-midi')
      : tr('Good evening', 'مساء الخير', 'Bonsoir');

  const crop = plan ? getCropById(plan.cropId) : undefined;
  const activeStage = crop && plan ? getActiveStage(crop, plan.plantingDate) : undefined;

  // Today's snapshot
  const todayTasks = crop && plan ? generateTodayTasks(crop, plan, activeStage, 5.0).slice(0, 3) : [];

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">
          {greeting} 👨‍🌾
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {tr(
            "Let's make the right decision for your farm.",
            'لنتخذ القرار الصحيح لمزرعتك.',
            'Prenons la bonne décision pour votre ferme.',
          )}
        </p>
      </div>

      {/* Today's snapshot if plan exists */}
      {plan && crop && todayTasks.length > 0 && (
        <Card className="border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-emerald-600" />
              {tr("Today's decisions", 'قرارات اليوم', 'Décisions du jour')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span>{task.emoji}</span>
                  <span className="font-medium truncate">{task.title[language]}</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => onNavigate('today')}>
                  {tr('Details', 'تفاصيل', 'Détails')}
                  <ArrowRight className="h-3 w-3 ms-1 rtl:rotate-180" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action cards */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          {tr('What do you want to decide?', 'ماذا تريد أن تقرر؟', 'Que voulez-vous décider ?')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { view: 'recommend' as View, icon: Sparkles, color: 'emerald', title: tr('Choose a Crop', 'اختر المحصول', 'Choisir une culture'), desc: tr('Find crops suitable for my farm.', 'ابحث عن محاصيل مناسبة لمزرعتك.', 'Trouvez des cultures adaptées à ma ferme.') },
            { view: 'soil' as View, icon: BookOpen, color: 'amber', title: tr('Soil Information', 'معلومات التربة', 'Information sol'), desc: tr('Enter or estimate soil parameters.', 'أدخل أو قدّر معاملات التربة.', 'Saisir ou estimer les paramètres du sol.') },
            { view: 'water' as View, icon: Droplets, color: 'sky', title: tr('Water Quality', 'جودة الماء', "Qualité d'eau"), desc: tr('Classify your irrigation water.', 'صنّف ماء الري.', 'Classez votre eau dirrigation.') },
            { view: 'plan' as View, icon: FlaskConical, color: 'violet', title: tr('My Plan', 'خطتي', 'Mon plan'), desc: tr('Create or review your production plan.', 'أنشئ أو راجع خطة الإنتاج.', 'Créer ou réviser votre plan de production.') },
            { view: 'today' as View, icon: ListTodo, color: 'rose', title: tr("Today's Tasks", 'مهام اليوم', 'Tâches du jour'), desc: tr('See what needs to be done today.', 'اطلع على ما يجب فعله اليوم.', 'Voir ce qui doit être fait aujourd’hui.') },
            { view: 'calendar' as View, icon: CalendarDays, color: 'cyan', title: tr('Crop Calendar', 'تقويم المحصول', 'Calendrier cultural'), desc: tr('Week-by-week plan from planting to harvest.', 'خطة أسبوعية من الزراعة إلى الحصاد.', 'Plan hebdomadaire du semis à la récolte.') },
            { view: 'economics' as View, icon: TrendingUp, color: 'green', title: tr('Economics', 'الاقتصاد', 'Économie'), desc: tr('Compare costs, revenue, gross margin.', 'قارن التكاليف والإيرادات والهامش.', 'Comparer coûts, revenus, marge brute.') },
          ].map((card) => (
            <button
              key={card.view}
              onClick={() => onNavigate(card.view)}
              className={cn(
                'group text-start rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-all border-border',
                'hover:border-emerald-300 dark:hover:border-emerald-800',
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn('rounded-lg p-2 bg-', card.color, '-50 dark:bg-', card.color, '-950/30')}>
                  <card.icon className={cn('h-5 w-5 text-', card.color, '-600')} />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="font-semibold flex items-center gap-1">
                    {card.title}
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {isDemoMode && (
        <Card className="border-amber-200 bg-amber-50/40 dark:bg-amber-950/20">
          <CardContent className="pt-4 text-xs text-amber-800 dark:text-amber-200">
            <Info className="h-4 w-4 inline-block me-1" />
            {tr(
              'You are viewing a demo farm in El Oued (0.5 ha sandy soil, drip irrigation, potato crop). All values shown are Atlas estimates — not real measurements.',
              'أنت تشاهد مزرعة تجريبية في الوادي (0.5 هكتار تربة رملية، ري بالتنقيط، بطاطا). جميع القيم المعروضة تقديرات أطلس — وليست قياسات حقيقية.',
              'Vous visualisez une ferme démo à El Oued (0.5 ha sable, goutte-à-goutte, pomme de terre). Toutes les valeurs sont des estimations Atlas — pas des mesures réelles.',
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ===========================================================================
// Recommend view
// ===========================================================================

function RecommendView({
  context, currentCropId, onSelectCrop,
}: {
  context: FarmContext;
  currentCropId?: string;
  onSelectCrop: (cropId: string) => void;
}) {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  const recommendations = useMemo(() => recommendCrops(context, undefined, 8), [context]);
  const [showAll, setShowAll] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [whyCropId, setWhyCropId] = useState<string | null>(null);

  const visible = showAll ? recommendations : recommendations.slice(0, 5);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-600" />
          {tr('Recommended for your farm', 'محاصيل موصى بها لمزرعتك', 'Recommandées pour votre ferme')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {tr(
            'Ranked by climate, soil, water, salinity, season, system and economics.',
            'مرتبة حسب المناخ والتربة والماء والملوحة والموسم والنظام والاقتصاد.',
            'Classées par climat, sol, eau, salinité, saison, système et économie.',
          )}
        </p>
      </div>

      <ConfidenceBanner count={recommendations.length} context={context} />

      {/* Rankings */}
      <div className="space-y-3">
        {visible.map((rec, idx) => {
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
          const isExpanded = expandedId === rec.crop.id;
          const isCurrent = rec.crop.id === currentCropId;
          return (
            <Card key={rec.crop.id} className={cn(isCurrent && 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20')}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{medal ?? `${idx + 1}.`}</div>
                  <div className="text-3xl">{rec.crop.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <h3 className="font-bold">{rec.crop.name[language]}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{rec.crop.category.replace('_', ' ')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold tabular-nums">
                          {rec.score}<span className="text-sm">%</span>
                        </div>
                        <ConfidenceBadge confidence={rec.confidence} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Strengths + watch-outs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 p-2">
                    <div className="font-semibold text-emerald-700 dark:text-emerald-300 mb-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {tr('Strengths', 'نقاط القوة', 'Points forts')}
                    </div>
                    {rec.strengths.length > 0 ? (
                      <ul className="space-y-0.5">
                        {rec.strengths.map((s, i) => (
                          <li key={i} className="text-emerald-800 dark:text-emerald-200">✓ {s[language]}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">{tr('None', 'لا يوجد', 'Aucune')}</p>
                    )}
                  </div>
                  <div className="rounded-lg bg-amber-50/50 dark:bg-amber-950/20 p-2">
                    <div className="font-semibold text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {tr('Watch out', 'انتبه', 'Attention')}
                    </div>
                    {rec.watchOuts.length > 0 ? (
                      <ul className="space-y-0.5">
                        {rec.watchOuts.map((w, i) => (
                          <li key={i} className="text-amber-800 dark:text-amber-200">⚠ {w[language]}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">{tr('None', 'لا يوجد', 'Aucune')}</p>
                    )}
                  </div>
                </div>

                {/* Expand / Why / Select */}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setExpandedId(isExpanded ? null : rec.crop.id)}>
                    {isExpanded ? tr('Hide details', 'إخفاء التفاصيل', 'Masquer') : tr('Details', 'تفاصيل', 'Détails')}
                    <ChevronRight className={cn('h-3 w-3 ms-1 transition-transform', isExpanded && 'rotate-90')} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setWhyCropId(whyCropId === rec.crop.id ? null : rec.crop.id)}>
                    <HelpCircle className="h-3 w-3 me-1" />
                    {tr('WHY?', 'لماذا؟', 'POURQUOI ?')}
                  </Button>
                  <Button
                    size="sm"
                    variant={isCurrent ? 'secondary' : 'default'}
                    onClick={() => onSelectCrop(rec.crop.id)}
                  >
                    {isCurrent
                      ? tr('Selected ✓', 'مختار ✓', 'Sélectionné ✓')
                      : tr('Select', 'اختيار', 'Choisir')}
                  </Button>
                </div>

                {/* Expanded factors */}
                {isExpanded && (
                  <div className="border-t border-border pt-3 space-y-1.5">
                    {Object.entries(rec.factors).map(([key, f]) => (
                      <div key={key} className="text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="font-mono tabular-nums">{f.score.toFixed(0)}% × {(f.weight * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full',
                              f.score >= 70 ? 'bg-emerald-500' : f.score >= 40 ? 'bg-amber-500' : 'bg-rose-500',
                            )}
                            style={{ width: `${f.score}%` }}
                          />
                        </div>
                        <p className="text-muted-foreground mt-0.5">{f.reason[language]}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Why modal-like inline */}
                {whyCropId === rec.crop.id && (
                  <div className="rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900 p-3 text-xs space-y-2">
                    <div className="font-semibold text-sky-800 dark:text-sky-200 flex items-center gap-1">
                      <HelpCircle className="h-3 w-3" />
                      {tr('Why this score?', 'لماذا هذا التقييم؟', 'Pourquoi ce score ?')}
                    </div>
                    <p className="text-sky-900 dark:text-sky-100">
                      {tr(
                        'Each factor is scored 0-100 based on your farm data, then multiplied by its weight and summed. Scores reflect how well your farm matches this crop\'s needs.',
                        'يتم تقييم كل عامل من 0 إلى 100 بناءً على بيانات مزرعتك، ثم يُضرب في وزنه ويُجمع. تعكس الدرجات مدى تطابق مزرعتك مع احتياجات هذا المحصول.',
                        'Chaque facteur est noté 0-100 selon les données de votre ferme, puis multiplié par son poids et sommé. Les scores reflètent ladéquation de votre ferme aux besoins de cette culture.',
                      )}
                    </p>
                    <ul className="space-y-1 mt-2">
                      {Object.entries(rec.factors).map(([key, f]) => (
                        <li key={key} className="text-sky-900 dark:text-sky-100">
                          <strong className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</strong>{' '}
                          {f.reason[language]} ({f.score.toFixed(0)}%)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {recommendations.length > 5 && (
        <Button variant="outline" className="w-full" onClick={() => setShowAll(!showAll)}>
          {showAll
            ? tr('Show top 5 only', 'اعرض أفضل 5 فقط', 'Afficher top 5 uniquement')
            : tr(`Show all ${recommendations.length}`, `اعرض الكل (${recommendations.length})`, `Voir les ${recommendations.length}`)}
        </Button>
      )}

      {/* "I already know what I want to plant" */}
      <IAlreadyKnowSection context={context} onSelectCrop={onSelectCrop} />
    </div>
  );
}

function IAlreadyKnowSection({
  context, onSelectCrop,
}: {
  context: FarmContext;
  onSelectCrop: (cropId: string) => void;
}) {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showEvaluation, setShowEvaluation] = useState(false);

  const evaluation = useMemo(() => {
    if (!selectedId) return null;
    const crop = getCropById(selectedId);
    if (!crop) return null;
    return scoreCrop(crop, context, {
      climateSuitability: 0.18, soilSuitability: 0.18, waterCompatibility: 0.14,
      salinityTolerance: 0.10, plantingSeason: 0.10, productionSystem: 0.10,
      waterRequirement: 0.08, farmerObjective: 1.0, economicPotential: 0.12,
    });
  }, [selectedId, context]);

  return (
    <Card className="border-violet-200 dark:border-violet-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Leaf className="h-4 w-4 text-violet-600" />
          {tr('I already know what I want to plant', 'أعرف ما أريد زراعته', 'Je sais déjà ce que je veux planter')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FARMPILOT_CROPS.filter((c) => c.productionSystems.includes(context.productionSystem)).map((crop) => (
            <button
              key={crop.id}
              onClick={() => { setSelectedId(crop.id); setShowEvaluation(false); }}
              className={cn(
                'rounded-lg border p-2 text-start transition-all text-sm',
                selectedId === crop.id
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30'
                  : 'border-border hover:border-violet-300',
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{crop.emoji}</span>
                <span className="font-medium truncate">{crop.name[language]}</span>
              </div>
            </button>
          ))}
        </div>

        {selectedId && (
          <Button variant="outline" size="sm" onClick={() => setShowEvaluation(!showEvaluation)}>
            {showEvaluation ? tr('Hide evaluation', 'إخفاء التقييم', 'Masquer évaluation') : tr('Evaluate this crop', 'قيّم هذا المحصول', 'Évaluer cette culture')}
          </Button>
        )}

        {selectedId && showEvaluation && evaluation && (
          <div className="rounded-lg border border-border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{evaluation.crop.emoji}</span>
                <div>
                  <div className="font-semibold">{evaluation.crop.name[language]}</div>
                  <div className="text-xs text-muted-foreground">{tr('Suitability', 'الملاءمة', 'Adéquation')}</div>
                </div>
              </div>
              <div className="text-2xl font-bold tabular-nums">
                {evaluation.score}<span className="text-sm">%</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 p-2">
                <div className="font-semibold text-emerald-700 dark:text-emerald-300 mb-1">{tr('Strengths', 'نقاط القوة', 'Points forts')}</div>
                <ul className="space-y-0.5">
                  {evaluation.strengths.length > 0
                    ? evaluation.strengths.map((s, i) => <li key={i}>✓ {s[language]}</li>)
                    : <li className="text-muted-foreground">—</li>}
                </ul>
              </div>
              <div className="rounded-lg bg-amber-50/50 dark:bg-amber-950/20 p-2">
                <div className="font-semibold text-amber-700 dark:text-amber-300 mb-1">{tr('Limitations', 'القيود', 'Limites')}</div>
                <ul className="space-y-0.5">
                  {evaluation.watchOuts.length > 0
                    ? evaluation.watchOuts.map((w, i) => <li key={i}>⚠ {w[language]}</li>)
                    : <li className="text-muted-foreground">—</li>}
                </ul>
              </div>
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={() => onSelectCrop(selectedId)}
            >
              {tr('Continue with', 'المتابعة مع', 'Continuer avec')} {evaluation.crop.name[language]}
              <ArrowRight className="h-3 w-3 ms-1 rtl:rotate-180" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const { language } = useTranslation();
  const badge = CONFIDENCE_BADGES[confidence];
  return (
    <Badge variant="outline" className="text-[10px] gap-0.5">
      <span>{badge.emoji}</span>
      <span>{badge.label[language]}</span>
    </Badge>
  );
}

function ConfidenceBanner({ count, context }: { count: number; context: FarmContext }) {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const measuredSoil = Object.values(context.soil.provenance).filter((p) => p === 'measured').length;
  const measuredWater = Object.values(context.water.provenance).filter((p) => p === 'measured').length;
  const atlasSoil = Object.values(context.soil.provenance).filter((p) => p === 'atlas_estimate').length;
  const atlasWater = Object.values(context.water.provenance).filter((p) => p === 'atlas_estimate').length;

  if (measuredSoil + measuredWater >= 8) return null;

  return (
    <Card className="border-sky-200 bg-sky-50/40 dark:bg-sky-950/20">
      <CardContent className="pt-3 pb-3 text-xs space-y-1">
        <div className="flex items-center gap-1 font-semibold text-sky-800 dark:text-sky-200">
          <Info className="h-3.5 w-3.5" />
          {tr('Recommendations include Atlas estimates', 'تشمل التوصيات تقديرات أطلس', 'Les recommandations incluent des estimations Atlas')}
        </div>
        <p className="text-sky-700 dark:text-sky-300">
          {tr(
            `Soil: ${measuredSoil} measured, ${atlasSoil} Atlas estimates. Water: ${measuredWater} measured, ${atlasWater} Atlas estimates. For higher accuracy, add lab measurements.`,
            `التربة: ${measuredSoil} مقيسة، ${atlasSoil} تقديرات أطلس. الماء: ${measuredWater} مقيسة، ${atlasWater} تقديرات أطلس. للحصول على دقة أعلى، أضف قياسات المختبر.`,
            `Sol: ${measuredSoil} mesuré(s), ${atlasSoil} estimations Atlas. Eau: ${measuredWater} mesuré(s), ${atlasWater} estimations Atlas. Pour plus de précision, ajoutez des analyses de laboratoire.`,
          )}
        </p>
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// Soil view
// ===========================================================================

function SoilView({
  soil, onChange, wilayaCode,
}: {
  soil: SoilData;
  onChange: (s: SoilData) => void;
  wilayaCode?: number;
}) {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const [advanced, setAdvanced] = useState(false);

  function updateField<K extends keyof SoilData>(key: K, value: SoilData[K] | string | number | undefined, provenance: Provenance) {
    onChange({ ...soil, [key]: value, provenance: { ...soil.provenance, [key]: provenance } } as SoilData);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-amber-600" />
          {tr('Soil Information', 'معلومات التربة', 'Information sol')}
        </h2>
        <div className="flex items-center gap-2">
          {wilayaCode != null && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const est = atlasEstimateSoil(wilayaCode);
                if (est) onChange(est);
              }}
            >
              <Database className="h-3.5 w-3.5 me-1" />
              {tr('Use Atlas estimate', 'استخدم تقدير أطلس', 'Estimation Atlas')}
            </Button>
          )}
          <Button
            size="sm"
            variant={advanced ? 'default' : 'outline'}
            onClick={() => setAdvanced(!advanced)}
          >
            {advanced ? tr('Basic mode', 'الوضع الأساسي', 'Mode basique') : tr('Advanced mode', 'وضع متقدم', 'Mode avancé')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SoilField
          label={tr('Texture', 'القوام', 'Texture')}
          value={soil.texture}
          provenance={soil.provenance.texture}
          onChange={(v, p) => updateField('texture', v, p)}
          type="select"
          options={Object.entries(SOIL_TEXTURES).map(([k, v]) => ({ value: k, label: v.label[language] }))}
        />
        <SoilField
          label="pH"
          value={soil.ph}
          provenance={soil.provenance.ph}
          onChange={(v, p) => updateField('ph', v, p)}
          type="number"
          step={0.1}
          min={3}
          max={10}
        />
        <SoilField
          label={tr('EC (dS/m)', 'التوصيلية (ديسيمنس/م)', 'CE (dS/m)')}
          value={soil.ecDsm}
          provenance={soil.provenance.ecDsm}
          onChange={(v, p) => updateField('ecDsm', v, p)}
          type="number"
          step={0.1}
          min={0}
        />
        <SoilField
          label={tr('Organic matter (%)', 'المادة العضوية (%)', 'Matière organique (%)')}
          value={soil.organicMatterPct}
          provenance={soil.provenance.organicMatterPct}
          onChange={(v, p) => updateField('organicMatterPct', v, p)}
          type="number"
          step={0.1}
          min={0}
        />
        <SoilField
          label={tr('Nitrogen (ppm)', 'الآزوت (ppm)', 'Azote (ppm)')}
          value={soil.nPpm}
          provenance={soil.provenance.nPpm}
          onChange={(v, p) => updateField('nPpm', v, p)}
          type="number"
          step={1}
          min={0}
        />
        <SoilField
          label={tr('Phosphorus (ppm)', 'الفوسفور (ppm)', 'Phosphore (ppm)')}
          value={soil.pPpm}
          provenance={soil.provenance.pPpm}
          onChange={(v, p) => updateField('pPpm', v, p)}
          type="number"
          step={1}
          min={0}
        />
        <SoilField
          label={tr('Potassium (ppm)', 'البوتاسيوم (ppm)', 'Potassium (ppm)')}
          value={soil.kPpm}
          provenance={soil.provenance.kPpm}
          onChange={(v, p) => updateField('kPpm', v, p)}
          type="number"
          step={1}
          min={0}
        />
        {advanced && (
          <>
            <SoilField
              label={tr('CEC (cmol+/kg)', 'سعة التبادل الكاتيوني', 'CEC (cmol+/kg)')}
              value={soil.cecCmolKg}
              provenance={soil.provenance.cecCmolKg}
              onChange={(v, p) => updateField('cecCmolKg', v, p)}
              type="number"
              step={0.1}
              min={0}
            />
            <SoilField
              label={tr('SAR', 'SAR', 'SAR')}
              value={soil.sar}
              provenance={soil.provenance.sar}
              onChange={(v, p) => updateField('sar', v, p)}
              type="number"
              step={0.1}
              min={0}
            />
            <SoilField
              label={tr('CaCO₃ (%)', 'كربونات الكالسيوم', 'CaCO₃ (%)')}
              value={soil.caCO3Pct}
              provenance={soil.provenance.caCO3Pct}
              onChange={(v, p) => updateField('caCO3Pct', v, p)}
              type="number"
              step={0.1}
              min={0}
            />
          </>
        )}
      </div>

      <Card className="bg-amber-50/40 dark:bg-amber-950/20 border-amber-200">
        <CardContent className="pt-3 text-xs space-y-2">
          <div className="font-semibold flex items-center gap-1 text-amber-800 dark:text-amber-200">
            <Info className="h-3.5 w-3.5" />
            {tr('Provenance legend', 'مفتاح المصدر', 'Légende de provenance')}
          </div>
          <div className="flex flex-wrap gap-2">
            {(['measured', 'farmer_estimate', 'atlas_estimate', 'unknown'] as Provenance[]).map((p) => (
              <Badge key={p} variant="outline" className="text-[10px] gap-1">
                <span>{PROVENANCE_BADGES[p].emoji}</span>
                {PROVENANCE_BADGES[p].label[language]}
              </Badge>
            ))}
          </div>
          <p className="text-amber-800 dark:text-amber-200">
            {tr(
              'Always tag your values with the correct source. Atlas estimates are regional defaults — for precise decisions, get a lab analysis.',
              'حدّد دائماً مصدر قيمك بشكل صحيح. تقديرات أطلس قيم إقليمية افتراضية — للقرارات الدقيقة، احصل على تحليل مخبري.',
              'Indiquez toujours la source de vos valeurs. Les estimations Atlas sont des valeurs régionales par défaut — pour des décisions précises, faites une analyse de laboratoire.',
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SoilField({
  label, value, provenance, onChange, type, step, min, max, options,
}: {
  label: string;
  value: string | number | undefined;
  provenance: Provenance;
  onChange: (value: string | number | undefined, provenance: Provenance) => void;
  type: 'number' | 'select';
  step?: number;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
}) {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const badge = PROVENANCE_BADGES[provenance];

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold flex items-center justify-between">
        <span>{label}</span>
        <Badge variant="outline" className="text-[9px] gap-0.5 px-1 py-0">
          <span>{badge.emoji}</span>
          <span>{badge.label[language]}</span>
        </Badge>
      </Label>
      {type === 'select' ? (
        <select
          className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || undefined, 'measured')}
        >
          <option value="">{tr('— select —', '— اختر —', '— choisir —')}</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <Input
          type="number"
          step={step}
          min={min}
          max={max}
          value={(value as number) ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value), 'measured')}
          className="h-9"
        />
      )}
      <div className="flex gap-1 flex-wrap">
        {(['measured', 'farmer_estimate', 'atlas_estimate', 'unknown'] as Provenance[]).map((p) => (
          <button
            key={p}
            onClick={() => onChange(value, p)}
            className={cn(
              'text-[9px] px-1.5 py-0.5 rounded border transition-colors',
              provenance === p
                ? cn('bg-', PROVENANCE_BADGES[p].color, '-100 border-', PROVENANCE_BADGES[p].color, '-400 font-semibold')
                : 'border-border text-muted-foreground hover:bg-muted',
            )}
            title={PROVENANCE_BADGES[p].label[language]}
          >
            {PROVENANCE_BADGES[p].emoji} {PROVENANCE_BADGES[p].label[language]}
          </button>
        ))}
      </div>
    </div>
  );
}

// ===========================================================================
// Water view
// ===========================================================================

function WaterView({
  water, onChange, wilayaCode,
}: {
  water: WaterData;
  onChange: (w: WaterData) => void;
  wilayaCode?: number;
}) {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const classification = useMemo(() => classifyWater(water), [water]);

  function updateField<K extends keyof WaterData>(key: K, value: WaterData[K], provenance: Provenance) {
    onChange({ ...water, [key]: value, provenance: { ...water.provenance, [key]: provenance } });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Droplets className="h-5 w-5 text-sky-600" />
          {tr('Water Quality', 'جودة الماء', "Qualité d'eau")}
        </h2>
        {wilayaCode != null && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const est = atlasEstimateWater(wilayaCode);
              if (est) onChange(est);
            }}
          >
            <Database className="h-3.5 w-3.5 me-1" />
            {tr('Use Atlas estimate', 'استخدم تقدير أطلس', 'Estimation Atlas')}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <WaterField label="pH" value={water.ph} provenance={water.provenance.ph} onChange={(v, p) => updateField('ph', v, p)} step={0.1} min={0} max={14} />
        <WaterField label={tr('EC (dS/m)', 'التوصيلية', 'CE (dS/m)')} value={water.ecDsm} provenance={water.provenance.ecDsm} onChange={(v, p) => updateField('ecDsm', v, p)} step={0.1} min={0} />
        <WaterField label={tr('TDS (ppm)', 'TDS (ppm)', 'TDS (ppm)')} value={water.tdsPpm} provenance={water.provenance.tdsPpm} onChange={(v, p) => updateField('tdsPpm', v, p)} step={1} min={0} />
        <WaterField label={tr('Sodium (meq/L)', 'الصوديوم', 'Sodium (meq/L)')} value={water.sodiumMeqL} provenance={water.provenance.sodiumMeqL} onChange={(v, p) => updateField('sodiumMeqL', v, p)} step={0.1} min={0} />
        <WaterField label={tr('Chloride (meq/L)', 'الكلور', 'Chlorure (meq/L)')} value={water.chlorideMeqL} provenance={water.provenance.chlorideMeqL} onChange={(v, p) => updateField('chlorideMeqL', v, p)} step={0.1} min={0} />
        <WaterField label={tr('Calcium (meq/L)', 'الكالسيوم', 'Calcium (meq/L)')} value={water.calciumMeqL} provenance={water.provenance.calciumMeqL} onChange={(v, p) => updateField('calciumMeqL', v, p)} step={0.1} min={0} />
        <WaterField label={tr('Magnesium (meq/L)', 'المغنيسيوم', 'Magnésium (meq/L)')} value={water.magnesiumMeqL} provenance={water.provenance.magnesiumMeqL} onChange={(v, p) => updateField('magnesiumMeqL', v, p)} step={0.1} min={0} />
        <WaterField label={tr('Bicarbonate (meq/L)', 'البيكربونات', 'Bicarbonate (meq/L)')} value={water.bicarbonateMeqL} provenance={water.provenance.bicarbonateMeqL} onChange={(v, p) => updateField('bicarbonateMeqL', v, p)} step={0.1} min={0} />
        <WaterField label="SAR" value={water.sar} provenance={water.provenance.sar} onChange={(v, p) => updateField('sar', v, p)} step={0.1} min={0} />
        <WaterField label={tr('Boron (ppm)', 'البورون', 'Bore (ppm)')} value={water.boronPpm} provenance={water.provenance.boronPpm} onChange={(v, p) => updateField('boronPpm', v, p)} step={0.1} min={0} />
      </div>

      {/* Classification result */}
      <Card className={cn('border-', WATER_SUITABILITY_LABELS[classification.suitability].color, '-300')}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Beaker className="h-4 w-4" />
            {tr('Water classification', 'تصنيف الماء', "Classification de l'eau")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-lg font-bold">
            <span>{WATER_SUITABILITY_LABELS[classification.suitability].emoji}</span>
            <span>{WATER_SUITABILITY_LABELS[classification.suitability].label[language]}</span>
            <ConfidenceBadge confidence={classification.confidence} />
          </div>
          <ul className="space-y-1 text-sm">
            {classification.reasons.map((r, i) => (
              <li key={i} className="text-muted-foreground">• {r[language]}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function WaterField({
  label, value, provenance, onChange, step, min, max,
}: {
  label: string;
  value: number | undefined;
  provenance: Provenance;
  onChange: (value: number | undefined, provenance: Provenance) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  const { language } = useTranslation();
  const badge = PROVENANCE_BADGES[provenance];
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold flex items-center justify-between">
        <span>{label}</span>
        <Badge variant="outline" className="text-[9px] gap-0.5 px-1 py-0">
          <span>{badge.emoji}</span>
          <span>{badge.label[language]}</span>
        </Badge>
      </Label>
      <Input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value), 'measured')}
        className="h-9"
      />
      <div className="flex gap-1 flex-wrap">
        {(['measured', 'farmer_estimate', 'atlas_estimate', 'unknown'] as Provenance[]).map((p) => (
          <button
            key={p}
            onClick={() => onChange(value, p)}
            className={cn(
              'text-[9px] px-1.5 py-0.5 rounded border transition-colors',
              provenance === p
                ? cn('bg-', PROVENANCE_BADGES[p].color, '-100 border-', PROVENANCE_BADGES[p].color, '-400 font-semibold')
                : 'border-border text-muted-foreground hover:bg-muted',
            )}
            title={PROVENANCE_BADGES[p].label[language]}
          >
            {PROVENANCE_BADGES[p].emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// ===========================================================================
// Plan view (production plan + planting + irrigation + fertilizer calculators)
// ===========================================================================

function PlanView({
  plan, context, onChange,
}: {
  plan: FarmPilotPlan;
  context: FarmContext;
  onChange: (p: FarmPilotPlan) => void;
}) {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const crop = getCropById(plan.cropId);

  if (!crop) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <AlertTriangle className="h-10 w-10 mx-auto text-amber-500" />
          <p className="mt-2">{tr('Crop not found', 'المحصول غير موجود', 'Culture introuvable')}</p>
        </CardContent>
      </Card>
    );
  }

  // Planting calculator
  const planting = calculatePlanting(crop, plan.areaHa, 0.75, 0.3);

  // Irrigation calculator
  const activeStage = getActiveStage(crop, plan.plantingDate);
  const irrigation = activeStage
    ? calculateIrrigation(crop, activeStage.stage, plan, 5.0, 0)
    : null;

  // Fertilizer calculator
  const fertilizer = calculateFertilizer(crop, plan, plan.fertilizerProduct ?? '15-15-15', 1.0);

  // Stage progression
  const progression = getStageProgression(crop, plan.plantingDate);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-violet-600" />
          {tr('My Production Plan', 'خطة الإنتاج', 'Mon plan de production')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {crop.emoji} {crop.name[language]} · {plan.areaHa} ha · {PRODUCTION_SYSTEMS.find((p) => p.id === plan.productionSystem)?.label[language]}
        </p>
      </div>

      {/* Plan settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{tr('Plan settings', 'إعدادات الخطة', 'Paramètres du plan')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{tr('Planting date', 'تاريخ الزراعة', 'Date de semis')}</Label>
            <Input
              type="date"
              value={plan.plantingDate}
              onChange={(e) => onChange({ ...plan, plantingDate: e.target.value, updatedAt: Date.now() })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{tr('Area (ha)', 'المساحة (ه)', 'Surface (ha)')}</Label>
            <Input
              type="number"
              step={0.1}
              min={0.1}
              value={plan.areaHa}
              onChange={(e) => onChange({ ...plan, areaHa: Number(e.target.value) || 0.5, updatedAt: Date.now() })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{tr('Production system', 'نظام الإنتاج', 'Système de production')}</Label>
            <select
              className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={plan.productionSystem}
              onChange={(e) => onChange({ ...plan, productionSystem: e.target.value as ProductionSystem, updatedAt: Date.now() })}
            >
              {PRODUCTION_SYSTEMS.map((ps) => (
                <option key={ps.id} value={ps.id}>{ps.emoji} {ps.label[language]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{tr('Irrigation system', 'نظام الري', "Système d'irrigation")}</Label>
            <select
              className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={plan.irrigationSystem}
              onChange={(e) => onChange({ ...plan, irrigationSystem: e.target.value as FarmPilotPlan['irrigationSystem'], updatedAt: Date.now() })}
            >
              <option value="drip">{tr('Drip', 'تنقيط', 'Goutte-à-goutte')}</option>
              <option value="sprinkler">{tr('Sprinkler', 'رشاش', 'Aspersion')}</option>
              <option value="furrow">{tr('Furrow', 'أخاديد', 'Raies')}</option>
              <option value="rainfed">{tr('Rainfed', 'بعلي', 'Pluvial')}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{tr('Flow rate (L/h)', 'معدل التدفق (ل/س)', 'Débit (L/h)')}</Label>
            <Input
              type="number"
              step={100}
              min={0}
              value={plan.irrigationFlowLph ?? ''}
              onChange={(e) => onChange({ ...plan, irrigationFlowLph: e.target.value === '' ? undefined : Number(e.target.value), updatedAt: Date.now() })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{tr('Fertilizer product', 'السماد', 'Engrais')}</Label>
            <Input
              type="text"
              placeholder="15-15-15"
              value={plan.fertilizerProduct ?? ''}
              onChange={(e) => onChange({ ...plan, fertilizerProduct: e.target.value, updatedAt: Date.now() })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Planting calculator */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sprout className="h-4 w-4 text-emerald-600" />
            {tr('Planting Calculator', 'حاسبة الزراعة', 'Calculateur de plantation')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-xs text-muted-foreground">{tr('Total plants', 'إجمالي النباتات', 'Plantes totales')}</div>
              <div className="text-lg font-bold tabular-nums">{planting.totalPlants.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{tr('Seed/material', 'البذور/المواد', 'Semences')}</div>
              <div className="text-lg font-bold tabular-nums">{planting.seedKgRequired.toLocaleString()} kg</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{tr('Density', 'الكثافة', 'Densité')}</div>
              <div className="text-lg font-bold tabular-nums">{crop.plantsPerM2}/m²</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{tr('Cycle length', 'مدة الدورة', 'Durée cycle')}</div>
              <div className="text-lg font-bold tabular-nums">{crop.cycleLengthDays} {tr('days', 'يوم', 'jours')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Irrigation */}
      {irrigation && activeStage && (
        <WhyCard
          title={tr('Irrigation (today)', 'الري (اليوم)', 'Irrigation (aujourd’hui)')}
          icon={<Droplets className="h-4 w-4 text-sky-600" />}
          color="sky"
          value={`${irrigation.totalM3PerDay} m³`}
          subtitle={irrigation.irrigationDurationMinutes
            ? `${tr('Duration', 'المدة', 'Durée')}: ${irrigation.irrigationDurationMinutes} min @ ${plan.irrigationFlowLph?.toLocaleString()} L/h`
            : tr('Set flow rate to compute duration', 'حدد معدل التدفق لحساب المدة', 'Définir le débit pour la durée')}
          reasons={irrigation.reasons}
          confidence={irrigation.confidence}
          details={[
            { label: 'ET₀', value: `${irrigation.etoMmPerDay.toFixed(2)} mm/day` },
            { label: 'Kc', value: irrigation.kc.toFixed(2) },
            { label: 'ETc', value: `${irrigation.etcMmPerDay.toFixed(2)} mm/day` },
            { label: tr('Efficiency', 'الكفاءة', 'Efficacité'), value: `${(irrigation.irrigationEfficiency * 100).toFixed(0)}%` },
            { label: tr('Stage', 'المرحلة', 'Stade'), value: CROP_STAGE_LABELS[activeStage.stage].label[language] },
          ]}
        />
      )}

      {/* Fertilizer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-amber-600" />
            {tr('Fertilizer Plan', 'خطة التسميد', 'Plan de fertilisation')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-muted-foreground">N</div>
              <div className="text-lg font-bold tabular-nums">{fertilizer.requiredNutrient.n} kg/ha</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">P</div>
              <div className="text-lg font-bold tabular-nums">{fertilizer.requiredNutrient.p} kg/ha</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">K</div>
              <div className="text-lg font-bold tabular-nums">{fertilizer.requiredNutrient.k} kg/ha</div>
            </div>
          </div>
          <div className="rounded-lg bg-amber-50/50 dark:bg-amber-950/20 p-3 text-sm">
            <div className="font-semibold">
              {tr('Product required', 'الكمية المطلوبة', 'Produit requis')}: {fertilizer.requiredProductKgPerHa} kg/ha
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {tr('Total for', 'الإجمالي لـ', 'Total pour')} {plan.areaHa} ha: <span className="font-semibold">{fertilizer.totalProductKg.toLocaleString()} kg</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {tr('Confidence', 'الثقة', 'Confiance')}: <ConfidenceBadgeInline confidence={fertilizer.confidence} />
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold mb-2">{tr('Split applications', 'التطبيقات المجزأة', 'Apports fractionnés')}</div>
            <div className="space-y-1">
              {fertilizer.splitApplications.filter((s) => s.kgPerHa > 0).map((s) => (
                <div key={s.stage} className="flex items-center justify-between text-xs">
                  <span className="capitalize">{CROP_STAGE_LABELS[s.stage].label[language]}</span>
                  <span className="font-mono tabular-nums">{s.kgPerHa} kg/ha ({(s.fraction * 100).toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stage timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-cyan-600" />
            {tr('Stage Timeline', 'الجدول الزمني', 'Calendrier des stades')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {progression.map((p) => (
              <div
                key={p.stage}
                className={cn(
                  'flex items-center gap-2 text-xs rounded px-2 py-1.5',
                  p.isActive ? 'bg-emerald-100 dark:bg-emerald-950/40 font-semibold' : 'bg-muted/30',
                )}
              >
                <span>{CROP_STAGE_LABELS[p.stage].emoji}</span>
                <span className="flex-1">{CROP_STAGE_LABELS[p.stage].label[language]}</span>
                <span className="text-muted-foreground tabular-nums">
                  {p.startDate.toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en-GB', { day: '2-digit', month: 'short' })}
                  {' → '}
                  {p.endDate.toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en-GB', { day: '2-digit', month: 'short' })}
                </span>
                <span className="text-muted-foreground tabular-nums w-12 text-end">{p.durationDays}d</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ConfidenceBadgeInline({ confidence }: { confidence: Confidence }) {
  const { language } = useTranslation();
  return <ConfidenceBadge confidence={confidence} />;
}

// ===========================================================================
// Why card (used for irrigation and other recommendation displays)
// ===========================================================================

function WhyCard({
  title, icon, color, value, subtitle, reasons, confidence, details,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  value: string;
  subtitle: string;
  reasons: { en: string; fr: string; ar: string }[];
  confidence: Confidence;
  details: { label: string; value: string }[];
}) {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const [showWhy, setShowWhy] = useState(false);
  const [showCalc, setShowCalc] = useState(false);

  return (
    <Card className={cn('border-', color, '-200')}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <ConfidenceBadge confidence={confidence} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-3">
          <div className="text-3xl font-bold tabular-nums">{value}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setShowWhy(!showWhy)}>
            <HelpCircle className="h-3 w-3 me-1" />
            {tr('WHY?', 'لماذا؟', 'POURQUOI ?')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowCalc(!showCalc)}>
            <Database className="h-3 w-3 me-1" />
            {tr('CALCULATION', 'الحساب', 'CALCUL')}
          </Button>
        </div>
        {showWhy && (
          <div className="rounded-lg bg-muted/30 p-3 text-xs space-y-1">
            {reasons.map((r, i) => (
              <div key={i} className="text-muted-foreground">• {r[language]}</div>
            ))}
          </div>
        )}
        {showCalc && (
          <div className="rounded-lg bg-sky-50/40 dark:bg-sky-950/20 p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {details.map((d) => (
              <div key={d.label}>
                <div className="text-muted-foreground text-[10px] uppercase tracking-wide">{d.label}</div>
                <div className="font-mono font-semibold">{d.value}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// Today view
// ===========================================================================

function TodayView({ plan, context }: { plan: FarmPilotPlan; context: FarmContext }) {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const crop = getCropById(plan.cropId);

  const tasks = useMemo(() => {
    if (!crop) return [];
    const active = getActiveStage(crop, plan.plantingDate);
    return generateTodayTasks(crop, plan, active, 5.0);
  }, [crop, plan]);

  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  if (!crop) return null;

  const activeStage = getActiveStage(crop, plan.plantingDate);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-rose-600" />
          {tr('Today on your farm', 'اليوم في مزرعتك', "Aujourd'hui sur votre ferme")}
        </h2>
        {activeStage && (
          <p className="text-sm text-muted-foreground mt-1">
            {tr('Active stage', 'المرحلة النشطة', 'Stade actif')}: {CROP_STAGE_LABELS[activeStage.stage].emoji} {CROP_STAGE_LABELS[activeStage.stage].label[language]}
          </p>
        )}
      </div>

      {/* Tasks */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <TodayTaskCard
            key={task.id}
            task={task}
            completed={!!completed[task.id]}
            onToggle={() => setCompleted((prev) => ({ ...prev, [task.id]: !prev[task.id] }))}
          />
        ))}
      </div>

      {/* Tomorrow preview */}
      <Card className="border-dashed">
        <CardContent className="pt-3 pb-3 text-sm">
          <div className="font-semibold text-muted-foreground mb-1">
            {tr('Next task', 'المهمة التالية', 'Prochaine tâche')} · {tr('Tomorrow', 'غداً', 'Demain')}
          </div>
          <p>
            {tr(
              'Same irrigation and inspection schedule. Adjust based on weather and field observations.',
              'نفس جدول الري والفحص. عدّل حسب الطقس وملاحظات الحقل.',
              'Même programme d’irrigation et d’inspection. Ajustez selon la météo et les observations du champ.',
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function TodayTaskCard({
  task, completed, onToggle,
}: {
  task: TodayTask;
  completed: boolean;
  onToggle: () => void;
}) {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const [showWhy, setShowWhy] = useState(false);

  return (
    <Card className={cn('border-', task.color, '-200', completed && 'opacity-60')}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start gap-3">
          <button
            onClick={onToggle}
            className={cn(
              'mt-1 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0',
              completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/30 hover:border-emerald-500',
            )}
          >
            {completed && <CheckCircle2 className="h-3 w-3" />}
          </button>
          <div className="text-2xl">{task.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className={cn('font-semibold', completed && 'line-through')}>
              {task.title[language]}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {task.detail[language]}
            </div>
          </div>
          <ConfidenceBadge confidence={task.confidence} />
        </div>
        {task.why && (
          <div className="ps-9">
            <Button size="sm" variant="ghost" onClick={() => setShowWhy(!showWhy)} className="text-xs">
              <HelpCircle className="h-3 w-3 me-1" />
              {showWhy ? tr('Hide reason', 'إخفاء السبب', 'Masquer') : tr('WHY?', 'لماذا؟', 'POURQUOI ?')}
            </Button>
            {showWhy && (
              <div className="mt-1 text-xs text-muted-foreground bg-muted/30 rounded p-2">
                {task.why[language]}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// Calendar view
// ===========================================================================

function CalendarView({ plan }: { plan: FarmPilotPlan }) {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const crop = getCropById(plan.cropId);

  const weeks = useMemo(() => {
    if (!crop) return [];
    return generateCalendar(crop, plan.plantingDate);
  }, [crop, plan]);

  if (!crop) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-cyan-600" />
          {tr('Crop Calendar', 'تقويم المحصول', 'Calendrier cultural')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {crop.emoji} {crop.name[language]} · {tr('From', 'من', 'Depuis')} {new Date(plan.plantingDate).toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en-GB')}
        </p>
      </div>

      <div className="space-y-2">
        {weeks.map((week, idx) => {
          const today = new Date();
          const isCurrentWeek = today >= week.startDate && today < week.endDate;
          return (
            <Card
              key={idx}
              className={cn(isCurrentWeek && 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20')}
            >
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-semibold flex items-center gap-2">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {tr('Week', 'أسبوع', 'Semaine')} {week.weekNumber}
                    </span>
                    <span>{CROP_STAGE_LABELS[week.stage].emoji} {CROP_STAGE_LABELS[week.stage].label[language]}</span>
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {week.startDate.toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en-GB', { day: '2-digit', month: 'short' })}
                    {' → '}
                    {week.endDate.toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en-GB', { day: '2-digit', month: 'short' })}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {week.activities.map((act, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] gap-0.5">
                      <span>{act.emoji}</span>
                      <span>{act.label[language]}</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ===========================================================================
// Economics view
// ===========================================================================

function EconomicsView({ plan, context }: { plan: FarmPilotPlan; context: FarmContext }) {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const crop = getCropById(plan.cropId);

  const [pricePerKg, setPricePerKg] = useState(crop?.typicalPriceDzdPerKg ?? 60);
  const [expectedYield, setExpectedYield] = useState(crop?.referenceYieldTonsHa ?? 30);
  const [customCostPerHa, setCustomCostPerHa] = useState<number | undefined>(undefined);

  const economics = useMemo(() => {
    if (!crop) return null;
    return calculateEconomics(crop, plan.areaHa, expectedYield, pricePerKg, customCostPerHa);
  }, [crop, plan.areaHa, expectedYield, pricePerKg, customCostPerHa]);

  if (!crop || !economics) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          {tr('Economics', 'الاقتصاد', 'Économie')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {crop.emoji} {crop.name[language]} · {plan.areaHa} ha
        </p>
      </div>

      {/* Inputs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{tr('Inputs', 'المدخلات', 'Intrants')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{tr('Expected yield (t/ha)', 'المحصول المتوقع (ط/ه)', 'Rendement attendu (t/ha)')}</Label>
            <Input
              type="number"
              step={0.5}
              min={0}
              value={expectedYield}
              onChange={(e) => setExpectedYield(Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{tr('Selling price (DZD/kg)', 'سعر البيع (دج/كغ)', 'Prix de vente (DZD/kg)')}</Label>
            <Input
              type="number"
              step={5}
              min={0}
              value={pricePerKg}
              onChange={(e) => setPricePerKg(Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">
              {tr('Cost per ha (DZD)', 'التكلفة/ه (دج)', 'Coût/ha (DZD)')}
              <span className="text-muted-foreground ms-1">({tr('Atlas default', 'افتراضي أطلس', 'Défaut Atlas')}: {crop.indicativeCostDzdPerHa.toLocaleString()})</span>
            </Label>
            <Input
              type="number"
              step={1000}
              min={0}
              placeholder={crop.indicativeCostDzdPerHa.toString()}
              value={customCostPerHa ?? ''}
              onChange={(e) => setCustomCostPerHa(e.target.value === '' ? undefined : Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={tr('Total revenue', 'الإيراد الإجمالي', 'Revenu total')} value={formatDzd(economics.totalRevenueDzd)} color="emerald" />
        <StatCard label={tr('Total cost', 'التكلفة الإجمالية', 'Coût total')} value={formatDzd(economics.totalCostDzd)} color="rose" />
        <StatCard label={tr('Gross margin', 'الهامش الإجمالي', 'Marge brute')} value={formatDzd(economics.grossMarginDzd)} color={economics.grossMarginDzd >= 0 ? 'emerald' : 'rose'} />
        <StatCard label={tr('ROI', 'العائد على الاستثمار', 'ROI')} value={`${economics.roiPct}%`} color={economics.roiPct >= 0 ? 'emerald' : 'rose'} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label={tr('Margin per ha', 'الهامش/ه', 'Marge/ha')} value={formatDzd(economics.grossMarginPerHaDzd)} color="violet" />
        <StatCard label={tr('Cost per kg', 'التكلفة/كغ', 'Coût/kg')} value={`${economics.costPerKgDzd.toFixed(1)} DZD`} color="amber" />
        <StatCard label={tr('Break-even price', 'سعر التعادل', 'Prix de seuil')} value={`${economics.breakEvenPriceDzdPerKg.toFixed(1)} DZD/kg`} color="sky" />
      </div>

      {/* Comparison hint */}
      <Card className="bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200">
        <CardContent className="pt-3 text-xs">
          <div className="font-semibold text-emerald-800 dark:text-emerald-200 mb-1">
            {tr('Compare with other crops', 'قارن مع محاصيل أخرى', 'Comparer avec d’autres cultures')}
          </div>
          <p className="text-emerald-700 dark:text-emerald-300">
            {tr(
              'Use the "Choose a Crop" view to see all recommended crops with their economic potential.',
              'استخدم عرض "اختر المحصول" لرؤية جميع المحاصيل الموصى بها مع إمكاناتها الاقتصادية.',
              'Utilisez la vue « Choisir une culture » pour voir toutes les cultures recommandées avec leur potentiel économique.',
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card className={cn('border-', color, '-200')}>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={cn('text-lg font-bold tabular-nums text-', color, '-700 dark:text-', color, '-300')}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// Helpers
// ===========================================================================

function emptySoilProv(): SoilData['provenance'] {
  return {
    texture: 'unknown', ph: 'unknown', ecDsm: 'unknown', organicMatterPct: 'unknown',
    nPpm: 'unknown', pPpm: 'unknown', kPpm: 'unknown', cecCmolKg: 'unknown',
    sar: 'unknown', caCO3Pct: 'unknown',
  };
}

function emptyWaterProv(): WaterData['provenance'] {
  return {
    ph: 'unknown', ecDsm: 'unknown', tdsPpm: 'unknown', sodiumMeqL: 'unknown',
    chlorideMeqL: 'unknown', calciumMeqL: 'unknown', magnesiumMeqL: 'unknown',
    bicarbonateMeqL: 'unknown', sar: 'unknown', boronPpm: 'unknown',
  };
}
