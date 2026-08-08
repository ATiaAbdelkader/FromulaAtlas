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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bug className="h-4 w-4 text-rose-600" /> Disease Forecast Dashboard
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">5 disease models · Weather-based infection risk · Spray timing</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-[10px]">Disease model</Label>
          <select value={model} onChange={e => setModel(e.target.value)} className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5">
            {MODELS.map(m => <option key={m.id} value={m.id}>{m.name} — {m.crop}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div>
            <Label className="text-[10px]">Temp (°C)</Label>
            <Input value={weather.temp} onChange={e => setWeather({ ...weather, temp: e.target.value })} type="number" step="0.5" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">RH (%)</Label>
            <Input value={weather.rh} onChange={e => setWeather({ ...weather, rh: e.target.value })} type="number" step="1" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Leaf wet (hr)</Label>
            <Input value={weather.leafWetness} onChange={e => setWeather({ ...weather, leafWetness: e.target.value })} type="number" step="0.5" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Rain (mm)</Label>
            <Input value={weather.rain} onChange={e => setWeather({ ...weather, rain: e.target.value })} type="number" step="1" className="h-8 text-xs mt-0.5" />
          </div>
        </div>

        {result && (
          <div className="space-y-2">
            <div className="rounded-lg border p-4 text-center" style={{ borderColor: result.color + '60', backgroundColor: result.color + '15' }}>
              <div className="text-[10px] text-muted-foreground uppercase">{selectedModel.name}</div>
              <div className="text-2xl font-bold" style={{ color: result.color }}>{result.riskLabel}</div>
              <div className="text-[10px] text-muted-foreground mt-1">
                Risk score: {result.risk.toFixed(1)} · Pathogen: {selectedModel.pathogen}
              </div>
            </div>

            {result.spray ? (
              <div className="rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/20 p-2 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>SPRAY NOW.</strong> Apply protectant fungicide within 24 hr. {selectedModel.crop} at risk.</span>
              </div>
            ) : (
              <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><strong>No spray needed.</strong> Conditions don't favor infection. Monitor weather forecast.</span>
              </div>
            )}

            <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">
              💡 {selectedModel.name}: threshold {selectedModel.threshold} {selectedModel.unit}. Install leaf wetness sensor at canopy height for accurate data. Use 7-day weather forecast for proactive planning.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
