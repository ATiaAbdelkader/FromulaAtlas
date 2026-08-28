// Find formulas related to a given formula. Relatedness is scored by:
//   1. Same part (strong signal — same domain)
//   2. Same chapter/section (stronger — same topic)
//   3. Shared keywords in name / purpose / variables (weakest, tie-breaker)
//
// Returns the top-N most related formulas (excluding the source itself).

import { allFormulas } from '@/lib/formulas-data';
import type { Formula } from '@/lib/types';

// --- Keyword extraction ---------------------------------------------------

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'of', 'and', 'or', 'in', 'on', 'for', 'to', 'with',
  'by', 'at', 'from', 'as', 'is', 'are', 'be', 'this', 'that', 'it',
  'its', 'into', 'per', 'than', 'then', 'so', 'if', 'but', 'how',
  'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'will',
  'would', 'should', 'could', 'can', 'may', 'might', 'must', 'shall',
]);

function tokenize(text: string): Set<string> {
  if (!text) return new Set();
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return new Set(words);
}

function keywordsOf(f: Formula): Set<string> {
  return tokenize(`${f.name} ${f.purpose ?? ''} ${f.variables ?? ''} ${f.chapter ?? ''}`);
}

// --- Scoring --------------------------------------------------------------

const SCORE_SAME_CHAPTER = 10; // same part AND chapter
const SCORE_SAME_PART = 4; // same part only
const SCORE_KEYWORD_BASE = 1; // per shared keyword
const SCORE_KEYWORD_NAME = 3; // extra weight for shared name keywords

export interface RelatedFormula {
  formula: Formula;
  /** 0–1 normalized score for sorting/UI sizing */
  score: number;
  /** human-readable reason this formula is related */
  reasons: string[];
}

/**
 * Get the top-N formulas related to the given source formula.
 *
 * @param formula the source formula
 * @param limit   max results (default 6)
 */
export function getRelatedFormulas(formula: Formula, limit = 6): RelatedFormula[] {
  if (!formula) return [];
  const sourceKeywords = keywordsOf(formula);
  const sourceNameKeywords = tokenize(formula.name);

  const scored: RelatedFormula[] = [];

  for (const candidate of allFormulas) {
    if (candidate.code === formula.code && candidate.part === formula.part) {
      continue; // skip the source itself
    }

    let score = 0;
    const reasons: string[] = [];

    if (candidate.part === formula.part) {
      score += SCORE_SAME_PART;
      reasons.push('Same domain');
    }

    if (
      candidate.part === formula.part &&
      candidate.chapter_number === formula.chapter_number
    ) {
      score += SCORE_SAME_CHAPTER;
      reasons.push('Same section');
    }

    const candidateKeywords = keywordsOf(candidate);
    let shared = 0;
    for (const kw of sourceKeywords) {
      if (candidateKeywords.has(kw)) shared++;
    }
    if (shared > 0) {
      score += shared * SCORE_KEYWORD_BASE;
      reasons.push(`${shared} shared keyword${shared > 1 ? 's' : ''}`);
    }

    // Extra weight for shared name keywords (conceptually similar).
    const candidateNameKeywords = tokenize(candidate.name);
    let nameShared = 0;
    for (const kw of sourceNameKeywords) {
      if (candidateNameKeywords.has(kw)) nameShared++;
    }
    if (nameShared > 0) {
      score += nameShared * SCORE_KEYWORD_NAME;
      reasons.push('Similar name');
    }

    if (score === 0) continue;

    scored.push({ formula: candidate, score, reasons });
  }

  // Normalize scores.
  const maxScore = scored.reduce((m, r) => Math.max(m, r.score), 0) || 1;
  for (const r of scored) {
    r.score = r.score / maxScore;
  }

  // Sort by score desc, then by code asc for stable ordering.
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.formula.code.localeCompare(b.formula.code);
  });

  return scored.slice(0, limit);
}

/**
 * Convenience: get related formulas by code (looks up the source formula).
 */
export function getRelatedByCode(code: string, limit = 6): RelatedFormula[] {
  const source = allFormulas.find((f) => f.code === code);
  if (!source) return [];
  return getRelatedFormulas(source, limit);
}

export default getRelatedFormulas;
