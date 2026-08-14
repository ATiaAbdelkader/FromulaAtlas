'use client';

import { useId, useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { ToolExportLite } from './ToolExportLite';

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  defaultOpen?: boolean;
  storageKey?: string;
  /** When true, shows Copy/CSV/PDF/Share buttons inside the section body. */
  enableExport?: boolean;
  /** When provided, shows a Reset button that calls this callback. */
  onReset?: () => void;
  children: React.ReactNode;
}

export function CollapsibleSection({
  title, description, icon: Icon, color = '#16a34a',
  defaultOpen = false, storageKey, enableExport = false, onReset,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [mounted, setMounted] = useState(false);
  const generatedId = useId();
  const panelId = `${storageKey ?? generatedId}-panel`;
  const titleId = `${panelId}-title`;

  useEffect(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved !== null) setOpen(saved === 'true');
      } catch { /* ignore */ }
    }
    setMounted(true);
  }, [storageKey]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (storageKey) {
      try { localStorage.setItem(storageKey, String(next)); } catch { /* ignore */ }
    }
  };

  return (
    <section
      data-farm-tool
      data-state={open ? 'open' : 'closed'}
      className={`group overflow-hidden rounded-2xl border bg-card/95 shadow-sm shadow-black/[0.03] transition-all duration-200 hover:shadow-md hover:shadow-emerald-950/[0.04] ${
        open ? 'border-emerald-200/80 dark:border-emerald-900/70' : 'border-border/80'
      }`}
      aria-labelledby={titleId}
    >
      <div className="flex items-center gap-2 p-2.5 sm:gap-3 sm:p-3.5">
        <button
          type="button"
          onClick={toggle}
          aria-controls={panelId}
          aria-expanded={open}
            className="flex min-h-12 min-w-0 flex-1 touch-manipulation items-center gap-3 rounded-xl px-1.5 text-left outline-none transition-colors active:scale-[0.995] hover:bg-muted/45 focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-card"
        >
          {Icon && (
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-black/[0.04] transition-transform duration-200 group-hover:scale-[1.03] sm:h-11 sm:w-11"
              style={{ background: `${color}18`, color }}
              aria-hidden="true"
            >
              <Icon className="h-[18px] w-[18px]" />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span id={titleId} className="block text-sm font-semibold leading-snug tracking-[-0.01em] sm:text-[15px]">
              {title}
            </span>
            {description && (
              <span className="mt-0.5 block line-clamp-2 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                {description}
              </span>
            )}
          </span>
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:group-hover:bg-emerald-950/40 dark:group-hover:text-emerald-300"
            aria-hidden="true"
          >
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>
        {onReset && open && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onReset(); }}
            aria-label={`Reset ${title} to defaults`}
            className="flex min-h-10 touch-manipulation shrink-0 items-center gap-1 rounded-lg px-2.5 text-[10px] font-medium text-muted-foreground transition-colors active:scale-[0.98] hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 sm:min-h-10"
            title="Reset to defaults"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>
      {mounted && open && (
        <div id={panelId} role="region" aria-labelledby={titleId} className="border-t border-emerald-100/80 bg-muted/[0.12] dark:border-emerald-950/60">
          {enableExport && (
            <div className="px-3 pt-3 sm:px-5 sm:pt-4">
              <ToolExportLite title={title} description={description} />
            </div>
          )}
          <div className="collapsible-body min-w-0 px-0.5 pb-1 sm:px-1">
            {children}
          </div>
        </div>
      )}
    </section>
  );
}
