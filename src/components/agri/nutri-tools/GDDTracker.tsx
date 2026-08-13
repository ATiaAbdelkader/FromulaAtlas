'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sun, Calendar, TrendingUp, RefreshCw } from 'lucide-react';

const CROP_BASE_TEMPS: Record<string, { name: string; emoji: string; tbase: number; targetGDD: number; stages: { gdd: number; name: string; emoji: string }[] }> = {
  corn: { name: 'Corn (maize)', emoji: '🌽', tbase: 10, targetGDD: 1500, stages: [
    { gdd: 150, name: 'Emergence', emoji: '🌱' }, { gdd: 350, name: 'V6', emoji: '🌿' },
    { gdd: 700, name: 'V12', emoji: '🌿' }, { gdd: 1000, name: 'VT (tasseling)', emoji: '🌾' },
    { gdd: 1300, name: 'Silking', emoji: '🌼' }, { gdd: 1500, name: 'Black layer', emoji: '🌽' },
  ]},
  wheat: { name: 'Wheat', emoji: '🌾', tbase: 0, targetGDD: 1800, stages: [
    { gdd: 100, name: 'Emergence', emoji: '🌱' }, { gdd: 400, name: 'Tillering', emoji: '🌿' },
    { gdd: 800, name: 'Stem elongation', emoji: '🌾' }, { gdd: 1200, name: 'Heading', emoji: '🌼' },
    { gdd: 1500, name: 'Flowering', emoji: '🌾' }, { gdd: 1800, name: 'Maturity', emoji: '🍂' },
  ]},
  soybean: { name: 'Soybean', emoji: '🫘', tbase: 10, targetGDD: 1400, stages: [
    { gdd: 100, name: 'Emergence (VE)', emoji: '🌱' }, { gdd: 300, name: 'V3', emoji: '🌿' },
    { gdd: 600, name: 'R1 (begin bloom)', emoji: '🌼' }, { gdd: 900, name: 'R3 (begin pod)', emoji: '🫘' },
    { gdd: 1200, name: 'R5 (begin seed)', emoji: '🫘' }, { gdd: 1400, name: 'R8 (maturity)', emoji: '🍂' },
  ]},
  rice: { name: 'Rice', emoji: '🍚', tbase: 10, targetGDD: 1700, stages: [
    { gdd: 100, name: 'Emergence', emoji: '🌱' }, { gdd: 400, name: 'Tillering', emoji: '🌿' },
    { gdd: 800, name: 'Panicle init', emoji: '🌾' }, { gdd: 1200, name: 'Heading', emoji: '🌼' },
    { gdd: 1500, name: 'Flowering', emoji: '🌾' }, { gdd: 1700, name: 'Maturity', emoji: '🍚' },
  ]},
  tomato: { name: 'Tomato', emoji: '🍅', tbase: 10, targetGDD: 1200, stages: [
    { gdd: 100, name: 'Transplant recovery', emoji: '🌱' }, { gdd: 400, name: 'Vegetative', emoji: '🌿' },
    { gdd: 600, name: 'First flower', emoji: '🌼' }, { gdd: 800, name: 'First fruit', emoji: '🍅' },
    { gdd: 1000, name: 'First harvest', emoji: '🍅' }, { gdd: 1200, name: 'End harvest', emoji: '🍅' },
  ]},
};

export function GDDTracker() {
  const [crop, setCrop] = useState('corn');
  const [plantingDate, setPlantingDate] = useState(new Date().toISOString().slice(0, 10));
  const [lat, setLat] = useState('37.77');
  const [lng, setLng] = useState('-122.42');
  const [weather, setWeather] = useState<{ date: string; tmax: number; tmin: number; gdd: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cropInfo = CROP_BASE_TEMPS[crop];

  const fetchGDD = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const la = parseFloat(lat), ln = parseFloat(lng);
      const start = new Date(plantingDate + 'T00:00:00');
      const end = new Date();
      const daysDiff = Math.min(90, Math.floor((end.getTime() - start.getTime()) / 86400000));
      if (daysDiff <= 0) { setError('Planting date must be in the past'); setLoading(false); return; }

      const startDate = plantingDate;
      const endDate = end.toISOString().slice(0, 10);
      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${la}&longitude=${ln}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Weather API failed: ${res.status}`);
      const data = await res.json();
      const dates: string[] = data.daily.time;
      const tmaxes: number[] = data.daily.temperature_2m_max;
      const tmins: number[] = data.daily.temperature_2m_min;

      let cumulative = 0;
      const dailyGDD = dates.map((date, i) => {
        const tmax = Math.min(tmaxes[i], 30); // cap for corn-style
        const tmin = Math.max(tmins[i], 10);
        const gdd = Math.max(0, ((tmax + tmin) / 2) - cropInfo.tbase);
        cumulative += gdd;
        return { date, tmax: tmaxes[i], tmin: tmins[i], gdd: cumulative };
      });
      setWeather(dailyGDD);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch weather');
    } finally {
      setLoading(false);
    }
  }, [lat, lng, plantingDate, cropInfo]);

  useEffect(() => { fetchGDD(); /* eslint-disable-line */ }, [crop]);

  const currentGDD = weather.length > 0 ? weather[weather.length - 1].gdd : 0;
  const currentStage = useMemo(() => {
    let stage = cropInfo.stages[0];
    for (const s of cropInfo.stages) {
      if (currentGDD >= s.gdd) stage = s;
    }
    return stage;
  }, [currentGDD, cropInfo]);

  const nextStage = useMemo(() => {
    return cropInfo.stages.find(s => s.gdd > currentGDD);
  }, [currentGDD, cropInfo]);

  const pctProgress = (currentGDD / cropInfo.targetGDD) * 100;

  return (
    <Card className="overflow-hidden border-amber-200/60 shadow-sm dark:border-amber-900/60">
      <CardHeader className="border-b bg-gradient-to-r from-amber-50 via-background to-orange-50/50 pb-4 dark:from-amber-950/30 dark:via-background dark:to-orange-950/20">
        <CardTitle className="text-base flex items-center gap-2">
          <Sun className="h-4 w-4 text-amber-600" /> GDD Tracker (Growing Degree Days)
        </CardTitle>
        <p className="text-xs leading-relaxed text-muted-foreground">Accumulates thermal time from Open-Meteo historical data · predicts growth stages</p>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-medium">Crop</Label>
            <select aria-label="Crop" value={crop} onChange={e => setCrop(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              {Object.entries(CROP_BASE_TEMPS).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.name}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs font-medium">Planting date</Label>
            <Input aria-label="Planting date" type="date" value={plantingDate} onChange={e => setPlantingDate(e.target.value)} className="mt-1 h-10 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div><Label className="text-xs font-medium">Latitude</Label><Input aria-label="Latitude" value={lat} onChange={e => setLat(e.target.value)} type="number" step="0.0001" className="mt-1 h-10 text-sm" /></div>
          <div><Label className="text-xs font-medium">Longitude</Label><Input aria-label="Longitude" value={lng} onChange={e => setLng(e.target.value)} type="number" step="0.0001" className="mt-1 h-10 text-sm" /></div>
        </div>
        <Button size="sm" onClick={fetchGDD} disabled={loading} className="h-11 w-full gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Fetching weather…' : 'Calculate GDD'}
        </Button>

        {loading && <Skeleton className="h-24 w-full" />}

        {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-sm leading-relaxed text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300">{error}</div>}

        {!loading && !error && weather.length > 0 && (
          <div className="space-y-3">
            {/* GDD progress bar */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm dark:border-amber-900 dark:bg-amber-950/20">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cumulative GDD</span>
                <Badge variant="secondary" className="text-[9px]">{weather.length} days since planting</Badge>
              </div>
              <div className="text-4xl font-bold font-mono tracking-tight text-amber-700 dark:text-amber-300">{currentGDD.toFixed(0)}</div>
              <div className="text-[10px] text-muted-foreground">of {cropInfo.targetGDD} needed for maturity ({pctProgress.toFixed(0)}%)</div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.min(100, Math.max(0, pctProgress))} aria-valuemin={0} aria-valuemax={100} aria-label="GDD progress to maturity">
                <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all" style={{ width: `${Math.min(100, pctProgress)}%` }} />
              </div>
              {/* Stage markers */}
              <div className="flex justify-between mt-1 text-[8px] text-muted-foreground">
                {cropInfo.stages.map(s => <span key={s.name} className={currentGDD >= s.gdd ? 'text-foreground font-bold' : ''}>{s.emoji}</span>)}
              </div>
            </div>

            {/* Current stage */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 text-center shadow-sm">
                <div className="text-[9px] text-muted-foreground uppercase">Current stage</div>
                <div className="text-xl">{currentStage.emoji}</div>
                <div className="text-xs font-semibold">{currentStage.name}</div>
              </div>
              <div className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-3 text-center shadow-sm">
                <div className="text-[9px] text-muted-foreground uppercase">Next stage</div>
                <div className="text-xl">{nextStage?.emoji ?? '✅'}</div>
                <div className="text-xs font-semibold">{nextStage ? `${nextStage.name} (${(nextStage.gdd - currentGDD).toFixed(0)} GDD)` : 'Mature!'}</div>
              </div>
            </div>

            {/* Daily GDD sparkline */}
            <div className="rounded-xl border bg-muted/10 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><TrendingUp className="h-3.5 w-3.5 text-amber-600" /> Daily GDD accumulation</div>
              <div className="flex items-end gap-0.5 h-16">
                {weather.slice(-30).map((d, i) => (
                  <div key={i} className="flex-1 bg-amber-500/70 rounded-t" style={{ height: `${Math.min(100, (d.gdd / cropInfo.targetGDD) * 100)}%` }} title={`${d.date}: ${d.gdd.toFixed(0)} GDD`} />
                ))}
              </div>
              <div className="text-[8px] text-muted-foreground text-center mt-0.5">Last {Math.min(30, weather.length)} days</div>
            </div>

            <div className="rounded-xl border bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
              💡 GDD = ((Tmax + Tmin) / 2) − Tbase ({cropInfo.tbase}°C). More accurate than calendar days for predicting flowering, fertilizing, and harvest timing.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


