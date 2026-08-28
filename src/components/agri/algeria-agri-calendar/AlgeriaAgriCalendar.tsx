'use client';

/**
 * Algeria Agriculture Calendar — comprehensive calendar with 19 features
 * for Algerian farmers (Tell / Hauts Plateaux / Sahara).
 *
 * Features:
 *   1. Agro-climatic Zone Selector  (Tell / Hauts Plateaux / Sahara)
 *   2. Real-time Weather Overlays (spray-window, wind, rain prob)
 *   3. Frost Alerts (Feb–Mar for Hauts Plateaux fruit trees)
 *   4. BBCH Growth Stage Tracker
 *   5. Pre-Harvest Interval (PHI) Countdown
 *   6. Crop Rotation Multi-Year View
 *   7. Biofix Calendar (locust, olive fly, citrus scale, bayoud…)
 *   8. Trap Catch Logger (with threshold alerts)
 *   9. CNCA / Subsidy Deadlines
 *  10. Market Price Calendar (Marché de Gros patterns)
 *  11. Multi-Field Synchronization
 *  12. Worker & Equipment Scheduler (with conflict detection)
 *  13. Offline Mode (PWA-style local persistence)
 *  14. Moon Phase Layer
 *  15. Ramadan Adjustment
 *  16. Souk Day Integration
 *  17. AI Task Generator (NL → calendar)
 *  18. WhatsApp / Telegram Reminders
 *  19. Print-friendly Weekly View
 *
 * All data persists locally (localStorage) — works fully offline once loaded.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CalendarDays, Cloud, Snowflake, Sprout, Bug, Users, Wrench, Moon,
  Clock, Share2, Wifi, WifiOff, Printer, Send, Sparkles, MapPin,
  Plus, Trash2, ChevronLeft, ChevronRight, RefreshCw, CheckCircle2,
  AlertTriangle, TrendingUp, TrendingDown, Droplets, Wind, CloudRain,
  Activity, BookOpen, FileText, Calendar as CalendarIcon,
} from 'lucide-react';
import { copyFor, useTranslation } from '@/lib/language-store';
import { cn } from '@/lib/utils';
import { useCalendarStore, type CalField, type CalTask, genId, pickFieldColor } from './calendar-store';
import {
  AGRO_CLIMATIC_ZONES, zoneById, frostRisksFor,
  PEST_BIOFIX, SUBSIDY_DEADLINES, MARKET_PRICE_PATTERNS, SOUKS, soukForDay,
  moonPhaseForDate, isRamadan, ramadanWorkShift,
  BBCH_STAGES, checkTankMix, darFor, EQUIPMENT_CATALOG,
  FIELD_PROFILES, PREVENTIVE_CALENDAR, ROTATION_PLANS, priceTier,
  type PestBiofix, type SubsidyDeadline,
} from '@/lib/algeria-agri-calendar-data';
import { getForecast, type ForecastResult } from '@/lib/open-meteo';
import { CROP_LIFECYCLES } from '@/lib/crop-lifecycle';

// ============================================================================
// Helpers
// ============================================================================

const WEEKDAYS = [
  { en: 'Sun', fr: 'Dim', ar: 'الأحد' },
  { en: 'Mon', fr: 'Lun', ar: 'الإثنين' },
  { en: 'Tue', fr: 'Mar', ar: 'الثلاثاء' },
  { en: 'Wed', fr: 'Mer', ar: 'الأربعاء' },
  { en: 'Thu', fr: 'Jeu', ar: 'الخميس' },
  { en: 'Fri', fr: 'Ven', ar: 'الجمعة' },
  { en: 'Sat', fr: 'Sam', ar: 'السبت' },
];

const MONTHS = [
  { en: 'January', fr: 'Janvier', ar: 'جانفي' },
  { en: 'February', fr: 'Février', ar: 'فيفري' },
  { en: 'March', fr: 'Mars', ar: 'مارس' },
  { en: 'April', fr: 'Avril', ar: 'أفريل' },
  { en: 'May', fr: 'Mai', ar: 'ماي' },
  { en: 'June', fr: 'Juin', ar: 'جوان' },
  { en: 'July', fr: 'Juillet', ar: 'جويلية' },
  { en: 'August', fr: 'Août', ar: 'أوت' },
  { en: 'September', fr: 'Septembre', ar: 'سبتمبر' },
  { en: 'October', fr: 'Octobre', ar: 'أكتوبر' },
  { en: 'November', fr: 'Novembre', ar: 'نوفمبر' },
  { en: 'December', fr: 'Décembre', ar: 'ديسمبر' },
];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

// ============================================================================
// Main component
// ============================================================================

export function AlgeriaAgriCalendar() {
  const { language, isRTL } = useTranslation();
  const t = useCalendarStore();
  const hydrated = useHydrated();
  const [activeTab, setActiveTab] = useState<'overview' | 'month' | 'week' | 'rotation' | 'biofix' | 'prices' | 'subsidies' | 'labor' | 'ai'>('overview');
  const [viewDate, setViewDate] = useState<Date>(() => new Date());

  // Set initial zone from a default
  useEffect(() => {
    if (!hydrated) return;
    if (!t.zone) t.setZone('tell');
  }, [hydrated, t]);

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header — zone selector + layer toggles */}
      <CalendarHeader viewDate={viewDate} setViewDate={setViewDate} />

      {/* Tab navigation */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-9 h-auto">
          <TabsTrigger value="overview" className="text-[10px] sm:text-xs py-1.5">
            <CalendarDays className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">{copyFor(language, 'Overview', 'نظرة عامة')}</span>
          </TabsTrigger>
          <TabsTrigger value="month" className="text-[10px] sm:text-xs py-1.5">
            <CalendarIcon className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">{copyFor(language, 'Month', 'شهر')}</span>
          </TabsTrigger>
          <TabsTrigger value="week" className="text-[10px] sm:text-xs py-1.5">
            <Clock className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">{copyFor(language, 'Week', 'أسبوع')}</span>
          </TabsTrigger>
          <TabsTrigger value="rotation" className="text-[10px] sm:text-xs py-1.5">
            <RefreshCw className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">{copyFor(language, 'Rotation', 'دورة')}</span>
          </TabsTrigger>
          <TabsTrigger value="biofix" className="text-[10px] sm:text-xs py-1.5">
            <Bug className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">{copyFor(language, 'Biofix', 'طُعم')}</span>
          </TabsTrigger>
          <TabsTrigger value="prices" className="text-[10px] sm:text-xs py-1.5">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">{copyFor(language, 'Prices', 'أسعار')}</span>
          </TabsTrigger>
          <TabsTrigger value="subsidies" className="text-[10px] sm:text-xs py-1.5">
            <FileText className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">{copyFor(language, 'Aid', 'دعم')}</span>
          </TabsTrigger>
          <TabsTrigger value="labor" className="text-[10px] sm:text-xs py-1.5">
            <Users className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">{copyFor(language, 'Labor', 'عمال')}</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="text-[10px] sm:text-xs py-1.5">
            <Sparkles className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">AI</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab viewDate={viewDate} />
        </TabsContent>
        <TabsContent value="month" className="mt-4">
          <MonthViewTab viewDate={viewDate} setViewDate={setViewDate} />
        </TabsContent>
        <TabsContent value="week" className="mt-4">
          <WeekViewTab viewDate={viewDate} setViewDate={setViewDate} />
        </TabsContent>
        <TabsContent value="rotation" className="mt-4">
          <RotationTab />
        </TabsContent>
        <TabsContent value="biofix" className="mt-4">
          <BiofixTab viewDate={viewDate} />
        </TabsContent>
        <TabsContent value="prices" className="mt-4">
          <PricesTab viewDate={viewDate} />
        </TabsContent>
        <TabsContent value="subsidies" className="mt-4">
          <SubsidiesTab viewDate={viewDate} />
        </TabsContent>
        <TabsContent value="labor" className="mt-4">
          <LaborTab viewDate={viewDate} />
        </TabsContent>
        <TabsContent value="ai" className="mt-4">
          <AiTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// Header — Zone selector + layer toggles + sync status
// ============================================================================

function CalendarHeader({ viewDate, setViewDate }: { viewDate: Date; setViewDate: (d: Date) => void }) {
  const { language, isRTL } = useTranslation();
  const t = useCalendarStore();
  const hydrated = useHydrated();
  const zone = zoneById(t.zone);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-[200px]">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-5 w-5 text-emerald-600" />
              {copyFor(language,
                'Algeria Agriculture Calendar',
                'التقويم الفلاحي الجزائري')}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {copyFor(language,
                '19 features · Tell · Hauts Plateaux · Sahara',
                '19 ميزة · التل · الهضاب العليا · الصحراء')}
            </p>
          </div>
          {/* Sync / offline indicator */}
          <div className="flex items-center gap-2 text-[10px]">
            {hydrated && (
              <Badge variant="outline" className={cn(
                'gap-1',
                t.offlineMode ? 'border-amber-300 text-amber-700' : 'border-emerald-300 text-emerald-700'
              )}>
                {t.offlineMode ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
                {t.offlineMode
                  ? copyFor(language, 'Offline', 'دون اتصال')
                  : copyFor(language, 'Online', 'متصل')}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px]"
              onClick={() => t.markSynced()}
              disabled={t.offlineMode}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              {copyFor(language, 'Sync', 'مزامنة')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Zone selector */}
        <div>
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
            {copyFor(language, 'Agro-climatic zone', 'المنطقة المناخية')}
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {AGRO_CLIMATIC_ZONES.map((z) => (
              <button
                key={z.id}
                onClick={() => t.setZone(z.id)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-left transition-all',
                  t.zone === z.id
                    ? cn(z.border, z.bg, 'shadow-sm')
                    : 'border-border bg-card hover:border-emerald-300'
                )}
              >
                <span className="text-xl">{z.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className={cn('text-xs font-semibold truncate', z.color)}>
                    {language === 'ar' ? z.label.ar : language === 'fr' ? z.label.fr : z.label.en}
                  </div>
                  <div className="text-[9px] text-muted-foreground">
                    {z.rainfallMm[0]}–{z.rainfallMm[1]} mm/yr · ET₀ peak {z.et0Peak} mm/d
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Layer toggles */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/30 p-2">
          <LayerToggle
            icon={<Cloud className="h-3 w-3" />}
            label={copyFor(language, 'Weather', 'الطقس')}
            checked={t.showWeather}
            onChange={t.setShowWeather}
          />
          <LayerToggle
            icon={<Moon className="h-3 w-3" />}
            label={copyFor(language, 'Moon', 'القمر')}
            checked={t.showMoon}
            onChange={t.setShowMoon}
          />
          <LayerToggle
            icon={<Clock className="h-3 w-3" />}
            label={copyFor(language, 'Ramadan', 'رمضان')}
            checked={t.showRamadan}
            onChange={t.setShowRamadan}
          />
          <LayerToggle
            icon={<MapPin className="h-3 w-3" />}
            label={copyFor(language, 'Souk', 'سوق')}
            checked={t.showSouk}
            onChange={t.setShowSouk}
          />
          <LayerToggle
            icon={<WifiOff className="h-3 w-3" />}
            label={copyFor(language, 'Offline', 'دون اتصال')}
            checked={t.offlineMode}
            onChange={t.setOfflineMode}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function LayerToggle({ icon, label, checked, onChange }: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} className="scale-90" />
    </div>
  );
}

// ============================================================================
// Overview Tab — multi-field dashboard + frost/pest/weather alerts
// ============================================================================

function OverviewTab({ viewDate }: { viewDate: Date }) {
  const { language } = useTranslation();
  const t = useCalendarStore();
  const zone = zoneById(t.zone);
  const monthIdx = viewDate.getMonth();
  const frostRisks = frostRisksFor(t.zone, monthIdx);
  const souksToday = soukForDay(viewDate.getDay());

  const upcomingTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return t.tasks
      .filter(task => {
        const taskDate = new Date(task.date + 'T00:00:00');
        const diff = (taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= -1 && diff <= 14; // past yesterday → next 14 days
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 8);
  }, [t.tasks]);

  return (
    <div className="space-y-4">
      {/* Active alerts strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Frost alert */}
        <AlertCard
          title={copyFor(language, 'Frost Alerts', 'تنبيهات الصقيع')}
          icon={<Snowflake className="h-4 w-4" />}
          tone={frostRisks.length > 0 ? 'danger' : 'safe'}
        >
          {frostRisks.length > 0 ? (
            <div className="space-y-1.5">
              {frostRisks.slice(0, 3).map((r, i) => (
                <div key={i} className="text-[11px] flex items-start gap-1">
                  <span>❄️</span>
                  <div>
                    <span className="font-medium">
                      {language === 'ar' ? r.cropLabel.ar : language === 'fr' ? r.cropLabel.fr : r.cropLabel.en}
                    </span>{' '}
                    <span className="text-muted-foreground">— {r.stage}</span>
                    <div className="text-[10px] text-red-700 dark:text-red-400">
                      Critical T°: {r.criticalTempC}°C · {r.protection}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              {copyFor(language,
                'No frost risk this month for your zone.',
                'لا يوجد خطر صقيع هذا الشهر لمنطقتك.')}
            </p>
          )}
        </AlertCard>

        {/* Active pest biofix */}
        <AlertCard
          title={copyFor(language, 'Pest Activity', 'نشاط الآفات')}
          icon={<Bug className="h-4 w-4" />}
          tone="warning"
        >
          <div className="space-y-1">
            {PEST_BIOFIX.filter(p => monthIdx >= p.window[0] && monthIdx <= p.window[1]).slice(0, 4).map(p => (
              <div key={p.id} className="text-[11px] flex items-start gap-1">
                <span>{p.emoji}</span>
                <div>
                  <span className="font-medium">{language === 'ar' ? p.pestAr : p.pest}</span>
                  <div className="text-[10px] text-muted-foreground">
                    Trap: {p.trapType.split(' (')[0]} · Threshold: {p.treatmentThreshold}/trap
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AlertCard>

        {/* Souk today */}
        <AlertCard
          title={copyFor(language, 'Souk Day', 'يوم السوق')}
          icon={<MapPin className="h-4 w-4" />}
          tone={souksToday.length > 0 ? 'info' : 'muted'}
        >
          {souksToday.length > 0 ? (
            <div className="space-y-1">
              {souksToday.slice(0, 3).map((s, i) => (
                <div key={i} className="text-[11px]">
                  <span className="font-medium">{s.commune}</span>{' '}
                  <span className="text-muted-foreground">({s.wilaya})</span>
                  <div className="text-[10px] text-muted-foreground">{s.specialty}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              {copyFor(language, 'No major souk today.', 'لا يوجد سوق كبير اليوم.')}
            </p>
          )}
        </AlertCard>
      </div>

      {/* Multi-field summary */}
      <MultiFieldSummary />

      {/* Upcoming tasks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-600" />
            {copyFor(language, 'Upcoming Tasks (14 days)', 'المهام القادمة (14 يوماً)')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              {copyFor(language,
                'No tasks scheduled. Use the AI tab to generate a plan, or add fields in the Month view.',
                'لا مهام مجدولة. استخدم تبويب AI لتوليد خطة، أو أضف حقولاً في عرض الشهر.')}
            </p>
          ) : (
            <div className="space-y-1.5">
              {upcomingTasks.map(task => (
                <UpcomingTaskRow key={task.id} task={task} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AlertCard({ title, icon, tone, children }: {
  title: string;
  icon: React.ReactNode;
  tone: 'danger' | 'warning' | 'info' | 'safe' | 'muted';
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    danger: 'border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-900',
    warning: 'border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900',
    info: 'border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900',
    safe: 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900',
    muted: 'border-muted bg-muted/30',
  };
  return (
    <Card className={cn('border-2', tones[tone])}>
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-xs flex items-center gap-1.5">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

// ============================================================================
// Multi-Field Summary — Feature 11
// ============================================================================

function MultiFieldSummary() {
  const { language } = useTranslation();
  const t = useCalendarStore();
  const fields = t.fields;

  if (fields.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <Sprout className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm font-medium mb-1">
            {copyFor(language, 'No fields yet', 'لا توجد حقول بعد')}
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            {copyFor(language,
              'Add your first field to start building the calendar.',
              'أضف أول حقل لبدء بناء التقويم.')}
          </p>
          <AddFieldButton />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sprout className="h-4 w-4 text-emerald-600" />
          {copyFor(language, 'Fields', 'الحقول')}
          <Badge variant="secondary" className="text-[10px]">{fields.length}</Badge>
        </CardTitle>
        <AddFieldButton />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {fields.map(f => {
            const zone = zoneById(f.zone);
            const tasksThisWeek = t.tasks.filter(task => {
              if (task.fieldId !== f.id) return false;
              const today = new Date();
              const taskDate = new Date(task.date + 'T00:00:00');
              const diff = (taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
              return diff >= -7 && diff <= 7;
            }).length;
            const openTreatments = t.treatments.filter(tr => tr.fieldId === f.id).length;
            return (
              <div key={f.id} className="rounded-lg border border-border/60 bg-card p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full" style={{ background: f.color }} />
                    <div>
                      <div className="text-xs font-semibold">{f.name}</div>
                      <div className="text-[10px] text-muted-foreground">{f.cropLabel}</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (confirm(language === 'ar' ? `حذف الحقل "${f.name}"؟` : `Delete field "${f.name}"?`)) {
                        t.removeField(f.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1 text-[10px]">
                  <div>
                    <div className="text-muted-foreground">{copyFor(language, 'Area', 'المساحة')}</div>
                    <div className="font-medium">{f.area} ha</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{copyFor(language, 'Tasks', 'مهام')}</div>
                    <div className="font-medium">{tasksThisWeek}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{copyFor(language, 'Sprays', 'رشات')}</div>
                    <div className="font-medium">{openTreatments}</div>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-1 text-[10px]">
                  <span>{zone.emoji}</span>
                  <span className="text-muted-foreground">
                    {language === 'ar' ? zone.label.ar : language === 'fr' ? zone.label.fr : zone.label.en}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function AddFieldButton() {
  const { language } = useTranslation();
  const t = useCalendarStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [cropId, setCropId] = useState('wheat');
  const [area, setArea] = useState('1');
  const [plantingDate, setPlantingDate] = useState(toISODate(new Date()));
  const [irrigation, setIrrigation] = useState<CalField['irrigationSystem']>('drip');

  const submit = () => {
    if (!name.trim()) return;
    const crop = CROP_LIFECYCLES.find(c => c.id === cropId);
    const field: CalField = {
      id: genId('field'),
      name: name.trim(),
      cropId,
      cropLabel: crop?.name ?? cropId,
      area: parseFloat(area) || 1,
      plantingDate,
      zone: t.zone,
      irrigationSystem: irrigation,
      color: pickFieldColor(),
    };
    t.addField(field);
    setOpen(false);
    setName('');
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-3 w-3 mr-1" />
        {copyFor(language, 'Add field', 'إضافة حقل')}
      </Button>
    );
  }
  return (
    <div className="rounded-lg border border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 space-y-2 text-left">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px]">{copyFor(language, 'Field name', 'اسم الحقل')}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Field A" className="h-8 text-xs" />
        </div>
        <div>
          <Label className="text-[10px]">{copyFor(language, 'Crop', 'المحصول')}</Label>
          <Select value={cropId} onValueChange={setCropId}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CROP_LIFECYCLES.map(c => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  {c.emoji} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px]">{copyFor(language, 'Area (ha)', 'المساحة (هكتار)')}</Label>
          <Input value={area} onChange={(e) => setArea(e.target.value)} type="number" step="0.1" className="h-8 text-xs" />
        </div>
        <div>
          <Label className="text-[10px]">{copyFor(language, 'Planting date', 'تاريخ الزراعة')}</Label>
          <Input value={plantingDate} onChange={(e) => setPlantingDate(e.target.value)} type="date" className="h-8 text-xs" />
        </div>
        <div className="col-span-2">
          <Label className="text-[10px]">{copyFor(language, 'Irrigation', 'الري')}</Label>
          <Select value={irrigation} onValueChange={(v) => setIrrigation(v as CalField['irrigationSystem'])}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="drip" className="text-xs">💧 Drip / Goutte-à-goutte / تنقيط</SelectItem>
              <SelectItem value="sprinkler" className="text-xs">💦 Sprinkler / Aspersion / رذاذ</SelectItem>
              <SelectItem value="furrow" className="text-xs">🌊 Furrow / Gravitaire / غمر</SelectItem>
              <SelectItem value="rainfed" className="text-xs">🌧️ Rainfed / Bour / بوري</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          {copyFor(language, 'Cancel', 'إلغاء')}
        </Button>
        <Button size="sm" onClick={submit}>
          {copyFor(language, 'Save', 'حفظ')}
        </Button>
      </div>
    </div>
  );
}

function UpcomingTaskRow({ task }: { task: CalTask }) {
  const { language } = useTranslation();
  const t = useCalendarStore();
  const field = t.fields.find(f => f.id === task.fieldId);
  const taskDate = new Date(task.date + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const statusColor = task.status === 'done'
    ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30'
    : task.status === 'in_progress'
      ? 'border-blue-300 bg-blue-50 dark:bg-blue-950/30'
      : task.status === 'skipped'
        ? 'border-muted bg-muted/30 opacity-60'
        : diffDays < 0
          ? 'border-red-300 bg-red-50 dark:bg-red-950/30'
          : 'border-border bg-card';

  const toggleStatus = () => {
    const next = task.status === 'planned' ? 'done' : task.status === 'done' ? 'planned' : 'done';
    t.updateTask(task.id, { status: next });
  };

  return (
    <div className={cn('flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs', statusColor)}>
      <button onClick={toggleStatus} className="shrink-0">
        <CheckCircle2 className={cn('h-4 w-4', task.status === 'done' ? 'text-emerald-600 fill-emerald-100' : 'text-muted-foreground')} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{task.title}</div>
        <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
          {field && (
            <>
              <span className="h-2 w-2 rounded-full" style={{ background: field.color }} />
              <span>{field.name}</span>
              <span>·</span>
            </>
          )}
          <span>{taskDate.toLocaleDateString(language === 'ar' ? 'ar' : language === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: 'short' })}</span>
          <span>·</span>
          <span>{Math.abs(diffDays) === 0 ? (copyFor(language, 'Today', 'اليوم')) : diffDays < 0 ? `${Math.abs(diffDays)}d ago` : `in ${diffDays}d`}</span>
        </div>
      </div>
      <Badge variant="outline" className="text-[9px]">{task.category}</Badge>
    </div>
  );
}

// ============================================================================
// Month View Tab — calendar grid with all overlays
// ============================================================================

function MonthViewTab({ viewDate, setViewDate }: {
  viewDate: Date;
  setViewDate: (d: Date) => void;
}) {
  const { language, isRTL } = useTranslation();
  const t = useCalendarStore();
  const monthStart = startOfMonth(viewDate);
  const gridStart = startOfWeek(monthStart);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) cells.push(addDays(gridStart, i));

  const monthTasks = useMemo(() => {
    return t.tasks.filter(task => {
      const d = new Date(task.date + 'T00:00:00');
      return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear();
    });
  }, [t.tasks, viewDate]);

  const monthTreatments = useMemo(() => {
    return t.treatments.filter(tr => {
      const d = new Date(tr.date + 'T00:00:00');
      return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear();
    });
  }, [t.treatments, viewDate]);

  const monthSubsidies = SUBSIDY_DEADLINES.filter(s => s.month === viewDate.getMonth());

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setViewDate(addDays(monthStart, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-base font-semibold">
              {language === 'ar' ? MONTHS[viewDate.getMonth()].ar : language === 'fr' ? MONTHS[viewDate.getMonth()].fr : MONTHS[viewDate.getMonth()].en}
              {' '}
              {viewDate.getFullYear()}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setViewDate(addDays(monthStart, 32))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setViewDate(new Date())}>
            {copyFor(language, 'Today', 'اليوم')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground py-1">
              {language === 'ar' ? d.ar : language === 'fr' ? d.fr : d.en}
            </div>
          ))}
        </div>
        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((date, i) => {
            const isCurrentMonth = date.getMonth() === viewDate.getMonth();
            const isToday = sameDay(date, today);
            const dateStr = toISODate(date);
            const dayTasks = monthTasks.filter(task => task.date === dateStr);
            const dayTreatments = monthTreatments.filter(tr => tr.date === dateStr);
            const daySubsidies = monthSubsidies.filter(s => s.day === date.getDate());
            const daySouks = t.showSouk ? soukForDay(date.getDay()) : [];
            const moon = t.showMoon ? moonPhaseForDate(date) : null;
            const ramadanActive = t.showRamadan && isRamadan(date);

            return (
              <div
                key={i}
                className={cn(
                  'min-h-[80px] rounded-md border p-1 text-[10px] transition-colors',
                  isCurrentMonth ? 'bg-card border-border' : 'bg-muted/30 border-muted text-muted-foreground',
                  isToday && 'ring-2 ring-emerald-500 ring-offset-1',
                  ramadanActive && 'bg-purple-50 dark:bg-purple-950/20'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn('font-medium', isToday && 'text-emerald-700 dark:text-emerald-400')}>
                    {date.getDate()}
                  </span>
                  {moon && (
                    <span title={language === 'ar' ? moon.label.ar : moon.label.en}>{moon.emoji}</span>
                  )}
                </div>
                <div className="space-y-0.5 mt-0.5">
                  {daySubsidies.map(s => (
                    <div key={s.id} className="truncate rounded bg-amber-100 dark:bg-amber-950/40 px-1 py-0.5 text-[9px] text-amber-800 dark:text-amber-300">
                      {s.emoji} {s.title[language]}
                    </div>
                  ))}
                  {daySouks.length > 0 && (
                    <div className="truncate rounded bg-blue-100 dark:bg-blue-950/40 px-1 py-0.5 text-[9px] text-blue-800 dark:text-blue-300">
                      🛍️ {daySouks[0].commune}
                    </div>
                  )}
                  {dayTreatments.map(tr => (
                    <div key={tr.id} className="truncate rounded bg-red-100 dark:bg-red-950/40 px-1 py-0.5 text-[9px] text-red-800 dark:text-red-300">
                      💉 {tr.activeMatter}
                    </div>
                  ))}
                  {dayTasks.slice(0, 2).map(task => {
                    const field = t.fields.find(f => f.id === task.fieldId);
                    return (
                      <div
                        key={task.id}
                        className="truncate rounded px-1 py-0.5 text-[9px] text-white"
                        style={{ background: field?.color ?? '#666' }}
                      >
                        {task.title}
                      </div>
                    );
                  })}
                  {dayTasks.length > 2 && (
                    <div className="text-[9px] text-muted-foreground">+{dayTasks.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded bg-amber-300" /> {copyFor(language, 'Subsidy deadline', 'موعد الدعم')}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded bg-blue-300" /> {copyFor(language, 'Souk day', 'يوم السوق')}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded bg-red-300" /> {copyFor(language, 'Spray / PHI', 'رش / فترة ما قبل الحصاد')}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded bg-purple-300" /> {copyFor(language, 'Ramadan', 'رمضان')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Week View Tab — print-friendly detailed weekly plan
// ============================================================================

function WeekViewTab({ viewDate, setViewDate }: {
  viewDate: Date;
  setViewDate: (d: Date) => void;
}) {
  const { language, isRTL } = useTranslation();
  const t = useCalendarStore();
  const weekStart = startOfWeek(viewDate);
  const days: Date[] = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekTasks = useMemo(() => {
    return t.tasks.filter(task => {
      const d = new Date(task.date + 'T00:00:00');
      return d >= weekStart && d < addDays(weekStart, 7);
    });
  }, [t.tasks, weekStart]);

  const weekTreatments = useMemo(() => {
    return t.treatments.filter(tr => {
      const d = new Date(tr.date + 'T00:00:00');
      return d >= weekStart && d < addDays(weekStart, 7);
    });
  }, [t.treatments, weekStart]);

  const weekStartISO = toISODate(weekStart);
  const weekEndISO = toISODate(addDays(weekStart, 6));

  return (
    <div className="space-y-3">
      <Card className="print:shadow-none">
        <CardHeader className="pb-3 print-no-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setViewDate(addDays(weekStart, -7))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-base font-semibold">
                {weekStart.toLocaleDateString(language === 'ar' ? 'ar' : language === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: 'short' })}
                {' – '}
                {addDays(weekStart, 6).toLocaleDateString(language === 'ar' ? 'ar' : language === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewDate(addDays(weekStart, 7))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setViewDate(new Date())}>
                {copyFor(language, 'This week', 'هذا الأسبوع')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
                <Printer className="h-3 w-3 mr-1" />
                {copyFor(language, 'Print', 'طباعة')}
              </Button>
              <ShareWeekButton weekStartISO={weekStartISO} weekEndISO={weekEndISO} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weather strip — Feature 2 */}
          {t.showWeather && <WeatherStrip lat={36.75} lng={3.06} days={days} />}

          {/* Day-by-day list */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2 mt-3 print:grid-cols-7">
            {days.map((date, i) => {
              const dateStr = toISODate(date);
              const dayTasks = weekTasks.filter(task => task.date === dateStr);
              const dayTreatments = weekTreatments.filter(tr => tr.date === dateStr);
              const daySouks = t.showSouk ? soukForDay(date.getDay()) : [];
              const moon = t.showMoon ? moonPhaseForDate(date) : null;
              const ramadanActive = t.showRamadan && isRamadan(date);

              return (
                <div key={i} className={cn(
                  'rounded-lg border border-border/60 bg-card p-2 min-h-[200px]',
                  sameDay(date, today) && 'ring-2 ring-emerald-500',
                  ramadanActive && 'bg-purple-50 dark:bg-purple-950/20'
                )}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                        {language === 'ar' ? WEEKDAYS[date.getDay()].ar : language === 'fr' ? WEEKDAYS[date.getDay()].fr : WEEKDAYS[date.getDay()].en}
                      </div>
                      <div className="text-sm font-bold">
                        {date.getDate()}/{date.getMonth() + 1}
                      </div>
                    </div>
                    {moon && <span className="text-base" title={moon.label[language]}>{moon.emoji}</span>}
                  </div>
                  {daySouks.length > 0 && (
                    <div className="text-[9px] rounded bg-blue-100 dark:bg-blue-950/40 px-1 py-0.5 mb-1 text-blue-800 dark:text-blue-300">
                      🛍️ Souk: {daySouks[0].commune}
                    </div>
                  )}
                  {dayTasks.length === 0 && dayTreatments.length === 0 ? (
                    <div className="text-[10px] text-muted-foreground py-2 text-center">—</div>
                  ) : (
                    <div className="space-y-1">
                      {dayTreatments.map(tr => {
                        const unblockDate = new Date(tr.harvestUnblockedDate + 'T00:00:00');
                        const daysToHarvest = Math.ceil((unblockDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <div key={tr.id} className="rounded bg-red-100 dark:bg-red-950/40 px-1.5 py-1 text-[9px] text-red-800 dark:text-red-300">
                            <div className="font-semibold">💉 {tr.activeMatter}</div>
                            <div className="text-[8px]">PHI: harvest blocked {daysToHarvest}d</div>
                          </div>
                        );
                      })}
                      {dayTasks.map(task => {
                        const field = t.fields.find(f => f.id === task.fieldId);
                        return (
                          <div key={task.id} className="rounded bg-muted/50 px-1.5 py-1 text-[9px]">
                            <div className="flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ background: field?.color ?? '#666' }} />
                              <span className="font-medium truncate flex-1">{task.title}</span>
                            </div>
                            {field && <div className="text-[8px] text-muted-foreground mt-0.5">{field.name}</div>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Ramadan banner */}
          {t.showRamadan && isRamadan(new Date()) && (
            <div className="mt-3 rounded-lg border border-purple-300 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-800 p-3">
              <div className="text-xs font-semibold flex items-center gap-2 mb-1">
                <Clock className="h-3 w-3" />
                {copyFor(language, 'Ramadan work adjustment', 'تعديل العمل في رمضان')}
              </div>
              <p className="text-[11px] text-purple-800 dark:text-purple-300">
                {(() => {
                  const shift = ramadanWorkShift();
                  return shift.note[language];
                })()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add task to week */}
      <QuickAddTask weekStart={weekStart} />
    </div>
  );
}

// ============================================================================
// Weather Strip — Feature 2 (spray window + wind + rain prob + frost alert)
// ============================================================================

function WeatherStrip({ lat, lng, days }: { lat: number; lng: number; days: Date[] }) {
  const { language } = useTranslation();
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useCalendarStore();

  useEffect(() => {
    if (t.offlineMode) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getForecast(lat, lng, { days: 7 })
      .then(f => { if (!cancelled) setForecast(f); })
      .catch(() => { /* silent */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [lat, lng, t.offlineMode]);

  if (t.offlineMode) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-2 text-[10px] text-center text-muted-foreground">
        {copyFor(language, 'Weather disabled in offline mode', 'الطقس معطّل في الوضع دون اتصال')}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-muted-foreground/30 p-2 text-[10px] text-center text-muted-foreground animate-pulse">
        {copyFor(language, 'Loading weather…', 'تحميل الطقس…')}
      </div>
    );
  }
  if (!forecast || !forecast.daily?.length) return null;

  return (
    <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 p-2">
      <div className="flex items-center gap-2 mb-1.5">
        <Cloud className="h-3 w-3 text-blue-600 dark:text-blue-400" />
        <span className="text-[10px] font-semibold">
          {copyFor(language, '7-day weather & spray windows', 'طقس 7 أيام ونوافذ الرش')}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {forecast.daily.slice(0, 7).map((d, i) => {
          const date = new Date(d.date + 'T00:00:00');
          // Spray window logic
          const windOk = d.windSpeedMax < 15;
          const rainOk = d.precipitationProbability < 60;
          const tempOk = d.tempMax >= 12 && d.tempMax <= 28;
          const sprayOk = windOk && rainOk && tempOk;
          const frostRisk = d.tempMin <= 0;
          return (
            <div key={i} className="rounded border border-border/40 bg-card p-1.5 text-center">
              <div className="text-[9px] font-medium">
                {date.toLocaleDateString(language === 'ar' ? 'ar' : language === 'fr' ? 'fr-FR' : 'en-GB', { weekday: 'short' })}
              </div>
              <div className="text-[9px] text-muted-foreground">{date.getDate()}/{date.getMonth() + 1}</div>
              <div className="text-[11px] font-bold mt-0.5">{d.tempMax.toFixed(0)}°/{d.tempMin.toFixed(0)}°</div>
              <div className="text-[9px] text-muted-foreground flex items-center justify-center gap-1">
                <CloudRain className="h-2.5 w-2.5" />
                {d.precipitationProbability.toFixed(0)}%
              </div>
              <div className="text-[9px] text-muted-foreground flex items-center justify-center gap-1">
                <Wind className="h-2.5 w-2.5" />
                {d.windSpeedMax.toFixed(0)}km/h
              </div>
              {frostRisk ? (
                <Badge variant="outline" className="mt-0.5 text-[8px] border-red-400 text-red-700">
                  <Snowflake className="h-2 w-2 mr-0.5" /> FROST
                </Badge>
              ) : (
                <Badge variant="outline" className={cn('mt-0.5 text-[8px]',
                  sprayOk ? 'border-emerald-400 text-emerald-700' : 'border-amber-400 text-amber-700')}>
                  {sprayOk ? '✓ Weather OK' : '⚠ Hold'}
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Quick Add Task
// ============================================================================

function QuickAddTask({ weekStart }: { weekStart: Date }) {
  const { language } = useTranslation();
  const t = useCalendarStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [fieldId, setFieldId] = useState('');
  const [date, setDate] = useState(toISODate(weekStart));
  const [category, setCategory] = useState<CalTask['category']>('scout');

  const submit = () => {
    if (!title.trim() || !fieldId) return;
    const task: CalTask = {
      id: genId('task'),
      fieldId,
      date,
      title: title.trim(),
      category,
      status: 'planned',
    };
    t.addTask(task);
    setOpen(false);
    setTitle('');
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} disabled={t.fields.length === 0}>
        <Plus className="h-3 w-3 mr-1" />
        {copyFor(language, 'Add task', 'إضافة مهمة')}
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div>
            <Label className="text-[10px]">{copyFor(language, 'Field', 'الحقل')}</Label>
            <Select value={fieldId} onValueChange={setFieldId}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={copyFor(language, 'Select field', 'اختر حقلاً')} /></SelectTrigger>
              <SelectContent>
                {t.fields.map(f => (
                  <SelectItem key={f.id} value={f.id} className="text-xs">
                    <span className="h-2 w-2 rounded-full inline-block mr-1" style={{ background: f.color }} />
                    {f.name} — {f.cropLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px]">{copyFor(language, 'Date', 'التاريخ')}</Label>
            <Input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">{copyFor(language, 'Category', 'الفئة')}</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as CalTask['category'])}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['soil', 'pest_monitoring', 'irrigation', 'fertilization', 'pruning', 'harvest_prep', 'equipment', 'spray', 'scout', 'harvest', 'other'].map(c => (
                  <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px]">{copyFor(language, 'Task', 'المهمة')}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Scout for aphids" className="h-8 text-xs" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>{copyFor(language, 'Cancel', 'إلغاء')}</Button>
          <Button size="sm" onClick={submit}>{copyFor(language, 'Save', 'حفظ')}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Rotation Tab — Feature 6 (multi-year crop rotation)
// ============================================================================

function RotationTab() {
  const { language } = useTranslation();
  const t = useCalendarStore();
  const plan = ROTATION_PLANS.find(p => p.zone === t.zone) ?? ROTATION_PLANS[0];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-emerald-600" />
          {copyFor(language, 'Multi-Year Crop Rotation', 'دورة المحاصيل متعددة السنوات')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-[11px] text-muted-foreground">
          {plan.notes[language]}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          {plan.years.map((y, i) => (
            <div key={y.year} className="rounded-lg border border-border/60 bg-card p-3 relative">
              <div className="absolute top-2 right-2 text-[10px] font-bold text-muted-foreground">
                {copyFor(language, `Year ${y.year}`, `السنة ${y.year}`)}
              </div>
              <div className="text-base font-semibold mt-3">{y.crop}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{y.rationale}</div>
              {i < plan.years.length - 1 && (
                <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
        <AlertCard
          title={copyFor(language, 'Why this rotation matters', 'لماذا هذه الدورة مهمة')}
          icon={<BookOpen className="h-4 w-4" />}
          tone="info"
        >
          <ul className="text-[11px] space-y-1">
            <li>• {copyFor(language,
              'Breaks disease & pest cycles by alternating host crops.',
              'يكسر دورة الأمراض والآفات بتبديل المحاصيل المضيفة.')}</li>
            <li>• {copyFor(language,
              'Legumes fix 40–60 kg N/ha — reduces next-year fertilizer cost.',
              'البقوليات تثبّت 40–60 كغ N/هكتار — يخفّض كلفة سماد السنة التالية.')}</li>
            <li>• {copyFor(language,
              'Different root depths improve soil structure across the profile.',
              'أعماق جذور مختلفة تحسّن بنية التربة عبر الملف.')}</li>
          </ul>
        </AlertCard>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Biofix Tab — Feature 7 (pest biofix calendar) + Feature 8 (trap logger)
// ============================================================================

function BiofixTab({ viewDate }: { viewDate: Date }) {
  const { language } = useTranslation();
  const t = useCalendarStore();
  const monthIdx = viewDate.getMonth();

  const active = PEST_BIOFIX.filter(p => monthIdx >= p.window[0] && monthIdx <= p.window[1]);
  const upcoming = PEST_BIOFIX.filter(p => monthIdx < p.window[0]).sort((a, b) => a.window[0] - b.window[0]).slice(0, 3);

  return (
    <div className="space-y-3">
      {/* Active pests */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bug className="h-4 w-4 text-amber-600" />
            {copyFor(language, 'Active Pests This Month', 'الآفات النشطة هذا الشهر')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              {copyFor(language, 'No major pest activity predicted this month.', 'لا يوجد نشاط آفات كبير متوقّع هذا الشهر.')}
            </p>
          ) : (
            <div className="space-y-2">
              {active.map(p => <PestBiofixRow key={p.id} pest={p} viewDate={viewDate} />)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming pests */}
      {upcoming.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              {copyFor(language, 'Coming Up Next', 'القادم التالي')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {upcoming.map(p => (
                <div key={p.id} className="flex items-center justify-between text-[11px]">
                  <span>{p.emoji} {language === 'ar' ? p.pestAr : p.pest}</span>
                  <Badge variant="outline" className="text-[9px]">
                    {MONTHS[p.window[0]][language]}–{MONTHS[p.window[1]][language]}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trap logger */}
      <TrapCatchLogger />
    </div>
  );
}

function PestBiofixRow({ pest, viewDate }: { pest: PestBiofix; viewDate: Date }) {
  const { language } = useTranslation();
  const t = useCalendarStore();
  const fieldCrops = t.fields.map(f => f.cropId);
  const relevant = fieldCrops.some(c => pest.crop.includes(c) || pest.crop.some(pc => c.includes(pc)));

  return (
    <div className={cn('rounded-lg border p-2.5',
      relevant ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800' : 'border-border bg-card')}>
      <div className="flex items-start gap-2">
        <div className="text-xl">{pest.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-semibold">
              {language === 'ar' ? pest.pestAr : pest.pest}
            </span>
            {relevant && (
              <Badge variant="secondary" className="text-[9px] bg-amber-200 text-amber-900">
                {copyFor(language, 'On your fields', 'على حقولك')}
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1 mt-1 text-[10px] text-muted-foreground">
            <div>
              <span className="font-medium">{copyFor(language, 'Trap type', 'نوع المصيدة')}:</span>{' '}
              {pest.trapType}
            </div>
            <div>
              <span className="font-medium">{copyFor(language, 'Threshold', 'العتبة')}:</span>{' '}
              {pest.treatmentThreshold}/trap/week
            </div>
            <div>
              <span className="font-medium">{copyFor(language, 'Window', 'النافذة')}:</span>{' '}
              {MONTHS[pest.window[0]][language]} – {MONTHS[pest.window[1]][language]}
            </div>
            <div>
              <span className="font-medium">{copyFor(language, 'High-risk wilayas', 'ولايات高风险')}:</span>{' '}
              {pest.highRiskWilayas.slice(0, 3).join(', ')}
            </div>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {pest.rotationGroups.map(g => (
              <Badge key={g} variant="outline" className="text-[9px]">{g}</Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Trap Catch Logger — Feature 8
// ============================================================================

function TrapCatchLogger() {
  const { language } = useTranslation();
  const t = useCalendarStore();
  const [open, setOpen] = useState(false);
  const [fieldId, setFieldId] = useState('');
  const [pestId, setPestId] = useState(PEST_BIOFIX[0].id);
  const [count, setCount] = useState('');
  const [date, setDate] = useState(toISODate(new Date()));

  const submit = () => {
    const pest = PEST_BIOFIX.find(p => p.id === pestId)!;
    const c = parseInt(count, 10) || 0;
    t.addTrapCatch({
      id: genId('trap'),
      fieldId,
      pestId,
      date,
      count: c,
      threshold: pest.treatmentThreshold,
    });
    setOpen(false);
    setCount('');
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-purple-600" />
          {copyFor(language, 'Trap Catch Log', 'سجل المصائد')}
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => setOpen(!open)} disabled={t.fields.length === 0}>
          <Plus className="h-3 w-3 mr-1" />
          {copyFor(language, 'Log catch', 'سجّل صيد')}
        </Button>
      </CardHeader>
      <CardContent>
        {open && (
          <div className="mb-3 rounded-lg border border-purple-300 bg-purple-50/50 dark:bg-purple-950/30 p-3 space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <Label className="text-[10px]">{copyFor(language, 'Field', 'الحقل')}</Label>
                <Select value={fieldId} onValueChange={setFieldId}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {t.fields.map(f => (
                      <SelectItem key={f.id} value={f.id} className="text-xs">{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px]">{copyFor(language, 'Pest', 'الآفة')}</Label>
                <Select value={pestId} onValueChange={setPestId}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PEST_BIOFIX.map(p => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        {p.emoji} {language === 'ar' ? p.pestAr : p.pest}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px]">{copyFor(language, 'Date', 'التاريخ')}</Label>
                <Input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px]">{copyFor(language, 'Count/trap', 'العدد/مصيدة')}</Label>
                <Input value={count} onChange={(e) => setCount(e.target.value)} type="number" className="h-8 text-xs" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>{copyFor(language, 'Cancel', 'إلغاء')}</Button>
              <Button size="sm" onClick={submit} disabled={!fieldId || !count}>{copyFor(language, 'Save', 'حفظ')}</Button>
            </div>
          </div>
        )}

        {t.trapCatches.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            {copyFor(language,
              'No trap catches logged. Start logging to track pest pressure over time.',
              'لا توجد مصائد مسجّلة. ابدأ التسجيل لتتبّع ضغط الآفات عبر الزمن.')}
          </p>
        ) : (
          <div className="space-y-1">
            {[...t.trapCatches].reverse().slice(0, 12).map(c => {
              const pest = PEST_BIOFIX.find(p => p.id === c.pestId);
              const field = t.fields.find(f => f.id === c.fieldId);
              const exceeded = c.threshold > 0 && c.count >= c.threshold;
              return (
                <div key={c.id} className={cn('flex items-center gap-2 rounded border px-2 py-1.5 text-[11px]',
                  exceeded ? 'border-red-300 bg-red-50 dark:bg-red-950/30' : 'border-border bg-card')}>
                  <span className="text-base">{pest?.emoji ?? '🪤'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {field?.name ?? '—'} · {pest ? (language === 'ar' ? pest.pestAr : pest.pest) : c.pestId}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {c.date} · {c.count} / trap
                      {c.threshold > 0 && ` · threshold ${c.threshold}`}
                    </div>
                  </div>
                  {exceeded && (
                    <Badge variant="outline" className="text-[9px] border-red-400 text-red-700">
                      <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                      {copyFor(language, 'Threshold', 'عتبة')}
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => t.removeTrapCatch(c.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Prices Tab — Feature 10 (market price calendar)
// ============================================================================

function PricesTab({ viewDate }: { viewDate: Date }) {
  const { language } = useTranslation();
  const monthIdx = viewDate.getMonth();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
          {copyFor(language, 'Market Price Calendar', 'تقويم أسعار السوق')}
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">
          {copyFor(language,
            'Wholesale price patterns (Marché de Gros) — DZD/kg typical bands. Plan harvests to hit high-price windows.',
            'أنماط أسعار الجملة (Marché de Gros) — نطاقات نموذجية دج/كغ. خطّط الحصاد لضرب نوافذ الأسعار المرتفعة.')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {MARKET_PRICE_PATTERNS.map(p => {
            const tier = priceTier(p, monthIdx);
            const tierLabel = tier === 'high'
              ? copyFor(language, 'Good time to sell', 'وقت جيد للبيع')
              : tier === 'low'
                ? copyFor(language, 'Low price — store if possible', 'سعر منخفض — خزّن إن أمكن')
                : copyFor(language, 'Mid price', 'سعر متوسط');
            const tierColor = tier === 'high' ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30'
              : tier === 'low' ? 'border-red-300 bg-red-50 dark:bg-red-950/30'
                : 'border-amber-200 bg-amber-50 dark:bg-amber-950/20';
            return (
              <div key={p.crop} className={cn('rounded-lg border p-2.5', tierColor)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{p.emoji}</span>
                    <div>
                      <div className="text-sm font-semibold">{p.label[language]}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {p.priceBandDZD[0]}–{p.priceBandDZD[1]} DZD/kg
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn('text-[9px]',
                    tier === 'high' ? 'border-emerald-400 text-emerald-700' : tier === 'low' ? 'border-red-400 text-red-700' : 'border-amber-400 text-amber-700')}>
                    {tier === 'high' ? <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> : tier === 'low' ? <TrendingDown className="h-2.5 w-2.5 mr-0.5" /> : null}
                    {tierLabel}
                  </Badge>
                </div>
                <div className="mt-1.5 grid grid-cols-12 gap-0.5">
                  {MONTHS.map((_, m) => {
                    const cellTier = priceTier(p, m);
                    const bg = cellTier === 'high' ? 'bg-emerald-400 dark:bg-emerald-600'
                      : cellTier === 'low' ? 'bg-red-400 dark:bg-red-600'
                        : 'bg-amber-200 dark:bg-amber-700';
                    return (
                      <div key={m} className={cn('h-2 rounded-sm', bg, m === monthIdx && 'ring-2 ring-foreground')} title={`${MONTHS[m][language]}`} />
                    );
                  })}
                </div>
                <div className="mt-1 flex justify-between text-[8px] text-muted-foreground">
                  <span>{copyFor(language, 'Jan', 'جانفي')}</span>
                  <span>{copyFor(language, 'Dec', 'ديسمبر')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Subsidies Tab — Feature 9
// ============================================================================

function SubsidiesTab({ viewDate }: { viewDate: Date }) {
  const { language } = useTranslation();
  const t = useCalendarStore();
  const monthIdx = viewDate.getMonth();
  const thisMonthDeadlines = SUBSIDY_DEADLINES.filter(s => s.month === monthIdx);
  const next3Months = SUBSIDY_DEADLINES.filter(s => {
    const m = (s.month - monthIdx + 12) % 12;
    return m > 0 && m <= 3;
  }).sort((a, b) => (a.month - monthIdx + 12) % 12 - (b.month - monthIdx + 12) % 12);

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-600" />
            {copyFor(language, 'Subsidy Deadlines This Month', 'مواعيد الدعم هذا الشهر')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {thisMonthDeadlines.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              {copyFor(language, 'No deadlines this month.', 'لا مواعيد هذا الشهر.')}
            </p>
          ) : (
            <div className="space-y-2">
              {thisMonthDeadlines.map(s => <SubsidyRow key={s.id} s={s} />)}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            {copyFor(language, 'Coming Up (3 months)', 'القادم (3 أشهر)')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {next3Months.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">—</p>
          ) : (
            <div className="space-y-2">
              {next3Months.map(s => <SubsidyRow key={s.id} s={s} compact />)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SubsidyRow({ s, compact }: { s: SubsidyDeadline; compact?: boolean }) {
  const { language } = useTranslation();
  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-2.5">
      <div className="flex items-start gap-2">
        <span className="text-xl">{s.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-semibold">{s.title[language]}</span>
            <Badge variant="outline" className="text-[9px]">
              {s.day} {MONTHS[s.month][language]}
            </Badge>
          </div>
          {!compact && (
            <p className="text-[11px] text-muted-foreground mt-1">{s.description[language]}</p>
          )}
          <div className="grid grid-cols-2 gap-1 mt-1.5 text-[10px]">
            <div>
              <span className="font-medium">{copyFor(language, 'Authority', 'الجهة')}:</span>{' '}
              {s.authority}
            </div>
            <div>
              <span className="font-medium">{copyFor(language, 'Apply at', 'التقديم في')}:</span>{' '}
              {s.applyAt}
            </div>
            {s.amountDZD && (
              <div className="col-span-2">
                <span className="font-medium">{copyFor(language, 'Amount', 'المبلغ')}:</span>{' '}
                {s.amountDZD}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Labor Tab — Feature 12 (worker & equipment scheduler + conflict detection)
// ============================================================================

function LaborTab({ viewDate }: { viewDate: Date }) {
  const { language } = useTranslation();
  const t = useCalendarStore();

  return (
    <div className="space-y-3">
      <EquipmentScheduler />
      <TankMixChecker />
      <PhiCountdown />
      <SoukSchedule />
    </div>
  );
}

// ============================================================================
// Equipment Scheduler
// ============================================================================

function EquipmentScheduler() {
  const { language } = useTranslation();
  const t = useCalendarStore();
  const conflicts = detectConflictsLite(t.equipmentBookings);

  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Wrench className="h-4 w-4 text-blue-600" />
          {copyFor(language, 'Equipment Scheduler', 'جدولة المعدات')}
        </CardTitle>
        <EquipmentBookingButton />
      </CardHeader>
      <CardContent>
        {conflicts.length > 0 && (
          <div className="mb-2 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 p-2">
            <div className="text-[10px] font-semibold flex items-center gap-1 text-red-700 dark:text-red-400 mb-1">
              <AlertTriangle className="h-3 w-3" />
              {copyFor(language, `${conflicts.length} conflict(s) detected`, `${conflicts.length} تعارض مكتشف`)}
            </div>
            {conflicts.map((c, i) => (
              <div key={i} className="text-[10px] text-red-700 dark:text-red-400">• {c}</div>
            ))}
          </div>
        )}
        {t.equipmentBookings.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            {copyFor(language, 'No equipment booked yet.', 'لا معدات محجوزة بعد.')}
          </p>
        ) : (
          <div className="space-y-1">
            {[...t.equipmentBookings].reverse().slice(0, 12).map(b => {
              const eq = EQUIPMENT_CATALOG.find(e => e.id === b.equipmentId);
              return (
                <div key={b.id} className="flex items-center gap-2 rounded border px-2 py-1.5 text-[11px]">
                  <span className="text-base">{eq?.emoji ?? '🔧'}</span>
                  <div className="flex-1">
                    <div className="font-medium">{eq?.name ?? b.equipmentId}</div>
                    <div className="text-[10px] text-muted-foreground">{b.date} · {b.hours}h</div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => t.removeEquipmentBooking(b.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EquipmentBookingButton() {
  const { language } = useTranslation();
  const t = useCalendarStore();
  const [open, setOpen] = useState(false);
  const [equipmentId, setEquipmentId] = useState(EQUIPMENT_CATALOG[0].id);
  const [taskId, setTaskId] = useState('');
  const [fieldId, setFieldId] = useState('');
  const [date, setDate] = useState(toISODate(new Date()));
  const [hours, setHours] = useState('4');

  const submit = () => {
    if (!fieldId) return;
    t.addEquipmentBooking({
      id: genId('eq'),
      taskId: taskId || 'manual',
      equipmentId,
      fieldId,
      date,
      hours: parseFloat(hours) || 4,
    });
    setOpen(false);
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} disabled={t.fields.length === 0}>
        <Plus className="h-3 w-3 mr-1" />
        {copyFor(language, 'Book', 'احجز')}
      </Button>
    );
  }

  return (
    <div className="absolute z-50 mt-1 rounded-lg border border-blue-300 bg-card p-3 shadow-lg w-72 space-y-2">
      <div>
        <Label className="text-[10px]">{copyFor(language, 'Equipment', 'المعدة')}</Label>
        <Select value={equipmentId} onValueChange={setEquipmentId}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {EQUIPMENT_CATALOG.map(e => (
              <SelectItem key={e.id} value={e.id} className="text-xs">
                {e.emoji} {e.name} ({e.capacityHaPerDay} ha/day)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px]">{copyFor(language, 'Field', 'الحقل')}</Label>
        <Select value={fieldId} onValueChange={setFieldId}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
          <SelectContent>
            {t.fields.map(f => (
              <SelectItem key={f.id} value={f.id} className="text-xs">{f.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px]">{copyFor(language, 'Date', 'التاريخ')}</Label>
        <Input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="h-8 text-xs" />
      </div>
      <div>
        <Label className="text-[10px]">{copyFor(language, 'Hours', 'الساعات')}</Label>
        <Input value={hours} onChange={(e) => setHours(e.target.value)} type="number" className="h-8 text-xs" />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>{copyFor(language, 'Cancel', 'إلغاء')}</Button>
        <Button size="sm" onClick={submit}>{copyFor(language, 'Book', 'احجز')}</Button>
      </div>
    </div>
  );
}

/** Lightweight conflict detection (returns readable messages). */
function detectConflictsLite(bookings: Array<{ id: string; equipmentId: string; date: string; fieldId: string; hours: number; taskId: string }>): string[] {
  const conflicts: string[] = [];
  for (let i = 0; i < bookings.length; i++) {
    for (let j = i + 1; j < bookings.length; j++) {
      const a = bookings[i], b = bookings[j];
      if (a.equipmentId === b.equipmentId && a.date === b.date) {
        const eq = EQUIPMENT_CATALOG.find(e => e.id === a.equipmentId);
        const totalHours = a.hours + b.hours;
        if (totalHours > 8) {
          conflicts.push(`${eq?.name ?? a.equipmentId}: ${a.hours}h + ${b.hours}h = ${totalHours}h on ${a.date} (>8h/day)`);
        }
      }
    }
  }
  return conflicts;
}

// ============================================================================
// Tank Mix Compatibility Checker — Feature 8 (tank-mix)
// ============================================================================

function TankMixChecker() {
  const { language } = useTranslation();
  const [a, setA] = useState('mancozeb');
  const [b, setB] = useState('copper');
  const result = checkTankMix(a, b);
  const materials = ['mancozeb', 'copper', 'abamectin', 'azadirachtin', 'glyphosate', 'mineral-oil', 'sulphur', 'calcium-nitrate', 'chlorpyrifos', 'spirotetramat'];

  const resultColor = result === 'compatible' ? 'border-emerald-400 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30'
    : result === 'incompatible' ? 'border-red-400 text-red-700 bg-red-50 dark:bg-red-950/30'
      : result === 'caution' ? 'border-amber-400 text-amber-700 bg-amber-50 dark:bg-amber-950/30'
        : 'border-muted text-muted-foreground bg-muted/30';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Droplets className="h-4 w-4 text-cyan-600" />
          {copyFor(language, 'Tank Mix Compatibility', 'توافق خليط الرش')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[10px]">{copyFor(language, 'Product A', 'المنتج أ')}</Label>
            <Select value={a} onValueChange={setA}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {materials.map(m => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px]">{copyFor(language, 'Product B', 'المنتج ب')}</Label>
            <Select value={b} onValueChange={setB}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {materials.map(m => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className={cn('rounded-lg border-2 p-3 text-center', resultColor)}>
          <div className="text-sm font-semibold uppercase">
            {result === 'compatible' ? copyFor(language, 'Compatible', 'متوافق')
              : result === 'incompatible' ? copyFor(language, 'Incompatible', 'غير متوافق')
                : result === 'caution' ? copyFor(language, 'Caution', 'حذر')
                  : copyFor(language, 'Unknown — check label', 'غير معروف — راجع الملصق')}
          </div>
          <div className="text-[10px] mt-1 opacity-80">
            {result === 'compatible' ? copyFor(language, 'Can be mixed. Apply immediately after mixing.', 'يمكن الخلط. رشّ مباشرة بعد الخلط.')
              : result === 'incompatible' ? copyFor(language, 'Do NOT mix — precipitation or phytotoxicity likely.', 'لا تخلط — ترسّب أو سمية محتملة.')
                : result === 'caution' ? copyFor(language, 'Mix only at low temperatures (<25°C) and test on small area first.', 'اخلط فقط في حرارة منخفضة (<25°م) واختبر على مساحة صغيرة أولاً.')
                  : copyFor(language, 'No data — consult product label or local adviser.', 'لا بيانات — راجع ملصق المنتج أو مستشار محلي.')}
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground">
          ⚠ {copyFor(language,
            'Simplified matrix — always consult the product label for full compatibility information.',
            'مصفوفة مبسّطة — راجع دائماً ملصق المنتج لمعلومات التوافق الكاملة.')}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// PHI Countdown — Feature 5 (treatment history + harvest block)
// ============================================================================

function PhiCountdown() {
  const { language } = useTranslation();
  const t = useCalendarStore();
  const [open, setOpen] = useState(false);
  const [fieldId, setFieldId] = useState('');
  const [activeMatter, setActiveMatter] = useState('mancozeb');
  const [date, setDate] = useState(toISODate(new Date()));

  const knownActives = ['mancozeb', 'chlorpyrifos', 'deltamethrin', 'lambda-cyhalothrin', 'abamectin', 'spirotetramat', 'pyriproxyfen', 'metalaxyl-m', 'copper-hydroxide', 'azadirachtin', 'spinosad', 'imidacloprid', 'glyphosate', 'dimethoate'];

  const submit = () => {
    if (!fieldId) return;
    const field = t.fields.find(f => f.id === fieldId);
    if (!field) return;
    const dar = darFor(activeMatter, field.cropId) ?? 7;
    const sprayDate = new Date(date + 'T00:00:00');
    const unblock = new Date(sprayDate);
    unblock.setDate(unblock.getDate() + dar);
    t.addTreatment({
      id: genId('treat'),
      fieldId,
      cropId: field.cropId,
      date,
      activeMatter,
      darDays: dar,
      harvestUnblockedDate: toISODate(unblock),
    });
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4 text-red-600" />
          {copyFor(language, 'Treatment History & PHI Countdown', 'سجل المعالجات والعكسر ما قبل الحصاد')}
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => setOpen(!open)} disabled={t.fields.length === 0}>
          <Plus className="h-3 w-3 mr-1" />
          {copyFor(language, 'Log spray', 'سجّل رشة')}
        </Button>
      </CardHeader>
      <CardContent>
        {open && (
          <div className="mb-3 rounded-lg border border-red-300 bg-red-50/50 dark:bg-red-950/30 p-3 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <Label className="text-[10px]">{copyFor(language, 'Field', 'الحقل')}</Label>
                <Select value={fieldId} onValueChange={setFieldId}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {t.fields.map(f => (
                      <SelectItem key={f.id} value={f.id} className="text-xs">{f.name} ({f.cropLabel})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px]">{copyFor(language, 'Active matter', 'المادة الفعّالة')}</Label>
                <Select value={activeMatter} onValueChange={setActiveMatter}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {knownActives.map(m => (
                      <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px]">{copyFor(language, 'Spray date', 'تاريخ الرش')}</Label>
                <Input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="h-8 text-xs" />
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {copyFor(language, 'DAR (Délai Avant Récolte)', 'فترة ما قبل الحصاد')}:{' '}
              <span className="font-semibold">{darFor(activeMatter) ?? '?'} days</span>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>{copyFor(language, 'Cancel', 'إلغاء')}</Button>
              <Button size="sm" onClick={submit}>{copyFor(language, 'Save', 'حفظ')}</Button>
            </div>
          </div>
        )}

        {t.treatments.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            {copyFor(language, 'No treatments logged.', 'لا معالجات مسجّلة.')}
          </p>
        ) : (
          <div className="space-y-1.5">
            {[...t.treatments].reverse().map(tr => {
              const field = t.fields.find(f => f.id === tr.fieldId);
              const unblock = new Date(tr.harvestUnblockedDate + 'T00:00:00');
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const daysRemaining = Math.ceil((unblock.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const blocked = daysRemaining > 0;
              return (
                <div key={tr.id} className={cn('rounded-lg border p-2.5',
                  blocked ? 'border-red-300 bg-red-50 dark:bg-red-950/30' : 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30')}>
                  <div className="flex items-start gap-2">
                    <div className="text-xl">💉</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-sm font-semibold">{tr.activeMatter}</span>
                        <Badge variant="outline" className="text-[9px]">{tr.darDays}d DAR</Badge>
                        {field && <span className="text-[10px] text-muted-foreground">· {field.name}</span>}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {copyFor(language, 'Sprayed', 'رُشّ بتاريخ')} {tr.date}
                      </div>
                      <div className={cn('text-[11px] font-semibold mt-0.5',
                        blocked ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400')}>
                        {blocked
                          ? `🚫 ${copyFor(language, 'Harvest blocked for', 'الحصاد محظور لمدة')} ${daysRemaining} ${copyFor(language, 'more days', 'يوم إضافية')}`
                          : `✓ ${copyFor(language, 'Harvest unblocked since', 'الحصاد متاح منذ')} ${tr.harvestUnblockedDate}`}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => t.removeTreatment(tr.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Souk Schedule
// ============================================================================

function SoukSchedule() {
  const { language } = useTranslation();
  const t = useCalendarStore();
  if (!t.showSouk) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          {copyFor(language, 'Weekly Souk Days', 'أيام السوق الأسبوعية')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {SOUKS.map((s, i) => (
            <div key={i} className="flex items-center gap-2 rounded border px-2 py-1.5 text-[11px]">
              <div className="flex flex-col items-center justify-center w-10 h-10 rounded bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                <div className="text-[8px] uppercase">{WEEKDAYS[s.dayOfWeek][language]}</div>
                <span className="text-base">🛍️</span>
              </div>
              <div className="flex-1">
                <div className="font-medium">{s.commune}</div>
                <div className="text-[10px] text-muted-foreground">{s.wilaya} · {s.specialty}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// AI Tab — Feature 17 (NL task generator) + Feature 18 (reminders)
// ============================================================================

function AiTab() {
  const { language } = useTranslation();
  return (
    <div className="space-y-3">
      <AiTaskGenerator />
      <ReminderManager />
      <PreventiveCalendarStrip />
      <BbchStageTracker />
    </div>
  );
}

// ============================================================================
// AI Task Generator — Feature 17
// ============================================================================

function AiTaskGenerator() {
  const { language } = useTranslation();
  const t = useCalendarStore();
  const [profileId, setProfileId] = useState(FIELD_PROFILES[0].id);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ summary: string; taskCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const profile = FIELD_PROFILES.find(p => p.id === profileId)!;
      const fullPrompt = prompt.trim() || profile.description[language];

      // Create field from profile
      const crop = CROP_LIFECYCLES.find(c => c.id === profile.cropId);
      const field: CalField = {
        id: genId('field'),
        name: profile.label[language].slice(0, 30),
        cropId: profile.cropId,
        cropLabel: crop?.name ?? profile.cropId,
        area: profile.area,
        plantingDate: toISODate(new Date()),
        zone: profile.zone,
        irrigationSystem: profile.irrigation,
        soil: profile.soil,
        color: pickFieldColor(),
      };
      t.addField(field);

      // Generate tasks based on preventive calendar + biofix for this zone
      const monthIdx = new Date().getMonth();
      const generatedTasks: CalTask[] = [];

      // 1. Add next 3 months of preventive tasks for this zone
      for (let m = 0; m < 3; m++) {
        const targetMonth = (monthIdx + m) % 12;
        const yearShift = Math.floor((monthIdx + m) / 12);
        const targetYear = new Date().getFullYear() + yearShift;
        const preventive = PREVENTIVE_CALENDAR.filter(p =>
          (p.zone === profile.zone || p.zone === 'all') && p.month === targetMonth
        );
        for (const p of preventive) {
          const day = 10 + Math.floor(Math.random() * 10); // mid-month
          const date = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          generatedTasks.push({
            id: genId('task'),
            fieldId: field.id,
            date,
            title: p.task[language],
            category: p.category as CalTask['category'],
            status: 'planned',
          });
        }
      }

      // 2. Add active biofix monitoring tasks
      for (const pest of PEST_BIOFIX) {
        if (
          (monthIdx >= pest.window[0] && monthIdx <= pest.window[1]) &&
          pest.crop.some(c => profile.cropId.includes(c) || c.includes(profile.cropId))
        ) {
          generatedTasks.push({
            id: genId('task'),
            fieldId: field.id,
            date: toISODate(addDays(new Date(), 7)),
            title: `${language === 'ar' ? 'رصد' : 'Scout'}: ${language === 'ar' ? pest.pestAr : pest.pest}`,
            category: 'pest_monitoring',
            status: 'planned',
            notes: `Trap type: ${pest.trapType}; threshold ${pest.treatmentThreshold}/trap/week`,
          });
        }
      }

      // Save tasks
      for (const task of generatedTasks) t.addTask(task);

      // Save AI plan record
      const planId = genId('plan');
      const summary = `Generated ${generatedTasks.length} tasks for ${field.name} (${profile.label[language]}) based on the Algerian preventive calendar and active pest biofix for ${profile.zone}.`;
      t.addAiPlan({
        id: planId,
        fieldId: field.id,
        createdAt: new Date().toISOString(),
        prompt: fullPrompt,
        planSummary: summary,
        taskIds: generatedTasks.map(t => t.id),
      });

      setResult({ summary, taskCount: generatedTasks.length });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" />
          {copyFor(language, 'AI Task Generator', 'مولّد المهام بالذكاء الاصطناعي')}
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">
          {copyFor(language,
            'Pick a field profile (or describe your own) — AI generates a full task list from the Algerian preventive calendar + active pest biofix.',
            'اختر نموذج حقل (أو صِف حقلك) — يولّد الذكاء الاصطناعي قائمة مهام كاملة من التقويم الوقائي الجزائري + النشاط الحيوي للآفات.')}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-[10px]">{copyFor(language, 'Field profile', 'نموذج الحقل')}</Label>
          <Select value={profileId} onValueChange={setProfileId}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FIELD_PROFILES.map(p => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  {p.label[language]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px]">{copyFor(language, 'Custom prompt (optional)', 'وصف مخصّص (اختياري)')}</Label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={language === 'ar'
              ? 'صف حقلك بالعربية: المحصول، المنطقة، نوع التربة...'
              : language === 'fr'
                ? 'Décrivez votre champ en français : culture, zone, type de sol…'
                : 'Describe your field: crop, zone, soil type…'}
            className="text-xs min-h-[60px]"
          />
        </div>
        <Button onClick={generate} disabled={generating} size="sm" className="w-full">
          {generating ? (
            <>
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              {copyFor(language, 'Generating…', 'جارٍ التوليد…')}
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3 mr-1" />
              {copyFor(language, 'Generate full-year calendar', 'ولّد تقويم سنة كاملة')}
            </>
          )}
        </Button>
        {error && (
          <div className="rounded border border-red-300 bg-red-50 dark:bg-red-950/30 p-2 text-[11px] text-red-700 dark:text-red-400">
            {error}
          </div>
        )}
        {result && (
          <div className="rounded border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-2 text-[11px] text-emerald-800 dark:text-emerald-300">
            ✓ {result.summary}
          </div>
        )}
        {/* Existing AI plans */}
        {t.aiPlans.length > 0 && (
          <div className="mt-3 space-y-1">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {copyFor(language, 'Previous plans', 'الخطط السابقة')}
            </div>
            {[...t.aiPlans].reverse().slice(0, 5).map(p => {
              const field = t.fields.find(f => f.id === p.fieldId);
              return (
                <div key={p.id} className="rounded border border-border bg-card p-2 text-[11px]">
                  <div className="font-medium">{field?.name ?? p.fieldId}</div>
                  <div className="text-[10px] text-muted-foreground">{p.planSummary}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(p.createdAt).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Reminder Manager — Feature 18
// ============================================================================

function ReminderManager() {
  const { language } = useTranslation();
  const t = useCalendarStore();
  const [open, setOpen] = useState(false);
  const [taskId, setTaskId] = useState('');
  const [channel, setChannel] = useState<'telegram' | 'whatsapp' | 'in_app'>('in_app');
  const [leadMinutes, setLeadMinutes] = useState('1440'); // 24h

  const submit = () => {
    if (!taskId) return;
    t.addReminder({
      id: genId('rem'),
      taskId,
      channel,
      leadMinutes: parseInt(leadMinutes, 10) || 1440,
      enabled: true,
    });
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Send className="h-4 w-4 text-emerald-600" />
          {copyFor(language, 'Reminders (Telegram / WhatsApp)', 'التذكيرات (تيليجرام / واتساب)')}
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => setOpen(!open)} disabled={t.tasks.length === 0}>
          <Plus className="h-3 w-3 mr-1" />
          {copyFor(language, 'Add', 'إضافة')}
        </Button>
      </CardHeader>
      <CardContent>
        {open && (
          <div className="mb-3 rounded-lg border border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div>
                <Label className="text-[10px]">{copyFor(language, 'Task', 'المهمة')}</Label>
                <Select value={taskId} onValueChange={setTaskId}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {t.tasks.map(task => (
                      <SelectItem key={task.id} value={task.id} className="text-xs">
                        {task.title} ({task.date})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px]">{copyFor(language, 'Channel', 'القناة')}</Label>
                <Select value={channel} onValueChange={(v) => setChannel(v as 'telegram' | 'whatsapp' | 'in_app')}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_app" className="text-xs">📱 In-app</SelectItem>
                    <SelectItem value="telegram" className="text-xs">✈ Telegram</SelectItem>
                    <SelectItem value="whatsapp" className="text-xs">💬 WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px]">{copyFor(language, 'Lead time (min)', 'وقت التقدّم (د)')}</Label>
                <Input value={leadMinutes} onChange={(e) => setLeadMinutes(e.target.value)} type="number" className="h-8 text-xs" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>{copyFor(language, 'Cancel', 'إلغاء')}</Button>
              <Button size="sm" onClick={submit}>{copyFor(language, 'Save', 'حفظ')}</Button>
            </div>
          </div>
        )}

        {t.reminders.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            {copyFor(language, 'No reminders set.', 'لا تذكيرات مضبوطة.')}
          </p>
        ) : (
          <div className="space-y-1">
            {[...t.reminders].reverse().map(r => {
              const task = t.tasks.find(t => t.id === r.taskId);
              const channelIcon = r.channel === 'telegram' ? '✈' : r.channel === 'whatsapp' ? '💬' : '📱';
              return (
                <div key={r.id} className="flex items-center gap-2 rounded border px-2 py-1.5 text-[11px]">
                  <span>{channelIcon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{task?.title ?? r.taskId}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {task?.date} · {r.leadMinutes >= 1440 ? `${r.leadMinutes / 1440}d before` : `${r.leadMinutes}m before`}
                    </div>
                  </div>
                  <Switch checked={r.enabled} onCheckedChange={() => t.toggleReminder(r.id)} className="scale-90" />
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => t.removeReminder(r.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-2 text-[10px] text-muted-foreground">
          ℹ {copyFor(language,
            'Telegram delivery requires bot setup in the Telegram tab. WhatsApp uses click-to-chat links.',
            'تسليم تيليجرام يتطلب إعداد البوت في تبويب تيليجرام. واتساب يستخدم روابط click-to-chat.')}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Preventive Calendar Strip — Feature 10 (season-long preventive)
// ============================================================================

function PreventiveCalendarStrip() {
  const { language } = useTranslation();
  const t = useCalendarStore();
  const monthIdx = new Date().getMonth();
  const thisMonthTasks = PREVENTIVE_CALENDAR.filter(p =>
    p.month === monthIdx && (p.zone === t.zone || p.zone === 'all')
  );
  const nextMonthTasks = PREVENTIVE_CALENDAR.filter(p =>
    p.month === (monthIdx + 1) % 12 && (p.zone === t.zone || p.zone === 'all')
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-emerald-600" />
          {copyFor(language, 'Season-long Preventive Calendar', 'التقويم الوقائي طوال الموسم')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[{ label: copyFor(language, 'This month', 'هذا الشهر'), tasks: thisMonthTasks, month: monthIdx },
            { label: copyFor(language, 'Next month', 'الشهر القادم'), tasks: nextMonthTasks, month: (monthIdx + 1) % 12 }].map(({ label, tasks, month }) => (
            <div key={label}>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                {label} — {MONTHS[month][language]}
              </div>
              <div className="space-y-1">
                {tasks.length === 0 ? (
                  <div className="text-[10px] text-muted-foreground">—</div>
                ) : tasks.map((p, i) => (
                  <div key={i} className="rounded border border-border bg-card p-1.5 text-[10px]">
                    <div className="flex items-center gap-1">
                      <span>{p.emoji}</span>
                      <Badge variant="outline" className="text-[8px]">{p.category}</Badge>
                    </div>
                    <div className="mt-0.5">{p.task[language]}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// BBCH Stage Tracker — Feature 4
// ============================================================================

function BbchStageTracker() {
  const { language } = useTranslation();
  const t = useCalendarStore();
  const [cropId, setCropId] = useState('wheat');
  const stages = BBCH_STAGES[cropId] ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sprout className="h-4 w-4 text-emerald-600" />
          {copyFor(language, 'BBCH Growth Stage Tracker', 'متتبّع مراحل النمو BBCH')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-[10px]">{copyFor(language, 'Crop', 'المحصول')}</Label>
          <Select value={cropId} onValueChange={setCropId}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.keys(BBCH_STAGES).map(c => (
                <SelectItem key={c} value={c} className="text-xs capitalize">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          {stages.map(s => (
            <div key={s.code} className="rounded border border-border bg-card p-2 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-base">{s.emoji}</span>
                <div className="flex-1">
                  <div className="font-medium">
                    <Badge variant="outline" className="text-[9px] font-mono mr-1">{s.code}</Badge>
                    {language === 'ar' ? s.nameAr : s.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {s.ops.map(op => `• ${op}`).join('  ')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Share Week button — Feature 19 (print-friendly / shareable)
// ============================================================================

function ShareWeekButton({ weekStartISO, weekEndISO }: { weekStartISO: string; weekEndISO: string }) {
  const { language } = useTranslation();
  const t = useCalendarStore();
  const [open, setOpen] = useState(false);

  const share = () => {
    const weekTasks = t.tasks.filter(task => task.date >= weekStartISO && task.date <= weekEndISO);
    const fields = t.fields;
    const lines: string[] = [];
    lines.push(`📅 Algeria Agriculture Calendar — Week ${weekStartISO} → ${weekEndISO}`);
    lines.push(`📍 Zone: ${zoneById(t.zone).label[language]}`);
    lines.push('');
    fields.forEach(f => {
      const fieldTasks = weekTasks.filter(t => t.fieldId === f.id);
      if (fieldTasks.length === 0) return;
      lines.push(`🌾 ${f.name} (${f.cropLabel}, ${f.area} ha)`);
      fieldTasks.forEach(t => lines.push(`  · ${t.date} — ${t.title} [${t.category}]`));
      lines.push('');
    });
    if (weekTasks.length === 0) lines.push('(no tasks scheduled this week)');
    const text = lines.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setOpen(true);
      setTimeout(() => setOpen(false), 2000);
    });
  };

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={share}>
        <Share2 className="h-3 w-3 mr-1" />
        {copyFor(language, 'Share', 'مشاركة')}
      </Button>
      {open && (
        <div className="absolute top-full right-0 mt-1 rounded border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 text-[10px] text-emerald-700 dark:text-emerald-300 shadow z-10">
          ✓ {copyFor(language, 'Copied to clipboard', 'نُسخ إلى الحافظة')}
        </div>
      )}
    </div>
  );
}
