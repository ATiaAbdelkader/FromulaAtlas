'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Wind, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function SprayDriftAssessor() {
  const [windSpeed, setWindSpeed] = useState('12');
  const [temp, setTemp] = useState('25');
  const [rh, setRh] = useState('50');
  const [nozzle, setNozzle] = useState('medium');
  const [boomHeight, setBoomHeight] = useState('50');
  const [dropletSize, setDropletSize] = useState('medium');

  const result = useMemo(() => {
    const ws = parseFloat(windSpeed), T = parseFloat(temp), RH = parseFloat(rh);
    const bh = parseFloat(boomHeight);
    if (!Number.isFinite(ws)) return null;

    // Risk scoring (0-100)
    let score = 0;
    // Wind: 0-3 km/h = 0, 4-8 = 15, 9-15 = 30, 16-20 = 50, >20 = 80
    score += ws <= 3 ? 0 : ws <= 8 ? 15 : ws <= 15 ? 30 : ws <= 20 ? 50 : 80;
    // Temp + RH (delta T): high temp + low RH = high evaporation = drift
    const deltaT = T - (100 - RH) * 0.2; // simplified
    score += deltaT > 10 ? 15 : deltaT > 6 ? 8 : 0;
    // Nozzle/droplet: fine = 25, medium = 10, coarse = 5, very coarse = 0
    const dropletRisk: Record<string, number> = { fine: 25, medium: 12, coarse: 5, very_coarse: 0 };
    score += dropletRisk[dropletSize] ?? 12;
    // Boom height: 30 cm = 0, 50 = 5, 70 = 15, 100 = 25
    score += bh <= 30 ? 0 : bh <= 50 ? 5 : bh <= 70 ? 15 : 25;

    score = Math.min(100, score);

    let risk: 'low' | 'moderate' | 'high' | 'extreme';
    let color: string;
    let can: string;
    if (score < 20) { risk = 'low'; color = '#10b981'; can = 'Safe to spray'; }
    else if (score < 40) { risk = 'moderate'; color = '#f59e0b'; can = 'Spray with caution'; }
    else if (score < 65) { risk = 'high'; color = '#f97316'; can = 'Avoid spraying'; }
    else { risk = 'extreme'; color = '#dc2626'; can = 'DO NOT SPRAY'; }

    // Buffer recommendation
    const buffer = risk === 'low' ? 5 : risk === 'moderate' ? 15 : risk === 'high' ? 50 : 100;

    return { score, risk, color, can, buffer, deltaT };
  }, [windSpeed, temp, rh, dropletSize, boomHeight]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Wind className="h-4 w-4 text-cyan-600" /> Spray Drift Risk Assessor
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">Wind · Delta-T · Droplet size · Boom height → drift score + buffer distance</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-4 gap-2">
          <div>
            <Label className="text-[10px]">Wind (km/h)</Label>
            <Input value={windSpeed} onChange={e => setWindSpeed(e.target.value)} type="number" step="0.5" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Temp (°C)</Label>
            <Input value={temp} onChange={e => setTemp(e.target.value)} type="number" step="1" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">RH (%)</Label>
            <Input value={rh} onChange={e => setRh(e.target.value)} type="number" step="5" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Boom (cm)</Label>
            <Input value={boomHeight} onChange={e => setBoomHeight(e.target.value)} type="number" step="10" className="h-8 text-xs mt-0.5" />
          </div>
        </div>
        <div>
          <Label className="text-[10px]">Droplet size</Label>
          <select value={dropletSize} onChange={e => setDropletSize(e.target.value)} className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5">
            <option value="fine">Fine (VF–F) — highest drift, best coverage</option>
            <option value="medium">Medium (M) — balanced</option>
            <option value="coarse">Coarse (C) — low drift, systemic herbicides</option>
            <option value="very_coarse">Very Coarse (VC) — lowest drift, glyphosate</option>
          </select>
        </div>

        {result && (
          <div className="space-y-2">
            <div className="rounded-lg border p-4 text-center" style={{ borderColor: result.color + '60', backgroundColor: result.color + '15' }}>
              <div className="text-2xl font-bold" style={{ color: result.color }}>{result.can}</div>
              <div className="text-[10px] text-muted-foreground mt-1">
                Drift score: {result.score.toFixed(0)}/100 · {result.risk.toUpperCase()} · ΔT = {result.deltaT.toFixed(1)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border p-2 text-center">
                <div className="text-[9px] text-muted-foreground uppercase">Buffer zone</div>
                <div className="text-lg font-bold font-mono">{result.buffer} m</div>
              </div>
              <div className="rounded-md border p-2 text-center">
                <div className="text-[9px] text-muted-foreground uppercase">Best spray window</div>
                <div className="text-xs font-semibold">
                  {result.deltaT < 2 ? 'Too humid' : result.deltaT > 10 ? 'Too dry' : 'Good (ΔT 2–8)'}
                </div>
              </div>
            </div>

            {result.risk === 'low' ? (
              <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>Good conditions.</strong> Wind {windSpeed} km/h, ΔT {result.deltaT.toFixed(1)}. Spray now — minimal drift risk.</span>
              </div>
            ) : (
              <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-2 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>{result.can}.</strong> {result.risk === 'extreme' ? 'Wait for better conditions. ' : ''}Use coarser droplets, lower boom, or wait for wind &lt; 10 km/h.</span>
              </div>
            )}

            <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">
              💡 Optimal spraying: wind 3–10 km/h, ΔT 2–8, temp &lt; 28°C. Avoid inversions (calm dawn/dusk) — drift stays at ground level.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
