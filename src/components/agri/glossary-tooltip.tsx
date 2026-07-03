'use client';

import { useMemo, useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { BookText } from 'lucide-react';
import { findGlossaryTerm, type GlossaryCategory } from '@/lib/glossary';
import { cn } from '@/lib/utils';

const categoryTone: Record<GlossaryCategory, string> = {
  soil: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
  water: 'bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300',
  crop: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
  livestock: 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300',
  climate: 'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300',
  economics: 'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300',
  nutrition: 'bg-lime-100 dark:bg-lime-950/40 text-lime-700 dark:text-lime-300',
  irrigation: 'bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300',
};

interface GlossaryTooltipProps {
  /** The term to look up. Falls back to a fuzzy substring search. */
  term: string;
  /** Children rendered as the trigger. Defaults to the term itself. */
  children?: React.ReactNode;
  /** Render the trigger as a dashed underline link */
  underline?: boolean;
}

/**
 * Hover/click to reveal the glossary definition for a term. Uses the shared
 * `findGlossaryTerm` helper so it works with canonical names AND aliases.
 */
export function GlossaryTooltip({
  term,
  children,
  underline = true,
}: GlossaryTooltipProps) {
  const [open, setOpen] = useState(false);

  const entry = useMemo(() => findGlossaryTerm(term), [term]);

  if (!entry) {
    return <span>{children ?? term}</span>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'inline-flex items-baseline font-medium cursor-help text-emerald-700 dark:text-emerald-400',
            'rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30',
            underline && 'border-b border-dashed border-emerald-400 dark:border-emerald-700',
          )}
          title={`Glossary: ${entry.term}`}
        >
          {children ?? term}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-72 p-3 text-xs space-y-2"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 font-semibold text-sm">
            <BookText className="h-3.5 w-3.5 text-emerald-600" />
            {entry.term}
          </div>
          <Badge
            variant="outline"
            className={cn(
              'text-[9px] capitalize px-1 py-0 h-4 border-0',
              categoryTone[entry.category],
            )}
          >
            {entry.category}
          </Badge>
        </div>
        <p className="leading-relaxed text-muted-foreground">{entry.definition}</p>
        {entry.aliases && entry.aliases.length > 0 && (
          <div className="text-[10px] text-muted-foreground">
            <span className="font-medium">Also: </span>
            {entry.aliases.join(', ')}
          </div>
        )}
        {entry.relatedFormulas && entry.relatedFormulas.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap pt-1">
            <span className="text-[10px] text-muted-foreground font-medium">Related:</span>
            {entry.relatedFormulas.map((code) => (
              <Badge
                key={code}
                variant="outline"
                className="text-[9px] font-mono px-1 py-0 h-4"
              >
                {code}
              </Badge>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default GlossaryTooltip;
