'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tractor, DollarSign } from 'lucide-react';

export function MachineryCostCalculator() {
  const [purchasePrice, setPurchasePrice] = useState('80000');
  const [salvageValue, setSalvageValue] = useState('20000');
  const [usefulLife, setUsefulLife] = useState('10');
  const [annualHours, setAnnualHours] = useState('400');
  const [fuelPrice, setFuelPrice] = useState('1.20');
  const [fuelRate, setFuelRate] = useState('20');
  const [workRate, setWorkRate] = useState('1.5');
  const [interestRate, setInterestRate] = useState('6');

  const result = useMemo(() => {
    const P = parseFloat(purchasePrice), S = parseFloat(salvageValue), L = parseFloat(usefulLife);
    const AH = parseFloat(annualHours), FP = parseFloat(fuelPrice), FR = parseFloat(fuelRate);
    const WR = parseFloat(workRate), IR = parseFloat(interestRate) / 100;
    if (!Number.isFinite(P) || !Number.isFinite(L) || L <= 0) return null;
    // Fixed costs
    const depreciation = (P - S) / L;
    const interest = (P + S) / 2 * IR;
    const insurance = P * 0.01;
    const housing = P * 0.005;
    const totalFixed = depreciation + interest + insurance + housing;
    const fixedPerHour = totalFixed / AH;
    const fixedPerHa = fixedPerHour / WR;
    // Variable costs
    const fuelPerHour = FR * FP;
    const repairPerHour = P * 0.03 / AH; // ~3% of purchase per year
    const laborPerHour = 15;
    const totalVariable = fuelPerHour + repairPerHour + laborPerHour;
    const variablePerHa = totalVariable / WR;
    const totalPerHa = fixedPerHa + variablePerHa;
    const totalPerHour = fixedPerHour + totalVariable;
    return { depreciation, interest, totalFixed, fixedPerHa, fixedPerHour, fuelPerHour, totalVariable, variablePerHa, totalPerHa, totalPerHour };
  }, [purchasePrice, salvageValue, usefulLife, annualHours, fuelPrice, fuelRate, workRate, interestRate]);

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Tractor className="h-4 w-4 text-amber-600" /> Machinery Cost Calculator</CardTitle><p className="text-[10px] text-muted-foreground">Ownership + operating cost → $/ha + $/hr · buy vs custom hire</p></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div><Label className="text-[10px]">Purchase price ($)</Label><Input value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} type="number" step="1000" className="h-8 text-xs mt-0.5" /></div>
          <div><Label className="text-[10px]">Salvage value ($)</Label><Input value={salvageValue} onChange={e => setSalvageValue(e.target.value)} type="number" step="1000" className="h-8 text-xs mt-0.5" /></div>
          <div><Label className="text-[10px]">Useful life (yr)</Label><Input value={usefulLife} onChange={e => setUsefulLife(e.target.value)} type="number" step="1" className="h-8 text-xs mt-0.5" /></div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div><Label className="text-[10px]">Annual hours</Label><Input value={annualHours} onChange={e => setAnnualHours(e.target.value)} type="number" step="10" className="h-8 text-xs mt-0.5" /></div>
          <div><Label className="text-[10px]">Fuel ($/L)</Label><Input value={fuelPrice} onChange={e => setFuelPrice(e.target.value)} type="number" step="0.1" className="h-8 text-xs mt-0.5" /></div>
          <div><Label className="text-[10px]">Fuel (L/hr)</Label><Input value={fuelRate} onChange={e => setFuelRate(e.target.value)} type="number" step="1" className="h-8 text-xs mt-0.5" /></div>
          <div><Label className="text-[10px]">Work (ha/hr)</Label><Input value={workRate} onChange={e => setWorkRate(e.target.value)} type="number" step="0.1" className="h-8 text-xs mt-0.5" /></div>
        </div>
        {result && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3 text-center"><div className="text-[9px] text-muted-foreground uppercase">Cost per hectare</div><div className="text-2xl font-bold font-mono text-indigo-700">${result.totalPerHa.toFixed(0)}</div></div>
              <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 text-center"><div className="text-[9px] text-muted-foreground uppercase">Cost per hour</div><div className="text-2xl font-bold font-mono text-amber-700">${result.totalPerHour.toFixed(0)}</div></div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded border p-2"><span className="text-muted-foreground">Fixed ($/ha):</span> <strong className="font-mono">${result.fixedPerHa.toFixed(0)}</strong> (depreciation + interest + insurance)</div>
              <div className="rounded border p-2"><span className="text-muted-foreground">Variable ($/ha):</span> <strong className="font-mono">${result.variablePerHa.toFixed(0)}</strong> (fuel + repair + labor)</div>
            </div>
            <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">💡 If custom hire &lt; ${result.totalPerHa.toFixed(0)}/ha, custom hire is cheaper. Minimum 200 hr/yr use to justify ownership. No-till cuts fuel 60-70%.</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
