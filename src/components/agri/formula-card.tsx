'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Beaker, BookOpen, Calculator, Star } from 'lucide-react';
import type { Formula } from '@/lib/types';
import { cn } from '@/lib/utils';
import { calculators } from './calculators';
import { useLanguageStore } from '@/lib/language-store';
import { toggleBookmark, getBookmarks } from '@/lib/formula-bookmarks';

interface FormulaCardProps {
  formula: Formula;
  onSelect: (formula: Formula) => void;
}

// Determine if a calculator is available for this formula
export function hasCalculator(code: string): boolean {
  return code in calculators;
}

const partColors: Record<string, { bg: string; text: string; border: string }> = {
  'Crop Production Formulas': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Animal Production Formulas': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Sustainability & Farm Economics': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'Foundations of Agriculture': { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-300' },
  'Tools & Applications': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  'Advanced Crop Science': { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200' },
  'Advanced Animal Science': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'Digital Agriculture & Technology': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  'Advanced Farm Economics': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Soil & Crop Science — Advanced Topics': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'Animal Science — Specialist Topics': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  'Technology, Traceability & Automation': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Advanced Farm Economics & Policy': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  'Visual Guides, Decision Tools & Global Content': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Irrigation Engineering': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
};

export function getPartColor(part: string) {
  return partColors[part] || { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-300' };
}

export function FormulaCard({ formula, onSelect }: FormulaCardProps) {
  const color = getPartColor(formula.part);
  const calcAvailable = hasCalculator(formula.code);
  const language = useLanguageStore(s => s.language);
  const displayName = (language === 'ar' && (formula as any).name_ar) ? (formula as any).name_ar : formula.name;
  const displayPurpose = (language === 'ar' && (formula as any).purpose_ar) ? (formula as any).purpose_ar : formula.purpose;
  const [bookmarked, setBookmarked] = useState<boolean>(() => getBookmarks().includes(formula.code));

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = toggleBookmark(formula.code);
    setBookmarked(next.includes(formula.code));
  };

  return (
    <Card
      className={cn(
        'group relative flex flex-col overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer border-l-4',
        color.border
      )}
      onClick={() => onSelect(formula)}
    >
      <CardHeader className="pb-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn('font-mono font-semibold', color.bg, color.text, color.border)}>
              {formula.code}
            </Badge>
            {calcAvailable && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Calculator className="h-3 w-3" />
                Calculator
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleBookmark}
              aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
              title={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
              className={cn(
                'p-1 rounded transition-colors',
                bookmarked
                  ? 'text-amber-500 hover:text-amber-600'
                  : 'text-muted-foreground/50 hover:text-amber-500 opacity-0 group-hover:opacity-100',
              )}
            >
              <Star className="h-3.5 w-3.5" fill={bookmarked ? 'currentColor' : 'none'} />
            </button>
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
              Sec. {formula.chapter_number}
            </span>
          </div>
        </div>
        <h3 className="text-base font-semibold leading-tight tracking-tight">
          {displayName}
        </h3>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <div className="rounded-md bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 p-3 font-mono text-sm overflow-x-auto">
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{formula.formula.split('=')[0]?.trim() || formula.formula.split(' ')[0]}</span>
          {formula.formula.includes('=') && (
            <span className="text-stone-700 dark:text-stone-300"> = {formula.formula.split('=').slice(1).join('=').trim()}</span>
          )}
        </div>

        {displayPurpose && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {displayPurpose}
          </p>
        )}

        {formula.pitfall && (
          <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-2">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{formula.pitfall}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 gap-2 flex-wrap">
        <Badge variant="outline" className="text-xs font-normal">
          <BookOpen className="h-3 w-3 mr-1" />
          {formula.chapter}
        </Badge>
        {formula.example && (
          <Badge variant="outline" className="text-xs font-normal">
            <Beaker className="h-3 w-3 mr-1" />
            Example
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}
