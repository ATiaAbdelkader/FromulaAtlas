'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bug, AlertTriangle, CheckCircle2, CloudRain } from 'lucide-react';

interface WeatherInput { temp: string; rh: string; leafWetness: string; rain: string; }

const MODELS = [
  { id: 'blitecast', name: 'Late Blight (Blitecast)', crop: 'Potato / Tomato', pathogen: 'P. infestans', threshold: 18, unit: 'severity values' },
  { id: 'tomcast', name: 'Early Blight (TOMCAST)', crop: 'Tomato / Potato', pathogen: 'A. solani', threshold: 20, unit: 'DSV' },
  { id: 'mills', name: 'Apple Scab (Mills)', crop: 'Apple', pathogen: 'V. inaequalis', threshold: 1, unit: 'infection event' },
  { id: 'fhb', name: 'Fusarium Head Blight', crop: 'Wheat / Barley', pathogen: 'F. graminearum', threshold: 0.5, unit: 'risk score' },
  { id: 'downy', name: 'Downy Mildew (ONSET)', crop: 'Grape / Lettuce', pathogen: 'Plasmopara / Bremia', threshold: 1, unit: 'infection event' },
];

export function DiseaseForecastDashboard() {
  const [model, setModel] = useState('blitecast');
  const [weather, setWeather] = useState<WeatherInput>({ temp: '18', rh: '92', leafWetness: '14', rain: '5' });

  const result = useMemo(() => {
    const T = parseFloat(weather.temp);
    const RH = parseFloat(weather.rh);
    const LW = parseFloat(weather.leafWetness);
    const rain = parseFloat(weather.rain);
    if (!Number.isFinite(T)) return null;

    let risk = 0, riskLabel = 'Low', color = '#10b981', spray = false;

    if (model === 'blitecast') {
      if (RH >= 90 && LW >= 10) {
        risk = Math.min(4, Math.max(0, (T - 7) * 0.3));
      }
      spray = risk >= 3;
      riskLabel = risk >= 3 ? 'High — Spray!' : risk >= 1.5 ? 'Moderate' : 'Low';
      color = risk >= 3 ? '#dc2626' : risk >= 1.5 ? '#f59e0b' : '#10b981';
    } else if (model === 'tomcast') {
      if (LW >= 4) {
        risk = Math.min(4, T > 13 && T < 28 ? LW * 0.3 : 0);
      }
      spray = risk >= 3;
      riskLabel = risk >= 3 ? 'High — Spray!' : risk >= 1.5 ? 'Moderate' : 'Low';
      color = risk >= 3 ? '#dc2626' : risk >= 1.5 ? '#f59e0b' : '#10b981';
    } else if (model === 'mills') {
      const wetnessNeeded = T < 7 ? 18 : T < 10 ? 14 : T < 16 ? 11 : T < 20 ? 9 : 13;
      risk = LW >= wetnessNeeded ? 1 : 0;
      spray = risk === 1;
      riskLabel = risk === 1 ? 'Infection period!' : 'No infection';
      color = risk === 1 ? '#dc2626' : '#10b981';
    } else if (model === 'fhb') {
      risk = (T >= 15 && T <= 30 && RH > 80 && rain > 5) ? 1 : 0;
      spray = risk === 1;
      riskLabel = risk === 1 ? 'High risk — Spray at anthesis!' : 'Low risk';
      color = risk === 1 ? '#dc2626' : '#10b981';
    } else if (model === 'downy') {
      risk = (T >= 4 && T <= 25 && RH >= 90 && LW >= 4) ? 1 : 0;
      spray = risk === 1;
      riskLabel = risk === 1 ? 'Infection likely!' : 'No infection';
      color = risk === 1 ? '#dc2626' : '#10b981';
    }

    return { risk, riskLabel, color, spray };
  }, [model, weather]);

  const selectedModel = MODELS.find(m => m.id === model)!;

  return (
    <Card className="overflow-hidden border-rose-200/60 shadow-sm dark:border-rose-900/60">
      <CardHeader className="border-b bg-gradient-to-r from-rose-50 via-background to-sky-50/40 pb-4 dark:from-rose-950/30 dark:via-background dark:to-sky-950/20">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bug className="h-4 w-4 text-rose-600" /> Disease Forecast Dashboard
        </CardTitle>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">5 disease models · Weather-based infection risk · Spray timing</p>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="rounded-xl border bg-muted/20 p-3">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Disease model</Label>
          <select value={model} onChange={e => setModel(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {MODELS.map(m => <option key={m.id} value={m.id}>{m.name} — {m.crop}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-4">
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Temp (°C)</Label>
            <Input value={weather.temp} onChange={e => setWeather({ ...weather, temp: e.target.value })} type="number" step="0.5" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">RH (%)</Label>
            <Input value={weather.rh} onChange={e => setWeather({ ...weather, rh: e.target.value })} type="number" step="1" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Leaf wet (hr)</Label>
            <Input value={weather.leafWetness} onChange={e => setWeather({ ...weather, leafWetness: e.target.value })} type="number" step="0.5" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rain (mm)</Label>
            <Input value={weather.rain} onChange={e => setWeather({ ...weather, rain: e.target.value })} type="number" step="1" className="mt-1 h-10 text-sm" />
          </div>
        </div>

        {result && (
          <div className="space-y-4">
            <div className="rounded-xl border p-5 text-center shadow-sm" style={{ borderColor: result.color + '60', backgroundColor: result.color + '15' }}>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{selectedModel.name}</div>
              <div className="mt-1 text-3xl font-bold leading-tight" style={{ color: result.color }}>{result.riskLabel}</div>
              <div className="mt-2 text-xs text-muted-foreground">
                Risk score: {result.risk.toFixed(1)} · Pathogen: {selectedModel.pathogen}
              </div>
            </div>

            {result.spray ? (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-sm leading-relaxed text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>SPRAY NOW.</strong> Apply protectant fungicide within 24 hr. {selectedModel.crop} at risk.</span>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-sm leading-relaxed text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>No spray needed.</strong> Conditions don't favor infection. Monitor weather forecast.</span>
              </div>
            )}

            <div className="rounded-lg border border-dashed bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
              💡 {selectedModel.name}: threshold {selectedModel.threshold} {selectedModel.unit}. Install leaf wetness sensor at canopy height for accurate data. Use 7-day weather forecast for proactive planning.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
