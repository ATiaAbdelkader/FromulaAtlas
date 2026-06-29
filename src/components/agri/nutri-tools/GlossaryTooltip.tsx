'use client';

import { Fragment, type ReactNode, useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  GLOSSARY,
  GLOSSARY_CATEGORY_LABELS,
  type GlossaryCategory,
  type GlossaryEntry,
} from '@/lib/glossary';

/**
 * GlossaryTooltip — wraps a string and auto-detects any glossary term/alias
 * inside it, rendering the matches as hoverable dashed-underline links that
 * open a Popover with the definition. Detection is memoised so the regex scan
 * only re-runs when the input text changes.
 *
 * GlossaryTerm — manually wraps a single known term (useful when you already
 * hold a GlossaryEntry reference and don't want to rely on substring scanning).
 */

// --- Static lookup tables (built once at module load) -----------------------

interface TermPair {
  /** Original-case string (term or alias). */
  text: string;
  entry: GlossaryEntry;
}

/** All (term + alias) pairs from GLOSSARY, sorted longest-first so the regex
 *  alternation prefers longer matches (e.g. "meq/100g" over "meq"). */
const TERM_PAIRS: TermPair[] = (() => {
  const pairs: TermPair[] = [];
  for (const entry of GLOSSARY) {
    pairs.push({ text: entry.term, entry });
    for (const alias of entry.aliases) pairs.push({ text: alias, entry });
  }
  pairs.sort((a, b) => b.text.length - a.text.length);
  return pairs;
})();

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Single shared regex with all term/alias alternatives. Because the longest
 * strings come first in the alternation, JS's regex engine tries them in
 * order at each position and prefers the longest match.
 */
const TERM_REGEX = new RegExp(
  `(${TERM_PAIRS.map(p => escapeRegex(p.text)).join('|')})`,
  'giu',
);

/** Lowercased term/alias → entry lookup so we can resolve a matched string
 *  back to its glossary entry regardless of the original case in the text. */
const LOWER_LOOKUP = new Map<string, GlossaryEntry>();
for (const p of TERM_PAIRS) {
  const key = p.text.toLowerCase();
  if (!LOWER_LOOKUP.has(key)) LOWER_LOOKUP.set(key, p.entry);
}

const CATEGORY_BADGE_CLASS: Record<GlossaryCategory, string> = {
  soil: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900',
  water: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-900',
  fertilizer: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
  plant: 'bg-lime-100 text-lime-800 dark:bg-lime-950/60 dark:text-lime-300 border-lime-200 dark:border-lime-900',
  climate: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-900',
  units: 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200 dark:border-violet-900',
};

// --- GlossaryTerm (single, manually-wrapped entry) --------------------------

export interface GlossaryTermProps {
  /** The glossary entry to display. */
  entry: GlossaryEntry;
  /** The exact text that should be rendered as the trigger. Defaults to
   *  `entry.term` when omitted. Pass the surrounding text if you want to
   *  preserve the original case/wording. */
  matchedText?: string;
  /** Or pass children if you want full control over the trigger content. */
  children?: ReactNode;
}

export function GlossaryTerm({ entry, matchedText, children }: GlossaryTermProps) {
  const [open, setOpen] = useState(false);
  const label = children ?? matchedText ?? entry.term;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={e => e.preventDefault()}
          className="font-medium text-emerald-700 dark:text-emerald-300 underline decoration-dashed decoration-emerald-400/70 underline-offset-2 hover:text-emerald-800 dark:hover:text-emerald-200 hover:decoration-emerald-500 cursor-help align-baseline"
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 text-sm p-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <span className="font-semibold leading-tight">{entry.term}</span>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 h-5 ${CATEGORY_BADGE_CLASS[entry.category]}`}
          >
            {GLOSSARY_CATEGORY_LABELS[entry.category]}
          </Badge>
        </div>
        <p className="text-xs leading-relaxed">{entry.short}</p>
        <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
          {entry.long}
        </p>
      </PopoverContent>
    </Popover>
  );
}

// --- GlossaryTooltip (auto-scan wrapper) ------------------------------------

export interface GlossaryTooltipProps {
  /** Text to scan for glossary terms. */
  text: string;
  /** Optional className applied to the wrapping span. */
  className?: string;
}

export function GlossaryTooltip({ text, className }: GlossaryTooltipProps) {
  const nodes = useMemo(() => {
    if (!text) return null;
    const out: ReactNode[] = [];
    let lastIdx = 0;
    let key = 0;
    for (const m of text.matchAll(TERM_REGEX)) {
      const start = m.index ?? 0;
      const end = start + m[0].length;
      if (start > lastIdx) {
        out.push(<Fragment key={key++}>{text.slice(lastIdx, start)}</Fragment>);
      }
      const entry = LOWER_LOOKUP.get(m[0].toLowerCase());
      if (entry) {
        out.push(<GlossaryTerm key={key++} entry={entry} matchedText={m[0]} />);
      } else {
        out.push(<Fragment key={key++}>{m[0]}</Fragment>);
      }
      lastIdx = end;
    }
    if (lastIdx < text.length) {
      out.push(<Fragment key={key++}>{text.slice(lastIdx)}</Fragment>);
    }
    if (out.length === 0) return <>{text}</>;
    return <>{out}</>;
  }, [text]);

  return <span className={className}>{nodes}</span>;
}
