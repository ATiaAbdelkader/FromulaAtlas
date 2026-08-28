import { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search, X, ArrowRight, Sparkles, BookOpen, Network as GraphIcon,
  Star, Clock, Calculator, Filter, Layers, ChevronRight, Tag, SlidersHorizontal, Check, Zap, HelpCircle
} from 'lucide-react';
import { FormulaCard, hasCalculator } from './formula-card';
import { FormulaDetailDialog } from './formula-detail-dialog';
import { allFormulas, handbook } from '@/lib/formulas-data';
import {
  FORMULA_SCENARIOS, getFormulaScenarios, getScenarioCounts, getPrimaryScenario,
  type FormulaScenario,
} from '@/lib/formula-scenarios';
import { getFormulaOfTheDay } from '@/lib/learning';
import { getBookmarks } from '@/lib/formula-bookmarks';
import { useTranslation, type Language } from '@/lib/language-store';
import { cn } from '@/lib/utils';
import type { Formula } from '@/lib/types';
import { getFormulaMeta, type FormulaDifficulty } from '@/lib/formula-tags';

type LocalizedLabel = { en: string; fr: string; ar: string };

function labelFor(language: Language, labels: LocalizedLabel) {
  return labels[language] || labels.en;
}

function scenarioTitle(language: Language, scenario: FormulaScenario) {
  return language === 'ar' ? scenario.title_ar : language === 'fr' ? scenario.title_fr : scenario.title;
}

function scenarioSubtitle(language: Language, scenario: FormulaScenario) {
  return language === 'ar' ? scenario.subtitle_ar : language === 'fr' ? scenario.subtitle_fr : scenario.subtitle;
}

type ViewMode = 'explorer' | 'classic' | 'graph';
type QuickFilter = 'all' | 'calculator' | 'recent' | 'bookmarked' | 'basic' | 'advanced';

interface FormulaExplorerProps {
  /** The classic sidebar (passed from parent when view = 'classic') */
  classicSidebar?: React.ReactNode;
  /** Search query from parent (shared between views) */
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  /** Selected part from parent (used in classic mode) */
  selectedPart: string | null;
  selectedChapter: number | null;
  onlyWithCalculators: boolean;
}

// Common quick search query suggestions
const POPULAR_SEARCH_TERMS = [
  { term: 'ET0', label: 'ET₀ Evapotranspiration', label_ar: 'التبخر نتح ET₀', icon: '💧' },
  { term: 'NPK', label: 'NPK Fertilization', label_ar: 'تسميد NPK', icon: '🧪' },
  { term: 'pH', label: 'Soil pH & CEC', label_ar: 'حموضة التربة pH و CEC', icon: '🌱' },
  { term: 'GDD', label: 'Growing Degree Days', label_ar: 'درجات النمو GDD', icon: '🌡️' },
  { term: 'Drip', label: 'Drip Irrigation Flow', label_ar: 'ري بالتنقيط', icon: '🚿' },
  { term: 'Yield', label: 'Crop Yield Estimation', label_ar: 'تقدير المردود', icon: '🌾' },
  { term: 'Feed', label: 'Animal Feed & Ration', label_ar: 'تغذية الماشية والعلائق', icon: '🐄' },
  { term: 'Cost', label: 'ROI & Break-even', label_ar: 'العائد والتكاليف الاقتصادية', icon: '💰' },
];

export function FormulaExplorer({
  classicSidebar,
  searchQuery,
  onSearchQueryChange,
  selectedPart,
  selectedChapter,
  onlyWithCalculators,
}: FormulaExplorerProps) {
  const { t, language, isRTL } = useTranslation();
  const [view, setView] = useState<ViewMode>('explorer');
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Bookmarks + recents
  const [bookmarks] = useState<string[]>(() => getBookmarks());
  const recents = useMemo(() => {
    try {
      const raw = localStorage.getItem('nutriplant_recents_v1');
      return raw ? JSON.parse(raw).map((r: any) => r.code || r) : [];
    } catch { return []; }
  }, []);

  // Unique list of all handbook parts/categories for the category filter dropdown
  const allCategories = useMemo(() => {
    const parts = handbook.parts.map(p => p.title);
    return Array.from(new Set(parts));
  }, []);

  // Scenario counts
  const scenarioCounts = useMemo(() => getScenarioCounts(allFormulas), []);

  // Filtered formulas based on active scenario + category dropdown + quick filter + comprehensive search
  const filteredFormulas = useMemo(() => {
    let result = allFormulas;

    // Category dropdown filter
    if (selectedCategory !== 'all') {
      result = result.filter(f => f.part === selectedCategory);
    }

    // Scenario filter
    if (activeScenario) {
      result = result.filter(f => getFormulaScenarios(f).includes(activeScenario));
    }

    // Quick filter
    if (quickFilter === 'calculator') {
      result = result.filter(f => hasCalculator(f.code));
    } else if (quickFilter === 'bookmarked') {
      result = result.filter(f => bookmarks.includes(f.code));
    } else if (quickFilter === 'recent') {
      result = result.filter(f => recents.includes(f.code));
    } else if (quickFilter === 'basic') {
      result = result.filter(f => getFormulaMeta(f).difficulty === 'basic');
    } else if (quickFilter === 'advanced') {
      result = result.filter(f => getFormulaMeta(f).difficulty === 'advanced');
    }

    // Comprehensive Keyword Search
    // Matches formula name, Arabic/French name, code, variables, formula expression, purpose, part, chapter, tags, pitfalls, examples
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const terms = q.split(/\s+/).filter(Boolean);
      result = result.filter(f => {
        const meta = getFormulaMeta(f);
        const tagsStr = meta.tags.join(' ');
        const haystack = `${f.code} ${f.name} ${(f as any).name_ar || ''} ${(f as any).name_fr || ''} ${f.formula} ${f.variables} ${(f as any).variables_ar || ''} ${f.purpose} ${(f as any).purpose_ar || ''} ${f.example || ''} ${f.pitfall || ''} ${f.part} ${f.chapter} ${tagsStr}`.toLowerCase();
        return terms.every(t => haystack.includes(t));
      });
    }

    // Calculator-only toggle (from parent)
    if (onlyWithCalculators) {
      result = result.filter(f => hasCalculator(f.code));
    }

    return result;
  }, [selectedCategory, activeScenario, quickFilter, searchQuery, onlyWithCalculators, bookmarks, recents]);

  const handleSelectFormula = (formula: Formula) => {
    setSelectedFormula(formula);
    setDialogOpen(true);
  };

  const handleApplyTerm = (term: string) => {
    onSearchQueryChange(term);
    searchInputRef.current?.focus();
  };

  const clearAllFilters = () => {
    setActiveScenario(null);
    setSelectedCategory('all');
    setQuickFilter('all');
    onSearchQueryChange('');
  };

  // Quick stats summary
  const totalFormulas = allFormulas.length;
  const matchCount = filteredFormulas.length;

  return (
    <div className="flex-1 min-w-0 space-y-4">
      {/* ======================================================================== */}
      {/* GLOBAL FORMULA SEARCH BAR & FILTER BAR                                   */}
      {/* ======================================================================== */}
      <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-sm space-y-3">
        {/* Top row: View Switcher + Enhanced Search Input + Category Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <ViewToggle view={view} onViewChange={setView} language={language} />

          {/* Search Input with Clear Button */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchInputRef}
              type="search"
              placeholder={
                language === 'ar'
                  ? 'ابحث بالاسم، الرمز (مثال: IRR-01)، المتغيرات (ET0, pH)، الفئة أو الكلمات المفتاحية...'
                  : language === 'fr'
                  ? 'Rechercher par nom, code (ex: IRR-01), variables (ET0, pH), catégorie ou terme...'
                  : 'Search by formula name, code (e.g. IRR-01), variables (ET₀, NPK, pH), category, or terms...'
              }
              value={searchQuery}
              onChange={e => onSearchQueryChange(e.target.value)}
              className="pl-9 pr-10 h-11 text-sm bg-background/80 focus:bg-background border-border/80 focus:ring-2 focus:ring-emerald-500/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchQueryChange('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category Dropdown Selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              aria-label="Filter formulas by category"
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                if (e.target.value !== 'all') setActiveScenario(null);
              }}
              className="h-11 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border border-border bg-background text-foreground hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors max-w-[220px] sm:max-w-[260px] truncate"
              title={labelFor(language, { en: 'Filter by Category', fr: 'Filtrer par catégorie', ar: 'تصفية حسب الفئة' })}
            >
              <option value="all">
                {labelFor(language, { en: '📚 All Categories (44 Parts)', fr: '📚 Toutes les catégories (44)', ar: '📚 كل الفئات والأقسام (44)' })}
              </option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Search Suggestions & Popular Tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs text-muted-foreground scrollbar-none">
          <span className="flex items-center gap-1 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground/80 flex-shrink-0 mr-1">
            <Zap className="h-3 w-3 text-amber-500" />
            {labelFor(language, { en: 'Quick search:', fr: 'Recherche rapide :', ar: 'بحث سريع:' })}
          </span>
          {POPULAR_SEARCH_TERMS.map((item) => {
            const isSelected = searchQuery.toLowerCase().includes(item.term.toLowerCase());
            return (
              <button
                key={item.term}
                type="button"
                onClick={() => handleApplyTerm(isSelected ? '' : item.term)}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all flex-shrink-0',
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-muted/50 border-border/60 hover:bg-muted text-foreground/80 hover:text-foreground'
                )}
              >
                <span>{item.icon}</span>
                <span>{language === 'ar' ? item.label_ar : item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Filter Chips: All, Calculators, Recents, Bookmarks, Basic, Advanced */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-border/50 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground mr-0.5" />
          <QuickFilterChip
            active={quickFilter === 'all' && !activeScenario && selectedCategory === 'all' && !searchQuery}
            onClick={clearAllFilters}
            label={t.allFormulas}
            count={allFormulas.length}
          />
          <QuickFilterChip
            active={quickFilter === 'calculator'}
            onClick={() => { setQuickFilter(quickFilter === 'calculator' ? 'all' : 'calculator'); }}
            label={t.interactiveCalculators}
            count={allFormulas.filter(f => hasCalculator(f.code)).length}
            icon={Calculator}
          />
          <QuickFilterChip
            active={quickFilter === 'recent'}
            onClick={() => { setQuickFilter(quickFilter === 'recent' ? 'all' : 'recent'); }}
            label={labelFor(language, { en: 'Recently Used', fr: 'Utilisés récemment', ar: 'شوهد مؤخراً' })}
            count={recents.length}
            icon={Clock}
          />
          <QuickFilterChip
            active={quickFilter === 'bookmarked'}
            onClick={() => { setQuickFilter(quickFilter === 'bookmarked' ? 'all' : 'bookmarked'); }}
            label={labelFor(language, { en: 'Bookmarked', fr: 'Favoris', ar: 'المفضّلة' })}
            count={bookmarks.length}
            icon={Star}
          />
          <QuickFilterChip
            active={quickFilter === 'basic'}
            onClick={() => { setQuickFilter(quickFilter === 'basic' ? 'all' : 'basic'); }}
            label={labelFor(language, { en: 'Field / Basic', fr: 'Pratique / Base', ar: 'مستوى حقلي / أساسي' })}
            count={allFormulas.filter(f => getFormulaMeta(f).difficulty === 'basic').length}
          />
          <QuickFilterChip
            active={quickFilter === 'advanced'}
            onClick={() => { setQuickFilter(quickFilter === 'advanced' ? 'all' : 'advanced'); }}
            label={labelFor(language, { en: 'Specialist / Advanced', fr: 'Spécialiste / Avancé', ar: 'مستوى متقدم' })}
            count={allFormulas.filter(f => getFormulaMeta(f).difficulty === 'advanced').length}
          />

          {(searchQuery || activeScenario || selectedCategory !== 'all' || quickFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1 ml-auto"
            >
              <X className="h-3 w-3" />
              {labelFor(language, { en: 'Clear filters', fr: 'Effacer filtres', ar: 'مسح الفلاتر' })}
            </Button>
          )}
        </div>
      </div>

      {/* ======================================================================== */}
      {/* ACTIVE SEARCH / FILTER STATUS SUMMARY                                    */}
      {/* ======================================================================== */}
      <div className="flex items-center justify-between gap-3 px-1 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-semibold flex items-center gap-2">
            {searchQuery ? (
              <span>
                {labelFor(language, { en: 'Search results for:', fr: 'Résultats de recherche pour :', ar: 'نتائج البحث عن:' })}{' '}
                <span className="text-emerald-600 font-mono underline">"{searchQuery}"</span>
              </span>
            ) : selectedCategory !== 'all' ? (
              <span>{selectedCategory}</span>
            ) : activeScenario ? (
              <span>
                {(() => {
                  const s = FORMULA_SCENARIOS.find(x => x.id === activeScenario);
                  return s ? `${s.emoji} ${scenarioTitle(language, s)}` : '';
                })()}
              </span>
            ) : (
              <span>{language === 'ar' ? 'أطلس المعادلات الشامل' : t.allFormulas}</span>
            )}
          </h3>
          <Badge variant="secondary" className="font-mono text-xs">
            {matchCount} / {totalFormulas} {labelFor(language, { en: 'formulas', fr: 'formules', ar: 'معادلة' })}
          </Badge>
        </div>

        {/* Active Scenario / Category badges */}
        <div className="flex items-center gap-2">
          {activeScenario && (
            <Badge variant="outline" className="bg-muted/50 gap-1 text-xs">
              <span>Scenario: {activeScenario}</span>
              <button onClick={() => setActiveScenario(null)}><X className="h-3 w-3" /></button>
            </Badge>
          )}
          {selectedCategory !== 'all' && (
            <Badge variant="outline" className="bg-muted/50 gap-1 text-xs max-w-[200px] truncate">
              <span>Category: {selectedCategory}</span>
              <button onClick={() => setSelectedCategory('all')}><X className="h-3 w-3" /></button>
            </Badge>
          )}
        </div>
      </div>

      {/* ======================================================================== */}
      {/* VIEW: EXPLORER                                                           */}
      {/* ======================================================================== */}
      {view === 'explorer' && (
        <>
          {/* Scenario hub — only shown when no specific scenario, category, or search query is active */}
          {!activeScenario && selectedCategory === 'all' && quickFilter === 'all' && !searchQuery && (
            <>
              {/* Formula of the Day hero banner */}
              <FormulaOfDayBanner language={language} onSelect={handleSelectFormula} />

              {/* Mini-stats bar */}
              <MiniStatsBar language={language} bookmarkCount={bookmarks.length} recentCount={recents.length} />

              {/* Recently viewed strip */}
              {recents.length > 0 && (
                <RecentlyViewedStrip language={language} recents={recents} onSelect={handleSelectFormula} />
              )}

              {/* Scenario grid */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                      {labelFor(language, { en: 'Browse by Scenario (8 Hubs)', fr: 'Parcourir par scénario (8 pôles)', ar: 'تصفّح حسب السيناريو الزراعي (8 محاور)' })}
                    </h2>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {FORMULA_SCENARIOS.map(scenario => (
                    <ScenarioCard
                      key={scenario.id}
                      scenario={scenario}
                      count={scenarioCounts[scenario.id] || 0}
                      language={language}
                      onClick={() => {
                        setActiveScenario(scenario.id);
                        setSelectedCategory('all');
                      }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Formula grid results */}
          {filteredFormulas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border bg-card/40 p-8">
              <div className="rounded-full bg-muted p-4 mb-3">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{t.noFormulasMatch}</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-4">
                {language === 'ar'
                  ? 'لم يتم العثور على أي معادلة تطابق معايير البحث. جرب كلمات مفتاحية أخرى أو امسح الفلاتر.'
                  : 'No formulas match your active keywords or category filters. Try searching for broader terms like "water", "NPK", "pH", or "yield".'}
              </p>
              <Button onClick={clearAllFilters} variant="outline" size="sm" className="gap-2">
                <X className="h-3.5 w-3.5" />
                {t.clearFilters}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredFormulas.map(formula => (
                <FormulaCard
                  key={`${formula.code}-${formula.part}`}
                  formula={formula}
                  onSelect={handleSelectFormula}
                  onTagClick={(tag) => onSearchQueryChange(tag)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ======================================================================== */}
      {/* VIEW: CLASSIC                                                            */}
      {/* ======================================================================== */}
      {view === 'classic' && (
        <div className="flex gap-4">
          {classicSidebar && (
            <aside className="hidden lg:block w-[300px] flex-shrink-0 border-r border-border bg-background sticky top-[160px] h-[calc(100vh-160px)] overflow-hidden">
              {classicSidebar}
            </aside>
          )}
          <div className="flex-1 min-w-0">
            {filteredFormulas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border p-8">
                <Search className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-1">{t.noFormulasMatch}</h3>
                <Button onClick={clearAllFilters} variant="outline" size="sm" className="mt-2">
                  {t.clearFilters}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredFormulas.map(formula => (
                  <FormulaCard
                    key={`${formula.code}-${formula.part}`}
                    formula={formula}
                    onSelect={handleSelectFormula}
                    onTagClick={(tag) => onSearchQueryChange(tag)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* VIEW: GRAPH                                                              */}
      {/* ======================================================================== */}
      {view === 'graph' && (
        <GraphViewWrapper />
      )}

      {/* Formula Detail Modal */}
      <FormulaDetailDialog
        formula={selectedFormula}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

// ============================================================================
// View toggle — 3-button switcher (Explorer / Classic / Graph)
// ============================================================================

function ViewToggle({ view, onViewChange, language }: {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  language: Language;
}) {
  const views: { id: ViewMode; label: LocalizedLabel; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'explorer', label: { en: 'Explorer', fr: 'Explorateur', ar: 'المستكشف' }, icon: Sparkles },
    { id: 'classic', label: { en: 'Handbook', fr: 'Manuel', ar: 'الكتيب' }, icon: BookOpen },
    { id: 'graph', label: { en: 'Map', fr: 'Carte', ar: 'الخريطة' }, icon: GraphIcon },
  ];

  return (
    <div className="inline-flex rounded-lg border border-border bg-muted/60 p-0.5 self-start">
      {views.map(v => {
        const Icon = v.icon;
        const active = view === v.id;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onViewChange(v.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
              active
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{labelFor(language, v.label)}</span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Quick filter chip
// ============================================================================

function QuickFilterChip({
  active,
  onClick,
  label,
  count,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border',
        active
          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
          : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted border-transparent',
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      <span>{label}</span>
      <span className={cn('text-[10px] font-mono px-1 rounded', active ? 'bg-emerald-700/60' : 'bg-muted-foreground/15')}>
        {count}
      </span>
    </button>
  );
}

// ============================================================================
// Scenario card — visual entry point for problem-driven browsing
// ============================================================================

function ScenarioCard({
  scenario,
  count,
  language,
  onClick,
}: {
  scenario: FormulaScenario;
  count: number;
  language: Language;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col justify-between p-3.5 rounded-xl border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all text-left overflow-hidden min-h-[110px]"
      style={{ borderLeftWidth: 4, borderLeftColor: scenario.color }}
    >
      <div className="space-y-1 w-full">
        <div className="flex items-center justify-between gap-2">
          <span className="text-2xl">{scenario.emoji}</span>
          <span
            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${scenario.color}15`, color: scenario.color }}
          >
            {count}
          </span>
        </div>
        <div className="font-bold text-sm leading-tight text-foreground group-hover:text-emerald-600 transition-colors">
          {scenarioTitle(language, scenario)}
        </div>
        <div className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
          {scenarioSubtitle(language, scenario)}
        </div>
      </div>
      <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground group-hover:text-emerald-600 transition-colors mt-2">
        <span>{labelFor(language, { en: 'Explore', fr: 'Explorer', ar: 'استكشف' })}</span>
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

// ============================================================================
// Formula of the Day hero banner
// ============================================================================

function FormulaOfDayBanner({
  language,
  onSelect,
}: {
  language: Language;
  onSelect: (f: Formula) => void;
}) {
  const { formula, dayOfYear } = useMemo(() => getFormulaOfTheDay(), []);
  const scenario = useMemo(() => getPrimaryScenario(formula), [formula]);
  const calc = hasCalculator(formula.code);

  const name = language === 'ar' && (formula as any).name_ar ? (formula as any).name_ar : formula.name;
  const purpose = language === 'ar' && (formula as any).purpose_ar ? (formula as any).purpose_ar : formula.purpose;

  return (
    <div
      onClick={() => onSelect(formula)}
      className="group relative mb-4 p-4 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] uppercase font-bold tracking-wide gap-1">
              <Sparkles className="h-3 w-3" />
              {labelFor(language, { en: 'Formula of the Day', fr: 'Formule du jour', ar: 'معادلة اليوم' })}
            </Badge>
            <span className="text-xs font-mono font-bold text-emerald-600">{formula.code}</span>
            {calc && (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <Calculator className="h-2.5 w-2.5" />
                {labelFor(language, { en: 'Calculator', fr: 'Calculateur', ar: 'حاسبة' })}
              </Badge>
            )}
          </div>
          <h3 className="text-base font-bold tracking-tight text-foreground group-hover:text-emerald-600 transition-colors">
            {name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {purpose}
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-end justify-center self-center flex-shrink-0">
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
            <span>{labelFor(language, { en: 'Calculate', fr: 'Calculer', ar: 'احسب الآن' })}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Mini-stats bar — shows quick numbers about the formula library
// ============================================================================

function MiniStatsBar({ language, bookmarkCount, recentCount }: { language: Language; bookmarkCount: number; recentCount: number }) {
  const stats = useMemo(() => {
    const calcCount = allFormulas.filter(f => hasCalculator(f.code)).length;
    const arCount = allFormulas.filter(f => (f as any).name_ar).length;
    const basicCount = allFormulas.filter(f => getFormulaMeta(f).difficulty === 'basic').length;
    const advancedCount = allFormulas.filter(f => getFormulaMeta(f).difficulty === 'advanced').length;
    return { calcCount, arCount, basicCount, advancedCount };
  }, []);

  const items = [
    { label: labelFor(language, { en: 'Formulas', fr: 'Formules', ar: 'معادلة' }), value: allFormulas.length, color: '#16a34a', icon: Layers },
    { label: labelFor(language, { en: 'Calculators', fr: 'Calculateurs', ar: 'حاسبات' }), value: stats.calcCount, color: '#0891b2', icon: Calculator },
    { label: labelFor(language, { en: 'Bilingual', fr: 'Bilingues', ar: 'بالعربية' }), value: stats.arCount, color: '#8b5cf6', icon: BookOpen },
    { label: labelFor(language, { en: 'Bookmarks', fr: 'Favoris', ar: 'مفضّلة' }), value: bookmarkCount, color: '#f59e0b', icon: Star },
    { label: labelFor(language, { en: 'Viewed', fr: 'Consultées', ar: 'شوهدت' }), value: recentCount, color: '#0ea5e9', icon: Clock },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {items.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-card text-xs">
            <Icon className="h-3 w-3" style={{ color: s.color }} />
            <span className="font-bold font-mono" style={{ color: s.color }}>{s.value}</span>
            <span className="text-muted-foreground">{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Recently Viewed strip — horizontal scroll of recently opened formulas
// ============================================================================

function RecentlyViewedStrip({ language, recents, onSelect }: {
  language: Language;
  recents: string[];
  onSelect: (f: Formula) => void;
}) {
  const recentFormulas = useMemo(() => {
    return recents.slice(0, 8)
      .map(code => allFormulas.find(f => f.code === code))
      .filter((f): f is Formula => f !== undefined);
  }, [recents]);

  if (recentFormulas.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
          {labelFor(language, { en: 'Recently Viewed', fr: 'Consultées récemment', ar: 'شوهد مؤخراً' })}
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {recentFormulas.map(f => {
          const scenario = getPrimaryScenario(f);
          const calc = hasCalculator(f.code);
          const name = language === 'ar' && (f as any).name_ar ? (f as any).name_ar : f.name;

          return (
            <button
              key={f.code}
              onClick={() => onSelect(f)}
              className="group flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all"
              style={{ borderLeftWidth: 3, borderLeftColor: scenario.color }}
            >
              {calc && <Calculator className="h-3 w-3 text-emerald-500 flex-shrink-0" />}
              <span className="text-[10px] font-mono font-bold flex-shrink-0" style={{ color: scenario.color }}>{f.code}</span>
              <span className="text-xs font-medium truncate max-w-[140px]">{name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Lazy-loaded FormulaGraph component
function GraphViewWrapper() {
  const [GraphComponent, setGraphComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    import('./formula-graph').then(m => setGraphComponent(() => m.FormulaGraph));
  }, []);

  if (!GraphComponent) {
    return (
      <div className="flex items-center justify-center h-[500px] border rounded-xl bg-card">
        <div className="text-center space-y-2">
          <GraphIcon className="h-8 w-8 animate-pulse text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Loading formula relationship network...</p>
        </div>
      </div>
    );
  }

  return <GraphComponent maxNodes={200} className="w-full h-[600px]" />;
}
