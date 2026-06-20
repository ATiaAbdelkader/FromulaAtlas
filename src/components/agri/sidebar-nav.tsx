'use client';

import { useMemo, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Layers, BookOpen, Sprout, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { handbook } from '@/lib/formulas-data';

interface SidebarNavProps {
  selectedPart: string | null;
  selectedChapter: number | null;
  onlyWithCalculators: boolean;
  onSelectPart: (part: string | null) => void;
  onSelectChapter: (chapter: number | null) => void;
  onToggleCalculatorFilter: () => void;
  formulaCounts: Map<string, number>; // key: `part::chapter_number` or `part::`
}

interface SidebarNavPropsWithSearch extends SidebarNavProps {
  searchQuery: string;
}

export function SidebarNav({
  selectedPart,
  selectedChapter,
  onlyWithCalculators,
  onSelectPart,
  onSelectChapter,
  onToggleCalculatorFilter,
  formulaCounts,
  searchQuery,
}: SidebarNavPropsWithSearch) {
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set());

  const togglePart = (partTitle: string) => {
    setExpandedParts(prev => {
      const next = new Set(prev);
      if (next.has(partTitle)) {
        next.delete(partTitle);
      } else {
        next.add(partTitle);
      }
      return next;
    });
  };

  const partList = useMemo(() => handbook.parts.map(part => {
    const formulaCount = part.chapters.reduce((sum, ch) => {
      return sum + ch.formulas.length + ch.sub_sections.reduce((s, ss) => s + ss.formulas.length, 0);
    }, 0);
    return { part, formulaCount };
  }), []);

  const handlePartClick = (partTitle: string) => {
    if (selectedPart === partTitle) {
      onSelectPart(null);
    } else {
      onSelectPart(partTitle);
      onSelectChapter(null);
    }
    togglePart(partTitle);
  };

  const handleChapterClick = (partTitle: string, chapterNum: number) => {
    if (!expandedParts.has(partTitle)) {
      togglePart(partTitle);
    }
    if (selectedChapter === chapterNum && selectedPart === partTitle) {
      onSelectChapter(null);
    } else {
      onSelectPart(partTitle);
      onSelectChapter(chapterNum);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-stone-50 dark:bg-stone-900/50">
        <div className="flex items-center gap-2 text-sm font-semibold mb-2">
          <Layers className="h-4 w-4 text-emerald-600" />
          Browse by Part & Chapter
        </div>
        <button
          onClick={onToggleCalculatorFilter}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors border',
            onlyWithCalculators
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:border-emerald-300'
          )}
        >
          <span className="flex items-center gap-1.5">
            <Calculator className="h-3.5 w-3.5" />
            Only formulas with calculators
          </span>
          <span className={cn(
            'h-3.5 w-3.5 rounded-full',
            onlyWithCalculators ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-stone-700'
          )} />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <button
            onClick={() => { onSelectPart(null); onSelectChapter(null); }}
            className={cn(
              'w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-between',
              !selectedPart && !selectedChapter
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
            )}
          >
            <span className="flex items-center gap-2">
              <Sprout className="h-4 w-4" />
              All Formulas
            </span>
            <span className="text-xs text-muted-foreground">{handbook.all_formulas.length}</span>
          </button>

          {partList.map(({ part, formulaCount }) => {
            const isExpanded = expandedParts.has(part.title) || selectedPart === part.title;
            const isSelected = selectedPart === part.title && !selectedChapter;

            return (
              <Collapsible key={part.title} open={isExpanded} onOpenChange={() => togglePart(part.title)}>
                <div className="flex items-stretch">
                  <button
                    onClick={() => handlePartClick(part.title)}
                    className={cn(
                      'flex-1 flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left',
                      isSelected
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                        : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                    )}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold flex-shrink-0">
                        {part.roman}
                      </span>
                      <span className="truncate">{part.title}</span>
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{formulaCount}</span>
                  </button>
                  <CollapsibleTrigger asChild>
                    <button
                      className="px-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md"
                      onClick={(e) => { e.stopPropagation(); togglePart(part.title); }}
                    >
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <div className="ml-3 pl-3 border-l border-stone-200 dark:border-stone-800 space-y-0.5 py-1">
                    {part.chapters.map(ch => {
                      const chFormulaCount = ch.formulas.length + ch.sub_sections.reduce((s, ss) => s + ss.formulas.length, 0);
                      const chSelected = selectedPart === part.title && selectedChapter === ch.number;
                      return (
                        <button
                          key={ch.number}
                          onClick={() => handleChapterClick(part.title, ch.number)}
                          className={cn(
                            'w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between gap-2',
                            chSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-medium'
                              : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'
                          )}
                        >
                          <span className="flex items-center gap-1.5 min-w-0">
                            <BookOpen className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{ch.number}. {ch.title}</span>
                          </span>
                          <span className="text-muted-foreground flex-shrink-0">{chFormulaCount}</span>
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
