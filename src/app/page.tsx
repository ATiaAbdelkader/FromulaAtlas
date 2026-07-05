'use client';

import { useMemo, useState, useEffect } from 'react';
import { Search, Sprout, Layers, BookOpen, Calculator, X, Leaf, Filter, Home, Wrench, Bug, TrendingUp, Droplets, Settings, Calendar, Satellite, ShoppingCart, Users, DollarSign, RefreshCw, Beef, FlaskConical } from 'lucide-react';
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
import { BookmarkedFormulas } from '@/components/agri/bookmarked-formulas';
import { getBookmarks, toggleBookmark } from '@/lib/formula-bookmarks';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { TakeTourButton } from '@/components/onboarding/TakeTourButton';
import { TelegramConnectButton } from '@/components/agri/nutri-tools/TelegramConnectButton';
import { NotificationCenter } from '@/components/agri/nutri-tools/NotificationCenter';
import { WorkflowRunner } from '@/components/agri/workflow-runner';
import { SeasonScheduler } from '@/components/agri/season-scheduler';
import { LanguageToggle } from '@/components/language-toggle';
import { handbook, allFormulas } from '@/lib/formulas-data';
import type { Formula } from '@/lib/types';
import type { Workflow } from '@/lib/workflows';
import { useTranslation } from '@/lib/language-store';
import { cn } from '@/lib/utils';

type TabId = 'home' | 'formulas' | 'tools';

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [searchQuery, setSearchQuery] = useState('');
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

  useEffect(() => { setBookmarks(getBookmarks()); }, []);

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
              <TelegramConnectButton />
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
            <div className="flex items-center gap-1">
              <TabButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={Home} label="Home" />
              <TabButton active={activeTab === 'formulas'} onClick={() => setActiveTab('formulas')} icon={BookOpen} label="Formulas" badge={allFormulas.length} />
              <TabButton active={activeTab === 'tools'} onClick={() => setActiveTab('tools')} icon={Wrench} label="Tools" />
            </div>
          </div>
        </div>
      </header>

      {/* HOME TAB */}
      {activeTab === 'home' && (
        <main className="flex-1 max-w-[1200px] mx-auto w-full p-4 sm:p-6">
          <section className="bg-gradient-to-br from-emerald-700 via-green-700 to-teal-800 text-white rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-2 text-emerald-100 text-sm font-medium uppercase tracking-wide"><Leaf className="h-4 w-4" />Calculations · Indices · Decision Rules</div>
            <h2 className="text-xl sm:text-2xl font-bold leading-tight mb-2">The complete reference for crop &amp; animal production</h2>
            <div className="flex flex-wrap gap-3 mt-4">
              <StatBadge icon={Layers} label="Parts" value={handbook.meta.total_parts} />
              <StatBadge icon={BookOpen} label={t.sections} value={handbook.meta.total_chapters} />
              <StatBadge icon={Calculator} label={t.formulas} value={handbook.meta.total_formulas} />
              <StatBadge icon={Sprout} label="Calculators" value={allFormulas.filter(f => hasCalculator(f.code)).length} />
            </div>
          </section>

          {/* Collapsible feature sections */}
          <section className="mb-6 space-y-3">
            <CollapsibleSection
              title="NDVI Satellite Field Maps"
              description="Vegetation health heatmap · Stress zone detection · AI recommendations · PDF export"
              icon={Satellite}
              color="#6366f1"
              storageKey="collapse_ndvi"
              defaultOpen={false}
            >
              <div className="p-4"><NdviFieldMaps /></div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Marketplace — Buy Fertilizers & Supplies"
              description="Price comparison from 3 suppliers · Shopping cart · Order export"
              icon={ShoppingCart}
              color="#f59e0b"
              storageKey="collapse_marketplace"
              defaultOpen={false}
            >
              <div className="p-4"><Marketplace /></div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Farmer Community & Knowledge Exchange"
              description="Share experiences · Ask questions · Benchmark your farm · Success stories"
              icon={Users}
              color="#3b82f6"
              storageKey="collapse_community"
              defaultOpen={false}
            >
              <div className="p-4"><FarmerCommunity /></div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Financial Dashboard"
              description="Costs · Revenue · Gross margin · Break-even · ROI · What-if scenario analysis"
              icon={DollarSign}
              color="#f59e0b"
              storageKey="collapse_financial"
              defaultOpen={false}
            >
              <div className="p-4"><FinancialDashboard /></div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Crop Rotation Planner"
              description="Multi-year rotation · N credit tracking · Disease breaks · Cover crops · Soil health score"
              icon={RefreshCw}
              color="#16a34a"
              storageKey="collapse_rotation"
              defaultOpen={false}
            >
              <div className="p-4"><CropRotationPlanner /></div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Livestock Management"
              description="Feed rations (NRC 2021) · Pasture capacity · Manure NPK value · Rotational grazing"
              icon={Beef}
              color="#f59e0b"
              storageKey="collapse_livestock"
              defaultOpen={false}
            >
              <div className="p-4"><LivestockIntegration /></div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Soil Test History Tracker"
              description="Multi-year soil test tracking · Trend charts · Amendment recommendations · PDF export"
              icon={FlaskConical}
              color="#8b5cf6"
              storageKey="collapse_soil_history"
              defaultOpen={false}
            >
              <div className="p-4"><SoilTestHistoryTracker /></div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Smart Agriculture Suite"
              description="Disease detection · crop recommendation · fertilizer guidance"
              icon={Bug}
              color="#65a30d"
              storageKey="collapse_agriplanner"
              defaultOpen={false}
            >
              <div className="p-4"><AgriPlannerSuite /></div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Multi-Field Dashboard"
              description="Track every field, crop stage and irrigation demand in one place"
              icon={Layers}
              color="#16a34a"
              storageKey="collapse_multifield"
              defaultOpen={false}
            >
              <div className="p-4"><MultiFieldDashboard /></div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Yield Gap Analysis"
              description="Benchmark actual vs potential yield by crop and climate zone"
              icon={TrendingUp}
              color="#0891b2"
              storageKey="collapse_yieldgap"
              defaultOpen={false}
            >
              <div className="p-4"><YieldGapAnalysis /></div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Sustainability Scorecard"
              description="5 traffic-light metrics — NUE, water, carbon, soil, pesticides"
              icon={Leaf}
              color="#16a34a"
              storageKey="collapse_sustainability"
              defaultOpen={false}
            >
              <div className="p-4"><SustainabilityScorecard /></div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Irrigation Program Generator"
              description="Decadal (10-day) irrigation schedule from the BRL/COM memento"
              icon={Droplets}
              color="#0ea5e9"
              storageKey="collapse_irrigation"
              defaultOpen={false}
            >
              <div className="p-4"><IrrigationProgramGenerator /></div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Irrigation System Designer"
              description="Multi-zone sprinkler / drip / bubbler designer with pump sizing"
              icon={Settings}
              color="#6366f1"
              storageKey="collapse_system_design"
              defaultOpen={false}
            >
              <div className="p-4"><IrrigationSystemDesigner /></div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Field Scouting Log"
              description="Voice + photo field observations with severity tagging"
              icon={Sprout}
              color="#84cc16"
              storageKey="collapse_scouting"
              defaultOpen={false}
            >
              <div className="p-4"><FieldScoutingLog /></div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Seasonal Irrigation Planner"
              description="Season-by-season irrigation focus, risks and recommendations"
              icon={Calendar}
              color="#f59e0b"
              storageKey="collapse_seasonal"
              defaultOpen={false}
            >
              <div className="p-4"><SeasonScheduler /></div>
            </CollapsibleSection>
          </section>

          <UseCasesSection onLaunch={(wf) => { setActiveWorkflow(wf); setWorkflowOpen(true); }} />
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

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Sprout className="h-4 w-4 text-emerald-600" /><span>{t.appName} · {handbook.meta.version}</span></div>
          <div className="text-xs text-muted-foreground">{handbook.meta.total_formulas} formulas · {handbook.meta.total_parts} parts · {handbook.meta.total_chapters} sections</div>
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
