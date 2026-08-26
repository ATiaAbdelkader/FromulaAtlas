'use client';

import React from 'react';
import {
  MapPin,
  Sparkles,
  Flame,
  ArrowRight,
  TrendingUp,
  Droplets,
  Layers,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ALGERIAN_AGRO_PRESETS,
  type AlgerianAgroPreset,
} from '@/lib/algerian-agro-presets';
import { useTranslation, copyFor } from '@/lib/language-store';

export interface RegionalPresetSelectorProps {
  onSelectPreset: (preset: AlgerianAgroPreset) => void;
  currentCropId?: string;
  className?: string;
}

export function RegionalPresetSelector({
  onSelectPreset,
  currentCropId,
  className = '',
}: RegionalPresetSelectorProps) {
  const { language } = useTranslation();
  const tr = copyFor;

  return (
    <div
      id="algerian-regional-presets"
      className={`rounded-2xl border border-emerald-300/80 bg-gradient-to-br from-emerald-50/90 via-card to-amber-50/40 p-4 shadow-sm sm:p-5 dark:border-emerald-800/70 dark:from-emerald-950/30 dark:via-card dark:to-amber-950/20 ${className}`}
    >
      <div className="flex flex-col justify-between gap-3 border-b border-border/70 pb-3.5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                {tr(
                  language,
                  '1-Click Algerian Agro-Climatic Presets',
                  'نماذج مجهزة بنقرة واحدة لأقاليم الجزائر الزراعية',
                  'Préréglages agro-climatiques algériens en 1 clic'
                )}
              </span>
              <Badge className="bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0 h-4">
                🇩🇿 {tr(language, 'Local Benchmarks', 'معايير محلية', 'Repères locaux')}
              </Badge>
            </div>
            <h3 className="text-sm font-bold text-foreground sm:text-base">
              {tr(
                language,
                'Instant regional scenarios with verified soil, ET₀ & price data',
                'سيناريوهات فورية معتمدة مع معطيات المناخ، التربة، وتكاليف الري والأسواق',
                'Scénarios régionaux instantanés avec données sol, ET₀ et prix du marché'
              )}
            </h3>
          </div>
        </div>

        <span className="text-xs text-muted-foreground hidden lg:block">
          {tr(
            language,
            'Click any card to populate simulator',
            'اضغط على أي بطاقة لتطبيق المعطيات فورا',
            'Cliquez pour charger la parcelle'
          )}
        </span>
      </div>

      {/* Grid of Preset Cards */}
      <div className="mt-3.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {ALGERIAN_AGRO_PRESETS.map((preset) => {
          const isCurrent = preset.cropId === currentCropId;
          return (
            <div
              key={preset.id}
              className={`group relative flex flex-col justify-between rounded-xl border p-3 text-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                isCurrent
                  ? 'border-emerald-500 bg-emerald-50/70 dark:border-emerald-500 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                  : 'border-border bg-card hover:border-emerald-300 dark:hover:border-emerald-700'
              }`}
            >
              <div>
                {/* Header with Emoji & Region */}
                <div className="flex items-start justify-between gap-1.5">
                  <span className="text-2xl">{preset.emoji}</span>
                  <Badge
                    variant="outline"
                    className="text-[9px] font-semibold px-1.5 py-0 border-emerald-300 text-emerald-800 dark:border-emerald-700 dark:text-emerald-300 truncate max-w-[120px]"
                  >
                    {preset.region[language]}
                  </Badge>
                </div>

                <h4 className="mt-2 font-bold text-foreground leading-snug line-clamp-2">
                  {preset.name[language]}
                </h4>

                <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>{tr(language, 'Area & Mode:', 'المساحة والري:', 'Surface & Mode :')}</span>
                    <span className="font-semibold text-foreground">
                      {preset.areaHa} ha · {preset.irrigationSystem.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{tr(language, 'Avg ET₀:', 'المتبخر-نتح ET₀:', 'ET₀ moy :')}</span>
                    <span className="font-semibold text-blue-600">
                      {preset.avgET0} mm/d
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{tr(language, 'Target Yield:', 'المردود المستهدف:', 'Rdt cible :')}</span>
                    <span className="font-semibold text-emerald-600">
                      {preset.expectedYieldTonsHa} t/ha
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-3 pt-2.5 border-t border-border/70">
                <Button
                  size="sm"
                  variant={isCurrent ? 'default' : 'outline'}
                  className={`w-full h-7 text-[11px] font-bold ${
                    isCurrent
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'border-emerald-200 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/50'
                  }`}
                  onClick={() => onSelectPreset(preset)}
                >
                  {isCurrent ? (
                    <span className="flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" />
                      {tr(language, 'Active Model', 'النموذج النشط', 'Modèle actif')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      {tr(language, 'Load Scenario', 'تطبيق النموذج', 'Charger')}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
