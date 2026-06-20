import data from '@/data/agri_formulas.json';
import type { Handbook, Formula } from './types';

export const handbook: Handbook = data as Handbook;

export const allFormulas: Formula[] = handbook.all_formulas;

// Build a list of all parts with their formula counts for navigation
export const partsWithCounts = handbook.parts.map(part => {
  const formulaCount = part.chapters.reduce((sum, ch) => {
    return sum + ch.formulas.length + ch.sub_sections.reduce((s, ss) => s + ss.formulas.length, 0);
  }, 0);
  return {
    roman: part.roman,
    title: part.title,
    chapterCount: part.chapters.length,
    formulaCount,
    chapters: part.chapters.map(ch => ({
      number: ch.number,
      title: ch.title,
      formulaCount: ch.formulas.length + ch.sub_sections.reduce((s, ss) => s + ss.formulas.length, 0),
    })),
  };
});

// Distinct parts for filtering
export const distinctParts = handbook.parts.map(p => ({
  roman: p.roman,
  title: p.title,
}));
