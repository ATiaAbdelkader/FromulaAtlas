'use client';

/**
 * Command Palette — Cmd+K / Ctrl+K global search.
 *
 * Opens a modal dialog with a search input + live-filtered list of all tools,
 * AI agents, and quick navigations from the tool registry. Selecting an entry
 * switches to the right tab and auto-opens the CollapsibleSection.
 *
 * Keyboard:
 *   ⌘K / Ctrl+K  — open
 *   Esc          — close
 *   ↑↓           — navigate
 *   Enter        — select
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CornerDownLeft, Search, Sparkles, ArrowRight, Pin,
} from 'lucide-react';
import {
  TOOL_REGISTRY, searchTools, recordToolUse, getPinnedToolIds, toggleToolPin, localizeToolEntry,
  TOOL_PINS_CHANGED_EVENT,
  type ToolEntry, type TabId,
} from '@/lib/tool-registry';
import { useTranslation } from '@/lib/language-store';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when the user selects a tool. Parent switches tab + opens section. */
  onSelect: (entry: ToolEntry) => void;
}

export function CommandPalette({ open, onOpenChange, onSelect }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const { isRTL, language } = useTranslation();

  // Reset query and scope when opening
  useEffect(() => {
    if (open) {
      setQuery('');
      setShowPinnedOnly(false);
    }
  }, [open]);

  // Keep pinned shortcuts in sync with changes made from any discovery surface.
  useEffect(() => {
    const syncPins = () => setPinnedIds(getPinnedToolIds());
    syncPins();
    window.addEventListener(TOOL_PINS_CHANGED_EVENT, syncPins);
    return () => window.removeEventListener(TOOL_PINS_CHANGED_EVENT, syncPins);
  }, []);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  const results = useMemo(() => searchTools(query, 20), [query]);
  const visibleResults = useMemo(() => {
    if (!showPinnedOnly) return results;
    const pinned = new Set(pinnedIds);
    return results.filter(result => pinned.has(result.entry.id));
  }, [pinnedIds, results, showPinnedOnly]);

  // Group results by category
  const grouped = useMemo(() => {
    const groups: Record<string, ToolEntry[]> = {};
    for (const r of visibleResults) {
      const cat = r.entry.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(r.entry);
    }
    return groups;
  }, [visibleResults]);

  const handleTogglePin = useCallback((event: React.MouseEvent, entry: ToolEntry) => {
    event.preventDefault();
    event.stopPropagation();
    setPinnedIds(toggleToolPin(entry.id));
  }, []);

  const handleSelect = useCallback((entry: ToolEntry) => {
    recordToolUse(entry.id);
    onSelect(entry);
    onOpenChange(false);
  }, [onSelect, onOpenChange]);

  const CATEGORY_LABELS: Record<string, string> = language === 'ar' ? {
    farm: 'إدارة المزرعة',
    tools: 'الأدوات المجانية',
    insights: 'الذكاء والتحليلات',
    formulas: 'أطلس المعادلات',
    agents: 'وكلاء الذكاء',
  } : language === 'fr' ? {
    farm: 'Gestion de la ferme',
    tools: 'Outils gratuits',
    insights: 'Intelligence et analyses',
    formulas: 'Atlas des formules',
    agents: 'Spécialistes IA',
  } : {
    farm: 'Farm Management',
    tools: 'Free Tools',
    insights: 'Intelligence & Insights',
    formulas: 'Formula Atlas',
    agents: 'AI Specialists',
  };

  const CATEGORY_ORDER = ['farm', 'tools', 'insights', 'agents', 'formulas'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="p-0 overflow-hidden max-w-2xl gap-0" aria-describedby={undefined}>
        <DialogTitle className="sr-only">{language === 'ar' ? 'لوحة الأوامر' : language === 'fr' ? 'Palette de commandes' : 'Command Palette'}</DialogTitle>
        <Command className="rounded-lg" shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <CommandInput
              placeholder={language === 'ar'
                ? 'ابحث عن أدوات أو وكلاء أو معادلات… (أو اكتب كلمة مثل «صقيع» أو «سماد»)'
                : language === 'fr'
                  ? 'Rechercher des outils, agents ou formules… (par exemple « gel » ou « engrais »)'
                  : "Search tools, agents, formulas… (or type a keyword like 'frost' or 'fertilizer')"}
              value={query}
              onValueChange={setQuery}
              className="h-12 flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-sm"
            />
            <kbd className="pointer-events-none select-none rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>
          <div className="flex items-center gap-1 border-b px-3 py-2">
            <button
              type="button"
              onClick={() => setShowPinnedOnly(false)}
              className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${!showPinnedOnly ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/60'}`}
            >
              {language === 'ar' ? 'كل الأدوات' : language === 'fr' ? 'Tous les outils' : 'All tools'}
            </button>
            <button
              type="button"
              onClick={() => setShowPinnedOnly(true)}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${showPinnedOnly ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' : 'text-muted-foreground hover:bg-muted/60'}`}
            >
              <Pin className="h-3 w-3" /> {language === 'ar' ? 'المثبّتة' : language === 'fr' ? 'Épinglés' : 'Pinned'} <span className="font-mono">{pinnedIds.length}</span>
            </button>
          </div>
          <CommandList className="max-h-[400px] overflow-y-auto">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              {showPinnedOnly
                ? (language === 'ar' ? 'لم تثبّت أي أداة بعد' : language === 'fr' ? 'Aucun outil épinglé' : 'No pinned tools yet')
                : (language === 'ar' ? `لا نتائج لـ «${query}»` : language === 'fr' ? `Aucun résultat pour « ${query} »` : `No results for "${query}"`)}
            </CommandEmpty>

            {!query && !showPinnedOnly && (
              <div className="px-3 py-2 text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" /> {language === 'ar' ? 'مقترح — ابدأ الكتابة أو اختر من الأسفل' : language === 'fr' ? 'Suggestions — commencez à écrire ou choisissez ci-dessous' : 'Suggested — start typing or pick from below'}
              </div>
            )}

            {CATEGORY_ORDER.map(cat => {
              const entries = grouped[cat];
              if (!entries || entries.length === 0) return null;
              return (
                <CommandGroup key={cat} heading={CATEGORY_LABELS[cat]}>
                  {entries.map(entry => {
                    const Icon = entry.icon;
                    const localizedEntry = localizeToolEntry(entry, language);
                    return (
                      <CommandItem
                        key={entry.id}
                        value={`${localizedEntry.title} ${localizedEntry.description} ${entry.keywords}`}
                        onSelect={() => handleSelect(entry)}
                        className="cursor-pointer"
                      >
                        <div
                          className="mr-2 shrink-0 w-7 h-7 rounded-md flex items-center justify-center"
                          style={{ backgroundColor: entry.color + '20' }}
                        >
                          <Icon className="h-3.5 w-3.5" style={{ color: entry.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium leading-tight">{localizedEntry.title}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{localizedEntry.description}</div>
                        </div>
                        <button
                          type="button"
                          aria-label={pinnedIds.includes(entry.id)
                            ? (language === 'ar' ? 'إلغاء تثبيت الأداة' : language === 'fr' ? 'Désépingler l’outil' : 'Unpin tool')
                            : (language === 'ar' ? 'تثبيت الأداة' : language === 'fr' ? 'Épingler l’outil' : 'Pin tool')}
                          aria-pressed={pinnedIds.includes(entry.id)}
                          title={pinnedIds.includes(entry.id)
                            ? (language === 'ar' ? 'إلغاء التثبيت' : language === 'fr' ? 'Désépingler' : 'Unpin')
                            : (language === 'ar' ? 'تثبيت' : language === 'fr' ? 'Épingler' : 'Pin')}
                          onClick={event => handleTogglePin(event, entry)}
                          className={`ml-2 rounded p-1 transition-colors hover:bg-muted ${pinnedIds.includes(entry.id) ? 'text-amber-500' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}
                        >
                          <Pin className={`h-3.5 w-3.5 ${pinnedIds.includes(entry.id) ? 'fill-current' : ''}`} />
                        </button>
                        <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-aria-selected:opacity-100" />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              );
            })}
          </CommandList>

          {/* Footer */}
          <div className="border-t flex items-center justify-between px-3 py-2 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-muted px-1 py-0.5 font-mono">↑↓</kbd> {language === 'ar' ? 'تنقّل' : language === 'fr' ? 'naviguer' : 'navigate'}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-muted px-1 py-0.5 font-mono">↵</kbd> {language === 'ar' ? 'اختيار' : language === 'fr' ? 'sélectionner' : 'select'}
              </span>
            </div>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" /> {TOOL_REGISTRY.length} {language === 'ar' ? 'أداة مفهرسة' : language === 'fr' ? 'outils indexés' : 'tools indexed'}
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Floating trigger button (optional — render in the header)
// ============================================================================

export function CommandPaletteTrigger({ onClick }: { onClick: () => void }) {
  const { isRTL, language } = useTranslation();
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-muted/30 hover:bg-muted/60 text-xs text-muted-foreground transition-colors"
      title={language === 'ar' ? 'بحث في الأدوات (⌘K)' : language === 'fr' ? 'Rechercher des outils (⌘K)' : 'Search tools (⌘K)'}
    >
      <Search className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{language === 'ar' ? 'بحث في الأدوات…' : language === 'fr' ? 'Rechercher des outils…' : 'Search tools…'}</span>
      <kbd className="hidden sm:inline-block pointer-events-none select-none rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
        ⌘K
      </kbd>
    </button>
  );
}
