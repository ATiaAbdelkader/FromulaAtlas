'use client';

// Formula Comparison: side-by-side comparison of up to 3 atlas formulas.
// Renders a row-per-attribute table (formula text, variables, purpose,
// example, pitfall, has-calculator) with each column color-coded by the
// formula's part. Designed to live on the Tools tab.

import { useMemo, useState } from 'react';
import {
  GitCompareArrows,
  Plus,
  X,
  Trash2,
  Search,
  Calculator,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { allFormulas } from '@/lib/formulas-data';
import type { Formula } from '@/lib/types';
import { hasCalculator, getPartColor } from './formula-card';
import { getPartTheme } from './part-themes';
import { FormulaText } from './formula-text';
import { cn } from '@/lib/utils';

interface FormulaComparisonProps {
  /** Optional: callback invoked when the user clicks "Open calculator". */
  onOpenFormula?: (code: string) => void;
  /** Outer className override */
  className?: string;
  /** Max number of formulas compared side-by-side (default 3). */
  maxFormulas?: number;
}

const MAX_FORMULAS = 3;

interface RowSpec {
  key: string;
  label: string;
  /** Render the cell content for the given formula. */
  render: (f: Formula) => React.ReactNode;
  /** Show even when the value is empty (default false → omit empty rows). */
  alwaysShow?: boolean;
  /** Row icon */
  icon?: React.ReactNode;
}

const rows: RowSpec[] = [
  {
    key: 'formula',
    label: 'Formula',
    icon: <span className="font-mono text-emerald-600">ƒ</span>,
    alwaysShow: true,
    render: (f) => (
      <div className="font-mono text-[12px] leading-relaxed bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-md p-2.5 break-words whitespace-pre-wrap">
        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
          {f.formula.split('=')[0]?.trim() || f.formula.split(' ')[0]}
        </span>
        {f.formula.includes('=') && (
          <span className="text-stone-700 dark:text-stone-300">
            {' = '}
            {f.formula.split('=').slice(1).join('=').trim()}
          </span>
        )}
      </div>
    ),
  },
  {
    key: 'variables',
    label: 'Variables & Units',
    render: (f) =>
      f.variables ? (
        <div className="text-[11px] leading-relaxed text-muted-foreground">
          <FormulaText>{f.variables}</FormulaText>
        </div>
      ) : null,
  },
  {
    key: 'purpose',
    label: 'Purpose',
    render: (f) =>
      f.purpose ? (
        <div className="text-[11px] leading-relaxed">
          <FormulaText>{f.purpose}</FormulaText>
        </div>
      ) : null,
  },
  {
    key: 'example',
    label: 'Worked Example',
    render: (f) =>
      f.example ? (
        <div className="text-[11px] leading-relaxed text-stone-700 dark:text-stone-300 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/60 rounded-md p-2">
          <FormulaText>{f.example}</FormulaText>
        </div>
      ) : null,
  },
  {
    key: 'pitfall',
    label: 'Common Pitfall',
    render: (f) =>
      f.pitfall ? (
        <div className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-2">
          <FormulaText>{f.pitfall}</FormulaText>
        </div>
      ) : null,
  },
  {
    key: 'decision',
    label: 'Decision Rule',
    render: (f) =>
      f.decision ? (
        <div className="text-[11px] leading-relaxed text-stone-700 dark:text-stone-300 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900 rounded-md p-2">
          <FormulaText>{f.decision}</FormulaText>
        </div>
      ) : null,
  },
  {
    key: 'calculator',
    label: 'Calculator',
    alwaysShow: true,
    render: (f) =>
      hasCalculator(f.code) ? (
        <Badge
          variant="outline"
          className="gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
        >
          <Calculator className="h-3 w-3" />
          Available
        </Badge>
      ) : (
        <span className="text-[10px] text-muted-foreground italic">
          No calculator
        </span>
      ),
  },
];

// --- Search dropdown -------------------------------------------------------

interface FormulaSearchDropdownProps {
  /** Triggered when a formula is picked. */
  onSelect: (formula: Formula) => void;
  /** Codes already in the comparison so we can grey them out. */
  disabledCodes: Set<string>;
  /** Trigger element anchor alignment. */
  align?: 'start' | 'center' | 'end';
}

function FormulaSearchDropdown({
  onSelect,
  disabledCodes,
  align = 'start',
}: FormulaSearchDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Show a curated short list when the user hasn't typed yet —
      // formulas that have calculators, sorted by code.
      return allFormulas
        .filter((f) => hasCalculator(f.code))
        .slice(0, 30);
    }
    const terms = q.split(/\s+/).filter(Boolean);
    return allFormulas
      .filter((f) => {
        const hay = `${f.code} ${f.name} ${f.name_ar || ''} ${f.formula} ${f.variables} ${f.purpose} ${f.chapter} ${f.part}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      })
      .slice(0, 50);
  }, [query]);

  const handleSelect = (f: Formula) => {
    if (disabledCodes.has(f.code)) return;
    onSelect(f);
    setQuery('');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-dashed"
          aria-label="Add formula to comparison"
        >
          <Plus className="h-4 w-4" />
          Add formula
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={6}
        className="w-[360px] p-0"
      >
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              autoFocus
              type="search"
              placeholder="Search by name, code, keyword..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 pl-8 pr-2 text-sm"
            />
          </div>
        </div>
        <ScrollArea className="h-[320px]">
          <div className="p-1">
            {results.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                No formulas match &quot;{query}&quot;
              </div>
            ) : (
              results.map((f) => {
                const color = getPartColor(f.part);
                const disabled = disabledCodes.has(f.code);
                return (
                  <button
                    key={`${f.code}-${f.part}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSelect(f)}
                    className={cn(
                      'w-full flex items-start gap-2 px-2.5 py-2 rounded-md text-left transition-colors',
                      disabled
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-accent cursor-pointer',
                    )}
                  >
                    <Badge
                      variant="outline"
                      className={cn(
                        'font-mono text-[10px] flex-shrink-0 mt-0.5',
                        color.bg,
                        color.text,
                        color.border,
                      )}
                    >
                      {f.code}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate">
                        {f.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {f.part} · Sec. {f.chapter_number}
                      </div>
                    </div>
                    {hasCalculator(f.code) && (
                      <Calculator className="h-3 w-3 text-emerald-600 flex-shrink-0 mt-1" />
                    )}
                    {disabled && (
                      <span className="text-[9px] text-muted-foreground flex-shrink-0 mt-1">
                        added
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

// --- Comparison column header ---------------------------------------------

function ColumnHeader({
  formula,
  onRemove,
  onOpenFormula,
}: {
  formula: Formula;
  onRemove: () => void;
  onOpenFormula?: (code: string) => void;
}) {
  const theme = getPartTheme(formula.part);
  const color = getPartColor(formula.part);
  const Icon = theme.icon;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-1.5">
        <Badge
          variant="outline"
          className={cn(
            'font-mono text-[10px] flex-shrink-0',
            color.bg,
            color.text,
            color.border,
          )}
        >
          {formula.code}
        </Badge>
        <button
          onClick={onRemove}
          aria-label={`Remove ${formula.code} from comparison`}
          title="Remove from comparison"
          className="text-muted-foreground hover:text-rose-600 rounded p-0.5 -m-0.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="text-xs font-semibold leading-tight line-clamp-2">
        {formula.name}
      </div>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Icon className={cn('h-3 w-3', theme.chipText)} />
        <span className="truncate">{formula.part}</span>
      </div>
      {hasCalculator(formula.code) && onOpenFormula && (
        <button
          onClick={() => onOpenFormula(formula.code)}
          className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline self-start mt-0.5"
        >
          <ExternalLink className="h-3 w-3" />
          Open calculator
        </button>
      )}
      {hasCalculator(formula.code) && !onOpenFormula && (
        <Badge
          variant="outline"
          className="text-[9px] gap-0.5 px-1 py-0 h-4 self-start bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
        >
          <Calculator className="h-2.5 w-2.5" />
          Calculator
        </Badge>
      )}
    </div>
  );
}

// --- Main component --------------------------------------------------------

export function FormulaComparison({
  onOpenFormula,
  className,
  maxFormulas = MAX_FORMULAS,
}: FormulaComparisonProps) {
  const [selected, setSelected] = useState<Formula[]>([]);

  const canAdd = selected.length < maxFormulas;
  const disabledCodes = useMemo(
    () => new Set(selected.map((f) => f.code)),
    [selected],
  );

  const handleAdd = (formula: Formula) => {
    if (selected.length >= maxFormulas) return;
    if (disabledCodes.has(formula.code)) return;
    setSelected((cur) => [...cur, formula]);
  };

  const handleRemove = (code: string) => {
    setSelected((cur) => cur.filter((f) => f.code !== code));
  };

  const handleClearAll = () => setSelected([]);

  // Filter rows based on whether at least one selected formula has data
  // for that row (skipping the alwaysShow rows).
  const visibleRows = useMemo(() => {
    if (selected.length === 0) return rows;
    return rows.filter((row) => {
      if (row.alwaysShow) return true;
      return selected.some((f) => row.render(f) != null);
    });
  }, [selected]);

  // Suggested "starter pack" of formulas to compare if the user hasn't picked
  // anything yet — three popular irrigation-related ones.
  const suggestions: { code: string; label: string }[] = [
    { code: 'IRR-10.4', label: 'Crop ET' },
    { code: '6.4', label: 'Water Use Efficiency' },
    { code: '6.2', label: 'Gross Irrigation Requirement' },
    { code: '14.5', label: 'Feed Conversion Ratio' },
    { code: '17.2', label: 'Gross Margin' },
    { code: '37.1', label: 'Temperature-Humidity Index' },
  ];

  const quickAdd = (code: string) => {
    if (!canAdd) return;
    const f = allFormulas.find((x) => x.code === code);
    if (f && !disabledCodes.has(f.code)) handleAdd(f);
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center justify-center h-8 w-8 rounded-md bg-gradient-to-br from-emerald-500 to-green-700 text-white flex-shrink-0">
              <GitCompareArrows className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold leading-tight flex items-center gap-1.5">
                Formula Comparison
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Compare up to {maxFormulas} formulas side-by-side, attribute by attribute.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge variant="secondary" className="text-[10px] font-mono">
              {selected.length}/{maxFormulas}
            </Badge>
            {selected.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground hover:text-rose-600"
                onClick={handleClearAll}
              >
                <Trash2 className="h-3 w-3" />
                Clear all
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4">
        {selected.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
            <Sparkles className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
            <h4 className="text-sm font-semibold mb-1">Pick formulas to compare</h4>
            <p className="text-xs text-muted-foreground mb-4 max-w-md mx-auto">
              Search the atlas and pick up to {maxFormulas} formulas. They&apos;ll appear
              side-by-side with rows for formula text, variables, purpose, example,
              and pitfalls — color-coded by part.
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {suggestions.map((s) => (
                <button
                  key={s.code}
                  onClick={() => quickAdd(s.code)}
                  className="text-xs px-2.5 py-1 rounded-full border border-border bg-background hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                >
                  <span className="font-mono text-[10px] text-emerald-600 mr-1">
                    {s.code}
                  </span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Side-by-side comparison table */}
            <div className="overflow-x-auto -mx-1">
              <table className="w-full border-collapse min-w-[640px]">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-card text-left text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-2 align-bottom w-[120px] min-w-[120px] border-b border-border">
                      Attribute
                    </th>
                    {selected.map((f) => {
                      const color = getPartColor(f.part);
                      return (
                        <th
                          key={`${f.code}-${f.part}`}
                          className={cn(
                            'text-left px-3 py-2 align-top border-b border-border min-w-[200px]',
                            color.bg,
                          )}
                        >
                          <ColumnHeader
                            formula={f}
                            onRemove={() => handleRemove(f.code)}
                            onOpenFormula={onOpenFormula}
                          />
                        </th>
                      );
                    })}
                    {/* Empty placeholder columns for "Add" affordances */}
                    {canAdd &&
                      Array.from({ length: maxFormulas - selected.length }).map((_, i) => (
                        <th
                          key={`empty-${i}`}
                          className="text-left px-3 py-2 align-top border-b border-border min-w-[200px] bg-muted/20"
                        >
                          <div className="flex flex-col items-center justify-center h-full gap-2 py-6 text-center">
                            <div className="h-8 w-8 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                              <Plus className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              Slot {selected.length + i + 1} of {maxFormulas}
                            </span>
                          </div>
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr key={row.key}>
                      <td className="sticky left-0 z-10 bg-card text-left text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-2.5 align-top border-b border-border">
                        <span className="flex items-center gap-1.5">
                          {row.icon && (
                            <span className="text-emerald-600">{row.icon}</span>
                          )}
                          {row.label}
                        </span>
                      </td>
                      {selected.map((f) => (
                        <td
                          key={`${f.code}-${f.part}-${row.key}`}
                          className="text-left px-3 py-2.5 align-top border-b border-border"
                        >
                          {row.render(f) ?? (
                            <span className="text-[10px] text-muted-foreground italic">
                              —
                            </span>
                          )}
                        </td>
                      ))}
                      {canAdd &&
                        Array.from({ length: maxFormulas - selected.length }).map((_, i) => (
                          <td
                            key={`empty-${i}-${row.key}`}
                            className="text-left px-3 py-2.5 align-top border-b border-border bg-muted/10"
                          />
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer row with add/clear actions */}
            <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
              <div className="text-[11px] text-muted-foreground">
                {selected.length === 0
                  ? 'No formulas selected yet.'
                  : `Comparing ${selected.length} formula${selected.length === 1 ? '' : 's'}.`}
              </div>
              {canAdd && <FormulaSearchDropdown onSelect={handleAdd} disabledCodes={disabledCodes} />}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FormulaComparison;
