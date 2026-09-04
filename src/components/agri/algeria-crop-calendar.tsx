'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  CalendarDays,
  Calendar,
  Sprout,
  Droplets,
  Sun,
  Snowflake,
  CloudRain,
  Flame,
  Shield,
  Check,
  Copy,
  Share2,
  Printer,
  Search,
  Filter,
  Layers,
  BookOpen,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Sparkles,
  SlidersHorizontal,
  ArrowUpRight,
  Wrench,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  ExternalLink,
  ChevronUp,
  Tag,
  Compass,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { copyFor, useTranslation, type Language } from '@/lib/language-store';
import {
  ALGERIA_CALENDAR_MONTHS,
  ALGERIA_CALENDAR_ENTRIES,
  CALENDAR_ACTION_LABELS,
  CALENDAR_CROP_LABELS,
  CALENDAR_SECTION_LABELS,
  getCalendarCropKeys,
  getCalendarCropLabel,
  type AlgeriaCalendarEntry,
  type AlgeriaCalendarMonth,
  type CalendarActionType,
  type CalendarSection,
} from '@/lib/algeria-crop-calendar';
import {
  ALGERIA_MONTH_CLIMATE,
  getMonthClimate,
  type AlgeriaZoneClimate,
} from '@/lib/algeria-calendar-climate';
import { SmartDayPlannerPanel } from '@/components/agri/smart-day-planner-panel';
import { CropPhenologyTimeline } from '@/components/agri/crop-phenology-timeline';
import { type SmartPlannerItem } from '@/lib/smart-day-planner';
import { toAlgeriaCalendarId } from '@/lib/crop-id-unified';

// Distinct, eye-safe colors for months matching seasonal rhythm
const MONTH_ACCENTS = [
  '#0284c7', // 1 Jan: Deep Blue / Winter
  '#0ea5e9', // 2 Feb: Light Blue
  '#059669', // 3 Mar: Emerald Spring
  '#10b981', // 4 Apr: Green
  '#84cc16', // 5 May: Lime
  '#eab308', // 6 Jun: Gold Summer
  '#f97316', // 7 Jul: Orange Heat
  '#ea580c', // 8 Aug: Deep Orange
  '#d97706', // 9 Sep: Amber Autumn
  '#b45309', // 10 Oct: Russet
  '#7c3aed', // 11 Nov: Purple
  '#4338ca', // 12 Dec: Indigo Winter
];

const ACTION_CONFIG: Record<
  CalendarActionType,
  {
    icon: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
  }
> = {
  sowing: { icon: '↗', bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-800', dot: '#10b981' },
  harvest: { icon: '✦', bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-800', dot: '#f59e0b' },
  irrigation: { icon: '💧', bg: 'bg-sky-500/10 dark:bg-sky-500/20', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-300 dark:border-sky-800', dot: '#0ea5e9' },
  fertilization: { icon: '＋', bg: 'bg-purple-500/10 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-800', dot: '#8b5cf6' },
  soil: { icon: '🚜', bg: 'bg-stone-500/10 dark:bg-stone-500/20', text: 'text-stone-700 dark:text-stone-300', border: 'border-stone-300 dark:border-stone-800', dot: '#78716c' },
  weedManagement: { icon: '✂', bg: 'bg-orange-500/10 dark:bg-orange-500/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-800', dot: '#f97316' },
  maintenance: { icon: '⚙', bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-300 dark:border-indigo-800', dot: '#6366f1' },
  cropProtection: { icon: '🛡️', bg: 'bg-rose-500/10 dark:bg-rose-500/20', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-300 dark:border-rose-800', dot: '#f43f5e' },
  observation: { icon: '👁', bg: 'bg-teal-500/10 dark:bg-teal-500/20', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-300 dark:border-teal-800', dot: '#14b8a6' },
};

const TOP_FEATURED_CROPS = [
  'wheat',
  'barley',
  'potato',
  'market-tomato',
  'olive',
  'citrus',
  'fava-bean',
  'chickpea',
  'grapevine',
  'bersim',
  'sunflower',
  'cucumber',
];

type ActionFilter = 'all' | CalendarActionType;
type SectionFilter = 'all' | CalendarSection;
type CalendarViewMode = 'smart-planner' | 'phenology' | 'operations' | 'matrix' | 'lifecycle' | 'checklist' | 'provenance';

function localizedCopy(language: Language, copy: { en: string; fr: string; ar: string }): string {
  return copy[language] ?? copy.en;
}

function entryMatches(
  entry: AlgeriaCalendarEntry,
  selectedCrops: string[],
  actionFilter: ActionFilter,
  sectionFilter: SectionFilter,
  searchQuery: string
): boolean {
  if (selectedCrops.length > 0 && !entry.cropKeys.some(k => selectedCrops.includes(k))) {
    return false;
  }
  if (actionFilter !== 'all' && !entry.actionTypes.includes(actionFilter)) {
    return false;
  }
  if (sectionFilter !== 'all' && entry.section !== sectionFilter) {
    return false;
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    const matchCrop = entry.cropContext.toLowerCase().includes(q);
    const matchOps = entry.operations.some(op => op.toLowerCase().includes(q));
    const matchKeys = entry.cropKeys.some(k => k.toLowerCase().includes(q));
    if (!matchCrop && !matchOps && !matchKeys) return false;
  }
  return true;
}

export function AlgeriaCropCalendar({ onSetupFarm }: { onSetupFarm?: () => void }) {
  const { language, isRTL } = useTranslation();
  const currentRealMonth = useMemo(() => new Date().getMonth() + 1, []);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentRealMonth);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('operations');
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [cropSearch, setCropSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>('all');
  const [showCropPicker, setShowCropPicker] = useState(false);
  const [selectedZone, setSelectedZone] = useState<'littoral' | 'plateaus' | 'sahara'>('littoral');
  const [selectedLifecycleCrop, setSelectedLifecycleCrop] = useState<string>('wheat');
  // Translate the canonical lifecycle crop ID (e.g. 'wheat', 'grapes') to the
  // CROP_PHENOLOGY_DATA ID (e.g. 'durum-wheat', 'grapevine') expected by the
  // CropPhenologyTimeline. Done in one place via the unified crop ID mapper.
  const phenologyCropId = toAlgeriaCalendarId(selectedLifecycleCrop);
  const [completedChecklistTasks, setCompletedChecklistTasks] = useState<Record<string, boolean>>({});

  // Fast pre-calculated crop keys
  const allCropKeys = useMemo(() => getCalendarCropKeys(), []);

  const filteredCropKeys = useMemo(() => {
    const query = cropSearch.trim().toLowerCase();
    if (!query) return allCropKeys;
    return allCropKeys.filter(key => {
      const label = getCalendarCropLabel(key, language).toLowerCase();
      const english = CALENDAR_CROP_LABELS[key]?.en.toLowerCase() ?? key;
      const french = CALENDAR_CROP_LABELS[key]?.fr.toLowerCase() ?? key;
      return label.includes(query) || english.includes(query) || french.includes(query) || key.includes(query);
    });
  }, [allCropKeys, cropSearch, language]);

  const month = useMemo(
    () => ALGERIA_CALENDAR_MONTHS[selectedMonth - 1] ?? ALGERIA_CALENDAR_MONTHS[0],
    [selectedMonth]
  );

  const monthClimate = useMemo(() => getMonthClimate(selectedMonth), [selectedMonth]);

  // Filtered entries for current active month
  const visibleEntries = useMemo(
    () => month.entries.filter(entry => entryMatches(entry, selectedCrops, actionFilter, sectionFilter, searchQuery)),
    [month.entries, selectedCrops, actionFilter, sectionFilter, searchQuery]
  );

  // Month entry counts across all 12 months with current active filters
  const filteredMonthCounts = useMemo(
    () =>
      ALGERIA_CALENDAR_MONTHS.map(
        m => m.entries.filter(e => entryMatches(e, selectedCrops, actionFilter, sectionFilter, searchQuery)).length
      ),
    [selectedCrops, actionFilter, sectionFilter, searchQuery]
  );

  // Total active matches across year
  const totalYearMatches = useMemo(
    () => filteredMonthCounts.reduce((acc, count) => acc + count, 0),
    [filteredMonthCounts]
  );

  // Unique sections in current month results
  const visibleSections = useMemo(
    () => Array.from(new Set(visibleEntries.map(entry => entry.section))),
    [visibleEntries]
  );

  const toggleCrop = useCallback((cropKey: string) => {
    setSelectedCrops(curr => (curr.includes(cropKey) ? curr.filter(k => k !== cropKey) : [...curr, cropKey]));
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedCrops([]);
    setCropSearch('');
    setSearchQuery('');
    setActionFilter('all');
    setSectionFilter('all');
  }, []);

  const moveMonth = useCallback((offset: number) => {
    setSelectedMonth(current => ((current - 1 + offset + 12) % 12) + 1);
  }, []);

  const handleShareWhatsApp = (entry: AlgeriaCalendarEntry) => {
    const text = `🌱 *${entry.cropContext}* (${month.name[language]})\n` +
      entry.operations.map(op => `• ${op}`).join('\n') +
      `\n\n📖 _Source: ${entry.source.file} (${entry.source.printedPages})_ - *Formula Atlas DZ*`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyEntry = (entry: AlgeriaCalendarEntry) => {
    const text = `${entry.cropContext} (${month.name[language]}):\n` +
      entry.operations.map(op => `• ${op}`).join('\n') +
      `\n[Source: ${entry.source.file} - ${entry.source.printedPages}]`;
    navigator.clipboard.writeText(text);
    toast({
      title: copyFor(language, 'Copied to clipboard', 'تم النسخ إلى الحافظة', 'Copié dans le presse-papier'),
      description: copyFor(language, 'Operation details copied successfully', 'تم نسخ تفاصيل العملية بنجاح', 'Détails de l’opération copiés avec succès'),
    });
  };

  const toggleChecklistTask = (taskId: string) => {
    setCompletedChecklistTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const activeZoneData: AlgeriaZoneClimate = monthClimate.zones[selectedZone];

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Header Card */}
      <Card className="border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 via-background to-teal-50/50 shadow-sm dark:border-emerald-900/60 dark:from-emerald-950/25 dark:to-teal-950/20">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {copyFor(language, 'Algeria Agricultural Operations Calendar', 'التقويم الزراعي وعمليات المحاصيل في الجزائر', 'Calendrier des Opérations Culturales en Algérie')}
                </h1>
                <Badge className="bg-emerald-600/90 text-white dark:bg-emerald-600 font-mono text-[11px]">
                  100% INVA / MADR
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
                {copyFor(
                  language,
                  'Official source-traceable calendar: 12 months, 7 agricultural sectors, and verified regional operations for cereals, vegetables, greenhouses, forages, and perennial orchards across Algeria.',
                  'المرجع الرسمي الموثق: 12 شهراً، 7 قطاعات زراعية، وعمليات حقلية معتمدة للحبوب، الخضروات، البيوت المحمية، الأعلاف، والأشجار المثمرة عبر مختلف ولايات الجزائر.',
                  'Référentiel officiel traçable : 12 mois, 7 filières agricoles, et opérations culturales vérifiées pour grandes cultures, maraîchage, serres, fourrages et arboriculture à travers l’Algérie.'
                )}
              </p>
            </div>

            {/* Quick View Mode Switcher Pills */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-background/80 backdrop-blur border border-border shadow-xs">
              <Button
                variant={viewMode === 'smart-planner' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('smart-planner')}
                className={`h-8 px-3 text-xs gap-1.5 border-emerald-500/40 ${
                  viewMode === 'smart-planner'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                    : 'bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                <span className="font-semibold">{copyFor(language, 'Smart Day Planner', 'المخطط اليومي الذكي', 'Planificateur Intelligent')}</span>
                <span className="px-1 py-0.2 text-[9px] font-bold rounded bg-emerald-800/80 text-emerald-100 dark:bg-emerald-900">AI</span>
              </Button>
              <Button
                variant={viewMode === 'phenology' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('phenology')}
                className={`h-8 px-3 text-xs gap-1.5 ${
                  viewMode === 'phenology'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5 text-sky-400" />
                <span className="font-semibold">{copyFor(language, 'Phenology Timeline', 'الأطوار الفينولوجية', 'Phénologie & Besoins')}</span>
                <span className="px-1 py-0.2 text-[9px] font-bold rounded bg-sky-500/20 text-sky-700 dark:text-sky-300">BBCH</span>
              </Button>
              <Button
                variant={viewMode === 'operations' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('operations')}
                className={`h-8 px-3 text-xs gap-1.5 ${viewMode === 'operations' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'text-muted-foreground'}`}
              >
                <Calendar className="h-3.5 w-3.5" />
                {copyFor(language, 'Monthly View', 'العرض الشهري', 'Vue Mensuelle')}
              </Button>
              <Button
                variant={viewMode === 'matrix' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('matrix')}
                className={`h-8 px-3 text-xs gap-1.5 ${viewMode === 'matrix' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'text-muted-foreground'}`}
              >
                <Layers className="h-3.5 w-3.5" />
                {copyFor(language, 'Annual Matrix', 'المصفوفة السنوية', 'Matrice Annuelle')}
              </Button>
              <Button
                variant={viewMode === 'lifecycle' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('lifecycle')}
                className={`h-8 px-3 text-xs gap-1.5 ${viewMode === 'lifecycle' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'text-muted-foreground'}`}
              >
                <Sprout className="h-3.5 w-3.5" />
                {copyFor(language, 'Crop 360°', 'دورة المحصول 360°', 'Cycle Culture 360°')}
              </Button>
              <Button
                variant={viewMode === 'checklist' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('checklist')}
                className={`h-8 px-3 text-xs gap-1.5 ${viewMode === 'checklist' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'text-muted-foreground'}`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {copyFor(language, 'Field Checklist', 'قائمة العمل الحقلية', 'Check-list de Terrain')}
              </Button>
              <Button
                variant={viewMode === 'provenance' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('provenance')}
                className={`h-8 px-3 text-xs gap-1.5 ${viewMode === 'provenance' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'text-muted-foreground'}`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                {copyFor(language, 'Sources', 'المصادر', 'Sources')}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 12-Month Interactive Scrub Ribbon */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">
              {copyFor(language, 'Select Month', 'اختر الشهر', 'Sélectionner le mois')}
            </span>
            <span className="text-[11px] text-muted-foreground">
              ({totalYearMatches} {copyFor(language, 'matching operations this year', 'عملية مطابقة خلال السنة', 'opérations correspondantes sur l’année')})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedMonth(currentRealMonth)}
              className="h-7 text-[11px] gap-1 px-2 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
            >
              <Clock className="h-3 w-3" />
              {copyFor(language, 'Jump to Current Month', 'الشهر الحالي', 'Mois Actuel')}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => moveMonth(-1)}
              title={copyFor(language, 'Previous Month', 'الشهر السابق', 'Mois Précédent')}
            >
              {isRTL ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => moveMonth(1)}
              title={copyFor(language, 'Next Month', 'الشهر التالي', 'Mois Suivant')}
            >
              {isRTL ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* 12 Months Grid Bar */}
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-12">
          {ALGERIA_CALENDAR_MONTHS.map((m, idx) => {
            const isSelected = m.number === selectedMonth;
            const isCurrent = m.number === currentRealMonth;
            const count = filteredMonthCounts[idx];
            return (
              <button
                key={m.number}
                type="button"
                onClick={() => setSelectedMonth(m.number)}
                className={`relative group flex flex-col items-center justify-between rounded-xl border p-2 text-center transition-all duration-150 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-500/20 dark:bg-emerald-950/40 dark:border-emerald-600'
                    : 'border-border/80 bg-card hover:border-emerald-300 hover:bg-muted/30 dark:hover:border-emerald-800'
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                )}
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-bold text-white shadow-xs"
                  style={{ backgroundColor: MONTH_ACCENTS[idx] }}
                >
                  {m.number}
                </div>
                <span className={`mt-1 block text-[11px] font-semibold truncate max-w-full ${isSelected ? 'text-emerald-900 dark:text-emerald-200' : 'text-foreground'}`}>
                  {m.name[language]}
                </span>
                <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-mono text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: MONTH_ACCENTS[idx] }}></span>
                  {count} {copyFor(language, 'ops', 'عملية', 'ops')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Control Center */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-3.5 sm:p-4 space-y-3.5">
          {/* Row 1: Search, Crop Picker, Activity Filter */}
          <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr]">
            {/* Search within operations */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">
                {copyFor(language, 'Instant Operation Search', 'البحث السريع في العمليات', 'Recherche Rapide d’Opérations')}
              </Label>
              <div className="relative mt-1">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={copyFor(language, 'Search crops, urea dose, spraying, weed control...', 'ابحث عن محصول، جرعة سماد، ري، مبيد...', 'Rechercher culture, dose urée, désherbage...')}
                  className="h-9 ps-9 pe-8 text-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Crop Selector Button & Multi-select */}
            <div className="relative">
              <Label className="text-xs font-semibold text-muted-foreground">
                {copyFor(language, 'Filter by Crop', 'تصفية حسب المحصول', 'Filtrer par Culture')}
              </Label>
              <div className="mt-1 flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCropPicker(prev => !prev)}
                  className="h-9 w-full justify-between text-xs px-3 font-normal"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Sprout className="h-3.5 w-3.5 text-emerald-600" />
                    {selectedCrops.length === 0
                      ? copyFor(language, 'All Crops (50+ Algerian crops)', 'كل المحاصيل (أكثر من 50 محصول)', 'Toutes les cultures (50+)')
                      : `${selectedCrops.length} ${copyFor(language, 'selected', 'محددة', 'sélectionnée(s)')}`}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
                {selectedCrops.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCrops([])}
                    className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {/* Crop Picker Dropdown Modal */}
              {showCropPicker && (
                <div className="absolute z-30 mt-1.5 w-[340px] sm:w-[420px] max-w-[90vw] rounded-xl border border-border bg-popover p-3 shadow-xl">
                  <div className="relative">
                    <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={cropSearch}
                      onChange={e => setCropSearch(e.target.value)}
                      placeholder={copyFor(language, 'Type to filter crops...', 'اكتب للبحث عن محصول...', 'Tapez pour filtrer les cultures...')}
                      className="h-8 ps-8 text-xs"
                      autoFocus
                    />
                  </div>

                  {/* Quick Select Favorites */}
                  <div className="mt-2 flex flex-wrap gap-1 border-b border-border/70 pb-2">
                    <span className="text-[10px] text-muted-foreground self-center me-1">
                      {copyFor(language, 'Top:', 'الأبرز:', 'Top:')}
                    </span>
                    {TOP_FEATURED_CROPS.map(key => {
                      const checked = selectedCrops.includes(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleCrop(key)}
                          className={`rounded-md px-1.5 py-0.5 text-[10px] transition-colors ${
                            checked ? 'bg-emerald-600 text-white font-medium' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                          }`}
                        >
                          {getCalendarCropLabel(key, language)}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2 grid max-h-56 grid-cols-2 gap-1 overflow-y-auto pr-1 text-xs">
                    {filteredCropKeys.map(cropKey => {
                      const isChecked = selectedCrops.includes(cropKey);
                      return (
                        <button
                          key={cropKey}
                          type="button"
                          onClick={() => toggleCrop(cropKey)}
                          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-start transition-colors ${
                            isChecked ? 'bg-emerald-50 text-emerald-900 font-medium dark:bg-emerald-950/50 dark:text-emerald-200' : 'hover:bg-muted text-foreground'
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                              isChecked ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-muted-foreground/30'
                            }`}
                          >
                            {isChecked && <Check className="h-3 w-3" />}
                          </span>
                          <span className="truncate">{getCalendarCropLabel(cropKey, language)}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2 text-[11px]">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCrops([])}
                      className="h-7 text-xs text-muted-foreground"
                    >
                      {copyFor(language, 'Clear All', 'إلغاء التحديد', 'Tout décocher')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setShowCropPicker(false)}
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {copyFor(language, 'Done', 'تم', 'Terminé')}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Activity Action Filter */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">
                {copyFor(language, 'Activity Filter', 'نوع النشاط الزراعي', 'Type d’Activité')}
              </Label>
              <select
                aria-label={copyFor(language, 'Activity filter', 'تصفية النشاط', 'Filtre d’activité')}
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value as ActionFilter)}
                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">{copyFor(language, '✦ All Activities (9 categories)', '✦ كل الأنشطة (9 فئات)', '✦ Toutes les activités (9 catégories)')}</option>
                {Object.entries(CALENDAR_ACTION_LABELS).map(([actionKey, labels]) => (
                  <option key={actionKey} value={actionKey}>
                    {ACTION_CONFIG[actionKey as CalendarActionType]?.icon} {localizedCopy(language, labels)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Category Tabs with Item Counts */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/60">
            <span className="text-[11px] font-semibold text-muted-foreground me-1">
              {copyFor(language, 'Sectors:', 'القطاعات:', 'Filières:')}
            </span>
            <button
              type="button"
              onClick={() => setSectionFilter('all')}
              className={`rounded-lg px-2.5 py-1 text-xs transition-all ${
                sectionFilter === 'all'
                  ? 'bg-emerald-600 text-white font-medium shadow-xs'
                  : 'bg-muted/70 hover:bg-muted text-muted-foreground'
              }`}
            >
              {copyFor(language, 'All Sectors', 'كل القطاعات', 'Toutes les filières')}
            </button>
            {Object.entries(CALENDAR_SECTION_LABELS).map(([secKey, secLabel]) => {
              const isActive = sectionFilter === secKey;
              return (
                <button
                  key={secKey}
                  type="button"
                  onClick={() => setSectionFilter(secKey as SectionFilter)}
                  className={`rounded-lg px-2.5 py-1 text-xs transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white font-medium shadow-xs'
                      : 'bg-muted/70 hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {localizedCopy(language, secLabel)}
                </button>
              );
            })}
          </div>

          {/* Active Filter Badges */}
          {(selectedCrops.length > 0 || actionFilter !== 'all' || sectionFilter !== 'all' || searchQuery) && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-dashed border-border/80 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">
                  {copyFor(language, 'Active Filters:', 'المرشحات النشطة:', 'Filtres actifs:')}
                </span>
                {selectedCrops.map(k => (
                  <Badge key={k} variant="secondary" className="gap-1 text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200">
                    {getCalendarCropLabel(k, language)}
                    <button type="button" onClick={() => toggleCrop(k)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {actionFilter !== 'all' && (
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    {localizedCopy(language, CALENDAR_ACTION_LABELS[actionFilter])}
                    <button type="button" onClick={() => setActionFilter('all')}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {sectionFilter !== 'all' && (
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    {localizedCopy(language, CALENDAR_SECTION_LABELS[sectionFilter])}
                    <button type="button" onClick={() => setSectionFilter('all')}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1 text-[10px]">
                    &ldquo;{searchQuery}&rdquo;
                    <button type="button" onClick={() => setSearchQuery('')}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-6 text-[11px] text-muted-foreground hover:text-foreground"
              >
                {copyFor(language, 'Reset All', 'إعادة الضبط', 'Tout réinitialiser')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* VIEW 0: AI SMART DAY PLANNER */}
      {viewMode === 'smart-planner' && (
        <SmartDayPlannerPanel
          zone={selectedZone === 'plateaus' ? 'highPlateaus' : selectedZone === 'sahara' ? 'sahara' : 'coastal'}
          onZoneChange={z => setSelectedZone(z === 'highPlateaus' ? 'plateaus' : z === 'sahara' ? 'sahara' : 'littoral')}
          language={language}
        />
      )}

      {/* Quick Jump to Smart Day Planner CTA Banner (visible on standard views) */}
      {viewMode !== 'smart-planner' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-950/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span>{copyFor(language, 'AI Smart Day Planner Available', 'المخطط اليومي الذكي متاح الآن', 'Planificateur Intelligent Disponible')}</span>
                <Badge className="bg-emerald-600 text-white text-[10px] py-0 px-1.5">Gemini 3.7</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {copyFor(
                  language,
                  'Generate today’s tailored irrigation runs, stage-specific fertilizer doses, and scouting tasks for your active fields.',
                  'توليد جدول اليوم المخصص لجرعات الري والتسميد وأعمال المتابعة الحقلية لمزارعك النشطة.',
                  'Générez le planning d’irrigation, doses d’engrais et tâches du jour calés sur vos parcelles actives.'
                )}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setViewMode('smart-planner')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shrink-0 gap-1.5 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            {copyFor(language, 'Open Day Planner', 'فتح المخطط اليومي', 'Ouvrir le Planificateur')}
          </Button>
        </div>
      )}

      {/* VIEW 1: MONTHLY OPERATIONS CARDS */}
      {viewMode === 'operations' && (
        <div className="space-y-5">
          {/* Active Month Climatic Intelligence Banner */}
          <Card className="border-sky-200/80 bg-gradient-to-r from-sky-50/70 via-background to-blue-50/40 dark:border-sky-900/60 dark:from-sky-950/20 dark:to-blue-950/10">
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-sky-600 text-white gap-1 text-[11px]">
                      <Compass className="h-3 w-3" />
                      {month.name[language]} · {localizedCopy(language, monthClimate.seasonName)}
                    </Badge>
                    <span className="text-xs font-semibold text-foreground">
                      {copyFor(language, 'Algeria Regional Climate & Advisory Norms', 'المعايير المناخية والتوصيات الإقليمية للجزائر', 'Normes Climatiques Régionales & Conseils')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {localizedCopy(language, monthClimate.generalAdvisory)}
                  </p>
                </div>

                {/* Zone Switcher */}
                <div className="flex items-center gap-1 p-1 rounded-lg bg-background border border-border shrink-0 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedZone('littoral')}
                    className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      selectedZone === 'littoral' ? 'bg-sky-600 text-white' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {copyFor(language, 'Tell / Coastal', 'الساحل والتلي', 'Tell / Littoral')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedZone('plateaus')}
                    className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      selectedZone === 'plateaus' ? 'bg-sky-600 text-white' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {copyFor(language, 'High Plateaus', 'الهضاب العليا', 'Hauts Plateaux')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedZone('sahara')}
                    className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      selectedZone === 'sahara' ? 'bg-sky-600 text-white' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {copyFor(language, 'Sahara / Oasis', 'الصحراء والواحات', 'Sahara / Oasis')}
                  </button>
                </div>
              </div>

              {/* Climate Metrics Strip */}
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5 pt-3 border-t border-sky-100 dark:border-sky-900/40 text-xs">
                <div className="rounded-lg bg-card/60 p-2 border border-border/50">
                  <span className="text-[10px] text-muted-foreground block">
                    {copyFor(language, 'Temperature Norms', 'معدل الحرارة', 'Températures')}
                  </span>
                  <span className="font-semibold text-foreground">{activeZoneData.tempRange}</span>
                </div>
                <div className="rounded-lg bg-card/60 p-2 border border-border/50">
                  <span className="text-[10px] text-muted-foreground block">
                    {copyFor(language, 'Avg Evapotranspiration', 'البخر نتح ET₀', 'ET₀ moyenne')}
                  </span>
                  <span className="font-semibold text-sky-700 dark:text-sky-300 font-mono">
                    {activeZoneData.avgET0} mm/{copyFor(language, 'day', 'يوم', 'j')}
                  </span>
                </div>
                <div className="rounded-lg bg-card/60 p-2 border border-border/50">
                  <span className="text-[10px] text-muted-foreground block">
                    {copyFor(language, 'Monthly Rainfall', 'الأمطار الشهرية', 'Pluviométrie')}
                  </span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300 font-mono">
                    ~{activeZoneData.avgRainfall} mm
                  </span>
                </div>
                <div className="rounded-lg bg-card/60 p-2 border border-border/50">
                  <span className="text-[10px] text-muted-foreground block">
                    {copyFor(language, 'Frost / Heat Risk', 'مستوى خطر الصقيع/الحرارة', 'Risque Gel / Canicule')}
                  </span>
                  <div className="flex items-center gap-1 font-semibold">
                    {activeZoneData.frostRisk !== 'none' ? (
                      <span className={`text-[11px] font-medium ${activeZoneData.frostRisk === 'high' ? 'text-rose-600' : 'text-amber-600'}`}>
                        ❄️ {copyFor(language, `Frost: ${activeZoneData.frostRisk}`, `صقيع: ${activeZoneData.frostRisk}`, `Gel : ${activeZoneData.frostRisk}`)}
                      </span>
                    ) : activeZoneData.heatRisk !== 'none' ? (
                      <span className={`text-[11px] font-medium ${activeZoneData.heatRisk === 'high' ? 'text-rose-600' : 'text-amber-600'}`}>
                        🔥 {copyFor(language, `Heat: ${activeZoneData.heatRisk}`, `حرارة: ${activeZoneData.heatRisk}`, `Chaleur : ${activeZoneData.heatRisk}`)}
                      </span>
                    ) : (
                      <span className="text-emerald-600 text-[11px]">
                        ✓ {copyFor(language, 'Optimal Range', 'مدى ملائم', 'Zone optimale')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-4 lg:col-span-1 rounded-lg bg-card/60 p-2 border border-border/50">
                  <span className="text-[10px] text-muted-foreground block">
                    {copyFor(language, 'Daylight & Radiation', 'ساعات النهار والإشعاع', 'Jour & Rayonnement')}
                  </span>
                  <span className="font-semibold text-foreground text-[11px]">
                    {monthClimate.daylightHours} · {monthClimate.solarRadiationAvg}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Summary Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>{month.name[language]}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  ({visibleEntries.length} {copyFor(language, 'source operations', 'عملية موثقة', 'opérations documentées')})
                </span>
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {month.source.file} · {month.source.printedPages} · {month.source.pdfLength}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('checklist')}
                className="h-8 gap-1.5 text-xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                {copyFor(language, 'Generate Work Order', 'إنشاء خطة عمل', 'Générer ordre de travail')}
              </Button>
            </div>
          </div>

          {/* No results fallback */}
          {visibleEntries.length === 0 ? (
            <Card className="border-dashed p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {copyFor(language, 'No operations match your current filters for this month', 'لا توجد عمليات تطابق المرشحات المحددة لهذا الشهر', 'Aucune opération ne correspond aux filtres pour ce mois')}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                {copyFor(
                  language,
                  'Try clearing the crop or activity filters, or explore other months in the top scrubber.',
                  'جرب إزالة مرشح المحصول أو النشاط، أو استكشف أشهراً أخرى من الشريط العلوي.',
                  'Essayez d’effacer les filtres de culture ou d’activité, ou explorez d’autres mois.'
                )}
              </p>
              <Button size="sm" variant="outline" onClick={clearAllFilters} className="mt-4 text-xs">
                {copyFor(language, 'Clear all filters', 'مسح كل المرشحات', 'Effacer tous les filtres')}
              </Button>
            </Card>
          ) : (
            /* Operation Cards by Section */
            <div className="space-y-6">
              {visibleSections.map(section => {
                const entries = visibleEntries.filter(e => e.section === section);
                return (
                  <div key={section} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-600"></div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {localizedCopy(language, CALENDAR_SECTION_LABELS[section])}
                      </h3>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {entries.length}
                      </Badge>
                      <Separator className="flex-1" />
                    </div>

                    <div className="grid gap-3.5 md:grid-cols-2">
                      {entries.map(entry => (
                        <OperationCard
                          key={entry.id}
                          entry={entry}
                          monthName={month.name[language]}
                          language={language}
                          onCopy={() => handleCopyEntry(entry)}
                          onShare={() => handleShareWhatsApp(entry)}
                          onSelectCrop={cropKey => {
                            setSelectedLifecycleCrop(cropKey);
                            setViewMode('lifecycle');
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: ANNUAL MATRIX & GANTT VIEW */}
      {viewMode === 'matrix' && (
        <Card className="border-border/80 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-600" />
                  {copyFor(language, 'Annual 12-Month Crop Activity Matrix', 'مصفوفة الأنشطة الزراعية السنوية (12 شهراً)', 'Matrice Annuelle des Activités Culturales (12 Mois)')}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {copyFor(
                    language,
                    'Interactive Gantt timeline across all 12 months. Click any cell to jump into detailed monthly operations.',
                    'مخطط زمني تفاعلي على مدار 12 شهراً. اضغط على أي خلية للانتقال المباشر للعمليات التفصيلية.',
                    'Chronologie interactive sur 12 mois. Cliquez sur une cellule pour voir les opérations détaillées.'
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span> 1+ {copyFor(language, 'Ops', 'عمليات', 'Ops')}
                </span>
                <span className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 text-white font-medium">
                  <span className="h-2 w-2 rounded-full bg-white"></span> 3+ {copyFor(language, 'High', 'كثيف', 'Intense')}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                  <th className="sticky start-0 bg-background/95 backdrop-blur p-3 text-start z-10 w-48">
                    {copyFor(language, 'Crop & Species', 'المحصول والنوع', 'Culture & Espèce')}
                  </th>
                  {ALGERIA_CALENDAR_MONTHS.map(m => (
                    <th
                      key={m.number}
                      className={`p-2.5 text-center transition-colors cursor-pointer hover:bg-emerald-100/50 dark:hover:bg-emerald-950/30 ${
                        m.number === selectedMonth ? 'bg-emerald-100/80 text-emerald-900 font-bold dark:bg-emerald-950/70 dark:text-emerald-200' : ''
                      }`}
                      onClick={() => {
                        setSelectedMonth(m.number);
                        setViewMode('operations');
                      }}
                      title={copyFor(language, 'Click to view month', 'اضغط لعرض الشهر', 'Cliquer pour voir le mois')}
                    >
                      <div className="text-[11px]">{m.name[language].slice(0, 3)}</div>
                      <div className="text-[9px] font-mono text-muted-foreground">{m.number}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {(selectedCrops.length > 0 ? selectedCrops : allCropKeys).map(cropKey => {
                  return (
                    <tr key={cropKey} className="hover:bg-muted/30 transition-colors">
                      <td className="sticky start-0 bg-background/95 backdrop-blur p-2.5 font-medium text-foreground z-10 border-e border-border/40">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLifecycleCrop(cropKey);
                            setViewMode('lifecycle');
                          }}
                          className="flex items-center gap-1.5 text-start hover:text-emerald-600 transition-colors group"
                        >
                          <Sprout className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{getCalendarCropLabel(cropKey, language)}</span>
                          <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>
                      {ALGERIA_CALENDAR_MONTHS.map(m => {
                        const matchingEntries = m.entries.filter(
                          e => e.cropKeys.includes(cropKey) && entryMatches(e, selectedCrops, actionFilter, sectionFilter, searchQuery)
                        );
                        const count = matchingEntries.length;
                        const actions = Array.from(new Set(matchingEntries.flatMap(e => e.actionTypes)));

                        return (
                          <td key={m.number} className="p-1 text-center">
                            {count > 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMonth(m.number);
                                  setSelectedCrops([cropKey]);
                                  setViewMode('operations');
                                }}
                                className={`w-full py-1.5 rounded-md font-mono text-[11px] font-semibold transition-transform hover:scale-105 ${
                                  count >= 3
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200'
                                }`}
                                title={`${getCalendarCropLabel(cropKey, language)} in ${m.name[language]}: ${count} operations (${actions.join(', ')})`}
                              >
                                {count}
                              </button>
                            ) : (
                              <span className="text-muted-foreground/30 font-mono text-[10px]">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* VIEW: VISUAL CROP PHENOLOGY & MULTI-TRACK TIMELINE */}
      {viewMode === 'phenology' && (
        <CropPhenologyTimeline
          initialCropId={phenologyCropId}
          onSendTaskToPlanner={task => {
            toast({
              title: copyFor(language, 'Task Synced with Planner', 'تمت مزامنة المهمة مع المخطط', 'Tâche synchronisée avec le planificateur'),
              description: `${task.title} (${task.stage})`,
            });
          }}
        />
      )}

      {/* VIEW 3: SINGLE CROP 360° ANNUAL LIFECYCLE EXPLORER */}
      {viewMode === 'lifecycle' && (
        <div className="space-y-5">
          <Tabs defaultValue="phenology" className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-2 rounded-xl border border-border/60">
              <TabsList className="bg-background">
                <TabsTrigger value="phenology" className="text-xs gap-1.5 font-medium">
                  <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
                  {copyFor(language, 'Visual Phenology & Task Overlays (BBCH)', 'المخطط الفينولوجي التفاعلي (BBCH)', 'Chronologie Phénologique (BBCH)')}
                </TabsTrigger>
                <TabsTrigger value="annual-story" className="text-xs gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  {copyFor(language, '12-Month Agronomic Story', 'مسار العمليات السنوي (12 شهراً)', 'Itinéraire Annuel (12 Mois)')}
                </TabsTrigger>
              </TabsList>

              <div className="text-xs text-muted-foreground font-mono">
                {copyFor(language, 'Comprehensive Crop Cycle Modeling', 'نمذجة شاملة لدورة المحصول', 'Modélisation Complète du Cycle')}
              </div>
            </div>

            <TabsContent value="phenology" className="mt-4">
              <CropPhenologyTimeline
                initialCropId={phenologyCropId}
              />
            </TabsContent>

            <TabsContent value="annual-story" className="mt-4 space-y-5">
          <Card className="border-emerald-200/80 bg-gradient-to-r from-emerald-50/50 via-background to-teal-50/30 dark:border-emerald-900/60">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sprout className="h-4 w-4 text-emerald-600" />
                    {copyFor(language, '360° Crop Annual Operations Story', 'قصة العمليات السنوية المتكاملة للمحصول (360°)', 'Récit Annuel des Opérations de la Culture (360°)')}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {copyFor(
                      language,
                      'Select an Algerian crop to inspect its complete month-by-month trajectory from seedbed to harvest.',
                      'اختر محصولاً جزائرياً لمتابعة مسار عملياته شهراً بشهر من تحضير التربة والبذر حتى الحصاد والتسويق.',
                      'Sélectionnez une culture algérienne pour suivre son itinéraire technique mois par mois.'
                    )}
                  </CardDescription>
                </div>

                {/* Crop Selector dropdown */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-semibold shrink-0">
                    {copyFor(language, 'Select Crop:', 'اختر المحصول:', 'Culture :')}
                  </Label>
                  <select
                    aria-label={copyFor(language, 'Select Crop', 'اختر المحصول', 'Sélectionner la culture')}
                    value={selectedLifecycleCrop}
                    onChange={e => setSelectedLifecycleCrop(e.target.value)}
                    className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    {allCropKeys.map(k => (
                      <option key={k} value={k}>
                        {getCalendarCropLabel(k, language)} ({CALENDAR_CROP_LABELS[k]?.fr})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* 12 Months Timeline for the selected crop */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ALGERIA_CALENDAR_MONTHS.map(m => {
              const cropEntries = m.entries.filter(e => e.cropKeys.includes(selectedLifecycleCrop));
              const hasOps = cropEntries.length > 0;

              return (
                <Card
                  key={m.number}
                  className={`transition-all ${
                    hasOps
                      ? 'border-emerald-200 bg-card shadow-xs hover:border-emerald-400 dark:border-emerald-900/80'
                      : 'border-border/50 bg-muted/20 opacity-70'
                  }`}
                >
                  <CardHeader className="p-3 pb-2 border-b border-border/50 bg-muted/30 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold text-white"
                        style={{ backgroundColor: MONTH_ACCENTS[m.number - 1] }}
                      >
                        {m.number}
                      </span>
                      <span className="text-xs font-bold text-foreground">{m.name[language]}</span>
                    </div>
                    {hasOps ? (
                      <Badge className="bg-emerald-600/90 text-white text-[10px]">
                        {cropEntries.length} {copyFor(language, 'ops', 'عمليات', 'ops')}
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        {copyFor(language, 'Dormant / Off-season', 'فترة راحة / خارج الموسم', 'Repos végétatif')}
                      </span>
                    )}
                  </CardHeader>
                  <CardContent className="p-3 text-xs space-y-2">
                    {hasOps ? (
                      cropEntries.map(entry => (
                        <div key={entry.id} className="space-y-1.5">
                          <div className="flex flex-wrap gap-1">
                            {entry.actionTypes.map(act => (
                              <span
                                key={act}
                                className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                                  ACTION_CONFIG[act]?.bg
                                } ${ACTION_CONFIG[act]?.text}`}
                              >
                                <span>{ACTION_CONFIG[act]?.icon}</span>
                                <span>{localizedCopy(language, CALENDAR_ACTION_LABELS[act])}</span>
                              </span>
                            ))}
                          </div>
                          <ul className="space-y-1 text-[11px] leading-relaxed text-muted-foreground">
                            {entry.operations.map((op, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0"></span>
                                <span>{op}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-muted-foreground/60 italic py-3 text-center">
                        {copyFor(language, 'No scheduled in-field operations.', 'لا توجد عمليات حقلية مجدولة هذا الشهر.', 'Aucune opération culturale programmée.')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* VIEW 4: FIELD CHECKLIST & PRINTABLE WORK ORDER */}
      {viewMode === 'checklist' && (
        <Card className="border-border shadow-sm">
          <CardHeader className="border-b bg-muted/30 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {copyFor(language, `Field Work Order & Checklist — ${month.name[language]}`, `خطة العمل الحقلية وقائمة المهام — ${month.name[language]}`, `Ordre de Travail & Check-list — ${month.name[language]}`)}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {copyFor(
                    language,
                    'Actionable decadal task checklist derived from official INVA guidelines. Mark tasks as completed in the field or print for farm teams.',
                    'قائمة مهام مقسمة على عشريات الشهر مستخرجة من الإرشادات الرسمية. سجّل إنجاز المهام في الحقل أو اطبعها لفرق العمل.',
                    'Check-list opérationnelle par décade. Cochez les tâches réalisées sur le terrain ou imprimez pour les équipes.'
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="h-8 text-xs gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" />
                  {copyFor(language, 'Print / PDF', 'طباعة / PDF', 'Imprimer / PDF')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-6">
            {visibleEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                {copyFor(language, 'No tasks available under current filter settings.', 'لا توجد مهام تحت المرشحات الحالية.', 'Aucune tâche sous les filtres actuels.')}
              </p>
            ) : (
              <div className="space-y-4">
                {visibleEntries.map((entry, index) => {
                  const isChecked = !!completedChecklistTasks[entry.id];
                  return (
                    <div
                      key={entry.id}
                      className={`rounded-xl border p-3.5 transition-all ${
                        isChecked
                          ? 'border-emerald-300 bg-emerald-50/40 dark:border-emerald-800 dark:bg-emerald-950/20'
                          : 'border-border bg-card'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => toggleChecklistTask(entry.id)}
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                              isChecked
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-muted-foreground/40 hover:border-emerald-500'
                            }`}
                          >
                            {isChecked && <Check className="h-3.5 w-3.5" />}
                          </button>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-xs font-bold ${isChecked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                {entry.cropContext}
                              </span>
                              <Badge variant="outline" className="text-[10px]">
                                {localizedCopy(language, CALENDAR_SECTION_LABELS[entry.section])}
                              </Badge>
                            </div>

                            <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                              {entry.operations.map((op, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-emerald-600 font-bold">•</span>
                                  <span className={isChecked ? 'line-through' : ''}>{op}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="shrink-0 text-end text-[10px] text-muted-foreground">
                          <div>{entry.source.file}</div>
                          <div>{entry.source.printedPages}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* VIEW 5: OFFICIAL SOURCE PROVENANCE & METHODOLOGY */}
      {viewMode === 'provenance' && (
        <div className="space-y-4">
          <Card className="border-sky-200 bg-sky-50/40 dark:border-sky-900/60 dark:bg-sky-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-sky-900 dark:text-sky-100">
                <BookOpen className="h-4 w-4 text-sky-600" />
                {copyFor(language, 'Official Source Reference & Provenance Trace', 'مرجع المصادر الرسمية وسجل التوثيق', 'Référence des Sources Officielles & Traçabilité')}
              </CardTitle>
              <CardDescription className="text-xs text-sky-800/80 dark:text-sky-200/70">
                {copyFor(
                  language,
                  'Every calendar recommendation is grounded in official agronomic publications from the Algerian Ministry of Agriculture & Rural Development and INVA.',
                  'كل عملية وإرشاد مستمد ومطابق لوثائق وزارة الفلاحة والتنمية الريفية والمعهد الوطني للإرشاد الفلاحي (INVA).',
                  'Chaque recommandation est rigoureusement ancrée dans les publications du Ministère de l’Agriculture et de l’INVA.'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-3 space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                    {copyFor(language, 'Institution & Ministry', 'الهيئة المصدرة', 'Institution émettrice')}
                  </span>
                  <p className="font-semibold text-foreground leading-snug">{month.source.institution}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3 space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                    {copyFor(language, 'Document Title & Edition', 'عنوان الوثيقة والنسخة', 'Titre du Document')}
                  </span>
                  <p className="font-semibold text-foreground">{month.source.documentTitle}</p>
                  <p className="text-[11px] text-muted-foreground">{month.source.file} ({month.source.pdfLength})</p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  {copyFor(language, 'Agronomic Notation & Safety Rules', 'قواعد الرموز الزراعية والسلامة', 'Règles de Notation & Sécurité')}
                </span>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {month.source.interpretationRule}
                </p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20 p-3 text-amber-900 dark:text-amber-100 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  <span>{copyFor(language, 'Safety & Companion-Planting Boundary', 'حدود السلامة والزراعة المرافقة', 'Limite de Sécurité & Associations')}</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {copyFor(
                    language,
                    'This calendar lists operational activities that happen in the same calendar month across Algerian farms. It does NOT claim that crops appearing in the same month are biologically compatible as companion plantings in the same soil patch.',
                    'يعرض هذا التقويم العمليات الحقلية المتزامنة في الشهر نفسه عبر المزارع الجزائرية. ولا يعني ذلك توافقها البيولوجي كزراعة مرافقة في البقعة نفسها.',
                    'Ce calendrier regroupe les opérations concomitantes du même mois. Il ne constitue pas une validation d’associations culturales compagnes.'
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Sub-component: Clean, High-Performance Operation Card
function OperationCard({
  entry,
  monthName,
  language,
  onCopy,
  onShare,
  onSelectCrop,
}: {
  entry: AlgeriaCalendarEntry;
  monthName: string;
  language: Language;
  onCopy: () => void;
  onShare: () => void;
  onSelectCrop: (cropKey: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const sectionLabel = CALENDAR_SECTION_LABELS[entry.section];

  return (
    <article className="group relative rounded-xl border border-border bg-card p-3.5 shadow-xs transition-all hover:border-emerald-300 hover:shadow-sm dark:hover:border-emerald-800">
      {/* Top row: Crop Title & Action Badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h4 className="text-xs sm:text-sm font-bold text-foreground tracking-tight">
              {entry.cropContext}
            </h4>
            <Badge variant="outline" className="text-[9px] font-normal py-0 h-4 border-border">
              {localizedCopy(language, sectionLabel)}
            </Badge>
          </div>

          {/* Action Chips */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {entry.actionTypes.map(act => {
              const cfg = ACTION_CONFIG[act];
              return (
                <Badge
                  key={act}
                  variant="secondary"
                  className={`gap-1 text-[9px] font-medium py-0 h-4.5 border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                >
                  <span aria-hidden="true">{cfg.icon}</span>
                  {localizedCopy(language, CALENDAR_ACTION_LABELS[act])}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Action icons: Share & Copy */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCopy}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title={copyFor(language, 'Copy operation', 'نسخ العملية', 'Copier')}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onShare}
            className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            title={copyFor(language, 'Share to WhatsApp', 'مشاركة عبر واتساب', 'Partager WhatsApp')}
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Bulleted Operations with Highlighted Dosages */}
      <div className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-muted-foreground border-t border-border/50 pt-2">
        {entry.operations.map((op, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0"></span>
            <span className="text-foreground/90 font-normal">{op}</span>
          </div>
        ))}
      </div>

      {/* Expandable Source Trace */}
      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2 text-[10px] text-muted-foreground">
        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
        >
          <BookOpen className="h-3 w-3 text-emerald-600" />
          <span>{entry.source.printedPages}</span>
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {entry.cropKeys.length > 0 && (
          <button
            type="button"
            onClick={() => onSelectCrop(entry.cropKeys[0])}
            className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
          >
            <span>{copyFor(language, '360° Story', 'مسار 360°', 'Itinéraire 360°')}</span>
            <ArrowUpRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-2 rounded-lg bg-muted/40 p-2 text-[10px] text-muted-foreground space-y-1 border border-border/60 animate-in fade-in duration-150">
          <div>
            <span className="font-semibold text-foreground">{copyFor(language, 'Source file:', 'ملف المصدر:', 'Fichier source :')}</span> {entry.source.file}
          </div>
          <div>
            <span className="font-semibold text-foreground">{copyFor(language, 'Reference page:', 'صفحة المرجع:', 'Page référence :')}</span> {entry.source.printedPages}
          </div>
        </div>
      )}
    </article>
  );
}
