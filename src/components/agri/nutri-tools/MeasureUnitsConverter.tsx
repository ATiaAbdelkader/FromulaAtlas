'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MEASURE_UNITS, MEASURE_CATEGORIES, convertMeasure } from '@/lib/nutri-tools-data';

/**
 * Tool 3 — Physical Measure Units Converter
 */
export function MeasureUnitsConverter() {
  const [category, setCategory] = useState('length');
  const [value, setValue] = useState('1');
  const [from, setFrom] = useState('m');
  const [to, setTo] = useState('ft');

  const units = MEASURE_UNITS[category] || [];
  const num = parseFloat(value.replace(',', '.')) || 0;
  const fromDef = units.find(u => u.id === from);
  const toDef = units.find(u => u.id === to);
  const result = fromDef && toDef ? convertMeasure(num, fromDef, toDef, category) : null;

  const onCategoryChange = (cat: string) => {
    setCategory(cat);
    const list = MEASURE_UNITS[cat] || [];
    if (list.length > 0) {
      setFrom(list[0].id);
      setTo(list[1]?.id || list[0].id);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Physical Units Converter</CardTitle>
        <p className="text-xs text-muted-foreground">Length, area, volume, mass, temperature, pressure, concentration, ionic.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs">Category</Label>
          <Select value={category} onValueChange={onCategoryChange}>
            <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MEASURE_CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
          <div>
            <Label className="text-xs">From</Label>
            <Input value={value} onChange={e => setValue(e.target.value)} className="h-9 mt-1 text-sm" />
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {units.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="pb-9 text-muted-foreground">→</div>
          <div>
            <Label className="text-xs">To</Label>
            <div className="h-9 mt-1 px-3 flex items-center rounded-md border bg-muted/30 text-sm font-mono">
              {result == null ? '—' : result.toLocaleString('en-US', { maximumFractionDigits: 6 })}
            </div>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {units.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {result == null && (
          <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 rounded p-2">
            Cannot convert between soil and solution ionic units — pick units from the same group.
          </div>
        )}

        {category === 'temperature' && (
          <div className="text-xs text-muted-foreground">
            Tip: temperature uses special formulas (°C ↔ °F ↔ K), not simple ratios.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
