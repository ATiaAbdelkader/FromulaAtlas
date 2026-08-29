'use client';

import React, { useState, useMemo } from 'react';
import {
  Sprout,
  Droplets,
  Calendar,
  Layers,
  Shield,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles,
  MapPin,
  Flame,
  Info,
  CalendarDays,
  Play,
  RotateCcw,
  Plus,
  Sliders,
  Sun,
  Activity,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  PHENOLOGY_CROPS,
  PhenologyCrop,
  PhenologyStage,
  getPhenologyCrop,
} from '@/lib/crop-phenology-data';
import { useTranslation, copyFor, type Language } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';
import { appendManualFieldRecord } from '@/lib/field-record-book';
import { ToolExplainerDialog } from '@/components/agri/ToolExplainerDialog';

interface CropPhenologyTimelineProps {
  initialCropId?: string;
  onSendTaskToPlanner?: (task: {
    title: string;
    stage: string;
    type: 'irrigation' | 'fertigation' | 'protection' | 'maintenance';
    timingDay: number;
    details: string;
  }) => void;
}

type AgroZone = 'coastal' | 'plateaus' | 'sahara';

export function CropPhenologyTimeline({
  initialCropId = 'durum-wheat',
  onSendTaskToPlanner,
}: CropPhenologyTimelineProps) {
  const { language } = useTranslation();
  const lang = (language === 'ar' ? 'ar' : language === 'fr' ? 'fr' : 'en') as Language;

  // Selected state
  const [selectedCropId, setSelectedCropId] = useState<string>(initialCropId);
  const [selectedZone, setSelectedZone] = useState<AgroZone>('plateaus');
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [activeDay, setActiveDay] = useState<number>(30);
  const [sowingDate, setSowingDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });

  // Layer Visibility Filters
  const [showIrrigationOverlay, setShowIrrigationOverlay] = useState<boolean>(true);
  const [showNutrientOverlay, setShowNutrientOverlay] = useState<boolean>(true);
  const [showTasksOverlay, setShowTasksOverlay] = useState<boolean>(true);
  const [showHazardsOverlay, setShowHazardsOverlay] = useState<boolean>(true);

  // Active crop
  const crop = useMemo<PhenologyCrop>(() => {
    return getPhenologyCrop(selectedCropId) || PHENOLOGY_CROPS[0];
  }, [selectedCropId]);

  // Set initial stage when crop changes
  const activeStage = useMemo<PhenologyStage>(() => {
    if (selectedStageId) {
      const match = crop.stages.find(s => s.id === selectedStageId);
      if (match) return match;
    }
    // Find stage based on activeDay
    const dayMatch = crop.stages.find(s => activeDay >= s.startDay && activeDay <= s.endDay);
    if (dayMatch) return dayMatch;
    return crop.stages[0];
  }, [crop, selectedStageId, activeDay]);

  // Current real-world stage calculated from sowing date
  const calculatedDaysSinceSowing = useMemo(() => {
    if (!sowingDate) return null;
    const sow = new Date(sowingDate);
    const now = new Date();
    const diffTime = now.getTime() - sow.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.min(crop.seasonLengthDays, diffDays));
  }, [sowingDate, crop.seasonLengthDays]);

  const realTimeStage = useMemo(() => {
    if (calculatedDaysSinceSowing === null) return null;
    return crop.stages.find(
      s => calculatedDaysSinceSowing >= s.startDay && calculatedDaysSinceSowing <= s.endDay
    ) || crop.stages[crop.stages.length - 1];
  }, [crop, calculatedDaysSinceSowing]);

  // Handle stage click
  const handleSelectStage = (stage: PhenologyStage) => {
    setSelectedStageId(stage.id);
    setActiveDay(Math.floor((stage.startDay + stage.endDay) / 2));
  };

  // Sync with calculated current day
  const handleJumpToToday = () => {
    if (calculatedDaysSinceSowing !== null) {
      setActiveDay(calculatedDaysSinceSowing);
      if (realTimeStage) {
        setSelectedStageId(realTimeStage.id);
      }
      toast({
        title: lang === 'ar' ? 'تم الانتقال لليوم الحالي' : lang === 'fr' ? 'Synchronisé au jour actuel' : 'Synced to Current Crop Day',
        description: `${lang === 'ar' ? 'اليوم في الموسم' : lang === 'fr' ? 'Jour en saison' : 'Day in season'}: ${calculatedDaysSinceSowing} (${realTimeStage?.name[lang]})`,
      });
    }
  };

  // Dispatch stage task to field book / planner
  const handleAddStageTaskToBook = (task: PhenologyStage['tasks'][0], stage: PhenologyStage) => {
    appendManualFieldRecord({
      fieldName: `plot-${crop.id}`,
      crop: crop.name[lang],
      date: new Date().toISOString().slice(0, 10),
      kind: task.type === 'irrigation' ? 'irrigation' : task.type === 'fertigation' ? 'input' : 'note',
      title: task.title[lang],
      summary: `${task.title[lang]}: ${task.details[lang]} [Day ${task.timingDay} Phenology Plan]`,
    });

    if (onSendTaskToPlanner) {
      onSendTaskToPlanner({
        title: task.title[lang],
        stage: stage.name[lang],
        type: task.type === 'fertigation' ? 'fertigation' : task.type === 'irrigation' ? 'irrigation' : task.type === 'protection' ? 'protection' : 'maintenance',
        timingDay: task.timingDay,
        details: task.details[lang],
      });
    }

    toast({
      title: lang === 'ar' ? 'تم تسجيل المهمة' : lang === 'fr' ? 'Tâche enregistrée' : 'Task Scheduled',
      description: `${task.title[lang]} ${lang === 'ar' ? 'أضيفت لسجل العمليات' : lang === 'fr' ? 'ajoutée au carnet de bord' : 'added to operations book'}`,
    });
  };

  // Zone labels
  const zoneNames: Record<AgroZone, { en: string; fr: string; ar: string; desc: string }> = {
    coastal: {
      en: 'Coastal Plain & Tell (Mitidja, Tipaza, Skikda)',
      fr: 'Plaine Côtière & Tell (Mitidja, Tipaza, Skikda)',
      ar: 'السهول الساحلية والأطلس التلي (متيجة، تيبازة، سكيكدة)',
      desc: 'Maritime moderate climate, lower ET0 (~3.5-5.5 mm/d)',
    },
    plateaus: {
      en: 'High Plateaus & Semi-Arid (Sétif, Batna, Tiaret)',
      fr: 'Hauts Plateaux & Semi-Aride (Sétif, Batna, Tiaret)',
      ar: 'الهضاب العليا والمناطق شبه الجافة (سطيف، باتنة، تيارت)',
      desc: 'Continental climate with winter cold & spring frost risks',
    },
    sahara: {
      en: 'Saharan Oasis & Southern Pivots (Biskra, El Oued, Ouargla)',
      fr: 'Oasis Sahariennes & Pivots du Sud (Biskra, El Oued, Ouargla)',
      ar: 'الواحات الصحراوية والمحاور الجنوبية (بسكرة، الوادي، ورقلة)',
      desc: 'Hyper-arid, high summer evaporative demand (ET0 up to 9-11 mm/d)',
    },
  };

  return (
    <div className="space-y-6" id="crop-phenology-timeline-root">
      {/* 1. Header Toolbar & Context Selection */}
      <Card className="border-border/80 shadow-xs bg-card/60 backdrop-blur-xs">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{crop.emoji}</span>
                <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                  {crop.name[lang]}
                  <Badge variant="outline" className="font-mono text-xs font-normal">
                    {crop.scientificName}
                  </Badge>
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
                {crop.overview[lang]}
              </p>
            </div>

            {/* Quick Sowing & Realtime Status */}
            <div className="flex flex-wrap items-center gap-3 bg-muted/40 p-3 rounded-lg border border-border/60">
              <ToolExplainerDialog category="gdd_phenology" triggerVariant="outline" className="h-8 text-xs" />
              <div className="space-y-1">
                <Label htmlFor="sowing-date-picker" className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  {lang === 'ar' ? 'تاريخ البذر / الشتل' : lang === 'fr' ? 'Date de semis / plantation' : 'Sowing / Planting Date'}
                </Label>
                <input
                  id="sowing-date-picker"
                  type="date"
                  value={sowingDate}
                  onChange={e => setSowingDate(e.target.value)}
                  className="text-xs font-mono bg-background border border-input rounded-md px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {calculatedDaysSinceSowing !== null && realTimeStage && (
                <div className="flex items-center gap-2 pl-2 border-l border-border/80">
                  <div className="text-right sm:text-left">
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                      {lang === 'ar' ? 'الطور الحالي الفعلي' : lang === 'fr' ? 'Stade Actuel en Champ' : 'Current Field Stage'}
                    </div>
                    <div className="text-xs font-bold text-primary flex items-center gap-1">
                      <span>{realTimeStage.emoji}</span>
                      <span>Day {calculatedDaysSinceSowing}</span>: {realTimeStage.name[lang]}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2 gap-1 border-primary/40 text-primary hover:bg-primary/10"
                    onClick={handleJumpToToday}
                  >
                    <Zap className="w-3 h-3 text-amber-500" />
                    {lang === 'ar' ? 'تزامن' : lang === 'fr' ? 'Sync' : 'Jump'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-border/60" />

          {/* Crop & Zone Selector Chips */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Crop Picker Dropdown / Buttons */}
            <div className="md:col-span-7 space-y-1.5">
              <Label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                {lang === 'ar' ? 'اختر المحصول الزراعي' : lang === 'fr' ? 'Sélectionner la culture' : 'Select Agricultural Crop'}
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {PHENOLOGY_CROPS.map(c => {
                  const isSelected = c.id === selectedCropId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCropId(c.id);
                        setSelectedStageId(c.stages[0].id);
                        setActiveDay(c.stages[0].startDay);
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40'
                      }`}
                    >
                      <span>{c.emoji}</span>
                      <span>{c.name[lang]}</span>
                      <span className="text-[10px] opacity-70">({c.seasonLengthDays}d)</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Agro-climatic Zone Selector */}
            <div className="md:col-span-5 space-y-1.5">
              <Label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                {lang === 'ar' ? 'المنطقة المناخية الزراعية' : lang === 'fr' ? 'Zone Agro-Climatique' : 'Agro-Ecological Region'}
              </Label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['coastal', 'plateaus', 'sahara'] as AgroZone[]).map(z => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setSelectedZone(z)}
                    className={`px-2 py-1.5 rounded-md text-xs text-center transition-all border ${
                      selectedZone === z
                        ? 'bg-sky-600 text-white font-semibold border-sky-700 shadow-xs'
                        : 'bg-muted/40 text-muted-foreground hover:bg-muted border-border/40'
                    }`}
                  >
                    <div className="font-semibold truncate">
                      {z === 'coastal' ? (lang === 'ar' ? 'الساحل' : lang === 'fr' ? 'Littoral' : 'Coastal') : z === 'plateaus' ? (lang === 'ar' ? 'الهضاب' : lang === 'fr' ? 'Plateaux' : 'Plateaus') : (lang === 'ar' ? 'الصحراء' : lang === 'fr' ? 'Sahara' : 'Sahara')}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground italic truncate">
                {zoneNames[selectedZone].desc}
              </p>
            </div>
          </div>

          {/* Overlay Filter Switches */}
          <div className="flex flex-wrap items-center justify-between pt-2 border-t border-border/40 gap-2">
            <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              {lang === 'ar' ? 'طبقات البيانات المتزامنة:' : lang === 'fr' ? 'Couches superposées :' : 'Synchronized Overlays:'}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={showIrrigationOverlay ? 'default' : 'outline'}
                className={`h-7 text-xs gap-1.5 ${
                  showIrrigationOverlay
                    ? 'bg-sky-600 hover:bg-sky-700 text-white'
                    : 'text-muted-foreground'
                }`}
                onClick={() => setShowIrrigationOverlay(!showIrrigationOverlay)}
              >
                <Droplets className="w-3 h-3" />
                {lang === 'ar' ? '💧 جدول الري' : lang === 'fr' ? '💧 Irrigation' : '💧 Water Demand'}
              </Button>

              <Button
                size="sm"
                variant={showNutrientOverlay ? 'default' : 'outline'}
                className={`h-7 text-xs gap-1.5 ${
                  showNutrientOverlay
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'text-muted-foreground'
                }`}
                onClick={() => setShowNutrientOverlay(!showNutrientOverlay)}
              >
                <Sprout className="w-3 h-3" />
                {lang === 'ar' ? '🌿 التسميد والتغذية' : lang === 'fr' ? '🌿 Fertigation' : '🌿 Nutrients (NPK)'}
              </Button>

              <Button
                size="sm"
                variant={showTasksOverlay ? 'default' : 'outline'}
                className={`h-7 text-xs gap-1.5 ${
                  showTasksOverlay
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'text-muted-foreground'
                }`}
                onClick={() => setShowTasksOverlay(!showTasksOverlay)}
              >
                <Shield className="w-3 h-3" />
                {lang === 'ar' ? '🛡️ العمليات والوقاية' : lang === 'fr' ? '🛡️ Travaux & IPM' : '🛡️ Field Tasks'}
              </Button>

              <Button
                size="sm"
                variant={showHazardsOverlay ? 'default' : 'outline'}
                className={`h-7 text-xs gap-1.5 ${
                  showHazardsOverlay
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'text-muted-foreground'
                }`}
                onClick={() => setShowHazardsOverlay(!showHazardsOverlay)}
              >
                <AlertTriangle className="w-3 h-3" />
                {lang === 'ar' ? '⚠️ تنبيهات المخاطر' : lang === 'fr' ? '⚠️ Risques' : '⚠️ Hazard Alerts'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Visual Multi-Track Phenology Timeline Bar (Gantt-style) */}
      <Card className="border-border/80 shadow-xs overflow-hidden">
        <CardHeader className="p-4 sm:p-5 bg-muted/20 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <Activity className="w-4 h-4 text-primary" />
                {lang === 'ar' ? 'المخطط الزمني للأطوار الفينولوجية' : lang === 'fr' ? 'Chronologie des Stades Phénologiques' : 'Visual Phenology & Crop Lifecycle Timeline'}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {lang === 'ar'
                  ? `دورة النمو الكاملة: ${crop.seasonLengthDays} يوماً مقسمة حسب مقياس BBCH ومعامل استهلاك المياه Kc`
                  : lang === 'fr'
                  ? `Cycle complet de ${crop.seasonLengthDays} jours calibré selon l'échelle BBCH et le coefficient Kc FAO-56`
                  : `Full ${crop.seasonLengthDays}-day lifecycle mapped with BBCH scale, FAO-56 Kc curves & field task overlays`}
              </CardDescription>
            </div>

            {/* Quick interactive day badge */}
            <div className="flex items-center gap-2 self-start sm:self-auto bg-background px-3 py-1 rounded-md border border-border shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">
                {lang === 'ar' ? 'اليوم المحدد' : lang === 'fr' ? 'Jour Actif' : 'Active Day'}: <span className="font-mono text-primary font-bold">{activeDay}</span> / {crop.seasonLengthDays}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Timeline Bar Strip */}
          <div className="space-y-2">
            <div className="relative w-full rounded-xl overflow-hidden border border-border/80 shadow-inner bg-muted/40 p-1 flex">
              {crop.stages.map((st, idx) => {
                const stageDuration = st.endDay - st.startDay + 1;
                const widthPct = (stageDuration / crop.seasonLengthDays) * 100;
                const isCurrentStage = st.id === activeStage.id;
                const isRealTimeStage = realTimeStage?.id === st.id;

                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleSelectStage(st)}
                    style={{ width: `${widthPct}%` }}
                    className={`relative group transition-all duration-200 text-left p-2 sm:p-2.5 rounded-lg border flex flex-col justify-between ${
                      isCurrentStage
                        ? 'ring-2 ring-primary ring-offset-1 z-10 shadow-md ' + st.colorScheme.bg + ' ' + st.colorScheme.border
                        : 'hover:bg-muted/80 border-transparent hover:border-border/60 opacity-90 hover:opacity-100'
                    }`}
                  >
                    {/* Top row: Emoji & BBCH */}
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span className="text-base sm:text-lg">{st.emoji}</span>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase hidden md:inline">
                        {st.bbchScale.split(' ')[0]}
                      </span>
                    </div>

                    {/* Stage Name */}
                    <div className="mt-1 space-y-0.5">
                      <div className="text-xs font-bold text-foreground truncate">
                        {st.name[lang]}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                        <span>D{st.startDay}–{st.endDay}</span>
                        <span className="text-[9px] opacity-75">({stageDuration}d)</span>
                      </div>
                    </div>

                    {/* Bottom Micro-Pills */}
                    <div className="mt-2 flex flex-wrap items-center gap-1 pt-1 border-t border-border/30">
                      <span className="text-[9px] font-mono bg-background/80 text-foreground px-1 py-0.2 rounded border border-border/50 font-semibold">
                        Kc {st.kc.toFixed(2)}
                      </span>
                      {showIrrigationOverlay && (
                        <span className="text-[9px] font-mono text-sky-700 dark:text-sky-300 hidden lg:inline">
                          {st.irrigation.waterDemandMmPerDay[selectedZone]} mm/d
                        </span>
                      )}
                    </div>

                    {/* Real-time Field Indicator */}
                    {isRealTimeStage && (
                      <div className="absolute -top-1 right-2 bg-amber-500 text-white text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full shadow-xs animate-pulse">
                        {lang === 'ar' ? 'الآن' : lang === 'fr' ? 'Actuel' : 'Now'}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Interactive Day Scrubber Slider */}
            <div className="pt-2 px-1 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                <span>{lang === 'ar' ? 'اليوم 1 (البداية)' : lang === 'fr' ? 'Jour 1 (Semis)' : 'Day 1 (Sowing)'}</span>
                <span className="text-primary font-bold">
                  {lang === 'ar' ? 'اسحب لمعاينة أي يوم:' : lang === 'fr' ? 'Glisser pour inspecter un jour :' : 'Scrub to inspect any day:'} Day {activeDay}
                </span>
                <span>{lang === 'ar' ? `اليوم ${crop.seasonLengthDays} (الحصاد)` : lang === 'fr' ? `Jour ${crop.seasonLengthDays} (Récolte)` : `Day ${crop.seasonLengthDays} (Harvest)`}</span>
              </div>
              <input
                type="range"
                min={1}
                max={crop.seasonLengthDays}
                value={activeDay}
                onChange={e => {
                  const val = parseInt(e.target.value, 10);
                  setActiveDay(val);
                  const matchingStage = crop.stages.find(s => val >= s.startDay && val <= s.endDay);
                  if (matchingStage) {
                    setSelectedStageId(matchingStage.id);
                  }
                }}
                className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* 3. FAO-56 Kc Transpiration Curve & Seasonal Water Requirement Visualizer */}
          <div className="bg-muted/30 p-4 rounded-xl border border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-sky-600" />
                {lang === 'ar' ? 'منحنى معامل المحصول FAO-56 Kc واستهلاك المياه' : lang === 'fr' ? 'Courbe Kc FAO-56 & Demande en Eau' : 'FAO-56 Crop Coefficient Kc & Daily Evapotranspiration'}
              </div>
              <Badge variant="outline" className="text-[11px] font-mono">
                {zoneNames[selectedZone].en.split(' (')[0]} Zone
              </Badge>
            </div>

            {/* Custom SVG Kc Curve */}
            <div className="w-full h-24 sm:h-28 relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 100" preserveAspectRatio="none">
                {/* Gridlines */}
                <line x1="0" y1="20" x2="1000" y2="20" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4" />
                <line x1="0" y1="50" x2="1000" y2="50" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4" />
                <line x1="0" y1="80" x2="1000" y2="80" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4" />

                {/* Stage shaded areas */}
                {crop.stages.map((st, i) => {
                  const xStart = ((st.startDay - 1) / crop.seasonLengthDays) * 1000;
                  const xEnd = (st.endDay / crop.seasonLengthDays) * 1000;
                  const isCurrent = st.id === activeStage.id;
                  return (
                    <rect
                      key={st.id}
                      x={xStart}
                      y="0"
                      width={xEnd - xStart}
                      height="100"
                      fill={isCurrent ? st.colorScheme.accentHex : 'currentColor'}
                      fillOpacity={isCurrent ? 0.15 : i % 2 === 0 ? 0.03 : 0.06}
                    />
                  );
                })}

                {/* Kc Curve Polygon / Path */}
                {(() => {
                  const points = crop.stages.map((st, i) => {
                    const midDay = (st.startDay + st.endDay) / 2;
                    const x = (midDay / crop.seasonLengthDays) * 1000;
                    // Invert Kc (max kc ~1.3 = y:10, min kc ~0.2 = y:85)
                    const y = 90 - (st.kc / 1.35) * 80;
                    return { x, y, stage: st };
                  });

                  // Generate smooth path
                  const pathD = points.reduce((acc, p, idx) => {
                    if (idx === 0) return `M 0,${points[0].y} L ${p.x},${p.y}`;
                    return `${acc} L ${p.x},${p.y}`;
                  }, '') + ` L 1000,${points[points.length - 1].y}`;

                  const areaD = `${pathD} L 1000,100 L 0,100 Z`;

                  return (
                    <g>
                      <path d={areaD} fill="url(#kcGradient)" fillOpacity="0.25" />
                      <path d={pathD} fill="none" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
                      {points.map((p, idx) => (
                        <circle
                          key={idx}
                          cx={p.x}
                          cy={p.y}
                          r={p.stage.id === activeStage.id ? '6' : '3.5'}
                          fill={p.stage.id === activeStage.id ? '#0284c7' : '#ffffff'}
                          stroke="#0284c7"
                          strokeWidth="2"
                        />
                      ))}
                    </g>
                  );
                })()}

                <defs>
                  <linearGradient id="kcGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Active Day Vertical Line Pin */}
                {(() => {
                  const xPin = (activeDay / crop.seasonLengthDays) * 1000;
                  return (
                    <g>
                      <line x1={xPin} y1="0" x2={xPin} y2="100" stroke="#ea580c" strokeWidth="2.5" strokeDasharray="3" />
                      <circle cx={xPin} cy="10" r="4" fill="#ea580c" />
                    </g>
                  );
                })()}
              </svg>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/40 text-xs">
              <div className="bg-background/80 p-2 rounded-md border border-border/50">
                <div className="text-[10px] text-muted-foreground font-medium">
                  {lang === 'ar' ? 'معامل الاستهلاك الفعلي (Kc)' : lang === 'fr' ? 'Coefficient Cultural (Kc)' : 'Current Kc Midpoint'}
                </div>
                <div className="text-sm font-bold font-mono text-sky-700 dark:text-sky-300">
                  {activeStage.kc.toFixed(2)}
                </div>
              </div>

              <div className="bg-background/80 p-2 rounded-md border border-border/50">
                <div className="text-[10px] text-muted-foreground font-medium">
                  {lang === 'ar' ? 'استهلاك الماء اليومي' : lang === 'fr' ? 'Demande Hydrique / Jour' : 'Daily Water Need'}
                </div>
                <div className="text-sm font-bold font-mono text-sky-700 dark:text-sky-300">
                  {activeStage.irrigation.waterDemandMmPerDay[selectedZone]} mm/d ({activeStage.irrigation.waterDemandMmPerDay[selectedZone] * 10} m³/ha/d)
                </div>
              </div>

              <div className="bg-background/80 p-2 rounded-md border border-border/50">
                <div className="text-[10px] text-muted-foreground font-medium">
                  {lang === 'ar' ? 'حساسية الإجهاد المائي' : lang === 'fr' ? 'Sensibilité au Stress' : 'Drought Sensitivity'}
                </div>
                <div className="text-sm font-bold">
                  {activeStage.irrigation.stressSensitivity === 'critical' ? (
                    <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                      🔴 {lang === 'ar' ? 'حرجة جداً' : lang === 'fr' ? 'Critique' : 'Critical'}
                    </span>
                  ) : activeStage.irrigation.stressSensitivity === 'high' ? (
                    <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                      🟠 {lang === 'ar' ? 'عالية' : lang === 'fr' ? 'Élevée' : 'High'}
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      🟢 {lang === 'ar' ? 'معتدلة' : lang === 'fr' ? 'Modérée' : 'Moderate'}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-background/80 p-2 rounded-md border border-border/50">
                <div className="text-[10px] text-muted-foreground font-medium">
                  {lang === 'ar' ? 'الدرجات الحرارية المجمعة' : lang === 'fr' ? 'Degrés-Jours Cumulés' : 'Growing Degree Days'}
                </div>
                <div className="text-sm font-bold font-mono text-amber-700 dark:text-amber-300">
                  {activeStage.gddAccumulated} °C·d (GDD)
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Active Stage Drilldown & Overlays Bento Grid */}
      <div className="space-y-4">
        {/* Stage Hero Banner */}
        <div className={`p-4 sm:p-5 rounded-xl border ${activeStage.colorScheme.bg} ${activeStage.colorScheme.border} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl p-1.5 bg-background rounded-lg shadow-2xs border border-border/50">
                {activeStage.emoji}
              </span>
              <div>
                <h3 className={`text-lg sm:text-xl font-bold ${activeStage.colorScheme.text} flex items-center gap-2`}>
                  {activeStage.name[lang]}
                  <Badge variant="secondary" className="font-mono text-xs">
                    {activeStage.bbchScale}
                  </Badge>
                </h3>
                <p className="text-xs text-muted-foreground">
                  {lang === 'ar' ? 'الفترة الزمنية:' : lang === 'fr' ? 'Fenêtre temporelle :' : 'Active Stage Duration:'}{' '}
                  <strong className="text-foreground">Day {activeStage.startDay} to Day {activeStage.endDay}</strong> ({activeStage.endDay - activeStage.startDay + 1} {lang === 'ar' ? 'يوماً' : lang === 'fr' ? 'jours' : 'days'})
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-foreground/90 pt-2 max-w-3xl">
              {activeStage.description[lang]}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <Badge variant="outline" className="bg-background px-3 py-1 font-mono text-xs">
              FAO-56 Kc: <strong>{activeStage.kc.toFixed(2)}</strong>
            </Badge>
            <Badge variant="outline" className="bg-background px-3 py-1 text-xs">
              Depth: <strong>{activeStage.irrigation.rootDepthCm} cm</strong>
            </Badge>
          </div>
        </div>

        {/* 4 Overlaid Sub-Panels (Irrigation, Nutrients, Operations, Hazards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Overlay A: 💧 Irrigation Schedule & Water Management */}
          {showIrrigationOverlay && (
            <Card className="border-sky-200 dark:border-sky-900/60 bg-sky-50/30 dark:bg-sky-950/20 shadow-xs">
              <CardHeader className="p-4 pb-2 border-b border-sky-100 dark:border-sky-900/40">
                <CardTitle className="text-sm font-bold text-sky-900 dark:text-sky-200 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-sky-600" />
                    {lang === 'ar' ? 'برنامج الري والموازنة المائية' : lang === 'fr' ? 'Programme d’Irrigation & Bilan Hydrique' : 'Stage Irrigation & Water Demand Schedule'}
                  </span>
                  <Badge variant="outline" className="border-sky-300 text-sky-700 dark:text-sky-300 text-[10px]">
                    Interval: {activeStage.irrigation.irrigationIntervalDays} {lang === 'ar' ? 'أيام' : lang === 'fr' ? 'jours' : 'days'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-2 bg-background/80 p-2.5 rounded-lg border border-sky-200/60 dark:border-sky-900/40">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">{lang === 'ar' ? 'الاستهلاك اليومي' : lang === 'fr' ? 'Consommation' : 'Daily Demand'}</span>
                    <strong className="text-sky-700 dark:text-sky-300 font-mono text-sm">
                      {activeStage.irrigation.waterDemandMmPerDay[selectedZone]} mm/d
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">{lang === 'ar' ? 'الحجم بالهكتار' : lang === 'fr' ? 'Volume / Ha' : 'Ha Volume'}</span>
                    <strong className="text-foreground font-mono text-sm">
                      {activeStage.irrigation.waterDemandMmPerDay[selectedZone] * 10} m³/ha/d
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">{lang === 'ar' ? 'عمق الجذور' : lang === 'fr' ? 'Enracinement' : 'Root Depth'}</span>
                    <strong className="text-foreground font-mono text-sm">
                      {activeStage.irrigation.rootDepthCm} cm
                    </strong>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-sky-950 dark:text-sky-200 block">
                    {lang === 'ar' ? 'التوجيهات التكتيكية للري:' : lang === 'fr' ? 'Consignes tactiques d’arrosage :' : 'Tactical Irrigation Guidance:'}
                  </span>
                  <p className="text-muted-foreground leading-relaxed bg-background/60 p-2.5 rounded-md border border-border/40">
                    {activeStage.irrigation.tacticalGuidance[lang]}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Overlay B: 🌿 Fertigation & Nutrient Application Schedule */}
          {showNutrientOverlay && (
            <Card className="border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs">
              <CardHeader className="p-4 pb-2 border-b border-emerald-100 dark:border-emerald-900/40">
                <CardTitle className="text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-emerald-600" />
                    {lang === 'ar' ? 'برنامج التسميد والتغذية التخصصية' : lang === 'fr' ? 'Formules de Fertigation & Nutriments' : 'Fertigation & Nutrient Schedule (NPK+)'}
                  </span>
                  <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:text-emerald-300 text-[10px]">
                    Method: {activeStage.nutrients.applicationMethod}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                {/* NPK Distribution Pills */}
                <div className="grid grid-cols-3 gap-2 bg-background/80 p-2.5 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40 font-mono">
                  <div className="bg-emerald-500/10 p-1.5 rounded">
                    <span className="text-[10px] text-muted-foreground block">N (Nitrogen)</span>
                    <strong className="text-emerald-700 dark:text-emerald-300 text-sm">
                      {activeStage.nutrients.stageTotalsKgHa.n} kg/ha
                    </strong>
                    <span className="text-[10px] text-muted-foreground block">({activeStage.nutrients.pctOfSeasonalTotal.n}% total)</span>
                  </div>
                  <div className="bg-amber-500/10 p-1.5 rounded">
                    <span className="text-[10px] text-muted-foreground block">P₂O₅ (Phosphate)</span>
                    <strong className="text-amber-700 dark:text-amber-300 text-sm">
                      {activeStage.nutrients.stageTotalsKgHa.p} kg/ha
                    </strong>
                    <span className="text-[10px] text-muted-foreground block">({activeStage.nutrients.pctOfSeasonalTotal.p}% total)</span>
                  </div>
                  <div className="bg-indigo-500/10 p-1.5 rounded">
                    <span className="text-[10px] text-muted-foreground block">K₂O (Potassium)</span>
                    <strong className="text-indigo-700 dark:text-indigo-300 text-sm">
                      {activeStage.nutrients.stageTotalsKgHa.k} kg/ha
                    </strong>
                    <span className="text-[10px] text-muted-foreground block">({activeStage.nutrients.pctOfSeasonalTotal.k}% total)</span>
                  </div>
                </div>

                {/* Recommended Fertilizers */}
                <div className="space-y-1">
                  <span className="font-semibold text-emerald-950 dark:text-emerald-200 block">
                    {lang === 'ar' ? 'الأسمدة والمواد الموصى بها:' : lang === 'fr' ? 'Engrais et formules recommandées :' : 'Recommended Fertilizer Formulas:'}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {activeStage.nutrients.recommendedFormulas.map((f, i) => (
                      <span key={i} className="bg-background px-2 py-1 rounded text-[11px] font-medium border border-border/50 text-foreground">
                        {f}
                      </span>
                    ))}
                  </div>
                  <p className="text-muted-foreground leading-relaxed pt-1">
                    {activeStage.nutrients.tacticalGuidance[lang]}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Overlay C: 🛡️ Stage-Specific Operations & IPM Tasks */}
          {showTasksOverlay && (
            <Card className="border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-xs">
              <CardHeader className="p-4 pb-2 border-b border-indigo-100 dark:border-indigo-900/40">
                <CardTitle className="text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    {lang === 'ar' ? 'العمليات الحقلية والوقاية في هذا الطور' : lang === 'fr' ? 'Travaux & Protection Phyto du Stade' : 'Stage Field Operations & IPM Tasks'}
                  </span>
                  <Badge variant="outline" className="border-indigo-300 text-indigo-700 dark:text-indigo-300 text-[10px]">
                    {activeStage.tasks.length} {lang === 'ar' ? 'مهام' : lang === 'fr' ? 'tâches' : 'tasks'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5 text-xs">
                {activeStage.tasks.map(task => (
                  <div
                    key={task.id}
                    className="p-2.5 rounded-lg bg-background border border-border/60 flex flex-col justify-between gap-2 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            task.priority === 'critical'
                              ? 'bg-rose-500'
                              : task.priority === 'high'
                              ? 'bg-amber-500'
                              : 'bg-indigo-500'
                          }`} />
                          {task.title[lang]}
                        </div>
                        <p className="text-muted-foreground leading-normal">
                          {task.details[lang]}
                        </p>
                      </div>

                      <Badge variant="secondary" className="font-mono text-[10px] shrink-0">
                        Day {task.timingDay}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-end pt-1 border-t border-border/30">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[11px] px-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 gap-1 font-medium"
                        onClick={() => handleAddStageTaskToBook(task, activeStage)}
                      >
                        <Plus className="w-3 h-3" />
                        {lang === 'ar' ? 'إضافة إلى المخطط اليومي' : lang === 'fr' ? 'Ajouter au planning' : 'Schedule in Planner'}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Overlay D: ⚠️ Agro-Climatic Hazards & Prevention */}
          {showHazardsOverlay && (
            <Card className="border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 shadow-xs">
              <CardHeader className="p-4 pb-2 border-b border-amber-100 dark:border-amber-900/40">
                <CardTitle className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    {lang === 'ar' ? 'مخاطر الطور والإجراءات الوقائية' : lang === 'fr' ? 'Risques Agro-Climatiques du Stade' : 'Stage Hazards & Prevention Protocol'}
                  </span>
                  <Badge variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-300 text-[10px]">
                    {activeStage.riskAlerts.length} {lang === 'ar' ? 'تنبيهات' : lang === 'fr' ? 'alertes' : 'alerts'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5 text-xs">
                {activeStage.riskAlerts.map((risk, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border ${
                      risk.severity === 'danger'
                        ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-200'
                        : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-200'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 mb-1">
                      <Flame className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      {risk.title[lang]}
                    </div>
                    <p className="text-muted-foreground dark:text-foreground/80 leading-normal">
                      {risk.description[lang]}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
