'use client';

import { useState, useMemo } from 'react';
import { Recycle, Plus, Trash2, CheckCircle2, AlertTriangle, Droplets, Copy, Check, RotateCcw } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

interface Feedstock { id: string; name: string; C: number; N: number; moisture: number; weight: number; }

const COMMON_FEEDSTOCKS = [
  { name: 'Grass clippings', name_ar: 'قصاصات العشب', name_fr: 'Tonture', C: 45, N: 3.0, moisture: 80 },
  { name: 'Leaves (dry)', name_ar: 'أوراق جافة', name_fr: 'Feuilles sèches', C: 48, N: 0.8, moisture: 15 },
  { name: 'Food waste', name_ar: 'مخلفات غذائية', name_fr: 'Déchets alimentaires', C: 45, N: 2.5, moisture: 75 },
  { name: 'Manure (cattle)', name_ar: 'روث أبقار', name_fr: 'Fumier bovin', C: 40, N: 2.0, moisture: 80 },
  { name: 'Manure (poultry)', name_ar: 'روث دواجن', name_fr: 'Fientes volaille', C: 35, N: 4.0, moisture: 60 },
  { name: 'Straw', name_ar: 'قش', name_fr: 'Paille', C: 48, N: 0.5, moisture: 10 },
  { name: 'Wood chips', name_ar: 'رقائق خشب', name_fr: 'Copeaux bois', C: 50, N: 0.2, moisture: 20 },
  { name: 'Coffee grounds', name_ar: 'تفل القهوة', name_fr: 'Marc café', C: 50, N: 2.0, moisture: 60 },
  { name: 'Cardboard (shredded)', name_ar: 'كرتون ممزق', name_fr: 'Carton', C: 45, N: 0.1, moisture: 8 },
  { name: 'Alfalfa hay', name_ar: 'دريس البرسيم', name_fr: 'Luzerne', C: 45, N: 3.0, moisture: 15 },
];

const TITLE: TrilingualString = {
  en: 'Compost Mixer Calculator',
  ar: 'حاسبة خلط الكمبوست',
  fr: 'Calculateur de Mélange Compost',
};
const DESC: TrilingualString = {
  en: 'C:N ratio · moisture adjustment · 10 common feedstocks · target 30:1',
  ar: 'نسبة C:N · ضبط الرطوبة · 10 مواد أولية شائعة · الهدف 30:1',
  fr: 'Ratio C:N · ajustement humidité · 10 matières · cible 30:1',
};

export function CompostMixerCalculator() {
  const { language, isRTL } = useTranslation();
  const isAr = language === 'ar';
  const isFr = language === 'fr';
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [feedstocks, setFeedstocks] = useState<Feedstock[]>([
    { id: '1', name: 'Grass clippings', C: 45, N: 3.0, moisture: 80, weight: 50 },
    { id: '2', name: 'Leaves (dry)', C: 48, N: 0.8, moisture: 15, weight: 50 },
  ]);
  const [targetCn, setTargetCn] = useState(30);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const totalC = feedstocks.reduce((s, f) => s + f.C * f.weight, 0);
    const totalN = feedstocks.reduce((s, f) => s + f.N * f.weight, 0);
    const totalWeight = feedstocks.reduce((s, f) => s + f.weight, 0);
    const cn = totalN > 0 ? totalC / totalN : 0;
    const avgMoisture = totalWeight > 0 ? feedstocks.reduce((s, f) => s + f.moisture * f.weight, 0) / totalWeight : 0;
    const dryWeight = totalWeight * (1 - avgMoisture / 100);
    const waterToAdd = avgMoisture < 55 ? (dryWeight * (0.60 - avgMoisture / 100)) / (1 - 0.60) : 0;
    const waterToRemove = avgMoisture > 65 ? (totalWeight * (avgMoisture - 0.60)) / (1 - 0.60) : 0;
    return { cn, avgMoisture, totalWeight, waterToAdd, waterToRemove, targetMet: cn >= targetCn * 0.85 && cn <= targetCn * 1.15 };
  }, [feedstocks, targetCn]);

  const addFeedstock = () => {
    const f = COMMON_FEEDSTOCKS[feedstocks.length % COMMON_FEEDSTOCKS.length];
    setFeedstocks([...feedstocks, { id: String(Date.now()), ...f, weight: 20 }]);
  };
  const update = (id: string, patch: Partial<Feedstock>) => setFeedstocks((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const remove = (id: string) => setFeedstocks((fs) => fs.filter((f) => f.id !== id));

  const handleReset = () => {
    setFeedstocks([
      { id: '1', name: 'Grass clippings', C: 45, N: 3.0, moisture: 80, weight: 50 },
      { id: '2', name: 'Leaves (dry)', C: 48, N: 0.8, moisture: 15, weight: 50 },
    ]);
    setTargetCn(30);
    toast({ title: tr('Reset', 'إعادة', 'Réinitialiser') });
  };

  const handleCopy = () => {
    const lines = feedstocks.map((f) => `  ${f.name}: ${f.weight}kg (C:${f.C} N:${f.N} M:${f.moisture}%)`);
    const text = `=== COMPOST MIX ===\n${lines.join('\n')}\n\nC:N: ${result.cn.toFixed(1)}:1 (target ${targetCn}:1)\nMoisture: ${result.avgMoisture.toFixed(0)}%\nTotal: ${result.totalWeight.toFixed(0)} kg\n${result.waterToAdd > 0 ? `Add water: ${result.waterToAdd.toFixed(0)} L` : ''}${result.waterToRemove > 0 ? `Add dry material: ${result.waterToRemove.toFixed(0)} kg` : ''}`.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: tr('Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <CalculatorShell
      icon={Recycle}
      title={TITLE}
      description={DESC}
      badge="Compost Science"
      accent="emerald"
      actions={[
        { icon: Copy, label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' }, onClick: handleCopy, variant: 'primary', showCheck: copied },
        { icon: RotateCcw, label: { en: 'Reset', ar: 'إعادة', fr: 'Réinitialiser' }, onClick: handleReset },
      ]}
      protocolNote={{
        en: 'Aim for a balanced mix near 30:1 for active decomposition. Pile should reach 55-65°C within 3 days. Turn when temperature drops below 50°C.',
        ar: 'استهدف خليطاً متوازناً قريباً من 30:1 لتحلل نشط. يُفترض أن تصل الكومة إلى 55–65°م خلال 3 أيام. قلّب عندما تنخفض الحرارة عن 50°م.',
        fr: 'Visez un ratio C:N proche de 30:1. La pile doit atteindre 55-65°C en 3 jours. Retourner sous 50°C.',
      }}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Recycle className="h-4 w-4 text-emerald-600" />
              <span className="text-base font-bold">{tr('Feedstock Mix', 'خليط المواد الأولية', 'Mélange matières')}</span>
            </div>
            {/* Target C:N input */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">{tr('Target C:N', 'C:N المستهدف', 'C:N cible')}</span>
              <input type="number" min={15} max={40} value={targetCn} onChange={(e) => setTargetCn(parseInt(e.target.value) || 30)} className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm font-mono font-bold text-center" />
            </div>
          </div>

          {/* Feedstock list */}
          <div className="space-y-2">
            {feedstocks.map((f) => {
              const preset = COMMON_FEEDSTOCKS.find((c) => c.name === f.name);
              const labelAr = preset?.name_ar ?? f.name;
              const labelFr = preset?.name_fr ?? f.name;
              return (
                <div key={f.id} className="flex flex-col gap-2 rounded-xl border bg-background/70 p-3 shadow-sm sm:flex-row sm:items-center">
                  <select
                    value={f.name}
                    onChange={(e) => {
                      const p = COMMON_FEEDSTOCKS.find((c) => c.name === e.target.value);
                      if (p) update(f.id, { name: p.name, C: p.C, N: p.N, moisture: p.moisture });
                      else update(f.id, { name: e.target.value });
                    }}
                    className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {COMMON_FEEDSTOCKS.map((c) => (
                      <option key={c.name} value={c.name}>{isAr ? c.name_ar : isFr ? c.name_fr : c.name}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <input type="number" step="1" value={f.weight} onChange={(e) => update(f.id, { weight: parseFloat(e.target.value) || 0 })} className="h-9 w-20 rounded-md border border-input bg-background px-2 text-sm font-mono text-center" title={tr('Weight (kg)', 'الوزن (كغ)', 'Poids (kg)')} />
                    <span className="text-xs text-muted-foreground">{tr('kg', 'كغ', 'kg')}</span>
                  </div>
                  <Badge variant="outline" className="shrink-0 font-mono text-[10px]">{(f.C / f.N).toFixed(0)}:1</Badge>
                  <button type="button" onClick={() => remove(f.id)} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30" title={tr('Remove', 'إزالة', 'Supprimer')}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <button onClick={addFeedstock} className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 p-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300">
            <Plus className="h-4 w-4" />
            {tr('Add feedstock', 'إضافة مادة أولية', 'Ajouter matière')}
          </button>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
          <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-emerald-50 via-transparent to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
            <span className="text-base font-bold flex items-center gap-2">✨ {tr('Compost Quality', 'جودة الكمبوست', 'Qualité compost')}</span>
            <span className={`font-mono text-xs font-bold rounded-lg px-2 py-0.5 border ${result.targetMet ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'}`}>
              {result.cn.toFixed(1)}:1
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CalculatorShell.MetricTile label={tr('C:N Ratio', 'نسبة C:N', 'Ratio C:N')} value={`${result.cn.toFixed(1)}`} unit=":1" color={result.targetMet ? 'emerald' : 'amber'} />
            <CalculatorShell.MetricTile label={tr('Moisture', 'الرطوبة', 'Humidité')} value={`${result.avgMoisture.toFixed(0)}`} unit="%" color="sky" />
            <CalculatorShell.MetricTile label={tr('Total Mass', 'الكتلة الكلية', 'Masse totale')} value={result.totalWeight.toFixed(0)} unit="kg" color="teal" />
            <CalculatorShell.MetricTile label={tr('Dry Weight', 'الوزن الجاف', 'Poids sec')} value={(result.totalWeight * (1 - result.avgMoisture / 100)).toFixed(0)} unit="kg" color="amber" />
          </div>

          {/* C:N status */}
          {result.targetMet ? (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span><strong>{tr(`C:N ratio is good (${result.cn.toFixed(1)}:1).`, `نسبة C:N جيدة (${result.cn.toFixed(1)}:1).`)}</strong> {tr('Microbes will efficiently decompose. Pile should reach 55-65°C within 3 days.', 'ستحلل الكائنات الدقيقة الخليط بكفاءة. يُفترض أن تصل الكومة إلى 55–65°م خلال 3 أيام.')}</span>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span><strong>{tr('Adjust feedstock mix.', 'اضبط خليط المواد الأولية.', 'Ajustez le mélange.')}</strong> {result.cn > targetCn ? tr('C:N too high — add nitrogen-rich material (grass, manure, food waste).', 'نسبة C:N مرتفعة — أضف مادة غنية بالنيتروجين.', 'C:N trop élevé — ajoutez azote.') : tr('C:N too low — add carbon-rich material (leaves, straw, cardboard).', 'نسبة C:N منخفضة — أضف مادة غنية بالكربون.', 'C:N trop bas — ajoutez carbone.')}</span>
            </div>
          )}

          {/* Water adjustment */}
          {result.waterToAdd > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50/60 p-3 text-xs text-sky-700 dark:border-sky-900 dark:bg-sky-950/20 dark:text-sky-300">
              <Droplets className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span><strong>{tr(`Add ${result.waterToAdd.toFixed(0)} L water`, `أضف ${result.waterToAdd.toFixed(0)} لتر ماء`, `Ajouter ${result.waterToAdd.toFixed(0)} L eau`)}</strong> {tr('to reach 60% moisture. Sprinkle while turning pile for even distribution.', 'للوصول إلى رطوبة 60%. رش الماء أثناء تقليب الكومة لتوزيعه بالتساوي.', 'pour atteindre 60%. Arroser en retournant.')}</span>
            </div>
          )}
          {result.waterToRemove > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span><strong>{tr(`Too wet (${result.avgMoisture.toFixed(0)}%).`, `رطبة جداً (${result.avgMoisture.toFixed(0)}%).`, `Trop humide (${result.avgMoisture.toFixed(0)}%).`)}</strong> {tr(`Add ${result.waterToRemove.toFixed(0)} kg dry material (straw, cardboard) or turn pile to dry.`, `أضف ${result.waterToRemove.toFixed(0)} كغ من مادة جافة أو قلّب الكومة لتجفيفها.`, `Ajouter ${result.waterToRemove.toFixed(0)} kg de matière sèche.`)}</span>
            </div>
          )}

          {/* Formula */}
          <div className="p-3.5 rounded-xl bg-card border space-y-2 text-xs">
            <div className="font-bold flex items-center gap-1.5">
              <span>🧮</span>
              <span>{tr('Formula:', 'المعادلة:', 'Formule :')}</span>
            </div>
            <div className="font-mono text-[11px] p-2.5 rounded-lg bg-muted/50 border leading-relaxed">
              C:N = Σ(C × weight) ÷ Σ(N × weight) = {result.cn.toFixed(1)}:1
            </div>
          </div>
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
