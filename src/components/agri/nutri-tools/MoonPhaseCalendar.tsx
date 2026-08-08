'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Moon, Sun, Sprout } from 'lucide-react';

// Simplified moon phase calc — 29.53 day synodic period
function getMoonPhase(date: Date): { phase: number; name: string; emoji: string; planting: string } {
  const knownNewMoon = new Date('2024-01-11T11:57:00Z');
  const cycle = 29.530588;
  const days = (date.getTime() - knownNewMoon.getTime()) / 86400000;
  const phase = ((days % cycle) + cycle) % cycle;
  const pct = phase / cycle;
  if (pct < 0.03 || pct > 0.97) return { phase: pct, name: 'New Moon', emoji: '🌑', planting: 'Rest period. Good for weeding + compost prep.' };
  if (pct < 0.22) return { phase: pct, name: 'Waxing Crescent', emoji: '🌒', planting: 'Plant above-ground crops (leaves, fruits, flowers).' };
  if (pct < 0.28) return { phase: pct, name: 'First Quarter', emoji: '🌓', planting: 'Best for transplanting + grafting. Plant above-ground crops.' };
  if (pct < 0.47) return { phase: pct, name: 'Waxing Gibbous', emoji: '🌔', planting: 'Good for above-ground crops. Avoid root vegetables.' };
  if (pct < 0.53) return { phase: pct, name: 'Full Moon', emoji: '🌕', planting: 'Peak energy. Harvest above-ground crops. Avoid planting.' };
  if (pct < 0.72) return { phase: pct, name: 'Waning Gibbous', emoji: '🌖', planting: 'Plant below-ground crops (roots, bulbs, tubers).' };
  if (pct < 0.78) return { phase: pct, name: 'Last Quarter', emoji: '🌗', planting: 'Best for root crops. Prune + weed. Avoid sowing.' };
  return { phase: pct, name: 'Waning Crescent', emoji: '🌘', planting: 'Rest period. Good for soil prep + compost + weeding.' };
}

export function MoonPhaseCalendar() {
  const [offset, setOffset] = useState(0);
  const today = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + offset); return d; }, [offset]);
  const moon = useMemo(() => getMoonPhase(today), [today]);
  const next30 = useMemo(() => {
    const days: { date: Date; moon: ReturnType<typeof getMoonPhase> }[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      days.push({ date: d, moon: getMoonPhase(d) });
    }
    return days;
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Moon className="h-4 w-4 text-indigo-600" /> Moon Phase Planting Calendar</CardTitle><p className="text-[10px] text-muted-foreground">Biodynamic planting guide · 29.5-day lunar cycle · 30-day forecast</p></CardHeader>
      <CardContent className="space-y-3">
        {/* Today's moon */}
        <div className="rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 p-4 text-center">
          <div className="text-5xl mb-2">{moon.emoji}</div>
          <div className="text-sm font-bold">{moon.name}</div>
          <div className="text-[10px] text-muted-foreground">{today.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</div>
          <div className="text-xs text-foreground/80 mt-2">{moon.planting}</div>
        </div>

        {/* 30-day strip */}
        <div>
          <Label className="text-[10px] mb-1.5 block">Next 30 days</Label>
          <div className="grid grid-cols-10 gap-0.5">
            {next30.map((d, i) => (
              <button key={i} onClick={() => setOffset(i)} className={`flex flex-col items-center p-1 rounded text-[8px] transition-colors ${offset === i ? 'bg-indigo-600 text-white' : 'hover:bg-muted/50'}`} title={`${d.date.toLocaleDateString()} — ${d.moon.name}: ${d.moon.planting}`}>
                <span className="text-sm">{d.moon.emoji}</span>
                <span className="text-[7px]">{d.date.getDate()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
          <div className="flex items-center gap-1.5"><span className="text-sm">🌒🌓🌔</span> <span className="text-muted-foreground">Waxing → above-ground crops</span></div>
          <div className="flex items-center gap-1.5"><span className="text-sm">🌖🌗🌘</span> <span className="text-muted-foreground">Waning → root crops</span></div>
        </div>
        <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2">💡 Biodynamic planting uses lunar cycles: waxing moon for above-ground (leaves, fruits), waning for below-ground (roots, tubers). Scientific evidence is mixed, but practiced for millennia.</div>
      </CardContent>
    </Card>
  );
}
