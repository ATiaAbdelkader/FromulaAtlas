'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  HelpCircle,
  Package,
  Activity,
  Timer,
  ShieldCheck,
  Globe,
  Sparkles,
  ArrowRight,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Droplets,
  Zap,
  Wind,
  Bug,
  Layers,
  Thermometer,
  Sprout,
  Scale,
  Sun,
  Mountain,
  BookOpen,
} from 'lucide-react';
import { useTranslation, type Language, copyFor } from '@/lib/language-store';
import {
  TOOL_EXPLAINER_DATA,
  type ToolExplainerCategory,
  type ToolExplainerTopic,
} from '@/lib/tool-explainer-data';

export { TOOL_EXPLAINER_DATA, type ToolExplainerCategory, type ToolExplainerTopic };

const ICONS_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Package,
  Activity,
  Timer,
  ShieldCheck,
  Globe,
  Sparkles,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Droplets,
  Zap,
  Wind,
  Bug,
  Layers,
  Thermometer,
  Sprout,
  Scale,
  Sun,
  Mountain,
};

interface ToolExplainerProps {
  category: ToolExplainerCategory;
  triggerVariant?: 'default' | 'outline' | 'ghost' | 'badge' | 'icon' | 'banner';
  triggerLabel?: string;
  className?: string;
}

export function ToolExplainerDialog({
  category,
  triggerVariant = 'outline',
  triggerLabel,
  className = '',
}: ToolExplainerProps) {
  const [open, setOpen] = useState(false);
  const { language } = useTranslation();

  const topic: ToolExplainerTopic = TOOL_EXPLAINER_DATA[category] || TOOL_EXPLAINER_DATA.generic_formula;
  const IconComponent = ICONS_MAP[topic.iconName] || Sparkles;

  const title =
    language === 'ar' ? topic.titleAr : language === 'fr' ? topic.titleFr : topic.titleEn;
  const subtitle =
    language === 'ar'
      ? topic.shortSubtitleAr
      : language === 'fr'
      ? topic.shortSubtitleFr
      : topic.shortSubtitleEn;
  const summary =
    language === 'ar' ? topic.summaryAr : language === 'fr' ? topic.summaryFr : topic.summaryEn;
  const algerianContext =
    language === 'ar'
      ? topic.algerianContextAr
      : language === 'fr'
      ? topic.algerianContextFr
      : topic.algerianContextEn;

  const defaultBtnLabel =
    language === 'ar'
      ? 'كيف يعمل هذا المبدأ؟'
      : language === 'fr'
      ? 'Comment ça marche ?'
      : 'How it works';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerVariant === 'icon' ? (
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted ${className}`}
            title={defaultBtnLabel}
          >
            <HelpCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </Button>
        ) : triggerVariant === 'badge' ? (
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition-colors shadow-sm cursor-pointer ${className}`}
          >
            <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
            <span>{triggerLabel || defaultBtnLabel}</span>
          </button>
        ) : triggerVariant === 'banner' ? (
          <button
            type="button"
            className={`w-full flex items-center justify-between gap-2 rounded-xl border border-emerald-300/80 dark:border-emerald-800/80 bg-gradient-to-r from-emerald-50/90 via-background to-emerald-50/50 dark:from-emerald-950/30 dark:to-emerald-950/10 p-3 text-left transition-all hover:border-emerald-500 shadow-sm cursor-pointer ${className}`}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-foreground">
                  {triggerLabel || defaultBtnLabel}
                </div>
                <div className="text-[11px] text-muted-foreground line-clamp-1">{subtitle}</div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          </button>
        ) : (
          <Button
            variant={triggerVariant === 'default' ? 'default' : 'outline'}
            size="sm"
            className={`gap-1.5 text-xs font-semibold transition-all hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 ${className}`}
          >
            <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
            <span>{triggerLabel || defaultBtnLabel}</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-4 sm:p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader className="space-y-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border shadow-sm ${topic.accentColor}`}
            >
              <IconComponent className="h-4 w-4" />
            </span>
            <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {language === 'ar' ? 'المبادئ العلمية والتطبيقية' : language === 'fr' ? 'Principes Scientifiques & Terrain' : 'Scientific & Field Principles'}
            </Badge>
          </div>
          <DialogTitle className="text-base sm:text-xl font-bold tracking-tight text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-3 text-xs sm:text-sm">
          {/* Formula banner */}
          <div className="rounded-xl border border-border/80 bg-muted/50 p-3 font-mono text-[11px] sm:text-xs text-foreground/90 overflow-x-auto">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 mr-2">
              {language === 'ar' ? 'الصيغة الرياضية / المبدأ:' : language === 'fr' ? 'Formule / Principe :' : 'Formula / Principle:'}
            </span>
            {topic.formulaNotation}
          </div>

          {/* Core Summary */}
          <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20 p-4">
            <h4 className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm mb-1.5">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              {language === 'ar' ? 'الخلاصة العلمية للعملية' : language === 'fr' ? 'Résumé de la méthode' : 'Scientific Overview'}
            </h4>
            <p className="text-emerald-800/90 dark:text-emerald-300 leading-relaxed">
              {summary}
            </p>
          </div>

          {/* Step-by-Step Breakdown */}
          <div className="space-y-3">
            <h4 className="font-bold text-foreground text-xs sm:text-sm uppercase tracking-wide text-muted-foreground">
              {language === 'ar' ? 'خطوات التحليل والحساب' : language === 'fr' ? 'Étapes du calcul & fonctionnement' : 'Step-by-step Calculation & Action'}
            </h4>
            <div className="grid gap-3">
              {topic.steps.map((step) => {
                const heading =
                  language === 'ar'
                    ? step.headingAr
                    : language === 'fr'
                    ? step.headingFr
                    : step.headingEn;
                const body =
                  language === 'ar' ? step.bodyAr : language === 'fr' ? step.bodyFr : step.bodyEn;

                return (
                  <div
                    key={step.stepNumber}
                    className="flex gap-3 rounded-xl border border-border/60 bg-card p-3.5 shadow-sm transition-all"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                      {step.stepNumber}
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold text-foreground text-xs sm:text-sm">{heading}</div>
                      <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
                        {body}
                      </p>
                      {step.scientificDetail && (
                        <div className="mt-1.5 inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                          {step.scientificDetail}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Algerian Soil & Agro-Ecological Context */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20 p-4">
            <h4 className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200 text-xs sm:text-sm mb-1.5">
              <Globe className="h-4 w-4 text-amber-600" />
              {language === 'ar'
                ? 'خصوصية التربة والمناخ الجزائري (المتيجة، الشلف، الهضاب، الجنوب)'
                : language === 'fr'
                ? 'Spécificités Pédoclimatiques Algériennes (Mitidja, Chéliff, Hauts Plateaux, Sud)'
                : 'Algerian Pedoclimatic Context'}
            </h4>
            <p className="text-amber-800/90 dark:text-amber-300 leading-relaxed">
              {algerianContext}
            </p>
          </div>

          {/* Practical Field Recommendations */}
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 font-bold text-foreground text-xs sm:text-sm">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              {language === 'ar' ? 'نصائح عملية للحقل والمزرعة' : language === 'fr' ? 'Conseils pratiques de terrain' : 'Practical Field Tips'}
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {topic.practicalTips.map((tip, idx) => {
                const tipText =
                  language === 'ar' ? tip.tipAr : language === 'fr' ? tip.tipFr : tip.tipEn;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 p-2.5 text-muted-foreground"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                    <span>{tipText}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end border-t border-border/60 pt-3">
          <Button size="sm" onClick={() => setOpen(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {language === 'ar' ? 'فهمت، إغلاق' : language === 'fr' ? 'J’ai compris' : 'Got it, close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ToolExplainerInline({
  category,
  className = '',
}: {
  category: ToolExplainerCategory;
  className?: string;
}) {
  const { language } = useTranslation();
  const topic = TOOL_EXPLAINER_DATA[category] || TOOL_EXPLAINER_DATA.generic_formula;
  const IconComponent = ICONS_MAP[topic.iconName] || Sparkles;

  const title =
    language === 'ar' ? topic.titleAr : language === 'fr' ? topic.titleFr : topic.titleEn;
  const summary =
    language === 'ar' ? topic.summaryAr : language === 'fr' ? topic.summaryFr : topic.summaryEn;
  const algerianContext =
    language === 'ar'
      ? topic.algerianContextAr
      : language === 'fr'
      ? topic.algerianContextFr
      : topic.algerianContextEn;

  return (
    <div className={`rounded-xl border border-emerald-200 dark:border-emerald-900 bg-card p-4 space-y-3 shadow-sm ${className}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
        <div className="flex items-center gap-2">
          <span className={`p-1.5 rounded-lg border ${topic.accentColor}`}>
            <IconComponent className="h-4 w-4" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-foreground">{title}</h4>
            <div className="text-[11px] font-mono text-muted-foreground">{topic.formulaNotation}</div>
          </div>
        </div>
        <ToolExplainerDialog category={category} triggerVariant="badge" />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{summary}</p>
      <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-900 dark:text-amber-300">
        <span className="font-semibold">{language === 'ar' ? 'سياق الجزائر: ' : language === 'fr' ? 'Contexte Algérie : ' : 'Algerian Context: '}</span>
        {algerianContext}
      </div>
    </div>
  );
}
