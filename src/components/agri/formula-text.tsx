'use client';

import { useMemo, type ReactNode } from 'react';
import { glossaryTerms } from '@/lib/glossary';
import { GlossaryTooltip } from './glossary-tooltip';

interface FormulaTextProps {
  /** Raw text to render — may include glossary terms as substrings. */
  children: string;
  /** Extra className on the wrapping span */
  className?: string;
}

interface Segment {
  text: string;
  term?: string;
}

/**
 * Build a sorted list of (term, aliases) regex matches to scan for. We only
 * consider canonical terms + aliases of length ≥ 3 to avoid noise.
 *
 * The matcher is case-insensitive and whole-word (using \b) so that, e.g.,
 * "Kc" does not match inside "kick".
 */
function buildMatcher(terms: typeof glossaryTerms): { regex: RegExp; lookup: Map<string, string> } {
  const lookup = new Map<string, string>(); // lowercase match → canonical term
  const needles: string[] = [];
  for (const t of terms) {
    const candidates = [t.term, ...(t.aliases ?? [])]
      .map((s) => s.trim())
      .filter((s) => s.length >= 3);
    for (const c of candidates) {
      const key = c.toLowerCase();
      if (!lookup.has(key)) lookup.set(key, t.term);
      needles.push(c);
    }
  }
  // Sort longest-first so longer aliases win over shorter substrings.
  needles.sort((a, b) => b.length - a.length);
  // Escape regex special chars and join with word boundaries.
  const escaped = needles
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  const regex = new RegExp(`\\b(${escaped})\\b`, 'gi');
  return { regex, lookup };
}

/**
 * Render a string with glossary terms wrapped in interactive tooltips.
 * Terms are matched case-insensitively and converted to <GlossaryTooltip>
 * elements; everything else is rendered as plain text.
 */
export function FormulaText({ children, className }: FormulaTextProps) {
  const { regex, lookup } = useMemo(() => buildMatcher(glossaryTerms), []);

  const segments = useMemo<Segment[]>(() => {
    if (!children) return [];
    const out: Segment[] = [];
    let lastIndex = 0;
    const matches = [...children.matchAll(regex)];
    if (matches.length === 0) {
      return [{ text: children }];
    }
    for (const m of matches) {
      const idx = m.index ?? 0;
      if (idx > lastIndex) {
        out.push({ text: children.slice(lastIndex, idx) });
      }
      const matched = m[0];
      const canonical = lookup.get(matched.toLowerCase());
      out.push({ text: matched, term: canonical });
      lastIndex = idx + matched.length;
    }
    if (lastIndex < children.length) {
      out.push({ text: children.slice(lastIndex) });
    }
    return out;
  }, [children, regex, lookup]);

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.term) {
          return (
            <GlossaryTooltip key={i} term={seg.term}>
              {seg.text}
            </GlossaryTooltip>
          );
        }
        return <span key={i}>{seg.text}</span>;
      })}
    </span>
  );
}

export default FormulaText;

// Re-export so callers can opt into raw tooltip usage too.
export type { ReactNode };
