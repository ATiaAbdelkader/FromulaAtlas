'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CalendarDays, CheckCircle2, ClipboardList, Droplets, FlaskConical, Leaf, MapPin, RefreshCw, ShieldAlert, Sprout, Copy, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCropPreset } from '@/lib/crop-presets';
import { buildFieldWorkbenchSnapshot, type FieldWorkbenchSnapshot, type SoilConstraint, type WorkbenchField, type WorkbenchPriority } from '@/lib/field-workbench';
import { copyFor, type Language, useTranslation } from '@/lib/language-store';
import { loadScoutEntries, SCOUT_ENTRIES_CHANGED_EVENT, type ScoutEntry } from '@/lib/scouting-store';
import { getSoilTests, type SoilTestEntry } from '@/lib/soil-history-store';
import { toast } from '@/hooks/use-toast';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';

const FIELDS_STORAGE_KEY = 'nutriplant_fields_v1';
const FIELD_CHANGED_EVENT = 'formula-atlas-fields-changed';

const CROP_NAMES_AR: Record<string, string> = {
  tomato: 'طماطم', strawberry: 'فراولة', avocado: 'أفوكادو', blueberry: 'توت أزرق', lettuce: 'خس',
  'bell-pepper': 'فلفل حلو', cucumber: 'خيار', citrus: 'حمضيات', coffee: 'قهوة', maize: 'ذرة',
};
const CROP_NAMES_FR: Record<string, string> = {
  tomato: 'Tomate', strawberry: 'Fraise', avocado: 'Avocat', blueberry: 'Myrtille', lettuce: 'Laitue',
  'bell-pepper': 'Poivron', cucumber: 'Concombre', citrus: 'Agrumes', coffee: 'Café', maize: 'Maïs',
};
const STAGE_NAMES_AR: Record<string, string> = { Initial: 'بداية', Development: 'نمو', Mid: 'منتصف', Late: 'نهاية' };
const STAGE_NAMES_FR: Record<string, string> = { Initial: 'Initial', Development: 'Développement', Mid: 'Mi-saison', Late: 'Fin' };
const IRRIGATION_AR: Record<string, string> = { low: 'منخفض', medium: 'متوسط', high: 'مرتفع' };
const IRRIGATION_FR: Record<string, string> = { low: 'Faible', medium: 'Moyen', high: 'Élevé' };
const SEVERITY_AR: Record<ScoutEntry['severity'], string> = { info: 'معلومة', warning: 'تنبيه', critical: 'حرج' };
const SEVERITY_FR: Record<ScoutEntry['severity'], string> = { info: 'Info', warning: 'Alerte', critical: 'Critique' };
const SCOUT_STATUS_AR: Record<string, string> = { open: 'مفتوح', monitoring: 'قيد المتابعة', resolved: 'محلول' };
const SCOUT_STATUS_FR: Record<string, string> = { open: 'Ouvert', monitoring: 'Suivi', resolved: 'Résolu' };

function cropLabel(language: Language, cropId: string, fallback: string): string {
  return copyFor(language, fallback, CROP_NAMES_AR[cropId] ?? fallback, CROP_NAMES_FR[cropId] ?? fallback);
}

function stageLabel(language: Language, stage: string): string {
  return copyFor(language, stage, STAGE_NAMES_AR[stage] ?? stage, STAGE_NAMES_FR[stage] ?? stage);
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
  if (priority.kind === 'overdue_follow_up') return copyFor(language, `${priority.count} overdue scouting follow-up${priority.count === 1 ? '' : 's'}`, `${priority.count} متابعة كشف حقلي متأخرة`, `${priority.count} suivi${priority.count === 1 ? '' : 's'} de prospection en retard`);
  if (priority.kind === 'critical_observation') return copyFor(language, `${priority.count} critical field observation${priority.count === 1 ? '' : 's'}`, `${priority.count} ملاحظة حقلية حرجة`, `${priority.count} observation${priority.count === 1 ? '' : 's'} critique${priority.count === 1 ? '' : 's'}`);
  if (priority.kind === 'nutrient_guardrail') return copyFor(language, `${priority.count} nutrient-plan guardrail${priority.count === 1 ? '' : 's'} to review`, `${priority.count} تنبيه في خطة المغذيات للمراجعة`, `${priority.count} garde-fou${priority.count === 1 ? '' : 'x'} de plan nutritionnel à revoir`);
  return soilConstraintCopy(language, priority.constraint!);
}

function soilConstraintCopy(language: Language, constraint: SoilConstraint): string {
  if (constraint.key === 'ph') return copyFor(language, `pH ${constraint.value.toFixed(1)} is outside the planning range`, `الرقم الهيدروجيني ${constraint.value.toFixed(1)} خارج النطاق التخطيطي`, `pH ${constraint.value.toFixed(1)} hors de la plage de planification`);
  if (constraint.key === 'om') return copyFor(language, `Organic matter ${constraint.value.toFixed(1)}% is low`, `المادة العضوية ${constraint.value.toFixed(1)}٪ منخفضة`, `Matière organique ${constraint.value.toFixed(1)}% basse`);
  if (constraint.key === 'k') return copyFor(language, `Potassium ${constraint.value.toFixed(1)} meq/100g is low`, `البوتاسيوم ${constraint.value.toFixed(1)} ميكاف/100غ منخفض`, `Potassium ${constraint.value.toFixed(1)} méq/100g bas`);
  if (constraint.key === 'p') return copyFor(language, `Phosphorus ${constraint.value.toFixed(0)} ppm is high`, `الفوسفور ${constraint.value.toFixed(0)} جزء في المليون مرتفع`, `Phosphore ${constraint.value.toFixed(0)} ppm élevé`);
  return copyFor(language, `Sodium ${constraint.value.toFixed(1)} meq/100g needs attention`, `الصوديوم ${constraint.value.toFixed(1)} ميكاف/100غ يحتاج إلى انتباه`, `Sodium ${constraint.value.toFixed(1)} méq/100g à surveiller`);
}

function priorityTone(priority: WorkbenchPriority): string {
  return priority.level === 'critical'
    ? 'border-red-200 bg-red-50/80 text-red-800 dark:border-red-900/70 dark:bg-red-950/20 dark:text-red-200'
    : 'border-amber-200 bg-amber-50/80 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/20 dark:text-amber-200';
}

const TITLE: TrilingualString = {
  en: 'Field Workbench',
  ar: 'لوحة عمل الحقل',
  fr: 'Atelier de parcelle',
};

const DESC: TrilingualString = {
  en: 'One operational view of saved field data, soil health, irrigation demand, scouting follow-ups, and 4R nutrient milestones.',
  ar: 'عرض تشغيلي واحد لبيانات الحقل المحفوظة وصحة التربة واحتياج الري ومتابعات الكشف ومحطات المغذيات 4R.',
  fr: 'Une vue opérationnelle des données parcelle sauvegardées : santé du sol, demande d\'irrigation, suivis de prospection et étapes nutritionnelles 4R.',
};

const PROTOCOL_NOTE: TrilingualString = {
  en: 'This workbench reads your saved field, soil-test, scouting, and 4R planning data without creating a second field record. Validate estimates against current laboratory results, product labels, weather, and local agronomic or regulatory guidance before field application.',
  ar: 'تقرأ لوحة العمل هذه بيانات الحقل وتحاليل التربة والكشف والخطة 4R المحفوظة دون إنشاء سجل حقل ثانٍ. تحقّق من التقديرات مقابل نتائج المختبر الحالية وملصقات المنتجات والطقس والإرشاد الزراعي أو التنظيمي المحلي قبل التطبيق الحقلي.',
  fr: 'Cet atelier lit vos données parcelle, analyses de sol, prospection et planification 4R sauvegardées sans créer un second enregistrement. Validez les estimations face aux résultats de laboratoire, étiquettes produits, météo et conseils agronomiques ou réglementaires locaux avant application au champ.',
};

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
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
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
              <p className="mt-1 text-xs text-muted-foreground">{cropName} · {field.areaHa} {tr('ha', 'هكتار', 'ha')} · {snapshot.daysSincePlanting} {tr('days after planting', 'يوماً بعد الزراعة', 'jours après semis')}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-emerald-200 bg-white/80 text-emerald-700 dark:border-emerald-900 dark:bg-slate-900/70 dark:text-emerald-300"><Leaf className="me-1 h-3 w-3" />{stageLabel(language, snapshot.cropStage)}</Badge>
            <Badge variant="outline" className="border-border bg-white/80 text-muted-foreground dark:bg-slate-900/70"><MapPin className="me-1 h-3 w-3" />{field.areaHa} {tr('ha', 'هكتار', 'ha')}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatusTile
          icon={Droplets}
          tone="blue"
          label={tr('Irrigation demand', 'احتياج الري', 'Demande d\'irrigation')}
          value={irrigation ? copyFor(language, irrigation.level[0].toUpperCase() + irrigation.level.slice(1), IRRIGATION_AR[irrigation.level], IRRIGATION_FR[irrigation.level]) : '—'}
          detail={irrigation ? copyFor(language, `About ${irrigation.mmPerDay.toFixed(1)} mm/day at the current stage`, `نحو ${irrigation.mmPerDay.toFixed(1)} ملم/يوم في المرحلة الحالية`, `Environ ${irrigation.mmPerDay.toFixed(1)} mm/jour au stade actuel`) : tr('No crop irrigation profile is available.', 'لا يتوفر ملف ري للمحصول.', 'Aucun profil d\'irrigation disponible.')}
        />
        <StatusTile
          icon={FlaskConical}
          tone="violet"
          label={tr('Latest soil test', 'أحدث تحليل تربة', 'Dernière analyse de sol')}
          value={latestSoilTest ? `pH ${latestSoilTest.ph.toFixed(1)}` : '—'}
          detail={latestSoilTest ? copyFor(language, `${formatDate(language, latestSoilTest.date)} · OM ${latestSoilTest.om.toFixed(1)}% · K ${latestSoilTest.k.toFixed(1)}`, `${formatDate(language, latestSoilTest.date)} · مادة عضوية ${latestSoilTest.om.toFixed(1)}٪ · K ${latestSoilTest.k.toFixed(1)}`, `${formatDate(language, latestSoilTest.date)} · MO ${latestSoilTest.om.toFixed(1)}% · K ${latestSoilTest.k.toFixed(1)}`) : tr('Add a soil test to ground nutrient decisions in current results.', 'أضف تحليل تربة لربط قرارات المغذيات بنتائج حديثة.', 'Ajoutez une analyse de sol pour fonder les décisions nutritionnelles sur des résultats récents.')}
        />
        <StatusTile
          icon={ClipboardList}
          tone={scouting.criticalCount || scouting.overdueCount ? 'amber' : 'emerald'}
          label={tr('Scouting work', 'مهام الكشف الحقلي', 'Travaux de prospection')}
          value={`${scouting.openCount}`}
          detail={scouting.openCount ? copyFor(language, `${scouting.criticalCount} critical · ${scouting.overdueCount} overdue`, `${scouting.criticalCount} حرج · ${scouting.overdueCount} متأخر`, `${scouting.criticalCount} critique · ${scouting.overdueCount} en retard`) : tr('No open observations for this field.', 'لا توجد ملاحظات مفتوحة لهذا الحقل.', 'Aucune observation ouverte pour cette parcelle.')}
        />
        <StatusTile
          icon={Activity}
          tone={nutrientPlan?.warnings.length ? 'amber' : 'emerald'}
          label={tr('4R nutrient gap', 'فجوة مغذيات 4R', 'Écart nutritionnel 4R')}
          value={nutrientPlan ? `${Math.round(nutrientTotal)} kg` : '—'}
          detail={nutrientPlan ? copyFor(language, `Remaining N ${nutrientPlan.remaining.n} · P ${nutrientPlan.remaining.p} · K ${nutrientPlan.remaining.k} kg/ha`, `المتبقي N ${nutrientPlan.remaining.n} · P ${nutrientPlan.remaining.p} · K ${nutrientPlan.remaining.k} كغ/هكتار`, `Restant N ${nutrientPlan.remaining.n} · P ${nutrientPlan.remaining.p} · K ${nutrientPlan.remaining.k} kg/ha`) : tr('The selected crop does not yet have a compatible nutrient profile.', 'لا يتوفر ملف مغذيات متوافق للمحصول المختار بعد.', 'La culture sélectionnée n\'a pas encore de profil nutritionnel compatible.')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"><ShieldAlert className="h-4 w-4" /></span>
            <div><h4 className="text-sm font-semibold">{tr('Priority board', 'لوحة الأولويات', 'Tableau des priorités')}</h4><p className="text-[11px] text-muted-foreground">{tr('Signals that need a field check or a plan review.', 'إشارات تحتاج إلى فحص حقلي أو مراجعة للخطة.', 'Signaux nécessitant un contrôle terrain ou une revue de plan.')}</p></div>
          </div>
          <div className="mt-3 space-y-2">
            {priorities.length ? priorities.map(priority => (
              <div key={priority.id} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${priorityTone(priority)}`}>
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>{priorityCopy(language, priority)}</span>
              </div>
            )) : (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-3 text-xs text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/20 dark:text-emerald-200"><CheckCircle2 className="h-4 w-4 shrink-0" />{tr('No priority signals from the information currently recorded for this field.', 'لا توجد إشارات أولوية من المعلومات المسجلة حالياً لهذا الحقل.', 'Aucun signal de priorité à partir des informations actuellement enregistrées pour cette parcelle.')}</div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"><CalendarDays className="h-4 w-4" /></span>
            <div><h4 className="text-sm font-semibold">{tr('Next nutrient milestones', 'محطات المغذيات التالية', 'Prochaines étapes nutritionnelles')}</h4><p className="text-[11px] text-muted-foreground">{tr('Calculated from the 4R crop-stage schedule.', 'محسوبة من جدول مراحل المحصول 4R.', 'Calculées à partir du calendrier 4R des stades culturaux.')}</p></div>
          </div>
          <div className="mt-3 space-y-2">
            {nutrientPlan?.applications.length ? nutrientPlan.applications.slice(0, 3).map(application => (
              <div key={`${application.day}-${application.stage}`} className="flex items-center justify-between gap-3 rounded-xl bg-muted/45 px-3 py-2 text-xs">
                <div className="min-w-0"><p className="truncate font-medium">{stageLabel(language, application.stage)}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{formatDate(language, application.date)}</p></div>
                <div className="shrink-0 text-right text-[10px] text-muted-foreground">N {application.n} · P {application.p} · K {application.k}</div>
              </div>
            )) : <p className="rounded-xl bg-muted/45 px-3 py-3 text-xs text-muted-foreground">{tr('No staged nutrient schedule is available for this crop yet.', 'لا يتوفر جدول مغذيات مرحلي لهذا المحصول بعد.', 'Aucun calendrier nutritionnel par étape disponible pour cette culture.')}</p>}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-lime-50 text-lime-700 dark:bg-lime-950/40 dark:text-lime-300"><Sprout className="h-4 w-4" /></span><div><h4 className="text-sm font-semibold">{tr('Recent field observations', 'الملاحظات الحقلية الحديثة', 'Observations récentes')}</h4><p className="text-[11px] text-muted-foreground">{tr('Latest scouting records for the selected field.', 'أحدث سجلات الكشف للحقل المختار.', 'Derniers enregistrements de prospection pour la parcelle sélectionnée.')}</p></div></div>
          <Badge variant="outline" className="text-[10px]">{scouting.entries.length} {tr('records', 'سجلات', 'entrées')}</Badge>
        </div>
        {scouting.recent.length ? <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-3">{scouting.recent.map(entry => (
          <article key={entry.id} className="rounded-xl border border-border/70 bg-muted/20 p-3">
            <div className="flex items-center justify-between gap-2"><Badge variant="outline" className={`text-[10px] ${severityClass(entry.severity)}`}>{copyFor(language, entry.severity, SEVERITY_AR[entry.severity], SEVERITY_FR[entry.severity])}</Badge><span className="text-[10px] text-muted-foreground">{formatDate(language, entry.timestamp)}</span></div>
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed">{entry.note}</p>
            <p className="mt-2 text-[10px] text-muted-foreground">{tr('Status', 'الحالة', 'Statut')}: {copyFor(language, entry.status ?? 'monitoring', SCOUT_STATUS_AR[entry.status ?? 'monitoring'], SCOUT_STATUS_FR[entry.status ?? 'monitoring'])}{entry.followUpDate ? ` · ${tr('Follow-up', 'متابعة', 'Suivi')}: ${formatDate(language, entry.followUpDate)}` : ''}</p>
          </article>
        ))}</div> : <p className="mt-3 rounded-xl border border-dashed border-border/80 bg-muted/20 px-3 py-4 text-xs text-muted-foreground">{tr('No scouting records match this field yet. Add observations in Field Scouting Log to see them here.', 'لا توجد سجلات كشف مطابقة لهذا الحقل بعد. أضف ملاحظات في سجل الكشف الحقلي لرؤيتها هنا.', 'Aucun enregistrement de prospection ne correspond à cette parcelle. Ajoutez des observations dans le Journal de prospection pour les voir ici.')}</p>}
      </section>
    </div>
  );
}

export function FieldWorkbench() {
  const { language, isRTL } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);

  const [fields, setFields] = useState<WorkbenchField[]>([]);
  const [soilTests, setSoilTests] = useState<SoilTestEntry[]>([]);
  const [scoutEntries, setScoutEntries] = useState<ScoutEntry[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleReset = () => {
    setSelectedFieldId(fields.length ? fields[0].id : '');
    toast({ title: tr('Reset selection', 'تمت إعادة التعيين', 'Sélection réinitialisée') });
  };

  const handleCopy = () => {
    if (!snapshot) {
      toast({ title: tr('No field selected', 'لا يوجد حقل مختار', 'Aucune parcelle sélectionnée') });
      return;
    }
    const { field, irrigation, latestSoilTest, scouting, nutrientPlan, priorities } = snapshot;
    const preset = getCropPreset(field.crop);
    const cropName = cropLabel(language, field.crop, preset?.name ?? field.crop);
    const nutrientTotal = nutrientPlan ? nutrientPlan.totalRemaining.n + nutrientPlan.totalRemaining.p + nutrientPlan.totalRemaining.k : 0;
    const lines = [
      `=== FIELD WORKBENCH ===`,
      `Field: ${field.name}`,
      `Crop: ${cropName} · ${field.areaHa} ha`,
      `Days after planting: ${snapshot.daysSincePlanting}`,
      `Stage: ${stageLabel(language, snapshot.cropStage)}`,
      ``,
      `Irrigation: ${irrigation ? `${irrigation.level} (~${irrigation.mmPerDay.toFixed(1)} mm/day)` : '—'}`,
      `Soil test: ${latestSoilTest ? `pH ${latestSoilTest.ph.toFixed(1)} · OM ${latestSoilTest.om.toFixed(1)}% · K ${latestSoilTest.k.toFixed(1)}` : '—'}`,
      `Scouting: ${scouting.openCount} open (${scouting.criticalCount} critical · ${scouting.overdueCount} overdue)`,
      `4R nutrient gap: ${nutrientPlan ? `${Math.round(nutrientTotal)} kg (N ${nutrientPlan.remaining.n} · P ${nutrientPlan.remaining.p} · K ${nutrientPlan.remaining.k})` : '—'}`,
      ``,
      `Priorities (${priorities.length}):`,
      ...priorities.map(p => `  • ${priorityCopy(language, p)}`),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    toast({ title: tr('Summary Copied!', 'تم النسخ!', 'Copié !') });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <CalculatorShell
      icon={Activity}
      title={TITLE}
      description={DESC}
      badge="4R Nutrient"
      accent="teal"
      actions={[
        {
          icon: Copy,
          label: { en: 'Copy Summary', ar: 'نسخ التقرير', fr: 'Copier' },
          onClick: handleCopy,
          variant: 'primary',
          showCheck: copied,
        },
        {
          icon: RotateCcw,
          label: { en: 'Reset', ar: 'إعادة تعيين', fr: 'Réinitialiser' },
          onClick: handleReset,
        },
      ]}
      protocolNote={PROTOCOL_NOTE}
    >
      <CalculatorShell.Inputs>
        <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-base font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-teal-600" />
              {tr('Field Selector', 'محدد الحقل', 'Sélecteur de parcelle')}
            </span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold">{tr('Select a field', 'اختر حقلاً', 'Sélectionner une parcelle')}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{tr('All status cards update from the selected saved field.', 'تُحدَّث جميع بطاقات الحالة من الحقل المحفوظ المختار.', 'Toutes les cartes de statut se mettent à jour depuis la parcelle sauvegardée sélectionnée.')}</p>
            </div>
            <Button variant="outline" size="sm" onClick={refresh} className="h-9 gap-1.5" aria-label={tr('Refresh field data', 'تحديث بيانات الحقل', 'Rafraîchir les données')}>
              <RefreshCw className="h-3.5 w-3.5" />
              {tr('Refresh', 'تحديث', 'Rafraîchir')}
            </Button>
          </div>

          {hydrated && fields.length > 0 ? (
            <Select value={selectedFieldId} onValueChange={setSelectedFieldId}>
              <SelectTrigger className="h-10 w-full" aria-label={tr('Select a field to review', 'اختر حقلاً للمراجعة', 'Sélectionner une parcelle à examiner')}>
                <SelectValue placeholder={tr('Choose a field', 'اختر حقلاً', 'Choisir une parcelle')} />
              </SelectTrigger>
              <SelectContent>
                {fields.map(field => <SelectItem key={field.id} value={field.id}>{field.name}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <div className="rounded-lg border border-dashed border-teal-200 bg-teal-50/40 p-3 text-center text-xs text-muted-foreground">
              {hydrated ? tr('No saved fields. Add a field in Multi-Field Dashboard.', 'لا توجد حقول محفوظة. أضف حقلاً في لوحة الحقول المتعددة.', 'Aucune parcelle sauvegardée. Ajoutez-en une dans le Tableau de bord multi-parcelles.') : tr('Loading saved fields…', 'جارٍ تحميل الحقول المحفوظة…', 'Chargement des parcelles sauvegardées…')}
            </div>
          )}
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="p-4 rounded-2xl border bg-card shadow-xs h-full space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
          {!hydrated ? (
            <div className="h-48 animate-pulse rounded-2xl bg-muted/50" aria-label={tr('Loading field workbench', 'جارٍ تحميل لوحة عمل الحقل', 'Chargement de l\'atelier de parcelle')} />
          ) : !fields.length ? (
            <div className="rounded-2xl border border-dashed border-teal-200 bg-gradient-to-br from-teal-50/80 via-background to-background p-2 dark:border-teal-900/70 dark:from-teal-950/30">
              <EmptyState
                icon={Activity}
                title={tr('No saved fields yet', 'لا توجد حقول محفوظة بعد', 'Aucune parcelle sauvegardée')}
                description={tr('Add a field in Multi-Field Dashboard, then return here to see its operational status in one place.', 'أضف حقلاً في لوحة الحقول المتعددة، ثم عد إلى هنا لرؤية حالته التشغيلية في مكان واحد.', 'Ajoutez une parcelle dans le Tableau de bord multi-parcelles, puis revenez ici pour voir son statut opérationnel au même endroit.')}
                color="#0d9488"
              />
            </div>
          ) : snapshot ? (
            <SnapshotView snapshot={snapshot} language={language} />
          ) : null}
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}
