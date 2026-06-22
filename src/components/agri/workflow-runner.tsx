'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, ChevronRight, ChevronLeft, X, RotateCcw, Sparkles, Target, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Workflow, WorkflowStep } from '@/lib/workflows';
import { resolveCarryForward } from '@/lib/workflows';
import { allFormulas } from '@/lib/formulas-data';
import { calculators } from './calculators';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

interface WorkflowRunnerProps {
  workflow: Workflow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkflowRunner({ workflow, open, onOpenChange }: WorkflowRunnerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepResults, setStepResults] = useState<Record<string, { inputs: Record<string, number>; result: { value: string; label: string; interpretation?: string } }> | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, number>>({});

  const activeStep: WorkflowStep | null = workflow?.steps[currentStep] ?? null;
  const activeFormula = useMemo(() => activeStep ? allFormulas.find(f => f.code === activeStep.formulaCode) ?? null : null, [activeStep]);
  const activeConfig = activeStep ? calculators[activeStep.formulaCode] : null;

  // Derive initial inputs for the current step (no setState in render)
  const derivedInputs = useMemo(() => {
    if (!activeStep || !activeConfig) return {};
    const prev = currentStep > 0 && stepResults ? stepResults[workflow!.steps[currentStep - 1].formulaCode] : null;
    const initial: Record<string, number> = {};
    activeConfig.fields.forEach(f => {
      if (activeStep.carryForward?.[f.key] && prev) {
        const carried = resolveCarryForward(activeStep.carryForward[f.key], { result: prev.result, inputs: prev.inputs });
        initial[f.key] = carried ?? f.defaultValue;
      } else {
        initial[f.key] = f.defaultValue;
      }
    });
    return initial;
  }, [activeStep, activeConfig, currentStep, stepResults, workflow]);

  // Use a key-based approach: when step changes, reset to derived values
  // by tracking the step we've initialized for
  const [initializedStep, setInitializedStep] = useState(-1);
  if (activeStep && currentStep !== initializedStep) {
    setInitializedStep(currentStep);
    setInputValues(derivedInputs);
  }

  const currentResult = useMemo(() => {
    if (!activeConfig) return null;
    try { return activeConfig.compute(inputValues); } catch { return null; }
  }, [activeConfig, inputValues]);

  if (!workflow || !activeStep) return null;

  const handleNext = () => {
    if (currentResult) {
      setStepResults(prev => ({
        ...prev,
        [activeStep.formulaCode]: { inputs: { ...inputValues }, result: currentResult },
      }));
    }
    if (currentStep < workflow.steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };
  const handleClose = () => { onOpenChange(false); setTimeout(() => { setCurrentStep(0); setStepResults(null); }, 300); };
  const handleRestart = () => { setCurrentStep(0); setStepResults(null); };

  const isLastStep = currentStep === workflow.steps.length - 1;
  const WorkflowIcon = (LucideIcons as any)[workflow.icon] ?? Sparkles;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border bg-gradient-to-r from-emerald-50 via-background to-background dark:from-emerald-950/40 dark:via-background dark:to-background">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-700 text-white flex-shrink-0 shadow-sm">
                <WorkflowIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold bg-background/60">Guided Workflow</Badge>
                  <Badge variant="outline" className="text-[10px] font-normal bg-background/60">{workflow.duration}</Badge>
                  <Badge variant="outline" className="text-[10px] font-normal capitalize bg-background/60">{workflow.difficulty}</Badge>
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight">{workflow.title}</DialogTitle>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8 flex-shrink-0"><X className="h-4 w-4" /></Button>
          </div>
          <DialogDescription className="text-sm">{workflow.summary}</DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="px-6 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-medium text-muted-foreground">Step {currentStep + 1} of {workflow.steps.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {workflow.steps.map((step, idx) => (
              <div key={idx} className="flex items-center flex-1">
                <button onClick={() => idx <= currentStep && setCurrentStep(idx)} disabled={idx > currentStep} className={cn('flex items-center justify-center h-7 w-7 rounded-full text-[10px] font-bold transition-all flex-shrink-0', idx < currentStep ? 'bg-emerald-600 text-white' : idx === currentStep ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500' : 'bg-muted text-muted-foreground')}>
                  {idx < currentStep ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                </button>
                {idx < workflow.steps.length - 1 && <div className={cn('h-0.5 flex-1 mx-1 rounded-full', idx < currentStep ? 'bg-emerald-500' : 'bg-border')} />}
              </div>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 space-y-5">
            {activeFormula && activeConfig && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{activeStep.label}</h3>
                    <Badge variant="outline" className="font-mono text-xs">{activeFormula.code}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{activeStep.prompt}</p>
                  {activeStep.why && (
                    <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3 text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                      <span className="font-semibold">Why this matters: </span>{activeStep.why}
                    </div>
                  )}
                </div>

                {activeStep.carryForward && currentStep > 0 && stepResults && (
                  <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                    <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>Auto-filled from previous step</span>
                  </div>
                )}

                <div className="rounded-lg bg-muted/50 border border-border p-3 font-mono text-sm overflow-x-auto">
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{activeFormula.formula.split('=')[0]?.trim()}</span>
                  {activeFormula.formula.includes('=') && <span className="text-foreground"> = {activeFormula.formula.split('=').slice(1).join('=').trim()}</span>}
                </div>

                <Separator />

                <div className="grid sm:grid-cols-2 gap-3">
                  {activeConfig.fields.map(field => (
                    <div key={field.key} className="space-y-1">
                      <Label htmlFor={`wf-${field.key}`} className="text-xs">{field.label}{field.unit && <span className="text-muted-foreground ml-1">({field.unit})</span>}</Label>
                      <Input id={`wf-${field.key}`} type="number" step={field.step ?? 1} value={inputValues[field.key] ?? 0} onChange={(e) => setInputValues(prev => ({ ...prev, [field.key]: parseFloat(e.target.value) || 0 }))} className="h-9" />
                    </div>
                  ))}
                </div>

                {currentResult && (
                  <div className="rounded-lg border-2 border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-4 space-y-1">
                    <div className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-500 font-semibold">Result</div>
                    <div className="font-mono text-2xl font-bold text-emerald-900 dark:text-emerald-300">{currentResult.value} <span className="text-base font-normal text-emerald-700 dark:text-emerald-500">{currentResult.label}</span></div>
                    {currentResult.interpretation && <p className="text-xs text-emerald-800 dark:text-emerald-400 leading-relaxed pt-1">{currentResult.interpretation}</p>}
                  </div>
                )}

                {isLastStep && currentResult && (
                  <>
                    <Separator />
                    <div className="rounded-lg border border-emerald-300 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-background dark:from-emerald-950/30 dark:to-background p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300"><Target className="h-4 w-4" />Workflow Complete</div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{workflow.outcome}</p>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {currentStep > 0 && <Button variant="outline" size="sm" onClick={handleBack} className="gap-1.5"><ChevronLeft className="h-4 w-4" />Back</Button>}
            {currentStep > 0 && <Button variant="ghost" size="sm" onClick={handleRestart} className="gap-1.5 text-xs"><RotateCcw className="h-3.5 w-3.5" />Restart</Button>}
          </div>
          {!isLastStep ? (
            <Button onClick={handleNext} size="sm" disabled={!currentResult} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">Next step<ChevronRight className="h-4 w-4" /></Button>
          ) : (
            <Button onClick={handleClose} size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"><Check className="h-4 w-4" />Done</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
