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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sprout className="h-4 w-4 text-emerald-600" /> Cover Crop Selector
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">12 species · 9 goals · drought tolerance · ranked recommendations</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-[10px]">Your goals (select all that apply)</Label>
          <div className="flex flex-wrap gap-1 mt-1">
            {GOALS.map(g => {
              const active = selectedGoals.includes(g.id);
              return (
                <button key={g.id} onClick={() => toggleGoal(g.id)} className={`text-[10px] px-2 py-1 rounded-md border ${active ? 'bg-emerald-600 text-white border-emerald-600' : 'border-border hover:bg-muted/50'}`}>
                  {g.icon} {g.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">Min drought tolerance (1–5): {droughtTol}</Label>
            <input type="range" min={1} max={5} value={droughtTol} onChange={e => setDroughtTol(parseInt(e.target.value))} className="w-full h-1.5 mt-1" />
          </div>
          <div>
            <Label className="text-[10px]">Annual rainfall (mm)</Label>
            <input type="number" value={precip} onChange={e => setPrecip(e.target.value)} step="50" className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase">Top recommendations</div>
          {ranked.map((r, i) => (
            <div key={r.crop.name} className="flex items-center gap-2 rounded-md border p-2" style={{ borderLeftWidth: 3, borderLeftColor: i === 0 ? '#16a34a' : '#94a3b8' }}>
              <div className="text-lg shrink-0">{r.crop.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold">{r.crop.name}</div>
                <div className="text-[9px] text-muted-foreground">
                  {r.crop.type} · {r.crop.plantingWindow} · {r.crop.biomass}t biomass · {r.crop.nFix > 0 ? `${r.crop.nFix} kg N/ha` : 'no N fix'}
                  {r.crop.winterKill && ' · winter-kills'}
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] shrink-0">{r.score.toFixed(0)} pts</Badge>
              {i === 0 && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
