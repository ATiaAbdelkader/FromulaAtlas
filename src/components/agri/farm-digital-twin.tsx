'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, CalendarDays, CheckCircle2, ChevronRight, CircleDollarSign, CloudRain, Droplets, Edit3, FlaskConical, Layers3, Leaf, RefreshCw, Save, ShieldAlert, Sprout, Target, TrendingUp, Wheat, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { copyFor, useTranslation, type Language } from '@/lib/language-store';
import {
  buildFarmDigitalTwinSnapshot,
  DIGITAL_TWIN_CHANGED_EVENT,
  loadDigitalTwinState,
  saveDigitalTwinState,
  setDigitalTwinSelectedField,
  updateDigitalTwinFieldState,
  type DigitalTwinFieldSnapshot,
  type DigitalTwinFieldStatus,
  type DigitalTwinPriority,
  type DigitalTwinSnapshot,
} from '@/lib/farm-digital-twin';

interface FarmDigitalTwinProps {
  onOpenFarmTool?: (storageKey: string) => void;
  onOpenSimulator?: () => void;
}

const statusOptions: DigitalTwinFieldStatus[] = ['planned', 'active', 'paused', 'harvested'];

function tr(language: Language, english: string, arabic: string, french: string): string {
  return copyFor(language, english, arabic, french);
}

function formatNumber(value: number, language: Language, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en-DZ', { maximumFractionDigits }).format(value);
}

function formatDzd(value: number, language: Language): string {
  return `${formatNumber(Math.round(value), language)} DZD`;
}

function statusLabel(language: Language, status: DigitalTwinFieldStatus): string {
  const labels: Record<DigitalTwinFieldStatus, [string, string, string]> = {
    planned: ['Planned', 'مخطط', 'Planifié'],
    active: ['Active', 'نشط', 'Actif'],
    paused: ['Paused', 'متوقف مؤقتاً', 'En pause'],
    harvested: ['Harvested', 'محصود', 'Récolté'],
  };
  return tr(language, ...labels[status]);
}

function priorityLabel(language: Language, priority: DigitalTwinPriority): string {
  const labels: Record<DigitalTwinPriority['kind'], [string, string, string]> = {
    overdue_follow_up: ['Overdue follow-up', 'متابعة متأخرة', 'Suivi en retard'],
    critical_observation: ['Critical observation', 'ملاحظة حرجة', 'Observation critique'],
    soil_constraint: ['Soil constraint', 'قيد في التربة', 'Contrainte du sol'],
    nutrient_guardrail: ['Nutrient guardrail', 'تنبيه المغذيات', 'Garde-fou nutritionnel'],
  };
  return tr(language, ...labels[priority.kind]);
}

function healthTone(score: number): 'good' | 'watch' | 'risk' {
  return score >= 80 ? 'good' : score >= 55 ? 'watch' : 'risk';
}

function healthLabel(language: Language, score: number): string {
  const tone = healthTone(score);
  return tone === 'good'
    ? tr(language, 'On track', 'على المسار', 'Sur la bonne voie')
    : tone === 'watch'
      ? tr(language, 'Watch', 'تحتاج متابعة', 'À surveiller')
      : tr(language, 'At risk', 'في خطر', 'À risque');
}

function metricTone(tone: 'emerald' | 'blue' | 'amber' | 'rose' | 'slate'): string {
  return {
    emerald: 'border-emerald-200 bg-emerald-50/80 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200',
    blue: 'border-blue-200 bg-blue-50/80 text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200',
    amber: 'border-amber-200 bg-amber-50/80 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200',
    rose: 'border-rose-200 bg-rose-50/80 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200',
    slate: 'border-slate-200 bg-slate-50/80 text-slate-800 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-200',
  }[tone];
}

function Metric({ icon: Icon, label, value, detail, tone }: { icon: typeof Layers3; label: string; value: string; detail?: string; tone: 'emerald' | 'blue' | 'amber' | 'rose' | 'slate' }) {
  return (
    <div className={`rounded-2xl border p-4 ${metricTone(tone)}`}>
      <div className="flex items-start justify-between gap-2"><span className="text-xs font-semibold opacity-80">{label}</span><Icon className="h-4 w-4 opacity-75" /></div>
      <div className="mt-2 text-xl font-black tracking-tight">{value}</div>
      {detail && <div className="mt-1 text-[11px] opacity-70">{detail}</div>}
    </div>
  );
}

function ProgressBar({ value, tone = 'emerald' }: { value: number; tone?: 'emerald' | 'amber' | 'rose' }) {
  const color = tone === 'rose' ? 'bg-rose-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-emerald-500';
  return <div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

function FieldCard({ field, active, language, onSelect }: { field: DigitalTwinFieldSnapshot; active: boolean; language: Language; onSelect: () => void }) {
  const healthToneName = healthTone(field.healthScore);
  const irrigation = field.workbench.irrigation;
  return (
    <button type="button" onClick={onSelect} className={`w-full rounded-2xl border p-4 text-start transition-all hover:-translate-y-0.5 hover:shadow-md ${active ? 'border-emerald-500 bg-emerald-50/70 shadow-md ring-2 ring-emerald-500/15 dark:bg-emerald-950/30' : 'border-border/70 bg-card hover:border-emerald-300 dark:hover:border-emerald-800'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xl dark:bg-emerald-950/50" aria-hidden><Sprout className="h-5 w-5 text-emerald-700 dark:text-emerald-300" /></span>
          <div className="min-w-0"><div className="truncate text-sm font-bold">{field.field.name}</div><div className="mt-0.5 truncate text-[11px] text-muted-foreground">{field.field.crop} · {formatNumber(field.field.areaHa, language, 2)} ha</div></div>
        </div>
        <Badge variant="outline" className="shrink-0 text-[10px]">{statusLabel(language, field.status)}</Badge>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-[11px]">
        <span className={`font-semibold ${healthToneName === 'good' ? 'text-emerald-700 dark:text-emerald-300' : healthToneName === 'watch' ? 'text-amber-700 dark:text-amber-300' : 'text-rose-700 dark:text-rose-300'}`}>{healthLabel(language, field.healthScore)}</span>
        <span className="font-mono text-muted-foreground">{field.healthScore}/100</span>
      </div>
      <div className="mt-1.5"><ProgressBar value={field.healthScore} tone={healthToneName === 'risk' ? 'rose' : healthToneName === 'watch' ? 'amber' : 'emerald'} /></div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-[10px]">
        <span className="rounded-lg bg-muted/60 px-2 py-1.5 text-center text-muted-foreground"><CalendarDays className="mx-auto mb-0.5 h-3 w-3" />{field.workbench.daysSincePlanting}d</span>
        <span className="rounded-lg bg-muted/60 px-2 py-1.5 text-center text-muted-foreground"><Droplets className="mx-auto mb-0.5 h-3 w-3 text-blue-500" />{irrigation?.mmPerDay ?? 0} mm</span>
        <span className="rounded-lg bg-muted/60 px-2 py-1.5 text-center text-muted-foreground"><ShieldAlert className="mx-auto mb-0.5 h-3 w-3 text-amber-500" />{field.priorityCount}</span>
      </div>
      {field.simulator && <div className={`mt-3 rounded-lg border px-2.5 py-2 text-[10px] ${field.simulator.netMargin >= 0 ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200' : 'border-rose-200 bg-rose-50/60 text-rose-800 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-200'}`}><div className="flex items-center justify-between gap-2"><span>{tr(language, 'Expected net margin', 'الهامش الصافي المتوقع', 'Marge nette attendue')}</span><span className="font-mono font-bold">{formatDzd(field.simulator.netMargin, language)}</span></div></div>}
    </button>
  );
}

function PriorityRow({ priority, language }: { priority: DigitalTwinPriority; language: Language }) {
  const critical = priority.level === 'critical';
  return <div className={`rounded-xl border p-3 ${critical ? 'border-rose-200 bg-rose-50/60 dark:border-rose-900 dark:bg-rose-950/20' : 'border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20'}`}><div className="flex items-start gap-2"><span className={`mt-0.5 rounded-full p-1 ${critical ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'}`}>{critical ? <AlertTriangle className="h-3.5 w-3.5" /> : <Target className="h-3.5 w-3.5" />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-wide opacity-75">{priorityLabel(language, priority)}</span><Badge variant="outline" className="text-[9px]">{priority.fieldName}</Badge></div><p className="mt-1 text-xs font-semibold">{priority.title}</p><p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{priority.detail}</p></div></div></div>;
}

export function FarmDigitalTwin({ onOpenFarmTool, onOpenSimulator }: FarmDigitalTwinProps) {
  const { language, isRTL } = useTranslation();
  const [snapshot, setSnapshot] = useState<DigitalTwinSnapshot>(() => buildFarmDigitalTwinSnapshot());
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(snapshot.selectedFieldId);
  const [statusNote, setStatusNote] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = () => {
    const state = loadDigitalTwinState();
    const next = buildFarmDigitalTwinSnapshot({ state });
    setSnapshot(next);
    setSelectedFieldId(next.selectedFieldId);
    const selected = next.fields.find((field) => field.field.id === next.selectedFieldId);
    setStatusNote(selected?.statusNote ?? '');
  };

  useEffect(() => {
    refresh();
    const handleChange = () => refresh();
    window.addEventListener('storage', handleChange);
    window.addEventListener(DIGITAL_TWIN_CHANGED_EVENT, handleChange);
    window.addEventListener('formula-atlas-scout-entries-changed', handleChange);
    window.addEventListener('formula-atlas-fields-changed', handleChange);
    window.addEventListener('focus', handleChange);
    return () => {
      window.removeEventListener('storage', handleChange);
      window.removeEventListener(DIGITAL_TWIN_CHANGED_EVENT, handleChange);
      window.removeEventListener('formula-atlas-scout-entries-changed', handleChange);
      window.removeEventListener('formula-atlas-fields-changed', handleChange);
      window.removeEventListener('focus', handleChange);
    };
  }, []);

  const selectedField = useMemo(() => snapshot.fields.find((field) => field.field.id === selectedFieldId) ?? snapshot.fields[0] ?? null, [snapshot.fields, selectedFieldId]);
  const simulatorCoverage = snapshot.totals.fieldsWithSimulator > 0;

  const selectField = (field: DigitalTwinFieldSnapshot) => {
    const nextState = setDigitalTwinSelectedField(loadDigitalTwinState(), field.field.id);
    setSnapshot(buildFarmDigitalTwinSnapshot({ state: nextState }));
    setSelectedFieldId(field.field.id);
    setStatusNote(field.statusNote);
  };

  const saveFieldState = (field: DigitalTwinFieldSnapshot) => {
    const current = loadDigitalTwinState();
    const next = updateDigitalTwinFieldState(current, field.field.id, { status: field.status, statusNote });
    setSnapshot(buildFarmDigitalTwinSnapshot({ state: next }));
    setNotice(tr(language, 'Field status saved locally.', 'تم حفظ حالة الحقل محلياً.', 'Statut du champ enregistré localement.'));
    window.setTimeout(() => setNotice(''), 2200);
  };

  const updateStatus = (status: DigitalTwinFieldStatus) => {
    if (!selectedField) return;
    const state = loadDigitalTwinState();
    const next = updateDigitalTwinFieldState(state, selectedField.field.id, { status });
    setSnapshot(buildFarmDigitalTwinSnapshot({ state: next }));
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6 pb-10">
      <section className="overflow-hidden rounded-3xl border border-emerald-800/40 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 p-5 text-white shadow-xl sm:p-7">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl"><div className="mb-3 flex flex-wrap items-center gap-2"><Badge className="border-white/20 bg-white/10 text-white">{tr(language, 'Farm command center', 'مركز قيادة المزرعة', 'Centre de pilotage')}</Badge><Badge className="border-white/20 bg-white/10 text-white">{tr(language, 'Local-first · DZD', 'محلي أولاً · دج', 'Local d’abord · DZD')}</Badge></div><h2 className="text-2xl font-black tracking-tight sm:text-3xl">{tr(language, 'Farm Digital Twin', 'التوأم الرقمي للمزرعة', 'Jumeau numérique de la ferme')}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/90">{tr(language, 'One living view of your fields: crop stage, water demand, soil constraints, scouting signals, priorities, and the economics of the season.', 'رؤية حية لحقولك: مرحلة المحصول واحتياج المياه وقيود التربة وإشارات الكشف والأولويات واقتصاديات الموسم.', 'Une vue vivante de vos parcelles : stade de culture, demande en eau, contraintes du sol, observations, priorités et économie de la saison.')}</p></div>
          <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" className="gap-2 bg-white/95 text-emerald-900 hover:bg-white" onClick={refresh}><RefreshCw className="h-4 w-4" />{tr(language, 'Refresh twin', 'تحديث التوأم', 'Actualiser le jumeau')}</Button><Button type="button" variant="outline" className="gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={onOpenSimulator}><FlaskConical className="h-4 w-4" />{tr(language, 'Open Simulator', 'فتح المحاكي', 'Ouvrir le simulateur')}</Button></div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric icon={Layers3} label={tr(language, 'Fields', 'الحقول', 'Parcelles')} value={formatNumber(snapshot.totals.fieldCount, language)} detail={`${formatNumber(snapshot.totals.activeFieldCount, language)} ${tr(language, 'active', 'نشطة', 'actives')}`} tone="emerald" />
        <Metric icon={Wheat} label={tr(language, 'Cultivated area', 'المساحة المزروعة', 'Surface cultivée')} value={`${formatNumber(snapshot.totals.totalAreaHa, language, 2)} ha`} detail={`${formatNumber(snapshot.totals.plannedFieldCount, language)} ${tr(language, 'planned', 'مخططة', 'planifiées')}`} tone="blue" />
        <Metric icon={ShieldAlert} label={tr(language, 'Open priorities', 'الأولويات المفتوحة', 'Priorités ouvertes')} value={formatNumber(snapshot.priorities.length, language)} detail={`${formatNumber(snapshot.totals.totalCriticalScouting, language)} ${tr(language, 'critical observations', 'ملاحظات حرجة', 'observations critiques')}`} tone={snapshot.priorities.length ? 'amber' : 'emerald'} />
        <Metric icon={Droplets} label={tr(language, 'High water demand', 'طلب مياه مرتفع', 'Forte demande en eau')} value={formatNumber(snapshot.totals.highWaterDemandFields, language)} detail={`${formatNumber(snapshot.totals.mediumWaterDemandFields, language)} ${tr(language, 'medium', 'متوسط', 'moyenne')}`} tone="blue" />
        <Metric icon={CircleDollarSign} label={tr(language, 'Linked field cost', 'تكلفة الحقول المرتبطة', 'Coût des parcelles liées')} value={formatDzd(snapshot.totals.totalSimulatorCost, language)} detail={simulatorCoverage ? `${snapshot.totals.fieldsWithSimulator} ${tr(language, 'scenario linked', 'سيناريو مرتبط', 'scénario lié')}` : tr(language, 'Open Simulator to link economics', 'افتح المحاكي لربط الاقتصاديات', 'Ouvrez le simulateur pour lier l’économie')} tone="slate" />
        <Metric icon={TrendingUp} label={tr(language, 'Expected net margin', 'الهامش الصافي المتوقع', 'Marge nette attendue')} value={formatDzd(snapshot.totals.totalSimulatorNetMargin, language)} detail={simulatorCoverage ? tr(language, 'From saved scenario', 'من السيناريو المحفوظ', 'Depuis le scénario enregistré') : tr(language, 'Scenario not linked yet', 'لم يتم ربط سيناريو بعد', 'Scénario non lié')} tone={snapshot.totals.totalSimulatorNetMargin >= 0 ? 'emerald' : 'rose'} />
      </div>

      {snapshot.totals.fieldCount === 0 ? (
        <Card className="border-dashed border-emerald-300 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20"><CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center"><Sprout className="h-10 w-10 text-emerald-600" /><h3 className="text-base font-bold">{tr(language, 'Your twin is ready for its first field', 'التوأم جاهز لاستقبال حقله الأول', 'Votre jumeau attend sa première parcelle')}</h3><p className="max-w-md text-sm text-muted-foreground">{tr(language, 'Add a field in the Multi-Field Dashboard and this command center will automatically build its crop, soil, water, scouting, and priority view.', 'أضف حقلاً في لوحة الحقول المتعددة وسيبني مركز القيادة تلقائياً رؤية المحصول والتربة والمياه والكشف والأولويات.', 'Ajoutez une parcelle dans le tableau multi-parcelles et ce centre construira automatiquement sa vue culture, sol, eau, observations et priorités.')}</p><Button type="button" className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => onOpenFarmTool?.('collapse_multifield')}><Layers3 className="h-4 w-4" />{tr(language, 'Add first field', 'إضافة أول حقل', 'Ajouter la première parcelle')}</Button></CardContent></Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <Card className="overflow-hidden border-emerald-100/80 dark:border-emerald-950/60"><CardHeader className="border-b border-emerald-100/70 bg-gradient-to-r from-emerald-50/70 to-card pb-4 dark:border-emerald-950/70 dark:from-emerald-950/25"><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-base"><Layers3 className="h-5 w-5 text-emerald-600" />{tr(language, 'Field portfolio', 'محفظة الحقول', 'Portefeuille des parcelles')}</CardTitle><CardDescription className="mt-1 text-xs">{tr(language, 'Select a field to inspect its live operational twin.', 'اختر حقلاً لفحص توأمه التشغيلي الحي.', 'Sélectionnez une parcelle pour inspecter son jumeau opérationnel.')}</CardDescription></div><Badge variant="outline" className="border-emerald-200 text-emerald-700 dark:border-emerald-900 dark:text-emerald-300">{formatNumber(snapshot.totals.fieldsWithSoilConstraints, language)} {tr(language, 'with soil signals', 'بإشارات تربة', 'avec signaux sol')}</Badge></div></CardHeader><CardContent className="p-4"><div className="grid gap-3 md:grid-cols-2">{snapshot.fields.map((field) => <FieldCard key={field.field.id} field={field} active={selectedField?.field.id === field.field.id} language={language} onSelect={() => selectField(field)} />)}</div></CardContent></Card>

          <Card className="overflow-hidden border-amber-100/80 dark:border-amber-950/60"><CardHeader className="border-b border-amber-100/70 bg-gradient-to-r from-amber-50/70 to-card pb-4 dark:border-amber-950/70 dark:from-amber-950/20"><CardTitle className="flex items-center gap-2 text-base"><ShieldAlert className="h-5 w-5 text-amber-600" />{tr(language, 'Next best actions', 'أفضل الإجراءات التالية', 'Prochaines meilleures actions')}</CardTitle><CardDescription className="mt-1 text-xs">{tr(language, 'Priorities are derived from existing scouting, soil, and nutrient signals.', 'الأولويات مشتقة من إشارات الكشف والتربة والمغذيات الحالية.', 'Les priorités proviennent des signaux existants d’observation, de sol et de nutrition.')}</CardDescription></CardHeader><CardContent className="space-y-3 p-4">{snapshot.nextBestActions.length ? snapshot.nextBestActions.map((priority) => <PriorityRow key={`${priority.fieldId}-${priority.id}`} priority={priority} language={language} />) : <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 p-5 text-center dark:border-emerald-900 dark:bg-emerald-950/20"><CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" /><p className="mt-2 text-sm font-semibold">{tr(language, 'No urgent priorities', 'لا توجد أولويات عاجلة', 'Aucune priorité urgente')}</p><p className="mt-1 text-xs text-muted-foreground">{tr(language, 'Your current field signals are within the twin’s guardrails.', 'إشارات حقولك الحالية ضمن حدود التوأم.', 'Les signaux actuels sont dans les garde-fous du jumeau.')}</p></div>}</CardContent></Card>
        </div>
      )}

      {selectedField && <Card className="overflow-hidden border-teal-100/80 dark:border-teal-950/60"><CardHeader className="border-b border-teal-100/70 bg-gradient-to-r from-teal-50/70 to-card pb-4 dark:border-teal-950/70 dark:from-teal-950/20"><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-base"><Activity className="h-5 w-5 text-teal-600" />{tr(language, 'Selected field detail', 'تفاصيل الحقل المحدد', 'Détail de la parcelle')}</CardTitle><CardDescription className="mt-1 text-xs">{selectedField.field.name} · {selectedField.field.crop} · {formatNumber(selectedField.field.areaHa, language, 2)} ha</CardDescription></div><Badge className={selectedField.healthScore >= 80 ? 'bg-emerald-600' : selectedField.healthScore >= 55 ? 'bg-amber-600' : 'bg-rose-600'}>{selectedField.healthScore}/100 · {healthLabel(language, selectedField.healthScore)}</Badge></div></CardHeader><CardContent className="space-y-5 p-4 sm:p-5"><div className="grid gap-4 lg:grid-cols-4"><div className="rounded-xl border border-border/70 p-3"><div className="text-[11px] font-semibold text-muted-foreground">{tr(language, 'Crop stage', 'مرحلة المحصول', 'Stade de culture')}</div><div className="mt-1 text-lg font-black">{selectedField.workbench.cropStage}</div><div className="mt-1 text-xs text-muted-foreground">{selectedField.workbench.daysSincePlanting} {tr(language, 'days since planting', 'يوماً منذ الزراعة', 'jours depuis plantation')}</div></div><div className="rounded-xl border border-border/70 p-3"><div className="text-[11px] font-semibold text-muted-foreground">{tr(language, 'Water demand', 'احتياج المياه', 'Demande en eau')}</div><div className="mt-1 text-lg font-black">{selectedField.workbench.irrigation ? `${selectedField.workbench.irrigation.mmPerDay} mm/day` : '—'}</div><div className="mt-1 text-xs text-muted-foreground">Kc {selectedField.workbench.irrigation?.kc ?? '—'} · {selectedField.workbench.irrigation?.level ?? '—'}</div></div><div className="rounded-xl border border-border/70 p-3"><div className="text-[11px] font-semibold text-muted-foreground">{tr(language, 'Scouting signal', 'إشارة الكشف', 'Signal d’observation')}</div><div className="mt-1 text-lg font-black">{selectedField.workbench.scouting.openCount}</div><div className="mt-1 text-xs text-muted-foreground">{selectedField.workbench.scouting.criticalCount} {tr(language, 'critical', 'حرجة', 'critiques')} · {selectedField.workbench.scouting.overdueCount} {tr(language, 'overdue', 'متأخرة', 'en retard')}</div></div><div className="rounded-xl border border-border/70 p-3"><div className="text-[11px] font-semibold text-muted-foreground">{tr(language, 'Economics', 'الاقتصاديات', 'Économie')}</div><div className="mt-1 text-lg font-black">{selectedField.simulator ? formatDzd(selectedField.simulator.netMargin, language) : '—'}</div><div className="mt-1 text-xs text-muted-foreground">{selectedField.simulator ? `${tr(language, 'break-even', 'التعادل', 'seuil')} ${formatDzd(selectedField.simulator.breakEvenPricePerT, language)}/t` : tr(language, 'No linked scenario', 'لا يوجد سيناريو مرتبط', 'Aucun scénario lié')}</div></div></div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><div className="space-y-3"><div className="flex items-center justify-between gap-2"><h4 className="text-sm font-bold">{tr(language, 'Field controls', 'ضوابط الحقل', 'Contrôles de parcelle')}</h4><Badge variant="outline" className="text-[10px]">{tr(language, 'Persisted locally', 'محفوظ محلياً', 'Enregistré localement')}</Badge></div><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><label className="space-y-1.5"><span className="text-xs font-semibold">{tr(language, 'Operational status', 'الحالة التشغيلية', 'Statut opérationnel')}</span><select value={selectedField.status} onChange={(event) => updateStatus(event.target.value as DigitalTwinFieldStatus)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{statusOptions.map((status) => <option key={status} value={status}>{statusLabel(language, status)}</option>)}</select></label><div className="rounded-lg border border-dashed border-border/80 p-2.5 text-xs text-muted-foreground"><div className="flex items-center gap-2"><CloudRain className="h-3.5 w-3.5 text-blue-500" />{tr(language, 'Risk signals', 'إشارات المخاطر', 'Signaux de risque')}</div><div className="mt-1 font-semibold text-foreground">{selectedField.workbench.priorities.length ? tr(language, 'Review the priority rail', 'راجع قائمة الأولويات', 'Consultez les priorités') : tr(language, 'No linked alerts', 'لا توجد تنبيهات مرتبطة', 'Aucune alerte liée')}</div></div></div><label className="block space-y-1.5"><span className="text-xs font-semibold">{tr(language, 'Status note', 'ملاحظة الحالة', 'Note de statut')}</span><Textarea value={statusNote} onChange={(event) => setStatusNote(event.target.value)} rows={3} placeholder={tr(language, 'What should the farm team remember about this field?', 'ما الذي يجب أن يتذكره فريق المزرعة عن هذا الحقل؟', 'Que doit retenir l’équipe de cette parcelle ?')} /></label><Button type="button" size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => saveFieldState(selectedField)}><Save className="h-4 w-4" />{tr(language, 'Save field state', 'حفظ حالة الحقل', 'Enregistrer le statut')}</Button>{notice && <p role="status" className="text-xs text-emerald-700 dark:text-emerald-300">{notice}</p>}</div>

          <div className="space-y-3"><h4 className="text-sm font-bold">{tr(language, 'Open the detailed tools', 'فتح الأدوات التفصيلية', 'Ouvrir les outils détaillés')}</h4><div className="grid gap-2 sm:grid-cols-2"><Button type="button" variant="outline" className="justify-start gap-2" onClick={() => onOpenFarmTool?.('collapse_field_workbench')}><Activity className="h-4 w-4 text-teal-600" />{tr(language, 'Field Workbench', 'لوحة عمل الحقل', 'Atelier de parcelle')}<ChevronRight className="ms-auto h-4 w-4" /></Button><Button type="button" variant="outline" className="justify-start gap-2" onClick={() => onOpenFarmTool?.('collapse_multifield')}><Layers3 className="h-4 w-4 text-emerald-600" />{tr(language, 'Multi-Field Dashboard', 'لوحة الحقول المتعددة', 'Tableau multi-parcelles')}<ChevronRight className="ms-auto h-4 w-4" /></Button><Button type="button" variant="outline" className="justify-start gap-2" onClick={() => onOpenFarmTool?.('collapse_soil_health')}><Leaf className="h-4 w-4 text-green-600" />{tr(language, 'Soil Health', 'صحة التربة', 'Santé du sol')}<ChevronRight className="ms-auto h-4 w-4" /></Button><Button type="button" variant="outline" className="justify-start gap-2" onClick={onOpenSimulator}><BarChart3 className="h-4 w-4 text-indigo-600" />{tr(language, 'Crop Simulator', 'محاكي المحاصيل', 'Simulateur des cultures')}<ChevronRight className="ms-auto h-4 w-4" /></Button></div>{selectedField.workbench.latestSoilTest && <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs"><div className="flex items-center justify-between gap-2"><span className="font-semibold">{tr(language, 'Latest soil test', 'أحدث تحليل للتربة', 'Dernière analyse du sol')}</span><span className="font-mono text-muted-foreground">{selectedField.workbench.latestSoilTest.date}</span></div><div className="mt-2 grid grid-cols-4 gap-2"><span>pH <b>{selectedField.workbench.latestSoilTest.ph}</b></span><span>OM <b>{selectedField.workbench.latestSoilTest.om}%</b></span><span>K <b>{selectedField.workbench.latestSoilTest.k}</b></span><span>Na <b>{selectedField.workbench.latestSoilTest.na}</b></span></div></div>}</div></div>

        {selectedField.statusNote && <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50/50 p-3 text-xs leading-relaxed text-teal-900 dark:border-teal-900 dark:bg-teal-950/20 dark:text-teal-200"><Edit3 className="me-1 inline h-3.5 w-3.5" />{selectedField.statusNote}</div>}
      </CardContent></Card>}
    </div>
  );
}
