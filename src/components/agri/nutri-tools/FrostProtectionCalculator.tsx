'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Snowflake, Wind, Droplets, CheckCircle2, AlertTriangle } from 'lucide-react';

export function FrostProtectionCalculator() {
  const [temp, setTemp] = useState('0');
  const [dewPoint, setDewPoint] = useState('-3');
  const [windSpeed, setWindSpeed] = useState('3');
  const [area, setArea] = useState('5');
  const [method, setMethod] = useState('sprinkler');

  const result = useMemo(() => {
    const T = parseFloat(temp), DP = parseFloat(dewPoint), WS = parseFloat(windSpeed), A = parseFloat(area);
    if (!Number.isFinite(T)) return null;

    // Frost risk: temp below 2°C + low dew point + calm wind = radiative frost
    const isFrost = T <= 2;
    const isAdvective = WS > 5; // advective frost = windy, harder to protect
    const inversionStrength = T - DP; // larger = drier = colder burn potential

    let sprinklerRate = 0, sprinklerFlow = 0;
    if (method === 'sprinkler') {
      // Application rate depends on temp + wind (USDA NRCS method)
      sprinklerRate = Math.max(2.5, (2 - T) * 1.5 + (WS > 2 ? 2 : 0)); // mm/hr
      sprinklerFlow = sprinklerRate * A * 10; // m³/hr (mm/hr × ha × 10)
    }

    let windMachineCoverage = 0;
    if (method === 'windmachine') {
      windMachineCoverage = WS < 3 ? 2.5 : 1.5; // ha per machine (less effective in wind)
    }

    let smudgePotCount = 0;
    if (method === 'smudge') {
      smudgePotCount = Math.ceil(A * (isAdvective ? 60 : 40)); // pots/ha
    }

    const canProtect = !isAdvective || method === 'sprinkler';
    const effectiveness = isAdvective ? 30 : 70; // %

    return { isFrost, isAdvective, inversionStrength, sprinklerRate, sprinklerFlow, windMachineCoverage, smudgePotCount, canProtect, effectiveness };
  }, [temp, dewPoint, windSpeed, area, method]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Snowflake className="h-4 w-4 text-blue-600" /> Frost Protection Calculator
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">Radiative vs advective frost · sprinkler / wind machine / smudge pot sizing</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-4 gap-2">
          <div>
            <Label className="text-[10px]">Temp (°C)</Label>
            <Input value={temp} onChange={e => setTemp(e.target.value)} type="number" step="0.5" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Dew point (°C)</Label>
            <Input value={dewPoint} onChange={e => setDewPoint(e.target.value)} type="number" step="0.5" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Wind (km/h)</Label>
            <Input value={windSpeed} onChange={e => setWindSpeed(e.target.value)} type="number" step="0.5" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Area (ha)</Label>
            <Input value={area} onChange={e => setArea(e.target.value)} type="number" step="0.5" className="h-8 text-xs mt-0.5" />
          </div>
        </div>
        <div>
          <Label className="text-[10px]">Protection method</Label>
          <select value={method} onChange={e => setMethod(e.target.value)} className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5">
            <option value="sprinkler">💧 Overhead sprinkler</option>
            <option value="windmachine">🌀 Wind machine</option>
            <option value="smudge">🔥 Smudge pots</option>
          </select>
        </div>
        {result && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className={`rounded-md border p-2 ${result.isFrost ? 'border-blue-300 bg-blue-50/40' : 'border-emerald-300 bg-emerald-50/40'}`}>
                <div className="text-[9px] text-muted-foreground uppercase">Frost type</div>
                <div className="text-sm font-bold">{result.isFrost ? (result.isAdvective ? 'Advective (wind)' : 'Radiative (calm)') : 'No frost'}</div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-[9px] text-muted-foreground uppercase">Effectiveness</div>
                <div className={`text-sm font-bold ${result.effectiveness > 50 ? 'text-emerald-600' : 'text-rose-600'}`}>{result.effectiveness}%</div>
              </div>
            </div>

            {method === 'sprinkler' && result.isFrost && (
              <div className="rounded-md border border-cyan-200 dark:border-cyan-900 bg-cyan-50/60 p-2 text-xs space-y-1">
                <div className="flex items-center gap-1.5"><Droplets className="h-3.5 w-3.5 text-cyan-600" /><strong>Sprinkler requirements:</strong></div>
                <div>Application rate: <strong className="font-mono">{result.sprinklerRate.toFixed(1)} mm/hr</strong></div>
                <div>Total flow: <strong className="font-mono">{result.sprinklerFlow.toFixed(0)} m³/hr</strong> for {area} ha</div>
                <div className="text-[10px] text-muted-foreground">Start sprinklers when wet-bulb temp reaches 0°C. Run continuously until ice melts next morning.</div>
              </div>
            )}
            {method === 'windmachine' && result.isFrost && (
              <div className="rounded-md border border-violet-200 dark:border-violet-900 bg-violet-50/60 p-2 text-xs space-y-1">
                <div className="flex items-center gap-1.5"><Wind className="h-3.5 w-3.5 text-violet-600" /><strong>Wind machine:</strong></div>
                <div>Coverage: <strong className="font-mono">{result.windMachineCoverage.toFixed(1)} ha</strong> per machine</div>
                <div>Need: <strong className="font-mono">{Math.ceil(parseFloat(area) / result.windMachineCoverage)} machines</strong> for {area} ha</div>
                <div className="text-[10px] text-muted-foreground">Only works for radiative frost (inversion). Ineffective in advective frost.</div>
              </div>
            )}
            {method === 'smudge' && result.isFrost && (
              <div className="rounded-md border border-orange-200 dark:border-orange-900 bg-orange-50/60 p-2 text-xs space-y-1">
                <div className="flex items-center gap-1.5"><Snowflake className="h-3.5 w-3.5 text-orange-600" /><strong>Smudge pots:</strong></div>
                <div>Need: <strong className="font-mono">{result.smudgePotCount} pots</strong> ({result.smudgePotCount / parseFloat(area)} /ha)</div>
                <div className="text-[10px] text-muted-foreground">Light 1 hr before critical temp. Smoke creates heat inversion. Check local air quality regs.</div>
              </div>
            )}

            {!result.canProtect && (
              <div className="rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50/60 p-2 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>Advective frost — limited protection.</strong> Wind &gt;5 km/h breaks inversion. Only sprinklers effective. Wind machines won't work.</span>
              </div>
            )}
            {result.canProtect && result.isFrost && (
              <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 p-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>Protection feasible.</strong> Radiative frost — inversion layer present. {method === 'sprinkler' ? 'Sprinklers most effective.' : method === 'windmachine' ? 'Wind machines will mix warm air down.' : 'Smudge pots will create heat inversion.'}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
