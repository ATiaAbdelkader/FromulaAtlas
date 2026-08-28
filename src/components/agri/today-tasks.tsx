'use client';

/**
 * Today's Tasks — aggregates tasks due today from:
 *   1. Irrigation Scheduler — calendar events for today
 *   2. Labor Calendar — operations due on today's day-of-season
 *
 * Shows a prioritized list of what the farmer should do today, grouped by
 * type (irrigation / fertilization / pest / harvest / other).
 *
 * Requires the farm profile (planting date + crop) to compute labor ops.
 * Falls back to irrigation-only if no profile is set.
 */

import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock, Droplets, FlaskConical, Bug, Sprout, Briefcase, CheckCircle2,
  ChevronRight, Calendar as CalendarIcon,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import {
  generateCalendar, type IrrigationSystem, type CalendarEvent,
} from '@/lib/irrigation-scheduler';
import {
  getCropLifecycle, stageForDay, type LaborOperation, type CropLifecycle,
} from '@/lib/crop-lifecycle';
import { useTranslation, type Language } from '@/lib/language-store';
import { localizedCropName } from '@/lib/crop-localization';
import { type UserLevel } from '@/lib/user-level';

interface TodayTask {
  id: string;
  title: string;
  type: 'irrigation' | 'fertilization' | 'pest' | 'weed' | 'pruning' | 'harvest' | 'monitoring' | 'land_prep' | 'planting' | 'post_harvest' | 'irrigation_check';
  time?: string;
  duration?: string;
  priority: 'critical' | 'recommended' | 'optional';
  source: 'irrigation' | 'labor';
  crop?: string;
  field?: string;
}

const FARM_PROFILE_KEY = 'farm_profile_v1';
const IRRIGATION_SCHED_KEY = 'irrigation_scheduler_v1';

interface FarmProfile {
  name?: string;
  crop?: string;
  plantingDate?: string;
  area?: number;
}

const TASK_ICONS: Record<TodayTask['type'], typeof Droplets> = {
  irrigation: Droplets,
  irrigation_check: Droplets,
  fertilization: FlaskConical,
  pest: Bug,
  weed: Sprout,
  pruning: Sprout,
  harvest: Sprout,
  monitoring: CheckCircle2,
  land_prep: Briefcase,
  planting: Sprout,
  post_harvest: Briefcase,
};

const TASK_COLORS: Record<TodayTask['type'], string> = {
  irrigation: '#0ea5e9',
  irrigation_check: '#0ea5e9',
  fertilization: '#16a34a',
  pest: '#dc2626',
  weed: '#84cc16',
  pruning: '#7c2d12',
  harvest: '#15803d',
  monitoring: '#475569',
  land_prep: '#92400e',
  planting: '#166534',
  post_harvest: '#7e22ce',
};

const PRIORITY_ORDER: Record<TodayTask['priority'], number> = {
  critical: 0,
  recommended: 1,
  optional: 2,
};

function copyFor(language: Language, en: string, fr: string, ar: string) {
  return language === 'ar' ? ar : language === 'fr' ? fr : en;
}

type RoleCopy = { en: string; fr: string; ar: string };

function copyForLevel(language: Language, level: UserLevel, farmer: RoleCopy, manager: RoleCopy, professional: RoleCopy) {
  const selected = level === 'farmer' ? farmer : level === 'manager' ? manager : professional;
  return copyFor(language, selected.en, selected.fr, selected.ar);
}

export function TodayTasks({ level, onOpenTool, refreshToken = 0 }: {
  level: UserLevel;
  onOpenTool: (tab: 'farm' | 'insights', storageKey?: string) => void;
  refreshToken?: number;
}) {
  const [tasks, setTasks] = useState<TodayTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useTranslation();

  useEffect(() => {
    const compute = () => {
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      const collected: TodayTask[] = [];

      // ====================================================================
      // 1. Irrigation events for today
      // ====================================================================
      try {
        const raw = localStorage.getItem(IRRIGATION_SCHED_KEY);
        if (raw) {
          const system: IrrigationSystem = JSON.parse(raw);
          const events = generateCalendar(system, todayStr, 1, undefined, 100);
          for (const ev of events) {
            const timeStr = ev.start.slice(11, 16);
            collected.push({
              id: `irr-${ev.start}`,
              title: copyFor(language, `Irrigate ${ev.zoneName}`, `Irriguer ${ev.zoneName}`, `سقِ ${ev.zoneName}`),
              type: 'irrigation',
              time: timeStr,
              duration: `${(ev.durationSec / 60).toFixed(0)} ${copyFor(language, 'min', 'min', 'د')}`,
              priority: 'critical',
              source: 'irrigation',
              field: ev.zoneName,
            });
          }
        }
      } catch { /* ignore */ }

      // ====================================================================
      // 2. Labor operations due today
      // ====================================================================
      try {
        const profileRaw = localStorage.getItem(FARM_PROFILE_KEY);
        if (profileRaw) {
          const profile: FarmProfile = JSON.parse(profileRaw);
          if (profile.crop && profile.plantingDate) {
            const crop = getCropLifecycle(profile.crop);
            if (crop) {
              const planting = new Date(profile.plantingDate + 'T00:00:00');
              const dayOfSeason = Math.floor((today.getTime() - planting.getTime()) / 86400000) + 1;
              if (dayOfSeason >= 1 && dayOfSeason <= crop.seasonLength) {
                // Find operations within ±3 days of today
                for (const op of crop.labor) {
                  const diff = Math.abs(op.day - dayOfSeason);
                  if (diff <= 3) {
                    const stage = stageForDay(crop, Math.max(1, op.day));
                    collected.push({
                      id: `labor-${op.day}-${op.type}`,
                      title: op.task,
                      type: op.type === 'irrigation' ? 'irrigation_check' : op.type,
                      time: diff === 0
                        ? copyFor(language, 'Today', 'Aujourd’hui', 'اليوم')
                        : diff === 1
                          ? (op.day > dayOfSeason
                              ? copyFor(language, 'Tomorrow', 'Demain', 'غداً')
                              : copyFor(language, 'Yesterday', 'Hier', 'أمس'))
                          : (op.day > dayOfSeason
                              ? copyFor(language, `In ${diff} days`, `Dans ${diff} jours`, `خلال ${diff} أيام`)
                              : copyFor(language, `${diff} days ago`, `Il y a ${diff} jours`, `منذ ${diff} أيام`)),
                      duration: `${op.durationDays}-${copyFor(language, 'day', 'jour', 'يوم')} ${copyFor(language, 'window', 'fenêtre', 'نافذة')}`,
                      priority: op.priority,
                      source: 'labor',
                      crop: localizedCropName(language, crop.id, crop.name),
                    });
                  }
                }
              }
            }
          }
        }
      } catch { /* ignore */ }

      // Sort: priority first, then by time
      collected.sort((a, b) => {
        const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        if (pDiff !== 0) return pDiff;
        if (a.time && b.time) return a.time.localeCompare(b.time);
        return 0;
      });

      setTasks(collected);
      setLoading(false);
    };

    compute();
  }, [language, refreshToken]);

  const criticalCount = tasks.filter(t => t.priority === 'critical').length;
  const todayCount = tasks.filter(t => t.time === copyFor(language, 'Today', 'Aujourd’hui', 'اليوم')).length;

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
          <Clock className="h-3 w-3" /> {copyForLevel(language, level, { en: 'Today\'s Tasks', fr: 'Tâches du jour', ar: 'مهام اليوم' }, { en: 'Today\'s Work Queue', fr: 'File de travaux du jour', ar: 'قائمة أعمال اليوم' }, { en: 'Today\'s Field Signals', fr: 'Signaux de parcelle du jour', ar: 'مؤشرات الحقل اليوم' })}
        </div>
        <div className="text-xs text-muted-foreground">{copyFor(language, 'Loading…', 'Chargement…', 'جارٍ التحميل...')}</div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
          <Clock className="h-3 w-3" /> {copyForLevel(language, level, { en: 'Today\'s Tasks', fr: 'Tâches du jour', ar: 'مهام اليوم' }, { en: 'Today\'s Work Queue', fr: 'File de travaux du jour', ar: 'قائمة أعمال اليوم' }, { en: 'Today\'s Field Signals', fr: 'Signaux de parcelle du jour', ar: 'مؤشرات الحقل اليوم' })}
        </div>
        <EmptyState
          icon={CalendarIcon}
          title={copyFor(language, 'No tasks scheduled today', 'Aucune tâche prévue aujourd’hui', 'لا مهام مجدولة اليوم')}
          description={copyForLevel(language, level,
            { en: 'Set up your farm profile (crop + planting date) and irrigation schedules to see daily tasks here.', fr: 'Configurez le profil de votre ferme (culture + date de plantation) et les programmes d’irrigation pour voir les tâches quotidiennes ici.', ar: 'أعدّ ملف مزرعتك (محصول + تاريخ زراعة) وجداول الري لرؤية المهام اليومية هنا.' },
            { en: 'Complete the operating profile (primary crop + season date) and irrigation schedules to build today\'s work queue.', fr: 'Complétez le profil opérationnel (culture principale + date de campagne) et les programmes d’irrigation pour construire la file du jour.', ar: 'أكمل ملف التشغيل (المحصول الرئيسي + تاريخ الموسم) وجداول الري لبناء قائمة أعمال اليوم.' },
            { en: 'Complete the site context (crop + season date) and irrigation schedules to surface today\'s field signals.', fr: 'Complétez le contexte du site (culture + date de campagne) et les programmes d’irrigation pour afficher les signaux du jour.', ar: 'أكمل سياق الموقع (المحصول + تاريخ الموسم) وجداول الري لإظهار مؤشرات الحقل اليوم.' },
          )}
          color="#0891b2"
          variant="compact"
          action={{ label: copyForLevel(language, level, { en: 'Set up farm profile', fr: 'Configurer le profil de la ferme', ar: 'إعداد ملف المزرعة' }, { en: 'Complete operating profile', fr: 'Compléter le profil opérationnel', ar: 'أكمل ملف التشغيل' }, { en: 'Complete site context', fr: 'Compléter le contexte du site', ar: 'أكمل سياق الموقع' }), onClick: () => onOpenTool('farm') }}
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <Clock className="h-3 w-3" /> {copyForLevel(language, level, { en: 'Today\'s Tasks', fr: 'Tâches du jour', ar: 'مهام اليوم' }, { en: 'Today\'s Work Queue', fr: 'File de travaux du jour', ar: 'قائمة أعمال اليوم' }, { en: 'Today\'s Field Signals', fr: 'Signaux de parcelle du jour', ar: 'مؤشرات الحقل اليوم' })}
        </div>
        <div className="flex items-center gap-1.5">
          {criticalCount > 0 && (
            <Badge variant="destructive" className="text-[9px]">{criticalCount} {copyFor(language, 'critical', 'critique(s)', 'حرج')}</Badge>
          )}
          <Badge variant="outline" className="text-[9px]">{tasks.length} {copyFor(language, 'total', 'au total', 'كل')}</Badge>
        </div>
      </div>

      <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
        {tasks.map(task => {
          const Icon = TASK_ICONS[task.type] ?? Clock;
          const color = TASK_COLORS[task.type] ?? '#475569';
          return (
            <div
              key={task.id}
              className="flex items-center gap-2 rounded-md border bg-background p-2 hover:bg-muted/30 transition-colors"
              style={{ borderLeftWidth: 3, borderLeftColor: color }}
            >
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: color + '20' }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium leading-tight truncate">{task.title}</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  {task.time && <span className="font-mono">{task.time}</span>}
                  {task.duration && <span>· {task.duration}</span>}
                  {task.crop && <span>· {task.crop}</span>}
                </div>
              </div>
              {task.priority === 'critical' && (
                <Badge variant="destructive" className="text-[9px] shrink-0">!</Badge>
              )}
              {task.source === 'irrigation' && (
                <Badge variant="outline" className="text-[9px] shrink-0 text-cyan-600">💧</Badge>
              )}
            </div>
          );
        })}
      </div>

      {todayCount > 0 && (
        <div className="mt-2 pt-2 border-t text-[10px] text-muted-foreground text-center">
          {todayCount} {copyFor(language, todayCount === 1 ? 'task due today' : 'tasks due today', todayCount === 1 ? 'tâche due aujourd’hui' : 'tâches dues aujourd’hui', 'مهمة مستحقة اليوم')} · {tasks.length - todayCount} {copyFor(language, 'upcoming', 'à venir', 'قادمة')}
        </div>
      )}
    </div>
  );
}
