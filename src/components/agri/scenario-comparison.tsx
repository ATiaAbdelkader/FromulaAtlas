'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  Trash2,
  Star,
  Award,
  GitCompareArrows,
} from 'lucide-react';
import type { Formula } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CalcResult {
  value: string;
  label: string;
  interpretation?: string;
}

interface ScenarioComparisonProps {
  /** active formula */
  formula: Formula;
  /** current input values keyed by field key */
  currentValues: Record<string, number>;
  /** numeric value of the current result, for picking the best scenario */
  currentResultValue: number;
  /** full result object for the current values */
  currentResult: CalcResult;
  /**
   * Optional: when `true`, lower result values are considered "better"
   * (e.g. FCR, NIR, break-even yield). Defaults to `false` (higher is better).
   */
  lowerIsBetter?: boolean;
  /** max number of saved scenarios */
  maxScenarios?: number;
}

export interface SavedScenario {
  id: string;
  label: string;
  values: Record<string, number>;
  result: CalcResult;
  resultValue: number;
  savedAt: string;
}

function genId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    /* noop */
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ScenarioComparison({
  formula,
  currentValues,
  currentResultValue,
  currentResult,
  lowerIsBetter = false,
  maxScenarios = 3,
}: ScenarioComparisonProps) {
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);

  const handleSave = () => {
    if (scenarios.length >= maxScenarios) return;
    const next: SavedScenario = {
      id: genId(),
      label: `Scenario ${String.fromCharCode(65 + scenarios.length)}`,
      values: { ...currentValues },
      result: { ...currentResult },
      resultValue: currentResultValue,
      savedAt: new Date().toISOString(),
    };
    setScenarios([...scenarios, next]);
  };

  const handleDelete = (id: string) => {
    setScenarios(scenarios.filter((s) => s.id !== id));
  };

  // Determine the "best" scenario — incl. current as a candidate.
  const allCandidates = useMemo(() => {
    const list: {
      key: string;
      label: string;
      value: number;
      isCurrent: boolean;
    }[] = scenarios.map((s) => ({
      key: s.id,
      label: s.label,
      value: s.resultValue,
      isCurrent: false,
    }));
    list.push({
      key: 'current',
      label: 'Current',
      value: currentResultValue,
      isCurrent: true,
    });
    return list;
  }, [scenarios, currentResultValue]);

  const bestKey = useMemo(() => {
    if (allCandidates.length === 0) return null;
    const sorted = [...allCandidates].sort((a, b) =>
      lowerIsBetter ? a.value - b.value : b.value - a.value,
    );
    return sorted[0].key;
  }, [allCandidates, lowerIsBetter]);

  const inputKeys = useMemo(() => {
    const set = new Set<string>();
    Object.keys(currentValues).forEach((k) => set.add(k));
    scenarios.forEach((s) => Object.keys(s.values).forEach((k) => set.add(k)));
    return Array.from(set);
  }, [currentValues, scenarios]);

  const canSave = scenarios.length < maxScenarios;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <GitCompareArrows className="h-4 w-4 text-emerald-600" />
            Scenario Comparison
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={handleSave}
            disabled={!canSave}
            title={canSave ? 'Save current inputs as a scenario' : 'Scenario limit reached'}
          >
            <Save className="h-3 w-3" />
            Save scenario
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Compare up to {maxScenarios} saved input sets side-by-side. The best
          one (by result value) gets a badge.
        </p>
      </CardHeader>

      <CardContent className="p-3 pt-0">
        {scenarios.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            <Star className="h-5 w-5 mx-auto mb-2 opacity-50" />
            No scenarios saved yet. Adjust the inputs above, then click
            <span className="font-semibold"> Save scenario</span> to keep a
            snapshot for comparison.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1.5 border-b border-border">
                    Input
                  </th>
                  {scenarios.map((s) => (
                    <th
                      key={s.id}
                      className="text-right px-2 py-1.5 border-b border-border min-w-[100px]"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-xs font-semibold">{s.label}</span>
                        {bestKey === s.id && <BestBadge />}
                      </div>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-[10px] text-muted-foreground hover:text-rose-600 mt-0.5"
                      >
                        <Trash2 className="h-2.5 w-2.5 inline" /> remove
                      </button>
                    </th>
                  ))}
                  <th className="text-right px-2 py-1.5 border-b border-border min-w-[100px] bg-emerald-50/40 dark:bg-emerald-950/20">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        Current
                      </span>
                      {bestKey === 'current' && <BestBadge />}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {inputKeys.map((key, idx) => (
                  <tr key={key} className={idx % 2 ? 'bg-muted/20' : ''}>
                    <td className="text-left text-muted-foreground font-mono px-2 py-1.5 border-b border-border">
                      {key}
                    </td>
                    {scenarios.map((s) => (
                      <td
                        key={s.id}
                        className="text-right tabular-nums px-2 py-1.5 border-b border-border"
                      >
                        {s.values[key] ?? '—'}
                      </td>
                    ))}
                    <td className="text-right tabular-nums px-2 py-1.5 border-b border-border bg-emerald-50/40 dark:bg-emerald-950/20 font-medium">
                      {currentValues[key] ?? '—'}
                    </td>
                  </tr>
                ))}
                {/* Result row */}
                <tr>
                  <td className="text-left font-semibold px-2 py-2 border-b-2 border-border">
                    Result
                    <div className="text-[9px] text-muted-foreground font-normal">
                      {currentResult.label}
                    </div>
                  </td>
                  {scenarios.map((s) => (
                    <td
                      key={s.id}
                      className={cn(
                        'text-right tabular-nums font-bold px-2 py-2 border-b-2 border-border',
                        bestKey === s.id && 'text-emerald-700 dark:text-emerald-400',
                      )}
                    >
                      {s.result.value}
                    </td>
                  ))}
                  <td
                    className={cn(
                      'text-right tabular-nums font-bold px-2 py-2 border-b-2 border-border bg-emerald-50/40 dark:bg-emerald-950/20',
                      bestKey === 'current' && 'text-emerald-700 dark:text-emerald-400',
                    )}
                  >
                    {currentResult.value}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {scenarios.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Award className="h-3 w-3 text-amber-500" />
            <span>
              Best = {lowerIsBetter ? 'lowest' : 'highest'} result wins.
              {!canSave && ' · Scenario limit reached — delete one to save a new one.'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BestBadge() {
  return (
    <Badge
      variant="outline"
      className="text-[9px] gap-0.5 px-1 py-0 h-4 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900"
    >
      <Award className="h-2.5 w-2.5" />
      Best
    </Badge>
  );
}

export default ScenarioComparison;
