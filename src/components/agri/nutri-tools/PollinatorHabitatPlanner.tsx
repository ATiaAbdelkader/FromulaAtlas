'use client';

import { useState, useMemo } from 'react';
import {
  Bug,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CalculatorShell,
  type TrilingualString,
  type CalculatorPill,
} from '@/components/agri/nutri-tools/CalculatorShell';

// ---------------------------------------------------------------------------
// Trilingual content
// ---------------------------------------------------------------------------

const TITLE: TrilingualString = {
  en: 'Pollinator Habitat Planner',
  ar: 'مخطّط موائل الملقّحات',
  fr: 'Planificateur d\u2019habitat pollinisateur',
};

const DESCRIPTION: TrilingualString = {
  en: '10 species · bloom season + pollinator type + goal filtering for biodiversity plantings.',
  ar: '10 أنواع · إزهار حسب الموسم ونوع الملقّح والهدف لتصاميم التنوع الحيوي.',
  fr: '10 espèces · floraison par saison + type de pollinisateur + objectif.',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'Plant 3–5 species for continuous bloom spring through fall. Minimum 0.5 ha for meaningful pollinator impact. Avoid neonicotinoid-treated seed within 500 m. Pollinator habitat increases crop yield 5–20% in insect-pollinated crops (almonds, apples, berries, canola). EQIP cost-share available for pollinator plantings.',
  ar: 'ازرع 3–5 أنواع لضمان إزهار مستمر من الربيع إلى الخريف. الحد الأدنى 0.5 هكتار لتأثير ملحوظ. تجنّب البذور المعالجة بالنونيكوتينويد ضمن 500 م. تزيد موائل الملقّحات الإنتاجية 5–20% في المحاصيل التي تعتمد على الحشرات (اللوز، التفاح، التوت، الكانولا). تتوفر دعم مالي عبر برنامج EQIP.',
  fr: 'Plantez 3–5 espèces pour une floraison continue du printemps à l\u2019automne. Minimum 0,5 ha pour un impact significatif. Évitez les semences traitées aux néonicotinoïdes dans un rayon de 500 m. L\u2019habitat pollinisateur augmente le rendement de 5–20 % sur cultures entomophiles (amandier, pommier, petits fruits, colza). Aides EQIP disponibles.',
};

// ---------------------------------------------------------------------------
// Species data — UNCHANGED (English names + bloom values used by filter logic)
// ---------------------------------------------------------------------------

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

const GOAL_PILLS: CalculatorPill[] = [
  { key: 'pollinator', label: '🐝 Pollinator habitat', emoji: '🐝' },
  { key: 'nitrogen', label: '🟢 N fixation', emoji: '🟢' },
  { key: 'erosion', label: '🏔️ Erosion control', emoji: '🏔️' },
  { key: 'biofumigation', label: '💨 Biofumigation', emoji: '💨' },
  { key: 'biodiversity', label: '🌺 Biodiversity', emoji: '🌺' },
];

const SEASON_PILLS: CalculatorPill[] = [
  { key: 'all', label: 'All seasons', emoji: '📅' },
  { key: 'Spring', label: 'Spring', emoji: '🌱' },
  { key: 'Summer', label: 'Summer', emoji: '☀️' },
  { key: 'Late', label: 'Late summer', emoji: '🌻' },
  { key: 'Fall', label: 'Fall', emoji: '🍂' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PollinatorHabitatPlanner() {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr?: string) => copyFor(language, en, ar, fr);

  const [season, setSeason] = useState('all');
  const [goal, setGoal] = useState('pollinator');

  // Filter logic — UNCHANGED
  const filtered = useMemo(() => SPECIES.filter(s => (season === 'all' || s.bloom.includes(season)) && s.goals.includes(goal)).sort((a, b) => b.pollinators.length - a.pollinators.length), [season, goal]);

  const handleReset = () => {
    setSeason('all');
    setGoal('pollinator');
    toast({
      title: tr('Filters Reset', 'تمت إعادة تعيين الفلاتر', 'Filtres réinitialisés'),
    });
  };

  const actions = [
    {
      icon: RotateCcw,
      label: { en: 'Reset Filters', ar: 'إعادة الفلاتر', fr: 'Réinitialiser' },
      onClick: handleReset,
      variant: 'ghost' as const,
    },
  ];

  return (
    <CalculatorShell
      icon={Bug}
      title={TITLE}
      description={DESCRIPTION}
      badge="Biodiversity"
      accent="amber"
      actions={actions}
      pills={GOAL_PILLS}
      activePill={goal}
      onPillClick={setGoal}
      pillLabel={{ en: 'Primary Goal:', ar: 'الهدف الأساسي:', fr: 'Objectif :' }}
      protocolNote={PROTOCOL_NOTE}
    >
      {/* ---------------- Inputs column ---------------- */}
      <CalculatorShell.Inputs>
        {/* Season filter — custom pill bar */}
        <div className="p-3 rounded-xl border bg-card space-y-2">
          <div className="text-xs font-bold text-foreground uppercase tracking-wider">
            {tr('Bloom Season', 'موسم الإزهار', 'Saison de floraison')}
          </div>
          <div className="flex flex-wrap gap-2">
            {SEASON_PILLS.map((pill) => (
              <button
                key={pill.key}
                onClick={() => setSeason(pill.key)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border',
                  season === pill.key
                    ? 'bg-amber-500 text-white shadow-md border-amber-500'
                    : 'bg-background hover:bg-muted text-foreground border-border',
                )}
              >
                {pill.emoji && <span>{pill.emoji}</span>}
                <span>{tr(pill.label, pill.label, pill.label)}</span>
              </button>
            ))}
          </div>
        </div>

        <CalculatorShell.MetricTile
          label={tr('Matching Species', 'الأنواع المطابقة', 'Espèces correspondantes')}
          value={filtered.length}
          unit={`/${SPECIES.length}`}
          color="amber"
          helper={tr('Sorted by pollinator diversity', 'مرتبة حسب تنوع الملقّحات', 'Triées par diversité de pollinisateurs')}
        />

        <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20 p-3 text-sm leading-relaxed text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            {tr(
              'Plant 3–5 species for continuous bloom. Minimum 0.5 ha for pollinator impact.',
              'ازرع 3–5 أنواع لإزهار مستمر. الحد الأدنى 0.5 هكتار.',
              'Plantez 3–5 espèces pour une floraison continue. Minimum 0,5 ha.',
            )}
          </span>
        </div>
      </CalculatorShell.Inputs>

      {/* ---------------- Results column ---------------- */}
      <CalculatorShell.Results>
        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
          {tr('Recommended Species', 'الأنواع الموصى بها', 'Espèces recommandées')}
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2 pr-1
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-amber-300/60
          dark:[&::-webkit-scrollbar-thumb]:bg-amber-700/60
          [&::-webkit-scrollbar-track]:bg-transparent">
          {filtered.map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-3 rounded-xl border bg-card p-3 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
            >
              <div className="text-2xl shrink-0">{s.emoji}</div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="text-sm font-bold text-foreground">{s.name}</div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {s.type} · {s.bloom} · {s.height}
                </div>
              </div>
              <div className="flex flex-wrap gap-0.5 justify-end shrink-0 max-w-[40%]">
                {s.pollinators.map((p) => (
                  <Badge key={p} variant="outline" className="text-[8px] px-1 py-0">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              {tr(
                'No species match the selected filters. Try a different season or goal.',
                'لا توجد أنواع مطابقة للفلاتر المختارة. جرّب موسماً أو هدفاً مختلفاً.',
                'Aucune espèce ne correspond aux filtres. Essayez une autre saison ou objectif.',
              )}
            </div>
          )}
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
