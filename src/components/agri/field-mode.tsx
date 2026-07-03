'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  X,
  Calculator,
  Smartphone,
  ChevronRight,
  Sprout,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FormulaDetailDialog } from '@/components/agri/formula-detail-dialog';
import { allFormulas } from '@/lib/formulas-data';
import { hasCalculator } from '@/components/agri/formula-card';
import type { Formula } from '@/lib/types';
import { useUserStore } from '@/lib/user-store';
import { useLanguageStore } from '@/lib/language-store';
import { cn } from '@/lib/utils';

/**
 * The 5 most commonly used calculators in the field. These get a dedicated
 * quick-access bar at the top of the Field Mode overlay so workers can
 * reach them with a single tap.
 */
const QUICK_ACCESS_CODES = ['2.1', '2.2', '4.1', '6.1', '6.4'] as const;

/**
 * Short, friendly labels for the quick-access chips. The actual formula
 * `name` from the handbook is often long (e.g. "Net Irrigation Requirement
 * (NIR)"), so we use these compact labels in the 80px-wide chips.
 */
const QUICK_ACCESS_LABELS: Record<string, string> = {
  '2.1': 'Plant Pop.',
  '2.2': 'Seed Rate',
  '4.1': 'Fertilizer',
  '6.1': 'NIR',
  '6.4': 'WUE',
};

/**
 * FieldModeButton — a header button that opens a full-screen, touch-optimized
 * overlay listing every calculator-enabled formula in the atlas.
 *
 * The component is self-contained: it manages its own open/close state, its
 * own search query, and its own FormulaDetailDialog instance. The host page
 * only needs to render `<FieldModeButton />` somewhere in the header.
 *
 * Design goals:
 *  - Big tap targets (≥ 56px height per row) for gloved or wet hands.
 *  - Minimal cognitive load: no part/chapter trees, just a flat searchable
 *    list of calculators.
 *  - Works in portrait AND landscape (overlay is `fixed inset-0` and the
 *    list scrolls independently).
 *  - Cairo font + emerald accents to match the rest of the app.
 */
export function FieldModeButton() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const addRecent = useUserStore((s) => s.addRecent);
  const language = useLanguageStore((s) => s.language);

  // Every formula that has a calculator wired up — these are the only ones
  // we surface in Field Mode.
  const calculatorFormulas = useMemo(
    () => allFormulas.filter((f) => hasCalculator(f.code)),
    [],
  );

  // Resolve the 5 quick-access formulas from their codes. We filter out any
  // that don't resolve (defensive — they always should) so the type narrows
  // cleanly to `Formula[]`.
  const quickAccess = useMemo<Formula[]>(
    () =>
      QUICK_ACCESS_CODES
        .map((code) => allFormulas.find((f) => f.code === code))
        .filter((f): f is Formula => Boolean(f)),
    [],
  );

  // Filter the calculator list by the search query. Matching is case-
  // insensitive across code, name (EN + AR), chapter, and part.
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return calculatorFormulas;
    const terms = q.split(/\s+/).filter(Boolean);
    return calculatorFormulas.filter((f) => {
      const haystack =
        `${f.code} ${f.name} ${f.name_ar ?? ''} ${f.chapter} ${f.part}`.toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }, [calculatorFormulas, searchQuery]);

  const handleSelect = (formula: Formula) => {
    setSelectedFormula(formula);
    setDialogOpen(true);
    addRecent(formula.code);
  };

  const handleSelectByCode = (code: string) => {
    const f = allFormulas.find((x) => x.code === code);
    if (!f) return;
    setSelectedFormula(f);
    setDialogOpen(true);
    addRecent(code);
  };

  // Lock background scroll while the overlay is open. We restore the
  // previous overflow value on cleanup so we don't clobber a host page
  // that already manipulates `body.overflow`.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape closes Field Mode (unless the formula dialog is open — then
  // Radix handles Escape for the dialog first).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !dialogOpen) {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dialogOpen]);

  const totalCount = calculatorFormulas.length;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => setOpen(true)}
        title="Field Mode"
        aria-label="Open Field Mode"
      >
        <Smartphone className="h-4 w-4" />
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-background flex flex-col font-arabic"
          role="dialog"
          aria-modal="true"
          aria-label="Field Mode — calculator quick access"
        >
          {/* Header bar */}
          <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40 flex-shrink-0 safe-top">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-700 text-white flex-shrink-0 shadow-sm">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold leading-tight tracking-tight">
                  Field Mode
                </h2>
                <p className="text-xs text-muted-foreground truncate">
                  {totalCount} calculators · touch-optimized
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 flex-shrink-0"
              onClick={() => setOpen(false)}
              aria-label="Exit Field Mode"
            >
              <X className="h-5 w-5" />
            </Button>
          </header>

          {/* Quick-access bar — 5 most-used calculators */}
          <nav
            className="flex gap-2 overflow-x-auto px-4 py-3 border-b border-border bg-muted/30 flex-shrink-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Quick access calculators"
          >
            {quickAccess.map((f) => (
              <button
                key={f.code}
                onClick={() => handleSelect(f)}
                className="flex flex-col items-center justify-center gap-1.5 min-w-[84px] px-3 py-2.5 rounded-xl bg-white dark:bg-card border-2 border-emerald-200 dark:border-emerald-900 hover:border-emerald-400 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 active:scale-95 transition-all flex-shrink-0"
              >
                <Badge
                  variant="outline"
                  className="font-mono text-xs font-bold bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900"
                >
                  {f.code}
                </Badge>
                <span className="text-[11px] font-medium text-foreground text-center leading-tight">
                  {QUICK_ACCESS_LABELS[f.code] ?? f.name.split(' ').slice(0, 2).join(' ')}
                </span>
              </button>
            ))}
          </nav>

          {/* Search bar */}
          <div className="px-4 py-3 border-b border-border flex-shrink-0 bg-background">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search calculators by name, code, or keyword…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-10 h-12 text-base"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Calculator list — independently scrollable, big tap targets */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="rounded-full bg-muted p-4 mb-3">
                  <Search className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold mb-1">No calculators match</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Try a different keyword, or clear the search to see all {totalCount} calculators.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-1.5"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-3.5 w-3.5" /> Clear search
                </Button>
              </div>
            ) : (
              <>
                {/* Result count line — hidden when no search is active */}
                {searchQuery.trim() && (
                  <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/30 border-b border-border">
                    {filtered.length} of {totalCount} calculators
                  </div>
                )}
                <ul className="divide-y divide-border">
                  {filtered.map((f) => {
                    const name =
                      language === 'ar' && f.name_ar ? f.name_ar : f.name;
                    return (
                      <li key={`${f.code}-${f.part}`}>
                        <button
                          onClick={() => handleSelect(f)}
                          className="w-full flex items-center gap-3 px-4 min-h-[56px] py-3 text-left hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 active:bg-emerald-50 dark:active:bg-emerald-950/40 transition-colors"
                        >
                          <Badge
                            variant="outline"
                            className="font-mono text-xs font-bold bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900 flex-shrink-0 min-w-[52px] justify-center"
                          >
                            {f.code}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <span className="block text-sm font-medium leading-tight line-clamp-2">
                              {name}
                            </span>
                            <span className="block text-[11px] text-muted-foreground mt-0.5 truncate">
                              {f.chapter}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0 text-emerald-600 dark:text-emerald-500">
                            <span className="flex items-center justify-center h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/60">
                              <Calculator className="h-4 w-4" />
                            </span>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {/* Bottom padding so the last item isn't flush against the
                    device's home indicator / safe area. */}
                <div className="h-6 safe-bottom" aria-hidden />
              </>
            )}
          </div>

          {/* Footer hint — tiny, just to anchor the bottom edge */}
          <footer className="flex-shrink-0 border-t border-border bg-muted/30 px-4 py-2 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground safe-bottom">
            <Sprout className="h-3 w-3 text-emerald-600" />
            <span>Tap any calculator to open it. Press Esc to exit.</span>
          </footer>
        </div>
      )}

      {/* Formula detail dialog — rendered via Radix Portal at the end of
          <body>, so it stacks above the Field Mode overlay automatically. */}
      <FormulaDetailDialog
        formula={selectedFormula}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSelectFormula={handleSelectByCode}
      />
    </>
  );
}

export default FieldModeButton;
