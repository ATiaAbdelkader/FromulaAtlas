'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Droplets,
  FlaskConical,
  Gauge,
  MapPin,
  Sprout,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { copyFor, useTranslation, type Language } from '@/lib/language-store';
import { CROP_LIFECYCLES } from '@/lib/crop-lifecycle';
import { generateCropCalendar, getIrrigationSystems, type CalendarEntry, type CropCalendarResult } from '@/lib/crop-calendar-generator';
import { localizedCropName } from '@/lib/crop-localization';
import type { TabId, UserLevel } from '@/lib/user-level';

const MISSION_STORAGE_KEY = 'crop_mission_v1';

type RoleCopy = { en: string; ar: string; fr: string };

type MissionDestination = {
  label: RoleCopy;
  tab: TabId;
  storageKey?: string;
  icon: typeof CalendarDays;
};

function copyForLevel(language: Language, level: UserLevel, farmer: RoleCopy, manager: RoleCopy, professional: RoleCopy): string {
  const selected = level === 'farmer' ? farmer : level === 'manager' ? manager : professional;
  return copyFor(language, selected.en, selected.ar, selected.fr);
}

function formatDate(date: string, language: Language): string {
  if (!date) return '—';
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en-DZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

function currentWeekIndex(result: CropCalendarResult): number {
  const start = new Date(`${result.plantingDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const elapsedDays = Math.floor((today.getTime() - start.getTime()) / 86_400_000) + 1;
  if (elapsedDays <= 1) return 0;
  return Math.min(result.weeks.length - 1, Math.max(0, Math.floor((elapsedDays - 1) / 7)));
}

function weekTasks(week: CalendarEntry): Array<{ kind: 'labor' | 'fertilization' | 'irrigation' | 'risk'; label: string; detail?: string }> {
  const tasks: Array<{ kind: 'labor' | 'fertilization' | 'irrigation' | 'risk'; label: string; detail?: string }> = [];
  for (const labor of week.labor) {
    tasks.push({ kind: 'labor', label: labor.task, detail: `${labor.priority} · ${labor.laborDaysPerHa.toFixed(1)} person-days/ha` });
  }
  for (const application of week.fertilization) {
    tasks.push({
      kind: 'fertilization',
      label: `${application.method.replace('_', ' ')} · N ${application.n.toFixed(0)} / P ${application.p.toFixed(0)} / K ${application.k.toFixed(0)} kg/ha`,
      detail: application.notes,
    });
  }
  tasks.push({ kind: 'irrigation', label: week.irrigation.note, detail: `ETc ${week.irrigation.etc.toFixed(1)} mm/week` });
  if (week.risks.length > 0) {
    tasks.push({
      kind: 'risk',
      label: `${week.risks.length} ${week.risks.length === 1 ? 'scouting risk' : 'scouting risks'} to review`,
      detail: week.risks.slice(0, 2).map(risk => risk.problem.name).join(' · '),
    });
  }
  return tasks;
}

function taskIcon(kind: 'labor' | 'fertilization' | 'irrigation' | 'risk') {
  if (kind === 'labor') return Users;
  if (kind === 'fertilization') return FlaskConical;
  if (kind === 'irrigation') return Droplets;
  return TriangleAlert;
}

export interface CropMissionPlannerProps {
  level: UserLevel;
  onOpenTool: (tab: TabId, storageKey?: string) => void;
}

export function CropMissionPlanner({ level, onOpenTool }: CropMissionPlannerProps) {
  const { language, isRTL } = useTranslation();
  const [cropId, setCropId] = useState('wheat');
  const [plantingDate, setPlantingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [area, setArea] = useState('1');
  const [irrigationSystem, setIrrigationSystem] = useState('drip');
  const [avgET0, setAvgET0] = useState('5');
  const [result, setResult] = useState<CropCalendarResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MISSION_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<{
        cropId: string;
        plantingDate: string;
        area: string;
        irrigationSystem: string;
        avgET0: string;
      }>;
      if (parsed.cropId && CROP_LIFECYCLES.some(crop => crop.id === parsed.cropId)) setCropId(parsed.cropId);
      if (parsed.plantingDate) setPlantingDate(parsed.plantingDate);
      if (parsed.area) setArea(parsed.area);
      if (parsed.irrigationSystem) setIrrigationSystem(parsed.irrigationSystem);
      if (parsed.avgET0) setAvgET0(parsed.avgET0);
    } catch {
      // Ignore malformed local mission data and keep safe defaults.
    }
  }, []);

  const crop = useMemo(() => CROP_LIFECYCLES.find(item => item.id === cropId) ?? CROP_LIFECYCLES[0], [cropId]);
  const cropLabel = localizedCropName(language, crop.id, crop.name);
  const visibleWeeks = useMemo(() => {
    if (!result) return [];
    const start = currentWeekIndex(result);
    const count = level === 'farmer' ? 3 : level === 'manager' ? 5 : 7;
    return result.weeks.slice(start, start + count);
  }, [level, result]);
  const nextWeek = visibleWeeks[0];

  const destinations: MissionDestination[] = useMemo(() => [
    {
      label: { en: 'Calendar sources', ar: 'مصادر التقويم', fr: 'Sources du calendrier' },
      tab: 'calendar',
      icon: CalendarDays,
    },
    {
      label: { en: 'Irrigation action', ar: 'إجراء الري', fr: 'Action d’irrigation' },
      tab: 'farm',
      storageKey: 'collapse_irr_sched',
      icon: Droplets,
    },
    {
      label: { en: 'Nutrition action', ar: 'إجراء التغذية', fr: 'Action nutrition' },
      tab: 'farm',
      storageKey: 'collapse_fertilization',
      icon: FlaskConical,
    },
    {
      label: { en: 'Record or scout', ar: 'سجّل أو اكشف', fr: 'Enregistrer ou observer' },
      tab: 'farm',
      storageKey: level === 'professional' ? 'professional_tools_hub' : 'collapse_scouting',
      icon: ClipboardCheck,
    },
  ], [level]);

  const generateMission = () => {
    const parsedArea = Number(area);
    const parsedET0 = Number(avgET0);
    if (!plantingDate || !Number.isFinite(parsedArea) || parsedArea <= 0 || !Number.isFinite(parsedET0) || parsedET0 < 0) {
      setError(copyFor(language, 'Enter a planting date, a positive field area, and a valid ET₀ value.', 'أدخل تاريخ الزراعة ومساحة حقل موجبة وقيمة ET₀ صحيحة.', 'Saisissez une date de plantation, une surface positive et une valeur ET₀ valide.'));
      return;
    }

    const generated = generateCropCalendar({
      cropId,
      plantingDate,
      area: parsedArea,
      irrigationSystem,
      avgET0: parsedET0,
    });
    if (!generated) {
      setError(copyFor(language, 'This crop is not available in the planning dataset yet.', 'هذا المحصول غير متاح في بيانات التخطيط بعد.', 'Cette culture n’est pas encore disponible dans les données de planification.'));
      return;
    }

    setResult(generated);
    setError('');
    try {
      localStorage.setItem(MISSION_STORAGE_KEY, JSON.stringify({ cropId, plantingDate, area, irrigationSystem, avgET0 }));
    } catch {
      // The planner remains usable when browser storage is unavailable.
    }
  };

  const roleTitle = copyForLevel(language, level,
    { en: 'Your crop mission', ar: 'مهمتك الزراعية', fr: 'Votre mission culturale' },
    { en: 'Farm operating mission', ar: 'مهمة تشغيل المزرعة', fr: 'Mission opérationnelle de la ferme' },
    { en: 'Evidence-led crop mission', ar: 'مهمة محصول قائمة على الأدلة', fr: 'Mission culturale fondée sur les données' },
  );
  const roleDescription = copyForLevel(language, level,
    { en: 'Choose one crop and planting date. Formula Atlas turns the season into the next field actions.', ar: 'اختر محصولاً وتاريخ الزراعة. يحوّل Formula Atlas الموسم إلى إجراءات ميدانية تالية.', fr: 'Choisissez une culture et une date de plantation. Formula Atlas transforme la campagne en actions de terrain.' },
    { en: 'Build an operating plan with irrigation, nutrients, labor, risks, and upcoming workload in one view.', ar: 'أنشئ خطة تشغيل تشمل الري والمغذيات والعمالة والمخاطر وحجم العمل القادم في عرض واحد.', fr: 'Construisez un plan opérationnel avec irrigation, nutrition, main-d’œuvre, risques et charge à venir.' },
    { en: 'Review assumptions, stage signals, formula-linked outputs, and traceable next actions for the selected crop.', ar: 'راجع الافتراضات ومؤشرات المراحل والمخرجات المرتبطة بالمعادلات والإجراءات القابلة للتتبع.', fr: 'Examinez les hypothèses, les stades, les sorties liées aux formules et les actions traçables.' },
  );

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card className="overflow-hidden border-emerald-200/70 shadow-sm dark:border-emerald-900/70">
        <CardHeader className="border-b bg-gradient-to-r from-emerald-50 via-background to-teal-50/60 pb-4 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/20">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sprout className="h-4 w-4 text-emerald-600" />
                {roleTitle}
              </CardTitle>
              <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">{roleDescription}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px]">
              <Badge variant="outline" className="gap-1 border-emerald-300 bg-background/70 text-emerald-800 dark:border-emerald-800 dark:text-emerald-200"><MapPin className="h-3 w-3" />{copyFor(language, 'Algeria-aware', 'مكيّف مع الجزائر', 'Adapté à l’Algérie')}</Badge>
              <Badge variant="secondary" className="gap-1"><BookOpen className="h-3 w-3" />{copyFor(language, 'Source-linked', 'مرتبط بالمصدر', 'Lié aux sources')}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="sm:col-span-2 lg:col-span-1">
              <Label htmlFor="mission-crop" className="text-xs font-semibold">{copyFor(language, 'Crop', 'المحصول', 'Culture')}</Label>
              <select id="mission-crop" value={cropId} onChange={event => setCropId(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-xs">
                {CROP_LIFECYCLES.map(item => <option key={item.id} value={item.id}>{localizedCropName(language, item.id, item.name)}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="mission-planting-date" className="text-xs font-semibold">{copyFor(language, 'Planting date', 'تاريخ الزراعة', 'Date de plantation')}</Label>
              <Input id="mission-planting-date" type="date" value={plantingDate} onChange={event => setPlantingDate(event.target.value)} className="mt-1 h-9 text-xs" />
            </div>
            <div>
              <Label htmlFor="mission-area" className="text-xs font-semibold">{copyFor(language, 'Field area (ha)', 'مساحة الحقل (هكتار)', 'Surface (ha)')}</Label>
              <Input id="mission-area" type="number" min="0.01" step="0.01" value={area} onChange={event => setArea(event.target.value)} className="mt-1 h-9 text-xs" />
            </div>
            <div>
              <Label htmlFor="mission-irrigation" className="text-xs font-semibold">{copyFor(language, 'Water system', 'نظام المياه', 'Système d’eau')}</Label>
              <select id="mission-irrigation" value={irrigationSystem} onChange={event => setIrrigationSystem(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-xs">
                {getIrrigationSystems().map(system => <option key={system.id} value={system.id}>{system.label}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="mission-et0" className="text-xs font-semibold">{copyFor(language, 'Avg ET₀ (mm/day)', 'متوسط ET₀ (مم/اليوم)', 'ET₀ moyen (mm/jour)')}</Label>
              <Input id="mission-et0" type="number" min="0" step="0.1" value={avgET0} onChange={event => setAvgET0(event.target.value)} className="mt-1 h-9 text-xs" />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/60 px-3 py-2 text-[11px] dark:border-emerald-800 dark:bg-emerald-950/15">
            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100"><Gauge className="h-3.5 w-3.5" /><span>{copyFor(language, 'Planning default: ET₀ is an estimate until local weather data is available.', 'إعداد التخطيط: ET₀ تقديري إلى أن تتوفر بيانات الطقس المحلية.', 'Valeur de planification : ET₀ est estimé jusqu’à disponibilité de la météo locale.')}</span></div>
            <Button type="button" size="sm" onClick={generateMission} className="h-8 gap-1.5 bg-emerald-600 text-xs hover:bg-emerald-700"><Sprout className="h-3.5 w-3.5" />{copyFor(language, 'Build mission', 'أنشئ المهمة', 'Construire la mission')}</Button>
          </div>
          {error && <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
        </CardContent>
      </Card>

      {!result ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2 p-8 text-center">
            <CalendarDays className="h-8 w-8 text-emerald-600" />
            <h3 className="text-sm font-semibold">{copyFor(language, 'Start with one crop', 'ابدأ بمحصول واحد', 'Commencez avec une culture')}</h3>
            <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">{copyFor(language, 'The planner will show the current season stage, irrigation volume, nutrient checkpoints, labor windows, scouting risks, and source-linked calendar actions.', 'سيعرض المخطط مرحلة الموسم الحالية وحجم الري ونقاط المغذيات وفترات العمالة ومخاطر الكشف وإجراءات التقويم المرتبطة بالمصادر.', 'Le planificateur affichera le stade de campagne, le volume d’irrigation, les points nutritionnels, les fenêtres de main-d’œuvre, les risques de prospection et les actions sourcées.')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard icon={Sprout} label={copyFor(language, 'Selected crop', 'المحصول المختار', 'Culture choisie')} value={cropLabel} detail={`${result.crop.seasonLength} ${copyFor(language, 'days', 'يوماً', 'jours')}`} />
            <SummaryCard icon={Droplets} label={copyFor(language, 'Season water', 'مياه الموسم', 'Eau de campagne')} value={`${result.totalSeason.irrigationM3.toFixed(0)} m³`} detail={`${copyFor(language, 'gross planning volume', 'حجم تخطيطي إجمالي', 'volume brut planifié')} · ${result.irrigationEfficiency * 100}% ${copyFor(language, 'efficiency', 'كفاءة', 'efficacité')}`} />
            <SummaryCard icon={Users} label={copyFor(language, 'Labor load', 'عبء العمالة', 'Charge de main-d’œuvre')} value={`${result.totalSeason.laborDays.toFixed(1)}`} detail={copyFor(language, 'person-days for this area', 'يوم عمل لهذه المساحة', 'jours-personnes pour cette surface')} />
            <SummaryCard icon={TriangleAlert} label={copyFor(language, 'Risk signals', 'إشارات المخاطر', 'Signaux de risque')} value={`${result.totalSeason.riskCount}`} detail={copyFor(language, 'crop-linked issues to scout', 'مشكلات مرتبطة بالمحصول للكشف', 'problèmes liés à observer')} />
          </div>

          <Card className="border-emerald-200/70 dark:border-emerald-900/70">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{copyFor(language, 'Next field actions', 'الإجراءات الميدانية التالية', 'Prochaines actions au champ')}</CardTitle>
                  <p className="mt-1 text-[11px] text-muted-foreground">{copyFor(language, 'A role-sized view of the upcoming crop lifecycle. Open the specialist tool when a task needs deeper analysis.', 'عرض حسب الدور لمراحل المحصول القادمة. افتح الأداة المتخصصة عند الحاجة إلى تحليل أعمق.', 'Une vue adaptée au rôle des prochaines étapes. Ouvrez l’outil spécialisé pour approfondir l’analyse.')}</p>
                </div>
                {nextWeek && <Badge variant="outline" className="gap-1 text-[10px]"><Clock3 className="h-3 w-3" />{copyFor(language, `Starting ${formatDate(nextWeek.date ?? plantingDate, language)}`, `يبدأ ${formatDate(nextWeek.date ?? plantingDate, language)}`, `Début ${formatDate(nextWeek.date ?? plantingDate, language)}`)}</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {visibleWeeks.map(week => (
                <div key={`${week.week}-${week.date}`} className="rounded-xl border bg-card p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2"><span className="text-base" aria-hidden="true">{week.stageEmoji}</span><h4 className="text-sm font-semibold">{copyFor(language, `Week ${week.week} · ${week.stage}`, `الأسبوع ${week.week} · ${week.stage}`, `Semaine ${week.week} · ${week.stage}`)}</h4></div>
                      <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(week.date ?? plantingDate, language)} · {week.dayRange} · Kc {week.kc.toFixed(2)}</p>
                    </div>
                    {week.milestone && <Badge variant="secondary" className="max-w-full text-[10px]">{week.milestone}</Badge>}
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {weekTasks(week).map((task, index) => {
                      const Icon = taskIcon(task.kind);
                      return <div key={`${week.week}-${task.kind}-${index}`} className="flex gap-2 rounded-lg border border-border/70 bg-muted/20 p-2"><Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${task.kind === 'risk' ? 'text-amber-600' : task.kind === 'irrigation' ? 'text-sky-600' : task.kind === 'fertilization' ? 'text-violet-600' : 'text-emerald-600'}`} /><div className="min-w-0"><p className="text-xs font-medium leading-relaxed">{task.label}</p>{task.detail && <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{task.detail}</p>}</div></div>;
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><ArrowRight className="h-4 w-4 text-emerald-600" />{copyFor(language, 'Continue in Formula Atlas', 'تابع في Formula Atlas', 'Continuez dans Formula Atlas')}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {destinations.map(destination => {
                  const Icon = destination.icon;
                  return <Button key={`${destination.tab}-${destination.storageKey ?? 'root'}`} type="button" variant="outline" className="h-auto justify-start gap-2 p-3 text-start" onClick={() => onOpenTool(destination.tab, destination.storageKey)}><Icon className="h-4 w-4 shrink-0 text-emerald-600" /><span className="min-w-0 flex-1 text-xs">{copyFor(language, destination.label.en, destination.label.ar, destination.label.fr)}</span><ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /></Button>;
                })}
              </div>
              <Separator className="my-3" />
              <p className="text-[10px] leading-relaxed text-muted-foreground">{copyForLevel(language, level,
                { en: 'Use the calendar as the source trace, then record what you actually did in the Field Record Book.', ar: 'استخدم التقويم كمرجع مصدر ثم سجّل ما نفذته فعلياً في دفتر سجل الحقل.', fr: 'Utilisez le calendrier comme trace source, puis enregistrez ce qui a réellement été réalisé dans le carnet de parcelle.' },
                { en: 'Treat this as an operating baseline: confirm field conditions, assign labor, and update actual irrigation and inputs.', ar: 'اعتبرها خط أساس تشغيلياً: تحقق من ظروف الحقل ووزّع العمالة وحدّث الري والمدخلات الفعلية.', fr: 'Utilisez-le comme base opérationnelle : vérifiez le terrain, affectez la main-d’œuvre et actualisez l’irrigation et les intrants.' },
                { en: 'Planning values are approximations; confirm soil tests, local conditions, source notes, and professional constraints before acting.', ar: 'قيم التخطيط تقريبية؛ تحقق من تحاليل التربة والظروف المحلية وملاحظات المصادر والقيود المهنية قبل التنفيذ.', fr: 'Les valeurs sont indicatives ; confirmez analyses de sol, conditions locales, sources et contraintes professionnelles avant d’agir.' },
              )}</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, detail }: { icon: typeof Sprout; label: string; value: string; detail: string }) {
  return <Card><CardContent className="p-3"><div className="flex items-start gap-2"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 truncate text-base font-bold">{value}</p><p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{detail}</p></div></div></CardContent></Card>;
}
