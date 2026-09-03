/**
 * Notification Scheduler — client-side reminders via the browser's
 * Notification API + localStorage persistence.
 *
 * Used by:
 *   - WhatsApp Daily Brief "Schedule Daily" button
 *   - Notification Scheduler Widget (Farm tab)
 *
 * Design:
 *   - 100% client-side — no backend, no service worker required (uses
 *     `new Notification(...)` directly while the tab is open).
 *   - Pending notifications live in localStorage under
 *     `notification_scheduler_v1` so they survive page reloads.
 *   - `checkAndFireNotifications()` is polled every 60s by the widget,
 *     but is also safe to call manually (e.g., on app load).
 *   - SSR-safe: every entry point checks `typeof window !== 'undefined'`
 *     and `typeof Notification !== 'undefined'` before touching the API.
 *
 * Reference:
 *   - MDN: Notifications API → https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API
 *
 * Author: Formula Atlas — feature #8
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationKind =
  | 'daily_brief'
  | 'frost_alert'
  | 'irrigation_reminder'
  | 'custom';

export interface ScheduledNotification {
  /** Stable unique id. */
  id: string;
  /** ISO date-time when the notification should fire (e.g. `2026-09-03T06:00:00.000Z`). */
  fireAt: string;
  /** Notification title (already localized by the caller). */
  title: string;
  /** Notification body (already localized by the caller). */
  body: string;
  /** Logical kind — used for grouping + deduplication. */
  kind: NotificationKind;
  /** If true, the notification will be re-scheduled for the same time tomorrow after firing. */
  recurringDaily?: boolean;
  /** Optional emoji prefix shown in the title. */
  emoji?: string;
  /** When the notification was created (ms epoch). */
  createdAt: number;
}

export type NotificationPermissionState =
  | 'default'
  | 'granted'
  | 'denied'
  | 'unsupported';

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'notification_scheduler_v1';
const SCHEDULE_DAILY_BRIEF_KEY = 'whatsapp_brief_schedule_daily_v1';

function isClient(): boolean {
  return typeof window !== 'undefined';
}

function hasNotificationApi(): boolean {
  return typeof window !== 'undefined' && typeof Notification !== 'undefined';
}

function readStore(): ScheduledNotification[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ScheduledNotification[];
  } catch {
    return [];
  }
}

function writeStore(items: ScheduledNotification[]): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    // Notify listeners (e.g., the widget) so the UI re-renders.
    window.dispatchEvent(new CustomEvent('notification-scheduler:changed'));
  } catch {
    /* ignore quota / privacy mode errors */
  }
}

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

export function getNotificationPermission(): NotificationPermissionState {
  if (!hasNotificationApi()) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

/**
 * Ask the user for permission to show notifications.
 * Returns the resulting permission state.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!hasNotificationApi()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const result = await Notification.requestPermission();
    return result as NotificationPermissionState;
  } catch {
    return 'denied';
  }
}

// ---------------------------------------------------------------------------
// Scheduling
// ---------------------------------------------------------------------------

function newId(): string {
  return `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Parse a "HH:MM" 24h time string into a Date for today (or tomorrow if
 * today's slot has already passed).
 */
function nextOccurrence(time: string, base: Date = new Date()): Date {
  const [h, m] = time.split(':').map((s) => parseInt(s, 10));
  const next = new Date(base);
  next.setHours(h ?? 6, m ?? 0, 0, 0);
  if (next.getTime() <= base.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

/**
 * Schedule a notification.
 *
 * @param time   Either an ISO date-time string (one-shot) or "HH:MM" 24h
 *               time string (interpreted as the next occurrence, optionally
 *               recurring daily).
 * @param title  Notification title (already localized).
 * @param body   Notification body (already localized).
 * @param opts   Optional: kind, recurringDaily, emoji.
 * @returns      The created ScheduledNotification, or null if running on
 *               the server.
 */
export function scheduleNotification(
  time: string,
  title: string,
  body: string,
  opts: { kind?: NotificationKind; recurringDaily?: boolean; emoji?: string } = {},
): ScheduledNotification | null {
  if (!isClient()) return null;

  let fireAtDate: Date;
  if (/^\d{4}-\d{2}-\d{2}T/.test(time)) {
    // Full ISO date-time.
    fireAtDate = new Date(time);
    if (isNaN(fireAtDate.getTime())) return null;
  } else {
    // "HH:MM" 24h time — resolve to the next occurrence.
    fireAtDate = nextOccurrence(time);
  }

  const item: ScheduledNotification = {
    id: newId(),
    fireAt: fireAtDate.toISOString(),
    title,
    body,
    kind: opts.kind ?? 'custom',
    recurringDaily: opts.recurringDaily ?? false,
    emoji: opts.emoji,
    createdAt: Date.now(),
  };

  const items = readStore();
  // De-duplicate recurring daily reminders of the same kind.
  if (item.recurringDaily) {
    const dupeIdx = items.findIndex(
      (i) => i.kind === item.kind && i.recurringDaily,
    );
    if (dupeIdx >= 0) {
      items[dupeIdx] = item;
      writeStore(items);
      return item;
    }
  }
  items.push(item);
  writeStore(items);
  return item;
}

/**
 * Return all pending (not yet fired) scheduled notifications, sorted by
 * fire time ascending.
 */
export function getScheduledNotifications(): ScheduledNotification[] {
  return readStore()
    .filter((i) => new Date(i.fireAt).getTime() > Date.now() - 60_000)
    .sort((a, b) => new Date(a.fireAt).getTime() - new Date(b.fireAt).getTime());
}

/**
 * Cancel a scheduled notification by id.
 */
export function cancelNotification(id: string): void {
  const items = readStore().filter((i) => i.id !== id);
  writeStore(items);
}

/**
 * Cancel every scheduled notification (used by tests / "Clear all" button).
 */
export function clearAllNotifications(): void {
  writeStore([]);
}

// ---------------------------------------------------------------------------
// Firing
// ---------------------------------------------------------------------------

function fireNotification(item: ScheduledNotification): void {
  if (!hasNotificationApi()) return;
  if (Notification.permission !== 'granted') return;
  try {
    const title = item.emoji ? `${item.emoji} ${item.title}` : item.title;
    const n = new Notification(title, {
      body: item.body,
      tag: item.id,
      // 8 seconds — long enough to read, short enough not to annoy.
      // `silent: false` keeps the OS default sound.
    });
    // Auto-close after 10 seconds (some browsers keep notifications until clicked).
    setTimeout(() => {
      try { n.close(); } catch { /* ignore */ }
    }, 10_000);
  } catch {
    /* Some browsers throw if the document is not focused; ignore. */
  }
}

/**
 * Check every scheduled notification and fire any that are due.
 * Recurring daily notifications are re-scheduled for tomorrow after firing.
 *
 * Safe to call from the server (no-op).
 *
 * @returns The number of notifications fired this pass.
 */
export function checkAndFireNotifications(): number {
  if (!isClient()) return 0;
  const now = Date.now();
  const items = readStore();
  if (items.length === 0) return 0;

  let fired = 0;
  const remaining: ScheduledNotification[] = [];

  for (const item of items) {
    const fireTime = new Date(item.fireAt).getTime();
    if (isNaN(fireTime)) continue;

    if (fireTime <= now) {
      // Due — fire it.
      fireNotification(item);
      fired++;

      if (item.recurringDaily) {
        // Re-schedule for tomorrow at the same local time.
        const next = new Date(item.fireAt);
        next.setDate(next.getDate() + 1);
        remaining.push({ ...item, fireAt: next.toISOString() });
      }
      // One-shot notifications are dropped after firing.
    } else {
      remaining.push(item);
    }
  }

  if (fired > 0) {
    writeStore(remaining);
  }
  return fired;
}

// ---------------------------------------------------------------------------
// Background polling (60s)
// ---------------------------------------------------------------------------

let pollHandle: ReturnType<typeof setInterval> | null = null;

/**
 * Start the 60-second background poll that fires due notifications.
 * Idempotent — calling it again while a poll is running is a no-op.
 *
 * Call this once on app load (e.g., from the NotificationSchedulerWidget's
 * useEffect).
 */
export function startNotificationPolling(): () => void {
  if (!isClient()) return () => { /* no-op on server */ };
  if (pollHandle != null) return () => stopNotificationPolling();

  // Fire immediately (in case the page was reloaded mid-window) and then
  // every 60 seconds.
  checkAndFireNotifications();
  pollHandle = setInterval(() => {
    checkAndFireNotifications();
  }, 60_000);

  return () => stopNotificationPolling();
}

export function stopNotificationPolling(): void {
  if (pollHandle != null) {
    clearInterval(pollHandle);
    pollHandle = null;
  }
}

// ---------------------------------------------------------------------------
// WhatsApp Daily Brief — "Schedule Daily" toggle
// ---------------------------------------------------------------------------

export interface DailyBriefSchedule {
  enabled: boolean;
  time: string;          // "HH:MM" 24h
  language: 'en' | 'fr' | 'ar';
  updatedAt: number;
}

/**
 * Save the "Schedule Daily Brief" toggle to localStorage.
 *
 * When enabled, schedules a recurring daily notification at the given time
 * using the user's selected language. The notification body is generic
 * ("Today's farm brief is ready") — opening the app shows the full brief.
 */
export function setDailyBriefSchedule(opts: {
  enabled: boolean;
  time?: string;
  language?: 'en' | 'fr' | 'ar';
}): DailyBriefSchedule {
  const defaultTime = '06:00';
  const existing = getDailyBriefSchedule();
  const time = opts.time ?? existing.time ?? defaultTime;
  const language = opts.language ?? existing.language ?? 'en';
  const schedule: DailyBriefSchedule = {
    enabled: opts.enabled,
    time,
    language,
    updatedAt: Date.now(),
  };

  if (isClient()) {
    try {
      localStorage.setItem(SCHEDULE_DAILY_BRIEF_KEY, JSON.stringify(schedule));
      window.dispatchEvent(new CustomEvent('notification-scheduler:changed'));
    } catch { /* ignore */ }

    // Always remove any existing daily_brief reminder to avoid dupes.
    const items = readStore().filter((i) => i.kind !== 'daily_brief');

    if (schedule.enabled) {
      const fireAt = nextOccurrence(time);
      const bodyByLang: Record<'en' | 'fr' | 'ar', string> = {
        en: 'Tap to view your weather, irrigation, and task plan for today.',
        fr: 'Appuyez pour voir la météo, l\u2019irrigation et les tâches du jour.',
        ar: 'اضغط لعرض الطقس والري ومهام اليوم.',
      };
      const titleByLang: Record<'en' | 'fr' | 'ar', string> = {
        en: 'Today\u2019s farm brief is ready',
        fr: 'Votre brief quotidien est prêt',
        ar: 'ملخّص المزرعة اليومي جاهز',
      };
      items.push({
        id: 'daily_brief_recurring',
        fireAt: fireAt.toISOString(),
        title: titleByLang[language],
        body: bodyByLang[language],
        kind: 'daily_brief',
        recurringDaily: true,
        emoji: '🟢',
        createdAt: Date.now(),
      });
    }
    writeStore(items);
  }

  return schedule;
}

export function getDailyBriefSchedule(): DailyBriefSchedule {
  if (!isClient()) {
    return { enabled: false, time: '06:00', language: 'en', updatedAt: 0 };
  }
  try {
    const raw = localStorage.getItem(SCHEDULE_DAILY_BRIEF_KEY);
    if (!raw) return { enabled: false, time: '06:00', language: 'en', updatedAt: 0 };
    const parsed = JSON.parse(raw);
    return {
      enabled: Boolean(parsed?.enabled),
      time: typeof parsed?.time === 'string' ? parsed.time : '06:00',
      language: ['en', 'fr', 'ar'].includes(parsed?.language) ? parsed.language : 'en',
      updatedAt: Number(parsed?.updatedAt ?? 0),
    };
  } catch {
    return { enabled: false, time: '06:00', language: 'en', updatedAt: 0 };
  }
}
