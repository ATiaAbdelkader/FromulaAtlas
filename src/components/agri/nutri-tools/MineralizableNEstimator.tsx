'use client';

import { useState } from 'react';
import { FlaskConical, Copy, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';
import { TMIN_PRESETS, ROOT_REACH_BY_SYSTEM } from '@/lib/nutri-tools-data';
import { AnimatedCounter } from './AnimatedCounter';

/**
 * Tool 14 — Mineralizable N Estimation
 */

interface MineralNExample {
  label: string;
  mo: string;
  da: string;
  p: string;
  r: string;
  tmin: string;
}

const MINERAL_N_EXAMPLES: MineralNExample[] = [
  { label: 'Loamy soil 2% OM', mo: '2',   da: '1.3', p: '30', r: '80', tmin: '2' },
  { label: 'Sandy poor soil',  mo: '0.8', da: '1.5', p: '20', r: '60', tmin: '1' },
  { label: 'Rich clayey',      mo: '3.5', da: '1.1', p: '40', r: '90', tmin: '3' },
];

const TITLE: TrilingualString = {
  en: 'Mineralizable N Estimation',
  ar: 'تقدير النيتروجين القابل للتمعدن',
  fr: 'Estimation de l’Azote Minéralisable',
};

const DESC: TrilingualString = {
  en: 'Annual N release from soil organic matter (kg N/ha/year).',
  ar: 'إطلاق النيتروجين السنوي من المادة العضوية للتربة (كغ N/هكتار/سنة).',
  fr: 'Relargage annuel d’azote depuis la matière organique du sol (kg N/ha/an).',
};

const FORMULA_LABEL: TrilingualString = {
  en: 'Master formula',
  ar: 'الصيغة الرئيسية',
  fr: 'Formule principale',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Orientative result: sensitive to bulk density, depth, root %, and T_min. Validate with field observation and local soil test calibration.',
  ar: 'نتيجة تقريبية: حساسة للكثافة الظاهرية والعمق ونسبة الجذور و T_min. تحقق من ذلك بالملاحظة الحقلية ومعايرة تحليل التربة المحلي.',
  fr: 'Résultat indicatif : sensible à la densité apparente, profondeur, % racinaire et T_min. Valider par observation au champ et étalonnage local.',
};

export function MineralizableNEstimator() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [mo, setMo] = useState('2');
  const [da, setDa] = useState('1.20');
  const [p, setP] = useState('30');
  const [r, setR] = useState('70');
  const [nmo, setNmo] = useState('5');
  const [tmin, setTmin] = useState('2');
  const [copied, setCopied] = useState(false);

  const applyExample = (ex: MineralNExample) => {
    setMo(ex.mo);
    setDa(ex.da);
    setP(ex.p);
    setR(ex.r);
    setTmin(ex.tmin);
  };

  const MO = parseFloat(mo) || 0;
  const DA = parseFloat(da) || 0;
  const Pn = parseFloat(p) || 0;
  const R = Math.min(100, Math.max(1, parseFloat(r) || 0));
  const Nmo = Math.min(100, Math.max(0.1, parseFloat(nmo) || 0));
  const Tmin = Math.min(3, Math.max(1, parseFloat(tmin) || 0));

  const Mtotal = 10000 * (Pn / 100) * DA * 1000;
  const Meff = Mtotal * (R / 100);
  const MOkg = Meff * (MO / 100);
  const Norg = MOkg * (Nmo / 100);
  const Nmin = Norg * (Tmin / 100);

  const handleReset = () => {
    setMo('2'); setDa('1.20'); setP('30'); setR('70'); setNmo('5'); setTmin('2');
    toast({ title: tr('Reset', 'إعادة', 'Réinitialiser') });
  };

  const handleCopy = () => {
    const lines = [
      '=== MINERALIZABLE N ESTIMATION ===',
      `Soil OM: ${mo}% · Bulk density: ${da} g/cm³ · Depth: ${p} cm`,
      `Root exploration: ${R}% · N in OM: ${nmo}% · T_min: ${Tmin.toFixed(1)}%`,
      '',
      `Total soil mass: ${Mtotal.toFixed(0)} kg/ha`,
      `Effective soil mass: ${Meff.toFixed(0)} kg/ha`,
      `Organic matter: ${MOkg.toFixed(0)} kg/ha`,
      `Organic N: ${Norg.toFixed(1)} kg/ha`,
      `Mineralizable N (annual): ${Nmin.toFixed(2)} kg N/ha/yr`,
    ];
    navigator.clipboard?.writeText(lines.join('\n'));
    setCopied(true);
    toast({ title: tr('Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <CalculatorShell
      icon={FlaskConical}
      title={TITLE}
      description={DESC}
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
      formula="N_min = 10000 × (P/100) × DA × 1000 × (R/100) × (MO/100) × (N_MO/100) × (T_min/100)"
      formulaLabel={FORMULA_LABEL}
      formulaResult={`${Nmin.toFixed(2)} kg N/ha/yr`}
      protocolNote={PROTOCOL_NOTE}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-amber-600" />
              {tr('Soil Inputs', 'مدخلات التربة', 'Données du sol')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CalculatorShell.InputField
              label={tr('Soil organic matter (%)', 'المادة العضوية (%)', 'Matière organique (%)')}
              value={mo}
              onChange={setMo}
              step="0.1"
            />
            <CalculatorShell.InputField
              label={tr('Bulk density (g/cm³)', 'الكثافة الظاهرية (غ/سم³)', 'Densité apparente (g/cm³)')}
              value={da}
              onChange={setDa}
              step="0.05"
            />
            <CalculatorShell.InputField
              label={tr('Effective depth (cm)', 'العمق الفعال (سم)', 'Profondeur efficace (cm)')}
              value={p}
              onChange={setP}
            />
            <CalculatorShell.InputField
              label={tr('Root exploration (%)', 'استكشاف الجذور (%)', 'Exploration racinaire (%)')}
              value={r}
              onChange={setR}
              helper={tr('1–100% of profile', '1–100% من المجال', '1–100% du profil')}
            />
            <CalculatorShell.InputField
              label={tr('N fraction in OM (%)', 'نسبة النيتروجين في OM (%)', 'Fraction N dans MO (%)')}
              value={nmo}
              onChange={setNmo}
              step="0.1"
            />
            <div className="p-3 rounded-xl border bg-card space-y-1">
              <span className="text-xs font-bold text-foreground">{tr('Mineralization rate T_min (%)', 'معدل التمعدن T_min (%)', 'Taux de minéralisation T_min (%)')}</span>
              <Input
                value={tmin}
                onChange={e => setTmin(e.target.value)}
                className="h-9 text-xs font-mono font-bold"
                step="0.1"
              />
              <div className="flex gap-1 mt-1 flex-wrap">
                {TMIN_PRESETS.map(preset => (
                  <button
                    key={preset.tmin}
                    onClick={() => setTmin(String(preset.tmin))}
                    className={`text-[10px] px-2 py-0.5 rounded border ${Math.abs(parseFloat(tmin) - preset.tmin) < 0.05 ? 'bg-amber-100 dark:bg-amber-950 border-amber-400 text-amber-700 dark:text-amber-300' : 'bg-muted/40 border-border hover:bg-muted/70'}`}
                    title={preset.title}
                  >{preset.tmin}%</button>
                ))}
              </div>
            </div>
          </div>

          {/* Worked-example chips */}
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">
              {tr('Try an example', 'جرّب مثالاً', 'Essayer un exemple')}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {MINERAL_N_EXAMPLES.map(ex => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => applyExample(ex)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              ✨ {tr('Mineralization Results', 'نتائج التمعدن', 'Résultats de minéralisation')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CalculatorShell.MetricTile
              label={tr('Total soil mass', 'كتلة التربة الكلية', 'Masse totale du sol')}
              value={Mtotal.toFixed(0)}
              unit="kg/ha"
              color="amber"
            />
            <CalculatorShell.MetricTile
              label={tr('Effective soil mass', 'الكتلة الفعالة', 'Masse efficace du sol')}
              value={Meff.toFixed(0)}
              unit="kg/ha"
              color="emerald"
            />
            <CalculatorShell.MetricTile
              label={tr('Organic matter', 'المادة العضوية', 'Matière organique')}
              value={MOkg.toFixed(0)}
              unit="kg/ha"
              color="emerald"
            />
            <CalculatorShell.MetricTile
              label={tr('Organic N', 'النيتروجين العضوي', 'Azote organique')}
              value={Norg.toFixed(1)}
              unit="kg/ha"
              color="teal"
            />
          </div>

          {/* Hero result */}
          <div className="rounded-lg p-4 bg-gradient-to-br from-amber-600 to-orange-700 text-white text-center">
            <div className="text-xs uppercase tracking-wide opacity-90">
              {tr('Mineralizable N (annual)', 'النيتروجين القابل للتمعدن (سنوي)', 'Azote minéralisable (annuel)')}
            </div>
            <div className="mt-1">
              <AnimatedCounter value={Nmin} decimals={2} suffix=" kg N/ha/yr" className="text-4xl font-bold" />
            </div>
            <div className="text-[11px] opacity-80 mt-1">
              T_min = {Tmin.toFixed(1)}% · OM = {MO}% · depth = {Pn} cm · reach = {R}%
            </div>
          </div>

          {/* Warning */}
          <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded p-2 border border-amber-200 dark:border-amber-900">
            ⚠️ {tr(
              'Orientative result: sensitive to DA, depth, root %, and T_min. Validate with field observation.',
              'نتيجة تقريبية: حساسة للكثافة الظاهرية والعمق ونسبة الجذور و T_min. تحقق من ذلك بالملاحظة الحقلية.',
              'Résultat indicatif : sensible à DA, profondeur, % racinaire et T_min. Valider par observation au champ.',
            )}
          </div>

          {/* Root-reach reference */}
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">
              {tr('Root exploration reference by system', 'مرجع استكشاف الجذور حسب النظام', 'Référence d’exploration racinaire par système')}
            </summary>
            <table className="w-full mt-2">
              <tbody>
                {ROOT_REACH_BY_SYSTEM.map(s => (
                  <tr key={s.system} className="border-b last:border-0">
                    <td className="py-1 pr-3">{s.system}</td>
                    <td className="py-1 text-right font-mono">{s.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
