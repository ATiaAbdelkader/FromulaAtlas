'use client';

import { useState, useMemo } from 'react';
import { TrendingUp, Copy, Check, RotateCcw, DollarSign, Lightbulb, Gauge } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

type ClimateZone = 'tropical_lowland' | 'tropical_highland' | 'subtropical' | 'temperate' | 'arid' | 'mediterranean';

// FAO GYGA approximate potential yield (t/ha) per crop × climate zone.
const POTENTIAL_YIELD: Record<string, Record<ClimateZone, number>> = {
  tomato:  { tropical_lowland: 80, tropical_highland: 100, subtropical: 90, temperate: 70, arid: 60, mediterranean: 95 },
  maize:   { tropical_lowland: 10, tropical_highland: 14,  subtropical: 13, temperate: 15, arid: 8,  mediterranean: 14 },
  wheat:   { tropical_lowland: 4,  tropical_highland: 8,   subtropical: 7,  temperate: 10, arid: 5,  mediterranean: 8  },
  rice:    { tropical_lowland: 9,  tropical_highland: 10,  subtropical: 9,  temperate: 10, arid: 7,  mediterranean: 9  },
  potato:  { tropical_lowland: 40, tropical_highland: 60,  subtropical: 50, temperate: 70, arid: 35, mediterranean: 55 },
  soybean: { tropical_lowland: 3,  tropical_highland: 4,   subtropical: 4,  temperate: 5,  arid: 2,  mediterranean: 4  },
  cassava: { tropical_lowland: 35, tropical_highland: 40,  subtropical: 30, temperate: 25, arid: 20, mediterranean: 28 },
  banana:  { tropical_lowland: 70, tropical_highland: 60,  subtropical: 65, temperate: 40, arid: 45, mediterranean: 55 },
};

const DEFAULT_PRICES: Record<string, number> = {
  tomato: 250, maize: 200, wheat: 280, rice: 450, potato: 300, soybean: 550, cassava: 180, banana: 400,
};

const CROP_LABELS: Record<string, string> = {
  tomato: '🍅 Tomato', maize: '🌽 Maize', wheat: '🌾 Wheat', rice: '🍚 Rice',
  potato: '🥔 Potato', soybean: '🫘 Soybean', cassava: '🥖 Cassava', banana: '🍌 Banana',
};
const CROP_LABELS_AR: Record<string, string> = {
  tomato: '🍅 طماطم', maize: '🌽 ذرة', wheat: '🌾 قمح', rice: '🍚 أرز',
  potato: '🥔 بطاطا', soybean: '🫘 فول الصويا', cassava: '🥖 كسافا', banana: '🍌 موز',
};
const CROP_LABELS_FR: Record<string, string> = {
  tomato: '🍅 Tomate', maize: '🌽 Maïs', wheat: '🌾 Blé', rice: '🍚 Riz',
  potato: '🥔 Pomme de terre', soybean: '🫘 Soja', cassava: '🥖 Manioc', banana: '🍌 Banane',
};

const CLIMATE_LABELS: Record<ClimateZone, string> = {
  tropical_lowland: 'Tropical lowland',
  tropical_highland: 'Tropical highland',
  subtropical: 'Subtropical',
  temperate: 'Temperate',
  arid: 'Arid',
  mediterranean: 'Mediterranean',
};
const CLIMATE_LABELS_AR: Record<ClimateZone, string> = {
  tropical_lowland: 'منخفض استوائي', tropical_highland: 'مرتفعات استوائية', subtropical: 'شبه استوائي',
  temperate: 'معتدل', arid: 'جاف', mediterranean: 'متوسطي',
};
const CLIMATE_LABELS_FR: Record<ClimateZone, string> = {
  tropical_lowland: 'Basses terres tropicales', tropical_highland: 'Hautes terres tropicales', subtropical: 'Subtropical',
  temperate: 'Tempéré', arid: 'Aride', mediterranean: 'Méditerranéen',
};
const GAP_LABELS_AR = { Excellent: 'ممتاز', Good: 'جيد', Moderate: 'متوسط', 'Large gap': 'فجوة كبيرة' } as const;
const GAP_LABELS_FR = { Excellent: 'Excellent', Good: 'Bon', Moderate: 'Modéré', 'Large gap': 'Grand écart' } as const;

const TITLE: TrilingualString = {
  en: 'Yield Gap Analysis',
  ar: 'تحليل فجوة الإنتاجية',
  fr: 'Analyse de l\'Écart de Rendement',
};

const DESC: TrilingualString = {
  en: 'Compare actual yield against FAO potential yield (GYGA) for your crop × climate zone — with economic loss.',
  ar: 'قارن الإنتاجية الفعلية بالإنتاجية المحتملة وفق FAO (GYGA) لمحصولك ومنطقتك المناخية — مع الخسارة الاقتصادية.',
  fr: 'Comparez le rendement réel au rendement potentiel FAO (GYGA) pour votre culture × zone climatique — avec perte économique.',
};

function classifyGap(pct: number): { label: string; color: string; bg: string } {
  if (pct < 20) return { label: 'Excellent',  color: '#15803d', bg: '#dcfce7' };
  if (pct < 40) return { label: 'Good',       color: '#65a30d', bg: '#ecfccb' };
  if (pct < 60) return { label: 'Moderate',   color: '#d97706', bg: '#fef3c7' };
  return { label: 'Large gap', color: '#dc2626', bg: '#fee2e2' };
}

function gapLabelTr(tr: (en: string, ar: string, fr?: string) => string, label: string): string {
  return tr(label, GAP_LABELS_AR[label as keyof typeof GAP_LABELS_AR], GAP_LABELS_FR[label as keyof typeof GAP_LABELS_FR]);
}

export function YieldGapAnalysis() {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const isFr = language === 'fr';
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [crop, setCrop] = useState('maize');
  const [climate, setClimate] = useState<ClimateZone>('tropical_lowland');
  const [actualStr, setActualStr] = useState('7');
  const [areaStr, setAreaStr] = useState('10');
  const [priceStr, setPriceStr] = useState('');
  const [copied, setCopied] = useState(false);

  const actual = parseFloat(actualStr) || 0;
  const area = parseFloat(areaStr) || 0;
  const potential = POTENTIAL_YIELD[crop][climate];
  const price = priceStr ? (parseFloat(priceStr) || 0) : DEFAULT_PRICES[crop];

  const gap = Math.max(0, potential - actual);
  const gapPct = potential > 0 ? (gap / potential) * 100 : 0;
  const cls = classifyGap(gapPct);
  const economicLoss = gap * area * price; // t/ha × ha × USD/t

  const recommendation = useMemo(() => {
    if (gapPct < 20) return copyFor(language, `Excellent — you're within 20% of potential. Focus on consistency, quality, and risk management rather than closing the gap.`, 'ممتاز — أنت ضمن 20٪ من الإنتاجية المحتملة. ركّز على الاتساق والجودة وإدارة المخاطر بدلاً من التركيز على سد الفجوة.', `Excellent — vous êtes à moins de 20% du potentiel. Concentrez-vous sur la cohérence, la qualité et la gestion des risques plutôt que sur la fermeture de l'écart.`);
    const recover = (frac: number) => (gap * frac * area * price);
    if (gapPct < 40) return copyFor(language, `Good — close ~50% of the gap via tuned nutrient timing and variety choice → recover ~$${recover(0.5).toFixed(0)}/ha total across the field.`, `جيد — سد نحو 50٪ من الفجوة عبر ضبط توقيت العناصر الغذائية واختيار الصنف → استرداد نحو ${recover(0.5).toFixed(0)} دولار/هكتار على مستوى الحقل.`, `Bon — comblez ~50% de l'écart via timing nutriment et choix variétal → récupérez ~${recover(0.5).toFixed(0)} $/ha sur le champ.`);
    if (gapPct < 60) return copyFor(language, `Moderate — prioritise integrated soil fertility, water management, and pest control. Closing 40% recovers ~$${recover(0.4).toFixed(0)}/ha total.`, `متوسط — أعطِ الأولوية لخصوبة التربة المتكاملة وإدارة المياه ومكافحة الآفات. سد 40٪ يسترد نحو ${recover(0.4).toFixed(0)} دولار/هكتار.`, `Modéré — prioriser fertilité intégrée, gestion eau, lutte antiparasitaire. Combler 40% récupère ~${recover(0.4).toFixed(0)} $/ha.`);
    return copyFor(language, `Large gap — address foundational constraints first (soil pH, drainage, varieties, basic agronomy). Closing 30% recovers ~$${recover(0.3).toFixed(0)}/ha total.`, `فجوة كبيرة — عالج القيود الأساسية أولاً (درجة حموضة التربة والصرف والأصناف والممارسات الزراعية الأساسية). سد 30٪ يسترد نحو ${recover(0.3).toFixed(0)} دولار/هكتار.`, `Grand écart — traitez d'abord les contraintes de base (pH sol, drainage, variétés, agronomie de base). Combler 30% récupère ~${recover(0.3).toFixed(0)} $/ha.`);
  }, [gapPct, gap, area, price, language]);

  const handleReset = () => {
    setCrop('maize'); setClimate('tropical_lowland'); setActualStr('7'); setAreaStr('10'); setPriceStr('');
    toast({ title: tr('Reset', 'إعادة', 'Réinitialiser') });
  };

  const handleCopy = () => {
    const text = `=== YIELD GAP ANALYSIS ===\nCrop: ${isAr ? CROP_LABELS_AR[crop] : isFr ? CROP_LABELS_FR[crop] : CROP_LABELS[crop]}\nClimate: ${isAr ? CLIMATE_LABELS_AR[climate] : isFr ? CLIMATE_LABELS_FR[climate] : CLIMATE_LABELS[climate]}\nActual yield: ${actual} t/ha\nPotential yield: ${potential} t/ha\nArea: ${area} ha\nPrice: $${price}/t\n\nYield gap: ${gap.toFixed(1)} t/ha (${gapPct.toFixed(0)}%)\nClassification: ${cls.label}\nEconomic loss: $${economicLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}\n\nRecommendation: ${recommendation}`.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: tr('Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <CalculatorShell
      icon={TrendingUp}
      title={TITLE}
      description={DESC}
      badge="FAO GYGA"
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
          label: { en: 'Reset', ar: 'إعادة', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              {tr('Yield Inputs', 'مدخلات الإنتاجية', 'Entrées de rendement')}
            </span>
            <span className="font-mono text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 rounded-lg px-2 py-0.5" style={{ color: cls.color }}>
              {gapPct.toFixed(0)}%
            </span>
          </div>

          {/* Crop select */}
          <div className="p-3 rounded-xl border bg-card space-y-1">
            <span className="text-xs font-bold text-foreground">{tr('Crop', 'المحصول', 'Culture')}</span>
            <Select value={crop} onValueChange={setCrop}>
              <SelectTrigger className="mt-1 h-9 w-full text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(POTENTIAL_YIELD).map(c => <SelectItem key={c} value={c} className="text-xs">{isAr ? CROP_LABELS_AR[c] : isFr ? CROP_LABELS_FR[c] : CROP_LABELS[c]}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="text-[10px] text-muted-foreground">{tr('Potential yield:', 'الإنتاجية المحتملة:', 'Rendement potentiel:')} {potential} t/ha</div>
          </div>

          {/* Climate select */}
          <div className="p-3 rounded-xl border bg-card space-y-1">
            <span className="text-xs font-bold text-foreground">{tr('Climate zone', 'المنطقة المناخية', 'Zone climatique')}</span>
            <Select value={climate} onValueChange={(v) => setClimate(v as ClimateZone)}>
              <SelectTrigger className="mt-1 h-9 w-full text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(CLIMATE_LABELS) as ClimateZone[]).map(k => <SelectItem key={k} value={k} className="text-xs">{isAr ? CLIMATE_LABELS_AR[k] : isFr ? CLIMATE_LABELS_FR[k] : CLIMATE_LABELS[k]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CalculatorShell.InputField
              label={tr('Actual yield (t/ha)', 'الإنتاجية الفعلية (طن/هكتار)', 'Rendement réel (t/ha)')}
              value={actualStr}
              onChange={setActualStr}
              step="0.1"
              helper={tr('Observed field yield', 'الإنتاجية المرصودة', 'Rendement observé')}
            />
            <CalculatorShell.InputField
              label={tr('Area (ha)', 'المساحة (هكتار)', 'Surface (ha)')}
              value={areaStr}
              onChange={setAreaStr}
              step="0.5"
              helper={tr('Field area', 'مساحة الحقل', 'Surface du champ')}
            />
          </div>

          <CalculatorShell.InputField
            label={tr('Price override (USD/t)', 'تعديل السعر (دولار/طن)', 'Prix personnalisé (USD/t)')}
            value={priceStr}
            onChange={setPriceStr}
            placeholder={`${tr('Default', 'افتراضي', 'Défaut')}: ${DEFAULT_PRICES[crop]}`}
            helper={tr(`Default: $${DEFAULT_PRICES[crop]}/t`, `الافتراضي: ${DEFAULT_PRICES[crop]} دولار/طن`, `Défaut: ${DEFAULT_PRICES[crop]} $/t`)}
          />
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4">
          <div className="flex items-center justify-between border-b pb-3 bg-gradient-to-r from-emerald-50 via-transparent to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl">
            <span className="text-base font-bold flex items-center gap-2">
              ✨ {tr('Yield Gap & Loss', 'الفجوة والخسارة', 'Écart et perte')}
            </span>
            <span className="font-mono text-xs font-bold border rounded-lg px-2 py-0.5" style={{ color: cls.color, borderColor: cls.color + '40' }}>
              {gapLabelTr(tr, cls.label)}
            </span>
          </div>

          {/* Yield gap tile */}
          <div className="rounded-xl border p-4 space-y-1" style={{ background: cls.bg, borderColor: cls.color + '40' }}>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Gauge className="h-3 w-3" /> {tr('Yield gap', 'فجوة الإنتاجية', 'Écart de rendement')}
            </div>
            <div className="text-2xl font-black font-mono" style={{ color: cls.color }}>
              {gap.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">t/ha</span>
            </div>
            <div className="text-xs font-medium" style={{ color: cls.color }}>{gapPct.toFixed(0)}% · {gapLabelTr(tr, cls.label)}</div>
            <div className="text-[10px] text-muted-foreground">{tr('Potential', 'المحتملة', 'Potentiel')} {potential} · {tr('Actual', 'الفعلية', 'Réel')} {actual} t/ha</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CalculatorShell.MetricTile
              label={tr('Economic Loss', 'الخسارة الاقتصادية', 'Perte économique')}
              value={`$${economicLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              color="emerald"
              helper={`${gap.toFixed(1)} t/ha × ${area} ha × $${price}/t`}
            />
            <div className="rounded-xl border bg-card p-4 space-y-1">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Lightbulb className="h-3 w-3" /> {tr('Recommendation', 'التوصية', 'Recommandation')}
              </div>
              <p className="text-xs leading-relaxed text-foreground/90">{recommendation}</p>
            </div>
          </div>

          {/* Bar chart */}
          <div className="rounded-xl border bg-background p-4 space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {tr('Actual vs potential', 'الفعلية مقابل المحتملة', 'Réel vs potentiel')}</span>
              <span className="font-mono normal-case tracking-normal">t/ha</span>
            </div>
            <BarPair actual={actual} potential={potential} />
            <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-2.5 rounded-sm bg-emerald-500" />{tr('Actual', 'الفعلية', 'Réel')}</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-2.5 rounded-sm bg-slate-400" />{tr('Potential', 'المحتملة', 'Potentiel')}</span>
            </div>
          </div>
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}

function BarPair({ actual, potential }: { actual: number; potential: number }) {
  const max = Math.max(actual, potential, 1);
  const plotH = 70;
  const aH = (actual / max) * plotH;
  const bH = (potential / max) * plotH;
  const barW = 50;
  return (
    <svg viewBox="0 0 200 100" className="w-full h-[100px]" preserveAspectRatio="xMidYMid meet">
      <line x1="10" y1="10" x2="10" y2="90" stroke="currentColor" className="text-border" />
      <line x1="10" y1="90" x2="190" y2="90" stroke="currentColor" className="text-border" />
      <rect x="40" y={90 - aH} width={barW} height={aH} fill="#10b981" rx="3" />
      <text x={65} y={90 - aH - 4} textAnchor="middle" className="fill-emerald-700 dark:fill-emerald-300" fontSize="11" fontWeight="700">{actual.toFixed(1)}</text>
      <rect x="110" y={90 - bH} width={barW} height={bH} fill="#94a3b8" rx="3" />
      <text x={135} y={90 - bH - 4} textAnchor="middle" className="fill-slate-700 dark:fill-slate-300" fontSize="11" fontWeight="700">{potential.toFixed(1)}</text>
    </svg>
  );
}
