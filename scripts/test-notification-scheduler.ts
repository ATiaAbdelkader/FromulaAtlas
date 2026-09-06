/**
 * Notification Scheduler tests (Feature #8)
 *
 * Verifies the client-side notification scheduler at
 * src/lib/notification-scheduler.ts:
 *
 *   1. SSR safety — every public function is a no-op (or returns a sensible
 *      default) when `window` is undefined.
 *   2. scheduleNotification() — adds to store, returns item with stable id,
 *      parses both "HH:MM" and full ISO date-time strings.
 *   3. Recurring daily reminders — deduplicates by kind, reschedules for
 *      tomorrow after firing.
 *   4. getScheduledNotifications() — sorted ascending by fireAt, excludes
 *      items past their fire time (with 60s grace window).
 *   5. cancelNotification() + clearAllNotifications().
 *   6. checkAndFireNotifications() — fires due, re-schedules recurring,
 *      drops one-shot.
 *   7. Daily Brief schedule — set/get/toggle, removes kind='daily_brief'
 *      items when disabled.
 *
 * The scheduler is pure logic + localStorage, so we mock a minimal
 * `window` + `localStorage` + `Notification` global.
 *
 * Run:  npm run test:domain   (or)   npx tsx scripts/test-notification-scheduler.ts
 */
import assert from 'node:assert/strict';
import {
  scheduleNotification,
  getScheduledNotifications,
  cancelNotification,
  clearAllNotifications,
  checkAndFireNotifications,
  startNotificationPolling,
  stopNotificationPolling,
  getNotificationPermission,
  requestNotificationPermission,
  setDailyBriefSchedule,
  getDailyBriefSchedule,
} from '../src/lib/notification-scheduler';

// Storage keys used by the scheduler (must match the unexported consts in
// notification-scheduler.ts — if those change, update these).
const SCHEDULER_STORAGE_KEY = 'notification_scheduler_v1';
const BRIEF_STORAGE_KEY = 'whatsapp_brief_schedule_daily_v1';

// ---------------------------------------------------------------------------
// Minimal browser mock — localStorage + window + Notification
// ---------------------------------------------------------------------------

class FakeLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null { return this.store[key] ?? null; }
  setItem(key: string, value: string): void { this.store[key] = value; }
  removeItem(key: string): void { delete this.store[key]; }
  clear(): void { this.store = {}; }
}

class FakeNotification {
  static permission: NotificationPermission = 'default';
  static requestPermissionResult: NotificationPermission = 'granted';
  static instances: FakeNotification[] = [];
  title: string;
  options: NotificationOptions;
  tag: string;
  constructor(title: string, options?: NotificationOptions) {
    this.title = title;
    this.options = options ?? {};
    this.tag = options?.tag ?? '';
    FakeNotification.instances.push(this);
  }
  close(): void { /* noop */ }
  static requestPermission(): Promise<NotificationPermission> {
    FakeNotification.permission = FakeNotification.requestPermissionResult;
    return Promise.resolve(FakeNotification.requestPermissionResult);
  }
}

interface MockWindow {
  localStorage: FakeLocalStorage;
  Notification: typeof FakeNotification;
  dispatchEvent(ev: Event): boolean;
  setInterval: typeof setInterval;
  clearInterval: typeof clearInterval;
}

function installMockWindow(): FakeLocalStorage {
  const ls = new FakeLocalStorage();
  FakeNotification.instances.length = 0;
  FakeNotification.permission = 'granted'; // default to granted for most tests
  const listeners: EventListener[] = [];
  const mockWindow: MockWindow = {
    localStorage: ls,
    Notification: FakeNotification,
    dispatchEvent(ev: Event) {
      for (const l of listeners) l(ev);
      return true;
    },
    setInterval: (fn, ms) => setInterval(fn, ms),
    clearInterval: (h) => clearInterval(h),
  };
  (globalThis as { window?: unknown }).window = mockWindow as unknown as Window & typeof globalThis;
  // The scheduler accesses `localStorage` and `Notification` as bare globals
  // (NOT as `window.localStorage`), so we need to expose them on globalThis too.
  (globalThis as { localStorage?: unknown }).localStorage = ls;
  (globalThis as { Notification?: unknown }).Notification = FakeNotification;
  return ls;
}

function uninstallMockWindow() {
  delete (globalThis as { window?: unknown }).window;
  delete (globalThis as { localStorage?: unknown }).localStorage;
  delete (globalThis as { Notification?: unknown }).Notification;
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

let pass = 0;
let fail = 0;

function ok(label: string, cond: boolean, detail?: string) {
  if (cond) { pass++; }
  else {
    console.error(`  ✗ ${label}${detail ? ': ' + detail : ''}`);
    fail++;
  }
}

function withMockWindow<T>(label: string, fn: () => T): T | undefined {
  installMockWindow();
  try {
    return fn();
  } catch (e) {
    console.error(`  ✗ ${label} threw: ${e instanceof Error ? e.message : e}`);
    fail++;
    return undefined;
  } finally {
    uninstallMockWindow();
  }
}

// ---------------------------------------------------------------------------
// Test 1: SSR safety — all functions no-op without window
// ---------------------------------------------------------------------------

console.log('Test 1: SSR safety');
uninstallMockWindow();
{
  let threw = false;
  try {
    scheduleNotification('06:00', 'T', 'B');
    getScheduledNotifications();
    cancelNotification('x');
    clearAllNotifications();
    checkAndFireNotifications();
    startNotificationPolling();
    stopNotificationPolling();
    setDailyBriefSchedule({ enabled: false });
    getDailyBriefSchedule();
    getNotificationPermission();
  } catch (e) {
    threw = true;
    console.error(`  ✗ SSR safety failed: ${e instanceof Error ? e.message : e}`);
    fail++;
  }
  if (!threw) {
    pass++;
    console.log('  ✓ All public functions are SSR-safe');
  }
  // getNotificationPermission should return 'unsupported' without window
  ok('getNotificationPermission returns "unsupported" without window', getNotificationPermission() === 'unsupported');
  // getDailyBriefSchedule should return defaults without window
  const def = getDailyBriefSchedule();
  ok('SSR getDailyBriefSchedule returns defaults', def.enabled === false && def.time === '06:00' && def.language === 'en');
}

// ---------------------------------------------------------------------------
// Test 2: scheduleNotification — basic add + return shape
// ---------------------------------------------------------------------------

console.log('Test 2: scheduleNotification basic');
withMockWindow('basic schedule', () => {
  const item = scheduleNotification('07:30', 'Test Title', 'Test Body', { kind: 'custom', emoji: '🚜' });
  ok('returns ScheduledNotification', item !== null);
  if (item) {
    ok('has stable id', typeof item.id === 'string' && item.id.length > 0);
    ok('has fireAt ISO', /^\d{4}-\d{2}-\d{2}T/.test(item.fireAt));
    ok('title set', item.title === 'Test Title');
    ok('body set', item.body === 'Test Body');
    ok('kind set', item.kind === 'custom');
    ok('emoji set', item.emoji === '🚜');
    ok('createdAt is recent', Date.now() - item.createdAt < 5000);
  }
  // Stored
  const pending = getScheduledNotifications();
  ok('pending list has 1 item', pending.length === 1, `length=${pending.length}`);
  ok('pending list returns same id', pending[0]?.id === item?.id);
});

// ---------------------------------------------------------------------------
// Test 3: scheduleNotification — recurring daily dedup
// ---------------------------------------------------------------------------

console.log('Test 3: recurring daily dedup');
withMockWindow('recurring dedup', () => {
  const a = scheduleNotification('06:00', 'A', 'a', { kind: 'daily_brief', recurringDaily: true });
  const b = scheduleNotification('07:00', 'B', 'b', { kind: 'daily_brief', recurringDaily: true });
  const pending = getScheduledNotifications();
  ok('only one daily_brief exists after re-schedule', pending.filter(p => p.kind === 'daily_brief').length === 1);
  ok('the second schedule wins (id matches b)', pending[0]?.id === b?.id);
  ok('the second schedule time wins (07:00)', pending[0]?.title === 'B');
});

// ---------------------------------------------------------------------------
// Test 4: getScheduledNotifications — sorted + excludes past (with grace)
// ---------------------------------------------------------------------------

console.log('Test 4: getScheduledNotifications sort + grace');
withMockWindow('sort + grace', () => {
  // Schedule 3 with different ISO times (one in the past beyond grace)
  const past = new Date(Date.now() - 5 * 60_000).toISOString();  // 5 min ago, beyond grace
  const soon = new Date(Date.now() + 5 * 60_000).toISOString();  // 5 min in future
  const later = new Date(Date.now() + 60 * 60_000).toISOString(); // 1h in future
  scheduleNotification(past, 'Past', 'p');
  scheduleNotification(later, 'Later', 'l');
  scheduleNotification(soon, 'Soon', 's');
  const pending = getScheduledNotifications();
  ok('past (beyond 60s grace) excluded', !pending.some(p => p.title === 'Past'));
  ok('remaining 2 sorted ascending', pending.length === 2 && pending[0].title === 'Soon' && pending[1].title === 'Later');
});

// ---------------------------------------------------------------------------
// Test 5: cancelNotification + clearAllNotifications
// ---------------------------------------------------------------------------

console.log('Test 5: cancel + clear');
withMockWindow('cancel + clear', () => {
  const a = scheduleNotification('08:00', 'A', 'a');
  const b = scheduleNotification('09:00', 'B', 'b');
  ok('2 items scheduled', getScheduledNotifications().length === 2);
  cancelNotification(a!.id);
  ok('after cancel: 1 item remains', getScheduledNotifications().length === 1);
  ok('after cancel: surviving item is B', getScheduledNotifications()[0]?.id === b?.id);
  clearAllNotifications();
  ok('after clear: 0 items', getScheduledNotifications().length === 0);
});

// ---------------------------------------------------------------------------
// Test 6: checkAndFireNotifications — fires due, reschedules recurring
// ---------------------------------------------------------------------------

console.log('Test 6: checkAndFireNotifications');
withMockWindow('fire + reschedule', () => {
  FakeNotification.instances.length = 0;
  // One-shot past (within grace — should fire but not re-schedule)
  const oneShotPast = new Date(Date.now() - 30_000).toISOString(); // 30s ago, within grace
  scheduleNotification(oneShotPast, 'OneShot', 'one');
  // Recurring past
  const recurringPast = new Date(Date.now() - 30_000).toISOString();
  scheduleNotification(recurringPast, 'Recur', 'rec', { kind: 'irrigation_reminder', recurringDaily: true });

  const fired = checkAndFireNotifications();
  ok('fired count = 2', fired === 2, `fired=${fired}`);
  ok('Notification instances = 2', FakeNotification.instances.length === 2);
  // One-shot should be dropped; recurring should be rescheduled to tomorrow
  const pending = getScheduledNotifications();
  ok('1 item remains (recurring rescheduled)', pending.length === 1);
  ok('rescheduled item is the recurring one', pending[0]?.title === 'Recur');
  // Verify it was rescheduled to ~24h from original fireAt
  const origTime = new Date(recurringPast).getTime();
  const newTime = new Date(pending[0].fireAt).getTime();
  const diffH = (newTime - origTime) / (60 * 60 * 1000);
  ok('rescheduled to ~24h later', Math.abs(diffH - 24) < 1, `diffH=${diffH}`);
});

// ---------------------------------------------------------------------------
// Test 7: checkAndFireNotifications — does NOT fire future items
// ---------------------------------------------------------------------------

console.log('Test 7: future items not fired');
withMockWindow('future not fired', () => {
  FakeNotification.instances.length = 0;
  scheduleNotification(new Date(Date.now() + 60 * 60_000).toISOString(), 'Future', 'f');
  const fired = checkAndFireNotifications();
  ok('fired = 0', fired === 0);
  ok('Notification instances = 0', FakeNotification.instances.length === 0);
  ok('item still pending', getScheduledNotifications().length === 1);
});

// ---------------------------------------------------------------------------
// Test 8: Daily Brief schedule — set/get/toggle
// ---------------------------------------------------------------------------

console.log('Test 8: Daily Brief schedule');
withMockWindow('daily brief', () => {
  // Default state
  const def = getDailyBriefSchedule();
  ok('default: disabled', def.enabled === false);
  ok('default: time 06:00', def.time === '06:00');
  ok('default: language en', def.language === 'en');

  // Enable
  const enabled = setDailyBriefSchedule({ enabled: true, time: '07:30', language: 'fr' });
  ok('enable returns enabled=true', enabled.enabled === true);
  ok('enable returns time=07:30', enabled.time === '07:30');
  ok('enable returns language=fr', enabled.language === 'fr');

  // Read back
  const read = getDailyBriefSchedule();
  ok('read back enabled=true', read.enabled === true);
  ok('read back time=07:30', read.time === '07:30');
  ok('read back language=fr', read.language === 'fr');

  // A daily_brief notification should be in the store
  const pending = getScheduledNotifications();
  const brief = pending.find(p => p.kind === 'daily_brief');
  ok('daily_brief item present in store', brief !== undefined);
  if (brief) {
    ok('brief is recurring daily', brief.recurringDaily === true);
    ok('brief title is French', brief.title.includes('prêt'));
    ok('brief body is French', brief.body.includes('météo'));
  }

  // Disable
  setDailyBriefSchedule({ enabled: false });
  const after = getDailyBriefSchedule();
  ok('after disable: enabled=false', after.enabled === false);
  const pendingAfter = getScheduledNotifications();
  ok('after disable: no daily_brief in store', !pendingAfter.some(p => p.kind === 'daily_brief'));
});

// ---------------------------------------------------------------------------
// Test 9: Daily Brief — language switching updates the notification body
// ---------------------------------------------------------------------------

console.log('Test 9: Daily Brief language switching');
withMockWindow('brief lang switch', () => {
  setDailyBriefSchedule({ enabled: true, language: 'ar' });
  let brief = getScheduledNotifications().find(p => p.kind === 'daily_brief');
  ok('AR brief title contains Arabic', brief !== undefined && /[\u0600-\u06FF]/.test(brief.title));
  ok('AR brief body contains Arabic', brief !== undefined && /[\u0600-\u06FF]/.test(brief.body));

  setDailyBriefSchedule({ enabled: true, language: 'en' });
  brief = getScheduledNotifications().find(p => p.kind === 'daily_brief');
  ok('EN brief title is English', brief !== undefined && /Today|farm brief/i.test(brief.title));
});

// ---------------------------------------------------------------------------
// Test 10: Permission denied — no notification fires
// ---------------------------------------------------------------------------

console.log('Test 10: permission denied');
withMockWindow('permission denied', () => {
  FakeNotification.permission = 'denied';
  FakeNotification.instances.length = 0;
  scheduleNotification(new Date(Date.now() - 30_000).toISOString(), 'X', 'x');
  const fired = checkAndFireNotifications();
  // `fired` counts due items (regardless of permission); what we care about is
  // that no Notification instance was actually created.
  ok('due item processed', fired === 1, `fired=${fired}`);
  ok('no Notification instances created (permission denied)', FakeNotification.instances.length === 0);
});

// ---------------------------------------------------------------------------
// Test 11: startNotificationPolling — returns cleanup, idempotent
// ---------------------------------------------------------------------------

console.log('Test 11: startNotificationPolling');
withMockWindow('polling', () => {
  const cleanup1 = startNotificationPolling();
  ok('cleanup is a function', typeof cleanup1 === 'function');
  const cleanup2 = startNotificationPolling(); // should be no-op (idempotent)
  ok('second start returns cleanup', typeof cleanup2 === 'function');
  cleanup1();
  // Calling cleanup2 should also be safe (no-op since polling already stopped)
  cleanup2();
  pass++;
});

// ---------------------------------------------------------------------------
// Test 12: localStorage persistence — survives "page reload"
// ---------------------------------------------------------------------------

console.log('Test 12: localStorage persistence');
{
  const ls = installMockWindow();
  try {
    scheduleNotification('08:00', 'Persist', 'p');
    // Simulate reload by clearing in-memory state but keeping localStorage
    const raw = ls.getItem(SCHEDULER_STORAGE_KEY);
    ok('localStorage has the schedule', raw !== null && raw.includes('Persist'));
    // Re-install with same localStorage
    const pending = getScheduledNotifications();
    ok('item is read back from localStorage', pending.length === 1 && pending[0].title === 'Persist');
  } finally {
    uninstallMockWindow();
  }
}

// ---------------------------------------------------------------------------
// Test 13: requestNotificationPermission
// ---------------------------------------------------------------------------

console.log('Test 13: requestNotificationPermission');
// Wrap in IIFE so we can use top-level await without "top-level await" syntax
(async () => {
  installMockWindow();
  try {
    FakeNotification.permission = 'default';
    FakeNotification.requestPermissionResult = 'granted';
    const result = await requestNotificationPermission();
    ok('returns granted', result === 'granted');
    ok('Notification.permission updated to granted', FakeNotification.permission === 'granted');

    // Already granted → returns immediately
    const result2 = await requestNotificationPermission();
    if (result2 !== 'granted') {
      console.error(`  ✗ already-granted returns granted: got '${result2}' (Notification.permission=${FakeNotification.permission}, hasApi=${typeof Notification !== 'undefined'})`);
      fail++;
    } else {
      pass++;
    }
  } finally {
    uninstallMockWindow();
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------

  console.log(`\nNotification scheduler tests: ${pass} passed, ${fail} failed`);
  if (fail > 0) {
    process.exit(1);
  }
})();
