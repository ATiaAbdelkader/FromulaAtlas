'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Beef, Wheat, Recycle, Calendar, Plus, Trash2, CheckCircle2, AlertTriangle,
  DollarSign, Milk, PiggyBank,
} from 'lucide-react';
import {
  FEED_INGREDIENTS, computeRation, pastureCapacity, manureValue, grazingPlan, MANURE_TYPES,
  type RationLine,
} from '@/lib/livestock-data';

type Tab = 'ration' | 'pasture' | 'manure' | 'grazing';

export function LivestockIntegration() {
  const [tab, setTab] = useState<Tab>('ration');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><Beef className="h-4 w-4 text-amber-600" /> Livestock Management</CardTitle>
        <div className="flex gap-1 mt-2 flex-wrap">
          <TabBtn active={tab === 'ration'} onClick={() => setTab('ration')} icon={Wheat} label="Feed Ration" />
          <TabBtn active={tab === 'pasture'} onClick={() => setTab('pasture')} icon={Beef} label="Pasture" />
          <TabBtn active={tab === 'manure'} onClick={() => setTab('manure')} icon={Recycle} label="Manure Value" />
          <TabBtn active={tab === 'grazing'} onClick={() => setTab('grazing')} icon={Calendar} label="Grazing" />
        </div>
      </CardHeader>
      <CardContent>
        {tab === 'ration' && <FeedRationCalculator />}
        {tab === 'pasture' && <PastureCalculator />}
        {tab === 'manure' && <ManureCalculator />}
        {tab === 'grazing' && <GrazingScheduler />}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// 1. FEED RATION CALCULATOR
// ============================================================================

function FeedRationCalculator() {
  const [lines, setLines] = useState<RationLine[]>([
    { ingredientId: 'corn_silage', kgAsFed: 20 },
    { ingredientId: 'alfalfa_hay', kgAsFed: 5 },
    { ingredientId: 'corn_grain', kgAsFed: 5 },
    { ingredientId: 'soybean_meal', kgAsFed: 3 },
    { ingredientId: 'mineral_mix', kgAsFed: 0.2 },
  ]);
  const [animalType, setAnimalType] = useState<'dairy_lactating' | 'dairy_dry' | 'beef_growing' | 'beef_finishing'>('dairy_lactating');

  const result = useMemo(() => computeRation(lines, animalType), [lines, animalType]);

  const updateLine = (i: number, field: keyof RationLine, value: string | number) => {
    const newLines = [...lines];
    newLines[i] = { ...newLines[i], [field]: value };
    setLines(newLines);
  };
  const addLine = () => setLines([...lines, { ingredientId: 'corn_grain', kgAsFed: 1 }]);
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className="text-[10px] whitespace-nowrap">Animal type:</Label>
        <Select value={animalType} onValueChange={v => setAnimalType(v as typeof animalType)}>
          <SelectTrigger className="h-8 text-xs w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="dairy_lactating"><Milk className="h-3 w-3 inline mr-1" />Dairy Lactating</SelectItem>
            <SelectItem value="dairy_dry">Dairy Dry</SelectItem>
            <SelectItem value="beef_growing"><Beef className="h-3 w-3 inline mr-1" />Beef Growing</SelectItem>
            <SelectItem value="beef_finishing">Beef Finishing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ingredients */}
      <div className="space-y-1.5">
        {lines.map((line, i) => {
          const ing = FEED_INGREDIENTS.find(x => x.id === line.ingredientId);
          return (
            <div key={i} className="grid grid-cols-[1fr_80px_auto] gap-1.5 items-center">
              <Select value={line.ingredientId} onValueChange={v => updateLine(i, 'ingredientId', v)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FEED_INGREDIENTS.map(x => <SelectItem key={x.id} value={x.id}>{x.emoji} {x.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" value={line.kgAsFed} onChange={e => updateLine(i, 'kgAsFed', parseFloat(e.target.value) || 0)} step="0.5" className="h-7 text-xs" />
              <button onClick={() => removeLine(i)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-3 w-3" /></button>
            </div>
          );
        })}
        <Button size="sm" variant="outline" onClick={addLine} className="gap-1 text-xs h-7 w-full"><Plus className="h-3 w-3" /> Add Ingredient</Button>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="DM Intake" value={`${result.totalKgDM.toFixed(1)} kg`} icon={Wheat} color="#f59e0b" />
        <Stat label="NEL" value={`${result.nel_Mcal_kgDM.toFixed(2)} Mcal/kg`} icon={Milk} color={result.meetsDairy?.nel ? '#16a34a' : '#dc2626'} good={result.meetsDairy?.nel} />
        <Stat label="CP" value={`${result.cpPctDM.toFixed(1)}% DM`} icon={Beef} color={result.meetsDairy?.cp ? '#16a34a' : '#dc2626'} good={result.meetsDairy?.cp} />
        <Stat label="Cost/day" value={`$${result.costPerDay.toFixed(2)}`} icon={DollarSign} color="#0891b2" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="NDF" value={`${result.ndfPctDM.toFixed(1)}%`} icon={Wheat} color={result.meetsDairy?.ndf ? '#16a34a' : '#dc2626'} good={result.meetsDairy?.ndf} />
        <Stat label="Ca" value={`${((result.totalCa_kg / Math.max(result.totalKgDM, 1)) * 100).toFixed(2)}%`} icon={CheckCircle2} color={result.meetsDairy?.ca ? '#16a34a' : '#dc2626'} good={result.meetsDairy?.ca} />
        <Stat label="P" value={`${((result.totalP_kg / Math.max(result.totalKgDM, 1)) * 100).toFixed(2)}%`} icon={CheckCircle2} color={result.meetsDairy?.p ? '#16a34a' : '#dc2626'} good={result.meetsDairy?.p} />
      </div>

      {result.warnings.length > 0 && (
        <div className="rounded-lg p-2 border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 space-y-0.5">
          {result.warnings.map((w, i) => <div key={i} className="text-xs text-amber-700 dark:text-amber-400">{w}</div>)}
        </div>
      )}
      {result.warnings.length === 0 && (
        <div className="rounded-lg p-2 border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" /> Ration meets all NRC requirements for {animalType.replace(/_/g, ' ')}.
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 2. PASTURE CARRYING CAPACITY
// ============================================================================

function PastureCalculator() {
  const [areaHa, setAreaHa] = useState('50');
  const [forageYield, setForageYield] = useState('5000');
  const [utilization, setUtilization] = useState('50');
  const [animalWeight, setAnimalWeight] = useState('500');
  const [intakePct, setIntakePct] = useState('2.5');
  const [seasonDays, setSeasonDays] = useState('180');

  const result = useMemo(() => pastureCapacity({
    areaHa: parseFloat(areaHa) || 0,
    forageYield_kgDM_ha: parseFloat(forageYield) || 0,
    utilizationRate: parseFloat(utilization) || 50,
    animalWeight_kg: parseFloat(animalWeight) || 500,
    intakePctBW: parseFloat(intakePct) || 2.5,
    grazingSeasonDays: parseFloat(seasonDays) || 180,
  }), [areaHa, forageYield, utilization, animalWeight, intakePct, seasonDays]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          { label: 'Pasture area (ha)', val: areaHa, set: setAreaHa },
          { label: 'Forage yield (kg DM/ha)', val: forageYield, set: setForageYield },
          { label: 'Utilization rate (%)', val: utilization, set: setUtilization },
          { label: 'Animal weight (kg)', val: animalWeight, set: setAnimalWeight },
          { label: 'Intake (% BW)', val: intakePct, set: setIntakePct },
          { label: 'Grazing season (days)', val: seasonDays, set: setSeasonDays },
        ].map(f => (
          <div key={f.label}>
            <Label className="text-[10px]">{f.label}</Label>
            <Input type="number" value={f.val} onChange={e => f.set(e.target.value)} className="h-8 text-xs mt-0.5" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Carrying capacity" value={`${result.carryingCapacity} AU/ha`} icon={Beef} color="#16a34a" />
        <Stat label="Total AU" value={`${result.totalAU}`} icon={Beef} color="#0891b2" />
        <Stat label="Recommended head" value={`${result.recommendedStocking}`} icon={Beef} color="#f59e0b" />
        <Stat label="Daily forage demand" value={`${result.forageConsumed} kg DM`} icon={Wheat} color="#7c3aed" />
      </div>

      {result.warnings.map((w, i) => (
        <div key={i} className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded p-2 border border-amber-200 dark:border-amber-900">{w}</div>
      ))}
    </div>
  );
}

// ============================================================================
// 3. MANURE NUTRIENT VALUE
// ============================================================================

function ManureCalculator() {
  const [manureType, setManureType] = useState('dairy_solid');
  const [tonnes, setTonnes] = useState('500');

  const result = useMemo(() => manureValue(manureType, parseFloat(tonnes) || 0), [manureType, tonnes]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px]">Manure type</Label>
          <Select value={manureType} onValueChange={setManureType}>
            <SelectTrigger className="h-8 text-xs mt-0.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.keys(MANURE_TYPES).map(k => <SelectItem key={k} value={k} className="capitalize">{k.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px]">Annual production (tonnes)</Label>
          <Input type="number" value={tonnes} onChange={e => setTonnes(e.target.value)} className="h-8 text-xs mt-0.5" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="N value" value={`$${result.nValue}`} sub={`${result.totalN_kg} kg`} icon={DollarSign} color="#16a34a" />
        <Stat label="P value" value={`$${result.pValue}`} sub={`${result.totalP_kg} kg`} icon={DollarSign} color="#0891b2" />
        <Stat label="K value" value={`$${result.kValue}`} sub={`${result.totalK_kg} kg`} icon={DollarSign} color="#7c3aed" />
      </div>

      <div className="rounded-lg p-3 border-2 border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20">
        <div className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400 font-semibold">Total Fertilizer Value</div>
        <div className="text-2xl font-bold text-emerald-600">${result.totalValue}<span className="text-sm font-normal text-muted-foreground">/year</span></div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded p-2 bg-muted/30 border"><div className="text-[9px] text-muted-foreground">= Urea equiv.</div><div className="text-sm font-bold">{result.ureaEquivalent} kg</div></div>
        <div className="rounded p-2 bg-muted/30 border"><div className="text-[9px] text-muted-foreground">= DAP equiv.</div><div className="text-sm font-bold">{result.dapEquivalent} kg</div></div>
        <div className="rounded p-2 bg-muted/30 border"><div className="text-[9px] text-muted-foreground">= MOP equiv.</div><div className="text-sm font-bold">{result.mopEquivalent} kg</div></div>
      </div>

      {result.recommendations.map((r, i) => (
        <div key={i} className="text-xs text-muted-foreground bg-muted/20 rounded p-2">{r}</div>
      ))}
    </div>
  );
}

// ============================================================================
// 4. ROTATIONAL GRAZING SCHEDULER
// ============================================================================

function GrazingScheduler() {
  const [herdSize, setHerdSize] = useState('50');
  const [areaHa, setAreaHa] = useState('50');
  const [seasonDays, setSeasonDays] = useState('180');
  const [targetRest, setTargetRest] = useState('30');
  const [growthRate, setGrowthRate] = useState('50');
  const [animalWeight, setAnimalWeight] = useState('500');
  const [intakePct, setIntakePct] = useState('2.5');

  const result = useMemo(() => grazingPlan({
    herdSize: parseFloat(herdSize) || 0,
    areaHa: parseFloat(areaHa) || 0,
    grazingSeasonDays: parseFloat(seasonDays) || 180,
    targetRestDays: parseFloat(targetRest) || 30,
    forageGrowthRate: parseFloat(growthRate) || 50,
    animalWeight_kg: parseFloat(animalWeight) || 500,
    intakePctBW: parseFloat(intakePct) || 2.5,
  }), [herdSize, areaHa, seasonDays, targetRest, growthRate, animalWeight, intakePct]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Herd size (head)', val: herdSize, set: setHerdSize },
          { label: 'Pasture area (ha)', val: areaHa, set: setAreaHa },
          { label: 'Season (days)', val: seasonDays, set: setSeasonDays },
          { label: 'Target rest (days)', val: targetRest, set: setTargetRest },
          { label: 'Growth rate (kg DM/ha/d)', val: growthRate, set: setGrowthRate },
          { label: 'Animal weight (kg)', val: animalWeight, set: setAnimalWeight },
          { label: 'Intake (% BW)', val: intakePct, set: setIntakePct },
        ].map(f => (
          <div key={f.label}>
            <Label className="text-[10px]">{f.label}</Label>
            <Input type="number" value={f.val} onChange={e => f.set(e.target.value)} className="h-8 text-xs mt-0.5" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Paddocks" value={`${result.paddocks}`} icon={Calendar} color="#16a34a" />
        <Stat label="Graze/paddock" value={`${result.grazeDaysPerPaddock}d`} icon={Beef} color="#f59e0b" />
        <Stat label="Rest period" value={`${result.restDays}d`} icon={Recycle} color="#0891b2" />
        <Stat label="Cycles/season" value={`${result.cyclesPerSeason}`} icon={Calendar} color="#7c3aed" />
      </div>

      {result.recommendations.map((r, i) => (
        <div key={i} className="text-xs text-muted-foreground bg-muted/20 rounded p-2">{r}</div>
      ))}
    </div>
  );
}

// === Helpers ===
function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Beef; label: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${active ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300' : 'text-muted-foreground hover:bg-muted/50'}`}>
      <Icon className="h-3.5 w-3.5" /><span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function Stat({ label, value, sub, icon: Icon, color, good }: { label: string; value: string; sub?: string; icon: typeof Beef; color: string; good?: boolean }) {
  return (
    <div className="rounded-lg p-2 border bg-muted/20">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">
        <Icon className="h-2.5 w-2.5" style={{ color }} />{label}
      </div>
      <div className="text-sm font-bold mt-0.5" style={{ color }}>{value}</div>
      {sub && <div className="text-[9px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
