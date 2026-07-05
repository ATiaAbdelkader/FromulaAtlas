'use client';

// Global keyboard shortcuts for the Formula Atlas.
//
// Usage:
//   const { ShortcutHelp } = useKeyboardShortcuts({
//     onFocusSearch: () => inputRef.current?.focus(),
//     onToggleFavorite: () => ...,
//     onOpenCalculators: () => setActiveTab('tools'),
//     onOpenHome: () => setActiveTab('home'),
//     onClearFilters: () => reset(),
//     onClose: () => setOpen(false),
//   });
//   return (<>{...}{ShortcutHelp}</>);
//
// `ShortcutHelp` is a ready-to-render React element (the help dialog) that
// you drop into your component tree once. It opens automatically when the
// user presses `?`.
//
// Keys handled:
//   /        focus the search box
//   f        toggle favorite on the active formula
//   c        jump to calculators/tools tab
//   h        jump to home tab
//   x        clear active filters
//   Escape   close the active dialog/overlay
//   ?        toggle this help overlay

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard } from 'lucide-react';

// --- Types ----------------------------------------------------------------

export interface ShortcutHandlers {
  /** `/` — focus the search box */
  onFocusSearch?: () => void;
  /** `f` — toggle favorite on the active formula */
  onToggleFavorite?: () => void;
  /** `c` — jump to the calculators/tools tab */
  onOpenCalculators?: () => void;
  /** `h` — jump to the home tab */
  onOpenHome?: () => void;
  /** `x` — clear active filters */
  onClearFilters?: () => void;
  /** `Escape` — close the active dialog/overlay */
  onClose?: () => void;
}

interface ShortcutDef {
  key: string;
  label: string;
  description: string;
  /** if true, fires even when typing in an input */
  allowInInput?: boolean;
}

const SHORTCUTS: ShortcutDef[] = [
  { key: '/', label: 'Focus search', description: 'Jump to the search box.' },
  { key: 'f', label: 'Toggle favorite', description: 'Star/unstar the active formula.' },
  { key: 'c', label: 'Calculators', description: 'Switch to the Tools tab.' },
  { key: 'h', label: 'Home', description: 'Switch to the Home tab.' },
  { key: 'x', label: 'Clear filters', description: 'Reset the active part/section/search filters.' },
  { key: 'Esc', label: 'Close', description: 'Close the active dialog or overlay.', allowInInput: true },
  { key: '?', label: 'Help', description: 'Show this keyboard-shortcut help.' },
];

// --- Helpers --------------------------------------------------------------

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (el.isContentEditable) return true;
  // cmdk / radix command input
  if (el.closest('[cmdk-input]')) return true;
  return false;
}

// --- Module-level dialog (stable component identity) ---------------------

function ShortcutHelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Press a key anywhere on the page to trigger an action. Shortcuts
            are ignored while typing in a text field (except{' '}
            <kbd className="font-mono text-[10px]">Esc</kbd>).
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 mt-2">
          {SHORTCUTS.map((s) => (
            <li
              key={s.key}
              className="flex items-center justify-between gap-3 py-1.5 border-b border-border/40 last:border-0"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium leading-tight">
                  {s.label}
                </div>
                <div className="text-xs text-muted-foreground leading-tight mt-0.5">
                  {s.description}
                </div>
              </div>
              <Badge
                variant="outline"
                className="font-mono text-xs px-2 py-1 min-w-[2.5rem] justify-center"
              >
                {s.key}
              </Badge>
            </li>
          ))}
        </ul>
        <div className="mt-3 text-[11px] text-muted-foreground text-center">
          Press{' '}
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded border bg-muted">
            ?
          </kbd>{' '}
          or{' '}
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded border bg-muted">
            Esc
          </kbd>{' '}
          to close.
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Hook -----------------------------------------------------------------

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const [helpOpen, setHelpOpen] = useState(false);

  // Keep the latest handlers in a ref so the global listener never goes
  // stale, without forcing a re-subscribe on every render.
  const handlersRef = useRef<ShortcutHandlers>(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const openHelp = useCallback(() => setHelpOpen(true), []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);
  const toggleHelp = useCallback(() => setHelpOpen((o) => !o), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Never intercept modifier-key chords (let the browser handle
      // Cmd/Ctrl+key shortcuts like reload).
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key;

      // Escape fires even inside inputs.
      if (key === 'Escape') {
        if (helpOpen) {
          setHelpOpen(false);
          e.preventDefault();
          return;
        }
        if (handlersRef.current.onClose) {
          handlersRef.current.onClose();
          // Don't preventDefault — let dialogs handle their own Escape too.
        }
        return;
      }

      // ? toggles help. The browser may need Shift on US layouts; we accept
      // both `?` and the unshifted form when shiftKey is pressed.
      if (key === '?' || (e.shiftKey && key === '/')) {
        e.preventDefault();
        toggleHelp();
        return;
      }

      // Remaining shortcuts are blocked while typing in a field.
      if (isTypingTarget(e.target)) return;

      switch (key) {
        case '/':
          if (handlersRef.current.onFocusSearch) {
            e.preventDefault();
            handlersRef.current.onFocusSearch();
          }
          break;
        case 'f':
        case 'F':
          if (handlersRef.current.onToggleFavorite) {
            e.preventDefault();
            handlersRef.current.onToggleFavorite();
          }
          break;
        case 'c':
        case 'C':
          if (handlersRef.current.onOpenCalculators) {
            e.preventDefault();
            handlersRef.current.onOpenCalculators();
          }
          break;
        case 'h':
        case 'H':
          if (handlersRef.current.onOpenHome) {
            e.preventDefault();
            handlersRef.current.onOpenHome();
          }
          break;
        case 'x':
        case 'X':
          if (handlersRef.current.onClearFilters) {
            e.preventDefault();
            handlersRef.current.onClearFilters();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [helpOpen, toggleHelp]);

  // --- ShortcutHelp element ----------------------------------------------
  // A ready-to-render React element (the help dialog). Drop it into your
  // component tree once: `{ShortcutHelp}`. Memoized so its identity stays
  // stable across renders that don't change `helpOpen`.

  const ShortcutHelp = useMemo(
    () => <ShortcutHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />,
    [helpOpen]
  );

  return {
    ShortcutHelp,
    openHelp,
    closeHelp,
    toggleHelp,
    helpOpen,
    /** the static shortcut list, for custom UI */
    shortcuts: SHORTCUTS,
  };
}

export default useKeyboardShortcuts;
