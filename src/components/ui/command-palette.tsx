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
  CornerDownLeft, Search, Sparkles, ArrowRight,
} from 'lucide-react';
import {
  TOOL_REGISTRY, searchTools, recordToolUse,
  type ToolEntry, type TabId,
} from '@/lib/tool-registry';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when the user selects a tool. Parent switches tab + opens section. */
  onSelect: (entry: ToolEntry) => void;
}

export function CommandPalette({ open, onOpenChange, onSelect }: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  // Reset query when opening
  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

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

  // Group results by category
  const grouped = useMemo(() => {
    const groups: Record<string, ToolEntry[]> = {};
    for (const r of results) {
      const cat = r.entry.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(r.entry);
    }
    return groups;
  }, [results]);

  const handleSelect = useCallback((entry: ToolEntry) => {
    recordToolUse(entry.id);
    onSelect(entry);
    onOpenChange(false);
  }, [onSelect, onOpenChange]);

  const CATEGORY_LABELS: Record<string, string> = {
    farm: 'Farm Management',
    tools: 'Free Tools',
    insights: 'Intelligence & Insights',
    formulas: 'Formula Atlas',
    agents: 'AI Specialists',
  };

  const CATEGORY_ORDER = ['farm', 'tools', 'insights', 'agents', 'formulas'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-2xl gap-0" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <Command className="rounded-lg" shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <CommandInput
              placeholder="Search tools, agents, formulas… (or type a keyword like 'frost' or 'fertilizer')"
              value={query}
              onValueChange={setQuery}
              className="h-12 flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-sm"
            />
            <kbd className="pointer-events-none select-none rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>
          <CommandList className="max-h-[400px] overflow-y-auto">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              No results for "{query}"
            </CommandEmpty>

            {!query && (
              <div className="px-3 py-2 text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" /> Suggested — start typing or pick from below
              </div>
            )}

            {CATEGORY_ORDER.map(cat => {
              const entries = grouped[cat];
              if (!entries || entries.length === 0) return null;
              return (
                <CommandGroup key={cat} heading={CATEGORY_LABELS[cat]}>
                  {entries.map(entry => {
                    const Icon = entry.icon;
                    return (
                      <CommandItem
                        key={entry.id}
                        value={`${entry.title} ${entry.description} ${entry.keywords}`}
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
                          <div className="text-sm font-medium leading-tight">{entry.title}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{entry.description}</div>
                        </div>
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
                <kbd className="rounded border bg-muted px-1 py-0.5 font-mono">↑↓</kbd> navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-muted px-1 py-0.5 font-mono">↵</kbd> select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" /> {TOOL_REGISTRY.length} tools indexed
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
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-muted/30 hover:bg-muted/60 text-xs text-muted-foreground transition-colors"
      title="Search tools (⌘K)"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Search tools…</span>
      <kbd className="hidden sm:inline-block pointer-events-none select-none rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
        ⌘K
      </kbd>
    </button>
  );
}
