'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Calculator, Beaker, BookOpen, Target, Variable, Lightbulb, X } from 'lucide-react';
import type { Formula } from '@/lib/types';
import { getPartColor, hasCalculator } from './formula-card';
import { InteractiveCalculator } from './interactive-calculator';
import { useLanguageStore } from '@/lib/language-store';
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
  const language = useLanguageStore(s => s.language);
  if (!formula) return null;

  const color = getPartColor(formula.part);
  const calcAvailable = hasCalculator(formula.code);
  const displayName = (language === 'ar' && (formula as any).name_ar) ? (formula as any).name_ar : formula.name;
  const displayPurpose = (language === 'ar' && (formula as any).purpose_ar) ? (formula as any).purpose_ar : formula.purpose;
  const displayVariables = (language === 'ar' && (formula as any).variables_ar) ? (formula as any).variables_ar : formula.variables;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[1400px] w-[97vw] !max-h-[96vh] h-[96vh] overflow-hidden p-0 gap-0 flex flex-col">
        {/* Fixed header */}
        <DialogHeader className={cn('px-5 py-3 border-b flex-shrink-0', color.bg, color.border)}>
          <div className="flex items-center gap-2 flex-wrap mb-1">
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
          <DialogTitle className="text-lg font-bold tracking-tight">
            {displayName}
          </DialogTitle>
          <DialogDescription className="text-xs mt-0.5">
            {displayPurpose}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable body — plain overflow instead of ScrollArea */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5">
          <div className="max-w-6xl mx-auto space-y-5">
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

            {/* 2-column: Variables + Purpose */}
            <div className="grid md:grid-cols-2 gap-5">
              <FormulaField icon={Variable} label="Variables & Units">
                {displayVariables}
              </FormulaField>
              <FormulaField icon={Target} label="Purpose">
                {displayPurpose}
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

            {/* Interactive Calculator — highlighted box */}
            {calcAvailable && (
              <>
                <Separator />
                <div className="rounded-xl border-2 border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/10 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
                      <Calculator className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Interactive Calculator</h3>
                    <Badge variant="outline" className="text-[9px] text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800">Live</Badge>
                  </div>
                  <InteractiveCalculator formula={formula} />
                </div>
              </>
            )}

            {/* Notes */}
            {formula.notes && (
              <FormulaField icon={BookOpen} label="Notes">
                {formula.notes}
              </FormulaField>
            )}
          </div>
        </div>

        {/* Fixed footer */}
        <div className="p-3 border-t bg-stone-50 dark:bg-stone-900/50 flex justify-end flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-1.5">
            <X className="h-3.5 w-3.5" /> Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
