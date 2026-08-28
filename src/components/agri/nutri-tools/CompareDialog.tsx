'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import type { ToolMeta } from './FreeToolsSection';
import { CATEGORY_COLORS, CATEGORY_DOT_COLORS } from './FreeToolsSection';
import { ToolExportBar } from './ToolExportBar';

export interface CompareDialogProps {
  tools: [ToolMeta, ToolMeta];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Side-by-side comparison dialog — renders two tools in a 50/50 split on
 * desktop (lg:grid-cols-2) and stacked on mobile (grid-cols-1 with two equal
 * rows). Each column has its own header (icon + name + category badge) and
 * its own independently scrollable body. Uses the same near-fullscreen
 * DialogContent shell as the standard tool dialog.
 */
export function CompareDialog({ tools, open, onOpenChange }: CompareDialogProps) {
  const [left, right] = tools;
  const LeftIcon = left.icon;
  const RightIcon = right.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[1800px] w-[98vw] !max-h-[96vh] h-[96vh] overflow-hidden p-0 gap-0 flex flex-col">
        <DialogHeader className="px-5 py-3 border-b border-border flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
              <LeftIcon className="h-4 w-4" />
            </span>
            <span className="font-semibold">{left.name}</span>
            <span className="text-muted-foreground text-xs font-normal">vs</span>
            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
              <RightIcon className="h-4 w-4" />
            </span>
            <span className="font-semibold">{right.name}</span>
          </DialogTitle>
          <DialogDescription className="text-xs mt-1">
            Side-by-side comparison — each panel scrolls independently.
            Use the export bar in each column to copy or share that tool&apos;s results.
          </DialogDescription>
        </DialogHeader>

        {/* Two-column body — 50/50 on desktop, stacked on mobile */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 grid-rows-2 lg:grid-rows-1">
          <CompareColumn tool={left} />
          <CompareColumn tool={right} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CompareColumn({ tool }: { tool: ToolMeta }) {
  const Icon = tool.icon;
  return (
    <div className="flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-border last:border-r-0">
      <header className="flex-shrink-0 px-4 py-2.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span
            className="flex items-center justify-center h-7 w-7 rounded-md"
            style={{ background: `${CATEGORY_DOT_COLORS[tool.category]}20`, color: CATEGORY_DOT_COLORS[tool.category] }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-semibold leading-tight">{tool.name}</h3>
          <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[tool.category]}`}>
            {tool.category}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{tool.description}</p>
      </header>
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <ToolExportBar tool={tool} />
        <div className="mt-3">
          <tool.Component />
        </div>
      </div>
    </div>
  );
}

/** Small inline close affordance (the Radix DialogContent also renders one). */
export function CompareCloseHint() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
      <X className="h-3 w-3" /> Esc to close
    </span>
  );
}
