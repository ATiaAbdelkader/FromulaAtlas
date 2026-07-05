// Type definitions for the Formula Atlas

export interface Formula {
  code: string;
  name: string;
  formula: string;
  variables: string;
  purpose: string;
  example: string;
  pitfall: string;
  decision: string;
  notes: string;
  part: string;
  part_roman: string;
  chapter: string;
  chapter_number: number;
  sub_section?: string;
}

export interface SummaryTable {
  title: string;
  rows: string[][];
}

export interface SubSection {
  title: string;
  formulas: Formula[];
}

export interface Chapter {
  number: number;
  title: string;
  intro: string;
  sub_sections: SubSection[];
  formulas: Formula[];
  summary_tables: SummaryTable[];
  sustainability_notes: string[];
  decision_boxes: string[];
}

export interface Part {
  roman: string;
  title: string;
  chapters: Chapter[];
}

export interface HandbookMeta {
  title: string;
  subtitle: string;
  version: string;
  total_parts: number;
  total_chapters: number;
  total_formulas: number;
  categories: Record<string, number>;
}

export interface Handbook {
  meta: HandbookMeta;
  parts: Part[];
  all_formulas: Formula[];
}
