'use client';

import { useState } from 'react';
import { ArrowRightLeft, Copy, Check, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NUTRIENT_DATA } from '@/lib/nutri-tools-data';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

type Cell = { ppm: string; mmol: string; meq: string };

const TITLE: TrilingualString = {
  en: 'Nutrient Units Converter',
  ar: 'محوّل وحدات العناصر الغذائية',
  fr: "Convertisseur d'Unités Nutritionnelles",
};

const DESC: TrilingualString = {
  en: 'Bidirectional ppm ↔ mmol (or µmol for micros) ↔ meq/L. Type in any cell — the other two update.',
  ar: 'تحويل ثنائي الاتجاه بين ppm وmmol (أو µmol للعناصر الصغرى) وmeq/L. اكتب في أي خلية — تتحدّث الخليتان الأخريان.',
  fr: 'Conversion bidirectionnelle ppm ↔ mmol (ou µmol pour les oligo-éléments) ↔ meq/L. Saisissez dans n\'importe quelle cellule — les deux autres se mettent à jour.',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Atomic weights follow IUPAC 2021. For micronutrients (Fe, Mn, Zn, Cu, B, Mo) use µmol/L — values are typically < 50 ppm and mmol/L would be inconveniently small.',
  ar: 'تتبع الأوزان الذرية معايير IUPAC 2021. للعناصر الصغرى (Fe, Mn, Zn, Cu, B, Mo) استخدم µmol/L — القيم عادةً أقل من 50 ppm ويكون mmol/L صغيراً جداً وغير عملي.',
  fr: "Les masses atomiques suivent IUPAC 2021. Pour les oligo-éléments (Fe, Mn, Zn, Cu, B, Mo), utilisez µmol/L — les valeurs sont généralement < 50 ppm et mmol/L serait peu pratique.",
};

/**
 * Tool 2 — Nutrient Units Converter (ppm / mmol / meq)
 * Bidirectional 3-way conversion per nutrient.
 * Wrapped in CalculatorShell for a consistent hero + two-column layout.
 */
export function NutrientUnitsConverter() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);
  const [cells, setCells] = useState<Record<string, Cell>>({});
  const [copied, setCopied] = useState(false);

  const update = (key: string, source: 'ppm' | 'mmol' | 'meq', raw: string) => {
    const data = NUTRIENT_DATA.find(n => n.key === key)!;
    const useUmol = !!data.useUmol;
    const value = parseFloat(raw.replace(',', '.'));
    setCells(prev => {
      const cell = { ...(prev[key] || { ppm: '', mmol: '', meq: '' }) };
      cell[source] = raw;
      if (!raw || !Number.isFinite(value)) {
        if (source === 'ppm') { cell.mmol = ''; cell.meq = ''; }
        if (source === 'mmol') { cell.ppm = ''; cell.meq = ''; }
        if (source === 'meq') { cell.ppm = ''; cell.mmol = ''; }
        return { ...prev, [key]: cell };
      }
      let ppm = 0, mmol = 0, meq = 0;
      if (source === 'ppm') {
        ppm = value;
        mmol = ppm / data.mw;
        meq = mmol * data.valence;
      } else if (source === 'mmol') {
        mmol = useUmol ? value / 1000 : value;
        ppm = mmol * data.mw;
        meq = mmol * data.valence;
      } else {
        meq = value;
        mmol = meq / data.valence;
        ppm = mmol * data.mw;
      }
      if (source !== 'ppm') cell.ppm = ppm.toFixed(3);
      if (source !== 'mmol') cell.mmol = useUmol ? (mmol * 1000).toFixed(2) : mmol.toFixed(3);
      if (source !== 'meq') cell.meq = meq.toFixed(3);
      return { ...prev, [key]: cell };
    });
  };

  // Split nutrients into macros and micros for clearer grouping
  const macros = NUTRIENT_DATA.filter(n => !n.useUmol);
  const micros = NUTRIENT_DATA.filter(n => n.useUmol);

  const handleReset = () => {
    setCells({});
    toast({ title: tr('Cleared', 'تم المسح', 'Effacé') });
  };

  const handleCopy = () => {
    const lines: string[] = ['=== NUTRIENT UNITS CONVERTER ==='];
    for (const n of NUTRIENT_DATA) {
      const c = cells[n.key];
      if (c && (c.ppm || c.mmol || c.meq)) {
        const unitLabel = n.useUmol ? 'µmol/L' : 'mmol/L';
        lines.push(
          `${n.label} (MW ${n.mw}, val ${n.valence}): ppm=${c.ppm || '-'} | ${unitLabel}=${c.mmol || '-'} | meq/L=${c.meq || '-'}`,
        );
      }
    }
    if (lines.length === 1) lines.push('(no values entered)');
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    toast({ title: tr('Summary Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  const renderCard = (n: typeof NUTRIENT_DATA[number]) => {
    const cell = cells[n.key] || { ppm: '', mmol: '', meq: '' };
    return (
      <div key={n.key} className="rounded-lg border border-border bg-card/50 p-2.5 hover:border-sky-300 transition-colors">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold">{n.label}</span>
            <span className="text-[10px] text-muted-foreground font-mono">MW {n.mw} · val {n.valence}</span>
          </div>
          {n.useUmol && <Badge variant="outline" className="text-[9px] px-1 py-0">µmol</Badge>}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">ppm</div>
            <Input type="number" value={cell.ppm} onChange={e => update(n.key, 'ppm', e.target.value)} placeholder="0" className="h-8 text-xs" />
          </div>
          <div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">{n.useUmol ? 'µmol' : 'mmol'}</div>
            <Input type="number" value={cell.mmol} onChange={e => update(n.key, 'mmol', e.target.value)} placeholder="0" className="h-8 text-xs" />
          </div>
          <div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">meq/L</div>
            <Input type="number" value={cell.meq} onChange={e => update(n.key, 'meq', e.target.value)} placeholder="0" className="h-8 text-xs" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <CalculatorShell
      icon={ArrowRightLeft}
      title={TITLE}
      description={DESC}
      badge="Lab Utility"
      accent="sky"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Table', ar: 'نسخ الجدول', fr: 'Copier' },
          onClick: handleCopy,
          variant: 'primary',
          showCheck: copied,
        },
        {
          icon: RotateCcw,
          label: { en: 'Clear All', ar: 'مسح الكل', fr: 'Effacer' },
          onClick: handleReset,
        },
      ]}
      protocolNote={PROTOCOL_NOTE}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-3">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            {tr('Macronutrients & ions', 'العناصر الكبرى والأيونات', 'Macroéléments & ions')}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {macros.map(renderCard)}
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-3">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            {tr('Micronutrients (use µmol/L)', 'العناصر الصغرى (تستخدم µmol/L)', 'Oligo-éléments (µmol/L)')}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {micros.map(renderCard)}
          </div>
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
