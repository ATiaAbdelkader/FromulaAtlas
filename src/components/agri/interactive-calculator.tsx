'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Formula } from '@/lib/types';
import { calculators } from './calculators';

interface InteractiveCalculatorProps {
  formula: Formula;
}

export function InteractiveCalculator({ formula }: InteractiveCalculatorProps) {
  const config = calculators[formula.code];

  const [values, setValues] = useState<Record<string, number>>(() => {
    if (!config) return {};
    const initial: Record<string, number> = {};
    config.fields.forEach(f => { initial[f.key] = f.defaultValue; });
    return initial;
  });

  const result = useMemo(() => {
    if (!config) return null;
    try {
      return config.compute(values);
    } catch {
      return null;
    }
  }, [config, values]);

  if (!config) return null;

  const reset = () => {
    const initial: Record<string, number> = {};
    config.fields.forEach(f => { initial[f.key] = f.defaultValue; });
    setValues(initial);
  };

  return (
    <div className="grid lg:grid-cols-[1fr_1fr] gap-4">
      {/* Left: inputs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Inputs</div>
          <Button variant="ghost" size="sm" onClick={reset} className="h-7 text-xs gap-1">
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {config.fields.map(field => (
            <div key={field.key} className="space-y-1">
              <Label htmlFor={field.key} className="text-xs">
                {field.label}{field.unit && <span className="text-muted-foreground ml-1">({field.unit})</span>}
              </Label>
              <Input
                id={field.key}
                type="number"
                step={field.step ?? 1}
                value={values[field.key]}
                onChange={(e) => setValues(prev => ({ ...prev, [field.key]: parseFloat(e.target.value) || 0 }))}
                className="h-9"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right: result */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Result</div>
        {result ? (
          <div className="rounded-lg border-2 border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-4 space-y-1.5">
            <div className="font-mono text-3xl font-bold text-emerald-900 dark:text-emerald-300">
              {result.value} <span className="text-lg font-normal text-emerald-700 dark:text-emerald-500">{result.label}</span>
            </div>
            {result.interpretation && (
              <p className="text-xs text-emerald-800 dark:text-emerald-400 leading-relaxed pt-1">
                {result.interpretation}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
            Enter values to see the result.
          </div>
        )}
      </div>
    </div>
  );
}
