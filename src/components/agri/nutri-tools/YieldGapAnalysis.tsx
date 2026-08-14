'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, DollarSign, Lightbulb, Gauge } from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';

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

const CLIMATE_LABELS: Record<ClimateZone, string> = {
  tropical_lowland: 'Tropical lowland',
  tropical_highland: 'Tropical highland',
  subtropical: 'Subtropical',
  temperate: 'Temperate',
  arid: 'Arid',
  mediterranean: 'Mediterranean',
};
const CROP_LABELS_AR: Record<string, string> = {
  tomato: '🍅 طماطم', maize: '🌽 ذرة', wheat: '🌾 قمح', rice: '🍚 أرز',
  potato: '🥔 بطاطا', soybean: '🫘 فول الصويا', cassava: '🥖 كسافا', banana: '🍌 موز',
};
const CLIMATE_LABELS_AR: Record<ClimateZone, string> = {
  tropical_lowland: 'منخفض استوائي', tropical_highland: 'مرتفعات استوائية', subtropical: 'شبه استوائي',
  temperate: 'معتدل', arid: 'جاف', mediterranean: 'متوسطي',
};
const GAP_LABELS_AR = { Excellent: 'ممتاز', Good: 'جيد', Moderate: 'متوسط', 'Large gap': 'فجوة كبيرة' } as const;

function classifyGap(pct: number): { label: string; color: string; bg: string } {
  if (pct < 20) return { label: 'Excellent',  color: '#15803d', bg: '#dcfce7' };
  if (pct < 40) return { label: 'Good',       color: '#65a30d', bg: '#ecfccb' };
  if (pct < 60) return { label: 'Moderate',   color: '#d97706', bg: '#fef3c7' };
  return { label: 'Large gap', color: '#dc2626', bg: '#fee2e2' };
}

export function YieldGapAnalysis() {
  const { language } = useTranslation();
  const [crop, setCrop] = useState('maize');
  const [climate, setClimate] = useState<ClimateZone>('tropical_lowland');
  const [actualStr, setActualStr] = useState('7');
  const [areaStr, setAreaStr] = useState('10');
  const [priceStr, setPriceStr] = useState('');

  const actual = parseFloat(actualStr) || 0;
  const area = parseFloat(areaStr) || 0;
  const potential = POTENTIAL_YIELD[crop][climate];
  const price = priceStr ? (parseFloat(priceStr) || 0) : DEFAULT_PRICES[crop];

  const gap = Math.max(0, potential - actual);
  const gapPct = potential > 0 ? (gap / potential) * 100 : 0;
  const cls = classifyGap(gapPct);
  const economicLoss = gap * area * price; // t/ha × ha × USD/t

  const recommendation = useMemo(() => {
    if (gapPct < 20) return copyFor(language, `Excellent — you're within 20% of potential. Focus on consistency, quality, and risk management rather than closing the gap.`, 'ممتاز — أنت ضمن 20٪ من الإنتاجية المحتملة. ركّز على الاتساق والجودة وإدارة المخاطر بدلاً من التركيز على سد الفجوة.');
    const recover = (frac: number) => (gap * frac * area * price);
    if (gapPct < 40) return copyFor(language, `Good — close ~50% of the gap via tuned nutrient timing and variety choice → recover ~$${recover(0.5).toFixed(0)}/ha total across the field.`, `جيد — سد نحو 50٪ من الفجوة عبر ضبط توقيت العناصر الغذائية واختيار الصنف → استرداد نحو ${recover(0.5).toFixed(0)} دولار/هكتار على مستوى الحقل.`);
    if (gapPct < 60) return copyFor(language, `Moderate — prioritise integrated soil fertility, water management, and pest control. Closing 40% recovers ~$${recover(0.4).toFixed(0)}/ha total.`, `متوسط — أعطِ الأولوية لخصوبة التربة المتكاملة وإدارة المياه ومكافحة الآفات. سد 40٪ يسترد نحو ${recover(0.4).toFixed(0)} دولار/هكتار.`);
    return copyFor(language, `Large gap — address foundational constraints first (soil pH, drainage, varieties, basic agronomy). Closing 30% recovers ~$${recover(0.3).toFixed(0)}/ha total.`, `فجوة كبيرة — عالج القيود الأساسية أولاً (درجة حموضة التربة والصرف والأصناف والممارسات الزراعية الأساسية). سد 30٪ يسترد نحو ${recover(0.3).toFixed(0)} دولار/هكتار.`);
  }, [gapPct, gap, area, price, language]);

  return (
    <Card className="overflow-hidden border-emerald-200/60 shadow-sm dark:border-emerald-900/60">
      <CardHeader className="border-b bg-gradient-to-r from-emerald-50 via-background to-teal-50/50 pb-4 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/20">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
          {copyFor(language, 'Yield Gap Analysis', 'تحليل فجوة الإنتاجية')}
        </CardTitle>
        <CardDescription className="text-xs">
          {copyFor(language, 'Compare actual yield against FAO potential yield (GYGA) for your crop × climate zone.', 'قارن الإنتاجية الفعلية بالإنتاجية المحتملة وفق FAO (GYGA) لمحصولك ومنطقتك المناخية.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Crop', 'المحصول')}</Label>
            <Select value={crop} onValueChange={setCrop}>
              <SelectTrigger className="mt-1 h-10 w-full text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(POTENTIAL_YIELD).map(c => <SelectItem key={c} value={c} className="text-xs">{copyFor(language, CROP_LABELS[c], CROP_LABELS_AR[c])}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Climate zone', 'المنطقة المناخية')}</Label>
            <Select value={climate} onValueChange={(v) => setClimate(v as ClimateZone)}>
              <SelectTrigger className="mt-1 h-10 w-full text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(CLIMATE_LABELS) as ClimateZone[]).map(k => <SelectItem key={k} value={k} className="text-xs">{copyFor(language, CLIMATE_LABELS[k], CLIMATE_LABELS_AR[k])}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Actual yield (t/ha)', 'الإنتاجية الفعلية (طن/هكتار)')}</Label>
            <Input aria-label={copyFor(language, 'Actual yield in tonnes per hectare', 'الإنتاجية الفعلية بالطن لكل هكتار')} type="number" value={actualStr} onChange={e => setActualStr(e.target.value)} className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium">{copyFor(language, 'Area (ha)', 'المساحة (هكتار)')}</Label>
            <Input aria-label={copyFor(language, 'Field area in hectares', 'مساحة الحقل بالهكتار')} type="number" value={areaStr} onChange={e => setAreaStr(e.target.value)} className="mt-1 h-10 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-xl border p-4 shadow-sm" style={{ background: cls.bg, borderColor: cls.color + '40' }}>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Gauge className="h-3 w-3" /> {copyFor(language, 'Yield gap', 'فجوة الإنتاجية')}
            </div>
            <div className="mt-1 text-3xl font-bold tracking-tight" style={{ color: cls.color }}>{gap.toFixed(1)} t/ha</div>
            <div className="text-xs font-medium mt-1" style={{ color: cls.color }}>{gapPct.toFixed(0)}% · {copyFor(language, cls.label, GAP_LABELS_AR[cls.label as keyof typeof GAP_LABELS_AR])}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{copyFor(language, 'Potential', 'المحتملة')} {potential} · {copyFor(language, 'Actual', 'الفعلية')} {actual} t/ha</div>
          </div>

          <div className="rounded-xl border bg-background p-4 shadow-sm lg:col-span-2">
            <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>{copyFor(language, 'Actual vs potential', 'الفعلية مقابل المحتملة')}</span>
              <span className="font-mono normal-case tracking-normal">t/ha</span>
            </div>
            <BarPair actual={actual} potential={potential} />
            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-2.5 rounded-sm bg-emerald-500" />{copyFor(language, 'Actual', 'الفعلية')}</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-2.5 rounded-sm bg-slate-400" />{copyFor(language, 'Potential', 'المحتملة')}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/20">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> {copyFor(language, 'Economic loss (this season)', 'الخسارة الاقتصادية (هذا الموسم)')}
            </div>
            <div className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-300">
              ${economicLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {gap.toFixed(1)} t/ha × {area} ha × ${price}/t
            </div>
            <div className="mt-2">
              <Label className="text-[10px] text-muted-foreground">{copyFor(language, 'Price override (USD/t)', 'تعديل السعر (دولار/طن)')}</Label>
              <Input aria-label={copyFor(language, 'Price override in US dollars per tonne', 'تعديل السعر بالدولار الأمريكي للطن')} type="number" value={priceStr} onChange={e => setPriceStr(e.target.value)} placeholder={`${copyFor(language, 'Default', 'افتراضي')}: ${DEFAULT_PRICES[crop]}`} className="mt-1 h-10 text-sm" />
            </div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm dark:border-amber-900 dark:bg-amber-950/20">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Lightbulb className="h-3 w-3" /> {copyFor(language, 'Recommendation', 'التوصية')}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">{recommendation}</p>
            <Badge variant="outline" className="mt-2 text-[10px]" style={{ color: cls.color, borderColor: cls.color + '40' }}>{copyFor(language, cls.label, GAP_LABELS_AR[cls.label as keyof typeof GAP_LABELS_AR])}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
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
      <text x={65} y="98" textAnchor="middle" className="fill-muted-foreground" fontSize="9">Actual</text>
      <rect x="110" y={90 - bH} width={barW} height={bH} fill="#94a3b8" rx="3" />
      <text x={135} y={90 - bH - 4} textAnchor="middle" className="fill-slate-700 dark:fill-slate-300" fontSize="11" fontWeight="700">{potential.toFixed(1)}</text>
      <text x={135} y="98" textAnchor="middle" className="fill-muted-foreground" fontSize="9">Potential</text>
    </svg>
  );
}
