'use client';

import { useState } from 'react';
import { FlaskConical, Copy, Check, RotateCcw, Calculator as CalcIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { compFromFormula } from '@/lib/nutri-tools-data';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import { SendToMenu } from './SendToMenu';
import { AnimatedCounter } from './AnimatedCounter';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

/**
 * Tool 9 — Fertilizer Composition (% from chemical formula)
 * Wrapped in CalculatorShell for a consistent hero + two-column layout.
 */

const TITLE: TrilingualString = {
  en: 'Fertilizer Composition (from formula)',
  ar: 'تركيب السماد (من الصيغة الكيميائية)',
  fr: "Composition d'engrais (à partir de la formule)",
};

const DESC: TrilingualString = {
  en: 'Parse a chemical formula → elemental %, oxide %, N partition, MW.',
  ar: 'حلّل صيغة كيميائية → نسبة العناصر، نسبة الأكاسيد، تقسيم النيتروجين، الوزن الجزيئي.',
  fr: 'Analyser une formule chimique → % élémentaire, % d\'oxyde, partition N, masse molaire.',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Atomic weights follow IUPAC 2021. Oxide conversion factors are standard agronomic values. Hydrates (·nH₂O) are parsed but the water of crystallization adds to the molecular weight.',
  ar: 'الأوزان الذرية تتبع IUPAC 2021. معاملات تحويل الأكاسيد قيم زراعية قياسية. تُحلّل الهيدرات (·nH₂O) لكن ماء التبلور يُضاف إلى الوزن الجزيئي.',
  fr: "Les masses atomiques suivent IUPAC 2021. Les facteurs d'oxyde sont standards. Les hydrates (·nH₂O) sont analysés mais l'eau de cristallisation s'ajoute à la masse molaire.",
};

export function FertilizerComposition() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [formula, setFormula] = useState('KNO3');
  const [result, setResult] = useState<ReturnType<typeof compFromFormula> | null>(null);
  const [copied, setCopied] = useState(false);

  const calc = () => setResult(compFromFormula(formula));

  const elementLabels: Record<string, string> = {
    N: 'N', N_NO3: 'N as NO₃⁻', N_NH4: 'N as NH₄⁺',
    P: 'P', K: 'K', Ca: 'Ca', Mg: 'Mg', S: 'S', Si: 'Si',
    Zn: 'Zn', Fe: 'Fe', Mn: 'Mn', B: 'B', Cu: 'Cu', Mo: 'Mo',
    C: 'C', H: 'H', O: 'O',
    P2O5: 'P₂O₅', K2O: 'K₂O', CaO: 'CaO', MgO: 'MgO', SiO2: 'SiO₂',
  };

  const examples = ['KNO3', 'H2SO4', 'Ca(NO3)2·4H2O', 'NH4NO3', '(NH4)2SO4', 'KH2PO4', 'MgSO4·7H2O', 'H3BO3', 'ZnSO4'];

  const handleReset = () => {
    setFormula('KNO3'); setResult(null);
    toast({ title: tr('Reset', 'إعادة', 'Réinitialiser') });
  };

  const handleCopy = () => {
    if (!result || !result.ok || !result.comp) return;
    const lines: string[] = [
      '=== FERTILIZER COMPOSITION ===',
      `Formula: ${result.normalized ?? formula}`,
      `Molecular weight: ${result.mw} g/mol`,
    ];
    if (result.comp.N != null) {
      lines.push(`NPK tag: ${result.comp.N.toFixed(1)}-${(result.comp.P2O5 || 0).toFixed(1)}-${(result.comp.K2O || 0).toFixed(1)}`);
    }
    lines.push('', 'Elemental composition (%):');
    for (const sym of ['N', 'N_NO3', 'N_NH4', 'P', 'K', 'Ca', 'Mg', 'S', 'Si', 'Zn', 'Fe', 'Mn', 'B', 'Cu', 'Mo', 'C', 'H', 'O']) {
      const v = result.comp[sym];
      if (v != null && v >= 0.0001) {
        lines.push(`  ${elementLabels[sym] || sym}: ${v.toFixed(3)}%`);
      }
    }
    lines.push('', 'Oxide equivalents (%):');
    for (const sym of ['P2O5', 'K2O', 'CaO', 'MgO', 'SiO2']) {
      const v = result.comp[sym];
      if (v != null && v >= 0.0001) {
        lines.push(`  ${elementLabels[sym]}: ${v.toFixed(3)}%`);
      }
    }
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    toast({ title: tr('Summary Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <CalculatorShell
      icon={FlaskConical}
      title={TITLE}
      description={DESC}
      badge="Chemistry"
      accent="amber"
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
          label: { en: 'Reset', ar: 'إعادة', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      protocolNote={PROTOCOL_NOTE}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-3">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            {tr('Chemical formula', 'الصيغة الكيميائية', 'Formule chimique')}
          </div>
          <div className="flex gap-2">
            <Input
              value={formula}
              onChange={e => setFormula(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && calc()}
              placeholder="e.g. KNO3, Ca(NO3)2·4H2O, NH4NO3"
              className="h-9 font-mono text-sm"
              aria-label={tr('Chemical formula', 'الصيغة الكيميائية', 'Formule chimique')}
            />
            <Button onClick={calc} size="sm" className="h-9 gap-1">
              <CalcIcon className="h-3.5 w-3.5" />
              {tr('Calculate', 'احسب', 'Calculer')}
            </Button>
          </div>

          <div className="flex flex-wrap gap-1">
            {examples.map(ex => (
              <button
                key={ex}
                onClick={() => { setFormula(ex); setResult(compFromFormula(ex)); }}
                className="text-[11px] px-2 py-1 rounded border bg-muted/40 hover:bg-muted font-mono"
              >{ex}</button>
            ))}
          </div>

          {result && !result.ok && (
            <div className="text-xs text-destructive bg-destructive/10 rounded p-2">{result.error}</div>
          )}
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        {result && result.ok && result.comp ? (
          <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="grid grid-cols-2 gap-2 flex-1 min-w-[200px]">
                <div className="p-4 rounded-xl border bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 space-y-1">
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    {tr('Molecular weight', 'الوزن الجزيئي', 'Masse molaire')}
                  </div>
                  <div className="text-2xl font-black font-mono text-amber-700 dark:text-amber-300">
                    <AnimatedCounter value={result.mw} decimals={3} suffix=" g/mol" />
                  </div>
                </div>
                <div className="p-4 rounded-xl border bg-card border-border space-y-1">
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    {tr('Normalized', 'المُطبَّعة', 'Normalisée')}
                  </div>
                  <div className="text-sm font-mono break-all">{result.normalized}</div>
                </div>
              </div>
              <SendToMenu
                sourceToolId="fertilizer-composition"
                targets={[
                  {
                    toolId: 'granular-mix',
                    label: 'Granular Mix Formulation',
                    values: {
                      formula: result.normalized ?? formula,
                      name: result.normalized ?? formula,
                    },
                    description: `add "${result.normalized ?? formula}" as a row`,
                  },
                ]}
              />
            </div>

            {result.comp.N != null && result.comp.N > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                  {tr('NPK tag', 'وسم NPK', 'Étiquette NPK')}
                </div>
                <div className="text-2xl font-black font-mono text-amber-700 dark:text-amber-300">
                  {result.comp.N.toFixed(1)}-{(result.comp.P2O5 || 0).toFixed(1)}-{(result.comp.K2O || 0).toFixed(1)}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-card p-3 space-y-1">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
                  {tr('Elemental composition (%)', 'التركيب العنصري (%)', 'Composition élémentaire (%)')}
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {['N', 'N_NO3', 'N_NH4', 'P', 'K', 'Ca', 'Mg', 'S', 'Si', 'Zn', 'Fe', 'Mn', 'B', 'Cu', 'Mo', 'C', 'H', 'O'].map(sym => {
                    const v = result.comp![sym];
                    if (v == null || v < 0.0001) return null;
                    const isNutrient = !['C', 'H', 'O'].includes(sym);
                    return (
                      <div key={sym} className="flex justify-between text-xs">
                        <span className={isNutrient ? 'font-medium' : 'text-muted-foreground'}>{elementLabels[sym] || sym}</span>
                        <span className="font-mono">{v.toFixed(3)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-xl border bg-card p-3 space-y-1">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
                  {tr('Oxide equivalents (%)', 'مكافئات الأكسيد (%)', 'Équivalents oxyde (%)')}
                </div>
                <div className="space-y-1">
                  {['P2O5', 'K2O', 'CaO', 'MgO', 'SiO2'].map(sym => {
                    const v = result.comp![sym];
                    if (v == null || v < 0.0001) return null;
                    return (
                      <div key={sym} className="flex justify-between text-xs">
                        <span className="font-medium">{elementLabels[sym]}</span>
                        <span className="font-mono">{v.toFixed(3)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[200px] text-sm text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
            {tr('Enter a formula and press Calculate.', 'أدخل صيغة واضغط احسب.', 'Saisissez une formule et cliquez sur Calculer.')}
          </div>
        )}
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
