'use client';

import { useMemo, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ChevronDown,
  ChevronRight,
  Sprout,
  BookOpen,
  Calculator,
  Search,
  Layers3,
  Hash,
  Clock,
  X,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { handbook } from '@/lib/formulas-data';
import { getPartTheme, domainMeta, type Domain } from './part-themes';
import type { Formula } from '@/lib/types';
import { calculators } from './calculators';

interface SidebarNavProps {
  selectedPart: string | null;
  selectedChapter: number | null;
  onlyWithCalculators: boolean;
  onSelectPart: (part: string | null) => void;
  onSelectChapter: (chapter: number | null) => void;
  onToggleCalculatorFilter: () => void;
  recentFormulas?: Formula[];
  onSelectRecentFormula?: (formula: Formula) => void;
  activeFormulaCode?: string | null;
  searchQuery: string;
}

interface GroupedPart {
  part: typeof handbook.parts[number];
  formulaCount: number;
  chapterCounts: { number: number; title: string; formulaCount: number }[];
  theme: ReturnType<typeof getPartTheme>;
}

export function SidebarNav({
  selectedPart,
  selectedChapter,
  onlyWithCalculators,
  onSelectPart,
  onSelectChapter,
  onToggleCalculatorFilter,
  recentFormulas = [],
  onSelectRecentFormula,
  activeFormulaCode,
  searchQuery,
}: SidebarNavProps) {
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set());
  const [localSearch, setLocalSearch] = useState('');
  const [activeDomain, setActiveDomain] = useState<Domain | null>(null);

  const togglePart = (partTitle: string) => {
    setExpandedParts(prev => {
      const next = new Set(prev);
      if (next.has(partTitle)) next.delete(partTitle);
      else next.add(partTitle);
      return next;
    });
  };

  // Derived set: always show selected part as expanded
  const effectivelyExpanded = useMemo(() => {
    if (!selectedPart) return expandedParts;
    const next = new Set(expandedParts);
    next.add(selectedPart);
    return next;
  }, [expandedParts, selectedPart]);

  const groupedParts = useMemo<GroupedPart[]>(() => {
    return handbook.parts.map(part => {
      const chapterCounts = part.chapters.map(ch => ({
        number: ch.number,
        title: ch.title,
        formulaCount: ch.formulas.length + ch.sub_sections.reduce((s, ss) => s + ss.formulas.length, 0),
      }));
      const formulaCount = chapterCounts.reduce((sum, c) => sum + c.formulaCount, 0);
      return { part, formulaCount, chapterCounts, theme: getPartTheme(part.title) };
    });
  }, []);

  // Filter parts by local sidebar search (chapters too)
  const filteredParts = useMemo(() => {
    if (!localSearch.trim()) return groupedParts;
    const q = localSearch.toLowerCase().trim();
    return groupedParts
      .map(g => {
        const partMatch =
          g.part.title.toLowerCase().includes(q) ||
          g.part.roman.toLowerCase().includes(q) ||
          String(g.part.chapters.length).includes(q);
        const matchedChapters = g.chapterCounts.filter(
          c => c.title.toLowerCase().includes(q) || String(c.number).includes(q),
        );
        if (partMatch) return g;
        if (matchedChapters.length > 0) {
          return { ...g, chapterCounts: matchedChapters, _forceExpand: true } as GroupedPart & { _forceExpand?: boolean };
        }
        return null;
      })
      .filter(Boolean) as (GroupedPart & { _forceExpand?: boolean })[];
  }, [groupedParts, localSearch]);

  // Group parts by domain
  const partsByDomain = useMemo(() => {
    const groups: Record<Domain, GroupedPart[]> = {
      crop: [],
      animal: [],
      'cross-cutting': [],
    };
    filteredParts.forEach(p => groups[p.theme.domain].push(p));
    return groups;
  }, [filteredParts]);

  const handlePartClick = (partTitle: string) => {
    if (selectedPart === partTitle && !selectedChapter) {
      // Second click on already-selected part: clear filter but keep expanded
      onSelectPart(null);
    } else {
      onSelectPart(partTitle);
      onSelectChapter(null);
    }
    togglePart(partTitle);
  };

  const handleChapterClick = (partTitle: string, chapterNum: number) => {
    if (!effectivelyExpanded.has(partTitle)) togglePart(partTitle);
    if (selectedChapter === chapterNum && selectedPart === partTitle) {
      onSelectChapter(null);
    } else {
      onSelectPart(partTitle);
      onSelectChapter(chapterNum);
    }
  };

  const totalFormulas = handbook.all_formulas.length;
  const maxPartFormulas = Math.max(...groupedParts.map(p => p.formulaCount));

  return (
    <div className="flex flex-col h-full bg-white dark:bg-stone-950">
      {/* Brand / Header strip */}
      <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800 bg-gradient-to-r from-emerald-50 to-stone-50 dark:from-emerald-950/30 dark:to-stone-900/30">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center justify-center h-7 w-7 rounded-md bg-gradient-to-br from-emerald-500 to-green-700 text-white shadow-sm">
            <Layers3 className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold tracking-tight leading-tight">Library</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {handbook.meta.total_parts} parts · {handbook.meta.total_chapters} chapters
            </div>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="flex items-center gap-2 text-[10px]">
          <div className="flex-1 rounded-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-2 py-1 flex items-center justify-between">
            <span className="text-muted-foreground uppercase tracking-wider">Formulas</span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{totalFormulas}</span>
          </div>
          <div className="flex-1 rounded-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-2 py-1 flex items-center justify-between">
            <span className="text-muted-foreground uppercase tracking-wider">Calcs</span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
              {Object.keys(calculators).length}
            </span>
          </div>
        </div>
      </div>

      {/* Sidebar local search */}
      <div className="p-3 border-b border-stone-200 dark:border-stone-800">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Filter parts & chapters..."
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            className="pl-8 pr-7 h-8 text-xs"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Domain quick-filter chips */}
        <div className="flex items-center gap-1 mt-2">
          <button
            onClick={() => setActiveDomain(activeDomain === 'crop' ? null : 'crop')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all border',
              activeDomain === 'crop'
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 shadow-sm'
                : 'bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:border-emerald-300'
            )}
          >
            <Sprout className="h-3 w-3" />
            Crop
          </button>
          <button
            onClick={() => setActiveDomain(activeDomain === 'animal' ? null : 'animal')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all border',
              activeDomain === 'animal'
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 shadow-sm'
                : 'bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:border-amber-300'
            )}
          >
            <BookOpen className="h-3 w-3" />
            Animal
          </button>
          <button
            onClick={() => setActiveDomain(activeDomain === 'cross-cutting' ? null : 'cross-cutting')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all border',
              activeDomain === 'cross-cutting'
                ? 'bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-800 shadow-sm'
                : 'bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:border-violet-300'
            )}
          >
            <LayoutGrid className="h-3 w-3" />
            Applied
          </button>
        </div>
      </div>

      {/* Calculator-only toggle */}
      <div className="px-3 py-2 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30">
        <label
          htmlFor="calc-only"
          className="flex items-center justify-between cursor-pointer group"
        >
          <span className="flex items-center gap-2 text-xs font-medium text-stone-700 dark:text-stone-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
            <Calculator className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
            Calculator only
          </span>
          <Switch
            id="calc-only"
            checked={onlyWithCalculators}
            onCheckedChange={onToggleCalculatorFilter}
            className="scale-90"
          />
        </label>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* All Formulas button */}
          <button
            onClick={() => { onSelectPart(null); onSelectChapter(null); }}
            className={cn(
              'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between group',
              !selectedPart && !selectedChapter
                ? 'bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-950 dark:to-green-950 text-emerald-800 dark:text-emerald-300 shadow-sm border border-emerald-200 dark:border-emerald-900'
                : 'hover:bg-stone-100 dark:hover:bg-stone-800/60 text-stone-700 dark:text-stone-300 border border-transparent'
            )}
          >
            <span className="flex items-center gap-2">
              <div className={cn(
                'flex items-center justify-center h-6 w-6 rounded-md transition-colors',
                !selectedPart && !selectedChapter
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950 group-hover:text-emerald-600'
              )}>
                <Sprout className="h-3.5 w-3.5" />
              </div>
              All Formulas
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
              {totalFormulas}
            </span>
          </button>

          {/* Recently viewed */}
          {recentFormulas.length > 0 && (
            <div className="mt-3 mb-3">
              <div className="flex items-center gap-1.5 px-2 mb-1 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                <Clock className="h-3 w-3" />
                Recently viewed
              </div>
              <div className="space-y-0.5">
                {recentFormulas.slice(0, 4).map(f => {
                  const theme = getPartTheme(f.part);
                  const isActive = activeFormulaCode === f.code;
                  return (
                    <TooltipProvider key={f.code + f.part} delayDuration={400}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => onSelectRecentFormula?.(f)}
                            className={cn(
                              'w-full text-left px-2 py-1.5 rounded-md text-xs transition-all flex items-center gap-2 group',
                              isActive
                                ? `${theme.chipBg} ${theme.chipText} border ${theme.chipBorder}`
                                : 'hover:bg-stone-100 dark:hover:bg-stone-800/60 text-stone-600 dark:text-stone-400 border border-transparent'
                            )}
                          >
                            <span className={cn(
                              'inline-flex items-center justify-center h-5 min-w-5 px-1 rounded text-[9px] font-mono font-bold',
                              theme.chipBg, theme.chipText
                            )}>
                              {f.code}
                            </span>
                            <span className="truncate flex-1">{f.name}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <div className="text-xs">
                            <div className="font-semibold">{f.name}</div>
                            <div className="text-muted-foreground mt-0.5">{f.chapter}</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>
          )}

          {/* Parts grouped by domain */}
          {(Object.keys(partsByDomain) as Domain[])
            .filter(d => !activeDomain || d === activeDomain)
            .map(domain => {
              const parts = partsByDomain[domain];
              if (parts.length === 0) return null;
              const meta = domainMeta[domain];
              const DomainIcon = meta.icon;

              return (
                <div key={domain} className="mb-2">
                  {/* Domain header */}
                  <div className="flex items-center gap-1.5 px-2 pt-2 pb-1">
                    <DomainIcon className={cn('h-3 w-3', meta.color)} />
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-500 dark:text-stone-400">
                      {meta.label}
                    </span>
                    <div className="flex-1 h-px bg-stone-200 dark:bg-stone-800" />
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {parts.reduce((s, p) => s + p.formulaCount, 0)}
                    </span>
                  </div>

                  {/* Part items */}
                  <div className="space-y-0.5">
                    {parts.map(({ part, formulaCount, chapterCounts, theme }) => {
                      const isExpanded = effectivelyExpanded.has(part.title) ||
                        (localSearch.trim() && chapterCounts.length > 0);
                      const isSelected = selectedPart === part.title && !selectedChapter;
                      const PartIcon = theme.icon;
                      const progressPct = (formulaCount / maxPartFormulas) * 100;

                      return (
                        <div key={part.title}>
                          <div
                            className={cn(
                              'group relative flex items-stretch rounded-lg transition-all',
                              isSelected && 'ring-1 ring-emerald-300 dark:ring-emerald-800 shadow-sm'
                            )}
                          >
                            <button
                              onClick={() => handlePartClick(part.title)}
                              className={cn(
                                'flex-1 flex items-center gap-2 px-2 py-2 rounded-l-lg text-sm font-medium text-left transition-colors min-w-0',
                                isSelected
                                  ? `${theme.chipBg} ${theme.chipText}`
                                  : 'hover:bg-stone-100 dark:hover:bg-stone-800/60 text-stone-700 dark:text-stone-300'
                              )}
                            >
                              {/* Roman badge with gradient */}
                              <div className={cn(
                                'flex items-center justify-center h-6 w-6 rounded-md bg-gradient-to-br text-white text-[9px] font-bold flex-shrink-0 shadow-sm',
                                theme.badgeGradient
                              )}>
                                {part.roman}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="truncate text-[13px] leading-tight">{part.title}</div>
                                {/* Mini progress bar showing relative formula density */}
                                <div className="flex items-center gap-1.5 mt-1">
                                  <div className="flex-1 h-0.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                                    <div
                                      className={cn('h-full rounded-full transition-all', theme.progressFill)}
                                      style={{ width: `${progressPct}%` }}
                                    />
                                  </div>
                                  <span className="text-[9px] font-mono text-muted-foreground flex-shrink-0">
                                    {formulaCount}
                                  </span>
                                </div>
                              </div>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); togglePart(part.title); }}
                              className={cn(
                                'px-1.5 rounded-r-lg transition-colors flex items-center',
                                isExpanded
                                  ? `${theme.chipBg} ${theme.chipText}`
                                  : 'hover:bg-stone-100 dark:hover:bg-stone-800/60 text-stone-400'
                              )}
                              aria-label={isExpanded ? 'Collapse' : 'Expand'}
                            >
                              {isExpanded
                                ? <ChevronDown className="h-3.5 w-3.5" />
                                : <ChevronRight className="h-3.5 w-3.5" />}
                            </button>
                          </div>

                          {/* Chapter list */}
                          {isExpanded && (
                            <div className="ml-4 pl-3 border-l-2 border-dashed border-stone-200 dark:border-stone-800 space-y-0.5 py-1 my-1">
                              {chapterCounts.map(ch => {
                                const chSelected = selectedPart === part.title && selectedChapter === ch.number;
                                return (
                                  <button
                                    key={ch.number}
                                    onClick={() => handleChapterClick(part.title, ch.number)}
                                    className={cn(
                                      'w-full text-left px-2 py-1 rounded-md text-xs transition-all flex items-center gap-2 group',
                                      chSelected
                                        ? `${theme.chipBg} ${theme.chipText} font-semibold shadow-sm`
                                        : 'hover:bg-stone-100 dark:hover:bg-stone-800/60 text-stone-600 dark:text-stone-400'
                                    )}
                                  >
                                    <span className={cn(
                                      'inline-flex items-center justify-center h-5 w-5 rounded text-[9px] font-mono font-bold flex-shrink-0 transition-colors',
                                      chSelected
                                        ? `bg-gradient-to-br ${theme.badgeGradient} text-white`
                                        : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 group-hover:bg-stone-200 dark:group-hover:bg-stone-700'
                                    )}>
                                      {ch.number}
                                    </span>
                                    <span className="truncate flex-1 text-[11px] leading-tight">{ch.title}</span>
                                    <span className={cn(
                                      'text-[9px] font-mono flex-shrink-0 px-1 rounded',
                                      chSelected ? 'bg-white/50 dark:bg-black/30' : 'text-muted-foreground'
                                    )}>
                                      {ch.formulaCount}
                                    </span>
                                  </button>
                                );
                              })}
                              {chapterCounts.length === 0 && (
                                <div className="px-2 py-1 text-[10px] text-muted-foreground italic">
                                  No chapters match
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

          {filteredParts.length === 0 && (
            <div className="text-center py-8 text-xs text-muted-foreground">
              <Search className="h-6 w-6 mx-auto mb-2 opacity-50" />
              No matches for &ldquo;{localSearch}&rdquo;
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer summary */}
      <div className="px-3 py-2 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 text-[10px] text-muted-foreground">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Hash className="h-2.5 w-2.5" />
            {selectedPart
              ? `Filtered to ${selectedChapter !== null ? '1 chapter' : `${handbook.parts.find(p => p.title === selectedPart)?.chapters.length || 0} chapters`}`
              : 'Showing all parts'}
          </span>
          <span className="font-mono">{filteredParts.length}/{handbook.parts.length}</span>
        </div>
      </div>
    </div>
  );
}
