'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CloudSun } from 'lucide-react';
import { calcVpdAdvanced, calcVpdSimple, hdClass, leafTempFromRadiation, vpdStatus } from '@/lib/nutri-tools-data';
import { WeatherFetcher } from './WeatherFetcher';
import { AnimatedCounter } from './AnimatedCounter';
import { RangeSparkline } from './RangeSparkline';

/**
 * Tool 6 — VPD Estimator
 */

interface VpdExample {
  label: string;
  airTemp: string;
  humidity: string;
  mode: 'leaf' | 'radiation';
  leafTemp?: string;
  solarRad?: string;
}

const VPD_EXAMPLES: VpdExample[] = [
  { label: 'Greenhouse noon',     airTemp: '28', humidity: '65', mode: 'leaf',      leafTemp: '26' },
  { label: 'Cold morning',       airTemp: '12', humidity: '85', mode: 'leaf',      leafTemp: '10' },
  { label: 'Hot dry afternoon',  airTemp: '35', humidity: '25', mode: 'radiation', solarRad: '900' },
];

export function VpdEstimator() {
  const [airTemp, setAirTemp] = useState('25');
  const [humidity, setHumidity] = useState('60');
  const [mode, setMode] = useState<'leaf' | 'radiation'>('leaf');
  const [leafTemp, setLeafTemp] = useState('24');
  const [solarRad, setSolarRad] = useState('400');
  const [liveApplied, setLiveApplied] = useState(false);

  const applyExample = (ex: VpdExample) => {
    setAirTemp(ex.airTemp);
    setHumidity(ex.humidity);
    setMode(ex.mode);
    if (ex.leafTemp !== undefined) setLeafTemp(ex.leafTemp);
    if (ex.solarRad !== undefined) setSolarRad(ex.solarRad);
  };

  const t = parseFloat(airTemp) || 0;
  const rh = parseFloat(humidity) || 0;
  const lt = mode === 'leaf'
    ? (parseFloat(leafTemp) || 0)
    : leafTempFromRadiation(t, parseFloat(solarRad) || 0);

  const hasInputs = !!(t && rh && rh >= 0 && rh <= 100);
  const result = hasInputs
    ? (mode === 'leaf' ? calcVpdAdvanced(t, rh, lt) : calcVpdAdvanced(t, rh, Math.round(lt * 10) / 10))
    : null;
  const simple = hasInputs ? calcVpdSimple(t, rh) : null;

  const status = result ? vpdStatus(result.vpd) : null;
  const hdCls = result ? hdClass(result.hd) : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">VPD Estimator</CardTitle>
        <p className="text-xs text-muted-foreground">Vapor Pressure Deficit (kPa) and Humidity Deficit (g/m³).</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: inputs */}
          <div className="space-y-4">
            <WeatherFetcher
              variant="vpd"
              onWeather={(w) => {
                setAirTemp(String(w.temperature));
                setHumidity(String(w.humidity));
                setSolarRad(String(w.solarRadiation));
                setMode('radiation');
                setLiveApplied(true);
              }}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs flex items-center gap-1.5">
                  Air temperature (°C)
                  {liveApplied && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-full px-1.5 py-px">
                      <CloudSun className="h-2.5 w-2.5" />
                      Live weather applied
                    </span>
                  )}
                </Label>
                <Input value={airTemp} onChange={e => setAirTemp(e.target.value)} className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs">Relative humidity (%)</Label>
                <Input value={humidity} onChange={e => setHumidity(e.target.value)} className="h-9 mt-1" />
              </div>
            </div>

            <div>
              <Label className="text-xs mb-2 block">Mode</Label>
              <RadioGroup value={mode} onValueChange={v => setMode(v as 'leaf'|'radiation')} className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="vpd-leaf" value="leaf" />
                  <Label htmlFor="vpd-leaf" className="text-sm cursor-pointer">Leaf temperature</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="vpd-rad" value="radiation" />
                  <Label htmlFor="vpd-rad" className="text-sm cursor-pointer">Solar radiation</Label>
                </div>
              </RadioGroup>
            </div>

            {mode === 'leaf' ? (
              <div>
                <Label className="text-xs">Leaf temperature (°C)</Label>
                <Input value={leafTemp} onChange={e => setLeafTemp(e.target.value)} className="h-9 mt-1" />
              </div>
            ) : (
              <div>
                <Label className="text-xs">Solar radiation (W/m²)</Label>
                <Input value={solarRad} onChange={e => setSolarRad(e.target.value)} className="h-9 mt-1" />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Computed leaf temp: <strong>{lt.toFixed(1)} °C</strong>
                </p>
              </div>
            )}

            {!hasInputs && humidity && (parseFloat(humidity) < 0 || parseFloat(humidity) > 100) && (
              <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 rounded p-2">
                Relative humidity must be between 0 and 100%.
              </div>
            )}

            {/* Worked-example chips */}
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Try an example</div>
              <div className="flex flex-wrap gap-1.5">
                {VPD_EXAMPLES.map(ex => (
                  <button
                    key={ex.label}
                    type="button"
                    onClick={() => applyExample(ex)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: results */}
          <div className="space-y-3">
            {result && status && hdCls ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg p-4 border" style={{ background: `${status.color}15`, borderColor: `${status.color}40` }}>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">VPD</div>
                    <div className="mt-1" style={{ color: status.color }}>
                      <AnimatedCounter value={result.vpd} decimals={2} suffix=" kPa" className="text-3xl font-bold" />
                    </div>
                    <div className="text-xs font-medium mt-1" style={{ color: status.color }}>{status.label}</div>
                  </div>
                  <div className="rounded-lg p-4 border" style={{ background: `${hdCls.color}15`, borderColor: `${hdCls.color}40` }}>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Humidity deficit</div>
                    <div className="mt-1" style={{ color: hdCls.color }}>
                      <AnimatedCounter value={result.hd} decimals={2} suffix=" g/m³" className="text-3xl font-bold" />
                    </div>
                    <div className="text-xs font-medium mt-1" style={{ color: hdCls.color }}>{hdCls.label}</div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">VPD range</div>
                  <RangeSparkline
                    value={result.vpd}
                    min={0}
                    max={3}
                    zones={[
                      { from: 0,   to: 0.5, color: '#3b82f6', label: 'Low' },
                      { from: 0.5, to: 1.5, color: '#10b981', label: 'Optimal' },
                      { from: 1.5, to: 3,   color: '#ef4444', label: 'High' },
                    ]}
                    showLabels
                  />
                </div>

                {simple && (
                  <div className="text-[11px] text-muted-foreground bg-muted/30 rounded p-2">
                    Simple VPD (no leaf correction): <strong>{simple.vpd.toFixed(2)} kPa</strong> · HD {simple.hd.toFixed(2)} g/m³
                  </div>
                )}

                <div className="text-xs rounded-lg p-3 border" style={{ color: hdCls.color, background: `${hdCls.color}10`, borderColor: `${hdCls.color}30` }}>
                  {hdCls.message}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[200px] text-sm text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                Enter temperature and humidity to see VPD results.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
