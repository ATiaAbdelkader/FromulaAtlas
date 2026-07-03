'use client';

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeftRight, Ruler } from 'lucide-react';
import {
  unitCategories,
  convertValue,
  type UnitCategoryId,
} from '@/lib/unit-conversions';
import { cn } from '@/lib/utils';

interface UnitConverterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatResult(n: number): string {
  if (!isFinite(n)) return '—';
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e7 || abs < 1e-4) return n.toExponential(4);
  // Trim to max 6 significant digits.
  return n.toLocaleString(undefined, {
    maximumSignificantDigits: 6,
    minimumSignificantDigits: 1,
  });
}

export function UnitConverterDialog({
  open,
  onOpenChange,
}: UnitConverterDialogProps) {
  const [categoryId, setCategoryId] = useState<UnitCategoryId>('area');
  const category = useMemo(
    () => unitCategories.find((c) => c.id === categoryId)!,
    [categoryId],
  );

  const [fromUnitId, setFromUnitId] = useState(category.units[0].id);
  const [toUnitId, setToUnitId] = useState(category.units[1]?.id ?? category.units[0].id);
  const [input, setInput] = useState('1');

  // When category changes, reset unit selections to that category's first two.
  const handleCategoryChange = (id: UnitCategoryId) => {
    const cat = unitCategories.find((c) => c.id === id)!;
    setCategoryId(id);
    setFromUnitId(cat.units[0].id);
    setToUnitId(cat.units[1]?.id ?? cat.units[0].id);
  };

  const numericInput = useMemo(() => parseFloat(input), [input]);
  const result = useMemo(() => {
    if (!isFinite(numericInput)) return NaN;
    return convertValue(numericInput, categoryId, fromUnitId, toUnitId);
  }, [numericInput, categoryId, fromUnitId, toUnitId]);

  const fromUnit = category.units.find((u) => u.id === fromUnitId);
  const toUnit = category.units.find((u) => u.id === toUnitId);

  const swap = () => {
    setFromUnitId(toUnitId);
    setToUnitId(fromUnitId);
  };

  // Quick reference panel: show input value in all OTHER units of this category.
  const quickReference = useMemo(() => {
    if (!isFinite(numericInput)) return [] as { unit: typeof fromUnit; value: number }[];
    return category.units
      .filter((u) => u.id !== fromUnitId)
      .map((u) => ({
        unit: u,
        value: convertValue(numericInput, categoryId, fromUnitId, u.id),
      }));
  }, [numericInput, category, fromUnitId, categoryId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-5 pb-4 border-b border-border bg-gradient-to-r from-emerald-50 via-background to-background dark:from-emerald-950/40">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="flex items-center justify-center h-8 w-8 rounded-md bg-gradient-to-br from-emerald-500 to-green-700 text-white">
              <Ruler className="h-4 w-4" />
            </span>
            Unit Converter
          </DialogTitle>
          <DialogDescription className="text-xs">
            Convert between area, length, weight, volume, temperature, water
            depth, yield, and pressure units.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={categoryId}
          onValueChange={(v) => handleCategoryChange(v as UnitCategoryId)}
          className="px-5 pt-3"
        >
          <TabsList className="flex-wrap h-auto">
            {unitCategories.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="text-xs h-7 px-2.5"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {unitCategories.map((cat) => (
            <TabsContent key={cat.id} value={cat.id} className="mt-0" />
          ))}
        </Tabs>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-5 pt-3 space-y-4">
            {/* From / To converters */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
              {/* From */}
              <div className="space-y-1.5">
                <Label className="text-xs">From</Label>
                <Input
                  type="number"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="h-10 text-base font-semibold tabular-nums"
                />
                <Select value={fromUnitId} onValueChange={setFromUnitId}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {category.units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.label} ({u.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Swap button */}
              <Button
                variant="outline"
                size="icon"
                onClick={swap}
                className="h-10 w-10 mb-1 sm:mb-7 mx-auto"
                title="Swap units"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>

              {/* To */}
              <div className="space-y-1.5">
                <Label className="text-xs">To</Label>
                <div
                  className={cn(
                    'h-10 rounded-md border-2 border-emerald-200 dark:border-emerald-900',
                    'bg-emerald-50 dark:bg-emerald-950/30 px-3 flex items-center',
                  )}
                >
                  <span className="text-base font-bold tabular-nums text-emerald-800 dark:text-emerald-300">
                    {formatResult(result)}
                  </span>
                </div>
                <Select value={toUnitId} onValueChange={setToUnitId}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {category.units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.label} ({u.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Equation summary */}
            <div className="rounded-md bg-muted/40 border border-border px-3 py-2 text-xs text-muted-foreground">
              <span className="font-mono">
                {isFinite(numericInput) ? formatResult(numericInput) : '—'}{' '}
                {fromUnit?.symbol}
              </span>{' '}
              ={' '}
              <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                {formatResult(result)} {toUnit?.symbol}
              </span>
            </div>

            <Separator />

            {/* Quick reference panel */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold">Quick Reference</h3>
                <Badge variant="outline" className="text-[10px] font-normal">
                  {fromUnit?.label} · {fromUnit?.symbol}
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {quickReference.map(({ unit, value }) => (
                  <div
                    key={unit!.id}
                    className={cn(
                      'rounded-md border px-2.5 py-2 transition-colors',
                      unit!.id === toUnitId
                        ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30'
                        : 'border-border bg-card',
                    )}
                  >
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      {unit!.label}
                    </div>
                    <div className="text-sm font-semibold tabular-nums mt-0.5">
                      {formatResult(value)}
                      <span className="text-[10px] text-muted-foreground ml-1 font-normal">
                        {unit!.symbol}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default UnitConverterDialog;
