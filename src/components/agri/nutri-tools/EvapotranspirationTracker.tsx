'use client';

/**
 * Evapotranspiration Tracker — uses Open-Meteo's free API (no key) to compute
 * daily reference evapotranspiration (ET₀) and crop evapotranspiration (ETc)
 * for any location, plus a 7-day irrigation-need forecast.
 *
 * ET₀ comes from Open-Meteo's own FAO-56 implementation. ETc = Kc × ET₀,
 * where Kc is interpolated from FAO-56 Table 12 crop coefficients based on
 * the user-supplied day-of-season.
 *
 * All data is fetched client-side directly from api.open-meteo.com.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Droplets, MapPin, RefreshCw, AlertTriangle, CheckCircle2,
  Sprout, Calendar, TrendingUp, CloudRain, Sun, Wind,
} from 'lucide-react';
import {
  getForecast, getHistorical,
  CROP_KCS, kcForDay, etcForDay, wmoDescription,
  type ForecastResult, type HistoricalResult, type CropKc,
} from '@/lib/open-meteo';

const LAST_LOC_KEY = 'et_tracker_last_loc_v1';

export function EvapotranspirationTracker() {
  // Default: San Francisco
  const [lat, setLat] = useState('37.77');
  const [lng, setLng] = useState('-122.42');
  const [cropName, setCropName] = useState<string>('Maize (field)');
  const [dayOfSeason, setDayOfSeason] = useState<number>(60);
  const [irrigationEfficiency, setIrrigationEfficiency] = useState<number>(85);
  const [managedAllowedDepletion, setManagedAllowedDepletion] = useState<number>(50);

  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [history, setHistory] = useState<HistoricalResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore last location from localStorage on mount.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAST_LOC_KEY);
      if (saved) {
        const obj = JSON.parse(saved);
        if (typeof obj.lat === 'string') setLat(obj.lat);
        if (typeof obj.lng === 'string') setLng(obj.lng);
      }
    } catch { /* ignore */ }
  }, []);

  const crop = useMemo<CropKc>(
    () => CROP_KCS.find(c => c.crop === cropName) ?? CROP_KCS[0],
    [cropName],
  );

  const kc = useMemo(() => kcForDay(crop, dayOfSeason), [crop, dayOfSeason]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const la = parseFloat(lat), ln = parseFloat(lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln) || Math.abs(la) > 90 || Math.abs(ln) > 180) {
      setError('Enter valid latitude (-90..90) and longitude (-180..180)');
      setLoading(false);
      return;
    }
    try {
      const f = await getForecast(la, ln, { days: 7 });
      setForecast(f);
      // Also fetch the last 7 days of historical data for context.
      const end = new Date();
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      try {
        const h = await getHistorical(la, ln, fmt(start), fmt(end));
        setHistory(h);
      } catch {
        // Historical is nice-to-have; don't fail the whole thing if it errors.
        setHistory(null);
      }
      localStorage.setItem(LAST_LOC_KEY, JSON.stringify({ lat, lng }));
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch forecast');
      setForecast(null);
    } finally {
      setLoading(false);
    }
  }, [lat, lng]);

  // Auto-fetch on first mount (after restoring saved location).
  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================================
  // Derived: 7-day irrigation plan
  // ============================================================================
  const plan = useMemo(() => {
    if (!forecast) return null;
    return forecast.daily.map(day => {
      const etc = etcForDay(kc, day.et0);
      const effectiveRain = day.precipitationSum * 0.8;  // FAO-56: ~80% of rain is effective
      const netNeed = Math.max(0, etc - effectiveRain);
      // Gross irrigation need = net / efficiency
      const grossNeed = irrigationEfficiency > 0 ? netNeed / (irrigationEfficiency / 100) : netNeed;
      return {
        date: day.date,
        et0: day.et0,
        etc,
        rain: day.precipitationSum,
        rainProb: day.precipitationProbability,
        netNeed,
        grossNeed,
        wmo: day.weatherCode,
        tempMax: day.tempMax,
        tempMin: day.tempMin,
      };
    });
  }, [forecast, kc, irrigationEfficiency]);

  const totals = useMemo(() => {
    if (!plan) return null;
    return {
      et0: plan.reduce((s, d) => s + d.et0, 0),
      etc: plan.reduce((s, d) => s + d.etc, 0),
      rain: plan.reduce((s, d) => s + d.rain, 0),
      grossNeed: plan.reduce((s, d) => s + d.grossNeed, 0),
      irrigationDays: plan.filter(d => d.grossNeed > 1).length,
    };
  }, [plan]);

  const today = plan?.[0];

  return (
    <Card>
      {/* Location + crop controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Droplets className="h-4 w-4 text-cyan-600" /> Evapotranspiration Tracker
          </CardTitle>
          <p className="text-[10px] text-muted-foreground">Free Open-Meteo API · no key required · FAO-56 Penman-Monteith ET₀</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px]">Latitude</Label>
              <Input value={lat} onChange={e => setLat(e.target.value)} type="number" step="0.000001" className="h-8 text-xs mt-0.5" />
            </div>
            <div>
              <Label className="text-[10px]">Longitude</Label>
              <Input value={lng} onChange={e => setLng(e.target.value)} type="number" step="0.000001" className="h-8 text-xs mt-0.5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px]">Crop</Label>
              <select
                value={cropName}
                onChange={e => setCropName(e.target.value)}
                className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5"
              >
                {CROP_KCS.map(c => <option key={c.crop} value={c.crop}>{c.crop}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-[10px]">Day of season (1–{crop.seasonLength})</Label>
              <Input
                value={dayOfSeason}
                onChange={e => setDayOfSeason(Math.max(1, Math.min(crop.seasonLength, parseInt(e.target.value) || 1)))}
                type="number" min={1} max={crop.seasonLength}
                className="h-8 text-xs mt-0.5"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px]">Irrigation efficiency (%)</Label>
              <Input value={irrigationEfficiency} onChange={e => setIrrigationEfficiency(Math.max(1, Math.min(100, parseInt(e.target.value) || 85)))} type="number" min={1} max={100} className="h-8 text-xs mt-0.5" />
            </div>
            <div>
              <Label className="text-[10px]">Managed allowed depletion (%)</Label>
              <Input value={managedAllowedDepletion} onChange={e => setManagedAllowedDepletion(Math.max(1, Math.min(100, parseInt(e.target.value) || 50)))} type="number" min={1} max={100} className="h-8 text-xs mt-0.5" />
            </div>
          </div>
          <Button size="sm" onClick={fetchAll} disabled={loading} className="gap-1.5 w-full">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Fetching…' : 'Refresh forecast'}
          </Button>
          {error && (
            <EmptyState
              icon={AlertTriangle}
              title="Couldn't fetch weather data"
              description={error}
              color="#dc2626"
              variant="compact"
              action={{ label: "Retry", onClick: fetchAll }}
            />
          )}
        </CardContent>
      </Card>

      {/* Current Kc + today's snapshot */}
      {forecast && today && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Sprout className="h-3.5 w-3.5 text-emerald-600" />
              <span className="font-semibold text-sm">{crop.crop}</span>
              <Badge variant="secondary" className="text-[10px]">Day {dayOfSeason} / {crop.seasonLength}</Badge>
              <Badge variant="outline" className="text-[10px] font-mono">Kc = {kc.toFixed(2)}</Badge>
              <Badge variant="outline" className="text-[10px] uppercase">{forecast.timezone}</Badge>
            </div>

            {/* Today's stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Metric icon={Droplets} color="cyan" label="Today ET₀" value={`${today.et0.toFixed(1)}`} unit="mm/day" />
              <Metric icon={Sprout} color="emerald" label="Today ETc" value={`${today.etc.toFixed(1)}`} unit="mm/day" />
              <Metric icon={CloudRain} color="indigo" label="Today rain" value={`${today.rain.toFixed(1)}`} unit={`mm (${today.rainProb}%)`} />
              <Metric icon={Droplets} color={today.grossNeed > 1 ? 'amber' : 'emerald'} label="Irrigation need" value={`${today.grossNeed.toFixed(1)}`} unit="mm gross" />
            </div>

            {/* Current conditions strip */}
            <div className="rounded-md border bg-muted/20 p-2 flex items-center gap-3 text-xs">
              <span className="text-lg">{wmoDescription(forecast.current.weatherCode).icon}</span>
              <span className="font-medium">{wmoDescription(forecast.current.weatherCode).label}</span>
              <span className="text-muted-foreground">·</span>
              <span className="font-mono">{forecast.current.temperature.toFixed(1)}°C</span>
              <span className="text-muted-foreground">·</span>
              <span className="font-mono">{forecast.current.relativeHumidity}% RH</span>
              <span className="text-muted-foreground">·</span>
              <span className="font-mono">{forecast.current.windSpeed10m.toFixed(1)} km/h wind</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 7-day plan */}
      {plan && totals && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-indigo-600" /> 7-day irrigation plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Daily cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {plan.map((d, i) => (
                <div key={d.date} className={`rounded-md border p-2 text-xs ${i === 0 ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{i === 0 ? 'Today' : new Date(d.date + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <span className="text-base">{wmoDescription(d.wmo).icon}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[10px]">
                    <div><span className="text-muted-foreground">ET₀</span> {d.et0.toFixed(1)} mm</div>
                    <div><span className="text-muted-foreground">ETc</span> {d.etc.toFixed(1)} mm</div>
                    <div><span className="text-muted-foreground">Rain</span> {d.rain.toFixed(1)} mm ({d.rainProb}%)</div>
                    <div className={d.grossNeed > 1 ? 'text-amber-700 dark:text-amber-400 font-semibold' : ''}>
                      <span className="text-muted-foreground">Need</span> {d.grossNeed.toFixed(1)} mm
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">7-day totals</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <Stat label="Total ET₀" value={`${totals.et0.toFixed(1)} mm`} />
                <Stat label="Total ETc" value={`${totals.etc.toFixed(1)} mm`} sub={`crop water need`} />
                <Stat label="Effective rain" value={`${(totals.rain * 0.8).toFixed(1)} mm`} sub={`${totals.rain.toFixed(1)} mm gross`} />
                <Stat label="Irrigation" value={`${totals.grossNeed.toFixed(1)} mm`} sub={`${totals.irrigationDays} day${totals.irrigationDays === 1 ? '' : 's'} needed`} accent />
              </div>
            </div>

            {/* Recommendation */}
            {totals.grossNeed > 5 && (
              <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-2 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <div>
                  <strong>Irrigation recommended this week.</strong> Total gross irrigation need of {totals.grossNeed.toFixed(1)} mm across {totals.irrigationDays} day{totals.irrigationDays === 1 ? '' : 's'}.
                  {' '}Apply {managedAllowedDepletion < 50 ? 'smaller, more frequent' : 'larger, less frequent'} doses based on your MAD setting.
                </div>
              </div>
            )}
            {totals.grossNeed > 0 && totals.grossNeed <= 5 && (
              <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-2 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <div>
                  <strong>Light irrigation only.</strong> Rainfall covers most of this week's crop water need. Monitor soil moisture before irrigating.
                </div>
              </div>
            )}
            {totals.grossNeed === 0 && (
              <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-2 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <div>
                  <strong>No irrigation needed this week.</strong> Forecast rainfall exceeds crop water demand.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Historical context */}
      {history && history.daily.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-violet-600" /> Last 7 days (historical ERA5)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const total = history.daily.reduce((s, d) => s + (d.et0Sum || 0), 0);
              const totalRain = history.daily.reduce((s, d) => s + (d.precipitationSum || 0), 0);
              const avgT = history.daily.reduce((s, d) => s + (d.tempMean || 0), 0) / history.daily.length;
              return (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <Stat label="Past 7-day ET₀" value={`${total.toFixed(1)} mm`} />
                  <Stat label="Past 7-day rain" value={`${totalRain.toFixed(1)} mm`} />
                  <Stat label="Avg temperature" value={`${avgT.toFixed(1)}°C`} />
                </div>
              );
            })()}
            <p className="text-[10px] text-muted-foreground mt-2">
              💡 Compare last week's ET₀ to this week's forecast — if past ET₀ exceeded rainfall, soil moisture is depleted and irrigation should be heavier.
            </p>
          </CardContent>
        </Card>
      )}
    </Card>
  );
}

// ============================================================================
// Helpers
// ============================================================================

const ACCENT_BG: Record<string, string> = {
  cyan: 'border-cyan-200 dark:border-cyan-900 bg-cyan-50/40 dark:bg-cyan-950/20',
  emerald: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20',
  indigo: 'border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20',
  amber: 'border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20',
};

function Metric({ icon: Icon, color, label, value, unit }: {
  icon: typeof Droplets; color: keyof typeof ACCENT_BG; label: string; value: string; unit?: string;
}) {
  return (
    <div className={`rounded-md border px-2 py-1.5 ${ACCENT_BG[color]}`}>
      <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase tracking-wide">
        <Icon className="h-2.5 w-2.5" />{label}
      </div>
      <div className="font-mono text-base font-semibold leading-tight">{value}</div>
      {unit && <div className="text-[9px] text-muted-foreground">{unit}</div>}
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-md border px-2 py-1.5 ${accent ? 'border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20' : 'bg-background/40'}`}>
      <div className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="font-mono text-sm font-semibold">{value}</div>
      {sub && <div className="text-[9px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
