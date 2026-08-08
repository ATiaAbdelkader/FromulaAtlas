'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Flame, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';

const SUBSTRATES: Record<string, { name: string; emoji: string; vs: number; bmp: number; cn: number }> = {
  dairy_manure: { name: 'Dairy manure', emoji: '🐄', vs: 80, bmp: 250, cn: 18 },
  poultry_manure: { name: 'Poultry manure', emoji: '🐔', vs: 75, bmp: 350, cn: 10 },
  food_waste: { name: 'Food waste', emoji: '🍽️', vs: 90, bmp: 500, cn: 15 },
  crop_residue: { name: 'Crop residue (straw)', emoji: '🌾', vs: 85, bmp: 300, cn: 60 },
  grass: { name: 'Grass clippings', emoji: '🌿', vs: 85, bmp: 400, cn: 15 },
};

export function BiogasDigesterCalculator() {
  const [substrate, setSubstrate] = useState('dairy_manure');
  const [dailyFeed, setDailyFeed] = useState('50');
  const [hrt, setHrt] = useState('25');
  const [methanePct, setMethanePct] = useState('60');
  const [electricityPrice, setElectricityPrice] = useState('0.12');

  const result = useMemo(() => {
    const sub = SUBSTRATES[substrate];
    const feed = parseFloat(dailyFeed);
    const h = parseFloat(hrt);
    const ch4 = parseFloat(methanePct) / 100;
    const ep = parseFloat(electricityPrice);
    if (!Number.isFinite(feed) || !Number.isFinite(h)) return null;

    const vsPerDay = feed * sub.vs / 100; // kg VS/day
    const biogasPerDay = vsPerDay * sub.bmp * 0.7 / 1000; // m³/day (70% of BMP realistic)
    const ch4PerDay = biogasPerDay * ch4;
    const energyPerDay = ch4PerDay * 9.94; // kWh/day
    const electricityPerDay = energyPerDay * 0.35; // 35% generator efficiency
    const dailyRevenue = electricityPerDay * ep;
    const digesterVolume = (feed * 0.1) * h; // assume 10% solids → 10× dilution = volume m³
    const annualBiogas = biogasPerDay * 365;
    const annualRevenue = dailyRevenue * 365;
    const cn = sub.cn;

    return { sub, vsPerDay, biogasPerDay, ch4PerDay, energyPerDay, electricityPerDay, dailyRevenue, digesterVolume, annualBiogas, annualRevenue, cn };
  }, [substrate, dailyFeed, hrt, methanePct, electricityPrice]);

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Flame className="h-4 w-4 text-orange-600" /> Biogas Digester Calculator</CardTitle><p className="text-[10px] text-muted-foreground">Biogas yield · digester sizing · energy + revenue · 5 substrates</p></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-[10px]">Substrate</Label><select value={substrate} onChange={e => setSubstrate(e.target.value)} className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5">{Object.entries(SUBSTRATES).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.name}</option>)}</select></div>
          <div><Label className="text-[10px]">Daily feed (kg/day)</Label><Input value={dailyFeed} onChange={e => setDailyFeed(e.target.value)} type="number" step="5" className="h-8 text-xs mt-0.5" /></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><Label className="text-[10px]">HRT (days)</Label><Input value={hrt} onChange={e => setHrt(e.target.value)} type="number" step="5" className="h-8 text-xs mt-0.5" /></div>
          <div><Label className="text-[10px]">CH₄ content (%)</Label><Input value={methanePct} onChange={e => setMethanePct(e.target.value)} type="number" step="5" className="h-8 text-xs mt-0.5" /></div>
          <div><Label className="text-[10px]">Electricity ($/kWh)</Label><Input value={electricityPrice} onChange={e => setElectricityPrice(e.target.value)} type="number" step="0.01" className="h-8 text-xs mt-0.5" /></div>
        </div>
        {result && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Metric label="Daily biogas" value={`${result.biogasPerDay.toFixed(1)} m³`} color="orange" />
              <Metric label="CH₄ energy" value={`${result.energyPerDay.toFixed(1)} kWh`} color="amber" />
              <Metric label="Electricity" value={`${result.electricityPerDay.toFixed(1)} kWh`} color="cyan" />
              <Metric label="Daily revenue" value={`$${result.dailyRevenue.toFixed(2)}`} color="emerald" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded border p-2"><span className="text-muted-foreground">Digester volume:</span> <strong className="font-mono">{result.digesterVolume.toFixed(1)} m³</strong></div>
              <div className="rounded border p-2"><span className="text-muted-foreground">Annual revenue:</span> <strong className="font-mono text-emerald-600">${result.annualRevenue.toFixed(0)}</strong></div>
            </div>
            {result.cn < 15 ? (
              <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 p-2 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5"><AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>C:N = {result.cn}:1 — too low.</strong> Add carbon-rich co-substrate (straw, crop residue) to reach 20-30:1 for optimal digestion.</span></div>
            ) : result.cn > 35 ? (
              <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 p-2 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5"><AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>C:N = {result.cn}:1 — too high.</strong> Add nitrogen-rich co-substrate (manure, food waste) to reach 20-30:1.</span></div>
            ) : (
              <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 p-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><strong>C:N = {result.cn}:1 — optimal.</strong> Mesophilic digester (35°C) with {result.digesterVolume.toFixed(0)} m³ working volume.</span></div>
            )}
            <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">💡 Use CHP (combined heat + power) for 85% efficiency: 35% electricity + 50% heat. Digestate is excellent organic fertilizer — NPK retains 80-90% of feed value.</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const ACCENT: Record<string, string> = {
  cyan: 'border-cyan-200 dark:border-cyan-900 bg-cyan-50/40 dark:bg-cyan-950/20',
  emerald: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20',
  amber: 'border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20',
  orange: 'border-orange-200 dark:border-orange-900 bg-orange-50/40 dark:bg-orange-950/20',
};
function Metric({ label, value, color }: { label: string; value: string; color: keyof typeof ACCENT }) {
  return <div className={`rounded-md border px-2 py-1.5 ${ACCENT[color]}`}><div className="text-[9px] text-muted-foreground uppercase">{label}</div><div className="font-mono text-sm font-semibold">{value}</div></div>;
}
