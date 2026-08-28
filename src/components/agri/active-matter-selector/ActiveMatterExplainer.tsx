'use client';

import React, { useState, useMemo } from 'react';
import {
  ACTIVE_MATTER_MECHANISMS,
  ActiveMatterMechanism,
  getMechanismForActiveMatter,
  PlantMobility,
  ActionSpeed,
  ResistanceRisk,
} from '@/lib/active-matter-mechanisms';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FlaskConical,
  Zap,
  Clock,
  CloudRain,
  ShieldAlert,
  Thermometer,
  Droplets,
  Sun,
  Layers,
  Sparkles,
  ChevronRight,
  Search,
  BookOpen,
  ArrowRight,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  X,
} from 'lucide-react';
import { useTranslation } from '@/lib/language-store';

interface ActiveMatterExplainerProps {
  initialSubstanceId?: string;
  onSelectSubstance?: (id: string) => void;
}

export function ActiveMatterExplainer({ initialSubstanceId, onSelectSubstance }: ActiveMatterExplainerProps) {
  const { language } = useTranslation();
  const lang = (language === 'ar' ? 'ar' : language === 'en' ? 'en' : 'fr') as 'fr' | 'ar' | 'en';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string>(
    initialSubstanceId || ACTIVE_MATTER_MECHANISMS[0]?.id || 'abamectine'
  );

  // Selected mechanism
  const currentMechanism: ActiveMatterMechanism = useMemo(() => {
    return (
      ACTIVE_MATTER_MECHANISMS.find((m) => m.id === selectedId) ||
      getMechanismForActiveMatter(selectedId) ||
      ACTIVE_MATTER_MECHANISMS[0]
    );
  }, [selectedId]);

  // Filtered list
  const filteredList = useMemo(() => {
    return ACTIVE_MATTER_MECHANISMS.filter((m) => {
      if (filterType !== 'all' && m.type !== filterType) {
        if (filterType === 'insecticide' && !['insecticide', 'acaricide', 'bio-insecticide'].includes(m.type)) return false;
        if (filterType === 'fungicide' && !['fungicide', 'bio-fongicide'].includes(m.type)) return false;
        if (filterType === 'herbicide' && m.type !== 'herbicide') return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.nameFr.toLowerCase().includes(q) ||
        m.nameAr.toLowerCase().includes(q) ||
        m.nameEn.toLowerCase().includes(q) ||
        m.groupCode.toLowerCase().includes(q) ||
        m.groupFamily.toLowerCase().includes(q) ||
        m.targetSite.toLowerCase().includes(q)
      );
    });
  }, [filterType, searchQuery]);

  const getMobilityBadge = (mob: PlantMobility) => {
    switch (mob) {
      case 'contact':
        return {
          label: lang === 'ar' ? 'بالملامسة (سطحي)' : lang === 'en' ? 'Contact Only' : 'Contact strict',
          color: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300',
          desc: lang === 'ar' ? 'يبقى على سطح الورقة ولا ينتقل داخل النبات' : lang === 'en' ? 'Stays on foliage surface' : 'Reste à la surface du feuillage',
        };
      case 'translaminar':
        return {
          label: lang === 'ar' ? 'عابر للورقة (Translaminaire)' : lang === 'en' ? 'Translaminar' : 'Translaminaire',
          color: 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-950/40 dark:text-cyan-300',
          desc: lang === 'ar' ? 'يخترق بشرة الورقة للسطح السفلي والنسيج المتوسط' : lang === 'en' ? 'Penetrates through leaf lamina' : 'Traverse la cuticule vers la face inférieure',
        };
      case 'xylem-systemic':
        return {
          label: lang === 'ar' ? 'جهازي صاعد (خشب)' : lang === 'en' ? 'Xylem-Systemic' : 'Systémique xylème (ascendant)',
          color: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300',
          desc: lang === 'ar' ? 'ينتقل صعوداً مع العصارة لحماية النموات الجديدة' : lang === 'en' ? 'Moves upward with transpiration stream' : 'Monte par la sève brute vers les jeunes pousses',
        };
      case 'full-systemic':
        return {
          label: lang === 'ar' ? 'جهازي شامل (لحاء وخشب)' : lang === 'en' ? 'Amphimobile (Xylem + Phloem)' : 'Systémique complet (amphimobile)',
          color: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300',
          desc: lang === 'ar' ? 'ينتقل صعوداً وهبوطاً نحو الجذور والرايزومات' : lang === 'en' ? 'Moves both up to shoots and down to roots' : 'Descend vers les racines et monte aux feuilles',
        };
    }
  };

  const getSpeedBadge = (speed: ActionSpeed, isKnockdown: boolean) => {
    switch (speed) {
      case 'ultra-fast':
        return {
          label: lang === 'ar' ? 'صعق فوري (< 2 ساعة)' : lang === 'en' ? 'Ultra-Fast Knockdown' : 'Effet choc (< 2h)',
          color: 'bg-rose-500 text-white',
        };
      case 'fast':
        return {
          label: lang === 'ar' ? 'سريع (6-24 ساعة)' : lang === 'en' ? 'Fast (6-24h)' : 'Rapide (6-24h)',
          color: 'bg-orange-500 text-white',
        };
      case 'moderate':
        return {
          label: lang === 'ar' ? 'متوسط (2-4 أيام)' : lang === 'en' ? 'Moderate (2-4 days)' : 'Moyen (2-4 jours)',
          color: 'bg-blue-600 text-white',
        };
      case 'slow':
        return {
          label: lang === 'ar' ? 'جهازي بطيء (7-14 يوم)' : lang === 'en' ? 'Gradual (7-14 days)' : 'Progressif (7-14 jours)',
          color: 'bg-slate-600 text-white',
        };
    }
  };

  const getResistanceBadge = (risk: ResistanceRisk) => {
    switch (risk) {
      case 'low':
        return {
          label: lang === 'ar' ? 'خطر مقاومة منخفض جداً' : lang === 'en' ? 'Low Resistance Risk' : 'Risque résistance faible',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300',
        };
      case 'medium':
        return {
          label: lang === 'ar' ? 'خطر مقاومة متوسط' : lang === 'en' ? 'Moderate Resistance Risk' : 'Risque résistance moyen',
          color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300',
        };
      case 'high':
        return {
          label: lang === 'ar' ? 'خطر مقاومة مرتفع (طفرة unisite)' : lang === 'en' ? 'High Resistance Risk' : 'Risque résistance élevé',
          color: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300',
        };
    }
  };

  const mobilityInfo = getMobilityBadge(currentMechanism.mobility);
  const speedInfo = getSpeedBadge(currentMechanism.actionSpeed, currentMechanism.knockdownEffect);
  const resInfo = getResistanceBadge(currentMechanism.resistanceRisk);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 p-6 text-white shadow-md dark:border-emerald-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 backdrop-blur-sm border border-emerald-400/30">
                <FlaskConical className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {lang === 'ar'
                    ? 'دليل آلية العمل وطريقة التأثير الحيوي'
                    : lang === 'en'
                    ? 'Mode of Action & Biochemical Mechanism Guide'
                    : "Guide des Modes d'Action & Fonctionnement des Matières Actives"}
                </h2>
                <p className="text-xs text-emerald-200/90 mt-0.5">
                  {lang === 'ar'
                    ? 'فهم دقيق لكيفية اختراق المادة الفعالة، تأثيرها الخلوي، سرعتها واستراتيجيات منع مقاومة الآفات في الجزائر'
                    : lang === 'en'
                    ? 'Understand cellular target sites, plant translocation, symptom progression and anti-resistance strategies'
                    : "Comprendre les sites biochimiques cibles, la mobilité végétale, la vitesse d'action et la gestion des résistances"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/20 border-emerald-400/40 text-emerald-100 text-xs px-3 py-1 font-mono">
              IRAC · FRAC · HRAC
            </Badge>
          </div>
        </div>

        {/* Filter and Search Bar inside banner */}
        <div className="mt-5 grid gap-3 sm:grid-cols-12">
          <div className="relative sm:col-span-6">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'ar'
                  ? 'ابحث عن مادة فعالة (أبامكتين، مانكوزيب، تيبوكونازول، كوراجين...)'
                  : lang === 'en'
                  ? 'Search substance (Abamectin, Mancozeb, Tebuconazole, Glyphosate...)'
                  : 'Rechercher une matière active (Abamectine, Mancozèbe, Tébuconazole, Glyphosate...)'
              }
              className="bg-slate-900/60 border-slate-700/80 text-white placeholder:text-slate-400 pl-10 focus:border-emerald-400 rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 sm:col-span-6 items-center">
            {[
              { id: 'all', label: lang === 'ar' ? 'الكل' : lang === 'en' ? 'All' : 'Toutes' },
              { id: 'insecticide', label: lang === 'ar' ? 'حشرية / عناكب' : lang === 'en' ? 'Insecticides' : 'Insecticides' },
              { id: 'fungicide', label: lang === 'ar' ? 'فطرية' : lang === 'en' ? 'Fungicides' : 'Fongicides' },
              { id: 'herbicide', label: lang === 'ar' ? 'أعشاب' : lang === 'en' ? 'Herbicides' : 'Herbicides' },
            ].map((tab) => (
              <Button
                key={tab.id}
                size="sm"
                variant={filterType === tab.id ? 'default' : 'outline'}
                onClick={() => setFilterType(tab.id)}
                className={`rounded-xl text-xs h-9 px-3 ${
                  filterType === tab.id
                    ? 'bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400'
                    : 'bg-slate-800/60 text-slate-200 border-slate-700 hover:bg-slate-700/60'
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Selector Carousel/Pills on Left & In-Depth Card on Right */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Substance List Sidebar */}
        <div className="lg:col-span-4 space-y-2 max-h-[750px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between pb-1 px-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {lang === 'ar' ? 'المواد الفعالة المتاحة' : lang === 'en' ? 'Available Substances' : 'Matières Actives'} ({filteredList.length})
            </span>
          </div>

          {filteredList.map((item) => {
            const isSelected = item.id === currentMechanism.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedId(item.id);
                  if (onSelectSubstance) onSelectSubstance(item.id);
                }}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-1.5 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/70 shadow-sm dark:border-emerald-500/80 dark:bg-emerald-950/30'
                    : 'border-border/70 bg-card hover:border-emerald-300 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-sm text-foreground">
                    {lang === 'ar' ? item.nameAr : lang === 'en' ? item.nameEn : item.nameFr}
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono shrink-0 bg-background/80">
                    {item.groupCode}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {item.groupFamily}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Badge
                    variant="secondary"
                    className="text-[9px] px-1.5 py-0 h-4 uppercase font-medium bg-muted text-muted-foreground"
                  >
                    {item.type}
                  </Badge>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                    {item.mobility}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* In-Depth Mechanism Showcase */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="rounded-2xl border-emerald-200/80 shadow-sm dark:border-emerald-900">
            <CardHeader className="p-5 pb-3 border-b bg-muted/20">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-700 text-white font-mono text-xs px-2.5 py-0.5">
                      {currentMechanism.groupCode}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {currentMechanism.type.toUpperCase()}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold mt-2 text-foreground">
                    {lang === 'ar' ? currentMechanism.nameAr : lang === 'en' ? currentMechanism.nameEn : currentMechanism.nameFr}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    {currentMechanism.groupFamily}
                  </CardDescription>
                </div>

                <div className="flex flex-wrap gap-1.5 sm:flex-col sm:items-end">
                  <Badge className={`text-xs px-2.5 py-1 border ${mobilityInfo.color}`}>
                    {mobilityInfo.label}
                  </Badge>
                  <Badge className={`text-xs px-2.5 py-1 ${speedInfo.color}`}>
                    {speedInfo.label}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-6">
              {/* Biochemical Summary Callout */}
              <div className="rounded-xl border border-emerald-300/80 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-600 text-white shrink-0 mt-0.5">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide dark:text-emerald-300">
                      {lang === 'ar' ? 'الخلاصة البيوكيميائية وآلية التأثير' : lang === 'en' ? 'Biochemical Mechanism Summary' : "Résumé du Mécanisme d'Action"}
                    </h4>
                    <p className="text-sm text-foreground/90 mt-1 leading-relaxed">
                      {currentMechanism.summary[lang]}
                    </p>
                    <div className="mt-2.5 flex items-center gap-2 text-xs text-emerald-800 font-medium dark:text-emerald-400">
                      <span className="font-semibold">{lang === 'ar' ? 'الموقع الخلوي المستهدف:' : lang === 'en' ? 'Target Site:' : 'Site Cible :'}</span>
                      <span>{lang === 'ar' ? currentMechanism.targetSiteAr : currentMechanism.targetSite}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4-Step Molecular & Physiological Action Diagram */}
              <div>
                <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-600" />
                  {lang === 'ar'
                    ? 'مراحل عمل المادة الفعالة خطوة بخطوة'
                    : lang === 'en'
                    ? 'Step-by-Step Action Pathway'
                    : "Étapes Détaillées du Mode d'Action"}
                </h4>

                <div className="grid gap-3 sm:grid-cols-2">
                  {currentMechanism.howItWorksSteps.map((step) => (
                    <div
                      key={step.step}
                      className="rounded-xl border border-border/80 bg-card p-3.5 relative overflow-hidden transition-all hover:border-emerald-300"
                    >
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                          {step.step}
                        </span>
                        <span className="text-xs font-bold text-foreground">
                          {step.title[lang]}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed pl-8">
                        {step.desc[lang]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Symptoms & What Happens to the Pest */}
              <div className="rounded-xl border border-blue-200/70 bg-blue-50/40 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0 mt-0.5">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wide dark:text-blue-300">
                      {lang === 'ar'
                        ? 'ماذا يحدث للآفة / الفطر / العشبة (الأعراض المرئية)'
                        : lang === 'en'
                        ? 'Observable Symptoms on Pest / Disease / Weed'
                        : 'Symptômes Visibles chez le Bio-agresseur'}
                    </h4>
                    <p className="text-xs text-foreground/90 mt-1 leading-relaxed">
                      {currentMechanism.pestOrDiseaseSymptoms[lang]}
                    </p>
                  </div>
                </div>
              </div>

              {/* Application Parameters Matrix */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border bg-card p-3.5 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
                    <CloudRain className="h-4 w-4 text-cyan-600" />
                    {lang === 'ar' ? 'مقاومة الغسيل بالأمطار' : lang === 'en' ? 'Rainfastness' : 'Résistance au lessivage'}
                  </div>
                  <div className="text-base font-bold text-foreground">
                    {currentMechanism.rainfastnessHours} {lang === 'ar' ? 'ساعات قبل المطر' : lang === 'en' ? 'hours dry time' : 'heures sans pluie'}
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    {currentMechanism.rainfastnessHours <= 1
                      ? (lang === 'ar' ? 'امتصاص فائق السرعة' : 'Pénétration ultra-rapide')
                      : (lang === 'ar' ? 'يحتاج جفاف كامل للفيلم' : 'Séchage complet requis')}
                  </span>
                </div>

                <div className="rounded-xl border bg-card p-3.5 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
                    <Thermometer className="h-4 w-4 text-orange-600" />
                    {lang === 'ar' ? 'مجال الحرارة المثالي' : lang === 'en' ? 'Optimal Temperature' : 'Plage de température'}
                  </div>
                  <div className="text-base font-bold text-foreground">
                    {currentMechanism.optimalConditions.idealTemp}
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    {lang === 'ar' ? 'لضمان أعلى فاعلية بيولوجية' : 'Pour une efficacité maximale'}
                  </span>
                </div>

                <div className="rounded-xl border bg-card p-3.5 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
                    <ShieldAlert className="h-4 w-4 text-rose-600" />
                    {lang === 'ar' ? 'خطر تطور المقاومة' : lang === 'en' ? 'Resistance Risk' : 'Risque de résistance'}
                  </div>
                  <Badge variant="outline" className={`w-fit text-xs font-semibold ${resInfo.color}`}>
                    {resInfo.label}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    {currentMechanism.groupCode}
                  </span>
                </div>
              </div>

              {/* Conditions d'Efficacité & Contexte Algérien */}
              <div className="space-y-3">
                <div className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide dark:text-amber-300 flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-amber-600" />
                    {lang === 'ar' ? 'جودة مياه الرش والمواد المساعدة' : lang === 'en' ? 'Water pH & Adjuvant Guidance' : "pH de l'Eau & Adjuvants"}
                  </h4>
                  <p className="text-xs text-foreground/90 mt-1 leading-relaxed">
                    {currentMechanism.optimalConditions.waterPhAdvice}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5 italic">
                    💡 {currentMechanism.optimalConditions.adjuvantOrMixing}
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide dark:text-emerald-300 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-emerald-600" />
                    {lang === 'ar' ? 'استراتيجية التناوب ومنع المقاومة' : lang === 'en' ? 'Anti-Resistance Strategy' : 'Gestion des Résistances'}
                  </h4>
                  <p className="text-xs text-foreground/90 mt-1 leading-relaxed">
                    {currentMechanism.resistanceManagement[lang]}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-muted/40 p-4">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
                    <span>🇩🇿</span>
                    {lang === 'ar' ? 'نصيحة الميدان في الجزائر' : lang === 'en' ? 'Algerian Field Agronomic Tip' : 'Conseil Agronomique Algérie'}
                  </h4>
                  <p className="text-xs text-foreground/90 mt-1 leading-relaxed">
                    {currentMechanism.algerianAgroTip[lang]}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** Standalone Modal / Dialog for Explaining any Active Matter from cards */
export function ActiveMatterMechanismModal({
  substanceId,
  substanceName,
  isOpen,
  onClose,
}: {
  substanceId?: string;
  substanceName?: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { language } = useLanguage();
  const lang = (language === 'ar' ? 'ar' : language === 'en' ? 'en' : 'fr') as 'fr' | 'ar' | 'en';

  if (!isOpen) return null;

  const mechanism =
    getMechanismForActiveMatter(substanceId || '') ||
    getMechanismForActiveMatter(substanceName || '') ||
    ACTIVE_MATTER_MECHANISMS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-emerald-200 bg-background p-6 shadow-2xl dark:border-emerald-900">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Badge className="bg-emerald-600 text-white font-mono text-xs">
            {mechanism.groupCode}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {mechanism.type.toUpperCase()}
          </Badge>
        </div>

        <h3 className="text-xl font-bold text-foreground">
          {lang === 'ar' ? mechanism.nameAr : lang === 'en' ? mechanism.nameEn : mechanism.nameFr}
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          {mechanism.groupFamily} · {mechanism.targetSite}
        </p>

        {/* Summary */}
        <div className="rounded-xl border border-emerald-300/80 bg-emerald-50/50 p-4 mb-4 dark:border-emerald-800 dark:bg-emerald-950/20">
          <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide dark:text-emerald-300 mb-1">
            {lang === 'ar' ? 'آلية العمل والتأثير الخلوي' : lang === 'en' ? 'Biochemical Mode of Action' : "Mode d'action biochimique"}
          </h4>
          <p className="text-xs text-foreground leading-relaxed">
            {mechanism.summary[lang]}
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-2 mb-4">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
            {lang === 'ar' ? 'المراحل الفيزيولوجية' : lang === 'en' ? 'Physiological Steps' : 'Étapes Physiologiques'}
          </h4>
          {mechanism.howItWorksSteps.map((step) => (
            <div key={step.step} className="rounded-lg border bg-muted/30 p-2.5 text-xs">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 mr-2">
                {step.step}. {step.title[lang]} :
              </span>
              <span className="text-muted-foreground">{step.desc[lang]}</span>
            </div>
          ))}
        </div>

        {/* Key field metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
          <div className="rounded-lg border p-2.5 bg-card">
            <span className="text-muted-foreground block text-[11px]">
              {lang === 'ar' ? 'الحرارة المثالية' : 'Température optimale'}
            </span>
            <span className="font-bold text-foreground">{mechanism.optimalConditions.idealTemp}</span>
          </div>
          <div className="rounded-lg border p-2.5 bg-card">
            <span className="text-muted-foreground block text-[11px]">
              {lang === 'ar' ? 'مقاومة المطر' : 'Résistance au lessivage'}
            </span>
            <span className="font-bold text-foreground">{mechanism.rainfastnessHours}h</span>
          </div>
        </div>

        {/* Anti-resistance */}
        <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 text-xs dark:border-amber-900 dark:bg-amber-950/20">
          <span className="font-bold text-amber-900 dark:text-amber-300 block mb-0.5">
            {lang === 'ar' ? 'إدارة المقاومة:' : 'Gestion de la résistance :'}
          </span>
          <span className="text-foreground/90">{mechanism.resistanceManagement[lang]}</span>
        </div>

        <div className="mt-5 flex justify-end">
          <Button onClick={onClose} size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">
            {lang === 'ar' ? 'إغلاق' : lang === 'en' ? 'Close' : 'Fermer'}
          </Button>
        </div>
      </div>
    </div>
  );
}
