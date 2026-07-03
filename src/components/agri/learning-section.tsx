'use client';
import { Lightbulb, Sparkles, ArrowRight, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getFormulaOfTheDay, getTipOfTheDay, badges } from '@/lib/learning';
import { allFormulas } from '@/lib/formulas-data';
import { getPartColor, hasCalculator } from './formula-card';
import { useUserStore } from '@/lib/user-store';
import { useFarmStore } from '@/lib/farm-store';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import type { Formula } from '@/lib/types';

interface Props { onOpenFormula: (formula: Formula) => void; }

export function LearningSection({ onOpenFormula }: Props) {
  const formulaOfTheDay = getFormulaOfTheDay();
  const tipOfTheDay = getTipOfTheDay();
  const favorites = useUserStore(s => s.favorites);
  const notes = useUserStore(s => s.notes);
  const calcHistory = useUserStore(s => s.calcHistory);
  const recents = useUserStore(s => s.recents);
  const farms = useFarmStore(s => s.farms);

  const metrics: Record<string, number> = {
    formulasViewed: recents.length, calculationsRun: calcHistory.length,
    farmsCreated: farms.length, favoritesAdded: favorites.length, notesWritten: Object.keys(notes).length,
  };
  const earnedBadges = badges.filter(b => (metrics[b.metric] || 0) >= b.threshold);
  const nextBadges = badges.filter(b => (metrics[b.metric] || 0) < b.threshold).slice(0, 3);
  const color = getPartColor(formulaOfTheDay.part);

  return (
    <section className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className={cn('rounded-xl border-2 p-4 bg-card', color.border)}>
          <div className="flex items-center gap-2 mb-3"><div className="flex items-center justify-center h-7 w-7 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 text-white"><Sparkles className="h-4 w-4" /></div><span className="text-sm font-semibold">Formula of the Day</span></div>
          <button onClick={() => onOpenFormula(formulaOfTheDay)} className="group w-full text-left">
            <div className="flex items-center gap-2 mb-2"><Badge variant="outline" className={cn('font-mono text-xs font-semibold', color.bg, color.text, color.border)}>{formulaOfTheDay.code}</Badge>{hasCalculator(formulaOfTheDay.code) && <Badge variant="secondary" className="text-[10px]">Calculator</Badge>}</div>
            <h3 className="text-base font-semibold leading-tight mb-1 group-hover:text-emerald-600">{formulaOfTheDay.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">{formulaOfTheDay.purpose}</p>
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 mt-2">Explore<ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" /></div>
          </button>
        </div>
        <div className="rounded-xl border-2 border-blue-200 dark:border-blue-900 p-4 bg-blue-50/50 dark:bg-blue-950/20">
          <div className="flex items-center gap-2 mb-3"><div className="flex items-center justify-center h-7 w-7 rounded-md bg-blue-500 text-white"><Lightbulb className="h-4 w-4" /></div><span className="text-sm font-semibold">Tip of the Day</span></div>
          <p className="text-sm leading-relaxed">{tipOfTheDay.text}</p>
          <Badge variant="outline" className="text-[10px] capitalize mt-2">{tipOfTheDay.category}</Badge>
        </div>
      </div>
      <div className="rounded-xl border-2 border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3"><div className="flex items-center justify-center h-7 w-7 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 text-white"><Award className="h-4 w-4" /></div><span className="text-sm font-semibold">Achievements</span><Badge variant="secondary" className="text-[10px] ml-auto">{earnedBadges.length}/{badges.length} earned</Badge></div>
        {earnedBadges.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {earnedBadges.map(b => { const Icon = (LucideIcons as any)[b.icon] ?? Award; return <div key={b.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-300 dark:border-amber-800" title={b.description}><Icon className={cn('h-3.5 w-3.5', b.color)} /><span className="text-xs font-medium">{b.name}</span></div>; })}
          </div>
        )}
        {nextBadges.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase font-semibold text-muted-foreground">Next achievements</div>
            {nextBadges.map(b => { const Icon = (LucideIcons as any)[b.icon] ?? Award; const current = metrics[b.metric] || 0; const progress = Math.min(100, (current / b.threshold) * 100); return (
              <div key={b.id} className="flex items-center gap-2">
                <Icon className={cn('h-3.5 w-3.5 text-muted-foreground flex-shrink-0', b.color)} />
                <div className="flex-1 min-w-0"><div className="flex items-center justify-between gap-2"><span className="text-xs font-medium truncate">{b.name}</span><span className="text-[10px] text-muted-foreground">{current}/{b.threshold}</span></div><div className="h-1 rounded-full bg-muted overflow-hidden mt-0.5"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} /></div></div>
              </div>
            ); })}
          </div>
        )}
      </div>
    </section>
  );
}
