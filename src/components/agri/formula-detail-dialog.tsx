'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Calculator, Beaker, BookOpen, Target, Variable, Lightbulb } from 'lucide-react';
import type { Formula } from '@/lib/types';
import { getPartColor, hasCalculator } from './formula-card';
import { InteractiveCalculator } from './interactive-calculator';
import { cn } from '@/lib/utils';

interface FormulaDetailDialogProps {
  formula: Formula | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function FormulaField({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-300">
        <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
        {label}
      </div>
      <div className="text-sm text-muted-foreground leading-relaxed pl-6 whitespace-pre-line">
        {children}
      </div>
    </div>
  );
}

export function FormulaDetailDialog({ formula, open, onOpenChange }: FormulaDetailDialogProps) {
  if (!formula) return null;

  const color = getPartColor(formula.part);
  const calcAvailable = hasCalculator(formula.code);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className={cn('p-6 pb-4 border-b', color.bg, color.border)}>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge variant="outline" className={cn('font-mono font-bold', color.text, color.border, 'bg-white/60')}>
              {formula.code}
            </Badge>
            <Badge variant="outline" className="text-xs font-normal bg-white/60">
              Part {formula.part_roman} · {formula.part}
            </Badge>
            <Badge variant="outline" className="text-xs font-normal bg-white/60">
              Sec. {formula.chapter_number} · {formula.chapter}
            </Badge>
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            {formula.name}
          </DialogTitle>
          <DialogDescription className="text-sm mt-1">
            {formula.purpose}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-5 py-5">
            {/* Formula */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-300">
                <Calculator className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                Formula
              </div>
              <div className="rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 font-mono text-base overflow-x-auto leading-relaxed">
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  {formula.formula.split('=')[0]?.trim() || formula.formula.split(' ')[0]}
                </span>
                {formula.formula.includes('=') && (
                  <span className="text-stone-700 dark:text-stone-300">
                    {' = '}{formula.formula.split('=').slice(1).join('=').trim()}
                  </span>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <FormulaField icon={Variable} label="Variables & Units">
                {formula.variables}
              </FormulaField>

              <FormulaField icon={Target} label="Purpose">
                {formula.purpose}
              </FormulaField>
            </div>

            <Separator />

            {/* Example */}
            <FormulaField icon={Beaker} label="Worked Example">
              {formula.example}
            </FormulaField>

            {/* Pitfall */}
            {formula.pitfall && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-500">
                  <AlertTriangle className="h-4 w-4" />
                  Common Pitfall
                </div>
                <div className="text-sm bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-3 leading-relaxed">
                  {formula.pitfall}
                </div>
              </div>
            )}

            {/* Decision */}
            {formula.decision && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-500">
                  <Lightbulb className="h-4 w-4" />
                  Decision Rule
                </div>
                <div className="text-sm bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-md p-3 leading-relaxed">
                  {formula.decision}
                </div>
              </div>
            )}

            {/* Interactive Calculator */}
            {calcAvailable && (
              <>
                <Separator />
                <InteractiveCalculator formula={formula} />
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t bg-stone-50 dark:bg-stone-900/50">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
