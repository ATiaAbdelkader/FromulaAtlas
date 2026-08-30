'use client';

import { useMemo, useState } from 'react';
import { FlaskConical, Copy, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';
import { SOLUBILITY_ROWS, solubilityClass } from '@/lib/nutri-tools-data';

const MAX_IS = 116.3;

type SortKey = 'name' | 'formula' | 'solMid' | 'is';
type SortDir = 'asc' | 'desc';

const TITLE: TrilingualString = {
  en: 'Solubility & Salt Index',
  ar: 'الذوبانية ومؤشر الملح',
  fr: 'Solubilité & Indice de Sel',
};

const DESC: TrilingualString = {
  en: 'Solubility (g/L at 20 °C) and salt index (NaNO₃ = 100 base). Click any header to sort.',
  ar: 'الذوبانية (غ/ل عند 20 °م) ومؤشر الملح (NaNO₃ = 100 كمرجع). انقر على أي رأس للترتيب.',
  fr: 'Solubilité (g/L à 20 °C) et indice de sel (NaNO₃ = 100 base). Cliquez sur un en-tête pour trier.',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Salt index bar scale: 0 to 116.3 (KCl = the highest reference). Use this table to compare fertilizer burn risk and solubility for tank mixing.',
  ar: 'مقياس شريط مؤشر الملح: من 0 إلى 116.3 (KCl هو أعلى مرجع). استخدم هذا الجدول لمقارنة خطر حرق المحصول والذوبانية لخلط الخزان.',
  fr: 'Échelle de l\'indice de sel : 0 à 116,3 (KCl = référence la plus élevée). Comparez le risque de brûlure et la solubilité pour la cuve.',
};

/**
 * Tool 17 — Solubility & Salt Index
 */
export function SolubilitySaltIndex() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('is');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [copied, setCopied] = useState(false);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      // numeric columns default desc, text columns default asc
      setSortDir(key === 'name' || key === 'formula' ? 'asc' : 'desc');
    }
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = SOLUBILITY_ROWS.filter(r => {
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.formula.toLowerCase().includes(q) ||
        (r.note || '').toLowerCase().includes(q)
      );
    });
    const sorted = [...filtered].sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      if (sortKey === 'solMid') {
        av = (a.solLo + a.solHi) / 2;
        bv = (b.solLo + b.solHi) / 2;
      } else if (sortKey === 'is') {
        av = a.is ?? -1;
        bv = b.is ?? -1;
      } else {
        av = a[sortKey];
        bv = b[sortKey];
      }
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc'
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number);
    });
    return sorted;
  }, [query, sortKey, sortDir]);

  const arrow = (key: SortKey) =>
    sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  const handleReset = () => {
    setQuery('');
    setSortKey('is');
    setSortDir('desc');
    toast({ title: tr('Reset', 'إعادة', 'Réinitialiser') });
  };

  const handleCopy = () => {
    const lines = ['Fertilizer\tFormula\tSol(g/L)\tClass\tIS'];
    rows.forEach(r => {
      const mid = (r.solLo + r.solHi) / 2;
      const cls = solubilityClass(mid);
      const isVal = r.noteIs ?? (r.is != null ? r.is.toFixed(1) : '—');
      const sol = r.solLo === r.solHi ? `${r.solLo}` : `${r.solLo}–${r.solHi}`;
      lines.push(`${r.name}\t${r.formula}\t${sol}\t${cls.label}\t${isVal}`);
    });
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
      protocolNote={PROTOCOL_NOTE}
    >
      <div className="lg:col-span-12 space-y-4">
        <div className="p-3 rounded-xl border bg-card">
          <Label className="text-xs font-bold" htmlFor="sol-search">
            {tr('Search by name, formula, or note', 'بحث بالاسم أو الصيغة أو الملاحظة', 'Rechercher par nom, formule ou note')}
          </Label>
          <Input
            id="sol-search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={tr('e.g. nitrate, KNO₃, amendment', 'مثال: نترات، KNO₃، تعديل', 'ex. nitrate, KNO₃, amendement')}
            className="h-9 mt-1"
          />
        </div>

        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="px-2 py-2 font-semibold cursor-pointer hover:bg-muted/70 select-none" onClick={() => toggleSort('name')}>
                  {tr('Fertilizer', 'السماد', 'Engrais')}{arrow('name')}
                </th>
                <th className="px-2 py-2 font-semibold cursor-pointer hover:bg-muted/70 select-none" onClick={() => toggleSort('formula')}>
                  {tr('Formula', 'الصيغة', 'Formule')}{arrow('formula')}
                </th>
                <th className="px-2 py-2 font-semibold text-right cursor-pointer hover:bg-muted/70 select-none" onClick={() => toggleSort('solMid')}>
                  {tr('Sol. (g/L)', 'الذوبانية (غ/ل)', 'Sol. (g/L)')}{arrow('solMid')}
                </th>
                <th className="px-2 py-2 font-semibold">
                  {tr('Class', 'الفئة', 'Classe')}
                </th>
                <th className="px-2 py-2 font-semibold text-right cursor-pointer hover:bg-muted/70 select-none" onClick={() => toggleSort('is')}>
                  {tr('IS', 'المؤشر', 'IS')}{arrow('is')}
                </th>
                <th className="px-2 py-2 font-semibold w-[40%]">
                  {tr('Salt index bar', 'شريط مؤشر الملح', 'Barre d\'indice de sel')}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const mid = (r.solLo + r.solHi) / 2;
                const cls = solubilityClass(mid);
                const isVal = r.is;
                const width = isVal != null ? Math.max(2, (isVal / MAX_IS) * 100) : 0;
                const isDisplay = r.noteIs ? r.noteIs : (isVal != null ? isVal.toFixed(1) : '—');
                return (
                  <tr key={r.name} className="border-t border-border/40">
                    <td className="px-2 py-2">
                      <div className="font-medium">{r.name}</div>
                      {r.note && <div className="text-[10px] text-muted-foreground italic">{r.note}</div>}
                    </td>
                    <td className="px-2 py-2 font-mono text-muted-foreground">{r.formula}</td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {r.solLo === r.solHi ? r.solLo : `${r.solLo}–${r.solHi}`}
                    </td>
                    <td className="px-2 py-2">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: cls.color }} />
                        <span className="text-[11px]" style={{ color: cls.color }}>{cls.label}</span>
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums font-medium">{isDisplay}</td>
                    <td className="px-2 py-2">
                      {isVal != null ? (
                        <div className="h-2.5 w-full rounded-full overflow-hidden bg-muted/50">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${width}%`,
                              background: 'linear-gradient(90deg, #38bdf8, #fbbf24 50%, #ea580c)',
                            }}
                          />
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">n/a</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-2 py-6 text-center text-muted-foreground">
                    {tr(`No fertilizers match “${query}”.`, `لا أسمدة تطابق "${query}".`, `Aucun engrais ne correspond à « ${query} ».`)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </CalculatorShell>
  );
}
