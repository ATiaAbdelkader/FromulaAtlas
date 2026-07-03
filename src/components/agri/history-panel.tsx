'use client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Trash2, ArrowRight } from 'lucide-react';
import { useUserStore } from '@/lib/user-store';
import { allFormulas } from '@/lib/formulas-data';
import { getPartColor } from './formula-card';
import { cn } from '@/lib/utils';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; onSelectFormula?: (code: string) => void; }

function formatRelative(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000); const hours = Math.floor(mins / 60); const days = Math.floor(hours / 24);
  if (mins < 60) return `${mins}m ago`; if (hours < 24) return `${hours}h ago`; if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function HistoryPanel({ open, onOpenChange, onSelectFormula }: Props) {
  const calcHistory = useUserStore(s => s.calcHistory);
  const clearHistory = useUserStore(s => s.clearCalcHistory);
  const removeEntry = useUserStore(s => s.removeCalcHistory);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="p-0 gap-0 w-full sm:w-[440px] overflow-hidden flex flex-col">
        <SheetHeader className="p-4 pb-3 border-b border-border bg-gradient-to-r from-emerald-50 to-background dark:from-emerald-950/30 dark:to-background space-y-1">
          <SheetTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4 text-emerald-600" /> Calculation History</SheetTitle>
          <SheetDescription className="flex items-center justify-between">
            <span>{calcHistory.length === 0 ? 'Your calculations will appear here.' : `${calcHistory.length} saved calculation${calcHistory.length === 1 ? '' : 's'}`}</span>
            {calcHistory.length > 0 && <Button variant="ghost" size="sm" onClick={clearHistory} className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" />Clear all</Button>}
          </SheetDescription>
        </SheetHeader>
        {calcHistory.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="rounded-full bg-muted p-4 mb-3"><History className="h-8 w-8 text-muted-foreground" /></div>
            <h3 className="text-base font-semibold mb-1">No calculations yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs">Open any formula with a calculator and run a calculation. It will be saved here automatically.</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-3 space-y-2">
              {calcHistory.map(entry => {
                const formula = allFormulas.find(f => f.code === entry.formulaCode);
                const theme = formula ? getPartColor(formula.part) : null;
                return (
                  <div key={entry.id} className="group rounded-lg border border-border bg-card p-3 hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Badge variant="outline" className={cn('font-mono font-semibold text-[10px] flex-shrink-0', theme ? `${theme.bg} ${theme.text} ${theme.border}` : '')}>{entry.formulaCode}</Badge>
                        <button onClick={() => { if (onSelectFormula) { onOpenChange(false); onSelectFormula(entry.formulaCode); } }} className="text-sm font-medium hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left truncate" title="Open formula">{entry.formulaName}</button>
                      </div>
                      <button onClick={() => removeEntry(entry.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0" title="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-2">
                      {entry.inputLabels.slice(0, 6).map(input => (
                        <div key={input.key} className="text-[11px] text-muted-foreground truncate">
                          <span className="font-medium">{input.label}</span>{input.unit && <span className="opacity-70"> ({input.unit})</span>}:
                          <span className="font-mono text-foreground ml-1">{input.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 px-2.5 py-1.5">
                      <ArrowRight className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                      <span className="font-mono text-sm font-bold text-emerald-900 dark:text-emerald-300">{entry.result.value}</span>
                      <span className="text-xs text-emerald-700 dark:text-emerald-500">{entry.result.label}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground whitespace-nowrap">{formatRelative(entry.timestamp)}</span>
                    </div>
                    {entry.result.interpretation && <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{entry.result.interpretation}</p>}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
