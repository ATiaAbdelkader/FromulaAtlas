'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sprout, CheckCircle2, AlertTriangle } from 'lucide-react';

const CROP_SEEDS: Record<string, { name: string; emoji: string; tgw: number; germination: number; targetPop: number; rowSpacing: number }> = {
  wheat: { name: 'Wheat', emoji: '🌾', tgw: 40, germination: 90, targetPop: 400, rowSpacing: 15 },
  barley: { name: 'Barley', emoji: '🌾', tgw: 42, germination: 90, targetPop: 350, rowSpacing: 15 },
  corn: { name: 'Corn', emoji: '🌽', tgw: 300, germination: 92, targetPop: 8, rowSpacing: 75 },
  soybean: { name: 'Soybean', emoji: '🫘', tgw: 180, germination: 90, targetPop: 40, rowSpacing: 45 },
  rice: { name: 'Rice', emoji: '🍚', tgw: 25, germination: 88, targetPop: 500, rowSpacing: 20 },
  canola: { name: 'Canola', emoji: '🌼', tgw: 4, germination: 90, targetPop: 800, rowSpacing: 15 },
};

export function SeedRateCalculator() {
  const [crop, setCrop] = useState('wheat');
  const [targetPop, setTargetPop] = useState('');
  const [tgw, setTgw] = useState('');
  const [germination, setGermination] = useState('');
  const [fieldLoss, setFieldLoss] = useState('10');

  const result = useMemo(() => {
    const c = CROP_SEEDS[crop];
    const tp = parseFloat(targetPop) || c.targetPop;
    const t = parseFloat(tgw) || c.tgw;
    const g = (parseFloat(germination) || c.germination) / 100;
    const fl = parseFloat(fieldLoss) / 100;
    // Seed rate = targetPop × TGW / (germination × (1 - fieldLoss) × 100)
    const seedRate = tp * t / (g * (1 - fl) * 100); // kg/ha
    const plantSpacing = 10000 / (tp * (c.rowSpacing / 100)); // cm between plants in row
    return { seedRate, plantSpacing, effectivePop: tp * g * (1 - fl), crop: c, tp, t, g, fl };
  }, [crop, targetPop, tgw, germination, fieldLoss]);

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Sprout className="h-4 w-4 text-emerald-600" /> Seed Rate Calculator</CardTitle><p className="text-[10px] text-muted-foreground">Target population × TGW × germination × field loss → kg seed/ha</p></CardHeader>
      <CardContent className="space-y-3">
        <div><Label className="text-[10px]">Crop</Label><select value={crop} onChange={e => setCrop(e.target.value)} className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5">{Object.entries(CROP_SEEDS).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.name} (TGW:{v.tgw}g)</option>)}</select></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-[10px]">Target population (plants/m²)</Label><Input value={targetPop || result.crop.targetPop} onChange={e => setTargetPop(e.target.value)} type="number" step="5" placeholder={String(result.crop.targetPop)} className="h-8 text-xs mt-0.5" /></div>
          <div><Label className="text-[10px]">1000-grain weight (g)</Label><Input value={tgw || result.crop.tgw} onChange={e => setTgw(e.target.value)} type="number" step="1" placeholder={String(result.crop.tgw)} className="h-8 text-xs mt-0.5" /></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-[10px]">Germination (%)</Label><Input value={germination || result.crop.germination} onChange={e => setGermination(e.target.value)} type="number" step="1" placeholder={String(result.crop.germination)} className="h-8 text-xs mt-0.5" /></div>
          <div><Label className="text-[10px]">Field loss (%)</Label><Input value={fieldLoss} onChange={e => setFieldLoss(e.target.value)} type="number" step="1" className="h-8 text-xs mt-0.5" /></div>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 text-center"><div className="text-[9px] text-muted-foreground uppercase">Seed rate</div><div className="text-2xl font-bold font-mono text-emerald-700">{result.seedRate.toFixed(0)}</div><div className="text-[9px] text-muted-foreground">kg/ha</div></div>
            <div className="rounded-lg border border-cyan-200 bg-cyan-50/40 p-3 text-center"><div className="text-[9px] text-muted-foreground uppercase">Effective pop</div><div className="text-2xl font-bold font-mono text-cyan-700">{result.effectivePop.toFixed(0)}</div><div className="text-[9px] text-muted-foreground">plants/m²</div></div>
            <div className="rounded-lg border border-violet-200 bg-violet-50/40 p-3 text-center"><div className="text-[9px] text-muted-foreground uppercase">In-row spacing</div><div className="text-2xl font-bold font-mono text-violet-700">{result.plantSpacing.toFixed(1)}</div><div className="text-[9px] text-muted-foreground">cm</div></div>
          </div>
          <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">💡 Order {(result.seedRate * 1.1).toFixed(0)} kg/ha (add 10% safety for calibration error + seed size variation). Calibrate drill per seed lot — TGW varies 20% between varieties.</div>
        </div>
      </CardContent>
    </Card>
  );
}
