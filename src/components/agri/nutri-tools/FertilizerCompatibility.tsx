'use client';

import { useState, useMemo } from 'react';
import { FlaskConical, Calculator, Sparkles, Search, Copy, RotateCcw } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';
import {
  FERTILIZERS_COMPAT, COMPAT_LABELS, inferCompatLevel,
} from '@/lib/nutri-tools-data';
import { ToolExplainerDialog } from '../ToolExplainerDialog';

const TITLE: TrilingualString = {
  en: 'Fertilizer Compatibility Matrix',
  ar: 'مصفوفة توافق الأسمدة',
  fr: 'Matrice de Compatibilité des Engrais',
};

const DESC: TrilingualString = {
  en: 'Click a cell to see details. C = Compatible, R = Caution, I = Incompatible.',
  ar: 'انقر على خلية لعرض التفاصيل. C = متوافق، R = حذر، I = غير متوافق.',
  fr: 'Cliquez une cellule pour les détails. C = Compatible, R = Attention, I = Incompatible.',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Compatibility based on typical working-solution conditions (1–5% w/v, 20°C). Always validate with a jar test before large-scale mixing. Higher concentrations or unusual pH may shift R → I.',
  ar: 'التوافق يستند إلى ظروف المحلول العملية المعتادة (1–5% وزن/حجم، 20°م). تحقق دائماً باختبار الجرة قبل الخلط بكميات كبيرة. التركيز الأعلى أو درجة الحموضة غير المعتادة قد تحوّل R إلى I.',
  fr: 'Compatibilité basée sur les conditions usuelles (1–5% m/v, 20°C). Validez toujours par test bocal avant tout mélange à grande échelle. Concentrations élevées ou pH inhabituel peuvent faire passer R → I.',
};

/**
 * Tool 12 — Fertilizer Compatibility Matrix
 * Triangular matrix (lower) of C/R/I codes between 32 fertilizers + acids.
 */
export function FertilizerCompatibility() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<[number, number] | null>(null);

  const filtered = useMemo(
    () =>
      FERTILIZERS_COMPAT.map((f, i) => ({ ...f, idx: i }))
        .filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  // Build a mapping from original indices to filtered positions
  const filteredIndices = filtered.map(f => f.idx);
  const isShown = (i: number) => filteredIndices.includes(i);

  const detail = selected
    ? (() => {
        const [i, j] = selected;
        const a = FERTILIZERS_COMPAT[i];
        const b = FERTILIZERS_COMPAT[j];
        const level = inferCompatLevel(a.id, b.id);
        const lbl = COMPAT_LABELS[level];
        return { a, b, level, lbl };
      })()
    : null;

  const handleReset = () => {
    setSearch('');
    setSelected(null);
    toast({
      title: tr('Reset Filters', 'تمت إعادة التعيين', 'Réinitialisé'),
    });
  };

  const handleCopySummary = () => {
    const lines: string[] = [`=== FERTILIZER COMPATIBILITY ===`];
    if (detail) {
      lines.push(
        `Pair: ${detail.a.name} ↔ ${detail.b.name}`,
        `Level: ${detail.lbl.label} — ${detail.lbl.title}`,
      );
    } else {
      lines.push(`Filter: ${search || 'none'}`, `Visible: ${filtered.length} of ${FERTILIZERS_COMPAT.length} fertilizers`);
    }
    navigator.clipboard.writeText(lines.join('\n'));
    toast({
      title: tr('Summary Copied!', 'تم النسخ!', 'Copié !'),
      description: tr('Compatibility report copied to clipboard.', 'تم نسخ تقرير التوافق إلى الحافظة.', 'Rapport copié.'),
    });
  };

  return (
    <CalculatorShell
      icon={FlaskConical}
      title={TITLE}
      description={DESC}
      badge="Tank Mix"
      accent="violet"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' },
          onClick: handleCopySummary,
          variant: 'primary',
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      protocolNote={PROTOCOL_NOTE}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <Calculator className="h-4 w-4 text-violet-600" />
              {tr('Filter Fertilizers', 'تصفية الأسمدة', 'Filtrer les engrais')}
            </span>
            <span className="text-xs font-bold bg-violet-50 dark:bg-violet-950 text-violet-800 dark:text-violet-200 border border-violet-300 rounded-lg px-2 py-0.5">
              {filtered.length} {tr('of', 'من', 'sur')} {FERTILIZERS_COMPAT.length}
            </span>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-foreground">
              {tr('Search by name', 'ابحث بالاسم', 'Rechercher par nom')}
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={tr('Filter fertilizers…', 'تصفية الأسمدة…', 'Filtrer les engrais…')}
                className="h-10 pl-9 text-sm"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              {tr(
                'Type a fertilizer name to narrow the matrix. Empty input shows all.',
                'اكتب اسم سماد لتضييق المصفوفة. الحقل الفارغ يعرض الكل.',
                'Saisissez un nom d’engrais pour réduire la matrice. Vide = tout afficher.',
              )}
            </p>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-foreground">
              {tr('Legend', 'وسيلة الإيضاح', 'Légende')}
            </Label>
            <div className="flex flex-wrap gap-3 text-[11px]">
              {(['C', 'R', 'I'] as const).map(l => (
                <div key={l} className="flex items-center gap-1.5">
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center font-bold text-[10px]"
                    style={{ background: COMPAT_LABELS[l].bg, color: COMPAT_LABELS[l].color }}
                  >
                    {l}
                  </div>
                  <span>{COMPAT_LABELS[l].title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
          <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-violet-50 via-transparent to-purple-50/50 dark:from-violet-950/30 dark:to-purple-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
            <span className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-600" />
              {tr('Compatibility Matrix', 'مصفوفة التوافق', 'Matrice de compatibilité')}
            </span>
            <ToolExplainerDialog category="tank_mix_compatibility" triggerVariant="outline" />
          </div>

          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky top-0 left-0 z-20 bg-background border border-border p-2 min-w-[180px]"></th>
                  {FERTILIZERS_COMPAT.map((f, j) => isShown(j) && (
                    <th key={f.id} className="sticky top-0 z-10 bg-background border border-border p-1 min-w-[40px] max-w-[40px]">
                      <div className="text-[10px] leading-tight break-words text-center" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '110px' }}>{f.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FERTILIZERS_COMPAT.map((f, i) => isShown(i) && (
                  <tr key={f.id}>
                    <td className="sticky left-0 z-10 bg-background border border-border p-2 text-xs font-medium whitespace-nowrap min-w-[180px]">{f.name}</td>
                    {FERTILIZERS_COMPAT.map((g, j) => isShown(j) && (
                      <td key={g.id} className="border border-border p-0">
                        {j <= i ? (
                          <button
                            onClick={() => setSelected([i, j])}
                            className="w-full h-full min-w-[40px] min-h-[36px] flex items-center justify-center font-bold text-sm transition-all hover:scale-110"
                            style={{
                              background: COMPAT_LABELS[inferCompatLevel(f.id, g.id)].bg,
                              color: COMPAT_LABELS[inferCompatLevel(f.id, g.id)].color,
                              outline: selected && selected[0] === i && selected[1] === j ? '2px solid #000' : undefined,
                            }}
                            title={`${f.name} ↔ ${g.name}`}
                          >
                            {i === j ? '·' : COMPAT_LABELS[inferCompatLevel(f.id, g.id)].label}
                          </button>
                        ) : (
                          <div className="min-w-[40px] min-h-[36px]"></div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {detail && (
            <div className="rounded-lg p-4 border" style={{ background: detail.lbl.bg + '30', borderColor: detail.lbl.color }}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-sm">{detail.a.name} ↔ {detail.b.name}</div>
                <span className="font-bold px-2 py-0.5 rounded text-xs" style={{ background: detail.lbl.bg, color: detail.lbl.color }}>{detail.lbl.title}</span>
              </div>
              {detail.level === 'C' && (
                <p className="text-xs text-muted-foreground">
                  {tr(
                    'Under typical working-solution conditions no severe precipitate is expected. Always validate with a jar test.',
                    'في ظروف المحلول المعتادة لا يُتوقع تكون رواسب خطيرة. تحقق دائماً باختبار الجرة.',
                    'En conditions normales, pas de précipité notable. Valider par test bocal.',
                  )}
                </p>
              )}
              {detail.level === 'R' && (
                <div className="space-y-1.5 text-xs">
                  <p><strong>{tr('What happens:', 'ماذا يحدث:', 'Que se passe-t-il :')}</strong> {tr('Interaction or solubility limit per matrix and experience.', 'تفاعل أو حد ذوبانية وفق المصفوفة والخبرة.', 'Interaction ou limite de solubilité selon matrice.')}</p>
                  <p><strong>{tr('Impact:', 'الأثر:', 'Impact :')}</strong> {tr('Possible turbidity or reduced efficacy.', 'قد يحدث تعكر أو انخفاض في الفعالية.', 'Turbidité possible ou efficacité réduite.')}</p>
                  <p><strong>{tr('Critical factor:', 'العامل الحرج:', 'Facteur critique :')}</strong> {tr('Concentration, pH, temperature.', 'التركيز، درجة الحموضة، الحرارة.', 'Concentration, pH, température.')}</p>
                  <p><strong>{tr('Recommended action:', 'الإجراء الموصى به:', 'Action recommandée :')}</strong> {tr('Dilute more, separate tanks, consult technical expert.', 'خفّف أكثر، افصل الخزانات، استشر خبيراً.', 'Diluer, séparar les cuves, consulter un expert.')}</p>
                </div>
              )}
              {detail.level === 'I' && (
                <div className="space-y-1.5 text-xs">
                  <p><strong>{tr('What happens:', 'ماذا يحدث:', 'Que se passe-t-il :')}</strong> {tr('High risk of precipitate or obstruction under typical fertigation conditions.', 'خطر مرتفع لتكون الرواسب أو الانسداد في ظروف التسميد الاعتيادية.', 'Risque élevé de précipité ou d’obstruction.')}</p>
                  <p><strong>{tr('Impact:', 'الأثر:', 'Impact :')}</strong> {tr('Obstruction, nutrient loss.', 'انسداد، فقد المغذيات.', 'Obstruction, perte de nutriments.')}</p>
                  <p><strong>{tr('Critical factor:', 'العامل الحرج:', 'Facteur critique :')}</strong> {tr('Concentration.', 'التركيز.', 'Concentration.')}</p>
                  <p><strong>{tr('Recommended action:', 'الإجراء الموصى به:', 'Action recommandée :')}</strong> {tr('Separate into tank A / B; inject separately.', 'افصل إلى خزان A / B؛ حقن منفصل.', 'Séparer cuve A / B ; injection séparée.')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
