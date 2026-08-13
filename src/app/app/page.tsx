'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect, useRef } from 'react';
import { Search, Sprout, Layers, BookOpen, Calculator, X, Leaf, Filter, Home, Wrench, Bug, TrendingUp, Droplets, Settings, Calendar, Satellite, ShoppingCart, Users, DollarSign, RefreshCw, Beef, FlaskConical, CloudRain, FileText, Trophy, Tractor, Sparkles, Download, Database, CheckCircle2, MapPin, Shapes, Compass, Sun, Mountain, FlaskConical as Flask, CalendarDays, Clock, Warehouse, Recycle, Wind, Flame, Snowflake, Gauge, Shield, Moon, Microscope, Activity } from 'lucide-react';
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
import { FieldWorkbench } from '@/components/agri/nutri-tools/FieldWorkbench';
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
import { NutrientBudgetPlanner } from '@/components/agri/nutri-tools/NutrientBudgetPlanner';
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
import { DiseaseReferenceGallery } from '@/components/agri/nutri-tools/DiseaseReferenceGallery';
import { YieldEstimationCalculator } from '@/components/agri/nutri-tools/YieldEstimationCalculator';
import { SoilColorIdentifier } from '@/components/agri/nutri-tools/SoilColorIdentifier';
import { LivestockGrowthBenchmark } from '@/components/agri/nutri-tools/LivestockGrowthBenchmark';
import { CropCalendarGenerator } from '@/components/agri/nutri-tools/CropCalendarGenerator';
import { SoilTextureTriangle } from '@/components/agri/nutri-tools/SoilTextureTriangle';
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
import { ActiveMatterSelector } from '@/components/agri/active-matter-selector/ActiveMatterSelector';
import { handbook, allFormulas } from '@/lib/formulas-data';
import type { Formula } from '@/lib/types';
import type { Workflow } from '@/lib/workflows';
import { useTranslation, type Language } from '@/lib/language-store';
import { cn } from '@/lib/utils';
import { FormulaExplorer } from '@/components/agri/formula-explorer';
import { MobileFieldCaptureButton } from '@/components/agri/mobile-field-capture';
import { FieldModeButton } from '@/components/agri/field-mode';
import { DataExportDialog } from '@/components/agri/data-export-dialog';
import { WorkspacePanel } from '@/components/agri/workspace-panel';

type TabId = 'home' | 'formulas' | 'tools' | 'farm' | 'insights' | 'about';

/** French labels for the app shell's farm and insights tool index. */
const FRENCH_TOOL_COPY: Record<string, string> = {
  'Multi-Field Dashboard': 'Tableau multi-parcelles',
  'Track every field, crop stage and irrigation demand in one place': 'Suivez chaque parcelle, stade de culture et besoin d’irrigation au même endroit',
  'Field Workbench': 'Poste de travail parcellaire',
  'One field view: soil health, irrigation demand, scouting follow-ups and 4R nutrient milestones': 'Vue d’une parcelle : santé du sol, besoin d’irrigation, suivis de prospection et jalons nutritionnels 4R',
  'Coordinate Converter': 'Convertisseur de coordonnées',
  'Field Boundary Importer': 'Importateur de limites de parcelle',
  'Distance & Bearing Calculator': 'Calculateur de distance et de relèvement',
  'Elevation & Slope Analyzer': 'Analyseur d’altitude et de pente',
  'Crop Rotation Planner': 'Planificateur de rotation des cultures',
  'Season Plan Generator': 'Générateur de plan de saison',
  'Fertilization Generator': 'Générateur de fertilisation',
  'Labor Calendar': 'Calendrier de la main-d’œuvre',
  'Yield Gap Analysis': 'Analyse de l’écart de rendement',
  'Yield Estimation Calculator': 'Calculateur d’estimation du rendement',
  'Companion Planting Guide': 'Guide des associations de cultures',
  'Seed Rate Calculator': 'Calculateur de dose de semis',
  'Crop Calendar Generator': 'Générateur de calendrier cultural',
  'Field Scouting Log': 'Journal de prospection au champ',
  'Pest Threshold Calculator': 'Calculateur de seuil des ravageurs',
  'Pesticide Dose + PHI Calculator': 'Calculateur de dose de pesticide et DAR',
  'Spray Drift Risk Assessor': 'Évaluateur du risque de dérive',
  'Disease Forecast Dashboard': 'Tableau de prévision des maladies',
  'Drought Stress Index': 'Indice de stress hydrique',
  'Frost Protection Calculator': 'Calculateur de protection contre le gel',
  'Hail Damage Estimator': 'Estimateur des dégâts de grêle',
  'Disease & Weed Reference Gallery': 'Galerie de référence des maladies et adventices',
  'Active Matter Selector (Algérie)': 'Sélecteur de matières actives (Algérie)',
  'Soil Test History Tracker': 'Suivi historique des analyses de sol',
  'Soil Color Identifier': 'Identificateur de couleur du sol',
  'Soil Texture Triangle': 'Triangle de texture du sol',
  'Post-Harvest Storage Calculator': 'Calculateur de stockage post-récolte',
  'Compost Mixer Calculator': 'Calculateur de mélange de compost',
  'Cover Crop Selector': 'Sélecteur de cultures de couverture',
  'Greenhouse Climate Designer': 'Concepteur du climat de serre',
  'Grain Bin Inventory Tracker': 'Suivi de stock des silos à grains',
  'Manure Management Planner': 'Planificateur de gestion des effluents',
  'Machinery Cost Calculator': 'Calculateur du coût des machines',
  'Yield Monitor Calibrator': 'Calibrateur de moniteur de rendement',
  'Livestock Management': 'Gestion de l’élevage',
  'Feed Ration Balancer (NRC 2021)': 'Équilibreur de ration (NRC 2021)',
  'Livestock Growth Benchmarks': 'Références de croissance de l’élevage',
  'Silage Fermentation Predictor': 'Prédicteur de fermentation de l’ensilage',
  'Bee Hive + Honey Yield Calculator': 'Calculateur de ruche et de rendement en miel',
  'Water Harvesting Calculator': 'Calculateur de récupération d’eau',
  'Biogas Digester Calculator': 'Calculateur de digesteur de biogaz',
  'Irrigation Program Generator': 'Générateur de programme d’irrigation',
  'Irrigation System Designer': 'Concepteur de système d’irrigation',
  'Seasonal Irrigation Planner': 'Planificateur d’irrigation saisonnière',
  'Evapotranspiration Tracker': 'Suivi de l’évapotranspiration',
  'Irrigation Scheduler': 'Planificateur d’irrigation',
  'NDVI Satellite Field Maps': 'Cartes NDVI des parcelles par satellite',
  'Weather Radar + Frost Maps': 'Radar météo et cartes du gel',
  'Smart Agriculture Suite': 'Suite d’agriculture intelligente',
  'AI Specialists (Multi-Agent Chat)': 'Spécialistes IA (chat multi-agents)',
  'Financial Dashboard': 'Tableau de bord financier',
  'Marketplace — Buy Fertilizers & Supplies': 'Marché — acheter engrais et fournitures',
  'Sustainability Scorecard': 'Tableau de bord de durabilité',
  'RUSLE Erosion Calculator': 'Calculateur d’érosion RUSLE',
  'Buffer Strip Designer': 'Concepteur de bandes tampons',
  'Pollinator Habitat Planner': 'Planificateur d’habitat pour pollinisateurs',
  'Carbon Credit Estimator': 'Estimateur de crédits carbone',
  'Farmer Community & Knowledge Exchange': 'Communauté agricole et échange de connaissances',
  'Professional Report Generator': 'Générateur de rapports professionnels',
  'Service Integrations': 'Intégrations de services',
  'Disease detection · crop recommendation · fertilizer guidance': 'Détection des maladies · recommandation de cultures · conseil de fertilisation',
  'Vegetation health heatmap · Stress zone detection · AI recommendations · PDF export': 'Carte thermique de la santé végétale · détection des zones de stress · recommandations IA · export PDF',
  'Live 7-day forecast · Frost risk · Heat warnings · Spray windows · Microclimate': 'Prévisions en direct à 7 jours · risque de gel · alertes de chaleur · fenêtres de traitement · microclimat',
  'Costs · Revenue · Gross margin · Break-even · ROI · What-if scenario analysis': 'Coûts · revenus · marge brute · seuil de rentabilité · ROI · analyse de scénarios',
  'Price comparison from 3 suppliers · Shopping cart · Order export': 'Comparaison de prix auprès de 3 fournisseurs · panier · export des commandes',
  'Share experiences · Ask questions · Benchmark your farm · Success stories': 'Partagez vos expériences · posez vos questions · comparez votre ferme · récits de réussite',
  'Branded multi-page PDF · Combines all data · Cover page · AI recommendations': 'PDF multipage aux couleurs de votre marque · regroupe toutes les données · page de couverture · recommandations IA',
  'Decadal (10-day) irrigation schedule from the BRL/COM memento': 'Programme d’irrigation décadaire (10 jours) issu du mémento BRL/COM',
  'Multi-zone sprinkler / drip / bubbler designer with pump sizing': 'Concepteur multi-zones par aspersion, goutte-à-goutte ou barboteur avec dimensionnement de pompe',
  'Season-by-season irrigation focus, risks and recommendations': 'Priorités, risques et recommandations d’irrigation par saison',
  'Live ET₀ (Open-Meteo) · FAO-56 Kc × ETc · 7-day irrigation plan · ERA5 history — no API key needed': 'ET₀ en direct (Open-Meteo) · FAO-56 Kc × ETc · plan d’irrigation à 7 jours · historique ERA5 — sans clé API',
};

/**
 * Inline translator for tool titles and descriptions.
 * French uses the curated overlay and safely falls back to English for any
 * domain string not yet translated; Arabic keeps its existing source copy.
 */
function tr(en: string, ar: string, language: Language): string {
  if (language === 'ar') return ar;
  if (language === 'fr') return FRENCH_TOOL_COPY[en] ?? en;
  return en;
}

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
  const { t, isRTL, language } = useTranslation();
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);

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
              <FieldModeButton />
              <MobileFieldCaptureButton />
              <Button variant="outline" size="sm" onClick={() => setBackupOpen(true)} className="gap-1.5 h-9" title="Backup & Restore">
                <Database className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Backup</span>
              </Button>
              {installPromptEvent && !isInstalled && (
                <Button size="sm" onClick={handleInstall} className="gap-1.5 text-xs h-9 bg-emerald-600 hover:bg-emerald-700" title={t.installApp}>
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t.installApp}</span>
                </Button>
              )}
              {isInstalled && (
                <span className="hidden sm:flex items-center gap-1 text-xs text-emerald-600 px-2" title={t.installed}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">{t.installed}</span>
                </span>
              )}
              <LanguageToggle />
              {activeTab === 'formulas' && (
                <div className="lg:hidden">
                  <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2"><Layers className="h-4 w-4" />{t.browse}</Button>
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
              <TabButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={Home} label={t.tabHome} />
              <TabButton active={activeTab === 'formulas'} onClick={() => setActiveTab('formulas')} icon={BookOpen} label={t.tabFormulas} badge={allFormulas.length} />
              <TabButton active={activeTab === 'tools'} onClick={() => setActiveTab('tools')} icon={Wrench} label={t.tabTools} />
              <TabButton active={activeTab === 'farm'} onClick={() => setActiveTab('farm')} icon={Tractor} label={t.tabFarm} />
              <TabButton active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} icon={Sparkles} label={t.tabInsights} />
              <TabButton active={activeTab === 'about'} onClick={() => setActiveTab('about')} icon={Users} label={t.tabAbout} />
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
            title={t.achievements}
            description={t.achievementsDesc}
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
            <div className="flex items-center gap-2"><Tractor className="h-5 w-5" /><h2 className="text-lg font-bold">{t.farmManagement}</h2></div>
            <p className="text-xs text-emerald-100 mt-1">{t.farmManagementSubtitle}</p>
          </div>

          <WorkspacePanel />

          {/* Sub-category: Fields & Crops */}
          <div className="space-y-3">
            <SubHeader emoji="🌱" label={t.fieldsAndCrops} />
            <CollapsibleSection title={tr('Multi-Field Dashboard', 'لوحة الحقول المتعددة', language)} description={tr('Track every field, crop stage and irrigation demand in one place', 'تابع كل حقل ومرحلة محصول وطلب ري في مكان واحد', language)} icon={Layers} color="#16a34a" storageKey="collapse_multifield" defaultOpen={false} enableExport><div className="p-4"><MultiFieldDashboard /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Coordinate Converter', 'محوّل الإحداثيات', language)} description={tr('DMS ↔ Decimal · UTM ↔ Lat/Lng · Batch CSV conversion (WGS84)', 'DMS ↔ عشري · UTM ↔ خط عرض/طول · تحويل دفعة CSV (WGS84)', language)} icon={MapPin} color="#6366f1" storageKey="collapse_coords" defaultOpen={false} enableExport><div className="p-4"><CoordinateConverter /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Field Boundary Importer', 'مستورد حدود الحقل', language)} description={tr('Import GeoJSON · KML · WKT · CSV · Area/perimeter/centroid · Convert & export · SVG preview', 'استيراد GeoJSON · KML · WKT · CSV · مساحة/محيط/مركز · تحويل وتصدير · معاينة SVG', language)} icon={Shapes} color="#10b981" storageKey="collapse_boundary" defaultOpen={false} enableExport><div className="p-4"><FieldBoundaryImporter /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Distance & Bearing Calculator', 'حاسبة المسافة والاتجاه', language)} description={tr('Vincenty geodesic distance · Initial/final bearing · Destination projection · Batch CSV · Field-to-field', 'مسافة جيوديسية فينسنتي · اتجاه أولي/نهائي · إسقاط الوجهة · دفعة CSV · بين الحقول', language)} icon={Compass} color="#0891b2" storageKey="collapse_distance" defaultOpen={false} enableExport><div className="p-4"><DistanceBearingCalculator /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Elevation & Slope Analyzer', 'محلّل الارتفاع والانحدار', language)} description={tr('Open-Meteo elevation API · Point / Path profile / Slope grid · Aspect · Hillshade · Frost risk — no key', 'واجهة Open-Meteo للارتفاع · نقطة / ملف المسار / شبكة الانحدار · اتجاه الانحدار · ظل التضاريس · خطر الصقيع — بدون مفتاح', language)} icon={Mountain} color="#78716c" storageKey="collapse_elevation" defaultOpen={false} enableExport><div className="p-4"><ElevationSlopeAnalyzer /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Crop Rotation Planner', 'مخطّط دورة المحاصيل', language)} description={tr('Multi-year rotation · N credit tracking · Disease breaks · Cover crops · Soil health score', 'دورة متعددة السنين · تتبع رصيد النيتروجين · كسر الأمراض · محاصيل التغطية · درجة صحة التربة', language)} icon={RefreshCw} color="#16a34a" storageKey="collapse_rotation" defaultOpen={false} enableExport><div className="p-4"><CropRotationPlanner /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Season Plan Generator', 'مولّد خطة الموسم', language)} description={tr('AI-powered week-by-week crop plan · Kc + NPK + irrigation + fertigation + warnings', 'خطة محصول أسبوعية بالذكاء الاصطناعي · Kc + NPK + ري + تسميد بالري + تحذيرات', language)} icon={Sparkles} color="#7c3aed" storageKey="collapse_season_plan" defaultOpen={false} enableExport><div className="p-4"><SeasonPlanGeneratorWrapper /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Fertilization Generator', 'مولّد التسميد', language)} description={tr('Per-crop lifecycle fertilization schedule · NPK + micros · Application methods + sources · 20 crops · PDF export', 'جدول تسميد لكل دورة حياة محصول · NPK + عناصر صغرى · طرق التطبيق + المصادر · 20 محصول · تصدير PDF', language)} icon={Flask} color="#16a34a" storageKey="collapse_fertilization" defaultOpen={false} enableExport><div className="p-4"><FertilizationGenerator /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Field Workbench', 'لوحة عمل الحقل', language)} description={tr('One field view: soil health, irrigation demand, scouting follow-ups and 4R nutrient milestones', 'عرض حقل واحد: صحة التربة واحتياج الري ومتابعات الكشف ومحطات المغذيات 4R', language)} icon={Activity} color="#0f766e" storageKey="collapse_field_workbench" defaultOpen={false} enableExport><div className="p-4"><FieldWorkbench /></div></CollapsibleSection>
            <CollapsibleSection title={tr('4R Nutrient Budget Planner', 'مخطّط ميزانية المغذيات 4R', language)} description={tr('Field-specific nutrient budget · soil and organic-source credits · staged applications · source, rate, time and place checks · printable plan', 'ميزانية مغذيات خاصة بالحقل · ائتمانات التربة والمصدر العضوي · تطبيقات مرحلية · فحص المصدر والمعدل والتوقيت والمكان · خطة قابلة للطباعة', language)} icon={FlaskConical} color="#059669" storageKey="collapse_nutrient_budget" defaultOpen={false} enableExport><div className="p-4"><NutrientBudgetPlanner /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Labor Calendar', 'تقويم العمالة', language)} description={tr('Phenology-driven field operations · Person-days/ha · Peak week detection · Skill levels · 20 crops · PDF export', 'عمليات حقلية مدفوعة بالفينولوجيا · أيام-شخص/هكتار · كشف ذروة الأسابيع · مستويات المهارة · 20 محصول · تصدير PDF', language)} icon={CalendarDays} color="#0891b2" storageKey="collapse_labor_cal" defaultOpen={false} enableExport><div className="p-4"><LaborCalendar /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Yield Gap Analysis', 'تحليل فجوة الإنتاج', language)} description={tr('Benchmark actual vs potential yield by crop and climate zone', 'قياس الإنتاج الفعلي مقابل المحتمل حسب المحصول والمنطقة المناخية', language)} icon={TrendingUp} color="#0891b2" storageKey="collapse_yieldgap" defaultOpen={false} enableExport><div className="p-4"><YieldGapAnalysis /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Yield Estimation Calculator', 'حاسبة تقدير الإنتاج', language)} description={tr('Heads/m² × kernels/head × kernel weight → yield (t/ha) — 6 crops · reference: GWHD dataset', 'سنابل/م² × حبوب/سنبلة × وزن الحبة → إنتاج (طن/هكتار) — 6 محاصيل · مرجع: مجموعة GWHD', language)} icon={TrendingUp} color="#0891b2" storageKey="collapse_yieldest" defaultOpen={false} enableExport><div className="p-4"><YieldEstimationCalculator /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Companion Planting Guide', 'دليل الزراعة المرافقة', language)} description={tr('20 crops · 100+ pairings · synergy (✓) · antagonism (✗) · search any crop', '20 محصول · أكثر من 100 اقتران · تآزر (✓) · تضاد (✗) · بحث في أي محصول', language)} icon={Sprout} color="#84cc16" storageKey="collapse_companion" defaultOpen={false} enableExport><div className="p-4"><CompanionPlantingGuide /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Seed Rate Calculator', 'حاسبة معدل البذور', language)} description={tr('Target population × TGW × germination × field loss → kg seed/ha · 6 crops', 'الكثافة المستهدفة × وزن 1000 حبة × الإنبات × الفقد الحقلي → كغ بذور/هكتار · 6 محاصيل', language)} icon={Sprout} color="#16a34a" storageKey="collapse_seedrate" defaultOpen={false} enableExport><div className="p-4"><SeedRateCalculator /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Moon Phase Planting Calendar', 'تقويم الزراعة بأطوار القمر', language)} description={tr('Biodynamic calendar · 29.5-day lunar cycle · 30-day forecast', 'تقويم حيوي ديناميكي · دورة قمرية 29.5 يوم · توقعات 30 يوم', language)} icon={Moon} color="#6366f1" storageKey="collapse_moon" defaultOpen={false} enableExport><div className="p-4"><MoonPhaseCalendar /></div></CollapsibleSection>
            <CollapsibleSection title={tr('GDD Tracker (Growing Degree Days)', 'متعقّب درجات النمو الحرارية (GDD)', language)} description={tr('Accumulates thermal time from Open-Meteo · predicts growth stages · 5 crops', 'يجمع الوقت الحراري من Open-Meteo · يتنبأ بمراحل النمو · 5 محاصيل', language)} icon={Sun} color="#f59e0b" storageKey="collapse_gdd" defaultOpen={false} enableExport><div className="p-4"><GDDTracker /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Crop Calendar Generator', 'مولّد تقويم المحصول', language)} description={tr('One-click complete farm calendar: planting + fertilization + irrigation + pest control + labor · 20 crops · editable · PDF export', 'تقويم مزرعة كامل بنقرة واحدة: زراعة + تسميد + ري + مكافحة آفات + عمالة · 20 محصول · قابل للتعديل · تصدير PDF', language)} icon={CalendarDays} color="#16a34a" storageKey="crop_calendar_gen" defaultOpen={false} enableExport><div className="p-4"><CropCalendarGenerator /></div></CollapsibleSection>
          </div>

          {/* Sub-category: Plant Protection */}
          <div className="space-y-3">
            <SubHeader emoji="🛡️" label={t.plantProtection} />
            <CollapsibleSection title={tr('Field Scouting Log', 'سجل الكشف الحقلي', language)} description={tr('Voice + photo field observations with severity tagging', 'ملاحظات حقلية بالصوت والصورة مع وسم درجة الخطورة', language)} icon={Sprout} color="#84cc16" storageKey="collapse_scouting" defaultOpen={false} enableExport><div className="p-4"><FieldScoutingLog /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Pest Threshold Calculator', 'حاسبة عتبة الآفات', language)} description={tr('EIL · action threshold · sequential sampling — 5 pest types', 'عتبة الإضرار الاقتصادي · عتبة التدخل · أخذ عينات تسلسلي — 5 أنواع آفات', language)} icon={Bug} color="#dc2626" storageKey="collapse_pest_threshold" defaultOpen={false} enableExport><div className="p-4"><PestThresholdCalculator /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Pesticide Dose + PHI Calculator', 'حاسبة جرعة المبيد + فترة ما قبل الحصاد', language)} description={tr('AI rate → product rate · Tank mix · Rainfast · Pre-harvest interval countdown · 5 herbicides', 'معدل المادة الفعالة → معدل المنتج · خلط الخزّان · مقاومة المطر · عدّ فترة ما قبل الحصاد · 5 مبيدات أعشاب', language)} icon={FlaskConical} color="#dc2626" storageKey="collapse_pesticide" defaultOpen={false} enableExport><div className="p-4"><PesticideDoseCalculator /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Spray Drift Risk Assessor', 'مقيّم خطر انجراف الرش', language)} description={tr('Wind · Delta-T · Droplet size · Boom height → drift score + buffer distance', 'الرياح · دلتا-T · حجم القطرة · ارتفاع الذراع → درجة الانجراف + مسافة الحاجز', language)} icon={Wind} color="#0ea5e9" storageKey="collapse_drift" defaultOpen={false} enableExport><div className="p-4"><SprayDriftAssessor /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Disease Forecast Dashboard', 'لوحة تنبؤ الأمراض', language)} description={tr('5 disease models (Blitecast · TOMCAST · Mills · FHB · Downy mildew) · weather-based spray timing', '5 نماذج أمراض (Blitecast · TOMCAST · Mills · FHB · البياض الزغبي) · توقيت الرش حسب الطقس', language)} icon={Bug} color="#dc2626" storageKey="collapse_disease" defaultOpen={false} enableExport><div className="p-4"><DiseaseForecastDashboard /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Drought Stress Index', 'مؤشر إجهاد الجفاف', language)} description={tr('ET₀ deficit + soil water depletion + crop stage → stress score + irrigation urgency', 'عجز ET₀ + استنزاف ماء التربة + مرحلة المحصول → درجة الإجهاد + إلحاح الري', language)} icon={Flame} color="#f97316" storageKey="collapse_drought" defaultOpen={false} enableExport><div className="p-4"><DroughtStressIndex /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Frost Protection Calculator', 'حاسبة الحماية من الصقيع', language)} description={tr('Radiative vs advective frost · Sprinkler / wind machine / smudge pot sizing', 'صقيع إشعاعي vs تيارات · تحديد حجم الرشاش / ماكينة الرياح / الأوعية الدخانية', language)} icon={Snowflake} color="#3b82f6" storageKey="collapse_frost" defaultOpen={false} enableExport><div className="p-4"><FrostProtectionCalculator /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Hail Damage Estimator', 'مقدّر أضرار البرَد', language)} description={tr('Crop stage × hail size × defoliation → yield loss % · insurance claim guidance', 'مرحلة المحصول × حجم البرَد × تساقط الأوراق → نسبة فقد الإنتاج · إرشادات مطالبة التأمين', language)} icon={CloudRain} color="#64748b" storageKey="collapse_hail" defaultOpen={false} enableExport><div className="p-4"><HailDamageEstimator /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Disease & Weed Reference Gallery', 'معرض أمراض وأعشاب مرجعي', language)} description={tr('Curated from PlantVillage (50K images) · PlantDoc · DeepWeeds · 35+ research datasets', 'منظم من PlantVillage (50 ألف صورة) · PlantDoc · DeepWeeds · أكثر من 35 مجموعة بحثية', language)} icon={Microscope} color="#8b5cf6" storageKey="collapse_disease_ref" defaultOpen={false} enableExport><div className="p-4"><DiseaseReferenceGallery /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Active Matter Selector (Algérie)', 'منتقي المادة الفعالة (الجزائر)', language)} description={tr('Decide which active ingredient to use against diseases, pests and weeds — crop-based advisor · INPV 2017 catalogue · symptom search · ranked recommendations with confidence, doses, DAR and restrictions', 'قرّر المادة الفعالة المناسبة ضد الأمراض والآفات والأعشاب — مستشار حسب المحصول · فهرس INPV 2017 · بحث بالأعراض · توصيات مرتّبة بدرجة الثقة والجرعات ومدة ما قبل الحصاد والقيود', language)} icon={Bug} color="#65a30d" storageKey="collapse_active_matter" defaultOpen={false} enableExport><div className="p-4"><ActiveMatterSelector /></div></CollapsibleSection>
          </div>

          {/* Sub-category: Soil & Livestock */}
          <div className="space-y-3">
            <SubHeader emoji="🧪" label={t.soilAndLivestock} />
            <CollapsibleSection title={tr('Soil Test History Tracker', 'متعقّب سجل تحاليل التربة', language)} description={tr('Multi-year soil test tracking · Trend charts · Amendment recommendations · PDF export', 'تتبع تحاليل التربة لسنوات متعددة · رسوم بيانية للاتجاه · توصيات التعديل · تصدير PDF', language)} icon={FlaskConical} color="#8b5cf6" storageKey="collapse_soil_history" defaultOpen={false} enableExport><div className="p-4"><SoilTestHistoryTracker /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Soil Color Identifier', 'معرّف لون التربة', language)} description={tr('Munsell color → mineral + drainage + iron status · US state soils · 13 minerals · 50 states', 'لون مونسيل → المعادن + الصرف + حالة الحديد · تربة الولايات المتحدة · 13 معدناً · 50 ولاية', language)} icon={Mountain} color="#78716c" storageKey="collapse_soil_color" defaultOpen={false} enableExport><div className="p-4"><SoilColorIdentifier /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Soil Texture Triangle', 'مثلث نسجة التربة', language)} description={tr('Interactive ternary diagram · USDA/SSEW/International classification · soil properties + management recommendations', 'مخطط ثلاثي تفاعلي · تصنيف USDA/SSEW/الدولي · خصائص التربة + توصيات الإدارة', language)} icon={Mountain} color="#78716c" storageKey="collapse_soil_texture" defaultOpen={false} enableExport><div className="p-4"><SoilTextureTriangle /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Post-Harvest Storage Calculator', 'حاسبة التخزين بعد الحصاد', language)} description={tr('EMC (Henderson) · Safe storage days · Drying time + cost · Bin aeration fan sizing — 7 crops', 'محتوى الرطوبة التوازني (هندرسون) · أيام التخزين الآمن · وقت التجفيف + التكلفة · حجم مروحة التهوية — 7 محاصيل', language)} icon={Warehouse} color="#f59e0b" storageKey="collapse_postharvest" defaultOpen={false} enableExport><div className="p-4"><PostHarvestStorageCalculator /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Compost Mixer Calculator', 'حاسبة خلط الكمبوست', language)} description={tr('C:N ratio · Moisture adjustment · 10 common feedstocks · Target 30:1', 'نسبة C:N · ضبط الرطوبة · 10 مواد شائعة · الهدف 30:1', language)} icon={Recycle} color="#16a34a" storageKey="collapse_compost" defaultOpen={false} enableExport><div className="p-4"><CompostMixerCalculator /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Cover Crop Selector', 'منتقي المحاصيل المغطّية', language)} description={tr('12 species · 9 goals · drought tolerance · ranked recommendations', '12 نوعاً · 9 أهداف · تحمّل الجفاف · توصيات مرتّبة', language)} icon={Sprout} color="#84cc16" storageKey="collapse_covercrop" defaultOpen={false} enableExport><div className="p-4"><CoverCropSelector /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Greenhouse Climate Designer', 'مصمّم مناخ البيوت المحمية', language)} description={tr('Heating load · Ventilation rate · CO₂ enrichment sizing · 4 glazing types', 'حمل التدفئة · معدل التهوية · تحديد إثراء CO₂ · 4 أنواع تغطية', language)} icon={Home} color="#10b981" storageKey="collapse_greenhouse" defaultOpen={false} enableExport><div className="p-4"><GreenhouseClimateDesigner /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Grain Bin Inventory Tracker', 'متعقّب مخزون صوامع الحبوب', language)} description={tr('Volume × density × price → stored grain value · multi-bin', 'الحجم × الكثافة × السعر → قيمة الحبوب المخزّنة · صوامع متعددة', language)} icon={Warehouse} color="#f59e0b" storageKey="collapse_grainbin" defaultOpen={false} enableExport><div className="p-4"><GrainBinInventoryTracker /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Manure Management Planner', 'مخطّط إدارة السماد العضوي', language)} description={tr('N-P-K value · application timing · buffer zone compliance · 6 manure types', 'قيمة N-P-K · توقيت التطبيق · الامتثال لمنطقة الحاجز · 6 أنواع سماد', language)} icon={Droplets} color="#8b5cf6" storageKey="collapse_manure" defaultOpen={false} enableExport><div className="p-4"><ManureManagementPlanner /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Machinery Cost Calculator', 'حاسبة تكلفة الآلات', language)} description={tr('Ownership + operating cost → $/ha + $/hr · buy vs custom hire', 'تكلفة الملكية + التشغيل → $/هكتار + $/ساعة · شراء مقابل استئجار', language)} icon={Tractor} color="#f59e0b" storageKey="collapse_machinery" defaultOpen={false} enableExport><div className="p-4"><MachineryCostCalculator /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Yield Monitor Calibrator', 'معاير مراقب الإنتاج', language)} description={tr('Moisture correction · flow calibration · test weight assessment', 'تصحيح الرطوبة · معايرة التدفق · تقييم وزن الاختبار', language)} icon={Gauge} color="#6366f1" storageKey="collapse_yieldmon" defaultOpen={false} enableExport><div className="p-4"><YieldMonitorCalibrator /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Livestock Management', 'إدارة الماشية', language)} description={tr('Feed rations (NRC 2021) · Pasture capacity · Manure NPK value · Rotational grazing', 'علائق التغذية (NRC 2021) · سعة المرعى · قيمة السماد NPK · الرعي الدوراني', language)} icon={Beef} color="#f59e0b" storageKey="collapse_livestock" defaultOpen={false} enableExport><div className="p-4"><LivestockIntegration /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Feed Ration Balancer (NRC 2021)', 'موازن العليقة (NRC 2021)', language)} description={tr('DMI · CP · TDN · Ca · P balancing — 8 ingredients · 4 animal types', 'DMI · CP · TDN · Ca · P موازنة — 8 مكونات · 4 أنواع حيوانات', language)} icon={Beef} color="#8b5cf6" storageKey="collapse_ration" defaultOpen={false} enableExport><div className="p-4"><FeedRationBalancer /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Livestock Growth Benchmarks', 'معايير نمو الماشية', language)} description={tr('Real trial data: broiler + pig + cattle · compare your animals to reference curves', 'بيانات تجارب حقيقية: دجاج لاحم + خنازير + أبقار · قارن حيواناتك بمنحنيات مرجعية', language)} icon={Beef} color="#f59e0b" storageKey="collapse_livestock_bench" defaultOpen={false} enableExport><div className="p-4"><LivestockGrowthBenchmark /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Silage Fermentation Predictor', 'متوقّع تخمير السيلاج', language)} description={tr('Moisture · sugar · packing density · chop length → fermentation quality score', 'الرطوبة · السكر · كثافة الحزم · طول التقطيع → درجة جودة التخمير', language)} icon={Beef} color="#f59e0b" storageKey="collapse_silage" defaultOpen={false} enableExport><div className="p-4"><SilageFermentationPredictor /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Bee Hive + Honey Yield Calculator', 'حاسبة خلية النحل + إنتاج العسل', language)} description={tr('Daily weight gain · nectar flow projection · honey yield + revenue', 'زيادة الوزن اليومية · توقعات تدفق الرحيق · إنتاج العسل + الإيرادات', language)} icon={Bug} color="#eab308" storageKey="collapse_beehive" defaultOpen={false} enableExport><div className="p-4"><BeeHiveHoneyCalculator /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Water Harvesting Calculator', 'حاسبة حصاد المياه', language)} description={tr('Rooftop rainwater collection · cistern sizing · demand coverage', 'جمع مياه الأمطار من السطوح · تحديد حجم الخزّان · تغطية الطلب', language)} icon={Droplets} color="#0ea5e9" storageKey="collapse_water_harvest" defaultOpen={false} enableExport><div className="p-4"><WaterHarvestingCalculator /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Biogas Digester Calculator', 'حاسبة هاضم الغاز الحيوي', language)} description={tr('Biogas yield · digester sizing · energy + revenue · 5 substrates', 'إنتاج الغاز الحيوي · حجم الهاضم · الطاقة + الإيرادات · 5 ركائز', language)} icon={Flame} color="#f97316" storageKey="collapse_biogas" defaultOpen={false} enableExport><div className="p-4"><BiogasDigesterCalculator /></div></CollapsibleSection>
          </div>

          {/* Sub-category: Irrigation */}
          <div className="space-y-3">
            <SubHeader emoji="💧" label={t.irrigation} />
            <CollapsibleSection title={tr('Irrigation Program Generator', 'مولّد برنامج الري', language)} description={tr('Decadal (10-day) irrigation schedule from the BRL/COM memento', 'جدول ري عشري (10 أيام) من مذكرة BRL/COM', language)} icon={Droplets} color="#0ea5e9" storageKey="collapse_irrigation" defaultOpen={false} enableExport><div className="p-4"><IrrigationProgramGenerator /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Irrigation System Designer', 'مصمّم نظام الري', language)} description={tr('Multi-zone sprinkler / drip / bubbler designer with pump sizing', 'مصمّم متعدد المناطق للرش / التنقيط / الفقّاعات مع تحديد المضخة', language)} icon={Settings} color="#6366f1" storageKey="collapse_system_design" defaultOpen={false} enableExport><div className="p-4"><IrrigationSystemDesigner /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Seasonal Irrigation Planner', 'مخطّط الري الموسمي', language)} description={tr('Season-by-season irrigation focus, risks and recommendations', 'تركيز ري حسب كل موسم، مخاطر وتوصيات', language)} icon={Calendar} color="#f59e0b" storageKey="collapse_seasonal" defaultOpen={false} enableExport><div className="p-4"><SeasonScheduler /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Evapotranspiration Tracker', 'متعقّب التبخّر النتحي', language)} description={tr('Live ET₀ (Open-Meteo) · FAO-56 Kc × ETc · 7-day irrigation plan · ERA5 history — no API key needed', 'ET₀ مباشر (Open-Meteo) · FAO-56 Kc × ETc · خطة ري 7 أيام · سجل ERA5 — بدون مفتاح API', language)} icon={Sun} color="#0891b2" storageKey="collapse_et_tracker" defaultOpen={false} enableExport><div className="p-4"><EvapotranspirationTracker /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Irrigation Scheduler', 'مجدول الري', language)} description={tr('Controllers · Zones · Schedules · Sequences · Cycle-and-soak eco-mode · Weather % adjust · YAML/CSV/JSON export', 'متحكمات · مناطق · جداول · تسلسلات · وضع eco دوري-وتشبّع · ضبط % حسب الطقس · تصدير YAML/CSV/JSON', language)} icon={Clock} color="#0ea5e9" storageKey="collapse_irr_sched" defaultOpen={false} enableExport><div className="p-4"><IrrigationScheduler /></div></CollapsibleSection>
          </div>
        </main>
      )}

      {/* INSIGHTS TAB — intelligence, business, community */}
      {activeTab === 'insights' && (
        <main className="flex-1 max-w-[1200px] mx-auto w-full p-4 sm:p-6 space-y-6">
          <div className="rounded-xl p-4 bg-gradient-to-r from-indigo-600 to-violet-700 text-white">
            <div className="flex items-center gap-2"><Sparkles className="h-5 w-5" /><h2 className="text-lg font-bold">{t.intelligenceAndInsights}</h2></div>
            <p className="text-xs text-indigo-100 mt-1">{t.intelligenceAndInsightsSubtitle}</p>
          </div>

          {/* Sub-category: Intelligence */}
          <div className="space-y-3">
            <SubHeader emoji="🛰️" label={t.intelligenceAndAI} />
            <CollapsibleSection title={tr('NDVI Satellite Field Maps', 'خرائط الحقول بالأقمار الصناعية NDVI', language)} description={tr('Vegetation health heatmap · Stress zone detection · AI recommendations · PDF export', 'خريطة حرارية لصحة الغطاء النباتي · كشف مناطق الإجهاد · توصيات بالذكاء الاصطناعي · تصدير PDF', language)} icon={Satellite} color="#6366f1" storageKey="collapse_ndvi" defaultOpen={false} enableExport><div className="p-4"><NdviFieldMaps /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Weather Radar + Frost Maps', 'رادار الطقس + خرائط الصقيع', language)} description={tr('Live 7-day forecast · Frost risk · Heat warnings · Spray windows · Microclimate', 'توقعات 7 أيام مباشرة · خطر الصقيع · تحذيرات الحرارة · نوافذ الرش · المناخ المحلي', language)} icon={CloudRain} color="#0ea5e9" storageKey="collapse_weather_radar" defaultOpen={false} enableExport><div className="p-4"><WeatherRadar /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Smart Agriculture Suite', 'مجموعة الزراعة الذكية', language)} description={tr('Disease detection · crop recommendation · fertilizer guidance', 'كشف الأمراض · توصية المحاصيل · إرشاد التسميد', language)} icon={Bug} color="#65a30d" storageKey="collapse_agriplanner" defaultOpen={false} enableExport><div className="p-4"><AgriPlannerSuite /></div></CollapsibleSection>
            <CollapsibleSection title={tr('AI Specialists (Multi-Agent Chat)', 'وكلاء الذكاء الاصطناعي (دردشة متعددة الوكلاء)', language)} description={tr('10 specialized AI agents — Agronomist · Crop Scout · Irrigation Engineer · Soil Scientist · Operations Manager · Financial Analyst · Sustainability Officer · Grant Writer · GIS Analyst · Livestock Vet', '10 وكلاء ذكاء تخصصيون — مهندس زراعي · كشّاف المحاصيل · مهندس الري · عالم التربة · مدير العمليات · محلل مالي · مسؤول الاستدامة · كاتب المنح · محلل GIS · طبيب بيطري', language)} icon={Sparkles} color="#6366f1" storageKey="collapse_agent_chat" defaultOpen={false} enableExport><div className="p-4"><AgriAgentChat /></div></CollapsibleSection>
          </div>

          {/* Sub-category: Business */}
          <div className="space-y-3">
            <SubHeader emoji="💰" label={t.businessAndMarketplace} />
            <CollapsibleSection title={tr('Financial Dashboard', 'لوحة المالية', language)} description={tr('Costs · Revenue · Gross margin · Break-even · ROI · What-if scenario analysis', 'التكاليف · الإيرادات · الهامش الإجمالي · نقطة التعادل · العائد على الاستثمار · تحليل سيناريوهات ماذا لو', language)} icon={DollarSign} color="#f59e0b" storageKey="collapse_financial" defaultOpen={false} enableExport><div className="p-4"><FinancialDashboard /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Marketplace — Buy Fertilizers & Supplies', 'السوق — شراء الأسمدة والمستلزمات', language)} description={tr('Price comparison from 3 suppliers · Shopping cart · Order export', 'مقارنة الأسعار من 3 موردين · سلة تسوق · تصدير الطلبات', language)} icon={ShoppingCart} color="#f59e0b" storageKey="collapse_marketplace" defaultOpen={false} enableExport><div className="p-4"><Marketplace /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Sustainability Scorecard', 'بطاقة الاستدامة', language)} description={tr('5 traffic-light metrics — NUE, water, carbon, soil, pesticides', '5 مؤشرات بإشارات مرورية — كفاءة النيتروجين، المياه، الكربون، التربة، المبيدات', language)} icon={Leaf} color="#16a34a" storageKey="collapse_sustainability" defaultOpen={false} enableExport><div className="p-4"><SustainabilityScorecard /></div></CollapsibleSection>
            <CollapsibleSection title={tr('RUSLE Erosion Calculator', 'حاسبة التعرّف RUSLE', language)} description={tr('A = R × K × LS × C × P — universal soil loss equation · 14 regions · 12 soil types', 'A = R × K × LS × C × P — معادلة الفقد العالمي للتربة · 14 منطقة · 12 نوع تربة', language)} icon={Mountain} color="#78716c" storageKey="collapse_rusle" defaultOpen={false} enableExport><div className="p-4"><RUSLEErosionCalculator /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Buffer Strip Designer', 'مصمّم الأحزمة العازلة', language)} description={tr('Width × vegetation → sediment / N / P trapping efficiency · NRCS standards', 'العرض × الغطاء النباتي → كفاءة اصطياد الرواسب / النيتروجين / الفسفور · معايير NRCS', language)} icon={Shield} color="#14b8a6" storageKey="collapse_buffer" defaultOpen={false} enableExport><div className="p-4"><BufferStripDesigner /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Pollinator Habitat Planner', 'مخطّط موائل الملقّحات', language)} description={tr('10 species · bloom season + pollinator type + goal filtering', '10 أنواع · موسم الإزهار + نوع الملقّح + تصفية الأهداف', language)} icon={Bug} color="#eab308" storageKey="collapse_pollinator" defaultOpen={false} enableExport><div className="p-4"><PollinatorHabitatPlanner /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Carbon Credit Estimator', 'مقدّر أرصدة الكربون', language)} description={tr('IPCC Tier 2 · 6 practices · $/ha revenue · 20% permanence buffer · 10-yr commitment', 'IPCC Tier 2 · 6 ممارسات · إيراد $/هكتار · حاجز 20% للديمومة · التزام 10 سنوات', language)} icon={Leaf} color="#10b981" storageKey="collapse_carbon" defaultOpen={false} enableExport><div className="p-4"><CarbonCreditCalculator /></div></CollapsibleSection>
          </div>

          {/* Sub-category: Community & Reports */}
          <div className="space-y-3">
            <SubHeader emoji="👥" label={t.communityAndReports} />
            <CollapsibleSection title={tr('Farmer Community & Knowledge Exchange', 'مجتمع المزارعين وتبادل المعرفة', language)} description={tr('Share experiences · Ask questions · Benchmark your farm · Success stories', 'شارك الخبرات · اطرح الأسئلة · قارن مزرعتك · قصص نجاح', language)} icon={Users} color="#3b82f6" storageKey="collapse_community" defaultOpen={false} enableExport><div className="p-4"><FarmerCommunity /></div></CollapsibleSection>
            <CollapsibleSection title={tr('Professional Report Generator', 'مولّد التقارير الاحترافية', language)} description={tr('Branded multi-page PDF · Combines all data · Cover page · AI recommendations', 'PDF متعدد الصفحات بهوية · يجمع كل البيانات · صفحة غلاف · توصيات بالذكاء الاصطناعي', language)} icon={FileText} color="#0ea5e9" storageKey="collapse_report" defaultOpen={false} enableExport><div className="p-4"><ReportGenerator /></div></CollapsibleSection>
          </div>

          {/* Sub-category: Settings & Integrations */}
          <div className="space-y-3">
            <SubHeader emoji="🔌" label={t.settingsAndIntegrations} />
            <CollapsibleSection title={tr('Service Integrations', 'تكاملات الخدمات', language)} description={tr('Plug in free-tier services — Clerk auth, Neon Postgres, OneSignal push, MapTiler maps, Gemini AI', 'أضف خدمات مجانية — Clerk للمصادقة، Neon Postgres، OneSignal للتنبيهات، MapTiler للخرائط، Gemini AI', language)} icon={Settings} color="#64748b" storageKey="collapse_integrations" defaultOpen={false} enableExport><div className="p-4"><ServiceIntegrations /></div></CollapsibleSection>
          </div>
        </main>
      )}

      {/* FORMULAS TAB — new FormulaExplorer with view toggle */}
      {activeTab === 'formulas' && (
        <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 sm:p-6">
          <FormulaExplorer
            classicSidebar={sidebarContent}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            selectedPart={selectedPart}
            selectedChapter={selectedChapter}
            onlyWithCalculators={onlyWithCalculators}
          />
        </main>
      )}

      {/* TOOLS TAB */}
      {activeTab === 'tools' && (
        <main className="flex-1 max-w-[1400px] mx-auto w-full p-4 sm:p-6 space-y-6">
          <FreeToolsSection />
          <div className="rounded-xl border-2 border-dashed border-border bg-card/50 p-8 text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 mx-auto mb-3">
              <Wrench className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold mb-1">{t.guidedWorkflows}</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              {isRTL
                ? 'حاسبات خطوة بخطوة لحل مهام المزرعة الشائعة. اختر هدفًا وابدأ.'
                : t.guidedWorkflowsDesc}
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
            <Link href="/" className="hover:text-foreground transition-colors">{t.openLanding}</Link>
            <Link href="/about" className="hover:text-foreground transition-colors">{t.aboutLink}</Link>
            <span>{handbook.meta.total_formulas} {t.footerFormulas} · {handbook.meta.total_parts} {t.footerParts} · {handbook.meta.total_chapters} {t.footerSections}</span>
          </div>
        </div>
      </footer>

      {/* Dialogs */}
      <FormulaDetailDialog formula={selectedFormula} open={dialogOpen} onOpenChange={setDialogOpen} />
      <WorkflowRunner workflow={activeWorkflow} open={workflowOpen} onOpenChange={setWorkflowOpen} />
      <DataExportDialog open={backupOpen} onOpenChange={setBackupOpen} />

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
  const { t } = useTranslation();
  const tabs: { id: TabId; icon: typeof Home; label: string }[] = [
    { id: 'home', icon: Home, label: t.tabHome },
    { id: 'farm', icon: Tractor, label: t.tabFarm },
    { id: 'insights', icon: Sparkles, label: t.tabInsights },
    { id: 'formulas', icon: BookOpen, label: t.tabFormulas },
  ];
  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur-md safe-area-pb">
      <div className="grid grid-cols-5 items-center h-14">
        {tabs.slice(0, 2).map(tab => (
          <MobileTabButton key={tab.id} active={activeTab === tab.id} icon={tab.icon} label={tab.label} onClick={() => onTabChange(tab.id)} />
        ))}
        {/* Center search button */}
        <button
          onClick={onSearch}
          className="flex flex-col items-center justify-center -mt-4 mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-green-700 text-white shadow-lg active:scale-95 transition-transform"
          title={`${t.searchTitle} (⌘K)`}
        >
          <Search className="h-5 w-5" />
        </button>
        {tabs.slice(2).map(tab => (
          <MobileTabButton key={tab.id} active={activeTab === tab.id} icon={tab.icon} label={tab.label} onClick={() => onTabChange(tab.id)} />
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
  const { t, isRTL } = useTranslation();
  return (
    <div className="space-y-3">
      <div className="rounded-lg border-2 border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-50/60 to-green-50/40 dark:from-emerald-950/20 dark:to-green-950/10 p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              {isRTL ? 'مولّد خطة الموسم بالذكاء الاصطناعي' : 'AI Season Plan Generator'}
            </h4>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
              {isRTL
                ? 'يولّد خطة محصول أسبوعية كاملة من مدخلاتك — منحنى Kc، جرعة NPK أسبوعياً، جدول الري، وصفة التسميد بالري، ملاحظات مراحل النمو، والتحذيرات (صقيع/حرارة/إجهاد مائي). مدعوم بنموذج اللغة عبر مسار /api/season-plan.'
                : 'Generates a complete week-by-week crop plan from your inputs — Kc curve, NPK dose per week, irrigation schedule, fertigation recipe, growth-stage notes, and warnings (frost/heat/water stress). Powered by the LLM via the /api/season-plan route.'}
            </p>
            <Button size="sm" onClick={() => setOpen(true)} className="mt-2 gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {isRTL ? 'افتح مولّد خطة الموسم' : 'Open Season Plan Generator'}
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
