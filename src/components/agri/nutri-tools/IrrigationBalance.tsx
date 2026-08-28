'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Check, CloudSun, X } from 'lucide-react';
import { computeIrrigation, type IrrigationResult } from '@/lib/nutri-tools-data';
import { CropPresetDropdown } from './CropPresetDropdown';
import type { CropPreset } from '@/lib/crop-presets';
import { useBridgePayload } from '@/lib/use-bridge-payload';
import { WeatherFetcher } from './WeatherFetcher';
import { AnimatedCounter } from './AnimatedCounter';

const KC_REFERENCE = [
  { stage: 'Initial',      kc: 0.4  },
  { stage: 'Development',  kc: 0.75 },
  { stage: 'Mid-season',   kc: 1.05 },
  { stage: 'Late-season',  kc: 0.85 },
];

/**
 * Tool 16 — Irrigation Sheet & Water Balance (FAO-56)
 */

interface ExampleChip {
  label: string;
  et0: string;
  kc: string;
  rain: string;
  period: 1 | 7;
}

const EXAMPLE_CHIPS: ExampleChip[] = [
  { label: 'Tomato mid-season', et0: '5',  kc: '1.15', rain: '0', period: 7 },
  { label: 'Citrus daily',      et0: '4',  kc: '0.85', rain: '0', period: 1 },
  { label: 'Strawberry 7-day',  et0: '22', kc: '0.7',  rain: '8', period: 7 },
];

export function IrrigationBalance() {
  const [period, setPeriod] = useState<1 | 7>(1);
  const [et0, setEt0] = useState('4.5');
  const [kc, setKc] = useState('1.05');
  const [rain, setRain] = useState('0');
  const [irrigM3, setIrrigM3] = useState('60');
  const [irrigArea, setIrrigArea] = useState('1');
  const [cropArea, setCropArea] = useState('1');
  const [preset, setPreset] = useState<CropPreset | null>(null);
  const [liveEtoApplied, setLiveEtoApplied] = useState(false);

  // "Send to" bridge — receive payloads from Soil Water & Texture.
  const bridgePayload = useBridgePayload('irrigation-balance');
  const [bridgeBanner, setBridgeBanner] = useState<{ m3: number; ha: number } | null>(null);
  useEffect(() => {
    if (!bridgePayload) return;
    const v = bridgePayload.values;
    const m3 = typeof v.irrigationM3 === 'number' ? v.irrigationM3 : parseFloat(String(v.irrigationM3 ?? '0')) || 0;
    const ha = typeof v.irrigatedAreaHa === 'number' ? v.irrigatedAreaHa : parseFloat(String(v.irrigatedAreaHa ?? '0')) || 0;
    if (m3 > 0) setIrrigM3(String(m3));
    if (ha > 0) {
      setIrrigArea(String(ha));
      setCropArea(String(ha));
    }
    setBridgeBanner({ m3, ha });
  }, [bridgePayload]);

  const applyCropPreset = (p: CropPreset) => {
    setPreset(p);
    // Mid stage (index 2 of the FAO-56 4-stage table) is the peak Kc value
    // the user typically wants for sizing irrigation during peak demand.
    const stages = p.irrigation.stages;
    const midKc = stages[Math.min(2, stages.length - 1)]?.kc;
    if (typeof midKc === 'number') setKc(String(midKc));
  };

  const applyExample = (chip: ExampleChip) => {
    setEt0(chip.et0);
    setKc(chip.kc);
    setRain(chip.rain);
    setPeriod(chip.period);
  };

  const result: IrrigationResult | null = useMemo(() => {
    const p = {
      et0: parseFloat(et0) || 0,
      kc: parseFloat(kc) || 0,
      rain: parseFloat(rain) || 0,
      irrigationM3: parseFloat(irrigM3) || 0,
      irrigatedAreaHa: parseFloat(irrigArea) || 0,
      cropAreaHa: parseFloat(cropArea) || 0,
      periodDays: period,
    };
    if (!p.et0 || !p.kc) return null;
    return computeIrrigation(p);
  }, [et0, kc, rain, irrigM3, irrigArea, cropArea, period]);

  const balanceColor = !result
    ? '#64748b'
    : result.balance >= 0
      ? '#0ea5e9'   // surplus — blue
      : result.balance < -2
        ? '#dc2626' // strong deficit — red
        : '#ea580c'; // mild deficit — orange

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-base">Irrigation Sheet & Water Balance</CardTitle>
            <p className="text-xs text-muted-foreground">
              FAO-56 standard: ETc = Kc × ETo. Balance = irrigation (mm) + rain − ETc.
            </p>
          </div>
          <CropPresetDropdown onSelect={applyCropPreset} value={preset?.id ?? null} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {bridgeBanner && (
          <div className="rounded-md border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 flex items-start gap-2">
            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-emerald-800 dark:text-emerald-200 flex-1 leading-snug">
              Received from <strong>Soil Water &amp; Texture</strong>:{' '}
              {bridgeBanner.m3.toLocaleString('en-US', { maximumFractionDigits: 0 })} m³ on{' '}
              {bridgeBanner.ha.toFixed(1)} ha — irrigation volume &amp; areas updated.
            </div>
            <button
              type="button"
              onClick={() => setBridgeBanner(null)}
              className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {preset && (
          <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-2.5 space-y-2">
            <div className="text-[11px] text-emerald-800 dark:text-emerald-200">
              <strong className="font-medium">{preset.emoji} {preset.name} — Kc set to {kc} (mid-season).</strong>{' '}
              {preset.irrigation.notes}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {preset.irrigation.stages.map(s => (
                <div key={s.name} className="rounded-md border border-emerald-200/60 dark:border-emerald-800/60 bg-background/60 p-2 text-center">
                  <div className="text-[10px] text-muted-foreground">{s.name}</div>
                  <div className="text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">{s.kc.toFixed(2)}</div>
                  <div className="text-[10px] text-muted-foreground">{s.days} d</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left column: inputs */}
          <div className="space-y-3">
            <WeatherFetcher
              variant="irrigation"
              onWeather={() => {
                /* current weather not consumed here yet — ETo drives the balance */
              }}
              onEto={(eto) => {
                const days = eto.etoPerDay;
                const sum =
                  period === 1
                    ? (days[days.length - 1] ?? 0)
                    : days.slice(-7).reduce((a, b) => a + b, 0);
                setEt0(String(Math.round(sum * 100) / 100));
                setRain('0');
                setLiveEtoApplied(true);
              }}
            />

            <div>
              <Label className="text-xs mb-2 block">Period</Label>
              <div className="inline-flex rounded-md border overflow-hidden">
                <Button
                  size="sm"
                  variant={period === 1 ? 'default' : 'ghost'}
                  className="rounded-none"
                  onClick={() => setPeriod(1)}
                >
                  1 day
                </Button>
                <Button
                  size="sm"
                  variant={period === 7 ? 'default' : 'ghost'}
                  className="rounded-none border-l"
                  onClick={() => setPeriod(7)}
                >
                  7 days
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label={`ETo (mm / ${period === 1 ? 'day' : 'week'})`}
                value={et0}
                onChange={setEt0}
                badge={
                  liveEtoApplied ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-full px-1.5 py-px">
                      <CloudSun className="h-2.5 w-2.5" />
                      Live ETo from Open-Meteo
                    </span>
                  ) : null
                }
              />
              <Field label="Crop coefficient (Kc)" value={kc} onChange={setKc} />
              <Field label={`Rain (mm / ${period === 1 ? 'day' : 'week'})`} value={rain} onChange={setRain} />
              <Field label="Irrigation volume (m³)" value={irrigM3} onChange={setIrrigM3} />
              <Field label="Irrigated area (ha)" value={irrigArea} onChange={setIrrigArea} />
              <Field label="Crop reference area (ha)" value={cropArea} onChange={setCropArea} />
            </div>

            {/* Worked-example chips */}
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Try an example</div>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_CHIPS.map(chip => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => applyExample(chip)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: results */}
          <div className="space-y-3">
            {result ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Metric label="ETc" value={<AnimatedCounter value={result.etc} decimals={2} suffix=" mm" className="tabular-nums" />} hint="Kc × ETo" />
                  <Metric label="Irrigation sheet" value={<AnimatedCounter value={result.irrigationMm} decimals={2} suffix=" mm" className="tabular-nums" />} hint="m³ / (ha × 10)" />
                  <Metric label="Rain" value={<AnimatedCounter value={result.rain} decimals={2} suffix=" mm" className="tabular-nums" />} hint="manual entry" />
                  <Metric
                    label="Balance"
                    value={<AnimatedCounter value={result.balance} decimals={2} prefix={result.balance >= 0 ? '+' : ''} suffix=" mm" className="tabular-nums" />}
                    hint={result.balance >= 0 ? 'surplus' : 'deficit'}
                    color={balanceColor}
                  />
                  <Metric
                    label="Total volume needed"
                    value={<AnimatedCounter value={result.totalVolumeM3} decimals={0} suffix=" m³" className="tabular-nums" />}
                    hint="ETc × crop area × 10"
                    className="col-span-2"
                  />
                </div>

                <div
                  className="rounded-lg p-3 text-xs border"
                  style={{
                    background: result.balance >= 0 ? '#0ea5e915' : '#ea580c15',
                    borderColor: result.balance >= 0 ? '#0ea5e940' : '#ea580c40',
                    color: balanceColor,
                  }}
                >
                  {result.balance >= 0
                    ? `Surplus of ${result.balance.toFixed(2)} mm — irrigation + rain exceed crop demand.`
                    : `Deficit of ${Math.abs(result.balance).toFixed(2)} mm — crop demand exceeds supply; consider increasing irrigation.`}
                </div>

                {/* Kc reference table */}
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Typical Kc values (FAO-56)</div>
                  <div className="grid grid-cols-4 gap-2">
                    {KC_REFERENCE.map(k => (
                      <div key={k.stage} className="rounded-md border border-border/60 p-2 text-center">
                        <div className="text-[10px] text-muted-foreground">{k.stage}</div>
                        <div className="text-sm font-semibold tabular-nums">{k.kc.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[200px] text-sm text-muted-foreground bg-muted/30 rounded-lg border border-dashed">Enter inputs to see results.</div>
            )}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground italic">
          FAO-56 standard: ETc = Kc × ETo. Optional live ETo from Open-Meteo (use the panel above).
        </p>
      </CardContent>
    </Card>
  );
}

function Field({
  label, value, onChange, badge,
}: { label: string; value: string; onChange: (v: string) => void; badge?: ReactNode | null }) {
  return (
    <div>
      <Label className="text-xs flex items-center gap-1.5">
        {label}
        {badge}
      </Label>
      <Input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-9 mt-1"
      />
    </div>
  );
}

function Metric({
  label, value, hint, color, className,
}: { label: string; value: ReactNode; hint?: string; color?: string; className?: string }) {
  return (
    <div className={`rounded-lg border border-border/60 bg-muted/20 p-3 ${className || ''}`}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-3xl font-bold tabular-nums" style={{ color: color || 'inherit' }}>{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
