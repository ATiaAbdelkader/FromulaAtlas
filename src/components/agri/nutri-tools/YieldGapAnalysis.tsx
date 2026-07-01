'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, DollarSign, Lightbulb, Gauge } from 'lucide-react';

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

function classifyGap(pct: number): { label: string; color: string; bg: string } {
  if (pct < 20) return { label: 'Excellent',  color: '#15803d', bg: '#dcfce7' };
  if (pct < 40) return { label: 'Good',       color: '#65a30d', bg: '#ecfccb' };
  if (pct < 60) return { label: 'Moderate',   color: '#d97706', bg: '#fef3c7' };
  return { label: 'Large gap', color: '#dc2626', bg: '#fee2e2' };
}

export function YieldGapAnalysis() {
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
    if (gapPct < 20) return `Excellent — you're within 20% of potential. Focus on consistency, quality, and risk management rather than closing the gap.`;
    const recover = (frac: number) => (gap * frac * area * price);
    if (gapPct < 40) return `Good — close ~50% of the gap via tuned nutrient timing and variety choice → recover ~$${recover(0.5).toFixed(0)}/ha total across the field.`;
    if (gapPct < 60) return `Moderate — prioritise integrated soil fertility, water management, and pest control. Closing 40% recovers ~$${recover(0.4).toFixed(0)}/ha total.`;
    return `Large gap — address foundational constraints first (soil pH, drainage, varieties, basic agronomy). Closing 30% recovers ~$${recover(0.3).toFixed(0)}/ha total.`;
  }, [gapPct, gap, area, price]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
          Yield Gap Analysis
        </CardTitle>
        <CardDescription className="text-xs">
          Compare actual yield against FAO potential yield (GYGA) for your crop × climate zone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Crop</Label>
            <Select value={crop} onValueChange={setCrop}>
              <SelectTrigger className="h-9 mt-1 w-full text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(POTENTIAL_YIELD).map(c => <SelectItem key={c} value={c} className="text-xs">{CROP_LABELS[c]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Climate zone</Label>
            <Select value={climate} onValueChange={(v) => setClimate(v as ClimateZone)}>
              <SelectTrigger className="h-9 mt-1 w-full text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(CLIMATE_LABELS) as ClimateZone[]).map(k => <SelectItem key={k} value={k} className="text-xs">{CLIMATE_LABELS[k]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Actual yield (t/ha)</Label>
            <Input type="number" value={actualStr} onChange={e => setActualStr(e.target.value)} className="h-9 mt-1" />
          </div>
          <div>
            <Label className="text-xs">Area (ha)</Label>
            <Input type="number" value={areaStr} onChange={e => setAreaStr(e.target.value)} className="h-9 mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="rounded-lg p-4 border" style={{ background: cls.bg, borderColor: cls.color + '40' }}>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Gauge className="h-3 w-3" /> Yield gap
            </div>
            <div className="text-3xl font-bold mt-1" style={{ color: cls.color }}>{gap.toFixed(1)} t/ha</div>
            <div className="text-xs font-medium mt-1" style={{ color: cls.color }}>{gapPct.toFixed(0)}% · {cls.label}</div>
            <div className="text-[11px] text-muted-foreground mt-1">Potential {potential} · Actual {actual} t/ha</div>
          </div>

          <div className="rounded-lg border p-3 lg:col-span-2">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Actual vs potential (t/ha)</div>
            <BarPair actual={actual} potential={potential} />
            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-2.5 rounded-sm bg-emerald-500" />Actual</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-2.5 rounded-sm bg-slate-400" />Potential</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg p-4 border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Economic loss (this season)
            </div>
            <div className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-300">
              ${economicLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {gap.toFixed(1)} t/ha × {area} ha × ${price}/t
            </div>
            <div className="mt-2">
              <Label className="text-[10px] text-muted-foreground">Price override (USD/t)</Label>
              <Input type="number" value={priceStr} onChange={e => setPriceStr(e.target.value)} placeholder={`Default: ${DEFAULT_PRICES[crop]}`} className="h-8 mt-1 text-xs" />
            </div>
          </div>
          <div className="rounded-lg p-4 border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Lightbulb className="h-3 w-3" /> Recommendation
            </div>
            <p className="text-xs mt-1 leading-relaxed">{recommendation}</p>
            <Badge variant="outline" className="mt-2 text-[10px]" style={{ color: cls.color, borderColor: cls.color + '40' }}>{cls.label}</Badge>
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
