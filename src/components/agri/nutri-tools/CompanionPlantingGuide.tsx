'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sprout, Search } from 'lucide-react';

const COMPANIONS: { crop: string; emoji: string; helps: string[]; helpedBy: string[]; avoid: string[] }[] = [
  { crop: 'Tomato', emoji: '🍅', helps: ['Basil', 'Asparagus', 'Carrot', 'Parsley'], helpedBy: ['Basil', 'Marigold', 'Nasturtium', 'Garlic', 'Onion'], avoid: ['Cabbage', 'Broccoli', 'Fennel', 'Corn'] },
  { crop: 'Basil', emoji: '🌿', helps: ['Tomato', 'Pepper'], helpedBy: ['Tomato'], avoid: ['Sage'] },
  { crop: 'Carrot', emoji: '🥕', helps: ['Tomato', 'Lettuce', 'Onion', 'Rosemary'], helpedBy: ['Onion', 'Rosemary', 'Sage', 'Leek'], avoid: ['Dill', 'Parsnip'] },
  { crop: 'Lettuce', emoji: '🥬', helps: ['Carrot', 'Radish', 'Strawberry'], helpedBy: ['Carrot', 'Radish', 'Cucumber', 'Strawberry'], avoid: ['Broccoli', 'Cabbage'] },
  { crop: 'Cucumber', emoji: '🥒', helps: ['Beans', 'Corn', 'Radish', 'Sunflower'], helpedBy: ['Beans', 'Corn', 'Peas', 'Radish', 'Sunflower'], avoid: ['Sage', 'Potato', 'Aromatic herbs'] },
  { crop: 'Beans', emoji: '🫘', helps: ['Corn', 'Cucumber', 'Squash', 'Strawberry'], helpedBy: ['Corn', 'Cucumber', 'Squash', 'Carrot', 'Strawberry'], avoid: ['Onion', 'Garlic', 'Pepper'] },
  { crop: 'Corn', emoji: '🌽', helps: ['Beans', 'Cucumber', 'Squash', 'Pumpkin'], helpedBy: ['Beans', 'Cucumber', 'Squash', 'Sunflower'], avoid: ['Tomato'] },
  { crop: 'Potato', emoji: '🥔', helps: ['Beans', 'Corn', 'Cabbage'], helpedBy: ['Beans', 'Corn', 'Horseradish', 'Marigold'], avoid: ['Tomato', 'Cucumber', 'Squash', 'Sunflower'] },
  { crop: 'Pepper', emoji: '🫑', helps: ['Basil', 'Onion', 'Carrot'], helpedBy: ['Basil', 'Onion', 'Carrot'], avoid: ['Beans', 'Cabbage'] },
  { crop: 'Squash', emoji: '🎃', helps: ['Beans', 'Corn', 'Radish'], helpedBy: ['Beans', 'Corn', 'Nasturtium', 'Marigold'], avoid: ['Potato'] },
  { crop: 'Onion', emoji: '🧅', helps: ['Carrot', 'Tomato', 'Pepper', 'Lettuce'], helpedBy: ['Carrot', 'Tomato', 'Pepper', 'Chamomile'], avoid: ['Beans', 'Peas', 'Asparagus'] },
  { crop: 'Garlic', emoji: '🧄', helps: ['Tomato', 'Roses', 'Fruit trees', 'Strawberry'], helpedBy: ['Tomato', 'Carrot'], avoid: ['Beans', 'Peas'] },
  { crop: 'Strawberry', emoji: '🍓', helps: ['Borage', 'Lettuce', 'Spinach'], helpedBy: ['Beans', 'Onion', 'Garlic', 'Spinach', 'Thyme'], avoid: ['Cabbage', 'Broccoli'] },
  { crop: 'Marigold', emoji: '🌼', helps: ['Tomato', 'Potato', 'Beans', 'Squash', 'Cucumber'], helpedBy: [], avoid: [] },
  { crop: 'Radish', emoji: '🟠', helps: ['Cucumber', 'Lettuce', 'Squash'], helpedBy: ['Cucumber', 'Lettuce', 'Nasturtium'], avoid: ['Hyssop'] },
  { crop: 'Cabbage', emoji: '🥬', helps: ['Beans', 'Cucumber'], helpedBy: ['Dill', 'Onion', 'Garlic', 'Mint', 'Thyme', 'Sage'], avoid: ['Tomato', 'Pepper', 'Strawberry', 'Broccoli'] },
  { crop: 'Spinach', emoji: '🥗', helps: ['Strawberry', 'Beans', 'Peas'], helpedBy: ['Strawberry', 'Radish', 'Cabbage'], avoid: [] },
  { crop: 'Peas', emoji: '🫛', helps: ['Beans', 'Corn', 'Cucumber', 'Carrot'], helpedBy: ['Carrot', 'Turnip', 'Radish'], avoid: ['Onion', 'Garlic'] },
  { crop: 'Broccoli', emoji: '🥦', helps: ['Beans', 'Onion', 'Potato'], helpedBy: ['Dill', 'Garlic', 'Onion', 'Mint', 'Rosemary', 'Potato'], avoid: ['Tomato', 'Strawberry', 'Cabbage'] },
  { crop: 'Pumpkin', emoji: '🎃', helps: ['Corn', 'Beans'], helpedBy: ['Corn', 'Beans', 'Marigold', 'Nasturtium'], avoid: ['Potato'] },
];

export function CompanionPlantingGuide() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return COMPANIONS;
    const q = search.toLowerCase();
    return COMPANIONS.filter(c => c.crop.toLowerCase().includes(q) || c.helps.some(h => h.toLowerCase().includes(q)) || c.helpedBy.some(h => h.toLowerCase().includes(q)) || c.avoid.some(a => a.toLowerCase().includes(q)));
  }, [search]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sprout className="h-4 w-4 text-emerald-600" /> Companion Planting Guide
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">20 crops · 100+ pairings · synergy (✓) · antagonism (✗) · search any crop</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search crop or companion…" className="pl-8 text-xs h-8" />
        </div>
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {filtered.map(c => (
            <div key={c.crop} className="rounded-md border p-2.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg">{c.emoji}</span>
                <span className="text-sm font-semibold">{c.crop}</span>
              </div>
              {c.helps.length > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] mb-1">
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[9px] border-0">Helps ✓</Badge>
                  <span className="text-muted-foreground">{c.helps.join(', ')}</span>
                </div>
              )}
              {c.helpedBy.length > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] mb-1">
                  <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 text-[9px] border-0">Helped by ↑</Badge>
                  <span className="text-muted-foreground">{c.helpedBy.join(', ')}</span>
                </div>
              )}
              {c.avoid.length > 0 && (
                <div className="flex items-center gap-1.5 text-[10px]">
                  <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-[9px] border-0">Avoid ✗</Badge>
                  <span className="text-muted-foreground">{c.avoid.join(', ')}</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">
          💡 Companion planting uses plant synergies (pest repulsion, N fixation, pollinator attraction) + avoids antagonisms (allelopathy, shared pests, nutrient competition).
        </div>
      </CardContent>
    </Card>
  );
}
