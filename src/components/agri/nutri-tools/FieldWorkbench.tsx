'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CalendarDays, CheckCircle2, ClipboardList, Droplets, FlaskConical, Leaf, MapPin, RefreshCw, ShieldAlert, Sprout } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCropPreset } from '@/lib/crop-presets';
import { buildFieldWorkbenchSnapshot, type FieldWorkbenchSnapshot, type SoilConstraint, type WorkbenchField, type WorkbenchPriority } from '@/lib/field-workbench';
import { copyFor, type Language, useTranslation } from '@/lib/language-store';
import { loadScoutEntries, SCOUT_ENTRIES_CHANGED_EVENT, type ScoutEntry } from '@/lib/scouting-store';
import { getSoilTests, type SoilTestEntry } from '@/lib/soil-history-store';

const FIELDS_STORAGE_KEY = 'nutriplant_fields_v1';
const FIELD_CHANGED_EVENT = 'formula-atlas-fields-changed';

const CROP_NAMES_AR: Record<string, string> = {
  tomato: 'طماطم', strawberry: 'فراولة', avocado: 'أفوكادو', blueberry: 'توت أزرق', lettuce: 'خس',
  'bell-pepper': 'فلفل حلو', cucumber: 'خيار', citrus: 'حمضيات', coffee: 'قهوة', maize: 'ذرة',
};
const STAGE_NAMES_AR: Record<string, string> = { Initial: 'بداية', Development: 'نمو', Mid: 'منتصف', Late: 'نهاية' };
const IRRIGATION_AR: Record<string, string> = { low: 'منخفض', medium: 'متوسط', high: 'مرتفع' };
const SEVERITY_AR: Record<ScoutEntry['severity'], string> = { info: 'معلومة', warning: 'تنبيه', critical: 'حرج' };
const SCOUT_STATUS_AR: Record<string, string> = { open: 'مفتوح', monitoring: 'قيد المتابعة', resolved: 'محلول' };

function cropLabel(language: Language, cropId: string, fallback: string): string {
  return copyFor(language, fallback, CROP_NAMES_AR[cropId] ?? fallback);
}

function stageLabel(language: Language, stage: string): string {
  return copyFor(language, stage, STAGE_NAMES_AR[stage] ?? stage);
}

function readSavedFields(): WorkbenchField[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FIELDS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((field): field is WorkbenchField => Boolean(field?.id && field?.name && field?.crop)) : [];
  } catch {
    return [];
  }
}

function formatDate(language: Language, date: string | number): string {
  const value = typeof date === 'number' ? new Date(date) : new Date(`${date}T12:00:00`);
  if (Number.isNaN(value.getTime())) return '—';
  return value.toLocaleDateString(language === 'ar' ? 'ar' : language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function severityClass(severity: ScoutEntry['severity']): string {
  if (severity === 'critical') return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300';
  if (severity === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300';
  return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300';
}

function priorityCopy(language: Language, priority: WorkbenchPriority): string {
  if (priority.kind === 'overdue_follow_up') return copyFor(language, `${priority.count} overdue scouting follow-up${priority.count === 1 ? '' : 's'}`, `${priority.count} متابعة كشف حقلي متأخرة`);
  if (priority.kind === 'critical_observation') return copyFor(language, `${priority.count} critical field observation${priority.count === 1 ? '' : 's'}`, `${priority.count} ملاحظة حقلية حرجة`);
  if (priority.kind === 'nutrient_guardrail') return copyFor(language, `${priority.count} nutrient-plan guardrail${priority.count === 1 ? '' : 's'} to review`, `${priority.count} تنبيه في خطة المغذيات للمراجعة`);
  return soilConstraintCopy(language, priority.constraint!);
}

function soilConstraintCopy(language: Language, constraint: SoilConstraint): string {
  if (constraint.key === 'ph') return copyFor(language, `pH ${constraint.value.toFixed(1)} is outside the planning range`, `الرقم الهيدروجيني ${constraint.value.toFixed(1)} خارج النطاق التخطيطي`);
  if (constraint.key === 'om') return copyFor(language, `Organic matter ${constraint.value.toFixed(1)}% is low`, `المادة العضوية ${constraint.value.toFixed(1)}٪ منخفضة`);
  if (constraint.key === 'k') return copyFor(language, `Potassium ${constraint.value.toFixed(1)} meq/100g is low`, `البوتاسيوم ${constraint.value.toFixed(1)} ميكاف/100غ منخفض`);
  if (constraint.key === 'p') return copyFor(language, `Phosphorus ${constraint.value.toFixed(0)} ppm is high`, `الفوسفور ${constraint.value.toFixed(0)} جزء في المليون مرتفع`);
  return copyFor(language, `Sodium ${constraint.value.toFixed(1)} meq/100g needs attention`, `الصوديوم ${constraint.value.toFixed(1)} ميكاف/100غ يحتاج إلى انتباه`);
}

function priorityTone(priority: WorkbenchPriority): string {
  return priority.level === 'critical'
    ? 'border-red-200 bg-red-50/80 text-red-800 dark:border-red-900/70 dark:bg-red-950/20 dark:text-red-200'
    : 'border-amber-200 bg-amber-50/80 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/20 dark:text-amber-200';
}

function StatusTile({ icon: Icon, label, value, detail, tone = 'emerald' }: { icon: typeof Activity; label: string; value: string; detail: string; tone?: 'emerald' | 'blue' | 'violet' | 'amber'; }) {
  const toneClass = {
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    blue: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    violet: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  }[tone];

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClass}`}><Icon className="h-4 w-4" aria-hidden /></span>
        <span className="text-right text-base font-bold tabular-nums">{value}</span>
      </div>
      <p className="mt-3 text-xs font-semibold">{label}</p>
      <p className="mt-1 min-h-8 text-[11px] leading-relaxed text-muted-foreground">{detail}</p>
    </div>
  );
}

function SnapshotView({ snapshot, language }: { snapshot: FieldWorkbenchSnapshot; language: Language }) {
  const { field, irrigation, latestSoilTest, scouting, nutrientPlan, priorities } = snapshot;
  const preset = getCropPreset(field.crop);
  const cropName = cropLabel(language, field.crop, preset?.name ?? field.crop);
  const nutrientTotal = nutrientPlan ? nutrientPlan.totalRemaining.n + nutrientPlan.totalRemaining.p + nutrientPlan.totalRemaining.k : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-background to-background p-4 dark:border-emerald-900/70 dark:from-emerald-950/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-slate-900" aria-hidden>{preset?.emoji ?? '🌱'}</span>
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold">{field.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{cropName} · {field.areaHa} {copyFor(language, 'ha', 'هكتار')} · {snapshot.daysSincePlanting} {copyFor(language, 'days after planting', 'يوماً بعد الزراعة')}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-emerald-200 bg-white/80 text-emerald-700 dark:border-emerald-900 dark:bg-slate-900/70 dark:text-emerald-300"><Leaf className="me-1 h-3 w-3" />{stageLabel(language, snapshot.cropStage)}</Badge>
            <Badge variant="outline" className="border-border bg-white/80 text-muted-foreground dark:bg-slate-900/70"><MapPin className="me-1 h-3 w-3" />{field.areaHa} {copyFor(language, 'ha', 'هكتار')}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatusTile
          icon={Droplets}
          tone="blue"
          label={copyFor(language, 'Irrigation demand', 'احتياج الري')}
          value={irrigation ? copyFor(language, irrigation.level[0].toUpperCase() + irrigation.level.slice(1), IRRIGATION_AR[irrigation.level]) : '—'}
          detail={irrigation ? copyFor(language, `About ${irrigation.mmPerDay.toFixed(1)} mm/day at the current stage`, `نحو ${irrigation.mmPerDay.toFixed(1)} ملم/يوم في المرحلة الحالية`) : copyFor(language, 'No crop irrigation profile is available.', 'لا يتوفر ملف ري للمحصول.')}
        />
        <StatusTile
          icon={FlaskConical}
          tone="violet"
          label={copyFor(language, 'Latest soil test', 'أحدث تحليل تربة')}
          value={latestSoilTest ? `pH ${latestSoilTest.ph.toFixed(1)}` : '—'}
          detail={latestSoilTest ? copyFor(language, `${formatDate(language, latestSoilTest.date)} · OM ${latestSoilTest.om.toFixed(1)}% · K ${latestSoilTest.k.toFixed(1)}`, `${formatDate(language, latestSoilTest.date)} · مادة عضوية ${latestSoilTest.om.toFixed(1)}٪ · K ${latestSoilTest.k.toFixed(1)}`) : copyFor(language, 'Add a soil test to ground nutrient decisions in current results.', 'أضف تحليل تربة لربط قرارات المغذيات بنتائج حديثة.')}
        />
        <StatusTile
          icon={ClipboardList}
          tone={scouting.criticalCount || scouting.overdueCount ? 'amber' : 'emerald'}
          label={copyFor(language, 'Scouting work', 'مهام الكشف الحقلي')}
          value={`${scouting.openCount}`}
          detail={scouting.openCount ? copyFor(language, `${scouting.criticalCount} critical · ${scouting.overdueCount} overdue`, `${scouting.criticalCount} حرج · ${scouting.overdueCount} متأخر`) : copyFor(language, 'No open observations for this field.', 'لا توجد ملاحظات مفتوحة لهذا الحقل.')}
        />
        <StatusTile
          icon={Activity}
          tone={nutrientPlan?.warnings.length ? 'amber' : 'emerald'}
          label={copyFor(language, '4R nutrient gap', 'فجوة مغذيات 4R')}
          value={nutrientPlan ? `${Math.round(nutrientTotal)} kg` : '—'}
          detail={nutrientPlan ? copyFor(language, `Remaining N ${nutrientPlan.remaining.n} · P ${nutrientPlan.remaining.p} · K ${nutrientPlan.remaining.k} kg/ha`, `المتبقي N ${nutrientPlan.remaining.n} · P ${nutrientPlan.remaining.p} · K ${nutrientPlan.remaining.k} كغ/هكتار`) : copyFor(language, 'The selected crop does not yet have a compatible nutrient profile.', 'لا يتوفر ملف مغذيات متوافق للمحصول المختار بعد.')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"><ShieldAlert className="h-4 w-4" /></span>
            <div><h4 className="text-sm font-semibold">{copyFor(language, 'Priority board', 'لوحة الأولويات')}</h4><p className="text-[11px] text-muted-foreground">{copyFor(language, 'Signals that need a field check or a plan review.', 'إشارات تحتاج إلى فحص حقلي أو مراجعة للخطة.')}</p></div>
          </div>
          <div className="mt-3 space-y-2">
            {priorities.length ? priorities.map(priority => (
              <div key={priority.id} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${priorityTone(priority)}`}>
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>{priorityCopy(language, priority)}</span>
              </div>
            )) : (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-3 text-xs text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/20 dark:text-emerald-200"><CheckCircle2 className="h-4 w-4 shrink-0" />{copyFor(language, 'No priority signals from the information currently recorded for this field.', 'لا توجد إشارات أولوية من المعلومات المسجلة حالياً لهذا الحقل.')}</div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"><CalendarDays className="h-4 w-4" /></span>
            <div><h4 className="text-sm font-semibold">{copyFor(language, 'Next nutrient milestones', 'محطات المغذيات التالية')}</h4><p className="text-[11px] text-muted-foreground">{copyFor(language, 'Calculated from the 4R crop-stage schedule.', 'محسوبة من جدول مراحل المحصول 4R.')}</p></div>
          </div>
          <div className="mt-3 space-y-2">
            {nutrientPlan?.applications.length ? nutrientPlan.applications.slice(0, 3).map(application => (
              <div key={`${application.day}-${application.stage}`} className="flex items-center justify-between gap-3 rounded-xl bg-muted/45 px-3 py-2 text-xs">
                <div className="min-w-0"><p className="truncate font-medium">{stageLabel(language, application.stage)}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{formatDate(language, application.date)}</p></div>
                <div className="shrink-0 text-right text-[10px] text-muted-foreground">N {application.n} · P {application.p} · K {application.k}</div>
              </div>
            )) : <p className="rounded-xl bg-muted/45 px-3 py-3 text-xs text-muted-foreground">{copyFor(language, 'No staged nutrient schedule is available for this crop yet.', 'لا يتوفر جدول مغذيات مرحلي لهذا المحصول بعد.')}</p>}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-lime-50 text-lime-700 dark:bg-lime-950/40 dark:text-lime-300"><Sprout className="h-4 w-4" /></span><div><h4 className="text-sm font-semibold">{copyFor(language, 'Recent field observations', 'الملاحظات الحقلية الحديثة')}</h4><p className="text-[11px] text-muted-foreground">{copyFor(language, 'Latest scouting records for the selected field.', 'أحدث سجلات الكشف للحقل المختار.')}</p></div></div>
          <Badge variant="outline" className="text-[10px]">{scouting.entries.length} {copyFor(language, 'records', 'سجلات')}</Badge>
        </div>
        {scouting.recent.length ? <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-3">{scouting.recent.map(entry => (
          <article key={entry.id} className="rounded-xl border border-border/70 bg-muted/20 p-3">
            <div className="flex items-center justify-between gap-2"><Badge variant="outline" className={`text-[10px] ${severityClass(entry.severity)}`}>{copyFor(language, entry.severity, SEVERITY_AR[entry.severity])}</Badge><span className="text-[10px] text-muted-foreground">{formatDate(language, entry.timestamp)}</span></div>
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed">{entry.note}</p>
            <p className="mt-2 text-[10px] text-muted-foreground">{copyFor(language, 'Status', 'الحالة')}: {copyFor(language, entry.status ?? 'monitoring', SCOUT_STATUS_AR[entry.status ?? 'monitoring'])}{entry.followUpDate ? ` · ${copyFor(language, 'Follow-up', 'متابعة')}: ${formatDate(language, entry.followUpDate)}` : ''}</p>
          </article>
        ))}</div> : <p className="mt-3 rounded-xl border border-dashed border-border/80 bg-muted/20 px-3 py-4 text-xs text-muted-foreground">{copyFor(language, 'No scouting records match this field yet. Add observations in Field Scouting Log to see them here.', 'لا توجد سجلات كشف مطابقة لهذا الحقل بعد. أضف ملاحظات في سجل الكشف الحقلي لرؤيتها هنا.')}</p>}
      </section>

      <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-2.5 text-[10px] leading-relaxed text-muted-foreground">{copyFor(language, 'This workbench reads your saved field, soil-test, scouting, and 4R planning data without creating a second field record. Validate estimates against current laboratory results, product labels, weather, and local agronomic or regulatory guidance before field application.', 'تقرأ لوحة العمل هذه بيانات الحقل وتحاليل التربة والكشف والخطة 4R المحفوظة دون إنشاء سجل حقل ثانٍ. تحقّق من التقديرات مقابل نتائج المختبر الحالية وملصقات المنتجات والطقس والإرشاد الزراعي أو التنظيمي المحلي قبل التطبيق الحقلي.')}</p>
    </div>
  );
}

export function FieldWorkbench() {
  const { language, isRTL } = useTranslation();
  const [fields, setFields] = useState<WorkbenchField[]>([]);
  const [soilTests, setSoilTests] = useState<SoilTestEntry[]>([]);
  const [scoutEntries, setScoutEntries] = useState<ScoutEntry[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [hydrated, setHydrated] = useState(false);

  const refresh = () => {
    setFields(readSavedFields());
    setSoilTests(getSoilTests());
    setScoutEntries(loadScoutEntries());
  };

  useEffect(() => {
    refresh();
    setHydrated(true);
    const handleStorage = (event: StorageEvent) => {
      if ([FIELDS_STORAGE_KEY, 'nutriplant_soil_history_v1', 'nutriplant_scout_log_v1'].includes(event.key ?? '')) refresh();
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', refresh);
    window.addEventListener(FIELD_CHANGED_EVENT, refresh);
    window.addEventListener(SCOUT_ENTRIES_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', refresh);
      window.removeEventListener(FIELD_CHANGED_EVENT, refresh);
      window.removeEventListener(SCOUT_ENTRIES_CHANGED_EVENT, refresh);
    };
  }, []);

  useEffect(() => {
    if (fields.length && !fields.some(field => field.id === selectedFieldId)) setSelectedFieldId(fields[0].id);
    if (!fields.length && selectedFieldId) setSelectedFieldId('');
  }, [fields, selectedFieldId]);

  const selectedField = fields.find(field => field.id === selectedFieldId) ?? null;
  const snapshot = useMemo(() => selectedField ? buildFieldWorkbenchSnapshot(selectedField, soilTests, scoutEntries) : null, [selectedField, soilTests, scoutEntries]);

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'} className="overflow-hidden border-emerald-100/80 shadow-sm dark:border-emerald-950/60">
      <CardHeader className="border-b border-emerald-100/70 bg-gradient-to-br from-emerald-50/80 via-card to-card pb-4 dark:border-emerald-950/70 dark:from-emerald-950/30">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300"><Activity className="h-4 w-4" /></span>{copyFor(language, 'Field Workbench', 'لوحة عمل الحقل')}</CardTitle>
            <CardDescription className="mt-2 max-w-2xl text-xs leading-relaxed">{copyFor(language, 'One operational view of saved field data, soil health, irrigation demand, scouting follow-ups, and 4R nutrient milestones.', 'عرض تشغيلي واحد لبيانات الحقل المحفوظة وصحة التربة واحتياج الري ومتابعات الكشف ومحطات المغذيات 4R.')}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} className="h-9 gap-1.5" aria-label={copyFor(language, 'Refresh field data', 'تحديث بيانات الحقل')}><RefreshCw className="h-3.5 w-3.5" />{copyFor(language, 'Refresh', 'تحديث')}</Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        {!hydrated ? <div className="h-48 animate-pulse rounded-2xl bg-muted/50" aria-label={copyFor(language, 'Loading field workbench', 'جارٍ تحميل لوحة عمل الحقل')} /> : !fields.length ? <div className="rounded-2xl border border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-background to-background p-2 dark:border-emerald-900/70 dark:from-emerald-950/30"><EmptyState icon={Activity} title={copyFor(language, 'No saved fields yet', 'لا توجد حقول محفوظة بعد')} description={copyFor(language, 'Add a field in Multi-Field Dashboard, then return here to see its operational status in one place.', 'أضف حقلاً في لوحة الحقول المتعددة، ثم عد إلى هنا لرؤية حالته التشغيلية في مكان واحد.')} color="#16a34a" /></div> : <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold">{copyFor(language, 'Select a field', 'اختر حقلاً')}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{copyFor(language, 'All status cards update from the selected saved field.', 'تُحدَّث جميع بطاقات الحالة من الحقل المحفوظ المختار.')}</p></div><Select value={selectedFieldId} onValueChange={setSelectedFieldId}><SelectTrigger className="h-10 w-full sm:w-60" aria-label={copyFor(language, 'Select a field to review', 'اختر حقلاً للمراجعة')}><SelectValue placeholder={copyFor(language, 'Choose a field', 'اختر حقلاً')} /></SelectTrigger><SelectContent>{fields.map(field => <SelectItem key={field.id} value={field.id}>{field.name}</SelectItem>)}</SelectContent></Select></div>
          {snapshot && <SnapshotView snapshot={snapshot} language={language} />}
        </div>}
      </CardContent>
    </Card>
  );
}
