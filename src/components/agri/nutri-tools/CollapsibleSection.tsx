'use client';

import { useState, useEffect, useRef } from 'react';
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
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <div className="flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors">
        <button onClick={toggle} className="flex-1 flex items-center gap-3 text-left min-w-0">
          {Icon && (
            <div className="flex items-center justify-center h-9 w-9 rounded-lg flex-shrink-0" style={{ background: `${color}20`, color }}>
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold leading-tight">{title}</div>
            {description && <div className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">{description}</div>}
          </div>
          <div className="flex items-center justify-center h-7 w-7 rounded-md flex-shrink-0 text-muted-foreground hover:bg-muted transition-colors" style={open ? { color } : undefined}>
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>
        {onReset && open && (
          <button
            onClick={(e) => { e.stopPropagation(); onReset(); }}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
            title="Reset to defaults"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>
      {mounted && open && (
        <div className="border-t border-border">
          {enableExport && (
            <div className="px-4 pt-3">
              <ToolExportLite title={title} description={description} />
            </div>
          )}
          <div className="collapsible-body">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
