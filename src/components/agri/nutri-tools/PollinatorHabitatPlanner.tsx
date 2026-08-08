'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bug, Sprout, CheckCircle2 } from 'lucide-react';

const SPECIES: { name: string; emoji: string; type: string; bloom: string; height: string; pollinators: string[]; goals: string[] }[] = [
  { name: 'Crimson Clover', emoji: '🌸', type: 'legume', bloom: 'Spring', height: '30-60 cm', pollinators: ['bees', 'bumblebees'], goals: ['pollinator', 'nitrogen', 'erosion'] },
  { name: 'Buckwheat', emoji: '🌼', type: 'grass', bloom: 'Summer', height: '30-80 cm', pollinators: ['bees', 'hoverflies', 'wasps'], goals: ['pollinator', 'weed', 'phosphorus'] },
  { name: 'Phacelia', emoji: '💜', type: 'grass', bloom: 'Summer', height: '20-60 cm', pollinators: ['bees', 'hoverflies', 'lacewings'], goals: ['pollinator', 'biomass'] },
  { name: 'Sunflower', emoji: '🌻', type: 'grass', bloom: 'Late summer', height: '1-3 m', pollinators: ['bees', 'bumblebees', 'birds'], goals: ['pollinator', 'biomass', 'windbreak'] },
  { name: 'Vetch (Hairy)', emoji: '🌸', type: 'legume', bloom: 'Spring', height: '30-100 cm', pollinators: ['bees', 'bumblebees'], goals: ['nitrogen', 'pollinator', 'erosion'] },
  { name: 'Mustard', emoji: '🟡', type: 'brassica', bloom: 'Spring/Fall', height: '30-80 cm', pollinators: ['bees', 'hoverflies'], goals: ['biofumigation', 'pollinator'] },
  { name: 'Borage', emoji: '💙', type: 'herb', bloom: 'Summer', height: '30-60 cm', pollinators: ['bees', 'hoverflies'], goals: ['pollinator', 'companion'] },
  { name: 'Lavender', emoji: '🟣', type: 'herb', bloom: 'Summer', height: '30-80 cm', pollinators: ['bees', 'butterflies'], goals: ['pollinator', 'windbreak'] },
  { name: 'Wildflower Mix', emoji: '🌺', type: 'mix', bloom: 'Spring-Fall', height: 'varies', pollinators: ['bees', 'butterflies', 'hoverflies'], goals: ['pollinator', 'biodiversity'] },
  { name: 'Alfalfa', emoji: '🌿', type: 'legume', bloom: 'Summer', height: '30-90 cm', pollinators: ['bees', 'leafcutter bees'], goals: ['nitrogen', 'pollinator', 'forage'] },
];

export function PollinatorHabitatPlanner() {
  const [season, setSeason] = useState('all');
  const [goal, setGoal] = useState('pollinator');

  const filtered = useMemo(() => SPECIES.filter(s => (season === 'all' || s.bloom.includes(season)) && s.goals.includes(goal)).sort((a, b) => b.pollinators.length - a.pollinators.length), [season, goal]);

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Bug className="h-4 w-4 text-amber-600" /> 🐝 Pollinator Habitat Planner</CardTitle><p className="text-[10px] text-muted-foreground">10 species · bloom season + pollinator type + goal filtering</p></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-[10px]">Bloom season</Label><select value={season} onChange={e => setSeason(e.target.value)} className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5"><option value="all">All seasons</option><option value="Spring">Spring</option><option value="Summer">Summer</option><option value="Late">Late summer</option><option value="Fall">Fall</option></select></div>
          <div><Label className="text-[10px]">Primary goal</Label><select value={goal} onChange={e => setGoal(e.target.value)} className="h-8 text-xs w-full rounded-md border border-input bg-background px-2 mt-0.5"><option value="pollinator">Pollinator habitat 🐝</option><option value="nitrogen">N fixation 🟢</option><option value="erosion">Erosion control 🏔️</option><option value="biofumigation">Biofumigation 💨</option><option value="biodiversity">Biodiversity 🌺</option></select></div>
        </div>
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase">Recommended species ({filtered.length})</div>
          {filtered.map(s => (
            <div key={s.name} className="flex items-center gap-2 rounded-md border p-2">
              <div className="text-lg shrink-0">{s.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold">{s.name}</div>
                <div className="text-[9px] text-muted-foreground">{s.type} · {s.bloom} · {s.height}</div>
              </div>
              <div className="flex flex-wrap gap-0.5 shrink-0">
                {s.pollinators.map(p => <Badge key={p} variant="outline" className="text-[8px]">{p}</Badge>)}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 p-2 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>Plant 3-5 species for continuous bloom spring through fall. Minimum 0.5 ha for meaningful pollinator impact. Avoid neonicotinoid-treated seed within 500m.</span>
        </div>
        <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">💡 Pollinator habitat increases crop yield 5-20% in insect-pollinated crops (almonds, apples, berries, canola). EQIP cost-share available for pollinator plantings.</div>
      </CardContent>
    </Card>
  );
}
