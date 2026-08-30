'use client';

import { useState, useMemo } from 'react';
import { Moon, RotateCcw } from 'lucide-react';
import {
  CalculatorShell,
} from '@/components/agri/nutri-tools/CalculatorShell';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';

// Simplified moon phase calc — 29.53 day synodic period
const MOON_PHASE_AR: Record<string, string> = {
  'New Moon': 'المحاق',
  'Waxing Crescent': 'هلال متزايد',
  'First Quarter': 'التربيع الأول',
  'Waxing Gibbous': 'أحدب متزايد',
  'Full Moon': 'البدر',
  'Waning Gibbous': 'أحدب متناقص',
  'Last Quarter': 'التربيع الأخير',
  'Waning Crescent': 'هلال متناقص',
};
const MOON_PHASE_FR: Record<string, string> = {
  'New Moon': 'Nouvelle lune',
  'Waxing Crescent': 'Premier croissant',
  'First Quarter': 'Premier quartier',
  'Waxing Gibbous': 'Gibbeuse croissante',
  'Full Moon': 'Pleine lune',
  'Waning Gibbous': 'Gibbeuse décroissante',
  'Last Quarter': 'Dernier quartier',
  'Waning Crescent': 'Dernier croissant',
};
const PLANTING_AR: Record<string, string> = {
  'Rest period. Good for weeding + compost prep.':
    'فترة راحة. مناسبة لإزالة الأعشاب وتحضير السماد العضوي.',
  'Plant above-ground crops (leaves, fruits, flowers).':
    'ازرع المحاصيل فوق سطح الأرض (الأوراق والثمار والأزهار).',
  'Best for transplanting + grafting. Plant above-ground crops.':
    'مناسبة للشتل والتطعيم. ازرع المحاصيل فوق سطح الأرض.',
  'Good for above-ground crops. Avoid root vegetables.':
    'مناسبة للمحاصيل فوق سطح الأرض. تجنّب الخضروات الجذرية.',
  'Peak energy. Harvest above-ground crops. Avoid planting.':
    'ذروة الطاقة. احصد المحاصيل فوق سطح الأرض. تجنّب الزراعة.',
  'Plant below-ground crops (roots, bulbs, tubers).':
    'ازرع المحاصيل تحت سطح الأرض (الجذور والبصيلات والدرنات).',
  'Best for root crops. Prune + weed. Avoid sowing.':
    'مناسبة للمحاصيل الجذرية. قلّم وأزل الأعشاب. تجنّب البذر.',
  'Rest period. Good for soil prep + compost + weeding.':
    'فترة راحة. مناسبة لتحضير التربة والسماد العضوي وإزالة الأعشاب.',
};
const PLANTING_FR: Record<string, string> = {
  'Rest period. Good for weeding + compost prep.':
    'Repos. Idéal pour désherbage + préparation du compost.',
  'Plant above-ground crops (leaves, fruits, flowers).':
    'Semez cultures aériennes (feuilles, fruits, fleurs).',
  'Best for transplanting + grafting. Plant above-ground crops.':
    'Idéal pour repiquage + greffage. Cultures aériennes.',
  'Good for above-ground crops. Avoid root vegetables.':
    'Bon pour cultures aériennes. Évitez racines/tubercules.',
  'Peak energy. Harvest above-ground crops. Avoid planting.':
    'Énergie maximale. Récoltez cultures aériennes. Évitez semis.',
  'Plant below-ground crops (roots, bulbs, tubers).':
    'Semez cultures souterraines (racines, bulbes, tubercules).',
  'Best for root crops. Prune + weed. Avoid sowing.':
    'Idéal pour cultures racines. Taillez + désherbez. Évitez semis.',
  'Rest period. Good for soil prep + compost + weeding.':
    'Repos. Préparez sol + compost + désherbage.',
};

function phaseLabel(
  language: Parameters<typeof copyFor>[0],
  name: string,
): string {
  return copyFor(language, name, MOON_PHASE_AR[name] || name, MOON_PHASE_FR[name] || name);
}
function plantingLabel(
  language: Parameters<typeof copyFor>[0],
  text: string,
): string {
  return copyFor(language, text, PLANTING_AR[text] || text, PLANTING_FR[text] || text);
}

function getMoonPhase(date: Date): {
  phase: number;
  name: string;
  emoji: string;
  planting: string;
} {
  const knownNewMoon = new Date('2024-01-11T11:57:00Z');
  const cycle = 29.530588;
  const days = (date.getTime() - knownNewMoon.getTime()) / 86400000;
  const phase = ((days % cycle) + cycle) % cycle;
  const pct = phase / cycle;
  if (pct < 0.03 || pct > 0.97)
    return {
      phase: pct,
      name: 'New Moon',
      emoji: '🌑',
      planting: 'Rest period. Good for weeding + compost prep.',
    };
  if (pct < 0.22)
    return {
      phase: pct,
      name: 'Waxing Crescent',
      emoji: '🌒',
      planting: 'Plant above-ground crops (leaves, fruits, flowers).',
    };
  if (pct < 0.28)
    return {
      phase: pct,
      name: 'First Quarter',
      emoji: '🌓',
      planting: 'Best for transplanting + grafting. Plant above-ground crops.',
    };
  if (pct < 0.47)
    return {
      phase: pct,
      name: 'Waxing Gibbous',
      emoji: '🌔',
      planting: 'Good for above-ground crops. Avoid root vegetables.',
    };
  if (pct < 0.53)
    return {
      phase: pct,
      name: 'Full Moon',
      emoji: '🌕',
      planting: 'Peak energy. Harvest above-ground crops. Avoid planting.',
    };
  if (pct < 0.72)
    return {
      phase: pct,
      name: 'Waning Gibbous',
      emoji: '🌖',
      planting: 'Plant below-ground crops (roots, bulbs, tubers).',
    };
  if (pct < 0.78)
    return {
      phase: pct,
      name: 'Last Quarter',
      emoji: '🌗',
      planting: 'Best for root crops. Prune + weed. Avoid sowing.',
    };
  return {
    phase: pct,
    name: 'Waning Crescent',
    emoji: '🌘',
    planting: 'Rest period. Good for soil prep + compost + weeding.',
  };
}

function CalendarRangeIcon() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-3.5 w-3.5 items-center justify-center rounded border border-violet-400/60 text-[8px]"
    >
      30
    </span>
  );
}

export function MoonPhaseCalendar() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [offset, setOffset] = useState(0);
  const today = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  }, [offset]);
  const moon = useMemo(() => getMoonPhase(today), [today]);
  const next30 = useMemo(() => {
    const days: { date: Date; moon: ReturnType<typeof getMoonPhase> }[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push({ date: d, moon: getMoonPhase(d) });
    }
    return days;
  }, []);

  const handleReset = () => {
    setOffset(0);
    toast({
      title: tr('Reset to Today', 'تمت العودة إلى اليوم', 'Revenir à aujourd’hui'),
    });
  };

  return (
    <CalculatorShell
      icon={Moon}
      accent="violet"
      title={{
        en: 'Moon Phase Planting Calendar',
        ar: 'تقويم الزراعة حسب أطوار القمر',
        fr: 'Calendrier Lunaire de Plantation',
      }}
      description={{
        en: 'Biodynamic planting guide · 29.5-day lunar cycle · 30-day forecast',
        ar: 'دليل الزراعة الحيوية · دورة قمرية مدتها 29.5 يوماً · توقعات 30 يوماً',
        fr: 'Guide de plantation biodynamique · cycle lunaire 29,5 jours · prévision 30 jours',
      }}
      badge="Biodynamic"
      actions={[
        {
          icon: RotateCcw,
          label: { en: 'Reset to Today', ar: 'العودة إلى اليوم', fr: "Aujourd'hui" },
          onClick: handleReset,
        },
      ]}
      protocolNote={{
        en: 'Biodynamic planting uses lunar cycles: waxing moon for above-ground (leaves, fruits), waning for below-ground (roots, tubers). Scientific evidence is mixed, but practiced for millennia.',
        ar: 'تستخدم الزراعة الحيوية الدورات القمرية: القمر المتزايد للمحاصيل فوق سطح الأرض (الأوراق والثمار)، والمتناقص للمحاصيل تحت سطح الأرض (الجذور والدرنات). الأدلة العلمية متباينة، لكن هذه الممارسة مستمرة منذ آلاف السنين.',
        fr: 'La plantation biodynamique suit les cycles lunaires : lune croissante pour les cultures aériennes (feuilles, fruits), décroissante pour les souterraines (racines, tubercules). Les preuves scientifiques sont mitigées, mais la pratique millénaire persiste.',
      }}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-xl border border-violet-200 bg-violet-50/40 dark:border-violet-900 dark:bg-violet-950/20 space-y-2 text-center">
          <div className="text-6xl" aria-hidden="true">
            {moon.emoji}
          </div>
          <div className="text-base font-bold">
            {phaseLabel(language, moon.name)}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {today.toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </div>
          <div className="text-sm leading-relaxed text-foreground/80">
            {plantingLabel(language, moon.planting)}
          </div>
        </div>
        <div className="p-3 rounded-xl border bg-muted/20 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <CalendarRangeIcon />
            <span>{tr('Next 30 days', 'الأيام الثلاثون القادمة', '30 prochains jours')}</span>
          </div>
          <div className="grid grid-cols-5 gap-1 sm:grid-cols-10">
            {next30.map((d, i) => (
              <button
                key={i}
                onClick={() => setOffset(i)}
                aria-label={`${d.date.toLocaleDateString()} — ${phaseLabel(language, d.moon.name)}`}
                aria-pressed={offset === i}
                title={`${d.date.toLocaleDateString()} — ${phaseLabel(language, d.moon.name)}: ${plantingLabel(language, d.moon.planting)}`}
                className={`flex min-h-11 flex-col items-center justify-center rounded-md p-1 text-[9px] transition-colors ${
                  offset === i
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'hover:bg-violet-100/70 dark:hover:bg-violet-950/40'
                }`}
              >
                <span className="text-base" aria-hidden="true">
                  {d.moon.emoji}
                </span>
                <span className="font-mono text-[9px]">{d.date.getDate()}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 rounded-xl border bg-background p-3 text-xs sm:grid-cols-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🌒🌓🌔</span>
            <span className="text-muted-foreground">
              {tr(
                'Waxing → above-ground crops',
                'القمر المتزايد ← محاصيل فوق سطح الأرض',
                'Croissante → cultures aériennes',
              )}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🌖🌗🌘</span>
            <span className="text-muted-foreground">
              {tr(
                'Waning → root crops',
                'القمر المتناقص ← محاصيل جذرية',
                'Décroissante → cultures racines',
              )}
            </span>
          </div>
        </div>
      </CalculatorShell.Inputs>
      <CalculatorShell.Results>
        <CalculatorShell.MetricTile
          label={tr('Selected date', 'التاريخ المحدد', 'Date sélectionnée')}
          value={today.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
          color="default"
          helper={today.toLocaleDateString(undefined, { weekday: 'long' })}
        />
        <CalculatorShell.MetricTile
          label={tr('Current phase', 'الطور الحالي', 'Phase actuelle')}
          value={`${moon.emoji} ${phaseLabel(language, moon.name)}`}
          color="default"
          helper={`${((moon.phase * 100).toFixed(0))}% ${tr(
            'of cycle',
            'من الدورة',
            'du cycle',
          )}`}
        />
        <CalculatorShell.MetricTile
          label={tr('Planting advice', 'نصيحة الزراعة', 'Conseil de plantation')}
          value={plantingLabel(language, moon.planting)}
          color="default"
        />
        <div className="grid grid-cols-2 gap-3">
          <CalculatorShell.MetricTile
            label={tr('Days from today', 'أيام من اليوم', 'Jours depuis aujourd’hui')}
            value={offset}
            color="default"
            helper={offset === 0 ? tr('Today', 'اليوم', "Aujourd'hui") : ''}
          />
          <CalculatorShell.MetricTile
            label={tr('Cycle progress', 'تقدّم الدورة', 'Progression du cycle')}
            value={`${(moon.phase * 100).toFixed(0)}%`}
            color="default"
          />
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
