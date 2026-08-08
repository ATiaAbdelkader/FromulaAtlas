'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Leaf, DollarSign, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';

const PRACTICES = [
  { id: 'no-till', name: 'No-till adoption', rate: 0.5, co2e: 1.0, cost: 0 },
  { id: 'cover-crop', name: 'Cover crops', rate: 1.5, co2e: 1.5, cost: 40 },
  { id: 'manure', name: 'Manure compost application', rate: 0.8, co2e: 0.8, cost: 60 },
  { id: 'reduced-n', name: 'Reduced N rate (−20%)', rate: -0.3, co2e: 0.3, cost: -20 },
  { id: 'n-inhibitor', name: 'Nitrification inhibitor', rate: -0.2, co2e: 0.2, cost: 15 },
  { id: 'agroforestry', name: 'Agroforestry (alley crop)', rate: 2.0, co2e: 2.0, cost: 100 },
];

export function CarbonCreditCalculator() {
  const [area, setArea] = useState('100');
  const [carbonPrice, setCarbonPrice] = useState('15');
  const [selectedPractices, setSelectedPractices] = useState<string[]>(['no-till', 'cover-crop']);
  const [years, setYears] = useState('10');

  const result = useMemo(() => {
    const a = parseFloat(area);
    const cp = parseFloat(carbonPrice);
    const y = parseInt(years);
    if (!Number.isFinite(a) || !Number.isFinite(cp)) return null;

    const chosen = PRACTICES.filter(p => selectedPractices.includes(p.id));
    const totalCo2ePerHa = chosen.reduce((s, p) => s + p.co2e, 0);
    const totalCo2e = totalCo2ePerHa * a * y;  // tonnes CO₂e over commitment
    const grossRevenue = totalCo2e * cp;

    // 20% buffer for permanence risk
    const netCredits = totalCo2e * 0.8;
    const netRevenue = netCredits * cp;

    const annualCo2e = totalCo2ePerHa * a;
    const annualRevenue = annualCo2e * cp * 0.8;

    const totalCost = chosen.reduce((s, p) => s + p.cost * a, 0);  // annual cost
    const netProfit = annualRevenue - totalCost;

    const eligible = chosen.length > 0 && a >= 50;  // simplified eligibility

    return { totalCo2ePerHa, totalCo2e, grossRevenue, netCredits, netRevenue, annualCo2e, annualRevenue, totalCost, netProfit, eligible };
  }, [area, carbonPrice, selectedPractices, years]);

  const togglePractice = (id: string) => {
    setSelectedPractices(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Leaf className="h-4 w-4 text-emerald-600" /> Carbon Credit Estimator
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">IPCC Tier 2 · 6 practices · $/ha revenue · 20% permanence buffer · 10-year commitment</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-[10px]">Area (ha)</Label>
            <Input value={area} onChange={e => setArea(e.target.value)} type="number" step="10" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Carbon price ($/t CO₂e)</Label>
            <Input value={carbonPrice} onChange={e => setCarbonPrice(e.target.value)} type="number" step="1" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Commitment (years)</Label>
            <Input value={years} onChange={e => setYears(e.target.value)} type="number" step="1" min="5" className="h-8 text-xs mt-0.5" />
          </div>
        </div>

        {/* Practice selection */}
        <div>
          <Label className="text-[10px]">Practices adopted (select all that apply)</Label>
          <div className="grid grid-cols-2 gap-1.5 mt-1">
            {PRACTICES.map(p => {
              const active = selectedPractices.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => togglePractice(p.id)}
                  className={`text-left rounded-md border p-2 transition-colors ${active ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-border hover:bg-muted/50'}`}
                >
                  <div className="text-[10px] font-semibold">{p.name}</div>
                  <div className="text-[9px] text-muted-foreground">
                    {p.co2e > 0 ? `+${p.co2e.toFixed(1)}` : p.co2e.toFixed(1)} t CO₂e/ha/yr · ${p.cost}/ha
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {result && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Metric label="Annual C stored" value={`${result.annualCo2e.toFixed(0)}`} unit="t CO₂e/yr" color="emerald" />
              <Metric label="Gross revenue" value={`$${result.annualRevenue.toFixed(0)}`} unit="/yr" color="amber" />
              <Metric label="Practice cost" value={`$${result.totalCost.toFixed(0)}`} unit="/yr" color="rose" />
              <Metric label="Net profit" value={`$${result.netProfit.toFixed(0)}`} unit="/yr" color={result.netProfit > 0 ? 'emerald' : 'rose'} />
            </div>

            {/* 10-year totals */}
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 p-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{years}-Year Commitment Totals</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300">{result.netCredits.toFixed(0)}</div>
                  <div className="text-[9px] text-muted-foreground">t CO₂e (after 20% buffer)</div>
                </div>
                <div>
                  <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300">${result.netRevenue.toFixed(0)}</div>
                  <div className="text-[9px] text-muted-foreground">net revenue</div>
                </div>
                <div>
                  <div className="text-lg font-bold font-mono">{(result.netProfit * parseInt(years)).toFixed(0)}</div>
                  <div className="text-[9px] text-muted-foreground">$ net profit</div>
                </div>
              </div>
            </div>

            {/* Eligibility */}
            {result.eligible ? (
              <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>Eligible for carbon credits.</strong> Next steps: contact aggregator (Indigo, Nori, Truterra) for protocol enrollment. Get baseline soil test now. Annual verification cost ~$5-10/ha.</span>
              </div>
            ) : (
              <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-2 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>Below minimum scale.</strong> Most protocols require ≥50 ha. Consider aggregating with neighbors or using practice-based programs (EQIP, CSP) instead.</span>
              </div>
            )}

            <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">
              💡 Voluntary market prices $5-30/t CO₂e. Compliance markets (CA, EU) $15-50. Additionality + 25-yr permanence required. Verification every 5 yr.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const ACCENT_BG: Record<string, string> = {
  cyan: 'border-cyan-200 dark:border-cyan-900 bg-cyan-50/40 dark:bg-cyan-950/20',
  emerald: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20',
  amber: 'border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20',
  violet: 'border-violet-200 dark:border-violet-900 bg-violet-50/40 dark:bg-violet-950/20',
  rose: 'border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20',
};

function Metric({ label, value, unit, color }: { label: string; value: string; unit: string; color: keyof typeof ACCENT_BG }) {
  return (
    <div className={`rounded-md border px-2 py-1.5 ${ACCENT_BG[color]}`}>
      <div className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="font-mono text-sm font-semibold leading-tight">{value}</div>
      <div className="text-[9px] text-muted-foreground">{unit}</div>
    </div>
  );
}
