'use client';

import { useMemo, useState } from 'react';
import { Leaf, Copy, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';
import {
  CARBON_FACTORS, computeCarbonRow, type CarbonRow, type CarbonResult,
} from '@/lib/nutri-tools-data';

interface ScenarioState {
  rows: CarbonRow[];
}

const newRow = (fertilizerId: string): CarbonRow => ({
  id: Math.random().toString(36).slice(2, 9),
  fertilizerId,
  rateKgPerHa: 100,
  originKm: 100,
  seaKm: 0,
  portKm: 50,
  mode: 'estimated',
});

const DEFAULT_A: ScenarioState = { rows: [newRow('urea')] };
const DEFAULT_B: ScenarioState = { rows: [newRow('ammonium_nitrate')] };

const TITLE: TrilingualString = {
  en: 'Fertilizer Carbon Footprint',
  ar: 'البصمة الكربونية للأسمدة',
  fr: 'Empreinte Carbone des Engrais',
};

const DESC: TrilingualString = {
  en: 'Compare two fertilization programs. Manufacturing (Fertilizers Europe 2020) + transport (DEFRA 2024) + field N₂O (IPCC 2006).',
  ar: 'قارن برنامجين للتسميد. التصنيع (Fertilizers Europe 2020) + النقل (DEFRA 2024) + أكسيد النيتروجين الحقلي (IPCC 2006).',
  fr: 'Comparez deux programmes de fertilisation. Fabrication (Fertilizers Europe 2020) + transport (DEFRA 2024) + N₂O champ (IPCC 2006).',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Pickup-km equivalence uses DESNZ/DEFRA 2024 factor: 0.254 kg CO₂e/km.',
  ar: 'تكافئ كيلومترات السيارة البيك أب عامل DESNZ/DEFRA 2024: 0.254 كغ مكافئ CO₂/كم.',
  fr: 'L\'équivalent pickup-km utilise le facteur DESNZ/DEFRA 2024 : 0,254 kg CO₂e/km.',
};

/**
 * Tool 18 — Fertilizer Carbon Footprint
 */
export function FertilizerCarbonFootprint() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  const [a, setA] = useState<ScenarioState>(DEFAULT_A);
  const [b, setB] = useState<ScenarioState>(DEFAULT_B);
  const [copied, setCopied] = useState(false);

  const calcRows = useMemo(() => {
    const calc = (s: ScenarioState) =>
      s.rows.map(r => ({ row: r, res: computeCarbonRow(r) }));
    return { a: calc(a), b: calc(b) };
  }, [a, b]);

  const totals = useMemo(() => {
    const sum = (arr: { res: CarbonResult }[]) =>
      arr.reduce(
        (acc, x) => {
          acc.mfg += x.res.mfg;
          acc.transport += x.res.transport;
          acc.field += x.res.field;
          acc.total += x.res.total;
          return acc;
        },
        { mfg: 0, transport: 0, field: 0, total: 0 },
      );
    return { a: sum(calcRows.a), b: sum(calcRows.b) };
  }, [calcRows]);

  const maxTotal = Math.max(totals.a.total, totals.b.total, 1);
  const diff = totals.b.total - totals.a.total;
  const lower = diff > 0 ? 'A' : diff < 0 ? 'B' : 'tie';
  const pct = maxTotal > 0 ? Math.abs(diff) / maxTotal * 100 : 0;

  const updateRow = (which: 'a' | 'b', idx: number, patch: Partial<CarbonRow>) => {
    const set = which === 'a' ? setA : setB;
    set(prev => ({
      ...prev,
      rows: prev.rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    }));
  };

  const addRow = (which: 'a' | 'b') => {
    const set = which === 'a' ? setA : setB;
    set(prev => prev.rows.length < 5 ? { ...prev, rows: [...prev.rows, newRow('urea')] } : prev);
  };

  const removeRow = (which: 'a' | 'b', idx: number) => {
    const set = which === 'a' ? setA : setB;
    set(prev => prev.rows.length > 1
      ? { ...prev, rows: prev.rows.filter((_, i) => i !== idx) }
      : prev);
  };

  const handleReset = () => {
    setA(DEFAULT_A);
    setB(DEFAULT_B);
    toast({ title: tr('Reset to defaults', 'تمت إعادة التعيين', 'Réinitialisé') });
  };

  const handleCopy = () => {
    const lines = [
      `=== FERTILIZER CARBON FOOTPRINT ===`,
      ``,
      `Scenario A total: ${totals.a.total.toFixed(1)} kg CO₂e/ha`,
      `  mfg: ${totals.a.mfg.toFixed(1)} · transport: ${totals.a.transport.toFixed(1)} · field: ${totals.a.field.toFixed(1)}`,
      ``,
      `Scenario B total: ${totals.b.total.toFixed(1)} kg CO₂e/ha`,
      `  mfg: ${totals.b.mfg.toFixed(1)} · transport: ${totals.b.transport.toFixed(1)} · field: ${totals.b.field.toFixed(1)}`,
      ``,
      lower === 'tie'
        ? `Both scenarios are equal.`
        : `Scenario ${lower} is lower by ${Math.abs(diff).toFixed(1)} kg CO₂e/ha (${pct.toFixed(1)}%)`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    toast({ title: tr('Summary Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <CalculatorShell
      icon={Leaf}
      title={TITLE}
      description={DESC}
      badge="Fertilizers Europe 2020"
      accent="emerald"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' },
          onClick: handleCopy,
          variant: 'primary',
          showCheck: copied,
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      protocolNote={PROTOCOL_NOTE}
    >
      {/* Full-width comparison summary at the top */}
      <div className="lg:col-span-12">
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <Leaf className="h-4 w-4 text-emerald-600" />
              {tr('Carbon Comparison', 'مقارنة الكربون', 'Comparaison carbone')}
            </span>
            <span className="font-mono text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 rounded-lg px-2 py-0.5">
              {lower === 'tie'
                ? tr('Tie', 'تعادل', 'Égalité')
                : `${tr('Scenario', 'السيناريو', 'Scénario')} ${lower} ${tr('wins', 'يفوز', 'gagne')}`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CalculatorShell.MetricTile
              label={`${tr('Scenario', 'السيناريو', 'Scénario')} A`}
              value={totals.a.total.toFixed(1)}
              unit="kg CO₂e/ha"
              color="emerald"
              helper={tr(`mfg ${totals.a.mfg.toFixed(0)} · transport ${totals.a.transport.toFixed(0)} · field ${totals.a.field.toFixed(0)}`, `تصنيع ${totals.a.mfg.toFixed(0)} · نقل ${totals.a.transport.toFixed(0)} · حقلي ${totals.a.field.toFixed(0)}`, `fab. ${totals.a.mfg.toFixed(0)} · transport ${totals.a.transport.toFixed(0)} · champ ${totals.a.field.toFixed(0)}`)}
            />
            <CalculatorShell.MetricTile
              label={`${tr('Scenario', 'السيناريو', 'Scénario')} B`}
              value={totals.b.total.toFixed(1)}
              unit="kg CO₂e/ha"
              color="amber"
              helper={tr(`mfg ${totals.b.mfg.toFixed(0)} · transport ${totals.b.transport.toFixed(0)} · field ${totals.b.field.toFixed(0)}`, `تصنيع ${totals.b.mfg.toFixed(0)} · نقل ${totals.b.transport.toFixed(0)} · حقلي ${totals.b.field.toFixed(0)}`, `fab. ${totals.b.mfg.toFixed(0)} · transport ${totals.b.transport.toFixed(0)} · champ ${totals.b.field.toFixed(0)}`)}
            />
          </div>

          {/* Comparison bar */}
          <div className="rounded-lg border border-border/60 p-3 space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span>{tr('Scenario A', 'السيناريو A', 'Scénario A')}: <span className="tabular-nums">{totals.a.total.toFixed(1)}</span> kg CO₂e/ha</span>
              <span>{tr('Scenario B', 'السيناريو B', 'Scénario B')}: <span className="tabular-nums">{totals.b.total.toFixed(1)}</span> kg CO₂e/ha</span>
            </div>
            <div className="space-y-1">
              <CompareBar label="A" total={totals.a.total} max={maxTotal} color="#2563eb" />
              <CompareBar label="B" total={totals.b.total} max={maxTotal} color="#ea580c" />
            </div>
            <div className="text-xs text-center pt-1">
              {lower === 'tie' ? (
                <span className="text-muted-foreground">{tr('Both scenarios are equal.', 'السيناريوهان متساويان.', 'Les deux scénarios sont égaux.')}</span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400">
                  {tr(`Scenario`, `السيناريو`, `Scénario`)} <strong>{lower}</strong> {tr(`is lower by`, `أقل بـ`, `est plus bas de`)} <strong className="tabular-nums">{Math.abs(diff).toFixed(1)}</strong> kg CO₂e/ha ({pct.toFixed(1)}%).
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scenario A editor on the left */}
      <CalculatorShell.Inputs>
        <ScenarioEditor
          title={tr('Scenario A', 'السيناريو A', 'Scénario A')}
          tone="#2563eb"
          scenario={a}
          rows={calcRows.a}
          totals={totals.a}
          maxTotal={maxTotal}
          onUpdate={(i, p) => updateRow('a', i, p)}
          onAdd={() => addRow('a')}
          onRemove={i => removeRow('a', i)}
          language={language}
        />
      </CalculatorShell.Inputs>

      {/* Scenario B editor on the right */}
      <CalculatorShell.Results>
        <ScenarioEditor
          title={tr('Scenario B', 'السيناريو B', 'Scénario B')}
          tone="#ea580c"
          scenario={b}
          rows={calcRows.b}
          totals={totals.b}
          maxTotal={maxTotal}
          onUpdate={(i, p) => updateRow('b', i, p)}
          onAdd={() => addRow('b')}
          onRemove={i => removeRow('b', i)}
          language={language}
        />
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}

function CompareBar({ label, total, max, color }: { label: string; total: number; max: number; color: string }) {
  const w = max > 0 ? Math.max(2, (total / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] w-3 text-muted-foreground">{label}</span>
      <div className="flex-1 h-3 rounded-full bg-muted/40 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${w}%`, background: color }} />
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground w-12 text-right">{total.toFixed(0)}</span>
    </div>
  );
}

function StackedBreakdown({ t, max }: { t: { mfg: number; transport: number; field: number; total: number }; max: number }) {
  const segs = [
    { v: t.mfg, color: '#1e3a8a', label: 'mfg' },
    { v: t.transport, color: '#0891b2', label: 'transport' },
    { v: t.field, color: '#16a34a', label: 'field' },
  ];
  return (
    <div className="space-y-1">
      <div className="flex h-3 rounded-full overflow-hidden bg-muted/40">
        {segs.map(s => (
          <div key={s.label}
            style={{
              width: `${max > 0 ? (s.v / max) * 100 : 0}%`,
              background: s.color,
            }}
            title={`${s.label}: ${s.v.toFixed(2)} kg CO₂e/ha`}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>mfg <span className="tabular-nums">{t.mfg.toFixed(1)}</span></span>
        <span>transport <span className="tabular-nums">{t.transport.toFixed(1)}</span></span>
        <span>field <span className="tabular-nums">{t.field.toFixed(1)}</span></span>
      </div>
    </div>
  );
}

function ScenarioEditor({
  title, tone, rows, totals, maxTotal, onUpdate, onAdd, onRemove, language,
}: {
  title: string;
  tone: string;
  scenario: ScenarioState;
  rows: { row: CarbonRow; res: CarbonResult }[];
  totals: { mfg: number; transport: number; field: number; total: number };
  maxTotal: number;
  onUpdate: (i: number, p: Partial<CarbonRow>) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  language: string;
}) {
  const tr = (en: string, ar: string, fr: string) => copyFor(language as any, en, ar, fr);
  return (
    <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-3">
      <div className="flex items-center justify-between border-b pb-3">
        <h4 className="text-sm font-semibold" style={{ color: tone }}>{title}</h4>
        <Button size="sm" variant="outline" onClick={onAdd} disabled={rows.length >= 5}>+ {tr('Row', 'صف', 'Ligne')}</Button>
      </div>
      {rows.map(({ row, res }, i) => (
        <div key={row.id} className="rounded-md border border-border/40 p-2 space-y-1.5 text-xs">
          <div className="flex gap-2 items-center">
            <Select value={row.fertilizerId} onValueChange={v => onUpdate(i, { fertilizerId: v })}>
              <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CARBON_FACTORS.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <button
              onClick={() => onRemove(i)}
              className="text-muted-foreground hover:text-destructive px-1"
              aria-label="Remove row"
              disabled={rows.length <= 1}
            >×</button>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <NumCell label={tr('Rate (kg/ha)', 'الكمية (كغ/هكتار)', 'Dose (kg/ha)')} value={row.rateKgPerHa} onChange={v => onUpdate(i, { rateKgPerHa: v })} />
            <NumCell label={tr('Origin road km', 'طريق المنشأ كم', 'Route origine km')} value={row.originKm} onChange={v => onUpdate(i, { originKm: v })} />
            <NumCell label={tr('Sea km', 'بحري كم', 'Mer km')} value={row.seaKm} onChange={v => onUpdate(i, { seaKm: v })} />
            <NumCell label={tr('Port road km', 'طريق الميناء كم', 'Route port km')} value={row.portKm} onChange={v => onUpdate(i, { portKm: v })} />
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-[10px] text-muted-foreground pt-0.5">
            <span>mfg: <span className="tabular-nums font-medium text-foreground">{res.mfg.toFixed(2)}</span></span>
            <span>transport: <span className="tabular-nums font-medium text-foreground">{res.transport.toFixed(2)}</span></span>
            <span>field: <span className="tabular-nums font-medium text-foreground">{res.field.toFixed(2)}</span></span>
            <span>total: <span className="tabular-nums font-bold" style={{ color: tone }}>{res.total.toFixed(2)}</span></span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            {tr('Pickup-km equivalent', 'تكافئ كيلومترات السيارة', 'Équivalent pickup-km')}: <span className="tabular-nums font-medium text-foreground">{res.pickupKm.toFixed(0)} km</span>
          </div>
        </div>
      ))}
      <div className="pt-1">
        <div className="flex justify-between text-xs font-medium mb-1">
          <span>{tr('Total', 'الإجمالي', 'Total')}</span>
          <span className="tabular-nums" style={{ color: tone }}>{totals.total.toFixed(1)} kg CO₂e/ha</span>
        </div>
        <StackedBreakdown t={totals} max={maxTotal} />
      </div>
    </div>
  );
}

function NumCell({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <Label className="text-[9px] text-muted-foreground block leading-none mb-0.5">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="h-7 text-xs px-1.5"
      />
    </div>
  );
}
