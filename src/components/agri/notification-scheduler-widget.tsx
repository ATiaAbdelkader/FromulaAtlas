'use client';

/**
 * Notification Scheduler Widget — gives the farmer a simple UI on top of
 * the `notification-scheduler` library.
 *
 * Features:
 *   - Shows the current notification permission status
 *   - "Enable Notifications" button (requests permission)
 *   - List of scheduled notifications with cancel buttons
 *   - Quick-add buttons for common schedules:
 *       1. Daily 6:00 AM — Today's farm brief
 *       2. Frost alert — if min temp < 2°C in next 3 days
 *       3. Irrigation reminder — every day at 6:00 AM
 *
 * All logic is client-side: Notification API + localStorage. No backend.
 *
 * Author: Formula Atlas — feature #8
 */

import { useEffect, useState, useCallback } from 'react';
import { Bell, BellRing, X, Clock, Snowflake, Droplets, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  CalculatorShell,
  type TrilingualString,
} from '@/components/agri/nutri-tools/CalculatorShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getNotificationPermission,
  requestNotificationPermission,
  getScheduledNotifications,
  cancelNotification,
  scheduleNotification,
  startNotificationPolling,
  checkAndFireNotifications,
  type NotificationPermissionState,
  type ScheduledNotification,
} from '@/lib/notification-scheduler';
import { useTranslation } from '@/lib/language-store';
import { toast } from '@/hooks/use-toast';

// ---------------------------------------------------------------------------
// Trilingual copy
// ---------------------------------------------------------------------------

const COPY = {
  title: {
    en: 'Push Notification Scheduler',
    fr: 'Planificateur de notifications',
    ar: 'مجدّل التنبيهات',
  } as TrilingualString,
  description: {
    en: 'Schedule daily reminders and weather alerts — everything runs in your browser, no account needed.',
    fr: 'Planifiez des rappels quotidiens et des alertes météo — tout tourne dans votre navigateur, sans compte.',
    ar: 'جدولة التذكيرات اليومية وتنبيهات الطقس — كل شيء يعمل في متصفحك دون حساب.',
  } as TrilingualString,
  permissionLabel: {
    en: 'Permission',
    fr: 'Autorisation',
    ar: 'الإذن',
  } as TrilingualString,
  enable: {
    en: 'Enable Notifications',
    fr: 'Activer les notifications',
    ar: 'تفعيل التنبيهات',
  } as TrilingualString,
  granted: {
    en: 'Granted',
    fr: 'Accordée',
    ar: 'ممنوح',
  } as TrilingualString,
  denied: {
    en: 'Denied — enable in browser settings',
    fr: 'Refusée — activez-la dans les réglages du navigateur',
    ar: 'مرفوض — فعّله من إعدادات المتصفح',
  } as TrilingualString,
  default: {
    en: 'Not asked yet',
    fr: 'Pas encore demandée',
    ar: 'غير مطلوب بعد',
  } as TrilingualString,
  unsupported: {
    en: 'Notifications not supported in this browser',
    fr: 'Notifications non prises en charge par ce navigateur',
    ar: 'التنبيهات غير مدعومة في هذا المتصفح',
  } as TrilingualString,
  scheduledList: {
    en: 'Scheduled Notifications',
    fr: 'Notifications planifiées',
    ar: 'التنبيهات المجدولة',
  } as TrilingualString,
  noneScheduled: {
    en: 'No scheduled notifications yet. Use the quick-add buttons below.',
    fr: 'Aucune notification planifiée. Utilisez les boutons ci-dessous.',
    ar: 'لا توجد تنبيهات مجدولة بعد. استخدم الأزرار أدناه.',
  } as TrilingualString,
  quickAdd: {
    en: 'Quick Add',
    fr: 'Ajout rapide',
    ar: 'إضافة سريعة',
  } as TrilingualString,
  quickDailyBrief: {
    en: 'Daily 6:00 AM — Today\u2019s farm brief',
    fr: 'Quotidien 06:00 — Brief du jour',
    ar: 'يومي 06:00 — ملخّص المزرعة',
  } as TrilingualString,
  quickFrost: {
    en: 'Frost alert — if min temp < 2°C in next 3 days',
    fr: 'Alerte gel — si t° min < 2°C sous 3 jours',
    ar: 'تنبيه صقيع — إذا كانت الصغرى < 2°م خلال 3 أيام',
  } as TrilingualString,
  quickIrrigation: {
    en: 'Irrigation reminder — every day at 6:00 AM',
    fr: 'Rappel irrigation — chaque jour à 06:00',
    ar: 'تذكير الري — كل يوم عند 06:00',
  } as TrilingualString,
  addedToast: {
    en: 'Notification scheduled',
    fr: 'Notification planifiée',
    ar: 'تمت جدولة التنبيه',
  } as TrilingualString,
  cancelledToast: {
    en: 'Notification cancelled',
    fr: 'Notification annulée',
    ar: 'تم إلغاء التنبيه',
  } as TrilingualString,
  cancel: {
    en: 'Cancel',
    fr: 'Annuler',
    ar: 'إلغاء',
  } as TrilingualString,
  recurring: {
    en: 'Daily',
    fr: 'Quotidien',
    ar: 'يومي',
  } as TrilingualString,
  oneShot: {
    en: 'One-shot',
    fr: 'Ponctuel',
    ar: 'مرة واحدة',
  } as TrilingualString,
  pollingHint: {
    en: 'Notifications are checked every 60 seconds while the app is open.',
    fr: 'Les notifications sont vérifiées toutes les 60 secondes tant que l\u2019application est ouverte.',
    ar: 'يتم فحص التنبيهات كل 60 ثانية طالما التطبيق مفتوح.',
  } as TrilingualString,
};

function pick<T extends { en: string; fr: string; ar: string }>(
  lang: ReturnType<typeof useTranslation>['language'],
  obj: T,
): string {
  return obj[lang];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotificationSchedulerWidget() {
  const { language } = useTranslation();
  const [permission, setPermission] = useState<NotificationPermissionState>('default');
  const [items, setItems] = useState<ScheduledNotification[]>([]);

  const refresh = useCallback(() => {
    setPermission(getNotificationPermission());
    setItems(getScheduledNotifications());
  }, []);

  useEffect(() => {
    refresh();
    // Start the 60-second background poll.
    const stop = startNotificationPolling();
    // Re-render on storage / custom change events.
    const onChange = () => refresh();
    if (typeof window !== 'undefined') {
      window.addEventListener('notification-scheduler:changed', onChange);
      window.addEventListener('storage', onChange);
      // Refresh visibility — covers the case where the user comes back to
      // the tab and a notification may be due.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          checkAndFireNotifications();
          refresh();
        }
      });
    }
    return () => {
      stop();
      if (typeof window !== 'undefined') {
        window.removeEventListener('notification-scheduler:changed', onChange);
        window.removeEventListener('storage', onChange);
      }
    };
  }, [refresh]);

  const handleEnable = useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      // Fire a friendly welcome notification so the user sees it works.
      try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          const n = new Notification('🔔 Notifications enabled', {
            body: pick(language, {
              en: 'You will receive daily farm briefs and weather alerts.',
              fr: 'Vous recevrez les briefs quotidiens et les alertes météo.',
              ar: 'ستتلقى الملخّصات اليومية وتنبيهات الطقس.',
            }),
          });
          setTimeout(() => n.close(), 6000);
        }
      } catch { /* ignore */ }
    }
  }, [language]);

  const handleQuickAdd = useCallback(
    (kind: 'daily_brief' | 'frost_alert' | 'irrigation_reminder') => {
      if (kind === 'daily_brief') {
        scheduleNotification(
          '06:00',
          pick(language, {
            en: "Today's farm brief is ready",
            fr: 'Votre brief quotidien est prêt',
            ar: 'ملخّص المزرعة اليومي جاهز',
          }),
          pick(language, {
            en: 'Tap to view your weather, irrigation, and task plan for today.',
            fr: 'Appuyez pour voir la météo, l\u2019irrigation et les tâches du jour.',
            ar: 'اضغط لعرض الطقس والري ومهام اليوم.',
          }),
          { kind, recurringDaily: true, emoji: '🟢' },
        );
      } else if (kind === 'frost_alert') {
        // Schedule for 21:00 tonight — a frost heads-up the night before
        // is most actionable. One-shot for tonight only.
        const tonight = new Date();
        tonight.setHours(21, 0, 0, 0);
        if (tonight.getTime() <= Date.now()) {
          tonight.setDate(tonight.getDate() + 1);
        }
        scheduleNotification(
          tonight.toISOString(),
          pick(language, {
            en: '❄️ Frost watch tonight',
            fr: '❄️ Veille gel cette nuit',
            ar: '❄️ مراقبة الصقيع الليلة',
          }),
          pick(language, {
            en: 'If the forecast minimum drops below 2°C, protect sensitive crops with covers or irrigation.',
            fr: 'Si la prévision de température minimale descend sous 2°C, protégez les cultures sensibles (voiles, irrigation).',
            ar: 'إذا انخفضت درجة الحرارة الصغرى المتوقعة دون 2°م، احمِ المحاصيل الحساسة بالتغطية أو الري.',
          }),
          { kind, recurringDaily: false, emoji: '❄️' },
        );
      } else {
        // irrigation_reminder — recurring daily at 06:00.
        scheduleNotification(
          '06:00',
          pick(language, {
            en: '💧 Irrigation reminder',
            fr: '💧 Rappel d\u2019irrigation',
            ar: '💧 تذكير الري',
          }),
          pick(language, {
            en: 'Check today\u2019s ET₀ and irrigate the field per the recommendation.',
            fr: 'Vérifiez l\u2019ET₀ du jour et irriguez selon la recommandation.',
            ar: 'تحقق من ET₀ اليوم واسقِ الحقل حسب التوصية.',
          }),
          { kind, recurringDaily: true, emoji: '💧' },
        );
      }
      refresh();
      toast({ title: pick(language, COPY.addedToast) });
    },
    [language, refresh],
  );

  const handleCancel = useCallback(
    (id: string) => {
      cancelNotification(id);
      refresh();
      toast({ title: pick(language, COPY.cancelledToast) });
    },
    [language, refresh],
  );

  const permissionBadge = (() => {
    if (permission === 'granted') {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {pick(language, COPY.granted)}
        </Badge>
      );
    }
    if (permission === 'denied') {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          {pick(language, COPY.denied)}
        </Badge>
      );
    }
    if (permission === 'unsupported') {
      return (
        <Badge variant="secondary">
          {pick(language, COPY.unsupported)}
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        {pick(language, COPY.default)}
      </Badge>
    );
  })();

  const formatFireAt = (iso: string): string => {
    const date = new Date(iso);
    return date.toLocaleString(
      language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en-DZ',
      {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'short',
      },
    );
  };

  return (
    <CalculatorShell
      icon={Bell}
      accent="emerald"
      badge="Notifications"
      title={COPY.title}
      description={COPY.description}
    >
      <CalculatorShell.Inputs>
        <div className="space-y-4">
          {/* Permission card */}
          <div className="p-4 rounded-xl border bg-card space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {pick(language, COPY.permissionLabel)}
                </span>
              </div>
              {permissionBadge}
            </div>
            {permission !== 'granted' && permission !== 'unsupported' && (
              <Button
                onClick={handleEnable}
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <BellRing className="h-4 w-4 mr-1.5" />
                {pick(language, COPY.enable)}
              </Button>
            )}
            {permission === 'denied' && (
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {pick(language, COPY.denied)}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {pick(language, COPY.pollingHint)}
            </p>
          </div>

          {/* Quick-add buttons */}
          <div className="p-4 rounded-xl border bg-card space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {pick(language, COPY.quickAdd)}
            </span>
            <QuickAddButton
              icon={Clock}
              label={pick(language, COPY.quickDailyBrief)}
              onClick={() => handleQuickAdd('daily_brief')}
              accent="emerald"
            />
            <QuickAddButton
              icon={Snowflake}
              label={pick(language, COPY.quickFrost)}
              onClick={() => handleQuickAdd('frost_alert')}
              accent="sky"
            />
            <QuickAddButton
              icon={Droplets}
              label={pick(language, COPY.quickIrrigation)}
              onClick={() => handleQuickAdd('irrigation_reminder')}
              accent="teal"
            />
          </div>
        </div>
      </CalculatorShell.Inputs>

      <CalculatorShell.Results>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {pick(language, COPY.scheduledList)}
            </span>
            <Badge variant="outline">{items.length}</Badge>
          </div>

          {items.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed text-center text-xs text-muted-foreground">
              {pick(language, COPY.noneScheduled)}
            </div>
          ) : (
            <ul className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="p-3 rounded-xl border bg-card space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-foreground truncate">
                        {item.emoji ? `${item.emoji} ` : ''}{item.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground line-clamp-2">
                        {item.body}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCancel(item.id)}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      {pick(language, COPY.cancel)}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-[10px]">
                    <Badge variant="secondary" className="font-mono">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatFireAt(item.fireAt)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        item.recurringDaily
                          ? 'border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300'
                          : ''
                      }
                    >
                      {item.recurringDaily
                        ? pick(language, COPY.recurring)
                        : pick(language, COPY.oneShot)}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CalculatorShell.Results>
    </CalculatorShell>
  );
}

// ---------------------------------------------------------------------------
// Quick-add button
// ---------------------------------------------------------------------------

const ACCENT_BG: Record<string, string> = {
  emerald: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/50',
  sky: 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-950/50',
  teal: 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-950/50',
};
const ACCENT_FG: Record<string, string> = {
  emerald: 'text-emerald-700 dark:text-emerald-300',
  sky: 'text-sky-700 dark:text-sky-300',
  teal: 'text-teal-700 dark:text-teal-300',
};

function QuickAddButton({
  icon: Icon,
  label,
  onClick,
  accent = 'emerald',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  accent?: 'emerald' | 'sky' | 'teal';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold text-left transition-colors ${ACCENT_BG[accent]} ${ACCENT_FG[accent]}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 leading-snug">{label}</span>
    </button>
  );
}
