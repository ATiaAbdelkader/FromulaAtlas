'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sprout, CheckCircle2 } from 'lucide-react';

interface CoverCrop {
  name: string; emoji: string; type: 'grass' | 'legume' | 'brassica' | 'mix';
  nFix: number; biomass: number; winterKill: boolean; droughtTol: number; minPrecip: number;
  plantingWindow: string; goals: string[];
}

const COVER_CROPS: CoverCrop[] = [
  { name: 'Cereal Rye', emoji: '🌾', type: 'grass', nFix: 0, biomass: 5, winterKill: false, droughtTol: 5, minPrecip: 250, plantingWindow: 'Sep–Nov', goals: ['erosion', 'biomass', 'weed', 'scavenge'] },
  { name: 'Oats', emoji: '🌾', type: 'grass', nFix: 0, biomass: 4, winterKill: true, droughtTol: 3, minPrecip: 300, plantingWindow: 'Aug–Oct', goals: ['biomass', 'weed', 'scavenge'] },
  { name: 'Winter Wheat', emoji: '🌾', type: 'grass', nFix: 0, biomass: 4, winterKill: false, droughtTol: 4, minPrecip: 300, plantingWindow: 'Oct–Nov', goals: ['erosion', 'biomass', 'weed'] },
  { name: 'Crimson Clover', emoji: '🌸', type: 'legume', nFix: 100, biomass: 3, winterKill: false, droughtTol: 3, minPrecip: 400, plantingWindow: 'Sep–Oct', goals: ['nitrogen', 'biomass', 'pollinator'] },
  { name: 'Vetch (Hairy)', emoji: '🌸', type: 'legume', nFix: 150, biomass: 4, winterKill: false, droughtTol: 3, minPrecip: 350, plantingWindow: 'Aug–Oct', goals: ['nitrogen', 'biomass', 'weed'] },
  { name: 'Peas (Winter)', emoji: '🫛', type: 'legume', nFix: 80, biomass: 3, winterKill: true, droughtTol: 2, minPrecip: 350, plantingWindow: 'Sep–Oct', goals: ['nitrogen', 'biomass'] },
  { name: 'Tillage Radish', emoji: '🥬', type: 'brassica', nFix: 0, biomass: 4, winterKill: true, droughtTol: 3, minPrecip: 350, plantingWindow: 'Aug–Sep', goals: ['compaction', 'scavenge', 'weed'] },
  { name: 'Mustard', emoji: '🥬', type: 'brassica', nFix: 0, biomass: 3, winterKill: true, droughtTol: 3, minPrecip: 300, plantingWindow: 'Aug–Sep', goals: ['biofumigation', 'weed', 'scavenge'] },
  { name: 'Sorghum-Sudan', emoji: '🌾', type: 'grass', nFix: 0, biomass: 6, winterKill: true, droughtTol: 5, minPrecip: 200, plantingWindow: 'Jun–Aug', goals: ['biomass', 'weed', 'compaction'] },
  { name: 'Buckwheat', emoji: '🌸', type: 'grass', nFix: 0, biomass: 3, winterKill: true, droughtTol: 3, minPrecip: 250, plantingWindow: 'May–Aug', goals: ['weed', 'pollinator', 'phosphorus'] },
  { name: 'Berseem Clover', emoji: '🌸', type: 'legume', nFix: 120, biomass: 4, winterKill: true, droughtTol: 3, minPrecip: 400, plantingWindow: 'Mar–May', goals: ['nitrogen', 'biomass', 'pollinator'] },
  { name: 'Phacelia', emoji: '🌸', type: 'grass', nFix: 0, biomass: 4, winterKill: true, droughtTol: 3, minPrecip: 300, plantingWindow: 'Apr–Aug', goals: ['biomass', 'pollinator', 'weed'] },
];

const GOALS = [
  { id: 'nitrogen', label: 'N fixation', icon: '🟢' },
  { id: 'erosion', label: 'Erosion control', icon: '🏔️' },
  { id: 'weed', label: 'Weed suppression', icon: '🌿' },
  { id: 'biomass', label: 'Biomass / OM', icon: '📦' },
  { id: 'compaction', label: 'Break compaction', icon: '⛏️' },
  { id: 'scavenge', label: 'N scavenging', icon: '🔬' },
  { id: 'pollinator', label: 'Pollinator habitat', icon: '🐝' },
  { id: 'biofumigation', label: 'Biofumigation', icon: '💨' },
  { id: 'phosphorus', label: 'P solubilize', icon: '🟡' },
];

export function CoverCropSelector() {
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['nitrogen', 'biomass']);
  const [droughtTol, setDroughtTol] = useState(3);
  const [precip, setPrecip] = useState('400');

  const ranked = useMemo(() => {
    const p = parseFloat(precip);
    return COVER_CROPS
      .filter(c => c.minPrecip <= p + 50)  // tolerate 50mm below minimum
      .map(c => {
        let score = 0;
        for (const g of selectedGoals) if (c.goals.includes(g)) score += 10;
        score += c.droughtTol >= droughtTol ? 5 : -5;
        score += c.nFix > 0 && selectedGoals.includes('nitrogen') ? c.nFix / 20 : 0;
        score += c.biomass * 2;
        return { crop: c, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [selectedGoals, droughtTol, precip]);

  const toggleGoal = (id: string) => setSelectedGoals(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);

  return (
    <Card className="overflow-hidden border-lime-100 shadow-sm dark:border-lime-900/60">
      <CardHeader className="border-b border-border/60 bg-lime-50/50 pb-4 dark:bg-lime-950/10">
        <CardTitle className="flex items-center gap-2 text-base"><span className="rounded-lg bg-lime-100 p-2 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300"><Sprout className="h-4 w-4" /></span> Cover Crop Selector
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">12 species · 9 goals · drought tolerance · ranked recommendations</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-xl border border-lime-200/70 bg-lime-50/30 p-3 dark:border-lime-900/60 dark:bg-lime-950/10">
          <div className="flex items-end justify-between gap-2"><div><Label className="text-xs font-semibold">Your goals</Label><p className="mt-0.5 text-xs text-muted-foreground">Select every outcome you want this cover crop to support.</p></div><Badge variant="secondary" className="text-[10px]">{selectedGoals.length} selected</Badge></div>
          <div className="mt-3 flex flex-wrap gap-2">
            {GOALS.map(g => {
              const active = selectedGoals.includes(g.id);
              return (
                <button type="button" key={g.id} aria-pressed={active} onClick={() => toggleGoal(g.id)} className={`min-h-10 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${active ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm' : 'border-border bg-background hover:bg-muted/50'}`}>
                  {g.icon} {g.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 sm:grid-cols-2">
          <div><div className="flex items-center justify-between gap-2"><Label className="text-xs font-medium">Minimum drought tolerance</Label><Badge variant="outline" className="text-[10px]">{droughtTol} / 5</Badge></div><input aria-label="Minimum drought tolerance" type="range" min={1} max={5} value={droughtTol} onChange={e => setDroughtTol(parseInt(e.target.value))} className="mt-3 h-2 w-full accent-emerald-600" /></div>
          <div><Label className="text-xs font-medium">Annual rainfall (mm)</Label><input aria-label="Annual rainfall in millimeters" type="number" value={precip} onChange={e => setPrecip(e.target.value)} step="50" className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" /></div>
        </div>

        <div className="space-y-2">
          <div><p className="text-sm font-semibold">Top recommendations</p><p className="text-xs text-muted-foreground">Ranked for your goals, drought threshold, and rainfall.</p></div>
          {ranked.map((r, i) => (
            <div key={r.crop.name} className="flex items-center gap-3 rounded-xl border bg-background/70 p-3 shadow-sm" style={{ borderLeftWidth: 3, borderLeftColor: i === 0 ? '#16a34a' : '#94a3b8' }}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-100 text-xl dark:bg-lime-900/30">{r.crop.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{r.crop.name}</div>
                <div className="text-xs leading-relaxed text-muted-foreground">
                  {r.crop.type} · {r.crop.plantingWindow} · {r.crop.biomass}t biomass · {r.crop.nFix > 0 ? `${r.crop.nFix} kg N/ha` : 'no N fix'}
                  {r.crop.winterKill && ' · winter-kills'}
                </div>
              </div>
              <Badge variant="outline" className="shrink-0 text-[10px]">{r.score.toFixed(0)} pts</Badge>
              {i === 0 && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
