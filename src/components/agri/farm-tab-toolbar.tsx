'use client';

/**
 * FarmTabToolbar — sticky toolbar at the top of the Farm tab with:
 *   - Search input that filters CollapsibleSections by title/description
 *   - 'Expand all' / 'Collapse all' / 'Reset layout' buttons
 *
 * How the search works:
 *   - Every CollapsibleSection has `data-farm-tool` attribute
 *   - Each section's title + description is in its DOM text content
 *   - On search input, we query all `[data-farm-tool]` elements,
 *     check if their text matches the query, and hide non-matches
 *   - Matching sections are auto-expanded (localStorage set to 'true')
 *   - Non-matching sections are hidden (display: none)
 *   - When search is cleared, all sections are shown again
 *
 * How Expand/Collapse all works:
 *   - Expand: set all `collapse_*` localStorage keys to 'true', reload page
 *   - Collapse: set all to 'false', reload
 *   - Reset: remove all `collapse_*` keys, reload (back to defaultOpen state)
 *
 * Trilingual (EN/FR/AR via copyFor).
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, ChevronDown, ChevronUp, RotateCcw, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation, copyFor } from '@/lib/language-store';

export function FarmTabToolbar() {
  const { language, isRTL } = useTranslation();
  const [query, setQuery] = useState('');
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const tr = (en: string, fr: string, ar: string) => copyFor(language, en, ar, fr);

  /** Collect all CollapsibleSection elements in the Farm tab. */
  const getSections = useCallback(() => {
    return Array.from(document.querySelectorAll('[data-farm-tool]')) as HTMLElement[];
  }, []);

  /** Filter sections by query — hide non-matches, auto-expand matches. */
  const filterSections = useCallback((q: string) => {
    const sections = getSections();
    const normalized = q.trim().toLowerCase();
    let matches = 0;

    for (const section of sections) {
      const text = (section.textContent || '').toLowerCase();
      const matchesQuery = !normalized || text.includes(normalized);

      if (matchesQuery) {
        section.style.display = '';
        matches++;
        // Auto-expand matching sections
        if (normalized) {
          const storageKey = section.getAttribute('data-storage-key');
          if (storageKey) {
            try { localStorage.setItem(storageKey, 'true'); } catch { /* ignore */ }
          }
          // Force-open the section visually
          section.setAttribute('data-state', 'open');
          const panel = section.querySelector('[data-panel]');
          if (panel) {
            (panel as HTMLElement).style.display = '';
          }
        }
      } else {
        section.style.display = 'none';
      }
    }

    setMatchCount(normalized ? matches : null);

    // Also show/hide SubHeaders based on whether any children are visible
    const subHeaders = Array.from(document.querySelectorAll('[data-subheader-group]')) as HTMLElement[];
    for (const sh of subHeaders) {
      const groupId = sh.getAttribute('data-subheader-group');
      if (!groupId) continue;
      const siblings = Array.from(document.querySelectorAll(`[data-group="${groupId}"]`)) as HTMLElement[];
      const anyVisible = siblings.some((s) => s.style.display !== 'none');
      sh.style.display = anyVisible ? '' : 'none';
    }
  }, [getSections]);

  // Debounce the filter
  useEffect(() => {
    const timer = setTimeout(() => filterSections(query), 150);
    return () => clearTimeout(timer);
  }, [query, filterSections]);

  const clearSearch = () => {
    setQuery('');
    setMatchCount(null);
    // Restore all sections
    const sections = getSections();
    for (const section of sections) {
      section.style.display = '';
    }
    // Restore subheaders
    const subHeaders = Array.from(document.querySelectorAll('[data-subheader-group]')) as HTMLElement[];
    for (const sh of subHeaders) {
      sh.style.display = '';
    }
  };

  const expandAll = () => {
    const sections = getSections();
    for (const section of sections) {
      const storageKey = section.getAttribute('data-storage-key');
      if (storageKey) {
        try { localStorage.setItem(storageKey, 'true'); } catch { /* ignore */ }
      }
    }
    // Reload to apply
    window.location.reload();
  };

  const collapseAll = () => {
    const sections = getSections();
    for (const section of sections) {
      const storageKey = section.getAttribute('data-storage-key');
      if (storageKey) {
        try { localStorage.setItem(storageKey, 'false'); } catch { /* ignore */ }
      }
    }
    window.location.reload();
  };

  const resetLayout = () => {
    if (!confirm(tr(
      'Reset all sections to their default state? This will forget your expand/collapse preferences.',
      'Réinitialiser toutes les sections à leur état par défaut ? Cela oubliera vos préférences.',
      'إعادة ضبط كل الأقسام إلى حالتها الافتراضية؟ سيؤدي هذا إلى نسيان تفضيلاتك.',
    ))) return;

    const keysToRemove = Object.keys(localStorage).filter((k) => k.startsWith('collapse_'));
    for (const k of keysToRemove) {
      try { localStorage.removeItem(k); } catch { /* ignore */ }
    }
    window.location.reload();
  };

  // Keyboard shortcut: '/' to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="sticky top-[57px] z-20 bg-background/95 backdrop-blur border-b border-border rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr(
              'Search 80+ tools… (press / to focus)',
              'Rechercher 80+ outils… (appuyez sur /)',
              'ابحث في 80+ أداة… (اضغط /)',
            )}
            className="h-9 ps-9 pe-9 text-sm"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute end-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
              aria-label={tr('Clear search', 'Effacer la recherche', 'مسح البحث')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Match count badge */}
        {matchCount !== null && (
          <Badge variant={matchCount > 0 ? 'secondary' : 'destructive'} className="text-[10px] shrink-0">
            {matchCount} {matchCount === 1 ? tr('match', 'résultat', 'مطابقة') : tr('matches', 'résultats', 'مطابقة')}
          </Badge>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-2 text-[10px] gap-1"
            onClick={expandAll}
            title={tr('Expand all sections', 'Déplier toutes les sections', 'توسيع كل الأقسام')}
          >
            <ChevronDown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{tr('Expand', 'Déplier', 'وسّع')}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-2 text-[10px] gap-1"
            onClick={collapseAll}
            title={tr('Collapse all sections', 'Replier toutes les sections', 'طيّ كل الأقسام')}
          >
            <ChevronUp className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{tr('Collapse', 'Replier', 'اطوِ')}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-2 text-[10px] gap-1"
            onClick={resetLayout}
            title={tr('Reset layout to defaults', 'Réinitialiser la disposition', 'إعادة الضبط')}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{tr('Reset', 'Réinit.', 'ضبط')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
