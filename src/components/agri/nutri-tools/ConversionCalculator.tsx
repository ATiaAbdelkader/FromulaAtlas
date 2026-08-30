'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  Copy,
  RotateCcw,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  CalculatorShell,
} from '@/components/agri/nutri-tools/CalculatorShell';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import { OXIDE_CONVERSIONS } from '@/lib/nutri-tools-data';

/**
 * Tool 1 — Oxide ↔ Elemental Converter
 * Bidirectional: type in either side, the other side updates.
 * Layout: 2-column grid of conversion pairs so all 15 fit comfortably
 * in the landscape dialog without scrolling.
 */
export function ConversionCalculator() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [oxideValues, setOxideValues] = useState<Record<string, string>>({});
  const [elementValues, setElementValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const setOxide = (key: string, v: string) => {
    setOxideValues(prev => ({ ...prev, [key]: v }));
    const n = parseFloat(v.replace(',', '.'));
    if (v && Number.isFinite(n)) {
      const pair = OXIDE_CONVERSIONS.find(p => p.key === key)!;
      setElementValues(prev => ({
        ...prev,
        [key]: (n * pair.oxideToElement).toFixed(3),
      }));
    } else {
      setElementValues(prev => ({ ...prev, [key]: '' }));
    }
  };

  const setElement = (key: string, v: string) => {
    setElementValues(prev => ({ ...prev, [key]: v }));
    const n = parseFloat(v.replace(',', '.'));
    if (v && Number.isFinite(n)) {
      const pair = OXIDE_CONVERSIONS.find(p => p.key === key)!;
      setOxideValues(prev => ({
        ...prev,
        [key]: (n * pair.elementToOxide).toFixed(3),
      }));
    } else {
      setOxideValues(prev => ({ ...prev, [key]: '' }));
    }
  };

  const clear = () => {
    setOxideValues({});
    setElementValues({});
    toast({
      title: tr('Cleared', 'تم المسح', 'Effacé'),
    });
  };

  const hasAnyValue =
    Object.values(oxideValues).some(v => v) ||
    Object.values(elementValues).some(v => v);

  const summary = useMemo(() => {
    const entries = OXIDE_CONVERSIONS.map(pair => {
      const oxide = oxideValues[pair.key];
      const elem = elementValues[pair.key];
      const oxideNum = parseFloat(oxide || '');
      const elemNum = parseFloat(elem || '');
      return {
        pair,
        oxide: oxide || '',
        elem: elem || '',
        oxideNum: Number.isFinite(oxideNum) ? oxideNum : 0,
        elemNum: Number.isFinite(elemNum) ? elemNum : 0,
        hasValue: Boolean(oxide || elem),
      };
    }).filter(e => e.hasValue);
    return entries;
  }, [oxideValues, elementValues]);

  const handleCopy = () => {
    if (!hasAnyValue) return;
    const lines = summary.map(
      e =>
        `  • ${e.pair.oxide} ↔ ${e.pair.elemental}: ${e.oxide} ↔ ${e.elem}`,
    );
    const text = `
=== OXIDE ↔ ELEMENTAL CONVERSION ===
${lines.join('\n')}
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: tr('Summary Copied!', 'تم نسخ التقرير!', 'Résumé copié !'),
    });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <CalculatorShell
      icon={ArrowRightLeft}
      accent="sky"
      title={{
        en: 'Oxide ↔ Elemental Converter',
        ar: 'محول الأكاسيد إلى العناصر',
        fr: 'Convertisseur Oxyde ↔ Élément',
      }}
      description={{
        en: 'Type in either column — the other side updates automatically. Covers Ca, K, P, Mg, N, S, Na and more (15 pairs).',
        ar: 'اكتب في أي عمود — يتم تحديث الجهة الأخرى تلقائياً. يشمل Ca وK وP وMg وN وS وNa والمزيد (15 زوجاً).',
        fr: 'Saisissez dans l’une ou l’autre colonne — l’autre se met à jour. Couvre Ca, K, P, Mg, N, S, Na et plus (15 paires).',
      }}
      badge="Chemistry"
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
          label: { en: 'Clear All', ar: 'مسح الكل', fr: 'Tout effacer' },
          onClick: clear,
        },
      ]}
      protocolNote={{
        en: 'The factor shown in the top-right of each card (×0.715, ×1.399, etc.) is the multiplier used to go from oxide → elemental. The reverse direction uses its reciprocal. Values round to 3 decimals.',
        ar: 'المعامل الظاهر في أعلى يمين كل بطاقة (×0.715، ×1.399، إلخ) هو المعامل المستخدم للتحويل من الأكسيد إلى العنصر. الاتجاه العكسي يستخدم مقلوبه. تقرب القيم إلى 3 منازل عشرية.',
        fr: 'Le facteur affiché en haut à droite de chaque carte (×0,715 ; ×1,399 ; etc.) est le multiplicateur utilisé pour passer de l’oxyde à l’élément. La direction inverse utilise son inverse. Les valeurs sont arrondies à 3 décimales.',
      }}
    >
      <CalculatorShell.Inputs>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
          {OXIDE_CONVERSIONS.map(pair => (
            <div
              key={pair.key}
              className="rounded-lg border border-border bg-card/50 p-2.5 hover:border-sky-300 transition-colors"
            >
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  {pair.oxide} <span className="mx-1 text-sky-600">↔</span>{' '}
                  {pair.elemental}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  ×{pair.oxideToElement}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_20px_1fr] items-center gap-1.5">
                <div className="relative">
                  <Input
                    type="number"
                    value={oxideValues[pair.key] ?? ''}
                    onChange={e => setOxide(pair.key, e.target.value)}
                    placeholder="0"
                    className="h-9 pr-10 text-xs font-mono font-bold"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                    {pair.oxide}
                  </span>
                </div>
                <div className="text-center text-xs text-muted-foreground">→</div>
                <div className="relative">
                  <Input
                    type="number"
                    value={elementValues[pair.key] ?? ''}
                    onChange={e => setElement(pair.key, e.target.value)}
                    placeholder="0"
                    className="h-9 pr-10 text-xs font-mono font-bold"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                    {pair.elemental}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CalculatorShell.Inputs>
      <CalculatorShell.Results>
        {summary.length > 0 ? (
          <>
            <CalculatorShell.MetricTile
              label={tr(
                'Conversions entered',
                'التحويلات المُدخلة',
                'Conversions saisies',
              )}
              value={summary.length}
              unit={tr('pairs', 'أزواج', 'paires')}
              color="sky"
              helper={tr(
                'Active conversions in this session',
                'التحويلات النشطة في هذه الجلسة',
                'Conversions actives dans cette session',
              )}
            />
            <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
              {summary.map(e => (
                <CalculatorShell.MetricTile
                  key={e.pair.key}
                  label={`${e.pair.oxide} ↔ ${e.pair.elemental}`}
                  value={`${e.oxide} → ${e.elem}`}
                  color="default"
                  helper={`×${e.pair.oxideToElement}`}
                />
              ))}
            </div>
          </>
        ) : (
          <CalculatorShell.MetricTile
            label={tr(
              'No conversions yet',
              'لا توجد تحويلات بعد',
              'Aucune conversion',
            )}
            value="—"
            color="default"
            helper={tr(
              'Type a value in any oxide or elemental field to begin',
              'اكتب قيمة في أي حقل أكسيد أو عنصر للبدء',
              'Saisissez une valeur dans un champ oxyde ou élément pour commencer',
            )}
          />
        )}
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
