'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FlaskRound, AlertTriangle, CheckCircle2, Clock, Wind } from 'lucide-react';

// Simplified herbicide database — AI%, rainfast, PHI by crop
const HERBICIDES: Record<string, { ai: string; aiPct: number; unit: 'g/L' | '%'; rainfast: number; phi: Record<string, number> }> = {
  glyphosate: { ai: 'Glyphosate', aiPct: 480, unit: 'g/L', rainfast: 4, phi: { maize: 7, wheat: 7, soybean: 14 } },
  '2,4-d': { ai: '2,4-D', aiPct: 470, unit: 'g/L', rainfast: 1, phi: { maize: 45, wheat: 7, pasture: 7 } },
  atrazine: { ai: 'Atrazine', aiPct: 50, unit: '%', rainfast: 2, phi: { maize: 60, sorghum: 60 } },
  paraquat: { ai: 'Paraquat', aiPct: 200, unit: 'g/L', rainfast: 0.5, phi: { maize: 0, soybean: 0, fallow: 0 } },
  glufosinate: { ai: 'Glufosinate', aiPct: 200, unit: 'g/L', rainfast: 4, phi: { maize: 60, soybean: 14 } },
};

export function PesticideDoseCalculator() {
  const [herbicide, setHerbicide] = useState('glyphosate');
  const [aiRate, setAiRate] = useState('1.0');
  const [area, setArea] = useState('10');
  const [crop, setCrop] = useState('maize');
  const [sprayVolume, setSprayVolume] = useState('100');

  const result = useMemo(() => {
    const h = HERBICIDES[herbicide];
    const ai = parseFloat(aiRate);
    const a = parseFloat(area);
    const sv = parseFloat(sprayVolume);
    if (!h || !Number.isFinite(ai) || !Number.isFinite(a)) return null;

    // Product rate: L/ha or kg/ha = AI_rate × 100 / AI%
    // AI% for g/L: 480 g/L = 48% w/v (assume density 1 kg/L)
    const aiPctNumeric = h.unit === 'g/L' ? h.aiPct / 10 : h.aiPct;  // g/L → % w/v
    const productRatePerHa = ai * 100 / aiPctNumeric;
    const productTotal = productRatePerHa * a;
    const phi = h.phi[crop] ?? 'Check label';
    const phiDate = new Date();
    phiDate.setDate(phiDate.getDate() + (typeof phi === 'number' ? phi : 0));

    // Tank mix: product per spray tank (assume 200 L tank)
    const productPerTank = (productRatePerHa / sv) * 200;

    return { productRatePerHa, productTotal, productPerTank, rainfast: h.rainfast, phi, phiDate };
  }, [herbicide, aiRate, area, crop, sprayVolume]);

  return (
    <Card className="overflow-hidden border-rose-200/60 shadow-sm dark:border-rose-900/60">
      <CardHeader className="border-b bg-gradient-to-r from-rose-50 via-background to-cyan-50/40 pb-4 dark:from-rose-950/30 dark:via-background dark:to-cyan-950/20">
          <CardTitle className="flex items-center gap-2 text-base">
          <FlaskRound className="h-4 w-4 text-rose-600" /> Pesticide Dose + PHI Calculator
        </CardTitle>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">AI rate → product rate · tank mix · rainfast · pre-harvest interval countdown</p>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Herbicide</Label>
            <select value={herbicide} onChange={e => setHerbicide(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              {Object.entries(HERBICIDES).map(([k, v]) => <option key={k} value={k}>{v.ai} ({v.aiPct}{v.unit})</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Crop</Label>
            <select value={crop} onChange={e => setCrop(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              {['maize', 'wheat', 'soybean', 'sorghum', 'pasture', 'fallow'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-3">
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">AI rate (kg/ha)</Label>
            <Input value={aiRate} onChange={e => setAiRate(e.target.value)} type="number" step="0.1" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Area (ha)</Label>
            <Input value={area} onChange={e => setArea(e.target.value)} type="number" step="0.5" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Spray vol (L/ha)</Label>
            <Input value={sprayVolume} onChange={e => setSprayVolume(e.target.value)} type="number" step="10" className="mt-1 h-10 text-sm" />
          </div>
        </div>

        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Metric label="Product rate" value={`${result.productRatePerHa.toFixed(2)}`} unit="L/ha" color="rose" />
              <Metric label="Total needed" value={result.productTotal.toFixed(1)} unit="L" color="amber" />
              <Metric label="Per 200L tank" value={result.productPerTank.toFixed(2)} unit="L" color="cyan" />
              <Metric label="Rainfast" value={`${result.rainfast}`} unit="hours" color="violet" />
            </div>

            {/* PHI countdown */}
            <div className="rounded-xl border p-4 shadow-sm" style={{ borderColor: typeof result.phi === 'number' && result.phi > 14 ? '#dc262660' : '#0891b260', backgroundColor: typeof result.phi === 'number' && result.phi > 14 ? '#dc262610' : '#0891b210' }}>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-semibold">Pre-Harvest Interval (PHI)</span>
              </div>
              <div className="text-sm">
                {typeof result.phi === 'number' ? (
                  <>
                    <strong className="text-lg">{result.phi} days</strong> until safe harvest.
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Earliest harvest: <strong className="font-mono">{result.phiDate.toLocaleDateString()}</strong>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-amber-700 dark:text-amber-400">Check product label for {crop} PHI.</span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm leading-relaxed text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
              <Wind className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span><strong>Rainfast: {result.rainfast} hr.</strong> Don't spray if rain expected within this window. Spray after dew dries (mid-morning).</span>
            </div>

            <div className="rounded-lg border border-dashed bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
              ⚠️ Always read product label. This calculator is a guide — local regulations + label rates override. Wear PPE. Avoid bee-toxic products during bloom.
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
    <div className={`rounded-xl border p-3 shadow-sm ${ACCENT_BG[color]}`}>
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold leading-tight">{value}</div>
      <div className="text-[9px] text-muted-foreground">{unit}</div>
    </div>
  );
}
