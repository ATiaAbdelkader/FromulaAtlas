'use client';

import { Star, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toggleBookmark } from '@/lib/formula-bookmarks';
import type { Formula } from '@/lib/types';

interface BookmarkedFormulasProps {
  bookmarks: string[];
  formulas: Formula[];
  onSelect: (f: Formula) => void;
  onRemove: (code: string) => void;
}

export function BookmarkedFormulas({ bookmarks, formulas, onSelect, onRemove }: BookmarkedFormulasProps) {
  if (bookmarks.length === 0) return null;
  const bookmarkedFormulas = bookmarks.map(code => formulas.find(f => f.code === code)).filter((f): f is Formula => f !== undefined);
  if (bookmarkedFormulas.length === 0) return null;

  return (
    <div className="mb-5 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Star className="h-3.5 w-3.5 text-amber-500" fill="currentColor" />
        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Bookmarked Formulas</span>
        <Badge variant="outline" className="text-[10px] ml-1">{bookmarkedFormulas.length}</Badge>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {bookmarkedFormulas.map(f => (
          <div key={f.code} className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer" onClick={() => onSelect(f)}>
            <span className="text-[10px] font-mono font-bold text-muted-foreground">{f.code}</span>
            <span className="text-xs font-medium truncate max-w-[180px]">{f.name}</span>
            <button onClick={(e) => { e.stopPropagation(); toggleBookmark(f.code); onRemove(f.code); }} className="text-amber-400 hover:text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Remove bookmark">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
