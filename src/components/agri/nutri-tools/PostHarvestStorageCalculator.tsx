'use client';

/**
 * Post-Harvest Storage Calculator
 *
 * Three-tab UI:
 *   1. EMC + Safe Storage — equilibrium moisture content + safe days
 *   2. Drying — thin-layer drying time + energy cost
 *   3. Bin Aeration — fan sizing + static pressure
 *
 * Formulas: Henderson EMC, Fraser-Dua safe storage, Page drying rate,
 * drying energy cost, bin aeration CFM (PH.1-PH.5).
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Warehouse, Droplets, Wind, Zap, AlertTriangle, CheckCircle2, Download, FlaskConical,
} from 'lucide-react';

type Tab = 'storage' | 'drying' | 'aeration';

// Crop EMC constants (Henderson equation) — A and B
const CROP_EMC: Record<string, { A: number; B: number; name: string; emoji: string; safeMoisture: number }> = {
  wheat:    { A: 2.3e-5, B: 2.7, name: 'Wheat', emoji: '🌾', safeMoisture: 13.5 },
  maize:    { A: 8.3e-6, B: 1.9, name: 'Maize', emoji: '🌽', safeMoisture: 13.0 },
  rice:     { A: 2.6e-5, B: 2.6, name: 'Rice', emoji: '🍚', safeMoisture: 12.5 },
  barley:   { A: 2.1e-5, B: 2.5, name: 'Barley', emoji: '🌾', safeMoisture: 13.5 },
  sorghum:  { A: 1.4e-5, B: 2.3, name: 'Sorghum', emoji: '🌾', safeMoisture: 13.0 },
  soybean:  { A: 5.0e-5, B: 1.9, name: 'Soybean', emoji: '🫘', safeMoisture: 13.0 },
  oats:     { A: 2.5e-5, B: 2.5, name: 'Oats', emoji: '🌾', safeMoisture: 13.0 },
};

// Safe storage constants (Fraser-Dua) — a, b, c
const SAFE_STORAGE: Record<string, { a: number; b: number; c: number }> = {
  wheat:    { a: 8.5, b: 0.35, c: 0.12 },
  maize:    { a: 8.5, b: 0.35, c: 0.12 },
  rice:     { a: 8.2, b: 0.33, c: 0.11 },
  barley:   { a: 8.4, b: 0.34, c: 0.12 },
  sorghum:  { a: 8.3, b: 0.34, c: 0.12 },
  soybean:  { a: 7.8, b: 0.32, c: 0.10 },
  oats:     { a: 8.3, b: 0.34, c: 0.12 },
};

export function PostHarvestStorageCalculator() {
  const [tab, setTab] = useState<Tab>('storage');

  return (
    <Card className="overflow-hidden border-amber-100 shadow-sm dark:border-amber-900/60">
      <CardHeader className="border-b border-border/60 bg-amber-50/50 pb-4 dark:bg-amber-950/10">
        <CardTitle className="flex items-center gap-2 text-base"><span className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"><Warehouse className="h-4 w-4" /></span> Post-Harvest Storage Calculator
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">EMC · Safe storage days · Drying time + cost · Bin aeration fan sizing — 7 crops</p>
        <div className="mt-3 grid grid-cols-1 gap-1 rounded-xl bg-amber-100/70 p-1 dark:bg-amber-950/30 sm:grid-cols-3">
          <TabBtn active={tab === 'storage'} onClick={() => setTab('storage')} icon={Droplets} label="EMC + Safe Storage" />
          <TabBtn active={tab === 'drying'} onClick={() => setTab('drying')} icon={Zap} label="Drying" />
          <TabBtn active={tab === 'aeration'} onClick={() => setTab('aeration')} icon={Wind} label="Bin Aeration" />
        </div>
      </CardHeader>
      <CardContent>
        {tab === 'storage' && <StorageTab />}
        {tab === 'drying' && <DryingTab />}
        {tab === 'aeration' && <AerationTab />}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Tab 1: EMC + Safe Storage
// ============================================================================

function StorageTab() {
  const [crop, setCrop] = useState('wheat');
  const [temp, setTemp] = useState('25');
  const [rh, setRh] = useState('70');
  const [moisture, setMoisture] = useState('14');

  const result = useMemo(() => {
    const c = CROP_EMC[crop];
    const T = parseFloat(temp), RH = parseFloat(rh) / 100;
    const M = parseFloat(moisture);
    if (!Number.isFinite(T) || !Number.isFinite(RH) || RH <= 0 || RH >= 1) return null;

    // Henderson: EMC = [-ln(1-RH) / (A × (T+273.15))]^(1/B)
    const emc = Math.pow(-Math.log(1 - RH) / (c.A * (T + 273.15)), 1 / c.B);

    // Safe storage days (Fraser-Dua)
    const ss = SAFE_STORAGE[crop];
    const logD = ss.a - ss.b * M - ss.c * T;
    const safeDays = Math.pow(10, logD) * 0.7; // 0.7 safety factor

    return { emc, safeDays, safe: M <= emc, crop: c };
  }, [crop, temp, rh, moisture]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-amber-200/70 bg-amber-50/30 p-3 sm:grid-cols-2 dark:border-amber-900/60 dark:bg-amber-950/10">
        <div>
          <Label className="text-[10px]">Crop</Label>
          <select value={crop} onChange={e => setCrop(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {Object.entries(CROP_EMC).map(([k, v]) => (
              <option key={k} value={k}>{v.emoji} {v.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-[10px]">Current moisture (% wet basis)</Label>
          <Input value={moisture} onChange={e => setMoisture(e.target.value)} type="number" step="0.1" className="mt-1 h-10 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-amber-200/70 bg-amber-50/30 p-3 sm:grid-cols-2 dark:border-amber-900/60 dark:bg-amber-950/10">
        <div>
          <Label className="text-[10px]">Storage temperature (°C)</Label>
          <Input value={temp} onChange={e => setTemp(e.target.value)} type="number" step="0.1" className="mt-1 h-10 text-sm" />
        </div>
        <div>
          <Label className="text-[10px]">Storage relative humidity (%)</Label>
          <Input value={rh} onChange={e => setRh(e.target.value)} type="number" step="1" min="0" max="100" className="mt-1 h-10 text-sm" />
        </div>
      </div>

      {result && (
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-3" style={{ borderColor: result.safe ? '#10b98160' : '#dc262660', backgroundColor: result.safe ? '#10b98110' : '#dc262610' }}>
              <div className="text-[10px] text-muted-foreground uppercase">Equilibrium Moisture</div>
              <div className="text-2xl font-bold font-mono">{result.emc.toFixed(1)}%</div>
              <div className="text-[10px] text-muted-foreground">at {temp}°C, {rh}% RH</div>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: result.safeDays > 30 ? '#10b98160' : result.safeDays > 7 ? '#f59e0b60' : '#dc262660', backgroundColor: result.safeDays > 30 ? '#10b98110' : result.safeDays > 7 ? '#f59e0b10' : '#dc262610' }}>
              <div className="text-[10px] text-muted-foreground uppercase">Safe Storage Days</div>
              <div className="text-2xl font-bold font-mono">{result.safeDays < 1 ? '<1' : result.safeDays.toFixed(0)}</div>
              <div className="text-[10px] text-muted-foreground">days (with 0.7× safety)</div>
            </div>
          </div>

          {result.safe ? (
            <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span><strong>Safe to store.</strong> Current moisture ({moisture}%) is at or below EMC ({result.emc.toFixed(1)}%). Grain will not gain moisture.</span>
            </div>
          ) : (
            <div className="rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/20 p-2 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span><strong>Not safe to store.</strong> Grain will absorb moisture from air (EMC {result.emc.toFixed(1)}% &gt; current {moisture}%). Dry grain first or reduce storage RH.</span>
            </div>
          )}

          {result.safeDays < 30 && (
            <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 p-2 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span><strong>Dry within {Math.ceil(result.safeDays / 2)} days.</strong> Below 30-day safe storage — risk of mold + aflatoxin. Go to Drying tab.</span>
            </div>
          )}

          <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
            💡 Safe moisture for long-term storage of {result.crop.name}: {result.crop.safeMoisture}%. At this moisture + 25°C, expect ~100+ safe days.
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Tab 2: Drying
// ============================================================================

function DryingTab() {
  const [crop, setCrop] = useState('wheat');
  const [mStart, setMStart] = useState('20');
  const [mTarget, setMTarget] = useState('14');
  const [airTemp, setAirTemp] = useState('60');
  const [electricityPrice, setElectricityPrice] = useState('0.12');
  const [efficiency, setEfficiency] = useState('0.6');

  const result = useMemo(() => {
    const c = CROP_EMC[crop];
    const M0 = parseFloat(mStart), Mf = parseFloat(mTarget);
    const T = parseFloat(airTemp);
    const Pe = parseFloat(electricityPrice);
    const eta = parseFloat(efficiency);
    if (!Number.isFinite(M0) || !Number.isFinite(Mf) || Mf >= M0) return null;

    // EMC at drying conditions (assume RH=30% in hot air)
    const RH = 0.30;
    const Me = Math.pow(-Math.log(1 - RH) / (c.A * (T + 273.15)), 1 / c.B);

    // Drying constants (approximate — increase with air temp)
    const k = 0.02 * Math.exp(0.03 * T);  // hr⁻¹
    const n = 0.7;

    // Moisture ratio
    const MR = (Mf - Me) / (M0 - Me);
    if (MR <= 0) return { error: 'Target moisture below EMC at these conditions — impossible.' };

    // Page equation: MR = exp(-k × t^n) → t = [-ln(MR)/k]^(1/n)
    const dryingTime = Math.pow(-Math.log(MR) / k, 1 / n);

    // Water removed (kg per tonne)
    const waterRemoved = 1000 * (M0 / 100 - Mf / 100) / (1 - Mf / 100);

    // Energy cost
    const hfg = 2260;  // kJ/kg
    const energyKWh = (waterRemoved * hfg) / (eta * 3600);
    const costPerTonne = energyKWh * Pe;

    return { dryingTime, waterRemoved, energyKWh, costPerTonne, Me, error: null };
  }, [crop, mStart, mTarget, airTemp, electricityPrice, efficiency]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-amber-200/70 bg-amber-50/30 p-3 sm:grid-cols-2 dark:border-amber-900/60 dark:bg-amber-950/10">
        <div>
          <Label className="text-[10px]">Crop</Label>
          <select value={crop} onChange={e => setCrop(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {Object.entries(CROP_EMC).map(([k, v]) => (
              <option key={k} value={k}>{v.emoji} {v.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-[10px]">Air temperature (°C)</Label>
          <Input value={airTemp} onChange={e => setAirTemp(e.target.value)} type="number" step="1" className="mt-1 h-10 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-amber-200/70 bg-amber-50/30 p-3 sm:grid-cols-3 dark:border-amber-900/60 dark:bg-amber-950/10">
        <div>
          <Label className="text-[10px]">Start moisture (%)</Label>
          <Input value={mStart} onChange={e => setMStart(e.target.value)} type="number" step="0.1" className="mt-1 h-10 text-sm" />
        </div>
        <div>
          <Label className="text-[10px]">Target moisture (%)</Label>
          <Input value={mTarget} onChange={e => setMTarget(e.target.value)} type="number" step="0.1" className="mt-1 h-10 text-sm" />
        </div>
        <div>
          <Label className="text-[10px]">Dryer efficiency (0–1)</Label>
          <Input value={efficiency} onChange={e => setEfficiency(e.target.value)} type="number" step="0.05" min="0.3" max="0.9" className="mt-1 h-10 text-sm" />
        </div>
      </div>
      <div>
        <Label className="text-[10px]">Electricity price ($/kWh)</Label>
        <Input value={electricityPrice} onChange={e => setElectricityPrice(e.target.value)} type="number" step="0.01" className="mt-1 h-10 text-sm" />
      </div>

      {result?.error && (
        <div className="rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 p-2 text-xs text-rose-700 dark:text-rose-300">
          {result.error}
        </div>
      )}

      {result && !result.error && result.dryingTime !== undefined && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Drying time" value={`${result.dryingTime!.toFixed(1)} hr`} color="amber" />
            <Metric label="Water removed" value={`${result.waterRemoved!.toFixed(0)} kg/t`} color="cyan" />
            <Metric label="Energy" value={`${result.energyKWh!.toFixed(1)} kWh/t`} color="violet" />
            <Metric label="Cost" value={`$${result.costPerTonne!.toFixed(2)}/t`} color="emerald" />
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
            💡 EMC at {airTemp}°C drying air: {result.Me!.toFixed(1)}%. Page equation with k={(0.02 * Math.exp(0.03 * parseFloat(airTemp))).toFixed(3)} hr⁻¹. Increase air temp to cut drying time exponentially.
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Tab 3: Bin Aeration
// ============================================================================

function AerationTab() {
  const [binDiameter, setBinDiameter] = useState('6');
  const [grainDepth, setGrainDepth] = useState('3');
  const [crop, setCrop] = useState('wheat');
  const [airflowRate, setAirflowRate] = useState('1.0');

  const result = useMemo(() => {
    const D = parseFloat(binDiameter), H = parseFloat(grainDepth);
    const AFR = parseFloat(airflowRate);
    if (!Number.isFinite(D) || !Number.isFinite(H)) return null;

    // Bin volume + grain weight
    const radius = D / 2;
    const volume = Math.PI * radius * radius * H;  // m³
    const bulkDensity: Record<string, number> = {
      wheat: 780, maize: 720, rice: 720, barley: 650, sorghum: 730, soybean: 720, oats: 520,
    };
    const bd = bulkDensity[crop] || 780;
    const grainMass = volume * bd;  // kg
    const grainT = grainMass / 1000;
    const grainBu = grainMass / 27.2;  // 1 bu ≈ 27.2 kg (wheat)

    // Airflow: AFR in m³/min/t × tonnes
    const cfmPerBu = AFR * 1.06;  // 1 m³/min/t ≈ 1.06 CFM/bu
    const cfm = cfmPerBu * grainBu;

    // Static pressure (rough — ASABE curves)
    // Depth × grain factor × AFR factor
    const grainFactor: Record<string, number> = {
      wheat: 1.0, maize: 0.7, rice: 1.1, barley: 0.8, sorghum: 1.0, soybean: 0.7, oats: 0.6,
    };
    const sp = grainFactor[crop] * H * (0.5 + 0.3 * AFR);  // Pa (approximate)

    // Fan power: P = Q × SP / η
    const fanPower = (cfm * 0.000472 * sp) / 0.4;  // kW (convert CFM to m³/s)

    return { grainT, grainBu, cfm, sp, fanPower, volume };
  }, [binDiameter, grainDepth, crop, airflowRate]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-amber-200/70 bg-amber-50/30 p-3 sm:grid-cols-2 dark:border-amber-900/60 dark:bg-amber-950/10">
        <div>
          <Label className="text-[10px]">Bin diameter (m)</Label>
          <Input value={binDiameter} onChange={e => setBinDiameter(e.target.value)} type="number" step="0.5" className="mt-1 h-10 text-sm" />
        </div>
        <div>
          <Label className="text-[10px]">Grain depth (m)</Label>
          <Input value={grainDepth} onChange={e => setGrainDepth(e.target.value)} type="number" step="0.5" className="mt-1 h-10 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-amber-200/70 bg-amber-50/30 p-3 sm:grid-cols-2 dark:border-amber-900/60 dark:bg-amber-950/10">
        <div>
          <Label className="text-[10px]">Crop</Label>
          <select value={crop} onChange={e => setCrop(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {Object.entries(CROP_EMC).map(([k, v]) => (
              <option key={k} value={k}>{v.emoji} {v.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-[10px]">Airflow rate (m³/min/t)</Label>
          <select value={airflowRate} onChange={e => setAirflowRate(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="0.1">0.1 — Cooling only</option>
            <option value="0.5">0.5 — Light drying</option>
            <option value="1.0">1.0 — Standard drying</option>
            <option value="2.0">2.0 — Fast drying</option>
          </select>
        </div>
      </div>

      {result && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Grain in bin" value={`${result.grainT.toFixed(1)} t`} sub={`${result.grainBu.toFixed(0)} bu`} color="amber" />
            <Metric label="Required CFM" value={result.cfm.toFixed(0)} sub="cubic ft/min" color="cyan" />
            <Metric label="Static pressure" value={`${result.sp.toFixed(0)} Pa`} sub="resistance" color="violet" />
            <Metric label="Fan power" value={`${result.fanPower.toFixed(1)} kW`} sub="minimum" color="emerald" />
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
            💡 Select fan with ≥{result.cfm.toFixed(0)} CFM at {result.sp.toFixed(0)} Pa static pressure. Add 20% safety margin. Run fans at night (cool, dry air) for first 2 weeks.
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Shared
// ============================================================================

const ACCENT_BG: Record<string, string> = {
  cyan: 'border-cyan-200 dark:border-cyan-900 bg-cyan-50/40 dark:bg-cyan-950/20',
  emerald: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20',
  amber: 'border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20',
  violet: 'border-violet-200 dark:border-violet-900 bg-violet-50/40 dark:bg-violet-950/20',
};

function Metric({ label, value, sub, color }: { label: string; value: string; sub?: string; color: keyof typeof ACCENT_BG }) {
  return (
    <div className={`rounded-xl border p-3 shadow-sm ${ACCENT_BG[color]}`}>
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-mono text-sm font-semibold leading-tight">{value}</div>
      {sub && <div className="text-[9px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Droplets; label: string }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${active ? 'bg-background text-amber-700 shadow-sm dark:text-amber-300' : 'text-muted-foreground hover:text-foreground'}`}>
      <Icon className="h-4 w-4" /><span>{label}</span>
    </button>
  );
}
