'use client';

/**
 * FormulaExplorer — replaces the textbook-style Part/Chapter sidebar
 * with a problem-driven, visual, multi-view browsing experience.
 *
 * Three views:
 *   1. Explorer (default) — 8 scenario cards → visual formula grid
 *   2. Classic — the original Part/Chapter sidebar (preserved)
 *   3. Graph — formula relationship map (uses FormulaGraph)
 *
 * The Explorer view groups 500 formulas into 8 real-world scenarios
 * ("Manage My Water", "Test My Soil", etc.) instead of 44 academic
 * Parts. Users pick what they want to DO, not what chapter to READ.
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search, X, ArrowRight, Sparkles, BookOpen, Network as GraphIcon,
  Star, Clock, Calculator, Filter, Layers, ChevronRight,
} from 'lucide-react';
import { FormulaCard, hasCalculator } from './formula-card';
import { FormulaDetailDialog } from './formula-detail-dialog';
import { allFormulas } from '@/lib/formulas-data';
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
  return labels[language];
}

function scenarioTitle(language: Language, scenario: FormulaScenario) {
  return language === 'ar' ? scenario.title_ar : language === 'fr' ? scenario.title_fr : scenario.title;
}

function scenarioSubtitle(language: Language, scenario: FormulaScenario) {
  return language === 'ar' ? scenario.subtitle_ar : language === 'fr' ? scenario.subtitle_fr : scenario.subtitle;
}

type ViewMode = 'explorer' | 'classic' | 'graph';
type QuickFilter = 'all' | 'calculator' | 'recent' | 'bookmarked';

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

export function FormulaExplorer({
  classicSidebar,
  searchQuery,
  onSearchQueryChange,
  selectedPart,
  selectedChapter,
  onlyWithCalculators,
}: FormulaExplorerProps) {
  const { t, language } = useTranslation();
  const [view, setView] = useState<ViewMode>('explorer');
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Bookmarks + recents
  const [bookmarks] = useState<string[]>(() => getBookmarks());
  const recents = useMemo(() => {
    try {
      const raw = localStorage.getItem('nutriplant_recents_v1');
      return raw ? JSON.parse(raw).map((r: any) => r.code || r) : [];
    } catch { return []; }
  }, []);

  // Scenario counts
  const scenarioCounts = useMemo(() => getScenarioCounts(allFormulas), []);

  // Filtered formulas based on active scenario + quick filter + search
  const filteredFormulas = useMemo(() => {
    let result = allFormulas;

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
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const terms = q.split(/\s+/).filter(Boolean);
      result = result.filter(f => {
        const haystack = `${f.code} ${f.name} ${(f as any).name_ar || ''} ${f.formula} ${f.variables} ${f.purpose} ${f.part}`.toLowerCase();
        return terms.every(t => haystack.includes(t));
      });
    }

    // Calculator-only toggle (from parent)
    if (onlyWithCalculators) {
      result = result.filter(f => hasCalculator(f.code));
    }

    return result;
  }, [activeScenario, quickFilter, searchQuery, onlyWithCalculators, bookmarks, recents]);

  const handleSelectFormula = (formula: Formula) => {
    setSelectedFormula(formula);
    setDialogOpen(true);
  };

  // ========================================================================
  // EXPLORER VIEW — scenario hub + visual formula grid
  // ========================================================================
  if (view === 'explorer') {
    return (
      <div className="flex-1 min-w-0">
        {/* View toggle + search bar */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <ViewToggle view={view} onViewChange={setView} language={language} />
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={e => onSearchQueryChange(e.target.value)}
              className="pl-9 pr-10 h-10 text-sm"
            />
            {searchQuery && (
              <button onClick={() => onSearchQueryChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick filter chips */}
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <QuickFilterChip active={quickFilter === 'all' && !activeScenario} onClick={() => { setQuickFilter('all'); setActiveScenario(null); }} label={t.allFormulas} count={allFormulas.length} />
          <QuickFilterChip active={quickFilter === 'calculator'} onClick={() => { setQuickFilter('calculator'); setActiveScenario(null); }} label={t.interactiveCalculators} count={allFormulas.filter(f => hasCalculator(f.code)).length} icon={Calculator} />
          <QuickFilterChip active={quickFilter === 'recent'} onClick={() => { setQuickFilter('recent'); setActiveScenario(null); }} label={labelFor(language, { en: 'Recently Used', fr: 'Utilisés récemment', ar: 'شوهد مؤخراً' })} count={recents.length} icon={Clock} />
          <QuickFilterChip active={quickFilter === 'bookmarked'} onClick={() => { setQuickFilter('bookmarked'); setActiveScenario(null); }} label={labelFor(language, { en: 'Bookmarked', fr: 'Favoris', ar: 'المفضّلة' })} count={bookmarks.length} icon={Star} />
        </div>

        {/* Scenario hub — only when no scenario selected and no quick filter active */}
        {!activeScenario && quickFilter === 'all' && !searchQuery && (
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
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  {labelFor(language, { en: 'Browse by Scenario', fr: 'Parcourir par scénario', ar: 'تصفّح حسب السيناريو' })}
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {FORMULA_SCENARIOS.map(scenario => (
                  <ScenarioCard
                    key={scenario.id}
                    scenario={scenario}
                    count={scenarioCounts[scenario.id] || 0}
                    language={language}
                    onClick={() => setActiveScenario(scenario.id)}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Active scenario header */}
        {activeScenario && (
          <div className="mb-4 flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setActiveScenario(null)} className="gap-1 text-xs">
              <X className="h-3.5 w-3.5" /> {labelFor(language, { en: 'All scenarios', fr: 'Tous les scénarios', ar: 'كل السيناريوهات' })}
            </Button>
            {(() => {
              const s = FORMULA_SCENARIOS.find(x => x.id === activeScenario);
              if (!s) return null;
              return (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{s.emoji}</span>
                  <div>
                    <div className="text-sm font-bold" style={{ color: s.color }}>
                      {scenarioTitle(language, s)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {scenarioCounts[s.id]} {labelFor(language, { en: 'formulas', fr: 'formules', ar: 'معادلة' })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Formula count + results */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">
              {searchQuery || activeScenario || quickFilter !== 'all'
                ? `${filteredFormulas.length} ${labelFor(language, { en: 'results', fr: 'résultats', ar: 'نتيجة' })}`
                : language === 'ar' ? 'كل المعادلات' : t.allFormulas}
            </h3>
            <Badge variant="secondary" className="font-mono">{filteredFormulas.length} / {allFormulas.length}</Badge>
          </div>
        </div>

        {/* Formula grid */}
        {filteredFormulas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-3"><Search className="h-8 w-8 text-muted-foreground" /></div>
            <h3 className="text-lg font-semibold mb-1">{t.noFormulasMatch}</h3>
            <Button onClick={() => { setActiveScenario(null); setQuickFilter('all'); onSearchQueryChange(''); }} variant="outline" size="sm" className="mt-2">{t.clearFilters}</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredFormulas.map(formula => (
              <FormulaCard key={`${formula.code}-${formula.part}`} formula={formula} onSelect={handleSelectFormula} onTagClick={(tag) => onSearchQueryChange(tag)} />
            ))}
          </div>
        )}

        <FormulaDetailDialog formula={selectedFormula} open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>
    );
  }

  // ========================================================================
  // CLASSIC VIEW — preserves the original sidebar + grid layout
  // ========================================================================
  if (view === 'classic') {
    return (
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-4">
          <ViewToggle view={view} onViewChange={setView} language={language} />
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={e => onSearchQueryChange(e.target.value)}
              className="pl-9 pr-10 h-10 text-sm"
            />
            {searchQuery && <button onClick={() => onSearchQueryChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
          </div>
        </div>

        <div className="flex gap-4">
          {classicSidebar && (
            <aside className="hidden lg:block w-[300px] flex-shrink-0 border-r border-border bg-background sticky top-[160px] h-[calc(100vh-160px)] overflow-hidden">
              {classicSidebar}
            </aside>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h2 className="text-lg font-semibold">
                  {selectedChapter !== null
                    ? `${t.sectionLabel} ${selectedChapter}`
                    : selectedPart ?? t.allFormulas}
                </h2>
                <Badge variant="secondary" className="font-mono">{filteredFormulas.length} / {allFormulas.length}</Badge>
              </div>
              {onlyWithCalculators && <Badge variant="outline" className="gap-1.5 text-xs"><Calculator className="h-3 w-3" /> {t.calculatorOnly}</Badge>}
            </div>
            {filteredFormulas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted p-4 mb-3"><Search className="h-8 w-8 text-muted-foreground" /></div>
                <h3 className="text-lg font-semibold mb-1">{t.noFormulasMatch}</h3>
                <Button onClick={() => onSearchQueryChange('')} variant="outline" size="sm" className="mt-2">{t.clear}</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredFormulas.map(formula => <FormulaCard key={`${formula.code}-${formula.part}`} formula={formula} onSelect={handleSelectFormula} />)}
              </div>
            )}
          </div>
        </div>

        <FormulaDetailDialog formula={selectedFormula} open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>
    );
  }

  // ========================================================================
  // GRAPH VIEW — visual formula relationship map
  // ========================================================================
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-3 mb-4">
        <ViewToggle view={view} onViewChange={setView} language={language} />
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={e => onSearchQueryChange(e.target.value)}
            className="pl-9 pr-10 h-10 text-sm"
          />
          {searchQuery && <button onClick={() => onSearchQueryChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <GraphIcon className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-semibold">{labelFor(language, { en: 'Formula Relationship Map', fr: 'Carte des relations entre formules', ar: 'خريطة علاقات المعادلات' })}</h3>
          <Badge variant="outline" className="text-[10px] ml-auto">{allFormulas.length} {labelFor(language, { en: 'nodes', fr: 'nœuds', ar: 'عقدة' })}</Badge>
        </div>
        <div className="text-xs text-muted-foreground mb-4">
          {labelFor(language, { en: 'Visually explore how formulas relate to each other. Click any formula to see details.', fr: 'Explorez visuellement les liens entre les formules. Cliquez sur une formule pour voir ses détails.', ar: 'تصفّح بصرياً كيف ترتبط المعادلات ببعضها. اضغط على أي معادلة لرؤية التفاصيل.' })}
        </div>
        {/* Reuse the existing FormulaGraph component */}
        <FormulaGraphLazy onSelect={handleSelectFormula} />
      </div>
      <FormulaDetailDialog formula={selectedFormula} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function ViewToggle({ view, onViewChange, language }: { view: ViewMode; onViewChange: (v: ViewMode) => void; language: Language }) {
  const modes: { id: ViewMode; label: LocalizedLabel; icon: typeof Sparkles }[] = [
    { id: 'explorer', label: { en: 'Explorer', fr: 'Explorateur', ar: 'المستكشف' }, icon: Sparkles },
    { id: 'classic', label: { en: 'Classic', fr: 'Classique', ar: 'كلاسيكي' }, icon: BookOpen },
    { id: 'graph', label: { en: 'Graph', fr: 'Graphe', ar: 'الخريطة' }, icon: GraphIcon },
  ];
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/30 p-0.5">
      {modes.map(m => {
        const Icon = m.icon;
        return (
          <button
            key={m.id}
            onClick={() => onViewChange(m.id)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
              view === m.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{labelFor(language, m.label)}</span>
          </button>
        );
      })}
    </div>
  );
}

function ScenarioCard({ scenario, count, language, onClick }: {
  scenario: FormulaScenario;
  count: number;
  language: Language;
  onClick: () => void;
}) {
  // Get top 3 formulas for this scenario (prefer ones with calculators)
  const previewFormulas = useMemo(() => {
    const scenarioFormulas = allFormulas.filter(f => getFormulaScenarios(f).includes(scenario.id));
    // Sort: with calculator first, then by code
    return scenarioFormulas
      .sort((a, b) => {
        const aCalc = hasCalculator(a.code) ? 0 : 1;
        const bCalc = hasCalculator(b.code) ? 0 : 1;
        if (aCalc !== bCalc) return aCalc - bCalc;
        return a.code.localeCompare(b.code);
      })
      .slice(0, 3);
  }, [scenario.id]);

  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl border-2 border-border bg-card p-4 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      {/* Gradient header strip */}
      <div className={cn('absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r', scenario.gradient)} />

      {/* Emoji + count */}
      <div className="flex items-start justify-between mb-2 mt-1">
        <span className="text-3xl">{scenario.emoji}</span>
        <Badge variant="outline" className="text-[10px] font-mono font-bold" style={{ color: scenario.color, borderColor: `${scenario.color}40` }}>
          {count}
        </Badge>
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold leading-tight mb-1" style={{ color: scenario.color }}>
        {scenarioTitle(language, scenario)}
      </h3>

      {/* Subtitle */}
      <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
        {scenarioSubtitle(language, scenario)}
      </p>

      {/* Top 3 formula preview */}
      {previewFormulas.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/40 space-y-0.5">
          {previewFormulas.map(f => (
            <div key={f.code} className="flex items-center gap-1 text-[9px] text-muted-foreground">
              {hasCalculator(f.code) && <Calculator className="h-2.5 w-2.5 text-emerald-500 flex-shrink-0" />}
              <span className="font-mono font-bold flex-shrink-0" style={{ color: scenario.color }}>{f.code}</span>
              <span className="truncate">{f.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Hover indicator */}
      <div className="flex items-center gap-1 text-[10px] font-medium mt-2 transition-colors" style={{ color: scenario.color }}>
        {labelFor(language, { en: 'Browse', fr: 'Parcourir', ar: 'تصفّح' })}
        <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
}

function QuickFilterChip({ active, onClick, label, count, icon: Icon }: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon?: typeof Star;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium border transition-all',
        active
          ? 'bg-emerald-600 text-white border-emerald-600'
          : 'bg-background border-border text-muted-foreground hover:border-emerald-300'
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
      <span className={cn('font-mono font-bold', active ? 'text-emerald-100' : 'text-muted-foreground/70')}>{count}</span>
    </button>
  );
}

/**
 * Formula of the Day hero banner — shows above the scenario grid.
 * Uses the existing getFormulaOfTheDay() helper from the learning module.
 */
function FormulaOfDayBanner({ language, onSelect }: { language: Language; onSelect: (f: Formula) => void }) {
  const formula = useMemo(() => getFormulaOfTheDay(), []);
  const scenario = useMemo(() => getPrimaryScenario(formula), [formula.code, formula.part, formula.name, formula.purpose]);
  const calcAvailable = hasCalculator(formula.code);
  const name = language === 'ar' && (formula as any).name_ar ? (formula as any).name_ar : formula.name;
  const purpose = language === 'ar' && (formula as any).purpose_ar ? (formula as any).purpose_ar : formula.purpose;

  return (
    <div className="mb-6">
      <div
        className="relative overflow-hidden rounded-2xl border-2 p-5 cursor-pointer hover:shadow-xl transition-all group"
        style={{ borderColor: `${scenario.color}40`, background: `linear-gradient(135deg, ${scenario.color}08, transparent 60%)` }}
        onClick={() => onSelect(formula)}
      >
        {/* Background emoji watermark */}
        <div className="absolute -bottom-4 -right-4 text-8xl opacity-[0.04] select-none pointer-events-none">
          {scenario.emoji}
        </div>

        <div className="flex items-start gap-4 relative">
          {/* Left: badge */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1">
            <div
              className="flex items-center justify-center h-12 w-12 rounded-xl text-white shadow-md"
              style={{ background: `linear-gradient(135deg, ${scenario.color}, ${scenario.color}dd)` }}
            >
              <Sparkles className="h-6 w-6" />
            </div>
            <span className="text-[8px] uppercase tracking-wider font-bold" style={{ color: scenario.color }}>
              {labelFor(language, { en: 'Today', fr: 'Aujourd’hui', ar: 'اليوم' })}
            </span>
          </div>

          {/* Right: content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground">
                {labelFor(language, { en: 'Formula of the Day', fr: 'Formule du jour', ar: 'معادلة اليوم' })}
              </span>
              <Badge variant="outline" className="text-[9px] font-mono font-bold" style={{ color: scenario.color, borderColor: `${scenario.color}40` }}>
                {formula.code}
              </Badge>
              {calcAvailable && (
                <Badge variant="secondary" className="text-[9px] gap-0.5">
                  <Calculator className="h-2.5 w-2.5" />
                  {labelFor(language, { en: 'Calculator', fr: 'Calculateur', ar: 'حاسبة' })}
                </Badge>
              )}
              <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                {scenario.emoji} {scenarioTitle(language, scenario)}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold leading-tight mb-1 group-hover:text-emerald-600 transition-colors">
              {name}
            </h3>
            <div className="rounded-md bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 px-3 py-1.5 font-mono text-xs mb-1.5 overflow-x-auto">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{formula.formula.split('=')[0]?.trim() || formula.formula.split(' ')[0]}</span>
              {formula.formula.includes('=') && (
                <span className="text-stone-700 dark:text-stone-300"> = {formula.formula.split('=').slice(1).join('=').trim()}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">{purpose}</p>
          </div>

          {/* Click arrow */}
          <div className="flex-shrink-0 self-center">
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" style={{ color: scenario.color }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Lazy-loaded FormulaGraph — avoids importing the heavy graph component
 * until the user actually switches to the Graph view.
 */
function FormulaGraphLazy({ onSelect }: { onSelect: (f: Formula) => void }) {
  const [GraphComponent, setGraphComponent] = useState<React.ComponentType<{ maxNodes?: number; className?: string }> | null>(null);

  useMemo(() => {
    import('./formula-graph').then(mod => {
      setGraphComponent(() => mod.FormulaGraph);
    });
  }, []);

  if (!GraphComponent) {
    return <div className="h-[500px] flex items-center justify-center text-sm text-muted-foreground">Loading graph…</div>;
  }
  // The FormulaGraph component renders its own interactive node selection.
  // We pass maxNodes=200 to show more of the 500 formulas.
  return <GraphComponent maxNodes={200} className="w-full h-[600px]" />;
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
