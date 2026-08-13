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
    <Card className="overflow-hidden border-indigo-200/60 shadow-sm dark:border-indigo-900/60">
      <CardHeader className="border-b bg-gradient-to-r from-indigo-50 via-background to-violet-50/50 pb-4 dark:from-indigo-950/30 dark:via-background dark:to-violet-950/20">
        <CardTitle className="flex items-center gap-2 text-base"><Moon className="h-4 w-4 text-indigo-600" /> Moon Phase Planting Calendar</CardTitle>
        <p className="text-xs leading-relaxed text-muted-foreground">Biodynamic planting guide · 29.5-day lunar cycle · 30-day forecast</p>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        {/* Today's moon */}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 text-center shadow-sm dark:border-indigo-900 dark:bg-indigo-950/20">
          <div className="mb-2 text-6xl" aria-hidden="true">{moon.emoji}</div>
          <div className="text-base font-bold">{moon.name}</div>
          <div className="text-[10px] text-muted-foreground">{today.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</div>
          <div className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-foreground/80">{moon.planting}</div>
        </div>

        {/* 30-day strip */}
        <div className="rounded-xl border bg-muted/20 p-3">
          <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><CalendarRangeIcon /> Next 30 days</Label>
          <div className="grid grid-cols-5 gap-1 sm:grid-cols-10">
            {next30.map((d, i) => (
              <button key={i} onClick={() => setOffset(i)} aria-label={`${d.date.toLocaleDateString()} — ${d.moon.name}`} aria-pressed={offset === i} className={`flex min-h-11 flex-col items-center justify-center rounded-md p-1 text-[9px] transition-colors ${offset === i ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-indigo-100/70 dark:hover:bg-indigo-950/40'}`} title={`${d.date.toLocaleDateString()} — ${d.moon.name}: ${d.moon.planting}`}>
                <span className="text-base" aria-hidden="true">{d.moon.emoji}</span>
                <span className="font-mono text-[9px]">{d.date.getDate()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 gap-2 rounded-xl border bg-background p-3 text-xs sm:grid-cols-2">
          <div className="flex items-center gap-1.5"><span className="text-sm">🌒🌓🌔</span> <span className="text-muted-foreground">Waxing → above-ground crops</span></div>
          <div className="flex items-center gap-1.5"><span className="text-sm">🌖🌗🌘</span> <span className="text-muted-foreground">Waning → root crops</span></div>
        </div>
        <div className="rounded-xl border bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">💡 Biodynamic planting uses lunar cycles: waxing moon for above-ground (leaves, fruits), waning for below-ground (roots, tubers). Scientific evidence is mixed, but practiced for millennia.</div>
      </CardContent>
    </Card>
  );
}

function CalendarRangeIcon() {
  return <span aria-hidden="true" className="inline-flex h-3.5 w-3.5 items-center justify-center rounded border border-indigo-400/60 text-[8px]">30</span>;
}
