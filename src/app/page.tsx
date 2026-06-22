'use client';

import { useMemo, useState } from 'react';
import { Search, Sprout, Layers, BookOpen, Calculator, X, Leaf, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { FormulaCard, hasCalculator } from '@/components/agri/formula-card';
import { FormulaDetailDialog } from '@/components/agri/formula-detail-dialog';
import { SidebarNav } from '@/components/agri/sidebar-nav';
import { UseCasesSection } from '@/components/agri/use-cases-section';
import { WorkflowRunner } from '@/components/agri/workflow-runner';
import { SeasonScheduler } from '@/components/agri/season-scheduler';
import { LanguageToggle } from '@/components/language-toggle';
import { handbook, allFormulas } from '@/lib/formulas-data';
import type { Formula } from '@/lib/types';
import type { Workflow } from '@/lib/workflows';
import { useTranslation } from '@/lib/language-store';
import { cn } from '@/lib/utils';

export default function Home() {
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

  const filteredFormulas = useMemo(() => {
    let result = allFormulas;
    if (selectedPart) result = result.filter(f => f.part === selectedPart);
    if (selectedChapter !== null) result = result.filter(f => f.chapter_number === selectedChapter && f.part === selectedPart);
    if (onlyWithCalculators) result = result.filter(f => hasCalculator(f.code));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const terms = q.split(/\s+/).filter(Boolean);
      result = result.filter(f => {
        const haystack = `${f.code} ${f.name} ${f.name_ar || ''} ${f.formula} ${f.variables} ${f.variables_ar || ''} ${f.purpose} ${f.purpose_ar || ''} ${f.example} ${f.pitfall} ${f.chapter} ${f.part}`.toLowerCase();
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
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3 mb-3">
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
              <LanguageToggle />
              <div className="lg:hidden">
                <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2"><Layers className="h-4 w-4" />Browse</Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 gap-0 w-[340px] sm:w-[380px] overflow-hidden">{sidebarContent}</SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input type="search" placeholder={t.searchPlaceholder} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-10 h-10 text-sm" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
          </div>
        </div>
      </header>

      {!hasActiveFilters && (
        <section className="bg-gradient-to-br from-emerald-700 via-green-700 to-teal-800 text-white">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
            <div className="flex items-center gap-2 mb-3 text-emerald-100 text-sm font-medium uppercase tracking-wide"><Leaf className="h-4 w-4" />Calculations · Indices · Decision Rules · Worked Examples</div>
            <h2 className="text-2xl sm:text-4xl font-bold leading-tight mb-3 max-w-3xl">The complete reference for crop &amp; animal production formulas</h2>
            <p className="text-emerald-50 text-sm sm:text-base max-w-2xl leading-relaxed mb-6">From plant population and seed rate to feed conversion ratio and irrigation engineering — every formula comes with variables, units, worked examples, and interactive calculators.</p>
            <div className="flex flex-wrap gap-3 sm:gap-6">
              <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-3 border border-white/20"><div className="flex items-center gap-2 text-emerald-100 text-xs uppercase tracking-wide font-medium"><Layers className="h-3.5 w-3.5" />Parts</div><div className="text-2xl font-bold mt-0.5">{handbook.meta.total_parts}</div></div>
              <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-3 border border-white/20"><div className="flex items-center gap-2 text-emerald-100 text-xs uppercase tracking-wide font-medium"><BookOpen className="h-3.5 w-3.5" />{t.sections}</div><div className="text-2xl font-bold mt-0.5">{handbook.meta.total_chapters}</div></div>
              <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-3 border border-white/20"><div className="flex items-center gap-2 text-emerald-100 text-xs uppercase tracking-wide font-medium"><Calculator className="h-3.5 w-3.5" />{t.formulas}</div><div className="text-2xl font-bold mt-0.5">{handbook.meta.total_formulas}</div></div>
              <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-3 border border-white/20"><div className="flex items-center gap-2 text-emerald-100 text-xs uppercase tracking-wide font-medium"><Sprout className="h-3.5 w-3.5" />{t.interactiveCalculators}</div><div className="text-2xl font-bold mt-0.5">{allFormulas.filter(f => hasCalculator(f.code)).length}</div></div>
            </div>
          </div>
        </section>
      )}

      <div className="flex-1 max-w-[1600px] mx-auto w-full flex">
        <aside className="hidden lg:block w-[340px] flex-shrink-0 border-r border-border bg-background sticky top-[140px] h-[calc(100vh-140px)] overflow-hidden">{sidebarContent}</aside>

        <main className="flex-1 min-w-0 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h2 className="text-lg font-semibold">{selectedChapter !== null && currentChapterInfo ? `Section ${currentChapterInfo.number}: ${currentChapterInfo.title}` : selectedPart ? selectedPart : t.allFormulas}</h2>
              <Badge variant="secondary" className="font-mono">{filteredFormulas.length} of {allFormulas.length}</Badge>
            </div>
            {hasActiveFilters && <Button variant="outline" size="sm" onClick={handleClearFilters} className="gap-1.5 text-xs"><X className="h-3.5 w-3.5" />Clear filters</Button>}
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              {selectedPart && <Badge variant="outline" className="gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900">Part: {selectedPart}<button onClick={() => { setSelectedPart(null); setSelectedChapter(null); }}><X className="h-3 w-3" /></button></Badge>}
              {selectedChapter !== null && <Badge variant="outline" className="gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900">Section: {selectedChapter}<button onClick={() => setSelectedChapter(null)}><X className="h-3 w-3" /></button></Badge>}
              {onlyWithCalculators && <Badge variant="outline" className="gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900">Calculator only<button onClick={() => setOnlyWithCalculators(false)}><X className="h-3 w-3" /></button></Badge>}
              {searchQuery && <Badge variant="outline" className="gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900">&quot;{searchQuery}&quot;<button onClick={() => setSearchQuery('')}><X className="h-3 w-3" /></button></Badge>}
            </div>
          )}

          {currentChapterInfo?.intro && <div className="bg-card border border-border rounded-lg p-4 mb-5"><p className="text-sm text-muted-foreground leading-relaxed">{currentChapterInfo.intro}</p></div>}

          {!hasActiveFilters && <SeasonScheduler />}
          {!hasActiveFilters && <UseCasesSection onLaunch={(wf) => { setActiveWorkflow(wf); setWorkflowOpen(true); }} />}

          {filteredFormulas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-3"><Search className="h-8 w-8 text-muted-foreground" /></div>
              <h3 className="text-lg font-semibold mb-1">No formulas match your filters</h3>
              <p className="text-sm text-muted-foreground mb-4">Try adjusting your search or clearing some filters.</p>
              <Button onClick={handleClearFilters} variant="outline" size="sm">Clear all filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredFormulas.map(formula => <FormulaCard key={`${formula.code}-${formula.part}`} formula={formula} onSelect={handleSelectFormula} />)}
            </div>
          )}
        </main>
      </div>

      <footer className="mt-auto border-t border-border bg-card">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Sprout className="h-4 w-4 text-emerald-600" /><span>{t.appName} · {handbook.meta.version}</span></div>
          <div className="text-xs text-muted-foreground">{handbook.meta.total_formulas} formulas across {handbook.meta.total_parts} parts and {handbook.meta.total_chapters} sections</div>
        </div>
      </footer>

      <FormulaDetailDialog formula={selectedFormula} open={dialogOpen} onOpenChange={setDialogOpen} />
      <WorkflowRunner workflow={activeWorkflow} open={workflowOpen} onOpenChange={setWorkflowOpen} />
    </div>
  );
}
