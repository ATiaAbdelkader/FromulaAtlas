'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gauge, Zap, AlertTriangle } from 'lucide-react';

export function PumpEfficiencyCalculator() {
  const [flow, setFlow] = useState('20');
  const [head, setHead] = useState('35');
  const [efficiency, setEfficiency] = useState('65');
  const [electricityPrice, setElectricityPrice] = useState('0.12');
  const [hoursPerDay, setHoursPerDay] = useState('8');

  const result = useMemo(() => {
    const Q = parseFloat(flow), H = parseFloat(head), eta = parseFloat(efficiency) / 100;
    const Pe = parseFloat(electricityPrice), hp = parseFloat(hoursPerDay);
    if (!Number.isFinite(Q) || !Number.isFinite(H) || eta <= 0) return null;

    const hydraulicPower = (Q * H * 9.81) / 60; // kW (Q in m³/h, H in m)
    const shaftPower = hydraulicPower / eta;
    const motorPower = shaftPower / 0.9; // motor efficiency ~90%
    const dailyEnergy = motorPower * hp; // kWh/day
    const dailyCost = dailyEnergy * Pe;
    const costPerM3 = dailyCost / (Q * hp);
    const efficiencyPercent = eta * 100;

    let rating: string, color: string;
    if (efficiencyPercent >= 70) { rating = 'Good'; color = '#10b981'; }
    else if (efficiencyPercent >= 50) { rating = 'Fair'; color = '#eab308'; }
    else { rating = 'Poor — consider replacement'; color = '#dc2626'; }

    return { hydraulicPower, shaftPower, motorPower, dailyEnergy, dailyCost, costPerM3, rating, color };
  }, [flow, head, efficiency, electricityPrice, hoursPerDay]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Gauge className="h-4 w-4 text-indigo-600" /> Pump Efficiency Calculator
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">Hydraulic power · motor kW · daily energy cost · $/m³ · efficiency rating</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">Flow rate (m³/h)</Label>
            <Input value={flow} onChange={e => setFlow(e.target.value)} type="number" step="1" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Total head (m)</Label>
            <Input value={head} onChange={e => setHead(e.target.value)} type="number" step="1" className="h-8 text-xs mt-0.5" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-[10px]">Pump η (%)</Label>
            <Input value={efficiency} onChange={e => setEfficiency(e.target.value)} type="number" step="5" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Electricity ($/kWh)</Label>
            <Input value={electricityPrice} onChange={e => setElectricityPrice(e.target.value)} type="number" step="0.01" className="h-8 text-xs mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px]">Hours/day</Label>
            <Input value={hoursPerDay} onChange={e => setHoursPerDay(e.target.value)} type="number" step="1" className="h-8 text-xs mt-0.5" />
          </div>
        </div>
        {result && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Metric label="Hydraulic" value={`${result.hydraulicPower.toFixed(1)} kW`} color="cyan" />
              <Metric label="Motor" value={`${result.motorPower.toFixed(1)} kW`} color="indigo" />
              <Metric label="Daily energy" value={`${result.dailyEnergy.toFixed(1)} kWh`} color="amber" />
              <Metric label="Daily cost" value={`$${result.dailyCost.toFixed(2)}`} color="emerald" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded border p-2"><span className="text-muted-foreground">Cost per m³:</span> <strong className="font-mono">${result.costPerM3.toFixed(4)}</strong></div>
              <div className="rounded border p-2" style={{ borderColor: result.color + '60', color: result.color }}>
                <span className="text-muted-foreground">Efficiency:</span> <strong>{result.rating}</strong>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">
              💡 Replace pump if η &lt; 50%. VFD (variable frequency drive) saves 20-40% energy in variable-flow systems. Check impeller wear annually.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const ACCENT: Record<string, string> = {
  cyan: 'border-cyan-200 dark:border-cyan-900 bg-cyan-50/40 dark:bg-cyan-950/20',
  emerald: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20',
  amber: 'border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20',
  indigo: 'border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20',
};
function Metric({ label, value, color }: { label: string; value: string; color: keyof typeof ACCENT }) {
  return <div className={`rounded-md border px-2 py-1.5 ${ACCENT[color]}`}><div className="text-[9px] text-muted-foreground uppercase">{label}</div><div className="font-mono text-sm font-semibold">{value}</div></div>;
}
