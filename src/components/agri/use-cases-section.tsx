'use client';

import { Zap, ArrowRight, Clock, Droplets, CloudRain, ClipboardCheck, Sprout, PawPrint, Leaf, Sun, Calculator } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { workflows, type Workflow } from '@/lib/workflows';
import { cn } from '@/lib/utils';

interface UseCasesSectionProps {
  onLaunch: (workflow: Workflow) => void;
}

const iconMap: Record<string, typeof Sprout> = {
  Sprout, PawPrint, Leaf, Sun, Calculator, Droplets, CloudRain, ClipboardCheck,
};

const domainMeta: Record<string, { color: string; bg: string; border: string; label: string }> = {
  crop: { color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-900', label: 'Crop' },
  animal: { color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-900', label: 'Animal' },
  'cross-cutting': { color: 'text-violet-700 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40', border: 'border-violet-200 dark:border-violet-900', label: 'Applied' },
};

export function UseCasesSection({ onLaunch }: UseCasesSectionProps) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-4 w-4 text-emerald-600" />
            <h2 className="text-lg font-semibold tracking-tight">Guided Workflows</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Step-by-step calculators that solve common farm tasks. Pick a goal and we&apos;ll walk you through it.
          </p>
        </div>
        <Badge variant="outline" className="text-xs">{workflows.length} workflows</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {workflows.map(wf => {
          const Icon = iconMap[wf.icon] ?? Zap;
          const meta = domainMeta[wf.domain];
          return (
            <button
              key={wf.id}
              onClick={() => onLaunch(wf)}
              className={cn('group relative text-left rounded-xl border-2 p-4 transition-all hover:shadow-lg hover:-translate-y-0.5 bg-card overflow-hidden', meta.border)}
            >
              <div className={cn('absolute top-0 left-0 right-0 h-1', meta.bg)} />
              <div className="flex items-start justify-between gap-2 mb-3 mt-1">
                <div className={cn('flex items-center justify-center h-9 w-9 rounded-lg flex-shrink-0', meta.bg, meta.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1 flex-wrap justify-end">
                  <Badge variant="outline" className={cn('text-[10px] font-medium', meta.bg, meta.color, meta.border)}>{meta.label}</Badge>
                  <Badge variant="outline" className="text-[10px] font-normal gap-1"><Clock className="h-2.5 w-2.5" />{wf.duration}</Badge>
                </div>
              </div>
              <h3 className="text-base font-semibold leading-tight mb-2 tracking-tight">{wf.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-3">{wf.summary}</p>
              <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                {wf.steps.map((step, idx) => (
                  <span key={idx} className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{idx + 1}</span>
                ))}
                <span className="text-[10px] text-muted-foreground ml-1">{wf.steps.length} steps</span>
              </div>
              <div className={cn('flex items-center gap-1.5 text-xs font-medium transition-colors', meta.color)}>
                Start workflow
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
