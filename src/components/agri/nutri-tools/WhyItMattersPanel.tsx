'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ChevronDown, ChevronUp, Lightbulb, AlertTriangle, ExternalLink, Sparkles, HelpCircle } from 'lucide-react';
import { GlossaryTooltip } from './GlossaryTooltip';
import { ToolExplainerDialog, type ToolExplainerCategory } from '../ToolExplainerDialog';
import { useTranslation, copyFor } from '@/lib/language-store';

export interface WhyItMatters {
  example: string;        // real-world scenario
  science: string;        // 1-paragraph explanation
  mistakes: string[];     // common pitfalls
  references: { label: string; url: string }[];
  category?: ToolExplainerCategory;
}

interface Props {
  title?: string;
  content: WhyItMatters;
  category?: ToolExplainerCategory;
}

const TOOL_ID_CATEGORY_MAP: Record<string, ToolExplainerCategory> = {
  'fertilizer-compatibility': 'tank_mix_compatibility',
  'tank-mixing': 'tank_mix_compatibility',
  'fertigation-tank-mixer': 'fertigation_ab_tanks',
  'soil-water-texture': 'soil_texture_awc',
  'soil-ph-nutrient-master': 'soil_ph_nutrients',
  'vpd-estimator': 'vpd_greenhouse',
  'water-hardness': 'water_hardness_sar',
  'amendment-balance': 'digital_twin_soil',
  'mineralizable-n': 'compost_c_n_balance',
  'granular-mix': 'fertilizer_bags',
  'fertilizer-composition': 'fertilizer_bags',
  'nutrient-distribution': 'fertilizer_bags',
  'plant-deficiency': 'symptom_checker',
  'tomato-disease': 'symptom_checker',
  'active-matter': 'active_matter_irac_frac',
  'spray-drift': 'spray_weather_deltat',
  'gdd-tracker': 'gdd_phenology',
  'seed-rate': 'seed_rate_population',
  'yield-estimation': 'yield_estimation',
  'compost-mixer': 'compost_c_n_balance',
  'frost-protection': 'frost_protection',
  'rusle-erosion': 'rusle_erosion',
  'pest-threshold': 'ipm_pest_threshold',
};

export function WhyItMattersPanel({ title, content, category }: Props) {
  const [open, setOpen] = useState(false);
  const { language } = useTranslation();

  const explainerCategory = category || content.category;

  const panelTitle =
    title ||
    copyFor(
      language,
      'Why this matters & Scientific Principles',
      'لماذا يهم هذا والمبادئ العلمية',
      'Pourquoi c’est important & Principes scientifiques'
    );

  const subTitle = copyFor(
    language,
    'Real-world example, agronomic science, common mistakes & field standards',
    'أمثلة حقلية واقعية، أسس علمية زراعية، وأخطاء شائعة يجب تجنبها',
    'Exemple concret, science agronomique, erreurs fréquentes et références'
  );

  return (
    <Card className="border-dashed overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between p-3.5 bg-muted/20 hover:bg-muted/40 transition-colors">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex-1 text-left flex items-center gap-2.5 cursor-pointer"
        >
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-foreground">{panelTitle}</div>
            <div className="text-[11px] text-muted-foreground line-clamp-1">{subTitle}</div>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {explainerCategory && (
            <ToolExplainerDialog
              category={explainerCategory}
              triggerVariant="badge"
              triggerLabel={language === 'ar' ? 'دليل علمي مفصل' : language === 'fr' ? 'Guide détaillé' : 'Deep science'}
            />
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <CardContent className="pt-3 space-y-3 text-xs sm:text-sm border-t border-border/50">
          {/* Real-world example */}
          <div className="rounded-xl p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-emerald-800 dark:text-emerald-300 font-bold mb-1">
              <Lightbulb className="h-3.5 w-3.5 text-emerald-600" />
              {language === 'ar' ? 'مثال حقلي واقعي' : language === 'fr' ? 'Exemple concret de terrain' : 'Real-world field scenario'}
            </div>
            <p className="text-emerald-900/90 dark:text-emerald-200/90 leading-relaxed text-xs">
              <GlossaryText text={content.example} />
            </p>
          </div>

          {/* Science */}
          <div className="rounded-xl p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/60">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-blue-800 dark:text-blue-300 font-bold mb-1">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              {language === 'ar' ? 'الأساس العلمي والفيزيولوجي' : language === 'fr' ? 'La science & le principe' : 'The agronomic science'}
            </div>
            <p className="text-blue-900/90 dark:text-blue-200/90 leading-relaxed text-xs">
              <GlossaryText text={content.science} />
            </p>
          </div>

          {/* Common mistakes */}
          <div className="rounded-xl p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-amber-800 dark:text-amber-300 font-bold mb-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              {language === 'ar' ? 'أخطاء شائعة يجب تفاديها' : language === 'fr' ? 'Erreurs fréquentes à éviter' : 'Common mistakes to avoid'}
            </div>
            <ul className="text-xs leading-relaxed text-amber-950/90 dark:text-amber-200/90 space-y-1 list-disc pl-4">
              {content.mistakes.map((m, i) => (
                <li key={i}>
                  <GlossaryText text={m} />
                </li>
              ))}
            </ul>
          </div>

          {/* References */}
          {content.references && content.references.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 items-center">
              <span className="text-[11px] font-semibold text-muted-foreground">
                {language === 'ar' ? 'المراجع العلمية المعتمدة:' : language === 'fr' ? 'Références :' : 'References:'}
              </span>
              {content.references.map((ref, i) => (
                <a
                  key={i}
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md border border-border bg-background hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors shadow-xs"
                >
                  <ExternalLink className="h-3 w-3" />
                  {ref.label}
                </a>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function GlossaryText({ text }: { text: string }) {
  return <span>{text}</span>;
}
