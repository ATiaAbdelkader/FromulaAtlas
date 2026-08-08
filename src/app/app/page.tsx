'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect, useRef } from 'react';
import { Search, Sprout, Layers, BookOpen, Calculator, X, Leaf, Filter, Home, Wrench, Bug, TrendingUp, Droplets, Settings, Calendar, Satellite, ShoppingCart, Users, DollarSign, RefreshCw, Beef, FlaskConical, CloudRain, FileText, Trophy, Tractor, Sparkles, Download, CheckCircle2, MapPin, Shapes, Compass, Sun, Mountain, FlaskConical as Flask, CalendarDays, Clock, Warehouse, Recycle, Wind, Flame, Snowflake, Gauge, Shield, Moon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { FormulaCard, hasCalculator } from '@/components/agri/formula-card';
import { FormulaDetailDialog } from '@/components/agri/formula-detail-dialog';
import { SidebarNav } from '@/components/agri/sidebar-nav';
import { UseCasesSection } from '@/components/agri/use-cases-section';
import { FreeToolsSection } from '@/components/agri/nutri-tools/FreeToolsSection';
import { AgronomistAssistant } from '@/components/agri/nutri-tools/AgronomistAssistant';
import { AgriAgentChat } from '@/components/agri/nutri-tools/AgriAgentChat';
import { CommandPalette, CommandPaletteTrigger } from '@/components/ui/command-palette';
import { HomeDashboard } from '@/components/agri/home-dashboard';
import { AboutPage } from '@/components/agri/about-page';
import { recordToolUse, type ToolEntry } from '@/lib/tool-registry';
import { FieldDataCapture } from '@/components/agri/nutri-tools/FieldDataCapture';
import { MultiFieldDashboard } from '@/components/agri/nutri-tools/MultiFieldDashboard';
import { YieldGapAnalysis } from '@/components/agri/nutri-tools/YieldGapAnalysis';
import { SustainabilityScorecard } from '@/components/agri/nutri-tools/SustainabilityScorecard';
import { FieldScoutingLog } from '@/components/agri/nutri-tools/FieldScoutingLog';
import { CollapsibleSection } from '@/components/agri/nutri-tools/CollapsibleSection';
import { IrrigationProgramGenerator } from '@/components/agri/nutri-tools/IrrigationProgramGenerator';
import { IrrigationSystemDesigner } from '@/components/agri/nutri-tools/IrrigationSystemDesigner';
import { AgriPlannerSuite } from '@/components/agri/nutri-tools/AgriPlannerSuite';
import { NdviFieldMaps } from '@/components/agri/nutri-tools/NdviFieldMaps';
import { Marketplace } from '@/components/agri/nutri-tools/Marketplace';
import { FarmerCommunity } from '@/components/agri/nutri-tools/FarmerCommunity';
import { FinancialDashboard } from '@/components/agri/nutri-tools/FinancialDashboard';
import { CropRotationPlanner } from '@/components/agri/nutri-tools/CropRotationPlanner';
import { LivestockIntegration } from '@/components/agri/nutri-tools/LivestockIntegration';
import { SoilTestHistoryTracker } from '@/components/agri/nutri-tools/SoilTestHistoryTracker';
import { WeatherRadar } from '@/components/agri/nutri-tools/WeatherRadar';
import { ReportGenerator } from '@/components/agri/nutri-tools/ReportGenerator';
import { GamificationPanel } from '@/components/agri/nutri-tools/GamificationPanel';
import { CoordinateConverter } from '@/components/agri/nutri-tools/CoordinateConverter';
import { FieldBoundaryImporter } from '@/components/agri/nutri-tools/FieldBoundaryImporter';
import { DistanceBearingCalculator } from '@/components/agri/nutri-tools/DistanceBearingCalculator';
import { ElevationSlopeAnalyzer } from '@/components/agri/nutri-tools/ElevationSlopeAnalyzer';
import { EvapotranspirationTracker } from '@/components/agri/nutri-tools/EvapotranspirationTracker';
import { ServiceIntegrations } from '@/components/agri/nutri-tools/ServiceIntegrations';
import { FertilizationGenerator } from '@/components/agri/nutri-tools/FertilizationGenerator';
import { LaborCalendar } from '@/components/agri/nutri-tools/LaborCalendar';
import { SeasonPlanGenerator } from '@/components/agri/nutri-tools/SeasonPlanGenerator';
import { IrrigationScheduler } from '@/components/agri/nutri-tools/IrrigationScheduler';
import { PostHarvestStorageCalculator } from '@/components/agri/nutri-tools/PostHarvestStorageCalculator';
import { CompostMixerCalculator } from '@/components/agri/nutri-tools/CompostMixerCalculator';
import { PesticideDoseCalculator } from '@/components/agri/nutri-tools/PesticideDoseCalculator';
import { RUSLEErosionCalculator } from '@/components/agri/nutri-tools/RUSLEErosionCalculator';
import { CarbonCreditCalculator } from '@/components/agri/nutri-tools/CarbonCreditCalculator';
import { GreenhouseClimateDesigner } from '@/components/agri/nutri-tools/GreenhouseClimateDesigner';
import { DiseaseForecastDashboard } from '@/components/agri/nutri-tools/DiseaseForecastDashboard';
import { FeedRationBalancer } from '@/components/agri/nutri-tools/FeedRationBalancer';
import { CoverCropSelector } from '@/components/agri/nutri-tools/CoverCropSelector';
import { SprayDriftAssessor } from '@/components/agri/nutri-tools/SprayDriftAssessor';
import { DroughtStressIndex } from '@/components/agri/nutri-tools/DroughtStressIndex';
import { PumpEfficiencyCalculator } from '@/components/agri/nutri-tools/PumpEfficiencyCalculator';
import { BeeHiveHoneyCalculator } from '@/components/agri/nutri-tools/BeeHiveHoneyCalculator';
import { CompanionPlantingGuide } from '@/components/agri/nutri-tools/CompanionPlantingGuide';
import { SilageFermentationPredictor } from '@/components/agri/nutri-tools/SilageFermentationPredictor';
import { FrostProtectionCalculator } from '@/components/agri/nutri-tools/FrostProtectionCalculator';
import { BufferStripDesigner } from '@/components/agri/nutri-tools/BufferStripDesigner';
import { HailDamageEstimator } from '@/components/agri/nutri-tools/HailDamageEstimator';
import { PestThresholdCalculator } from '@/components/agri/nutri-tools/PestThresholdCalculator';
import { YieldMonitorCalibrator } from '@/components/agri/nutri-tools/YieldMonitorCalibrator';
import { ManureManagementPlanner } from '@/components/agri/nutri-tools/ManureManagementPlanner';
import { MachineryCostCalculator } from '@/components/agri/nutri-tools/MachineryCostCalculator';
import { MoonPhaseCalendar } from '@/components/agri/nutri-tools/MoonPhaseCalendar';
import { SeedRateCalculator } from '@/components/agri/nutri-tools/SeedRateCalculator';
import { GrainBinInventoryTracker } from '@/components/agri/nutri-tools/GrainBinInventoryTracker';
import { PollinatorHabitatPlanner } from '@/components/agri/nutri-tools/PollinatorHabitatPlanner';
import { GDDTracker } from '@/components/agri/nutri-tools/GDDTracker';
import { WaterHarvestingCalculator } from '@/components/agri/nutri-tools/WaterHarvestingCalculator';
import { BiogasDigesterCalculator } from '@/components/agri/nutri-tools/BiogasDigesterCalculator';
import { BookmarkedFormulas } from '@/components/agri/bookmarked-formulas';
import { getBookmarks, toggleBookmark } from '@/lib/formula-bookmarks';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { TakeTourButton } from '@/components/onboarding/TakeTourButton';
import { TelegramConnectButton } from '@/components/agri/nutri-tools/TelegramConnectButton';
import { NotificationCenter } from '@/components/agri/nutri-tools/NotificationCenter';
import { ApiDocsButton } from '@/components/agri/nutri-tools/ApiDocsButton';
import { WorkflowRunner } from '@/components/agri/workflow-runner';
import { SeasonScheduler } from '@/components/agri/season-scheduler';
import { LanguageToggle } from '@/components/language-toggle';
import { handbook, allFormulas } from '@/lib/formulas-data';
import type { Formula } from '@/lib/types';
import type { Workflow } from '@/lib/workflows';
import { useTranslation } from '@/lib/language-store';
import { cn } from '@/lib/utils';

type TabId = 'home' | 'formulas' | 'tools' | 'farm' | 'insights' | 'about';

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [onlyWithCalculators, setOnlyWithCalculators] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const { t, isRTL } = useTranslation();
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => { setBookmarks(getBookmarks()); }, []);

  // PWA install prompt listener
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setIsInstalled(true); setInstallPromptEvent(null); });
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) setIsInstalled(true);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setInstallPromptEvent(null);
  };

  const filteredFormulas = useMemo(() => {
    let result = allFormulas;
    if (selectedPart) result = result.filter(f => f.part === selectedPart);
    if (selectedChapter !== null) result = result.filter(f => f.chapter_number === selectedChapter && f.part === selectedPart);
    if (onlyWithCalculators) result = result.filter(f => hasCalculator(f.code));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const terms = q.split(/\s+/).filter(Boolean);
      result = result.filter(f => {
        const haystack = `${f.code} ${f.name} ${(f as any).name_ar || ''} ${f.formula} ${f.variables} ${f.purpose} ${f.example} ${f.pitfall} ${f.chapter} ${f.part}`.toLowerCase();
        return terms.every(t => haystack.includes(t));
      });
    }
    return result;
  }, [searchQuery, selectedPart, selectedChapter, onlyWithCalculators]);

  const handleSelectFormula = (formula: Formula) => {
    setSelectedFormula(formula);
    setDialogOpen(true);
  };

  const handleClearFilters = () => {
    setSelectedPart(null);
    setSelectedChapter(null);
    setOnlyWithCalculators(false);
    setSearchQuery('');
  };

  const hasActiveFilters = selectedPart || selectedChapter !== null || onlyWithCalculators || searchQuery;

  const currentChapterInfo = useMemo(() => {
    if (selectedChapter !== null && selectedPart) {
      const part = handbook.parts.find(p => p.title === selectedPart);
      return part?.chapters.find(c => c.number === selectedChapter);
    }
    return null;
  }, [selectedPart, selectedChapter]);

  const sidebarContent = (
    <SidebarNav
      selectedPart={selectedPart}
      selectedChapter={selectedChapter}
      onlyWithCalculators={onlyWithCalculators}
      onSelectPart={setSelectedPart}
      onSelectChapter={setSelectedChapter}
      onToggleCalculatorFilter={() => setOnlyWithCalculators(!onlyWithCalculators)}
      searchQuery={searchQuery}
    />
  );

  /** Open a tool by switching tab + auto-opening its CollapsibleSection. */
  const openTool = (tab: TabId, storageKey?: string) => {
    if (storageKey) {
      try { localStorage.setItem(storageKey, 'true'); } catch { /* ignore */ }
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-700 text-white flex-shrink-0 shadow-sm">
                <Sprout className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold tracking-tight leading-tight truncate">{t.appName}</h1>
                <p className="text-xs text-muted-foreground truncate">{t.appSubtitle} · {handbook.meta.version}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <TakeTourButton />
              <ApiDocsButton />
              <TelegramConnectButton />
              {installPromptEvent && !isInstalled && (
                <Button size="sm" onClick={handleInstall} className="gap-1.5 text-xs h-9 bg-emerald-600 hover:bg-emerald-700" title="Install Formula Atlas as an app">
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Install App</span>
                </Button>
              )}
              {isInstalled && (
                <span className="hidden sm:flex items-center gap-1 text-xs text-emerald-600 px-2" title="App installed">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">Installed</span>
                </span>
              )}
              <LanguageToggle />
              {activeTab === 'formulas' && (
                <div className="lg:hidden">
                  <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2"><Layers className="h-4 w-4" />Browse</Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 gap-0 w-[340px] sm:w-[380px] overflow-hidden">{sidebarContent}</SheetContent>
                  </Sheet>
                </div>
              )}
            </div>
          </div>

          {/* Command palette trigger — visible on all tabs */}
          <div className="hidden sm:block">
            <CommandPaletteTrigger onClick={() => setPaletteOpen(true)} />
          </div>

          {/* Search bar — only on formulas tab */}
          {activeTab === 'formulas' && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input type="search" placeholder={t.searchPlaceholder} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-10 h-10 text-sm" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="border-t border-border bg-muted/30">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-1 overflow-x-auto">
              <TabButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={Home} label="Home" />
              <TabButton active={activeTab === 'formulas'} onClick={() => setActiveTab('formulas')} icon={BookOpen} label="Formulas" badge={allFormulas.length} />
              <TabButton active={activeTab === 'tools'} onClick={() => setActiveTab('tools')} icon={Wrench} label="Tools" />
              <TabButton active={activeTab === 'farm'} onClick={() => setActiveTab('farm')} icon={Tractor} label="Farm" />
              <TabButton active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} icon={Sparkles} label="Insights" />
              <TabButton active={activeTab === 'about'} onClick={() => setActiveTab('about')} icon={Users} label="About" />
            </div>
          </div>
        </div>
      </header>

      {/* HOME TAB — personalized dashboard */}
      {activeTab === 'home' && (
        <main className="flex-1 max-w-[1200px] mx-auto w-full p-4 sm:p-6 space-y-6 pb-20 sm:pb-6">
          <HomeDashboard
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenTool={(tab, storageKey) => openTool(tab, storageKey)}
            onOpenSearch={() => setPaletteOpen(true)}
          />

          <SeasonScheduler />

          <CollapsibleSection
            title="Achievements & Leaderboard"
            description="Badges · Levels · Points · Global ranking · Progress tracking"
            icon={Trophy}
            color="#7c3aed"
            storageKey="collapse_gamification"
            defaultOpen={false}
          >
            <div className="p-4"><GamificationPanel /></div>
          </CollapsibleSection>

          <UseCasesSection onLaunch={(wf) => { setActiveWorkflow(wf); setWorkflowOpen(true); }} />
        </main>
      )}

      {/* FARM TAB — fields, crops, soil, livestock, irrigation */}
      {activeTab === 'farm' && (
        <main className="flex-1 max-w-[1200px] mx-auto w-full p-4 sm:p-6 space-y-6">
          <div className="rounded-xl p-4 bg-gradient-to-r from-emerald-600 to-green-700 text-white">
            <div className="flex items-center gap-2"><Tractor className="h-5 w-5" /><h2 className="text-lg font-bold">Farm Management</h2></div>
            <p className="text-xs text-emerald-100 mt-1">Fields · Crops · Soil · Livestock · Irrigation — 9 tools</p>
          </div>

          {/* Sub-category: Fields & Crops */}
          <div className="space-y-3">
            <SubHeader emoji="🌱" label="Fields & Crops" />
            <CollapsibleSection title="Multi-Field Dashboard" description="Track every field, crop stage and irrigation demand in one place" icon={Layers} color="#16a34a" storageKey="collapse_multifield" defaultOpen={false}><div className="p-4"><MultiFieldDashboard /></div></CollapsibleSection>
            <CollapsibleSection title="Coordinate Converter" description="DMS ↔ Decimal · UTM ↔ Lat/Lng · Batch CSV conversion (WGS84)" icon={MapPin} color="#6366f1" storageKey="collapse_coords" defaultOpen={false}><div className="p-4"><CoordinateConverter /></div></CollapsibleSection>
            <CollapsibleSection title="Field Boundary Importer" description="Import GeoJSON · KML · WKT · CSV · Area/perimeter/centroid · Convert & export · SVG preview" icon={Shapes} color="#10b981" storageKey="collapse_boundary" defaultOpen={false}><div className="p-4"><FieldBoundaryImporter /></div></CollapsibleSection>
            <CollapsibleSection title="Distance & Bearing Calculator" description="Vincenty geodesic distance · Initial/final bearing · Destination projection · Batch CSV · Field-to-field" icon={Compass} color="#0891b2" storageKey="collapse_distance" defaultOpen={false}><div className="p-4"><DistanceBearingCalculator /></div></CollapsibleSection>
            <CollapsibleSection title="Elevation & Slope Analyzer" description="Open-Meteo elevation API · Point / Path profile / Slope grid · Aspect · Hillshade · Frost risk — no key" icon={Mountain} color="#78716c" storageKey="collapse_elevation" defaultOpen={false}><div className="p-4"><ElevationSlopeAnalyzer /></div></CollapsibleSection>
            <CollapsibleSection title="Crop Rotation Planner" description="Multi-year rotation · N credit tracking · Disease breaks · Cover crops · Soil health score" icon={RefreshCw} color="#16a34a" storageKey="collapse_rotation" defaultOpen={false}><div className="p-4"><CropRotationPlanner /></div></CollapsibleSection>
            <CollapsibleSection title="Season Plan Generator" description="AI-powered week-by-week crop plan · Kc + NPK + irrigation + fertigation + warnings" icon={Sparkles} color="#7c3aed" storageKey="collapse_season_plan" defaultOpen={false}><div className="p-4"><SeasonPlanGeneratorWrapper /></div></CollapsibleSection>
            <CollapsibleSection title="Fertilization Generator" description="Per-crop lifecycle fertilization schedule · NPK + micros · Application methods + sources · 20 crops · PDF export" icon={Flask} color="#16a34a" storageKey="collapse_fertilization" defaultOpen={false}><div className="p-4"><FertilizationGenerator /></div></CollapsibleSection>
            <CollapsibleSection title="Labor Calendar" description="Phenology-driven field operations · Person-days/ha · Peak week detection · Skill levels · 20 crops · PDF export" icon={CalendarDays} color="#0891b2" storageKey="collapse_labor_cal" defaultOpen={false}><div className="p-4"><LaborCalendar /></div></CollapsibleSection>
            <CollapsibleSection title="Yield Gap Analysis" description="Benchmark actual vs potential yield by crop and climate zone" icon={TrendingUp} color="#0891b2" storageKey="collapse_yieldgap" defaultOpen={false}><div className="p-4"><YieldGapAnalysis /></div></CollapsibleSection>
            <CollapsibleSection title="Field Scouting Log" description="Voice + photo field observations with severity tagging" icon={Sprout} color="#84cc16" storageKey="collapse_scouting" defaultOpen={false}><div className="p-4"><FieldScoutingLog /></div></CollapsibleSection>
            <CollapsibleSection title="Pesticide Dose + PHI Calculator" description="AI rate → product rate · Tank mix · Rainfast · Pre-harvest interval countdown · 5 herbicides" icon={FlaskConical} color="#dc2626" storageKey="collapse_pesticide" defaultOpen={false}><div className="p-4"><PesticideDoseCalculator /></div></CollapsibleSection>
            <CollapsibleSection title="Spray Drift Risk Assessor" description="Wind · Delta-T · Droplet size · Boom height → drift score + buffer distance" icon={Wind} color="#0ea5e9" storageKey="collapse_drift" defaultOpen={false}><div className="p-4"><SprayDriftAssessor /></div></CollapsibleSection>
            <CollapsibleSection title="Drought Stress Index" description="ET₀ deficit + soil water depletion + crop stage → stress score + irrigation urgency" icon={Flame} color="#f97316" storageKey="collapse_drought" defaultOpen={false}><div className="p-4"><DroughtStressIndex /></div></CollapsibleSection>
            <CollapsibleSection title="Frost Protection Calculator" description="Radiative vs advective frost · Sprinkler / wind machine / smudge pot sizing" icon={Snowflake} color="#3b82f6" storageKey="collapse_frost" defaultOpen={false}><div className="p-4"><FrostProtectionCalculator /></div></CollapsibleSection>
            <CollapsibleSection title="Companion Planting Guide" description="20 crops · 100+ pairings · synergy (✓) · antagonism (✗) · search any crop" icon={Sprout} color="#84cc16" storageKey="collapse_companion" defaultOpen={false}><div className="p-4"><CompanionPlantingGuide /></div></CollapsibleSection>
            <CollapsibleSection title="Hail Damage Estimator" description="Crop stage × hail size × defoliation → yield loss % · insurance claim guidance" icon={CloudRain} color="#64748b" storageKey="collapse_hail" defaultOpen={false}><div className="p-4"><HailDamageEstimator /></div></CollapsibleSection>
            <CollapsibleSection title="Pest Threshold Calculator" description="EIL · action threshold · sequential sampling — 5 pest types" icon={Bug} color="#dc2626" storageKey="collapse_pest_threshold" defaultOpen={false}><div className="p-4"><PestThresholdCalculator /></div></CollapsibleSection>
            <CollapsibleSection title="Seed Rate Calculator" description="Target population × TGW × germination × field loss → kg seed/ha · 6 crops" icon={Sprout} color="#16a34a" storageKey="collapse_seedrate" defaultOpen={false}><div className="p-4"><SeedRateCalculator /></div></CollapsibleSection>
            <CollapsibleSection title="Moon Phase Planting Calendar" description="Biodynamic calendar · 29.5-day lunar cycle · 30-day forecast" icon={Moon} color="#6366f1" storageKey="collapse_moon" defaultOpen={false}><div className="p-4"><MoonPhaseCalendar /></div></CollapsibleSection>
            <CollapsibleSection title="GDD Tracker (Growing Degree Days)" description="Accumulates thermal time from Open-Meteo · predicts growth stages · 5 crops" icon={Sun} color="#f59e0b" storageKey="collapse_gdd" defaultOpen={false}><div className="p-4"><GDDTracker /></div></CollapsibleSection>
          </div>

          {/* Sub-category: Soil & Livestock */}
          <div className="space-y-3">
            <SubHeader emoji="🧪" label="Soil & Livestock" />
            <CollapsibleSection title="Soil Test History Tracker" description="Multi-year soil test tracking · Trend charts · Amendment recommendations · PDF export" icon={FlaskConical} color="#8b5cf6" storageKey="collapse_soil_history" defaultOpen={false}><div className="p-4"><SoilTestHistoryTracker /></div></CollapsibleSection>
            <CollapsibleSection title="Post-Harvest Storage Calculator" description="EMC (Henderson) · Safe storage days · Drying time + cost · Bin aeration fan sizing — 7 crops" icon={Warehouse} color="#f59e0b" storageKey="collapse_postharvest" defaultOpen={false}><div className="p-4"><PostHarvestStorageCalculator /></div></CollapsibleSection>
            <CollapsibleSection title="Compost Mixer Calculator" description="C:N ratio · Moisture adjustment · 10 common feedstocks · Target 30:1" icon={Recycle} color="#16a34a" storageKey="collapse_compost" defaultOpen={false}><div className="p-4"><CompostMixerCalculator /></div></CollapsibleSection>
            <CollapsibleSection title="Cover Crop Selector" description="12 species · 9 goals · drought tolerance · ranked recommendations" icon={Sprout} color="#84cc16" storageKey="collapse_covercrop" defaultOpen={false}><div className="p-4"><CoverCropSelector /></div></CollapsibleSection>
            <CollapsibleSection title="Greenhouse Climate Designer" description="Heating load · Ventilation rate · CO₂ enrichment sizing · 4 glazing types" icon={Home} color="#10b981" storageKey="collapse_greenhouse" defaultOpen={false}><div className="p-4"><GreenhouseClimateDesigner /></div></CollapsibleSection>
            <CollapsibleSection title="Grain Bin Inventory Tracker" description="Volume × density × price → stored grain value · multi-bin" icon={Warehouse} color="#f59e0b" storageKey="collapse_grainbin" defaultOpen={false}><div className="p-4"><GrainBinInventoryTracker /></div></CollapsibleSection>
            <CollapsibleSection title="Manure Management Planner" description="N-P-K value · application timing · buffer zone compliance · 6 manure types" icon={Droplets} color="#8b5cf6" storageKey="collapse_manure" defaultOpen={false}><div className="p-4"><ManureManagementPlanner /></div></CollapsibleSection>
            <CollapsibleSection title="Machinery Cost Calculator" description="Ownership + operating cost → $/ha + $/hr · buy vs custom hire" icon={Tractor} color="#f59e0b" storageKey="collapse_machinery" defaultOpen={false}><div className="p-4"><MachineryCostCalculator /></div></CollapsibleSection>
            <CollapsibleSection title="Yield Monitor Calibrator" description="Moisture correction · flow calibration · test weight assessment" icon={Gauge} color="#6366f1" storageKey="collapse_yieldmon" defaultOpen={false}><div className="p-4"><YieldMonitorCalibrator /></div></CollapsibleSection>
            <CollapsibleSection title="Livestock Management" description="Feed rations (NRC 2021) · Pasture capacity · Manure NPK value · Rotational grazing" icon={Beef} color="#f59e0b" storageKey="collapse_livestock" defaultOpen={false}><div className="p-4"><LivestockIntegration /></div></CollapsibleSection>
            <CollapsibleSection title="Feed Ration Balancer (NRC 2021)" description="DMI · CP · TDN · Ca · P balancing — 8 ingredients · 4 animal types" icon={Beef} color="#8b5cf6" storageKey="collapse_ration" defaultOpen={false}><div className="p-4"><FeedRationBalancer /></div></CollapsibleSection>
            <CollapsibleSection title="Silage Fermentation Predictor" description="Moisture · sugar · packing density · chop length → fermentation quality score" icon={Beef} color="#f59e0b" storageKey="collapse_silage" defaultOpen={false}><div className="p-4"><SilageFermentationPredictor /></div></CollapsibleSection>
            <CollapsibleSection title="Bee Hive + Honey Yield Calculator" description="Daily weight gain · nectar flow projection · honey yield + revenue" icon={Bug} color="#eab308" storageKey="collapse_beehive" defaultOpen={false}><div className="p-4"><BeeHiveHoneyCalculator /></div></CollapsibleSection>
            <CollapsibleSection title="Water Harvesting Calculator" description="Rooftop rainwater collection · cistern sizing · demand coverage" icon={Droplets} color="#0ea5e9" storageKey="collapse_water_harvest" defaultOpen={false}><div className="p-4"><WaterHarvestingCalculator /></div></CollapsibleSection>
            <CollapsibleSection title="Biogas Digester Calculator" description="Biogas yield · digester sizing · energy + revenue · 5 substrates" icon={Flame} color="#f97316" storageKey="collapse_biogas" defaultOpen={false}><div className="p-4"><BiogasDigesterCalculator /></div></CollapsibleSection>
          </div>

          {/* Sub-category: Irrigation */}
          <div className="space-y-3">
            <SubHeader emoji="💧" label="Irrigation" />
            <CollapsibleSection title="Irrigation Program Generator" description="Decadal (10-day) irrigation schedule from the BRL/COM memento" icon={Droplets} color="#0ea5e9" storageKey="collapse_irrigation" defaultOpen={false}><div className="p-4"><IrrigationProgramGenerator /></div></CollapsibleSection>
            <CollapsibleSection title="Irrigation System Designer" description="Multi-zone sprinkler / drip / bubbler designer with pump sizing" icon={Settings} color="#6366f1" storageKey="collapse_system_design" defaultOpen={false}><div className="p-4"><IrrigationSystemDesigner /></div></CollapsibleSection>
            <CollapsibleSection title="Seasonal Irrigation Planner" description="Season-by-season irrigation focus, risks and recommendations" icon={Calendar} color="#f59e0b" storageKey="collapse_seasonal" defaultOpen={false}><div className="p-4"><SeasonScheduler /></div></CollapsibleSection>
            <CollapsibleSection title="Evapotranspiration Tracker" description="Live ET₀ (Open-Meteo) · FAO-56 Kc × ETc · 7-day irrigation plan · ERA5 history — no API key needed" icon={Sun} color="#0891b2" storageKey="collapse_et_tracker" defaultOpen={false}><div className="p-4"><EvapotranspirationTracker /></div></CollapsibleSection>
            <CollapsibleSection title="Irrigation Scheduler" description="Controllers · Zones · Schedules · Sequences · Cycle-and-soak eco-mode · Weather % adjust · YAML/CSV/JSON export" icon={Clock} color="#0ea5e9" storageKey="collapse_irr_sched" defaultOpen={false}><div className="p-4"><IrrigationScheduler /></div></CollapsibleSection>
          </div>
        </main>
      )}

      {/* INSIGHTS TAB — intelligence, business, community */}
      {activeTab === 'insights' && (
        <main className="flex-1 max-w-[1200px] mx-auto w-full p-4 sm:p-6 space-y-6">
          <div className="rounded-xl p-4 bg-gradient-to-r from-indigo-600 to-violet-700 text-white">
            <div className="flex items-center gap-2"><Sparkles className="h-5 w-5" /><h2 className="text-lg font-bold">Intelligence & Insights</h2></div>
            <p className="text-xs text-indigo-100 mt-1">Satellite · Weather · AI · Financial · Marketplace · Community — 8 tools</p>
          </div>

          {/* Sub-category: Intelligence */}
          <div className="space-y-3">
            <SubHeader emoji="🛰️" label="Intelligence & AI" />
            <CollapsibleSection title="NDVI Satellite Field Maps" description="Vegetation health heatmap · Stress zone detection · AI recommendations · PDF export" icon={Satellite} color="#6366f1" storageKey="collapse_ndvi" defaultOpen={false}><div className="p-4"><NdviFieldMaps /></div></CollapsibleSection>
            <CollapsibleSection title="Weather Radar + Frost Maps" description="Live 7-day forecast · Frost risk · Heat warnings · Spray windows · Microclimate" icon={CloudRain} color="#0ea5e9" storageKey="collapse_weather_radar" defaultOpen={false}><div className="p-4"><WeatherRadar /></div></CollapsibleSection>
            <CollapsibleSection title="Smart Agriculture Suite" description="Disease detection · crop recommendation · fertilizer guidance" icon={Bug} color="#65a30d" storageKey="collapse_agriplanner" defaultOpen={false}><div className="p-4"><AgriPlannerSuite /></div></CollapsibleSection>
            <CollapsibleSection title="Disease Forecast Dashboard" description="5 disease models (Blitecast · TOMCAST · Mills · FHB · Downy mildew) · weather-based spray timing" icon={Bug} color="#dc2626" storageKey="collapse_disease" defaultOpen={false}><div className="p-4"><DiseaseForecastDashboard /></div></CollapsibleSection>
            <CollapsibleSection title="AI Specialists (Multi-Agent Chat)" description="10 specialized AI agents — Agronomist · Crop Scout · Irrigation Engineer · Soil Scientist · Operations Manager · Financial Analyst · Sustainability Officer · Grant Writer · GIS Analyst · Livestock Vet" icon={Sparkles} color="#6366f1" storageKey="collapse_agent_chat" defaultOpen={false}><div className="p-4"><AgriAgentChat /></div></CollapsibleSection>
          </div>

          {/* Sub-category: Business */}
          <div className="space-y-3">
            <SubHeader emoji="💰" label="Business & Marketplace" />
            <CollapsibleSection title="Financial Dashboard" description="Costs · Revenue · Gross margin · Break-even · ROI · What-if scenario analysis" icon={DollarSign} color="#f59e0b" storageKey="collapse_financial" defaultOpen={false}><div className="p-4"><FinancialDashboard /></div></CollapsibleSection>
            <CollapsibleSection title="Marketplace — Buy Fertilizers & Supplies" description="Price comparison from 3 suppliers · Shopping cart · Order export" icon={ShoppingCart} color="#f59e0b" storageKey="collapse_marketplace" defaultOpen={false}><div className="p-4"><Marketplace /></div></CollapsibleSection>
            <CollapsibleSection title="Sustainability Scorecard" description="5 traffic-light metrics — NUE, water, carbon, soil, pesticides" icon={Leaf} color="#16a34a" storageKey="collapse_sustainability" defaultOpen={false}><div className="p-4"><SustainabilityScorecard /></div></CollapsibleSection>
            <CollapsibleSection title="RUSLE Erosion Calculator" description="A = R × K × LS × C × P — universal soil loss equation · 14 regions · 12 soil types" icon={Mountain} color="#78716c" storageKey="collapse_rusle" defaultOpen={false}><div className="p-4"><RUSLEErosionCalculator /></div></CollapsibleSection>
            <CollapsibleSection title="Buffer Strip Designer" description="Width × vegetation → sediment / N / P trapping efficiency · NRCS standards" icon={Shield} color="#14b8a6" storageKey="collapse_buffer" defaultOpen={false}><div className="p-4"><BufferStripDesigner /></div></CollapsibleSection>
            <CollapsibleSection title="Pollinator Habitat Planner" description="10 species · bloom season + pollinator type + goal filtering" icon={Bug} color="#eab308" storageKey="collapse_pollinator" defaultOpen={false}><div className="p-4"><PollinatorHabitatPlanner /></div></CollapsibleSection>
            <CollapsibleSection title="Carbon Credit Estimator" description="IPCC Tier 2 · 6 practices · $/ha revenue · 20% permanence buffer · 10-yr commitment" icon={Leaf} color="#10b981" storageKey="collapse_carbon" defaultOpen={false}><div className="p-4"><CarbonCreditCalculator /></div></CollapsibleSection>
          </div>

          {/* Sub-category: Community & Reports */}
          <div className="space-y-3">
            <SubHeader emoji="👥" label="Community & Reports" />
            <CollapsibleSection title="Farmer Community & Knowledge Exchange" description="Share experiences · Ask questions · Benchmark your farm · Success stories" icon={Users} color="#3b82f6" storageKey="collapse_community" defaultOpen={false}><div className="p-4"><FarmerCommunity /></div></CollapsibleSection>
            <CollapsibleSection title="Professional Report Generator" description="Branded multi-page PDF · Combines all data · Cover page · AI recommendations" icon={FileText} color="#0ea5e9" storageKey="collapse_report" defaultOpen={false}><div className="p-4"><ReportGenerator /></div></CollapsibleSection>
          </div>

          {/* Sub-category: Settings & Integrations */}
          <div className="space-y-3">
            <SubHeader emoji="🔌" label="Settings & Integrations" />
            <CollapsibleSection title="Service Integrations" description="Plug in free-tier services — Clerk auth, Neon Postgres, OneSignal push, MapTiler maps, Gemini AI" icon={Settings} color="#64748b" storageKey="collapse_integrations" defaultOpen={false}><div className="p-4"><ServiceIntegrations /></div></CollapsibleSection>
          </div>
        </main>
      )}

      {/* FORMULAS TAB */}
      {activeTab === 'formulas' && (
        <div className="flex-1 max-w-[1600px] mx-auto w-full flex">
          <aside className="hidden lg:block w-[300px] flex-shrink-0 border-r border-border bg-background sticky top-[160px] h-[calc(100vh-160px)] overflow-hidden">{sidebarContent}</aside>
          <main className="flex-1 min-w-0 p-4 sm:p-6">
            <BookmarkedFormulas
              bookmarks={bookmarks}
              formulas={allFormulas}
              onSelect={handleSelectFormula}
              onRemove={(code) => { toggleBookmark(code); setBookmarks(prev => prev.filter(c => c !== code)); }}
            />
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h2 className="text-lg font-semibold">{selectedChapter !== null && currentChapterInfo ? `Section ${currentChapterInfo.number}: ${currentChapterInfo.title}` : selectedPart ? selectedPart : t.allFormulas}</h2>
                <Badge variant="secondary" className="font-mono">{filteredFormulas.length} of {allFormulas.length}</Badge>
              </div>
              {hasActiveFilters && <Button variant="outline" size="sm" onClick={handleClearFilters} className="gap-1.5 text-xs"><X className="h-3.5 w-3.5" />Clear</Button>}
            </div>

            {hasActiveFilters && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground" />
                {selectedPart && <Badge variant="outline" className="gap-1.5">Part: {selectedPart}<button onClick={() => { setSelectedPart(null); setSelectedChapter(null); }}><X className="h-3 w-3" /></button></Badge>}
                {selectedChapter !== null && <Badge variant="outline" className="gap-1.5">Section: {selectedChapter}<button onClick={() => setSelectedChapter(null)}><X className="h-3 w-3" /></button></Badge>}
                {onlyWithCalculators && <Badge variant="outline" className="gap-1.5">Calculator only<button onClick={() => setOnlyWithCalculators(false)}><X className="h-3 w-3" /></button></Badge>}
                {searchQuery && <Badge variant="outline" className="gap-1.5">&quot;{searchQuery}&quot;<button onClick={() => setSearchQuery('')}><X className="h-3 w-3" /></button></Badge>}
              </div>
            )}

            {currentChapterInfo?.intro && <div className="bg-card border border-border rounded-lg p-4 mb-5"><p className="text-sm text-muted-foreground leading-relaxed">{currentChapterInfo.intro}</p></div>}

            {filteredFormulas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted p-4 mb-3"><Search className="h-8 w-8 text-muted-foreground" /></div>
                <h3 className="text-lg font-semibold mb-1">No formulas match</h3>
                <Button onClick={handleClearFilters} variant="outline" size="sm" className="mt-2">Clear filters</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredFormulas.map(formula => <FormulaCard key={`${formula.code}-${formula.part}`} formula={formula} onSelect={handleSelectFormula} />)}
              </div>
            )}
          </main>
        </div>
      )}

      {/* TOOLS TAB */}
      {activeTab === 'tools' && (
        <main className="flex-1 max-w-[1400px] mx-auto w-full p-4 sm:p-6 space-y-6">
          <FreeToolsSection />
          <div className="rounded-xl border-2 border-dashed border-border bg-card/50 p-8 text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 mx-auto mb-3">
              <Wrench className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold mb-1">Guided Workflows</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Step-by-step calculators that solve common farm tasks. Pick a goal and walk through it.
            </p>
          </div>
          <UseCasesSection onLaunch={(wf) => { setActiveWorkflow(wf); setWorkflowOpen(true); }} />
        </main>
      )}

      {/* ABOUT TAB — founder profile + mission */}
      {activeTab === 'about' && (
        <AboutPage />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Sprout className="h-4 w-4 text-emerald-600" /><span>{t.appName} · {handbook.meta.version}</span></div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Landing Page</Link>
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <span>{handbook.meta.total_formulas} formulas · {handbook.meta.total_parts} parts · {handbook.meta.total_chapters} sections</span>
          </div>
        </div>
      </footer>

      {/* Dialogs */}
      <FormulaDetailDialog formula={selectedFormula} open={dialogOpen} onOpenChange={setDialogOpen} />
      <WorkflowRunner workflow={activeWorkflow} open={workflowOpen} onOpenChange={setWorkflowOpen} />

      {/* AI Agronomist Assistant — floating chat, available on all tabs */}
      <AgronomistAssistant />

      {/* Field Data Capture — floating scan button, available on all tabs */}
      <FieldDataCapture />

      {/* Predictive Alerts — floating bell button, available on all tabs */}
      <NotificationCenter />

      {/* Command Palette — Cmd+K global search, available on all tabs */}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onSelect={(entry) => openTool(entry.tab, entry.storageKey)}
      />

      {/* Mobile bottom tab bar — thumb-friendly navigation on phones */}
      <MobileBottomNav activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} onSearch={() => setPaletteOpen(true)} />

      {/* Onboarding flow — auto-shows on first visit, replayable via header Tour button */}
      <OnboardingFlow />
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label, badge }: { active: boolean; onClick: () => void; icon: typeof Home; label: string; badge?: number }) {
  return (
    <button onClick={onClick} className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px', active ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border')}>
      <Icon className="h-4 w-4" />
      {label}
      {badge !== undefined && <span className={cn('text-[10px] font-mono font-bold px-1.5 py-0.5 rounded', active ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' : 'bg-muted text-muted-foreground')}>{badge}</span>}
    </button>
  );
}

function StatBadge({ icon: Icon, label, value }: { icon: typeof Layers; label: string; value: number }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-lg px-3 py-2 border border-white/20">
      <div className="flex items-center gap-1.5 text-emerald-100 text-[10px] uppercase tracking-wide font-medium"><Icon className="h-3 w-3" />{label}</div>
      <div className="text-xl font-bold mt-0.5">{value}</div>
    </div>
  );
}

/**
 * Mobile bottom tab bar — thumb-friendly navigation for phones.
 * Hidden on sm+ screens (the header tab bar takes over).
 * Includes a center search button (⌘K) for one-thumb access.
 */
function MobileBottomNav({ activeTab, onTabChange, onSearch }: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onSearch: () => void;
}) {
  const tabs: { id: TabId; icon: typeof Home; label: string }[] = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'farm', icon: Tractor, label: 'Farm' },
    { id: 'insights', icon: Sparkles, label: 'Insights' },
    { id: 'formulas', icon: BookOpen, label: 'Formulas' },
  ];
  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur-md safe-area-pb">
      <div className="grid grid-cols-5 items-center h-14">
        {tabs.slice(0, 2).map(t => (
          <MobileTabButton key={t.id} active={activeTab === t.id} icon={t.icon} label={t.label} onClick={() => onTabChange(t.id)} />
        ))}
        {/* Center search button */}
        <button
          onClick={onSearch}
          className="flex flex-col items-center justify-center -mt-4 mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-green-700 text-white shadow-lg active:scale-95 transition-transform"
          title="Search (⌘K)"
        >
          <Search className="h-5 w-5" />
        </button>
        {tabs.slice(2).map(t => (
          <MobileTabButton key={t.id} active={activeTab === t.id} icon={t.icon} label={t.label} onClick={() => onTabChange(t.id)} />
        ))}
      </div>
    </nav>
  );
}

function MobileTabButton({ active, icon: Icon, label, onClick }: {
  active: boolean; icon: typeof Home; label: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 h-full text-[9px] font-medium transition-colors ${
        active ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
      }`}
    >
      <Icon className={`h-5 w-5 ${active ? 'scale-110' : ''} transition-transform`} />
      <span>{label}</span>
    </button>
  );
}

function QuickNav({ icon: Icon, label, desc, color, onClick }: { icon: typeof Home; label: string; desc: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group flex items-center gap-3 p-4 rounded-xl border-2 border-border bg-card hover:border-emerald-400 hover:shadow-md hover:-translate-y-0.5 transition-all text-left">
      <div className="flex items-center justify-center h-10 w-10 rounded-lg flex-shrink-0" style={{ background: `${color}20`, color }}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{label}</div>
        <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{desc}</div>
      </div>
    </button>
  );
}

/**
 * Wrapper for the Season Plan Generator modal — exposes a button inside a
 * CollapsibleSection so users can find it without going through the
 * FreeToolsSection's "Pro feature" card.
 */
function SeasonPlanGeneratorWrapper() {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      <div className="rounded-lg border-2 border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-50/60 to-green-50/40 dark:from-emerald-950/20 dark:to-green-950/10 p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">AI Season Plan Generator</h4>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
              Generates a complete week-by-week crop plan from your inputs — Kc curve, NPK dose per week, irrigation schedule, fertigation recipe, growth-stage notes, and warnings (frost/heat/water stress). Powered by the LLM via the <code className="text-[10px]">/api/season-plan</code> route.
            </p>
            <Button size="sm" onClick={() => setOpen(true)} className="mt-2 gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Open Season Plan Generator
            </Button>
          </div>
        </div>
      </div>
      <SeasonPlanGenerator open={open} onOpenChange={setOpen} />
    </div>
  );
}

function SubHeader({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <span className="text-lg">{emoji}</span>
      <span className="text-sm font-bold text-muted-foreground uppercase tracking-wide">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
