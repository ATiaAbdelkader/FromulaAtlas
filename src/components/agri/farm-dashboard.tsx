'use client';
import { useMemo } from 'react';
import { Sprout, TrendingUp, Trash2, ArrowRight, Calendar, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFarmStore } from '@/lib/farm-store';
import { allFormulas } from '@/lib/formulas-data';
import { getPartColor } from './formula-card';
import { exportToCSV } from '@/lib/share-utils';
import { cn } from '@/lib/utils';

function formatRelative(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000); const hours = Math.floor(mins / 60); const days = Math.floor(hours / 24);
  if (mins < 60) return `${mins}m ago`; if (hours < 24) return `${hours}h ago`; if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function FarmDashboard() {
  const { farms, activeFarmId, farmCalcs, removeFarmCalc, clearFarmCalcs } = useFarmStore();
  const activeFarm = farms.find(f => f.id === activeFarmId);
  const calcs = useMemo(() => farmCalcs.filter(c => c.farmId === activeFarmId).sort((a, b) => b.timestamp - a.timestamp), [farmCalcs, activeFarmId]);

  if (!activeFarm) return null;

  return (
    <section className="mb-6">
      <div className="rounded-xl border-2 border-emerald-200 dark:border-emerald-900 bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-emerald-50 to-background dark:from-emerald-950/30 dark:to-background">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-700 text-white flex-shrink-0 shadow-sm"><Sprout className="h-5 w-5" /></div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">{activeFarm.name}</h2>
                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                  <Badge variant="outline" className="text-[10px]">{activeFarm.crop}</Badge>
                  <Badge variant="outline" className="text-[10px]">{activeFarm.area} ha</Badge>
                  <Badge variant="outline" className="text-[10px]">{activeFarm.soilType}</Badge>
                  <Badge variant="outline" className="text-[10px]">{activeFarm.irrigationType}</Badge>
                  {activeFarm.plantingDate && <Badge variant="outline" className="text-[10px] gap-1"><Calendar className="h-2.5 w-2.5" />{activeFarm.plantingDate}</Badge>}
                </div>
              </div>
            </div>
            {calcs.length > 0 && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => exportToCSV(calcs, activeFarm.name)} className="text-xs gap-1 text-muted-foreground hover:text-emerald-600" title="Export CSV"><Download className="h-3 w-3" />CSV</Button>
                <Button variant="ghost" size="sm" onClick={() => clearFarmCalcs(activeFarm.id)} className="text-xs gap-1 text-muted-foreground hover:text-destructive" title="Clear"><Trash2 className="h-3 w-3" />Clear</Button>
              </div>
            )}
          </div>
        </div>
        {calcs.length === 0 ? (
          <div className="p-8 text-center">
            <div className="rounded-full bg-muted p-3 mb-2 mx-auto w-fit"><TrendingUp className="h-6 w-6 text-muted-foreground" /></div>
            <p className="text-sm text-muted-foreground">No calculations tagged to this farm yet. Open any formula calculator and your results will appear here.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="p-4 space-y-2">
              {calcs.map(entry => {
                const formula = allFormulas.find(f => f.code === entry.formulaCode);
                const color = formula ? getPartColor(formula.part) : null;
                return (
                  <div key={entry.id} className="group rounded-lg border border-border bg-card p-3 hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn('font-mono text-[10px] font-semibold', color ? `${color.bg} ${color.text} ${color.border}` : '')}>{entry.formulaCode}</Badge>
                        <span className="text-sm font-medium">{entry.formulaName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatRelative(entry.timestamp)}</span>
                        <button onClick={() => removeFarmCalc(entry.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 mb-2">
                      {entry.inputLabels.slice(0, 6).map(input => (
                        <div key={input.key} className="text-[11px] text-muted-foreground"><span className="font-medium">{input.label}</span>{input.unit && <span className="opacity-70"> ({input.unit})</span>}:<span className="font-mono text-foreground ml-1">{input.value}</span></div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 px-2.5 py-1.5">
                      <ArrowRight className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                      <span className="font-mono text-sm font-bold text-emerald-900 dark:text-emerald-300">{entry.result.value}</span>
                      <span className="text-xs text-emerald-700 dark:text-emerald-500">{entry.result.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </section>
  );
}
